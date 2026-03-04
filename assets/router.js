const VALID_ROUTES = new Set(["menu", "game", "manage"]);

function setPanelState(panel, isActive) {
  if (!panel) return;
  panel.classList.toggle("panel--active", isActive);
  panel.toggleAttribute("hidden", !isActive);
  panel.setAttribute("aria-hidden", String(!isActive));
}

export function parseRoute() {
  const rawHash = window.location.hash || "#/menu";
  const cleanedHash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  const [pathPart, queryString = ""] = cleanedHash.split("?");
  const normalizedPath = pathPart.startsWith("/") ? pathPart.slice(1) : pathPart;
  const route = VALID_ROUTES.has(normalizedPath) ? normalizedPath : "menu";
  const params = new URLSearchParams(queryString);
  return { route, params };
}

export function navigate(route) {
  const targetRoute = VALID_ROUTES.has(route) ? route : "menu";
  const nextHash = `#/${targetRoute}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
    return;
  }
  renderRoute();
}

export function renderRoute() {
  const { route } = parseRoute();

  const menuScreen = document.getElementById("screen-menu");
  const gameScreen = document.getElementById("screen-game");
  const manageScreen = document.getElementById("screen-manage");

  if (menuScreen) menuScreen.hidden = route !== "menu";
  if (gameScreen) gameScreen.hidden = route !== "game";
  if (manageScreen) manageScreen.hidden = route !== "manage";

  const modeSelectionPanel = document.getElementById("mode-selection");
  const speedQuizMenuPanel = document.getElementById("speedquiz-menu");
  const menuPanel = document.getElementById("menu");
  const gamePanel = document.getElementById("game");

  if (route === "menu") {
    setPanelState(modeSelectionPanel, false);
    setPanelState(speedQuizMenuPanel, false);
    setPanelState(menuPanel, true);
    setPanelState(gamePanel, false);
    document.body.classList.remove("game-active");
  }

  if (route === "game") {
    setPanelState(modeSelectionPanel, false);
    setPanelState(speedQuizMenuPanel, false);
    setPanelState(menuPanel, false);
    setPanelState(gamePanel, true);
    document.body.classList.add("game-active");
  }

  if (route === "manage") {
    setPanelState(modeSelectionPanel, false);
    setPanelState(speedQuizMenuPanel, false);
    setPanelState(menuPanel, false);
    setPanelState(gamePanel, false);
    document.body.classList.remove("game-active");
  }

  window.dispatchEvent(new CustomEvent("app:route-changed", { detail: { route } }));
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash || window.location.hash === "#") {
    navigate("menu");
    return;
  }
  renderRoute();
});
