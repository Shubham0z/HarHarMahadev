// src/pages/HomePage.tsx
import { Link } from 'react-router-dom';
import {
  Zap, BarChart3, Search, MapPin, Factory, AlertTriangle,
  IndianRupee, Crown, ArrowRight, TrendingUp, Shield,
  Clock, Package, CheckCircle,
} from 'lucide-react';

const features = [
  { icon: BarChart3,     color: '#F97316', bg: 'rgba(249,115,22,.08)',  title: 'Demand Forecasting',   desc: 'AI predicts product demand across cities with 96% accuracy using historical data.' },
  { icon: MapPin,        color: '#3B82F6', bg: 'rgba(59,130,246,.08)',  title: 'Route Optimization',   desc: 'Find the fastest & cheapest route — Road, Rail, or Air — in seconds.' },
  { icon: Factory,       color: '#10B981', bg: 'rgba(16,185,129,.08)',  title: 'Supplier Discovery',   desc: 'Instantly find the best supplier for your product category and location.' },
  { icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,.08)',  title: 'Risk Monitoring',      desc: 'Real-time risk alerts for weather, strikes, port delays, and more.' },
  { icon: IndianRupee,   color: '#8B5CF6', bg: 'rgba(139,92,246,.08)', title: 'Cost Breakdown',       desc: 'Get detailed GST, freight, handling, and insurance cost analysis.' },
  { icon: Crown,         color: '#EF4444', bg: 'rgba(239,68,68,.08)',   title: 'AI Orchestrator',      desc: 'Final SHIP NOW / DELAY / CANCEL decision with confidence score.' },
];

const stats = [
  { value: '96.4%', label: 'AI Accuracy',      icon: CheckCircle, color: '#10B981' },
  { value: '< 60s', label: 'Analysis Time',     icon: Clock,       color: '#3B82F6' },
  { value: '₹2.4L', label: 'Avg Cost Saved',   icon: IndianRupee, color: '#F97316' },
  { value: '47+',   label: 'Active Suppliers',  icon: Factory,     color: '#8B5CF6' },
];

const recentDecisions = [
  { product: 'Pharma',      route: 'Mumbai → Delhi',     decision: 'SHIP NOW', risk: 'LOW',    cost: '₹1.2L', time: '18 hrs' },
  { product: 'Electronics', route: 'Bangalore → Chennai', decision: 'DELAY',    risk: 'MEDIUM', cost: '₹3.4L', time: '24 hrs' },
  { product: 'FMCG',        route: 'Delhi → Jaipur',      decision: 'SHIP NOW', risk: 'LOW',    cost: '₹0.8L', time: '10 hrs' },
  { product: 'Automotive',  route: 'Pune → Hyderabad',    decision: 'SHIP NOW', risk: 'LOW',    cost: '₹2.1L', time: '22 hrs' },
];

const decisionStyle = (d: string) => ({
  'SHIP NOW': { color: '#10B981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.25)' },
  'DELAY':    { color: '#F59E0B', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)' },
  'CANCEL':   { color: '#EF4444', bg: 'rgba(239,68,68,.1)',  border: 'rgba(239,68,68,.25)' },
}[d] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,.1)', border: 'rgba(148,163,184,.25)' });

