# presenta-stage-3d

WebGL / Babylon.js を使った 3D 登壇UIプロトタイプです。

## Concept

このプロジェクトは、3D作品制作ツールではなく、会話劇型・エージェント共演型のプレゼンテーション基盤を目指します。

3D、AI、モーション、カメラ、演出は発表者が細かく操作する対象ではなく、発表を自然で分かりやすくする裏方として扱います。発表者は「次へ」「補足して」「ツッコミ」「まとめて」「質問受付」のような高レベルコマンドで進行します。

## Core Ideas

- Cue-driven presentation
- Semantic direction presets
- Semi-auto progression
- Reusable assets
- AI-assisted but presenter-controlled
- Characters as presenters, commentators, questioners, and summarizers

## Operation Policy

発表者が舞台裏のオペレーターにならないよう、操作は高レベルコマンドに限定します。

AI にも直接モーション名、カメラ名、ファイル名を選ばせません。AI は `DirectionIntent` と感情、強度のような意味を返し、システム側の `DirectionResolver` が登録済みモーション、カメラ、シーンプリセット、将来のアセットへ変換します。

## Semantic Direction Assets

Composite direction presets and stage effects are text-managed TypeScript assets. The cue can specify high-level meaning through `direction.intent` / `direction.intensity`, or explicitly request `stage.directionPreset` and `stage.effects`.

```ts
stage: {
  directionPreset: "summary_wide",
  effects: ["petal_soft_fall"]
}
```

The app resolves these semantic IDs through `AssetCatalog` into safe stage instructions:

- character motion
- camera preset
- scene preset
- particle-like effects such as petals, bubbles, sparkles, focus pulses, and warning flashes

Local image/model files remain under `public/assets-local/**` and are ignored by Git. The committed catalog stores only reusable IDs, labels, tags, compatibility, duration, intensity, and simple renderer parameters. This keeps the same command layer usable later from OpenAI Realtime tool calls without letting AI directly control Babylon.js, DOM, or asset file paths.

Direction asset selection starts from semantic AI output such as `intent`, `emotion`, `intensity`, and the active `speaker`. `selectDirectionAssets()` filters registered presets/effects by intent, compatible characters, cooldown metadata, and conflicts, then returns both the selected assets and rejected candidate reasons for debugging.

## AI Script Generation Contract

Phase 3 の台本・掛け合い生成は `src/ai/scriptGenerationContract.ts` の型を境界にします。入力は発表タイトル、対象者、ゴール、登場スピーカー、アウトライン、制約を渡します。出力は実行済みの `Cue` ではなく、`AiGeneratedCueDraft` と `AiGeneratedBranchDraft` のドラフトです。

AI が返してよい情報は意味情報に限定します。

- `Cue` 相当の `id`, `kind`, `text`, `note`
- `speaker`
- `direction.intent`, `direction.emotion`, `direction.intensity`
- 発表者が選べる `Branch`

AI はモーション名、カメラ名、シーンプリセット名、GLB/VRM/Live2D/音声などのファイル名、DOM 操作、Babylon.js API 呼び出しを返しません。実際の `motion`, `camera`, `preset`, `effects`, asset path はシステム側の resolver/catalog が意味情報から選択します。

固定レスポンスの `MockScriptGenerator` は `src/ai/mockScriptGenerator.ts` にあります。サンプル入出力は `examples/ai/script-generation-input.json` と `examples/ai/script-generation-output.json` を参照してください。

## Presentation Object Assets

3D explanation objects are also text-managed assets. The first procedural object is `browser_architecture`, a dummy browser structure with `dom`, `javascript`, `webgl`, and `gpu` parts.

```ts
stage: {
  objectRef: "browser_architecture",
  objectAction: "highlight_part",
  objectPartId: "webgl"
}
```

Supported object actions are `show`, `hide`, `rotate`, `highlight_part`, `focus_part`, and `explode`. The current implementation uses Babylon.js primitives as a prototype, so no GLB object assets are committed.

## Current Controls

- `Space` / `ArrowRight`: Next
- `ArrowLeft`: Back
- `P`: Pause / Resume
- `1`: Supplement
- `2`: Example
- `3`: Tsukkomi
- `4`: Summary
- `Q`: QA
- `W`: Return to script
- `S`: Skip
- `R`: Reset
- `N`: Toggle Speaker Note

The screen also exposes `Next`, `Back`, `Supplement`, `Tsukkomi`, `Return`, `Pause`, `Reset`, and `Toggle Speaker Note`.

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

The app has no external API dependency and runs without 3D model files.

## Local Character Assets

Character assets are local-only and ignored by Git. Keep 2D and 3D models in separate local folders so owned or licensed characters can be used without committing model files to GitHub.

```bash
VITE_LIVE2D_MODEL_URL=/assets-local/characters/2d/hosinonya/hosinonya.model3.json
VITE_LIVE2D_CORE_URL=/assets-local/vendor/live2d/live2dcubismcore.min.js
```

Expected local layout:

```txt
public/assets-local/
  vendor/live2d/live2dcubismcore.min.js
  characters/
    2d/
      hosinonya/
        hosinonya.model3.json
        hosinonya.moc3
        hosinonya.physics3.json
        hosinonya.cdi3.json
        hosinonya.4096/texture_00.png
    3d/
      unitychan/
        unitychan.glb
      rei/
        rei.vrm
```

If the Live2D Core or model is missing, the app falls back to the Babylon.js dummy presenters. Future GLB/VRM presenters should use the `characters/3d` folder in the same local-only asset root.

## Roadmap

### Phase 1

- 1キャラクター
- スライド表示
- キュー送り
- デフォルト表情、モーション
- カメラ2〜3種類
- キーボード操作

### Phase 2

- 2キャラクターの掛け合い
- 補足、質問、ツッコミ分岐
- アセット登録
- 複合演出プリセット
- 3Dオブジェクト表示

### Phase 3

- AIによる台本生成
- AIによる掛け合い生成
- 演出意図の自動推定
- 登録済みアセットからの自動選択

### Phase 4

- AIディレクター
- 観客質問へのリアルタイム回答
- 観客反応に応じた演出調整
- 半自律進行
- 発表後 Archive / Re-Talk View

## Archive / Re-Talk View

Phase 4では、発表後にCue単位で読み直し、セクション単位でもう一度説明してもらう体験を別モードとして扱います。詳細方針は `docs/archive-retalk/phase-4-archive-retalk-view.md` にまとめています。

静的モックは次のURLで表示できます。

```txt
/?view=archive-retalk
/#archive-retalk
```
