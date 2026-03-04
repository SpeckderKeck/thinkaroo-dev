const swapSelect = document.getElementById("swap-select");
const teamCountInput = document.getElementById("team-count");
const teamCountDecrease = document.getElementById("team-count-decrease");
const teamCountIncrease = document.getElementById("team-count-increase");
const teamListContainer = document.getElementById("team-list");
const speedQuizTeamCountInput = document.getElementById("speedquiz-team-count");
const speedQuizTeamCountDecrease = document.getElementById("speedquiz-team-count-decrease");
const speedQuizTeamCountIncrease = document.getElementById("speedquiz-team-count-increase");
const speedQuizTeamListContainer = document.getElementById("speedquiz-team-list");
const startButton = document.getElementById("start-game");
const landingPanel = document.getElementById("screen-landing");
const menuPanel = document.getElementById("screen-settings-board");
const modeSelectionPanel = document.getElementById("screen-select");
const speedQuizMenuPanel = document.getElementById("screen-settings-speedquiz");
const speedQuizDatasetSelect = document.getElementById("speedquiz-dataset-select");
const speedQuizCategoriesContainer = document.getElementById("speedquiz-categories");
const speedQuizGamePanel = document.getElementById("screen-game-speedquiz");
const gamePanel = document.getElementById("screen-game-board");
const loginPanel = document.getElementById("screen-login");
const speedQuizStartButton = document.getElementById("start-speedquiz-game");
const board = document.getElementById("board");
const rollButton = document.getElementById("roll");
const diceOverlay = document.getElementById("dice-overlay");
const diceOverlayValue = document.getElementById("dice-overlay-value");
const statusText = document.getElementById("status");
const undoButton = document.getElementById("undo");
const overlay = document.getElementById("overlay");
const overlayContent = document.getElementById("overlay-content");
const turnOverlay = document.getElementById("turn-overlay");
const turnOverlayPanel = document.getElementById("turn-overlay-panel");
const turnCategory = document.getElementById("turn-category");
const turnCategoryIcon = document.getElementById("turn-category-icon");
const turnCategoryLabel = document.getElementById("turn-category-label");
const turnCountdownCard = document.getElementById("turn-countdown-card");
const turnCountdown = document.getElementById("turn-countdown");
const turnWord = document.getElementById("turn-word");
const turnTimer = document.getElementById("turn-timer");
const turnPenalty = document.getElementById("turn-penalty");
const turnWordTitle = document.getElementById("turn-word-title");
const turnSingleChoiceOptions = document.getElementById("turn-single-choice-options");
const turnTabooList = document.getElementById("turn-taboo-list");
const turnWordCategoryLabel = document.getElementById("turn-word-category-label");
const turnWordHint = document.getElementById("turn-word-hint");
const turnCorrectButton = document.getElementById("turn-correct");
const turnWrongButton = document.getElementById("turn-wrong");
const turnSwapButton = document.getElementById("turn-swap");
const turnContinueButton = document.getElementById("turn-continue");
const turnAnswer = document.getElementById("turn-answer");
const turnReadyButton = document.getElementById("turn-ready");
const winnerScreen = document.getElementById("winner-screen");
const winnerLabel = document.getElementById("winner-label");
const winnerRestartButton = document.getElementById("winner-restart");
const csvUpload = document.getElementById("csv-upload");
const csvDatasetNameInput = document.getElementById("csv-dataset-name");
const csvSaveNewButton = document.getElementById("csv-save-new");
const csvOverwriteSelect = document.getElementById("csv-overwrite-select");
const csvOverwriteButton = document.getElementById("csv-overwrite");
const csvStatus = document.getElementById("csv-status");
const csvUploadButton = document.getElementById("csv-upload-button");
const csvRefreshListButton = document.getElementById("csv-refresh-list");
const storageDatasetSelect = document.getElementById("storage-dataset-select");
const csvInfo = document.getElementById("csv-info");
const csvTooltip = document.getElementById("csv-tooltip");
const datasetSelect = document.getElementById("dataset-select");
const datasetSelectList = document.getElementById("dataset-select-list");
const datasetAddButton = document.getElementById("dataset-add");
const openCardEditorButton = document.getElementById("open-card-editor");
const cardEditorModal = document.getElementById("card-editor-modal");
const closeCardEditorButton = document.getElementById("close-card-editor");
const cardEditorBody = document.getElementById("card-editor-body");
const cardEditorAddRowButton = document.getElementById("card-editor-add-row");
const cardEditorSaveButton = document.getElementById("card-editor-save");
const cardEditorExportButton = document.getElementById("card-editor-export");
const cardEditorDatasetLabelInput = document.getElementById("card-editor-dataset-label");
const cardEditorSaveNewButton = document.getElementById("card-editor-save-new");
const cardEditorDatasetSelect = document.getElementById("card-editor-dataset-select");
const cardEditorOverwriteButton = document.getElementById("card-editor-overwrite");
const cardEditorDeleteButton = document.getElementById("card-editor-delete");
const cardEditorErrors = document.getElementById("card-editor-errors");
const fullscreenToggle = document.getElementById("fullscreen-toggle");
const qrToggle = document.getElementById("qr-toggle");
const qrModal = document.getElementById("qr-modal");
const qrImage = document.getElementById("qr-image");
const closeQrModalButton = document.getElementById("close-qr-modal");

const GAME_PHASES = {
  IDLE: "idle",
  READY: "ready",
  COUNTDOWN: "countdown",
  FULLSCREEN_CARD: "FULLSCREEN_CARD",
  WINNER: "winner",
};

function createFullscreenCardOverlay({
  root,
  categoryElement,
  termElement,
  tabooListElement,
  hintElement,
}) {
  if (!root || !termElement || !tabooListElement) {
    return {
      update: () => {},
      setOpen: () => {},
      fitTermText: () => {},
      fitTabooText: () => {},
    };
  }

  const fitTermText = () => {
    root.style.setProperty("--term-scale", "1");
    const minScale = 0.55;
    const scaleStep = 0.05;
    let nextScale = 1;

    while (nextScale > minScale && termElement.scrollWidth > termElement.clientWidth + 1) {
      nextScale -= scaleStep;
      root.style.setProperty("--term-scale", nextScale.toFixed(2));
    }
  };

  const fitTabooText = () => {
    root.style.setProperty("--taboo-scale", "1");
    const tabooItems = tabooListElement.querySelectorAll("li");
    if (tabooItems.length === 0) return;
    const minScale = 0.6;
    const scaleStep = 0.04;
    let nextScale = 1;

    while (
      nextScale > minScale
      && Array.from(tabooItems).some((item) => item.scrollWidth > item.clientWidth + 1)
    ) {
      nextScale -= scaleStep;
      root.style.setProperty("--taboo-scale", nextScale.toFixed(2));
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    fitTermText();
    fitTabooText();
  });
  resizeObserver.observe(root);

  return {
    update: ({ category = "", term = "", tabooTerms = [], showHint = false }) => {
      if (categoryElement) {
        categoryElement.textContent = category || "Kategorie";
      }
      const categoryColor = CATEGORY_VISUALS[category]?.color ?? getCardColor(category);
      root.style.setProperty("--fullscreen-card-bg", categoryColor ?? "#F3E9D3");
      root.style.setProperty("--fullscreen-card-text", getReadableTextColor(categoryColor ?? "#F3E9D3"));
      termElement.textContent = term || "Keine Karte";
      tabooListElement.innerHTML = "";
      tabooTerms.forEach((taboo) => {
        const li = document.createElement("li");
        li.textContent = taboo;
        tabooListElement.appendChild(li);
      });
      if (hintElement) {
        hintElement.classList.toggle("hidden", !showHint);
      }
      fitTermText();
      fitTabooText();
    },
    setOpen: ({ isOpen }) => {
      root.classList.toggle("fullscreen-game-card", isOpen);
      root.classList.toggle("hidden", !isOpen);
      document.body.classList.toggle("fullscreen-card-open", isOpen);
      if (isOpen) {
        fitTermText();
        fitTabooText();
      }
    },
    fitTermText,
    fitTabooText,
  };
}

