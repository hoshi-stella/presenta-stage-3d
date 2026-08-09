# ADR 0004: Naming and Responsibility Rules

- Status: Accepted
- Date: 2026-08-10

## Context

Presenta combines authored Package data, saved revisions, local snapshots, runtime progression, browser surfaces, and rendering adapters. Using the same name for multiple roles makes persistence and event-operation changes harder to review safely.

## Decision

Adopt the user-facing surface names Presenta Studio, Presenta Console, Presenta Stage, and Presenta Archive. Adopt the Package, revision, snapshot, and session definitions in [Naming and Responsibility Rules](../naming-and-responsibility-rules.md). Use responsibility-specific code suffixes such as `Definition`, `State`, `Repository`, `Adapter`, `Controller`, and `View`.

## Consequences

New code identifies whether it is serializable content, ephemeral runtime state, persistence I/O, or rendering. Existing internal names do not require a broad mechanical rename; migrate them only when their caller-facing role changes or when touching the relevant module.
