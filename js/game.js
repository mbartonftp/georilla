/* Georilla game flow: daily set, timer, judging, reveal, results, sound and effects. */
(() => {
const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const TIERS = [["Common", 10], ["Familiar", 25], ["Uncommon", 45], ["Rare", 70], ["Silverback", 100]];
const TIER_UI = ["#c3cdc6", "#5ab4ff", "#4fe0b0", "#b58cff", "#ffd23f"];
const TIER_MAP = ["#93a69c", "#3f9be8", "#22b888", "#9566e6", "#ffc21a"]; // slightly deeper, to read on the sand-coloured land
const EMOJI = ["⬜", "🟦", "🟩", "🟪", "🟨"], MISS = "⬛";
const RANKS = [[0, "Tourist"], [150, "Trekker"], [300, "Explorer"], [450, "Cartographer"], [600, "King of the Jungle"]];
const ROUNDS = 7, SECONDS = 30, LEAD_IN = 1600, EPOCH = Date.UTC(2026, 10, 24), MAX = ROUNDS * 100;
const SITE = "mbartonftp.github.io/georilla";
const LINES = {
  intro: ["Seven prompts. Go obscure.", "Ready to swing?", "Think off the beaten path."],
  tier: [["Solid.", "Safe pick."], ["Nice one!", "Not bad!"], ["Ooh, uncommon!", "Getting warmer!"], ["Rare find!", "Look at you!"], ["SILVERBACK!", "Chest-thump time!"]],
  wrong: ["Hmm, not that one.", "Nope, try again!", "Close… ish?"],
  unknown: ["Never heard of it!", "Is that a place?"],
  miss: ["Too slow, explorer.", "Ran out of vine!"],
  nervous: ["Hurry!", "Tick tock!"],
  done: ["What a trip!", "Same time tomorrow?"]
};
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- storage ---------- */
const store = { get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
                set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

/* ---------- daily set ---------- */
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const today = new Date();
const key = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
const num = Math.round((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - EPOCH) / 864e5) + 1;
function pickSet(seed){
  const rnd = mulberry32(seed * 2654435761 % 4294967296), pool = P.slice(), out = [], used = new Set();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  for (const p of pool) { const fam = p.id.split("-")[0]; if (used.has(fam) && fam !== p.id) continue; used.add(fam); out.push(p); if (out.length === ROUNDS) break; }
  return out;
}

let practice = false, SET, ITEMS, S;
const freshState = () => ({ phase: "intro", i: 0, startedAt: null, results: [] });
function loadDaily(){ practice = false; SET = pickSet(key); ITEMS = SET.map(answersFor); S = store.get("gr-day-" + key, freshState()); }
function loadPractice(){ practice = true; SET = pickSet(Math.floor(Math.random() * 1e9)); ITEMS = SET.map(answersFor); S = freshState(); }
const save = () => { if (!practice) store.set("gr-day-" + key, S); };
const total = () => S.results.reduce((s, r) => s + (r ? TIERS[r.tier][1] : 0), 0);

/* ---------- sound ---------- */
const Sound = (() => {
  let ac = null, on = store.get("gr-sound", true);
  const ctx = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } } if (ac.state === "suspended") ac.resume(); return ac; };
  function tone(f, at, dur, type = "triangle", vol = .12, slide){
    if (!on) return; const a = ctx(); if (!a) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }
  const scale = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  return {
    get on(){ return on; },
    toggle(){ on = !on; store.set("gr-sound", on); if (on) tone(660, 0, .12); return on; },
    unlock(){ if (on) ctx(); },
    rung(i){ tone(scale[i], 0, .16, "triangle", .1); },
    land(t){ tone(scale[t], 0, .4, "triangle", .14); tone(scale[t] * 1.5, .02, .4, "sine", .06);
      if (t === 4) [0, 1, 2, 3, 4, 3, 4].forEach((k, j) => tone(scale[k] * 2, .15 + j * .07, .22, "sine", .06)); },
    wrong(){ tone(220, 0, .14, "sawtooth", .05, 150); tone(165, .11, .2, "sawtooth", .045, 110); },
    unknown(){ tone(340, 0, .08, "square", .03); tone(300, .08, .1, "square", .03); },
    tick(hi){ tone(hi ? 1250 : 950, 0, .05, "square", .025); },
    cd(go){ go ? (tone(523, 0, .12), tone(659, .08, .12), tone(1046, .16, .3)) : tone(440, 0, .12, "triangle", .1); },
    miss(){ tone(392, 0, .2, "triangle", .08, 300); tone(294, .18, .35, "triangle", .07, 220); },
    count(){ tone(880 + Math.random() * 200, 0, .04, "sine", .03); },
    key(){ tone(1500 + Math.random() * 400, 0, .02, "sine", .012); },
    rank(){ [0, 2, 4].forEach((k, j) => tone(scale[k], j * .09, .3, "triangle", .1)); }
  };
})();
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

