import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import {
    AlertTriangle, Search, Shield, RefreshCw, MapPin,
    Lightbulb, TrendingUp, Clock, Zap, CheckCircle,
} from 'lucide-react';
import type { RiskLevel } from '../lib/constants';
import { getLatestAnalysis, type SupabaseAnalysis } from '../lib/supabase';

const WEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const NEWS_KEY    = import.meta.env.VITE_NEWS_API_KEY;

// ─── Parse "Rail route from Kochi to Jaipur" → { origin, destination } ───────
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

const staticRiskEvents = [
    { id: 1, icon: '🌧️', title: 'Heavy Monsoon — Mumbai',      type: 'Weather',  severity: 'HIGH'   as RiskLevel, impact: 'All road routes from Mumbai delayed 4–6 hrs. Warehouse flooding risk in Dharavi.', time: 'Live'      },
    { id: 4, icon: '📦', title: 'Supplier Overload — Thane-3', type: 'Capacity', severity: 'MEDIUM' as RiskLevel, impact: '95% capacity reached. Backup supplier activation recommended.',                      time: '6 hrs ago'  },
    { id: 5, icon: '🚧', title: 'NH48 Road Construction',       type: 'Route',    severity: 'LOW'    as RiskLevel, impact: 'Expect 2 hr delay on Mumbai-Pune corridor. Use NH66 as alternate.',                 time: '1 day ago'  },
    { id: 6, icon: '📰', title: 'Fuel Price Hike +12%',         type: 'Economic', severity: 'MEDIUM' as RiskLevel, impact: 'Estimated 8–15% increase in road transport costs. Pre-book rates now.',             time: '2 days ago' },
];

const sevVariant: Record<RiskLevel, 'success' | 'warning' | 'danger'> = {
    LOW: 'success', MEDIUM: 'warning', HIGH: 'danger',
};
const riskHex   = (r: RiskLevel) => r === 'HIGH' ? '#EF4444' : r === 'MEDIUM' ? '#F59E0B' : '#10B981';
const borderHex = (r: RiskLevel) => r === 'HIGH' ? '#EF4444' : r === 'MEDIUM' ? '#F59E0B' : '#10B981';
const typeColor: Record<string, string> = {
    Weather: '#3B82F6', News: '#EF4444', Capacity: '#F97316', Route: '#8B5CF6', Economic: '#F59E0B',
};

const cityRisk = [
    { city: 'Mumbai',    risk: 'HIGH'   as RiskLevel, events: 3, score: 82 },
    { city: 'Chennai',   risk: 'HIGH'   as RiskLevel, events: 2, score: 76 },
    { city: 'Delhi',     risk: 'MEDIUM' as RiskLevel, events: 1, score: 58 },
    { city: 'Hyderabad', risk: 'MEDIUM' as RiskLevel, events: 1, score: 44 },
    { city: 'Bangalore', risk: 'LOW'    as RiskLevel, events: 0, score: 22 },
    { city: 'Kolkata',   risk: 'LOW'    as RiskLevel, events: 0, score: 18 },
    { city: 'Ahmedabad', risk: 'LOW'    as RiskLevel, events: 0, score: 15 },
    { city: 'Goa',       risk: 'LOW'    as RiskLevel, events: 0, score: 12 },
];

const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0',
    borderRadius: 20, padding: 20, transition: 'all 0.25s ease',
};

interface WeatherData { city: string; temp: number; desc: string; icon: string; humidity: number; wind: number; }
interface NewsItem    { title: string; source: string; url: string; publishedAt: string; }
interface RiskEvent   { id: number; icon: string; title: string; type: string; severity: RiskLevel; impact: string; time: string; }

