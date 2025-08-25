/* Führt Lighthouse für mehrere URLs aus, speichert HTML+JSON, und gibt eine kompakte Tabelle aus. */
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const pc = require('picocolors');
const { getUrls } = require('./urls.cjs');
const { checkHeaders } = require('./check-headers.cjs');

function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i+1]) return process.argv[i+1];
  return def;
}
(async () => {
  const base = arg('--base', process.env.AUDIT_BASE_URL || 'http://localhost:8888');
  const outDir = path.resolve('reports','lighthouse', String(Date.now()));
  fse.ensureDirSync(outDir);

  // Ziel-URLs ermitteln
  const urls = await getUrls(base);
  // Für den ersten Test nur die Hauptseite
  const testUrls = urls.slice(0, 1);
  console.log(pc.cyan(`\nAuditing ${testUrls.length} URL(s) based on ${base}\n`));

  // Lighthouse config
  const cfg = require('./lh-config.cjs');

  const summary = [];
  
  // Chrome starten
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  
  for (const url of testUrls) {
    const slug = url.replace(/https?:\/\//,'').replace(/[^\w.-]+/g,'_').slice(0,120);
    const outBase = path.join(outDir, slug);
    const htmlPath = `${outBase}.html`;
    const jsonPath = `${outBase}.json`;

    // Lighthouse laufen lassen
    try {
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        output: ['html', 'json'],
        outputPath: outBase,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        throttlingMethod: 'simulate'
      });
      
            const report = runnerResult.lhr;
      const cat = report.categories;
      const audits = report.audits;
    } catch (e) {
      console.error(pc.red(`Lighthouse failed for ${url}`), e.message);
      continue;
    }

    // Kennzahlen
    const perf = Math.round((cat.performance.score||0)*100);
    const a11y = Math.round((cat.accessibility.score||0)*100);
    const bp   = Math.round((cat['best-practices'].score||0)*100);
    const seo  = Math.round((cat.seo.score||0)*100);

    const lcp  = audits['largest-contentful-paint'].numericValue || 0;
    const cls  = audits['cumulative-layout-shift'].numericValue || 0;
    const inp  = audits['interactive'].numericValue || 0; // INP proxy falls INP nicht separat verfügbar
    const ttfb = (audits['server-response-time']?.numericValue) || 0;
    const reqs = audits['network-requests']?.details?.items?.length || 0;
    const totalKb = Math.round(((audits['total-byte-weight']?.numericValue || 0)/1024));

    // Header-Check (nur auf Startseite ausgeben, sonst „-")
    let headers = null;
    if (url === testUrls[0]) headers = await checkHeaders(url);

    summary.push({
      url, perf, a11y, bp, seo,
      lcp, cls, inp, ttfb, reqs, totalKb,
      htmlPath, headers
    });
  }

  // Konsole-Ausgabe
  function ms(n){ return (n/1000).toFixed(2)+'s'; }
  console.log(pc.bold('\n=== Audit Summary ==='));
  console.log(pc.dim('(Scores 0–100; Zeiten in Sekunden; Größe in KB)\n'));
  for (const s of summary) {
    console.log(pc.bold(s.url));
    console.log(`  Scores  : Perf ${pc.green(s.perf)} | A11y ${s.a11y} | BP ${s.bp} | SEO ${pc.green(s.seo)}`);
    console.log(`  WebVitals: LCP ${ms(s.lcp)} | CLS ${s.cls.toFixed(3)} | INP/TTI ${ms(s.inp)} | TTFB ${ms(s.ttfb)}`);
    console.log(`  Network : ${s.reqs} reqs | ~${s.totalKb} KB`);
    console.log(`  Report  : ${path.relative(process.cwd(), s.htmlPath)}\n`);
    if (s.headers) {
      console.log(pc.bold('  Full-Stack Header Check (Startseite):'));
      for (const [k,v] of Object.entries(s.headers)) {
        const ok = v.ok ? pc.green('OK') : pc.red('MISSING/WEAK');
        console.log(`   - ${k}: ${ok} ${pc.dim(String(v.value))}`);
      }
      console.log('');
    }
  }
  
  // Chrome beenden
  await chrome.kill();
  
  console.log(pc.cyan(`Alle Reports: ${outDir}\n`));
})();
