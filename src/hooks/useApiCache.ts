"use client";

import { useState, useEffect, createContext, useContext } from 'react';

// Global cache for dashboard data
const cache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  loading: boolean;
};

export function useApiCache<T>(key: string, fetcher: () => Promise<T>) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const now = Date.now();
    const cached = cache.get(key) as CacheEntry<T> | undefined;

    // If we have fresh cached data, use it
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setState({
        data: cached.data,
        loading: cached.loading,
        error: null,
      });
      return;
    }

    // If we have stale data, show it while loading fresh data
    if (cached) {
      setState({
        data: cached.data,
        loading: true,
        error: null,
      });
    }

    // Fetch fresh data
    const loadData = async () => {
      try {
        // Mark as loading in cache
        cache.set(key, {
          data: cached?.data || null,
          timestamp: now,
          loading: true,
        });

        const data = await fetcher();

        // Update cache with fresh data
        cache.set(key, {
          data,
          timestamp: Date.now(),
          loading: false,
        });

        setState({
          data,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          data: cached?.data || null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    loadData();
  }, [key]);

  // Function to invalidate cache
  const invalidate = () => {
    cache.delete(key);
  };

  return { ...state, invalidate };
}

// Hook to invalidate multiple cache keys
export function useCacheInvalidation() {
  const invalidate = (keys: string[]) => {
    keys.forEach(key => cache.delete(key));
  };

  const invalidateAll = () => {
    cache.clear();
  };

  return { invalidate, invalidateAll };
}