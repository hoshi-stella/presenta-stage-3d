# Phase 4 Archive / Re-Talk View Design

対象Issue: #10

## 目的

Archive / Re-Talk View は、発表をその場限りで終わらせず、後から読み直す・触り直す・もう一度説明してもらうための発表後体験です。

Stage View は発表中の演出と進行を優先します。一方で Archive View は、Cue 単位の発話、Speaker Note、補足、分岐候補、Q&A、デモ再現情報を読み物として整理します。

## 表示モード

| Mode | 主な利用タイミング | 役割 |
| --- | --- | --- |
| Stage View | 発表中 | CueRunner の現在状態を 3D 舞台、Live2D、画像Presenter、演出へ反映する |
| Speaker View | 発表中 | 発表者だけが見るノート、次Cue、分岐候補、時間管理を出す |
| Archive View | 発表後 | Cue 一覧、発話、Speaker Note、補足、分岐履歴候補、関連デモを後日閲覧向けに並べる |
| Re-Talk View | 発表後 | 選択した Cue またはセクションを AI に再説明させる入口にする |

## Cue データから Archive View へ渡す情報

現行の `Cue` は発表後アーカイブの最小入力として利用できます。

- `id`: Cue へのアンカー、共有リンク、Re-Talk の対象ID
- `kind`: talk / question / supplement / summary などの分類
- `speaker`: 発話者表示
- `text`: 後日閲覧の本文
- `note`: Speaker Note として表示
- `direction.intent` / `direction.intensity`: 発表時の狙いを説明するメタデータ
- `stage`: 3D 再生ではなく、発表時に使った演出・オブジェクトの説明情報
- `after.branches`: 分岐履歴候補、または「当時選べた寄り道」

Archive View は CueRunner を再実行しません。保存済み Cue と必要な実行ログを読み、発表後向けの静的/準静的な表示に変換します。

## Re-Talk View の想定

Re-Talk は実AI接続前提の仕様だけを先に固定します。最初のUIは静的モックでよく、AI出力や閲覧履歴保存は非ゴールです。

想定する再説明モード:

- Beginner: 専門語をほどいて、発表中の例え話や補足を優先する
- Deep Dive: Cue の意図、分岐、演出指定、設計判断まで詳しく説明する
- Section Recap: 選択 Cue の前後だけを短くまとめ直す

AI へ渡す入力は、選択 Cue、前後 Cue の短い文脈、Speaker Note、補足、分岐候補、ユーザーが選んだ再説明モードです。AI は Stage View や Babylon.js を直接操作しません。

## 静的モック

このブランチでは `?view=archive-retalk` または `#archive-retalk` で静的 Archive / Re-Talk View を表示します。

```txt
http://localhost:5173/?view=archive-retalk
http://localhost:5173/#archive-retalk
```

モックは `src/presentation/cues.ts` の Cue データを読み、次を表示します。

- Cue 一覧
- 発話テキスト
- Speaker Note
- 補足テキスト
- 演出意図
- 分岐履歴候補
- Re-Talk の Beginner / Deep Dive / Section Recap モード

## 今後の拡張方針

1. 発表実行ログを保存する場合は、Cue の定義と「実際に選ばれた分岐」を分ける。
2. Archive View は CueRunner の状態遷移に依存せず、保存済みデータを読むだけにする。
3. Re-Talk の AI 接続は、Stage View の演出制御とは別の境界に置く。
4. サーバー保存、認証、個人ごとの閲覧履歴、動画生成は Issue #10 の外で扱う。
