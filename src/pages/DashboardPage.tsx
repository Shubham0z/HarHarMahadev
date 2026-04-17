// src/pages/DashboardPage.tsx
import { Link } from 'react-router-dom';
import {
  Truck, AlertTriangle, CheckCircle, IndianRupee, Factory, Bot,
  Search, Bell, MapPin, TrendingUp, Package, Clock, BarChart2,
  ArrowRight, Zap, Activity, ShieldCheck, Gauge,
} from 'lucide-react';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const kpis = [
  {
    icon: Truck,
    label: 'Active Shipments',
    sublabel: 'Across 8 cities',
    value: '142',
    trend: '+12%',
    trendUp: true,
    color: '#F97316',
    desc: 'vs last month',
  },
  {
    icon: AlertTriangle,
    label: 'Open Risk Alerts',
    sublabel: '1 Critical',
    value: '3',
    trend: '+3',
    trendUp: false,
    color: '#EF4444',
    desc: 'needs attention',
  },
  {
    icon: CheckCircle,
    label: 'On-Time Delivery',
    sublabel: 'Last 30 days',
    value: '94.2%',
    trend: '+1.4%',
    trendUp: true,
    color: '#10B981',
    desc: 'target: 92%',
  },
  {
    icon: IndianRupee,
    label: 'Avg Shipment Cost',
    sublabel: 'This month',
    value: '₹2.4L',
    trend: '-8%',
    trendUp: true,
    color: '#F59E0B',
    desc: 'vs prev month',
  },
  {
    icon: Factory,
    label: 'Active Suppliers',
    sublabel: 'Across 6 categories',
    value: '47',
    trend: '+3',
    trendUp: true,
    color: '#8B5CF6',
    desc: 'verified partners',
  },
  {
    icon: Bot,
    label: 'AI Analyses Run',
    sublabel: 'Total lifetime',
    value: '284',
    trend: '+284',
    trendUp: true,
    color: '#3B82F6',
    desc: 'all time',
  },
];

const alerts = [
  {
    type: 'CRITICAL',
    icon: '🌧️',
    title: 'Heavy Rain Alert — Mumbai Port',
    desc: 'Port ops may delay 12–24 hrs. Consider road diversion via NH-48.',
    source: 'Weather Agent',
    time: '5 min ago',
    action: 'View Route Alternative',
  },
  {
    type: 'WARNING',
    icon: '🚛',
    title: 'Truck Shortage — Delhi NCR',
    desc: 'Only 60% fleet available this week due to driver strike.',
    source: 'Route Agent',
    time: '22 min ago',
    action: 'Switch to Rail',
  },
  {
    type: 'INFO',
    icon: '📦',
    title: 'Supplier Restocked — Pharma (Pune)',
    desc: 'MedPharma Pune has restocked. Good time to dispatch bulk orders.',
    source: 'Supplier Agent',
    time: '1 hr ago',
    action: 'Place Order',
  },
];

const recentAnalyses = [
  { product: 'Pharma',      origin: 'Mumbai',    destination: 'Delhi',     decision: 'SHIP NOW', risk: 'LOW',    cost: 120000,  hrs: 18, confidence: 94 },
  { product: 'Electronics', origin: 'Bangalore', destination: 'Chennai',   decision: 'DELAY',    risk: 'MEDIUM', cost: 340000,  hrs: 24, confidence: 78 },
  { product: 'FMCG',        origin: 'Delhi',     destination: 'Jaipur',    decision: 'SHIP NOW', risk: 'LOW',    cost: 82000,   hrs: 10, confidence: 91 },
  { product: 'Automotive',  origin: 'Pune',      destination: 'Hyderabad', decision: 'SHIP NOW', risk: 'LOW',    cost: 215000,  hrs: 22, confidence: 88 },
  { product: 'Chemical',    origin: 'Surat',     destination: 'Mumbai',    decision: 'CANCEL',   risk: 'HIGH',   cost: 490000,  hrs: 36, confidence: 96 },
];

