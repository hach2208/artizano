require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const Anthropic = require('@anthropic-ai/sdk');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── DATABASE ──────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'mapleads.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id TEXT UNIQUE,
    name TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    phone TEXT,
    website TEXT,
    contact_email TEXT,
    rating REAL,
    total_ratings INTEGER,
    sector TEXT,
    pain_points TEXT,
    subject TEXT,
    generated_email TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    lat REAL,
    lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES = 'https://maps.googleapis.com/maps/api/place';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractPostalCode(address) {
  const match = address && address.match(/\b(\d{5})\b/);
  return match ? match[1] : '';
}

function extractCity(address) {
  if (!address) return '';
  const parts = address.split(',');
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2].trim();
    return cityPart.replace(/^\d{5}\s*/, '').trim();
  }
  return '';
}

async function googleFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchPlaces(query, pageToken = null) {
  let url = `${PLACES}/textsearch/json?query=${encodeURIComponent(query)}&language=fr&region=fr&key=${GOOGLE_KEY}`;
  if (pageToken) url += `&pagetoken=${pageToken}`;
  return googleFetch(url);
}

async function getPlaceDetails(placeId) {
  const fields = [
    'place_id', 'name', 'formatted_address', 'formatted_phone_number',
    'website', 'rating', 'user_ratings_total', 'reviews',
    'geometry', 'business_status', 'types'
  ].join(',');
  const url = `${PLACES}/details/json?place_id=${placeId}&fields=${fields}&language=fr&key=${GOOGLE_KEY}`;
  return googleFetch(url);
}

