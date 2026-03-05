import { logout } from "./auth.js";
import { initAuthState } from "./authState.js";

const AUTH_MODE_EVENT = "thinkaroo:auth-mode-change";

const loginActionButton = document.querySelector("#auth-login-action");
const logoutActionButton = document.querySelector("#auth-logout-action");
const authStatus = document.querySelector("#auth-status");

function dispatchAuthMode(isLoggedIn, session = null) {
  window.THINKAROO_AUTH = { isLoggedIn };
  window.dispatchEvent(new CustomEvent(AUTH_MODE_EVENT, { detail: { isLoggedIn, session } }));
}

function navigateToLogin() {
  if (window.thinkarooRouter?.setRoute) {
    window.thinkarooRouter.setRoute("#/login");
    return;
  }
  window.location.hash = "#/login";
}

function setAuthUi(session, { emit = true } = {}) {
  const isLoggedIn = Boolean(session?.user?.email);
  if (emit) {
    dispatchAuthMode(isLoggedIn, session ?? null);
  }

  if (isLoggedIn) {
    loginActionButton?.setAttribute("hidden", "");
    logoutActionButton?.removeAttribute("hidden");
    authStatus.textContent = `${session.user.email}`;
    return;
  }

  logoutActionButton?.setAttribute("hidden", "");
  loginActionButton?.removeAttribute("hidden");
  authStatus.textContent = "";
}

loginActionButton?.addEventListener("click", () => {
  navigateToLogin();
});

logoutActionButton?.addEventListener("click", async () => {
  try {
    await logout();
    setAuthUi(null);
    navigateToLogin();
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
    setAuthUi(event.detail?.session ?? null, { emit: false });
  });
})();
