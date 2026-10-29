export function createCatalogueCache({ ttl = 30000, limit = 24, now = Date.now } = {}) {
  const entries = new Map();
  const pending = new Map();
  const peek = (key) => {
    const entry = entries.get(key);
    if (!entry || now() - entry.time >= ttl) return undefined;
    return entry.data;
  };
  const load = (key, fetcher, force = false) => {
    const hit = peek(key);
    if (!force && hit !== undefined) return Promise.resolve(hit);
    if (!force && pending.has(key)) return pending.get(key);
    const task = Promise.resolve().then(fetcher).then((data) => {
      if (pending.get(key) === task) {
        entries.delete(key);
        entries.set(key, { data, time: now() });
        while (entries.size > limit) entries.delete(entries.keys().next().value);
      }
      return data;
    }).finally(() => { if (pending.get(key) === task) pending.delete(key); });
    pending.set(key, task);
    return task;
  };
  return { peek, load };
}
export const catalogueCache = createCatalogueCache();