function openQrModal(event) {
  event?.preventDefault();
  event?.stopPropagation();
  if (!qrModal || !qrImage) return;
  const pageUrl = window.location.href;
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(pageUrl)}`;
  qrModal.classList.remove("hidden");
}

function closeQrModal() {
  if (!qrModal) return;
  qrModal.classList.add("hidden");
}

if (qrToggle) {
  qrToggle.addEventListener("click", (event) => {
    openQrModal(event);
  });
}

const swapSelectGame = document.getElementById("swap-select-game");
const boardSizeSelect = document.getElementById("board-size-select");
const boardSizeSelectGame = document.getElementById("board-size-select-game");
const settingsPanel = document.getElementById("settings-panel");
const openSettingsButton = document.getElementById("open-settings");
const closeSettingsButton = document.getElementById("close-settings");
const applySettingsButton = document.getElementById("apply-settings");
const mainMenuButton = document.getElementById("main-menu");
const boardSizeInputs = document.querySelectorAll('input[name="board-size"]');
const teamStatusList = document.getElementById("team-status-list");

function createMenuBackground() {
  const layer = document.createElement("div");
  layer.className = "menu-background";
  layer.setAttribute("aria-hidden", "true");
  return layer;
}

function attachMenuBackground(menuElement) {
  if (!menuElement || menuElement.querySelector(".menu-background")) {
    return;
  }
  menuElement.prepend(createMenuBackground());
}

attachMenuBackground(menuPanel);

function setStatusMessage(message, { pulseDice = false } = {}) {
  if (statusText) {
    statusText.classList.remove("hidden");
    statusText.classList.remove("status--next-roll");
    const closeButton = statusText.querySelector(".status-close-button");
    closeButton?.remove();
    statusText.textContent = message;
  }
  rollButton?.classList.toggle("dice--pulse", pulseDice);
}

function setNextRollStatus(teamIndex, { pulseDice = true } = {}) {
  if (statusText) {
    statusText.classList.add("hidden");
    statusText.classList.remove("status--next-roll");
    statusText.textContent = "";
  }
  rollButton?.classList.toggle("dice--pulse", pulseDice);
}

function isWaitingForRoll(teamIndex) {
  return (
    teamIndex === state.currentTeam
    && state.pendingRoll === null
    && state.phase === GAME_PHASES.IDLE
    && !state.gameOver
  );
}

function showDiceOverlay(roll) {
  if (!diceOverlay || !diceOverlayValue) return;
  diceOverlayValue.textContent = roll;
  diceOverlay.classList.remove("active");
  void diceOverlay.offsetWidth;
  diceOverlay.classList.add("active");
}

function hideDiceOverlay() {
  if (!diceOverlay) return;
  diceOverlay.classList.remove("active");
}

function setPanelState(panel, isActive) {
  if (!panel) return;
  panel.classList.toggle("panel--active", isActive);
  panel.toggleAttribute("hidden", !isActive);
  panel.setAttribute("aria-hidden", String(!isActive));
}

const screenPanels = {
  "#/landing": landingPanel,
  "#/select": modeSelectionPanel,
  "#/settings-speedquiz": speedQuizMenuPanel,
  "#/settings-board": menuPanel,
  "#/game-speedquiz": speedQuizGamePanel,
  "#/game-board": gamePanel,
  "#/login": loginPanel,
};

function normalizeRouteHash(hash) {
  return Object.hasOwn(screenPanels, hash) ? hash : "#/landing";
}

function setRoute(hash) {
  const nextHash = normalizeRouteHash(hash);
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
    return;
  }
  Object.entries(screenPanels).forEach(([routeHash, panel]) => {
    setPanelState(panel, routeHash === nextHash);
  });
  document.body.classList.toggle("game-active", nextHash === "#/game-board" || nextHash === "#/game-speedquiz");
  const settingsBackLink = document.getElementById("settings-back-topbar");
  const showSettingsBackLink = nextHash === "#/settings-board" || nextHash === "#/settings-speedquiz";
  if (settingsBackLink) {
    settingsBackLink.hidden = !showSettingsBackLink;
  }
}

function showMenuPanel() {
  setRoute("#/settings-board");
}

function showModeSelectionPanel() {
  setRoute("#/select");
}

function showSpeedQuizMenuPanel() {
  setRoute("#/settings-speedquiz");
}

function showGamePanel() {
  setRoute("#/game-board");
}

const CATEGORY_CONFIG = {
  Erklären: { id: "explain", iconPath: "erklaeren.svg", fallbackIcon: "💬" },
  Zeichnen: { id: "draw", iconPath: "zeichnen_1.svg", fallbackIcon: "✏️" },
  Pantomime: { id: "pantomime", iconPath: "pantomime_1.svg", fallbackIcon: "🎭" },
  Quizfrage: { id: "quiz", iconPath: "quiz.svg", fallbackIcon: "?" },
  Vokabel: { id: "vocab", iconPath: "voc.svg", fallbackIcon: "📝" },
  "Single-Choice": { id: "singlechoice", iconPath: "singlechoice.svg", fallbackIcon: "☑️" },
};

const theme = globalThis.THINKAROO_THEME;
const getCardColor = theme?.getCardColor ?? (() => "#F3E9D3");
const getCardBorderColor = theme?.getCardBorderColor ?? (() => "#8B5E34");
const getReadableTextColor = theme?.getReadableTextColor ?? (() => "#1E1E1E");

const CATEGORY_VISUALS = {
  Erklären: {
    color: getCardColor("Erklären"),
    iconColor: getReadableTextColor(getCardColor("Erklären")),
  },
  Zeichnen: {
    color: getCardColor("Zeichnen"),
    iconColor: getReadableTextColor(getCardColor("Zeichnen")),
  },
  Pantomime: {
    color: getCardColor("Pantomime"),
    iconColor: getReadableTextColor(getCardColor("Pantomime")),
  },
  Quizfrage: {
    color: getCardColor("Quizfrage"),
    borderColor: getCardBorderColor("Quizfrage"),
    iconColor: getReadableTextColor(getCardColor("Quizfrage")),
  },
  Vokabel: {
    color: getCardColor("Vokabel"),
    borderColor: getCardBorderColor("Vokabel"),
    iconColor: getReadableTextColor(getCardColor("Vokabel")),
  },
  "Single-Choice": {
    color: getCardColor("Single-Choice"),
    borderColor: getCardBorderColor("Single-Choice"),
    iconColor: getReadableTextColor(getCardColor("Single-Choice")),
  },
};

const START_ICON_PATH = "start.svg";
const GOAL_ICON_PATH = "ziel.svg";
const ALLOWED_CARD_CATEGORIES = ["Erklären", "Zeichnen", "Pantomime", "Quizfrage", "Vokabel", "Single-Choice"];

function isAnswerCardCategory(category) {
  return category === "Quizfrage" || category === "Vokabel" || category === "Single-Choice";
}

function normalizeCategoryInput(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "singlechoice") {
    return "Single-Choice";
  }
  if (normalized === "vokabeln") {
    return "Vokabel";
  }
  return String(value ?? "").trim();
}

function getCategoryIconPath(category) {
  return CATEGORY_CONFIG[category]?.iconPath ?? "";
}

function getCategoryFallbackIcon(category) {
  return CATEGORY_CONFIG[category]?.fallbackIcon ?? "?";
}

function applyCategoryIcon(element, category, { allowFallback = false } = {}) {
  const iconPath = getCategoryIconPath(category);
  const visuals = CATEGORY_VISUALS[category];
  const categoryId = CATEGORY_CONFIG[category]?.id ?? "unknown";
  Object.values(CATEGORY_CONFIG).forEach((config) => {
    element.classList.remove(`category-icon--${config.id}`);
  });
  element.classList.add(`category-icon--${categoryId}`);
  element.classList.remove("icon-fallback");
  element.style.setProperty("--icon-color", visuals?.iconColor ?? "#3b3b3b");
  if (iconPath) {
    element.textContent = "";
    element.style.setProperty("--icon-url", `url("${iconPath}")`);
    return;
  }
  element.style.removeProperty("--icon-url");
  if (allowFallback) {
    element.classList.add("icon-fallback");
    element.textContent = getCategoryFallbackIcon(category);
  }
}

const menuCategoryControls = Object.entries(CATEGORY_CONFIG).map(([category, config]) => ({
  category,
  checkbox: document.getElementById(`category-${config.id}`),
  timeSelect: document.getElementById(`time-${config.id}`),
}));

const gameCategoryControls = Object.entries(CATEGORY_CONFIG).map(([category, config]) => ({
  category,
  checkbox: document.getElementById(`category-${config.id}-game`),
  timeSelect: document.getElementById(`time-${config.id}-game`),
}));

const PRESET_DATASETS = globalThis.CARD_DATABASES ?? {};
const DEFAULT_DATASET_KEY = "allgemein";
const DEFAULT_DATA = PRESET_DATASETS[DEFAULT_DATASET_KEY]?.cards ?? [];
const MAX_DATASET_SELECTIONS = 5;
const CUSTOM_DATASETS_STORAGE_KEY = "wissivity.customDatasets";
const CUSTOM_DATASETS_API_URL_STORAGE_KEY = "wissivity.customDatasetsApiUrl";
const CUSTOM_DATASETS_API_ENDPOINT = "/datasets";
const CUSTOM_DATASET_KEY_PREFIX = "custom:";
const STORAGE_DATASET_KEY_PREFIX = "storage:";
const REMOVED_PRESET_DATASET_KEYS = new Set(["umformen"]);
const REMOVED_CUSTOM_DATASET_LABELS = new Set(["umformen"]);
const AUTH_MODE_EVENT = "thinkaroo:auth-mode-change";

const fullscreenCardOverlay = createFullscreenCardOverlay({
  root: turnWord,
  categoryElement: turnWordCategoryLabel,
  termElement: turnWordTitle,
  tabooListElement: turnTabooList,
  hintElement: turnWordHint,
});

const state = {
  teams: [],
  currentTeam: 0,
  positions: [],
  boardSize: "normal",
  boardDimensions: { rows: 5, cols: 6, total: 30 },
  pendingRoll: null,
  pendingCategory: null,
  timer: null,
  countdownTimer: null,
  turnStartPositions: null,
  remainingTime: 0,
  timeLimit: 60,
  categoryTimes: {
    Erklären: 60,
    Zeichnen: 60,
    Pantomime: 60,
    Quizfrage: 60,
    Vokabel: 60,
    "Single-Choice": 60,
  },
  swapPenalty: 10,
  categories: ["Erklären", "Zeichnen", "Pantomime", "Quizfrage", "Vokabel", "Single-Choice"],
  cards: [...DEFAULT_DATA],
  history: [],
  boardCategories: [],
  phase: GAME_PHASES.IDLE,
  gameOver: false,
  pendingReturn: null,
  currentCard: null,
  quizPhase: null,
  singleChoiceResult: null,
  masterQuiz: false,
  selectedDatasets: [],
  customDatasets: {},
  storageDatasets: {},
  speedQuiz: {
    selectedDataset: "",
    selectedCategories: [...ALLOWED_CARD_CATEGORIES],
  },
  uploadedCsvCards: [],
  datasetStorageMode: "local",
  customDatasetsApiUrl: "",
};

let isLoggedIn = Boolean(window.THINKAROO_AUTH?.isLoggedIn);
let authSession = window.__authState?.session ?? null;

function createAuthApiError(message, { shouldRedirect = true } = {}) {
  const error = new Error(message);
  error.isAuthError = true;
  error.shouldRedirect = shouldRedirect;
  return error;
}

async function getAuthHeaders({ includeContentType = false } = {}) {
  let session = authSession ?? window.__authState?.session ?? null;
  if (!session?.access_token && window.supabase?.auth?.getSession) {
    try {
      const {
        data: { session: latestSession },
      } = await window.supabase.auth.getSession();
      session = latestSession;
    } catch {
      session = null;
    }
  }

  const headers = {
    Accept: "application/json",
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

function ensureAuthorizedResponse(response, actionLabel = "Anfrage") {
  if (response.status !== 401 && response.status !== 403) {
    return;
  }
  const loginHint = "Bitte melde dich erneut an.";
  const message = `${actionLabel} fehlgeschlagen: Zugriff verweigert (HTTP ${response.status}). ${loginHint}`;
  throw createAuthApiError(message, { shouldRedirect: true });
}

function redirectToLogin() {
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginUrl = new URL("./auth.html", window.location.href);
  loginUrl.searchParams.set("mode", "login");
  loginUrl.searchParams.set("returnTo", returnTo);
  window.location.href = loginUrl.toString();
}

function requireFullAccess() {
  if (isLoggedIn) {
    return true;
  }
  redirectToLogin();
  return false;
}

function clearRestrictedDatasetSelections() {
  const allowedDatasetKeys = readSelectedDatasetKeys().filter((key) => {
    const isCustomDataset = Boolean(fromCustomDatasetKey(key));
    const isStorageDataset = Boolean(fromStorageDatasetKey(key));
    return !isCustomDataset && !isStorageDataset;
  });
  if (allowedDatasetKeys.length > 0) {
    state.selectedDatasets = allowedDatasetKeys.slice(0, MAX_DATASET_SELECTIONS);
    return;
  }
  state.selectedDatasets = [DEFAULT_DATASET_KEY];
}

function applyDatasetAuthMode() {
  if (!isLoggedIn) {
    state.customDatasets = filterCustomDatasetsForAuthMode(state.customDatasets);
    state.storageDatasets = {};
    state.uploadedCsvCards = [];
    clearRestrictedDatasetSelections();
    closeCardEditor();
  }

  refreshDatasetSelections();
  refreshCsvDatasetOverwriteSelect("");
  updateCsvDatasetActionState();
  updateMainMenuRequiredSelectionState();
}

const TEAM_ICONS = [
  "🐯",
  "🐼",
  "🦊",
  "🐸",
  "🐙",
  "🦁",
  "🐧",
  "🐨",
  "🐶",
  "🐱",
  "🦉",
  "🦄",
  "🦋",
  "🐢",
  "🐰",
  "🦓",
];
const DEFAULT_TEAM_NAMES = ["Team A", "Team B", "Team C", "Team D"];
const BOARD_CONFIGS = {
  short: { rows: 4, cols: 6, total: 24 },
  normal: { rows: 5, cols: 6, total: 30 },
  long: { rows: 6, cols: 7, total: 42 },
};

function normalizeCustomDatasetsApiUrl(url) {
  return String(url ?? "").trim().replace(/\/+$/, "");
}

function resolveCustomDatasetsApiUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = normalizeCustomDatasetsApiUrl(params.get("datasetsApi"));
  if (fromQuery) {
    localStorage.setItem(CUSTOM_DATASETS_API_URL_STORAGE_KEY, fromQuery);
    return fromQuery;
  }

  const fromStorage = normalizeCustomDatasetsApiUrl(localStorage.getItem(CUSTOM_DATASETS_API_URL_STORAGE_KEY));
  if (fromStorage) {
    return fromStorage;
  }

  if (window.location.protocol.startsWith("http")) {
    return window.location.origin;
  }

  return "";
}

function getCustomDatasetsApiEndpoint() {
  const baseUrl = normalizeCustomDatasetsApiUrl(state.customDatasetsApiUrl);
  if (!baseUrl) {
    return CUSTOM_DATASETS_API_ENDPOINT;
  }
  return `${baseUrl}${CUSTOM_DATASETS_API_ENDPOINT}`;
}

function fromCustomDatasetKey(key) {
  const normalized = String(key ?? "").trim();
  if (!normalized.startsWith(CUSTOM_DATASET_KEY_PREFIX)) {
    return null;
  }
  const id = normalized.slice(CUSTOM_DATASET_KEY_PREFIX.length).trim();
  return id || null;
}

function toCustomDatasetKey(id) {
  const normalizedId = fromCustomDatasetKey(id) ?? String(id ?? "").trim();
  if (!normalizedId) {
    return "";
  }
  return `${CUSTOM_DATASET_KEY_PREFIX}${normalizedId}`;
}

function fromStorageDatasetKey(key) {
  const normalized = String(key ?? "").trim();
  if (!normalized.startsWith(STORAGE_DATASET_KEY_PREFIX)) {
    return null;
  }
  const objectName = normalized.slice(STORAGE_DATASET_KEY_PREFIX.length).trim();
  return objectName || null;
}

function toStorageDatasetKey(objectName) {
  const normalizedName = fromStorageDatasetKey(objectName) ?? String(objectName ?? "").trim();
  if (!normalizedName) {
    return "";
  }
  return `${STORAGE_DATASET_KEY_PREFIX}${normalizedName}`;
}

function normalizeDatasetTimestamp(value, fallback) {
  const parsedDate = new Date(value ?? "");
  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }
  return parsedDate.toISOString();
}

function normalizeOwnerId(value) {
  const raw = String(value ?? "").trim();
  return raw || "";
}

function isCustomDatasetPublic(rawDataset) {
  if (!rawDataset || typeof rawDataset !== "object") {
    return false;
  }

  if (typeof rawDataset.isPublic === "boolean") {
    return rawDataset.isPublic;
  }

  if (typeof rawDataset.public === "boolean") {
    return rawDataset.public;
  }

  const visibility = String(rawDataset.visibility ?? "").trim().toLowerCase();
  if (visibility === "public") {
    return true;
  }
  if (visibility === "private") {
    return false;
  }

  return !normalizeOwnerId(rawDataset.ownerId ?? rawDataset.owner_id);
}

function canAccessCustomDataset(rawDataset) {
  return isLoggedIn || isCustomDatasetPublic(rawDataset);
}

function filterCustomDatasetsForAuthMode(datasetsById) {
  return Object.values(datasetsById ?? {}).reduce((accumulator, dataset) => {
    if (!canAccessCustomDataset(dataset)) {
      return accumulator;
    }
    const normalized = normalizeStoredCustomDataset(dataset);
    if (normalized) {
      accumulator[normalized.id] = normalized;
    }
    return accumulator;
  }, {});
}

function isValidNormalizedCard(card) {
  if (!card || !ALLOWED_CARD_CATEGORIES.includes(card.category) || !card.term) {
    return false;
  }
  if (isAnswerCardCategory(card.category)) {
    if (card.category === "Single-Choice") {
      return Boolean(card.answer) && Array.isArray(card.wrongAnswers) && card.wrongAnswers.length >= 3;
    }
    return Boolean(card.answer);
  }
  return true;
}

function normalizeStoredCustomDataset(rawDataset) {
  if (!rawDataset || typeof rawDataset !== "object") {
    return null;
  }

  const rawId = rawDataset.id ?? rawDataset.datasetId ?? rawDataset.key;
  const id = fromCustomDatasetKey(rawId) ?? String(rawId ?? "").trim();
  if (!id) {
    return null;
  }

  const label = String(rawDataset.label ?? "").trim() || id;
  const rawCards = Array.isArray(rawDataset.cards) ? rawDataset.cards : [];
  const cards = rawCards.map((card) => normalizeCardInput(card)).filter((card) => isValidNormalizedCard(card));
  if (cards.length === 0) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const createdAt = normalizeDatasetTimestamp(rawDataset.createdAt, nowIso);
  const updatedAt = normalizeDatasetTimestamp(rawDataset.updatedAt, createdAt);

  return {
    id,
    label,
    cards,
    createdAt,
    updatedAt,
    ownerId: normalizeOwnerId(rawDataset.ownerId ?? rawDataset.owner_id),
    isPublic: isCustomDatasetPublic(rawDataset),
    version: Number.isInteger(rawDataset.version) && rawDataset.version > 0 ? rawDataset.version : 1,
  };
}

function readCustomDatasetsFromStorage() {
  try {
    const raw = localStorage.getItem(CUSTOM_DATASETS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return {};
    return parsed.reduce((accumulator, rawDataset) => {
      const dataset = normalizeStoredCustomDataset(rawDataset);
      if (dataset) {
        accumulator[dataset.id] = dataset;
      }
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

async function readCustomDatasetsFromApi() {
  try {
    const response = await fetch(getCustomDatasetsApiEndpoint(), {
      method: "GET",
      headers: await getAuthHeaders(),
    });
    ensureAuthorizedResponse(response, "Laden der eigenen Kartensätze");

    if (!response.ok) {
      return null;
    }

    const parsed = await response.json();
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.reduce((accumulator, rawDataset) => {
      const dataset = normalizeStoredCustomDataset(rawDataset);
      if (dataset) {
        accumulator[dataset.id] = dataset;
      }
      return accumulator;
    }, {});
  } catch (error) {
    if (error?.isAuthError) {
      throw error;
    }
    return null;
  }
}

async function persistCustomDatasets({ operation, datasetId, previousDataset } = {}) {
  const datasets = Object.values(state.customDatasets)
    .map((dataset) => normalizeStoredCustomDataset(dataset))
    .filter(Boolean)
    .sort((a, b) => String(a.label).localeCompare(String(b.label), "de"));

  state.customDatasets = datasets.reduce((accumulator, dataset) => {
    accumulator[dataset.id] = dataset;
    return accumulator;
  }, {});

  if (state.datasetStorageMode === "remote") {
    try {
      const targetDataset = datasetId ? state.customDatasets[datasetId] : null;
      let response;

      if (operation === "delete") {
        response = await fetch(`${getCustomDatasetsApiEndpoint()}/${encodeURIComponent(datasetId)}`, {
          method: "DELETE",
          headers: await getAuthHeaders({ includeContentType: true }),
          body: JSON.stringify({
            expectedVersion: previousDataset?.version,
            expectedUpdatedAt: previousDataset?.updatedAt,
          }),
        });
      } else if (targetDataset) {
        const hasPreviousDataset = Boolean(previousDataset);
        response = await fetch(
          hasPreviousDataset
            ? `${getCustomDatasetsApiEndpoint()}/${encodeURIComponent(targetDataset.id)}`
            : getCustomDatasetsApiEndpoint(),
          {
            method: hasPreviousDataset ? "PATCH" : "POST",
            headers: await getAuthHeaders({ includeContentType: true }),
            body: JSON.stringify(
              hasPreviousDataset
                ? {
                    label: targetDataset.label,
                    cards: targetDataset.cards,
                    expectedVersion: previousDataset?.version,
                    expectedUpdatedAt: previousDataset?.updatedAt,
                  }
                : targetDataset,
            ),
          },
        );
      } else {
        response = { ok: true, status: 200, json: async () => null };
      }

      ensureAuthorizedResponse(response, "Speichern der eigenen Kartensätze");

      if (!response.ok) {
        if (response.status === 409) {
          const conflictPayload = await response.json().catch(() => null);
          if (operation === "delete" && previousDataset?.id) {
            state.customDatasets[previousDataset.id] = previousDataset;
          } else if (datasetId) {
            if (previousDataset?.id) {
              state.customDatasets[previousDataset.id] = previousDataset;
            } else {
              delete state.customDatasets[datasetId];
            }
          }
          localStorage.setItem(CUSTOM_DATASETS_STORAGE_KEY, JSON.stringify(Object.values(state.customDatasets)));
          return {
            ok: false,
            mode: "remote",
            conflict: true,
            message: "Konflikt erkannt: Kartensatz wurde zwischenzeitlich geändert.",
            serverDataset: normalizeStoredCustomDataset(conflictPayload?.current),
          };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      if (operation !== "delete" && datasetId) {
        const persistedDataset = normalizeStoredCustomDataset(await response.json());
        if (persistedDataset) {
          state.customDatasets[persistedDataset.id] = persistedDataset;
        }
      }

      localStorage.setItem(CUSTOM_DATASETS_STORAGE_KEY, JSON.stringify(Object.values(state.customDatasets)));
      return { ok: true, mode: "remote" };
    } catch (error) {
      if (error?.isAuthError) {
        return { ok: false, mode: "remote", authRequired: true, message: error.message };
      }
      state.datasetStorageMode = "local";
      localStorage.setItem(CUSTOM_DATASETS_STORAGE_KEY, JSON.stringify(Object.values(state.customDatasets)));
      return { ok: false, mode: "local", message: "Server nicht erreichbar, lokal gespeichert." };
    }
  }

  localStorage.setItem(CUSTOM_DATASETS_STORAGE_KEY, JSON.stringify(Object.values(state.customDatasets)));
  return { ok: true, mode: "local" };
}

async function loadCustomDatasets() {
  let remoteDatasets = null;
  try {
    remoteDatasets = await readCustomDatasetsFromApi();
  } catch (error) {
    if (error?.isAuthError) {
      if (csvStatus) {
        csvStatus.textContent = error.message;
      }
      redirectToLogin();
      return {};
    }
  }
  if (remoteDatasets) {
    state.datasetStorageMode = "remote";
    return remoteDatasets;
  }

  state.datasetStorageMode = "local";
  return readCustomDatasetsFromStorage();
}

function getAllDatasetEntries() {
  const presetEntries = Object.entries(PRESET_DATASETS)
    .filter(([key]) => !REMOVED_PRESET_DATASET_KEYS.has(key))
    .map(([key, dataset]) => ({
      key,
      label: dataset.label,
      cards: dataset.cards,
      isCustom: false,
    }));
  const customEntries = Object.values(state.customDatasets)
    .filter((dataset) => canAccessCustomDataset(dataset))
    .map((dataset) => normalizeStoredCustomDataset(dataset))
    .filter(Boolean)
    .map((dataset) => ({
      key: toCustomDatasetKey(dataset.id),
      label: `${dataset.label} (Eigen)`,
      cards: dataset.cards,
      isCustom: true,
      id: dataset.id,
    }));
  const storageEntries = Object.entries(state.storageDatasets).map(([objectName, cards]) => ({
    key: toStorageDatasetKey(objectName),
    label: `${objectName} (Storage)`,
    cards,
    isCustom: false,
    isStorage: true,
    objectName,
  }));
  return [...presetEntries, ...customEntries, ...storageEntries];
}

function getDatasetEntryByKey(key) {
  const normalizedKey = String(key ?? "").trim();
  if (REMOVED_PRESET_DATASET_KEYS.has(normalizedKey)) {
    return null;
  }
  if (PRESET_DATASETS[normalizedKey]) {
    const dataset = PRESET_DATASETS[normalizedKey];
    return { key: normalizedKey, label: dataset.label, cards: dataset.cards, isCustom: false };
  }
  const customId = fromCustomDatasetKey(normalizedKey);
  if (customId) {
    const rawDataset = state.customDatasets[customId];
    if (!canAccessCustomDataset(rawDataset)) return null;
    const dataset = normalizeStoredCustomDataset(rawDataset);
    if (!dataset) return null;
    return {
      key: toCustomDatasetKey(dataset.id),
      label: `${dataset.label} (Eigen)`,
      cards: dataset.cards,
      isCustom: true,
      id: dataset.id,
    };
  }
  const storageObjectName = fromStorageDatasetKey(normalizedKey);
  if (!storageObjectName) return null;
  const cards = state.storageDatasets[storageObjectName];
  if (!Array.isArray(cards) || cards.length === 0) return null;
  return {
    key: toStorageDatasetKey(storageObjectName),
    label: `${storageObjectName} (Storage)`,
    cards,
    isCustom: false,
    isStorage: true,
    objectName: storageObjectName,
  };
}

function refreshDatasetSelections() {
  setupDatasetSelects();
  renderSpeedQuizDatasetOptions();
  applySelectedDatasets();
}


function populateTimeSelect(selectEl, defaultValue = 60) {
  for (let i = 10; i <= 120; i += 10) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}s`;
    if (i === defaultValue) option.selected = true;
    selectEl.appendChild(option);
  }
}

