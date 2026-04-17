import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import {
    Factory, Search, TrendingUp, AlertTriangle,
    CheckCircle, Star, Package, MapPin, Zap,
} from 'lucide-react';
import type { RiskLevel, SupplierStatus } from '../lib/constants';
import { getLatestAnalysis, type SupabaseAnalysis } from '../lib/supabase';

// ─── Parse origin/destination from best_route string ─────────────────────────
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
    return (result as any).product ?? '—';
}

function getSupplierName(best_supplier: any): string {
    if (!best_supplier) return '';
    if (typeof best_supplier === 'string') return best_supplier;
    if (typeof best_supplier === 'object') return best_supplier.name ?? '';
    return '';
}

const suppliers = [
    { name: 'Supplier Thane-3',     city: 'Mumbai',    category: 'Pharma',      quality: 92, capacity: 5000,  onTime: 96, risk: 'LOW'    as RiskLevel, status: 'ACTIVE'   as SupplierStatus, rating: 4.8, orders: 312 },
    { name: 'InfoSys Electronics',  city: 'Chennai',   category: 'Electronics', quality: 90, capacity: 3200,  onTime: 94, risk: 'LOW'    as RiskLevel, status: 'ACTIVE'   as SupplierStatus, rating: 4.6, orders: 218 },
    { name: 'Delhi Auto Parts Co.', city: 'Delhi',     category: 'Automotive',  quality: 85, capacity: 2800,  onTime: 88, risk: 'MEDIUM' as RiskLevel, status: 'ACTIVE'   as SupplierStatus, rating: 4.2, orders: 175 },
    { name: 'Kolkata Textiles Ltd', city: 'Kolkata',   category: 'Cloth',       quality: 88, capacity: 7000,  onTime: 91, risk: 'LOW'    as RiskLevel, status: 'ACTIVE'   as SupplierStatus, rating: 4.4, orders: 264 },
    { name: 'Gujarat FMCG Hub',     city: 'Ahmedabad', category: 'FMCG',        quality: 79, capacity: 9000,  onTime: 82, risk: 'MEDIUM' as RiskLevel, status: 'REVIEW'   as SupplierStatus, rating: 3.9, orders: 198 },
    { name: 'Bangalore Appliances', city: 'Bangalore', category: 'Appliances',  quality: 83, capacity: 1800,  onTime: 79, risk: 'HIGH'   as RiskLevel, status: 'AT RISK'  as SupplierStatus, rating: 3.6, orders: 143 },
    { name: 'Hyderabad Furnicraft', city: 'Hyderabad', category: 'Furniture',   quality: 87, capacity: 1200,  onTime: 85, risk: 'LOW'    as RiskLevel, status: 'ACTIVE'   as SupplierStatus, rating: 4.3, orders: 97  },
    { name: 'Mumbai Kirana Depot',  city: 'Mumbai',    category: 'Kirana',      quality: 95, capacity: 12000, onTime: 98, risk: 'LOW'    as RiskLevel, status: 'ACTIVE'   as SupplierStatus, rating: 4.9, orders: 421 },
    // New suppliers added for expanded city coverage
    { name: 'Kerala Electronics',   city: 'Kochi',     category: 'Electronics', quality: 88, capacity: 2500,  onTime: 92, risk: 'LOW'    as RiskLevel, status: 'ACTIVE'   as SupplierStatus, rating: 4.5, orders: 156 },
    { name: 'Jaipur Textiles Hub',  city: 'Jaipur',    category: 'Cloth',       quality: 84, capacity: 4000,  onTime: 87, risk: 'MEDIUM' as RiskLevel, status: 'ACTIVE'   as SupplierStatus, rating: 4.1, orders: 203 },
];

