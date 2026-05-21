const SESSION_ID_KEY = 'llm_obs_session_id';

export function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  localStorage.setItem(SESSION_ID_KEY, generated);
  return generated;
}
