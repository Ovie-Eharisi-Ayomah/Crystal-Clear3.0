import { supabase } from './supabase';

interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Creates a new session for the user
 */
export async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      ip_address: null, // We can't get this in the browser
      user_agent: navigator.userAgent
    })
    .select()
    .single();

  if (error) throw error;
  return data as Session;
}

/**
 * Gets all active sessions for the current user
 */
export async function getUserSessions(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Session[];
}

/**
 * Deletes a specific session
 */
export async function deleteSession(sessionId: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

/**
 * Deletes all sessions for the current user except the current one
 */
export async function deleteOtherSessions(currentSessionId: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .neq('id', currentSessionId);

  if (error) throw error;
}