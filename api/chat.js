// Vercel serverless function: AI-консультант «Академия Роста».
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

    console.error('CHAT raw body type=', typeof req.body);
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    console.error('CHAT parsed=', JSON.stringify(body).slice(0, 200));
    const history = Array.isArray(body.messages) ? body.messages : [];

    const SYSTEM_PROMPT = [
      'Ты — AI-консультант психологического центра «Академия Роста» (Ставрополь).',
      'Помогаем родителям и детям/подросткам 8–15 лет снять конфликты и раскрыть личную силу.',
      'Набор на сентябрь, первая встреча бесплатно. Отвечай тепло, кратко, на русском.',
      'Если хотят записаться — предложи нажать кнопку «Записаться на сентябрь».'
    ].join(' ');

    const apiKey = process.env.AI_API_KEY;
    const baseUrl = (process.env.AI_API_URL || 'https://api.hubris.pw/v1').replace(/\/$/, '');
    const apiUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : baseUrl + '/chat/completions';
    const envModel = process.env.AI_MODEL || '';
    const model = envModel.includes('/') ? envModel : 'hubris/free';
    console.error('CHAT key?', !!apiKey, 'url=', apiUrl, 'model=', model);

    if (!apiKey) {
      res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ reply: 'Консультант временно недоступен. Оставьте заявку — мы свяжемся с вами.' }));
      return;
    }

    console.error('CHAT calling openai...');
    const r = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(history),
        temperature: 0.5, max_tokens: 400
      })
    });
    console.error('CHAT openai status=', r.status);
    if (!r.ok) {
      const tb = await r.text();
      console.error('CHAT openai errbody=', tb.slice(0, 400));
      res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ reply: 'Извините, сейчас не могу ответить. Попробуйте позже или оставьте заявку — мы перезвоним.' }));
      return;
    }
    const j = await r.json();
    const reply = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content)
      ? j.choices[0].message.content
      : 'Извините, не удалось подобрать ответ. Оставьте заявку — мы перезвоним.';
    res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reply: reply }));
  } catch (err) {
    console.error('CHAT catch=', err && err.message);
    res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reply: 'Не удалось получить ответ. Оставьте заявку — мы свяжемся с вами.' }));
  }
}
