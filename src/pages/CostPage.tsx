// src/pages/CostPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    IndianRupee, Search, TrendingUp, TrendingDown,
    Truck, Train, Plane, Package, Zap, AlertTriangle,
} from 'lucide-react';
import type { RiskLevel } from '../lib/constants';
import { getAllAnalyses, getLatestAnalysis, type SupabaseAnalysis } from '../lib/supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function getRouteLabel(best_route: any): string {
    if (!best_route) return '—';
    if (typeof best_route === 'string') return best_route;
    if (typeof best_route === 'object') return `${best_route.mode ?? ''}, ${best_route.distance_km ?? '—'} km, ${best_route.estimated_time_hours ?? '—'} hrs`;
    return '—';
}

function getSupplierName(best_supplier: any): string {
    if (!best_supplier) return '—';
    if (typeof best_supplier === 'string') return best_supplier;
    if (typeof best_supplier === 'object') return best_supplier.name ?? '—';
    return '—';
}

// Safe number formatting — never returns NaN or undefined
function fmtINR(val: number | undefined | null): string {
    if (val == null || isNaN(val)) return '—';
    return '₹' + Math.round(val).toLocaleString('en-IN');
}

const riskHex = (r: RiskLevel) => r === 'HIGH' ? '#EF4444' : r === 'MEDIUM' ? '#F59E0B' : '#10B981';

// ─── Static reference data ────────────────────────────────────────────────────
const productCostData = [
    { product: 'Pharma',      avgCost: 185000, color: '#F97316', pct: 90  },
    { product: 'Electronics', avgCost: 210000, color: '#3B82F6', pct: 100 },
    { product: 'FMCG',        avgCost: 95000,  color: '#10B981', pct: 45  },
    { product: 'Automotive',  avgCost: 165000, color: '#8B5CF6', pct: 78  },
    { product: 'Kirana',      avgCost: 62000,  color: '#06B6D4', pct: 30  },
    { product: 'Cloth',       avgCost: 78000,  color: '#EC4899', pct: 37  },
    { product: 'Furniture',   avgCost: 120000, color: '#F59E0B', pct: 57  },
    { product: 'Appliances',  avgCost: 145000, color: '#EF4444', pct: 69  },
];

const monthlyCost = [
    { month: 'Sep', cost: 12.4 },
    { month: 'Oct', cost: 13.1 },
    { month: 'Nov', cost: 14.8 },
    { month: 'Dec', cost: 16.2 },
    { month: 'Jan', cost: 15.5 },
    { month: 'Feb', cost: 16.0 },
];

const costBreakdown = [
    { label: 'Freight Charges',     pct: 48, color: '#F97316' },
    { label: 'Warehouse & Storage', pct: 18, color: '#3B82F6' },
    { label: 'Packaging',           pct: 14, color: '#8B5CF6' },
    { label: 'Insurance',           pct: 10, color: '#10B981' },
    { label: 'Fuel Surcharge',      pct:  6, color: '#F59E0B' },
    { label: 'GST & Misc',          pct:  4, color: '#EF4444' },
];

const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0',
    borderRadius: 20, padding: 20, transition: 'all 0.25s ease',
};