/* ---------- confetti ---------- */
const FX = (() => {
  const c = $("fx"), x = c.getContext("2d"); let parts = [], running = false;
  const size = () => { const d = Math.min(2, devicePixelRatio || 1); c.width = innerWidth * d; c.height = innerHeight * d; x.setTransform(d, 0, 0, d, 0, 0); };
  addEventListener("resize", size); size();
  function burst(ox, oy, n = 120, colors = ["#ffd23f", "#ff7849", "#4fe0b0", "#5ab4ff", "#b58cff", "#7ccf5a"]){
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9;
      parts.push({ x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: Math.random() * 6.3, vr: (Math.random() - .5) * .4,
        w: 6 + Math.random() * 8, h: 4 + Math.random() * 5, col: colors[i % colors.length], leaf: Math.random() < .35, life: 1 });
    }
    if (!running) { running = true; requestAnimationFrame(step); }
  }
  function step(){
    x.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach(p => { p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .008;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); x.fillStyle = p.col;
      if (p.leaf) { x.beginPath(); x.ellipse(0, 0, p.w, p.h * .6, 0, 0, Math.PI * 2); x.fill(); }
      else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      x.restore(); });
    parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    if (parts.length) requestAnimationFrame(step); else { running = false; x.clearRect(0, 0, innerWidth, innerHeight); }
  }
  return { burst };
})();

/* ---------- UI helpers ---------- */
const panels = ["intro", "play", "reveal", "result"];
function show(id){ panels.forEach(p => { const el = $(p); const on = p === id; if (on && el.hidden) { el.hidden = false; el.style.animation = "none"; el.offsetHeight; el.style.animation = ""; } else if (!on) el.hidden = true; }); }
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const listJoin = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

let bubbleT = null;
function mascot(mood, line, move){
  const m = $("mascot"); m.dataset.mood = mood;
  if (move) { m.classList.remove("hop", "thump", "droop"); void m.offsetWidth; m.classList.add(move); }
  else m.classList.remove("hop", "thump", "droop");
  const b = $("bubble");
  if (line) { b.textContent = line; b.hidden = false; b.style.animation = "none"; b.offsetHeight; b.style.animation = "";
    clearTimeout(bubbleT); bubbleT = setTimeout(() => b.hidden = true, 2600); }
}

function drawTrail(){
  $("trail").innerHTML = SET.map((_, i) => {
    const r = S.results[i], done = i < S.results.length;
    const cls = done ? (r ? `done t${r.tier}` : "miss") : (i === S.i && S.phase === "play" ? "cur" : "");
    return `<div class="node ${cls}">${done ? (r ? "✓" : "–") : i + 1}</div>`;
  }).join("");
}
let shown = 0;
function setScore(v, animate){
  const el = $("total");
  if (!animate || reduce) { shown = v; el.textContent = v; return; }
  const from = shown, t0 = performance.now(), dur = 600;
  (function f(now){ const t = Math.min(1, (now - t0) / dur); shown = Math.round(from + (v - from) * t); el.textContent = shown; if (t < 1) requestAnimationFrame(f); })(t0);
  const p = $("scorepill"); p.classList.remove("bump"); void p.offsetWidth; p.classList.add("bump");
}
function updateHeader(){
  $("dayno").textContent = practice ? "Practice" : "No. " + num;
  setScore(total(), false);
  $("sound").setAttribute("aria-pressed", String(Sound.on));
}

