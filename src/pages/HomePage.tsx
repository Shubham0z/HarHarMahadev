import { Link } from 'react-router-dom';
import {
    BarChart3, MapPin, Factory, AlertTriangle, IndianRupee, Crown,
    ArrowRight, Zap, ChevronRight, Sparkles, Target, Clock, Search
} from 'lucide-react';

const features = [
    { icon: <BarChart3 size={22} />, title: 'Demand Forecasting', desc: 'Predict demand spikes using 25,000+ data points across 8 product categories and 8 Indian cities.', bg: 'rgba(249,115,22,0.06)', color: '#F97316' },
    { icon: <MapPin size={22} />, title: 'Route Optimization', desc: 'Real-time route analysis via OpenRoute API — road, rail, air mode recommendations with cost.', bg: 'rgba(59,130,246,0.06)', color: '#3B82F6' },
    { icon: <Factory size={22} />, title: 'Supplier Intelligence', desc: 'Auto-select best supplier based on quality score, capacity, city proximity and risk level.', bg: 'rgba(249,115,22,0.06)', color: '#F97316' },
    { icon: <AlertTriangle size={22} />, title: 'Risk Monitoring', desc: 'Live weather + news alerts integrated. Risk scored LOW / MEDIUM / HIGH with mitigation steps.', bg: 'rgba(239,68,68,0.06)', color: '#EF4444' },
    { icon: <IndianRupee size={22} />, title: 'Cost Breakdown', desc: 'Transport, GST, handling, risk premium — full ₹ cost estimate per shipment calculated live.', bg: 'rgba(245,158,11,0.08)', color: '#F59E0B' },
    { icon: <Crown size={22} />, title: 'AI Orchestrator', desc: 'Boss agent combines all 5 agents. Final decision: SHIP NOW / DELAY / CANCEL with confidence %.', bg: 'rgba(59,130,246,0.06)', color: '#3B82F6' },
];

const industries = [
    { icon: '💊', name: 'Pharma' },
    { icon: '📱', name: 'Electronics' },
    { icon: '🚗', name: 'Automotive' },
    { icon: '🛒', name: 'FMCG / Kirana' },
    { icon: '👗', name: 'Textile / Cloth' },
    { icon: '🛋️', name: 'Furniture' },
    { icon: '🏠', name: 'Appliances' },
    { icon: '⚙️', name: 'Manufacturing' },
];

const steps = [
    { num: '01', title: 'Input Shipment Details', desc: 'Select product, origin city, destination, and describe your scenario.', icon: <Target size={20} /> },
    { num: '02', title: '6 AI Agents Activate', desc: 'Demand, Route, Supplier, Risk, Cost agents run in sequence automatically.', icon: <Zap size={20} /> },
    { num: '03', title: 'Real Data Fetched', desc: 'Live weather, news, route APIs called. 25,000+ rows of sales data analyzed.', icon: <Sparkles size={20} /> },
    { num: '04', title: 'Final Decision Delivered', desc: 'Orchestrator gives SHIP NOW / DELAY / CANCEL with full breakdown in seconds.', icon: <Clock size={20} /> },
];

const stats = [
    ['25,000+', 'Data Points'],
    ['6', 'AI Agents'],
    ['8', 'Product Types'],
    ['8', 'Cities'],
    ['< 60s', 'Analysis Time'],
];

