import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("SQL migrations do not contain malformed single-dollar function delimiters", () => {
  const directory = "supabase/migrations";
  const files = fs.readdirSync(directory).filter((file) => file.endsWith(".sql"));
  const malformed = [];

  for (const file of files) {
    const source = fs.readFileSync(path.join(directory, file), "utf8");
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.trim() === "AS $" || line.trim() === "$;") {
        malformed.push(file + ":" + (index + 1));
      }
    });
    if (/SELECT\\s+tr\\s*,\\s*rail\\.is_simulation\\s+INTO\\s+_t\\s*,\\s*_simulated/i.test(source)) {
      malformed.push(file + ": composite row in multi-target INTO");
    }
  }

  assert.deepEqual(malformed, []);
});
