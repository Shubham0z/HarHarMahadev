import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText, Search, Download, BarChart3, TrendingUp,
    CheckCircle, AlertTriangle, XCircle, Clock, Zap, Filter,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type Decision  = 'SHIP NOW' | 'DELAY' | 'CANCEL';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface Analysis {
    id: string;
    created_at: string;
    result: {
        product: string;
        origin: string;
        destination: string;
        decision: Decision;
        overall_risk: RiskLevel;
        confidence_score: number; // 0–1
        total_cost_inr: number;
    };
}

// ── Hardcoded Data ─────────────────────────────────────────────────────────
const ANALYSES: Analysis[] = [
    { id: '1',  created_at: '2025-02-17T10:30:00Z', result: { product: 'Pharma',      origin: 'Mumbai',    destination: 'Delhi',     decision: 'SHIP NOW', overall_risk: 'LOW',    confidence_score: 0.91, total_cost_inr: 42000  } },
    { id: '2',  created_at: '2025-02-17T08:15:00Z', result: { product: 'Electronics', origin: 'Chennai',   destination: 'Pune',      decision: 'DELAY',    overall_risk: 'MEDIUM', confidence_score: 0.76, total_cost_inr: 87500  } },
    { id: '3',  created_at: '2025-02-16T18:45:00Z', result: { product: 'FMCG',        origin: 'Kolkata',   destination: 'Hyderabad', decision: 'SHIP NOW', overall_risk: 'LOW',    confidence_score: 0.88, total_cost_inr: 31200  } },
    { id: '4',  created_at: '2025-02-16T14:00:00Z', result: { product: 'Automotive',  origin: 'Pune',      destination: 'Surat',     decision: 'CANCEL',   overall_risk: 'HIGH',   confidence_score: 0.62, total_cost_inr: 114000 } },
    { id: '5',  created_at: '2025-02-15T11:20:00Z', result: { product: 'Kirana',      origin: 'Jaipur',    destination: 'Ahmedabad', decision: 'SHIP NOW', overall_risk: 'LOW',    confidence_score: 0.94, total_cost_inr: 18700  } },
    { id: '6',  created_at: '2025-02-15T09:50:00Z', result: { product: 'Cloth',       origin: 'Surat',     destination: 'Lucknow',   decision: 'SHIP NOW', overall_risk: 'LOW',    confidence_score: 0.85, total_cost_inr: 26400  } },
    { id: '7',  created_at: '2025-02-14T16:30:00Z', result: { product: 'Furniture',   origin: 'Delhi',     destination: 'Bangalore', decision: 'DELAY',    overall_risk: 'MEDIUM', confidence_score: 0.71, total_cost_inr: 68000  } },
    { id: '8',  created_at: '2025-02-14T13:10:00Z', result: { product: 'Appliances',  origin: 'Hyderabad', destination: 'Kolkata',   decision: 'CANCEL',   overall_risk: 'HIGH',   confidence_score: 0.58, total_cost_inr: 135000 } },
    { id: '9',  created_at: '2025-02-13T10:00:00Z', result: { product: 'Electronics', origin: 'Bangalore', destination: 'Mumbai',    decision: 'SHIP NOW', overall_risk: 'LOW',    confidence_score: 0.89, total_cost_inr: 54000  } },
    { id: '10', created_at: '2025-02-13T07:45:00Z', result: { product: 'Pharma',      origin: 'Delhi',     destination: 'Chennai',   decision: 'SHIP NOW', overall_risk: 'LOW',    confidence_score: 0.93, total_cost_inr: 38500  } },
    { id: '11', created_at: '2025-02-12T15:20:00Z', result: { product: 'FMCG',        origin: 'Pune',      destination: 'Jaipur',    decision: 'DELAY',    overall_risk: 'MEDIUM', confidence_score: 0.74, total_cost_inr: 22100  } },
    { id: '12', created_at: '2025-02-12T11:00:00Z', result: { product: 'Automotive',  origin: 'Chennai',   destination: 'Delhi',     decision: 'SHIP NOW', overall_risk: 'LOW',    confidence_score: 0.87, total_cost_inr: 97000  } },
];

const decisionTrend = [
    { month: 'Sep', ship: 41, delay: 7,  cancel: 2 },
    { month: 'Oct', ship: 38, delay: 9,  cancel: 3 },
    { month: 'Nov', ship: 45, delay: 6,  cancel: 1 },
    { month: 'Dec', ship: 50, delay: 8,  cancel: 4 },
    { month: 'Jan', ship: 48, delay: 5,  cancel: 2 },
    { month: 'Feb', ship: 45, delay: 3,  cancel: 1 },
];

