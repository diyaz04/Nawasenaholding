import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  SHOPEE_PARTNER_ID: string;
  SHOPEE_PARTNER_KEY: string;
  JWT_SECRET: string;
}

type Variables = {
  user: { id: string; email: string }
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('*', cors({
  origin: (origin) => {
    // Izinkan localhost dan URL production Cloudflare
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('.pages.dev') || origin.includes('.workers.dev')) {
      return origin || '*'
    }
    return 'http://localhost:5173'
  },
  credentials: true
}))

// --- AUTH ENDPOINTS ---

app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    // Check if an admin already exists (we only allow 1 admin for now, or just check count)
    const { results: existingAdmins } = await c.env.DB.prepare('SELECT id FROM admin_users LIMIT 1').all()
    if (existingAdmins.length > 0) {
      return c.json({ error: 'Admin already exists. Registration closed.' }, 403)
    }

    if (!email || !password || !name) return c.json({ error: 'Missing fields' }, 400)

    const password_hash = bcrypt.hashSync(password, 10)
    const id = crypto.randomUUID()

    await c.env.DB.prepare(
      'INSERT INTO admin_users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
    ).bind(id, email, password_hash, name).run()

    return c.json({ success: true, message: 'Admin created' }, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    if (!email || !password) return c.json({ error: 'Missing fields' }, 400)

    const { results } = await c.env.DB.prepare('SELECT * FROM admin_users WHERE email = ?').bind(email).all()
    if (results.length === 0) return c.json({ error: 'Invalid credentials' }, 401)

    const user = results[0] as any
    const isValid = bcrypt.compareSync(password, user.password_hash)
    
    if (!isValid) return c.json({ error: 'Invalid credentials' }, 401)

    const payload = {
      id: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours expiry
    }
    const token = await sign(payload, c.env.JWT_SECRET || 'fallback_secret')

    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: false, // Set to false for local HTTP development
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return c.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.json({ success: true })
})

app.get('/api/auth/me', async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const payload = await verify(token, c.env.JWT_SECRET || 'fallback_secret', 'HS256')
    return c.json({ user: payload })
  } catch (err: any) {
    console.error('Verify error:', err)
    return c.json({ error: 'Invalid token', details: err.message }, 401)
  }
})

// --- PUBLIC ASSETS ENDPOINT ---
app.get('/api/assets/:filename', async (c) => {
  const filename = c.req.param('filename')
  const object = await c.env.BUCKET.get(filename)
  if (!object) return c.json({ error: 'Not found' }, 404)
  
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  return new Response(object.body, { headers })
})

// --- ADMIN MIDDLEWARE ---
app.use('/api/admin/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET || 'fallback_secret', 'HS256')
    c.set('user', payload as any)
    await next()
  } catch (err) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
})

// --- ADMIN ENDPOINTS (Protected) ---

// Dashboard Stats
app.get('/api/admin/dashboard-stats', async (c) => {
  return c.json({ stats: 'Dashboard stats placeholder' })
})

// R2 Upload
app.post('/api/admin/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']
    if (!file || typeof file === 'string') return c.json({ error: 'No file uploaded' }, 400)
    
    const extension = file.name.split('.').pop()
    const filename = `${crypto.randomUUID()}.${extension}`
    
    await c.env.BUCKET.put(filename, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    })
    
    return c.json({ url: `/api/assets/${filename}` })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Subsidiaries CRUD
app.post('/api/admin/subsidiaries', async (c) => {
  const { name, slug, logo_url, description, website_url, order_index } = await c.req.json()
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO subsidiaries (id, name, slug, logo_url, description, website_url, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, name, slug, logo_url, description, website_url, order_index || 0).run()
  return c.json({ success: true, id })
})

app.put('/api/admin/subsidiaries/:id', async (c) => {
  const id = c.req.param('id')
  const { name, slug, logo_url, description, website_url, order_index } = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE subsidiaries SET name=?, slug=?, logo_url=?, description=?, website_url=?, order_index=? WHERE id=?'
  ).bind(name, slug, logo_url, description, website_url, order_index || 0, id).run()
  return c.json({ success: true })
})

app.delete('/api/admin/subsidiaries/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM subsidiaries WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

// Products CRUD
app.post('/api/admin/products', async (c) => {
  const { subsidiary_id, name, image_url, category, description, price, order_index } = await c.req.json()
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO products (id, subsidiary_id, name, image_url, category, description, price, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, subsidiary_id, name, image_url, category, description, price || null, order_index || 0).run()
  return c.json({ success: true, id })
})

app.put('/api/admin/products/:id', async (c) => {
  const id = c.req.param('id')
  const { subsidiary_id, name, image_url, category, description, price, order_index } = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE products SET subsidiary_id=?, name=?, image_url=?, category=?, description=?, price=?, order_index=? WHERE id=?'
  ).bind(subsidiary_id, name, image_url, category, description, price || null, order_index || 0, id).run()
  return c.json({ success: true })
})

app.delete('/api/admin/products/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM products WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

// Content CMS (page_sections)
app.get('/api/admin/page_sections', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM page_sections').all()
  return c.json(results)
})

app.put('/api/admin/page_sections/:key', async (c) => {
  const key = c.req.param('key')
  const { content } = await c.req.json() // content should be JSON string
  await c.env.DB.prepare(
    'INSERT INTO page_sections (id, section_key, content) VALUES (?, ?, ?) ON CONFLICT(section_key) DO UPDATE SET content=?'
  ).bind(crypto.randomUUID(), key, content, content).run()
  return c.json({ success: true })
})

// Inquiries
app.get('/api/admin/inquiries', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT i.*, p.name as product_name FROM product_inquiries i LEFT JOIN products p ON i.product_id = p.id ORDER BY i.created_at DESC').all()
  return c.json(results)
})

app.put('/api/admin/inquiries/:id/status', async (c) => {
  const { status } = await c.req.json()
  await c.env.DB.prepare('UPDATE product_inquiries SET status=? WHERE id=?').bind(status, c.req.param('id')).run()
  return c.json({ success: true })
})


