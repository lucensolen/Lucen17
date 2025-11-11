(() => {
  const memoryKey = 'lucen.memory';
  const apiKey    = 'lucen.api';
  const modeKey   = 'nucleos.mode';
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
  const apiBase  = () => localStorage.getItem(apiKey) || 'https://lucen17-backend.onrender.com';
  const getJSON  = async url => { const r = await fetch(url); if (!r.ok) throw new Error(`GET ${url} ${r.status}`); return r.json(); };
  const postJSON = async (url, data) => { const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); if (!r.ok) throw new Error(`POST ${url} ${r.status}`); return r.json(); };

  const classifyTone = (text) => {
    const t = text.toLowerCase();
    if (/(do|plan|fix|schedule|deploy|commit|merge|next|today)/.test(t)) return 'Directive';
    if (/(idea|imagine|design|create|vision|dream|invent|sketch)/.test(t)) return 'Creative';
    return 'Reflective';
  };
  const toneColor  = t => t === 'Directive' ? 'orange' : (t === 'Creative' ? 'yellow' : 'blue');
  const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

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

  // Online badge + gates
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
      if (!Array.isArray(items)) return; // guard
      const html = items
        .filter(i => i.text)
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
        .map(i => {
          const ts = i.ts ? new Date(i.ts) : new Date();
          return `<div class="card">
            <div class="tone">${i.tone || 'Reflective'}</div>
            <div class="ts">${ts.toLocaleString()}</div>
            <div class="txt">${escapeHtml(i.text || '')}</div>
            <div class="node ${toneColor(i.tone || 'Reflective')}"></div>
          </div>`;
        }).join('');
      list.innerHTML = html;
    } catch { /* ignore */ }
  }

  // Log reflection (server + local + instant UI + pulse)
  async function logReflection() {
    const text = (ta?.value || '').trim();
    if (!text) return alert('Enter a reflection first.');
    const tone  = classifyTone(text);
    const entry = { text, tone, ts: new Date().toISOString(), deviceId: 'lucen17-ui', location: null };

    try { await postJSON(`${apiBase()}/memory`, entry); }
    catch (err) { console.warn('Local fallback:', err); }

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
    pulseCoreSync();         // bright green pulse (outgoing)
    driftFromTone(tone);
    updateBeamTone();
  }

  // Core reflection bridge (fixed)
  async function syncCoreMemory() {
    const base = apiBase();
    if (!base) return;
    try {
      const res = await fetch(`${base}/memory`);
      if (!res.ok) throw new Error('syncCoreMemory failed');
      const serverItems = await res.json();
      if (!Array.isArray(serverItems)) return; // prevent .forEach crash

      const localItems = JSON.parse(localStorage.getItem(memoryKey) || '[]');
      const merged = [...localItems];
      serverItems.forEach(item => {
        if (!merged.some(m => m.ts === item.ts && m.text === item.text)) merged.push(item);
      });
      merged.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      localStorage.setItem(memoryKey, JSON.stringify(merged));
      renderLocal();
      updateSyncIndicator(true);
    } catch (e) {
      console.warn('Lucen17 Core Bridge error:', e);
      updateSyncIndicator(false);
    }
  }

  function updateSyncIndicator(ok) {
    const host = document.getElementById('onlineBadge');
    if (!host) return;
    let dot = document.getElementById('coreSyncDot');
    if (!dot) {
      dot = document.createElement('span');
      dot.id = 'coreSyncDot';
      dot.setAttribute('aria-label', 'Lucen Core Sync');
      // render as true circle (no glyph box)
      dot.textContent = '';
      dot.style.display = 'inline-block';
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.marginLeft = '8px';
      dot.style.borderRadius = '50%';
      dot.style.verticalAlign = 'middle';
      dot.style.background = '#888';   // idle grey
      dot.style.boxShadow = '0 0 0 0 rgba(0,255,255,0)';
      host.appendChild(dot);
    }
    dot.style.background = ok ? '#4caf50' : '#888';
  }

  // Drift (Guidance)
  function driftFromTone(tone) {
    if ((localStorage.getItem(modeKey) || 'Guidance') !== 'Guidance') return;
    const rc = Number(localStorage.getItem(rcKey) || dialRC?.value || 50);
    const ge = Number(localStorage.getItem(geKey) || dialGE?.value || 50);
    let nrc = rc, nge = ge;
    if (tone === 'Creative')      { nrc = Math.min(100, rc + 3); nge = Math.min(100, ge + 2); }
    else if (tone === 'Directive'){ nrc = Math.max(0, rc - 2);   nge = Math.max(0, ge - 1); }
    else                          { nrc = Math.max(0, Math.min(100, rc + (Math.random()*2 - 1))); }
    if (dialRC) dialRC.value = String(nrc);
    if (dialGE) dialGE.value = String(nge);
    localStorage.setItem(rcKey, String(nrc));
    localStorage.setItem(geKey, String(nge));
  }

  // Passive breathing + periodic sync
  setInterval(syncCoreMemory, 30000);
  setInterval(() => {
    if ((localStorage.getItem(modeKey) || 'Guidance') !== 'Guidance') return;
    const rc = Number(localStorage.getItem(rcKey) || 50);
    const ge = Number(localStorage.getItem(geKey) || 50);
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
    if (!v) return alert('Enter API URL');
    localStorage.setItem(apiKey, v);
    refreshOnline();
    alert('API URL saved');
  });
  logBtn?.addEventListener('click', logReflection);

  payBtn?.addEventListener('click', async () => {
    const base = apiBase();
    if (!base) return alert('Save API first');
    const amt  = Number(payAmount?.value || 3);
    const gate = payGate?.value || 'core';
    try {
      const r = await postJSON(`${base}/tolls/pay`, { gate, amount: amt, currency: 'GBP' });
      alert(r.simulated ? 'Simulated payment ok' : 'Payment response received.');
    } catch { alert('Payment failed'); }
  });

  // Divisions (exact 8 — unchanged)
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
  function saveDivisions(){ try{ localStorage.setItem('lucen.divisions', JSON.stringify(lucenDivisions)); } catch(e){ console.warn('Storage fail', e); } }
  function initDivisions(){
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

  // Beam tone (stable)
  function updateBeamTone() {
    const el = document.getElementById('beam');
    if (!el) return;
    const moods = Array.from(document.querySelectorAll('[data-field="mood"]'))
      .map(i => (i.value || '').toLowerCase().trim())
      .filter(Boolean);
    let color = '#999';
    if (moods.length) {
      const text = moods.join(' ');
      if (/(calm|peace|balance)/.test(text))            color = '#5aa7ff';
      else if (/(focus|clarity|discipline)/.test(text)) color = '#50fa7b';
      else if (/(inspired|creative|gold)/.test(text))   color = '#ffc857';
      else if (/(tired|low|drained)/.test(text))        color = '#9b9b9b';
      else if (/(energy|alive|vibrant)/.test(text))     color = '#ff6f61';
      else if (/(reflect|memory|depth)/.test(text))     color = '#6a5acd';
    }
    el.style.transition = 'background 1s linear, box-shadow 1s linear';
    el.style.background = color;
    el.style.boxShadow  = `0 0 25px 6px ${color}`;
  }
  (function wireBeamTone(){
    const inputs = document.querySelectorAll('[data-field="mood"]');
    inputs.forEach(inp => {
      inp.removeEventListener('input', updateBeamTone);
      inp.addEventListener('input', updateBeamTone);
    });
    updateBeamTone();
    setInterval(updateBeamTone, 5000);
  })();

  // Gates registry/cards
  const lucenGates = [
    { name: 'MindSetFree', key: 'mindset',  url: 'https://placeholder.local/mindsetfree' },
    { name: 'PlanMore',    key: 'planmore', url: 'https://placeholder.local/planmore' },
    { name: 'DietDiary',   key: 'diet',     url: 'https://placeholder.local/dietdiary' },
    { name: 'LearnLume',   key: 'learn',    url: 'https://placeholder.local/learnlume' }
  ];
  function renderGatesUI() {
    const wrap = document.getElementById('gatesList');
    if (!wrap) return;
    wrap.innerHTML = lucenGates.map(g => `
      <div class="card gate-card" data-gate="${g.key}">
        <b>${g.name}</b>
        <button class="openGate" data-url="${g.url}">Open</button>
        <span class="status" id="status-${g.key}" style="float:right;opacity:.7">idle</span>
      </div>`).join('');
    wrap.querySelectorAll('.openGate').forEach(btn =>
      btn.addEventListener('click', e => window.open(e.target.dataset.url, '_blank'))
    );
  }

  // Broadcast state to gates
  function broadcastLucenState() {
    const beamColor = getComputedStyle(document.getElementById('beam')).backgroundColor || '#999999';
    const memory    = JSON.parse(localStorage.getItem('lucen.memory') || '[]');
    const last      = memory.length ? memory[memory.length - 1] : { text:'', tone:'Reflective' };
    const payload   = { beamColor, lastReflection: last.text, tone: last.tone, ts: Date.now() };
    localStorage.setItem('lucen.bridge.state', JSON.stringify(payload));
    window.postMessage({ type: 'lucenUpdate', payload }, '*');
  }
  window.addEventListener('message', ev => {
    if (!ev.data || ev.data.type !== 'lucenReturn') return;
    const entry = ev.data.payload;
    if (!entry || !entry.text) return;
    const arr = JSON.parse(localStorage.getItem('lucen.memory') || '[]');
    arr.push(entry);
    localStorage.setItem('lucen.memory', JSON.stringify(arr));
    renderLocal();
  });
  setInterval(broadcastLucenState, 6000);
  window.addEventListener('DOMContentLoaded', () => setTimeout(renderGatesUI, 500));

  // Bridge pulse verification loop
  (function bridgePulse(){
    const INTERVAL = 6000;
    function broadcastPulse(){
      const beamEl = document.getElementById('beam');
      const beamColor = getComputedStyle(beamEl).backgroundColor || '#999';
      const memory = JSON.parse(localStorage.getItem('lucen.memory') || '[]');
      const last   = memory.length ? memory[memory.length-1] : { text:'', tone:'Reflective' };
      const payload = { beamColor, lastReflection: last.text, tone: last.tone, ts: Date.now() };
      localStorage.setItem('lucen.bridge.state', JSON.stringify(payload));
      window.postMessage({ type: 'lucenUpdate', payload }, '*');
    }
    window.addEventListener('message', ev => {
      if (!ev.data || ev.data.type !== 'lucenReturn') return;
      const entry = ev.data.payload;
      if (!entry || !entry.text) return;
      const arr = JSON.parse(localStorage.getItem('lucen.memory') || '[]');
      arr.push(entry);
      localStorage.setItem('lucen.memory', JSON.stringify(arr));
      renderLocal();
    });
    setInterval(broadcastPulse, INTERVAL);
    broadcastPulse();
  })();

  // Core sync dot — user pulse + inbound glow
  function pulseCoreSync() {
    const dot = document.getElementById('coreSyncDot');
    if (!dot) return;
    dot.style.background = '#00ff7f'; // outgoing pulse green
    dot.style.boxShadow  = '0 0 10px 3px rgba(0,255,127,0.5)';
    setTimeout(() => {
      dot.style.background = '#888';
      dot.style.boxShadow  = '0 0 0 0 rgba(0,0,0,0)';
    }, 900);
  }

  let inboundActivity = 0; // increments on inbound updates
  window.addEventListener('message', ev => {
    if (ev.data?.type === 'lucenUpdate') inboundActivity++;
  });
  setInterval(() => {
    const dot = document.getElementById('coreSyncDot');
    if (!dot) return;
    const intensity = Math.min(1, inboundActivity / 10);
    // gentle cyan glow proportional to inbound activity
    dot.style.boxShadow = `0 0 ${4 + intensity * 8}px ${intensity * 2}px rgba(0,255,255,${0.25 + intensity * 0.35})`;
    if (inboundActivity > 0 && dot.style.background !== 'rgb(0, 255, 127)') {
      // keep base as grey when not actively pulsing green
      dot.style.background = '#0cc'; // subtle cyan when active inbound
    } else if (inboundActivity === 0) {
      dot.style.background = '#888';
    }
    inboundActivity = Math.max(0, inboundActivity - 1);
  }, 4000);

  // Initial paint
  (function init() {
    renderLocal();
    refreshOnline();
    syncCoreMemory();
  })();
})();
