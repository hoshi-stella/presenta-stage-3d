import type { MockAiClient } from "../ai/mockAiClient";
import type { CueRunner } from "../presentation/cueRunner";
import type { PresenterCommand } from "../presentation/types";
import type { EndingCreditsVariant } from "../ui/endingCredits";

export type PresentationControls = {
  command: (command: PresenterCommand) => void;
  reset: () => void;
  toggleNote: () => void;
  toggleSubtitles: () => void;
  togglePause: () => void;
  showCredits: (variant: EndingCreditsVariant) => void;
  isCreditsVisible: () => boolean;
  askMockAi: (text: string) => Promise<void>;
};

export function createControls(
  runner: CueRunner,
  aiClient: MockAiClient,
  showCredits: (variant: EndingCreditsVariant) => void,
  isCreditsVisible: () => boolean = () => false
): PresentationControls {
  const shouldBlockPresentationControl = (): boolean => isCreditsVisible();

  return {
    command: (command) => {
      if (shouldBlockPresentationControl()) {
        return;
      }

      runner.dispatch(command);
    },
    reset: () => {
      if (shouldBlockPresentationControl()) {
        return;
      }

      runner.reset();
    },
    toggleNote: () => {
      if (shouldBlockPresentationControl()) {
        return;
      }

      runner.toggleSpeakerNote();
    },
    toggleSubtitles: () => {
      if (shouldBlockPresentationControl()) {
        return;
      }

      runner.toggleSubtitles();
    },
    togglePause: () => {
      if (shouldBlockPresentationControl()) {
        return;
      }

      if (runner.getSnapshot().isPaused || runner.getSnapshot().mode === "manual") {
        runner.dispatch("resume");
        return;
      }

      runner.dispatch("pause");
    },
    showCredits,
    isCreditsVisible,
    askMockAi: async (text) => {
      if (shouldBlockPresentationControl()) {
        return;
      }

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
