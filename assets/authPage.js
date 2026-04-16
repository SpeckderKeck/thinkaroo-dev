import { loginWithPassword, registerWithPassword } from "./auth.js";
import { initAuthState } from "./authState.js";

const AUTH_MODE_EVENT = "thinkaroo:auth-mode-change";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginEmail = document.querySelector("#login-email");
const password = document.querySelector("#login-password");
const registerEmail = document.querySelector("#register-email");
const registerPassword = document.querySelector("#register-password");
const loginEmailError = document.querySelector("#login-email-error");
const loginPasswordError = document.querySelector("#login-password-error");
const registerEmailError = document.querySelector("#register-email-error");
const registerPasswordError = document.querySelector("#register-password-error");
const loginFeedback = document.querySelector("#login-feedback");
const registerFeedback = document.querySelector("#register-feedback");
const statusText = document.querySelector("#auth-page-status") ?? document.querySelector("#auth-status");
const hintText = document.querySelector("#auth-page-hint");

function clearError(field, errorElement) {
  if (!field || !errorElement) {
    return;
  }
  field.classList.remove("is-invalid");
  errorElement.textContent = "";
}

function setFieldError(field, errorElement, message) {
  if (!field || !errorElement) {
    return;
  }
  field.classList.add("is-invalid");
  errorElement.textContent = message;
}

function setFeedback(element, message, type = "info") {
  if (!element) {
    return;
  }
  element.textContent = message;
  element.classList.remove("is-error", "is-success");
  if (type === "error") {
    element.classList.add("is-error");
  }
  if (type === "success") {
    element.classList.add("is-success");
  }
}

function validateEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clearLoginState() {
  clearError(loginEmail, loginEmailError);
  clearError(password, loginPasswordError);
  setFeedback(loginFeedback, "");
}

function clearRegisterState() {
  clearError(registerEmail, registerEmailError);
  clearError(registerPassword, registerPasswordError);
  setFeedback(registerFeedback, "");
}

function validateLoginInputs() {
  const email = loginEmail?.value?.trim() ?? "";
  const userPassword = password?.value ?? "";
  let valid = true;

  clearLoginState();
  if (!email) {
    setFieldError(loginEmail, loginEmailError, "Bitte gib deine E-Mail-Adresse ein.");
    valid = false;
  } else if (!validateEmailAddress(email)) {
    setFieldError(loginEmail, loginEmailError, "Bitte gib eine gültige E-Mail-Adresse ein.");
    valid = false;
  }

  if (!userPassword) {
    setFieldError(password, loginPasswordError, "Bitte gib dein Passwort ein.");
    valid = false;
  }

  return valid;
}

function validateRegisterInputs() {
  const email = registerEmail?.value?.trim() ?? "";
  const userPassword = registerPassword?.value ?? "";
  let valid = true;

  clearRegisterState();
  if (!email) {
    setFieldError(registerEmail, registerEmailError, "Bitte gib deine E-Mail-Adresse ein.");
    valid = false;
  } else if (!validateEmailAddress(email)) {
    setFieldError(registerEmail, registerEmailError, "Bitte gib eine gültige E-Mail-Adresse ein.");
    valid = false;
  }

  if (!userPassword) {
    setFieldError(registerPassword, registerPasswordError, "Bitte gib ein Passwort ein.");
    valid = false;
  } else if (userPassword.length < 8) {
    setFieldError(registerPassword, registerPasswordError, "Das Passwort muss mindestens 8 Zeichen lang sein.");
    valid = false;
  }

  return valid;
}

function mapAuthError(error, mode) {
  const code = String(error?.code ?? "").toLowerCase();
  const message = String(error?.message ?? "").toLowerCase();

  if (mode === "register") {
    if (code === "email_already_registered" || message.includes("already registered")) {
      return {
        email: "Diese E-Mail-Adresse ist bereits registriert.",
      };
    }
    if (message.includes("password should be at least")) {
      return {
        password: "Das Passwort ist zu kurz. Verwende mindestens 8 Zeichen.",
      };
    }
  }

  if (mode === "login") {
    if (message.includes("invalid login credentials")) {
      return {
        password: "Falsche E-Mail oder falsches Passwort.",
      };
    }
    if (message.includes("email not confirmed")) {
      return {
        email: "Bitte bestätige zuerst deine E-Mail-Adresse.",
      };
    }
  }

  return {
    generic: "Anmeldung derzeit nicht möglich. Bitte versuche es erneut.",
  };
}

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
    if (!validateLoginInputs()) {
      setFeedback(loginFeedback, "Bitte korrigiere die markierten Felder.", "error");
      return;
    }

    const button = loginForm.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = "Login läuft …";
    }
    try {
      await loginWithPassword(loginEmail.value.trim(), password.value);
      setFeedback(loginFeedback, "Login erfolgreich. Weiterleitung …", "success");
      hintText.textContent = "Login erfolgreich";
      routeToSelect();
    } catch (error) {
      console.error(error);
      const friendlyError = mapAuthError(error, "login");
      if (friendlyError.email) {
        setFieldError(loginEmail, loginEmailError, friendlyError.email);
      }
      if (friendlyError.password) {
        setFieldError(password, loginPasswordError, friendlyError.password);
      }
      setFeedback(loginFeedback, friendlyError.generic ?? "Login fehlgeschlagen.", "error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Login";
      }
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateRegisterInputs()) {
      setFeedback(registerFeedback, "Bitte korrigiere die markierten Felder.", "error");
      return;
    }

    const button = registerForm.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = "Registrierung läuft …";
    }
    try {
      await registerWithPassword(registerEmail.value.trim(), registerPassword.value);
      setFeedback(registerFeedback, "Account erstellt. Du wirst weitergeleitet …", "success");
      hintText.textContent = "Account erstellt";
      routeToSelect();
    } catch (error) {
      console.error(error);
      const friendlyError = mapAuthError(error, "register");
      if (friendlyError.email) {
        setFieldError(registerEmail, registerEmailError, friendlyError.email);
      }
      if (friendlyError.password) {
        setFieldError(registerPassword, registerPasswordError, friendlyError.password);
      }
      setFeedback(registerFeedback, friendlyError.generic ?? "Registrierung fehlgeschlagen.", "error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Registrierung";
      }
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
