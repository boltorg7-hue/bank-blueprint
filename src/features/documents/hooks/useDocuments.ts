import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  authoriseDocumentAccess,
  findOperationReceipt,
  generateOperationReceipt,
  listCustomerDocuments,
} from "@/features/documents/services/documents.functions";
import {
  documentTypesForFilter,
  type CustomerDocumentDto,
  type DocumentDownloadDto,
  type DocumentFilter,
} from "@/features/documents/types/document";

/**
 * Document centre hooks (PROMPT 09 §55 – §90).
 * Authorised URLs are never cached: each access is requested again and audited.
 */
export const DOCUMENTS_KEY = ["documents"] as const;

export function useDocuments(filter: DocumentFilter = "ALL") {
  const fetchList = useServerFn(listCustomerDocuments);
  const types = documentTypesForFilter(filter);
  return useQuery<CustomerDocumentDto[]>({
    queryKey: [...DOCUMENTS_KEY, "list", filter],
    queryFn: () => fetchList({ data: { types: types ?? [] } }),
    staleTime: 30_000,
    gcTime: 300_000,
    retry: 1,
  });
}

export function useOperationReceipt(
  documentType: "TRANSFER_RECEIPT" | "TRANSACTION_RECEIPT",
  sourceReference: string,
  enabled: boolean,
) {
  const find = useServerFn(findOperationReceipt);
  return useQuery<CustomerDocumentDto | null>({
    queryKey: [...DOCUMENTS_KEY, "receipt", documentType, sourceReference],
    queryFn: () => find({ data: { documentType, sourceReference } }),
    enabled: enabled && sourceReference.length > 0,
    staleTime: 30_000,
    retry: 0,
  });
}

export function useGenerateReceipt() {
  const queryClient = useQueryClient();
  const generate = useServerFn(generateOperationReceipt);

  return useMutation<
    CustomerDocumentDto,
    Error,
    { documentType: "TRANSFER_RECEIPT" | "TRANSACTION_RECEIPT"; sourceReference: string }
  >({
    mutationFn: (input) => generate({ data: input }),
    onSuccess: (document, variables) => {
      queryClient.setQueryData(
        [...DOCUMENTS_KEY, "receipt", variables.documentType, variables.sourceReference],
        document,
      );
      void queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
  });
}

/** Requests a fresh short-lived authorised URL for a document (§66, §69). */
export function useDocumentAccess() {
  const authorise = useServerFn(authoriseDocumentAccess);
  return useMutation<
    DocumentDownloadDto,
    Error,
    { reference: string; intent: "download" | "preview" }
  >({
    mutationFn: (input) => authorise({ data: input }),
  });
}
