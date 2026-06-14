# QR Code Genie — Shopify App

A beautiful QR code generator with live preview, customization, and Shopify integration.

## Quick Start

### 1. Create your app in Shopify Partners

1. Go to https://partners.shopify.com and log in
2. Click **Apps** → **Create app**
3. Choose **Public app**
4. Name it: **QR Code Genie**
5. Under **Configuration**, set:
   - **App URL**: `https://your-app-domain.com` (you'll get this after deploying)
   - **Allowed redirection URL(s)**: `https://your-app-domain.com/auth/callback`
6. Under **API access**, note down:
   - **API key**
   - **API secret key**
7. Under **Scopes**, select: `read_products`, `write_products` (add `read_discounts` if needed)

### 2. Deploy to Railway (easiest — free tier)

1. Go to https://railway.app and sign up (GitHub login)
2. Click **New Project** → **Deploy from GitHub repo**
3. Push this project to a GitHub repo:
   ```bash
   # Create a new repo on GitHub, then:
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/qr-code-genie.git
   git push -u origin main
   ```
4. Railway will auto-detect the Dockerfile
5. Add environment variables (**Settings** → **Variables**):
   - `SHOPIFY_API_KEY` = your app's API key
   - `SHOPIFY_API_SECRET` = your app's API secret
   - `SHOPIFY_APP_URL` = `https://your-app-name.up.railway.app`
   - `SCOPES` = `read_products,write_products`
6. Railway will give you a URL like `https://qr-code-genie.up.railway.app`
7. Update your Shopify app's **App URL** and **Redirection URL** with this URL

### 3. Set up billing

1. In Shopify Partners, go to your app → **Plans**
2. Create a plan:
   - **Plan name**: `Pro Plan`
   - **Price**: $5/month
   - **Trial**: 3 days
3. This must match the plan name in the code (`Pro Plan`)

### 4. Install and test

1. In Shopify Partners, go to your app → **Overview**
2. Click **Test on store** and select a development store
3. The OAuth flow will run, and you'll see the QR code generator

### 5. Submit to App Store

1. In Shopify Partners → your app → **Distribution**
2. Fill in all required information:
   - Description, screenshots, icon, category
   - Developer contact info
   - Privacy policy URL (can use a free policy generator)
3. Under **App availability**, set to **Public**
4. Click **Submit for review**

## Features

- **Free tier**: Basic QR codes (standard style, basic colors, PNG download)
- **Pro tier ($5/month)**: Custom dot styles, corner styles, logo upload, high-res download (1024px), SVG export
- **Shopify integration**: Generate QR codes for products directly from your store catalog

## Development

```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Start the server
SHOPIFY_API_KEY=xxx SHOPIFY_API_SECRET=xxx SHOPIFY_APP_URL=https://example.com npm start
```

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- qr-code-styling
- Express.js
- Shopify API
