import express from 'express'
import compression from 'compression'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import '@shopify/shopify-api/adapters/node'
import { shopifyApi, ApiVersion, LogSeverity, BillingInterval, BillingReplacementBehavior } from '@shopify/shopify-api'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('=== DEBUG ENV ===')
console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY ? 'SET (length: ' + process.env.SHOPIFY_API_KEY.length + ')' : 'NOT SET')
console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? 'SET (length: ' + process.env.SHOPIFY_API_SECRET.length + ')' : 'NOT SET')
console.log('SHOPIFY_APP_URL:', process.env.SHOPIFY_APP_URL || 'NOT SET')
console.log('SCOPES:', process.env.SCOPES || 'NOT SET')
console.log('PORT:', process.env.PORT || 'NOT SET')
console.log('All env keys:', Object.keys(process.env).sort().join(', '))
console.log('=== END DEBUG ===')

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL, SCOPES, PORT } = process.env

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_APP_URL) {
  console.error('Missing required env vars')
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
      returnUrl: `${SHOPIFY_APP_URL}/?shop=${shop}&host=${req.query.host || ''}`,
    })
    res.json({ confirmationUrl: result.confirmationUrl })
  } catch (err) {
    console.error('Billing create error:', err)
    res.status(500).json({ error: 'Failed to create billing' })
  }
})

app.get('/api/billing/confirm', async (req, res) => {
  const { shop } = req.query
  res.redirect(`/?shop=${shop || ''}`)
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

app.get('/privacy', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy - QR Code Genie</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#333;line-height:1.6}h1{color:#111}</style></head><body><h1>Privacy Policy</h1><p><strong>QR Code Genie</strong> respects your privacy.</p><h2>Data We Collect</h2><ul><li>Shop information (store name and domain for authentication)</li><li>QR code content (URLs or text you enter)</li></ul><h2>How We Use Data</h2><p>We use your data solely to provide QR code generation and product linking.</p><h2>Data Storage</h2><p>We do not permanently store QR code images or generated content. Session data is stored temporarily for authentication.</p><h2>Third-Party Services</h2><p>We do not share, sell, or transfer your data to third parties.</p><h2>Contact</h2><p>Email: myhyonix1@hotmail.com</p><p>Last updated: June 14, 2026</p></body></html>`)
})

app.get('*', serveIndex)

const listenPort = PORT || 3001
app.listen(listenPort, () => console.log(`QR Code Genie running on port ${listenPort}`))
