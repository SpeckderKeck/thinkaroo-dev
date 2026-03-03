const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const HOST = '0.0.0.0';
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LEGACY_DATA_FILE = path.join(DATA_DIR, 'custom-datasets.json');
const DATASET_STORE_DIR = path.join(DATA_DIR, 'custom-datasets-store');
const SINGLECHOICE_ANSWERS_FILE = path.join(DATA_DIR, 'singlechoice-answers.json');
const MANIFEST_VERSION = 2;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

function sendJson(res, status, payload) {
  setCorsHeaders(res);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function normalizeIsoTimestamp(value, fallbackIso) {
  const parsed = new Date(value ?? '');
  if (Number.isNaN(parsed.getTime())) return fallbackIso;
  return parsed.toISOString();
}

function toDatasetFilePath(datasetId) {
  return path.join(DATASET_STORE_DIR, `${encodeURIComponent(datasetId)}.json`);
}

function normalizeDataset(rawDataset) {
  if (!rawDataset || typeof rawDataset !== 'object') {
    return null;
  }

  const id = String(rawDataset.id ?? rawDataset.datasetId ?? rawDataset.key ?? '').trim();
  if (!id) {
    return null;
  }

  const label = String(rawDataset.label ?? '').trim() || id;
  const cards = Array.isArray(rawDataset.cards) ? rawDataset.cards : [];
  if (cards.length === 0) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const createdAt = normalizeIsoTimestamp(rawDataset.createdAt, nowIso);
  const updatedAt = normalizeIsoTimestamp(rawDataset.updatedAt, createdAt);
  const version = Number.isInteger(rawDataset.version) && rawDataset.version > 0 ? rawDataset.version : 1;

  return {
    id,
    label,
    cards,
    createdAt,
    updatedAt,
    version,
  };
}

async function ensureStorageInitialized() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(DATASET_STORE_DIR, { recursive: true });

  try {
    await fs.access(SINGLECHOICE_ANSWERS_FILE);
  } catch {
    await fs.writeFile(SINGLECHOICE_ANSWERS_FILE, '{}\n', 'utf8');
  }

  try {
    await fs.access(LEGACY_DATA_FILE);
  } catch {
    const emptyManifest = { schemaVersion: MANIFEST_VERSION, datasets: [] };
    await fs.writeFile(LEGACY_DATA_FILE, `${JSON.stringify(emptyManifest, null, 2)}\n`, 'utf8');
    return;
  }

  const raw = await fs.readFile(LEGACY_DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw || '[]');

  if (!Array.isArray(parsed)) {
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.datasets)) {
      const emptyManifest = { schemaVersion: MANIFEST_VERSION, datasets: [] };
      await fs.writeFile(LEGACY_DATA_FILE, `${JSON.stringify(emptyManifest, null, 2)}\n`, 'utf8');
    }
    return;
  }

  const datasets = parsed.map((entry) => normalizeDataset(entry)).filter(Boolean);
  const manifestEntries = [];
  for (const dataset of datasets) {
    const datasetFile = toDatasetFilePath(dataset.id);
    await fs.writeFile(datasetFile, `${JSON.stringify(dataset.cards, null, 2)}\n`, 'utf8');
    manifestEntries.push({
      id: dataset.id,
      label: dataset.label,
      createdAt: dataset.createdAt,
      updatedAt: dataset.updatedAt,
      version: dataset.version,
    });
  }

  const manifest = {
    schemaVersion: MANIFEST_VERSION,
    datasets: manifestEntries,
  };
  await fs.writeFile(LEGACY_DATA_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function readManifest() {
  await ensureStorageInitialized();
  const raw = await fs.readFile(LEGACY_DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw || '{}');

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.datasets)) {
    return { schemaVersion: MANIFEST_VERSION, datasets: [] };
  }

  return {
    schemaVersion: Number.isInteger(parsed.schemaVersion) ? parsed.schemaVersion : MANIFEST_VERSION,
    datasets: parsed.datasets
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const id = String(entry.id ?? '').trim();
        if (!id) return null;
        const label = String(entry.label ?? '').trim() || id;
        const nowIso = new Date().toISOString();
        const createdAt = normalizeIsoTimestamp(entry.createdAt, nowIso);
        const updatedAt = normalizeIsoTimestamp(entry.updatedAt, createdAt);
        const version = Number.isInteger(entry.version) && entry.version > 0 ? entry.version : 1;
        return { id, label, createdAt, updatedAt, version };
      })
      .filter(Boolean),
  };
}

async function writeManifest(manifest) {
  const normalizedManifest = {
    schemaVersion: MANIFEST_VERSION,
    datasets: [...manifest.datasets].sort((a, b) => String(a.label).localeCompare(String(b.label), 'de')),
  };
  await fs.writeFile(LEGACY_DATA_FILE, `${JSON.stringify(normalizedManifest, null, 2)}\n`, 'utf8');
}

