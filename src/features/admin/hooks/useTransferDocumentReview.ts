import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useAdminContext, ADMIN_EXTERNAL_TRANSFERS_KEY } from "@/features/admin/hooks/useAdmin";
import {
  getAdminTransferDocumentUrl,
  listAdminExternalTransfersWithDocuments,
  reviewAdminTransferDocument,
} from "@/features/admin/services/transfer-document-review.functions";
import { QUERY_POLICY } from "@/lib/query-policy";

export function useAdminExternalTransfersWithDocuments(cursor: string | null = null) {
  const fn = useServerFn(listAdminExternalTransfersWithDocuments);
  const { data: staff } = useAdminContext();

  return useQuery({
    queryKey: [...ADMIN_EXTERNAL_TRANSFERS_KEY, "document-review", cursor],
    queryFn: () => fn({ data: { cursor } }),
    ...QUERY_POLICY.REALTIME,
    enabled:
      staff?.authorized === true &&
      (staff.permissions.includes("compliance.review") ||
        staff.permissions.includes("transfers.approve")),
  });
}

export function useAdminTransferDocumentUrl() {
  const fn = useServerFn(getAdminTransferDocumentUrl);
  return useMutation({
    mutationFn: (data: { documentId: string }) => fn({ data }),
  });
}

export function useReviewAdminTransferDocument() {
  const fn = useServerFn(reviewAdminTransferDocument);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { documentId: string; accept: boolean; reason?: string }) => fn({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_EXTERNAL_TRANSFERS_KEY }),
  });
}
