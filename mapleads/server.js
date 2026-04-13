require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── JSON DATABASE (remplace SQLite — compatible toutes versions Node) ─────────
class JsonDB {
  constructor(file) {
    this.file = file;
    this._data = { leads: [], settings: {}, next_id: 1 };
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.file)) {
        this._data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      } else {
        this._save();
      }
    } catch (e) {
      console.warn('DB load error, starting fresh:', e.message);
      this._save();
    }
  }

  _save() {
    fs.writeFileSync(this.file, JSON.stringify(this._data, null, 2));
  }

  now() { return new Date().toISOString(); }

  // ── LEADS ──
  insertOrReplaceLead(lead) {
    const existing = this._data.leads.findIndex(l => l.place_id === lead.place_id);
    if (existing >= 0) {
      this._data.leads[existing] = { ...this._data.leads[existing], ...lead, updated_at: this.now() };
    } else {
      const id = this._data.next_id++;
      this._data.leads.push({ id, status: 'new', notes: '', contact_email: '', created_at: this.now(), updated_at: this.now(), ...lead });
    }
    this._save();
  }

  getLead(id) {
    return this._data.leads.find(l => l.id === parseInt(id)) || null;
  }

  getLeads({ status, search } = {}) {
    let leads = [...this._data.leads];
    if (status && status !== 'all') leads = leads.filter(l => l.status === status);
    if (search) {
      const s = search.toLowerCase();
      leads = leads.filter(l =>
        (l.name || '').toLowerCase().includes(s) ||
        (l.city || '').toLowerCase().includes(s) ||
        (l.sector || '').toLowerCase().includes(s)
      );
    }
    return leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  updateLead(id, fields) {
    const idx = this._data.leads.findIndex(l => l.id === parseInt(id));
    if (idx < 0) return false;
    this._data.leads[idx] = { ...this._data.leads[idx], ...fields, updated_at: this.now() };
    this._save();
    return true;
  }

  deleteLead(id) {
    const before = this._data.leads.length;
    this._data.leads = this._data.leads.filter(l => l.id !== parseInt(id));
    this._save();
    return this._data.leads.length < before;
  }

  getStats() {
    const leads = this._data.leads;
    const byStatus = {};
    leads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
    const ratings = leads.filter(l => l.rating).map(l => l.rating);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;
    return {
      total: leads.length,
      byStatus: Object.entries(byStatus).map(([status, n]) => ({ status, n })),
      avgRating
    };
  }

  // ── SETTINGS ──
  getSettings() { return { ...this._data.settings }; }

  setSettings(obj) {
    Object.assign(this._data.settings, obj);
    this._save();
  }
}