const cityPerf = [
  { city: 'Mumbai',    shipments: 34, onTime: 97, risk: 'LOW'    },
  { city: 'Delhi',     shipments: 28, onTime: 91, risk: 'MEDIUM' },
  { city: 'Bangalore', shipments: 22, onTime: 95, risk: 'LOW'    },
  { city: 'Chennai',   shipments: 19, onTime: 78, risk: 'HIGH'   },
  { city: 'Hyderabad', shipments: 17, onTime: 93, risk: 'LOW'    },
  { city: 'Kolkata',   shipments: 14, onTime: 88, risk: 'MEDIUM' },
  { city: 'Gujarat',   shipments: 12, onTime: 96, risk: 'LOW'    },
  { city: 'Goa',       shipments:  8, onTime: 82, risk: 'MEDIUM' },
];

const topProducts = [
  { name: 'Pharma',      shipments: 58, revenue: '₹35.6L', trend: '+18%', color: '#F97316' },
  { name: 'Electronics', shipments: 42, revenue: '₹75.6L', trend: '+6%',  color: '#3B82F6' },
  { name: 'FMCG',        shipments: 37, revenue: '₹16.7L', trend: '+22%', color: '#10B981' },
  { name: 'Automotive',  shipments: 28, revenue: '₹26.6L', trend: '+4%',  color: '#F59E0B' },
  { name: 'Kirana',      shipments: 19, revenue: '₹5.3L',  trend: '-3%',  color: '#EF4444' },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HELPERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const riskColor = (r: string) => r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';
const riskBg    = (r: string) => r === 'LOW' ? 'rgba(16,185,129,.08)' : r === 'MEDIUM' ? 'rgba(245,158,11,.08)' : 'rgba(239,68,68,.08)';

const decisionCfg = (d: string) => ({
  'SHIP NOW': { color: '#10B981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.3)'  },
  'DELAY':    { color: '#F59E0B', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.3)'  },
  'CANCEL':   { color: '#EF4444', bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.3)'   },
}[d] ?? { color: '#94A3B8', bg: 'transparent', border: 'transparent' });

const alertBg     = (t: string) => t === 'CRITICAL' ? 'rgba(239,68,68,.04)'   : t === 'WARNING' ? 'rgba(245,158,11,.04)'  : 'rgba(59,130,246,.04)';
const alertBorder = (t: string) => t === 'CRITICAL' ? 'rgba(239,68,68,.2)'    : t === 'WARNING' ? 'rgba(245,158,11,.2)'   : 'rgba(59,130,246,.2)';
const alertDot    = (t: string) => t === 'CRITICAL' ? '#EF4444' : t === 'WARNING' ? '#F59E0B' : '#3B82F6';
const alertAction = (t: string) => t === 'CRITICAL' ? 'rgba(239,68,68,.1)'    : t === 'WARNING' ? 'rgba(245,158,11,.1)'   : 'rgba(59,130,246,.1)';
const alertActionText = (t: string) => t === 'CRITICAL' ? '#EF4444' : t === 'WARNING' ? '#F59E0B' : '#3B82F6';

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>
    {children}
  </p>
);

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: 22,
  transition: 'box-shadow .25s ease',
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COMPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function DashboardPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PAGE HEADER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="anim-up" style={{
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, marginBottom: 30,
      }}>
        <div>
          <SectionLabel>Operations Overview</SectionLabel>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>
            Control Tower Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Real-time supply chain overview</p>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, color: '#10B981',
              background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)',
              padding: '3px 10px', borderRadius: 99,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'livePulse 1.8s infinite' }} />
              Live
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Last updated: just now</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/analyze">
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Search size={14} /> Run New Analysis
            </button>
          </Link>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          KPI CARDS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel>Key Performance Indicators</SectionLabel>
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 30 }}>
        {kpis.map((k, idx) => (
          <div key={k.label} className="anim-up" style={{ ...card, padding: '18px 20px', animationDelay: `${idx * 60}ms` }}
            onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = `0 10px 28px ${k.color}14`; d.style.borderColor = k.color + '30'; }}
            onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = 'none'; d.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${k.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={17} color={k.color} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: k.trendUp ? '#10B981' : '#EF4444',
                background: k.trendUp ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)',
                padding: '2px 8px', borderRadius: 99,
              }}>
                {k.trend}
              </span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 3, lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 2 }}>{k.label}</p>
            <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{k.sublabel} · {k.desc}</p>
          </div>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ALERTS + RECENT ANALYSES
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 26 }}>

        {/* Live Risk Alerts */}
        <div>
          <SectionLabel>Risk & Disruption Alerts</SectionLabel>
          <div className="anim-left" style={card}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.07)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={15} color="var(--primary)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Live Alerts</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#EF4444',
                background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
                borderRadius: 99, padding: '3px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'livePulse 1s infinite' }} />
                3 Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alerts.map((a, i) => (
                <div key={i} style={{
                  padding: '13px 14px', borderRadius: 14,
                  background: alertBg(a.type), border: `1px solid ${alertBorder(a.type)}`,
                  transition: 'transform .2s', cursor: 'default',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{a.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: alertDot(a.type), flexShrink: 0,
                          animation: a.type === 'CRITICAL' ? 'livePulse 1s infinite' : 'none',
                          display: 'inline-block',
                        }} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.title}
                        </p>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 8 }}>{a.desc}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-3)' }}>
                          <span>{a.time}</span>
                          <span>·</span>
                          <span style={{ fontWeight: 600, color: alertDot(a.type) }}>{a.source}</span>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: alertActionText(a.type),
                          background: alertAction(a.type),
                          padding: '3px 9px', borderRadius: 7,
                          whiteSpace: 'nowrap',
                        }}>
                          {a.action} →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent AI Analyses */}
        <div>
          <SectionLabel>AI Decision History</SectionLabel>
          <div className="anim-right" style={card}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.07)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={15} color="#3B82F6" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Recent Analyses</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#10B981',
                background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)',
                borderRadius: 99, padding: '3px 12px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }} />
                Live Feed
              </span>
            </div>

            {/* Column labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '6px 10px', borderRadius: 8, background: 'var(--bg)', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Shipment</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Decision</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentAnalyses.map((a, i) => {
                const dc = decisionCfg(a.decision);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 10px',
                    borderBottom: i < recentAnalyses.length - 1 ? '1px solid #F1F5F9' : 'none',
                    borderRadius: 10, transition: 'background .15s', cursor: 'default',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                        {a.product} · {a.origin} → {a.destination}
                      </p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>₹{a.cost.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.hrs} hrs</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>·</span>
                        <span style={{ fontSize: 11, color: riskColor(a.risk), fontWeight: 600 }}>{a.risk}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: dc.color,
                        background: dc.bg, border: `1px solid ${dc.border}`,
                        padding: '3px 10px', borderRadius: 99,
                      }}>
                        {a.decision}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                        {a.confidence}% confidence
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <Link to="/analyze">
                <button style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 0', borderRadius: 10,
                  border: '1px solid rgba(249,115,22,.2)',
                  background: 'rgba(249,115,22,.04)',
                  fontSize: 13, fontWeight: 700, color: 'var(--primary)',
                  cursor: 'pointer', transition: 'all .2s',
                }}>
                  <Zap size={13} /> Run New Analysis <ArrowRight size={12} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CITY PERFORMANCE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel>City-wise Delivery Performance</SectionLabel>
      <div className="anim-up" style={{ ...card, marginBottom: 26 }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.07)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={15} color="var(--primary)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>8 Cities — On-Time Rate</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {[['LOW', '#10B981'], ['MEDIUM', '#F59E0B'], ['HIGH', '#EF4444']].map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color as string, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {cityPerf.map(c => (
            <div key={c.city} style={{
              background: 'var(--bg)', borderRadius: 14, padding: '14px 16px',
              border: '1px solid var(--border)', transition: 'all .2s ease',
            }}
              onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#fff'; d.style.borderColor = riskColor(c.risk) + '30'; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 6px 18px rgba(0,0,0,.05)'; }}
              onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = 'var(--bg)'; d.style.borderColor = 'var(--border)'; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor(c.risk) }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.city}</span>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: riskBg(c.risk), color: riskColor(c.risk),
                }}>{c.risk}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.shipments} shipments</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: riskColor(c.onTime >= 90 ? 'LOW' : c.onTime >= 80 ? 'MEDIUM' : 'HIGH') }}>
                  {c.onTime}%
                </span>
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${c.onTime}%`, borderRadius: 99, transition: 'width .8s ease',
                  background: c.onTime >= 90 ? '#10B981' : c.onTime >= 80 ? '#F59E0B' : '#EF4444',
                }} />
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 7 }}>on-time delivery rate</p>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TOP PRODUCTS + MONTHLY SUMMARY
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 26 }}>

        {/* Top Products */}
        <div>
          <SectionLabel>Top Product Categories</SectionLabel>
          <div className="anim-left" style={card}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.07)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Package size={15} color="var(--primary)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Revenue by Product</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topProducts.map(p => (
                <div key={p.name}
                  style={{ cursor: 'default', padding: '2px 0', borderRadius: 8, transition: 'background .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.shipments} shipments</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.revenue}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: p.trend.startsWith('+') ? '#10B981' : '#EF4444',
                        background: p.trend.startsWith('+') ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)',
                        padding: '2px 7px', borderRadius: 7,
                      }}>{p.trend}</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(p.shipments / 58) * 100}%`, background: p.color, borderRadius: 99, opacity: .85, transition: 'width .8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div>
          <SectionLabel>Monthly Performance Summary — April 2026</SectionLabel>
          <div className="anim-right" style={card}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.07)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <BarChart2 size={15} color="#3B82F6" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>This Month at a Glance</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              {[
                { icon: TrendingUp,    label: 'Total Revenue',      value: '₹1.6Cr', sub: 'Apr 2026',         color: '#F97316' },
                { icon: Truck,         label: 'Shipments Completed', value: '1,247',  sub: 'This month',        color: '#3B82F6' },
                { icon: Clock,         label: 'Avg Lead Time',       value: '18 hrs', sub: 'Per shipment',      color: '#10B981' },
                { icon: AlertTriangle, label: 'Disruptions Prevented',value: '23',    sub: 'Saved by AI alerts', color: '#F59E0B' },
                { icon: Factory,       label: 'Supplier Network Score',value: '87/100',sub: 'Network average',   color: '#8B5CF6' },
                { icon: Gauge,         label: 'AI Decision Accuracy', value: '96.4%', sub: 'vs actual outcomes', color: '#10B981' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--bg)', borderRadius: 13, padding: '13px 14px',
                  border: '1px solid var(--border)', transition: 'all .2s ease',
                }}
                  onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = '#fff'; d.style.borderColor = item.color + '25'; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 6px 14px rgba(0,0,0,.05)'; }}
                  onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = 'var(--bg)'; d.style.borderColor = 'var(--border)'; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
                    <item.icon size={14} color={item.color} />
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 2, lineHeight: 1 }}>{item.value}</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          QUICK LINKS STRIP
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel>Quick Actions</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 22 }}>
        {[
          { to: '/analyze',   icon: Zap,         color: '#F97316', label: 'Run AI Analysis',       desc: 'Get SHIP NOW / DELAY in 60s' },
          { to: '/cost',      icon: IndianRupee,  color: '#3B82F6', label: 'View Cost Intelligence', desc: 'Full freight + tax breakdown'  },
          { to: '/suppliers', icon: Factory,      color: '#10B981', label: 'Browse Suppliers',       desc: '47 verified partners, scored'  },
          { to: '/alerts',    icon: Bell,         color: '#EF4444', label: 'Check Risk Alerts',      desc: '3 active, 1 critical'          },
        ].map(item => (
          <Link key={item.to} to={item.to}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              background: '#fff', border: '1px solid var(--border)', borderRadius: 16,
              transition: 'all .2s', cursor: 'pointer',
            }}
              onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = item.color + '35'; d.style.boxShadow = `0 6px 18px ${item.color}12`; d.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'var(--border)'; d.style.boxShadow = 'none'; d.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={18} color={item.color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.desc}</p>
              </div>
              <ArrowRight size={14} color="var(--text-3)" />
            </div>
          </Link>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO CTA FOOTER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Link to="/analyze">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 26px', borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(249,115,22,.06), rgba(59,130,246,.05))',
          border: '1px solid rgba(249,115,22,.18)',
          transition: 'all .2s', cursor: 'pointer',
        }}
          onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'rgba(249,115,22,.35)'; d.style.boxShadow = '0 8px 28px rgba(249,115,22,.1)'; }}
          onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'rgba(249,115,22,.18)'; d.style.boxShadow = 'none'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(249,115,22,.3)', flexShrink: 0,
            }}>
              <Zap size={19} color="#fff" fill="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                Start a New AI Analysis
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                6 agents · Full cost + route + supplier · SHIP NOW / DELAY / CANCEL in &lt;60s
              </p>
            </div>
          </div>
          <ArrowRight size={18} color="var(--primary)" />
        </div>
      </Link>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1) }
          50% { opacity: .35; transform: scale(1.5) }
        }
      `}</style>
    </div>
  );
}
