import type { CharacterId, Cue, CueKind, DirectionIntent } from "./types";

type ParsedLine = {
  sectionTitle: string;
  speaker: CharacterId;
  text: string;
  note?: string;
};

const speakerMap: Record<string, CharacterId> = {
  "愛璃": "mikoto",
  "airi": "mikoto",
  "Airi": "mikoto",
  "玲": "rei",
  "rei": "rei",
  "Rei": "rei",
  "美琴": "mikoto",
  "ミコト": "mikoto",
  "mikoto": "mikoto",
  "Mikoto": "mikoto"
};

export function parseMarkdownToCues(markdown: string): Cue[] {
  const parsedLines = parseSpeakerLines(markdown);
  return parsedLines.map((line, index) => {
    const intent = inferIntent(line.text);
    return {
      id: createCueId(line.sectionTitle, index),
      kind: toCueKind(intent),
      speaker: line.speaker,
      text: line.text,
      slideRef: line.sectionTitle,
      note: line.note ?? `${line.sectionTitle} / ${line.speaker}`,
      direction: {
        intent,
        emotion: inferEmotion(intent),
        intensity: inferIntensity(line.text)
      },
      after: {
        mode: "wait_for_presenter",
        durationMs: 8000
      }
    };
  });
}

function parseSpeakerLines(markdown: string): ParsedLine[] {
  const lines = markdown.split(/\r?\n/);
  let sectionTitle = "script";
  let pendingNote: string | undefined;
  const parsedLines: ParsedLine[] = [];

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      sectionTitle = heading[1].trim();
      pendingNote = undefined;
      return;
    }

    const note = line.match(/^(?:>\s*)?(?:note|メモ|補足)\s*[:：]\s*(.+)$/i);
    if (note) {
      pendingNote = note[1].trim();
      return;
    }

    const speakerLine = line.match(/^([^:：]{1,16})[:：]\s*(.+)$/);
    if (!speakerLine) {
      return;
    }

    const speaker = speakerMap[speakerLine[1].trim()];
    if (!speaker) {
      return;
    }

    parsedLines.push({
      sectionTitle,
      speaker,
      text: speakerLine[2].trim(),
      note: pendingNote
    });
    pendingNote = undefined;
  });

  return parsedLines;
}

function inferIntent(text: string): DirectionIntent {
  if (/まとめ|要約|summary/i.test(text)) {
    return "summary";
  }

  if (/[?？]/.test(text)) {
    return "question";
  }

  if (/[!！]/.test(text)) {
    return "emphasis";
  }

  return "neutral";
}

function inferEmotion(intent: DirectionIntent): string {
  switch (intent) {
    case "question":
      return "mild_doubt";
    case "emphasis":
      return "confident";
    case "summary":
      return "calm";
    default:
      return "neutral";
  }
}

function inferIntensity(text: string): Cue["direction"]["intensity"] {
  const strongMarks = (text.match(/[!！]/g) ?? []).length;
  if (strongMarks >= 2) {
    return "high";
  }

  if (strongMarks === 1 || /重要|大事|ポイント/.test(text)) {
    return "medium";
  }

  return "low";
}

function toCueKind(intent: DirectionIntent): CueKind {
  switch (intent) {
    case "question":
      return "question";
    case "summary":
      return "summary";
    default:
      return "talk";
  }
}

function createCueId(sectionTitle: string, index: number): string {
  const slug = sectionTitle
    .toLowerCase()
    .replace(/[^a-z0-9ぁ-んァ-ン一-龥]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  return `md_${slug || "script"}_${String(index + 1).padStart(2, "0")}`;
}
