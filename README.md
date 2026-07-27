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

## Presentation Layer Composer

`Cue.presentation` controls which expression layers are active for each cue. The composer resolves a layout preset into layer visibility and writes the current state to the app root as `data-layout`, `data-layers`, and `presentation-layer--*` classes.

```ts
presentation: {
  layout: "stage_with_overlay"
}
```

Current layout presets:

- `slide_only`: slide layer only
- `slide_with_caption`: slide and subtitle
- `slide_with_manju`: slide, subtitle, and manju image presenter
- `slide_with_character`: slide, subtitle, and static illustration
- `dialogue_split`: slide, subtitle, manju, and static illustration
- `stage_full`: 3D stage, Live2D, manju, and effects
- `stage_with_overlay`: 3D stage with slide, subtitle, characters, and effects

For one-off tuning, `presentation.layers` can explicitly list layer IDs instead of using the preset defaults. This keeps display composition text-managed while character/model files stay local-only under `public/assets-local/**`.

## Subtitle Layer

`SubtitleLayer` renders `Cue.text` as a separate commentary layer from slide content. It shows the active speaker display name, the cue kind, and a projection-friendly subtitle block. Long lines automatically use denser sizing and are clamped so the stage view does not overflow.

Subtitle visibility is presenter-controlled with `T` or the `Toggle Subtitles` button. The active state is also shown in the status panel and exposed on the app root as `data-subtitles`.

## Presentation Transitions

`TransitionCoordinator` keeps cue progression separate from visual transitions. `CueRunner` still moves immediately between cues, while the coordinator marks the app root with `data-transition-*` and `presentation-transition--*` classes so layers can crossfade, slide, and lightly zoom without a full black-frame reset.

During the short transition window, normal forward/back/branch commands are guarded against repeated input. `Skip`, `Pause`, and `Reset` remain available for live recovery. Reduced-motion environments use immediate/simple switching by disabling transition transforms.

## LT Showcase

The 15-minute local demo track is documented in `docs/demo-track/lt-showcase-runbook.md`. It covers the intended layer order, Demo Script Mode, fallback levels, preflight checks, and live recovery steps.

## Presentation Data

The default LT deck is loaded from `public/presentations/lt-demo/presentation.json`. This file contains the presentation metadata, slide contents, and cue sequence in one document so the same shape can later move behind an editor UI or database table.

Use `?presentation=/presentations/<id>/presentation.json` to load another deck. If the JSON is missing or invalid, the app falls back to the built-in TypeScript demo data so the stage still starts during rehearsals.

Keep reusable text data in Git, but keep model, image, voice, and other character assets under `public/assets-local/**` so private or licensed materials are not committed.

## Cue Audio

A Cue can optionally carry a local audio reference. When present, playback starts with the Cue, stops when the Cue changes, follows Pause / Resume, and drives the active character state used by the image Presenter mouth flap. Audio is optional: no configured file, a missing file, or a browser autoplay restriction does not block Manual Mode.

```json
{
  "audio": {
    "src": "/assets-local/audio/cue-intro-01.mp3",
    "durationMs": 8200,
    "volume": 0.9
  }
}
```

## Presentation Package

presenta-stage-3d can load presentation data from a versioned JSON package.

```txt
?presentation=/presentations/showcase.presentation.json
```

The package contains metadata, slides, cues, characters, assets, direction presets, publication settings, and export settings. See [Presentation Package v1](docs/presentation-package-v1.md) for the schema, validation, import/export, and runtime adapter policy.

## Current Controls

- `Space` / `ArrowRight`: Next
- `ArrowLeft`: Back
- `P`: Pause / Resume
- `1`: Supplement
- `2`: Example
- `3`: Tsukkomi
- `4`: Summary
- `D`: Demo Script Mode
- `Q`: QA
- `W`: Return to script
- `S`: Skip
- `R`: Reset
- `N`: Toggle Speaker Note
- `T`: Toggle Subtitles

The screen also exposes `Next`, `Back`, `Supplement`, `Tsukkomi`, `Demo Script`, `Return`, `Pause`, `Reset`, `Toggle Speaker Note`, `Toggle Subtitles`, and fallback level selection.

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
VITE_REI_STATIC_ILLUSTRATION_BASE_URL=/assets-local/characters/2d/rei-static
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
      rei-static/
        neutral.png
        smile.png
        thinking.png
        troubled.png
        surprised.png
        angry.png
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
