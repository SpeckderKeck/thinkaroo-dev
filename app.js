const swapSelect = document.getElementById("swap-select");
const teamCountInput = document.getElementById("team-count");
const teamCountDecrease = document.getElementById("team-count-decrease");
const teamCountIncrease = document.getElementById("team-count-increase");
const teamListContainer = document.getElementById("team-list");
const startButton = document.getElementById("start-game");
const landingPanel = document.getElementById("screen-landing");
const menuPanel = document.getElementById("screen-settings-board");
const advancedSettingsPanel = document.getElementById("screen-advancedsettings");
const boardCategorySelectorContainer = document.getElementById("board-category-selector");
const toggleCategoryDistributionButton = document.getElementById("toggle-category-distribution");
const categoryDistributionPanel = document.getElementById("category-distribution-panel");
const boardCategoriesContainer = document.getElementById("board-categories");
const resetCategoryDistributionButton = document.getElementById("reset-category-distribution");
const gamePanel = document.getElementById("screen-game-board");
const loginPanel = document.getElementById("screen-login");
const cardsetsPanel = document.getElementById("screen-cardsets");
const editorPanel = document.getElementById("screen-editor");
const joinPanel = document.getElementById("screen-join");
const sharedPanel = document.getElementById("screen-shared");
const howPanel = document.getElementById("screen-how");
const accountPanel = document.getElementById("screen-account");
const settingsBackLink = document.getElementById("settings-back-topbar");

if (settingsBackLink) {
  settingsBackLink.addEventListener("click", (event) => {
    const currentHash = window.location.hash;
    if (currentHash === "#/game-board") {
      const confirmed = confirm("Bist du sicher, dass du das Spiel beenden möchtest?");
      if (!confirmed) {
        event.preventDefault();
      }
    }
  });
}

const screenPanels = {
  "#/landing": landingPanel,
  "#/join": joinPanel,
  "#/shared": sharedPanel,
  "#/how": howPanel,
  "#/settings-board": menuPanel,
  "#/advancedsettings": advancedSettingsPanel,
  "#/login": loginPanel,
  "#/cardsets": cardsetsPanel,
  "#/editor": editorPanel,
  "#/editcardsets": editorPanel,
  "#/game-board": gamePanel,
  "#/account": accountPanel,
};

function getPresetCardsForKeys(keys = []) {
  const normalizedKeys = (Array.isArray(keys) ? keys : [])
    .map((key) => String(key ?? "").trim())
    .filter(Boolean);

  return normalizedKeys.flatMap((key) => {
    const dataset = PRESET_DATASETS[key];
    const cards = Array.isArray(dataset?.cards) ? dataset.cards : [];
    return cards;
  });
}

async function toggleDatasetKeySelection(key, shouldSelect) {
  const normalizedKey = String(key ?? "").trim();
  if (!normalizedKey) return;

  if (shouldSelect) {
    const storageObjectName = fromStorageDatasetKey(normalizedKey);
    if (storageObjectName && !state.storageDatasets[storageObjectName]) {
      await loadStorageDataset(storageObjectName);
      return;
    }
    const nextSelected = new Set(readSelectedDatasetKeys());
    nextSelected.add(normalizedKey);
    state.selectedDatasets = [...nextSelected].slice(0, MAX_DATASET_SELECTIONS);
    refreshDatasetSelections();
    return;
  }

  state.selectedDatasets = readSelectedDatasetKeys().filter((selectedKey) => selectedKey !== normalizedKey);
  refreshDatasetSelections();
}

function normalizeRouteHash(hash) {
  if (hash === "/cardsets") {
    return "#/cardsets";
  }
  if (hash === "/editor") {
    return "#/editor";
  }
  if (hash === "/editcardsets") {
    return "#/editcardsets";
  }
  if (hash === "/advancedsettings") {
    return "#/advancedsettings";
  }
  if (String(hash ?? "").startsWith("#/join/")) {
    return "#/join";
  }
  if (String(hash ?? "").startsWith("#/shared/")) {
    return "#/shared";
  }
  return Object.hasOwn(screenPanels, hash) ? hash : "#/landing";
}

function setRoute(hash) {
  const rawHash = String(hash ?? "");
  const nextHash = normalizeRouteHash(rawHash);
  const shouldPreserveHash = rawHash.startsWith("#/shared/") || rawHash.startsWith("#/join/");
  const desiredHash = shouldPreserveHash ? rawHash : nextHash;
  if (window.location.hash !== desiredHash) {
    window.location.hash = desiredHash;
    return;
  }

  Object.entries(screenPanels).forEach(([routeHash, panel]) => {
    if (!panel) return;
    const isActive = routeHash === nextHash;
    panel.hidden = !isActive;
    panel.classList.toggle("panel--active", isActive);
    panel.setAttribute("aria-hidden", (!isActive).toString());
  });

  document.body.classList.toggle("is-editor-active", nextHash === "#/editor" || nextHash === "#/editcardsets");

  if (editorPanel) {
    editorPanel.classList.toggle("is-editcardsets", nextHash === "#/editcardsets");
  }

  if (settingsBackLink) {
    const showSettingsBackLink = nextHash !== "#/landing";
    settingsBackLink.hidden = !showSettingsBackLink;
    let backTarget;
    if (nextHash === "#/cardsets" || nextHash === "#/game-board") {
      backTarget = "#/settings-board";
    } else if (nextHash === "#/editcardsets") {
      backTarget = "#/cardsets";
    } else if (nextHash === "#/account") {
      backTarget = "#/settings-board";
    } else {
      backTarget = "#/landing";
    }
    settingsBackLink.setAttribute("href", backTarget);
  }

  if (nextHash === "#/cardsets") {
    refreshPublicCsvList();
    if (cardEditorBody) {
      renderCardEditorRows(cloneCards(state.cards));
      updateEditorValidationState();
      refreshEditorCustomDatasetSelect(cardEditorDatasetSelect?.value ?? "");
    }
  }

  if ((nextHash === "#/editor" || nextHash === "#/editcardsets") && cardEditorBody) {
    clearEditorStatus();
    renderCardEditorRows(cloneCards(state.cards));
    updateEditorValidationState();
    refreshEditorCustomDatasetSelect(cardEditorDatasetSelect?.value ?? "");
    // Initialize dataset selector with default dataset selected
    initEditorDatasetSelector();
  }

  if (nextHash === "#/shared") {
    loadSharedGameFromLocationHash();
  }

  if (nextHash === "#/join") {
    const joinCodeFromHash = getJoinCodeFromHash();
    if (joinCodeFromHash && joinCodeInput) {
      joinCodeInput.value = joinCodeFromHash;
      submitJoinCode();
    }
  }

  if (nextHash === "#/game-board") {
    const shouldTryRestore = !state.isStartingGame && board && board.querySelectorAll(".token").length === 0;
    if (shouldTryRestore) {
      const snapshot = readStoredActiveGameSnapshot();
      if (snapshot) {
        requestAnimationFrame(() => {
          restoreActiveGameFromSnapshot(snapshot);
        });
      }
    }
  }

  if (nextHash === "#/account") {
    const accountUsernameInput = document.getElementById("account-username");
    if (accountUsernameInput) {
      accountUsernameInput.value = getUserDisplayName();
    }
    const accountCurrentUsername = document.getElementById("account-current-username");
    if (accountCurrentUsername) {
      accountCurrentUsername.textContent = getUserDisplayName() || "–";
    }
    const accountCurrentEmail = document.getElementById("account-current-email");
    if (accountCurrentEmail) {
      accountCurrentEmail.textContent = authSession?.user?.email || "–";
    }
  }

  // Save current route to localStorage so a reload returns to the last screen
  localStorage.setItem(CURRENT_ROUTE_STORAGE_KEY, nextHash);

  if (nextHash === "#/settings-board") {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scheduleBoardCategorySelectorFit();
      });
    });
  }

  if (nextHash === "#/landing") {
    syncLandingQrCode();
  }

  syncBoardViewLoop();
}

async function copySharedGameCode() {
  const code = String(sharedGameCodeEl?.textContent ?? "").trim();
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    if (sharedGameLinkStatus) {
      sharedGameLinkStatus.textContent = "Code kopiert.";
      sharedGameLinkStatus.hidden = false;
    }
  } catch {
    if (sharedGameLinkStatus) {
      sharedGameLinkStatus.textContent = "Kopieren fehlgeschlagen.";
      sharedGameLinkStatus.hidden = false;
    }
  }
}
const board = document.getElementById("board");
const rollButton = document.getElementById("roll");
const diceOverlay = document.getElementById("dice-overlay");
const diceOverlayValue = document.getElementById("dice-overlay-value");
const dice3dCube = document.getElementById("dice-3d-cube");
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
const turnRoundCounter = document.getElementById("turn-round-counter");
const turnRoundCounterPlus = document.getElementById("turn-round-counter-plus");
const turnPenalty = document.getElementById("turn-penalty");
const turnWordTitle = document.getElementById("turn-word-title");
const turnSingleChoiceOptions = document.getElementById("turn-single-choice-options");
const turnTabooList = document.getElementById("turn-taboo-list");
const turnWordCategoryLabel = document.getElementById("turn-word-category-label");
const turnWordHint = document.getElementById("turn-word-hint");
const turnCorrectButton = document.getElementById("turn-correct");
const turnWrongButton = document.getElementById("turn-wrong");
const turnSwapButton = document.getElementById("turn-swap");
const turnTimeoutButton = document.getElementById("turn-timeout");
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
const csvUploadPublicButton = document.getElementById("csv-upload-public-button");
const csvRefreshListButton = document.getElementById("csv-refresh-list");
const storageDatasetSelect = document.getElementById("storage-dataset-select");
const storageDatasetList = document.getElementById("storage-dataset-list");
const storageDatasetSummary = document.getElementById("storage-dataset-summary");
const csvInfo = document.getElementById("csv-info");
const csvTooltip = document.getElementById("csv-tooltip");
const openEditorPageButton = document.getElementById("open-editor-page");
const storageDeleteConfirmModal = document.getElementById("storage-delete-confirm");
const storageDeleteConfirmText = document.getElementById("storage-delete-confirm-text");
const storageDeleteConfirmCancelButton = document.getElementById("storage-delete-confirm-cancel");
const storageDeleteConfirmOkButton = document.getElementById("storage-delete-confirm-ok");
const datasetNamePrompt = document.getElementById("dataset-name-prompt");
const datasetNamePromptText = document.getElementById("dataset-name-prompt-text");
const datasetNamePromptInput = document.getElementById("dataset-name-prompt-input");
const datasetNamePromptCancel = document.getElementById("dataset-name-prompt-cancel");
const datasetNamePromptOk = document.getElementById("dataset-name-prompt-ok");
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
const cardEditorUploadCsvButton = document.getElementById("card-editor-upload-csv");
const cardEditorDatasetLabelInput = document.getElementById("card-editor-dataset-label");
const cardEditorSaveNewButton = document.getElementById("card-editor-save-new");
const cardEditorDatasetSelect = document.getElementById("card-editor-dataset-select");
const cardEditorOverwriteButton = document.getElementById("card-editor-overwrite");
const cardEditorDeleteButton = document.getElementById("card-editor-delete");
const cardEditorErrors = document.getElementById("card-editor-errors");
const editcardsetsCancelButton = document.getElementById("editcardsets-cancel");
const editcardsetsSaveButton = document.getElementById("editcardsets-save");
const csvVisibilityField = document.getElementById("csv-visibility-field");
const csvVisibilityToggle = document.getElementById("csv-visibility-public");
const fullscreenToggle = document.getElementById("fullscreen-toggle");
const gameSoundToggle = document.getElementById("game-sound-toggle");
const musicToggle = document.getElementById("music-toggle");
const qrToggle = document.getElementById("qr-toggle");
const themeToggle = document.getElementById("theme-toggle");
// New Editor Bottom Bar Elements
const editorBackButton = document.getElementById("editor-back-button");
const editorSaveButton = document.getElementById("editor-save-button");
const editorStatus = document.getElementById("editor-status");
const editorMoreButton = document.getElementById("editor-more-button");
const editorMoreDropdown = document.getElementById("editor-more-dropdown");

// Dataset Selector Elements
const editorDatasetDropdownToggle = document.getElementById("editor-dataset-dropdown-toggle");
const editorDatasetDropdown = document.getElementById("editor-dataset-dropdown");
const editorDatasetList = document.getElementById("editor-dataset-list");
const editorSelectedCount = document.getElementById("editor-selected-count");
const editorSelectedNames = document.getElementById("editor-selected-names");
const editorSingleTable = document.getElementById("editor-single-table");
const editorMultiSections = document.getElementById("editor-multi-sections");

// Editor Save Confirm Modal
const editorSaveConfirm = document.getElementById("editor-save-confirm");
const editorSaveConfirmText = document.getElementById("editor-save-confirm-text");
const editorSaveConfirmCancel = document.getElementById("editor-save-confirm-cancel");
const editorSaveConfirmOk = document.getElementById("editor-save-confirm-ok");

// Editor Unsaved Changes Confirm Modal
const editorUnsavedConfirm = document.getElementById("editor-unsaved-confirm");
const editorUnsavedConfirmText = document.getElementById("editor-unsaved-confirm-text");
const editorUnsavedDiscard = document.getElementById("editor-unsaved-discard");
const editorUnsavedSave = document.getElementById("editor-unsaved-save");

// Legacy buttons (for compatibility)
const editorFixedCancelButton = document.getElementById("editor-fixed-cancel");
const editorFixedSaveButton = document.getElementById("editor-fixed-save");
const qrModal = document.getElementById("qr-modal");
const qrImage = document.getElementById("qr-image");
const closeQrModalButton = document.getElementById("close-qr-modal");
const landingQrImage = document.getElementById("landing-qr-image");
const openImpressumButton = document.getElementById("open-impressum");
const openPrivacyButton = document.getElementById("open-datenschutz");
const impressumModal = document.getElementById("impressum-modal");
const closeImpressumModalButton = document.getElementById("close-impressum-modal");
const privacyModal = document.getElementById("privacy-modal");
const closePrivacyModalButton = document.getElementById("close-privacy-modal");
const joinCodeInput = document.getElementById("join-code");
const joinSubmitButton = document.getElementById("join-submit");
const joinError = document.getElementById("join-error");
const sharedSummary = document.getElementById("shared-summary");
const sharedStartButton = document.getElementById("shared-start-game");
const sharedTeamCountInput = document.getElementById("shared-team-count");
const sharedTeamCountDecrease = document.getElementById("shared-team-count-decrease");
const sharedTeamCountIncrease = document.getElementById("shared-team-count-increase");
const sharedTeamListContainer = document.getElementById("shared-team-list");
const createSharedGameButton = document.getElementById("create-shared-game");
const sharedGameModal = document.getElementById("shared-game-modal");
const closeSharedGameModalButton = document.getElementById("close-shared-game-modal");
const sharedGameCodeEl = document.getElementById("shared-game-code");
const sharedGameLinkButton = document.getElementById("shared-game-link");
const sharedGameLinkStatus = document.getElementById("shared-game-link-status");
const sharedGameQrImage = document.getElementById("shared-game-qr");
const sharedGameStartButton = document.getElementById("shared-game-start");
const sharedGameStatus = document.getElementById("shared-game-status");
const fullAccessElements = [...document.querySelectorAll('[data-auth="full"]')];
const userMenuToggle = document.getElementById("user-menu-toggle");
const userMenuLoginIcon = userMenuToggle?.querySelector(".user-menu-login-icon");
const userMenuInitial = document.getElementById("user-menu-initial");
const userMenuDropdown = document.getElementById("user-menu-dropdown");
const userMenuEmail = document.getElementById("user-menu-email");
const BOARD_CATEGORY_LABEL_MIN_FONT_SIZE = 4;
const BOARD_CATEGORY_LABEL_MAX_FONT_SIZE = 22;
const BOARD_VIEW_SOUND_SRC = "assets/quiz-glow.mp3";
const MENU_LOOP_SOUND_SRC = "assets/menu-drift.mp3";
const TURN_TENSION_SOUND_SRC = "assets/quiz-tension-loop-v2.mp3";
const COUNTDOWN_TICK_SOUND_SRC = "assets/blip.mp3";
const COUNTDOWN_FINAL_SOUND_SRC = "assets/blop.mp3";
const CORRECT_ANSWER_SOUND_SRC = "assets/correct-answer-notification.wav";
const WRONG_ANSWER_SOUND_SRC = "assets/wrong-answer-buzzer.wav";
const DICE_ROLL_SOUND_SRC = "assets/dice-roll-v3.mp3";
const START_GAME_SOUND_SRC = "assets/start-game.wav";
const BUTTON_CLICK_SOUND_SRC = "assets/button-click.wav";
const ANSWER_RETURN_DELAY_MS = 1500;
const SINGLE_CHOICE_RETURN_DELAY_MS = ANSWER_RETURN_DELAY_MS;
let boardCategoryFitFrame = null;
let gameAudioContext = null;
let boardViewAudio = null;
let menuLoopAudio = null;
let startGameAudio = null;
let buttonClickAudio = null;
let turnTensionAudio = null;
let countdownTickAudio = null;
let countdownFinalAudio = null;
let correctAnswerAudio = null;
let wrongAnswerAudio = null;
let diceRollAudio = null;
let isRolling = false;

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

    while (
      nextScale > minScale
      && (
        termElement.scrollWidth > termElement.clientWidth + 1
        || termElement.scrollHeight > termElement.clientHeight + 1
      )
    ) {
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

function getLandingPageUrl() {
  const baseDocumentUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseDocumentUrl}#/landing`;
}

function syncLandingQrCode() {
  if (!landingQrImage) return;
  const landingUrl = getLandingPageUrl();
  landingQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(landingUrl)}`;
}

function openSharedGameModal() {
  if (!sharedGameModal) return;
  sharedGameModal.classList.remove("hidden");
}

function closeSharedGameModal() {
  if (!sharedGameModal) return;
  sharedGameModal.classList.add("hidden");
}

function getSharedGameTokenFromHash() {
  const hash = String(window.location.hash ?? "");
  const match = hash.match(/^#\/shared\/([^/?#]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getJoinCodeFromHash() {
  const hash = String(window.location.hash ?? "");
  const match = hash.match(/^#\/join\/([^/?#]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function resolveSharedGamesApiBaseUrl() {
  const isHttp = window.location.protocol.startsWith("http");
  if (!isHttp) {
    return "";
  }

  const hostname = String(window.location.hostname || "").trim();
  const port = String(window.location.port || "").trim();

  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocalHost && port && port !== "3000") {
    return `http://${hostname}:3000`;
  }

  return window.location.origin;
}

