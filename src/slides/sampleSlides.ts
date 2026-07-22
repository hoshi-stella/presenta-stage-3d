import type { SlideContent } from "./types";

export const sampleSlides: SlideContent[] = [
  {
    id: "slide_intro",
    layout: "title",
    title: "3D Stage UI",
    subtitle: "スライドから会話劇、3D舞台へ拡張する発表Runtime",
    body: "最初は普通のスライドとして始め、同じCue列のまま表現レイヤーを増やします。",
    displayMode: "slide_only"
  },
  {
    id: "slide_problem",
    layout: "content",
    title: "発表は紙芝居のままでいい？",
    bullets: [
      "スライド、補足、質問、デモが別々の操作になりがち",
      "口頭説明や掛け合いは資料に残りにくい",
      "表現を増やすほど本番操作が重くなる"
    ],
    displayMode: "slide_only"
  },
  {
    id: "slide_cue_runtime",
    layout: "split",
    title: "Cueを単一ソースにする",
    body: "発話、話者、演出意図、分岐、表示レイヤーをCueに集約し、Runtimeが安全な表示へ解決します。",
    bullets: [
      "PresenterCommandで高レベル操作",
      "DirectionIntentから演出を選択",
      "失敗時は軽い表示へfallback"
    ],
    displayMode: "stage_overlay"
  },
  {
    id: "slide_archive",
    layout: "code",
    title: "発表後も再説明できる形へ",
    body: "Archive / Re-Talk View は同じCue列から後日閲覧用の表示を作ります。",
    code: {
      language: "ts",
      source: `type Cue = {
  speaker: CharacterId;
  text: string;
  direction: DirectionIntent;
  after: ProgressionMode;
};`
    },
    displayMode: "stage_overlay"
  },
  {
    id: "slide_summary",
    layout: "content",
    title: "表現は置き換えではなく合成",
    bullets: [
      "通常スライド",
      "まんじゅう / 静止立ち絵 / Live2D",
      "3Dステージ / 空間演出",
      "エンドロール"
    ],
    displayMode: "stage_overlay"
  }
];

export function getSlideContent(slideRef: string | undefined): SlideContent | null {
  if (!slideRef) {
    return null;
  }

  return sampleSlides.find((slide) => slide.id === slideRef) ?? null;
}