export default function HomePage() {
    return (
        <div style={{ width: '100%' }}>

            {/* ══ HERO ══ */}
            <section
                className="animate-fade-in-up"
                style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 60 }}
            >
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(249,115,22,0.06)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    borderRadius: 99, padding: '8px 20px',
                    fontSize: 13, color: '#F97316', fontWeight: 600,
                    marginBottom: 28, cursor: 'default',
                }}>
                    <Zap size={14} className="animate-float" />
                    Powered by 6 Specialized AI Agents on n8n Cloud
                </div>

                <h1 style={{
                    fontSize: 'clamp(32px, 4.5vw, 56px)',
                    fontWeight: 900, lineHeight: 1.1,
                    letterSpacing: '-1px', color: '#0F172A', marginBottom: 20,
                }}>
                    Predict. Prevent.
                    <br />
                    <span className="gradient-text-animated">
                        Supply Chain Disruptions.
                    </span>
                </h1>

                <p style={{
                    fontSize: 17, color: '#475569', lineHeight: 1.75,
                    maxWidth: 560, margin: '0 auto 36px', fontWeight: 400,
                }}>
                    Real-time AI intelligence for Indian enterprises — from demand forecasting
                    to last-mile delivery decisions. Built for Pharma, FMCG, Electronics, Automotive & more.
                </p>

                <div style={{
                    display: 'flex', gap: 14, justifyContent: 'center',
                    flexWrap: 'wrap', marginBottom: 56,
                }}>
                    <Link to="/analyze">
                        <button className="btn-glow" style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '14px 30px',
                            background: 'linear-gradient(135deg, #F97316, #EA580C)',
                            color: '#fff', border: 'none', borderRadius: 14,
                            fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(249,115,22,0.32)',
                        }}>
                            <Search size={16} />
                            Run Analysis Free
                        </button>
                    </Link>

                    <Link to="/dashboard">
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '14px 30px',
                            background: '#fff', color: '#0F172A',
                            border: '1px solid #E2E8F0', borderRadius: 14,
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease',
                        }}
                            onMouseEnter={e => {
                                const b = e.currentTarget as HTMLButtonElement;
                                b.style.borderColor = '#F97316'; b.style.color = '#F97316';
                                b.style.background = 'rgba(249,115,22,0.04)'; b.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                                const b = e.currentTarget as HTMLButtonElement;
                                b.style.borderColor = '#E2E8F0'; b.style.color = '#0F172A';
                                b.style.background = '#fff'; b.style.transform = 'translateY(0)';
                            }}
                        >
                            <BarChart3 size={16} />
                            View Dashboard
                            <ArrowRight size={14} />
                        </button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="stagger-children" style={{
                    display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap',
                }}>
                    {stats.map(([val, label]) => (
                        <div key={label} className="animate-fade-in-up" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        }}>
                            <span style={{ fontSize: 30, fontWeight: 900, color: '#F97316', lineHeight: 1, letterSpacing: '-0.5px' }}>
                                {val}
                            </span>
                            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ HOW IT WORKS ══ */}
            <section style={{ marginBottom: 72 }}>
                <div className="animate-fade-in-up" style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                        How It Works
                    </h2>
                    <p style={{ fontSize: 14, color: '#64748B' }}>
                        From input to decision in under 60 seconds
                    </p>
                </div>

                <div className="stagger-children" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: 16,
                }}>
                    {steps.map((step, idx) => (
                        <div key={step.num} className="animate-fade-in-up"
                            style={{
                                background: '#fff', border: '1px solid #E2E8F0',
                                borderRadius: 20, padding: 24,
                                position: 'relative', overflow: 'hidden',
                                animationDelay: `${idx * 90}ms`, cursor: 'default',
                                transition: 'all 0.25s ease',
                            }}
                            onMouseEnter={e => {
                                const d = e.currentTarget as HTMLDivElement;
                                d.style.borderColor = 'rgba(249,115,22,0.3)';
                                d.style.transform = 'translateY(-4px)';
                                d.style.boxShadow = '0 16px 32px rgba(0,0,0,0.07)';
                                const num = d.querySelector('.step-num') as HTMLElement;
                                if (num) num.style.color = 'rgba(249,115,22,0.12)';
                                const ico = d.querySelector('.step-icon') as HTMLElement;
                                if (ico) {
                                    ico.style.background = '#F97316';
                                    ico.style.color = '#fff';
                                    ico.style.transform = 'scale(1.1) rotate(6deg)';
                                }
                            }}
                            onMouseLeave={e => {
                                const d = e.currentTarget as HTMLDivElement;
                                d.style.borderColor = '#E2E8F0';
                                d.style.transform = 'translateY(0)';
                                d.style.boxShadow = 'none';
                                const num = d.querySelector('.step-num') as HTMLElement;
                                if (num) num.style.color = '#F1F5F9';
                                const ico = d.querySelector('.step-icon') as HTMLElement;
                                if (ico) {
                                    ico.style.background = 'rgba(249,115,22,0.06)';
                                    ico.style.color = '#F97316';
                                    ico.style.transform = 'scale(1) rotate(0deg)';
                                }
                            }}
                        >
                            <span className="step-num" style={{
                                position: 'absolute', top: -2, right: 6,
                                fontSize: 54, fontWeight: 900, color: '#F1F5F9',
                                lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
                                transition: 'color 0.3s ease',
                            }}>
                                {step.num}
                            </span>
                            <div className="step-icon" style={{
                                width: 44, height: 44, borderRadius: 13,
                                background: 'rgba(249,115,22,0.06)', color: '#F97316',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 18, transition: 'all 0.3s ease',
                                position: 'relative', zIndex: 1,
                            }}>
                                {step.icon}
                            </div>
                            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8, position: 'relative', zIndex: 1 }}>
                                {step.title}
                            </h3>
                            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65, position: 'relative', zIndex: 1 }}>
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ AI CAPABILITIES ══ */}
            <section style={{ marginBottom: 72 }}>
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                        AI Agent Capabilities
                    </h2>
                    <p style={{ fontSize: 14, color: '#64748B' }}>
                        Each agent is specialized for one domain — together they form a complete supply chain brain
                    </p>
                </div>

                <div className="stagger-children" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 16,
                }}>
                    {features.map((f, idx) => (
                        <div key={f.title} className="animate-fade-in-up"
                            style={{
                                background: '#fff', border: '1px solid #E2E8F0',
                                borderRadius: 20, padding: 24,
                                animationDelay: `${idx * 70}ms`, cursor: 'default',
                                transition: 'all 0.25s ease',
                            }}
                            onMouseEnter={e => {
                                const d = e.currentTarget as HTMLDivElement;
                                d.style.borderColor = 'rgba(249,115,22,0.25)';
                                d.style.transform = 'translateY(-4px)';
                                d.style.boxShadow = '0 16px 32px rgba(0,0,0,0.07)';
                                const ico = d.querySelector('.feat-icon') as HTMLElement;
                                if (ico) ico.style.transform = 'scale(1.12) rotate(5deg)';
                            }}
                            onMouseLeave={e => {
                                const d = e.currentTarget as HTMLDivElement;
                                d.style.borderColor = '#E2E8F0';
                                d.style.transform = 'translateY(0)';
                                d.style.boxShadow = 'none';
                                const ico = d.querySelector('.feat-icon') as HTMLElement;
                                if (ico) ico.style.transform = 'scale(1) rotate(0deg)';
                            }}
                        >
                            <div className="feat-icon" style={{
                                width: 48, height: 48, borderRadius: 14,
                                background: f.bg, color: f.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 16, transition: 'transform 0.3s ease',
                            }}>
                                {f.icon}
                            </div>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                                {f.title}
                            </h3>
                            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65 }}>
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ INDUSTRIES ══ */}
            <section style={{ marginBottom: 72 }}>
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                        Industries We Serve
                    </h2>
                    <p style={{ fontSize: 14, color: '#64748B' }}>
                        Built for large enterprises across India's key sectors
                    </p>
                </div>
                <div className="stagger-children" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {industries.map((ind, idx) => (
                        <div key={ind.name} className="animate-fade-in-up"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                background: '#fff', border: '1px solid #E2E8F0',
                                borderRadius: 14, padding: '11px 20px',
                                fontSize: 14, fontWeight: 500, color: '#0F172A',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                                animationDelay: `${idx * 50}ms`,
                            }}
                            onMouseEnter={e => {
                                const d = e.currentTarget as HTMLDivElement;
                                d.style.borderColor = 'rgba(249,115,22,0.35)';
                                d.style.background = 'rgba(249,115,22,0.04)';
                                d.style.color = '#F97316';
                                d.style.transform = 'translateY(-3px)';
                                d.style.boxShadow = '0 6px 16px rgba(249,115,22,0.1)';
                            }}
                            onMouseLeave={e => {
                                const d = e.currentTarget as HTMLDivElement;
                                d.style.borderColor = '#E2E8F0';
                                d.style.background = '#fff';
                                d.style.color = '#0F172A';
                                d.style.transform = 'translateY(0)';
                                d.style.boxShadow = 'none';
                            }}
                        >
                            <span style={{ fontSize: 20, lineHeight: 1 }}>{ind.icon}</span>
                            {ind.name}
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ CTA ══ */}
            <section style={{ marginBottom: 40 }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.05) 0%, #ffffff 50%, rgba(59,130,246,0.05) 100%)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    borderRadius: 28,
                    padding: 'clamp(36px, 5vw, 64px) clamp(24px, 4vw, 56px)',
                    textAlign: 'center',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
                        width: 320, height: 200,
                        background: 'radial-gradient(ellipse, rgba(249,115,22,0.13) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: -30, right: -30, width: 200, height: 200,
                        background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <h2 style={{
                        fontSize: 'clamp(20px, 3vw, 30px)',
                        fontWeight: 800, color: '#0F172A',
                        marginBottom: 14, position: 'relative',
                    }}>
                        Ready to eliminate supply chain blind spots?
                    </h2>

                    <p style={{
                        fontSize: 16, color: '#475569',
                        maxWidth: 480, margin: '0 auto 36px',
                        lineHeight: 1.7, position: 'relative',
                    }}>
                        Get AI-powered shipment decisions in under 60 seconds — free, no signup needed.
                    </p>

                    <Link to="/analyze" style={{ position: 'relative', display: 'inline-block' }}>
                        <button className="btn-glow" style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '15px 38px', margin: '0 auto',
                            background: 'linear-gradient(135deg, #F97316, #EA580C)',
                            color: '#fff', border: 'none', borderRadius: 14,
                            fontSize: 15, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
                        }}>
                            <Sparkles size={16} className="animate-float" />
                            Start Your First Analysis
                            <ChevronRight size={16} />
                        </button>
                    </Link>
                </div>
            </section>

        </div>
    );
}
