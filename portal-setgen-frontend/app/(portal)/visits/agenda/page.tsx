"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VisitsAgendaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/visits?tab=agenda');
  }, [router]);

  return null;
}
