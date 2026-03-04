import { logout } from "./auth.js";
import { supabase } from "./supabaseClient.js";

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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setAuthUi(session);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    setAuthUi(session);
  });

  window.addEventListener("beforeunload", () => {
    data.subscription.unsubscribe();
  });
})();
