// src/pages/HomePage.tsx
import { Link } from 'react-router-dom';
import {
  Zap, BarChart3, Search, MapPin, Factory, AlertTriangle,
  IndianRupee, Crown, ArrowRight, TrendingUp, Shield,
  Clock, Package, CheckCircle, Sparkles, Activity,
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    color: '#F97316',
    bg: 'rgba(249,115,22,.1)',
    title: 'Demand Forecasting',
    badge: 'Agent 1',
    desc: 'Predicts product demand across all 8 Indian cities using 36-month historical patterns — 96.4% accuracy.',
  },
  {
    icon: MapPin,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,.1)',
    title: 'Route Optimization',
    badge: 'Agent 2',
    desc: 'Compares Road, Rail & Air routes by cost, time, and reliability. Returns the single best path.',
  },
  {
    icon: Factory,
    color: '#10B981',
    bg: 'rgba(16,185,129,.1)',
    title: 'Supplier Discovery',
    badge: 'Agent 3',
    desc: 'Matches your product + city to the best-rated supplier from 47 verified partners in real time.',
  },
  {
    icon: AlertTriangle,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,.1)',
    title: 'Risk Monitoring',
    badge: 'Agent 4',
    desc: 'Scans weather, port delays, driver strikes, and road blocks — assigns LOW / MEDIUM / HIGH risk.',
  },
  {
    icon: IndianRupee,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,.1)',
    title: 'Cost Breakdown',
    badge: 'Agent 5',
    desc: 'Calculates freight + GST + handling + insurance + fuel surcharge with per-km precision.',
  },
  {
    icon: Crown,
    color: '#EF4444',
    bg: 'rgba(239,68,68,.1)',
    title: 'AI Orchestrator',
    badge: 'Agent 6',
    desc: 'Synthesises all 5 agents into one final decision — SHIP NOW, DELAY, or CANCEL — with confidence %.',
  },
];

const stats = [
  { value: '96.4%', label: 'Forecast Accuracy',   icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,.08)'  },
  { value: '< 60s', label: 'Full Analysis Time',   icon: Clock,       color: '#3B82F6', bg: 'rgba(59,130,246,.08)'  },
  { value: '₹2.4L', label: 'Avg Cost Saved/Trip',  icon: IndianRupee, color: '#F97316', bg: 'rgba(249,115,22,.08)'  },
  { value: '47+',   label: 'Verified Suppliers',   icon: Factory,     color: '#8B5CF6', bg: 'rgba(139,92,246,.08)' },
];

const recentDecisions = [
  { product: 'Pharma',      route: 'Mumbai → Delhi',      mode: 'Rail',  decision: 'SHIP NOW', risk: 'LOW',    cost: '₹1.2L', time: '18 hrs', confidence: 94 },
  { product: 'Electronics', route: 'Bangalore → Chennai',  mode: 'Road',  decision: 'DELAY',    risk: 'MEDIUM', cost: '₹3.4L', time: '24 hrs', confidence: 78 },
  { product: 'FMCG',        route: 'Delhi → Jaipur',       mode: 'Road',  decision: 'SHIP NOW', risk: 'LOW',    cost: '₹0.8L', time: '10 hrs', confidence: 91 },
  { product: 'Automotive',  route: 'Pune → Hyderabad',     mode: 'Rail',  decision: 'SHIP NOW', risk: 'LOW',    cost: '₹2.1L', time: '22 hrs', confidence: 88 },
];

const decisionStyle = (d: string) => ({
  'SHIP NOW': { color: '#10B981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.3)' },
  'DELAY':    { color: '#F59E0B', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.3)' },
  'CANCEL':   { color: '#EF4444', bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.3)'  },
}[d] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,.1)', border: 'rgba(148,163,184,.25)' });

const riskColor = (r: string) => r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';
const riskBg    = (r: string) => r === 'LOW' ? 'rgba(16,185,129,.08)' : r === 'MEDIUM' ? 'rgba(245,158,11,.08)' : 'rgba(239,68,68,.08)';

