# Audio

Place future voice, sound effect, or narration assets here only when redistribution is allowed.

For private or licensed character audio, use `public/assets-local/audio/**` instead; that path is ignored by Git.

Configure playback per Cue, rather than through a global runtime dependency:

```json
{
  "audio": {
    "src": "/assets-local/audio/cue-intro-01.mp3",
    "durationMs": 8200,
    "volume": 0.9
  }
}
```

`durationMs` is used as the Demo Script Mode timing estimate. Missing files or browser autoplay restrictions leave the presentation playable and report the failure in the control panel.
