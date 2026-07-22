import type { CharacterId, PresentationSnapshot } from "../presentation/types";
import { getCharacterInstance } from "../scene/characterRegistry";

export function renderStatusPanel(snapshot: PresentationSnapshot): string {
  const modeLabel = snapshot.mode === "liveAi"
    ? "Live AI Mode (stub)"
    : snapshot.mode === "qa"
      ? "QA Mode"
      : snapshot.mode === "semiAuto"
        ? "Semi-Auto Mode"
        : "Manual Mode";
  const noteMarkup = snapshot.showSpeakerNote
    ? `<section class="speaker-note"><h3>Speaker Note</h3><p>${escapeHtml(snapshot.cue.note ?? "No note")}</p></section>`
    : "";
  const aiMarkup = snapshot.aiMessage ? `<p class="ai-response">${escapeHtml(snapshot.aiMessage)}</p>` : "";
  const statusMarkup = snapshot.statusMessage ? `<p class="status-message">${escapeHtml(snapshot.statusMessage)}</p>` : "";
  const branches = snapshot.cue.after.branches ?? [];
  const branchMarkup = branches.length > 0
    ? branches.map((branch) => `<li>${escapeHtml(branch.label)} <span>${escapeHtml(branch.command)}</span></li>`).join("")
    : "<li>No branch commands</li>";
  const characterStates = Object.entries(snapshot.characterStates)
    .map(([characterId, state]) => {
      const character = getCharacterInstance(characterId as CharacterId);
      return `<li><strong>${escapeHtml(character.displayName)}</strong><small>${escapeHtml(character.role)}</small><span>${escapeHtml(state)}</span></li>`;
    })
    .join("");
  const resolvedEffects = snapshot.resolvedDirection.effects.length > 0
    ? snapshot.resolvedDirection.effects.map((effect) => `<li>${escapeHtml(effect.id)} <span>${escapeHtml(effect.kind)}</span></li>`).join("")
    : "<li>No effects</li>";
  const rejectedAssets = snapshot.resolvedDirection.assetDebug.rejected.length > 0
    ? snapshot.resolvedDirection.assetDebug.rejected
      .map((rejection) => `<li>${escapeHtml(rejection.assetId)} <span>${escapeHtml(rejection.reason)}</span></li>`)
      .join("")
    : "<li>No rejected candidates</li>";
  const object = snapshot.resolvedDirection.object;
  const objectMarkup = object
    ? `
      <section class="presentation-object-state">
        <h3>Presentation Object</h3>
        <dl class="cue-details">
          <div><dt>ID</dt><dd>${escapeHtml(object.objectId)}</dd></div>
          <div><dt>Action</dt><dd>${escapeHtml(object.action)}</dd></div>
          <div><dt>Part</dt><dd>${escapeHtml(object.activePartId ?? "all")}</dd></div>
        </dl>
      </section>
    `
    : "";
  const flowMarkup = `
    <section class="flow-state">
      <h3>Flow State</h3>
      <dl class="cue-details">
        <div><dt>QA</dt><dd>${snapshot.flow.isQaActive ? "active" : "inactive"}</dd></div>
        <div><dt>Return</dt><dd>${escapeHtml(snapshot.flow.returnCueLabel ?? "not set")}</dd></div>
      </dl>
      <ul>
        ${snapshot.flow.shortcutCommands.map((command) => `<li>${escapeHtml(command)}</li>`).join("")}
      </ul>
    </section>
  `;

  return `
    <div class="section-meta">
      <span>${modeLabel}</span>
      <span>${snapshot.cueIndex + 1} / ${snapshot.cueCount}</span>
      <span>${snapshot.isPaused ? "Paused" : "Ready"}</span>
    </div>
    <h1>${escapeHtml(snapshot.cue.slideRef ?? snapshot.cue.kind)}</h1>
    <p class="stage-text">${escapeHtml(snapshot.cue.text)}</p>
    <section class="character-line">
      <h2>Current Cue</h2>
      <dl class="cue-details">
        <div><dt>ID</dt><dd>${escapeHtml(snapshot.cue.id)}</dd></div>
        <div><dt>Kind</dt><dd>${escapeHtml(snapshot.cue.kind)}</dd></div>
        <div><dt>Speaker</dt><dd>${escapeHtml(snapshot.cue.speaker)}</dd></div>
        <div><dt>Slide</dt><dd>${escapeHtml(snapshot.cue.slideRef ?? "none")}</dd></div>
        <div><dt>Intent</dt><dd>${escapeHtml(snapshot.cue.direction.intent)}</dd></div>
        <div><dt>Intensity</dt><dd>${escapeHtml(snapshot.cue.direction.intensity)}</dd></div>
      </dl>
      ${statusMarkup}
    </section>
    <section class="branch-list">
      <h3>Available Branches</h3>
      <ul>${branchMarkup}</ul>
    </section>
    ${flowMarkup}
    <section class="character-state-list">
      <h3>Character State</h3>
      <ul>${characterStates}</ul>
    </section>
    <section class="direction-asset-list">
      <h3>Direction Assets</h3>
      <dl class="cue-details">
        <div><dt>Preset</dt><dd>${escapeHtml(snapshot.resolvedDirection.directionPresetId ?? "fallback")}</dd></div>
        <div><dt>Reason</dt><dd>${escapeHtml(snapshot.resolvedDirection.assetDebug.reason)}</dd></div>
      </dl>
      <ul>${resolvedEffects}</ul>
      <h3>Rejected Assets</h3>
      <ul>${rejectedAssets}</ul>
    </section>
    ${objectMarkup}
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
