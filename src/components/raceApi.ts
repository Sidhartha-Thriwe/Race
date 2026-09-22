/**
 * One place that talks to /api/race.
 *
 * It exists because of a specific failure: a backend route threw, Express
 * answered with the SPA's index.html instead of JSON, and the UI reported
 * `Unexpected token '<', "<!doctype"... is not valid JSON`. The real cause was
 * a Firestore collection missing from firestore.rules — a one-line fix that
 * took a detour through a meaningless error message.
 *
 * So: check what came back before parsing it, and when it is not JSON, say what
 * it actually was.
 */

export interface ApiError { error: string; hint?: string }

const headers = (): Record<string, string> => {
  const token = sessionStorage.getItem('race_token') ?? '';
  return { 'Content-Type': 'application/json', ...(token ? { 'x-race-token': token } : {}) };
};

export interface RaceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  /** Extra context for the error — what the server actually sent, or what to check. */
  hint?: string;
}

export async function raceFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<RaceResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? 'GET',
      headers: headers(),
      ...(init?.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
  } catch (e: any) {
    return { ok: false, error: `Could not reach the server: ${e?.message ?? e}` };
  }

  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) {
    // Almost always the SPA fallback answering an API request — which means the
    // route threw, or the path is wrong. Neither is a parse error, and saying
    // "invalid JSON" would send the reader down the wrong path entirely.
    const body = (await res.text().catch(() => '')).slice(0, 200);
    return {
      ok: false,
      error: `Server returned ${res.status} as ${type || 'an unknown type'}, not JSON.`,
      hint: body.trimStart().startsWith('<')
        ? 'The server sent an HTML page — the API route failed or does not exist. ' +
          'Check the server logs for the underlying error.'
        : body || undefined,
    };
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      error: (data as ApiError)?.error ?? `HTTP ${res.status}`,
      hint: (data as ApiError)?.hint,
    };
  }
  return { ok: true, data: data as T };
}
