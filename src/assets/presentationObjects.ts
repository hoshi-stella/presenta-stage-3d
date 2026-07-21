import type { PresentationObjectAsset } from "./types";

export const presentationObjectAssets: PresentationObjectAsset[] = [
  {
    id: "browser_architecture",
    type: "object",
    format: "procedural",
    label: "ブラウザ構造モデル",
    tags: ["browser", "webgl", "architecture", "demo"],
    capabilities: ["show", "hide", "rotate", "highlight_part", "focus_part", "explode"],
    parts: [
      {
        id: "dom",
        label: "DOM",
        tags: ["document", "ui"],
        color: "#93e5ff"
      },
      {
        id: "javascript",
        label: "JavaScript",
        tags: ["logic", "runtime"],
        color: "#f7df1e"
      },
      {
        id: "webgl",
        label: "WebGL",
        tags: ["rendering", "3d"],
        color: "#ff8c42"
      },
      {
        id: "gpu",
        label: "GPU",
        tags: ["hardware", "graphics"],
        color: "#9dff8f"
      }
    ]
  }
];
