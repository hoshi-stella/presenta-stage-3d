import type { StaticIllustrationCharacterConfig, StaticIllustrationConfig, StaticIllustrationExpression } from "./config";
import { staticIllustrationFiles } from "./config";
import type { CharacterId, CharacterRuntimeState, CharacterState, Cue, DirectionIntent } from "../presentation/types";

type StaticIllustrationInstance = {
  config: StaticIllustrationCharacterConfig;
  element: HTMLImageElement;
  currentExpression: StaticIllustrationExpression;
  wasReacting: boolean;
};

export type StaticIllustrationPresenter = {
  update: (states: CharacterRuntimeState, speaker: CharacterId, cue?: Cue) => void;
  dispose: () => void;
};

export function createStaticIllustrationPresenter(
  host: HTMLElement,
  config: StaticIllustrationConfig,
  onStateChange: (message: string) => void
): StaticIllustrationPresenter {
  host.innerHTML = "";
  const instances = config.characters
    .filter((character) => character.baseUrl !== null)
    .map((character) => createInstance(host, character, onStateChange));

  if (instances.length === 0) {
    host.classList.add("static-illustration-host--hidden");
    return createNoopPresenter();
  }

  host.classList.remove("static-illustration-host--hidden");

  return {
    update: (states, speaker, cue) => {
      instances.forEach((instance) => {
        const state = states[instance.config.characterId];
        const expression = resolveExpression(cue?.direction.intent ?? "neutral", state, speaker === instance.config.characterId);
        updateInstance(instance, state, expression);
      });
    },
    dispose: () => {
      host.innerHTML = "";
      host.classList.add("static-illustration-host--hidden");
    }
  };
}

function createInstance(
  host: HTMLElement,
  config: StaticIllustrationCharacterConfig,
  onStateChange: (message: string) => void
): StaticIllustrationInstance {
  const element = document.createElement("img");
  element.className = `static-illustration static-illustration--${config.characterId}`;
  element.alt = "";
  element.decoding = "async";
  element.src = getExpressionUrl(config, config.defaultExpression);
  element.addEventListener("load", () => {
    onStateChange(`Static illustration ready: ${config.characterId}`);
  }, { once: true });
  element.addEventListener("error", () => {
    element.classList.add("static-illustration--missing");
    onStateChange(`Static illustration asset was not found: ${element.src}`);
  });
  host.appendChild(element);

  return {
    config,
    element,
    currentExpression: config.defaultExpression,
    wasReacting: false
  };
}

function updateInstance(
  instance: StaticIllustrationInstance,
  state: CharacterState,
  expression: StaticIllustrationExpression
): void {
  instance.element.dataset.state = state;

  if (state === "reacting" && !instance.wasReacting) {
    instance.element.classList.remove("static-illustration--react-once");
    window.requestAnimationFrame(() => {
      instance.element.classList.add("static-illustration--react-once");
    });
  }
  instance.wasReacting = state === "reacting";

  if (instance.currentExpression === expression) {
    return;
  }

  instance.currentExpression = expression;
  instance.element.src = getExpressionUrl(instance.config, expression);
}

function resolveExpression(
  intent: DirectionIntent,
  state: CharacterState,
  isSpeaker: boolean
): StaticIllustrationExpression {
  if (!isSpeaker && state !== "reacting") {
    return "neutral";
  }

  switch (intent) {
    case "emphasis":
    case "summary":
    case "celebration":
      return "smile";
    case "question":
    case "doubt":
    case "deep_dive":
      return "thinking";
    case "reaction":
      return "surprised";
    case "tsukkomi":
    case "warning":
      return "angry";
    case "supplement":
    case "transition":
      return "troubled";
    case "neutral":
      return state === "speaking" ? "smile" : "neutral";
  }
}

function getExpressionUrl(config: StaticIllustrationCharacterConfig, expression: StaticIllustrationExpression): string {
  return `${config.baseUrl?.replace(/\/$/, "")}/${staticIllustrationFiles[expression]}`;
}

function createNoopPresenter(): StaticIllustrationPresenter {
  return {
    update: () => undefined,
    dispose: () => undefined
  };
}
