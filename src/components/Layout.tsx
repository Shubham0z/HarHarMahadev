import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu, X, Home, BarChart3, Search, MapPin, Factory,
    AlertTriangle, FlaskConical, IndianRupee, FileText,
    Zap, ChevronRight, LogOut, Lock,
} from 'lucide-react';
import { signOut, getSession, getUserPermissions } from '../lib/supabase';
import type { AllowedUser } from '../lib/supabase';

const NAVBAR_H  = 64;
const SIDEBAR_W = 260;

const navItems = [
    { href: '/',          icon: Home,          label: 'Home',         section: 'main',    page: 'home'      },
    { href: '/dashboard', icon: BarChart3,      label: 'Dashboard',    section: 'main',    page: 'dashboard' },
    { href: '/analyze',   icon: Search,         label: 'Run Analysis', section: 'main',    page: 'analyze'   },
    { href: '/routes',    icon: MapPin,         label: 'Routes',       section: 'modules', page: 'routes'    },
    { href: '/suppliers', icon: Factory,        label: 'Suppliers',    section: 'modules', page: 'suppliers' },
    { href: '/risk',      icon: AlertTriangle,  label: 'Risk Center',  section: 'modules', page: 'risk'      },
    { href: '/scenarios', icon: FlaskConical,   label: 'Scenario Lab', section: 'modules', page: 'scenarios' },
    { href: '/cost',      icon: IndianRupee,    label: 'Cost Impact',  section: 'modules', page: 'cost'      },
    { href: '/reports',   icon: FileText,       label: 'Reports',      section: 'reports', page: 'reports'   },
];

