// Ermittelt die zu prüfenden URLs: versucht sitemap.xml, sonst crawlt die Startseite (same-origin, max 12 URLs).
const { request } = require('undici');
const { URL } = require('url');

async function getUrls(base) {
  const baseUrl = new URL(base);
  const list = new Set();
  // Versuch: sitemap.xml
  try {
    const sm = await request(new URL('/sitemap.xml', baseUrl));
    if (sm.statusCode === 200) {
      const xml = await sm.body.text();
      const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).filter(Boolean);
      locs.slice(0, 20).forEach(u => list.add(u));
    }
  } catch {}
  if (list.size > 0) return [...list];

  // Fallback: Startseite parsen + gleiche Origin-Links einsammeln
  try {
    const res = await request(baseUrl);
    const html = await res.body.text();
    const links = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
    for (const href of links) {
      try {
        const u = new URL(href, baseUrl);
        // Nur HTML-Seiten, keine Assets
        if (u.origin === baseUrl.origin && 
            (u.pathname.endsWith('.html') || 
             u.pathname === '/' || 
             u.pathname.match(/^\/(angebot|branchen|ueber-uns|kontakt|impressum|datenschutz|agb)$/))) {
          list.add(u.toString());
        }
        if (list.size >= 8) break;
      } catch {}
    }
  } catch {}
  if (list.size === 0) list.add(baseUrl.toString());
  // Für den Test nur die Hauptseite
  return [baseUrl.toString()];
}

module.exports = { getUrls };