const statusVariant: Record<SupplierStatus, 'success' | 'warning' | 'danger'> = {
    ACTIVE: 'success', REVIEW: 'warning', 'AT RISK': 'danger',
};
const riskHex = (r: RiskLevel) => r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';
const categoryColor: Record<string, string> = {
    Pharma:      '#F97316', Electronics: '#3B82F6', Automotive:  '#8B5CF6',
    Cloth:       '#EC4899', FMCG:        '#10B981', Appliances:  '#EF4444',
    Furniture:   '#F59E0B', Kirana:      '#06B6D4',
};

function Bar({ value, color = '#F97316' }: { value: number; color?: string }) {
    return (
        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
    );
}

function Stars({ rating }: { rating: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={10}
                    fill={s <= Math.round(rating) ? '#F59E0B' : 'none'}
                    color={s <= Math.round(rating) ? '#F59E0B' : '#E2E8F0'}
                />
            ))}
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', marginLeft: 4 }}>{rating}</span>
        </div>
    );
}

const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0',
    borderRadius: 20, padding: 20, transition: 'all 0.25s ease',
};

export default function SuppliersPage() {
    const [latest, setLatest] = useState<SupabaseAnalysis | null>(null);

    useEffect(() => {
        getLatestAnalysis().then(setLatest);
    }, []);

    const avgQuality = Math.round(suppliers.reduce((s, x) => s + x.quality, 0) / suppliers.length);
    const avgOnTime  = Math.round(suppliers.reduce((s, x) => s + x.onTime,  0) / suppliers.length);

    // Derive display values using parsers
    const aiSupplierRaw  = latest?.result.best_supplier ? getSupplierName(latest.result.best_supplier) : null;
    const latestOD       = latest ? getOriginDest(latest.result) : { origin: '', destination: '' };
    const latestProduct  = latest ? getProduct(latest.result) : '';

    // Match aiSupplier against suppliers list (partial match on first word)
    const aiSupplier = aiSupplierRaw ?? null;

    return (
        <div className="animate-fade-in-up" style={{ width: '100%' }}>

            {/* ══ HEADER ══ */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: 'rgba(249,115,22,0.08)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Factory size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>Supplier Intelligence</h1>
                        <p style={{ fontSize: 14, color: '#94A3B8' }}>
                            {aiSupplier && latestProduct
                                ? `🤖 AI Recommended: ${aiSupplier} — for ${latestProduct} (${latestOD.origin} → ${latestOD.destination})`
                                : 'Scorecard, risk levels and capacity of all active suppliers'}
                        </p>
                    </div>
                </div>
                <Link to="/analyze">
                    <button className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.28)' }}>
                        <Search size={14} /> Find Best Supplier
                    </button>
                </Link>
            </div>

            {/* ══ AI RECOMMENDED SUPPLIER BANNER ══ */}
            {aiSupplier && (
                <div className="animate-fade-in-up" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.06), rgba(59,130,246,0.06))', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(249,115,22,0.1)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Factory size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>🤖 AI Best Supplier for Latest Analysis</p>
                        <p style={{ fontSize: 12, color: '#64748B' }}>
                            <strong style={{ color: '#F97316' }}>{aiSupplier}</strong>
                            {latestProduct && <> recommended for <strong>{latestProduct}</strong></>}
                            {latestOD.origin && <> shipment from <strong>{latestOD.origin}</strong> → <strong>{latestOD.destination}</strong></>}
                        </p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 9, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                        ✓ AI Verified
                    </span>
                </div>
            )}

            {/* ══ STAT CARDS ══ */}
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { val: String(suppliers.length), label: 'Total Suppliers', color: '#F97316', icon: <Factory size={16} />       },
                    { val: String(suppliers.filter(s => s.risk === 'LOW').length),    label: 'Low Risk',    color: '#10B981', icon: <CheckCircle size={16} />   },
                    { val: String(suppliers.filter(s => s.risk === 'MEDIUM').length), label: 'Medium Risk', color: '#F59E0B', icon: <AlertTriangle size={16} /> },
                    { val: String(suppliers.filter(s => s.risk === 'HIGH').length),   label: 'High Risk',   color: '#EF4444', icon: <AlertTriangle size={16} /> },
                    { val: `${avgQuality}%`, label: 'Avg Quality',  color: '#3B82F6', icon: <Star size={16} />       },
                    { val: `${avgOnTime}%`,  label: 'Avg On-Time',  color: '#8B5CF6', icon: <TrendingUp size={16} /> },
                ].map((s, idx) => (
                    <div key={s.label} className="animate-fade-in-up"
                        style={{ ...card, textAlign: 'center', padding: '18px 14px', animationDelay: `${idx * 60}ms` }}
                        onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.boxShadow = '0 12px 28px rgba(0,0,0,0.07)'; d.style.borderColor = `${s.color}33`; }}
                        onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; d.style.borderColor = '#E2E8F0'; }}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>{s.icon}</div>
                        <p style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.val}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ══ SUPPLIER CARDS ══ */}
            <div style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                    <Package size={15} color="#F97316" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>All Suppliers</span>
                    <span style={{ fontSize: 11, color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '2px 10px', marginLeft: 4, fontWeight: 600 }}>{suppliers.length} records</span>
                    {aiSupplier && (
                        <span style={{ fontSize: 11, color: '#F97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 99, padding: '2px 10px', fontWeight: 600 }}>🤖 AI pick highlighted</span>
                    )}
                </div>
            </div>

            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
                {suppliers.map((sup, i) => {
                    // Match: if aiSupplier name contains sup.name's first word or vice versa
                    const isAIPick = aiSupplier
                        ? sup.name.toLowerCase().includes(aiSupplier.toLowerCase().split(' ')[0])
                          || aiSupplier.toLowerCase().includes(sup.name.toLowerCase().split(' ')[0])
                        : false;

                    return (
                        <div key={i} className="animate-fade-in-up"
                            style={{ ...card, animationDelay: `${i * 60}ms`, cursor: 'default', border: isAIPick ? '1.5px solid rgba(249,115,22,0.4)' : '1px solid #E2E8F0', boxShadow: isAIPick ? '0 4px 24px rgba(249,115,22,0.12)' : 'none', position: 'relative' }}
                            onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = isAIPick ? 'rgba(249,115,22,0.5)' : 'rgba(249,115,22,0.25)'; d.style.transform = 'translateY(-5px)'; d.style.boxShadow = isAIPick ? '0 20px 40px rgba(249,115,22,0.18)' : '0 16px 36px rgba(0,0,0,0.08)'; }}
                            onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = isAIPick ? 'rgba(249,115,22,0.4)' : '#E2E8F0'; d.style.transform = 'translateY(0)'; d.style.boxShadow = isAIPick ? '0 4px 24px rgba(249,115,22,0.12)' : 'none'; }}
                        >
                            {isAIPick && (
                                <div style={{ position: 'absolute', top: -10, right: 16, background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 8, boxShadow: '0 4px 12px rgba(249,115,22,0.35)', letterSpacing: '0.3px' }}>
                                    🤖 AI PICK
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: categoryColor[sup.category] ?? '#94A3B8' }} />
                                        <h3 style={{ fontSize: 13, fontWeight: 700, color: isAIPick ? '#F97316' : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sup.name}</h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <MapPin size={10} color="#94A3B8" />
                                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{sup.city}</span>
                                        <span style={{ fontSize: 11, color: '#CBD5E1' }}>·</span>
                                        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 6, background: `${categoryColor[sup.category] ?? '#94A3B8'}15`, color: categoryColor[sup.category] ?? '#94A3B8' }}>{sup.category}</span>
                                    </div>
                                </div>
                                <StatusBadge status={sup.status} variant={statusVariant[sup.status]} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <Stars rating={sup.rating} />
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>{sup.orders} orders</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Quality Score</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#F97316' }}>{sup.quality}%</span>
                                    </div>
                                    <Bar value={sup.quality} color="#F97316" />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>On-Time Delivery</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6' }}>{sup.onTime}%</span>
                                    </div>
                                    <Bar value={sup.onTime} color="#3B82F6" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                                <div>
                                    <span style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginBottom: 2 }}>Capacity</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{sup.capacity.toLocaleString()} u/day</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginBottom: 2 }}>Risk Level</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: riskHex(sup.risk) }}>{sup.risk}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ══ SUPPLIER TABLE ══ */}
            <div style={{ ...card, marginBottom: 24, padding: '20px 0', overflow: 'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 16px' }}>
                    <Factory size={15} color="#F97316" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Supplier Scorecard Table</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                {['Supplier', 'City', 'Category', 'Quality', 'On-Time', 'Capacity', 'Risk', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((s, i) => {
                                const isAIPick = aiSupplier
                                    ? s.name.toLowerCase().includes(aiSupplier.toLowerCase().split(' ')[0])
                                      || aiSupplier.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
                                    : false;
                                return (
                                    <tr key={i}
                                        style={{ borderBottom: i < suppliers.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.2s', cursor: 'default', background: isAIPick ? 'rgba(249,115,22,0.03)' : 'transparent' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFF'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = isAIPick ? 'rgba(249,115,22,0.03)' : 'transparent'; }}
                                    >
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: isAIPick ? '#F97316' : '#0F172A' }}>{s.name}</span>
                                                {isAIPick && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: 'rgba(249,115,22,0.1)', color: '#F97316', letterSpacing: '0.3px' }}>AI PICK</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} color="#94A3B8" /> {s.city}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7, background: `${categoryColor[s.category] ?? '#94A3B8'}15`, color: categoryColor[s.category] ?? '#94A3B8' }}>{s.category}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>{s.quality}%</span></td>
                                        <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>{s.onTime}%</span></td>
                                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>{s.capacity.toLocaleString()} u/day</td>
                                        <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12, fontWeight: 700, color: riskHex(s.risk) }}>{s.risk}</span></td>
                                        <td style={{ padding: '12px 16px' }}><StatusBadge status={s.status} variant={statusVariant[s.status]} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══ CATEGORY QUALITY BARS ══ */}
            <div style={{ ...card, marginBottom: 24 }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <Package size={15} color="#F97316" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Category-wise Quality Score</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {suppliers.map((s, i) => {
                        const isAIPick = aiSupplier
                            ? s.name.toLowerCase().includes(aiSupplier.toLowerCase().split(' ')[0])
                              || aiSupplier.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
                            : false;
                        return (
                            <div key={i}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: categoryColor[s.category] ?? '#94A3B8', flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: isAIPick ? '#F97316' : '#0F172A' }}>{s.name} {isAIPick && '🤖'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{s.category}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: categoryColor[s.category] ?? '#94A3B8' }}>{s.quality}%</span>
                                    </div>
                                </div>
                                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${s.quality}%`, background: isAIPick ? 'linear-gradient(90deg, #F97316, #EA580C)' : (categoryColor[s.category] ?? '#94A3B8'), borderRadius: 99, opacity: 0.85, transition: 'width 0.9s ease' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══ TIPS BANNER ══ */}
            <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(59,130,246,0.05))', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 20, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(249,115,22,0.1)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} />
                </div>
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>AI Supplier Selection Tips</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '5px 28px' }}>
                        {[
                            'Mumbai Kirana Depot — highest rated, 98% on-time',
                            'Bangalore Appliances is AT RISK — consider alternatives',
                            'Gujarat FMCG Hub under review — monitor closely',
                            'Quality above 90 = preferred for Pharma shipments',
                            'Capacity > 5,000 u/day needed for bulk FMCG orders',
                            'Run AI Analysis to auto-select best supplier per route',
                        ].map(tip => (
                            <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ color: '#F97316', flexShrink: 0, fontSize: 13, marginTop: 2 }}>•</span>
                                <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65 }}>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
