// Isolated regression proof: never modify the caller's worktree or index.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const copy = mkdtempSync(path.join(tmpdir(), "ui-core-drift-proof-"));
try {
  for (const item of ["scripts", "src", "generated", "package.json"]) cpSync(path.join(root, item), path.join(copy, item), { recursive: true });
  symlinkSync(path.join(root, "node_modules"), path.join(copy, "node_modules"), "dir");
  const git = (...args) => execFileSync("git", args, { cwd: copy, stdio: "pipe" });
  git("init", "-q");
  git("config", "user.name", "Drift regression fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "commit.gpgsign", "false");
  git("add", "scripts", "src", "generated", "package.json");
  git("commit", "-qm", "Correct generated fixture");
  const check = (label, expected) => {
    const before = git("status", "--porcelain").toString();
    const result = spawnSync(path.join(copy, "node_modules/.bin/tsx"), ["scripts/check-generated.ts"], { cwd: copy, encoding: "utf8" });
    assert.equal(result.status, expected, `${label}: ${result.stdout}\n${result.stderr}`);
    assert.equal(git("status", "--porcelain").toString(), before, "check changed worktree/index");
    console.log(`PASS ${label}: exit ${result.status}`);
  };
  check("correct generated output", 0);
  const surfacePath = path.join(copy, "generated/mui-surface.json");
  const original = readFileSync(surfacePath, "utf8");
  const stale = JSON.parse(original);
  stale.baseline.muiMaterial = "0.0.0-stale";
  writeFileSync(surfacePath, JSON.stringify(stale, null, 2) + "\n");
  check("unstaged semantic drift", 1);
  git("add", "generated/mui-surface.json");
  check("staged semantic drift", 1);
  git("commit", "-qm", "Committed stale output");
  check("committed semantic drift", 1);
  writeFileSync(surfacePath, original);
  const generator = path.join(copy, "scripts/generate-mui-surface.ts");
  const source = readFileSync(generator, "utf8");
  assert.ok(source.includes("Generated from installed package export metadata and declaration files."));
  writeFileSync(generator, source.replace("Generated from installed package export metadata and declaration files.", "Changed generator input for regression proof."));
  check("changed generator without regeneration", 1);
  execFileSync(path.join(copy, "node_modules/.bin/tsx"), ["scripts/generate-mui-surface.ts"], { cwd: copy, stdio: "pipe" });
  check("correct regeneration", 0);
} finally {
  rmSync(copy, { recursive: true, force: true });
}