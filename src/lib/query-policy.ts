export const QUERY_POLICY = {
  STATIC: {
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  },
  NORMAL: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  },
  FINANCIAL: {
    staleTime: 10_000,
    gcTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  },
  REALTIME: {
    staleTime: 5_000,
    gcTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  },
  SECURITY: {
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 0,
  },
} as const;
