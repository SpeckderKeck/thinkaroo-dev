import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://mqbokupviznrmnwvtwwe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xYm9rdXB2aXpucm1ud3Z0d3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzczNzYsImV4cCI6MjA4NzYxMzM3Nn0.dckhmcqrKAv8dYTxg6b4313OQs-uI2MCeWXPqfQr5HI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;
