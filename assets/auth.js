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

export async function registerWithPassword(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  const identities = data?.user?.identities;
  if (Array.isArray(identities) && identities.length === 0) {
    throw buildAuthError("Diese E-Mail-Adresse ist bereits registriert.", "email_already_registered");
  }
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
