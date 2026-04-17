interface StatusBadgeProps {
    status: string;
    variant?: 'success' | 'warning' | 'danger' | 'accent' | 'muted';
}

const variantClasses = {
    success: 'text-success bg-success-50 border-success/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
    warning: 'text-warning bg-warning-50 border-warning/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
    danger:  'text-danger  bg-danger-50  border-danger/20  shadow-[0_0_8px_rgba(239,68,68,0.15)]',
    accent:  'text-accent  bg-accent-50  border-accent/20',
    muted:   'text-text-muted bg-surface-100 border-surface-200',
};

export default function StatusBadge({ status, variant = 'muted' }: StatusBadgeProps) {
    return (
        <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-md border transition-all duration-200 hover:scale-105 ${variantClasses[variant]}`}>
            {status}
        </span>
    );
}
