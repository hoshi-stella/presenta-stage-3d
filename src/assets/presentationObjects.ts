import type { PresentationObjectAsset } from "./types";

export const presentationObjectAssets: PresentationObjectAsset[] = [
  {
    id: "algorithm_stack",
    type: "object",
    format: "procedural",
    label: "Stack 操作モデル",
    tags: ["algorithm", "stack", "lifo", "sample"],
    capabilities: ["show", "hide", "rotate", "highlight_part", "focus_part", "explode"],
    parts: [
      { id: "bottom", label: "A: bottom", tags: ["stack"], color: "#93e5ff" },
      { id: "middle", label: "B", tags: ["stack"], color: "#7f9cff" },
      { id: "top", label: "C: pop target", tags: ["stack", "pop"], color: "#ffb46b" }
    ]
  },
  {
    id: "algorithm_queue",
    type: "object",
    format: "procedural",
    label: "Queue 操作モデル",
    tags: ["algorithm", "queue", "fifo", "sample"],
    capabilities: ["show", "hide", "rotate", "highlight_part", "focus_part", "explode"],
    parts: [
      { id: "front", label: "front: dequeue", tags: ["queue"], color: "#ffb46b" },
      { id: "waiting", label: "waiting", tags: ["queue"], color: "#7f9cff" },
      { id: "back", label: "back: enqueue", tags: ["queue"], color: "#93e5ff" }
    ]
  },
  {
    id: "algorithm_ring_buffer",
    type: "object",
    format: "procedural",
    label: "Ring Buffer 操作モデル",
    tags: ["algorithm", "buffer", "ring", "sample"],
    capabilities: ["show", "hide", "rotate", "highlight_part", "focus_part", "explode"],
    parts: [
      { id: "read", label: "read", tags: ["buffer"], color: "#ffb46b" },
      { id: "slot", label: "slots", tags: ["buffer"], color: "#93e5ff" },
      { id: "write", label: "write", tags: ["buffer"], color: "#a6efae" }
    ]
  },
  {
    id: "algorithm_sort",
    type: "object",
    format: "procedural",
    label: "Sort 操作モデル",
    tags: ["algorithm", "sort", "comparison", "sample"],
    capabilities: ["show", "hide", "rotate", "highlight_part", "focus_part", "explode"],
    parts: [
      { id: "left", label: "left value", tags: ["sort"], color: "#93e5ff" },
      { id: "right", label: "right value", tags: ["sort"], color: "#ffb46b" },
      { id: "sorted", label: "sorted range", tags: ["sort"], color: "#a6efae" }
    ]
  },
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
