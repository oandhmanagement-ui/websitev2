const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    console.log('Starting scheduled RAG index refresh...');
    
    // Prüfe ob es ein manueller Trigger ist (für Tests)
    const isManual = event.queryStringParameters?.manual === 'true';
    
    // Für echte Scheduled Functions: Prüfe Zeit (1x pro Woche)
    if (!isManual) {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sonntag, 1 = Montag, etc.
      const hour = now.getHours();
      
      // Nur Montags um 2:00 Uhr ausführen
      if (dayOfWeek !== 1 || hour !== 2) {
        console.log('Not the right time for scheduled refresh');
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Scheduled refresh skipped - not the right time' })
        };
      }
    }
    
    // Führe Build Script aus
    const scriptPath = path.join(process.cwd(), 'scripts', 'build-rag.mjs');
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error('Build script not found: ' + scriptPath);
    }
    
    console.log('Executing build script...');
    const result = execSync(`node ${scriptPath}`, { 
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 300000 // 5 Minuten Timeout
    });
    
    console.log('Build script completed successfully');
    console.log('Output:', result);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'RAG index refreshed successfully',
        timestamp: new Date().toISOString(),
        output: result
      })
    };
    
  } catch (error) {
    console.error('Error during RAG refresh:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to refresh RAG index',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
