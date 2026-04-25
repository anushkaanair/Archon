import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Cpu, BarChart3, Settings, FlaskConical,
  Hammer, ChevronLeft, ChevronRight, LogOut, User, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ArchonMark = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <polygon points="14,2 24,10 14,18 4,10" fill="#5B00E8" />
    <polygon points="14,2 4,10 14,10" fill="#1A0050" />
    <polygon points="14,2 24,10 14,10" fill="#8B3DFF" />
    <polygon points="4,10 14,18 14,10" fill="#2D0070" />
    <polygon points="24,10 14,18 14,10" fill="#C4A0FF" />
    <circle cx="14" cy="10" r="2.5" fill="#EDE5FF" opacity="0.7" />
  </svg>
);

const NAV = [
  { to: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { to: '/builder',    label: 'Builder',   icon: Hammer },
  { to: '/analytics',  label: 'Analytics', icon: BarChart3 },
  { to: '/playground', label: 'Playground',icon: FlaskConical },
  { to: '/settings',   label: 'Settings',  icon: Settings },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const pageTitle = NAV.find(n => location.pathname.startsWith(n.to))?.label ?? 'Archon';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex min-h-screen" style={{ background: '#F4F2FF' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col flex-shrink-0 relative z-20"
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid rgba(91,0,232,0.08)',
          boxShadow: '2px 0 16px rgba(91,0,232,0.04)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'rgba(91,0,232,0.08)', minHeight: 64 }}>
          <ArchonMark size={28} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="font-bold text-[15px] tracking-tight"
                style={{ color: '#5B00E8', fontFamily: 'Bricolage Grotesque, Inter, sans-serif' }}
              >
                Archon
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative"
                  style={{
                    background: active ? 'rgba(91,0,232,0.08)' : 'transparent',
                    color: active ? '#5B00E8' : '#64748B',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(91,0,232,0.04)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                      style={{ background: '#5B00E8' }}
                    />
                  )}
                  <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[13px] font-medium whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: 'rgba(91,0,232,0.08)' }}>
          {user && !collapsed && (
            <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(91,0,232,0.04)' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #5B00E8, #C4A0FF)' }}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#0D0D0D] truncate">{user.name || 'User'}</p>
                  <p className="text-[10px] text-[#94A3B8] truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[#94A3B8] hover:text-red-500"
            style={{}}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut size={16} strokeWidth={1.5} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[13px] font-medium">Sign out</motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 z-30"
          style={{ background: '#FFFFFF', border: '1px solid rgba(91,0,232,0.15)', color: '#5B00E8' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-0 border-b flex-shrink-0"
          style={{ height: 64, background: '#FFFFFF', borderColor: 'rgba(91,0,232,0.08)', boxShadow: '0 1px 8px rgba(91,0,232,0.04)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#5B00E8' }} />
            <h1 className="text-[15px] font-semibold" style={{ color: '#0D0D0D' }}>{pageTitle}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #5B00E8, #C4A0FF)' }}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="text-[13px] font-medium" style={{ color: '#334155' }}>{user.name || user.email}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto" style={{ background: '#F4F2FF' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
