// Vercel serverless function: заявки Центра взаимоотношений GRC → Telegram + Google Таблица.
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

    const name = (body.name || '').toString().trim() || '-';
    const phone = (body.phone || '').toString().trim() || '-';
    const event = (body.event || '').toString().trim() || '-';
    const note = (body.note || '').toString().trim() || '-';

    const config = loadConfig();
    const brand = (config && config.brand && config.brand.name) || 'Центр взаимоотношений GRC';
    const city = (config && config.brand && config.brand.city) || '';

    // Поля, совместимые с таблицей лидов:
    // Тип мероприятия | Тема | Тренер | Дата | ФИО | Телефон | Обратная связь | Примечания
    const type = 'Заявка с сайта' + (city ? ' (' + city + ')' : '');

    const token = process.env.BOT_TOKEN;
    const chat = process.env.OWNER_CHAT_ID;
    const api = process.env.BOT_API || 'https://api.telegram.org';

    const text =
      '🔔 ' + type + ' — ' + brand + '\n' +
      '👤 ' + name + '\n' +
      '📞 ' + phone + '\n' +
      '🎯 ' + event + '\n' +
      '💬 ' + note;

    if (token && chat) {
      try {
        await fetch(api + '/bot' + token + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chat, text: text, parse_mode: 'HTML' })
        });
      } catch (e) { console.error('LEAD tg err', e && e.message); }
    }

    const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
    if (sheetsUrl) {
      try {
        await fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            values: [type, event, '', new Date().toISOString().slice(0, 10), name, phone, '', note]
          })
        });
      } catch (e) { console.error('LEAD sheets err', e && e.message); }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, dbg: { token: !!token, chat: !!chat, sheets: !!sheetsUrl } }));
  } catch (err) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'HANDLER_ERR', message: String(err && err.message || err) }));
  }
}
