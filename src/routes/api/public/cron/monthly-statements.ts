import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Monthly statement cron (PROMPT 09 §46): an external scheduler (pg_cron via
 * pg_net, or any HTTP scheduler) POSTs here once a month. The caller is
 * verified with a shared secret; the pipeline is idempotent — a statement
 * already READY for the period is reused untouched.
 */
export const Route = createFileRoute("/api/public/cron/monthly-statements")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        if (!secret) return new Response("not configured", { status: 503 });

        const provided = request.headers.get("x-cron-secret") ?? "";
        const expected = createHmac("sha256", secret).update("monthly-statements").digest("hex");
        const received = createHmac("sha256", provided).update("monthly-statements").digest("hex");
        if (
          provided.length === 0 ||
          !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
        ) {
          return new Response("unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const service = await import("@/features/statements/services/statements.server");

        // Previous calendar month, UTC.
        const now = new Date();
        const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 1);

        const { data: accounts, error } = await supabaseAdmin
          .from("bank_accounts")
          .select("user_id, public_reference")
          .eq("status", "ACTIVE")
          .eq("currency", "USD");
        if (error) return new Response("accounts unavailable", { status: 500 });

        const results: { reference: string; outcome: string }[] = [];
        for (const account of accounts ?? []) {
          try {
            const statement = await service.generateStatement(
              supabaseAdmin,
              account.user_id as string,
              {
                accountReference: account.public_reference as string,
                periodStart: periodStart.toISOString(),
                periodEnd: periodEnd.toISOString(),
                periodKind: "MONTHLY",
              },
            );
            results.push({ reference: account.public_reference as string, outcome: statement.status });
          } catch (cause) {
            results.push({
              reference: account.public_reference as string,
              outcome: cause instanceof Error ? cause.message : "GENERATION_FAILED",
            });
          }
        }

        return Response.json({
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          processed: results.length,
          results,
        });
      },
    },
  },
});
