function summarise(raw) {
  const accounts = [];
  const breachSources = /* @__PURE__ */ new Set();
  const perVendor = {};
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
          detail: row.platform === "google" && row.user_id ? `maps id ${row.user_id}` : void 0
        });
      }
    }
  }
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
        detail: spec.premium?.value ? "paid tier" : void 0
      });
    }
  }
  const bte = raw.behind_the_email?.data?.profile;
  if (bte && typeof bte === "object") {
    perVendor.behind_the_email = Object.keys(bte).length;
    for (const [provider, value] of Object.entries(bte)) {
      if (provider === "dataBreach") {
        for (const r of value?.results ?? []) {
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
              registered: true
            });
          }
        }
        continue;
      }
      if (provider === "summary") continue;
      accounts.push({
        platform: provider,
        vendor: "behind_the_email",
        registered: true,
        detail: value?.hasPlus ? "paid tier" : void 0
      });
    }
  }
  const byPlatform = /* @__PURE__ */ new Map();
  for (const a of accounts) {
    const key = a.platform.toLowerCase();
    const existing = byPlatform.get(key);
    if (!existing || !existing.detail && a.detail) byPlatform.set(key, a);
  }
  const merged = [...byPlatform.values()].sort((a, b) => a.platform.localeCompare(b.platform));
  return {
    accounts: merged,
    platformCount: merged.length,
    breachSources: [...breachSources].sort(),
    perVendor
  };
}
export {
  summarise
};
