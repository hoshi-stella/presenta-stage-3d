import { MockAiClient } from "../ai/mockAiClient";
import { PresentationState } from "../presentation/state";
import { sections } from "../presentation/sections";
import { ScriptPlayer } from "../presentation/scriptPlayer";
import { createStageScene, type StageScene } from "../scene/createScene";
import { createUiRenderer, getStageCanvas } from "../ui/renderUi";
import { createControls } from "./controls";
import { bindKeyboardControls } from "./keyboard";

export class App {
  private stageScene: StageScene | null = null;
  private unbindKeyboard: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;

  constructor(private readonly root: HTMLElement) {}

  start(): void {
    const state = new PresentationState(sections);
    const scriptPlayer = new ScriptPlayer(state);
    const aiClient = new MockAiClient();
    const controls = createControls(state, scriptPlayer, aiClient);
    const ui = createUiRenderer(this.root, {
      onPrevious: controls.previous,
      onNext: controls.next,
      onPlay: controls.play,
      onPause: controls.pause,
      onReset: controls.reset,
      onToggleNote: controls.toggleNote,
      onAskMockAi: (text) => {
        void controls.askMockAi(text);
      }
    });

    this.stageScene = createStageScene(getStageCanvas(this.root));
    this.unbindKeyboard = bindKeyboardControls(controls);
    this.unsubscribeState = state.subscribe((snapshot) => {
      ui.update(snapshot);
      this.stageScene?.applySectionVisuals(snapshot.section.preset, snapshot.section.camera);
      this.stageScene?.characterController.playMotion(snapshot.section.motion);
    });
  }

  dispose(): void {
    this.unbindKeyboard?.();
    this.unsubscribeState?.();
    this.stageScene?.dispose();
  }
}