// --- POS KEUANGAN CRUD (Phase 5) ---
app.get('/api/admin/pos', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT p.*, pb.current_balance 
    FROM pos p 
    LEFT JOIN pos_balances pb ON p.id = pb.pos_id 
    ORDER BY p.order_index ASC
  `).all()
  return c.json(results)
})

app.post('/api/admin/pos', async (c) => {
  const { parent_id, name, type, order_index } = await c.req.json()
  const id = crypto.randomUUID()
  
  // Create POS and Balance atomically using batch
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO pos (id, parent_id, name, type, order_index) VALUES (?, ?, ?, ?, ?)').bind(id, parent_id || null, name, type, order_index || 0),
    c.env.DB.prepare('INSERT INTO pos_balances (id, pos_id, current_balance) VALUES (?, ?, 0)').bind(crypto.randomUUID(), id)
  ])
  
  return c.json({ success: true, id })
})

app.put('/api/admin/pos/:id', async (c) => {
  const id = c.req.param('id')
  const { parent_id, name, type, order_index } = await c.req.json()
  await c.env.DB.prepare('UPDATE pos SET parent_id=?, name=?, type=?, order_index=? WHERE id=?').bind(parent_id || null, name, type, order_index || 0, id).run()
  return c.json({ success: true })
})

app.delete('/api/admin/pos/:id', async (c) => {
  const idToDelete = c.req.param('id')
  
  const inUseGaji = await c.env.DB.prepare("SELECT * FROM system_config WHERE key='pos_gaji_id' AND value=?").bind(idToDelete).first()
  if (inUseGaji) return c.json({ error: 'Gagal! POS ini sedang dikunci oleh sistem sebagai sumber dana Gaji Karyawan.' }, 400)
  
  // Find all descendants to delete recursively
  const { results } = await c.env.DB.prepare('SELECT id, parent_id FROM pos').all()
  const toDelete = new Set<string>([idToDelete])
  
  let added = true
  while (added) {
    added = false
    for (const row of results) {
      if (row.parent_id && toDelete.has(row.parent_id as string) && !toDelete.has(row.id as string)) {
        toDelete.add(row.id as string)
        added = true
      }
    }
  }

  // Delete all in a batch
  const stmts = Array.from(toDelete).map(id => c.env.DB.prepare('DELETE FROM pos WHERE id=?').bind(id))
  await c.env.DB.batch(stmts) // POS balances will be cascaded automatically
  
  return c.json({ success: true, deleted_count: toDelete.size })
})

app.post('/api/admin/pos/seed', async (c) => {
  // Clear existing
  await c.env.DB.prepare('DELETE FROM pos').run()

  const hppId = crypto.randomUUID()
  const gajiId = crypto.randomUUID()
  const profitId = crypto.randomUUID()
  const bahanId = crypto.randomUUID()
  const iklanId = crypto.randomUUID()

  await c.env.DB.batch([
    // HPP Produk
    c.env.DB.prepare('INSERT INTO pos (id, parent_id, name, type, order_index) VALUES (?, NULL, ?, ?, 1)').bind(hppId, 'HPP Produk', 'biaya'),
    c.env.DB.prepare('INSERT INTO pos_balances (id, pos_id, current_balance) VALUES (?, ?, 0)').bind(crypto.randomUUID(), hppId),
    
    // Anak HPP
    c.env.DB.prepare('INSERT INTO pos (id, parent_id, name, type, order_index) VALUES (?, ?, ?, ?, 1)').bind(bahanId, hppId, 'Bahan Produksi', 'biaya'),
    c.env.DB.prepare('INSERT INTO pos_balances (id, pos_id, current_balance) VALUES (?, ?, 0)').bind(crypto.randomUUID(), bahanId),
    c.env.DB.prepare('INSERT INTO pos (id, parent_id, name, type, order_index) VALUES (?, ?, ?, ?, 2)').bind(iklanId, hppId, 'Iklan', 'biaya'),
    c.env.DB.prepare('INSERT INTO pos_balances (id, pos_id, current_balance) VALUES (?, ?, 0)').bind(crypto.randomUUID(), iklanId),
    
    // Gaji
    c.env.DB.prepare('INSERT INTO pos (id, parent_id, name, type, order_index) VALUES (?, NULL, ?, ?, 2)').bind(gajiId, 'Gaji Karyawan', 'biaya'),
    c.env.DB.prepare('INSERT INTO pos_balances (id, pos_id, current_balance) VALUES (?, ?, 0)').bind(crypto.randomUUID(), gajiId),
    
    // Pendapatan
    c.env.DB.prepare('INSERT INTO pos (id, parent_id, name, type, order_index) VALUES (?, NULL, ?, ?, 3)').bind(profitId, 'Pendapatan Bersih', 'profit'),
    c.env.DB.prepare('INSERT INTO pos_balances (id, pos_id, current_balance) VALUES (?, ?, 0)').bind(crypto.randomUUID(), profitId)
  ])

  return c.json({ success: true, message: 'Seed POS berhasil' })
})

// --- POLA DISTRIBUSI (Phase 6) ---

app.get('/api/admin/patterns', async (c) => {
  // Return patterns + count of configured POS
  const { results } = await c.env.DB.prepare(`
    SELECT dp.*, COUNT(pa.id) as pos_count 
    FROM distribution_patterns dp
    LEFT JOIN pattern_allocations pa ON dp.id = pa.pattern_id
    GROUP BY dp.id
    ORDER BY dp.created_at DESC
  `).all()
  return c.json(results)
})

app.get('/api/admin/patterns/:id', async (c) => {
  const id = c.req.param('id')
  const pattern = await c.env.DB.prepare('SELECT * FROM distribution_patterns WHERE id=?').bind(id).first()
  if (!pattern) return c.json({ error: 'Not found' }, 404)
  
  const { results: allocations } = await c.env.DB.prepare('SELECT pos_id, percentage, allocation_type, nominal_amount FROM pattern_allocations WHERE pattern_id=?').bind(id).all()
  
  const allocMap: Record<string, any> = {}
  allocations.forEach((a: any) => {
    allocMap[a.pos_id] = {
      type: a.allocation_type || 'percentage',
      percentage: a.percentage || 0,
      nominal_amount: a.nominal_amount || 0
    }
  })
  
  return c.json({ ...pattern, allocations: allocMap })
})

app.post('/api/admin/patterns', async (c) => {
  const { name, description, is_active, allocations } = await c.req.json()
  const patternId = crypto.randomUUID()
  
  const stmts = [
    c.env.DB.prepare('INSERT INTO distribution_patterns (id, name, description, is_active) VALUES (?, ?, ?, ?)').bind(patternId, name, description, is_active ? 1 : 0)
  ]
  
  for (const [posId, alloc] of Object.entries(allocations as Record<string, any>)) {
    if (alloc.percentage > 0 || alloc.nominal_amount > 0) {
      stmts.push(c.env.DB.prepare(
        'INSERT INTO pattern_allocations (id, pattern_id, pos_id, percentage, allocation_type, nominal_amount) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), patternId, posId, Number(alloc.percentage), alloc.type, Number(alloc.nominal_amount)))
    }
  }
  
  await c.env.DB.batch(stmts)
  return c.json({ success: true, id: patternId })
})

app.put('/api/admin/patterns/:id', async (c) => {
  const id = c.req.param('id')
  const { name, description, is_active, allocations } = await c.req.json()
  
  const stmts = [
    c.env.DB.prepare('UPDATE distribution_patterns SET name=?, description=?, is_active=? WHERE id=?').bind(name, description, is_active ? 1 : 0, id),
    c.env.DB.prepare('DELETE FROM pattern_allocations WHERE pattern_id=?').bind(id)
  ]
  
  for (const [posId, alloc] of Object.entries(allocations as Record<string, any>)) {
    if (alloc.percentage > 0 || alloc.nominal_amount > 0) {
      stmts.push(c.env.DB.prepare(
        'INSERT INTO pattern_allocations (id, pattern_id, pos_id, percentage, allocation_type, nominal_amount) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), id, posId, Number(alloc.percentage), alloc.type, Number(alloc.nominal_amount)))
    }
  }
  
  await c.env.DB.batch(stmts)
  return c.json({ success: true })
})

app.put('/api/admin/patterns/:id/status', async (c) => {
  const id = c.req.param('id')
  const { is_active } = await c.req.json()
  await c.env.DB.prepare('UPDATE distribution_patterns SET is_active=? WHERE id=?').bind(is_active ? 1 : 0, id).run()
  return c.json({ success: true })
})

app.delete('/api/admin/patterns/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM distribution_patterns WHERE id=?').bind(c.req.param('id')).run()
  // Allocations cascade deleted automatically by schema
  return c.json({ success: true })
})

app.post('/api/admin/patterns/seed', async (c) => {
  // Find POS by name to seed reliably
  const { results: posList } = await c.env.DB.prepare('SELECT id, name FROM pos').all()
  const posMap = new Map(posList.map((p: any) => [p.name, p.id]))
  
  const patternId = crypto.randomUUID()
  const stmts = [
    c.env.DB.prepare('INSERT INTO distribution_patterns (id, name, description, is_active) VALUES (?, ?, ?, 1)').bind(patternId, 'Pola Utama (Default)', 'Pola distribusi bawaan Nawasena')
  ]

  const allocs = [
    { name: 'Pendapatan Bersih', percentage: 60, type: 'percentage', nominal_amount: 0 },
    { name: 'HPP Produk', percentage: 30, type: 'percentage', nominal_amount: 0 },
    { name: 'Gaji Karyawan', percentage: 10, type: 'percentage', nominal_amount: 0 },
    { name: 'Bahan Produksi', percentage: 70, type: 'percentage', nominal_amount: 0 },
    { name: 'Iklan', percentage: 30, type: 'percentage', nominal_amount: 0 }
  ]

  for (const item of allocs) {
    const posId = posMap.get(item.name)
    if (posId) {
      stmts.push(c.env.DB.prepare(
        'INSERT INTO pattern_allocations (id, pattern_id, pos_id, percentage, allocation_type, nominal_amount) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), patternId, posId, item.percentage, item.type, item.nominal_amount))
    }
  }

  if (stmts.length > 1) {
    await c.env.DB.batch(stmts)
    return c.json({ success: true, message: 'Seed Pola berhasil' })
  } else {
    return c.json({ error: 'Data POS contoh belum dibuat (jalankan seed pos dulu)' }, 400)
  }
})

// --- SHOPEE INTEGRATION (Phase 7) ---

// Helper: Generate HMAC-SHA256 signature for Shopee Open API
async function generateShopeeSign(path: string, partnerKey: string, partnerId: string, timestamp: number, shopId: string | null = null) {
  let baseStr = partnerId.trim() + path + timestamp
  if (shopId) baseStr += shopId

  const encoder = new TextEncoder()
  const keyData = encoder.encode(partnerKey.trim())
  const msgData = encoder.encode(baseStr)

  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
}

app.get('/api/admin/shopee/auth-url', async (c) => {
  try {
    const partnerId = c.env.SHOPEE_PARTNER_ID?.trim()
    const partnerKey = c.env.SHOPEE_PARTNER_KEY?.trim()
    
    if (!partnerId || partnerId === 'YOUR_PARTNER_ID') {
      return c.json({ url: 'https://nawasena-backend.diyazsriwulan.workers.dev/api/shopee/callback?code=mock_code_123&shop_id=999999' })
    }
  
    if (!partnerKey) {
      throw new Error("SHOPEE_PARTNER_KEY missing in environment variables.")
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/shop/auth_partner'
    const redirectUrl = 'https://nawasena-backend.diyazsriwulan.workers.dev/api/shopee/callback'
    
    const sign = await generateShopeeSign(path, partnerKey, partnerId, timestamp)
    const authUrl = `https://partner.test-stable.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(redirectUrl)}`
    
    return c.json({ url: authUrl })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Public Callback endpoint to receive redirection from Shopee
app.get('/api/shopee/callback', async (c) => {
  const code = c.req.query('code')
  const shopId = c.req.query('shop_id')

  if (!code || !shopId) return c.text('Callback gagal: Kode atau Shop ID tidak ada.', 400)

  try {
    let accessToken = 'mock_access_token'
    let refreshToken = 'mock_refresh_token'
    let expireIn = 2592000 // 30 days

    // If real keys exist, exchange the code for token
    if (c.env.SHOPEE_PARTNER_ID !== 'YOUR_PARTNER_ID') {
      const partnerId = c.env.SHOPEE_PARTNER_ID
      const partnerKey = c.env.SHOPEE_PARTNER_KEY
      const timestamp = Math.floor(Date.now() / 1000)
      const path = '/api/v2/auth/token/get'
      const sign = await generateShopeeSign(path, partnerKey, partnerId, timestamp)

      const body = { code, shop_id: Number(shopId), partner_id: Number(partnerId) }
      const tokenRes = await fetch(`https://partner.test-stable.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const tokenData = await tokenRes.json()
      
      if (tokenData.error) {
        return c.redirect(`https://nawasenaholdingfrontend.diyazsriwulan.workers.dev/admin/shopee?status=error&msg=${encodeURIComponent(tokenData.message)}`)
      }
      accessToken = tokenData.access_token
      refreshToken = tokenData.refresh_token
      expireIn = tokenData.expire_in
    }

    const expiresAt = new Date(Date.now() + expireIn * 1000).toISOString()
    const shopName = shopId === '999999' ? 'Toko Mockup Nawasena' : `Shopee Shop ${shopId}`

    // Insert or update DB
    await c.env.DB.prepare(`
      INSERT INTO shopee_accounts (id, shop_id, shop_name, access_token, refresh_token, token_expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(shop_id) DO UPDATE SET 
        access_token=excluded.access_token, 
        refresh_token=excluded.refresh_token, 
        token_expires_at=excluded.token_expires_at,
        is_active=1
    `).bind(crypto.randomUUID(), shopId, shopName, accessToken, refreshToken, expiresAt).run()

    // Redirect kembali ke frontend dashboard
    return c.redirect('https://nawasenaholdingfrontend.diyazsriwulan.workers.dev/admin/shopee?status=success')
  } catch (error) {
    return c.redirect('https://nawasenaholdingfrontend.diyazsriwulan.workers.dev/admin/shopee?status=error')
  }
})

app.post('/api/shopee/push', async (c) => { try { const payload = await c.req.json(); await c.env.DB.prepare('CREATE TABLE IF NOT EXISTS shopee_push_logs (id TEXT PRIMARY KEY, payload TEXT, received_at TEXT DEFAULT CURRENT_TIMESTAMP)').run(); await c.env.DB.prepare('INSERT INTO shopee_push_logs (id, payload) VALUES (?, ?)').bind(crypto.randomUUID(), JSON.stringify(payload)).run(); return c.json({ received: true }, 200); } catch (error) { return c.json({ received: true }, 200); } });

  app.get('/api/admin/shopee/accounts', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, shop_id, shop_name, is_active, connected_at, token_expires_at FROM shopee_accounts').all()
  return c.json(results)
})