function getSelectedCategories(controls) {
  return controls.filter((control) => control.checkbox.checked).map((control) => control.category);
}

function setDatasetSelectionInvalidState(isInvalid) {
  datasetSelectList?.classList.toggle("selection-invalid", isInvalid);
  datasetSelect?.classList.toggle("selection-invalid", isInvalid);
  storageDatasetSelect?.classList.toggle("selection-invalid", isInvalid);
}

function setCategorySelectionInvalidState(controls, isInvalid) {
  controls.forEach((control) => {
    const row = control.checkbox?.closest(".category-setting");
    row?.classList.toggle("selection-invalid", isInvalid);
  });
}

function updateMainMenuRequiredSelectionState() {
  const selectedDatasetKeys = readSelectedDatasetKeys();
  const hasSelectedDatasets = selectedDatasetKeys.length > 0;
  const selectedCategories = getSelectedCategories(menuCategoryControls);
  const hasSelectedCategories = selectedCategories.length > 0;

  setDatasetSelectionInvalidState(!hasSelectedDatasets);
  setCategorySelectionInvalidState(menuCategoryControls, !hasSelectedCategories);

  return hasSelectedDatasets && hasSelectedCategories;
}

function readCategoryTimes(controls) {
  return controls.reduce((times, control) => {
    times[control.category] = Number.parseInt(control.timeSelect.value, 10);
    return times;
  }, {});
}

function syncCategoryControls(controls, selectedCategories, categoryTimes) {
  controls.forEach((control) => {
    control.checkbox.checked = selectedCategories.includes(control.category);
    if (categoryTimes[control.category]) {
      control.timeSelect.value = categoryTimes[control.category];
    }
  });
}

function renderTeamRows(container, count) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const defaultIcon = TEAM_ICONS[i % TEAM_ICONS.length];
    const defaultName = DEFAULT_TEAM_NAMES[i] ?? `Team ${i + 1}`;
    const iconOptions = TEAM_ICONS.map(
      (icon) => `
        <button
          type="button"
          class="picker-option picker-option--icon ${icon === defaultIcon ? "is-selected" : ""}"
          data-team-icon-option
          data-icon-value="${icon}"
          aria-label="Icon ${icon}"
        >${icon}</button>
      `
    ).join("");
    const row = document.createElement("div");
    row.className = "team-row";
    row.innerHTML = `
      <div class="team-row-fields">
        <label class="field">
          <input type="text" data-team-name value="${defaultName}" aria-label="Teamname" />
        </label>
        <div class="team-picker" data-picker="icon">
          <input type="hidden" data-team-icon value="${defaultIcon}" />
          <button
            type="button"
            class="picker-button picker-button--icon"
            data-team-icon-toggle
            aria-label="Teamicon wählen"
            aria-expanded="false"
          >${defaultIcon}</button>
          <div class="picker-panel" role="listbox" aria-label="Teamicon auswählen">
            ${iconOptions}
          </div>
        </div>
      </div>
    `;
    container.appendChild(row);
  }
}

function syncTeamsBetweenEditors(sourceContainer, targetContainer) {
  if (!sourceContainer || !targetContainer) return;
  const sourceRows = [...sourceContainer.querySelectorAll(".team-row")];
  const targetRows = [...targetContainer.querySelectorAll(".team-row")];
  if (sourceRows.length !== targetRows.length) return;

  sourceRows.forEach((sourceRow, index) => {
    const targetRow = targetRows[index];
    if (!targetRow) return;
    const name = sourceRow.querySelector("[data-team-name]")?.value ?? "";
    const icon = sourceRow.querySelector("[data-team-icon]")?.value ?? TEAM_ICONS[index % TEAM_ICONS.length];
    const targetNameInput = targetRow.querySelector("[data-team-name]");
    const targetPicker = targetRow.querySelector(".team-picker");
    if (targetNameInput) {
      targetNameInput.value = name;
    }
    if (targetPicker) {
      updatePickerSelection(targetPicker, icon);
    }
  });
}

function renderTeams(count) {
  renderTeamRows(teamListContainer, count);
  renderTeamRows(speedQuizTeamListContainer, count);
}

function clampTeamCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 2;
  return Math.min(4, Math.max(2, parsed));
}

function syncTeamCountControls(value) {
  const clamped = clampTeamCount(value);
  if (teamCountInput) {
    teamCountInput.value = clamped;
  }
  if (speedQuizTeamCountInput) {
    speedQuizTeamCountInput.value = clamped;
  }
  if (teamCountDecrease) {
    teamCountDecrease.disabled = clamped <= 2;
  }
  if (teamCountIncrease) {
    teamCountIncrease.disabled = clamped >= 4;
  }
  if (speedQuizTeamCountDecrease) {
    speedQuizTeamCountDecrease.disabled = clamped <= 2;
  }
  if (speedQuizTeamCountIncrease) {
    speedQuizTeamCountIncrease.disabled = clamped >= 4;
  }
  renderTeams(clamped);
}

