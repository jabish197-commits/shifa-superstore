import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.VITE_DEV_PORT || 5175);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Choose a valid port between 1 and 65535.');
  process.exit(1);
}
const url = `http://127.0.0.1:${port}`;
const occupied = await new Promise((resolve) => {
  const socket = createConnection({ host: '127.0.0.1', port });
  const finish = (value) => { socket.destroy(); resolve(value); };
  socket.once('connect', () => finish(true));
  socket.once('error', () => finish(false));
  socket.setTimeout(1500, () => finish(false));
});
if (occupied) {
  let isShifa = false;
  try {
    const response = await fetch(`${url}/src/App.jsx`, { signal: AbortSignal.timeout(3000) });
    const source = await response.text();
    isShifa = response.ok && source.includes('Shifa Superstore') && source.includes('admin-dashboard');
  } catch {}
  if (isShifa) {
    console.log(`\nShifa Superstore is already running.\n\n  Open: ${url}/\n\nReusing the existing server; no second server is needed.\n`);
    process.exit(0);
  }
  console.error(`Port ${port} belongs to another service. Leave it running and choose a different port:\n  npm run dev -- --port ${port < 65535 ? port + 1 : 5175}`);
  process.exit(1);
}
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const child = spawn(process.execPath, [vite, '--configLoader', 'native', ...args], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_PORT: String(port) },
});
child.once('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.once('exit', (code) => { process.exitCode = code ?? 0; });
process.on('SIGINT', () => { child.kill('SIGINT'); });
process.on('SIGTERM', () => { child.kill('SIGTERM'); });
