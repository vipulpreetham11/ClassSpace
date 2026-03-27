"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main dashboard with notes tab
    router.replace('/dashboard?tab=notes');
  }, [router]);

  return null;
}