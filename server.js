const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const HOST = '0.0.0.0';
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LEGACY_DATA_FILE = path.join(DATA_DIR, 'custom-datasets.json');
const DATASET_STORE_DIR = path.join(DATA_DIR, 'custom-datasets-store');
const CSV_STORE_DIR = path.join(DATA_DIR, 'csv-store');
const MANIFEST_VERSION = 3;
const CSV_MAX_SIZE_BYTES = 1024 * 1024;
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const ADMIN_USER_IDS = new Set(
  String(process.env.DATASET_ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);
const LEGACY_DATASET_OWNER_ID = String(process.env.LEGACY_DATASET_OWNER_ID || '').trim();

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
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
    ownerId: '',
    createdAt,
    updatedAt,
    version,
  };
}

function normalizeOwnerId(value) {
  const ownerId = String(value ?? '').trim();
  return ownerId || '';
}

function isAdminUser(userId) {
  return ADMIN_USER_IDS.has(String(userId || ''));
}

async function validateSupabaseToken(token) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('missing_supabase_server_auth_config');
  }

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`supabase_auth_error_${response.status}`);
  }

  const user = await response.json();
  if (!user || typeof user !== 'object' || !String(user.id || '').trim()) {
    return null;
  }

  return {
    id: String(user.id),
    email: String(user.email || ''),
    role: String(user.role || ''),
  };
}

async function authenticateApiRequest(req, res) {
  const authHeader = String(req.headers.authorization || '').trim();
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? String(match[1] || '').trim() : '';

  if (!token) {
    sendJson(res, 401, { error: 'unauthorized' });
    return null;
  }

  try {
    const user = await validateSupabaseToken(token);
    if (!user) {
      sendJson(res, 401, { error: 'unauthorized' });
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth validation failed:', error);
    sendJson(res, 500, { error: 'auth_unavailable' });
    return null;
  }
}

async function ensureStorageInitialized() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(DATASET_STORE_DIR, { recursive: true });
  await fs.mkdir(CSV_STORE_DIR, { recursive: true });


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

function sanitizeCsvFileName(name) {
  const raw = String(name ?? '').trim();
  const sanitized = raw
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');

  if (!sanitized) {
    return '';
  }

  return sanitized.toLowerCase().endsWith('.csv') ? sanitized : `${sanitized}.csv`;
}

function toCsvFilePath(fileName) {
  return path.join(CSV_STORE_DIR, fileName);
}

async function listStoredCsvFiles() {
  await ensureStorageInitialized();
  const entries = await fs.readdir(CSV_STORE_DIR, { withFileTypes: true });
  const csvFiles = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith('.csv')) continue;
    const stat = await fs.stat(toCsvFilePath(entry.name));
    csvFiles.push({
      name: entry.name,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    });
  }

  return csvFiles.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function handleCsvFilesApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  await ensureStorageInitialized();

  const listPathMatch = url.pathname === '/csv-files';
  const itemPathMatch = url.pathname.match(/^\/csv-files\/([^/]+)$/);
  const fileNameFromPath = itemPathMatch ? decodeURIComponent(itemPathMatch[1]) : '';

  if (req.method === 'GET' && listPathMatch) {
    const files = await listStoredCsvFiles();
    return sendJson(res, 200, files);
  }

  if (req.method === 'GET' && itemPathMatch) {
    const safeName = sanitizeCsvFileName(fileNameFromPath);
    if (!safeName || safeName !== fileNameFromPath) {
      return sendJson(res, 400, { error: 'invalid_filename' });
    }

    const csvPath = toCsvFilePath(safeName);
    try {
      const content = await fs.readFile(csvPath, 'utf8');
      setCorsHeaders(res);
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(content);
      return;
    } catch {
      return sendJson(res, 404, { error: 'not_found' });
    }
  }

  if (req.method === 'POST' && listPathMatch) {
    let payload;
    try {
      payload = await readBodyJson(req);
    } catch {
      return sendJson(res, 400, { error: 'invalid_json' });
    }

    const safeName = sanitizeCsvFileName(payload?.name);
    const content = String(payload?.content ?? '');

    if (!safeName) {
      return sendJson(res, 400, { error: 'invalid_filename' });
    }
    if (!content.trim()) {
      return sendJson(res, 400, { error: 'empty_content' });
    }

    const byteSize = Buffer.byteLength(content, 'utf8');
    if (byteSize > CSV_MAX_SIZE_BYTES) {
      return sendJson(res, 413, { error: 'file_too_large', maxSizeBytes: CSV_MAX_SIZE_BYTES });
    }

    await fs.writeFile(toCsvFilePath(safeName), content, 'utf8');
    const stat = await fs.stat(toCsvFilePath(safeName));
    return sendJson(res, 201, {
      name: safeName,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    });
  }

  return sendJson(res, 405, { error: 'method_not_allowed' });
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
        const ownerId = normalizeOwnerId(entry.ownerId);
        return { id, label, ownerId, createdAt, updatedAt, version };
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

async function migrateLegacyOwnerIds(manifest) {
  if (!LEGACY_DATASET_OWNER_ID) {
    return manifest;
  }

  let changed = false;
  const datasets = manifest.datasets.map((entry) => {
    if (entry.ownerId) {
      return entry;
    }
    changed = true;
    return {
      ...entry,
      ownerId: LEGACY_DATASET_OWNER_ID,
    };
  });

  if (!changed) {
    return manifest;
  }

  const nextManifest = {
    ...manifest,
    datasets,
  };
  await writeManifest(nextManifest);
  return nextManifest;
}

