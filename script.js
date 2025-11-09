(()=>{
  const memoryKey='lucen.memory';
  const apiKey='lucen.api';
  const modeKey='nucleos.mode'; // 'Creation' | 'Guidance'
  const rcKey='lucen.dial.rc';
  const geKey='lucen.dial.ge';

  const $ = s=>document.querySelector(s);
  const $$ = s=>[...document.querySelectorAll(s)];

  const tabs=$$('[data-tab]'); const panels=$$('.panel');
  tabs.forEach(btn=>btn.addEventListener('click',()=>{
    tabs.forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const id=btn.dataset.tab; panels.forEach(p=>p.classList.toggle('active', p.id===id));
  }));

  const apiInput = $('#apiBase');
  const saveApiBtn = $('#saveApi');
  const badge = $('#onlineBadge');
  const logBtn = $('#logBtn');
  const ta = $('#visionInput');
  const list = $('#memoryList');
  const gatesList = $('#gatesList');
  const payBtn = $('#payBtn');
  const payAmount = $('#payAmount');
  const payGate = $('#payGate');

  const dialRC = $('#dialRC');
  const dialGE = $('#dialGE');
  const modeCreation = $('#modeCreation');
  const modeGuidance = $('#modeGuidance');
  const beam = $('#beam');

  // init values
  const savedAPI = localStorage.getItem(apiKey);
  if (savedAPI && apiInput) apiInput.value = savedAPI;

  dialRC.value = localStorage.getItem(rcKey) || "50";
  dialGE.value = localStorage.getItem(geKey) || "50";
  const savedMode = localStorage.getItem(modeKey) || 'Guidance';
  if (savedMode==='Creation'){ modeCreation.classList.add('active'); modeGuidance.classList.remove('active'); beam.style.animationDuration='1.5s'; }
  else { modeGuidance.classList.add('active'); modeCreation.classList.remove('active'); beam.style.animationDuration='3s'; }

  dialRC.addEventListener('input', ()=>localStorage.setItem(rcKey, dialRC.value));
  dialGE.addEventListener('input', ()=>localStorage.setItem(geKey, dialGE.value));

  modeCreation.addEventListener('click', ()=>{ localStorage.setItem(modeKey,'Creation'); modeCreation.classList.add('active'); modeGuidance.classList.remove('active'); beam.style.animationDuration='1.5s'; });
  modeGuidance.addEventListener('click', ()=>{ localStorage.setItem(modeKey,'Guidance'); modeGuidance.classList.add('active'); modeCreation.classList.remove('active'); beam.style.animationDuration='3s'; });

  function apiBase(){ 
  return (localStorage.getItem('lucen.api') || 'https://lucen17-backend.onrender.com'); 
  }
  
  async function getJSON(url){ const r=await fetch(url); if(!r.ok) throw new Error(`GET ${url} ${r.status}`); return r.json(); }
  async function postJSON(url,data){ const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if(!r.ok) throw new Error(`POST ${url} ${r.status}`); return r.json(); }

  function classifyTone(text){
    const t=text.toLowerCase();
    if (/(do|today|plan|next|ship|build|fix|schedule|deploy|commit|merge)/.test(t)) return 'Directive';
    if (/(idea|imagine|design|create|vision|dream|invent|sketch)/.test(t)) return 'Creative';
    return 'Reflective';
  }

  function toneColor(t){ return t==='Directive'?'orange':(t==='Creative'?'yellow':'blue'); }

  function escapeHtml(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function renderLocal(){
    const items = JSON.parse(localStorage.getItem(memoryKey)||'[]');
    const html = items.slice().reverse().map(i=>{
      const color = toneColor(i.tone||'Reflective');
      const ts = new Date(i.ts||Date.now()).toLocaleString();
      return `<div class="card">
        <div class="tone">${i.tone||'Reflective'}</div>
        <div class="ts">${ts}</div>
        <div class="txt">${escapeHtml(i.text||'')}</div>
        <div class="node ${color}"></div>
      </div>`;
    }).join('');
    list.innerHTML = html;
  }

  async function refreshOnline(){
    const base = apiBase();
    if(!base){ badge.textContent='Offline'; badge.classList.remove('online'); return; }
    try{
      const h = await getJSON(`${base}/health`);
      if(h && h.ok){ badge.textContent='Online'; badge.classList.add('online'); await refreshGates(); await pullServerMemory(); }
      else { badge.textContent='Offline'; badge.classList.remove('online'); }
    }catch{ badge.textContent='Offline'; badge.classList.remove('online'); }
  }

  async function refreshGates(){
    const base = apiBase(); if(!base) return;
    try{
      const { gates } = await getJSON(`${base}/gates`);
      gatesList.innerHTML = (gates||[]).map(g=>`<div class="card"><b>${g.name}</b> — ${g.blurb} <span style="float:right;opacity:.7">${g.toll}</span></div>`).join('');
    }catch{ gatesList.innerHTML = '<div class="card">(gates unavailable)</div>'; }
  }

  async function pullServerMemory(){
    const base = apiBase(); if(!base) return;
    try{
      const { items } = await getJSON(`${base}/memory?limit=200`);
      if(Array.isArray(items)){
        const html = items.slice().reverse().map(i=>{
          const color = toneColor(i.tone||'Reflective');
          const ts = new Date(i.ts||Date.now()).toLocaleString();
          return `<div class="card">
            <div class="tone">${i.tone||'Reflective'}</div>
            <div class="ts">${ts}</div>
            <div class="txt">${escapeHtml(i.text||'')}</div>
            <div class="node ${color}"></div>
          </div>`;
        }).join('');
        list.innerHTML = html;
      }
    }catch{/* ignore */}
  }

  // ---------------- Log Reflection (DB + Fallback) ----------------
async function logReflection() {
  const text = (ta?.value || "").trim();
  if (!text) return alert("Enter a reflection first.");

  const tone = classifyTone(text);
  const entry = { text, tone, ts: Date.now(), deviceId: "lucen17-ui" };

  const base = apiBase() || "https://lucen17-backend.onrender.com";

  try {
    const res = await fetch(`${base}/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });
    const data = await res.json();

    if (data.saved) {
      console.log("✅ Saved to Lucen Core:", data);
    } else {
      console.warn("⚠️ Backend save failed, keeping local copy.");
    }
  } catch (err) {
    console.error("💾 Network error, fallback to local:", err);
  }

  // Always keep local fallback copy
  const arr = JSON.parse(localStorage.getItem(memoryKey) || "[]");
  arr.push(entry);
  if (arr.length > 5000) arr.splice(0, arr.length - 5000);
  localStorage.setItem(memoryKey, JSON.stringify(arr));

  // guidance drift influence
  driftFromTone(tone);
}

  // Guidance drift: adjust sliders based on tone and recent rhythm
  function driftFromTone(tone){
    if ((localStorage.getItem(modeKey) || 'Guidance') !== 'Guidance') return;
    const rc = Number(localStorage.getItem(rcKey) || dialRC.value || 50);
    const ge = Number(localStorage.getItem(geKey) || dialGE.value || 50);
    let nrc = rc, nge = ge;
    if (tone==='Creative'){ nrc = Math.min(100, rc+3); nge = Math.min(100, ge+2); }
    else if (tone==='Directive'){ nrc = Math.max(0, rc-2); nge = Math.max(0, ge-1); }
    else { nrc = Math.max(0, Math.min(100, rc + (Math.random()*2-1))); }
    dialRC.value = String(nrc); dialGE.value = String(nge);
    localStorage.setItem(rcKey, String(nrc)); localStorage.setItem(geKey, String(nge));
  }

  // passive breathing in Guidance
  setInterval(()=>{
    if ((localStorage.getItem(modeKey) || 'Guidance') !== 'Guidance') return;
    const rc = Number(localStorage.getItem(rcKey) || dialRC.value || 50);
    const ge = Number(localStorage.getItem(geKey) || dialGE.value || 50);
    const nrc = Math.max(0, Math.min(100, rc + (Math.random()*2-1)));
    const nge = Math.max(0, Math.min(100, ge + (Math.random()*2-1)));
    dialRC.value = String(nrc); dialGE.value = String(nge);
    localStorage.setItem(rcKey, String(nrc)); localStorage.setItem(geKey, String(nge));
  }, 5000);

  saveApiBtn?.addEventListener('click',()=>{
    const v=(apiInput?.value||'').trim(); if(!v){ alert('Enter API URL'); return; }
    localStorage.setItem(apiKey, v); refreshOnline(); alert('API URL saved');
  });
  logBtn?.addEventListener('click', logReflection);

  payBtn?.addEventListener("click", async () => {
  const base = apiBase(); 
  if (!base) { alert("Save API first"); return; }
  const amt = Number(payAmount.value || 3);
  const gate = payGate.value;
  try {
    const r = await postJSON(`${base}/tolls/pay`, { gate, amount: amt, currency: "GBP" });
    if (r.simulated) alert("Simulated payment ok");
    else if (r.client_secret) alert("PaymentIntent created (test). Implement client confirm in Stripe.js later.");
    else alert("Payment response received.");
  } catch (e) { alert("Payment failed"); }
});

// --- Division toggle logic ---
function toggleDesc(btn) {
  const p = btn.nextElementSibling;
  p.style.display = p.style.display === "block" ? "none" : "block";
}
function toggleSeeds(btn) {
  const ul = btn.nextElementSibling;
  ul.style.display = ul.style.display === "block" ? "none" : "block";
}

// initial paint
(function init() {
  renderLocal();
  refreshOnline();
})();
// === Lucen 17 - Stage 4.2 Local Persistence ===

// Default division structure
const defaultDivisions = {
  fieldOps:      { focusHours: '', wins: '', blockers: '', mood: '' },
  selfSustain:   { focusHours: '', wins: '', blockers: '', mood: '' },
  mindRhythm:    { focusHours: '', wins: '', blockers: '', mood: '' },
  flowPlanning:  { focusHours: '', wins: '', blockers: '', mood: '' },
  learningPulse: { focusHours: '', wins: '', blockers: '', mood: '' },
  wellbeingLoop: { focusHours: '', wins: '', blockers: '', mood: '' },
  familyField:   { focusHours: '', wins: '', blockers: '', mood: '' },
  businessLine:  { focusHours: '', wins: '', blockers: '', mood: '' }
};

// Load divisions from localStorage or seed defaults
let lucenDivisions = JSON.parse(localStorage.getItem('lucen.divisions')) || defaultDivisions;

// Save divisions safely (debounced)
function saveDivisions() {
  try {
    localStorage.setItem('lucen.divisions', JSON.stringify(lucenDivisions));
  } catch (e) {
    console.warn('Lucen17: Storage quota reached or write failed.', e);
  }
}

// Initialize division fields on load
function initDivisions() {
  Object.keys(lucenDivisions).forEach(name => {
    const section = document.querySelector(`[data-division="${name}"]`);
    if (!section) return;

    const fields = ['focusHours', 'wins', 'blockers', 'mood'];
    fields.forEach(key => {
      const input = section.querySelector(`[data-field="${key}"]`);
      if (input) {
        input.value = lucenDivisions[name][key] || '';
        input.addEventListener('input', () => {
          lucenDivisions[name][key] = input.value;
          saveDivisions();
        });
      }
    });
  });
}

window.addEventListener('DOMContentLoaded', initDivisions);
})();
