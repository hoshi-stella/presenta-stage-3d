# TAKT development workflow

TAKT is a development-process CLI. It is not a browser runtime dependency of
Presenta Stage 3D.

The CLI is installed for the current Windows user. Reopen PowerShell after the
first installation so the updated user `PATH` is available.

```powershell
node --version
takt --version
```

Reusable project workflows are versioned under `.takt/workflows/`. Local task
queues, reports, worktrees, credentials, and the temporary mock configuration
are ignored by Git.

## Validate the Presenta workflow

```powershell
takt workflow doctor presenta-maintenance
```

## Safe issue smoke test

The project-local `.takt/config.yaml` uses the mock provider. Run the workflow
in direct pipeline mode with Git disabled so it cannot create a worktree,
branch, commit, or pull request:

```powershell
takt --provider mock --workflow presenta-smoke --pipeline --skip-git --task "Issue #41 planning-only check: inspect the current projection layout and reduced-motion support; report candidate files and validation steps; do not edit files, commit, or create a pull request."
```

`takt add` creates a persistent queued task and currently defaults its task
metadata to automatic PR creation. Do not use it for this smoke test. For real
tasks, inspect the generated `.takt/tasks.yaml` before running it and set
`auto_pr: false` unless automatic PR creation is explicitly intended.

`presenta-smoke` only validates the installed CLI and intentionally does not
replace the plan, implementation, and review loop in `presenta-maintenance`.

## Running with Codex

TAKT's Codex SDK provider needs an OpenAI API key; it cannot reuse the Codex
desktop login automatically. Set `provider: codex` in the local config and
provide `TAKT_OPENAI_API_KEY` only in the shell that will run the task.

Before an AI run, use a short-lived branch from `develop`, review the issue
scope, and keep PR creation explicit. TAKT must not merge to `main`, create
tags, or publish releases.
