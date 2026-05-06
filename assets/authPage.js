import { loginWithPassword, registerWithPassword, resolveEmailByUsername, verifyCurrentPassword, updatePassword, updateEmail, updateUsername, deleteAccount } from "./auth.js";
import { initAuthState } from "./authState.js";

const AUTH_MODE_EVENT = "thinkaroo:auth-mode-change";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginEmail = document.querySelector("#login-email");
const password = document.querySelector("#login-password");
const registerUsername = document.querySelector("#register-username");
const registerEmail = document.querySelector("#register-email");
const registerPassword = document.querySelector("#register-password");
const registerUsernameError = document.querySelector("#register-username-error");
const loginFeedback = document.querySelector("#login-feedback");
const registerFeedback = document.querySelector("#register-feedback");
const statusText = document.querySelector("#auth-page-status") ?? document.querySelector("#auth-status");
const hintText = document.querySelector("#auth-page-hint");

// Account page elements
const accountUsernameForm = document.querySelector("#account-username-form");
const accountUsernameInput = document.querySelector("#account-username");
const accountUsernameFeedback = document.querySelector("#account-username-feedback");
const accountCurrentUsername = document.querySelector("#account-current-username");
const accountPasswordForm = document.querySelector("#account-password-form");
const accountCurrentPassword = document.querySelector("#account-current-password");
const accountNewPassword = document.querySelector("#account-new-password");
const accountConfirmPassword = document.querySelector("#account-confirm-password");
const accountPasswordFeedback = document.querySelector("#account-password-feedback");
const accountEmailForm = document.querySelector("#account-email-form");
const accountCurrentEmail = document.querySelector("#account-current-email");
const accountNewEmail = document.querySelector("#account-new-email");
const accountEmailFeedback = document.querySelector("#account-email-feedback");
const accountDeleteBtn = document.querySelector("#account-delete-btn");
const accountDeleteFeedback = document.querySelector("#account-delete-feedback");

function setFeedback(element, message, type = "info") {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("is-error", "is-success");
  if (type === "error") element.classList.add("is-error");
  if (type === "success") element.classList.add("is-success");
}

function validateEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function mapAuthError(error, mode) {
  const code = String(error?.code ?? "").toLowerCase();
  const message = String(error?.message ?? "").toLowerCase();

  if (mode === "register") {
    if (code === "email_already_registered" || message.includes("already registered")) {
      return { generic: "Diese E-Mail-Adresse ist bereits registriert." };
    }
    if (message.includes("password should be at least")) {
      return { generic: "Das Passwort ist zu kurz. Verwende mindestens 8 Zeichen." };
    }
  }

  if (mode === "login") {
    if (message.includes("invalid login credentials")) {
      return { generic: "Falsche Anmeldedaten. Bitte überprüfe E-Mail/Benutzername und Passwort." };
    }
    if (message.includes("email not confirmed")) {
      return { generic: "Bitte bestätige zuerst deine E-Mail-Adresse." };
    }
  }

  return { generic: "Anmeldung derzeit nicht möglich. Bitte versuche es erneut." };
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

// ===== Login (email or username) =====
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const identifier = loginEmail?.value?.trim() ?? "";
    const userPassword = password?.value ?? "";

    if (!identifier || !userPassword) {
      setFeedback(loginFeedback, "Bitte fülle alle Felder aus.", "error");
      return;
    }

    const button = loginForm.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = "Login läuft …"; }

    try {
      let email = identifier;
      // If it's not an email, resolve username to email
      if (!validateEmailAddress(identifier)) {
        const resolved = await resolveEmailByUsername(identifier);
        if (!resolved) {
          setFeedback(loginFeedback, "Benutzername nicht gefunden.", "error");
          return;
        }
        email = resolved;
      }
      await loginWithPassword(email, userPassword);
      setFeedback(loginFeedback, "Login erfolgreich. Weiterleitung …", "success");
      if (hintText) hintText.textContent = "Login erfolgreich";
      routeToSelect();
    } catch (error) {
      console.error(error);
      const friendly = mapAuthError(error, "login");
      setFeedback(loginFeedback, friendly.generic ?? "Login fehlgeschlagen.", "error");
    } finally {
      if (button) { button.disabled = false; button.textContent = "Login"; }
    }
  });
}

// ===== Registration (with username) =====
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = registerUsername?.value?.trim() ?? "";
    const email = registerEmail?.value?.trim() ?? "";
    const userPassword = registerPassword?.value ?? "";

    if (!username || username.length < 3) {
      setFeedback(registerFeedback, "Benutzername muss mindestens 3 Zeichen lang sein.", "error");
      return;
    }
    if (!email || !validateEmailAddress(email)) {
      setFeedback(registerFeedback, "Bitte gib eine gültige E-Mail-Adresse ein.", "error");
      return;
    }
    if (!userPassword || userPassword.length < 8) {
      setFeedback(registerFeedback, "Das Passwort muss mindestens 8 Zeichen lang sein.", "error");
      return;
    }

    const button = registerForm.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = "Registrierung läuft …"; }

    try {
      await registerWithPassword(email, userPassword, username);
      setFeedback(registerFeedback, "Account erstellt. Du wirst weitergeleitet …", "success");
      if (hintText) hintText.textContent = "Account erstellt";
      routeToSelect();
    } catch (error) {
      console.error(error);
      const friendly = mapAuthError(error, "register");
      setFeedback(registerFeedback, friendly.generic ?? "Registrierung fehlgeschlagen.", "error");
    } finally {
      if (button) { button.disabled = false; button.textContent = "Registrierung"; }
    }
  });
}

