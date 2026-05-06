import { supabase } from "./supabaseClient.js";

function buildAuthError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function loginWithPassword(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function registerWithPassword(email, password, username = "") {
  const options = {};
  if (username) {
    options.data = { username };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options,
  });

  if (error) {
    throw error;
  }

  const identities = data?.user?.identities;
  if (Array.isArray(identities) && identities.length === 0) {
    throw buildAuthError("Diese E-Mail-Adresse ist bereits registriert.", "email_already_registered");
  }
}

export async function resolveEmailByUsername(username) {
  const { data, error } = await supabase.rpc("get_email_by_username", { lookup_username: username });
  if (error || !data) return null;
  return data;
}

export async function verifyCurrentPassword(currentPassword) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) throw new Error("Keine aktive Sitzung.");
  const { error } = await supabase.auth.signInWithPassword({
    email: session.user.email,
    password: currentPassword,
  });
  if (error) throw buildAuthError("Aktuelles Passwort ist falsch.", "invalid_password");
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function updateEmail(newEmail) {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
}

export async function updateUsername(newUsername) {
  const { error } = await supabase.auth.updateUser({
    data: { username: newUsername },
  });
  if (error) throw error;
}

export async function deleteAccount() {
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
  await supabase.auth.signOut();
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export function listenAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return data.subscription;
}
