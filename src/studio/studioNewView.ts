import { createStarterPresentation } from "./newPresentation";
import { saveRemotePresentation } from "./presentationRepository";

export function renderStudioNewView(root: HTMLElement): void {
  root.innerHTML = `<main class="studio-library" aria-label="Create presentation">
    <header class="studio-library__header"><div><a class="studio-library__brand" href="/studio">Presenta Studio</a><p>Create a starter Presentation Package</p></div><a class="studio-button" href="/studio">Back to presentations</a></header>
    <section class="studio-library__content"><form class="studio-create-form" data-studio-create-form>
      <div><p class="studio-inspector__eyebrow">New presentation</p><h1>Start with a reusable Package</h1><p>A new draft uses the local starter Package. You can change slides, Cues, characters, and assets in the editor.</p></div>
      <label class="studio-field">Title<input name="title" required maxlength="255" autofocus placeholder="My presentation"></label>
      <label class="studio-field">Author<input name="authorName" required maxlength="255" value="presenta-stage-3d"></label>
      <p class="studio-create-form__error" data-studio-create-error hidden></p>
      <button class="studio-button" type="submit">Create and edit</button>
    </form></section>
  </main>`;
  const form = root.querySelector<HTMLFormElement>("[data-studio-create-form]");
  const error = root.querySelector<HTMLElement>("[data-studio-create-error]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    void submit(form, error);
  });
}

async function submit(form: HTMLFormElement, error: HTMLElement | null): Promise<void> {
  const data = new FormData(form);
  const title = String(data.get("title") ?? "").trim();
  const authorName = String(data.get("authorName") ?? "").trim();
  const submitButton = form.querySelector<HTMLButtonElement>("button[type=submit]");
  if (!title || !authorName) return;
  if (submitButton) submitButton.disabled = true;
  if (error) error.hidden = true;
  try {
    const presentation = createStarterPresentation({ title, authorName });
    const saved = await saveRemotePresentation(presentation, { name: "Initial draft" });
    window.location.assign(`/studio/${encodeURIComponent(saved.presentationKey)}/edit`);
  } catch (reason) {
    if (error) {
      error.hidden = false;
      error.textContent = `Could not create the presentation. ${message(reason)}`;
    }
    if (submitButton) submitButton.disabled = false;
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
