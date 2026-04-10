import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, Settings, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Pipeline', icon: LayoutDashboard },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/settings', label: 'ICP Settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-[#0f172a] shadow-lg">
        <div className="flex h-14 items-center px-4 lg:px-6">
          {/* KiMatch Brand */}
          <div className="flex items-center gap-2.5 mr-10">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500 text-white font-bold text-sm shadow-sm">
              K
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-white text-[15px] tracking-tight">
                KiMatch
              </span>
              <span className="text-indigo-300 text-[10px] tracking-widest uppercase font-medium">
                Lead Intel
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                (item.to === '/dashboard' && location.pathname === '/');
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right side tagline */}
          <div className="ml-auto text-xs text-slate-500 hidden md:block">
            Build for Konrad · KiMatch Consulting
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
