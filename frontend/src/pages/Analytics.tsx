import { useEffect, useState } from 'react';
import { PieChart, TrendingUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetricCard } from '../components/ui/MetricCard';
import { useAuth } from '../context/AuthContext';

interface Stats {
  total_blueprints: number;
  avg_eval_score: number | null;
  total_estimated_monthly_cost_usd: number;
  models_evaluated: number;
}

interface BlueprintItem {
  blueprint_id: string;
  model_count: number;
  total_monthly_cost_usd: number;
  total_p95_ms: number;
}

export default function Analytics() {
  const { token } = useAuth();
  const apiKey = token || 'arch_test_key_dev';
  const headers = { Authorization: `Bearer ${apiKey}` };

  const [stats, setStats] = useState<Stats | null>(null);
  const [blueprints, setBlueprints] = useState<BlueprintItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/v1/dashboard/stats', { headers }).then(r => r.json()),
      fetch('/v1/blueprints?limit=50', { headers }).then(r => r.json()),
    ]).then(([s, b]) => {
      setStats(s);
      setBlueprints(b.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Derive cost-by-blueprint bar chart data (up to 5 most recent)
  const barData = blueprints.slice(0, 5).map(b => b.total_monthly_cost_usd ?? 0);
  const maxBar = Math.max(...barData, 1);

  // Derive latency distribution buckets from real blueprints
  const fast = blueprints.filter(b => b.total_p95_ms > 0 && b.total_p95_ms < 1000).length;
  const mid  = blueprints.filter(b => b.total_p95_ms >= 1000 && b.total_p95_ms < 3000).length;
  const slow = blueprints.filter(b => b.total_p95_ms >= 3000).length;
  const total = fast + mid + slow || 1;
  const fastPct  = Math.round((fast / total) * 100);
  const midPct   = Math.round((mid  / total) * 100);
  const slowPct  = 100 - fastPct - midPct;

  const totalCost = stats?.total_estimated_monthly_cost_usd ?? 0;
  const avgScore  = stats?.avg_eval_score;
  const bpCount   = stats?.total_blueprints ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Cost &amp; Performance Analytics</h1>
          <p className="text-white/50 text-sm">Real telemetry from your blueprint history — costs, latency, and model scoring.</p>
        </div>
      </header>

      {/* Top metrics - sourced from real DB stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-surface/50 border border-white/5 rounded-xl animate-pulse" />
          ))
        ) : (
          <>
            <MetricCard
              title="Total Est. Monthly Cost"
              amount={`$${totalCost.toFixed(2)}`}
              percent={bpCount > 0 ? ((totalCost / bpCount)).toFixed(1) : '0'}
              isPositive={false}
            />
            <MetricCard
              title="Blueprints Generated"
              amount={String(bpCount)}
              percent={String(stats?.models_evaluated ?? 0)}
              isPositive={true}
            />
            <MetricCard
              title="Avg Quality Score"
              amount={avgScore != null ? avgScore.toFixed(3) : 'N/A'}
              percent={avgScore != null ? (avgScore * 100).toFixed(0) : '0'}
              isPositive={avgScore != null && avgScore >= 0.7}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Cost per blueprint bar chart */}
        <div className="bg-surface/80 border border-white/5 rounded-xl p-6 min-h-[300px] flex flex-col group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
          <div className="w-full flex justify-between items-center mb-6 z-10">
            <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-archon-mist" />
              Est. Cost — Recent Blueprints
            </h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-archon-mist animate-spin" />
            </div>
          ) : barData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/30 text-sm">No blueprints yet — generate one in the Builder.</p>
            </div>
          ) : (
            <div className="flex-1 flex items-end justify-center gap-4 px-4 pb-4">
              {barData.map((cost, i) => {
                const heightPct = Math.max((cost / maxBar) * 100, 4);
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[10px] text-white/40 font-mono">
                      ${cost > 0 ? cost.toFixed(2) : '—'}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      style={{ minHeight: 8 }}
                      className="w-full bg-gradient-to-t from-archon-core to-archon-bright rounded-t-md group-hover:from-archon-bright group-hover:to-archon-mist transition-colors"
                    />
                    <span className="text-[10px] text-white/30">#{i + 1}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="text-[10px] text-white/25 text-center mt-2 z-10">Most recent {barData.length} blueprint(s)</div>
        </div>

        {/* Latency distribution - derived from real blueprint P95 values */}
        <div className="bg-surface/80 border border-white/5 rounded-xl p-6 min-h-[300px] relative overflow-hidden">
          <div className="w-full flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-archon-mist" />
              Latency Distribution
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-archon-mist animate-spin" />
            </div>
          ) : blueprints.length === 0 ? (
            <p className="text-white/30 text-sm mt-4">No data yet.</p>
          ) : (
            <>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                P95 latency breakdown across {blueprints.length} blueprint{blueprints.length !== 1 ? 's' : ''}.
                Fast (&lt;1s), mid (1–3s), and slow (&gt;3s) tiers derived from cost simulator estimates.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/70">Fast &lt;1 000ms</span>
                    <span className="text-white font-medium">{fastPct}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fastPct}%` }}
                      transition={{ duration: 0.8 }}
                      className="bg-semantic-success h-2 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/70">Mid 1 000–3 000ms</span>
                    <span className="text-white font-medium">{midPct}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${midPct}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="bg-semantic-info h-2 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/70">Slow &gt;3 000ms</span>
                    <span className="text-white font-medium">{slowPct}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${slowPct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="bg-archon-core h-2 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
