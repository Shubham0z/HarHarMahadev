import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, BarChart3, Search, Menu, X, Zap, ChevronRight,
  AlertTriangle, MapPin, Factory, IndianRupee, FlaskConical,
} from 'lucide-react';

const NAV = [
  { href: '/',           icon: Home,           label: 'Home'      },
  { href: '/dashboard',  icon: BarChart3,       label: 'Dashboard' },
  { href: '/analyze',    icon: Search,          label: 'Analyze'   },
  { href: '/routes',     icon: MapPin,          label: 'Routes'    },
  { href: '/risk',       icon: AlertTriangle,   label: 'Risk'      },
  { href: '/suppliers',  icon: Factory,         label: 'Suppliers' },
  { href: '/costs',      icon: IndianRupee,     label: 'Costs'     },
  { href: '/scenarios',  icon: FlaskConical,    label: 'Scenarios' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open,   setOpen]   = useState(true);
  const [mobile, setMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const check = () => {
      const isMob = window.innerWidth < 768;
      setMobile(isMob);
      if (isMob) setOpen(false);
      else setOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const W = open ? 256 : 68;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: W, minHeight: '100vh', background: '#fff',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width .25s cubic-bezier(.16,1,.3,1)',
        overflow: 'hidden', flexShrink: 0,
        position: mobile ? 'fixed' : 'relative',
        zIndex: mobile ? 100 : 1,
        boxShadow: mobile && open ? '4px 0 24px rgba(0,0,0,.08)' : 'none',
      }}>

        {/* Logo */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center',
          padding: open ? '0 16px' : '0', justifyContent: open ? 'space-between' : 'center',
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          {open && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249,115,22,.3)',
              }}>
                <Zap size={16} color="#fff" fill="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>SupplyChain</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>AI Platform</p>
              </div>
            </div>
          )}
          <button onClick={() => setOpen(p => !p)} style={{
            width: 32, height: 32, borderRadius: 9,
            border: '1px solid var(--border)', background: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-3)', transition: 'all .2s', cursor: 'pointer',
          }}
            onMouseEnter={e => { const d = e.currentTarget; d.style.background='var(--primary)'; d.style.color='#fff'; d.style.borderColor='var(--primary)'; }}
            onMouseLeave={e => { const d = e.currentTarget; d.style.background='var(--bg)'; d.style.color='var(--text-3)'; d.style.borderColor='var(--border)'; }}
          >
            {open ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = location.pathname === href;
            return (
              <Link key={href} to={href} onClick={() => mobile && setOpen(false)} style={{
                display: 'flex', alignItems: 'center',
                gap: 10, padding: open ? '10px 12px' : '10px',
                borderRadius: 12, textDecoration: 'none',
                justifyContent: open ? 'flex-start' : 'center',
                background: active ? 'rgba(249,115,22,.08)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-2)',
                border: active ? '1px solid rgba(249,115,22,.2)' : '1px solid transparent',
                fontWeight: active ? 700 : 500,
                fontSize: 13, transition: 'all .18s ease',
              }}
                onMouseEnter={e => { if (!active) { const d = e.currentTarget as HTMLAnchorElement; d.style.background='var(--bg)'; d.style.color='var(--text)'; } }}
                onMouseLeave={e => { if (!active) { const d = e.currentTarget as HTMLAnchorElement; d.style.background='transparent'; d.style.color='var(--text-2)'; } }}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                {open && <span style={{ flex: 1 }}>{label}</span>}
                {open && active && <ChevronRight size={13} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom tag */}
        {open && (
          <div style={{
            margin: 12, padding: '12px 14px',
            background: 'rgba(249,115,22,.04)',
            border: '1px solid rgba(249,115,22,.12)',
            borderRadius: 14,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 3 }}>🚀 AI-Powered</p>
            <p style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.5 }}>6 agents analyzing your supply chain in real-time</p>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {mobile && open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
          zIndex: 99, backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Navbar */}
        <header style={{
          height: 60, background: '#fff', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 20px',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {mobile && (
              <button onClick={() => setOpen(true)} style={{
                width: 34, height: 34, borderRadius: 9,
                border: '1px solid var(--border)', background: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 4, cursor: 'pointer',
              }}>
                <Menu size={15} color="var(--text-2)" />
              </button>
            )}
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
              background: 'var(--bg)', border: '1px solid var(--border)',
              padding: '4px 12px', borderRadius: 99,
            }}>
              {NAV.find(n => n.href === location.pathname)?.label ?? 'SupplyChain AI'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 99,
              background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)',
              fontSize: 11, fontWeight: 600, color: 'var(--success)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 5px var(--success)' }} />
              Live
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff',
              boxShadow: '0 2px 8px rgba(249,115,22,.3)',
            }}>SC</div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px 24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