// ── Lookup Maps ────────────────────────────────────────────────────────────
const decisionVariant: Record<Decision, 'success' | 'warning' | 'danger'> = {
    'SHIP NOW': 'success',
    'DELAY':    'warning',
    'CANCEL':   'danger',
};

const riskHex = (r: RiskLevel) =>
    r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';

const productColor: Record<string, string> = {
    Pharma:      '#F97316',
    Electronics: '#3B82F6',
    FMCG:        '#10B981',
    Automotive:  '#8B5CF6',
    Kirana:      '#06B6D4',
    Cloth:       '#EC4899',
    Furniture:   '#F59E0B',
    Appliances:  '#EF4444',
};

const decisionHex: Record<string, string> = {
    'SHIP NOW': '#10B981',
    'DELAY':    '#F59E0B',
    'CANCEL':   '#EF4444',
};

const filters: Decision[] = ['SHIP NOW', 'DELAY', 'CANCEL'];
const tableHeaders = ['#', 'Product', 'Route', 'Decision', 'Risk', 'Confidence', 'Cost', 'Date'];

// ── Sub-components ─────────────────────────────────────────────────────────
function StatusBadge({ status, variant }: { status: string; variant: 'success' | 'warning' | 'danger' | 'accent' }) {
    const colors: Record<string, { bg: string; color: string; border: string }> = {
        success: { bg: 'rgba(16,185,129,0.08)',  color: '#10B981', border: 'rgba(16,185,129,0.2)' },
        warning: { bg: 'rgba(245,158,11,0.08)',  color: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
        danger:  { bg: 'rgba(239,68,68,0.08)',   color: '#EF4444', border: 'rgba(239,68,68,0.2)'  },
        accent:  { bg: 'rgba(59,130,246,0.08)',  color: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
    };
    const c = colors[variant] ?? colors.accent;
    return (
        <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
            background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            whiteSpace: 'nowrap',
        }}>
            {status}
        </span>
    );
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 20,
    padding: 20,
    transition: 'all 0.25s ease',
};

