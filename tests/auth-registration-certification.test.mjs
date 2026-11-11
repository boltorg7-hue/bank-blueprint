import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("registration handles rejected signup requests without exposing backend errors", () => {
  const form = read("src/features/auth/components/RegisterForm.tsx");
  const server = read("src/features/auth/services/registration.server.ts");
  assert.ok(form.includes("try {"));
  assert.ok(form.includes("registerCustomer({ data: parsed.data })"));
  assert.ok(form.includes("catch {"));
  assert.ok(form.includes("signUpErrorMessage({ code: result.code }"));
  assert.ok(form.includes("setPending(false)"));
  assert.ok(server.includes("authClient.auth.signUp"));
  assert.doesNotMatch(form, /setFormError\([^\n]*\.message/);
});

test("registration prevents duplicate submission and requires accessible identity fields", () => {
  const form = read("src/features/auth/components/RegisterForm.tsx");
  assert.ok(form.includes("if (pending) return"));
  assert.ok(form.includes("disabled={pending}"));
  assert.ok(form.includes("autoComplete={autoComplete}"));
  assert.ok(form.includes("aria-invalid={error ? true : undefined}"));
  assert.ok(form.includes("required"));
});

test("registration validates consent and password confirmation before creating an account", () => {
  const schema = read("src/features/auth/schemas/auth.schemas.ts");
  const form = read("src/features/auth/components/RegisterForm.tsx");
  const server = read("src/features/auth/services/registration.server.ts");
  assert.ok(schema.includes("terms: z.literal(true"));
  assert.ok(schema.includes("value.password === value.confirmPassword"));
  assert.ok(form.includes("registerSchema.safeParse"));
  assert.ok(server.includes("marketing_consent"));
});

test("classic registration is validated and executed on the server", () => {
  const functions = read("src/features/auth/services/registration.functions.ts");
  const server = read("src/features/auth/services/registration.server.ts");
  const form = read("src/features/auth/components/RegisterForm.tsx");
  assert.ok(functions.includes("registerSchema.parse(input)"));
  assert.ok(functions.includes("createCustomerRegistration(data)"));
  assert.ok(server.includes("authClient.auth.signUp"));
  assert.ok(server.includes("SUPABASE_PUBLISHABLE_KEY"));
  assert.ok(server.includes("createSupabaseFetch(key)"));
  assert.ok(!server.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(form.includes("registerCustomer({ data: parsed.data })"));
  assert.ok(form.includes("supabase.auth.setSession"));
  assert.ok(!form.includes("supabase.auth.signUp"));
});

test("email registration metadata is also guarded by the database", () => {
  const migrations = read(
    "supabase/migrations/20261111100000_auth_registration_server_validation.sql",
  );
  assert.ok(migrations.includes("BEFORE INSERT ON auth.users"));
  assert.ok(migrations.includes("validate_email_registration_metadata"));
  assert.ok(migrations.includes("char_length(_first_name) NOT BETWEEN 2 AND 60"));
  assert.ok(migrations.includes("terms_accepted"));
  assert.ok(migrations.includes("_provider = 'email'"));
});
