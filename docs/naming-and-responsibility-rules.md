# Naming and Responsibility Rules

## Goals

Use names that answer one question at a time:

- Who is this for?
- What lifecycle does this data belong to?
- Is this a domain rule, a storage boundary, an external adapter, or a UI surface?

Avoid names that combine those concerns, such as calling both the presenter controls and the audience projection "Stage Player".

## User-Facing Product Names

Use these names in navigation, documentation, user messages, and release notes.

| Name | User | Role |
| --- | --- | --- |
| **Presenta Studio** | Author | Create, edit, validate, version, and prepare a presentation. |
| **Presenta Console** | Presenter | Operate the selected revision during an event. |
| **Presenta Stage** | Audience | Project the active Cue with no operational UI. |
| **Presenta Archive** | Viewer | Read or replay a published revision. |

Do not use `Stage Player` as a user-facing screen name. It can remain a code-level runtime term while Console and Stage are still one compatibility screen.

## Core Terms

| Term | Meaning | Rule |
| --- | --- | --- |
| **Presentation** | The stable authored work identified by `presentation.id`. | One logical presentation has many revisions. |
| **Presentation Package** | Portable, versioned JSON content (`PresentationPackageV1`). | It must not contain runtime progress or local asset bytes. |
| **Revision** | Immutable database record of one saved Package. | Create a new revision; never overwrite its JSON. |
| **Working draft** | Studio's unsaved in-memory Package and local recovery copy. | It can be edited and discarded. |
| **Snapshot** | Named authoring checkpoint within a working draft. | It is not a database revision until Studio saves it. |
| **Publication state** | Draft/rehearsal/presented/published/archived intent on a Package or revision. | It does not itself make content public. |
| **Presentation session** | Ephemeral Console-to-Stage progression state. | It is never serialized into a Package or written on every Cue change. |
| **Cue** | One ordered unit of speech, visual layers, direction, and progression. | `CueRunner` is the only owner of Cue progression. |
| **Slide** | A reusable visual content unit referenced by Cues. | A slide does not own runtime progression. |
| **Profile** | Named presentation mode such as `classic_slide` or `stage3d`. | It describes intent, not a screen route. |

## Code Naming Rules

| Suffix or prefix | Responsibility | Examples |
| --- | --- | --- |
| `*Definition` | Serializable Package item. | `CueDefinition`, `AssetDefinition` |
| `*State` | Mutable UI or runtime state. | `StudioState`, `PresentationSessionState` |
| `*Revision` | Immutable persisted version metadata. | `PresentationRevision` |
| `*Snapshot` | Named working-draft checkpoint. | `StudioSnapshot` |
| `*Service` | Application use case or domain orchestration. | `PreflightService` |
| `*Repository` | Read/write boundary for Package persistence. | `PresentationRepository` |
| `*Adapter` | Translate one contract into another. | `PresentationPackageAdapter` |
| `*Controller` | Own a long-lived renderer or interaction integration. | `CharacterController` |
| `*View` | Render one browser surface or view. | `StudioListView`, `ConsoleView` |
| `create*` | Construct a new value or service with no side effect beyond construction. | `createStudioStore` |
| `load*` / `save*` | Read/write through a repository or browser adapter. | `loadRemotePresentation`, `saveRemotePresentation` |
| `render*` | Render DOM or graphics from supplied state. | `renderStudioView` |
| `adapt*` | Convert between stable contracts without I/O. | `adaptPresentationPackageToRuntime` |

Avoid generic terms such as `manager`, `helper`, `utils`, `data`, or `handler` unless a narrower role is genuinely unavailable.

## Module Ownership

| Module | Owns | Must not own |
| --- | --- | --- |
| `src/package` | Package schemas, migration, validation, import/export contracts. | DOM state, Cue progression, rendering. |
| `src/presentation` | CueRunner, runtime session rules, Package-to-runtime intent. | Studio persistence details or renderer mutation. |
| `src/studio` | Studio list/new/editor views and working-draft interaction. | Babylon/Live2D lifecycle or CueRunner. |
| `src/console` | Presenter controls, notes, timing, session commands. | Audience composition or Package editing. |
| `src/stage` | Audience-facing composition and projection-only view. | Editor controls or private notes. |
| `src/archive` | Public/replay policy, reading view, credits. | Local-only/private asset exposure. |
| `src/scene`, `src/live2d`, `src/imagePresenter`, `src/slides` | Rendering adapters. | Package mutation and persistence. |
| `api` | Package Repository API and transactional revision persistence. | Browser rendering or client-only state. |

Modules are introduced when a responsibility exists in code. Empty future directories are not created solely to reserve names.

## IDs, Routes, and Storage Keys

- Package entity IDs use stable lowercase kebab case: `lt-showcase`, `airi-manju`.
- JSON field names and query parameters use lower camel case: `presentationKey`, `startCue`.
- Database table names use plural snake case: `presentation_revisions`.
- Browser routes use lowercase kebab case: `/studio/new`, `/stage/:presentationKey`.
- `localStorage` and `sessionStorage` keys start with `presenta-stage-3d:` until the application package name changes deliberately.
- Never use a display title as an identifier or database key.

## Decision Check

Before adding a name, answer these checks:

1. Is it user-facing, a Package contract, runtime state, persistence, or a renderer?
2. Which module owns it?
3. Can a caller infer whether it mutates state or performs I/O?
4. Does it preserve the distinction between draft, revision, and session?

If one name cannot answer these checks, split the concept rather than adding another overloaded suffix.
