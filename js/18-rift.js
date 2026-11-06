/* ==========================================================
   18-rift.js — THE RIFT (3.79): the Time Rift's sky, and its round room
   Part of 博刻MON. Loaded as a classic script (after 17-region6.js, before
   11-app.js): everything shares one global scope.

   The designer (3.79): "Please help me to create the backdrop and map for
   Region 6. The tear should lead up into a round room where Selene and
   Vesper dwell along with a lion I will upload named Lucesco…" — the whole
   request is in CHANGES.md under 3.79.

   THE SKY (riftSky…)
   One drawing, on a canvas, for the region's pages and for the floor of its
   room. Every star turns round one centre, off the screen, very slowly
   (RIFT_SKY.turn: a turn in about 70 minutes) — a sky turning overhead.
   Faint still stars; twinkling ones, a few big and coloured; twelve
   constellations, joined by faint lines; a galaxy's stream (and a fainter
   one across it) with dark lanes in it; far galaxies and nebulae. Now and
   then a star sparkles, and a comet crosses quickly, the other way.
   · On a page (riftSkyLive, from setScreenBg): a canvas behind the whole
     screen, with the dark theme (body.r6-sky) — wherever the region's drawn
     sky was the backdrop: its hub, Challenge, the future, the tear, Selene's
     shop, Recover, her scene, and the room's own page. A picture of its own
     (assets/bg/region6.png …) still wins; battles keep the still sky.
   · On the map: a second canvas, behind the room, its stars fixed to the
     floor, so they pass under you as you walk (the camera's place is read
     every frame).
   The soft parts (streams, galaxies, nebulae) are painted into a small
   picture now and then and turned with the sky; the stars are drawn fresh
   every frame — 30 a second (60 while the map's camera moves, 12 for the
   page behind the map).

   THE ROUND ROOM ('r6_rift' — a walkable deck, 13-walkmap.js)
   The tear leads up into it: a circle of sky to walk on, its edge fading
   darker (never black). Coming up out of the tear (the vault's "Enter the
   space-time tear", or the hub's Explore), you stand just above it.
   · SOUTH — the tear: its page (Challenge the past), Back returns here.
   · EAST — the spacetime distortion: Challenge the future.
   · WEST — the portals to the past: the ancient one and two smaller ones,
     asleep for now. Lucesco, the fire-and-steel lion, keeps watch by them
     (assets/mon/lucesco_front.png when it is uploaded; 🦁 until then).
   · NORTH — Vesper's station, curved along the wall, where he speaks with
     the rest of the Cosmic Council (he flies up to it when you ask).
   · Selene walks between the tear and the ancient portal, resting at each
     end; Vesper flies at her shoulder. Beside her: Talk, and her Shop. She
     waits while you are beside her.
   · The first time in, she shows you round (r6().roomSeen).
   ========================================================== */

/* ============================================================
   THE SKY
   ============================================================ */
const RIFT_SKY = {
  turn: -0.0015,           // radians a second, the whole sky round its one centre: a turn in about 70 minutes
  fps: 30, moveFps: 60, behindFps: 12,
  dust: 5.4e-4,            // faint, still stars, per square pixel
  stars: 1.35e-4,          // twinkling ones, per square pixel…
  bright: 0.13,            // …this share of them big, glowing and coloured
  stream: 0.32,            // extra faint stars packed along the galaxy's stream, as a share of `dust`
  comet: [6500, 15000],    // ms between comets
  firstComet: [2500, 5500],
  sparkle: [1300, 3300],   // ms between sparkles
  soft: 0.5,               // the soft picture's resolution: pixels per CSS pixel
  buckets: 256,            // stars filed by angle, so a frame only looks at those in view
};
const RIFT_TAU = Math.PI * 2;
const RIFT_CALM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const riftRr = ([a, b])=> a + Math.random() * (b - a);
const riftWrap = a=> a - RIFT_TAU * Math.floor((a + Math.PI) / RIFT_TAU);     // into −π … π
/* The whole sky's turn now — from the clock, so every page and visit agrees. */
function riftSkyAngle(){ return RIFT_CALM ? 0.6 : (Date.now() / 1000 * RIFT_SKY.turn) % RIFT_TAU; }

/* Twelve constellations, as star charts draw them (simplified): points in a
   unit box, the lines between them, and a colour for a star that has one
   (b blue-white, y yellow, o orange, r red). */
const RIFT_CONSTELLATIONS = [
  { name:'The Plough', p:[[0,.2],[.17,.14],[.31,.16],[.45,.25],[.52,.47],[.77,.5],[.82,.24]], l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]] },
  { name:'Orion', p:[[.2,.12],[.62,.16],[.36,.47],[.44,.45],[.52,.43],[.24,.86],[.7,.82],[.42,0]],
    l:[[7,0],[7,1],[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]], c:{ 0:'o', 6:'b' } },
  { name:'Cassiopeia', p:[[0,.3],[.22,.62],[.43,.36],[.63,.66],[.86,.26]], l:[[0,1],[1,2],[2,3],[3,4]] },
  { name:'Leo', p:[[.28,.78],[.3,.55],[.34,.4],[.27,.26],[.36,.12],[.48,.1],[.72,.5],[.95,.66],[.74,.72]],
    l:[[0,1],[1,2],[2,3],[3,4],[4,5],[2,6],[6,7],[7,8],[8,0]], c:{ 0:'b' } },
  { name:'Cygnus', p:[[.5,0],[.5,.38],[.5,.68],[.5,1],[.14,.3],[.86,.46]], l:[[0,1],[1,2],[2,3],[4,1],[1,5]], c:{ 3:'y' } },
  { name:'The Southern Cross', p:[[.5,0],[.5,1],[.16,.42],[.84,.52],[.66,.7]], l:[[0,1],[2,3]], c:{ 0:'r', 1:'b' } },
  { name:'Scorpius', p:[[.04,.1],[.12,.04],[.17,.16],[.08,.25],[.3,.32],[.38,.48],[.44,.62],[.48,.77],[.6,.9],[.75,.94],[.87,.84],[.85,.72],[.79,.66]],
    l:[[0,2],[1,2],[3,2],[2,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12]], c:{ 4:'r' } },
  { name:'Lyra', p:[[.3,0],[.4,.3],[.62,.34],[.56,.76],[.33,.72]], l:[[0,1],[1,2],[2,3],[3,4],[4,1]], c:{ 0:'b' } },
  { name:'Pegasus', p:[[.22,.12],[.78,.08],[.82,.62],[.24,.58],[0,.78],[-.2,.9]], l:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5]] },
  { name:'Gemini', p:[[.2,0],[.52,.06],[.24,.38],[.56,.44],[.3,.82],[.62,.88],[.12,.6],[.72,.66]],
    l:[[0,2],[2,4],[1,3],[3,5],[2,3],[4,6],[5,7]], c:{ 1:'o' } },
  { name:'Taurus', p:[[.4,.5],[.3,.42],[.22,.3],[.48,.44],[.58,.32],[.02,.05],[.86,0],[.62,.72]],
    l:[[0,1],[1,2],[0,3],[3,4],[2,5],[4,6],[0,7]], c:{ 0:'o' } },
  { name:'The Little Dipper', p:[[0,.1],[.18,.18],[.32,.28],[.42,.42],[.66,.4],[.7,.6],[.46,.62]],
    l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]], c:{ 0:'y' } },
];

/* The pictures every star is drawn with, made once: a glowing one for the
   big stars (a hard core and a soft halo), a tight one for the rest, in six
   colours; and soft round clouds for the streams and nebulae. */
let _riftSprites = null;
function riftSprites(){
  if(_riftSprites) return _riftSprites;
  const mk = (n, paint)=>{ const c = document.createElement('canvas'); c.width = c.height = n; paint(c.getContext('2d'), n); return c; };
  const radial = (stops)=> (x, n)=>{
    const h = n / 2, g = x.createRadialGradient(h, h, 0, h, h, h);
    stops.forEach(([o, c])=> g.addColorStop(o, c));
    x.fillStyle = g; x.fillRect(0, 0, n, n);
  };
  const TINTS = [ [255,255,255, 205,220,255], [242,246,255, 150,185,255], [255,248,232, 255,214,150],
                  [255,238,220, 255,166,106], [255,232,232, 255,128,118], [236,255,253, 128,236,255] ];
  const glow = TINTS.map(([r, g, b, hr, hg, hb])=> mk(64, radial([
    [0, `rgba(${r},${g},${b},1)`], [0.09, `rgba(${r},${g},${b},0.95)`], [0.18, `rgba(${hr},${hg},${hb},0.5)`],
    [0.4, `rgba(${hr},${hg},${hb},0.13)`], [1, `rgba(${hr},${hg},${hb},0)`]])));
  const tight = TINTS.map(([r, g, b, hr, hg, hb])=> mk(16, radial([
    [0, `rgba(${r},${g},${b},1)`], [0.4, `rgba(${hr},${hg},${hb},0.7)`], [1, `rgba(${hr},${hg},${hb},0)`]])));
  const SOFT = { core:'201,216,255', haze:'127,120,255', teal:'79,211,224', pink:'255,127,200', warm:'255,214,160', deep:'58,92,255', violet:'170,110,255' };
  const soft = {};
  Object.entries(SOFT).forEach(([k, c])=> soft[k] = mk(128, radial([[0, `rgba(${c},1)`], [0.3, `rgba(${c},0.62)`], [0.62, `rgba(${c},0.2)`], [1, `rgba(${c},0)`]])));
  return (_riftSprites = { glow, tight, soft });
}

/* ---------- a sky's stars: made once for a size, and kept ----------
   o: cx, cy — the centre it turns round (in the view's units: CSS pixels on
   a page, the room's own pixels on the map); D — from there to the middle of
   the view; half — half the view's diagonal; rIn, rOut — the ring holding
   every star the view could ever see; seed. Everything is stored relative
   to the centre, filed by angle. */
