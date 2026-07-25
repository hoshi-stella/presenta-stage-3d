import type { Cue } from "./types";
import type { SlideContent } from "../slides/types";

export type PresentationDocument = {
  id: string;
  title: string;
  version: 1;
  slides: SlideContent[];
  cues: Cue[];
};

