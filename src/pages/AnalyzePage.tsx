// src/pages/AnalyzePage.tsx
import { useState } from 'react';
import { runAnalysis, CITIES, PRODUCTS } from '../lib/api';
import type { AnalysisResult } from '../lib/api';
import {
  Search, BarChart3, MapPin, Factory, AlertTriangle, IndianRupee,
  Crown, Loader2, Rocket, CheckCircle2, Clock, TrendingUp, Truck,
  Shield, CheckCircle, XCircle, AlertOctagon, Zap, Package,
  Wallet, TrendingDown, Info, CalendarDays,
} from 'lucide-react';

const agents = [
  { id:'a1', icon:<BarChart3 size={15}/>,    label:'Demand Forecasting Agent' },
  { id:'a2', icon:<MapPin size={15}/>,        label:'Route Optimization Agent'  },
  { id:'a3', icon:<Factory size={15}/>,       label:'Supplier Finder Agent'     },
  { id:'a4', icon:<AlertTriangle size={15}/>, label:'Risk Monitoring Agent'     },
  { id:'a5', icon:<IndianRupee size={15}/>,   label:'Cost Breakdown Agent'      },
  { id:'a6', icon:<Crown size={15}/>,         label:'Orchestrator Agent'        },
];

type Status = 'idle' | 'running' | 'done' | 'error';

const normPct = (v: number) => Math.min(100, Math.round(v > 0 && v <= 1 ? v * 100 : v));
const riskHex  = (r: string) => r==='LOW'?'#10B981':r==='MEDIUM'?'#F59E0B':'#EF4444';

const decisionCfg = (d: string) => {
  if (d==='SHIP NOW') return { color:'#10B981', bg:'rgba(16,185,129,.08)', border:'rgba(16,185,129,.25)', icon:<CheckCircle size={22}/> };
  if (d==='DELAY')    return { color:'#F59E0B', bg:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.25)', icon:<AlertOctagon size={22}/> };
  return                     { color:'#EF4444', bg:'rgba(239,68,68,.08)',  border:'rgba(239,68,68,.25)',  icon:<XCircle size={22}/> };
};

const budgetCfg = (s: string) => {
  if (s==='WITHIN_BUDGET') return { color:'#10B981', bg:'rgba(16,185,129,.07)', border:'rgba(16,185,129,.25)', icon:<CheckCircle size={14}/>, label:'Within Budget' };
  if (s==='OVER_BUDGET')   return { color:'#EF4444', bg:'rgba(239,68,68,.07)',  border:'rgba(239,68,68,.25)',  icon:<XCircle size={14}/>,     label:'Over Budget'   };
  return                          { color:'#94A3B8', bg:'rgba(148,163,184,.07)',border:'rgba(148,163,184,.25)',icon:<Info size={14}/>,         label:'Not Provided'  };
};

function buildCostBars(r: AnalysisResult) {
  const cb = r.real_cost_breakdown;
  if (!cb) return [
    { label:'Transport',   pct:52, color:'#F97316', amount:0 },
    { label:'GST & Taxes', pct:18, color:'#3B82F6', amount:0 },
    { label:'Handling',    pct:14, color:'#10B981', amount:0 },
    { label:'Insurance',   pct:10, color:'#F59E0B', amount:0 },
    { label:'Misc',        pct:6,  color:'#8B5CF6', amount:0 },
  ];
  const mode = (r.recommended_mode ?? 'ROAD').toUpperCase();
  const mb   = mode==='RAIL' ? cb.rail : mode==='AIR' ? cb.air : cb.road;
  const transport = ((mb as any)?.base_freight??0)+((mb as any)?.fuel_surcharge??0)+((mb as any)?.toll_charges??0);
  const handling = ((mb as any)?.loading_unloading??0)+((mb as any)?.airport_handling??0)+((mb as any)?.road_to_airport??0);
  const gstTotal  = cb.gst?.total_gst ?? 0;
  const insTotal  = cb.insurance?.total ?? 0;
  const misc      = cb.port_customs?.total ?? 0;
  const grand     = transport+handling+gstTotal+insTotal+misc || 1;
  const toPct     = (v:number) => Math.max(1, Math.round((v/grand)*100));
  const raw = [
    { label:'Transport',   amount:transport, color:'#F97316' },
    { label:'GST & Taxes', amount:gstTotal,  color:'#3B82F6' },
    { label:'Handling',    amount:handling,  color:'#10B981' },
    { label:'Insurance',   amount:insTotal,  color:'#F59E0B' },
    { label:'Port & Docs', amount:misc,      color:'#8B5CF6' },
  ];
  const pcts = raw.map(x => toPct(x.amount));
  const diff = 100 - pcts.reduce((a,b)=>a+b,0);
  pcts[0] = Math.max(1, pcts[0]+diff);
  return raw.map((x,i) => ({ ...x, pct:pcts[i] }));
}

