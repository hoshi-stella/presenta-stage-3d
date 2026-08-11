# ADR 0003: Product Surfaces and Runtime Roles

- Status: Accepted
- Date: 2026-08-09

## Context

The existing application calls the playback area Stage Player while it also contains authoring, local persistence, and future archive concerns. In an event, the presenter needs a control surface while the audience should see a separate projection surface. Treating all of these as one screen makes the operator and audience responsibilities unclear.

## Decision

Use four user-facing product surfaces: Presenta Studio, Presenta Console, Presenta Stage, and Presenta Archive. They share Presentation Package v1 and the local Package Repository API.

Keep Stage Player as an internal runtime term if useful, but name the user-facing screens by their role. Keep the application as one modular monolith; do not split it into independently deployed services solely because the screens differ.

## Consequences

Studio owns authoring and writes revisions. Console owns manual event operation. Stage owns audience rendering. Archive owns public-reading and replay views. Console-to-Stage state is ephemeral session state and stays separate from Package persistence.
