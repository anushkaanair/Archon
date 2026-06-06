import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ArchonMark from '../components/ui/ArchonMark';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

export default function Login() {
  // OAuth — redirect to backend OAuth flow
  const handleOAuth = (provider: 'google' | 'github') => {
    window.location.href = `/auth/${provider}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-light opacity-100 pointer-events-none" />

      {/* Violet glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(91,0,232,0.08), transparent 70%)' }}
      />

      {/* Back link */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-[13px] font-medium transition-colors hover:text-[#5B00E8]"
        style={{ color: 'rgba(91,0,232,0.6)' }}
      >
        <ArchonMark size={16} />
        <span>Archon</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#fff',
            border: '1.5px solid var(--card-border)',
            boxShadow: '0 8px 48px rgba(91,0,232,0.1)',
          }}
        >
          <div className="p-8">
            {/* Logo + title */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div
                  className="absolute inset-0 rounded-full blur-xl animate-glowPulse"
                  style={{ background: 'rgba(91,0,232,0.2)' }}
                />
                <div className="relative">
                  <svg width="56" height="56" viewBox="0 0 80 80" aria-hidden="true">
                    <polygon points="40,6 70,30 40,54 10,30" fill="#5B00E8" />
                    <polygon points="40,6 10,30 40,30" fill="#1A0050" />
                    <polygon points="40,6 70,30 40,30" fill="#8B3DFF" />
                    <polygon points="10,30 40,54 40,30" fill="#2D0070" />
                    <polygon points="70,30 40,54 40,30" fill="#C4A0FF" />
                    <circle cx="40" cy="30" r="5" fill="#EDE5FF" opacity="0.8" />
                  </svg>
                </div>
              </div>
              <h1
                className="text-[22px] font-bold tracking-tight"
                style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text-primary)' }}
              >
                Welcome to Archon
              </h1>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                Sign in to design AI systems that ship
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleOAuth('google')}
                className="w-full h-11 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-3 transition-all hover:border-[rgba(91,0,232,0.35)] hover:shadow-[0_2px_12px_rgba(91,0,232,0.08)]"
                style={{
                  background: '#fff',
                  border: '1.5px solid rgba(13,13,13,0.15)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <button
                onClick={() => handleOAuth('github')}
                className="w-full h-11 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-3 transition-all hover:bg-[#1a1a1a]"
                style={{
                  background: 'var(--text-primary)',
                  border: '1.5px solid var(--text-primary)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(13,13,13,0.2)',
                }}
              >
                <GitHubIcon />
                Continue with GitHub
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-5 text-[12px]" style={{ color: 'rgba(13,13,13,0.4)' }}>
          By continuing, you agree to our{' '}
          <span className="text-[#5B00E8]">Terms</span>
          {' '}and{' '}
          <span className="text-[#5B00E8]">Privacy Policy</span>
        </p>

        {/* Feature badges — real capability descriptions, no fake numbers */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {[
            { icon: '⚡', label: 'Blueprint in seconds' },
            { icon: '🧠', label: '9+ models ranked' },
            { icon: '🔬', label: 'Visual Playground' },
            { icon: '📊', label: 'RAGAs evaluation' },
          ].map(f => (
            <div key={f.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
              style={{ background: 'rgba(91,0,232,0.06)', border: '1px solid rgba(91,0,232,0.12)', color: 'rgba(91,0,232,0.7)' }}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
