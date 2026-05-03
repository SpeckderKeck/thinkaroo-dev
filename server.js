const http = require('http');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

const HOST = '0.0.0.0';
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LEGACY_DATA_FILE = path.join(DATA_DIR, 'custom-datasets.json');
const DATASET_STORE_DIR = path.join(DATA_DIR, 'custom-datasets-store');
const USER_CSV_BUCKET = 'cardsets';
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
const DATASET_VISIBILITY_PRIVATE = 'private';
const DATASET_VISIBILITY_PUBLIC = 'public';

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
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function setCorsHeaders(res, req) {
  const origin = String(req?.headers?.origin || '').trim();
  const isAllowedOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

  if (origin && isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Owner-Id, X-User-Id');
}

function sendJson(res, status, payload) {
  setCorsHeaders(res, res.req);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function sendJsonWithCacheControl(res, status, payload, cacheControl) {
  setCorsHeaders(res, res.req);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheControl,
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

function normalizeOwnerId(value) {
  const ownerId = String(value ?? '').trim();
  return ownerId || '';
}

function normalizeVisibility(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === DATASET_VISIBILITY_PRIVATE || normalized === DATASET_VISIBILITY_PUBLIC) {
    return normalized;
  }
  return '';
}

function resolveDatasetVisibility(visibility, ownerId) {
  const normalizedVisibility = normalizeVisibility(visibility);
  if (normalizedVisibility) {
    return normalizedVisibility;
  }
  return ownerId ? DATASET_VISIBILITY_PRIVATE : DATASET_VISIBILITY_PUBLIC;
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
  const ownerId = normalizeOwnerId(rawDataset.ownerId);
  const visibility = resolveDatasetVisibility(rawDataset.visibility, ownerId);

  return {
    id,
    label,
    cards,
    ownerId,
    visibility,
    createdAt,
    updatedAt,
    version,
  };
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
      visibility: dataset.visibility,
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

function requireSupabaseStorageConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('missing_supabase_storage_config');
  }
}

async function supabaseStorageRequest(pathname, { method = 'GET', headers = {}, body } = {}) {
  requireSupabaseStorageConfig();
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}${pathname}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...headers,
    },
    body,
  });
  return response;
}


