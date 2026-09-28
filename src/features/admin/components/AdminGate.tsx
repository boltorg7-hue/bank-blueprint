import type { ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";


import { ErrorState, LoadingState, PermissionDeniedState } from "@/components/feedback";
import { useAdminContext } from "@/features/admin/hooks/useAdmin";

export function AdminGate({ children, permission }: { children: ReactNode; permission?: string }) {
  const query = useAdminContext();
  const { language } = useLanguage();
  const en = language === "en";
  if (query.isPending) return <LoadingState label={en ? "Checking staff access…" : "Vérification de l’accès administratif…"} />;
  if (query.isError) return <ErrorState title={en ? "Staff access could not be verified" : "L’accès administratif n’a pas pu être vérifié"} onRetry={() => query.refetch()} />;
  if (!query.data?.authorized) return <PermissionDeniedState description={en ? "This account does not have an active staff profile." : "Ce compte ne possède pas un profil de personnel actif."} />;
  if (permission && !query.data.permissions.includes(permission)) {
    return <PermissionDeniedState description={en ? "Your role does not have permission to view this section." : "Votre rôle ne possède pas l’autorisation requise pour cette section."} />;
  }
  return <>{children}</>;
}
