import type { CharacterId, Cue, PresentationSnapshot } from "../presentation/types";
import { getCharacterInstance } from "../scene/characterRegistry";
import type { PreflightReport } from "../preflight/types";

export type PackageStatus = { id: string; title: string; source: string; errors: number; warnings: number };

export function renderStatusPanel(
  snapshot: PresentationSnapshot,
  packageStatus?: PackageStatus,
  preflightReport?: PreflightReport | null,
  isTransitioning = false
): string {
  const activeSpeaker = getCharacterInstance(snapshot.cue.speaker);
  const branches = snapshot.cue.after.branches ?? [];
  const nextCue = snapshot.runOfShow.nextCue;
  const modeLabel = getModeLabel(snapshot.mode);
  const currentTarget = snapshot.cue.demo?.targetSeconds ?? 0;
  const branchMarkup = branches.length > 0
    ? branches.map((branch) => `
        <li class="console-branch-command">
          <span>${escapeHtml(branch.label)}</span>
          <kbd>${escapeHtml(getCommandShortcut(branch.command))}</kbd>
        </li>
      `).join("")
    : "<li class=\"console-empty\">No branch command on this cue</li>";
  const noteMarkup = snapshot.showSpeakerNote
    ? `<section class="speaker-note"><h3>Speaker Note</h3><p>${escapeHtml(snapshot.cue.note ?? "No note")}</p></section>`
    : "";
  const statusMarkup = snapshot.statusMessage ? `<p class="status-message">${escapeHtml(snapshot.statusMessage)}</p>` : "";
  const aiMarkup = snapshot.aiMessage ? `<p class="ai-response">${escapeHtml(snapshot.aiMessage)}</p>` : "";

  return `
    <header class="presenter-console__header">
      <div class="section-meta">
        <span>${modeLabel}</span>
        <span>${snapshot.cueIndex + 1} / ${snapshot.cueCount}</span>
        <span class="${isTransitioning ? "is-active" : ""}">${isTransitioning ? "Transition guard" : "Ready"}</span>
      </div>
      <p class="presenter-console__eyebrow">Now</p>
      <h1>${escapeHtml(snapshot.cue.slideRef ?? snapshot.cue.kind)}</h1>
      <p class="stage-text">${escapeHtml(snapshot.cue.text)}</p>
      ${statusMarkup}
    </header>

    <section class="presenter-console__overview">
      <div>
        <h2>Current Cue</h2>
        <dl class="cue-details">
          <div><dt>Speaker</dt><dd>${escapeHtml(activeSpeaker.displayName)}</dd></div>
          <div><dt>Profile</dt><dd>${escapeHtml(snapshot.presentation.profile ?? "none")}</dd></div>
          <div><dt>Layers</dt><dd>${escapeHtml(snapshot.presentation.activeLayers.join(" + ") || "none")}</dd></div>
          <div><dt>Fallback</dt><dd>${escapeHtml(snapshot.fallbackLevel)}</dd></div>
          <div><dt>Subtitle</dt><dd>${snapshot.showSubtitles ? "on" : "off"}</dd></div>
        </dl>
      </div>
      <div>
        <h2>Run of Show</h2>
        <dl class="cue-details">
          <div><dt>Step</dt><dd>${snapshot.cue.demo?.step ?? "-"}</dd></div>
          <div><dt>Current</dt><dd>${formatDuration(currentTarget)}</dd></div>
          <div><dt>Elapsed</dt><dd>${formatDuration(snapshot.runOfShow.elapsedTargetSeconds)}</dd></div>
          <div><dt>Remaining</dt><dd>${formatDuration(snapshot.runOfShow.remainingTargetSeconds)}</dd></div>
        </dl>
      </div>
    </section>

    <section class="presenter-console__next">
      <p class="presenter-console__eyebrow">Next</p>
      ${nextCue ? renderNextCue(nextCue) : "<p class=\"console-empty\">Final cue. Move to the ending when ready.</p>"}
    </section>

    <section class="branch-list presenter-console__branches">
      <h2>Available Commands</h2>
      <ul>${branchMarkup}</ul>
    </section>

    <section class="presenter-console__shortcuts">
      <h2>Keyboard</h2>
      <ul>
        <li><kbd>Space</kbd><span>Next cue</span></li>
        <li><kbd>Left</kbd><span>Back</span></li>
        <li><kbd>P</kbd><span>Pause / resume</span></li>
        <li><kbd>S</kbd><span>Skip ahead</span></li>
        <li><kbd>1-4</kbd><span>Branch shortcuts</span></li>
        <li><kbd>D</kbd><span>Demo script</span></li>
      </ul>
    </section>

    <details class="presenter-console__details">
      <summary>Diagnostics and setup</summary>
      ${renderDiagnosticMarkup(snapshot, packageStatus, preflightReport)}
    </details>

    ${noteMarkup}
    <section class="mock-ai">
      <h3>Mock AI</h3>
      <div class="mock-ai-row">
        <input id="mock-ai-input" type="text" placeholder="Ask mock AI..." value="" />
        <button id="mock-ai-button" type="button">Ask Mock AI</button>
      </div>
      ${aiMarkup}
    </section>
  `;
}

