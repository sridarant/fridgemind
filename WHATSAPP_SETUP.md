# Jiff WhatsApp Bot — Setup Guide

## Overview

The Jiff WhatsApp bot lets users get recipe suggestions directly from WhatsApp.
Users send: `"Hi Jiff! rice, dal, onion"` and receive a formatted recipe instantly.

## Prerequisites

1. A Meta Business account
2. A WhatsApp Business number
3. Facebook Developer account
4. Jiff deployed on Vercel with `ANTHROPIC_API_KEY` set

---

## Step 1 — Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **Create App** → **Business** type
3. Add **WhatsApp** product to your app
4. Note down your **App ID** and **App Secret**

## Step 2 — Set up WhatsApp Business number

1. In your Meta app, go to **WhatsApp → Getting Started**
2. Add a phone number (or use the test number)
3. Note your **Phone Number ID** and **WhatsApp Business Account ID**
4. Generate a **Permanent Access Token** (System User token — don't use temporary)

## Step 3 — Configure webhook

1. In your Meta app → **WhatsApp → Configuration → Webhook**
2. Set **Callback URL**: `https://jiff-ecru.vercel.app/api/whatsapp`
3. Set **Verify Token**: `jiff-whatsapp-2026` (or your custom value)
4. Subscribe to webhook fields: `messages`
5. Click **Verify and Save**

## Step 4 — Add Vercel env vars

In Vercel dashboard → Settings → Environment Variables:

```
WHATSAPP_ACCESS_TOKEN=<your permanent access token>
WHATSAPP_VERIFY_TOKEN=jiff-whatsapp-2026
WHATSAPP_PHONE_NUMBER_ID=<your phone number ID>
```

Redeploy after adding.

## Step 5 — Test

Send a message to your WhatsApp Business number:
```
Hi Jiff! rice, dal, onion
```

You should receive a formatted recipe within 5–10 seconds.

---

## Supported message formats

| User sends | Jiff understands |
|---|---|
| `Hi Jiff! rice, dal, onion` | Extracts: rice, dal, onion |
| `What can I make with chicken and tomatoes?` | Extracts: chicken, tomatoes |
| `Suggest a recipe with paneer` | Extracts: paneer |
| `How are you?` | Sends help message |

## Help message

If Jiff doesn't recognise the message as a recipe request, it sends:

> 👋 Hi! I'm **Jiff**, your AI cooking assistant.
> Send me: **"Hi Jiff! rice, dal, onion"**
> For more: https://jiff-ecru.vercel.app

---

## Limitations

- WhatsApp Cloud API free tier: 1,000 conversations/month (per business number)
- Jiff uses claude-haiku for WhatsApp responses (fast, low cost)
- Currently supports text messages only (no image ingredient detection via WhatsApp)
- For image scanning, users should use the web app

## Going live

To move from test to production:
1. Submit your Meta app for **Business Verification**
2. Request the **WhatsApp Business API** production access
3. Agree to WhatsApp's Business Policy

---
