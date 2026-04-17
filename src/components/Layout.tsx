import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Menu, X, Home, BarChart3, Search, MapPin, Factory,
    AlertTriangle, FlaskConical, IndianRupee, FileText,
    Zap, ChevronRight, LogOut,
} from 'lucide-react';

const NAVBAR_H = 60;
const SIDEBAR_W = 256;
const SIDEBAR_W_COLLAPSED = 68;

const navItems = [
    { href: '/', icon: Home, label: 'Home', section: 'main' },
    { href: '/dashboard', icon: BarChart3, label: 'Dashboard', section: 'main' },
    { href: '/analyze', icon: Search, label: 'Run Analysis', section: 'main' },
    { href: '/routes', icon: MapPin, label: 'Routes', section: 'modules' },
    { href: '/suppliers', icon: Factory, label: 'Suppliers', section: 'modules' },
    { href: '/risk', icon: AlertTriangle, label: 'Risk Center', section: 'modules' },
    { href: '/scenarios', icon: FlaskConical, label: 'Scenario Lab', section: 'modules' },
    { href: '/cost', icon: IndianRupee, label: 'Cost Impact', section: 'modules' },
    { href: '/reports', icon: FileText, label: 'Reports', section: 'reports' },
];

const sections: { key: string; label: string }[] = [
    { key: 'main', label: 'Main' },
    { key: 'modules', label: 'Modules' },
    { key: 'reports', label: 'Reports' },
];

