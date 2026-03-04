import { supabase } from "./supabaseClient.js";

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
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
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
