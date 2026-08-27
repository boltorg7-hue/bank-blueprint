import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  addBeneficiary,
  addExternalBeneficiary,
  listSupportedDestinations,
  deleteBeneficiary,
  listCustomerBeneficiaries,
  resolveBeneficiaryDestination,
  updateBeneficiaryNickname,
} from "@/features/beneficiaries/services/beneficiaries.functions";
import type {
  BeneficiaryDto,
  ResolvedDestinationDto,
  SettlementRailDto,
} from "@/features/beneficiaries/types/beneficiary";

/**
 * Beneficiary hooks. Server snapshot only — no optimistic financial state and
 * no offline cache presented as current (§149).
 */
export const BENEFICIARIES_KEY = ["beneficiaries"] as const;

const BEHAVIOUR = {
  staleTime: 15_000,
  gcTime: 60_000,
  refetchOnWindowFocus: true,
  retry: 1,
} as const;

export function useBeneficiaries() {
  const fetchList = useServerFn(listCustomerBeneficiaries);
  return useQuery<BeneficiaryDto[]>({
    queryKey: BENEFICIARIES_KEY,
    queryFn: () => fetchList(),
    ...BEHAVIOUR,
  });
}

export function useResolveDestination() {
  const resolve = useServerFn(resolveBeneficiaryDestination);
  return useMutation<ResolvedDestinationDto | null, Error, string>({
    mutationFn: (identifier) => resolve({ data: { identifier } }),
  });
}

export function useAddBeneficiary() {
  const queryClient = useQueryClient();
  const create = useServerFn(addBeneficiary);
  return useMutation<BeneficiaryDto, Error, { identifier: string; nickname: string | null }>({
    mutationFn: (input) =>
      create({ data: { identifier: input.identifier, nickname: input.nickname ?? "" } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BENEFICIARIES_KEY });
    },
  });
}

export function useRemoveBeneficiary() {
  const queryClient = useQueryClient();
  const remove = useServerFn(deleteBeneficiary);
  return useMutation<{ reference: string }, Error, string>({
    mutationFn: (reference) => remove({ data: { reference } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BENEFICIARIES_KEY });
    },
  });
}

export function useRenameBeneficiary() {
  const queryClient = useQueryClient();
  const rename = useServerFn(updateBeneficiaryNickname);
  return useMutation<{ reference: string }, Error, { reference: string; nickname: string }>({
    mutationFn: (input) => rename({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BENEFICIARIES_KEY });
    },
  });
}

/** Destinations the bank can reach; changes rarely, so cached longer. */
export function useSupportedDestinations() {
  const fetchRails = useServerFn(listSupportedDestinations);
  return useQuery<SettlementRailDto[]>({
    queryKey: [...BENEFICIARIES_KEY, "destinations"],
    queryFn: () => fetchRails(),
    staleTime: 600_000,
    gcTime: 900_000,
  });
}

export function useAddExternalBeneficiary() {
  const queryClient = useQueryClient();
  const create = useServerFn(addExternalBeneficiary);
  return useMutation<
    BeneficiaryDto,
    Error,
    {
      displayName: string;
      bankName: string;
      identifier: string;
      country: string;
      currency: string;
      routingCode: string;
      nickname: string;
    }
  >({
    mutationFn: (input) => create({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BENEFICIARIES_KEY });
    },
  });
}
