// src/pages/DashboardPage.tsx
import { Link } from 'react-router-dom';
import {
  Truck, AlertTriangle, CheckCircle, IndianRupee, Factory, Bot,
  Search, Bell, MapPin, TrendingUp, Package, Clock, BarChart2,
  ArrowRight, Zap,
} from 'lucide-react';

/* ── Hardcoded Data ── */
const kpis = [
  { icon: Truck,         label: 'Active Shipments',  value: '142',   sub: 'Across 8 cities',       color: '#F97316', trend: '+12%',  trendUp: true  },
  { icon: AlertTriangle, label: 'Open Risk Alerts',  value: '3',     sub: '1 Critical',             color: '#EF4444', trend: '+3',    trendUp: false },
  { icon: CheckCircle,   label: 'On-Time Delivery',  value: '94.2%', sub: 'Last 30 days',           color: '#10B981', trend: '+1.4%', trendUp: true  },
  { icon: IndianRupee,   label: 'Avg Shipment Cost', value: '₹2.4L', sub: 'Per shipment this month',color: '#F59E0B', trend: '-8%',   trendUp: true  },
  { icon: Factory,       label: 'Active Suppliers',  value: '47',    sub: 'Across 6 categories',    color: '#8B5CF6', trend: '+3',    trendUp: true  },
  { icon: Bot,           label: 'AI Analyses Run',   value: '284',   sub: 'Total lifetime',         color: '#3B82F6', trend: '+284',  trendUp: true  },
];

const alerts = [
  { type:'CRITICAL', icon:'🌧️', title:'Heavy Rain Alert — Mumbai Port',  desc:'Port operations may delay 12–24 hrs. Consider road diversion.',   source:'Weather Agent', time:'5 min ago'  },
  { type:'WARNING',  icon:'🚛', title:'Truck Shortage — Delhi NCR',       desc:'Only 60% fleet availability this week due to driver strike.',      source:'Route Agent',   time:'22 min ago' },
  { type:'INFO',     icon:'📦', title:'Supplier Restocked — Pharma (Pune)',desc:'MedPharma Pune has restocked. Good time to ship bulk orders.',     source:'Supplier Agent',time:'1 hr ago'   },
];

const recentAnalyses = [
  { product:'Pharma',      origin:'Mumbai',   destination:'Delhi',     decision:'SHIP NOW', risk:'LOW',    cost:120000, hrs:18  },
  { product:'Electronics', origin:'Bangalore',destination:'Chennai',   decision:'DELAY',    risk:'MEDIUM', cost:340000, hrs:24  },
  { product:'FMCG',        origin:'Delhi',    destination:'Jaipur',    decision:'SHIP NOW', risk:'LOW',    cost:82000,  hrs:10  },
  { product:'Automotive',  origin:'Pune',     destination:'Hyderabad', decision:'SHIP NOW', risk:'LOW',    cost:215000, hrs:22  },
  { product:'Chemical',    origin:'Surat',    destination:'Mumbai',    decision:'CANCEL',   risk:'HIGH',   cost:490000, hrs:36  },
];

const cityPerf = [
  { city:'Mumbai',    shipments:34, onTime:97, risk:'LOW'    },
  { city:'Delhi',     shipments:28, onTime:91, risk:'MEDIUM' },
  { city:'Bangalore', shipments:22, onTime:95, risk:'LOW'    },
  { city:'Chennai',   shipments:19, onTime:78, risk:'HIGH'   },
  { city:'Hyderabad', shipments:17, onTime:93, risk:'LOW'    },
  { city:'Kolkata',   shipments:14, onTime:88, risk:'MEDIUM' },
  { city:'Gujarat',   shipments:12, onTime:96, risk:'LOW'    },
  { city:'Goa',       shipments:8,  onTime:82, risk:'MEDIUM' },
];

