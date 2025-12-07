'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
const plannerTabs = [
  { href: '/planner/calendar', label: 'Calendar' },
  { href: '/planner/tasks', label: 'Tasks' },
  { href: '/planner/goals', label: 'Goals' },
  { href: '/planner/subjects', label: 'Subjects' },
];

export default function PlannerTabs() {
  const pathname = usePathname();
  useTheme();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--card-bg)]/80 px-3 py-2">
      {plannerTabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`nav-tab text-xs tracking-[0.2em] ${active ? 'nav-tab--active' : ''}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