const _riftFields = {};
function riftFieldFor(key, make){ return _riftFields[key] || (_riftFields[key] = make()); }
function riftSkyField(o){
  const rnd = seededRandom(o.seed);
  const gauss = ()=>{ let u = 0; while(u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(RIFT_TAU * rnd()); };
  const area = Math.PI * (o.rOut * o.rOut - o.rIn * o.rIn);
  const polar = ()=>{ const r = Math.sqrt(o.rIn * o.rIn + rnd() * (o.rOut * o.rOut - o.rIn * o.rIn)), a = rnd() * RIFT_TAU; return [r * Math.cos(a), r * Math.sin(a)]; };
  const inRing = (x, y)=>{ const r = Math.hypot(x, y); return r >= o.rIn && r <= o.rOut; };
  const p1 = rnd() * RIFT_TAU, p2 = rnd() * RIFT_TAU, p3 = rnd() * RIFT_TAU;
  /* The stream circles the centre, wandering in and out, so some of it is
     always in view as the sky turns. */
  const bandW0 = o.half * 0.42;
  const bandR = a=> o.D + o.half * (0.3 * Math.sin(2 * a + p1) + 0.1 * Math.sin(5 * a + p2));
  const bandW = a=> bandW0 * (0.75 + 0.35 * (0.5 + 0.5 * Math.sin(3 * a + p3)));
  const onBand = (a, across)=>{ const r = bandR(a) + across; return [r * Math.cos(a), r * Math.sin(a)]; };

  /* faint, still stars: everywhere, and packed along the stream */
  const dust = [];
  const nDust = Math.round(area * RIFT_SKY.dust);
  for(let i = 0; i < nDust; i++){ const [x, y] = polar(); dust.push([x, y, 0.5 + rnd() * 0.55, 0.14 + rnd() * 0.36]); }
  const nStream = Math.round(nDust * RIFT_SKY.stream);
  for(let i = 0; i < nStream; i++){
    const a = rnd() * RIFT_TAU, [x, y] = onBand(a, gauss() * bandW(a) * 0.28);
    if(inRing(x, y)) dust.push([x, y, 0.45 + rnd() * 0.45, 0.12 + rnd() * 0.3]);
  }
  /* twinkling stars: [x, y, radius, alpha, twinkle depth, speed, phase, colour, glows, constellation] */
  const stars = [];
  const tintOf = ()=>{ const q = rnd(); return q < 0.5 ? 0 : q < 0.72 ? 1 : q < 0.84 ? 2 : q < 0.92 ? 3 : q < 0.96 ? 4 : 5; };
  const nStars = Math.round(area * RIFT_SKY.stars);
  for(let i = 0; i < nStars; i++){
    const [x, y] = polar(), big = rnd() < RIFT_SKY.bright;
    stars.push([x, y, big ? 1.25 + rnd() * 0.95 : 0.55 + rnd() * 0.65, big ? 0.75 + rnd() * 0.25 : 0.45 + rnd() * 0.45,
      big ? 0.12 + rnd() * 0.2 : 0.22 + rnd() * 0.3, 0.6 + rnd() * 1.8, rnd() * RIFT_TAU,
      big ? tintOf() : (rnd() < 0.7 ? 0 : 1), big ? 1 : 0, -1]);
  }
  /* the constellations, spaced round the ring, near its middle */
  const TINT = { b:1, y:2, o:3, r:4 };
  const conLines = [];
  RIFT_CONSTELLATIONS.forEach((C, k)=>{
    const a = (k + 0.5 + (rnd() - 0.5) * 0.4) / RIFT_CONSTELLATIONS.length * RIFT_TAU;
    const r = o.D + (rnd() - 0.5) * o.half * 0.9;
    const s = (0.26 + rnd() * 0.1) * Math.min(o.half, 760), rot = rnd() * RIFT_TAU;
    const cx = r * Math.cos(a), cy = r * Math.sin(a), c = Math.cos(rot), sn = Math.sin(rot);
    const first = stars.length;
    C.p.forEach(([u, v], j)=>{
      const du = (u - 0.5) * s, dv = (v - 0.5) * s, t = (C.c || {})[j];
      stars.push([cx + du * c - dv * sn, cy + du * sn + dv * c, 1.45 + rnd() * 0.85, 0.86 + rnd() * 0.14,
        0.1 + rnd() * 0.15, 0.5 + rnd() * 1.2, rnd() * RIFT_TAU, t ? TINT[t] : (rnd() < 0.6 ? 0 : 1), 1, k]);
    });
    conLines.push({ name:C.name, ph:rnd() * RIFT_TAU, l:C.l.map(([i, j])=> [first + i, first + j]) });
  });
  /* the soft parts: the stream's light, then its dark lanes (they take light
     away, so they are drawn after); a fainter stream straight across the
     ring; far galaxies; nebulae */
  const soft = [], cuts = [];
  const step = bandW0 * 0.24;
  for(let a = 0; a < RIFT_TAU; a += step / o.D){
    const w = bandW(a), tan = a + Math.PI / 2, q = rnd();
    const [x, y] = onBand(a, gauss() * w * 0.2);
    soft.push({ x, y, rx:w * (0.45 + rnd() * 0.45), ry:w * (0.17 + rnd() * 0.2), rot:tan + (rnd() - 0.5) * 0.3,
      col:q < 0.55 ? 'core' : q < 0.88 ? 'haze' : q < 0.95 ? 'teal' : 'pink', a:0.065 + rnd() * 0.075 });
    if(rnd() < 0.3){
      const [x2, y2] = onBand(a, gauss() * w * 0.12);
      soft.push({ x:x2, y:y2, rx:w * (0.12 + rnd() * 0.12), ry:w * (0.08 + rnd() * 0.08), rot:tan, col:rnd() < 0.7 ? 'core' : 'warm', a:0.12 + rnd() * 0.1 });
    }
    if(rnd() < 0.55){
      const [x3, y3] = onBand(a, (rnd() - 0.4) * w * 0.25);
      cuts.push({ x:x3, y:y3, rx:w * (0.28 + rnd() * 0.32), ry:w * (0.035 + rnd() * 0.05), rot:tan + (rnd() - 0.5) * 0.5, col:'core', a:0.35 + rnd() * 0.3 });
    }
  }
  const ca = rnd() * RIFT_TAU, cd = o.D * 0.82, dirA = ca + Math.PI / 2 + 0.6;
  const c0x = cd * Math.cos(ca), c0y = cd * Math.sin(ca), ux = Math.cos(dirA), uy = Math.sin(dirA);
  for(let u = -o.rOut; u <= o.rOut; u += step * 1.3){
    const w = bandW0 * 0.6, j = gauss() * w * 0.2;
    const x = c0x + ux * u - uy * j, y = c0y + uy * u + ux * j;
    if(!inRing(x, y)) continue;
    soft.push({ x, y, rx:w * (0.5 + rnd() * 0.4), ry:w * (0.15 + rnd() * 0.15), rot:dirA + (rnd() - 0.5) * 0.2, col:rnd() < 0.6 ? 'core' : 'violet', a:0.03 + rnd() * 0.035 });
  }
  const nObj = 14;
  for(let k = 0; k < nObj; k++){
    const a = (k + rnd() * 0.8) / nObj * RIFT_TAU, r = o.D + (rnd() - 0.5) * o.half * 1.5;
    const x = r * Math.cos(a), y = r * Math.sin(a);
    if(k % 2 === 0){                                       // a far galaxy: a tilted disc, a warm core, two faint arms
      const s = o.half * (0.05 + rnd() * 0.05), tilt = rnd() * RIFT_TAU, flat = 0.32 + rnd() * 0.25;
      soft.push({ x, y, rx:s, ry:s * flat, rot:tilt, col:'core', a:0.22 });
      soft.push({ x, y, rx:s * 0.25, ry:s * 0.18, rot:tilt, col:'warm', a:0.55 });
      for(let arm = 0; arm < 2; arm++) for(let i = 1; i <= 5; i++){
        const t = i / 5, ang = arm * Math.PI + t * 2.4, rr = s * (0.3 + 0.75 * t);
        const lx = rr * Math.cos(ang), ly = rr * Math.sin(ang) * flat;
        soft.push({ x:x + lx * Math.cos(tilt) - ly * Math.sin(tilt), y:y + lx * Math.sin(tilt) + ly * Math.cos(tilt),
          rx:s * 0.22, ry:s * 0.12, rot:tilt + ang, col:'haze', a:0.1 });
      }
    } else {                                               // a nebula: a few big coloured clouds together
      const s = o.half * (0.14 + rnd() * 0.12), cols = ['pink', 'teal', 'violet', 'deep'];
      const n = 4 + Math.floor(rnd() * 3);
      for(let i = 0; i < n; i++){
        soft.push({ x:x + gauss() * s * 0.45, y:y + gauss() * s * 0.45, rx:s * (0.4 + rnd() * 0.5), ry:s * (0.25 + rnd() * 0.35),
          rot:rnd() * RIFT_TAU, col:cols[Math.floor(rnd() * cols.length)], a:0.04 + rnd() * 0.05 });
      }
    }
  }
  /* file the stars by angle; renumber the constellations' lines to match */
  const file = (list, fields)=>{
    const NB = RIFT_SKY.buckets, n = list.length;
    const ang = list.map(s=> Math.atan2(s[1], s[0]));
    const order = list.map((_, i)=> i).sort((i, j)=> ang[i] - ang[j]);
    const cols = fields.map(()=> new Float32Array(n)), where = new Int32Array(n), start = new Int32Array(NB + 1);
    order.forEach((src, k)=>{ fields.forEach((_, f)=> cols[f][k] = list[src][f]); where[src] = k; });
    let k = 0;
    for(let b = 0; b <= NB; b++){
      while(k < n && Math.min(NB - 1, Math.floor((ang[order[k]] + Math.PI) / RIFT_TAU * NB)) < b) k++;
      start[b] = b === NB ? n : k;
    }
    const out = { n, start, where };
    fields.forEach((f, i)=> out[f] = cols[i]);
    return out;
  };
  const D = file(dust, ['x', 'y', 's', 'a']);
  const S = file(stars, ['x', 'y', 'r', 'a', 'amp', 'spd', 'ph', 'tint', 'glow', 'con']);
  const cons = conLines.map(c=> ({ name:c.name, ph:c.ph, l:c.l.map(([i, j])=> [S.where[i], S.where[j]]) }));
  return { cx:o.cx, cy:o.cy, D:o.D, half:o.half, rIn:o.rIn, rOut:o.rOut, dust:D, stars:S, cons, soft, cuts };
}
/* A page's sky: the centre below and to the left, well off the screen. Its
   size is rounded up (200 px), so the toolbar coming and going does not
   make a new sky. */
function riftPageField(W, H){
  const Wq = Math.ceil(W / 200) * 200, Hq = Math.ceil(H / 200) * 200;
  return riftFieldFor(`page:${Wq}x${Hq}`, ()=>{
    const cx = -0.42 * Wq, cy = 1.3 * Hq, D = Math.hypot(Wq / 2 - cx, Hq / 2 - cy), half = Math.hypot(Wq, Hq) / 2;
    return riftSkyField({ cx, cy, D, half, rIn:Math.max(0, D - half - 60), rOut:D + half + 60, seed:6061 });
  });
}
/* The room's sky: the centre up and to the right of the room. */
function riftMapField(W, H){
  return riftFieldFor(`map:${Math.round(W)}x${Math.round(H)}`, ()=>{
    const half = Math.hypot(W, H) / 2, D = half * 1.6, ang = -0.9;
    const cx = W / 2 + D * Math.cos(ang), cy = H / 2 + D * Math.sin(ang);
    return riftSkyField({ cx, cy, D, half, rIn:Math.max(0, D - half - 60), rOut:D + half + 60, seed:6062 });
  });
}

/* ---------- one sky on one canvas ---------- */
function riftSkyNew(cv, mode, o){
  const now = performance.now();
  return { cv, ctx:cv.getContext('2d'), mode, o:o || {}, last:0, gen:0, f:null, fkey:'', soft:null,
           visG:[], visN:[], sparks:[], comets:[], camKey:'',
           nextSpark:now + riftRr(RIFT_SKY.sparkle), nextComet:now + riftRr(RIFT_SKY.firstComet) };
}
/* The room's camera: the world's transform as it is this moment — mid-pan
   too — read back from the page. */
function riftCam(world){
  const t = getComputedStyle(world).transform;
  if(!t || t === 'none') return { s:1, e:0, f:0, key:'none' };
  let s = 1, e = 0, f = 0;
  try { const m = new DOMMatrixReadOnly(t); s = m.a; e = m.e; f = m.f; }
  catch(err){
    const v = (t.match(/\(([^)]+)\)/) || [0, ''])[1].split(',').map(Number);
    if(v.length === 16){ s = v[0]; e = v[12]; f = v[13]; } else if(v.length >= 6){ s = v[0]; e = v[4]; f = v[5]; }
  }
  return { s:s || 1, e, f, key:t };
}
/* What a sky shows now: its size, how its units map to the canvas, and the
   rectangle of sky in view. */