const topProducts = [
  { name:'Pharma',      shipments:58, revenue:'₹35.6L', trend:'+18%', color:'#F97316' },
  { name:'Electronics', shipments:42, revenue:'₹75.6L', trend:'+6%',  color:'#3B82F6' },
  { name:'FMCG',        shipments:37, revenue:'₹16.7L', trend:'+22%', color:'#10B981' },
  { name:'Automotive',  shipments:28, revenue:'₹26.6L', trend:'+4%',  color:'#F59E0B' },
  { name:'Kirana',      shipments:19, revenue:'₹5.3L',  trend:'-3%',  color:'#EF4444' },
];

/* ── Helpers ── */
const riskColor = (r: string) => r === 'LOW' ? '#10B981' : r === 'MEDIUM' ? '#F59E0B' : '#EF4444';

const decisionCfg = (d: string) => ({
  'SHIP NOW': { color:'#10B981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.25)' },
  'DELAY':    { color:'#F59E0B', bg:'rgba(245,158,11,.1)', border:'rgba(245,158,11,.25)' },
  'CANCEL':   { color:'#EF4444', bg:'rgba(239,68,68,.1)',  border:'rgba(239,68,68,.25)'  },
}[d] ?? { color:'#94A3B8', bg:'transparent', border:'transparent' });

const alertBg     = (t:string) => t==='CRITICAL'?'rgba(239,68,68,.05)' :t==='WARNING'?'rgba(245,158,11,.05)':'rgba(59,130,246,.05)';
const alertBorder = (t:string) => t==='CRITICAL'?'rgba(239,68,68,.2)'  :t==='WARNING'?'rgba(245,158,11,.2)' :'rgba(59,130,246,.2)';
const alertDot    = (t:string) => t==='CRITICAL'?'#EF4444':t==='WARNING'?'#F59E0B':'#3B82F6';

const card: React.CSSProperties = {
  background:'#fff', border:'1px solid var(--border)',
  borderRadius:18, padding:20,
  transition:'box-shadow .25s ease',
};

const sec: React.CSSProperties = {
  fontSize:11, fontWeight:700, color:'var(--text-3)',
  letterSpacing:'1px', textTransform:'uppercase' as const,
};

