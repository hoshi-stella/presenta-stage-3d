import { App } from "./app/App";
import { renderArchiveRetalkView } from "./archiveRetalk/archiveRetalkView";
import "./style.css?lt-manju-drawer-v1";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root element.");
}

const url = new URL(window.location.href);
const view = url.searchParams.get("view");
const studioEditMatch = url.pathname.match(/^\/studio\/([^/]+)\/edit\/?$/);

if (url.pathname === "/studio" || url.pathname === "/studio/") {
  void import("./studio/studioListView").then(({ renderStudioListView }) => renderStudioListView(root)).catch((error: unknown) => {
    root.textContent = `Studio failed to start: ${error instanceof Error ? error.message : String(error)}`;
  });
} else if (url.pathname === "/studio/new" || url.pathname === "/studio/new/") {
  void import("./studio/studioNewView").then(({ renderStudioNewView }) => renderStudioNewView(root)).catch((error: unknown) => {
    root.textContent = `Studio failed to start: ${error instanceof Error ? error.message : String(error)}`;
  });
} else if (view === "studio" || studioEditMatch) {
  void import("./studio/studioView").then(({ renderStudioView }) => renderStudioView(root, { presentationKey: studioEditMatch ? decodeURIComponent(studioEditMatch[1]) : url.searchParams.get("presentationKey") ?? undefined })).catch((error: unknown) => {
    root.textContent = `Studio failed to start: ${error instanceof Error ? error.message : String(error)}`;
  });
} else if (view === "archive-retalk" || window.location.hash === "#archive-retalk") {
  void renderArchiveRetalkView(root).catch((error: unknown) => {
    root.textContent = `Archive view failed to start: ${error instanceof Error ? error.message : String(error)}`;
  });
} else {
  const app = new App(root);
  void app.start().catch((error: unknown) => {
    root.textContent = `App failed to start: ${error instanceof Error ? error.message : String(error)}`;
  });
}
