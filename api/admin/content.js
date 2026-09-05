// Vercel serverless function: Admin GET/PUT site content.
import fs from 'fs';
import path from 'path';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', CORS['Access-Control-Allow-Origin']);
    res.setHeader('Access-Control-Allow-Methods', CORS['Access-Control-Allow-Methods']);
    res.setHeader('Access-Control-Allow-Headers', CORS['Access-Control-Allow-Headers']);
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

    const token = req.headers.cookie?.replace('admin_token=', '') || '';
    if (!token || !verifyToken(token)) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Unauthorized' })); return;
    }

    const config = loadConfig();

    if (req.method === 'GET') {
      const content = {
        brand: config.brand || {},
        contacts: config.contacts || {},
        aiConsultant: config.aiConsultant || {},
        contentService: config.contentService || {},
        programs: config.programs || []
      };
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, content }));
      return;
    }

    if (req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      body = body || {};

      // Update config.json fields (for future redeploy or static build)
      const updated = { ...config, ...body };

      // Also forward to Google Sheets if configured
      const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
      if (sheetsUrl && body.programs) {
        try {
          await fetch(sheetsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [['programs', JSON.stringify(body.programs)]] })
          });
        } catch (e) { console.error('ADMIN sheets err', e && e.message); }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, content: updated }));
      return;
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'HANDLER_ERR', message: String(err && err.message || err) }));
  }
}

function verifyToken(token) {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString());
    return data.admin && data.exp > Date.now();
  } catch (e) { return false; }
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8');
    return JSON.parse(raw);
  } catch (e) { return null; }
}
