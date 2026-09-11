import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { publishTarball } from "./publish-tarball.mjs";

test("dry-run and publication resolve local tarballs identically and retain alpha policy", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "release path "));
  try {
    mkdirSync(path.join(directory, "artifacts"));
    for (const name of ["ui-core", "ui-components"]) {
      const absolute = path.join(directory, "artifacts", `coderlifenet-${name}-0.1.0-alpha.2.tgz`);
      writeFileSync(absolute, "fixture");
      for (const input of [path.relative(process.cwd(), absolute), absolute]) {
        const calls = [];
        for (const dryRun of [true, false]) {
          publishTarball(input, { dryRun, execute: (...args) => calls.push(args) });
        }
        for (const [command, args] of calls) {
          assert.equal(command, "npm");
          assert.deepEqual(args.slice(0, 9), ["publish", absolute, "--ignore-scripts", "--access", "public", "--tag", "alpha", "--registry", "https://registry.npmjs.org/"]);
          assert.ok(path.isAbsolute(args[1]));
        }
        assert.deepEqual(calls[0][1].slice(9), ["--dry-run", "--provenance=false"]);
        assert.deepEqual(calls[1][1].slice(9), ["--provenance"]);
      }
    }
    for (const dryRun of [true, false]) {
      const execute = () => assert.fail("npm must not run for missing or non-file artifacts");
      assert.throws(() => publishTarball(path.join(directory, "missing.tgz"), { dryRun, execute }), /ENOENT/);
      assert.throws(() => publishTarball(directory, { dryRun, execute }), /must be a file/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});