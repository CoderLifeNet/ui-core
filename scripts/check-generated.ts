import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(path.join(tmpdir(), "ui-core-generated-"));

async function files(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const result: string[] = [];
  for (const entry of entries) {
    const name = path.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await files(path.join(directory, entry.name), name));
    else result.push(name);
  }
  return result;
}

try {
  execFileSync(path.join(root, "node_modules/.bin/tsx"), [path.join(root, "scripts/generate-mui-surface.ts")], {
    cwd: root,
    env: { ...process.env, UI_CORE_GENERATED_OUTPUT_DIR: temporary },
    stdio: "inherit"
  });
  const targets = new Set([
    "generated/mui-surface.json", "generated/mui-export-map.json", "src/index.ts",
    "src/lab/index.ts", "src/icons/index.ts"
  ]);
  for (const directory of [root, temporary]) {
    for (const name of await files(path.join(directory, "src/material"))) targets.add(path.join("src/material", name));
  }
  const stale: string[] = [];
  for (const name of targets) {
    const actual = await readFile(path.join(root, name)).catch(() => null);
    const expected = await readFile(path.join(temporary, name)).catch(() => null);
    if (!actual || !expected || !actual.equals(expected)) stale.push(name);
  }
  // Only exports is generator-owned in the manifest.
  const actualPackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const expectedPackage = JSON.parse(await readFile(path.join(temporary, "package.json"), "utf8"));
  if (JSON.stringify(actualPackage.exports) !== JSON.stringify(expectedPackage.exports)) stale.push("package.json#exports");
  if (stale.length) throw new Error(`Stale generated output: ${stale.join(", ")}. Run pnpm generate.`);
  console.log("Generated output matches current generator and installed upstream baseline.");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
