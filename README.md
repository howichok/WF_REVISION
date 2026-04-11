# Walthamforest revision website

## Local development (with login)

You do not need to deploy to production to use the app or sign in. Run it on your machine with your existing Supabase project.

### 1. Prerequisites

- Node.js 20 or newer (matches `package.json` engines if present; LTS is fine)
- A [Supabase](https://supabase.com) project (same one you use in production is OK)

### 2. Environment variables

Copy the example file and fill in real values:

```bash
copy .env.example .env.local
```

On macOS or Linux:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **anon** / **publishable** public key (not the service role key) |
| `NEXT_PUBLIC_APP_URL` | Set to `http://localhost:3000` so email confirmation and password reset links point at your dev server |

If `NEXT_PUBLIC_APP_URL` is missing, the app falls back to the browser origin when you are already on the site, but magic links in email still need a correct app URL for local testing.

### 3. Supabase Auth URLs for localhost

In the Supabase dashboard: **Authentication → URL configuration**

1. **Site URL** — for local work you can use `http://localhost:3000`, or keep production and rely on redirect allow list (see below).
2. **Redirect URLs** — add at least:

   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**` (wildcard is convenient for `?next=` paths)

Without these, OAuth / email link sign-in will redirect to the wrong host or be rejected.

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), go to **Auth**, and sign in or sign up as usual.

### 5. Optional: curriculum seed against local DB

If you use `npm run seed:curriculum`, set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (server-only; never commit it). See comments in `.env.example`.

### Troubleshooting

- **“Supabase is not configured”** — `.env.local` is missing or variable names/values are wrong; restart `npm run dev` after changes.
- **Redirect / invalid link after email** — check `NEXT_PUBLIC_APP_URL` and Supabase redirect URLs above.
- **Port in use** — run on another port, e.g. `npx next dev -p 3001`, and set `NEXT_PUBLIC_APP_URL` to the same origin.
