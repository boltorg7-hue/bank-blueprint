import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("the committed env example contains no credential-like API key", () => {
  const env = read(".env.example");
  assert.match(env, /AFRICASTALKING_API_KEY=""/);
  assert.doesNotMatch(env, /AFRICASTALKING_API_KEY="[^"]+[^"]*"/);
});

test("local environment files are ignored while the example remains tracked", () => {
  const gitignore = read(".gitignore");
  assert.match(gitignore, /^\.env$/m);
  assert.match(gitignore, /^\.env\.\*$/m);
  assert.match(gitignore, /^!\.env\.example$/m);
});
