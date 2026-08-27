import type { ReactNode } from "react";

import {
  BankingContentContainer,
  type ContentWidth,
} from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, PermissionDeniedState } from "@/components/feedback";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { isAllowed, type AccessCategory } from "@/features/customer-shell/lib/route-access";
import type { AppPath } from "@/lib/routing";

/**
 * Route shell for banking domains whose engine arrives in a later phase.
 * It shows an explicit placeholder — never invented balances or operations
 * (§33) — and applies the central route-access matrix (§71).
 */
export function FeatureShellPage({
  title,
  description,
  placeholderTitle,
  placeholderDescription,
  access = "banking-read",
  width = "default",
  backTo,
  action,
  children,
}: {
  title: string;
  description?: string;
  placeholderTitle?: string;
  placeholderDescription?: string;
  access?: AccessCategory;
  width?: ContentWidth;
  backTo?: AppPath;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const { summary } = useCustomerSummary();
  const allowed = summary ? isAllowed(summary.lifecycleState, access) : true;

  return (
    <BankingContentContainer width={width}>
      <PageHeader
        title={title}
        description={description}
        {...(backTo ? { backTo } : {})}
        {...(action ? { action } : {})}
      />
      {!allowed ? (
        <PermissionDeniedState description="Cette section n'est pas disponible avec le statut actuel de votre compte." />
      ) : (
        (children ?? (
          <EmptyState
            title={placeholderTitle ?? "Service en cours de mise en service"}
            description={
              placeholderDescription ??
              "Cette section sera alimentée dès que le service bancaire correspondant sera connecté."
            }
          />
        ))
      )}
    </BankingContentContainer>
  );
}
