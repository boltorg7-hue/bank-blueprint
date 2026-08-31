import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getStatement,
  listCustomerStatements,
  requestAccountStatement,
} from "@/features/statements/services/statements.functions";
import type {
  StatementDetailDto,
  StatementDto,
  StatementGenerationRequest,
} from "@/features/statements/types/statement";
import { DOCUMENTS_KEY } from "@/features/documents/hooks/useDocuments";

/**
 * Statement hooks (PROMPT 09 §44 – §54). Generation is a server operation:
 * the client only asks and then reads the authoritative result.
 */
export const STATEMENTS_KEY = ["statements"] as const;

const BEHAVIOUR = { staleTime: 30_000, gcTime: 300_000, retry: 1 } as const;

export function useStatements(limit = 24) {
  const fetchList = useServerFn(listCustomerStatements);
  return useQuery<StatementDto[]>({
    queryKey: [...STATEMENTS_KEY, "list", limit],
    queryFn: () => fetchList({ data: { limit } }),
    ...BEHAVIOUR,
  });
}

export function useStatementDetail(reference: string) {
  const fetchDetail = useServerFn(getStatement);
  return useQuery<StatementDetailDto | null>({
    queryKey: [...STATEMENTS_KEY, "detail", reference],
    queryFn: () => fetchDetail({ data: { reference } }),
    enabled: reference.length > 0,
    ...BEHAVIOUR,
  });
}

export function useRequestStatement() {
  const queryClient = useQueryClient();
  const request = useServerFn(requestAccountStatement);

  return useMutation<StatementDetailDto, Error, StatementGenerationRequest>({
    mutationFn: (input) => request({ data: input }),
    onSuccess: (statement) => {
      queryClient.setQueryData([...STATEMENTS_KEY, "detail", statement.reference], statement);
      void queryClient.invalidateQueries({ queryKey: STATEMENTS_KEY });
      void queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
  });
}
