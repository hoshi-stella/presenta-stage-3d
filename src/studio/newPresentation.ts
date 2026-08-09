import { createDefaultPresentation } from "../presentations/defaultPresentation";
import type { PresentationPackageV1 } from "../package/types";

export function createStarterPresentation(input: { title: string; authorName: string; now?: Date }): PresentationPackageV1 {
  const now = input.now ?? new Date();
  const title = input.title.trim();
  const authorName = input.authorName.trim();
  const presentation = createDefaultPresentation();
  return {
    ...presentation,
    presentation: {
      ...presentation.presentation,
      id: createPresentationKey(title, now),
      title,
      author: { ...presentation.presentation.author, name: authorName },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    publication: { lifecycle: "draft" }
  };
}

export function createPresentationKey(title: string, now = new Date()): string {
  const slug = title.toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "").toLowerCase();
  return slug ? `${slug}-${timestamp}` : `presentation-${timestamp}`;
}
