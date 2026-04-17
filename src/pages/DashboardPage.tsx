// src/pages/DashboardPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import {
    Truck, AlertTriangle, CheckCircle, IndianRupee, Factory, Bot,
    Search, Bell, MapPin, FileText, ArrowRight, TrendingUp,
    Package, Clock, BarChart2, Zap
} from 'lucide-react';
import type { RiskLevel, Decision } from '../lib/constants';
import { supabase, getAllAnalyses, getAnalysesCount, getActiveAlerts, type SupabaseAnalysis, type LiveAlert } from '../lib/supabase';

// ─── Parse helpers ────────────────────────────────────────────────────────────
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

function getProduct(result: SupabaseAnalysis['result']): string {
    const r = result as any;
    if (r.product && r.product !== '—' && r.product !== '') return String(r.product);
    const known = ['Pharma','Electronics','FMCG','Automotive','Kirana','Cloth','Furniture','Appliances','Rice','Wheat','Chemicals','Steel','Plastics'];
    const sup = typeof r.best_supplier === 'string' ? r.best_supplier : (r.best_supplier?.name ?? '');
    for (const k of known) if (sup.toLowerCase().includes(k.toLowerCase())) return k;
    const rec = r.final_recommendation ?? '';
    for (const k of known) if (rec.toLowerCase().includes(k.toLowerCase())) return k;
    return '';
}

/**
 * ✅ Dedup by content fingerprint — removes true duplicate analyses
 * (same best_route + same cost + same decision = same analysis, keep latest)
 */
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

// ─── Style helpers ────────────────────────────────────────────────────────────
const alertVariant: Record<string, 'danger' | 'warning' | 'accent'> = {
    CRITICAL: 'danger', WARNING: 'warning', INFO: 'accent'
};
const decisionVariant: Record<Decision, 'success' | 'warning' | 'danger'> = {
    'SHIP NOW': 'success', 'DELAY': 'warning', 'CANCEL': 'danger'
};
const riskColor = (r: RiskLevel) => r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';
const alertBg     = (t: string) => t === 'CRITICAL' ? 'rgba(239,68,68,0.05)'  : t === 'WARNING' ? 'rgba(245,158,11,0.05)'  : 'rgba(59,130,246,0.05)';
const alertBorder = (t: string) => t === 'CRITICAL' ? 'rgba(239,68,68,0.2)'   : t === 'WARNING' ? 'rgba(245,158,11,0.2)'   : 'rgba(59,130,246,0.2)';
const alertDot    = (t: string) => t === 'CRITICAL' ? '#EF4444' : t === 'WARNING' ? '#F59E0B' : '#3B82F6';

const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0',
    borderRadius: 20, padding: 20, transition: 'box-shadow 0.25s ease',
};

const cityPerformance = [
    { city: 'Mumbai',    shipments: 34, onTime: 97, risk: 'LOW'    as RiskLevel },
    { city: 'Delhi',     shipments: 28, onTime: 91, risk: 'MEDIUM' as RiskLevel },
    { city: 'Bangalore', shipments: 22, onTime: 95, risk: 'LOW'    as RiskLevel },
    { city: 'Chennai',   shipments: 19, onTime: 78, risk: 'HIGH'   as RiskLevel },
    { city: 'Hyderabad', shipments: 17, onTime: 93, risk: 'LOW'    as RiskLevel },
    { city: 'Kolkata',   shipments: 14, onTime: 88, risk: 'MEDIUM' as RiskLevel },
    { city: 'Ahmedabad', shipments: 12, onTime: 96, risk: 'LOW'    as RiskLevel },
    { city: 'Goa',       shipments: 8,  onTime: 82, risk: 'MEDIUM' as RiskLevel },
];

