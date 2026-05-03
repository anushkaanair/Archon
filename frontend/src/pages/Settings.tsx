import { useState } from 'react';
import { Key, Shield, Copy, Check, Eye, EyeOff, User, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LiveSlider({ label, min, max, value, onChange, format }: {
  label: string; min: number; max: number; value: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-medium text-white/65">{label}</label>
        <span className="text-[12px] font-mono px-2.5 py-1 rounded-lg"
          style={{ color: '#C4A0FF', background: 'rgba(91,0,232,0.12)', border: '0.5px solid rgba(91,0,232,0.2)' }}>
          {format(value)}
        </span>
      </div>
      <input type="range" className="w-full accent-archon-core cursor-pointer" min={min} max={max}
        value={value} onChange={e => onChange(Number(e.target.value))} />
      <div className="flex justify-between text-[10px] text-white/20">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
      style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', color: copied ? '#00A854' : 'rgba(255,255,255,0.55)' }}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function SectionCard({ icon: Icon, iconColor, title, children }: {
  icon: any; iconColor: string; title: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.018)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${iconColor}15`, border: `0.5px solid ${iconColor}30` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} strokeWidth={1.5} />
        </div>
        <h2 className="text-[14px] font-semibold text-white">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [latencyThreshold, setLatencyThreshold] = useState(1500);
  const [ragasThreshold, setRagasThreshold]     = useState(70);
  const [showKey, setShowKey]                   = useState(false);
  const [saved, setSaved]                       = useState(false);

  const devKey     = 'arch_dev_••••••••••••j3q2';
  const devKeyFull = 'arch_dev_hk9xm2pq7r8sj3q2';

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleLogout = () => { logout?.(); navigate('/'); };

  const providerLabel = user?.provider === 'google' ? 'Google' : user?.provider === 'github' ? 'GitHub' : 'Local';
  const providerColor = user?.provider === 'google' ? '#EA4335' : user?.provider === 'github' ? '#8B3DFF' : '#00A854';

  return (
    <div className="space-y-8 animate-in">

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden px-8 py-8 bg-grid-dark"
        style={{ background: 'rgba(91,0,232,0.03)', border: '0.5px solid rgba(91,0,232,0.12)' }}>
        <div className="absolute top-0 right-1/3 w-72 h-28 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(91,0,232,0.15) 0%, transparent 70%)' }} />
        <div className="relative">
          <h1 className="font-display text-[28px] font-extrabold tracking-tight text-white mb-2">Settings</h1>
          <p className="text-[13px] text-white/40">Manage your account, API keys, and routing preferences.</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-5">

        {/* ── Profile ── */}
        {user && (
          <SectionCard icon={User} iconColor="#8B3DFF" title="Profile">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name || 'avatar'}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  style={{ border: '2px solid rgba(91,0,232,0.3)' }} />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #5B00E8, #C4A0FF)' }}>
                  {(user.name || user.email || 'A')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[15px] font-semibold text-white">{user.name || 'User'}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${providerColor}15`, color: providerColor, border: `0.5px solid ${providerColor}30` }}>
                    {providerLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-white/40">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </div>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.07)', border: '0.5px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.7)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.7)'; }}>
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── API Keys ── */}
        <SectionCard icon={Key} iconColor="#C4A0FF" title="API Keys">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white mb-0.5">Development Key</p>
                <p className="text-[12px] font-mono text-white/35">
                  {showKey ? devKeyFull : devKey}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <button onClick={() => setShowKey(!showKey)}
                  className="p-2 rounded-lg text-white/30 hover:text-white/70 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <CopyButton text={devKeyFull} />
                <button className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.18)', color: '#EF9595' }}>
                  Revoke
                </button>
              </div>
            </div>

            <button className="flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #5B00E8, #7B3DFF)', border: '0.5px solid rgba(91,0,232,0.5)', boxShadow: '0 0 16px rgba(91,0,232,0.25)' }}>
              + Generate New Key
            </button>

            <p className="text-[11px] text-white/25 leading-relaxed">
              API keys grant access to all Archon endpoints. Keep them secret — they are equivalent to passwords.
            </p>
          </div>
        </SectionCard>

        {/* ── Routing Thresholds ── */}
        <SectionCard icon={Shield} iconColor="#00A854" title="Routing Thresholds">
          <div className="space-y-6">
            <LiveSlider
              label="Maximum P95 Latency (fallback trigger)"
              min={200} max={5000} value={latencyThreshold}
              onChange={setLatencyThreshold} format={v => `${v}ms`}
            />
            <LiveSlider
              label="RAGAs Confidence Threshold"
              min={0} max={100} value={ragasThreshold}
              onChange={setRagasThreshold} format={v => (v / 100).toFixed(2)}
            />
            <p className="text-[11px] text-white/30 leading-relaxed">
              Blueprints scoring below the RAGAs threshold are flagged as low confidence.
            </p>
            <button onClick={handleSave}
              className="flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-white transition-all"
              style={saved
                ? { background: 'rgba(0,168,84,0.15)', border: '0.5px solid rgba(0,168,84,0.3)', color: '#00A854' }
                : { background: 'linear-gradient(135deg, #5B00E8, #7B3DFF)', border: '0.5px solid rgba(91,0,232,0.5)', boxShadow: '0 0 16px rgba(91,0,232,0.25)' }
              }>
              {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : 'Save Preferences'}
            </button>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
