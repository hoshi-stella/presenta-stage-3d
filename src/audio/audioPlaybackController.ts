import type { AudioPlaybackSnapshot, PresentationSnapshot } from "../presentation/types";

export type AudioPlaybackController = {
  update: (snapshot: PresentationSnapshot) => void;
  dispose: () => void;
};

export function createAudioPlaybackController(
  onStateChange: (state: AudioPlaybackSnapshot) => void
): AudioPlaybackController {
  const audio = document.createElement("audio");
  audio.preload = "auto";

  let activeCueId: string | null = null;
  let currentState: AudioPlaybackSnapshot = { cueId: null, state: "idle", message: null };
  let disposed = false;

  const publish = (state: AudioPlaybackSnapshot): void => {
    if (disposed || (currentState.cueId === state.cueId && currentState.state === state.state && currentState.message === state.message)) {
      return;
    }

    currentState = state;
    onStateChange(state);
  };

  const publishForActiveCue = (state: AudioPlaybackSnapshot["state"], message: string | null = null): void => {
    if (!activeCueId) {
      return;
    }

    publish({ cueId: activeCueId, state, message });
  };

  const stop = (): void => {
    activeCueId = null;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    publish({ cueId: null, state: "idle", message: null });
  };

  const play = (): void => {
    void audio.play().catch(() => {
      publishForActiveCue("blocked", "Audio playback was blocked by the browser. Continue manually or interact with the page first.");
    });
  };

  audio.addEventListener("playing", () => publishForActiveCue("playing"));
  audio.addEventListener("pause", () => {
    if (!audio.ended && currentState.state !== "missing") {
      publishForActiveCue("paused");
    }
  });
  audio.addEventListener("ended", () => publishForActiveCue("ended"));
  audio.addEventListener("error", () => publishForActiveCue("missing", "Audio file could not be loaded. Presentation continues without audio."));

  return {
    update: (snapshot) => {
      const cueAudio = snapshot.cue.audio;
      if (!cueAudio) {
        if (activeCueId || currentState.state !== "idle") {
          stop();
        }
        return;
      }

      if (activeCueId !== snapshot.cue.id) {
        stop();
        activeCueId = snapshot.cue.id;
        audio.src = cueAudio.src;
        audio.volume = cueAudio.volume ?? 1;
        publishForActiveCue("loading");
        if (!snapshot.isPaused) {
          play();
        }
        return;
      }

      if (snapshot.isPaused && !audio.paused) {
        audio.pause();
        return;
      }

      if (!snapshot.isPaused && currentState.state === "paused") {
        play();
      }
    },
    dispose: () => {
      if (disposed) {
        return;
      }

      disposed = true;
      activeCueId = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  };
}
