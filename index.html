(() => {
  // ===== Keys & selectors =====
  const memoryKey = "lucen.memory";
  const apiKey    = "lucen.api";
  const modeKey   = "nucleos.mode"; // 'Creation' | 'Guidance'
  const rcKey     = "lucen.dial.rc";
  const geKey     = "lucen.dial.ge";

  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // ===== Tabs =====
  const tabs = $$("[data-tab]");
  const panels = $$(".panel");
  tabs.forEach(btn => btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const id = btn.dataset.tab;
    panels.forEach(p => p.classList.toggle("active", p.id === id));
  }));

  // ===== DOM refs =====
  const apiInput   = $("#apiBase");
  const saveApiBtn = $("#saveApi");
  const badge      = $("#onlineBadge");
  const logBtn     = $("#logBtn");
  const ta         = $("#visionInput");
  const list       = $("#memoryList");
  const gatesList  = $("#gatesList");

  const dialRC       = $("#dialRC");
  const dialGE       = $("#dialGE");
  const modeCreation = $("#modeCreation");
  const modeGuidance = $("#modeGuidance");
  const beam         = $("#beam");

  // Optional routing controls (safe to be absent)
  const divSel   = $("#divisionSelect");
  const scopeSel = $("#scopeSelect");

  // ===== Init persisted UI =====
  const savedAPI = localStorage.getItem(apiKey);
  if (savedAPI && apiInput) apiInput.value = savedAPI;

  if (dialRC) dialRC.value = localStorage.getItem(rcKey) || "50";
  if (dialGE) dialGE.value = localStorage.getItem(geKey) || "50";

  const savedMode = localStorage.getItem(modeKey) || "Guidance";
  function setMode(m) {
    localStorage.setItem(modeKey, m);
    if (modeCreation && modeGuidance) {
      modeCreation.classList.toggle("active", m === "Creation");
      modeGuidance.classList.toggle("active", m === "Guidance");
    }
    if (beam) beam.style.animationDuration = (m === "Creation" ? "1.5s" : "3s");
  }
  setMode(savedMode);

  dialRC?.addEventListener("input", () => localStorage.setItem(rcKey, dialRC.value));
  dialGE?.addEventListener("input", () => localStorage.setItem(geKey, dialGE.value));
  modeCreation?.addEventListener("click", () => setMode("Creation"));
  modeGuidance?.addEventListener("click", () => setMode("Guidance"));

  // ===== Helpers =====
  function apiBase() {
    return (localStorage.getItem(apiKey) || "https://lucen17-backend.onrender.com");
  }
  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`GET ${url} ${r.status}`);
    return r.json();
  }
  async function postJSON(url, data) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`POST ${url} ${r.status}`);
    return r.json();
  }

  function classifyTone(text) {
    const t = (text || "").toLowerCase();
    if (/(do|today|plan|next|ship|build|fix|schedule|deploy|commit|merge)/.test(t)) return "Directive";
    if (/(idea|imagine|design|create|vision|dream|invent|sketch)/.test(t)) return "Creative";
    return "Reflective";
  }
  function toneColor(t) {
    return t === "Directive" ? "orange" : (t === "Creative" ? "yellow" : "blue");
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;" }[c]));
  }

  // ===== Local memory render =====
  function renderLocal() {
    if (!list) return;
    const items = JSON.parse(localStorage.getItem(memoryKey) || "[]");
    const html = items.slice().reverse().map(i => {
      const color = toneColor(i.tone || "Reflective");
      const ts = (i.ts ? new Date(i.ts) : new Date()).toLocaleString();
      return `<div class="card">
        <div class="tone">${i.tone || "Reflective"}</div>
        <div class="ts">${ts}</div>
        <div class="txt">${escapeHtml(i.text || "")}</div>
        <div class="node ${color}"></div>
      </div>`;
    }).join("");
    list.innerHTML = html;
  }

  // ===== Online badge + gates snapshot =====
  async function refreshOnline() {
    if (!badge) return;
    const base = apiBase();
    if (!base) {
      badge.textContent = "Offline";
      badge.classList.remove("online");
      return;
    }
    try {
      const h = await getJSON(`${base}/health`);
      if (h && h.ok) {
        badge.textContent = "Online";
        badge.classList.add("online");
        await refreshGates();
        await syncCoreMemory();
      } else {
        badge.textContent = "Offline";
        badge.classList.remove("online");
      }
    } catch {
      badge.textContent = "Offline";
      badge.classList.remove("online");
    }
  }

  async function refreshGates() {
    const base = apiBase();
    if (!base || !gatesList) return;
    try {
      const { gates } = await getJSON(`${base}/gates`);
      gatesList.innerHTML = (gates || []).map(g =>
        `<div class="card"><b>${g.name}</b> — ${g.blurb} <span style="float:right;opacity:.7">${g.toll}</span></div>`
      ).join("");
    } catch {
      gatesList.innerHTML = '<div class="card">(gates unavailable)</div>';
    }
  }

  // ===== Core Sync Indicator (dot) =====
  function ensureSyncDot() {
    const host = document.getElementById("onlineBadge");
    if (!host) return null;
    let dot = document.getElementById("coreSyncDot");
    if (!dot) {
      dot = document.createElement("span");
      dot.id = "coreSyncDot";
      dot.textContent = "•";
      dot.style.marginLeft = "6px";
      dot.style.fontSize = "18px";
      dot.style.color = "#888";
      host.appendChild(dot);
    }
    return dot;
  }
  function updateSyncIndicator(ok) {
    const dot = ensureSyncDot();
    if (!dot) return;
    dot.style.color = ok ? "#4caf50" : "#999"; // steady state
  }
  function pulseCoreSync() {
    const dot = ensureSyncDot();
    if (!dot) return;
    dot.style.color = "#00ff7f"; // green flash
    setTimeout(() => (dot.style.color = "#888"), 1200);
  }

  // ===== Beam tone (from division moods) =====
  function updateBeamTone() {
    const el = document.getElementById("beam");
    if (!el) return;
    const moods = Array.from(document.querySelectorAll('[data-field="mood"]'))
      .map(i => (i.value || "").toLowerCase().trim())
      .filter(Boolean);
    let color = "#999";
    if (moods.length) {
      const text = moods.join(" ");
      if (/(calm|peace|balance)/.test(text))            color = "#5aa7ff";
      else if (/(focus|clarity|discipline)/.test(text)) color = "#50fa7b";
      else if (/(inspired|creative|gold)/.test(text))   color = "#ffc857";
      else if (/(tired|low|drained)/.test(text))        color = "#9b9b9b";
      else if (/(energy|alive|vibrant)/.test(text))     color = "#ff6f61";
      else if (/(reflect|memory|depth)/.test(text))     color = "#6a5acd";
    }
    el.style.transition = "background 1s linear, box-shadow 1s linear";
    el.style.background = color;
    el.style.boxShadow = `0 0 25px 6px ${color}`;
  }
  (function wireBeamTone() {
    const inputs = document.querySelectorAll('[data-field="mood"]');
    inputs.forEach(inp => {
      inp.removeEventListener("input", updateBeamTone);
      inp.addEventListener("input", updateBeamTone);
    });
    updateBeamTone();
    setInterval(updateBeamTone, 5000);
  })();

  // ===== Log reflection (server + local + broadcast) =====
  function currentRouting() {
    const scope    = scopeSel && scopeSel.value ? scopeSel.value : "nucleos";     // 'nucleos' | 'division' | 'app'
    const division = divSel   && divSel.value   ? divSel.value   : "nucleos";     // e.g., 'Educational Flow'
    return { scope, division };
  }

  async function logReflection() {
    const text = (ta?.value || "").trim();
    if (!text) return alert("Enter a reflection first.");

    const tone = classifyTone(text);
    const { scope, division } = currentRouting();

    const entry = {
      text,
      tone,
      ts: new Date().toISOString(),
      deviceId: "lucen17-ui",
      location: null,
      scope,
      division
    };

    // Try server
    const base = apiBase();
    try {
      const res = await fetch(`${base}/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      });
      const data = await res.json();
      if (!data.saved) console.warn("⚠️ Backend save failed, keeping local copy.");
    } catch (err) {
      console.warn("💾 Network issue, keeping local copy:", err);
    }

    // Local append
    const arr = JSON.parse(localStorage.getItem(memoryKey) || "[]");
    arr.push(entry);
    if (arr.length > 5000) arr.splice(0, arr.length - 5000);
    localStorage.setItem(memoryKey, JSON.stringify(arr));

    // UI
    if (ta) {
      ta.value = "";
      ta.placeholder = "✨ Logged!";
      setTimeout(() => (ta.placeholder = "Type reflection..."), 1200);
    }
    renderLocal();
    pulseCoreSync();                 // green flash (outgoing)
    driftFromTone(tone);
    updateBeamTone();

    // Broadcast to gates / other tabs
    broadcastReflection(entry);
  }

  // ===== Robust core sync (pull → merge) =====
  async function syncCoreMemory() {
    const base = apiBase();
    if (!base) return;

    try {
      const res = await fetch(`${base}/memory`);
      if (!res.ok) throw new Error("syncCoreMemory failed");
      const data = await res.json();

      // normalize to array
      let serverItems = [];
      if (Array.isArray(data)) serverItems = data;
      else if (data && Array.isArray(data.items)) serverItems = data.items;
      else if (typeof data === "object" && data !== null) {
        // find first array inside object
        for (const k in data) {
          if (Array.isArray(data[k])) { serverItems = data[k]; break; }
        }
      }

      if (!Array.isArray(serverItems)) {
        console.warn("Lucen17 Core Bridge: Invalid serverItems type:", typeof serverItems, data);
        serverItems = [];
      }

      const localItems = JSON.parse(localStorage.getItem(memoryKey) || "[]");
      const merged = [...localItems];

      for (const item of serverItems) {
        if (!merged.some(m => m.ts === item.ts && m.text === item.text)) {
          merged.push(item);
        }
      }

      merged.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      localStorage.setItem(memoryKey, JSON.stringify(merged));

      renderLocal();
      updateSyncIndicator(true);
    } catch (e) {
      console.warn("Lucen17 Core Bridge error:", e);
      updateSyncIndicator(false);
      renderLocal(); // still render locals
    }
  }

  // Periodic sync (single interval)
  setInterval(syncCoreMemory, 30000);

  // ===== Guidance drift =====
  function driftFromTone(tone) {
    if ((localStorage.getItem(modeKey) || "Guidance") !== "Guidance") return;
    const rc = Number(localStorage.getItem(rcKey) || dialRC?.value || 50);
    const ge = Number(localStorage.getItem(geKey) || dialGE?.value || 50);
    let nrc = rc, nge = ge;

    if (tone === "Creative")        { nrc = Math.min(100, rc + 3); nge = Math.min(100, ge + 2); }
    else if (tone === "Directive")  { nrc = Math.max(0, rc - 2);   nge = Math.max(0, ge - 1);   }
    else                            { nrc = Math.max(0, Math.min(100, rc + (Math.random()*2 - 1))); }

    if (dialRC) dialRC.value = String(nrc);
    if (dialGE) dialGE.value = String(nge);
    localStorage.setItem(rcKey, String(nrc));
    localStorage.setItem(geKey, String(nge));
  }

  // Passive breathing (Guidance)
  setInterval(() => {
    if ((localStorage.getItem(modeKey) || "Guidance") !== "Guidance") return;
    const rc = Number(localStorage.getItem(rcKey) || dialRC?.value || 50);
    const ge = Number(localStorage.getItem(geKey) || dialGE?.value || 50);
    const nrc = Math.max(0, Math.min(100, rc + (Math.random()*2 - 1)));
    const nge = Math.max(0, Math.min(100, ge + (Math.random()*2 - 1)));
    if (dialRC) dialRC.value = String(nrc);
    if (dialGE) dialGE.value = String(nge);
    localStorage.setItem(rcKey, String(nrc));
    localStorage.setItem(geKey, String(nge));
  }, 5000);

  // ===== Division persistence (unchanged) =====
  const defaultDivisions = {
    fieldOps:      { focusHours:"", wins:"", blockers:"", mood:"" },
    selfSustain:   { focusHours:"", wins:"", blockers:"", mood:"" },
    mindRhythm:    { focusHours:"", wins:"", blockers:"", mood:"" },
    flowPlanning:  { focusHours:"", wins:"", blockers:"", mood:"" },
    learningPulse: { focusHours:"", wins:"", blockers:"", mood:"" },
    wellbeingLoop: { focusHours:"", wins:"", blockers:"", mood:"" },
    familyField:   { focusHours:"", wins:"", blockers:"", mood:"" },
    businessLine:  { focusHours:"", wins:"", blockers:"", mood:"" }
  };
  let lucenDivisions = JSON.parse(localStorage.getItem("lucen.divisions")) || defaultDivisions;
  function saveDivisions() {
    try { localStorage.setItem("lucen.divisions", JSON.stringify(lucenDivisions)); }
    catch (e) { console.warn("Lucen17: Storage quota/write failed.", e); }
  }
  function initDivisions() {
    Object.keys(lucenDivisions).forEach(name => {
      const section = document.querySelector(`[data-division="${name}"]`);
      if (!section) return;
      ["focusHours","wins","blockers","mood"].forEach(key => {
        const input = section.querySelector(`[data-field="${key}"]`);
        if (input) {
          input.value = lucenDivisions[name][key] || "";
          input.addEventListener("input", () => {
            lucenDivisions[name][key] = input.value;
            saveDivisions();
            if (key === "mood") updateBeamTone();
          });
        }
      });
    });
  }
  window.addEventListener("DOMContentLoaded", initDivisions);

  // ===== Broadcast system (division-aware) =====
  function broadcastReflection(entry) {
    const { scope, division } = currentRouting();
    const payload = {
      type: "lucenUpdate",
      payload: {
        text: entry.text,
        tone: entry.tone,
        ts:   entry.ts || new Date().toISOString(),
        scope,
        division,
        origin: "Lucen17 Core",
        beam: (beam ? getComputedStyle(beam).backgroundColor : "#00f7f7")
      }
    };
    // Console trace for verification
    console.log(`🔊 Broadcast → ${scope} :: ${division}`, payload);
    window.postMessage(payload, "*");
  }

  // Receive reflections from gates
  window.addEventListener("message", (ev) => {
    const d = ev.data;
    if (!d) return;

    // Inbound update (for dot breathing)
    if (d.type === "lucenUpdate") inboundActivity++;

    // Gate pushing a reflection back
    if (d.type === "lucenReturn" && d.payload && d.payload.text) {
      const entry = d.payload;
      const arr = JSON.parse(localStorage.getItem(memoryKey) || "[]");
      arr.push(entry);
      localStorage.setItem(memoryKey, JSON.stringify(arr));
      renderLocal();
    }
  });

  // Periodic state pulse (so open gates stay in rhythm)
  function broadcastPulse() {
    const mem = JSON.parse(localStorage.getItem(memoryKey) || "[]");
    const last = mem.length ? mem[mem.length - 1] : { text:"", tone:"Reflective", ts:new Date().toISOString() };
    broadcastReflection(last);
  }
  setInterval(broadcastPulse, 6000);
  broadcastPulse();

  // ===== Dot breathing on inbound traffic =====
  let inboundActivity = 0;
  setInterval(() => {
    const dot = ensureSyncDot();
    if (!dot) return;
    const intensity = Math.min(1, inboundActivity / 10);       // 0–1
    dot.style.boxShadow = `0 0 ${4 + intensity * 6}px ${intensity * 0.4}px rgba(0,255,255,${0.3 + intensity * 0.3})`;
    dot.style.color = intensity > 0 ? "#0ff" : "#888";
    inboundActivity = Math.max(0, inboundActivity - 1);         // decay
  }, 5000);

  // Click-to-map hook (future)
  document.addEventListener("DOMContentLoaded", () => {
    const dot = ensureSyncDot();
    if (!dot) return;
    dot.style.cursor = "pointer";
    dot.title = "Open Lucen World Map (future)";
    dot.addEventListener("click", () => {
      window.postMessage({ type: "lucenMapRequest" }, "*");
      alert("🌍 Lucen World Map: coming online soon.");
    });
  });

  // ===== Save API + wire buttons =====
  saveApiBtn?.addEventListener("click", () => {
    const v = (apiInput?.value || "").trim();
    if (!v) { alert("Enter API URL"); return; }
    localStorage.setItem(apiKey, v);
    refreshOnline();
    alert("API URL saved");
  });
  logBtn?.addEventListener("click", logReflection);

  // ===== Initial paint =====
  (function init() {
    renderLocal();
    refreshOnline();
    syncCoreMemory();
  })();
})();
