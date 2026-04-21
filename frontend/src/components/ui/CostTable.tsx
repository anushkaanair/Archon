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
    <div className="overflow-hidden rounded-xl border border-white/5">
      {requestVolume && (
        <div className="px-5 py-2.5 bg-white/3 border-b border-white/5 text-xs text-white/40">
          Based on <span className="text-white/70 font-medium">{requestVolume.toLocaleString()} requests/month</span>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 text-xs font-medium text-white/40 uppercase tracking-wider">
            <th className="px-5 py-3 text-left">Model</th>
            <th className="px-5 py-3 text-left">Provider</th>
            <th className="px-5 py-3 text-right">Per Request</th>
            <th className="px-5 py-3 text-right">Monthly Cost</th>
            <th className="px-5 py-3 text-center">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {breakdown.map((row, i) => (
            <tr key={i} className="hover:bg-white/3 transition-colors">
              <td className="px-5 py-3.5 font-medium text-white">{row.model_name}</td>
              <td className="px-5 py-3.5 text-white/50 capitalize">{row.provider}</td>
              <td className="px-5 py-3.5 text-right font-mono text-white/70">
                ${row.cost_per_request_usd.toFixed(6)}
              </td>
              <td className="px-5 py-3.5 text-right font-mono font-semibold text-archon-mist">
                ${row.monthly_cost_usd.toFixed(2)}
              </td>
              <td className="px-5 py-3.5 text-center">
                {row.pricing_source ? (
                  <a
                    href={row.pricing_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-archon-mist hover:text-white transition-colors"
                  >
                    cite <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-white/20">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-white/5 border-t border-white/10">
            <td colSpan={3} className="px-5 py-3 text-sm font-medium text-white/60">
              Total Monthly Estimate
            </td>
            <td className="px-5 py-3 text-right font-mono text-lg font-bold text-white">
              ${totalMonthly.toFixed(2)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
