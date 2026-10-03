import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");
const sourceDirs = [path.join(root, "src"), migrationsDir];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(function (entry) {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const migrationFiles = walk(migrationsDir)
  .filter(function (file) { return file.endsWith(".sql"); })
  .sort(function (a, b) {
    const aName = path.basename(a);
    const bName = path.basename(b);
    return aName.localeCompare(bName) || a.localeCompare(b);
  });
const sourceFiles = sourceDirs.flatMap(walk).filter(function (file) { return /\.(ts|tsx|sql)$/.test(file); });
const functions = new Map();

function getEntry(name) {
  if (!functions.has(name)) {
    functions.set(name, { name: name, createdIn: null, modifiedIn: [], signatures: new Set(), securityDefiner: false, searchPath: false, finalDefinition: null, grants: new Set(), callers: new Set() });
  }
  return functions.get(name);
}

for (const file of migrationFiles) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const sql = fs.readFileSync(file, "utf8");
  const re = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)[^;]*/gis;
  for (const match of sql.matchAll(re)) {
    const entry = getEntry(match[2]);
    if (!entry.createdIn) entry.createdIn = relative;
    entry.modifiedIn.push(relative);
    entry.signatures.add(match[3].replace(/\s+/g, " ").trim());
    entry.finalDefinition = match[0];
    entry.securityDefiner = /SECURITY\s+DEFINER/i.test(match[0]);
    entry.searchPath = /search_path\s*=/i.test(match[0]);
  }
  for (const match of sql.matchAll(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+[^.]+\.([a-zA-Z0-9_]+)/gi)) {
    getEntry(match[1]).grants.add(relative + ": " + match[0].replace(/\s+/g, " ").trim());
  }
}

for (const file of sourceFiles) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/\.(?:rpc|call)\(\s*["']([a-zA-Z0-9_]+)["']/g)) {
    getEntry(match[1]).callers.add(relative);
  }
}

console.log("| Fonction | Créée dans | Modifiée dans | Version finale | Permissions | Appelants | SECURITY DEFINER | search_path |");
console.log("|---|---|---|---|---|---|---|---|");
for (const entry of [...functions.values()].sort(function (a, b) { return a.name.localeCompare(b.name); })) {
  const modified = entry.modifiedIn.join("<br>");
  const grants = [...entry.grants].join("<br>") || "—";
  const callers = [...entry.callers].join("<br>") || "—";
  const signatures = [...entry.signatures].join(" / ") || "—";
  console.log("| " + entry.name + "(" + signatures + ") | " + (entry.createdIn || "—") + " | " + modified + " | " + (entry.modifiedIn.at(-1) || "—") + " | " + grants + " | " + callers + " | " + (entry.securityDefiner ? "oui" : "non") + " | " + (entry.securityDefiner ? (entry.searchPath ? "présent" : "ABSENT") : "n/a") + " |");
}