export default function DashboardPage() {
  return (
    <div style={{ maxWidth:1200, margin:'0 auto' }}>

      {/* Header */}
      <div className="anim-up" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:14, marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text)', marginBottom:3 }}>Control Tower Dashboard</h1>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>Real-time supply chain overview</p>
        </div>
        <Link to="/analyze">
          <button className="btn-primary">
            <Search size={14} /> Run New Analysis
          </button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:14, marginBottom:26 }}>
        {kpis.map(k => (
          <div key={k.label} className="anim-up" style={{
            ...card, padding:'16px 18px',
          }}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 10px 28px rgba(0,0,0,.06)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';}}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${k.color}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <k.icon size={17} color={k.color} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:k.trendUp?'#10B981':'#EF4444', background:k.trendUp?'rgba(16,185,129,.08)':'rgba(239,68,68,.08)', padding:'2px 8px', borderRadius:99 }}>
                {k.trend}
              </span>
            </div>
            <p style={{ fontSize:22, fontWeight:900, color:'var(--text)', marginBottom:2 }}>{k.value}</p>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', marginBottom:1 }}>{k.label}</p>
            <p style={{ fontSize:10, color:'var(--text-3)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerts + Analyses */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:20, marginBottom:24 }}>

        {/* Live Alerts */}
        <div className="anim-left" style={card}
          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 32px rgba(0,0,0,.07)';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';}}
        >
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Bell size={15} color="var(--primary)" />
              <span style={sec}>Live Alerts</span>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:'#EF4444', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:99, padding:'3px 10px', display:'flex', alignItems:'center', gap:5 }}>
              <span className="anim-blink" style={{ width:6, height:6, borderRadius:'50%', background:'#EF4444', display:'inline-block' }} />
              3 Active
            </span>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'flex-start', gap:11,
                padding:'11px 13px', borderRadius:12,
                background:alertBg(a.type), border:`1px solid ${alertBorder(a.type)}`,
                transition:'all .2s', cursor:'default',
              }}
                onMouseEnter={e=>{const d=e.currentTarget as HTMLDivElement;d.style.transform='translateX(3px)';}}
                onMouseLeave={e=>{const d=e.currentTarget as HTMLDivElement;d.style.transform='translateX(0)';}}
              >
                <span style={{ fontSize:18, flexShrink:0 }}>{a.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:alertDot(a.type), flexShrink:0, animation:a.type==='CRITICAL'?'blink 1s infinite':'none', display:'inline-block' }} />
                    <p style={{ fontSize:12, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</p>
                  </div>
                  <p style={{ fontSize:11, color:'var(--text-2)', lineHeight:1.5, marginBottom:4 }}>{a.desc}</p>
                  <div style={{ display:'flex', gap:8, fontSize:10, color:'var(--text-3)' }}>
                    <span>{a.time}</span><span>·</span>
                    <span style={{ fontWeight:600, color:alertDot(a.type) }}>{a.source}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="anim-right" style={card}
          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 32px rgba(0,0,0,.07)';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';}}
        >
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Bot size={15} color="#3B82F6" />
              <span style={sec}>Recent Analyses</span>
            </div>
            <span style={{ fontSize:11, fontWeight:600, color:'#10B981', background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.15)', borderRadius:99, padding:'3px 12px', display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', boxShadow:'0 0 5px #10B981', display:'inline-block' }} /> Live
            </span>
          </div>

          <div style={{ display:'flex', flexDirection:'column' }}>
            {recentAnalyses.map((a, i) => {
              const dc = decisionCfg(a.decision);
              return (
                <div key={i} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'11px 8px',
                  borderBottom:i<recentAnalyses.length-1?'1px solid #F1F5F9':'none',
                  borderRadius:8, transition:'background .15s', cursor:'default',
                }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background='var(--bg)';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='transparent';}}
                >
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
                      {a.product} · {a.origin} → {a.destination}
                    </p>
                    <p style={{ fontSize:11, color:'var(--text-3)' }}>
                      ₹{a.cost.toLocaleString('en-IN')} · {a.hrs} hrs
                    </p>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0, marginLeft:10 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:dc.color, background:dc.bg, border:`1px solid ${dc.border}`, padding:'3px 10px', borderRadius:99 }}>
                      {a.decision}
                    </span>
                    <span style={{ fontSize:10, fontWeight:700, color:riskColor(a.risk) }}>{a.risk}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* City Performance */}
      <div className="anim-up" style={{ ...card, marginBottom:24 }}
        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 32px rgba(0,0,0,.07)';}}
        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';}}
      >
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
          <MapPin size={15} color="var(--primary)" />
          <span style={sec}>City-wise Performance</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))', gap:12 }}>
          {cityPerf.map(c => (
            <div key={c.city} style={{
              background:'var(--bg)', borderRadius:13, padding:'13px 15px',
              border:'1px solid var(--border)', transition:'all .2s ease',
            }}
              onMouseEnter={e=>{const d=e.currentTarget as HTMLDivElement;d.style.background='#fff';d.style.borderColor='rgba(249,115,22,.2)';d.style.transform='translateY(-2px)';d.style.boxShadow='0 6px 16px rgba(0,0,0,.05)';}}
              onMouseLeave={e=>{const d=e.currentTarget as HTMLDivElement;d.style.background='var(--bg)';d.style.borderColor='var(--border)';d.style.transform='translateY(0)';d.style.boxShadow='none';}}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{c.city}</span>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6, background:`${riskColor(c.risk)}14`, color:riskColor(c.risk) }}>{c.risk}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                <span style={{ fontSize:11, color:'var(--text-3)' }}>{c.shipments} shipments</span>
                <span style={{ fontSize:12, fontWeight:700, color:riskColor(c.onTime>=90?'LOW':c.onTime>=80?'MEDIUM':'HIGH') }}>{c.onTime}%</span>
              </div>
              <div style={{ height:5, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                <div style={{
                  height:'100%', width:`${c.onTime}%`, borderRadius:99, transition:'width .8s ease',
                  background: c.onTime>=90 ? 'linear-gradient(90deg,#10B981,#34D399)' : c.onTime>=80 ? 'linear-gradient(90deg,#F59E0B,#FCD34D)' : 'linear-gradient(90deg,#EF4444,#F87171)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products + Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:20 }}>

        {/* Top Products */}
        <div className="anim-left" style={card}
          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 32px rgba(0,0,0,.07)';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';}}
        >
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <Package size={15} color="var(--primary)" />
            <span style={sec}>Top Product Categories</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {topProducts.map(p => (
              <div key={p.name}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:9, height:9, borderRadius:'50%', background:p.color }} />
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{p.name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:11, color:'var(--text-3)' }}>{p.shipments} shipments</span>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{p.revenue}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:p.trend.startsWith('+')?'#10B981':'#EF4444' }}>{p.trend}</span>
                  </div>
                </div>
                <div style={{ height:5, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(p.shipments/58)*100}%`, background:p.color, borderRadius:99, opacity:.8, transition:'width .8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="anim-right" style={card}
          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 32px rgba(0,0,0,.07)';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';}}
        >
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <BarChart2 size={15} color="#3B82F6" />
            <span style={sec}>Monthly Summary</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
            {[
              { icon:TrendingUp,    label:'Total Revenue',  value:'₹1.6Cr', sub:'Apr 2026',         color:'#F97316' },
              { icon:Truck,         label:'Shipments Done', value:'1,247',  sub:'This month',        color:'#3B82F6' },
              { icon:Clock,         label:'Avg Lead Time',  value:'18 hrs', sub:'Per shipment',      color:'#10B981' },
              { icon:AlertTriangle, label:'Disruptions',    value:'23',     sub:'Prevented by AI',   color:'#F59E0B' },
              { icon:Factory,       label:'Supplier Score', value:'87/100', sub:'Network avg',       color:'#8B5CF6' },
              { icon:CheckCircle,   label:'AI Accuracy',    value:'96.4%',  sub:'Decision precision',color:'#10B981' },
            ].map(item => (
              <div key={item.label} style={{
                background:'var(--bg)', borderRadius:12, padding:'13px 14px',
                border:'1px solid var(--border)', transition:'all .2s ease',
              }}
                onMouseEnter={e=>{const d=e.currentTarget as HTMLDivElement;d.style.background='#fff';d.style.borderColor='rgba(249,115,22,.15)';d.style.transform='translateY(-2px)';d.style.boxShadow='0 6px 14px rgba(0,0,0,.05)';}}
                onMouseLeave={e=>{const d=e.currentTarget as HTMLDivElement;d.style.background='var(--bg)';d.style.borderColor='var(--border)';d.style.transform='translateY(0)';d.style.boxShadow='none';}}
              >
                <item.icon size={17} color={item.color} style={{ marginBottom:7 }} />
                <p style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:1 }}>{item.value}</p>
                <p style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', marginBottom:1 }}>{item.label}</p>
                <p style={{ fontSize:10, color:'var(--text-3)' }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav to Analyze */}
      <div className="anim-up" style={{ marginTop:24 }}>
        <Link to="/analyze">
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'18px 24px', borderRadius:16,
            background:'linear-gradient(135deg,rgba(249,115,22,.05),rgba(59,130,246,.04))',
            border:'1px solid rgba(249,115,22,.15)', transition:'all .2s', cursor:'pointer',
          }}
            onMouseEnter={e=>{const d=e.currentTarget as HTMLDivElement;d.style.borderColor='rgba(249,115,22,.3)';d.style.boxShadow='0 8px 24px rgba(249,115,22,.1)';}}
            onMouseLeave={e=>{const d=e.currentTarget as HTMLDivElement;d.style.borderColor='rgba(249,115,22,.15)';d.style.boxShadow='none';}}
          >
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:13, background:'linear-gradient(135deg,var(--primary),var(--primary-dark))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(249,115,22,.3)' }}>
                <Zap size={18} color="#fff" fill="#fff" />
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>Run a New AI Analysis</p>
                <p style={{ fontSize:12, color:'var(--text-3)' }}>6 agents · SHIP NOW / DELAY / CANCEL decision in &lt;60s</p>
              </div>
            </div>
            <ArrowRight size={18} color="var(--primary)" />
          </div>
        </Link>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}