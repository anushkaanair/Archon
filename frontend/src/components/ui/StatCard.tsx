import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend }) => {
  const isUp = trend === 'up';
  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-white/5 rounded-xl p-5 hover:bg-surface transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-white/60 text-sm font-medium tracking-wide uppercase">{title}</h3>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold text-white tracking-tight">{value}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          isUp ? 'text-semantic-success bg-semantic-success/10' : 
          trend === 'down' ? 'text-semantic-danger bg-semantic-danger/10' : 
          'text-white/50 bg-white/5'
        }`}>
          {isUp ? '↑' : trend === 'down' ? '↓' : '→'} {change}
        </span>
      </div>
    </div>
  );
};
