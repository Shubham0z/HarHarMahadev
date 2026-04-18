// src/pages/ManagerWarehousesPage.tsx
import { useEffect, useState } from 'react';
import {
  Warehouse, MapPin, Package, ArrowRightLeft,
  AlertTriangle, CheckCircle, TrendingDown, RefreshCw,
  X, ChevronRight, Clock,
} from 'lucide-react';
import {
  getWarehousesByRegion, getAllRegions, transferStock, getRecentTransfers,
  type Warehouse as WH, type StockTransfer,
} from '../lib/supabase';

// ── helpers ──────────────────────────────────────────────────────────────────
const stockPct   = (w: WH) => Math.round((w.current_stock / w.capacity) * 100);
const stockColor = (pct: number) => pct >= 60 ? '#10B981' : pct >= 30 ? '#F59E0B' : '#EF4444';
const stockLabel = (pct: number) => pct >= 60 ? 'Healthy'  : pct >= 30 ? 'Low'     : 'Critical';
const stockBg    = (pct: number) => pct >= 60 ? 'rgba(16,185,129,0.08)'  : pct >= 30 ? 'rgba(245,158,11,0.08)'  : 'rgba(239,68,68,0.08)';
const stockBorder= (pct: number) => pct >= 60 ? 'rgba(16,185,129,0.2)'   : pct >= 30 ? 'rgba(245,158,11,0.2)'   : 'rgba(239,68,68,0.2)';

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #E2E8F0',
  borderRadius: 20, padding: 20, transition: 'all 0.25s ease',
};

const REGIONS = [
  'Mumbai','Delhi','Chennai','Kolkata',
  'Hyderabad','Bangalore','Gujarat','Goa','Pune','Jaipur',
];

