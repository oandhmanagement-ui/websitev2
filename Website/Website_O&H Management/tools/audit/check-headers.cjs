// Prüft Full-Stack Header (Caching/Compression/Security) einer URL
const { request } = require('undici');

async function checkHeaders(url) {
  const res = await request(url, { method: 'GET', maxRedirections: 2 });
  const h = Object.fromEntries(Object.entries(res.headers).map(([k,v])=>[k.toLowerCase(), Array.isArray(v)?v.join(', '):v]));
  const need = {
    'cache-control': /max-age/i,
    'content-encoding': /(br|gzip)/i,
    'x-content-type-options': /nosniff/i,
    'referrer-policy': /(strict-origin-when-cross-origin|no-referrer|origin-when-cross-origin)/i,
    'permissions-policy': /./,
    'content-security-policy': /./,
    'strict-transport-security': /max-age=/i
  };
  const report = {};
  for (const [k, rx] of Object.entries(need)) {
    const v = h[k] || '';
    report[k] = v ? (rx.test(v) ? { ok:true, value:v } : { ok:false, value:v||'MISSING/INVALID' }) : { ok:false, value:'MISSING' };
  }
  // TTFB als grober Proxy (server timing gibt es selten)
  report['x-powered-by'] = { ok: !h['x-powered-by'], value: h['x-powered-by']||'not exposed (good)' };
  return report;
}
module.exports = { checkHeaders };