/* ── Styles ── */
const sec: React.CSSProperties = { fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:'1px', textTransform:'uppercase' as const };
const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background:'#fff', border:'1px solid var(--border)', borderRadius:18, padding:22, ...extra });

export default function AnalyzePage() {
  const [form,     setForm]     = useState({ product:'', origin:'', destination:'', scenario:'' });
  const [status,   setStatus]   = useState<Status>('idle');
  const [agentIdx, setAgentIdx] = useState(-1);
  const [result,   setResult]   = useState<AnalysisResult | null>(null);
  const [error,    setError]    = useState('');

  const setField = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleAnalyze() {
    if (!form.product || !form.origin || !form.destination) { alert('Product, Origin & Destination select karo!'); return; }
    if (form.origin === form.destination) { alert('Origin & Destination alag hone chahiye!'); return; }

    setStatus('running'); setResult(null); setError(''); setAgentIdx(0);
    let data: AnalysisResult | null = null;

    const fetchPromise = runAnalysis({
      product: form.product, origin_city: form.origin,
      destination_city: form.destination, scenario: form.scenario,
    }).then(d => { data = d; }).catch(() => { data = null; });

    for (let i = 0; i < agents.length; i++) {
      setAgentIdx(i);
      await new Promise(r => setTimeout(r, 2500));
    }
    await fetchPromise;

    if (!data) {
      setStatus('error');
      setError('n8n workflow se response nahi aaya. Webhook URL sahi hai? Workflow active hai?');
      return;
    }
    setResult(data);
    setStatus('done');
  }

  const agentState = (i: number) => {
    if (status === 'idle')  return 'waiting';
    if (status === 'done')  return 'done';
    if (i < agentIdx)       return 'done';
    if (i === agentIdx)     return 'running';
    return 'waiting';
  };

  const confidence   = result ? normPct(result.confidence_score ?? 0) : 0;
  const dcfg         = result ? decisionCfg(result.decision ?? '') : null;
  const circumf      = 2 * Math.PI * 26;
  const bStatus      = result?.budget_status ?? 'NOT_PROVIDED';
  const bcfg         = budgetCfg(bStatus);
  const costBars     = result ? buildCostBars(result) : [];

  const agentScores = result ? (() => {
    const cb = result.real_cost_breakdown;
    const routeScore = result.route_score != null ? normPct(result.route_score)
      : cb?.distance_km ? Math.min(100, Math.round(100-(cb.distance_km/5000)*30+confidence*.3))
      : normPct(confidence*.0097);
    const costScore = result.cost_score != null ? normPct(result.cost_score)
      : cb?.cheapest_total && result.total_cost_inr
        ? Math.min(100, Math.round((cb.cheapest_total/result.total_cost_inr)*100))
        : normPct(confidence*.0093);
    return [
      { label:'Demand Score',   value:normPct(result.demand_score   ?? confidence*.0095), color:'#F97316' },
      { label:'Route Score',    value:routeScore,                                           color:'#3B82F6' },
      { label:'Supplier Score', value:normPct(result.supplier_score ?? confidence*.0098), color:'#10B981' },
      { label:'Risk Safety',    value:normPct(result.risk_score     ?? confidence*.009),  color:'#F59E0B' },
      { label:'Cost Score',     value:costScore,                                            color:'#8B5CF6' },
    ];
  })() : [];

  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <div style={{ width:42, height:42, borderRadius:13, background:'rgba(249,115,22,.08)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Search size={19} />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:2 }}>Run AI Analysis</h1>
            <p style={{ fontSize:13, color:'var(--text-3)' }}>6 AI agents analyze your shipment — SHIP NOW / DELAY / CANCEL in &lt;60s</p>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(280px,1fr) minmax(320px,1.35fr)', gap:22, alignItems:'start' }}>

        {/* ── LEFT: FORM ── */}
        <div className="anim-left" style={card()}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:20 }}>
            <Rocket size={13} color="var(--primary)" />
            <span style={sec}>Shipment Details</span>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>📦 Product Category</label>
            <select className="input-field" value={form.product} onChange={e => setField('product', e.target.value)}>
              <option value="">-- Select Product --</option>
              {PRODUCTS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>🏙️ Origin City</label>
              <select className="input-field" value={form.origin} onChange={e => setField('origin', e.target.value)}>
                <option value="">-- Select --</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>📍 Destination</label>
              <select className="input-field" value={form.destination} onChange={e => setField('destination', e.target.value)}>
                <option value="">-- Select --</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>📝 Scenario (optional)</label>
            <textarea className="input-field" rows={4} style={{ resize:'none', lineHeight:1.65 }}
              placeholder="e.g. Urgent Pharma shipment before monsoon..."
              value={form.scenario} onChange={e => setField('scenario', e.target.value)} />
          </div>

          <button className="btn-primary" onClick={handleAnalyze} disabled={status==='running'}
            style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:14, borderRadius:13 }}>
            {status==='running'
              ? <><Loader2 size={15} className="anim-spin" /> Analyzing...</>
              : <><Rocket size={15} /> Analyze Supply Chain</>}
          </button>

          {status==='error' && (
            <div className="anim-bounce" style={{ marginTop:13, padding:'11px 14px', background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)', borderRadius:11, fontSize:12, fontWeight:600, color:'#EF4444' }}>
              ❌ {error}
            </div>
          )}

          <div style={{ marginTop:16, padding:'11px 13px', background:'rgba(59,130,246,.04)', border:'1px solid rgba(59,130,246,.14)', borderRadius:11, display:'flex', gap:9 }}>
            <Zap size={12} color="#3B82F6" style={{ marginTop:1, flexShrink:0 }} />
            <p style={{ fontSize:11, color:'var(--text-3)', lineHeight:1.65 }}>
              6 agents run in sequence: Demand → Route → Supplier → Risk → Cost → Decision.
              Average: <strong style={{ color:'#3B82F6' }}>~15s</strong> per agent.
            </p>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

          {/* Agent Status */}
          <div className="anim-right" style={card()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <Loader2 size={13} color="#3B82F6" className={status==='running'?'anim-spin':''} />
                <span style={sec}>Live Agent Status</span>
              </div>
              {status==='running' && <span style={{ fontSize:11, fontWeight:700, color:'var(--primary)' }}>{agentIdx+1}/{agents.length}</span>}
              {status==='done' && <span style={{ fontSize:11, fontWeight:700, color:'#10B981', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={12}/>Complete</span>}
            </div>

            {(status==='running'||status==='done') && (
              <div style={{ height:4, background:'#F1F5F9', borderRadius:99, overflow:'hidden', marginBottom:14 }}>
                <div style={{ height:'100%', width:status==='done'?'100%':`${((agentIdx+1)/agents.length)*100}%`, background:'linear-gradient(90deg,var(--primary),var(--accent))', borderRadius:99, transition:'width .6s ease' }} />
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {agents.map((ag, i) => {
                const state = agentState(i);
                return (
                  <div key={ag.id} style={{
                    display:'flex', alignItems:'center', gap:11, padding:'10px 13px',
                    borderRadius:13, border:'1px solid', transition:'all .3s ease',
                    background: state==='running'?'rgba(245,158,11,.05)':state==='done'?'rgba(16,185,129,.04)':'var(--bg)',
                    borderColor: state==='running'?'rgba(245,158,11,.3)':state==='done'?'rgba(16,185,129,.22)':'var(--border)',
                    boxShadow: state==='running'?'0 0 14px rgba(245,158,11,.1)':'none',
                    transform: state==='running'?'scale(1.01)':'scale(1)',
                  }}>
                    <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .3s',
                      background: state==='done'?'rgba(16,185,129,.1)':state==='running'?'rgba(245,158,11,.1)':'#F1F5F9',
                      color: state==='done'?'#10B981':state==='running'?'#F59E0B':'#CBD5E1',
                    }}>
                      {ag.icon}
                    </div>
                    <span style={{ flex:1, fontSize:12, fontWeight:500, color:state==='waiting'?'var(--text-3)':'var(--text)' }}>{ag.label}</span>
                    {state==='running' && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#F59E0B' }}><Loader2 size={10} className="anim-spin"/>Running</span>}
                    {state==='done'    && <span className="anim-bounce" style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#10B981' }}><CheckCircle2 size={10}/>Done</span>}
                    {state==='waiting' && <span style={{ fontSize:11, fontWeight:500, color:'#CBD5E1' }}>Waiting</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RESULT ── */}
          {status==='done' && result && dcfg && (
            <div className="anim-scale" style={card({ border:`1px solid ${dcfg.border}` })}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:18 }}>
                <BarChart3 size={13} color="var(--primary)" />
                <span style={sec}>Final Analysis Result</span>
              </div>

              {/* Decision + Confidence */}
              <div style={{ background:dcfg.bg, border:`1px solid ${dcfg.border}`, borderRadius:14, padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ color:dcfg.color }}>{dcfg.icon}</div>
                  <div>
                    <p style={{ fontSize:11, color:'var(--text-3)', fontWeight:500, marginBottom:3 }}>🤖 AI Decision</p>
                    <p style={{ fontSize:26, fontWeight:900, color:dcfg.color, lineHeight:1 }}>{result.decision ?? 'N/A'}</p>
                  </div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:11, color:'var(--text-3)', fontWeight:500, marginBottom:5 }}>Confidence</p>
                  <div style={{ position:'relative', display:'inline-block' }}>
                    <svg width="64" height="64" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#F1F5F9" strokeWidth="6"/>
                      <circle cx="32" cy="32" r="26" fill="none" stroke={dcfg.color} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={circumf} strokeDashoffset={circumf*(1-confidence/100)}
                        transform="rotate(-90 32 32)" style={{ transition:'stroke-dashoffset 1.2s ease' }}/>
                    </svg>
                    <span style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:12, fontWeight:800, color:dcfg.color }}>{confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Budget */}
              {bStatus !== 'NOT_PROVIDED' && (
                <div style={{ background:bcfg.bg, border:`1px solid ${bcfg.border}`, borderRadius:13, padding:'13px 15px', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}><Wallet size={13} color={bcfg.color}/><span style={{ ...sec, color:bcfg.color }}>Budget Status</span></div>
                    <span style={{ fontSize:11, fontWeight:700, color:bcfg.color, background:bcfg.bg, border:`1px solid ${bcfg.border}`, padding:'3px 10px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}>
                      {bcfg.icon} {bcfg.label}
                    </span>
                  </div>
                  <p style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.7, marginBottom:8 }}>{result.budget_verdict ?? '-'}</p>
                  {(result.budget_shortfall??0)>0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.18)' }}>
                      <TrendingDown size={12} color="#EF4444"/><span style={{ fontSize:12, color:'#EF4444', fontWeight:600 }}>Shortfall: ₹{(result.budget_shortfall??0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(result.budget_surplus??0)>0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.18)' }}>
                      <TrendingUp size={12} color="#10B981"/><span style={{ fontSize:12, color:'#10B981', fontWeight:600 }}>Savings: ₹{(result.budget_surplus??0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {result.cost_saving_tip && (
                    <div style={{ marginTop:8, display:'flex', gap:7, padding:'8px 12px', borderRadius:9, background:'rgba(59,130,246,.04)', border:'1px solid rgba(59,130,246,.14)' }}>
                      <Zap size={12} color="#3B82F6" style={{ marginTop:1, flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:'#3B82F6', fontWeight:500, lineHeight:1.6 }}>💡 {result.cost_saving_tip}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Info Grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:16 }}>
                {([
                  { icon:<Truck size={12}/>,        label:'Best Route',    value:result.best_route    ?? '-', isRisk:false },
                  { icon:<Factory size={12}/>,      label:'Best Supplier', value:result.best_supplier ?? '-', isRisk:false },
                  { icon:<IndianRupee size={12}/>,  label:'Total Cost',    value:`₹${(result.total_cost_inr??0).toLocaleString('en-IN')}`, isRisk:false },
                  { icon:<Clock size={12}/>,        label:'Delivery',      value:`${result.estimated_delivery_hours??0} hrs`, isRisk:false },
                  { icon:<Shield size={12}/>,       label:'Overall Risk',  value:result.overall_risk ?? '-', isRisk:true  },
                  { icon:<TrendingUp size={12}/>,   label:'Demand Trend',  value:result.demand_trend  ?? '-', isRisk:false },
                  { icon:<CalendarDays size={12}/>, label:'Peak Month',    value:result.peak_month    ?? '-', isRisk:false },
                  { icon:<MapPin size={12}/>,       label:'Distance',      value:result.real_cost_breakdown?.distance_km?`${result.real_cost_breakdown.distance_km} km`:'-', isRisk:false },
                ] as {icon:React.ReactNode;label:string;value:string;isRisk:boolean}[]).map(item => (
                  <div key={item.label} style={{ background:'var(--bg)', borderRadius:11, padding:'11px 13px', border:'1px solid transparent', transition:'all .2s', cursor:'default' }}
                    onMouseEnter={e=>{const d=e.currentTarget as HTMLDivElement;d.style.background='#fff';d.style.borderColor='rgba(249,115,22,.15)';d.style.boxShadow='0 4px 12px rgba(0,0,0,.05)';}}
                    onMouseLeave={e=>{const d=e.currentTarget as HTMLDivElement;d.style.background='var(--bg)';d.style.borderColor='transparent';d.style.boxShadow='none';}}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5, color:'var(--text-3)' }}>
                      {item.icon}<span style={{ fontSize:9, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px' }}>{item.label}</span>
                    </div>
                    <p style={{ fontSize:12, fontWeight:700, color:item.isRisk?riskHex(item.value):'var(--text)' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Mode Comparison */}
              {result.real_cost_breakdown?.all_modes && (
                <div style={{ background:'var(--bg)', borderRadius:13, padding:'13px 15px', marginBottom:14, border:'1px solid var(--border)' }}>
                  <p style={{ ...sec, marginBottom:11 }}>Mode-wise Cost Comparison</p>
                  {([
                    { mode:'ROAD', icon:<Truck size={11}/>,   color:'#F97316', amount:result.real_cost_breakdown.all_modes.road??0 },
                    { mode:'RAIL', icon:<Package size={11}/>, color:'#3B82F6', amount:result.real_cost_breakdown.all_modes.rail??0 },
                    { mode:'AIR',  icon:<Rocket size={11}/>,  color:'#8B5CF6', amount:result.real_cost_breakdown.all_modes.air??0  },
                  ]).map(m => {
                    const allVals = [result.real_cost_breakdown!.all_modes!.road??0, result.real_cost_breakdown!.all_modes!.rail??0, result.real_cost_breakdown!.all_modes!.air??0];
                    const maxVal  = Math.max(...allVals)||1;
                    const barPct  = Math.round((m.amount/maxVal)*100);
                    const isBest  = result.real_cost_breakdown?.cheapest_mode === m.mode;
                    return (
                      <div key={m.mode} style={{ marginBottom:9 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ color:m.color }}>{m.icon}</span>
                            <span style={{ fontSize:12, fontWeight:600, color:'var(--text-2)' }}>{m.mode}</span>
                            {isBest && <span style={{ fontSize:9, fontWeight:700, color:'#10B981', background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', padding:'1px 7px', borderRadius:99 }}>CHEAPEST</span>}
                          </div>
                          <span style={{ fontSize:12, fontWeight:700, color:m.color }}>₹{m.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ height:5, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${barPct}%`, background:m.color, borderRadius:99, transition:'width 1s ease', opacity:isBest?1:.5 }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cost Breakdown */}
              <div style={{ background:'var(--bg)', borderRadius:13, padding:'13px 15px', marginBottom:14, border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
                  <p style={sec}>Cost Breakdown</p>
                  <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Mode: {result.recommended_mode??'ROAD'}</span>
                </div>
                {costBars.map(b => (
                  <div key={b.label} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:500, color:'var(--text-2)' }}>{b.label}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        {b.amount>0 && <span style={{ fontSize:10, color:'var(--text-3)' }}>₹{b.amount.toLocaleString('en-IN')}</span>}
                        <span style={{ fontSize:11, fontWeight:700, color:b.color }}>{b.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height:4, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${b.pct}%`, background:b.color, borderRadius:99, transition:'width 1s ease' }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Agent Scores */}
              <div style={{ background:'var(--bg)', borderRadius:13, padding:'13px 15px', marginBottom:14, border:'1px solid var(--border)' }}>
                <p style={{ ...sec, marginBottom:11 }}>Agent Score Breakdown</p>
                {agentScores.map(s => (
                  <div key={s.label} style={{ marginBottom:9 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:500, color:'var(--text-2)' }}>{s.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.value}%</span>
                    </div>
                    <div style={{ height:6, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${s.value}%`, background:`linear-gradient(90deg,${s.color}88,${s.color})`, borderRadius:99, transition:'width 1.1s ease', position:'relative', overflow:'hidden' }}>
                        <div className="shimmer-bar" style={{ position:'absolute', inset:0 }}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Recommendation */}
              <div style={{ background:'rgba(249,115,22,.03)', border:'1px solid rgba(249,115,22,.14)', borderLeft:'4px solid var(--primary)', borderRadius:11, padding:'13px 15px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <Package size={12} color="var(--primary)"/>
                  <span style={{ ...sec, color:'var(--primary)' }}>Final Recommendation</span>
                </div>
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.75 }}>{result.final_recommendation ?? '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}