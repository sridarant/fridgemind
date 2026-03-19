# 🚀 FridgeMind — Deployment Guide

## What's in this project

```
fridgemind/
├── api/
│   └── suggest.js          ← Secure server-side proxy (your API key lives here only)
├── public/
│   └── index.html          ← HTML shell
├── src/
│   ├── index.js            ← React entry point
│   ├── index.css           ← Global styles
│   ├── App.jsx             ← Router (Landing ↔ App)
│   └── pages/
│       ├── Landing.jsx     ← Marketing landing page
│       └── FridgeMind.jsx  ← The meal suggester app
├── package.json
├── vercel.json             ← Vercel deployment config
├── .env.example            ← Copy this to .env for local dev
└── .gitignore
```

---

## Step 1 — Get your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key — you'll need it in Step 4

---

## Step 2 — Push to GitHub

1. Create a free account at https://github.com
2. Create a **new repository** called `fridgemind` (set to Public or Private)
3. Open **Terminal** (Mac/Linux) or **Command Prompt** (Windows) in the fridgemind folder
4. Run these commands one by one:

```bash
git init
git add .
git commit -m "Initial commit — FridgeMind"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fridgemind.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3 — Deploy on Vercel (free)

1. Go to https://vercel.com and sign up with your GitHub account
2. Click **"Add New Project"**
3. Find and select your `fridgemind` repository
4. Vercel auto-detects it as a React app. Click **"Deploy"**

---

## Step 4 — Add your API Key (IMPORTANT)

After deploying:

1. Go to your project dashboard on Vercel
2. Click **Settings** → **Environment Variables**
3. Click **Add New**:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** (paste your API key from Step 1)
   - **Environment:** ✅ Production ✅ Preview ✅ Development
4. Click **Save**
5. Go to **Deployments** → click the three dots on your latest deployment → **Redeploy**

Your app is now live at `https://fridgemind.vercel.app` 🎉

---

## Step 5 — (Optional) Custom Domain

1. In Vercel → **Settings** → **Domains**
2. Enter your domain (e.g. `fridgemind.com`) and follow the DNS instructions
3. Vercel handles HTTPS automatically — no setup needed

---

## Local Development

To run the app locally:

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Then open .env and paste your ANTHROPIC_API_KEY

# 3. Start the dev server
npm start
```

Opens at http://localhost:3000

---

## How the security works

```
Browser → /api/suggest → Vercel Serverless Function → Anthropic API
                              ↑
                    Your API key lives here only.
                    Never exposed to the browser.
```

The frontend never touches the Anthropic API directly. All requests go through the `/api/suggest` serverless function which reads `ANTHROPIC_API_KEY` from Vercel's secure environment variables.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "API key not configured" error | Check Step 4 — make sure you redeployed after adding the env var |
| Build fails on Vercel | Make sure you pushed all files including `vercel.json` |
| Meals not showing | Check the browser console for errors; verify API key is valid |
| Local dev not working | Make sure `.env` file exists with your key |

---

## Updating the app

Any time you push changes to GitHub, Vercel **automatically redeploys** — zero manual steps needed.

```bash
git add .
git commit -m "Your change description"
git push
```

That's it. Vercel picks it up and deploys in ~30 seconds.
