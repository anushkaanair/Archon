import { Key, Shield, Wallet } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Platform Settings</h1>
        <p className="text-white/50 text-sm">Manage API keys, team access, and billing preferences.</p>
      </header>

      <div className="max-w-4xl space-y-6">
        <section className="bg-surface/80 border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <Key className="w-5 h-5 text-archon-mist" />
            <h2 className="text-lg font-medium text-white">API Keys</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Production Key</p>
                <p className="text-xs text-white/50 font-mono mt-1">arch_prod_hk9x...j3q2</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-surface border border-white/10 hover:bg-white/5 rounded text-xs font-medium text-white transition-colors">Copy</button>
                <button className="px-3 py-1.5 bg-semantic-danger/10 hover:bg-semantic-danger/20 text-semantic-danger rounded text-xs font-medium transition-colors">Revoke</button>
              </div>
            </div>
            <button className="px-4 py-2 bg-archon-core hover:bg-archon-bright rounded-lg text-sm font-medium text-white transition-colors shadow-[0_0_15px_rgba(83,74,183,0.2)]">
              + Generate New Key
            </button>
          </div>
        </section>

        <section className="bg-surface/80 border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-archon-mist" />
              <h2 className="text-lg font-medium text-white">Routing Thresholds</h2>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Maximum P95 Latency (Fallback Trigger)</label>
              <div className="flex items-center gap-4">
                <input type="range" className="w-full accent-archon-core" min="0" max="5000" defaultValue="1500" />
                <span className="text-xs text-white/50 font-mono bg-white/5 px-2 py-1 rounded">1500ms</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">RAGAs Confidence Threshold</label>
              <div className="flex items-center gap-4">
                <input type="range" className="w-full accent-archon-core" min="0" max="100" defaultValue="70" />
                <span className="text-xs text-white/50 font-mono bg-white/5 px-2 py-1 rounded">0.70</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed max-w-2xl">
                Responses scoring below this threshold will automatically be sent to GPT-4o for regeneration.
              </p>
            </div>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors">
              Save Routing Rules
            </button>
          </div>
        </section>

        <section className="bg-surface/80 border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-archon-mist" />
              <h2 className="text-lg font-medium text-white">Billing</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-white">Current Plan: Enterprise (Usage Based)</p>
                <p className="text-xs text-white/50 mt-1">Next invoice on Apr 1, 2026</p>
              </div>
              <button className="px-4 py-2 bg-surface hover:bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                Manage Billing
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
