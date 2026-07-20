import { MockAiClient } from "../ai/mockAiClient";
import { cues } from "../presentation/cues";
import { CueRunner } from "../presentation/cueRunner";
import { createStageScene, type StageScene } from "../scene/createScene";
import { createUiRenderer, getStageCanvas } from "../ui/renderUi";
import { getLive2DConfig } from "../live2d/config";
import { createLive2DPresenterLayer } from "../live2d/live2dPresenterLayer";
import type { Live2DPresenterLayer } from "../live2d/types";
import { createControls } from "./controls";
import { bindKeyboardControls } from "./keyboard";

export class App {
  private stageScene: StageScene | null = null;
  private live2dLayer: Live2DPresenterLayer | null = null;
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
    const live2dHost = this.root.querySelector<HTMLElement>("#live2d-host");
    if (live2dHost) {
      void createLive2DPresenterLayer(live2dHost, getLive2DConfig(), (_state, message) => {
        runner.setStatusMessage(message);
      }).then((layer) => {
        this.live2dLayer = layer;
        const snapshot = runner.getSnapshot();
        layer.update(snapshot.characterStates, snapshot.cue.speaker);
      });
    }

    this.unbindKeyboard = bindKeyboardControls(controls);
    this.unsubscribeState = runner.subscribe((snapshot) => {
      ui.update(snapshot);
      this.stageScene?.applySectionVisuals(snapshot.resolvedDirection.scenePreset, snapshot.resolvedDirection.camera);
      this.stageScene?.characterController.playMotion(snapshot.resolvedDirection.motion, snapshot.cue.speaker);
      this.stageScene?.characterController.applyCharacterStates(snapshot.characterStates, snapshot.cue.speaker);
      this.live2dLayer?.update(snapshot.characterStates, snapshot.cue.speaker);
    });
  }

  dispose(): void {
    this.unbindKeyboard?.();
    this.unsubscribeState?.();
    this.live2dLayer?.dispose();
    this.stageScene?.dispose();
  }
}