function closeAllTeamPickers() {
  [teamListContainer, speedQuizTeamListContainer].forEach((container) => {
    if (!container) return;
    container.querySelectorAll(".team-picker.open").forEach((picker) => {
      picker.classList.remove("open");
      const toggle = picker.querySelector(".picker-button");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function getSelectedBoardSize(source) {
  if (!source) return "normal";
  if (source instanceof HTMLSelectElement) {
    return source.value || "normal";
  }
  const selected = [...source].find((input) => input.checked);
  return selected?.value ?? "normal";
}

function applyBoardSize(size) {
  const config = BOARD_CONFIGS[size] ?? BOARD_CONFIGS.normal;
  state.boardSize = size;
  state.boardDimensions = { rows: config.rows, cols: config.cols, total: config.total };
  state.positions = state.positions.map((pos) => Math.min(pos, config.total - 1));
  buildBoard();
  positionTokens();
}

function syncBoardSizeControls(size) {
  boardSizeInputs.forEach((input) => {
    input.checked = input.value === size;
  });
  if (boardSizeSelectGame) {
    boardSizeSelectGame.value = size;
  }
  if (boardSizeSelect) {
    boardSizeSelect.value = size;
  }
}

function updatePickerSelection(picker, value) {
  const hiddenInput = picker.querySelector("[data-team-icon]");
  const toggleButton = picker.querySelector("[data-team-icon-toggle]");
  const options = picker.querySelectorAll("[data-team-icon-option]");
  options.forEach((option) => option.classList.remove("is-selected"));
  const selectedOption = picker.querySelector(`[data-icon-value="${value}"]`);
  if (selectedOption) {
    selectedOption.classList.add("is-selected");
  }
  if (hiddenInput) {
    hiddenInput.value = value;
  }
  if (toggleButton) {
    toggleButton.textContent = value;
  }
}

function toggleTeamPicker(picker, toggleButton) {
  const isOpen = picker.classList.contains("open");
  closeAllTeamPickers();
  if (!isOpen) {
    picker.classList.add("open");
    if (toggleButton) {
      toggleButton.setAttribute("aria-expanded", "true");
    }
  }
}

function handleTeamListClick(event) {
  const iconToggle = event.target.closest("[data-team-icon-toggle]");
  if (iconToggle) {
    const picker = iconToggle.closest(".team-picker");
    if (picker) {
      toggleTeamPicker(picker, iconToggle);
    }
    return;
  }
  const iconOption = event.target.closest("[data-team-icon-option]");
  if (iconOption) {
    const picker = iconOption.closest(".team-picker");
    const value = iconOption.dataset.iconValue;
    if (picker && value) {
      updatePickerSelection(picker, value);
      closeAllTeamPickers();
      const sourceContainer = picker.closest("#team-list, #speedquiz-team-list");
      if (sourceContainer?.id === "team-list") {
        syncTeamsBetweenEditors(teamListContainer, speedQuizTeamListContainer);
      } else if (sourceContainer?.id === "speedquiz-team-list") {
        syncTeamsBetweenEditors(speedQuizTeamListContainer, teamListContainer);
      }
    }
  }
}

function buildBoard(categories = state.categories) {
  const existingTokens = [...board.querySelectorAll(".token")];
  board.innerHTML = "";
  const cells = [];
  const { rows, cols, total } = state.boardDimensions;
  board.style.setProperty("--board-cols", cols);
  board.style.setProperty("--board-rows", rows);
  const assignments = [];
  for (let index = 0; index < total; index += 1) {
    if (index === 0 || index === total - 1) {
      assignments[index] = null;
    } else if (categories.length > 0) {
      assignments[index] = categories[(index - 1) % categories.length];
    } else {
      assignments[index] = null;
    }
  }
  state.boardCategories = assignments;
  for (let row = 0; row < rows; row += 1) {
    const rowIndices = [];
    for (let col = 0; col < cols; col += 1) {
      const index = row % 2 === 0 ? row * cols + col : row * cols + (cols - 1 - col);
      rowIndices.push(index);
    }
    rowIndices.forEach((index) => {
      const cell = document.createElement("div");
      cell.className = `board-cell path alt-${index % 4}`;
      const card = document.createElement("div");
      card.className = "category-card";
      if (index === 0) {
        cell.classList.add("start");
        const startColor = getCardColor("Start");
        card.style.setProperty("--card-color", startColor);
        card.style.setProperty("--card-text-color", getReadableTextColor(startColor));
        const icon = document.createElement("span");
        icon.className = "category-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.style.setProperty("--icon-url", `url("${START_ICON_PATH}")`);
        card.append(icon);
        cell.append(card);
      } else if (index === total - 1) {
        cell.classList.add("goal");
        const goalColor = getCardColor("Ziel");
        card.style.setProperty("--card-color", goalColor);
        card.style.setProperty("--card-text-color", getReadableTextColor(goalColor));
        const icon = document.createElement("span");
        icon.className = "category-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.style.setProperty("--icon-url", `url("${GOAL_ICON_PATH}")`);
        card.append(icon);
        cell.append(card);
      } else {
        const category = assignments[index];
        if (category) {
          const visuals = CATEGORY_VISUALS[category];
          card.style.setProperty("--card-color", visuals?.color ?? "#ffffff");
          card.style.setProperty("--card-border-color", visuals?.borderColor ?? "var(--board-card-border)");
          card.style.setProperty("--card-text-color", getReadableTextColor(visuals?.color ?? "#ffffff"));
          const icon = document.createElement("span");
          icon.className = "category-icon";
          icon.setAttribute("aria-hidden", "true");
          applyCategoryIcon(icon, category, { allowFallback: true });
          card.appendChild(icon);
          cell.append(card);
          cell.dataset.category = category;
          cell.classList.add("has-category");
        }
      }
      cell.dataset.index = index;
      board.appendChild(cell);
      cells[index] = cell;
    });
  }
  renderBoardPath();
  existingTokens.forEach((token) => board.appendChild(token));
  return cells;
}

function renderBoardPath() {
  if (!board) return;
  board.querySelector(".board-path")?.remove();
  const totalCells = state.boardDimensions.total;
  if (totalCells < 2) return;

  const cells = [];
  for (let index = 0; index < totalCells; index += 1) {
    const cell = board.querySelector(`.board-cell[data-index="${index}"]`);
    if (!cell) continue;
    const card = cell.querySelector(".category-card");
    const reference = card ?? cell;
    cells.push({
      centerX: cell.offsetLeft + cell.offsetWidth / 2,
      centerY: cell.offsetTop + cell.offsetHeight / 2,
      width: reference.offsetWidth,
      height: reference.offsetHeight
    });
  }

  if (cells.length < 2) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("board-path");
  svg.setAttribute("viewBox", `0 0 ${board.clientWidth} ${board.clientHeight}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  for (let index = 0; index < cells.length - 1; index += 1) {
    const from = cells[index];
    const to = cells[index + 1];
    const dx = to.centerX - from.centerX;
    const dy = to.centerY - from.centerY;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) continue;

    const dirX = dx / distance;
    const dirY = dy / distance;
    const perpX = -dirY;
    const perpY = dirX;
    const arrowLength = Math.min(from.width / 3, Math.max(distance - from.width / 2 - to.width / 2 - 4, 12));
    const arrowWidth = from.height * 0.75;
    const midpointX = (from.centerX + to.centerX) / 2;
    const midpointY = (from.centerY + to.centerY) / 2;
    const tipX = midpointX + dirX * (arrowLength / 2);
    const tipY = midpointY + dirY * (arrowLength / 2);
    const baseX = tipX - dirX * arrowLength;
    const baseY = tipY - dirY * arrowLength;
    const leftX = baseX + perpX * (arrowWidth / 2);
    const leftY = baseY + perpY * (arrowWidth / 2);
    const rightX = baseX - perpX * (arrowWidth / 2);
    const rightY = baseY - perpY * (arrowWidth / 2);

    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrow.classList.add("board-arrow");
    arrow.setAttribute(
      "points",
      `${tipX.toFixed(2)},${tipY.toFixed(2)} ${leftX.toFixed(2)},${leftY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)}`
    );
    svg.appendChild(arrow);
  }

  board.appendChild(svg);
}

function createTokens(teamData) {
  board.querySelectorAll(".token").forEach((token) => token.remove());
  const teams = teamData.map((team) => ({ ...team }));
  state.positions = teams.map(() => 0);
  state.teams = teams;
  teams.forEach((team, index) => {
    const token = document.createElement("div");
    token.className = "token";
    token.dataset.team = index;
    token.dataset.icon = team.icon;
    const tokenIcon = document.createElement("span");
    tokenIcon.className = "token-icon";
    tokenIcon.textContent = team.icon;
    token.appendChild(tokenIcon);
    board.appendChild(token);
  });
  positionTokens();
}

function formatTeamLabel(teamIndex) {
  const team = state.teams[teamIndex];
  if (!team) return "Team";
  if (!team.icon) return team.name;
  return `${team.icon} ${team.name}`.trim();
}

function renderTeamStatus() {
  if (!teamStatusList) return;
  teamStatusList.innerHTML = "";
  state.teams.forEach((team, index) => {
    const item = document.createElement("div");
    item.className = "team-status-item";
    if (index === state.currentTeam && !state.gameOver) {
      item.classList.add("is-active");
    }
    const info = document.createElement("div");
    info.className = "team-status-info";
    const icon = document.createElement("span");
    icon.className = "team-status-icon";
    icon.textContent = team.icon || "🎯";
    if (isWaitingForRoll(index)) {
      icon.classList.add("is-waiting-roll");
    }
    const name = document.createElement("span");
    name.className = "team-status-name";
    name.textContent = team.name || `Team ${index + 1}`;
    info.append(icon, name);
    const position = document.createElement("div");
    position.className = "team-status-position";
    position.textContent = `Feld ${state.positions[index] + 1}`;
    item.append(info, position);
    teamStatusList.appendChild(item);
  });
}

function positionTokens() {
  state.positions.forEach((pos, index) => {
    const cell = board.querySelector(`.board-cell[data-index="${pos}"]`);
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const token = board.querySelector(`.token[data-team="${index}"]`);
    if (!token) return;
    const quadrantX = index % 2 === 0 ? 0.28 : 0.72;
    const quadrantY = index < 2 ? 0.28 : 0.72;
    token.style.left = `${rect.left - boardRect.left + rect.width * quadrantX}px`;
    token.style.top = `${rect.top - boardRect.top + rect.height * quadrantY}px`;
  });
  renderTeamStatus();
}

function showOverlay(content, duration = 800) {
  overlayContent.textContent = content;
  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("hidden"), duration);
}

function updateTimerDisplay(value) {
  turnTimer.textContent = `${value}s`;
}

function startTimer({ onTimeout } = {}) {
  clearInterval(state.timer);
  state.timer = null;
  state.remainingTime = state.timeLimit;
  updateTimerDisplay(state.remainingTime);
  state.timer = setInterval(() => {
    state.remainingTime -= 1;
    updateTimerDisplay(state.remainingTime);
    if (state.remainingTime <= 0) {
      clearInterval(state.timer);
      if (typeof onTimeout === "function") {
        onTimeout();
      } else {
        finishTurn(false, true, { returnToPrevious: true });
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timer);
  clearInterval(state.countdownTimer);
  state.timer = null;
  state.countdownTimer = null;
}

function showPenaltyToast(penalty) {
  if (!turnPenalty) return;
  turnPenalty.textContent = `-${penalty}s Strafzeit`;
  turnPenalty.classList.remove("show");
  void turnPenalty.offsetWidth;
  turnPenalty.classList.add("show");
}

function getCardByCategory(category) {
  const pool = state.cards.filter((card) => {
    if (category === "Quizfrage") {
      return card.category === "Quizfrage";
    }
    return card.category === category;
  });
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function setWordCard(card) {
  turnWord?.classList.remove("is-quiz-question");
  fullscreenCardOverlay.update({
    category: state.pendingCategory,
    term: card?.term ?? "Keine Karte",
    tabooTerms: card?.category === "Erklären" ? card.taboo : [],
    showHint: false,
  });
  turnAnswer?.classList.add("hidden");
  if (turnAnswer) {
    turnAnswer.textContent = "";
  }
  if (turnSingleChoiceOptions) {
    turnSingleChoiceOptions.innerHTML = "";
    turnSingleChoiceOptions.classList.add("hidden");
  }
}

function getSingleChoiceOptions(card) {
  const options = [card?.answer, ...(Array.isArray(card?.wrongAnswers) ? card.wrongAnswers : [])]
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean)
    .slice(0, 4);

  for (let index = options.length; index < 4; index += 1) {
    options.push(`Option ${index + 1}`);
  }

  for (let index = options.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [options[index], options[randomIndex]] = [options[randomIndex], options[index]];
  }
  return options;
}

function normalizeAnswerOption(value) {
  return String(value ?? "").trim().toLocaleLowerCase("de-DE");
}

function setSingleChoiceResult(optionButton, isCorrect, correctAnswer) {
  if (!turnSingleChoiceOptions) return;
  const optionButtons = [...turnSingleChoiceOptions.querySelectorAll(".single-choice-option-button")];
  optionButtons.forEach((button) => {
    button.disabled = true;
    button.classList.remove(
      "is-selected",
      "is-correct",
      "is-wrong",
      "is-animating",
      "is-correct-outline",
    );

    const buttonOption = normalizeAnswerOption(button.dataset.option ?? button.textContent);
    if (correctAnswer && buttonOption === correctAnswer) {
      button.classList.add("is-correct-outline");
    }
  });

  if (optionButton) {
    optionButton.classList.add("is-selected", "is-animating");
    if (!isCorrect) {
      optionButton.classList.add("is-wrong");
    }
  }

  stopTimer();
  state.quizPhase = "answer";
  state.singleChoiceResult = {
    isCorrect,
    returnToPrevious: !isCorrect,
  };
  turnSwapButton?.classList.add("hidden");
  if (turnContinueButton) {
    turnContinueButton.textContent = "Weiter";
    turnContinueButton.classList.remove("hidden");
  }
}


function setQuizQuestionCard(card) {
  turnWord?.classList.add("is-quiz-question");
  fullscreenCardOverlay.update({
    category: state.pendingCategory,
    term: card?.term ?? "Keine Quizfrage",
    tabooTerms: [],
    showHint: true,
  });
  if (turnAnswer) {
    turnAnswer.textContent = "";
    turnAnswer.classList.add("hidden");
  }
  if (turnSingleChoiceOptions) {
    turnSingleChoiceOptions.innerHTML = "";
    if (state.pendingCategory === "Single-Choice") {
      const options = getSingleChoiceOptions(card);
      options.forEach((option) => {
        const optionButton = document.createElement("button");
        optionButton.type = "button";
        optionButton.className = "single-choice-option-button";
        optionButton.dataset.option = option;
        optionButton.textContent = option;
        turnSingleChoiceOptions.append(optionButton);
      });
      turnSingleChoiceOptions.classList.remove("hidden");
    } else {
      turnSingleChoiceOptions.classList.add("hidden");
    }
  }
}

function setQuizAnswerCard(card) {
  turnWord?.classList.remove("is-quiz-question");
  const answerText = card?.answer || "Antwort fehlt.";
  fullscreenCardOverlay.update({
    category: state.pendingCategory,
    term: answerText,
    tabooTerms: [],
    showHint: false,
  });
  if (turnAnswer) {
    turnAnswer.textContent = "";
    turnAnswer.classList.add("hidden");
  }
  if (turnSingleChoiceOptions) {
    turnSingleChoiceOptions.innerHTML = "";
    turnSingleChoiceOptions.classList.add("hidden");
  }
}

function setTurnButtons({ showCorrect = true, showWrong = true, showSwap = true, showContinue = true } = {}) {
  turnCorrectButton?.classList.toggle("hidden", !showCorrect);
  turnWrongButton?.classList.toggle("hidden", !showWrong);
  turnSwapButton?.classList.toggle("hidden", !showSwap);
  turnContinueButton?.classList.toggle("hidden", !showContinue);
}

function setCategoryLabel(label, category = label) {
  turnCategoryLabel.textContent = label;
  const categoryColor = CATEGORY_VISUALS[category]?.color ?? getCardColor(category);
  const categoryTextColor = getReadableTextColor(categoryColor ?? "#F3E9D3");
  turnOverlayPanel?.style.setProperty("--category-panel-bg", categoryColor ?? "#F3E9D3");
  turnOverlayPanel?.style.setProperty("--category-panel-text", categoryTextColor);
  applyCategoryIcon(turnCategoryIcon, category, { allowFallback: true });
}

function setCategory(category) {
  setCategoryLabel(category, category);
}

function handleRoll() {
  if (state.pendingRoll !== null || state.timer || state.phase !== GAME_PHASES.IDLE || state.gameOver) {
    return;
  }

  statusText?.classList.add("hidden");
  rollButton?.classList.remove("dice--pulse");

  const roll = Math.floor(Math.random() * 6) + 1;
  state.pendingRoll = roll;
  renderTeamStatus();
  showDiceOverlay(roll);
  const previousPositions = [...state.positions];
  state.history.push({
    positions: previousPositions,
    team: state.currentTeam,
  });
  state.turnStartPositions = previousPositions;
  setTimeout(() => {
    moveToken(roll).then(() => {
      if (state.positions[state.currentTeam] >= state.boardDimensions.total - 1) {
        hideDiceOverlay();
        state.masterQuiz = true;
        state.pendingCategory = "Quizfrage";
        setCategoryLabel("Masterquizfrage", "Quizfrage");
        showTurnOverlay();
        return;
      }
      setTimeout(() => {
        const landingIndex = state.positions[state.currentTeam];
        const category = state.boardCategories[landingIndex] ?? state.categories[0];
        state.pendingCategory = category;
        setCategory(category);
        hideDiceOverlay();
        showTurnOverlay();
      }, 1000);
    });
  }, 600);
}

function moveToken(steps, teamIndex = state.currentTeam) {
  return new Promise((resolve) => {
    const token = board.querySelector(`.token[data-team="${teamIndex}"]`);
    let remaining = Math.abs(steps);
    const direction = steps >= 0 ? 1 : -1;
    const moveStep = () => {
      if (remaining === 0) {
        token.classList.remove("moving");
        resolve();
        return;
      }
      token.classList.add("moving");
      state.positions[teamIndex] = Math.max(
        0,
        Math.min(state.boardDimensions.total - 1, state.positions[teamIndex] + direction)
      );
      positionTokens();
      remaining -= 1;
      setTimeout(moveStep, 250);
    };
    moveStep();
  });
}

function computeMultiplier() {
  const ratio = state.remainingTime / state.timeLimit;
  if (ratio > 2 / 3) return 2;
  if (ratio > 1 / 3) return 1;
  return 0.5;
}

function finishTurn(isCorrect, timedOut = false, { returnToPrevious = false } = {}) {
  if (state.pendingRoll === null) return;
  stopTimer();
  const teamIndex = state.currentTeam;
  const wasMasterQuiz = state.masterQuiz;
  state.masterQuiz = false;
  if (returnToPrevious) {
    const targetPosition = state.turnStartPositions?.[teamIndex] ?? state.positions[teamIndex];
    state.pendingReturn = { teamIndex, targetPosition };
  }
  state.turnStartPositions = null;
  if (!isCorrect) {
    showOverlay("❌", 900);
  }
  hideTurnOverlay();
  state.pendingRoll = null;
  state.pendingCategory = null;
  state.currentCard = null;
  state.quizPhase = null;
  state.singleChoiceResult = null;
  if (wasMasterQuiz && isCorrect) {
    showWinner(formatTeamLabel(teamIndex));
    return;
  }
  state.currentTeam = (state.currentTeam + 1) % state.teams.length;
  setNextRollStatus(state.currentTeam);
  renderTeamStatus();
  if (returnToPrevious) {
    setTimeout(() => {
      if (state.pendingReturn?.teamIndex !== teamIndex) return;
      const targetPosition = state.pendingReturn.targetPosition ?? state.positions[teamIndex];
      state.pendingReturn = null;
      const stepsBack = state.positions[teamIndex] - targetPosition;
      if (stepsBack > 0) {
        moveToken(-stepsBack, teamIndex);
      }
    }, 750);
  }
}

function handleUndo() {
  const last = state.history.pop();
  if (!last) return;
  state.positions = last.positions;
  state.currentTeam = last.team;
  positionTokens();
  setStatusMessage(`Zug zurück: ${formatTeamLabel(state.currentTeam)} ist dran.`, { pulseDice: true });
  renderTeamStatus();
}

function handleStartGame() {
  const isMainMenuComplete = updateMainMenuRequiredSelectionState();
  if (!isMainMenuComplete) {
    return;
  }

  applySelectedDatasets();

  const selectedCategories = getSelectedCategories(menuCategoryControls);
  const selectedBoardSize = getSelectedBoardSize(boardSizeSelect ?? boardSizeInputs);
  syncBoardSizeControls(selectedBoardSize);
  state.categories = selectedCategories;
  state.categoryTimes = readCategoryTimes(menuCategoryControls);
  state.timeLimit = state.categoryTimes[selectedCategories[0]] ?? 60;
  state.swapPenalty = Number.parseInt(swapSelect.value, 10);
  applyBoardSize(selectedBoardSize);
  const teams = [...teamListContainer.querySelectorAll(".team-row")].map((row, index) => {
    const nameInput = row.querySelector("[data-team-name]");
    const iconSelect = row.querySelector("[data-team-icon]");
    const name = nameInput?.value.trim() || `Team ${index + 1}`;
    const icon = iconSelect?.value || TEAM_ICONS[0];
    return { name, icon };
  });
  createTokens(teams);
  showGamePanel();
  requestAnimationFrame(() => {
    renderBoardPath();
    positionTokens();
  });
  state.currentTeam = 0;
  state.pendingRoll = null;
  state.pendingCategory = null;
  state.gameOver = false;
  state.phase = GAME_PHASES.IDLE;
  winnerScreen.classList.add("hidden");
  turnOverlay.classList.add("hidden");
  turnOverlay.classList.remove("active", "expanded", "category");
  setNextRollStatus(state.currentTeam);
}

function normalizeCardInput(rawRow = {}) {
  const category = normalizeCategoryInput(rawRow.category);
  const term = String(rawRow.term ?? "").trim();
  const tabooCandidates = Array.isArray(rawRow.taboo)
    ? rawRow.taboo
    : [rawRow.answer, rawRow.tabu2, rawRow.tabu3, rawRow.tabu4];
  const normalizedTaboo = tabooCandidates.map((entry) => String(entry ?? "").trim()).filter(Boolean);

  if (isAnswerCardCategory(category)) {
    const answer = String(rawRow.answer ?? normalizedTaboo[0] ?? "").trim();
    const wrongAnswers = normalizedTaboo.slice(1, 4);
    return {
      category,
      term,
      answer,
      wrongAnswers,
      taboo: [],
    };
  }

  return {
    category,
    term,
    taboo: normalizedTaboo,
  };
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split(";");
    const [category = "", term = "", ...rest] = parts;
    return {
      category,
      term,
      answer: rest[0] ?? "",
      taboo: rest,
    };
  });
}

function cloneCards(cards) {
  return cards.map((card) => ({
    ...card,
    taboo: Array.isArray(card.taboo) ? [...card.taboo] : [],
    wrongAnswers: Array.isArray(card.wrongAnswers) ? [...card.wrongAnswers] : [],
  }));
}

function withQuestionIds(cards, datasetKey) {
  return cloneCards(cards).map((card, index) => ({
    ...card,
    questionId: `${datasetKey}:${index + 1}`,
  }));
}

let cardEditorRowCounter = 0;

function validateEditorCards(rows) {
  const cards = [];
  const errors = [];

  rows.forEach((rawRow, index) => {
    const normalized = normalizeCardInput(rawRow);
    const rowErrors = [];

    if (!normalized.category) {
      rowErrors.push("Kategorie ist erforderlich");
    } else if (!ALLOWED_CARD_CATEGORIES.includes(normalized.category)) {
      rowErrors.push(`Ungültige Kategorie "${normalized.category}"`);
    }

    if (!normalized.term) {
      rowErrors.push("Begriff/Frage ist erforderlich");
    }

    if (isAnswerCardCategory(normalized.category) && !normalized.answer) {
      rowErrors.push("Antwort ist für Quizfrage/Vokabel/Single-Choice erforderlich");
    }

    if (normalized.category === "Single-Choice" && (!Array.isArray(normalized.wrongAnswers) || normalized.wrongAnswers.length < 3)) {
      rowErrors.push("Für Single-Choice sind drei falsche Antworten erforderlich");
    }

    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, messages: rowErrors });
      return;
    }

    cards.push(normalized);
  });

  return { cards, errors };
}

function collectRawCardsFromEditor() {
  if (!cardEditorBody) return [];
  return [...cardEditorBody.querySelectorAll("tr[data-row-id]")].map((row) => ({
    category: row.querySelector('[data-field="category"]')?.value ?? "",
    term: row.querySelector('[data-field="term"]')?.value ?? "",
    answer: row.querySelector('[data-field="answer"]')?.value ?? "",
    tabu2: row.querySelector('[data-field="tabu2"]')?.value ?? "",
    tabu3: row.querySelector('[data-field="tabu3"]')?.value ?? "",
    tabu4: row.querySelector('[data-field="tabu4"]')?.value ?? "",
  }));
}

function renderEditorValidationErrors(errors) {
  if (cardEditorSaveButton) {
    cardEditorSaveButton.disabled = errors.length > 0;
  }
  if (!cardEditorErrors) return;

  if (errors.length === 0) {
    cardEditorErrors.innerHTML = "";
    cardEditorErrors.classList.add("hidden");
    return;
  }

  const errorList = errors.map((error) => `<li>Zeile ${error.row}: ${error.messages.join(", ")}</li>`).join("");
  cardEditorErrors.innerHTML = `<ul>${errorList}</ul>`;
  cardEditorErrors.classList.remove("hidden");
}

function updateEditorValidationState() {
  const { cards, errors } = validateEditorCards(collectRawCardsFromEditor());
  renderEditorValidationErrors(errors);
  return { cards, errors };
}

function createCategorySelect(selectedCategory = "Erklären") {
  const select = document.createElement("select");
  select.dataset.field = "category";
  ALLOWED_CARD_CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (category === selectedCategory) {
      option.selected = true;
    }
    select.append(option);
  });
  return select;
}

function createEditorInput(field, value = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.dataset.field = field;
  input.value = value;
  return input;
}

function createEditorRow(card = {}) {
  const rowId = `card-row-${cardEditorRowCounter++}`;
  const row = document.createElement("tr");
  row.dataset.rowId = rowId;

  const category = ALLOWED_CARD_CATEGORIES.includes(card.category) ? card.category : "Erklären";
  const taboos = Array.isArray(card.taboo) ? card.taboo : [];
  const wrongAnswers = Array.isArray(card.wrongAnswers) ? card.wrongAnswers : [];
  const answerOrTabu = isAnswerCardCategory(category) ? card.answer ?? "" : taboos[0] ?? "";

  const columns = [
    createCategorySelect(category),
    createEditorInput("term", card.term ?? ""),
    createEditorInput("answer", answerOrTabu),
    createEditorInput("tabu2", category === "Single-Choice" ? wrongAnswers[0] ?? "" : taboos[1] ?? ""),
    createEditorInput("tabu3", category === "Single-Choice" ? wrongAnswers[1] ?? "" : taboos[2] ?? ""),
    createEditorInput("tabu4", category === "Single-Choice" ? wrongAnswers[2] ?? "" : taboos[3] ?? ""),
  ];

  columns.forEach((element) => {
    const cell = document.createElement("td");
    cell.append(element);
    row.append(cell);
  });

  const actionCell = document.createElement("td");
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "ghost card-editor-remove";
  removeButton.textContent = "Entfernen";
  removeButton.addEventListener("click", () => removeEditorRow(rowId));
  actionCell.append(removeButton);
  row.append(actionCell);

  return row;
}

function renderCardEditorRows(cards) {
  if (!cardEditorBody) return;
  cardEditorBody.innerHTML = "";
  const normalizedCards = cards.length > 0 ? cards : [{ category: "Erklären", term: "", taboo: [] }];
  normalizedCards.forEach((card) => {
    cardEditorBody.append(createEditorRow(card));
  });
}

function addEditorRow() {
  if (!cardEditorBody) return;
  cardEditorBody.append(createEditorRow({ category: "Erklären", term: "", taboo: [] }));
  updateEditorValidationState();
}

function removeEditorRow(rowId) {
  if (!cardEditorBody) return;
  const row = cardEditorBody.querySelector(`[data-row-id="${rowId}"]`);
  row?.remove();
  if (!cardEditorBody.querySelector("tr[data-row-id]")) {
    addEditorRow();
    return;
  }
  updateEditorValidationState();
}

function openCardEditor() {
  if (!requireFullAccess() || !cardEditorModal) return;
  renderCardEditorRows(cloneCards(state.cards));
  updateEditorValidationState();
  refreshEditorCustomDatasetSelect(cardEditorDatasetSelect?.value ?? "");
  cardEditorModal.classList.remove("hidden");
}

function closeCardEditor() {
  if (!cardEditorModal) return;
  cardEditorModal.classList.add("hidden");
  renderEditorValidationErrors([]);
}

function saveCardEditor() {
  const { cards, errors } = updateEditorValidationState();
  if (errors.length > 0) {
    csvStatus.textContent = "Editor enthält ungültige Zeilen.";
    return;
  }
  state.cards = cards;
  csvStatus.textContent = `Editor: ${cards.length} Karten.`;
  closeCardEditor();
}

function refreshEditorCustomDatasetSelect(selectedId = "") {
  if (!cardEditorDatasetSelect) return;
  populateCustomDatasetSelect(cardEditorDatasetSelect, {
    selectedId,
    placeholder: "Eigenen Kartensatz auswählen",
  });
}

function populateCustomDatasetSelect(selectElement, { selectedId = "", placeholder = "Kartensatz auswählen" } = {}) {
  if (!selectElement) return;
  selectElement.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  selectElement.append(placeholderOption);

  Object.values(state.customDatasets)
    .sort((a, b) => a.label.localeCompare(b.label, "de"))
    .forEach((dataset) => {
      const option = document.createElement("option");
      option.value = dataset.id;
      option.textContent = dataset.label;
      selectElement.append(option);
    });

  selectElement.value = state.customDatasets[selectedId] ? selectedId : "";
}

function deriveDatasetLabelFromFilename(filename = "") {
  const trimmed = String(filename ?? "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/\.[^/.]+$/, "").trim();
}

function getDisplayDatasetName(fileName = "") {
  return deriveDatasetLabelFromFilename(fileName) || fileName;
}

function updateCsvDatasetActionState() {
  const hasUploadedCards = state.uploadedCsvCards.length > 0;
  if (csvSaveNewButton) {
    csvSaveNewButton.disabled = !hasUploadedCards;
  }
  if (csvOverwriteButton) {
    const canOverwrite = hasUploadedCards && Boolean(csvOverwriteSelect?.value && state.customDatasets[csvOverwriteSelect.value]);
    csvOverwriteButton.disabled = !canOverwrite;
  }
}

function refreshCsvDatasetOverwriteSelect(selectedId = "") {
  populateCustomDatasetSelect(csvOverwriteSelect, {
    selectedId,
    placeholder: "Bestehenden eigenen Kartensatz auswählen",
  });
  updateCsvDatasetActionState();
}

async function saveCardsAsCustomDataset({ cards, label, existingId = "" }) {
  const normalizedLabel = String(label ?? "").trim();
  if (!normalizedLabel) {
    return { ok: false, message: "Bitte einen Namen für den Kartensatz eingeben." };
  }

  const normalizedCards = cloneCards(cards).map((card) => normalizeCardInput(card)).filter((card) => card.term);
  if (normalizedCards.length === 0) {
    return { ok: false, message: "Kartensatz ist leer oder ungültig." };
  }

  const now = new Date().toISOString();
  const existingDataset = existingId ? state.customDatasets[existingId] : null;
  const datasetId = existingDataset?.id ?? createCustomDatasetId();
  const wasOverwrite = Boolean(existingDataset);

  state.customDatasets[datasetId] = {
    id: datasetId,
    label: normalizedLabel,
    cards: normalizedCards,
    createdAt: existingDataset?.createdAt ?? now,
    updatedAt: now,
    version: existingDataset?.version ?? 1,
  };

  const persistenceResult = await persistCustomDatasets({
    operation: "upsert",
    datasetId,
    previousDataset: existingDataset,
  });
  if (!persistenceResult.ok && persistenceResult.authRequired) {
    if (existingDataset) {
      state.customDatasets[datasetId] = existingDataset;
    } else {
      delete state.customDatasets[datasetId];
    }
    return {
      ok: false,
      message: persistenceResult.message,
      persistenceResult,
    };
  }
  if (!persistenceResult.ok && persistenceResult.conflict) {
    if (persistenceResult.serverDataset) {
      state.customDatasets[datasetId] = persistenceResult.serverDataset;
    }
    refreshEditorCustomDatasetSelect(datasetId);
    refreshCsvDatasetOverwriteSelect(datasetId);
    refreshDatasetSelections();
    return {
      ok: false,
      message: "Der Kartensatz wurde in der Zwischenzeit geändert. Bitte neu laden und erneut speichern.",
      persistenceResult,
    };
  }

  state.selectedDatasets = [toCustomDatasetKey(datasetId)];
  refreshEditorCustomDatasetSelect(datasetId);
  refreshCsvDatasetOverwriteSelect(datasetId);
  refreshDatasetSelections();

  return {
    ok: true,
    datasetId,
    label: normalizedLabel,
    count: normalizedCards.length,
    wasOverwrite,
    persistenceResult,
  };
}

function createCustomDatasetId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `dataset-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

async function saveEditorAsNewDataset() {
  if (!requireFullAccess()) return;
  const { cards, errors } = updateEditorValidationState();
  if (errors.length > 0) {
    csvStatus.textContent = "Editor enthält ungültige Zeilen.";
    return;
  }

  const label = cardEditorDatasetLabelInput?.value?.trim();
  if (!label) {
    csvStatus.textContent = "Bitte einen Namen für den neuen Kartensatz eingeben.";
    return;
  }

  const result = await saveCardsAsCustomDataset({ cards, label });
  if (!result.ok) {
    csvStatus.textContent = result.message;
    if (result.persistenceResult?.authRequired) {
      redirectToLogin();
    }
    return;
  }

  if (cardEditorDatasetLabelInput) {
    cardEditorDatasetLabelInput.value = result.label;
  }
  if (result.persistenceResult.mode === "remote") {
    csvStatus.textContent = `Kartensatz global gespeichert: ${result.label} (${result.count} Karten).`;
  } else {
    csvStatus.textContent = `Eigener Kartensatz lokal gespeichert: ${result.label} (${result.count} Karten).`;
  }
}

async function overwriteSelectedCustomDataset() {
  if (!requireFullAccess()) return;
  const { cards, errors } = updateEditorValidationState();
  if (errors.length > 0) {
    csvStatus.textContent = "Editor enthält ungültige Zeilen.";
    return;
  }

  const selectedId = cardEditorDatasetSelect?.value ?? "";
  const existingDataset = state.customDatasets[selectedId];
  if (!existingDataset) {
    csvStatus.textContent = "Bitte zuerst einen vorhandenen eigenen Kartensatz auswählen.";
    return;
  }

  const nextLabel = cardEditorDatasetLabelInput?.value?.trim() || existingDataset.label;
  const result = await saveCardsAsCustomDataset({ cards, label: nextLabel, existingId: selectedId });
  if (!result.ok) {
    csvStatus.textContent = result.message;
    if (result.persistenceResult?.authRequired) {
      redirectToLogin();
    }
    return;
  }

  if (cardEditorDatasetLabelInput) {
    cardEditorDatasetLabelInput.value = nextLabel;
  }
  if (result.persistenceResult.mode === "remote") {
    csvStatus.textContent = `Kartensatz global überschrieben: ${nextLabel} (${result.count} Karten).`;
  } else {
    csvStatus.textContent = `Kartensatz lokal überschrieben: ${nextLabel} (${result.count} Karten).`;
  }
}

async function deleteSelectedCustomDataset() {
  if (!requireFullAccess()) return;
  const selectedId = cardEditorDatasetSelect?.value ?? "";
  const dataset = state.customDatasets[selectedId];
  if (!dataset) {
    csvStatus.textContent = "Bitte zuerst einen eigenen Kartensatz auswählen.";
    return;
  }

  const shouldDelete = window.confirm(`Kartensatz „${dataset.label}“ wirklich löschen?`);
  if (!shouldDelete) {
    return;
  }

  delete state.customDatasets[selectedId];
  const persistenceResult = await persistCustomDatasets({
    operation: "delete",
    datasetId: selectedId,
    previousDataset: dataset,
  });
  if (!persistenceResult.ok && persistenceResult.authRequired) {
    state.customDatasets[selectedId] = dataset;
    csvStatus.textContent = persistenceResult.message;
    redirectToLogin();
    refreshEditorCustomDatasetSelect(selectedId);
    refreshCsvDatasetOverwriteSelect(selectedId);
    refreshDatasetSelections();
    return;
  }
  if (!persistenceResult.ok && persistenceResult.conflict) {
    csvStatus.textContent = "Löschen fehlgeschlagen: Kartensatz wurde bereits geändert.";
    refreshEditorCustomDatasetSelect(selectedId);
    refreshCsvDatasetOverwriteSelect(selectedId);
    refreshDatasetSelections();
    return;
  }
  refreshEditorCustomDatasetSelect("");
  refreshCsvDatasetOverwriteSelect("");
  if (cardEditorDatasetLabelInput) {
    cardEditorDatasetLabelInput.value = "";
  }
  refreshDatasetSelections();
  csvStatus.textContent =
    persistenceResult.mode === "remote"
      ? `Kartensatz global gelöscht: ${dataset.label}.`
      : `Kartensatz lokal gelöscht: ${dataset.label}.`;
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "").replace(/\r?\n/g, " ").trim();
  if (/[;"\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

function exportEditorCardsAsCsv() {
  const { cards, errors } = updateEditorValidationState();
  if (errors.length > 0) {
    csvStatus.textContent = "Export nicht möglich: Editor enthält ungültige Zeilen.";
    return;
  }

  const lines = cards.map((card) => {
    const taboos = Array.isArray(card.taboo) ? [...card.taboo] : [];
    const wrongAnswers = Array.isArray(card.wrongAnswers) ? [...card.wrongAnswers] : [];
    const firstTabooOrAnswer = isAnswerCardCategory(card.category) ? card.answer ?? "" : taboos[0] ?? "";
    const values = [
      card.category,
      card.term,
      firstTabooOrAnswer,
      card.category === "Single-Choice" ? wrongAnswers[0] ?? "" : taboos[1] ?? "",
      card.category === "Single-Choice" ? wrongAnswers[1] ?? "" : taboos[2] ?? "",
      card.category === "Single-Choice" ? wrongAnswers[2] ?? "" : taboos[3] ?? "",
    ];
    return values.map(escapeCsvValue).join(";");
  });

  const csvContent = `\uFEFF${lines.join("\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const filenameBase = cardEditorDatasetLabelInput?.value?.trim() || "wissivity-kartensatz";
  link.download = `${filenameBase.replace(/\s+/g, "-").toLowerCase()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  csvStatus.textContent = `CSV exportiert: ${cards.length} Karten.`;
}

function createDatasetSelect(currentKey = "") {
  const select = document.createElement("select");
  select.className = "dataset-select";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Kartensatz wählen";
  select.append(placeholderOption);

  getAllDatasetEntries().forEach(({ key, label }) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    select.append(option);
  });

  if (getDatasetEntryByKey(currentKey)) {
    select.value = currentKey;
  } else {
    select.value = "";
  }

  return select;
}

function createDatasetSelectRow(currentKey = "") {
  const row = document.createElement("div");
  row.className = "dataset-select-row";

  const select = createDatasetSelect(currentKey);
  row.append(select);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "dataset-remove-button";
  removeButton.setAttribute("aria-label", "Kartensatz entfernen");
  removeButton.textContent = "−";
  removeButton.addEventListener("click", () => {
    row.remove();
    applySelectedDatasets();
    updateDatasetRowControls();
    updateMainMenuRequiredSelectionState();
  });
  row.append(removeButton);

  return { row, select, removeButton };
}

function updateDatasetRowControls() {
  if (!datasetSelectList) {
    return;
  }

  const rows = [...datasetSelectList.querySelectorAll(".dataset-select-row")];
  const canRemove = rows.length > 1;
  rows.forEach((row) => {
    const removeButton = row.querySelector(".dataset-remove-button");
    if (!removeButton) {
      return;
    }
    removeButton.disabled = !canRemove;
    removeButton.hidden = !canRemove;
  });

  updateDatasetAddButtonVisibility();
}

function updateDatasetAddButtonVisibility() {
  if (datasetSelect) {
    return;
  }
  if (!datasetAddButton || !datasetSelectList) return;
  const hasCapacity = datasetSelectList.querySelectorAll("select").length < MAX_DATASET_SELECTIONS;
  const allSelected = [...datasetSelectList.querySelectorAll("select")].every((select) => getDatasetEntryByKey(select.value));
  const canAdd = hasCapacity && allSelected;
  datasetAddButton.disabled = !canAdd;
  datasetAddButton.hidden = !canAdd;
  datasetAddButton.style.display = canAdd ? "inline-grid" : "none";
}

function readSelectedDatasetKeys() {
  if (datasetSelect) {
    return getDatasetEntryByKey(datasetSelect.value) ? [datasetSelect.value] : [];
  }

  if (!datasetSelectList) {
    return [DEFAULT_DATASET_KEY];
  }

  const keys = [...datasetSelectList.querySelectorAll("select")]
    .map((select) => select.value)
    .filter((key) => getDatasetEntryByKey(key));

  return keys;
}

function applySelectedDatasets() {
  const selectedKeys = readSelectedDatasetKeys();
  state.selectedDatasets = [...selectedKeys];

  const mergedCards = selectedKeys.flatMap((key) => {
    const datasetEntry = getDatasetEntryByKey(key);
    return datasetEntry ? withQuestionIds(datasetEntry.cards, key) : [];
  });

  state.cards = mergedCards;

  if (selectedKeys.length > 0) {
    const labels = selectedKeys
      .map((key) => getDatasetEntryByKey(key)?.label)
      .filter(Boolean)
      .join(" + ");
    csvStatus.textContent = `${labels}: ${state.cards.length} Karten.`;
  } else if (csvStatus?.textContent === "Bitte mindestens einen Kartensatz wählen.") {
    csvStatus.textContent = "";
  }

  if (csvUpload) {
    csvUpload.value = "";
  }
  if (storageDatasetSelect && selectedKeys.length > 0) {
    storageDatasetSelect.value = "";
  }
}

function addDatasetSelect(initialKey = "") {
  if (!datasetSelectList) {
    return;
  }

  const currentCount = datasetSelectList.querySelectorAll("select").length;
  if (currentCount >= MAX_DATASET_SELECTIONS) {
    return;
  }

  const { row, select } = createDatasetSelectRow(initialKey);
  select.addEventListener("change", () => {
    applySelectedDatasets();
    updateDatasetRowControls();
    updateMainMenuRequiredSelectionState();
  });
  datasetSelectList.append(row);
  applySelectedDatasets();
  updateDatasetRowControls();
  updateMainMenuRequiredSelectionState();
}

function populateMainDatasetSelect() {
  if (!datasetSelect) {
    return;
  }

  const availableDatasets = getAllDatasetEntries();
  const preferredKey =
    state.selectedDatasets.find((key) => getDatasetEntryByKey(key)) ??
    (getDatasetEntryByKey(datasetSelect.value) ? datasetSelect.value : "");

  datasetSelect.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Kartensatz wählen";
  datasetSelect.append(placeholderOption);

  availableDatasets.forEach(({ key, label }) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    datasetSelect.append(option);
  });

  const nextKey = getDatasetEntryByKey(preferredKey) ? preferredKey : "";
  datasetSelect.value = nextKey;
}

function setupDatasetSelects() {
  if (datasetSelect) {
    populateMainDatasetSelect();
    return;
  }

  if (!datasetSelectList) return;
  datasetSelectList.innerHTML = "";

  if (state.selectedDatasets.length === 0) {
    addDatasetSelect("");
    return;
  }

  state.selectedDatasets.forEach((key) => {
    addDatasetSelect(key);
  });

  updateDatasetRowControls();
}

function ensureSpeedQuizDefaults() {
  const firstAvailableDatasetKey = getAllDatasetEntries()[0]?.key ?? "";
  if (!getDatasetEntryByKey(state.speedQuiz.selectedDataset)) {
    state.speedQuiz.selectedDataset = firstAvailableDatasetKey;
  }
  const validCategories = state.speedQuiz.selectedCategories.filter((category) =>
    ALLOWED_CARD_CATEGORIES.includes(category)
  );
  state.speedQuiz.selectedCategories = validCategories.length > 0
    ? validCategories
    : [...ALLOWED_CARD_CATEGORIES];
}

function renderSpeedQuizDatasetOptions() {
  if (!speedQuizDatasetSelect) return;

  ensureSpeedQuizDefaults();
  const availableDatasets = getAllDatasetEntries();
  speedQuizDatasetSelect.innerHTML = "";

  availableDatasets.forEach(({ key, label }) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    speedQuizDatasetSelect.append(option);
  });

  speedQuizDatasetSelect.value = state.speedQuiz.selectedDataset;
}

function renderSpeedQuizCategoryOptions() {
  if (!speedQuizCategoriesContainer) return;

  ensureSpeedQuizDefaults();
  speedQuizCategoriesContainer.innerHTML = "";

  ALLOWED_CARD_CATEGORIES.forEach((category) => {
    const categoryButton = document.createElement("button");
    const isSelected = state.speedQuiz.selectedCategories.includes(category);
    const visuals = CATEGORY_VISUALS[category];
    categoryButton.type = "button";
    categoryButton.className = "speedquiz-category-button";
    categoryButton.dataset.categoryLabel = category;
    categoryButton.setAttribute("aria-label", category);
    categoryButton.setAttribute("aria-pressed", String(isSelected));
    categoryButton.classList.toggle("is-selected", isSelected);
    categoryButton.style.setProperty("--category-color", visuals?.color ?? "#F3E9D3");

    const icon = document.createElement("span");
    icon.className = "category-icon";
    applyCategoryIcon(icon, category, { allowFallback: true });
    categoryButton.append(icon);

    categoryButton.addEventListener("click", () => {
      const selectedCategories = state.speedQuiz.selectedCategories.includes(category)
        ? state.speedQuiz.selectedCategories.filter((item) => item !== category)
        : [...state.speedQuiz.selectedCategories, category];
      state.speedQuiz.selectedCategories = selectedCategories.length > 0
        ? selectedCategories
        : [...ALLOWED_CARD_CATEGORIES];
      renderSpeedQuizCategoryOptions();
    });

    speedQuizCategoriesContainer.append(categoryButton);
  });
}

const CSV_FILES_API_ENDPOINT = "/csv-files";
const CSV_MAX_SIZE_BYTES = 1024 * 1024;


function setStorageSelectOptions(files = []) {
  if (!storageDatasetSelect) return;

  storageDatasetSelect.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";

  if (!Array.isArray(files) || files.length === 0) {
    placeholderOption.textContent = "Keine Kartensets verfügbar";
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    storageDatasetSelect.append(placeholderOption);
    return;
  }

  placeholderOption.textContent = "Kartenset aus Storage auswählen";
  placeholderOption.selected = true;
  storageDatasetSelect.append(placeholderOption);

  files.forEach((file) => {
    const option = document.createElement("option");
    option.value = file.name;
    option.textContent = getDisplayDatasetName(file.name);
    storageDatasetSelect.append(option);
  });
}

function isSelectableStorageDataset(item) {
  const rawName = String(item?.name ?? "").trim();
  const normalizedName = rawName.toLowerCase();
  if (!rawName || rawName.endsWith("/")) {
    return false;
  }
  if (normalizedName === "emptyfolder" || normalizedName === ".emptyfolderplaceholder") {
    return false;
  }
  return true;
}

function sanitizeUploadFileName(name) {
  return (
    name
      .trim()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "") || "file.csv"
  );
}

function isValidCsvUpload(file) {
  const lowerName = file?.name?.toLowerCase?.() ?? "";
  const hasCsvExtension = lowerName.endsWith(".csv");
  const allowedMimeTypes = new Set(["text/csv", "application/vnd.ms-excel", ""]);
  return hasCsvExtension && allowedMimeTypes.has(file?.type ?? "");
}

function parseStorageCsvToCards(csvText) {
  const parsedRows = parseCsv(csvText);
  return parsedRows
    .map((row) => normalizeCardInput(row))
    .filter((card) => {
      if (!card.term || !ALLOWED_CARD_CATEGORIES.includes(card.category)) {
        return false;
      }
      if (card.category === "Single-Choice") {
        return Boolean(card.answer) && Array.isArray(card.wrongAnswers) && card.wrongAnswers.length >= 3;
      }
      if (isAnswerCardCategory(card.category)) {
        return Boolean(card.answer);
      }
      if (card.category === "Erklären") {
        return Array.isArray(card.taboo) && card.taboo.length > 0;
      }
      return true;
    });
}


async function refreshPublicCsvList() {
  if (!isLoggedIn) {
    setStorageSelectOptions([]);
    return;
  }
  if (csvStatus) {
    csvStatus.textContent = "Lade Dateiliste ...";
  }

  try {
    const response = await fetch(CSV_FILES_API_ENDPOINT, {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    ensureAuthorizedResponse(response, "Laden der Storage-Dateiliste");
    if (!response.ok) {
      throw new Error(`Dateiliste konnte nicht geladen werden (HTTP ${response.status}).`);
    }
    const data = await response.json();

    const sortedFiles = [...(data || [])]
      .filter((item) => isSelectableStorageDataset(item))
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    setStorageSelectOptions(sortedFiles);
    if (csvStatus) {
      csvStatus.textContent = `${sortedFiles.length} hochgeladene Datei(en) verfügbar.`;
    }
  } catch (error) {
    if (error?.isAuthError) {
      if (csvStatus) {
        csvStatus.textContent = error.message;
      }
      if (error.shouldRedirect) {
        redirectToLogin();
      }
      return;
    }
    if (csvStatus) {
      csvStatus.textContent = `Fehler beim Laden der Dateiliste: ${error?.message || String(error)}`;
    }
  }
}

async function loadStorageDataset(objectName) {
  if (!requireFullAccess()) return;
  const selectedName = String(objectName || "").trim();
  if (!selectedName) {
    return;
  }

  const datasetLabel = getDisplayDatasetName(selectedName);

  try {
    if (csvStatus) {
      csvStatus.textContent = `Lade Kartenset aus Storage: ${datasetLabel} ...`;
    }

    const response = await fetch(`${CSV_FILES_API_ENDPOINT}/${encodeURIComponent(selectedName)}`, {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    ensureAuthorizedResponse(response, "Laden eines Storage-Kartensets");
    if (!response.ok) {
      throw new Error(`CSV-Abruf fehlgeschlagen (HTTP ${response.status}).`);
    }

    const csvText = await response.text();
    const cards = parseStorageCsvToCards(csvText);

    if (cards.length === 0) {
      throw new Error("CSV enthält keine gültigen Karten.");
    }

    const storageKey = toStorageDatasetKey(selectedName);
    state.storageDatasets[selectedName] = cloneCards(cards);
    const nextSelectedDatasets = new Set(state.selectedDatasets);
    nextSelectedDatasets.add(storageKey);
    state.selectedDatasets = [...nextSelectedDatasets].slice(0, MAX_DATASET_SELECTIONS);
    state.uploadedCsvCards = cloneCards(cards);

    refreshDatasetSelections();
    updateDatasetAddButtonVisibility();

    console.log("Storage CSV Vorschau (erste 200 Zeichen):", csvText.slice(0, 200));

    if (csvStatus) {
      csvStatus.textContent = `${datasetLabel}: ${cards.length} Karten aus Storage geladen.`;
    }
    if (csvDatasetNameInput) {
      csvDatasetNameInput.value = datasetLabel;
    }
  } catch (error) {
    if (error?.isAuthError) {
      if (csvStatus) {
        csvStatus.textContent = error.message;
      }
      if (error.shouldRedirect) {
        redirectToLogin();
      }
      return;
    }
    if (csvStatus) {
      csvStatus.textContent = `Fehler beim Laden des Storage-Kartensets: ${error?.message || String(error)}`;
    }
  }
}

async function handleCsvUpload() {
  if (!requireFullAccess()) return;
  const file = csvUpload?.files?.[0];
  if (!file) {
    if (csvStatus) csvStatus.textContent = "Bitte zuerst eine CSV-Datei auswählen.";
    return;
  }

  if (!isValidCsvUpload(file)) {
    if (csvStatus) csvStatus.textContent = "Ungültige Datei. Erlaubt ist nur .csv.";
    return;
  }

  if (file.size > CSV_MAX_SIZE_BYTES) {
    if (csvStatus) csvStatus.textContent = "Datei ist zu groß. Maximal 1 MB erlaubt.";
    return;
  }

  const safeName = sanitizeUploadFileName(file.name);
  const uploadName = safeName;
  const derivedLabel = getDisplayDatasetName(file.name);

  try {
    csvUploadButton && (csvUploadButton.disabled = true);
    if (csvStatus) csvStatus.textContent = "Upload läuft ...";

    const csvText = await file.text();
    const response = await fetch(CSV_FILES_API_ENDPOINT, {
      method: "POST",
      headers: await getAuthHeaders({ includeContentType: true }),
      body: JSON.stringify({
        name: uploadName,
        content: csvText,
      }),
    });
    ensureAuthorizedResponse(response, "CSV-Upload");

    if (!response.ok) {
      throw new Error(`Upload fehlgeschlagen (HTTP ${response.status}).`);
    }

    if (csvUpload) {
      csvUpload.value = "";
    }
    if (csvDatasetNameInput) {
      csvDatasetNameInput.value = derivedLabel;
    }
    if (csvStatus) {
      csvStatus.textContent = `Upload erfolgreich: ${derivedLabel}`;
    }

    await refreshPublicCsvList();
    if (storageDatasetSelect) {
      storageDatasetSelect.value = uploadName;
    }
    await loadStorageDataset(uploadName);
  } catch (error) {
    if (error?.isAuthError) {
      if (csvStatus) {
        csvStatus.textContent = error.message;
      }
      if (error.shouldRedirect) {
        redirectToLogin();
      }
      return;
    }
    if (csvStatus) {
      csvStatus.textContent = `Upload-Fehler: ${error?.message || String(error)}`;
    }
  } finally {
    csvUploadButton && (csvUploadButton.disabled = false);
  }
}

async function saveUploadedCsvAsNewDataset() {
  if (!requireFullAccess()) return;
  const label = csvDatasetNameInput?.value?.trim() || "";
  const result = await saveCardsAsCustomDataset({ cards: state.uploadedCsvCards, label });
  if (!result.ok) {
    csvStatus.textContent = result.message;
    if (result.persistenceResult?.authRequired) {
      redirectToLogin();
    }
    return;
  }
  refreshCsvDatasetOverwriteSelect(result.datasetId);
  csvStatus.textContent =
    result.persistenceResult.mode === "remote"
      ? `CSV global gespeichert: ${result.label} (${result.count} Karten).`
      : `CSV lokal gespeichert: ${result.label} (${result.count} Karten).`;
}

async function overwriteDatasetWithUploadedCsv() {
  if (!requireFullAccess()) return;
  const selectedId = csvOverwriteSelect?.value ?? "";
  const existingDataset = state.customDatasets[selectedId];
  if (!existingDataset) {
    csvStatus.textContent = "Bitte zuerst einen vorhandenen eigenen Kartensatz auswählen.";
    return;
  }

  const label = csvDatasetNameInput?.value?.trim() || existingDataset.label;
  const result = await saveCardsAsCustomDataset({ cards: state.uploadedCsvCards, label, existingId: selectedId });
  if (!result.ok) {
    csvStatus.textContent = result.message;
    if (result.persistenceResult?.authRequired) {
      redirectToLogin();
    }
    return;
  }

  if (csvDatasetNameInput) {
    csvDatasetNameInput.value = result.label;
  }
  refreshCsvDatasetOverwriteSelect(result.datasetId);
  csvStatus.textContent =
    result.persistenceResult.mode === "remote"
      ? `Datensatz global überschrieben: ${result.label} (${result.count} Karten).`
      : `Datensatz lokal überschrieben: ${result.label} (${result.count} Karten).`;
}

function syncSettingsPanel() {
  swapSelectGame.value = swapSelect.value;
  syncCategoryControls(gameCategoryControls, state.categories, state.categoryTimes);
  syncBoardSizeControls(state.boardSize);
}

function applySettingsFromPanel() {
  const selectedCategories = getSelectedCategories(gameCategoryControls);
  if (selectedCategories.length === 0) {
    setCategorySelectionInvalidState(gameCategoryControls, true);
    return;
  }
  setCategorySelectionInvalidState(gameCategoryControls, false);
  const selectedBoardSize = getSelectedBoardSize(boardSizeSelectGame);
  syncBoardSizeControls(selectedBoardSize);
  state.categories = selectedCategories;
  state.categoryTimes = readCategoryTimes(gameCategoryControls);
  state.timeLimit = state.categoryTimes[selectedCategories[0]] ?? 60;
  state.swapPenalty = Number.parseInt(swapSelectGame.value, 10);
  swapSelect.value = swapSelectGame.value;
  syncCategoryControls(menuCategoryControls, state.categories, state.categoryTimes);
  applyBoardSize(selectedBoardSize);
  if (!state.timer) {
    updateTimerDisplay(state.timeLimit);
  }
  positionTokens();
  settingsPanel.classList.add("hidden");
}

function handleOpenSettings() {
  syncSettingsPanel();
  settingsPanel.classList.remove("hidden");
}

function handleCloseSettings() {
  settingsPanel.classList.add("hidden");
}

function handleMainMenu() {
  stopTimer();
  hideTurnOverlay();
  setRoute("#/settings-board");
  updateMainMenuRequiredSelectionState();
}

function setOverlayStartFromCell() {
  const width = Math.min(300, Math.max(220, Math.round(window.innerWidth * 0.24)));
  const height = Math.min(300, Math.max(220, Math.round(window.innerHeight * 0.28)));
  const x = Math.round(window.innerWidth / 2 - width / 2);
  const y = Math.round(window.innerHeight / 2 - height / 2);
  turnOverlayPanel.style.setProperty("--panel-width", `${width}px`);
  turnOverlayPanel.style.setProperty("--panel-height", `${height}px`);
  turnOverlayPanel.style.setProperty("--panel-x", `${x}px`);
  turnOverlayPanel.style.setProperty("--panel-y", `${y}px`);
}

function setOverlayCategorySize() {
  const width = Math.min(680, Math.max(360, Math.round(window.innerWidth * 0.45)));
  const height = Math.min(560, Math.max(420, Math.round(window.innerHeight * 0.5)));
  const x = Math.round(window.innerWidth / 2 - width / 2);
  const y = Math.round(window.innerHeight / 2 - height / 2);
  turnOverlayPanel.style.setProperty("--panel-category-width", `${width}px`);
  turnOverlayPanel.style.setProperty("--panel-category-height", `${height}px`);
  turnOverlayPanel.style.setProperty("--panel-category-x", `${x}px`);
  turnOverlayPanel.style.setProperty("--panel-category-y", `${y}px`);
}

function showTurnOverlay() {
  state.phase = GAME_PHASES.READY;
  document.body.classList.remove("card-view-active");
  fullscreenCardOverlay.setOpen({ isOpen: false });
  setOverlayStartFromCell();
  setOverlayCategorySize();
  turnCategory.classList.remove("hidden");
  turnCountdownCard.classList.add("hidden");
  turnWord.classList.add("hidden");
  turnCountdown.classList.add("hidden");
  turnReadyButton.classList.remove("hidden");
  turnReadyButton.disabled = false;
  turnOverlay.classList.remove("hidden");
  turnOverlay.classList.add("active");
  requestAnimationFrame(() => {
    turnOverlay.classList.add("category");
  });
}

function hideTurnOverlay() {
  document.body.classList.remove("card-view-active");
  fullscreenCardOverlay.setOpen({ isOpen: false });
  turnOverlay.classList.remove("expanded");
  turnOverlay.classList.remove("category");
  turnOverlay.classList.remove("fullscreen-state");
  turnOverlay.classList.remove("active");
  requestAnimationFrame(() => {
    renderBoardPath();
    positionTokens();
  });
  setTimeout(() => {
    turnOverlay.classList.add("hidden");
  }, 700);
  state.phase = GAME_PHASES.IDLE;
}

function startCountdown() {
  clearInterval(state.countdownTimer);
  state.countdownTimer = null;
  let countdown = 3;
  turnCountdown.textContent = `${countdown}`;
  turnCategory.classList.add("hidden");
  turnCountdownCard.classList.remove("hidden");
  turnCountdown.classList.remove("hidden");
  turnReadyButton.classList.add("hidden");
  state.phase = GAME_PHASES.COUNTDOWN;
  state.countdownTimer = setInterval(() => {
    countdown -= 1;
    if (countdown <= 0) {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
      showWordCard();
      return;
    }
    turnCountdown.textContent = `${countdown}`;
  }, 1000);
}

function showWordCard() {
  document.body.classList.add("card-view-active");
  turnCategory.classList.add("hidden");
  turnCountdownCard.classList.add("hidden");
  turnOverlay.classList.remove("category");
  turnOverlay.classList.add("expanded");
  turnOverlay.classList.add("fullscreen-state");
  fullscreenCardOverlay.setOpen({ isOpen: true });
  state.phase = GAME_PHASES.FULLSCREEN_CARD;
  const card = getCardByCategory(state.pendingCategory);
  state.currentCard = card;
  state.timeLimit = state.categoryTimes[state.pendingCategory] ?? 60;
  if (isAnswerCardCategory(state.pendingCategory)) {
    state.singleChoiceResult = null;
    state.quizPhase = "question";
    setQuizQuestionCard(card);
    const isSingleChoice = state.pendingCategory === "Single-Choice";
    if (turnContinueButton) {
      turnContinueButton.textContent = isSingleChoice ? "Weiter" : "Lösen";
    }
    setTurnButtons({
      showCorrect: false,
      showWrong: false,
      showSwap: true,
      showContinue: !isSingleChoice,
    });
    startTimer({
      onTimeout: () => finishTurn(false, true, { returnToPrevious: true }),
    });
  } else {
    state.quizPhase = null;
    setWordCard(card);
    setTurnButtons({ showCorrect: true, showWrong: true, showSwap: true, showContinue: false });
    startTimer();
  }
}

function applySwapPenalty() {
  const penalty = state.swapPenalty;
  if (!Number.isFinite(penalty) || penalty <= 0) return;
  state.remainingTime = Math.max(0, state.remainingTime - penalty);
  updateTimerDisplay(state.remainingTime);
  showPenaltyToast(penalty);
  if (state.remainingTime <= 0) {
    finishTurn(false, true, { returnToPrevious: true });
  }
}

function handleSwapCard() {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (state.quizPhase === "answer") return;
  const card = getCardByCategory(state.pendingCategory);
  state.currentCard = card;
  if (isAnswerCardCategory(state.pendingCategory)) {
    setQuizQuestionCard(card);
  } else {
    setWordCard(card);
  }
  applySwapPenalty();
}

function showWinner(teamName) {
  state.gameOver = true;
  state.phase = GAME_PHASES.WINNER;
  state.pendingRoll = null;
  state.pendingCategory = null;
  winnerLabel.textContent = `${teamName} gewinnt`;
  if (winnerRestartButton) {
    winnerRestartButton.textContent = "Neues Spiel";
  }
  winnerScreen.classList.remove("hidden");
}

function handleWinnerRestart() {
  winnerScreen.classList.add("hidden");
  handleMainMenu();
}

async function setup() {
  state.customDatasetsApiUrl = resolveCustomDatasetsApiUrl();
  if (isLoggedIn) {
    state.customDatasets = await loadCustomDatasets();
  } else {
    state.customDatasets = filterCustomDatasetsForAuthMode(readCustomDatasetsFromStorage());
  }
  menuCategoryControls.forEach((control) => populateTimeSelect(control.timeSelect, 60));
  gameCategoryControls.forEach((control) => populateTimeSelect(control.timeSelect, 60));
  syncTeamCountControls(teamCountInput.value);
  const selectedBoardSize = getSelectedBoardSize(boardSizeSelect ?? boardSizeInputs);
  syncBoardSizeControls(selectedBoardSize);
  applyBoardSize(selectedBoardSize);
  renderBoardPath();
  positionTokens();
  updateTimerDisplay(state.timeLimit);
  updateFullscreenState();
  syncSettingsPanel();
  setupDatasetSelects();
  renderSpeedQuizDatasetOptions();
  renderSpeedQuizCategoryOptions();
  refreshCsvDatasetOverwriteSelect("");
  applySelectedDatasets();
  updateCsvDatasetActionState();
  if (isLoggedIn) {
    refreshPublicCsvList();
  } else {
    setStorageSelectOptions([]);
  }
}

window.addEventListener("resize", () => {
  renderBoardPath();
  positionTokens();
});
teamListContainer?.addEventListener("click", handleTeamListClick);
speedQuizTeamListContainer?.addEventListener("click", handleTeamListClick);
document.addEventListener("click", (event) => {
  const clickedInsideMain = teamListContainer?.contains(event.target);
  const clickedInsideSpeedQuiz = speedQuizTeamListContainer?.contains(event.target);
  if (!clickedInsideMain && !clickedInsideSpeedQuiz) {
    closeAllTeamPickers();
  }
});
teamCountInput?.addEventListener("change", (event) => {
  syncTeamCountControls(event.target.value);
});
speedQuizTeamCountInput?.addEventListener("change", (event) => {
  syncTeamCountControls(event.target.value);
});
teamCountDecrease?.addEventListener("click", () => {
  syncTeamCountControls(Number.parseInt(teamCountInput.value, 10) - 1);
});
speedQuizTeamCountDecrease?.addEventListener("click", () => {
  syncTeamCountControls(Number.parseInt(speedQuizTeamCountInput.value, 10) - 1);
});
teamCountIncrease?.addEventListener("click", () => {
  syncTeamCountControls(Number.parseInt(teamCountInput.value, 10) + 1);
});
speedQuizTeamCountIncrease?.addEventListener("click", () => {
  syncTeamCountControls(Number.parseInt(speedQuizTeamCountInput.value, 10) + 1);
});
teamListContainer?.addEventListener("input", () => {
  syncTeamsBetweenEditors(teamListContainer, speedQuizTeamListContainer);
});
speedQuizTeamListContainer?.addEventListener("input", () => {
  syncTeamsBetweenEditors(speedQuizTeamListContainer, teamListContainer);
});
boardSizeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const selectedBoardSize = getSelectedBoardSize(boardSizeInputs);
    syncBoardSizeControls(selectedBoardSize);
    applyBoardSize(selectedBoardSize);
  });
});
boardSizeSelect?.addEventListener("change", () => {
  const selectedBoardSize = getSelectedBoardSize(boardSizeSelect);
  syncBoardSizeControls(selectedBoardSize);
  applyBoardSize(selectedBoardSize);
});

if (!window.location.hash) {
  setRoute("#/landing");
} else {
  setRoute(window.location.hash);
}
updateMainMenuRequiredSelectionState();

startButton.addEventListener("click", handleStartGame);
speedQuizStartButton?.addEventListener("click", () => {
  setRoute("#/game-speedquiz");
});
document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (!routeButton) return;
  const targetRoute = routeButton.getAttribute("data-route");
  if (!targetRoute) return;
  setRoute(targetRoute);
  if (targetRoute === "#/settings-board") {
    updateMainMenuRequiredSelectionState();
  }
});
speedQuizDatasetSelect?.addEventListener("change", (event) => {
  state.speedQuiz.selectedDataset = event.target.value;
});
window.addEventListener("hashchange", () => {
  setRoute(window.location.hash);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (qrModal && !qrModal.classList.contains("hidden")) {
    closeQrModal();
    return;
  }
  if (cardEditorModal && !cardEditorModal.classList.contains("hidden")) {
    closeCardEditor();
  }
});
rollButton.addEventListener("click", handleRoll);
undoButton.addEventListener("click", handleUndo);
csvUploadButton?.addEventListener("click", handleCsvUpload);
csvRefreshListButton?.addEventListener("click", refreshPublicCsvList);
storageDatasetSelect?.addEventListener("change", (event) => {
  loadStorageDataset(event.target.value);
  updateMainMenuRequiredSelectionState();
});
csvSaveNewButton?.addEventListener("click", saveUploadedCsvAsNewDataset);
csvOverwriteButton?.addEventListener("click", overwriteDatasetWithUploadedCsv);
csvOverwriteSelect?.addEventListener("change", updateCsvDatasetActionState);
openCardEditorButton?.addEventListener("click", openCardEditor);
closeCardEditorButton?.addEventListener("click", closeCardEditor);
cardEditorAddRowButton?.addEventListener("click", addEditorRow);
cardEditorSaveButton?.addEventListener("click", saveCardEditor);
cardEditorExportButton?.addEventListener("click", exportEditorCardsAsCsv);
cardEditorSaveNewButton?.addEventListener("click", saveEditorAsNewDataset);
cardEditorOverwriteButton?.addEventListener("click", overwriteSelectedCustomDataset);
cardEditorDeleteButton?.addEventListener("click", deleteSelectedCustomDataset);
cardEditorDatasetSelect?.addEventListener("change", () => {
  const selectedId = cardEditorDatasetSelect.value;
  const dataset = state.customDatasets[selectedId];
  if (cardEditorDatasetLabelInput) {
    cardEditorDatasetLabelInput.value = dataset?.label ?? "";
  }
});
cardEditorBody?.addEventListener("input", updateEditorValidationState);
cardEditorBody?.addEventListener("change", updateEditorValidationState);
cardEditorModal?.addEventListener("click", (event) => {
  if (event.target === cardEditorModal) {
    closeCardEditor();
  }
});
closeQrModalButton?.addEventListener("click", closeQrModal);
qrModal?.addEventListener("click", (event) => {
  if (event.target === qrModal) {
    closeQrModal();
  }
});
datasetAddButton?.addEventListener("click", () => {
  addDatasetSelect("");
});
datasetSelect?.addEventListener("change", () => {
  applySelectedDatasets();
  updateMainMenuRequiredSelectionState();
});
menuCategoryControls.forEach((control) => {
  control.checkbox?.addEventListener("change", () => {
    updateMainMenuRequiredSelectionState();
  });
});
gameCategoryControls.forEach((control) => {
  control.checkbox?.addEventListener("change", () => {
    setCategorySelectionInvalidState(gameCategoryControls, false);
  });
});
openSettingsButton.addEventListener("click", handleOpenSettings);
closeSettingsButton.addEventListener("click", handleCloseSettings);
applySettingsButton.addEventListener("click", applySettingsFromPanel);
mainMenuButton.addEventListener("click", handleMainMenu);
turnWordHint?.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (!isAnswerCardCategory(state.pendingCategory) || state.quizPhase !== "question") return;
  turnContinueButton.click();
});

turnContinueButton.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (state.pendingCategory === "Single-Choice" && state.singleChoiceResult) {
    finishTurn(
      state.singleChoiceResult.isCorrect,
      false,
      { returnToPrevious: state.singleChoiceResult.returnToPrevious },
    );
    return;
  }
  if (isAnswerCardCategory(state.pendingCategory) && state.quizPhase === "question") {
    stopTimer();
    state.quizPhase = "answer";
    setQuizAnswerCard(state.currentCard);
    setTurnButtons({ showCorrect: true, showWrong: true, showSwap: false, showContinue: false });
    return;
  }
  finishTurn(false);
});
turnSingleChoiceOptions?.addEventListener("click", (event) => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (state.pendingCategory !== "Single-Choice") return;
  if (state.quizPhase !== "question") return;
  const optionButton = event.target.closest(".single-choice-option-button");
  if (!optionButton || optionButton.disabled) return;
  const selectedOption = normalizeAnswerOption(optionButton.dataset.option ?? optionButton.textContent);
  const correctAnswer = normalizeAnswerOption(state.currentCard?.answer);
  setSingleChoiceResult(optionButton, selectedOption === correctAnswer, correctAnswer);
});
turnCorrectButton?.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (isAnswerCardCategory(state.pendingCategory) && state.quizPhase !== "answer") return;
  finishTurn(true);
});
turnWrongButton?.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (isAnswerCardCategory(state.pendingCategory) && state.quizPhase !== "answer") return;
  finishTurn(false, false, { returnToPrevious: true });
});
turnSwapButton?.addEventListener("click", handleSwapCard);
turnReadyButton.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.READY) return;
  turnReadyButton.disabled = true;
  startCountdown();
});
winnerRestartButton.addEventListener("click", handleWinnerRestart);

