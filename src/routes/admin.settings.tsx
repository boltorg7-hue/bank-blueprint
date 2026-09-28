import { useLanguage } from "@/components/providers/LanguageProvider";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { useAdminContext } from "@/features/admin/hooks/useAdmin";
import {
  listFinancialSettings,
  updateFinancialSetting,
  type SettingKey,
  type SettingVersionDto,
} from "@/features/admin/services/settings.functions";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
  head: () => ({ meta: [{ title: "Parité & tarifs — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }),
});

const ITEMS: { key: SettingKey; label: string; hint: string; isRate?: boolean }[] = [
  { key: "USD_PER_USDT", label: "Parité USD / USDT", hint: "Valeur en USD d'1 USDT (6 décimales max).", isRate: true },
  { key: "ACCOUNT_MAINTENANCE_MONTHLY", label: "Tenue de compte mensuelle", hint: "Montant en USD." },
  { key: "TRANSFER_INTERNAL", label: "Virement interne", hint: "Montant en USD." },
  { key: "TRANSFER_EXTERNAL", label: "Virement externe", hint: "Montant en USD." },
];

const KEY = ["admin", "financial-settings"] as const;

function display(item: (typeof ITEMS)[number], v: number) {
  return item.isRate ? v.toString() : (v / 100).toFixed(2);
}

function AdminSettingsPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const fetchFn = useServerFn(listFinancialSettings);
  const { data: staff } = useAdminContext();
  const q = useQuery({ queryKey: KEY, queryFn: () => fetchFn(), staleTime: 5_000, enabled: staff?.authorized === true });
  return (
    <AdminGate>
      <PageHeader title={en ? "Exchange rate & fees" : "Parité & tarifs"} description={en ? "Audited, versioned values. Every change creates a new version without deleting history." : "Valeurs versionnées et auditées. Chaque modification crée une nouvelle version, sans effacer l’historique."} />
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={`mr-2 size-4 ${q.isFetching ? "animate-spin" : ""}`} /> {en ? "Reload" : "Recharger"}
        </Button>
      </div>
      {q.isError ? <p className="text-sm text-destructive">{en ? "Could not load settings." : "Impossible de charger les paramètres."}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {ITEMS.map((item) => <SettingCard key={item.key} item={item} rows={(q.data ?? []).filter((r) => r.key === item.key)} />)}
      </div>
    </AdminGate>
  );
}

function SettingCard({ item, rows }: { item: (typeof ITEMS)[number]; rows: SettingVersionDto[] }) {
  const { language } = useLanguage();
  const en = language === "en";
  const label = ({ USD_PER_USDT: "USD / USDT rate", ACCOUNT_MAINTENANCE_MONTHLY: "Monthly account fee", TRANSFER_INTERNAL: "Internal transfer", TRANSFER_EXTERNAL: "External transfer" } as Record<SettingKey, string>)[item.key];
  const current = rows[0];
  const [draft, setDraft] = useState("");
  const qc = useQueryClient();
  const updateFn = useServerFn(updateFinancialSetting);
  const m = useMutation({
    mutationFn: (value: number) => updateFn({ data: { key: item.key, value, expectedVersion: current?.version ?? 0 } }),
    onSuccess: async () => {
      setDraft("");
      toast.success(`${en ? label : item.label} ${en ? "updated." : "mis à jour."}`);
      await qc.invalidateQueries();
    },
    onError: (e: Error) =>
      toast.error(e.message === "VERSION_CONFLICT" ? (en ? "Value changed in the meantime. Reload." : "Valeur modifiée entre-temps : rechargez.") : e.message === "FORBIDDEN" ? (en ? "Insufficient permissions." : "Permission insuffisante.") : (en ? "Update rejected." : "Mise à jour refusée.")),
  });

  function submit() {
    const n = Number(draft.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return void toast.error(en ? "Invalid value." : "Valeur invalide.");
    m.mutate(item.isRate ? n : Math.round(n * 100));
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold">{en ? label : item.label}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{en ? item.isRate ? "USD value of 1 USDT (up to 6 decimal places)." : "Amount in USD." : item.hint}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums">
        {current ? display(item, current.value) : "—"} {item.isRate ? "USD" : "USD"}
      </p>
      <p className="text-xs text-muted-foreground">{current ? `${en ? "Version" : "Version"} ${current.version} · ${new Date(current.effectiveAt).toLocaleString(en ? "en-US" : "fr-FR")}` : ""}</p>
      <div className="mt-4 flex gap-2">
        <Input inputMode="decimal" placeholder={en ? "New value" : "Nouvelle valeur"} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={`${en ? "New value" : "Nouvelle valeur"} ${en ? label : item.label}`} />
        <Button onClick={submit} disabled={!draft || m.isPending}>{en ? "Update" : "Mettre à jour"}</Button>
      </div>
      {rows.length > 1 ? (
        <ul className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {rows.slice(1, 6).map((r) => (
            <li key={r.version} className="flex justify-between tabular-nums">
              <span>v{r.version} · {new Date(r.effectiveAt).toLocaleDateString(en ? "en-US" : "fr-FR")}</span>
              <span>{display(item, r.value)} USD</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
