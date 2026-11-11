import { describe, expect, test, mock } from "bun:test";

let document: { storage_path: string } | null = null;
let signingFails = false;
const filters: Array<[string, string]> = [];
const sign = mock(async (_path: string, _ttl: number) => ({
  data: signingFails ? null : { signedUrl: "https://example.invalid/private-preview" },
  error: signingFails ? { message: "unavailable" } : null,
}));
const query = {
  select: () => query,
  eq: (column: string, value: string) => { filters.push([column, value]); return query; },
  maybeSingle: async () => ({ data: document, error: null }),
};
mock.module("../src/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: () => query, storage: { from: () => ({ createSignedUrl: sign }) } },
}));
const { createDocumentPreviewUrl } = await import("../src/features/onboarding/services/onboarding.server");

describe("identity document previews", () => {
  test("scopes the lookup to the owner and signs their document for 60 seconds", async () => {
    filters.length = 0;
    document = { storage_path: "customer-1/identity.png" };
    signingFails = false;
    const result = await createDocumentPreviewUrl("customer-1", "document-1");
    expect(filters).toContainEqual(["user_id", "customer-1"]);
    expect(filters).toContainEqual(["id", "document-1"]);
    expect(sign).toHaveBeenLastCalledWith("customer-1/identity.png", 60);
    expect(result.expiresInSeconds).toBe(60);
  });
  test("does not sign missing documents or another customer's storage path", async () => {
    sign.mockClear();
    for (const row of [null, { storage_path: "customer-2/identity.png" }]) {
      document = row;
      await expect(createDocumentPreviewUrl("customer-1", "document-2")).rejects.toThrow("DOCUMENT_NOT_FOUND");
    }
    expect(sign).not.toHaveBeenCalled();
  });
  test("reports storage failures rather than returning an unusable URL", async () => {
    document = { storage_path: "customer-1/identity.png" };
    signingFails = true;
    await expect(createDocumentPreviewUrl("customer-1", "document-1")).rejects.toThrow("DOCUMENT_PREVIEW_UNAVAILABLE");
  });
});