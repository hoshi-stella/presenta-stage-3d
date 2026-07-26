import { MockAiClient } from "../ai/mockAiClient";
import { cues } from "../presentation/cues";
import { CueRunner } from "../presentation/cueRunner";
import { loadPresentationDocument } from "../presentation/presentationLoader";
import sampleScriptMarkdown from "../presentation/sampleScript.md?raw";
import { parseMarkdownToCues } from "../presentation/markdownCueParser";
import { applyPresentationComposition } from "../presentation/presentationComposer";
import { createPresentationTransitionCoordinator, type PresentationTransitionCoordinator } from "../presentation/transitionCoordinator";
import { createStageScene, type StageScene } from "../scene/createScene";
import { createUiRenderer, getSlideLayerHost, getStageCanvas, getStaticIllustrationHost, getSubtitleLayerHost } from "../ui/renderUi";
import { createSlideLayer, type SlideLayer } from "../slides/slideLayer";
import { createSubtitleLayer, type SubtitleLayer } from "../subtitles/subtitleLayer";
import { getLive2DConfig } from "../live2d/config";
import { createLive2DPresenterLayer } from "../live2d/live2dPresenterLayer";
import type { Live2DPresenterLayer } from "../live2d/types";
import { getAiriManjuConfig } from "../imagePresenter/config";
import { createImagePresenterLayer, type ImagePresenterLayer } from "../imagePresenter/imagePresenterLayer";
import { getStaticIllustrationConfig } from "../staticIllustration/config";
import { createStaticIllustrationPresenter, type StaticIllustrationPresenter } from "../staticIllustration/staticIllustrationPresenter";
import { createEndingCreditsOverlay, type EndingCreditsOverlay } from "../ui/endingCredits";
import { createControls } from "./controls";
import { bindKeyboardControls } from "./keyboard";
import { setSlideContents } from "../slides/sampleSlides";
import { createAudioPlaybackController, type AudioPlaybackController } from "../audio/audioPlaybackController";

export class App {
  private stageScene: StageScene | null = null;
  private slideLayer: SlideLayer | null = null;
  private subtitleLayer: SubtitleLayer | null = null;
  private live2dLayer: Live2DPresenterLayer | null = null;
  private imagePresenterLayer: ImagePresenterLayer | null = null;
  private staticIllustrationPresenter: StaticIllustrationPresenter | null = null;
  private endingCredits: EndingCreditsOverlay | null = null;
  private transitionCoordinator: PresentationTransitionCoordinator | null = null;
  private audioPlayback: AudioPlaybackController | null = null;
  private unbindKeyboard: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;
  private isDisposed = false;

  constructor(private readonly root: HTMLElement) {}

  async start(): Promise<void> {
    this.isDisposed = false;
    const loadResult = await loadPresentationDocument();
    const runner = new CueRunner(loadResult.ok ? loadResult.document.cues : cues);
    if (loadResult.ok) {
      setSlideContents(loadResult.document.slides);
      this.root.dataset.presentationSource = loadResult.sourceUrl;
      this.root.dataset.presentationTitle = loadResult.document.title;
      runner.setStatusMessage(`Loaded presentation JSON: ${loadResult.document.title}`);
    } else {
      setSlideContents([]);
      this.root.dataset.presentationSource = "fallback";
      this.root.dataset.presentationTitle = "Built-in presentation";
      runner.setStatusMessage(loadResult.message);
    }
    const aiClient = new MockAiClient();
    const controls = createControls(runner, aiClient, (variant) => {
      this.endingCredits?.show(variant);
    }, () => this.endingCredits?.isVisible() ?? false, () => this.transitionCoordinator?.isTransitioning() ?? false);
    const ui = createUiRenderer(this.root, {
      onCommand: controls.command,
      onReset: controls.reset,
      onToggleNote: controls.toggleNote,
      onToggleSubtitles: controls.toggleSubtitles,
      onFallbackLevel: controls.setFallbackLevel,
      onShowCredits: controls.showCredits,
      onLoadSampleScript: () => {
        const generatedCues = parseMarkdownToCues(sampleScriptMarkdown);
        runner.loadCues(generatedCues, `Loaded ${generatedCues.length} cues from Markdown sample.`);
      },
      onAskMockAi: (text) => {
        void controls.askMockAi(text);
      }
    });
    this.transitionCoordinator = createPresentationTransitionCoordinator(this.root);
    this.endingCredits = createEndingCreditsOverlay(this.root);
    this.audioPlayback = createAudioPlaybackController((audio) => runner.setAudioPlayback(audio));

    this.stageScene = createStageScene(getStageCanvas(this.root));
    this.slideLayer = createSlideLayer(getSlideLayerHost(this.root));
    this.subtitleLayer = createSubtitleLayer(getSubtitleLayerHost(this.root));
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
    this.staticIllustrationPresenter = createStaticIllustrationPresenter(
      getStaticIllustrationHost(this.root),
      getStaticIllustrationConfig(),
      (message) => {
        runner.setStatusMessage(message);
      }
    );

    this.unbindKeyboard = bindKeyboardControls(controls);
    this.unsubscribeState = runner.subscribe((snapshot) => {
      this.audioPlayback?.update(snapshot);
      applyPresentationComposition(this.root, snapshot);
      this.transitionCoordinator?.apply(snapshot);
      ui.update(snapshot);
      this.slideLayer?.update(snapshot);
      this.subtitleLayer?.update(snapshot);
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
      this.staticIllustrationPresenter?.update(snapshot.characterStates, snapshot.cue.speaker, snapshot.cue);
      if (snapshot.presentation.creditsVariant && !this.endingCredits?.isVisible()) {
        this.endingCredits?.show(snapshot.presentation.creditsVariant);
      }
    });
  }

  dispose(): void {
    this.isDisposed = true;
    this.unbindKeyboard?.();
    this.unsubscribeState?.();
    this.live2dLayer?.dispose();
    this.slideLayer?.dispose();
    this.subtitleLayer?.dispose();
    this.imagePresenterLayer?.dispose();
    this.staticIllustrationPresenter?.dispose();
    this.endingCredits?.dispose();
    this.transitionCoordinator?.dispose();
    this.audioPlayback?.dispose();
    this.stageScene?.dispose();
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
