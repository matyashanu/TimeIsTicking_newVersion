import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/planner', label: 'Planner' },
  { href: '/social', label: 'Social' },
  { href: '/settings', label: 'Settings' },
];

export default function FooterNavbar() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-teal/40 bg-navy/85 backdrop-blur-md">
      <div className="container mx-auto flex flex-wrap items-center justify-between px-4 py-3 text-sm">
        <p className="text-sky/90">Keep your day aligned with TimeIsTicking.</p>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-beige transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
