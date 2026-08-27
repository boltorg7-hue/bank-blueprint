import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { ACCOUNTS_KEY, DASHBOARD_SUMMARY_KEY } from "@/features/accounts/hooks/useAccounts";
import { TRANSACTIONS_KEY } from "@/features/transactions/hooks/useTransactions";
import { BENEFICIARIES_KEY } from "@/features/beneficiaries/hooks/useBeneficiaries";
import {
  cancelTransferIntent,
  confirmTransferExecution,
  getTransfer,
  getTransferLimitsForCurrency,
  initiateTransfer,
  listCustomerTransfers,
  refreshTransferSettlement,
  registerTransferDocument,
} from "@/features/transfers/services/transfers.functions";
import type {
  TransferConfirmationResultDto,
  TransferDetailDto,
  TransferDto,
  TransferLimitsDto,
  TransferStatus,
} from "@/features/transfers/types/transfer";

/**
 * Transfer hooks. Balances and history are refetched after every execution:
 * the ledger projection is authoritative, the client never adjusts an amount
 * locally (§118, §144).
 */
export const TRANSFERS_KEY = ["transfers"] as const;

const BEHAVIOUR = {
  staleTime: 10_000,
  gcTime: 60_000,
  refetchOnWindowFocus: true,
  retry: 1,
} as const;

function useInvalidateFinancialState() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    void queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
    void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    void queryClient.invalidateQueries({ queryKey: BENEFICIARIES_KEY });
  };
}

export function useTransfers(limit = 30) {
  const fetchList = useServerFn(listCustomerTransfers);
  return useQuery<TransferDto[]>({
    queryKey: [...TRANSFERS_KEY, "list", limit],
    queryFn: () => fetchList({ data: { limit } }),
    ...BEHAVIOUR,
  });
}

export function useTransferDetail(reference: string) {
  const fetchDetail = useServerFn(getTransfer);
  return useQuery<TransferDetailDto | null>({
    queryKey: [...TRANSFERS_KEY, "detail", reference],
    queryFn: () => fetchDetail({ data: { reference } }),
    enabled: reference.length > 0,
    ...BEHAVIOUR,
  });
}

export function useTransferLimits(currency: string | null) {
  const fetchLimits = useServerFn(getTransferLimitsForCurrency);
  return useQuery<TransferLimitsDto | null>({
    queryKey: [...TRANSFERS_KEY, "limits", currency],
    queryFn: () => fetchLimits({ data: { currency: currency as string } }),
    enabled: Boolean(currency),
    staleTime: 300_000,
    gcTime: 600_000,
  });
}

export function useInitiateTransfer() {
  const invalidate = useInvalidateFinancialState();
  const initiate = useServerFn(initiateTransfer);
  return useMutation<
    TransferDetailDto,
    Error,
    {
      sourceAccountReference: string;
      beneficiaryReference: string;
      amountMinor: number;
      customerReference: string;
    }
  >({
    mutationFn: (input) => initiate({ data: input }),
    onSuccess: invalidate,
  });
}

export function useConfirmTransfer() {
  const invalidate = useInvalidateFinancialState();
  const confirm = useServerFn(confirmTransferExecution);
  return useMutation<TransferConfirmationResultDto, Error, string>({
    mutationFn: (reference) => confirm({ data: { reference } }),
    onSettled: invalidate,
  });
}

export function useCancelTransfer() {
  const invalidate = useInvalidateFinancialState();
  const cancel = useServerFn(cancelTransferIntent);
  return useMutation<{ reference: string; status: TransferStatus }, Error, string>({
    mutationFn: (reference) => cancel({ data: { reference } }),
    onSettled: invalidate,
  });
}

/**
 * Uploads a supporting document, then registers it server-side (§35, §97).
 * The file goes straight to the customer's private folder of the private
 * bucket; the browser never receives a public URL and the registration is
 * what actually advances the transfer.
 */
export function useUploadTransferDocument() {
  const queryClient = useQueryClient();
  const register = useServerFn(registerTransferDocument);

  return useMutation<
    TransferDetailDto,
    Error,
    { reference: string; requirementId: string; file: File }
  >({
    mutationFn: async ({ reference, requirementId, file }) => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("SESSION_EXPIRED");

      const extension = (file.name.split(".").pop() ?? "bin").toLowerCase().slice(0, 8);
      const storagePath = `${userId}/${reference}/${requirementId}-${Date.now()}.${extension}`;

      const { error } = await supabase.storage
        .from("transfer-documents")
        .upload(storagePath, file, { cacheControl: "0", upsert: false });
      if (error) throw new Error("UPLOAD_FAILED");

      return register({
        data: {
          reference,
          requirementId,
          storagePath,
          originalFilename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });
    },
    onSuccess: (detail) => {
      queryClient.setQueryData([...TRANSFERS_KEY, "detail", detail.reference], detail);
      void queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    },
  });
}

/** Asks the settlement rail for the authoritative status of one transfer (§55). */
export function useRefreshSettlement() {
  const invalidate = useInvalidateFinancialState();
  const refresh = useServerFn(refreshTransferSettlement);
  return useMutation<TransferDetailDto | null, Error, string>({
    mutationFn: (reference) => refresh({ data: { reference } }),
    onSettled: invalidate,
  });
}
