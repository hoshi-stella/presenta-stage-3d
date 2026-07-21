import type {
  AiScriptGenerationInput,
  AiScriptGenerationOutput,
  AiScriptGenerator
} from "./scriptGenerationContract";

export class MockScriptGenerator implements AiScriptGenerator {
  async generate(input: AiScriptGenerationInput): Promise<AiScriptGenerationOutput> {
    const [firstOutline] = input.outline;

    return {
      title: input.presentation.title,
      summary: "AI台本生成の固定モックです。Cue、Speaker、DirectionIntent、Branch の意味情報だけを返します。",
      cues: [
        {
          id: "ai_cue_intro_01",
          kind: "talk",
          speaker: "rei",
          text: "今日は、3D登壇UIをAIでどう設計できるかを見ていきます。",
          note: "AI生成台本の導入。具体的な演出名ではなく意味だけを持つ。",
          direction: {
            intent: "neutral",
            emotion: "calm",
            intensity: "low"
          },
          after: {
            mode: "wait_for_presenter",
            durationMs: 8000
          },
          sourceOutlineId: firstOutline?.id
        },
        {
          id: "ai_cue_question_01",
          kind: "question",
          speaker: "mikoto",
          text: "でも、AIにモーション名やファイル名まで選ばせると危なくないですか？",
          note: "掛け合いで境界を説明する質問。",
          direction: {
            intent: "question",
            emotion: "curious",
            intensity: "medium"
          },
          after: {
            mode: "branch_available",
            durationMs: 9000,
            branches: [
              {
                command: "supplement",
                label: "補足する",
                targetCueId: "ai_cue_supplement_01",
                purpose: "supplement"
              },
              {
                command: "next",
                label: "本筋へ進む",
                targetCueId: "ai_cue_answer_01",
                purpose: "return"
              }
            ]
          },
          sourceOutlineId: firstOutline?.id
        },
        {
          id: "ai_cue_supplement_01",
          kind: "supplement",
          speaker: "rei",
          text: "たとえば、question という意図は後段で考えるモーションやカメラへ変換できます。",
          note: "補足分岐。意味から実行表現へ変換する流れを説明する。",
          direction: {
            intent: "supplement",
            emotion: "calm",
            intensity: "low"
          },
          after: {
            mode: "wait_for_presenter",
            branches: [
              {
                command: "return_to_script",
                label: "本筋へ戻る",
                targetCueId: "ai_cue_answer_01",
                purpose: "return"
              }
            ]
          },
          sourceOutlineId: firstOutline?.id
        },
        {
          id: "ai_cue_answer_01",
          kind: "answer",
          speaker: "rei",
          text: "AIは発話と演出意図だけを返し、実際のモーションやアセット選択はシステム側で解決します。",
          note: "意味ベース契約の結論。",
          direction: {
            intent: "emphasis",
            emotion: "confident",
            intensity: "medium"
          },
          after: {
            mode: "wait_for_presenter",
            durationMs: 10000
          },
          sourceOutlineId: firstOutline?.id
        }
      ],
      warnings: []
    };
  }
}
