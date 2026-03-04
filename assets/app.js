import { getSession, listenAuthChanges, loginWithOtp, logout } from "./auth.js";

const emailInput = document.querySelector("#auth-email");
const loginButton = document.querySelector("#auth-login");
const logoutButton = document.querySelector("#auth-logout");
const loggedInText = document.querySelector("#auth-user");
const authStatus = document.querySelector("#auth-status");
const authHint = document.querySelector("#auth-hint");

function setAuthUi(session) {
  const isLoggedIn = Boolean(session?.user?.email);

  authHint.textContent = "";

  if (isLoggedIn) {
    loginButton.hidden = true;
    emailInput.hidden = true;
    logoutButton.hidden = false;
    loggedInText.hidden = false;
    loggedInText.textContent = `Eingeloggt als ${session.user.email}`;
    authStatus.textContent = "Du bist eingeloggt.";
    return;
  }

  loginButton.hidden = false;
  emailInput.hidden = false;
  logoutButton.hidden = true;
  loggedInText.hidden = true;
  loggedInText.textContent = "";
  authStatus.textContent = "Du bist nicht eingeloggt.";
}

loginButton?.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    alert("Bitte gib eine E-Mail-Adresse ein.");
    return;
  }

  try {
    await loginWithOtp(email);
    authHint.textContent = "Check deine E-Mail";
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

logoutButton?.addEventListener("click", async () => {
  try {
    await logout();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

(async function initAuthUi() {
  try {
    const session = await getSession();
    setAuthUi(session);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  const subscription = listenAuthChanges((session) => {
    setAuthUi(session);
  });

  window.addEventListener("beforeunload", () => {
    subscription.unsubscribe();
  });
})();
