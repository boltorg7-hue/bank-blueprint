import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { QUERY_POLICY } from "@/lib/query-policy";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        ...QUERY_POLICY.NORMAL,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
