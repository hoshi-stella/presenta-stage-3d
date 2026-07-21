import { App } from "./app/App";
import { renderArchiveRetalkView } from "./archiveRetalk/archiveRetalkView";
import "./style.css";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root element.");
}

const view = new URL(window.location.href).searchParams.get("view");

if (view === "archive-retalk" || window.location.hash === "#archive-retalk") {
  renderArchiveRetalkView(root);
} else {
  const app = new App(root);
  app.start();
}