app.delete('/api/admin/shopee/accounts/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM shopee_accounts WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

app.post('/api/admin/shopee/test-fetch', async (c) => {
  // Try to fetch for all active accounts
  const { results: accounts } = await c.env.DB.prepare('SELECT shop_id, shop_name FROM shopee_accounts WHERE is_active = 1').all()
  
  if (accounts.length === 0) return c.json({ error: 'Tidak ada toko yang tersambung/aktif' }, 400)

  let totalIncome = 0
  let totalAdsCost = 0
  let adsAvailable = true

  // Loop through accounts (mock or real)
  for (const acc of accounts) {
    if (acc.shop_id === '999999' || c.env.SHOPEE_PARTNER_ID === 'YOUR_PARTNER_ID') {
      // Mock Data
      totalIncome += Math.floor(Math.random() * (15000000 - 5000000) + 5000000) // 5jt - 15jt
      totalAdsCost += Math.floor(Math.random() * (2000000 - 500000) + 500000) // 500k - 2jt
    } else {
      // Real API calls would go here using `generateShopeeSign`
      // E.g. Income: GET /api/v2/payment/get_escrow_detail
      // E.g. Ads: GET /api/v2/ads/get_daily_performance
      // Since we don't have valid token scopes guaranteed, we will mock for safety unless implemented fully
      totalIncome += 0
      adsAvailable = false
    }
  }

  return c.json({
    date: new Date().toISOString().split('T')[0],
    total_income: totalIncome,
    total_ads_cost: adsAvailable ? totalAdsCost : 0,
    ads_status: adsAvailable ? 'available' : 'not_available',
    shops_fetched: accounts.length
  })
})

// --- PUBLIC API ENDPOINTS (Phase 2) ---

app.get('/api/page_sections/:key', async (c) => {
  const key = c.req.param('key')
  const { results } = await c.env.DB.prepare('SELECT * FROM page_sections WHERE section_key = ?').bind(key).all()
  if (results.length === 0) return c.json({ content: null })
  return c.json(results[0])
})

app.get('/api/subsidiaries', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM subsidiaries ORDER BY order_index ASC, created_at DESC').all()
  return c.json(results)
})

