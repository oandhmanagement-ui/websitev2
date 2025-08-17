import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfiguration
const SITE_URL = 'https://oh-management.at';
const PAGES = [
  '/',
  '/angebot.html',
  '/branchen.html', 
  '/kontakt.html',
  '/ueber-uns.html',
  '/agb.html',
  '/impressum.html',
  '/datenschutz.html'
];

// Hilfsfunktionen
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\säöüßÄÖÜ.,!?()-]/g, '')
    .trim();
}

function extractTextFromHTML(html) {
  // Entferne Scripts, Styles und andere nicht-relevante Tags
  const cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  
  // Extrahiere Text aus HTML
  const text = cleanHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleanText(text);
}

function chunkText(text, maxLength = 1000) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

async function crawlPage(url) {
  try {
    console.log(`Crawling: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const text = extractTextFromHTML(html);
    
    return {
      url,
      title: extractTitle(html),
      content: text,
      chunks: chunkText(text)
    };
    
  } catch (error) {
    console.error(`Error crawling ${url}:`, error.message);
    return null;
  }
}

function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return cleanText(titleMatch[1]);
  }
  
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return cleanText(h1Match[1]);
  }
  
  return 'O&H Management';
}

async function generateEmbeddings(text) {
  // Platzhalter für Embeddings - in Produktion würde hier OpenAI API verwendet
  // Für jetzt: einfacher Hash-basierter Embedding-Simulator
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Simuliere 1536-dimensionale Embeddings (wie OpenAI)
  const embedding = new Array(1536).fill(0).map((_, i) => {
    return Math.sin(hash + i) * 0.1;
  });
  
  return embedding;
}

async function buildRAGIndex() {
  console.log('Starting RAG index build...');
  
  const ragData = [];
  
  // Crawle alle Seiten
  for (const page of PAGES) {
    const fullUrl = `${SITE_URL}${page}`;
    const pageData = await crawlPage(fullUrl);
    
    if (pageData && pageData.content.length > 50) {
      console.log(`Processing ${page}: ${pageData.chunks.length} chunks`);
      
      for (let i = 0; i < pageData.chunks.length; i++) {
        const chunk = pageData.chunks[i];
        const embedding = await generateEmbeddings(chunk);
        
        ragData.push({
          id: `${page}-${i}`,
          title: pageData.title,
          url: fullUrl,
          excerpt: chunk.substring(0, 200) + '...',
          content: chunk,
          embedding: embedding,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  // Speichere RAG Index
  const outputPath = path.join(__dirname, '..', 'data', 'rag.json');
  await fs.writeFile(outputPath, JSON.stringify(ragData, null, 2));
  
  console.log(`RAG index built successfully: ${ragData.length} chunks saved to ${outputPath}`);
  
  return ragData;
}

// Hauptausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  buildRAGIndex()
    .then(() => {
      console.log('RAG build completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('RAG build failed:', error);
      process.exit(1);
    });
}