const sections: { key: string; label: string }[] = [
    { key: 'main',    label: 'Main'    },
    { key: 'modules', label: 'Modules' },
    { key: 'reports', label: 'Reports' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen,  setSidebarOpen]  = useState(true);
    const [scrolled,     setScrolled]     = useState(false);
    const [isMobile,     setIsMobile]     = useState(false);
    const [avatarOpen,   setAvatarOpen]   = useState(false);
    const [permissions,  setPermissions]  = useState<AllowedUser['page_permissions'] | null>(null);
    const [userEmail,    setUserEmail]    = useState('');
    const overlayRef  = useRef<HTMLDivElement>(null);
    const avatarRef   = useRef<HTMLDivElement>(null);
    const location    = useLocation();
    const navigate    = useNavigate();

    /* ── Fetch permissions on mount ── */
    useEffect(() => {
        getSession().then(async s => {
            if (s?.user?.email) {
                setUserEmail(s.user.email);
                const perms = await getUserPermissions(s.user.email);
                setPermissions(perms);
            }
        });
    }, []);

    /* scroll shadow */
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    /* mobile detect */
    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    /* close sidebar on route change (mobile) */
    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, [location.pathname, isMobile]);

    /* close avatar dropdown on outside click */
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
                setAvatarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = async () => {
        setAvatarOpen(false);
        await signOut();
        navigate('/login');
    };

    const pageTitle = navItems.find(n => n.href === location.pathname)?.label ?? 'SupplyAI';

    // ── Check if a page is allowed
    const isAllowed = (page: string): boolean => {
        if (!permissions) return true; // permissions load nahi hue toh default show karo
        return permissions[page as keyof AllowedUser['page_permissions']] !== false;
    };

    // Avatar initials from email
    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'S';

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>

            {/* ══ NAVBAR ══ */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0,
                height: NAVBAR_H, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px',
                background: scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid #E2E8F0',
                boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.07)' : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
            }}>

                {/* Left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                        onClick={() => setSidebarOpen(p => !p)}
                        style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            border: '1px solid #E2E8F0', background: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#475569', cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.background = 'rgba(249,115,22,0.06)';
                            b.style.borderColor = 'rgba(249,115,22,0.3)';
                            b.style.color = '#F97316';
                        }}
                        onMouseLeave={e => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.background = 'transparent';
                            b.style.borderColor = '#E2E8F0';
                            b.style.color = '#475569';
                        }}
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <div className="animate-glow-pulse" style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: 'linear-gradient(135deg, #F97316, #EA580C)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 14px rgba(249,115,22,0.28)',
                        }}>
                            <Zap size={18} color="white" />
                        </div>
                        <span style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
                            Supply<span style={{ color: '#F97316' }}>AI</span>
                        </span>
                        <span style={{
                            fontSize: 10, fontWeight: 800, letterSpacing: '0.8px',
                            background: 'linear-gradient(135deg, #F97316, #3B82F6)',
                            color: 'white', padding: '2px 7px', borderRadius: 6,
                        }}>
                            PRO
                        </span>
                    </Link>

                    {!isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                            <ChevronRight size={14} color="#CBD5E1" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>
                                {pageTitle}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {!isMobile && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                            borderRadius: 99, padding: '6px 14px',
                            fontSize: 12, color: '#475569', fontWeight: 500,
                        }}>
                            <span className="animate-pulse-dot" style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: '#10B981', display: 'inline-block',
                                boxShadow: '0 0 5px rgba(16,185,129,0.5)',
                            }} />
                            6 Agents Live
                        </div>
                    )}

                    {!isMobile && isAllowed('analyze') && (
                        <Link to="/analyze" style={{ textDecoration: 'none' }}>
                            <button className="btn-glow" style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 14px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                                color: '#fff', border: 'none', cursor: 'pointer',
                                fontSize: 12, fontWeight: 700,
                                boxShadow: '0 3px 12px rgba(249,115,22,0.25)',
                                transition: 'all 0.2s ease',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                            >
                                <Search size={13} /> Analyze
                            </button>
                        </Link>
                    )}

                    {/* Avatar */}
                    <div ref={avatarRef} style={{ position: 'relative' }}>
                        <div
                            onClick={() => setAvatarOpen(p => !p)}
                            style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #F97316, #3B82F6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 800, fontSize: 14, flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(249,115,22,0.3)', cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                                outline: avatarOpen ? '2px solid rgba(249,115,22,0.4)' : 'none',
                                outlineOffset: 2,
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                        >
                            {initials}
                        </div>

                        {avatarOpen && (
                            <div style={{
                                position: 'absolute', top: 44, right: 0,
                                background: '#fff', border: '1px solid #E2E8F0',
                                borderRadius: 12, padding: 6,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                minWidth: 180, zIndex: 100,
                            }}>
                                {/* Email display */}
                                <div style={{
                                    padding: '8px 12px 10px', borderBottom: '1px solid #F1F5F9', marginBottom: 4,
                                }}>
                                    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Signed in as</p>
                                    <p style={{
                                        fontSize: 12, fontWeight: 700, color: '#0F172A',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        maxWidth: 160,
                                    }}>{userEmail}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '9px 12px', borderRadius: 8,
                                        background: 'transparent', border: 'none',
                                        color: '#EF4444', fontSize: 13, fontWeight: 600,
                                        cursor: 'pointer', transition: 'background 0.15s ease',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                >
                                    <LogOut size={14} /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ══ MOBILE OVERLAY ══ */}
            {isMobile && sidebarOpen && (
                <div
                    ref={overlayRef}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 39,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(2px)',
                    }}
                />
            )}

            {/* ══ SIDEBAR ══ */}
            <aside style={{
                position: 'fixed', top: NAVBAR_H, left: 0,
                width: SIDEBAR_W,
                height: `calc(100vh - ${NAVBAR_H}px)`,
                zIndex: 40, background: '#FFFFFF',
                borderRight: '1px solid #E2E8F0',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px 12px 20px',
                overflowY: 'auto',
                transform: sidebarOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none',
            }}>

                <div>
                    {sections.map(sec => {
                        const items = navItems.filter(n => n.section === sec.key);
                        return (
                            <div key={sec.key} style={{ marginBottom: 20 }}>
                                <p style={{
                                    fontSize: 10, fontWeight: 700, color: '#CBD5E1',
                                    letterSpacing: '1.5px', textTransform: 'uppercase',
                                    marginBottom: 6, paddingLeft: 12,
                                }}>
                                    {sec.label}
                                </p>
                                {items.map((item, idx) => {
                                    const active  = location.pathname === item.href;
                                    const allowed = isAllowed(item.page);
                                    const Icon    = item.icon;
                                    return (
                                        <Link
                                            to={allowed ? item.href : '#'}
                                            key={item.href}
                                            onClick={e => !allowed && e.preventDefault()}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <div
                                                className="animate-slide-in-left"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 11,
                                                    padding: '9px 12px', borderRadius: 12, marginBottom: 2,
                                                    position: 'relative',
                                                    cursor: allowed ? 'pointer' : 'not-allowed',
                                                    animationDelay: `${idx * 30}ms`,
                                                    background: active ? 'rgba(249,115,22,0.07)' : 'transparent',
                                                    color: active ? '#F97316' : allowed ? '#64748B' : '#CBD5E1',
                                                    fontWeight: active ? 700 : 500,
                                                    fontSize: 13,
                                                    opacity: allowed ? 1 : 0.5,
                                                    transition: 'all 0.18s ease',
                                                }}
                                                onMouseEnter={e => {
                                                    if (!active && allowed) {
                                                        const d = e.currentTarget as HTMLDivElement;
                                                        d.style.background = '#F8FAFC';
                                                        d.style.color = '#0F172A';
                                                        d.style.transform = 'translateX(3px)';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!active && allowed) {
                                                        const d = e.currentTarget as HTMLDivElement;
                                                        d.style.background = 'transparent';
                                                        d.style.color = '#64748B';
                                                        d.style.transform = 'translateX(0)';
                                                    }
                                                }}
                                            >
                                                {/* Active bar */}
                                                {active && (
                                                    <span style={{
                                                        position: 'absolute', left: 0,
                                                        top: '50%', transform: 'translateY(-50%)',
                                                        width: 3, height: 18,
                                                        background: '#F97316',
                                                        borderRadius: '0 4px 4px 0',
                                                    }} />
                                                )}

                                                {/* Icon */}
                                                <div style={{
                                                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                                    background: active ? 'rgba(249,115,22,0.1)' : '#F8FAFC',
                                                    border: `1px solid ${active ? 'rgba(249,115,22,0.2)' : '#F1F5F9'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: active ? '#F97316' : allowed ? '#94A3B8' : '#CBD5E1',
                                                    transition: 'all 0.2s ease',
                                                }}>
                                                    {allowed ? <Icon size={15} strokeWidth={active ? 2.5 : 2} /> : <Lock size={13} />}
                                                </div>

                                                <span style={{ flex: 1 }}>{item.label}</span>

                                                {/* Active dot */}
                                                {active && (
                                                    <span style={{
                                                        width: 6, height: 6, borderRadius: '50%',
                                                        background: '#F97316', flexShrink: 0,
                                                        boxShadow: '0 0 6px rgba(249,115,22,0.5)',
                                                    }} />
                                                )}

                                                {/* Lock badge */}
                                                {!allowed && (
                                                    <span style={{
                                                        fontSize: 9, fontWeight: 700,
                                                        background: '#F1F5F9', color: '#94A3B8',
                                                        padding: '2px 6px', borderRadius: 4,
                                                        letterSpacing: '0.5px',
                                                    }}>LOCKED</span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom AI status card — same as before */}
                <div>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: 8, marginBottom: 12,
                    }}>
                        {[
                            { label: 'Analyses', val: '318', color: '#F97316' },
                            { label: 'Accuracy', val: '94%', color: '#10B981' },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: '#F8FAFC', border: '1px solid #F1F5F9',
                                borderRadius: 10, padding: '8px 10px', textAlign: 'center',
                            }}>
                                <p style={{ fontSize: 14, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.val}</p>
                                <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(59,130,246,0.05))',
                        border: '1px solid rgba(249,115,22,0.15)',
                        borderRadius: 14, padding: '14px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Zap size={13} color="#F97316" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>AI Engine</span>
                            <span style={{
                                marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                                color: '#10B981', background: 'rgba(16,185,129,0.1)',
                                padding: '1px 7px', borderRadius: 99,
                            }}>LIVE</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10 }}>
                            n8n Cloud · 6 Agents active
                        </p>
                        {[
                            { name: 'Demand', pct: 94 },
                            { name: 'Route',  pct: 88 },
                            { name: 'Risk',   pct: 91 },
                        ].map(a => (
                            <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                <span style={{ fontSize: 10, color: '#94A3B8', width: 44, flexShrink: 0 }}>{a.name}</span>
                                <div style={{ flex: 1, height: 3, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${a.pct}%`,
                                        background: 'linear-gradient(90deg, #F97316, #3B82F6)',
                                        borderRadius: 99,
                                    }} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#F97316', width: 28, textAlign: 'right' }}>{a.pct}%</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                            <span className="animate-pulse-dot" style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: '#10B981',
                                boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                                display: 'inline-block',
                            }} />
                            <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ══ MAIN CONTENT ══ */}
            <main style={{
                marginLeft: (!isMobile && sidebarOpen) ? SIDEBAR_W : 0,
                marginTop: NAVBAR_H,
                minHeight: `calc(100vh - ${NAVBAR_H}px)`,
                transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
                boxSizing: 'border-box',
                padding: isMobile ? '24px 16px' : '36px 40px',
            }}>
                <div
                    key={location.pathname}
                    className="animate-fade-in-up"
                    style={{ maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto', width: '100%' }}
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
