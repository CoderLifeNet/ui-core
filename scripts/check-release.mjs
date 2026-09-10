import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const manifest = JSON.parse(readFileSync("package.json", "utf8"));
assert.ok(["@coderlifenet/ui-core", "@coderlifenet/ui-components"].includes(manifest.name), "Only the renamed release identities are authorized");
const repository = manifest.name.replace("@coderlifenet/", "CoderLifeNet/");
const filename = `${manifest.name.slice(1).replace("/", "-")}-${manifest.version}.tgz`;
const tarball = path.resolve("artifacts", filename);
const bytes = readFileSync(tarball);
const packed = JSON.parse(execFileSync("tar", ["-xOf", tarball, "package/package.json"], { encoding: "utf8" }));
const entries = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" }).trim().split("\n");
assert.equal(packed.name, manifest.name);
assert.equal(packed.version, manifest.version);
assert.match(packed.version, /^\d+\.\d+\.\d+-alpha\.\d+$/);
assert.equal(packed.repository.url, `git+https://github.com/${repository}.git`);
assert.equal(packed.license, "MIT");
assert.equal(packed.publishConfig.access, "public");
assert.equal(packed.publishConfig.tag, "alpha");
assert.equal(packed.publishConfig.provenance, true);
for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
  for (const specifier of Object.values(packed[section] ?? {})) {
    assert.ok(!/^(file:|link:|workspace:|\/|\.\.?\/|[A-Za-z]:[\\/])/.test(specifier), `Nonportable ${section}: ${specifier}`);
  }
}
for (const entry of entries) {
  assert.ok(!entry.split("/").includes(".."), `Unsafe path: ${entry}`);
  assert.ok(/^package\/(dist\/|generated\/mui-(surface|export-map)\.json$|package\.json$|README\.md$|LICENSE$)/.test(entry), `Outside publish allowlist: ${entry}`);
}
for (const required of ["package.json", "README.md", "LICENSE"]) assert.ok(entries.includes(`package/${required}`));
function checkTarget(target) {
  if (typeof target === "string") {
    assert.ok(target.startsWith("./"));
    assert.ok(entries.includes(`package/${target.slice(2)}`), `Missing export: ${target}`);
  } else {
    for (const nested of Object.values(target)) checkTarget(nested);
  }
}
checkTarget(packed.exports);
checkTarget(packed.types);
checkTarget(packed.main);
if (packed.name === "@coderlifenet/ui-components") assert.equal(packed.peerDependencies["@coderlifenet/ui-core"], packed.version);

const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const report = {
  name: packed.name,
  version: packed.version,
  sourceCommit,
  filename,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
  files: entries.length
};
if (process.argv.includes("--verify-only")) {
  const expected = JSON.parse(readFileSync("artifacts/release.json", "utf8"));
  assert.deepEqual(report, expected, "Artifact identity does not match validated source and bytes");
} else {
  writeFileSync("artifacts/release.json", `${JSON.stringify(report, null, 2)}\n`);
}
if (process.argv.includes("--available")) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packed.name)}`);
  if (response.status === 200) {
    const metadata = await response.json();
    assert.ok(!metadata.versions?.[packed.version], "Version already published; never overwrite");
  } else {
    assert.equal(response.status, 404, "Registry availability check failed");
    console.log("No public package visible; this does not prove scope access or name availability for this identity.");
  }
}
if (process.argv.includes("--require-core") && packed.name === "@coderlifenet/ui-components") {
  const response = await fetch(`https://registry.npmjs.org/@coderlifenet%2fui-core/${packed.version}`);
  assert.equal(response.status, 200, "Publish the exact core alpha first");
  const core = await response.json();
  assert.equal(core.version, packed.version);
  assert.equal(core.repository.url, "git+https://github.com/CoderLifeNet/ui-core.git");
}
if (process.argv.includes("--dry-run")) {
  execFileSync("npm", ["publish", tarball, "--dry-run", "--ignore-scripts", "--access", "public", "--tag", "alpha", "--provenance=false", "--registry", "https://registry.npmjs.org/"], { stdio: "inherit" });
}
console.log(JSON.stringify(report, null, 2));