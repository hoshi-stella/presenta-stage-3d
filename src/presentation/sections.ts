import type { PresentationSection } from "./types";

export const sections: PresentationSection[] = [
  {
    id: "intro",
    title: "導入",
    stageText: "登壇はUIである",
    speakerNote: "発表をスライドではなくWebアプリとして考える導入。",
    characterLine: "今日は、スライドショーじゃない登壇について考えてみます。",
    preset: "intro",
    motion: "wave",
    camera: "front",
    durationMs: 12000
  },
  {
    id: "problem",
    title: "違和感",
    stageText: "ブラウザで発表しても、紙芝居のままでいいのか？",
    speakerNote: "PowerPointやGoogle Slides、Markdownスライドの話。",
    characterLine: "スライドは強い形式ですが、発表の形はそれだけではないかもしれません。",
    preset: "problem",
    motion: "think",
    camera: "side",
    durationMs: 15000
  },
  {
    id: "deep-dive",
    title: "深掘り",
    stageText: "発表を状態遷移として見る",
    speakerNote: "ページではなく、状態・入力・演出・アーカイブを持つUIとして見る。",
    characterLine: "スライドをめくるのではなく、発表状態を進めていると考えてみます。",
    preset: "deepDive",
    motion: "point",
    camera: "medium",
    durationMs: 15000
  },
  {
    id: "demo",
    title: "具体案",
    stageText: "3Dキャラ登壇UI",
    speakerNote: "3Dキャラ、舞台演出、リアルタイム会話、再登壇モードの構想。",
    characterLine: "3Dキャラは、代理登壇者というより、まずは案内役として使えそうです。",
    preset: "demo",
    motion: "present",
    camera: "close",
    durationMs: 15000
  },
  {
    id: "risk",
    title: "注意点",
    stageText: "演出は、意味がなければノイズになる",
    speakerNote: "気が散る、事故る、権利、音声、ネットワーク依存など。",
    characterLine: "演出は派手さではなく、文脈を運ぶために使うのがよさそうです。",
    preset: "warning",
    motion: "idle",
    camera: "front",
    durationMs: 15000
  },
  {
    id: "question",
    title: "問いかけ",
    stageText: "みなさんなら、どんな登壇UIを作りますか？",
    speakerNote: "最後は答えではなく問いとして終える。",
    characterLine: "スライドを作るのではなく、登壇体験を実装するとしたら。みなさんなら、どんな形にしますか？",
    preset: "question",
    motion: "wave",
    camera: "wide",
    durationMs: 15000
  }
];
