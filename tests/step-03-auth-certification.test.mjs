import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const loginPage = read("src/routes/login.tsx");
const loginForm = read("src/features/auth/components/LoginForm.tsx");
const session = read("src/features/auth/hooks/useSessionUser.ts");
const postLogin = read("src/features/auth/lib/post-login.ts");
const appRoute = read("src/routes/app.tsx");
const callback = read("src/routes/auth.callback.tsx");
const supabaseClient = read("src/integrations/supabase/client.ts");
const customerMenu = read("src/features/customer-shell/components/CustomerMenu.tsx");

test("Step 03 — password login uses Supabase Auth", () => {
  assert.match(loginForm, /supabase\.auth\.signInWithPassword/);
  assert.match(loginForm, /email: parsed\.data\.email/);
  assert.match(loginForm, /password: parsed\.data\.password/);
  assert.match(loginPage, /<LoginForm redirectTo=\{redirect\} \/>/);
});

test("Step 03 — sign-in errors do not expose account existence", () => {
  assert.match(loginForm, /signInErrorMessage\(error/);
  assert.match(read("src/features/auth/lib/auth-errors.ts"), /signIn/);
  assert.match(read("src/features/auth/lib/auth-errors.ts"), /We couldn't sign you in with these details/);
});

test("Step 03 — sessions persist and react to auth state changes", () => {
  assert.match(supabaseClient, /persistSession: true/);
  assert.match(supabaseClient, /autoRefreshToken: true/);
  assert.match(session, /supabase\.auth\.getUser\(\)/);
  assert.match(session, /supabase\.auth\.onAuthStateChange/);
  assert.match(session, /data\.subscription\.unsubscribe\(\)/);
});

test("Step 03 — authenticated banking routes reject missing sessions", () => {
  assert.match(appRoute, /supabase\.auth\.getUser\(\)/);
  assert.match(appRoute, /throw redirect\(\{ to: "\/login"/);
  assert.match(appRoute, /search: \{ redirect: location\.href \}/);
});

test("Step 03 — post-login destination is derived from trusted lifecycle state", () => {
  assert.match(postLogin, /getCustomerContext/);
  assert.match(postLogin, /nextRouteForLifecycle\(context\.profile\.lifecycle_state\)/);
  assert.match(postLogin, /safeRedirectPath/);
  assert.match(postLogin, /startsWith\("\/\/"/);
});

test("Step 03 — logout cancels queries, clears cache, signs out, then replaces history", () => {
  assert.match(session, /queryClient\.cancelQueries\(\)/);
  assert.match(session, /queryClient\.clear\(\)/);
  assert.match(session, /const \{ error \} = await supabase\.auth\.signOut\(\)/);
  assert.match(session, /if \(error\) \{\s*throw error;/);
  assert.match(session, /navigate\(\{ to: "\/login", replace: true \}\)/);
  assert.match(customerMenu, /onSelect=\{\(\) => void signOut\(\)\}/);
});

test("Step 03 — OAuth callback requires a real session before routing", () => {
  assert.match(callback, /supabase\.auth\.getSession\(\)/);
  assert.match(callback, /if \(!data\.session\)/);
  assert.match(callback, /resolvePostLoginRoute/);
  assert.match(callback, /navigate\(\{ to: target, replace: true \}\)/);
});
