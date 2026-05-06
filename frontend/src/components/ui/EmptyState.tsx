import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

/**
 * Reusable empty-state placeholder for lists, tables, and search results.
 * Accepts an optional icon, title, description, and a single CTA.
 *
 * @example
 * <EmptyState
 *   icon={<FileJson className="w-8 h-8 text-[#5B00E8] opacity-50" />}
 *   title="No blueprints yet"
 *   description="Generate your first blueprint to see it here."
 *   cta={{ label: 'New Blueprint', href: '/builder' }}
 * />
 */
export function EmptyState({ icon, title, description, cta, className = '' }: EmptyStateProps) {
  const btnStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #5B00E8, #7C3AED)',
    boxShadow: '0 4px 20px rgba(91,0,232,0.3)',
    color: '#fff',
  };

  return (
    <div
      className={`rounded-2xl px-8 py-14 flex flex-col items-center text-center bg-white ${className}`}
      style={{ border: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 4px 24px rgba(91,0,232,0.06)' }}
    >
      {icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(91,0,232,0.06)', border: '2px solid rgba(91,0,232,0.14)' }}
        >
          {icon}
        </div>
      )}

      <p className="text-[18px] font-extrabold text-[#0D0D0D] mb-2">{title}</p>

      {description && (
        <p className="text-[13px] text-[#6B7280] max-w-xs leading-relaxed mb-6">{description}</p>
      )}

      {cta && (
        cta.href ? (
          <Link
            to={cta.href}
            className="inline-flex items-center gap-2 h-11 px-7 rounded-xl text-[13px] font-bold transition-all"
            style={btnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            {cta.label}
          </Link>
        ) : (
          <button
            onClick={cta.onClick}
            className="inline-flex items-center gap-2 h-11 px-7 rounded-xl text-[13px] font-bold transition-all"
            style={btnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            {cta.label}
          </button>
        )
      )}
    </div>
  );
}
