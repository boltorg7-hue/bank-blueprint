import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql=readFileSync("supabase/migrations/20261002110000_fix_customer_notification_signature.sql","utf8");
assert.match(sql,/emit_customer_notification\(/);
const call=sql.match(/PERFORM public\.emit_customer_notification\(([\s\S]*?)\);/);
assert.ok(call);
assert.equal((call[1].match(/,/g)||[]).length,6,"emitter call must contain exactly 7 arguments");
console.log("Step 10 notification signature certification: PASS");