async function fetchSharedGameByToken(shareToken) {
  const baseUrl = resolveSharedGamesApiBaseUrl();
  const response = await fetch(`${baseUrl}/shared-games/token/${encodeURIComponent(shareToken)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  const payload = await response.json();
  return { ok: true, payload };
}

async function fetchSharedGameByCode(code) {
  const baseUrl = resolveSharedGamesApiBaseUrl();
  const response = await fetch(`${baseUrl}/shared-games/code/${encodeURIComponent(code)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  const payload = await response.json();
  return { ok: true, payload };
}

function clampSharedTeamCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 2;
  return Math.min(4, Math.max(2, parsed));
}

function renderSharedTeams(count) {
  if (!sharedTeamListContainer) return;
  renderTeamRows(sharedTeamListContainer, count);
}

function syncSharedTeamCountControls(value) {
  const clamped = clampSharedTeamCount(value);
  if (sharedTeamCountInput) {
    sharedTeamCountInput.value = clamped;
  }
  if (sharedTeamCountDecrease) {
    sharedTeamCountDecrease.disabled = clamped <= 2;
  }
  if (sharedTeamCountIncrease) {
    sharedTeamCountIncrease.disabled = clamped >= 4;
  }
  renderSharedTeams(clamped);
}

function readTeamsFromContainer(container) {
  if (!container) return [];
  return [...container.querySelectorAll(".team-row")].map((row, index) => {
    const nameInput = row.querySelector("[data-team-name]");
    const iconSelect = row.querySelector("[data-team-icon]");
    const name = nameInput?.value.trim() || `Team ${index + 1}`;
    const icon = iconSelect?.value || TEAM_ICONS[0];
    return { name, icon };
  });
}

function applyTeamsToSharedEditor(teams = []) {
  const normalized = Array.isArray(teams) ? teams : [];
  const count = clampSharedTeamCount(normalized.length || 2);
  syncSharedTeamCountControls(count);
  if (!sharedTeamListContainer) return;
  const rows = [...sharedTeamListContainer.querySelectorAll(".team-row")];
  rows.forEach((row, index) => {
    const team = normalized[index] ?? null;
    if (!team) return;
    const nameInput = row.querySelector("[data-team-name]");
    const iconSelect = row.querySelector("[data-team-icon]");
    if (nameInput) {
      nameInput.value = String(team.name ?? "").trim();
    }
    if (iconSelect) {
      iconSelect.value = team.icon || TEAM_ICONS[0];
    }
  });
}

function summarizeSharedGame(payload) {
  const code = payload?.code ? `Code: ${payload.code}` : "";
  const cardSets = Array.isArray(payload?.cardSets) ? payload.cardSets : [];
  const labels = cardSets.map((cs) => cs?.label).filter(Boolean).join(" + ");
  const cardLabel = labels ? `Kartensätze: ${labels}` : "";
  return [code, cardLabel].filter(Boolean).join(" · ");
}

async function loadSharedGameFromLocationHash() {
  const token = getSharedGameTokenFromHash();
  if (!token) {
    if (sharedSummary) {
      sharedSummary.textContent = "Ungültiger Share-Link.";
    }
    return;
  }

  if (sharedSummary) {
    sharedSummary.textContent = "Lade geteiltes Spiel ...";
  }
  const result = await fetchSharedGameByToken(token);
  if (!result.ok) {
    if (sharedSummary) {
      sharedSummary.textContent = result.status === 404 ? "Geteiltes Spiel nicht gefunden." : "Laden fehlgeschlagen.";
    }
    return;
  }

  state.sharedGame = {
    id: result.payload?.id,
    code: result.payload?.code,
    shareToken: token,
    gameSettings: result.payload?.gameSettings ?? {},
    teamSettings: result.payload?.teamSettings ?? {},
    cardSets: Array.isArray(result.payload?.cardSets) ? result.payload.cardSets : [],
  };

  if (sharedSummary) {
    sharedSummary.textContent = summarizeSharedGame(result.payload);
  }
  applyTeamsToSharedEditor(state.sharedGame.teamSettings?.teams ?? []);
}

function applySharedCardsAndSettingsToState(sharedGame) {
  const gameSettings = sharedGame?.gameSettings ?? {};
  const cardSets = Array.isArray(sharedGame?.cardSets) ? sharedGame.cardSets : [];
  const presetCards = getPresetCardsForKeys(gameSettings.presetDatasetKeys);
  const embeddedCardSets = Array.isArray(gameSettings?.embeddedCardSets)
    ? gameSettings.embeddedCardSets
    : [];
  const mergedCards = cardSets.flatMap((set, index) => {
    const cards = Array.isArray(set?.cards) ? set.cards : [];
    const normalized = cards.map((card) => normalizeCardInput(card)).filter((card) => isValidNormalizedCard(card));
    return withQuestionIds(normalized, `shared:${sharedGame.id || "game"}:${index + 1}`);
  });

  const mergedEmbeddedCards = embeddedCardSets.flatMap((set, index) => {
    const cards = Array.isArray(set?.cards) ? set.cards : [];
    const normalized = cards.map((card) => normalizeCardInput(card)).filter((card) => isValidNormalizedCard(card));
    const sharedKey = String(set?.key ?? '').trim() || `embedded-${index + 1}`;
    return withQuestionIds(normalized, `shared:${sharedGame.id || "game"}:embedded:${sharedKey}`);
  });

  const mergedPresetCards = withQuestionIds(
    presetCards.map((card) => normalizeCardInput(card)).filter((card) => isValidNormalizedCard(card)),
    `shared:${sharedGame.id || "game"}:preset`
  );

  const allCards = [...mergedCards, ...mergedEmbeddedCards, ...mergedPresetCards];

  if (allCards.length > 0) {
    state.cards = allCards;
    const availableCategories = getAvailableCategoriesFromCards(allCards);
    syncCategoryWeightsForAvailableCategories(availableCategories);
  }

  if (Array.isArray(gameSettings.categories)) {
    state.categories = [...gameSettings.categories];
  }
  if (gameSettings.categoryTimes && typeof gameSettings.categoryTimes === "object") {
    state.categoryTimes = { ...gameSettings.categoryTimes };
    state.timeLimit = state.categoryTimes[state.categories[0]] ?? state.timeLimit;
  }
  if (typeof gameSettings.swapPenalty === "number") {
    state.swapPenalty = gameSettings.swapPenalty;
  }
  if (typeof gameSettings.boardSize === "string") {
    syncBoardSizeControls(gameSettings.boardSize);
    applyBoardSize(gameSettings.boardSize);
  }

  if (typeof gameSettings.gameMode === "string") {
    storeGameMode(gameSettings.gameMode);
  }
}

function startSharedGame() {
  const sharedGame = state.sharedGame;
  if (!sharedGame) {
    if (sharedSummary) {
      sharedSummary.textContent = "Kein geteiltes Spiel geladen.";
    }
    return;
  }

  applySharedCardsAndSettingsToState(sharedGame);
  const teams = readTeamsFromContainer(sharedTeamListContainer);
  state.isStartingGame = true;
  clearStoredActiveGameSnapshot();
  state.boardCategories = [];
  state.currentTeam = 0;
  state.pendingRoll = null;
  state.pendingCategory = null;
  state.gameOver = false;
  state.phase = GAME_PHASES.IDLE;
  showGamePanel();
  requestAnimationFrame(() => {
    buildBoard(state.categories, { preserveAssignments: false });
    createTokens(teams, { preservePositions: false });
    playStartGameSound();
    syncBoardDecorations();
    state.isStartingGame = false;
    storeActiveGameSnapshot();
  });
  syncBoardViewLoop();
  winnerScreen.classList.add("hidden");
  turnOverlay.classList.add("hidden");
  turnOverlay.classList.remove("active", "expanded", "category");
  setNextRollStatus(state.currentTeam);
}

async function createSharedGameFromCurrentMenu() {
  if (!requireFullAccess()) return;
  if (!sharedGameStatus || !sharedGameCodeEl || !sharedGameLinkButton || !sharedGameQrImage) return;

  const isMainMenuComplete = updateMainMenuRequiredSelectionState();
  if (!isMainMenuComplete) {
    if (sharedGameStatus) {
      sharedGameStatus.textContent = "Bitte Kartensätze und Kategorien auswählen.";
    }
    openSharedGameModal();
    return;
  }

  sharedGameStatus.textContent = "Erstelle Spielcode ...";
  if (sharedGameLinkStatus) {
    sharedGameLinkStatus.hidden = true;
    sharedGameLinkStatus.textContent = "";
  }
  sharedGameCodeEl.textContent = "";
  sharedGameLinkButton.textContent = "";
  sharedGameQrImage.src = "";
  openSharedGameModal();

 const selectedKeys = readSelectedDatasetKeys();
console.log("SELECTED_KEYS:", selectedKeys);

const datasetSelection = selectedKeys.reduce(
  (acc, key) => {
    const entry = getDatasetEntryByKey(key);
    console.log("DATASET_ENTRY_FOR_KEY:", key, entry);

    if (!entry) return acc;

    if (entry.key && PRESET_DATASETS[entry.key]) {
      acc.presetKeys.push(String(entry.key));
      return acc;
    }

    if (entry.isCustom && entry.key && Array.isArray(entry.cards) && entry.cards.length > 0) {
      acc.embeddedCardSets.push({
        key: String(entry.key),
        label: String(entry.label ?? entry.key),
        cards: entry.cards,
      });
      return acc;
    }

    if (entry.id) {
      acc.cardSetIds.push(String(entry.id));
      return acc;
    }

    if (entry.key && Array.isArray(entry.cards) && entry.cards.length > 0) {
      acc.embeddedCardSets.push({
        key: String(entry.key),
        label: String(entry.label ?? entry.key),
        cards: entry.cards,
      });
      return acc;
    }

    return acc;
  },
  { cardSetIds: [], presetKeys: [], embeddedCardSets: [] }
);

console.log("DATASET_SELECTION:", datasetSelection);

if (
  datasetSelection.cardSetIds.length === 0
  && datasetSelection.presetKeys.length === 0
  && datasetSelection.embeddedCardSets.length === 0
) {
  sharedGameStatus.textContent = "Ausgewählte Kartensätze konnten nicht für ein geteiltes Spiel übernommen werden.";
  return;
}

  const selectedBoardSize = getSelectedBoardSize(boardSizeSelect ?? boardSizeInputs);
  const gameSettings = {
    categories: state.categories.filter((category) => SELECTABLE_CARD_CATEGORIES.includes(category)),
    categoryTimes: readCategoryTimes(menuCategoryControls),
    swapPenalty: Number.parseInt(swapSelect.value, 10),
    boardSize: selectedBoardSize,
    selectedBoardCategories: [...state.selectedBoardCategories],
    categoryWeights: { ...state.categoryWeights },
    gameMode: normalizeGameMode(state.gameMode),
  };
  const teamSettings = {
    teams: readTeamsFromContainer(teamListContainer),
  };

  try {
    const baseUrl = resolveSharedGamesApiBaseUrl();
    const response = await fetch(`${baseUrl}/shared-games`, {
      method: "POST",
      headers: await getAuthHeaders({ includeContentType: true }),
      body: JSON.stringify({ gameSettings, teamSettings, datasetSelection }),
    });
    ensureAuthorizedResponse(response, "Spiel erstellen");
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}${errorText ? `: ${errorText}` : ""}`);
    }
    const payload = await response.json();
    const code = payload?.code ?? "";
    const shareToken = payload?.shareToken ?? payload?.share_token ?? "";
    const baseDocumentUrl = `${window.location.origin}${window.location.pathname}`;
    const shareUrl = code
      ? `${baseDocumentUrl}#/join/${encodeURIComponent(String(code).trim())}`
      : (shareToken ? `${baseDocumentUrl}#/shared/${encodeURIComponent(shareToken)}` : (payload?.shareUrl ?? ""));
    sharedGameCodeEl.textContent = code;
    sharedGameLinkButton.textContent = shareUrl;
    if (sharedGameStatus) {
      sharedGameStatus.textContent = "";
      sharedGameStatus.hidden = true;
    }
    sharedGameQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(shareUrl)}`;
  } catch (error) {
    if (error?.isAuthError) {
      if (sharedGameStatus) {
        sharedGameStatus.textContent = error.message;
        sharedGameStatus.hidden = false;
      }
      if (error.shouldRedirect) {
        redirectToLogin();
      }
      return;
    }
    if (sharedGameStatus) {
      sharedGameStatus.textContent = `Fehler: ${error?.message || String(error)}`;
      sharedGameStatus.hidden = false;
    }
  }
}

async function copySharedGameLink() {
  const link = String(sharedGameLinkButton?.textContent ?? "").trim();
  if (!link) return;
  try {
    await navigator.clipboard.writeText(link);
    if (sharedGameLinkStatus) {
      sharedGameLinkStatus.textContent = "Link kopiert.";
      sharedGameLinkStatus.hidden = false;
    }
  } catch {
    if (sharedGameLinkStatus) {
      sharedGameLinkStatus.textContent = "Kopieren fehlgeschlagen.";
      sharedGameLinkStatus.hidden = false;
    }
  }
}

function closeQrModal() {
  if (!qrModal) return;
  qrModal.classList.add("hidden");
}

function openLegalModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
}

function closeLegalModal(modal) {
  modal?.classList.add("hidden");
}

if (qrToggle) {
  qrToggle.addEventListener("click", (event) => {
    openQrModal(event);
  });
}

const swapSelectGame = document.getElementById("swap-select-game");
const boardSizeSelect = document.getElementById("board-size-select");
const toggleCategoryDistributionButtonGame = document.getElementById("toggle-category-distribution-game");
const categoryDistributionPanelGame = document.getElementById("category-distribution-panel-game");
const boardCategoriesContainerGame = document.getElementById("board-categories-game");
const resetCategoryDistributionButtonGame = document.getElementById("reset-category-distribution-game");
const saveAdvancedSettingsButton = document.getElementById("save-advanced-settings");
const settingsPanel = document.getElementById("settings-panel");
const openSettingsButton = document.getElementById("open-settings");
const closeSettingsButton = document.getElementById("close-settings");
const applySettingsButton = document.getElementById("apply-settings");
const mainMenuButton = document.getElementById("main-menu");
const mainMenuConfirmModal = document.getElementById("main-menu-confirm");
const mainMenuConfirmCancelButton = document.getElementById("main-menu-confirm-cancel");
const mainMenuConfirmOkButton = document.getElementById("main-menu-confirm-ok");
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
attachMenuBackground(advancedSettingsPanel);

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

function animateDiceRoll(finalValue) {
  if (!dice3dCube) {
    showDiceOverlay(finalValue);
    return Promise.resolve();
  }

  dice3dCube.dataset.face = String(finalValue);
  dice3dCube.classList.remove("is-rolling");
  void dice3dCube.offsetWidth;
  dice3dCube.classList.add("is-rolling");
  showDiceOverlay(finalValue);
  return new Promise((resolve) => {
    window.setTimeout(resolve, 1250);
  });
}

function hideDiceOverlay() {
  if (!diceOverlay) return;
  diceOverlay.classList.remove("active");
}

function setPanelState(panel, isActive) {
  if (!panel) return;
  panel.classList.toggle("panel--active", isActive);
  panel.toggleAttribute("hidden", !isActive);
}

function showMenuPanel() {
  setRoute("#/settings-board");
}

function showGamePanel() {
  setRoute("#/game-board");
}


function applySettingsMode() {
  document.querySelectorAll("[data-settings-mode]").forEach((element) => {
    const shouldShow = element.dataset.settingsMode === "board";
    element.classList.toggle("hidden", !shouldShow);
  });
  scheduleBoardCategorySelectorFit();
}

const CATEGORY_CONFIG = {
  Erklären: { id: "explain", iconPath: "erklaeren.svg", fallbackIcon: "💬" },
  Zeichnen: { id: "draw", iconPath: "zeichnen_1.svg", fallbackIcon: "✏️" },
  Pantomime: { id: "pantomime", iconPath: "pantomime_1.svg", fallbackIcon: "🎭" },
  Quizfrage: { id: "quiz", iconPath: "quiz.svg", fallbackIcon: "?" },
  Masterquizfrage: { id: "masterquiz", iconPath: "quiz.svg", fallbackIcon: "?" },
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
  Masterquizfrage: {
    color: getCardColor("Masterquizfrage"),
    borderColor: getCardBorderColor("Masterquizfrage"),
    iconColor: getReadableTextColor(getCardColor("Masterquizfrage")),
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
const MASTER_QUIZ_CATEGORY = "Masterquizfrage";
const SELECTABLE_CARD_CATEGORIES = ["Erklären", "Zeichnen", "Pantomime", "Quizfrage", "Vokabel", "Single-Choice"];
const ALLOWED_CARD_CATEGORIES = [...SELECTABLE_CARD_CATEGORIES, MASTER_QUIZ_CATEGORY];
const CATEGORY_WEIGHT_MIN = 1;
const CATEGORY_WEIGHT_MAX = 100;
const CATEGORY_WEIGHT_DEFAULT = 50;

function isAnswerCardCategory(category) {
  return category === "Quizfrage" || category === MASTER_QUIZ_CATEGORY || category === "Vokabel" || category === "Single-Choice";
}

function normalizeCategoryInput(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const normalizedComparable = normalized.replace(/[^a-z0-9]+/g, "");
  if (normalizedComparable === "singlechoice") {
    return "Single-Choice";
  }
  if (normalizedComparable === "masterquiz" || normalizedComparable === "masterquizfrage") {
    return MASTER_QUIZ_CATEGORY;
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

function createDefaultCategoryWeights(categories = SELECTABLE_CARD_CATEGORIES, defaultValue = CATEGORY_WEIGHT_DEFAULT) {
  return Object.fromEntries(
    (Array.isArray(categories) ? categories : []).map((category) => [category, defaultValue])
  );
}

const menuCategoryControls = Object.entries(CATEGORY_CONFIG).map(([category, config]) => ({
  category,
  checkbox: document.getElementById(`category-${config.id}`),
  timeSelect: document.getElementById(`time-${config.id}`),
})).filter((control) => control.timeSelect);

const gameCategoryControls = Object.entries(CATEGORY_CONFIG).map(([category, config]) => ({
  category,
  checkbox: document.getElementById(`category-${config.id}-game`),
  timeSelect: document.getElementById(`time-${config.id}-game`),
})).filter((control) => control.timeSelect);

const PRESET_DATASETS = globalThis.CARD_DATABASES ?? {};
const DEFAULT_DATASET_KEY = "standard";
const DEFAULT_DATA = PRESET_DATASETS[DEFAULT_DATASET_KEY]?.cards ?? [];
const MAX_DATASET_SELECTIONS = 5;
const CUSTOM_DATASETS_STORAGE_KEY = "wissivity.customDatasets";
const CUSTOM_DATASETS_API_URL_STORAGE_KEY = "wissivity.customDatasetsApiUrl";
const CUSTOM_DATASETS_API_ENDPOINT = "/datasets";
const PUBLIC_CUSTOM_DATASETS_API_ENDPOINT = "/public-datasets";
const ADMIN_SESSION_API_ENDPOINT = "/admin/me";
const INCLUDE_PUBLIC_DATASETS_FOR_LOGGED_IN = true;
const CUSTOM_DATASET_KEY_PREFIX = "custom:";
const STORAGE_DATASET_KEY_PREFIX = "storage:";
const GAME_SOUND_ENABLED_STORAGE_KEY = "thinkaroo.gameSoundsEnabled";
const MUSIC_ENABLED_STORAGE_KEY = "thinkaroo.musicEnabled";
const CURRENT_ROUTE_STORAGE_KEY = "thinkaroo.currentRoute";
const THEME_STORAGE_KEY = "thinkaroo.theme";
const ACTIVE_GAME_STORAGE_KEY = "thinkaroo.activeGame";
const GAME_MODE_STORAGE_KEY = "thinkaroo.gameMode";
const STANDARD_PRESET_DATASET_KEYS = new Set([]);
const REMOVED_CUSTOM_DATASET_LABELS = new Set(["umformen", "tiefziehen"]);
const PRESET_MIGRATION_KEY = "wissivity.presetsMigrated";

function normalizeDatasetLabel(label) {
  return String(label ?? "").trim().toLowerCase();
}

function isRemovedCustomDatasetLabel(label) {
  return REMOVED_CUSTOM_DATASET_LABELS.has(normalizeDatasetLabel(label));
}
const REMOVED_PRESETS_STORAGE_KEY = "thinkaroo.removedPresetKeys";

// Load removed presets from storage (with hardcoded defaults)
const REMOVED_PRESET_DATASET_KEYS = new Set([
  "umformen",
  "tiefziehen",
  ...JSON.parse(localStorage.getItem(REMOVED_PRESETS_STORAGE_KEY) || "[]"),
]);

function persistRemovedPresetKey(key) {
  REMOVED_PRESET_DATASET_KEYS.add(key);
  const current = JSON.parse(localStorage.getItem(REMOVED_PRESETS_STORAGE_KEY) || "[]");
  if (!current.includes(key)) {
    localStorage.setItem(REMOVED_PRESETS_STORAGE_KEY, JSON.stringify([...current, key]));
  }
}

async function migratePresetDatasetsToBackend() {
  if (!isAdminSession) return;
  if (localStorage.getItem(PRESET_MIGRATION_KEY) === "done") return;

  const presetKeys = Object.keys(PRESET_DATASETS).filter(
    (key) => !REMOVED_PRESET_DATASET_KEYS.has(key)
  );
  if (presetKeys.length === 0) {
    localStorage.setItem(PRESET_MIGRATION_KEY, "done");
    return;
  }

  // Check which preset labels already exist as public custom datasets
  const existingLabels = new Set(
    Object.values(state.customDatasets)
      .filter((d) => d.isPublic)
      .map((d) => normalizeDatasetLabel(d.label))
  );

  let migrated = 0;
  for (const key of presetKeys) {
    const preset = PRESET_DATASETS[key];
    if (!preset?.cards?.length) continue;
    const label = preset.label || key;
    if (existingLabels.has(normalizeDatasetLabel(label))) continue;

    try {
      const result = await saveCardsAsCustomDataset({
        cards: preset.cards,
        label,
        isPublic: true,
      });
      if (result.ok) migrated++;
    } catch {
      // Continue with next dataset
    }
  }

  if (migrated > 0) {
    await refreshPublicCsvList();
    refreshDatasetSelections();
  }
  localStorage.setItem(PRESET_MIGRATION_KEY, "done");
}

function normalizeTheme(theme) {
  return theme === "light" || theme === "dark" ? theme : "dark";
}

function getStoredTheme() {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "dark";
  }
}

function applyTheme(theme) {
  const nextTheme = normalizeTheme(theme);
  document.documentElement.setAttribute("data-theme", nextTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Theme preference is non-critical.
  }

  const themeButtons = [
    document.getElementById("theme-toggle"),
  ].filter(Boolean);

  themeButtons.forEach((themeButton) => {
    const isDark = nextTheme === "dark";
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.setAttribute("title", isDark ? "Dark Mode" : "Light Mode");
    themeButton.setAttribute("aria-label", isDark ? "Dark Mode aktiv" : "Light Mode aktiv");
  });
}

function toggleTheme() {
  const currentTheme = normalizeTheme(document.documentElement.getAttribute("data-theme"));
  applyTheme(currentTheme === "dark" ? "light" : "dark");
}
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
  isStartingGame: false,
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
    Quizfrage: 30,
    Vokabel: 60,
    "Single-Choice": 30,
    Masterquizfrage: 60,
  },
  swapPenalty: 10,
  categories: [...SELECTABLE_CARD_CATEGORIES],
  selectedBoardCategories: [...SELECTABLE_CARD_CATEGORIES],
  clickedBoardCategory: null,
  categoryWeights: createDefaultCategoryWeights(),
  lastBoardSelectedCategories: [],
  lastBoardCategoryWeights: {},
  cards: [...DEFAULT_DATA],
  history: [],
  boardCategories: [],
  phase: GAME_PHASES.IDLE,
  gameOver: false,
  pendingReturn: null,
  currentCard: null,
  quizPhase: null,
  singleChoiceResult: null,
  answerReturnTimer: null,
  singleChoiceReturnTimer: null,
  masterQuiz: false,
  roundCounter: 0,
  roundTimer: 0,
  roundActive: false,
  currentCardType: "",
  selectedDatasets: [],
  customDatasets: {},
  storageDatasets: {},
  storageDatasetFiles: [],
  uploadedCsvCards: [],
  uploadedCsvLabel: "",
  datasetStorageMode: "local",
  customDatasetsApiUrl: "",
  gameSoundsEnabled: readStoredAudioPreference(GAME_SOUND_ENABLED_STORAGE_KEY, true),
  musicEnabled: readStoredAudioPreference(MUSIC_ENABLED_STORAGE_KEY, true),
  sharedGame: null,
  gameMode: "classic",
  editor: {
    currentDatasetId: null,
    datasetName: "",
    hasUnsavedChanges: false,
    isSaving: false,
    lastSavedAt: null,
  },
};

const GAME_MODES = {
  CLASSIC: "classic",
  BLITZ: "blitz",
};

function normalizeGameMode(mode) {
  return mode === GAME_MODES.BLITZ ? GAME_MODES.BLITZ : GAME_MODES.CLASSIC;
}

function readStoredGameMode() {
  try {
    return normalizeGameMode(localStorage.getItem(GAME_MODE_STORAGE_KEY));
  } catch {
    return GAME_MODES.CLASSIC;
  }
}

function storeGameMode(mode) {
  state.gameMode = normalizeGameMode(mode);
  try {
    localStorage.setItem(GAME_MODE_STORAGE_KEY, state.gameMode);
  } catch {
  }
  syncGameModeUi();
}

function syncGameModeUi() {
  const mode = normalizeGameMode(state.gameMode);
  document.body.classList.toggle("game-mode-classic", mode === GAME_MODES.CLASSIC);
  document.body.classList.toggle("game-mode-blitz", mode === GAME_MODES.BLITZ);
  const label = mode === GAME_MODES.BLITZ ? "Modus: Blitz" : "Modus: Klassisch";
  const indicator = document.getElementById("game-mode-indicator");
  if (indicator) {
    indicator.textContent = label;
  }
  const classicButton = document.getElementById("game-mode-classic");
  const blitzButton = document.getElementById("game-mode-blitz");
  const setChecked = (button, checked) => {
    if (!button) return;
    button.setAttribute("aria-checked", checked ? "true" : "false");
  };
  setChecked(classicButton, mode === GAME_MODES.CLASSIC);
  setChecked(blitzButton, mode === GAME_MODES.BLITZ);
}

let isLoggedIn = Boolean(window.THINKAROO_AUTH?.isLoggedIn);
let authSession = window.__authState?.session ?? null;
let isAdminSession = false;

let audioUnlockListenerRegistered = false;

function unlockAudioOnFirstInteraction() {
  if (audioUnlockListenerRegistered) return;
  audioUnlockListenerRegistered = true;

  const handler = async () => {
    const ctx = getGameAudioContext();
    if (ctx && typeof ctx.resume === "function" && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
      }
    }
    if (state.musicEnabled) {
      syncBoardViewLoop();
      if (state.phase === GAME_PHASES.FULLSCREEN_CARD) {
        playTurnTensionLoop();
      }
    }
  };

  document.addEventListener("pointerdown", handler, { once: true });
  document.addEventListener("keydown", handler, { once: true });
}

function storeActiveGameSnapshot() {
  const activeRoute = normalizeRouteHash(window.location.hash);
  if (activeRoute !== "#/game-board") return;
  if (!Array.isArray(state.teams) || state.teams.length === 0) return;
  if (!Array.isArray(state.positions) || state.positions.length === 0) return;

  const snapshot = {
    version: 1,
    boardSize: state.boardSize,
    boardDimensions: state.boardDimensions,
    teams: state.teams,
    positions: state.positions,
    currentTeam: state.currentTeam,
    categories: state.categories,
    selectedBoardCategories: state.selectedBoardCategories,
    categoryWeights: state.categoryWeights,
    boardCategories: state.boardCategories,
  };

  try {
    localStorage.setItem(ACTIVE_GAME_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
  }
}

function clearStoredActiveGameSnapshot() {
  try {
    localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
  } catch {
  }
}

function readStoredActiveGameSnapshot() {
  try {
    const raw = localStorage.getItem(ACTIVE_GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function restoreActiveGameFromSnapshot(snapshot) {
  if (!snapshot) return false;
  if (!Array.isArray(snapshot.teams) || snapshot.teams.length === 0) return false;
  if (!Array.isArray(snapshot.positions) || snapshot.positions.length !== snapshot.teams.length) return false;

  const boardSize = String(snapshot.boardSize || "normal");
  state.boardSize = boardSize;
  const config = BOARD_CONFIGS[boardSize] ?? BOARD_CONFIGS.normal;
  state.boardDimensions = { rows: config.rows, cols: config.cols, total: config.total };
  syncBoardSizeControls(boardSize);

  state.teams = snapshot.teams.map((team) => ({ ...team }));
  state.positions = snapshot.positions.map((pos) => Math.max(0, Math.min(Number(pos) || 0, state.boardDimensions.total - 1)));
  state.currentTeam = Math.max(0, Math.min(Number(snapshot.currentTeam) || 0, state.teams.length - 1));

  if (Array.isArray(snapshot.categories) && snapshot.categories.length > 0) {
    state.categories = [...snapshot.categories];
  }
  if (Array.isArray(snapshot.selectedBoardCategories) && snapshot.selectedBoardCategories.length > 0) {
    state.selectedBoardCategories = [...snapshot.selectedBoardCategories];
  }
  if (snapshot.categoryWeights && typeof snapshot.categoryWeights === "object") {
    state.categoryWeights = { ...snapshot.categoryWeights };
  }
  if (Array.isArray(snapshot.boardCategories) && snapshot.boardCategories.length === state.boardDimensions.total) {
    state.boardCategories = [...snapshot.boardCategories];
  }

  buildBoard(state.categories, { preserveAssignments: true });
  createTokens(state.teams, { preservePositions: true });
  syncBoardDecorations();
  setNextRollStatus(state.currentTeam);
  syncBoardViewLoop();
  return true;
}

function deriveIsAdminSessionFromSession(session) {
  const user = session?.user ?? null;
  const appMetadata = user?.app_metadata ?? {};
  const userMetadata = user?.user_metadata ?? {};
  const roles = [
    appMetadata?.role,
    userMetadata?.role,
    ...(Array.isArray(appMetadata?.roles) ? appMetadata.roles : []),
    ...(Array.isArray(userMetadata?.roles) ? userMetadata.roles : []),
  ];
  return roles.some((role) => String(role ?? "").trim().toLowerCase() === "admin");
}

async function refreshAdminSessionState() {
  let session = authSession ?? window.__authState?.session ?? null;
  if (!session?.user && window.supabase?.auth?.getSession) {
    try {
      const {
        data: { session: latestSession },
      } = await window.supabase.auth.getSession();
      session = latestSession ?? session;
      authSession = session;
    } catch {
      // Ignore and keep previous session state.
    }
  }
  if (session?.user) {
    authSession = session;
    isLoggedIn = true;
  }
  const metadataSaysAdmin = deriveIsAdminSessionFromSession(session);
  isAdminSession = Boolean(isLoggedIn && metadataSaysAdmin);
  console.log("[Admin Check]", { isLoggedIn, metadataSaysAdmin, isAdminSession, appMetadata: session?.user?.app_metadata, userMetadata: session?.user?.user_metadata });

  if (!isLoggedIn || !session?.access_token) {
    return;
  }

  try {
    const response = await fetch(getAdminSessionApiEndpoint(), {
      method: "GET",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    if (payload?.isAdmin) {
      isAdminSession = true;
    }
  } catch {
    // Keep metadata-derived admin state when the backend admin check is unavailable.
  }
}

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
    const isAllowedPreset = STANDARD_PRESET_DATASET_KEYS.has(key);
    return !isCustomDataset && !isStorageDataset && isAllowedPreset;
  });
  if (allowedDatasetKeys.length > 0) {
    state.selectedDatasets = allowedDatasetKeys.slice(0, MAX_DATASET_SELECTIONS);
    return;
  }
  state.selectedDatasets = [resolveDefaultDatasetKey()];
}

function getUserDisplayName() {
  const session = authSession ?? window.__authState?.session ?? null;
  const meta = session?.user?.user_metadata;
  return meta?.username || meta?.display_name || session?.user?.email || "";
}

function syncUserMenuInfo() {
  const session = authSession ?? window.__authState?.session ?? null;
  const username = session?.user?.user_metadata?.username || "";
  const email = session?.user?.email ?? "";
  const initial = username ? username.charAt(0) : (email ? email.charAt(0) : "");
  if (userMenuInitial) {
    userMenuInitial.textContent = initial;
    userMenuInitial.hidden = !isLoggedIn;
  }
  if (userMenuLoginIcon) {
    userMenuLoginIcon.style.display = isLoggedIn ? "none" : "";
  }
  if (userMenuToggle) {
    userMenuToggle.classList.toggle("user-menu-button--avatar", isLoggedIn);
    userMenuToggle.classList.toggle("user-menu-button--login", !isLoggedIn);
    const label = username || email || "Benutzerkonto";
    userMenuToggle.setAttribute("aria-label", isLoggedIn ? label : "Login");
    userMenuToggle.setAttribute("title", isLoggedIn ? label : "Login");
  }
  if (userMenuEmail) {
    userMenuEmail.textContent = username || email || "";
  }
}

function toggleUserMenuDropdown() {
  if (!userMenuDropdown) return;
  const isOpen = !userMenuDropdown.classList.contains("hidden");
  userMenuDropdown.classList.toggle("hidden", isOpen);
  userMenuToggle?.setAttribute("aria-expanded", String(!isOpen));
}

function closeUserMenuDropdown() {
  userMenuDropdown?.classList.add("hidden");
  userMenuToggle?.setAttribute("aria-expanded", "false");
}

function applyDatasetAuthMode() {
  const routerPanelSet = new Set(Object.values(screenPanels).filter(Boolean));
  fullAccessElements.forEach((element) => {
    if (routerPanelSet.has(element)) return;
    element.hidden = !isLoggedIn;
  });

  if (userMenuDropdown && !isLoggedIn) {
    userMenuDropdown.classList.add("hidden");
  }
  syncUserMenuInfo();

  if (!isLoggedIn) {
    state.customDatasets = filterCustomDatasetsForAuthMode(state.customDatasets);
    state.storageDatasets = {};
    state.storageDatasetFiles = [];
    state.uploadedCsvCards = [];
    clearRestrictedDatasetSelections();
    closeCardEditor();
  }

  refreshDatasetSelections();
  refreshCsvDatasetOverwriteSelect("");
  updateCsvDatasetActionState();
  updateCsvVisibilityControls();
  updateMainMenuRequiredSelectionState();
}

function updateCsvVisibilityControls() {
  const shouldShowToggle = Boolean(isLoggedIn && isAdminSession);
  if (csvVisibilityField && csvVisibilityToggle) {
    csvVisibilityField.hidden = !shouldShowToggle;
    if (!shouldShowToggle) {
      csvVisibilityToggle.checked = false;
    }
  }
}

function canPublishPublicDatasets() {
  return Boolean(isLoggedIn && isAdminSession);
}

function isPublicDatasetToggleChecked(toggle) {
  return Boolean(canPublishPublicDatasets() && toggle?.checked);
}

function syncCsvVisibilityFromSelectedDataset() {
  if (!csvVisibilityToggle || !canPublishPublicDatasets()) return;
  const selectedId = csvOverwriteSelect?.value ?? "";
  const dataset = state.customDatasets[selectedId];
  csvVisibilityToggle.checked = Boolean(dataset?.isPublic);
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

function getPublicCustomDatasetsApiEndpoint() {
  const baseUrl = normalizeCustomDatasetsApiUrl(state.customDatasetsApiUrl);
  if (!baseUrl) {
    return PUBLIC_CUSTOM_DATASETS_API_ENDPOINT;
  }
  return `${baseUrl}${PUBLIC_CUSTOM_DATASETS_API_ENDPOINT}`;
}

function getAdminSessionApiEndpoint() {
  const baseUrl = normalizeCustomDatasetsApiUrl(state.customDatasetsApiUrl);
  if (!baseUrl) {
    return ADMIN_SESSION_API_ENDPOINT;
  }
  return `${baseUrl}${ADMIN_SESSION_API_ENDPOINT}`;
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

  const visibility = String(rawDataset.visibility ?? "").trim().toLowerCase();
  if (visibility === "public") {
    return true;
  }
  if (visibility === "private") {
    return false;
  }

  if (typeof rawDataset.isPublic === "boolean") {
    return rawDataset.isPublic;
  }

  if (typeof rawDataset.public === "boolean") {
    return rawDataset.public;
  }

  return !normalizeOwnerId(rawDataset.ownerId ?? rawDataset.owner_id);
}

function canAccessCustomDataset(rawDataset) {
  return isLoggedIn || isCustomDatasetPublic(rawDataset);
}

function filterCustomDatasetsForAuthMode(datasetsById) {
  return Object.values(datasetsById ?? {}).reduce((accumulator, dataset) => {
    if (!canAccessCustomDataset(dataset) || isRemovedCustomDatasetLabel(dataset?.label)) {
      return accumulator;
    }
    const normalized = normalizeStoredCustomDataset(dataset);
    if (normalized && !isRemovedCustomDatasetLabel(normalized.label)) {
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
      if (dataset && !isRemovedCustomDatasetLabel(dataset.label)) {
        accumulator[dataset.id] = dataset;
      }
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

async function readCustomDatasetsFromApi({ includeOnlyPublic = false } = {}) {
  const endpoint = includeOnlyPublic ? getPublicCustomDatasetsApiEndpoint() : getCustomDatasetsApiEndpoint();
  const actionLabel = includeOnlyPublic
    ? "Laden der öffentlichen Kartensätze"
    : "Laden der eigenen Kartensätze";

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: await getAuthHeaders(),
    });
    ensureAuthorizedResponse(response, actionLabel);

    if (!response.ok) {
      return { datasets: null, hasApiError: true };
    }

    const parsed = await response.json();
    if (!Array.isArray(parsed)) {
      return { datasets: null, hasApiError: true };
    }

    const datasets = parsed.reduce((accumulator, rawDataset) => {
      const dataset = normalizeStoredCustomDataset(rawDataset);
      if (dataset && !isRemovedCustomDatasetLabel(dataset.label)) {
        accumulator[dataset.id] = dataset;
      }
      return accumulator;
    }, {});

    return { datasets, hasApiError: false };
  } catch (error) {
    if (error?.isAuthError) {
      throw error;
    }
    return { datasets: null, hasApiError: true };
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
        const visibilityPayload = isLoggedIn && isAdminSession
          ? { visibility: targetDataset.isPublic ? "public" : "private" }
          : {};
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
                    ...visibilityPayload,
                    expectedVersion: previousDataset?.version,
                    expectedUpdatedAt: previousDataset?.updatedAt,
                  }
                : { ...targetDataset, ...visibilityPayload },
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
  let privateDatasets = {};
  let publicDatasets = {};
  let hasApiError = false;

  try {
    if (isLoggedIn) {
      const privateResult = await readCustomDatasetsFromApi({ includeOnlyPublic: false });
      privateDatasets = privateResult.datasets ?? {};
      hasApiError = hasApiError || privateResult.hasApiError;

      if (INCLUDE_PUBLIC_DATASETS_FOR_LOGGED_IN) {
        const publicResult = await readCustomDatasetsFromApi({ includeOnlyPublic: true });
        publicDatasets = publicResult.datasets ?? {};
        hasApiError = hasApiError || publicResult.hasApiError;
      }
    } else {
      const publicResult = await readCustomDatasetsFromApi({ includeOnlyPublic: true });
      publicDatasets = publicResult.datasets ?? {};
      hasApiError = publicResult.hasApiError;
    }
  } catch (error) {
    if (error?.isAuthError) {
      if (csvStatus) {
        csvStatus.textContent = error.message;
      }
      redirectToLogin();
      return {};
    }
    hasApiError = true;
  }

  const remoteDatasets = filterCustomDatasetsForAuthMode({ ...publicDatasets, ...privateDatasets });
  if (!hasApiError) {
    state.datasetStorageMode = "remote";
    return remoteDatasets;
  }

  state.datasetStorageMode = "local";
  const localDatasets = readCustomDatasetsFromStorage();
  return filterCustomDatasetsForAuthMode({ ...localDatasets, ...remoteDatasets });
}

function getAllDatasetEntries() {
  const customEntries = Object.values(state.customDatasets)
    .filter((dataset) => canAccessCustomDataset(dataset) && !isRemovedCustomDatasetLabel(dataset?.label))
    .map((dataset) => normalizeStoredCustomDataset(dataset))
    .filter((dataset) => dataset && !isRemovedCustomDatasetLabel(dataset.label))
    .map((dataset) => ({
      key: toCustomDatasetKey(dataset.id),
      label: dataset.label,
      cards: dataset.cards,
      isCustom: true,
      isPublic: Boolean(dataset.isPublic),
      id: dataset.id,
    }));

  // Skip presets whose labels already exist as public custom datasets (migrated)
  const migratedLabels = new Set(
    customEntries.filter((e) => e.isPublic).map((e) => normalizeDatasetLabel(e.label))
  );
  const presetEntries = Object.entries(PRESET_DATASETS)
    .filter(([key]) => !REMOVED_PRESET_DATASET_KEYS.has(key))
    .filter(([key]) => isLoggedIn || STANDARD_PRESET_DATASET_KEYS.has(key))
    .filter(([, dataset]) => !migratedLabels.has(normalizeDatasetLabel(dataset.label)))
    .map(([key, dataset]) => ({
      key,
      label: dataset.label,
      cards: dataset.cards,
      isCustom: false,
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
    if (!isLoggedIn && !STANDARD_PRESET_DATASET_KEYS.has(normalizedKey)) {
      return null;
    }
    const dataset = PRESET_DATASETS[normalizedKey];
    return { key: normalizedKey, label: dataset.label, cards: dataset.cards, isCustom: false };
  }
  const directCustomDataset = state.customDatasets[normalizedKey];
  if (directCustomDataset) {
    if (!canAccessCustomDataset(directCustomDataset)) return null;
    const dataset = normalizeStoredCustomDataset(directCustomDataset);
    if (!dataset) return null;
    return {
      key: toCustomDatasetKey(dataset.id),
      label: dataset.label,
      cards: dataset.cards,
      isCustom: true,
      isPublic: Boolean(dataset.isPublic),
      id: dataset.id,
    };
  }
  const customId = fromCustomDatasetKey(normalizedKey);
  if (customId) {
    const rawDataset = state.customDatasets[customId];
    if (!canAccessCustomDataset(rawDataset)) return null;
    const dataset = normalizeStoredCustomDataset(rawDataset);
    if (!dataset) return null;
    return {
      key: toCustomDatasetKey(dataset.id),
      label: dataset.label,
      cards: dataset.cards,
      isCustom: true,
      isPublic: Boolean(dataset.isPublic),
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

function resolveDefaultDatasetKey() {
  const availableDatasets = getAllDatasetEntries();
  // Prefer "Mittel" as default if available
  const mittelDataset = availableDatasets.find((d) => d.label.trim().toLowerCase() === "mittel");
  if (mittelDataset) {
    return mittelDataset.key;
  }
  // Fallback to legacy default
  const defaultLabel = (PRESET_DATASETS[DEFAULT_DATASET_KEY]?.label ?? "standard").trim().toLowerCase();
  return availableDatasets.find((d) => d.label.trim().toLowerCase() === defaultLabel)?.key
    ?? (availableDatasets.some((d) => d.key === DEFAULT_DATASET_KEY) ? DEFAULT_DATASET_KEY : "")
    ?? availableDatasets[0]?.key
    ?? "";
}

function refreshDatasetSelections() {
  // Ensure at least the default dataset is selected
  const hasValidSelection = state.selectedDatasets.some((key) => getDatasetEntryByKey(key));
  if (!hasValidSelection) {
    const defaultKey = resolveDefaultDatasetKey();
    if (defaultKey) {
      state.selectedDatasets = [defaultKey];
    }
  }
  setupDatasetSelects();
  applySelectedDatasets();
  syncStorageDatasetListSelectionState();
  updateSelectedDatasetsSummaryRow();
}

function updateSelectedDatasetsSummaryRow() {
  if (!storageDatasetSummary) return;
  const row = storageDatasetSummary.querySelector("tr[data-selected-datasets-summary]");
  if (!row) return;

  const datasetEntries = getAllDatasetEntries();
  const allCategories = [...SELECTABLE_CARD_CATEGORIES];

  const selectedKeys = new Set(readSelectedDatasetKeys());
  const selectedEntries = datasetEntries.filter((entry) => selectedKeys.has(entry.key));

  const counts = Object.fromEntries(allCategories.map((cat) => [cat, 0]));
  let totalCards = 0;
  selectedEntries.forEach((entry) => {
    const cards = Array.isArray(entry?.cards) ? entry.cards : [];
    cards.forEach((card) => {
      const cat = String(card?.category ?? "").trim();
      if (cat && Object.hasOwn(counts, cat)) {
        counts[cat] += 1;
      }
    });
  });

  totalCards = allCategories.reduce((sum, category) => sum + Number(counts[category] ?? 0), 0);

  allCategories.forEach((category) => {
    const cell = row.querySelector(`td[data-selected-summary-category="${CSS.escape(category)}"]`);
    if (!cell) return;
    const value = Number(counts[category] ?? 0);
    cell.textContent = String(value);
    cell.classList.toggle("is-empty", value === 0);

    const visuals = CATEGORY_VISUALS[category];
    const bg = visuals?.color ?? "#F3E9D3";
    const fg = getReadableTextColor(bg);
    cell.style.setProperty("--category-color", bg);
    cell.style.setProperty("--category-text-color", fg);
  });

  const totalCell = row.querySelector("td[data-selected-summary-total]");
  if (totalCell) {
    totalCell.textContent = String(totalCards);
    totalCell.classList.toggle("is-empty", totalCards === 0);
  }
}

function getDefaultRoundTimeForCategory(category) {
  if (category === "Vokabel") return 20;
  return category === "Quizfrage" || category === "Single-Choice" ? 30 : 60;
}


function populateTimeSelect(selectEl, defaultValue = 60) {
  if (!selectEl) return;
  for (let i = 10; i <= 120; i += 10) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}s`;
    if (i === defaultValue) option.selected = true;
    selectEl.appendChild(option);
  }
}

