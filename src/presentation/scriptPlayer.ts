import type { PresentationState } from "./state";

export class ScriptPlayer {
  private timerId: number | null = null;

  constructor(private readonly state: PresentationState) {}

  play(): void {
    this.stopTimer();
    this.state.setScriptPlaying(true);
    this.scheduleCurrentSection();
  }

  pause(): void {
    this.stopTimer();
    this.state.setScriptPlaying(false);
  }

  stopForManualControl(): void {
    if (this.state.getSnapshot().isScriptPlaying) {
      this.pause();
    }
  }

  private scheduleCurrentSection(): void {
    const snapshot = this.state.getSnapshot();
    const durationMs = snapshot.section.durationMs ?? 12000;

    this.timerId = window.setTimeout(() => {
      const advanced = this.state.next();
      if (!advanced) {
        this.pause();
        return;
      }

      this.scheduleCurrentSection();
    }, durationMs);
  }

  private stopTimer(): void {
    if (this.timerId === null) {
      return;
    }

    window.clearTimeout(this.timerId);
    this.timerId = null;
  }
}
