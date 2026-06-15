import express from 'express'
import compression from 'compression'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import '@shopify/shopify-api/adapters/node'
import { shopifyApi, ApiVersion, LogSeverity } from '@shopify/shopify-api'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('=== DEBUG ENV ===')
console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY ? 'SET (length: ' + process.env.SHOPIFY_API_KEY.length + ')' : 'NOT SET')
console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? 'SET (length: ' + process.env.SHOPIFY_API_SECRET.length + ')' : 'NOT SET')
console.log('SHOPIFY_APP_URL:', process.env.SHOPIFY_APP_URL || 'NOT SET')
console.log('SHOPIFY_APP_HANDLE:', process.env.SHOPIFY_APP_HANDLE || 'qr-code-genie (default)')
console.log('SCOPES:', process.env.SCOPES || 'NOT SET')
console.log('PORT:', process.env.PORT || 'NOT SET')
console.log('=== END DEBUG ===')

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL, SHOPIFY_APP_HANDLE, SCOPES, PORT } = process.env

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
})

const app = express()
app.use(compression())
app.use(express.json({ verify: (req, _, buf) => { req.rawBody = buf } }))

function validateSessionToken(req, res, next) {
  const auth = req.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return next()
  try {
    const payload = jwt.verify(auth.slice(7), SHOPIFY_API_SECRET, { algorithms: ['HS256'] })
    if (payload.aud !== SHOPIFY_API_KEY) return next()
    req.shop = payload.dest.replace('https://', '')
    const sid = shopify.session.getOfflineId(req.shop)
    req.session = sessions.get(sid)
  } catch {
  }
  next()
}

app.use(validateSessionToken)

app.use('/assets', express.static(path.join(__dirname, '..', 'dist', 'assets')))

function serveIndex(req, res) {
  const filePath = path.join(__dirname, '..', 'dist', 'index.html')
  if (!fs.existsSync(filePath)) return res.status(500).send('Frontend not built. Run: npm run build')
  let html = fs.readFileSync(filePath, 'utf-8')
  html = html.replace('__SHOPIFY_API_KEY__', SHOPIFY_API_KEY)
  res.send(html)
}

const nonces = new Map()

app.get('/', (req, res) => {
  const shop = req.query.shop
  const host = req.query.host
  if (shop) {
    const sid = shopify.session.getOfflineId(shop)
    if (!sessions.has(sid)) {
      if (host) {
        return res.send(`<!DOCTYPE html><html><body><script>window.top.location.href='/auth?shop=${encodeURIComponent(shop)}';</script></body></html>`)
      }
      return res.redirect(`/auth?shop=${encodeURIComponent(shop)}`)
    }
  }
  serveIndex(req, res)
})

app.get('/auth', (req, res) => {
  const shop = req.query.shop
  if (!shop) return res.status(400).send('Missing shop')
  const nonce = crypto.randomBytes(16).toString('hex')
  nonces.set(nonce, { shop, createdAt: Date.now() })
  const redirectUri = `${SHOPIFY_APP_URL}/auth/callback`
  const scopes = SCOPES || 'read_products,write_products'
  const url = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`
  res.redirect(url)
})

app.get('/auth/callback', async (req, res) => {
  try {
    const { shop, code, hmac, state, host } = req.query
    if (!shop || !code || !hmac || !state) return res.status(400).send('Missing params')
    const stored = nonces.get(state)
    if (!stored || stored.shop !== shop) return res.status(400).send('Invalid state')
    nonces.delete(state)
    const map = { ...req.query }
    delete map['hmac']
    const message = Object.keys(map).sort().map(k => `${k}=${map[k]}`).join('&')
    const computed = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(message).digest('hex')
    if (hmac !== computed) return res.status(400).send('Invalid HMAC')
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code, expiring: 1 }),
    })
    if (!tokenRes.ok) return res.status(500).send('Token exchange failed')
    const tokenData = await tokenRes.json()
    const session = {
      shop,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      refreshToken: tokenData.refresh_token,
      refreshTokenExpiresIn: tokenData.refresh_token_expires_in,
      tokenObtainedAt: Date.now(),
    }
    const sid = shopify.session.getOfflineId(shop)
    sessions.set(sid, session)
    res.redirect(`/?shop=${encodeURIComponent(shop)}`)
  } catch (err) {
    console.error('[AUTH_CALLBACK] Error:', err.message, err.stack)
    res.status(500).send('Auth callback failed')
  }
})

app.get('/api/config', (req, res) => {
  res.json({ apiKey: SHOPIFY_API_KEY, appHandle: SHOPIFY_APP_HANDLE || 'qr-code-genie' })
})

app.get('/api/products', async (req, res) => {
  const shop = req.shop || req.query.shop
  if (!shop) return res.status(400).json({ error: 'Missing shop' })
  const session = await ensureValidSession(shop)
  if (!session) return res.status(401).json({ error: 'App not installed' })
  try {
    const client = new shopify.clients.Rest({ session })
    const response = await client.get({ path: 'products', query: { limit: parseInt(req.query.limit) || 10, fields: 'id,title,handle' } })
    res.json(response.body.products ? response.body : { products: response.body })
  } catch (err) {
    console.error('Products error:', err.message, err.stack?.slice(0, 1000))
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal error' })
})

async function ensureValidSession(shop) {
  const sid = shopify.session.getOfflineId(shop)
  const session = sessions.get(sid)
  if (!session) return null
  if (!session.refreshToken) return session
  const elapsed = (Date.now() - (session.tokenObtainedAt || 0)) / 1000
  const buffer = 300
  if (elapsed < (session.expiresIn || 3600) - buffer) return session
  try {
    const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const updated = {
      ...session,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      refreshTokenExpiresIn: data.refresh_token_expires_in,
      tokenObtainedAt: Date.now(),
    }
    sessions.set(sid, updated)
    return updated
  } catch {
    return null
  }
}

function verifyHmac(req, res) {
  const hmac = req.get('X-Shopify-Hmac-SHA256')
  if (!hmac) return false
  const computed = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(req.rawBody).digest('base64')
  return hmac === computed
}

app.post('/webhooks/customers/data_request', (req, res) => {
  if (!verifyHmac(req, res)) return res.status(401).end()
  res.status(200).end()
})
app.post('/webhooks/customers/redact', (req, res) => {
  if (!verifyHmac(req, res)) return res.status(401).end()
  res.status(200).end()
})
app.post('/webhooks/shop/redact', (req, res) => {
  if (!verifyHmac(req, res)) return res.status(401).end()
  res.status(200).end()
})

app.get('/privacy', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy - QR Code Genie</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#333;line-height:1.6}h1{color:#111}</style></head><body><h1>Privacy Policy</h1><p><strong>QR Code Genie</strong> respects your privacy.</p><h2>Data We Collect</h2><ul><li>Shop information (store name and domain for authentication)</li><li>QR code content (URLs or text you enter)</li></ul><h2>How We Use Data</h2><p>We use your data solely to provide QR code generation and product linking.</p><h2>Data Storage</h2><p>We do not permanently store QR code images or generated content. Session data is stored temporarily for authentication.</p><h2>Third-Party Services</h2><p>We do not share, sell, or transfer your data to third parties.</p><h2>Contact</h2><p>Email: myhyonix1@hotmail.com</p><p>Last updated: June 14, 2026</p></body></html>`)
})

app.get('*', serveIndex)

const listenPort = PORT || 3001
app.listen(listenPort, () => console.log(`QR Code Genie running on port ${listenPort}`))
