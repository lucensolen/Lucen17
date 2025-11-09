(() => {
  const memoryKey = 'lucen.memory';
  const apiKey    = 'lucen.api';
  const modeKey   = 'nucleos.mode'; // 'Creation' | 'Guidance'
  const rcKey     = 'lucen.dial.rc';
  const geKey     = 'lucen.dial.ge';

  const $  = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  // Tabs
  const tabs = $$('[data-tab]'); 
  const panels = $$('.panel');
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    panels.forEach(p => p.classList.toggle('active', p.id === id));
  }));

  // DOM refs
  const apiInput   = $('#apiBase');
  const saveApiBtn = $('#saveApi');
  const badge      = $('#onlineBadge');
  const logBtn     = $('#logBtn');
  const ta         = $('#visionInput');
  const list       = $('#memoryList');
  const gatesList  = $('#gatesList');
  const payBtn     = $('#payBtn');
  const payAmount  = $('#payAmount');
  const payGate    = $('#payGate');

  const dialRC       = $('#dialRC');
  const dialGE       = $('#dialGE');
  const modeCreation = $('#modeCreation');
  const modeGuidance = $('#modeGuidance');
  const beam         = $('#beam');

  // Init values
  const savedAPI = localStorage.getItem(apiKey);
  if (savedAPI && apiInput) apiInput.value = savedAPI;

  dialRC.value = localStorage.getItem(rcKey) || "50";
  dialGE.value = localStorage.getItem(geKey) || "50";
  const savedMode = localStorage.getItem(modeKey) || 'Guidance';
  if (savedMode === 'Creation') {
    modeCreation.classList.add('active');
    modeGuidance.classList.remove('active');
    if (beam) beam.style.animationDuration = '1.5s';
  } else {
    modeGuidance.classList.add('active');
    modeCreation.classList.remove('active');
    if (beam) beam.style.animationDuration = '3s';
  }

  dialRC?.addEventListener('input', () => localStorage.setItem(rcKey, dialRC.value));
  dialGE?.addEventListener('input', () => localStorage.setItem(geKey, dialGE.value));

  modeCreation?.addEventListener('click', () => {
    localStorage.setItem(modeKey, 'Creation');
    modeCreation.classList.add('active');
    modeGuidance.classList.remove('active');
    if (beam) beam.style.animationDuration = '1.5s';
  });
  modeGuidance?.addEventListener('click', () => {
    localStorage.setItem(modeKey, 'Guidance');
    modeGuidance.classList.add('active');
    modeCreation.classList.remove('active');
    if (beam) beam.style.animationDuration = '3s';
  });

  // Helpers
  function apiBase() {
    return (localStorage.getItem(apiKey) || 'https://lucen17-backend.onrender.com');
  }
  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`GET ${url} ${r.status}`);
    return r.json();
  }
  async function postJSON(url, data) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`POST ${url} ${r.status}`);
    return r.json();
  }

  function classifyTone(text) {
    const t = text.toLowerCase();
    if (/(do|today|plan|next|ship|build|fix|schedule|deploy|commit|merge)/.test(t)) return 'Directive';
    if (/(idea|imagine|design|create|vision|dream|invent|sketch)/.test(t)) return 'Creative';
    return 'Reflective';
  }
  function toneColor(t) {
    return t === 'Directive' ? 'orange' : (t === 'Creative' ? 'yellow' : 'blue');
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  // Local memory render
  function renderLocal() {
    const items = JSON.parse(localStorage.getItem(memoryKey) || '[]');
    const html = items.slice().reverse().map(i => {
      const color = toneColor(i.tone || 'Reflective');
      const ts = (i.ts ? new Date(i.ts) : new Date()).toLocaleString();
      return `<div class="card">
        <div class="tone">${i.tone || 'Reflective'}</div>
        <div class="ts">${ts}</div>
        <div class="txt">${escapeHtml(i.text || '')}</div>
        <div class="node ${color}"></div>
      </div>`;
    }).join('');
    if (list) list.innerHTML = html;
  }

  // Online badge + server pulls
  async function refreshOnline() {
    const base = apiBase();
    if (!badge) return;
    if (!base) { badge.textContent = 'Offline'; badge.classList.remove('online'); return; }
    try {
      const h = await getJSON(`${base}/health`);
      if (h && h.ok) {
        badge.textContent = 'Online';
        badge.classList.add('online');
        await refreshGates();
        await pullServerMemory();
      } else {
        badge.textContent = 'Offline';
        badge.classList.remove('online');
      }
    } catch {
      badge.textContent = 'Offline';
      badge.classList.remove('online');
    }
  }

  async function refreshGates() {
    const base = apiBase(); 
    if (!base || !gatesList) return;
    try {
      const { gates } = await getJSON(`${base}/gates`);
      gatesList.innerHTML = (gates || []).map(g =>
        `<div class="card"><b>${g.name}</b> — ${g.blurb} <span style="float:right;opacity:.7">${g.toll}</span></div>`
      ).join('');
    } catch {
      gatesList.innerHTML = '<div class="card">(gates unavailable)</div>';
    }
  }

  async function pullServerMemory() {
    const base = apiBase(); 
    if (!base || !list) return;
    try {
      const items = await getJSON(`${base}/memory?limit=200`);
      if (Array.isArray(items)) {
        const html = items
          .filter(i => i.text)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))
          .map(i => {
            const color = toneColor(i.tone || 'Reflective');
            const ts = i.ts ? new Date(i.ts) : new Date();
            const displayDate = ts.toLocaleString();
            return `<div class="card">
              <div class="tone">${i.tone || 'Reflective'}</div>
              <div class="ts">${displayDate}</div>
              <div class="txt">${escapeHtml(i.text || '')}</div>
              <div class="node ${color}"></div>
            </div>`;
          }).join('');
        list.innerHTML = html;
      }
    } catch { /* ignore */ }
  }

  // Log reflection (server + local + instant UI)
  async function logReflection() {
    const text = (ta?.value || '').trim();
    if (!text) return alert('Enter a reflection first.');

    const tone  = classifyTone(text);
    const entry = { text, tone, ts: new Date().toISOString(), deviceId: 'lucen17-ui' };

    const base = apiBase() || 'https://lucen17-backend.onrender.com';
    try {
      const res  = await fetch(`${base}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const data = await res.json();
      if (!data.saved) console.warn('⚠️ Backend save failed, keeping local copy.');
    } catch (err) {
      console.error('💾 Network error, fallback to local:', err);
    }

    // local fallback + UI
    const arr = JSON.parse(localStorage.getItem(memoryKey) || '[]');
    arr.push(entry);
    if (arr.length > 5000) arr.splice(0, arr.length - 5000);
    localStorage.setItem(memoryKey, JSON.stringify(arr));

    if (ta) {
      ta.value = '';
      ta.placeholder = '✨ Logged!';
      setTimeout(() => (ta.placeholder = 'Type reflection...'), 1200);
    }

    renderLocal();
    driftFromTone(tone);
    updateBeamTone(); // keep beam responsive to new reflections
  }

  // Guidance drift
  function driftFromTone(tone) {
    if ((localStorage.getItem(modeKey) || 'Guidance') !== 'Guidance') return;
    const rc = Number(localStorage.getItem(rcKey) || dialRC?.value || 50);
    const ge = Number(localStorage.getItem(geKey) || dialGE?.value || 50);
    let nrc = rc, nge = ge;
    if (tone === 'Creative')  { nrc = Math.min(100, rc + 3); nge = Math.min(100, ge + 2); }
    else if (tone === 'Directive') { nrc = Math.max(0, rc - 2);  nge = Math.max(0, ge - 1); }
    else { nrc = Math.max(0, Math.min(100, rc + (Math.random()*2 - 1))); }

    if (dialRC) dialRC.value = String(nrc);
    if (dialGE) dialGE.value = String(nge);
    localStorage.setItem(rcKey, String(nrc));
    localStorage.setItem(geKey, String(nge));
  }

  // Passive breathing (Guidance)
  setInterval(() => {
    if ((localStorage.getItem(modeKey) || 'Guidance') !== 'Guidance') return;
    const rc = Number(localStorage.getItem(rcKey) || dialRC?.value || 50);
    const ge = Number(localStorage.getItem(geKey) || dialGE?.value || 50);
    const nrc = Math.max(0, Math.min(100, rc + (Math.random()*2 - 1)));
    const nge = Math.max(0, Math.min(100, ge + (Math.random()*2 - 1)));
    if (dialRC) dialRC.value = String(nrc);
    if (dialGE) dialGE.value = String(nge);
    localStorage.setItem(rcKey, String(nrc));
    localStorage.setItem(geKey, String(nge));
  }, 5000);

  // Save API + log + pay
  saveApiBtn?.addEventListener('click', () => {
    const v = (apiInput?.value || '').trim();
    if (!v) { alert('Enter API URL'); return; }
    localStorage.setItem(apiKey, v);
    refreshOnline();
    alert('API URL saved');
  });
  logBtn?.addEventListener('click', logReflection);

  payBtn?.addEventListener('click', async () => {
    const base = apiBase();
    if (!base) { alert('Save API first'); return; }
    const amt  = Number(payAmount?.value || 3);
    const gate = payGate?.value || 'core';
    try {
      const r = await postJSON(`${base}/tolls/pay`, { gate, amount: amt, currency: 'GBP' });
      if (r.simulated) alert('Simulated payment ok');
      else if (r.client_secret) alert('PaymentIntent created (test). Client confirm later.');
      else alert('Payment response received.');
    } catch {
      alert('Payment failed');
    }
  });

  // ==== Divisions (local persistence) ====
  const defaultDivisions = {
    fieldOps:      { focusHours:'', wins:'', blockers:'', mood:'' },
    selfSustain:   { focusHours:'', wins:'', blockers:'', mood:'' },
    mindRhythm:    { focusHours:'', wins:'', blockers:'', mood:'' },
    flowPlanning:  { focusHours:'', wins:'', blockers:'', mood:'' },
    learningPulse: { focusHours:'', wins:'', blockers:'', mood:'' },
    wellbeingLoop: { focusHours:'', wins:'', blockers:'', mood:'' },
    familyField:   { focusHours:'', wins:'', blockers:'', mood:'' },
    businessLine:  { focusHours:'', wins:'', blockers:'', mood:'' }
  };

  let lucenDivisions = JSON.parse(localStorage.getItem('lucen.divisions')) || defaultDivisions;

  function saveDivisions() {
    try {
      localStorage.setItem('lucen.divisions', JSON.stringify(lucenDivisions));
    } catch (e) {
      console.warn('Lucen17: Storage quota reached or write failed.', e);
    }
  }

  function initDivisions() {
    Object.keys(lucenDivisions).forEach(name => {
      const section = document.querySelector(`[data-division="${name}"]`);
      if (!section) return;
      ['focusHours','wins','blockers','mood'].forEach(key => {
        const input = section.querySelector(`[data-field="${key}"]`);
        if (input) {
          input.value = lucenDivisions[name][key] || '';
          input.addEventListener('input', () => {
            lucenDivisions[name][key] = input.value;
            saveDivisions();
            if (key === 'mood') updateBeamTone();
          });
        }
      });
    });
  }
  window.addEventListener('DOMContentLoaded', initDivisions);

  // === Lucen Chroma (beam) ===
  const moodColors = {
    calm: "#4fc3f7",
    focused: "#81c784",
    tense: "#ffb74d",
    inspired: "#ba68c8",
    tired: "#e57373"
  };
  function deriveTone(mood) {
    if (!mood) return "#999";
    const key = mood.toLowerCase().trim();
    return moodColors[key] || "#999";
  }

  function updateBeamTone() {
    const el = document.getElementById('beam');
    if (!el) return;
    const moods = Array.from(document.querySelectorAll('[data-field="mood"]'))
      .map(i => (i.value || '').toLowerCase().trim())
      .filter(Boolean);

    let color = "#999";
    if (moods.length) {
      const text = moods.join(' ');
      if (/(calm|peace|balance)/.test(text))            color = "#5aa7ff";
      else if (/(focus|clarity|discipline)/.test(text)) color = "#50fa7b";
      else if (/(inspired|creative|gold)/.test(text))   color = "#ffc857";
      else if (/(tired|low|drained)/.test(text))        color = "#9b9b9b";
      else if (/(energy|alive|vibrant)/.test(text))     color = "#ff6f61";
      else if (/(reflect|memory|depth)/.test(text))     color = "#6a5acd";
    }
    el.style.transition = "background 1s linear, box-shadow 1s linear";
    el.style.setProperty("--beam-color", color);
    el.style.background = color;
    el.style.boxShadow = `0 0 25px 6px ${color}`;
  }

  (function wireBeamTone() {
    const inputs = document.querySelectorAll('[data-field="mood"]');
    inputs.forEach(inp => {
      inp.removeEventListener('input', updateBeamTone);
      inp.addEventListener('input', updateBeamTone);
    });
    updateBeamTone();
    setInterval(updateBeamTone, 5000);
  })();

  // Division toggles
  window.toggleDesc = function(btn) {
    const p = btn.nextElementSibling;
    p.style.display = (p.style.display === 'block' ? 'none' : 'block');
  };
  window.toggleSeeds = function(btn) {
    const ul = btn.nextElementSibling;
    ul.style.display = (ul.style.display === 'block' ? 'none' : 'block');
  };

  // Initial paint
  (function init() {
    renderLocal();
    refreshOnline();
  })();
})();
