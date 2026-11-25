/* Georilla game flow: intro, timer, judging, reveal, results. */
import { easeCubicOut } from "d3-ease";
import { answersFor, category, judge, norm, type Answer, type NameEntry, type Prompt } from "./data";
import { Globe } from "./globe";
import type { Dot, MapView } from "./mapview";
import { MODE, MODES, modeFromHash, seedFor, type Mode, type ModeId } from "./modes";
import { UsMap } from "./usmap";
import { Confetti } from "./fx";
import { Sound, buzz } from "./sound";
import { store } from "./store";
import { MAX, ROUNDS, SECONDS, TIERS, dayKey, dayNumber, pickSet, rankFor, shareText, totalOf, type Result } from "./rules";

const TIER_UI = ["#c3cdc6", "#5ab4ff", "#4fe0b0", "#b58cff", "#ffd23f"];
const TIER_MAP = ["#93a69c", "#3f9be8", "#22b888", "#9566e6", "#ffc21a"]; // slightly deeper, to read on the sand-coloured land
const LEAD_IN = 1600;
/** an area that holds dotted answers (cities, parks), lit softly so the dots stand out */
const AREA_HINT = "#d8c78a";
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

type Phase = "intro" | "play" | "reveal" | "done";
interface State { phase: Phase; i: number; startedAt: number | null; results: (Result | null)[] }
interface Stats { played: number; sum: number; best: number; streak: number; lastDay: number | null }
type Mood = "idle" | "think" | "nervous" | "happy" | "wow" | "sad";
type Move = "hop" | "thump" | "droop";

const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const esc = (s: string): string => s.replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
const listJoin = (a: string[]): string => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
const restart = (el: HTMLElement, cls: string): void => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

