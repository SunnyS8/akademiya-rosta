# Аудит сайта Академия Роста (Ставрополь)

**URL:** https://akademiya-rosta-tau.vercel.app
**Дата:** 2026-08-27
**Метод:** навыки `seo-onpage`, `accessibility-audit`, `qa-testing` (статический разбор исходника + проверка живого деплоя).
**Охват:** одна страница (SPA: home / lyubit / programs / schedule / about / contact).

---

## 1. Executive summary

| Область | Оценка | Главное |
|---|---|---|
| SEO on-page | Нужна работа | нет schema, canonical, city в title; 4+ `<h1>` в DOM |
| SEO technical | Fail | нет robots/sitemap, нет security-headers |
| Доступность (WCAG 2.1 AA) | Хорошо / минор | контраст `--muted` 4.3:1, нет aria-live у чата/ошибок |
| QA (standard/full) | Нужна работа | нет og:image, twitter:card, canonical; формы с лейблами — ок |

Функционал (AI-чат на Gemini, лиды в Telegram) **работает** — env-ключи в Vercel заданы.

---

## 2. SEO — on-page (8 измерений)

1. **Title** — `Академия Роста — Психологический Центр` (35 симв.). ✗ Нет локации «Ставрополь» и целевого запроса. «Центр» с большой буквы середине предложения — опечатка. → «Академия Роста — психологический центр в Ставрополе».
2. **Meta description** — ~150 симв., содержательная, с CTA. ✓ (можно добавить город).
3. **Header structure** — ✗ **4+ `<h1>` в одном DOM** (home L881, lyubit L1138, programs L1367, schedule L1495, about L1588, contact). Должен быть ровно один `<h1>` (главная); заголовки под-страниц сделать `<h2>`.
4. **Body content** — ✓ программы, методология, отзывы, УТП описаны.
5. **Internal links** — ◐ SPA: все ссылки `href="#"` + `onclick`, реальных URL нет → поиск не строит внутренний вес между разделами. Для одностраничника допустимо, но тематические страницы не индексируются отдельно.
6. **Images** — ✓ `<img>` нет (только favicon data-URI), alt-проблем нет; но нет изображений = беднее rich-results и нет `og:image`.
7. **URL slug** — ✓ корень домена.
8. **On-page schema** — ✗ **Нет JSON-LD**. Критично для локального бизнеса → добавить `LocalBusiness`/`ProfessionalService` (name, address, phone, geo, priceRange, hours, sameAs VK/Telegram, description).

### SEO technical (деплой)
- ✗ `robots.txt` → 404; ✗ `sitemap.xml` → 404.
- ✗ Security-заголовки отсутствуют (`strict-transport-security`, `x-frame-options`, `x-content-type-options`). HTTPS — есть (Vercel).

---

## 3. Доступность (WCAG 2.1 AA)

**Perceivable**
- ✓ `lang="ru"` задан.
- ✓ альтернативный текст не нужен (нет смысловых `<img>`).
- △ Контраст `--muted` (#7A7068) на `--cream` (#F5F0E8) ≈ **4.3:1** — FAIL для обычного текста (нужно 4.5), PASS для крупного. Чуть затемнить `--muted` (→ ~#6E655C) или использовать только для крупного.
- ✓ `sage-dark` на cream ≈ 4.9:1 — ок. Проверить, не используется ли `--sage` (#7A9E7E, 2.6:1) как текст на светлом.

**Operable**
- ✓ Клавиатура: навигация/кнопки активируются Enter; `nav-toggle` имеет `aria-label`, `aria-expanded`, `aria-controls`.
- △ Фокус при смене «страницы» (SPA) не переносится на заголовок новой страницы (P2).
- ○ Нет skip-link (P3).

**Understandable**
- ✓ Формы имеют `<label>` (lyubit L1291+, main L1658+).
- △ Ошибки формы (`form-error`) и сообщения чата не анонсируются (нет `aria-live`) (P2).

**Robust**
- △ Контейнер сообщений чата `#chatMessages` не `aria-live` → статус не объявляется скринридеру (P2).

---

## 4. QA (standard + full)

| Чек | Результат |
|---|---|
| Title 30–60 | ✓ |
| Canonical | ✗ отсутствует |
| Meta description 120–160 | ✓ |
| og:image / og:title / twitter:card | ✗ og:image и twitter:card отсутствуют; og:title есть |
| H2 присутствуют | ✓ |
| external `target=_blank` + `rel=noopener` | ✓ (VK/Telegram) |
| `lang` задан | ✓ |
| Favicon | ✓ |
| robots.txt / sitemap.xml | ✗ 404 |
| Security headers | ✗ отсутствуют |
| HTTPS / mixed content | ✓ |

Сайт живой: `/api/chat` генерирует ответ (Gemini), `/api/lead` → `{"ok":true,"dbg":{"token":true}}` (лид в Telegram). `GOOGLE_SHEETS_URL` не задан → в Google-таблицу лиды пока не пишутся.

---

## 5. Приоритетный план исправлений

**Critical (P0)**
- C1. Добавить `LocalBusiness` JSON-LD (имя, адрес, телефон, гео, цены, `sameAs`).
- C2. Добавить `robots.txt` + `sitemap.xml` (или `vercel.json` rewrite) и canonical.

**Important (P1)**
- I1. Title: добавить «Ставрополь» + исправить регистр.
- I2. Единственный `<h1>` в DOM (под-страницы → `<h2>`).
- I3. `og:image` + `twitter:card` (картинка для шеров).
- I4. Security-заголовки через `vercel.json`.
- I5. Контраст `--muted` до ≥4.5:1.

**Minor (P2/P3)**
- M1. `aria-live` на `#chatMessages` и `.form-error`.
- M2. Перенос фокуса на заголовок при смене SPA-страницы.
- M3. Skip-link.
- M4. Проверить использование `--sage` как текста.

---

## 6. Что уже хорошо
- Реальные данные (программы, цены, контакты, отзывы) на месте.
- Формы с лейблами, external-ссылки с `noopener`, `lang` задан.
- AI-консультант и приём лидов функционируют на проде.

**Готов исправить всё из раздела 5 правками в `index.html` + добавлением `vercel.json` и `LocalBusiness` JSON-LD. Подтверди — и приступаю.**
