interface ScoreGaugeProps {
  score: number | null;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

function scoreColor(score: number | null) {
  if (score === null) return '#3a3560';
  if (score >= 0.8) return '#5DCAA5';
  if (score >= 0.6) return '#EF9F27';
  return '#F09595';
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
  const radius = (dim / 2) - 8;
  const circumference = 2 * Math.PI * radius;
  const filled = score !== null ? score * circumference : 0;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        {/* Track */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="#1a1730"
          strokeWidth={size === 'sm' ? 6 : 8}
        />
        {/* Progress */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={size === 'sm' ? 6 : 8}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Center text */}
        <text
          x={dim / 2}
          y={dim / 2}
          textAnchor="middle"
          dy="0.15em"
          fill="white"
          fontSize={size === 'sm' ? 11 : size === 'md' ? 16 : 22}
          fontWeight="600"
          fontFamily="monospace"
        >
          {score !== null ? score.toFixed(2) : 'N/A'}
        </text>
      </svg>
      {label && (
        <div className="text-center">
          <div className="text-xs text-white/50">{label}</div>
          <div className="text-xs font-semibold mt-0.5" style={{ color }}>
            {scoreLabel(score)}
          </div>
        </div>
      )}
    </div>
  );
}
