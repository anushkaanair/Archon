import { PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, amount, percent, isPositive }: { title: string, amount: string, percent: string, isPositive: boolean }) => (
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

export default function Analytics() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Cost & Performance Analytics</h1>
          <p className="text-white/50 text-sm">Detailed telemetry on model routing, latency, and cost efficiency.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-surface border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-archon-core">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Month</option>
          </select>
          <button className="bg-archon-core hover:bg-archon-bright text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(83,74,183,0.2)] flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Inference Cost" amount="$4,250.00" percent="12.5" isPositive={false} />
        <MetricCard title="Est. Savings via Routing" amount="$1,840.50" percent="34.2" isPositive={true} />
        <MetricCard title="Avg Latency Reduction" amount="450ms" percent="18.5" isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-surface/80 border border-white/5 rounded-xl p-6 min-h-[300px] flex flex-col justify-between items-center group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
          <div className="w-full flex justify-between items-center mb-10 z-10">
            <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-archon-mist" />
              Cost by Model
            </h2>
          </div>
          <div className="w-full flex-1 flex items-end justify-center gap-6 px-4 pb-4">
            {/* Mock Chart Area */}
            {[40, 70, 45, 90, 30].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="w-12 bg-gradient-to-t from-archon-core to-archon-bright rounded-t-md relative group-hover:from-archon-bright group-hover:to-archon-mist transition-colors"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {h}%
                </div>
              </motion.div>
            ))}
          </div>
          <div className="w-full flex justify-center gap-8 mt-4 pt-4 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-2 text-xs text-white/50"><span className="w-2 h-2 rounded-full bg-archon-core"></span> GPT-4o</div>
            <div className="flex items-center gap-2 text-xs text-white/50"><span className="w-2 h-2 rounded-full bg-semantic-info"></span> Claude 3.5</div>
          </div>
        </div>

        <div className="bg-surface/80 border border-white/5 rounded-xl p-6 min-h-[300px] relative overflow-hidden">
          <div className="w-full flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-archon-mist" />
              Routing Decisions
            </h2>
          </div>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">
            Archon's strategy engine intelligently routes semantic queries based on real-time latency and cost optimization. Over the last 7 days, 64% of generic requests were routed to smaller local models, saving $840.
          </p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/70">Local / Small Models (Llama 3 8B, Mistral)</span>
                <span className="text-white font-medium">64%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-semantic-success h-2 rounded-full" style={{ width: '64%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/70">Mid-tier API (Claude 3.5 Haiku, Gemini Flash)</span>
                <span className="text-white font-medium">25%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-semantic-info h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/70">Heavy Compute (GPT-4o, Claude 3.5 Sonnet)</span>
                <span className="text-white font-medium">11%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-archon-core h-2 rounded-full" style={{ width: '11%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
