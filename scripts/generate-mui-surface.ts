import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface ExportEntry {
  category:
    | "renderable-component"
    | "hook"
    | "context-provider"
    | "utility-or-factory"
    | "constant-or-style-helper"
    | "type-only"
    | "documented-public-subpath"
    | "separate-package-component"
    | "recipe"
    | "experimental-or-deprecated";
  subpath: string;
  moduleSpecifier: string;
  hasDefaultExport: boolean;
  notes: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const muiPkgPath = path.join(repoRoot, "node_modules", "@mui", "material", "package.json");
const muiRoot = path.join(repoRoot, "node_modules", "@mui", "material");

const STATIC_EXPORTS: Record<string, { types: string; default: string } | string> = {
  ".": {
    types: "./dist/index.d.ts",
    default: "./dist/index.js"
  },
  "./extensions": {
    types: "./dist/extensions/index.d.ts",
    default: "./dist/extensions/index.js"
  },
  "./analytics": {
    types: "./dist/analytics/index.d.ts",
    default: "./dist/analytics/index.js"
  },
  "./instrumentation": {
    types: "./dist/instrumentation/index.d.ts",
    default: "./dist/instrumentation/index.js"
  },
  "./lab": {
    types: "./dist/lab/index.d.ts",
    default: "./dist/lab/index.js"
  },
  "./icons": {
    types: "./dist/icons/index.d.ts",
    default: "./dist/icons/index.js"
  },
  "./coverage": "./generated/mui-surface.json"
};

const WRAPPED_SUBPATHS: Record<string, string> = {
  Autocomplete: "Autocomplete",
  Button: "Button",
  IconButton: "IconButton",
  Link: "Link",
  Checkbox: "Checkbox",
  Radio: "Radio",
  Switch: "Switch",
  Tabs: "Tabs",
  Tab: "Tab",
  MenuItem: "MenuItem",
  AccordionSummary: "AccordionSummary",
  Pagination: "Pagination",
  Slider: "Slider",
  Select: "Select"
};

const INVALID_ROOT_EXPORTS = new Set([
  "FormLabelRoot",
  "StepperContext",
  "createTransitions",
  "experimental_extendTheme",
  "private_createMixins",
  "usePagination"
]);

function getVersion(pkg: Record<string, unknown>, name: string): string {
  const deps = pkg.dependencies as Record<string, string> | undefined;
  const peers = pkg.peerDependencies as Record<string, string> | undefined;
  const dev = pkg.devDependencies as Record<string, string> | undefined;
  return String(deps?.[name] ?? peers?.[name] ?? dev?.[name] ?? "unknown");
}

function chunk<T>(values: readonly T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size) as T[]);
  }
  return output;
}

