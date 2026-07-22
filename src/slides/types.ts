export type SlideLayout = "title" | "content" | "image" | "split" | "code";

export type SlideDisplayMode = "slide_only" | "stage_overlay";

export type SlideAsset = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
};

export type SlideContent = {
  id: string;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  code?: {
    language: string;
    source: string;
  };
  image?: SlideAsset;
  displayMode?: SlideDisplayMode;
};
