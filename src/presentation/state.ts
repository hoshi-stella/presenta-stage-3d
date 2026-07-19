import type {
  PresentationListener,
  PresentationMode,
  PresentationSection,
  PresentationSnapshot
} from "./types";

export class PresentationState {
  private index = 0;
  private mode: PresentationMode = "manual";
  private showSpeakerNote = true;
  private aiMessage: string | null = null;
  private isScriptPlaying = false;
  private readonly listeners = new Set<PresentationListener>();

  constructor(private readonly sections: PresentationSection[]) {
    if (sections.length === 0) {
      throw new Error("PresentationState requires at least one section.");
    }
  }

  subscribe(listener: PresentationListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): PresentationSnapshot {
    return {
      mode: this.mode,
      sectionIndex: this.index,
      sectionCount: this.sections.length,
      showSpeakerNote: this.showSpeakerNote,
      aiMessage: this.aiMessage,
      isScriptPlaying: this.isScriptPlaying,
      section: this.sections[this.index]
    };
  }

  next(): boolean {
    if (this.index >= this.sections.length - 1) {
      return false;
    }

    this.index += 1;
    this.emit();
    return true;
  }

  previous(): boolean {
    if (this.index <= 0) {
      return false;
    }

    this.index -= 1;
    this.emit();
    return true;
  }

  reset(): void {
    this.index = 0;
    this.mode = "manual";
    this.isScriptPlaying = false;
    this.aiMessage = null;
    this.emit();
  }

  setMode(mode: PresentationMode): void {
    this.mode = mode;
    this.emit();
  }

  setScriptPlaying(isPlaying: boolean): void {
    this.isScriptPlaying = isPlaying;
    this.mode = isPlaying ? "script" : "manual";
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

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