function isStableMaterialSubpath(key: string): boolean {
  if (!key.startsWith("./")) return false;
  if (key === "." || key === "./package.json") return false;
  if (key.includes("*")) return false;
  if (key.startsWith("./internal")) return false;
  if (key.includes("Unstable") || key.includes("unstable")) return false;
  return true;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectPublicMaterialSubpaths(): Promise<string[]> {
  const direct = await readdir(muiRoot, { withFileTypes: true });
  const ignored = new Set([
    "internal",
    "modern",
    "node",
    "package.json",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "index.js",
    "index.d.ts",
    "OverridableComponent.d.ts"
  ]);

  const subpaths = new Set<string>();

  for (const entry of direct) {
    if (ignored.has(entry.name)) {
      continue;
    }

    const abs = path.join(muiRoot, entry.name);
    if (entry.isDirectory()) {
      if (await exists(path.join(abs, "index.d.ts"))) {
        subpaths.add(`./${entry.name}`);
      }

    } else if (entry.isFile() && entry.name.endsWith(".d.ts") && entry.name !== "index.d.ts") {
      subpaths.add(`./${entry.name.replace(/\.d\.ts$/, "")}`);
    }
  }

  return [...subpaths].filter(isStableMaterialSubpath).sort();
}

function toPassthroughPath(subpath: string): string {
  return subpath.replace(/^\.\//, "");
}

function getTypesPath(exportValue: unknown): string | undefined {
  if (!exportValue) return undefined;
  if (typeof exportValue === "string") return undefined;
  if (typeof exportValue !== "object") return undefined;

  const record = exportValue as Record<string, unknown>;
  if (typeof record.types === "string") {
    return record.types;
  }

  for (const value of Object.values(record)) {
    const nested = getTypesPath(value);
    if (nested) return nested;
  }

  return undefined;
}

function classify(subpath: string, dtsSource: string, hasDefaultExport: boolean): ExportEntry["category"] {
  const symbol = subpath.split("/").at(-1) ?? subpath;
  if (subpath.includes("deprecated") || subpath.includes("unstable")) {
    return "experimental-or-deprecated";
  }
  if (symbol.startsWith("use")) {
    return "hook";
  }
  if (symbol.includes("Provider") || symbol.includes("Context")) {
    return "context-provider";
  }
  if (/export\s+type\s+/m.test(dtsSource) && !/export\s+(const|function|class|default)/m.test(dtsSource)) {
    return "type-only";
  }
  if (symbol === "styles" || symbol === "colors" || symbol === "utils") {
    return "constant-or-style-helper";
  }
  if (hasDefaultExport && /^[A-Z]/.test(symbol)) {
    return "renderable-component";
  }
  if (/export\s+function\s+|declare\s+function\s+/m.test(dtsSource)) {
    return "utility-or-factory";
  }
  return "documented-public-subpath";
}

async function main(): Promise<void> {
  const pkgRaw = await readFile(path.join(repoRoot, "package.json"), "utf8");
  const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;

  const muiPkgRaw = await readFile(muiPkgPath, "utf8");
  const muiPkg = JSON.parse(muiPkgRaw) as {
    version: string;
    exports?: Record<string, unknown>;
  };

  const entries = muiPkg.exports
    ? Object.keys(muiPkg.exports).filter(isStableMaterialSubpath).sort()
    : await collectPublicMaterialSubpaths();

  const materialDir = path.join(repoRoot, "src", "material");
  await rm(materialDir, { recursive: true, force: true });
  await mkdir(materialDir, { recursive: true });

  const inventory: ExportEntry[] = [];
  const dynamicExports: Record<string, { types: string; default: string }> = {};

  for (const subpath of entries) {
    const passthrough = toPassthroughPath(subpath);
    const targetDir = path.join(materialDir, path.dirname(passthrough));
    const targetFile = path.join(materialDir, `${passthrough}.ts`);

    await mkdir(targetDir, { recursive: true });

    const exportDecl = muiPkg.exports?.[subpath];
    const typesPath = getTypesPath(exportDecl);
    let dtsSource = "";
    if (typesPath) {
      const absTypesPath = path.join(repoRoot, "node_modules", "@mui", "material", typesPath);
      dtsSource = await readFile(absTypesPath, "utf8");
    } else {
      const fallback = path.join(muiRoot, passthrough, "index.d.ts");
      const fallbackFile = path.join(muiRoot, `${passthrough}.d.ts`);
      if (await exists(fallback)) {
        dtsSource = await readFile(fallback, "utf8");
      } else if (await exists(fallbackFile)) {
        dtsSource = await readFile(fallbackFile, "utf8");
      }
    }

    const hasDefaultExport = /export\s+\{\s*default\s*\}|export\s+default\s+/m.test(dtsSource);

    const wrapperName = WRAPPED_SUBPATHS[passthrough];
    const lines = [`export * from "@mui/material/${passthrough}";`];
    if (wrapperName) {
      lines.push(`export { ${wrapperName} as default, ${wrapperName} } from "../wrappers/${wrapperName}.js";`);
    } else if (hasDefaultExport) {
      lines.push(`export { default } from "@mui/material/${passthrough}";`);
    }
    await writeFile(targetFile, `${lines.join("\n")}\n`, "utf8");

    dynamicExports[subpath] = {
      types: `./dist/material/${passthrough}.d.ts`,
      default: `./dist/material/${passthrough}.js`
    };

    inventory.push({
      category: classify(subpath, dtsSource, hasDefaultExport),
      subpath,
      moduleSpecifier: `@mui/material/${passthrough}`,
      hasDefaultExport,
      notes: "Generated from installed package export metadata and declaration files."
    });
  }

  const surface = {
    generatedAt: new Date().toISOString(),
    baseline: {
      react: getVersion(pkg, "react"),
      reactDom: getVersion(pkg, "react-dom"),
      typescript: getVersion(pkg, "typescript"),
      muiMaterial: muiPkg.version,
      stylingEngine: {
        emotionReact: getVersion(pkg, "@emotion/react"),
        emotionStyled: getVersion(pkg, "@emotion/styled")
      }
    },
    parityScope: {
      stableMaterialSurface: "full @mui/material public export map and declaration-backed subpaths",
      optional: ["@mui/lab via ./lab", "@mui/icons-material via ./icons"],
      excludedFromParityClaim: ["MUI X packages", "private internal implementation paths", "documentation-only recipes"]
    },
    entries: inventory
  };

  await mkdir(path.join(repoRoot, "generated"), { recursive: true });
  await writeFile(path.join(repoRoot, "generated", "mui-surface.json"), `${JSON.stringify(surface, null, 2)}\n`, "utf8");

  await writeFile(
    path.join(repoRoot, "generated", "mui-export-map.json"),
    `${JSON.stringify(
      {
        static: STATIC_EXPORTS,
        generated: dynamicExports
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  pkg.exports = {
    ...STATIC_EXPORTS,
    ...dynamicExports
  };

  await writeFile(path.join(repoRoot, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

  await mkdir(path.join(repoRoot, "src", "lab"), { recursive: true });
  await writeFile(
    path.join(repoRoot, "src", "lab", "index.ts"),
    "export * from \"@mui/lab\";\n",
    "utf8"
  );

  await mkdir(path.join(repoRoot, "src", "icons"), { recursive: true });
  await writeFile(
    path.join(repoRoot, "src", "icons", "index.ts"),
    "export * from \"@mui/icons-material\";\n",
    "utf8"
  );

  const wrappedNames = [...new Set(Object.values(WRAPPED_SUBPATHS))].sort();
  const wrappedNameSet = new Set(wrappedNames);
  const muiRuntime = (await import("@mui/material")) as Record<string, unknown>;
  const passthroughValueExports = Object.keys(muiRuntime)
    .filter((name) => name !== "default" && !wrappedNameSet.has(name) && !INVALID_ROOT_EXPORTS.has(name))
    .sort();

  const indexLines = ["export type * from \"@mui/material\";"];
  for (const wrappedName of wrappedNames) {
    indexLines.push(`export { ${wrappedName} } from \"./wrappers/${wrappedName}.js\";`);
  }
  for (const group of chunk(passthroughValueExports, 24)) {
    indexLines.push(`export { ${group.join(", ")} } from \"@mui/material\";`);
  }
  await writeFile(path.join(repoRoot, "src", "index.ts"), `${indexLines.join("\n")}\n`, "utf8");

  console.log(`Generated ${entries.length} material compatibility entry points.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
