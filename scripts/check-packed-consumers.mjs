import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const { name, version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const tarball = path.join(root, "artifacts", `${name.slice(1).replace("/", "-")}-${version}.tgz`);
const fixture = mkdtempSync(path.join(tmpdir(), "ui-core-consumer-"));
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };

function run(command, args) {
  execFileSync(command, args, { cwd: fixture, env, stdio: "inherit" });
}

function bin(name) {
  return path.join(fixture, "node_modules", ".bin", name);
}

async function waitForServer(server, url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    assert.equal(server.exitCode, null, `Server exited before listening at ${url}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000) }).catch(() => null);
    if (response) {
      assert.ok(response.ok, `Server returned ${response.status} at ${url}`);
      return response.text();
    }
    await delay(250);
  }
  throw new Error(`Server failed to start at ${url}`);
}

async function checkBrowser(browser, { command, args, port, ssr }) {
  const server = spawn(command, args, { cwd: fixture, env, stdio: "inherit" });
  const exited = once(server, "close");
  const url = `http://127.0.0.1:${port}`;
  try {
    const html = await Promise.race([
      waitForServer(server, url),
      exited.then(([code, signal]) => { throw new Error(`Consumer server exited: ${code ?? signal}`); })
    ]);
    if (ssr) {
      assert.match(html, /<h1>Packed ui-core consumer<\/h1>/);
      assert.match(html, /<input\b[^>]*\bdata-consumer-slot="true"/);
      assert.match(html, />Server root button<\/button>/);
      assert.match(html, />Server deep button<\/button>/);
    }

    const page = await browser.newPage();
    try {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" && /hydrat|server rendered/i.test(message.text())) errors.push(message.text());
      });
      await page.goto(url);
      await page.getByText("Hydrated", { exact: true }).waitFor();
      const email = page.getByRole("textbox", { name: "Email" });
      assert.equal(await email.getAttribute("data-consumer-slot"), "true");
      assert.equal(await email.getAttribute("aria-describedby"), "consumer-email-helper-text");
      const plain = page.getByRole("button", { name: "Plain button" });
      const tracked = page.getByRole("button", { name: "Tracked button" });
      for (const button of [plain, tracked]) {
        assert.equal(await button.evaluate((element) => getComputedStyle(element).borderTopLeftRadius), "14px");
      }
      await plain.click();
      await page.getByText("Plain clicks: 1").waitFor();
      assert.ok(await page.getByText("No tracked events").isVisible());
      await tracked.click();
      await page.getByText("ui.button.click").waitFor();
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  } finally {
    server.kill();
    await exited;
  }
}

try {
  cpSync(path.join(root, "tests", "packed-consumer"), fixture, { recursive: true });
  cpSync(tarball, path.join(fixture, "ui-core.tgz"));
  const manifest = path.join(fixture, "package.json");
  const pkg = JSON.parse(readFileSync(manifest, "utf8"));
  pkg.dependencies[name] = "file:./ui-core.tgz";
  writeFileSync(manifest, JSON.stringify(pkg, null, 2));
  run("npm", ["install", "--no-audit", "--no-fund", "--fetch-retries=0"]);

  // Check the packed declarations before Next adds its own types to the project.
  run(bin("tsc"), ["--noEmit", "--skipLibCheck", "false"]);
  run(bin("vite"), ["build"]);
  run(bin("next"), ["build", "--webpack"]);

  const buildOnly = process.argv.includes("--build-only");
  if (!buildOnly) {
    const browser = await chromium.launch();
    try {
      await checkBrowser(browser, {
        command: bin("vite"),
        args: ["preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
        port: 4173,
        ssr: false
      });
      await checkBrowser(browser, {
        command: bin("next"),
        args: ["start", "--hostname", "127.0.0.1", "--port", "4174"],
        port: 4174,
        ssr: true
      });
    } finally {
      await browser.close();
    }
  }
  console.log(buildOnly
    ? "Packed ui-core consumer builds passed. Browser checks were skipped."
    : "Packed ui-core consumer checks passed.");
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
