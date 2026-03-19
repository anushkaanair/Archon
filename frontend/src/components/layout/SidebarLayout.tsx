import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Settings, LogOut, TerminalSquare } from 'lucide-react';

const ArchonMark = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28">
    <polygon points="14,2 24,10 14,18 4,10" fill="#534AB7"/>
    <polygon points="14,2 4,10 14,10" fill="#26215C"/>
    <polygon points="14,2 24,10 14,10" fill="#7F77DD"/>
    <polygon points="4,10 14,18 14,10" fill="#3C3489"/>
    <polygon points="24,10 14,18 14,10" fill="#AFA9EC"/>
    <circle cx="14" cy="10" r="2.5" fill="#EEEDFE" opacity="0.6"/>
  </svg>
)

export default function SidebarLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Builder', path: '/builder', icon: TerminalSquare },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background text-white selection:bg-archon-core/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-background flex flex-col items-start px-4 py-6">
        <Link to="/" className="flex items-center gap-3 px-2 mb-10">
          <ArchonMark size={24} />
          <span className="text-lg font-medium tracking-tight text-white">Archon</span>
        </Link>
        <div className="flex-1 w-full space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-archon-core/10 text-archon-mist border border-archon-core/20 shadow-[0_0_15px_rgba(83,74,183,0.15)]'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
        <Link
          to="/"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-colors mt-auto"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </Link>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_top,rgba(83,74,183,0.08),transparent_80%)] pointer-events-none" />
        <div className="relative z-10 w-full h-full p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
