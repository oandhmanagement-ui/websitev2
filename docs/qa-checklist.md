# Chatbot QA-Checklist

## Funktionale Tests

### 1. Basis-Funktionalität
- [ ] Chat-Widget öffnet sich beim Klick auf FAB
- [ ] Chat-Widget schließt sich beim erneuten Klick
- [ ] Welcome Message wird angezeigt
- [ ] Input-Feld ist fokussiert beim Öffnen
- [ ] Enter-Taste sendet Nachricht
- [ ] Senden-Button funktioniert

### 2. Quick Replies
- [ ] Alle Quick Replies sind sichtbar
- [ ] Klick auf Quick Reply füllt Input-Feld
- [ ] Quick Reply wird nach Klick gesendet
- [ ] Responsive Design für Quick Replies

### 3. Nachrichten-History
- [ ] Nachrichten werden korrekt angezeigt
- [ ] User-Nachrichten rechts, Bot-Nachrichten links
- [ ] History wird in Session Storage gespeichert
- [ ] Max. 10 Nachrichten werden gespeichert
- [ ] History wird nach 30 Min. Inaktivität gelöscht

### 4. Typing Indicator
- [ ] Typing Indicator wird angezeigt
- [ ] Animation funktioniert (3 Punkte)
- [ ] Indicator wird nach Antwort entfernt
- [ ] Timing ist angemessen (600ms)

## Sprach- und Content-Tests

### 5. Deutsche Sprache
- [ ] Alle Texte sind auf Deutsch (AT)
- [ ] Sie-Form wird durchgängig verwendet
- [ ] Keine englischen Texte im UI
- [ ] Umlaute werden korrekt angezeigt

### 6. Guardrails
- [ ] Keine Code-Blöcke in Bot-Antworten
- [ ] Keine Backticks in Antworten
- [ ] Max. 1 Emoji pro Antwort
- [ ] Keine diskriminierenden Emojis
- [ ] Professionell-freundlicher Ton

### 7. Fallback-Logic
- [ ] Nach 3 fehlgeschlagenen Versuchen → Hand-off
- [ ] Hand-off-Nachricht wird angezeigt
- [ ] Kontakt-E-Mail wird korrekt angezeigt
- [ ] Kontaktformular-Link funktioniert

## Responsive Design Tests

### 8. Desktop (1024px+)
- [ ] Panel-Breite: clamp(320px, 30vw, 380px)
- [ ] FAB-Position: bottom-right 20px
- [ ] Alle Elemente sind gut lesbar

### 9. Tablet (768px-1024px)
- [ ] Panel-Breite: clamp(300px, 60vw, 420px)
- [ ] Button Hit-Areas: min. 44px
- [ ] Spacing ist optimiert
- [ ] Touch-Targets sind ausreichend groß

### 10. Mobile (<768px)
- [ ] Panel passt auf Bildschirm
- [ ] Input-Feld ist gut bedienbar
- [ ] Quick Replies sind scrollbar
- [ ] Keine horizontalen Scrollbars

## Performance Tests

### 11. Ladezeiten
- [ ] Chatbot lädt < 2s
- [ ] Erste Antwort < 2s
- [ ] Keine Performance-Impact auf Hauptseite
- [ ] Lighthouse Score ≥ 90/100

### 12. Memory & Storage
- [ ] Session Storage wird korrekt verwendet
- [ ] Keine Memory Leaks
- [ ] History wird automatisch bereinigt
- [ ] Keine Server-seitige Speicherung

## Analytics Tests

### 13. GA4 Events (nur mit Consent)
- [ ] `bot_open` wird gesendet
- [ ] `message_sent` wird gesendet
- [ ] `reply_stream` wird gesendet
- [ ] `cta_click` wird gesendet
- [ ] `handoff_initiated` wird gesendet
- [ ] Keine Events ohne Consent

### 14. Consent Mode v2
- [ ] Events werden nur bei `analytics_storage='granted'` gesendet
- [ ] Keine PII in Event-Parametern
- [ ] Component: 'chatbot' wird gesetzt

## Integration Tests

### 15. Backend Integration
- [ ] Netlify Function `/api/chat` erreichbar
- [ ] Streaming funktioniert
- [ ] CORS Headers korrekt
- [ ] Error Handling funktioniert

### 16. RAG System
- [ ] Knowledge Base wird geladen
- [ ] Antworten basieren auf Website-Content
- [ ] Keine Source-Display in Chat
- [ ] Wöchentliche Updates funktionieren

## Smoketests

### 17. Dialog-Tests
- [ ] "Termin buchen" → Kontaktformular-Link
- [ ] "Leistungen" → Service-Übersicht
- [ ] "Kontakt" → Kontaktformular-Link
- [ ] "Öffnungszeiten" → Business Hours
- [ ] "Preise" → Preisinformationen
- [ ] "Über uns" → Firmeninformationen
- [ ] Unbekannte Frage → Fallback nach 3 Versuchen
- [ ] Technischer Fehler → Error Message

### 18. Edge Cases
- [ ] Leere Nachricht wird nicht gesendet
- [ ] Sehr lange Nachrichten werden verarbeitet
- [ ] Sonderzeichen werden korrekt angezeigt
- [ ] Netzwerk-Fehler werden abgefangen
- [ ] Browser-Refresh behält History

## Deployment Tests

### 19. Netlify Deployment
- [ ] Functions werden deployed
- [ ] Environment Variables gesetzt
- [ ] Scheduled Functions funktionieren
- [ ] Build Script läuft erfolgreich

### 20. Production Ready
- [ ] Keine Console Errors
- [ ] Keine Dead Code
- [ ] Alle Dependencies installiert
- [ ] SSL/TLS funktioniert
- [ ] Performance ist akzeptabel

---

**Test-Datum:** _______________
**Tester:** _______________
**Ergebnis:** Pass/Fail
**Notizen:** _______________
