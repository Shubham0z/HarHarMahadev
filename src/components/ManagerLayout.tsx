// src/components/ManagerLayout.tsx
import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Crown, Shield, BarChart3, Activity, Users,
  LogOut, Zap, ChevronRight, Menu, X, Warehouse,
} from 'lucide-react';

interface NavItem {
  path:  string;
  label: string;
  sub:   string;
  icon:  React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    path:  '/manager-dashboard',
    label: 'Dashboard',
    sub:   'Latest Analysis',
    icon:  <BarChart3 size={18} />,
  },
  {
    path:  '/manager-performance',
    label: 'Active Performance',
    sub:   'All Analyses Overview',
    icon:  <Activity size={18} />,
  },
  {
    path:  '/manager-users',
    label: 'Users',
    sub:   'Manage Access',
    icon:  <Users size={18} />,
  },
  // ✅ NEW
  {
    path:  '/manager-warehouses',
    label: 'Warehouses',
    sub:   'Regional Stock & Transfers',
    icon:  <Warehouse size={18} />,
  },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('manager_auth');
    localStorage.removeItem('manager_auth');
    navigate('/', { replace: true });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'inherit' }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        width: collapsed ? 72 : 240,
        minHeight: '100vh',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0, zIndex: 40,
        boxShadow: '2px 0 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>

        {/* ── Logo Row ── */}
        <div style={{
          padding: collapsed ? '18px 0' : '18px 20px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10, flexShrink: 0, minHeight: 64,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 160,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
            }}>
              <Zap size={16} color="white" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                Supply<span style={{ color: '#F97316' }}>AI</span>
              </p>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '1px', marginTop: 2 }}>
                MANAGER PORTAL
              </p>
            </div>
          </div>

          {collapsed && (
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
            }}>
              <Zap size={16} color="white" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(prev => !prev)}
            style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0',
              borderRadius: 8, width: 28, height: 28,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#64748B', flexShrink: 0, transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#F1F5F9'; b.style.borderColor = '#CBD5E1'; b.style.color = '#0F172A'; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#F8FAFC'; b.style.borderColor = '#E2E8F0'; b.style.color = '#64748B'; }}
          >
            {collapsed ? <Menu size={14} /> : <X size={14} />}
          </button>
        </div>

        {/* ── Manager Badge ── */}
        <div style={{
          margin: collapsed ? '14px 8px 6px' : '14px 14px 6px',
          padding: collapsed ? '10px 0' : '10px 14px',
          borderRadius: 12,
          background: 'rgba(249,115,22,0.06)',
          border: '1px solid rgba(249,115,22,0.18)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 10,
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #F97316, #FBBF24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Crown size={14} color="white" />
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#F97316', lineHeight: 1 }}>Manager</p>
                <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Full Access</p>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B98166', flexShrink: 0 }} />
            </>
          )}
        </div>

        {/* ── Section Label ── */}
        {!collapsed && (
          <p style={{
            fontSize: 9, fontWeight: 700, color: '#94A3B8',
            letterSpacing: '1.2px', padding: '10px 20px 4px',
            textTransform: 'uppercase',
          }}>Navigation</p>
        )}

        {/* ── Nav Items ── */}
        <nav style={{
          flex: 1,
          padding: collapsed ? '6px 8px' : '4px 10px',
          display: 'flex', flexDirection: 'column', gap: 3,
          overflowY: 'auto',
        }}>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : 12,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '12px 0' : '10px 14px',
                  borderRadius: 12,
                  background: isActive ? 'rgba(249,115,22,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(249,115,22,0.22)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, borderRadius: 99, background: '#F97316',
                  }} />
                )}
                <span style={{ color: isActive ? '#F97316' : '#94A3B8', flexShrink: 0, transition: 'color 0.2s' }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#F97316' : '#374151',
                      lineHeight: 1, marginBottom: 2,
                    }}>{item.label}</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 400 }}>{item.sub}</p>
                  </div>
                )}
                {!collapsed && isActive && <ChevronRight size={12} color="#F97316" />}
              </Link>
            );
          })}
        </nav>

        {/* ── Exit Button ── */}
        <div style={{ padding: collapsed ? '14px 8px' : '14px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Exit Manager' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '10px 0' : '10px 14px',
              borderRadius: 10,
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.15)',
              color: '#EF4444', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(239,68,68,0.12)'; b.style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(239,68,68,0.05)'; b.style.borderColor = 'rgba(239,68,68,0.15)'; }}
          >
            <LogOut size={16} />
            {!collapsed && <span>Exit Manager</span>}
          </button>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main style={{ flex: 1, minWidth: 0, overflow: 'auto', background: '#F8FAFC' }}>
        <div style={{
          height: 48, background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center',
          padding: '0 28px', gap: 8,
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <Shield size={13} color="#F97316" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F97316' }}>Manager Portal</span>
          <ChevronRight size={12} color="#CBD5E1" />
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
            {NAV_ITEMS.find(n => n.path === location.pathname)?.label ?? 'Overview'}
          </span>
        </div>
        <div style={{ padding: '28px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
