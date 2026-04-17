import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    icon: ReactNode;
    label: string;
    value: string;
    sub: string;
    trend: string;
    color: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
}

const colorMap = {
    primary: { bg: 'bg-primary-50', text: 'text-primary', border: 'border-primary-100', iconBg: 'bg-primary-100', glow: 'hover:shadow-glow-primary' },
    accent:  { bg: 'bg-accent-50',  text: 'text-accent',  border: 'border-accent-100',  iconBg: 'bg-accent-100',  glow: 'hover:shadow-glow-accent'  },
    success: { bg: 'bg-success-50', text: 'text-success', border: 'border-surface-200', iconBg: 'bg-success-50',  glow: '' },
    warning: { bg: 'bg-warning-50', text: 'text-warning', border: 'border-surface-200', iconBg: 'bg-warning-50',  glow: '' },
    danger:  { bg: 'bg-danger-50',  text: 'text-danger',  border: 'border-surface-200', iconBg: 'bg-danger-50',   glow: '' },
};

export default function KPICard({ icon, label, value, sub, trend, color }: KPICardProps) {
    const c = colorMap[color];
    const isPositive = trend.startsWith('+');
    const isNegative = trend.startsWith('-');

    return (
        <div
            className={`bg-white rounded-2xl border ${c.border} hover:shadow-card-hover ${c.glow} transition-all duration-300 group hover:-translate-y-1 card-3d relative overflow-hidden`}
            style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}
        >
            {/* bg glow blob */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 ${c.bg} rounded-full blur-2xl opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity duration-300`} />

            {/* ROW 1 — icon left, trend badge right — they NEVER share row with value */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative', zIndex: 10 }}>
                <div
                    className={`${c.iconBg} ${c.text} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                    style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                >
                    {icon}
                </div>

                {/* Trend badge — fixed width, never wraps, never overlaps */}
                <div
                    style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '4px 8px', borderRadius: 99, flexShrink: 0,
                        fontSize: 11, fontWeight: 700, lineHeight: 1,
                        ...(isPositive
                            ? { color: '#10B981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }
                            : isNegative
                            ? { color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }
                            : { color: '#94A3B8', background: '#F1F5F9', border: '1px solid #E2E8F0' }),
                    }}
                >
                    {isPositive ? <TrendingUp size={10} strokeWidth={2.5} /> : isNegative ? <TrendingDown size={10} strokeWidth={2.5} /> : <Minus size={10} strokeWidth={2.5} />}
                    <span style={{ whiteSpace: 'nowrap' }}>{trend}</span>
                </div>
            </div>

            {/* ROW 2 — value alone on its own line, no competition */}
            <div style={{ position: 'relative', zIndex: 10, marginBottom: 4 }}>
                <span
                    className={`font-extrabold ${c.text} animate-counter`}
                    style={{ fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', lineHeight: 1.1, display: 'block', wordBreak: 'break-word' }}
                >
                    {value}
                </span>
            </div>

            {/* ROW 3 — label */}
            <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 2, position: 'relative', zIndex: 10 }}>
                {label}
            </p>

            {/* ROW 4 — sub */}
            <p style={{ fontSize: 11, color: '#94A3B8', position: 'relative', zIndex: 10, lineHeight: 1.4 }}>
                {sub}
            </p>
        </div>
    );
}