function riftSkyView(sky){
  const map = sky.mode === 'map';
  const dpr = Math.min(map ? 2 : 1.5, window.devicePixelRatio || 1);
  if(!map){
    const W = sky.cv.clientWidth || window.innerWidth, H = sky.cv.clientHeight || window.innerHeight;
    if(!W || !H) return null;
    const f = riftPageField(W, H);
    if(f !== sky.f){ sky.f = f; sky.gen++; sky.soft = null; sky.sparks = []; }
    return { W, H, dpr, A:dpr, bx:0, by:0, rect:{ x0:0, y0:0, x1:W, y1:H } };
  }
  const st = sky.o.stage, wd = sky.o.world, d = sky.o.d;
  if(!st || !wd || !d) return null;
  const W = st.clientWidth, H = st.clientHeight;
  if(!W || !H) return null;
  const T = WALK_T, MW = d.rows[0].length * T, MH = d.rows.length * T;
  const f = riftMapField(MW, MH);
  if(f !== sky.f){ sky.f = f; sky.gen++; sky.soft = null; sky.sparks = []; sky.softRect = { x0:-160, y0:-160, x1:MW + 160, y1:MH + 160 }; }
  const m = sky.cam || riftCam(wd);
  return { W, H, dpr, A:dpr * m.s, bx:dpr * (W / 2 + m.e), by:dpr * (H / 2 + m.f),
           rect:{ x0:(-W / 2 - m.e) / m.s, x1:(W / 2 - m.e) / m.s, y0:(-H / 2 - m.f) / m.s, y1:(H / 2 - m.f) / m.s } };
}
/* Which of a sky's filed stars could be in view: the run of angles (in the
   sky's own, turning frame) and distances the rectangle covers. */
function riftWindow(f, th, rc, pad){
  const x0 = rc.x0 - pad, y0 = rc.y0 - pad, x1 = rc.x1 + pad, y1 = rc.y1 + pad;
  const nx = Math.max(x0, Math.min(x1, f.cx)), ny = Math.max(y0, Math.min(y1, f.cy));
  const rMin = Math.hypot(nx - f.cx, ny - f.cy);
  let rMax = 0, lo = 0, hi = 0;
  const a0 = Math.atan2((y0 + y1) / 2 - f.cy, (x0 + x1) / 2 - f.cx);
  [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y])=>{
    const dx = x - f.cx, dy = y - f.cy, d = riftWrap(Math.atan2(dy, dx) - a0);
    lo = Math.min(lo, d); hi = Math.max(hi, d); rMax = Math.max(rMax, Math.hypot(dx, dy));
  });
  if(rMin === 0) return { all:true, rMin:0, rMax };       // the centre in view: never, but be safe
  return { a:a0 + lo - th, b:a0 + hi - th, rMin, rMax };
}
/* The filed stars in a window, as runs of indices. */
function riftRuns(F, w){
  const NB = RIFT_SKY.buckets;
  if(w.all) return [[0, F.n]];
  const a = riftWrap(w.a), span = w.b - w.a;
  const b0 = Math.min(NB - 1, Math.floor((a + Math.PI) / RIFT_TAU * NB));
  const nb = Math.min(NB, Math.ceil(span / RIFT_TAU * NB) + 2);
  if(b0 + nb <= NB) return [[F.start[b0], F.start[b0 + nb]]];
  return [[F.start[b0], F.n], [0, F.start[b0 + nb - NB]]];
}
/* The soft picture: painted at angle th over a rectangle a little bigger
   than the view (on the map, the whole room), and turned with the sky until
   the view would see past its edge. */
function riftSoftPaint(sky, th, rc){
  const f = sky.f, res = RIFT_SKY.soft;
  const mg = Math.max(220, 0.4 * Math.max(rc.x1 - rc.x0, rc.y1 - rc.y0));
  const Q = sky.softRect || { x0:rc.x0 - mg, y0:rc.y0 - mg, x1:rc.x1 + mg, y1:rc.y1 + mg };
  const w = Math.max(1, Math.ceil((Q.x1 - Q.x0) * res)), h = Math.max(1, Math.ceil((Q.y1 - Q.y0) * res));
  const cv = (sky.soft && sky.soft.cv) || document.createElement('canvas');
  if(cv.width !== w) cv.width = w;
  if(cv.height !== h) cv.height = h;
  const x = cv.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, w, h);
  const c = Math.cos(th), s = Math.sin(th), sp = riftSprites().soft;
  const put = b=>{
    const px = f.cx + b.x * c - b.y * s, py = f.cy + b.x * s + b.y * c, ext = Math.max(b.rx, b.ry);
    if(px + ext < Q.x0 || px - ext > Q.x1 || py + ext < Q.y0 || py - ext > Q.y1) return;
    const r = b.rot + th, cr = Math.cos(r), sr = Math.sin(r);
    x.globalAlpha = b.a;
    x.setTransform(cr * b.rx * res, sr * b.rx * res, -sr * b.ry * res, cr * b.ry * res, (px - Q.x0) * res, (py - Q.y0) * res);
    x.drawImage(sp[b.col], -1, -1, 2, 2);
  };
  x.globalCompositeOperation = 'lighter';
  f.soft.forEach(put);
  x.globalCompositeOperation = 'destination-out';
  f.cuts.forEach(put);
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = 1;
  x.setTransform(1, 0, 0, 1, 0, 0);
  return { cv, th, res, x0:Q.x0, y0:Q.y0, x1:Q.x1, y1:Q.y1, gen:sky.gen };
}
function riftSoftCovers(sp, f, th, rc){
  const d = -(th - sp.th), c = Math.cos(d), s = Math.sin(d);
  return [[rc.x0, rc.y0], [rc.x1, rc.y0], [rc.x0, rc.y1], [rc.x1, rc.y1]].every(([x, y])=>{
    const dx = x - f.cx, dy = y - f.cy, qx = f.cx + dx * c - dy * s, qy = f.cy + dx * s + dy * c;
    return qx >= sp.x0 + 2 && qx <= sp.x1 - 2 && qy >= sp.y0 + 2 && qy <= sp.y1 - 2;
  });
}

