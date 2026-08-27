// Vercel serverless function: пересылает заявки с лендинга «Академия Роста»
// в Telegram и (опц.) в Google Таблицу.
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

    console.error('LEAD raw body type=', typeof req.body);
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    console.error('LEAD parsed=', JSON.stringify(body).slice(0, 200));

    const name = body.name || '-';
    const phone = body.phone || '-';
    const event = body.event || '-';
    const note = body.note || '-';
    const source = body.source || 'site';

    const token = process.env.BOT_TOKEN;
    const chat = process.env.OWNER_CHAT_ID;
    const api = process.env.BOT_API || 'https://api.telegram.org';

    const text =
      '🔔 Новая заявка (Академия Роста)\n' +
      '👤 ' + name + '\n' + '📞 ' + phone + '\n' +
      '🎯 ' + event + '\n' + '💬 ' + note + '\n' + '🌐 ' + source;

    if (token && chat) {
      try {
        await fetch(api + '/bot' + token + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chat, text: text })
        });
      } catch (e) { console.error('LEAD tg err', e && e.message); }
    }

    const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
    if (sheetsUrl) {
      try {
        await fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: new Date().toISOString(), name, phone, event, note, source })
        });
      } catch (e) { console.error('LEAD sheets err', e && e.message); }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, dbg: { token: !!token, chat: !!chat, sheets: !!sheetsUrl } }));
  } catch (err) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'HANDLER_ERR', message: String(err && err.message || err), stack: String((err && err.stack) || '').slice(0, 600) }));
  }
}
