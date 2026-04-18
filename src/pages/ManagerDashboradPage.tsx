// src/pages/ManagerDashboardPage.tsx
// ✅ FULLY UPDATED — real_cost_breakdown, all modes, cold chain, packaging, warehouse fully shown

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Crown, BarChart3, Truck, Factory, AlertTriangle,
  IndianRupee, Clock, TrendingUp, CheckCircle, XCircle,
  AlertOctagon, Package, MapPin, Zap, LogOut, RefreshCw,
  ChevronRight, MessageCircle, Loader2, CheckCircle2, Bell,
  Snowflake, Box, Warehouse, Train, Car, Plane, Scale,
  FileText, DollarSign, Info,
} from 'lucide-react';
import {
  getLatestAnalysis, getSupplierContact, saveManagerApproval,
  getActiveAlerts, supabase,
  type SupabaseAnalysis, type LiveAlert,
} from '../lib/supabase';

/* ── helpers ── */
const normPct = (v: number) => Math.min(100, Math.round(v > 0 && v <= 1 ? v * 100 : v));
const riskHex = (r: string) =>
  r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';
const fmt = (v: number | undefined | null) =>
  v == null || isNaN(Number(v)) ? '—' : '₹' + Math.round(Number(v)).toLocaleString('en-IN');
const fmtN = (v: number | undefined | null) =>
  v == null || isNaN(Number(v)) ? '—' : Math.round(Number(v)).toLocaleString('en-IN');
const pct = (v: number | undefined | null) =>
  v == null ? '—' : `${v}%`;

const decisionCfg = (d: string) => {
  if (d === 'SHIP NOW') return { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', icon: <CheckCircle size={22} /> };
  if (d === 'DELAY')    return { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  icon: <AlertOctagon size={22} /> };
  return                       { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: <XCircle size={22} /> };
};
const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#94A3B8',
  letterSpacing: '1.2px', textTransform: 'uppercase' as const,
};
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24,
  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
};

const alertBg     = (t: string) => t === 'CRITICAL' ? 'rgba(239,68,68,0.05)'  : t === 'WARNING' ? 'rgba(245,158,11,0.05)'  : 'rgba(59,130,246,0.05)';
const alertBorder = (t: string) => t === 'CRITICAL' ? 'rgba(239,68,68,0.2)'   : t === 'WARNING' ? 'rgba(245,158,11,0.2)'   : 'rgba(59,130,246,0.2)';
const alertDot    = (t: string) => t === 'CRITICAL' ? '#EF4444'                : t === 'WARNING' ? '#F59E0B'                : '#3B82F6';

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

