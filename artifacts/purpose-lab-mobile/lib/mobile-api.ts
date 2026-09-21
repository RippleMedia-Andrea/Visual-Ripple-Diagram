import { fetch } from 'expo/fetch';
import { getStoredToken } from '@/lib/auth-storage';

const domain = process.env.EXPO_PUBLIC_DOMAIN;
export const API_ORIGIN = domain ? `https://${domain}` : '';
export const PUBLIC_APP_ORIGIN = API_ORIGIN;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function authRequest(
  path: string,
  body?: Record<string, unknown>,
  token?: string | null,
): Promise<{ user?: AuthUser; token?: string }> {
  const response = await fetch(`${API_ORIGIN}/api/auth/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await response.json().catch(() => ({}))) as {
    user?: AuthUser;
    token?: string;
    session?: { token?: string };
    message?: string;
    error?: { message?: string } | string;
  };
  if (!response.ok) {
    const nested = typeof data.error === 'object' ? data.error?.message : data.error;
    throw new Error(nested ?? data.message ?? 'Something went wrong. Please try again.');
  }
  const responseToken =
    response.headers.get('set-auth-token') ?? data.token ?? data.session?.token;
  return { user: data.user, token: responseToken };
}

export function signIn(email: string, password: string) {
  return authRequest('sign-in/email', { email, password });
}

export function signUp(name: string, email: string, password: string) {
  return authRequest('sign-up/email', { name, email, password });
}

export function requestPasswordReset(email: string) {
  return authRequest('request-password-reset', {
    email,
    redirectTo: `${PUBLIC_APP_ORIGIN}/reset-password`,
  });
}

export function signOut(token: string) {
  return authRequest('sign-out', {}, token);
}

export function deleteAccount(password: string, token: string) {
  return authRequest('delete-user', { password }, token);
}

export async function streamJourneyChat({
  journeyId,
  stage,
  messages,
  context,
  onChunk,
  saveUserMessage = true,
}: {
  journeyId: number;
  stage: string;
  messages: ChatMessage[];
  context: {
    selectedPrompts: string[];
    purposeStatement?: string;
  };
  onChunk: (chunk: string) => void;
  saveUserMessage?: boolean;
}): Promise<void> {
  const token = await getStoredToken();
  const response = await fetch(`${API_ORIGIN}/api/ripple/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ journeyId, stage, messages, context, saveUserMessage }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Your guide is unavailable right now.');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The response stream could not be opened.');
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6)) as { content?: string; error?: string };
        if (data.error) throw new Error(data.error);
        if (data.content) onChunk(data.content);
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
  }
}