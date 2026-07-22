import type { Cue } from "./types";

export const cues: Cue[] = [
  {
    id: "cue_title_01",
    kind: "talk",
    speaker: "rei",
    slideRef: "slide_lt_title",
    text: "今日は、登壇をUIとして作るというテーマで話します。",
    note: "1枚目タイトル。LT全体のテーマを短く提示する。",
    direction: {
      intent: "neutral",
      emotion: "calm",
      intensity: "low"
    },
    stage: {
      preset: "intro",
      camera: "front",
      motion: "wave"
    },
    presentation: {
      layout: "slide_only",
      fallback: {
        static: { layout: "slide_only" }
      }
    },
    demo: {
      step: 1,
      label: "title",
      targetSeconds: 20
    },
    after: {
      mode: "wait_for_presenter",
      durationMs: 6000
    }
  },
  {
    id: "cue_self_intro_01",
    kind: "talk",
    speaker: "rei",
    slideRef: "slide_self_intro",
    text: "まず簡単に自己紹介です。今回は、ブラウザで動く発表の仕組みを試作しています。",
    note: "2枚目自己紹介。個人の説明は短く、試作の話へつなげる。",
    direction: {
      intent: "neutral",
      emotion: "calm",
      intensity: "low"
    },
    stage: {
      preset: "intro",
      camera: "front",
      motion: "present"
    },
    presentation: {
      layout: "slide_only",
      fallback: {
        static: { layout: "slide_only" }
      }
    },
    demo: {
      step: 2,
      label: "self introduction",
      targetSeconds: 45
    },
    after: {
      mode: "wait_for_presenter",
      durationMs: 7000
    }
  },
  {
    id: "cue_company_intro_01",
    kind: "talk",
    speaker: "rei",
    slideRef: "slide_company_intro",
    text: "普段はWebアプリケーションや業務システムの開発に関わっています。",
    note: "3枚目会社紹介。仕事の文脈から、発表資料もUIとして扱う話へつなぐ。",
    direction: {
      intent: "supplement",
      emotion: "calm",
      intensity: "low"
    },
    stage: {
      preset: "idea",
      camera: "medium",
      motion: "point"
    },
    presentation: {
      layout: "slide_only",
      fallback: {
        static: { layout: "slide_only" }
      }
    },
    demo: {
      step: 3,
      label: "company introduction",
      targetSeconds: 70
    },
    after: {
      mode: "wait_for_presenter",
      durationMs: 7000
    }
  },
  {
    id: "cue_materials_title_01",
    kind: "talk",
    speaker: "rei",
    slideRef: "slide_materials_title",
    text: "ここから、登壇時の資料の種類について考えてみます。",
    note: "4枚目タイトル。ここで話題を切り替える。",
    direction: {
      intent: "transition",
      emotion: "calm",
      intensity: "low"
    },
    stage: {
      preset: "summary",
      camera: "wide",
      motion: "present"
    },
    presentation: {
      layout: "slide_only",
      fallback: {
        static: { layout: "slide_only" }
      }
    },
    demo: {
      step: 4,
      label: "section title",
      targetSeconds: 95
    },
    after: {
      mode: "wait_for_presenter",
      durationMs: 6500
    }
  },
  {
    id: "cue_material_types_01",
    kind: "question",
    speaker: "mikoto",
    slideRef: "slide_material_types",
    text: "資料って、スライドだけじゃなくて、補足や演出や記録も含めて考えられそうですね。",
    note: "5枚目。まんじゅうフェーズとして、会話で資料の種類を整理する。",
    direction: {
      intent: "question",
      emotion: "curious",
      intensity: "medium"
    },
    stage: {
      preset: "problem",
      camera: "side",
      motion: "think"
    },
    presentation: {
      layout: "slide_with_manju",
      fallback: {
        static: { layout: "slide_with_caption" }
      }
    },
    demo: {
      step: 5,
      label: "manju material types",
      targetSeconds: 140
    },
    after: {
      mode: "wait_for_presenter",
      durationMs: 9000
    }
  },
  {
    id: "cue_material_details_01",
    kind: "supplement",
    speaker: "mikoto",
    slideRef: "slide_material_details",
    text: "補足すると、投影する情報、手元で操作する情報、あとから残す情報は役割が違います。",
    note: "6枚目。玲の補足を画面には出さず、まんじゅう側の補足として説明する。",
    direction: {
      intent: "supplement",
      emotion: "calm",
      intensity: "medium"
    },
    stage: {
      preset: "idea",
      camera: "medium",
      motion: "think",
      objectRef: "browser_architecture",
      objectAction: "show"
    },
    presentation: {
      layout: "slide_with_manju",
      fallback: {
        static: { layout: "slide_with_caption" }
      }
    },
    demo: {
      step: 6,
      label: "material details",
      targetSeconds: 190
    },
    after: {
      mode: "wait_for_presenter",
      durationMs: 10000
    }
  }
];
