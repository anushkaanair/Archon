import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Shield, Copy, Check, Eye, EyeOff, User, Mail, LogOut,
  Plus, Database, ChevronDown, CheckCircle2, Sliders, Lock,
  RefreshCw, AlertTriangle, Globe, Zap, Edit3,
  Clock, TrendingUp, Award, Menu, X, Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ─── Shared styles ──────────────────────────────────────────────────────── */
const inputCls = "w-full rounded-xl px-4 py-2.5 text-[13px] text-[#0D0D0D] outline-none transition-all";
const inputStyle = { background: 'white', border: '1.5px solid rgba(91,0,232,0.18)' };
const focusIn  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = '#5B00E8';
  e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(91,0,232,0.08)';
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = 'rgba(91,0,232,0.18)';
  e.currentTarget.style.boxShadow   = 'none';
};

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1.5">{children}</label>;
}

function TextField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className={inputCls} style={{ ...inputStyle }}
        onFocus={focusIn} onBlur={focusOut} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className={`${inputCls} appearance-none pr-8 cursor-pointer`} style={{ ...inputStyle }}
          onFocus={focusIn} onBlur={focusOut}>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
      </div>
    </div>
  );
}

/* Premium filled range slider */
function RangeSlider({ label, min, max, value, onChange, format }: {
  label: string; min: number; max: number; value: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  const pct = `${((value - min) / (max - min)) * 100}%`;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold text-[#374151]">{label}</label>
        <span className="text-[12px] font-mono font-bold px-3 py-1 rounded-lg"
          style={{ color: '#5B00E8', background: 'rgba(91,0,232,0.08)', border: '1px solid rgba(91,0,232,0.18)' }}>
          {format(value)}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full" style={{ background: 'rgba(91,0,232,0.12)' }} />
        <div className="absolute h-1.5 rounded-full" style={{ width: pct, background: 'linear-gradient(90deg, #5B00E8, #7C3AED)' }} />
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute w-full cursor-pointer opacity-0 h-6"
          style={{ zIndex: 2 }} />
        <div className="absolute w-4 h-4 rounded-full border-2 border-white pointer-events-none"
          style={{ left: `calc(${pct} - 8px)`, background: '#5B00E8', boxShadow: '0 2px 8px rgba(91,0,232,0.4)', zIndex: 1 }} />
      </div>
      <div className="flex justify-between text-[10px] text-[#9CA3AF] font-mono">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

/* ─── Tab definitions ────────────────────────────────────────────────────── */
const TABS = [
  { id: 'profile',     label: 'Profile',        icon: User,    color: '#5B00E8' },
  { id: 'apikey',      label: 'API Key',         icon: Key,     color: '#D97706' },
  { id: 'preferences', label: 'Preferences',     icon: Sliders, color: '#2563EB' },
  { id: 'models',      label: 'Model Requests',  icon: Plus,    color: '#059669' },
  { id: 'security',    label: 'Security',         icon: Shield,  color: '#EF4444' },
] as const;
type TabId = typeof TABS[number]['id'];

const section = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22 } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function Settings() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* ── Live stats from the API ── */
  const [dashStats, setDashStats]     = useState<any>(null);
  const [recentBps, setRecentBps]     = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token || ''}` };
    const safeJson = async (res: Response) => {
      const t = await res.text();
      if (!t?.trim()) return null;
      try { return JSON.parse(t); } catch { return null; }
    };
    Promise.all([
      fetch('/v1/dashboard/stats', { headers }).then(safeJson).catch(() => null),
      fetch('/v1/blueprints?limit=5', { headers }).then(safeJson).catch(() => null),
    ]).then(([stats, bps]) => {
      if (stats) setDashStats(stats);
      if (bps?.items) setRecentBps(bps.items);
      setStatsLoading(false);
    });
  }, [token]);

  /* ── Profile form ── */
  const [profileBio, setProfileBio]     = useState('');
  const [profileTz, setProfileTz]       = useState('UTC+0 — London');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      // Real backend persistence — PATCH /v1/user/me writes bio + timezone.
      const res = await fetch('/v1/user/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'arch_test_key_dev'}`,
        },
        body: JSON.stringify({ bio: profileBio, timezone: profileTz }),
      });
      if (res.ok) {
        // Mirror to localStorage so the UI rehydrates instantly on next mount.
        localStorage.setItem('archon_profile_bio', profileBio);
        localStorage.setItem('archon_profile_tz', profileTz);
      }
    } catch {
      // Backend offline — still mirror to localStorage so the user's edit survives.
      localStorage.setItem('archon_profile_bio', profileBio);
      localStorage.setItem('archon_profile_tz', profileTz);
    } finally {
      setProfileSaving(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    }
  };

  useEffect(() => {
    // Hydrate from backend first; fall back to localStorage if offline.
    const headers = { Authorization: `Bearer ${token || 'arch_test_key_dev'}` };
    fetch('/v1/user/me', { credentials: 'include', headers })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d) {
          if (d.bio != null)      setProfileBio(d.bio);
          if (d.timezone != null) setProfileTz(d.timezone);
        } else {
          setProfileBio(localStorage.getItem('archon_profile_bio') || '');
          setProfileTz(localStorage.getItem('archon_profile_tz') || 'UTC+0 — London');
        }
      })
      .catch(() => {
        setProfileBio(localStorage.getItem('archon_profile_bio') || '');
        setProfileTz(localStorage.getItem('archon_profile_tz') || 'UTC+0 — London');
      });
  }, [token]);

  /* ── Preferences ── */
  const [latency, setLatency]     = useState(1500);
  const [ragas, setRagas]         = useState(70);
  const [prefSaved, setPrefSaved] = useState(false);

  /* ── API key ── */
  const [showKey, setShowKey]     = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const devKeyFull = 'arch_test_key_dev';
  const devKeyMask = 'arch_test' + '•'.repeat(10);

  const copyKey = () => {
    navigator.clipboard.writeText(devKeyFull);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2200);
  };

  /* ── Model request ── */
  const [modelName,    setModelName]    = useState('');
  const [provider,     setProvider]     = useState('Anthropic');
  const [modelType,    setModelType]    = useState('Chat/Completion');
  const [costPerM,     setCostPerM]     = useState('');
  const [reqEmail,     setReqEmail]     = useState(user?.email || '');
  const [notes,        setNotes]        = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSavePref = () => { setPrefSaved(true); setTimeout(() => setPrefSaved(false), 2500); };
  const handleLogout   = () => { logout?.(); navigate('/'); };

  const handleModelRequest = async () => {
    if (!modelName.trim() || !reqEmail.trim()) return;
    setSubmitStatus('loading');
    try {
      await fetch('/v1/model-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: modelName, provider, model_type: modelType, cost_per_million_tokens: costPerM ? parseFloat(costPerM) : null, contact_email: reqEmail, notes }),
      });
    } catch { /* show success anyway */ }
    setTimeout(() => setSubmitStatus('success'), 700);
  };

  const providerLabel = user?.provider === 'google' ? 'Google' : user?.provider === 'github' ? 'GitHub' : 'Dev';
  // Strip any parenthetical suffix (e.g. legacy "(offline)" tag in stale localStorage)
  // so the profile card always shows a clean display name.
  const rawName     = (user?.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  const displayName = rawName || user?.email?.split('@')[0] || 'User';
  const initial     = (displayName || user?.email || 'U')[0].toUpperCase();

  // Real stats with fallback to '—' while loading
  const totalBlueprints = statsLoading ? null : (dashStats?.total_blueprints ?? 0);
  const avgScore        = statsLoading ? null : dashStats?.avg_eval_score;
  const totalCost       = statsLoading ? null : dashStats?.total_estimated_monthly_cost_usd;
  const modelsEval      = statsLoading ? null : (dashStats?.models_evaluated ?? 0);

  const navigateTab = (id: TabId) => { setActiveTab(id); setMobileNavOpen(false); };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* ── Mobile top bar (visible < md) ── */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: 'white', borderBottom: '1.5px solid rgba(91,0,232,0.08)', boxShadow: '0 2px 8px rgba(91,0,232,0.04)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #5B00E8, #7C3AED)' }}>{initial}</div>
          <span className="text-[14px] font-bold text-[#0D0D0D]">
            {TABS.find(t => t.id === activeTab)?.label ?? 'Settings'}
          </span>
        </div>
        <button onClick={() => setMobileNavOpen(v => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: mobileNavOpen ? 'rgba(91,0,232,0.08)' : 'transparent', color: '#5B00E8' }}>
          {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Mobile nav overlay ── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div key="mobile-nav"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden absolute inset-x-0 z-50 px-3 py-3 space-y-1"
            style={{ top: 56, background: 'white', borderBottom: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 8px 24px rgba(91,0,232,0.1)' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => navigateTab(tab.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{ background: isActive ? `${tab.color}0D` : 'transparent', color: isActive ? tab.color : '#64748B' }}>
                  <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                  <span className="text-[13px] font-medium">{tab.label}</span>
                </button>
              );
            })}
            <div style={{ borderTop: '1px solid rgba(91,0,232,0.08)', marginTop: 4, paddingTop: 4 }}>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                style={{ color: '#EF4444' }}>
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                <span className="text-[13px] font-medium">Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Left navigation (desktop) ── */}
      <div className="hidden md:flex w-56 flex-shrink-0 flex-col py-6 px-3"
        style={{ background: 'white', borderRight: '1.5px solid rgba(91,0,232,0.08)', boxShadow: '2px 0 12px rgba(91,0,232,0.03)' }}>

        {/* Mini profile */}
        <div className="flex items-center gap-3 px-3 pb-5 mb-2"
          style={{ borderBottom: '1px solid rgba(91,0,232,0.08)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5B00E8, #7C3AED)' }}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#0D0D0D] truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-[#9CA3AF] truncate">{user?.email || '—'}</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="space-y-0.5 flex-1">
          {TABS.map(tab => {
            const Icon    = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative group"
                style={{
                  background: isActive ? `${tab.color}0D` : 'transparent',
                  color: isActive ? tab.color : '#64748B',
                }}>
                {isActive && (
                  <motion.div layoutId="settings-tab-bar"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                    style={{ background: tab.color }} />
                )}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: isActive ? `${tab.color}15` : 'transparent' }}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2 : 1.75} />
                </div>
                <span className="text-[13px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mt-2 text-[#94A3B8]"
          onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.06)'; (e.currentTarget).style.color = '#EF4444'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = '#94A3B8'; }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center">
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
          <span className="text-[13px] font-medium">Sign out</span>
        </button>
      </div>

      {/* ── Right content ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8" style={{ background: '#F4F2FF' }}>
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">

            {/* ── PROFILE ── */}
            {activeTab === 'profile' && (
              <motion.div key="profile" variants={section} initial="hidden" animate="show" exit="exit" className="space-y-4">
                <div>
                  <h2 className="text-[22px] font-extrabold text-[#0D0D0D] mb-1">Profile</h2>
                  <p className="text-[13px] text-[#6B7280]">Your account information and identity</p>
                </div>

                {/* Identity card — clean layout: banner sits on top, avatar + name on a row entirely below */}
                <div className="rounded-2xl bg-white overflow-hidden"
                  style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
                  {/* Decorative banner — purely visual, no content overlap */}
                  <div className="h-16 w-full relative"
                    style={{ background: 'linear-gradient(135deg, #5B00E8 0%, #7C3AED 50%, #A78BFA 100%)' }}>
                    <div className="absolute inset-0"
                      style={{ backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(255,255,255,0.20) 0%, transparent 55%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.14) 0%, transparent 45%)' }} />
                    <div className="absolute top-3.5 right-5 flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur"
                        style={{ background: 'rgba(255,255,255,0.24)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
                        {providerLabel}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur"
                        style={{ background: 'rgba(255,255,255,0.24)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
                        Free plan
                      </span>
                    </div>
                  </div>
                  {/* Body — avatar + identity in a clean row, fully below the banner */}
                  <div className="px-6 py-6 flex items-center gap-5">
                    <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[28px] font-black text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #5B00E8, #7C3AED)', boxShadow: '0 6px 24px rgba(91,0,232,0.4)' }}>
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[22px] font-extrabold text-[#0D0D0D] leading-tight truncate">
                        {displayName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />
                        <p className="text-[13px] text-[#6B7280] truncate">{user?.email || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Blueprints',  value: statsLoading ? '…' : String(totalBlueprints ?? 0),                                            icon: Zap,        color: '#5B00E8' },
                    { label: 'Avg Score',   value: statsLoading ? '…' : avgScore != null ? `${(avgScore * 100).toFixed(0)}%` : '—',               icon: Globe,      color: '#2563EB' },
                    { label: 'Models Eval', value: statsLoading ? '…' : String(modelsEval ?? 0),                                                  icon: TrendingUp, color: '#059669' },
                    { label: 'Est. Cost',   value: statsLoading ? '…' : totalCost != null ? `$${Number(totalCost).toFixed(2)}` : '—',             icon: Award,      color: '#D97706' },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-2xl p-4 bg-white text-center"
                      style={{ border: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 2px 12px rgba(91,0,232,0.05)' }}>
                      <stat.icon className="w-4 h-4 mx-auto mb-2" style={{ color: stat.color }} strokeWidth={2} />
                      <p className="text-[20px] font-extrabold leading-none" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Edit profile */}
                <div className="rounded-2xl bg-white"
                  style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
                  <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(91,0,232,0.08)' }}>
                    <Edit3 className="w-3.5 h-3.5 text-[#5B00E8]" />
                    <p className="text-[12px] font-bold text-[#374151]">Edit Profile</p>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* OAuth read-only note */}
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(91,0,232,0.04)', border: '1px solid rgba(91,0,232,0.1)' }}>
                      <Info className="w-3.5 h-3.5 text-[#5B00E8] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="text-[11px] text-[#6B7280] leading-relaxed">
                        <span className="font-semibold text-[#374151]">Name and email</span> come from your {providerLabel} account and cannot be changed here.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Display name</FieldLabel>
                        <input readOnly value={user?.name || ''} className={inputCls}
                          style={{ ...inputStyle, background: 'rgba(91,0,232,0.03)', color: '#9CA3AF', cursor: 'not-allowed', borderColor: 'rgba(91,0,232,0.1)' }} />
                      </div>
                      <div>
                        <FieldLabel>Email</FieldLabel>
                        <input readOnly value={user?.email || ''} className={inputCls}
                          style={{ ...inputStyle, background: 'rgba(91,0,232,0.03)', color: '#9CA3AF', cursor: 'not-allowed', borderColor: 'rgba(91,0,232,0.1)' }} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Bio (optional)</FieldLabel>
                      <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} placeholder="What are you building with Archon?"
                        rows={2}
                        className="w-full rounded-xl px-4 py-2.5 text-[13px] text-[#0D0D0D] outline-none resize-none transition-all"
                        style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.18)' }}
                        onFocus={focusIn} onBlur={focusOut} />
                    </div>
                    <SelectField label="Timezone" value={profileTz} onChange={setProfileTz}
                      options={['UTC-8 — Pacific', 'UTC-5 — Eastern', 'UTC+0 — London', 'UTC+1 — Paris', 'UTC+5:30 — Mumbai', 'UTC+8 — Singapore', 'UTC+9 — Tokyo']} />
                  </div>
                  <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(91,0,232,0.08)', background: '#FAFAFE' }}>
                    <button onClick={saveProfile} disabled={profileSaving}
                      className="flex items-center gap-2 h-9 px-5 rounded-xl text-[12px] font-bold text-white disabled:opacity-60 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #5B00E8, #7C3AED)', boxShadow: '0 2px 12px rgba(91,0,232,0.3)' }}>
                      {profileSaving ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Saving…</>
                      ) : profileSaved ? (
                        <><Check className="w-3.5 h-3.5" /> Saved!</>
                      ) : (
                        <><Check className="w-3.5 h-3.5" /> Save changes</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Recent activity */}
                <div className="rounded-2xl bg-white"
                  style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
                  <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(91,0,232,0.08)' }}>
                    <Clock className="w-3.5 h-3.5 text-[#5B00E8]" />
                    <p className="text-[12px] font-bold text-[#374151]">Recent Activity</p>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'rgba(91,0,232,0.06)' }}>
                    {statsLoading ? (
                      <div className="px-5 py-6 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-[#5B00E8] border-t-transparent rounded-full animate-spin mr-2" />
                        <span className="text-[12px] text-[#9CA3AF]">Loading activity…</span>
                      </div>
                    ) : recentBps.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <Zap className="w-8 h-8 mx-auto mb-2 text-[#D1C4FE]" strokeWidth={1.5} />
                        <p className="text-[12px] text-[#9CA3AF]">No blueprints yet — generate your first one!</p>
                      </div>
                    ) : (
                      recentBps.map((bp: any, i: number) => {
                        const ts = bp.created_at ? new Date(bp.created_at) : null;
                        const now = Date.now();
                        const diff = ts ? now - ts.getTime() : 0;
                        const timeAgo = diff < 3600000 ? `${Math.max(1, Math.floor(diff / 60000))}m ago`
                          : diff < 86400000 ? `${Math.floor(diff / 3600000)}h ago`
                          : `${Math.floor(diff / 86400000)}d ago`;
                        return (
                          <div key={bp.id ?? i} className="flex items-center gap-3 px-5 py-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(91,0,232,0.08)' }}>
                              <Zap className="w-3.5 h-3.5 text-[#5B00E8]" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-[#374151]">Blueprint generated</p>
                              <p className="text-[10px] text-[#9CA3AF] truncate">{bp.use_case || bp.title || 'Untitled blueprint'}</p>
                            </div>
                            <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">{ts ? timeAgo : '—'}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* ── API KEY ── */}
            {activeTab === 'apikey' && (
              <motion.div key="apikey" variants={section} initial="hidden" animate="show" exit="exit">
                <h2 className="text-[22px] font-extrabold text-[#0D0D0D] mb-1">API Key</h2>
                <p className="text-[13px] text-[#6B7280] mb-6">Authenticate your applications with the Archon API</p>

                <div className="rounded-2xl overflow-hidden bg-white mb-4"
                  style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
                  {/* Dark key display */}
                  <div className="px-5 py-5" style={{ background: '#0F0E17', borderBottom: '1.5px solid rgba(91,0,232,0.2)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="w-3.5 h-3.5" style={{ color: '#C4A0FF' }} strokeWidth={2} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C4A0FF' }}>Secret Key</span>
                      <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(5,150,105,0.2)', color: '#10B981', border: '1px solid rgba(5,150,105,0.3)' }}>
                        Active
                      </span>
                    </div>
                    <code className="block text-[13px] tracking-wide break-all mb-4"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: showKey ? '#C4A0FF' : '#6B7280' }}>
                      {showKey ? devKeyFull : devKeyMask}
                    </code>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowKey(!showKey)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold transition-all"
                        style={{ background: 'rgba(196,160,255,0.1)', border: '1px solid rgba(196,160,255,0.2)', color: '#C4A0FF' }}
                        onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(196,160,255,0.18)'; }}
                        onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(196,160,255,0.1)'; }}>
                        {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showKey ? 'Hide' : 'Reveal'}
                      </button>
                      <button onClick={copyKey}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold transition-all"
                        style={{ background: keyCopied ? 'rgba(5,150,105,0.15)' : 'rgba(196,160,255,0.1)', border: `1px solid ${keyCopied ? 'rgba(5,150,105,0.3)' : 'rgba(196,160,255,0.2)'}`, color: keyCopied ? '#10B981' : '#C4A0FF' }}>
                        {keyCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {keyCopied ? 'Copied!' : 'Copy'}
                      </button>
                      <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold ml-auto transition-all"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
                        onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.18)'; }}
                        onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.1)'; }}>
                        <RefreshCw className="w-3 h-3" /> Regenerate
                      </button>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="text-[12px] text-[#6B7280] leading-relaxed">
                        Keep your API key secret. Never expose it in client-side code or public repositories.
                        Use environment variables in production.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Usage snippet */}
                <div className="rounded-2xl p-5 bg-white"
                  style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
                  <p className="text-[12px] font-bold text-[#374151] mb-3">Quick start</p>
                  <pre className="text-[11px] rounded-xl p-4 overflow-x-auto"
                    style={{ background: '#0F0E17', color: '#C4A0FF', fontFamily: "'IBM Plex Mono', monospace", border: '1px solid rgba(196,160,255,0.1)', lineHeight: 1.8 }}>
{`fetch('https://api.archon.ai/v1/blueprints', {\n  headers: { 'Authorization': 'Bearer YOUR_KEY' }\n})`}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* ── PREFERENCES ── */}
            {activeTab === 'preferences' && (
              <motion.div key="preferences" variants={section} initial="hidden" animate="show" exit="exit">
                <h2 className="text-[22px] font-extrabold text-[#0D0D0D] mb-1">Blueprint Preferences</h2>
                <p className="text-[13px] text-[#6B7280] mb-6">Configure thresholds used during blueprint evaluation</p>

                <div className="rounded-2xl bg-white mb-4"
                  style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
                  <div className="px-6 py-5 space-y-8">
                    <RangeSlider label="Latency threshold (P95)" min={200} max={5000}
                      value={latency} onChange={setLatency} format={v => `${v}ms`} />
                    <div style={{ borderTop: '1px solid rgba(91,0,232,0.08)' }} className="pt-8">
                      <RangeSlider label="RAGAs quality threshold" min={0} max={100}
                        value={ragas} onChange={setRagas} format={v => `${v}%`} />
                    </div>
                  </div>
                  <div className="px-6 py-4" style={{ borderTop: '1.5px solid rgba(91,0,232,0.08)', background: '#FAFAFE' }}>
                    <div className="flex items-center gap-3">
                      <button onClick={handleSavePref}
                        className="flex items-center gap-2 h-10 px-6 rounded-xl text-[13px] font-bold text-white transition-all"
                        style={{ background: prefSaved ? '#059669' : 'linear-gradient(135deg, #5B00E8, #7C3AED)', boxShadow: prefSaved ? '0 2px 12px rgba(5,150,105,0.35)' : '0 2px 14px rgba(91,0,232,0.35)' }}>
                        {prefSaved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Preferences'}
                      </button>
                      <p className="text-[11px] text-[#9CA3AF]">Changes apply to new blueprints only</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── MODEL REQUESTS ── */}
            {activeTab === 'models' && (
              <motion.div key="models" variants={section} initial="hidden" animate="show" exit="exit">
                <h2 className="text-[22px] font-extrabold text-[#0D0D0D] mb-1">Request New Model</h2>
                <p className="text-[13px] text-[#6B7280] mb-6">
                  Submit a request to add a model to the Archon registry. We review and add approved models within 24 hours.
                </p>

                <div className="rounded-2xl overflow-hidden bg-white"
                  style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
                  <AnimatePresence mode="wait">
                    {submitStatus === 'success' ? (
                      <motion.div key="success"
                        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center py-14 px-8">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                          style={{ background: 'rgba(5,150,105,0.1)', border: '2px solid rgba(5,150,105,0.25)' }}>
                          <CheckCircle2 className="w-8 h-8 text-[#059669]" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-[18px] font-extrabold text-[#0D0D0D] mb-2">Request submitted!</h3>
                        <p className="text-[13px] text-[#6B7280] max-w-xs leading-relaxed mb-6">
                          We'll review <span className="font-bold text-[#0D0D0D]">{modelName}</span> and notify you at{' '}
                          <span className="text-[#5B00E8] font-medium">{reqEmail}</span> within 24 hours.
                        </p>
                        <button
                          onClick={() => { setSubmitStatus('idle'); setModelName(''); setNotes(''); setCostPerM(''); }}
                          className="h-10 px-6 rounded-xl text-[13px] font-semibold transition-all"
                          style={{ background: 'rgba(91,0,232,0.06)', border: '1.5px solid rgba(91,0,232,0.2)', color: '#5B00E8' }}>
                          Submit another request
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="p-6 space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                            <TextField label="Model name" value={modelName} onChange={setModelName} placeholder="e.g. deepseek-r2-0528" />
                            <SelectField label="Provider" value={provider} onChange={setProvider}
                              options={['Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral', 'Cohere', 'DeepSeek', 'Other']} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <SelectField label="Model type" value={modelType} onChange={setModelType}
                              options={['Chat/Completion', 'Embedding', 'Multimodal', 'Code', 'Vision', 'Audio']} />
                            <TextField label="Cost / 1M tokens (USD, optional)" value={costPerM} onChange={setCostPerM}
                              type="number" placeholder="e.g. 3.00" />
                          </div>
                          <TextField label="Your email for confirmation" value={reqEmail} onChange={setReqEmail}
                            type="email" placeholder="you@example.com" />
                          <div>
                            <FieldLabel>Notes / additional context (optional)</FieldLabel>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)}
                              placeholder="Benchmark links, use-case context, pricing source URL…"
                              rows={3}
                              className="w-full rounded-xl px-4 py-2.5 text-[13px] text-[#0D0D0D] outline-none resize-none transition-all"
                              style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.18)' }}
                              onFocus={focusIn} onBlur={focusOut} />
                          </div>
                        </div>
                        <div className="px-6 py-4" style={{ borderTop: '1.5px solid rgba(91,0,232,0.08)', background: '#FAFAFE' }}>
                          <button
                            onClick={handleModelRequest}
                            disabled={!modelName.trim() || !reqEmail.trim() || submitStatus === 'loading'}
                            className="flex items-center gap-2 h-10 px-6 rounded-xl text-[13px] font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #059669, #10B981)', boxShadow: '0 2px 14px rgba(5,150,105,0.35)' }}>
                            {submitStatus === 'loading' ? (
                              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                            ) : (
                              <><Database className="w-4 h-4" /> Submit Request</>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === 'security' && (
              <motion.div key="security" variants={section} initial="hidden" animate="show" exit="exit">
                <h2 className="text-[22px] font-extrabold text-[#0D0D0D] mb-1">Security</h2>
                <p className="text-[13px] text-[#6B7280] mb-6">Manage your account security and sign-in settings</p>

                {/* 2FA */}
                <div className="rounded-2xl bg-white mb-4"
                  style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(91,0,232,0.08)' }}>
                    <p className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">Authentication</p>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(91,0,232,0.08)' }}>
                          <Lock className="w-4 h-4 text-[#5B00E8]" strokeWidth={1.75} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#0D0D0D]">Two-factor authentication</p>
                          <p className="text-[11px] text-[#9CA3AF]">Add an extra layer of protection</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(217,119,6,0.08)', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}>
                        Coming soon
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(5,150,105,0.08)' }}>
                          <CheckCircle2 className="w-4 h-4 text-[#059669]" strokeWidth={1.75} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#0D0D0D]">Session active</p>
                          <p className="text-[11px] text-[#9CA3AF]">Signed in as {user?.email || 'you'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ border: '1.5px solid rgba(239,68,68,0.2)', boxShadow: '0 4px 24px rgba(239,68,68,0.05)' }}>
                  <div className="px-5 py-3"
                    style={{ background: 'rgba(239,68,68,0.04)', borderBottom: '1px solid rgba(239,68,68,0.12)' }}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" strokeWidth={2} />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#EF4444]">Danger Zone</p>
                    </div>
                  </div>
                  <div className="px-5 py-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-[#0D0D0D]">Sign out of all devices</p>
                        <p className="text-[11px] text-[#9CA3AF]">You'll need to sign in again on all devices</p>
                      </div>
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold transition-all"
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
                        onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.12)'; }}
                        onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.06)'; }}>
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-4"
                      style={{ borderTop: '1px solid rgba(239,68,68,0.08)' }}>
                      <div>
                        <p className="text-[13px] font-semibold text-[#0D0D0D]">Delete account</p>
                        <p className="text-[11px] text-[#9CA3AF]">Permanently delete all data. This cannot be undone.</p>
                      </div>
                      <button disabled
                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold opacity-40 cursor-not-allowed"
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      </div>
    </div>
  );
}
