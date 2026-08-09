import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import {
  listRemotePresentations,
  loadRemotePresentation,
  saveRemotePresentation
} from "./presentationRepository";

describe("presentationRepository", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns remote presentation summaries when listing succeeds", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({
      presentations: [{
        presentationKey: "lt-demo",
        title: "LT demo",
        lifecycle: "draft",
        updatedAt: "2026-08-10T00:00:00.000Z",
        revisionNumber: 2,
        snapshotName: "rehearsal",
        revisionCreatedAt: "2026-08-10T00:00:00.000Z"
      }]
    }));

    await expect(listRemotePresentations()).resolves.toMatchObject([{ presentationKey: "lt-demo", revisionNumber: 2 }]);
    expect(fetchMock).toHaveBeenCalledWith("/api/presentations");
  });

  it("blocks invalid packages before issuing a save request", async () => {
    const presentation = createDefaultPresentation();
    presentation.presentation.title = "";
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(saveRemotePresentation(presentation)).rejects.toThrow("Resolve 1 Package validation error(s) before saving to MariaDB.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces API error messages when saving fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "MariaDB is unavailable." }, 503));

    await expect(saveRemotePresentation(createDefaultPresentation())).rejects.toThrow("MariaDB is unavailable.");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/presentations/built-in-demo",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("loads the stored package and revision when the API succeeds", async () => {
    const presentation = createDefaultPresentation();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({
      presentation,
      revision: { id: "revision-1", number: 1, snapshotName: "initial", snapshotNote: null },
      lifecycle: "rehearsal"
    }));

    await expect(loadRemotePresentation("lt demo/1")).resolves.toMatchObject({
      presentation: { presentation: { id: "built-in-demo" } },
      revision: { number: 1 },
      lifecycle: "rehearsal"
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/presentations/lt%20demo%2F1");
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
