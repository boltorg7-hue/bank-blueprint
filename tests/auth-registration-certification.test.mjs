import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("registration handles rejected signup requests without exposing backend errors", () => {
  const form = read("src/features/auth/components/RegisterForm.tsx");
  const server = read("src/features/auth/services/registration.server.ts");
  assert.match(form, /try\\s*\\{[\\s\\S]*?registerCustomer/);
  assert.match(form, /catch\\s*\\{[\\s\\S]*?genericErrorMessage/);
  assert.match(form, /setPending\\(false\\)/);
  assert.match(form, /signUpErrorMessage\\(\\{ code: result\\.code \\}/);
  assert.match(server, /authClient\\.auth\\.signUp/);
  assert.doesNotMatch(form, /setFormError\\([^\\n]*\\.message/);
});

test("registration prevents duplicate submission and requires accessible identity fields", () => {
  const form = read("src/features/auth/components/RegisterForm.tsx");
  assert.match(form, /if \\(pending\\) return/);
  assert.match(form, /disabled=\\{pending\\}/);
  assert.match(form, /autoComplete=\\{autoComplete\\}/);
  assert.match(form, /aria-invalid=\\{error \\? true : undefined\\}/);
  assert.match(form, /required/);
});

test("registration validates consent and password confirmation before creating an account", () => {
  const schema = read("src/features/auth/schemas/auth.schemas.ts");
  const form = read("src/features/auth/components/RegisterForm.tsx");
  const server = read("src/features/auth/services/registration.server.ts");
  assert.match(schema, /terms: z\\.literal\\(true/);
  assert.match(schema, /value\\.password === value\\.confirmPassword/);
  assert.match(form, /registerSchema\\.safeParse/);
  assert.match(server, /marketing_consent/);
});

test("classic registration is validated and executed on the server", () => {
  const functions = read("src/features/auth/services/registration.functions.ts");
  const server = read("src/features/auth/services/registration.server.ts");
  const form = read("src/features/auth/components/RegisterForm.tsx");
  assert.match(functions, /inputValidator\\(\\(input: unknown\\) => registerSchema\\.parse\\(input\\)\\)/);
  assert.match(functions, /createCustomerRegistration\\(data\\)/);
  assert.match(server, /authClient\\.auth\\.signUp/);
  assert.match(server, /SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(server, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(form, /registerCustomer\\(\\{ data: parsed\\.data \\}\\)/);
  assert.match(form, /supabase\\.auth\\.setSession/);
  assert.doesNotMatch(form, /supabase\\.auth\\.signUp/);
});

test("email registration metadata is also guarded by the database", () => {
  const migrations = read("supabase/migrations/20261111100000_auth_registration_server_validation.sql");
  assert.match(migrations, /BEFORE INSERT ON auth\\.users/);
  assert.match(migrations, /validate_email_registration_metadata/);
  assert.match(migrations, /char_length\\(_first_name\\) NOT BETWEEN 2 AND 60/);
  assert.match(migrations, /terms_accepted/);
  assert.match(migrations, /_provider = 'email'/);
});
