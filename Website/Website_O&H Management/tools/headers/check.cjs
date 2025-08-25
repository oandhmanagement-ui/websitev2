const fs = require('fs');
const path = require('path');

const urls = [
  'https://stripe.com/privacy',
  'https://stripe.com/legal/data-privacy-framework',
  'https://stripe.com/legal/dpa',
  'https://support.stripe.com/questions/protection-of-european-data-transfers',
  'https://www.paypal.com/legalhub/paypal/privacy-full',
  'https://www.paypal.com/us/legalhub/paypal/c2c-sccs-eu',
  'https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en',
  'https://www.dataprivacyframework.gov/list'
];

async function headLike(url) {
  // Einige Server blocken echte HEAD-Requests -> wir machen GET ohne Body-Download
  const res = await fetch(url, {
    redirect: 'follow',
    // UA wie ein Browser, damit CDNs nicht meckern
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' },
    // streaming, Response-Body wird nicht gelesen (Header reichen)
  });
  const lines = [];
  lines.push(`URL: ${url}`);
  lines.push(`Status: ${res.status} ${res.statusText}`);
  // Redirect-Kette kann fetch nicht direkt ausgeben -> wir loggen die finale URL:
  if (res.url && res.url !== url) lines.push(`Final URL: ${res.url}`);
  lines.push('--- Headers ---');
  res.headers.forEach((v, k) => lines.push(`${k}: ${v}`));
  lines.push('');
  return lines.join('\n');
}

(async () => {
  const outDir = path.resolve('reports', 'headers');
  fs.mkdirSync(outDir, { recursive: true });

  // Node 18+ hat global fetch; falls nicht vorhanden, Hinweis ausgeben
  if (typeof fetch !== 'function') {
    console.error('Node >= 18 erforderlich (global fetch). Bitte Node aktualisieren.');
    process.exit(1);
  }

  for (const u of urls) {
    try {
      const text = await headLike(u);
      const slug = u.replace(/^https?:\/\//,'').replace(/[^\w.-]+/g,'_').slice(0,120);
      const file = path.join(outDir, `${slug}.txt`);
      fs.writeFileSync(file, text, 'utf8');
      console.log(`OK  -> ${u}`);
    } catch (e) {
      console.error(`FAIL -> ${u}: ${e.message}`);
    }
  }
  console.log(`\nBerichte gespeichert in: ${path.join('reports','headers')}`);
})();
