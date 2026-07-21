import type { AiClient, AiResponse } from "./aiClient";

export class MockAiClient implements AiClient {
  async ask(input: { currentCueId: string; userText: string }): Promise<AiResponse> {
    return {
      text: `Mock AI: ${input.currentCueId} の文脈で「${input.userText}」を受け取りました。`,
      action: "speak",
      suggestedDirection: {
        intent: "supplement",
        emotion: "calm",
        intensity: "low"
      }
    };
  }
}
