# Phase 4 Realtime音声・AI会話モード 技術検証メモ

作成日: 2026-07-22
対象Issue: #9 Realtime音声・AI会話モードの技術検証を行う

## 結論

Phase 4の初期プロトタイプは、OpenAI Realtime APIを第一候補にする。ブラウザ内でマイク入力と音声再生を直接扱うため、OpenAI公式ドキュメントが推奨するWebRTC接続を採用し、アプリ側は`Push-to-talk`を最小単位として検証する。

Gemini Live APIは比較対象として有力だが、2026-07-22時点の公式ドキュメントではLive API本体とephemeral tokenがPreviewで、ブラウザ接続はWebSocket中心である。現行プロトタイプの「登壇者が高レベルコマンドを出し、AIが意味的な演出意図を返す」設計にはOpenAI RealtimeのWebRTC + data channel + tool/event設計の方が近い。

## 参照した公式ドキュメント

- OpenAI Realtime overview: https://developers.openai.com/api/docs/guides/realtime
- OpenAI Realtime WebRTC guide: https://developers.openai.com/api/docs/guides/realtime-webrtc
- OpenAI Realtime WebSocket guide: https://developers.openai.com/api/docs/guides/realtime-websocket
- OpenAI Realtime API reference, client secrets: https://developers.openai.com/api/reference/resources/realtime#create-client-secret
- Gemini Live API overview: https://ai.google.dev/gemini-api/docs/live-api
- Gemini Live API WebSocket guide: https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
- Gemini Live API ephemeral tokens: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- Gemini Live API capabilities: https://ai.google.dev/gemini-api/docs/live-api/capabilities

## API選定

| 観点 | OpenAI Realtime API | Gemini Live API |
| --- | --- | --- |
| ブラウザ音声接続 | 公式ガイドはブラウザ/モバイルの音声入出力にWebRTCを推奨 | WebSocketベースのLive APIガイドが中心 |
| 一時認証 | `POST /v1/realtime/client_secrets`でブラウザ用ephemeral keyを発行 | ephemeral tokenはPreview。Live API向けに短命トークンを発行 |
| 会話制御 | Realtime session event、data channel、tool callsで舞台制御イベントへ接続しやすい | `BidiGenerateContent`の双方向メッセージで実装可能 |
| 低遅延音声 | WebRTCでブラウザのMediaStreamと相性がよい | WebSocketで音声チャンクを明示送受信する実装になる |
| Phase 4適合 | 第一候補 | 比較検証/バックアップ候補 |

推奨はOpenAI Realtime APIを先に接続し、Gemini Live APIは同じ抽象インターフェースに差し替えられる検証対象として残すこと。AIプロバイダ差分は`RealtimeConversationClient`のような境界に閉じ込め、Babylon.jsやLive2Dの操作層へ直接入れない。

## 接続方式

### OpenAI Realtime

1. ブラウザがアプリのバックエンドへ`POST /api/realtime/session`を呼ぶ。
2. バックエンドがサーバー保管の`OPENAI_API_KEY`で`POST /v1/realtime/client_secrets`を呼び、モデル、音声、instructions、tool定義、必要なら`OpenAI-Safety-Identifier`を設定する。
3. ブラウザは返却された短命`client_secret.value`だけを使う。
4. ブラウザで`RTCPeerConnection`を作成し、`navigator.mediaDevices.getUserMedia({ audio: true })`のtrackを追加する。
5. data channelを作成してsession event、response event、tool call相当の制御イベントを購読する。
6. SDP offerを生成し、`/v1/realtime/calls`へ送ってanswerを受け取り、`setRemoteDescription`する。

WebSocketは、サーバー側で既に音声パイプラインを持つ場合や、テレフォニー/ワーカー処理に寄せる場合の候補にする。現行ViteブラウザアプリのPhase 4初期検証ではWebRTCを優先する。

### Gemini Live

Gemini Live APIを比較する場合は、ブラウザがバックエンドからephemeral tokenを受け取り、`wss://generativelanguage.googleapis.com/ws/...BidiGenerateContentConstrained?access_token=...`へ接続する。最初の送信メッセージでモデル、response modalities、system instruction、tool/function相当の設定を送る。

Gemini側の注意点:

- 標準APIキーをブラウザに置かない。
- ephemeral tokenはPreview扱いとして、寿命、発行制限、失効時の再接続UXを個別に検証する。
- WebSocket実装では音声フレーム送信、受信音声再生、backpressure、切断復旧をアプリ側で明示的に扱う。

## バックエンドのephemeral token/session endpoint

このリポジトリは現時点ではVite単体で外部API依存を持たないため、Phase 4の実装時は別途小さなバックエンドを追加するか、既存の本番基盤に同等のendpointを置く。

想定endpoint:

```http
POST /api/realtime/session
Content-Type: application/json
Authorization: Bearer <app-user-token>
```

リクエスト例:

```json
{
  "provider": "openai",
  "mode": "push_to_talk",
  "speaker": "main_presenter",
  "presentationId": "demo-stage-001"
}
```

レスポンス例:

```json
{
  "provider": "openai",
  "transport": "webrtc",
  "clientSecret": "<ephemeral-client-secret>",
  "expiresAt": 1784680000,
  "sessionConfig": {
    "model": "gpt-realtime",
    "voice": "alloy",
    "outputModalities": ["audio"]
  }
}
```

バックエンド責務:

- 長期APIキーをサーバー環境変数/secret managerから読む。
- 認可済みユーザーだけに短命credentialを返す。
- `presentationId`、ユーザーID、provider、model、作成時刻を監査ログに残す。
- 一時credentialのTTL切れを前提に、再発行endpointをidempotentに扱う。
- instructions/tool定義をサーバー側で固定し、クライアントから任意の危険なtool定義を渡させない。

