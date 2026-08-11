import { listRemotePresentations, type RemotePresentationSummary } from "./presentationRepository";

export function renderStudioListView(root: HTMLElement): void {
  root.innerHTML = renderShell("Loading presentations...");
  void load();

  async function load(): Promise<void> {
    try {
      const presentations = await listRemotePresentations();
      root.innerHTML = renderShell(renderPresentationList(presentations));
    } catch (error) {
      root.innerHTML = renderShell(`<p class="studio-library__error">MariaDB is unavailable. Start the local Compose stack, then refresh this page. ${escape(message(error))}</p>`);
    }
  }
}

function renderShell(content: string): string {
  return `<main class="studio-library" aria-label="Presenta Studio presentations">
    <header class="studio-library__header">
      <div><a class="studio-library__brand" href="/studio">Presenta Studio</a><p>Presentation packages and saved revisions</p></div>
      <a class="studio-button" href="/studio/new">New presentation</a>
    </header>
    <section class="studio-library__content">${content}</section>
  </main>`;
}

function renderPresentationList(presentations: RemotePresentationSummary[]): string {
  if (!presentations.length) return `<div class="studio-library__empty"><h1>No saved presentations</h1><p>Create a starter package, then edit and save its first revision.</p><a class="studio-button" href="/studio/new">Create presentation</a></div>`;
  return `<div class="studio-library__list">${presentations.map((presentation) => `<article class="studio-library__row">
    <div><h1>${escape(presentation.title)}</h1><p>${escape(presentation.presentationKey)}</p></div>
    <div class="studio-library__meta"><span>${escape(presentation.lifecycle)}</span><span>Revision ${presentation.revisionNumber ?? 0}</span><span>${formatDate(presentation.updatedAt)}</span></div>
    <a class="studio-button" href="/studio/${encodeURIComponent(presentation.presentationKey)}/edit">Edit</a>
  </article>`).join("")}</div>`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function escape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