/* ════════════════════════════════════════
   WHATSAPP ALERT BUTTON
════════════════════════════════════════ */
function WhatsAppAlertButton({ alert, supplierName, supplierCity, product, destination }: {
  alert: LiveAlert; supplierName: string; supplierCity: string; product: string; destination: string;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSend = async () => {
    if (state === 'sent') return;
    setState('loading'); setErrMsg('');
    const contact = await getSupplierContact(supplierName, supplierCity);
    if (!contact?.phone) { setState('error'); setErrMsg('Supplier phone nahi mila'); return; }
    const message = `⚠️ *SupplyAI Alert — ${alert.type}*\n\n${alert.icon} *${alert.title}*\n\n${alert.description}\n\n📦 Product: ${product}\n📍 Destination: ${destination}\n🔴 Risk Level: ${alert.risk}\n📡 Source: ${alert.source}\n\n— SupplyAI Manager`;
    const phone = contact.phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
    setState('sent');
  };

  return (
    <button onClick={handleSend} disabled={state === 'loading' || state === 'sent'}
      style={{ padding: '7px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: state === 'loading' || state === 'sent' ? 'not-allowed' : 'pointer', background: state === 'sent' ? 'rgba(16,185,129,0.12)' : state === 'loading' ? '#F1F5F9' : state === 'error' ? 'rgba(239,68,68,0.08)' : 'linear-gradient(135deg, #25D366, #128C7E)', color: state === 'sent' ? '#10B981' : state === 'loading' ? '#94A3B8' : state === 'error' ? '#EF4444' : '#fff', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
      title={errMsg || undefined}>
      {state === 'loading' && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
      {state === 'sent'    && <CheckCircle2 size={12} />}
      {state === 'idle'    && <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>}
      {state === 'error' && '⚠️'}
      {state === 'idle' && 'Alert Bhejo'}{state === 'loading' && 'Sending...'}{state === 'sent' && 'Sent ✓'}{state === 'error' && 'Retry'}
    </button>
  );
}

/* ════════════════════════════════════════
   GO MSG BUTTON
════════════════════════════════════════ */
function GoMsgButton({ supplierName, supplierCity, analysisId, routeMode, distanceKm, estimatedHours, product, destination }: {
  supplierName: string; supplierCity: string; analysisId: string; routeMode: string;
  distanceKm?: number; estimatedHours?: number; product: string; destination: string;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleGoMsg = async () => {
    if (state === 'sent') return;
    setState('loading'); setErrMsg('');
    const contact = await getSupplierContact(supplierName, supplierCity);
    if (!contact?.phone) { setState('error'); setErrMsg('Supplier ka phone number nahi mila database mein.'); return; }
    const trackingLink = `${window.location.origin}/supplier-track?id=${analysisId}&supplier=${encodeURIComponent(contact.supplier_name)}`;
    const routeInfo = [routeMode ? `Route: ${routeMode}` : '', distanceKm ? `Distance: ${distanceKm} km` : '', estimatedHours ? `Estimated Time: ${estimatedHours} hrs` : ''].filter(Boolean).join(' | ');
    const message = `Hello ${contact.supplier_name},\n\nSupplyAI Manager ne aapko yeh shipment confirm kiya hai.\n\n📦 Product: ${product}\n📍 Destination: ${destination}\n🚛 ${routeInfo}\n\n👇 Delivery start karne ke liye yeh link kholo:\n${trackingLink}\n\n— SupplyAI Manager`;
    await saveManagerApproval({ analysis_id: analysisId, supplier_name: contact.supplier_name, supplier_email: contact.email ?? '', supplier_phone: contact.phone, manager_note: `WhatsApp via SupplyAI | ${routeInfo}` });
    const phone = contact.phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
    setState('sent');
  };

  return (
    <div style={{ marginTop: 14 }}>
      <button onClick={handleGoMsg} disabled={state === 'loading' || state === 'sent'}
        style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: 'none', cursor: state === 'loading' || state === 'sent' ? 'not-allowed' : 'pointer', background: state === 'sent' ? 'rgba(16,185,129,0.1)' : state === 'loading' ? '#F1F5F9' : state === 'error' ? 'rgba(239,68,68,0.08)' : 'linear-gradient(135deg, #25D366, #128C7E)', color: state === 'sent' ? '#10B981' : state === 'loading' ? '#94A3B8' : state === 'error' ? '#EF4444' : '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: state === 'idle' ? '0 4px 16px rgba(37,211,102,0.30)' : 'none', transition: 'all 0.25s ease' }}
        onMouseEnter={e => { if (state === 'idle') { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(37,211,102,0.40)'; }}}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = state === 'idle' ? '0 4px 16px rgba(37,211,102,0.30)' : 'none'; }}>
        {state === 'loading' && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
        {state === 'sent'    && <CheckCircle2 size={15} />}
        {state === 'idle'    && <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>}
        {state === 'error' && '⚠️'}
        {state === 'idle' && 'Go Msg — WhatsApp Supplier'}{state === 'loading' && 'Fetching contact...'}{state === 'sent' && 'WhatsApp Opened! ✓'}{state === 'error' && 'Error — Retry'}
      </button>
      {state === 'error' && errMsg && <p style={{ marginTop: 8, fontSize: 11, color: '#EF4444', textAlign: 'center', fontWeight: 500 }}>{errMsg}</p>}
      {state === 'sent' && <p style={{ marginTop: 8, fontSize: 11, color: '#10B981', textAlign: 'center', fontWeight: 600 }}>✅ Record saved in manager_approvals</p>}
    </div>
  );
}

function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...card, ...style, boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)', transform: hovered ? 'translateY(-3px)' : 'translateY(0)', transition: 'box-shadow 0.25s ease, transform 0.25s ease' }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════
   MODE COMPARISON TABLE — REAL DATA
════════════════════════════════════════ */
function ModeComparisonTable({ rcb, recommendedMode }: { rcb: any; recommendedMode: string }) {
  const modes = [
    { key: 'rail', label: 'RAIL', icon: <Train size={14} />, color: '#F97316', data: rcb?.rail },
    { key: 'road', label: 'ROAD', icon: <Car size={14} />,   color: '#8B5CF6', data: rcb?.road },
    { key: 'air',  label: 'AIR',  icon: <Plane size={14} />, color: '#3B82F6', data: rcb?.air  },
  ];

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Scale size={14} color="#F97316" />
        <span style={sectionTitle}>Mode Comparison — All Routes</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.08)', padding: '2px 10px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.2)' }}>
          ✓ Recommended: {recommendedMode}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {modes.map(m => {
          const isRec = m.label === recommendedMode?.toUpperCase();
          const d = m.data;
          if (!d) return null;

          const rows = [
            { label: 'Base Freight', value: fmt(d.base_freight) },
            { label: 'Packaging',    value: fmt(d.packaging) },
            { label: 'Cold Chain',   value: fmt(d.cold_chain) },
            { label: 'Warehouse',    value: fmt(d.warehouse) },
            { label: 'Insurance',    value: fmt(d.insurance) },
            { label: 'Freight GST',  value: fmt(d.freight_gst) },
            { label: 'Time (hrs)',   value: d.time_hrs ? `${d.time_hrs} hrs` : '—' },
            ...(d.fuel_surcharge   ? [{ label: 'Fuel Surcharge',    value: fmt(d.fuel_surcharge) }]   : []),
            ...(d.toll_charges     ? [{ label: 'Toll Charges',      value: fmt(d.toll_charges) }]     : []),
            ...(d.terminal         ? [{ label: 'Terminal Charges',  value: fmt(d.terminal) }]         : []),
            ...(d.first_last_mile  ? [{ label: 'First/Last Mile',   value: fmt(d.first_last_mile) }]  : []),
            ...(d.road_to_airport  ? [{ label: 'Road to Airport',   value: fmt(d.road_to_airport) }]  : []),
            ...(d.security_charge  ? [{ label: 'Security Charge',   value: fmt(d.security_charge) }]  : []),
            ...(d.airport_handling ? [{ label: 'Airport Handling',  value: fmt(d.airport_handling) }] : []),
            ...(d.documentation    ? [{ label: 'Documentation',     value: fmt(d.documentation) }]    : []),
          ];

          return (
            <div key={m.key} style={{ borderRadius: 16, overflow: 'hidden', border: isRec ? `2px solid ${m.color}` : '1px solid #E2E8F0', background: isRec ? `${m.color}04` : '#FAFBFF' }}>
              {/* Header */}
              <div style={{ padding: '12px 14px', background: isRec ? `${m.color}12` : '#F8FAFC', borderBottom: `1px solid ${isRec ? m.color + '25' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: m.color }}>
                  {m.icon}
                  <span style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.label}</span>
                </div>
                {isRec && <span style={{ fontSize: 9, fontWeight: 800, background: m.color, color: '#fff', padding: '2px 7px', borderRadius: 99 }}>BEST</span>}
              </div>
              {/* Grand Total */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{fmt(d.grand_total)}</p>
                <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>Grand Total</p>
              </div>
              {/* Rows */}
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {rows.map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </HoverCard>
  );
}

/* ════════════════════════════════════════
   DETAILED COST BREAKDOWN — REAL DATA
════════════════════════════════════════ */
function DetailedCostBreakdown({ rcb, totalCost, deliveryHours }: { rcb: any; totalCost: number; deliveryHours?: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const rail = rcb?.rail;
  if (!rail) return null;

  // Real segments from selected (rail) mode
  const segments = [
    { label: 'Base Freight',  value: rail.base_freight   ?? 0, color: '#F97316' },
    { label: 'Cold Chain',    value: rail.cold_chain      ?? 0, color: '#06B6D4' },
    { label: 'Packaging',     value: rail.packaging       ?? 0, color: '#8B5CF6' },
    { label: 'Warehouse',     value: rail.warehouse       ?? 0, color: '#10B981' },
    { label: 'Freight GST',   value: rail.freight_gst     ?? 0, color: '#3B82F6' },
    { label: 'Insurance',     value: rail.insurance       ?? 0, color: '#F59E0B' },
    { label: 'Terminal',      value: rail.terminal        ?? 0, color: '#EC4899' },
    { label: 'First/Last Mile', value: rail.first_last_mile ?? 0, color: '#14B8A6' },
    { label: 'Documentation', value: rail.documentation   ?? 0, color: '#A855F7' },
  ].filter(s => s.value > 0);

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = 42; const cx = 60; const cy = 60; const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <IndianRupee size={14} color="#8B5CF6" />
        <span style={sectionTitle}>Recommended Route Cost Breakdown</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{fmt(totalCost)}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Donut */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="16" />
            {segments.map((s, i) => {
              const dashPct = animated ? (s.value / total) : 0;
              const dash = dashPct * circumference;
              const gap  = circumference - dash;
              const el = (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="16"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offset * circumference}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: `stroke-dasharray ${0.6 + i * 0.1}s ease ${i * 0.08}s` }}
                />
              );
              offset += s.value / total;
              return el;
            })}
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>₹{Math.round(totalCost / 1000)}K</p>
            <p style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600 }}>RAIL</p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {segments.map(s => {
            const pctVal = Math.round((s.value / total) * 100);
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#475569', fontWeight: 500, flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{fmt(s.value)}</span>
                <span style={{ fontSize: 10, color: '#CBD5E1', minWidth: 28, textAlign: 'right' }}>{pctVal}%</span>
              </div>
            );
          })}
          {deliveryHours && (
            <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={11} color="#94A3B8" />
              <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>Est. Delivery: {deliveryHours} hrs</span>
            </div>
          )}
        </div>
      </div>
    </HoverCard>
  );
}

/* ════════════════════════════════════════
   COLD CHAIN + PACKAGING + WAREHOUSE DETAILS
════════════════════════════════════════ */
function LogisticsDetailCards({ rcb }: { rcb: any }) {
  if (!rcb) return null;
  const cc  = rcb.cold_chain;
  const pkg = rcb.packaging;
  const wh  = rcb.warehouse;
  const ins = rcb.insurance;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>

      {/* Cold Chain */}
      {cc && (
        <div style={{ ...card, padding: 18, background: 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(6,182,212,0.01))', borderColor: 'rgba(6,182,212,0.2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(6,182,212,0.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Snowflake size={15} color="#06B6D4" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Cold Chain</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: '#06B6D4' }}>{fmt(cc.cold_chain_total_inr)}</span>
          </div>
          {[
            { label: 'Distance',          value: `${cc.distance_km} km` },
            { label: 'Pre-Cooling',        value: fmt(cc.pre_cooling_cost) },
            { label: 'Reefer Transport',   value: fmt(cc.reefer_transport_extra) },
            { label: 'Cold Storage (Dest)', value: fmt(cc.cold_storage_destination) },
            { label: 'Temp Monitoring',    value: fmt(cc.temperature_monitoring) },
            { label: 'Compliance Cert',    value: fmt(cc.compliance_certification) },
            { label: 'Reefer/km',          value: `₹${cc.reefer_surcharge_per_km}/km` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{r.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>{r.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '5px 8px', borderRadius: 8, background: 'rgba(6,182,212,0.08)', fontSize: 9, color: '#06B6D4', fontWeight: 600 }}>
            {cc.cold_chain_applicable ? '✓ Cold Chain Required' : '— Not Required'}
          </div>
        </div>
      )}

      {/* Packaging */}
      {pkg && (
        <div style={{ ...card, padding: 18, background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(139,92,246,0.01))', borderColor: 'rgba(139,92,246,0.2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(139,92,246,0.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={15} color="#8B5CF6" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Packaging</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: '#8B5CF6' }}>{fmt(pkg.packaging_total_inr)}</span>
          </div>
          {[
            { label: 'Type',              value: pkg.packaging_type },
            { label: 'Cargo Category',    value: pkg.cargo_category },
            { label: 'Material Cost',     value: fmt(pkg.packaging_material_cost) },
            { label: 'Packing Labour',    value: fmt(pkg.packing_labour_cost) },
            { label: 'Cold Insulation',   value: fmt(pkg.cold_chain_insulation) },
            { label: 'Hazmat Fee',        value: fmt(pkg.hazmat_special_fee) },
            { label: 'Rate/kg',           value: `₹${pkg.rate_per_kg}/kg` },
          ].filter(r => r.value && r.value !== '—' && r.value !== '₹0').map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{r.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A', maxWidth: 130, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warehouse */}
      {wh && (
        <div style={{ ...card, padding: 18, background: 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(16,185,129,0.01))', borderColor: 'rgba(16,185,129,0.2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(16,185,129,0.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Warehouse size={15} color="#10B981" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Warehouse</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: '#10B981' }}>{fmt(wh.warehouse_total_inr)}</span>
          </div>
          {[
            { label: 'Handling In',        value: fmt(wh.handling_in) },
            { label: 'Handling Out',       value: fmt(wh.handling_out) },
            { label: 'Origin Storage',     value: fmt(wh.origin_storage_cost) },
            { label: 'Dest Storage',       value: fmt(wh.destination_storage_cost) },
            { label: 'Safety Stock Hold',  value: fmt(wh.safety_stock_holding_cost) },
            { label: 'Days at Origin',     value: `${wh.days_at_origin} days` },
            { label: 'Days at Dest',       value: `${wh.days_at_destination} days` },
            { label: 'Rate/kg/day',        value: `₹${wh.rate_per_kg_per_day}/kg/day` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{r.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Insurance + GST Info */}
      {ins && (
        <div style={{ ...card, padding: 18, background: 'linear-gradient(135deg, rgba(245,158,11,0.04), rgba(245,158,11,0.01))', borderColor: 'rgba(245,158,11,0.2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(245,158,11,0.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={15} color="#F59E0B" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Insurance</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: '#F59E0B' }}>{fmt(ins.total)}</span>
          </div>
          {[
            { label: 'Premium',        value: fmt(ins.premium) },
            { label: 'GST on Premium', value: fmt(ins.gst_on_premium) },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{r.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>{r.value}</span>
            </div>
          ))}
          {/* GST Info */}
          {rcb?.gst && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <FileText size={11} color="#3B82F6" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6' }}>GST Info</span>
              </div>
              {[
                { label: 'Freight GST Rate',   value: `${rcb.gst.rate_percent}%` },
                { label: 'GST Added to Cost',  value: fmt(rcb.gst.freight_gst_added_to_cost) },
                { label: 'Goods IGST (Info)',  value: fmt(rcb.gst.igst_on_goods_informational) },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>{r.value}</span>
                </div>
              ))}
              <p style={{ fontSize: 9, color: '#94A3B8', marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
                {rcb.gst.igst_note}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   BUDGET STATUS CARD
════════════════════════════════════════ */
function BudgetStatusCard({ r }: { r: any }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  const isWithin  = r.budget_status === 'WITHIN_BUDGET';
  const color     = isWithin ? '#10B981' : '#EF4444';
  const surplus   = r.budget_surplus   ?? 0;
  const shortfall = r.budget_shortfall ?? 0;

  // derive budget = total + surplus (or total - shortfall)
  const budget = isWithin ? (r.total_cost_inr + surplus) : (r.total_cost_inr - shortfall);
  const usedPct = budget > 0 ? Math.min(100, Math.round((r.total_cost_inr / budget) * 100)) : 0;

  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <DollarSign size={14} color={color} />
        <span style={sectionTitle}>Budget Status</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color, background: `${color}12`, padding: '2px 10px', borderRadius: 99, border: `1px solid ${color}25` }}>
          {isWithin ? '✓ WITHIN BUDGET' : '✗ OVER BUDGET'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Budget',  value: fmt(budget),             color: '#64748B' },
          { label: 'Actual Cost',   value: fmt(r.total_cost_inr),   color: '#F97316' },
          { label: isWithin ? 'Savings' : 'Shortfall', value: fmt(isWithin ? surplus : shortfall), color },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Budget Used</span>
          <span style={{ fontSize: 11, fontWeight: 800, color }}>{usedPct}%</span>
        </div>
        <div style={{ height: 10, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: animated ? `${usedPct}%` : '0%', background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
      </div>

      {r.budget_verdict && (
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, padding: '10px 12px', borderRadius: 10, background: `${color}06`, border: `1px solid ${color}18`, marginTop: 8 }}>
          💬 {r.budget_verdict}
        </p>
      )}
    </HoverCard>
  );
}

/* ════════════════════════════════════════
   COST SAVING TIP
════════════════════════════════════════ */
function CostSavingTip({ tip }: { tip: string }) {
  if (!tip) return null;
  return (
    <div style={{ padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(59,130,246,0.06))', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>Cost Saving Tip</p>
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{tip}</p>
      </div>
    </div>
  );
}
/* ════════════════════════════════════════
   TRANSPORT VISUAL (same as before)
════════════════════════════════════════ */
function TransportVisual({ mode }: { mode: string }) {
  const m = (mode ?? '').toLowerCase();
  const isAir   = m.includes('air') || m.includes('fly') || m.includes('plane') || m.includes('flight');
  const isShip  = m.includes('ship') || m.includes('sea') || m.includes('ocean') || m.includes('vessel') || m.includes('ferry') || m.includes('boat');
  const isTrain = m.includes('train') || m.includes('rail') || m.includes('railway');
  const scheme = isAir   ? { bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', border: 'rgba(59,130,246,0.25)',  accent: '#3B82F6', sky: '#BFDBFE' }
               : isShip  ? { bg: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border: 'rgba(16,185,129,0.25)',  accent: '#10B981', sky: '#A7F3D0' }
               : isTrain ? { bg: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)', border: 'rgba(249,115,22,0.25)',  accent: '#F97316', sky: '#FED7AA' }
               :           { bg: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border: 'rgba(139,92,246,0.25)',  accent: '#8B5CF6', sky: '#DDD6FE' };
  return (
    <div style={{ width: '100%', borderRadius: 16, padding: '20px 16px 16px', background: scheme.bg, border: `2px solid ${scheme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 160, height: 100 }}>
        {isAir   && <svg viewBox="0 0 160 100" fill="none" width="100%" height="100%"><ellipse cx="85" cy="52" rx="42" ry="13" fill={scheme.accent}/><path d="M50 52 L42 30 L58 45 Z" fill={scheme.accent} opacity="0.9"/><path d="M90 50 L115 28 L118 35 L95 52 Z" fill={scheme.accent} opacity="0.85"/><ellipse cx="110" cy="49" rx="4" ry="3" fill="white" opacity="0.9"/></svg>}
        {isShip  && <svg viewBox="0 0 160 100" fill="none" width="100%" height="100%"><path d="M20 70 L25 55 L135 55 L140 70 Q130 82 80 83 Q30 82 20 70 Z" fill={scheme.accent}/><rect x="30" y="42" width="100" height="14" rx="4" fill={scheme.accent} opacity="0.85"/><rect x="55" y="28" width="50" height="16" rx="5" fill={scheme.accent} opacity="0.9"/></svg>}
        {isTrain && <svg viewBox="0 0 160 100" fill="none" width="100%" height="100%"><rect x="22" y="42" width="72" height="40" rx="8" fill={scheme.accent}/><path d="M94 48 L115 52 L115 74 L94 78 Z" fill={scheme.accent} opacity="0.9"/><rect x="32" y="50" width="16" height="14" rx="3" fill="white" opacity="0.9"/></svg>}
        {!isAir && !isShip && !isTrain && <svg viewBox="0 0 160 100" fill="none" width="100%" height="100%"><rect x="10" y="38" width="90" height="44" rx="6" fill={scheme.accent} opacity="0.9"/><path d="M100 55 L100 82 L138 82 L138 62 Q138 45 122 42 L100 42 Z" fill={scheme.accent}/><path d="M104 47 L104 60 L132 60 L132 52 Q130 44 118 44 Z" fill="white" opacity="0.85"/>{[30,70,112,130].map(cx=><g key={cx}><circle cx={cx} cy="86" r="10" fill={scheme.accent} opacity="0.95"/><circle cx={cx} cy="86" r="6" fill={scheme.sky} opacity="0.6"/></g>)}</svg>}
      </div>
      <div style={{ padding: '5px 16px', borderRadius: 99, background: scheme.accent, color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', boxShadow: `0 4px 12px ${scheme.accent}44` }}>
        {mode || 'Transport'}
      </div>
    </div>
  );
}

function SupplierVisual({ name, city, quality, risk }: { name: string; city: string; quality?: number; risk?: string }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : 'S1';
  const rColor = risk ? riskHex(risk) : '#10B981';
  return (
    <div style={{ width: '100%', borderRadius: 16, padding: '20px 16px 16px', background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border: '2px solid rgba(16,185,129,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: `conic-gradient(${rColor} ${(quality??80)*3.6}deg, #E2E8F0 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-1px', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>{initials}</div>
        </div>
        <div style={{ position: 'absolute', bottom: -4, right: -4, background: rColor, color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99, border: '2px solid white' }}>{quality??'-'}%</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>{name||'Supplier'}</p>
        <p style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>📍 {city||'—'}</p>
      </div>
      <div style={{ padding: '4px 14px', borderRadius: 99, background: rColor, color: 'white', fontSize: 11, fontWeight: 800, letterSpacing: '0.6px', boxShadow: `0 3px 10px ${rColor}44` }}>{risk??'LOW'} RISK</div>
    </div>
  );
}

function RiskGauge({ risk, confidence }: { risk: string; confidence: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);
  const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
  const riskIdx = Math.max(0, riskLevels.indexOf((risk ?? '').toUpperCase()));
  const cx = 100; const cy = 95; const r = 65;
  const startAngle = Math.PI; const totalArc = Math.PI;
  const needleAngle = animated ? startAngle + (riskIdx / 2) * totalArc + totalArc / 6 : startAngle + totalArc / 6;
  const arcColors = [{ color: '#10B981', start: 0, end: 0.333 }, { color: '#F59E0B', start: 0.333, end: 0.666 }, { color: '#EF4444', start: 0.666, end: 1 }];
  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <AlertTriangle size={14} color="#F59E0B" /><span style={sectionTitle}>Risk Gauge</span>
      </div>
      <svg width="100%" viewBox="0 0 200 130">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#F1F5F9" strokeWidth="18" strokeLinecap="round" />
        {arcColors.map((a, i) => { const s = startAngle + a.start * totalArc; const e = startAngle + a.end * totalArc; const x1 = cx + r * Math.cos(s); const y1 = cy + r * Math.sin(s); const x2 = cx + r * Math.cos(e); const y2 = cy + r * Math.sin(e); return <path key={i} d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`} fill="none" stroke={a.color} strokeWidth="18" opacity="0.85" />; })}
        <line x1={cx} y1={cy} x2={cx + (r - 12) * Math.cos(needleAngle)} y2={cy + (r - 12) * Math.sin(needleAngle)} stroke="#1E293B" strokeWidth="3" strokeLinecap="round" style={{ transition: 'x2 1s cubic-bezier(0.34,1.56,0.64,1), y2 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
        <circle cx={cx} cy={cy} r="7" fill="#1E293B" /><circle cx={cx} cy={cy} r="3.5" fill="white" />
        <text x="18" y="115" fontSize="10" fill="#10B981" fontWeight="800" textAnchor="middle">LOW</text>
        <text x="100" y="22"  fontSize="10" fill="#F59E0B" fontWeight="800" textAnchor="middle">MED</text>
        <text x="182" y="115" fontSize="10" fill="#EF4444" fontWeight="800" textAnchor="middle">HIGH</text>
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize="13" fontWeight="900" fill={riskHex(risk ?? 'LOW')}>{(risk ?? 'LOW').toUpperCase()}</text>
      </svg>
      <div style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>AI Confidence</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#F97316' }}>{confidence}%</span>
        </div>
        <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${confidence}%`, background: 'linear-gradient(90deg, #F97316, #FBBF24)', borderRadius: 99, transition: 'width 1.4s ease 0.4s' }} />
        </div>
      </div>
    </HoverCard>
  );
}

function AgentRadarChart({ scores }: { scores: { label: string; value: number; color: string }[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);
  const maxR = 55; const cx = 100; const cy = 105;
  const angleStep = (2 * Math.PI) / scores.length;
  const points = scores.map((s, i) => { const angle = i * angleStep - Math.PI / 2; const r = animated ? (s.value / 100) * maxR : 0; return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }; });
  const bgPoints = scores.map((_, i) => { const angle = i * angleStep - Math.PI / 2; return { x: cx + maxR * Math.cos(angle), y: cy + maxR * Math.sin(angle) }; });
  const toPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Zap size={14} color="#F97316" /><span style={sectionTitle}>Agent Performance Radar</span>
      </div>
      <svg width="100%" viewBox="0 0 200 195">
        {[0.25, 0.5, 0.75, 1].map(ratio => (<path key={ratio} d={toPath(scores.map((_, i) => { const angle = i * angleStep - Math.PI / 2; const r = ratio * maxR; return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }; }))} fill={ratio === 1 ? 'rgba(241,245,249,0.6)' : 'none'} stroke="#E2E8F0" strokeWidth={ratio === 1 ? 1.5 : 1} />))}
        {bgPoints.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E2E8F0" strokeWidth="1" />)}
        <path d={toPath(points)} fill="rgba(249,115,22,0.15)" stroke="#F97316" strokeWidth="2.5" strokeLinejoin="round" style={{ transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
        {points.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r="7" fill={scores[i].color} opacity="0.15" /><circle cx={p.x} cy={p.y} r="4.5" fill={scores[i].color} stroke="white" strokeWidth="2" /></g>))}
        {scores.map((s, i) => { const angle = i * angleStep - Math.PI / 2; const labelR = maxR + 26; const lx = cx + labelR * Math.cos(angle); const ly = cy + labelR * Math.sin(angle); const words = s.label.split(' '); return (<g key={i}>{words.length === 1 ? <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#475569" fontWeight="700">{s.label}</text> : <><text x={lx} y={ly - 5} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#475569" fontWeight="700">{words[0]}</text><text x={lx} y={ly + 6} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#475569" fontWeight="700">{words.slice(1).join(' ')}</text></>}<text x={lx} y={ly + (words.length > 1 ? 17 : 11)} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill={s.color} fontWeight="800">{s.value}%</text></g>); })}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {scores.map(s => (<div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: `${s.color}15`, border: `1px solid ${s.color}30` }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} /><span style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.label}: {s.value}%</span></div>))}
      </div>
    </HoverCard>
  );
}

function TimelineChart({ trend, peakMonth, deliveryHours, product }: { trend: string; peakMonth: string; deliveryHours?: number; product: string }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t); }, []);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const peakIdx = months.findIndex(m => m.toLowerCase() === (peakMonth ?? '').toLowerCase().slice(0,3));
  const demandData = months.map((_, i) => { const dist = Math.abs(i - (peakIdx >= 0 ? peakIdx : 5)); return Math.round(30 + (100 - dist * 14) * 0.65); });
  const maxD = Math.max(...demandData); const minD = Math.min(...demandData);
  const chartH = 64; const chartW = 208; const padL = 16; const padTop = 8;
  const getX = (i: number) => padL + (i / (months.length - 1)) * chartW;
  const getY = (v: number) => padTop + chartH - ((v - minD) / (maxD - minD + 1)) * chartH;
  const linePoints = demandData.map((v, i) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(' ');
  const areaPath = `M ${getX(0)} ${padTop + chartH} ` + demandData.map((v, i) => `L ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ') + ` L ${getX(11)} ${padTop + chartH} Z`;
  return (
    <HoverCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <TrendingUp size={14} color="#3B82F6" /><span style={sectionTitle}>Demand Trend — {product}</span>
      </div>
      <svg width="100%" viewBox="0 0 240 115">
        <defs><linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" /><stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" /></linearGradient><clipPath id="chartClip"><rect x={padL} y={padTop} width={chartW} height={chartH} /></clipPath></defs>
        <path d={areaPath} fill="url(#demandGrad)" clipPath="url(#chartClip)" style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.8s ease' }} />
        <polyline points={linePoints} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" clipPath="url(#chartClip)" style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.6s ease 0.2s' }} />
        {demandData.map((v, i) => <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill="#3B82F6" stroke="white" strokeWidth="1.5" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.1 + i * 0.04}s` }} />)}
        {months.map((m, i) => <text key={m} x={getX(i)} y={padTop + chartH + 16} textAnchor="middle" fontSize="7.5" fill="#94A3B8" fontWeight="600">{m}</text>)}
      </svg>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {[
          { label: `${trend === 'INCREASING' ? '↑' : trend === 'DECREASING' ? '↓' : '→'} ${trend}`, bg: trend === 'INCREASING' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: trend === 'INCREASING' ? '#10B981' : '#3B82F6' },
          ...(peakMonth ? [{ label: `📅 Peak: ${peakMonth}`, bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' }] : []),
          ...(deliveryHours ? [{ label: `⏱ ${deliveryHours}h delivery`, bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' }] : []),
        ].map((b, i) => (<div key={i} style={{ padding: '4px 12px', borderRadius: 99, background: b.bg, color: b.color, fontSize: 11, fontWeight: 700 }}>{b.label}</div>))}
      </div>
    </HoverCard>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function ManagerDashboardPage() {
  const [data,    setData]    = useState<SupabaseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [alerts,  setAlerts]  = useState<LiveAlert[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('manager_auth') !== 'true') navigate('/manager-auth');
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getLatestAnalysis(), getActiveAlerts()]).then(([analysis, activeAlerts]) => {
      setData(analysis);
      setAlerts(activeAlerts);
      setLoading(false);
      setTimeout(() => setMounted(true), 50);
    });
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      ?.channel('manager-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_alerts' }, () => { getActiveAlerts().then(setAlerts); })
      .subscribe();
    return () => { channel?.unsubscribe(); };
  }, []);

  const handleLogout = () => { sessionStorage.removeItem('manager_auth'); navigate('/'); };

  const r          = data?.result;
  const confidence = r ? normPct(r.confidence_score ?? 0) : 0;
  const dcfg       = r ? decisionCfg(r.decision ?? '') : null;
  const circumference = 2 * Math.PI * 26;

  const rcb = (r as any)?.real_cost_breakdown ?? null;

  const routeMode = r?.best_route
    ? (typeof r.best_route === 'object' ? (r.best_route as any).mode : String(r.best_route))
    : '';
  const routeDetails = typeof r?.best_route === 'object' ? r.best_route : null;

  // Parse supplier
  const rawStr      = typeof r?.best_supplier === 'string' ? r.best_supplier : '';
  const supplierObj = typeof r?.best_supplier === 'object' ? r?.best_supplier : null;
  const extractedName = rawStr.includes('Best Supplier:') ? rawStr.split('Best Supplier:')[1]?.split(',')[0]?.trim() : rawStr.split(',')[0]?.trim();
  const extractedCity = rawStr.includes('Supplier City:') ? rawStr.split('Supplier City:')[1]?.split(',')[0]?.trim() : '—';
  const extractedRisk = rawStr.includes('Supplier Risk:') ? rawStr.split('Supplier Risk:')[1]?.split(',')[0]?.trim() : undefined;

  const supplierName    = (supplierObj?.name ?? extractedName) || 'Supplier';
  const supplierCity    = supplierObj?.supplier_city ?? extractedCity ?? '—';
  const supplierQuality = supplierObj?.quality_score ?? (r as any)?.supplier_score;
  const supplierRisk    = supplierObj?.supplier_risk ?? extractedRisk;

  // Auto-detects scale: if value <= 10 → multiply by 10 (out of 10 scale), else use as-is (already %)
  const toRadarPct = (v: any, fallback: number): number => {
    if (v == null || isNaN(Number(v))) return fallback;
    const n = Number(v);
    return Math.min(100, Math.round(n <= 10 ? n * 10 : n));
  };

  const agentScores = r ? [
    { label: 'Demand Score',   value: toRadarPct((r as any).demand_score,   confidence), color: '#F97316' },
    { label: 'Route Score',    value: toRadarPct((r as any).route_score,    confidence), color: '#3B82F6' },
    { label: 'Supplier Score', value: toRadarPct((r as any).supplier_score, confidence), color: '#10B981' },
    { label: 'Risk Safety',    value: toRadarPct((r as any).risk_score,     confidence), color: '#F59E0B' },
    { label: 'Cost Score',     value: toRadarPct((r as any).cost_score,     confidence), color: '#8B5CF6' },
  ] : [];

  const fadeIn = (delay = 0): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>

      {/* ══ TOPBAR ══ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #E2E8F0', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(249,115,22,0.28)' }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Supply<span style={{ color: '#F97316' }}>AI</span></span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', background: 'linear-gradient(135deg, #F97316, #3B82F6)', color: 'white', padding: '2px 7px', borderRadius: 6 }}>PRO</span>
          <ChevronRight size={14} color="#CBD5E1" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Shield size={14} color="#F97316" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>Manager Dashboard</span>
          </div>
          {alerts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 99, padding: '4px 10px', marginLeft: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'blink 1s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{alerts.length} Alert{alerts.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {data && <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Last analysis: {new Date(data.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
          <button onClick={() => setRefresh(p => p + 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; e.currentTarget.style.color = '#F97316'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#F97316' }}>
            <Crown size={13} /> Manager
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.13)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}>
            <LogOut size={13} /> Exit
          </button>
        </div>
      </header>

      {/* ══ CONTENT ══ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

        <div style={{ marginBottom: 32, ...fadeIn(0) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(249,115,22,0.08)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Crown size={20} /></div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>Manager Overview</h1>
              <p style={{ fontSize: 14, color: '#94A3B8' }}>Latest AI analysis — full data view. Only visible to you.</p>
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
            <RefreshCw size={28} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14 }}>Fetching latest analysis from Supabase...</p>
          </div>
        )}

        {!loading && !data && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <BarChart3 size={40} color="#E2E8F0" style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#CBD5E1' }}>No analysis found</p>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>Run an analysis from the Analyze page first.</p>
          </div>
        )}

        {!loading && data && r && dcfg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ══ LIVE ALERTS ══ */}
            {alerts.length > 0 && (
              <div style={fadeIn(0)}>
                <div style={{ ...card, border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={16} color="#EF4444" />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>🚨 Live Alerts — Action Required</p>
                        <p style={{ fontSize: 11, color: '#94A3B8' }}>Click WhatsApp button to notify supplier</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 99, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'blink 1s infinite' }} />
                      {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {alerts.map(alert => (
                      <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', background: alertBg(alert.type), border: `1px solid ${alertBorder(alert.type)}`, borderLeft: `4px solid ${alertDot(alert.type)}`, borderRadius: 14, transition: 'all 0.2s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; }}>
                        <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{alert.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: alertDot(alert.type) + '18', color: alertDot(alert.type), textTransform: 'uppercase', letterSpacing: '0.5px' }}>{alert.type}</span>
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>{timeAgo(alert.created_at)}</span>
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>·</span>
                            <span style={{ fontSize: 10, color: alertDot(alert.type), fontWeight: 600 }}>{alert.source}</span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{alert.title}</p>
                          <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>{alert.description}</p>
                        </div>
                        <WhatsAppAlertButton alert={alert} supplierName={supplierName} supplierCity={supplierCity} product={r.product ?? ''} destination={r.destination ?? ''} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ ROW 1: Decision + Shipment Info ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, ...fadeIn(50) }}>
              <div style={{ ...card, border: `1px solid ${dcfg.border}`, background: dcfg.bg }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <BarChart3 size={14} color="#F97316" /><span style={sectionTitle}>AI Decision</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ color: dcfg.color }}>{dcfg.icon}</div>
                    <p style={{ fontSize: 32, fontWeight: 900, color: dcfg.color, lineHeight: 1 }}>{r.decision ?? 'N/A'}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginBottom: 6 }}>Confidence</p>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <svg width="68" height="68" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#E2E8F0" strokeWidth="6" />
                        <circle cx="32" cy="32" r="26" fill="none" stroke={dcfg.color} strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={circumference} strokeDashoffset={mounted ? circumference * (1 - confidence / 100) : circumference}
                          transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s' }} />
                      </svg>
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 13, fontWeight: 800, color: dcfg.color }}>{confidence}%</span>
                    </div>
                  </div>
                </div>
                {/* Budget + Scores summary under decision */}
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Demand',   value: normPct((r as any).demand_score ?? 0),   color: '#F97316' },
                    { label: 'Supplier', value: normPct((r as any).supplier_score ?? 0), color: '#10B981' },
                    { label: 'Risk',     value: normPct((r as any).risk_score ?? 0),      color: '#EF4444' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 10, background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
                      <p style={{ fontSize: 16, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 9, color: '#94A3B8', marginTop: 3, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...card }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <Package size={14} color="#F97316" /><span style={sectionTitle}>Shipment Info</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Product',          value: r.product                          ?? '-',  isRisk: false },
                    { label: 'Origin',            value: r.origin                           ?? '-',  isRisk: false },
                    { label: 'Destination',       value: r.destination                      ?? '-',  isRisk: false },
                    { label: 'Recommended Mode',  value: (r as any).recommended_mode        ?? '-',  isRisk: false },
                    { label: 'Demand Trend',      value: r.demand_trend                     ?? '-',  isRisk: false },
                    { label: 'Peak Month',        value: r.peak_month                       ?? '-',  isRisk: false },
                    { label: 'Overall Risk',      value: r.overall_risk                     ?? '-',  isRisk: true  },
                    { label: 'Budget Status',     value: (r as any).budget_status           ?? '-',  isRisk: false },
                    { label: 'Distance',          value: rcb?.distance_km ? `${rcb.distance_km} km` : '-', isRisk: false },
                    { label: 'Delivery (hrs)',    value: r.estimated_delivery_hours ? `${r.estimated_delivery_hours} hrs` : '-', isRisk: false },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 12px', cursor: 'default', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F1F5F9'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}>
                      <p style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: item.isRisk ? riskHex(item.value) : '#0F172A' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ ROW 2: Budget Status ══ */}
            <div style={fadeIn(100)}>
              <BudgetStatusCard r={r} />
            </div>

            {/* ══ ROW 3: Route + Supplier + Detailed Cost Donut ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, ...fadeIn(150) }}>
              <HoverCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Truck size={14} color="#3B82F6" /><span style={sectionTitle}>Best Route</span>
                </div>
                <TransportVisual mode={routeMode} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                  {[
                    { label: 'Route',      value: typeof r.best_route === 'string' ? r.best_route : routeMode },
                    { label: 'Distance',   value: rcb?.distance_km ? `${rcb.distance_km} km` : '—' },
                    { label: 'Time (Rail)', value: rcb?.rail?.time_hrs ? `${rcb.rail.time_hrs} hrs` : '—' },
                    { label: 'Fastest',    value: rcb?.fastest_mode  ?? '—' },
                    { label: 'Cheapest',   value: rcb?.cheapest_mode ?? '—' },
                    { label: 'Cheapest Cost', value: fmt(rcb?.cheapest_total) },
                    ...(routeDetails ? [
                      { label: 'Mode',     value: routeDetails.mode },
                      { label: 'Time',     value: `${routeDetails.estimated_time_hours} hrs` },
                      { label: 'Cost',     value: fmt(routeDetails.route_cost_inr) },
                    ] : []),
                  ].filter(row => row.value && row.value !== '—').map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', borderRadius: 8 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F1F5F9'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; }}>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </HoverCard>

              <HoverCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Factory size={14} color="#10B981" /><span style={sectionTitle}>Best Supplier</span>
                </div>
                <SupplierVisual name={supplierName} city={supplierCity} quality={supplierQuality} risk={supplierRisk} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                  {[
                    { label: 'Name',          value: supplierName,                  isRisk: false },
                    { label: 'City',          value: supplierCity,                  isRisk: false },
                    { label: 'Risk Level',    value: supplierRisk ?? '—',           isRisk: true  },
                    { label: 'Quality Score', value: supplierQuality ? `${supplierQuality}%` : '—', isRisk: false },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', borderRadius: 8 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F1F5F9'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; }}>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: row.isRisk && row.value !== '—' ? riskHex(row.value) : '#0F172A' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <GoMsgButton supplierName={supplierName} supplierCity={supplierCity} analysisId={data?.id ?? ''} routeMode={routeMode} distanceKm={rcb?.distance_km} estimatedHours={routeDetails?.estimated_time_hours ?? r.estimated_delivery_hours} product={r.product ?? ''} destination={r.destination ?? ''} />
              </HoverCard>

              <DetailedCostBreakdown rcb={rcb} totalCost={r.total_cost_inr ?? 0} deliveryHours={r.estimated_delivery_hours} />
            </div>

            {/* ══ ROW 4: Mode Comparison ══ */}
            {rcb && (
              <div style={fadeIn(200)}>
                <ModeComparisonTable rcb={rcb} recommendedMode={(r as any).recommended_mode ?? 'RAIL'} />
              </div>
            )}

            {/* ══ ROW 5: Cold Chain + Packaging + Warehouse + Insurance ══ */}
            {rcb && (
              <div style={fadeIn(250)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Info size={14} color="#64748B" />
                  <span style={{ ...sectionTitle }}>Detailed Logistics Cost Breakdown</span>
                </div>
                <LogisticsDetailCards rcb={rcb} />
              </div>
            )}

            {/* ══ ROW 6: Radar + Risk Gauge ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, ...fadeIn(300) }}>
              <AgentRadarChart scores={agentScores} />
              <RiskGauge risk={r.overall_risk ?? 'LOW'} confidence={confidence} />
            </div>

            {/* ══ ROW 7: Timeline + Risk Factors + Recommendation ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, ...fadeIn(350) }}>
              <TimelineChart trend={r.demand_trend ?? 'STABLE'} peakMonth={r.peak_month ?? ''} deliveryHours={r.estimated_delivery_hours} product={r.product ?? 'Product'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <HoverCard>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <AlertTriangle size={14} color="#F59E0B" /><span style={sectionTitle}>Risk Factors</span>
                  </div>
                  {(r.risk_factors ?? []).length === 0 ? (
                    <p style={{ fontSize: 13, color: '#94A3B8' }}>No risk factors detected.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {(r.risk_factors ?? []).map((f: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', cursor: 'default', transition: 'all 0.2s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(245,158,11,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(245,158,11,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; }}>
                          <AlertTriangle size={12} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </HoverCard>
                <div style={{ ...card, background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.15)', borderLeft: '4px solid #F97316', flex: 1 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(249,115,22,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Package size={14} color="#F97316" />
                    <span style={{ ...sectionTitle, color: '#F97316' }}>Final Recommendation</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75 }}>{r.final_recommendation ?? '-'}</p>
                </div>
              </div>
            </div>

            {/* ══ COST SAVING TIP ══ */}
            {(r as any).cost_saving_tip && (
              <div style={fadeIn(400)}>
                <CostSavingTip tip={(r as any).cost_saving_tip} />
              </div>
            )}

          </div>
        )}
      </div>

      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