// ── Transfer Modal ────────────────────────────────────────────────────────────
function TransferModal({
  warehouses, targetWH, onClose, onSuccess,
}: {
  warehouses: WH[];
  targetWH:   WH;
  onClose:    () => void;
  onSuccess:  () => void;
}) {
  const [fromId,    setFromId]    = useState('');
  const [quantity,  setQuantity]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const fromOptions = warehouses.filter(w => w.id !== targetWH.id && w.current_stock > 0);
  const fromWH      = fromOptions.find(w => w.id === fromId);
  const maxQty      = fromWH
    ? Math.min(fromWH.current_stock, targetWH.capacity - targetWH.current_stock)
    : 0;

  const handleTransfer = async () => {
    if (!fromWH) return setError('Source warehouse select karo');
    const qty = parseInt(quantity);
    if (!qty || qty <= 0)           return setError('Valid quantity daalo');
    if (qty > fromWH.current_stock) return setError(`${fromWH.name} mein sirf ${fromWH.current_stock} units hain`);
    if (qty > maxQty)               return setError(`Max ${maxQty} units transfer ho sakti hain`);

    setLoading(true); setError(null);
    const { error: err } = await transferStock(
      fromWH.name, targetWH.name, qty,
      fromWH.id,   targetWH.id,
      fromWH.current_stock, targetWH.current_stock, targetWH.capacity,
    );
    setLoading(false);
    if (err) return setError(err);
    onSuccess();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: 28,
        width: '100%', maxWidth: 460,
        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        border: '1px solid #E2E8F0',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(249,115,22,0.1)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRightLeft size={17} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>Transfer Stock</p>
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>To: {targetWH.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <X size={14} />
          </button>
        </div>

        {/* Target WH info */}
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>⚠️ Low Stock — {targetWH.name}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444' }}>{stockPct(targetWH)}%</span>
          </div>
          <div style={{ marginTop: 8, height: 5, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${stockPct(targetWH)}%`, background: '#EF4444', borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
            Current: {targetWH.current_stock.toLocaleString()} / {targetWH.capacity.toLocaleString()} units
            &nbsp;·&nbsp; Space available: {(targetWH.capacity - targetWH.current_stock).toLocaleString()} units
          </p>
        </div>

        {/* From select */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
            From Warehouse
          </label>
          <select
            value={fromId}
            onChange={e => { setFromId(e.target.value); setError(null); }}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">— Select source warehouse —</option>
            {fromOptions.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} — {w.current_stock.toLocaleString()} units ({stockPct(w)}%)
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
            Quantity {fromWH && <span style={{ color: '#94A3B8', fontWeight: 400 }}>(max {maxQty.toLocaleString()} units)</span>}
          </label>
          <input
            type="number"
            value={quantity}
            min={1} max={maxQty}
            onChange={e => { setQuantity(e.target.value); setError(null); }}
            placeholder="Enter units to transfer..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
          />
          {fromWH && quantity && (
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
              After transfer → {fromWH.name}: {(fromWH.current_stock - parseInt(quantity || '0')).toLocaleString()} units
              &nbsp;|&nbsp; {targetWH.name}: {(targetWH.current_stock + parseInt(quantity || '0')).toLocaleString()} units
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 11, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={loading || !fromId || !quantity}
            style={{ flex: 2, padding: '11px', borderRadius: 11, border: 'none', background: loading || !fromId || !quantity ? '#E2E8F0' : 'linear-gradient(135deg,#F97316,#EA580C)', fontSize: 13, fontWeight: 700, color: loading || !fromId || !quantity ? '#94A3B8' : '#fff', cursor: loading || !fromId || !quantity ? 'not-allowed' : 'pointer', boxShadow: loading || !fromId || !quantity ? 'none' : '0 4px 14px rgba(249,115,22,0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? '⏳ Transferring...' : <><ArrowRightLeft size={14} /> Confirm Transfer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManagerWarehousesPage() {
  const [selectedRegion, setSelectedRegion] = useState('Mumbai');
  const [warehouses,     setWarehouses]     = useState<WH[]>([]);
  const [transfers,      setTransfers]      = useState<StockTransfer[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [transferTarget, setTransferTarget] = useState<WH | null>(null);
  const [successMsg,     setSuccessMsg]     = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [whs, txns] = await Promise.all([
      getWarehousesByRegion(selectedRegion),
      getRecentTransfers(),
    ]);
    setWarehouses(whs);
    setTransfers(txns);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [selectedRegion]);

  const handleTransferSuccess = () => {
    setTransferTarget(null);
    setSuccessMsg('✅ Stock transfer successful!');
    setTimeout(() => setSuccessMsg(null), 3000);
    loadData();
  };

  // Summary stats
  const totalStock    = warehouses.reduce((s, w) => s + w.current_stock, 0);
  const totalCapacity = warehouses.reduce((s, w) => s + w.capacity, 0);
  const criticalWHs   = warehouses.filter(w => stockPct(w) < 30);
  const lowWHs        = warehouses.filter(w => stockPct(w) >= 30 && stockPct(w) < 60);
  const healthyWHs    = warehouses.filter(w => stockPct(w) >= 60);

  return (
    <div className="animate-fade-in-up" style={{ width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(249,115,22,0.08)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Warehouse size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>Regional Warehouses</h1>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>
              Select a region to view warehouses and manage stock transfers
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── Region Selector ── */}
      <div style={{ ...card, marginBottom: 24, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <MapPin size={15} color="#F97316" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Select Region</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {REGIONS.map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: selectedRegion === region ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#F8FAFC',
                color:      selectedRegion === region ? '#fff'    : '#64748B',
                border:     selectedRegion === region ? 'none'    : '1px solid #E2E8F0',
                boxShadow:  selectedRegion === region ? '0 4px 14px rgba(249,115,22,0.28)' : 'none',
              }}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* ── Success Message ── */}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 13, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* ── Summary Stats ── */}
      {!loading && warehouses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { val: warehouses.length,                          label: 'Total Warehouses', color: '#F97316', icon: <Warehouse size={16} />       },
            { val: `${Math.round((totalStock/totalCapacity)*100)}%`, label: 'Region Stock %', color: '#3B82F6', icon: <Package size={16} />       },
            { val: healthyWHs.length,                          label: 'Healthy',          color: '#10B981', icon: <CheckCircle size={16} />     },
            { val: lowWHs.length,                              label: 'Low Stock',        color: '#F59E0B', icon: <TrendingDown size={16} />    },
            { val: criticalWHs.length,                         label: 'Critical',         color: '#EF4444', icon: <AlertTriangle size={16} />   },
          ].map((s, i) => (
            <div key={s.label}
              style={{ ...card, textAlign: 'center', padding: '18px 14px', animationDelay: `${i * 60}ms` }}
              onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.boxShadow = '0 12px 28px rgba(0,0,0,0.07)'; d.style.borderColor = `${s.color}33`; }}
              onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; d.style.borderColor = '#E2E8F0'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>{s.icon}</div>
              <p style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.val}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }}>
            <RefreshCw size={18} color="white" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 500 }}>Loading warehouses...</p>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {/* ── Warehouse Cards ── */}
      {!loading && warehouses.length > 0 && (
        <>
          {/* Critical Alert Banner */}
          {criticalWHs.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle size={18} color="#EF4444" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 2 }}>
                  {criticalWHs.length} Critical Warehouse{criticalWHs.length > 1 ? 's' : ''} in {selectedRegion}!
                </p>
                <p style={{ fontSize: 12, color: '#94A3B8' }}>
                  {criticalWHs.map(w => w.name).join(', ')} — Stock below 30%. Immediate transfer recommended.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
            {warehouses.map((wh, idx) => {
              const pct = stockPct(wh);
              const col = stockColor(pct);
              const lbl = stockLabel(pct);
              return (
                <div
                  key={wh.id}
                  className="animate-fade-in-up"
                  style={{ ...card, animationDelay: `${idx * 80}ms`, border: `1px solid ${stockBorder(pct)}`, background: stockBg(pct) }}
                  onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-4px)'; d.style.boxShadow = `0 12px 28px ${col}22`; }}
                  onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = 'none'; }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: `${col}18`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Warehouse size={17} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', lineHeight: 1, marginBottom: 3 }}>{wh.name}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8' }}>{wh.region} Region</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: `${col}15`, color: col, border: `1px solid ${col}30`, whiteSpace: 'nowrap' }}>
                      {lbl}
                    </span>
                  </div>

                  {/* Stock Numbers */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: col }}>{pct}%</span>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{wh.current_stock.toLocaleString()} units</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>of {wh.capacity.toLocaleString()} capacity</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: 8, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: pct >= 60
                        ? 'linear-gradient(90deg,#10B981,#34D399)'
                        : pct >= 30
                        ? 'linear-gradient(90deg,#F59E0B,#FCD34D)'
                        : 'linear-gradient(90deg,#EF4444,#F87171)',
                      borderRadius: 99, transition: 'width 1s ease',
                    }} />
                  </div>

                  {/* Space Available */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Space available</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                      {(wh.capacity - wh.current_stock).toLocaleString()} units
                    </span>
                  </div>

                  {/* Transfer Button */}
                  {pct < 60 ? (
                    <button
                      onClick={() => setTransferTarget(wh)}
                      style={{
                        width: '100%', padding: '10px', borderRadius: 11, border: 'none',
                        background: pct < 30
                          ? 'linear-gradient(135deg,#EF4444,#DC2626)'
                          : 'linear-gradient(135deg,#F59E0B,#D97706)',
                        color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: pct < 30 ? '0 4px 14px rgba(239,68,68,0.3)' : '0 4px 14px rgba(245,158,11,0.3)',
                      }}
                    >
                      <ArrowRightLeft size={14} />
                      {pct < 30 ? '🚨 Request Emergency Transfer' : '⚠️ Transfer Stock Here'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setTransferTarget(wh)}
                      style={{
                        width: '100%', padding: '10px', borderRadius: 11,
                        border: '1px solid #E2E8F0', background: '#F8FAFC',
                        color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <ArrowRightLeft size={14} /> Transfer Stock
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Recent Transfers ── */}
      {transfers.length > 0 && (
        <div style={{ ...card, padding: '20px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 16px' }}>
            <Clock size={15} color="#F97316" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Recent Transfers</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '2px 10px', marginLeft: 'auto' }}>
              Last {transfers.length}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {['From', 'To', 'Quantity', 'By', 'Status', 'Time'].map(h => (
                    <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transfers.map((t, i) => (
                  <tr key={t.id}
                    style={{ borderBottom: i < transfers.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFF'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>{t.from_warehouse}</td>
                    <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ChevronRight size={12} color="#94A3B8" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{t.to_warehouse}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, color: '#F97316', whiteSpace: 'nowrap' }}>
                      {t.quantity.toLocaleString()} units
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: '#64748B' }}>{t.initiated_by}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 7, background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                        ✓ {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Transfer Modal ── */}
      {transferTarget && (
        <TransferModal
          warehouses={warehouses}
          targetWH={transferTarget}
          onClose={() => setTransferTarget(null)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
}
