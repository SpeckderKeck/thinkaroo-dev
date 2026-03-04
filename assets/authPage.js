import {
  getSession,
  listenAuthChanges,
  loginWithPassword,
  registerWithPassword,
} from "./auth.js";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginEmail = document.querySelector("#login-email");
const password = document.querySelector("#login-password");
const registerEmail = document.querySelector("#register-email");
const registerPassword = document.querySelector("#register-password");
const statusText = document.querySelector("#auth-page-status");
const hintText = document.querySelector("#auth-page-hint");
const backLink = document.querySelector(".auth-back-link");

function getFallbackUrl() {
  const fallback = new URL(window.location.href);
  fallback.hash = "#/menu";
  fallback.pathname = fallback.pathname.replace(/auth\.html$/, "index.html");
  fallback.search = "";
  return fallback.href;
}

function getReturnTo() {
  const query = new URLSearchParams(window.location.search);
  return query.get("returnTo") || "";
}

function getRedirectTarget() {
  const returnTo = getReturnTo();
  return returnTo || getFallbackUrl();
}

function redirectToTarget() {
  window.location.href = getRedirectTarget();
}

function setStatus(session) {
  const isLoggedIn = Boolean(session?.user?.email);
  if (statusText) {
    statusText.textContent = isLoggedIn ? "Du bist eingeloggt." : "Du bist nicht eingeloggt.";
  }
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await loginWithPassword(loginEmail.value.trim(), password.value);
    hintText.textContent = "Login erfolgreich";
    redirectToTarget();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await registerWithPassword(registerEmail.value.trim(), registerPassword.value);
    hintText.textContent = "Account erstellt";
    redirectToTarget();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

(function setInitialModeFromQuery() {
  const query = new URLSearchParams(window.location.search);
  const mode = query.get("mode");

  if (mode === "register") {
    registerEmail?.focus();
  } else {
    loginEmail?.focus();
  }
})();

(function setBackLink() {
  if (!backLink) return;
  backLink.href = getRedirectTarget();
})();

(async function initAuthPage() {
  try {
    const session = await getSession();
    setStatus(session);
    if (session) {
      redirectToTarget();
      return;
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  const subscription = listenAuthChanges((session) => {
    setStatus(session);
    if (session) {
      redirectToTarget();
    }
  });

  window.addEventListener("beforeunload", () => {
    subscription.unsubscribe();
  });
})();