function getSelectedCategories(controls) {
  return controls
    .filter((control) => control.checkbox?.checked)
    .map((control) => control.category);
}

function setDatasetSelectionInvalidState(isInvalid) {
  datasetSelectList?.classList.toggle("selection-invalid", isInvalid);
  datasetSelect?.classList.toggle("selection-invalid", isInvalid);
  storageDatasetSelect?.classList.toggle("selection-invalid", isInvalid);
}

function setCategorySelectionInvalidState(controls, isInvalid) {
  controls.forEach((control) => {
    const row = control.checkbox?.closest(".category-setting") ?? control.timeSelect?.closest(".category-setting");
    row?.classList.toggle("selection-invalid", isInvalid);
  });
}

function updateMainMenuRequiredSelectionState() {
  const selectedDatasetKeys = readSelectedDatasetKeys();
  const hasSelectedDatasets = selectedDatasetKeys.length > 0;
  const selectedCategories = state.categories.filter((category) => SELECTABLE_CARD_CATEGORIES.includes(category));
  const hasSelectedCategories = selectedCategories.length > 0;

  setDatasetSelectionInvalidState(!hasSelectedDatasets);
  if (menuCategoryControls.length > 0) {
    setCategorySelectionInvalidState(menuCategoryControls, !hasSelectedCategories);
  }
  boardCategoriesContainer?.classList.toggle("selection-invalid", !hasSelectedCategories);

  return hasSelectedDatasets && hasSelectedCategories;
}

function readCategoryTimes(controls) {
  if (controls.length === 0) {
    return Object.fromEntries(ALLOWED_CARD_CATEGORIES.map((category) => [category, getDefaultRoundTimeForCategory(category)]));
  }
  return controls.reduce((times, control) => {
    times[control.category] = Number.parseInt(control.timeSelect.value, 10);
    return times;
  }, { [MASTER_QUIZ_CATEGORY]: getDefaultRoundTimeForCategory(MASTER_QUIZ_CATEGORY) });
}

function syncCategoryControls(controls, selectedCategories, categoryTimes) {
  controls.forEach((control) => {
    if (control.checkbox) {
      control.checkbox.checked = selectedCategories.includes(control.category);
    }
    if (categoryTimes[control.category] && control.timeSelect) {
      control.timeSelect.value = categoryTimes[control.category];
    }
  });
  renderBoardCategorySelector();
  renderBoardCategoryOptions();
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
  if (teamCountDecrease) {
    teamCountDecrease.disabled = clamped <= 2;
  }
  if (teamCountIncrease) {
    teamCountIncrease.disabled = clamped >= 4;
  }
  renderTeams(clamped);
}

function closeAllTeamPickers() {
  [teamListContainer].forEach((container) => {
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
  buildBoard(state.categories, { preserveAssignments: true });
  syncBoardDecorations();
}

function syncBoardSizeControls(size) {
  boardSizeInputs.forEach((input) => {
    input.checked = input.value === size;
  });
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

function getEventTargetElement(event) {
  return event.target instanceof Element ? event.target : null;
}

function handleTeamListClick(event) {
  const targetElement = getEventTargetElement(event);
  if (!targetElement) {
    return;
  }
  const iconToggle = targetElement.closest("[data-team-icon-toggle]");
  if (iconToggle) {
    const picker = iconToggle.closest(".team-picker");
    if (picker) {
      toggleTeamPicker(picker, iconToggle);
    }
    return;
  }
  const iconOption = targetElement.closest("[data-team-icon-option]");
  if (iconOption) {
    const picker = iconOption.closest(".team-picker");
    const value = iconOption.dataset.iconValue;
    if (picker && value) {
      updatePickerSelection(picker, value);
      closeAllTeamPickers();
    }
  }
}

function buildBoard(categories = state.categories, { preserveAssignments = false } = {}) {
  const existingTokens = [...board.querySelectorAll(".token")];
  board.innerHTML = "";
  const cells = [];
  const { rows, cols, total } = state.boardDimensions;
  board.style.setProperty("--board-cols", cols);
  board.style.setProperty("--board-rows", rows);
  let assignments = [];
  const hasStoredAssignments =
    preserveAssignments
    && Array.isArray(state.boardCategories)
    && state.boardCategories.length === total;

  if (hasStoredAssignments) {
    assignments = [...state.boardCategories];
  } else {
    const weightedAssignments = createWeightedBoardAssignments(
      categories,
      Math.max(0, total - 2),
      state.categoryWeights
    );
    for (let index = 0; index < total; index += 1) {
      if (index === 0 || index === total - 1) {
        assignments[index] = null;
      } else if (weightedAssignments.length > 0) {
        assignments[index] = weightedAssignments[index - 1];
      } else {
        assignments[index] = null;
      }
    }
    state.boardCategories = assignments;
    state.lastBoardSelectedCategories = [...state.selectedBoardCategories];
    state.lastBoardCategoryWeights = { ...state.categoryWeights };
  }
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

function createTokens(teamData, { preservePositions = false } = {}) {
  board.querySelectorAll(".token").forEach((token) => token.remove());
  const teams = teamData.map((team) => ({ ...team }));
  const nextPositions = preservePositions && Array.isArray(state.positions) && state.positions.length === teams.length
    ? [...state.positions]
    : teams.map(() => 0);

  state.positions = nextPositions;
  state.teams = teams;
  teams.forEach((team, index) => {
    const token = document.createElement("div");
    token.className = "token";
    token.dataset.team = index;
    token.dataset.icon = team.icon;
    token.style.opacity = "0";
    const tokenIcon = document.createElement("span");
    tokenIcon.className = "token-icon";
    tokenIcon.textContent = team.icon;
    const tokenName = document.createElement("span");
    tokenName.className = "token-name";
    tokenName.textContent = team.name || `Team ${index + 1}`;
    token.append(tokenIcon, tokenName);
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

function syncBoardDecorations(attemptsLeft = 12) {
  if (!board) return;

  const boardHasSize = board.clientWidth > 0 && board.clientHeight > 0;
  const firstCell = board.querySelector('.board-cell[data-index="0"]');
  const cellRect = firstCell?.getBoundingClientRect();
  const cellHasSize = Boolean(cellRect && cellRect.width > 0 && cellRect.height > 0);

  if (!boardHasSize || !cellHasSize) {
    if (attemptsLeft <= 0) {
      renderBoardPath();
      positionTokens();
      return;
    }
    requestAnimationFrame(() => syncBoardDecorations(attemptsLeft - 1));
    return;
  }

  renderBoardPath();
  positionTokens();
}

function positionTokens() {
  state.positions.forEach((pos, index) => {
    const cell = board.querySelector(`.board-cell[data-index="${pos}"]`);
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const token = board.querySelector(`.token[data-team="${index}"]`);
    if (!token) return;
    token.classList.toggle("is-active", index === state.currentTeam && !state.gameOver);
    token.classList.toggle("is-waiting-roll", isWaitingForRoll(index));
    const quadrantX = index % 2 === 0 ? 0.28 : 0.72;
    const quadrantY = index < 2 ? 0.28 : 0.72;
    token.style.left = `${rect.left - boardRect.left + rect.width * quadrantX}px`;
    token.style.top = `${rect.top - boardRect.top + rect.height * quadrantY}px`;
    token.style.opacity = "1";
  });
  renderTeamStatus();
  storeActiveGameSnapshot();
}

function showOverlay(content, duration = 800) {
  overlayContent.textContent = content;
  const isBonus = typeof content === "string" && content.trim().startsWith("+");
  overlay?.classList.toggle("overlay--bonus", isBonus);
  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("hidden"), duration);
}

function updateTimerDisplay(value) {
  if (!turnTimer) return;
  turnTimer.textContent = `${value}`;
  const numericValue = Number(value);
  const isCritical = Number.isFinite(numericValue) && numericValue > 0 && numericValue <= 10;
  turnTimer.classList.toggle("is-critical", isCritical);
}

function setRoundCounterVisuals(value) {
  if (!turnRoundCounter) return;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const textColor = "rgba(255, 255, 255, 0.96)";
  let bg;

  if (value <= 0) {
    bg = "#E11D48";
  } else if (value === 1) {
    bg = "#2563EB";
  } else if (value === 2) {
    bg = "#14532D";
  } else {
    const lightness = clamp(32 + (value - 2) * 6, 32, 78);
    bg = `hsl(135 55% ${lightness}%)`;
  }

  turnRoundCounter.style.setProperty("--round-counter-bg", bg);
  turnRoundCounter.style.setProperty("--round-counter-text", textColor);
}

function updateRoundCounterDisplay(value) {
  if (!turnRoundCounter) return;
  const plusNode = turnRoundCounterPlus;
  turnRoundCounter.textContent = `${value}`;
  if (plusNode) {
    turnRoundCounter.append(plusNode);
  }
  setRoundCounterVisuals(value);
}

function animateRoundCounterPlusOne() {
  if (!turnRoundCounterPlus) return;
  turnRoundCounterPlus.classList.remove("is-animating");
  void turnRoundCounterPlus.offsetWidth;
  turnRoundCounterPlus.classList.add("is-animating");
}

function resetRoundState(category = "") {
  state.roundCounter = 0;
  state.roundTimer = 0;
  state.roundActive = false;
  state.currentCardType = category;
  updateRoundCounterDisplay(0);
}

function readStoredAudioPreference(storageKey, fallbackValue) {
  try {
    const storedValue = localStorage.getItem(storageKey);
    if (storedValue === null) return fallbackValue;
    return storedValue === "true";
  } catch (error) {
    return fallbackValue;
  }
}

function storeAudioPreference(storageKey, value) {
  try {
    localStorage.setItem(storageKey, String(value));
  } catch (error) {
    // Preferences are non-critical; unavailable storage should not affect gameplay.
  }
}

function updateAudioToggleButton(button, isEnabled, enabledLabel, disabledLabel) {
  if (!button) return;
  const label = isEnabled ? enabledLabel : disabledLabel;
  button.setAttribute("aria-pressed", String(isEnabled));
  button.setAttribute("aria-label", label);
  button.title = label;
}

function syncAudioToggleButtons() {
  updateAudioToggleButton(
    gameSoundToggle,
    state.gameSoundsEnabled,
    "Gamesounds ausschalten",
    "Gamesounds einschalten",
  );
  updateAudioToggleButton(
    musicToggle,
    state.musicEnabled,
    "Musik ausschalten",
    "Musik einschalten",
  );
}

function setGameSoundsEnabled(isEnabled) {
  state.gameSoundsEnabled = isEnabled;
  storeAudioPreference(GAME_SOUND_ENABLED_STORAGE_KEY, isEnabled);
  syncAudioToggleButtons();
}

function setMusicEnabled(isEnabled) {
  state.musicEnabled = isEnabled;
  storeAudioPreference(MUSIC_ENABLED_STORAGE_KEY, isEnabled);
  syncAudioToggleButtons();

  if (!isEnabled) {
    stopBoardViewLoop();
    stopMenuLoop();
    stopTurnTensionLoop();
    return;
  }

  unlockAudioOnFirstInteraction();
  syncBoardViewLoop();

  if (state.phase === GAME_PHASES.FULLSCREEN_CARD) {
    playTurnTensionLoop();
  }
}

function getGameAudioContext() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return null;
  }
  if (!gameAudioContext) {
    gameAudioContext = new AudioContextConstructor();
  }
  return gameAudioContext;
}

function playSound(createSound) {
  if (!state.gameSoundsEnabled) {
    return;
  }

  const audioContext = getGameAudioContext();
  if (!audioContext) {
    return;
  }

  const startSound = () => createSound(audioContext);
  if (audioContext.state === "suspended") {
    audioContext.resume().then(startSound).catch(() => {});
    return;
  }

  startSound();
}

function getTurnTensionAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!turnTensionAudio) {
    turnTensionAudio = new Audio(TURN_TENSION_SOUND_SRC);
    turnTensionAudio.loop = true;
    turnTensionAudio.preload = "auto";
    turnTensionAudio.volume = 0.45;
  }
  return turnTensionAudio;
}

function getBoardViewAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!boardViewAudio) {
    boardViewAudio = new Audio(BOARD_VIEW_SOUND_SRC);
    boardViewAudio.loop = true;
    boardViewAudio.preload = "auto";
    boardViewAudio.volume = 0.45;
  }
  return boardViewAudio;
}

function getMenuLoopAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!menuLoopAudio) {
    menuLoopAudio = new Audio(MENU_LOOP_SOUND_SRC);
    menuLoopAudio.loop = true;
    menuLoopAudio.preload = "auto";
    menuLoopAudio.volume = 0.4;
  }
  return menuLoopAudio;
}

function getCorrectAnswerAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!correctAnswerAudio) {
    correctAnswerAudio = new Audio(CORRECT_ANSWER_SOUND_SRC);
    correctAnswerAudio.preload = "auto";
    correctAnswerAudio.volume = 0.7;
  }
  return correctAnswerAudio;
}

function getWrongAnswerAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!wrongAnswerAudio) {
    wrongAnswerAudio = new Audio(WRONG_ANSWER_SOUND_SRC);
    wrongAnswerAudio.preload = "auto";
    wrongAnswerAudio.volume = 0.75;
  }
  return wrongAnswerAudio;
}

function getCountdownTickAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!countdownTickAudio) {
    countdownTickAudio = new Audio(COUNTDOWN_TICK_SOUND_SRC);
    countdownTickAudio.preload = "auto";
    countdownTickAudio.volume = 0.75;
  }
  return countdownTickAudio;
}

function getCountdownFinalAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!countdownFinalAudio) {
    countdownFinalAudio = new Audio(COUNTDOWN_FINAL_SOUND_SRC);
    countdownFinalAudio.preload = "auto";
    countdownFinalAudio.volume = 0.75;
  }
  return countdownFinalAudio;
}

function getDiceRollAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!diceRollAudio) {
    diceRollAudio = new Audio(DICE_ROLL_SOUND_SRC);
    diceRollAudio.preload = "auto";
    diceRollAudio.volume = 0.8;
  }
  return diceRollAudio;
}

function getStartGameAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!startGameAudio) {
    startGameAudio = new Audio(START_GAME_SOUND_SRC);
    startGameAudio.preload = "auto";
    startGameAudio.volume = 0.75;
  }
  return startGameAudio;
}

function getButtonClickAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }
  if (!buttonClickAudio) {
    buttonClickAudio = new Audio(BUTTON_CLICK_SOUND_SRC);
    buttonClickAudio.preload = "auto";
    buttonClickAudio.volume = 0.6;
  }
  return buttonClickAudio;
}

