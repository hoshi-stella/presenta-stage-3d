import type { CharacterMotionName } from "../scene/characterController";
import type { DirectionIntent, DirectionIntensity } from "../presentation/types";

export type AiDirectionIntent = {
  intent: DirectionIntent;
  emotion?: string;
  intensity: DirectionIntensity;
};

export type AiResponse = {
  text: string;
  action?: "speak" | "nod" | "point" | "none";
  suggestedMotion?: CharacterMotionName;
  suggestedDirection?: AiDirectionIntent;
};

export interface AiClient {
  ask(input: {
    currentCueId: string;
    userText: string;
  }): Promise<AiResponse>;
}
