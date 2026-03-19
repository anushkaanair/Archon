import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

const ArchonLogoFull = () => (
  <div className="relative flex items-center justify-center w-[120px] h-[120px] mx-auto text-white group scale-75 md:scale-100 mb-8">
    <div className="absolute rounded-full border-[0.5px] border-archon-core/20 w-[110px] h-[110px] animate-pulse [animation-delay:0s]" />
    <div className="absolute rounded-full border-[0.5px] border-archon-core/20 w-[80px] h-[80px] animate-pulse [animation-delay:1s]" />
    <div className="absolute w-[60px] h-[60px] rounded-full bg-archon-core/20 blur-[20px] animate-glowPulse" />
    
    <div className="relative z-10 drop-shadow-[0_0_28px_rgba(83,74,183,0.55)]">
      <svg width="60" height="60" viewBox="0 0 80 80" className="drop-shadow-lg">
        <polygon points="40,6 70,30 40,54 10,30" fill="#534AB7"/>
        <polygon points="40,6 10,30 40,30" fill="#26215C"/>
        <polygon points="40,6 70,30 40,30" fill="#7F77DD"/>
        <polygon points="10,30 40,54 40,30" fill="#3C3489"/>
        <polygon points="70,30 40,54 40,30" fill="#AFA9EC"/>
        <circle cx="40" cy="30" r="5" fill="#EEEDFE" opacity="0.45"/>
      </svg>
    </div>
  </div>
)

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-6 text-white selection:bg-archon-core/30">
      <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-archon-core/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[0%] w-[500px] h-[500px] bg-[#3C3489]/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="block">
          <ArchonLogoFull />
        </Link>
        
        <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in to Archon</h2>
            <p className="text-white/50 text-sm mt-2">Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                autoComplete="email" 
                required 
                className="w-full bg-[#110e1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-archon-core focus:ring-1 focus:ring-archon-core/50 transition-all placeholder:text-white/20 text-white"
                placeholder="developer@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                required 
                className="w-full bg-[#110e1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-archon-core focus:ring-1 focus:ring-archon-core/50 transition-all placeholder:text-white/20 text-white"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="rounded border-white/20 bg-surface text-archon-core focus:ring-archon-core focus:ring-offset-background" />
                <span className="text-white/60 group-hover:text-white transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-archon-mist hover:text-white transition-colors">Forgot password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 bg-archon-core hover:bg-archon-bright hover:-translate-y-0.5 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(83,74,183,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
