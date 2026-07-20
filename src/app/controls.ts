import type { MockAiClient } from "../ai/mockAiClient";
import type { CueRunner } from "../presentation/cueRunner";
import type { PresenterCommand } from "../presentation/types";
import type { EndingCreditsVariant } from "../ui/endingCredits";

export type PresentationControls = {
  command: (command: PresenterCommand) => void;
  reset: () => void;
  toggleNote: () => void;
  togglePause: () => void;
  showCredits: (variant: EndingCreditsVariant) => void;
  askMockAi: (text: string) => Promise<void>;
};

export function createControls(
  runner: CueRunner,
  aiClient: MockAiClient,
  showCredits: (variant: EndingCreditsVariant) => void
): PresentationControls {
  return {
    command: (command) => {
      runner.dispatch(command);
    },
    reset: () => {
      runner.reset();
    },
    toggleNote: () => runner.toggleSpeakerNote(),
    togglePause: () => {
      if (runner.getSnapshot().isPaused || runner.getSnapshot().mode === "manual") {
        runner.dispatch("resume");
        return;
      }

      runner.dispatch("pause");
    },
    showCredits,
    askMockAi: async (text) => {
      if (!text) {
        runner.setAiMessage("Mock AI: 質問テキストを入力してください。");
        return;
      }

      const cue = runner.getSnapshot().cue;
      const response = await aiClient.ask({
        currentCueId: cue.id,
        userText: text
      });
      runner.setAiMessage(response.text);
    }
  };
}
