// src/pages/ReportsPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import {
    FileText, Search, Download, BarChart3, TrendingUp,
    CheckCircle, AlertTriangle, XCircle, Clock, Zap, Filter,
} from 'lucide-react';
import type { RiskLevel, Decision } from '../lib/constants';
import { getAllAnalyses, type SupabaseAnalysis } from '../lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseOriginDest(best_route: string): { origin: string; destination: string } {
    if (!best_route) return { origin: '', destination: '' };
    const fromTo = best_route.match(/from\s+([A-Za-z\s]+?)\s+to\s+([A-Za-z\s]+?)(?:\s*[,.]|$)/i);
    if (fromTo) return { origin: fromTo[1].trim(), destination: fromTo[2].trim() };
    const arrow = best_route.match(/([A-Za-z\s]+?)\s*[→\-–]\s*([A-Za-z\s]+)/);
    if (arrow) return { origin: arrow[1].trim(), destination: arrow[2].trim() };
    return { origin: '', destination: '' };
}

function getOriginDest(result: SupabaseAnalysis['result']): { origin: string; destination: string } {
    const r = result as any;
    const directOrigin = r.origin ?? r.origin_city ?? '';
    const directDest   = r.destination ?? r.destination_city ?? '';
    if (directOrigin && directDest) return { origin: directOrigin, destination: directDest };
    const br = typeof r.best_route === 'string' ? r.best_route : '';
    return parseOriginDest(br);
}

const knownProducts = [
    'Pharma','Electronics','FMCG','Automotive','Kirana','Cloth',
    'Furniture','Appliances','Rice','Wheat','Chemicals','Steel',
    'Plastics','Medical Devices','Cosmetics','Food Products',
];

function getProduct(result: SupabaseAnalysis['result']): string {
    const r = result as any;
    if (r.product && r.product !== '—' && r.product !== '') return String(r.product);
    const sup = typeof r.best_supplier === 'string' ? r.best_supplier : (r.best_supplier?.name ?? '');
    for (const k of knownProducts) if (sup.toLowerCase().includes(k.toLowerCase())) return k;
    const rec = r.final_recommendation ?? '';
    for (const k of knownProducts) if (rec.toLowerCase().includes(k.toLowerCase())) return k;
    const br = typeof r.best_route === 'string' ? r.best_route : '';
    for (const k of knownProducts) if (br.toLowerCase().includes(k.toLowerCase())) return k;
    return '—';
}

const fallbackPalette = [
    '#F97316','#3B82F6','#10B981','#8B5CF6',
    '#06B6D4','#EC4899','#F59E0B','#EF4444',
    '#14B8A6','#6366F1','#84CC16','#A855F7',
];

function getColorForEntry(product: string, routeKey: string): string {
    const pColor = productColor[product];
    if (pColor) return pColor;
    let hash = 0;
    for (let i = 0; i < routeKey.length; i++) hash = routeKey.charCodeAt(i) + ((hash << 5) - hash);
    return fallbackPalette[Math.abs(hash) % fallbackPalette.length];
}

function getDisplayLabel(product: string, origin: string, destination: string, result: SupabaseAnalysis['result']): string {
    if (product !== '—') return product;
    if (origin && destination) return `${origin.split(' ')[0]} → ${destination.split(' ')[0]}`;
    if (origin) return origin.split(' ')[0];
    const r = result as any;
    const br = typeof r.best_route === 'string' ? r.best_route : '';
    if (br) return br.substring(0, 12).trim();
    return 'Shipment';
}

function fmtCost(val: number | undefined | null): string {
    if (val == null || isNaN(Number(val))) return '—';
    return '₹' + Math.round(Number(val)).toLocaleString('en-IN');
}

