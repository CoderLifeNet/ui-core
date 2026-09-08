import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(repoRoot, "generated");
mkdirSync(generatedDir, { recursive: true });

const tmpBase = mkdtempSync(path.join(repoRoot, ".tmp-ui-core-bundle-"));

const scenarios = [
  {
    name: "root-button",
    importCode: 'import { Button } from "@coderlife/ui-core";'
  },
  {
    name: "subpath-button",
    importCode: 'import Button from "@coderlife/ui-core/Button";'
  },
  {
    name: "upstream-button",
    importCode: 'import Button from "@mui/material/Button";'
  }
];

function bytesToKiB(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

async function buildScenario(name, importCode) {
  const entryFile = path.join(tmpBase, `${name}.tsx`);
  const outFile = path.join(tmpBase, `${name}.bundle.js`);

  writeFileSync(
    entryFile,
    `${importCode}\nimport React from "react";\nimport { createRoot } from "react-dom/client";\nfunction App(){return <Button variant=\"contained\">Bundle Probe</Button>;}\nconst host=document.createElement(\"div\");document.body.appendChild(host);createRoot(host).render(<App/>);\n`,
    "utf8"
  );

  const result = await build({
    absWorkingDir: repoRoot,
    entryPoints: [entryFile],
    outfile: outFile,
    bundle: true,
    minify: true,
    write: false,
    metafile: true,
    platform: "browser",
    format: "esm",
    target: ["es2020"],
    jsx: "automatic",
    logLevel: "silent"
  });

  const output = result.outputFiles.find((item) => item.path === outFile);
  if (!output || !result.metafile) {
    throw new Error(`Missing build output for ${name}`);
  }

  const rawBytes = output.contents.length;
  const gzipBytes = gzipSync(output.contents, { level: 9 }).length;
  const outputKey = Object.keys(result.metafile.outputs).find((key) =>
    key.endsWith(`${name}.bundle.js`)
  );
  const outputMeta = outputKey ? result.metafile.outputs[outputKey] : undefined;
  if (!outputMeta?.inputs) {
    throw new Error(`Missing output metadata for ${name}`);
  }
  const modules = Object.entries(outputMeta.inputs)
    .filter(([, meta]) => (meta.bytesInOutput ?? 0) > 0)
    .map(([modulePath]) => modulePath)
    .sort();

  return {
    name,
    rawBytes,
    gzipBytes,
    rawKiB: bytesToKiB(rawBytes),
    gzipKiB: bytesToKiB(gzipBytes),
    modules
  };
}

const outputByName = {};
for (const scenario of scenarios) {
  outputByName[scenario.name] = await buildScenario(scenario.name, scenario.importCode);
}

const upstream = outputByName["upstream-button"];
const root = outputByName["root-button"];
const subpath = outputByName["subpath-button"];

const forbiddenPathMatchers = [
  /(^|\/)dist\/analytics\/adapters\//,
  /(^|\/)dist\/icons\//,
  /(^|\/)dist\/wrappers\/(AccordionSummary|Autocomplete|Checkbox|IconButton|Link|MenuItem|Pagination|Radio|Select|Slider|Switch|Tab|Tabs)\./,
  /(^|\/)dist\/material\/(Accordion|Autocomplete|Checkbox|Dialog|Drawer|Menu|Pagination|Radio|Select|Slider|Switch|Tab|Tabs)\./
];

function findForbiddenModules(modules) {
  const findings = [];
  for (const modulePath of modules) {
    for (const matcher of forbiddenPathMatchers) {
      if (matcher.test(modulePath)) {
        findings.push(modulePath);
        break;
      }
    }
  }
  return findings;
}

const rootForbidden = findForbiddenModules(root.modules);
const subpathForbidden = findForbiddenModules(subpath.modules);

const overhead = {
  rootVsUpstreamRawBytes: root.rawBytes - upstream.rawBytes,
  rootVsUpstreamGzipBytes: root.gzipBytes - upstream.gzipBytes,
  subpathVsUpstreamRawBytes: subpath.rawBytes - upstream.rawBytes,
  subpathVsUpstreamGzipBytes: subpath.gzipBytes - upstream.gzipBytes
};

const budgets = {
  rootMaxExtraRawBytes: 14000,
  rootMaxExtraGzipBytes: 4500,
  subpathMaxExtraRawBytes: 10000,
  subpathMaxExtraGzipBytes: 3200
};

const failures = [];
if (overhead.rootVsUpstreamRawBytes > budgets.rootMaxExtraRawBytes) {
  failures.push(`Root import raw overhead ${overhead.rootVsUpstreamRawBytes} exceeds ${budgets.rootMaxExtraRawBytes}`);
}
if (overhead.rootVsUpstreamGzipBytes > budgets.rootMaxExtraGzipBytes) {
  failures.push(`Root import gzip overhead ${overhead.rootVsUpstreamGzipBytes} exceeds ${budgets.rootMaxExtraGzipBytes}`);
}
if (overhead.subpathVsUpstreamRawBytes > budgets.subpathMaxExtraRawBytes) {
  failures.push(`Subpath import raw overhead ${overhead.subpathVsUpstreamRawBytes} exceeds ${budgets.subpathMaxExtraRawBytes}`);
}
if (overhead.subpathVsUpstreamGzipBytes > budgets.subpathMaxExtraGzipBytes) {
  failures.push(`Subpath import gzip overhead ${overhead.subpathVsUpstreamGzipBytes} exceeds ${budgets.subpathMaxExtraGzipBytes}`);
}
if (rootForbidden.length > 0) {
  failures.push(`Root import pulled forbidden modules: ${rootForbidden.join(", ")}`);
}
if (subpathForbidden.length > 0) {
  failures.push(`Subpath import pulled forbidden modules: ${subpathForbidden.join(", ")}`);
}

const report = {
  scenarios: {
    root,
    subpath,
    upstream
  },
  overhead,
  budgets,
  forbidden: {
    root: rootForbidden,
    subpath: subpathForbidden
  },
  status: failures.length === 0 ? "pass" : "fail",
  failures
};

const reportPath = path.join(generatedDir, "button-bundle-report.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Upstream: raw ${upstream.rawKiB} KiB, gzip ${upstream.gzipKiB} KiB`);
console.log(`Root    : raw ${root.rawKiB} KiB, gzip ${root.gzipKiB} KiB`);
console.log(`Subpath : raw ${subpath.rawKiB} KiB, gzip ${subpath.gzipKiB} KiB`);
console.log(`Overhead root vs upstream   : raw ${overhead.rootVsUpstreamRawBytes} B, gzip ${overhead.rootVsUpstreamGzipBytes} B`);
console.log(`Overhead subpath vs upstream: raw ${overhead.subpathVsUpstreamRawBytes} B, gzip ${overhead.subpathVsUpstreamGzipBytes} B`);
console.log(`Report: ${path.relative(repoRoot, reportPath)}`);

rmSync(tmpBase, { recursive: true, force: true });

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL ${failure}`);
  }
  process.exitCode = 1;
}
