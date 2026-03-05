import { supabase } from "./supabaseClient.js";

const AUTH_MODE_EVENT = "thinkaroo:auth-mode-change";

let session = null;
let isLoggedIn = false;
let authSubscription = null;

function dispatchAuthMode(nextIsLoggedIn, nextSession) {
  window.dispatchEvent(
    new CustomEvent(AUTH_MODE_EVENT, {
      detail: {
        isLoggedIn: nextIsLoggedIn,
        session: nextSession,
      },
    }),
  );
}

export function applyAuthMode(nextIsLoggedIn) {
  document.body?.setAttribute("data-auth-mode", nextIsLoggedIn ? "full" : "lite");

  const fullElements = document.querySelectorAll('[data-auth="full"]');
  const liteElements = document.querySelectorAll('[data-auth="lite"]');

  fullElements.forEach((element) => {
    element.hidden = !nextIsLoggedIn;
  });

  liteElements.forEach((element) => {
    element.hidden = nextIsLoggedIn;
  });
}

window.applyAuthMode = applyAuthMode;

export function getAuthState() {
  return { session, isLoggedIn };
}

export async function initAuthState() {
  if (window.__authUiInit) {
    return getAuthState();
  }

  window.__authUiInit = true;

  const goLoginButton = document.querySelector("#go-login");
  if (goLoginButton && !goLoginButton.dataset.authNavBound) {
    goLoginButton.addEventListener("click", () => {
      window.location.href = "./auth.html";
    });
    goLoginButton.dataset.authNavBound = "true";
  }

  try {
    const {
      data: { session: initialSession },
    } = await supabase.auth.getSession();

    session = initialSession;
    isLoggedIn = !!session;
    window.applyAuthMode(!!session);
    dispatchAuthMode(isLoggedIn, session);
  } catch (error) {
    console.error(error);
    applyAuthMode(false);
    dispatchAuthMode(false, null);
  }

  const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    isLoggedIn = !!nextSession;
    window.applyAuthMode(!!nextSession);
    dispatchAuthMode(isLoggedIn, nextSession);
    window.__authState = getAuthState();
  });

  authSubscription = data.subscription;
  window.__authState = getAuthState();

  return getAuthState();
}

window.addEventListener("beforeunload", () => {
  authSubscription?.unsubscribe();
});
