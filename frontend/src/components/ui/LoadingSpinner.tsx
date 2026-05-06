type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  /** Tailwind text-color class or raw color string */
  color?: string;
  label?: string;
}

const SIZES: Record<SpinnerSize, { ring: string; gap: string; text: string }> = {
  xs: { ring: 'w-3 h-3 border-[1.5px]', gap: 'gap-1.5', text: 'text-[10px]' },
  sm: { ring: 'w-4 h-4 border-2',       gap: 'gap-2',   text: 'text-[11px]' },
  md: { ring: 'w-6 h-6 border-2',       gap: 'gap-2.5', text: 'text-[12px]' },
  lg: { ring: 'w-9 h-9 border-[3px]',   gap: 'gap-3',   text: 'text-[13px]' },
};

/**
 * Lightweight violet spinner that matches the Archon design system.
 * Accepts an optional text label that renders beside the ring.
 *
 * @example
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" label="Generating blueprint…" />
 */
export function LoadingSpinner({ size = 'md', color = '#5B00E8', label }: LoadingSpinnerProps) {
  const s = SIZES[size];
  return (
    <div className={`inline-flex items-center ${s.gap}`}>
      <div
        className={`${s.ring} rounded-full animate-spin flex-shrink-0`}
        style={{
          borderColor: `${color}20`,
          borderTopColor: color,
        }}
      />
      {label && (
        <span className={`${s.text} font-medium`} style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
}
