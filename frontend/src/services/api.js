import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/';
export const tokenStore = {
  get: () => {
    try {
      return JSON.parse(sessionStorage.getItem('shifa-auth') || 'null');
    } catch {
      return null;
    }
  },
  set: (tokens) => sessionStorage.setItem('shifa-auth', JSON.stringify(tokens)),
  clear: () => {
    sessionStorage.removeItem('shifa-auth');
    window.dispatchEvent(new Event('shifa-signout'));
  },
};
const api = axios.create({ baseURL, timeout: 20000 });
api.interceptors.request.use((config) => {
  const token = tokenStore.get()?.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
let refreshing;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retried ||
      config.url?.includes('accounts/login') ||
      config.url?.includes('accounts/register')
    )
      throw error;
    const saved = tokenStore.get();
    if (!saved?.refresh) {
      tokenStore.clear();
      throw error;
    }
    config._retried = true;
    try {
      if (!refreshing)
        refreshing = axios
          .post(
            `${baseURL.replace(/\/$/, '')}/accounts/refresh/`,
            { refresh: saved.refresh },
            { timeout: 20000 },
          )
          .then(({ data }) => {
            const tokens = { access: data.access, refresh: data.refresh || saved.refresh };
            tokenStore.set(tokens);
            return tokens;
          })
          .finally(() => {
            refreshing = null;
          });
      const tokens = await refreshing;
      config.headers.Authorization = `Bearer ${tokens.access}`;
      return api(config);
    } catch (refreshError) {
      tokenStore.clear();
      throw refreshError;
    }
  },
);
export function errorMessage(error) {
  const data = error.response?.data;
  const flatten = (value) =>
    typeof value === 'string'
      ? value
      : Array.isArray(value)
        ? value.map(flatten).join(' ')
        : value && typeof value === 'object'
          ? Object.entries(value)
              .map(
                ([key, val]) =>
                  `${key === 'detail' || key === 'non_field_errors' ? '' : key.replaceAll('_', ' ') + ': '}${flatten(val)}`,
              )
              .join(' ')
          : '';
  return (
    flatten(data) ||
    (error.code === 'ECONNABORTED'
      ? 'The request timed out. Please try again.'
      : 'Could not reach the store. Please try again shortly.')
  );
}
export async function listAll(endpoint) {
  const items = [];
  let page = 1;
  while (true) {
    const { data } = await api.get(endpoint, { params: { page } });
    if (Array.isArray(data)) return data;
    items.push(...data.results);
    if (!data.next) return items;
    page += 1;
  }
}
export default api;
