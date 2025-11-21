'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from './ThemeProvider';

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

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname?.startsWith(href);

  const baseBg = theme === 'dark' ? 'bg-navy' : 'bg-beige';
  const baseText = theme === 'dark' ? 'text-beige' : 'text-navy';
  const accentHover = theme === 'dark' ? 'hover:bg-beige/10' : 'hover:bg-navy/10';
  const borderColor = theme === 'dark' ? 'border-beige/25' : 'border-navy/25';
  const activeBg = theme === 'dark' ? 'bg-beige text-navy' : 'bg-navy text-beige';

  return (
    <header className={`sticky top-0 z-20 border-b ${borderColor} ${baseBg} backdrop-blur`}>
      <nav className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-4">
        <div className={`text-lg font-semibold tracking-[0.2em] ${baseText}`}>
          Time Is Ticking
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-3 text-base">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 transition ${
                  active
                    ? `${activeBg}`
                    : `${baseText} ${accentHover}`
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
            className={`flex h-10 w-10 items-center justify-center rounded-full border ${borderColor} ${baseText} transition hover:-translate-y-0.5 hover:shadow-lg ${
              theme === 'dark' ? 'hover:bg-beige/10' : 'hover:bg-navy/10'
            }`}
          >
            {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