const topProducts = [
    { name: 'Pharma',      shipments: 58, revenue: '₹35.6L', trend: '+18%', color: '#F97316' },
    { name: 'Electronics', shipments: 42, revenue: '₹75.6L', trend: '+6%',  color: '#3B82F6' },
    { name: 'FMCG',        shipments: 37, revenue: '₹16.7L', trend: '+22%', color: '#10B981' },
    { name: 'Automotive',  shipments: 28, revenue: '₹26.6L', trend: '+4%',  color: '#F59E0B' },
    { name: 'Kirana',      shipments: 19, revenue: '₹5.3L',  trend: '-3%',  color: '#EF4444' },
];

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const [analyses,      setAnalyses]      = useState<SupabaseAnalysis[]>([]);
    const [totalCount,    setTotalCount]    = useState<number>(0);
    const [loading,       setLoading]       = useState(true);
    const [alerts,        setAlerts]        = useState<LiveAlert[]>([]);
    const [alertsLoading, setAlertsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const [all, count] = await Promise.all([getAllAnalyses(), getAnalysesCount()]);
        // ✅ Dedup by content — remove duplicate analyses before rendering
        setAnalyses(dedupeByContent(all));
        setTotalCount(count);
        setLoading(false);
    }, []);

    const fetchAlerts = useCallback(async () => {
        const data = await getActiveAlerts();
        setAlerts(data);
        setAlertsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        fetchAlerts();

        const interval = setInterval(fetchData, 5000);

        const analysisChannel = supabase
            ?.channel('dashboard-analyses')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analyses' }, () => fetchData())
            .subscribe();

        const alertChannel = supabase
            ?.channel('dashboard-alerts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_alerts' }, () => fetchAlerts())
            .subscribe();

        return () => {
            clearInterval(interval);
            analysisChannel?.unsubscribe();
            alertChannel?.unsubscribe();
        };
    }, [fetchData, fetchAlerts]);

    const latest           = analyses[0];
    const latestOriginDest = latest ? getOriginDest(latest.result) : { origin: '', destination: '' };

    const kpis = [
        { icon: <Truck size={20} />,        label: 'Active Shipments',  value: '142',                                                                                                                      sub: 'Across 8 cities',         color: 'primary' as const, trend: '+12%'           },
        { icon: <AlertTriangle size={20} />, label: 'Open Risk Alerts',  value: String(alerts.length),                                                                                                      sub: `${alerts.filter(a => a.risk === 'HIGH').length} Critical`, color: 'danger' as const, trend: alerts.length > 0 ? `+${alerts.length}` : '0' },
        { icon: <CheckCircle size={20} />,   label: 'On-Time Delivery',  value: '94.2%',                                                                                                                    sub: 'Last 30 days',            color: 'success' as const, trend: '+1.4%'          },
        { icon: <IndianRupee size={20} />,   label: 'Avg Shipment Cost', value: latest ? `₹${(latest.result.total_cost_inr / 100000).toFixed(1)}L` : '₹2.4L',                                            sub: 'Per shipment this month', color: 'warning' as const, trend: '-8%'            },
        { icon: <Factory size={20} />,       label: 'Active Suppliers',  value: '47',                                                                                                                       sub: 'Across 6 categories',     color: 'accent'  as const, trend: '+3'             },
        { icon: <Bot size={20} />,           label: 'AI Analyses Run',   value: loading ? '...' : String(totalCount),                                                                                       sub: 'Total lifetime',          color: 'primary' as const, trend: `+${totalCount}` },
    ];

    return (
        <div style={{ width: '100%' }}>

            {/* ══ HEADER ══ */}
            <div className="animate-fade-in-up" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Control Tower Dashboard</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 400 }}>
                        Real-time supply chain overview — Last updated just now
                        {latest && latestOriginDest.origin && (
                            <span style={{ color: '#F97316', fontWeight: 600 }}>
                                {' '}· Latest: {latestOriginDest.origin} → {latestOriginDest.destination}
                            </span>
                        )}
                    </p>
                </div>
                <Link to="/analyze">
                    <button className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.28)' }}>
                        <Search size={14} /> Run New Analysis
                    </button>
                </Link>
            </div>

            {/* ══ KPI CARDS ══ */}
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                {kpis.map((k, idx) => (
                    <div key={k.label} className="animate-fade-in-up" style={{ animationDelay: `${idx * 70}ms` }}>
                        <KPICard {...k} />
                    </div>
                ))}
            </div>

            {/* ══ ALERTS + ANALYSES ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>

                {/* LIVE ALERTS */}
                <div className="animate-slide-in-left" style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Bell size={16} color="#F97316" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Alerts</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {alerts.length > 0 && (
                                <span style={{ fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 99, padding: '3px 10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'blink 1s infinite' }} />
                                    {alerts.length} Active
                                </span>
                            )}
                            {alerts.length === 0 && !alertsLoading && (
                                <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>All Clear</span>
                            )}
                        </div>
                    </div>

                    {alertsLoading && <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: 13 }}>Loading alerts...</div>}

                    {!alertsLoading && alerts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                            <p style={{ fontSize: 13, color: '#94A3B8' }}>No active alerts</p>
                            <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>Run AI Analysis to generate alerts</p>
                        </div>
                    )}

                    {!alertsLoading && alerts.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {alerts.map((a, idx) => (
                                <div key={a.id} className="animate-slide-in-right"
                                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: alertBg(a.type), borderRadius: 12, border: `1px solid ${alertBorder(a.type)}`, transition: 'all 0.2s ease', animationDelay: `${idx * 55}ms`, cursor: 'default' }}
                                    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateX(4px)'; d.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                                    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateX(0)'; d.style.boxShadow = 'none'; }}
                                >
                                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{a.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: alertDot(a.type), flexShrink: 0, animation: a.type === 'CRITICAL' ? 'blink 1s infinite' : 'none' }} />
                                            <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                                        </div>
                                        <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginBottom: 4 }}>{a.description}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 10, color: '#94A3B8' }}>{timeAgo(a.created_at)}</span>
                                            <span style={{ fontSize: 10, color: '#94A3B8' }}>·</span>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: alertDot(a.type) }}>{a.source}</span>
                                        </div>
                                    </div>
                                    <StatusBadge status={a.type} variant={alertVariant[a.type]} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ✅ FIXED Recent Analyses — deduped, shows product + route */}
                <div className="animate-slide-in-right" style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Bot size={16} color="#3B82F6" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Analyses</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 99, padding: '3px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 4px #10B981' }} />
                            Live
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: 13 }}>Loading analyses...</div>
                    ) : analyses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>No analyses yet</p>
                            <Link to="/analyze">
                                <button style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'rgba(249,115,22,0.08)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)', cursor: 'pointer' }}>
                                    Run First Analysis
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Show top 5 unique analyses */}
                            {analyses.slice(0, 5).map((a, i) => {
                                const { origin, destination } = getOriginDest(a.result);
                                const product = getProduct(a.result);
                                const routeLabel = origin && destination
                                    ? `${origin} → ${destination}`
                                    : (typeof (a.result as any).best_route === 'string'
                                        ? (a.result as any).best_route
                                        : '—');

                                return (
                                    <div key={a.id}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 8px', borderBottom: i < Math.min(analyses.length, 5) - 1 ? '1px solid #F1F5F9' : 'none', borderRadius: 8, transition: 'background 0.2s', cursor: 'default' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                                    >
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {/* Show product if available, then route */}
                                                {product ? (
                                                    <><span style={{ color: '#F97316' }}>{product}</span> · {routeLabel}</>
                                                ) : (
                                                    routeLabel
                                                )}
                                            </p>
                                            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                                                {timeAgo(a.created_at)} · ₹{a.result.total_cost_inr?.toLocaleString('en-IN') ?? '—'}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                                            <StatusBadge
                                                status={a.result.decision as Decision}
                                                variant={decisionVariant[a.result.decision as Decision] ?? 'accent'}
                                            />
                                            <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(a.result.overall_risk as RiskLevel) }}>
                                                {a.result.overall_risk}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ══ CITY PERFORMANCE ══ */}
            <div className="animate-fade-in-up" style={{ ...card, marginBottom: 24 }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <MapPin size={16} color="#F97316" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>City-wise Performance</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {cityPerformance.map((c, idx) => (
                        <div key={c.city} className="animate-fade-in-up"
                            style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 16px', border: '1px solid #E2E8F0', transition: 'all 0.2s ease', animationDelay: `${idx * 50}ms` }}
                            onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#fff'; d.style.borderColor = 'rgba(249,115,22,0.2)'; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                            onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#F8FAFC'; d.style.borderColor = '#E2E8F0'; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{c.city}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${riskColor(c.risk)}18`, color: riskColor(c.risk) }}>{c.risk}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>{c.shipments} shipments</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: riskColor(c.onTime >= 90 ? 'LOW' : c.onTime >= 80 ? 'MEDIUM' : 'HIGH') }}>{c.onTime}%</span>
                            </div>
                            <div style={{ height: 5, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${c.onTime}%`, background: c.onTime >= 90 ? 'linear-gradient(90deg, #10B981, #34D399)' : c.onTime >= 80 ? 'linear-gradient(90deg, #F59E0B, #FCD34D)' : 'linear-gradient(90deg, #EF4444, #F87171)', borderRadius: 99, transition: 'width 0.8s ease' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ TOP PRODUCTS + SUMMARY ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div className="animate-slide-in-left" style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <Package size={16} color="#F97316" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Product Categories</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {topProducts.map((p, i) => (
                            <div key={p.name} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{p.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{p.shipments} shipments</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{p.revenue}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: p.trend.startsWith('+') ? '#10B981' : '#EF4444' }}>{p.trend}</span>
                                    </div>
                                </div>
                                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(p.shipments / 58) * 100}%`, background: p.color, borderRadius: 99, opacity: 0.8, transition: 'width 0.8s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="animate-slide-in-right" style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <BarChart2 size={16} color="#3B82F6" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Summary</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            { icon: <TrendingUp size={18} />,    label: 'Total Revenue',  value: '₹1.6Cr',                                                                  sub: 'Feb 2026',           color: '#F97316' },
                            { icon: <Truck size={18} />,         label: 'Shipments Done', value: '1,247',                                                                    sub: 'This month',         color: '#3B82F6' },
                            { icon: <Clock size={18} />,         label: 'Avg Lead Time',  value: latest ? `${latest.result.estimated_delivery_hours} hrs` : '18.4 hrs',      sub: 'Per shipment',       color: '#10B981' },
                            { icon: <AlertTriangle size={18} />, label: 'Disruptions',    value: '23',                                                                        sub: 'Prevented by AI',    color: '#F59E0B' },
                            { icon: <Factory size={18} />,       label: 'Supplier Score', value: '87/100',                                                                    sub: 'Network avg',        color: '#8B5CF6' },
                            { icon: <CheckCircle size={18} />,   label: 'AI Accuracy',    value: '96.4%',                                                                     sub: 'Decision precision', color: '#10B981' },
                        ].map((item, idx) => (
                            <div key={item.label} className="animate-fade-in-up"
                                style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px', border: '1px solid #E2E8F0', transition: 'all 0.2s ease', animationDelay: `${idx * 55}ms` }}
                                onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#fff'; d.style.borderColor = 'rgba(249,115,22,0.15)'; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 6px 16px rgba(0,0,0,0.05)'; }}
                                onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#F8FAFC'; d.style.borderColor = '#E2E8F0'; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; }}
                            >
                                <div style={{ color: item.color, marginBottom: 8 }}>{item.icon}</div>
                                <p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>{item.value}</p>
                                <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 1 }}>{item.label}</p>
                                <p style={{ fontSize: 10, color: '#94A3B8' }}>{item.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ QUICK NAV ══ */}
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 8 }}>
                {[
                    { href: '/routes',    icon: <MapPin size={18} />,        label: 'View Routes',  sub: '6 active lanes'                                                                            },
                    { href: '/suppliers', icon: <Factory size={18} />,       label: 'Suppliers',    sub: '47 suppliers'                                                                              },
                    { href: '/risk',      icon: <AlertTriangle size={18} />, label: 'Risk Center',  sub: `${alerts.length} open alerts`                                                              },
                    { href: '/cost',      icon: <IndianRupee size={18} />,   label: 'Cost Impact',  sub: latest ? `₹${latest.result.total_cost_inr?.toLocaleString('en-IN')}` : '₹1.6Cr this month' },
                    { href: '/reports',   icon: <FileText size={18} />,      label: 'Reports',      sub: loading ? '...' : `${totalCount} analyses`                                                  },
                ].map((n, idx) => (
                    <Link key={n.href} to={n.href} style={{ textDecoration: 'none' }}>
                        <div className="animate-fade-in-up"
                            style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s ease', cursor: 'pointer', animationDelay: `${idx * 60}ms` }}
                            onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'rgba(249,115,22,0.3)'; d.style.background = 'rgba(249,115,22,0.02)'; d.style.transform = 'translateY(-3px)'; d.style.boxShadow = '0 8px 20px rgba(249,115,22,0.1)'; }}
                            onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = '#E2E8F0'; d.style.background = '#fff'; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; }}
                        >
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F8FAFC', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{n.label}</p>
                                <p style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.sub}</p>
                            </div>
                            <ArrowRight size={14} style={{ color: '#CBD5E1', flexShrink: 0 }} />
                        </div>
                    </Link>
                ))}
            </div>

            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        </div>
    );
}
