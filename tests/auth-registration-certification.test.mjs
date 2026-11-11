import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("registration handles rejected signup requests without exposing backend errors", () => {
  const form = read("src/features/auth/components/RegisterForm.tsx");
  assert.match(form, /try\s*\{[\s\S]*?supabase\.auth\.signUp/);
  assert.match(form, /catch\s*\{[\s\S]*?genericErrorMessage/);
  assert.match(form, /setPending\(false\)/);
  assert.match(form, /signUpErrorMessage\(result\.error/);
  assert.doesNotMatch(form, /setFormError\([^\n]*\.message/);
});

test("registration prevents duplicate submission and requires accessible identity fields", () => {
  const form = read("src/features/auth/components/RegisterForm.tsx");
  assert.match(form, /if \(pending\) return/);
  assert.match(form, /disabled=\{pending\}/);
  assert.match(form, /autoComplete=\{autoComplete\}/);
  assert.match(form, /aria-invalid=\{error \? true : undefined\}/);
  assert.match(form, /required/);
});

test("registration validates consent and password confirmation before creating an account", () => {
  const schema = read("src/features/auth/schemas/auth.schemas.ts");
  const form = read("src/features/auth/components/RegisterForm.tsx");
  assert.match(schema, /terms: z\.literal\(true/);
  assert.match(schema, /value\.password === value\.confirmPassword/);
  assert.match(form, /registerSchema\.safeParse/);
  assert.match(form, /marketing_consent/);
});
