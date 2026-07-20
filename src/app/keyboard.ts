import type { PresentationControls } from "./controls";

export function bindKeyboardControls(controls: PresentationControls): () => void {
  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
      return;
    }

    if (event.code === "ArrowRight" || event.code === "Space") {
      event.preventDefault();
      controls.command("next");
    }

    if (event.code === "ArrowLeft") {
      event.preventDefault();
      controls.command("back");
    }

    if (event.key.toLowerCase() === "p") {
      controls.togglePause();
    }

    if (event.key === "1") {
      controls.command("supplement");
    }

    if (event.key === "2") {
      controls.command("example");
    }

    if (event.key === "3") {
      controls.command("tsukkomi");
    }

    if (event.key === "4") {
      controls.command("summary");
    }

    if (event.key.toLowerCase() === "q") {
      controls.command("qa");
    }

    if (event.key.toLowerCase() === "w") {
      controls.command("return_to_script");
    }

    if (event.key.toLowerCase() === "s") {
      controls.command("skip");
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
