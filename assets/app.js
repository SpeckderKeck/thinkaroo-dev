import { logout } from "./auth.js";
import { supabase } from "./supabaseClient.js";

const AUTH_MODE_EVENT = "thinkaroo:auth-mode-change";

const loggedOutContainer = document.querySelector("#auth-left-logged-out");
const loggedInContainer = document.querySelector("#auth-left-logged-in");
const loginButton = document.querySelector("#auth-login");
const registerButton = document.querySelector("#auth-register");
const logoutButton = document.querySelector("#auth-logout");
const loggedInText = document.querySelector("#auth-user");
const authStatus = document.querySelector("#auth-status");

let isLoggedIn = false;

function applyAuthMode(nextIsLoggedIn) {
  document.querySelectorAll('[data-auth="full"]').forEach((element) => {
    element.hidden = !nextIsLoggedIn;
  });

  document.querySelectorAll('[data-auth="lite"]').forEach((element) => {
    element.hidden = nextIsLoggedIn;
  });
}

function dispatchAuthMode(nextIsLoggedIn) {
  window.THINKAROO_AUTH = { isLoggedIn: nextIsLoggedIn };
  window.dispatchEvent(
    new CustomEvent(AUTH_MODE_EVENT, {
      detail: { isLoggedIn: nextIsLoggedIn },
    }),
  );
}

function setAuthUi(session) {
  isLoggedIn = Boolean(session?.user?.email);
  applyAuthMode(isLoggedIn);
  dispatchAuthMode(isLoggedIn);

  if (isLoggedIn) {
    loggedOutContainer.hidden = true;
    loggedInContainer.hidden = false;
    loggedInText.textContent = `Eingeloggt als ${session.user.email}`;
    authStatus.textContent = "Du bist eingeloggt.";
    return;
  }

  loggedOutContainer.hidden = false;
  loggedInContainer.hidden = true;
  loggedInText.textContent = "";
  authStatus.textContent = "Du bist nicht eingeloggt.";
}

loginButton?.addEventListener("click", () => {
  window.location.href = "./auth.html?mode=login";
});

registerButton?.addEventListener("click", () => {
  window.location.href = "./auth.html?mode=register";
});

logoutButton?.addEventListener("click", async () => {
  try {
    await logout();
    applyAuthMode(false);
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
