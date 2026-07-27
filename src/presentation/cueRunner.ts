import { resolveDirection } from "./directionResolver";
import { resolvePresentationComposition } from "./presentationComposer";
import { characterIds } from "../scene/characterRegistry";
import type {
  CharacterId,
  CharacterRuntimeState,
  CharacterState,
  Cue,
  CueId,
  FallbackLevel,
  PresentationListener,
  PresentationMode,
  PresentationSnapshot,
  PresenterCommand
} from "./types";

export class CueRunner {
  private index = 0;
  private mode: PresentationMode = "manual";
  private showSpeakerNote = true;
  private showSubtitles = true;
  private fallbackLevel: FallbackLevel = "full";
  private aiMessage: string | null = null;
  private statusMessage: string | null = null;
  private isPaused = false;
  private audio: PresentationSnapshot["audio"] = {
    cueId: null,
    state: "idle" as const,
    message: null
  };
  private timerId: number | null = null;
  private qaReturnCueId: CueId | null = null;
  private readonly cueIndexById = new Map<CueId, number>();
  private readonly history: number[] = [];
  private readonly listeners = new Set<PresentationListener>();

  constructor(private cues: Cue[]) {
    if (cues.length === 0) {
      throw new Error("CueRunner requires at least one cue.");
    }

    this.rebuildCueIndex();
  }

