import { ExternalLink } from 'lucide-react';

interface CostRow {
  model_name: string;
  provider: string;
  role?: string;
  monthly_cost_usd: number;
  cost_per_request_usd: number;
  pricing_source: string;
}

interface CostTableProps {
  breakdown: CostRow[];
  totalMonthly: number;
  requestVolume?: number;
}

export default function CostTable({ breakdown, totalMonthly, requestVolume }: CostTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: '1.5px solid rgba(91,0,232,0.1)' }}>
      {requestVolume && (
        <div
          className="px-5 py-2.5 border-b text-xs"
          style={{ background: 'rgba(91,0,232,0.04)', borderColor: 'rgba(91,0,232,0.08)', color: '#6B7280' }}
        >
          Based on{' '}
          <span className="font-semibold" style={{ color: '#374151' }}>
            {requestVolume.toLocaleString()} requests/month
          </span>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-xs font-bold uppercase tracking-wider"
            style={{ background: 'rgba(91,0,232,0.04)', color: '#6B7280' }}
          >
            <th className="px-5 py-3 text-left">Model</th>
            <th className="px-5 py-3 text-left">Provider</th>
            <th className="px-5 py-3 text-right">Per Request</th>
            <th className="px-5 py-3 text-right">Monthly Cost</th>
            <th className="px-5 py-3 text-center">Source</th>
          </tr>
        </thead>

        <tbody style={{ borderTop: '1px solid rgba(91,0,232,0.08)' }}>
          {breakdown.map((row, i) => (
            <tr
              key={i}
              className="transition-colors hover:bg-[#F4F2FF]"
              style={{ borderTop: i > 0 ? '1px solid rgba(91,0,232,0.06)' : undefined }}
            >
              <td className="px-5 py-3.5 font-semibold" style={{ color: '#0D0D0D' }}>{row.model_name}</td>
              <td className="px-5 py-3.5 capitalize" style={{ color: '#6B7280' }}>{row.provider}</td>
              <td className="px-5 py-3.5 text-right font-mono text-[12px]" style={{ color: '#374151' }}>
                ${row.cost_per_request_usd.toFixed(6)}
              </td>
              <td className="px-5 py-3.5 text-right font-mono font-bold text-[13px]" style={{ color: '#5B00E8' }}>
                ${row.monthly_cost_usd.toFixed(2)}
              </td>
              <td className="px-5 py-3.5 text-center">
                {row.pricing_source ? (
                  <a
                    href={row.pricing_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                    style={{ color: '#5B00E8' }}
                  >
                    cite <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span style={{ color: '#D1D5DB' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr style={{ borderTop: '1.5px solid rgba(91,0,232,0.12)', background: 'rgba(91,0,232,0.04)' }}>
            <td colSpan={3} className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#6B7280' }}>
              Total Monthly Estimate
            </td>
            <td className="px-5 py-3.5 text-right font-mono text-lg font-bold" style={{ color: '#5B00E8' }}>
              ${totalMonthly.toFixed(2)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