app.get('/api/products', async (c) => {
  const category = c.req.query('category')
  let query = 'SELECT p.*, s.name as subsidiary_name FROM products p LEFT JOIN subsidiaries s ON p.subsidiary_id = s.id'
  let params: any[] = []
  
  if (category) {
    query += ' WHERE p.category = ?'
    params.push(category)
  }
  query += ' ORDER BY p.order_index ASC, p.created_at DESC'
  
  const stmt = c.env.DB.prepare(query)
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()
  
  return c.json(results)
})

app.post('/api/product_inquiries', async (c) => {
  try {
    const body = await c.req.json()
    const { product_id, name, contact, message } = body
    if (!product_id || !name || !contact) return c.json({ error: 'Missing required fields' }, 400)
    
    const id = crypto.randomUUID()
    await c.env.DB.prepare(
      'INSERT INTO product_inquiries (id, product_id, name, contact, message, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, product_id, name, contact, message || '', 'new').run()
    
    return c.json({ success: true, id }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to submit inquiry' }, 500)
  }
})

// --- PHASE 8: AUTOMATED CLOSING ENGINE ---

app.get('/api/admin/closing-config', async (c) => {
  let config = await c.env.DB.prepare('SELECT * FROM closing_config LIMIT 1').first()
  if (!config) {
    // Try to get a default pattern id
    const firstPat = await c.env.DB.prepare('SELECT id FROM distribution_patterns LIMIT 1').first()
    if (firstPat) {
      try {
        await c.env.DB.prepare('INSERT INTO closing_config (id, closing_time, active_pattern_id, timezone, is_enabled) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), '23:00', firstPat.id, 'Asia/Jakarta', 0).run()
        config = await c.env.DB.prepare('SELECT * FROM closing_config LIMIT 1').first()
      } catch (e) {
        config = { closing_time: '23:00', active_pattern_id: '', is_enabled: 0 }
      }
    } else {
      config = { closing_time: '23:00', active_pattern_id: '', is_enabled: 0 }
    }
  }
  return c.json(config)
})

app.put('/api/admin/closing-config', async (c) => {
  const { closing_time, active_pattern_id, is_enabled } = await c.req.json()
  // Ensure we overwrite or insert cleanly
  await c.env.DB.prepare('DELETE FROM closing_config').run()
  await c.env.DB.prepare('INSERT INTO closing_config (id, closing_time, active_pattern_id, is_enabled) VALUES (?, ?, ?, ?)')
    .bind(crypto.randomUUID(), closing_time, active_pattern_id, is_enabled ? 1 : 0).run()
  return c.json({ success: true })
})

app.get('/api/admin/daily-closings', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM daily_closings ORDER BY closing_date DESC').all()
  return c.json(results)
})

app.get('/api/admin/daily-closings/:id/allocations', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT a.*, p.name as pos_name 
    FROM daily_closing_allocations a 
    JOIN pos p ON a.pos_id = p.id 
    WHERE a.daily_closing_id = ?
  `).bind(c.req.param('id')).all()
  return c.json(results)
})

// The Engine logic extracted to a reusable function
async function executeClosingDistribution(env: Env, closingDate: string, totalRevenue: number, totalAdsCost: number, patternId: string, closingIdToUpdate: string | null = null) {
  // 1. Fetch pattern allocations
  const { results: allocs } = await env.DB.prepare('SELECT pos_id, percentage, allocation_type, nominal_amount FROM pattern_allocations WHERE pattern_id=?').bind(patternId).all()
  
  // 2. Fetch all POS to know their type
  const { results: posList } = await env.DB.prepare('SELECT id, type, parent_id FROM pos').all()
  
  const allocMap: Record<string, any> = {}
  allocs.forEach((a: any) => allocMap[a.pos_id] = a)
  
  // Waterfall Calculation Logic (Phase 6, Option B)
  const result: Record<string, number> = {}
  
  // Pass 1: Nominals
  let totalAllocated = 0
  for (const node of posList) {
    const a = allocMap[node.id]
    if (a?.allocation_type === 'nominal') {
      const amt = Math.min(a.nominal_amount || 0, totalRevenue - totalAllocated)
      result[node.id] = amt
      totalAllocated += amt
    }
  }

  const baseForPercentages = totalRevenue - totalAllocated

  // Pass 2: Biaya Percentages
  for (const node of posList) {
    const a = allocMap[node.id]
    if (node.type === 'biaya' && (!a || a.allocation_type === 'percentage')) {
      const pct = a?.percentage || 0
      const amt = Math.min(baseForPercentages * (pct / 100), totalRevenue - totalAllocated)
      result[node.id] = amt
      totalAllocated += amt
    }
  }

  // Pass 3: Profit (Sisa)
  const finalRemainder = totalRevenue - totalAllocated
  const profitNodes = posList.filter(n => n.type === 'profit' && allocMap[n.id]?.allocation_type !== 'nominal')
  
  if (profitNodes.length > 0) {
    const totalProfitPct = profitNodes.reduce((sum, n) => sum + (allocMap[n.id]?.percentage || 0), 0)
    for (const node of profitNodes) {
      if (totalProfitPct > 0) {
        result[node.id] = finalRemainder * ((allocMap[node.id].percentage || 0) / totalProfitPct)
      } else {
        result[node.id] = finalRemainder / profitNodes.length
      }
    }
  }

  const newClosingId = closingIdToUpdate || crypto.randomUUID()
  const stmts = []
  
  // If we are updating a pending closing to completed
  if (closingIdToUpdate) {
    stmts.push(env.DB.prepare('UPDATE daily_closings SET status=?, total_ads_cost=?, ads_cost_source=?, processed_at=CURRENT_TIMESTAMP WHERE id=?').bind('completed', totalAdsCost, 'manual', closingIdToUpdate))
  } else {
    stmts.push(env.DB.prepare(`
      INSERT INTO daily_closings (id, closing_date, pattern_id_used, total_revenue, total_ads_cost, ads_cost_source, status, processed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(newClosingId, closingDate, patternId, totalRevenue, totalAdsCost, 'api', 'completed'))
  }

  // Save allocations and update balances
  for (const [posId, amount] of Object.entries(result)) {
    if (amount > 0) {
      stmts.push(env.DB.prepare('INSERT INTO daily_closing_allocations (id, daily_closing_id, pos_id, allocated_amount) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), newClosingId, posId, amount))
      stmts.push(env.DB.prepare('UPDATE pos_balances SET current_balance = current_balance + ? WHERE pos_id = ?').bind(amount, posId))
    }
  }

  await env.DB.batch(stmts)
  return newClosingId
}

// Function to fetch Shopee data (mocked if no credentials)
async function fetchShopeeDailyData(env: Env) {
  const { results: accounts } = await env.DB.prepare('SELECT shop_id FROM shopee_accounts WHERE is_active = 1').all()
  if (accounts.length === 0) throw new Error('Tidak ada akun Shopee aktif.')
  
  let totalIncome = 0
  let totalAdsCost = 0
  let adsAvailable = true

  for (const acc of accounts) {
    if (acc.shop_id === '999999' || env.SHOPEE_PARTNER_ID === 'YOUR_PARTNER_ID') {
      totalIncome += Math.floor(Math.random() * 10000000 + 5000000)
      totalAdsCost += Math.floor(Math.random() * 1000000 + 200000)
    } else {
      totalIncome += 0
      adsAvailable = false
    }
  }
  
  return { totalIncome, totalAdsCost, adsAvailable }
}

app.post('/api/admin/run-closing', async (c) => {
  const config = await c.env.DB.prepare('SELECT * FROM closing_config LIMIT 1').first()
  if (!config || !config.active_pattern_id) return c.json({ error: 'Konfigurasi tutup buku belum di-set.' }, 400)

  // Get current WIB date
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' })
  const closingDate = formatter.format(now) // YYYY-MM-DD

  // Idempotency Check
  const existing = await c.env.DB.prepare('SELECT id FROM daily_closings WHERE closing_date=?').bind(closingDate).first()
  if (existing) return c.json({ error: `Tutup buku untuk tanggal ${closingDate} sudah dijalankan.` }, 400)

  try {
    const { totalIncome, totalAdsCost, adsAvailable } = await fetchShopeeDailyData(c.env)
    
    if (!adsAvailable) {
      // Pending state
      const closingId = crypto.randomUUID()
      await c.env.DB.prepare(`
        INSERT INTO daily_closings (id, closing_date, pattern_id_used, total_revenue, total_ads_cost, ads_cost_source, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(closingId, closingDate, config.active_pattern_id, totalIncome, 0, 'api', 'pending').run()
      return c.json({ success: true, status: 'pending', message: 'Iklan gagal diambil, menunggu input manual.' })
    } else {
      // Completed state
      await executeClosingDistribution(c.env, closingDate, totalIncome, totalAdsCost, config.active_pattern_id as string)
      return c.json({ success: true, status: 'completed' })
    }
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/admin/submit-ads', async (c) => {
  const { closing_id, manual_ads_cost } = await c.req.json()
  
  const pending = await c.env.DB.prepare('SELECT * FROM daily_closings WHERE id=? AND status=?').bind(closing_id, 'pending').first()
  if (!pending) return c.json({ error: 'Data pending tidak ditemukan' }, 404)

  try {
    await executeClosingDistribution(c.env, pending.closing_date as string, Number(pending.total_revenue), Number(manual_ads_cost), pending.pattern_id_used as string, closing_id)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// --- PHASE 9: EXPENSES MODULE ---

app.get('/api/admin/expenses', async (c) => {
  const posId = c.req.query('pos_id')
  const date = c.req.query('date')

  let query = 'SELECT e.*, p.name as pos_name FROM expenses e JOIN pos p ON e.pos_id = p.id WHERE 1=1'
  const params: any[] = []

  if (posId) {
    query += ' AND e.pos_id = ?'
    params.push(posId)
  }
  if (date) {
    query += ' AND e.expense_date = ?'
    params.push(date)
  }

  query += ' ORDER BY e.created_at DESC'

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(results)
})

app.post('/api/admin/expenses', async (c) => {
  const { pos_id, amount, description, expense_date } = await c.req.json()
  
  // 1. Check current balance
  const posBalance = await c.env.DB.prepare('SELECT current_balance FROM pos_balances WHERE pos_id = ?').bind(pos_id).first()
  
  const currentBalance = posBalance ? Number(posBalance.current_balance) : 0
  const expenseAmount = Number(amount)

  if (expenseAmount > currentBalance) {
    return c.json({ error: `Transaksi ditolak! Saldo tidak mencukupi (Sisa saldo: Rp ${currentBalance.toLocaleString('id-ID')})` }, 400)
  }

  // 2. Transaction: Insert expense and update balance
  const expenseId = crypto.randomUUID()
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO expenses (id, pos_id, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)').bind(expenseId, pos_id, expenseAmount, description, expense_date),
    c.env.DB.prepare('UPDATE pos_balances SET current_balance = current_balance - ? WHERE pos_id = ?').bind(expenseAmount, pos_id)
  ])

  return c.json({ success: true, id: expenseId })
})

// --- PHASE 10: EXECUTIVE DASHBOARD ---

app.get('/api/admin/dashboard/metrics', async (c) => {
  // Current month bounds (YYYY-MM)
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)

  const incomeResult = await c.env.DB.prepare("SELECT SUM(total_revenue) as total FROM daily_closings WHERE status = 'completed' AND closing_date LIKE ?").bind(`${currentMonth}%`).first()
  const expenseResult = await c.env.DB.prepare("SELECT SUM(amount) as total FROM expenses WHERE expense_date LIKE ?").bind(`${currentMonth}%`).first()
  const balanceResult = await c.env.DB.prepare("SELECT SUM(current_balance) as total FROM pos_balances").first()
  const pendingResult = await c.env.DB.prepare("SELECT COUNT(id) as count FROM daily_closings WHERE status = 'pending'").first()

  return c.json({
    income_this_month: incomeResult?.total || 0,
    expenses_this_month: expenseResult?.total || 0,
    total_balance: balanceResult?.total || 0,
    pending_closings_count: pendingResult?.count || 0
  })
})

app.get('/api/admin/dashboard/charts', async (c) => {
  const startDate = c.req.query('start_date') || ''
  const endDate = c.req.query('end_date') || '9999-12-31'

  // Daily Trend
  const { results: trend } = await c.env.DB.prepare(`
    SELECT closing_date as date, total_revenue, total_ads_cost 
    FROM daily_closings 
    WHERE status = 'completed' AND closing_date >= ? AND closing_date <= ? 
    ORDER BY closing_date ASC
  `).bind(startDate, endDate).all()

  // Distribution by POS
  const { results: distribution } = await c.env.DB.prepare(`
    SELECT p.name, SUM(a.allocated_amount) as total
    FROM daily_closing_allocations a
    JOIN daily_closings dc ON a.daily_closing_id = dc.id
    JOIN pos p ON a.pos_id = p.id
    WHERE dc.status = 'completed' AND dc.closing_date >= ? AND dc.closing_date <= ?
    GROUP BY p.id
    ORDER BY total DESC
  `).bind(startDate, endDate).all()

  return c.json({ trend, distribution })
})

// --- PHASE 13: MONTHLY REPORTS ---

import * as XLSX from 'xlsx'

app.get('/api/reports/monthly', async (c) => {
  const month = c.req.query('month')
  const year = c.req.query('year')
  
  if (!month || !year) return c.json({ error: 'Missing month or year' }, 400)
  
  const targetPrefix = `${year}-${month.padStart(2, '0')}`

  // 1. Totals
  const incomeResult = await c.env.DB.prepare("SELECT SUM(total_revenue) as rev, SUM(total_ads_cost) as ads FROM daily_closings WHERE status = 'completed' AND closing_date LIKE ?").bind(`${targetPrefix}%`).first()
  const expenseResult = await c.env.DB.prepare("SELECT SUM(amount) as exp FROM expenses WHERE expense_date LIKE ?").bind(`${targetPrefix}%`).first()

  // 2. POS Income (Allocations)
  const { results: allocations } = await c.env.DB.prepare(`
    SELECT a.pos_id, SUM(a.allocated_amount) as total_in
    FROM daily_closing_allocations a
    JOIN daily_closings dc ON a.daily_closing_id = dc.id
    WHERE dc.status = 'completed' AND dc.closing_date LIKE ?
    GROUP BY a.pos_id
  `).bind(`${targetPrefix}%`).all()

  // 3. POS Expenses
  const { results: posExpenses } = await c.env.DB.prepare(`
    SELECT pos_id, SUM(amount) as total_out
    FROM expenses
    WHERE expense_date LIKE ?
    GROUP BY pos_id
  `).bind(`${targetPrefix}%`).all()

  // 4. All POS list to build tree with balances
  const { results: allPos } = await c.env.DB.prepare("SELECT * FROM pos ORDER BY order_index ASC").all()
  
  // Combine POS data
  const allocMap = Object.fromEntries(allocations.map((a: any) => [a.pos_id, a.total_in]))
  const expMap = Object.fromEntries(posExpenses.map((e: any) => [e.pos_id, e.total_out]))
  
  const posDistribution = allPos.map((p: any) => {
    const income = allocMap[p.id] || 0
    const expense = expMap[p.id] || 0
    return {
      ...p,
      monthly_income: income,
      monthly_expense: expense,
      monthly_net: income - expense
    }
  })

  // 5. Daily Details
  const { results: daily } = await c.env.DB.prepare(`
    SELECT closing_date, total_revenue, total_ads_cost, ads_cost_source, pattern_id_used, status
    FROM daily_closings
    WHERE closing_date LIKE ?
    ORDER BY closing_date ASC
  `).bind(`${targetPrefix}%`).all()

  return c.json({
    summary: {
      total_revenue: incomeResult?.rev || 0,
      total_ads: incomeResult?.ads || 0,
      total_expense: expenseResult?.exp || 0,
      net_balance: (incomeResult?.rev || 0) - (expenseResult?.exp || 0)
    },
    pos_distribution: posDistribution,
    daily_details: daily
  })
})
app.get('/api/reports/daily/export/excel', async (c) => {
  const date = c.req.query('date')
  if (!date) return new Response('Missing date parameter', { status: 400 })

  // Fetch daily closing
  const closing = await c.env.DB.prepare("SELECT * FROM daily_closings WHERE closing_date = ? AND status = 'completed'").bind(date).first()
  if (!closing) return new Response('Tutup buku tidak ditemukan atau belum selesai', { status: 404 })

  // Fetch allocations with POS names
  const { results: allocations } = await c.env.DB.prepare(`
    SELECT a.pos_id, p.name as pos_name, a.allocated_amount
    FROM daily_closing_allocations a
    JOIN pos p ON a.pos_id = p.id
    WHERE a.daily_closing_id = ?
  `).bind(closing.id).all()

  // Build Excel
  const wb = XLSX.utils.book_new()
  
  // Sheet 1: Ringkasan
  const summaryData = [
    ['NAWASENA HOLDING - LAPORAN HARIAN'],
    ['Tanggal', date],
    [''],
    ['Total Pendapatan', closing.total_revenue],
    ['Total Biaya Iklan', closing.total_ads_cost],
    ['Laba Kotor (Setelah Iklan)', Number(closing.total_revenue) - Number(closing.total_ads_cost)]
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Harian')

  // Sheet 2: Alokasi POS
  const allocData = [['Nama POS', 'Jumlah Dialokasikan']]
  allocations.forEach((a: any) => {
    allocData.push([a.pos_name, a.allocated_amount])
  })
  const wsAlloc = XLSX.utils.aoa_to_sheet(allocData)
  XLSX.utils.book_append_sheet(wb, wsAlloc, 'Alokasi POS')

  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  
  return new Response(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Laporan_Harian_${date}.xlsx"`
    }
  })
})


app.get('/api/reports/monthly/export/excel', async (c) => {
  const month = c.req.query('month')
  const year = c.req.query('year')
  
  if (!month || !year) return new Response('Missing month or year', { status: 400 })
  const targetPrefix = `${year}-${month.padStart(2, '0')}`

  // Fetch all data
  const incomeResult = await c.env.DB.prepare("SELECT SUM(total_revenue) as rev, SUM(total_ads_cost) as ads FROM daily_closings WHERE status = 'completed' AND closing_date LIKE ?").bind(`${targetPrefix}%`).first()
  const expenseResult = await c.env.DB.prepare("SELECT SUM(amount) as exp FROM expenses WHERE expense_date LIKE ?").bind(`${targetPrefix}%`).first()
  const { results: allocations } = await c.env.DB.prepare("SELECT a.pos_id, SUM(a.allocated_amount) as total_in FROM daily_closing_allocations a JOIN daily_closings dc ON a.daily_closing_id = dc.id WHERE dc.status = 'completed' AND dc.closing_date LIKE ? GROUP BY a.pos_id").bind(`${targetPrefix}%`).all()
  const { results: posExpenses } = await c.env.DB.prepare("SELECT pos_id, SUM(amount) as total_out FROM expenses WHERE expense_date LIKE ? GROUP BY pos_id").bind(`${targetPrefix}%`).all()
  const { results: allPos } = await c.env.DB.prepare("SELECT * FROM pos ORDER BY order_index ASC").all()
  const { results: daily } = await c.env.DB.prepare("SELECT closing_date, total_revenue, total_ads_cost, status FROM daily_closings WHERE closing_date LIKE ? ORDER BY closing_date ASC").bind(`${targetPrefix}%`).all()

  // Format Helper
  const allocMap = Object.fromEntries(allocations.map((a: any) => [a.pos_id, a.total_in]))
  const expMap = Object.fromEntries(posExpenses.map((e: any) => [e.pos_id, e.total_out]))
  
  // Create workbook
  const wb = XLSX.utils.book_new()

  // Sheet 1: Summary
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['LAPORAN KEUANGAN BULANAN', `Periode: ${month}/${year}`],
    [],
    ['Total Pendapatan', incomeResult?.rev || 0],
    ['Total Biaya Iklan', incomeResult?.ads || 0],
    ['Total Pengeluaran', expenseResult?.exp || 0],
    ['Saldo Bersih Bulan Ini', (Number(incomeResult?.rev || 0) - Number(expenseResult?.exp || 0))]
  ])
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')

  // Sheet 2: POS Distribution
  // Sort and indent based on parent_id (basic tree flattening for Excel)
  const flatTree: any[] = []
  const flatten = (parentId: string | null, level: number) => {
    const children = allPos.filter((p: any) => p.parent_id === parentId).sort((a: any, b: any) => a.order_index - b.order_index)
    for (const child of children) {
      const income = allocMap[child.id] || 0
      const expense = expMap[child.id] || 0
      flatTree.push({
        'Nama Pos': ' '.repeat(level * 4) + child.name,
        'Pemasukan (Rp)': income,
        'Pengeluaran (Rp)': expense,
        'Saldo Bersih (Rp)': income - expense
      })
      flatten(child.id, level + 1)
    }
  }
  flatten(null, 0)
  
  const wsPos = XLSX.utils.json_to_sheet(flatTree)
  XLSX.utils.book_append_sheet(wb, wsPos, 'Distribusi Per Pos')

  // Sheet 3: Daily Details
  const dailyData = daily.map((d: any) => ({
    'Tanggal': d.closing_date,
    'Omset (Rp)': d.total_revenue,
    'Biaya Iklan (Rp)': d.total_ads_cost,
    'Status': d.status === 'completed' ? 'Selesai' : 'Tertunda'
  }))
  const wsDaily = XLSX.utils.json_to_sheet(dailyData)
  XLSX.utils.book_append_sheet(wb, wsDaily, 'Rincian Harian')

  // Generate buffer using array (Uint8Array) for Edge compatibility
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Laporan-NAWASENA-HOLDING-${month}-${year}.xlsx"`
    }
  })
})

