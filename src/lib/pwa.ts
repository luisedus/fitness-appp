// Single place that registers the offline service worker. Never runs in dev/preview.
function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try { if (window.self !== window.top) return true; } catch { return true; }
  const h = window.location.hostname.toLowerCase();
  const label = h.split('.')[0];
  const lovableHost = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(h);
  if (lovableHost && /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label)) return true;
  if (lovableHost && /^project--.+-dev$/.test(label)) return true;
  if (h === 'lovableproject.com' || h.endsWith('.lovableproject.com')) return true;
  if (h === 'lovableproject-dev.com' || h.endsWith('.lovableproject-dev.com')) return true;
  if (h === 'beta.lovable.dev' || h.endsWith('.beta.lovable.dev')) return true;
  if (new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  return false;
}

async function unregisterAppSW() {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs.filter(r => (r.active || r.installing || r.waiting)?.scriptURL.endsWith('/sw.js')).map(r => r.unregister()),
  );
}

export function setupPWA() {
  if (!('serviceWorker' in navigator)) return;
  if (isRefusedContext()) { void unregisterAppSW(); return; }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}
