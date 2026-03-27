"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MemesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?tab=memes');
  }, [router]);

  return null;
}