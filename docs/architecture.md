# Presenta Architecture

Presenta is a modular monolith. Studio, Console, Stage, and Archive share a versioned `Presentation Package`; they are not separate deployments or independently versioned services.

```txt
Presentation Package (versioned data)
     ^                  ^                   ^
     |                  |                   |
Studio workspace    Console / Stage    Archive / replay
                    -> runtime adapter -> CueRunner -> layers
```

## Dependency direction

- `src/package`: Package types, migration, validation, loading, and export. It has no Studio, Stage, Babylon, or DOM-runtime dependency except browser file/download adapters.
- `src/presentation`: runtime domain. `CueRunner` owns progression state and resolves one Cue at a time. It does not know how a Package was imported or edited.
- `src/scene`, `src/slides`, `src/live2d`, `src/imagePresenter`, and `src/ui`: delivery adapters. They render runtime state and must not mutate Package state.
- `src/studio`: editor UI state. It loads and validates Packages through `src/package`; it does not instantiate `CueRunner` or own Stage rendering.
- `src/app`: runtime composition root. It loads a Package, adapts it, then wires CueRunner and display layers for the current runtime surface.

This is Clean Architecture applied proportionally: core data and runtime rules depend on neither the editor nor rendering libraries. Babylon.js, Live2D, browser files, and download links are outer adapters.

## Source of truth and state ownership

`PresentationPackageV1` is the persistent source of truth. Studio keeps one in-memory editable Package plus selection/loading/error/dirty UI state. Stage Player receives a validated Package and creates runtime data through `adaptPresentationPackageToRuntime()`.

`CueRunner` is a finite-state progression controller: current cue index, mode, pause state, history, fallback level, and scheduling are runtime-only. Its state is never serialized into a Package.

## Routing

- `/`: Presenta Stage compatibility route.
- `/?view=studio`: Presenta Studio editor compatibility route.
- `/?view=archive-retalk`: Archive/replay view.
- `?presentation=<url>`: optional Package input shared by Stage Player and Studio.

The planned named surfaces and route migration are documented in [Presenta Product Surfaces](presenta-product-surfaces.md).

The same URL parameter deliberately opens the same Package in either Studio or Stage Player. A file imported in Studio exists only for that browser session and therefore opens Stage Player without a URL reference.

## Testing strategy

Use TDD first for deterministic boundaries: Package migration/validation/import/export, Package-to-runtime adaptation, CueRunner transitions, and Studio store state. Verify graphics and browser-only adapters with build checks and browser playback, including missing local assets and fallback paths.
