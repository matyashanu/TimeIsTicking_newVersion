import type { ReactNode } from 'react';
import PlannerTabs from '@/components/planner/PlannerTabs';

export default function PlannerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-screen flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-6">
        <PlannerTabs />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
