import React from 'react';

interface MetricCardProps {
  title: string;
  amount: string;
  percent: string;
  isPositive: boolean;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, amount, percent, isPositive, subtitle }) => (
  <div
    className="rounded-2xl p-6 relative overflow-hidden group transition-all hover:-translate-y-0.5"
    style={{
      background: '#ffffff',
      border: '1.5px solid rgba(91,0,232,0.1)',
      boxShadow: '0 2px 16px rgba(91,0,232,0.05)',
    }}
  >
    {/* Decorative glow blob */}
    <div
      className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity"
      style={{ background: 'rgba(91,0,232,0.08)' }}
    />

    <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">{title}</p>

    <div className="flex items-end gap-3 relative z-10">
      <span
        className="text-[28px] font-bold tracking-tight"
        style={{ color: '#0D0D0D', fontFamily: 'Bricolage Grotesque, sans-serif' }}
      >
        {amount}
      </span>
      <span
        className="text-[12px] font-semibold mb-1 px-2 py-0.5 rounded-full"
        style={{
          color: isPositive ? '#16A34A' : '#DC2626',
          background: isPositive ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.07)',
          border: `1px solid ${isPositive ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.15)'}`,
        }}
      >
        {isPositive ? '+' : '-'}{percent}%
      </span>
    </div>

    {subtitle && (
      <p className="text-[11px] text-[#9CA3AF] mt-1.5 relative z-10">{subtitle}</p>
    )}
  </div>
);
