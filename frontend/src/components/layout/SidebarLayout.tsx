import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Settings, FlaskConical,
  Hammer, ChevronLeft, ChevronRight, LogOut, Sparkles, Menu, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../ui/Tooltip';
import ArchonMark from '../ui/ArchonMark';

const NAV = [
  { to: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { to: '/builder',    label: 'Builder',   icon: Hammer,          badge: null },
  { to: '/analytics',  label: 'Analytics', icon: BarChart3,       badge: null },
  { to: '/playground', label: 'Playground',icon: FlaskConical,    badge: 'NEW' },
  { to: '/settings',   label: 'Settings',  icon: Settings,        badge: null },
];

/* ─── Sidebar nav items (shared between desktop + mobile) ─────────────────── */
function NavItems({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();

  return (
    <>
      {NAV.map(({ to, label, icon: Icon, badge }) => {
        const active = location.pathname.startsWith(to);
        const item = (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
          >
            <motion.div
              whileHover={{ x: collapsed ? 0 : 2 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative"
              style={{
                background: active ? 'rgba(91,0,232,0.09)' : 'transparent',
                color: active ? '#5B00E8' : '#64748B',
                boxShadow: active ? 'inset 0 0 0 1px rgba(91,0,232,0.12)' : 'none',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(91,0,232,0.05)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                  style={{ background: 'linear-gradient(180deg, #5B00E8, #8B3DFF)' }}
                />
              )}
              <Icon size={18} strokeWidth={active ? 2.25 : 1.6} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[13px] font-medium whitespace-nowrap flex-1"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Badge — shown only when expanded */}
              {badge && !collapsed && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-wide"
                  style={{ background: 'linear-gradient(135deg, #5B00E8, #8B3DFF)', color: 'white' }}
                >
                  {badge}
                </motion.span>
              )}
            </motion.div>
          </Link>
        );

        // Wrap with Tooltip when collapsed so label is still accessible
        return collapsed ? (
          <Tooltip key={to} content={label} placement="right">
            {item}
          </Tooltip>
        ) : item;
      })}
    </>
  );
}

/* ─── Main layout ─────────────────────────────────────────────────────────── */
export default function SidebarLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  // Close mobile drawer on wide viewport
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  // Derive page title from current path
  const pageTitle = (() => {
    const match = NAV.find(n => location.pathname.startsWith(n.to));
    if (match) return match.label;
    if (location.pathname.startsWith('/blueprints/')) return 'Blueprint Detail';
    return 'Archon';
  })();

  return (
    <div className="flex min-h-screen" style={{ background: '#F4F2FF' }}>

      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 z-40 flex flex-col md:hidden"
            style={{
              width: 240,
              background: '#FFFFFF',
              borderRight: '1px solid rgba(91,0,232,0.08)',
              boxShadow: '4px 0 24px rgba(91,0,232,0.08)',
            }}
          >
            {/* Mobile drawer header */}
            <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: 'rgba(91,0,232,0.08)', minHeight: 64 }}>
              <div className="flex items-center gap-3">
                <ArchonMark size={24} />
                <span className="font-bold text-[15px] tracking-tight" style={{ color: '#5B00E8', fontFamily: 'Bricolage Grotesque, Inter, sans-serif' }}>
                  Archon
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#374151] transition-colors"
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mobile nav */}
            <nav className="flex-1 py-3 px-2 space-y-0.5" aria-label="Main navigation">
              <NavItems collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </nav>

            {/* Mobile user + logout */}
            <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: 'rgba(91,0,232,0.08)' }}>
              {user && (
                <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(91,0,232,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: 'linear-gradient(135deg, #5B00E8, #C4A0FF)' }}>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name || 'User'}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[#9CA3AF] hover:text-red-500 hover:bg-red-50"
              >
                <LogOut size={16} strokeWidth={1.5} />
                <span className="text-[13px] font-medium">Sign out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col flex-shrink-0 relative z-20"
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
        <nav className="flex-1 py-3 px-2 space-y-0.5" aria-label="Main navigation">
          <NavItems collapsed={collapsed} />
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
                  <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name || 'User'}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
              </div>
            </div>
          )}
          <Tooltip content="Sign out" placement="right">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[#9CA3AF] hover:text-red-500 hover:bg-red-50"
              aria-label="Sign out"
            >
              <LogOut size={16} strokeWidth={1.5} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[13px] font-medium">Sign out</motion.span>
                )}
              </AnimatePresence>
            </button>
          </Tooltip>
        </div>

        {/* Collapse toggle */}
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 z-30"
            style={{ background: '#FFFFFF', border: '1px solid rgba(91,0,232,0.15)', color: '#5B00E8' }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </Tooltip>
      </motion.aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-4 md:px-6 py-0 border-b flex-shrink-0"
          style={{ height: 64, background: '#FFFFFF', borderColor: 'rgba(91,0,232,0.08)', boxShadow: '0 1px 8px rgba(91,0,232,0.04)' }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[rgba(91,0,232,0.06)]"
            aria-label="Open navigation"
            style={{ color: '#5B00E8' }}
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(91,0,232,0.08)' }}>
              <Sparkles size={13} style={{ color: '#5B00E8' }} />
            </div>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium" style={{ color: 'rgba(10,0,37,0.35)' }}>Archon</span>
              <span className="text-[12px]" style={{ color: 'rgba(10,0,37,0.2)' }}>/</span>
              <h1 className="text-[14px] font-bold" style={{ color: '#0A0025' }}>{pageTitle}</h1>
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {user && (
              <Link
                to="/settings"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:bg-[rgba(91,0,232,0.08)]"
                style={{ background: 'rgba(91,0,232,0.04)', border: '1px solid rgba(91,0,232,0.1)' }}
                aria-label="Go to settings"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #5B00E8, #C4A0FF)' }}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="text-[12px] font-medium hidden sm:block" style={{ color: '#334155' }}>
                  {user.name || user.email}
                </span>
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto" style={{ background: '#F4F2FF' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