function playCorrectAnswerSound() {
  if (!state.gameSoundsEnabled) {
    return;
  }

  const audio = getCorrectAnswerAudio();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playWrongAnswerSound() {
  if (!state.gameSoundsEnabled) {
    return;
  }

  const audio = getWrongAnswerAudio();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function shouldPlayBoardViewLoop() {
  const activeRoute = normalizeRouteHash(window.location.hash);
  return (
    state.musicEnabled
    && activeRoute === "#/game-board"
    && !state.gameOver
    && state.phase !== GAME_PHASES.WINNER
    && state.phase !== GAME_PHASES.FULLSCREEN_CARD
    && !document.body.classList.contains("card-view-active")
  );
}

function shouldPlayMenuLoop() {
  const activeRoute = normalizeRouteHash(window.location.hash);
  return state.musicEnabled && !activeRoute.startsWith("#/game-");
}

function playBoardViewLoop() {
  if (!shouldPlayBoardViewLoop()) {
    return;
  }

  const audio = getBoardViewAudio();
  if (!audio) return;
  if (!audio.paused) return;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playMenuLoop() {
  if (!shouldPlayMenuLoop()) {
    return;
  }

  const audio = getMenuLoopAudio();
  if (!audio) return;
  if (!audio.paused) return;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playStartGameSound() {
  if (!state.gameSoundsEnabled) {
    return;
  }

  const audio = getStartGameAudio();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function shouldPlayGenericButtonSound(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return false;
  }
  if (button.disabled) {
    return false;
  }
  if (
    button === rollButton
    || button === startButton
    || button === sharedStartButton
    || button === sharedGameStartButton
    || button === turnReadyButton
    || button === turnCorrectButton
    || button === turnWrongButton
    || button === turnContinueButton
  ) {
    return false;
  }
  return true;
}

function playButtonClickSound() {
  if (!state.gameSoundsEnabled) {
    return;
  }

  const audio = getButtonClickAudio();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function stopBoardViewLoop() {
  if (!boardViewAudio) return;
  boardViewAudio.pause();
  boardViewAudio.currentTime = 0;
}

function stopMenuLoop() {
  if (!menuLoopAudio) return;
  menuLoopAudio.pause();
  menuLoopAudio.currentTime = 0;
}

function syncBoardViewLoop() {
  if (shouldPlayBoardViewLoop()) {
    playBoardViewLoop();
  } else {
    stopBoardViewLoop();
  }

  if (shouldPlayMenuLoop()) {
    playMenuLoop();
  } else {
    stopMenuLoop();
  }
}

function playTurnTensionLoop() {
  if (!state.musicEnabled) {
    return;
  }

  const audio = getTurnTensionAudio();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function stopTurnTensionLoop() {
  if (!turnTensionAudio) return;
  turnTensionAudio.pause();
  turnTensionAudio.currentTime = 0;
}

function playCountdownTick({ isFinal = false } = {}) {
  if (!state.gameSoundsEnabled) {
    return;
  }

  const audio = isFinal ? getCountdownFinalAudio() : getCountdownTickAudio();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playDiceRollSound() {
  if (!state.gameSoundsEnabled) {
    return;
  }

  const audio = getDiceRollAudio();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playTokenMoveSound() {
  playSound((audioContext) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    const duration = 0.09;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(260, now);
    oscillator.frequency.exponentialRampToValueAtTime(390, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  });
}

function startTimer({ onTimeout } = {}) {
  stopTimer();
  state.remainingTime = state.timeLimit;
  state.roundTimer = state.remainingTime;
  updateTimerDisplay(state.remainingTime);
  state.timer = setInterval(() => {
    state.remainingTime -= 1;
    state.roundTimer = state.remainingTime;
    updateTimerDisplay(state.remainingTime);
    if (state.remainingTime > 0 && state.remainingTime <= 10) {
      playCountdownTick();
    }
    if (state.remainingTime <= 0) {
      clearInterval(state.timer);
      playCountdownTick({ isFinal: true });
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
  turnPenalty.textContent = `- ${penalty}s`;
  turnPenalty.classList.remove("show");
  void turnPenalty.offsetWidth;
  turnPenalty.classList.add("show");
}

function getCardByCategory(category) {
  const pool = state.cards.filter((card) => {
    if (category === MASTER_QUIZ_CATEGORY) {
      return card.category === MASTER_QUIZ_CATEGORY;
    }
    if (category === "Quizfrage") {
      return card.category === "Quizfrage";
    }
    return card.category === category;
  });
  const fallbackPool = category === MASTER_QUIZ_CATEGORY && pool.length === 0
    ? state.cards.filter((card) => card.category === "Quizfrage")
    : pool;
  if (fallbackPool.length === 0) return null;
  return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
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

function clearSingleChoiceReturnTimer() {
  if (!state.singleChoiceReturnTimer) return;
  clearTimeout(state.singleChoiceReturnTimer);
  state.singleChoiceReturnTimer = null;
}

function clearAnswerReturnTimer() {
  if (!state.answerReturnTimer) return;
  clearTimeout(state.answerReturnTimer);
  state.answerReturnTimer = null;
}

function setTurnActionButtonsDisabled(isDisabled) {
  [
    turnCorrectButton,
    turnWrongButton,
    turnSwapButton,
    turnContinueButton,
  ].forEach((button) => {
    if (button) {
      button.disabled = isDisabled;
    }
  });
}

function setSingleChoiceResult(optionButton, isCorrect) {
  if (!turnSingleChoiceOptions) return;
  clearSingleChoiceReturnTimer();
  const optionButtons = [...turnSingleChoiceOptions.querySelectorAll(".single-choice-option-button")];
  const correctAnswer = normalizeAnswerOption(state.currentCard?.answer);
  optionButtons.forEach((button) => {
    button.disabled = true;
    button.classList.remove(
      "is-selected",
      "is-correct",
      "is-wrong",
      "is-animating",
      "is-correct-outline",
    );
  });

  const correctOptionButton = optionButtons.find((button) => {
    return normalizeAnswerOption(button.dataset.option ?? button.textContent) === correctAnswer;
  });

  if (optionButton) {
    optionButton.classList.add("is-selected", "is-animating");
    if (isCorrect) {
      optionButton.classList.add("is-correct");
      playCorrectAnswerSound();
    } else {
      optionButton.classList.add("is-wrong");
      playWrongAnswerSound();
    }
  }

  if (correctOptionButton && correctOptionButton !== optionButton) {
    correctOptionButton.classList.add("is-correct");
  }

  if (!state.roundActive) {
    stopTimer();
  }
  state.quizPhase = "answer";
  state.singleChoiceResult = {
    isCorrect,
    returnToPrevious: !isCorrect,
  };
  turnSwapButton?.classList.add("hidden");
  turnContinueButton?.classList.add("hidden");
  state.singleChoiceReturnTimer = setTimeout(() => {
    state.singleChoiceReturnTimer = null;
    if (state.phase !== GAME_PHASES.FULLSCREEN_CARD || state.pendingCategory !== "Single-Choice") return;
    if (state.roundActive) {
      handleRoundAnswer(isCorrect);
      return;
    }
    finishTurn(isCorrect, false, { returnToPrevious: !isCorrect });
  }, SINGLE_CHOICE_RETURN_DELAY_MS);
}

function loadNextRoundCard() {
  if (!state.roundActive) return;
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (!state.currentCardType) {
    state.currentCardType = state.pendingCategory ?? "";
  }
  const card = getCardByCategory(state.currentCardType);
  state.currentCard = card;
  if (isAnswerCardCategory(state.currentCardType)) {
    state.singleChoiceResult = null;
    state.quizPhase = "question";
    setQuizQuestionCard(card);
    const isSingleChoice = state.currentCardType === "Single-Choice";
    if (turnContinueButton) {
      turnContinueButton.textContent = isSingleChoice ? "Weiter" : "Lösen";
    }
    setTurnButtons({
      showCorrect: false,
      showWrong: false,
      showSwap: true,
      showContinue: !isSingleChoice,
    });
  } else {
    state.quizPhase = null;
    setWordCard(card);
    setTurnButtons({ showCorrect: true, showWrong: true, showSwap: true, showContinue: false });
  }
}

function scheduleNextCardAfterAnswerDelay() {
  if (state.answerReturnTimer) return;
  setTurnActionButtonsDisabled(true);
  state.answerReturnTimer = setTimeout(() => {
    state.answerReturnTimer = null;
    setTurnActionButtonsDisabled(false);
    loadNextRoundCard();
  }, ANSWER_RETURN_DELAY_MS);
}

function handleRoundAnswer(isCorrect) {
  if (!state.roundActive) return;
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;

  clearAnswerReturnTimer();
  clearSingleChoiceReturnTimer();

  const shouldPlayAnswerSound = state.pendingCategory !== "Single-Choice";

  if (isCorrect) {
    state.roundCounter += 1;
    updateRoundCounterDisplay(state.roundCounter);
    animateRoundCounterPlusOne();
    if (shouldPlayAnswerSound) {
      playCorrectAnswerSound();
    }
  } else {
    if (shouldPlayAnswerSound) {
      playWrongAnswerSound();
    }
  }

  scheduleNextCardAfterAnswerDelay();
}

function endRound({ timedOut = false } = {}) {
  if (!state.roundActive) return;
  if (state.pendingRoll === null) {
    resetRoundState(state.currentCardType);
    hideTurnOverlay({ immediate: timedOut });
    return;
  }

  clearAnswerReturnTimer();
  clearSingleChoiceReturnTimer();
  stopTimer();

  const teamIndex = state.currentTeam;
  const wasMasterQuiz = state.masterQuiz;
  state.masterQuiz = false;

  const startPosition = state.turnStartPositions?.[teamIndex] ?? state.positions[teamIndex];
  const rolledPosition = state.positions[teamIndex];
  const counter = state.roundCounter;
  const extraSteps = Math.max(0, counter - 1);
  const roundCardType = state.currentCardType || state.pendingCategory || "";

  state.turnStartPositions = null;
  state.pendingRoll = null;
  state.pendingCategory = null;
  state.currentCard = null;
  state.quizPhase = null;
  state.singleChoiceResult = null;
  state.roundActive = false;

  hideTurnOverlay({ immediate: timedOut });

  const runPostRoundMovement = async () => {
    if (counter === 0) {
      const stepsBack = rolledPosition - startPosition;
      if (stepsBack > 0) {
        await moveToken(-stepsBack, teamIndex);
      }
      return;
    }
    if (extraSteps > 0) {
      if (timedOut) {
        showOverlay(`+${extraSteps}`, 1000);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await moveToken(extraSteps, teamIndex);
    }
  };

  setTimeout(() => {
    runPostRoundMovement().then(() => {
      if (wasMasterQuiz && counter > 0) {
        if (state.positions[teamIndex] === state.boardDimensions.total - 1) {
          showWinner(formatTeamLabel(teamIndex));
          resetRoundState("");
          return;
        }
        state.currentTeam = (state.currentTeam + 1) % state.teams.length;
        setNextRollStatus(state.currentTeam);
        renderTeamStatus();
        resetRoundState("");
        storeActiveGameSnapshot();
      }
      state.currentTeam = (state.currentTeam + 1) % state.teams.length;
      setNextRollStatus(state.currentTeam);
      renderTeamStatus();
      resetRoundState("");
      setTurnActionButtonsDisabled(false);
      storeActiveGameSnapshot();
    });
  }, 350);
}

function setQuizQuestionCard(card) {
  turnWord?.classList.add("is-quiz-question");
  fullscreenCardOverlay.update({
    category: state.pendingCategory,
    term: card?.term ?? "Keine Quizfrage",
    tabooTerms: [],
    showHint: state.pendingCategory !== "Single-Choice"
      && state.pendingCategory !== "Quizfrage"
      && state.pendingCategory !== MASTER_QUIZ_CATEGORY,
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
  setTurnActionButtonsDisabled(false);
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
  if (turnOverlayPanel) {
    turnOverlayPanel.dataset.category = category;
  }
  applyCategoryIcon(turnCategoryIcon, category, { allowFallback: true });
}

function setCategory(category) {
  setCategoryLabel(category, category);
}

function handleRoll() {
  if (isRolling || state.pendingRoll !== null || state.timer || state.phase !== GAME_PHASES.IDLE || state.gameOver) {
    return;
  }

  statusText?.classList.add("hidden");
  rollButton?.classList.remove("dice--pulse");

  const roll = Math.floor(Math.random() * 6) + 1;
  playDiceRollSound();
  isRolling = true;
  rollButton.disabled = true;
  state.pendingRoll = roll;
  positionTokens();
  renderTeamStatus();
  const previousPositions = [...state.positions];
  state.history.push({
    positions: previousPositions,
    team: state.currentTeam,
  });
  state.turnStartPositions = previousPositions;

  animateDiceRoll(roll).then(() => {
    isRolling = false;
    rollButton.disabled = false;
    setTimeout(() => {
      moveToken(roll).then(() => {
        if (state.positions[state.currentTeam] >= state.boardDimensions.total - 1) {
          hideDiceOverlay();
          state.masterQuiz = true;
          state.pendingCategory = MASTER_QUIZ_CATEGORY;
          setCategoryLabel(MASTER_QUIZ_CATEGORY, MASTER_QUIZ_CATEGORY);
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
    }, 1500);
  });
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
      playTokenMoveSound();
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

function finishTurn(isCorrect, timedOut = false, { returnToPrevious = false, wrongSoundAlreadyPlayed = false } = {}) {
  clearAnswerReturnTimer();
  clearSingleChoiceReturnTimer();
  if (state.pendingRoll === null) {
    setTurnActionButtonsDisabled(false);
    return;
  }
  const wasSingleChoiceWrong = state.singleChoiceResult?.isCorrect === false;
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
    if (!wasSingleChoiceWrong && !wrongSoundAlreadyPlayed) {
      playWrongAnswerSound();
    }
    showOverlay("❌", 900);
  }
  hideTurnOverlay();
  resetRoundState("");
  state.pendingRoll = null;
  state.pendingCategory = null;
  state.currentCard = null;
  state.quizPhase = null;
  state.singleChoiceResult = null;
  if (wasMasterQuiz && isCorrect) {
    if (state.positions[teamIndex] === state.boardDimensions.total - 1) {
      showWinner(formatTeamLabel(teamIndex));
      return;
    }
    state.currentTeam = (state.currentTeam + 1) % state.teams.length;
    setNextRollStatus(state.currentTeam);
    renderTeamStatus();
    storeActiveGameSnapshot();
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
  setTurnActionButtonsDisabled(false);
}

function finishTurnAfterAnswerDelay(isCorrect, timedOut = false, { returnToPrevious = false } = {}) {
  if (state.answerReturnTimer) return;
  stopTimer();
  setTurnActionButtonsDisabled(true);
  if (isCorrect) {
    playCorrectAnswerSound();
  } else {
    playWrongAnswerSound();
  }
  state.answerReturnTimer = setTimeout(() => {
    state.answerReturnTimer = null;
    finishTurn(isCorrect, timedOut, {
      returnToPrevious,
      wrongSoundAlreadyPlayed: !isCorrect,
    });
  }, ANSWER_RETURN_DELAY_MS);
}

function handleUndo() {
  const last = state.history.pop();
  if (!last) return;

  stopTimer();
  hideTurnOverlay();
  hideDiceOverlay();
  resetRoundState("");

  state.positions = last.positions;
  state.currentTeam = last.team;
  state.pendingRoll = null;
  state.pendingCategory = null;
  state.turnStartPositions = null;
  state.currentCard = null;
  state.quizPhase = null;
  state.singleChoiceResult = null;
  state.phase = GAME_PHASES.IDLE;
  positionTokens();
  renderTeamStatus();
  storeActiveGameSnapshot();
}

function applyAdvancedSettingsAndReturn() {
  const selectedCategories = [...SELECTABLE_CARD_CATEGORIES];
  setCategorySelectionInvalidState(menuCategoryControls, false);

  const selectedBoardSize = getSelectedBoardSize(boardSizeSelect ?? boardSizeInputs);
  syncBoardSizeControls(selectedBoardSize);
  applyBoardSize(selectedBoardSize);

  state.categories = selectedCategories;
  state.categoryTimes = readCategoryTimes(menuCategoryControls);
  state.timeLimit = state.categoryTimes[selectedCategories[0]] ?? 60;
  state.swapPenalty = Number.parseInt(swapSelect.value, 10);

  setRoute("#/settings-board");
  updateMainMenuRequiredSelectionState();
}

function handleStartGame() {
  clearSingleChoiceReturnTimer();
  const isMainMenuComplete = updateMainMenuRequiredSelectionState();
  if (!isMainMenuComplete) {
    return;
  }

  state.isStartingGame = true;
  clearStoredActiveGameSnapshot();
  state.boardCategories = [];

  applySelectedDatasets();

  const selectedCategories = state.categories.filter((category) => SELECTABLE_CARD_CATEGORIES.includes(category));
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
  showGamePanel();
  requestAnimationFrame(() => {
    buildBoard(state.categories, { preserveAssignments: false });
    createTokens(teams, { preservePositions: false });
    playStartGameSound();
    syncBoardDecorations();
    state.isStartingGame = false;
    storeActiveGameSnapshot();
  });
  state.currentTeam = 0;
  state.pendingRoll = null;
  state.pendingCategory = null;
  state.gameOver = false;
  state.phase = GAME_PHASES.IDLE;
  storeActiveGameSnapshot();
  syncBoardViewLoop();
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
    const wrongAnswers = Array.isArray(rawRow.wrongAnswers)
      ? rawRow.wrongAnswers.map((entry) => String(entry ?? "").trim()).filter(Boolean).slice(0, 3)
      : normalizedTaboo.slice(1, 4);
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
      rowErrors.push("Antwort ist für Quizfrage/Masterquizfrage/Vokabel/Single-Choice erforderlich");
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
  syncEditorCategorySelectStyle(select);
  select.addEventListener("change", () => syncEditorCategorySelectStyle(select));
  return select;
}

function syncEditorCategorySelectStyle(select) {
  if (!select) return;
  const category = String(select.value ?? "");
  const visuals = CATEGORY_VISUALS[category];
  const bg = visuals?.color ?? "#F3E9D3";
  const fg = getReadableTextColor(bg);
  select.style.setProperty("--category-select-bg", bg);
  select.style.setProperty("--category-select-fg", fg);
  select.dataset.category = category;
}

function createEditorInput(field, value = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.dataset.field = field;
  input.value = value;
  return input;
}

function getEditorRowCells(row) {
  return row ? [...row.querySelectorAll('select[data-field], input[data-field]')] : [];
}

function handleEditorTablePaste(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.dataset.field == null) {
    return;
  }

  const pasted = event.clipboardData?.getData("text/plain") ?? "";
  if (!pasted.includes("\t") && !pasted.includes("\n")) {
    return;
  }

  const currentRow = target.closest("tr[data-row-id]");
  if (!currentRow || !cardEditorBody) return;
  event.preventDefault();

  const rows = pasted
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.length > 0)
    .map((line) => line.split("\t"));

  if (rows.length === 0) return;

  const rowElements = [...cardEditorBody.querySelectorAll("tr[data-row-id]")];
  const startRowIndex = rowElements.indexOf(currentRow);
  const startCells = getEditorRowCells(currentRow);
  const startColumnIndex = startCells.indexOf(target);
  if (startRowIndex < 0 || startColumnIndex < 0) return;

  while (rowElements.length < startRowIndex + rows.length) {
    const newRow = createEditorRow({ category: "Erklären", term: "", taboo: [] });
    cardEditorBody.append(newRow);
    rowElements.push(newRow);
  }

  rows.forEach((values, rowOffset) => {
    const row = rowElements[startRowIndex + rowOffset];
    const cells = getEditorRowCells(row);
    values.forEach((value, colOffset) => {
      const field = cells[startColumnIndex + colOffset];
      if (!field) return;
      field.value = value.trim();
    });
  });

  updateEditorValidationState();
}

function createEditorRow(card = {}) {
  const rowId = `card-row-${cardEditorRowCounter++}`;
  const row = document.createElement("tr");
  row.dataset.rowId = rowId;

  const category = ALLOWED_CARD_CATEGORIES.includes(card.category) ? card.category : "Erklären";
  const taboos = Array.isArray(card.taboo) ? card.taboo : [];
  const wrongAnswers = Array.isArray(card.wrongAnswers) ? card.wrongAnswers : [];
  const answerOrTabu = isAnswerCardCategory(category) ? card.answer ?? "" : taboos[0] ?? "";

  const categorySelect = createCategorySelect(category);
  categorySelect.addEventListener("change", () => {
    syncEditorRowCategoryStyle(row);
  });

  const columns = [
    categorySelect,
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

  syncEditorRowCategoryStyle(row);

  return row;
}

function syncEditorRowCategoryStyle(row) {
  if (!row) return;
  const category = row.querySelector('select[data-field="category"]')?.value ?? "";
  const visuals = CATEGORY_VISUALS[category];
  const bg = visuals?.color ?? "#F3E9D3";
  const fg = getReadableTextColor(bg);
  row.style.setProperty("--editor-row-category", bg);
  row.style.setProperty("--editor-row-category-text", fg);
  row.dataset.category = category;
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
  if (!requireFullAccess()) return;
  renderCardEditorRows(cloneCards(state.cards));
  updateEditorValidationState();
  refreshEditorCustomDatasetSelect(cardEditorDatasetSelect?.value ?? "");
  showCardsetsPanel();
}

function closeCardEditor() {
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
  syncCsvVisibilityFromSelectedDataset();
}

function getDatasetVisibilityStatus(datasetId) {
  return state.customDatasets[datasetId]?.isPublic ? "Global veröffentlicht" : "Nur für dich";
}

async function saveCardsAsCustomDataset({ cards, label, existingId = "", isPublic = false }) {
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
    isPublic: Boolean(canPublishPublicDatasets() && isPublic),
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

// ========== EDITOR DATASET MANAGEMENT ==========

let editorStatusTimer = null;

function updateEditorStatus(message, type = "") {
  if (!editorStatus) return;
  if (editorStatusTimer) clearTimeout(editorStatusTimer);
  editorStatus.textContent = message;
  editorStatus.className = "editor-status";
  if (type) editorStatus.classList.add(type);
  editorStatus.style.opacity = "1";
  editorStatusTimer = setTimeout(() => {
    editorStatus.style.transition = "opacity 0.4s ease";
    editorStatus.style.opacity = "0";
  }, 2000);
}

function clearEditorStatus() {
  if (!editorStatus) return;
  if (editorStatusTimer) clearTimeout(editorStatusTimer);
  editorStatus.textContent = "";
  editorStatus.className = "editor-status";
  editorStatus.style.opacity = "0";
}

function updateEditorUnsavedChanges() {
  state.editor.hasUnsavedChanges = true;
  updateEditorStatus("Ungespeicherte Änderungen");
}

function clearEditorUnsavedChanges() {
  state.editor.hasUnsavedChanges = false;
  updateEditorStatus("Gespeichert", "is-saved");
}

function showEditorUnsavedConfirm() {
  return new Promise((resolve) => {
    if (!editorUnsavedConfirm) return resolve("discard");
    editorUnsavedConfirm.classList.remove("hidden");

    const cleanup = () => {
      editorUnsavedConfirm.classList.add("hidden");
      editorUnsavedSave?.removeEventListener("click", onSave);
      editorUnsavedDiscard?.removeEventListener("click", onDiscard);
    };
    const onSave = () => { cleanup(); resolve("save"); };
    const onDiscard = () => { cleanup(); resolve("discard"); };

    editorUnsavedSave?.addEventListener("click", onSave);
    editorUnsavedDiscard?.addEventListener("click", onDiscard);
  });
}

function syncEditorSelectionToCardsets() {
  const editorKeys = new Set(editorSelectedDatasets);
  const checkboxes = [
    ...(storageDatasetSummary ? [...storageDatasetSummary.querySelectorAll('input.storage-dataset-checkbox[data-key]')] : []),
    ...(storageDatasetList ? [...storageDatasetList.querySelectorAll('input.storage-dataset-checkbox[data-key]')] : []),
  ];
  checkboxes.forEach((cb) => {
    const key = String(cb.dataset.key ?? "").trim();
    if (!key) return;
    cb.checked = editorKeys.has(key);
  });
  // Also update the game's selected datasets
  state.selectedDatasets = Array.from(editorKeys);
  refreshDatasetSelections();
}

function showEditorSaveConfirm(datasetName) {
  return new Promise((resolve) => {
    if (!editorSaveConfirm) return resolve(false);
    if (editorSaveConfirmText) {
      editorSaveConfirmText.textContent = `Bestehenden Kartensatz „${datasetName}" überschreiben?`;
    }
    editorSaveConfirm.classList.remove("hidden");

    const cleanup = () => {
      editorSaveConfirm.classList.add("hidden");
      editorSaveConfirmOk?.removeEventListener("click", onOk);
      editorSaveConfirmCancel?.removeEventListener("click", onCancel);
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };

    editorSaveConfirmOk?.addEventListener("click", onOk);
    editorSaveConfirmCancel?.addEventListener("click", onCancel);
  });
}

async function saveEditorDataset() {
  if (!isLoggedIn) {
    updateEditorStatus("Nicht eingeloggt - Anmeldung erforderlich", "has-error");
    return;
  }

  const { cards, errors } = updateEditorValidationState();
  if (errors.length > 0) {
    updateEditorStatus("Ungültige Zeilen - kann nicht speichern", "has-error");
    return;
  }

  if (cards.length === 0) {
    updateEditorStatus("Keine Karten zum Speichern", "has-error");
    return;
  }

  // Determine what type of dataset is currently loaded
  const selectedKeys = Array.from(editorSelectedDatasets);
  const currentKey = selectedKeys.length === 1 ? selectedKeys[0] : null;
  const currentEntry = currentKey ? getDatasetEntryByKey(currentKey) : null;

  // Check if current dataset is a user's own custom dataset
  const isOwnCustom = currentEntry?.isCustom === true;
  const isOwnStorage = currentEntry?.isStorage === true;
  const isOwn = isOwnCustom || isOwnStorage;

  // If it's an own dataset: show confirm modal to overwrite
  if (isOwn && state.editor.currentDatasetId) {
    const datasetName = stripDatasetLabelSuffix(state.editor.datasetName || currentEntry?.label || "Unbenannt");
    const confirmed = await showEditorSaveConfirm(datasetName);
    if (!confirmed) return;

    updateEditorStatus("Speichert…", "is-saving");
    state.editor.isSaving = true;

    const existingDataset = state.customDatasets[state.editor.currentDatasetId];
    const result = await saveCardsAsCustomDataset({
      cards,
      label: stripDatasetLabelSuffix(state.editor.datasetName || existingDataset?.label || "Unbenannter Datensatz"),
      existingId: state.editor.currentDatasetId,
      isPublic: existingDataset?.isPublic ?? false,
    });

    state.editor.isSaving = false;

    if (!result.ok) {
      if (result.persistenceResult?.conflict) {
        updateEditorStatus("Konflikt - bitte neu laden", "has-error");
      } else if (result.message?.includes("Name")) {
        updateEditorStatus("Name bereits vergeben", "has-error");
      } else {
        updateEditorStatus("Speichern fehlgeschlagen", "has-error");
      }
      return;
    }

    state.editor.currentDatasetId = result.datasetId;
    state.editor.datasetName = result.label;
    state.editor.lastSavedAt = new Date();
    clearEditorUnsavedChanges();
    refreshDatasetSelections();
    state.selectedDatasets = [toCustomDatasetKey(result.datasetId)];
    return;
  }

  // If it's a public/preset dataset or no dataset loaded: save as new copy
  const defaultName = currentEntry?.label ? `${stripDatasetLabelSuffix(currentEntry.label)} (Kopie)` : "";
  const label = window.prompt("Name für neuen Kartensatz eingeben:", defaultName);
  if (!label || !label.trim()) return;

  updateEditorStatus("Speichert…", "is-saving");
  state.editor.isSaving = true;

  const result = await saveCardsAsCustomDataset({
    cards,
    label: label.trim(),
    isPublic: false,
  });

  state.editor.isSaving = false;

  if (!result.ok) {
    if (result.message?.includes("Name")) {
      updateEditorStatus("Name bereits vergeben", "has-error");
    } else {
      updateEditorStatus("Speichern fehlgeschlagen", "has-error");
    }
    return;
  }

  state.editor.currentDatasetId = result.datasetId;
  state.editor.datasetName = result.label;
  state.editor.lastSavedAt = new Date();
  clearEditorUnsavedChanges();
  refreshDatasetSelections();
  state.selectedDatasets = [toCustomDatasetKey(result.datasetId)];
}

async function saveEditorDatasetAs() {
  if (!isLoggedIn) {
    updateEditorStatus("Nicht eingeloggt - Anmeldung erforderlich", "has-error");
    return;
  }

  const { cards, errors } = updateEditorValidationState();
  if (errors.length > 0) {
    updateEditorStatus("Ungültige Zeilen - kann nicht speichern", "has-error");
    return;
  }

  const defaultName = state.editor.datasetName || "";
  const label = window.prompt("Name für den neuen Datensatz:", defaultName);
  if (!label || !label.trim()) {
    return; // User cancelled
  }

  updateEditorStatus("Speichert…", "is-saving");
  state.editor.isSaving = true;

  const result = await saveCardsAsCustomDataset({
    cards,
    label: label.trim(),
    isPublic: false,
  });

  state.editor.isSaving = false;

  if (!result.ok) {
    if (result.message?.includes("bereits")) {
      window.alert("Ein Datensatz mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.");
      updateEditorStatus("Name bereits vergeben", "has-error");
    } else {
      updateEditorStatus("Speichern fehlgeschlagen", "has-error");
    }
    return;
  }

  state.editor.currentDatasetId = result.datasetId;
  state.editor.datasetName = result.label;
  state.editor.lastSavedAt = new Date();
  clearEditorUnsavedChanges();

  // Refresh main menu dataset list and auto-select the saved dataset
  refreshDatasetSelections();
  state.selectedDatasets = [toCustomDatasetKey(result.datasetId)];
}

async function loadEditorDataset() {
  if (!isLoggedIn) {
    updateEditorStatus("Nicht eingeloggt", "has-error");
    return;
  }

  // Reload datasets from API
  const { datasets, hasApiError } = await readCustomDatasetsFromApi();
  if (hasApiError || !datasets) {
    updateEditorStatus("Fehler beim Laden der Datensätze", "has-error");
    return;
  }

  state.customDatasets = datasets;

  const datasetList = Object.values(state.customDatasets)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (datasetList.length === 0) {
    window.alert("Keine gespeicherten Datensätze vorhanden.");
    return;
  }

  const options = datasetList.map((ds, index) => `${index + 1}. ${ds.label} (${ds.cards.length} Karten)`).join("\n");
  const selection = window.prompt(`Datensatz wählen (Nummer eingeben):\n\n${options}`);
  if (!selection) return;

  const index = parseInt(selection, 10) - 1;
  if (index < 0 || index >= datasetList.length) {
    updateEditorStatus("Ungültige Auswahl", "has-error");
    return;
  }

  const selectedDataset = datasetList[index];

  if (state.editor.hasUnsavedChanges) {
    const proceed = window.confirm("Ungespeicherte Änderungen gehen verloren. Trotzdem laden?");
    if (!proceed) return;
  }

  state.editor.currentDatasetId = selectedDataset.id;
  state.editor.datasetName = selectedDataset.label;
  renderCardEditorRows(cloneCards(selectedDataset.cards));
  updateEditorValidationState();
  clearEditorUnsavedChanges();
  updateEditorStatus(`Geladen: ${selectedDataset.label}`, "is-saved");

  // Initialize dataset selector and select the loaded dataset
  initEditorDatasetSelector();
  editorSelectedDatasets.add(toCustomDatasetKey(selectedDataset.id));
  updateSelectedCount();
  updateEditorDatasetsView();
}

async function renameEditorDataset() {
  if (!state.editor.currentDatasetId) {
    updateEditorStatus("Kein Datensatz zum Umbenennen", "has-error");
    return;
  }

  if (!isLoggedIn) {
    updateEditorStatus("Nicht eingeloggt", "has-error");
    return;
  }

  const newName = window.prompt("Neuer Name:", state.editor.datasetName);
  if (!newName || !newName.trim()) return;

  const trimmedName = newName.trim();
  if (trimmedName === state.editor.datasetName) return;

  updateEditorStatus("Umbenennen…", "is-saving");

  const { cards } = updateEditorValidationState();
  const result = await saveCardsAsCustomDataset({
    cards,
    label: trimmedName,
    existingId: state.editor.currentDatasetId,
    isPublic: false,
  });

  if (!result.ok) {
    if (result.message?.includes("bereits")) {
      window.alert("Ein Datensatz mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.");
      updateEditorStatus("Name bereits vergeben", "has-error");
    } else {
      updateEditorStatus("Umbenennen fehlgeschlagen", "has-error");
    }
    return;
  }

  state.editor.datasetName = trimmedName;
  clearEditorUnsavedChanges();
  updateEditorStatus(`Umbenannt in: ${trimmedName}`, "is-saved");
}

async function duplicateEditorDataset() {
  if (!state.editor.currentDatasetId) {
    // Duplicate current editor content as new dataset
    return saveEditorDatasetAs();
  }

  if (!isLoggedIn) {
    updateEditorStatus("Nicht eingeloggt", "has-error");
    return;
  }

  const baseName = state.editor.datasetName || "Kopie";
  let copyName = `${baseName} Kopie`;

  // Check for existing copies and increment number
  const existingNames = Object.values(state.customDatasets).map(ds => ds.label.toLowerCase());
  let counter = 2;
  while (existingNames.includes(copyName.toLowerCase())) {
    copyName = `${baseName} Kopie ${counter}`;
    counter++;
  }

  const { cards } = updateEditorValidationState();

  updateEditorStatus("Duplizieren…", "is-saving");

  const result = await saveCardsAsCustomDataset({
    cards: cloneCards(cards),
    label: copyName,
    isPublic: false,
  });

  if (!result.ok) {
    updateEditorStatus("Duplizieren fehlgeschlagen", "has-error");
    return;
  }

  state.editor.currentDatasetId = result.datasetId;
  state.editor.datasetName = copyName;
  clearEditorUnsavedChanges();
  updateEditorStatus(`Dupliziert als: ${copyName}`, "is-saved");

  // Refresh main menu dataset list and auto-select the duplicated dataset
  refreshDatasetSelections();
  state.selectedDatasets = [toCustomDatasetKey(result.datasetId)];
}

async function deleteEditorDataset() {
  if (!state.editor.currentDatasetId) {
    updateEditorStatus("Kein Datensatz zum Löschen", "has-error");
    return;
  }

  if (!isLoggedIn) {
    updateEditorStatus("Nicht eingeloggt", "has-error");
    return;
  }

  const confirmed = window.confirm(
    `Möchtest du "${state.editor.datasetName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
  );
  if (!confirmed) return;

  updateEditorStatus("Löschen…", "is-saving");

  const dataset = state.customDatasets[state.editor.currentDatasetId];
  delete state.customDatasets[state.editor.currentDatasetId];

  const persistenceResult = await persistCustomDatasets({
    operation: "delete",
    datasetId: state.editor.currentDatasetId,
    previousDataset: dataset,
  });

  if (!persistenceResult.ok) {
    state.customDatasets[state.editor.currentDatasetId] = dataset;
    updateEditorStatus("Löschen fehlgeschlagen", "has-error");
    return;
  }

  // Reset editor to empty state
  state.editor.currentDatasetId = null;
  state.editor.datasetName = "";
  state.editor.hasUnsavedChanges = false;
  renderCardEditorRows([]);
  addEditorRow();
  updateEditorValidationState();
  updateEditorStatus("Gelöscht - Neuer Datensatz", "is-saved");

  // Refresh main menu and clear selection of deleted dataset
  refreshDatasetSelections();
  state.selectedDatasets = [resolveDefaultDatasetKey()];
}

async function newEditorDataset() {
  if (state.editor.hasUnsavedChanges) {
    const action = await showEditorUnsavedConfirm();
    if (action === "save") {
      await saveEditorDataset();
      if (state.editor.hasUnsavedChanges) return;
    }
    // "discard" falls through to name prompt
  }

  const name = await showDatasetNamePrompt("Name für neuen Datensatz:", "");
  if (!name) return;

  // Save an empty dataset with one blank card so it appears in the system
  updateEditorStatus("Erstellt…", "is-saving");
  const blankCard = { category: "Tabu", term: "", taboos: ["", "", "", ""] };
  const result = await saveCardsAsCustomDataset({
    cards: [blankCard],
    label: name,
    isPublic: false,
  });

  if (!result.ok) {
    updateEditorStatus("Erstellen fehlgeschlagen", "has-error");
    return;
  }

  // Refresh so the new dataset is available
  await refreshPublicCsvList();

  // Add the new dataset to the editor selection (keep existing)
  const newKey = toCustomDatasetKey(result.datasetId);
  editorSelectedDatasets.add(newKey);

  // Repopulate dropdown so the new dataset checkbox is checked
  populateDatasetDropdown();

  // Update view
  updateSelectedCount();
  updateEditorDatasetsView();
  syncEditorCurrentDataset();

  // Collapse all sections except the new one
  if (editorMultiSections) {
    editorMultiSections.querySelectorAll(".editor-dataset-section").forEach((section) => {
      if (section.dataset.datasetKey === newKey) {
        section.classList.add("expanded");
      } else {
        section.classList.remove("expanded");
      }
    });
  }

  updateEditorStatus(`Neuer Datensatz: ${name}`);
}

function toggleMoreMenu() {
  if (!editorMoreDropdown) return;
  const isHidden = editorMoreDropdown.classList.contains("hidden");
  if (isHidden) {
    editorMoreDropdown.classList.remove("hidden");
    editorMoreButton?.setAttribute("aria-expanded", "true");
  } else {
    editorMoreDropdown.classList.add("hidden");
    editorMoreButton?.setAttribute("aria-expanded", "false");
  }
}

function closeMoreMenu() {
  if (!editorMoreDropdown) return;
  editorMoreDropdown.classList.add("hidden");
  editorMoreButton?.setAttribute("aria-expanded", "false");
}

// ========== DATASET SELECTOR FUNCTIONS ==========

// Store which datasets are currently selected in the editor
let editorSelectedDatasets = new Set();

function toggleDatasetDropdown() {
  if (!editorDatasetDropdown) return;
  const isHidden = editorDatasetDropdown.classList.contains("hidden");
  if (isHidden) {
    populateDatasetDropdown();
    editorDatasetDropdown.classList.remove("hidden");
    editorDatasetDropdownToggle?.setAttribute("aria-expanded", "true");
  } else {
    editorDatasetDropdown.classList.add("hidden");
    editorDatasetDropdownToggle?.setAttribute("aria-expanded", "false");
  }
}

function closeDatasetDropdown() {
  if (!editorDatasetDropdown) return;
  editorDatasetDropdown.classList.add("hidden");
  editorDatasetDropdownToggle?.setAttribute("aria-expanded", "false");
}

function populateDatasetDropdown() {
  if (!editorDatasetList) return;

  editorDatasetList.innerHTML = "";

  // Use getAllDatasetEntries() - same data source as cardsets table
  const datasetEntries = getAllDatasetEntries();

  // Determine groups (same logic as renderStorageDatasetList)
  const getEntryGroup = (entry) => {
    if (entry?.isStorage) return "own";
    if (entry?.isCustom) {
      const customId = entry?.id ?? fromCustomDatasetKey(entry?.key);
      const dataset = customId ? state.customDatasets[customId] : null;
      return dataset?.isPublic ? "public" : "own";
    }
    return "public";
  };

  const publicEntries = datasetEntries.filter((e) => getEntryGroup(e) === "public");
  const ownEntries = datasetEntries.filter((e) => getEntryGroup(e) === "own");

  // Render group
  const renderDropdownGroup = (title, entries) => {
    if (!entries || entries.length === 0) return;

    const groupHeader = document.createElement("div");
    groupHeader.className = "editor-dataset-group-header";
    groupHeader.textContent = title;
    editorDatasetList.appendChild(groupHeader);

    entries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "editor-dataset-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const safeId = String(entry.key).replace(/[^a-zA-Z0-9]/g, "-");
      checkbox.id = `editor-ds-${safeId}`;
      checkbox.checked = editorSelectedDatasets.has(entry.key);
      checkbox.dataset.datasetKey = entry.key;

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = entry.label;

      item.appendChild(checkbox);
      item.appendChild(label);

      // Click to toggle
      item.addEventListener("click", async (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
        await handleDatasetSelection(entry.key, checkbox.checked);
      });

      editorDatasetList.appendChild(item);
    });
  };

  renderDropdownGroup("Öffentliche Kartensätze", publicEntries);
  renderDropdownGroup("Eigene Kartensätze", ownEntries);

  // Empty state
  if (datasetEntries.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "editor-dataset-item";
    emptyMsg.style.opacity = "0.6";
    emptyMsg.style.cursor = "default";
    emptyMsg.textContent = "Keine Kartensätze verfügbar";
    editorDatasetList.appendChild(emptyMsg);
  }

  updateSelectedCount();
}

function handleDatasetSelection(datasetKey, isSelected) {
  if (isSelected) {
    editorSelectedDatasets.add(datasetKey);
  } else {
    editorSelectedDatasets.delete(datasetKey);
  }
  updateSelectedCount();
  updateEditorDatasetsView();
  syncEditorCurrentDataset();
}

function stripDatasetLabelSuffix(label) {
  return String(label ?? "").replace(/\s*\((Eigen|Storage)\)\s*$/, "").trim();
}

function syncEditorCurrentDataset() {
  const selectedKeys = Array.from(editorSelectedDatasets);
  if (selectedKeys.length === 1) {
    const entry = getDatasetEntryByKey(selectedKeys[0]);
    if (entry?.isCustom && entry?.id) {
      state.editor.currentDatasetId = entry.id;
      state.editor.datasetName = stripDatasetLabelSuffix(entry.label);
      return;
    }
  }
  state.editor.currentDatasetId = null;
  state.editor.datasetName = "";
}

function updateSelectedCount() {
  const count = editorSelectedDatasets.size;
  if (editorSelectedCount) {
    editorSelectedCount.textContent = `${count} Kartensatz${count !== 1 ? "e" : ""}`;
  }
  if (editorSelectedNames) {
    editorSelectedNames.innerHTML = "";
    for (const key of editorSelectedDatasets) {
      const entry = getDatasetEntryByKey(key);
      if (!entry) continue;
      const tag = document.createElement("span");
      tag.className = "editor-selected-name-tag";
      tag.textContent = entry.label;
      tag.title = entry.label;
      editorSelectedNames.appendChild(tag);
    }
  }
}

function updateEditorDatasetsView() {
  const selectedKeys = Array.from(editorSelectedDatasets);

  // 0 or 1 dataset: use single table
  // 2+ datasets: use multi-sections (each dataset in its own collapsible container)
  if (selectedKeys.length <= 1) {
    if (editorSingleTable) editorSingleTable.classList.remove("hidden");
    if (editorMultiSections) editorMultiSections.classList.add("hidden");
    loadDatasetsToSingleTable(selectedKeys);
  } else {
    if (editorSingleTable) editorSingleTable.classList.add("hidden");
    if (editorMultiSections) editorMultiSections.classList.remove("hidden");
    loadDatasetsToMultiSections(selectedKeys);
  }
}

function loadDatasetsToSingleTable(datasetKeys) {
  // Combine all cards from selected datasets
  const allCards = [];

  for (const key of datasetKeys) {
    const cards = getCardsFromDatasetKey(key);
    allCards.push(...cards);
  }

  // If no datasets selected, clear the table completely
  if (datasetKeys.length === 0) {
    renderCardEditorRows([]);
  } else if (allCards.length === 0) {
    renderCardEditorRows([]);
    addEditorRow();
  } else {
    renderCardEditorRows(allCards);
  }

  updateEditorValidationState();
  updateEditorUnsavedChanges();
}

function loadDatasetsToMultiSections(datasetKeys) {
  if (!editorMultiSections) return;

  // Clear existing sections
  editorMultiSections.innerHTML = "";

  for (let index = 0; index < datasetKeys.length; index++) {
    const key = datasetKeys[index];
    const dataset = getDatasetInfoByKey(key);
    if (!dataset) continue;

    const section = document.createElement("div");
    section.className = "editor-dataset-section";
    section.dataset.datasetKey = key;

    // Header
    const header = document.createElement("div");
    header.className = "editor-dataset-section-header";
    header.innerHTML = `
      <div class="editor-dataset-section-title">
        ${dataset.label}
        <span class="dataset-card-count">(${dataset.cards.length} Karten)</span>
      </div>
      <span class="editor-dataset-section-toggle">▼</span>
    `;

    // Toggle expand/collapse
    header.addEventListener("click", () => {
      section.classList.toggle("expanded");
    });

    // Content (table)
    const content = document.createElement("div");
    content.className = "editor-dataset-section-content";

    const tableWrap = document.createElement("div");
    tableWrap.className = "card-editor-table-wrap";
    tableWrap.innerHTML = `
      <table class="card-editor-table">
        <thead>
          <tr>
            <th>Kategorie</th>
            <th>Begriff/Frage</th>
            <th>Antwort/Tabu1</th>
            <th>Tabu2</th>
            <th>Tabu3</th>
            <th>Tabu4</th>
            <th>Aktion</th>
          </tr>
        </thead>
        <tbody id="card-editor-body-${index}"></tbody>
      </table>
      <div class="card-editor-add-row">
        <button class="ghost add-row-btn" data-section="${index}" type="button">+ Zeile</button>
      </div>
    `;

    content.appendChild(tableWrap);
    section.appendChild(header);
    section.appendChild(content);
    editorMultiSections.appendChild(section);

    // Populate table
    const tbody = tableWrap.querySelector(`#card-editor-body-${index}`);
    dataset.cards.forEach((card) => {
      const row = createEditorRow(card);
      tbody.appendChild(row);
    });

    // Expand all sections by default
    section.classList.add("expanded");
  }

  // Add event listeners for add row buttons in multi-sections
  editorMultiSections.querySelectorAll(".add-row-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const sectionIndex = e.target.dataset.section;
      const tbody = document.getElementById(`card-editor-body-${sectionIndex}`);
      const row = createEditorRow();
      tbody.appendChild(row);
      updateEditorUnsavedChanges();
    });
  });
}

function getCardsFromDatasetKey(key) {
  const entry = getDatasetEntryByKey(key);
  return entry?.cards || [];
}

function getDatasetInfoByKey(key) {
  return getDatasetEntryByKey(key) || null;
}

function getCardsetsSummaryCheckedKeys() {
  const keys = [];
  const checkboxes = [
    ...(storageDatasetSummary ? [...storageDatasetSummary.querySelectorAll('input.storage-dataset-checkbox[data-key]')] : []),
    ...(storageDatasetList ? [...storageDatasetList.querySelectorAll('input.storage-dataset-checkbox[data-key]')] : []),
  ];
  const seen = new Set();
  checkboxes.forEach((cb) => {
    const key = String(cb.dataset.key ?? "").trim();
    if (key && cb.checked && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  });
  return keys;
}

// Initialize with default dataset selected, or pending keys from cardsets page
function initEditorDatasetSelector() {
  editorSelectedDatasets.clear();

  // If keys were passed from the cardsets page checkboxes, use those
  const pendingKeys = state._pendingEditorDatasetKeys;
  if (Array.isArray(pendingKeys) && pendingKeys.length > 0) {
    pendingKeys.forEach((key) => editorSelectedDatasets.add(key));
    state._pendingEditorDatasetKeys = null;
  } else {
    // Otherwise select the default dataset (prefer "Mittel" if available)
    const allDatasets = getAllDatasetEntries();
    const mittelEntry = allDatasets.find((d) => d.label.trim().toLowerCase() === "mittel");
    if (mittelEntry) {
      editorSelectedDatasets.add(mittelEntry.key);
    } else if (DEFAULT_DATASET_KEY && PRESET_DATASETS[DEFAULT_DATASET_KEY]) {
      editorSelectedDatasets.add(DEFAULT_DATASET_KEY);
    }
  }

  updateSelectedCount();
  updateEditorDatasetsView();
  syncEditorCurrentDataset();
}

function handleMoreMenuAction(action) {
  closeMoreMenu();
  switch (action) {
    case "new":
      newEditorDataset();
      break;
    case "save-as":
      saveEditorDatasetAs();
      break;
    case "rename":
      renameEditorDataset();
      break;
    case "duplicate":
      duplicateEditorDataset();
      break;
    case "delete":
      deleteEditorDataset();
      break;
    case "import":
      importCsvToEditor();
      break;
    case "export":
      exportEditorCardsAsCsv();
      break;
  }
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

  const result = await saveCardsAsCustomDataset({
    cards,
    label,
    isPublic: false,
  });
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
    csvStatus.textContent = `Kartensatz global gespeichert: ${result.label} (${result.count} Karten). ${getDatasetVisibilityStatus(result.datasetId)}.`;
  } else {
    csvStatus.textContent = `Eigener Kartensatz lokal gespeichert: ${result.label} (${result.count} Karten). ${getDatasetVisibilityStatus(result.datasetId)}.`;
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
  const result = await saveCardsAsCustomDataset({
    cards,
    label: nextLabel,
    existingId: selectedId,
    isPublic: false,
  });
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
    csvStatus.textContent = `Kartensatz global überschrieben: ${nextLabel} (${result.count} Karten). ${getDatasetVisibilityStatus(result.datasetId)}.`;
  } else {
    csvStatus.textContent = `Kartensatz lokal überschrieben: ${nextLabel} (${result.count} Karten). ${getDatasetVisibilityStatus(result.datasetId)}.`;
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

function buildCsvContentFromCards(cards) {
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

  return `\uFEFF${lines.join("\n")}`;
}

function exportEditorCardsAsCsv() {
  // Collect all cards currently visible in the editor (single or multi-section)
  const allCards = [];
  for (const key of editorSelectedDatasets) {
    const cards = getCardsFromDatasetKey(key);
    allCards.push(...cards);
  }

  if (allCards.length === 0) {
    updateEditorStatus("Keine Karten zum Exportieren", "has-error");
    return;
  }

  const csvContent = buildCsvContentFromCards(allCards);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const filenameBase = state.editor.datasetName || "Thinkaroo-Kartensatz";
  link.download = `${filenameBase.replace(/\s+/g, "-").toLowerCase()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  updateEditorStatus(`CSV exportiert: ${allCards.length} Karten`);
}

async function importCsvToEditor() {
  if (!requireFullAccess()) return;

  // Create hidden file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv";
  fileInput.style.display = "none";
  document.body.append(fileInput);

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) {
      fileInput.remove();
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseStorageCsvToCards(text);

      if (parsed.length === 0) {
        updateEditorStatus("CSV enthält keine gültigen Karten", "has-error");
        fileInput.remove();
        return;
      }

      // Ask for name via game-layout modal
      const defaultName = deriveDatasetLabelFromFilename(file.name);
      const name = await showDatasetNamePrompt("Name für importierten Kartensatz:", defaultName);
      if (!name) {
        fileInput.remove();
        return;
      }

      // Save as new custom dataset
      updateEditorStatus("Speichert…", "is-saving");
      const result = await saveCardsAsCustomDataset({
        cards: parsed,
        label: name,
        isPublic: false,
      });

      if (!result.ok) {
        updateEditorStatus("Speichern fehlgeschlagen", "has-error");
        fileInput.remove();
        return;
      }

      // Refresh so the new dataset appears
      await refreshPublicCsvList();

      // Add the new dataset to the editor selection
      const newKey = toCustomDatasetKey(result.datasetId);
      editorSelectedDatasets.add(newKey);

      // Repopulate dropdown so the new dataset checkbox is checked
      populateDatasetDropdown();

      // Update view
      updateSelectedCount();
      updateEditorDatasetsView();
      syncEditorCurrentDataset();

      // Collapse all sections except the newly imported one
      if (editorMultiSections) {
        editorMultiSections.querySelectorAll(".editor-dataset-section").forEach((section) => {
          if (section.dataset.datasetKey === newKey) {
            section.classList.add("expanded");
          } else {
            section.classList.remove("expanded");
          }
        });
      }

      updateEditorStatus(`Importiert: ${parsed.length} Karten als „${name}"`);

    } catch (error) {
      updateEditorStatus("Fehler beim Importieren der CSV", "has-error");
    } finally {
      fileInput.remove();
    }
  });

  fileInput.click();
}

async function uploadEditorCardsAsCsv() {
  if (!requireFullAccess()) return;
  const { cards, errors } = updateEditorValidationState();
  if (errors.length > 0) {
    csvStatus.textContent = "Speichern nicht möglich: Editor enthält ungültige Zeilen.";
    return;
  }

  const filenameBase = cardEditorDatasetLabelInput?.value?.trim() || "wissivity-kartensatz";
  const uploadName = sanitizeUploadFileName(`${filenameBase.replace(/\s+/g, "-").toLowerCase()}.csv`);
  const csvContent = buildCsvContentFromCards(cards);
  const csvFile = new File([csvContent], uploadName, { type: "text/csv;charset=utf-8" });

  try {
    await uploadCsvFileToStorage(csvFile, uploadName);
    await refreshPublicCsvList();
    if (storageDatasetSelect) {
      storageDatasetSelect.value = uploadName;
    }
    csvStatus.textContent = `CSV in Supabase gespeichert: ${getDisplayDatasetName(uploadName)} (${cards.length} Karten).`;
  } catch (error) {
    csvStatus.textContent = `CSV-Speichern fehlgeschlagen: ${error?.message || String(error)}`;
  }
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
    return [resolveDefaultDatasetKey()];
  }

  const keys = [...datasetSelectList.querySelectorAll("select")]
    .map((select) => select.value)
    .filter((key) => getDatasetEntryByKey(key));

  return keys;
}

function getAvailableCategoriesFromCards(cards = []) {
  const available = new Set();
  (Array.isArray(cards) ? cards : []).forEach((card) => {
    const category = card?.category;
    if (ALLOWED_CARD_CATEGORIES.includes(category)) {
      available.add(category);
    }
  });
  return available;
}

function getAvailableCategoriesForDatasetKeys(datasetKeys = []) {
  const available = new Set();
  (Array.isArray(datasetKeys) ? datasetKeys : []).forEach((key) => {
    const entry = getDatasetEntryByKey(key);
    if (!entry?.cards) return;
    getAvailableCategoriesFromCards(entry.cards).forEach((category) => available.add(category));
  });
  return available;
}

function filterCategoriesToAvailability(selectedCategories, availableCategories) {
  return (Array.isArray(selectedCategories) ? selectedCategories : []).filter(
    (category) => SELECTABLE_CARD_CATEGORIES.includes(category) && availableCategories.has(category)
  );
}

function getDefaultAvailableCategories(availableCategories) {
  return SELECTABLE_CARD_CATEGORIES.filter((category) => availableCategories.has(category));
}

function clampCategoryWeight(weight) {
  const parsed = Number.parseInt(weight, 10);
  if (!Number.isFinite(parsed)) return CATEGORY_WEIGHT_DEFAULT;
  return Math.min(CATEGORY_WEIGHT_MAX, Math.max(CATEGORY_WEIGHT_MIN, parsed));
}

function syncCategoryWeightsForAvailableCategories(availableCategories) {
  const nextWeights = { ...state.categoryWeights };
  SELECTABLE_CARD_CATEGORIES.forEach((category) => {
    if (!availableCategories.has(category)) {
      delete nextWeights[category];
      return;
    }
    nextWeights[category] = clampCategoryWeight(nextWeights[category] ?? CATEGORY_WEIGHT_DEFAULT);
  });
  state.categoryWeights = nextWeights;
}

function getWeightedBoardCategories(availableCategories) {
  const selectedCategories = new Set(state.selectedBoardCategories);
  const categories = SELECTABLE_CARD_CATEGORIES.filter(
    (category) => availableCategories.has(category) && selectedCategories.has(category)
  );
  return categories.filter((category) => (state.categoryWeights[category] ?? 0) > 0);
}

function setCategoryDistributionExpanded(isExpanded) {
  if (!toggleCategoryDistributionButton || !categoryDistributionPanel) return;
  toggleCategoryDistributionButton.setAttribute("aria-expanded", String(isExpanded));
  categoryDistributionPanel.hidden = !isExpanded;
  if (isExpanded) {
    renderBoardCategoryOptions();
  }
}

function setCategoryDistributionExpandedGame(isExpanded) {
  if (!toggleCategoryDistributionButtonGame || !categoryDistributionPanelGame) return;
  toggleCategoryDistributionButtonGame.setAttribute("aria-expanded", String(isExpanded));
  categoryDistributionPanelGame.hidden = !isExpanded;
  if (isExpanded) {
    renderBoardCategoryOptionsGame();
  }
}

function toggleCategoryDistribution() {
  const isExpanded = toggleCategoryDistributionButton?.getAttribute("aria-expanded") === "true";
  setCategoryDistributionExpanded(!isExpanded);
}

function toggleCategoryDistributionGame() {
  const isExpanded = toggleCategoryDistributionButtonGame?.getAttribute("aria-expanded") === "true";
  setCategoryDistributionExpandedGame(!isExpanded);
}

function getCategoryDistributionPercentages(categories) {
  const weights = categories.map((category) => clampCategoryWeight(state.categoryWeights[category] ?? CATEGORY_WEIGHT_DEFAULT));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) {
    return Object.fromEntries(categories.map((category) => [category, 0]));
  }
  return Object.fromEntries(
    categories.map((category, index) => [category, Math.round((weights[index] / totalWeight) * 100)])
  );
}

function resetBoardCategoryDistribution() {
  const selectedDatasetKeys = readSelectedDatasetKeys();
  const availableCategories = getAvailableCategoriesForDatasetKeys(selectedDatasetKeys);
  const resetWeights = { ...state.categoryWeights };
  getDefaultAvailableCategories(availableCategories).forEach((category) => {
    resetWeights[category] = CATEGORY_WEIGHT_DEFAULT;
  });
  state.categoryWeights = resetWeights;
  state.categories = getWeightedBoardCategories(availableCategories);
  renderBoardCategorySelector();
  renderBoardCategoryOptions();
  updateMainMenuRequiredSelectionState();
}

function resetBoardCategoryDistributionGame() {
  const availableCategories = getAvailableCategoriesFromCards(state.cards);
  const resetWeights = { ...state.categoryWeights };
  getDefaultAvailableCategories(availableCategories).forEach((category) => {
    resetWeights[category] = CATEGORY_WEIGHT_DEFAULT;
  });
  state.categoryWeights = resetWeights;
  state.categories = getWeightedBoardCategories(availableCategories);
  renderBoardCategoryOptionsGame();
}

function createWeightedBoardAssignments(categories, slotCount, weightsByCategory) {
  if (!Array.isArray(categories) || categories.length === 0 || slotCount <= 0) {
    return [];
  }
  const weights = categories.map((category) => clampCategoryWeight(weightsByCategory?.[category] ?? CATEGORY_WEIGHT_DEFAULT));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) {
    return [];
  }

  const exactCounts = weights.map((weight) => (weight / totalWeight) * slotCount);
  const baseCounts = exactCounts.map((count) => Math.floor(count));
  let remainingSlots = slotCount - baseCounts.reduce((sum, count) => sum + count, 0);
  const remainders = exactCounts
    .map((count, index) => ({ index, remainder: count - baseCounts[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < remainingSlots; i += 1) {
    baseCounts[remainders[i % remainders.length].index] += 1;
  }

  const assignmentPool = [];
  baseCounts.forEach((count, index) => {
    for (let i = 0; i < count; i += 1) {
      assignmentPool.push(categories[index]);
    }
  });
  for (let i = assignmentPool.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [assignmentPool[i], assignmentPool[randomIndex]] = [assignmentPool[randomIndex], assignmentPool[i]];
  }
  return assignmentPool;
}

function applySelectedDatasets() {
  const selectedKeys = readSelectedDatasetKeys();
  state.selectedDatasets = [...selectedKeys];

  const mergedCards = selectedKeys.flatMap((key) => {
    const datasetEntry = getDatasetEntryByKey(key);
    return datasetEntry ? withQuestionIds(datasetEntry.cards, key) : [];
  });

  state.cards = mergedCards;
  const availableCategories = getAvailableCategoriesFromCards(mergedCards);
  syncCategoryWeightsForAvailableCategories(availableCategories);
  
  // Sync selected board categories to only include available categories
  state.selectedBoardCategories = state.selectedBoardCategories.filter((category) =>
    availableCategories.has(category)
  );
  // If no categories are selected, select all available ones
  if (state.selectedBoardCategories.length === 0) {
    state.selectedBoardCategories = getDefaultAvailableCategories(availableCategories);
  }
  
  const weightedCategories = getWeightedBoardCategories(availableCategories);
  state.categories =
    weightedCategories.length > 0
      ? weightedCategories
      : getDefaultAvailableCategories(availableCategories);

  if ((window.location.hash === "#/cardsets" || window.location.hash === "#/editor") && cardEditorBody) {
    renderCardEditorRows(cloneCards(state.cards));
    updateEditorValidationState();
  }

  if (selectedKeys.length > 0) {
    const labels = selectedKeys
      .map((key) => getDatasetEntryByKey(key)?.label)
      .filter(Boolean)
      .join(" + ");
    if (csvStatus) {
      csvStatus.textContent = `${labels}: ${state.cards.length} Karten.`;
    }
  } else if (csvStatus?.textContent === "Bitte mindestens einen Kartensatz wählen.") {
    csvStatus.textContent = "";
  }

  if (csvUpload) {
    csvUpload.value = "";
  }
  if (storageDatasetSelect && selectedKeys.length > 0) {
    storageDatasetSelect.value = "";
  }

  renderBoardCategorySelector();
  renderBoardCategoryOptions();
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
  const availableKeys = new Set(availableDatasets.map((d) => d.key));
  const defaultLabel = (PRESET_DATASETS[DEFAULT_DATASET_KEY]?.label ?? DEFAULT_DATASET_KEY).trim().toLowerCase();

  // Find a key that actually exists in the available options
  function resolveKey(key) {
    if (!key) return "";
    if (availableKeys.has(key)) return key;
    // Try to find by label
    const label = (getDatasetEntryByKey(key)?.label ?? "").trim().toLowerCase();
    if (label) {
      const match = availableDatasets.find((d) => d.label.trim().toLowerCase() === label);
      if (match) return match.key;
    }
    return "";
  }

  // Prefer "Mittel" as default, then fall back to current selections
  const mittelEntry = availableDatasets.find((d) => d.label.trim().toLowerCase() === "mittel");
  const mittelKey = mittelEntry?.key;
  
  const candidates = [
    mittelKey,
    ...state.selectedDatasets,
    datasetSelect.value,
    DEFAULT_DATASET_KEY,
  ].filter(Boolean);
  
  let nextKey = "";
  for (const candidate of candidates) {
    nextKey = resolveKey(candidate);
    if (nextKey) break;
  }
  // Final fallback: find "Standard" by label, then first available
  if (!nextKey) {
    nextKey = availableDatasets.find((d) => d.label.trim().toLowerCase() === defaultLabel)?.key ?? availableDatasets[0]?.key ?? "";
  }

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
    addDatasetSelect(DEFAULT_DATASET_KEY);
    return;
  }

  state.selectedDatasets.forEach((key) => {
    addDatasetSelect(key);
  });

  updateDatasetRowControls();
}

function parsePixelValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fitBoardCategorySelectorCards() {
  if (!boardCategorySelectorContainer) return;

  const categoryCards = [...boardCategorySelectorContainer.querySelectorAll(".board-category-button")];
  categoryCards.forEach((card) => {
    const icon = card.querySelector(".category-icon");
    const label = card.querySelector(".board-category-button__label");
    if (!icon || !label) return;

    const cardWidth = card.clientWidth;
    const cardHeight = card.clientHeight;
    if (cardWidth <= 0 || cardHeight <= 0) return;

    const cardStyle = window.getComputedStyle(card);
    const paddingLeft = parsePixelValue(cardStyle.paddingLeft);
    const paddingRight = parsePixelValue(cardStyle.paddingRight);
    const paddingTop = parsePixelValue(cardStyle.paddingTop);
    const paddingBottom = parsePixelValue(cardStyle.paddingBottom);
    const gapSize = Math.max(3, Math.min(8, cardHeight * 0.045));
    const checkmarkSize = Math.max(16, Math.min(24, cardWidth * 0.17));
    const maxFontSize = Math.max(
      BOARD_CATEGORY_LABEL_MIN_FONT_SIZE,
      Math.min(BOARD_CATEGORY_LABEL_MAX_FONT_SIZE, cardWidth * 0.19, cardHeight * 0.22)
    );

    card.style.setProperty("--board-category-gap", `${gapSize.toFixed(2)}px`);
    card.style.setProperty("--board-category-checkmark-size", `${checkmarkSize.toFixed(2)}px`);

    let low = BOARD_CATEGORY_LABEL_MIN_FONT_SIZE;
    let high = maxFontSize;
    let best = low;
    label.style.fontSize = `${high}px`;

    for (let step = 0; step < 12; step += 1) {
      const candidate = (low + high) / 2;
      label.style.fontSize = `${candidate}px`;
      const fitsWidth = label.scrollWidth <= label.clientWidth + 1;
      const fitsHeight = label.scrollHeight <= label.clientHeight + 1;
      if (fitsWidth && fitsHeight) {
        best = candidate;
        low = candidate;
      } else {
        high = candidate;
      }
    }

    label.style.fontSize = `${best}px`;
    if (label.scrollWidth > label.clientWidth + 1) {
      best = Math.max(1, best * (label.clientWidth / label.scrollWidth));
    }

    card.style.setProperty("--board-category-label-font-size", `${best.toFixed(2)}px`);
    label.style.removeProperty("font-size");

    const labelHeight = label.getBoundingClientRect().height;
    const availableIconWidth = cardWidth - paddingLeft - paddingRight;
    const availableIconHeight = cardHeight - paddingTop - paddingBottom - labelHeight - gapSize;
    const iconSize = Math.max(0, Math.min(availableIconWidth, availableIconHeight));
    card.style.setProperty("--board-category-icon-size", `${iconSize.toFixed(2)}px`);
  });
}

function scheduleBoardCategorySelectorFit() {
  if (!boardCategorySelectorContainer || boardCategoryFitFrame !== null) return;
  boardCategoryFitFrame = window.requestAnimationFrame(() => {
    boardCategoryFitFrame = null;
    const hasLayout = boardCategorySelectorContainer.clientWidth > 0;
    const hasButtons = boardCategorySelectorContainer.querySelector(".board-category-button");
    if (!hasLayout || !hasButtons) {
      scheduleBoardCategorySelectorFit();
      return;
    }
    fitBoardCategorySelectorCards();
  });
}

function renderBoardCategorySelector() {
  if (!boardCategorySelectorContainer) return;

  boardCategorySelectorContainer.innerHTML = "";
  const selectedDatasetKeys = readSelectedDatasetKeys();
  const availableCategories = getAvailableCategoriesForDatasetKeys(selectedDatasetKeys);

  SELECTABLE_CARD_CATEGORIES.forEach((category) => {
    const isAvailable = availableCategories.has(category);
    const isSelected = state.selectedBoardCategories.includes(category);
    const visuals = CATEGORY_VISUALS[category];

    const categoryButton = document.createElement("button");
    categoryButton.type = "button";
    categoryButton.className = "board-category-button";
    categoryButton.dataset.categoryLabel = category;
    categoryButton.setAttribute("aria-label", category);
    categoryButton.setAttribute("aria-pressed", String(isSelected && isAvailable));
    categoryButton.setAttribute("aria-disabled", String(!isAvailable));
    categoryButton.classList.toggle("is-selected", isSelected);
    categoryButton.classList.toggle("is-unavailable", !isAvailable);
    categoryButton.classList.toggle("is-clicked", state.clickedBoardCategory === category);
    categoryButton.style.setProperty("--category-color", visuals?.color ?? "#F3E9D3");

    const icon = document.createElement("span");
    icon.className = "category-icon";
    applyCategoryIcon(icon, category, { allowFallback: true });
    categoryButton.append(icon);

    const label = document.createElement("span");
    label.className = "board-category-button__label";
    label.textContent = category;
    categoryButton.append(label);

    const checkmark = document.createElement("span");
    checkmark.className = "board-category-button__checkmark";
    checkmark.setAttribute("aria-hidden", "true");
    categoryButton.append(checkmark);

    if (isAvailable) {
      categoryButton.addEventListener("click", () => {
        state.clickedBoardCategory = category;
        const isCurrentlySelected = state.selectedBoardCategories.includes(category);
        if (isCurrentlySelected) {
          state.selectedBoardCategories = state.selectedBoardCategories.filter((c) => c !== category);
        } else {
          state.selectedBoardCategories = [...state.selectedBoardCategories, category];
        }
        renderBoardCategorySelector();
        renderBoardCategoryOptions();
        updateMainMenuRequiredSelectionState();
      });
    }

    boardCategorySelectorContainer.append(categoryButton);
  });

  state.clickedBoardCategory = null;
  scheduleBoardCategorySelectorFit();
}

function renderBoardCategoryOptions() {
  if (!boardCategoriesContainer) return;

  boardCategoriesContainer.innerHTML = "";
  const selectedDatasetKeys = readSelectedDatasetKeys();
  const availableCategories = getAvailableCategoriesForDatasetKeys(selectedDatasetKeys);
  syncCategoryWeightsForAvailableCategories(availableCategories);

  // Only show sliders for selected categories
  const selectedCategories = state.selectedBoardCategories.filter((category) => availableCategories.has(category));
  const percentages = getCategoryDistributionPercentages(selectedCategories);

  if (resetCategoryDistributionButton) {
    resetCategoryDistributionButton.disabled = selectedCategories.length === 0;
  }

  selectedCategories.forEach((category) => {
    const row = document.createElement("div");
    row.className = "category-distribution-row";
    const visuals = CATEGORY_VISUALS[category];
    row.style.setProperty("--category-color", visuals?.color ?? "#F3E9D3");

    const label = document.createElement("label");
    label.className = "category-distribution-label";
    label.setAttribute("for", `category-weight-${CATEGORY_CONFIG[category]?.id ?? category}`);
    label.textContent = category;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "category-distribution-slider";
    slider.id = `category-weight-${CATEGORY_CONFIG[category]?.id ?? category}`;
    slider.min = String(CATEGORY_WEIGHT_MIN);
    slider.max = String(CATEGORY_WEIGHT_MAX);
    slider.step = "1";
    slider.value = String(clampCategoryWeight(state.categoryWeights[category] ?? CATEGORY_WEIGHT_DEFAULT));
    slider.setAttribute("aria-label", `Häufigkeit für ${category}`);

    const value = document.createElement("span");
    value.className = "category-distribution-value";
    value.textContent = `${percentages[category] ?? 0}%`;

    slider.addEventListener("input", () => {
      state.categoryWeights[category] = clampCategoryWeight(slider.value);
      const selectedForBoard = getWeightedBoardCategories(availableCategories);
      state.categories = selectedForBoard.length > 0 ? selectedForBoard : getDefaultAvailableCategories(availableCategories);
      renderBoardCategorySelector();
      renderBoardCategoryOptions();
      updateMainMenuRequiredSelectionState();
    });

    row.append(label, slider, value);
    boardCategoriesContainer.append(row);
  });

}

function renderBoardCategoryOptionsGame() {
  if (!boardCategoriesContainerGame) return;

  boardCategoriesContainerGame.innerHTML = "";
  const availableCategories = getAvailableCategoriesFromCards(state.cards);
  syncCategoryWeightsForAvailableCategories(availableCategories);

  const selectedCategories = filterCategoriesToAvailability(
    getSelectedCategories(gameCategoryControls),
    availableCategories
  );
  const percentages = getCategoryDistributionPercentages(selectedCategories);

  if (resetCategoryDistributionButtonGame) {
    resetCategoryDistributionButtonGame.disabled = selectedCategories.length === 0;
  }

  selectedCategories.forEach((category) => {
    const row = document.createElement("div");
    row.className = "category-distribution-row";
    const visuals = CATEGORY_VISUALS[category];
    row.style.setProperty("--category-color", visuals?.color ?? "#F3E9D3");

    const label = document.createElement("label");
    label.className = "category-distribution-label";
    label.setAttribute("for", `category-weight-game-${CATEGORY_CONFIG[category]?.id ?? category}`);
    label.textContent = category;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "category-distribution-slider";
    slider.id = `category-weight-game-${CATEGORY_CONFIG[category]?.id ?? category}`;
    slider.min = String(CATEGORY_WEIGHT_MIN);
    slider.max = String(CATEGORY_WEIGHT_MAX);
    slider.step = "1";
    slider.value = String(clampCategoryWeight(state.categoryWeights[category] ?? CATEGORY_WEIGHT_DEFAULT));
    slider.setAttribute("aria-label", `Häufigkeit für ${category}`);

    const value = document.createElement("span");
    value.className = "category-distribution-value";
    value.textContent = `${percentages[category] ?? 0}%`;

    slider.addEventListener("input", () => {
      state.categoryWeights[category] = clampCategoryWeight(slider.value);
      renderBoardCategoryOptionsGame();
    });

    row.append(label, slider, value);
    boardCategoriesContainerGame.append(row);
  });
}

const CSV_MAX_SIZE_BYTES = 1024 * 1024;
const USER_CSV_BUCKET = "cardsets";

function getUserCsvFolderPath(userId) {
  return `${userId}`;
}

function setCsvStatus(message, { isError = false } = {}) {
  if (!csvStatus) return;
  csvStatus.textContent = message;
  csvStatus.classList.toggle("is-error", isError);
}

function syncCsvUploadButtonVisibility() {
  if (!csvUploadButton) return;
  const hasFile = Boolean(csvUpload?.files?.length);
  csvUploadButton.hidden = !hasFile;
  if (csvUploadPublicButton) {
    csvUploadPublicButton.hidden = !hasFile || !isAdminSession;
  }
}

async function getAuthenticatedSupabaseUser() {
  if (!window.supabase?.auth?.getUser) {
    throw createAuthApiError("CSV-Zugriff fehlgeschlagen: Keine aktive Supabase-Session.", { shouldRedirect: true });
  }

  const {
    data: { user },
  } = await window.supabase.auth.getUser();

  const userId = user?.id;
  if (!userId) {
    throw createAuthApiError("CSV-Zugriff fehlgeschlagen: Keine aktive Anmeldung gefunden.", { shouldRedirect: true });
  }

  return { user, userId };
}

async function listStoredCsvFiles() {
  const { userId } = await getAuthenticatedSupabaseUser();
  const folderPath = getUserCsvFolderPath(userId);
  const { data, error } = await window.supabase.storage
    .from(USER_CSV_BUCKET)
    .list(folderPath, { limit: 100, sortBy: { column: "updated_at", order: "desc" } });

  if (error) {
    throw new Error(`Dateiliste konnte nicht geladen werden (${error.message}).`);
  }

  return (Array.isArray(data) ? data : [])
    .filter((entry) => String(entry?.name || "").toLowerCase().endsWith(".csv"))
    .map((entry) => ({
      name: String(entry?.name || ""),
      size: Number(entry?.metadata?.size ?? 0),
      updatedAt: entry?.updated_at || entry?.created_at || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

async function downloadStoredCsvFile(objectName) {
  const { userId } = await getAuthenticatedSupabaseUser();
  const filePath = `${getUserCsvFolderPath(userId)}/${objectName}`;
  const { data, error } = await window.supabase.storage.from(USER_CSV_BUCKET).download(filePath);
  if (error) {
    throw new Error(`CSV-Abruf fehlgeschlagen (${error.message}).`);
  }
  return data.text();
}

async function uploadCsvFileToStorage(file, uploadName) {
  const { userId } = await getAuthenticatedSupabaseUser();
  const filePath = `${getUserCsvFolderPath(userId)}/${uploadName}`;
  const { data, error } = await window.supabase.storage.from(USER_CSV_BUCKET).upload(filePath, file, {
    upsert: true,
    contentType: "text/csv; charset=utf-8",
  });

  if (error) {
    throw new Error(`Upload fehlgeschlagen (${error.message}).`);
  }

  return data;
}

async function deleteStoredCsvFile(objectName) {
  const { userId } = await getAuthenticatedSupabaseUser();
  const filePath = `${getUserCsvFolderPath(userId)}/${objectName}`;
  const { error } = await window.supabase.storage.from(USER_CSV_BUCKET).remove([filePath]);
  if (error) {
    throw new Error(`Löschen fehlgeschlagen (${error.message}).`);
  }
}

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

  placeholderOption.textContent = "Kartensatz auswählen";
  placeholderOption.selected = true;
  storageDatasetSelect.append(placeholderOption);

  files.forEach((file) => {
    const option = document.createElement("option");
    option.value = file.name;
    option.textContent = getDisplayDatasetName(file.name);
    storageDatasetSelect.append(option);
  });
}

function renderStorageDatasetList(files = []) {
  if (!storageDatasetList && !storageDatasetSummary) return;

  const datasetEntries = getAllDatasetEntries();

  const allCategories = [...SELECTABLE_CARD_CATEGORIES];

  const renderSummaryTable = ({ publicEntries = [], ownEntries = [] } = {}) => {
    if (!storageDatasetSummary) return;
    storageDatasetSummary.innerHTML = "";

    const table = document.createElement("table");
    table.className = "storage-dataset-summary-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    const nameHead = document.createElement("th");
    nameHead.textContent = "Kartensatz";
    nameHead.colSpan = 5;
    headRow.append(nameHead);

    allCategories.forEach((category) => {
      const th = document.createElement("th");
      th.className = "storage-dataset-summary-cat storage-dataset-summary-cat-head";
      th.dataset.category = category;
      th.title = category;
      const visuals = CATEGORY_VISUALS[category];
      const bg = visuals?.color ?? "#F3E9D3";
      const fg = getReadableTextColor(bg);
      th.style.background = bg;
      th.style.color = fg;

      const icon = document.createElement("span");
      icon.className = "category-icon";
      icon.setAttribute("aria-label", category);
      icon.style.setProperty("--icon-color", fg);
      applyCategoryIcon(icon, category, { allowFallback: true });
      th.append(icon);
      headRow.append(th);
    });

    const totalHead = document.createElement("th");
    totalHead.className = "storage-dataset-summary-total";
    totalHead.textContent = "Σ";
    headRow.append(totalHead);

    thead.append(headRow);
    table.append(thead);

    const tbody = document.createElement("tbody");

    const appendGroup = (title, entries) => {
      if (!Array.isArray(entries) || entries.length === 0) return;
      const groupRow = document.createElement("tr");
      const groupCell = document.createElement("td");
      groupCell.className = "storage-dataset-summary-group";
      groupCell.colSpan = 6 + allCategories.length;
      groupCell.textContent = title;
      groupRow.append(groupCell);
      tbody.append(groupRow);

      entries.forEach((entry) => {
        const row = document.createElement("tr");
        row.classList.add("storage-dataset-summary-row");

        const selectCell = document.createElement("td");
        selectCell.className = "storage-dataset-summary-select";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "storage-dataset-checkbox";
        checkbox.dataset.key = entry.key;
        selectCell.append(checkbox);
        row.append(selectCell);

        const nameCell = document.createElement("td");
        nameCell.className = "storage-dataset-summary-name";
        nameCell.textContent = String(entry?.label ?? entry?.key ?? "");
        row.append(nameCell);

        // Permission: own private custom or storage datasets can be renamed/deleted by owner.
        // Public custom datasets and presets can only be edited by admins.
        const isOwnPrivate = entry.isCustom && !entry.isPublic;
        const canEdit = isOwnPrivate || entry.isStorage || isAdminSession;

        const renameCell = document.createElement("td");
        renameCell.className = "storage-dataset-summary-action";
        if (canEdit) {
          const renameBtn = document.createElement("button");
          renameBtn.type = "button";
          renameBtn.className = "dataset-action-btn dataset-rename-btn";
          renameBtn.title = "Umbenennen";
          renameBtn.setAttribute("aria-label", "Kartensatz umbenennen");
          renameBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
          renameBtn.dataset.datasetKey = entry.key;
          renameBtn.dataset.datasetLabel = stripDatasetLabelSuffix(entry?.label ?? entry?.key ?? "");
          renameBtn.dataset.isCustom = String(!!entry.isCustom);
          renameBtn.dataset.isStorage = String(!!entry.isStorage);
          if (entry.isCustom && entry.id) renameBtn.dataset.datasetId = entry.id;
          if (entry.isStorage && entry.objectName) renameBtn.dataset.objectName = entry.objectName;
          renameCell.append(renameBtn);
        }
        row.append(renameCell);

        const copyCell = document.createElement("td");
        copyCell.className = "storage-dataset-summary-action";
        if (isLoggedIn) {
          const copyBtn = document.createElement("button");
          copyBtn.type = "button";
          copyBtn.className = "dataset-action-btn dataset-copy-btn";
          copyBtn.title = "Kopieren";
          copyBtn.setAttribute("aria-label", "Kartensatz kopieren");
          copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
          copyBtn.dataset.datasetKey = entry.key;
          copyBtn.dataset.datasetLabel = stripDatasetLabelSuffix(entry?.label ?? entry?.key ?? "");
          copyBtn.dataset.isCustom = String(!!entry.isCustom);
          copyBtn.dataset.isStorage = String(!!entry.isStorage);
          if (entry.isCustom && entry.id) copyBtn.dataset.datasetId = entry.id;
          if (entry.isStorage && entry.objectName) copyBtn.dataset.objectName = entry.objectName;
          copyCell.append(copyBtn);
        }
        row.append(copyCell);

        const deleteCell = document.createElement("td");
        deleteCell.className = "storage-dataset-summary-action";
        if (canEdit) {
          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "dataset-action-btn dataset-delete-btn";
          deleteBtn.title = "Kartensatz löschen";
          deleteBtn.setAttribute("aria-label", "Kartensatz löschen");
          deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
          deleteBtn.dataset.datasetKey = entry.key;
          deleteBtn.dataset.datasetLabel = stripDatasetLabelSuffix(entry?.label ?? entry?.key ?? "");
          deleteBtn.dataset.isCustom = String(!!entry.isCustom);
          deleteBtn.dataset.isStorage = String(!!entry.isStorage);
          if (entry.isCustom && entry.id) deleteBtn.dataset.datasetId = entry.id;
          if (entry.isStorage && entry.objectName) deleteBtn.dataset.objectName = entry.objectName;
          deleteCell.append(deleteBtn);
        }
        row.append(deleteCell);

        const cards = Array.isArray(entry?.cards) ? entry.cards : [];
        const counts = Object.fromEntries(allCategories.map((cat) => [cat, 0]));
        cards.forEach((card) => {
          const cat = String(card?.category ?? "").trim();
          if (cat && Object.hasOwn(counts, cat)) {
            counts[cat] += 1;
          }
        });

        const displayedTotal = allCategories.reduce((sum, category) => sum + Number(counts[category] ?? 0), 0);

        allCategories.forEach((category) => {
          const cell = document.createElement("td");
          cell.className = "storage-dataset-summary-cat";
          const value = Number(counts[category] ?? 0);
          const visuals = CATEGORY_VISUALS[category];
          const bg = visuals?.color ?? "#F3E9D3";
          const fg = getReadableTextColor(bg);
          cell.style.setProperty("--category-color", bg);
          cell.style.setProperty("--category-text-color", fg);
          cell.dataset.category = category;
          cell.title = category;
          cell.classList.toggle("is-empty", value === 0);
          cell.textContent = String(value);
          row.append(cell);
        });

        const totalCell = document.createElement("td");
        totalCell.className = "storage-dataset-summary-total";
        totalCell.textContent = String(displayedTotal);
        row.append(totalCell);

        tbody.append(row);
      });
    };

    appendGroup("Öffentliche Kartensätze", publicEntries);
    appendGroup("Eigene Kartensätze", ownEntries);

    table.append(tbody);

    const tfoot = document.createElement("tfoot");
    const summaryRow = document.createElement("tr");
    summaryRow.dataset.selectedDatasetsSummary = "true";

    const selectCell = document.createElement("td");
    selectCell.className = "storage-dataset-summary-select";
    selectCell.textContent = "";
    summaryRow.append(selectCell);

    const labelCell = document.createElement("td");
    labelCell.className = "storage-dataset-summary-name storage-dataset-summary-selected-label";
    labelCell.textContent = "Ausgewählt";
    summaryRow.append(labelCell);

    const emptyRenameCell = document.createElement("td");
    emptyRenameCell.className = "storage-dataset-summary-action";
    summaryRow.append(emptyRenameCell);

    const emptyCopyCell = document.createElement("td");
    emptyCopyCell.className = "storage-dataset-summary-action";
    summaryRow.append(emptyCopyCell);

    const emptyDeleteCell = document.createElement("td");
    emptyDeleteCell.className = "storage-dataset-summary-action";
    summaryRow.append(emptyDeleteCell);

    allCategories.forEach((category) => {
      const cell = document.createElement("td");
      cell.className = "storage-dataset-summary-cat storage-dataset-summary-selected";
      cell.dataset.selectedSummaryCategory = category;
      cell.textContent = "0";
      summaryRow.append(cell);
    });

    const totalCell = document.createElement("td");
    totalCell.className = "storage-dataset-summary-total storage-dataset-summary-selected";
    totalCell.dataset.selectedSummaryTotal = "true";
    totalCell.textContent = "0";
    summaryRow.append(totalCell);

    tfoot.append(summaryRow);
    table.append(tfoot);

    storageDatasetSummary.append(table);
    updateSelectedDatasetsSummaryRow();
  };

  if (storageDatasetList) {
    storageDatasetList.innerHTML = "";
    if (datasetEntries.length === 0) {
      const emptyHint = document.createElement("p");
      emptyHint.className = "hint";
      emptyHint.textContent = "Noch keine Kartensets verfügbar.";
      storageDatasetList.append(emptyHint);
    }
  }

  const getEntryGroup = (entry) => {
    if (entry?.isStorage) return "own";
    if (entry?.isCustom) {
      const customId = entry?.id ?? fromCustomDatasetKey(entry?.key);
      const dataset = customId ? state.customDatasets[customId] : null;
      return dataset?.isPublic ? "public" : "own";
    }
    return "public";
  };

  const publicEntries = datasetEntries.filter((entry) => getEntryGroup(entry) === "public");
  const ownEntries = datasetEntries.filter((entry) => getEntryGroup(entry) === "own");

  renderSummaryTable({ publicEntries, ownEntries });

  const renderGroup = (title, entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return;

    const box = document.createElement("section");
    box.className = "cardsets-dataset-group";

    const heading = document.createElement("div");
    heading.className = "cardsets-dataset-group-title";
    heading.textContent = title;
    box.append(heading);

    entries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "storage-dataset-item";

      const left = document.createElement("div");
      left.className = "storage-dataset-item-main";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "storage-dataset-delete";
      deleteButton.textContent = "✕";
      deleteButton.title = "Kartensatz löschen";
      deleteButton.setAttribute("aria-label", "Kartensatz löschen");
      deleteButton.dataset.storageAction = "delete";
      deleteButton.dataset.objectName = entry?.objectName ?? "";
      deleteButton.hidden = Boolean(!canDeleteStorageDataset(entry));

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "storage-dataset-checkbox";
      checkbox.dataset.key = entry.key;
      checkbox.addEventListener("change", handleStorageDatasetCheckboxChange);

      const name = document.createElement("span");
      name.className = "storage-dataset-name";
      name.textContent = getDisplayDatasetName(entry.label);

      left.append(deleteButton, checkbox, name);
      item.append(left);
      box.append(item);
    });

    storageDatasetList.append(box);
  };

  if (storageDatasetList) {
    renderGroup("Öffentliche Kartensätze", publicEntries);
    renderGroup("Eigene Kartensätze", ownEntries);
  }

  syncStorageDatasetListSelectionState();
  updateSelectedDatasetsSummaryRow();
}

function syncStorageDatasetListSelectionState() {
  if (!storageDatasetList && !storageDatasetSummary) return;
  const selectedKeys = new Set(readSelectedDatasetKeys());
  const selectedCount = selectedKeys.size;
  const maxReached = selectedCount >= MAX_DATASET_SELECTIONS;

  const checkboxes = [
    ...(storageDatasetList ? [...storageDatasetList.querySelectorAll('input.storage-dataset-checkbox[data-key]')] : []),
    ...(storageDatasetSummary ? [...storageDatasetSummary.querySelectorAll('input.storage-dataset-checkbox[data-key]')] : []),
  ];
  checkboxes.forEach((checkbox) => {
    const key = String(checkbox.dataset.key ?? "").trim();
    if (!key) return;
    const isChecked = selectedKeys.has(key);
    checkbox.checked = isChecked;
    checkbox.disabled = Boolean(!isChecked && maxReached);

    const row = checkbox.closest("tr");
    if (row) {
      row.classList.toggle("is-selected", isChecked);
    }
  });
}

let pendingStorageDeleteObjectName = "";
let pendingDatasetDelete = null;

function openStorageDeleteConfirm(objectName) {
  if (!storageDeleteConfirmModal) {
    return window.confirm(`CSV-Datei „${getDisplayDatasetName(objectName)}" wirklich entfernen?`);
  }

  pendingStorageDeleteObjectName = String(objectName ?? "").trim();
  if (!pendingStorageDeleteObjectName) {
    return false;
  }

  if (storageDeleteConfirmText) {
    storageDeleteConfirmText.textContent = `Sind Sie sicher, dass Sie „${getDisplayDatasetName(pendingStorageDeleteObjectName)}" entfernen möchten?`;
  }
  storageDeleteConfirmModal.classList.remove("hidden");
  return true;
}

function openDatasetDeleteConfirm(info) {
  if (!storageDeleteConfirmModal) return;
  pendingDatasetDelete = info;
  pendingStorageDeleteObjectName = "";
  if (storageDeleteConfirmText) {
    storageDeleteConfirmText.textContent = `Sind Sie sicher, dass Sie den Kartensatz „${info.label}" löschen möchten?`;
  }
  storageDeleteConfirmModal.classList.remove("hidden");
}

function closeStorageDeleteConfirm() {
  storageDeleteConfirmModal?.classList.add("hidden");
  pendingStorageDeleteObjectName = "";
  pendingDatasetDelete = null;
}

async function executeDatasetDelete(info) {
  if (!info) return;
  try {
    // Resolve: if this is a preset key, find the migrated custom dataset with matching label
    let resolvedInfo = info;
    if (!info.isCustom && !info.isStorage && info.key && PRESET_DATASETS[info.key]) {
      const presetLabel = normalizeDatasetLabel(PRESET_DATASETS[info.key]?.label);
      const migratedEntry = Object.values(state.customDatasets).find(
        (d) => d.isPublic && normalizeDatasetLabel(d.label) === presetLabel
      );
      if (migratedEntry) {
        resolvedInfo = { ...info, isCustom: true, datasetId: migratedEntry.id, key: toCustomDatasetKey(migratedEntry.id) };
      } else {
        // No migrated dataset — just hide the preset permanently
        persistRemovedPresetKey(info.key);
      }
    }

    if (isAdminSession && resolvedInfo.id) {
      // Admin can delete any dataset with an ID directly via authenticated API
      const deleteUrl = `${getCustomDatasetsApiEndpoint()}/${encodeURIComponent(resolvedInfo.id)}`;
      console.log("Admin deleting dataset:", deleteUrl);
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: await getAuthHeaders({ includeContentType: true }),
        body: JSON.stringify({}),
      });
      console.log("Admin delete response:", response.status);
      const responseText = await response.text().catch(() => "");
      console.log("Admin delete response body:", responseText);
      if (!response.ok) {
        console.error("Admin delete failed:", response.status, responseText);
        alert(`Löschen fehlgeschlagen: ${response.status} - ${responseText || "Keine Berechtigung"}`);
        return;
      }
      // Also remove from local state
      if (resolvedInfo.datasetId) {
        delete state.customDatasets[resolvedInfo.datasetId];
      }
    } else if (resolvedInfo.isCustom && resolvedInfo.datasetId) {
      const dataset = state.customDatasets[resolvedInfo.datasetId];
      delete state.customDatasets[resolvedInfo.datasetId];
      const persistenceResult = await persistCustomDatasets({
        operation: "delete",
        datasetId: resolvedInfo.datasetId,
        previousDataset: dataset,
      });
      if (!persistenceResult.ok) {
        if (dataset) state.customDatasets[resolvedInfo.datasetId] = dataset;
        return;
      }
    } else if (resolvedInfo.isStorage && resolvedInfo.objectName) {
      await deleteStoredCsvFile(resolvedInfo.objectName);
      delete state.storageDatasets[resolvedInfo.objectName];
    }
    state.selectedDatasets = readSelectedDatasetKeys().filter(
      (key) => key !== info.key && key !== resolvedInfo.key
    );
    refreshDatasetSelections();
    await refreshPublicCsvList();
  } catch (error) {
    // silently fail
  }
}

function showDatasetNamePrompt(title, defaultValue = "") {
  return new Promise((resolve) => {
    if (!datasetNamePrompt) return resolve(null);
    if (datasetNamePromptText) datasetNamePromptText.textContent = title;
    if (datasetNamePromptInput) {
      datasetNamePromptInput.value = defaultValue;
    }
    datasetNamePrompt.classList.remove("hidden");
    datasetNamePromptInput?.focus();

    const cleanup = () => {
      datasetNamePrompt.classList.add("hidden");
      datasetNamePromptOk?.removeEventListener("click", onOk);
      datasetNamePromptCancel?.removeEventListener("click", onCancel);
      datasetNamePromptInput?.removeEventListener("keydown", onKey);
    };
    const onOk = () => {
      const val = datasetNamePromptInput?.value?.trim() ?? "";
      cleanup();
      resolve(val || null);
    };
    const onCancel = () => { cleanup(); resolve(null); };
    const onKey = (e) => { if (e.key === "Enter") onOk(); if (e.key === "Escape") onCancel(); };

    datasetNamePromptOk?.addEventListener("click", onOk);
    datasetNamePromptCancel?.addEventListener("click", onCancel);
    datasetNamePromptInput?.addEventListener("keydown", onKey);
  });
}

async function executeDatasetRename(info) {
  if (!info) return;
  const newName = await showDatasetNamePrompt(
    `Kartensatz „${info.label}" umbenennen:`,
    info.label
  );
  if (!newName) return;

  try {
    if (info.isCustom && info.datasetId) {
      const existing = state.customDatasets[info.datasetId];
      if (!existing) return;
      const cards = Array.isArray(existing.cards) ? existing.cards : [];
      const result = await saveCardsAsCustomDataset({
        cards,
        label: newName,
        existingId: info.datasetId,
        isPublic: existing.isPublic ?? false,
      });
      if (!result.ok) return;
    } else if (info.isStorage && info.objectName) {
      // Storage datasets can't be renamed directly - copy then delete old
      const cards = state.storageDatasets[info.objectName];
      if (!Array.isArray(cards)) return;
      const result = await saveCardsAsCustomDataset({
        cards,
        label: newName,
        isPublic: false,
      });
      if (!result.ok) return;
      await deleteStoredCsvFile(info.objectName);
      delete state.storageDatasets[info.objectName];
    }
    refreshDatasetSelections();
    await refreshPublicCsvList();
  } catch (error) {
    // silently fail
  }
}

async function executeDatasetCopy(info) {
  if (!info) return;
  const copyName = await showDatasetNamePrompt(
    `Name für Kopie von „${info.label}":`,
    `${info.label} (Kopie)`
  );
  if (!copyName) return;

  try {
    const entry = getDatasetEntryByKey(info.key);
    const cards = entry?.cards;
    if (!Array.isArray(cards) || cards.length === 0) return;

    const result = await saveCardsAsCustomDataset({
      cards: cloneCards(cards),
      label: copyName,
      isPublic: false,
    });
    if (!result.ok) return;

    refreshDatasetSelections();
    await refreshPublicCsvList();
  } catch (error) {
    // silently fail
  }
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

async function loadAllStoredCsvDatasets(files = []) {
  const loadedDatasets = {};

  await Promise.all(
    (Array.isArray(files) ? files : []).map(async (file) => {
      const objectName = String(file?.name || "").trim();
      if (!objectName) return;
      try {
        const csvText = await downloadStoredCsvFile(objectName);
        const cards = parseStorageCsvToCards(csvText);
        if (cards.length > 0) {
          loadedDatasets[objectName] = cloneCards(cards);
        }
      } catch (error) {
        console.warn(`Storage-Kartenset konnte nicht geladen werden (${objectName}):`, error);
      }
    }),
  );

  state.storageDatasets = loadedDatasets;
}

async function refreshPublicCsvList() {
  if (!isLoggedIn) {
    state.storageDatasetFiles = [];
    state.storageDatasets = {};
    setStorageSelectOptions([]);
    renderStorageDatasetList([]);
    refreshDatasetSelections();
    return;
  }
  setCsvStatus("Lade Dateiliste ...");

  try {
    const sortedFiles = await listStoredCsvFiles();

    state.storageDatasetFiles = sortedFiles;
    await loadAllStoredCsvDatasets(sortedFiles);
    setStorageSelectOptions(sortedFiles);
    renderStorageDatasetList(sortedFiles);
    refreshDatasetSelections();
    setCsvStatus(`${Object.keys(state.storageDatasets).length} Kartensatz/Kartensätze aus Supabase geladen.`);
  } catch (error) {
    if (error?.isAuthError) {
      setCsvStatus(error.message, { isError: true });
      if (error.shouldRedirect) {
        redirectToLogin();
      }
      return;
    }
    setCsvStatus(`Fehler beim Laden der Dateiliste: ${error?.message || String(error)}`, { isError: true });
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
    setCsvStatus(`Lade Kartenset aus Storage: ${datasetLabel} ...`);
    const csvText = await downloadStoredCsvFile(selectedName);
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
    syncStorageDatasetListSelectionState();
    updateDatasetAddButtonVisibility();

    console.log("Storage CSV Vorschau (erste 200 Zeichen):", csvText.slice(0, 200));

    setCsvStatus(`${datasetLabel}: ${cards.length} Karten aus Storage geladen.`);
    if (csvDatasetNameInput) {
      csvDatasetNameInput.value = datasetLabel;
    }
  } catch (error) {
    if (error?.isAuthError) {
      setCsvStatus(error.message, { isError: true });
      if (error.shouldRedirect) {
        redirectToLogin();
      }
      return;
    }
    setCsvStatus(`Fehler beim Laden des Storage-Kartensets: ${error?.message || String(error)}`, { isError: true });
  }
}

async function handleCsvUpload() {
  if (!requireFullAccess()) return;
  const file = csvUpload?.files?.[0];
  if (!file) {
    setCsvStatus("bitte csv Datei zum hochladen auswählen!", { isError: true });
    return;
  }

  if (!isValidCsvUpload(file)) {
    setCsvStatus("Ungültige Datei. Erlaubt ist nur .csv.", { isError: true });
    return;
  }

  if (file.size > CSV_MAX_SIZE_BYTES) {
    setCsvStatus("Datei ist zu groß. Maximal 1 MB erlaubt.", { isError: true });
    return;
  }

  const uploadName = sanitizeUploadFileName(file.name);
  const derivedLabel = getDisplayDatasetName(file.name);

  try {
    csvUploadButton && (csvUploadButton.disabled = true);
    setCsvStatus("Upload läuft ...");

    const csvText = await file.text();
    await uploadCsvFileToStorage(file, uploadName);

    const cards = parseStorageCsvToCards(csvText);
    if (cards.length === 0) {
      throw new Error("CSV enthält keine gültigen Karten.");
    }
    state.uploadedCsvCards = cloneCards(cards);
    state.uploadedCsvLabel = derivedLabel;

    if (csvUpload) {
      csvUpload.value = "";
    }
    syncCsvUploadButtonVisibility();
    setCsvStatus(`Upload erfolgreich: ${derivedLabel} (${cards.length} Karten erkannt)`);

    await refreshPublicCsvList();
    if (storageDatasetSelect) {
      storageDatasetSelect.value = uploadName;
    }
    await loadStorageDataset(uploadName);
  } catch (error) {
    if (error?.isAuthError) {
      setCsvStatus(error.message, { isError: true });
      if (error.shouldRedirect) {
        redirectToLogin();
      }
      return;
    }
    setCsvStatus(`Upload-Fehler: ${error?.message || String(error)}`, { isError: true });
  } finally {
    csvUploadButton && (csvUploadButton.disabled = false);
    syncCsvUploadButtonVisibility();
  }
}

async function handleCsvUploadPublic() {
  if (!requireFullAccess() || !isAdminSession) return;
  const file = csvUpload?.files?.[0];
  if (!file) {
    setCsvStatus("Bitte CSV-Datei zum Hochladen auswählen!", { isError: true });
    return;
  }
  if (!isValidCsvUpload(file)) {
    setCsvStatus("Ungültige Datei. Erlaubt ist nur .csv.", { isError: true });
    return;
  }
  if (file.size > CSV_MAX_SIZE_BYTES) {
    setCsvStatus("Datei ist zu groß. Maximal 1 MB erlaubt.", { isError: true });
    return;
  }

  try {
    csvUploadPublicButton && (csvUploadPublicButton.disabled = true);
    const csvText = await file.text();
    const cards = parseStorageCsvToCards(csvText);
    if (cards.length === 0) {
      setCsvStatus("CSV enthält keine gültigen Karten.", { isError: true });
      return;
    }

    const defaultName = getDisplayDatasetName(file.name);
    const name = await showDatasetNamePrompt("Name für öffentlichen Kartensatz:", defaultName);
    if (!name) return;

    setCsvStatus("Öffentlichen Kartensatz speichern…");
    const result = await saveCardsAsCustomDataset({
      cards,
      label: name,
      isPublic: true,
    });

    if (!result.ok) {
      setCsvStatus(result.message || "Speichern fehlgeschlagen.", { isError: true });
      return;
    }

    if (csvUpload) csvUpload.value = "";
    syncCsvUploadButtonVisibility();
    setCsvStatus(`Öffentlicher Kartensatz „${name}" erstellt (${cards.length} Karten).`);
    await refreshPublicCsvList();
  } catch (error) {
    if (error?.isAuthError) {
      setCsvStatus(error.message, { isError: true });
      if (error.shouldRedirect) redirectToLogin();
      return;
    }
    setCsvStatus(`Fehler: ${error?.message || String(error)}`, { isError: true });
  } finally {
    csvUploadPublicButton && (csvUploadPublicButton.disabled = false);
    syncCsvUploadButtonVisibility();
  }
}

async function saveUploadedCsvAsNewDataset() {
  if (!requireFullAccess()) return;
  const label = csvDatasetNameInput?.value?.trim() || state.uploadedCsvLabel || "";
  const result = await saveCardsAsCustomDataset({
    cards: state.uploadedCsvCards,
    label,
    isPublic: isPublicDatasetToggleChecked(csvVisibilityToggle),
  });
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
      ? `CSV global gespeichert: ${result.label} (${result.count} Karten). ${getDatasetVisibilityStatus(result.datasetId)}.`
      : `CSV lokal gespeichert: ${result.label} (${result.count} Karten). ${getDatasetVisibilityStatus(result.datasetId)}.`;
}

async function overwriteDatasetWithUploadedCsv() {
  if (!requireFullAccess()) return;
  const selectedId = csvOverwriteSelect?.value ?? "";
  const existingDataset = state.customDatasets[selectedId];
  if (!existingDataset) {
    csvStatus.textContent = "Bitte zuerst einen vorhandenen eigenen Kartensatz auswählen.";
    return;
  }

  const label = csvDatasetNameInput?.value?.trim() || state.uploadedCsvLabel || existingDataset.label;
  const result = await saveCardsAsCustomDataset({
    cards: state.uploadedCsvCards,
    label,
    existingId: selectedId,
    isPublic: isPublicDatasetToggleChecked(csvVisibilityToggle),
  });
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
      ? `Datensatz global überschrieben: ${result.label} (${result.count} Karten). ${getDatasetVisibilityStatus(result.datasetId)}.`
      : `Datensatz lokal überschrieben: ${result.label} (${result.count} Karten). ${getDatasetVisibilityStatus(result.datasetId)}.`;
}

function syncSettingsPanel() {
  swapSelectGame.value = swapSelect.value;
  syncCategoryControls(gameCategoryControls, state.categories, state.categoryTimes);

  const availableCategories = getAvailableCategoriesFromCards(state.cards);
  gameCategoryControls.forEach((control) => {
    const row = control.checkbox?.closest(".category-setting") ?? control.timeSelect?.closest(".category-setting");
    const isAvailable = availableCategories.has(control.category);
    row?.classList.toggle("hidden", !isAvailable);
    if (!isAvailable && control.checkbox) {
      control.checkbox.checked = false;
    }
  });

  const shouldExpandDistribution = toggleCategoryDistributionButtonGame?.getAttribute("aria-expanded") === "true";
  if (shouldExpandDistribution) {
    renderBoardCategoryOptionsGame();
  }
}

function applySettingsFromPanel() {
  const availableCategories = getAvailableCategoriesFromCards(state.cards);
  const previousSelectedBoardCategories = [...state.selectedBoardCategories];
  const selectedCategories = filterCategoriesToAvailability(
    getSelectedCategories(gameCategoryControls),
    availableCategories
  );
  if (selectedCategories.length === 0) {
    setCategorySelectionInvalidState(gameCategoryControls, true);
    return;
  }
  setCategorySelectionInvalidState(gameCategoryControls, false);
  state.selectedBoardCategories = [...selectedCategories];
  syncCategoryWeightsForAvailableCategories(availableCategories);
  const weightedCategories = getWeightedBoardCategories(availableCategories);
  state.categories = weightedCategories.length > 0
    ? weightedCategories
    : getDefaultAvailableCategories(availableCategories);
  state.categoryTimes = readCategoryTimes(gameCategoryControls);
  state.timeLimit = state.categoryTimes[selectedCategories[0]] ?? 60;
  state.swapPenalty = Number.parseInt(swapSelectGame.value, 10);
  swapSelect.value = swapSelectGame.value;
  syncCategoryControls(menuCategoryControls, state.categories, state.categoryTimes);
  if (!state.timer) {
    const timerValue = state.roundTimer > 0 ? state.roundTimer : state.timeLimit;
    updateTimerDisplay(timerValue);
  }

  const selectionChanged =
    previousSelectedBoardCategories.length !== selectedCategories.length
    || previousSelectedBoardCategories.some((category) => !selectedCategories.includes(category));

  const lastBoardSelection = Array.isArray(state.lastBoardSelectedCategories) ? state.lastBoardSelectedCategories : [];
  const lastBoardWeights = state.lastBoardCategoryWeights && typeof state.lastBoardCategoryWeights === "object"
    ? state.lastBoardCategoryWeights
    : {};
  const lastBoardSelectionChanged =
    lastBoardSelection.length !== selectedCategories.length
    || lastBoardSelection.some((category) => !selectedCategories.includes(category));
  const weightsChanged = selectedCategories.some((category) =>
    clampCategoryWeight(lastBoardWeights[category] ?? CATEGORY_WEIGHT_DEFAULT)
      !== clampCategoryWeight(state.categoryWeights[category] ?? CATEGORY_WEIGHT_DEFAULT)
  );

  buildBoard(state.categories, { preserveAssignments: !(selectionChanged || lastBoardSelectionChanged || weightsChanged) });
  syncBoardDecorations();
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
  clearAnswerReturnTimer();
  clearSingleChoiceReturnTimer();
  stopTimer();
  resetRoundState("");
  stopBoardViewLoop();
  hideTurnOverlay();
  setTurnActionButtonsDisabled(false);
  clearStoredActiveGameSnapshot();
  setRoute("#/settings-board");
  updateMainMenuRequiredSelectionState();
}

function openMainMenuConfirm() {
  if (!mainMenuConfirmModal) {
    handleMainMenu();
    return;
  }
  mainMenuConfirmModal.classList.remove("hidden");
}

function closeMainMenuConfirm() {
  mainMenuConfirmModal?.classList.add("hidden");
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

function syncTurnHeaderOverlapLayout() {
  if (!turnWord || !turnTimeoutButton || !turnRoundCounter) return;
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) {
    turnWord.classList.remove("timeout-overlap");
    return;
  }

  const timeoutRect = turnTimeoutButton.getBoundingClientRect();
  const counterRect = turnRoundCounter.getBoundingClientRect();

  const overlaps = !(
    timeoutRect.right < counterRect.left
    || timeoutRect.left > counterRect.right
    || timeoutRect.bottom < counterRect.top
    || timeoutRect.top > counterRect.bottom
  );

  turnWord.classList.toggle("timeout-overlap", overlaps);
}

function showTurnOverlay() {
  clearAnswerReturnTimer();
  setTurnActionButtonsDisabled(false);
  state.phase = GAME_PHASES.READY;
  if (turnPenalty) {
    turnPenalty.classList.remove("show");
    turnPenalty.textContent = "";
  }
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

function hideTurnOverlay({ immediate = false } = {}) {
  stopTurnTensionLoop();
  document.body.classList.remove("card-view-active");
  fullscreenCardOverlay.setOpen({ isOpen: false });
  turnOverlay.classList.remove("expanded");
  turnOverlay.classList.remove("category");
  turnOverlay.classList.remove("fullscreen-state");
  turnOverlay.classList.remove("active");
  requestAnimationFrame(() => {
    syncBoardDecorations();
  });
  if (immediate) {
    turnOverlay.classList.add("hidden");
  } else {
    setTimeout(() => {
      turnOverlay.classList.add("hidden");
    }, 700);
  }
  state.phase = GAME_PHASES.IDLE;
  syncBoardViewLoop();
}

function startCountdown() {
  clearInterval(state.countdownTimer);
  state.countdownTimer = null;
  let countdown = 3;
  turnCountdown.textContent = `${countdown}`;
  turnCountdown.classList.remove("is-ticking");
  void turnCountdown.offsetWidth;
  turnCountdown.classList.add("is-ticking");
  playCountdownTick();
  turnCountdown.classList.toggle("is-quizfrage", state.pendingCategory === "Quizfrage" || state.pendingCategory === MASTER_QUIZ_CATEGORY);
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
      turnCountdown.textContent = "0";
      playCountdownTick({ isFinal: true });
      showWordCard();
      return;
    }
    turnCountdown.textContent = `${countdown}`;
    turnCountdown.classList.remove("is-ticking");
    void turnCountdown.offsetWidth;
    turnCountdown.classList.add("is-ticking");
    playCountdownTick();
  }, 1000);
}

function showWordCard() {
  clearAnswerReturnTimer();
  clearSingleChoiceReturnTimer();
  setTurnActionButtonsDisabled(false);
  if (turnPenalty) {
    turnPenalty.classList.remove("show");
    turnPenalty.textContent = "";
  }
  document.body.classList.add("card-view-active");
  turnCategory.classList.add("hidden");
  turnCountdownCard.classList.add("hidden");
  turnOverlay.classList.remove("category");
  turnOverlay.classList.add("expanded");
  turnOverlay.classList.add("fullscreen-state");
  fullscreenCardOverlay.setOpen({ isOpen: true });
  state.phase = GAME_PHASES.FULLSCREEN_CARD;
  syncBoardViewLoop();
  resetRoundState(state.pendingCategory ?? "");
  state.roundActive = normalizeGameMode(state.gameMode) === GAME_MODES.BLITZ;
  state.currentCardType = state.pendingCategory;
  updateRoundCounterDisplay(0);
  const card = getCardByCategory(state.pendingCategory);
  state.currentCard = card;
  state.timeLimit = state.categoryTimes[state.pendingCategory] ?? 60;
  playTurnTensionLoop();

  const handleClassicTimeout = () => {
    if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
    finishTurn(false, true, { returnToPrevious: true });
  };

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
    if (state.roundActive) {
      requestAnimationFrame(() => {
        if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
        startTimer({
          onTimeout: () => endRound({ timedOut: true }),
        });
        syncTurnHeaderOverlapLayout();
      });
    } else {
      requestAnimationFrame(() => {
        if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
        startTimer({ onTimeout: handleClassicTimeout });
        syncTurnHeaderOverlapLayout();
      });
    }
  } else {
    state.quizPhase = null;
    setWordCard(card);
    setTurnButtons({ showCorrect: true, showWrong: true, showSwap: true, showContinue: false });
    if (state.roundActive) {
      requestAnimationFrame(() => {
        if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
        startTimer({ onTimeout: () => endRound({ timedOut: true }) });
        syncTurnHeaderOverlapLayout();
      });
    } else {
      requestAnimationFrame(() => {
        if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
        startTimer({ onTimeout: handleClassicTimeout });
        syncTurnHeaderOverlapLayout();
      });
    }
  }
}

function applySwapPenalty() {
  const penalty = state.swapPenalty;
  if (!Number.isFinite(penalty) || penalty <= 0) return;
  state.remainingTime = Math.max(0, state.remainingTime - penalty);
  state.roundTimer = state.remainingTime;
  updateTimerDisplay(state.remainingTime);
  showPenaltyToast(penalty);
  if (state.remainingTime <= 0) {
    if (state.roundActive) {
      endRound({ timedOut: true });
      return;
    }
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

function handleTurnTimeout() {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  stopTimer();
  if (state.roundActive) {
    endRound({ timedOut: true });
    return;
  }
  finishTurn(false, true, { returnToPrevious: true, wrongSoundAlreadyPlayed: true });
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
  syncBoardViewLoop();
}

function handleWinnerRestart() {
  winnerScreen.classList.add("hidden");
  handleMainMenu();
}

async function setup() {
  state.customDatasetsApiUrl = resolveCustomDatasetsApiUrl();
  await refreshAdminSessionState();
  state.customDatasets = await loadCustomDatasets();
  menuCategoryControls.forEach((control) => populateTimeSelect(control.timeSelect, getDefaultRoundTimeForCategory(control.category)));
  gameCategoryControls.forEach((control) => populateTimeSelect(control.timeSelect, getDefaultRoundTimeForCategory(control.category)));
  syncTeamCountControls(teamCountInput.value);
  syncSharedTeamCountControls(sharedTeamCountInput?.value ?? 2);
  const selectedBoardSize = getSelectedBoardSize(boardSizeSelect ?? boardSizeInputs);
  syncBoardSizeControls(selectedBoardSize);
  applyBoardSize(selectedBoardSize);
  syncBoardDecorations();
  updateTimerDisplay(state.timeLimit);
  updateFullscreenState();
  syncSettingsPanel();
  setupDatasetSelects();
  renderBoardCategorySelector();
  renderBoardCategoryOptions();
  applySelectedDatasets();
  await refreshPublicCsvList();
  syncCsvUploadButtonVisibility();
}

window.addEventListener("resize", () => {
  syncBoardDecorations();
  syncTurnHeaderOverlapLayout();
});
document.fonts?.ready?.then(() => {
  scheduleBoardCategorySelectorFit();
});
teamListContainer?.addEventListener("click", handleTeamListClick);
document.addEventListener("click", (event) => {
  const clickedInsideMain = teamListContainer?.contains(event.target);
  if (!clickedInsideMain) {
    closeAllTeamPickers();
  }
});
teamCountInput?.addEventListener("change", (event) => {
  syncTeamCountControls(event.target.value);
});
teamCountDecrease?.addEventListener("click", () => {
  syncTeamCountControls(Number.parseInt(teamCountInput.value, 10) - 1);
});
teamCountIncrease?.addEventListener("click", () => {
  syncTeamCountControls(Number.parseInt(teamCountInput.value, 10) + 1);
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

syncAudioToggleButtons();
applyTheme(getStoredTheme());
applySettingsMode();
storeGameMode(readStoredGameMode());

syncLandingQrCode();

if (state.musicEnabled) {
  unlockAudioOnFirstInteraction();
}

if (!window.location.hash) {
  const storedRoute = localStorage.getItem(CURRENT_ROUTE_STORAGE_KEY);
  const routeFromPathname =
    window.location.pathname === "/cardsets"
      ? "#/cardsets"
      : window.location.pathname === "/editor"
        ? "#/editor"
        : window.location.pathname === "/editcardsets"
          ? "#/editcardsets"
        : window.location.pathname === "/advancedsettings"
          ? "#/advancedsettings"
          : "";
  const defaultRoute = "#/landing";
  setRoute(routeFromPathname || storedRoute || defaultRoute);
} else {
  setRoute(window.location.hash);
}
updateMainMenuRequiredSelectionState();

document.getElementById("game-mode-classic")?.addEventListener("click", () => {
  storeGameMode(GAME_MODES.CLASSIC);
});

document.getElementById("game-mode-blitz")?.addEventListener("click", () => {
  storeGameMode(GAME_MODES.BLITZ);
});

startButton.addEventListener("click", handleStartGame);
themeToggle?.addEventListener("click", () => {
  toggleTheme();
});
toggleCategoryDistributionButton?.addEventListener("click", toggleCategoryDistribution);
resetCategoryDistributionButton?.addEventListener("click", () => {
  resetBoardCategoryDistribution();
});
toggleCategoryDistributionButtonGame?.addEventListener("click", toggleCategoryDistributionGame);
resetCategoryDistributionButtonGame?.addEventListener("click", () => {
  resetBoardCategoryDistributionGame();
});
document.addEventListener("click", (event) => {
  const targetElement = getEventTargetElement(event);
  if (!targetElement) return;
  const routeButton = targetElement.closest("[data-route]");
  if (!routeButton) return;
  const targetRoute = routeButton.getAttribute("data-route");
  if (!targetRoute) return;
  setRoute(targetRoute);
  if (targetRoute === "#/settings-board") {
    updateMainMenuRequiredSelectionState();
  }
});
window.addEventListener("hashchange", () => {
  setRoute(window.location.hash);
});

// Restore route when returning to tab (browser sometimes resets to landing)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const storedRoute = localStorage.getItem(CURRENT_ROUTE_STORAGE_KEY);
    const currentHash = window.location.hash || "#/landing";
    // If current route is landing but stored route is different, restore it
    if (currentHash === "#/landing" && storedRoute && storedRoute !== "#/landing") {
      const activeGame = loadStoredActiveGameSnapshot();
      // Don't interrupt active games, otherwise restore the stored route
      if (!activeGame) {
        window.history.replaceState(null, "", storedRoute);
        setRoute(storedRoute);
      }
    }
  }
});

// Also handle pageshow (fires when page is loaded from cache)
window.addEventListener("pageshow", (event) => {
  // If persisted (loaded from bfcache), check if we need to restore route
  if (event.persisted) {
    const storedRoute = localStorage.getItem(CURRENT_ROUTE_STORAGE_KEY);
    const currentHash = window.location.hash || "#/landing";
    if (currentHash === "#/landing" && storedRoute && storedRoute !== "#/landing") {
      const activeGame = loadStoredActiveGameSnapshot();
      if (!activeGame) {
        window.history.replaceState(null, "", storedRoute);
        setRoute(storedRoute);
      }
    }
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest("button");
  if (!shouldPlayGenericButtonSound(button)) return;
  playButtonClickSound();
}, true);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (impressumModal && !impressumModal.classList.contains("hidden")) {
    closeLegalModal(impressumModal);
    return;
  }
  if (privacyModal && !privacyModal.classList.contains("hidden")) {
    closeLegalModal(privacyModal);
    return;
  }
  if (qrModal && !qrModal.classList.contains("hidden")) {
    closeQrModal();
    return;
  }
  if (sharedGameModal && !sharedGameModal.classList.contains("hidden")) {
    closeSharedGameModal();
    return;
  }
  if (cardEditorModal && !cardEditorModal.classList.contains("hidden")) {
    closeCardEditor();
  }
});
userMenuToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!isLoggedIn) {
    setRoute("#/login");
    return;
  }
  toggleUserMenuDropdown();
});
userMenuDropdown?.addEventListener("click", async (e) => {
  const item = e.target.closest("[data-action]");
  if (!item) return;
  closeUserMenuDropdown();
  const action = item.dataset.action;
  if (action === "account") {
    setRoute("#/account");
  } else if (action === "logout") {
    try {
      await window.supabase?.auth?.signOut();
    } catch { /* ignore */ }
  }
});
document.addEventListener("click", (e) => {
  if (userMenuDropdown && !userMenuDropdown.classList.contains("hidden")) {
    if (!e.target.closest(".user-menu-container")) {
      closeUserMenuDropdown();
    }
  }
});
rollButton.addEventListener("click", handleRoll);
undoButton.addEventListener("click", handleUndo);
csvUpload?.addEventListener("change", syncCsvUploadButtonVisibility);
csvUploadButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  handleCsvUpload();
});
csvUploadPublicButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  handleCsvUploadPublic();
});
csvRefreshListButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  refreshPublicCsvList();
});
storageDatasetSelect?.addEventListener("change", (event) => {
  loadStorageDataset(event.target.value);
  updateMainMenuRequiredSelectionState();
});

storageDatasetSummary?.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!target.classList.contains("storage-dataset-checkbox")) return;

  const key = String(target.dataset.key || "").trim();
  if (!key) return;

  if (target.checked) {
    const storageObjectName = fromStorageDatasetKey(key);
    if (storageObjectName && !state.storageDatasets[storageObjectName]) {
      await loadStorageDataset(storageObjectName);
    } else {
      const nextSelected = new Set(readSelectedDatasetKeys());
      nextSelected.add(key);
      state.selectedDatasets = [...nextSelected].slice(0, MAX_DATASET_SELECTIONS);
      refreshDatasetSelections();
    }
  } else {
    state.selectedDatasets = readSelectedDatasetKeys().filter((selectedKey) => selectedKey !== key);
    refreshDatasetSelections();
  }

  updateMainMenuRequiredSelectionState();
});
storageDatasetList?.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!target.classList.contains("storage-dataset-checkbox")) return;

  const key = String(target.dataset.key || "").trim();
  if (!key) return;

  if (target.checked) {
    const storageObjectName = fromStorageDatasetKey(key);
    if (storageObjectName && !state.storageDatasets[storageObjectName]) {
      await loadStorageDataset(storageObjectName);
    } else {
      const nextSelected = new Set(readSelectedDatasetKeys());
      nextSelected.add(key);
      state.selectedDatasets = [...nextSelected].slice(0, MAX_DATASET_SELECTIONS);
      refreshDatasetSelections();
    }
  } else {
    state.selectedDatasets = readSelectedDatasetKeys().filter((selectedKey) => selectedKey !== key);
    refreshDatasetSelections();
  }

  updateMainMenuRequiredSelectionState();
});
storageDatasetList?.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const actionButton = target.closest("button[data-storage-action]");
  if (!actionButton) return;

  const objectName = String(actionButton.dataset.objectName || "").trim();
  if (!objectName) return;

  if (actionButton.dataset.storageAction === "delete") {
    if (!requireFullAccess()) return;
    openStorageDeleteConfirm(objectName);
  }
});