async function listStoredCsvFiles(ownerId) {
  const ownerPrefix = `${ownerId}/`;
  const response = await supabaseStorageRequest(`/storage/v1/object/list/${encodeURIComponent(USER_CSV_BUCKET)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      prefix: ownerPrefix,
      limit: 100,
      offset: 0,
      sortBy: { column: 'updated_at', order: 'desc' },
    }),
  });

  if (!response.ok) {
    throw new Error(`supabase_storage_list_error_${response.status}`);
  }

  const entries = await response.json();
  return (Array.isArray(entries) ? entries : [])
    .filter((entry) => {
      const name = String(entry?.name || '').toLowerCase();
      return name.endsWith('.csv');
    })
    .map((entry) => ({
      name: String(entry.name || ''),
      size: Number(entry?.metadata?.size ?? 0),
      updatedAt: new Date(entry.updated_at || entry.last_accessed_at || Date.now()).toISOString(),
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function handleCsvFilesApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req);
    res.writeHead(204);
    res.end();
    return;
  }

  const authUser = await authenticateApiRequest(req, res);
  if (!authUser) return;
  const ownerId = authUser.id;

  const listPathMatch = url.pathname === '/csv-files';
  const itemPathMatch = url.pathname.match(/^\/csv-files\/([^/]+)$/);
  const fileNameFromPath = itemPathMatch ? decodeURIComponent(itemPathMatch[1]) : '';

  if (req.method === 'GET' && listPathMatch) {
    const files = await listStoredCsvFiles(ownerId);
    return sendJson(res, 200, files);
  }

  if (req.method === 'GET' && itemPathMatch) {
    const safeName = sanitizeCsvFileName(fileNameFromPath);
    if (!safeName || safeName !== fileNameFromPath) {
      return sendJson(res, 400, { error: 'invalid_filename' });
    }

    try {
      const response = await supabaseStorageRequest(
        `/storage/v1/object/${encodeURIComponent(USER_CSV_BUCKET)}/${encodeURIComponent(ownerId)}/${encodeURIComponent(safeName)}`,
        {
          method: 'GET',
          headers: { Accept: 'text/csv' },
        },
      );

      if (response.status === 404) {
        return sendJson(res, 404, { error: 'not_found' });
      }
      if (!response.ok) {
        throw new Error(`supabase_storage_download_error_${response.status}`);
      }

      const content = await response.text();
      setCorsHeaders(res, req);
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(content);
      return;
    } catch (error) {
      if (String(error?.message || '').includes('missing_supabase_storage_config')) {
        return sendJson(res, 500, { error: 'storage_unavailable' });
      }
      throw error;
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

    const uploadResponse = await supabaseStorageRequest(
      `/storage/v1/object/${encodeURIComponent(USER_CSV_BUCKET)}/${encodeURIComponent(ownerId)}/${encodeURIComponent(safeName)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'x-upsert': 'true',
        },
        body: content,
      },
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return sendJson(res, 502, {
        error: 'storage_upload_failed',
        details: errorText.slice(0, 300),
      });
    }

    return sendJson(res, 201, { name: safeName, size: byteSize, updatedAt: new Date().toISOString() });
  }

  if (req.method === 'DELETE' && itemPathMatch) {
    const safeName = sanitizeCsvFileName(fileNameFromPath);
    if (!safeName || safeName !== fileNameFromPath) {
      return sendJson(res, 400, { error: 'invalid_filename' });
    }

    try {
      const response = await supabaseStorageRequest(
        `/storage/v1/object/${encodeURIComponent(USER_CSV_BUCKET)}/${encodeURIComponent(ownerId)}/${encodeURIComponent(safeName)}`,
        { method: 'DELETE' },
      );
      if (response.status === 404) {
        return sendJson(res, 404, { error: 'not_found' });
      }
      if (!response.ok) {
        throw new Error(`supabase_storage_delete_error_${response.status}`);
      }
      return sendJson(res, 200, { ok: true, name: safeName });
    } catch (error) {
      if (String(error?.message || '').includes('missing_supabase_storage_config')) {
        return sendJson(res, 500, { error: 'storage_unavailable' });
      }
      throw error;
    }
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
        const visibility = String(entry.visibility ?? '').trim().toLowerCase();
        return {
          id,
          label,
          ownerId,
          visibility: visibility === 'public' ? 'public' : 'private',
          createdAt,
          updatedAt,
          version,
        };
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
      visibility: resolveDatasetVisibility(entry.visibility, ''),
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
      const isPublicDataset = resolveDatasetVisibility(entry.visibility, entry.ownerId) === DATASET_VISIBILITY_PUBLIC;
      if (entry.ownerId !== authUser.id && !(canSeeGlobal && isPublicDataset)) {
        continue;
      }
      const record = await readDatasetRecord(entry.id, entry.ownerId);
      const ownerId = record.ownerId || entry.ownerId;
      if (ownerId !== authUser.id && !(canSeeGlobal && isPublicDataset)) {
        continue;
      }
      datasets.push({
        ...entry,
        ownerId,
        visibility: resolveDatasetVisibility(entry.visibility, ownerId),
        cards: record.cards,
      });
    } catch {
      // Skip broken entry files gracefully.
    }
  }

  return datasets;
}

async function listPublicDatasets() {
  const manifest = await readManifest();
  const publicDatasets = [];

  for (const entry of manifest.datasets) {
    if (entry.visibility !== 'public') {
      continue;
    }

    try {
      const record = await readDatasetRecord(entry.id, entry.ownerId);
      publicDatasets.push({
        id: entry.id,
        label: entry.label,
        visibility: 'public',
        cards: Array.isArray(record.cards) ? record.cards : [],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        version: entry.version,
      });
    } catch {
      // Skip broken entry files gracefully.
    }
  }

  return publicDatasets;
}


