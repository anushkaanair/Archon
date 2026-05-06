interface ScoreGaugeProps {
  score: number | null;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

function scoreColor(score: number | null): { stroke: string; text: string; bg: string } {
  if (score === null) return { stroke: '#D1D5DB', text: '#9CA3AF', bg: 'rgba(209,213,219,0.12)' };
  if (score >= 0.8)   return { stroke: '#16A34A', text: '#16A34A', bg: 'rgba(22,163,74,0.08)' };
  if (score >= 0.6)   return { stroke: '#D97706', text: '#D97706', bg: 'rgba(217,119,6,0.08)' };
  return                     { stroke: '#DC2626', text: '#DC2626', bg: 'rgba(220,38,38,0.07)' };
}

function scoreLabel(score: number | null) {
  if (score === null) return 'N/A';
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Medium';
  return 'Low';
}

export default function ScoreGauge({ score, label, size = 'md' }: ScoreGaugeProps) {
  const sizes = { sm: 64, md: 96, lg: 128 };
  const dim = sizes[size];
  const strokeW = size === 'sm' ? 6 : 8;
  const radius = (dim / 2) - strokeW - 2;
  const circumference = 2 * Math.PI * radius;
  const filled = score !== null ? score * circumference : 0;
  const { stroke, text, bg } = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-full flex items-center justify-center"
        style={{ width: dim, height: dim, background: bg, padding: 4 }}
      >
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} style={{ position: 'absolute' }}>
          {/* Track */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="rgba(91,0,232,0.08)"
            strokeWidth={strokeW}
          />
          {/* Progress arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeW}
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeDashoffset={circumference / 4}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Center text */}
          <text
            x={dim / 2}
            y={dim / 2}
            textAnchor="middle"
            dy="0.15em"
            fill={text}
            fontSize={size === 'sm' ? 11 : size === 'md' ? 15 : 20}
            fontWeight="700"
            fontFamily="ui-monospace, monospace"
          >
            {score !== null ? score.toFixed(2) : 'N/A'}
          </text>
        </svg>
        {/* Invisible spacer so the div sizes correctly */}
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} style={{ opacity: 0 }} />
      </div>

      {label && (
        <div className="text-center">
          <div className="text-xs font-medium" style={{ color: '#6B7280' }}>{label}</div>
          <div
            className="text-[11px] font-bold mt-0.5 px-2 py-0.5 rounded-full"
            style={{ color: text, background: bg }}
          >
            {scoreLabel(score)}
          </div>
        </div>
      )}
    </div>
  );
}