/* ---------- intro ---------- */
function renderIntro(){
  show("intro"); updateHeader(); drawTrail();
  Globe.clear(); Globe.setSpin(true); setRing(null);
  $("introdate").textContent = `Expedition No. ${num} · ${today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}`;
  const st = store.get("gr-stats", null);
  if (st && st.played) { $("introstats").hidden = false; $("introstats").innerHTML = `Played <b>${st.played}</b> · Streak <b>${st.streak || 0}</b> · Best <b>${st.best}</b>`; }
  mascot("idle", pick(LINES.intro));
  // drift a few demo pins around while waiting
  demoPins();
}
let demoT = null;
function demoPins(){
  clearInterval(demoT);
  const names = ["Bhutan", "Suriname", "Malta", "Namibia", "Laos", "Uruguay", "Iceland", "Fiji", "Eritrea", "Moldova", "Belize", "Comoros"];
  let k = Math.floor(Math.random() * names.length);
  const go = () => { if ($("intro").hidden) return clearInterval(demoT);
    const n = names[k++ % names.length], t = Math.floor(Math.random() * 5);
    Globe.setFills([[n, TIER_MAP[t]]]); Globe.focus(n, TIER_UI[t], n); Globe.flyToName(n).then(() => Globe.setSpin(false)); };
  Globe.loaded.then(() => { go(); demoT = setInterval(go, 2600); });
}

async function countdown(){
  clearInterval(demoT);
  const cd = $("countdown"), n = $("cdn"); cd.hidden = false;
  for (const v of ["3", "2", "1", "Go!"]) {
    n.textContent = v; n.style.animation = "none"; n.offsetHeight; n.style.animation = "";
    Sound.cd(v === "Go!"); await wait(v === "Go!" ? 450 : 650);
  }
  cd.hidden = true;
}

/* ---------- play ---------- */
let timerRaf = null, lastSec = null;
function setRing(left){
  const ring = $("ring"), secs = $("secs");
  if (left == null) { ring.classList.add("off"); secs.hidden = true; return; }
  ring.classList.remove("off"); secs.hidden = false;
  const dash = `${(left / SECONDS) * 100} 100`; $("ringprog").setAttribute("stroke-dasharray", dash); $("ringglow").setAttribute("stroke-dasharray", dash);
  const low = left < 8; ring.classList.toggle("low", low); secs.classList.toggle("low", low);
  secs.textContent = Math.ceil(left);
}
function startRound(){
  S.phase = "play"; S.startedAt = S.startedAt || Date.now() + LEAD_IN; save();
  const p = SET[S.i];
  $("chip").textContent = category(p);
  $("qno").textContent = `${S.i + 1} of ${ROUNDS}`;
  $("qtext").textContent = p.q;
  $("qnote").textContent = p.note || ""; $("qnote").hidden = !p.note;
  $("msg").textContent = ""; $("guess").value = ""; closeSuggest();
  show("play"); drawTrail(); updateHeader();
  Globe.clear(); Globe.setSpin(true);
  mascot("think", S.i === 0 ? "Let's swing!" : null);
  setTimeout(() => $("guess").focus(), 50);
  lastSec = null; cancelAnimationFrame(timerRaf); timerRaf = requestAnimationFrame(tick);
}
function tick(){
  if (S.phase !== "play") return;
  const pre = S.startedAt - Date.now();
  if (pre > 0) { setRing(SECONDS); $("secs").textContent = "Ready"; document.body.classList.remove("panic"); timerRaf = requestAnimationFrame(tick); return; }
  const left = Math.max(0, SECONDS + pre / 1000);
  setRing(left);
  document.body.classList.toggle("panic", left > 0 && left <= 5);
  const sec = Math.ceil(left);
  if (sec !== lastSec) {
    if (sec <= 5 && sec > 0) Sound.tick(sec <= 3);
    if (sec === 7) mascot("nervous", pick(LINES.nervous));
    lastSec = sec;
  }
  if (left <= 0) return finishRound(null, "Time's up.");
  timerRaf = requestAnimationFrame(tick);
}