async function readDatasetCards(datasetId) {
  const datasetPath = toDatasetFilePath(datasetId);
  const raw = await fs.readFile(datasetPath, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  return Array.isArray(parsed) ? parsed : [];
}

async function writeDatasetCards(datasetId, cards) {
  const datasetPath = toDatasetFilePath(datasetId);
  await fs.writeFile(datasetPath, `${JSON.stringify(cards, null, 2)}\n`, 'utf8');
}

async function readBodyJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  if (!body) return {};
  return JSON.parse(body);
}

function checkOptimisticConcurrency(current, payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const hasVersionCheck = Number.isInteger(payload.expectedVersion);
  const hasUpdatedAtCheck = typeof payload.expectedUpdatedAt === 'string';

  if (!hasVersionCheck && !hasUpdatedAtCheck) {
    return false;
  }

  if (hasVersionCheck && payload.expectedVersion !== current.version) {
    return true;
  }

  if (hasUpdatedAtCheck && String(payload.expectedUpdatedAt) !== String(current.updatedAt)) {
    return true;
  }

  return false;
}

async function listDatasets() {
  const manifest = await readManifest();
  const datasets = [];

  for (const entry of manifest.datasets) {
    try {
      const cards = await readDatasetCards(entry.id);
      datasets.push({ ...entry, cards });
    } catch {
      // Skip broken entry files gracefully.
    }
  }

  return datasets;
}


