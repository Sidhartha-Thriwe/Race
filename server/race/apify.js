const BASE = "https://api.apify.com/v2";
const pathId = (actor) => actor.replace("/", "~");
function apifyConfigured() {
  return Boolean(process.env.APIFY_TOKEN);
}
async function call(path, init) {
  const token = process.env.APIFY_TOKEN;
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}token=${token}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers ?? {} },
    signal: AbortSignal.timeout(6e4)
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Apify ${res.status}: ${body?.error?.message ?? res.statusText}`);
  }
  return body?.data ?? body;
}
async function runActor(opts) {
  const started = Date.now();
  const deadline = started + (opts.timeoutMs ?? 10 * 6e4);
  if (!apifyConfigured()) {
    return {
      ok: false,
      status: "not_configured",
      itemCount: 0,
      items: [],
      error: "APIFY_TOKEN is not set"
    };
  }
  try {
    const run = await call(`/acts/${pathId(opts.actor)}/runs`, {
      method: "POST",
      body: JSON.stringify(opts.input)
    });
    let state = run;
    while (["READY", "RUNNING"].includes(state.status)) {
      if (Date.now() > deadline) {
        return {
          ok: false,
          status: "timed_out",
          itemCount: 0,
          items: [],
          runId: run.id,
          durationMs: Date.now() - started,
          error: `still ${state.status} after ${Math.round((Date.now() - started) / 1e3)}s`
        };
      }
      opts.onProgress?.(state.status);
      await new Promise((r) => setTimeout(r, 5e3));
      state = await call(`/actor-runs/${run.id}`);
    }
    if (state.status !== "SUCCEEDED") {
      return {
        ok: false,
        status: state.status,
        itemCount: 0,
        items: [],
        runId: run.id,
        durationMs: Date.now() - started,
        costUSD: state.usageTotalUsd,
        error: `actor finished ${state.status}`
      };
    }
    const items = await call(
      `/datasets/${state.defaultDatasetId}/items?limit=${opts.maxItems}&clean=true`
    );
    return {
      ok: true,
      status: state.status,
      itemCount: Array.isArray(items) ? items.length : 0,
      items: Array.isArray(items) ? items : [],
      costUSD: state.usageTotalUsd,
      runId: run.id,
      datasetId: state.defaultDatasetId,
      durationMs: Date.now() - started
    };
  } catch (e) {
    return {
      ok: false,
      status: "error",
      itemCount: 0,
      items: [],
      durationMs: Date.now() - started,
      error: `${e?.name ?? "Error"}: ${e?.message ?? String(e)}`
    };
  }
}
export {
  apifyConfigured,
  runActor
};
