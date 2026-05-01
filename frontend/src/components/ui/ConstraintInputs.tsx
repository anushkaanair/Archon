import { DollarSign, Zap, Globe, Users, Server, Target } from 'lucide-react';

interface ConstraintInputsProps {
  budget: number;
  setBudget: (v: number) => void;
  maxLatency: number;
  setMaxLatency: (v: number) => void;
  requestVolume: number;
  setRequestVolume: (v: number) => void;
  preferOpenSource: boolean;
  setPreferOpenSource: (v: boolean) => void;
  /* extended constraints */
  compliance?: string[];
  setCompliance?: (v: string[]) => void;
  teamSize?: string;
  setTeamSize?: (v: string) => void;
  region?: string;
  setRegion?: (v: string) => void;
  deployment?: string;
  setDeployment?: (v: string) => void;
  priority?: 'cost' | 'latency' | 'quality';
  setPriority?: (v: 'cost' | 'latency' | 'quality') => void;
}

const COMPLIANCE_OPTIONS = ['GDPR', 'HIPAA', 'SOC2', 'CCPA', 'PCI-DSS', 'ISO 27001'];
const TEAM_SIZES = ['Solo dev', '2–5 people', '5–20 people', '20+ people'];
const REGIONS = ['English only', 'Multi-language', 'EU-region only', 'APAC-region', 'Custom'];
const DEPLOYMENTS = ['Cloud SaaS', 'On-premise', 'Hybrid', 'Edge / CDN'];

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">{children}</p>;
}

function ValueBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg"
      style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.15)' }}>
      {children}
    </span>
  );
}

