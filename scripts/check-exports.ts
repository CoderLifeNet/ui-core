import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const ALLOWED_CATEGORIES = new Set([
  "renderable-component",
  "hook",
  "context-provider",
  "utility-or-factory",
  "constant-or-style-helper",
  "type-only",
  "documented-public-subpath",
  "separate-package-component",
  "recipe",
  "experimental-or-deprecated"
]);

const WRAPPED_SUBPATHS = [
  "AccordionSummary",
  "Autocomplete",
  "Button",
  "Checkbox",
  "IconButton",
  "Link",
  "MenuItem",
  "Pagination",
  "Radio",
  "Select",
  "Slider",
  "Switch",
  "Tab",
  "Tabs"
];

async function ensureFileExists(relativePath: string): Promise<void> {
  await access(path.join(repoRoot, relativePath));
}

async function main(): Promise<void> {
  const pkgRaw = await readFile(path.join(repoRoot, "package.json"), "utf8");
  const pkg = JSON.parse(pkgRaw) as {
    exports: Record<string, { types?: string; default?: string } | string>;
  };

  const surfaceRaw = await readFile(path.join(repoRoot, "generated", "mui-surface.json"), "utf8");
  const surface = JSON.parse(surfaceRaw) as {
    entries: Array<{ subpath: string; category: string }>;
  };

  for (const entry of surface.entries) {
    if (!ALLOWED_CATEGORIES.has(entry.category)) {
      throw new Error(`Unclassified export category '${entry.category}' for ${entry.subpath}`);
    }

    const exportEntry = pkg.exports[entry.subpath];
    if (!exportEntry || typeof exportEntry === "string") {
      throw new Error(`Missing structured export for ${entry.subpath}`);
    }

    if (!exportEntry.types || !exportEntry.default) {
      throw new Error(`Missing types/default mapping for ${entry.subpath}`);
    }

    await ensureFileExists(exportEntry.types.replace("./", ""));
    await ensureFileExists(exportEntry.default.replace("./", ""));
  }

  const rootSource = await readFile(path.join(repoRoot, "src", "index.ts"), "utf8");
  for (const wrapped of WRAPPED_SUBPATHS) {
    const expected = `export { ${wrapped} } from \"./wrappers/${wrapped}.js\";`;
    if (!rootSource.includes(expected)) {
      throw new Error(`Missing root wrapper export for ${wrapped}`);
    }

    const materialSource = await readFile(path.join(repoRoot, "src", "material", `${wrapped}.ts`), "utf8");
    const expectedSubpath = `../wrappers/${wrapped}.js`;
    if (!materialSource.includes(expectedSubpath)) {
      throw new Error(`Wrapper routing drift in src/material/${wrapped}.ts`);
    }
  }

  console.log(`Validated ${surface.entries.length} exports and wrapper routing.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