export default function RiskPage() {
    const [latest,         setLatest]         = useState<SupabaseAnalysis | null>(null);
    const [weather,        setWeather]        = useState<WeatherData[]>([]);
    const [news,           setNews]           = useState<NewsItem[]>([]);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [newsLoading,    setNewsLoading]    = useState(true);
    const [dynamicEvents,  setDynamicEvents]  = useState<RiskEvent[]>(staticRiskEvents);

    const mitigation = [
        { risk: 'HIGH Weather',   action: 'Reroute via rail/air. Increase buffer stock by 20%. Alert warehouse teams.',  icon: <Shield size={17} />,    color: '#EF4444' },
        { risk: 'Supplier Risk',  action: 'Switch to backup supplier. Request capacity hold for next 72 hours.',          icon: <RefreshCw size={17} />, color: '#F97316' },
        { risk: 'Route Delay',    action: 'Use alternate NH route. Add 4–6 hr buffer in ETA. Notify delivery partners.',  icon: <MapPin size={17} />,    color: '#3B82F6' },
        { risk: 'Economic Shock', action: 'Pre-book shipments at current rates. Negotiate long-term fixed contracts.',     icon: <Lightbulb size={17} />, color: '#F59E0B' },
    ];

    // ── Fetch latest analysis ─────────────────────────────────────────────────
    useEffect(() => {
        getLatestAnalysis().then(data => {
            setLatest(prev => prev?.id === data?.id ? prev : data);
        });
    }, []);

    // ── Live weather — uses parsed origin/destination ─────────────────────────
    useEffect(() => {
        if (!latest || !WEATHER_KEY) { setWeatherLoading(false); return; }
        const { origin, destination } = getOriginDest(latest.result);
        if (!origin || !destination) { setWeatherLoading(false); return; }

        Promise.all(
            [origin, destination].map(city =>
                fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${WEATHER_KEY}&units=metric`)
                    .then(r => r.json())
                    .then(d => ({
                        city,
                        temp:     Math.round(d.main?.temp ?? 0),
                        desc:     d.weather?.[0]?.description ?? '',
                        icon:     d.weather?.[0]?.icon ?? '',
                        humidity: d.main?.humidity ?? 0,
                        wind:     Math.round(d.wind?.speed ?? 0),
                    }))
                    .catch(() => null)
            )
        ).then(results => {
            const valid = results.filter(Boolean) as WeatherData[];
            setWeather(valid);
            const weatherEvents: RiskEvent[] = valid.map((w, i) => {
                const isHigh = w.desc.toLowerCase().includes('rain')
                    || w.desc.toLowerCase().includes('storm')
                    || w.desc.toLowerCase().includes('thunder');
                const severity: RiskLevel = isHigh ? 'HIGH' : w.wind > 30 ? 'MEDIUM' : 'LOW';
                return {
                    id:       100 + i,
                    icon:     isHigh ? '🌧️' : w.wind > 30 ? '💨' : '🌤️',
                    title:    `${w.desc.charAt(0).toUpperCase() + w.desc.slice(1)} — ${w.city}`,
                    type:     'Weather',
                    severity,
                    impact:   `Temperature: ${w.temp}°C · Humidity: ${w.humidity}% · Wind: ${w.wind} m/s`,
                    time:     'Live',
                };
            });
            setDynamicEvents([...weatherEvents, ...staticRiskEvents]);
            setWeatherLoading(false);
        });
    }, [latest?.id]);

    // ── Live news ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!NEWS_KEY) { setNewsLoading(false); return; }
        const product = (latest?.result as any)?.product ?? 'supply chain';
        fetch(`https://newsapi.org/v2/everything?q=${product}+supply+chain+India&sortBy=publishedAt&pageSize=4&apiKey=${NEWS_KEY}`)
            .then(r => r.json())
            .then(d => { if (d.articles) setNews(d.articles.slice(0, 4)); setNewsLoading(false); })
            .catch(() => setNewsLoading(false));
    }, [latest?.id]);

    // ── Derive display values ─────────────────────────────────────────────────
    const { origin, destination } = latest ? getOriginDest(latest.result) : { origin: '', destination: '' };
    const overallRisk = latest?.result.overall_risk ?? '';

    const high   = dynamicEvents.filter(e => e.severity === 'HIGH').length;
    const medium = dynamicEvents.filter(e => e.severity === 'MEDIUM').length;
    const low    = dynamicEvents.filter(e => e.severity === 'LOW').length;

    // ── Also show risk factors from latest analysis ───────────────────────────
    const riskFactors: string[] = (latest?.result as any)?.risk_factors ?? [];

    return (
        <div className="animate-fade-in-up" style={{ width: '100%' }}>

            {/* ══ HEADER ══ */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="animate-glow-pulse" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: 'rgba(239,68,68,0.08)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>Risk Center</h1>
                        <p style={{ fontSize: 14, color: '#94A3B8' }}>
                            {latest && origin && destination
                                ? `Live risk for ${origin} → ${destination} · ${overallRisk} Risk`
                                : 'Live weather, news, and operational risk signals affecting your supply chain'}
                        </p>
                    </div>
                </div>
                <Link to="/analyze">
                    <button className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.28)' }}>
                        <Search size={14} /> Analyze Risk Now
                    </button>
                </Link>
            </div>

            {/* ══ AI RISK FACTORS BANNER ══ */}
            {riskFactors.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>
                            🤖 AI Risk Factors — {origin} → {destination}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {riskFactors.map((rf, i) => (
                                <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 7, fontWeight: 600, background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                                    {rf}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ STAT CARDS ══ */}
            <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { val: String(high),                label: 'Critical Risks',  color: '#EF4444', icon: <AlertTriangle size={16} /> },
                    { val: String(medium),               label: 'Medium Risks',    color: '#F59E0B', icon: <TrendingUp size={16} />    },
                    { val: String(low),                  label: 'Low Risk',        color: '#10B981', icon: <CheckCircle size={16} />   },
                    { val: String(dynamicEvents.length), label: 'Total Events',    color: '#F97316', icon: <Zap size={16} />           },
                    {
                        val:   latest ? overallRisk : '—',
                        label: 'Latest AI Risk',
                        color: latest ? riskHex(overallRisk as RiskLevel) : '#94A3B8',
                        icon:  <MapPin size={16} />,
                    },
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

            {/* ══ LIVE WEATHER ══ */}
            {!weatherLoading && weather.length > 0 && (
                <div style={{ ...card, marginBottom: 24 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: 16 }}>🌤️</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Live Weather — Route Cities</span>
                        <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, marginLeft: 'auto' }}>Live</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        {weather.map(w => {
                            const isRisky = w.desc.toLowerCase().includes('rain') || w.desc.toLowerCase().includes('storm') || w.desc.toLowerCase().includes('thunder');
                            return (
                                <div key={w.city} style={{ background: isRisky ? 'rgba(239,68,68,0.04)' : '#F8FAFC', border: `1px solid ${isRisky ? 'rgba(239,68,68,0.2)' : '#E2E8F0'}`, borderRadius: 14, padding: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{w.city}</span>
                                        <img src={`https://openweathermap.org/img/wn/${w.icon}.png`} alt={w.desc} style={{ width: 36, height: 36 }} />
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 900, color: isRisky ? '#EF4444' : '#F97316', marginBottom: 4 }}>{w.temp}°C</p>
                                    <p style={{ fontSize: 12, color: '#64748B', textTransform: 'capitalize', marginBottom: 8 }}>{w.desc}</p>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <span style={{ fontSize: 11, color: '#94A3B8' }}>💧 {w.humidity}%</span>
                                        <span style={{ fontSize: 11, color: '#94A3B8' }}>💨 {w.wind} m/s</span>
                                    </div>
                                    {isRisky && <p style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginTop: 8 }}>⚠️ Weather risk detected</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ══ EVENTS + MITIGATION ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
                {/* Live Risk Events */}
                <div style={card}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Live Risk Events</span>
                        <span style={{ fontSize: 11, color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '2px 10px', marginLeft: 'auto', fontWeight: 600 }}>
                            {dynamicEvents.length} Active
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {dynamicEvents.map((ev, idx) => (
                            <div key={ev.id} className="animate-slide-in-left"
                                style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 14px 14px 0', border: '1px solid #E2E8F0', borderLeft: `4px solid ${borderHex(ev.severity)}`, transition: 'all 0.2s ease', animationDelay: `${idx * 55}ms`, cursor: 'default', display: 'flex', gap: 12 }}
                                onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#fff'; d.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)'; d.style.transform = 'translateX(2px)'; }}
                                onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#F8FAFC'; d.style.boxShadow = 'none'; d.style.transform = 'translateX(0)'; }}
                            >
                                <span style={{ fontSize: 20, marginLeft: 14, marginTop: 2, flexShrink: 0 }}>{ev.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{ev.title}</span>
                                        <StatusBadge status={ev.severity} variant={sevVariant[ev.severity]} />
                                    </div>
                                    <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.65, marginBottom: 6 }}>{ev.impact}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: `${typeColor[ev.type] ?? '#94A3B8'}14`, color: typeColor[ev.type] ?? '#94A3B8' }}>{ev.type}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8' }}><Clock size={10} /> {ev.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* AI Mitigation */}
                    <div style={card}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <Shield size={15} color="#3B82F6" />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>AI Mitigation Actions</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {mitigation.map((m, i) => (
                                <div key={i}
                                    style={{ display: 'flex', gap: 12, padding: '13px 14px', background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', transition: 'all 0.2s ease' }}
                                    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#fff'; d.style.borderColor = `${m.color}25`; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                                    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#F8FAFC'; d.style.borderColor = '#E2E8F0'; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${m.color}12`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.icon}</div>
                                    <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{m.risk}</p>
                                        <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65 }}>{m.action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risk Distribution */}
                    <div style={card}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                            <TrendingUp size={15} color="#F97316" />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Risk Distribution</span>
                        </div>
                        {(['HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map((level, i) => {
                            const counts: Record<RiskLevel, number> = { HIGH: high, MEDIUM: medium, LOW: low };
                            const total = dynamicEvents.length;
                            const pct   = total > 0 ? Math.round((counts[level] / total) * 100) : 0;
                            return (
                                <div key={level} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: riskHex(level) }}>{level}</span>
                                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{counts[level]} event{counts[level] !== 1 ? 's' : ''} · {pct}%</span>
                                    </div>
                                    <div style={{ height: 10, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: riskHex(level), borderRadius: 99, transition: 'width 0.9s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ══ LIVE NEWS ══ */}
            {!newsLoading && news.length > 0 && (
                <div style={{ ...card, marginBottom: 24 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: 16 }}>📰</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Live Supply Chain News</span>
                        <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, marginLeft: 'auto' }}>Live</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {news.map((n, i) => (
                            <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                                style={{ textDecoration: 'none', display: 'flex', gap: 12, padding: '13px 14px', background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', borderLeft: '4px solid #EF4444', transition: 'all 0.2s ease' }}
                                onMouseEnter={e => { const d = e.currentTarget as HTMLAnchorElement; d.style.background = '#fff'; d.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)'; d.style.transform = 'translateX(2px)'; }}
                                onMouseLeave={e => { const d = e.currentTarget as HTMLAnchorElement; d.style.background = '#F8FAFC'; d.style.boxShadow = 'none'; d.style.transform = 'translateX(0)'; }}
                            >
                                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>📰</span>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 4, lineHeight: 1.5 }}>{n.title}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>News</span>
                                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{typeof n.source === 'string' ? n.source : (n.source as any)?.name ?? ''}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8' }}><Clock size={10} /> {new Date(n.publishedAt).toLocaleDateString('en-IN')}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* ══ CITY RISK MAP ══ */}
            <div style={{ ...card, marginBottom: 24 }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <MapPin size={15} color="#F97316" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>City-wise Risk Score</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {cityRisk.map((c) => (
                        <div key={c.city}
                            style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 16px', border: '1px solid #E2E8F0', transition: 'all 0.2s ease' }}
                            onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#fff'; d.style.borderColor = `${riskHex(c.risk)}25`; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                            onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#F8FAFC'; d.style.borderColor = '#E2E8F0'; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{c.city}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${riskHex(c.risk)}15`, color: riskHex(c.risk) }}>{c.risk}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>{c.events} event{c.events !== 1 ? 's' : ''}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: riskHex(c.risk) }}>{c.score}/100</span>
                            </div>
                            <div style={{ height: 5, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${c.score}%`, background: riskHex(c.risk), borderRadius: 99, transition: 'width 0.9s ease' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ TIPS BANNER ══ */}
            <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.04), rgba(249,115,22,0.04))', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 20, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} />
                </div>
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>AI Risk Prevention Checklist</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '6px 28px' }}>
                        {[
                            'Live weather auto-loads for your latest AI analysis route',
                            'Chennai sea freight blocked — use NH road alternate',
                            'Always maintain 20% buffer stock for HIGH risk cities',
                            'Pharma shipments: verify cold-chain during heatwave',
                            'Fuel hike active — pre-book rates before next week',
                            'Run AI Analysis to get route risk score in real-time',
                        ].map(tip => (
                            <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ color: '#EF4444', flexShrink: 0, fontSize: 13, marginTop: 2 }}>•</span>
                                <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65 }}>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
