import React from 'react';

type BadgeVariant = 'violet' | 'green' | 'amber' | 'red' | 'blue' | 'grey';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const STYLES: Record<BadgeVariant, { color: string; bg: string; border: string }> = {
  violet: { color: '#5B00E8', bg: 'rgba(91,0,232,0.08)',   border: 'rgba(91,0,232,0.2)'  },
  green:  { color: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.2)' },
  amber:  { color: '#D97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.2)' },
  red:    { color: '#DC2626', bg: 'rgba(220,38,38,0.07)',  border: 'rgba(220,38,38,0.18)'},
  blue:   { color: '#2563EB', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.2)' },
  grey:   { color: '#6B7280', bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.2)'},
};

const SIZE_CLS: Record<BadgeSize, string> = {
  sm: 'text-[9px] px-1.5 py-0.5 rounded-md',
  md: 'text-[11px] px-2.5 py-1 rounded-full',
};

/**
 * Versatile inline badge / chip component. Matches the Archon light-violet
 * design system.
 *
 * @example
 * <Badge variant="green" dot>Active</Badge>
 * <Badge variant="amber" size="sm">Beta</Badge>
 */
export function Badge({ children, variant = 'violet', size = 'md', dot, className = '' }: BadgeProps) {
  const { color, bg, border } = STYLES[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider ${SIZE_CLS[size]} ${className}`}
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {dot && (
        <span
          className="flex-shrink-0 rounded-full animate-pulse"
          style={{ width: 5, height: 5, background: color }}
        />
      )}
      {children}
    </span>
  );
}
