/* Vereinfachtes Audit-Setup für O&H Management Website */
const { request } = require('undici');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const pc = require('picocolors');

function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i+1]) return process.argv[i+1];
  return def;
}

async function checkHeaders(url) {
  try {
    const res = await request(url, { method: 'GET', maxRedirections: 2 });
    const h = Object.fromEntries(Object.entries(res.headers).map(([k,v])=>[k.toLowerCase(), Array.isArray(v)?v.join(', '):v]));
    
    const checks = {
      'cache-control': { pattern: /max-age/i, name: 'Cache Control' },
      'content-encoding': { pattern: /(br|gzip)/i, name: 'Compression' },
      'x-content-type-options': { pattern: /nosniff/i, name: 'X-Content-Type-Options' },
      'referrer-policy': { pattern: /(strict-origin-when-cross-origin|no-referrer|origin-when-cross-origin)/i, name: 'Referrer Policy' },
      'strict-transport-security': { pattern: /max-age=/i, name: 'HSTS' },
      'x-powered-by': { pattern: /^$/, name: 'X-Powered-By (hidden)', inverse: true }
    };
    
    const report = {};
    for (const [k, check] of Object.entries(checks)) {
      const v = h[k] || '';
      const matches = check.pattern.test(v);
      const ok = check.inverse ? !v : matches;
      report[k] = { ok, value: v || 'MISSING', name: check.name };
    }
    return report;
  } catch (e) {
    return { error: e.message };
  }
}

async function checkPerformance(url) {
  try {
    const start = Date.now();
    const res = await request(url, { method: 'GET' });
    const body = await res.body.text();
    const end = Date.now();
    
    const ttfb = end - start;
    const size = Buffer.byteLength(body, 'utf8');
    const sizeKb = Math.round(size / 1024);
    
    // Einfache Performance-Metriken
    const performance = {
      ttfb,
      size: sizeKb,
      requests: 1, // Vereinfacht
      score: ttfb < 1000 ? 100 : ttfb < 2000 ? 80 : ttfb < 3000 ? 60 : 40
    };
    
    return performance;
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  const base = arg('--base', process.env.AUDIT_BASE_URL || 'https://www.oandhmanagement.at');
  const outDir = path.resolve('reports','simple-audit', String(Date.now()));
  fse.ensureDirSync(outDir);

  console.log(pc.cyan(`\n=== O&H Management Website Audit ===\n`));
  console.log(pc.bold(`URL: ${base}\n`));

  // Header-Check
  console.log(pc.bold('🔒 Security & Performance Headers:'));
  const headers = await checkHeaders(base);
  if (headers.error) {
    console.log(pc.red(`  Error: ${headers.error}`));
  } else {
    for (const [k, v] of Object.entries(headers)) {
      const status = v.ok ? pc.green('✅') : pc.red('❌');
      console.log(`  ${status} ${v.name}: ${pc.dim(v.value)}`);
    }
  }
  console.log('');

  // Performance-Check
  console.log(pc.bold('⚡ Performance Metrics:'));
  const perf = await checkPerformance(base);
  if (perf.error) {
    console.log(pc.red(`  Error: ${perf.error}`));
  } else {
    console.log(`  📊 TTFB: ${perf.ttfb}ms ${perf.ttfb < 1000 ? pc.green('(Good)') : perf.ttfb < 2000 ? pc.yellow('(Fair)') : pc.red('(Poor)')}`);
    console.log(`  📦 Size: ${perf.size} KB`);
    console.log(`  🎯 Score: ${perf.score}/100`);
  }
  console.log('');

  // SEO-Check (einfach)
  console.log(pc.bold('🔍 Basic SEO Check:'));
  try {
    const res = await request(base);
    const html = await res.body.text();
    
    const checks = {
      'title': { pattern: /<title[^>]*>([^<]+)<\/title>/i, name: 'Title Tag' },
      'meta-description': { pattern: /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i, name: 'Meta Description' },
      'h1': { pattern: /<h1[^>]*>([^<]+)<\/h1>/i, name: 'H1 Tag' },
      'canonical': { pattern: /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i, name: 'Canonical URL' }
    };
    
    for (const [k, check] of Object.entries(checks)) {
      const match = html.match(check.pattern);
      const status = match ? pc.green('✅') : pc.red('❌');
      const value = match ? match[1].substring(0, 50) + '...' : 'MISSING';
      console.log(`  ${status} ${check.name}: ${pc.dim(value)}`);
    }
  } catch (e) {
    console.log(pc.red(`  Error: ${e.message}`));
  }
  console.log('');

  // Report speichern
  const report = {
    url: base,
    timestamp: new Date().toISOString(),
    headers,
    performance: perf
  };
  
  const reportPath = path.join(outDir, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(pc.cyan(`📄 Report saved: ${reportPath}\n`));
  console.log(pc.bold('🎯 Recommendations:'));
  console.log('  • Ensure all security headers are properly configured');
  console.log('  • Optimize TTFB (target: < 1s)');
  console.log('  • Implement proper caching strategies');
  console.log('  • Add missing SEO elements if needed\n');
})();
