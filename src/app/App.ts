import { MockAiClient } from "../ai/mockAiClient";
import { cues } from "../presentation/cues";
import { CueRunner } from "../presentation/cueRunner";
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
    const runner = new CueRunner(cues);
    const aiClient = new MockAiClient();
    const controls = createControls(runner, aiClient);
    const ui = createUiRenderer(this.root, {
      onCommand: controls.command,
      onReset: controls.reset,
      onToggleNote: controls.toggleNote,
      onAskMockAi: (text) => {
        void controls.askMockAi(text);
      }
    });

    this.stageScene = createStageScene(getStageCanvas(this.root));
    this.unbindKeyboard = bindKeyboardControls(controls);
    this.unsubscribeState = runner.subscribe((snapshot) => {
      ui.update(snapshot);
      this.stageScene?.applySectionVisuals(snapshot.resolvedDirection.scenePreset, snapshot.resolvedDirection.camera);
      this.stageScene?.characterController.playMotion(snapshot.resolvedDirection.motion, snapshot.cue.speaker);
      this.stageScene?.characterController.applyCharacterStates(snapshot.characterStates, snapshot.cue.speaker);
    });
  }

  dispose(): void {
    this.unbindKeyboard?.();
    this.unsubscribeState?.();
    this.stageScene?.dispose();
  }
}
