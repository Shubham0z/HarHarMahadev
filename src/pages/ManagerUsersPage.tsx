import { useEffect, useState } from 'react';
import {
  Users, Mail, Shield, CheckCircle, XCircle,
  ChevronRight, Search, RefreshCw, Save, ArrowLeft,
  Home, BarChart3, MapPin, Factory, AlertTriangle,
  FlaskConical, IndianRupee, FileText, User,
} from 'lucide-react';
import { getAllUsers, updateUserPermissions } from '../lib/supabase';
import type { AllowedUser } from '../lib/supabase';

// ── Page config — icon + label + key
const PAGE_LIST: { key: keyof AllowedUser['page_permissions']; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'home',      label: 'Home',        icon: <Home size={15} />,          color: '#3B82F6' },
  { key: 'dashboard', label: 'Dashboard',   icon: <BarChart3 size={15} />,     color: '#8B5CF6' },
  { key: 'analyze',   label: 'Run Analysis',icon: <Search size={15} />,        color: '#F97316' },
  { key: 'routes',    label: 'Routes',      icon: <MapPin size={15} />,        color: '#10B981' },
  { key: 'suppliers', label: 'Suppliers',   icon: <Factory size={15} />,       color: '#06B6D4' },
  { key: 'risk',      label: 'Risk Center', icon: <AlertTriangle size={15} />, color: '#EF4444' },
  { key: 'scenarios', label: 'Scenario Lab',icon: <FlaskConical size={15} />,  color: '#F59E0B' },
  { key: 'cost',      label: 'Cost Impact', icon: <IndianRupee size={15} />,   color: '#84CC16' },
  { key: 'reports',   label: 'Reports',     icon: <FileText size={15} />,      color: '#EC4899' },
];

const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#94A3B8',
  letterSpacing: '1.2px', textTransform: 'uppercase',
};