const USER_EMAIL = 'admin@supplyai.com';
const USER_INITIALS = 'AD';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

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

    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, [location.pathname, isMobile]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
                setAvatarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = () => {
        setAvatarOpen(false);
        window.location.href = '/';
    };

    const pageTitle = navItems.find(n => n.href === location.pathname)?.label ?? 'SupplyAI';

    const sidebarWidth = isMobile
        ? (sidebarOpen ? SIDEBAR_W : 0)
        : (sidebarOpen ? SIDEBAR_W : SIDEBAR_W_COLLAPSED);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>

            {/* MOBILE OVERLAY */}
            {isMobile && sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 99,
                        background: 'rgba(0,0,0,0.35)',
                        backdropFilter: 'blur(2px)',
                    }}
                />
            )}

            {/* SIDEBAR */}
            <aside style={{
                width: sidebarWidth,
                minHeight: '100vh',
                background: '#fff',
                borderRight: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.25s cubic-bezier(.16,1,.3,1)',
                overflow: 'hidden',
                flexShrink: 0,
                position: isMobile ? 'fixed' : 'relative',
                zIndex: isMobile ? 100 : 1,
                boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.08)' : 'none',
            }}>

                {/* Logo / Toggle */}
                <div style={{
                    height: NAVBAR_H,
                    display: 'flex',
                    alignItems: 'center',
                    padding: sidebarOpen ? '0 16px' : '0',
                    justifyContent: sidebarOpen ? 'space-between' : 'center',
                    borderBottom: '1px solid #E2E8F0',
                    flexShrink: 0,
                }}>
                    {sidebarOpen && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                            }}>
                                <Zap size={16} color="#fff" fill="#fff" />
                            </div>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1, margin: 0 }}>
                                    Supply<span style={{ color: '#F97316' }}>AI</span>
                                </p>
                                <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, margin: 0 }}>AI Platform</p>
                            </div>
                        </div>
                    )}

                    {!isMobile && (
                        <button
                            onClick={() => setSidebarOpen(p => !p)}
                            style={{
                                width: 32, height: 32, borderRadius: 9,
                                border: '1px solid #E2E8F0', background: '#F8FAFC',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#94A3B8', transition: 'all 0.2s', cursor: 'pointer',
                            }}
                            onMouseEnter={e => {
                                const b = e.currentTarget;
                                b.style.background = '#F97316';
                                b.style.color = '#fff';
                                b.style.borderColor = '#F97316';
                            }}
                            onMouseLeave={e => {
                                const b = e.currentTarget;
                                b.style.background = '#F8FAFC';
                                b.style.color = '#94A3B8';
                                b.style.borderColor = '#E2E8F0';
                            }}
                        >
                            {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
                        </button>
                    )}
                </div>

                {/* Nav Items */}
                <nav style={{
                    flex: 1,
                    padding: sidebarOpen ? '20px 8px' : '16px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}>
                    {sections.map(sec => {
                        const items = navItems.filter(n => n.section === sec.key);
                        return (
                            <div key={sec.key} style={{ marginBottom: sidebarOpen ? 20 : 16 }}>
                                {sidebarOpen && (
                                    <p style={{
                                        fontSize: 10, fontWeight: 700, color: '#CBD5E1',
                                        letterSpacing: '1.5px', textTransform: 'uppercase',
                                        marginBottom: 6, paddingLeft: 12,
                                        whiteSpace: 'nowrap', margin: '0 0 6px 0',
                                    }}>
                                        {sec.label}
                                    </p>
                                )}
                                {!sidebarOpen && (
                                    <div style={{
                                        height: 1, background: '#F1F5F9',
                                        margin: '6px 8px 10px',
                                    }} />
                                )}
                                {items.map(item => {
                                    const active = location.pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            to={item.href}
                                            key={item.href}
                                            onClick={() => {
                                                if (isMobile) setSidebarOpen(false);
                                            }}
                                            title={!sidebarOpen ? item.label : undefined}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: sidebarOpen ? 10 : 0,
                                                padding: sidebarOpen ? '10px 12px' : '10px',
                                                borderRadius: 12,
                                                marginBottom: 2,
                                                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                                cursor: 'pointer',
                                                background: active ? 'rgba(249,115,22,0.08)' : 'transparent',
                                                color: active ? '#F97316' : '#64748B',
                                                border: active
                                                    ? '1px solid rgba(249,115,22,0.2)'
                                                    : '1px solid transparent',
                                                fontWeight: active ? 700 : 500,
                                                fontSize: 13,
                                                transition: 'all 0.18s ease',
                                                position: 'relative',
                                                whiteSpace: 'nowrap',
                                            }}
                                                onMouseEnter={e => {
                                                    if (!active) {
                                                        const d = e.currentTarget;
                                                        d.style.background = '#F8FAFC';
                                                        d.style.color = '#0F172A';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!active) {
                                                        const d = e.currentTarget;
                                                        d.style.background = 'transparent';
                                                        d.style.color = '#64748B';
                                                    }
                                                }}
                                            >
                                                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />

                                                {sidebarOpen && (
                                                    <>
                                                        <span style={{ flex: 1 }}>{item.label}</span>
                                                        {active && <ChevronRight size={13} />}
                                                    </>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom AI Status Card */}
                {sidebarOpen && (
                    <div style={{ padding: '0 10px 16px' }}>
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr',
                            gap: 8, marginBottom: 10,
                        }}>
                            {[
                                { label: 'Analyses', val: '318', color: '#F97316' },
                                { label: 'Accuracy', val: '94%', color: '#10B981' },
                            ].map(s => (
                                <div key={s.label} style={{
                                    background: '#F8FAFC', border: '1px solid #F1F5F9',
                                    borderRadius: 10, padding: '8px 10px', textAlign: 'center',
                                }}>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: s.color, marginBottom: 2, margin: '0 0 2px 0' }}>{s.val}</p>
                                    <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, margin: 0 }}>{s.label}</p>
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
                            <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10, margin: '0 0 10px 0' }}>
                                n8n Cloud · 6 Agents active
                            </p>
                            {[
                                { name: 'Demand', pct: 94 },
                                { name: 'Route', pct: 88 },
                                { name: 'Risk', pct: 91 },
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
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: '#10B981',
                                    boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                                    display: 'inline-block',
                                    animation: 'pulse-dot 2s infinite',
                                }} />
                                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>All Systems Operational</span>
                            </div>
                        </div>
                    </div>
                )}

                {!sidebarOpen && (
                    <div style={{ padding: '12px 0 16px', display: 'flex', justifyContent: 'center' }}>
                        <span title="All Systems Operational" style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#10B981',
                            boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                            display: 'inline-block',
                        }} />
                    </div>
                )}
            </aside>

            {/* MAIN AREA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* STICKY NAVBAR */}
                <header style={{
                    height: NAVBAR_H,
                    background: '#fff',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    flexShrink: 0,
                }}>
                    {/* Left */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                style={{
                                    width: 34, height: 34, borderRadius: 9,
                                    border: '1px solid #E2E8F0', background: '#F8FAFC',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', marginRight: 4,
                                }}
                            >
                                <Menu size={15} color="#64748B" />
                            </button>
                        )}

                        <div style={{
                            fontSize: 11, fontWeight: 600, color: '#64748B',
                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                            padding: '5px 12px', borderRadius: 99,
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <ChevronRight size={12} color="#CBD5E1" />
                            {pageTitle}
                        </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Live badge */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 12px', borderRadius: 99,
                            background: 'rgba(16,185,129,0.06)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            fontSize: 11, fontWeight: 600, color: '#10B981',
                        }}>
                            <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: '#10B981', display: 'inline-block',
                                boxShadow: '0 0 5px rgba(16,185,129,0.5)',
                            }} />
                            {!isMobile && '6 Agents '}Live
                        </div>

                        {/* Analyze CTA */}
                        {!isMobile && (
                            <Link to="/analyze" style={{ textDecoration: 'none' }}>
                                <button style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 14px', borderRadius: 10,
                                    background: 'linear-gradient(135deg, #F97316, #EA580C)',
                                    color: '#fff', border: 'none', cursor: 'pointer',
                                    fontSize: 12, fontWeight: 700,
                                    boxShadow: '0 3px 12px rgba(249,115,22,0.25)',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'inherit',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <Search size={13} /> Analyze
                                </button>
                            </Link>
                        )}

                        {/* Avatar + Dropdown */}
                        <div ref={avatarRef} style={{ position: 'relative' }}>
                            <div
                                onClick={() => setAvatarOpen(p => !p)}
                                style={{
                                    width: 34, height: 34, borderRadius: 10,
                                    background: 'linear-gradient(135deg, #F97316, #3B82F6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 800, fontSize: 12, flexShrink: 0,
                                    boxShadow: '0 2px 8px rgba(249,115,22,0.3)', cursor: 'pointer',
                                    transition: 'transform 0.2s ease',
                                    outline: avatarOpen ? '2px solid rgba(249,115,22,0.4)' : 'none',
                                    outlineOffset: 2,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                {USER_INITIALS}
                            </div>

                            {avatarOpen && (
                                <div style={{
                                    position: 'absolute', top: 42, right: 0,
                                    background: '#fff', border: '1px solid #E2E8F0',
                                    borderRadius: 12, padding: 6,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                    minWidth: 180, zIndex: 100,
                                }}>
                                    <div style={{
                                        padding: '8px 12px 10px',
                                        borderBottom: '1px solid #F1F5F9', marginBottom: 4,
                                    }}>
                                        <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, margin: 0 }}>Signed in as</p>
                                        <p style={{
                                            fontSize: 12, fontWeight: 700, color: '#0F172A',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            maxWidth: 160, margin: 0,
                                        }}>{USER_EMAIL}</p>
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
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <LogOut size={14} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main style={{ flex: 1, padding: isMobile ? '24px 16px' : '32px 32px', overflowY: 'auto' }}>
                    <div
                        key={location.pathname}
                        style={{
                            maxWidth: 1100,
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            width: '100%',
                            animation: 'fadeInUp 0.3s ease-out',
                        }}
                    >
                        {children}
                    </div>
                </main>
            </div>

            {/* Inline keyframes */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
