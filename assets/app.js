import { logout } from "./auth.js";
import { initAuthState } from "./authState.js";

const AUTH_MODE_EVENT = "thinkaroo:auth-mode-change";

const authActionButton = document.querySelector("#auth-action");
const authStatus = document.querySelector("#auth-status");
const authActionIcon = authActionButton?.querySelector("img");

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
    authActionButton?.classList.remove("auth-icon-button--logged-out");
    authActionButton?.classList.add("auth-icon-button--logged-in");
    authActionButton?.setAttribute("aria-label", "Logout");
    authActionButton?.setAttribute("title", "Logout");
    authActionIcon?.setAttribute("src", "./logout.svg");
    authActionIcon?.setAttribute("alt", "Logout");
    authStatus.textContent = `Eingeloggt als ${session.user.email}`;
    return;
  }

  authActionButton?.classList.add("auth-icon-button--logged-out");
  authActionButton?.classList.remove("auth-icon-button--logged-in");
  authActionButton?.setAttribute("aria-label", "Login öffnen");
  authActionButton?.setAttribute("title", "Login");
  authActionIcon?.setAttribute("src", "./login.svg");
  authActionIcon?.setAttribute("alt", "Login");
  authStatus.textContent = "Du bist nicht eingeloggt.";
}

authActionButton?.addEventListener("click", async () => {
  const isLoggedIn = Boolean(window.THINKAROO_AUTH?.isLoggedIn);

  if (!isLoggedIn) {
    navigateToLogin();
    return;
  }

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
