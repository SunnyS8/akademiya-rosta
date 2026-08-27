// Vercel serverless function: AI-консультант Центра взаимоотношений GRC (Ставрополь).
// Бэкенд: Google Gemini. Ключ — в переменной окружения GEMINI_API_KEY.
import fs from 'fs';
import path from 'path';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function loadConfig() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

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
    const history = Array.isArray(body.messages) ? body.messages : [];

    const config = loadConfig();
    const brand = (config && config.brand && config.brand.name) || 'Центр взаимоотношений GRC';
    const sys = (config && config.aiConsultant && config.aiConsultant.systemPrompt) ||
      'Ты — дружелюбный AI-консультант. Отвечай кратко и тепло на русском.';

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';

    if (!apiKey) {
      res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ reply: 'Консультант временно недоступен. Оставьте заявку — мы свяжемся с вами.' }));
      return;
    }

    const contents = history
      .filter(m => m && (m.role === 'user' || m.role === 'assistant' || m.role === 'model'))
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] }));

    const r = await fetch(apiUrl + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    });

    if (!r.ok) {
      const tb = await r.text();
      console.error('GEMINI err', r.status, tb.slice(0, 400));
      res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ reply: 'Извините, сейчас не могу ответить. Попробуйте позже или оставьте заявку — мы перезвоним.' }));
      return;
    }
    const j = await r.json();
    const parts = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
    const reply = (parts && parts[0] && parts[0].text)
      ? parts[0].text
      : 'Извините, не удалось подобрать ответ. Оставьте заявку — мы перезвоним.';
    res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reply: reply, brand: brand }));
  } catch (err) {
    console.error('CHAT catch', err && err.message);
    res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reply: 'Не удалось получить ответ. Оставьте заявку — мы свяжемся с вами.' }));
  }
}
