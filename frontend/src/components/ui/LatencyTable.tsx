import { ExternalLink } from 'lucide-react';

interface LatencyRow {
  step: string;
  p50_ms: number;
  p95_ms: number;
  source?: string;
}

interface LatencyTableProps {
  breakdown: LatencyRow[];
  totalP95: number;
}

function latencyColor(ms: number) {
  if (ms < 500) return 'text-semantic-success';
  if (ms < 1500) return 'text-semantic-warning';
  return 'text-semantic-danger';
}

export default function LatencyTable({ breakdown, totalP95 }: LatencyTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 text-xs font-medium text-white/40 uppercase tracking-wider">
            <th className="px-5 py-3 text-left">Pipeline Step</th>
            <th className="px-5 py-3 text-right">P50</th>
            <th className="px-5 py-3 text-right">P95</th>
            <th className="px-5 py-3 text-center">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {breakdown.map((row, i) => (
            <tr key={i} className="hover:bg-white/3 transition-colors">
              <td className="px-5 py-3.5 font-medium text-white">{row.step}</td>
              <td className={`px-5 py-3.5 text-right font-mono ${latencyColor(row.p50_ms)}`}>
                {row.p50_ms}ms
              </td>
              <td className={`px-5 py-3.5 text-right font-mono font-semibold ${latencyColor(row.p95_ms)}`}>
                {row.p95_ms}ms
              </td>
              <td className="px-5 py-3.5 text-center">
                {row.source && row.source !== 'Model registry — see provider benchmarks' ? (
                  <a
                    href={row.source}
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
            <td colSpan={2} className="px-5 py-3 text-sm font-medium text-white/60">
              Total End-to-End P95
            </td>
            <td className={`px-5 py-3 text-right font-mono text-lg font-bold ${latencyColor(totalP95)}`}>
              {totalP95}ms
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