// --- PHASE 14: PAYROLL MODULE ---

app.get('/api/admin/employees', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM employees ORDER BY name ASC").all()
  return c.json(results)
})

app.post('/api/admin/employees', async (c) => {
  const { name, position, base_salary, joined_at } = await c.req.json()
  const id = crypto.randomUUID()
  await c.env.DB.prepare('INSERT INTO employees (id, name, position, base_salary, joined_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, name, position, Number(base_salary), joined_at || null).run()
  return c.json({ success: true, id })
})

app.put('/api/admin/employees/:id', async (c) => {
  const id = c.req.param('id')
  const { name, position, base_salary, is_active } = await c.req.json()
  await c.env.DB.prepare('UPDATE employees SET name=?, position=?, base_salary=?, is_active=? WHERE id=?')
    .bind(name, position, Number(base_salary), is_active ? 1 : 0, id).run()
  return c.json({ success: true })
})

app.delete('/api/admin/employees/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM employees WHERE id=?').bind(id).run()
  return c.json({ success: true })
})

app.get('/api/admin/payroll', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM payroll_runs ORDER BY period_year DESC, period_month DESC").all()
  return c.json(results)
})

app.get('/api/admin/payroll/:id', async (c) => {
  const id = c.req.param('id')
  const run = await c.env.DB.prepare("SELECT * FROM payroll_runs WHERE id=?").bind(id).first()
  if (!run) return c.json({ error: 'Not found' }, 404)
  
  const { results: items } = await c.env.DB.prepare(`
    SELECT pi.*, e.name, e.position 
    FROM payroll_items pi
    JOIN employees e ON pi.employee_id = e.id
    WHERE pi.payroll_run_id = ?
  `).bind(id).all()
  
  return c.json({ ...run, items })
})

