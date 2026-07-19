import type { MockAiClient } from "../ai/mockAiClient";
import type { PresentationState } from "../presentation/state";
import type { ScriptPlayer } from "../presentation/scriptPlayer";

export type PresentationControls = {
  previous: () => void;
  next: () => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  toggleNote: () => void;
  toggleScript: () => void;
  askMockAi: (text: string) => Promise<void>;
};

export function createControls(
  state: PresentationState,
  scriptPlayer: ScriptPlayer,
  aiClient: MockAiClient
): PresentationControls {
  return {
    previous: () => {
      scriptPlayer.stopForManualControl();
      state.previous();
    },
    next: () => {
      scriptPlayer.stopForManualControl();
      state.next();
    },
    play: () => scriptPlayer.play(),
    pause: () => scriptPlayer.pause(),
    reset: () => {
      scriptPlayer.pause();
      state.reset();
    },
    toggleNote: () => state.toggleSpeakerNote(),
    toggleScript: () => {
      if (state.getSnapshot().isScriptPlaying) {
        scriptPlayer.pause();
        return;
      }

      scriptPlayer.play();
    },
    askMockAi: async (text) => {
      if (!text) {
        state.setAiMessage("Mock AI: 質問テキストを入力してください。");
        return;
      }

      const section = state.getSnapshot().section;
      const response = await aiClient.ask({
        currentSectionId: section.id,
        userText: text
      });
      state.setAiMessage(response.text);
    }
  };
}