storageDatasetSummary?.addEventListener("click", (event) => {
  const actionBtn = event.target.closest(".dataset-action-btn");
  if (!actionBtn) return;
  event.preventDefault();
  event.stopPropagation();

  const rawDatasetId = actionBtn.dataset.datasetId;
  const datasetKey = actionBtn.dataset.datasetKey;
  const extractedId = rawDatasetId || (datasetKey?.startsWith("custom:") ? datasetKey.slice(7) : null);
  const info = {
    key: datasetKey,
    label: actionBtn.dataset.datasetLabel || "Unbenannt",
    isCustom: actionBtn.dataset.isCustom === "true",
    isStorage: actionBtn.dataset.isStorage === "true",
    datasetId: extractedId,
    id: extractedId,
    objectName: actionBtn.dataset.objectName || null,
  };

  if (actionBtn.classList.contains("dataset-delete-btn")) {
    openDatasetDeleteConfirm(info);
  } else if (actionBtn.classList.contains("dataset-rename-btn")) {
    executeDatasetRename(info);
  } else if (actionBtn.classList.contains("dataset-copy-btn")) {
    executeDatasetCopy(info);
  }
});

storageDeleteConfirmCancelButton?.addEventListener("click", () => {
  closeStorageDeleteConfirm();
});

storageDeleteConfirmOkButton?.addEventListener("click", async () => {
  // Handle generic dataset delete (from summary table delete buttons)
  if (pendingDatasetDelete) {
    const info = pendingDatasetDelete;
    closeStorageDeleteConfirm();
    await executeDatasetDelete(info);
    return;
  }

  // Handle legacy storage file delete
  const objectName = String(pendingStorageDeleteObjectName || "").trim();
  if (!objectName) {
    closeStorageDeleteConfirm();
    return;
  }

  try {
    await deleteStoredCsvFile(objectName);
    delete state.storageDatasets[objectName];
    state.selectedDatasets = readSelectedDatasetKeys().filter((key) => key !== toStorageDatasetKey(objectName));
    refreshDatasetSelections();
    await refreshPublicCsvList();
  } catch (error) {
    // silently fail
  } finally {
    closeStorageDeleteConfirm();
  }
});
csvSaveNewButton?.addEventListener("click", saveUploadedCsvAsNewDataset);
csvOverwriteButton?.addEventListener("click", overwriteDatasetWithUploadedCsv);
csvOverwriteSelect?.addEventListener("change", () => {
  updateCsvDatasetActionState();
  syncCsvVisibilityFromSelectedDataset();
});

