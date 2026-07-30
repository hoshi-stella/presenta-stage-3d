import { describe, expect, it } from "vitest";
import { addCue, deleteCue, duplicateCue, mergeCueWithNext, moveCue, splitCue, updateCue } from "./cueEditor";
import { createDefaultPresentation } from "../presentations/defaultPresentation";

describe("cue editor commands", () => {
  it("adds, duplicates, updates, and reorders cues with stable IDs", () => {
    const presentation = createDefaultPresentation();
    const added = addCue(presentation, presentation.slides[0].id);
    const duplicate = duplicateCue(added, added.cues[0].id);
    const updated = updateCue(duplicate, duplicate.cues[0].id, { text: "Updated", direction: { intent: "focus", intensity: "high" } });
    const moved = moveCue(updated, updated.cues[1].id, -1);
    expect(new Set(moved.cues.map((cue) => cue.id)).size).toBe(moved.cues.length);
    expect(updated.cues[0].text).toBe("Updated");
  });

  it("keeps one cue minimum and removes branch targets of deleted cues", () => {
    const presentation = createDefaultPresentation();
    const target = presentation.cues[1];
    const linked = updateCue(presentation, presentation.cues[0].id, { after: { mode: "branch_available", branches: [{ command: "next", label: "Next", targetCueId: target.id }] } });
    const deleted = deleteCue(linked, target.id);
    expect(deleted.cues[0].after.branches).toEqual([]);
    expect(deleteCue({ ...linked, cues: [linked.cues[0]] }, linked.cues[0].id)).toEqual({ ...linked, cues: [linked.cues[0]] });
  });

  it("splits and merges cue text without changing the original references", () => {
    const presentation = createDefaultPresentation();
    const cue = { ...presentation.cues[0], text: "First sentence. Second sentence.", estimatedDurationMs: 1200 };
    const source = { ...presentation, cues: [cue, ...presentation.cues.slice(1)] };
    const split = splitCue(source, cue.id, 15);
    expect(split.cues).toHaveLength(source.cues.length + 1);
    expect(split.cues[1]).toMatchObject({ slideRef: cue.slideRef, speaker: cue.speaker });
    expect(mergeCueWithNext(split, cue.id).cues).toHaveLength(source.cues.length);
  });
});
