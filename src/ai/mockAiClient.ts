import type { AiClient, AiResponse } from "./aiClient";

export class MockAiClient implements AiClient {
  async ask(input: { currentSectionId: string; userText: string }): Promise<AiResponse> {
    return {
      text: `Mock AI: ${input.currentSectionId} の文脈で「${input.userText}」を受け取りました。`,
      action: "speak",
      suggestedMotion: "present"
    };
  }
}
