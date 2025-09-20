// LottoAI — app.js
// Generatore deterministico “personale” di combinazioni per Lotto e SuperEnalotto.
// Con Ritratto Numerologico (pitagorico). Solo per intrattenimento. Nessun server: tutto in locale.

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
const profileBox = $("#profile");
const profileText = $("#profileText");

// --------- Init data ----------
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

// ---------------- Helper robusti ----------------
function lsGet(key, fallback="[]"){
  try { return localStorage.getItem(key) ?? fallback; }
  catch { return fallback; }
}
function lsSet(key, value){
  try { localStorage.setItem(key, value); return true; }
  catch { return false; }
}
async function copyTextSafe(text){
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {}
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  document.body.removeChild(ta);
  return ok;
}

// ---------------- PRNG Lotto ----------------
function xorshift32(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return (x >>> 0) / 4294967296;
  };
}
function hashToSeed(buf) {
  const view = new DataView(buf);
  let s = 0;
  for (let i = 0; i < view.byteLength; i += 4) {
    s ^= view.getUint32(i % (view.byteLength-3), false);
  }
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
      let jolly;
      do { jolly = Math.floor(rand()*90)+1; } while (main.includes(jolly));
      const superstar = Math.floor(rand()*90)+1;
      return { title: `SuperEnalotto — ${dateStr}`, main, extra: [
        {label:"Jolly", value:jolly},
        {label:"Superstar", value:superstar}
      ] };
    }
  });
}

// ---------------- Numerologia (pitagorica) ----------------
const PythMap = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8
};
const VOWELS = new Set(["A","E","I","O","U","Y"]);

function onlyLetters(s){ return (s||"").toUpperCase().normalize("NFD").replace(/[^A-Z]/g,""); }
function sumDigits(n){ return String(n).split("").reduce((a,c)=>a+Number(c),0); }
function reduceNum(n){
  while (n > 22) n = sumDigits(n);
  if (n === 11 || n === 22) return n;     // numeri “maestri”
  while (n > 9) n = sumDigits(n);
  return n;
}
function lifePathFromDate(dob){
  const [y,m,d] = dob.split("-").map(Number);
  return reduceNum(sumDigits(y)+sumDigits(m)+sumDigits(d));
}
function dayNumberFromDate(dob){
  const d = Number(dob.split("-")[2]);
  return reduceNum(d);
}
function personalYear(dob, refISO){
  const [,m,d] = dob.split("-").map(Number);
  const refY = Number(refISO.split("-")[0]);
  return reduceNum(sumDigits(d)+sumDigits(m)+sumDigits(refY));
}
function expressionNumber(fullname){
  const letters = onlyLetters(fullname);
  const total = [...letters].reduce((a,c)=>a+(PythMap[c]||0),0);
  return reduceNum(total);
}
function soulUrgeNumber(fullname){
  const letters = onlyLetters(fullname);
  const total = [...letters].filter(ch=>VOWELS.has(ch)).reduce((a,c)=>a+(PythMap[c]||0),0);
  return reduceNum(total);
}
function personalityNumber(fullname){
  const letters = onlyLetters(fullname);
  const total = [...letters].filter(ch=>!VOWELS.has(ch)).reduce((a,c)=>a+(PythMap[c]||0),0);
  return reduceNum(total);
}

