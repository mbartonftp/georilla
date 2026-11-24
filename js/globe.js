/* Georilla globe: an orthographic globe drawn on canvas, with fly-to, country fills, pins and drag-to-spin. */
const Globe = (() => {
  // world-atlas names that differ from ours
  const ATLAS = {
    "Antigua and Barbuda": "Antigua and Barb.", "Bosnia and Herzegovina": "Bosnia and Herz.", "Cape Verde": "Cabo Verde",
    "Central African Republic": "Central African Rep.", "DR Congo": "Dem. Rep. Congo", "Dominican Republic": "Dominican Rep.",
    "East Timor": "Timor-Leste", "Equatorial Guinea": "Eq. Guinea", "Eswatini": "eSwatini", "Ivory Coast": "Côte d'Ivoire",
    "Marshall Islands": "Marshall Is.", "North Macedonia": "Macedonia", "Saint Kitts and Nevis": "St. Kitts and Nevis",
    "Saint Vincent and the Grenadines": "St. Vin. and Gren.", "São Tomé and Príncipe": "São Tomé and Principe",
    "Solomon Islands": "Solomon Is.", "South Sudan": "S. Sudan", "United States": "United States of America", "Vatican City": "Vatican"
  };
  // where to point for countries whose shape centroid lands somewhere unhelpful (overseas parts, dateline, missing shape)
  const CENTER = {
    "France": [2.5, 46.6], "United States": [-98, 39.5], "Russia": [95, 62], "Canada": [-100, 58], "Netherlands": [5.3, 52.2],
    "Norway": [10, 62], "Denmark": [10, 56], "United Kingdom": [-2, 54], "Portugal": [-8.2, 39.6], "Spain": [-3.7, 40.3],
    "Ecuador": [-78.5, -1.5], "Chile": [-71, -35], "Malaysia": [109, 4], "Indonesia": [118, -2], "Kiribati": [173, 1.4],
    "Fiji": [178, -17.8], "Tuvalu": [179.2, -8.5], "Equatorial Guinea": [10.3, 1.6], "New Zealand": [173, -41], "Japan": [138, 37],
    "Australia": [134, -25], "Greece": [22, 39], "Italy": [12.5, 42.5], "Yemen": [47.5, 15.5], "Seychelles": [55.5, -4.6],
    "Maldives": [73.5, 3.2], "Micronesia": [158.2, 6.9], "Marshall Islands": [171.2, 7.1], "Bahamas": [-77.4, 24.7]
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("globe"), ctx = canvas.getContext("2d");
  const labelEl = document.getElementById("pinlabel");
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.6);
  const path = d3.geoPath(proj, ctx);
  const grat = d3.geoGraticule10();
  let W = 300, R = 140, dpr = 1, zoom = 1;
  let rot = [-15, -25, 0], spin = true, anim = null, last = performance.now();
  let land = null, borders = null, shapes = {}, centers = {};
  let fills = new Map(), focus = null, flash = null, ready = false, dragging = null;

  function resize(){
    W = canvas.clientWidth || 300; dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(W * dpr);
    R = W / 2 - 4; proj.translate([W / 2, W / 2]);
  }
  window.addEventListener("resize", resize);

  async function load(){
    try {
      const [w110, w50] = await Promise.all([fetch("data/world-110m.json").then(r => r.json()), fetch("data/world-50m.json").then(r => r.json())]);
      land = topojson.merge(w110, w110.objects.countries.geometries);
      borders = topojson.mesh(w110, w110.objects.countries, (a, b) => a !== b);
      const byAtlas = {};
      topojson.feature(w50, w50.objects.countries).features.forEach(f => byAtlas[f.properties.name] = f);
      COUNTRIES.forEach(c => {
        const f = byAtlas[ATLAS[c.name] || c.name];
        if (f) shapes[c.name] = f;
        centers[c.name] = CENTER[c.name] || (f ? d3.geoCentroid(f) : null);
      });
      ready = true;
    } catch (e) { console.warn("Map data failed to load", e); }
  }

  const center = name => centers[name] || null;
  const visible = ll => d3.geoDistance(ll, [-rot[0], -rot[1]]) < Math.PI / 2 - 0.08;

  function draw(now){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);
    const c = W / 2, r = R * zoom;
    // atmosphere
    let g = ctx.createRadialGradient(c, c, r * 0.92, c, c, r + 10);
    g.addColorStop(0, "rgba(110,220,255,.45)"); g.addColorStop(1, "rgba(110,220,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, r + 10, 0, Math.PI * 2); ctx.fill();
    // ocean
    g = ctx.createRadialGradient(c - r * .35, c - r * .4, r * .05, c, c, r);
    g.addColorStop(0, "#3aa7c4"); g.addColorStop(.55, "#136079"); g.addColorStop(1, "#0a2f47");
    ctx.fillStyle = g; ctx.beginPath(); path({ type: "Sphere" }); ctx.fill();
    ctx.beginPath(); path(grat); ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = .7; ctx.stroke();
    if (land) {
      ctx.beginPath(); path(land); ctx.fillStyle = "#eadcb0"; ctx.fill();
      // filled countries
      for (const [name, col] of fills) { const f = shapes[name]; if (f) { ctx.beginPath(); path(f); ctx.fillStyle = col; ctx.fill(); } }
      if (flash && now < flash.until) {
        const f = shapes[flash.name], a = 0.5 + 0.5 * Math.sin((now - flash.t0) / 70);
        if (f) { ctx.globalAlpha = .35 + .65 * a; ctx.beginPath(); path(f); ctx.fillStyle = flash.color; ctx.fill(); ctx.globalAlpha = 1; }
      }
      ctx.beginPath(); path(borders); ctx.strokeStyle = "rgba(92,72,30,.4)"; ctx.lineWidth = .6; ctx.stroke();
      // dots so tiny countries still show
      for (const [name, col] of fills) {
        const ll = centers[name]; if (!ll || !visible(ll)) continue;
        const [x, y] = proj(ll); ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = "rgba(10,30,20,.6)"; ctx.stroke();
      }
    }
    // shading for depth
    g = ctx.createRadialGradient(c - r * .4, c - r * .45, r * .2, c, c, r * 1.02);
    g.addColorStop(0, "rgba(255,255,255,.12)"); g.addColorStop(.6, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,10,20,.45)");
    ctx.fillStyle = g; ctx.beginPath(); path({ type: "Sphere" }); ctx.fill();
    ctx.beginPath(); path({ type: "Sphere" }); ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1.2; ctx.stroke();
    // focus pin
    let showLabel = false;
    if (focus && focus.ll && visible(focus.ll)) {
      const [x, y] = proj(focus.ll), t = ((now - focus.t0) % 1400) / 1400;
      ctx.beginPath(); ctx.arc(x, y, 5 + t * 22, 0, Math.PI * 2); ctx.strokeStyle = hexA(focus.color, 1 - t); ctx.lineWidth = 2.5; ctx.stroke();
      const drop = Math.max(0, 1 - (now - focus.t0) / 380), py = y - 16 - drop * 40;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, py + 4); ctx.arc(x, py, 8, Math.PI * .8, Math.PI * .2); ctx.closePath();
      ctx.fillStyle = focus.color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#0b2a20"; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, py, 3, 0, Math.PI * 2); ctx.fillStyle = "#0b2a20"; ctx.fill();
      if (focus.label) { labelEl.style.left = x + "px"; labelEl.style.top = (py - 2) + "px"; showLabel = true; }
    }
    labelEl.hidden = !showLabel;
  }
  function hexA(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, a).toFixed(3)})`; }

  function frame(now){
    const dt = Math.min(60, now - last); last = now;
    if (anim) {
      const t = Math.min(1, (now - anim.t0) / anim.dur), e = d3.easeCubicInOut(t);
      rot = [anim.from[0] + anim.d[0] * e, anim.from[1] + anim.d[1] * e, 0];
      zoom = 1 - anim.dip * Math.sin(Math.PI * t);
      if (t >= 1) { const done = anim.done; anim = null; zoom = 1; done(); }
    } else if (spin && !dragging && !reduce) rot[0] += dt * 0.008;
    proj.rotate(rot).scale(R * zoom);
    draw(now);
    requestAnimationFrame(frame);
  }

  function flyTo(ll, opts = {}){
    if (!ll) return Promise.resolve();
    spin = false;
    const to = [-ll[0], Math.max(-55, Math.min(55, -ll[1]))];
    const from = rot.slice(0, 2);
    const d = [((to[0] - from[0]) % 360 + 540) % 360 - 180, to[1] - from[1]];
    const ang = Math.hypot(d[0], d[1]);
    return new Promise(done => {
      if (reduce) { rot = [to[0], to[1], 0]; return done(); }
      anim = { t0: performance.now(), from, d, dur: opts.dur || Math.min(1500, 500 + ang * 6), dip: ang > 40 ? 0.14 : 0.04, done };
    });
  }

  // drag to spin
  canvas.addEventListener("pointerdown", e => { dragging = { x: e.clientX, y: e.clientY, rot: rot.slice() }; canvas.setPointerCapture(e.pointerId); anim = null; });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    const k = 120 / R;
    rot = [dragging.rot[0] + (e.clientX - dragging.x) * k * 0.5, Math.max(-70, Math.min(70, dragging.rot[1] - (e.clientY - dragging.y) * k * 0.5)), 0];
  });
  const endDrag = () => { dragging = null; };
  canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);

  resize(); requestAnimationFrame(frame);
  const loaded = load();

  return {
    loaded, center, hexA,
    has: name => !!shapes[name] || !!centers[name],
    setSpin(on){ spin = on; },
    setFills(map){ fills = new Map(map); },
    clear(){ fills = new Map(); focus = null; flash = null; },
    focus(name, color, label){ const ll = center(name); focus = ll ? { ll, color, label, t0: performance.now() } : null;
      if (label) { labelEl.textContent = label; labelEl.classList.remove("bad"); } },
    unfocus(){ focus = null; },
    flash(name, color, label){
      const ll = center(name); if (!ll) return Promise.resolve();
      flash = { name, color, t0: performance.now(), until: performance.now() + 1400 };
      focus = { ll, color, label, t0: performance.now() };
      labelEl.textContent = label || name; labelEl.classList.add("bad");
      return flyTo(ll, { dur: 650 });
    },
    flyToName(name, opts){ return flyTo(center(name), opts); },
    // fly to the middle of a group of countries, so a whole answer set comes into view
    flyToMany(names, opts){
      let x = 0, y = 0, z = 0, n = 0;
      names.forEach(nm => { const ll = center(nm); if (!ll) return; const l = ll[0] * Math.PI / 180, p = ll[1] * Math.PI / 180;
        x += Math.cos(p) * Math.cos(l); y += Math.cos(p) * Math.sin(l); z += Math.sin(p); n++; });
      if (!n || Math.hypot(x, y, z) / n < 0.25) { spin = true; return Promise.resolve(); } // spread round the world: just spin
      return flyTo([Math.atan2(y, x) * 180 / Math.PI, Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI], opts);
    },
    resize
  };
})();
