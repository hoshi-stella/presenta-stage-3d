import type { Cue } from "./types";

export const cues: Cue[] = [
  {
    id: "cue_intro_01",
    kind: "talk",
    speaker: "rei",
    slideRef: "slide_intro",
    text: "今日は、スライドショーじゃない登壇について考えてみます。",
    note: "導入。発表をUIとして考える話に入る。",
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
      layout: "slide_only"
    },
    after: {
      mode: "wait_for_presenter",
      durationMs: 8000
    }
  },
  {
    id: "cue_problem_01",
    kind: "question",
    speaker: "mikoto",
    slideRef: "slide_problem",
    text: "でも、ブラウザで発表しても紙芝居のままでいいんですか？",
    note: "疑問役。発表形式への違和感を出す。",
    direction: {
      intent: "question",
      emotion: "mild_doubt",
      intensity: "medium"
    },
    stage: {
      preset: "problem",
      camera: "side",
      motion: "think"
    },
    presentation: {
      layout: "slide_with_manju"
    },
    after: {
      mode: "wait_for_presenter",
      durationMs: 8000
    }
  },
  {
    id: "cue_answer_01",
    kind: "answer",
    speaker: "rei",
    slideRef: "slide_cue_runtime",
    text: "発表をページではなく、状態・入力・演出を持つUIとして考えると、別の形が見えてきます。",
    note: "主張。登壇はUIである。",
    direction: {
      intent: "emphasis",
      emotion: "confident",
      intensity: "medium"
    },
    stage: {
      preset: "deepDive",
      camera: "medium",
      motion: "present",
      objectRef: "browser_architecture",
      objectAction: "show"
    },
    presentation: {
      layout: "stage_with_overlay"
    },
    after: {
      mode: "branch_available",
      durationMs: 12000,
      branches: [
        {
          command: "supplement",
          label: "補足する",
          targetCueId: "cue_supplement_01"
        },
        {
          command: "tsukkomi",
          label: "ツッコミを入れる",
          targetCueId: "cue_tsukkomi_01"
        },
        {
          command: "next",
          label: "本筋へ進む",
          targetCueId: "cue_main_02"
        }
      ]
    }
  },
  {
    id: "cue_supplement_01",
    kind: "supplement",
    speaker: "rei",
    slideRef: "slide_cue_runtime",
    text: "たとえば、Stage View、Speaker View、Audience View、Archive View のように、同じ内容でも表示モードを分けられます。",
    note: "補足ルート。終わったら本筋に戻る。",
    direction: {
      intent: "supplement",
      emotion: "calm",
      intensity: "low"
    },
    stage: {
      preset: "idea",
      camera: "medium",
      motion: "point",
      objectRef: "browser_architecture",
      objectAction: "highlight_part",
      objectPartId: "dom"
    },
    presentation: {
      layout: "stage_with_overlay"
    },
    after: {
      mode: "wait_for_presenter",
      branches: [
        {
          command: "return_to_script",
          label: "本筋へ戻る",
          targetCueId: "cue_main_02"
        }
      ]
    }
  },
  {
    id: "cue_tsukkomi_01",
    kind: "tsukkomi",
    speaker: "mikoto",
    slideRef: "slide_cue_runtime",
    text: "つまり、スライドを作っているつもりが、いつの間にか舞台を作っているわけですね。",
    note: "ツッコミルート。会話劇感を出す。",
    direction: {
      intent: "tsukkomi",
      emotion: "sharp",
      intensity: "medium"
    },
    stage: {
      preset: "demo",
      camera: "side",
      motion: "point",
      objectRef: "browser_architecture",
      objectAction: "explode",
      objectPartId: "webgl"
    },
    presentation: {
      layout: "dialogue_split"
    },
    after: {
      mode: "wait_for_presenter",
      branches: [
        {
          command: "return_to_script",
          label: "本筋へ戻る",
          targetCueId: "cue_main_02"
        }
      ]
    }
  },
  {
    id: "cue_main_02",
    kind: "talk",
    speaker: "rei",
    slideRef: "slide_archive",
    text: "そこで、キュー単位で発話、モーション、カメラ、演出、分岐をまとめて管理します。",
    note: "キュー駆動の説明。",
    direction: {
      intent: "summary",
      emotion: "confident",
      intensity: "medium"
    },
    stage: {
      preset: "summary",
      camera: "wide",
      motion: "present",
      objectRef: "browser_architecture",
      objectAction: "rotate",
      objectPartId: "gpu"
    },
    presentation: {
      layout: "stage_full"
    },
    after: {
      mode: "auto_next",
      durationMs: 9000
    }
  },
  {
    id: "cue_qa_01",
    kind: "qa",
    speaker: "mikoto",
    slideRef: "slide_summary",
    text: "最後に、みなさんならどんな登壇UIを作るか、質問受付モードで考えてみましょう。",
    note: "質問受付モードの見た目だけを示す。",
    direction: {
      intent: "question",
      emotion: "open",
      intensity: "medium"
    },
    stage: {
      preset: "question",
      camera: "wide",
      motion: "wave"
    },
    presentation: {
      layout: "stage_with_overlay"
    },
    after: {
      mode: "wait_for_presenter",
      branches: [
        {
          command: "summary",
          label: "まとめる",
          targetCueId: "cue_summary_01"
        }
      ]
    }
  },
  {
    id: "cue_summary_01",
    kind: "summary",
    speaker: "rei",
    slideRef: "slide_summary",
    text: "3DやAIは主役ではなく、発表を自然に進めるための裏方として扱うのがよさそうです。",
    note: "Phase 1 の締め。意味ベース演出の方針をまとめる。",
    direction: {
      intent: "summary",
      emotion: "calm",
      intensity: "medium"
    },
    stage: {
      objectRef: "browser_architecture",
      objectAction: "hide"
    },
    presentation: {
      layout: "stage_with_overlay"
    },
    after: {
      mode: "wait_for_presenter",
      durationMs: 10000
    }
  }
];
