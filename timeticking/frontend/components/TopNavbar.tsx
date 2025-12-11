'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import FocusToggle from '@/components/FocusToggle';

const links = [
  { href: '/', label: 'Home' },
  { href: '/planner', label: 'Planner' },
  { href: '/social', label: 'Social' },
  { href: '/settings', label: 'Settings' },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--border)]/30 bg-[color:var(--bg)] backdrop-blur">
      <nav className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-4 text-[color:var(--fg)]">
        <div className="text-lg font-semibold tracking-[0.2em]">
          Time Is Ticking
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-3 text-base">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-tab ${active ? 'nav-tab--active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FocusToggle />
          </div>
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)]/40 text-[color:var(--fg)] transition hover:-translate-y-0.5 hover:shadow-lg ${
              theme === 'dark'
                ? 'hover:bg-[rgba(245,239,235,0.12)]'
                : 'hover:bg-[rgba(47,65,86,0.12)]'
            }`}
          >
            {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
