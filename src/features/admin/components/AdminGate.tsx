import type { ReactNode } from "react";

import { ErrorState, LoadingState, PermissionDeniedState } from "@/components/feedback";
import { useAdminContext } from "@/features/admin/hooks/useAdmin";

export function AdminGate({ children, permission }: { children: ReactNode; permission?: string }) {
  const query = useAdminContext();
  if (query.isPending) return <LoadingState label="Vérification de l’accès administratif…" />;
  if (query.isError) return <ErrorState title="L’accès administratif n’a pas pu être vérifié" onRetry={() => query.refetch()} />;
  if (!query.data?.authorized) return <PermissionDeniedState description="Ce compte ne possède pas un profil de personnel actif." />;
  if (permission && !query.data.permissions.includes(permission)) {
    return <PermissionDeniedState description="Votre rôle ne possède pas l’autorisation requise pour cette section." />;
  }
  return <>{children}</>;
}
