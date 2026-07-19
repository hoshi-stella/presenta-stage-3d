import type { PresentationSnapshot } from "../presentation/types";

export function renderStatusPanel(snapshot: PresentationSnapshot): string {
  const modeLabel = snapshot.mode === "liveAi" ? "Live AI Mode (stub)" : snapshot.mode === "script" ? "Script Mode" : "Manual Mode";
  const noteMarkup = snapshot.showSpeakerNote
    ? `<section class="speaker-note"><h3>Speaker Note</h3><p>${escapeHtml(snapshot.section.speakerNote)}</p></section>`
    : "";
  const aiMarkup = snapshot.aiMessage ? `<p class="ai-response">${escapeHtml(snapshot.aiMessage)}</p>` : "";

  return `
    <div class="section-meta">
      <span>${modeLabel}</span>
      <span>${snapshot.sectionIndex + 1} / ${snapshot.sectionCount}</span>
      <span>${snapshot.isScriptPlaying ? "Playing" : "Paused"}</span>
    </div>
    <h1>${escapeHtml(snapshot.section.title)}</h1>
    <p class="stage-text">${escapeHtml(snapshot.section.stageText)}</p>
    <section class="character-line">
      <h2>Character</h2>
      <p>${escapeHtml(snapshot.section.characterLine)}</p>
    </section>
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
