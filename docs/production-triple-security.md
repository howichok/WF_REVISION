# Production “triple” setup: HTTPS + Cloudflare + optional site gate

This matches what the app actually enforces in code, plus what you configure outside the repo (DNS / CDN).

## Netlify (quick path)

1. **Create the site** — [Netlify](https://www.netlify.com/) → *Add new site* → *Import an existing project* → pick this repo. Leave the default **Next.js** preset if Netlify detects it (it runs `next build` and uses the Next runtime).
2. **Environment variables** — *Site configuration* → *Environment variables* → add everything you use locally (`NEXT_PUBLIC_SUPABASE_`*, `NEXT_PUBLIC_APP_URL`, optional `GEMINI_*`, optional `SITE_GATE_PASSWORD` / `SITE_GATE_SECRET`, etc.). Use your real **https** site URL for `NEXT_PUBLIC_APP_URL` (and `NEXT_PUBLIC_SITE_URL` if you use it).
3. **Deploy** — trigger a deploy; fix any build errors shown in the deploy log.
4. **HTTPS on Netlify** — *Domain management* → *Add domain* → connect `your-domain.com`. Netlify issues a **Let’s Encrypt** certificate automatically once DNS points here. In the browser you should see **https://** and a valid cert (lock icon).
5. **Optional site gate** — same variables as everywhere else: set `SITE_GATE_PASSWORD` (and recommended `SITE_GATE_SECRET`) only in Netlify’s env UI, not in Git. Users who are not bypass paths hit `/site-access` first.
6. **HSTS** — on Netlify builds the variable `NETLIFY=true` is set; this repo turns on **Strict-Transport-Security** in `next.config.ts` when `NETLIFY` or `VERCEL` is detected, or when you set `ENABLE_HSTS=1`. Do not set `ENABLE_HSTS=1` until HTTPS works end-to-end.
7. **Supabase** — in the Supabase dashboard, add production URLs: `https://your-domain.com` and `https://your-domain.com/auth/callback` (and any wildcard you use for `?next=`), same as for Vercel.

### Netlify + Cloudflare together

You usually keep **one** TLS “front”: either Netlify terminates HTTPS, or Cloudflare does in front of Netlify.


| Approach                                          | DNS                                                                                                                                                      | Notes                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — DNS only at Cloudflare (grey cloud)**       | Point `CNAME` for `@` / `www` to Netlify’s hostname (e.g. `your-site.netlify.app` or the value from *Domain settings*). Turn proxy **off** (grey cloud). | Simplest: Cloudflare is just DNS; **HTTPS is entirely on Netlify**. You can still use Cloudflare for registrar / DNS UI; WAF and “orange cloud” features **do not** apply unless you proxy.                                                                          |
| **B — Proxied through Cloudflare (orange cloud)** | Same hostname, proxy **on**.                                                                                                                             | Use **SSL/TLS → Full (strict)** so Cloudflare connects to Netlify over **HTTPS** (Netlify already serves a valid cert on `*.netlify.app` / your custom hostname). Enable **Always Use HTTPS** and WAF/bot options in Cloudflare if you want the “second layer” here. |


If something loops or shows SSL errors, check Cloudflare SSL mode (avoid **Flexible**) and Netlify’s [custom domains / HTTPS docs](https://docs.netlify.com/domains-https/https-ssl/).

---

## 1. HTTPS on the host (TLS end‑to‑end)

**Goal:** browsers always use `https://` and see a valid certificate.


| Where you host        | What to do                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**            | Add your custom domain under the project; Vercel issues TLS automatically. Point DNS as they show (often `CNAME` to `cname.vercel-dns.com`). |
| **Netlify**           | *Domain management* → add the domain; point DNS at Netlify; Let’s Encrypt is provisioned automatically.                                      |
| **Other Node host**   | Terminate TLS at the load balancer or reverse proxy (nginx, Caddy, etc.) with a real certificate.                                            |
| **Behind Cloudflare** | Prefer **SSL/TLS → Full (strict)** so Cloudflare talks to your origin over HTTPS with a valid origin cert. Avoid **Flexible**.               |


**In this repo:** in production, middleware redirects `http` → `https` when the request has `x-forwarded-proto: http` (common behind proxies). Localhost is skipped.

**App URLs:** for example:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

In **Supabase → Authentication → URL configuration**, add your production **Site URL** and **Redirect URLs** (including `https://your-domain.com/auth/callback` and any wildcard you use in dev).

---

## 2. Cloudflare in front of the domain (edge filter + WAF)

**Goal:** DNS goes through Cloudflare’s proxy so you get DDoS mitigation, optional WAF, bot heuristics, and TLS at the edge.

Short version: proxy **on** (orange cloud) → record points to Netlify/Vercel → **SSL/TLS = Full (strict)** → **Always Use HTTPS** → optional **Bots** / **WAF**. Details in **§5** below (Russian step-by-step).

Nothing in Git replaces this: WAF rules live in the Cloudflare dashboard.

---

## 5. Настройка Cloudflare — пошагово (пункт «5» из чеклиста)

Сделать это нужно **вручную в панели Cloudflare** (аккаунт и домен — твои). Код репозитория Cloudflare не «подключает»: только DNS и переключатели.

### Перед Cloudflare

- Сайт уже деплоится (например **Netlify**), домен добавлен там, в браузере открывается **https://…** без ошибок (как в § «Netlify» выше). Так проще не словить SSL‑цикл между Cloudflare и origin.

### Шаги в Cloudflare

1. **Добавить сайт** — [dash.cloudflare.com](https://dash.cloudflare.com) → *Add a Site* / *Add an existing domain* → ввести домен (например `example.com`).
2. **Передать DNS на Cloudflare** — Cloudflare покажет **два nameserver** (например `xxx.ns.cloudflare.com`). В панели **регистратора домена** (где куплен домен) замени NS на эти два. Смена может занять до нескольких часов.
3. **DNS‑записи** — вкладка **DNS** → **Records**:
  - Для **www**: тип **CNAME**, имя `www`, цель — тот хост, который дал **Netlify** (например `something.netlify.app`) или CNAME с Vercel. Включи **прокси** (оранжевое облако ☁️).
  - Для **корня @**: либо **CNAME** на тот же Netlify‑хост (Cloudflare умеет «flatten» для apex на многих планах), либо запись по инструкции Netlify. Прокси **включён**, если хочешь WAF/фильтр на этом имени.
4. **SSL/TLS → Overview** — режим **Full (strict)**. Не используй **Flexible** (иначе трафик Cloudflare → хост может идти по HTTP и ломается модель безопасности).
5. **SSL/TLS → Edge Certificates** — включи **Always Use HTTPS** (дополнительный редирект на HTTPS на границе Cloudflare).
6. **Security → Bots** — на бесплатном плане часто доступен **Bot Fight Mode**; включи, если устраивает более жёсткая фильтрация ботов (иногда ложные срабатывания у редких клиентов).
7. **Security → WAF** — на платных планах подключаются **Managed rules**; на Free набор ограничен и меняется у Cloudflare — открой раздел и включи то, что доступно без апгрейда (если блок пустой, опора на DDoS‑защиту и Bot Fight уже даёт «второй слой»).
8. **Проверка** — открой сайт в режиме инкогнито: в адресной строке **https://**, замочек, страница грузится. Если **SSL handshake error** или цикл редиректов — снова проверь шаг 4 и что на Netlify домен в статусе с валидным сертификатом.

Если нужен только DNS у Cloudflare без WAF — оставь запись с **серым облаком** (DNS only); тогда пункт «5» по смыслу не выполняется, а HTTPS остаётся на Netlify (см. таблицу выше).

---

## После пункта 5: какие защиты у сайта есть

Ниже — **что даёт Cloudflare** после оранжевого облака + настроек выше, и **что уже заложено в приложении** (код / контент).

### Со стороны Cloudflare (после того как ты сделал §5)


| Что                                        | Зачем                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| TLS на первом прыжке (клиент ↔ Cloudflare) | Шифрование на входе, сертификат на домене.                                             |
| **Full (strict)** к origin                 | Cloudflare ходит к Netlify/Vercel по **HTTPS** с проверкой сертификата origin.         |
| **Always Use HTTPS**                       | Принудительный HTTPS на границе CDN.                                                   |
| Сеть Cloudflare                            | Базовая **анти‑DDoS** на уровне прокси (как у них заявлено для проксируемого трафика). |
| **Bot Fight / WAF** (если включил)         | Доп. фильтрация ботов и (на планах с WAF) правила веб‑фаервола.                        |


### Уже в этом репозитории (не зависит от Cloudflare)


| Что                                                                                                    | Где                                                                               |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Редирект **HTTP → HTTPS** в production (по `x-forwarded-proto`)                                        | `src/middleware.ts`                                                               |
| Заголовки **X-Content-Type-Options**, **X-Frame-Options**, **Referrer-Policy**, **Permissions-Policy** | `next.config.ts`                                                                  |
| **HSTS** (`Strict-Transport-Security`) на **Vercel** / **Netlify** или при `ENABLE_HSTS=1`             | `next.config.ts`                                                                  |
| Опциональный **пароль на весь сайт** (`SITE_GATE_PASSWORD` + cookie)                                   | `src/middleware.ts`, `src/app/api/site-gate`, `/site-access`                      |
| **Футер**: короткий privacy‑текст + ссылки **Privacy notice** и **Disclaimer**                         | `src/components/layout/site-footer.tsx`, подключён в `src/app/layout.tsx`         |
| Страницы **Privacy notice** и **Disclaimer** (отдельный текст, в т.ч. независимость от колледжа)       | `src/app/(app)/legal/privacy/page.tsx`, `src/app/(app)/legal/disclaimer/page.tsx` |


Итого: **п.5 (Cloudflare)** ты делаешь сам в панели; после этого к уже существующим защитам в коде добавляется **край Cloudflare** (TLS, редиректы, DDoS на их стороне, опционально боты/WAF). Юридически/прозрачность для IT — **футер + `/legal/*`**.

---

## 3. Optional site gate (shared password)

Set **only on the server** (Netlify: *Site configuration* → *Environment variables*; Vercel: same idea):

```env
SITE_GATE_PASSWORD=choose-a-strong-shared-secret
SITE_GATE_SECRET=long-random-string-used-as-hmac-key
```

- If `SITE_GATE_PASSWORD` is **unset** or empty, the gate is **off**.
- `SITE_GATE_SECRET` is **strongly recommended** when the gate is on.

**Bypass without gate cookie:** `/legal/*`, `/auth/*`, `/site-access`, `/api/site-gate`, `/api/health/*` — see `src/middleware.ts`.

---

## 4. HSTS (Strict‑Transport‑Security)

In `next.config.ts`, HSTS is sent when `**VERCEL=1`**, `**NETLIFY=true**` (Netlify’s default during build/deploy), or `**ENABLE_HSTS=1**`.

Do **not** set `ENABLE_HSTS=1` until HTTPS works for every path you care about.

---

## Search engines: hide the site (staging / private prod)

This project is **Next.js**, not a static `index.html` tree. You do **not** hand-edit `public/robots.txt` — Next serves `**/robots.txt`** from `src/app/robots.ts`.

When `**BLOCK_SEARCH_INDEXING=1**` is set at **build time** (Netlify / Vercel environment variables):


| Mechanism         | What happens                                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `**/robots.txt`** | `User-agent: *` + `Disallow: /` (generated by `robots.ts`).                                                                         |
| **HTTP header**   | Every route gets `X-Robots-Tag: noindex, nofollow` from `next.config.ts` — same role as Netlify’s `**_headers`** file for this tag. |


**Netlify:** `netlify.toml` sets `BLOCK_SEARCH_INDEXING=1` automatically for **Deploy Previews** (PR preview URLs). Production deploys from `main` stay indexable unless you add `BLOCK_SEARCH_INDEXING=1` for the **Production** context in the Netlify UI.

**Why Google can still show old snippets:** crawlers revisit on their own schedule; after `noindex` + `Disallow`, removal usually takes days–weeks. Request removal in [Google Search Console](https://search.google.com/search-console) if the property is verified.

**Raw `public/_headers` on Netlify:** optional duplicate if you prefer; with Next, the `next.config` header is enough so we avoid two sources of truth.

---

## Quick checklist

- Custom domain shows **HTTPS** + valid cert (Netlify/Vercel dashboard green / browser lock).
- **§5 Cloudflare:** NS у регистратора → DNS записи на origin → оранжевое облако (если нужен WAF/фильтр) → **Full (strict)** → **Always Use HTTPS** → по желанию Bots / WAF.
- `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` use **https**.
- Supabase auth URLs include production **https** callbacks.
- (Optional) `SITE_GATE_PASSWORD` + `SITE_GATE_SECRET` in the host’s env UI.
- (Self‑hosted HTTPS, not Vercel/Netlify) `ENABLE_HSTS=1` only after TLS is verified.
- Staging / private prod: `BLOCK_SEARCH_INDEXING=1` (or rely on Netlify Deploy Preview default in `netlify.toml`).

