# ADR 0001: Modular Monolith With Presentation Package Boundary

- Status: Accepted
- Date: 2026-07-30

## Context

Presenta combines editor, playback, archive, 2D, Live2D, and 3D concerns. Splitting these into services would add deployment and versioning work before there is a server-side product need.

## Decision

Keep one TypeScript/Vite application divided by modules. Use `PresentationPackageV1` as the contract between Studio, Stage Player, and future Archive. Preserve `CueRunner` as the playback state-machine boundary and adapt Packages into existing runtime types at the Stage Player composition root.

## Consequences

New persistent presentation features belong in `src/package`. New playback behavior belongs in `src/presentation`. Rendering integrations stay outside those modules. A future server or database may implement Package storage without changing the Package contract or CueRunner.
