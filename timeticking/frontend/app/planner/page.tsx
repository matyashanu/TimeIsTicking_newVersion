'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlannerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/planner/calendar');
  }, [router]);

  return null;
}
