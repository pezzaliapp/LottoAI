// LottoAI — app.js
// Generatore deterministico “personale” di combinazioni per Lotto e SuperEnalotto.
// Solo per intrattenimento. Nessun server: tutto in locale.

const $ = (sel) => document.querySelector(sel);

const form = $("#form");
const resultBox = $("#result");
const numsBox = $("#nums");
const extraBox = $("#extra");
const titleOut = $("#titleOut");
const copyBtn = $("#copyBtn");
const saveBtn = $("#saveBtn");
const exportBtn = $("#exportBtn");
const clearBtn = $("#clearBtn");
const historyBox = $("#history");
const refDate = $("#refdate");
const todayBtn = $("#todayBtn");
const shareBtn = $("#shareBtn");

todayBtn.addEventListener("click", () => {
  const today = new Date();
  refDate.value = formatDateInput(today);
});

function formatDateInput(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

// Basic seeded PRNG (xorshift32) from a 32-bit seed
function xorshift32(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return (x >>> 0) / 4294967296;
  };
}

// Convert ArrayBuffer hash -> 32-bit seed
function hashToSeed(buf) {
  const view = new DataView(buf);
  // XOR chunks into a 32-bit number
  let s = 0;
  for (let i = 0; i < view.byteLength; i += 4) {
    s ^= view.getUint32(i % (view.byteLength-3), false);
  }
  // Avoid zero seed
  return (s >>> 0) || 0x9e3779b9;
}

async function sha256(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return buf;
}

function pickUnique(rand, count, min, max) {
  const set = new Set();
  while (set.size < count) {
    const n = Math.floor(rand() * (max - min + 1)) + min;
    set.add(n);
  }
  return Array.from(set).sort((a,b)=>a-b);
}

// Superstar: 1..90 (indipendente), Jolly: 1..90 diverso dai 6 principali
function generateFor(dateStr, name, dob, game) {
  const key = `${name.trim().toLowerCase()}|${dob}|${dateStr}|${game}`;
  return sha256(key).then(buf => {
    const seed = hashToSeed(buf);
    const rand = xorshift32(seed);
    if (game === "lotto") {
      const main = pickUnique(rand, 5, 1, 90);
      return { title: `Lotto — ${dateStr}`, main, extra: [] };
    } else {
      const main = pickUnique(rand, 6, 1, 90);
      // Jolly different from main
      let jolly;
      do { jolly = Math.floor(rand()*90)+1; } while (main.includes(jolly));
      const superstar = Math.floor(rand()*90)+1;
      return { title: `SuperEnalotto — ${dateStr}`, main, extra: [{label:"Jolly", value:jolly},{label:"Superstar", value:superstar}] };
    }
  });
}

function renderCombination(out) {
  titleOut.textContent = out.title;
  numsBox.innerHTML = "";
  out.main.forEach(n => {
    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = String(n).padStart(2,"0");
    numsBox.appendChild(b);
  });
  extraBox.innerHTML = "";
  out.extra.forEach(x => {
    const wrap = document.createElement("span");
    wrap.className = "badge";
    wrap.textContent = `${x.label}: ${String(x.value).padStart(2,"0")}`;
    extraBox.appendChild(wrap);
  });
  resultBox.hidden = false;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const dob = document.getElementById("dob").value;
  const game = document.getElementById("game").value;
  const dateStr = refDate.value || formatDateInput(new Date());

  if (!name || !dob) return;
  const out = await generateFor(dateStr, name, dob, game);
  renderCombination(out);
});

copyBtn.addEventListener("click", async () => {
  const texts = Array.from(numsBox.querySelectorAll(".badge")).map(b=>b.textContent).join(" ");
  const extras = Array.from(extraBox.querySelectorAll(".badge")).map(b=>b.textContent).join(" ");
  const full = [titleOut.textContent, texts, extras].filter(Boolean).join("\n");
  try {
    await navigator.clipboard.writeText(full);
    copyBtn.textContent = "Copiato!";
    setTimeout(()=>copyBtn.textContent="Copia",1200);
  } catch {
    alert(full);
  }
});

saveBtn.addEventListener("click", () => {
  const items = JSON.parse(localStorage.getItem("lottoai_history")||"[]");
  const entry = {
    title: titleOut.textContent,
    numbers: Array.from(numsBox.querySelectorAll(".badge")).map(b=>b.textContent),
    extras: Array.from(extraBox.querySelectorAll(".badge")).map(b=>b.textContent),
    ts: Date.now()
  };
  items.unshift(entry);
  localStorage.setItem("lottoai_history", JSON.stringify(items));
  paintHistory();
});

function paintHistory() {
  historyBox.innerHTML = "";
  const items = JSON.parse(localStorage.getItem("lottoai_history")||"[]");
  if (items.length === 0) {
    historyBox.innerHTML = `<p class="muted">Nessuna voce salvata.</p>`;
    return;
  }
  items.forEach((it, idx) => {
    const div = document.createElement("div");
    div.className = "hist-item";
    const left = document.createElement("div");
    left.innerHTML = `<strong>${it.title}</strong><br><span class="muted">${it.numbers.join(" ")}${it.extras.length? " • "+it.extras.join(" • "):""}</span>`;
    const right = document.createElement("div");
    const del = document.createElement("button");
    del.textContent = "Elimina";
    del.addEventListener("click", () => {
      const arr = JSON.parse(localStorage.getItem("lottoai_history")||"[]");
      arr.splice(idx,1);
      localStorage.setItem("lottoai_history", JSON.stringify(arr));
      paintHistory();
    });
    right.appendChild(del);
    div.append(left, right);
    historyBox.appendChild(div);
  });
}

exportBtn.addEventListener("click", () => {
  const data = localStorage.getItem("lottoai_history") || "[]";
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lottoai_history.json";
  a.click();
  URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
  if (confirm("Sicuro di svuotare lo storico locale?")) {
    localStorage.removeItem("lottoai_history");
    paintHistory();
  }
});

shareBtn.addEventListener("click", async () => {
  const url = location.href;
  const text = "LottoAI — PWA open source per generare combinazioni personali (solo per divertimento).";
  if (navigator.share) {
    try { await navigator.share({title:"LottoAI", text, url}); } catch {}
  } else {
    await navigator.clipboard.writeText(`${text} ${url}`);
    shareBtn.textContent = "Link copiato";
    setTimeout(()=>shareBtn.textContent="Condividi",1200);
  }
});

// init
paintHistory();
todayBtn.click();
