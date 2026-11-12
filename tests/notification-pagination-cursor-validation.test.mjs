import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  "src/features/notifications/services/notifications.server.ts",
  "utf8",
);
const decoder = source.match(
  /function decodeNotificationCursor[\s\S]*?\n}\n\nexport async function loadNotifications/,
);

assert.ok(decoder, "notification cursor decoder must exist");
assert.match(decoder[0], /timestampPattern/);
assert.match(decoder[0], /Number\.isFinite\(Date\.parse\(p\.createdAt\)\)/);
assert.match(decoder[0], /uuidPattern/);
assert.match(decoder[0], /return null/);
assert.match(
  decoder[0],
  /return \{ createdAt: p\.createdAt, id: p\.id \}/,
);

console.log("Notification pagination cursor validation certification: PASS");
