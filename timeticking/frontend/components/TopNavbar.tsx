'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';

const links = [
  { href: '/', label: 'Home' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/planner', label: 'Planner' },
  { href: '/social', label: 'Social' },
  { href: '/settings', label: 'Settings' },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname?.startsWith(href);

  const darkTheme = theme === 'dark';
  const headerBg = darkTheme 
    ? 'bg-gradient-to-b from-blue-950/50 to-slate-900/30 backdrop-blur-md border-b border-blue-400/10' 
    : 'bg-gradient-to-b from-blue-50/80 to-slate-50/50 backdrop-blur-md border-b border-blue-300/15';
  const baseText = darkTheme ? 'text-blue-100' : 'text-slate-700';
  const logoText = darkTheme ? 'text-blue-400' : 'text-blue-600';
  
  const activeBg = darkTheme 
    ? 'bg-gradient-to-r from-blue-500/80 to-cyan-500/70 text-white shadow-[0_0_20px_rgba(79,195,247,0.5)]' 
    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,102,204,0.3)]';
  
  const inactiveHover = darkTheme 
    ? 'text-blue-200 hover:text-blue-300 hover:shadow-[0_0_15px_rgba(79,195,247,0.2)]' 
    : 'text-slate-600 hover:text-blue-600 hover:shadow-[0_0_10px_rgba(0,102,204,0.15)]';

  return (
    <header className={`sticky top-0 z-20 ${headerBg}`}>
      <nav className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-4">
        <div className={`text-lg font-semibold tracking-[0.2em] ${logoText}`}>
          ⏰ Time Is Ticking
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-3 text-sm font-medium">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 transition-all duration-200 ${
                  active
                    ? activeBg
                    : `${baseText} ${inactiveHover}`
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${
              darkTheme
                ? 'border-blue-400/30 text-yellow-300 hover:shadow-[0_0_15px_rgba(253,224,71,0.4)]'
                : 'border-blue-300/30 text-blue-600 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]'
            }`}
          >
            {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => { logout(); }}
              className="ml-2 px-3 py-2 rounded text-sm bg-red-600 text-white"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
