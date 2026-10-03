import type { ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CircleAlert } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAdminCustomerDossier } from "@/features/admin/hooks/useAdmin";
import type { AdminCustomerDto } from "@/features/admin/types/admin";
import { formatDate, formatDateTime } from "@/lib/format";

function money(minor: number, currency: string, minorUnit: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: minorUnit, maximumFractionDigits: minorUnit }).format(minor / 10 ** minorUnit);
}

function tone(status: string): "success" | "failed" | "pending" | "info" | "neutral" {
  if (["ACTIVE", "VERIFIED", "APPROVED", "READY", "POSTED", "COMPLETED"].includes(status)) return "success";
  if (["FAILED", "REJECTED", "SUSPENDED", "DENIED", "EXPIRED"].includes(status)) return "failed";
  if (["UNDER_REVIEW", "PENDING", "PROCESSING", "IN_PROGRESS"].includes(status)) return "pending";
  return "neutral";
}

export function AdminCustomerOperationalDossier({ customer, open, onOpenChange }: { customer: AdminCustomerDto | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { language } = useLanguage();
  const en = language === "en";
  const query = useAdminCustomerDossier(open ? customer?.id ?? null : null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl lg:max-w-5xl">
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
          <SheetHeader className="pr-8 text-left">
            <SheetTitle>{customer?.fullName ?? (en ? "Customer dossier" : "Dossier client")}</SheetTitle>
            <SheetDescription>{customer?.reference} · {en ? "Operational customer dossier" : "Dossier opérationnel client"}</SheetDescription>
          </SheetHeader>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : query.data ? <DossierBody dossier={query.data} en={en} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DossierBody({ dossier, en }: { dossier: import("@/features/admin/types/admin-customer-dossier").AdminCustomerDossierDto; en: boolean }) {
  const c = dossier.customer;
  const attention = [
    !["ACTIVE"].includes(c.lifecycleState),
    ["UNDER_REVIEW", "ADDITIONAL_INFORMATION_REQUIRED", "REJECTED"].includes(dossier.kyc.status),
    dossier.documents.some((d) => ["ACTION_REQUIRED", "REJECTED", "EXPIRED"].includes(d.status)),
    dossier.notifications.unreadCount > 0,
    dossier.transfers.some((t) => ["PROCESSING", "COMPLIANCE_REVIEW", "DOCUMENT_REQUIRED", "SETTLEMENT_PENDING"].includes(t.status)),
    dossier.funding.some((f) => f.status === "PENDING"),
  ].filter(Boolean).length;

  return <>
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption text-muted-foreground">{en ? "Operational overview" : "Vue opérationnelle"}</p>
            <p className="mt-1 text-lg font-semibold">{c.fullName}</p>
            <p className="text-sm text-muted-foreground">{c.reference}</p>
          </div>
          {attention > 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-foreground">
              <CircleAlert className="size-4" aria-hidden="true" />
              {attention} {en ? "item(s) need attention" : "élément(s) nécessitent une action"}
            </div>
          ) : (
            <StatusBadge label={en ? "No immediate action" : "Aucune action immédiate"} tone="success" />
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink href="#identity" label={en ? "Identity & KYC" : "Identité & KYC"} />
          <QuickLink href="#accounts" label={en ? "Accounts & balances" : "Comptes & soldes"} />
          <QuickLink href="#operations" label={en ? "Transactions & transfers" : "Transactions & virements"} />
          <QuickLink href="#communication" label={en ? "Messages & notifications" : "Messages & notifications"} />
          <QuickLink href="#security" label={en ? "Security" : "Sécurité"} />
          <QuickLink href="#audit" label={en ? "Audit" : "Audit"} />
        </div>
      </CardContent>
    </Card>

    <div className="flex flex-wrap gap-2">
      <ContextLink to="/admin/onboarding-cases" label={en ? "Open onboarding" : "Ouvrir l'onboarding"} />
      <ContextLink to="/admin/accounts" label={en ? "Open accounts" : "Ouvrir les comptes"} />
      <ContextLink to="/admin/transfers" label={en ? "Open transfers" : "Ouvrir les virements"} />
      <ContextLink to="/admin/funding" label={en ? "Open funding" : "Ouvrir le financement"} />
      <ContextLink to="/admin/support" label={en ? "Open support" : "Ouvrir le support"} />
      <ContextLink to="/admin/audit" label={en ? "Open audit" : "Ouvrir l'audit"} />
    </div>
    <Card>
      <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-caption text-muted-foreground">{en ? "Lifecycle" : "Cycle de vie"}</p><div className="mt-1"><StatusBadge label={c.lifecycleState} tone={tone(c.lifecycleState)} /></div></div>
        <div><p className="text-caption text-muted-foreground">E-mail</p><p className="mt-1 break-all font-medium">{c.email ?? "—"}</p><p className="text-xs text-muted-foreground">{c.emailVerified ? (en ? "Verified" : "Vérifié") : (en ? "Not verified" : "Non vérifié")}</p></div>
        <div><p className="text-caption text-muted-foreground">{en ? "Phone" : "Téléphone"}</p><p className="mt-1 font-medium">{c.phone ?? "—"}</p></div>
        <div><p className="text-caption text-muted-foreground">{en ? "Registered" : "Inscription"}</p><p className="mt-1 font-medium">{formatDate(c.createdAt)}</p></div>
      </CardContent>
    </Card>

    <div className="grid gap-5 lg:grid-cols-2">
      <Section id="identity" title={en ? "Identity & KYC" : "Identité & KYC"}>
        <dl className="grid gap-3 sm:grid-cols-2"><Info label={en ? "Full name" : "Nom complet"} value={c.fullName} /><Info label={en ? "Onboarding step" : "Étape onboarding"} value={c.onboardingStep ?? "—"} /><Info label={en ? "Verification" : "Vérification"} value={dossier.kyc.status} badge /><Info label={en ? "Submitted" : "Soumis"} value={dossier.kyc.submittedAt ? formatDateTime(dossier.kyc.submittedAt) : "—"} /></dl>
      </Section>
      <Section id="documents" title={en ? "Documents" : "Documents"}>
        {!dossier.documents.length ? <EmptyLine text={en ? "No verification documents." : "Aucun document de vérification."} /> : <div className="space-y-2">{dossier.documents.map((d, i) => <div key={d.type + d.createdAt + i} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"><span className="text-sm font-medium">{d.type}</span><StatusBadge label={d.status} tone={tone(d.status)} /></div>)}</div>}
      </Section>
    </div>

    <Section id="accounts" title={en ? "Accounts & balances" : "Comptes & soldes"}>
      {!dossier.accounts.length ? <EmptyLine text={en ? "No bank account." : "Aucun compte bancaire."} /> : <div className="grid gap-3 md:grid-cols-2">{dossier.accounts.map((a) => <Card key={a.reference}><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{a.displayName}</p><p className="text-xs text-muted-foreground">{a.reference} · {a.maskedNumber}</p></div><StatusBadge label={a.status} tone={tone(a.status)} /></div><div className="grid grid-cols-3 gap-2 text-sm"><Metric label={en ? "Available" : "Disponible"} value={money(a.availableBalanceMinor,a.currency,a.minorUnit)} /><Metric label={en ? "Ledger" : "Comptable"} value={money(a.ledgerBalanceMinor,a.currency,a.minorUnit)} /><Metric label={en ? "Held" : "Réservé"} value={money(a.heldBalanceMinor,a.currency,a.minorUnit)} /></div></CardContent></Card>)}</div>}
    </Section>

    <Section id="transactions" title={en ? "Transactions" : "Transactions"}>
      {!dossier.transactions.length ? <EmptyLine text={en ? "No recent transaction." : "Aucune transaction récente."} /> : <div className="divide-y divide-border rounded-md border border-border">{dossier.transactions.map((t) => <div key={t.reference} className="grid gap-1 p-3 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-medium">{t.description ?? t.transactionType}</p><p className="text-xs text-muted-foreground">{t.reference} · {t.accountReference} · {t.counterparty ?? "—"} · {formatDateTime(t.occurredAt)}</p></div><div className="text-left sm:text-right"><p className="font-semibold">{t.direction === "OUT" ? "−" : "+"}{money(t.amountMinor,t.currency,t.minorUnit)}</p><StatusBadge label={t.status} tone={tone(t.status)} /></div></div>)}</div>}
    </Section>

    <div className="grid gap-5 lg:grid-cols-2">
      <Section id="transfers" title={en ? "Transfers" : "Virements"}>{dossier.transfers.length ? dossier.transfers.map((t) => <div key={t.reference} className="rounded-md border border-border p-3"><div className="flex justify-between gap-3"><span className="font-medium">{t.reference}</span><StatusBadge label={t.status} tone={tone(t.status)} /></div><p className="mt-1 text-sm">{t.recipient}</p><p className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)} · {t.progressPercent}%</p></div>) : <EmptyLine text={en ? "No external transfer." : "Aucun virement externe."} />}</Section>
      <Section id="funding" title={en ? "Funding" : "Financement"}>{dossier.funding.length ? dossier.funding.map((f) => <div key={f.id} className="rounded-md border border-border p-3"><div className="flex justify-between gap-3"><span className="font-medium">{f.accountReference}</span><StatusBadge label={f.status} tone={tone(f.status)} /></div><p className="mt-1 font-semibold">{money(f.amountMinor,f.currency,f.minorUnit)}</p><p className="text-xs text-muted-foreground">{f.reason} · {formatDateTime(f.createdAt)}</p></div>) : <EmptyLine text={en ? "No funding request." : "Aucune demande de financement."} />}</Section>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <Section id="messages" title={en ? "Messages" : "Messages"}>{dossier.messages.length ? dossier.messages.map((m) => <div key={m.reference} className="rounded-md border border-border p-3"><div className="flex justify-between gap-3"><span className="font-medium">{m.subject}</span><StatusBadge label={m.status} tone={tone(m.status)} /></div><p className="text-xs text-muted-foreground">{m.reference} · {m.category} · {formatDateTime(m.lastMessageAt)}</p></div>) : <EmptyLine text={en ? "No support conversation." : "Aucun échange avec le support."} />}</Section>
      <Section id="notifications" title={en ? "Notifications" : "Notifications"}><div className="mb-3 text-sm font-medium">{dossier.notifications.unreadCount} {en ? "unread" : "non lues"}</div>{dossier.notifications.items.slice(0,5).map((n,i) => <div key={n.title + n.createdAt + i} className="border-t border-border py-2"><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.severity} · {formatDateTime(n.createdAt)}</p></div>)}</Section>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <Section id="security" title={en ? "Security" : "Sécurité"}>{dossier.security.restricted ? <EmptyLine text={en ? "Security details require elevated permission." : "Les détails de sécurité nécessitent une permission renforcée."} /> : <><p className="mb-3 text-sm">{dossier.security.sessions.length} {en ? "sessions recorded" : "sessions enregistrées"}</p>{dossier.security.events.slice(0,5).map((e,i)=><div key={e.type + e.createdAt + i} className="border-t border-border py-2"><p className="text-sm font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{e.type} · {formatDateTime(e.createdAt)}</p></div>)}</>}</Section>
      <Section id="audit" title={en ? "Audit" : "Audit"}>{dossier.audit.length ? dossier.audit.slice(0,8).map((a,i)=><div key={a.action + a.createdAt + i} className="border-t border-border py-2"><div className="flex justify-between gap-3"><span className="text-sm font-medium">{a.action}</span><StatusBadge label={a.result} tone={a.result === "ALLOWED" ? "success" : "failed"} /></div><p className="text-xs text-muted-foreground">{a.resourceType ?? "—"} · {a.resourceReference ?? "—"} · {formatDateTime(a.createdAt)}</p></div>) : <EmptyLine text={en ? "No audit event linked to this customer." : "Aucun événement d’audit lié à ce client."} />}</Section>
    </div>
  </>;
}

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-24 space-y-3"><h2 className="text-base font-semibold text-foreground">{title}</h2>{children}</section>;
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return <a href={href} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}</a>;
}

function ContextLink({ to, label }: { to: string; label: string }) {
  return <Link to={to} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>;
}
function Info({ label, value, badge }: { label: string; value: string; badge?: boolean }) { return <div><dt className="text-caption text-muted-foreground">{label}</dt><dd className="mt-1">{badge ? <StatusBadge label={value} tone={tone(value)} /> : <span className="font-medium">{value}</span>}</dd></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="text-caption text-muted-foreground">{label}</p><p className="mt-1 truncate font-semibold">{value}</p></div>; }
function EmptyLine({ text }: { text: string }) { return <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">{text}</p>; }
