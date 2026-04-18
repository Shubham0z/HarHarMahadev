// src/pages/ManagerAuthPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Lock, ChevronRight, Sparkles, Zap,
  Truck, Ship, Bus, Train, Plane, Anchor, Navigation,
} from 'lucide-react';

const MANAGER_PASSWORD = 'Manager@2026';

const BG_ICONS = [
  { Icon: Truck,  top: '8%',  left: '3%',   size: 22, delay: '0s',   dur: '7s',   rot: -15 },
  { Icon: Ship,   top: '15%', left: '18%',  size: 20, delay: '1.2s', dur: '9s',   rot: 5   },
  { Icon: Bus,    top: '6%',  left: '38%',  size: 21, delay: '0.5s', dur: '8s',   rot: 0   },
  { Icon: Plane,  top: '11%', left: '58%',  size: 24, delay: '2s',   dur: '10s',  rot: 30  },
  { Icon: Train,  top: '7%',  left: '78%',  size: 20, delay: '0.8s', dur: '7.5s', rot: 0   },
  { Icon: Truck,  top: '7%',  left: '92%',  size: 19, delay: '1.5s', dur: '8.5s', rot: 10  },
  { Icon: Ship,   top: '22%', left: '7%',   size: 21, delay: '0.3s', dur: '9.5s', rot: -5  },
  { Icon: Plane,  top: '28%', left: '28%',  size: 19, delay: '1.8s', dur: '11s',  rot: 20  },
  { Icon: Bus,    top: '25%', left: '48%',  size: 23, delay: '0.6s', dur: '8s',   rot: 0   },
  { Icon: Train,  top: '30%', left: '68%',  size: 20, delay: '2.2s', dur: '9s',   rot: 0   },
  { Icon: Truck,  top: '24%', left: '86%',  size: 21, delay: '1s',   dur: '7s',   rot: -10 },
  { Icon: Plane,  top: '40%', left: '2%',   size: 24, delay: '0.4s', dur: '10s',  rot: 25  },
  { Icon: Bus,    top: '42%', left: '20%',  size: 19, delay: '1.6s', dur: '8.5s', rot: 0   },
  { Icon: Ship,   top: '38%', left: '42%',  size: 23, delay: '0.9s', dur: '9s',   rot: -3  },
  { Icon: Truck,  top: '45%', left: '62%',  size: 20, delay: '2.4s', dur: '7.5s', rot: 8   },
  { Icon: Train,  top: '40%', left: '80%',  size: 21, delay: '0.2s', dur: '11s',  rot: 0   },
  { Icon: Plane,  top: '44%', left: '95%',  size: 19, delay: '1.3s', dur: '9.5s', rot: 35  },
  { Icon: Train,  top: '55%', left: '10%',  size: 20, delay: '0.7s', dur: '8s',   rot: 0   },
  { Icon: Truck,  top: '58%', left: '30%',  size: 23, delay: '1.9s', dur: '7s',   rot: -12 },
  { Icon: Bus,    top: '53%', left: '52%',  size: 19, delay: '0.1s', dur: '10s',  rot: 0   },
  { Icon: Ship,   top: '60%', left: '72%',  size: 21, delay: '2.6s', dur: '8.5s', rot: 7   },
  { Icon: Plane,  top: '56%', left: '88%',  size: 20, delay: '1.1s', dur: '9s',   rot: 28  },
  { Icon: Bus,    top: '70%', left: '5%',   size: 21, delay: '0.6s', dur: '9s',   rot: 0   },
  { Icon: Plane,  top: '72%', left: '22%',  size: 19, delay: '2s',   dur: '11s',  rot: 20  },
  { Icon: Train,  top: '68%', left: '44%',  size: 23, delay: '0.4s', dur: '8s',   rot: 0   },
  { Icon: Truck,  top: '75%', left: '65%',  size: 20, delay: '1.7s', dur: '7.5s', rot: -8  },
  { Icon: Ship,   top: '70%', left: '82%',  size: 21, delay: '0.9s', dur: '10s',  rot: 4   },
  { Icon: Bus,    top: '73%', left: '96%',  size: 19, delay: '1.4s', dur: '8.5s', rot: 0   },
  { Icon: Truck,  top: '84%', left: '2%',   size: 20, delay: '2.1s', dur: '9s',   rot: 15  },
  { Icon: Ship,   top: '88%', left: '18%',  size: 23, delay: '0.5s', dur: '8s',   rot: -6  },
  { Icon: Plane,  top: '82%', left: '38%',  size: 19, delay: '1.3s', dur: '10s',  rot: 22  },
  { Icon: Bus,    top: '90%', left: '56%',  size: 21, delay: '0.8s', dur: '7.5s', rot: 0   },
  { Icon: Train,  top: '85%', left: '74%',  size: 20, delay: '2.3s', dur: '9.5s', rot: 0   },
  { Icon: Truck,  top: '91%', left: '90%',  size: 23, delay: '0.3s', dur: '8s',   rot: -10 },
];