const modeIcon = (m: string) => m === 'Air' ? '✈' : m === 'Rail' ? '🚂' : '🚛';

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="anim-up card" style={{
        marginBottom: 28,
        padding: '52px 44px',
        background: 'linear-gradient(135deg, #fff 0%, #FFF7ED 50%, #EFF6FF 100%)',
        border: '1px solid var(--border)',
        borderRadius: 28,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(249,115,22,.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: 60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,130,246,.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 40, right: 200, width: 120, height: 120, borderRadius: '50%', background: 'rgba(139,92,246,.04)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          {/* Status Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 16px', borderRadius: 99,
              background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.2)',
              fontSize: 12, fontWeight: 700, color: 'var(--primary)',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              6 AI Agents Active
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 16px', borderRadius: 99,
              background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)',
              fontSize: 12, fontWeight: 600, color: '#10B981',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Real-time Analysis
            </div>
            <div style={{
              padding: '6px 16px', borderRadius: 99,
              background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)',
              fontSize: 12, fontWeight: 600, color: '#3B82F6',
            }}>
              India — 8 Cities Covered
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.08, marginBottom: 18, color: 'var(--text)' }}>
            AI-Powered<br />
            <span className="grad-text">Supply Chain</span><br />
            Intelligence
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.75, maxWidth: 540, marginBottom: 32 }}>
            6 specialized AI agents analyze demand, routes, suppliers, risk, and costs —
            then deliver a confident <strong>SHIP NOW</strong>, <strong>DELAY</strong>, or <strong>CANCEL</strong> decision in under 60 seconds.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/analyze">
              <button className="btn-primary" style={{ fontSize: 14, padding: '14px 30px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} fill="currentColor" />
                Run AI Analysis
                <ArrowRight size={14} />
              </button>
            </Link>
            <Link to="/dashboard">
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 26px', borderRadius: 12,
                border: '1.5px solid var(--border)',
                background: 'rgba(255,255,255,0.8)',
                fontSize: 14, fontWeight: 600, color: 'var(--text-2)',
                transition: 'all .2s', cursor: 'pointer',
              }}
                onMouseEnter={e => { const d = e.currentTarget; d.style.borderColor = 'var(--primary)'; d.style.color = 'var(--primary)'; d.style.background = 'rgba(249,115,22,.04)'; }}
                onMouseLeave={e => { const d = e.currentTarget; d.style.borderColor = 'var(--border)'; d.style.color = 'var(--text-2)'; d.style.background = 'rgba(255,255,255,0.8)'; }}
              >
                <BarChart3 size={16} /> View Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PLATFORM STATS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>
          Platform Metrics
        </p>
      </div>
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 32 }}>
        {stats.map(({ value, label, icon: Icon, color, bg }) => (
          <div key={label} className="anim-up card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}
            onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-3px)'; d.style.boxShadow = '0 10px 28px rgba(0,0,0,.06)'; d.style.borderColor = color + '33'; }}
            onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; d.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 2, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HOW IT WORKS — 6 AI AGENTS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 6 }}>
              How It Works
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>6 AI Agents Run in Sequence</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Each agent specialises in one domain — results chain into the final orchestrated decision</p>
          </div>
          <Link to="/analyze">
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10,
              border: '1px solid rgba(249,115,22,.3)',
              background: 'rgba(249,115,22,.06)',
              fontSize: 12, fontWeight: 700, color: 'var(--primary)',
              cursor: 'pointer',
            }}>
              Try it now <ArrowRight size={12} />
            </button>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          {features.map(({ icon: Icon, color, bg, title, badge, desc }, i) => (
            <div key={title} className="anim-up card" style={{
              animationDelay: `${i * 55}ms`,
              padding: '20px 22px',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
              position: 'relative',
              overflow: 'hidden',
            }}
              onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-3px)'; d.style.boxShadow = `0 12px 32px ${color}18`; d.style.borderColor = color + '33'; }}
              onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; d.style.borderColor = 'var(--border)'; }}
            >
              {/* Step number watermark */}
              <span style={{
                position: 'absolute', right: 16, top: 12,
                fontSize: 48, fontWeight: 900, color: color,
                opacity: 0.05, lineHeight: 1, pointerEvents: 'none',
                userSelect: 'none',
              }}>{i + 1}</span>

              <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</p>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color,
                    background: `${color}14`, border: `1px solid ${color}30`,
                    padding: '2px 8px', borderRadius: 99,
                  }}>{badge}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SAMPLE AI DECISIONS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="anim-up card" style={{ marginBottom: 24 }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 5 }}>
              Sample Outputs
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={15} color="var(--primary)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Recent AI Decisions</span>
            </div>
          </div>
          <Link to="/analyze">
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 15px', borderRadius: 9,
              border: '1px solid rgba(249,115,22,.25)',
              background: 'rgba(249,115,22,.05)',
              fontSize: 12, fontWeight: 700, color: 'var(--primary)',
              cursor: 'pointer',
            }}>
              Run yours <ArrowRight size={12} />
            </button>
          </Link>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 90px 80px 100px',
          padding: '8px 14px',
          borderRadius: 8,
          background: 'var(--bg)',
          marginBottom: 4,
        }}>
          {['Shipment', 'Mode', 'Cost', 'Time', 'Decision'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {recentDecisions.map((r, i) => {
            const ds = decisionStyle(r.decision);
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 90px 80px 100px',
                alignItems: 'center',
                padding: '13px 14px',
                borderRadius: 10,
                transition: 'background .15s',
                cursor: 'default',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {/* Product + Route */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={14} color="var(--text-3)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.product}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.route}</p>
                  </div>
                </div>
                {/* Mode */}
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{modeIcon(r.mode)} {r.mode}</span>
                {/* Cost */}
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{r.cost}</span>
                {/* Time */}
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.time}</span>
                {/* Decision + Risk */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: ds.color,
                    background: ds.bg, border: `1px solid ${ds.border}`,
                    padding: '3px 10px', borderRadius: 99,
                    whiteSpace: 'nowrap', display: 'inline-block',
                  }}>{r.decision}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: riskColor(r.risk), background: riskBg(r.risk), padding: '2px 8px', borderRadius: 99, display: 'inline-block' }}>
                    {r.risk} RISK
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CTA BANNER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="anim-up card" style={{
        padding: '36px 40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(249,115,22,.05), rgba(59,130,246,.05))',
        border: '1px solid rgba(249,115,22,.15)',
        borderRadius: 24,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          margin: '0 auto 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(249,115,22,.3)',
        }}>
          <Zap size={24} color="#fff" fill="#fff" />
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 10 }}>
          Start Now — Free
        </p>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
          Ready to Analyze Your Shipment?
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, maxWidth: 460, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Enter product, origin city, and destination — our 6 AI agents return a full cost breakdown and shipping decision in under 60 seconds.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/analyze">
            <button className="btn-primary" style={{ fontSize: 14, padding: '14px 34px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} /> Start AI Analysis <ArrowRight size={14} />
            </button>
          </Link>
          <Link to="/cost">
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 12,
              border: '1.5px solid var(--border)',
              background: '#fff',
              fontSize: 14, fontWeight: 600, color: 'var(--text-2)',
              transition: 'all .2s', cursor: 'pointer',
            }}
              onMouseEnter={e => { const d = e.currentTarget; d.style.borderColor = 'var(--primary)'; d.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { const d = e.currentTarget; d.style.borderColor = 'var(--border)'; d.style.color = 'var(--text-2)'; }}
            >
              <IndianRupee size={15} /> View Cost Estimates
            </button>
          </Link>
        </div>

        {/* Trust signals */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
          {[
            { icon: Shield, text: 'No login required' },
            { icon: Zap,    text: 'Results in < 60 sec' },
            { icon: CheckCircle, text: '96.4% AI accuracy' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon size={13} color="var(--text-3)" />
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity:1; transform:scale(1) }
          50% { opacity:.4; transform:scale(1.5) }
        }
      `}</style>
    </div>
  );
}
