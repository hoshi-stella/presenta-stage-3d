import { describe, expect, it } from "vitest";
import { createPresentationKey, createStarterPresentation } from "./newPresentation";

describe("new presentation", () => {
  it("creates a stable Package identity and draft metadata", () => {
    const now = new Date("2026-08-10T01:02:03.000Z");
    const presentation = createStarterPresentation({ title: "WebGL Talk", authorName: "Airi", now });
    expect(presentation.presentation.id).toBe("webgl-talk-20260810t010203");
    expect(presentation.presentation.title).toBe("WebGL Talk");
    expect(presentation.presentation.author.name).toBe("Airi");
    expect(presentation.publication?.lifecycle).toBe("draft");
  });

  it("uses a portable fallback key for titles without ASCII slug characters", () => {
    expect(createPresentationKey("発表資料", new Date("2026-08-10T01:02:03.000Z"))).toBe("presentation-20260810t010203");
  });
});
