const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const db = new Database(path.join(__dirname, 'localized-images.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS texts (
    id   TEXT PRIMARY KEY,
    key  TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS images (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    figma_url   TEXT NOT NULL DEFAULT '',
    template    TEXT,
    text_values TEXT NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL DEFAULT 'draft',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
`);

// ── ID generation ────────────────────────────────────────────────────────────

function nextId(table, prefix) {
  const row = db.prepare(`SELECT id FROM ${table} ORDER BY id DESC LIMIT 1`).get();
  if (!row) return `${prefix}-0001`;
  const n = parseInt(row.id.split('-')[1], 10) + 1;
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

// ── Texts ────────────────────────────────────────────────────────────────────

app.get('/api/texts', (_req, res) => {
  res.json(db.prepare('SELECT * FROM texts ORDER BY created_at ASC').all()
    .map(r => ({ id: r.id, key: r.key, value: r.value, createdAt: r.created_at })));
});

app.post('/api/texts', (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) return res.status(400).json({ error: 'key and value required' });
  const id = nextId('texts', 'TXT');
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO texts (id, key, value, created_at) VALUES (?, ?, ?, ?)').run(id, key, value, createdAt);
  res.json({ id, key, value, createdAt });
});

app.put('/api/texts/:id', (req, res) => {
  const { key, value } = req.body;
  const info = db.prepare('UPDATE texts SET key = ?, value = ? WHERE id = ?').run(key, value, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  const r = db.prepare('SELECT * FROM texts WHERE id = ?').get(req.params.id);
  res.json({ id: r.id, key: r.key, value: r.value, createdAt: r.created_at });
});

app.delete('/api/texts/:id', (req, res) => {
  db.prepare('DELETE FROM texts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Images ───────────────────────────────────────────────────────────────────

function rowToImage(r) {
  return {
    id: r.id,
    name: r.name,
    figmaUrl: r.figma_url,
    template: r.template ? JSON.parse(r.template) : null,
    textValues: JSON.parse(r.text_values),
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

app.get('/api/images', (_req, res) => {
  res.json(db.prepare('SELECT * FROM images ORDER BY created_at ASC').all().map(rowToImage));
});

app.post('/api/images', (req, res) => {
  const { name, figmaUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = nextId('images', 'IMG');
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO images (id, name, figma_url, template, text_values, status, created_at, updated_at)
              VALUES (?, ?, ?, NULL, '[]', 'draft', ?, ?)`).run(id, name, figmaUrl || '', now, now);
  res.json(rowToImage(db.prepare('SELECT * FROM images WHERE id = ?').get(id)));
});

app.put('/api/images/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  const { name, figmaUrl, template, textValues, status } = req.body;
  const now = new Date().toISOString();
  db.prepare(`UPDATE images SET
    name = ?, figma_url = ?, template = ?, text_values = ?, status = ?, updated_at = ?
    WHERE id = ?`).run(
    name        ?? cur.name,
    figmaUrl    ?? cur.figma_url,
    template    !== undefined ? JSON.stringify(template)    : cur.template,
    textValues  !== undefined ? JSON.stringify(textValues)  : cur.text_values,
    status      ?? cur.status,
    now,
    req.params.id,
  );
  res.json(rowToImage(db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id)));
});

app.delete('/api/images/:id', (req, res) => {
  db.prepare('DELETE FROM images WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Start ────────────────────────────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`));
