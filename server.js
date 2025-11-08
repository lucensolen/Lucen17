/**
 * Lucen17 – Full Working Build (v1.8)
 * API: health, gates, memory, tolls (Stripe-ready), guidance hooks
 * Persistence: in-memory with optional JSON snapshot + Postgres (DATABASE_URL)
 */
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
let stripe = null;

dotenv.config();

const app = express();
app.use(cors({ origin: "*", methods: ["GET","POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json());

// ---------------- Persistence layer ----------------
const DATA_DIR = process.env.DATA_DIR || "./data";
const MEMORY_PATH = path.join(DATA_DIR, "memory.json");
const TOLLS_PATH  = path.join(DATA_DIR, "tolls.json");

function safeReadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
function safeWriteJSON(p, obj) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  } catch (_) { /* noop on read-only FS */ }
}

let memory = safeReadJSON(MEMORY_PATH, []); // [{id,text,tone,ts,deviceId}]
let tolls  = safeReadJSON(TOLLS_PATH,  []); // [{id,gate,amount,currency,ts,deviceId,pi}]

const gates = [
  { key: "rootline", name: "RootLine", toll: "free",  blurb: "Resilience + lineage knowledge base." },
  { key: "dara",     name: "Dara",     toll: "£3/mo", blurb: "Earth Gate — grounded creation." },
  { key: "vara",     name: "Vara",     toll: "£3/mo", blurb: "Sky Gate — connective interface." }
];

// Optional Postgres (DATABASE_URL)
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL ? { rejectUnauthorized: false } : false });
}

// Optional Stripe (STRIPE_SECRET_KEY)
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

// ---------------- API ----------------
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "lucen17", ts: Date.now(), db: !!pool, stripe: !!stripe });
});

app.get("/gates", (_req, res) => res.json({ gates }));

// memory
app.get("/memory", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);
  const items = memory.slice(-limit);
  res.json({ items });
});

app.post("/memory", async (req, res) => {
  const { text, tone, ts, deviceId } = req.body || {};
  if (!text) return res.status(400).json({ error: "text required" });
  // simple backend tone inference if missing
  const inferredTone = tone || inferTone(text);
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    text: String(text).slice(0, 4000),
    tone: inferredTone,
    ts: Number(ts) || Date.now(),
    deviceId: deviceId || "web"
  };
  memory.push(item);
  if (memory.length > 5000) memory.splice(0, memory.length - 5000);
  safeWriteJSON(MEMORY_PATH, memory);
  res.json({ saved: true, item });
});

// tolls / payments
app.post("/tolls", (req, res) => {
  const { gate, amount, currency, deviceId } = req.body || {};
  if (!gate) return res.status(400).json({ error: "gate required" });
  const tx = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    gate,
    amount: Number(amount) || 0,
    currency: currency || "GBP",
    ts: Date.now(),
    deviceId: deviceId || "web"
  };
  tolls.push(tx);
  if (tolls.length > 5000) tolls.splice(0, tolls.length - 5000);
  safeWriteJSON(TOLLS_PATH, tolls);
  res.json({ saved: true, tx });
});

// Stripe payment intent (test/live depending on key)
app.post("/tolls/pay", async (req, res) => {
  const { gate, amount, currency = "GBP", metadata = {} } = req.body || {};
  if (!gate || !amount) return res.status(400).json({ error: "gate and amount required" });

  // If Stripe not configured, simulate
  if (!stripe) {
    return res.json({ ok: true, simulated: true, client_secret: "sim_client_secret_" + Date.now() });
  }
  try {
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * (currency.toUpperCase() === "GBP" ? 100 : 100)),
      currency: currency.toLowerCase(),
      metadata: { gate, ...metadata }
    });
    res.json({ ok: true, client_secret: pi.client_secret });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------------- Utilities ----------------
function inferTone(text) {
  const t = String(text).toLowerCase();
  if (/(do|today|plan|next|ship|build|fix|schedule|deploy|commit|merge)/.test(t)) return "Directive";
  if (/(idea|imagine|design|create|vision|dream|invent|sketch)/.test(t)) return "Creative";
  return "Reflective";
}

// ---------------- Start ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[lucen17] API listening on :${PORT}`));