## Push-to-talkプロトタイプ形状

最初のUIは常時リスニングではなく、発表者が押している間だけ音声入力する。

状態:

- `idle`: Realtime未接続、または待機中。
- `connecting`: ephemeral credential取得中、またはWebRTC/WebSocket接続中。
- `ready`: 接続済み、入力待ち。
- `listening`: push-to-talk中。マイクtrackを有効化し、必要に応じて入力バッファを開始する。
- `thinking`: 発話終了後、AI応答待ち。
- `speaking`: AI音声またはテキスト応答を再生中。
- `fallback`: Script/Manualへ戻した状態。
- `error`: 接続、認証、デバイス、rate limitなどのエラー表示。

UI操作:

- Hold: マイク入力開始。
- Release: 入力をcommitし、AI応答生成を要求する。
- Cancel: 現在の応答音声を止め、`ready`へ戻す。
- Return to Script: 既存のScript Modeへ戻す。
- Manual: 既存のManual操作へ戻す。

最小検証では、`Space`や既存の進行キーと競合しない専用ボタン/キーを使う。プレゼン進行の誤操作を避けるため、push-to-talk中は`Next`系操作を抑止するか、明示的なUIフォーカス中だけ音声モード操作を有効にする。

## キャラクター発話状態フック

Realtime応答は、AIプロバイダからの生イベントをそのままBabylon.js/Live2Dへ渡さない。中間イベントへ正規化する。

```ts
type CharacterSpeakingState =
  | { kind: "idle" }
  | { kind: "listening"; speakerId: string }
  | { kind: "thinking"; speakerId: string }
  | { kind: "speaking"; speakerId: string; transcript?: string; intensity?: number }
  | { kind: "interrupted"; speakerId: string }
  | { kind: "error"; speakerId: string; message: string };
```

接続先:

- `CharacterController`: 3D/将来モデル差し替え境界。`speaking`で口パク、軽い表情、speaker spotlightを発火する。
- Live2D presenter layer: audio amplitudeまたは`speaking`状態に応じたlip sync/motionへ接続する。
- `DirectionResolver`: AIからのtool/eventは`DirectionIntent`へ正規化し、既存のsemantic direction assetsに解決する。
- status panel: provider、connection state、PTT state、fallback state、最新transcriptを表示する。

AIが返せる舞台制御は、直接のメソッド名やファイル名ではなく、以下のような意味IDに限定する。

```json
{
  "intent": "supplement",
  "emotion": "confident",
  "intensity": 0.55,
  "targetSpeaker": "main_presenter"
}
```

## Script/Manual fallback

Realtime音声モードは既存のScript Mode/Manual Modeの上に重ねる。接続失敗やAPI制限で発表全体が止まらないことを最重要にする。

fallback条件:

- ephemeral credential取得失敗。
- マイク許可拒否。
- WebRTC/WebSocket切断。
- model/rate limit/quota error。
- AI応答が一定秒数返らない。
- ユーザーが`Return to Script`または`Manual`を押す。

fallback時の動作:

- 進行中の音声入力とAI音声再生を停止する。
- 現在のcue index、speaker note、stage presetは維持する。
- 既存の`Next`、`Back`、`Supplement`、`Tsukkomi`、`Return`、`Pause`などの操作へ戻る。
- status panelに「Realtime unavailable / Script mode active」相当の短い状態だけ出す。

## APIキー保護

必須ルール:

- `OPENAI_API_KEY`、`GEMINI_API_KEY`をVite環境変数としてブラウザへ露出しない。
- `VITE_*`に長期APIキーを置かない。
- `.env.local`、server secret、クラウドsecret managerで長期キーを管理する。
- ブラウザには短命credentialだけを渡す。
- 一時credential発行endpointはアプリユーザー認証、CORS制限、rate limit、監査ログを持つ。
- tool/function schemaはサーバー管理とし、クライアント入力で任意のtoolを増やさない。
- AIイベントからDOM、Babylon.js、ローカルアセットパス、任意URLを直接操作しない。

## 検証順序

1. OpenAI WebRTC接続だけを行い、マイク入力、AI音声出力、切断復旧を確認する。
2. Push-to-talkのhold/releaseで入力区間を制御する。
3. 応答中に`CharacterSpeakingState`を更新し、ダミーPresenterの発話状態だけ動かす。
4. AI応答テキストまたはtool/eventを`DirectionIntent`へ変換し、既存のsemantic direction resolverへ渡す。
5. 失敗時にScript Mode/Manual Modeへ戻れることを確認する。
6. Gemini Live APIで同じ`RealtimeConversationClient`境界を実装できるか比較する。

## 未解決リスク

- Realtime APIの料金、rate limit、音声品質、会話中の割り込み品質は実デモ条件で測る必要がある。
- WebRTC autoplay、マイク権限、Bluetoothマイク/スピーカー遅延はブラウザとOS依存が強い。
- Gemini LiveのPreview機能は仕様変更リスクがある。
- 音声モード中のキー操作競合は、実UIでのユーザーテストが必要。
- 長時間プレゼンでは一時credential更新、会話履歴圧縮、session再接続の設計が必要。

## 推奨する次Issue

- `RealtimeConversationClient`の型定義とmock providerを追加する。
- 最小バックエンドの`/api/realtime/session`を追加する。
- OpenAI WebRTC push-to-talk demoをfeature flag付きで実装する。
- status panelにRealtime接続状態を表示する。
- Gemini Live providerを同一インターフェースで比較実装する。
