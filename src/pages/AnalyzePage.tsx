// src/pages/AnalyzePage.tsx
import { useState } from 'react';
import { runAnalysis } from '../lib/api';
import type { AnalysisResult } from '../lib/api';
import {
    CITIES, PRODUCTS, HS_CODES, SHIPMENT_MODES,
    LOAD_TYPES, CARGO_CATEGORIES, PORT_NAMES,
} from '../lib/constants';
import { supabase, clearAllAlerts } from '../lib/supabase';
import {
    Search, BarChart3, MapPin, Factory, AlertTriangle, IndianRupee,
    Crown, Loader2, Rocket, CheckCircle2, Clock, TrendingUp, Truck,
    Shield, CheckCircle, XCircle, AlertOctagon, Zap, Package,
    Thermometer, Box, Warehouse, Scale, ChevronDown, Info,
} from 'lucide-react';

/* ─────────── Agents ─────────── */
const agents = [
    { id: 'a1', icon: <BarChart3 size={16} />,    label: 'Demand Forecasting Agent' },
    { id: 'a2', icon: <MapPin size={16} />,        label: 'Route Optimization Agent' },
    { id: 'a3', icon: <Factory size={16} />,       label: 'Supplier Finder Agent'    },
    { id: 'a4', icon: <AlertTriangle size={16} />, label: 'Risk Monitoring Agent'    },
    { id: 'a5', icon: <IndianRupee size={16} />,   label: 'Cost Breakdown Agent'     },
    { id: 'a6', icon: <Crown size={16} />,         label: 'Orchestrator Agent'       },
];

type Status = 'idle' | 'running' | 'done' | 'error';

/* ─────────── Helpers ─────────── */
const normPct = (v: number): number =>
    Math.min(100, Math.round(v > 0 && v <= 1 ? v * 100 : v));

const riskHex = (r: string): string =>
    r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';

const decisionCfg = (d: string) => {
    if (d === 'SHIP NOW') return {
        color: '#10B981', bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.25)', icon: <CheckCircle size={22} />,
    };
    if (d === 'DELAY') return {
        color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)', icon: <AlertOctagon size={22} />,
    };
    return {
        color: '#EF4444', bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.25)', icon: <XCircle size={22} />,
    };
};

const fmt = (n?: number) =>
    n != null ? '₹' + Math.round(n).toLocaleString('en-IN') : '—';

/* ─────────── Styles ─────────── */
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#F8FAFC', border: '1px solid #E2E8F0',
    borderRadius: 10, fontSize: 13, color: '#0F172A',
    outline: 'none', transition: 'all 0.2s ease',
    boxSizing: 'border-box', fontFamily: 'inherit',
    appearance: 'none' as const,
};
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: '#475569', marginBottom: 5, textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
};
const sectionTitle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#94A3B8',
    letterSpacing: '1.2px', textTransform: 'uppercase' as const,
};
const dividerLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#CBD5E1',
    textTransform: 'uppercase' as const, letterSpacing: '1px',
    display: 'flex', alignItems: 'center', gap: 8, margin: '18px 0 12px',
};

const onFocus = (e: React.FocusEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#F97316';
    e.target.style.boxShadow   = '0 0 0 3px rgba(249,115,22,0.1)';
    e.target.style.background  = '#fff';
};
const onBlur = (e: React.FocusEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#E2E8F0';
    e.target.style.boxShadow   = 'none';
    e.target.style.background  = '#F8FAFC';
};

/* ─────────── Supabase save ─────────── */
async function saveToSupabase(result: AnalysisResult): Promise<void> {
    if (!supabase) { console.warn('[Supabase] Not initialized'); return; }
    await Promise.all([
        supabase.from('deliveries')
            .update({ status: 'delivered', updated_at: new Date().toISOString() })
            .eq('status', 'in_transit'),
        clearAllAlerts(),
    ]);
    const { error } = await supabase.from('analyses').insert([{ result }]);
    if (error) console.error('[Supabase] Insert failed:', error.message);
    else console.log('[Supabase] Analysis saved ✅');
}

/* ─────────── Form state type ─────────── */
interface FormState {
    /* Core — required */
    product:          string;
    origin:           string;
    destination:      string;
    weight_kg:        string;
    hs_code:          string;

    /* Shipment options */
    shipment_type:    'ROAD' | 'RAIL' | 'AIR';
    load_type:        'AUTO' | 'FTL' | 'LTL';
    cargo_category:   'GENERAL' | 'PHARMA' | 'ELECTRONICS' | 'FOOD' | 'CHEMICALS' | 'COLD';

    /* Financials */
    cargo_value_inr:  string;
    user_budget_inr:  string;

    /* Import/Export */
    is_import_export: boolean;
    port_name:        string;

    /* Special */
    is_cold_chain:               boolean;
    warehouse_days_origin:       string;
    warehouse_days_destination:  string;

    /* Optional description */
    scenario: string;
}

