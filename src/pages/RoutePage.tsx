// src/pages/RoutesPage.tsx
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StatusBadge from '../components/StatusBadge';
import { MapPin, Search, Truck, Train, Plane, TrendingUp, Clock, AlertTriangle, Package } from 'lucide-react';
import type { RiskLevel, ShipmentStatus } from '../lib/constants';
import { getLatestAnalysis, supabase, type SupabaseAnalysis } from '../lib/supabase';

// ─── City coords — covers all cities in constants.ts ─────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  Mumbai:      [19.076,   72.8777],
  Delhi:       [28.6139,  77.2090],
  Bangalore:   [12.9716,  77.5946],
  Chennai:     [13.0827,  80.2707],
  Hyderabad:   [17.3850,  78.4867],
  Kolkata:     [22.5726,  88.3639],
  Pune:        [18.5204,  73.8567],
  Ahmedabad:   [23.0225,  72.5714],
  Surat:       [21.1702,  72.8311],
  Jaipur:      [26.9124,  75.7873],
  Lucknow:     [26.8467,  80.9462],
  Nagpur:      [21.1458,  79.0882],
  Indore:      [22.7196,  75.8577],
  Bhopal:      [23.2599,  77.4126],
  Chandigarh:  [30.7333,  76.7794],
  Kochi:       [9.9312,   76.2673],
  Goa:         [15.2993,  74.1240],
  Bhubaneswar: [20.2961,  85.8245],
  Patna:       [25.5941,  85.1376],
  Coimbatore:  [11.0168,  76.9558],
  Gujarat:     [23.0225,  72.5714],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parses "Rail route from Kochi to Jaipur" → { origin: "Kochi", destination: "Jaipur" }
 * Also handles "Mumbai → Chennai" arrow-style strings.
 */
function parseOriginDest(best_route: string): { origin: string; destination: string } {
  if (!best_route) return { origin: '', destination: '' };

  // Pattern 1: "... from CityA to CityB"
  const fromTo = best_route.match(/from\s+([A-Za-z\s]+?)\s+to\s+([A-Za-z\s]+?)(?:\s*[,.]|$)/i);
  if (fromTo) return { origin: fromTo[1].trim(), destination: fromTo[2].trim() };

  // Pattern 2: "CityA → CityB" or "CityA - CityB"
  const arrow = best_route.match(/([A-Za-z\s]+?)\s*[→\-–]\s*([A-Za-z\s]+)/);
  if (arrow) return { origin: arrow[1].trim(), destination: arrow[2].trim() };

  return { origin: '', destination: '' };
}

/** Returns the canonical CITY_COORDS key that matches name (case-insensitive) */
function resolveCity(name: string): string {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  return Object.keys(CITY_COORDS).find(k => k.toLowerCase() === lower) ?? name;
}

function getRouteMode(result: SupabaseAnalysis['result']): string {
  const rm = (result as any).recommended_mode ?? '';
  if (rm) {
    if (rm.toUpperCase().includes('RAIL')) return 'Rail';
    if (rm.toUpperCase().includes('AIR'))  return 'Air';
    if (rm.toUpperCase().includes('ROAD')) return 'Road';
  }
  const br = typeof result.best_route === 'string' ? result.best_route : '';
  if (br.toLowerCase().includes('rail')) return 'Rail';
  if (br.toLowerCase().includes('air'))  return 'Air';
  return 'Road';
}

function getRouteLabel(result: SupabaseAnalysis['result']): string {
  const br = result.best_route;
  if (!br) return '—';
  if (typeof br === 'string') return br;
  const o = br as any;
  return [o.mode, o.distance_km ? `${o.distance_km} km` : null, o.estimated_time_hours ? `${o.estimated_time_hours} hrs` : null].filter(Boolean).join(' · ');
}

