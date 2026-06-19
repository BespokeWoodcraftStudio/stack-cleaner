import { describe, it, expect } from "vitest";
import { buildProjectLabels } from "../public/scan.mjs";

// Two repos with the same basename (e.g. ~/a/web and ~/b/web) must not collapse
// into one inventory group with a single location.

describe("buildProjectLabels", () => {
  it("uses the bare basename when it is unique", () => {
    const m = buildProjectLabels(["/home/me/code/notes-app", "/home/me/code/api-server"]);
    expect(m.get("/home/me/code/notes-app")).toBe("notes-app");
    expect(m.get("/home/me/code/api-server")).toBe("api-server");
  });

  it("qualifies with the parent dir when basenames collide", () => {
    const m = buildProjectLabels(["/home/me/a/web", "/home/me/b/web"]);
    expect(m.get("/home/me/a/web")).toBe("a/web");
    expect(m.get("/home/me/b/web")).toBe("b/web");
  });

  it("falls back to the full path so every colliding project stays distinct", () => {
    const m = buildProjectLabels(["/x/a/web", "/y/a/web", "/z/b/web"]);
    const labels = [...m.values()];
    expect(new Set(labels).size).toBe(labels.length); // all labels unique
    expect(m.get("/z/b/web")).toBe("b/web"); // the non-colliding one stays short
  });

  it("returns an empty map for no projects", () => {
    expect(buildProjectLabels([]).size).toBe(0);
  });
});
