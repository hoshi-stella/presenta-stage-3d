import { describe, expect, it } from "vitest";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import { diffPresentationRevision, listRevisionSnapshots, recordRevisionSnapshot, restoreRevisionSnapshot } from "./revisionHistory";

describe("revision history", () => {
  it("records an independent Package snapshot with optional label and note", () => {
    const draft = createDefaultPresentation();
    const snapshot = recordRevisionSnapshot(draft, {
      id: "revision_001",
      label: "Before rehearsal",
      note: "Keep this cut for the venue.",
      createdAt: "2026-08-10T09:00:00.000Z"
    });

    draft.presentation.title = "Working draft";

    expect(snapshot).toMatchObject({
      id: "revision_001",
      label: "Before rehearsal",
      note: "Keep this cut for the venue.",
      createdAt: "2026-08-10T09:00:00.000Z",
      presentation: { presentation: { title: "Built-in presentation" } }
    });
  });

  it("lists revision snapshots newest first without changing the supplied collection", () => {
    const presentation = createDefaultPresentation();
    const older = recordRevisionSnapshot(presentation, { id: "revision_001", createdAt: "2026-08-10T09:00:00.000Z" });
    const newer = recordRevisionSnapshot(presentation, { id: "revision_002", label: "Final", createdAt: "2026-08-10T10:00:00.000Z" });
    const revisions = [older, newer];

    expect(listRevisionSnapshots(revisions).map((revision) => revision.id)).toEqual(["revision_002", "revision_001"]);
    expect(revisions.map((revision) => revision.id)).toEqual(["revision_001", "revision_002"]);
  });

  it("restores a snapshot as a new Package without mutating the current draft", () => {
    const original = createDefaultPresentation();
    const snapshot = recordRevisionSnapshot(original, { id: "revision_001", createdAt: "2026-08-10T09:00:00.000Z" });
    const draft = { ...original, presentation: { ...original.presentation, title: "Edited title" } };

    const restored = restoreRevisionSnapshot(draft, snapshot);
    restored.presentation.title = "Restored title";

    expect(draft.presentation.title).toBe("Edited title");
    expect(snapshot.presentation.presentation.title).toBe("Built-in presentation");
    expect(restored.presentation.title).toBe("Restored title");
  });

  it("reports concise slide and Cue additions, removals, and reordering", () => {
    const before = createDefaultPresentation();
    const [firstSlide, secondSlide, ...remainingSlides] = before.slides;
    const [firstCue, secondCue, ...remainingCues] = before.cues;
    const after = {
      ...before,
      slides: [secondSlide, firstSlide, ...remainingSlides.slice(1), { ...remainingSlides[0], id: "slide_added" }],
      cues: [secondCue, firstCue, ...remainingCues.slice(1), { ...remainingCues[0], id: "cue_added" }]
    };

    const diff = diffPresentationRevision(before, after);

    expect(diff.slides).toEqual({
      added: ["slide_added"],
      removed: [remainingSlides[0].id],
      reordered: [
        { id: secondSlide.id, from: 1, to: 0 },
        { id: firstSlide.id, from: 0, to: 1 }
      ]
    });
    expect(diff.cues).toEqual({
      added: ["cue_added"],
      removed: [remainingCues[0].id],
      reordered: [
        { id: secondCue.id, from: 1, to: 0 },
        { id: firstCue.id, from: 0, to: 1 }
      ]
    });
  });
});
