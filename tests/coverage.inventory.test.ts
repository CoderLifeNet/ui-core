import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const surfacePath = path.join(__dirname, "..", "generated", "mui-surface.json");

describe("mui surface inventory", () => {
  it("contains broad material coverage with deterministic metadata", () => {
    const raw = readFileSync(surfacePath, "utf8");
    const surface = JSON.parse(raw) as {
      baseline: { muiMaterial: string };
      entries: Array<{ subpath: string; category: string }>;
    };

    expect(surface.baseline.muiMaterial).toBe("9.4.0");
    expect(surface.entries.length).toBeGreaterThanOrEqual(150);
    expect(surface.entries.some((entry) => entry.subpath === "./Button")).toBe(true);
    expect(surface.entries.some((entry) => entry.subpath === "./Autocomplete")).toBe(true);
    expect(surface.entries.some((entry) => entry.category === "hook")).toBe(true);
  });
});
