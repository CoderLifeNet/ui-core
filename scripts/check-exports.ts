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
  "InputBase",
  "Input",
  "FilledInput",
  "OutlinedInput",
  "NativeSelect",
  "TextField",
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

async function checkRuntimeParity(
  subpath: string,
  wrappers: Readonly<Record<string, unknown>>
): Promise<boolean> {
  const suffix = subpath === "." ? "" : subpath.slice(1);
  let upstream: Record<string, unknown>;
  try {
    upstream = await import(`@mui/material${suffix}`);
  } catch (error) {
    if (subpath.startsWith("./Pigment") && (error as NodeJS.ErrnoException).code === "ERR_MODULE_NOT_FOUND" &&
        (error as Error).message.includes("'@mui/material-pigment-css'")) {
      console.log(`Skipped runtime check for ${subpath} (optional MUI Pigment CSS peer is absent).`);
      return false;
    }
    throw error;
  }
  const core = await import(`@coderlifenet/ui-core${suffix}`) as Record<string, unknown>;
  for (const [name, value] of Object.entries(upstream)) {
    const expected = Object.hasOwn(wrappers, name) ? wrappers[name] : value;
    if (!Object.hasOwn(core, name) || core[name] !== expected) {
      throw new Error(`MUI runtime export drift for ${subpath}:${name}`);
    }
  }
  return true;
}

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

  const corePackage = "@coderlifenet/ui-core";
  const root = await import(corePackage) as Record<string, unknown>;
  const wrappedValues = Object.fromEntries(WRAPPED_SUBPATHS.map((name) => [name, root[name]]));
  let checkedRuntime = Number(await checkRuntimeParity(".", wrappedValues));
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
    const name = entry.subpath.slice(2);
    const wrappers = Object.hasOwn(wrappedValues, name)
      ? { default: wrappedValues[name], [name]: wrappedValues[name] }
      : {};
    checkedRuntime += Number(await checkRuntimeParity(entry.subpath, wrappers));
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

  console.log(`Validated ${surface.entries.length} subpaths, wrapper routing, and ${checkedRuntime} runtime entry points.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