async function readSinglechoiceAnswers() {
  await ensureStorageInitialized();
  const raw = await fs.readFile(SINGLECHOICE_ANSWERS_FILE, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  return parsed && typeof parsed === 'object' ? parsed : {};
}

async function writeSinglechoiceAnswers(entries) {
  await fs.writeFile(SINGLECHOICE_ANSWERS_FILE, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function handleDatasetsApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const listPathMatch = url.pathname === '/datasets';
  const itemPathMatch = url.pathname.match(/^\/datasets\/([^/]+)$/);
  const datasetIdFromPath = itemPathMatch ? decodeURIComponent(itemPathMatch[1]) : '';

  if (req.method === 'GET' && listPathMatch) {
    const datasets = await listDatasets();
    return sendJson(res, 200, datasets);
  }

  if (req.method === 'POST' && listPathMatch) {
    let payload;
    try {
      payload = await readBodyJson(req);
    } catch {
      return sendJson(res, 400, { error: 'invalid_json' });
    }

    const dataset = normalizeDataset(payload);
    if (!dataset) {
      return sendJson(res, 400, { error: 'invalid_payload' });
    }

    const manifest = await readManifest();
    if (manifest.datasets.some((entry) => entry.id === dataset.id)) {
      return sendJson(res, 409, { error: 'already_exists' });
    }

    const nowIso = new Date().toISOString();
    dataset.createdAt = nowIso;
    dataset.updatedAt = nowIso;
    dataset.version = 1;

    await writeDatasetCards(dataset.id, dataset.cards);
    manifest.datasets.push({
      id: dataset.id,
      label: dataset.label,
      createdAt: dataset.createdAt,
      updatedAt: dataset.updatedAt,
      version: dataset.version,
    });
    await writeManifest(manifest);

    return sendJson(res, 201, dataset);
  }

  if (req.method === 'PATCH' && itemPathMatch) {
    let payload;
    try {
      payload = await readBodyJson(req);
    } catch {
      return sendJson(res, 400, { error: 'invalid_json' });
    }

    const manifest = await readManifest();
    const datasetIndex = manifest.datasets.findIndex((entry) => entry.id === datasetIdFromPath);
    if (datasetIndex < 0) {
      return sendJson(res, 404, { error: 'not_found' });
    }

    const currentEntry = manifest.datasets[datasetIndex];
    const currentCards = await readDatasetCards(currentEntry.id);
    const currentDataset = { ...currentEntry, cards: currentCards };

    if (checkOptimisticConcurrency(currentDataset, payload)) {
      return sendJson(res, 409, { error: 'conflict', current: currentDataset });
    }

    const nextLabel = String(payload.label ?? currentEntry.label).trim() || currentEntry.id;
    const nextCards = Array.isArray(payload.cards) ? payload.cards : currentCards;
    if (!Array.isArray(nextCards) || nextCards.length === 0) {
      return sendJson(res, 400, { error: 'invalid_payload' });
    }

    const updatedAt = new Date().toISOString();
    const version = currentEntry.version + 1;

    await writeDatasetCards(currentEntry.id, nextCards);
    manifest.datasets[datasetIndex] = {
      ...currentEntry,
      label: nextLabel,
      updatedAt,
      version,
    };
    await writeManifest(manifest);

    return sendJson(res, 200, {
      id: currentEntry.id,
      label: nextLabel,
      cards: nextCards,
      createdAt: currentEntry.createdAt,
      updatedAt,
      version,
    });
  }

  if (req.method === 'DELETE' && itemPathMatch) {
    let payload = {};
    try {
      payload = await readBodyJson(req);
    } catch {
      return sendJson(res, 400, { error: 'invalid_json' });
    }

    const manifest = await readManifest();
    const datasetIndex = manifest.datasets.findIndex((entry) => entry.id === datasetIdFromPath);
    if (datasetIndex < 0) {
      return sendJson(res, 404, { error: 'not_found' });
    }

    const currentEntry = manifest.datasets[datasetIndex];
    const currentCards = await readDatasetCards(currentEntry.id);
    const currentDataset = { ...currentEntry, cards: currentCards };

    if (checkOptimisticConcurrency(currentDataset, payload)) {
      return sendJson(res, 409, { error: 'conflict', current: currentDataset });
    }

    manifest.datasets.splice(datasetIndex, 1);
    await writeManifest(manifest);
    await fs.rm(toDatasetFilePath(currentEntry.id), { force: true });
    return sendJson(res, 200, { ok: true, id: currentEntry.id });
  }

  return sendJson(res, 405, { error: 'method_not_allowed' });
}



function buildSinglechoiceOptions(questionId, card) {
  const answerCandidates = [card?.answer, ...(Array.isArray(card?.taboo) ? card.taboo.slice(1, 4) : [])]
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
    .slice(0, 4);
  const correctAnswer = String(card?.answer ?? '').trim();
  if (answerCandidates.length !== 4 || !correctAnswer) {
    return [];
  }

  return answerCandidates.map((text, index) => ({
    id: `${questionId}-${index + 1}`,
    text,
    isCorrect: text === correctAnswer,
  }));
}

async function loadSinglechoiceOptionsByQuestionId(questionId) {
  const [datasetId = '', rawCardIndex = ''] = String(questionId).split(':');
  const cardIndex = Number.parseInt(rawCardIndex, 10) - 1;
  if (!datasetId || !Number.isInteger(cardIndex) || cardIndex < 0) {
    return [];
  }

  try {
    const cards = await readDatasetCards(datasetId);
    const card = cards[cardIndex];
    if (!card || card.category !== 'Singlechoice') return [];
    return buildSinglechoiceOptions(questionId, card);
  } catch {
    return [];
  }
}

async function handleSinglechoiceAnswersApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return true;
  }

  const itemPathMatch = url.pathname.match(/^\/singlechoice-answers\/([^/]+)$/);
  const questionIdFromPath = itemPathMatch ? decodeURIComponent(itemPathMatch[1]) : '';

  if (req.method === 'GET' && questionIdFromPath) {
    const answers = await readSinglechoiceAnswers();
    const stored = answers[questionIdFromPath];
    const answerId = typeof stored === 'string' ? stored : typeof stored?.answerId === 'string' ? stored.answerId : null;
    const isCorrect = typeof stored?.isCorrect === 'boolean' ? stored.isCorrect : null;
    sendJson(res, 200, { questionId: questionIdFromPath, answerId, isCorrect });
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/singlechoice-answers') {
    let payload;
    try {
      payload = await readBodyJson(req);
    } catch {
      sendJson(res, 400, { error: 'invalid_json' });
      return true;
    }

    const questionId = String(payload?.questionId ?? '').trim();
    const answerId = String(payload?.answerId ?? '').trim();
    if (!questionId || !answerId) {
      sendJson(res, 400, { error: 'invalid_payload' });
      return true;
    }

    const isCorrect = Boolean(payload?.isCorrect);
    const answers = await readSinglechoiceAnswers();
    answers[questionId] = { answerId, isCorrect };
    await writeSinglechoiceAnswers(answers);
    sendJson(res, 200, { ok: true, questionId, answerId, isCorrect });
    return true;
  }

  return false;
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const requestPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filePath = path.join(ROOT_DIR, requestPath);
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(ROOT_DIR)) {
    setCorsHeaders(res);
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(normalizedPath);
    if (stat.isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await fs.readFile(normalizedPath);
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  } catch {
    setCorsHeaders(res);
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/datasets' || /^\/datasets\/[^/]+$/.test(url.pathname)) {
      await handleDatasetsApi(req, res, url);
      return;
    }

    if (url.pathname === '/singlechoice-answers' || /^\/singlechoice-answers\/[^/]+$/.test(url.pathname)) {
      const handled = await handleSinglechoiceAnswersApi(req, res, url);
      if (handled) {
        return;
      }
    }

    const singlechoiceOptionsMatch = url.pathname.match(/^\/singlechoice-options\/([^/]+)$/);
    if (req.method === 'GET' && singlechoiceOptionsMatch) {
      const questionId = decodeURIComponent(singlechoiceOptionsMatch[1]);
      const options = await loadSinglechoiceOptionsByQuestionId(questionId);
      if (options.length !== 4) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      sendJson(res, 200, { questionId, options });
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'server_error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Wissivity server running at http://${HOST}:${PORT}`);
});
