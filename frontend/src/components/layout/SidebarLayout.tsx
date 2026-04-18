import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Settings, LogOut, TerminalSquare, ChevronRight, Workflow } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ArchonMark = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <polygon points="14,2 24,10 14,18 4,10" fill="#5B00E8" />
    <polygon points="14,2 4,10 14,10"  fill="#1A0050" />
    <polygon points="14,2 24,10 14,10" fill="#8B3DFF" />
    <polygon points="4,10 14,18 14,10" fill="#2D0070" />
    <polygon points="24,10 14,18 14,10" fill="#C4A0FF" />
    <circle cx="14" cy="10" r="2.5" fill="#EDE5FF" opacity="0.6" />
  </svg>
);

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Blueprint',  path: '/blueprint',  icon: TerminalSquare },
  { name: 'Playground', path: '/builder',    icon: Workflow },
  { name: 'Analytics',  path: '/analytics',  icon: BarChart3 },
  { name: 'Settings',   path: '/settings',   icon: Settings },
];

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout?.(); navigate('/'); };

  // Breadcrumb label from current path
  const currentPage = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.name ?? 'Archon';

  return (
    <div className="flex h-screen bg-[#07060e] text-white overflow-hidden">

      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col border-r border-white/[0.055]"
        style={{ background: 'rgba(255,255,255,0.012)', backdropFilter: 'blur(12px)' }}>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 px-5 h-[62px] border-b border-white/[0.055] hover:opacity-80 transition-opacity flex-shrink-0">
          <ArchonMark size={20} />
          <span className="text-[15px] font-semibold tracking-tight text-white">Archon</span>
          <span className="badge-purple ml-auto text-[9px] px-2 py-0.5">Beta</span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/20 px-2 mb-2 mt-1">Navigation</p>
          {NAV_ITEMS.map(({ name, path, icon: Icon }) => {
            const active = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all group ${
                  active ? 'nav-active text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${active ? 'text-archon-bright' : 'text-white/30 group-hover:text-white/60'}`} strokeWidth={active ? 2 : 1.5} />
                {name}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-archon-bright/50" />}
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        <div className="px-3 pb-4 border-t border-white/[0.055] pt-3 space-y-1">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-white/[0.03]">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name || 'avatar'}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  style={{ border: '1.5px solid rgba(91,0,232,0.3)' }} />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#5B00E8,#C4A0FF)' }}>
                  {(user.name || user.email || 'A')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-white/80 truncate">{user.name || 'Admin'}</p>
                <p className="text-[10px] text-white/30 truncate">{user.email || 'developer@archon.ai'}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Log Out
          </button>
        </div>
      </aside>

      {/* ─── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-[62px] flex-shrink-0 flex items-center justify-between px-8 border-b border-white/[0.055]"
          style={{ background: 'rgba(255,255,255,0.012)' }}>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-white/25">Archon</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/15" />
            <span className="text-white/70 font-medium">{currentPage}</span>
          </div>
          <Link to="/blueprint"
            className="flex items-center gap-2 h-8 px-4 rounded-lg text-[12px] font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,rgba(91,0,232,0.25),rgba(91,0,232,0.15))', border: '0.5px solid rgba(91,0,232,0.35)' }}>
            + New Blueprint
          </Link>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {/* Ambient top glow */}
          <div className="absolute top-0 left-0 right-0 h-[200px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%,rgba(83,74,183,0.06),transparent)' }} />
          <div className="relative z-10 px-8 py-8 max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
