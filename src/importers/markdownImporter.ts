import type { CharacterDefinition, PresentationPackageV1 } from "../package/types";

export type MarkdownImportOptions = {
  title?: string;
  author?: string;
  language?: string;
};

export type MarkdownImportResult = {
  presentation: PresentationPackageV1;
  warnings: string[];
};

type CueDirective = { speaker?: string; note?: string; intent?: string; profile?: string };

const characters: CharacterDefinition[] = [
  { id: "presenter", displayName: "Presenter", roles: ["presenter"] },
  { id: "airi_manju", displayName: "Airi Manju", roles: ["commentator"] },
  { id: "airi_live2d", displayName: "Airi Live2D", roles: ["commentator"] },
  { id: "stage_3d_presenter", displayName: "3D Stage Presenter", roles: ["presenter"] }
];

export function importMarkdownPresentation(markdown: string, options: MarkdownImportOptions = {}): MarkdownImportResult {
  if (!markdown.trim()) throw new Error("Markdown source is empty.");

  const { frontMatter, content } = splitFrontMatter(markdown);
  const sections = content.split(/^\s*---\s*$/m).map((section) => section.trim()).filter(Boolean);
  if (!sections.length) throw new Error("Markdown source has no slide content.");

  const parsedSlides = sections.map(parseSlide);
  if (parsedSlides.some((slide) => !slide.heading)) throw new Error("Each imported slide must start with a heading.");

  const sourceId = `markdown-${hash(markdown)}`;
  const title = frontMatter.title ?? options.title ?? parsedSlides[0].heading ?? "Imported presentation";
  const author = frontMatter.author ?? options.author ?? "Unknown author";
  const language = frontMatter.language ?? options.language ?? "ja";
  const uniqueIds = new Set<string>();
  const nextId = (prefix: string, label: string, index: number) => {
    const base = `${prefix}_${slug(label) || "section"}`;
    let id = base;
    let suffix = index + 1;
    while (uniqueIds.has(id)) id = `${base}_${suffix++}`;
    uniqueIds.add(id);
    return id;
  };

  const slides = parsedSlides.map((parsed, index) => ({
    id: nextId("slide", parsed.heading!, index),
    layout: parsed.bullets.length ? "content" as const : "minimal" as const,
    title: parsed.heading,
    body: parsed.paragraphs.length ? parsed.paragraphs.join("\n\n") : undefined,
    bullets: parsed.bullets.length ? parsed.bullets : undefined
  }));
  const cues = parsedSlides.map((parsed, index) => {
    const directive = parsed.directive;
    const speaker = directive.speaker && characters.some((character) => character.id === directive.speaker) ? directive.speaker : "presenter";
    return {
      id: nextId("cue", slides[index].id, index),
      kind: "talk" as const,
      speaker,
      text: parsed.paragraphs[0] ?? parsed.bullets[0] ?? parsed.heading!,
      note: directive.note,
      slideRef: slides[index].id,
      presentation: directive.profile ? { profile: directive.profile } : undefined,
      direction: { intent: directive.intent ?? "neutral", intensity: "low" as const },
      after: { mode: "wait_for_presenter" as const }
    };
  });

  return {
    presentation: {
      schemaVersion: 1,
      presentation: { id: sourceId, title, author: { name: author }, language, sourceUrl: "markdown:import" },
      slides,
      cues,
      characters: structuredClone(characters),
      assets: [],
      directionPresets: [],
      settings: { defaultProfile: "classic_slide", defaultLayers: ["slide"], fallbackProfile: "classic_slide", mode: "manual", aspectRatio: "16:9", subtitle: { enabled: true, maxLines: 3 } }
    },
    warnings: []
  };
}

function splitFrontMatter(markdown: string): { frontMatter: Record<string, string>; content: string } {
  const match = markdown.match(/^\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) return { frontMatter: {}, content: markdown };
  const frontMatter = Object.fromEntries(match[1].split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(":");
    if (separator < 1) return [];
    return [[line.slice(0, separator).trim(), unquote(line.slice(separator + 1).trim())]];
  }));
  return { frontMatter, content: markdown.slice(match[0].length) };
}

function parseSlide(section: string): { heading?: string; paragraphs: string[]; bullets: string[]; directive: CueDirective } {
  const directive = parseDirective(section);
  const lines = section.replace(/<!--\s*presenta:\s*[\s\S]*?-->/g, "").split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => /^#{1,6}\s+\S/.test(line));
  if (headingIndex < 0) return { paragraphs: [], bullets: [], directive };
  const heading = lines[headingIndex].replace(/^#{1,6}\s+/, "").trim();
  const content = lines.slice(headingIndex + 1).map((line) => line.trim()).filter(Boolean);
  const bullets = content.filter((line) => /^[-*+]\s+/.test(line)).map((line) => line.replace(/^[-*+]\s+/, ""));
  const paragraphs = content.filter((line) => !/^[-*+]\s+/.test(line));
  return { heading, paragraphs, bullets, directive };
}

function parseDirective(source: string): CueDirective {
  const directive = source.match(/<!--\s*presenta:\s*([\s\S]*?)-->/i)?.[1];
  if (!directive) return {};
  const result: CueDirective = {};
  for (const match of directive.matchAll(/(speaker|note|intent|profile)=((?:"[^"]*")|(?:'[^']*')|[^\s]+)/g)) {
    const key = match[1] as keyof CueDirective;
    result[key] = unquote(match[2]);
  }
  return result;
}

function unquote(value: string): string {
  return value.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
}

function slug(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(36);
}