// ===== Account: Change Username =====
if (accountUsernameForm) {
  accountUsernameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newName = accountUsernameInput?.value?.trim() ?? "";
    if (!newName || newName.length < 3) {
      setFeedback(accountUsernameFeedback, "Benutzername muss mindestens 3 Zeichen lang sein.", "error");
      return;
    }
    const button = accountUsernameForm.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; }
    try {
      await updateUsername(newName);
      setFeedback(accountUsernameFeedback, "Benutzername geändert.", "success");
    } catch (error) {
      setFeedback(accountUsernameFeedback, error?.message || "Fehler beim Ändern.", "error");
    } finally {
      if (button) button.disabled = false;
    }
  });
}

// ===== Account: Change Password =====
if (accountPasswordForm) {
  accountPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentPw = accountCurrentPassword?.value ?? "";
    const newPw = accountNewPassword?.value ?? "";
    const confirmPw = accountConfirmPassword?.value ?? "";
    if (!currentPw) {
      setFeedback(accountPasswordFeedback, "Bitte gib dein aktuelles Passwort ein.", "error");
      return;
    }
    if (newPw.length < 8) {
      setFeedback(accountPasswordFeedback, "Neues Passwort muss mindestens 8 Zeichen lang sein.", "error");
      return;
    }
    if (newPw !== confirmPw) {
      setFeedback(accountPasswordFeedback, "Passwörter stimmen nicht überein.", "error");
      return;
    }
    const button = accountPasswordForm.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; }
    try {
      await verifyCurrentPassword(currentPw);
      await updatePassword(newPw);
      setFeedback(accountPasswordFeedback, "Passwort geändert.", "success");
      if (accountCurrentPassword) accountCurrentPassword.value = "";
      if (accountNewPassword) accountNewPassword.value = "";
      if (accountConfirmPassword) accountConfirmPassword.value = "";
    } catch (error) {
      setFeedback(accountPasswordFeedback, error?.message || "Fehler beim Ändern.", "error");
    } finally {
      if (button) button.disabled = false;
    }
  });
}

// ===== Account: Change Email =====
const accountConfirmEmail = document.querySelector("#account-confirm-email");
if (accountEmailForm) {
  accountEmailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newEmail = accountNewEmail?.value?.trim() ?? "";
    const confirmEmail = accountConfirmEmail?.value?.trim() ?? "";
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setFeedback(accountEmailFeedback, "Bitte gib eine gültige E-Mail-Adresse ein.", "error");
      return;
    }
    if (newEmail !== confirmEmail) {
      setFeedback(accountEmailFeedback, "E-Mail-Adressen stimmen nicht überein.", "error");
      return;
    }
    const button = accountEmailForm.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; }
    try {
      await updateEmail(newEmail);
      setFeedback(accountEmailFeedback, "Bestätigungslink wurde an die neue Adresse gesendet.", "success");
    } catch (error) {
      setFeedback(accountEmailFeedback, error?.message || "Fehler beim Ändern.", "error");
    } finally {
      if (button) button.disabled = false;
    }
  });
}

// ===== Account: Delete Account =====
if (accountDeleteBtn) {
  accountDeleteBtn.addEventListener("click", async () => {
    if (!confirm("Konto wirklich unwiderruflich löschen? Alle Daten gehen verloren.")) return;
    accountDeleteBtn.disabled = true;
    try {
      await deleteAccount();
      setFeedback(accountDeleteFeedback, "Konto gelöscht. Du wirst abgemeldet …", "success");
      setTimeout(() => { window.location.href = "./index.html"; }, 1500);
    } catch (error) {
      setFeedback(accountDeleteFeedback, error?.message || "Fehler beim Löschen.", "error");
      accountDeleteBtn.disabled = false;
    }
  });
}

// ===== Init =====
(async function initAuthPage() {
  if (!loginForm && !registerForm && !accountUsernameForm) return;

  try {
    const authState = await initAuthState();
    setStatus(authState.session);
    const user = authState.session?.user;
    // Display current username
    if (accountCurrentUsername) {
      accountCurrentUsername.textContent = user?.user_metadata?.username || "–";
    }
    // Pre-fill account username
    if (accountUsernameInput && user?.user_metadata?.username) {
      accountUsernameInput.value = user.user_metadata.username;
    }
    // Display current email
    if (accountCurrentEmail) {
      accountCurrentEmail.textContent = user?.email || "–";
    }
  } catch (error) {
    console.error(error);
  }

  window.addEventListener(AUTH_MODE_EVENT, (event) => {
    const session = event.detail?.session ?? null;
    setStatus(session);
    if (session?.user?.email && loginForm) {
      routeToSelect();
    }
  });
})();
