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
const statusText = document.querySelector("#auth-page-status") ?? document.querySelector("#auth-status");
const hintText = document.querySelector("#auth-page-hint");

function getReturnTarget() {
  const query = new URLSearchParams(window.location.search);
  const returnTo = query.get("returnTo");
  if (!returnTo || !returnTo.startsWith("/")) {
    return "./index.html";
  }
  return `${window.location.origin}${returnTo}`;
}

function setStatus(session) {
  const isLoggedIn = Boolean(session?.user?.email);
  if (statusText) {
    statusText.textContent = isLoggedIn ? "Du bist eingeloggt." : "Du bist nicht eingeloggt.";
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
    const session = await getSession();
    setStatus(session);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  const subscription = listenAuthChanges((session) => {
    setStatus(session);
    if (session?.user?.email) {
      window.location.href = getReturnTarget();
    }
  });

  window.addEventListener("beforeunload", () => {
    subscription.unsubscribe();
  });
})();
