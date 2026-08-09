# Presenta Product Surfaces

## Purpose

Presenta uses one versioned `PresentationPackageV1` across authoring, event operation, audience projection, and public viewing. These are separate user experiences, not separate products with separate data models.

```txt
Presenta Studio  -> author and save Package revisions
Presenta Console -> operate a selected revision during a talk
Presenta Stage   -> project the current Cue to an audience display
Presenta Archive -> publish a selected revision for later viewing
```

The browser application remains a modular monolith. The local API is the only database boundary. Studio writes revisions; Console, Stage, and Archive read an explicit revision.

## Screen Responsibilities

| Surface | Primary user | Responsibility | Must not contain |
| --- | --- | --- | --- |
| Studio list | Author | List, search, duplicate, archive, and open presentations | Cue playback controls |
| Studio new | Author | Start an empty Package or apply a template | Persistent asset bytes |
| Studio editor | Author | Edit slides, Cues, assets, snapshots, and Package settings | Stage rendering ownership |
| Console | Presenter | See notes, timing, next Cue, warnings, and operate progression | Audience-facing controls |
| Stage | Audience | Render only the active Cue and fallback-safe layers | Notes, editor UI, diagnostics |
| Archive | Viewer | Read public slides, transcript, credits, and optional replay | Private notes or local-only assets |

## Naming

- **Presenta Studio** is the authoring product surface.
- **Presenta Console** is the presenter-operated screen formerly described by the internal `StagePlayer` concept.
- **Presenta Stage** is the external-display, audience-facing screen.
- **Presenta Archive** is the public/replay surface.

`StagePlayer` may remain an internal runtime/composition name. It is not the preferred user-facing label because it conflates presenter operation with audience projection.

## Route Plan

Routes are introduced incrementally. Existing links remain valid until the corresponding dedicated surface is complete.

| Route | Surface | Status |
| --- | --- | --- |
| `/` | Presenta Stage compatibility route | existing |
| `/?view=studio` | Presenta Studio editor compatibility route | existing |
| `/studio` | Studio list | next |
| `/studio/new` | Studio new | next |
| `/studio/:presentationKey/edit` | Studio editor | follows list/new |
| `/console/:presentationKey` | Presenta Console | planned |
| `/stage/:presentationKey` | Presenta Stage | planned |
| `/archive/:presentationKey` | Presenta Archive | planned |

At first, route state may be implemented with the browser URL and client-side view selection. A router library is not required until nested navigation, guards, or browser history behavior make it valuable.

## Data and Revision Rules

- A `PresentationPackageV1` is the portable content contract.
- The local API stores immutable revisions under `presentation.id`.
- Studio edits a working Package, then explicitly saves a new revision.
- Console, Stage, and Archive resolve a revision before opening. They never mutate a Package while rendering it.
- Console-to-Stage synchronization is runtime session state, not a Package revision and not a database write on every Cue advance.
- Archive reads a published revision and applies export/publication rules before it exposes content.

## Delivery Sequence

1. Merge local API persistence and expose saved Package revisions in Studio.
2. Implement Studio list and Studio new; preserve the current editor as the edit surface.
3. Add explicit revision selection when opening Console, Stage, and Archive.
4. Split Console and Stage into synchronized windows for a single PC and external display.
5. Add Archive adapters for public static HTML, Markdown/article source, PDF-ready output, and credits.

## Non-goals for the First Studio Navigation Slice

- Multi-user editing, authentication, sharing, or cloud synchronization.
- Moving local-only model/image bytes into MariaDB.
- Automatically selecting an HDMI display.
- Publishing directly to note, Speaker Deck, or other third-party services.
