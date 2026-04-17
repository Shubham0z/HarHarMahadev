import { useState } from 'react';
import {
    FlaskConical, Bot, TrendingUp, AlertTriangle,
    IndianRupee, Clock, Shield, Zap, CheckCircle, Loader2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface ScenarioResult {
    impact: string;
    cost_increase: string;
    delay_days: string;
    confidence: number;
    recovery_days: number;
    affected_cities: string[];
    affected_products: string[];
    action: string;
    steps: string[];
    agent_outputs: Record<string, string>;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function parseField<T>(val: unknown): T {
    if (typeof val === 'string') {
        try { return JSON.parse(val) as T; } catch { return val as unknown as T; }
    }
    return val as T;
}

function normalizeResult(raw: Record<string, unknown>): ScenarioResult {
    return {
        impact:            String(raw.impact            ?? 'MEDIUM'),
        cost_increase:     String(raw.cost_increase     ?? '+0%'),
        delay_days:        String(raw.delay_days        ?? '+0 avg'),
        confidence:        Number(raw.confidence)       || 0,
        recovery_days:     Number(raw.recovery_days)    || 0,
        affected_cities:   parseField<string[]>(raw.affected_cities)   ?? [],
        affected_products: parseField<string[]>(raw.affected_products) ?? [],
        action:            String(raw.action            ?? ''),
        steps:             parseField<string[]>(raw.steps)             ?? [],
        agent_outputs:     parseField<Record<string, string>>(raw.agent_outputs) ?? {},
    };
}

// ── Static scenario metadata ───────────────────────────────────────────────
const scenarios = [
    { id: 1, title: 'Monsoon Season Impact', icon: '🌧️', desc: 'What if monsoon delays all road routes from Mumbai by 6hrs for 30 days?',  tag: 'Weather',     tagColor: '#3B82F6' },
    { id: 2, title: 'Demand Spike +30%',     icon: '📈', desc: 'What if Pharma demand spikes 30% in Chennai next month?',                   tag: 'Demand',      tagColor: '#F97316' },
    { id: 3, title: 'Supplier Failure',      icon: '🏭', desc: 'What if top supplier for Pharma goes offline for 2 weeks?',                  tag: 'Supplier',    tagColor: '#EF4444' },
    { id: 4, title: 'Fuel Price +20%',       icon: '⛽', desc: 'What if diesel prices increase 20% on Mumbai–Chennai corridor?',             tag: 'Economic',    tagColor: '#F59E0B' },
    { id: 5, title: 'Port Strike',           icon: '🚢', desc: 'What if Chennai port is blocked for 5 days impacting Pharma?',               tag: 'Disruption',  tagColor: '#EF4444' },
    { id: 6, title: 'Cold Chain Breakdown',  icon: '❄️', desc: 'What if refrigeration units fail on Mumbai–Chennai corridor?',               tag: 'Operational', tagColor: '#8B5CF6' },
];

const HARDCODED = { product: 'Pharma', origin: 'Mumbai', destination: 'Chennai', overall_risk: 'HIGH' };

const impactHex: Record<string, string> = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#10B981' };

const css = {
    sectionTitle: {
        fontSize: 11, fontWeight: 700, color: '#94A3B8',
        letterSpacing: '1.2px', textTransform: 'uppercase' as const,
    } as React.CSSProperties,
    card: {
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: 20, padding: 20, transition: 'all 0.25s ease',
    } as React.CSSProperties,
};

const N8N_WEBHOOK = 'https://chandn8n.app.n8n.cloud/webhook/supplychain/scenario-simulate';

// ── Component ──────────────────────────────────────────────────────────────
export default function ScenariosPage() {
    const [selected,       setSelected]       = useState<typeof scenarios[0] | null>(null);
    const [dynamicResults, setDynamicResults] = useState<Record<number, ScenarioResult>>({});
    const [loadingId,      setLoadingId]      = useState<number | null>(null);
    const [errorId,        setErrorId]        = useState<number | null>(null);

    const handleScenarioClick = async (sc: typeof scenarios[0]) => {
        setSelected(sc);
        setErrorId(null);
        if (dynamicResults[sc.id]) return;

        setLoadingId(sc.id);
        try {
            const res = await fetch(N8N_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario_id:    sc.id,
                    scenario_title: sc.title,
                    product:        HARDCODED.product,
                    origin:         HARDCODED.origin,
                    destination:    HARDCODED.destination,
                    custom_input:   sc.desc,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const raw = await res.json();
            setDynamicResults(prev => ({ ...prev, [sc.id]: normalizeResult(raw as Record<string, unknown>) }));
        } catch (err) {
            console.error('Scenario fetch failed:', err);
            setErrorId(sc.id);
        } finally {
            setLoadingId(null);
        }
    };

    const res       = selected ? (dynamicResults[selected.id] ?? null) : null;
    const isLoading = loadingId === selected?.id;
    const isError   = errorId   === selected?.id;

    return (
        <div className="animate-fade-in-up" style={{ width: '100%' }}>

            {/* ══ HEADER ══ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(59,130,246,0.08)', color: '#3B82F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <FlaskConical size={20} />
                </div>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>
                        What-If Scenario Lab
                    </h1>
                    <p style={{ fontSize: 14, color: '#94A3B8' }}>
                        AI-powered scenarios for: {HARDCODED.product} · {HARDCODED.origin} → {HARDCODED.destination}
                    </p>
                </div>
            </div>

            {/* ══ LIVE CONTEXT BANNER ══ */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(249,115,22,0.06))',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 16, padding: '14px 20px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
                <Bot size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#475569', flex: 1 }}>
                    Scenarios personalized for:{' '}
                    <strong>{HARDCODED.product}</strong> from{' '}
                    <strong>{HARDCODED.origin}</strong> →{' '}
                    <strong>{HARDCODED.destination}</strong> · Risk:{' '}
                    <strong style={{ color: impactHex[HARDCODED.overall_risk] }}>
                        {HARDCODED.overall_risk}
                    </strong>
                </p>
            </div>

            {/* ══ MAIN GRID ══ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.3fr)',
                gap: 24, alignItems: 'start',
            }}>

                {/* ── LEFT: SCENARIO LIST ── */}
                <div>
                    <p style={{ ...css.sectionTitle, marginBottom: 14 }}>Select a Scenario →</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {scenarios.map((sc, idx) => {
                            const isActive  = selected?.id === sc.id;
                            const isDone    = !!dynamicResults[sc.id];
                            const isRunning = loadingId === sc.id;
                            return (
                                <div key={sc.id}
                                    style={{
                                        background: isActive ? 'rgba(249,115,22,0.04)' : '#fff',
                                        border: `1px solid ${isActive ? 'rgba(249,115,22,0.35)' : '#E2E8F0'}`,
                                        borderRadius: 18, padding: '16px 18px',
                                        cursor: isRunning ? 'wait' : 'pointer',
                                        transition: 'all 0.22s ease',
                                        boxShadow: isActive ? '0 4px 20px rgba(249,115,22,0.12)' : 'none',
                                        transform: isActive ? 'scale(1.01)' : 'scale(1)',
                                        opacity: loadingId && !isActive ? 0.55 : 1,
                                        animationDelay: `${idx * 60}ms`,
                                    }}
                                    onClick={() => !isRunning && handleScenarioClick(sc)}
                                    onMouseEnter={e => {
                                        if (!isActive) Object.assign((e.currentTarget as HTMLDivElement).style, {
                                            borderColor: 'rgba(249,115,22,0.2)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                                        });
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) Object.assign((e.currentTarget as HTMLDivElement).style, {
                                            borderColor: '#E2E8F0',
                                            transform: 'translateY(0)',
                                            boxShadow: 'none',
                                        });
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <span style={{
                                            fontSize: 24, display: 'inline-block',
                                            transform: isActive ? 'scale(1.2)' : 'scale(1)',
                                            transition: 'transform 0.2s ease',
                                        }}>
                                            {isRunning ? '⚙️' : sc.icon}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {isDone && !isRunning && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                                                    background: 'rgba(16,185,129,0.1)', color: '#10B981',
                                                    border: '1px solid rgba(16,185,129,0.2)',
                                                }}>✓ Done</span>
                                            )}
                                            {isRunning && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                                                    background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                                                    border: '1px solid rgba(59,130,246,0.2)',
                                                }}>Simulating...</span>
                                            )}
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 7,
                                                letterSpacing: '0.5px',
                                                background: `${sc.tagColor}12`, color: sc.tagColor,
                                                border: `1px solid ${sc.tagColor}25`,
                                            }}>{sc.tag}</span>
                                        </div>
                                    </div>
                                    <h3 style={{
                                        fontSize: 13, fontWeight: 700, marginBottom: 5,
                                        color: isActive ? '#F97316' : '#0F172A', transition: 'color 0.2s',
                                    }}>{sc.title}</h3>
                                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65 }}>{sc.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── RIGHT: RESULT PANEL ── */}
                <div style={{ position: 'sticky', top: 88 }}>

                    {/* Loading */}
                    {isLoading && (
                        <div style={{ ...css.card, textAlign: 'center', padding: '56px 24px',
                            border: '1px solid rgba(59,130,246,0.2)',
                            boxShadow: '0 4px 24px rgba(59,130,246,0.08)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                                <Loader2 size={36} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#3B82F6', marginBottom: 14 }}>
                                AI Agents Simulating...
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                                {['Demand', 'Risk', 'Logistics', 'Supplier', 'Cost'].map(agent => (
                                    <span key={agent} style={{
                                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8,
                                        background: 'rgba(59,130,246,0.08)', color: '#3B82F6',
                                        border: '1px solid rgba(59,130,246,0.15)',
                                    }}>{agent} Agent</span>
                                ))}
                            </div>
                            <p style={{ fontSize: 11, color: '#94A3B8' }}>Running via n8n · Groq AI</p>
                        </div>
                    )}

                    {/* Error */}
                    {!isLoading && isError && (
                        <div style={{ ...css.card, textAlign: 'center', padding: '48px 24px',
                            border: '1px solid rgba(239,68,68,0.2)',
                        }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Simulation Failed</p>
                            <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20, lineHeight: 1.65 }}>
                                Could not connect to n8n. Make sure the workflow is Active.
                            </p>
                            <button onClick={() => selected && handleScenarioClick(selected)} style={{
                                padding: '8px 20px', borderRadius: 10, border: 'none',
                                background: '#EF4444', color: '#fff',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            }}>Retry</button>
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !isError && (!selected || !res) && (
                        <div style={{ ...css.card, textAlign: 'center', padding: '64px 24px' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 18,
                                background: '#F8FAFC', color: '#CBD5E1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 18px',
                            }}>
                                <FlaskConical size={28} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                                No Scenario Selected
                            </p>
                            <p style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.65 }}>
                                Pick a scenario — AI simulates real impact using your route data
                            </p>
                        </div>
                    )}

                    {/* ── RESULT ── */}
                    {!isLoading && !isError && selected && res && (
                        <div style={{
                            ...css.card, padding: 0, overflow: 'hidden',
                            border: '1px solid rgba(249,115,22,0.2)',
                            boxShadow: '0 4px 24px rgba(249,115,22,0.08)',
                        }}>
                            {/* Title bar */}
                            <div style={{
                                padding: '20px 20px 16px', borderBottom: '1px solid #F1F5F9',
                                display: 'flex', gap: 14, alignItems: 'flex-start',
                            }}>
                                <span style={{ fontSize: 36, flexShrink: 0 }}>{selected.icon}</span>
                                <div>
                                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                                        {selected.title}
                                    </h2>
                                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 6 }}>
                                        {selected.desc}
                                    </p>
                                    <span style={{
                                        fontSize: 11, color: '#3B82F6', fontWeight: 600,
                                        background: 'rgba(59,130,246,0.06)', padding: '2px 8px',
                                        borderRadius: 6, display: 'inline-block',
                                    }}>
                                        📍 {HARDCODED.product} · {HARDCODED.origin} → {HARDCODED.destination}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: 20 }}>

                                {/* Primary metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                                    {[
                                        { label: 'Business Impact', val: res.impact,        icon: <AlertTriangle size={14} />, color: impactHex[res.impact] ?? '#94A3B8' },
                                        { label: 'Cost Increase',   val: res.cost_increase, icon: <IndianRupee size={14} />,   color: '#EF4444' },
                                        { label: 'Avg Delay',       val: res.delay_days,    icon: <Clock size={14} />,         color: '#F59E0B' },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            background: `${item.color}08`, border: `1px solid ${item.color}20`,
                                            borderRadius: 14, padding: '14px 10px', textAlign: 'center', transition: 'all 0.2s',
                                        }}
                                            onMouseEnter={e => Object.assign((e.currentTarget as HTMLDivElement).style, { transform: 'translateY(-2px)', boxShadow: `0 6px 16px ${item.color}18` })}
                                            onMouseLeave={e => Object.assign((e.currentTarget as HTMLDivElement).style, { transform: 'translateY(0)', boxShadow: 'none' })}
                                        >
                                            <div style={{ color: item.color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{item.icon}</div>
                                            <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginBottom: 4 }}>{item.label}</p>
                                            <p style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Secondary metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                                    {[
                                        { label: 'Recovery',   val: `${res.recovery_days}d`, icon: <TrendingUp size={13} />,  color: '#3B82F6' },
                                        { label: 'Confidence', val: `${res.confidence}%`,    icon: <Bot size={13} />,          color: '#8B5CF6' },
                                        { label: 'Steps',      val: `${res.steps.length}`,   icon: <CheckCircle size={13} />, color: '#10B981' },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            background: '#F8FAFC', borderRadius: 12,
                                            padding: '10px', textAlign: 'center', border: '1px solid #E2E8F0',
                                        }}>
                                            <div style={{ color: item.color, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{item.icon}</div>
                                            <p style={{ fontSize: 16, fontWeight: 800, color: item.color, marginBottom: 2 }}>{item.val}</p>
                                            <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{item.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Affected cities + products */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                    {[
                                        { label: 'Affected Cities',   items: res.affected_cities,   bg: 'rgba(239,68,68,0.08)',  color: '#EF4444' },
                                        { label: 'Affected Products', items: res.affected_products, bg: 'rgba(249,115,22,0.08)', color: '#F97316' },
                                    ].map(section => (
                                        <div key={section.label} style={{
                                            background: '#F8FAFC', borderRadius: 12, padding: 12, border: '1px solid #E2E8F0',
                                        }}>
                                            <p style={{ ...css.sectionTitle, marginBottom: 8 }}>{section.label}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                                {(section.items ?? []).map(item => (
                                                    <span key={item} style={{
                                                        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7,
                                                        background: section.bg, color: section.color,
                                                    }}>{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Agent outputs */}
                                {res.agent_outputs && Object.keys(res.agent_outputs).length > 0 && (
                                    <div style={{
                                        background: '#F8FAFC', borderRadius: 12,
                                        padding: 14, border: '1px solid #E2E8F0', marginBottom: 14,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                            <Bot size={13} color="#8B5CF6" />
                                            <span style={{ ...css.sectionTitle, color: '#8B5CF6' }}>Agent-by-Agent Analysis</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                            {Object.entries(res.agent_outputs).map(([agent, output]) => (
                                                <div key={agent} style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                                    padding: '8px 10px', borderRadius: 10,
                                                    background: '#fff', border: '1px solid #E2E8F0',
                                                }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                                                        background: 'rgba(139,92,246,0.08)', color: '#8B5CF6',
                                                        flexShrink: 0, marginTop: 1, textTransform: 'capitalize',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {agent.replace('_agent', '')}
                                                    </span>
                                                    <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{output}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action steps */}
                                <div style={{
                                    background: '#F8FAFC', borderRadius: 12,
                                    padding: 14, border: '1px solid #E2E8F0', marginBottom: 14,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                        <CheckCircle size={13} color="#10B981" />
                                        <span style={{ ...css.sectionTitle, color: '#10B981' }}>Step-by-Step Action Plan</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {(res.steps ?? []).map((step, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                <span style={{
                                                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                                    background: '#10B981', color: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 10, fontWeight: 800, marginTop: 1,
                                                }}>{i + 1}</span>
                                                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.65 }}>{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AI Recommendation */}
                                <div style={{
                                    background: 'rgba(59,130,246,0.04)',
                                    border: '1px solid rgba(59,130,246,0.15)',
                                    borderLeft: '4px solid #3B82F6',
                                    borderRadius: 12, padding: '14px 16px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                                        <Bot size={13} color="#3B82F6" />
                                        <span style={{ ...css.sectionTitle, color: '#3B82F6' }}>AI Recommended Action</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75 }}>{res.action}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info strip */}
                    <div style={{
                        marginTop: 14, padding: '10px 14px',
                        background: 'rgba(59,130,246,0.05)',
                        border: '1px solid rgba(59,130,246,0.15)',
                        borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                        <Zap size={13} color="#3B82F6" style={{ marginTop: 1, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.65 }}>
                            Each scenario runs a <strong style={{ color: '#3B82F6' }}>live n8n multi-agent simulation</strong> via
                            Groq AI. Results cached per session — no repeated API calls.
                        </p>
                    </div>
                </div>
            </div>

            {/* ══ QUICK REFERENCE TABLE ══ */}
            <div style={{ ...css.card, marginTop: 28, padding: '20px 0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 14px' }}>
                    <FlaskConical size={15} color="#F97316" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        All Scenarios — Quick Reference
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>
                        ({Object.keys(dynamicResults).length}/{scenarios.length} simulated this session)
                    </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                {['Scenario', 'Tag', 'Impact', 'Cost ↑', 'Delay', 'Recovery', 'Confidence', 'Status'].map(h => (
                                    <th key={h} style={{
                                        padding: '10px 16px', textAlign: 'left',
                                        fontSize: 10, fontWeight: 700, color: '#94A3B8',
                                        textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {scenarios.map((sc, i) => {
                                const r = dynamicResults[sc.id];
                                const isRunning = loadingId === sc.id;
                                return (
                                    <tr key={sc.id}
                                        style={{
                                            borderBottom: i < scenarios.length - 1 ? '1px solid #F8FAFC' : 'none',
                                            cursor: 'pointer', transition: 'background 0.15s',
                                            background: selected?.id === sc.id ? 'rgba(249,115,22,0.03)' : 'transparent',
                                        }}
                                        onClick={() => handleScenarioClick(sc)}
                                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFF'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = selected?.id === sc.id ? 'rgba(249,115,22,0.03)' : 'transparent'; }}
                                    >
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 18 }}>{sc.icon}</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{sc.title}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7,
                                                background: `${sc.tagColor}12`, color: sc.tagColor,
                                            }}>{sc.tag}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {r ? <span style={{ fontSize: 13, fontWeight: 700, color: impactHex[r.impact] ?? '#94A3B8' }}>{r.impact}</span>
                                               : <span style={{ color: '#CBD5E1', fontSize: 13 }}>—</span>}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: r ? '#EF4444' : '#CBD5E1' }}>
                                            {r?.cost_increase ?? '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: r ? '#F59E0B' : '#CBD5E1' }}>
                                            {r?.delay_days ?? '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: r ? '#3B82F6' : '#CBD5E1', fontWeight: 600 }}>
                                            {r ? `${r.recovery_days}d` : '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {r ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ height: 4, width: 40, borderRadius: 4, background: '#E2E8F0', overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%', borderRadius: 4, width: `${r.confidence}%`,
                                                            background: r.confidence >= 80 ? '#10B981' : r.confidence >= 60 ? '#F59E0B' : '#EF4444',
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{r.confidence}%</span>
                                                </div>
                                            ) : <span style={{ color: '#CBD5E1', fontSize: 13 }}>—</span>}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {isRunning
                                                ? <span style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600 }}>⚙️ Running...</span>
                                                : r
                                                    ? <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>✓ Simulated</span>
                                                    : <span style={{ fontSize: 11, color: '#CBD5E1' }}>Not run</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══ HOW IT WORKS ══ */}
            <div style={{
                marginTop: 24,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(249,115,22,0.05))',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 20, padding: '22px 24px',
                display: 'flex', alignItems: 'flex-start', gap: 16,
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Shield size={18} />
                </div>
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                        How Scenario Lab Works
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '6px 28px' }}>
                        {[
                            'Click any scenario → live AI simulation runs via n8n + Groq',
                            'All 5 agents simulate — Demand, Risk, Logistics, Supplier, Cost',
                            'Results returned directly from n8n webhook response',
                            'Session cache prevents duplicate API calls for same scenario',
                            'Table fills up as you simulate each scenario one by one',
                            'Scenarios hardcoded for Pharma · Mumbai → Chennai route',
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