function normConf(v: number | undefined | null): number {
    if (v == null || isNaN(Number(v))) return 0;
    const n = Number(v);
    const pct = n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
    return Math.min(100, Math.max(0, pct));
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dedupeByContent(arr: SupabaseAnalysis[]): SupabaseAnalysis[] {
    const seen = new Set<string>();
    return arr.filter(a => {
        const r = a.result as any;
        const key = [
            r.best_route ?? '',
            r.total_cost_inr ?? '',
            r.decision ?? '',
            r.overall_risk ?? '',
        ].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const decisionVariant: Record<Decision, 'success' | 'warning' | 'danger'> = {
    'SHIP NOW': 'success', 'DELAY': 'warning', 'CANCEL': 'danger',
};
const riskHex = (r: RiskLevel) => r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';
const productColor: Record<string, string> = {
    Pharma: '#F97316', Electronics: '#3B82F6', FMCG: '#10B981',
    Automotive: '#8B5CF6', Kirana: '#06B6D4', Cloth: '#EC4899',
    Furniture: '#F59E0B', Appliances: '#EF4444',
    Rice: '#10B981', Wheat: '#F59E0B', Chemicals: '#EF4444',
    Steel: '#64748B', Plastics: '#3B82F6',
    'Medical Devices': '#8B5CF6', Cosmetics: '#EC4899', 'Food Products': '#10B981',
};
const decisionHex: Record<string, string> = { 'SHIP NOW': '#10B981', 'DELAY': '#F59E0B', 'CANCEL': '#EF4444' };
const decisionIcon: Record<string, string> = { 'SHIP NOW': '✓', 'DELAY': '⏳', 'CANCEL': '✕' };
const filters: Decision[] = ['SHIP NOW', 'DELAY', 'CANCEL'];
const tableHeaders = ['#', 'Product', 'Route', 'Decision', 'Risk', 'Confidence', 'Cost', 'Date'];
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 20, transition: 'all 0.25s ease' };
const decisionTrend = [
    { month: 'Sep', ship: 41, delay: 7,  cancel: 2 },
    { month: 'Oct', ship: 38, delay: 9,  cancel: 3 },
    { month: 'Nov', ship: 45, delay: 6,  cancel: 1 },
    { month: 'Dec', ship: 50, delay: 8,  cancel: 4 },
    { month: 'Jan', ship: 48, delay: 5,  cancel: 2 },
    { month: 'Feb', ship: 45, delay: 3,  cancel: 1 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const [analyses,     setAnalyses]     = useState<SupabaseAnalysis[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [activeFilter, setActiveFilter] = useState<'All' | Decision>('All');

    useEffect(() => {
        getAllAnalyses().then(data => {
            setAnalyses(dedupeByContent(data));
            setLoading(false);
        });
    }, []);

    const filtered    = activeFilter === 'All' ? analyses : analyses.filter(a => a.result.decision === activeFilter);
    const shipCount   = analyses.filter(a => a.result.decision === 'SHIP NOW').length;
    const delayCount  = analyses.filter(a => a.result.decision === 'DELAY').length;
    const cancelCount = analyses.filter(a => a.result.decision === 'CANCEL').length;
    const avgConf     = analyses.length > 0
        ? Math.round(analyses.reduce((s, a) => s + normConf(a.result.confidence_score), 0) / analyses.length)
        : 0;

    const recentEight = analyses.slice(0, 8);
    const maxDecisionCount = Math.max(shipCount, delayCount, cancelCount, 1);

    const decisionItems = [
        {
            label: 'SHIP NOW', count: shipCount,   color: '#10B981',
            gradient: 'linear-gradient(180deg, #34D399, #10B981, #059669)',
            bg: 'rgba(16,185,129,0.06)', icon: <CheckCircle size={20} />,
        },
        {
            label: 'DELAY',    count: delayCount,  color: '#F59E0B',
            gradient: 'linear-gradient(180deg, #FCD34D, #F59E0B, #D97706)',
            bg: 'rgba(245,158,11,0.06)', icon: <AlertTriangle size={20} />,
        },
        {
            label: 'CANCEL',   count: cancelCount, color: '#EF4444',
            gradient: 'linear-gradient(180deg, #FCA5A5, #EF4444, #DC2626)',
            bg: 'rgba(239,68,68,0.06)', icon: <XCircle size={20} />,
        },
    ];

    const exportCSV = () => {
        const rows = [
            ['Product', 'Origin', 'Destination', 'Decision', 'Risk', 'Confidence', 'Cost (INR)', 'Date'],
            ...analyses.map(a => {
                const { origin, destination } = getOriginDest(a.result);
                return [
                    getProduct(a.result), origin, destination,
                    a.result.decision, a.result.overall_risk,
                    `${normConf(a.result.confidence_score)}%`,
                    a.result.total_cost_inr ?? '',
                    new Date(a.created_at).toLocaleString('en-IN'),
                ];
            }),
        ];
        const csv  = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const el   = document.createElement('a');
        el.href = url; el.download = 'supply_ai_reports.csv'; el.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in-up" style={{ width: '100%' }}>

            {/* ══ HEADER ══ */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: 'rgba(59,130,246,0.08)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>Reports & Audit Trail</h1>
                        <p style={{ fontSize: 14, color: '#94A3B8' }}>Complete history of all AI analyses, decisions and justifications</p>
                    </div>
                </div>
                <Link to="/analyze">
                    <button className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.28)' }}>
                        <Search size={14} /> New Analysis
                    </button>
                </Link>
            </div>

            {/* ══ STAT CARDS ══ */}
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { val: loading ? '...' : String(analyses.length), label: 'Total Analyses', color: '#F97316', icon: <BarChart3 size={16} /> },
                    { val: loading ? '...' : String(shipCount),        label: 'SHIP NOW',       color: '#10B981', icon: <CheckCircle size={16} /> },
                    { val: loading ? '...' : String(delayCount),       label: 'DELAY',          color: '#F59E0B', icon: <AlertTriangle size={16} /> },
                    { val: loading ? '...' : String(cancelCount),      label: 'CANCEL',         color: '#EF4444', icon: <XCircle size={16} /> },
                    { val: loading ? '...' : `${avgConf}%`,            label: 'Avg Confidence', color: '#8B5CF6', icon: <TrendingUp size={16} /> },
                ].map((s, idx) => (
                    <div key={s.label} className="animate-fade-in-up"
                        style={{ ...card, textAlign: 'center', padding: '18px 14px', animationDelay: `${idx * 60}ms` }}
                        onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.boxShadow = '0 12px 28px rgba(0,0,0,0.07)'; d.style.borderColor = `${s.color}33`; }}
                        onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; d.style.borderColor = '#E2E8F0'; }}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>{s.icon}</div>
                        <p style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.val}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ══ TABLE ══ */}
            <div className="animate-fade-in-up" style={{ ...card, padding: '20px 0', overflow: 'hidden', marginBottom: 24 }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '0 20px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Filter size={14} color="#F97316" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Analysis History</span>
                        <span style={{ fontSize: 11, color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '2px 10px', fontWeight: 600 }}>
                            {filtered.length} records
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(['All', ...filters] as const).map(f => {
                            const isActive = activeFilter === f;
                            const col = f === 'All' ? '#F97316' : f === 'SHIP NOW' ? '#10B981' : f === 'DELAY' ? '#F59E0B' : '#EF4444';
                            return (
                                <button key={f} onClick={() => setActiveFilter(f as any)}
                                    style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 99, cursor: 'pointer', border: `1px solid ${isActive ? col : '#E2E8F0'}`, background: isActive ? `${col}12` : '#F8FAFC', color: isActive ? col : '#94A3B8', transition: 'all 0.2s ease' }}>
                                    {f}
                                </button>
                            );
                        })}
                    </div>
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
                            {loading ? (
                                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading analyses...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No records found</td></tr>
                            ) : filtered.map((a, i) => {
                                const { origin, destination } = getOriginDest(a.result);
                                const product  = getProduct(a.result);
                                const conf     = normConf(a.result.confidence_score);
                                const routeKey = `${origin}${destination}`;
                                const pColor   = getColorForEntry(product, routeKey);
                                const label    = getDisplayLabel(product, origin, destination, a.result);
                                return (
                                    <tr key={a.id}
                                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.2s ease', cursor: 'default' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFF'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                                    >
                                        <td style={{ padding: '13px 18px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#F97316', background: 'rgba(249,115,22,0.07)', padding: '3px 9px', borderRadius: 7 }}>#{i + 1}</span>
                                        </td>
                                        <td style={{ padding: '13px 18px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 7, background: `${pColor}15`, color: pColor, whiteSpace: 'nowrap', border: `1px solid ${pColor}25` }}>
                                                {label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                            {origin || '—'} → {destination || '—'}
                                        </td>
                                        <td style={{ padding: '13px 18px' }}>
                                            <StatusBadge status={a.result.decision as Decision} variant={decisionVariant[a.result.decision as Decision] ?? 'accent'} />
                                        </td>
                                        <td style={{ padding: '13px 18px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: riskHex(a.result.overall_risk as RiskLevel) }}>{a.result.overall_risk ?? '—'}</span>
                                        </td>
                                        <td style={{ padding: '13px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 60, height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                                                    <div style={{ height: '100%', width: `${conf}%`, background: 'linear-gradient(90deg, #F97316, #3B82F6)', borderRadius: 99 }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{conf}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                            {fmtCost(a.result.total_cost_inr)}
                                        </td>
                                        <td style={{ padding: '13px 18px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                                                <Clock size={10} /> {timeAgo(a.created_at)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══ DECISION TREND ══ */}
            <div style={{ ...card, marginBottom: 24 }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <TrendingUp size={15} color="#F97316" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Monthly Decision Trend</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
                        {[{ label: 'SHIP NOW', color: '#10B981' }, { label: 'DELAY', color: '#F59E0B' }, { label: 'CANCEL', color: '#EF4444' }].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 120 }}>
                    {decisionTrend.map((m, i) => (
                        <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90, width: '100%', justifyContent: 'center' }}>
                                {[{ val: m.ship, color: '#10B981' }, { val: m.delay, color: '#F59E0B' }, { val: m.cancel, color: '#EF4444' }].map((b, j) => (
                                    <div key={j} style={{ flex: 1, maxWidth: 12, height: `${Math.round((b.val / 55) * 90)}px`, background: b.color, borderRadius: '4px 4px 0 0', opacity: 0.85, minHeight: 4 }} />
                                ))}
                            </div>
                            <span style={{ fontSize: 11, color: i === decisionTrend.length - 1 ? '#F97316' : '#94A3B8', fontWeight: i === decisionTrend.length - 1 ? 700 : 500 }}>{m.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ DECISION BREAKDOWN + RECENT SPLIT ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>

                {/* ✅ FIXED Decision Breakdown — 3 tall vertical bars filling the card */}
                <div style={{ ...card, display: 'flex', flexDirection: 'column', minHeight: 360 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <BarChart3 size={15} color="#F97316" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Decision Breakdown</span>
                        {!loading && analyses.length > 0 && (
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>{analyses.length} total</span>
                        )}
                    </div>

                    {analyses.length === 0 && !loading ? (
                        <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '40px 0' }}>No data yet</p>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', gap: 14, alignItems: 'flex-end' }}>
                            {decisionItems.map(item => {
                                const pct = analyses.length > 0 ? Math.round((item.count / analyses.length) * 100) : 0;
                                // bar height relative to the tallest bar, minimum 8px visual
                                const barPct = Math.max((item.count / maxDecisionCount) * 100, 4);
                                return (
                                    <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, height: '100%' }}>

                                        {/* Floating count above bar */}
                                        <div style={{ textAlign: 'center', marginBottom: 8, flexShrink: 0 }}>
                                            <p style={{ fontSize: 30, fontWeight: 900, color: item.color, lineHeight: 1 }}>
                                                {loading ? '–' : item.count}
                                            </p>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: item.color, opacity: 0.65 }}>{pct}%</p>
                                        </div>

                                        {/* Bar track */}
                                        <div style={{
                                            flex: 1,
                                            width: '100%',
                                            background: `${item.color}10`,
                                            borderRadius: 16,
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-end',
                                            border: `1px solid ${item.color}18`,
                                            minHeight: 180,
                                        }}>
                                            <div style={{
                                                width: '100%',
                                                height: `${barPct}%`,
                                                background: item.gradient,
                                                borderRadius: 16,
                                                minHeight: 16,
                                                transition: 'height 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                boxShadow: `0 -6px 20px ${item.color}35`,
                                            }} />
                                        </div>

                                        {/* Label row below bar */}
                                        <div style={{
                                            marginTop: 10, width: '100%', textAlign: 'center',
                                            padding: '8px 4px', borderRadius: 12,
                                            background: `${item.color}08`,
                                            border: `1px solid ${item.color}15`,
                                            flexShrink: 0,
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: item.color }}>{item.icon}</div>
                                            <span style={{ fontSize: 9, fontWeight: 800, color: item.color, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
                                                {item.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Analysis Split */}
                <div style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <BarChart3 size={15} color="#3B82F6" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Recent Analysis Split</span>
                    </div>

                    {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Loading...</p>}
                    {!loading && recentEight.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No analyses yet</p>}

                    {!loading && recentEight.map((a, i) => {
                        const product  = getProduct(a.result);
                        const conf     = normConf(a.result.confidence_score);
                        const { origin, destination } = getOriginDest(a.result);
                        const routeKey = `${origin}${destination}`;
                        const pColor   = getColorForEntry(product, routeKey);
                        const label    = getDisplayLabel(product, origin, destination, a.result);
                        const routeLabel = origin && destination ? `${origin} → ${destination}` : '—';
                        const decision   = a.result.decision ?? '—';
                        const dColor     = decisionHex[decision] ?? '#94A3B8';
                        const dIcon      = decisionIcon[decision] ?? '?';

                        return (
                            <div key={a.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < recentEight.length - 1 ? 12 : 0, padding: '6px 8px', borderRadius: 10, transition: 'background 0.15s', cursor: 'default' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                            >
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                    flexShrink: 0, background: `${pColor}15`, color: pColor,
                                    minWidth: 72, textAlign: 'center', whiteSpace: 'nowrap',
                                    border: `1px solid ${pColor}30`,
                                }}>
                                    {label}
                                </span>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {routeLabel}
                                    </p>
                                    <div style={{ height: 4, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: conf > 0 ? `${conf}%` : '8%',
                                            background: `linear-gradient(90deg, ${pColor}, ${pColor}88)`,
                                            borderRadius: 99,
                                            transition: 'width 0.8s ease',
                                        }} />
                                    </div>
                                    <p style={{ fontSize: 9, color: '#CBD5E1', marginTop: 3 }}>{conf}% confidence</p>
                                </div>

                                <span style={{ fontSize: 14, fontWeight: 800, flexShrink: 0, color: dColor, width: 20, textAlign: 'center' }}>
                                    {dIcon}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══ EXPORT ══ */}
            <div style={{ ...card, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <Download size={14} color="#3B82F6" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Export Reports</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8' }}>Download analysis history for compliance and audit review</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[
                        { label: '📊 Export CSV',   hoverColor: '#F97316', onClick: exportCSV },
                        { label: '📄 Export PDF',   hoverColor: '#3B82F6', onClick: () => window.print() },
                        { label: '📧 Email Report', hoverColor: '#8B5CF6', onClick: () => {} },
                    ].map(b => (
                        <button key={b.label} onClick={b.onClick}
                            style={{ padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', transition: 'all 0.2s ease' }}
                            onMouseEnter={e => { const d = e.currentTarget as HTMLButtonElement; d.style.borderColor = `${b.hoverColor}44`; d.style.color = b.hoverColor; d.style.background = `${b.hoverColor}08`; d.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { const d = e.currentTarget as HTMLButtonElement; d.style.borderColor = '#E2E8F0'; d.style.color = '#475569'; d.style.background = '#F8FAFC'; d.style.transform = 'translateY(0)'; }}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ TIPS BANNER ══ */}
            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(249,115,22,0.05))', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 20, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} />
                </div>
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Audit & Compliance Notes</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '6px 28px' }}>
                        {[
                            'All AI decisions are logged with timestamp and confidence score',
                            'Export CSV for ERP integration and finance reconciliation',
                            'CANCEL decisions include full risk justification from AI agents',
                            'Confidence below 75% — manual review recommended',
                            'Reports retained for 12 months as per audit compliance policy',
                            'Use filters to isolate DELAY/CANCEL decisions for review',
                        ].map(tip => (
                            <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ color: '#3B82F6', flexShrink: 0, fontSize: 13, marginTop: 2 }}>•</span>
                                <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65 }}>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