const defaultForm: FormState = {
    product:                     '',
    origin:                      '',
    destination:                 '',
    weight_kg:                   '',
    hs_code:                     '',
    shipment_type:               'ROAD',
    load_type:                   'AUTO',
    cargo_category:              'GENERAL',
    cargo_value_inr:             '',
    user_budget_inr:             '',
    is_import_export:            false,
    port_name:                   'JNPT',
    is_cold_chain:               false,
    warehouse_days_origin:       '0',
    warehouse_days_destination:  '0',
    scenario:                    '',
};

/* ─────────── Component ─────────── */
export default function AnalyzePage() {
    const [form,      setForm]      = useState<FormState>(defaultForm);
    const [status,    setStatus]    = useState<Status>('idle');
    const [agentIdx,  setAgentIdx]  = useState(-1);
    const [result,    setResult]    = useState<AnalysisResult | null>(null);
    const [error,     setError]     = useState('');
    const [activeTab, setActiveTab] = useState<'transport' | 'extras' | 'agents'>('transport');
    const [showAdv,   setShowAdv]   = useState(false);

    const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm(p => ({ ...p, [k]: v }));

    /* ── Validation ── */
    function validate(): string | null {
        if (!form.product)     return 'Product select karo';
        if (!form.origin)      return 'Origin city select karo';
        if (!form.destination) return 'Destination city select karo';
        if (form.origin === form.destination) return 'Origin aur destination alag hone chahiye';
        if (!form.weight_kg || isNaN(Number(form.weight_kg)) || Number(form.weight_kg) <= 0)
            return 'Valid weight (kg) daalo';
        if (!form.hs_code) return 'HS Code select karo';
        return null;
    }

    /* ── Main analyze ── */
    async function handleAnalyze() {
        const err = validate();
        if (err) { alert(err); return; }

        setStatus('running'); setResult(null); setError(''); setAgentIdx(0);

        let data: AnalysisResult | null = null;

        const fetchPromise = runAnalysis({
            product:                    form.product,
            origin_city:                form.origin,
            destination_city:           form.destination,
            weight_kg:                  Number(form.weight_kg),
            hs_code:                    form.hs_code,
            shipment_type:              form.shipment_type,
            load_type:                  form.load_type,
            cargo_category:             form.cargo_category,
            cargo_value_inr:            form.cargo_value_inr  ? Number(form.cargo_value_inr)  : 0,
            user_budget_inr:            form.user_budget_inr  ? Number(form.user_budget_inr)  : 0,
            is_import_export:           form.is_import_export,
            port_name:                  form.port_name,
            is_cold_chain:              form.is_cold_chain,
            warehouse_days_origin:      Number(form.warehouse_days_origin)      || 0,
            warehouse_days_destination: Number(form.warehouse_days_destination) || 0,
            scenario:                   form.scenario,
        }).then(d => { data = d; }).catch(e => {
            console.error('[Analysis error]', e);
            data = null;
        });

        /* Animate agents while waiting for n8n */
        for (let i = 0; i < agents.length; i++) {
            setAgentIdx(i);
            await new Promise(r => setTimeout(r, 2500));
        }
        /* Wait until n8n actually responds */
        await fetchPromise;

        if (!data) {
            setStatus('error');
            setError('n8n workflow se response nahi aaya. Workflow active hai? Console check karo.');
            return;
        }

        await saveToSupabase(data);
        setResult(data);
        setStatus('done');
    }

    const agentState = (i: number): 'idle' | 'running' | 'done' | 'waiting' => {
        if (status === 'idle') return 'waiting';
        if (status === 'done') return 'done';
        if (i < agentIdx)     return 'done';
        if (i === agentIdx)   return 'running';
        return 'waiting';
    };

    const confidence    = result ? normPct(result.confidence_score ?? 0) : 0;
    const dcfg          = result ? decisionCfg(result.decision ?? '') : null;
    const circumference = 2 * Math.PI * 26;

    const rcb       = result?.real_cost_breakdown;
    const road      = rcb?.road;
    const rail      = rcb?.rail;
    const air       = rcb?.air;
    const wh        = rcb?.warehouse;
    const pkg       = rcb?.packaging;
    const cold      = rcb?.cold_chain;
    const gst       = rcb?.gst;
    const ins       = rcb?.insurance;
    const port      = rcb?.port_customs;
    const allModes  = rcb?.all_modes;
    const cheapestMode = rcb?.cheapest_mode;
    const fastestMode  = rcb?.fastest_mode;

    const agentScores = result ? [
        { label: 'Demand Score',   value: normPct(result.demand_score   ?? confidence * 0.0095), color: '#F97316' },
        { label: 'Supplier Score', value: normPct(result.supplier_score ?? confidence * 0.0098), color: '#10B981' },
        { label: 'Risk Safety',    value: normPct(100 - (result.risk_score ?? 40)),               color: '#F59E0B' },
    ] : [];

    /* ── Select wrapper (for icon) ── */
    const SelectWrap = ({ children }: { children: React.ReactNode }) => (
        <div style={{ position: 'relative' }}>
            {children}
            <ChevronDown size={13} color="#94A3B8" style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
            }} />
        </div>
    );

    /* ── Toggle ── */
    const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <div
                onClick={() => onChange(!value)}
                style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: value ? '#F97316' : '#E2E8F0',
                    position: 'relative', transition: 'background 0.2s ease',
                    flexShrink: 0, cursor: 'pointer',
                }}
            >
                <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: value ? 20 : 2,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
            </div>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{label}</span>
        </label>
    );

    return (
        <div className="animate-fade-in-up" style={{ width: '100%' }}>

            {/* HEADER */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                        background: 'rgba(249,115,22,0.08)', color: '#F97316',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Search size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>
                            Run AI Analysis
                        </h1>
                        <p style={{ fontSize: 13, color: '#94A3B8' }}>
                            Shipment details bharo — 6 AI agents milke cost, risk aur decision denge.
                        </p>
                    </div>
                </div>
            </div>

            {/* MAIN GRID */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.35fr)',
                gap: 24, alignItems: 'start',
            }}>

                {/* ═══ LEFT: FORM ═══ */}
                <div className="animate-slide-in-left" style={{
                    background: '#fff', border: '1px solid #E2E8F0',
                    borderRadius: 20, padding: 24,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <Rocket size={13} color="#F97316" />
                        <span style={sectionTitle}>Shipment Details</span>
                    </div>

                    {/* ── Product + HS Code ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={labelStyle}>📦 Product</label>
                            <SelectWrap>
                                <select style={inputStyle} value={form.product}
                                    onChange={e => setField('product', e.target.value)}
                                    onFocus={onFocus} onBlur={onBlur}>
                                    <option value="">-- Select --</option>
                                    {PRODUCTS.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </SelectWrap>
                        </div>
                        <div>
                            <label style={labelStyle}>🏷️ HS Code</label>
                            <SelectWrap>
                                <select style={inputStyle} value={form.hs_code}
                                    onChange={e => setField('hs_code', e.target.value)}
                                    onFocus={onFocus} onBlur={onBlur}>
                                    <option value="">-- Select --</option>
                                    {HS_CODES.map(h => (
                                        <option key={h.code + h.label} value={h.code}>
                                            {h.label} ({h.code})
                                        </option>
                                    ))}
                                </select>
                            </SelectWrap>
                        </div>
                    </div>

                    {/* ── Origin + Destination ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={labelStyle}>🏙️ Origin City</label>
                            <SelectWrap>
                                <select style={inputStyle} value={form.origin}
                                    onChange={e => setField('origin', e.target.value)}
                                    onFocus={onFocus} onBlur={onBlur}>
                                    <option value="">-- Select --</option>
                                    {CITIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </SelectWrap>
                        </div>
                        <div>
                            <label style={labelStyle}>📍 Destination</label>
                            <SelectWrap>
                                <select style={inputStyle} value={form.destination}
                                    onChange={e => setField('destination', e.target.value)}
                                    onFocus={onFocus} onBlur={onBlur}>
                                    <option value="">-- Select --</option>
                                    {CITIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </SelectWrap>
                        </div>
                    </div>

                    {/* ── Weight ── */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>⚖️ Weight (kg)</label>
                        <input
                            type="number" min="1" step="1"
                            style={inputStyle}
                            placeholder="e.g. 5000"
                            value={form.weight_kg}
                            onChange={e => setField('weight_kg', e.target.value)}
                            onFocus={onFocus} onBlur={onBlur}
                        />
                    </div>

                    {/* ── Shipment mode + Load type ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={labelStyle}>🚛 Mode</label>
                            <SelectWrap>
                                <select style={inputStyle} value={form.shipment_type}
                                    onChange={e => setField('shipment_type', e.target.value as FormState['shipment_type'])}
                                    onFocus={onFocus} onBlur={onBlur}>
                                    {SHIPMENT_MODES.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </SelectWrap>
                        </div>
                        <div>
                            <label style={labelStyle}>📐 Load type</label>
                            <SelectWrap>
                                <select style={inputStyle} value={form.load_type}
                                    onChange={e => setField('load_type', e.target.value as FormState['load_type'])}
                                    onFocus={onFocus} onBlur={onBlur}>
                                    {LOAD_TYPES.map(l => (
                                        <option key={l.value} value={l.value}>{l.label}</option>
                                    ))}
                                </select>
                            </SelectWrap>
                        </div>
                    </div>

                    {/* ── Cargo category ── */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>🗂️ Cargo Category</label>
                        <SelectWrap>
                            <select style={inputStyle} value={form.cargo_category}
                                onChange={e => setField('cargo_category', e.target.value as FormState['cargo_category'])}
                                onFocus={onFocus} onBlur={onBlur}>
                                {CARGO_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </SelectWrap>
                    </div>

                    {/* ── Financials ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={labelStyle}>💰 Cargo value (₹)</label>
                            <input type="number" min="0" step="1000"
                                style={inputStyle}
                                placeholder="e.g. 500000"
                                value={form.cargo_value_inr}
                                onChange={e => setField('cargo_value_inr', e.target.value)}
                                onFocus={onFocus} onBlur={onBlur}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>🎯 Your budget (₹)</label>
                            <input type="number" min="0" step="1000"
                                style={inputStyle}
                                placeholder="e.g. 150000"
                                value={form.user_budget_inr}
                                onChange={e => setField('user_budget_inr', e.target.value)}
                                onFocus={onFocus} onBlur={onBlur}
                            />
                        </div>
                    </div>

                    {/* ── Toggles ── */}
                    <div style={{
                        background: '#F8FAFC', borderRadius: 12, padding: '12px 14px',
                        border: '1px solid #E2E8F0', marginBottom: 14,
                        display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                        <Toggle
                            value={form.is_cold_chain}
                            onChange={v => setField('is_cold_chain', v)}
                            label="❄️ Cold chain required"
                        />
                        <Toggle
                            value={form.is_import_export}
                            onChange={v => setField('is_import_export', v)}
                            label="🚢 Import / Export shipment"
                        />
                    </div>

                    {/* ── Port name — show only if import/export ON ── */}
                    {form.is_import_export && (
                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>⚓ Port Name</label>
                            <SelectWrap>
                                <select style={inputStyle} value={form.port_name}
                                    onChange={e => setField('port_name', e.target.value)}
                                    onFocus={onFocus} onBlur={onBlur}>
                                    {PORT_NAMES.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </SelectWrap>
                        </div>
                    )}

                    {/* ── Advanced (collapsible) ── */}
                    <button
                        onClick={() => setShowAdv(v => !v)}
                        style={{
                            width: '100%', background: 'none', border: '1px dashed #E2E8F0',
                            borderRadius: 10, padding: '9px 14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 14,
                        }}
                    >
                        <span>Advanced options (warehouse days)</span>
                        <ChevronDown size={14} style={{
                            transform: showAdv ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease',
                        }} />
                    </button>

                    {showAdv && (
                        <div style={{ marginBottom: 14 }}>
                            <div style={dividerLabel}>
                                <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                                <Warehouse size={11} />
                                <span>Warehouse Days</span>
                                <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelStyle}>Origin (days)</label>
                                    <input type="number" min="0" max="30"
                                        style={inputStyle}
                                        value={form.warehouse_days_origin}
                                        onChange={e => setField('warehouse_days_origin', e.target.value)}
                                        onFocus={onFocus} onBlur={onBlur}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Destination (days)</label>
                                    <input type="number" min="0" max="30"
                                        style={inputStyle}
                                        value={form.warehouse_days_destination}
                                        onChange={e => setField('warehouse_days_destination', e.target.value)}
                                        onFocus={onFocus} onBlur={onBlur}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Scenario ── */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>📝 Scenario (optional)</label>
                        <textarea
                            style={{ ...inputStyle, resize: 'none', lineHeight: 1.65 }}
                            rows={3}
                            placeholder="e.g. Urgent pharma shipment before monsoon season..."
                            value={form.scenario}
                            onChange={e => setField('scenario', e.target.value)}
                            onFocus={onFocus} onBlur={onBlur}
                        />
                    </div>

                    {/* ── Submit ── */}
                    <button
                        onClick={handleAnalyze}
                        disabled={status === 'running'}
                        className={status !== 'running' ? 'btn-glow' : ''}
                        style={{
                            width: '100%', padding: '13px', borderRadius: 14,
                            fontSize: 14, fontWeight: 700, border: 'none',
                            cursor: status === 'running' ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: status === 'running'
                                ? '#F1F5F9'
                                : 'linear-gradient(135deg, #F97316, #EA580C)',
                            color:  status === 'running' ? '#94A3B8' : '#fff',
                            boxShadow: status === 'running' ? 'none' : '0 4px 20px rgba(249,115,22,0.32)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {status === 'running'
                            ? <><Loader2 size={16} className="animate-spin" /> Analyzing — please wait...</>
                            : <><Rocket size={16} /> Analyze Supply Chain</>}
                    </button>

                    {status === 'error' && (
                        <div className="animate-bounce-in" style={{
                            marginTop: 14, padding: '12px 16px',
                            background: 'rgba(239,68,68,0.06)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#EF4444',
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    <div style={{
                        marginTop: 16, padding: '11px 14px',
                        background: 'rgba(59,130,246,0.05)',
                        border: '1px solid rgba(59,130,246,0.15)',
                        borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                        <Info size={12} color="#3B82F6" style={{ marginTop: 1, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.65 }}>
                            6 AI agents run in parallel — Demand → Route → Supplier → Risk → Cost → Final Decision.
                            Average wait: <strong style={{ color: '#3B82F6' }}>~20–30 sec</strong>
                        </p>
                    </div>
                </div>

                {/* ═══ RIGHT ═══ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Agent Status */}
                    <div className="animate-slide-in-right" style={{
                        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 20,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Loader2 size={13} color="#3B82F6"
                                    className={status === 'running' ? 'animate-spin' : ''} />
                                <span style={sectionTitle}>Live Agent Status</span>
                            </div>
                            {status === 'running' && (
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#F97316' }}>
                                    {agentIdx + 1} / {agents.length}
                                </span>
                            )}
                            {status === 'done' && (
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle size={13} /> Complete
                                </span>
                            )}
                        </div>

                        {(status === 'running' || status === 'done') && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ height: 4, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: status === 'done' ? '100%' : `${((agentIdx + 1) / agents.length) * 100}%`,
                                        background: 'linear-gradient(90deg, #F97316, #3B82F6)',
                                        borderRadius: 99, transition: 'width 0.6s ease',
                                    }} />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {agents.map((ag, i) => {
                                const state = agentState(i);
                                return (
                                    <div key={ag.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 13px', borderRadius: 12, border: '1px solid',
                                        transition: 'all 0.35s ease',
                                        background:
                                            state === 'running' ? 'rgba(245,158,11,0.06)' :
                                            state === 'done'    ? 'rgba(16,185,129,0.05)'  : '#F8FAFC',
                                        borderColor:
                                            state === 'running' ? 'rgba(245,158,11,0.3)'  :
                                            state === 'done'    ? 'rgba(16,185,129,0.25)'  : '#E2E8F0',
                                        boxShadow: state === 'running' ? '0 0 14px rgba(245,158,11,0.1)' : 'none',
                                        transform: state === 'running' ? 'scale(1.01)' : 'scale(1)',
                                    }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                            background:
                                                state === 'done'    ? 'rgba(16,185,129,0.1)'  :
                                                state === 'running' ? 'rgba(245,158,11,0.1)'  : '#F1F5F9',
                                            color:
                                                state === 'done'    ? '#10B981' :
                                                state === 'running' ? '#F59E0B' : '#CBD5E1',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {ag.icon}
                                        </div>
                                        <span style={{
                                            flex: 1, fontSize: 12, fontWeight: 500,
                                            color: state === 'waiting' ? '#94A3B8' : '#0F172A',
                                        }}>
                                            {ag.label}
                                        </span>
                                        {state === 'running' && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>
                                                <Loader2 size={11} className="animate-spin" /> Running
                                            </span>
                                        )}
                                        {state === 'done' && (
                                            <span className="animate-bounce-in" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#10B981' }}>
                                                <CheckCircle2 size={11} /> Done
                                            </span>
                                        )}
                                        {state === 'waiting' && (
                                            <span style={{ fontSize: 11, fontWeight: 500, color: '#CBD5E1' }}>Waiting</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Waiting for n8n message */}
                        {status === 'running' && agentIdx >= agents.length - 1 && (
                            <div style={{
                                marginTop: 14, padding: '10px 13px',
                                background: 'rgba(249,115,22,0.05)',
                                border: '1px solid rgba(249,115,22,0.2)',
                                borderRadius: 10, fontSize: 12, color: '#F97316',
                                display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
                            }}>
                                <Loader2 size={13} className="animate-spin" />
                                n8n se final response aa raha hai... thoda wait karo
                            </div>
                        )}
                    </div>

                    {/* ═══ RESULT CARD ═══ */}
                    {status === 'done' && result && dcfg && (
                        <div className="animate-scale-in" style={{
                            background: '#fff', border: `1px solid ${dcfg.border}`,
                            borderRadius: 20, padding: 22,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                                <BarChart3 size={13} color="#F97316" />
                                <span style={sectionTitle}>Final Analysis Result</span>
                            </div>

                            {/* Decision + Confidence */}
                            <div style={{
                                background: dcfg.bg, border: `1px solid ${dcfg.border}`,
                                borderRadius: 14, padding: '16px 18px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: 18,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ color: dcfg.color }}>{dcfg.icon}</div>
                                    <div>
                                        <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>🤖 AI DECISION</p>
                                        <p style={{ fontSize: 24, fontWeight: 900, color: dcfg.color, lineHeight: 1 }}>
                                            {result.decision ?? 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginBottom: 5 }}>Confidence</p>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <svg width="64" height="64" viewBox="0 0 64 64">
                                            <circle cx="32" cy="32" r="26" fill="none" stroke="#F1F5F9" strokeWidth="6" />
                                            <circle cx="32" cy="32" r="26" fill="none" stroke={dcfg.color}
                                                strokeWidth="6" strokeLinecap="round"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={circumference * (1 - confidence / 100)}
                                                transform="rotate(-90 32 32)"
                                                style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                                            />
                                        </svg>
                                        <span style={{
                                            position: 'absolute', top: '50%', left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            fontSize: 12, fontWeight: 800, color: dcfg.color,
                                        }}>
                                            {confidence}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                                {([
                                    { icon: <Truck size={12} />,       label: 'Best Route',    value: result.best_route    ?? '-', isRisk: false },
                                    { icon: <Factory size={12} />,     label: 'Best Supplier', value: result.best_supplier ?? '-', isRisk: false },
                                    { icon: <IndianRupee size={12} />, label: 'Total Cost',    value: fmt(result.total_cost_inr),   isRisk: false },
                                    { icon: <Clock size={12} />,       label: 'Delivery Time', value: (result.estimated_delivery_hours ?? 0) + ' hrs', isRisk: false },
                                    { icon: <Shield size={12} />,      label: 'Overall Risk',  value: result.overall_risk  ?? '-', isRisk: true  },
                                    { icon: <TrendingUp size={12} />,  label: 'Demand Trend',  value: result.demand_trend  ?? '-', isRisk: false },
                                ] as { icon: React.ReactNode; label: string; value: string; isRisk: boolean }[]).map(item => (
                                    <div key={item.label} style={{
                                        background: '#F8FAFC', borderRadius: 10, padding: '10px 12px',
                                        border: '1px solid transparent',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, color: '#94A3B8' }}>
                                            {item.icon}
                                            <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {item.label}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: item.isRisk ? riskHex(item.value) : '#0F172A' }}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Budget Status */}
                            {result.budget_status && result.budget_status !== 'NOT_PROVIDED' && (
                                <div style={{
                                    marginBottom: 14, padding: '11px 14px', borderRadius: 12,
                                    background: result.budget_status === 'WITHIN_BUDGET'
                                        ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                                    border: `1px solid ${result.budget_status === 'WITHIN_BUDGET'
                                        ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                        <IndianRupee size={12} color={result.budget_status === 'WITHIN_BUDGET' ? '#10B981' : '#EF4444'} />
                                        <span style={{
                                            fontSize: 10, fontWeight: 700,
                                            color: result.budget_status === 'WITHIN_BUDGET' ? '#10B981' : '#EF4444',
                                            textTransform: 'uppercase', letterSpacing: '0.8px',
                                        }}>
                                            {result.budget_status === 'WITHIN_BUDGET' ? 'Within Budget' : 'Over Budget'}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                        {result.budget_verdict ?? ''}
                                    </p>
                                    {(result.budget_surplus ?? 0) > 0 && (
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginTop: 3 }}>
                                            Savings: {fmt(result.budget_surplus)}
                                        </p>
                                    )}
                                    {(result.budget_shortfall ?? 0) > 0 && (
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', marginTop: 3 }}>
                                            Shortfall: {fmt(result.budget_shortfall)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Mode Comparison */}
                            {allModes && (
                                <div style={{ marginBottom: 14 }}>
                                    <p style={{ ...sectionTitle, marginBottom: 8 }}>Transport mode comparison</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
                                        {(['road', 'rail', 'air'] as const).map(mode => {
                                            const isCheapest = cheapestMode?.toUpperCase() === mode.toUpperCase();
                                            const isFastest  = fastestMode?.toUpperCase()  === mode.toUpperCase();
                                            const modeData   = rcb?.[mode];
                                            const cost       = allModes[mode] ?? modeData?.grand_total;
                                            const timeHrs    = modeData?.time_hrs;
                                            return (
                                                <div key={mode} style={{
                                                    background: isCheapest ? 'rgba(16,185,129,0.06)' : '#F8FAFC',
                                                    border: isCheapest
                                                        ? '1.5px solid rgba(16,185,129,0.35)'
                                                        : '1px solid #E2E8F0',
                                                    borderRadius: 10, padding: '9px 10px', textAlign: 'center',
                                                }}>
                                                    <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 3 }}>
                                                        {mode === 'road' ? '🚛' : mode === 'rail' ? '🚂' : '✈️'} {mode}
                                                    </p>
                                                    <p style={{ fontSize: 13, fontWeight: 800, color: isCheapest ? '#10B981' : '#0F172A', marginBottom: 1 }}>
                                                        {cost != null ? fmt(cost) : '—'}
                                                    </p>
                                                    {timeHrs != null && (
                                                        <p style={{ fontSize: 10, color: '#94A3B8' }}>{timeHrs} hrs</p>
                                                    )}
                                                    {isCheapest && (
                                                        <span style={{ fontSize: 8, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '1px 5px', borderRadius: 3, marginTop: 3, display: 'inline-block' }}>
                                                            CHEAPEST
                                                        </span>
                                                    )}
                                                    {isFastest && !isCheapest && (
                                                        <span style={{ fontSize: 8, fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '1px 5px', borderRadius: 3, marginTop: 3, display: 'inline-block' }}>
                                                            FASTEST
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                    {([
                                        { key: 'transport', label: '🚛 Transport' },
                                        { key: 'extras',    label: '📦 Extras'    },
                                        { key: 'agents',    label: '🤖 Scores'    },
                                    ] as { key: 'transport' | 'extras' | 'agents'; label: string }[]).map(tab => (
                                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                            padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                            border: '1px solid', cursor: 'pointer', transition: 'all 0.2s ease',
                                            background: activeTab === tab.key ? '#F97316' : '#F8FAFC',
                                            color: activeTab === tab.key ? '#fff' : '#64748B',
                                            borderColor: activeTab === tab.key ? '#F97316' : '#E2E8F0',
                                        }}>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Transport Tab */}
                                {activeTab === 'transport' && road && (
                                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '13px 14px', border: '1px solid #E2E8F0' }}>
                                        <p style={{ ...sectionTitle, marginBottom: 8 }}>Road cost breakdown</p>
                                        {[
                                            { label: 'Base freight',       value: road.base_freight      },
                                            { label: 'Fuel surcharge',     value: road.fuel_surcharge    },
                                            { label: 'Toll charges',       value: road.toll_charges      },
                                            { label: 'Loading/unloading',  value: road.loading_unloading },
                                            { label: 'Load type',          value: road.load_type, isText: true },
                                            { label: 'Rate per km',        value: road.rate_per_km, isText: true },
                                            { label: 'GST',                value: road.gst               },
                                            { label: 'Insurance',          value: road.insurance         },
                                            { label: 'Warehouse',          value: road.warehouse         },
                                            { label: 'Packaging',          value: road.packaging         },
                                            { label: 'Cold chain',         value: road.cold_chain        },
                                            { label: 'Port/Customs',       value: road.port_customs      },
                                        ].map(row => row.value != null && row.value !== 0 && (
                                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #E2E8F0' }}>
                                                <span style={{ fontSize: 11, color: '#64748B' }}>{row.label}</span>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>
                                                    {(row as any).isText ? String(row.value) : fmt(row.value as number)}
                                                </span>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 0' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Grand Total</span>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#F97316' }}>{fmt(road.grand_total)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Extras Tab */}
                                {activeTab === 'extras' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                        {wh && (
                                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                                                    <Warehouse size={12} color="#8B5CF6" />
                                                    <p style={{ ...sectionTitle, color: '#8B5CF6' }}>Warehouse & Storage</p>
                                                </div>
                                                {[
                                                    { label: 'Rate/kg/day',       value: wh.rate_per_kg_per_day, isText: true },
                                                    { label: 'Origin storage',     value: wh.origin_warehouse?.storage       },
                                                    { label: 'Origin handling in', value: wh.origin_warehouse?.handling_in   },
                                                    { label: 'Origin handling out',value: wh.origin_warehouse?.handling_out  },
                                                    { label: 'Dest storage',       value: wh.destination_warehouse?.storage      },
                                                    { label: 'Dest handling in',   value: wh.destination_warehouse?.handling_in  },
                                                    { label: 'Safety stock cost',  value: wh.safety_stock_holding_cost       },
                                                ].map(row => row.value != null && (
                                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #E2E8F0' }}>
                                                        <span style={{ fontSize: 11, color: '#64748B' }}>{row.label}</span>
                                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>
                                                            {(row as any).isText ? String(row.value) : fmt(row.value as number)}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0' }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700 }}>Total</span>
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#8B5CF6' }}>{fmt(wh.warehouse_total_inr)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {pkg && (
                                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                                                    <Box size={12} color="#3B82F6" />
                                                    <p style={{ ...sectionTitle, color: '#3B82F6' }}>Packaging</p>
                                                </div>
                                                {[
                                                    { label: 'Type',           value: pkg.packaging_type, isText: true },
                                                    { label: 'Material cost',  value: pkg.packaging_material_cost ?? pkg.material_cost },
                                                    { label: 'Labour cost',    value: pkg.packing_labour_cost ?? pkg.labour_cost   },
                                                    { label: 'Cold insulation',value: pkg.cold_chain_insulation                    },
                                                    { label: 'Hazmat fee',     value: pkg.hazmat_special_fee                       },
                                                ].map(row => row.value != null && (
                                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #E2E8F0' }}>
                                                        <span style={{ fontSize: 11, color: '#64748B' }}>{row.label}</span>
                                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>
                                                            {(row as any).isText ? String(row.value) : fmt(row.value as number)}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0' }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700 }}>Total</span>
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#3B82F6' }}>{fmt(pkg.packaging_total_inr)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {cold && cold.cold_chain_applicable && (
                                            <div style={{ background: 'rgba(59,130,246,0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                                                    <Thermometer size={12} color="#3B82F6" />
                                                    <p style={{ ...sectionTitle, color: '#3B82F6' }}>Cold Chain</p>
                                                </div>
                                                {[
                                                    { label: 'Reefer surcharge',   value: cold.reefer_vehicle_surcharge ?? cold.reefer_transport_extra },
                                                    { label: 'Pre-cooling',         value: cold.pre_cooling_cost     },
                                                    { label: 'Cold storage',        value: cold.cold_storage_destination ?? cold.transit_cold_storage },
                                                    { label: 'Temp monitoring',     value: cold.temp_monitoring ?? cold.temperature_monitoring },
                                                    { label: 'Compliance cert',     value: cold.compliance_certification ?? cold.insurance_uplift },
                                                ].map(row => row.value != null && (
                                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                                                        <span style={{ fontSize: 11, color: '#64748B' }}>{row.label}</span>
                                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{fmt(row.value)}</span>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0' }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700 }}>Total</span>
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#3B82F6' }}>{fmt(cold.cold_chain_total_inr)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {cold && !cold.cold_chain_applicable && (
                                            <div style={{ padding: '9px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 7 }}>
                                                <Thermometer size={12} /> Cold chain not required
                                            </div>
                                        )}

                                        {gst && (
                                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                                                <p style={{ ...sectionTitle, marginBottom: 7 }}>GST & Insurance</p>
                                                {[
                                                    { label: 'GST rate',         value: ((gst.gst_rate_percent ?? gst.rate_percent) ?? 0) + '%', isText: true },
                                                    { label: 'IGST on goods',    value: gst.igst_on_goods  },
                                                    { label: 'Freight GST',      value: gst.freight_gst ?? gst.freight_gst_5pct },
                                                    { label: 'Total GST',        value: gst.total_gst      },
                                                    { label: 'Insurance premium',value: ins?.premium       },
                                                    { label: 'GST on premium',   value: ins?.gst_on_premium},
                                                    { label: 'Insurance total',  value: ins?.insurance_total ?? ins?.total },
                                                ].map(row => row.value != null && (
                                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #E2E8F0' }}>
                                                        <span style={{ fontSize: 11, color: '#64748B' }}>{row.label}</span>
                                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>
                                                            {(row as any).isText ? String(row.value) : fmt(row.value as number)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {port && (port.port_applicable !== false && port.applicable !== false) && (port.port_total_inr ?? port.total) != null && (
                                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                                                <p style={{ ...sectionTitle, marginBottom: 7 }}>Port & Customs</p>
                                                {[
                                                    { label: 'THC',           value: port.thc_terminal_handling ?? port.thc },
                                                    { label: 'Documentation', value: port.documentation_fee ?? port.docs   },
                                                    { label: 'CHA fee',       value: port.cha_agent_fee ?? port.cha_fee    },
                                                    { label: 'BCD duty',      value: port.bcd_amount ?? port.bcd_duty      },
                                                    { label: 'SWS',           value: port.social_welfare_surcharge ?? port.sws },
                                                    { label: 'IGST import',   value: port.igst_on_import ?? port.igst_import },
                                                    { label: 'Total',         value: port.port_total_inr ?? port.total     },
                                                ].map(row => row.value != null && (
                                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #E2E8F0' }}>
                                                        <span style={{ fontSize: 11, color: '#64748B' }}>{row.label}</span>
                                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{fmt(row.value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {port && (port.port_applicable === false || port.applicable === false) && (
                                            <div style={{ padding: '9px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 11, color: '#94A3B8' }}>
                                                🚢 Port/Customs not applicable (domestic shipment)
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Scores Tab */}
                                {activeTab === 'agents' && (
                                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '13px 14px', border: '1px solid #E2E8F0' }}>
                                        <p style={{ ...sectionTitle, marginBottom: 10 }}>Agent score breakdown</p>
                                        {agentScores.map(s => (
                                            <div key={s.label} style={{ marginBottom: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>{s.label}</span>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}%</span>
                                                </div>
                                                <div style={{ height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', width: `${s.value}%`,
                                                        background: `linear-gradient(90deg, ${s.color}88, ${s.color})`,
                                                        borderRadius: 99, transition: 'width 1.1s ease',
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: 8, padding: '9px 11px', background: '#fff', borderRadius: 9, border: '1px solid #E2E8F0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                <span style={{ fontSize: 11, color: '#64748B' }}>Distance</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{rcb?.distance_km ?? '—'} km</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                <span style={{ fontSize: 11, color: '#64748B' }}>Peak month</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{result.peak_month ?? '—'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: 11, color: '#64748B' }}>Risk score</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: riskHex(result.overall_risk ?? '') }}>
                                                    {result.risk_score ?? '—'} / 100
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cost Saving Tip */}
                            {result.cost_saving_tip && (
                                <div style={{
                                    marginBottom: 14, padding: '11px 13px',
                                    background: 'rgba(245,158,11,0.05)',
                                    border: '1px solid rgba(245,158,11,0.2)',
                                    borderRadius: 10, display: 'flex', gap: 8, alignItems: 'flex-start',
                                }}>
                                    <Scale size={12} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
                                    <div>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                            Cost Saving Tip
                                        </span>
                                        <p style={{ fontSize: 11, color: '#475569', marginTop: 2, lineHeight: 1.6 }}>
                                            {result.cost_saving_tip}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Final Recommendation */}
                            <div style={{
                                background: 'rgba(249,115,22,0.04)',
                                border: '1px solid rgba(249,115,22,0.15)',
                                borderLeft: '3px solid #F97316',
                                borderRadius: 10, padding: '12px 14px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                    <Package size={12} color="#F97316" />
                                    <span style={{ ...sectionTitle, color: '#F97316' }}>Final Recommendation</span>
                                </div>
                                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.75 }}>
                                    {result.final_recommendation ?? '-'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