export default function ManagerAuthPage() {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [shake, setShake]       = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 700)); // small delay for feel
    if (password === MANAGER_PASSWORD) {
      sessionStorage.setItem('manager_auth', 'true');
      navigate('/manager-dashboard');
    } else {
      setError('Incorrect manager password. Access denied.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(105deg, #0F172A 0%, #1E293B 40%, #0F172A 100%)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>

      {/* BG Icons — same as login but darker tint */}
      {BG_ICONS.map(({ Icon, top, left, size, delay, dur, rot }, i) => (
        <div key={i} style={{
          position: 'absolute', top, left, zIndex: 0,
          pointerEvents: 'none',
          animation: `icon-float ${dur} ease-in-out infinite`,
          animationDelay: delay,
          transform: `rotate(${rot}deg)`,
          opacity: 0,
        }}>
          <Icon size={size} color="#F97316" style={{ opacity: 0.08 }} />
        </div>
      ))}

      {/* Ambient blobs */}
      <div style={{
        position: 'absolute', top: -100, left: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(ellipse, rgba(249,115,22,0.10) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: -80, right: '5%',
        width: 400, height: 400,
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Radar ping — top right */}
      <div style={{ position: 'absolute', top: 44, right: 48, zIndex: 2 }}>
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1.5px solid rgba(249,115,22,0.3)',
            animation: 'radar-ping 3s ease-out infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 8, borderRadius: '50%',
            border: '1.5px solid rgba(249,115,22,0.2)',
            animation: 'radar-ping 3s ease-out infinite',
            animationDelay: '0.9s',
          }} />
          <Navigation size={14} color="#F97316" style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)', opacity: 0.7,
          }} />
        </div>
      </div>

      {/* Anchor bottom-left */}
      <div style={{
        position: 'absolute', bottom: 48, left: 40,
        opacity: 0.06, animation: 'anchor-drift 20s ease-in-out infinite',
        pointerEvents: 'none',
      }}>
        <Anchor size={80} color="#F97316" />
      </div>

      {/* ── CARD ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        padding: '0 24px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>

        {/* Shield icon top center */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
            border: '1px solid rgba(249,115,22,0.25)',
            boxShadow: '0 0 32px rgba(249,115,22,0.12)',
            marginBottom: 16,
          }}>
            <Shield size={28} color="#F97316" />
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 900,
            color: '#F8FAFC', letterSpacing: '-0.5px', marginBottom: 6,
          }}>
            Manager Access
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', fontWeight: 400 }}>
            Enter your manager password to continue
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '32px 28px',
          backdropFilter: 'blur(20px)',
          animation: shake ? 'shake 0.5s ease' : 'none',
        }}>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                fontSize: 13, fontWeight: 500, color: '#FCA5A5',
              }}>
                <Shield size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Password input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', paddingLeft: 2 }}>
                Manager Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{
                  position: 'absolute', left: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569', pointerEvents: 'none',
                }} />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: 46, paddingRight: 16,
                    paddingTop: 15, paddingBottom: 15,
                    borderRadius: 14, fontSize: 14,
                    color: '#F8FAFC',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(249,115,22,0.2)',
                    outline: 'none', transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.6)';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249,115,22,0.08)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-glow"
              style={{
                width: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '16px 24px', marginTop: 4,
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                color: '#fff', border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 28px rgba(249,115,22,0.25)',
                opacity: loading ? 0.75 : 1,
                transition: 'all 0.22s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(249,115,22,0.35)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(249,115,22,0.25)';
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" style={{ width: 16, height: 16 }}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Enter Manager Panel
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 12, margin: '24px 0 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(249,115,22,0.1)' }} />
            <span style={{ fontSize: 11, color: '#334155', fontWeight: 600, letterSpacing: '0.08em' }}>
              RESTRICTED ACCESS
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(249,115,22,0.1)' }} />
          </div>
        </div>

        {/* Back hint */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#334155' }}>
          Press{' '}
          <kbd style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5, padding: '2px 7px', fontSize: 11, color: '#64748B',
            fontFamily: 'inherit',
          }}>Esc</kbd>
          {' '}or{' '}
          <span
            onClick={() => navigate('/')}
            style={{ color: '#F97316', cursor: 'pointer', fontWeight: 600 }}
          >
            go back home
          </span>
        </p>
      </div>

      <style>{`
        @keyframes icon-float {
          0%   { opacity: 0;    transform: translateY(0px)   rotate(var(--rot, 0deg)); }
          15%  { opacity: 1; }
          50%  { opacity: 1;    transform: translateY(-18px) rotate(var(--rot, 0deg)); }
          85%  { opacity: 1; }
          100% { opacity: 0;    transform: translateY(0px)   rotate(var(--rot, 0deg)); }
        }
        @keyframes radar-ping {
          0%   { transform: scale(0.5); opacity: 0.7; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes anchor-drift {
          0%, 100% { transform: translateY(0px)   rotate(0deg); }
          50%       { transform: translateY(-12px) rotate(8deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
