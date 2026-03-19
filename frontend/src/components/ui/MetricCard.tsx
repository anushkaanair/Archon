import React from 'react';

interface MetricCardProps {
  title: string;
  amount: string;
  percent: string;
  isPositive: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, amount, percent, isPositive }) => (
  <div className="bg-surface/60 backdrop-blur-xl border border-white/5 rounded-xl p-6 relative overflow-hidden group">
    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-archon-core/5 rounded-full blur-xl group-hover:bg-archon-core/10 transition-colors" />
    <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-2">{title}</h3>
    <div className="flex items-end gap-3">
      <span className="text-3xl font-semibold text-white tracking-tight">{amount}</span>
      <span className={`text-sm font-medium mb-1 ${isPositive ? 'text-semantic-success' : 'text-semantic-danger'}`}>
        {isPositive ? '+' : '-'}{percent}%
      </span>
    </div>
  </div>
);