function onSubmit(e){
  e.preventDefault();
  if (S.phase !== "play") return;
  const v = $("guess").value; closeSuggest();
  const r = judge(ITEMS[S.i], v);
  if (r.kind === "empty") return;
  if (r.kind === "ok") return finishRound(r.item);
  const form = $("form");
  if (r.kind === "typo") {
    // show the correction and let the player confirm it, rather than guessing for them
    $("guess").value = r.name; Sound.unknown();
    $("msg").innerHTML = `<span style="color:var(--banana)">Did you mean <b>${esc(r.name)}</b>? Press Go to confirm, or edit it.</span>`;
    form.classList.remove("shake", "wobble"); void form.offsetWidth; form.classList.add("wobble");
    return;
  }
  form.classList.remove("shake", "wobble"); void form.offsetWidth;
  if (r.kind === "wrong") {
    form.classList.add("shake"); Sound.wrong(); buzz([30, 40, 30]);
    $("msg").textContent = `${r.name} doesn't fit. Try another.`;
    const ctry = PLACE_COUNTRY[r.name];
    if (ctry) Globe.flash(ctry, "#ff5d5d", r.name).then(() => setTimeout(() => { if (S.phase === "play") { Globe.unfocus(); Globe.setSpin(true); } }, 900));
    mascot(S.phase === "play" && $("mascot").dataset.mood === "nervous" ? "nervous" : "think", pick(LINES.wrong));
  } else {
    form.classList.add("wobble"); Sound.unknown();
    $("msg").textContent = `Didn't recognise "${v.trim()}". Check the spelling.`;
    mascot($("mascot").dataset.mood, pick(LINES.unknown));
  }
  $("guess").select();
}

/* type-ahead over every place name (so it never hints at the answer) */
let sugg = [], sel = -1;
function closeSuggest(){ $("suggest").hidden = true; $("guess").setAttribute("aria-expanded", "false"); sugg = []; sel = -1; }
function onInput(){
  Sound.key();
  const g = norm($("guess").value);
  if (g.length < 2) return closeSuggest();
  const starts = [], inner = [];
  for (const it of ALL_NAMES) {
    if (it.k.startsWith(g) || it.alts.some(a => a.startsWith(g))) starts.push(it);
    else if (it.k.includes(" " + g)) inner.push(it);
  }
  sugg = [...starts, ...inner].slice(0, 5); sel = -1;
  if (!sugg.length || (sugg.length === 1 && sugg[0].k === g)) return closeSuggest();
  const raw = $("guess").value.trim();
  $("suggest").innerHTML = sugg.map((s, i) => {
    const idx = s.n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").indexOf(raw.toLowerCase());
    const label = idx >= 0 ? esc(s.n.slice(0, idx)) + "<mark>" + esc(s.n.slice(idx, idx + raw.length)) + "</mark>" + esc(s.n.slice(idx + raw.length)) : esc(s.n);
    return `<li role="option" id="sg${i}" aria-selected="false" data-i="${i}">${label}</li>`;
  }).join("");
  $("suggest").hidden = false; $("guess").setAttribute("aria-expanded", "true");
}
function moveSel(d){
  if (!sugg.length) return;
  sel = (sel + d + sugg.length) % sugg.length;
  [...$("suggest").children].forEach((li, i) => li.setAttribute("aria-selected", String(i === sel)));
  $("guess").setAttribute("aria-activedescendant", "sg" + sel);
}
function choose(i){ $("guess").value = sugg[i].n; closeSuggest(); $("form").requestSubmit(); }