const db = new JsonDB(path.join(__dirname, 'mapleads.json'));

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
    return parts[parts.length - 2].trim().replace(/^\d{5}\s*/, '').trim();
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
    'website', 'rating', 'user_ratings_total', 'reviews', 'geometry', 'business_status', 'types'
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
      if (data.status === 'REQUEST_DENIED') return res.status(400).json({ error: 'Clé Google Places invalide', detail: data.error_message });
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return res.status(400).json({ error: data.status, detail: data.error_message });

      const filtered = (data.results || []).filter(p =>
        typeof p.rating === 'number' && p.rating <= maxRating && (p.user_ratings_total || 0) >= minReviews
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

    const details = await getPlaceDetails(placeId);
    if (details.status !== 'OK') return res.status(400).json({ error: `Google: ${details.status}`, detail: details.error_message });

    const place = details.result;
    const reviews = (place.reviews || []).filter(r => r.text && r.text.length > 20);
    const address = place.formatted_address || '';
    const postal = extractPostalCode(address);
    const city = extractCity(address);

    if (reviews.length === 0) {
      db.insertOrReplaceLead({ place_id: place.place_id, name: place.name, address, city, postal_code: postal, phone: place.formatted_phone_number || '', website: place.website || '', rating: place.rating, total_ratings: place.user_ratings_total, pain_points: [] });
      return res.json({ place: { ...place, postal_code: postal, city }, analysis: { painPoints: [], mainPain: 'Avis insuffisants', email: '', emailSubject: '' }, reviews: [] });
    }

    const reviewsText = reviews.map((r, i) =>
      `[Avis ${i + 1} — ${r.rating}★ — ${r.relative_time_description}]\n"${r.text}"`
    ).join('\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Tu es MapLeads AI, un expert en analyse de satisfaction client et prospection B2B.

Voici les avis Google de l'entreprise "${place.name}" (${place.rating}/5 — ${place.user_ratings_total} avis au total) :

${reviewsText}

Mon offre : ${offer || '(offre non précisée)'}

MISSION :
1. Identifie les 3 à 5 douleurs les plus récurrentes et concrètes. Cite des phrases réelles des avis.
2. Croise chaque douleur avec mon offre.
3. Rédige un cold email B2B en français, 130-150 mots, ton professionnel mais chaleureux.
   - Ne mentionne JAMAIS les avis Google ou que tu as "lu des avis"
   - Adresse les douleurs de façon naturelle
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
      const raw = message.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      analysis = JSON.parse(raw);
    } catch (parseErr) {
      console.error('JSON parse error:', message.content[0].text);
      return res.status(500).json({ error: 'Réponse Claude invalide', raw: message.content[0].text });
    }

    db.insertOrReplaceLead({
      place_id: place.place_id, name: place.name, address, city, postal_code: postal,
      phone: place.formatted_phone_number || '', website: place.website || '',
      rating: place.rating, total_ratings: place.user_ratings_total,
      sector: analysis.sector || '', pain_points: analysis.painPoints || [],
      subject: analysis.emailSubject || '', generated_email: analysis.email || '',
      lat: place.geometry?.location?.lat || null, lng: place.geometry?.location?.lng || null
    });

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
Douleurs : ${(painPoints || []).map(p => p.point || p).join(' / ')}
Mon offre : ${offer || '(à préciser)'}

Règles : 130-150 mots, professionnel et chaleureux, ne mentionne PAS les avis Google, CTA = appel 15 min, termine par "Si vous ne souhaitez plus recevoir d'emails, répondez simplement STOP."

Réponds en JSON valide uniquement :
{"subject": "...", "email": "..."}`
      }]
    });

    const raw = message.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const result = JSON.parse(raw);

    if (leadId) db.updateLead(leadId, { subject: result.subject, generated_email: result.email });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTES — CRM ─────────────────────────────────────────────────────────────
app.get('/api/leads', (req, res) => {
  res.json(db.getLeads({ status: req.query.status, search: req.query.search }));
});

app.get('/api/leads/:id', (req, res) => {
  const lead = db.getLead(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead introuvable' });
  res.json(lead);
});

app.patch('/api/leads/:id', (req, res) => {
  const { status, notes, contact_email } = req.body;
  const fields = {};
  if (status !== undefined) fields.status = status;
  if (notes !== undefined) fields.notes = notes;
  if (contact_email !== undefined) fields.contact_email = contact_email;
  db.updateLead(req.params.id, fields);
  res.json({ success: true });
});

app.delete('/api/leads/:id', (req, res) => {
  db.deleteLead(req.params.id);
  res.json({ success: true });
});

app.get('/api/stats', (req, res) => res.json(db.getStats()));

// ─── ROUTES — EMAIL SENDING ───────────────────────────────────────────────────
app.post('/api/send-email', async (req, res) => {
  try {
    const { leadId, to, subject, body } = req.body;
    const smtpHost = process.env.SMTP_HOST, smtpUser = process.env.SMTP_USER, smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpUser || !smtpPass) return res.status(400).json({ error: 'SMTP non configuré dans .env' });

    const transporter = nodemailer.createTransport({
      host: smtpHost, port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass }
    });
    await transporter.sendMail({ from: `"${process.env.SMTP_FROM_NAME || smtpUser}" <${process.env.SMTP_FROM_EMAIL || smtpUser}>`, to, subject, text: body });
    if (leadId) db.updateLead(leadId, { status: 'contacted' });
    res.json({ success: true });
  } catch (err) {
    console.error('[send-email]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTES — SETTINGS ────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => res.json(db.getSettings()));
app.post('/api/settings', (req, res) => { db.setSettings(req.body); res.json({ success: true }); });

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 MapLeads France démarré sur http://localhost:${PORT}\n`);
  if (!GOOGLE_KEY) console.warn('⚠️  GOOGLE_PLACES_API_KEY non configurée');
  if (!process.env.ANTHROPIC_API_KEY) console.warn('⚠️  ANTHROPIC_API_KEY non configurée');
});
