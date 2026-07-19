import type { CharacterMotionName } from "../scene/characterController";

export type AiResponse = {
  text: string;
  action?: "speak" | "nod" | "point" | "none";
  suggestedMotion?: CharacterMotionName;
};

export interface AiClient {
  ask(input: {
    currentSectionId: string;
    userText: string;
  }): Promise<AiResponse>;
}