async function readDatasetRecord(datasetId, fallbackOwnerId = '') {
  const datasetPath = toDatasetFilePath(datasetId);
  const raw = await fs.readFile(datasetPath, 'utf8');
  const parsed = JSON.parse(raw || '[]');

  if (Array.isArray(parsed)) {
    return { ownerId: normalizeOwnerId(fallbackOwnerId), cards: parsed };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ownerId: normalizeOwnerId(fallbackOwnerId), cards: [] };
  }

  return {
    ownerId: normalizeOwnerId(parsed.ownerId || fallbackOwnerId),
    cards: Array.isArray(parsed.cards) ? parsed.cards : [],
  };
}

async function writeDatasetRecord(datasetId, ownerId, cards) {
  const datasetPath = toDatasetFilePath(datasetId);
  await fs.writeFile(
    datasetPath,
    `${JSON.stringify({ ownerId: normalizeOwnerId(ownerId), cards }, null, 2)}\n`,
    'utf8',
  );
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

async function listDatasets(authUser, includeGlobal = false) {
  let manifest = await readManifest();
  manifest = await migrateLegacyOwnerIds(manifest);
  const datasets = [];
  const canSeeGlobal = includeGlobal && isAdminUser(authUser.id);

  for (const entry of manifest.datasets) {
    try {
      if (entry.ownerId !== authUser.id && !(canSeeGlobal && !entry.ownerId)) {
        continue;
      }
      const record = await readDatasetRecord(entry.id, entry.ownerId);
      const ownerId = record.ownerId || entry.ownerId;
      if (ownerId !== authUser.id && !(canSeeGlobal && !ownerId)) {
        continue;
      }
      datasets.push({ ...entry, ownerId, cards: record.cards });
    } catch {
      // Skip broken entry files gracefully.
    }
  }

  return datasets;
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
  const authUser = await authenticateApiRequest(req, res);
  if (!authUser) {
    return;
  }
  const isAdmin = isAdminUser(authUser.id);

  if (req.method === 'GET' && listPathMatch) {
    const includeGlobal = String(url.searchParams.get('includeGlobal') || '').toLowerCase() === 'true';
    const datasets = await listDatasets(authUser, includeGlobal);
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
    dataset.ownerId = authUser.id;

    await writeDatasetRecord(dataset.id, dataset.ownerId, dataset.cards);
    manifest.datasets.push({
      id: dataset.id,
      label: dataset.label,
      ownerId: dataset.ownerId,
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

    let manifest = await readManifest();
    manifest = await migrateLegacyOwnerIds(manifest);
    const datasetIndex = manifest.datasets.findIndex((entry) => entry.id === datasetIdFromPath);
    if (datasetIndex < 0) {
      return sendJson(res, 404, { error: 'not_found' });
    }

    const currentEntry = manifest.datasets[datasetIndex];
    const currentRecord = await readDatasetRecord(currentEntry.id, currentEntry.ownerId);
    const effectiveOwnerId = normalizeOwnerId(currentRecord.ownerId || currentEntry.ownerId);
    if (effectiveOwnerId !== authUser.id && !isAdmin) {
      return sendJson(res, 403, { error: 'forbidden' });
    }

    const currentDataset = { ...currentEntry, ownerId: effectiveOwnerId, cards: currentRecord.cards };

    if (checkOptimisticConcurrency(currentDataset, payload)) {
      return sendJson(res, 409, { error: 'conflict', current: currentDataset });
    }

    const nextLabel = String(payload.label ?? currentEntry.label).trim() || currentEntry.id;
    const nextCards = Array.isArray(payload.cards) ? payload.cards : currentRecord.cards;
    if (!Array.isArray(nextCards) || nextCards.length === 0) {
      return sendJson(res, 400, { error: 'invalid_payload' });
    }

    const updatedAt = new Date().toISOString();
    const version = currentEntry.version + 1;

    await writeDatasetRecord(currentEntry.id, effectiveOwnerId, nextCards);
    manifest.datasets[datasetIndex] = {
      ...currentEntry,
      ownerId: effectiveOwnerId,
      label: nextLabel,
      updatedAt,
      version,
    };
    await writeManifest(manifest);

    return sendJson(res, 200, {
      id: currentEntry.id,
      label: nextLabel,
      ownerId: effectiveOwnerId,
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

    let manifest = await readManifest();
    manifest = await migrateLegacyOwnerIds(manifest);
    const datasetIndex = manifest.datasets.findIndex((entry) => entry.id === datasetIdFromPath);
    if (datasetIndex < 0) {
      return sendJson(res, 404, { error: 'not_found' });
    }

    const currentEntry = manifest.datasets[datasetIndex];
    const currentRecord = await readDatasetRecord(currentEntry.id, currentEntry.ownerId);
    const effectiveOwnerId = normalizeOwnerId(currentRecord.ownerId || currentEntry.ownerId);
    if (effectiveOwnerId !== authUser.id && !isAdmin) {
      return sendJson(res, 403, { error: 'forbidden' });
    }

    const currentDataset = { ...currentEntry, ownerId: effectiveOwnerId, cards: currentRecord.cards };

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

    if (url.pathname === '/csv-files' || /^\/csv-files\/[^/]+$/.test(url.pathname)) {
      await handleCsvFilesApi(req, res, url);
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
