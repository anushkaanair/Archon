import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const ArchonMark = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <polygon points="14,2 24,10 14,18 4,10" fill="#534AB7" />
    <polygon points="14,2 4,10 14,10"  fill="#26215C" />
    <polygon points="14,2 24,10 14,10" fill="#7F77DD" />
    <polygon points="4,10 14,18 14,10" fill="#3C3489" />
    <polygon points="24,10 14,18 14,10" fill="#AFA9EC" />
    <circle cx="14" cy="10" r="2.5" fill="#EEEDFE" opacity="0.6" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail]   = useState('');
  const [pw, setPw]         = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login('arch_test_key_dev', { id: 'admin-123', email: email || 'developer@example.com', name: 'Archon Admin' });
      navigate('/dashboard');
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-[#07060e] relative flex items-center justify-center p-6 overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-25"
          style={{ maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%,black,transparent)' }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
          bg-[radial-gradient(circle,rgba(83,74,183,0.14),transparent_65%)]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px]
          bg-[radial-gradient(circle,rgba(40,33,92,0.1),transparent)]" />
      </div>

      {/* Back to home */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-[13px] text-white/35 hover:text-white/70 transition-colors">
        <ArchonMark size={16} />
        <span>Archon</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* Card */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.028)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05) inset',
          }}>

          {/* Top beam */}
          <div className="h-px border-beam" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-archon-core/30 blur-xl animate-glowPulse" />
                <div className="relative">
                  <svg width="56" height="56" viewBox="0 0 80 80">
                    <polygon points="40,6 70,30 40,54 10,30" fill="#534AB7" />
                    <polygon points="40,6 10,30 40,30" fill="#26215C" />
                    <polygon points="40,6 70,30 40,30" fill="#7F77DD" />
                    <polygon points="10,30 40,54 40,30" fill="#3C3489" />
                    <polygon points="70,30 40,54 40,30" fill="#AFA9EC" />
                    <circle cx="40" cy="30" r="5" fill="#EEEDFE" opacity="0.5" />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-white">Welcome back</h1>
              <p className="text-[13px] text-white/40 mt-1">Sign in to your Archon workspace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="you@company.com"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-[11px] text-archon-mist/70 hover:text-archon-mist transition-colors">Forgot?</a>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    required
                    className="input-field pr-11"
                    placeholder="••••••••••"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <div className="relative">
                  <input type="checkbox"
                    className="sr-only peer" />
                  <div className="w-4 h-4 rounded border border-white/15 bg-white/5 peer-checked:bg-archon-core peer-checked:border-archon-core transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <span className="text-[13px] text-white/45 group-hover:text-white/60 transition-colors">Keep me signed in</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold text-[14px] text-white flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-60"
                style={{
                  background: loading ? 'rgba(83,74,183,0.5)' : 'linear-gradient(135deg,#534AB7,#7F77DD)',
                  boxShadow: loading ? 'none' : '0 0 24px rgba(83,74,183,0.4)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0d0b19] px-3 text-[11px] text-white/25">Demo mode</span>
              </div>
            </div>

            {/* Demo hint */}
            <p className="text-center text-[12px] text-white/30 leading-relaxed">
              Any credentials work in demo mode. The platform uses<br />
              API-key authentication — configured in <code className="text-archon-mist/60 bg-white/5 px-1 rounded">.env</code>
            </p>
          </div>
        </div>

        {/* Bottom link */}
        <p className="text-center mt-5 text-[13px] text-white/30">
          New to Archon?{' '}
          <Link to="/login" className="text-archon-mist hover:text-white transition-colors font-medium">
            Request access
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
