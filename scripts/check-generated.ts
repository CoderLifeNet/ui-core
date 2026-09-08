import { execSync } from "node:child_process";

execSync("pnpm generate", { stdio: "inherit" });

try {
  execSync("git diff --exit-code -- package.json generated src/index.ts src/material src/lab src/icons", {
    stdio: "inherit"
  });
} catch {
  console.error("Generated files are out of date. Run `pnpm generate` and commit the results.");
  process.exitCode = 1;
}
