import { DollarSign, Zap, Settings2 } from 'lucide-react';

interface ConstraintInputsProps {
  budget: number;
  setBudget: (v: number) => void;
  maxLatency: number;
  setMaxLatency: (v: number) => void;
  requestVolume: number;
  setRequestVolume: (v: number) => void;
  preferOpenSource: boolean;
  setPreferOpenSource: (v: boolean) => void;
}

export default function ConstraintInputs({
  budget, setBudget,
  maxLatency, setMaxLatency,
  requestVolume, setRequestVolume,
  preferOpenSource, setPreferOpenSource,
}: ConstraintInputsProps) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2 text-sm font-medium text-white/60">
        <Settings2 className="w-4 h-4" />
        Constraints & Preferences
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-1.5 text-white/70">
            <DollarSign className="w-3.5 h-3.5 text-archon-mist" />
            Monthly Budget Cap
          </label>
          <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded text-xs">
            {budget === 0 ? 'Unlimited' : `$${budget.toLocaleString()}/mo`}
          </span>
        </div>
        <input
          type="range"
          min={0} max={5000} step={50}
          value={budget}
          onChange={e => setBudget(Number(e.target.value))}
          className="w-full accent-archon-core"
        />
        <div className="flex justify-between text-[10px] text-white/20">
          <span>Unlimited</span><span>$5,000/mo</span>
        </div>
      </div>

      {/* Latency */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-1.5 text-white/70">
            <Zap className="w-3.5 h-3.5 text-semantic-warning" />
            Max Acceptable Latency (P95)
          </label>
          <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded text-xs">
            {maxLatency}ms
          </span>
        </div>
        <input
          type="range"
          min={200} max={10000} step={100}
          value={maxLatency}
          onChange={e => setMaxLatency(Number(e.target.value))}
          className="w-full accent-archon-core"
        />
        <div className="flex justify-between text-[10px] text-white/20">
          <span>200ms</span><span>10s</span>
        </div>
      </div>

      {/* Request Volume */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <label className="text-white/70">Expected Requests / Month</label>
          <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded text-xs">
            {requestVolume >= 1_000_000
              ? `${(requestVolume / 1_000_000).toFixed(1)}M`
              : requestVolume >= 1000
              ? `${(requestVolume / 1000).toFixed(0)}k`
              : requestVolume}
          </span>
        </div>
        <input
          type="range"
          min={1000} max={1_000_000} step={1000}
          value={requestVolume}
          onChange={e => setRequestVolume(Number(e.target.value))}
          className="w-full accent-archon-core"
        />
        <div className="flex justify-between text-[10px] text-white/20">
          <span>1k</span><span>1M</span>
        </div>
      </div>

      {/* Open Source Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-white/70">Prefer Open-Source Models</label>
        <button
          onClick={() => setPreferOpenSource(!preferOpenSource)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            preferOpenSource ? 'bg-archon-core' : 'bg-white/10'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              preferOpenSource ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
}
