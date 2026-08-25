import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const getStoredAccessToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

export const clearStoredAuthData = () => supabase.auth.signOut();

export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: metadata.full_name || metadata.fullName || '' } },
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
};

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

export const resetPasswordForEmail = async (email, redirectTo) => {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
};

export const updatePassword = async (newPassword) => {
  return supabase.auth.updateUser({ password: newPassword });
};

export const refreshAccessToken = async () => {
  const { data: { session } } = await supabase.auth.refreshSession();
  return session?.access_token ?? null;
};