export function startGame(): void {
  const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing #${id}`);
    return el as T;
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms: number) => new Promise<void>(r => setTimeout(r, reduce ? 0 : ms));
  const maps = { globe: new Globe($<HTMLCanvasElement>("globe"), $("pinlabel"), import.meta.env.BASE_URL), usa: new UsMap($<HTMLCanvasElement>("usmap"), $("pinlabel"), import.meta.env.BASE_URL) };
  let mode: Mode = modeFromHash(location.hash) || MODE.get(store.get<ModeId>("gr-mode", "world")) || MODES[0];
  let globe: MapView = maps[mode.map];
  const fx = new Confetti($<HTMLCanvasElement>("fx"), reduce);
  const guess = $<HTMLInputElement>("guess"), form = $<HTMLFormElement>("form"), suggestEl = $("suggest");

  const today = new Date(), key = dayKey(today), num = dayNumber(today);
  let practice = false, SET: Prompt[] = [], ITEMS: Answer[][] = [];
  let S: State = { phase: "intro", i: 0, startedAt: null, results: [] };
  const freshState = (): State => ({ phase: "intro", i: 0, startedAt: null, results: [] });
  const dayOf = (m: Mode) => store.get<State | null>(m.dayKey + key, null);
  const statsOf = (m: Mode) => store.get<Stats>(m.statsKey, { played: 0, sum: 0, best: 0, streak: 0, lastDay: null });
  const loadDaily = () => { practice = false; SET = pickSet(seedFor(mode, key), mode.pool); ITEMS = SET.map(answersFor); S = dayOf(mode) || freshState(); };
  const loadPractice = () => { practice = true; SET = pickSet(Math.floor(Math.random() * 1e9), mode.pool); ITEMS = SET.map(answersFor); S = freshState(); };
  const save = () => { if (!practice) store.set(mode.dayKey + key, S); };
  const total = () => totalOf(S.results);
  const site = () => SITE + (mode.id === "world" ? "" : "/#" + mode.id);
  const share = () => shareText(S.results, practice ? "practice" : "No. " + num, site(), mode.title);

  /* ---------- UI helpers ---------- */
  const panels = ["intro", "play", "reveal", "result"] as const;
  function show(id: typeof panels[number]): void {
    for (const p of panels) {
      const el = $(p);
      if (p === id && el.hidden) { el.hidden = false; el.style.animation = "none"; void el.offsetHeight; el.style.animation = ""; }
      else if (p !== id) el.hidden = true;
    }
    $("modes").hidden = id === "play" || id === "reveal";
    if (id === "intro" || id === "result") drawModes();
  }

  /* ---------- the game picker ---------- */
  function drawModes(): void {
    for (const btn of $("modes").querySelectorAll<HTMLButtonElement>(".mode")) {
      const m = MODE.get(btn.dataset.mode as ModeId)!, d = dayOf(m), ms = btn.querySelector<HTMLElement>(".ms")!;
      btn.setAttribute("aria-pressed", String(m === mode));
      const done = d?.phase === "done";
      ms.textContent = done ? `✓ ${totalOf(d!.results)}` : d && d.phase !== "intro" ? "In progress" : "Not played";
      ms.classList.toggle("done", done);
      btn.setAttribute("aria-label", `${m.name}: ${ms.textContent}`);
    }
  }
  function stopTimers(): void { clearInterval(demoT); clearInterval(tourT); clearInterval(clockT); }
  function switchMode(id: ModeId): void {
    const m = MODE.get(id);
    if (!m || (m === mode && !practice)) return;
    if (!practice && (S.phase === "play" || S.phase === "reveal")) return; // never walk away from a daily game mid-prompt
    stopTimers();
    mode = m; store.set("gr-mode", id);
    history.replaceState(null, "", id === "world" ? location.pathname + location.search : "#" + id);
    globe.clear(); globe.setActive(false);
    globe = maps[mode.map]; globe.clear(); globe.setActive(true);
    loadDaily(); route();
  }

  let bubbleT: number | undefined;
  function mascot(mood: Mood, line?: string | null, move?: Move): void {
    const m = $("mascot"); m.dataset.mood = mood;
    m.classList.remove("hop", "thump", "droop");
    if (move) restart(m, move);
    const b = $("bubble");
    if (line) {
      b.textContent = line; b.hidden = false; b.style.animation = "none"; void b.offsetHeight; b.style.animation = "";
      clearTimeout(bubbleT); bubbleT = window.setTimeout(() => { b.hidden = true; }, 2600);
    }
  }

  function drawTrail(): void {
    $("trail").innerHTML = SET.map((_, i) => {
      const r = S.results[i], done = i < S.results.length;
      const cls = done ? (r ? `done t${r.tier}` : "miss") : (i === S.i && S.phase === "play" ? "cur" : "");
      return `<div class="node ${cls}">${done ? (r ? "✓" : "–") : i + 1}</div>`;
    }).join("");
  }

  let shown = 0;
  function setScore(v: number, animate: boolean): void {
    const el = $("total");
    if (!animate || reduce) { shown = v; el.textContent = String(v); return; }
    const from = shown, t0 = performance.now(), dur = 600;
    const f = (now: number) => { const t = Math.min(1, (now - t0) / dur); shown = Math.round(from + (v - from) * t); el.textContent = String(shown); if (t < 1) requestAnimationFrame(f); };
    f(t0);
    restart($("scorepill"), "bump");
  }
  function updateHeader(): void {
    $("dayno").textContent = practice ? "Practice" : (mode.title ? mode.title + " " : "") + "No. " + num;
    guess.placeholder = mode.placeholder;
    setScore(total(), false);
    $("sound").setAttribute("aria-pressed", String(Sound.on));
  }

  /* ---------- intro ---------- */
  let demoT: number | undefined;
  function renderIntro(): void {
    show("intro"); updateHeader(); drawTrail();
    globe.clear(); globe.setSpin(true); setRing(null);
    $("introdate").textContent = `${mode.intro.eyebrow} No. ${num} · ${today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}`;
    $("introh1").textContent = mode.intro.h1; $("introblurb").innerHTML = mode.intro.blurb;
    $("start").textContent = `Start ${mode.intro.eyebrow.toLowerCase()}`;
    const st = statsOf(mode);
    $("introstats").hidden = !st.played;
    if (st.played) $("introstats").innerHTML = `Played <b>${st.played}</b> · Streak <b>${st.streak || 0}</b> · Best <b>${st.best}</b>`;
    mascot("idle", pick(LINES.intro));
    demoPins();
  }
  // drift a few demo pins around while waiting
  function demoPins(): void {
    clearInterval(demoT);
    const names = mode.demo;
    let k = Math.floor(Math.random() * names.length);
    const go = () => {
      if ($("intro").hidden) { clearInterval(demoT); return; }
      const n = names[k++ % names.length], t = Math.floor(Math.random() * 5);
      globe.setFills([[n, TIER_MAP[t]]]); globe.focus(n, TIER_UI[t], n);
      void globe.flyToName(n).then(() => globe.setSpin(false));
    };
    void globe.loaded.then(() => { go(); demoT = window.setInterval(go, 2600); });
  }

  async function countdown(): Promise<void> {
    clearInterval(demoT);
    const cd = $("countdown"), n = $("cdn"); cd.hidden = false;
    for (const v of ["3", "2", "1", "Go!"]) {
      n.textContent = v; n.style.animation = "none"; void n.offsetHeight; n.style.animation = "";
      Sound.countdown(v === "Go!"); await wait(v === "Go!" ? 450 : 650);
    }
    cd.hidden = true;
  }

  /* ---------- play ---------- */
  let timerRaf = 0, lastSec: number | null = null;
  function setRing(left: number | null): void {
    const ring = $("ring"), secs = $("secs");
    if (left == null) { ring.classList.add("off"); secs.hidden = true; return; }
    ring.classList.remove("off"); secs.hidden = false;
    const dash = `${(left / SECONDS) * 100} 100`;
    $("ringprog").setAttribute("stroke-dasharray", dash); $("ringglow").setAttribute("stroke-dasharray", dash);
    const low = left < 8; ring.classList.toggle("low", low); secs.classList.toggle("low", low);
    secs.textContent = String(Math.ceil(left));
  }
  function startRound(): void {
    S.phase = "play"; S.startedAt = S.startedAt || Date.now() + LEAD_IN; save();
    const p = SET[S.i];
    $("chip").textContent = category(p);
    $("qno").textContent = `${S.i + 1} of ${ROUNDS}`;
    $("qtext").textContent = p.q;
    $("qnote").textContent = p.note || ""; $("qnote").hidden = !p.note;
    $("msg").textContent = ""; guess.value = ""; closeSuggest();
    show("play"); drawTrail(); updateHeader();
    globe.clear(); globe.setSpin(true);
    mascot("think", S.i === 0 ? "Let's swing!" : null);
    setTimeout(() => guess.focus(), 50);
    lastSec = null; cancelAnimationFrame(timerRaf); timerRaf = requestAnimationFrame(tick);
  }
  function tick(): void {
    if (S.phase !== "play" || S.startedAt == null) return;
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
    if (left <= 0) { void finishRound(null, "Time's up."); return; }
    timerRaf = requestAnimationFrame(tick);
  }

  function onSubmit(e: SubmitEvent): void { e.preventDefault(); submitGuess(); }
  function submitGuess(): void {
    if (S.phase !== "play") return;
    const v = guess.value; closeSuggest();
    const r = judge(ITEMS[S.i], v, mode.known);
    if (r.kind === "empty") return;
    if (r.kind === "ok") { void finishRound(r.item); return; }
    form.classList.remove("shake", "wobble"); void form.offsetWidth;
    if (r.kind === "typo") {
      // show the correction and let the player confirm it, rather than guessing for them
      guess.value = r.name; Sound.unknown();
      $("msg").innerHTML = `<span style="color:var(--banana)">Did you mean <b>${esc(r.name)}</b>? Press Go to confirm, or edit it.</span>`;
      form.classList.add("wobble");
      return;
    }
    if (r.kind === "wrong") {
      form.classList.add("shake"); Sound.wrong(); buzz([30, 40, 30]);
      $("msg").textContent = `${r.name} doesn't fit. Try another.`;
      const loc = mode.locate(r.name);
      if (loc) void globe.flash(loc.area, "#ff5d5d", r.name, loc.ll).then(() => setTimeout(() => { if (S.phase === "play") { globe.unfocus(); globe.setSpin(true); } }, 900));
      mascot($("mascot").dataset.mood === "nervous" ? "nervous" : "think", pick(LINES.wrong));
    } else {
      form.classList.add("wobble"); Sound.unknown();
      $("msg").textContent = `Didn't recognise "${v.trim()}". Check the spelling.`;
      mascot(($("mascot").dataset.mood as Mood) || "think", pick(LINES.unknown));
    }
    guess.select();
  }

  /* type-ahead over every place name (so it never hints at the answer) */
  let sugg: NameEntry[] = [], sel = -1;
  function closeSuggest(): void { suggestEl.hidden = true; guess.setAttribute("aria-expanded", "false"); sugg = []; sel = -1; }
  function onInput(): void {
    Sound.key();
    const g = norm(guess.value);
    if (g.length < 2) return closeSuggest();
    const starts: NameEntry[] = [], inner: NameEntry[] = [];
    for (const it of mode.names) {
      if (it.k.startsWith(g) || it.alts.some(a => a.startsWith(g))) starts.push(it);
      else if (it.k.includes(" " + g)) inner.push(it);
    }
    sugg = [...starts, ...inner].slice(0, 5); sel = -1;
    if (!sugg.length || (sugg.length === 1 && sugg[0].k === g)) return closeSuggest();
    const raw = guess.value.trim();
    suggestEl.innerHTML = sugg.map((s, i) => {
      const idx = s.n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").indexOf(raw.toLowerCase());
      const label = idx >= 0 ? esc(s.n.slice(0, idx)) + "<mark>" + esc(s.n.slice(idx, idx + raw.length)) + "</mark>" + esc(s.n.slice(idx + raw.length)) : esc(s.n);
      return `<li role="option" id="sg${i}" aria-selected="false" data-n="${esc(s.n)}">${label}</li>`;
    }).join("");
    suggestEl.hidden = false; guess.setAttribute("aria-expanded", "true");
  }
  function moveSel(d: number): void {
    if (!sugg.length) return;
    sel = (sel + d + sugg.length) % sugg.length;
    [...suggestEl.children].forEach((li, i) => li.setAttribute("aria-selected", String(i === sel)));
    guess.setAttribute("aria-activedescendant", "sg" + sel);
  }
  // Submit directly rather than via form.requestSubmit(), and take the name from the tapped row,
  // so a pick still works if the list was cleared or re-rendered between touch start and end.
  function choose(name: string | undefined): void { if (!name) return; guess.value = name; closeSuggest(); submitGuess(); }

  /* ---------- reveal ---------- */
  async function finishRound(item: Answer | null, why?: string): Promise<void> {
    cancelAnimationFrame(timerRaf); document.body.classList.remove("panic");
    S.results[S.i] = item ? { label: item.label, tier: item.tier, country: item.country || null, ll: item.ll } : null;
    S.phase = "reveal"; S.startedAt = null; save();
    await renderReveal(S.i, why, true);
  }
  /** Every right answer on the map: areas filled by tier, and dots for answers at an exact spot (cities, parks, capitals). */
  function answerMarks(i: number): { fills: Map<string, string>; dots: Dot[] } {
    const fills = new Map<string, string>(), dots: Dot[] = [], p = SET[i];
    if (p.kind === "region") { if (p.parent) fills.set(p.parent, TIER_MAP[2]); return { fills, dots }; }
    // likeliest first, so an area holding several answers (three Texas cities) takes the rarest colour
    for (const it of ITEMS[i]) {
      if (it.ll) dots.push({ ll: it.ll, color: TIER_UI[it.tier] });
      if (it.country) fills.set(it.country, it.ll && p.kind === "place" ? AREA_HINT : TIER_MAP[it.tier]);
    }
    return { fills, dots: dots.reverse() };
  }
  const showMarks = (i: number) => { const m = answerMarks(i); globe.setFills(m.fills); globe.setDots(m.dots); return m; };
  /** a predicted share, in words: "about 1 in 4 players" */
  const shareWords = (x: number) => (x >= 0.095 ? `about ${Math.round(x * 100)}% of players` : x >= 0.01 ? `about 1 in ${Math.round(1 / x)} players` : "fewer than 1 in 100 players");
  const ladderRung = (k: number) => $("ladder").children[k] as HTMLElement;

  async function renderReveal(i: number, why: string | undefined, animate: boolean): Promise<void> {
    const r = S.results[i], items = ITEMS[i], p = SET[i];
    setRing(null); drawTrail();
    $("rchip").textContent = category(p); $("rqno").textContent = `${i + 1} of ${ROUNDS}`;
    $("rq").textContent = p.q;
    $("ladder").innerHTML = TIERS.map(([n, pts], k) => `<div class="rung t${k}"><span>${n}</span><span>${pts}</span></div>`).join("");
    for (const id of ["vtier", "vpts", "vline", "alsos"]) $(id).textContent = "";
    $("nextq").textContent = i === ROUNDS - 1 ? "See results" : "Next prompt";
    show("reveal");
    const marks = showMarks(i);
    const top = items.filter(it => it.tier === 4 && (!r || it.label !== r.label)).slice(0, 4).map(it => it.label);

    if (!r) {
      globe.unfocus(); void globe.flyToMany([...marks.fills.keys()]);
      $("vtier").textContent = why === "Skipped." ? "Skipped" : "Time's up"; $("vtier").className = "vtier c0" + (animate ? " stamp" : "");
      $("vpts").textContent = "+0";
      $("vline").textContent = `There were ${items.length} right answers. They're lit up on the map.`;
      if (top.length) $("alsos").innerHTML = `Silverback answers included <span>${esc(listJoin(top))}</span>.`;
      if (animate) { Sound.miss(); mascot("sad", pick(LINES.miss), "droop"); } else mascot("sad");
      $("nextq").focus();
      return;
    }

    const ctry = r.country || p.parent || null;
    globe.focus(ctry, "#ffffff", r.label, r.ll);
    const flying = globe.flyToName(ctry, undefined, r.ll);
    if (animate) {
      mascot("think");
      await Promise.race([flying, wait(900)]);
      // climb the ladder
      for (let k = 0; k <= r.tier; k++) { ladderRung(k).classList.add("lit"); Sound.rung(k); await wait(k === r.tier ? 120 : 190); }
    } else for (let k = 0; k <= r.tier; k++) ladderRung(k).classList.add("lit");
    ladderRung(r.tier).classList.add("final");

    const [tierName, pts] = TIERS[r.tier];
    $("vtier").textContent = tierName; $("vtier").className = `vtier c${r.tier}` + (animate ? " stamp" : "");
    $("vpts").textContent = "+" + pts;
    const same = items.filter(it => it.tier === r.tier).length - 1;
    const mine = items.find(it => it.label === r.label);
    $("vline").innerHTML = `<b>${esc(r.label)}</b> is one of ${items.length} right answers. ${mine ? `We reckon ${shareWords(mine.share)} would say it. ` : ""}${same ? `${same} other${same === 1 ? "" : "s"} share its tier.` : "No other answer shares its tier."}`;
    if (top.length) $("alsos").innerHTML = `${r.tier === 4 ? "Other Silverback answers" : "Silverback answers"} included <span>${esc(listJoin(top))}</span>.`;
    $("live").textContent = `${tierName}, plus ${pts} points.`;

    if (animate) {
      Sound.land(r.tier); buzz(r.tier >= 3 ? [40, 30, 80] : 25);
      flyPoints(pts);
      const rect = $("vtier").getBoundingClientRect();
      if (r.tier === 4) {
        mascot("wow", pick(LINES.tier[4]), "thump");
        fx.burst(rect.left + 60, rect.top + 20, 170);
        if (!reduce) restart(document.body, "shakescreen");
      } else if (r.tier === 3) { mascot("wow", pick(LINES.tier[3]), "hop"); fx.burst(rect.left + 60, rect.top + 20, 60, ["#b58cff", "#5ab4ff", "#ffd23f"]); }
      else mascot("happy", pick(LINES.tier[r.tier]), "hop");
    } else { mascot(r.tier >= 3 ? "wow" : "happy"); setScore(total(), false); }
    $("nextq").focus();
  }

  function flyPoints(pts: number): void {
    if (reduce) { setScore(total(), false); return; }
    const from = $("vpts").getBoundingClientRect(), to = $("scorepill").getBoundingClientRect();
    const el = document.createElement("div"); el.className = "flypts"; el.textContent = "+" + pts;
    el.style.left = from.left + "px"; el.style.top = from.top + "px"; document.body.appendChild(el);
    const dx = to.left + to.width / 2 - from.left - 20, dy = to.top - from.top;
    el.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * .4}px, ${dy * .4 - 60}px) scale(1.3)`, opacity: 1, offset: .45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.5)`, opacity: .2 }
    ], { duration: 800, easing: "cubic-bezier(.4,0,.6,1)" }).onfinish = () => { el.remove(); setScore(total(), true); Sound.count(); };
  }

  function next(): void {
    if (S.phase !== "reveal") return;
    if (S.i < ROUNDS - 1) { S.i++; startRound(); }
    else { S.phase = "done"; if (!practice) recordStats(); save(); void renderResult(true); }
  }

  /* ---------- results ---------- */
  function recordStats(): void {
    const st = statsOf(mode);
    st.played++; st.sum += total(); st.best = Math.max(st.best, total());
    st.streak = st.lastDay === num - 1 ? (st.streak || 0) + 1 : 1; st.lastDay = num;
    store.set(mode.statsKey, st);
  }

  let tourT: number | undefined, clockT: number | undefined;
  async function renderResult(animate: boolean): Promise<void> {
    show("result"); drawTrail(); setRing(null); updateHeader();
    $("reyebrow").textContent = practice ? "Practice complete" : `${mode.intro.eyebrow} No. ${num} complete`;
    const others = MODES.filter(m => m !== mode && dayOf(m)?.phase !== "done");
    $("moretoday").hidden = practice || !others.length;
    $("moretoday").innerHTML = others.length ? `<span>Also today:</span>` + others.map(m => `<button class="btn ghost sm" data-go="${m.id}">${m.emoji} ${m.name}</button>`).join("") : "";
    $("stats").hidden = practice;
    $("again").textContent = practice ? "Another practice round" : "Practice round";
    const tot = total();
    // globe: all your answers lit, then a slow tour
    const stops = S.results.filter((r): r is Result & { country: string } => !!r?.country);
    globe.setFills(stops.map(r => [r.country, r.ll && mode.map === "usa" ? AREA_HINT : TIER_MAP[r.tier]] as [string, string])); globe.unfocus();
    globe.setDots(stops.filter(r => r.ll).map(r => ({ ll: r.ll!, color: TIER_UI[r.tier] })));
    let k = 0;
    clearInterval(tourT);
    if (stops.length) {
      const tour = () => {
        if ($("result").hidden) { clearInterval(tourT); return; }
        const r = stops[k++ % stops.length];
        globe.focus(r.country, TIER_UI[r.tier], r.label, r.ll); void globe.flyToName(r.country, undefined, r.ll);
      };
      void globe.loaded.then(tour); tourT = window.setInterval(tour, 2400);
    } else globe.setSpin(true);

    $("tiles").innerHTML = Array.from({ length: ROUNDS }, (_, i) => {
      const r = S.results[i];
      return `<div class="tile ${r ? "t" + r.tier : "miss"}">${r ? TIERS[r.tier][1] : "–"}</div>`;
    }).join("");
    $("rank").textContent = rankFor(tot);
    const st = statsOf(mode);
    $("sPlayed").textContent = String(st.played); $("sStreak").textContent = String(st.streak || 0);
    $("sAvg").textContent = String(st.played ? Math.round(st.sum / st.played) : 0); $("sBest").textContent = String(st.best);
    $("recap").innerHTML = SET.map((p, i) => {
      const r = S.results[i];
      const all = ITEMS[i].map(it => `<span class="c${it.tier}${r && r.label === it.label ? " you" : ""}">${esc(it.label)}</span>`).join("");
      return `<li><details><summary><span><span class="rq">${esc(p.q)}</span><span class="ra ${r ? "c" + r.tier : "muted"}">${r ? esc(r.label) : "No answer"}</span></span>
        <span class="rp ${r ? "c" + r.tier : "muted"}">${r ? "+" + TIERS[r.tier][1] : "+0"}</span></summary><div class="all">${all}</div></details></li>`;
    }).join("");
    clearInterval(clockT);
    if (!practice) { clock(); clockT = window.setInterval(clock, 1000); } else $("next").textContent = "";

    const tiles = [...$("tiles").children] as HTMLElement[];
    if (animate && !reduce) {
      $("final").innerHTML = `0<small> / ${MAX}</small>`; $("rank").style.visibility = "hidden";
      tiles.forEach(t => t.classList.remove("flip"));
      mascot("happy", pick(LINES.done));
      for (const [i, t] of tiles.entries()) { await wait(140); t.classList.add("flip"); const r = S.results[i]; if (r) Sound.rung(r.tier); }
      const t0 = performance.now(), dur = 1200; let lastTick = 0;
      await new Promise<void>(done => {
        const f = (now: number) => {
          const t = Math.min(1, (now - t0) / dur), v = Math.round(tot * easeCubicOut(t));
          $("final").innerHTML = `${v}<small> / ${MAX}</small>`;
          if (now - lastTick > 70 && t < 1) { Sound.count(); lastTick = now; }
          if (t < 1) requestAnimationFrame(f); else done();
        };
        f(t0);
      });
      $("rank").style.visibility = ""; restart($("rank"), "stamp"); Sound.rank();
      if (tot >= 450) {
        const b = $("rank").getBoundingClientRect();
        fx.burst(b.left + b.width / 2, b.top, tot >= 600 ? 200 : 90);
        mascot("wow", tot >= 600 ? "King of the Jungle!" : "Pro explorer!", "thump");
      }
    } else {
      tiles.forEach(t => t.classList.add("flip"));
      $("final").innerHTML = `${tot}<small> / ${MAX}</small>`; mascot(tot >= 450 ? "wow" : "happy");
    }
  }
  function clock(): void {
    const now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), ms = +mid - +now;
    const pad = (n: number) => String(n).padStart(2, "0");
    $("next").textContent = `Next ${mode.intro.eyebrow.toLowerCase()} in ${Math.floor(ms / 36e5)}h ${pad(Math.floor(ms % 36e5 / 6e4))}m ${pad(Math.floor(ms % 6e4 / 1e3))}s`;
  }

  /* ---------- wiring ---------- */
  const go = async (fresh: boolean) => { Sound.unlock(); if (fresh) { loadPractice(); updateHeader(); } await countdown(); startRound(); };
  $("start").addEventListener("click", () => void go(false));
  $("practice").addEventListener("click", () => void go(true));
  $("again").addEventListener("click", () => void go(true));
  form.addEventListener("submit", onSubmit);
  guess.addEventListener("input", onInput);
  guess.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); moveSel(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveSel(-1); }
    else if (e.key === "Enter" && sel >= 0) { e.preventDefault(); choose(sugg[sel]?.n); }
    else if (e.key === "Escape") closeSuggest();
  });
  guess.addEventListener("blur", () => setTimeout(closeSuggest, 150));
  /* Picking a suggestion. On iPhone a tap is touchstart → pointerdown → touchend → (late) click, and the
     input can blur in between. So: keep focus on pointerdown, pick on pointerup over the same row, swallow
     the late synthetic click so it can't land on whatever replaces the list, and keep click as a fallback
     for assistive tech. */
  const rowOf = (e: Event): HTMLElement | null => (e.target as HTMLElement).closest<HTMLElement>("#suggest li");
  let downRow: HTMLElement | null = null, downX = 0, downY = 0, pickedAt = 0;
  suggestEl.addEventListener("pointerdown", e => { downRow = rowOf(e); downX = e.clientX; downY = e.clientY; if (downRow) e.preventDefault(); });
  suggestEl.addEventListener("pointerup", e => {
    const row = rowOf(e), start = downRow; downRow = null;
    if (!row || row !== start || Math.abs(e.clientY - downY) > 12 || Math.abs(e.clientX - downX) > 12) return;
    e.preventDefault(); pickedAt = performance.now(); choose(row.dataset.n);
  });
  suggestEl.addEventListener("pointercancel", () => { downRow = null; });
  suggestEl.addEventListener("touchend", e => { if (rowOf(e)) e.preventDefault(); }, { passive: false });
  suggestEl.addEventListener("click", e => {
    const row = rowOf(e); if (!row) return;
    e.preventDefault(); if (performance.now() - pickedAt < 600) return;
    choose(row.dataset.n);
  });
  // a late synthetic click from that tap must not hit the reveal screen that just replaced the play screen
  document.addEventListener("click", e => { if (performance.now() - pickedAt < 400 && !rowOf(e)) { e.preventDefault(); e.stopPropagation(); } }, true);
  $("skip").addEventListener("click", () => { if (S.phase === "play") void finishRound(null, "Skipped."); });
  $("nextq").addEventListener("click", next);
  document.addEventListener("keydown", e => { if (e.key === "Enter" && S.phase === "reveal" && document.activeElement !== $("nextq")) next(); });
  $("sound").addEventListener("click", () => { $("sound").setAttribute("aria-pressed", String(Sound.toggle())); });
  $("share").addEventListener("click", () => {
    const t = share();
    const fallback = () => { const ta = $<HTMLTextAreaElement>("sharetext"); ta.value = t; ta.hidden = false; ta.select(); $("toast").textContent = "Select and copy the text below."; };
    try { navigator.clipboard.writeText(t).then(() => { $("toast").textContent = "Copied. Paste it anywhere."; }, fallback); } catch { fallback(); }
  });

  for (const btn of $("modes").querySelectorAll<HTMLButtonElement>(".mode")) btn.addEventListener("click", () => switchMode(btn.dataset.mode as ModeId));
  $("moretoday").addEventListener("click", e => { const b = (e.target as HTMLElement).closest<HTMLElement>("[data-go]"); if (b) switchMode(b.dataset.go as ModeId); });
  addEventListener("hashchange", () => { const m = modeFromHash(location.hash); if (m && m !== mode) switchMode(m.id); });

  /* ---------- boot: resume where the player left off ---------- */
  function route(): void {
  updateHeader();
  if (S.phase === "play") {
    if (S.startedAt != null && Date.now() - S.startedAt > SECONDS * 1000) {
      S.results[S.i] = null; S.phase = "reveal"; S.startedAt = null; save();
      void globe.loaded.then(() => renderReveal(S.i, "Time's up.", false));
    } else startRound();
  } else if (S.phase === "reveal") void globe.loaded.then(() => renderReveal(S.i, undefined, false));
  else if (S.phase === "done") void globe.loaded.then(() => renderResult(false));
  else renderIntro();
  }
  for (const m of Object.values(maps)) m.setActive(m === globe);
  loadDaily(); route();

  // handle for automated play-through tests
  (window as unknown as { __georilla: unknown }).__georilla = { get S() { return S; }, get ITEMS() { return ITEMS; }, get SET() { return SET; }, get mode() { return mode.id; }, shareText: share, switchMode };
}
