import type { ImagePresenterConfig } from "./config";
import type { CharacterId, CharacterRuntimeState, Cue, DirectionIntent } from "../presentation/types";

type ImageExpression =
  | "neutral"
  | "smile"
  | "thinking"
  | "troubled"
  | "surprised"
  | "unimpressed"
  | "angry"
  | "eyesClosed"
  | "speaking";

export type ImagePresenterLayer = {
  update: (states: CharacterRuntimeState, speaker: CharacterId, cue?: Cue) => void;
  dispose: () => void;
};

const imageFiles: Record<ImageExpression, string> = {
  neutral: "neutral.png",
  smile: "smile.png",
  thinking: "thinking.png",
  troubled: "troubled.png",
  surprised: "surprised.png",
  unimpressed: "unimpressed.png",
  angry: "angry.png",
  eyesClosed: "eyes-closed.png",
  speaking: "speaking.png"
};

export function createImagePresenterLayer(
  host: HTMLElement,
  config: ImagePresenterConfig,
  onStateChange: (message: string) => void
): ImagePresenterLayer {
  host.innerHTML = "";

  if (!config.baseUrl) {
    host.classList.add("image-presenter-host--hidden");
    return createNoopLayer();
  }
  const baseUrl = config.baseUrl;

  const image = document.createElement("img");
  image.className = "image-presenter";
  image.alt = "";
  image.decoding = "async";
  host.appendChild(image);

  let disposed = false;
  let currentExpression: ImageExpression = "neutral";
  let flapTimerId: number | null = null;
  let flapOpen = false;
  let reportedReady = false;

  const setExpression = (expression: ImageExpression): void => {
    currentExpression = expression;
    image.src = getImageUrl(baseUrl, expression);
  };

  const stopMouthFlap = (): void => {
    if (flapTimerId === null) {
      return;
    }

    window.clearInterval(flapTimerId);
    flapTimerId = null;
    flapOpen = false;
  };

  const startMouthFlap = (restExpression: ImageExpression): void => {
    if (flapTimerId !== null) {
      return;
    }

    flapTimerId = window.setInterval(() => {
      flapOpen = !flapOpen;
      image.src = getImageUrl(baseUrl, flapOpen ? "speaking" : restExpression);
    }, 180);
  };

  image.addEventListener("load", () => {
    if (disposed || reportedReady) {
      return;
    }

    reportedReady = true;
    host.classList.remove("image-presenter-host--hidden");
    onStateChange("Airi manju presenter ready.");
  });
  image.addEventListener("error", () => {
    if (disposed) {
      return;
    }

    stopMouthFlap();
    host.classList.add("image-presenter-host--hidden");
    onStateChange(`Airi manju presenter asset was not found: ${image.src}`);
  });

  setExpression("neutral");

  return {
    update: (states, speaker, cue) => {
      const isSpeaking = states[config.speakerId] === "speaking" || speaker === config.speakerId;
      const nextExpression = resolveExpression(cue?.direction.intent ?? "neutral", isSpeaking);

      if (!isSpeaking) {
        stopMouthFlap();
        if (currentExpression !== nextExpression) {
          setExpression(nextExpression);
        }
        return;
      }

      if (currentExpression !== nextExpression) {
        setExpression(nextExpression);
      }
      startMouthFlap(nextExpression);
    },
    dispose: () => {
      disposed = true;
      stopMouthFlap();
      host.innerHTML = "";
    }
  };
}

function resolveExpression(intent: DirectionIntent, isSpeaking: boolean): ImageExpression {
  if (!isSpeaking) {
    return "neutral";
  }

  switch (intent) {
    case "emphasis":
    case "summary":
    case "celebration":
      return "smile";
    case "question":
    case "doubt":
    case "supplement":
    case "deep_dive":
      return "thinking";
    case "reaction":
      return "surprised";
    case "tsukkomi":
    case "warning":
      return "angry";
    case "transition":
      return "eyesClosed";
    case "neutral":
      return "neutral";
  }
}

function getImageUrl(baseUrl: string, expression: ImageExpression): string {
  return `${baseUrl.replace(/\/$/, "")}/${imageFiles[expression]}`;
}

function createNoopLayer(): ImagePresenterLayer {
  return {
    update: () => undefined,
    dispose: () => undefined
  };
}
