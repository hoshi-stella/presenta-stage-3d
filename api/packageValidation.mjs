const lifecycleStates = new Set(["draft", "rehearsal", "presented", "published", "archived"]);

export function validateStoredPresentationPackage(value) {
  const errors = [];
  if (!isRecord(value)) return ["Package must be a JSON object."];
  if (value.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (!isRecord(value.presentation)) {
    errors.push("presentation metadata is required.");
  } else {
    if (!isNonEmptyString(value.presentation.id)) errors.push("presentation.id is required.");
    if (!isNonEmptyString(value.presentation.title)) errors.push("presentation.title is required.");
  }
  if (!Array.isArray(value.slides)) errors.push("slides must be an array.");
  if (!Array.isArray(value.cues)) errors.push("cues must be an array.");
  if (!Array.isArray(value.characters)) errors.push("characters must be an array.");
  if (!Array.isArray(value.assets)) errors.push("assets must be an array.");
  if (!Array.isArray(value.directionPresets)) errors.push("directionPresets must be an array.");
  if (!isRecord(value.settings)) errors.push("settings is required.");

  if (Array.isArray(value.slides)) {
    appendDuplicateIdErrors(errors, value.slides, "slide");
  }
  if (Array.isArray(value.cues)) {
    appendDuplicateIdErrors(errors, value.cues, "cue");
    const slideIds = new Set(Array.isArray(value.slides) ? value.slides.map((slide) => slide?.id) : []);
    const characterIds = new Set(Array.isArray(value.characters) ? value.characters.map((character) => character?.id) : []);
    value.cues.forEach((cue, index) => {
      if (!isRecord(cue) || !isNonEmptyString(cue.id)) return;
      if (isNonEmptyString(cue.slideRef) && !slideIds.has(cue.slideRef)) errors.push(`cues[${index}].slideRef does not reference a known slide.`);
      if (!characterIds.has(cue.speaker)) errors.push(`cues[${index}].speaker does not reference a known character.`);
    });
  }
  if (isRecord(value.publication) && value.publication.lifecycle !== undefined && !lifecycleStates.has(value.publication.lifecycle)) {
    errors.push("publication.lifecycle is not supported.");
  }
  return errors;
}

function appendDuplicateIdErrors(errors, records, name) {
  const ids = new Set();
  records.forEach((record, index) => {
    if (!isRecord(record) || !isNonEmptyString(record.id)) {
      errors.push(`${name}s[${index}].id is required.`);
      return;
    }
    if (ids.has(record.id)) errors.push(`Duplicate ${name} id: ${record.id}.`);
    ids.add(record.id);
  });
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
