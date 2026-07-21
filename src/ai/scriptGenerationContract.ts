import type {
  CharacterId,
  CueId,
  CueKind,
  DirectionIntensity,
  DirectionIntent,
  PresenterCommand,
  ProgressionMode
} from "../presentation/types";

export type AiScriptGenerationInput = {
  presentation: {
    title: string;
    audience: string;
    goal: string;
    language: "ja" | "en";
    durationMinutes?: number;
  };
  speakers: Array<{
    id: CharacterId;
    role: "main" | "cohost" | "commentator" | "questioner";
    persona: string;
  }>;
  outline: Array<{
    id: string;
    title: string;
    keyPoints: string[];
  }>;
  constraints?: {
    maxCues?: number;
    allowBranches?: boolean;
    presenterControlRequired?: boolean;
  };
};

export type AiGeneratedBranchDraft = {
  command: PresenterCommand;
  label: string;
  targetCueId: CueId;
  purpose: "supplement" | "question" | "tsukkomi" | "summary" | "return";
};

export type AiGeneratedCueDraft = {
  id: CueId;
  kind: CueKind;
  speaker: CharacterId;
  text: string;
  note?: string;
  direction: {
    intent: DirectionIntent;
    emotion?: string;
    intensity: DirectionIntensity;
  };
  after: {
    mode: ProgressionMode;
    durationMs?: number;
    branches?: AiGeneratedBranchDraft[];
  };
  sourceOutlineId?: string;
};

export type AiScriptGenerationOutput = {
  title: string;
  summary: string;
  cues: AiGeneratedCueDraft[];
  warnings: string[];
};

export interface AiScriptGenerator {
  generate(input: AiScriptGenerationInput): Promise<AiScriptGenerationOutput>;
}