// ── Page ──────────────────────────────────────────────────────────────────
export default function ReportsPage() {
    const [activeFilter, setActiveFilter] = useState<'All' | Decision>('All');

    const analyses   = ANALYSES;
    const filtered   = activeFilter === 'All' ? analyses : analyses.filter(a => a.result.decision === activeFilter);
    const shipCount  = analyses.filter(a => a.result.decision === 'SHIP NOW').length;
    const delayCount = analyses.filter(a => a.result.decision === 'DELAY').length;
    const cancelCount= analyses.filter(a => a.result.decision === 'CANCEL').length;
    const avgConf    = Math.round(analyses.reduce((s, a) => s + a.result.confidence_score * 100, 0) / analyses.length);

    const exportCSV = () => {
        const rows = [
            ['Product', 'Origin', 'Destination', 'Decision', 'Risk', 'Confidence', 'Cost (INR)', 'Date'],
            ...analyses.map(a => [
                a.result.product, a.result.origin, a.result.destination,
                a.result.decision, a.result.overall_risk,
                `${Math.round(a.result.confidence_score * 100)}%`,
                a.result.total_cost_inr,
                new Date(a.created_at).toLocaleString('en-IN'),
            ]),
        ];
        const csv  = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'supply_ai_reports.csv';
        a.click();
    };

    return (
        <div className="animate-fade-in-up" style={{ width: '100%' }}>

            {/* ── HEADER ── */}
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

            {/* ── STAT CARDS ── */}
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { val: String(analyses.length), label: 'Total Analyses', color: '#F97316', icon: <BarChart3 size={16} /> },
                    { val: String(shipCount),        label: 'SHIP NOW',       color: '#10B981', icon: <CheckCircle size={16} /> },
                    { val: String(delayCount),       label: 'DELAY',          color: '#F59E0B', icon: <AlertTriangle size={16} /> },
                    { val: String(cancelCount),      label: 'CANCEL',         color: '#EF4444', icon: <XCircle size={16} /> },
                    { val: `${avgConf}%`,            label: 'Avg Confidence', color: '#8B5CF6', icon: <TrendingUp size={16} /> },
                ].map((s, idx) => (
                    <div key={s.label} className="animate-fade-in-up"
                        style={{ ...card, textAlign: 'center', padding: '18px 14px', animationDelay: `${idx * 60}ms` }}
                        onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.boxShadow = '0 12px 28px rgba(0,0,0,0.07)'; d.style.borderColor = `${s.color}33`; }}
                        onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; d.style.borderColor = '#E2E8F0'; }}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                            {s.icon}
                        </div>
                        <p style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.val}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ── TABLE ── */}
            <div className="animate-fade-in-up" style={{ ...card, padding: '20px 0', overflow: 'hidden', marginBottom: 24 }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
                {/* Filter controls */}
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
                                <button key={f} onClick={() => setActiveFilter(f)} style={{
                                    fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 99, cursor: 'pointer',
                                    border: `1px solid ${isActive ? col : '#E2E8F0'}`,
                                    background: isActive ? `${col}12` : '#F8FAFC',
                                    color: isActive ? col : '#94A3B8', transition: 'all 0.2s ease',
                                }}>
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
                                    <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No records found</td></tr>
                            ) : filtered.map((a, i) => (
                                <tr key={a.id}
                                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.2s ease', cursor: 'default' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFF'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                                >
                                    <td style={{ padding: '13px 18px' }}>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#F97316', background: 'rgba(249,115,22,0.07)', padding: '3px 9px', borderRadius: 7 }}>
                                            #{i + 1}
                                        </span>
                                    </td>
                                    <td style={{ padding: '13px 18px' }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 7, background: `${productColor[a.result.product] ?? '#94A3B8'}12`, color: productColor[a.result.product] ?? '#94A3B8' }}>
                                            {a.result.product}
                                        </span>
                                    </td>
                                    <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                        {a.result.origin} → {a.result.destination}
                                    </td>
                                    <td style={{ padding: '13px 18px' }}>
                                        <StatusBadge
                                            status={a.result.decision}
                                            variant={decisionVariant[a.result.decision as Decision] ?? 'accent'}
                                        />
                                    </td>
                                    <td style={{ padding: '13px 18px' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: riskHex(a.result.overall_risk as RiskLevel) }}>
                                            {a.result.overall_risk}
                                        </span>
                                    </td>
                                    <td style={{ padding: '13px 18px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 60, height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${Math.round(a.result.confidence_score * 100)}%`, background: 'linear-gradient(90deg, #F97316, #3B82F6)', borderRadius: 99 }} />
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{Math.round(a.result.confidence_score * 100)}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                        ₹{a.result.total_cost_inr.toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '13px 18px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                                            <Clock size={10} /> {timeAgo(a.created_at)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── DECISION TREND ── */}
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
                                    <div key={j} style={{ flex: 1, maxWidth: 12, height: `${Math.round((b.val / 55) * 90)}px`, background: b.color, borderRadius: '4px 4px 0 0', opacity: 0.85, transition: 'all 0.3s ease', minHeight: 4 }} />
                                ))}
                            </div>
                            <span style={{ fontSize: 11, color: i === decisionTrend.length - 1 ? '#F97316' : '#94A3B8', fontWeight: i === decisionTrend.length - 1 ? 700 : 500 }}>
                                {m.month}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── BREAKDOWN + PRODUCT SPLIT ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
                {/* Decision Breakdown */}
                <div style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <BarChart3 size={15} color="#F97316" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Decision Breakdown</span>
                    </div>
                    {[
                        { label: 'SHIP NOW', count: shipCount,   color: '#10B981', icon: <CheckCircle size={14} /> },
                        { label: 'DELAY',    count: delayCount,  color: '#F59E0B', icon: <AlertTriangle size={14} /> },
                        { label: 'CANCEL',   count: cancelCount, color: '#EF4444', icon: <XCircle size={14} /> },
                    ].map(item => {
                        const pct = Math.round((item.count / analyses.length) * 100);
                        return (
                            <div key={item.label} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: item.color }}>{item.icon} {item.label}</span>
                                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{item.count} · {pct}%</span>
                                </div>
                                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 99, transition: 'width 0.9s ease' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Product Analysis Split */}
                <div style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <BarChart3 size={15} color="#3B82F6" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Product Analysis Split</span>
                    </div>
                    {analyses.slice(0, 8).map((a) => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, flexShrink: 0, background: `${productColor[a.result.product] ?? '#94A3B8'}12`, color: productColor[a.result.product] ?? '#94A3B8' }}>
                                {a.result.product}
                            </span>
                            <div style={{ flex: 1, height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.round(a.result.confidence_score * 100)}%`, background: productColor[a.result.product] ?? '#94A3B8', borderRadius: 99, opacity: 0.75 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: decisionHex[a.result.decision] ?? '#94A3B8' }}>
                                {a.result.decision === 'SHIP NOW' ? '✓' : a.result.decision === 'DELAY' ? '⏳' : '✕'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── EXPORT ── */}
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
                <div style={{ display: 'flex', gap: 10 }}>
                    {[
                        { label: '📊 Export CSV', hoverColor: '#F97316', onClick: exportCSV },
                        { label: '📄 Export PDF', hoverColor: '#3B82F6', onClick: () => window.print() },
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

            {/* ── TIPS BANNER ── */}
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
