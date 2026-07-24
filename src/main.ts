import { App } from "./app/App";
import { renderArchiveRetalkView } from "./archiveRetalk/archiveRetalkView";
import "./style.css?lt-slide-lock-v2";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root element.");
}

const view = new URL(window.location.href).searchParams.get("view");

if (view === "archive-retalk" || window.location.hash === "#archive-retalk") {
  void renderArchiveRetalkView(root).catch((error: unknown) => {
    root.textContent = `Archive view failed to start: ${error instanceof Error ? error.message : String(error)}`;
  });
} else {
  const app = new App(root);
  void app.start().catch((error: unknown) => {
    root.textContent = `App failed to start: ${error instanceof Error ? error.message : String(error)}`;
  });
}
