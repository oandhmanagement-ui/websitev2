# Netlify Deployment Guide

## Übersicht

Dieser Guide beschreibt die Deployment-Schritte für den O&H Management Chatbot auf Netlify.

## Voraussetzungen

- Netlify Account
- GitHub/GitLab Repository mit dem Code
- OpenAI API Key
- Domain (optional)

## Schritt 1: Repository Setup

### 1.1 Code hochladen
```bash
# Repository initialisieren (falls noch nicht geschehen)
git init
git add .
git commit -m "Initial chatbot implementation"

# Remote Repository hinzufügen
git remote add origin https://github.com/your-username/oh-management.git
git push -u origin main
```

### 1.2 Netlify Site erstellen
1. Gehen Sie zu [netlify.com](https://netlify.com)
2. Klicken Sie auf "New site from Git"
3. Wählen Sie Ihr Repository aus
4. Konfigurieren Sie die Build-Einstellungen:

**Build Settings:**
- Build command: `npm run build` (oder leer lassen für statische Sites)
- Publish directory: `.` (Root-Verzeichnis)
- Node version: 18 (in Environment Variables setzen)

## Schritt 2: Environment Variables

### 2.1 OpenAI API Key
1. Gehen Sie zu Site Settings → Environment Variables
2. Fügen Sie folgende Variablen hinzu:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
MODEL=gpt-4o-mini
```

### 2.2 Optional: Weitere Variablen
```
NODE_ENV=production
SITE_URL=https://your-domain.netlify.app
```

## Schritt 3: Netlify Functions

### 3.1 Functions Directory
Stellen Sie sicher, dass der `netlify/functions/` Ordner im Repository vorhanden ist:

```
netlify/
├── functions/
│   ├── chat.js
│   └── refresh-index.js
```

### 3.2 Dependencies
Erstellen Sie eine `package.json` im Root-Verzeichnis:

```json
{
  "name": "oh-management-chatbot",
  "version": "1.0.0",
  "dependencies": {
    "openai": "^4.0.0"
  },
  "scripts": {
    "build:rag": "node scripts/build-rag.mjs"
  }
}
```

## Schritt 4: Scheduled Functions

### 4.1 Netlify Cron Jobs
Für wöchentliche RAG-Updates:

1. Gehen Sie zu Site Settings → Functions
2. Aktivieren Sie "Background Functions"
3. Fügen Sie einen Cron Job hinzu:

```toml
# netlify.toml
[functions]
  directory = "netlify/functions"

[[functions.schedule]]
  function = "refresh-index"
  cron = "0 2 * * 1"  # Montags um 2:00 Uhr
```

### 4.2 Manueller Test
Testen Sie die Scheduled Function manuell:

```bash
curl "https://your-site.netlify.app/.netlify/functions/refresh-index?manual=true"
```

## Schritt 5: Domain & SSL

### 5.1 Custom Domain (Optional)
1. Gehen Sie zu Site Settings → Domain management
2. Klicken Sie auf "Add custom domain"
3. Folgen Sie den DNS-Anweisungen

### 5.2 SSL Certificate
- Netlify stellt automatisch SSL-Zertifikate bereit
- Für Custom Domains: Let's Encrypt wird automatisch konfiguriert

## Schritt 6: Testing

### 6.1 Funktionstest
1. Öffnen Sie die Website
2. Klicken Sie auf den Chat-Button
3. Testen Sie eine Nachricht
4. Überprüfen Sie die Netlify Function Logs

### 6.2 Logs überprüfen
```bash
# Netlify CLI (falls installiert)
netlify functions:list
netlify functions:invoke chat --body '{"message":"test"}'
```

### 6.3 Analytics Test
1. Öffnen Sie die Browser-Entwicklertools
2. Überprüfen Sie die Network-Tab für API-Calls
3. Testen Sie GA4 Events (falls konfiguriert)

## Schritt 7: Monitoring

### 7.1 Netlify Analytics
- Gehen Sie zu Site Analytics
- Überwachen Sie Function Invocations
- Prüfen Sie Error Rates

### 7.2 Function Monitoring
```bash
# Function Logs anzeigen
netlify functions:logs

# Spezifische Function
netlify functions:logs chat
```

### 7.3 Performance Monitoring
- Lighthouse Tests durchführen
- Core Web Vitals überwachen
- Chatbot Response Times tracken

## Schritt 8: Troubleshooting

### 8.1 Häufige Probleme

**Function nicht erreichbar:**
- Prüfen Sie die Function-Datei-Pfade
- Überprüfen Sie die Dependencies
- Testen Sie lokal mit Netlify CLI

**CORS Errors:**
- Überprüfen Sie die CORS-Headers in `chat.js`
- Stellen Sie sicher, dass die Domain korrekt ist

**OpenAI API Errors:**
- Überprüfen Sie den API Key
- Prüfen Sie die API Quotas
- Testen Sie die API direkt

### 8.2 Debug-Modus
Aktivieren Sie Debug-Logging:

```javascript
// In der Browser-Konsole
window.CHATBOT_DEBUG = true;
```

### 8.3 Rollback
Falls Probleme auftreten:

1. Gehen Sie zu Deploys
2. Wählen Sie einen früheren Deploy
3. Klicken Sie auf "Publish deploy"

## Schritt 9: Production Checklist

- [ ] Alle Environment Variables gesetzt
- [ ] Functions deployed und getestet
- [ ] SSL Certificate aktiv
- [ ] Custom Domain konfiguriert (falls gewünscht)
- [ ] Analytics Events funktionieren
- [ ] Fallback Logic getestet
- [ ] Mobile/Tablet Responsive Design
- [ ] Performance Tests bestanden
- [ ] Security Headers konfiguriert
- [ ] Monitoring eingerichtet

## Schritt 10: Maintenance

### 10.1 Regelmäßige Updates
- OpenAI API Updates
- Security Patches
- Performance Optimierungen

### 10.2 Backup Strategy
- Repository regelmäßig committen
- Environment Variables dokumentieren
- Configuration Files versionieren

### 10.3 Monitoring Alerts
- Function Error Rates
- Response Times
- API Usage Limits

---

**Support:** Bei Problemen wenden Sie sich an das Development Team oder konsultieren Sie die Netlify Dokumentation.