/* ---------- one frame ---------- */
function riftSkyDraw(sky, now){
  const v = riftSkyView(sky);
  if(!v) return;
  const cv = sky.cv, ctx = sky.ctx, f = sky.f, map = sky.mode === 'map';
  const cw = Math.round(v.W * v.dpr), ch = Math.round(v.H * v.dpr);
  if(cv.width !== cw || cv.height !== ch){ cv.width = cw; cv.height = ch; sky.base = null; }
  const th = riftSkyAngle(), t = now / 1000, c = Math.cos(th), s = Math.sin(th), px = v.dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  /* deep blue to black: a page's glow sits high in the middle; the room's
     floor is one deep colour (its edge is the room's own, 13-walkmap's deck) */
  if(!sky.base){
    if(map) sky.base = '#060c24';
    else {
      const g = ctx.createRadialGradient(cw * 0.5, ch * 0.22, 0, cw * 0.5, ch * 0.22, Math.max(cw, ch) * 0.95);
      g.addColorStop(0, '#0f1d52'); g.addColorStop(0.42, '#081034'); g.addColorStop(0.75, '#040819'); g.addColorStop(1, '#020308');
      sky.base = g;
    }
  }
  ctx.fillStyle = sky.base;
  ctx.fillRect(0, 0, cw, ch);
  /* the soft picture, turned with the sky */
  if(!sky.soft || sky.soft.gen !== sky.gen || !riftSoftCovers(sky.soft, f, th, v.rect)) sky.soft = riftSoftPaint(sky, th, v.rect);
  const sp = sky.soft, dth = th - sp.th, dc = Math.cos(dth), ds = Math.sin(dth), k = v.A / sp.res;
  const ox = sp.x0 - f.cx, oy = sp.y0 - f.cy;
  ctx.globalCompositeOperation = 'lighter';
  ctx.setTransform(k * dc, k * ds, -k * ds, k * dc, v.A * (f.cx + dc * ox - ds * oy) + v.bx, v.A * (f.cy + ds * ox + dc * oy) + v.by);
  ctx.drawImage(sp.cv, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  /* faint stars */
  const win = riftWindow(f, th, v.rect, 30);
  const D = f.dust;
  ctx.fillStyle = '#e9eeff';
  riftRuns(D, win).forEach(([i0, i1])=>{
    for(let i = i0; i < i1; i++){
      const x = D.x[i], y = D.y[i];
      const X = v.A * (f.cx + x * c - y * s) + v.bx, Y = v.A * (f.cy + x * s + y * c) + v.by;
      if(X < -4 || Y < -4 || X > cw + 4 || Y > ch + 4) continue;
      const z = Math.max(1, D.s[i] * px);
      ctx.globalAlpha = D.a[i];
      ctx.fillRect(X - z / 2, Y - z / 2, z, z);
    }
  });
  /* twinkling stars */
  const S = f.stars, spr = riftSprites(), calm = RIFT_CALM ? 0.5 : 1;
  sky.visG.length = 0; sky.visN.length = 0;
  riftRuns(S, win).forEach(([i0, i1])=>{
    for(let i = i0; i < i1; i++){
      const x = S.x[i], y = S.y[i];
      const X = v.A * (f.cx + x * c - y * s) + v.bx, Y = v.A * (f.cy + x * s + y * c) + v.by;
      if(X < -24 || Y < -24 || X > cw + 24 || Y > ch + 24) continue;
      const tw = 1 - S.amp[i] * calm * (0.5 + 0.5 * Math.sin(t * S.spd[i] + S.ph[i]));
      ctx.globalAlpha = Math.max(0, Math.min(1, S.a[i] * tw));
      if(S.glow[i]){
        const z = S.r[i] * px * 11;
        ctx.drawImage(spr.glow[S.tint[i]], X - z / 2, Y - z / 2, z, z);
        sky.visG.push(i);
      } else {
        const z = Math.max(1.6, S.r[i] * px * 2.8);
        ctx.drawImage(spr.tight[S.tint[i]], X - z / 2, Y - z / 2, z, z);
        sky.visN.push(i);
      }
    }
  });
  /* the constellations' lines, breathing slowly; a little gap at each star */
  const at = i=> [v.A * (f.cx + S.x[i] * c - S.y[i] * s) + v.bx, v.A * (f.cy + S.x[i] * s + S.y[i] * c) + v.by];
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgb(170,198,255)';
  ctx.lineWidth = Math.max(1, 0.9 * px);
  ctx.lineCap = 'round';
  f.cons.forEach(cn=>{
    ctx.globalAlpha = 0.17 + 0.07 * Math.sin(t * 0.35 + cn.ph);
    ctx.beginPath();
    let any = false;
    cn.l.forEach(([i, j])=>{
      const [ax, ay] = at(i), [bx, by] = at(j);
      if((ax < -40 && bx < -40) || (ay < -40 && by < -40) || (ax > cw + 40 && bx > cw + 40) || (ay > ch + 40 && by > ch + 40)) return;
      const L = Math.hypot(bx - ax, by - ay), gap = 5 * px;
      if(L < gap * 2.4) return;
      const ux = (bx - ax) / L, uy = (by - ay) / L;
      ctx.moveTo(ax + ux * gap, ay + uy * gap); ctx.lineTo(bx - ux * gap, by - uy * gap);
      any = true;
    });
    if(any) ctx.stroke();
  });
  /* sparkles: now and then a star flares, with a cross of light */
  ctx.globalCompositeOperation = 'lighter';
  if(now >= sky.nextSpark){
    sky.nextSpark = now + riftRr(RIFT_SKY.sparkle) * (RIFT_CALM ? 2.5 : 1);
    const pool = (Math.random() < 0.65 && sky.visG.length) ? sky.visG : (sky.visN.length ? sky.visN : sky.visG);
    if(pool.length) sky.sparks.push({ i:pool[Math.floor(Math.random() * pool.length)], t0:now, dur:1100 + Math.random() * 600 });
  }
  sky.sparks = sky.sparks.filter(sk=>{
    const p = (now - sk.t0) / sk.dur;
    if(p >= 1) return false;
    const amp = Math.pow(Math.sin(Math.PI * p), 1.6), [X, Y] = at(sk.i), r = Math.max(1, S.r[sk.i] || 1);
    if(!isFinite(X) || !isFinite(Y)) return false;
    const z = r * px * 11 * (1 + 1.4 * amp);
    ctx.globalAlpha = amp;
    ctx.drawImage(spr.glow[S.tint[sk.i]], X - z / 2, Y - z / 2, z, z);
    const L = (9 + 7 * r) * px * (0.4 + 0.9 * amp);
    const spike = (dx, dy, len, a)=>{
      const g = ctx.createLinearGradient(X - dx * len, Y - dy * len, X + dx * len, Y + dy * len);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = Math.max(1, px * 0.9);
      ctx.beginPath(); ctx.moveTo(X - dx * len, Y - dy * len); ctx.lineTo(X + dx * len, Y + dy * len); ctx.stroke();
    };
    ctx.globalAlpha = 1;
    spike(1, 0, L, 0.9 * amp); spike(0, 1, L, 0.9 * amp);
    spike(0.7071, 0.7071, L * 0.45, 0.5 * amp); spike(0.7071, -0.7071, L * 0.45, 0.5 * amp);
    return true;
  });
  /* comets: quick, and across the sky's own turning (on the page behind the
     room, none — the room has its own) */
  const comets = !RIFT_CALM && !(sky.mode === 'page' && sky.behind);
  if(comets && now >= sky.nextComet){
    sky.nextComet = now + riftRr(RIFT_SKY.comet);
    const diag = Math.hypot(cw, ch), right = Math.random() < 0.5;
    const ang = (right ? 0.28 + Math.random() * 0.75 : Math.PI - 0.28 - Math.random() * 0.75);   // downward, either way
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const mx = cw * (0.2 + Math.random() * 0.6), my = ch * (0.15 + Math.random() * 0.5);
    const len = diag * (0.6 + Math.random() * 0.3), speed = diag * (0.38 + Math.random() * 0.17);
    sky.comets.push({ x0:mx - dx * len * 0.45, y0:my - dy * len * 0.45, dx, dy, len, t0:now, dur:len / speed * 1000,
      tail:Math.min(240, 140 + Math.random() * 100) * px * Math.min(1, diag / (1400 * px) + 0.25), tint:Math.random() < 0.5 ? 5 : 0 });
  }
  sky.comets = sky.comets.filter(cm=>{
    const p = (now - cm.t0) / cm.dur;
    if(p >= 1) return false;
    const fade = Math.max(0, Math.min(1, p / 0.18, (1 - p) / 0.3));
    const hx = cm.x0 + cm.dx * cm.len * p, hy = cm.y0 + cm.dy * cm.len * p;
    const tx = hx - cm.dx * cm.tail, ty = hy - cm.dy * cm.tail, w0 = 2.4 * px, nx = -cm.dy, ny = cm.dx;
    const g = ctx.createLinearGradient(hx, hy, tx, ty);
    g.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`); g.addColorStop(0.25, `rgba(190,228,255,${0.45 * fade})`); g.addColorStop(1, 'rgba(150,200,255,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(hx + nx * w0 / 2, hy + ny * w0 / 2); ctx.lineTo(tx, ty); ctx.lineTo(hx - nx * w0 / 2, hy - ny * w0 / 2);
    ctx.closePath(); ctx.fill();
    const z = 26 * px;
    ctx.globalAlpha = fade;
    ctx.drawImage(spr.glow[cm.tint], hx - z / 2, hy - z / 2, z, z);
    return true;
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/* A sky put away gives its pixels back at once (an iPad counts every
   canvas's memory, and is slow to notice one that has gone). */
function riftSkyFree(s){
  try {
    let shared = false;
    _riftSkies.forEach(o=>{ if(o !== s && o.cv === s.cv && !o.off) shared = true; });   // the page's canvas, taken up again already
    if(!shared){ s.cv.width = 0; s.cv.height = 0; }
    if(s.soft && s.soft.cv){ s.soft.cv.width = 0; s.soft.cv.height = 0; }
    s.soft = null; s.base = null;
  } catch(e){}
}
/* ---------- the clock: every sky on show, one requestAnimationFrame ---------- */
const _riftSkies = new Set();
let _riftRaf = 0;
function riftSkyRun(sky){
  _riftSkies.add(sky);
  if(!_riftRaf && typeof requestAnimationFrame === 'function') _riftRaf = requestAnimationFrame(riftSkyTick);
}
function riftSkyTick(now){
  _riftRaf = 0;
  let mapOn = false;
  _riftSkies.forEach(s=>{ if(s.mode === 'map' && !s.off && s.cv.isConnected) mapOn = true; });
  _riftSkies.forEach(s=>{
    if(s.off || !s.cv.isConnected){ _riftSkies.delete(s); riftSkyFree(s); return; }
    let fps = RIFT_SKY.fps;
    if(s.mode === 'map'){
      s.cam = riftCam(s.o.world);
      if(s.cam.key !== s.camKey){ s.camKey = s.cam.key; fps = RIFT_SKY.moveFps; }
    } else {
      s.behind = mapOn;
      if(mapOn) fps = RIFT_SKY.behindFps;
    }
    if(now - s.last >= 1000 / fps - 4){
      s.last = now;
      try { riftSkyDraw(s, now); }
      catch(e){ console.error('rift sky:', e); s.off = true; }
    }
  });
  if(_riftSkies.size) _riftRaf = requestAnimationFrame(riftSkyTick);
}

/* ---------- the pages: the sky behind the whole screen ----------
   setScreenBg asks, once the backdrop it has found loads: this key, this
   picture — is it the rift's drawn sky, on one of its pages? Then the canvas
   shows, with the dark theme, and the faded picture does not. Asked with
   nothing (a page with no backdrop), it goes — a moment later, so the next
   page's own answer can keep it without a flicker. */
const RIFT_LIVE_KEYS = ['region6', 'explore', 'challenge', 'tear', 'shop', 'recover', 'rift'];
let _riftPage = null, _riftHideT = null;
function riftSkyLive(key, src){
  /* (3.82) …and a fight's, when its backdrop is the drawn sky (the designer: "the sky background is so
     beautiful, please don't cover over it with a translucent white layer in the battle UI") */
  const on = !!key && typeof r6SkyUri === 'function' && src === r6SkyUri() && (RIFT_LIVE_KEYS.includes(key) || /^battle_/.test(key));
  if(on) riftPageShow(); else riftPageHide(!key);
  /* (3.83) the designer: "in region 6, the buttons for the main region page, challenge, recover and shop
     are not translucent. please make them translucent so your art is beautiful and the contrast is not so
     jarring" — on those pages the cards and buttons go to glass (riftCss, body.r6-glass); a fight and the
     walks keep theirs */
  if(typeof document !== 'undefined' && document.body) document.body.classList.toggle('r6-glass', on && RIFT_GLASS_KEYS.includes(key));
  return on;
}
const RIFT_GLASS_KEYS = ['region6', 'challenge', 'tear', 'shop', 'recover'];
function riftPageShow(){
  clearTimeout(_riftHideT); _riftHideT = null;
  riftCss();
  let cv = document.getElementById('riftSkyPage');
  if(!cv){
    cv = document.createElement('canvas');
    cv.id = 'riftSkyPage';
    cv.setAttribute('aria-hidden', 'true');
    const bg = document.getElementById('screenBg');
    if(bg && bg.parentNode) bg.parentNode.insertBefore(cv, bg.nextSibling); else document.body.prepend(cv);
  }
  document.body.classList.add('r6-sky');
  if(!_riftPage || _riftPage.cv !== cv || _riftPage.off) _riftPage = riftSkyNew(cv, 'page');
  riftSkyRun(_riftPage);
}
function riftPageHide(soon){
  clearTimeout(_riftHideT);
  const go = ()=>{ _riftHideT = null; document.body.classList.remove('r6-sky'); if(_riftPage){ _riftPage.off = true; _riftPage = null; } };
  if(soon && document.body.classList.contains('r6-sky')) _riftHideT = setTimeout(go, 160); else go();
}
/* …and the room: a canvas inside the stage, under the deck. */
function riftMapSky(stage, world, d){
  riftCss();
  let cv = stage.querySelector('canvas.rift-sky-map');
  if(!cv){
    cv = document.createElement('canvas');
    cv.className = 'rift-sky-map';
    cv.setAttribute('aria-hidden', 'true');
    stage.insertBefore(cv, stage.firstChild);
  }
  const sky = riftSkyNew(cv, 'map', { stage, world, d });
  riftSkyRun(sky);
  return sky;
}

/* ============================================================
   THE ROUND ROOM
   ============================================================ */
const RIFT_ROOM = { n:17, r:7.6 };
/* Vesper's station: the desk's squares, along the top of the circle */
const RIFT_DESK = [[6,1],[7,1],[8,1],[9,1],[10,1],[4,2],[5,2],[11,2],[12,2],[4,3],[12,3]];
/* Selene's walk: from beside the tear (its west side) to beside the ancient portal */
const RIFT_PATH = [[6,14],[5,14],[5,13],[4,13],[4,12],[4,11],[3,11],[3,10],[3,9]];
const RIFT_WALK = { step:640, rest:[9000, 16000] };
const RIFT_VES = { x:0.75, y:-1.0 };     // where Vesper flies, from her square: at her shoulder, on the side she is not facing
function riftRows(){
  const N = RIFT_ROOM.n, c = N / 2, rows = [];
  for(let y = 0; y < N; y++){
    let s = '';
    for(let x = 0; x < N; x++) s += Math.hypot(x + 0.5 - c, y + 0.5 - c) <= RIFT_ROOM.r ? '.' : '#';
    rows.push(s);
  }
  RIFT_DESK.forEach(([x, y])=>{ rows[y] = rows[y].slice(0, x) + 'K' + rows[y].slice(x + 1); });
  return rows;
}
const RIFT_DECK = {
  key:'r6_rift', region:6, title:'The Time Rift', bg:'rift', music:'zone_rift',
  /* Further back than a ship's deck, so most of the room is in view: about
     13½ squares across the stage on a tablet, 9½ on a phone. (renderWalkDeck
     divides the screen's room by this; the stage itself is narrower — the
     page's own width, index.html — so the sum works back from the stage.) */
  get view(){
    const W = window.innerWidth, H = window.innerHeight;
    const stage = Math.min(Math.min(W, W >= 700 ? 720 : 480) - 32, H - 300);
    const avail = Math.min(W - 24, Math.max(220, H - 330));
    const want = Math.min(W, H) >= 700 ? 13.5 : 9.5;
    return Math.max(7, avail / (Math.max(200, stage) / want));
  },
  backLabel:'Region', backTo:'region',
  rows:riftRows(),
  spawn:[8,13],                                   // just above the tear, come up out of it
  things:[
    { x:7,  y:14, w:3, h:2, icon:'', verb:'The tear', sub:'Challenge the past', act:()=> riftTear() },
    { x:14, y:7,  w:2, h:3, icon:'', verb:'The future', sub:'Challenge it', act:()=> riftFuture() },
    { x:1,  y:7,  w:2, h:3, icon:'', verb:'Ancient portal', sub:'To the past', act:()=> riftPortal('ancient') },
    /* (3.84) the upper one wakes once the Council has called: the Fairy King's jungle (20-jungle.js) */
    { x:2,  y:4,  h:2, icon:'', verb:'Portal', get sub(){ return (typeof jgPortalAwake === 'function' && jgPortalAwake()) ? 'To the jungle' : 'To the past'; }, act:()=> riftPortal('jungle') },
    { x:2,  y:11, h:2, icon:'', verb:'Portal', sub:'To the past', act:()=> riftPortal('small') },
    { x:4,  y:1,  w:9, h:3, walk:true, icon:'', verb:'The Council', sub:'Vesper’s station', mark:()=> typeof jgCallDue === 'function' && jgCallDue(), act:()=> riftCouncil() },
    { x:4,  y:6,  html:(t, px)=> riftLucescoImg(px), cls:'rift-lion', faceR:true, icon:'🦁', verb:'Talk', sub:'Lucesco', act:()=> riftLucesco() },
  ],
  occupied:(x, y)=> riftSelOn(x, y),
  nearActs:(d, p)=> riftNearActs(p),
  onRender:(world, d)=> riftRoomRender(world, d),
};
/* (not Object.assign: that would freeze `view` at its value now) */
if(typeof DECKS !== 'undefined') DECKS.r6_rift = RIFT_DECK;

/* In through the tear, or from the hub's Explore: just above the tear. */
function riftGo(){
  ui.walkFresh = true;
  go('r6_rift');
}
function riftRoomRender(world, d){
  riftCss(); r6Css(); tearCss(); sceneCss();
  if(!ui.sceneRunning) document.body.classList.remove('rift-scene');
  const stage = $('#walkStage');
  if(stage){ stage.classList.add('rift-stage'); riftMapSky(stage, world, d); }
  const T = WALK_T, N = d.rows.length, R = RIFT_ROOM.r * T;
  /* the room's edge: the sky darkens past it — never to black — and a faint
     glow lies over the middle of the floor */
  const edge = document.createElement('div');
  edge.className = 'rift-edge';
  edge.style.cssText = `width:${N * T}px;height:${N * T}px;background:radial-gradient(circle at 50% 50%,` +
    `rgba(100,130,255,.22) 0,rgba(80,110,240,.15) ${Math.round(R * 0.55)}px,rgba(60,85,215,.08) ${Math.round(R - 0.9 * T)}px,` +
    `rgba(2,3,12,.5) ${Math.round(R + 0.1 * T)}px,rgba(2,3,12,.74) ${Math.round(R + 0.9 * T)}px,rgba(1,2,8,.82) ${Math.round(R + 2.5 * T)}px);`;
  world.appendChild(edge);
  const art = (cls, x, y, w, h, html, id)=>{
    const e = document.createElement('div');
    e.className = 'rift-art ' + cls;
    if(id) e.id = id;
    e.style.cssText = `left:${x * T}px;top:${y * T}px;width:${w * T}px;height:${h * T}px;`;
    e.innerHTML = html;
    world.appendChild(e);
    return e;
  };
  art('rift-station', 3.2, 0.1, 10.6, 3.4, riftStationSvg(), 'riftStation');
  art('rift-tear', 8.5 - 1.45, 14.95 - 1.45, 2.9, 2.9, tearGalaxy());
  art('rift-future', 15.0 - 1.4, 8.5 - 1.8, 2.8, 3.6, riftFutureSvg());
  const bigPortal = art('rift-portal big', 2.0 - 1.3, 8.5 - 1.95, 2.6, 3.6, riftPortalSvg(true));
  if(typeof pastOpen === 'function' && pastOpen()){ pastCss(); bigPortal.classList.add('past-portal'); }   // (3.81) awake
  const jgP = art('rift-portal', 2.5 - 0.8, 5.0 - 1.4, 1.6, 2.5, riftPortalSvg(false), 'riftPortalJg');
  if(typeof jgPortalAwake === 'function' && jgPortalAwake()){ if(typeof jgCss === 'function') jgCss(); jgP.classList.add('jg-awake'); }   // (3.84) awake, green
  art('rift-portal', 2.5 - 0.8, 12.0 - 1.4, 1.6, 2.5, riftPortalSvg(false));
  const me = $('#walkYou');
  if(me) me.classList.add('rift-person');
  riftSelRender(world);
  riftSelStart();
  /* the first time in, Selene shows you round */
  if(!r6().roomSeen && !ui.sceneRunning) setTimeout(()=>{ if(ui.screen === 'r6_rift') riftTour(); }, 450);
  /* (3.84) …and once she has, the Council has a call waiting (20-jungle.js) */
  else if(typeof jgCallDue === 'function' && jgCallDue()) setTimeout(()=>{ if(ui.screen === 'r6_rift' && !ui.sceneRunning) toast('📡 The Council is calling! Go to Vesper\'s station.'); }, 700);
}

/* ---------- Selene and Vesper, walking ---------- */
function riftSel(){ return ui.riftSel || (ui.riftSel = { i:0, dir:-1, until:0, next:0, faceR:true }); }
function riftSelAt(){ const p = RIFT_PATH[riftSel().i]; return { x:p[0], y:p[1] }; }
function riftSelOn(x, y){ const p = riftSelAt(); return p.x === x && p.y === y; }
function riftSelRender(world){
  const T = WALK_T;
  const sel = document.createElement('div');
  sel.className = 'walk-ent rift-selene rift-person';
  sel.id = 'riftSelene';
  sel.innerHTML = `<img src="assets/npc/shopkeeper6.png" alt="Selene" onerror="walkArtMissing(this,'🧙‍♀️',${Math.round(T * 0.8)},0)">`;
  world.appendChild(sel);
  const ves = document.createElement('div');
  ves.className = 'walk-ent rift-vesper';
  ves.id = 'riftVesper';
  ves.innerHTML = `<img src="assets/mon/vesper_front.png" alt="Vesper" data-px="${Math.round(T)}" onerror="riftVesperMissing(this)">`;
  world.appendChild(ves);
  riftSelPlace();
}
function riftVesperMissing(img){ try { img.outerHTML = vesperSvg(+img.dataset.px || 60); } catch(e){} }
/* Where she stands, the way she faces — and Vesper at her shoulder, on the
   side she is not facing, a little above her. */
function riftSelPlace(){
  const s = riftSel(), p = riftSelAt(), T = WALK_T;
  const sel = $('#riftSelene'), ves = $('#riftVesper');
  if(!sel) return;
  sel.style.transform = `translate3d(${p.x * T}px,${p.y * T}px,0)`;
  sel.style.zIndex = 10 + p.y;
  faceRight(sel, s.faceR);
  if(ves && !s.vesAway){
    ves.style.transform = `translate3d(${(p.x + (s.faceR ? -RIFT_VES.x : RIFT_VES.x)) * T}px,${(p.y + RIFT_VES.y) * T}px,0)`;
    ves.style.zIndex = 11 + p.y;
    faceRight(ves, s.faceR);
  }
}
let _riftSelTimer = null;
function riftSelStart(){ clearInterval(_riftSelTimer); _riftSelTimer = setInterval(riftSelTick, 120); }
function riftSelTick(){
  if(ui.screen !== 'r6_rift' || !document.getElementById('riftSelene')){ clearInterval(_riftSelTimer); _riftSelTimer = null; return; }
  const w = walkState(), s = riftSel(), now = Date.now();
  if(w.busy || ui.sceneRunning || ui.riftTalk || document.querySelector('.scene-say')) return;
  const p = w.at && w.at.r6_rift, here = riftSelAt();
  /* beside you, she waits — and looks at you */
  if(p && Math.abs(p.x - here.x) + Math.abs(p.y - here.y) <= 1){
    if(p.x !== here.x && (p.x > here.x) !== s.faceR){ s.faceR = p.x > here.x; riftSelPlace(); }
    return;
  }
  const last = RIFT_PATH.length - 1;
  if((s.i === 0 && s.dir < 0) || (s.i === last && s.dir > 0)){
    /* resting at an end, facing it: the tear is on her right, the portal on her left */
    const face = s.i === 0;
    if(s.faceR !== face){ s.faceR = face; riftSelPlace(); }
    if(!s.until) s.until = now + riftRr(RIFT_WALK.rest);
    if(now < s.until) return;
    s.until = 0;
    s.dir = -s.dir;
  }
  if(now < s.next) return;
  const np = RIFT_PATH[s.i + s.dir];
  if(p && p.x === np[0] && p.y === np[1]) return;            // you are in her way: she waits
  if(np[0] !== here.x) s.faceR = np[0] > here.x;
  s.i += s.dir;
  s.next = now + RIFT_WALK.step;
  riftSelPlace();
  refreshWalk();
}
/* Beside her: Talk, and her shop. */
function riftNearActs(p){
  const s = riftSelAt();
  if(Math.abs(s.x - p.x) + Math.abs(s.y - p.y) > 1) return [];
  return [
    { key:'riftTalk', html:'🗨️ Talk<small>Selene</small>', at:s, act:()=> riftSeleneTalk() },
    { key:'riftShop', html:'🛍️ Shop<small>Selene</small>', at:s, act:()=> leaveDeck('shop') },
  ];
}

/* ---------- faces, and what everyone says ---------- */
const riftSeleneFace = ()=> faceNpc('shopkeeper6', '🧙‍♀️');
/* (3.80) Vesper and Lucesco a fifth bigger than Selene (R6_BIG) — beside
   her in a window of words, and on the floor */
const riftVesperFace = ()=> `<img class="ss-big" src="assets/mon/vesper_front.png" alt="" onerror="walkArtMissing(this,'🦇',58,0)">`;
const riftLucescoFace = ()=> `<img class="ss-big" src="assets/mon/lucesco_front.png" alt="" onerror="walkArtMissing(this,'🦁',58,0)">`;
/* (3.96) His button beside you, wherever he walks with you (the past, the
   jungle, the castle): his own picture on it, not 🦁 (the designer). `sub`
   under his name; the button's class is 'lion'. */
function lucescoActHtml(verb, sub){
  return `<img class="wact-face" src="assets/mon/lucesco_front.png" alt="" onerror="this.replaceWith(document.createTextNode('🦁'))">` +
    `<span class="wact-words">${verb}<small>${sub || 'Lucesco'}</small></span>`;
}
function riftLucescoImg(px){ return `<img src="assets/mon/lucesco_front.png" alt="Lucesco" onerror="walkArtMissing(this,'🦁',${Math.round((px || 40) * 1.9)},0)">`; }
const RIFT_TOUR = [
  `"This is the Rift — the heart of the tear, where Vesper and I keep watch over time."<br><br>` +
  `"The tear behind you leads back down to the vault. The past still echoes in it: the Padrino's fight, once a week."`,
  `"That shimmer to the east is a <b>spacetime distortion</b>. Once a week it opens onto the future — three of its strongest monsters, and a legacy for whoever beats them."`,
  `"And to the west, the <b>portals to the past</b>. They are asleep… for now. And this is Lucesco."`,
  `A great lion pads forward. His mane burns like a fire, and under it he shines like steel.<br><br>` +
  `<b>"Rrrr. When the portals wake, I will guide you through the lands of the past."</b>`,
  `"Up there is Vesper's station. From it he speaks with the rest of the <b>Cosmic Council</b>, across all of time."<br><br>Vesper flutters up to it, very important.`,
  `"The sky holds you up here, so walk wherever you like. When you want my shop, come and find me — between the tear and the ancient portal."`,
];
const RIFT_SELENE_LINES = [
  `"Walk wherever you like. The sky holds you up — it always has."`,
  `"The tear goes back down to the vault. Inside it the past still echoes: the Padrino's fight, once a week."`,
  `"The distortion to the east opens onto the future once a week. Vesper checks on it every morning."`,
  `"Those portals are older than the Council. One day soon they will wake."`,
  `"Lucesco has waited a long time for someone to guide. Lions are patient. Vesper is not."`,
  `"Beat the future and it pays you Starlight. Spend it on your constellations, on the Talents page."`,
  `"Need anything? My shop is always open."`,
];
const RIFT_LUCESCO_LINES = [
  `<b>"Rrrr. I am Lucesco. Fire in my mane, steel in my bones."</b>`,
  `<b>"The portals to the past are asleep. When they wake, I will walk the old lands with you."</b>`,
  `<b>"Grow strong. The lands of the past remember everyone who walks through them."</b>`,
  `He yawns — teeth like polished steel — and settles down again to watch over the portals.`,
];
const RIFT_PORTAL_LINES = {
  ancient:`An ancient portal of carved stone, old runes all round its arch. Far inside it, very faintly, a land of long ago shimmers — and fades.<br><br>It is asleep.`,
  small:`A smaller portal, dark and cold. Something of the past lies beyond it, waiting.<br><br>It is asleep, for now.`,
};
const RIFT_COUNCIL_LINES = [
  `Vesper chirps into the console. Far across time, a ring of small lights blinks back: the rest of the Cosmic Council.<br><br><i>All quiet in the present.</i>`,
  `The Council's lights flicker. They are still searching for Nemesis's three pieces — the falcon, the jackal and the cobra.<br><br><i>Nothing yet.</i>`,
  `Vesper reports this week's distortions. The Council's lights blink twice.<br><br><i>Be careful in the future.</i>`,
  `One of the lights glows brighter for a moment, then dims. Vesper squeaks happily.<br><br><i>The Council says hello.</i>`,
];
/* What someone in the room says (sceneSay's window) — closed by itself if
   you leave the room meanwhile (Back, the menu), so it never waits on
   another page and nothing is left holding the room still. */
function riftSay(faces, name, html){
  return new Promise(res=>{
    let done = false, t = null;
    const fin = ()=>{ if(done) return; done = true; clearInterval(t); res(); };
    t = setInterval(()=>{ if(ui.screen !== 'r6_rift'){ document.querySelectorAll('.scene-say').forEach(b=> b.remove()); fin(); } }, 250);
    sceneSay(faces, name, html).then(fin);
  });
}
function riftNext(key, list){
  const s = riftSel();
  s[key] = (s[key] || 0) + 1;
  return list[(s[key] - 1) % list.length];
}

/* ---------- the room's things ---------- */
function riftTear(){ walkTeardown(); ui.tearBack = 'r6_rift'; go('tear'); }
function riftFuture(){ walkTeardown(); ui.futureBack = 'r6_rift'; go('future'); }
async function riftSeleneTalk(){
  if(ui.riftTalk) return;
  ui.riftTalk = true;
  try { await riftSay([riftSeleneFace(), riftVesperFace()], 'Selene', riftNext('talk', RIFT_SELENE_LINES)); }
  finally { ui.riftTalk = false; }
}
async function riftLucesco(){
  if(ui.riftTalk) return;
  ui.riftTalk = true;
  try { await riftSay([riftLucescoFace()], 'Lucesco', riftNext('lion', RIFT_LUCESCO_LINES)); }
  finally { ui.riftTalk = false; }
}
const RIFT_PORTAL_AWAKE = `The ancient portal's runes are burning gold, and a warm wind blows out of it, smelling of sand.<br><br>` +
  `<b>"Rrrr. It is awake. Come — I will walk with you."</b>`;
async function riftPortal(which){
  if(ui.riftTalk) return;
  /* (3.84) the upper small one, once the Council has called */
  if(which === 'jungle'){
    if(typeof jgPortalAwake === 'function' && jgPortalAwake()) return jgRiftPortal();
    which = 'small';
  }
  /* (3.81) the ancient one is awake — the land of long ago (19-past.js);
     on a developer's profile only, while its story is written */
  if(which === 'ancient' && typeof pastOpen === 'function' && pastOpen()){
    ui.riftTalk = true;
    try { await riftSay([riftLucescoFace()], 'Lucesco', RIFT_PORTAL_AWAKE); }
    finally { ui.riftTalk = false; }
    if(ui.screen === 'r6_rift') pastEnter();
    return;
  }
  ui.riftTalk = true;
  try {
    await riftSay([`<span class="rift-face-art">${riftPortalSvg(which === 'ancient')}</span>`],
      which === 'ancient' ? 'The ancient portal' : 'A portal to the past', RIFT_PORTAL_LINES[which] || RIFT_PORTAL_LINES.small);
  } finally { ui.riftTalk = false; }
}
/* Vesper flies to the station (or back to Selene). */
function riftVesperFly(x, y, ms){
  const ves = $('#riftVesper');
  if(!ves) return Promise.resolve();
  const s = riftSel(), T = WALK_T;
  const m = /translate3d\(([-\d.]+)px/.exec(ves.style.transform || '');
  if(m) faceRight(ves, x * T > parseFloat(m[1]));
  s.vesAway = true;
  ves.style.transition = `transform ${Math.max(1, ms * SCENE_SPEED)}ms ease-in-out`;
  ves.style.transform = `translate3d(${x * T}px,${y * T}px,0)`;
  ves.style.zIndex = 40;
  return sceneWait(ms);
}
function riftVesperHome(ms){
  const ves = $('#riftVesper'), s = riftSel();
  s.vesAway = false;
  if(!ves) return Promise.resolve();
  ves.style.transition = `transform ${Math.max(1, ms * SCENE_SPEED)}ms ease-in-out`;
  riftSelPlace();
  return sceneWait(ms).then(()=>{ if(ves.isConnected) ves.style.transition = ''; });
}
async function riftCouncil(){
  if(ui.sceneRunning || ui.riftTalk) return;
  const w = walkState();
  ui.sceneRunning = true; w.busy = true;
  document.body.classList.add('rift-scene');
  const st = $('#riftStation');
  let called = false;
  try {
    await riftVesperFly(8.0, 2.05, 1400);
    if(st) st.classList.add('on');
    /* (3.84) the first quest: a call from the Fairy King (20-jungle.js) */
    if(typeof jgCallDue === 'function' && jgCallDue()) called = await jgCouncilCall();
    else await riftSay([riftVesperFace()], 'Vesper', riftNext('council', RIFT_COUNCIL_LINES));
  } finally {
    if(st) st.classList.remove('on');
    ui.sceneRunning = false; w.busy = false;
    document.body.classList.remove('rift-scene');
    riftVesperHome(1400);
    refreshWalk();
  }
  /* the call heard: the room again, its "!" gone and the portal awake */
  if(called) setTimeout(()=>{ if(ui.screen === 'r6_rift' && !ui.sceneRunning){ ui.walkFresh = false; go('r6_rift'); } }, 1500);
}
/* The first time in: Selene shows you round — the camera turns to each part
   of the room as she names it. */
async function riftTour(){
  if(ui.sceneRunning || ui.screen !== 'r6_rift') return;
  const w = walkState(), here = ()=> ui.screen === 'r6_rift' && !!document.getElementById('riftSelene');
  const faces = ()=> [riftSeleneFace(), riftVesperFace()];
  ui.sceneRunning = true; w.busy = true;
  document.body.classList.add('rift-scene');           // Back and Party wait until she has finished
  const s = riftSel();
  s.i = 0; s.dir = -1; s.until = 0; s.faceR = true;
  riftSelPlace();
  const st = $('#riftStation');
  try {
    await sceneWait(300);
    if(!here()) return;
    await sceneLook([{ x:8.5, y:13.5 }, { x:6.5, y:14.5 }], { ms:500 });
    await riftSay(faces(), 'Selene', RIFT_TOUR[0]);
    if(!here()) return;
    await sceneLook({ x:13.6, y:6.7, w:2.8, h:3.6 }, { ms:900 });
    await riftSay(faces(), 'Selene', RIFT_TOUR[1]);
    if(!here()) return;
    await sceneLook({ x:0.7, y:3.6, w:4.6, h:9.2 }, { ms:1000 });
    await riftSay(faces(), 'Selene', RIFT_TOUR[2]);
    await riftSay([riftLucescoFace()], 'Lucesco', RIFT_TOUR[3]);
    if(!here()) return;
    await sceneLook({ x:3.2, y:0.1, w:10.6, h:3.4 }, { ms:1000 });
    await riftVesperFly(8.0, 2.05, 1200);
    if(st) st.classList.add('on');
    await riftSay(faces(), 'Selene', RIFT_TOUR[4]);
    if(st) st.classList.remove('on');
    riftVesperHome(1200);
    if(!here()) return;
    await sceneCamFree(900);
    await riftSay(faces(), 'Selene', RIFT_TOUR[5]);
  } finally {
    if(st) st.classList.remove('on');
    if(riftSel().vesAway) riftVesperHome(600);
    r6().roomSeen = true;
    saveProfile();
    ui.sceneRunning = false; w.busy = false;
    document.body.classList.remove('rift-scene');
    if(here()){ sceneCamFree(500); refreshWalk(); }
  }
}

/* ============================================================
   THE ROOM'S PICTURES — drawn, so they need no art
   ============================================================ */
let _riftSvgN = 0;
/* Vesper's station: a desk curved along the top of the circle (the room's
   own curve), seven screens standing on it, rows of little lights. Asked
   for the Council (`.on`), each screen shows a member, glowing. */
function riftStationSvg(){
  const u = 'rs' + (++_riftSvgN), CX = 530, CY = 840;
  const P = (r, a)=> [CX + r * Math.sin(a), CY - r * Math.cos(a)];
  const f = ([x, y])=> `${x.toFixed(1)},${y.toFixed(1)}`;
  const arc = (r, a0, a1, n)=> Array.from({ length:n + 1 }, (_, i)=> P(r, a0 + (a1 - a0) * i / n));
  const A = 0.7, far = arc(735, -A, A, 40), near = arc(655, A, -A, 40);
  const top = `M${far.map(f).join(' L')} L${near.map(f).join(' L')} Z`;
  const nearL = arc(655, -A, A, 40);
  const front = `M${nearL.map(f).join(' L')} L${nearL.slice().reverse().map(([x, y])=> f([x, y + 24])).join(' L')} Z`;
  const rim = `M${nearL.map(f).join(' L')}`;
  const COLS = ['#ffd27a', '#5ff3ff', '#e6f2ff', '#b28cff', '#5ff3ff', '#ffd27a', '#7dffc8'];
  const COUNCIL = ['#ff9ad5', '#9ad8ff', '#ffe08a', '#c9a2ff', '#8affd9', '#ffb38a', '#a6b8ff'];
  let screens = '';
  for(let i = -3; i <= 3; i++){
    const a = i * 0.19, b1 = P(728, a - 0.08), b2 = P(728, a + 0.08), hgt = i === 0 ? 92 : 80;
    const t1 = [b1[0], b1[1] - hgt], t2 = [b2[0], b2[1] - hgt];
    const mx = (b1[0] + b2[0]) / 2, my = (b1[1] + b2[1]) / 2 - hgt / 2, c = COLS[i + 3];
    let glyph;
    switch(i){
      case -3: glyph = [-14, -2, 10].map((dx, k)=> `<rect x="${(mx + dx - 4).toFixed(1)}" y="${(my + 14 - [18, 28, 12][k]).toFixed(1)}" width="8" height="${[18, 28, 12][k]}" fill="${c}"/>`).join(''); break;
      case -2: glyph = `<ellipse cx="${mx}" cy="${my}" rx="22" ry="9" fill="none" stroke="${c}" stroke-width="2"/><circle cx="${mx}" cy="${my}" r="5" fill="${c}"/><circle cx="${mx + 20}" cy="${my - 4}" r="3" fill="#fff"/>`; break;
      case -1: glyph = `<path d="M${mx - 20},${my + 8} L${mx - 6},${my - 10} L${mx + 6},${my + 2} L${mx + 18},${my - 14}" fill="none" stroke="${c}" stroke-width="1.6" opacity=".8"/>` +
        [[-20, 8], [-6, -10], [6, 2], [18, -14]].map(([dx, dy])=> `<circle cx="${mx + dx}" cy="${my + dy}" r="2.6" fill="#fff"/>`).join(''); break;
      case 0: glyph = `<circle cx="${mx}" cy="${my}" r="26" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="4 5"/>` +
        `<path d="M${mx},${my} m-16,0 a16,8 30 1,1 32,0 a16,8 30 1,1 -32,0" fill="none" stroke="#e8dcff" stroke-width="2.4"/><circle cx="${mx}" cy="${my}" r="5" fill="#fff"/>`; break;
      case 1: glyph = `<path d="M${mx - 24},${my} q6,-14 12,0 t12,0 t12,0 t12,0" fill="none" stroke="${c}" stroke-width="2.4"/>`; break;
      case 2: glyph = `<path d="M${mx + 4},${my - 15} a15,15 0 1,0 0,30 a11,11 0 1,1 0,-30 z" fill="${c}"/>`; break;
      default: glyph = `<circle cx="${mx}" cy="${my}" r="17" fill="none" stroke="${c}" stroke-width="1.4" opacity=".6"/><path d="M${mx},${my} L${mx + 17},${my - 4}" stroke="${c}" stroke-width="2.4"/><circle cx="${mx - 7}" cy="${my + 6}" r="2.4" fill="${c}"/>`;
    }
    const member = `<circle cx="${mx}" cy="${my - 4}" r="14" fill="${COUNCIL[i + 3]}" opacity=".9"/><circle cx="${mx}" cy="${my - 4}" r="22" fill="${COUNCIL[i + 3]}" opacity=".25"/>` +
      `<path d="M${mx},${my - 13} l2.4,6.6 6.6,2.4 -6.6,2.4 -2.4,6.6 -2.4,-6.6 -6.6,-2.4 6.6,-2.4 z" fill="#fff"/><path d="M${mx - 13},${my + 26} q13,-14 26,0" fill="${COUNCIL[i + 3]}" opacity=".7"/>`;
    screens += `<g class="rs-scr" style="animation-delay:${(i + 3) * -0.45}s">
      <path d="M${f(b1)} L${f(b2)} L${f(t2)} L${f(t1)} Z" fill="url(#${u}g)" stroke="#4a5fa0" stroke-width="2.5"/>
      <g class="rs-idle">${glyph}</g><g class="rs-member">${member}</g></g>`;
  }
  let lights = '';
  const LC = ['#5ff3ff', '#ff9ad5', '#ffd27a', '#7dffc8'];
  for(let row = 0; row < 2; row++) for(let i = 0; i < 26; i++){
    const a = -0.62 + i * 0.0496 + row * 0.025, [x, y] = P(680 + row * 26, a);
    lights += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${LC[(i + row * 2) % 4]}" class="rs-led" style="animation-delay:${((i * 37 + row * 11) % 23) / -7}s"/>`;
  }
  return `<svg viewBox="0 0 1060 340" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="${u}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3a72"/><stop offset="1" stop-color="#1a2150"/></linearGradient>
      <linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10224a"/><stop offset="1" stop-color="#050d24"/></linearGradient>
      <radialGradient id="${u}h" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#9fe9ff" stop-opacity=".55"/><stop offset="1" stop-color="#9fe9ff" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="rs-halo" cx="530" cy="120" rx="430" ry="120" fill="url(#${u}h)"/>
    <path d="${top}" fill="url(#${u}d)" stroke="#6a7cd0" stroke-width="2"/>
    <path d="${front}" fill="#0c1230"/>
    <path d="${rim}" fill="none" stroke="#6fe3ff" stroke-width="3" opacity=".75"/>
    ${lights}${screens}
  </svg>`;
}
/* The spacetime distortion: a tall lens of white light in rings of cyan
   and gold, ticking round like a clock face, throwing sparks. */
function riftFutureSvg(){
  const u = 'rf' + (++_riftSvgN), CX = 140, CY = 180;
  let ticks = '';
  for(let i = 0; i < 12; i++){
    const a = i / 12 * RIFT_TAU, c = Math.cos(a), s = Math.sin(a);
    ticks += `M${(CX + 112 * c).toFixed(1)},${(CY + 162 * s).toFixed(1)} L${(CX + 124 * c).toFixed(1)},${(CY + 176 * s).toFixed(1)} `;
  }
  let sparks = '';
  for(let i = 0; i < 9; i++){
    const a = i / 9 * RIFT_TAU + 0.3;
    sparks += `<circle class="rf-spark" cx="${CX}" cy="${CY}" r="${(2 + (i % 3)).toFixed(1)}" fill="${i % 3 ? '#bff8ff' : '#ffe6a8'}"
      style="--dx:${(Math.cos(a) * 120).toFixed(0)}px;--dy:${(Math.sin(a) * 160).toFixed(0)}px;animation-delay:${(i * -0.37).toFixed(2)}s"/>`;
  }
  return `<svg viewBox="0 0 280 360" aria-hidden="true">
    <defs>
      <radialGradient id="${u}g"><stop offset="0" stop-color="#e8fdff" stop-opacity=".95"/><stop offset=".25" stop-color="#7af1ff" stop-opacity=".55"/>
        <stop offset=".62" stop-color="#2a6cff" stop-opacity=".2"/><stop offset="1" stop-color="#2a6cff" stop-opacity="0"/></radialGradient>
      <radialGradient id="${u}l"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#d8fbff"/><stop offset="1" stop-color="#5fe8ff" stop-opacity=".2"/></radialGradient>
    </defs>
    <ellipse class="rf-glow" cx="${CX}" cy="${CY}" rx="138" ry="178" fill="url(#${u}g)"/>
    <ellipse class="rf-ring rf-r1" cx="${CX}" cy="${CY}" rx="100" ry="150" fill="none" stroke="#8ff6ff" stroke-width="2.5" stroke-dasharray="3 9"/>
    <ellipse class="rf-ring rf-r2" cx="${CX}" cy="${CY}" rx="78" ry="120" fill="none" stroke="#ffd27a" stroke-width="2.2" stroke-dasharray="14 8"/>
    <ellipse class="rf-ring rf-r3" cx="${CX}" cy="${CY}" rx="56" ry="92" fill="none" stroke="#c9b2ff" stroke-width="2" stroke-dasharray="2 6"/>
    <path class="rf-ticks" d="${ticks}" stroke="#e6fbff" stroke-width="3" stroke-linecap="round"/>
    <path class="rf-lens" d="M${CX},62 C${CX + 38},128 ${CX + 38},232 ${CX},298 C${CX - 38},232 ${CX - 38},128 ${CX},62 Z" fill="url(#${u}l)"/>
    ${sparks}
  </svg>`;
}
/* A portal to the past: an arch of old stone, runes round it glowing a
   little, a sleepy amber swirl inside. The ancient one has a keystone with
   an hourglass, and stands on two steps. */
function riftPortalSvg(big){
  const u = 'rp' + (++_riftSvgN), CX = 130, AY = 150;
  const spiral = (k)=>{
    const pts = [];
    for(let i = 0; i <= 30; i++){ const t = i / 30, a = t * 4.2 + k * 2.094, r = 6 + 46 * t; pts.push(`${(CX + r * Math.cos(a)).toFixed(1)},${(232 + r * Math.sin(a) * 1.3).toFixed(1)}`); }
    return `<path d="M${pts.join(' L')}" fill="none" stroke="#ffb35a" stroke-width="4" stroke-linecap="round"/>`;
  };
  let joints = '';
  for(let i = 1; i < 8; i++){
    const a = Math.PI + i / 8 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    joints += `M${(CX + 60 * c).toFixed(1)},${(AY + 60 * s).toFixed(1)} L${(CX + 90 * c).toFixed(1)},${(AY + 90 * s).toFixed(1)} `;
  }
  for(let y = 180; y < 330; y += 32) joints += `M40,${y} L70,${y} M190,${y} L220,${y} `;
  const GLYPHS = ['m-5,-5 l10,10 m0,-10 l-10,10', 'm0,-6 a6,6 0 1,0 0.1,0 m0,3 l0,6', 'm-6,5 l6,-11 l6,11 z', 'm-6,0 l12,0 m-6,-6 l0,12',
                  'm-5,-6 l10,0 l-10,12 l10,0', 'm0,-6 l0,12 m-6,-3 l6,-6 l6,6'];
  let runes = '';
  const nr = big ? 9 : 5;
  for(let i = 0; i < nr; i++){
    const a = Math.PI + (i + 0.5) / nr * Math.PI, x = CX + 75 * Math.cos(a), y = AY + 75 * Math.sin(a);
    runes += `<path class="rp-rune" d="M${x.toFixed(1)},${y.toFixed(1)} ${GLYPHS[i % GLYPHS.length]}" fill="none" stroke="#ffb35a" stroke-width="2.2" stroke-linecap="round" style="animation-delay:${(i * -0.6).toFixed(1)}s"/>`;
  }
  return `<svg viewBox="0 0 260 360" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <defs>
      <radialGradient id="${u}i" cx="50%" cy="62%" r="60%"><stop offset="0" stop-color="#6a4618"/><stop offset=".55" stop-color="#2b1a0a"/><stop offset="1" stop-color="#0d0805"/></radialGradient>
      <linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5d554b"/><stop offset=".5" stop-color="#8f8574"/><stop offset="1" stop-color="#5a5248"/></linearGradient>
    </defs>
    <path d="M70,330 L70,${AY} A60,60 0 0 1 190,${AY} L190,330 Z" fill="url(#${u}i)"/>
    <g class="rp-swirl">${spiral(0)}${spiral(1)}${spiral(2)}</g>
    <path class="rp-sleep" d="M70,330 L70,${AY} A60,60 0 0 1 190,${AY} L190,330 Z" fill="#ffb35a"/>
    <path d="M40,330 L40,${AY} A90,90 0 0 1 220,${AY} L220,330 L190,330 L190,${AY} A60,60 0 0 0 70,${AY} L70,330 Z" fill="url(#${u}s)" stroke="#2f2a24" stroke-width="3"/>
    <path d="${joints}" stroke="#3a342c" stroke-width="2.2" opacity=".8"/>
    ${runes}
    ${big ? `<path d="M112,52 L148,52 L142,92 L118,92 Z" fill="#9a8f7c" stroke="#2f2a24" stroke-width="3"/>
      <path class="rp-rune" d="M122,60 L138,60 L122,84 L138,84 Z" fill="none" stroke="#ffcf7a" stroke-width="2.4"/>
      <rect x="22" y="330" width="216" height="16" rx="3" fill="#6d6457" stroke="#2f2a24" stroke-width="3"/>
      <rect x="8" y="344" width="244" height="14" rx="3" fill="#5d554b" stroke="#2f2a24" stroke-width="3"/>`
      : `<rect x="30" y="330" width="200" height="18" rx="3" fill="#6d6457" stroke="#2f2a24" stroke-width="3"/>`}
  </svg>`;
}

/* ============================================================
   LOOKS — the sky's canvases, the dark theme for the pages, the room
   ============================================================ */
let _riftCssDone = false;
function riftCss(){
  if(_riftCssDone || typeof document === 'undefined') return;
  _riftCssDone = true;
  const st = document.createElement('style');
  st.id = 'riftCss';
  st.textContent = `
  #riftSkyPage{ position:fixed; inset:0; width:100%; height:100%; display:block; z-index:0; pointer-events:none; opacity:0; transition:opacity .6s ease; }
  body.r6-sky #riftSkyPage{ opacity:1; }
  /* the dark theme: free-standing words go light; the paper cards stay solid paper, lifted off the sky */
  body.r6-sky{ background:#02040c; }
  body.r6-sky .topbar{ background:linear-gradient(rgba(3,5,18,.9), rgba(3,5,18,.35)); }
  body.r6-sky .brand-name{ color:#f3eeff; }
  body.r6-sky .brand-sub{ color:#bdb5e4; }
  body.r6-sky .hamburger{ background:rgba(255,255,255,.08); border-color:rgba(205,195,255,.25); }
  body.r6-sky .hamburger span{ background:#ece6ff; }
  body.r6-sky .screen-title, body.r6-sky .scene-title{ color:#f7f3ff; text-shadow:0 2px 10px rgba(0,0,0,.9); }
  body.r6-sky .screen-sub{ color:#d4cdf2; text-shadow:0 1px 6px rgba(0,0,0,.95); }
  body.r6-sky .screen-sub b{ color:#fff; }
  body.r6-sky .back-link{ color:#ded6ff; text-shadow:0 1px 4px rgba(0,0,0,.9); }
  body.r6-sky .menu-card, body.r6-sky .challenge-card, body.r6-sky .ware, body.r6-sky .shop-bubble, body.r6-sky .medal-bar,
  body.r6-sky .hp-card, body.r6-sky .placeholder-note, body.r6-sky .btn-ghost{ box-shadow:0 4px 16px rgba(0,0,0,.5); }
  /* a card that is dimmed (cannot afford it, locked) stays solid; what is on it fades instead */
  body.r6-sky .ware.cant, body.r6-sky .ware.oos, body.r6-sky .menu-card.locked, body.r6-sky .region-card.locked{ opacity:1; }
  body.r6-sky .ware.cant > *, body.r6-sky .ware.oos > *, body.r6-sky .menu-card.locked > *, body.r6-sky .region-card.locked > *{ opacity:.5; }
  body.r6-sky.in-scene #screen{ background:transparent; }
  body.r6-sky .scene-body{ background:rgba(244,237,220,.95); }
  body.r6-sky .shop-keeper img{ filter:drop-shadow(0 0 7px rgba(200,180,255,.6)); }
  body.r6-sky .shop-note{ background:rgba(222,248,236,.95); }
  body.r6-sky .walk-stage{ box-shadow:0 0 0 1px rgba(170,180,255,.28), 0 6px 26px rgba(0,0,0,.6); }
  body.r6-sky .scene-emblem img, body.r6-sky .emblem-pair img{ filter:drop-shadow(0 0 8px rgba(200,180,255,.55)); }
  /* (3.82) a fight under the live sky: its free-standing words go light, the paper buttons stay paper */
  body.r6-sky .mon-title, body.r6-sky .mon-title span{ color:#f6f2ff; text-shadow:0 1px 3px rgba(0,0,0,.95), 0 0 8px rgba(0,0,0,.7); }
  body.r6-sky .hp-num, body.r6-sky .atk-line{ color:#ebe6ff; text-shadow:0 1px 3px rgba(0,0,0,.95); }
  body.r6-sky #battleMsg{ color:#e6e0fb !important; text-shadow:0 1px 4px rgba(0,0,0,.95); }   /* (its own colour is set on it) */
  body.r6-sky #battleMsg b, body.r6-sky #battleMsg strong{ color:#fff; }
  /* (3.83) the region's page, Challenge, Recover and the shop: violet glass, the sky through it, its words
     light (the page's own ink colours turned light inside it, so words coloured by them follow) */
  body.r6-glass .menu-card, body.r6-glass .challenge-card, body.r6-glass .ware, body.r6-glass .medal-bar,
  body.r6-glass .shop-bubble, body.r6-glass .hp-card, body.r6-glass #screen > .btn-ghost, body.r6-glass #screen > .btn-row > .btn-ghost,
  body.r6-glass #screen .storage-corner{
    --ink:#f4efff; --ink-soft:#cdc2f0; --line:rgba(206,186,255,.30);
    background:rgba(28,16,60,.38); border:1px solid rgba(206,186,255,.30); color:#f4efff;
    box-shadow:0 3px 0 rgba(122,96,206,.34), 0 6px 18px rgba(0,0,0,.28);
    backdrop-filter:blur(2.5px) saturate(1.15); -webkit-backdrop-filter:blur(2.5px) saturate(1.15);
    text-shadow:0 1px 3px rgba(0,0,0,.75);
  }
  body.r6-glass .menu-card:active, body.r6-glass .challenge-card:active, body.r6-glass .ware:active{ box-shadow:0 1px 0 rgba(122,96,206,.34), 0 4px 12px rgba(0,0,0,.26); }
  body.r6-glass .mc-desc, body.r6-glass .cc-desc, body.r6-glass .ware-desc, body.r6-glass .ware-oos, body.r6-glass .ware-or{ color:#cdc2f0; }
  body.r6-glass .mc-title, body.r6-glass .cc-title, body.r6-glass .ware-name, body.r6-glass .ware-price, body.r6-glass .medal-bar b{ color:#f8f4ff; }
  body.r6-glass .cc-desc b[style*="color"]{ filter:brightness(1.3); }
  body.r6-glass .shop-bubble:before{ background:rgba(28,16,60,.38); border-color:rgba(206,186,255,.30);
    clip-path:polygon(0 0, 0 100%, 100% 100%); backdrop-filter:blur(2.5px); -webkit-backdrop-filter:blur(2.5px); }
  body.r6-glass .hp-card .hpbar{ background:rgba(255,255,255,.16); }
  body.r6-glass #screen > .btn-jade{ background:rgba(36,134,100,.58); color:#f4fff9; border:1px solid rgba(150,240,205,.38);
    box-shadow:0 4px 0 rgba(12,66,48,.62); backdrop-filter:blur(2.5px); -webkit-backdrop-filter:blur(2.5px); text-shadow:0 1px 3px rgba(0,0,0,.5); }
  body.r6-glass #screen > .btn-primary{ background:rgba(186,56,44,.6); color:#fff6ee; border:1px solid rgba(255,190,170,.38);
    box-shadow:0 4px 0 rgba(96,24,18,.62); backdrop-filter:blur(2.5px); -webkit-backdrop-filter:blur(2.5px); text-shadow:0 1px 3px rgba(0,0,0,.5); }

  /* the room */
  .walk-stage.rift-stage{ background:#060c24; }
  .rift-sky-map{ position:absolute; inset:0; width:100%; height:100%; display:block; z-index:0; pointer-events:none; }
  .rift-stage .walk-world{ z-index:1; }
  .rift-edge{ position:absolute; left:0; top:0; pointer-events:none; z-index:0; }
  .rift-art{ position:absolute; pointer-events:none; z-index:5; }
  .rift-art > svg{ width:100%; height:100%; display:block; overflow:visible; }
  .rift-stage .walk-steps i{ background:rgba(215,225,255,.42); box-shadow:0 0 0 1.5px rgba(255,255,255,.55); }
  .rift-stage .walk-shade i{ background:#000; }
  .rift-stage.pathing .walk-shade{ opacity:.45; }
  /* people stand in a little pool of light, so they read against the dark sky */
  .rift-stage .walk-ent.rift-person::before, .rift-stage .walk-ent.rift-lion::before{ content:''; position:absolute; left:6%; right:6%; bottom:-6%; height:26%;
    border-radius:50%; background:radial-gradient(ellipse at center, rgba(175,195,255,.42) 0%, rgba(175,195,255,0) 70%); pointer-events:none; }
  .walk-ent.rift-selene{ transition:transform .62s linear; }
  .walk-ent.rift-selene img{ filter:drop-shadow(0 0 2.5px rgba(225,215,255,.9)); }
  .walk-ent.rift-vesper{ transition:transform .95s ease-out; pointer-events:none; }
  .walk-ent.rift-vesper > *{ animation:riftBob 2.6s ease-in-out infinite; }
  .walk-ent.rift-vesper img{ transform:scale(1.577); filter:drop-shadow(0 0 4px rgba(190,170,255,.8)); }   /* (3.80) 1.2 × a person's 1.314 */
  .walk-ent.rift-vesper .vesper-svg{ width:100%; height:auto; }
  @keyframes riftBob{ 0%,100%{ translate:0 0; } 50%{ translate:0 -12%; } }
  .walk-ent.rift-lion img{ transform:scale(1.577) translateY(-10%); filter:drop-shadow(0 0 5px rgba(255,140,60,.6)); }   /* (3.80) 1.2 × Selene */
  .walk-ent.rift-lion .walk-emoji{ filter:drop-shadow(0 0 8px rgba(255,140,60,.95)); translate:0 -10%; }
  body.rift-scene #backBtn, body.rift-scene #walkParty{ pointer-events:none; opacity:.45; }
  .scene-say .ss-faces img.ss-big{ width:77px; height:77px; }          /* (3.80) 1.2 × 64 */
  .scene-say .ss-faces .walk-emoji{ line-height:1; }
  .rift-face-art{ display:inline-block; width:56px; height:64px; }
  .rift-face-art svg{ width:100%; height:100%; display:block; }
  /* the station */
  .rift-station .rs-scr{ animation:rsFlicker 3.4s ease-in-out infinite; }
  .rift-station .rs-member{ opacity:0; transition:opacity .5s ease; }
  .rift-station .rs-idle{ transition:opacity .5s ease; }
  .rift-station.on .rs-member{ opacity:1; }
  .rift-station.on .rs-idle{ opacity:0; }
  .rift-station .rs-halo{ opacity:.35; transition:opacity .6s ease; }
  .rift-station.on .rs-halo{ opacity:1; animation:rsHalo 1.6s ease-in-out infinite; }
  .rift-station .rs-led{ animation:rsLed 2.3s ease-in-out infinite; }
  @keyframes rsFlicker{ 0%,100%{ opacity:1; } 45%{ opacity:.82; } 50%{ opacity:.96; } 55%{ opacity:.86; } }
  @keyframes rsLed{ 0%,100%{ opacity:.35; } 50%{ opacity:1; } }
  @keyframes rsHalo{ 0%,100%{ opacity:.75; } 50%{ opacity:1; } }
  /* the future */
  .rift-future .rf-glow{ transform-box:fill-box; transform-origin:50% 50%; animation:rfPulse 3.2s ease-in-out infinite; }
  .rift-future .rf-r1{ animation:rfFlow 7s linear infinite; }
  .rift-future .rf-r2{ animation:rfFlow 11s linear infinite reverse; }
  .rift-future .rf-r3{ animation:rfFlow 5s linear infinite; }
  .rift-future .rf-ticks{ animation:rfTick 2s steps(2, end) infinite; }
  .rift-future .rf-lens{ transform-box:fill-box; transform-origin:50% 50%; animation:rfLens 2.4s ease-in-out infinite; }
  .rift-future .rf-spark{ animation:rfSpark 3.3s ease-out infinite; }
  @keyframes rfPulse{ 0%,100%{ transform:scale(1); opacity:.85; } 50%{ transform:scale(1.06); opacity:1; } }
  @keyframes rfFlow{ to{ stroke-dashoffset:-120; } }
  @keyframes rfTick{ 0%{ opacity:.55; } 50%{ opacity:1; } }
  @keyframes rfLens{ 0%,100%{ transform:scaleX(1); opacity:.9; } 50%{ transform:scaleX(.78); opacity:1; } }
  @keyframes rfSpark{ 0%{ transform:translate(0,0); opacity:0; } 15%{ opacity:1; } 100%{ transform:translate(var(--dx),var(--dy)); opacity:0; } }
  /* the portals, asleep */
  .rift-portal .rp-swirl{ transform-box:view-box; transform-origin:130px 232px; animation:rpTurn 26s linear infinite; opacity:.32; }
  .rift-portal .rp-sleep{ animation:rpSleep 5.5s ease-in-out infinite; }
  .rift-portal .rp-rune{ animation:rpRune 4.2s ease-in-out infinite; }
  .rift-portal:not(.big) .rp-rune{ opacity:.3; animation:none; }
  @keyframes rpTurn{ to{ transform:rotate(360deg); } }
  @keyframes rpSleep{ 0%,100%{ opacity:.04; } 50%{ opacity:.13; } }
  @keyframes rpRune{ 0%,100%{ opacity:.28; } 50%{ opacity:.7; } }
  /* the tear, as in the vault (16-tear.js's) */
  .rift-tear .tear-svg{ width:100%; height:100%; }
  `;
  document.head.appendChild(st);
}
