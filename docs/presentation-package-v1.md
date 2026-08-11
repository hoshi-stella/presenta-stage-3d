# Presentation Package v1

`Presentation Package` is the versioned data source shared by Presenta Studio, Stage Player, and a future Presenta Archive.

```txt
Presenta Studio -> Presentation Package <- Stage Player
                                  <- Presenta Archive
```

Stage Player loads a package, validates it, then adapts it to the existing CueRunner and slide runtime. CueRunner remains independent of JSON, file imports, and any future editing UI.

## Package shape

```json
{
  "schemaVersion": 1,
  "presentation": { "id": "my-talk", "title": "My talk", "author": { "name": "Author" }, "language": "ja" },
  "slides": [],
  "cues": [],
  "characters": [],
  "assets": [],
  "directionPresets": [],
  "settings": { "defaultProfile": "classic_slide", "defaultLayers": ["slide"], "fallbackProfile": "classic_slide", "mode": "manual", "aspectRatio": "16:9", "subtitle": { "enabled": true } }
}
```

The formal schema is [presentation-package-v1.schema.json](../schemas/presentation-package-v1.schema.json). Unknown fields are allowed for forward compatibility, but required fields, enum values, and runtime references are checked before playback.

## IDs and references

IDs must be non-empty and unique within slides, cues, characters, assets, and direction presets. Cues refer to `slideRef`, `speaker`, `stage.directionPreset`, effects, and branch `targetCueId` by ID. Broken references are errors and prevent import.

## Asset visibility and licenses

Assets are marked `local-only`, `private`, `public`, or `public-with-credit`. `local-only` assets are accepted for Stage Player but generate warnings and must remain outside Git, normally in `public/assets-local/**`. Packages may include license metadata and credit text without embedding the source files.

`.env.local` has priority over Package presenter URLs. The package supplies portable defaults; local environment configuration selects owned or licensed Live2D, image, and GLB assets. Missing local assets continue through the existing dummy/hidden fallback behavior.

## Import and export

At startup the player checks, in order:

1. `?presentation=/presentations/demo/lt-showcase/presentation.json`
2. `VITE_PRESENTATION_URL`
3. `/presentations/demo/lt-showcase/presentation.json`
4. the built-in TypeScript demo

Use **Load Package** in the Presenter Console to import a JSON file for the current browser session. It validates and immediately replaces the active slides and cues; a failed import keeps the current presentation intact. **Export Package** downloads validated JSON with a safe filename. Export never writes local assets into Git.

The bundled LT package is [demo/lt-showcase/presentation.json](../public/presentations/demo/lt-showcase/presentation.json). The legacy [samples/legacy-lt-demo/presentation.json](../public/presentations/samples/legacy-lt-demo/presentation.json) remains temporarily as the pre-v1 document format reference.

## Validation and migration

Validation reports errors separately from warnings. Errors include invalid structure, unsupported schema versions, duplicate IDs, and missing references. Warnings include local-only assets, missing durations, and missing asset fallbacks.

`schemaVersion` is required. Version 1 currently has no historical migration; future versions should add a narrow migration in `src/package/migrations.ts`, then validate the migrated v1 value before adapting it to runtime data.

## Runtime adapter

`adaptPresentationPackageToRuntime()` converts package slides and cues to the existing `SlideContent` and `Cue` types. Unsupported future slide layouts fall back to `content`; unknown speakers fall back to `dummy`; unknown semantic direction values fall back to `neutral`; `stop` becomes `wait_for_presenter`. This preserves a stable runtime while the package evolves.