turnPenalty?.addEventListener("animationend", () => {
  turnPenalty.classList.remove("show");
});

csvInfo.addEventListener("click", () => {
  const isHidden = csvTooltip.getAttribute("aria-hidden") === "true";
  csvTooltip.setAttribute("aria-hidden", isHidden ? "false" : "true");
});


function getFullscreenIconMarkup(isFullscreen) {
  const path = isFullscreen
    ? "M9 4H4v5M20 9V4h-5M15 20h5v-5M4 15v5h5"
    : "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5";

  return `<svg class="fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"></path></svg>`;
}

function updateFullscreenState() {
  const isFullscreen = Boolean(document.fullscreenElement);
  document.body.classList.toggle("fullscreen", isFullscreen);
  fullscreenToggle.setAttribute("aria-pressed", String(isFullscreen));
  fullscreenToggle.innerHTML = getFullscreenIconMarkup(isFullscreen);
  fullscreenToggle.title = isFullscreen ? "Vollbildmodus verlassen" : "Vollbildmodus";
}

fullscreenToggle.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
});

document.addEventListener("fullscreenchange", () => {
  updateFullscreenState();
  renderBoardPath();
  positionTokens();
});

window.addEventListener(AUTH_MODE_EVENT, async (event) => {
  const nextIsLoggedIn = Boolean(event.detail?.isLoggedIn);
  authSession = event.detail?.session ?? null;
  if (nextIsLoggedIn === isLoggedIn) return;
  isLoggedIn = nextIsLoggedIn;
  if (isLoggedIn) {
    const publicDatasets = filterCustomDatasetsForAuthMode(state.customDatasets);
    const loadedDatasets = await loadCustomDatasets();
    state.customDatasets = { ...publicDatasets, ...loadedDatasets };
  }
  applyDatasetAuthMode();
});

setup();

window.thinkarooRouter = { setRoute };
