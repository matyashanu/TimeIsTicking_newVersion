import type { Metadata } from 'next';
import '@/styles/globals.css';
import TopNavbar from '@/components/TopNavbar';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'TimeIsTicking',
  description: 'Stay on top of tasks, goals, and time with TimeIsTicking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <TopNavbar />
            <main className="container mx-auto flex-1 px-4 py-10">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