const riskColor = (r: string) => r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── HERO ── */}
      <div className="anim-up card" style={{
        marginBottom: 28, padding: '44px 40px',
        background: 'linear-gradient(135deg, #fff 0%, #FFF7ED 50%, #EFF6FF 100%)',
        border: '1px solid var(--border)', borderRadius: 24, position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(249,115,22,.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, left:80,  width:160, height:160, borderRadius:'50%', background:'rgba(59,130,246,.06)',  pointerEvents:'none' }} />

        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'5px 14px', borderRadius:99,
              background:'rgba(249,115,22,.08)', border:'1px solid rgba(249,115,22,.2)',
              fontSize:11, fontWeight:700, color:'var(--primary)',
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--primary)', display:'inline-block', animation:'pulse 2s infinite' }} />
              6 AI Agents Active
            </div>
            <div style={{
              padding:'5px 14px', borderRadius:99,
              background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)',
              fontSize:11, fontWeight:600, color:'var(--success)',
            }}>✓ Real-time Analysis</div>
          </div>

          <h1 style={{ fontSize:42, fontWeight:900, lineHeight:1.1, marginBottom:16, color:'var(--text)' }}>
            AI-Powered<br />
            <span className="grad-text">Supply Chain</span><br />
            Intelligence
          </h1>
          <p style={{ fontSize:16, color:'var(--text-2)', lineHeight:1.7, maxWidth:520, marginBottom:28 }}>
            6 specialized AI agents analyze demand, routes, suppliers, risks and costs — then deliver a confident <strong>SHIP NOW</strong> or <strong>DELAY</strong> decision in under 60 seconds.
          </p>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link to="/analyze">
              <button className="btn-primary" style={{ fontSize:14, padding:'13px 28px' }}>
                <Zap size={16} /> Run Analysis <ArrowRight size={14} />
              </button>
            </Link>
            <Link to="/dashboard">
              <button style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'13px 24px', borderRadius:12, border:'1px solid var(--border)',
                background:'#fff', fontSize:14, fontWeight:600, color:'var(--text-2)',
                transition:'all .2s',
              }}
                onMouseEnter={e=>{const d=e.currentTarget;d.style.borderColor='var(--primary)';d.style.color='var(--primary)';}}
                onMouseLeave={e=>{const d=e.currentTarget;d.style.borderColor='var(--border)';d.style.color='var(--text-2)';}}
              >
                <BarChart3 size={16} /> View Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:28 }}>
        {stats.map(({ value, label, icon: Icon, color }) => (
          <div key={label} className="anim-up card" style={{ padding:'18px 20px', textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <p style={{ fontSize:26, fontWeight:900, color:'var(--text)', marginBottom:4 }}>{value}</p>
            <p style={{ fontSize:12, color:'var(--text-3)', fontWeight:500 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:4 }}>How it works</h2>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>6 AI agents run in sequence to deliver the complete analysis</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
          {features.map(({ icon: Icon, color, bg, title, desc }, i) => (
            <div key={title} className="anim-up card" style={{ animationDelay:`${i*55}ms`, padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:bg, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{title}</p>
                  <span style={{ fontSize:9, fontWeight:700, color, background:`${color}14`, border:`1px solid ${color}33`, padding:'1px 7px', borderRadius:99 }}>Agent {i+1}</span>
                </div>
                <p style={{ fontSize:12, color:'var(--text-3)', lineHeight:1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT DECISIONS ── */}
      <div className="anim-up card" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <TrendingUp size={15} color="var(--primary)" />
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.6px' }}>Sample AI Decisions</span>
          </div>
          <Link to="/analyze">
            <button style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'6px 14px', borderRadius:9, border:'1px solid rgba(249,115,22,.2)',
              background:'rgba(249,115,22,.05)', fontSize:11, fontWeight:700, color:'var(--primary)',
            }}>
              Run yours <ArrowRight size={11} />
            </button>
          </Link>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
          {recentDecisions.map((r, i) => {
            const ds = decisionStyle(r.decision);
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'13px 10px', borderRadius:10, transition:'background .15s', cursor:'default',
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background='var(--bg)';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='transparent';}}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0, flex:1 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Package size={15} color="var(--text-3)" />
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{r.product}</p>
                    <p style={{ fontSize:11, color:'var(--text-3)' }}>{r.route}</p>
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
                  <div style={{ textAlign:'right', display:'flex', flexDirection:'column', gap:2 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{r.cost}</span>
                    <span style={{ fontSize:10, color:'var(--text-3)' }}>{r.time}</span>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:riskColor(r.risk), background:`${riskColor(r.risk)}14`, padding:'3px 9px', borderRadius:99 }}>{r.risk}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:ds.color, background:ds.bg, border:`1px solid ${ds.border}`, padding:'4px 12px', borderRadius:99, whiteSpace:'nowrap' }}>
                    {r.decision}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="anim-up card" style={{
        padding:'32px 36px', textAlign:'center',
        background:'linear-gradient(135deg, rgba(249,115,22,.04), rgba(59,130,246,.04))',
        border:'1px solid rgba(249,115,22,.1)',
      }}>
        <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,var(--primary),var(--primary-dark))', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(249,115,22,.3)' }}>
          <Zap size={22} color="#fff" fill="#fff" />
        </div>
        <h3 style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:8 }}>Ready to Analyze Your Shipment?</h3>
        <p style={{ fontSize:14, color:'var(--text-2)', marginBottom:24, maxWidth:440, margin:'0 auto 24px' }}>
          Fill in product, origin, and destination — our 6 AI agents will deliver a decision in under 60 seconds.
        </p>
        <Link to="/analyze">
          <button className="btn-primary" style={{ fontSize:14, padding:'13px 32px' }}>
            <Zap size={16} /> Start AI Analysis <ArrowRight size={14} />
          </button>
        </Link>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}`}</style>
    </div>
  );
}