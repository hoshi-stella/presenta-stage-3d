import { MockAiClient } from "../ai/mockAiClient";
import { cues } from "../presentation/cues";
import { CueRunner } from "../presentation/cueRunner";
import sampleScriptMarkdown from "../presentation/sampleScript.md?raw";
import { parseMarkdownToCues } from "../presentation/markdownCueParser";
import { createStageScene, type StageScene } from "../scene/createScene";
import { createUiRenderer, getStageCanvas } from "../ui/renderUi";
import { getLive2DConfig } from "../live2d/config";
import { createLive2DPresenterLayer } from "../live2d/live2dPresenterLayer";
import type { Live2DPresenterLayer } from "../live2d/types";
import { getAiriManjuConfig } from "../imagePresenter/config";
import { createImagePresenterLayer, type ImagePresenterLayer } from "../imagePresenter/imagePresenterLayer";
import { createEndingCreditsOverlay, type EndingCreditsOverlay } from "../ui/endingCredits";
import { createControls } from "./controls";
import { bindKeyboardControls } from "./keyboard";

export class App {
  private stageScene: StageScene | null = null;
  private live2dLayer: Live2DPresenterLayer | null = null;
  private imagePresenterLayer: ImagePresenterLayer | null = null;
  private endingCredits: EndingCreditsOverlay | null = null;
  private unbindKeyboard: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;
  private isDisposed = false;

  constructor(private readonly root: HTMLElement) {}

  start(): void {
    this.isDisposed = false;
    const runner = new CueRunner(cues);
    const aiClient = new MockAiClient();
    const controls = createControls(runner, aiClient, (variant) => {
      this.endingCredits?.show(variant);
    }, () => this.endingCredits?.isVisible() ?? false);
    const ui = createUiRenderer(this.root, {
      onCommand: controls.command,
      onReset: controls.reset,
      onToggleNote: controls.toggleNote,
      onShowCredits: controls.showCredits,
      onLoadSampleScript: () => {
        const generatedCues = parseMarkdownToCues(sampleScriptMarkdown);
        runner.loadCues(generatedCues, `Loaded ${generatedCues.length} cues from Markdown sample.`);
      },
      onAskMockAi: (text) => {
        void controls.askMockAi(text);
      }
    });
    this.endingCredits = createEndingCreditsOverlay(this.root);

    this.stageScene = createStageScene(getStageCanvas(this.root));
    const live2dHost = this.root.querySelector<HTMLElement>("#live2d-host");
    if (live2dHost) {
      void createLive2DPresenterLayer(live2dHost, getLive2DConfig(), (_state, message) => {
        runner.setStatusMessage(message);
      }).then((layer) => {
        if (this.isDisposed) {
          layer.dispose();
          return;
        }

        this.live2dLayer = layer;
        const snapshot = runner.getSnapshot();
        layer.update(snapshot.characterStates, snapshot.cue.speaker, snapshot.cue);
      }).catch((error: unknown) => {
        runner.setStatusMessage(`Live2D presenter failed: ${getErrorMessage(error)}`);
      });
    }
    const imagePresenterHost = this.root.querySelector<HTMLElement>("#image-presenter-host");
    if (imagePresenterHost) {
      this.imagePresenterLayer = createImagePresenterLayer(imagePresenterHost, getAiriManjuConfig(), (message) => {
        runner.setStatusMessage(message);
      });
    }

    this.unbindKeyboard = bindKeyboardControls(controls);
    this.unsubscribeState = runner.subscribe((snapshot) => {
      ui.update(snapshot);
      this.stageScene?.applySectionVisuals(
        snapshot.resolvedDirection.scenePreset,
        snapshot.resolvedDirection.camera,
        snapshot.resolvedDirection.effects
      );
      this.stageScene?.characterController.playMotion(snapshot.resolvedDirection.motion, snapshot.cue.speaker);
      this.stageScene?.characterController.applyCharacterStates(snapshot.characterStates, snapshot.cue.speaker);
      this.stageScene?.applyPresentationObject(snapshot.resolvedDirection.object);
      this.live2dLayer?.update(snapshot.characterStates, snapshot.cue.speaker, snapshot.cue);
      this.imagePresenterLayer?.update(snapshot.characterStates, snapshot.cue.speaker, snapshot.cue);
    });
  }

  dispose(): void {
    this.isDisposed = true;
    this.unbindKeyboard?.();
    this.unsubscribeState?.();
    this.live2dLayer?.dispose();
    this.imagePresenterLayer?.dispose();
    this.endingCredits?.dispose();
    this.stageScene?.dispose();
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
