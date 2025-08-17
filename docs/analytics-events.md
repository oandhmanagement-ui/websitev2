# Chatbot Analytics Events

## Übersicht

Der Chatbot sendet GA4 Events über Google Tag Manager (GTM) für Performance-Monitoring und User-Journey-Analyse. Alle Events respektieren Consent Mode v2 und enthalten keine persönlichen Daten.

## Event-Struktur

Alle Events folgen diesem Format:
```javascript
dataLayer.push({
  event: 'event_name',
  component: 'chatbot',
  label: 'optional_label',
  // Weitere Parameter je nach Event
});
```

## Event-Definitionen

### 1. bot_open
**Trigger:** Chat-Widget wird geöffnet
```javascript
{
  event: 'bot_open',
  component: 'chatbot',
  timestamp: '2025-08-10T19:48:00.000Z'
}
```

### 2. message_sent
**Trigger:** Benutzer sendet eine Nachricht
```javascript
{
  event: 'message_sent',
  component: 'chatbot',
  message_length: 45, // Anzahl Zeichen
  has_quick_reply: true, // Boolean
  quick_reply_text: 'Termin buchen' // Optional
}
```

### 3. reply_stream
**Trigger:** Bot-Antwort beginnt zu streamen
```javascript
{
  event: 'reply_stream',
  component: 'chatbot',
  response_time_ms: 1200, // Zeit bis erste Antwort
  fallback_count: 0 // Anzahl vorheriger Fallbacks
}
```

### 4. cta_click
**Trigger:** Benutzer klickt auf CTA-Link
```javascript
{
  event: 'cta_click',
  component: 'chatbot',
  label: 'contact_form', // oder 'appointment', 'email'
  destination_url: '/kontakt.html'
}
```

### 5. handoff_initiated
**Trigger:** Fallback nach 3 fehlgeschlagenen Versuchen
```javascript
{
  event: 'handoff_initiated',
  component: 'chatbot',
  fallback_reason: 'max_attempts_reached',
  total_attempts: 3,
  contact_method: 'email' // oder 'form'
}
```

## Consent Mode v2 Integration

### Consent-Prüfung
```javascript
function hasAnalyticsConsent() {
  return window.dataLayer && 
         window.dataLayer.find(item => 
           item.analytics_storage === 'granted'
         );
}
```

### Event-Sending mit Consent
```javascript
function sendAnalyticsEvent(eventData) {
  if (hasAnalyticsConsent()) {
    window.dataLayer.push({
      ...eventData,
      component: 'chatbot'
    });
  }
}
```

## GTM-Konfiguration

### Trigger
- **bot_open:** Custom Event = 'bot_open'
- **message_sent:** Custom Event = 'message_sent'
- **reply_stream:** Custom Event = 'reply_stream'
- **cta_click:** Custom Event = 'cta_click'
- **handoff_initiated:** Custom Event = 'handoff_initiated'

### Variables
- **Component:** Data Layer Variable = 'component'
- **Label:** Data Layer Variable = 'label'
- **Message Length:** Data Layer Variable = 'message_length'
- **Response Time:** Data Layer Variable = 'response_time_ms'
- **Fallback Count:** Data Layer Variable = 'fallback_count'

### Tags
Alle Events werden als GA4 Events gesendet:
- Event Name: {{Event}}
- Parameters: Alle verfügbaren Data Layer Variables

## Performance-Monitoring

### Key Metrics
- **Chatbot Open Rate:** bot_open / page_views
- **Message Response Rate:** message_sent / bot_open
- **CTA Click Rate:** cta_click / message_sent
- **Handoff Rate:** handoff_initiated / message_sent
- **Average Response Time:** Durchschnitt response_time_ms

### Custom Dimensions
1. **Component:** 'chatbot' (für Filterung)
2. **Quick Reply Used:** Boolean
3. **Fallback Count:** 0-3
4. **Contact Method:** 'email', 'form', 'appointment'

## Datenschutz

### Keine PII
- Keine Nachrichten-Inhalte
- Keine E-Mail-Adressen
- Keine Namen
- Keine IP-Adressen

### Data Retention
- GA4 Standard Retention (26 Monate)
- Keine Server-seitige Speicherung
- Session-basierte Analytics

### Opt-out
- Events werden nur bei `analytics_storage='granted'` gesendet
- Benutzer können über Cookie-Banner opt-out
- Keine Tracking ohne Consent

## Debugging

### Test-Modus
```javascript
// Für lokales Testing
window.CHATBOT_DEBUG = true;
```

### Event-Logging
```javascript
// Alle Events werden in Console geloggt (nur im Debug-Modus)
if (window.CHATBOT_DEBUG) {
  console.log('Chatbot Event:', eventData);
}
```

### GTM Preview
- GTM Preview Mode aktivieren
- Events in Real-Time überprüfen
- Data Layer Inspector verwenden

## Reporting

### Standard Reports
1. **Chatbot Performance Dashboard**
2. **User Journey Analysis**
3. **Fallback Analysis**
4. **CTA Performance**

### Custom Reports
- Conversion Funnel: bot_open → message_sent → cta_click
- Response Time Distribution
- Quick Reply Usage
- Handoff Reasons

---

**Version:** 1.0
**Letzte Aktualisierung:** 2025-08-10
**Verantwortlich:** Development Team
