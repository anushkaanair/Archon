import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon }) => {
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  const trendStyle = isUp
    ? { color: '#16A34A', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }
    : isDown
    ? { color: '#DC2626', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.15)' }
    : { color: '#6B7280', background: 'rgba(107,114,128,0.07)', border: '1px solid rgba(107,114,128,0.15)' };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
      style={{
        background: '#ffffff',
        border: '1.5px solid rgba(91,0,232,0.1)',
        boxShadow: '0 2px 16px rgba(91,0,232,0.05)',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">{title}</p>
        {icon && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(91,0,232,0.07)', border: '1px solid rgba(91,0,232,0.12)' }}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2.5">
        <span
          className="text-[28px] font-bold tracking-tight"
          style={{ color: '#0D0D0D', fontFamily: 'Bricolage Grotesque, sans-serif' }}
        >
          {value}
        </span>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={trendStyle}
        >
          {isUp ? '↑' : isDown ? '↓' : '→'} {change}
        </span>
      </div>
    </div>
  );
};