async function handleDatasetsApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req);
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
    const requestedVisibility = Object.prototype.hasOwnProperty.call(payload, 'visibility')
      ? normalizeVisibility(payload.visibility)
      : '';
    if (Object.prototype.hasOwnProperty.call(payload, 'visibility') && !requestedVisibility) {
      return sendJson(res, 400, { error: 'invalid_visibility' });
    }
    if (requestedVisibility === DATASET_VISIBILITY_PUBLIC && !isAdmin) {
      return sendJson(res, 403, { error: 'forbidden_visibility' });
    }
    dataset.visibility = requestedVisibility || DATASET_VISIBILITY_PRIVATE;

    await writeDatasetRecord(dataset.id, dataset.ownerId, dataset.cards);
    manifest.datasets.push({
      id: dataset.id,
      label: dataset.label,
      ownerId: dataset.ownerId,
      visibility: dataset.visibility,
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
    const currentVisibility = resolveDatasetVisibility(currentEntry.visibility, effectiveOwnerId);
    if (effectiveOwnerId !== authUser.id && !isAdmin) {
      return sendJson(res, 403, { error: 'forbidden' });
    }

    const currentDataset = {
      ...currentEntry,
      ownerId: effectiveOwnerId,
      visibility: currentVisibility,
      cards: currentRecord.cards,
    };

    if (checkOptimisticConcurrency(currentDataset, payload)) {
      return sendJson(res, 409, { error: 'conflict', current: currentDataset });
    }

    const nextLabel = String(payload.label ?? currentEntry.label).trim() || currentEntry.id;
    const nextCards = Array.isArray(payload.cards) ? payload.cards : currentRecord.cards;
    const hasVisibilityInPayload = Object.prototype.hasOwnProperty.call(payload, 'visibility');
    const normalizedVisibility = hasVisibilityInPayload ? normalizeVisibility(payload.visibility) : '';
    if (hasVisibilityInPayload && !normalizedVisibility) {
      return sendJson(res, 400, { error: 'invalid_visibility' });
    }
    const nextVisibility = normalizedVisibility || currentVisibility;
    if ((nextVisibility === DATASET_VISIBILITY_PUBLIC || currentVisibility === DATASET_VISIBILITY_PUBLIC) && !isAdmin) {
      return sendJson(res, 403, { error: 'forbidden_visibility' });
    }
    if (!Array.isArray(nextCards) || nextCards.length === 0) {
      return sendJson(res, 400, { error: 'invalid_payload' });
    }

    const updatedAt = new Date().toISOString();
    const version = currentEntry.version + 1;

    await writeDatasetRecord(currentEntry.id, effectiveOwnerId, nextCards);
    manifest.datasets[datasetIndex] = {
      ...currentEntry,
      ownerId: effectiveOwnerId,
      visibility: nextVisibility,
      label: nextLabel,
      updatedAt,
      version,
    };
    await writeManifest(manifest);

    return sendJson(res, 200, {
      id: currentEntry.id,
      label: nextLabel,
      ownerId: effectiveOwnerId,
      visibility: nextVisibility,
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

async function handlePublicDatasetsApi(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  const datasets = await listPublicDatasets();
  return sendJsonWithCacheControl(res, 200, datasets, 'public, max-age=60');
}

async function handleAdminSessionApi(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  const authUser = await authenticateApiRequest(req, res);
  if (!authUser) {
    return;
  }

  return sendJson(res, 200, {
    id: authUser.id,
    email: authUser.email,
    isAdmin: isAdminUser(authUser.id),
  });
}

function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateShareToken() {
  const bytes = require('crypto').randomBytes(32);
  return bytes.toString('hex');
}

async function supabaseQuery(query, params = []) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('missing_supabase_config');
  }

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/${query}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`supabase_query_error_${response.status}: ${errorText}`);
  }

  return response.json();
}

