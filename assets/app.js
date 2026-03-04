import { logout } from "./auth.js";
import { initAuthState } from "./authState.js";

const AUTH_MODE_EVENT = "thinkaroo:auth-mode-change";

const loginButton = document.querySelector("#auth-login");
const logoutButton = document.querySelector("#auth-logout");
const authStatus = document.querySelector("#auth-status");

function dispatchAuthMode(isLoggedIn) {
  window.THINKAROO_AUTH = { isLoggedIn };
  window.dispatchEvent(new CustomEvent(AUTH_MODE_EVENT, { detail: { isLoggedIn } }));
}

function navigateToLogin() {
  if (window.thinkarooRouter?.setRoute) {
    window.thinkarooRouter.setRoute("#/login");
    return;
  }
  window.location.hash = "#/login";
}

function setAuthUi(session) {
  const isLoggedIn = Boolean(session?.user?.email);
  dispatchAuthMode(isLoggedIn);

  if (isLoggedIn) {
    loginButton.hidden = true;
    logoutButton.hidden = false;
    authStatus.textContent = `Eingeloggt als ${session.user.email}`;
    return;
  }

  loginButton.hidden = false;
  logoutButton.hidden = true;
  authStatus.textContent = "Du bist nicht eingeloggt.";
}

loginButton?.addEventListener("click", navigateToLogin);

logoutButton?.addEventListener("click", async () => {
  try {
    await logout();
    dispatchAuthMode(false);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

(async function initAuthUi() {
  try {
    const authState = await initAuthState();
    setAuthUi(authState.session);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  window.addEventListener(AUTH_MODE_EVENT, (event) => {
    setAuthUi(event.detail?.session ?? null);
  });
})();