// ─── Static fallback routes ───────────────────────────────────────────────────
const staticRoutes = [
  { from: 'Mumbai',    to: 'Chennai',   mode: 'Road', dist: '1,377 km', time: '18 hrs',  cost: '₹55,000',   risk: 'LOW'    as RiskLevel, status: 'ON TIME'  as ShipmentStatus },
  { from: 'Delhi',     to: 'Mumbai',    mode: 'Rail', dist: '1,384 km', time: '24 hrs',  cost: '₹32,000',   risk: 'LOW'    as RiskLevel, status: 'ON TIME'  as ShipmentStatus },
  { from: 'Bangalore', to: 'Kolkata',   mode: 'Air',  dist: '1,871 km', time: '3 hrs',   cost: '₹2,10,000', risk: 'LOW'    as RiskLevel, status: 'ON TIME'  as ShipmentStatus },
  { from: 'Hyderabad', to: 'Delhi',     mode: 'Road', dist: '1,500 km', time: '22 hrs',  cost: '₹62,000',   risk: 'MEDIUM' as RiskLevel, status: 'DELAYED'  as ShipmentStatus },
  { from: 'Chennai',   to: 'Ahmedabad', mode: 'Rail', dist: '1,950 km', time: '36 hrs',  cost: '₹48,000',   risk: 'HIGH'   as RiskLevel, status: 'AT RISK'  as ShipmentStatus },
  { from: 'Kolkata',   to: 'Bangalore', mode: 'Air',  dist: '1,870 km', time: '3.5 hrs', cost: '₹1,95,000', risk: 'LOW'    as RiskLevel, status: 'ON TIME'  as ShipmentStatus },
  { from: 'Ahmedabad', to: 'Hyderabad', mode: 'Road', dist: '1,020 km', time: '15 hrs',  cost: '₹41,000',   risk: 'LOW'    as RiskLevel, status: 'ON TIME'  as ShipmentStatus },
  { from: 'Goa',       to: 'Mumbai',    mode: 'Road', dist: '594 km',   time: '9 hrs',   cost: '₹22,000',   risk: 'MEDIUM' as RiskLevel, status: 'DELAYED'  as ShipmentStatus },
];

const cityStats = [
  { city: 'Mumbai',    lanes: 4, onTime: 96, delayed: 0 },
  { city: 'Delhi',     lanes: 3, onTime: 91, delayed: 1 },
  { city: 'Bangalore', lanes: 3, onTime: 94, delayed: 0 },
  { city: 'Chennai',   lanes: 2, onTime: 78, delayed: 1 },
  { city: 'Hyderabad', lanes: 2, onTime: 88, delayed: 1 },
  { city: 'Kolkata',   lanes: 2, onTime: 93, delayed: 0 },
  { city: 'Ahmedabad', lanes: 2, onTime: 97, delayed: 0 },
  { city: 'Goa',       lanes: 1, onTime: 82, delayed: 1 },
];

// ─── Style constants ──────────────────────────────────────────────────────────
const riskVariant:   Record<RiskLevel,      'success' | 'warning' | 'danger'> = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' };
const statusVariant: Record<ShipmentStatus, 'success' | 'warning' | 'danger'> = { 'ON TIME': 'success', 'DELAYED': 'warning', 'AT RISK': 'danger' };
const riskHex = (r: RiskLevel) => r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';
const modeIcon:  Record<string, React.ReactNode> = { Road: <Truck size={14} />, Rail: <Train size={14} />, Air: <Plane size={14} /> };
const modeBg:    Record<string, string> = { Road: 'rgba(249,115,22,0.08)', Rail: 'rgba(59,130,246,0.08)', Air: 'rgba(139,92,246,0.08)' };
const modeColor: Record<string, string> = { Road: '#F97316', Rail: '#3B82F6', Air: '#8B5CF6' };
const tableHeaders = ['Route', 'Mode', 'Distance', 'Est. Time', 'Cost', 'Risk', 'Status'];
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 20, transition: 'all 0.25s ease' };

// ─── Leaflet icon setup ───────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makeIcon = (color: string, emoji: string) => L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;font-size:17px;">${emoji}</div>`,
  iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24],
});

const makeLiveSupplierIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;">
      <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);border:3px solid #fff;box-shadow:0 4px 16px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;position:relative;z-index:2;">🚛</div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:rgba(16,185,129,0.25);animation:ripple 1.5s infinite;z-index:1;"></div>
    </div>
    <div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);background:#10B981;color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:99px;white-space:nowrap;box-shadow:0 2px 8px rgba(16,185,129,0.4);">🔴 LIVE</div>
    <style>@keyframes ripple{0%{transform:translate(-50%,-50%) scale(0.8);opacity:1}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}</style>
  `,
  iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -30],
});

const makeTruckIcon = (from: [number, number], to: [number, number]) => {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]) * (180 / Math.PI);
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#F97316,#EA580C);border:2px solid #fff;box-shadow:0 3px 10px rgba(249,115,22,0.6);display:flex;align-items:center;justify-content:center;font-size:13px;transform:rotate(${angle}deg);">🚛</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });
};

// ─── Map utils ────────────────────────────────────────────────────────────────
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) map.fitBounds(L.latLngBounds(coords), { padding: [70, 70] });
  }, [coords, map]);
  return null;
}

function AnimatedTruck({ path }: { path: [number, number][] }) {
  const [pos,    setPos]    = useState<[number, number]>(path[0]);
  const [segIdx, setSegIdx] = useState(0);
  const rafRef              = useRef<number>(0);

  useEffect(() => {
    if (path.length < 2) return;
    let seg = 0, t = 0;
    const SPEED = 0.0025;
    const animate = () => {
      t += SPEED;
      if (t >= 1) { t = 0; seg = (seg + 1) % (path.length - 1); }
      const f = path[seg], e = path[seg + 1];
      setPos([f[0] + (e[0] - f[0]) * t, f[1] + (e[1] - f[1]) * t]);
      setSegIdx(seg);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [path]);

  const from = path[segIdx]     ?? path[0];
  const to   = path[segIdx + 1] ?? path[path.length - 1];
  return <Marker position={pos} icon={makeTruckIcon(from, to)} zIndexOffset={500} />;
}

function interpolatePath(from: [number, number], to: [number, number]): [number, number][] {
  const steps  = 80;
  const midLat = (from[0] + to[0]) / 2 + 1.2;
  const midLng = (from[1] + to[1]) / 2 - 0.8;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return [
      (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * midLat + t * t * to[0],
      (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * midLng + t * t * to[1],
    ] as [number, number];
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveDelivery {
  id:            string;
  supplier_name: string;
  supplier_lat:  number;
  supplier_lng:  number;
  status:        string;
  updated_at:    string;
  analysis_id:   string | null;
}

// ─── Cost Breakdown Bar ───────────────────────────────────────────────────────
function CostBreakdownBar({ result }: { result: SupabaseAnalysis['result'] }) {
  const rcb = (result as any).real_cost_breakdown;
  if (!rcb?.all_modes) return null;

  const recommended = ((result as any).recommended_mode ?? '').toUpperCase();
  const modes = [
    { label: 'Road', val: rcb.all_modes.road ?? 0, color: '#F97316', icon: <Truck size={13} />, time: rcb.road?.time_hrs },
    { label: 'Rail', val: rcb.all_modes.rail ?? 0, color: '#3B82F6', icon: <Train size={13} />, time: rcb.rail?.time_hrs },
    { label: 'Air',  val: rcb.all_modes.air  ?? 0, color: '#8B5CF6', icon: <Plane size={13} />, time: rcb.air?.time_hrs  },
  ];
  const max = Math.max(...modes.map(m => m.val), 1);

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Package size={15} color="#F97316" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Mode Cost Comparison</span>
        {rcb.distance_km && (
          <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>
            · {rcb.distance_km.toLocaleString('en-IN')} km · Cheapest: {rcb.cheapest_mode} · Fastest: {rcb.fastest_mode}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {modes.map(m => {
          const pct    = Math.round((m.val / max) * 100);
          const isRec  = recommended.includes(m.label.toUpperCase());
          return (
            <div key={m.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: m.color }}>{m.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{m.label}</span>
                  {m.time && <span style={{ fontSize: 11, color: '#94A3B8' }}>{m.time} hrs</span>}
                  {isRec && (
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(16,185,129,0.12)', color: '#10B981', padding: '1px 7px', borderRadius: 99 }}>
                      ✓ AI Pick
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: m.color }}>
                  ₹{m.val.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: 99, transition: 'width 0.7s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Route Map Component ──────────────────────────────────────────────────────
function RouteMap({ latest, liveDeliveries, origin, destination }: {
  latest:         SupabaseAnalysis | null;
  liveDeliveries: LiveDelivery[];
  origin:         string;
  destination:    string;
}) {
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [loading,   setLoading]   = useState(false);

  const originCoord = CITY_COORDS[origin]      ?? CITY_COORDS['Mumbai'];
  const destCoord   = CITY_COORDS[destination] ?? CITY_COORDS['Chennai'];
  const riskColor   = latest ? riskHex(latest.result.overall_risk as RiskLevel) : '#10B981';
  const mode        = latest ? getRouteMode(latest.result) : 'Road';

  useEffect(() => {
    if (!origin || !destination) return;
    setLoading(true);
    const ORS_KEY = (import.meta as any).env?.VITE_OPENROUTE_API_KEY ?? '';
    if (ORS_KEY) {
      fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
        method:  'POST',
        headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: [[originCoord[1], originCoord[0]], [destCoord[1], destCoord[0]]],
        }),
      })
        .then(r => r.json())
        .then(data => {
          const coords = data?.features?.[0]?.geometry?.coordinates;
          setRoutePath(
            coords?.length > 0
              ? coords.map(([lng, lat]: [number, number]) => [lat, lng])
              : interpolatePath(originCoord, destCoord),
          );
        })
        .catch(() => setRoutePath(interpolatePath(originCoord, destCoord)))
        .finally(() => setLoading(false));
    } else {
      setRoutePath(interpolatePath(originCoord, destCoord));
      setLoading(false);
    }
  }, [origin, destination]);

  return (
    <div style={{ ...card, marginBottom: 24, padding: 0, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.1)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={16} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>🗺️ Live Route Map</p>
            <p style={{ fontSize: 11, color: '#94A3B8' }}>
              {latest ? `${origin} → ${destination} · AI Optimized Route` : 'Run Analysis to see live route on map'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {liveDeliveries.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 7, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', gap: 5 }}>
              🔴 {liveDeliveries.length} Live
            </span>
          )}
          {loading && (
            <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
              Fetching route...
            </span>
          )}
          {latest && (
            <>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 7, background: modeBg[mode] ?? 'rgba(249,115,22,0.08)', color: modeColor[mode] ?? '#F97316', display: 'flex', alignItems: 'center', gap: 5 }}>
                {modeIcon[mode]} {mode}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 7, background: `${riskColor}18`, color: riskColor }}>
                {latest.result.overall_risk} RISK
              </span>
            </>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div style={{ height: 420, position: 'relative' }}>
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />

          {/* All city dots */}
          {Object.entries(CITY_COORDS).map(([city, coord]) => (
            <Marker key={city} position={coord} icon={L.divIcon({
              className: '',
              html: `<div style="width:9px;height:9px;border-radius:50%;background:#CBD5E1;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.12)"></div>`,
              iconSize: [9, 9], iconAnchor: [4, 4],
            })}>
              <Popup><b>{city}</b></Popup>
            </Marker>
          ))}

          {routePath.length >= 2 && (
            <>
              <FitBounds coords={[originCoord, destCoord]} />
              {/* Glow */}
              <Polyline positions={routePath} pathOptions={{ color: riskColor, weight: 14, opacity: 0.1, lineCap: 'round' }} />
              {/* Main line */}
              <Polyline positions={routePath} pathOptions={{
                color: riskColor, weight: 4, opacity: 0.95, lineCap: 'round',
                dashArray: mode === 'Air' ? '12,8' : mode === 'Rail' ? '6,4' : undefined,
              }} />

              {/* Origin */}
              <Marker position={originCoord} icon={makeIcon('#10B981', '📦')} zIndexOffset={200}>
                <Popup>
                  <b>📦 Origin: {origin}</b><br />
                  Product: {(latest?.result as any)?.product ?? '—'}
                </Popup>
              </Marker>

              {/* Destination */}
              <Marker position={destCoord} icon={makeIcon('#EF4444', '🏁')} zIndexOffset={200}>
                <Popup>
                  <b>🏁 Destination: {destination}</b><br />
                  ETA: {latest?.result.estimated_delivery_hours ?? '—'} hrs
                </Popup>
              </Marker>

              {/* Animated truck */}
              <AnimatedTruck path={routePath} />
            </>
          )}

          {/* Live supplier dots */}
          {liveDeliveries.map(d => (
            <Marker key={d.id} position={[d.supplier_lat, d.supplier_lng]} icon={makeLiveSupplierIcon()} zIndexOffset={1000}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>🚛 {d.supplier_name}</p>
                  <p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>📍 {d.supplier_lat.toFixed(4)}, {d.supplier_lng.toFixed(4)}</p>
                  <p style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>● In Transit</p>
                  <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>Updated: {new Date(d.updated_at).toLocaleTimeString('en-IN')}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* No analysis overlay */}
        {!latest && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(14px)', borderRadius: 18, padding: '24px 32px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🗺️</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>No Analysis Yet</p>
            <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14 }}>Run AI analysis to see live optimized route</p>
            <Link to="/analyze">
              <button style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Run Analysis →
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Info strip */}
      {latest && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '16px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px 24px', background: 'linear-gradient(135deg, rgba(249,115,22,0.03), rgba(59,130,246,0.03))' }}>
          {[
            { label: '📍 From',       val: origin      || '—' },
            { label: '🏁 To',         val: destination || '—' },
            { label: '📦 Product',    val: (latest.result as any).product ?? '—' },
            { label: '🚛 Mode',       val: mode },
            { label: '💰 Total Cost', val: `₹${latest.result.total_cost_inr.toLocaleString('en-IN')}` },
            { label: '⏱ ETA',         val: `${latest.result.estimated_delivery_hours} hrs` },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{row.val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoutesPage() {
  const [latest,         setLatest]         = useState<SupabaseAnalysis | null>(null);
  const [liveDeliveries, setLiveDeliveries] = useState<LiveDelivery[]>([]);
  const [origin,         setOrigin]         = useState('');
  const [destination,    setDestination]    = useState('');

  // ── Fetch latest analysis from Supabase on mount ───────────────────────────
  useEffect(() => {
    getLatestAnalysis().then(data => {
      if (!data) return;
      setLatest(data);

      const r = data.result as any;

      // 1. Check if origin/destination are stored as direct fields
      const directOrigin = r.origin ?? r.origin_city ?? '';
      const directDest   = r.destination ?? r.destination_city ?? '';

      if (directOrigin && directDest) {
        setOrigin(resolveCity(directOrigin));
        setDestination(resolveCity(directDest));
        return;
      }

      // 2. Fall back to parsing "Rail route from Kochi to Jaipur"
      const br     = typeof r.best_route === 'string' ? r.best_route : '';
      const parsed = parseOriginDest(br);
      setOrigin(resolveCity(parsed.origin));
      setDestination(resolveCity(parsed.destination));
    });
  }, []);

  // ── Live deliveries — Supabase realtime ────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;

    supabase
      .from('deliveries')
      .select('*')
      .eq('status', 'in_transit')
      .then(({ data }) => { if (data) setLiveDeliveries(data as LiveDelivery[]); });

    const channel = supabase
      .channel('live-deliveries-routes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, payload => {
        if (payload.eventType === 'INSERT') {
          const d = payload.new as LiveDelivery;
          if (d.status === 'in_transit') setLiveDeliveries(prev => [...prev, d]);
        }
        if (payload.eventType === 'UPDATE') {
          const d = payload.new as LiveDelivery;
          if (d.status === 'delivered') {
            setLiveDeliveries(prev => prev.filter(x => x.id !== d.id));
          } else {
            setLiveDeliveries(prev => prev.map(x => x.id === d.id ? d : x));
          }
        }
      })
      .subscribe();

    return () => { if (supabase) supabase.removeChannel(channel); };
  }, []);

  // ── Build routes table ─────────────────────────────────────────────────────
  const mode = latest ? getRouteMode(latest.result) : 'Road';
  const rcb  = latest ? (latest.result as any).real_cost_breakdown : null;

  const routes = latest ? [
    {
      from:     origin      || '—',
      to:       destination || '—',
      mode,
      dist:     rcb?.distance_km ? `${rcb.distance_km.toLocaleString('en-IN')} km` : '—',
      time:     `${latest.result.estimated_delivery_hours} hrs`,
      cost:     `₹${latest.result.total_cost_inr.toLocaleString('en-IN')}`,
      risk:     latest.result.overall_risk as RiskLevel,
      status:   'ON TIME' as ShipmentStatus,
      isLatest: true,
    },
    ...staticRoutes.filter(r => !(r.from === origin && r.to === destination)),
  ] : staticRoutes;

  return (
    <div className="animate-fade-in-up" style={{ width: '100%' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: 'rgba(59,130,246,0.08)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>Shipments & Routes</h1>
            <p style={{ fontSize: 14, color: '#94A3B8' }}>
              {latest
                ? `Latest AI route: ${origin} → ${destination} · ${getRouteLabel(latest.result)}`
                : 'Active shipping lanes with real-time delay and risk status'}
            </p>
          </div>
        </div>
        <Link to="/analyze">
          <button className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.28)' }}>
            <Search size={14} /> Optimize New Route
          </button>
        </Link>
      </div>

      {/* ── Live delivery alert ── */}
      {liveDeliveries.length > 0 && (
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', flexShrink: 0, animation: 'blink 1s infinite' }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>
            {liveDeliveries.length} Live Delivery in Progress —
            {liveDeliveries.map(d => ` ${d.supplier_name}`).join(',')} tracking kar raha hai!
          </p>
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { val: String(routes.length),        label: 'Active Lanes', color: '#F97316', icon: <MapPin size={16} />        },
          { val: '2',                           label: 'Delayed',       color: '#F59E0B', icon: <Clock size={16} />         },
          { val: '1',                           label: 'At Risk',       color: '#EF4444', icon: <AlertTriangle size={16} /> },
          { val: '91%',                         label: 'On-Time Rate',  color: '#10B981', icon: <TrendingUp size={16} />    },
          { val: String(liveDeliveries.length), label: 'Live Tracking', color: '#10B981', icon: <Truck size={16} />         },
        ].map((s, idx) => (
          <div key={s.label} className="animate-fade-in-up"
            style={{ ...card, textAlign: 'center', animationDelay: `${idx * 70}ms`, padding: '18px 14px' }}
            onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.boxShadow = '0 12px 28px rgba(0,0,0,0.07)'; d.style.borderColor = `${s.color}33`; }}
            onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; d.style.borderColor = '#E2E8F0'; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>{s.icon}</div>
            <p style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.val}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── AI Route Banner ── */}
      {latest && (
        <div className="animate-fade-in-up" style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.06),rgba(59,130,246,0.06))', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.1)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>🤖 Latest AI Recommended Route</p>
            <p style={{ fontSize: 12, color: '#64748B' }}>
              {origin} → {destination} · {getRouteLabel(latest.result)} · {latest.result.estimated_delivery_hours} hrs · ₹{latest.result.total_cost_inr.toLocaleString('en-IN')}
            </p>
            {(latest.result as any).final_recommendation && (
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                💡 {(latest.result as any).final_recommendation}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: `${riskHex(latest.result.overall_risk as RiskLevel)}15`, color: riskHex(latest.result.overall_risk as RiskLevel) }}>
              {latest.result.overall_risk} RISK
            </span>
            {(latest.result as any).decision && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                {(latest.result as any).decision}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Cost Breakdown Bar ── */}
      {latest && <CostBreakdownBar result={latest.result} />}

      {/* ── MAP ── */}
      <RouteMap latest={latest} liveDeliveries={liveDeliveries} origin={origin} destination={destination} />

      {/* ── ROUTES TABLE ── */}
      <div style={{ ...card, marginBottom: 24, padding: '20px 0', overflow: 'hidden' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 16px' }}>
          <Package size={15} color="#F97316" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Active Shipping Lanes</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '2px 10px', marginLeft: 'auto' }}>
            {routes.length} Routes
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                {tableHeaders.map(h => (
                  <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routes.map((r, i) => (
                <tr key={i}
                  style={{ borderBottom: i < routes.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.2s', cursor: 'default', background: (r as any).isLatest ? 'rgba(249,115,22,0.02)' : 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = (r as any).isLatest ? 'rgba(249,115,22,0.02)' : 'transparent'; }}
                >
                  <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {(r as any).isLatest && <span style={{ fontSize: 10, fontWeight: 700, color: '#F97316', background: 'rgba(249,115,22,0.1)', padding: '1px 6px', borderRadius: 5 }}>AI</span>}
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{r.from}</span>
                      <span style={{ fontSize: 12, color: '#94A3B8', margin: '0 4px' }}>→</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{r.to}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: modeBg[r.mode] ?? 'rgba(249,115,22,0.08)', color: modeColor[r.mode] ?? '#F97316', fontSize: 12, fontWeight: 600 }}>
                      {modeIcon[r.mode]} {r.mode}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{r.dist}</td>
                  <td style={{ padding: '13px 18px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{r.time}</td>
                  <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 700, color: '#F97316', whiteSpace: 'nowrap' }}>{r.cost}</td>
                  <td style={{ padding: '13px 18px' }}><StatusBadge status={r.risk} variant={riskVariant[r.risk]} /></td>
                  <td style={{ padding: '13px 18px' }}><StatusBadge status={r.status} variant={statusVariant[r.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CITY PERFORMANCE ── */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <TrendingUp size={15} color="#F97316" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>City-wise On-Time Performance</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {cityStats.map((c, idx) => {
            const perf: RiskLevel = c.onTime >= 90 ? 'LOW' : c.onTime >= 80 ? 'MEDIUM' : 'HIGH';
            return (
              <div key={c.city} className="animate-fade-in-up"
                style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 16px', border: '1px solid #E2E8F0', transition: 'all 0.2s', animationDelay: `${idx * 45}ms` }}
                onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#fff'; d.style.borderColor = 'rgba(249,115,22,0.2)'; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#F8FAFC'; d.style.borderColor = '#E2E8F0'; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{c.city}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${riskHex(perf)}15`, color: riskHex(perf) }}>{c.onTime}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{c.lanes} lanes</span>
                  {c.delayed > 0 && <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>{c.delayed} delayed</span>}
                </div>
                <div style={{ height: 5, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.onTime}%`, background: c.onTime >= 90 ? 'linear-gradient(90deg,#10B981,#34D399)' : c.onTime >= 80 ? 'linear-gradient(90deg,#F59E0B,#FCD34D)' : 'linear-gradient(90deg,#EF4444,#F87171)', borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TIPS ── */}
      <div style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.05),rgba(59,130,246,0.05))', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 20, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(249,115,22,0.1)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={18} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>AI Route Recommendation Tips</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px 32px' }}>
            {[
              'Use Rail for shipments > 1,000 km to save 35–40% cost',
              'Air only for time-critical or high-value cargo',
              'Avoid NH48 currently — 4hr delay reported',
              'Mumbai–Chennai road is best performing route this month',
              'Chennai–Ahmedabad rail has HIGH risk — consider rerouting',
              'Run AI Analysis for real-time optimized recommendations',
            ].map(tip => (
              <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: '#F97316', marginTop: 2, flexShrink: 0, fontSize: 13 }}>•</span>
                <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes ripple { 0%{transform:translate(-50%,-50%) scale(0.8);opacity:1} 100%{transform:translate(-50%,-50%) scale(1.8);opacity:0} }
      `}</style>
    </div>
  );
}
