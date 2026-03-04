import { loginWithPassword, registerWithPassword } from "./auth.js";
import { initAuthState } from "./authState.js";

const AUTH_MODE_EVENT = "thinkaroo:auth-mode-change";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginEmail = document.querySelector("#login-email");
const password = document.querySelector("#login-password");
const registerEmail = document.querySelector("#register-email");
const registerPassword = document.querySelector("#register-password");
const statusText = document.querySelector("#auth-page-status") ?? document.querySelector("#auth-status");
const hintText = document.querySelector("#auth-page-hint");

function getReturnTarget() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");
  if (typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return "./index.html#/select";
}

function routeToSelect() {
  if (window.thinkarooRouter?.setRoute) {
    window.thinkarooRouter.setRoute("#/select");
    return;
  }
  window.location.href = "./index.html#/select";
}

function setStatus(session) {
  const isLoggedIn = Boolean(session?.user?.email);
  if (statusText) {
    statusText.textContent = isLoggedIn ? "Vollmodus aktiv · Du bist eingeloggt." : "Lite-Modus aktiv · Du bist nicht eingeloggt.";
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      await loginWithPassword(loginEmail.value.trim(), password.value);
      hintText.textContent = "Login erfolgreich";
      routeToSelect();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      await registerWithPassword(registerEmail.value.trim(), registerPassword.value);
      hintText.textContent = "Account erstellt";
      routeToSelect();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}

(async function initAuthPage() {
  if (!loginForm && !registerForm) {
    return;
  }

  try {
    const authState = await initAuthState();
    setStatus(authState.session);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  window.addEventListener(AUTH_MODE_EVENT, (event) => {
    const session = event.detail?.session ?? null;
    setStatus(session);
    if (session?.user?.email) {
      window.location.href = getReturnTarget();
    }
  });
})();
