import * as PIXI from "pixi.js";
import type { CharacterId, CharacterRuntimeState, Cue, DirectionIntent } from "../presentation/types";
import type { Live2DConfig, Live2DLoadState, Live2DPresenterLayer } from "./types";

type Live2DModelClass = {
  from: (url: string) => Promise<Live2DDisplayModel>;
};

type Live2DDisplayModel = PIXI.DisplayObject & Live2DParameterModel & {
  anchor: {
    set: (x: number, y: number) => void;
  };
  scale: {
    set: (value: number) => void;
  };
  x: number;
  y: number;
  getBounds: () => PIXI.Rectangle;
};

type Live2DParameterModel = {
  internalModel: {
    coreModel: {
      setParameterValueById: (id: string, value: number) => void;
    };
  };
  alpha: number;
  rotation: number;
};

type Live2DRuntimeState = {
  speaker: CharacterId;
  states: CharacterRuntimeState;
  startedAt: number;
  target: Live2DExpressionTarget;
  blinkStartedAt: number;
  nextBlinkAt: number;
};

type Live2DExpressionTarget = {
  angleX: number;
  angleY: number;
  bodyAngleZ: number;
  mouthForm: number;
  eyeSmile: number;
  alpha: number;
};

declare global {
  interface Window {
    PIXI?: typeof PIXI;
    Live2DCubismCore?: unknown;
  }
}

export async function createLive2DPresenterLayer(
  host: HTMLElement,
  config: Live2DConfig,
  onStateChange: (state: Live2DLoadState, message: string) => void
): Promise<Live2DPresenterLayer> {
  if (!config.modelUrl || !config.coreUrl) {
    onStateChange("disabled", "Live2D is disabled. Configure VITE_LIVE2D_MODEL_URL and VITE_LIVE2D_CORE_URL to enable it.");
    return createNoopLayer();
  }

  onStateChange("loading", "Loading Live2D presenter...");
  window.PIXI = PIXI;
  let app: PIXI.Application | null = null;

  try {
    await loadScript(config.coreUrl);

    if (!window.Live2DCubismCore) {
      onStateChange("missing-core", `Live2D Cubism Core was not found at ${config.coreUrl}.`);
      return createNoopLayer();
    }

    const { Live2DModel } = await import("pixi-live2d-display/cubism4") as { Live2DModel: Live2DModelClass };
    app = new PIXI.Application({
      autoStart: true,
      backgroundAlpha: 0,
      resizeTo: host,
      antialias: true
    });

    app.view.classList.add("live2d-canvas");
    host.appendChild(app.view);
    const model = await Live2DModel.from(config.modelUrl);
    model.anchor.set(0.5, 1);
    app.stage.addChild(model);
    layoutModel(host, model);
    const handleResize = () => layoutModel(host, model);
    window.addEventListener("resize", handleResize);
    const live2dApp = app;
    const runtimeState: Live2DRuntimeState = {
      speaker: "rei",
      states: {
        rei: "speaking",
        mikoto: "listening",
        dummy: "idle"
      },
      startedAt: performance.now(),
      target: resolveExpressionTarget("neutral", "rei"),
      blinkStartedAt: 0,
      nextBlinkAt: performance.now() + 1800
    };
    const animate = () => animateModel(model, runtimeState);
    app.ticker.add(animate);
    onStateChange("ready", "Live2D presenter ready.");

    return {
      update: (states, speaker, cue) => updateModel(model, runtimeState, states, speaker, cue),
      dispose: () => {
        window.removeEventListener("resize", handleResize);
        live2dApp.ticker.remove(animate);
        live2dApp.destroy(true, { children: true, texture: false, baseTexture: false });
      }
    };
  } catch (error) {
    app?.destroy(true, { children: true, texture: false, baseTexture: false });
    onStateChange("error", `Live2D presenter could not be initialized: ${getErrorMessage(error)}`);
    return createNoopLayer();
  }
}

function updateModel(
  model: Live2DParameterModel,
  runtimeState: Live2DRuntimeState,
  states: CharacterRuntimeState,
  speaker: CharacterId,
  cue?: Cue
): void {
  runtimeState.states = states;
  runtimeState.speaker = speaker;
  runtimeState.target = resolveExpressionTarget(cue?.direction.intent ?? "neutral", speaker);
  const live2dSpeaking = states.rei === "speaking" || speaker === "rei" || speaker === "mikoto";
  model.alpha = live2dSpeaking ? runtimeState.target.alpha : 0.72;
  model.rotation = speaker === "mikoto" ? 0.05 : 0;
}

