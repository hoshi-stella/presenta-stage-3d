import { describe, expect, it } from "vitest";
import { importMarkdownPresentation } from "./markdownImporter";
import { validatePresentationPackage } from "../package/validator";

describe("importMarkdownPresentation", () => {
  it("imports front matter and slide sections into a valid presentation package", () => {
    const { presentation, warnings } = importMarkdownPresentation(`---
title: Markdown presentation
author: Airi
language: ja
---

# Welcome

This is the opening slide.

---

## What we will cover

- Cue-driven playback
- Reusable presentation layers
`);

    expect(warnings).toEqual([]);
    expect(presentation.presentation).toMatchObject({
      title: "Markdown presentation",
      author: { name: "Airi" },
      language: "ja"
    });
    expect(presentation.slides).toEqual([
      expect.objectContaining({ title: "Welcome", body: "This is the opening slide." }),
      expect.objectContaining({ title: "What we will cover", bullets: ["Cue-driven playback", "Reusable presentation layers"] })
    ]);
    expect(presentation.cues).toHaveLength(2);
    expect(presentation.cues.map((cue) => cue.slideRef)).toEqual(presentation.slides.map((slide) => slide.id));
    expect(validatePresentationPackage(presentation).valid).toBe(true);
  });

  it("applies cue directives from HTML comments to the next generated cue", () => {
    const { presentation } = importMarkdownPresentation(`<!-- presenta: speaker=airi_manju note="Explain the tradeoff" intent=question profile=manju_commentary -->
# A question

Can we use the same data for every presentation style?
`);

    expect(presentation.cues[0]).toMatchObject({
      speaker: "airi_manju",
      note: "Explain the tradeoff",
      direction: { intent: "question" },
      presentation: { profile: "manju_commentary" }
    });
  });

  it("generates stable unique ids from the same markdown source", () => {
    const markdown = `# First slide

One paragraph.

---

# First slide

Another paragraph.`;

    const first = importMarkdownPresentation(markdown).presentation;
    const second = importMarkdownPresentation(markdown).presentation;

    expect(first.presentation.id).toBe(second.presentation.id);
    expect(first.slides.map((slide) => slide.id)).toEqual(second.slides.map((slide) => slide.id));
    expect(first.cues.map((cue) => cue.id)).toEqual(second.cues.map((cue) => cue.id));
    expect(new Set(first.slides.map((slide) => slide.id)).size).toBe(first.slides.length);
    expect(new Set(first.cues.map((cue) => cue.id)).size).toBe(first.cues.length);
  });

  it("uses explicit options as defaults when front matter is absent", () => {
    const { presentation } = importMarkdownPresentation("# Untitled", {
      title: "Imported draft",
      author: "Studio user",
      language: "en"
    });

    expect(presentation.presentation).toMatchObject({
      title: "Imported draft",
      author: { name: "Studio user" },
      language: "en"
    });
  });

  it("rejects empty documents and documents without slide content", () => {
    expect(() => importMarkdownPresentation("")).toThrow(/empty/i);
    expect(() => importMarkdownPresentation("---\ntitle: Empty\n---")).toThrow(/slide/i);
    expect(() => importMarkdownPresentation("Only text without a heading")).toThrow(/heading/i);
  });
});
