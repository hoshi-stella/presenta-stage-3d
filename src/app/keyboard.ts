import type { PresentationControls } from "./controls";

export function bindKeyboardControls(controls: PresentationControls): () => void {
  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
      return;
    }

    if (event.code === "ArrowRight" || event.code === "Space") {
      event.preventDefault();
      controls.next();
    }

    if (event.code === "ArrowLeft") {
      event.preventDefault();
      controls.previous();
    }

    if (event.key.toLowerCase() === "p") {
      controls.toggleScript();
    }

    if (event.key.toLowerCase() === "r") {
      controls.reset();
    }

    if (event.key.toLowerCase() === "n") {
      controls.toggleNote();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}
