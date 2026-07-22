import type { PresentationControls } from "./controls";

export function bindKeyboardControls(controls: PresentationControls): () => void {
  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
      return;
    }

    const key = event.key.toLowerCase();

    if (controls.isCreditsVisible()) {
      if (key === "c") {
        event.preventDefault();
        controls.showCredits("crawl");
      }

      if (key === "v") {
        event.preventDefault();
        controls.showCredits("spiral");
      }

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

    if (key === "p") {
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

    if (key === "d") {
      controls.command("demo");
    }

    if (key === "q") {
      controls.command("qa");
    }

    if (key === "w") {
      controls.command("return_to_script");
    }

    if (key === "s") {
      controls.command("skip");
    }

    if (key === "r") {
      controls.reset();
    }

    if (key === "n") {
      controls.toggleNote();
    }

    if (key === "t") {
      controls.toggleSubtitles();
    }

    if (key === "c") {
      controls.showCredits("crawl");
    }

    if (key === "v") {
      controls.showCredits("spiral");
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}