if (openEditorPageButton) {
  openEditorPageButton.onclick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    // Read checked checkboxes from cardsets summary table
    const checkedKeys = getCardsetsSummaryCheckedKeys();
    state._pendingEditorDatasetKeys = checkedKeys.length > 0 ? checkedKeys : null;
    setRoute("#/editcardsets");
    return false;
  };
}

openCardEditorButton?.addEventListener("click", openCardEditor);
closeCardEditorButton?.addEventListener("click", closeCardEditor);
cardEditorAddRowButton?.addEventListener("click", addEditorRow);
cardEditorSaveButton?.addEventListener("click", saveCardEditor);
cardEditorExportButton?.addEventListener("click", exportEditorCardsAsCsv);
cardEditorUploadCsvButton?.addEventListener("click", uploadEditorCardsAsCsv);
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
cardEditorBody?.addEventListener("input", () => {
  updateEditorValidationState();
  updateEditorUnsavedChanges();
});
cardEditorBody?.addEventListener("change", () => {
  updateEditorValidationState();
  updateEditorUnsavedChanges();
});
cardEditorBody?.addEventListener("paste", handleEditorTablePaste);

// New Editor Bottom Bar Event Listeners
editorBackButton?.addEventListener("click", async () => {
  if (state.editor.hasUnsavedChanges) {
    const action = await showEditorUnsavedConfirm();
    if (action === "save") {
      await saveEditorDataset();
      // If still unsaved after save attempt (e.g. cancelled or failed), stay
      if (state.editor.hasUnsavedChanges) return;
    }
    // "discard" falls through to navigate back
  }
  syncEditorSelectionToCardsets();
  setRoute("#/cardsets");
});

