export const QUERY_POLICY = {
  STATIC: {
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    networkMode: "online",
  },
  NORMAL: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    networkMode: "online",
  },
  FINANCIAL: {
    staleTime: 10_000,
    gcTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
    networkMode: "online",
  },
  REALTIME: {
    staleTime: 5_000,
    gcTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
    networkMode: "online",
  },
  SECURITY: {
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 0,
    networkMode: "online",
  },
} as const;