function renderNextCue(cue: Cue): string {
  const speaker = getCharacterInstance(cue.speaker);
  return `
    <h2>${escapeHtml(cue.slideRef ?? cue.kind)}</h2>
    <p>${escapeHtml(cue.text)}</p>
    <dl class="cue-details">
      <div><dt>Speaker</dt><dd>${escapeHtml(speaker.displayName)}</dd></div>
      <div><dt>Step</dt><dd>${cue.demo?.step ?? "-"} / ${formatDuration(cue.demo?.targetSeconds ?? 0)}</dd></div>
      <div><dt>Intent</dt><dd>${escapeHtml(cue.direction.intent)}</dd></div>
    </dl>
  `;
}

function renderDiagnosticMarkup(snapshot: PresentationSnapshot, packageStatus?: PackageStatus, preflightReport?: PreflightReport | null): string {
  const characterStates = Object.entries(snapshot.characterStates)
    .map(([characterId, state]) => {
      const character = getCharacterInstance(characterId as CharacterId);
      return `<li><strong>${escapeHtml(character.displayName)}</strong><span>${escapeHtml(state)}</span></li>`;
    })
    .join("");
  const effects = snapshot.resolvedDirection.effects.length > 0
    ? snapshot.resolvedDirection.effects.map((effect) => `<li>${escapeHtml(effect.id)}<span>${escapeHtml(effect.kind)}</span></li>`).join("")
    : "<li class=\"console-empty\">No effects</li>";
  const packageMarkup = packageStatus
    ? `<dl class="cue-details"><div><dt>Package</dt><dd>${escapeHtml(packageStatus.title)}</dd></div><div><dt>Source</dt><dd>${escapeHtml(packageStatus.source)}</dd></div><div><dt>Validation</dt><dd>${packageStatus.errors} errors / ${packageStatus.warnings} warnings</dd></div></dl>`
    : "";
  const preflightMarkup = preflightReport
    ? renderPreflightSummary(preflightReport)
    : "<p class=\"console-empty\">Preflight has not been run.</p>";

  return `
    <section><h3>Presentation Package</h3>${packageMarkup}</section>
    <section><h3>Preflight</h3>${preflightMarkup}</section>
    <section><h3>Character State</h3><ul class="character-state-list">${characterStates}</ul></section>
    <section><h3>Direction</h3><dl class="cue-details"><div><dt>Preset</dt><dd>${escapeHtml(snapshot.resolvedDirection.directionPresetId ?? "fallback")}</dd></div><div><dt>Layout</dt><dd>${escapeHtml(snapshot.presentation.layout)}</dd></div><div><dt>Audio</dt><dd>${escapeHtml(snapshot.audio.state)}</dd></div></dl><ul class="direction-asset-list">${effects}</ul></section>
  `;
}

function renderPreflightSummary(report: PreflightReport): string {
  const blocked = report.checks.filter((check) => check.level === "blocked").length;
  const warnings = report.checks.filter((check) => check.level === "warning").length;
  const concerns = report.checks.filter((check) => check.level !== "ready");
  const checkMarkup = concerns.length > 0
    ? `<ul class="direction-asset-list">${concerns.map((check) => `<li><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.remediation ?? check.detail)}</span></li>`).join("")}</ul>`
    : "<p class=\"console-empty\">All checks are ready.</p>";
  const fallbackMarkup = report.fallbackVerification.length > 0
    ? `<ul class="direction-asset-list">${report.fallbackVerification.map((result) => `<li><strong>${escapeHtml(result.label)}</strong><span>${escapeHtml(result.level)}${result.cueId ? `: ${escapeHtml(result.cueId)}` : ""}</span></li>`).join("")}</ul>`
    : "<p class=\"console-empty\">Load a Presentation Package to verify fallback Cue paths.</p>";

  return `
    <dl class="cue-details">
      <div><dt>Result</dt><dd>${blocked} blocked / ${warnings} warnings</dd></div>
      <div><dt>Fallback</dt><dd>${escapeHtml(report.recommendedFallbackLevel)}</dd></div>
      <div><dt>Viewport</dt><dd>${report.viewport.width} x ${report.viewport.height}</dd></div>
      <div><dt>Motion</dt><dd>${report.reducedMotionPreferred ? "reduced" : "standard"}</dd></div>
    </dl>
    <h4>Action items</h4>${checkMarkup}
    <h4>Fallback verification</h4>${fallbackMarkup}
  `;
}

function getModeLabel(mode: PresentationSnapshot["mode"]): string {
  if (mode === "demoScript") return "Demo Script";
  if (mode === "semiAuto") return "Semi-Auto";
  if (mode === "qa") return "QA Mode";
  if (mode === "liveAi") return "Live AI (stub)";
  return "Manual Mode";
}

function getCommandShortcut(command: string): string {
  const shortcuts: Record<string, string> = {
    supplement: "1",
    example: "2",
    tsukkomi: "3",
    summary: "4",
    return_to_script: "W"
  };
  return shortcuts[command] ?? command;
}

function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