export default function ManagerUsersPage() {
  const [users,         setUsers]         = useState<AllowedUser[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedUser,  setSelectedUser]  = useState<AllowedUser | null>(null);
  const [permissions,   setPermissions]   = useState<AllowedUser['page_permissions'] | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [saveMsg,       setSaveMsg]       = useState<'success' | 'error' | null>(null);
  const [search,        setSearch]        = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  }

  function handleSelectUser(user: AllowedUser) {
    setSelectedUser(user);
    setPermissions({ ...user.page_permissions });
    setSaveMsg(null);
  }

  function handleToggle(key: keyof AllowedUser['page_permissions']) {
    if (!permissions) return;
    setPermissions(prev => prev ? { ...prev, [key]: !prev[key] } : prev);
  }

  // ── UPDATED: email use ho raha hai id ki jagah
  async function handleSave() {
    if (!selectedUser || !permissions) return;
    setSaving(true);
    setSaveMsg(null);
    const { error } = await updateUserPermissions(
      selectedUser.email,      // ← email
      permissions
    );
    setSaving(false);
    if (error) {
      setSaveMsg('error');
    } else {
      setSaveMsg('success');
      setUsers(prev =>
        prev.map(u =>
          u.email === selectedUser.email   // ← email
            ? { ...u, page_permissions: permissions }
            : u
        )
      );
      setSelectedUser(prev =>
        prev ? { ...prev, page_permissions: permissions } : prev
      );
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const allowedCount = (u: AllowedUser) =>
    Object.values(u.page_permissions ?? {}).filter(Boolean).length;

  return (
    <div style={{ width: '100%' }}>

      {/* ══ HEADER ══ */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: 'rgba(249,115,22,0.08)', color: '#F97316',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>
              User Management
            </h1>
            <p style={{ fontSize: 14, color: '#94A3B8' }}>
              Select a user to manage their page access permissions.
            </p>
          </div>
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedUser ? '1fr 1.4fr' : '1fr',
        gap: 24, alignItems: 'start',
      }}>

        {/* ── LEFT: USER LIST ── */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0',
          borderRadius: 20, padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={14} color="#F97316" />
              <span style={sectionTitle}>All Users</span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#fff',
                background: '#F97316', padding: '1px 8px', borderRadius: 99,
              }}>{users.length}</span>
            </div>
            <button
              onClick={fetchUsers}
              style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: 8, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748B',
              }}
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={13} color="#94A3B8" style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            }} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 32px',
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: 10, fontSize: 13, color: '#0F172A',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* User list */}
          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              <RefreshCw size={20} style={{ margin: '0 auto 8px', display: 'block' }} className="animate-spin" />
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No users found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(user => {
                const isSelected = selectedUser?.email === user.email;
                const count = allowedCount(user);
                const initials = user.email.slice(0, 2).toUpperCase();
                return (
                  <div
                    key={user.email}
                    onClick={() => handleSelectUser(user)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isSelected ? 'rgba(249,115,22,0.3)' : '#F1F5F9',
                      background: isSelected ? 'rgba(249,115,22,0.05)' : '#F8FAFC',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        const d = e.currentTarget as HTMLDivElement;
                        d.style.background = '#F1F5F9';
                        d.style.borderColor = '#E2E8F0';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        const d = e.currentTarget as HTMLDivElement;
                        d.style.background = '#F8FAFC';
                        d.style.borderColor = '#F1F5F9';
                      }
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: isSelected
                        ? 'linear-gradient(135deg, #F97316, #EA580C)'
                        : 'linear-gradient(135deg, #E2E8F0, #CBD5E1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? '#fff' : '#64748B',
                      fontWeight: 800, fontSize: 13,
                      boxShadow: isSelected ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}>
                      {initials}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 600,
                        color: isSelected ? '#F97316' : '#0F172A',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {user.email}
                      </p>
                      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        {count} / {PAGE_LIST.length} pages allowed
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{
                        width: 48, height: 4, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(count / PAGE_LIST.length) * 100}%`,
                          background: count === PAGE_LIST.length
                            ? '#10B981' : count === 0 ? '#EF4444' : '#F97316',
                          borderRadius: 99, transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <ChevronRight size={12} color={isSelected ? '#F97316' : '#CBD5E1'} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: PERMISSIONS PANEL ── */}
        {selectedUser && permissions && (
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: 20, padding: 24,
          }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => { setSelectedUser(null); setPermissions(null); }}
                style={{
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                  borderRadius: 8, width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748B', flexShrink: 0,
                }}
              >
                <ArrowLeft size={13} />
              </button>

              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14,
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              }}>
                {selectedUser.email.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 14, fontWeight: 700, color: '#0F172A',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {selectedUser.email}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  {Object.values(permissions).filter(Boolean).length} / {PAGE_LIST.length} pages enabled
                </p>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button
                onClick={() => {
                  const all = {} as AllowedUser['page_permissions'];
                  PAGE_LIST.forEach(p => (all[p.key] = true));
                  setPermissions(all);
                }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10B981', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <CheckCircle size={13} /> Allow All
              </button>
              <button
                onClick={() => {
                  const none = {} as AllowedUser['page_permissions'];
                  PAGE_LIST.forEach(p => (none[p.key] = false));
                  setPermissions(none);
                }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <XCircle size={13} /> Revoke All
              </button>
            </div>

            {/* Page toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <p style={{ ...sectionTitle, marginBottom: 4 }}>Page Access</p>
              {PAGE_LIST.map(page => {
                const isOn = permissions[page.key] ?? false;
                return (
                  <div
                    key={page.key}
                    onClick={() => handleToggle(page.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isOn ? `${page.color}33` : '#F1F5F9',
                      background: isOn ? `${page.color}08` : '#F8FAFC',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      const d = e.currentTarget as HTMLDivElement;
                      d.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={e => {
                      const d = e.currentTarget as HTMLDivElement;
                      d.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: isOn ? `${page.color}15` : '#F1F5F9',
                      border: `1px solid ${isOn ? page.color + '30' : '#E2E8F0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isOn ? page.color : '#CBD5E1',
                      transition: 'all 0.2s ease',
                    }}>
                      {page.icon}
                    </div>

                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: isOn ? 600 : 500,
                      color: isOn ? '#0F172A' : '#94A3B8',
                      transition: 'all 0.2s ease',
                    }}>
                      {page.label}
                    </span>

                    <div style={{
                      width: 44, height: 24, borderRadius: 99, flexShrink: 0,
                      background: isOn ? page.color : '#E2E8F0',
                      position: 'relative', transition: 'background 0.25s ease',
                      boxShadow: isOn ? `0 0 10px ${page.color}44` : 'none',
                    }}>
                      <div style={{
                        position: 'absolute', top: 3,
                        left: isOn ? 23 : 3,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '13px 0',
                borderRadius: 14, fontSize: 14, fontWeight: 700,
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: saving ? '#F1F5F9' : 'linear-gradient(135deg, #F97316, #EA580C)',
                color: saving ? '#94A3B8' : '#fff',
                boxShadow: saving ? 'none' : '0 4px 20px rgba(249,115,22,0.32)',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
            >
              {saving
                ? <><RefreshCw size={15} className="animate-spin" /> Saving...</>
                : <><Save size={15} /> Save Permissions</>
              }
            </button>

            {/* Save feedback */}
            {saveMsg === 'success' && (
              <div style={{
                marginTop: 12, padding: '10px 14px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#10B981',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle size={13} /> Permissions saved successfully!
              </div>
            )}
            {saveMsg === 'error' && (
              <div style={{
                marginTop: 12, padding: '10px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#EF4444',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <XCircle size={13} /> Failed to save. Try again.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
