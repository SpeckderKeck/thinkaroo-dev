import { getSession, listenAuthChanges, logout } from "./auth.js";

const loggedOutContainer = document.querySelector("#auth-left-logged-out");
const loggedInContainer = document.querySelector("#auth-left-logged-in");
const loginButton = document.querySelector("#auth-login");
const registerButton = document.querySelector("#auth-register");
const logoutButton = document.querySelector("#auth-logout");
const loggedInText = document.querySelector("#auth-user");
const authStatus = document.querySelector("#auth-status");

function setAuthUi(session) {
  const isLoggedIn = Boolean(session?.user?.email);

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
