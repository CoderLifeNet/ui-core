import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(repoRoot, "generated");
const diffDir = path.join(generatedDir, "visual-diffs");
mkdirSync(generatedDir, { recursive: true });
mkdirSync(diffDir, { recursive: true });

const tmpBase = mkdtempSync(path.join(repoRoot, ".tmp-ui-core-visual-"));
const entryFile = path.join(tmpBase, "entry.tsx");
const bundleFile = path.join(tmpBase, "bundle.js");
const htmlFile = path.join(tmpBase, "index.html");

const harnessSource = `
import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MuiButton from "@mui/material/Button";
import MuiCheckbox from "@mui/material/Checkbox";
import MuiFormControlLabel from "@mui/material/FormControlLabel";
import MuiAutocomplete from "@mui/material/Autocomplete";
import MuiTextField from "@mui/material/TextField";
import { Button as CoreButton, Checkbox as CoreCheckbox, Autocomplete as CoreAutocomplete } from "@coderlife/ui-core";

const search = new URLSearchParams(window.location.search);
const source = search.get("source") || "upstream";
const scenario = search.get("scenario") || "button-basic";

const BaseButton = source === "wrapper" ? CoreButton : MuiButton;
const BaseCheckbox = source === "wrapper" ? CoreCheckbox : MuiCheckbox;
const BaseAutocomplete = source === "wrapper" ? CoreAutocomplete : MuiAutocomplete;

const theme = createTheme({
  palette: {
    primary: { main: "#005a9c" },
    secondary: { main: "#c50f1f" }
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: "none",
          letterSpacing: "0.01em"
        }
      }
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#005a9c"
        }
      }
    }
  }
});

function Scenario() {
  if (scenario === "button-basic") {
    return <BaseButton variant="contained">Primary Action</BaseButton>;
  }

  if (scenario === "checkbox-form-control") {
    return (
      <MuiFormControlLabel
        label="Email updates"
        control={<BaseCheckbox checked onChange={() => undefined} />}
      />
    );
  }

  if (scenario === "autocomplete-portal") {
    return (
      <div style={{ width: 320, marginTop: 12 }}>
        <BaseAutocomplete
          open
          disableCloseOnSelect
          options={["Alpha", "Beta", "Gamma"]}
          value="Alpha"
          onChange={() => undefined}
          renderInput={(params) => <MuiTextField {...params} label="Choose item" />}
        />
      </div>
    );
  }

  if (scenario === "button-themed-override") {
    return (
      <BaseButton variant="outlined" color="secondary" size="large">
        Themed Secondary
      </BaseButton>
    );
  }

  return <div>Unknown scenario</div>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div style={{ padding: 24, width: 420, minHeight: 180, background: "#f5f7fa" }}>
        <Scenario />
      </div>
    </ThemeProvider>
  );
}

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Missing app container");
}
createRoot(rootElement).render(<App />);
setTimeout(() => {
  document.body.setAttribute("data-ready", "true");
}, 50);
`;

const htmlSource = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ui-core visual regression</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./bundle.js"></script>
  </body>
</html>
`;

writeFileSync(entryFile, harnessSource, "utf8");
writeFileSync(htmlFile, htmlSource, "utf8");

await build({
  absWorkingDir: repoRoot,
  entryPoints: [entryFile],
  outfile: bundleFile,
  bundle: true,
  minify: true,
  sourcemap: false,
  platform: "browser",
  format: "esm",
  jsx: "automatic",
  logLevel: "silent"
});

const scenarios = [
  { name: "button-basic", maxDiffRatio: 0.002 },
  { name: "checkbox-form-control", maxDiffRatio: 0.003 },
  { name: "autocomplete-portal", maxDiffRatio: 0.01 },
  { name: "button-themed-override", maxDiffRatio: 0.002 }
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 900, height: 520 },
  deviceScaleFactor: 1,
  colorScheme: "light"
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => {
  pageErrors.push(error.message);
});

const server = createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end("bad request");
    return;
  }

  const requestPath = req.url.split("?")[0] || "/";
  if (requestPath === "/" || requestPath === "/index.html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(htmlSource);
    return;
  }
  if (requestPath === "/bundle.js") {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.end(readFileSync(bundleFile));
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

const serverPort = await new Promise((resolve, reject) => {
  server.on("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") {
      reject(new Error("Failed to resolve visual server port"));
      return;
    }
    resolve(address.port);
  });
});

function decodePng(buffer) {
  return PNG.sync.read(buffer);
}

function encodePng(image) {
  return PNG.sync.write(image);
}

const report = {
  browser: "chromium",
  scenarios: []
};

let failed = false;

for (const scenario of scenarios) {
  const captures = {};

  for (const source of ["upstream", "wrapper"]) {
    const targetUrl = `http://127.0.0.1:${serverPort}/?scenario=${encodeURIComponent(scenario.name)}&source=${source}`;
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.body?.getAttribute("data-ready") === "true", { timeout: 10000 });
    const imageBuffer = await page.screenshot({ fullPage: true });
    captures[source] = imageBuffer;

    const outputPath = path.join(diffDir, `${scenario.name}.${source}.png`);
    writeFileSync(outputPath, imageBuffer);
  }

  const upstreamImage = decodePng(captures.upstream);
  const wrapperImage = decodePng(captures.wrapper);

  if (upstreamImage.width !== wrapperImage.width || upstreamImage.height !== wrapperImage.height) {
    throw new Error(`Image dimensions differ for ${scenario.name}`);
  }

  const diffImage = new PNG({ width: upstreamImage.width, height: upstreamImage.height });
  const mismatchedPixels = pixelmatch(
    upstreamImage.data,
    wrapperImage.data,
    diffImage.data,
    upstreamImage.width,
    upstreamImage.height,
    { threshold: 0.1 }
  );
  const totalPixels = upstreamImage.width * upstreamImage.height;
  const diffRatio = mismatchedPixels / totalPixels;

  const diffPath = path.join(diffDir, `${scenario.name}.diff.png`);
  writeFileSync(diffPath, encodePng(diffImage));

  const status = diffRatio <= scenario.maxDiffRatio ? "pass" : "fail";
  if (status === "fail") {
    failed = true;
  }

  report.scenarios.push({
    scenario: scenario.name,
    maxDiffRatio: scenario.maxDiffRatio,
    diffRatio,
    mismatchedPixels,
    totalPixels,
    status,
    artifacts: {
      upstream: path.relative(repoRoot, path.join(diffDir, `${scenario.name}.upstream.png`)),
      wrapper: path.relative(repoRoot, path.join(diffDir, `${scenario.name}.wrapper.png`)),
      diff: path.relative(repoRoot, diffPath)
    }
  });
}

await browser.close();
server.close();

if (pageErrors.length > 0) {
  throw new Error(`Visual harness page errors: ${pageErrors.join(" | ")}`);
}

const reportPath = path.join(generatedDir, "visual-regression-report.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const summaryLines = report.scenarios.map((entry) => {
  const ratioPct = (entry.diffRatio * 100).toFixed(3);
  return `${entry.status.toUpperCase()} ${entry.scenario}: ${ratioPct}% diff (max ${(entry.maxDiffRatio * 100).toFixed(3)}%)`;
});
console.log(summaryLines.join("\n"));
console.log(`Report: ${path.relative(repoRoot, reportPath)}`);

if (failed) {
  process.exitCode = 1;
}

rmSync(tmpBase, { recursive: true, force: true });
