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
