import { describe, expect, it } from "vitest";
import { adaptPresentationPackageToRuntime } from "../package/adapter";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import { CueRunner } from "./cueRunner";

describe("CueRunner run of show", () => {
  it("exposes the next cue and planned timing around the current cue", () => {
    const cues = adaptPresentationPackageToRuntime(createDefaultPresentation()).cues;
    const runner = new CueRunner(cues);
    const initial = runner.getSnapshot();
    const totalSeconds = cues.reduce((total, cue) => total + (cue.demo?.targetSeconds ?? 0), 0);

    expect(initial.runOfShow.nextCue?.id).toBe(cues[1]?.id);
    expect(initial.runOfShow.elapsedTargetSeconds).toBe(0);
    expect(initial.runOfShow.remainingTargetSeconds).toBe(totalSeconds);

    runner.dispatch("next");
    const afterNext = runner.getSnapshot();

    expect(afterNext.runOfShow.nextCue?.id).toBe(cues[2]?.id);
    expect(afterNext.runOfShow.elapsedTargetSeconds).toBe(cues[0].demo?.targetSeconds ?? 0);
    expect(afterNext.runOfShow.remainingTargetSeconds).toBe(totalSeconds - (cues[0].demo?.targetSeconds ?? 0));
  });
});