app.post('/api/admin/payroll/draft', async (c) => {
  const { period_month, period_year } = await c.req.json()
  
  // Check if exists
  const existing = await c.env.DB.prepare("SELECT id FROM payroll_runs WHERE period_month=? AND period_year=?").bind(period_month, period_year).first()
  if (existing) return c.json({ error: 'Payroll untuk periode ini sudah ada' }, 400)
    
  // Get active employees
  const { results: employees } = await c.env.DB.prepare("SELECT * FROM employees WHERE is_active=1").all()
  if (employees.length === 0) return c.json({ error: 'Tidak ada karyawan aktif' }, 400)
    
  // Get pos_gaji_id
  let posGaji = await c.env.DB.prepare("SELECT value FROM system_config WHERE key='pos_gaji_id'").first()
  if (!posGaji) {
    // Attempt to find it by name
    const findPos = await c.env.DB.prepare("SELECT id FROM pos WHERE name LIKE '%Gaji%' LIMIT 1").first()
    if (!findPos) return c.json({ error: 'Pos Gaji belum ditentukan di sistem. Silakan atur.' }, 400)
    await c.env.DB.prepare("INSERT INTO system_config (key, value) VALUES ('pos_gaji_id', ?)").bind(findPos.id).run()
    posGaji = { value: findPos.id }
  }

  const runId = crypto.randomUUID()
  let total = 0
  const stmts = []
  
  stmts.push(c.env.DB.prepare('INSERT INTO payroll_runs (id, period_month, period_year, pos_id_source) VALUES (?, ?, ?, ?)').bind(runId, period_month, period_year, posGaji.value as string))
  
  for (const emp of employees) {
    const base = Number(emp.base_salary)
    total += base
    stmts.push(
      c.env.DB.prepare('INSERT INTO payroll_items (id, payroll_run_id, employee_id, base_salary, net_salary) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), runId, emp.id, base, base)
    )
  }
  
  stmts.push(c.env.DB.prepare('UPDATE payroll_runs SET total_amount=? WHERE id=?').bind(total, runId))
  
  await c.env.DB.batch(stmts)
  
  return c.json({ success: true, id: runId })
})

app.put('/api/admin/payroll/:id/items', async (c) => {
  const id = c.req.param('id')
  const { items } = await c.req.json()
  
  const run = await c.env.DB.prepare("SELECT status FROM payroll_runs WHERE id=?").bind(id).first()
  if (!run || run.status === 'completed') return c.json({ error: 'Tidak bisa diedit' }, 400)
    
  let total = 0
  const stmts = []
  
  for (const item of items) {
    const net = Number(item.base_salary) + Number(item.allowances) - Number(item.deductions)
    total += net
    stmts.push(
      c.env.DB.prepare('UPDATE payroll_items SET allowances=?, deductions=?, net_salary=? WHERE id=?')
        .bind(Number(item.allowances), Number(item.deductions), net, item.id)
    )
  }
  
  stmts.push(c.env.DB.prepare('UPDATE payroll_runs SET total_amount=? WHERE id=?').bind(total, id))
  
  await c.env.DB.batch(stmts)
  return c.json({ success: true, total })
})

app.post('/api/admin/payroll/:id/process', async (c) => {
  const id = c.req.param('id')
  const { fallback_pos_id } = await c.req.json()
  
  const run = await c.env.DB.prepare("SELECT * FROM payroll_runs WHERE id=?").bind(id).first()
  if (!run || run.status === 'completed') return c.json({ error: 'Tidak valid' }, 400)
    
  const totalAmount = Number(run.total_amount)
  const mainPosId = run.pos_id_source as string
  
  const mainBalanceRow = await c.env.DB.prepare("SELECT current_balance FROM pos_balances WHERE pos_id=?").bind(mainPosId).first()
  const mainBalance = mainBalanceRow ? Number(mainBalanceRow.current_balance) : 0
  
  const stmts = []
  const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  const descPrefix = `Penggajian Periode ${monthNames[run.period_month as number]} ${run.period_year}`
  const today = new Date().toISOString().split('T')[0]
  
  if (mainBalance >= totalAmount) {
    // 100% covered by main POS
    stmts.push(
      c.env.DB.prepare('INSERT INTO expenses (id, pos_id, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), mainPosId, totalAmount, descPrefix, today)
    )
    stmts.push(c.env.DB.prepare('UPDATE pos_balances SET current_balance = current_balance - ? WHERE pos_id = ?').bind(totalAmount, mainPosId))
  } else {
    // Needs cross-subsidy
    if (!fallback_pos_id) return c.json({ error: 'Dana talangan diperlukan' }, 400)
    const deficit = totalAmount - mainBalance
    
    // Check fallback balance
    const fbRow = await c.env.DB.prepare("SELECT current_balance FROM pos_balances WHERE pos_id=?").bind(fallback_pos_id).first()
    const fbBalance = fbRow ? Number(fbRow.current_balance) : 0
    
    if (fbBalance < deficit) return c.json({ error: 'Saldo POS Talangan tidak mencukupi' }, 400)
      
    // Deduct main
    if (mainBalance > 0) {
      stmts.push(
        c.env.DB.prepare('INSERT INTO expenses (id, pos_id, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), mainPosId, mainBalance, `${descPrefix} (Dana Utama)`, today)
      )
      stmts.push(c.env.DB.prepare('UPDATE pos_balances SET current_balance = 0 WHERE pos_id = ?').bind(mainPosId))
    }
    
    // Deduct fallback
    stmts.push(
      c.env.DB.prepare('INSERT INTO expenses (id, pos_id, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), fallback_pos_id, deficit, `${descPrefix} (Dana Talangan/Subsidi)`, today)
    )
    stmts.push(c.env.DB.prepare('UPDATE pos_balances SET current_balance = current_balance - ? WHERE pos_id = ?').bind(deficit, fallback_pos_id))
  }
  
  // Finalize Run
  stmts.push(c.env.DB.prepare("UPDATE payroll_runs SET status='completed', processed_at=CURRENT_TIMESTAMP WHERE id=?").bind(id))
  
  await c.env.DB.batch(stmts)
  
  return c.json({ success: true })
})

// Fungsi otomatis untuk me-refresh token Shopee
async function refreshShopeeTokens(env: Env) {
  if (env.SHOPEE_PARTNER_ID === 'YOUR_PARTNER_ID') return; // Skip if no real keys
  
  // Ambil semua akun yang aktif dan akan expired dalam 1 jam (3600000 ms) atau yang sudah expired
  const oneHourFromNow = new Date(Date.now() + 3600000).toISOString()
  const { results: expiringAccounts } = await env.DB.prepare(
    'SELECT shop_id, refresh_token FROM shopee_accounts WHERE is_active = 1 AND token_expires_at <= ?'
  ).bind(oneHourFromNow).all()

  for (const acc of expiringAccounts) {
    try {
      const partnerId = env.SHOPEE_PARTNER_ID
      const partnerKey = env.SHOPEE_PARTNER_KEY
      const timestamp = Math.floor(Date.now() / 1000)
      const path = '/api/v2/auth/access_token/get'
      const sign = await generateShopeeSign(path, partnerKey, partnerId, timestamp)

      const body = { refresh_token: acc.refresh_token, shop_id: Number(acc.shop_id), partner_id: Number(partnerId) }
      const tokenRes = await fetch(`https://partner.test-stable.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const tokenData = await tokenRes.json()

      if (!tokenData.error) {
        const expiresAt = new Date(Date.now() + tokenData.expire_in * 1000).toISOString()
        await env.DB.prepare(`
          UPDATE shopee_accounts 
          SET access_token = ?, refresh_token = ?, token_expires_at = ? 
          WHERE shop_id = ?
        `).bind(tokenData.access_token, tokenData.refresh_token, expiresAt, acc.shop_id).run()
        console.log(`Successfully refreshed token for shop ${acc.shop_id}`)
      } else {
        console.error(`Failed to refresh token for shop ${acc.shop_id}: ${tokenData.message}`)
      }
    } catch (e) {
      console.error(`Error refreshing token for shop ${acc.shop_id}:`, e)
    }
  }
}

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log("Cron trigger invoked");
    
    // 1. Auto-refresh Shopee Tokens
    try {
      await refreshShopeeTokens(env)
    } catch (e) {
      console.error("Shopee token refresh failed:", e)
    }

    try {
      const config = await env.DB.prepare('SELECT * FROM closing_config LIMIT 1').first()
      if (!config || !config.is_enabled || !config.closing_time || !config.active_pattern_id) return

      // Get current WIB time
      const now = new Date()
      
      const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
      const currentTimeStr = timeFormatter.format(now) // HH:mm
      
      const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' })
      const currentDateStr = dateFormatter.format(now) // YYYY-MM-DD
      
      // If hour matches config
      // E.g., closing_time is "23:00". We check if currentTimeStr starts with "23" 
      // (Cron might run at 23:00 or 23:01 depending on Cloudflare's exact timing)
      const configHour = (config.closing_time as string).split(':')[0]
      const currentHour = currentTimeStr.split(':')[0]
      
      if (currentHour === configHour) {
        // Idempotency check
        const existing = await env.DB.prepare('SELECT id FROM daily_closings WHERE closing_date=?').bind(currentDateStr).first()
        if (!existing) {
          const { totalIncome, totalAdsCost, adsAvailable } = await fetchShopeeDailyData(env)
          if (!adsAvailable) {
            await env.DB.prepare(`
              INSERT INTO daily_closings (id, closing_date, pattern_id_used, total_revenue, total_ads_cost, ads_cost_source, status)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(crypto.randomUUID(), currentDateStr, config.active_pattern_id, totalIncome, 0, 'api', 'pending').run()
          } else {
            await executeClosingDistribution(env, currentDateStr, totalIncome, totalAdsCost, config.active_pattern_id as string)
          }
          console.log(`Successfully ran automated closing for ${currentDateStr}`)
        }
      }
    } catch (e) {
      console.error("Cron failed:", e)
    }
  }
}