function animateModel(model: Live2DParameterModel, runtimeState: Live2DRuntimeState): void {
  const seconds = (performance.now() - runtimeState.startedAt) / 1000;
  const now = performance.now();
  const reiSpeaking = runtimeState.states.rei === "speaking" || runtimeState.speaker === "rei";
  const live2dSpeaking = reiSpeaking || runtimeState.speaker === "mikoto";
  const mouthAmplitude = runtimeState.target.mouthForm >= 0 ? 0.62 : 0.42;
  const mouth = live2dSpeaking ? 0.18 + Math.max(0, Math.sin(seconds * 12)) * mouthAmplitude : 0;
  const idleX = Math.sin(seconds * 0.9) * 3;
  const idleY = Math.sin(seconds * 0.7) * 2;
  const bodyIdle = Math.sin(seconds * 0.5) * 1.2;
  const breath = 0.5 + Math.sin(seconds * 1.6) * 0.5;
  const eyeOpen = getBlinkValue(runtimeState, now);

  model.internalModel.coreModel.setParameterValueById("PARAM_MOUTH_OPEN_Y", mouth);
  model.internalModel.coreModel.setParameterValueById("PARAM_MOUTH_FORM", runtimeState.target.mouthForm);
  model.internalModel.coreModel.setParameterValueById("PARAM_ANGLE_X", runtimeState.target.angleX + idleX);
  model.internalModel.coreModel.setParameterValueById("PARAM_ANGLE_Y", runtimeState.target.angleY + idleY);
  model.internalModel.coreModel.setParameterValueById("PARAM_BODY_ANGLE_Z", runtimeState.target.bodyAngleZ + bodyIdle);
  model.internalModel.coreModel.setParameterValueById("PARAM_BREATH", breath);
  model.internalModel.coreModel.setParameterValueById("PARAM_EYE_L_OPEN", eyeOpen);
  model.internalModel.coreModel.setParameterValueById("PARAM_EYE_R_OPEN", eyeOpen);
  model.internalModel.coreModel.setParameterValueById("PARAM_EYE_R_SMILE", runtimeState.target.eyeSmile);
}

function getBlinkValue(runtimeState: Live2DRuntimeState, now: number): number {
  if (now >= runtimeState.nextBlinkAt && runtimeState.blinkStartedAt === 0) {
    runtimeState.blinkStartedAt = now;
  }

  if (runtimeState.blinkStartedAt === 0) {
    return 1;
  }

  const elapsed = now - runtimeState.blinkStartedAt;
  if (elapsed > 180) {
    runtimeState.blinkStartedAt = 0;
    runtimeState.nextBlinkAt = now + 2200 + Math.random() * 2600;
    return 1;
  }

  return Math.max(0, Math.sin((elapsed / 180) * Math.PI));
}

function resolveExpressionTarget(intent: DirectionIntent, speaker: CharacterId): Live2DExpressionTarget {
  const speakerLook = speaker === "mikoto" ? 10 : 0;

  switch (intent) {
    case "question":
    case "doubt":
      return {
        angleX: speakerLook + 8,
        angleY: -3,
        bodyAngleZ: 5,
        mouthForm: -0.45,
        eyeSmile: 0,
        alpha: 0.95
      };
    case "tsukkomi":
      return {
        angleX: speakerLook + 14,
        angleY: 1,
        bodyAngleZ: -6,
        mouthForm: -0.2,
        eyeSmile: 0,
        alpha: 1
      };
    case "emphasis":
    case "deep_dive":
      return {
        angleX: speakerLook - 4,
        angleY: 2,
        bodyAngleZ: -3,
        mouthForm: 0.15,
        eyeSmile: 0,
        alpha: 1
      };
    case "supplement":
      return {
        angleX: speakerLook - 2,
        angleY: 1,
        bodyAngleZ: 2,
        mouthForm: 0.05,
        eyeSmile: 0.15,
        alpha: 0.96
      };
    case "summary":
    case "celebration":
      return {
        angleX: speakerLook,
        angleY: 2,
        bodyAngleZ: 0,
        mouthForm: 0.35,
        eyeSmile: 0.35,
        alpha: 1
      };
    case "warning":
      return {
        angleX: speakerLook,
        angleY: -4,
        bodyAngleZ: 0,
        mouthForm: -0.3,
        eyeSmile: 0,
        alpha: 0.9
      };
    case "reaction":
    case "transition":
    case "neutral":
      return {
        angleX: speakerLook,
        angleY: 0,
        bodyAngleZ: 0,
        mouthForm: 0,
        eyeSmile: 0,
        alpha: 0.96
      };
  }
}

function layoutModel(host: HTMLElement, model: Live2DDisplayModel): void {
  const width = host.clientWidth;
  const height = host.clientHeight;
  const targetHeight = Math.max(260, height * 0.72);
  const bounds = model.getBounds();
  const scale = bounds.height > 0 ? targetHeight / bounds.height : 0.2;
  model.scale.set(scale);
  model.x = Math.min(width - 120, Math.max(130, width * 0.18));
  model.y = height - 16;
}

function createNoopLayer(): Live2DPresenterLayer {
  return {
    update: () => undefined,
    dispose: () => undefined
  };
}

function loadScript(src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[data-live2d-core="${src}"]`);
  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.live2dCore = src;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
