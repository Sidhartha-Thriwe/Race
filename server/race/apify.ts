/**
 * The Apify half of the host. Starts an actor, waits for it, reads the items
 * and the actual cost.
 *
 * Kept deliberately thin — it moves bytes and reports what happened. It holds
 * no opinion about what a result means. In particular it does NOT treat zero
 * items as an error, because a zero-item run is a real and meaningful state:
 * the account may be empty, or the actor may be broken, and only the caller
 * holds the context to tell those apart.
 */

const BASE = "https://api.apify.com/v2";

/** Apify's REST path uses username~actor-name, not username/actor-name. */
const pathId = (actor: string) => actor.replace("/", "~");

export interface ActorRunResult {
  ok: boolean;
  status: string;            // Apify run status, or a local failure marker
  itemCount: number;
  items: unknown[];
  costUSD?: number;
  runId?: string;
  datasetId?: string;
  durationMs?: number;
  error?: string;
}

export function apifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN);
}

async function call(path: string, init?: RequestInit): Promise<any> {
  const token = process.env.APIFY_TOKEN;
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}token=${token}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(60_000),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Apify ${res.status}: ${body?.error?.message ?? res.statusText}`);
  }
  return body?.data ?? body;
}

/**
 * Run one actor to completion.
 *
 * Async start plus polling rather than run-sync: actors routinely take minutes,
 * and the synchronous endpoint has its own limits that would turn a slow but
 * healthy run into a failure.
 */
export async function runActor(opts: {
  actor: string;
  input: Record<string, unknown>;
  maxItems: number;
  /** Give up waiting after this long. The run itself is not cancelled. */
  timeoutMs?: number;
  onProgress?: (status: string) => void;
}): Promise<ActorRunResult> {
  const started = Date.now();
  const deadline = started + (opts.timeoutMs ?? 10 * 60_000);

  if (!apifyConfigured()) {
    return { ok: false, status: "not_configured", itemCount: 0, items: [],
             error: "APIFY_TOKEN is not set" };
  }

  try {
    const run = await call(`/acts/${pathId(opts.actor)}/runs`, {
      method: "POST",
      body: JSON.stringify(opts.input),
    });

    let state = run;
    while (["READY", "RUNNING"].includes(state.status)) {
      if (Date.now() > deadline) {
        return { ok: false, status: "timed_out", itemCount: 0, items: [],
                 runId: run.id, durationMs: Date.now() - started,
                 error: `still ${state.status} after ${Math.round((Date.now() - started) / 1000)}s` };
      }
      opts.onProgress?.(state.status);
      await new Promise((r) => setTimeout(r, 5_000));
      state = await call(`/actor-runs/${run.id}`);
    }

    if (state.status !== "SUCCEEDED") {
      return {
        ok: false, status: state.status, itemCount: 0, items: [],
        runId: run.id, durationMs: Date.now() - started,
        costUSD: state.usageTotalUsd,
        error: `actor finished ${state.status}`,
      };
    }

    const items: unknown[] = await call(
      `/datasets/${state.defaultDatasetId}/items?limit=${opts.maxItems}&clean=true`,
    );

    return {
      ok: true,
      status: state.status,
      itemCount: Array.isArray(items) ? items.length : 0,
      items: Array.isArray(items) ? items : [],
      costUSD: state.usageTotalUsd,
      runId: run.id,
      datasetId: state.defaultDatasetId,
      durationMs: Date.now() - started,
    };
  } catch (e: any) {
    return {
      ok: false, status: "error", itemCount: 0, items: [],
      durationMs: Date.now() - started,
      error: `${e?.name ?? "Error"}: ${e?.message ?? String(e)}`,
    };
  }
}
