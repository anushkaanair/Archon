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

function latencyBadge(ms: number): { color: string; bg: string; border: string } {
  if (ms < 500)  return { color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.2)' };
  if (ms < 1500) return { color: '#D97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.2)' };
  return           { color: '#DC2626', bg: 'rgba(220,38,38,0.07)',   border: 'rgba(220,38,38,0.15)' };
}

export default function LatencyTable({ breakdown, totalP95 }: LatencyTableProps) {
  const totalStyle = latencyBadge(totalP95);

  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: '1.5px solid rgba(91,0,232,0.1)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-xs font-bold uppercase tracking-wider"
            style={{ background: 'rgba(91,0,232,0.04)', color: '#6B7280' }}
          >
            <th className="px-5 py-3 text-left">Pipeline Step</th>
            <th className="px-5 py-3 text-right">P50</th>
            <th className="px-5 py-3 text-right">P95</th>
            <th className="px-5 py-3 text-center">Source</th>
          </tr>
        </thead>

        <tbody style={{ borderTop: '1px solid rgba(91,0,232,0.08)' }}>
          {breakdown.map((row, i) => {
            const p50s = latencyBadge(row.p50_ms);
            const p95s = latencyBadge(row.p95_ms);
            return (
              <tr
                key={i}
                className="transition-colors hover:bg-[#F4F2FF]"
                style={{ borderTop: i > 0 ? '1px solid rgba(91,0,232,0.06)' : undefined }}
              >
                <td className="px-5 py-3.5 font-semibold" style={{ color: '#0D0D0D' }}>{row.step}</td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className="font-mono text-[12px] px-2 py-0.5 rounded-lg font-semibold"
                    style={{ color: p50s.color, background: p50s.bg, border: `1px solid ${p50s.border}` }}
                  >
                    {row.p50_ms}ms
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className="font-mono text-[12px] px-2 py-0.5 rounded-lg font-bold"
                    style={{ color: p95s.color, background: p95s.bg, border: `1px solid ${p95s.border}` }}
                  >
                    {row.p95_ms}ms
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  {row.source && row.source !== 'Model registry — see provider benchmarks' ? (
                    <a
                      href={row.source}
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
            );
          })}
        </tbody>

        <tfoot>
          <tr style={{ borderTop: '1.5px solid rgba(91,0,232,0.12)', background: 'rgba(91,0,232,0.04)' }}>
            <td colSpan={2} className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#6B7280' }}>
              Total End-to-End P95
            </td>
            <td className="px-5 py-3.5 text-right">
              <span
                className="font-mono text-base px-3 py-1 rounded-xl font-bold"
                style={{ color: totalStyle.color, background: totalStyle.bg, border: `1.5px solid ${totalStyle.border}` }}
              >
                {totalP95}ms
              </span>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
