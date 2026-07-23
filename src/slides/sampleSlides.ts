import type { SlideContent } from "./types";

export const sampleSlides: SlideContent[] = [
  {
    id: "slide_lt_title",
    layout: "title",
    title: "登壇をUIとして作る",
    subtitle: "3D Stage UI / LT Prototype",
    body: "スライド、台本、キャラクター、演出をひとつのブラウザRuntimeで扱う試作です。",
    displayMode: "slide_only"
  },
  {
    id: "slide_self_intro",
    layout: "content",
    title: "自己紹介",
    bullets: [
      "ブラウザ上で動く発表体験を試作中",
      "3D / Live2D / 画像キャラを発表の演出として扱う",
      "今回はLTで見せられる最低限の形を目指します"
    ],
    displayMode: "slide_only"
  },
  {
    id: "slide_company_intro",
    layout: "content",
    title: "会社紹介",
    body: "普段はWebアプリケーションや業務システムの開発に関わっています。",
    bullets: [
      "画面、状態、操作を整理して伝える仕事",
      "発表資料もUIのひとつとして捉えられる",
      "今日の試作は、その考え方を登壇に持ち込む話です"
    ],
    displayMode: "slide_only"
  },
  {
    id: "slide_materials_title",
    layout: "title",
    title: "登壇資料の種類を考える",
    subtitle: "ここから少しだけ会話劇フェーズ",
    body: "資料をただのページではなく、場面ごとに切り替わる表現レイヤーとして見てみます。",
    displayMode: "slide_only"
  },
  {
    id: "slide_material_types",
    layout: "content",
    title: "登壇時の資料の種類",
    bullets: [
      "話すためのスライド",
      "補足するための図やメモ",
      "場をつなぐキャラクターや演出",
      "あとから見返すための記録"
    ],
    displayMode: "slide_only"
  },
  {
    id: "slide_material_details",
    layout: "split",
    title: "少し細かく説明",
    body: "同じ内容でも、登壇中に見せる情報と、手元で操作する情報と、あとから残す情報は役割が違います。",
    bullets: [
      "投影画面は読みやすさを優先",
      "手元画面は操作と次の流れを優先",
      "キャラクターや演出は場面転換を助ける"
    ],
    displayMode: "stage_overlay"
  }
];

let activeSlides: SlideContent[] = sampleSlides;

export function setSlideContents(slides: SlideContent[]): void {
  activeSlides = slides.length > 0 ? slides : sampleSlides;
}

export function getSlideContent(slideRef: string | undefined): SlideContent | null {
  if (!slideRef) {
    return null;
  }

  return activeSlides.find((slide) => slide.id === slideRef) ?? null;
}
