// src/pages/ManagerPerformancePage.tsx
// ✅ FULLY REAL DATA — AgentScoreSummary uses actual scores from Supabase

import { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, Truck, Factory,
  AlertTriangle, IndianRupee, Clock, CheckCircle,
  AlertOctagon, MapPin, Zap, RefreshCw, Newspaper,
  CloudRain, Wind, Eye, Activity, XCircle,
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllAnalyses } from '../lib/supabase';
import type { SupabaseAnalysis } from '../lib/supabase';

/* ══ ENV KEYS ══ */
const OW_KEY   = import.meta.env.VITE_OPENWEATHER_API_KEY ?? '';
const NEWS_KEY = import.meta.env.VITE_NEWS_API_KEY ?? '';

/* ══ TYPES ══ */
interface WeatherCity {
  city: string; temp: number; condition: string;
  wind: number; humidity: number; icon: string; color: string;
}
interface NewsItem { title: string; time: string; tag: string; color: string; }

/* ══ CONSTANTS ══ */
const WEATHER_CITIES = ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bangalore'];
const CITY_COLORS: Record<string, string> = {
  Mumbai: '#3B82F6', Delhi: '#F59E0B', Chennai: '#F97316',
  Kolkata: '#6366F1', Bangalore: '#10B981',
};
const CITY_COORDS: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.8777], Delhi: [28.6139, 77.209],
  Bangalore: [12.9716, 77.5946], Chennai: [13.0827, 80.2707],
  Hyderabad: [17.385, 78.4867], Kolkata: [22.5726, 88.3639],
  Pune: [18.5204, 73.8567], Jaipur: [26.9124, 75.7873],
  Ahmedabad: [23.0225, 72.5714], Surat: [21.1702, 72.8311],
  Nagpur: [21.1458, 79.0882], Lucknow: [26.8467, 80.9462],
  Chandigarh: [30.7333, 76.7794], Indore: [22.7196, 75.8577],
  Bhopal: [23.2599, 77.4126], Coimbatore: [11.0168, 76.9558],
};

/* ══ Leaflet icon fix ══ */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makeMapIcon = (color: string, emoji: string) => L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:14px;">${emoji}</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -20],
});

/* ══ HELPERS ══ */
const riskHex = (r: string) => r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';

// Auto-detects scale: <= 10 means out-of-10, else already percentage
const toRealPct = (v: any): number | null => {
  if (v == null || isNaN(Number(v))) return null;
  const n = Number(v);
  return Math.min(100, Math.round(n <= 10 ? n * 10 : n));
};

const normConfPct = (v: number) => Math.min(100, Math.round(v > 0 && v <= 1 ? v * 100 : v));

const weatherIcon = (main: string) => {
  const m = main.toLowerCase();
  if (m.includes('clear')) return '☀️';
  if (m.includes('cloud')) return '⛅';
  if (m.includes('rain') || m.includes('drizzle')) return '🌧️';
  if (m.includes('storm') || m.includes('thunder')) return '⛈️';
  if (m.includes('snow')) return '❄️';
  if (m.includes('mist') || m.includes('haze') || m.includes('fog')) return '🌫️';
  return '🌤️';
};

function interpolatePath(from: [number, number], to: [number, number]): [number, number][] {
  const steps = 60;
  const midLat = (from[0] + to[0]) / 2 + 1.0;
  const midLng = (from[1] + to[1]) / 2 - 0.6;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return [
      (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * midLat + t * t * to[0],
      (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * midLng + t * t * to[1],
    ] as [number, number];
  });
}

/* ══ SHARED STYLES ══ */
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24,
};
const ST: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#94A3B8',
  letterSpacing: '1.2px', textTransform: 'uppercase',
};

function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        ...card, ...style,
        boxShadow: h ? '0 12px 40px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: h ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
      }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════
   WEATHER STRIP
