import { loadEnv, build } from 'vite';
const env = { ...loadEnv('mobile', process.cwd(), ''), ...process.env };
let api;
try { api = new URL(env.VITE_API_URL); } catch { throw new Error('Set VITE_API_URL to your public HTTPS API address in .env.mobile.local before building the phone app.'); }
if (api.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname) || api.hostname.endsWith('.invalid') || !api.pathname.endsWith('/api/')) {
  throw new Error('Mobile API must be a reachable HTTPS URL ending in /api/, not localhost or a placeholder.');
}
await build({ mode: 'mobile', configLoader: 'native' });