function Bar({ value, color = '#F97316', height = 6 }: { value: number; color?: string; height?: number }) {
    const safe = isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
    return (
        <div style={{ height, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${safe}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
    );
}

// ─── Real cost breakdown section from n8n latest response ────────────────────
function RealCostDetail({ rcb, latest }: { rcb: any; latest: SupabaseAnalysis }) {
    if (!rcb) return null;

    const road = rcb.road;
    const rail = rcb.rail;
    const air  = rcb.air;
    const wh   = rcb.warehouse;
    const pkg  = rcb.packaging;
    const cold = rcb.cold_chain;
    const gst  = rcb.gst;
    const ins  = rcb.insurance;
    const port = rcb.port_customs;

    const roadTotal = rcb.all_modes?.road ?? road?.grand_total ?? 0;
    const railTotal = rcb.all_modes?.rail ?? rail?.grand_total ?? 0;
    const airTotal  = rcb.all_modes?.air  ?? air?.grand_total  ?? 0;
    const maxCost   = Math.max(roadTotal, railTotal, airTotal, 1);

    const recMode = ((latest.result as any).recommended_mode ?? '').toUpperCase();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* All modes comparison — REAL DATA */}
            {(roadTotal > 0 || railTotal > 0 || airTotal > 0) && (
                <div style={{ padding: '14px', background: 'rgba(59,130,246,0.03)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.12)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                        All Modes — Real Cost Comparison
                    </p>
                    {[
                        { label: 'Road', val: roadTotal, color: '#F97316', icon: <Truck size={12} />,  time: road?.time_hrs,  mode: 'ROAD' },
                        { label: 'Rail', val: railTotal, color: '#3B82F6', icon: <Train size={12} />,  time: rail?.time_hrs,  mode: 'RAIL' },
                        { label: 'Air',  val: airTotal,  color: '#8B5CF6', icon: <Plane size={12} />,  time: air?.time_hrs,   mode: 'AIR'  },
                    ].map(m => {
                        const pct    = Math.round((m.val / maxCost) * 100);
                        const isRec  = recMode === m.mode || rcb.cheapest_mode?.toUpperCase() === m.mode;
                        const isFast = rcb.fastest_mode?.toUpperCase() === m.mode;
                        return (
                            <div key={m.label} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <span style={{ color: m.color }}>{m.icon}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{m.label}</span>
                                        {m.time != null && <span style={{ fontSize: 11, color: '#94A3B8' }}>{m.time} hrs</span>}
                                        {isRec  && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(16,185,129,0.12)', color: '#10B981', padding: '1px 7px', borderRadius: 99 }}>✓ AI Pick</span>}
                                        {isFast && !isRec && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '1px 7px', borderRadius: 99 }}>⚡ Fastest</span>}
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{fmtINR(m.val)}</span>
                                </div>
                                <Bar value={pct} color={m.color} height={5} />
                            </div>
                        );
                    })}
                    {rcb.distance_km != null && (
                        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                            Distance: {rcb.distance_km.toLocaleString('en-IN')} km
                            {rcb.cheapest_mode ? ` · Cheapest: ${rcb.cheapest_mode}` : ''}
                            {rcb.fastest_mode  ? ` · Fastest: ${rcb.fastest_mode}`   : ''}
                        </p>
                    )}
                </div>
            )}

            {/* Road breakdown */}
            {road && (
                <div style={{ background: '#FFF7F0', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(249,115,22,0.15)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#F97316', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 8 }}>🚛 Road Breakdown</p>
                    {[
                        { label: 'Base freight',      val: road.base_freight       },
                        { label: 'Fuel surcharge',    val: road.fuel_surcharge     },
                        { label: 'Toll charges',      val: road.toll_charges       },
                        { label: 'Loading/unloading', val: road.loading_unloading  },
                        { label: 'GST',               val: road.gst                },
                        { label: 'Insurance',         val: road.insurance          },
                        { label: 'Warehouse',         val: road.warehouse          },
                        { label: 'Packaging',         val: road.packaging          },
                        { label: 'Cold chain',        val: road.cold_chain && road.cold_chain > 0 ? road.cold_chain : null },
                        { label: 'Port/Customs',      val: road.port_customs && road.port_customs > 0 ? road.port_customs : null },
                    ].filter(r => r.val != null && r.val > 0).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(249,115,22,0.08)' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{fmtINR(r.val as number)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Grand Total</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#F97316' }}>{fmtINR(road.grand_total)}</span>
                    </div>
                </div>
            )}

            {/* Rail breakdown */}
            {rail && (
                <div style={{ background: 'rgba(59,130,246,0.03)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 8 }}>🚂 Rail Breakdown</p>
                    {[
                        { label: 'Base rail freight', val: rail.base_rail_freight ?? rail.base_freight },
                        { label: 'Terminal charges',  val: rail.terminal_charges  ?? rail.terminal     },
                        { label: 'Documentation',     val: rail.documentation     },
                        { label: 'First/last mile',   val: rail.first_last_mile   },
                        { label: 'GST',               val: rail.gst               },
                        { label: 'Insurance',         val: rail.insurance         },
                        { label: 'Warehouse',         val: rail.warehouse         },
                        { label: 'Packaging',         val: rail.packaging         },
                    ].filter(r => r.val != null && r.val > 0).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{fmtINR(r.val as number)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Grand Total</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#3B82F6' }}>{fmtINR(rail.grand_total)}</span>
                    </div>
                </div>
            )}

            {/* Air breakdown */}
            {air && (
                <div style={{ background: 'rgba(139,92,246,0.03)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 8 }}>✈️ Air Breakdown</p>
                    {[
                        { label: 'Base air freight',  val: air.base_air_freight ?? air.base_freight },
                        { label: 'Fuel surcharge',    val: air.fuel_surcharge    },
                        { label: 'Security charge',   val: air.security_charge   },
                        { label: 'Airport handling',  val: air.airport_handling  },
                        { label: 'Documentation',     val: air.documentation     },
                        { label: 'Road to airport',   val: air.road_to_airport   },
                        { label: 'GST',               val: air.gst               },
                        { label: 'Insurance',         val: air.insurance         },
                    ].filter(r => r.val != null && r.val > 0).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{fmtINR(r.val as number)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Grand Total</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#8B5CF6' }}>{fmtINR(air.grand_total)}</span>
                    </div>
                </div>
            )}

            {/* GST + Insurance */}
            {gst && (
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 8 }}>GST & Insurance</p>
                    {[
                        { label: 'GST rate',           val: ((gst.gst_rate_percent ?? gst.rate_percent) ?? 0) + '%', isText: true },
                        { label: 'IGST on goods',      val: gst.igst_on_goods  },
                        { label: 'Freight GST',        val: gst.freight_gst ?? gst.freight_gst_5pct },
                        { label: 'Total GST',          val: gst.total_gst      },
                        { label: 'Insurance premium',  val: ins?.premium       },
                        { label: 'GST on premium',     val: ins?.gst_on_premium},
                        { label: 'Insurance total',    val: ins?.insurance_total ?? ins?.total },
                    ].filter(r => r.val != null).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>
                                {(r as any).isText ? String(r.val) : fmtINR(r.val as number)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Warehouse */}
            {wh && (
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 8 }}>🏭 Warehouse & Storage</p>
                    {[
                        { label: 'Origin storage',      val: wh.origin_warehouse?.storage       },
                        { label: 'Origin handling in',  val: wh.origin_warehouse?.handling_in   },
                        { label: 'Origin handling out', val: wh.origin_warehouse?.handling_out  },
                        { label: 'Dest storage',        val: wh.destination_warehouse?.storage  },
                        { label: 'Safety stock',        val: wh.safety_stock_holding_cost       },
                    ].filter(r => r.val != null && r.val > 0).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{fmtINR(r.val as number)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Total</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#8B5CF6' }}>{fmtINR(wh.warehouse_total_inr)}</span>
                    </div>
                </div>
            )}

            {/* Packaging */}
            {pkg && (
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 8 }}>📦 Packaging</p>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>{pkg.packaging_type}</div>
                    {[
                        { label: 'Material cost',    val: pkg.packaging_material_cost ?? pkg.material_cost },
                        { label: 'Labour cost',      val: pkg.packing_labour_cost ?? pkg.labour_cost       },
                        { label: 'Cold insulation',  val: pkg.cold_chain_insulation                        },
                        { label: 'Hazmat fee',       val: pkg.hazmat_special_fee                           },
                    ].filter(r => r.val != null && r.val > 0).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{fmtINR(r.val as number)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Total</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#3B82F6' }}>{fmtINR(pkg.packaging_total_inr)}</span>
                    </div>
                </div>
            )}

            {/* Cold chain */}
            {cold?.cold_chain_applicable && (
                <div style={{ background: 'rgba(59,130,246,0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 8 }}>❄️ Cold Chain</p>
                    {[
                        { label: 'Reefer surcharge',  val: cold.reefer_vehicle_surcharge ?? cold.reefer_transport_extra },
                        { label: 'Pre-cooling',       val: cold.pre_cooling_cost     },
                        { label: 'Cold storage',      val: cold.cold_storage_destination ?? cold.transit_cold_storage },
                        { label: 'Temp monitoring',   val: cold.temp_monitoring ?? cold.temperature_monitoring },
                        { label: 'Compliance cert',   val: cold.compliance_certification ?? cold.insurance_uplift },
                    ].filter(r => r.val != null && r.val > 0).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{fmtINR(r.val as number)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Total</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#3B82F6' }}>{fmtINR(cold.cold_chain_total_inr)}</span>
                    </div>
                </div>
            )}

            {/* Port & Customs */}
            {port && (port.port_applicable !== false && port.applicable !== false) && (port.port_total_inr ?? port.total) != null && (
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 8 }}>⚓ Port & Customs</p>
                    {[
                        { label: 'THC',            val: port.thc_terminal_handling ?? port.thc      },
                        { label: 'Documentation',  val: port.documentation_fee ?? port.docs         },
                        { label: 'CHA fee',        val: port.cha_agent_fee ?? port.cha_fee          },
                        { label: 'BCD duty',       val: port.bcd_amount ?? port.bcd_duty            },
                        { label: 'SWS',            val: port.social_welfare_surcharge ?? port.sws   },
                        { label: 'IGST import',    val: port.igst_on_import ?? port.igst_import     },
                    ].filter(r => r.val != null && r.val > 0).map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{r.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{fmtINR(r.val as number)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Port Total</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{fmtINR(port.port_total_inr ?? port.total)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CostPage() {
    const [analyses, setAnalyses] = useState<SupabaseAnalysis[]>([]);
    const [latest,   setLatest]   = useState<SupabaseAnalysis | null>(null);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        Promise.all([getAllAnalyses(), getLatestAnalysis()]).then(([all, lat]) => {
            setAnalyses(all);
            setLatest(lat);
            setLoading(false);
        });
    }, []);

    // ── Safe numeric calculations — guard against NaN ──
    const validCosts   = analyses.map(a => a.result.total_cost_inr).filter(v => v != null && !isNaN(v) && v > 0);
    const totalSpend   = validCosts.reduce((s, v) => s + v, 0);
    const avgCost      = validCosts.length > 0 ? Math.round(totalSpend / validCosts.length) : 0;
    const maxCost      = validCosts.length > 0 ? Math.max(...validCosts) : 0;
    const minCost      = validCosts.length > 0 ? Math.min(...validCosts) : 0;

    const latestOriginDest = latest ? getOriginDest(latest.result) : { origin: '', destination: '' };
    const rcb              = latest ? (latest.result as any).real_cost_breakdown : null;

    const kpis = [
        { label: 'Latest Shipment Cost',   val: latest ? fmtINR(latest.result.total_cost_inr) : '—',                    sub: latest && latestOriginDest.origin ? `${latestOriginDest.origin} → ${latestOriginDest.destination}` : 'No data yet', color: '#F97316', icon: <IndianRupee size={18} />, trend: null  },
        { label: 'Avg Cost / Shipment',    val: loading ? '...' : validCosts.length > 0 ? fmtINR(avgCost) : '—',        sub: `Across ${analyses.length} analyses`,                                                                               color: '#3B82F6', icon: <TrendingUp size={18} />,  trend: '-8%' },
        { label: 'Highest Cost Route',     val: loading ? '...' : validCosts.length > 0 ? fmtINR(maxCost) : '—',        sub: 'Most expensive analysis',                                                                                          color: '#EF4444', icon: <TrendingUp size={18} />,  trend: null  },
        { label: 'Lowest Cost Route',      val: loading ? '...' : validCosts.length > 0 ? fmtINR(minCost) : '—',        sub: 'Most optimized analysis',                                                                                          color: '#10B981', icon: <TrendingDown size={18} />, trend: null  },
        { label: 'Total AI Spend Tracked', val: loading ? '...' : validCosts.length > 0 ? `₹${(totalSpend / 100000).toFixed(1)}L` : '—', sub: 'All time across all analyses',                                                                   color: '#8B5CF6', icon: <Package size={18} />,      trend: null  },
        { label: 'Fuel Surcharge Active',  val: '+12%',                                                                  sub: 'Diesel hike — since Feb 2026',                                                                                     color: '#F59E0B', icon: <AlertTriangle size={18} />, trend: '+12%'},
    ];

    return (
        <div className="animate-fade-in-up" style={{ width: '100%' }}>

            {/* ══ HEADER ══ */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: 'rgba(249,115,22,0.08)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IndianRupee size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>Cost Intelligence</h1>
                        <p style={{ fontSize: 14, color: '#94A3B8' }}>
                            {latest && latestOriginDest.origin
                                ? `Latest: ${latestOriginDest.origin} → ${latestOriginDest.destination} · ${fmtINR(latest.result.total_cost_inr)}`
                                : 'Real-time shipment cost breakdown and transport mode comparison'}
                        </p>
                    </div>
                </div>
                <Link to="/analyze">
                    <button className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.28)' }}>
                        <Search size={14} /> Get Cost Estimate
                    </button>
                </Link>
            </div>

            {/* ══ KPI CARDS ══ */}
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                {kpis.map((k, idx) => (
                    <div key={k.label} className="animate-fade-in-up"
                        style={{ ...card, padding: '18px 16px', animationDelay: `${idx * 60}ms` }}
                        onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.boxShadow = '0 12px 28px rgba(0,0,0,0.07)'; d.style.borderColor = `${k.color}33`; }}
                        onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; d.style.borderColor = '#E2E8F0'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${k.color}12`, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k.icon}</div>
                            {k.trend && (
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 7, background: k.trend.startsWith('-') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: k.trend.startsWith('-') ? '#10B981' : '#EF4444' }}>
                                    {k.trend}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: 22, fontWeight: 900, color: k.color, marginBottom: 4 }}>{k.val}</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', marginBottom: 3 }}>{k.label}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8' }}>{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* ══ LATEST AI ANALYSIS — FULL REAL COST DETAIL ══ */}
            {latest && (
                <div className="animate-fade-in-up" style={{ ...card, marginBottom: 24, border: '1px solid rgba(249,115,22,0.2)', boxShadow: '0 4px 24px rgba(249,115,22,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <span style={{ fontSize: 18 }}>🤖</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Latest AI Analysis — Full Cost Detail</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${riskHex(latest.result.overall_risk as RiskLevel)}15`, color: riskHex(latest.result.overall_risk as RiskLevel), marginLeft: 'auto' }}>
                            {latest.result.overall_risk} RISK
                        </span>
                    </div>

                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 18 }}>
                        {[
                            { label: 'Product',       val: getProduct(latest.result),                                                    color: '#F97316' },
                            { label: 'Route',         val: `${latestOriginDest.origin || '—'} → ${latestOriginDest.destination || '—'}`, color: '#3B82F6' },
                            { label: 'Best Route',    val: getRouteLabel(latest.result.best_route),                                      color: '#8B5CF6' },
                            { label: 'Total Cost',    val: fmtINR(latest.result.total_cost_inr),                                        color: '#F97316' },
                            { label: 'Delivery ETA',  val: latest.result.estimated_delivery_hours != null ? `${latest.result.estimated_delivery_hours} hrs` : '—', color: '#10B981' },
                            { label: 'Best Supplier', val: getSupplierName(latest.result.best_supplier),                                color: '#F59E0B' },
                        ].map(item => (
                            <div key={item.label} style={{ background: '#F8FAFC', borderRadius: 11, padding: '11px 13px', border: '1px solid #E2E8F0' }}>
                                <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 5 }}>{item.label}</p>
                                <p style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.val}</p>
                            </div>
                        ))}
                    </div>

                    {/* Real cost breakdown — all from n8n */}
                    <RealCostDetail rcb={rcb} latest={latest} />

                    {/* Risk factors */}
                    {(latest.result as any).risk_factors?.length > 0 && (
                        <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(239,68,68,0.04)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.12)' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>Risk Factors</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(latest.result as any).risk_factors.map((rf: string, i: number) => (
                                    <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 7, fontWeight: 600, background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>{rf}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══ PRODUCT COST + BREAKDOWN ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <Package size={15} color="#F97316" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Avg Cost by Product</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {productCostData.map((p, i) => (
                            <div key={p.product} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{p.product}</span>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>₹{p.avgCost.toLocaleString('en-IN')}</span>
                                </div>
                                <Bar value={p.pct} color={p.color} />
                            </div>
                        ))}
                    </div>
                </div>
                <div style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <IndianRupee size={15} color="#3B82F6" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Cost Breakdown Structure</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {costBreakdown.map((c, i) => (
                            <div key={c.label} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{c.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.pct}%</span>
                                </div>
                                <Bar value={c.pct} color={c.color} height={8} />
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 18, padding: '12px 14px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12 }}>
                        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.65 }}>
                            <strong style={{ color: '#3B82F6' }}>Freight (48%)</strong> is the biggest cost driver. Switching Road → Rail saves up to <strong>35%</strong> on routes above 1,000 km.
                        </p>
                    </div>
                </div>
            </div>

            {/* ══ MONTHLY COST TREND ══ */}
            <div style={{ ...card, marginBottom: 24 }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={15} color="#F97316" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Monthly Freight Spend (₹ Lakhs)</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>+28.9% YoY</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 140 }}>
                    {monthlyCost.map((m, i) => {
                        const maxVal = Math.max(...monthlyCost.map(x => x.cost));
                        const barH   = Math.round((m.cost / maxVal) * 110);
                        const isLast = i === monthlyCost.length - 1;
                        return (
                            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: isLast ? '#F97316' : '#94A3B8' }}>₹{m.cost}L</span>
                                <div style={{ width: '70%', height: `${barH}px`, background: isLast ? 'linear-gradient(180deg, #F97316, #EA580C)' : 'linear-gradient(180deg, #E2E8F0, #CBD5E1)', borderRadius: '6px 6px 0 0', transition: 'all 0.3s ease', minHeight: 8, boxShadow: isLast ? '0 4px 12px rgba(249,115,22,0.3)' : 'none' }} />
                                <span style={{ fontSize: 11, color: isLast ? '#F97316' : '#94A3B8', fontWeight: isLast ? 700 : 500 }}>{m.month}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══ RECENT ANALYSIS TABLE ══ */}
            {analyses.length > 0 && (
                <div style={{ ...card, marginBottom: 24, padding: '20px 0', overflow: 'hidden' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 16px' }}>
                        <IndianRupee size={15} color="#F97316" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Recent Shipment Costs — Live</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '2px 10px', marginLeft: 'auto' }}>
                            {analyses.length} records
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    {['Product', 'Route', 'Mode', 'Cost', 'Delivery', 'Risk'].map(h => (
                                        <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {analyses.slice(0, 8).map((a, i) => {
                                    const { origin, destination } = getOriginDest(a.result);
                                    const rcbRow = (a.result as any).real_cost_breakdown;
                                    const mode = (a.result as any).recommended_mode ?? rcbRow?.cheapest_mode ?? '—';
                                    const cost = a.result.total_cost_inr;
                                    return (
                                        <tr key={a.id}
                                            style={{ borderBottom: i < Math.min(analyses.length, 8) - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.2s', cursor: 'default' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFF'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                                        >
                                            <td style={{ padding: '12px 18px', fontSize: 12, fontWeight: 600, color: '#F97316' }}>{getProduct(a.result)}</td>
                                            <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>{origin || '—'} → {destination || '—'}</td>
                                            <td style={{ padding: '12px 18px', fontSize: 12, color: '#475569', fontWeight: 600 }}>{mode}</td>
                                            <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 800, color: '#F97316', whiteSpace: 'nowrap' }}>{fmtINR(cost)}</td>
                                            <td style={{ padding: '12px 18px', fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>
                                                {a.result.estimated_delivery_hours != null ? `${a.result.estimated_delivery_hours} hrs` : '—'}
                                            </td>
                                            <td style={{ padding: '12px 18px' }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: riskHex(a.result.overall_risk as RiskLevel) }}>{a.result.overall_risk}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══ TIPS ══ */}
            <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(59,130,246,0.05))', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 20, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(249,115,22,0.1)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} />
                </div>
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>AI Cost Optimization Tips</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '6px 28px' }}>
                        {['Rail saves 35–40% vs Road for routes above 1,000 km', 'Pre-book transport now — fuel surcharge active at +12%', 'Electronics highest avg cost — use Air only when urgent', 'Bulk FMCG orders: Gujarat Hub gives best rate per unit', 'Kirana & Cloth are lowest cost — ideal for road freight', 'Run AI Analysis to get exact cost for your specific route'].map(tip => (
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
