# ADR 0002: Studio Uses a Single Directional Editor Store

- Status: Accepted
- Date: 2026-07-30

## Context

The editor needs selection, loading, import errors, and unsaved-change state without making DOM components the source of truth.

## Decision

Studio owns one `StudioStore`. User actions update the store; the workspace renders from its state. The editable Package is held in the store, while Package parsing, validation, and export remain in `src/package`.

## Consequences

Studio can grow into separate navigation, preview, and inspector components without duplicated state. Selection does not mark a Package dirty; a Package mutation does. The Stage Player continues to receive a completed validated Package rather than sharing editor state.
