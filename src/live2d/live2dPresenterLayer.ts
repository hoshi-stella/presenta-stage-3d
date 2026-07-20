import * as PIXI from "pixi.js";
import type { CharacterId, CharacterRuntimeState } from "../presentation/types";
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
  await loadScript(config.coreUrl);

  if (!window.Live2DCubismCore) {
    onStateChange("missing-core", `Live2D Cubism Core was not found at ${config.coreUrl}.`);
    return createNoopLayer();
  }

  const { Live2DModel } = await import("pixi-live2d-display/cubism4") as { Live2DModel: Live2DModelClass };
  const app = new PIXI.Application({
    autoStart: true,
    backgroundAlpha: 0,
    resizeTo: host,
    antialias: true
  });

  app.view.classList.add("live2d-canvas");
  host.appendChild(app.view);

  try {
    const model = await Live2DModel.from(config.modelUrl);
    model.anchor.set(0.5, 1);
    app.stage.addChild(model);
    layoutModel(host, model);
    window.addEventListener("resize", () => layoutModel(host, model));
    onStateChange("ready", "Live2D presenter ready.");

    return {
      update: (states, speaker) => updateModel(model, states, speaker),
      dispose: () => {
        app.destroy(true, { children: true, texture: false, baseTexture: false });
      }
    };
  } catch (error) {
    app.destroy(true, { children: true, texture: false, baseTexture: false });
    onStateChange("missing-model", `Live2D model could not be loaded: ${getErrorMessage(error)}`);
    return createNoopLayer();
  }
}

function updateModel(
  model: Live2DParameterModel,
  states: CharacterRuntimeState,
  speaker: CharacterId
): void {
  const reiSpeaking = states.rei === "speaking" || speaker === "rei";
  model.alpha = reiSpeaking ? 1 : 0.72;
  model.rotation = speaker === "mikoto" ? 0.05 : 0;
  model.internalModel.coreModel.setParameterValueById("PARAM_MOUTH_OPEN_Y", reiSpeaking ? 0.75 : 0);
  model.internalModel.coreModel.setParameterValueById("PARAM_ANGLE_X", speaker === "mikoto" ? 12 : 0);
  model.internalModel.coreModel.setParameterValueById("PARAM_BODY_ANGLE_Z", speaker === "mikoto" ? 4 : 0);
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
