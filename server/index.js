import 'dotenv/config'
import express from 'express'
import compression from 'compression'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import '@shopify/shopify-api/adapters/node'
import { shopifyApi, ApiVersion, LogSeverity, BillingInterval, BillingReplacementBehavior } from '@shopify/shopify-api'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL, SCOPES, PORT } = process.env

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_APP_URL) {
  console.error('Missing SHOPIFY_API_KEY, SHOPIFY_API_SECRET, or SHOPIFY_APP_URL')
  process.exit(1)
}

const sessions = new Map()

const shopify = shopifyApi({
  apiKey: SHOPIFY_API_KEY,
  apiSecretKey: SHOPIFY_API_SECRET,
  scopes: (SCOPES || 'read_products,write_products').split(','),
  hostName: new URL(SHOPIFY_APP_URL).hostname.replace('https://', ''),
  hostScheme: 'https',
  apiVersion: ApiVersion.July25,
  isEmbeddedApp: true,
  logLevel: LogSeverity.Warning,
  billing: {
    'Pro Plan': {
      amount: 5,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
      replacementBehavior: BillingReplacementBehavior.ApplyImmediately,
      trialDays: 3,
    },
  },
})

const app = express()
app.use(compression())
app.use(express.json())

app.use('/assets', express.static(path.join(__dirname, '..', 'dist', 'assets')))

function serveIndex(req, res) {
  const filePath = path.join(__dirname, '..', 'dist', 'index.html')
  if (!fs.existsSync(filePath)) return res.status(500).send('Frontend not built. Run: npm run build')
  let html = fs.readFileSync(filePath, 'utf-8')
  html = html.replace('__SHOPIFY_API_KEY__', SHOPIFY_API_KEY)
  res.send(html)
}

app.get('/', serveIndex)

app.get('/auth', async (req, res) => {
  const shop = req.query.shop
  if (!shop) return res.status(400).send('Missing shop')
  try {
    await shopify.auth.begin({ shop, callbackPath: '/auth/callback', isOnline: false, rawRequest: req, rawResponse: res })
  } catch (err) {
    console.error('Auth error:', err)
    res.status(500).send('Auth failed')
  }
})

app.get('/auth/callback', async (req, res) => {
  try {
    const { session } = await shopify.auth.callback({ rawRequest: req, rawResponse: res })
    const sid = shopify.session.getOfflineId(session.shop)
    sessions.set(sid, session)
    const host = req.query.host
    res.redirect(`/?host=${host}&shop=${session.shop}`)
  } catch (err) {
    console.error('Auth callback error:', err)
    res.status(500).send('Auth callback failed')
  }
})

app.get('/api/config', (req, res) => {
  res.json({ apiKey: SHOPIFY_API_KEY })
})

app.get('/api/products', async (req, res) => {
  const { shop, limit } = req.query
  if (!shop) return res.status(400).json({ error: 'Missing shop' })
  const sid = shopify.session.getOfflineId(shop)
  const session = sessions.get(sid)
  if (!session) return res.status(401).json({ error: 'App not installed' })
  try {
    const client = new shopify.clients.Rest({ session })
    const response = await client.get({ path: 'products', query: { limit: parseInt(limit) || 10, fields: 'id,title,handle' } })
    res.json(response.body)
  } catch (err) {
    console.error('Products error:', err)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

app.get('/api/billing/create', async (req, res) => {
  const { shop } = req.query
  if (!shop) return res.status(400).json({ error: 'Missing shop' })
  const sid = shopify.session.getOfflineId(shop)
  const session = sessions.get(sid)
  if (!session) return res.status(401).json({ error: 'App not installed' })
  try {
    const result = await shopify.billing.request({
      session,
      plan: 'Pro Plan',
      isTest: true,
      returnUrl: `${SHOPIFY_APP_URL}/api/billing/confirm?shop=${shop}`,
    })
    res.json({ confirmationUrl: result.confirmationUrl })
  } catch (err) {
    console.error('Billing create error:', err)
    res.status(500).json({ error: 'Failed to create billing' })
  }
})

app.get('/api/billing/confirm', async (req, res) => {
  const { shop } = req.query
  if (shop) {
    const sid = shopify.session.getOfflineId(shop)
    const session = sessions.get(sid)
    if (session) {
      try {
        const parsed = await shopify.billing.request({
          session,
          plan: 'Pro Plan',
          isTest: true,
          returnUrl: `${SHOPIFY_APP_URL}/api/billing/confirm?shop=${shop}`,
        })
      } catch {}
    }
  }
  res.redirect(`/?shop=${shop}`)
})

app.get('/api/billing/check', async (req, res) => {
  const { shop } = req.query
  if (!shop) return res.json({ active: false })
  const sid = shopify.session.getOfflineId(shop)
  const session = sessions.get(sid)
  if (!session) return res.json({ active: false })
  try {
    const active = await shopify.billing.check({ session, plans: ['Pro Plan'] })
    res.json({ active })
  } catch {
    res.json({ active: false })
  }
})

app.get('*', serveIndex)

const listenPort = PORT || 3001
app.listen(listenPort, () => console.log(`QR Code Genie running on port ${listenPort}`))
