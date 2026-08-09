import { randomUUID } from "node:crypto";
import express from "express";
import mysql from "mysql2/promise";
import { validateStoredPresentationPackage } from "./packageValidation.mjs";

const port = Number(process.env.PRESENTA_API_PORT ?? 8787);
const pool = mysql.createPool({
  host: process.env.PRESENTA_DB_HOST ?? "127.0.0.1",
  port: Number(process.env.PRESENTA_DB_PORT ?? 3306),
  database: process.env.PRESENTA_DB_NAME ?? "presenta_stage_3d",
  user: process.env.PRESENTA_DB_USER ?? "presenta",
  password: process.env.PRESENTA_DB_PASSWORD ?? "presenta-local-password",
  waitForConnections: true,
  connectionLimit: 5
});
const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/health", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/presentations", async (_request, response, next) => {
  try {
    const [rows] = await pool.query(`SELECT p.presentation_key AS presentationKey, p.title, p.lifecycle, p.updated_at AS updatedAt,
      latest.revision_number AS revisionNumber, latest.snapshot_name AS snapshotName, latest.created_at AS revisionCreatedAt
      FROM presentations p
      LEFT JOIN presentation_revisions latest ON latest.presentation_id = p.id
        AND latest.revision_number = (SELECT MAX(candidate.revision_number) FROM presentation_revisions candidate WHERE candidate.presentation_id = p.id)
      ORDER BY p.updated_at DESC, p.presentation_key ASC`);
    response.json({ presentations: rows });
  } catch (error) {
    next(error);
  }
});

app.get("/api/presentations/:presentationKey", async (request, response, next) => {
  try {
    const revisionNumber = optionalRevisionNumber(request.query.revision);
    if (request.query.revision !== undefined && revisionNumber === null) {
      response.status(400).json({ error: "revision must be a positive integer." });
      return;
    }
    const [rows] = await pool.query(`SELECT p.presentation_key AS presentationKey, p.title, p.lifecycle,
      r.id AS revisionId, r.revision_number AS revisionNumber, r.snapshot_name AS snapshotName, r.snapshot_note AS snapshotNote,
      r.package_json AS packageJson, r.created_at AS createdAt
      FROM presentations p JOIN presentation_revisions r ON r.presentation_id = p.id
      WHERE p.presentation_key = ? ${revisionNumber === null ? "" : "AND r.revision_number = ?"}
      ORDER BY r.revision_number DESC LIMIT 1`, revisionNumber === null ? [request.params.presentationKey] : [request.params.presentationKey, revisionNumber]);
    const row = rows[0];
    if (!row) {
      response.status(404).json({ error: "Presentation was not found." });
      return;
    }
    response.json({ presentation: parseJson(row.packageJson), revision: revisionResponse(row), lifecycle: row.lifecycle });
  } catch (error) {
    next(error);
  }
});

app.put("/api/presentations/:presentationKey", async (request, response, next) => {
  const presentation = request.body?.presentation;
  const validationErrors = validateStoredPresentationPackage(presentation);
  if (validationErrors.length > 0) {
    response.status(422).json({ error: "Presentation Package validation failed.", validationErrors });
    return;
  }
  if (presentation.presentation.id !== request.params.presentationKey) {
    response.status(400).json({ error: "URL presentation key must match presentation.id." });
    return;
  }
  const snapshot = normalizeSnapshot(request.body?.snapshot);
  if (snapshot.error) {
    response.status(400).json({ error: snapshot.error });
    return;
  }
  const lifecycle = presentation.publication?.lifecycle ?? "draft";
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existingRows] = await connection.query("SELECT id FROM presentations WHERE presentation_key = ? FOR UPDATE", [request.params.presentationKey]);
    const presentationId = existingRows[0]?.id ?? randomUUID();
    if (existingRows.length === 0) {
      await connection.query("INSERT INTO presentations (id, presentation_key, title, lifecycle) VALUES (?, ?, ?, ?)", [presentationId, request.params.presentationKey, presentation.presentation.title, lifecycle]);
    } else {
      await connection.query("UPDATE presentations SET title = ?, lifecycle = ? WHERE id = ?", [presentation.presentation.title, lifecycle, presentationId]);
    }
    const [revisionRows] = await connection.query("SELECT COALESCE(MAX(revision_number), 0) AS revisionNumber FROM presentation_revisions WHERE presentation_id = ? FOR UPDATE", [presentationId]);
    const revisionId = randomUUID();
    const revisionNumber = Number(revisionRows[0].revisionNumber) + 1;
    await connection.query("INSERT INTO presentation_revisions (id, presentation_id, revision_number, snapshot_name, snapshot_note, package_json) VALUES (?, ?, ?, ?, ?, ?)", [revisionId, presentationId, revisionNumber, snapshot.name, snapshot.note, JSON.stringify(presentation)]);
    if (lifecycle === "presented" || lifecycle === "published") {
      const revisionColumn = lifecycle === "presented" ? "presented_revision_id" : "published_revision_id";
      await connection.query(`UPDATE presentations SET ${revisionColumn} = ? WHERE id = ?`, [revisionId, presentationId]);
      await connection.query("INSERT INTO presentation_publication_events (id, presentation_id, revision_id, event_type) VALUES (?, ?, ?, ?)", [randomUUID(), presentationId, revisionId, lifecycle]);
    }
    await connection.commit();
    response.status(201).json({ presentationKey: request.params.presentationKey, lifecycle, revision: { id: revisionId, number: revisionNumber, snapshotName: snapshot.name, snapshotNote: snapshot.note } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "The local presentation API could not complete the request." });
});

app.listen(port, () => console.log(`Presenta Studio API listening on ${port}`));

function optionalRevisionNumber(value) {
  if (value === undefined) return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function normalizeSnapshot(value) {
  if (value === undefined || value === null) return { name: null, note: null };
  if (typeof value !== "object" || Array.isArray(value)) return { error: "snapshot must be an object." };
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const note = typeof value.note === "string" ? value.note.trim() : "";
  if (name.length > 255) return { error: "snapshot.name must be 255 characters or fewer." };
  return { name: name || null, note: note || null };
}

function parseJson(value) {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function revisionResponse(row) {
  return { id: row.revisionId, number: row.revisionNumber, snapshotName: row.snapshotName, snapshotNote: row.snapshotNote, createdAt: row.createdAt };
}