══════════════════════════════════════ */
function WeatherStrip() {
  const [cities, setCities] = useState<WeatherCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!OW_KEY) { setLoading(false); return; }
    Promise.all(
      WEATHER_CITIES.map(city =>
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${OW_KEY}&units=metric`)
          .then(r => r.json())
          .then(d => ({
            city, temp: Math.round(d.main?.temp ?? 0),
            condition: d.weather?.[0]?.main ?? 'N/A',
            wind: Math.round((d.wind?.speed ?? 0) * 3.6),
            humidity: d.main?.humidity ?? 0,
            icon: weatherIcon(d.weather?.[0]?.main ?? ''),
            color: CITY_COLORS[city] ?? '#3B82F6',
          } as WeatherCity))
          .catch(() => ({ city, temp: 0, condition: 'N/A', wind: 0, humidity: 0, icon: '❓', color: CITY_COLORS[city] ?? '#94A3B8' } as WeatherCity))
      )
    ).then(r => { setCities(r); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
      {WEATHER_CITIES.map(c => (
        <div key={c} style={{ ...card, height: 110, opacity: 0.4, background: 'linear-gradient(90deg,#F1F5F9,#E2E8F0)' }} />
      ))}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
      {cities.map(w => (
        <HoverCard key={w.city} style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{w.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${w.color}18`, color: w.color }}>{w.condition}</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>{w.city}</p>
          <p style={{ fontSize: 26, fontWeight: 900, color: w.color, lineHeight: 1, marginBottom: 8 }}>{w.temp}°</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 10, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}><Wind size={9} /> {w.wind} km/h</span>
            <span style={{ fontSize: 10, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}><CloudRain size={9} /> {w.humidity}%</span>
          </div>
        </HoverCard>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   KPI STRIP
══════════════════════════════════════ */
function KPIStrip({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const total     = analyses.length;
  const shipNow   = analyses.filter(a => (a.result?.decision ?? '').toUpperCase() === 'SHIP NOW').length;
  const delayed   = analyses.filter(a => (a.result?.decision ?? '').toUpperCase() === 'DELAY').length;
  const cancelled = analyses.filter(a => (a.result?.decision ?? '').toUpperCase() === 'CANCEL').length;
  const avgConf   = total ? Math.round(analyses.reduce((s, a) => s + normConfPct(a.result?.confidence_score ?? 0), 0) / total) : 0;
  const totalCost = analyses.reduce((s, a) => s + (a.result?.total_cost_inr ?? 0), 0);
  const avgHours  = total ? Math.round(analyses.reduce((s, a) => s + (a.result?.estimated_delivery_hours ?? 0), 0) / total) : 0;

  const kpis = [
    { label: 'Total Analyses', value: String(total),                         sub: 'All time',                                              icon: <BarChart3    size={18} />, color: '#3B82F6' },
    { label: 'Ship Now',       value: String(shipNow),                       sub: `${total ? Math.round(shipNow / total * 100) : 0}% rate`, icon: <CheckCircle  size={18} />, color: '#10B981' },
    { label: 'Delayed',        value: String(delayed),                       sub: `${total ? Math.round(delayed / total * 100) : 0}% rate`, icon: <AlertOctagon size={18} />, color: '#F59E0B' },
    { label: 'Cancelled',      value: String(cancelled),                     sub: `${total ? Math.round(cancelled/total*100) : 0}% rate`,   icon: <XCircle      size={18} />, color: '#EF4444' },
    { label: 'Avg Confidence', value: `${avgConf}%`,                         sub: 'AI accuracy',                                            icon: <Zap          size={18} />, color: '#8B5CF6' },
    { label: 'Total Cost (₹)', value: `${(totalCost / 100000).toFixed(1)}L`, sub: 'Cumulative',                                             icon: <IndianRupee  size={18} />, color: '#F97316' },
    { label: 'Avg Delivery',   value: `${avgHours}h`,                        sub: 'Per shipment',                                           icon: <Clock        size={18} />, color: '#06B6D4' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 28 }}>
      {kpis.map(k => (
        <HoverCard key={k.label} style={{ padding: '18px 16px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color, marginBottom: 10 }}>{k.icon}</div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{k.value}</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', margin: '4px 0 2px' }}>{k.label}</p>
          <p style={{ fontSize: 10, color: '#94A3B8' }}>{k.sub}</p>
        </HoverCard>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   DECISION DONUT
══════════════════════════════════════ */
function DecisionDonut({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const total     = analyses.length || 1;
  const shipNow   = analyses.filter(a => (a.result?.decision ?? '').toUpperCase() === 'SHIP NOW').length;
  const delayed   = analyses.filter(a => (a.result?.decision ?? '').toUpperCase() === 'DELAY').length;
  const cancelled = analyses.filter(a => (a.result?.decision ?? '').toUpperCase() === 'CANCEL').length;
  const segments  = [
    { label: 'Ship Now',  value: shipNow,   color: '#10B981' },
    { label: 'Delayed',   value: delayed,   color: '#F59E0B' },
    { label: 'Cancelled', value: cancelled, color: '#EF4444' },
  ];
  const r = 42; const cx = 60; const cy = 60;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Activity size={14} color="#3B82F6" /><span style={ST}>Decision Split</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="16" />
            {segments.map((s, i) => {
              const pct = s.value / total;
              const dash = animated ? pct * circ : 0;
              const el = (
                <circle key={i} cx={cx} cy={cy} r={r}
                  fill="none" stroke={s.color} strokeWidth="16"
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={-(offset * circ)}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: `stroke-dasharray 0.8s ease ${i * 0.1}s` }}
                />
              );
              offset += pct;
              return el;
            })}
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{analyses.length}</p>
            <p style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600 }}>TOTAL</p>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {segments.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '6px 10px', borderRadius: 10, background: `${s.color}10` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: 9, color: '#94A3B8', marginLeft: 4 }}>{Math.round(s.value / total * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   RISK DISTRIBUTION
══════════════════════════════════════ */
function RiskDistribution({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  const total  = analyses.length || 1;
  const counts = ['LOW', 'MEDIUM', 'HIGH'].map(r => ({
    label: r, color: riskHex(r),
    value: analyses.filter(a => (a.result?.overall_risk ?? '').toUpperCase() === r).length,
  }));
  const max = Math.max(...counts.map(c => c.value), 1);

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <AlertTriangle size={14} color="#F59E0B" /><span style={ST}>Risk Distribution</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {counts.map(c => (
          <div key={c.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.label}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                {c.value} <span style={{ fontSize: 10, color: '#94A3B8' }}>({Math.round(c.value / total * 100)}%)</span>
              </span>
            </div>
            <div style={{ height: 10, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${c.color},${c.color}88)`, width: animated ? `${(c.value / max) * 100}%` : '0%', transition: 'width 1s cubic-bezier(0.4,0,0.2,1) 0.2s' }} />
            </div>
          </div>
        ))}
      </div>
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   MONTHLY TREND
══════════════════════════════════════ */
function MonthlyTrend({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t); }, []);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const counts = months.map((_, mi) => analyses.filter(a => new Date(a.created_at ?? '').getMonth() === mi).length);
  const max    = Math.max(...counts, 1);
  const W = 580; const H = 90; const PL = 10; const PT = 10;
  const gx = (i: number) => PL + (i / 11) * W;
  const gy = (v: number) => PT + H - (v / max) * H;
  const pts  = counts.map((v, i) => `${gx(i).toFixed(1)},${gy(v).toFixed(1)}`).join(' ');
  const area = `M ${gx(0)} ${PT + H} ${counts.map((v, i) => `L ${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ')} L ${gx(11)} ${PT + H} Z`;

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <TrendingUp size={14} color="#10B981" /><span style={ST}>Monthly Analysis Trend</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W + PL * 2} ${H + PT + 22}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map(r => (
          <line key={r} x1={PL} y1={PT + H * (1 - r)} x2={PL + W} y2={PT + H * (1 - r)} stroke="#F1F5F9" strokeWidth="1.5" />
        ))}
        <path d={area} fill="url(#tG)" style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.8s ease' }} />
        <polyline points={pts} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
          style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.6s ease 0.2s' }} />
        {counts.map((v, i) => (
          <circle key={i} cx={gx(i)} cy={gy(v)} r="4.5" fill="#10B981" stroke="white" strokeWidth="2"
            style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.1 + i * 0.04}s` }} />
        ))}
        {months.map((m, i) => (
          <text key={m} x={gx(i)} y={PT + H + 18} textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="600">{m}</text>
        ))}
        {counts.map((v, i) => v > 0 && (
          <text key={i} x={gx(i)} y={gy(v) - 9} textAnchor="middle" fontSize="9" fill="#10B981" fontWeight="800">{v}</text>
        ))}
      </svg>
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   TOP ROUTES
══════════════════════════════════════ */
function TopRoutes({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);

  const rm: Record<string, number> = {};
  analyses.forEach(a => {
    if (a.result?.origin && a.result?.destination) {
      const k = `${a.result.origin} → ${a.result.destination}`;
      rm[k] = (rm[k] || 0) + 1;
    }
  });
  const routes = Object.entries(rm).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max    = routes[0]?.[1] || 1;

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <MapPin size={14} color="#3B82F6" /><span style={ST}>Top Routes</span>
      </div>
      {routes.length === 0
        ? <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No route data yet</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {routes.map(([route, count], i) => (
            <div key={route}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>#{i + 1} {route}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#3B82F6' }}>{count}x</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#3B82F6,#60A5FA)', width: animated ? `${(count / max) * 100}%` : '0%', transition: `width 0.9s ease ${i * 0.1}s` }} />
              </div>
            </div>
          ))}
        </div>
      }
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   TOP SUPPLIERS
══════════════════════════════════════ */
function TopSuppliers({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 350); return () => clearTimeout(t); }, []);

  const map: Record<string, number> = {};
  analyses.forEach(a => {
    const bs   = a.result?.best_supplier;
    const name = typeof bs === 'string' ? bs : (bs as any)?.name ?? '';
    if (name) map[name] = (map[name] || 0) + 1;
  });
  const items  = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max    = items[0]?.[1] || 1;
  const colors = ['#F97316', '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B'];

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Factory size={14} color="#8B5CF6" /><span style={ST}>Top Suppliers</span>
      </div>
      {items.length === 0
        ? <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No supplier data yet</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map(([name, count], i) => (
            <div key={name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `${colors[i]}20`, color: colors[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>{name[0]}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{name}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: colors[i] }}>{count}x</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${colors[i]},${colors[i]}88)`, width: animated ? `${(count / max) * 100}%` : '0%', transition: `width 0.9s ease ${i * 0.1}s` }} />
              </div>
            </div>
          ))}
        </div>
      }
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   AVG COST BY PRODUCT
══════════════════════════════════════ */
function CostByProduct({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 400); return () => clearTimeout(t); }, []);

  const map: Record<string, number[]> = {};
  analyses.forEach(a => {
    if (a.result?.product && a.result?.total_cost_inr) {
      if (!map[a.result.product]) map[a.result.product] = [];
      map[a.result.product].push(a.result.total_cost_inr);
    }
  });
  const items  = Object.entries(map).map(([p, vals]) => ({ product: p, avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) })).sort((a, b) => b.avg - a.avg).slice(0, 5);
  const max    = items[0]?.avg || 1;
  const colors = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <IndianRupee size={14} color="#F97316" /><span style={ST}>Avg Cost by Product</span>
      </div>
      {items.length === 0
        ? <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No cost data yet</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map(({ product, avg }, i) => (
            <div key={product}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{product}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: colors[i] }}>₹{(avg / 1000).toFixed(0)}K</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${colors[i]},${colors[i]}88)`, width: animated ? `${(avg / max) * 100}%` : '0%', transition: `width 0.9s ease ${i * 0.1}s` }} />
              </div>
            </div>
          ))}
        </div>
      }
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   ✅ AGENT SCORES — FULLY REAL DATA
   Reads actual demand_score, route_score,
   supplier_score, risk_score, cost_score
   from each analysis and averages them.
══════════════════════════════════════ */
function AgentScoreSummary({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  const total = analyses.length;

  // For each score field, collect real values and average them
  const avgScore = (field: string): number | null => {
    const vals = analyses
      .map(a => toRealPct((a.result as any)?.[field]))
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  };

  const scores = [
    { label: 'Demand Score',   value: avgScore('demand_score'),   color: '#F97316', field: 'demand_score'   },
    { label: 'Route Score',    value: avgScore('route_score'),     color: '#3B82F6', field: 'route_score'    },
    { label: 'Supplier Score', value: avgScore('supplier_score'),  color: '#10B981', field: 'supplier_score' },
    { label: 'Risk Safety',    value: avgScore('risk_score'),      color: '#F59E0B', field: 'risk_score'     },
    { label: 'Cost Score',     value: avgScore('cost_score'),      color: '#8B5CF6', field: 'cost_score'     },
  ];

  // Count how many analyses actually have each score field
  const fieldCoverage = (field: string) =>
    analyses.filter(a => (a.result as any)?.[field] != null).length;

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Zap size={14} color="#F97316" />
        <span style={ST}>Avg Agent Scores</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>
          {total} analyses
        </span>
      </div>

      {total === 0 ? (
        <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No score data yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          {scores.map(s => {
            const coverage = fieldCoverage(s.field);
            // If no real data for this field, show N/A
            const displayVal = s.value ?? 0;
            const hasData    = s.value !== null;

            return (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>{s.label}</span>
                    {coverage > 0 && (
                      <span style={{ fontSize: 9, color: '#94A3B8', background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>
                        {coverage}/{total}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: hasData ? s.color : '#CBD5E1' }}>
                    {hasData ? `${displayVal}%` : 'N/A'}
                  </span>
                </div>
                <div style={{ height: 8, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: animated && hasData ? `${displayVal}%` : '0%',
                    background: hasData
                      ? `linear-gradient(90deg,${s.color}88,${s.color})`
                      : '#E2E8F0',
                    borderRadius: 99,
                    transition: 'width 1.1s ease',
                  }} />
                </div>
              </div>
            );
          })}

          {/* Summary row */}
          <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Overall Avg Confidence</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#F97316' }}>
                {total > 0
                  ? `${Math.round(analyses.reduce((s, a) => s + normConfPct(a.result?.confidence_score ?? 0), 0) / total)}%`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   LEAFLET MAP
══════════════════════════════════════ */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => { if (coords.length >= 2) map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] }); }, [coords, map]);
  return null;
}

function IndiaDeliveryMap({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const STATUS_CFG = {
    delivered: { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  label: 'Delivered',  icon: <CheckCircle  size={12} /> },
    transit:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  label: 'In Transit', icon: <Truck        size={12} /> },
    delayed:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'Delayed',    icon: <AlertOctagon size={12} /> },
  };

  const pins = analyses
    .filter(a => a.result?.origin && a.result?.destination && CITY_COORDS[a.result.origin] && CITY_COORDS[a.result.destination])
    .slice(0, 10)
    .map(a => {
      const dec    = (a.result?.decision ?? '').toUpperCase();
      const status: 'delivered' | 'transit' | 'delayed' = dec === 'SHIP NOW' ? 'delivered' : dec === 'DELAY' ? 'delayed' : 'transit';
      return {
        from: a.result.origin!, to: a.result.destination!,
        fromCoord: CITY_COORDS[a.result.origin!], toCoord: CITY_COORDS[a.result.destination!],
        status, product: a.result.product ?? '',
        path: interpolatePath(CITY_COORDS[a.result.origin!], CITY_COORDS[a.result.destination!]),
      };
    });

  const counts   = { delivered: pins.filter(p => p.status === 'delivered').length, transit: pins.filter(p => p.status === 'transit').length, delayed: pins.filter(p => p.status === 'delayed').length };
  const allCoords = pins.flatMap(p => [p.fromCoord, p.toCoord]);

  return (
    <HoverCard style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={14} color="#3B82F6" /><span style={ST}>Delivery Map — India</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.entries(STATUS_CFG) as [keyof typeof STATUS_CFG, typeof STATUS_CFG[keyof typeof STATUS_CFG]][]).map(([k, v]) => (
            <span key={k} style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: v.bg, color: v.color, display: 'flex', alignItems: 'center', gap: 4 }}>
              {v.icon} {counts[k]} {v.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ height: 420, position: 'relative' }}>
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
          {Object.entries(CITY_COORDS).map(([city, coord]) => (
            <Marker key={city} position={coord} icon={L.divIcon({
              className: '',
              html: `<div style="width:9px;height:9px;border-radius:50%;background:#CBD5E1;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.12)"></div>`,
              iconSize: [9, 9], iconAnchor: [4, 4],
            })}>
              <Popup><b>{city}</b></Popup>
            </Marker>
          ))}
          {pins.map((pin, i) => {
            const cfg = STATUS_CFG[pin.status];
            return (
              <Polyline key={`line-${i}`} positions={pin.path}
                pathOptions={{ color: cfg.color, weight: 3, opacity: 0.85, dashArray: pin.status === 'transit' ? '8,5' : undefined }} />
            );
          })}
          {pins.map((pin, i) => {
            const cfg = STATUS_CFG[pin.status];
            return [
              <Marker key={`from-${i}`} position={pin.fromCoord} icon={makeMapIcon(cfg.color, '📦')} zIndexOffset={100}>
                <Popup><b>📦 {pin.from}</b><br />Product: {pin.product}<br />Status: {cfg.label}</Popup>
              </Marker>,
              <Marker key={`to-${i}`} position={pin.toCoord} icon={makeMapIcon(cfg.color, '🏁')} zIndexOffset={100}>
                <Popup><b>🏁 {pin.to}</b><br />Status: {cfg.label}</Popup>
              </Marker>,
            ];
          })}
          {allCoords.length >= 2 && <FitBounds coords={allCoords} />}
        </MapContainer>

        {pins.length === 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '22px 30px', textAlign: 'center', boxShadow: '0 8px 28px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: 30, marginBottom: 6 }}>🗺️</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>No Route Data Yet</p>
            <p style={{ fontSize: 11, color: '#94A3B8' }}>Run analyses first to see live delivery map</p>
          </div>
        )}
      </div>

      {pins.length > 0 && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {pins.slice(0, 8).map((pin, i) => {
            const cfg = STATUS_CFG[pin.status];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.bg, padding: '4px 10px', borderRadius: 99, border: `1px solid ${cfg.color}30` }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>{pin.from} → {pin.to}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   NEWS FEED
══════════════════════════════════════ */
function NewsFeed() {
  const [news, setNews]       = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!NEWS_KEY) { setLoading(false); return; }
    fetch(`https://newsapi.org/v2/everything?q=supply+chain+India+logistics&language=en&pageSize=8&sortBy=publishedAt&apiKey=${NEWS_KEY}`)
      .then(r => r.json())
      .then(d => {
        if (d.articles) {
          const TAG_MAP: Record<string, { tag: string; color: string }> = {
            port: { tag: 'PORT', color: '#10B981' }, fuel: { tag: 'COST', color: '#F59E0B' },
            cost: { tag: 'COST', color: '#F59E0B' }, risk: { tag: 'RISK', color: '#EF4444' },
            cyclone: { tag: 'RISK', color: '#EF4444' }, delay: { tag: 'RISK', color: '#EF4444' },
            route: { tag: 'ROUTE', color: '#3B82F6' }, highway: { tag: 'ROUTE', color: '#3B82F6' },
            demand: { tag: 'DEMAND', color: '#8B5CF6' }, rail: { tag: 'DEMAND', color: '#8B5CF6' },
            policy: { tag: 'POLICY', color: '#F97316' }, customs: { tag: 'POLICY', color: '#F97316' },
          };
          const items: NewsItem[] = d.articles.map((a: { title: string; publishedAt: string }) => {
            const tl = (a.title ?? '').toLowerCase();
            let tag = 'NEWS'; let color = '#64748B';
            for (const [kw, cfg] of Object.entries(TAG_MAP)) { if (tl.includes(kw)) { tag = cfg.tag; color = cfg.color; break; } }
            const diff = Math.floor((Date.now() - new Date(a.publishedAt).getTime()) / 3600000);
            const time = diff < 1 ? 'Just now' : diff < 24 ? `${diff}h ago` : `${Math.floor(diff / 24)}d ago`;
            return { title: a.title ?? 'No title', time, tag, color };
          });
          setNews(items);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fallback: NewsItem[] = [
    { title: 'Port congestion at JNPT eases — shipping times normalize',   time: '2h ago', tag: 'PORT',   color: '#10B981' },
    { title: 'Fuel prices rise 4% — logistics costs expected to increase',  time: '5h ago', tag: 'COST',   color: '#F59E0B' },
    { title: 'Cyclone warning in Bay of Bengal — sea routes disrupted',     time: '8h ago', tag: 'RISK',   color: '#EF4444' },
    { title: 'New highway corridor opens Mumbai–Pune — faster delivery',    time: '1d ago', tag: 'ROUTE',  color: '#3B82F6' },
    { title: 'Rail freight demand surges 12% in Q1 2026',                   time: '1d ago', tag: 'DEMAND', color: '#8B5CF6' },
    { title: 'Customs clearance digitized at 5 major airports',             time: '2d ago', tag: 'POLICY', color: '#F97316' },
  ];
  const items = !loading && news.length > 0 ? news : fallback;

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Newspaper size={14} color="#6366F1" /><span style={ST}>Supply Chain News</span>
        {news.length > 0 && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#EEF2FF', color: '#6366F1', fontWeight: 700 }}>LIVE</span>}
      </div>
      {loading
        ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 44, borderRadius: 12, background: 'linear-gradient(90deg,#F1F5F9,#E2E8F0)', opacity: 0.6 }} />)}</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {items.map((n, i) => (
            <div key={i} style={{ padding: '9px 11px', borderRadius: 11, background: '#F8FAFC', border: '1px solid #F1F5F9', transition: 'all 0.2s ease', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F1F5F9'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: `${n.color}18`, color: n.color, flexShrink: 0, marginTop: 1 }}>{n.tag}</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#1E293B', lineHeight: 1.4, marginBottom: 2 }}>{n.title}</p>
                  <p style={{ fontSize: 10, color: '#94A3B8' }}>{n.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   ANALYSES TABLE
══════════════════════════════════════ */
function AnalysesTable({ analyses }: { analyses: SupabaseAnalysis[] }) {
  const [page, setPage] = useState(0);
  const PER   = 8;
  const total = analyses.length;
  const slice = analyses.slice(page * PER, (page + 1) * PER);
  const pages = Math.ceil(total / PER);

  return (
    <HoverCard style={{ overflow: 'hidden', padding: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={14} color="#3B82F6" /><span style={ST}>All Analyses ({total})</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: page === 0 ? '#F8FAFC' : '#fff', color: page === 0 ? '#CBD5E1' : '#475569', fontSize: 11, fontWeight: 600, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
            ← Prev
          </button>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{page + 1} / {Math.max(pages, 1)}</span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
            style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: page >= pages - 1 ? '#F8FAFC' : '#fff', color: page >= pages - 1 ? '#CBD5E1' : '#475569', fontSize: 11, fontWeight: 600, cursor: page >= pages - 1 ? 'not-allowed' : 'pointer' }}>
            Next →
          </button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['#', 'Date', 'Product', 'Route', 'Mode', 'Decision', 'Risk', 'Cost (₹)', 'Confidence', 'Demand', 'Supplier'].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0
              ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: '32px', fontSize: 13, color: '#94A3B8' }}>No analyses yet — run your first analysis!</td></tr>
              : slice.map((a, i) => {
                const r        = a.result;
                const dec      = r?.decision ?? '';
                const decColor = dec.toUpperCase() === 'SHIP NOW' ? '#10B981' : dec.toUpperCase() === 'DELAY' ? '#F59E0B' : '#EF4444';
                const confVal  = normConfPct(r?.confidence_score ?? 0);
                const risk     = r?.overall_risk ?? '';
                const cost     = r?.total_cost_inr ?? 0;
                const demandV  = toRealPct((r as any)?.demand_score);
                const supplierV = toRealPct((r as any)?.supplier_score);
                const mode     = (r as any)?.recommended_mode ?? '';

                return (
                  <tr key={a.id ?? i}
                    style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFC'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{page * PER + i + 1}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748B' }}>
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{r?.product || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 10, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {r?.origin && r?.destination ? `${r.origin} → ${r.destination}` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {mode ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>{mode}</span> : <span style={{ color: '#CBD5E1' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: `${decColor}15`, color: decColor }}>{dec || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: `${riskHex(risk)}15`, color: riskHex(risk) }}>{risk || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#F97316', whiteSpace: 'nowrap' }}>
                      {cost ? `₹${(cost / 1000).toFixed(0)}K` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden', minWidth: 40 }}>
                          <div style={{ height: '100%', background: '#8B5CF6', borderRadius: 99, width: `${confVal}%` }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#8B5CF6', minWidth: 28 }}>{confVal > 0 ? `${confVal}%` : '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#F97316' }}>
                      {demandV !== null ? `${demandV}%` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#10B981' }}>
                      {supplierV !== null ? `${supplierV}%` : '—'}
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </HoverCard>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function ManagerPerformancePage() {
  const [analyses, setAnalyses]       = useState<SupabaseAnalysis[]>([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllAnalyses();
      setAnalyses(data);
    } catch (e) { console.error('[ManagerPerformancePage]', e); }
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={{ fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0 }}>Active Performance</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>
            Live overview · {analyses.length} analyses cumulated · Auto-updates on new runs
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.3)', opacity: loading ? 0.75 : 1, fontFamily: 'inherit' }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#94A3B8', fontSize: 14 }}>Loading performance data...</div>
      ) : (
        <>
          {/* 1 — Weather */}
          <WeatherStrip />

          {/* 2 — KPI 7 cols */}
          <KPIStrip analyses={analyses} />

          {/* 3 — Donut + Risk + Trend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, marginBottom: 16 }}>
            <DecisionDonut    analyses={analyses} />
            <RiskDistribution analyses={analyses} />
            <MonthlyTrend     analyses={analyses} />
          </div>

          {/* 4 — Routes + Suppliers + Cost */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <TopRoutes     analyses={analyses} />
            <TopSuppliers  analyses={analyses} />
            <CostByProduct analyses={analyses} />
          </div>

          {/* 5 — Agent Scores + Map */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <AgentScoreSummary analyses={analyses} />
            <div style={{ gridColumn: 'span 2' }}>
              <IndiaDeliveryMap analyses={analyses} />
            </div>
          </div>

          {/* 6 — News full width */}
          <div style={{ marginBottom: 16 }}>
            <NewsFeed />
          </div>

          {/* 7 — Full Table */}
          <AnalysesTable analyses={analyses} />

          <p style={{ textAlign: 'center', fontSize: 11, color: '#CBD5E1', marginTop: 20, marginBottom: 8 }}>
            Last updated: {lastRefresh.toLocaleTimeString('en-IN')} · {analyses.length} total analyses
          </p>
        </>
      )}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg);      } to { transform: rotate(360deg);   } }
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}
