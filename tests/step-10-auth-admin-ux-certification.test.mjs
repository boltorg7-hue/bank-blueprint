import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const login = read("src/routes/login.tsx");
const apple = read("src/features/auth/components/AppleSignInButton.tsx");
const callback = read("src/routes/auth.callback.tsx");
const postLogin = read("src/features/auth/lib/post-login.ts");
const password = read("src/features/auth/components/PasswordField.tsx");
const funding = read("src/features/admin/components/FundingConsole.tsx");

assert.match(login, /GoogleSignInButton/);
assert.match(login, /AppleSignInButton/);
assert.match(apple, /signInWithOAuth\("apple"/);
assert.match(apple, /\/auth\/callback/);

assert.match(callback, /resolvePostLoginRoute/);
assert.match(postLogin, /nextRouteForLifecycle/);
assert.match(postLogin, /safeRedirectPath/);
assert.match(postLogin, /startsWith\("\/\/"/);

assert.match(password, /CheckCircle2/);
assert.match(password, /XCircle/);
assert.match(password, /12 caractères minimum/);
assert.match(password, /aria-live="polite"/);

assert.match(funding, /decimalPattern/);
assert.match(funding, /at most 2 decimals|au plus 2 décimales/);
assert.match(funding, /finance.adjustment.approve/);
assert.match(funding, /different supervisor|autre membre autorisé/);

console.log("Step 10 auth/admin UX static certification: PASS");