/* ---------- reveal ---------- */
async function finishRound(item, why){
  cancelAnimationFrame(timerRaf); document.body.classList.remove("panic");
  S.results[S.i] = item ? { label: item.label, tier: item.tier, country: item.country || null } : null;
  S.phase = "reveal"; S.startedAt = null; save();
  await renderReveal(S.i, why, true);
}
function answerFills(i){
  const m = new Map();
  ITEMS[i].forEach(it => { if (it.country && !SET[i].custom) m.set(it.country, TIER_MAP[it.tier]); });
  if (SET[i].custom) m.set(SET[i].parent, TIER_MAP[2]);
  return m;
}
async function renderReveal(i, why, animate){
  const r = S.results[i], items = ITEMS[i], p = SET[i];
  setRing(null); drawTrail();
  $("rchip").textContent = category(p); $("rqno").textContent = `${i + 1} of ${ROUNDS}`;
  $("rq").textContent = p.q;
  $("ladder").innerHTML = TIERS.map(([n, pts], k) => `<div class="rung t${k}" data-k="${k}"><span>${n}</span><span>${pts}</span></div>`).join("");
  $("vtier").textContent = ""; $("vpts").textContent = ""; $("vline").textContent = ""; $("alsos").textContent = "";
  $("nextq").textContent = i === ROUNDS - 1 ? "See results" : "Next prompt";
  show("reveal");
  Globe.setFills(answerFills(i));
  const top = items.filter(it => it.tier === 4 && (!r || it.label !== r.label)).slice(0, 4).map(it => it.label);

  if (!r) {
    Globe.unfocus(); Globe.flyToMany([...answerFills(i).keys()]);
    $("vtier").textContent = why === "Skipped." ? "Skipped" : "Time's up"; $("vtier").className = "vtier c0" + (animate ? " stamp" : "");
    $("vpts").textContent = "+0";
    $("vline").textContent = `There were ${items.length} right answers. They're lit up on the globe.`;
    if (top.length) $("alsos").innerHTML = `Silverback answers included <span>${esc(listJoin(top))}</span>.`;
    if (animate) { Sound.miss(); mascot("sad", pick(LINES.miss), "droop"); } else mascot("sad");
    $("nextq").focus();
    return;
  }

  const ctry = r.country || (p.custom ? p.parent : null);
  Globe.focus(ctry, "#ffffff", r.label);
  const flying = ctry ? Globe.flyToName(ctry) : Promise.resolve();
  if (animate) {
    mascot("think");
    await Promise.race([flying, wait(900)]);
    // climb the ladder
    for (let k = 0; k <= r.tier; k++) {
      const el = $("ladder").children[k]; el.classList.add("lit"); Sound.rung(k);
      await wait(k === r.tier ? 120 : 190);
    }
  } else for (let k = 0; k <= r.tier; k++) $("ladder").children[k].classList.add("lit");
  $("ladder").children[r.tier].classList.add("final");

  $("vtier").textContent = TIERS[r.tier][0]; $("vtier").className = `vtier c${r.tier}` + (animate ? " stamp" : "");
  $("vpts").textContent = "+" + TIERS[r.tier][1];
  const same = items.filter(it => it.tier === r.tier).length - 1;
  $("vline").innerHTML = `<b>${esc(r.label)}</b> is one of ${items.length} right answers. ${same ? `${same} other${same === 1 ? "" : "s"} share its tier.` : "No other answer shares its tier."}`;
  if (top.length) $("alsos").innerHTML = `${r.tier === 4 ? "Other Silverback answers" : "Silverback answers"} included <span>${esc(listJoin(top))}</span>.`;
  $("live").textContent = `${TIERS[r.tier][0]}, plus ${TIERS[r.tier][1]} points.`;

  if (animate) {
    Sound.land(r.tier); buzz(r.tier >= 3 ? [40, 30, 80] : 25);
    flyPoints(TIERS[r.tier][1]);
    const rect = $("vtier").getBoundingClientRect();
    if (r.tier === 4) {
      mascot("wow", pick(LINES.tier[4]), "thump");
      FX.burst(rect.left + 60, rect.top + 20, 170);
      if (!reduce) { document.body.classList.remove("shakescreen"); void document.body.offsetWidth; document.body.classList.add("shakescreen"); }
    } else if (r.tier === 3) { mascot("wow", pick(LINES.tier[3]), "hop"); FX.burst(rect.left + 60, rect.top + 20, 60, ["#b58cff", "#5ab4ff", "#ffd23f"]); }
    else mascot("happy", pick(LINES.tier[r.tier]), "hop");
  } else { mascot(r.tier >= 3 ? "wow" : "happy"); setScore(total(), false); }
  $("nextq").focus();
}
function flyPoints(pts){
  const from = $("vpts").getBoundingClientRect(), to = $("scorepill").getBoundingClientRect();
  if (reduce) { setScore(total(), false); return; }
  const el = document.createElement("div"); el.className = "flypts"; el.textContent = "+" + pts;
  el.style.left = from.left + "px"; el.style.top = from.top + "px"; document.body.appendChild(el);
  const dx = to.left + to.width / 2 - from.left - 20, dy = to.top - from.top;
  el.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${dx * .4}px, ${dy * .4 - 60}px) scale(1.3)`, opacity: 1, offset: .45 },
    { transform: `translate(${dx}px, ${dy}px) scale(.5)`, opacity: .2 }], { duration: 800, easing: "cubic-bezier(.4,0,.6,1)" })
    .onfinish = () => { el.remove(); setScore(total(), true); Sound.count(); };
}

function next(){
  if (S.phase !== "reveal") return;
  if (S.i < ROUNDS - 1) { S.i++; startRound(); }
  else { S.phase = "done"; if (!practice) recordStats(); save(); renderResult(true); }
}

/* ---------- results ---------- */
function recordStats(){
  const st = store.get("gr-stats", { played: 0, sum: 0, best: 0, streak: 0, lastDay: null });
  st.played++; st.sum += total(); st.best = Math.max(st.best, total());
  st.streak = st.lastDay === num - 1 ? (st.streak || 0) + 1 : 1; st.lastDay = num;
  store.set("gr-stats", st);
}
const rankFor = s => RANKS.filter(([min]) => s >= min).pop()[1];
function shareText(){
  return `Georilla ${practice ? "practice" : "No. " + num} 🦍 ${total()}/${MAX}\n${rankFor(total())}\n` + S.results.map(r => r ? EMOJI[r.tier] : MISS).join("") + `\n${SITE}`;
}
let tourT = null, clockT = null;
async function renderResult(animate){
  show("result"); drawTrail(); setRing(null); updateHeader();
  $("reyebrow").textContent = practice ? "Practice complete" : `Expedition No. ${num} complete`;
  $("stats").hidden = practice;
  $("again").textContent = practice ? "Another practice round" : "Practice round";
  const tot = total();
  // globe: all your answers lit, then a slow tour
  const fills = new Map(); S.results.forEach(r => { if (r && r.country) fills.set(r.country, TIER_MAP[r.tier]); });
  Globe.setFills(fills); Globe.unfocus();
  const stops = S.results.filter(r => r && r.country); let k = 0;
  clearInterval(tourT);
  if (stops.length) { const tour = () => { if ($("result").hidden) return clearInterval(tourT); const r = stops[k++ % stops.length];
    Globe.focus(r.country, TIER_UI[r.tier], r.label); Globe.flyToName(r.country); }; Globe.loaded.then(tour); tourT = setInterval(tour, 2400); }
  else Globe.setSpin(true);

  $("tiles").innerHTML = S.results.map((r, i) => `<div class="tile ${r ? "t" + r.tier : "miss"}">${r ? TIERS[r.tier][1] : "–"}</div>`).join("") +
    Array.from({ length: ROUNDS - S.results.length }, () => `<div class="tile miss">–</div>`).join("");
  $("rank").textContent = rankFor(tot);
  const st = store.get("gr-stats", { played: 0, sum: 0, best: 0, streak: 0 });
  $("sPlayed").textContent = st.played; $("sStreak").textContent = st.streak || 0; $("sAvg").textContent = st.played ? Math.round(st.sum / st.played) : 0; $("sBest").textContent = st.best;
  $("recap").innerHTML = SET.map((p, i) => { const r = S.results[i];
    const all = ITEMS[i].map(it => `<span class="c${it.tier}${r && r.label === it.label ? " you" : ""}">${esc(it.label)}</span>`).join("");
    return `<li><details><summary><span><span class="rq">${esc(p.q)}</span><span class="ra ${r ? "c" + r.tier : "muted"}">${r ? esc(r.label) : "No answer"}</span></span>
      <span class="rp ${r ? "c" + r.tier : "muted"}">${r ? "+" + TIERS[r.tier][1] : "+0"}</span></summary><div class="all">${all}</div></details></li>`; }).join("");
  clearInterval(clockT);
  if (!practice) { clock(); clockT = setInterval(clock, 1000); } else $("next").textContent = "";

  if (animate && !reduce) {
    $("final").innerHTML = `0<small> / ${MAX}</small>`; $("rank").style.visibility = "hidden";
    [...$("tiles").children].forEach(t => t.classList.remove("flip"));
    mascot("happy", pick(LINES.done));
    for (const [i, t] of [...$("tiles").children].entries()) { await wait(140); t.classList.add("flip"); const r = S.results[i]; if (r) Sound.rung(r.tier); }
    const t0 = performance.now(), dur = 1200; let lastTick = 0;
    await new Promise(done => (function f(now){ const t = Math.min(1, (now - t0) / dur), v = Math.round(tot * d3.easeCubicOut(t));
      $("final").innerHTML = `${v}<small> / ${MAX}</small>`; if (now - lastTick > 70 && t < 1) { Sound.count(); lastTick = now; }
      if (t < 1) requestAnimationFrame(f); else done(); })(t0));
    $("rank").style.visibility = ""; $("rank").classList.remove("stamp"); void $("rank").offsetWidth; $("rank").classList.add("stamp"); Sound.rank();
    if (tot >= 450) { const b = $("rank").getBoundingClientRect(); FX.burst(b.left + b.width / 2, b.top, tot >= 600 ? 200 : 90); mascot("wow", tot >= 600 ? "King of the Jungle!" : "Pro explorer!", "thump"); }
  } else {
    [...$("tiles").children].forEach(t => t.classList.add("flip"));
    $("final").innerHTML = `${tot}<small> / ${MAX}</small>`; mascot(tot >= 450 ? "wow" : "happy");
  }
}
function clock(){
  const now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), ms = mid - now;
  $("next").textContent = `Next expedition in ${Math.floor(ms / 36e5)}h ${String(Math.floor(ms % 36e5 / 6e4)).padStart(2, "0")}m ${String(Math.floor(ms % 6e4 / 1e3)).padStart(2, "0")}s`;
}

/* ---------- wiring ---------- */
$("start").addEventListener("click", async () => { Sound.unlock(); await countdown(); startRound(); });
$("practice").addEventListener("click", async () => { Sound.unlock(); loadPractice(); updateHeader(); await countdown(); startRound(); });
$("again").addEventListener("click", async () => { Sound.unlock(); loadPractice(); updateHeader(); await countdown(); startRound(); });
$("form").addEventListener("submit", onSubmit);
$("guess").addEventListener("input", onInput);
$("guess").addEventListener("keydown", e => {
  if (e.key === "ArrowDown") { e.preventDefault(); moveSel(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); moveSel(-1); }
  else if (e.key === "Enter" && sel >= 0) { e.preventDefault(); choose(sel); }
  else if (e.key === "Escape") closeSuggest();
});
$("guess").addEventListener("blur", () => setTimeout(closeSuggest, 150));
$("suggest").addEventListener("pointerdown", e => { const li = e.target.closest("li"); if (li) { e.preventDefault(); choose(+li.dataset.i); } });
$("skip").addEventListener("click", () => { if (S.phase === "play") finishRound(null, "Skipped."); });
$("nextq").addEventListener("click", next);
document.addEventListener("keydown", e => { if (e.key === "Enter" && S.phase === "reveal" && document.activeElement !== $("nextq")) next(); });
$("sound").addEventListener("click", () => { $("sound").setAttribute("aria-pressed", String(Sound.toggle())); });
$("share").addEventListener("click", () => {
  const t = shareText();
  const fallback = () => { const ta = $("sharetext"); ta.value = t; ta.hidden = false; ta.select(); $("toast").textContent = "Select and copy the text below."; };
  try { navigator.clipboard.writeText(t).then(() => { $("toast").textContent = "Copied. Paste it anywhere."; }, fallback); } catch { fallback(); }
});

/* ---------- boot: resume where the player left off ---------- */
loadDaily(); updateHeader();
if (S.phase === "play") {
  if (Date.now() - S.startedAt > SECONDS * 1000) { S.results[S.i] = null; S.phase = "reveal"; S.startedAt = null; save(); Globe.loaded.then(() => renderReveal(S.i, "Time's up.", false)); }
  else startRound();
} else if (S.phase === "reveal") Globe.loaded.then(() => renderReveal(S.i, null, false));
else if (S.phase === "done") Globe.loaded.then(() => renderResult(false));
else renderIntro();
window.__georilla = { get S(){ return S; }, get ITEMS(){ return ITEMS; }, get SET(){ return SET; }, shareText };
})();