// Schede numeri principali
const CORE = {
  1:{k:"Iniziativa • Identità • Guida",
     plus:["Determinazione e autonomia","Leadership naturale","Capacità di avviare progetti"],
     minus:["Impazienza, eccesso di controllo","Tendenza all’isolamento competitivo"],
     tips:["Definisci la tua visione in 1 frase","Delega almeno un compito oggi","Celebra i micro-progressi"]},
  2:{k:"Cooperazione • Sensibilità • Diplomazia",
     plus:["Ascolto e mediazione","Intuito relazionale","Creazione di armonia"],
     minus:["Troppa accondiscendenza","Evitamento del conflitto"],
     tips:["Stabilisci confini chiari","Chiedi un feedback scritto","Impara a dire un ‘no’ gentile"]},
  3:{k:"Espressione • Creatività • Socialità",
     plus:["Comunicazione vivida","Talento narrativo","Entusiasmo contagioso"],
     minus:["Discontinuità e dispersione","Sovraesposizione"],
     tips:["Scrivi ogni giorno 1 pagina","Taglia il superfluo del 20%","Programma un momento creativo fisso"]},
  4:{k:"Ordine • Metodo • Concretezza",
     plus:["Affidabilità e disciplina","Pensiero sistemico","Resilienza"],
     minus:["Rigidità, perfezionismo","Paura del cambiamento"],
     tips:["Lavora per blocchi di tempo","Concentrati sull’essenziale prima","Introduci piccoli miglioramenti quotidiani"]},
  5:{k:"Libertà • Versatilità • Esperienza",
     plus:["Adattabilità rapida","Curiosità esplorativa","Energia dinamica"],
     minus:["Dispersività, impulsività","Difficoltà a mantenere routine"],
     tips:["Fai uno sprint di 5 giorni su un tema","Limita i canali di attenzione","Stabilisci una micro-routine quotidiana"]},
  6:{k:"Cura • Responsabilità • Equilibrio",
     plus:["Senso del dovere","Attenzione agli altri","Gusto estetico"],
     minus:["Sovraccarico di compiti","Controllo affettivo"],
     tips:["Ritagliati 15 min per te stesso","Chiedi supporto a chi ti è vicino","Cura un dettaglio estetico"]},
  7:{k:"Ricerca • Introspezione • Apprendimento",
     plus:["Analisi profonda","Pensiero critico","Indipendenza"],
     minus:["Eccesso di astrazione","Chiusura sociale"],
     tips:["Studia 30 min al giorno","Condividi 1 insight a settimana","Pratica silenzio e passeggiate"]},
  8:{k:"Azione • Autonomia • Pragmatismo",
     plus:["Focus sui risultati","Gestione delle risorse","Coraggio decisionale"],
     minus:["Workaholism","Visione solo utilitaristica"],
     tips:["Definisci obiettivi trimestrali","Stabilisci un orario di stop","Riconosci i meriti altrui"]},
  9:{k:"Visione • Idealismo • Servizio",
     plus:["Ampia prospettiva","Empatia","Capacità di chiudere cicli"],
     minus:["Disillusione","Spreco di energie"],
     tips:["Scegli 1 causa concreta","Definisci i confini del tuo impegno","Pratica il lasciare andare"]},
  11:{k:"Ispirazione • Visione elevata (Numero Maestro)",
     plus:["Intuizioni profonde","Carisma sottile","Creatività spirituale"],
     minus:["Sovraccarico nervoso","Autodubbio"],
     tips:["Pratica radicamento","Trasforma le intuizioni in azioni concrete","Cerca mentoring o confronto"]},
  22:{k:"Architetto • Realizzazione su vasta scala (Numero Maestro)",
     plus:["Visione + esecuzione","Capacità di costruire strutture solide","Leadership di sistema"],
     minus:["Pressione interna","Blocco da perfezionismo"],
     tips:["Dividi il progetto in tappe","Prototipa subito","Documenta le decisioni"]},
};

// Temi dell’Anno Personale
const YEAR_THEME = {
  1:"Nuovi inizi, energia di semina. Ottimo per lanciare progetti.",
  2:"Relazioni e collaborazioni. Serve pazienza e ascolto.",
  3:"Espressione e creatività. Ottimo per comunicare e farsi conoscere.",
  4:"Struttura e fondamenta. È tempo di disciplina e organizzazione.",
  5:"Cambiamenti e libertà. Occasioni di viaggio o sperimentazione.",
  6:"Cura, casa, responsabilità. Consolidare e prendersi cura.",
  7:"Studio, introspezione, ricerca. Momento di analisi.",
  8:"Risultati e leadership. Focus su carriera e risorse.",
  9:"Chiusure e rinnovamento. Tempo di lasciare andare e preparare il nuovo."
};

function profileCard(label, n){
  const c = CORE[n] || {};
  const isMaster = (n===11 || n===22);
  const chipClass = `chip${isMaster ? ' chip--master' : ''}`;
  const tag = isMaster ? `<em>${c.k||""}</em>` : (c.k||"");
  const plus = (c.plus||[]).map(x=>`<li>${x}</li>`).join("");
  const minus = (c.minus||[]).map(x=>`<li>${x}</li>`).join("");
  const tips = (c.tips||[]).map(x=>`<li>${x}</li>`).join("");

  return `
    <div class="profile-section">
      <h4>${label}: <span class="${chipClass}">${n}</span> — ${tag}</h4>
      <div class="profile-cols">
        <div><strong>Punti di forza</strong><ul>${plus}</ul></div>
        <div><strong>Sfide</strong><ul>${minus}</ul></div>
        <div><strong>Suggerimenti</strong><ul>${tips}</ul></div>
      </div>
    </div>`;
}
function renderProfile(fullname, dob, refISO){
  const lp = lifePathFromDate(dob);
  const dn = dayNumberFromDate(dob);
  const ex = expressionNumber(fullname);
  const su = soulUrgeNumber(fullname);
  const pe = personalityNumber(fullname);
  const py = personalYear(dob, refISO);

  const blocks = [
    profileCard("Life Path", lp),
    profileCard("Espressione (Nome completo)", ex),
    profileCard("Anima (Calcolata dalle vocali)", su),
    profileCard("Personalità (Calcolata dalle consonanti)", pe),
    profileCard("Numero del Giorno", dn),
    `<div class="profile-section">
       <h4>Anno Personale: <span class="chip">${py}</span></h4>
       <p class="muted">${YEAR_THEME[py]||""}</p>
     </div>`
  ];

  profileText.innerHTML = blocks.join("") +
  `<p class="muted" style="margin-top:8px">
    <span class="chip chip--master">11 / 22</span> = Numeri Maestri (energia più intensa).
  </p>`;
profileBox.hidden = false;
}

