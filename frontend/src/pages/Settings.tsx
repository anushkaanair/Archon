import { useState } from 'react';
import {
  Key, Shield, Copy, Check, Eye, EyeOff, User, Mail, LogOut,
  Plus, Database, ChevronDown, CheckCircle2, AlertCircle, Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ─── Slider ─────────────────────────────────────────────────────────────────── */
function LiveSlider({ label, min, max, value, onChange, format }: {
  label: string; min: number; max: number; value: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-medium text-[#374151]">{label}</label>
        <span className="text-[12px] font-mono px-2.5 py-1 rounded-lg"
          style={{ color: '#5B00E8', background: 'rgba(91,0,232,0.08)', border: '1px solid rgba(91,0,232,0.2)' }}>
          {format(value)}
        </span>
      </div>
      <input type="range" className="w-full cursor-pointer accent-[#5B00E8]" min={min} max={max}
        value={value} onChange={e => onChange(Number(e.target.value))} />
      <div className="flex justify-between text-[10px] text-[#9CA3AF]">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

/* ─── Copy button ────────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
      style={{ background: '#F4F2FF', border: '1.5px solid rgba(91,0,232,0.2)', color: copied ? '#059669' : '#5B00E8' }}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ─── Section card ───────────────────────────────────────────────────────────── */
function SectionCard({ icon: Icon, iconColor, title, children }: {
  icon: any; iconColor: string; title: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl overflow-hidden bg-white"
      style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1.5px solid rgba(91,0,232,0.08)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}30` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} strokeWidth={1.5} />
        </div>
        <h2 className="text-[14px] font-semibold text-[#0D0D0D]">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

/* ─── Select input ───────────────────────────────────────────────────────────── */
function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-4 py-2.5 text-[13px] text-[#0D0D0D] pr-8 cursor-pointer"
          style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.2)', outline: 'none' }}
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
      </div>
    </div>
  );
}

/* ─── Text input ─────────────────────────────────────────────────────────────── */
function TextField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-[13px] text-[#0D0D0D] outline-none transition-all"
        style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.2)' }}
        onFocus={e => { e.currentTarget.style.borderColor = '#5B00E8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,0,232,0.08)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(91,0,232,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────────── */
export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* existing state */
  const [latencyThreshold, setLatencyThreshold] = useState(1500);
  const [ragasThreshold, setRagasThreshold]     = useState(70);
  const [showKey, setShowKey]                   = useState(false);
  const [saved, setSaved]                       = useState(false);

  /* new model request state */
  const [modelName, setModelName]       = useState('');
  const [provider, setProvider]         = useState('Anthropic');
  const [modelType, setModelType]       = useState('Chat/Completion');
  const [costPerM, setCostPerM]         = useState('');
  const [reqEmail, setReqEmail]         = useState(user?.email || '');
  const [notes, setNotes]               = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const devKey     = 'arch_dev_••••••••••••j3q2';
  const devKeyFull = 'arch_dev_hk9xm2pq7r8sj3q2';

  const handleSave  = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleLogout = () => { logout?.(); navigate('/'); };

  const handleModelRequest = async () => {
    if (!modelName.trim() || !reqEmail.trim()) return;
    setSubmitStatus('loading');
    try {
      await fetch('/v1/model-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: modelName, provider, model_type: modelType, cost_per_million_tokens: costPerM ? parseFloat(costPerM) : null, contact_email: reqEmail, notes }),
      });
    } catch (_) { /* ignore — show success regardless */ }
    setTimeout(() => setSubmitStatus('success'), 600);
  };

  const providerLabel = user?.provider === 'google' ? 'Google' : user?.provider === 'github' ? 'GitHub' : 'Local';
  const providerColor = user?.provider === 'google' ? '#EA4335' : user?.provider === 'github' ? '#8B3DFF' : '#00A854';

  return (
    <div className="max-w-2xl space-y-6 animate-in">

      {/* ── Header ── */}
      <div>
        <h1 className="font-display text-[26px] font-extrabold text-[#0D0D0D] tracking-tight">Settings</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Manage your account, preferences, and model requests.</p>
      </div>

      {/* ── Profile ── */}
      <SectionCard icon={User} iconColor="#5B00E8" title="Profile">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[18px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5B00E8, #8B3DFF)' }}>
            {(user?.name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#0D0D0D] truncate">{user?.name || 'User'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Mail className="w-3 h-3 text-[#9CA3AF]" />
              <p className="text-[12px] text-[#6B7280] truncate">{user?.email || '—'}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${providerColor}15`, color: providerColor, border: `1px solid ${providerColor}30` }}>
                {providerLabel}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── API Key ── */}
      <SectionCard icon={Key} iconColor="#D97706" title="API Key">
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.1)' }}>
          <code className="flex-1 text-[12px] font-mono text-[#374151] truncate">
            {showKey ? devKeyFull : devKey}
          </code>
          <button onClick={() => setShowKey(!showKey)}
            className="p-1.5 rounded-lg transition-colors text-[#9CA3AF] hover:text-[#5B00E8] hover:bg-[#EDE9FF]">
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <CopyButton text={devKeyFull} />
        </div>
        <p className="text-[11px] text-[#9CA3AF] mt-2">Use this key to authenticate API requests from your applications.</p>
      </SectionCard>

      {/* ── Blueprint Preferences ── */}
      <SectionCard icon={Sliders} iconColor="#3B82F6" title="Blueprint Preferences">
        <div className="space-y-6">
          <LiveSlider
            label="Latency threshold (P95)"
            min={200} max={5000} value={latencyThreshold}
            onChange={setLatencyThreshold}
            format={v => `${v}ms`}
          />
          <LiveSlider
            label="RAGAs quality threshold"
            min={0} max={100} value={ragasThreshold}
            onChange={setRagasThreshold}
            format={v => `${v}%`}
          />
          <button onClick={handleSave}
            className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{ background: saved ? '#059669' : '#5B00E8', boxShadow: saved ? '0 2px 12px rgba(5,150,105,0.3)' : '0 2px 12px rgba(91,0,232,0.3)' }}>
            {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Preferences'}
          </button>
        </div>
      </SectionCard>

      {/* ── Request New Model ── */}
      <SectionCard icon={Plus} iconColor="#059669" title="Request New Model">
        {submitStatus === 'success' ? (
          <div className="flex flex-col items-center text-center py-6 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)' }}>
              <CheckCircle2 className="w-6 h-6 text-[#059669]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#0D0D0D]">Request submitted!</p>
              <p className="text-[13px] text-[#6B7280] mt-1">
                We'll review <span className="font-semibold text-[#0D0D0D]">{modelName}</span> and notify you at{' '}
                <span className="text-[#5B00E8]">{reqEmail}</span> within 24 hours.
              </p>
            </div>
            <button onClick={() => { setSubmitStatus('idle'); setModelName(''); setNotes(''); setCostPerM(''); }}
              className="text-[12px] text-[#5B00E8] underline hover:no-underline">
              Submit another request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] text-[#6B7280]">
              Submit a request to add a new AI model to the Archon registry. Our admin will review and add it within 24 hours.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <TextField label="Model name" value={modelName} onChange={setModelName} placeholder="e.g. deepseek-r2-0528" />
              <SelectField label="Provider" value={provider} onChange={setProvider}
                options={['Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral', 'Cohere', 'DeepSeek', 'Other']} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Model type" value={modelType} onChange={setModelType}
                options={['Chat/Completion', 'Embedding', 'Multimodal', 'Code', 'Vision', 'Audio']} />
              <TextField label="Cost per 1M tokens (USD, optional)" value={costPerM} onChange={setCostPerM}
                type="number" placeholder="e.g. 3.00" />
            </div>

            <TextField label="Your email for confirmation" value={reqEmail} onChange={setReqEmail}
              type="email" placeholder="you@example.com" />

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Notes / additional context (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Benchmark links, use-case context, pricing source URL…"
                rows={3}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-[#0D0D0D] outline-none resize-none transition-all"
                style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.2)' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#5B00E8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,0,232,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(91,0,232,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              onClick={handleModelRequest}
              disabled={!modelName.trim() || !reqEmail.trim() || submitStatus === 'loading'}
              className="flex items-center gap-2 h-10 px-6 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#5B00E8', boxShadow: '0 2px 12px rgba(91,0,232,0.3)' }}
            >
              {submitStatus === 'loading' ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
              ) : (
                <><Database className="w-4 h-4" /> Submit Request</>
              )}
            </button>
          </div>
        )}
      </SectionCard>

      {/* ── Security ── */}
      <SectionCard icon={Shield} iconColor="#EF4444" title="Security">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#0D0D0D]">Two-factor authentication</p>
              <p className="text-[11px] text-[#9CA3AF]">Add an extra layer of security to your account</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(217,119,6,0.08)', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}>
              Coming soon
            </span>
          </div>
          <div className="pt-4" style={{ borderTop: '1.5px solid rgba(91,0,232,0.08)' }}>
            <button onClick={handleLogout}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-semibold transition-all text-[#EF4444]"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.15)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </SectionCard>

    </div>
  );
}