// ─── ROUTES — SEARCH ──────────────────────────────────────────────────────────
app.post('/api/search', async (req, res) => {
  try {
    const { query, city, maxRating = 3.5, minReviews = 10, maxPages = 3 } = req.body;

    if (!GOOGLE_KEY) return res.status(400).json({ error: 'GOOGLE_PLACES_API_KEY manquante dans .env' });

    const searchQuery = city ? `${query} ${city} France` : `${query} France`;
    const results = [];
    let pageToken = null;
    let pages = 0;

    do {
      const data = await searchPlaces(searchQuery, pageToken);

      if (data.status === 'REQUEST_DENIED') {
        return res.status(400).json({ error: 'Clé Google Places invalide', detail: data.error_message });
      }
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return res.status(400).json({ error: data.status, detail: data.error_message });
      }

      const filtered = (data.results || []).filter(p =>
        typeof p.rating === 'number' &&
        p.rating <= maxRating &&
        (p.user_ratings_total || 0) >= minReviews
      ).map(p => ({
        place_id: p.place_id,
        name: p.name,
        address: p.formatted_address,
        city: extractCity(p.formatted_address),
        postal_code: extractPostalCode(p.formatted_address),
        rating: p.rating,
        total_ratings: p.user_ratings_total,
        types: p.types
      }));

      results.push(...filtered);
      pageToken = data.next_page_token;
      pages++;

      if (pageToken && pages < maxPages) await sleep(2200);
    } while (pageToken && pages < maxPages);

    res.json({ results, total: results.length, query: searchQuery });
  } catch (err) {
    console.error('[search]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTES — ANALYZE ─────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  try {
    const { placeId, offer } = req.body;

    if (!GOOGLE_KEY) return res.status(400).json({ error: 'GOOGLE_PLACES_API_KEY manquante' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(400).json({ error: 'ANTHROPIC_API_KEY manquante' });

    // Fetch from Google
    const details = await getPlaceDetails(placeId);
    if (details.status !== 'OK') {
      return res.status(400).json({ error: `Google: ${details.status}`, detail: details.error_message });
    }

    const place = details.result;
    const reviews = (place.reviews || []).filter(r => r.text && r.text.length > 20);

    const address = place.formatted_address || '';
    const postal = extractPostalCode(address);
    const city = extractCity(address);

    if (reviews.length === 0) {
      // Save without analysis
      db.prepare(`INSERT OR REPLACE INTO leads
        (place_id, name, address, city, postal_code, phone, website, rating, total_ratings, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
      `).run(
        place.place_id, place.name, address, city, postal,
        place.formatted_phone_number || '',
        place.website || '',
        place.rating, place.user_ratings_total
      );
      return res.json({
        place: { ...place, postal_code: postal, city },
        analysis: { painPoints: [], mainPain: 'Avis insuffisants', email: '', emailSubject: '' },
        reviews: []
      });
    }

    // Build review text
    const reviewsText = reviews.map((r, i) =>
      `[Avis ${i + 1} — ${r.rating}★ — ${r.relative_time_description}]\n"${r.text}"`
    ).join('\n\n');

    const offerText = offer || '(offre non précisée)';

    // Claude analysis
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Tu es MapLeads AI, un expert en analyse de satisfaction client et prospection B2B.

Voici les avis Google de l'entreprise "${place.name}" (${place.rating}/5 — ${place.user_ratings_total} avis au total) :

${reviewsText}

Mon offre : ${offerText}

MISSION :
1. Identifie les 3 à 5 douleurs les plus récurrentes et concrètes. Cite des phrases réelles des avis.
2. Croise chaque douleur avec mon offre.
3. Rédige un cold email B2B en français, 130-150 mots, ton professionnel mais chaleureux.
   - Ne mentionne JAMAIS les avis Google ou que tu as "lu des avis"
   - Adresse les douleurs de façon naturelle (comme si tu l'avais constaté autrement)
   - CTA clair : proposer un appel de 15 min
   - Termine par : "Si vous ne souhaitez plus recevoir d'emails, répondez simplement STOP."

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant/après :
{
  "sector": "secteur détecté",
  "mainPain": "la douleur principale en une phrase courte",
  "painPoints": [
    {"point": "...", "citation": "phrase exacte issue d'un avis", "frequency": "haute|moyenne|basse"},
    {"point": "...", "citation": "phrase exacte", "frequency": "haute|moyenne|basse"},
    {"point": "...", "citation": "phrase exacte", "frequency": "haute|moyenne|basse"}
  ],
  "emailSubject": "Ligne objet max 7 mots",
  "email": "Email complet prêt à copier-coller"
}`
      }]
    });

    let analysis;
    try {
      const raw = message.content[0].text.trim();
      const jsonStr = raw.replace(/^```json\s*/i, '').replace(/```$/,'').trim();
      analysis = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('JSON parse error:', message.content[0].text);
      return res.status(500).json({ error: 'Réponse Claude invalide', raw: message.content[0].text });
    }

    // Save to DB
    db.prepare(`INSERT OR REPLACE INTO leads
      (place_id, name, address, city, postal_code, phone, website, rating, total_ratings,
       sector, pain_points, subject, generated_email, lat, lng, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `).run(
      place.place_id,
      place.name,
      address,
      city,
      postal,
      place.formatted_phone_number || '',
      place.website || '',
      place.rating,
      place.user_ratings_total,
      analysis.sector || '',
      JSON.stringify(analysis.painPoints || []),
      analysis.emailSubject || '',
      analysis.email || '',
      place.geometry?.location?.lat || null,
      place.geometry?.location?.lng || null
    );

    res.json({ place: { ...place, postal_code: postal, city }, analysis, reviews });
  } catch (err) {
    console.error('[analyze]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTES — REGENERATE EMAIL ────────────────────────────────────────────────
app.post('/api/regenerate-email', async (req, res) => {
  try {
    const { leadId, companyName, painPoints, offer } = req.body;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Rédige un nouveau cold email B2B pour "${companyName}".
Douleurs : ${painPoints.map(p => p.point || p).join(' / ')}
Mon offre : ${offer || '(à préciser)'}

Règles : 130-150 mots, professionnel et chaleureux, ne mentionne PAS les avis Google, CTA = appel 15 min, termine par "Si vous ne souhaitez plus recevoir d'emails, répondez simplement STOP."

Réponds en JSON valide uniquement :
{"subject": "...", "email": "..."}`
      }]
    });

    const raw = message.content[0].text.trim().replace(/^```json\s*/i,'').replace(/```$/,'').trim();
    const result = JSON.parse(raw);

    if (leadId) {
      db.prepare('UPDATE leads SET subject=?, generated_email=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .run(result.subject, result.email, leadId);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTES — CRM ─────────────────────────────────────────────────────────────
app.get('/api/leads', (req, res) => {
  const { status, search } = req.query;
  const conditions = [];
  const params = [];

  if (status && status !== 'all') { conditions.push('status = ?'); params.push(status); }
  if (search) {
    conditions.push('(name LIKE ? OR city LIKE ? OR sector LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  let q = 'SELECT * FROM leads';
  if (conditions.length) q += ' WHERE ' + conditions.join(' AND ');
  q += ' ORDER BY created_at DESC';

  const leads = db.prepare(q).all(...params);
  leads.forEach(l => {
    if (l.pain_points) {
      try { l.pain_points = JSON.parse(l.pain_points); }
      catch { l.pain_points = []; }
    }
  });
  res.json(leads);
});

app.get('/api/leads/:id', (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead introuvable' });
  if (lead.pain_points) {
    try { lead.pain_points = JSON.parse(lead.pain_points); } catch { lead.pain_points = []; }
  }
  res.json(lead);
});

app.patch('/api/leads/:id', (req, res) => {
  const { status, notes, contact_email } = req.body;
  const updates = ['updated_at = CURRENT_TIMESTAMP'];
  const params = [];

  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  if (contact_email !== undefined) { updates.push('contact_email = ?'); params.push(contact_email); }

  params.push(req.params.id);
  db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true });
});

app.delete('/api/leads/:id', (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as n FROM leads').get().n;
  const byStatus = db.prepare('SELECT status, COUNT(*) as n FROM leads GROUP BY status').all();
  const avgRating = db.prepare('SELECT AVG(rating) as avg FROM leads').get().avg;
  res.json({ total, byStatus, avgRating: avgRating ? avgRating.toFixed(1) : 0 });
});

// ─── ROUTES — EMAIL SENDING ───────────────────────────────────────────────────
app.post('/api/send-email', async (req, res) => {
  try {
    const { leadId, to, subject, body } = req.body;

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromName = process.env.SMTP_FROM_NAME || smtpUser;
    const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(400).json({ error: 'Configuration SMTP manquante dans .env (SMTP_HOST, SMTP_USER, SMTP_PASS)' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass }
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text: body
    });

    if (leadId) {
      db.prepare('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('contacted', leadId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[send-email]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTES — SETTINGS ────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  rows.forEach(r => out[r.key] = r.value);
  res.json(out);
});

app.post('/api/settings', (req, res) => {
  const entries = Object.entries(req.body);
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction(() => entries.forEach(([k, v]) => stmt.run(k, v)));
  tx();
  res.json({ success: true });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 MapLeads France démarré sur http://localhost:${PORT}\n`);
  if (!GOOGLE_KEY) console.warn('⚠️  GOOGLE_PLACES_API_KEY non configurée');
  if (!process.env.ANTHROPIC_API_KEY) console.warn('⚠️  ANTHROPIC_API_KEY non configurée');
});