// ---------------- UI ----------------
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
    wrap.dataset.variant = "accent";
    wrap.textContent = `${x.label}: ${String(x.value).padStart(2,"0")}`;
    extraBox.appendChild(wrap);
  });
  resultBox.hidden = false;

  // Ritratto numerologico
  const fullname = document.getElementById("name").value;
  const dob = document.getElementById("dob").value;
  const dateStr = refDate.value || formatDateInput(new Date());
  if (fullname && dob) renderProfile(fullname, dob, dateStr);
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

// --- Copia ---
copyBtn.addEventListener("click", async () => {
  const texts = Array.from(numsBox.querySelectorAll(".badge")).map(b=>b.textContent).join(" ");
  const extras = Array.from(extraBox.querySelectorAll(".badge")).map(b=>b.textContent).join(" ");
  const full = [titleOut.textContent, texts, extras].filter(Boolean).join("\n").trim();
  if (!full) { copyBtn.textContent = "Niente da copiare"; setTimeout(()=>copyBtn.textContent="Copia",1200); return; }
  const ok = await copyTextSafe(full);
  copyBtn.textContent = ok ? "Copiato!" : "Copia fallita";
  setTimeout(()=>copyBtn.textContent="Copia",1400);
});

// --- Salva ---
saveBtn.addEventListener("click", () => {
  const title = titleOut.textContent?.trim();
  const numbers = Array.from(numsBox.querySelectorAll(".badge")).map(b=>b.textContent);
  const extras = Array.from(extraBox.querySelectorAll(".badge")).map(b=>b.textContent);
  if (!title || numbers.length===0){ 
    saveBtn.textContent = "Nulla da salvare";
    setTimeout(()=>saveBtn.textContent="Salva in storico",1200);
    return;
  }
  let current;
  try { current = JSON.parse(lsGet("lottoai_history")||"[]"); } catch { current = []; }
  if (!Array.isArray(current)) current = [];
  const entry = { title, numbers, extras, ts: Date.now() };
  current.unshift(entry);
  const ok = lsSet("lottoai_history", JSON.stringify(current));
  if (!ok){ alert("Impossibile salvare lo storico (blocco del browser o modalità privata)."); return; }
  paintHistory();
  saveBtn.textContent = "Salvato!";
  setTimeout(()=>saveBtn.textContent="Salva in storico",1200);
});

// --- Storico ---
function paintHistory() {
  historyBox.innerHTML = "";
  let items;
  try { items = JSON.parse(lsGet("lottoai_history") || "[]"); }
  catch { items = []; }
  if (!Array.isArray(items)) items = [];
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
      let arr;
      try { arr = JSON.parse(lsGet("lottoai_history")||"[]"); } catch { arr = []; }
      if (!Array.isArray(arr)) arr = [];
      arr.splice(idx,1);
      lsSet("lottoai_history", JSON.stringify(arr));
      paintHistory();
    });
    right.appendChild(del);
    div.append(left, right);
    historyBox.appendChild(div);
  });
}

// --- Export / Clear / Share ---
exportBtn.addEventListener("click", () => {
  const data = lsGet("lottoai_history") || "[]";
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
    lsSet("lottoai_history","[]");
    paintHistory();
  }
});

shareBtn.addEventListener("click", async () => {
  const url = location.href;
  const text = "LottoAI — combinazioni personali e profilo numerologico (solo divertimento).";
  if (navigator.share) {
    try { await navigator.share({title:"LottoAI", text, url}); } catch {}
  } else {
    await copyTextSafe(`${text} ${url}`);
    shareBtn.textContent = "Link copiato";
    setTimeout(()=>shareBtn.textContent="Condividi",1200);
  }
});

// --------- init ----------
paintHistory();
todayBtn.click();
