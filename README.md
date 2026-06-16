# CodeSense — AI Code Review Agent

## Quick Setup (Windows)

### Step 1 — Install Node.js and pnpm
- Download Node.js 20+ from https://nodejs.org and install it
- Open PowerShell and run: `npm install -g pnpm`

### Step 2 — Install project dependencies
Open PowerShell in this folder and run:
```
pnpm install
```

### Step 3 — Get your free API keys

**Neon (free Postgres database):**
1. Go to https://neon.tech and sign up
2. Create a new project
3. Click **Connect** on the dashboard
4. Copy the connection string (starts with `postgresql://`)

**Gemini API key (free AI):**
1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API key**
3. Copy the key

### Step 4 — Create your .env file
Inside VS Code, go to `artifacts/api-server/` and create a file called `.env`

Copy the content from `.env.example` and fill in your values:
```
NEON_DATABASE_URL=postgresql://your_neon_url_here
GEMINI_API_KEY=your_gemini_key_here
PORT=8080
```

### Step 5 — Set up the database
Double-click **SETUP-DATABASE.bat**

You should see: `[✓] Changes applied`

### Step 6 — Start the app
- Double-click **START-API.bat** (keep this window open)
- Double-click **START-FRONTEND.bat** (keep this window open)

### Step 7 — Open in browser
Go to: **http://localhost:5173**

---

## How to use CodeSense

1. Click **New Review** in the sidebar
2. Paste any code (JavaScript, Python, TypeScript, etc.)
3. Select the language and give it a title
4. Click **Submit** — Gemini AI reviews your code in seconds
5. Accept ✓ or reject ✗ each suggestion to train the Memory

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pnpm not found` | Run `npm install -g pnpm` in PowerShell |
| `NEON_DATABASE_URL not found` | Check your `.env` file is in `artifacts/api-server/` |
| API not connecting | Make sure START-API.bat is running (port 8080) |
| Page not loading | Make sure START-FRONTEND.bat is running, then open http://localhost:5173 |
