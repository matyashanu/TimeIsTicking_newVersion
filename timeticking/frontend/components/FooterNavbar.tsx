import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/planner', label: 'Planner' },
  { href: '/social', label: 'Social' },
  { href: '/settings', label: 'Settings' },
];

export default function FooterNavbar() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-[color:var(--border)]/40 bg-[color:var(--bg)]/90 backdrop-blur-md">
      <div className="container mx-auto flex flex-wrap items-center justify-between px-4 py-3 text-sm text-[color:var(--fg)]">
        <p className="opacity-80">Keep your day aligned with TimeIsTicking.</p>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[color:var(--fg)] transition hover:bg-[rgba(0,0,0,0.08)] dark:hover:bg-[rgba(245,239,235,0.12)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