editorSaveButton?.addEventListener("click", () => {
  saveEditorDataset();
});

editorMoreButton?.addEventListener("click", () => {
  toggleMoreMenu();
});

// More menu item handlers
editorMoreDropdown?.addEventListener("click", (event) => {
  const item = event.target.closest(".editor-more-item");
  if (!item) return;
  const action = item.dataset.action;
  if (action) {
    handleMoreMenuAction(action);
  }
});

// Dataset Selector Event Listeners
editorDatasetDropdownToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleDatasetDropdown();
});

// Close both dropdowns when clicking outside
document.addEventListener("click", (event) => {
  // Close more menu
  if (!editorMoreDropdown?.classList.contains("hidden")) {
    if (!editorMoreButton?.contains(event.target) && !editorMoreDropdown?.contains(event.target)) {
      closeMoreMenu();
    }
  }

  // Close dataset dropdown
  if (!editorDatasetDropdown?.classList.contains("hidden")) {
    if (!editorDatasetDropdownToggle?.contains(event.target) && !editorDatasetDropdown?.contains(event.target)) {
      closeDatasetDropdown();
    }
  }
});

// Legacy buttons (for compatibility)
editcardsetsCancelButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  setRoute("#/cardsets");
});

editcardsetsSaveButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  saveEditorAsNewDataset();
});

editorFixedCancelButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  setRoute("#/cardsets");
});

editorFixedSaveButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  saveEditorAsNewDataset();
});
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

openImpressumButton?.addEventListener("click", () => openLegalModal(impressumModal));
openPrivacyButton?.addEventListener("click", () => openLegalModal(privacyModal));
closeImpressumModalButton?.addEventListener("click", () => closeLegalModal(impressumModal));
closePrivacyModalButton?.addEventListener("click", () => closeLegalModal(privacyModal));
impressumModal?.addEventListener("click", (event) => {
  if (event.target === impressumModal) {
    closeLegalModal(impressumModal);
  }
});
privacyModal?.addEventListener("click", (event) => {
  if (event.target === privacyModal) {
    closeLegalModal(privacyModal);
  }
});

closeSharedGameModalButton?.addEventListener("click", closeSharedGameModal);
sharedGameModal?.addEventListener("click", (event) => {
  if (event.target === sharedGameModal) {
    closeSharedGameModal();
  }
});

sharedGameStartButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  closeSharedGameModal();
  handleStartGame();
});
sharedGameCodeEl?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  copySharedGameCode();
});
sharedGameLinkButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  copySharedGameLink();
});
createSharedGameButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  createSharedGameFromCurrentMenu();
});

sharedTeamCountInput?.addEventListener("change", (event) => {
  syncSharedTeamCountControls(event.target.value);
});
sharedTeamCountDecrease?.addEventListener("click", () => {
  syncSharedTeamCountControls(Number.parseInt(sharedTeamCountInput.value, 10) - 1);
});
sharedTeamCountIncrease?.addEventListener("click", () => {
  syncSharedTeamCountControls(Number.parseInt(sharedTeamCountInput.value, 10) + 1);
});
sharedTeamListContainer?.addEventListener("click", handleTeamListClick);

sharedStartButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  startSharedGame();
});

async function submitJoinCode() {
  if (!joinCodeInput) return;
  const code = String(joinCodeInput.value ?? "").trim().toUpperCase();
  if (joinError) {
    joinError.hidden = true;
    joinError.textContent = "";
  }
  if (!code) {
    if (joinError) {
      joinError.textContent = "Bitte einen Spielcode eingeben.";
      joinError.hidden = false;
    }
    return;
  }

  if (joinSubmitButton) {
    joinSubmitButton.disabled = true;
  }
  try {
    const result = await fetchSharedGameByCode(code);
    if (!result.ok) {
      if (joinError) {
        joinError.textContent = result.status === 404 ? "Spielcode ungültig." : "Beitreten fehlgeschlagen.";
        joinError.hidden = false;
      }
      return;
    }
    const token = result.payload?.shareToken;
    if (token) {
      setRoute(`#/shared/${encodeURIComponent(token)}`);
    } else {
      state.sharedGame = {
        id: result.payload?.id,
        code: result.payload?.code,
        shareToken: result.payload?.shareToken ?? "",
        gameSettings: result.payload?.gameSettings ?? {},
        teamSettings: result.payload?.teamSettings ?? {},
        cardSets: Array.isArray(result.payload?.cardSets) ? result.payload.cardSets : [],
      };
      setRoute("#/shared");
    }
  } catch {
    if (joinError) {
      joinError.textContent = "Beitreten fehlgeschlagen.";
      joinError.hidden = false;
    }
  } finally {
    if (joinSubmitButton) {
      joinSubmitButton.disabled = false;
    }
  }
}

joinSubmitButton?.addEventListener("click", submitJoinCode);
joinCodeInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  submitJoinCode();
});
gameSoundToggle?.addEventListener("click", () => {
  setGameSoundsEnabled(!state.gameSoundsEnabled);
});
musicToggle?.addEventListener("click", () => {
  setMusicEnabled(!state.musicEnabled);
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
    setCategorySelectionInvalidState(menuCategoryControls, false);
    updateMainMenuRequiredSelectionState();
  });
});
gameCategoryControls.forEach((control) => {
  control.checkbox?.addEventListener("change", () => {
    setCategorySelectionInvalidState(gameCategoryControls, false);
    const isExpanded = toggleCategoryDistributionButtonGame?.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      renderBoardCategoryOptionsGame();
    }
  });
});
openSettingsButton.addEventListener("click", handleOpenSettings);
closeSettingsButton.addEventListener("click", handleCloseSettings);
applySettingsButton.addEventListener("click", applySettingsFromPanel);
saveAdvancedSettingsButton?.addEventListener("click", applyAdvancedSettingsAndReturn);
mainMenuButton.addEventListener("click", openMainMenuConfirm);

mainMenuConfirmCancelButton?.addEventListener("click", () => {
  closeMainMenuConfirm();
});

mainMenuConfirmOkButton?.addEventListener("click", () => {
  closeMainMenuConfirm();
  handleMainMenu();
});
turnWordHint?.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (!isAnswerCardCategory(state.pendingCategory) || state.quizPhase !== "question") return;
  turnContinueButton.click();
});

turnContinueButton.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (state.pendingCategory === "Single-Choice" && state.singleChoiceResult) {
    if (state.roundActive) {
      handleRoundAnswer(state.singleChoiceResult.isCorrect);
      return;
    }
    finishTurn(state.singleChoiceResult.isCorrect, false, {
      returnToPrevious: state.singleChoiceResult.returnToPrevious,
    });
    return;
  }
  if (isAnswerCardCategory(state.pendingCategory) && state.quizPhase === "question") {
    if (!state.roundActive) {
      stopTimer();
    }
    state.quizPhase = "answer";
    setQuizAnswerCard(state.currentCard);
    setTurnButtons({ showCorrect: true, showWrong: true, showSwap: false, showContinue: false });
    return;
  }
  if (state.roundActive) {
    handleRoundAnswer(false);
    return;
  }
  finishTurn(false);
});
turnSingleChoiceOptions?.addEventListener("click", (event) => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (state.pendingCategory !== "Single-Choice") return;
  if (state.quizPhase !== "question") return;
  const targetElement = getEventTargetElement(event);
  if (!targetElement) return;
  const optionButton = targetElement.closest(".single-choice-option-button");
  if (!optionButton || optionButton.disabled) return;
  const selectedOption = normalizeAnswerOption(optionButton.dataset.option ?? optionButton.textContent);
  const correctAnswer = normalizeAnswerOption(state.currentCard?.answer);
  setSingleChoiceResult(optionButton, selectedOption === correctAnswer);
});
turnCorrectButton?.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (isAnswerCardCategory(state.pendingCategory) && state.quizPhase !== "answer") return;
  if (state.roundActive) {
    handleRoundAnswer(true);
    return;
  }
  finishTurnAfterAnswerDelay(true);
});
turnWrongButton?.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.FULLSCREEN_CARD) return;
  if (isAnswerCardCategory(state.pendingCategory) && state.quizPhase !== "answer") return;
  if (state.roundActive) {
    handleRoundAnswer(false);
    return;
  }
  finishTurnAfterAnswerDelay(false, false, { returnToPrevious: true });
});
turnSwapButton?.addEventListener("click", handleSwapCard);
turnTimeoutButton?.addEventListener("click", handleTurnTimeout);
turnReadyButton.addEventListener("click", () => {
  if (state.phase !== GAME_PHASES.READY) return;
  turnReadyButton.disabled = true;
  startCountdown();
});
winnerRestartButton.addEventListener("click", handleWinnerRestart);

turnPenalty?.addEventListener("animationend", () => {
  turnPenalty.classList.remove("show");
});

csvInfo?.addEventListener("click", () => {
  if (!csvTooltip) {
    return;
  }
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
  syncBoardDecorations();
});

window.addEventListener(AUTH_MODE_EVENT, async (event) => {
  const previousIsLoggedIn = isLoggedIn;
  const previousIsAdminSession = isAdminSession;
  const nextIsLoggedIn = Boolean(event.detail?.isLoggedIn);
  authSession = event.detail?.session ?? null;
  isLoggedIn = nextIsLoggedIn;
  await refreshAdminSessionState();
  if (isLoggedIn && !previousIsLoggedIn) {
    const publicDatasets = filterCustomDatasetsForAuthMode(state.customDatasets);
    const loadedDatasets = await loadCustomDatasets();
    state.customDatasets = { ...publicDatasets, ...loadedDatasets };
  }
  if (isAdminSession && !previousIsAdminSession) {
    await migratePresetDatasetsToBackend();
  }
  if (previousIsLoggedIn === isLoggedIn && previousIsAdminSession === isAdminSession) return;
  applyDatasetAuthMode();
  await refreshPublicCsvList();
});

setup();

window.thinkarooRouter = { setRoute };