  subscribe(listener: PresentationListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): PresentationSnapshot {
    const cue = this.cues[this.index];
    const presentation = resolvePresentationComposition(cue, this.fallbackLevel);
    return {
      mode: this.mode,
      cueIndex: this.index,
      cueCount: this.cues.length,
      showSpeakerNote: this.showSpeakerNote,
      showSubtitles: this.showSubtitles,
      fallbackLevel: this.fallbackLevel,
      aiMessage: this.aiMessage,
      statusMessage: this.statusMessage,
      isPaused: this.isPaused,
      audio: this.audio,
      cue,
      resolvedDirection: resolveDirection(cue),
      characterStates: this.getCharacterStates(cue.speaker),
      flow: {
        isQaActive: this.mode === "qa",
        returnCueId: this.qaReturnCueId,
        returnCueLabel: this.getCueLabel(this.qaReturnCueId),
        shortcutCommands: this.getShortcutCommands()
      },
      presentation
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

    if (command === "demo") {
      this.startDemoScript();
      return true;
    }

    if (command === "back") {
      return this.back();
    }

    if (command === "qa") {
      return this.enterQaMode();
    }

    if (command === "return_to_script" && this.qaReturnCueId) {
      return this.returnToScript();
    }

    if (command === "summary") {
      return this.goToFirstCueOfKind("summary", "Summary shortcut");
    }

    if (command === "skip") {
      return this.skipAhead();
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
    this.qaReturnCueId = null;
    this.statusMessage = null;
    this.aiMessage = null;
    this.history.length = 0;
    this.emit();
  }

  toggleSpeakerNote(): void {
    this.showSpeakerNote = !this.showSpeakerNote;
    this.emit();
  }

  toggleSubtitles(): void {
    this.showSubtitles = !this.showSubtitles;
    this.emit();
  }

  setFallbackLevel(level: FallbackLevel): void {
    this.fallbackLevel = level;
    this.statusMessage = `Fallback level: ${level}`;
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

  setAudioPlayback(audio: PresentationSnapshot["audio"]): void {
    if (this.audio.cueId === audio.cueId && this.audio.state === audio.state && this.audio.message === audio.message) {
      return;
    }

    this.audio = audio;
    this.emit();
  }

  loadCues(cues: Cue[], message = "Loaded generated cues"): boolean {
    if (cues.length === 0) {
      this.statusMessage = "Cue generation failed: no playable cues.";
      this.emit();
      return false;
    }

    this.stopTimer();
    this.cues = cues;
    this.index = 0;
    this.mode = "manual";
    this.isPaused = false;
    this.aiMessage = null;
    this.qaReturnCueId = null;
    this.statusMessage = message;
    this.history.length = 0;
    this.rebuildCueIndex();
    this.emit();
    return true;
  }

  private resume(): void {
    this.mode = this.qaReturnCueId && this.cues[this.index]?.kind === "qa" ? "qa" : "semiAuto";
    this.isPaused = false;
    this.statusMessage = this.mode === "qa" ? "QA Mode" : "Semi-Auto Mode";
    this.scheduleIfNeeded();
    this.emit();
  }

  private startDemoScript(): void {
    this.mode = "demoScript";
    this.isPaused = false;
    this.statusMessage = "Demo Script Mode";
    this.scheduleIfNeeded();
    this.emit();
  }

  private pause(): void {
    this.stopTimer();
    if (this.mode !== "qa") {
      this.mode = "manual";
    }
    this.isPaused = true;
    this.statusMessage = "Paused";
    this.emit();
  }

  private next(): boolean {
    if (this.mode === "demoScript") {
      return this.nextDemoStep();
    }

    if (this.index >= this.cues.length - 1) {
      this.statusMessage = "最後のキューです。";
      this.stopTimer();
      this.emit();
      return false;
    }

    return this.setIndex(this.index + 1, "Next");
  }

  private nextDemoStep(): boolean {
    const currentStep = this.cues[this.index].demo?.step ?? 0;
    const nextDemoIndex = this.cues
      .map((cue, cueIndex) => ({ cue, cueIndex }))
      .filter(({ cue }) => (cue.demo?.step ?? 0) > currentStep)
      .sort((left, right) => (left.cue.demo?.step ?? 0) - (right.cue.demo?.step ?? 0))[0]?.cueIndex;

    if (nextDemoIndex === undefined) {
      this.statusMessage = "Demo Script Mode finished.";
      this.stopTimer();
      this.mode = "manual";
      this.emit();
      return false;
    }

    return this.setIndex(nextDemoIndex, "Demo Script Next");
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

  private setIndex(targetIndex: number, message: string, options: { preserveQaMode?: boolean } = {}): boolean {
    this.stopTimer();
    this.history.push(this.index);
    this.index = targetIndex;
    if (!options.preserveQaMode && this.mode === "qa") {
      this.mode = "manual";
      this.qaReturnCueId = null;
    }
    this.statusMessage = message;
    this.scheduleIfNeeded();
    this.emit();
    return true;
  }

  private enterQaMode(): boolean {
    const qaIndex = this.cues.findIndex((cue) => cue.kind === "qa");
    if (qaIndex === -1) {
      this.statusMessage = "QA cue is not available.";
      this.emit();
      return false;
    }

    this.stopTimer();
    this.qaReturnCueId = this.findReturnCueId();
    this.history.push(this.index);
    this.index = qaIndex;
    this.mode = "qa";
    this.isPaused = false;
    this.statusMessage = `QA Mode: return target is ${this.qaReturnCueId ?? "not set"}.`;
    this.emit();
    return true;
  }

  private returnToScript(): boolean {
    if (!this.qaReturnCueId) {
      this.statusMessage = "Return target is not set.";
      this.emit();
      return false;
    }

    const returnCueId = this.qaReturnCueId;
    this.qaReturnCueId = null;
    this.mode = "manual";
    return this.goToCue(returnCueId, "Returned to script");
  }

  private skipAhead(): boolean {
    if (this.mode === "qa" && this.qaReturnCueId) {
      return this.returnToScript();
    }

    const summaryIndex = this.cues.findIndex((cue, cueIndex) => cueIndex > this.index && cue.kind === "summary");
    if (summaryIndex !== -1) {
      return this.setIndex(summaryIndex, "Skip to summary");
    }

    return this.next();
  }

  private goToFirstCueOfKind(kind: Cue["kind"], message: string): boolean {
    const targetIndex = this.cues.findIndex((cue) => cue.kind === kind);
    if (targetIndex === -1) {
      this.statusMessage = `${kind} cue is not available.`;
      this.emit();
      return false;
    }

    return this.setIndex(targetIndex, message);
  }

  private scheduleIfNeeded(): void {
    if ((this.mode !== "semiAuto" && this.mode !== "demoScript") || this.isPaused) {
      return;
    }

    const cue = this.cues[this.index];
    if (this.mode === "semiAuto" && cue.after.mode !== "auto_next") {
      return;
    }

    const durationMs = cue.audio?.durationMs ?? cue.after.durationMs ?? (this.mode === "demoScript" ? 7000 : 8000);
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

  private rebuildCueIndex(): void {
    this.cueIndexById.clear();
    this.cues.forEach((cue, cueIndex) => {
      this.cueIndexById.set(cue.id, cueIndex);
    });
  }

  private findReturnCueId(): CueId | null {
    return this.cues[this.index]?.id ?? null;
  }

  private getCueLabel(cueId: CueId | null): string | null {
    if (!cueId) {
      return null;
    }

    const cueIndex = this.cueIndexById.get(cueId);
    if (cueIndex === undefined) {
      return cueId;
    }

    const cue = this.cues[cueIndex];
    return `${cue.id} / ${cue.kind}`;
  }

  private getShortcutCommands(): PresenterCommand[] {
    const commands: PresenterCommand[] = [];
    if (this.cues.some((cue) => cue.kind === "qa")) {
      commands.push("qa");
    }

    if (this.qaReturnCueId) {
      commands.push("return_to_script");
    }

    if (this.cues.some((cue) => cue.kind === "summary")) {
      commands.push("summary");
    }

    commands.push("demo");
    commands.push("skip");
    return commands;
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

    if (characterId !== speaker) {
      return "listening";
    }

    const cue = this.cues[this.index];
    const audioHasEnded = cue.audio?.src
      && this.audio.cueId === cue.id
      && !["loading", "playing"].includes(this.audio.state);
    return audioHasEnded ? "listening" : "speaking";
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