export default function ConstraintInputs({
  budget, setBudget,
  maxLatency, setMaxLatency,
  requestVolume, setRequestVolume,
  preferOpenSource, setPreferOpenSource,
  compliance = [], setCompliance,
  teamSize = 'Solo dev', setTeamSize,
  region = 'English only', setRegion,
  deployment = 'Cloud SaaS', setDeployment,
  priority = 'quality', setPriority,
}: ConstraintInputsProps) {

  const toggleCompliance = (opt: string) => {
    if (!setCompliance) return;
    setCompliance(compliance.includes(opt) ? compliance.filter(c => c !== opt) : [...compliance, opt]);
  };

  return (
    <div className="p-5 space-y-6">

      {/* ── Budget ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label><span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 inline" /> Monthly Budget Cap</span></Label>
          <ValueBadge>{budget === 0 ? 'Unlimited' : `$${budget.toLocaleString()}/mo`}</ValueBadge>
        </div>
        <input type="range" min={0} max={5000} step={50} value={budget}
          onChange={e => setBudget(Number(e.target.value))}
          className="w-full accent-[#5B00E8] cursor-pointer" />
        <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
          <span>Unlimited</span><span>$5,000/mo</span>
        </div>
      </div>

      {/* ── Latency ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label><span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 inline" /> Max Latency (P95)</span></Label>
          <ValueBadge>{maxLatency}ms</ValueBadge>
        </div>
        <input type="range" min={200} max={10000} step={100} value={maxLatency}
          onChange={e => setMaxLatency(Number(e.target.value))}
          className="w-full accent-[#5B00E8] cursor-pointer" />
        <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
          <span>200ms</span><span>10s</span>
        </div>
      </div>

      {/* ── Request Volume ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Requests / Month</Label>
          <ValueBadge>
            {requestVolume >= 1_000_000 ? `${(requestVolume / 1_000_000).toFixed(1)}M` : requestVolume >= 1000 ? `${(requestVolume / 1000).toFixed(0)}k` : requestVolume}
          </ValueBadge>
        </div>
        <input type="range" min={1000} max={1_000_000} step={1000} value={requestVolume}
          onChange={e => setRequestVolume(Number(e.target.value))}
          className="w-full accent-[#5B00E8] cursor-pointer" />
        <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
          <span>1k</span><span>1M</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* ── Team Size ── */}
        <div>
          <Label><span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 inline" /> Team Size</span></Label>
          <div className="grid grid-cols-2 gap-1.5">
            {TEAM_SIZES.map(s => (
              <button key={s} type="button" onClick={() => setTeamSize?.(s)}
                className="text-[11px] px-3 py-2 rounded-lg font-medium transition-all text-left"
                style={{
                  background: teamSize === s ? 'rgba(91,0,232,0.1)' : 'white',
                  border: `1.5px solid ${teamSize === s ? '#5B00E8' : 'rgba(91,0,232,0.15)'}`,
                  color: teamSize === s ? '#5B00E8' : '#374151',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Deployment Target ── */}
        <div>
          <Label><span className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 inline" /> Deployment</span></Label>
          <div className="grid grid-cols-2 gap-1.5">
            {DEPLOYMENTS.map(d => (
              <button key={d} type="button" onClick={() => setDeployment?.(d)}
                className="text-[11px] px-3 py-2 rounded-lg font-medium transition-all text-left"
                style={{
                  background: deployment === d ? 'rgba(91,0,232,0.1)' : 'white',
                  border: `1.5px solid ${deployment === d ? '#5B00E8' : 'rgba(91,0,232,0.15)'}`,
                  color: deployment === d ? '#5B00E8' : '#374151',
                }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Compliance ── */}
      <div>
        <Label>Compliance Requirements</Label>
        <div className="flex flex-wrap gap-2">
          {COMPLIANCE_OPTIONS.map(opt => {
            const active = compliance.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => toggleCompliance(opt)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: active ? 'rgba(91,0,232,0.12)' : '#F4F2FF',
                  border: `1.5px solid ${active ? '#5B00E8' : 'rgba(91,0,232,0.15)'}`,
                  color: active ? '#5B00E8' : '#6B7280',
                }}>
                {active && <span className="mr-1">✓</span>}{opt}
              </button>
            );
          })}
          <button type="button"
            onClick={() => setCompliance?.([])}
            className="text-[11px] px-3 py-1.5 rounded-full transition-all"
            style={{ background: compliance.length === 0 ? 'rgba(107,114,128,0.12)' : '#F4F2FF', border: '1.5px solid rgba(107,114,128,0.2)', color: '#6B7280' }}>
            None
          </button>
        </div>
      </div>

      {/* ── Language / Region ── */}
      <div>
        <Label><span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 inline" /> Language / Region</span></Label>
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map(r => (
            <button key={r} type="button" onClick={() => setRegion?.(r)}
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: region === r ? 'rgba(91,0,232,0.1)' : 'white',
                border: `1.5px solid ${region === r ? '#5B00E8' : 'rgba(91,0,232,0.15)'}`,
                color: region === r ? '#5B00E8' : '#374151',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Priority ── */}
      <div>
        <Label><span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 inline" /> Optimization Priority</span></Label>
        <div className="flex gap-2">
          {(['cost', 'latency', 'quality'] as const).map(p => {
            const labels = { cost: '💰 Cost', latency: '⚡ Latency', quality: '⭐ Quality' };
            return (
              <button key={p} type="button" onClick={() => setPriority?.(p)}
                className="flex-1 text-[12px] font-semibold py-2.5 rounded-xl transition-all"
                style={{
                  background: priority === p ? '#5B00E8' : 'white',
                  border: `1.5px solid ${priority === p ? '#5B00E8' : 'rgba(91,0,232,0.2)'}`,
                  color: priority === p ? 'white' : '#374151',
                  boxShadow: priority === p ? '0 2px 12px rgba(91,0,232,0.3)' : 'none',
                }}>
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Open Source Toggle ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#374151]">Prefer Open-Source Models</p>
          <p className="text-[11px] text-[#9CA3AF]">Prioritise Llama, Mistral, Qwen etc.</p>
        </div>
        <button type="button" onClick={() => setPreferOpenSource(!preferOpenSource)}
          className="relative w-11 h-6 rounded-full transition-colors"
          style={{ background: preferOpenSource ? '#5B00E8' : '#E5E7EB' }}>
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${preferOpenSource ? 'translate-x-5' : ''}`} />
        </button>
      </div>

    </div>
  );
}
