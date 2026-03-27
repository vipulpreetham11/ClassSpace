"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfessionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?tab=confessions');
  }, [router]);

  return null;
}