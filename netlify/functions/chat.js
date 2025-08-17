const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.MODEL || 'gpt-4o-mini';

// Guardrails für deutsche Sprache und Sie-Form
const SYSTEM_PROMPT = `Du bist ein professioneller Chatbot für O&H Management, eine B2B-Agentur für SEO, Social Media und Webdesign in St. Pölten, Österreich.

WICHTIGE REGELN:
- Antworte IMMER auf Deutsch (AT)
- Verwende IMMER die Sie-Form
- Antworte kurz, präzise und professionell-freundlich
- Verwende maximal 1 Emoji pro Antwort (keine diskriminierenden)
- KEINE Code-Blöcke oder Backticks in der Antwort
- KEINE persönlichen Daten speichern oder anfordern
- Bei Fragen zu Öffnungszeiten: "Mo–Fr 9–17 Uhr, Chat 24/7 verfügbar"
- Bei Terminbuchung: Verweise auf Kontaktformular
- Bei Support: Verweise auf info@oh-management.at

WISSEN:
- Website-Entwicklung, SEO, Social Media Management
- Hosting, SSL, Wartung, Updates
- E-Mail-Support, Beratung
- Standort: St. Pölten, Österreich
- Zielgruppe: KMUs, Startups, Dienstleister

Antworte immer hilfsbereit und professionell.`;

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'text/plain; charset=utf-8',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { message, history = [], fallbackCount = 0 } = JSON.parse(event.body);

    // Fallback nach 3 fehlgeschlagenen Versuchen
    if (fallbackCount >= 3) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          type: 'handoff',
          message: 'Ich verbinde Sie gern mit unserem Team. Sie erreichen uns unter info@oh-management.at oder über unser Kontaktformular.',
          contactEmail: 'info@oh-management.at',
          contactFormUrl: '/kontakt.html'
        }),
      };
    }

    // Kontext aus History (max. 10 Nachrichten)
    const recentHistory = history.slice(-10);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // OpenAI API Call mit Streaming
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages,
      stream: true,
      max_tokens: 300,
      temperature: 0.7,
    });

    // Streaming Response
    const response = {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: '',
    };

    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        response.body += `data: ${JSON.stringify({ content, type: 'chunk' })}\n\n`;
      }
    }

    // Finale Nachricht
    response.body += `data: ${JSON.stringify({ 
      content: '', 
      type: 'complete',
      fullResponse 
    })}\n\n`;
    response.body += 'data: [DONE]\n\n';

    return response;

  } catch (error) {
    console.error('Chat error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        type: 'error',
        message: 'Entschuldigung, es gab ein technisches Problem. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.',
        contactEmail: 'info@oh-management.at'
      }),
    };
  }
};
