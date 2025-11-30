'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyCalendarRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/planner/calendar');
  }, [router]);

  return null;
}
