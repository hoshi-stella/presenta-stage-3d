import { cues } from "../presentation/cues";
import type { Cue } from "../presentation/types";
import "./archiveRetalkView.css";

type ArchiveCue = {
  cue: Cue;
  sectionLabel: string;
  supplement: string;
};

const retalkModes = [
  {
    label: "Beginner",
    description: "専門語をほどいて、発表中の例え話と補足を優先して再説明する。"
  },
  {
    label: "Deep Dive",
    description: "Cueの意図、分岐、演出指定を含めて、設計判断まで掘り下げる。"
  },
  {
    label: "Section Recap",
    description: "選んだCueの前後だけを短く再構成し、発表後の読み返しに使う。"
  }
];

export function renderArchiveRetalkView(root: HTMLElement): void {
  const archiveCues = createArchiveCues();
  root.innerHTML = `
    <main class="archive-shell">
      <header class="archive-header">
        <div>
          <p class="archive-kicker">Archive / Re-Talk View</p>
          <h1>発表後に読み直し、もう一度説明してもらうための静的モック</h1>
        </div>
        <a class="archive-stage-link" href="./">Stage View</a>
      </header>

      <section class="archive-layout" aria-label="Archive and Re-Talk mock">
        <aside class="archive-sidebar" aria-label="Archived cue list">
          <div class="archive-sidebar__heading">
            <h2>Cue一覧</h2>
            <span>${archiveCues.length} cues</span>
          </div>
          <ol class="archive-cue-nav">
            ${archiveCues.map(renderCueNavItem).join("")}
          </ol>
        </aside>

        <section class="archive-reader" aria-label="Archived presentation reader">
          <div class="archive-summary">
            <h2>発表後アーカイブ</h2>
            <p>
              Cueデータの発話、Speaker Note、補足候補、分岐履歴を後日閲覧向けに並べる。
              Stage Viewの進行状態は再実行せず、保存済みCueを読み物として扱う。
            </p>
          </div>

          <div class="archive-cards">
            ${archiveCues.map(renderArchiveCue).join("")}
          </div>
        </section>

        <aside class="retalk-panel" aria-label="Re-Talk modes">
          <h2>Re-Talk</h2>
          <p class="retalk-panel__lead">
            実AIはまだ接続しない。将来は選択CueとモードをAIへ渡し、再説明文を生成する。
          </p>
          <div class="retalk-mode-list">
            ${retalkModes.map(renderRetalkMode).join("")}
          </div>
          <div class="retalk-preview">
            <h3>選択Cueの入力想定</h3>
            <dl>
              <div>
                <dt>Cue</dt>
                <dd>${escapeHtml(archiveCues[2]?.cue.id ?? "cue_unknown")}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>Beginner</dd>
              </div>
              <div>
                <dt>Context</dt>
                <dd>発話、Speaker Note、分岐候補、前後Cueの要約</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>
    </main>
  `;
}

function createArchiveCues(): ArchiveCue[] {
  return cues.map((cue, index) => ({
    cue,
    sectionLabel: `Section ${index + 1}`,
    supplement: getSupplementText(cue)
  }));
}

function getSupplementText(cue: Cue): string {
  if (cue.after.branches?.length) {
    return "発表中に選べた分岐を残し、なぜ寄り道できたのかを後から確認できる。";
  }

  if (cue.stage?.objectRef) {
    return "3Dオブジェクトや演出指定は、アーカイブでは再生対象ではなく説明補助メタデータとして扱う。";
  }

  return "補足欄には発表後に追記した説明、Q&A、デモ再現リンクを置ける想定。";
}

function renderCueNavItem(item: ArchiveCue): string {
  return `
    <li>
      <a href="#${escapeHtml(item.cue.id)}">
        <span>${escapeHtml(item.sectionLabel)}</span>
        ${escapeHtml(item.cue.text)}
      </a>
    </li>
  `;
}

function renderArchiveCue(item: ArchiveCue): string {
  const { cue } = item;
  return `
    <article class="archive-card" id="${escapeHtml(cue.id)}">
      <div class="archive-card__meta">
        <span>${escapeHtml(item.sectionLabel)}</span>
        <span>${escapeHtml(cue.kind)}</span>
        <span>${escapeHtml(cue.speaker)}</span>
      </div>
      <h3>${escapeHtml(cue.text)}</h3>
      <dl class="archive-detail-grid">
        <div>
          <dt>Speaker Note</dt>
          <dd>${escapeHtml(cue.note ?? "なし")}</dd>
        </div>
        <div>
          <dt>補足</dt>
          <dd>${escapeHtml(item.supplement)}</dd>
        </div>
        <div>
          <dt>演出意図</dt>
          <dd>${escapeHtml(cue.direction.intent)} / ${escapeHtml(cue.direction.intensity)}</dd>
        </div>
        <div>
          <dt>分岐履歴候補</dt>
          <dd>${renderBranchHistory(cue)}</dd>
        </div>
      </dl>
    </article>
  `;
}

function renderBranchHistory(cue: Cue): string {
  if (!cue.after.branches?.length) {
    return "本筋Cueとして記録";
  }

  return `
    <ul class="archive-branch-list">
      ${cue.after.branches.map((branch) => `
        <li>${escapeHtml(branch.label)} -> ${escapeHtml(branch.targetCueId)}</li>
      `).join("")}
    </ul>
  `;
}

function renderRetalkMode(mode: { label: string; description: string }): string {
  return `
    <button class="retalk-mode" type="button" aria-pressed="false">
      <span>${escapeHtml(mode.label)}</span>
      ${escapeHtml(mode.description)}
    </button>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
