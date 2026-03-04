import { getSession, listenAuthChanges, loginWithOtp } from "./auth.js";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginEmail = document.querySelector("#login-email");
const registerEmail = document.querySelector("#register-email");
const statusText = document.querySelector("#auth-page-status");
const hintText = document.querySelector("#auth-page-hint");

function setStatus(session) {
  const isLoggedIn = Boolean(session?.user?.email);
  if (statusText) {
    statusText.textContent = isLoggedIn ? "Du bist eingeloggt." : "Du bist nicht eingeloggt.";
  }
}

async function handleOtp(email, shouldCreateUser) {
  try {
    await loginWithOtp(email, shouldCreateUser);
    if (hintText) {
      hintText.textContent = "Check deine E-Mail";
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleOtp(loginEmail.value.trim(), false);
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleOtp(registerEmail.value.trim(), true);
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

(async function initAuthPage() {
  try {
    const session = await getSession();
    setStatus(session);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  const subscription = listenAuthChanges((session) => {
    setStatus(session);
  });

  window.addEventListener("beforeunload", () => {
    subscription.unsubscribe();
  });
})();
