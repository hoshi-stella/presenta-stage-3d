import type { DirectionIntent, DirectionIntensity } from "../presentation/types";

export type AiDirectionIntent = {
  intent: DirectionIntent;
  emotion?: string;
  intensity: DirectionIntensity;
};

export type AiResponse = {
  text: string;
  action?: "speak" | "nod" | "point" | "none";
  suggestedDirection?: AiDirectionIntent;
};

export interface AiClient {
  ask(input: {
    currentCueId: string;
    userText: string;
  }): Promise<AiResponse>;
}
