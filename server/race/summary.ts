/**
 * A DISPLAY summary. Not the intake record, and not the RACE method.
 *
 * Read this before using it for anything: the real normalisation — guards,
 * vendor normalisers, merge, tiering, dormancy detection — lives in the skill's
 * resolve.py, and none of it runs here. This file exists so a screen has
 * something legible to show straight after the fetch: which platforms came
 * back, how many, and where the gaps are. It makes no claim about confidence,
 * tier or affinity, and nothing downstream should read it as if it did.
 *
 * Keep it dumb on purpose. The moment this starts inferring anything, the
 * method is in two places and only one of them is tested.
 */

export interface DisplayAccount {
  platform: string;
  vendor: string;
  registered?: boolean;
  detail?: string;
}

export interface DisplaySummary {
  accounts: DisplayAccount[];
  platformCount: number;
  breachSources: string[];
  perVendor: Record<string, number>;
}

export function summarise(raw: Record<string, any>): DisplaySummary {
  const accounts: DisplayAccount[] = [];
  const breachSources = new Set<string>();
  const perVendor: Record<string, number> = {};

  // Predicta — a flat array of per-platform objects; hibp rows are breaches.
  const predicta = raw.predicta;
  if (Array.isArray(predicta)) {
    perVendor.predicta = predicta.length;
    for (const row of predicta) {
      if (row?.platform === "hibp" || row?.source === "hibp") {
        if (row?.breach_name) breachSources.add(String(row.breach_name));
      } else if (row?.platform) {
        accounts.push({
          platform: String(row.platform),
          vendor: "predicta",
          registered: true,
          // The Google Maps contributor id is the one field skill 2 cannot work
          // without, so surface it rather than burying it in the raw blob.
          detail: row.platform === "google" && row.user_id ? `maps id ${row.user_id}` : undefined,
        });
      }
    }
  }

  // OSINT Industries — module objects; spec_format[0] is the normalised layer.
  const osint = raw.osint_industries;
  if (Array.isArray(osint)) {
    perVendor.osint_industries = osint.length;
    for (const mod of osint) {
      if (!mod?.module) continue;
      const spec = mod.spec_format?.[0] ?? {};
      const registered = spec.registered?.value;
      if (mod.module === "hibp") {
        if (mod.data?.breach_name) breachSources.add(String(mod.data.breach_name));
        continue;
      }
      accounts.push({
        platform: String(mod.module),
        vendor: "osint_industries",
        registered: registered !== false,
        detail: spec.premium?.value ? "paid tier" : undefined,
      });
    }
  }

  // Behind the Email — one nested object per provider.
  const bte = raw.behind_the_email?.data?.profile;
  if (bte && typeof bte === "object") {
    perVendor.behind_the_email = Object.keys(bte).length;
    for (const [provider, value] of Object.entries<any>(bte)) {
      if (provider === "dataBreach") {
        for (const r of value?.results ?? []) {
          // `source` is an OBJECT here — {name, date} — not a string. String()
          // on it produced the literal "[object Object]", which the screen then
          // displayed as a breach source. A value that means nothing rendered
          // as though it means something is this project's recurring bug in
          // miniature, so read the name and ignore the rest.
          const name = typeof r?.source === "string" ? r.source : r?.source?.name;
          if (name) breachSources.add(String(name));
        }
        continue;
      }
      if (provider === "registeredAccounts") {
        for (const acc of value?.accounts ?? []) {
          if (acc?.isRegistered) {
            accounts.push({
              platform: String(acc.formattedName ?? acc.name),
              vendor: "behind_the_email",
              registered: true,
            });
          }
        }
        continue;
      }
      // `summary` is the vendor's cross-provider roll-up, not a platform the
      // subject has an account on. Counting it inflated platformCount by one
      // and put a row called "summary" in the accounts list.
      if (provider === "summary") continue;
      accounts.push({
        platform: provider,
        vendor: "behind_the_email",
        registered: true,
        detail: value?.hasPlus ? "paid tier" : undefined,
      });
    }
  }

  // One row per platform, keeping the richest detail we saw for it.
  const byPlatform = new Map<string, DisplayAccount>();
  for (const a of accounts) {
    const key = a.platform.toLowerCase();
    const existing = byPlatform.get(key);
    if (!existing || (!existing.detail && a.detail)) byPlatform.set(key, a);
  }

  const merged = [...byPlatform.values()].sort((a, b) => a.platform.localeCompare(b.platform));
  return {
    accounts: merged,
    platformCount: merged.length,
    breachSources: [...breachSources].sort(),
    perVendor,
  };
}
