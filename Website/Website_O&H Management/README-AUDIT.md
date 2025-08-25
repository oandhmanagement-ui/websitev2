# O&H Management Website Audit Setup

## Übersicht

Dieses Audit-Setup bietet umfassende Performance-, SEO- und Security-Checks für die O&H Management Website.

## Installation

```bash
npm install
```

## Verfügbare Scripts

### 1. Einfaches Audit (Empfohlen)
```bash
# Lokale Entwicklung
npm run audit:simple

# Gegen Live-URL
npm run audit:simple:base -- https://www.oandhmanagement.at
```

### 2. Vollständiges Lighthouse Audit
```bash
# Lokale Entwicklung
npm run audit

# Gegen Live-URL
npm run audit:base -- https://www.oandhmanagement.at
```

## Audit-Ergebnisse

### Einfaches Audit
- ✅ **Performance**: TTFB, Größe, Score
- ✅ **Security Headers**: Cache-Control, Compression, HSTS, etc.
- ✅ **SEO Basics**: Title, Meta Description, H1, Canonical
- ✅ **Reports**: JSON-Export in `./reports/simple-audit/<timestamp>/`

### Vollständiges Lighthouse Audit
- ✅ **Performance**: LCP, CLS, INP, TTFB, FCP, TTI
- ✅ **Accessibility**: WCAG-Compliance
- ✅ **Best Practices**: Security, Performance, SEO
- ✅ **SEO**: Vollständige SEO-Analyse
- ✅ **Reports**: HTML + JSON in `./reports/lighthouse/<timestamp>/`

## Aktuelle Ergebnisse (Live-Website)

### Performance
- 📊 **TTFB**: 334ms (Excellent)
- 📦 **Größe**: 19 KB
- 🎯 **Score**: 100/100

### Security Headers
- ✅ **HSTS**: max-age=31536000 (Excellent)
- ✅ **X-Powered-By**: Hidden (Good)
- ❌ **Cache Control**: no-cache (Needs improvement)
- ❌ **Compression**: Missing (Needs improvement)
- ❌ **X-Content-Type-Options**: Missing (Needs improvement)
- ❌ **Referrer Policy**: Missing (Needs improvement)

### SEO
- ✅ **Title Tag**: Optimiert
- ✅ **Meta Description**: Vorhanden
- ✅ **H1 Tag**: Vorhanden
- ✅ **Canonical URL**: Korrekt gesetzt

## Empfehlungen

### Sofortige Verbesserungen
1. **Cache-Control Header** hinzufügen für statische Assets
2. **Compression (Brotli/Gzip)** aktivieren
3. **X-Content-Type-Options: nosniff** hinzufügen
4. **Referrer-Policy** konfigurieren

### Netlify-spezifische Optimierungen
```toml
# netlify.toml Ergänzungen
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Frame-Options = "DENY"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Verwendung

### Lokale Entwicklung
```bash
# Terminal 1: Netlify Dev starten
netlify dev

# Terminal 2: Audit ausführen
npm run audit:simple
```

### Live-Website
```bash
npm run audit:simple:base -- https://www.oandhmanagement.at
```

## Ordnerstruktur

```
tools/audit/
├── simple-audit.cjs      # Einfaches Audit (funktioniert)
├── run-audit.cjs         # Vollständiges Lighthouse Audit
├── urls.cjs              # URL-Ermittlung
├── lh-config.cjs         # Lighthouse-Konfiguration
└── check-headers.cjs     # Header-Checks

reports/
├── simple-audit/         # Einfache Audit-Reports
└── lighthouse/           # Lighthouse-Reports
```

## Troubleshooting

### Lighthouse-Probleme
Falls das vollständige Lighthouse-Audit nicht funktioniert, verwenden Sie das einfache Audit:
```bash
npm run audit:simple:base -- https://www.oandhmanagement.at
```

### Chrome-Probleme
Das Setup verwendet Chrome Launcher. Falls Probleme auftreten:
1. Chrome installieren
2. Puppeteer neu installieren: `npm install puppeteer`

## Kontinuierliche Überwachung

Für regelmäßige Audits können Sie das Setup in CI/CD-Pipelines integrieren oder als Cron-Job einrichten.
