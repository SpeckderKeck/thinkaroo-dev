import { getSession, listenAuthChanges, logout } from "./auth.js";
import { navigate, parseRoute, renderRoute } from "./router.js";

let currentSession = null;

function getIndexUrl() {
  const { origin, pathname } = window.location;
  const basePath = pathname.endsWith("auth.html") ? pathname.replace(/auth\.html$/, "index.html") : pathname;
  return new URL(basePath, origin);
}

function buildAuthUrl(returnTo) {
  const indexUrl = getIndexUrl();
  const authUrl = new URL("auth.html", indexUrl);
  authUrl.searchParams.set("returnTo", returnTo);
  return authUrl.href;
}

function redirectToAuth() {
  window.location.href = buildAuthUrl(window.location.href);
}

function bindTopbarAuth() {
  const loginButton = document.getElementById("topbar-login");
  const logoutButton = document.getElementById("topbar-logout");

  loginButton?.addEventListener("click", () => {
    window.location.href = buildAuthUrl(window.location.href);
  });

  logoutButton?.addEventListener("click", async () => {
    try {
      await logout();
      navigate("menu");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}

function updateUI(session) {
  const isLoggedIn = Boolean(session?.user?.email);
  const topbarLogin = document.getElementById("topbar-login");
  const topbarUser = document.getElementById("topbar-user");
  const topbarEmail = document.getElementById("topbar-email");
  const manageButton = document.getElementById("manage-cta");
  const manageHint = document.getElementById("manage-cta-hint");

  if (topbarLogin) topbarLogin.hidden = isLoggedIn;
  if (topbarUser) topbarUser.hidden = !isLoggedIn;
  if (topbarEmail) topbarEmail.textContent = isLoggedIn ? session.user.email : "";

  if (manageButton) {
    manageButton.textContent = isLoggedIn ? "Meine Kartensets verwalten" : "Eigene Kartensets wählen";
  }

  if (manageHint) {
    manageHint.hidden = isLoggedIn;
  }
}

function installManageActions() {
  const manageButton = document.getElementById("manage-cta");
  const manageBackButton = document.getElementById("manage-back-menu");
  const mainMenuButton = document.getElementById("main-menu");
  const startGameButton = document.getElementById("start-game");

  manageButton?.addEventListener("click", () => {
    if (!currentSession) {
      redirectToAuth();
      return;
    }
    navigate("manage");
  });

  manageBackButton?.addEventListener("click", () => navigate("menu"));
  mainMenuButton?.addEventListener("click", () => navigate("menu"));
  startGameButton?.addEventListener("click", () => navigate("game"));
}

function installAuthGuard() {
  const { route } = parseRoute();
  if (route === "manage" && !currentSession) {
    redirectToAuth();
  }
}

(async function initAppShell() {
  bindTopbarAuth();
  installManageActions();

  try {
    currentSession = await getSession();
    updateUI(currentSession);
    installAuthGuard();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  listenAuthChanges((session) => {
    currentSession = session;
    updateUI(session);
    installAuthGuard();
  });

  window.addEventListener("app:route-changed", () => {
    installAuthGuard();
  });

  renderRoute();
})();