function isUuid(value) {
  const normalized = String(value ?? '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized);
}

async function supabaseSelect(table, filters = {}, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('missing_supabase_config');
  }

  let url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`;
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    params.append(key, `eq.${value}`);
  });

  if (options.select) {
    params.append('select', options.select);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`supabase_select_error_${response.status}: ${errorText}`);
  }

  return response.json();
}

async function supabaseInsert(table, data) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('missing_supabase_config');
  }

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`supabase_insert_error_${response.status}: ${errorText}`);
  }

  return response.json();
}

async function handleSharedGamesApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req);
    res.writeHead(204);
    res.end();
    return;
  }

  const createPathMatch = url.pathname === '/shared-games';
  const tokenPathMatch = url.pathname.match(/^\/shared-games\/token\/([^/]+)$/);
  const codePathMatch = url.pathname.match(/^\/shared-games\/code\/([^/]+)$/);

  if (req.method === 'POST' && createPathMatch) {
    const authUser = await authenticateApiRequest(req, res);
    if (!authUser) {
      return;
    }

    let payload;
    try {
      payload = await readBodyJson(req);
    } catch {
      return sendJson(res, 400, { error: 'invalid_json' });
    }

    const gameSettings = payload.gameSettings || {};
    const teamSettings = payload.teamSettings || {};
    const datasetSelection = payload.datasetSelection && typeof payload.datasetSelection === 'object'
      ? payload.datasetSelection
      : {};

    const incomingCardSetIds = Array.isArray(datasetSelection.cardSetIds)
      ? datasetSelection.cardSetIds
      : (Array.isArray(payload.cardSetIds) ? payload.cardSetIds : []);

    const incomingPresetKeys = Array.isArray(datasetSelection.presetKeys)
      ? datasetSelection.presetKeys
      : [];

    const incomingEmbeddedCardSets = Array.isArray(datasetSelection.embeddedCardSets)
      ? datasetSelection.embeddedCardSets
      : [];

    const presetDatasetKeys = incomingPresetKeys.map((key) => String(key ?? '').trim()).filter(Boolean);
    const cardSetIds = incomingCardSetIds.map((id) => String(id ?? '').trim()).filter(Boolean);

    const embeddedCardSets = incomingEmbeddedCardSets
      .filter((set) => set && typeof set === 'object')
      .map((set) => ({
        key: String(set.key ?? '').trim(),
        label: String(set.label ?? '').trim(),
        cards: Array.isArray(set.cards) ? set.cards : [],
      }))
      .filter((set) => set.key && set.cards.length > 0);

    const validCardSetIds = cardSetIds.filter((id) => isUuid(id));
    const legacyPresetKeys = cardSetIds.filter((id) => !isUuid(id));
    const mergedPresetKeys = [...new Set([...presetDatasetKeys, ...legacyPresetKeys])];

    if (validCardSetIds.length === 0 && mergedPresetKeys.length === 0 && embeddedCardSets.length === 0) {
      return sendJson(res, 400, { error: 'no_card_sets' });
    }

    try {
      const requestContext = {
        userId: authUser.id,
        cardSetIdsCount: validCardSetIds.length,
        cardSetIds: validCardSetIds.slice(0, 10),
        presetKeysCount: mergedPresetKeys.length,
        presetKeys: mergedPresetKeys.slice(0, 10),
      };
      const code = generateGameCode();
      const shareToken = generateShareToken();

      const storedGameSettings = {
        ...(gameSettings && typeof gameSettings === 'object' ? gameSettings : {}),
        presetDatasetKeys: mergedPresetKeys,
        embeddedCardSets,
      };

      const sharedGameData = {
        code,
        share_token: shareToken,
        created_by_user_id: authUser.id,
        game_settings_json: storedGameSettings,
        team_settings_json: teamSettings,
        status: 'active',
      };

      let sharedGame;
      try {
        const inserted = await supabaseInsert('shared_games', sharedGameData);
        sharedGame = Array.isArray(inserted) ? inserted[0] : null;
      } catch (error) {
        console.error('shared-games: shared_games insert failed', {
          stage: 'shared_games_insert',
          error,
          requestContext,
          sharedGameDataKeys: Object.keys(sharedGameData),
        });
        return sendJson(res, 500, {
          error: 'failed_to_create_shared_game',
          stage: 'shared_games_insert',
          details: error?.message || String(error),
        });
      }

      if (!sharedGame || !sharedGame.id) {
        console.error('shared-games: shared_games insert returned empty result', {
          stage: 'shared_games_insert',
          requestContext,
          sharedGame,
        });
        return sendJson(res, 500, {
          error: 'failed_to_create_shared_game',
          stage: 'shared_games_insert',
          details: 'shared_games insert returned no row',
        });
      }

      const cardSetInserts = validCardSetIds.map((cardSetId) => ({
        shared_game_id: sharedGame.id,
        card_set_id: String(cardSetId),
      }));

      if (cardSetInserts.length > 0) {
        try {
          await supabaseInsert('shared_game_card_sets', cardSetInserts);
        } catch (error) {
          console.error('shared-games: shared_game_card_sets insert failed', {
            stage: 'card_sets_insert',
            error,
            requestContext,
            sharedGameId: sharedGame.id,
            sampleInsert: cardSetInserts[0],
          });
          return sendJson(res, 500, {
            error: 'failed_to_create_shared_game',
            stage: 'card_sets_insert',
            details: error?.message || String(error),
          });
        }
      }

      const rawOrigin = String(req.headers.origin || '').trim();
      const forwardedHost = String(req.headers['x-forwarded-host'] || '').trim();
      const forwardedProto = String(req.headers['x-forwarded-proto'] || '').trim();
      const host = String(forwardedHost || req.headers.host || '').trim();
      const proto = forwardedProto || (rawOrigin.startsWith('https://') ? 'https' : 'http');
      const origin = rawOrigin || (host ? `${proto}://${host}` : '');
      const safeOrigin = origin.replace('://0.0.0.0', '://localhost');
      const shareUrl = `${safeOrigin}/#/shared/${shareToken}`;

      return sendJson(res, 201, {
        id: sharedGame.id,
        code: sharedGame.code,
        shareToken: sharedGame.share_token,
        shareUrl,
      });
    } catch (error) {
      console.error('shared-games: unexpected error while creating shared game', {
        stage: 'unknown',
        error,
      });
      return sendJson(res, 500, {
        error: 'failed_to_create_shared_game',
        stage: 'unknown',
        details: error?.message || String(error),
      });
    }
  }

  if (req.method === 'GET' && tokenPathMatch) {
    const shareToken = decodeURIComponent(tokenPathMatch[1]);

    try {
      const sharedGames = await supabaseSelect('shared_games', { share_token: shareToken });

      if (!sharedGames || sharedGames.length === 0) {
        return sendJson(res, 404, { error: 'not_found' });
      }

      const sharedGame = sharedGames[0];

      const cardSets = await supabaseSelect('shared_game_card_sets', { shared_game_id: sharedGame.id });
      const cardSetIds = cardSets.map((cs) => cs.card_set_id);

      const manifest = await readManifest();
      const allowedCardSets = [];

      for (const cardSetId of cardSetIds) {
        const manifestEntry = manifest.datasets.find((d) => d.id === cardSetId);
        if (!manifestEntry) continue;

        try {
          const record = await readDatasetRecord(cardSetId, manifestEntry.ownerId);
          allowedCardSets.push({
            id: cardSetId,
            label: manifestEntry.label,
            cards: record.cards,
            visibility: manifestEntry.visibility,
          });
        } catch {
          // Skip broken datasets
        }
      }

      return sendJson(res, 200, {
        id: sharedGame.id,
        code: sharedGame.code,
        gameSettings: sharedGame.game_settings_json,
        teamSettings: sharedGame.team_settings_json,
        presetDatasetKeys: Array.isArray(sharedGame?.game_settings_json?.presetDatasetKeys)
          ? sharedGame.game_settings_json.presetDatasetKeys
          : [],
        cardSets: allowedCardSets,
      });
    } catch (error) {
      console.error('Error fetching shared game by token:', error);
      return sendJson(res, 500, { error: 'server_error' });
    }
  }

  if (req.method === 'GET' && codePathMatch) {
    const code = decodeURIComponent(codePathMatch[1]).toUpperCase();

    try {
      const sharedGames = await supabaseSelect('shared_games', { code });

      if (!sharedGames || sharedGames.length === 0) {
        return sendJson(res, 404, { error: 'not_found' });
      }

      const sharedGame = sharedGames[0];

      const cardSets = await supabaseSelect('shared_game_card_sets', { shared_game_id: sharedGame.id });
      const cardSetIds = cardSets.map((cs) => cs.card_set_id);

      const manifest = await readManifest();
      const allowedCardSets = [];

      for (const cardSetId of cardSetIds) {
        const manifestEntry = manifest.datasets.find((d) => d.id === cardSetId);
        if (!manifestEntry) continue;

        try {
          const record = await readDatasetRecord(cardSetId, manifestEntry.ownerId);
          allowedCardSets.push({
            id: cardSetId,
            label: manifestEntry.label,
            cards: record.cards,
            visibility: manifestEntry.visibility,
          });
        } catch {
          // Skip broken datasets
        }
      }

      return sendJson(res, 200, {
        id: sharedGame.id,
        code: sharedGame.code,
        shareToken: sharedGame.share_token,
        gameSettings: sharedGame.game_settings_json,
        teamSettings: sharedGame.team_settings_json,
        presetDatasetKeys: Array.isArray(sharedGame?.game_settings_json?.presetDatasetKeys)
          ? sharedGame.game_settings_json.presetDatasetKeys
          : [],
        cardSets: allowedCardSets,
      });
    } catch (error) {
      console.error('Error fetching shared game by code:', error);
      return sendJson(res, 500, { error: 'server_error' });
    }
  }

  return sendJson(res, 405, { error: 'method_not_allowed' });
}



async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const isAppPath = url.pathname === '/' || url.pathname === '/cardsets';
  const requestPath = decodeURIComponent(isAppPath ? '/index.html' : url.pathname);
  const filePath = path.join(ROOT_DIR, requestPath);
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(ROOT_DIR)) {
    setCorsHeaders(res, req);
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
    setCorsHeaders(res, req);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  } catch {
    setCorsHeaders(res, req);
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

    if (url.pathname === '/public-datasets') {
      await handlePublicDatasetsApi(req, res);
      return;
    }

    if (url.pathname === '/admin/me') {
      await handleAdminSessionApi(req, res);
      return;
    }

    if (url.pathname === '/csv-files' || /^\/csv-files\/[^/]+$/.test(url.pathname)) {
      await handleCsvFilesApi(req, res, url);
      return;
    }

    if (url.pathname === '/shared-games' || /^\/shared-games\/(token|code)\/[^/]+$/.test(url.pathname)) {
      await handleSharedGamesApi(req, res, url);
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
