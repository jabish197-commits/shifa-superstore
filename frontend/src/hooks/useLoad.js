import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api';
import { catalogueCache } from '../services/catalogueCache';

export default function useLoad(url, { cacheKey } = {}) {
  const [data, setData] = useState(() => cacheKey ? catalogueCache.peek(cacheKey) ?? null : null);
  const [loading, setLoading] = useState(() => !cacheKey || catalogueCache.peek(cacheKey) === undefined);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    if (cacheKey) {
      let active = true;
      const hit = version === 0 ? catalogueCache.peek(cacheKey) : undefined;
      setData(hit ?? null);
      setLoading(hit === undefined);
      setError('');
      catalogueCache.load(cacheKey, () => api.get(url).then(({ data }) => data), version > 0)
        .then((data) => { if (active) setData(data); })
        .catch((err) => { if (active) setError(errorMessage(err)); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .get(url, { signal: controller.signal })
      .then(({ data }) => setData(data))
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url, version, cacheKey]);
  return { data, loading, error, reload };
}
