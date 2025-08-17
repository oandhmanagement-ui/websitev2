(() => {
  // Konfiguration laden
  let CONFIG = {
    welcome: "Willkommen, wie kann ich Ihnen weiterhelfen?",
    quickReplies: ["Termin buchen", "Leistungen", "Kontakt"],
    contactFormUrl: "/kontakt.html",
    instagramUrl: null,
    businessHours: "Mo–Fr 9–17 Uhr",
    maxHistory: 10,
    fallbackAttempts: 3,
    typingDelay: 600
  };

  // Konfiguration asynchron laden
  async function loadConfig() {
    try {
      const [siteConfig, chatbotConfig] = await Promise.all([
        fetch('/config/site.json').then(r => r.json()),
        fetch('/config/chatbot.json').then(r => r.json())
      ]);
      
      CONFIG = {
        ...CONFIG,
        ...chatbotConfig.ui,
        contactFormUrl: siteConfig.site.contactFormUrl,
        contactEmail: siteConfig.site.contactEmail,
        businessHours: siteConfig.businessHours.weekdays
      };
    } catch (error) {
      console.warn('Could not load config, using defaults:', error);
    }
  }

  const STORAGE_KEY = "oh_chat_history_v1";
  const FALLBACK_KEY = "oh_fallback_count_v1";
  let fallbackCount = 0;
  let isStreaming = false;

  // Utility Functions
  function el(tag, attrs={}, children=[]) {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => 
      k === "class" ? n.className = v : n.setAttribute(k,v)
    );
    (Array.isArray(children) ? children : [children])
      .filter(Boolean)
      .forEach(c => n.append(c.nodeType ? c : document.createTextNode(c)));
    return n;
  }

  // Consent Mode v2 Integration
  function hasAnalyticsConsent() {
    return window.dataLayer && 
           window.dataLayer.find(item => 
             item.analytics_storage === 'granted'
           );
  }

  function sendAnalyticsEvent(eventData) {
    if (hasAnalyticsConsent()) {
      const event = {
        ...eventData,
        component: 'chatbot',
        timestamp: new Date().toISOString()
      };
      
      window.dataLayer.push(event);
      
      if (window.CHATBOT_DEBUG) {
        console.log('Chatbot Event:', event);
      }
    }
  }

  // Storage Functions
  function loadHistory() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveHistory(h) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(-CONFIG.maxHistory)));
  }

  function loadFallbackCount() {
    try {
      return parseInt(sessionStorage.getItem(FALLBACK_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  function saveFallbackCount(count) {
    sessionStorage.setItem(FALLBACK_KEY, count.toString());
  }

  function pushMsg(h, role, content) {
    h.push({role, content, timestamp: new Date().toISOString()});
    saveHistory(h);
  }

  // UI Functions
  function addMsg(container, role, content) {
    const msg = el("div", {class: `oh-msg ${role}`}, content);
    container.append(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  function addTyping(container) {
    const typing = el("div", {class: "oh-typing"}, [
      el("span"), el("span"), el("span")
    ]);
    container.append(typing);
    container.scrollTop = container.scrollHeight;
    return typing;
  }

  function addCTA(container, text, url, label) {
    const cta = el("div", {class: "oh-msg bot"}, [
      text,
      el("br"),
      el("a", {
        href: url,
        class: "oh-cta-link",
        target: "_blank",
        "data-label": label
      }, "Hier klicken →")
    ]);
    
    cta.querySelector('.oh-cta-link').addEventListener('click', () => {
      sendAnalyticsEvent({
        event: 'cta_click',
        label: label,
        destination_url: url
      });
    });
    
    container.append(cta);
    container.scrollTop = container.scrollHeight;
    return cta;
  }

  // Fallback Logic
  function incrementFallbackCount() {
    fallbackCount = loadFallbackCount() + 1;
    saveFallbackCount(fallbackCount);
    return fallbackCount;
  }

  function resetFallbackCount() {
    fallbackCount = 0;
    saveFallbackCount(0);
  }

  function handleFallback(container) {
    const handoffMsg = CONFIG.responses?.handoff || 
      "Ich verbinde Sie gern mit unserem Team. Sie erreichen uns unter info@oh-management.at oder über unser Kontaktformular.";
    
    addMsg(container, "bot", handoffMsg);
    
    addCTA(container, 
      "📧 Direkter Kontakt:", 
      `mailto:${CONFIG.contactEmail}`, 
      "email"
    );
    
    addCTA(container, 
      "📝 Kontaktformular:", 
      CONFIG.contactFormUrl, 
      "contact_form"
    );
    
    sendAnalyticsEvent({
      event: 'handoff_initiated',
      fallback_reason: 'max_attempts_reached',
      total_attempts: fallbackCount,
      contact_method: 'email'
    });
  }

  // Canned Responses (Fallback)
  function cannedReply(text) {
    const t = text.toLowerCase();
    
    if (t.includes("termin")) {
      return {
        text: "Gern! Ich öffne das Formular zur Terminvereinbarung.",
        cta: { url: CONFIG.contactFormUrl, label: "appointment" }
      };
    }
    
    if (t.includes("leistung") || t.includes("angebot")) {
      return {
        text: "Kurzüberblick: Website, SEO-Grundoptimierung, Wartung/Updates, Hosting/SSL, E-Mail-Support. Womit darf ich starten?"
      };
    }
    
    if (t.includes("öffnungs") || t.includes("erreichbar")) {
      return {
        text: `Wir sind i. d. R. erreichbar: ${CONFIG.businessHours}. Der Chat ist 24/7 verfügbar.`
      };
    }
    
    if (t.includes("kontakt") || t.includes("support")) {
      return {
        text: "Sehr gern. Ich leite Sie zum Kontaktformular.",
        cta: { url: CONFIG.contactFormUrl, label: "contact_form" }
      };
    }
    
    return {
      text: "Gerne! Wie kann ich Sie konkret unterstützen – Termin, Leistungen, Support oder etwas anderes?"
    };
  }

  // Streaming API Call
  async function streamResponse(message, history, container) {
    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: history.slice(-10),
          fallbackCount
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';
      let msgElement = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'chunk' && parsed.content) {
                responseText += parsed.content;
                
                if (!msgElement) {
                  msgElement = addMsg(container, "bot", responseText);
                } else {
                  msgElement.textContent = responseText;
                }
                
                container.scrollTop = container.scrollHeight;
              }
              
              if (parsed.type === 'complete') {
                // Erfolgreiche Antwort - Fallback zurücksetzen
                resetFallbackCount();
                return responseText;
              }
              
              if (parsed.type === 'handoff') {
                handleFallback(container);
                return null;
              }
              
            } catch (e) {
              console.warn('Error parsing stream data:', e);
            }
          }
        }
      }

      return responseText;

    } catch (error) {
      console.error('Streaming error:', error);
      
      // Fallback-Zähler erhöhen
      incrementFallbackCount();
      
      if (fallbackCount >= CONFIG.fallbackAttempts) {
        handleFallback(container);
        return null;
      }
      
      // Canned Response als Fallback
      const reply = cannedReply(message);
      const responseText = reply.text;
      
      addMsg(container, "bot", responseText);
      
      if (reply.cta) {
        addCTA(container, "👉 ", reply.cta.url, reply.cta.label);
      }
      
      return responseText;
    }
  }

  // Main UI Builder
  async function buildUI() {
    await loadConfig();
    
    const fab = el("button", {
      class: "oh-chat-fab",
      "aria-label": "Chat öffnen"
    }, "💬");

    const panel = el("div", {class: "oh-chat-panel"});
    
    const header = el("div", {class: "oh-chat-header"}, [
      el("img", {
        src: CONFIG.branding?.logoPath || "/assets/logo-convertible.svg",
        alt: "O&H Management",
        onerror: "this.style.display='none'"
      }),
      el("div", {}, "Chat • Support & Termin")
    ]);

    const body = el("div", {class: "oh-chat-body"});
    const quick = el("div", {class: "oh-quickbar"});
    const inputWrap = el("div", {class: "oh-chat-input"});
    const input = el("input", {
      type: "text",
      placeholder: "Ihre Nachricht… (Enter zum Senden)"
    });
    const sendBtn = el("button", {}, "Senden");

    // Quick Replies
    CONFIG.quickReplies.forEach(q => {
      const chip = el("button", {
        class: "oh-chip",
        type: "button"
      }, q);
      
      chip.addEventListener("click", () => {
        input.value = q;
        sendBtn.click();
      });
      
      quick.append(chip);
    });

    inputWrap.append(input, sendBtn);
    panel.append(header, body, quick, inputWrap);
    document.body.append(fab, panel);

    // Event Listeners
    fab.addEventListener("click", () => {
      const isOpen = panel.style.display === "flex";
      panel.style.display = isOpen ? "none" : "flex";
      
      if (!isOpen) {
        input.focus();
        sendAnalyticsEvent({event: 'bot_open'});
      }
    });

    // Load History
    const history = loadHistory();
    fallbackCount = loadFallbackCount();
    
    if (history.length === 0) {
      pushMsg(history, "bot", CONFIG.welcome);
    }
    
    history.forEach(m => addMsg(body, m.role, m.content));

    // Send Function
    async function doSend() {
      const text = input.value.trim();
      if (!text || isStreaming) return;
      
      input.value = "";
      const h = loadHistory();
      pushMsg(h, "user", text);
      addMsg(body, "user", text);
      
      sendAnalyticsEvent({
        event: 'message_sent',
        message_length: text.length,
        has_quick_reply: CONFIG.quickReplies.includes(text)
      });

      const typing = addTyping(body);
      isStreaming = true;
      
      const startTime = Date.now();
      
      try {
        const response = await streamResponse(text, h, body);
        
        if (response) {
          pushMsg(h, "bot", response);
          
          sendAnalyticsEvent({
            event: 'reply_stream',
            response_time_ms: Date.now() - startTime,
            fallback_count: fallbackCount
          });
        }
        
      } finally {
        typing.remove();
        isStreaming = false;
      }
    }

    sendBtn.addEventListener("click", doSend);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") doSend();
    });
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUI);
  } else {
    buildUI();
  }
})();
