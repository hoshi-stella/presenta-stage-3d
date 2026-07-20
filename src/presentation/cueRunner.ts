import { resolveDirection } from "./directionResolver";
import { characterIds } from "../scene/characterRegistry";
import type {
  CharacterId,
  CharacterRuntimeState,
  CharacterState,
  Cue,
  CueId,
  PresentationListener,
  PresentationMode,
  PresentationSnapshot,
  PresenterCommand
} from "./types";

export class CueRunner {
  private index = 0;
  private mode: PresentationMode = "manual";
  private showSpeakerNote = true;
  private aiMessage: string | null = null;
  private statusMessage: string | null = null;
  private isPaused = false;
  private timerId: number | null = null;
  private readonly cueIndexById = new Map<CueId, number>();
  private readonly history: number[] = [];
  private readonly listeners = new Set<PresentationListener>();

  constructor(private readonly cues: Cue[]) {
    if (cues.length === 0) {
      throw new Error("CueRunner requires at least one cue.");
    }

    cues.forEach((cue, cueIndex) => {
      this.cueIndexById.set(cue.id, cueIndex);
    });
  }

  subscribe(listener: PresentationListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): PresentationSnapshot {
    const cue = this.cues[this.index];
    return {
      mode: this.mode,
      cueIndex: this.index,
      cueCount: this.cues.length,
      showSpeakerNote: this.showSpeakerNote,
      aiMessage: this.aiMessage,
      statusMessage: this.statusMessage,
      isPaused: this.isPaused,
      cue,
      resolvedDirection: resolveDirection(cue),
      characterStates: this.getCharacterStates(cue.speaker)
    };
  }

  dispatch(command: PresenterCommand): boolean {
    if (command === "pause") {
      this.pause();
      return true;
    }

    if (command === "resume") {
      this.resume();
      return true;
    }

    if (command === "back") {
      return this.back();
    }

    if (command === "skip") {
      return this.next();
    }

    const currentCue = this.cues[this.index];
    const branch = currentCue.after.branches?.find((candidate) => candidate.command === command);
    if (branch) {
      return this.goToCue(branch.targetCueId, `Command: ${branch.label}`);
    }

    if (command === "next") {
      return this.next();
    }

    this.statusMessage = `このキューでは ${command} は使用できません。`;
    this.emit();
    return false;
  }

  reset(): void {
    this.stopTimer();
    this.index = 0;
    this.mode = "manual";
    this.isPaused = false;
    this.statusMessage = null;
    this.aiMessage = null;
    this.history.length = 0;
    this.emit();
  }

  toggleSpeakerNote(): void {
    this.showSpeakerNote = !this.showSpeakerNote;
    this.emit();
  }

  setAiMessage(message: string | null): void {
    this.aiMessage = message;
    this.emit();
  }

  setStatusMessage(message: string | null): void {
    this.statusMessage = message;
    this.emit();
  }

  private resume(): void {
    this.mode = "semiAuto";
    this.isPaused = false;
    this.statusMessage = "Semi-Auto Mode";
    this.scheduleIfNeeded();
    this.emit();
  }

  private pause(): void {
    this.stopTimer();
    this.mode = "manual";
    this.isPaused = true;
    this.statusMessage = "Paused";
    this.emit();
  }

  private next(): boolean {
    if (this.index >= this.cues.length - 1) {
      this.statusMessage = "最後のキューです。";
      this.stopTimer();
      this.emit();
      return false;
    }

    return this.setIndex(this.index + 1, "Next");
  }

  private back(): boolean {
    this.stopTimer();
    if (this.history.length > 0) {
      const previousIndex = this.history.pop();
      if (previousIndex !== undefined) {
        this.index = previousIndex;
        this.statusMessage = "Back";
        this.emit();
        return true;
      }
    }

    if (this.index <= 0) {
      this.statusMessage = "最初のキューです。";
      this.emit();
      return false;
    }

    this.index -= 1;
    this.statusMessage = "Back";
    this.emit();
    return true;
  }

  private goToCue(cueId: CueId, message: string): boolean {
    const targetIndex = this.cueIndexById.get(cueId);
    if (targetIndex === undefined) {
      this.statusMessage = `Cue not found: ${cueId}`;
      this.emit();
      return false;
    }

    return this.setIndex(targetIndex, message);
  }

  private setIndex(targetIndex: number, message: string): boolean {
    this.stopTimer();
    this.history.push(this.index);
    this.index = targetIndex;
    this.statusMessage = message;
    this.scheduleIfNeeded();
    this.emit();
    return true;
  }

  private scheduleIfNeeded(): void {
    if (this.mode !== "semiAuto" || this.isPaused) {
      return;
    }

    const cue = this.cues[this.index];
    if (cue.after.mode !== "auto_next") {
      return;
    }

    const durationMs = cue.after.durationMs ?? 8000;
    this.timerId = window.setTimeout(() => {
      this.next();
    }, durationMs);
  }

  private stopTimer(): void {
    if (this.timerId === null) {
      return;
    }

    window.clearTimeout(this.timerId);
    this.timerId = null;
  }

  private getCharacterStates(speaker: CharacterId): CharacterRuntimeState {
    return characterIds.reduce<CharacterRuntimeState>((states, characterId) => {
      states[characterId] = this.getStateForCharacter(characterId, speaker);
      return states;
    }, {} as CharacterRuntimeState);
  }

  private getStateForCharacter(characterId: CharacterId, speaker: CharacterId): CharacterState {
    if (characterId === "dummy") {
      return "idle";
    }

    return characterId === speaker ? "speaking" : "listening";
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
