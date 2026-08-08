import { MockAiClient } from "../ai/mockAiClient";
import { CueRunner } from "../presentation/cueRunner";
import { adaptPresentationPackageToRuntime } from "../package/adapter";
import { downloadPresentationPackage } from "../package/exporter";
import { loadPresentationFromFile, loadPresentationFromUrl } from "../package/loader";
import { consumeStagePresentationHandoff, getPresentationPackageUrl } from "../package/presentationSource";
import type { PresentationPackageV1, PresentationValidationResult } from "../package/types";
import { validatePresentationPackage } from "../package/validator";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
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
import { runPreflight } from "../preflight/preflightService";
import type { PreflightReport } from "../preflight/types";
import { getGlbCharacterAssets } from "../scene/modelAssetConfig";

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
  private currentPresentation: PresentationPackageV1 = createDefaultPresentation();
  private packageValidation: PresentationValidationResult = validatePresentationPackage(this.currentPresentation);
  private packageSource = "built-in";
  private preflightReport: PreflightReport | null = null;

  constructor(private readonly root: HTMLElement) {}

  async start(): Promise<void> {
    this.isDisposed = false;
    const runner = new CueRunner(adaptPresentationPackageToRuntime(this.currentPresentation).cues);
    await this.loadInitialPresentation(runner);
    const startCue = new URL(window.location.href).searchParams.get("startCue");
    if (startCue) runner.goToCueId(startCue, "Studio rehearsal preview");
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
      },
      onLoadPackage: (file) => {
        void this.loadPackageFromFile(file, runner);
      },
      onExportPackage: () => {
        downloadPresentationPackage(this.currentPresentation, `${this.currentPresentation.presentation.id}.presentation.json`);
        runner.setStatusMessage(`Exported Presentation Package: ${this.currentPresentation.presentation.title}`);
      },
      onRunPreflight: () => {
        void this.runPreflight(runner);
      },
      getPackageStatus: () => ({
        id: this.currentPresentation.presentation.id,
        title: this.currentPresentation.presentation.title,
        source: this.packageSource,
        errors: this.packageValidation.errors.length,
        warnings: this.packageValidation.warnings.length
      }),
      getPreflightReport: () => this.preflightReport
    });
    this.transitionCoordinator = createPresentationTransitionCoordinator(this.root, ui.setTransitioning);
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

  private async loadInitialPresentation(runner: CueRunner): Promise<void> {
    try {
      const handoffPresentation = consumeStagePresentationHandoff();
      if (handoffPresentation) {
        this.applyPresentationPackage(handoffPresentation, "studio-handoff", runner, "Presentation received from Studio.");
        return;
      }
    } catch (error) {
      this.applyPresentationPackage(createDefaultPresentation(), "built-in", runner, `Studio handoff failed. Falling back to built-in presentation: ${getErrorMessage(error)}`);
      return;
    }
    const sourceUrl = getPresentationPackageUrl();
    try {
      this.applyPresentationPackage(await loadPresentationFromUrl(sourceUrl), sourceUrl, runner, "Presentation loaded.");
    } catch (error) {
      this.applyPresentationPackage(createDefaultPresentation(), "built-in", runner, `Presentation load failed. Falling back to built-in presentation: ${getErrorMessage(error)}`);
    }
  }

  private async loadPackageFromFile(file: File, runner: CueRunner): Promise<void> {
    try {
      this.applyPresentationPackage(await loadPresentationFromFile(file), `file:${file.name}`, runner, "Presentation package imported.");
    } catch (error) {
      runner.setStatusMessage(`Presentation import failed. Current presentation was kept: ${getErrorMessage(error)}`);
    }
  }

  private applyPresentationPackage(presentation: PresentationPackageV1, source: string, runner: CueRunner, message: string): void {
    const runtime = adaptPresentationPackageToRuntime(presentation);
    this.currentPresentation = presentation;
    this.packageValidation = validatePresentationPackage(presentation);
    this.packageSource = source;
    setSlideContents(runtime.slides);
    this.root.dataset.presentationSource = source;
    this.root.dataset.presentationId = presentation.presentation.id;
    this.root.dataset.presentationTitle = presentation.presentation.title;
    runner.loadCues(runtime.cues, `${message} ${presentation.presentation.title}`);
  }

  private async runPreflight(runner: CueRunner): Promise<void> {
    runner.setStatusMessage("Running preflight checks...");
    try {
      this.preflightReport = await runPreflight({
        live2d: getLive2DConfig(),
        imagePresenter: getAiriManjuConfig(),
        staticIllustrations: getStaticIllustrationConfig(),
        glbCharacters: getGlbCharacterAssets(),
        packageValidation: this.packageValidation,
        currentFallbackLevel: runner.getSnapshot().fallbackLevel
      });
      const blocked = this.preflightReport.checks.filter((check) => check.level === "blocked").length;
      const warnings = this.preflightReport.checks.filter((check) => check.level === "warning").length;
      runner.setStatusMessage(`Preflight complete: ${blocked} blocked / ${warnings} warnings. Recommended fallback: ${this.preflightReport.recommendedFallbackLevel}.`);
    } catch (error) {
      runner.setStatusMessage(`Preflight failed: ${getErrorMessage(error)}`);
    }
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
