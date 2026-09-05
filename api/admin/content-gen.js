// Vercel serverless function: Generate social media posts from Gemini.
import fs from 'fs';
import path from 'path';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', CORS['Access-Control-Allow-Origin']);
    res.setHeader('Access-Control-Allow-Methods', CORS['Access-Control-Allow-Methods']);
    res.setHeader('Access-Control-Allow-Headers', CORS['Access-Control-Allow-Headers']);
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
    if (req.method !== 'POST') {
      res.statusCode = 405; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' })); return;
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const token = req.headers.cookie?.replace('admin_token=', '') || '';
    if (!token || !verifyToken(token)) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Unauthorized' })); return;
    }

    const { brand, topic, channel } = body;
    const config = loadConfig();
    const sys = (config?.aiConsultant?.systemPrompt) || 'You are a social media content generator.';
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (!apiKey) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'GEMINI_API_KEY not set' }));
      return;
    }

    const prompt = `Ты — контент-менеджер «${brand?.name || 'Академия Роста'}» в ${brand?.city || 'Ставрополь'}.
Тон общения: ${config?.contentService?.brandProfile?.tone || 'Дружелюбный, экспертный, тёплый'}.
Цвета бренда: ${config?.contentService?.brandProfile?.colors || ''}.
Канал публикации: ${channel || 'vk'}.

Сгенерируй 5 постов на тему: "${topic}".
Каждый пост должен содержать:
1. Заголовок (короткий, цепляющий)
2. Текст поста (80-150 символов)
3. Hashtags (3-5 штук на русском)
4. CTA (призыв к действию)

Формат вывода: JSON массив объектов { title, text, hashtags, cta }.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const r = await fetch(apiUrl + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
      })
    });

    if (!r.ok) {
      const tb = await r.text();
      console.error('CONTENT err', r.status, tb.slice(0, 400));
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Gemini API error' }));
      return;
    }

    const j = await r.json();
    const parts = j.candidates?.[0]?.content?.parts;
    const text = (parts && parts[0]?.text) ? parts[0].text : '';

    try {
      const posts = JSON.parse(text);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, posts }));
    } catch (e) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, posts: [{ title: 'Пост', text: text, hashtags: ['#психология', '#ставрополь'], cta: 'Записаться — +7(962)42-22-01' }] }));
    }
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
