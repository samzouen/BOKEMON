/* ============================================================
   40-r5-art.js — REGION 5, DRAWN AGAIN (4.45: the catacombs; 4.46: the rooms; 4.47: Ugo's, the church, the tower)
   The designer: "with your amazing art lately, could you kindly help me
   to redraw the catacombs with the same level of intricate detail that
   you had for the fairy kingdom's castle? and also the interiors of
   padrino's hilltop mansion and all the houses on all floors, please! I
   like the consistency way more than the AI art i've been using gemini
   for" — and the tailor's, the church and the tower too.
   Until now each of these places was one small picture (32 pixels a
   square, from paintCatacomb or paintRoom), stretched to fill the screen:
   at an iPad's size, five times over. Now each is drawn as the castle is
   (21-castle.js, 23-castle-art.js): at the screen's own sharpness, in
   pieces of 4 by 4 squares as they come into view, kept within the
   castle's own budget of pictures (CA_ART.util.pic), on a canvas under
   the walk (canvas.r5-ground) — and what flickers (a brazier's flames,
   the water) drawn again as it moves. The grids stay exactly as they
   were: where you can walk, what blocks, where the men walk their rounds.
   One name outside: R5ART (and deckArtStart, 13-walkmap.js's hook).
   ============================================================ */
const R5ART = (function(){
const { rng, sh, mix, pic, PIC_MAX_S } = CA_ART.util;
const TAU = Math.PI * 2, CH = 4, RIM = 2;

/* ---------- small pens ---------- */
const hsh = (x, y, k)=> (Math.imul((x | 0) + 1013, 73856093) ^ Math.imul((y | 0) + 7919, 19349663) ^ Math.imul((k | 0) + 31, 83492791)) >>> 0;
const R = (x, y, k)=> rng(hsh(x, y, k));
const lw = (s, f)=> Math.max(1, s * f);
function rr(g, x, y, w, h, r){ g.beginPath(); if(g.roundRect) g.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.max(0, Math.min(r, w / 2, h / 2))); else g.rect(x, y, w, h); }
function ell(g, x, y, rx, ry, c){ g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); g.fill(); }
function circ(g, x, y, r, c){ g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); g.fill(); }
function lin(g, x0, y0, x1, y1, stops){ const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c])=> gr.addColorStop(o, c)); return gr; }
function rad(g, x, y, r0, r1, stops){ const gr = g.createRadialGradient(x, y, Math.max(0, r0), x, y, Math.max(0.1, r1)); stops.forEach(([o, c])=> gr.addColorStop(o, c)); return gr; }
function poly(g, pts, c){ g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i)=> i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); }
function line(g, x0, y0, x1, y1, c, w){ g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

/* ============================================================
   THE ENGINE: a canvas under the walk, drawn from pieces
   ============================================================ */
const P = { cv:null, ov:null, stage:null, world:null, d:null, kind:null, raf:0, key:'', last:0, sig:'', okey:'', made:new Set() };
const PAINTERS = {};
function kindOf(d){
  if(!d || d.region !== 5 || !d.rows || !d.rows.length) return null;
  for(const k of Object.keys(PAINTERS)) if(PAINTERS[k].handles(d)) return k;
  return null;
}
function handles(d){ return !!kindOf(d); }
function start(world, d){
  const kind = kindOf(d);
  const stage = world && world.parentElement;
  if(!stage) return;
  const old = stage.querySelector('canvas.r5-ground');
  if(!kind){ if(old) old.remove(); return; }
  css();
  let cv = old;
  if(!cv){
    cv = document.createElement('canvas');
    cv.className = 'r5-ground';
    cv.setAttribute('aria-hidden', 'true');
    stage.insertBefore(cv, stage.firstChild);
  }
  /* (what stands up over the square behind it — a pillar, a wardrobe — drawn again over whoever stands there) */
  let ov = stage.querySelector('canvas.r5-over');
  if(!ov){
    ov = document.createElement('canvas');
    ov.className = 'r5-over';
    ov.setAttribute('aria-hidden', 'true');
    world.after(ov);
  }
  world.style.backgroundImage = 'none';
  stage.classList.add('r5-art', 'r5-art-' + kind);
  Object.assign(P, { cv, ov, stage, world, d, kind, key:'', last:0, okey:'', sig:PAINTERS[kind].sig(d) });
  if(P.made.size > 400) P.made.clear();
  if(!P.raf && typeof requestAnimationFrame === 'function') P.raf = requestAnimationFrame(tick);
}
function free(){ [P.cv, P.ov].forEach(c=>{ if(c && !c.isConnected){ c.width = 0; c.height = 0; } }); P.cv = P.ov = null; P.key = ''; }
function tick(now){
  P.raf = 0;
  if(!P.cv || !P.cv.isConnected){ free(); return; }
  const cam = riftCam(P.world), Pt = PAINTERS[P.kind];
  const okey = overKey();
  if(cam.key !== P.key || okey !== P.okey || (Pt.anim && now - P.last > 110)){
    P.key = cam.key; P.okey = okey; P.last = now;
    try { draw(cam, now); } catch(e){ console.error('r5 art:', e); }
  }
  P.raf = requestAnimationFrame(tick);
}
/* the squares in view, their pieces, then what moves */
function draw(cam, now){
  const cv = P.cv, st = P.stage, d = P.d, Pt = PAINTERS[P.kind];
  const W = st.clientWidth, H = st.clientHeight;
  if(!W || !H) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if(cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)){ cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d');
  const k = WALK_T * (cam.s || 1) * dpr, s = Math.max(8, Math.min(PIC_MAX_S, Math.round(k)));
  const ox = dpr * (W / 2 + cam.e), oy = dpr * (H / 2 + cam.f);
  const MW = d.rows[0].length, MH = d.rows.length;
  const x0 = Math.max(0, Math.floor(-ox / k) - 1), y0 = Math.max(0, Math.floor(-oy / k) - 1);
  const x1 = Math.min(MW - 1, Math.ceil((cv.width - ox) / k) + 1), y1 = Math.min(MH - 1, Math.ceil((cv.height - oy) / k) + 1);
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = Pt.bg || '#0b0a0d'; ctx.fillRect(0, 0, cv.width, cv.height);
  /* (pieces not drawn yet: a few a frame, so walking into a new part never stalls — the rest the frames after) */
  let fresh = 0, later = false;
  for(let cy = Math.floor(y0 / CH); cy <= Math.floor(y1 / CH); cy++) for(let cx = Math.floor(x0 / CH); cx <= Math.floor(x1 / CH); cx++){
    const cw = Math.min(CH, MW - cx * CH), chh = Math.min(CH, MH - cy * CH);
    if(cw <= 0 || chh <= 0) continue;
    const pkey = `r5:${d.key}:${P.sig}:${cx},${cy}@${s}`;
    if(!P.made.has(pkey)){ if(fresh >= 6){ later = true; continue; } fresh++; P.made.add(pkey); }
    const piece = pic(pkey, cw * s + 2 * RIM, chh * s + 2 * RIM, g=>{
      g.translate(RIM - cx * CH * s, RIM - cy * CH * s);
      Pt.ground(g, d, s, { x0:cx * CH - 1, y0:cy * CH - 1, x1:cx * CH + cw, y1:cy * CH + chh });
    });
    const px = Math.round(ox + cx * CH * k), py = Math.round(oy + cy * CH * k);
    ctx.drawImage(piece, RIM, RIM, cw * s, chh * s, px, py, Math.round(ox + (cx * CH + cw) * k) - px, Math.round(oy + (cy * CH + chh) * k) - py);
  }
  if(later) P.key = '';                          // (the rest next frame)
  if(Pt.anim) Pt.anim(ctx, d, k, ox, oy, { x0, y0, x1, y1 }, now);
  drawOver(Pt, d, k, s, ox, oy, { x0, y0, x1, y1 }, dpr);
}
/* ---------- what stands up over the square behind it ----------
   The ground has all of it (a pillar's foot on its own square, its shaft and capital going up over the square behind).
   This layer, over everyone, has that part again — only over the squares one can stand on behind it — so whoever stands
   there is behind it; and where it covers you or the Whalelord it is see-through (4.41's rule: only where it covers
   you). In the dark of the catacombs it is as dark as the square it is over (the fog: 14-stealth.js), and not drawn at
   all where that square is black. */
const SEE_ELS = ['walkYou', 'walkGhost'];
const FOG_DIM = { 'fog-seen':'rgba(5,4,7,0.72)', 'fog-sense':'rgba(40,20,70,0.34)', 'fog-lamp':'rgba(255,196,90,0.18)', 'fog-fire':'rgba(255,150,60,0.08)' };
function fogAt(x, y){
  const fog = document.getElementById('walkFog');
  if(!fog || !P.d) return '';
  const c = fog.children[y * P.d.rows[0].length + x];
  return c ? c.className : '';
}
function overKey(){
  const Pt = PAINTERS[P.kind];
  if(!Pt || !Pt.tall || !P.d) return '';
  let k = '';
  (Pt.tall(P.d) || []).forEach(o=>{ for(let y = Math.floor(o.y - o.up); y < o.y; y++) for(let x = o.x; x < o.x + (o.w || 1); x++) k += fogAt(x, y)[4] || '-'; });
  SEE_ELS.forEach(id=>{ const el = document.getElementById(id); if(el){ const r = el.getBoundingClientRect(); k += Math.round(r.left) + ',' + Math.round(r.top) + ';'; } });
  return k;
}
function drawOver(Pt, d, k, s, ox, oy, V, dpr){
  const ov = P.ov, cv = P.cv;
  if(!ov || !ov.isConnected) return;
  if(ov.width !== cv.width || ov.height !== cv.height){ ov.width = cv.width; ov.height = cv.height; }
  const g = ov.getContext('2d');
  g.clearRect(0, 0, ov.width, ov.height);
  if(!Pt.tall) return;
  const list = Pt.tall(d) || [], open = Pt.standable || (()=> true);
  let any = false;
  list.forEach(o=>{
    const w = o.w || 1;
    if(o.x + w < V.x0 - 1 || o.x > V.x1 + 1 || o.y < V.y0 - 1 || o.y - o.up > V.y1 + 1) return;
    const piece = pic(`r5t:${d.key}:${P.sig}:${o.x},${o.y}@${s}`, w * s + 2 * RIM, (o.up + 1) * s + 2 * RIM, gg=>{
      gg.translate(RIM - o.x * s, RIM - (o.y - o.up) * s);
      o.draw(gg, d, s);
    });
    for(let y = Math.floor(o.y - o.up); y < o.y; y++) for(let x = o.x; x < o.x + w; x++){
      if(!open(d, x, y)) continue;
      const f = fogAt(x, y);
      if(f === 'fog-dark') continue;
      const px = Math.round(ox + x * k), py = Math.round(oy + y * k), pw = Math.round(ox + (x + 1) * k) - px, ph = Math.round(oy + (y + 1) * k) - py;
      g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
      const sx = ox + o.x * k - RIM * k / s, sy = oy + (o.y - o.up) * k - RIM * k / s;
      g.drawImage(piece, sx, sy, piece.width * k / s, piece.height * k / s);
      if(FOG_DIM[f]){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = FOG_DIM[f]; g.fillRect(px, py, pw, ph); }
      g.restore();
      any = true;
    }
  });
  if(!any || typeof seeFigure !== 'function') return;
  const sr = P.stage.getBoundingClientRect();
  g.globalCompositeOperation = 'destination-out';
  SEE_ELS.forEach(id=>{
    const el = document.getElementById(id), f = el && seeFigure(el);
    if(!f) return;
    const r = el.getBoundingClientRect(), T = r.width;
    seeCut(g, (r.left + f[0] * T - sr.left) * dpr, (r.top + f[1] * T - sr.top) * dpr, f[2] * T * dpr, f[3] * T * dpr, 0.42);
  });
  g.globalCompositeOperation = 'source-over';
}
let _css = false;
function css(){
  if(_css) return;
  _css = true;
  const st = document.createElement('style');
  st.textContent = `
  .r5-ground{ position:absolute; inset:0; width:100%; height:100%; display:block; z-index:0; pointer-events:none; }
  .walk-stage.r5-art{ background:#0b0a0d; }
  .walk-stage.r5-art .walk-world{ z-index:1; }
  .r5-over{ position:absolute; inset:0; width:100%; height:100%; display:block; z-index:2; pointer-events:none; }
  `;
  document.head.appendChild(st);
}

/* ============================================================
   THE CATACOMBS
   Seen from above and a little in front, as the castle's rooms are:
   flagstones laid in courses that run on from square to square, each
   slab its own size and shade, worn, chipped, cracked; the walls' faces
   of rough-cut blocks where the floor runs up to them, with the dead's
   niches cut into them; and each floor its own: the Landing's crates and
   the sea's sand blown in at its cave mouth, the Cistern's black water
   and plank bridges, the Bone Halls' ossuary, the Garrison's bunks, the
   Quarry's pale stone and cut blocks, the Wine Cellars' barrels and its
   drain, the Fight Pit's sand and rail, the crypt's tombs, the vault.
   ============================================================ */
const T_BASE = { floor:'#6a6470', floorVar:0.085, mortar:'#25212b', slab:[0.55, 1.25], course:0.5,
  wall:'#5d5765', wallTop:'#26222c', rock:'#151318', niche:0.16, dust:0.4, damp:0, moss:0, bones:0, straw:0,
  rubble:0, brick:false, skulls:false, sea:false, polish:false };
const T_FLOOR = {
  cata_landing: { floor:'#68626e', sea:true, niche:0.07 },
  cata_cistern: { floor:'#5b666b', wall:'#56606a', wallTop:'#20262c', damp:0.55, moss:0.4, dust:0.15 },
  cata_bones:   { floor:'#6e655b', wall:'#625950', wallTop:'#2a241f', niche:0.42, bones:0.1, dust:0.5 },
  cata_stair:   { floor:'#676070' },
  cata_garrison:{ floor:'#6f6558', wall:'#625a4f', wallTop:'#29241f', straw:0.12, dust:0.5, niche:0.06 },
  cata_quarry:  { floor:'#8d8576', wall:'#7d7566', wallTop:'#3b362e', mortar:'#4b4539', slab:[0.75, 1.55], course:0.66, dust:0.9, rubble:0.12, niche:0 },
  cata_cellars: { floor:'#80604c', wall:'#6e5848', wallTop:'#2c211b', mortar:'#3b2a22', brick:true, niche:0.05, damp:0.2 },
  cata_pit:     { floor:'#6f675c', wall:'#625a50', wallTop:'#29241f', dust:0.6, niche:0.08 },
  cata_deep:    { floor:'#5e5a66', wall:'#585463', damp:0.3, moss:0.15 },
  cata_watch:   { floor:'#625d6c', niche:0.1 },
  cata_crypt:   { floor:'#5a5662', wall:'#57535f', wallTop:'#211e26', niche:0.32, polish:true },
  cata_vault:   { floor:'#4c4858', wall:'#474353', wallTop:'#1c1a22', niche:0, polish:true },
};
/* a side room: as its floor, and its own */
const T_ROOM = {
  cata_landing_r1: ['cata_landing', { sea:false }],
  cata_landing_r2: ['cata_bones', { niche:0.55, bones:0.06 }],
  cata_cistern_r1: ['cata_cistern', {}],
  cata_cistern_r2: ['cata_cistern', { niche:0.12 }],
  cata_bones_r1:   ['cata_bones', { bones:0.14 }],
  cata_bones_r2:   ['cata_bones', { skulls:true }],
  cata_stair_r1:   ['cata_garrison', { straw:0.06 }],
  cata_stair_r2:   ['cata_stair', { niche:0 }],
};
/* what a letter is, room by room, where it is not what it is elsewhere */
const C_OBJ = {
  cata_stair_r2:   { c:'rack' },          // the Armoury: racks of the Family's weapons
  cata_stair_r1:   { c:'bunk' },          // the Barracks: where the men sleep
  cata_cistern_r1: { c:'pump' },          // the Pump Room: the old pumps
  cata_cistern_r2: { c:'pew' },           // the Drowned Chapel: its pews
};
function cTheme(d){
  const r = T_ROOM[d.key];
  return Object.assign({}, T_BASE, T_FLOOR[r ? r[0] : d.key] || {}, r ? r[1] : {});
}
const WALLISH = c=> c === '#' || c === 'h';
const _cInfo = new Map();
function cSig(d){
  const s = d.rows.join('') + '|' + JSON.stringify(d.chalkFresh || []) + '|' + JSON.stringify(d.leaves || []) + '|' + JSON.stringify(d.grave || 0);
  let h = 2166136261;
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
function cInfo(d){
  const sig = cSig(d);
  let I = _cInfo.get(d.key);
  if(I && I.sig === sig) return I;
  const W = d.rows[0].length, H = d.rows.length;
  const at = (x, y)=> (y < 0 || y >= H || x < 0 || x >= W) ? '#' : d.rows[y][x];
  const open = (x, y)=> !WALLISH(at(x, y));
  /* the runs of one letter (side by side, or one above another): a table, a tomb, a rack of barrels */
  const runs = new Map(), seen = new Set();
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const c = at(x, y), key = x + ',' + y;
    if(seen.has(key) || !'ctbkxZwr'.includes(c)) continue;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    const stack = [[x, y]]; seen.add(key);
    while(stack.length){
      const [a, b] = stack.pop();
      x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=>{ const u = a + dx, v = b + dy, kk = u + ',' + v; if(!seen.has(kk) && at(u, v) === c){ seen.add(kk); stack.push([u, v]); } });
    }
    const run = { c, x0, y0, x1, y1, w:x1 - x0 + 1, h:y1 - y0 + 1 };
    for(let b = y0; b <= y1; b++) for(let a = x0; a <= x1; a++) if(at(a, b) === c) runs.set(a + ',' + b, run);
  }
  /* the ways out: stairs up and down, doorways, the sea cave */
  const ways = (d.things || []).filter(t=> t.walk && t.where).map(t=> ({ x:t.x, y:t.y, verb:t.verb, arrow:t.arrow, side:cWaySide(d, t, at, W, H) }));
  const lights = [];
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(at(x, y) === '*') lights.push({ x, y });
  /* the water: a pillar standing in it is in it too; how far each square of it is from any edge */
  const isW = (x, y)=> { const c = at(x, y); return c === '~' || c === '='; };
  const wetPillar = (x, y)=> at(x, y) === 'o' && [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b])=> isW(x + a, y + b)).length >= 3;
  const wet = (x, y)=> isW(x, y) || wetPillar(x, y);
  const depth = new Int8Array(W * H).fill(-1), queue = [];
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(wet(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b])=> !wet(x + a, y + b))){ depth[y * W + x] = 1; queue.push([x, y]); }
  for(let i = 0; i < queue.length; i++){
    const [x, y] = queue[i], dd = depth[y * W + x];
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b])=>{ const u = x + a, v = y + b; if(u >= 0 && v >= 0 && u < W && v < H && wet(u, v) && depth[v * W + u] < 0){ depth[v * W + u] = Math.min(6, dd + 1); queue.push([u, v]); } });
  }
  const depthAt = (x, y)=> (x < 0 || y < 0 || x >= W || y >= H) ? 0 : Math.max(0, depth[y * W + x]);
  /* beyond each way out, the rock it goes into: an arch, a dark passage, the sea cave's mouth */
  const beyond = new Map();
  ways.forEach(w=>{ const [dx, dy] = { u:[0, -1], d:[0, 1], l:[-1, 0], r:[1, 0] }[w.side] || [0, -1]; beyond.set((w.x + dx) + ',' + (w.y + dy), w); });
  I = { d, sig, W, H, at, open, th:cTheme(d), obj:C_OBJ[d.key] || {}, runs, ways, lights, courses:new Map(), faces:new Map(), wet, wetPillar, depthAt, beyond };
  _cInfo.set(d.key, I);
  return I;
}
/* which way a way out leads: the side of its square with the rock (or the map's edge) beyond it */
function cWaySide(d, t, at, W, H){
  if(t.arrow === 'left') return 'l';
  if(t.arrow === 'right') return 'r';
  if(t.arrow === 'down') return 'd';
  if(t.y <= 0 || (t.verb === 'Up' && WALLISH(at(t.x, t.y - 1)))) return 'u';
  if(t.y >= H - 1) return 'd';
  if(t.x <= 0) return 'l';
  if(t.x >= W - 1) return 'r';
  const sides = [['u', 0, -1], ['d', 0, 1], ['l', -1, 0], ['r', 1, 0]].filter(([, dx, dy])=> WALLISH(at(t.x + dx, t.y + dy)));
  return (sides.find(s=> s[0] === (t.verb === 'Down' ? 'd' : 'u')) || sides[0] || ['u'])[0];
}

/* ---------- the floor ---------- */
function cCourse(I, r){
  let a = I.courses.get(r);
  if(a) return a;
  const q = R(r, 917, 3), th = I.th;
  a = [];
  let x = -1.5 - q() * 1.2;
  while(x < I.W + 1.5){ a.push(x); x += th.slab[0] + q() * (th.slab[1] - th.slab[0]); }
  a.push(x);
  I.courses.set(r, a);
  return a;
}
function cTouchesFloor(I, xa, xb, ya, yb){
  for(let y = Math.floor(ya); y <= Math.floor(yb - 0.001); y++) for(let x = Math.floor(xa); x <= Math.floor(xb - 0.001); x++) if(I.open(x, y)) return true;
  return false;
}
/* the courses' own heights, down the whole floor (each a little different), and where each course's slabs break */
function cRowsY(I){
  if(I.rowsY) return I.rowsY;
  const q = R(7, 7, 401), th = I.th, a = [];
  let y = -2.3;
  while(y < I.H + 2){ a.push(y); y += th.course * (0.78 + q() * 0.5); }
  a.push(y);
  return (I.rowsY = a);
}
function cFlags(g, I, s, R0){
  const th = I.th;
  g.fillStyle = th.mortar;
  g.fillRect((R0.x0 - 1) * s, (R0.y0 - 1) * s, (R0.x1 - R0.x0 + 3) * s, (R0.y1 - R0.y0 + 3) * s);
  if(th.brick) return cBricks(g, I, s, R0);
  const ys = cRowsY(I), gap = Math.max(0.6, s * 0.016);
  for(let r = 0; r < ys.length - 1; r++){
    const y = ys[r], y2 = ys[r + 1];
    if(y2 < R0.y0 - 0.2 || y > R0.y1 + 1.2) continue;
    const br = cCourse(I, r);
    for(let i = 0; i < br.length - 1; i++){
      const xa = br[i], xb = br[i + 1];
      if(xb < R0.x0 - 0.2 || xa > R0.x1 + 1.2 || !cTouchesFloor(I, xa, xb, y, y2)) continue;
      cSlab(g, s, xa * s + gap, y * s + gap, (xb - xa) * s - 2 * gap, (y2 - y) * s - 2 * gap, th, R(Math.round(xa * 64), r, 5));
    }
  }
}
function cSlab(g, s, x, y, w, h, th, q){
  if(w < 1 || h < 1) return;
  const v = (q() - 0.5) * 2 * th.floorVar, hue = q();
  let base = sh(th.floor, v);
  if(hue < 0.16) base = mix(base, '#806c58', 0.2);                        // a warmer stone, here and there
  else if(hue < 0.26) base = mix(base, '#6c7262', 0.16);                  // one with a green cast
  else if(hue > 0.86) base = mix(base, '#58627a', 0.18);                  // and a cooler one
  const rad0 = Math.min(w, h) * (0.06 + q() * 0.08);
  rr(g, x, y, w, h, rad0);
  g.fillStyle = lin(g, x, y, x + w * 0.4, y + h, [[0, sh(base, 0.05)], [1, sh(base, -0.06)]]); g.fill();
  /* lit along its upper and left edges, worn down along the others */
  const e = Math.max(1, s * 0.022);
  g.fillStyle = 'rgba(255,248,236,.13)'; g.fillRect(x + rad0 * 0.6, y, w - rad0 * 1.2, e); g.fillRect(x, y + rad0 * 0.6, e * 0.8, h - rad0 * 1.2);
  g.fillStyle = 'rgba(8,5,12,.3)'; g.fillRect(x + rad0 * 0.6, y + h - e, w - rad0 * 1.2, e); g.fillRect(x + w - e * 0.8, y + rad0 * 0.6, e * 0.8, h - rad0 * 1.2);
  if(th.polish){                                                          // smoothed by years of feet: a soft sheen
    g.fillStyle = lin(g, x, y, x + w, y + h, [[0, 'rgba(255,255,255,.08)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.07)']]);
    rr(g, x, y, w, h, rad0); g.fill();
  }
  if(s >= 20){
    g.save(); rr(g, x, y, w, h, rad0); g.clip();
    /* mottled: soft patches of a lighter and a darker stone in it */
    const m = 3 + Math.floor(q() * 4);
    for(let i = 0; i < m; i++){
      const px = x + q() * w, py = y + q() * h, r = Math.min(w, h) * (0.25 + q() * 0.45), dark = q() < 0.5;
      g.fillStyle = rad(g, px, py, 0, r, [[0, dark ? 'rgba(10,6,14,.13)' : 'rgba(255,248,236,.08)'], [1, dark ? 'rgba(10,6,14,0)' : 'rgba(255,248,236,0)']]);
      g.fillRect(px - r, py - r, r * 2, r * 2);
    }
    const n = Math.round(w * h / (s * s) * 90);
    for(let i = 0; i < n; i++){
      g.fillStyle = q() < 0.55 ? `rgba(0,0,0,${(0.08 + q() * 0.1).toFixed(2)})` : `rgba(255,250,240,${(0.05 + q() * 0.07).toFixed(2)})`;
      const r = Math.max(0.7, s * (0.004 + q() * 0.01));
      g.fillRect(x + q() * w, y + q() * h, r, r * (0.6 + q() * 0.6));
    }
    /* a few bigger pits in the stone, and the scratches of hobnails and crates dragged over it */
    for(let i = 0; i < Math.round(w * h / (s * s) * 5); i++){ const px = x + q() * w, py = y + q() * h, r = s * (0.01 + q() * 0.014); ell(g, px, py, r, r * 0.7, 'rgba(0,0,0,.2)'); ell(g, px - r * 0.3, py - r * 0.3, r * 0.5, r * 0.35, 'rgba(255,250,240,.08)'); }
    if(q() < 0.5) for(let i = 0; i < 2 + Math.floor(q() * 3); i++){ const px = x + q() * w, py = y + q() * h, a = (q() - 0.5) * 0.8, l = s * (0.06 + q() * 0.12); line(g, px, py, px + Math.cos(a) * l, py + Math.sin(a) * l, 'rgba(255,250,240,.07)', Math.max(0.6, s * 0.005)); }
    g.restore();
  }
  if(q() < 0.4){ const px = x + w * (0.25 + q() * 0.5), py = y + h * (0.35 + q() * 0.3), r = Math.min(w, h) * (0.3 + q() * 0.25);   // worn smooth
    g.fillStyle = rad(g, px, py, 0, r, [[0, 'rgba(255,246,232,.06)'], [1, 'rgba(255,246,232,0)']]); g.fillRect(px - r, py - r, r * 2, r * 2); }
  if(th.damp && q() < th.damp * 0.5){                                     // lichen, where it is wet
    for(let i = 0; i < 3; i++){ const lx = x + q() * w, ly = y + q() * h, r = s * (0.025 + q() * 0.03); ell(g, lx, ly, r, r * 0.8, 'rgba(150,170,110,.28)'); ell(g, lx + r * 0.4, ly + r * 0.2, r * 0.5, r * 0.4, 'rgba(190,200,140,.22)'); }
  }
  if(q() < 0.24){                                                         // a crack across it
    g.strokeStyle = 'rgba(14,10,20,.55)'; g.lineWidth = Math.max(0.8, s * 0.011); g.lineJoin = 'round';
    g.beginPath();
    let cx = x + w * (0.15 + q() * 0.7), cy = y + h * 0.02;
    g.moveTo(cx, cy);
    const n = 3 + Math.floor(q() * 3);
    for(let i = 1; i <= n; i++){ cx += (q() - 0.5) * w * 0.22; cy = y + h * (i / n) * (0.6 + q() * 0.4); g.lineTo(cx, cy); }
    g.stroke();
    g.strokeStyle = 'rgba(255,245,230,.09)'; g.lineWidth = Math.max(0.6, s * 0.006); g.stroke();
  }
  if(q() < 0.2){                                                          // a chipped corner
    const cs = Math.min(w, h) * (0.14 + q() * 0.14), left = q() < 0.5, top = q() < 0.5;
    const cx = left ? x : x + w, cy = top ? y : y + h;
    poly(g, [[cx, cy], [cx + (left ? cs : -cs), cy], [cx, cy + (top ? cs : -cs)]], th.mortar);
  }
}
function cBricks(g, I, s, R0){
  const th = I.th, bh = 0.25, gap = Math.max(0.6, s * 0.014);
  for(let r = Math.floor(R0.y0 / bh) - 1; r <= Math.ceil((R0.y1 + 1) / bh); r++){
    const y = r * bh, off = (r % 2) * 0.25;
    for(let xx = Math.floor(R0.x0) - 1 - off; xx < R0.x1 + 2; xx += 0.5){
      if(!cTouchesFloor(I, xx, xx + 0.5, y, y + bh)) continue;
      const q = R(Math.round(xx * 8), r, 9), v = (q() - 0.5) * 0.22;
      const base = q() < 0.12 ? mix(sh(th.floor, v), '#5a4a42', 0.4) : sh(th.floor, v);
      const X = xx * s + gap, Y = y * s + gap, w = 0.5 * s - 2 * gap, h = bh * s - 2 * gap;
      rr(g, X, Y, w, h, h * 0.15); g.fillStyle = base; g.fill();
      g.fillStyle = 'rgba(255,240,225,.10)'; g.fillRect(X, Y, w, Math.max(1, s * 0.012));
      g.fillStyle = 'rgba(10,4,0,.22)'; g.fillRect(X, Y + h - Math.max(1, s * 0.014), w, Math.max(1, s * 0.014));
      if(s >= 24) for(let i = 0; i < 5; i++){ g.fillStyle = q() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,240,220,.08)'; g.fillRect(X + q() * w, Y + q() * h, Math.max(0.8, s * 0.01), Math.max(0.8, s * 0.01)); }
    }
  }
}
/* the floor's own: dust and grit along the walls, damp, moss, straw, rubble, the sand blown in at the sea cave */
function cFloorDress(g, I, s, x, y){
  const th = I.th, X = x * s, Y = y * s, q = R(x, y, 21);
  const wN = !I.open(x, y - 1), wW = !I.open(x - 1, y), wE = !I.open(x + 1, y), wS = !I.open(x, y + 1);
  if(th.dust && (wN || wW || wE)){
    const n = Math.round(th.dust * 14);
    for(let i = 0; i < n; i++){
      const side = wN ? 'n' : wW ? 'w' : 'e';
      const px = side === 'w' ? X + q() * s * 0.22 : side === 'e' ? X + s - q() * s * 0.22 : X + q() * s;
      const py = side === 'n' ? Y + q() * s * 0.22 : Y + q() * s;
      const r = Math.max(0.8, s * (0.012 + q() * 0.02));
      ell(g, px, py, r, r * 0.75, q() < 0.5 ? 'rgba(160,150,140,.28)' : 'rgba(40,34,30,.35)');
    }
  }
  if(th.damp && q() < th.damp){
    const cx = X + s * (0.2 + q() * 0.6), cy = Y + s * (0.25 + q() * 0.5), rx = s * (0.18 + q() * 0.22), ry = rx * (0.5 + q() * 0.3);
    ell(g, cx, cy, rx, ry, 'rgba(8,18,24,.22)');
    ell(g, cx - rx * 0.25, cy - ry * 0.3, rx * 0.4, ry * 0.25, 'rgba(190,220,235,.08)');
  }
  if(th.moss && (wN || wW || wE || wS) && q() < th.moss){
    for(let i = 0; i < 6; i++){
      const mx = wW ? X + q() * s * 0.25 : wE ? X + s - q() * s * 0.25 : X + q() * s;
      const my = wN ? Y + q() * s * 0.25 : wS ? Y + s - q() * s * 0.2 : Y + q() * s;
      ell(g, mx, my, s * (0.03 + q() * 0.05), s * (0.02 + q() * 0.03), ['rgba(72,104,52,.55)', 'rgba(98,128,64,.5)', 'rgba(58,86,46,.55)'][i % 3]);
    }
  }
  if(th.straw && q() < th.straw * 4){
    g.lineCap = 'round';
    for(let i = 0; i < 4 + Math.floor(q() * 5); i++){
      const sx = X + q() * s, sy = Y + q() * s, a = q() * TAU, l = s * (0.08 + q() * 0.1);
      line(g, sx, sy, sx + Math.cos(a) * l, sy + Math.sin(a) * l, q() < 0.5 ? 'rgba(214,186,104,.75)' : 'rgba(176,146,74,.75)', Math.max(0.8, s * 0.012));
    }
  }
  if(th.rubble && q() < th.rubble * 3){
    for(let i = 0; i < 3 + Math.floor(q() * 4); i++){
      const rx = X + q() * s, ry = Y + q() * s, r = s * (0.02 + q() * 0.035);
      ell(g, rx + r * 0.3, ry + r * 0.4, r, r * 0.7, 'rgba(20,16,10,.3)');
      ell(g, rx, ry, r, r * 0.75, sh(th.floor, 0.12 + q() * 0.1));
    }
  }
  if(th.bones && q() < th.bones){
    const bx = X + s * (0.2 + q() * 0.6), by = Y + s * (0.25 + q() * 0.5), a = q() * Math.PI;
    cBone(g, bx, by, s * (0.18 + q() * 0.1), a, s);
  }
}
/* the Landing's sea cave: the beach's sand blown in over the flagstones, thicker towards the mouth, wet at it */
function cBeach(g, I, s, R0){
  const y0 = I.H - 8.5, y1 = I.H - 1.5;
  if((R0.y1 + 1) < y0) return;
  g.save();
  g.beginPath();
  for(let y = R0.y0; y <= R0.y1; y++) for(let x = R0.x0; x <= R0.x1; x++) if(I.open(x, y) && y + 1 > y0) g.rect(x * s - 0.5, y * s - 0.5, s + 1, s + 1);
  g.clip();
  g.fillStyle = lin(g, 0, y0 * s, 0, y1 * s, [[0, 'rgba(150,132,100,0)'], [0.4, 'rgba(152,134,102,.32)'], [0.75, 'rgba(150,132,100,.66)'], [1, 'rgba(118,104,84,.9)']]);
  g.fillRect((R0.x0 - 1) * s, (R0.y0 - 1) * s, (R0.x1 - R0.x0 + 3) * s, (R0.y1 - R0.y0 + 3) * s);
  for(let y = Math.max(R0.y0, Math.floor(y0)); y <= R0.y1; y++) for(let x = R0.x0; x <= R0.x1; x++){
    if(!I.open(x, y)) continue;
    const t = Math.max(0, Math.min(1, (y + 0.5 - y0) / (y1 - y0))), q = R(x, y, 271), X = x * s, Y = y * s;
    for(let i = 0; i < Math.round(s * 0.7 * t); i++){ g.fillStyle = q() < 0.5 ? 'rgba(110,86,52,.25)' : 'rgba(255,244,214,.22)'; g.fillRect(X + q() * s, Y + q() * s, Math.max(0.8, s * 0.012), Math.max(0.8, s * 0.012)); }
    if(t > 0.4){                                                          // ripples the sea left in it
      g.strokeStyle = `rgba(120,94,60,${(0.12 + t * 0.12).toFixed(3)})`; g.lineWidth = Math.max(0.8, s * 0.014);
      for(let k = 0; k < 3; k++){ const yy = Y + s * (0.18 + k * 0.32) + q() * s * 0.05; g.beginPath(); g.moveTo(X - s * 0.05, yy); g.bezierCurveTo(X + s * 0.3, yy - s * 0.05, X + s * 0.6, yy + s * 0.05, X + s * 1.05, yy - s * 0.01); g.stroke(); }
    }
    if(q() < 0.3 * t){ const sx = X + s * (0.2 + q() * 0.6), sy = Y + s * (0.2 + q() * 0.6);   // a shell
      g.fillStyle = '#efe4cf'; g.beginPath(); g.moveTo(sx, sy + s * 0.04); g.arc(sx, sy + s * 0.04, s * 0.05, Math.PI, 0); g.closePath(); g.fill();
      for(let k = -2; k <= 2; k++) line(g, sx, sy + s * 0.04, sx + k * s * 0.02, sy, 'rgba(160,130,100,.6)', Math.max(0.6, s * 0.006)); }
    if(q() < 0.35 * t){ g.strokeStyle = 'rgba(50,82,44,.7)'; g.lineWidth = Math.max(1, s * 0.016); g.beginPath(); const sx = X + q() * s, sy = Y + q() * s; g.moveTo(sx, sy); g.bezierCurveTo(sx + s * 0.08, sy - s * 0.06, sx + s * 0.1, sy + s * 0.08, sx + s * 0.22, sy + s * 0.02); g.stroke(); }   // weed
    if(q() < 0.2 * t){ const px = X + q() * s, py = Y + q() * s, r = s * (0.04 + q() * 0.04); ell(g, px + r * 0.2, py + r * 0.4, r, r * 0.6, 'rgba(0,0,0,.25)'); ell(g, px, py, r, r * 0.7, '#8a8278'); ell(g, px - r * 0.3, py - r * 0.25, r * 0.4, r * 0.25, 'rgba(255,255,255,.2)'); }   // a pebble
  }
  /* wet, and darker, nearest the water */
  g.fillStyle = lin(g, 0, (I.H - 3.2) * s, 0, (I.H - 1) * s, [[0, 'rgba(40,52,56,0)'], [1, 'rgba(40,52,56,.4)']]);
  g.fillRect((R0.x0 - 1) * s, (I.H - 3.2) * s, (R0.x1 - R0.x0 + 3) * s, 2.2 * s);
  g.restore();
}
/* the shadow the walls throw on the floor at their foot, and down their sides — fading out at its ends where the wall
   beside it stops, so no hard edge is left where a corridor comes in */
function cBand(g, x0, y0, w, h, horiz, a, rampA, rampB){
  const N = 8;
  for(let i = 0; i < N; i++){
    const f = (i + 0.5) / N, m = Math.min(1, rampA ? f * 2.2 : 1, rampB ? (1 - f) * 2.2 : 1);
    if(m <= 0) continue;
    if(horiz){ const xs = x0 + w * i / N; g.fillStyle = lin(g, 0, y0, 0, y0 + h, [[0, `rgba(6,4,10,${(a * m).toFixed(3)})`], [1, 'rgba(6,4,10,0)']]); g.fillRect(xs, y0, w / N + 0.5, h); }
    else { const ys = y0 + h * i / N; g.fillStyle = lin(g, x0, 0, x0 + w, 0, [[0, `rgba(6,4,10,${(a * m).toFixed(3)})`], [1, 'rgba(6,4,10,0)']]); g.fillRect(x0, ys, w, h / N + 0.5); }
  }
}
function cFloorShade(g, I, s, x, y){
  const X = x * s, Y = y * s, op = (a, b)=> I.open(a, b);
  if(!op(x, y - 1)) cBand(g, X, Y, s, s * 0.42, true, 0.55, op(x - 1, y) && op(x - 1, y - 1), op(x + 1, y) && op(x + 1, y - 1));
  if(!op(x - 1, y)){ g.save(); g.translate(0, 0); cBandV(g, X, Y, s * 0.2, s, 0.42, op(x, y - 1) && op(x - 1, y - 1), op(x, y + 1) && op(x - 1, y + 1), false); g.restore(); }
  if(!op(x + 1, y)) cBandV(g, X + s, Y, s * 0.2, s, 0.36, op(x, y - 1) && op(x + 1, y - 1), op(x, y + 1) && op(x + 1, y + 1), true);
  if(!op(x, y + 1)){ g.fillStyle = lin(g, 0, Y + s, 0, Y + s * 0.88, [[0, 'rgba(6,4,10,.3)'], [1, 'rgba(6,4,10,0)']]); g.fillRect(X, Y + s * 0.88, s, s * 0.12); }
}
/* a side wall's shadow: from the wall (x0) inwards, w wide (to the left if `right`) */
function cBandV(g, x0, y0, w, h, a, rampA, rampB, right){
  const N = 8;
  for(let i = 0; i < N; i++){
    const f = (i + 0.5) / N, m = Math.min(1, rampA ? f * 2.2 : 1, rampB ? (1 - f) * 2.2 : 1);
    const ys = y0 + h * i / N, xa = right ? x0 - w : x0;
    g.fillStyle = lin(g, x0, 0, right ? x0 - w : x0 + w, 0, [[0, `rgba(6,4,10,${(a * m).toFixed(3)})`], [1, 'rgba(6,4,10,0)']]);
    g.fillRect(xa, ys, w, h / N + 0.5);
  }
}

/* ---------- the water, the bridges, the sand ---------- */
const WATERY = c=> c === '~';
function cWaterPass(g, I, s, R0){
  const tiles = [];
  for(let y = R0.y0 - 2; y <= R0.y1 + 2; y++) for(let x = R0.x0 - 2; x <= R0.x1 + 2; x++) if(I.wet(x, y)) tiles.push([x, y]);
  if(!tiles.length) return;
  g.save();
  g.beginPath(); tiles.forEach(([x, y])=> g.rect(x * s - 0.5, y * s - 0.5, s + 1, s + 1)); g.clip();
  g.fillStyle = '#0f2a31'; g.fillRect((R0.x0 - 2) * s, (R0.y0 - 2) * s, (R0.x1 - R0.x0 + 5) * s, (R0.y1 - R0.y0 + 5) * s);
  /* darker where it is deeper, the dark running on from square to square */
  tiles.forEach(([x, y])=>{
    const dd = I.depthAt(x, y);
    if(dd < 2) return;
    const a = Math.min(0.5, 0.13 * (dd - 1));
    g.fillStyle = rad(g, (x + 0.5) * s, (y + 0.5) * s, 0, s * 1.35, [[0, `rgba(2,9,13,${a.toFixed(3)})`], [1, 'rgba(2,9,13,0)']]);
    g.fillRect((x - 1) * s, (y - 1) * s, 3 * s, 3 * s);
  });
  /* light far down in it, and on its skin */
  tiles.forEach(([x, y])=>{
    const q = R(x, y, 31);
    if(q() < 0.3) ell(g, (x + q()) * s, (y + q()) * s, s * (0.2 + q() * 0.3), s * (0.08 + q() * 0.1), 'rgba(60,120,130,.08)');
    for(let i = 0; i < 3; i++){
      const lx = (x + q()) * s, ly = (y + q()) * s, l = s * (0.15 + q() * 0.25);
      g.strokeStyle = `rgba(150,205,225,${(0.05 + q() * 0.07).toFixed(3)})`; g.lineWidth = Math.max(0.8, s * 0.012);
      g.beginPath(); g.moveTo(lx, ly); g.quadraticCurveTo(lx + l / 2, ly - s * 0.03, lx + l, ly); g.stroke();
    }
  });
  g.restore();
  /* where it meets the stone: the rim's shadow on it, and a wet line */
  tiles.forEach(([x, y])=>{
    if(x < R0.x0 || x > R0.x1 || y < R0.y0 || y > R0.y1) return;
    const X = x * s, Y = y * s, b = Math.max(1.5, s * 0.07);
    if(!I.wet(x, y - 1)){ g.fillStyle = lin(g, 0, Y, 0, Y + b * 2.6, [[0, 'rgba(0,0,0,.6)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X, Y, s, b * 2.6); g.fillStyle = 'rgba(170,205,215,.16)'; g.fillRect(X, Y + b * 0.5, s, Math.max(0.8, s * 0.01)); }
    if(!I.wet(x, y + 1)){ g.fillStyle = 'rgba(120,160,170,.12)'; g.fillRect(X, Y + s - b * 0.7, s, b * 0.7); }
    if(!I.wet(x - 1, y)){ g.fillStyle = lin(g, X, 0, X + b * 2, 0, [[0, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X, Y, b * 2, s); }
    if(!I.wet(x + 1, y)){ g.fillStyle = lin(g, X + s, 0, X + s - b * 2, 0, [[0, 'rgba(0,0,0,.42)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X + s - b * 2, Y, b * 2, s); }
  });
}
/* the stones round the water: a coping, lit on top, its face going down into it */
function cCoping(g, I, s, x, y){
  const X = x * s, Y = y * s, th = I.th, c = sh(th.floor, 0.06);
  const b = s * 0.13;
  if(I.wet(x, y + 1)){
    g.fillStyle = c; g.fillRect(X, Y + s - b, s, b);
    g.fillStyle = 'rgba(255,250,240,.14)'; g.fillRect(X, Y + s - b, s, Math.max(1, s * 0.016));
    g.fillStyle = sh(th.floor, -0.35); g.fillRect(X, Y + s - Math.max(1, s * 0.03), s, Math.max(1, s * 0.03));
    for(let k = 0; k < 3; k++){ const sx = X + (k + R(x, y, 40)()) * s / 3; line(g, sx, Y + s - b, sx, Y + s, 'rgba(0,0,0,.3)', Math.max(0.8, s * 0.01)); }
  }
  if(I.wet(x, y - 1)){ g.fillStyle = sh(th.floor, -0.1); g.fillRect(X, Y, s, b * 0.6); g.fillStyle = 'rgba(255,250,240,.1)'; g.fillRect(X, Y + b * 0.6, s, Math.max(1, s * 0.014)); }
  if(I.wet(x - 1, y)){ g.fillStyle = c; g.fillRect(X, Y, b * 0.7, s); g.fillStyle = 'rgba(255,250,240,.1)'; g.fillRect(X + b * 0.7, Y, Math.max(1, s * 0.012), s); }
  if(I.wet(x + 1, y)){ g.fillStyle = c; g.fillRect(X + s - b * 0.7, Y, b * 0.7, s); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X + s - b * 0.7, Y, Math.max(1, s * 0.012), s); }
}
function cBridge(g, I, s, x, y){
  const X = x * s, Y = y * s;
  const across = WATERY(I.at(x - 1, y)) || WATERY(I.at(x + 1, y)) || I.at(x - 1, y) === '=' || I.at(x + 1, y) === '=';
  const run = across ? (I.at(x - 1, y) === '=' || I.at(x + 1, y) === '=') : true;
  g.save();
  if(!across || !run){ /* runs down the page */ }
  const horiz = I.at(x - 1, y) === '=' || I.at(x + 1, y) === '=' ? true : (I.at(x, y - 1) === '=' || I.at(x, y + 1) === '=') ? false : !across;
  /* the planks lie across the way you walk: a bridge running left-right has its planks up and down */
  const n = 5, q = R(x, y, 51), m = s * 0.08;
  g.fillStyle = 'rgba(0,0,0,.4)';
  if(horiz) g.fillRect(X, Y + m * 1.6, s, s - m * 2.2); else g.fillRect(X + m * 1.6, Y, s - m * 2.2, s);
  for(let i = 0; i < n; i++){
    const v = (q() - 0.5) * 0.18, base = sh('#6b4a2c', v);
    if(horiz){
      const px = X + i * s / n + 0.8, pw = s / n - 1.6;
      g.fillStyle = lin(g, px, 0, px + pw, 0, [[0, sh(base, 0.12)], [1, sh(base, -0.12)]]); g.fillRect(px, Y + m, pw, s - 2 * m);
      g.fillStyle = 'rgba(30,15,5,.3)'; for(let k = 0; k < 2; k++) g.fillRect(px + pw * (0.3 + q() * 0.4), Y + m + q() * (s - 2 * m) * 0.5, Math.max(0.7, s * 0.006), (s - 2 * m) * (0.2 + q() * 0.3));
      circ(g, px + pw / 2, Y + m + s * 0.08, Math.max(0.8, s * 0.014), '#2c2620'); circ(g, px + pw / 2, Y + s - m - s * 0.08, Math.max(0.8, s * 0.014), '#2c2620');
    } else {
      const py = Y + i * s / n + 0.8, ph = s / n - 1.6;
      g.fillStyle = lin(g, 0, py, 0, py + ph, [[0, sh(base, 0.14)], [1, sh(base, -0.14)]]); g.fillRect(X + m, py, s - 2 * m, ph);
      g.fillStyle = 'rgba(30,15,5,.3)'; for(let k = 0; k < 2; k++) g.fillRect(X + m + q() * (s - 2 * m) * 0.5, py + ph * (0.3 + q() * 0.4), (s - 2 * m) * (0.2 + q() * 0.3), Math.max(0.7, s * 0.006));
      circ(g, X + m + s * 0.08, py + ph / 2, Math.max(0.8, s * 0.014), '#2c2620'); circ(g, X + s - m - s * 0.08, py + ph / 2, Math.max(0.8, s * 0.014), '#2c2620');
    }
  }
  /* its rails: a rope along each side, on posts */
  g.strokeStyle = 'rgba(190,160,110,.75)'; g.lineWidth = Math.max(1, s * 0.022);
  g.beginPath();
  if(horiz){ g.moveTo(X, Y + m * 0.6); g.quadraticCurveTo(X + s / 2, Y + m * 1.3, X + s, Y + m * 0.6); g.moveTo(X, Y + s - m * 0.6); g.quadraticCurveTo(X + s / 2, Y + s - m * 0.1, X + s, Y + s - m * 0.6); }
  else { g.moveTo(X + m * 0.6, Y); g.quadraticCurveTo(X + m * 1.3, Y + s / 2, X + m * 0.6, Y + s); g.moveTo(X + s - m * 0.6, Y); g.quadraticCurveTo(X + s - m * 0.1, Y + s / 2, X + s - m * 0.6, Y + s); }
  g.stroke();
  g.restore();
}
/* the Fight Pit's sand: one body of it (as the water is), its colour running on from square to square — worked over,
   raked, scuffed and trodden where they fight, its edge drifting over the stone */
function cSandPass(g, I, s, R0){
  const tiles = [];
  for(let y = R0.y0 - 2; y <= R0.y1 + 2; y++) for(let x = R0.x0 - 2; x <= R0.x1 + 2; x++) if(I.at(x, y) === 's') tiles.push([x, y]);
  if(!tiles.length) return;
  g.save();
  g.beginPath(); tiles.forEach(([x, y])=> g.rect(x * s - 0.5, y * s - 0.5, s + 1, s + 1)); g.clip();
  g.fillStyle = '#a38a62'; g.fillRect((R0.x0 - 2) * s, (R0.y0 - 2) * s, (R0.x1 - R0.x0 + 5) * s, (R0.y1 - R0.y0 + 5) * s);
  tiles.forEach(([x, y])=>{
    const q = R(x, y, 61);
    for(let i = 0; i < 3; i++){ const px = (x + q()) * s, py = (y + q()) * s, r = s * (0.4 + q() * 0.6), dark = q() < 0.55;
      g.fillStyle = rad(g, px, py, 0, r, [[0, dark ? 'rgba(96,68,42,.16)' : 'rgba(255,236,200,.1)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(px - r, py - r, r * 2, r * 2); }
  });
  tiles.forEach(([x, y])=>{
    if(x < R0.x0 - 1 || x > R0.x1 + 1 || y < R0.y0 - 1 || y > R0.y1 + 1) return;
    const q = R(x, y, 62), X = x * s, Y = y * s;
    for(let i = 0; i < Math.round(s * 0.9); i++){ g.fillStyle = q() < 0.5 ? 'rgba(100,74,44,.24)' : 'rgba(255,240,205,.2)'; g.fillRect(X + q() * s, Y + q() * s, Math.max(0.8, s * 0.011), Math.max(0.8, s * 0.011)); }
    g.strokeStyle = 'rgba(110,82,50,.2)'; g.lineWidth = Math.max(0.8, s * 0.012);   // raked
    for(let k = 0; k < 3; k++){ const yy = Y + s * (0.2 + k * 0.3) + q() * s * 0.05; g.beginPath(); g.moveTo(X - s * 0.02, yy); g.quadraticCurveTo(X + s / 2, yy + s * (q() - 0.5) * 0.1, X + s * 1.02, yy); g.stroke(); }
    if(q() < 0.4){ const fx = X + s * (0.2 + q() * 0.6), fy = Y + s * (0.2 + q() * 0.6), a = q() * TAU;   // trodden
      for(let k = 0; k < 2; k++){ g.save(); g.translate(fx + Math.cos(a) * s * 0.14 * k, fy + Math.sin(a) * s * 0.14 * k); g.rotate(a + Math.PI / 2); ell(g, (k ? 1 : -1) * s * 0.03, 0, s * 0.035, s * 0.06, 'rgba(96,70,40,.28)'); g.restore(); } }
    if(q() < 0.15){ const px = X + s * (0.2 + q() * 0.6), py = Y + s * (0.2 + q() * 0.6), r = s * (0.03 + q() * 0.03); ell(g, px + r * 0.3, py + r * 0.4, r, r * 0.6, 'rgba(0,0,0,.25)'); ell(g, px, py, r, r * 0.7, '#8a8278'); }
  });
  g.restore();
  /* its edge: a little drift over the stone round it */
  tiles.forEach(([x, y])=>{
    if(x < R0.x0 - 1 || x > R0.x1 + 1 || y < R0.y0 - 1 || y > R0.y1 + 1) return;
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy])=>{
      const a = x + dx, b = y + dy;
      if(I.at(a, b) === 's' || !I.open(a, b)) return;
      const q = R(a * 7 + dx, b * 7 + dy, 63);
      for(let i = 0; i < 6; i++){
        const px = dx ? (dx > 0 ? a * s + q() * s * 0.18 : (a + 1) * s - q() * s * 0.18) : a * s + q() * s;
        const py = dy ? (dy > 0 ? b * s + q() * s * 0.18 : (b + 1) * s - q() * s * 0.18) : b * s + q() * s;
        ell(g, px, py, s * (0.03 + q() * 0.05), s * (0.02 + q() * 0.03), 'rgba(163,138,98,.55)');
      }
    });
  });
}
/* ---------- the walls ---------- */
function cFaceBreaks(I, y, row){
  const key = y * 8 + row;
  let a = I.faces.get(key);
  if(a) return a;
  const q = R(y, row, 71);
  a = [];
  let x = -1 - q() * 0.6;
  while(x < I.W + 1){ a.push(x); x += 0.32 + q() * 0.42; }
  a.push(x);
  I.faces.set(key, a);
  return a;
}
const FACE_TOP = 0.16;        // a wall's face, where the floor runs up to it: the lower part of its square
function cWall(g, I, s, x, y){
  const X = x * s, Y = y * s, th = I.th, c = I.at(x, y), q = R(x, y, 81);
  const face = I.open(x, y + 1);
  const oN = I.open(x, y - 1), oW = I.open(x - 1, y), oE = I.open(x + 1, y);
  /* the rock, seen from above: dark, rough, a lip of lit stone where the floor runs up to it */
  g.fillStyle = th.wallTop; g.fillRect(X, Y, s, s);
  for(let i = 0; i < 9; i++){ const rx = X + q() * s, ry = Y + q() * s, r = s * (0.05 + q() * 0.1); g.fillStyle = rad(g, rx, ry, 0, r, [[0, q() < 0.4 ? 'rgba(255,245,235,.035)' : 'rgba(0,0,0,.18)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(rx - r, ry - r, r * 2, r * 2); }
  if(s >= 24) for(let i = 0; i < 26; i++){ g.fillStyle = q() < 0.55 ? 'rgba(0,0,0,.22)' : 'rgba(255,250,245,.04)'; const r = Math.max(0.7, s * (0.006 + q() * 0.01)); g.fillRect(X + q() * s, Y + q() * s, r, r); }
  const lip = Math.max(1, s * 0.04);
  if(oN){ g.fillStyle = sh(th.wall, -0.18); g.fillRect(X, Y, s, lip * 1.4); g.fillStyle = 'rgba(255,245,235,.14)'; g.fillRect(X, Y + lip * 1.1, s, Math.max(1, lip * 0.35)); }
  if(oW){ g.fillStyle = sh(th.wall, -0.22); g.fillRect(X, Y, lip, face ? s * FACE_TOP : s); }
  if(oE){ g.fillStyle = sh(th.wall, -0.32); g.fillRect(X + s - lip, Y, lip, face ? s * FACE_TOP : s); }
  const way = I.beyond.get(x + ',' + y);
  if(way) return cOpening(g, I, s, x, y, way, face);
  if(c === 'h' && !face) return cChalkSide(g, I, s, x, y, oW, oE, oN);
  if(!face) return;
  /* the face: rough-cut blocks in three courses, running on from square to square */
  const ft = Y + s * FACE_TOP, fh = s - s * FACE_TOP;
  g.fillStyle = sh(th.wall, -0.45); g.fillRect(X, ft, s, fh);
  if(th.skulls) cSkullFace(g, I, s, x, y, ft, fh);
  else {
    const rows = 3, rh = fh / rows, gap = Math.max(0.7, s * 0.014);
    for(let r = 0; r < rows; r++){
      const br = cFaceBreaks(I, y, r), yy = ft + r * rh;
      for(let i = 0; i < br.length - 1; i++){
        const xa = br[i] * s, xb = br[i + 1] * s;
        if(xb < X - 1 || xa > X + s + 1) continue;
        const qb = R(Math.round(br[i] * 50), y * 3 + r, 83), v = (qb() - 0.5) * 0.24 - r * 0.04;
        g.save(); g.beginPath(); g.rect(X, ft, s, fh); g.clip();
        const inset = qb() * rh * 0.12, bw = xb - xa - 2 * gap, bh = rh - 2 * gap - inset;
        rr(g, xa + gap, yy + gap + inset * 0.5, bw, bh, Math.min(bh, bw) * (0.14 + qb() * 0.16));
        g.fillStyle = lin(g, 0, yy, 0, yy + rh, [[0, sh(th.wall, v + 0.06)], [1, sh(th.wall, v - 0.08)]]); g.fill();
        g.fillStyle = 'rgba(255,245,232,.15)'; g.fillRect(xa + gap + bw * 0.06, yy + gap + inset * 0.5, bw * 0.88, Math.max(1, s * 0.016));
        g.fillStyle = 'rgba(0,0,0,.26)'; g.fillRect(xa + gap, yy + gap + inset * 0.5 + bh - Math.max(1, s * 0.022), bw, Math.max(1, s * 0.022));
        if(s >= 20){
          for(let k = 0; k < 14; k++){ g.fillStyle = qb() < 0.55 ? 'rgba(0,0,0,.16)' : 'rgba(255,250,240,.08)'; const r = Math.max(0.7, s * (0.006 + qb() * 0.01)); g.fillRect(xa + qb() * (xb - xa), yy + qb() * rh, r, r); }
          if(qb() < 0.3){ const px = xa + bw * (0.2 + qb() * 0.6), py = yy + rh * 0.5, r = rh * 0.6; g.fillStyle = rad(g, px, py, 0, r, [[0, 'rgba(0,0,0,.16)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(px - r, py - r, r * 2, r * 2); }
          if(qb() < 0.18){ g.strokeStyle = 'rgba(10,6,14,.5)'; g.lineWidth = Math.max(0.7, s * 0.01); g.beginPath(); const px = xa + bw * (0.2 + qb() * 0.6); g.moveTo(px, yy + gap); g.lineTo(px + (qb() - 0.5) * bw * 0.3, yy + rh * 0.5); g.lineTo(px + (qb() - 0.5) * bw * 0.3, yy + rh - gap); g.stroke(); }
        }
        g.restore();
      }
    }
  }
  if(s >= 20) for(let k = 0; k < 2; k++){ if(q() < 0.4){ const sx = X + s * (0.1 + q() * 0.8), sw = s * (0.04 + q() * 0.08); g.fillStyle = lin(g, 0, ft, 0, ft + fh * (0.4 + q() * 0.5), [[0, 'rgba(8,6,12,.28)'], [1, 'rgba(8,6,12,0)']]); g.fillRect(sx, ft, sw, fh); } }
  /* lit along its top, darker as it goes down, black at its foot */
  g.fillStyle = sh(th.wall, 0.2); g.fillRect(X, ft - Math.max(1, s * 0.03), s, Math.max(1.5, s * 0.04));
  g.fillStyle = lin(g, 0, ft, 0, Y + s, [[0, 'rgba(255,240,225,.05)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(4,2,8,.45)']]); g.fillRect(X, ft, s, fh);
  /* its ends, where it turns a corner */
  if(oW){ g.fillStyle = lin(g, X, 0, X + s * 0.16, 0, [[0, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X, ft, s * 0.16, fh); }
  if(oE){ g.fillStyle = lin(g, X + s, 0, X + s * 0.84, 0, [[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X + s * 0.84, ft, s * 0.16, fh); }
  /* what is on it */
  if(c === 'h') return cChalk(g, I, s, x, y, ft, fh);
  if(!th.skulls && q() < th.niche) cNiche(g, s, X + s * 0.5, ft + fh * 0.5, th, q);
  else if(q() < 0.12) cRing(g, s, X + s * (0.3 + q() * 0.4), ft + fh * 0.4);
  if(th.damp && q() < th.damp * 0.8){                                   // a damp stain running down
    const sx = X + s * (0.2 + q() * 0.6);
    g.fillStyle = lin(g, 0, ft, 0, Y + s, [[0, 'rgba(10,20,26,0)'], [0.4, 'rgba(10,20,26,.22)'], [1, 'rgba(10,20,26,.32)']]);
    g.beginPath(); g.moveTo(sx - s * 0.06, ft + fh * 0.2); g.quadraticCurveTo(sx - s * 0.12, Y + s * 0.8, sx - s * 0.1, Y + s); g.lineTo(sx + s * 0.12, Y + s); g.quadraticCurveTo(sx + s * 0.1, Y + s * 0.8, sx + s * 0.05, ft + fh * 0.2); g.closePath(); g.fill();
  }
  if(th.moss && q() < th.moss){
    for(let i = 0; i < 7; i++) ell(g, X + q() * s, Y + s - q() * fh * 0.35, s * (0.03 + q() * 0.05), s * (0.02 + q() * 0.03), ['rgba(72,104,52,.65)', 'rgba(100,132,66,.6)', 'rgba(56,84,44,.65)'][i % 3]);
  }
}
/* beyond a way out, the rock it goes into: up a stair or through a door, an arch in the wall's face; along a side
   wall, a passage going off into the dark; the sea cave, its mouth, the day coming in off the water */
function cOpening(g, I, s, x, y, w, face){
  const X = x * s, Y = y * s, th = I.th;
  if(w.verb === 'Out'){
    g.fillStyle = lin(g, 0, Y, 0, Y + s, [[0, 'rgba(160,190,200,.55)'], [1, 'rgba(210,235,245,.9)']]); g.fillRect(X - s * 0.1, Y, s * 1.2, s);
    g.fillStyle = lin(g, 0, Y + s * 0.45, 0, Y + s, [[0, 'rgba(90,150,170,0)'], [1, 'rgba(90,160,185,.6)']]); g.fillRect(X, Y + s * 0.45, s, s * 0.55);
    for(let k = 0; k < 3; k++) line(g, X + s * (0.15 + k * 0.25), Y + s * (0.62 + k * 0.1), X + s * (0.4 + k * 0.25), Y + s * (0.62 + k * 0.1), 'rgba(255,255,255,.45)', Math.max(1, s * 0.018));
    [[0, 0.16], [1, 0.16]].forEach(([e])=>{ g.fillStyle = sh(th.wall, -0.3); g.beginPath(); const ex = X + (e ? s : 0); g.moveTo(ex, Y); g.quadraticCurveTo(ex + (e ? -s * 0.22 : s * 0.22), Y + s * 0.4, ex + (e ? -s * 0.1 : s * 0.1), Y + s); g.lineTo(ex, Y + s); g.closePath(); g.fill(); });
    return;
  }
  if(w.side === 'u' && face){
    const ft = Y + s * FACE_TOP, aw = s * 0.74, ax = X + (s - aw) / 2, top = ft - s * 0.1;
    /* the voussoirs round it, then the dark inside */
    g.fillStyle = sh(th.wall, 0.06); g.beginPath(); g.moveTo(ax - s * 0.07, Y + s); g.lineTo(ax - s * 0.07, top + aw / 2); g.arc(X + s / 2, top + aw / 2, aw / 2 + s * 0.07, Math.PI, 0); g.lineTo(ax + aw + s * 0.07, Y + s); g.closePath(); g.fill();
    for(let k = 0; k <= 6; k++){ const a = Math.PI + k * Math.PI / 6; line(g, X + s / 2 + Math.cos(a) * aw / 2, top + aw / 2 + Math.sin(a) * aw / 2, X + s / 2 + Math.cos(a) * (aw / 2 + s * 0.07), top + aw / 2 + Math.sin(a) * (aw / 2 + s * 0.07), 'rgba(0,0,0,.35)', Math.max(0.8, s * 0.012)); }
    g.fillStyle = lin(g, 0, top, 0, Y + s, [[0, '#040306'], [1, '#141119']]);
    g.beginPath(); g.moveTo(ax, Y + s); g.lineTo(ax, top + aw / 2); g.arc(X + s / 2, top + aw / 2, aw / 2, Math.PI, 0); g.lineTo(ax + aw, Y + s); g.closePath(); g.fill();
    if(w.verb === 'Up') for(let k = 0; k < 4; k++){ const ty = Y + s - (k + 1) * s * 0.11; g.fillStyle = `rgba(${90 - k * 18},${86 - k * 17},${96 - k * 18},${(0.8 - k * 0.18).toFixed(2)})`; g.fillRect(ax + s * 0.04, ty, aw - s * 0.08, s * 0.06); }
    return;
  }
  /* a passage off to the side, or down: the floor going on into the dark */
  const dir = w.side, g0 = { l:[X + s, Y, X, Y], r:[X, Y, X + s, Y], d:[X, Y, X, Y + s], u:[X, Y + s, X, Y] }[dir];
  g.fillStyle = sh(th.floor, -0.25); g.fillRect(X, Y, s, s);
  g.fillStyle = lin(g, g0[0], g0[1], g0[2], g0[3], [[0, 'rgba(6,4,10,.35)'], [1, 'rgba(6,4,10,.97)']]); g.fillRect(X, Y, s, s);
  g.fillStyle = 'rgba(0,0,0,.5)';
  if(dir === 'l' || dir === 'r'){ g.fillRect(X, Y, s, s * 0.14); g.fillRect(X, Y + s * 0.9, s, s * 0.1); }
  else { g.fillRect(X, Y, s * 0.12, s); g.fillRect(X + s * 0.88, Y, s * 0.12, s); }
}
/* a burial niche cut into the face: an arch, black inside, and the one laid to rest in it */
function cNiche(g, s, cx, cy, th, q){
  const w = s * 0.5, h = s * 0.4, x = cx - w / 2, y = cy - h / 2;
  g.fillStyle = sh(th.wall, 0.12);
  g.beginPath(); g.moveTo(x - s * 0.03, y + h + s * 0.03); g.lineTo(x - s * 0.03, y + w / 2); g.arc(cx, y + w / 2, w / 2 + s * 0.03, Math.PI, 0); g.lineTo(x + w + s * 0.03, y + h + s * 0.03); g.closePath(); g.fill();
  g.fillStyle = lin(g, 0, y, 0, y + h, [[0, '#07060a'], [1, '#17141c']]);
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(cx, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.fill();
  const kind = q();
  if(kind < th.niche * 1.6 || kind < 0.6) cSkull(g, cx, y + h * 0.68, s * 0.13, 0.92);
  else { cBone(g, cx - w * 0.15, y + h * 0.82, w * 0.55, 0.15, s, 0.85); cBone(g, cx + w * 0.1, y + h * 0.88, w * 0.45, -0.1, s, 0.8); }
  g.fillStyle = sh(th.wall, 0.22); g.fillRect(x - s * 0.04, y + h, w + s * 0.08, Math.max(1.5, s * 0.04));
}
function cRing(g, s, cx, cy){
  circ(g, cx, cy - s * 0.02, s * 0.025, '#2e2b30');
  g.strokeStyle = '#4b4650'; g.lineWidth = Math.max(1, s * 0.022);
  g.beginPath(); g.arc(cx, cy + s * 0.05, s * 0.06, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(200,190,210,.25)'; g.lineWidth = Math.max(0.6, s * 0.008); g.beginPath(); g.arc(cx, cy + s * 0.05, s * 0.06, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
}
/* the Skull Wall: skulls packed in rows, every one of them watching */
function cSkullFace(g, I, s, x, y, ft, fh){
  const X = x * s;
  g.fillStyle = '#16120f'; g.fillRect(X, ft, s, fh);
  for(let r = 0; r < 3; r++){
    const n = 3, yy = ft + fh * (0.2 + r * 0.31), off = (r % 2) * s / (n * 2);
    for(let i = -1; i <= n; i++){
      const cx = X + off + (i + 0.5) * s / n;
      if(cx < X - s * 0.2 || cx > X + s * 1.2) continue;
      g.save(); g.beginPath(); g.rect(X, ft, s, fh); g.clip();
      cSkull(g, cx, yy, s * 0.13, 0.75 + R(x * 7 + i, y * 3 + r, 91)() * 0.25);
      g.restore();
    }
  }
}
/* Nino's drawings on the wall, in chalk: two little stick people */
function cChalk(g, I, s, x, y, ft, fh){
  const X = x * s, fresh = (I.d.chalkFresh || []).some(([fx, fy])=> fx === x && fy === y);
  g.strokeStyle = fresh ? 'rgba(252,250,244,.95)' : 'rgba(236,232,218,.62)'; g.lineWidth = Math.max(1.2, s * 0.03); g.lineCap = 'round'; g.lineJoin = 'round';
  const fig = (cx, top, h)=>{
    g.beginPath(); g.arc(cx, top + h * 0.16, h * 0.16, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(cx, top + h * 0.32); g.lineTo(cx, top + h * 0.7);
    g.moveTo(cx - h * 0.22, top + h * 0.45); g.lineTo(cx + h * 0.22, top + h * 0.45);
    g.moveTo(cx, top + h * 0.7); g.lineTo(cx - h * 0.18, top + h);
    g.moveTo(cx, top + h * 0.7); g.lineTo(cx + h * 0.18, top + h); g.stroke();
  };
  fig(X + s * 0.36, ft + fh * 0.1, fh * 0.62); fig(X + s * 0.66, ft + fh * 0.3, fh * 0.44);
  g.beginPath(); g.moveTo(X + s * 0.12, ft + fh * 0.86); g.lineTo(X + s * 0.88, ft + fh * 0.83); g.stroke();
  if(fresh){ g.fillStyle = 'rgba(255,255,250,.5)'; for(let k = 0; k < 5; k++) circ(g, X + s * (0.2 + k * 0.15), Y0(y, s) + s * 0.97, Math.max(0.8, s * 0.012), 'rgba(255,255,250,.55)'); }
}
const Y0 = (y, s)=> y * s;
/* …and on a wall beside the way (its face towards the floor, seen as a strip along that side): the same two little people */
function cChalkSide(g, I, s, x, y, oW, oE, oN){
  const X = x * s, Y = y * s, th = I.th, fresh = (I.d.chalkFresh || []).some(([fx, fy])=> fx === x && fy === y);
  const w = s * 0.46, sx = oE ? X + s - w : X;
  g.fillStyle = lin(g, oE ? sx + w : sx, 0, oE ? sx : sx + w, 0, [[0, sh(th.wall, -0.05)], [1, sh(th.wall, -0.3)]]); g.fillRect(sx, Y, w, s);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(oE ? sx : sx + w - Math.max(1, s * 0.03), Y, Math.max(1, s * 0.03), s);
  for(let k = 1; k < 3; k++) line(g, sx, Y + s * k / 3, sx + w, Y + s * k / 3, 'rgba(0,0,0,.18)', Math.max(0.7, s * 0.01));
  g.strokeStyle = fresh ? 'rgba(252,250,244,.95)' : 'rgba(236,232,218,.62)'; g.lineWidth = Math.max(1, s * 0.022); g.lineCap = 'round'; g.lineJoin = 'round';
  const fig = (cx, top, h)=>{
    g.beginPath(); g.arc(cx, top + h * 0.16, h * 0.16, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(cx, top + h * 0.32); g.lineTo(cx, top + h * 0.7);
    g.moveTo(cx - h * 0.22, top + h * 0.45); g.lineTo(cx + h * 0.22, top + h * 0.45);
    g.moveTo(cx, top + h * 0.7); g.lineTo(cx - h * 0.18, top + h);
    g.moveTo(cx, top + h * 0.7); g.lineTo(cx + h * 0.18, top + h); g.stroke();
  };
  fig(sx + w * 0.38, Y + s * 0.18, s * 0.42); fig(sx + w * 0.7, Y + s * 0.34, s * 0.3);
  g.beginPath(); g.moveTo(sx + w * 0.1, Y + s * 0.7); g.lineTo(sx + w * 0.9, Y + s * 0.68); g.stroke();
}

/* ---------- the dead, and what was left of them ---------- */
function cSkull(g, cx, cy, r, light){
  const L = light == null ? 1 : light, bone = `rgb(${Math.round(232 * L)},${Math.round(222 * L)},${Math.round(200 * L)})`;
  ell(g, cx + r * 0.12, cy + r * 0.92, r * 0.95, r * 0.25, 'rgba(0,0,0,.35)');
  g.fillStyle = bone;
  g.beginPath(); g.arc(cx, cy - r * 0.1, r, Math.PI * 0.95, Math.PI * 0.05); g.quadraticCurveTo(cx + r * 0.95, cy + r * 0.55, cx + r * 0.5, cy + r * 0.62);
  g.lineTo(cx + r * 0.42, cy + r * 0.9); g.lineTo(cx - r * 0.42, cy + r * 0.9); g.lineTo(cx - r * 0.5, cy + r * 0.62); g.quadraticCurveTo(cx - r * 0.95, cy + r * 0.55, cx - r * 0.95, cy - r * 0.05); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx - r * 0.35, cy - r * 0.55, r * 0.32, r * 0.18, -0.4, 0, TAU); g.fill();
  const hole = '#1b1512';
  ell(g, cx - r * 0.38, cy + r * 0.12, r * 0.26, r * 0.3, hole); ell(g, cx + r * 0.38, cy + r * 0.12, r * 0.26, r * 0.3, hole);
  poly(g, [[cx, cy + r * 0.38], [cx - r * 0.1, cy + r * 0.58], [cx + r * 0.1, cy + r * 0.58]], hole);
  g.strokeStyle = 'rgba(40,30,25,.55)'; g.lineWidth = Math.max(0.6, r * 0.07);
  for(let k = -2; k <= 2; k++) line(g, cx + k * r * 0.14, cy + r * 0.72, cx + k * r * 0.14, cy + r * 0.88, 'rgba(40,30,25,.55)', Math.max(0.6, r * 0.06));
}
function cBone(g, cx, cy, len, a, s, light){
  const L = light == null ? 1 : light, col = `rgb(${Math.round(226 * L)},${Math.round(216 * L)},${Math.round(194 * L)})`;
  g.save(); g.translate(cx, cy); g.rotate(a);
  const t = Math.max(1, len * 0.12);
  ell(g, len * 0.05, t * 0.9, len * 0.5, t * 0.6, 'rgba(0,0,0,.3)');
  g.fillStyle = col; g.fillRect(-len / 2 + t, -t / 2, len - 2 * t, t);
  [-1, 1].forEach(e=>{ circ(g, e * (len / 2 - t * 0.8), -t * 0.45, t * 0.7, col); circ(g, e * (len / 2 - t * 0.8), t * 0.45, t * 0.7, col); });
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-len / 2 + t, -t / 2, len - 2 * t, Math.max(0.6, t * 0.3));
  g.restore();
}
function cBonePile(g, I, s, x, y){
  const X = x * s, Y = y * s, q = R(x, y, 101);
  ell(g, X + s * 0.5, Y + s * 0.62, s * 0.42, s * 0.26, 'rgba(20,14,10,.3)');
  for(let i = 0; i < 6; i++) cBone(g, X + s * (0.22 + q() * 0.56), Y + s * (0.38 + q() * 0.42), s * (0.22 + q() * 0.16), q() * Math.PI, s, 0.8 + q() * 0.2);
  cSkull(g, X + s * (0.35 + q() * 0.3), Y + s * (0.42 + q() * 0.2), s * 0.12, 0.95);
  if(q() < 0.6) cSkull(g, X + s * (0.2 + q() * 0.6), Y + s * (0.55 + q() * 0.2), s * 0.1, 0.85);
}

/* ---------- what stands down here ---------- */
function cShadow(g, X, Y, s, w, h){ ell(g, X + s * 0.56, Y + s * 0.9, s * w, s * h, 'rgba(6,4,10,.42)'); }
/* a pillar: round, standing up out of its square and over the one behind it (COL_UP of it), as tall as the walls'
   faces are; its foot on a square plinth, its shaft lit from the left, its capital flaring out to a square slab whose
   top is the dark cut of it under the vault, as the walls' tops are (drawn whole on the ground, and its upper part
   again over whoever stands behind it: drawOver) */
const COL_UP = 0.78;
function cPillar(g, I, s, x, y){
  const X = x * s, Y = y * s, th = I.th, q = R(x, y, 111), base = th.wall, cx = X + s / 2, wet = I.wetPillar(x, y);
  const foot = Y + s * (wet ? 0.95 : 0.9), r = s * 0.26, capB = Y - COL_UP * s + s * 0.34, capT = Y - COL_UP * s + s * 0.04;
  if(wet){
    for(let k = 0; k < 3; k++){ g.strokeStyle = `rgba(160,210,225,${(0.24 - k * 0.06).toFixed(2)})`; g.lineWidth = Math.max(0.8, s * 0.012); g.beginPath(); g.ellipse(cx, foot, r * (1.35 + k * 0.3), s * (0.08 + k * 0.03), 0, 0, TAU); g.stroke(); }
    ell(g, cx, foot, r * 1.25, s * 0.08, 'rgba(0,0,0,.35)');
  } else {
    /* its shadow, long across the floor */
    g.fillStyle = 'rgba(6,4,10,.42)'; g.beginPath(); g.moveTo(cx - r * 1.2, foot); g.lineTo(cx + r * 1.2, foot); g.lineTo(cx + r * 1.2 + s * 0.3, foot + s * 0.12); g.lineTo(cx - r * 1.2 + s * 0.3, foot + s * 0.12); g.closePath(); g.fill();
    /* its plinth: two square steps */
    const pw = r * 2.9, ph = s * 0.09;
    g.fillStyle = sh(base, -0.24); g.fillRect(cx - pw / 2, foot - ph, pw, ph);
    g.fillStyle = sh(base, 0.1); g.fillRect(cx - pw / 2, foot - ph - s * 0.05, pw, s * 0.05);
    g.fillStyle = sh(base, -0.16); g.fillRect(cx - pw * 0.4, foot - ph * 2 - s * 0.05, pw * 0.8, ph);
    g.fillStyle = sh(base, 0.18); g.fillRect(cx - pw * 0.4, foot - ph * 2 - s * 0.09, pw * 0.8, s * 0.045);
    g.fillStyle = 'rgba(255,250,240,.16)'; g.fillRect(cx - pw / 2, foot - ph - s * 0.05, pw, Math.max(1, s * 0.012)); g.fillRect(cx - pw * 0.4, foot - ph * 2 - s * 0.09, pw * 0.8, Math.max(1, s * 0.012));
  }
  /* its shaft */
  const sb = wet ? foot - s * 0.01 : foot - s * 0.27, st = capB;
  const shaft = lin(g, cx - r, 0, cx + r, 0, [[0, sh(base, -0.18)], [0.22, sh(base, 0.3)], [0.5, sh(base, 0.08)], [1, sh(base, -0.44)]]);
  g.fillStyle = shaft; g.fillRect(cx - r, st, r * 2, sb - st);
  for(let k = 1; k < 7; k++){ const fx = cx - r + r * 2 * k / 7; line(g, fx, st + s * 0.03, fx, sb, `rgba(0,0,0,${(0.08 + Math.abs(k - 2) * 0.02).toFixed(2)})`, Math.max(0.7, s * 0.008)); line(g, fx + Math.max(1, s * 0.01), st + s * 0.03, fx + Math.max(1, s * 0.01), sb, 'rgba(255,250,240,.05)', Math.max(0.6, s * 0.006)); }
  if(s >= 20) for(let k = 0; k < 22; k++){ g.fillStyle = q() < 0.55 ? 'rgba(0,0,0,.15)' : 'rgba(255,250,240,.07)'; const p0 = Math.max(0.7, s * (0.005 + q() * 0.01)); g.fillRect(cx - r + q() * r * 2, st + q() * (sb - st), p0, p0); }
  if(q() < 0.5){ g.strokeStyle = 'rgba(10,6,14,.5)'; g.lineWidth = Math.max(0.7, s * 0.011); g.beginPath(); let px = cx - r * 0.3 + q() * r * 0.6, py = st + (sb - st) * 0.15; g.moveTo(px, py); for(let k = 0; k < 5; k++){ px += (q() - 0.5) * r * 0.35; py += (sb - st) * 0.14; g.lineTo(px, py); } g.stroke(); }
  /* a darker band where the light from below fails, high up */
  g.fillStyle = lin(g, 0, st, 0, st + (sb - st) * 0.45, [[0, 'rgba(6,4,10,.35)'], [1, 'rgba(6,4,10,0)']]); g.fillRect(cx - r, st, r * 2, (sb - st) * 0.45);
  if(wet){ g.fillStyle = lin(g, 0, sb - s * 0.22, 0, sb, [[0, 'rgba(10,30,34,0)'], [1, 'rgba(10,30,34,.55)']]); g.fillRect(cx - r, sb - s * 0.22, r * 2, s * 0.22); for(let k = 0; k < 6; k++) ell(g, cx - r + q() * r * 2, sb - s * 0.03 - q() * s * 0.1, s * 0.03, s * 0.018, 'rgba(80,112,64,.6)'); }
  else if(th.moss && q() < th.moss * 1.4) for(let i = 0; i < 5; i++) ell(g, cx - r + q() * r * 2, sb - q() * s * 0.1, s * 0.03, s * 0.018, 'rgba(78,112,56,.6)');
  /* its capital: a ring, the flare of it, then its square slab */
  g.fillStyle = sh(base, 0.12); g.fillRect(cx - r * 1.04, capB - s * 0.02, r * 2.08, s * 0.045);
  g.fillStyle = lin(g, cx - r * 1.5, 0, cx + r * 1.5, 0, [[0, sh(base, -0.1)], [0.25, sh(base, 0.26)], [1, sh(base, -0.4)]]);
  g.beginPath(); g.moveTo(cx - r, capB - s * 0.02); g.quadraticCurveTo(cx - r * 1.05, capB - s * 0.1, cx - r * 1.5, capB - s * 0.14); g.lineTo(cx + r * 1.5, capB - s * 0.14); g.quadraticCurveTo(cx + r * 1.05, capB - s * 0.1, cx + r, capB - s * 0.02); g.closePath(); g.fill();
  const aw = r * 3.1, ax = cx - aw / 2;
  g.fillStyle = sh(base, -0.06); g.fillRect(ax, capB - s * 0.22, aw, s * 0.08);                 // the slab's front
  g.fillStyle = 'rgba(255,250,240,.14)'; g.fillRect(ax, capB - s * 0.22, aw, Math.max(1, s * 0.012));
  g.fillStyle = th.wallTop; g.fillRect(ax, capT, aw, capB - s * 0.22 - capT);                   // its top: the dark cut, as the walls'
  g.fillStyle = sh(base, -0.2); g.fillRect(ax, capT, aw, Math.max(1, s * 0.03)); g.fillRect(ax, capT, Math.max(1, s * 0.03), capB - s * 0.22 - capT); g.fillRect(ax + aw - Math.max(1, s * 0.03), capT, Math.max(1, s * 0.03), capB - s * 0.22 - capT);
}
function cTall(d){
  const I = cInfo(d);
  if(I.tall) return I.tall;
  const list = [];
  for(let y = 0; y < I.H; y++) for(let x = 0; x < I.W; x++){
    const c = I.at(x, y);
    if(c === 'o') list.push({ x, y, w:1, up:COL_UP, draw:(g, dd, s)=> cPillar(g, cInfo(dd), s, x, y) });
    if(c === 'w') list.push({ x, y, w:1, up:RACK_UP, draw:(g, dd, s)=> cWineRack(g, cInfo(dd), s, x, y) });
  }
  return (I.tall = list);
}
/* a crate of the Family's: its lid lit from above, its boards, its iron corners, and their brand on it */
function cCrate(g, I, s, x, y){
  const X = x * s, Y = y * s, q = R(x, y, 121);
  const tall = q() < 0.3, kind = q();
  const top = Y + s * (tall ? 0.02 : 0.12), mid = top + s * 0.4, bot = Y + s * 0.94, l = X + s * 0.07, r = X + s * 0.93;
  cShadow(g, X, Y, s, 0.48, 0.13);
  const wood = sh('#7a5a38', (q() - 0.5) * 0.18), dark = sh(wood, -0.32);
  /* its lid */
  g.fillStyle = sh(wood, 0.16); g.fillRect(l, top, r - l, mid - top);
  for(let k = 1; k < 4; k++) line(g, l, top + (mid - top) * k / 4, r, top + (mid - top) * k / 4, 'rgba(40,24,10,.35)', Math.max(0.7, s * 0.009));
  if(kind < 0.18){                                                        // its lid off, and straw in it
    g.fillStyle = '#2a1c10'; g.fillRect(l + s * 0.05, top + s * 0.04, r - l - s * 0.1, mid - top - s * 0.06);
    for(let k = 0; k < 9; k++){ const sx = l + s * 0.06 + q() * (r - l - s * 0.12), sy = top + s * 0.05 + q() * (mid - top - s * 0.1); line(g, sx, sy, sx + (q() - 0.5) * s * 0.14, sy + (q() - 0.5) * s * 0.08, q() < 0.5 ? '#d8bd72' : '#b8994e', Math.max(0.8, s * 0.014)); }
  }
  g.fillStyle = 'rgba(255,240,215,.16)'; g.fillRect(l, top, r - l, Math.max(1, s * 0.016));
  /* its front */
  g.fillStyle = wood; g.fillRect(l, mid, r - l, bot - mid);
  for(let k = 1; k < 3; k++) line(g, l, mid + (bot - mid) * k / 3, r, mid + (bot - mid) * k / 3, 'rgba(30,18,8,.4)', Math.max(0.7, s * 0.01));
  g.strokeStyle = dark; g.lineWidth = Math.max(1, s * 0.035);
  g.beginPath(); g.moveTo(l + s * 0.04, mid + s * 0.03); g.lineTo(r - s * 0.04, bot - s * 0.03); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(l, mid, r - l, Math.max(1, s * 0.02));
  /* its iron corners */
  g.fillStyle = '#3a3638';
  [[l, mid], [r - s * 0.08, mid], [l, bot - s * 0.08], [r - s * 0.08, bot - s * 0.08]].forEach(([a, b])=>{ g.fillRect(a, b, s * 0.08, s * 0.08); circ(g, a + s * 0.04, b + s * 0.04, Math.max(0.7, s * 0.012), '#8a8488'); });
  /* the Family's brand: a ring and a cross, burnt in — or a stencilled number */
  if(kind > 0.55){
    const bx = X + s * 0.5, by = mid + (bot - mid) * 0.5;
    g.strokeStyle = 'rgba(28,14,6,.6)'; g.lineWidth = Math.max(0.8, s * 0.016);
    g.beginPath(); g.arc(bx, by, s * 0.09, 0, TAU); g.stroke();
    line(g, bx - s * 0.06, by, bx + s * 0.06, by, 'rgba(28,14,6,.6)', Math.max(0.8, s * 0.016)); line(g, bx, by - s * 0.06, bx, by + s * 0.06, 'rgba(28,14,6,.6)', Math.max(0.8, s * 0.016));
  }
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(r - s * 0.05, top, s * 0.05, bot - top);
  if(kind > 0.82 && kind < 0.92){                                         // a sack thrown on it
    ell(g, X + s * 0.45, top + s * 0.12, s * 0.24, s * 0.12, '#a89270'); ell(g, X + s * 0.42, top + s * 0.08, s * 0.14, s * 0.05, '#c2ad88');
  }
}
/* the Armoury: a rack of the Family's weapons — spears and swords upright, a shield */
function cRack(g, I, s, x, y){
  const X = x * s, Y = y * s, q = R(x, y, 131), run = I.runs.get(x + ',' + y);
  cShadow(g, X, Y, s, 0.48, 0.12);
  const l = X + (run && run.x0 === x ? s * 0.08 : 0), r = X + s - (run && run.x1 === x ? s * 0.08 : 0);
  g.fillStyle = '#4a321e'; g.fillRect(l, Y + s * 0.78, r - l, s * 0.12);
  g.fillStyle = '#5e4128'; g.fillRect(l, Y + s * 0.16, r - l, s * 0.07);
  g.fillStyle = '#3a2716'; if(run && run.x0 === x) g.fillRect(l, Y + s * 0.1, s * 0.07, s * 0.8); if(run && run.x1 === x) g.fillRect(r - s * 0.07, Y + s * 0.1, s * 0.07, s * 0.8);
  for(let i = 0; i < 3; i++){
    const wx = X + s * (0.2 + i * 0.3), kind = q();
    if(kind < 0.45){                                                      // a spear
      line(g, wx, Y + s * 0.86, wx, Y + s * 0.12, '#7a5a38', Math.max(1, s * 0.03));
      poly(g, [[wx, Y + s * 0.02], [wx - s * 0.04, Y + s * 0.13], [wx + s * 0.04, Y + s * 0.13]], '#b9b6c0');
      line(g, wx - s * 0.01, Y + s * 0.04, wx - s * 0.01, Y + s * 0.12, 'rgba(255,255,255,.5)', Math.max(0.6, s * 0.008));
    } else if(kind < 0.8){                                                // a sword, point down
      line(g, wx, Y + s * 0.2, wx, Y + s * 0.84, '#c4c2cc', Math.max(1.2, s * 0.035));
      line(g, wx - s * 0.006, Y + s * 0.22, wx - s * 0.006, Y + s * 0.8, 'rgba(255,255,255,.55)', Math.max(0.6, s * 0.008));
      line(g, wx - s * 0.07, Y + s * 0.2, wx + s * 0.07, Y + s * 0.2, '#8a7040', Math.max(1, s * 0.03));
      line(g, wx, Y + s * 0.2, wx, Y + s * 0.1, '#4a2e1c', Math.max(1, s * 0.03)); circ(g, wx, Y + s * 0.08, s * 0.025, '#c9a24a');
    } else {                                                              // a round shield against it
      circ(g, wx, Y + s * 0.55, s * 0.15, '#6a4a2c'); g.strokeStyle = '#9a9aa4'; g.lineWidth = Math.max(1, s * 0.025); g.beginPath(); g.arc(wx, Y + s * 0.55, s * 0.15, 0, TAU); g.stroke();
      circ(g, wx, Y + s * 0.55, s * 0.045, '#b8b6c0'); circ(g, wx - s * 0.012, Y + s * 0.54, s * 0.015, 'rgba(255,255,255,.6)');
    }
  }
}
/* the Barracks: a cot with its blanket, or the long table they eat at; the Garrison's bunks against its walls — a bed
   two squares long, its head at the wall (or the left), a wooden frame on four legs, a straw mattress, a pillow, a wool
   blanket turned down, and what its man left on it */
function cBunk(g, I, s, x, y, run){
  run = run || I.runs.get(x + ',' + y) || { x0:x, x1:x, y0:y, y1:y, w:1, h:1 };
  if(run.w >= 3) return cTable(g, I, s, x, y, run, 'mess');
  const X = x * s, Y = y * s;
  const headRight = I.at(run.x1 + 1, y) === '#' && I.at(run.x0 - 1, y) !== '#';
  const L = run.x0 * s + s * 0.06, Rr = (run.x1 + 1) * s - s * 0.06, top = Y + s * 0.16, bot = Y + s * 0.84;
  const q = R(run.x0, y, 141);
  g.save(); g.beginPath(); g.rect(X, Y, s, s); g.clip();
  ell(g, (L + Rr) / 2 + s * 0.06, bot + s * 0.06, (Rr - L) * 0.55, s * 0.09, 'rgba(6,4,10,.42)');
  /* its frame: the rail nearest you, its legs */
  const wood = sh('#6a4a2c', (q() - 0.5) * 0.14);
  g.fillStyle = sh(wood, -0.25); [[L, bot], [Rr - s * 0.07, bot]].forEach(([a, b])=> g.fillRect(a, b - s * 0.02, s * 0.07, s * 0.1));
  g.fillStyle = wood; g.fillRect(L, top, Rr - L, bot - top);
  g.fillStyle = sh(wood, -0.3); g.fillRect(L, bot - s * 0.1, Rr - L, s * 0.1);
  g.fillStyle = 'rgba(255,230,190,.16)'; g.fillRect(L, top, Rr - L, Math.max(1, s * 0.015));
  /* its mattress: straw ticking, stitched */
  const mL = L + s * 0.05, mR = Rr - s * 0.05, mT = top + s * 0.05, mB = bot - s * 0.13;
  rr(g, mL, mT, mR - mL, mB - mT, s * 0.05); g.fillStyle = '#d6c9a4'; g.fill();
  g.strokeStyle = 'rgba(140,110,60,.35)'; g.lineWidth = Math.max(0.7, s * 0.009);
  for(let k = 1; k < 4; k++){ const yy = mT + (mB - mT) * k / 4; g.beginPath(); g.moveTo(mL + s * 0.04, yy); g.lineTo(mR - s * 0.04, yy); g.stroke(); }
  for(let xx = mL + s * 0.2; xx < mR - s * 0.1; xx += s * 0.25) for(let k = 1; k < 4; k++) circ(g, xx, mT + (mB - mT) * k / 4, Math.max(0.7, s * 0.01), 'rgba(120,90,50,.5)');
  /* its headboard and pillow */
  const hx = headRight ? Rr - s * 0.07 : L;
  g.fillStyle = sh(wood, -0.15); g.fillRect(hx, top - s * 0.06, s * 0.07, bot - top + s * 0.02);
  g.fillStyle = 'rgba(255,230,190,.2)'; g.fillRect(hx, top - s * 0.06, s * 0.07, Math.max(1, s * 0.015));
  const px = headRight ? mR - s * 0.36 : mL + s * 0.04;
  rr(g, px, mT + s * 0.05, s * 0.32, mB - mT - s * 0.1, s * 0.07); g.fillStyle = '#efe8d6'; g.fill();
  g.fillStyle = 'rgba(150,130,100,.25)'; g.fillRect(px + s * 0.04, mT + (mB - mT) * 0.48, s * 0.24, Math.max(0.8, s * 0.012));
  /* its blanket, turned down below the pillow */
  const blankets = ['#5e6a58', '#6a5e52', '#4e5a66', '#6e4a42'], bc = blankets[Math.floor(q() * blankets.length)];
  const bL = headRight ? mL : mL + s * 0.42, bR = headRight ? mR - s * 0.42 : mR;
  if(bR > bL){
    rr(g, bL, mT - s * 0.01, bR - bL, mB - mT + s * 0.04, s * 0.04); g.fillStyle = bc; g.fill();
    g.fillStyle = sh(bc, 0.2); const fx = headRight ? bR - s * 0.1 : bL; g.fillRect(fx, mT - s * 0.01, s * 0.1, mB - mT + s * 0.04);   // the turned-down edge
    g.strokeStyle = sh(bc, -0.25); g.lineWidth = Math.max(0.8, s * 0.014);
    for(let k = 0; k < 2; k++){ const sx = bL + (bR - bL) * (0.35 + k * 0.3); g.beginPath(); g.moveTo(sx, mT); g.lineTo(sx, mB); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(bL + (bR - bL) * 0.2, mB + s * 0.02); g.quadraticCurveTo(bL + (bR - bL) * 0.5, mT + (mB - mT) * 0.6, bR - (bR - bL) * 0.15, mB + s * 0.02); g.closePath(); g.fill();
  }
  /* what its man left on it, now and then: his cap, a book */
  const it = q();
  if(it < 0.25){ const cx = headRight ? px + s * 0.16 : px + s * 0.16; ell(g, cx, mT + (mB - mT) * 0.5, s * 0.1, s * 0.06, '#2a2a30'); ell(g, cx, mT + (mB - mT) * 0.5 - s * 0.02, s * 0.07, s * 0.04, '#3a3a44'); }
  else if(it < 0.45){ const bx = (bL + bR) / 2; g.fillStyle = '#6a2a24'; g.save(); g.translate(bx, mT + (mB - mT) * 0.5); g.rotate((q() - 0.5) * 0.6); g.fillRect(-s * 0.08, -s * 0.06, s * 0.16, s * 0.12); g.fillStyle = '#efe6d0'; g.fillRect(-s * 0.07, -s * 0.05, s * 0.01, s * 0.1); g.restore(); }
  g.restore();
}
function cBunkK(g, I, s, x, y){
  const run = I.runs.get(x + ',' + y);
  return cBunk(g, I, s, x, y, run && run.w <= 2 ? run : { x0:x, x1:x, y0:y, y1:y, w:1, h:1 });
}
/* a table: its boards, and what was left on it */
function cTable(g, I, s, x, y, run, style){
  run = run || I.runs.get(x + ',' + y) || { x0:x, y0:y, x1:x, y1:y, w:1, h:1 };
  const X = x * s, Y = y * s, q = R(x, y, 151);
  const L = run.x0 * s + s * 0.04, Rr = (run.x1 + 1) * s - s * 0.04, top = run.y0 * s + s * 0.18, bot = (run.y1 + 1) * s - s * 0.2;
  g.save(); g.beginPath(); g.rect(X, Y, s, s); g.clip();
  ell(g, (L + Rr) / 2 + s * 0.06, bot + s * 0.12, (Rr - L) * 0.52, s * 0.12, 'rgba(6,4,10,.4)');
  const wood = '#7b5634';
  /* its legs */
  g.fillStyle = '#3e2a17'; [[L + s * 0.06, bot], [Rr - s * 0.12, bot]].forEach(([a, b])=> g.fillRect(a, b - s * 0.02, s * 0.06, s * 0.12));
  /* its top: boards running its length */
  g.fillStyle = wood; g.fillRect(L, top, Rr - L, bot - top);
  const n = Math.max(2, Math.round((bot - top) / (s * 0.17)));
  for(let k = 0; k < n; k++){
    const by = top + (bot - top) * k / n, bh = (bot - top) / n;
    const qq = R(run.x0, run.y0 * 10 + k, 153);
    g.fillStyle = sh(wood, (qq() - 0.5) * 0.16); g.fillRect(L, by + 0.6, Rr - L, bh - 1.2);
    g.strokeStyle = 'rgba(40,22,10,.2)'; g.lineWidth = Math.max(0.6, s * 0.007);
    for(let j = 0; j < (Rr - L) / s * 3; j++){ const gx = L + qq() * (Rr - L); g.beginPath(); g.moveTo(gx, by + bh * 0.3); g.quadraticCurveTo(gx + s * 0.15, by + bh * (0.2 + qq() * 0.6), gx + s * 0.3, by + bh * 0.5); g.stroke(); }
  }
  g.fillStyle = 'rgba(255,240,215,.14)'; g.fillRect(L, top, Rr - L, Math.max(1, s * 0.018));
  g.fillStyle = sh(wood, -0.35); g.fillRect(L, bot, Rr - L, s * 0.05);
  /* what is on it, square by square */
  const cx = X + s * 0.5, cy = (top + bot) / 2, it = q();
  if(style === 'mess' || I.d.key === 'cata_garrison'){
    if(it < 0.3){ ell(g, cx - s * 0.12, cy, s * 0.07, s * 0.06, '#d8d0c0'); ell(g, cx - s * 0.12, cy - s * 0.01, s * 0.05, s * 0.035, '#a07850'); }        // a bowl
    else if(it < 0.55){ g.fillStyle = '#8a8478'; rr(g, cx - s * 0.04, cy - s * 0.1, s * 0.09, s * 0.12, s * 0.02); g.fill(); ell(g, cx + 0.005 * s, cy - s * 0.1, s * 0.045, s * 0.02, '#4a3020'); }   // a mug
    else if(it < 0.75){ for(let k = 0; k < 4; k++){ g.save(); g.translate(cx - s * 0.1 + k * s * 0.07, cy); g.rotate((q() - 0.5) * 0.8); g.fillStyle = '#f2ece0'; g.fillRect(-s * 0.04, -s * 0.06, s * 0.08, s * 0.11); g.fillStyle = k % 2 ? '#b8323a' : '#222'; g.fillRect(-s * 0.012, -s * 0.02, s * 0.024, s * 0.024); g.restore(); } }   // their cards
    else { ell(g, cx, cy, s * 0.1, s * 0.05, '#c89a58'); ell(g, cx - s * 0.02, cy - s * 0.015, s * 0.06, s * 0.02, '#e0b878'); }                           // a loaf
  } else if(style === 'bench' || I.d.key === 'cata_pit'){
    /* a bench: nothing on it but a coat, now and then */
    if(it < 0.2){ g.fillStyle = '#3e3a44'; rr(g, cx - s * 0.2, cy - s * 0.08, s * 0.36, s * 0.16, s * 0.04); g.fill(); }
  } else {
    if(it < 0.3){ g.fillStyle = '#e8e0cc'; g.save(); g.translate(cx, cy); g.rotate((q() - 0.5) * 0.5); g.fillRect(-s * 0.13, -s * 0.09, s * 0.26, s * 0.18); g.strokeStyle = 'rgba(80,60,40,.5)'; g.lineWidth = Math.max(0.6, s * 0.007); for(let k = 0; k < 4; k++){ g.beginPath(); g.moveTo(-s * 0.1, -s * 0.05 + k * s * 0.035); g.lineTo(s * 0.09, -s * 0.05 + k * s * 0.035); g.stroke(); } g.restore(); }   // papers
    else if(it < 0.5){ g.fillStyle = '#e9dfc4'; g.fillRect(cx - s * 0.02, cy - s * 0.12, s * 0.04, s * 0.12); circ(g, cx, cy - s * 0.13, s * 0.02, '#ffc864'); }                                     // a candle stub
    else if(it < 0.7){ g.fillStyle = '#2e4a2a'; rr(g, cx - s * 0.03, cy - s * 0.14, s * 0.06, s * 0.16, s * 0.02); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(cx - s * 0.02, cy - s * 0.12, s * 0.012, s * 0.1); }   // a bottle
  }
  g.restore();
}
/* a barrel: standing, its lid seen from above — or (a rack of them, side by side) lying, its head towards you */
function cBarrel(g, I, s, x, y){
  const X = x * s, Y = y * s, q = R(x, y, 161), run = I.runs.get(x + ',' + y);
  const lying = run && run.w >= 3 && run.h === 1;
  if(lying){
    /* the cradle under them */
    g.fillStyle = '#3a2716'; g.fillRect(X, Y + s * 0.84, s, s * 0.1);
    ell(g, X + s * 0.5, Y + s * 0.88, s * 0.44, s * 0.06, 'rgba(0,0,0,.4)');
    const cx = X + s * 0.5, cy = Y + s * 0.47, r = s * 0.42;
    g.fillStyle = rad(g, cx - r * 0.3, cy - r * 0.3, r * 0.1, r * 1.1, [[0, '#9a6a40'], [1, '#5a3a20']]);
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(40,22,10,.45)'; g.lineWidth = Math.max(0.7, s * 0.01);
    for(let k = -2; k <= 2; k++){ const xx = cx + k * r * 0.33; const hh = Math.sqrt(Math.max(0, r * r - (xx - cx) * (xx - cx))) * 0.86; line(g, xx, cy - hh, xx, cy + hh, 'rgba(40,22,10,.4)', Math.max(0.7, s * 0.01)); }
    g.strokeStyle = '#34302e'; g.lineWidth = Math.max(1.5, s * 0.045); g.beginPath(); g.arc(cx, cy, r * 0.94, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(200,190,180,.25)'; g.lineWidth = Math.max(0.6, s * 0.01); g.beginPath(); g.arc(cx, cy, r * 0.96, Math.PI * 1.1, Math.PI * 1.55); g.stroke();
    if(q() < 0.4){ g.fillStyle = '#5a3a20'; g.fillRect(cx - s * 0.03, cy + r * 0.4, s * 0.06, s * 0.1); circ(g, cx, cy + r * 0.52, s * 0.03, '#8a8a90'); }   // a tap
    if(q() < 0.5 && s >= 16){ g.fillStyle = 'rgba(240,236,226,.7)'; g.font = `700 ${Math.round(s * 0.13)}px system-ui`; g.textAlign = 'center'; g.fillText(['IX', 'XII', 'VII', 'V', 'III'][Math.floor(q() * 5)], cx, cy - r * 0.2); }   // chalked: its year
    return;
  }
  cShadow(g, X, Y, s, 0.44, 0.13);
  const cx = X + s * 0.5, top = Y + s * 0.3, bot = Y + s * 0.9, rx = s * 0.38, ry = s * 0.2;
  /* its side, bulging, its staves and hoops */
  g.fillStyle = lin(g, cx - rx, 0, cx + rx, 0, [[0, '#4e3018'], [0.3, '#8e5c32'], [0.7, '#6a4222'], [1, '#3e2410']]);
  g.beginPath(); g.moveTo(cx - rx, top); g.quadraticCurveTo(cx - rx * 1.1, (top + bot) / 2, cx - rx * 0.92, bot); g.lineTo(cx + rx * 0.92, bot); g.quadraticCurveTo(cx + rx * 1.1, (top + bot) / 2, cx + rx, top); g.closePath(); g.fill();
  for(let k = -2; k <= 2; k++) line(g, cx + k * rx * 0.36, top + ry * 0.6, cx + k * rx * 0.33, bot, 'rgba(30,15,5,.3)', Math.max(0.6, s * 0.008));
  [0.32, 0.8].forEach(f=>{ g.fillStyle = '#2e2a2c'; g.fillRect(cx - rx * 1.03, top + (bot - top) * f, rx * 2.06, Math.max(1.2, s * 0.04)); });
  /* its lid */
  ell(g, cx, top, rx, ry, '#4a2c16');
  ell(g, cx, top, rx * 0.88, ry * 0.84, '#9a6a3e');
  for(let k = -1; k <= 1; k++) line(g, cx + k * rx * 0.3, top - ry * 0.8, cx + k * rx * 0.3, top + ry * 0.8, 'rgba(40,22,10,.35)', Math.max(0.6, s * 0.008));
  circ(g, cx + rx * 0.4, top + ry * 0.1, s * 0.025, '#2a1a0e');
  g.fillStyle = 'rgba(255,240,210,.18)'; g.beginPath(); g.ellipse(cx - rx * 0.3, top - ry * 0.3, rx * 0.4, ry * 0.25, 0, 0, TAU); g.fill();
}
/* the Quarry: a block of the hill's own pale stone, cut square — its top, its face towards you, the tooth marks of the
   chisel on both; now and then a smaller one set on it, a wedge still in a split, chips round its foot */
function cBlock(g, I, s, x, y){
  const X = x * s, Y = y * s, q = R(x, y, 171), base = sh('#a69d89', (q() - 0.5) * 0.1);
  const l = X + s * (0.05 + q() * 0.04), r = X + s * (0.95 - q() * 0.04), top = Y + s * (0.1 + q() * 0.06), mid = top + s * 0.36, bot = Y + s * 0.93;
  g.fillStyle = 'rgba(6,4,10,.42)'; g.beginPath(); g.moveTo(l, bot); g.lineTo(r, bot); g.lineTo(r + s * 0.12, bot + s * 0.06); g.lineTo(l + s * 0.12, bot + s * 0.06); g.closePath(); g.fill();
  /* its face */
  g.fillStyle = lin(g, 0, mid, 0, bot, [[0, sh(base, -0.06)], [1, sh(base, -0.22)]]); g.fillRect(l, mid, r - l, bot - mid);
  /* its top */
  g.fillStyle = lin(g, l, top, r, mid, [[0, sh(base, 0.18)], [1, sh(base, 0.06)]]); g.fillRect(l, top, r - l, mid - top);
  g.fillStyle = 'rgba(255,255,250,.28)'; g.fillRect(l, top, r - l, Math.max(1, s * 0.016));
  g.fillStyle = 'rgba(255,255,250,.14)'; g.fillRect(l, mid - Math.max(1, s * 0.012), r - l, Math.max(1, s * 0.012));
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(r - s * 0.035, top, s * 0.035, bot - top);
  /* the tooth of the chisel: rows of short strokes, slanting */
  g.strokeStyle = 'rgba(90,80,64,.32)'; g.lineWidth = Math.max(0.6, s * 0.008);
  for(let row = 0; row < 4; row++){ const yy = mid + (bot - mid) * (0.15 + row * 0.22); for(let xx = l + s * 0.04 + (row % 2) * s * 0.04; xx < r - s * 0.06; xx += s * 0.08){ g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + s * 0.04, yy + s * 0.03); g.stroke(); } }
  for(let row = 0; row < 3; row++){ const yy = top + (mid - top) * (0.22 + row * 0.28); for(let xx = l + s * 0.05 + (row % 2) * s * 0.05; xx < r - s * 0.06; xx += s * 0.1){ g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + s * 0.05, yy + s * 0.012); g.stroke(); } }
  if(s >= 20) for(let k = 0; k < 24; k++){ g.fillStyle = q() < 0.5 ? 'rgba(80,70,55,.2)' : 'rgba(255,255,250,.15)'; const p0 = Math.max(0.7, s * (0.005 + q() * 0.008)); g.fillRect(l + q() * (r - l), top + q() * (bot - top), p0, p0); }
  const kind = q();
  if(kind < 0.28){                                                         // a split in it, a wooden wedge driven in
    const sx = l + (r - l) * (0.35 + q() * 0.3);
    g.strokeStyle = 'rgba(50,42,32,.7)'; g.lineWidth = Math.max(1, s * 0.016); g.beginPath(); g.moveTo(sx, top); g.lineTo(sx + s * 0.02, mid); g.lineTo(sx - s * 0.01, bot); g.stroke();
    g.fillStyle = '#8a6438'; g.beginPath(); g.moveTo(sx - s * 0.04, top + s * 0.02); g.lineTo(sx + s * 0.05, top + s * 0.02); g.lineTo(sx + s * 0.01, top + s * 0.16); g.closePath(); g.fill();
  } else if(kind < 0.5){                                                   // a smaller one set on top
    const l2 = l + (r - l) * 0.2, r2 = r - (r - l) * 0.15, t2 = top - s * 0.06, m2 = t2 + s * 0.2;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(l2 + s * 0.03, m2 + s * 0.12, r2 - l2, s * 0.04);
    g.fillStyle = sh(base, -0.1); g.fillRect(l2, m2, r2 - l2, s * 0.16);
    g.fillStyle = sh(base, 0.2); g.fillRect(l2, t2, r2 - l2, m2 - t2);
    g.fillStyle = 'rgba(255,255,250,.3)'; g.fillRect(l2, t2, r2 - l2, Math.max(1, s * 0.014));
  }
  for(let k = 0; k < 5; k++){ const cx = l + q() * (r - l), cy = bot + s * (0.01 + q() * 0.05), rr0 = s * (0.012 + q() * 0.02); ell(g, cx, cy, rr0, rr0 * 0.6, 'rgba(225,218,204,.75)'); }
}
/* a brazier: an iron bowl on three legs, its coals (its flames are drawn as they move: cAnim) */
function cBrazierBase(g, I, s, x, y){
  const X = x * s, Y = y * s, cx = X + s * 0.5;
  const onWall = !I.open(x, y);
  g.fillStyle = rad(g, cx, Y + s * 0.5, s * 0.1, s * 1.6, [[0, 'rgba(255,170,80,.28)'], [0.5, 'rgba(255,140,60,.08)'], [1, 'rgba(255,140,60,0)']]);
  g.fillRect(X - s * 1.2, Y - s * 1.2, s * 3.4, s * 3.4);
  ell(g, cx + s * 0.05, Y + s * 0.88, s * 0.3, s * 0.08, 'rgba(0,0,0,.4)');
  g.strokeStyle = '#1e1a1a'; g.lineWidth = Math.max(1.2, s * 0.035); g.lineCap = 'round';
  [[-0.22, 0.86], [0.22, 0.86], [0, 0.92]].forEach(([dx, fy])=>{ g.beginPath(); g.moveTo(cx + dx * s * 0.6, Y + s * 0.52); g.lineTo(cx + dx * s, Y + s * fy); g.stroke(); });
  g.fillStyle = lin(g, cx - s * 0.3, 0, cx + s * 0.3, 0, [[0, '#2a2422'], [0.4, '#5a4a40'], [1, '#1c1816']]);
  g.beginPath(); g.moveTo(cx - s * 0.32, Y + s * 0.4); g.quadraticCurveTo(cx, Y + s * 0.68, cx + s * 0.32, Y + s * 0.4); g.closePath(); g.fill();
  ell(g, cx, Y + s * 0.4, s * 0.32, s * 0.1, '#3a2c26');
  ell(g, cx, Y + s * 0.41, s * 0.27, s * 0.075, '#ff8a3a');
  for(let k = 0; k < 7; k++){ const q = R(x, y, 181 + k); ell(g, cx + (q() - 0.5) * s * 0.4, Y + s * 0.41 + (q() - 0.5) * s * 0.08, s * 0.04, s * 0.022, q() < 0.5 ? '#ffd27a' : '#c2401c'); }
  if(onWall){}
}
/* a gate of iron bars in its arch — or (the crypt) the vault's great door */
function cGate(g, I, s, x, y){
  const X = x * s, Y = y * s;
  g.fillStyle = '#0c0b0e'; g.fillRect(X, Y, s, s);
  if(I.d.vaultDoor){
    const lx = I.at(x - 1, y) === 'G', rx = I.at(x + 1, y) === 'G';
    g.fillStyle = lin(g, X, Y, X, Y + s, [[0, '#4a4652'], [1, '#2e2b34']]); g.fillRect(X, Y + s * 0.06, s, s * 0.94);
    for(let k = 0; k < 4; k++) g.fillStyle = 'rgba(0,0,0,.3)', g.fillRect(X, Y + s * (0.22 + k * 0.2), s, Math.max(1, s * 0.03));
    for(let a = 0; a < 3; a++) for(let b = 0; b < 4; b++){ circ(g, X + s * (0.2 + a * 0.3), Y + s * (0.14 + b * 0.22), Math.max(0.9, s * 0.02), '#8a8494'); circ(g, X + s * (0.2 + a * 0.3) - s * 0.005, Y + s * (0.14 + b * 0.22) - s * 0.005, Math.max(0.5, s * 0.008), 'rgba(255,255,255,.4)'); }
    if(!lx){ g.fillStyle = '#1a181e'; g.fillRect(X, Y, s * 0.06, s); }
    if(!rx){ g.fillStyle = '#1a181e'; g.fillRect(X + s * 0.94, Y, s * 0.06, s); }
    if(lx && rx && I.at(x + 2, y) !== 'G'){ g.strokeStyle = '#b8a66a'; g.lineWidth = Math.max(1.5, s * 0.06); g.beginPath(); g.arc(X + s, Y + s * 0.55, s * 0.14, 0, TAU); g.stroke(); circ(g, X + s, Y + s * 0.55, s * 0.05, '#7a6a3a'); }
    return;
  }
  /* the arch over it */
  g.fillStyle = sh(I.th.wall, 0.05); g.fillRect(X, Y, s, s * 0.14);
  g.fillStyle = 'rgba(255,245,230,.12)'; g.fillRect(X, Y + s * 0.12, s, Math.max(1, s * 0.02));
  /* the dark beyond it, and its bars */
  g.fillStyle = lin(g, 0, Y + s * 0.14, 0, Y + s, [[0, '#050407'], [1, '#141218']]); g.fillRect(X, Y + s * 0.14, s, s * 0.86);
  for(let k = 0; k < 5; k++){
    const bx = X + s * (0.1 + k * 0.2);
    g.fillStyle = lin(g, bx - s * 0.03, 0, bx + s * 0.03, 0, [[0, '#2c2a30'], [0.5, '#76727e'], [1, '#2a282e']]); g.fillRect(bx - s * 0.03, Y + s * 0.14, s * 0.06, s * 0.86);
    poly(g, [[bx - s * 0.04, Y + s * 0.96], [bx + s * 0.04, Y + s * 0.96], [bx, Y + s]], '#3a383e');
  }
  [0.3, 0.72].forEach(f=>{ g.fillStyle = lin(g, 0, Y + s * f, 0, Y + s * (f + 0.06), [[0, '#6a6672'], [1, '#2a282e']]); g.fillRect(X, Y + s * f, s, s * 0.06); });
  g.fillStyle = 'rgba(150,80,40,.25)'; for(let k = 0; k < 6; k++){ const q = R(x, y, 191 + k); g.fillRect(X + q() * s, Y + s * (0.2 + q() * 0.7), s * 0.04, s * 0.06); }
}
/* the Fight Pit's rail: stout posts, iron-capped, and a heavy rail from each to the next */
function cRail(g, I, s, x, y){
  const X = x * s, Y = y * s, n = (dx, dy)=> I.at(x + dx, y + dy) === 'x';
  const cx = X + s / 2, cy = Y + s / 2, t = s * 0.11;
  const beam = (x0, y0, x1, y1)=>{
    g.lineCap = 'butt';
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = t * 1.4; g.beginPath(); g.moveTo(x0 + s * 0.04, y0 + s * 0.08); g.lineTo(x1 + s * 0.04, y1 + s * 0.08); g.stroke();
    g.strokeStyle = '#5e3e22'; g.lineWidth = t; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = 'rgba(255,215,160,.25)'; g.lineWidth = Math.max(0.7, t * 0.25); g.beginPath(); g.moveTo(x0, y0 - t * 0.3); g.lineTo(x1, y1 - t * 0.3); g.stroke();
    g.strokeStyle = 'rgba(30,15,5,.35)'; g.lineWidth = Math.max(0.6, s * 0.006); g.beginPath(); g.moveTo(x0, y0 + t * 0.15); g.lineTo(x1, y1 + t * 0.15); g.stroke();
  };
  if(n(1, 0)) beam(cx, cy, X + s, cy); if(n(-1, 0)) beam(X, cy, cx, cy);
  if(n(0, 1)) beam(cx, cy, cx, Y + s); if(n(0, -1)) beam(cx, Y, cx, cy);
  ell(g, cx + s * 0.05, cy + s * 0.12, s * 0.13, s * 0.06, 'rgba(0,0,0,.4)');
  g.fillStyle = '#3e2714'; g.fillRect(cx - s * 0.1, cy - s * 0.06, s * 0.2, s * 0.18);
  g.fillStyle = lin(g, cx - s * 0.1, 0, cx + s * 0.1, 0, [[0, '#6a4626'], [1, '#4a2f18']]); g.fillRect(cx - s * 0.1, cy - s * 0.16, s * 0.2, s * 0.12);
  g.fillStyle = '#5a5660'; g.fillRect(cx - s * 0.11, cy - s * 0.19, s * 0.22, s * 0.05);
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(cx - s * 0.11, cy - s * 0.19, s * 0.22, Math.max(1, s * 0.012));
}
/* the Deep Cellars' racks: standing up over the square behind them (RACK_UP), a frame of dark wood, shelf on shelf of
   bottles lying with their ends towards you — green, a deep red, the odd one missing — and the dust on them; its top a
   board, lit (drawn whole on the ground, and its upper part again over whoever stands behind it) */
const RACK_UP = 0.62;
function cWineRack(g, I, s, x, y){
  const X = x * s, Y = y * s, q = R(x, y, 201), run = I.runs.get(x + ',' + y) || { x0:x, x1:x };
  const first = run.x0 === x, last = run.x1 === x;
  const top = Y - RACK_UP * s, bot = Y + s * 0.9, l = X + (first ? s * 0.04 : 0), r = X + s - (last ? s * 0.04 : 0);
  g.save(); g.beginPath(); g.rect(X - (first ? s * 0.1 : 0), top - s * 0.1, s + (first ? s * 0.1 : 0) + (last ? s * 0.1 : 0), bot - top + s * 0.25); g.clip();
  g.fillStyle = 'rgba(6,4,10,.45)'; g.fillRect(l + s * 0.08, bot, r - l, s * 0.08);
  /* its back, dark between the bottles */
  g.fillStyle = '#1e140c'; g.fillRect(l, top + s * 0.08, r - l, bot - top - s * 0.08);
  /* shelf on shelf */
  const shelves = 6, sh0 = (bot - top - s * 0.14) / shelves;
  for(let k = 0; k <= shelves; k++){ const yy = top + s * 0.1 + k * sh0; g.fillStyle = '#5a3c22'; g.fillRect(l, yy - s * 0.015, r - l, s * 0.03); g.fillStyle = 'rgba(255,220,170,.12)'; g.fillRect(l, yy - s * 0.015, r - l, Math.max(1, s * 0.008)); }
  for(let k = 0; k < shelves; k++){
    const yy = top + s * 0.1 + k * sh0 + sh0 * 0.52;
    for(let c = 0; c < 4; c++){
      const bx = X + s * (0.14 + c * 0.24), kind = q();
      if(kind < 0.12) continue;                                                // an empty place
      const col = kind < 0.55 ? '#2a4a2c' : kind < 0.88 ? '#561e28' : '#2c2c22';
      circ(g, bx, yy, sh0 * 0.4, col);
      circ(g, bx, yy, sh0 * 0.2, sh(col, -0.45));
      circ(g, bx - sh0 * 0.14, yy - sh0 * 0.14, Math.max(0.7, sh0 * 0.08), 'rgba(255,255,255,.45)');
      if(q() < 0.3) circ(g, bx, yy, sh0 * 0.4, 'rgba(210,200,180,.2)');      // dust
    }
  }
  /* its uprights: at its ends, and between every square */
  g.fillStyle = '#4a311b';
  if(first) g.fillRect(l, top, s * 0.06, bot - top);
  if(last) g.fillRect(r - s * 0.06, top, s * 0.06, bot - top);
  if(!last){ g.fillRect(X + s - s * 0.025, top + s * 0.05, s * 0.05, bot - top - s * 0.05); }
  /* its top board, lit */
  g.fillStyle = '#6a4828'; g.fillRect(l, top, r - l, s * 0.09);
  g.fillStyle = 'rgba(255,225,180,.22)'; g.fillRect(l, top, r - l, Math.max(1, s * 0.016));
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(l, top + s * 0.08, r - l, Math.max(1, s * 0.02));
  if(q() < 0.35 && (first || last)){                                         // a cobweb in its corner
    g.strokeStyle = 'rgba(225,225,232,.32)'; g.lineWidth = Math.max(0.6, s * 0.006);
    const cx = first ? l + s * 0.06 : r - s * 0.06, cy = top + s * 0.09, dir = first ? 1 : -1;
    for(let k = 0; k < 5; k++){ const a = k / 4 * Math.PI / 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + dir * Math.cos(a) * s * 0.28, cy + Math.sin(a) * s * 0.28); g.stroke(); }
    for(let k = 1; k <= 3; k++){ g.beginPath(); for(let j = 0; j <= 4; j++){ const a = j / 4 * Math.PI / 2, rr0 = k * s * 0.08; const px = cx + dir * Math.cos(a) * rr0, py = cy + Math.sin(a) * rr0; j ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
  }
  g.restore();
}
/* the Pump Room's old pumps: each block of them one machine — an iron housing, riveted and rusted, a great wheel on its
   face, a pipe going down through the floor towards the water (drawn whole at its first square, over the rest) */
function cPump(g, I, s, x, y){
  const run = I.runs.get(x + ',' + y) || { x0:x, x1:x, y0:y, y1:y, w:1, h:1 };
  if(run.x0 !== x || run.y0 !== y) return;
  const L = run.x0 * s + s * 0.08, Rr = (run.x1 + 1) * s - s * 0.08, T = run.y0 * s + s * 0.06, B = (run.y1 + 1) * s - s * 0.08;
  const q = R(x, y, 211), cx = (L + Rr) / 2, mid = T + (B - T) * 0.32;
  g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.moveTo(L, B); g.lineTo(Rr, B); g.lineTo(Rr + s * 0.18, B + s * 0.08); g.lineTo(L + s * 0.18, B + s * 0.08); g.closePath(); g.fill();
  /* its housing: its top, its face */
  g.fillStyle = lin(g, L, 0, Rr, 0, [[0, '#3a383e'], [0.35, '#5c5862'], [1, '#2a282e']]); g.fillRect(L, mid, Rr - L, B - mid);
  g.fillStyle = lin(g, 0, T, 0, mid, [[0, '#6a6670'], [1, '#55515c']]); g.fillRect(L, T, Rr - L, mid - T);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(L, T, Rr - L, Math.max(1, s * 0.016));
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(L, mid - s * 0.02, Rr - L, s * 0.02);
  for(let k = 0; k < 9; k++) ell(g, L + q() * (Rr - L), mid + q() * (B - mid), s * (0.04 + q() * 0.08), s * (0.03 + q() * 0.05), 'rgba(150,72,30,.28)');   // rust
  [[L + s * 0.06, mid + s * 0.06], [Rr - s * 0.06, mid + s * 0.06], [L + s * 0.06, B - s * 0.06], [Rr - s * 0.06, B - s * 0.06]].forEach(([a, b])=>{ circ(g, a, b, Math.max(1, s * 0.025), '#8a8692'); circ(g, a - s * 0.008, b - s * 0.008, Math.max(0.6, s * 0.01), 'rgba(255,255,255,.5)'); });
  for(let k = 0; k < 6; k++){ circ(g, L + s * 0.06 + k * (Rr - L - s * 0.12) / 5, T + s * 0.06, Math.max(0.8, s * 0.018), '#7a7680'); }
  /* the wheel on its face, its spokes */
  const wy = (mid + B) / 2, wr = Math.min(Rr - L, B - mid) * 0.36;
  g.strokeStyle = '#2a282e'; g.lineWidth = Math.max(2, s * 0.06); g.beginPath(); g.arc(cx, wy, wr, 0, TAU); g.stroke();
  g.strokeStyle = '#8a8490'; g.lineWidth = Math.max(1.2, s * 0.035); g.beginPath(); g.arc(cx, wy, wr, 0, TAU); g.stroke();
  for(let k = 0; k < 6; k++){ const a = k / 6 * TAU + 0.3; line(g, cx, wy, cx + Math.cos(a) * wr, wy + Math.sin(a) * wr, '#6a6670', Math.max(1, s * 0.025)); }
  circ(g, cx, wy, s * 0.07, '#9a94a2'); circ(g, cx - s * 0.02, wy - s * 0.02, s * 0.025, 'rgba(255,255,255,.5)');
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = Math.max(0.8, s * 0.01); g.beginPath(); g.arc(cx, wy, wr, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
  /* its pipe, out of its top and away */
  const px = Rr - s * 0.24;
  g.fillStyle = lin(g, px - s * 0.08, 0, px + s * 0.08, 0, [[0, '#3a383e'], [0.45, '#7a7680'], [1, '#2a282e']]); g.fillRect(px - s * 0.08, T - s * 0.04, s * 0.16, s * 0.32);
  ell(g, px, T - s * 0.04, s * 0.08, s * 0.03, '#4a4650'); ell(g, px, T - s * 0.04, s * 0.05, s * 0.018, '#141218');
  g.fillStyle = '#4a4650'; g.fillRect(px - s * 0.1, T + s * 0.14, s * 0.2, s * 0.04);
}
/* the Drowned Chapel's pews, the water lapping round their legs */
function cPew(g, I, s, x, y){
  const X = x * s, Y = y * s, run = I.runs.get(x + ',' + y);
  const first = !run || run.x0 === x, last = !run || run.x1 === x;
  const l = X + (first ? s * 0.08 : 0), r = X + s - (last ? s * 0.08 : 0);
  ell(g, (l + r) / 2, Y + s * 0.9, (r - l) * 0.55, s * 0.07, 'rgba(0,0,0,.35)');
  g.fillStyle = '#4a3020'; g.fillRect(l, Y + s * 0.18, r - l, s * 0.18);
  g.fillStyle = '#6a4630'; g.fillRect(l, Y + s * 0.18, r - l, s * 0.05);
  g.fillStyle = '#5a3a26'; g.fillRect(l, Y + s * 0.5, r - l, s * 0.3);
  g.fillStyle = 'rgba(255,230,200,.14)'; g.fillRect(l, Y + s * 0.5, r - l, Math.max(1, s * 0.02));
  g.fillStyle = 'rgba(20,40,40,.35)'; g.fillRect(l, Y + s * 0.72, r - l, s * 0.08);          // the waterline on the wood
  if(first){ g.fillStyle = '#3e2818'; g.fillRect(l, Y + s * 0.14, s * 0.07, s * 0.72); }
  if(last){ g.fillStyle = '#3e2818'; g.fillRect(r - s * 0.07, Y + s * 0.14, s * 0.07, s * 0.72); }
}
/* the crypt's tombs: a knight carved lying on the lid, his sword faintly purple — and the little grave with a boat on it */
function cTomb(g, I, s, x, y){
  const X = x * s, Y = y * s, d = I.d;
  if(d.grave && d.grave[0] === x && d.grave[1] === y){
    /* the little grave: a low stone, a wooden boat on it, its sail white */
    ell(g, X + s * 0.56, Y + s * 0.88, s * 0.38, s * 0.08, 'rgba(0,0,0,.42)');
    g.fillStyle = '#6e695f'; rr(g, X + s * 0.12, Y + s * 0.5, s * 0.76, s * 0.36, s * 0.04); g.fill();
    g.fillStyle = lin(g, 0, Y + s * 0.2, 0, Y + s * 0.52, [[0, '#a59f92'], [1, '#8a8478']]); rr(g, X + s * 0.12, Y + s * 0.2, s * 0.76, s * 0.33, s * 0.05); g.fill();
    g.fillStyle = 'rgba(255,255,250,.25)'; g.fillRect(X + s * 0.14, Y + s * 0.2, s * 0.72, Math.max(1, s * 0.015));
    g.fillStyle = '#7a5434'; g.beginPath(); g.moveTo(X + s * 0.3, Y + s * 0.38); g.lineTo(X + s * 0.7, Y + s * 0.38); g.lineTo(X + s * 0.62, Y + s * 0.47); g.lineTo(X + s * 0.38, Y + s * 0.47); g.closePath(); g.fill();
    line(g, X + s * 0.5, Y + s * 0.38, X + s * 0.5, Y + s * 0.14, '#5a3a20', Math.max(1, s * 0.02));
    g.fillStyle = '#f2ece0'; g.beginPath(); g.moveTo(X + s * 0.51, Y + s * 0.15); g.lineTo(X + s * 0.51, Y + s * 0.35); g.lineTo(X + s * 0.66, Y + s * 0.35); g.closePath(); g.fill();
    return;
  }
  /* a tomb, two squares long: its lid with a knight carved lying on it — his helmet, his hands on his sword, the sword
     faintly purple — and its side towards you, carved with arches */
  const run = I.runs.get(x + ',' + y) || { x0:x, x1:x, y0:y, y1:y, w:1, h:1 };
  const L = run.x0 * s + s * 0.06, Rr = (run.x1 + 1) * s - s * 0.06, top = Y + s * 0.1, mid = Y + s * 0.5, bot = Y + s * 0.92;
  g.save(); g.beginPath(); g.rect(X, Y - s * 0.05, s, s * 1.15); g.clip();
  g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.moveTo(L, bot); g.lineTo(Rr, bot); g.lineTo(Rr + s * 0.14, bot + s * 0.07); g.lineTo(L + s * 0.14, bot + s * 0.07); g.closePath(); g.fill();
  /* its side: three arches carved in it */
  g.fillStyle = lin(g, 0, mid, 0, bot, [[0, '#6c665e'], [1, '#56514a']]); g.fillRect(L, mid, Rr - L, bot - mid);
  const n = Math.max(2, run.w * 2);
  for(let k = 0; k < n; k++){
    const aw = (Rr - L) / n, ax = L + k * aw + aw * 0.18, w2 = aw * 0.64, at = mid + (bot - mid) * 0.2, ab = bot - (bot - mid) * 0.18;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.moveTo(ax, ab); g.lineTo(ax, at + w2 / 2); g.arc(ax + w2 / 2, at + w2 / 2, w2 / 2, Math.PI, 0); g.lineTo(ax + w2, ab); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,250,240,.12)'; g.lineWidth = Math.max(0.7, s * 0.008); g.beginPath(); g.arc(ax + w2 / 2, at + w2 / 2 + Math.max(0.5, s * 0.006), w2 / 2, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  }
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(L, bot - s * 0.05, Rr - L, s * 0.05);
  /* its lid: lit, a rim round it */
  g.fillStyle = lin(g, 0, top, 0, mid, [[0, '#9a948a'], [1, '#7f7970']]); g.fillRect(L - s * 0.03, top, Rr - L + s * 0.06, mid - top);
  g.fillStyle = 'rgba(255,250,240,.24)'; g.fillRect(L - s * 0.03, top, Rr - L + s * 0.06, Math.max(1, s * 0.018));
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(L - s * 0.03, mid - s * 0.03, Rr - L + s * 0.06, s * 0.03);
  /* the knight on it */
  const cy = (top + mid) / 2, hx = L + s * 0.3, kx1 = Rr - s * 0.2;
  g.fillStyle = 'rgba(0,0,0,.14)'; rr(g, hx - s * 0.12, cy - s * 0.13, kx1 - hx + s * 0.14, s * 0.26, s * 0.1); g.fill();
  g.fillStyle = '#a8a296'; rr(g, hx - s * 0.13, cy - s * 0.14, kx1 - hx + s * 0.12, s * 0.25, s * 0.1); g.fill();
  g.fillStyle = 'rgba(255,255,250,.18)'; g.fillRect(hx, cy - s * 0.13, kx1 - hx - s * 0.1, Math.max(1, s * 0.012));
  circ(g, hx, cy, s * 0.1, '#9e988c');                                       // his helmet
  line(g, hx - s * 0.07, cy, hx + s * 0.07, cy, 'rgba(40,30,50,.55)', Math.max(0.8, s * 0.014));
  for(let k = 0; k < 3; k++) line(g, hx + s * 0.03 + k * s * 0.02, cy - s * 0.05, hx + s * 0.03 + k * s * 0.02, cy + s * 0.05, 'rgba(40,30,50,.35)', Math.max(0.6, s * 0.007));
  g.strokeStyle = 'rgba(160,110,220,.75)'; g.lineWidth = Math.max(1.2, s * 0.028);
  g.beginPath(); g.moveTo(hx + s * 0.28, cy); g.lineTo(kx1 - s * 0.02, cy); g.stroke();             // his sword, faintly purple
  g.beginPath(); g.moveTo(hx + s * 0.36, cy - s * 0.08); g.lineTo(hx + s * 0.36, cy + s * 0.08); g.stroke();
  g.fillStyle = 'rgba(190,150,255,.18)'; g.fillRect(hx + s * 0.28, cy - s * 0.03, kx1 - hx - s * 0.3, s * 0.06);
  ell(g, hx + s * 0.27, cy, s * 0.04, s * 0.05, '#8e887c');                // his hands on it
  g.restore();
}
/* a bunk against the Garrison's wall */
/* ---------- the vault (3.19), drawn finer ---------- */
function cCradle(g, I, s, x, y){
  const X = x * s, Y = y * s, mid = I.at(x - 1, y) === 'M' && I.at(x + 1, y) === 'M';
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(X, Y + s * 0.12, s, s * 0.84);
  g.fillStyle = lin(g, 0, Y, 0, Y + s, [[0, '#3d384a'], [1, '#221f2a']]); g.fillRect(X, Y + s * 0.06, s, s * 0.84);
  g.fillStyle = '#4c4660'; g.fillRect(X, Y + s * 0.06, s, s * 0.08);
  if(mid){
    g.strokeStyle = 'rgba(190,160,255,.8)'; g.lineWidth = Math.max(1.2, s * 0.03);
    g.beginPath(); g.arc(X + s / 2, Y + s * 0.5, s * 0.34, 0, TAU); g.stroke();
    for(let k = 0; k < 12; k++){ const a = k / 12 * TAU, r0 = s * (k % 3 ? 0.27 : 0.22); line(g, X + s / 2 + Math.cos(a) * r0, Y + s * 0.5 + Math.sin(a) * r0, X + s / 2 + Math.cos(a) * s * 0.32, Y + s * 0.5 + Math.sin(a) * s * 0.32, 'rgba(190,160,255,.7)', Math.max(0.8, s * 0.018)); }
  } else for(let k = 0; k < 3; k++) circ(g, X + s * (0.2 + k * 0.3), Y + s * 0.26, Math.max(0.8, s * 0.02), '#8a84a0');
}
function cCage(g, I, s, x, y){
  const X = x * s, Y = y * s, q = R(x, y, 221);
  g.fillStyle = 'rgba(46,92,46,.6)'; g.fillRect(X, Y, s, s);
  g.strokeStyle = 'rgba(120,85,50,.85)'; g.lineWidth = Math.max(1, s * 0.03); g.lineCap = 'round';
  for(let k = 0; k < 3; k++){ g.beginPath(); g.moveTo(X + q() * s, Y); g.bezierCurveTo(X + q() * s, Y + s * 0.3, X + q() * s, Y + s * 0.7, X + q() * s, Y + s); g.stroke(); }
  for(let k = 0; k < 8; k++){ g.save(); g.translate(X + s * (0.1 + q() * 0.8), Y + s * (0.1 + q() * 0.8)); g.rotate(q() * 3); ell(g, 0, 0, s * 0.07, s * 0.035, q() < 0.5 ? '#6ab35e' : '#8acb6a'); g.restore(); }
}
function cStoneTable(g, I, s, x, y){
  const X = x * s, Y = y * s, l = I.at(x - 1, y) === 'E', r = I.at(x + 1, y) === 'E';
  ell(g, X + s * 0.55, Y + s * 0.86, s * 0.48, s * 0.08, 'rgba(0,0,0,.4)');
  const L = X + (l ? 0 : s * 0.06), Rr = X + s - (r ? 0 : s * 0.06);
  g.fillStyle = '#6e685e'; g.fillRect(L, Y + s * 0.5, Rr - L, s * 0.32);
  g.fillStyle = lin(g, 0, Y + s * 0.16, 0, Y + s * 0.5, [[0, '#a8a296'], [1, '#8e887c']]); g.fillRect(L, Y + s * 0.16, Rr - L, s * 0.36);
  g.fillStyle = 'rgba(255,255,250,.2)'; g.fillRect(L, Y + s * 0.16, Rr - L, Math.max(1, s * 0.02));
}
function cMachine(g, I, s, x, y){
  const X = x * s, Y = y * s;
  ell(g, X + s * 0.55, Y + s * 0.9, s * 0.46, s * 0.08, 'rgba(0,0,0,.45)');
  g.fillStyle = lin(g, X, 0, X + s, 0, [[0, '#2a2632'], [0.4, '#4a4458'], [1, '#221e28']]); rr(g, X + s * 0.04, Y + s * 0.04, s * 0.92, s * 0.86, s * 0.05); g.fill();
  g.strokeStyle = '#5c556c'; g.lineWidth = Math.max(1, s * 0.02); g.strokeRect(X + s * 0.07, Y + s * 0.07, s * 0.86, s * 0.8);
  for(let k = 0; k < 2; k++){
    const jx = X + s * (0.18 + k * 0.38), jy = Y + s * 0.14;
    g.fillStyle = 'rgba(170,130,255,.2)'; g.fillRect(jx, jy, s * 0.26, s * 0.4);
    g.strokeStyle = 'rgba(210,190,255,.7)'; g.lineWidth = Math.max(0.8, s * 0.014); g.strokeRect(jx, jy, s * 0.26, s * 0.4);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(jx + s * 0.03, jy + s * 0.03, s * 0.03, s * 0.32);
  }
  circ(g, X + s * 0.3, Y + s * 0.72, s * 0.07, '#c9a24a'); circ(g, X + s * 0.3, Y + s * 0.72, s * 0.05, '#2a2420'); line(g, X + s * 0.3, Y + s * 0.72, X + s * 0.33, Y + s * 0.68, '#e8e0c8', Math.max(0.8, s * 0.01));
  circ(g, X + s * 0.7, Y + s * 0.72, s * 0.07, '#c9a24a'); circ(g, X + s * 0.7, Y + s * 0.72, s * 0.05, '#2a2420'); line(g, X + s * 0.7, Y + s * 0.72, X + s * 0.66, Y + s * 0.69, '#e8e0c8', Math.max(0.8, s * 0.01));
}

/* ---------- the ways out: a stair up or down, a doorway ---------- */
function cWay(g, I, s, w){
  const X = w.x * s, Y = w.y * s, th = I.th;
  if(w.verb === 'Up' || w.verb === 'Down'){
    /* steps, going away from you into the rock: each tread a little darker */
    const n = 5, dir = w.side;
    for(let i = 0; i < n; i++){
      const f = i / n, dark = (w.verb === 'Up' ? f : 1 - f) * 0.5 + 0.1;
      const v = (dir === 'u' || dir === 'd') ? 1 : 0;
      const pos = dir === 'u' ? n - 1 - i : dir === 'd' ? i : dir === 'l' ? n - 1 - i : i;
      const tx = v ? X : X + pos * s / n, ty = v ? Y + pos * s / n : Y, tw = v ? s : s / n, tl = v ? s / n : s;
      g.fillStyle = sh(th.floor, 0.08 - i * 0.03); g.fillRect(tx, ty, tw, tl);
      g.fillStyle = 'rgba(255,248,236,.14)';
      if(v) g.fillRect(tx, ty + (dir === 'u' ? 0 : tl - Math.max(1, s * 0.02)), tw, Math.max(1, s * 0.02)); else g.fillRect(tx + (dir === 'l' ? 0 : tw - Math.max(1, s * 0.02)), ty, Math.max(1, s * 0.02), tl);
      g.fillStyle = `rgba(4,2,8,${dark.toFixed(2)})`; g.fillRect(tx, ty, tw, tl);
    }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X, Y, s * 0.08, s); g.fillRect(X + s * 0.92, Y, s * 0.08, s);
    return;
  }
  if(w.verb === 'Out'){
    /* the sea cave: daylight off the water, coming in */
    g.fillStyle = rad(g, X + s / 2, Y + s * 1.1, s * 0.1, s * 2.2, [[0, 'rgba(190,225,240,.38)'], [0.5, 'rgba(150,200,225,.12)'], [1, 'rgba(150,200,225,0)']]);
    g.fillRect(X - s * 2, Y - s * 1.5, s * 5, s * 3);
    return;
  }
  /* a doorway: the threshold worn into a hollow, the arch dark over it */
  const q = R(w.x, w.y, 231);
  g.fillStyle = 'rgba(0,0,0,.18)';
  if(w.side === 'l' || w.side === 'r') g.fillRect(X + (w.side === 'l' ? 0 : s * 0.7), Y + s * 0.1, s * 0.3, s * 0.8);
  else g.fillRect(X + s * 0.1, Y + (w.side === 'u' ? 0 : s * 0.7), s * 0.8, s * 0.3);
  ell(g, X + s * 0.5, Y + s * 0.5, s * 0.3, s * 0.22, 'rgba(255,245,230,.04)');
  if(q() < 0.5) ell(g, X + s * (0.3 + q() * 0.4), Y + s * (0.3 + q() * 0.4), s * 0.05, s * 0.03, 'rgba(0,0,0,.2)');
}

/* ---------- a piece of a floor: everything that falls in R0 ---------- */
function cGround(g, d, s, R0){
  const I = cInfo(d), th = I.th;
  const xs = Math.max(-1, R0.x0), xe = Math.min(I.W, R0.x1), ys = Math.max(-1, R0.y0), ye = Math.min(I.H, R0.y1);
  cFlags(g, I, s, R0);
  if(th.sea) cBeach(g, I, s, R0);
  /* the floor's own, under everything standing on it */
  for(let y = ys; y <= ye; y++) for(let x = xs; x <= xe; x++){
    const c = I.at(x, y);
    if(WALLISH(c) || I.wet(x, y)) continue;
    if(c === 's') continue;
    if(c === 'Q') { cCage(g, I, s, x, y); continue; }
    cFloorDress(g, I, s, x, y);
  }
  cWaterPass(g, I, s, R0);
  cSandPass(g, I, s, R0);
  for(let y = ys; y <= ye; y++) for(let x = xs; x <= xe; x++){
    const c = I.at(x, y);
    if(c === '=') cBridge(g, I, s, x, y);
    else if(!WALLISH(c) && !I.wet(x, y)){ cCoping(g, I, s, x, y); cFloorShade(g, I, s, x, y); }
  }
  /* the vault's clock, carved in its floor */
  if(d.vaultClock) cClock(g, d, s);
  (d.leaves || []).forEach(([x, y])=>{ if(x >= xs && x <= xe && y >= ys && y <= ye) cLeaves(g, s, x, y); });
  I.ways.forEach(w=>{ if(w.x >= xs && w.x <= xe && w.y >= ys && w.y <= ye) cWay(g, I, s, w); });
  /* the walls */
  for(let y = ys; y <= ye; y++) for(let x = xs; x <= xe; x++) if(WALLISH(I.at(x, y))) cWall(g, I, s, x, y);
  /* what stands on the floor, back to front */
  for(let y = ys; y <= ye; y++) for(let x = xs; x <= xe; x++){
    const c = I.at(x, y), o = I.obj[c];
    switch(c){
      case ',': cBonePile(g, I, s, x, y); break;
      case 'o': cPillar(g, I, s, x, y); break;
      case 'c': (o === 'rack' ? cRack : o === 'bunk' ? cBunk : o === 'pump' ? cPump : o === 'pew' ? cPew : cCrate)(g, I, s, x, y); break;
      case 'b': cBarrel(g, I, s, x, y); break;
      case 'r': cBlock(g, I, s, x, y); break;
      case 't': cTable(g, I, s, x, y, null, I.d.key === 'cata_pit' ? 'bench' : null); break;
      case 'k': cBunkK(g, I, s, x, y); break;
      case 'x': cRail(g, I, s, x, y); break;
      case 'w': cWineRack(g, I, s, x, y); break;
      case 'Z': cTomb(g, I, s, x, y); break;
      case 'G': cGate(g, I, s, x, y); break;
      case '*': cBrazierBase(g, I, s, x, y); break;
      case 'M': cCradle(g, I, s, x, y); break;
      case 'E': cStoneTable(g, I, s, x, y); break;
      case 'Y': cMachine(g, I, s, x, y); break;
    }
  }
}
function cClock(g, d, s){
  const [cx, cy, r] = d.vaultClock, X = cx * s, Y = cy * s, Rr = r * s;
  g.strokeStyle = 'rgba(170,140,230,.3)'; g.lineWidth = Math.max(2, s * 0.08);
  g.beginPath(); g.arc(X, Y, Rr, 0, TAU); g.stroke();
  g.lineWidth = Math.max(1, s * 0.035); g.beginPath(); g.arc(X, Y, Rr - s * 0.35, 0, TAU); g.stroke();
  for(let k = 0; k < 12; k++){
    const a = k / 12 * TAU, r0 = Rr - s * 0.3, r1 = Rr - (k % 3 ? s * 0.1 : -s * 0.05);
    g.lineWidth = Math.max(1, s * (k % 3 ? 0.035 : 0.07));
    g.beginPath(); g.moveTo(X + Math.cos(a) * r0, Y + Math.sin(a) * r0); g.lineTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1); g.stroke();
  }
  g.lineWidth = Math.max(1.5, s * 0.07); g.strokeStyle = 'rgba(170,140,230,.24)';
  g.beginPath(); g.moveTo(X, Y); g.lineTo(X - 0.55 * Rr, Y - 0.25 * Rr); g.stroke();
  g.beginPath(); g.moveTo(X, Y); g.lineTo(X + 0.15 * Rr, Y - 0.8 * Rr); g.stroke();
}
function cLeaves(g, s, x, y){
  const X = x * s, Y = y * s;
  for(let k = 0; k < 3; k++){
    const q = R(x, y, 241 + k), lx = X + s * (0.15 + q() * 0.7), ly = Y + s * (0.15 + q() * 0.7), a = q() * Math.PI;
    g.save(); g.translate(lx, ly); g.rotate(a);
    ell(g, s * 0.02, s * 0.03, s * 0.14, s * 0.065, 'rgba(0,0,0,.25)');
    ell(g, 0, 0, s * 0.14, s * 0.065, q() < 0.5 ? '#5fae5a' : '#86c66a');
    line(g, -s * 0.12, 0, s * 0.12, 0, 'rgba(30,70,30,.6)', Math.max(0.6, s * 0.01));
    g.restore();
  }
}
/* ---------- what moves: the braziers' flames, light on the water, the vault's glow ---------- */
function cFlame(g, cx, by, r, t, seed){
  const f = 1 + 0.14 * Math.sin(t * 9 + seed * 5.3) + 0.08 * Math.sin(t * 23 + seed * 2.1), lean = Math.sin(t * 5 + seed) * r * 0.14;
  g.fillStyle = 'rgba(255,120,30,.9)';
  g.beginPath(); g.moveTo(cx - r * 0.6, by); g.quadraticCurveTo(cx - r * 0.7, by - r * 1.1 * f, cx + lean, by - r * 2.3 * f); g.quadraticCurveTo(cx + r * 0.7, by - r * 1.1 * f, cx + r * 0.6, by); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,214,110,.95)';
  g.beginPath(); g.moveTo(cx - r * 0.34, by); g.quadraticCurveTo(cx - r * 0.38, by - r * 0.8 * f, cx + lean * 0.6, by - r * 1.5 * f); g.quadraticCurveTo(cx + r * 0.38, by - r * 0.8 * f, cx + r * 0.34, by); g.closePath(); g.fill();
  ell(g, cx, by - r * 0.25, r * 0.16, r * 0.3, 'rgba(255,255,236,.95)');
}
function cAnim(ctx, d, k, ox, oy, V, now){
  const I = cInfo(d), t = now / 1000;
  /* the water: a slow shimmer */
  for(let y = V.y0; y <= V.y1; y++) for(let x = V.x0; x <= V.x1; x++){
    if(I.at(x, y) !== '~') continue;
    const X = ox + x * k, Y = oy + y * k, q = R(x, y, 251);
    for(let i = 0; i < 2; i++){
      const ph = q() * TAU, sp = 0.6 + q() * 0.5, lx = X + k * (0.15 + q() * 0.6) + Math.sin(t * sp + ph) * k * 0.06, ly = Y + k * (0.2 + q() * 0.6);
      const a = 0.06 + 0.06 * (0.5 + 0.5 * Math.sin(t * sp * 1.7 + ph));
      ctx.strokeStyle = `rgba(170,220,240,${a.toFixed(3)})`; ctx.lineWidth = Math.max(1, k * 0.014);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx + k * 0.1, ly - k * 0.025, lx + k * 0.2, ly); ctx.stroke();
    }
  }
  /* the braziers: flames, and their light breathing on the floor */
  I.lights.forEach(({ x, y }, i)=>{
    if(x < V.x0 - 3 || x > V.x1 + 3 || y < V.y0 - 3 || y > V.y1 + 3) return;
    const cx = ox + (x + 0.5) * k, by = oy + (y + 0.42) * k, br = 0.5 + 0.5 * Math.sin(t * 3.1 + i * 1.7);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rad(ctx, cx, by, k * 0.1, k * 1.9, [[0, `rgba(255,150,60,${(0.12 + br * 0.06).toFixed(3)})`], [1, 'rgba(255,150,60,0)']]);
    ctx.fillRect(cx - k * 2, by - k * 2, k * 4, k * 4);
    ctx.restore();
    cFlame(ctx, cx - k * 0.08, by, k * 0.12, t, i * 3.1);
    cFlame(ctx, cx + k * 0.08, by + k * 0.01, k * 0.1, t + 0.4, i * 3.1 + 1.3);
    cFlame(ctx, cx, by + k * 0.02, k * 0.15, t + 0.9, i * 3.1 + 2.2);
    for(let e = 0; e < 3; e++){                                             // sparks going up
      const ph = ((t * 0.8 + e * 0.37 + i * 0.21) % 1), ex = cx + Math.sin(t * 2 + e * 2.1 + i) * k * 0.12, ey = by - ph * k * 0.9;
      circ(ctx, ex, ey, Math.max(0.8, k * 0.012), `rgba(255,200,120,${(0.9 * (1 - ph)).toFixed(2)})`);
    }
  });
  /* the vault: its machines' jars, glowing, and the cradle's ring */
  if(d.vault){
    for(let y = V.y0; y <= V.y1; y++) for(let x = V.x0; x <= V.x1; x++){
      const c = I.at(x, y);
      if(c !== 'Y' && c !== 'M') continue;
      const X = ox + x * k, Y = oy + y * k, p = 0.5 + 0.5 * Math.sin(t * 2.2 + x + y * 1.3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if(c === 'Y'){ for(let j = 0; j < 2; j++){ const jx = X + k * (0.31 + j * 0.38), jy = Y + k * 0.34; ctx.fillStyle = rad(ctx, jx, jy, 0, k * 0.4, [[0, `rgba(170,120,255,${(0.18 + p * 0.18).toFixed(3)})`], [1, 'rgba(170,120,255,0)']]); ctx.fillRect(jx - k * 0.4, jy - k * 0.4, k * 0.8, k * 0.8); } }
      else { ctx.fillStyle = rad(ctx, X + k / 2, Y + k / 2, 0, k * 0.7, [[0, `rgba(150,110,255,${(0.1 + p * 0.14).toFixed(3)})`], [1, 'rgba(90,230,255,0)']]); ctx.fillRect(X - k * 0.2, Y - k * 0.2, k * 1.4, k * 1.4); }
      ctx.restore();
    }
  }
}
PAINTERS.cata = {
  handles:(d)=> /^cata_/.test(d.key),
  sig:(d)=> cInfo(d).sig,
  ground:cGround,
  anim:cAnim,
  tall:cTall,
  standable:(d, x, y)=> cInfo(d).open(x, y),
  bg:'#0b0a0d',
};

/* ============================================================
   THE TOWN'S ROOMS AND THE VILLA (4.46)
   The designer: "and also the interiors of padrino's hilltop mansion and all the houses on all floors, please!"
   Each room as the castle's are (24-room-art.js): its floor run on from square to square — long boards each its own
   length and shade, knots and nails in them; terracotta tiles; marble chequers with their veins; wide shed boards; a
   carpet's pile — its rugs, its back wall's face (plaster over panelling, a rail, the skirting, the cornice) with its
   windows (the dusk outside, curtains either side) and its pictures, its doorway with the street beyond, and what stands
   in it: shelves of plates and jars and bottles and books and files, counters, a hearth with its fire burning, an iron
   range, beds, a grand piano, plants, armchairs, chairs and tables laid as each room lays them, crates and barrels and
   sacks, the villa's statues, the opera's seats, the cells' bars, nets, the barber's chairs, benches, the stage — and what
   only one room has (its clock, its sign, its poster, the soup's steam). Then the lamplight. Where the room has a look of
   its own, R5_ROOM_LOOKS (15-region5.js) says it; the grids (15-region5.js) are as they were.
   ============================================================ */
const RM_DEF = { floor:'planks', fa:'#9a6a40', wall:'#4a3c30', face:'#d8c49e', trim:'#6e4e34', rug:'#7d3a2e',
  shelf:'plates', stove:'stove', counter:'wood', cloth:'wood', chair:'#7a5232', quilt:'#5a7a9a', plant:'basil',
  crate:'plain', barrel:'barrel', bench:'#7a5232', windows:[], frames:[] };
const _rmInfo = new Map();
function rmSig(d){ let h = 2166136261; const s = d.rows.join('|'); for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function rmInfo(d){
  const sig = rmSig(d);
  let I = _rmInfo.get(d.key);
  if(I && I.sig === sig) return I;
  const W = d.rows[0].length, H = d.rows.length;
  const at = (x, y)=> (y < 0 || y >= H || x < 0 || x >= W) ? '#' : d.rows[y][x];
  const open = (x, y)=> at(x, y) !== '#';
  const L = Object.assign({}, RM_DEF, (typeof R5_ROOM_LOOKS !== 'undefined' && R5_ROOM_LOOKS[d.key]) || RM_MORE[d.key] || {});
  const zones = L.zones || [];
  const lookAt = (x, y)=>{ const z = zones.find(z=> x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1); return z ? Object.assign({}, L, z) : L; };
  /* runs of one letter: a table, a counter, a rug, a bed, a stage */
  const runs = new Map(), seen = new Set();
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const c = at(x, y), key = x + ',' + y;
    if(seen.has(key) || !'tKDRHZL,_JNSck'.includes(c)) continue;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    const st = [[x, y]]; seen.add(key);
    while(st.length){
      const [a, b] = st.pop();
      x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=>{ const u = a + dx, v = b + dy, kk = u + ',' + v; if(!seen.has(kk) && at(u, v) === c){ seen.add(kk); st.push([u, v]); } });
    }
    const run = { c, x0, y0, x1, y1, w:x1 - x0 + 1, h:y1 - y0 + 1 };
    for(let b = y0; b <= y1; b++) for(let a = x0; a <= x1; a++) if(at(a, b) === c) runs.set(a + ',' + b, run);
  }
  const doors = (d.things || []).filter(t=> t.verb === 'Out' || (t.walk && t.where && (t.y === H - 1 || t.y === 0))).map(t=> ({ x:t.x, y:t.y, w:t.w || 1, verb:t.verb }));
  I = { d, sig, W, H, at, open, L, lookAt, runs, doors, boards:new Map() };
  _rmInfo.set(d.key, I);
  return I;
}

/* ---------- the floors: each running on from square to square ---------- */
function rmBoardRow(I, key, r, len){
  const k = key + ':' + r;
  let a = I.boards.get(k);
  if(a) return a;
  const q = R(r, key.length * 31 + key.charCodeAt(0), 301);
  a = [];
  let x = -1.5 - q() * 2;
  while(x < I.W + 1.5){ a.push(x); x += len[0] + q() * (len[1] - len[0]); }
  a.push(x);
  I.boards.set(k, a);
  return a;
}
/* long boards across the room, each its own length and shade, its grain, a knot, the nails at its ends */
function rmPlanks(g, I, s, R0, L, wide){
  const bh = wide ? 0.34 : 0.25, len = wide ? [1.6, 3.6] : [1.1, 3.0], base = L.fa;
  g.fillStyle = sh(base, -0.5); g.fillRect((R0.x0 - 1) * s, (R0.y0 - 1) * s, (R0.x1 - R0.x0 + 3) * s, (R0.y1 - R0.y0 + 3) * s);
  for(let r = Math.floor(R0.y0 / bh) - 1; r <= Math.ceil((R0.y1 + 1) / bh); r++){
    const y = r * bh, br = rmBoardRow(I, wide ? 'B' : 'P', r, len);
    for(let i = 0; i < br.length - 1; i++){
      const xa = br[i], xb = br[i + 1];
      if(xb < R0.x0 - 0.2 || xa > R0.x1 + 1.2) continue;
      const q = R(Math.round(xa * 32), r, 303), v = (q() - 0.5) * 0.22;
      const X = xa * s + 0.6, Y = y * s + 0.6, w = (xb - xa) * s - 1.2, h = bh * s - 1.2;
      const col = sh(base, v);
      g.fillStyle = lin(g, 0, Y, 0, Y + h, [[0, sh(col, 0.06)], [1, sh(col, -0.08)]]); g.fillRect(X, Y, w, h);
      if(s >= 20){
        g.strokeStyle = `rgba(50,26,10,${(0.12 + q() * 0.08).toFixed(2)})`; g.lineWidth = Math.max(0.6, s * 0.006);
        for(let k = 0; k < 3; k++){ const yy = Y + h * (0.2 + k * 0.3) + (q() - 0.5) * h * 0.1; g.beginPath(); g.moveTo(X, yy); for(let t = 1; t <= 6; t++) g.lineTo(X + w * t / 6, yy + (q() - 0.5) * h * 0.14); g.stroke(); }
        if(q() < 0.35){ const kx = X + w * (0.15 + q() * 0.7), ky = Y + h * (0.35 + q() * 0.3); ell(g, kx, ky, h * 0.22, h * 0.15, `rgba(60,30,12,.42)`); ell(g, kx, ky, h * 0.1, h * 0.07, 'rgba(40,18,6,.5)');
          g.strokeStyle = 'rgba(50,26,10,.25)'; g.beginPath(); g.ellipse(kx, ky, h * 0.34, h * 0.24, 0, 0, TAU); g.stroke(); }
      }
      g.fillStyle = 'rgba(255,236,206,.12)'; g.fillRect(X, Y, w, Math.max(1, s * 0.012));
      g.fillStyle = 'rgba(30,14,4,.3)'; g.fillRect(X + w - Math.max(1, s * 0.012), Y, Math.max(1, s * 0.012), h);
      if(s >= 16) [X + s * 0.05, X + w - s * 0.05].forEach(nx=>{ circ(g, nx, Y + h * 0.3, Math.max(0.6, s * 0.01), 'rgba(40,30,24,.6)'); circ(g, nx, Y + h * 0.7, Math.max(0.6, s * 0.01), 'rgba(40,30,24,.6)'); });
    }
  }
}
/* square tiles, two to a square: glazed, two colours */
function rmTiles(g, I, s, R0, L, n){
  n = n || 2;
  const ts = 1 / n, gap = Math.max(0.6, s * 0.012);
  g.fillStyle = sh(L.fb || L.fa, -0.45); g.fillRect((R0.x0 - 1) * s, (R0.y0 - 1) * s, (R0.x1 - R0.x0 + 3) * s, (R0.y1 - R0.y0 + 3) * s);
  for(let ty = (R0.y0 - 1) * n; ty < (R0.y1 + 2) * n; ty++) for(let tx = (R0.x0 - 1) * n; tx < (R0.x1 + 2) * n; tx++){
    const q = R(tx, ty, 311), dark = ((tx + ty) % 2 + 2) % 2 === 1, base = dark ? (L.fb || sh(L.fa, -0.18)) : L.fa;
    const X = tx * ts * s + gap, Y = ty * ts * s + gap, w = ts * s - 2 * gap;
    g.fillStyle = sh(base, (q() - 0.5) * 0.07); g.fillRect(X, Y, w, w);
    g.fillStyle = lin(g, X, Y, X + w, Y + w, [[0, 'rgba(255,255,255,.14)'], [0.45, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.08)']]); g.fillRect(X, Y, w, w);
    if(q() < 0.08){ g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = Math.max(0.6, s * 0.007); g.beginPath(); g.moveTo(X + w * q(), Y); g.lineTo(X + w * q(), Y + w); g.stroke(); }
  }
}
/* marble chequers, one to a square: the light ones veined, all of them polished */
function rmChecker(g, I, s, R0, L){
  for(let y = R0.y0 - 1; y <= R0.y1 + 1; y++) for(let x = R0.x0 - 1; x <= R0.x1 + 1; x++){
    const dark = ((x + y) % 2 + 2) % 2 === 1, base = dark ? (L.fb || '#3a3434') : L.fa, q = R(x, y, 321);
    const X = x * s, Y = y * s;
    g.fillStyle = sh(base, (q() - 0.5) * 0.05); g.fillRect(X, Y, s, s);
    if(s >= 16){
      g.strokeStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(120,110,100,.22)'; g.lineWidth = Math.max(0.6, s * 0.008);
      for(let k = 0; k < 2; k++){ g.beginPath(); let vx = X + q() * s, vy = Y; g.moveTo(vx, vy); for(let t = 0; t < 5; t++){ vx += (q() - 0.4) * s * 0.3; vy += s * 0.22; g.lineTo(vx, vy); } g.stroke(); }
    }
    g.fillStyle = lin(g, X, Y, X + s, Y + s, [[0, 'rgba(255,255,255,.12)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.06)']]); g.fillRect(X, Y, s, s);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X, Y + s - Math.max(0.6, s * 0.008), s, Math.max(0.6, s * 0.008)); g.fillRect(X + s - Math.max(0.6, s * 0.008), Y, Math.max(0.6, s * 0.008), s);
  }
}
/* terracotta: four to a square, each fired its own shade, the grout between */
function rmTerracotta(g, I, s, R0, L){
  const n = 2, ts = 0.5, gap = Math.max(0.8, s * 0.018);
  g.fillStyle = '#b8a890'; g.fillRect((R0.x0 - 1) * s, (R0.y0 - 1) * s, (R0.x1 - R0.x0 + 3) * s, (R0.y1 - R0.y0 + 3) * s);
  for(let ty = (R0.y0 - 1) * n; ty < (R0.y1 + 2) * n; ty++) for(let tx = (R0.x0 - 1) * n; tx < (R0.x1 + 2) * n; tx++){
    const q = R(tx, ty, 331), X = tx * ts * s + gap, Y = ty * ts * s + gap, w = ts * s - 2 * gap;
    const col = sh(L.fa, (q() - 0.5) * 0.22);
    rr(g, X, Y, w, w, w * 0.08); g.fillStyle = col; g.fill();
    g.fillStyle = rad(g, X + w * (0.3 + q() * 0.4), Y + w * (0.3 + q() * 0.4), 0, w * 0.7, [[0, 'rgba(255,220,180,.12)'], [1, 'rgba(0,0,0,.08)']]); g.fillRect(X, Y, w, w);
    if(s >= 20) for(let k = 0; k < 6; k++){ g.fillStyle = q() < 0.5 ? 'rgba(80,30,10,.2)' : 'rgba(255,220,190,.15)'; g.fillRect(X + q() * w, Y + q() * w, Math.max(0.7, s * 0.01), Math.max(0.7, s * 0.01)); }
    if(q() < 0.1){ poly(g, [[X, Y], [X + w * 0.2, Y], [X, Y + w * 0.2]], '#b8a890'); }
  }
}
/* stone flags, warm, as a store's or a guard house's */
function rmStone(g, I, s, R0, L){
  const ch = 0.5, gap = Math.max(0.6, s * 0.016);
  g.fillStyle = sh(L.fa, -0.5); g.fillRect((R0.x0 - 1) * s, (R0.y0 - 1) * s, (R0.x1 - R0.x0 + 3) * s, (R0.y1 - R0.y0 + 3) * s);
  for(let r = Math.floor(R0.y0 / ch) - 1; r <= Math.ceil((R0.y1 + 1) / ch); r++){
    const br = rmBoardRow(I, 'S', r, [0.6, 1.3]);
    for(let i = 0; i < br.length - 1; i++){
      const xa = br[i], xb = br[i + 1];
      if(xb < R0.x0 - 0.2 || xa > R0.x1 + 1.2) continue;
      cSlab(g, s, xa * s + gap, r * ch * s + gap, (xb - xa) * s - 2 * gap, ch * s - 2 * gap, Object.assign({}, T_BASE, { floor:L.fa, mortar:sh(L.fa, -0.5) }), R(Math.round(xa * 64), r, 341));
    }
  }
}
/* the opera's carpet: deep red pile, a gold figure in it */
function rmCarpet(g, I, s, R0, L){
  for(let y = R0.y0 - 1; y <= R0.y1 + 1; y++) for(let x = R0.x0 - 1; x <= R0.x1 + 1; x++){
    const X = x * s, Y = y * s, q = R(x, y, 351);
    g.fillStyle = sh(L.fa, (q() - 0.5) * 0.04); g.fillRect(X, Y, s, s);
    if(s >= 20) for(let k = 0; k < 40; k++){ g.fillStyle = q() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,200,200,.05)'; g.fillRect(X + q() * s, Y + q() * s, Math.max(0.7, s * 0.008), Math.max(0.7, s * 0.008)); }
    if(((x + y) % 2 + 2) % 2 === 0){
      const cx = X + s / 2, cy = Y + s / 2, r0 = s * 0.16;
      g.strokeStyle = 'rgba(230,180,80,.32)'; g.lineWidth = Math.max(0.8, s * 0.014);
      g.beginPath(); g.moveTo(cx, cy - r0); g.lineTo(cx + r0, cy); g.lineTo(cx, cy + r0); g.lineTo(cx - r0, cy); g.closePath(); g.stroke();
      circ(g, cx, cy, r0 * 0.3, 'rgba(230,180,80,.35)');
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([a, b])=> circ(g, cx + a * r0 * 1.5, cy + b * r0 * 1.5, r0 * 0.14, 'rgba(230,180,80,.3)'));
    }
  }
}
/* the stage: broad boards, polished by feet, its lip */
function rmStage(g, I, s, x, y){
  const X = x * s, Y = y * s, q = R(x, y, 361);
  for(let k = 0; k < 3; k++){ const by = Y + k * s / 3, col = sh('#a87848', (q() - 0.5) * 0.16); g.fillStyle = lin(g, 0, by, 0, by + s / 3, [[0, sh(col, 0.08)], [1, sh(col, -0.08)]]); g.fillRect(X, by + 0.6, s, s / 3 - 1.2); g.fillStyle = 'rgba(40,18,6,.4)'; g.fillRect(X, by + s / 3 - 0.8, s, Math.max(0.8, s * 0.01)); }
  g.fillStyle = 'rgba(255,240,210,.08)'; g.fillRect(X, Y, s, s);
}
function rmFloors(g, I, s, R0){
  /* each kind of floor in its own squares (the villa's hall, its kitchen…) */
  const groups = new Map();
  for(let y = R0.y0 - 1; y <= R0.y1 + 1; y++) for(let x = R0.x0 - 1; x <= R0.x1 + 1; x++){
    if(!I.open(x, y) && !(y === I.H - 1 && I.doors.some(dd=> dd.x === x && dd.y === y))) continue;
    const Lt = I.lookAt(x, y), kind = I.at(x, y) === '_' ? 'stage' : Lt.floor, key = kind + '|' + Lt.fa + '|' + (Lt.fb || '');
    if(!groups.has(key)) groups.set(key, { kind, L:Lt, tiles:[] });
    groups.get(key).tiles.push([x, y]);
  }
  groups.forEach(gr=>{
    g.save(); g.beginPath(); gr.tiles.forEach(([x, y])=> g.rect(x * s - 0.5, y * s - 0.5, s + 1, s + 1)); g.clip();
    const k = gr.kind;
    if(k === 'stage') gr.tiles.forEach(([x, y])=> rmStage(g, I, s, x, y));
    else if(k === 'tiles') rmTiles(g, I, s, R0, gr.L, 2);
    else if(k === 'checker') rmChecker(g, I, s, R0, gr.L);
    else if(k === 'terracotta') rmTerracotta(g, I, s, R0, gr.L);
    else if(k === 'stone') rmStone(g, I, s, R0, gr.L);
    else if(k === 'carpet') rmCarpet(g, I, s, R0, gr.L);
    else if(k === 'boards') rmPlanks(g, I, s, R0, gr.L, true);
    else rmPlanks(g, I, s, R0, gr.L, false);
    g.restore();
  });
}
/* a rug: its ground, its border, a figure in the middle, its fringe */
function rmRug(g, I, s, run){
  const col = I.lookAt(run.x0, run.y0).rug || '#7d3a2e';
  const X = run.x0 * s + s * 0.08, Y = run.y0 * s + s * 0.1, w = run.w * s - s * 0.16, h = run.h * s - s * 0.2;
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X + s * 0.03, Y + s * 0.04, w, h);
  g.fillStyle = col; g.fillRect(X, Y, w, h);
  const b = Math.min(w, h) * 0.12, gold = 'rgba(236,200,130,.85)';
  g.strokeStyle = gold; g.lineWidth = Math.max(1, s * 0.03); g.strokeRect(X + b * 0.5, Y + b * 0.5, w - b, h - b);
  g.strokeStyle = sh(col, -0.3); g.lineWidth = Math.max(1, s * 0.05); g.strokeRect(X + b * 1.15, Y + b * 1.15, w - b * 2.3, h - b * 2.3);
  /* a run of little figures along its border */
  g.fillStyle = 'rgba(236,200,130,.6)';
  for(let t = X + b * 1.4; t < X + w - b; t += s * 0.18){ g.beginPath(); g.moveTo(t, Y + b * 0.5); g.lineTo(t + s * 0.045, Y + b * 0.85); g.lineTo(t, Y + b * 1.2); g.lineTo(t - s * 0.045, Y + b * 0.85); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(t, Y + h - b * 1.2); g.lineTo(t + s * 0.045, Y + h - b * 0.85); g.lineTo(t, Y + h - b * 0.5); g.lineTo(t - s * 0.045, Y + h - b * 0.85); g.closePath(); g.fill(); }
  /* its middle: a medallion */
  const cx = X + w / 2, cy = Y + h / 2, rx = Math.max(s * 0.2, w * 0.24), ry = Math.max(s * 0.14, h * 0.22);
  g.fillStyle = sh(col, 0.18); g.beginPath(); g.moveTo(cx, cy - ry); g.lineTo(cx + rx, cy); g.lineTo(cx, cy + ry); g.lineTo(cx - rx, cy); g.closePath(); g.fill();
  g.strokeStyle = gold; g.lineWidth = Math.max(1, s * 0.02); g.stroke();
  ell(g, cx, cy, rx * 0.28, ry * 0.28, 'rgba(236,200,130,.75)');
  if(s >= 20) for(let k = 0; k < run.w * run.h * 30; k++){ const q = R(run.x0 * 9 + k, run.y0, 371); g.fillStyle = q() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,240,220,.06)'; g.fillRect(X + q() * w, Y + q() * h, Math.max(0.7, s * 0.008), Math.max(0.7, s * 0.008)); }
  /* the fringe at its ends */
  g.strokeStyle = 'rgba(236,224,196,.85)'; g.lineWidth = Math.max(0.7, s * 0.01);
  for(let t = Y + s * 0.03; t < Y + h; t += s * 0.04){ line(g, X, t, X - s * 0.06, t + s * 0.01, 'rgba(236,224,196,.85)', Math.max(0.7, s * 0.01)); line(g, X + w, t, X + w + s * 0.06, t + s * 0.01, 'rgba(236,224,196,.85)', Math.max(0.7, s * 0.01)); }
}
/* the walls' shadows on the floor */
function rmFloorShade(g, I, s, x, y){
  const X = x * s, Y = y * s, op = (a, b)=> I.open(a, b);
  if(!op(x, y - 1)) cBand(g, X, Y, s, s * 0.38, true, 0.42, op(x - 1, y) && op(x - 1, y - 1), op(x + 1, y) && op(x + 1, y - 1));
  if(!op(x - 1, y)) cBandV(g, X, Y, s * 0.16, s, 0.3, op(x, y - 1) && op(x - 1, y - 1), op(x, y + 1) && op(x - 1, y + 1), false);
  if(!op(x + 1, y)) cBandV(g, X + s, Y, s * 0.16, s, 0.26, op(x, y - 1) && op(x + 1, y - 1), op(x, y + 1) && op(x + 1, y + 1), true);
}

/* ---------- the walls ---------- */
/* a wall with the room below it shows its face: the cornice, plaster, a rail, the panelling, the skirting; a wall seen
   from above (the sides, the front, a wall between two rooms) its top, a lip of lit plaster along its edge */
function rmWall(g, I, s, x, y){
  const X = x * s, Y = y * s, Lt = I.lookAt(x, Math.min(I.H - 1, y + 1)), L = I.L, q = R(x, y, 381);
  const face = I.open(x, y + 1) && y + 1 < I.H;
  const oW = I.open(x - 1, y), oE = I.open(x + 1, y), oN = I.open(x, y - 1);
  const door = I.doors.find(dd=> y === dd.y && x >= dd.x && x < dd.x + dd.w);
  if(door) return rmDoorway(g, I, s, x, y, door);
  if(!face){
    /* a wall seen from above, as the castle's are (24-room-art.js, wallTop): its top plastered and a little worn, a lit
       moulding along whichever edges the room is at and a dark line inside it; where it only touches the room at a
       corner, a lit corner */
    const cap = mix(L.wall, L.face, 0.3), capL = sh(Lt.face, -0.06), capD = sh(cap, -0.34);
    g.fillStyle = cap; g.fillRect(X, Y, s, s);
    g.fillStyle = lin(g, X, Y, X + s, Y + s, [[0, 'rgba(255,245,225,.05)'], [1, 'rgba(0,0,0,.08)']]); g.fillRect(X, Y, s, s);
    if(s >= 16) for(let i = 0; i < 12; i++){ g.fillStyle = q() < 0.5 ? 'rgba(0,0,0,.07)' : 'rgba(255,245,225,.06)'; g.fillRect(X + q() * s, Y + q() * s, s * (0.04 + q() * 0.16), Math.max(0.7, s * 0.012)); }
    const e = s * 0.09, dl = Math.max(1, s * 0.02);
    if(oN){ g.fillStyle = capL; g.fillRect(X, Y, s, e); g.fillStyle = capD; g.fillRect(X + (oW ? e : 0), Y + e, s - (oW ? e : 0) - (oE ? e : 0), dl); }
    if(oW){ g.fillStyle = capL; g.fillRect(X, Y, e, s); g.fillStyle = capD; g.fillRect(X + e, Y + (oN ? e : 0), dl, s - (oN ? e : 0)); }
    if(oE){ g.fillStyle = sh(capL, -0.16); g.fillRect(X + s - e, Y, e, s); g.fillStyle = capD; g.fillRect(X + s - e - dl, Y + (oN ? e : 0), dl, s - (oN ? e : 0)); }
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b])=>{
      if(!I.open(x + a, y + b) || I.open(x + a, y) || I.open(x, y + b)) return;
      g.fillStyle = b < 0 || a < 0 ? capL : sh(capL, -0.16);
      g.fillRect(a < 0 ? X : X + s - e, b < 0 ? Y : Y + s - e, e, e);
    });
    return;
  }
  if(L.stoneFace) return rmStoneFace(g, I, s, x, y);
  g.fillStyle = L.wall; g.fillRect(X, Y, s, s);
  /* its face */
  const ft = Y + s * 0.06, rail = Y + s * 0.5, skirt = Y + s * 0.88;
  g.fillStyle = sh(Lt.face, -0.25); g.fillRect(X, Y, s, ft - Y);                                  // the cornice's shadow
  g.fillStyle = Lt.face; g.fillRect(X, ft, s, rail - ft);
  if(s >= 20){                                                                                     // the plaster's texture
    for(let i = 0; i < 6; i++){ const px = X + q() * s, py = ft + q() * (rail - ft), r = s * (0.1 + q() * 0.16); g.fillStyle = rad(g, px, py, 0, r, [[0, q() < 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(80,60,40,.06)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(px - r, py - r, r * 2, r * 2); }
    for(let i = 0; i < 18; i++){ g.fillStyle = q() < 0.5 ? 'rgba(60,40,20,.08)' : 'rgba(255,255,255,.07)'; g.fillRect(X + q() * s, ft + q() * (rail - ft), Math.max(0.7, s * 0.008), Math.max(0.7, s * 0.008)); }
  }
  /* the cornice */
  g.fillStyle = sh(Lt.face, 0.12); g.fillRect(X, ft - s * 0.01, s, s * 0.04);
  g.fillStyle = sh(Lt.trim, -0.1); g.fillRect(X, ft + s * 0.03, s, Math.max(1, s * 0.015));
  /* the panelling below its rail */
  g.fillStyle = Lt.trim; g.fillRect(X, rail, s, skirt - rail);
  const pw = s / 2;
  for(let k = 0; k < 2; k++){
    const px = X + k * pw + s * 0.05, py = rail + s * 0.06, w = pw - s * 0.1, h = skirt - rail - s * 0.11;
    g.fillStyle = sh(Lt.trim, -0.12); g.fillRect(px, py, w, h);
    g.fillStyle = sh(Lt.trim, 0.12); g.fillRect(px, py, w, Math.max(1, s * 0.012)); g.fillRect(px, py, Math.max(1, s * 0.012), h);
    g.fillStyle = sh(Lt.trim, -0.32); g.fillRect(px, py + h - Math.max(1, s * 0.012), w, Math.max(1, s * 0.012)); g.fillRect(px + w - Math.max(1, s * 0.012), py, Math.max(1, s * 0.012), h);
    if(s >= 20){ g.strokeStyle = 'rgba(30,14,4,.12)'; g.lineWidth = Math.max(0.6, s * 0.005); for(let j = 0; j < 3; j++){ const gy = py + h * (0.2 + j * 0.3); g.beginPath(); g.moveTo(px + w * 0.1, gy); g.quadraticCurveTo(px + w * 0.5, gy + h * 0.06, px + w * 0.9, gy); g.stroke(); } }
  }
  /* its rail, its skirting */
  g.fillStyle = sh(Lt.trim, 0.2); g.fillRect(X, rail - s * 0.02, s, s * 0.04);
  g.fillStyle = 'rgba(255,240,215,.2)'; g.fillRect(X, rail - s * 0.02, s, Math.max(1, s * 0.01));
  g.fillStyle = sh(Lt.trim, -0.35); g.fillRect(X, skirt, s, Y + s - skirt);
  g.fillStyle = 'rgba(255,240,215,.14)'; g.fillRect(X, skirt, s, Math.max(1, s * 0.01));
  /* where it turns a corner */
  if(oW){ g.fillStyle = lin(g, X, 0, X + s * 0.12, 0, [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X, Y, s * 0.12, s); }
  if(oE){ g.fillStyle = lin(g, X + s, 0, X + s * 0.88, 0, [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X + s * 0.88, Y, s * 0.12, s); }
  if(!I.open(x - 1, y + 1) && !oW){ g.fillStyle = lin(g, X, 0, X + s * 0.2, 0, [[0, 'rgba(0,0,0,.28)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X, Y, s * 0.2, s); }
  if(!I.open(x + 1, y + 1) && !oE){ g.fillStyle = lin(g, X + s, 0, X + s * 0.8, 0, [[0, 'rgba(0,0,0,.28)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X + s * 0.8, Y, s * 0.2, s); }
}
/* a window in the back wall: its frame, four panes of dusk — or (Grandpa's) the tower's purple light far off — its
   curtains, its sill */
function rmWindow(g, I, s, x, y){
  const X = x * s, Y = y * s, Lt = I.lookAt(x, y + 1);
  const l = X + s * 0.16, r = X + s * 0.84, t = Y + s * 0.1, b = Y + s * 0.74;
  g.fillStyle = sh(Lt.trim, -0.2); g.fillRect(l - s * 0.04, t - s * 0.04, r - l + s * 0.08, b - t + s * 0.06);
  g.fillStyle = lin(g, 0, t, 0, b, [[0, '#1c2148'], [0.55, '#4a3a6a'], [1, '#b5707a']]); g.fillRect(l, t, r - l, b - t);
  /* stars, and the town's lights below */
  [[0.25, 0.18], [0.7, 0.12], [0.45, 0.3], [0.82, 0.32]].forEach(([a, c], i)=> circ(g, l + (r - l) * a, t + (b - t) * c, Math.max(0.6, s * (0.008 + (i % 2) * 0.004)), 'rgba(255,250,220,.85)'));
  g.fillStyle = '#2a2236'; g.beginPath(); g.moveTo(l, b); g.lineTo(l, b - s * 0.1); g.lineTo(l + (r - l) * 0.3, b - s * 0.16); g.lineTo(l + (r - l) * 0.55, b - s * 0.11); g.lineTo(l + (r - l) * 0.8, b - s * 0.18); g.lineTo(r, b - s * 0.12); g.lineTo(r, b); g.closePath(); g.fill();
  [[0.2, 0.08], [0.42, 0.06], [0.7, 0.1]].forEach(([a, c])=> circ(g, l + (r - l) * a, b - s * c, Math.max(0.7, s * 0.012), 'rgba(255,214,130,.9)'));
  if(I.d.key === 'room_grandpa'){ g.fillStyle = 'rgba(190,120,255,.85)'; g.fillRect(l + (r - l) * 0.62, b - s * 0.36, s * 0.05, s * 0.2); g.fillStyle = rad(g, l + (r - l) * 0.645, b - s * 0.3, 0, s * 0.14, [[0, 'rgba(190,120,255,.5)'], [1, 'rgba(190,120,255,0)']]); g.fillRect(l, t, r - l, b - t); }
  /* the frame across it */
  g.fillStyle = '#f2ead8'; g.fillRect((l + r) / 2 - s * 0.012, t, s * 0.024, b - t); g.fillRect(l, (t + b) / 2 - s * 0.012, r - l, s * 0.024);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(l, t); g.lineTo(l + (r - l) * 0.3, t); g.lineTo(l, t + (b - t) * 0.4); g.closePath(); g.fill();
  /* its sill */
  g.fillStyle = sh(Lt.trim, 0.15); g.fillRect(l - s * 0.07, b, r - l + s * 0.14, s * 0.05);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(l - s * 0.07, b + s * 0.05, r - l + s * 0.14, Math.max(1, s * 0.015));
  /* its curtains, either side */
  const cc = I.d.key === 'villa' ? '#6a1e2e' : sh(Lt.rug || '#7d3a2e', 0.1);
  [[l - s * 0.13, 1], [r + s * 0.13, -1]].forEach(([cx, dir])=>{
    g.fillStyle = lin(g, cx - s * 0.08, 0, cx + s * 0.08, 0, [[0, sh(cc, -0.2)], [0.5, sh(cc, 0.12)], [1, sh(cc, -0.25)]]);
    g.beginPath(); g.moveTo(cx - s * 0.07, Y + s * 0.04); g.lineTo(cx + s * 0.07, Y + s * 0.04); g.quadraticCurveTo(cx + dir * s * 0.02, Y + s * 0.5, cx + s * 0.08, b + s * 0.06); g.lineTo(cx - s * 0.08, b + s * 0.06); g.quadraticCurveTo(cx - dir * s * 0.02, Y + s * 0.5, cx - s * 0.07, Y + s * 0.04); g.closePath(); g.fill();
    for(let k = -1; k <= 1; k++) line(g, cx + k * s * 0.03, Y + s * 0.06, cx + k * s * 0.035, b + s * 0.04, 'rgba(0,0,0,.15)', Math.max(0.6, s * 0.006));
  });
  g.fillStyle = '#8a6a3a'; g.fillRect(l - s * 0.22, Y + s * 0.03, r - l + s * 0.44, Math.max(1, s * 0.025));
}
/* a picture on the back wall, in its frame: a boat at sea, a net, shells, a photograph, the lemon groves */
function rmFrame(g, I, s, x, y, kind){
  const X = x * s, Y = y * s, l = X + s * 0.22, r = X + s * 0.78, t = Y + s * 0.12, b = Y + s * 0.62;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(l + s * 0.02, t + s * 0.03, r - l, b - t);
  const gold = kind === 'photo' || kind === 'photo2';
  g.fillStyle = gold ? '#b8913e' : '#7a5530'; g.fillRect(l, t, r - l, b - t);
  g.fillStyle = gold ? '#e3c475' : '#9a7044'; g.fillRect(l, t, r - l, Math.max(1, s * 0.02)); g.fillRect(l, t, Math.max(1, s * 0.02), b - t);
  const il = l + s * 0.05, ir = r - s * 0.05, it = t + s * 0.05, ib = b - s * 0.05, iw = ir - il, ih = ib - it;
  if(kind === 'boat'){
    g.fillStyle = lin(g, 0, it, 0, ib, [[0, '#a8cfe0'], [0.55, '#d8ecf0'], [0.56, '#3f7f9a'], [1, '#2a5f78']]); g.fillRect(il, it, iw, ih);
    g.fillStyle = '#6a3e22'; g.beginPath(); g.moveTo(il + iw * 0.2, it + ih * 0.66); g.lineTo(il + iw * 0.8, it + ih * 0.66); g.lineTo(il + iw * 0.68, it + ih * 0.8); g.lineTo(il + iw * 0.32, it + ih * 0.8); g.closePath(); g.fill();
    line(g, il + iw * 0.5, it + ih * 0.66, il + iw * 0.5, it + ih * 0.15, '#4a2a14', Math.max(0.7, s * 0.008));
    g.fillStyle = '#f6efe0'; g.beginPath(); g.moveTo(il + iw * 0.52, it + ih * 0.18); g.lineTo(il + iw * 0.52, it + ih * 0.6); g.lineTo(il + iw * 0.78, it + ih * 0.6); g.closePath(); g.fill();
  } else if(kind === 'net'){
    g.fillStyle = '#cdb88c'; g.fillRect(il, it, iw, ih);
    g.strokeStyle = '#6a5436'; g.lineWidth = Math.max(0.6, s * 0.006);
    for(let k = -ih; k < iw; k += s * 0.05){ line(g, il + k, it, il + k + ih, ib, '#6a5436', Math.max(0.6, s * 0.006)); line(g, il + k + ih, it, il + k, ib, '#6a5436', Math.max(0.6, s * 0.006)); }
    circ(g, il + iw * 0.3, it + ih * 0.4, s * 0.035, '#e05a3a'); circ(g, il + iw * 0.7, it + ih * 0.6, s * 0.035, '#f0c040');
  } else if(kind === 'shells'){
    g.fillStyle = '#ece0c4'; g.fillRect(il, it, iw, ih);
    [[0.25, 0.35, '#e8a090'], [0.7, 0.3, '#f0c8a0'], [0.5, 0.72, '#d8b8e0']].forEach(([a, c, col])=>{ const cx = il + iw * a, cy = it + ih * c; g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy + s * 0.04); g.arc(cx, cy + s * 0.04, s * 0.05, Math.PI, 0); g.closePath(); g.fill(); for(let k = -2; k <= 2; k++) line(g, cx, cy + s * 0.04, cx + k * s * 0.018, cy, 'rgba(120,80,60,.5)', Math.max(0.5, s * 0.005)); });
  } else if(kind === 'photo' || kind === 'photo2'){
    g.fillStyle = lin(g, 0, it, 0, ib, [[0, '#d8c39a'], [1, '#b89e72']]); g.fillRect(il, it, iw, ih);
    const fx = il + iw * (kind === 'photo2' ? 0.4 : 0.5);
    circ(g, fx, it + ih * 0.38, ih * 0.15, '#6a5440'); g.fillStyle = '#6a5440'; g.beginPath(); g.moveTo(fx - ih * 0.25, ib); g.quadraticCurveTo(fx, it + ih * 0.5, fx + ih * 0.25, ib); g.closePath(); g.fill();
    if(kind === 'photo2'){ circ(g, fx + iw * 0.28, it + ih * 0.45, ih * 0.12, '#7a6450'); g.beginPath(); g.moveTo(fx + iw * 0.28 - ih * 0.2, ib); g.quadraticCurveTo(fx + iw * 0.28, it + ih * 0.55, fx + iw * 0.28 + ih * 0.2, ib); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(255,240,210,.18)'; g.fillRect(il, it, iw, ih * 0.3);
  } else if(kind === 'lemons'){
    g.fillStyle = lin(g, 0, it, 0, ib, [[0, '#8ab0c8'], [0.6, '#cfe0d0'], [0.61, '#5a8a3a'], [1, '#3e6a2a']]); g.fillRect(il, it, iw, ih);
    for(let k = 0; k < 5; k++){ circ(g, il + iw * (0.15 + k * 0.18), it + ih * 0.58, ih * 0.12, '#4a7a34'); circ(g, il + iw * (0.15 + k * 0.18) + s * 0.01, it + ih * 0.56, s * 0.018, '#f2d64a'); }
  }
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(il, it, iw, ih * 0.15);
  line(g, X + s / 2, Y + s * 0.02, l + s * 0.04, t, 'rgba(60,40,20,.5)', Math.max(0.6, s * 0.006)); line(g, X + s / 2, Y + s * 0.02, r - s * 0.04, t, 'rgba(60,40,20,.5)', Math.max(0.6, s * 0.006));
  circ(g, X + s / 2, Y + s * 0.02, Math.max(0.8, s * 0.012), '#8a7a60');
}
/* the doorway out: its frame, the street beyond at dusk, a mat just inside */
function rmDoorway(g, I, s, x, y, door){
  const X = x * s, Y = y * s, Lt = I.lookAt(x, y - 1), first = x === door.x, last = x === door.x + door.w - 1;
  g.fillStyle = lin(g, 0, Y, 0, Y + s, [[0, '#2e2a44'], [1, '#5a4c62']]); g.fillRect(X, Y, s, s);
  /* the cobbles outside, wet, a lamp's glow on them */
  for(let k = 0; k < 5; k++){ const q = R(x, y, 391 + k); ell(g, X + s * (0.1 + q() * 0.8), Y + s * (0.55 + q() * 0.4), s * 0.08, s * 0.05, 'rgba(120,110,140,.35)'); }
  g.fillStyle = rad(g, X + s * 0.5, Y + s * 0.9, 0, s * 0.7, [[0, 'rgba(255,200,120,.22)'], [1, 'rgba(255,200,120,0)']]); g.fillRect(X, Y, s, s);
  /* the step, worn */
  g.fillStyle = sh(Lt.trim, -0.1); g.fillRect(X, Y, s, s * 0.12);
  g.fillStyle = 'rgba(255,240,215,.2)'; g.fillRect(X, Y, s, Math.max(1, s * 0.015));
  /* its jambs */
  g.fillStyle = Lt.trim;
  if(first) g.fillRect(X, Y, s * 0.08, s);
  if(last) g.fillRect(X + s * 0.92, Y, s * 0.08, s);
}
/* the way out, where the front wall is open: a worn stone sill in the line of the wall, and the night beyond it */
function rmThreshold(g, I, s, dd){
  for(let k = 0; k < dd.w; k++){
    const x = dd.x + k, X = x * s, Y = dd.y * s, q = R(x, dd.y, 395);
    if(!I.open(x, dd.y)) continue;
    g.fillStyle = lin(g, 0, Y + s * 0.26, 0, Y + s, [[0, 'rgba(16,14,30,0)'], [1, 'rgba(16,14,30,.78)']]); g.fillRect(X, Y + s * 0.26, s, s * 0.74);
    g.fillStyle = lin(g, 0, Y + s * 0.5, 0, Y + s, [[0, 'rgba(120,140,200,0)'], [1, 'rgba(120,140,200,.12)']]); g.fillRect(X, Y + s * 0.5, s, s * 0.5);
    g.fillStyle = lin(g, 0, Y + s * 0.02, 0, Y + s * 0.24, [[0, '#a29a8a'], [1, '#7c7468']]); g.fillRect(X, Y + s * 0.02, s, s * 0.22);
    ell(g, X + s * 0.5, Y + s * 0.13, s * 0.3, s * 0.05, 'rgba(60,50,40,.16)');                 // worn by feet
    if(s >= 16) for(let j = 0; j < 8; j++){ g.fillStyle = q() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,245,225,.12)'; g.fillRect(X + q() * s, Y + s * (0.04 + q() * 0.18), Math.max(0.7, s * 0.012), Math.max(0.7, s * 0.012)); }
    g.fillStyle = 'rgba(255,245,225,.3)'; g.fillRect(X, Y + s * 0.02, s, Math.max(1, s * 0.014));
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X, Y + s * 0.24, s, Math.max(1, s * 0.02));
  }
}
function rmMat(g, I, s, door){
  const X = door.x * s, Y = (door.y - 1) * s, w = door.w * s;
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X + s * 0.14, Y + s * 0.5, w - s * 0.24, s * 0.44);
  g.fillStyle = '#8a5a3a'; rr(g, X + s * 0.12, Y + s * 0.48, w - s * 0.24, s * 0.42, s * 0.04); g.fill();
  g.strokeStyle = 'rgba(40,20,8,.35)'; g.lineWidth = Math.max(0.7, s * 0.01);
  for(let k = 1; k < 5; k++){ const yy = Y + s * 0.48 + s * 0.42 * k / 5; line(g, X + s * 0.15, yy, X + w - s * 0.15, yy, 'rgba(40,20,8,.3)', Math.max(0.7, s * 0.01)); }
  g.fillStyle = 'rgba(230,200,140,.5)'; for(let t = X + s * 0.14; t < X + w - s * 0.12; t += s * 0.035){ g.fillRect(t, Y + s * 0.9, Math.max(0.6, s * 0.006), s * 0.04); }
}

/* ---------- what stands in the rooms ---------- */
const RM_UP = 0.55;                 // how far a dresser, a plant, a statue, the cells' bars stand up over the square behind
function rmFloorShadow(g, X, Y, s, w, d){ g.fillStyle = 'rgba(20,12,6,.28)'; g.fillRect(X + s * 0.08, Y + s * (0.9 - (d || 0)), w, s * (0.1 + (d || 0))); }
/* a dresser against the wall, shelf on shelf of what this room keeps — or lockers, or pigeonholes */
function rmShelf(g, I, s, x, y){
  const X = x * s, Y = y * s, Lt = I.lookAt(x, y), kind = Lt.shelf, q = R(x, y, 401);
  const l = X + s * 0.06, r = X + s * 0.94, top = Y - RM_UP * s, bot = Y + s * 0.92, wood = kind === 'lockers' ? '#5e6670' : kind === 'mail' ? '#7a5a36' : '#6e4a2c';
  g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(l + s * 0.04, bot - s * 0.02, r - l, s * 0.08);
  g.fillStyle = lin(g, l, 0, r, 0, [[0, sh(wood, 0.08)], [1, sh(wood, -0.15)]]); g.fillRect(l, top, r - l, bot - top);
  g.fillStyle = sh(wood, 0.22); g.fillRect(l - s * 0.02, top - s * 0.03, r - l + s * 0.04, s * 0.05);                          // its cornice
  g.fillStyle = 'rgba(255,235,205,.22)'; g.fillRect(l - s * 0.02, top - s * 0.03, r - l + s * 0.04, Math.max(1, s * 0.012));
  if(kind === 'lockers'){
    for(let k = 0; k < 2; k++){
      const dx = l + s * 0.04 + k * (r - l - s * 0.08) / 2, dw = (r - l - s * 0.08) / 2 - s * 0.02;
      g.fillStyle = sh('#6e7884', (q() - 0.5) * 0.1); g.fillRect(dx, top + s * 0.06, dw, bot - top - s * 0.1);
      for(let v = 0; v < 4; v++) g.fillStyle = '#4a525c', g.fillRect(dx + dw * 0.2, top + s * (0.14 + v * 0.05), dw * 0.6, Math.max(1, s * 0.012));
      circ(g, dx + dw * 0.8, top + s * 0.6, Math.max(1, s * 0.02), '#c9c9cf');
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(dx, top + s * 0.06, Math.max(1, s * 0.012), bot - top - s * 0.1);
    }
    return;
  }
  /* its shelves above, its cupboard below */
  const cupT = bot - s * 0.42, n = 3, sh0 = (cupT - top - s * 0.08) / n;
  g.fillStyle = sh(wood, -0.45); g.fillRect(l + s * 0.05, top + s * 0.05, r - l - s * 0.1, cupT - top - s * 0.05);
  for(let k = 0; k < n; k++){
    const sy = top + s * 0.05 + (k + 1) * sh0;
    g.fillStyle = sh(wood, 0.12); g.fillRect(l + s * 0.05, sy - s * 0.02, r - l - s * 0.1, s * 0.03);
    rmShelfThings(g, kind, l + s * 0.07, sy - s * 0.02, r - l - s * 0.14, sh0 - s * 0.03, s, R(x, y * 7 + k, 403), k);
  }
  /* the cupboard's doors, their knobs */
  for(let k = 0; k < 2; k++){
    const dx = l + s * 0.05 + k * (r - l - s * 0.1) / 2, dw = (r - l - s * 0.1) / 2 - s * 0.015;
    g.fillStyle = sh(wood, -0.05); g.fillRect(dx, cupT, dw, bot - cupT - s * 0.05);
    g.strokeStyle = sh(wood, -0.3); g.lineWidth = Math.max(0.8, s * 0.01); g.strokeRect(dx + s * 0.03, cupT + s * 0.04, dw - s * 0.06, bot - cupT - s * 0.13);
    circ(g, k ? dx + s * 0.05 : dx + dw - s * 0.05, (cupT + bot) / 2, Math.max(1, s * 0.016), '#c9a24a');
  }
  g.fillStyle = sh(wood, 0.2); g.fillRect(l, cupT - s * 0.02, r - l, s * 0.03);
}
function rmShelfThings(g, kind, x, by, w, h, s, q, shelf){
  if(kind === 'bottles' && shelf === 1){                                 // the barber's towels, folded, and his jar of combs
    for(let k = 0; k < 3; k++){ const tx = x + s * 0.02 + k * s * 0.16, th = h * (0.28 + (k % 2) * 0.1);
      for(let j = 0; j < 3; j++){ const ty = by - th * (j + 1) / 3; g.fillStyle = j % 2 ? '#f4f1ea' : '#e6e1d6'; rr(g, tx, ty, s * 0.14, th / 3, s * 0.02); g.fill(); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(tx, ty + th / 3 - Math.max(0.6, s * 0.006), s * 0.14, Math.max(0.6, s * 0.006)); } }
    const jx = x + w - s * 0.2, jh = h * 0.72;
    g.fillStyle = 'rgba(70,150,200,.85)'; rr(g, jx, by - jh, s * 0.14, jh, s * 0.03); g.fill();
    for(let j = 0; j < 3; j++){ g.fillStyle = ['#2a2a2a', '#5a3a2a', '#2a2a2a'][j]; g.fillRect(jx + s * (0.03 + j * 0.035), by - jh - h * 0.2, s * 0.018, h * 0.5); }
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(jx + s * 0.02, by - jh * 0.85, s * 0.02, jh * 0.6);
    g.fillStyle = '#d8d8e0'; g.fillRect(jx - s * 0.01, by - jh, s * 0.16, Math.max(1, s * 0.02));
    return;
  }
  if(kind === 'mail'){                                                   // pigeonholes, a letter in most
    const n = 4;
    for(let k = 0; k < n; k++){ const px = x + k * w / n; g.fillStyle = '#3e2a18'; g.fillRect(px + s * 0.008, by - h, w / n - s * 0.016, h); if(q() < 0.75){ g.fillStyle = q() < 0.2 ? '#e6c8a0' : '#f4efe2'; g.fillRect(px + s * 0.02, by - h * 0.7, w / n - s * 0.04, h * 0.55); } }
    return;
  }
  let px = x + s * 0.01;
  while(px < x + w - s * 0.05){
    const v = q();
    if(kind === 'plates'){ const r = h * 0.42; circ(g, px + r, by - r, r, '#f2ece0'); circ(g, px + r, by - r, r * 0.62, '#7a9ab8'); circ(g, px + r, by - r, r * 0.4, '#f2ece0'); px += r * 1.9; }
    else if(kind === 'jars'){                                            // preserves under glass, a cloth tied over each; now and then a crock
      const crock = q() < 0.22, jw = s * (crock ? 0.15 : 0.12), jh = h * (crock ? 0.62 : 0.66 + v * 0.26);
      if(px + jw > x + w) break;
      if(crock){ g.fillStyle = lin(g, px, 0, px + jw, 0, [[0, '#6a4a2e'], [0.4, '#9a7048'], [1, '#5a3c24']]); rr(g, px, by - jh, jw, jh, jw * 0.35); g.fill(); g.fillStyle = '#e8dcc0'; g.fillRect(px + jw * 0.1, by - jh * 0.75, jw * 0.8, jh * 0.18); g.fillStyle = '#5a3c24'; rr(g, px + jw * 0.15, by - jh - s * 0.025, jw * 0.7, s * 0.04, s * 0.015); g.fill(); }
      else {
        const fill = ['#c8402a', '#e09030', '#7a9a3a', '#e8c840', '#7a2a4a'][Math.floor(v * 5)];
        g.fillStyle = 'rgba(210,230,230,.55)'; rr(g, px, by - jh, jw, jh, jw * 0.28); g.fill();
        g.fillStyle = fill; rr(g, px + jw * 0.08, by - jh * 0.82, jw * 0.84, jh * 0.78, jw * 0.22); g.fill();
        g.fillStyle = 'rgba(0,0,0,.15)'; for(let j = 0; j < 3; j++) circ(g, px + jw * (0.3 + j * 0.2), by - jh * (0.3 + (j % 2) * 0.25), jw * 0.08, 'rgba(0,0,0,.15)');
        g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(px + jw * 0.14, by - jh * 0.86, jw * 0.12, jh * 0.62);
        const cap = q() < 0.5 ? '#f2ece0' : '#d84a3a';
        g.fillStyle = cap; g.beginPath(); g.moveTo(px - jw * 0.08, by - jh + s * 0.03); g.quadraticCurveTo(px + jw / 2, by - jh - s * 0.05, px + jw * 1.08, by - jh + s * 0.03); g.lineTo(px + jw * 0.92, by - jh + s * 0.05); g.lineTo(px + jw * 0.08, by - jh + s * 0.05); g.closePath(); g.fill();
        if(cap !== '#f2ece0'){ g.fillStyle = 'rgba(255,255,255,.7)'; for(let j = 0; j < 3; j++) g.fillRect(px + jw * (0.1 + j * 0.3), by - jh, Math.max(0.6, jw * 0.12), Math.max(0.6, s * 0.012)); }
        line(g, px, by - jh + s * 0.045, px + jw, by - jh + s * 0.045, '#8a6a3a', Math.max(0.6, s * 0.008));
      }
      px += jw + s * 0.025; }
    else if(kind === 'bottles' || kind === 'wine'){ const bw = s * 0.05, bh = h * (0.7 + v * 0.25), col = kind === 'wine' ? (v < 0.5 ? '#4a1a24' : '#2a3a1a') : ['#3a8a6a', '#a8d0e0', '#c86a4a', '#e0c070'][Math.floor(v * 4)];
      g.fillStyle = col; rr(g, px, by - bh * 0.7, bw, bh * 0.7, bw * 0.3); g.fill(); g.fillRect(px + bw * 0.3, by - bh, bw * 0.4, bh * 0.32); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(px + bw * 0.15, by - bh * 0.6, bw * 0.15, bh * 0.4); px += bw + s * 0.018; }
    else if(kind === 'files'){ const fw = s * (0.04 + v * 0.03), fh = h * (0.75 + v * 0.2); g.fillStyle = ['#a8946a', '#7a8a9a', '#9a6a5a', '#c8b88a'][Math.floor(v * 4)]; g.fillRect(px, by - fh, fw, fh); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(px + fw * 0.2, by - fh * 0.7, fw * 0.6, Math.max(1, s * 0.012)); px += fw + s * 0.006; }
    else if(kind === 'books'){ const bw = s * (0.03 + v * 0.025), bh = h * (0.7 + q() * 0.28); g.fillStyle = ['#7a2a2a', '#2a4a6a', '#3a5a2a', '#8a6a2a', '#5a3a6a'][Math.floor(v * 5)]; g.fillRect(px, by - bh, bw, bh); g.fillStyle = 'rgba(230,200,120,.6)'; g.fillRect(px, by - bh * 0.8, bw, Math.max(0.7, s * 0.008)); g.fillRect(px, by - bh * 0.25, bw, Math.max(0.7, s * 0.008)); px += bw + s * 0.004; if(q() < 0.08) px += s * 0.04; }
    else if(kind === 'cups'){ const cw = s * 0.07; g.fillStyle = '#f4efe4'; rr(g, px, by - h * 0.45, cw, h * 0.45, cw * 0.2); g.fill(); g.strokeStyle = '#f4efe4'; g.lineWidth = Math.max(1, s * 0.012); g.beginPath(); g.arc(px + cw, by - h * 0.25, h * 0.1, -1.2, 1.2); g.stroke(); px += cw + s * 0.035; }
    else if(kind === 'sweets'){ const jw = s * 0.08, jh = h * 0.75; g.fillStyle = 'rgba(220,240,240,.5)'; rr(g, px, by - jh, jw, jh, jw * 0.3); g.fill(); for(let k = 0; k < 5; k++) circ(g, px + jw * (0.25 + (k % 2) * 0.5), by - jh * (0.15 + k * 0.15), jw * 0.16, ['#f0a0b8', '#a0d8c8', '#f8e08a', '#c8a0e0'][(k + Math.floor(v * 4)) % 4]); px += jw + s * 0.02; }
    else if(kind === 'floats'){ const r = h * 0.36; circ(g, px + r, by - r, r, v < 0.5 ? '#e05a3a' : '#f0c040'); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(px + r * 0.5, by - r * 1.5, r * 0.4, r * 0.3); px += r * 2.2; }
    else px += s;
  }
}
/* a counter: its top, its front panelled; the gelateria's glass with the gelato under it, the post office's grille, the
   station's ticket window, the trattoria's pass, the café's marble */
function rmCounter(g, I, s, x, y){
  const X = x * s, Y = y * s, Lt = I.lookAt(x, y), kind = Lt.counter, run = I.runs.get(x + ',' + y) || { x0:x, x1:x };
  const first = run.x0 === x, last = run.x1 === x, l = X + (first ? s * 0.05 : 0), r = X + s - (last ? s * 0.05 : 0);
  const top = kind === 'marble' ? '#ece6dc' : kind === 'pass' ? '#c8ccd0' : kind === 'glass' ? '#f0f4f4' : '#b0804c';
  const front = kind === 'marble' ? '#5a3a24' : kind === 'pass' ? '#8a8e94' : kind === 'glass' ? '#7a5a40' : '#7a5230';
  const tT = Y + s * 0.22, tB = Y + s * 0.44, bot = Y + s * 0.92;
  g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(l, bot, r - l, s * 0.07);
  g.fillStyle = lin(g, 0, tB, 0, bot, [[0, sh(front, 0.08)], [1, sh(front, -0.15)]]); g.fillRect(l, tB, r - l, bot - tB);
  g.strokeStyle = sh(front, -0.3); g.lineWidth = Math.max(0.8, s * 0.012); g.strokeRect(X + s * 0.1, tB + s * 0.08, s * 0.8, bot - tB - s * 0.16);
  g.fillStyle = 'rgba(255,240,215,.12)'; g.fillRect(X + s * 0.1, tB + s * 0.08, s * 0.8, Math.max(1, s * 0.012));
  if(kind === 'glass'){                                                  // the gelato, in its tubs, under the glass
    const cols = ['#f4c8d8', '#b8e0b0', '#f8e8a0', '#d8b090', '#c8d8f8', '#f0a080'];
    g.fillStyle = '#e8eef0'; g.fillRect(l, tT - s * 0.12, r - l, tB - tT + s * 0.12);
    for(let k = 0; k < 2; k++){ const tx = X + s * (0.08 + k * 0.44), col = cols[(x * 2 + k) % cols.length]; g.fillStyle = '#c8ccd0'; g.fillRect(tx, tT - s * 0.06, s * 0.38, s * 0.24); g.fillStyle = col; g.beginPath(); g.moveTo(tx + s * 0.02, tT + s * 0.02); g.quadraticCurveTo(tx + s * 0.19, tT - s * 0.12, tx + s * 0.36, tT + s * 0.02); g.lineTo(tx + s * 0.36, tT + s * 0.16); g.lineTo(tx + s * 0.02, tT + s * 0.16); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(tx + s * 0.14, tT - s * 0.02, s * 0.06, s * 0.025, -0.3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(200,230,240,.35)'; g.fillRect(l, tT - s * 0.18, r - l, s * 0.1);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(l, tT - s * 0.18, r - l, Math.max(1, s * 0.012));
  } else {
    g.fillStyle = lin(g, 0, tT, 0, tB, [[0, sh(top, 0.08)], [1, sh(top, -0.06)]]); g.fillRect(l - s * 0.02, tT, r - l + s * 0.04, tB - tT);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(l - s * 0.02, tT, r - l + s * 0.04, Math.max(1, s * 0.014));
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(l - s * 0.02, tB - Math.max(1, s * 0.012), r - l + s * 0.04, Math.max(1, s * 0.012));
    if(kind === 'marble' && s >= 20){ g.strokeStyle = 'rgba(120,110,100,.25)'; g.lineWidth = Math.max(0.6, s * 0.006); g.beginPath(); g.moveTo(X, tT + s * 0.05); g.bezierCurveTo(X + s * 0.3, tT + s * 0.15, X + s * 0.6, tT + s * 0.02, X + s, tT + s * 0.12); g.stroke(); }
    if(kind === 'wood' && s >= 20){ g.strokeStyle = 'rgba(60,30,10,.2)'; g.lineWidth = Math.max(0.6, s * 0.006); for(let k = 0; k < 2; k++){ const gy = tT + (tB - tT) * (0.3 + k * 0.4); g.beginPath(); g.moveTo(X, gy); g.quadraticCurveTo(X + s / 2, gy + s * 0.02, X + s, gy); g.stroke(); } }
  }
  if(kind === 'grille'){                                                 // the post office's brass grille over the counter
    g.fillStyle = '#c8a050'; for(let k = 0; k < 7; k++) g.fillRect(X + s * (0.05 + k * 0.14), Y - s * 0.3, Math.max(1, s * 0.02), tT - Y + s * 0.3);
    g.fillRect(X, Y - s * 0.3, s, Math.max(1, s * 0.03)); g.fillStyle = 'rgba(255,240,200,.5)'; g.fillRect(X, Y - s * 0.3, s, Math.max(0.6, s * 0.008));
  }
  if(kind === 'ticket'){                                                 // the ticket window's frame
    g.fillStyle = '#5a3a20'; g.fillRect(l, Y - s * 0.25, r - l, s * 0.06);
    if(first) g.fillRect(l, Y - s * 0.25, s * 0.06, tT - Y + s * 0.25);
    if(last) g.fillRect(r - s * 0.06, Y - s * 0.25, s * 0.06, tT - Y + s * 0.25);
    g.fillStyle = 'rgba(200,230,240,.18)'; g.fillRect(l + s * 0.06, Y - s * 0.19, r - l - s * 0.12, tT - Y + s * 0.19);
  }
  if(kind === 'pass'){ for(let k = 0; k < 2; k++){ circ(g, X + s * (0.3 + k * 0.4), (tT + tB) / 2, s * 0.08, '#f4efe4'); circ(g, X + s * (0.3 + k * 0.4), (tT + tB) / 2, s * 0.055, k ? '#c84a2a' : '#e8c060'); } }
}
function rmFireAt(I, x, y){ if(I.at(x, y) !== 'F') return false; const L2 = I.lookAt(x, y); return ((L2.stoveAt && L2.stoveAt[x + ',' + y]) || L2.stove) === 'fire'; }
/* a stove: a hearth with its fire (its flames move: rmAnim), a brick oven, an iron range, a stove with its pot */
function rmStove(g, I, s, x, y){
  const X = x * s, Y = y * s, Lt = I.lookAt(x, y), kind = (Lt.stoveAt && Lt.stoveAt[x + ',' + y]) || Lt.stove;
  if(kind === 'fire'){
    /* (two hearth squares side by side are one wide fireplace, drawn from its left square) */
    if(rmFireAt(I, x - 1, y)) return;
    let n = 1; while(rmFireAt(I, x + n, y)) n++;
    const W = n * s, M = X + W / 2;
    const top = Y - s * 0.5, l = X + s * 0.02, r = X + W - s * 0.02, bot = Y + s * 0.92;
    g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(l, bot, r - l, s * 0.08);
    /* the chimney breast, stone on stone */
    g.fillStyle = '#7a7064'; g.fillRect(l, top, r - l, bot - top);
    for(let rr0 = 0; rr0 < 7; rr0++){ const yy = top + rr0 * (bot - top) / 7, off = rr0 % 2 ? s * 0.12 : 0; for(let xx = l - off; xx < r; xx += s * 0.24){ const q = R(Math.round(xx * 10), rr0 + y * 9, 411); g.fillStyle = sh('#8a8070', (q() - 0.5) * 0.25); rr(g, Math.max(l, xx + 1), yy + 1, Math.min(s * 0.24, r - Math.max(l, xx)) - 2, (bot - top) / 7 - 2, s * 0.02); g.fill(); } }
    /* the mantel, the opening, the fire's bed */
    g.fillStyle = '#5a4030'; g.fillRect(l - s * 0.03, Y + s * 0.02, r - l + s * 0.06, s * 0.08);
    g.fillStyle = 'rgba(255,230,200,.2)'; g.fillRect(l - s * 0.03, Y + s * 0.02, r - l + s * 0.06, Math.max(1, s * 0.012));
    const oL = X + s * 0.2, oR = X + W - s * 0.2;
    g.fillStyle = '#140c08'; g.beginPath(); g.moveTo(oL, bot); g.lineTo(oL, Y + s * 0.38); g.quadraticCurveTo(M, Y + s * (0.38 - 0.18 * Math.min(2, n)), oR, Y + s * 0.38); g.lineTo(oR, bot); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,120,40,.12)'; g.beginPath(); g.moveTo(oL, bot); g.lineTo(oL + s * 0.06, Y + s * 0.45); g.lineTo(oR - s * 0.06, Y + s * 0.45); g.lineTo(oR, bot); g.closePath(); g.fill();   // the firebrick, lit
    g.strokeStyle = '#3a3a3e'; g.lineWidth = Math.max(1, s * 0.02);                                  // the firedogs
    [oL + s * 0.12, oR - s * 0.12].forEach(fx=>{ g.beginPath(); g.moveTo(fx, bot - s * 0.02); g.lineTo(fx, bot - s * 0.16); g.stroke(); circ(g, fx, bot - s * 0.17, Math.max(1, s * 0.025), '#8a8a90'); });
    for(let k = 0; k < 2 + n; k++){ const lx = M + (k - (1 + n) / 2) * s * 0.16; g.fillStyle = k % 2 ? '#5a3420' : '#4a2a18'; g.save(); g.translate(lx, bot - s * 0.08); g.rotate((k % 2 ? 0.3 : -0.3)); g.fillRect(-s * 0.2, -s * 0.025, s * 0.4, s * 0.05); g.fillStyle = '#c8a070'; g.fillRect(s * 0.18, -s * 0.025, s * 0.02, s * 0.05); g.restore(); }
    ell(g, M, bot - s * 0.08, s * 0.2 * (n + 0.1), s * 0.05, '#ff7a2a');
    ell(g, M, bot - s * 0.09, s * 0.12 * n, s * 0.03, '#ffd27a');
    g.fillStyle = rad(g, M, bot - s * 0.2, 0, s * (1.2 + 0.2 * n), [[0, 'rgba(255,170,80,.3)'], [1, 'rgba(255,170,80,0)']]); g.fillRect(X - s, Y - s * 0.4, W + 2 * s, s * 2.2);
    return;
  }
  if(kind === 'oven'){                                                   // a brick dome, its mouth glowing (two squares)
    const left = I.at(x - 1, y) !== 'F', cx = left ? X + s : X, top = Y - s * 0.35, bot = Y + s * 0.92;
    g.save(); g.beginPath(); g.rect(X, top - s * 0.1, s, bot - top + s * 0.2); g.clip();
    g.fillStyle = '#9a4a32'; g.beginPath(); g.moveTo(cx - s * 0.95, bot); g.lineTo(cx - s * 0.95, Y + s * 0.2); g.quadraticCurveTo(cx - s * 0.9, top, cx, top); g.quadraticCurveTo(cx + s * 0.9, top, cx + s * 0.95, Y + s * 0.2); g.lineTo(cx + s * 0.95, bot); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,20,10,.35)'; g.lineWidth = Math.max(0.8, s * 0.01);
    for(let k = 0; k < 6; k++){ const yy = top + s * 0.12 + k * s * 0.18; g.beginPath(); g.moveTo(cx - s * 0.95, yy); g.lineTo(cx + s * 0.95, yy); g.stroke(); for(let j = -4; j <= 4; j++){ const bx = cx + j * s * 0.24 + (k % 2) * s * 0.12; g.beginPath(); g.moveTo(bx, yy); g.lineTo(bx, yy + s * 0.18); g.stroke(); } }
    g.fillStyle = '#2a120a'; g.beginPath(); g.arc(cx, bot - s * 0.05, s * 0.32, Math.PI, 0); g.fill();
    g.fillStyle = rad(g, cx, bot - s * 0.1, 0, s * 0.3, [[0, 'rgba(255,200,90,.95)'], [0.6, 'rgba(255,110,40,.85)'], [1, 'rgba(120,30,10,.6)']]); g.beginPath(); g.arc(cx, bot - s * 0.05, s * 0.24, Math.PI, 0); g.fill();
    g.restore();
    return;
  }
  /* an iron stove or a range: its plate, its door, a glow, a pot or two */
  const l = X + s * 0.08, r = X + s * 0.92, top = Y + s * 0.12, mid = Y + s * 0.42, bot = Y + s * 0.92;
  g.fillStyle = 'rgba(20,12,6,.32)'; g.fillRect(l + s * 0.04, bot, r - l, s * 0.07);
  g.fillStyle = lin(g, l, 0, r, 0, [[0, '#2c2a2c'], [0.4, '#4a4648'], [1, '#1e1c1e']]); g.fillRect(l, mid, r - l, bot - mid);
  g.fillStyle = '#3a3638'; g.fillRect(l - s * 0.02, top, r - l + s * 0.04, mid - top);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(l - s * 0.02, top, r - l + s * 0.04, Math.max(1, s * 0.012));
  g.fillStyle = '#1a1010'; rr(g, X + s * 0.28, mid + s * 0.12, s * 0.44, s * 0.24, s * 0.03); g.fill();
  g.fillStyle = 'rgba(255,120,40,.8)'; g.fillRect(X + s * 0.32, mid + s * 0.22, s * 0.36, s * 0.06);
  circ(g, X + s * 0.5, mid + s * 0.4, Math.max(1, s * 0.02), '#8a8488');
  if(kind === 'range'){ [0.3, 0.7].forEach(f=>{ circ(g, X + s * f, (top + mid) / 2, s * 0.11, '#5a5658'); circ(g, X + s * f, (top + mid) / 2, s * 0.07, '#3a3638'); }); g.fillStyle = '#4a4648'; g.fillRect(X + s * 0.78, (top + mid) / 2 - s * 0.02, s * 0.2, s * 0.04); }
  else { ell(g, X + s * 0.5, (top + mid) / 2 - s * 0.02, s * 0.2, s * 0.08, '#6a6a70'); g.fillStyle = '#5a5a60'; g.fillRect(X + s * 0.3, (top + mid) / 2 - s * 0.12, s * 0.4, s * 0.1); ell(g, X + s * 0.5, (top + mid) / 2 - s * 0.12, s * 0.2, s * 0.07, '#8a8a90'); ell(g, X + s * 0.5, (top + mid) / 2 - s * 0.12, s * 0.15, s * 0.045, '#c8a060'); }
}
/* a desk: its top, a sheet of paper, an inkwell or a lamp lit */
function rmDesk(g, I, s, x, y){
  const X = x * s, Y = y * s, run = I.runs.get(x + ',' + y) || { x0:x, x1:x }, first = run.x0 === x, last = run.x1 === x, q = R(x, y, 421);
  const l = X + (first ? s * 0.06 : 0), r = X + s - (last ? s * 0.06 : 0), top = Y + s * 0.2, mid = Y + s * 0.5, bot = Y + s * 0.9;
  g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(l + s * 0.04, bot, r - l, s * 0.07);
  g.fillStyle = '#5a3a22'; g.fillRect(l, mid, r - l, bot - mid);
  for(let k = 0; k < 2; k++){ g.strokeStyle = '#3e2614'; g.lineWidth = Math.max(0.8, s * 0.01); g.strokeRect(X + s * (0.12 + k * 0.42), mid + s * 0.07, s * 0.34, s * 0.12); circ(g, X + s * (0.29 + k * 0.42), mid + s * 0.13, Math.max(0.8, s * 0.014), '#c9a24a'); }
  g.fillStyle = lin(g, 0, top, 0, mid, [[0, '#8a5e38'], [1, '#76502e']]); g.fillRect(l - s * 0.02, top, r - l + s * 0.04, mid - top);
  g.fillStyle = 'rgba(255,230,200,.18)'; g.fillRect(l - s * 0.02, top, r - l + s * 0.04, Math.max(1, s * 0.014));
  g.fillStyle = '#2a5a3a'; g.fillRect(X + s * 0.15, top + s * 0.04, s * 0.7, mid - top - s * 0.08);   // its blotter
  g.save(); g.translate(X + s * 0.4, (top + mid) / 2); g.rotate((q() - 0.5) * 0.3); g.fillStyle = '#f4efe2'; g.fillRect(-s * 0.13, -s * 0.09, s * 0.26, s * 0.17); g.fillStyle = 'rgba(80,70,60,.6)'; for(let k = 0; k < 4; k++) g.fillRect(-s * 0.1, -s * 0.06 + k * s * 0.035, s * (0.14 + q() * 0.06), Math.max(0.6, s * 0.007)); g.restore();
  if(((x + y) % 2) === 0){ circ(g, X + s * 0.75, top + s * 0.06, s * 0.05, '#e8c860'); g.fillStyle = '#7a5a2a'; g.fillRect(X + s * 0.735, top + s * 0.06, s * 0.03, s * 0.14); ell(g, X + s * 0.75, top + s * 0.2, s * 0.07, s * 0.025, '#5a4020'); }
  else { g.fillStyle = '#1e1e24'; rr(g, X + s * 0.68, top + s * 0.08, s * 0.1, s * 0.09, s * 0.02); g.fill(); line(g, X + s * 0.75, top + s * 0.1, X + s * 0.84, top - s * 0.06, '#f4efe2', Math.max(0.8, s * 0.012)); }
}
/* a bed: its headboard at the wall, pillows, its quilt — a bunk's iron frame in the guard house */
function rmBed(g, I, s, x, y){
  const run = I.runs.get(x + ',' + y) || { x0:x, x1:x, y0:y, y1:y, w:1, h:1 };
  if(run.x0 !== x || run.y0 !== y) return;
  const Lt = I.lookAt(x, y), bunk = I.d.key === 'room_guards', q = R(x, y, 431);
  const X = run.x0 * s, Y = run.y0 * s, w = run.w * s, h = run.h * s;
  const l = X + s * 0.08, r = X + w - s * 0.08, top = Y + s * 0.02, bot = Y + h - s * 0.06;
  g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(l + s * 0.05, bot, r - l, s * 0.07);
  const frame = bunk ? '#4a4a50' : '#6a4426';
  g.fillStyle = frame; g.fillRect(l, top, r - l, bot - top);
  g.fillStyle = sh(frame, 0.25); g.fillRect(l, top - s * 0.12, r - l, s * 0.16);                                        // its headboard
  g.fillStyle = 'rgba(255,240,220,.2)'; g.fillRect(l, top - s * 0.12, r - l, Math.max(1, s * 0.014));
  /* the mattress, the pillows, the quilt */
  const ml = l + s * 0.05, mr = r - s * 0.05;
  g.fillStyle = '#efe8d8'; rr(g, ml, top + s * 0.06, mr - ml, bot - top - s * 0.12, s * 0.05); g.fill();
  const pw = run.w > 1 ? (mr - ml) / 2 - s * 0.03 : mr - ml - s * 0.06;
  for(let k = 0; k < (run.w > 1 ? 2 : 1); k++){ rr(g, ml + s * 0.03 + k * ((mr - ml) / 2), top + s * 0.09, pw, s * 0.24, s * 0.08); g.fillStyle = '#fbf7ee'; g.fill(); g.fillStyle = 'rgba(160,140,110,.25)'; g.fillRect(ml + s * 0.08 + k * ((mr - ml) / 2), top + s * 0.2, pw - s * 0.1, Math.max(0.8, s * 0.01)); }
  const qc = Lt.quilt || '#5a7a9a', qt = top + s * 0.38;
  g.fillStyle = qc; rr(g, ml - s * 0.02, qt, mr - ml + s * 0.04, bot - qt + s * 0.02, s * 0.05); g.fill();
  g.fillStyle = sh(qc, 0.2); g.fillRect(ml - s * 0.02, qt, mr - ml + s * 0.04, s * 0.08);                               // turned down
  if(!bunk){                                                            // patchwork
    for(let py = qt + s * 0.12; py < bot - s * 0.05; py += s * 0.2) for(let px = ml; px < mr - s * 0.05; px += s * 0.2){ if(((Math.round(px / s * 5) + Math.round(py / s * 5)) % 2) === 0){ g.fillStyle = sh(qc, -0.12); g.fillRect(px, py, s * 0.2, s * 0.2); } }
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = Math.max(0.6, s * 0.007); g.setLineDash([s * 0.03, s * 0.03]); g.strokeRect(ml + s * 0.03, qt + s * 0.11, mr - ml - s * 0.06, bot - qt - s * 0.12); g.setLineDash([]);
  } else { line(g, ml, qt + s * 0.25, mr, qt + s * 0.25, 'rgba(0,0,0,.2)', Math.max(0.8, s * 0.01)); }
  g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(ml, bot); g.quadraticCurveTo((ml + mr) / 2, qt + (bot - qt) * 0.6, mr, bot); g.closePath(); g.fill();
  g.fillStyle = sh(frame, 0.1); g.fillRect(l, bot - s * 0.04, r - l, s * 0.06);                                       // its footboard
}
/* the opera's grand piano: black, its lid, its keys towards the hall */
function rmPiano(g, I, s, x, y){
  const run = I.runs.get(x + ',' + y) || { x0:x, x1:x, w:1 };
  if(run.x0 !== x) return;
  const X = run.x0 * s, Y = y * s, w = run.w * s;
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X + s * 0.12, Y + s * 0.82, w - s * 0.1, s * 0.12);
  g.fillStyle = '#141216'; g.beginPath(); g.moveTo(X + s * 0.06, Y + s * 0.12); g.lineTo(X + w * 0.6, Y + s * 0.12); g.bezierCurveTo(X + w - s * 0.04, Y + s * 0.1, X + w - s * 0.02, Y + s * 0.6, X + w * 0.7, Y + s * 0.78); g.lineTo(X + s * 0.06, Y + s * 0.78); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(X + s * 0.12, Y + s * 0.16); g.lineTo(X + w * 0.55, Y + s * 0.16); g.bezierCurveTo(X + w - s * 0.12, Y + s * 0.16, X + w - s * 0.12, Y + s * 0.4, X + w * 0.75, Y + s * 0.5); g.lineTo(X + w * 0.6, Y + s * 0.3); g.closePath(); g.fill();
  /* the keys */
  g.fillStyle = '#f6f2e8'; g.fillRect(X + s * 0.08, Y + s * 0.64, w * 0.62, s * 0.14);
  g.fillStyle = '#141216'; for(let k = X + s * 0.1; k < X + s * 0.08 + w * 0.62; k += s * 0.05){ if(Math.round((k - X) / (s * 0.05)) % 7 !== 2) g.fillRect(k, Y + s * 0.64, s * 0.025, s * 0.08); }
  g.fillStyle = '#2a2830'; g.fillRect(X + w * 0.3, Y + s * 0.8, s * 0.05, s * 0.12); g.fillRect(X + w * 0.6, Y + s * 0.8, s * 0.05, s * 0.12);
}
/* a pot of basil (or a little lemon tree) — or a coat stand, caps on its pegs — or a basket of lemons */
function rmPlant(g, I, s, x, y){
  const X = x * s, Y = y * s, kind = I.lookAt(x, y).plant, q = R(x, y, 441), cx = X + s * 0.5;
  if(kind === 'coat'){
    ell(g, cx + s * 0.05, Y + s * 0.9, s * 0.24, s * 0.06, 'rgba(20,12,6,.32)');
    g.fillStyle = '#4a2e18'; g.fillRect(cx - s * 0.03, Y - RM_UP * s + s * 0.06, s * 0.06, s * (0.86 + RM_UP));
    [[-1, 0.86], [1, 0.86], [0, 0.88]].forEach(([d, f])=> line(g, cx, Y + s * f, cx + d * s * 0.18, Y + s * 0.92, '#3a2412', Math.max(1, s * 0.03)));
    g.fillStyle = '#2e3a5a'; rr(g, cx - s * 0.26, Y - RM_UP * s + s * 0.2, s * 0.24, s * 0.5, s * 0.06); g.fill();          // a coat
    g.fillStyle = '#20283e'; g.fillRect(cx - s * 0.24, Y - RM_UP * s + s * 0.2, s * 0.06, s * 0.45);
    ell(g, cx + s * 0.14, Y - RM_UP * s + s * 0.12, s * 0.14, s * 0.06, '#20283e'); g.fillStyle = '#20283e'; g.fillRect(cx + s * 0.04, Y - RM_UP * s + s * 0.04, s * 0.2, s * 0.08);   // a cap
    g.fillStyle = '#c9a24a'; g.fillRect(cx + s * 0.04, Y - RM_UP * s + s * 0.1, s * 0.2, Math.max(1, s * 0.02));
    return;
  }
  if(kind === 'basket'){
    ell(g, cx + s * 0.04, Y + s * 0.86, s * 0.34, s * 0.07, 'rgba(20,12,6,.3)');
    g.fillStyle = '#a8783a'; g.beginPath(); g.moveTo(X + s * 0.14, Y + s * 0.5); g.lineTo(X + s * 0.86, Y + s * 0.5); g.lineTo(X + s * 0.78, Y + s * 0.86); g.lineTo(X + s * 0.22, Y + s * 0.86); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(70,40,15,.5)'; g.lineWidth = Math.max(0.8, s * 0.012); for(let k = 0; k < 4; k++){ const yy = Y + s * (0.56 + k * 0.08); g.beginPath(); g.moveTo(X + s * 0.16, yy); g.lineTo(X + s * 0.84, yy); g.stroke(); }
    for(let k = 0; k < 7; k++){ const lx = X + s * (0.22 + (k % 4) * 0.18 + (k > 3 ? 0.09 : 0)), ly = Y + s * (k > 3 ? 0.4 : 0.48); ell(g, lx, ly, s * 0.1, s * 0.075, k % 4 === 3 ? '#c8d84a' : '#f2d64a'); ell(g, lx - s * 0.03, ly - s * 0.03, s * 0.03, s * 0.02, 'rgba(255,255,255,.5)'); }
    g.strokeStyle = '#8a5a2a'; g.lineWidth = Math.max(1, s * 0.03); g.beginPath(); g.arc(cx, Y + s * 0.5, s * 0.34, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    return;
  }
  /* a terracotta pot, and the leaves heaped up out of it */
  ell(g, cx + s * 0.05, Y + s * 0.9, s * 0.26, s * 0.07, 'rgba(20,12,6,.32)');
  g.fillStyle = lin(g, X + s * 0.26, 0, X + s * 0.74, 0, [[0, '#9a4a2a'], [0.35, '#c66a40'], [1, '#8a3e22']]);
  g.beginPath(); g.moveTo(X + s * 0.26, Y + s * 0.56); g.lineTo(X + s * 0.74, Y + s * 0.56); g.lineTo(X + s * 0.66, Y + s * 0.9); g.lineTo(X + s * 0.34, Y + s * 0.9); g.closePath(); g.fill();
  g.fillStyle = '#d07a4e'; g.fillRect(X + s * 0.24, Y + s * 0.52, s * 0.52, s * 0.07);
  const top = Y - RM_UP * s * 0.75;
  for(let k = 0; k < 22; k++){
    const a = q() * TAU, rr0 = q(), lx = cx + Math.cos(a) * s * 0.26 * rr0, ly = top + s * 0.3 + (Y + s * 0.5 - top - s * 0.3) * q() * 0.9;
    g.save(); g.translate(lx, ly); g.rotate(a);
    ell(g, 0, 0, s * (0.07 + q() * 0.04), s * 0.04, ['#3d7a30', '#58993f', '#4a8a36', '#6aa84a'][k % 4]);
    line(g, -s * 0.06, 0, s * 0.06, 0, 'rgba(20,60,20,.4)', Math.max(0.5, s * 0.005));
    g.restore();
  }
}
/* an armchair, a doily on its back — or Grandpa's rocking chair */
function rmArmchair(g, I, s, x, y){
  const X = x * s, Y = y * s, Lt = I.lookAt(x, y), col = Lt.chair || '#7b4f8a', rocking = !!Lt.rocking;
  ell(g, X + s * 0.55, Y + s * 0.88, s * 0.36, s * 0.08, 'rgba(20,12,6,.32)');
  if(rocking){ g.strokeStyle = '#5a3a22'; g.lineWidth = Math.max(1.2, s * 0.035); g.beginPath(); g.moveTo(X + s * 0.1, Y + s * 0.84); g.quadraticCurveTo(X + s * 0.5, Y + s * 0.96, X + s * 0.92, Y + s * 0.8); g.stroke(); }
  const back = rocking ? '#7a5232' : sh(col, -0.15);
  g.fillStyle = back; rr(g, X + s * 0.16, Y + s * 0.08, s * 0.68, s * 0.42, s * 0.12); g.fill();                         // its back
  if(rocking){ g.fillStyle = sh(back, -0.25); for(let k = 0; k < 4; k++) g.fillRect(X + s * (0.24 + k * 0.15), Y + s * 0.14, s * 0.05, s * 0.32); }
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(X + s * 0.2, Y + s * 0.1, s * 0.6, Math.max(1, s * 0.014));
  g.fillStyle = rocking ? '#8a6238' : col; rr(g, X + s * 0.14, Y + s * 0.42, s * 0.72, s * 0.36, s * 0.08); g.fill();    // its seat
  if(!rocking){ g.fillStyle = sh(col, 0.15); rr(g, X + s * 0.2, Y + s * 0.44, s * 0.6, s * 0.2, s * 0.06); g.fill(); }
  g.fillStyle = sh(rocking ? '#6a4426' : col, -0.1); rr(g, X + s * 0.06, Y + s * 0.3, s * 0.16, s * 0.5, s * 0.06); g.fill(); rr(g, X + s * 0.78, Y + s * 0.3, s * 0.16, s * 0.5, s * 0.06); g.fill();   // its arms
  /* the doily on its back */
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(X + s * 0.5, Y + s * 0.18, s * 0.17, s * 0.08, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(220,210,190,.9)'; g.lineWidth = Math.max(0.6, s * 0.006); for(let k = 0; k < 10; k++){ const a = k / 10 * TAU; g.beginPath(); g.arc(X + s * 0.5 + Math.cos(a) * s * 0.17, Y + s * 0.18 + Math.sin(a) * s * 0.08, s * 0.02, 0, TAU); g.stroke(); }
}
/* a chair: its back away from the table it is drawn up to */
function rmChair(g, I, s, x, y){
  const X = x * s, Y = y * s, col = I.lookAt(x, y).chair || '#7a5232';
  const n = { l:I.at(x - 1, y), r:I.at(x + 1, y), u:I.at(x, y - 1), d:I.at(x, y + 1) };
  const tL = n.l === 't', tR = n.r === 't', tD = n.d === 't', tU = n.u === 't';
  ell(g, X + s * 0.55, Y + s * 0.82, s * 0.24, s * 0.07, 'rgba(20,12,6,.3)');
  const sx = X + s * 0.26, sy = Y + s * 0.34, sw = s * 0.48, shh = s * 0.4;
  g.fillStyle = sh(col, -0.3); [[sx + s * 0.02, sy + shh], [sx + sw - s * 0.06, sy + shh]].forEach(([a, b])=> g.fillRect(a, b - s * 0.02, s * 0.04, s * 0.14));
  g.fillStyle = col; rr(g, sx, sy, sw, shh, s * 0.05); g.fill();
  g.fillStyle = 'rgba(255,230,200,.18)'; g.fillRect(sx, sy, sw, Math.max(1, s * 0.012));
  g.strokeStyle = sh(col, -0.25); g.lineWidth = Math.max(0.6, s * 0.007); for(let k = 1; k < 3; k++) line(g, sx + sw * k / 3, sy + s * 0.03, sx + sw * k / 3, sy + shh - s * 0.03, sh(col, -0.2), Math.max(0.6, s * 0.007));
  g.fillStyle = sh(col, -0.15);
  if(tR){ g.fillRect(sx - s * 0.04, Y + s * 0.12, s * 0.07, s * 0.62); for(let k = 0; k < 3; k++) g.fillRect(sx - s * 0.04, Y + s * (0.16 + k * 0.16), s * 0.1, s * 0.03); }
  else if(tL){ g.fillRect(sx + sw - s * 0.03, Y + s * 0.12, s * 0.07, s * 0.62); for(let k = 0; k < 3; k++) g.fillRect(sx + sw - s * 0.06, Y + s * (0.16 + k * 0.16), s * 0.1, s * 0.03); }
  else if(tD || !tU){ g.fillRect(sx, Y + s * 0.08, sw, s * 0.08); g.fillRect(sx, Y + s * 0.08, s * 0.05, s * 0.3); g.fillRect(sx + sw - s * 0.05, Y + s * 0.08, s * 0.05, s * 0.3); for(let k = 1; k < 4; k++) g.fillRect(sx + sw * k / 4 - s * 0.012, Y + s * 0.14, s * 0.024, s * 0.2); }
  else { g.fillRect(sx, sy + shh - s * 0.06, sw, s * 0.07); }
}

/* a table, laid as its room lays it: gingham, lace, a card table's baize with the cards and the coins, the lemon farm's
   sorting table, bare boards, the café's round marble tables, the villa's white linen with its gold edge, plates and
   candles (their flames: rmAnim) */
function rmTable(g, I, s, x, y){
  const run = I.runs.get(x + ',' + y) || { x0:x, x1:x, y0:y, y1:y, w:1, h:1 };
  if(run.x0 !== x || run.y0 !== y) return;
  const cloth = I.lookAt(x, y).cloth, q = R(x, y, 451);
  const X = run.x0 * s, Y = run.y0 * s, w = run.w * s, h = run.h * s;
  const single = run.w === 1 && run.h === 1;
  if(single && (cloth === 'marble' || cloth === 'lace')){
    const cx = X + s * 0.5, cy = Y + s * 0.46, r = s * 0.36;
    ell(g, cx + s * 0.06, cy + s * 0.4, r * 0.9, s * 0.08, 'rgba(20,12,6,.3)');
    g.fillStyle = '#3a3030'; g.fillRect(cx - s * 0.03, cy, s * 0.06, s * 0.4); ell(g, cx, cy + s * 0.4, s * 0.14, s * 0.04, '#2a2424');
    ell(g, cx, cy + s * 0.03, r, r * 0.7, cloth === 'marble' ? '#b8b0a4' : '#e8dcc8');
    ell(g, cx, cy, r, r * 0.7, cloth === 'marble' ? '#ece8e0' : '#f8f2e6');
    if(cloth === 'marble'){ g.strokeStyle = 'rgba(140,130,120,.3)'; g.lineWidth = Math.max(0.6, s * 0.006); g.beginPath(); g.moveTo(cx - r * 0.6, cy - r * 0.2); g.bezierCurveTo(cx - r * 0.2, cy, cx + r * 0.1, cy - r * 0.4, cx + r * 0.6, cy + r * 0.1); g.stroke();
      g.fillStyle = '#f8f4ee'; ell(g, cx - s * 0.06, cy, s * 0.07, s * 0.045, '#f8f4ee'); ell(g, cx - s * 0.06, cy - s * 0.005, s * 0.04, s * 0.025, '#5a3a24'); }
    else { g.strokeStyle = 'rgba(210,190,160,.8)'; g.lineWidth = Math.max(0.6, s * 0.008); for(let k = 0; k < 16; k++){ const a = k / 16 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.64, s * 0.022, 0, TAU); g.stroke(); }
      circ(g, cx, cy - s * 0.02, s * 0.06, '#c85a7a'); circ(g, cx - s * 0.04, cy - s * 0.05, s * 0.04, '#e88aa0'); circ(g, cx + s * 0.04, cy - s * 0.05, s * 0.035, '#f0b0c0'); }
    return;
  }
  const l = X + s * 0.06, r = X + w - s * 0.06, top = Y + s * 0.14, bot = Y + h - s * 0.2;
  g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(l + s * 0.06, bot + s * 0.04, r - l, s * 0.1);
  g.fillStyle = '#4a2e18'; [[l + s * 0.04, bot], [r - s * 0.1, bot]].forEach(([a, b])=> g.fillRect(a, b - s * 0.02, s * 0.06, s * 0.16));
  const base = { 'check-red':'#f4eee4', 'check-blue':'#f4eee4', lace:'#f8f2e6', baize:'#2e6a3a', sort:'#a8834e', wood:'#8a5e36', marble:'#ece8e0', white:'#fbf8f1' }[cloth] || '#8a5e36';
  const clothed = cloth !== 'wood' && cloth !== 'sort' && cloth !== 'baize';
  /* the cloth hangs a little over its edge */
  g.fillStyle = clothed ? sh(base, -0.1) : sh(base, -0.3); g.fillRect(l - s * 0.03, bot - s * 0.02, r - l + s * 0.06, s * (clothed ? 0.12 : 0.06));
  g.fillStyle = base; g.fillRect(l - s * 0.03, top, r - l + s * 0.06, bot - top);
  if(cloth === 'check-red' || cloth === 'check-blue'){
    g.save(); g.beginPath(); g.rect(l - s * 0.03, top, r - l + s * 0.06, bot - top + s * 0.1); g.clip();
    g.fillStyle = cloth === 'check-red' ? 'rgba(190,40,40,.5)' : 'rgba(50,90,170,.45)';
    for(let k = l - s * 0.03; k < r + s * 0.03; k += s * 0.16) g.fillRect(k, top, s * 0.08, bot - top + s * 0.1);
    for(let k = top; k < bot + s * 0.1; k += s * 0.16) g.fillRect(l - s * 0.03, k, r - l + s * 0.06, s * 0.08);
    g.restore();
  }
  if(cloth === 'lace'){ g.strokeStyle = 'rgba(200,180,150,.7)'; g.lineWidth = Math.max(0.8, s * 0.01); g.strokeRect(l + s * 0.03, top + s * 0.03, r - l - s * 0.06, bot - top - s * 0.06); }
  if(cloth === 'white'){ g.strokeStyle = '#c9a24a'; g.lineWidth = Math.max(1, s * 0.016); g.strokeRect(l + s * 0.02, top + s * 0.03, r - l - s * 0.04, bot - top - s * 0.06); }
  if(cloth === 'wood' || cloth === 'sort'){
    for(let k = 0; k < 3; k++){ const by = top + (bot - top) * k / 3; g.fillStyle = sh(base, (R(x, y * 3 + k, 452)() - 0.5) * 0.16); g.fillRect(l - s * 0.03, by + 0.6, r - l + s * 0.06, (bot - top) / 3 - 1.2); }
  }
  if(cloth === 'baize'){
    g.strokeStyle = '#6a4a2a'; g.lineWidth = Math.max(2, s * 0.05); g.strokeRect(l, top + s * 0.02, r - l, bot - top - s * 0.04);
    for(let k = 0; k < 4; k++){ g.save(); g.translate(l + s * 0.2 + q() * (r - l - s * 0.4), top + s * 0.15 + q() * (bot - top - s * 0.3)); g.rotate((q() - 0.5) * 1.2); g.fillStyle = '#f8f4ec'; rr(g, -s * 0.06, -s * 0.085, s * 0.12, s * 0.17, s * 0.015); g.fill(); g.fillStyle = k % 2 ? '#c03030' : '#202020'; g.font = `700 ${Math.max(6, Math.round(s * 0.08))}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(['A', 'K', '7', 'Q'][k], 0, 0); g.restore(); }
    for(let k = 0; k < 5; k++) ell(g, r - s * 0.2 + (k % 2) * s * 0.03, bot - s * 0.18 - k * s * 0.025, s * 0.06, s * 0.025, k % 2 ? '#d8ac40' : '#e8c45a');
  }
  if(cloth === 'sort'){ for(let k = 0; k < run.w * 4; k++){ const lx = l + s * 0.12 + q() * (r - l - s * 0.24), ly = top + s * 0.1 + q() * (bot - top - s * 0.2); ell(g, lx, ly, s * 0.07, s * 0.055, k % 5 === 2 ? '#c8d84a' : '#f2d64a'); ell(g, lx - s * 0.02, ly - s * 0.02, s * 0.02, s * 0.012, 'rgba(255,255,255,.5)'); } }
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(l - s * 0.03, top, r - l + s * 0.06, Math.max(1, s * 0.014));
  /* laid: a plate and a glass at each place, bread, a bottle, a candle */
  if(clothed){
    for(let tx = run.x0; tx <= run.x1; tx++) for(let ty = run.y0; ty <= run.y1; ty++){
      const cx = tx * s + s * 0.5, cy = ty * s + s * 0.5, qq = R(tx, ty, 453);
      if(cy < top + s * 0.1 || cy > bot) continue;
      ell(g, cx, cy, s * 0.15, s * 0.11, '#ffffff'); ell(g, cx, cy, s * 0.1, s * 0.07, cloth === 'white' ? '#efe6d0' : '#e8e0d0');
      if(cloth === 'white'){ g.strokeStyle = '#c9a24a'; g.lineWidth = Math.max(0.6, s * 0.006); g.beginPath(); g.ellipse(cx, cy, s * 0.13, s * 0.095, 0, 0, TAU); g.stroke(); }
      if(qq() < 0.5 && cloth !== 'white'){ ell(g, cx - s * 0.02, cy - s * 0.01, s * 0.06, s * 0.03, '#c84a2a'); }
      g.fillStyle = 'rgba(220,240,250,.6)'; g.fillRect(cx + s * 0.18, cy - s * 0.14, s * 0.05, s * 0.09);
      if(cloth === 'white' && tx % 2 === 0){ g.fillStyle = '#f4efe2'; g.fillRect(cx + s * 0.32, cy - s * 0.24, s * 0.04, s * 0.14); ell(g, cx + s * 0.34, cy - s * 0.08, s * 0.05, s * 0.02, '#c9a24a'); }
    }
    if(cloth !== 'white' && run.w * run.h > 1){ g.fillStyle = '#2e4a2a'; rr(g, (l + r) / 2 - s * 0.03, top + s * 0.06, s * 0.06, s * 0.18, s * 0.02); g.fill(); ell(g, (l + r) / 2 + s * 0.14, top + s * 0.14, s * 0.1, s * 0.05, '#c89a58'); }
  }
}
/* a crate (the Family's, a parcel, lemons), as the catacombs' — a pile of brown-paper parcels at the post office */
function rmCrate(g, I, s, x, y){
  const kind = I.lookAt(x, y).crate, X = x * s, Y = y * s, q = R(x, y, 461);
  if(kind === 'parcel'){
    for(let k = 0; k < 3; k++){ const pw = s * (0.4 + q() * 0.3), ph = s * (0.22 + q() * 0.12), px = X + s * 0.1 + q() * (s * 0.8 - pw), py = Y + s * 0.88 - (k + 1) * s * 0.26;
      g.fillStyle = 'rgba(20,12,6,.25)'; g.fillRect(px + s * 0.03, py + ph, pw, s * 0.04);
      g.fillStyle = sh('#b89060', (q() - 0.5) * 0.15); g.fillRect(px, py, pw, ph);
      g.fillStyle = 'rgba(255,240,210,.2)'; g.fillRect(px, py, pw, Math.max(1, s * 0.012));
      line(g, px + pw / 2, py, px + pw / 2, py + ph, '#e8d8b0', Math.max(0.8, s * 0.012)); line(g, px, py + ph / 2, px + pw, py + ph / 2, '#e8d8b0', Math.max(0.8, s * 0.012));
      if(q() < 0.5){ g.fillStyle = '#f4efe2'; g.fillRect(px + pw * 0.1, py + ph * 0.15, pw * 0.25, ph * 0.3); } }
    return;
  }
  cCrate(g, { runs:new Map() }, s, x, y);
  if(kind === 'lemons'){ for(let k = 0; k < 6; k++){ const lx = X + s * (0.2 + (k % 3) * 0.3), ly = Y + s * (0.18 + Math.floor(k / 3) * 0.12); ell(g, lx, ly, s * 0.1, s * 0.07, k === 4 ? '#c8d84a' : '#f2d64a'); ell(g, lx - s * 0.03, ly - s * 0.025, s * 0.03, s * 0.015, 'rgba(255,255,255,.5)'); } }
}
/* a barrel standing, or a sack of grain tied at its neck */
function rmBarrel(g, I, s, x, y){
  const kind = I.lookAt(x, y).barrel, X = x * s, Y = y * s, q = R(x, y, 471);
  if(kind === 'sack'){
    ell(g, X + s * 0.55, Y + s * 0.88, s * 0.32, s * 0.07, 'rgba(20,12,6,.3)');
    g.fillStyle = '#b8a07a'; g.beginPath(); g.moveTo(X + s * 0.24, Y + s * 0.88); g.quadraticCurveTo(X + s * 0.14, Y + s * 0.5, X + s * 0.36, Y + s * 0.24); g.lineTo(X + s * 0.64, Y + s * 0.24); g.quadraticCurveTo(X + s * 0.86, Y + s * 0.5, X + s * 0.76, Y + s * 0.88); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,240,210,.18)'; g.beginPath(); g.ellipse(X + s * 0.4, Y + s * 0.5, s * 0.08, s * 0.2, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(90,70,40,.25)'; g.lineWidth = Math.max(0.6, s * 0.006); for(let k = 0; k < 8; k++){ const yy = Y + s * (0.32 + k * 0.07); g.beginPath(); g.moveTo(X + s * 0.25, yy); g.lineTo(X + s * 0.75, yy); g.stroke(); }
    g.fillStyle = '#c8b088'; g.beginPath(); g.moveTo(X + s * 0.38, Y + s * 0.24); g.lineTo(X + s * 0.32, Y + s * 0.08); g.lineTo(X + s * 0.5, Y + s * 0.16); g.lineTo(X + s * 0.68, Y + s * 0.08); g.lineTo(X + s * 0.62, Y + s * 0.24); g.closePath(); g.fill();
    line(g, X + s * 0.36, Y + s * 0.24, X + s * 0.64, Y + s * 0.24, '#7a5a30', Math.max(1, s * 0.02));
    return;
  }
  cBarrel(g, { runs:new Map() }, s, x, y);
}
/* the villa's hall: a marble bust on its pedestal (standing up over the square behind) */
function rmStatue(g, I, s, x, y){
  const X = x * s, Y = y * s, cx = X + s / 2, top = Y - RM_UP * s;
  ell(g, cx + s * 0.08, Y + s * 0.9, s * 0.3, s * 0.07, 'rgba(20,12,6,.35)');
  g.fillStyle = lin(g, cx - s * 0.2, 0, cx + s * 0.2, 0, [[0, '#cfc8bc'], [0.35, '#f4efe6'], [1, '#a8a196']]);
  g.fillRect(cx - s * 0.17, Y + s * 0.3, s * 0.34, s * 0.58);
  g.fillStyle = '#e8e2d8'; g.fillRect(cx - s * 0.23, Y + s * 0.24, s * 0.46, s * 0.08); g.fillRect(cx - s * 0.23, Y + s * 0.82, s * 0.46, s * 0.08);
  g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(cx - s * 0.23, Y + s * 0.31, s * 0.46, Math.max(1, s * 0.012));
  /* the bust: shoulders, a head, a stern brow */
  g.fillStyle = lin(g, cx - s * 0.25, 0, cx + s * 0.25, 0, [[0, '#d8d2c6'], [0.35, '#fbf8f2'], [1, '#b0a99e']]);
  g.beginPath(); g.moveTo(cx - s * 0.24, Y + s * 0.24); g.quadraticCurveTo(cx - s * 0.22, top + s * 0.62, cx, top + s * 0.58); g.quadraticCurveTo(cx + s * 0.22, top + s * 0.62, cx + s * 0.24, Y + s * 0.24); g.closePath(); g.fill();
  ell(g, cx, top + s * 0.38, s * 0.13, s * 0.17, '#f2ede4');
  ell(g, cx - s * 0.04, top + s * 0.33, s * 0.05, s * 0.07, 'rgba(255,255,255,.6)');
  g.fillStyle = 'rgba(120,110,100,.35)'; g.fillRect(cx - s * 0.08, top + s * 0.34, s * 0.16, Math.max(1, s * 0.012));
  ell(g, cx + s * 0.07, top + s * 0.42, s * 0.04, s * 0.09, 'rgba(120,110,100,.2)');
}
/* the opera's seats: red velvet, row on row */
function rmSeats(g, I, s, x, y){
  const X = x * s, Y = y * s, run = I.runs.get(x + ',' + y) || { x0:x, x1:x }, first = run.x0 === x, last = run.x1 === x;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X, Y + s * 0.82, s, s * 0.1);
  for(let k = 0; k < 2; k++){
    const sx = X + s * (0.05 + k * 0.48), sw = s * 0.42;
    g.fillStyle = '#5a0e18'; rr(g, sx, Y + s * 0.12, sw, s * 0.36, s * 0.06); g.fill();
    g.fillStyle = '#8a1e2c'; rr(g, sx + s * 0.03, Y + s * 0.15, sw - s * 0.06, s * 0.3, s * 0.05); g.fill();
    g.fillStyle = 'rgba(255,200,200,.15)'; g.fillRect(sx + s * 0.05, Y + s * 0.17, sw - s * 0.1, Math.max(1, s * 0.012));
    g.fillStyle = '#7a1622'; rr(g, sx, Y + s * 0.48, sw, s * 0.3, s * 0.05); g.fill();
    g.fillStyle = '#c9a24a'; g.fillRect(sx + sw / 2 - s * 0.03, Y + s * 0.06, s * 0.06, s * 0.05);
  }
  g.fillStyle = '#c9a24a';
  if(first) g.fillRect(X, Y + s * 0.1, s * 0.04, s * 0.72);
  if(last) g.fillRect(X + s * 0.96, Y + s * 0.1, s * 0.04, s * 0.72);
}
/* the police station's cells: iron bars (standing up over the square behind) */
function rmBars(g, I, s, x, y){
  const X = x * s, Y = y * s, n = (dx, dy)=> I.at(x + dx, y + dy) === 'J' || I.at(x + dx, y + dy) === '#';
  const top = Y - RM_UP * s, bot = Y + s * 0.95;
  const vert = (I.at(x, y - 1) === 'J' || I.at(x, y + 1) === 'J') && !(I.at(x - 1, y) === 'J' || I.at(x + 1, y) === 'J');
  if(vert){
    /* a run of bars going away from you, seen end on: one behind the other, each with its cap, the rails along their
       tops and feet, their shadow on the floor beside them */
    const cx = X + s * 0.5, H0 = (RM_UP + 0.95) * s;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(cx + s * 0.06, Y, s * 0.16, s);
    for(let k = 0; k < 4; k++){
      const fy = Y + s * (0.12 + k * 0.25), ty = fy - H0 + s * 0.12, dx = (k % 2 ? 1 : -1) * s * 0.025;
      g.fillStyle = lin(g, cx + dx - s * 0.04, 0, cx + dx + s * 0.04, 0, [[0, '#26262c'], [0.45, '#9a9aa4'], [1, '#26262c']]); g.fillRect(cx + dx - s * 0.035, ty, s * 0.07, fy - ty);
      ell(g, cx + dx, ty, s * 0.045, s * 0.022, '#b8b8c2');
      ell(g, cx + dx, fy, s * 0.05, s * 0.02, 'rgba(0,0,0,.35)');
    }
    g.fillStyle = lin(g, cx - s * 0.08, 0, cx + s * 0.08, 0, [[0, '#4a4a52'], [0.5, '#a8a8b2'], [1, '#3a3a42']]);
    g.fillRect(cx - s * 0.08, top, s * 0.16, s * 0.05); g.fillRect(cx - s * 0.08, Y + s * 0.3 - RM_UP * s * 0.4, s * 0.16, s * 0.04);
    return;
  }
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X, bot - s * 0.02, s, s * 0.06);
  for(let k = 0; k < 4; k++){
    const bx = X + s * (0.12 + k * 0.25);
    g.fillStyle = lin(g, bx - s * 0.035, 0, bx + s * 0.035, 0, [[0, '#2a2a30'], [0.5, '#9a9aa2'], [1, '#2a2a30']]); g.fillRect(bx - s * 0.035, top, s * 0.07, bot - top);
  }
  [0.08, 0.6].forEach(f=>{ const by = top + (bot - top) * f; g.fillStyle = lin(g, 0, by, 0, by + s * 0.06, [[0, '#8a8a92'], [1, '#2a2a30']]); g.fillRect(X, by, s, s * 0.06); });
  if(!n(-1, 0) && !n(1, 0)){}
}
/* Lucia's nets, hung down the wall and heaped, floats in them */
function rmNets(g, I, s, x, y){
  const X = x * s, Y = y * s, q = R(x, y, 481);
  g.fillStyle = 'rgba(20,12,6,.2)'; g.fillRect(X + s * 0.06, Y + s * 0.84, s * 0.8, s * 0.1);
  g.fillStyle = '#b8a070'; g.beginPath(); g.moveTo(X + s * 0.04, Y + s * 0.06); g.quadraticCurveTo(X + s * 0.5, Y + s * 0.3, X + s * 0.92, Y + s * 0.1); g.lineTo(X + s * 0.86, Y + s * 0.88); g.quadraticCurveTo(X + s * 0.5, Y + s * 0.96, X + s * 0.08, Y + s * 0.88); g.closePath(); g.fill();
  g.save(); g.clip();
  g.strokeStyle = 'rgba(90,70,40,.6)'; g.lineWidth = Math.max(0.6, s * 0.007);
  for(let k = -s; k < s * 2; k += s * 0.07){ line(g, X + k, Y, X + k + s * 0.6, Y + s, 'rgba(90,70,40,.55)', Math.max(0.6, s * 0.007)); line(g, X + k + s * 0.6, Y, X + k, Y + s, 'rgba(90,70,40,.55)', Math.max(0.6, s * 0.007)); }
  g.restore();
  for(let k = 0; k < 3; k++){ const fx = X + s * (0.2 + q() * 0.6), fy = Y + s * (0.25 + q() * 0.55); circ(g, fx, fy, s * 0.06, q() < 0.5 ? '#e05a3a' : '#f0c040'); circ(g, fx - s * 0.02, fy - s * 0.02, s * 0.018, 'rgba(255,255,255,.5)'); }
}
/* the barber's chair: leather, chrome, its headrest, turned to the mirror */
function rmBarberChair(g, I, s, x, y){
  const X = x * s, Y = y * s, cx = X + s / 2;
  ell(g, cx + s * 0.05, Y + s * 0.88, s * 0.3, s * 0.08, 'rgba(20,12,6,.35)');
  ell(g, cx, Y + s * 0.84, s * 0.22, s * 0.06, '#9a9aa2'); g.fillStyle = '#b8b8c0'; g.fillRect(cx - s * 0.05, Y + s * 0.62, s * 0.1, s * 0.22);
  g.fillStyle = '#5a2a20'; rr(g, cx - s * 0.26, Y + s * 0.42, s * 0.52, s * 0.24, s * 0.06); g.fill();
  g.fillStyle = '#6e3626'; rr(g, cx - s * 0.22, Y + s * 0.1, s * 0.44, s * 0.36, s * 0.08); g.fill();
  g.fillStyle = 'rgba(255,220,200,.18)'; g.fillRect(cx - s * 0.18, Y + s * 0.13, s * 0.36, Math.max(1, s * 0.014));
  g.fillStyle = '#4a2018'; rr(g, cx - s * 0.12, Y + s * 0.02, s * 0.24, s * 0.1, s * 0.04); g.fill();
  g.fillStyle = '#c8c8d0'; g.fillRect(cx - s * 0.32, Y + s * 0.4, s * 0.08, s * 0.05); g.fillRect(cx + s * 0.24, Y + s * 0.4, s * 0.08, s * 0.05);
  g.fillStyle = '#d8d8e0'; g.fillRect(cx - s * 0.18, Y + s * 0.72, s * 0.36, s * 0.04);
}
/* a bench: slats on iron legs, for waiting */
function rmBench(g, I, s, x, y){
  const X = x * s, Y = y * s, run = I.runs.get(x + ',' + y) || { x0:x, x1:x }, first = run.x0 === x, last = run.x1 === x;
  const l = X + (first ? s * 0.06 : 0), r = X + s - (last ? s * 0.06 : 0), col = I.L.bench || '#7a5232';
  g.fillStyle = 'rgba(20,12,6,.28)'; g.fillRect(l + s * 0.04, Y + s * 0.78, r - l, s * 0.1);
  g.fillStyle = '#2a2a2e'; if(first) g.fillRect(l + s * 0.05, Y + s * 0.4, s * 0.05, s * 0.44); if(last) g.fillRect(r - s * 0.1, Y + s * 0.4, s * 0.05, s * 0.44);
  for(let k = 0; k < 3; k++){ const sy = Y + s * (0.2 + k * 0.13); g.fillStyle = sh(col, (k - 1) * 0.08); g.fillRect(l, sy, r - l, s * 0.1); g.fillStyle = 'rgba(255,230,200,.18)'; g.fillRect(l, sy, r - l, Math.max(1, s * 0.012)); }
  g.fillStyle = sh(col, -0.2); g.fillRect(l, Y + s * 0.08, r - l, s * 0.08);
}
/* the opera's stage: its front edge, lit */
function rmStageLip(g, I, s, x, y){
  const X = x * s, Y = y * s;
  g.fillStyle = '#5a3a1e'; g.fillRect(X, Y + s * 0.84, s, s * 0.16);
  g.fillStyle = '#c9a24a'; g.fillRect(X, Y + s * 0.82, s, s * 0.035);
  for(let k = 0; k < 2; k++) circ(g, X + s * (0.25 + k * 0.5), Y + s * 0.92, s * 0.03, 'rgba(255,230,160,.9)');   // the footlights
}

/* ---------- what only one room has ---------- */
function rmText(g, str, x, y, size, col, font){ g.font = `700 ${Math.max(5, Math.round(size))}px ${font || 'Georgia, serif'}`; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, x, y); }
function rmBoard(g, s, x, y, w, h, bg, rim){
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + s * 0.02, y + s * 0.03, w, h);
  g.fillStyle = rim || '#5a3a20'; g.fillRect(x, y, w, h);
  g.fillStyle = bg; g.fillRect(x + s * 0.03, y + s * 0.03, w - s * 0.06, h - s * 0.06);
}
function rmClock(g, s, cx, cy, r){
  circ(g, cx + s * 0.02, cy + s * 0.03, r, 'rgba(0,0,0,.25)');
  circ(g, cx, cy, r, '#5a3a20'); circ(g, cx, cy, r * 0.84, '#f6f0e2');
  for(let k = 0; k < 12; k++){ const a = k / 12 * TAU; line(g, cx + Math.cos(a) * r * 0.68, cy + Math.sin(a) * r * 0.68, cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78, '#3a2a1a', Math.max(0.6, r * (k % 3 ? 0.04 : 0.08))); }
  line(g, cx, cy, cx, cy - r * 0.6, '#1a1a1a', Math.max(0.8, r * 0.08)); line(g, cx, cy, cx + r * 0.42, cy + r * 0.16, '#1a1a1a', Math.max(0.8, r * 0.08));
  circ(g, cx, cy, Math.max(0.8, r * 0.07), '#c9a24a');
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.3, r * 0.15, -0.6, 0, TAU); g.fill();
}
const RM_DECOR = {
  room_lucia(g, I, s){                                                  // Pippo's wooden boat, out on the rug
    const X = 6 * s, Y = 5 * s;
    ell(g, X + s * 0.5, Y + s * 0.62, s * 0.3, s * 0.06, 'rgba(0,0,0,.25)');
    g.fillStyle = '#8a5a32'; g.beginPath(); g.moveTo(X + s * 0.18, Y + s * 0.42); g.lineTo(X + s * 0.82, Y + s * 0.42); g.lineTo(X + s * 0.7, Y + s * 0.6); g.lineTo(X + s * 0.3, Y + s * 0.6); g.closePath(); g.fill();
    g.fillStyle = '#c84a2a'; g.fillRect(X + s * 0.2, Y + s * 0.42, s * 0.6, s * 0.04);
    line(g, X + s * 0.5, Y + s * 0.42, X + s * 0.5, Y + s * 0.08, '#4a2a14', Math.max(0.8, s * 0.014));
    g.fillStyle = '#f4efe2'; g.beginPath(); g.moveTo(X + s * 0.52, Y + s * 0.1); g.lineTo(X + s * 0.52, Y + s * 0.38); g.lineTo(X + s * 0.74, Y + s * 0.38); g.closePath(); g.fill();
  },
  room_station(g, I, s){                                                // the clock, and the timetable nobody may use
    rmClock(g, s, 6.5 * s, 0.42 * s, s * 0.3);
    rmBoard(g, s, 7.25 * s, 0.1 * s, 1.5 * s, 0.62 * s, '#1e2a22');
    rmText(g, 'OLD TOWN', 8 * s, 0.26 * s, s * 0.14, '#e8e0c0'); rmText(g, '6.40  7.15  8.30', 8 * s, 0.42 * s, s * 0.09, '#c8c0a0', 'system-ui');
    rmText(g, 'FAMILY ONLY', 8 * s, 0.58 * s, s * 0.11, '#e88a6a');
  },
  room_customs(g, I, s){                                                // the plaque, the brass scale, the coins, the safe
    rmBoard(g, s, 5.1 * s, 0.08 * s, 2.8 * s, 0.5 * s, '#d8b060', '#8a6a2a');
    rmText(g, 'CUSTOMS', 6.5 * s, 0.25 * s, s * 0.18, '#3a2a10');
    line(g, 5.4 * s, 0.38 * s, 7.6 * s, 0.36 * s, '#7a1a1a', Math.max(1, s * 0.02));
    rmText(g, 'FAMILY BUSINESS', 6.5 * s, 0.48 * s, s * 0.09, '#7a1a1a');
    const sx = 3.5 * s, sy = 4.25 * s;                                   // the scale, on the counter
    g.fillStyle = '#c8a050'; g.fillRect(sx - s * 0.02, sy - s * 0.24, s * 0.04, s * 0.26); g.fillRect(sx - s * 0.26, sy - s * 0.24, s * 0.52, s * 0.03);
    [-1, 1].forEach(dd=>{ line(g, sx + dd * s * 0.22, sy - s * 0.22, sx + dd * s * 0.22, sy - s * 0.12, '#a88040', Math.max(0.6, s * 0.008)); ell(g, sx + dd * s * 0.22, sy - s * 0.1, s * 0.1, s * 0.035, '#d8b060'); });
    ell(g, sx, sy + s * 0.02, s * 0.1, s * 0.03, '#a88040');
    [[8, 4], [9, 4]].forEach(([x, y])=>{ for(let k = 0; k < 4; k++) ell(g, x * s + s * (0.36 + (k % 2) * 0.12), y * s + s * (0.32 - k * 0.025), s * 0.08, s * 0.03, k % 2 ? '#d8ac40' : '#e8c45a'); });
    const fx = 6 * s, fy = 2 * s;                                        // the safe, on the floor
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(fx + s * 0.18, fy + s * 0.86, s * 0.7, s * 0.08);
    g.fillStyle = lin(g, fx + s * 0.14, 0, fx + s * 0.86, 0, [[0, '#2a2a30'], [0.4, '#4a4a52'], [1, '#202024']]); g.fillRect(fx + s * 0.14, fy + s * 0.14, s * 0.72, s * 0.74);
    g.strokeStyle = '#5a5a62'; g.lineWidth = Math.max(1, s * 0.012); g.strokeRect(fx + s * 0.2, fy + s * 0.2, s * 0.6, s * 0.62);
    circ(g, fx + s * 0.5, fy + s * 0.5, s * 0.12, '#8a8a92'); circ(g, fx + s * 0.5, fy + s * 0.5, s * 0.08, '#5a5a62');
    for(let k = 0; k < 8; k++){ const a = k / 8 * TAU; line(g, fx + s * 0.5 + Math.cos(a) * s * 0.09, fy + s * 0.5 + Math.sin(a) * s * 0.09, fx + s * 0.5 + Math.cos(a) * s * 0.12, fy + s * 0.5 + Math.sin(a) * s * 0.12, '#cfcfd6', Math.max(0.6, s * 0.006)); }
    g.fillStyle = '#c9a24a'; g.fillRect(fx + s * 0.68, fy + s * 0.44, s * 0.06, s * 0.14);
  },
  room_warehouse(g, I, s){                                              // a coil of rope (the hum of the Family's crates: rmAnim)
    const cx = 9.5 * s, cy = 7.55 * s;
    for(let k = 3; k >= 0; k--){ g.strokeStyle = k % 2 ? '#a8885a' : '#c0a06a'; g.lineWidth = Math.max(1.5, s * 0.05); g.beginPath(); g.ellipse(cx, cy, s * (0.12 + k * 0.07), s * (0.08 + k * 0.045), 0, 0, TAU); g.stroke(); }
    line(g, cx + s * 0.33, cy, cx + s * 0.45, cy + s * 0.2, '#a8885a', Math.max(1.5, s * 0.05));
  },
  room_nonna(g, I, s){                                                  // her cat on the windowsill; her knitting
    const X = 3 * s, by = 0.78 * s;
    g.fillStyle = '#3a3030'; g.beginPath(); g.ellipse(X + s * 0.46, by - s * 0.07, s * 0.2, s * 0.1, 0, 0, TAU); g.fill();
    circ(g, X + s * 0.64, by - s * 0.18, s * 0.09, '#3a3030');
    poly(g, [[X + s * 0.58, by - s * 0.24], [X + s * 0.6, by - s * 0.34], [X + s * 0.65, by - s * 0.25]], '#3a3030');
    poly(g, [[X + s * 0.66, by - s * 0.25], [X + s * 0.71, by - s * 0.33], [X + s * 0.72, by - s * 0.21]], '#3a3030');
    circ(g, X + s * 0.62, by - s * 0.19, Math.max(0.7, s * 0.012), '#c8d84a'); circ(g, X + s * 0.68, by - s * 0.19, Math.max(0.7, s * 0.012), '#c8d84a');
    g.strokeStyle = '#3a3030'; g.lineWidth = Math.max(1.2, s * 0.03); g.beginPath(); g.moveTo(X + s * 0.28, by - s * 0.06); g.quadraticCurveTo(X + s * 0.12, by + s * 0.06, X + s * 0.24, by + s * 0.14); g.stroke();
    const kx = 3 * s + s * 0.32, ky = 2 * s + s * 0.76;                  // her knitting: a ball of wool, its needles
    circ(g, kx, ky, s * 0.1, '#c85a7a'); g.strokeStyle = 'rgba(255,200,215,.6)'; g.lineWidth = Math.max(0.6, s * 0.008); for(let k = 0; k < 4; k++){ g.beginPath(); g.arc(kx, ky, s * 0.1, k * 0.8, k * 0.8 + 1.6); g.stroke(); }
    line(g, kx - s * 0.16, ky - s * 0.2, kx + s * 0.12, ky + s * 0.1, '#d8d0c0', Math.max(0.8, s * 0.012)); line(g, kx - s * 0.1, ky - s * 0.22, kx + s * 0.06, ky + s * 0.14, '#d8d0c0', Math.max(0.8, s * 0.012));
  },
  room_barber(g, I, s){                                                 // mirrors over the chairs; the pole; the sign
    [2, 5, 8].forEach(x=>{
      const X = x * s; g.fillStyle = '#c8a050'; rr(g, X + s * 0.14, s * 0.06, s * 0.72, s * 0.62, s * 0.08); g.fill();
      g.fillStyle = lin(g, X + s * 0.2, s * 0.1, X + s * 0.8, s * 0.64, [[0, '#d8e8ee'], [0.5, '#a8c4d0'], [1, '#c8dce4']]); rr(g, X + s * 0.19, s * 0.11, s * 0.62, s * 0.52, s * 0.06); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(X + s * 0.26, s * 0.14); g.lineTo(X + s * 0.38, s * 0.14); g.lineTo(X + s * 0.26, s * 0.4); g.closePath(); g.fill();
      g.fillStyle = '#e8e2d4'; g.fillRect(X + s * 0.12, s * 0.7, s * 0.76, s * 0.06);       // a shelf under it: a brush, a bottle
      g.fillStyle = '#3a8a6a'; g.fillRect(X + s * 0.6, s * 0.6, s * 0.06, s * 0.1); g.fillStyle = '#6a4a2a'; g.fillRect(X + s * 0.25, s * 0.64, s * 0.16, s * 0.05);
    });
    const H = I.H, py = (H - 1) * s;
    g.fillStyle = '#d8d0c0'; g.fillRect(3 * s + s * 0.34, py + s * 0.04, s * 0.32, s * 0.08); g.fillRect(3 * s + s * 0.34, py + s * 0.88, s * 0.32, s * 0.08);
    g.save(); g.beginPath(); g.rect(3 * s + s * 0.38, py + s * 0.12, s * 0.24, s * 0.76); g.clip();
    g.fillStyle = '#f4efe2'; g.fillRect(3 * s, py, s, s);
    for(let k = -2; k < 8; k++){ g.save(); g.translate(3 * s + s * 0.38, py + s * 0.12 + k * s * 0.14); g.rotate(-0.5); g.fillStyle = k % 2 ? '#c82a2a' : '#2a4a9a'; g.fillRect(-s * 0.2, 0, s * 0.7, s * 0.05); g.restore(); }
    g.fillStyle = lin(g, 3 * s + s * 0.38, 0, 3 * s + s * 0.62, 0, [[0, 'rgba(0,0,0,.25)'], [0.4, 'rgba(255,255,255,.2)'], [1, 'rgba(0,0,0,.3)']]); g.fillRect(3 * s + s * 0.38, py + s * 0.12, s * 0.24, s * 0.76);
    g.restore();
    rmBoard(g, s, 6 * s + s * 0.1, py + s * 0.2, s * 0.8, s * 0.42, '#f4efe2', '#7a3a2a'); rmText(g, 'BACK SOON', 6.5 * s, py + s * 0.41, s * 0.11, '#7a3a2a');
  },
  room_opera(g, I, s){                                                  // the great curtain, its gold fringe, the boxes either side, the spotlight
    const W = I.W;
    for(let x = 1; x < W - 1; x++){
      const X = x * s;
      for(let k = 0; k < 3; k++){ const fx = X + k * s / 3; g.fillStyle = lin(g, fx, 0, fx + s / 3, 0, [[0, '#4a0a14'], [0.5, '#a8222f'], [1, '#4a0a14']]); g.fillRect(fx, 0, s / 3 + 0.5, s * 0.96); }
      g.fillStyle = '#d8b050'; g.fillRect(X, s * 0.86, s, s * 0.04);
      for(let k = 0; k < 8; k++) g.fillRect(X + k * s / 8 + s * 0.02, s * 0.9, Math.max(1, s * 0.03), s * 0.08);
    }
    g.fillStyle = '#7a1622'; for(let x = 1; x < W - 1; x++){ g.beginPath(); g.moveTo(x * s, 0); g.quadraticCurveTo(x * s + s / 2, s * 0.22, x * s + s, 0); g.lineTo(x * s + s, s * 0.08); g.quadraticCurveTo(x * s + s / 2, s * 0.3, x * s, s * 0.08); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(255,235,170,.2)'; g.beginPath(); g.ellipse(W * s / 2, 2.2 * s, s * 2.2, s * 1.1, 0, 0, TAU); g.fill();
    [5, 8].forEach(y=>{ [0, W - 1].forEach(x=>{ const X = x * s, Y = y * s; g.fillStyle = '#c9a24a'; rr(g, X + s * 0.1, Y + s * 0.1, s * 0.8, s * 0.8, s * 0.1); g.fill(); g.fillStyle = '#5a0e18'; rr(g, X + s * 0.2, Y + s * 0.2, s * 0.6, s * 0.6, s * 0.08); g.fill(); g.fillStyle = 'rgba(255,220,150,.25)'; g.fillRect(X + s * 0.2, Y + s * 0.2, s * 0.6, s * 0.08); }); });
    g.fillStyle = rad(g, W * s / 2, 6.5 * s, s * 0.1, s * 3, [[0, 'rgba(255,230,160,.24)'], [1, 'rgba(255,230,160,0)']]); g.fillRect(0, 3 * s, W * s, 7 * s);
  },
  room_police(g, I, s){                                                 // WANTED — the ears far too big — and the Family's calendar, a boat on it
    const X = 3 * s;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(X + s * 0.2, s * 0.1, s * 0.62, s * 0.66);
    g.fillStyle = '#efe4c8'; g.fillRect(X + s * 0.17, s * 0.07, s * 0.62, s * 0.66);
    rmText(g, 'WANTED', X + s * 0.48, s * 0.17, s * 0.13, '#7a1a1a');
    g.strokeStyle = '#2a2a2a'; g.lineWidth = Math.max(0.8, s * 0.012);
    g.beginPath(); g.arc(X + s * 0.48, s * 0.4, s * 0.09, 0, TAU); g.stroke();
    g.beginPath(); g.arc(X + s * 0.35, s * 0.36, s * 0.07, 0, TAU); g.stroke(); g.beginPath(); g.arc(X + s * 0.61, s * 0.36, s * 0.07, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(X + s * 0.3, s * 0.66); g.quadraticCurveTo(X + s * 0.48, s * 0.48, X + s * 0.66, s * 0.66); g.stroke();
    circ(g, X + s * 0.45, s * 0.39, Math.max(0.7, s * 0.01), '#2a2a2a'); circ(g, X + s * 0.51, s * 0.39, Math.max(0.7, s * 0.01), '#2a2a2a');
    const C = 6 * s;
    g.fillStyle = '#f4efe2'; g.fillRect(C + s * 0.2, s * 0.08, s * 0.6, s * 0.66);
    g.fillStyle = lin(g, 0, s * 0.12, 0, s * 0.36, [[0, '#9ac8e0'], [1, '#5a98b8']]); g.fillRect(C + s * 0.25, s * 0.12, s * 0.5, s * 0.24);
    g.fillStyle = '#5a3a24'; g.fillRect(C + s * 0.36, s * 0.3, s * 0.28, s * 0.04); line(g, C + s * 0.5, s * 0.3, C + s * 0.5, s * 0.16, '#4a2a14', Math.max(0.6, s * 0.006));
    g.fillStyle = 'rgba(80,70,60,.5)'; for(let r = 0; r < 4; r++) for(let k = 0; k < 6; k++) g.fillRect(C + s * (0.26 + k * 0.08), s * (0.42 + r * 0.07), s * 0.04, s * 0.035);
    g.fillStyle = '#c82a2a'; g.fillRect(C + s * 0.26 + 3 * s * 0.08, s * 0.49, s * 0.04, s * 0.035);
    circ(g, 4 * s + s * 0.5, s * 0.35, s * 0.08, '#c8a050'); g.fillStyle = '#c8a050'; g.fillRect(4 * s + s * 0.48, s * 0.42, s * 0.04, s * 0.2);
    g.fillStyle = rad(g, 4 * s + s * 0.5, s * 0.35, 0, s * 0.5, [[0, 'rgba(255,220,140,.3)'], [1, 'rgba(255,220,140,0)']]); g.fillRect(3.5 * s, 0, s, s);
  },
  room_post(g, I, s){ rmBoard(g, s, 4.3 * s, 0.1 * s, 1.4 * s, 0.4 * s, '#d8b060', '#8a6a2a'); rmText(g, 'POSTE', 5 * s, 0.31 * s, s * 0.2, '#3a2a10'); },
  room_cafe(g, I, s){                                                   // the espresso machine; the board; the clock
    const X = 8 * s, Y = 2 * s;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X + s * 0.14, Y + s * 0.04, s * 1.76, s * 0.2);
    g.fillStyle = lin(g, X + s * 0.1, 0, X + s * 1.9, 0, [[0, '#8a8a94'], [0.3, '#e0e0e8'], [0.6, '#b8b8c2'], [1, '#7a7a84']]); rr(g, X + s * 0.1, Y - s * 0.42, s * 1.8, s * 0.5, s * 0.06); g.fill();
    g.fillStyle = '#c9a24a'; rr(g, X + s * 0.6, Y - s * 0.6, s * 0.8, s * 0.2, s * 0.08); g.fill(); circ(g, X + s, Y - s * 0.62, s * 0.06, '#e8c45a');
    for(let k = 0; k < 2; k++){ const gx = X + s * (0.5 + k); g.fillStyle = '#2a2a2e'; g.fillRect(gx - s * 0.06, Y - s * 0.02, s * 0.12, s * 0.08); g.fillRect(gx - s * 0.18, Y + s * 0.02, s * 0.36, s * 0.03); ell(g, gx, Y + s * 0.14, s * 0.06, s * 0.03, '#f4efe4'); }
    circ(g, X + s * 1.0, Y - s * 0.22, s * 0.07, '#f4efe4'); line(g, X + s, Y - s * 0.22, X + s * 1.04, Y - s * 0.26, '#222', Math.max(0.6, s * 0.008));
    rmBoard(g, s, 4 * s + s * 0.14, s * 0.08, s * 0.72, s * 0.6, '#22282a'); rmText(g, 'CAFFÈ', 4.5 * s, s * 0.24, s * 0.13, '#f4efe2'); rmText(g, 'BAR', 4.5 * s, s * 0.4, s * 0.12, '#e8d8a0'); rmText(g, 'espresso', 4.5 * s, s * 0.54, s * 0.08, '#c8c0a0', 'system-ui');
    rmClock(g, s, 8.5 * s, 0.4 * s, s * 0.25);
  },
  room_trattoria(g, I, s){                                              // garlic and peppers on strings
    [2, 5, 7, 10].forEach(x=>{
      line(g, x * s + s * 0.5, s * 0.06, x * s + s * 0.5, s * 0.82, '#7a5a3a', Math.max(0.8, s * 0.01));
      for(let k = 0; k < 6; k++){ const px = x * s + s * 0.5 + (k % 2 ? s * 0.07 : -s * 0.07), py = s * (0.16 + k * 0.11);
        if(x % 2){ g.fillStyle = k % 3 ? '#c82a2a' : '#e8402a'; g.beginPath(); g.moveTo(px, py - s * 0.04); g.quadraticCurveTo(px + s * 0.06, py, px + (k % 2 ? s * 0.02 : -s * 0.02), py + s * 0.1); g.quadraticCurveTo(px - s * 0.05, py, px, py - s * 0.04); g.fill(); g.fillStyle = '#3a6a2a'; g.fillRect(px - s * 0.01, py - s * 0.06, s * 0.02, s * 0.03); }
        else { ell(g, px, py, s * 0.055, s * 0.05, '#f2ece0'); for(let j = -1; j <= 1; j++) line(g, px + j * s * 0.02, py - s * 0.04, px + j * s * 0.02, py + s * 0.04, 'rgba(160,140,120,.5)', Math.max(0.5, s * 0.005)); }
      }
    });
  },
  room_gelateria(g, I, s){                                              // forty flavours, and pistachio underlined three times
    rmBoard(g, s, 4 * s + s * 0.05, s * 0.06, s * 2.9, s * 0.72, '#2a2e2a');
    rmText(g, '40 FLAVOURS', 5.5 * s, s * 0.24, s * 0.15, '#f4efe2'); rmText(g, 'PISTACHIO', 5.5 * s, s * 0.46, s * 0.15, '#a8d888');
    g.fillStyle = '#a8d888'; for(let k = 0; k < 3; k++) g.fillRect(5.5 * s - s * 0.5, s * (0.56 + k * 0.045), s, Math.max(0.8, s * 0.014));
    [3, 7].forEach(x=>{ const X = x * s; g.fillStyle = '#d8a860'; g.beginPath(); g.moveTo(X + s * 0.32, s * 0.36); g.lineTo(X + s * 0.68, s * 0.36); g.lineTo(X + s * 0.5, s * 0.8); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,80,30,.5)'; g.lineWidth = Math.max(0.6, s * 0.006); for(let k = 0; k < 3; k++){ g.beginPath(); g.moveTo(X + s * (0.36 + k * 0.1), s * 0.36); g.lineTo(X + s * (0.46 + k * 0.03), s * 0.7); g.stroke(); }
      circ(g, X + s * 0.5, s * 0.3, s * 0.16, x === 3 ? '#f4c8d8' : '#b8e0b0'); circ(g, X + s * 0.44, s * 0.25, s * 0.05, 'rgba(255,255,255,.5)'); });
  },
  room_lemons(g, I, s){ [[4, 7], [8, 2], [2, 4]].forEach(([x, y])=>{ ell(g, x * s + s * 0.34, y * s + s * 0.8, s * 0.1, s * 0.03, 'rgba(0,0,0,.2)'); ell(g, x * s + s * 0.32, y * s + s * 0.74, s * 0.1, s * 0.075, '#f2d64a'); ell(g, x * s + s * 0.29, y * s + s * 0.71, s * 0.03, s * 0.02, 'rgba(255,255,255,.5)'); }); },
  room_guards(g, I, s){ rmBoard(g, s, 6 * s + s * 0.1, s * 0.08, s * 1.8, s * 0.62, '#e8dcc0', '#7a5a3a'); rmText(g, 'DUTY', 7 * s, s * 0.22, s * 0.15, '#3a2a10'); g.fillStyle = '#6a5a4a'; for(let k = 0; k < 3; k++) g.fillRect(6 * s + s * 0.3, s * (0.36 + k * 0.09), s * 1.4, Math.max(0.8, s * 0.014)); },
  villa(g, I, s){                                                       // the stair down; the glass of the skylight he came through; the Padrino, painted; the photograph
    const X = 9 * s, Y = s;
    g.fillStyle = '#1a1412'; g.fillRect(X + s * 0.06, Y + s * 0.04, s * 0.88, s * 0.9);
    for(let k = 0; k < 5; k++){ const v = 120 - k * 24; g.fillStyle = `rgb(${v},${v - 10},${v - 18})`; g.fillRect(X + s * 0.1, Y + s * (0.08 + k * 0.17), s * 0.8, s * 0.13); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X + s * 0.1, Y + s * (0.19 + k * 0.17), s * 0.8, s * 0.03); }
    g.fillStyle = '#6a4a2a'; g.fillRect(8 * s + s * 0.74, Y, s * 0.24, s); g.fillRect(10 * s + s * 0.02, Y, s * 0.24, s);      // the cellar door, thrown open
    g.fillStyle = 'rgba(255,230,200,.18)'; g.fillRect(8 * s + s * 0.74, Y, Math.max(1, s * 0.02), s);
    [[9, 6, 1], [10, 7, 2], [8, 7, 3], [9, 8, 4]].forEach(([x, y, k])=>{        // the skylight's glass, all over the hall floor
      const q = R(x, y, 497 + k);
      for(let j = 0; j < 7; j++){
        const ox = x * s + s * (0.12 + q() * 0.76), oy = y * s + s * (0.12 + q() * 0.76), sz = s * (0.04 + q() * 0.09), a0 = q() * TAU, nv = 3 + Math.floor(q() * 3);
        const pts = []; for(let v = 0; v < nv; v++){ const a = a0 + v / nv * TAU + (q() - 0.5) * 0.8, rr1 = sz * (0.45 + q() * 0.7); pts.push([ox + Math.cos(a) * rr1, oy + Math.sin(a) * rr1 * 0.7]); }
        poly(g, pts.map(([a, b])=> [a + s * 0.012, b + s * 0.016]), 'rgba(20,20,30,.22)');
        poly(g, pts, 'rgba(200,228,245,.62)');
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(0.6, s * 0.008); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.stroke();
        if(j % 3 === 0){ const gx = pts[0][0], gy = pts[0][1], gl = s * 0.05; line(g, gx - gl, gy, gx + gl, gy, 'rgba(255,255,255,.9)', Math.max(0.6, s * 0.007)); line(g, gx, gy - gl, gx, gy + gl, 'rgba(255,255,255,.9)', Math.max(0.6, s * 0.007)); }
      }
    });
    g.strokeStyle = 'rgba(80,80,90,.5)'; g.lineWidth = Math.max(0.8, s * 0.012); g.beginPath(); g.moveTo(9 * s + s * 0.3, 7 * s + s * 0.4); g.lineTo(9 * s + s * 0.55, 7 * s + s * 0.48); g.lineTo(9 * s + s * 0.42, 7 * s + s * 0.62); g.stroke();   // a twist of the skylight's lead
    [[2, 6], [13, 6], [16, 6]].forEach(([x, y])=>{                       // portraits of the Padrino
      const PX = x * s, PY = y * s;
      /* (hung above the dresser under it: its frame clear of the dresser's top) */
      g.save(); g.translate(PX + s * 0.5, PY + s * 0.04); g.scale(0.62, 0.62); g.translate(-(PX + s * 0.5), -(PY + s * 0.09));
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(PX + s * 0.22, PY + s * 0.12, s * 0.6, s * 0.64);
      g.fillStyle = '#c9a24a'; g.fillRect(PX + s * 0.19, PY + s * 0.09, s * 0.62, s * 0.66); g.fillStyle = '#e8c86a'; g.fillRect(PX + s * 0.19, PY + s * 0.09, s * 0.62, Math.max(1, s * 0.02));
      g.fillStyle = '#a8802e'; g.fillRect(PX + s * 0.19, PY + s * 0.73, s * 0.62, Math.max(1, s * 0.02));
      g.fillStyle = lin(g, 0, PY + s * 0.14, 0, PY + s * 0.7, [[0, '#4a3030'], [1, '#2a1a1a']]); g.fillRect(PX + s * 0.25, PY + s * 0.15, s * 0.5, s * 0.54);
      circ(g, PX + s * 0.5, PY + s * 0.33, s * 0.08, '#c8a888'); g.fillStyle = '#d8d8d8'; g.fillRect(PX + s * 0.42, PY + s * 0.25, s * 0.16, s * 0.04);
      g.fillStyle = '#1a1a1a'; g.beginPath(); g.moveTo(PX + s * 0.3, PY + s * 0.69); g.quadraticCurveTo(PX + s * 0.5, PY + s * 0.36, PX + s * 0.7, PY + s * 0.69); g.closePath(); g.fill();
      g.fillStyle = '#f4efe2'; g.beginPath(); g.moveTo(PX + s * 0.46, PY + s * 0.44); g.lineTo(PX + s * 0.54, PY + s * 0.44); g.lineTo(PX + s * 0.5, PY + s * 0.52); g.closePath(); g.fill();
      g.fillStyle = '#c82a2a'; g.fillRect(PX + s * 0.48, PY + s * 0.46, s * 0.04, s * 0.1);
      g.restore();
    });
    g.fillStyle = '#c9b590'; g.fillRect(3 * s + s * 0.3, 7 * s + s * 0.02, s * 0.36, s * 0.28);   // the photograph, on the mantel
    g.strokeStyle = '#7a5a32'; g.lineWidth = Math.max(1, s * 0.03); g.strokeRect(3 * s + s * 0.3, 7 * s + s * 0.02, s * 0.36, s * 0.28);
    circ(g, 3 * s + s * 0.42, 7 * s + s * 0.13, s * 0.04, '#6a5440'); circ(g, 3 * s + s * 0.55, 7 * s + s * 0.15, s * 0.035, '#6a5440');
  },
};
/* the lamplight: warm in the middle of the room, dimmer in its corners — one wash over the whole room, so its pieces
   meet without a seam */
function rmLight(g, I, s, R0){
  const cx = I.W * s / 2, cy = I.H * s * 0.45, r = Math.max(I.W, I.H) * s * 0.66;
  g.fillStyle = rad(g, cx, cy, s * 0.3, r, [[0, 'rgba(255,214,150,.14)'], [0.6, 'rgba(255,200,140,0)'], [1, 'rgba(26,16,30,.32)']]);
  g.fillRect((R0.x0 - 1) * s, (R0.y0 - 1) * s, (R0.x1 - R0.x0 + 3) * s, (R0.y1 - R0.y0 + 3) * s);
}
function rmGround(g, d, s, R0){
  const I = rmInfo(d);
  const xs = Math.max(-1, R0.x0), xe = Math.min(I.W, R0.x1), ys = Math.max(-1, R0.y0), ye = Math.min(I.H, R0.y1);
  g.fillStyle = I.L.wall; g.fillRect((R0.x0 - 1) * s, (R0.y0 - 1) * s, (R0.x1 - R0.x0 + 3) * s, (R0.y1 - R0.y0 + 3) * s);
  rmFloors(g, I, s, R0);
  /* rugs, each whole */
  const seenRun = new Set();
  I.runs.forEach(run=>{ if(run.c !== ',' || seenRun.has(run)) return; seenRun.add(run); if(run.x1 < xs - 1 || run.x0 > xe + 1 || run.y1 < ys - 1 || run.y0 > ye + 1) return; rmRug(g, I, s, run); });
  for(let y = ys; y <= ye; y++) for(let x = xs; x <= xe; x++) if(I.open(x, y)) rmFloorShade(g, I, s, x, y);
  I.doors.forEach(dd=>{ if(dd.y === I.H - 1 && dd.x >= xs - 1 && dd.x <= xe + 1 && dd.y - 1 >= ys - 1 && dd.y - 1 <= ye + 1) rmMat(g, I, s, dd); });
  I.doors.forEach(dd=>{ if(dd.y === I.H - 1 && dd.x + dd.w >= xs - 1 && dd.x <= xe + 1 && dd.y >= ys - 1 && dd.y <= ye + 1) rmThreshold(g, I, s, dd); });
  /* the walls, their windows and pictures */
  for(let y = ys; y <= ye; y++) for(let x = xs; x <= xe; x++) if(!I.open(x, y)) rmWall(g, I, s, x, y);
  (I.L.windows || []).forEach(([x, y])=>{ if(x >= xs - 1 && x <= xe + 1 && y >= ys - 1 && y <= ye + 1) rmWindow(g, I, s, x, y); });
  (I.L.frames || []).forEach(([x, y, k])=>{ if(x >= xs - 1 && x <= xe + 1 && y >= ys - 1 && y <= ye + 1) rmFrame(g, I, s, x, y, k); });
  /* what stands in the room, back to front: each thing whole, the long ones at their first square */
  const items = [];
  for(let y = ys - 1; y <= ye + 1; y++) for(let x = xs - 1; x <= xe + 1; x++){
    const c = I.at(x, y);
    if(c === '#' || c === '.' || c === ',' || c === '_') continue;
    items.push({ x, y, c });
  }
  I.runs.forEach(run=>{                                                  // the long ones whose first square lies further off
    if(!'tDRH'.includes(run.c) || seenRun.has(run)) return;
    seenRun.add(run);
    if(run.x1 < xs - 1 || run.x0 > xe + 1 || run.y1 < ys - 1 || run.y0 > ye + 1) return;
    if(run.x0 < xs - 1 || run.x0 > xe + 1 || run.y0 < ys - 1 || run.y0 > ye + 1) items.push({ x:run.x0, y:run.y0, c:run.c });
  });
  items.sort((a, b)=> a.y - b.y || a.x - b.x);
  items.forEach(({ x, y, c })=>{
    switch(c){
      case 'S': rmShelf(g, I, s, x, y); break;
      case 'K': rmCounter(g, I, s, x, y); break;
      case 'F': rmStove(g, I, s, x, y); break;
      case 'D': rmDesk(g, I, s, x, y); break;
      case 'R': rmBed(g, I, s, x, y); break;
      case 'H': rmPiano(g, I, s, x, y); break;
      case 'P': rmPlant(g, I, s, x, y); break;
      case 'A': rmArmchair(g, I, s, x, y); break;
      case 'C': rmChair(g, I, s, x, y); break;
      case 't': rmTable(g, I, s, x, y); break;
      case 'c': rmCrate(g, I, s, x, y); break;
      case 'b': rmBarrel(g, I, s, x, y); break;
      case 'o': rmStatue(g, I, s, x, y); break;
      case 'Z': rmSeats(g, I, s, x, y); break;
      case 'J': rmBars(g, I, s, x, y); break;
      case 'N': rmNets(g, I, s, x, y); break;
      case 'V': rmBarberChair(g, I, s, x, y); break;
      case 'L': rmBench(g, I, s, x, y); break;
    }
  });
  for(let y = ys; y <= ye; y++) for(let x = xs; x <= xe; x++) if(I.at(x, y) === '_' && I.at(x, y + 1) !== '_' && I.at(x, y + 1) !== '#') rmStageLip(g, I, s, x, y);
  if(RM_DECOR[d.key]) RM_DECOR[d.key](g, I, s);
  rmLight(g, I, s, R0);
}
/* ---------- what moves: a hearth's fire, the villa's candles, the soup's steam, the coffee's, the Family's crates humming ---------- */
function rmAnim(ctx, d, k, ox, oy, V, now){
  const I = rmInfo(d), t = now / 1000;
  for(let y = V.y0; y <= V.y1; y++) for(let x = V.x0; x <= V.x1; x++){
    const c = I.at(x, y);
    if(c === 'F'){
      if(!rmFireAt(I, x, y) || rmFireAt(I, x - 1, y)) continue;
      let n = 1; while(rmFireAt(I, x + n, y)) n++;
      const cx = ox + (x + n / 2) * k, by = oy + (y + 0.86) * k;
      for(let j = 0; j < 1 + 2 * n; j++){ const f = (j - n) / (n + 0.6); cFlame(ctx, cx + f * k * 0.22 * n, by, k * (0.13 - Math.abs(f) * 0.04), t + j * 0.43, x * 1.3 + j); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rad(ctx, cx, by - k * 0.2, 0, k * 1.6, [[0, `rgba(255,160,70,${(0.1 + 0.05 * Math.sin(t * 3 + x)).toFixed(3)})`], [1, 'rgba(255,160,70,0)']]); ctx.fillRect(cx - k * 1.6, by - k * 1.8, k * 3.2, k * 3.2);
      ctx.restore();
    }
    if(c === 't' && I.lookAt(x, y).cloth === 'white' && x % 2 === 0){
      const run = I.runs.get(x + ',' + y);
      if(!run || y < run.y0 || y > run.y1) continue;
      const cx = ox + (x + 0.84) * k, cy = oy + (y + 0.26) * k;
      if(cy < oy + (run.y0 * k + k * 0.14) || cy > oy + ((run.y1 + 1) * k - k * 0.2)) continue;
      cFlame(ctx, cx, cy - k * 0.0, k * 0.035, t, x + y);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(ctx, cx, cy - k * 0.04, 0, k * 0.5, [[0, 'rgba(255,220,140,.2)'], [1, 'rgba(255,220,140,0)']]); ctx.fillRect(cx - k * 0.5, cy - k * 0.55, k, k); ctx.restore();
    }
  }
  const steam = (cx, cy, h, seed)=>{
    for(let j = 0; j < 2; j++){
      const ph = ((t * 0.5 + j * 0.5 + seed) % 1), a = 0.5 * (1 - ph);
      ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`; ctx.lineWidth = Math.max(1, k * 0.02);
      const y0 = cy - ph * h, sw = Math.sin(t * 2 + j * 2 + seed) * k * 0.05;
      ctx.beginPath(); ctx.moveTo(cx + sw, y0); ctx.bezierCurveTo(cx - k * 0.06 + sw, y0 - h * 0.15, cx + k * 0.06 + sw, y0 - h * 0.3, cx + sw * 0.5, y0 - h * 0.45); ctx.stroke();
    }
  };
  if(d.key === 'room_marta') steam(ox + 3.5 * k, oy + 1.15 * k, k * 0.8, 0.2);
  if(d.key === 'room_cafe') steam(ox + 9 * k, oy + 1.45 * k, k * 0.6, 0.7);
  if(d.key === 'room_warehouse') [[1, 1], [10, 2], [5, 6]].forEach(([x, y], i)=>{
    const p = 0.5 + 0.5 * Math.sin(t * 2 + i * 2.1), cx = ox + (x + 0.5) * k, cy = oy + (y + 0.5) * k;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(ctx, cx, cy, k * 0.05, k * 0.75, [[0, `rgba(180,110,255,${(0.18 + p * 0.22).toFixed(3)})`], [1, 'rgba(180,110,255,0)']]); ctx.fillRect(cx - k * 0.8, cy - k * 0.8, k * 1.6, k * 1.6); ctx.restore();
  });
}
/* ---------- what stands up over the square behind it ---------- */
function rmTall(d){
  const I = rmInfo(d);
  if(I.tall) return I.tall;
  const list = [];
  for(let y = 0; y < I.H; y++) for(let x = 0; x < I.W; x++){
    const c = I.at(x, y);
    if(!I.open(x, y - 1) || I.at(x, y - 1) === c) continue;            // against a wall (or the rest of itself): nobody stands behind it
    if(c === 'P' && I.lookAt(x, y).plant !== 'basket') list.push({ x, y, w:1, up:RM_UP, draw:(g, dd, s)=> rmPlant(g, rmInfo(dd), s, x, y) });
    if(c === 'o') list.push({ x, y, w:1, up:RM_UP, draw:(g, dd, s)=> rmStatue(g, rmInfo(dd), s, x, y) });
    if(c === 'S') list.push({ x, y, w:1, up:RM_UP, draw:(g, dd, s)=> rmShelf(g, rmInfo(dd), s, x, y) });
    if(c === 'J') list.push({ x, y, w:1, up:RM_UP, draw:(g, dd, s)=> rmBars(g, rmInfo(dd), s, x, y) });
  }
  return (I.tall = list);
}
PAINTERS.room = {
  handles:(d)=> !!d.house && typeof R5_ROOM_LOOKS !== 'undefined' && !!R5_ROOM_LOOKS[d.key],
  sig:(d)=> rmInfo(d).sig,
  ground:rmGround,
  anim:rmAnim,
  tall:rmTall,
  standable:(d, x, y)=> rmInfo(d).open(x, y),
  bg:'#1e1712',
};

/* ============================================================
   UGO'S, THE CHURCH AND THE TOWER (4.47)
   The rest of Region 5 indoors ("Those and the tower too"), drawn as the rooms are (4.46) from their own grids: Ugo's
   back room (paintTailor until now), the church (paintChurch) and the tower's thirteen floors (paintTower).
   ============================================================ */
const RM_MORE = {
  tailor: { floor:'planks', fa:'#7a5434', wall:'#5b4634', face:'#d6c29c', trim:'#7a5a3c', rug:'#7e2f2a', windows:[], frames:[] },
  church: { floor:'stone', fa:'#b8aa8e', wall:'#5e5446', face:'#cfc2a4', trim:'#8a7a60', stoneFace:true, windows:[], frames:[] },
};
/* a church's wall, its face of fitted stone: course on course of blocks running on from square to square, a moulding
   along its top, its plinth */
function rmStoneFace(g, I, s, x, y){
  const X = x * s, Y = y * s, base = I.L.face, oW = I.open(x - 1, y), oE = I.open(x + 1, y);
  g.fillStyle = sh(base, -0.5); g.fillRect(X, Y, s, s);
  const top = Y + s * 0.12, foot = Y + s * 0.88, rows = 4, rh = (foot - top) / rows;
  for(let r = 0; r < rows; r++){
    const off = ((y * rows + r) % 2) ? 0.25 : 0, yy = top + r * rh;
    for(let n = Math.floor((x + off) / 0.5) - 1; n * 0.5 - off < x + 1; n++){
      const bx0 = (n * 0.5 - off) * s, bx1 = bx0 + s * 0.5, l = Math.max(X, bx0 + 1), rt = Math.min(X + s, bx1 - 1);
      if(rt <= l) continue;
      const q = R(n, y * rows + r, 384);
      g.fillStyle = sh(base, (q() - 0.5) * 0.16 - r * 0.025); g.fillRect(l, yy + 1, rt - l, rh - 2);
      g.fillStyle = 'rgba(255,250,240,.14)'; g.fillRect(l, yy + 1, rt - l, Math.max(1, s * 0.01));
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(l, yy + rh - 1 - Math.max(1, s * 0.01), rt - l, Math.max(1, s * 0.01));
      if(s >= 20) for(let k = 0; k < 5; k++){ g.fillStyle = q() < 0.5 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.07)'; g.fillRect(bx0 + q() * s * 0.5, yy + q() * rh, Math.max(0.7, s * 0.01), Math.max(0.7, s * 0.01)); }
    }
  }
  g.fillStyle = sh(base, 0.1); g.fillRect(X, Y, s, top - Y);                                   // the moulding under the vault
  g.fillStyle = 'rgba(255,250,240,.25)'; g.fillRect(X, Y + s * 0.02, s, Math.max(1, s * 0.014));
  g.fillStyle = sh(base, -0.25); g.fillRect(X, top - s * 0.025, s, s * 0.025);
  g.fillStyle = sh(base, -0.3); g.fillRect(X, foot, s, Y + s - foot);                            // its plinth
  g.fillStyle = 'rgba(255,250,240,.15)'; g.fillRect(X, foot, s, Math.max(1, s * 0.012));
  if(oW){ g.fillStyle = lin(g, X, 0, X + s * 0.12, 0, [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X, Y, s * 0.12, s); }
  if(oE){ g.fillStyle = lin(g, X + s, 0, X + s * 0.88, 0, [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(X + s * 0.88, Y, s * 0.12, s); }
}
/* the long floors' first squares, and each thing whole */
function plItems(I, xs, xe, ys, ye, longs){
  const items = [], seen = new Set();
  for(let y = ys - 1; y <= ye + 1; y++) for(let x = xs - 1; x <= xe + 1; x++){
    const c = I.at(x, y);
    if(c === '#' || c === '.' || c === ',' || c === '_') continue;
    const run = I.runs.get(x + ',' + y);
    if(run && longs.includes(c)){ if(seen.has(run)) continue; seen.add(run); items.push({ x:run.x0, y:run.y0, c, run }); continue; }
    items.push({ x, y, c });
  }
  return items.sort((a, b)=> a.y - b.y || a.x - b.x);
}
function plBase(g, I, s, R0){
  const xs = Math.max(-1, R0.x0), xe = Math.min(I.W, R0.x1), ys = Math.max(-1, R0.y0), ye = Math.min(I.H, R0.y1);
  g.fillStyle = I.L.wall; g.fillRect((R0.x0 - 1) * s, (R0.y0 - 1) * s, (R0.x1 - R0.x0 + 3) * s, (R0.y1 - R0.y0 + 3) * s);
  rmFloors(g, I, s, R0);
  return { xs, xe, ys, ye };
}
function plWalls(g, I, s, V){
  for(let y = V.ys; y <= V.ye; y++) for(let x = V.xs; x <= V.xe; x++) if(I.open(x, y)) rmFloorShade(g, I, s, x, y);
  I.doors.forEach(dd=>{ if(dd.y === I.H - 1){ rmMat(g, I, s, dd); rmThreshold(g, I, s, dd); } });
  for(let y = V.ys; y <= V.ye; y++) for(let x = V.xs; x <= V.xe; x++) if(!I.open(x, y)) rmWall(g, I, s, x, y);
}

/* ---------- Ugo's: the Family's coats on their racks, the cutting table, the dummies, the bolts of cloth, the long mirror ---------- */
function tlRack(g, I, s, run){
  const X = run.x0 * s, W = run.w * s, Y = run.y0 * s, rail = Y - s * 0.18;
  g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(X + s * 0.08, Y + s * 0.84, W - s * 0.12, s * 0.1);
  [X + s * 0.06, X + W - s * 0.1].forEach(px=>{ g.fillStyle = '#3e2c1e'; g.fillRect(px, rail, s * 0.05, Y + s * 0.9 - rail); g.fillRect(px - s * 0.06, Y + s * 0.86, s * 0.17, s * 0.04); });
  g.fillStyle = lin(g, 0, rail - s * 0.02, 0, rail + s * 0.03, [[0, '#8a8a92'], [1, '#3a3a40']]); g.fillRect(X + s * 0.04, rail - s * 0.02, W - s * 0.08, s * 0.045);
  const n = run.w * 2;
  for(let k = 0; k < n; k++){
    const q = R(run.x0 * 2 + k, run.y0, 551), cx = X + s * 0.25 + k * (W - s * 0.5) / (n - 1), col = ['#20232c', '#2a2e3a', '#1c1c22', '#2e2a30'][Math.floor(q() * 4)];
    const sw = s * 0.21, top = rail + s * 0.06, hem = Y + s * (0.72 + q() * 0.06);
    g.strokeStyle = '#6a4a2a'; g.lineWidth = Math.max(1, s * 0.014); g.beginPath(); g.arc(cx, rail + s * 0.01, s * 0.03, Math.PI, 0); g.stroke();   // its hook
    g.fillStyle = '#7a5530'; g.beginPath(); g.moveTo(cx - sw, top + s * 0.03); g.quadraticCurveTo(cx, top - s * 0.04, cx + sw, top + s * 0.03); g.lineTo(cx + sw, top + s * 0.05); g.lineTo(cx - sw, top + s * 0.05); g.closePath(); g.fill();
    g.fillStyle = col; g.beginPath(); g.moveTo(cx - sw, top + s * 0.04); g.lineTo(cx + sw, top + s * 0.04); g.lineTo(cx + sw * 0.82, hem); g.lineTo(cx - sw * 0.82, hem); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(cx - sw * 0.9, top + s * 0.05, sw * 0.4, hem - top - s * 0.06);
    g.fillStyle = sh(col, -0.35); g.beginPath(); g.moveTo(cx - sw * 0.35, top + s * 0.04); g.lineTo(cx, top + s * 0.3); g.lineTo(cx + sw * 0.35, top + s * 0.04); g.closePath(); g.fill();   // the lapels
    g.fillStyle = '#efe8da'; g.beginPath(); g.moveTo(cx - sw * 0.14, top + s * 0.05); g.lineTo(cx, top + s * 0.2); g.lineTo(cx + sw * 0.14, top + s * 0.05); g.closePath(); g.fill();   // the shirt
    g.fillStyle = '#9a2a2a'; g.fillRect(cx - sw * 0.86, top + s * 0.4, sw * 1.72, s * 0.07);                                // the red sash
    g.fillStyle = 'rgba(255,200,190,.25)'; g.fillRect(cx - sw * 0.86, top + s * 0.4, sw * 1.72, Math.max(1, s * 0.012));
    for(let b = 0; b < 2; b++) circ(g, cx + s * 0.02, top + s * (0.52 + b * 0.09), Math.max(0.8, s * 0.014), '#8a8a92');
  }
}
function tlTable(g, I, s, run){
  const X = run.x0 * s, Y = run.y0 * s, W = run.w * s, H = run.h * s, q = R(run.x0, run.y0, 561);
  const l = X + s * 0.06, r = X + W - s * 0.06, top = Y + s * 0.1, bot = Y + H - s * 0.18;
  g.fillStyle = 'rgba(20,12,6,.32)'; g.fillRect(l + s * 0.06, bot + s * 0.04, r - l, s * 0.12);
  g.fillStyle = '#4a3220'; [[l + s * 0.04, bot], [r - s * 0.1, bot]].forEach(([a, b])=> g.fillRect(a, b - s * 0.02, s * 0.06, s * 0.16));
  g.fillStyle = '#8a6438'; g.fillRect(l, bot - s * 0.02, r - l, s * 0.08);
  g.fillStyle = lin(g, 0, top, 0, bot, [[0, '#d0aa72'], [1, '#b88e58']]); g.fillRect(l, top, r - l, bot - top);
  g.strokeStyle = 'rgba(90,60,30,.18)'; g.lineWidth = Math.max(0.6, s * 0.006);
  for(let k = 1; k < run.h * 4; k++){ const yy = top + (bot - top) * k / (run.h * 4); g.beginPath(); g.moveTo(l, yy); g.lineTo(r, yy); g.stroke(); }
  /* a coat being cut: the cloth, the chalk of its pattern */
  const cl = l + s * 0.3, ct = top + s * 0.18, cw = s * 2.1, ch = bot - top - s * 0.36;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(cl + s * 0.03, ct + s * 0.03, cw, ch);
  g.fillStyle = '#272b36'; g.fillRect(cl, ct, cw, ch);
  g.strokeStyle = 'rgba(244,239,224,.85)'; g.lineWidth = Math.max(0.8, s * 0.012); g.setLineDash([s * 0.05, s * 0.035]);
  g.beginPath(); g.moveTo(cl + cw * 0.12, ct + ch * 0.15); g.lineTo(cl + cw * 0.42, ct + ch * 0.1); g.quadraticCurveTo(cl + cw * 0.47, ct + ch * 0.32, cl + cw * 0.4, ct + ch * 0.5); g.lineTo(cl + cw * 0.44, ct + ch * 0.88); g.lineTo(cl + cw * 0.1, ct + ch * 0.9); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(cl + cw * 0.58, ct + ch * 0.12); g.lineTo(cl + cw * 0.86, ct + ch * 0.18); g.lineTo(cl + cw * 0.9, ct + ch * 0.85); g.lineTo(cl + cw * 0.6, ct + ch * 0.86); g.quadraticCurveTo(cl + cw * 0.54, ct + ch * 0.45, cl + cw * 0.58, ct + ch * 0.12); g.stroke();
  g.setLineDash([]);
  g.fillStyle = '#f4efe2'; g.save(); g.translate(cl + cw * 0.46, ct + ch * 0.62); g.rotate(-0.4); g.fillRect(-s * 0.06, -s * 0.02, s * 0.12, s * 0.04); g.restore();   // the chalk
  /* a paper pattern, pinned */
  g.save(); g.translate(r - s * 0.75, top + s * 0.42); g.rotate(0.12);
  g.fillStyle = '#e8d8b4'; g.beginPath(); g.moveTo(-s * 0.3, -s * 0.28); g.lineTo(s * 0.26, -s * 0.3); g.lineTo(s * 0.32, s * 0.28); g.lineTo(-s * 0.22, s * 0.32); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,90,50,.6)'; g.lineWidth = Math.max(0.6, s * 0.007); for(let k = 0; k < 3; k++){ g.beginPath(); g.moveTo(-s * 0.2, -s * 0.15 + k * s * 0.13); g.lineTo(s * 0.2, -s * 0.16 + k * s * 0.13); g.stroke(); }
  [[-s * 0.25, -s * 0.24], [s * 0.24, -s * 0.24], [s * 0.26, s * 0.24]].forEach(([a, b])=>{ circ(g, a, b, Math.max(0.8, s * 0.016), '#c83a3a'); });
  g.restore();
  /* the shears */
  g.save(); g.translate(r - s * 0.45, bot - s * 0.42); g.rotate(-0.6);
  g.strokeStyle = '#2a2a2e'; g.lineWidth = Math.max(1, s * 0.022); g.beginPath(); g.ellipse(-s * 0.2, -s * 0.05, s * 0.07, s * 0.045, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(-s * 0.2, s * 0.06, s * 0.07, s * 0.045, 0, 0, TAU); g.stroke();
  g.fillStyle = lin(g, 0, -s * 0.03, 0, s * 0.03, [[0, '#e0e0e8'], [1, '#8a8a92']]); g.beginPath(); g.moveTo(-s * 0.12, -s * 0.03); g.lineTo(s * 0.3, -s * 0.005); g.lineTo(-s * 0.12, s * 0.03); g.closePath(); g.fill();
  circ(g, -s * 0.11, 0, Math.max(0.8, s * 0.015), '#c9a24a');
  g.restore();
  /* the tape measure, curling; the pincushion; spools */
  g.strokeStyle = '#e6c84a'; g.lineWidth = Math.max(1, s * 0.035); g.beginPath(); g.moveTo(l + s * 0.12, bot - s * 0.12); g.bezierCurveTo(l + s * 0.6, bot - s * 0.02, l + s * 0.2, top + s * 0.4, l + s * 0.18, top + s * 0.2); g.stroke();
  g.strokeStyle = 'rgba(60,40,10,.6)'; g.lineWidth = Math.max(0.5, s * 0.005); g.setLineDash([Math.max(1, s * 0.01), Math.max(1, s * 0.03)]); g.beginPath(); g.moveTo(l + s * 0.12, bot - s * 0.12); g.bezierCurveTo(l + s * 0.6, bot - s * 0.02, l + s * 0.2, top + s * 0.4, l + s * 0.18, top + s * 0.2); g.stroke(); g.setLineDash([]);
  const px = r - s * 0.25, py = top + s * 0.2;
  circ(g, px, py, s * 0.09, '#c8402a'); circ(g, px - s * 0.03, py - s * 0.03, s * 0.03, 'rgba(255,255,255,.3)'); ell(g, px, py - s * 0.08, s * 0.03, s * 0.015, '#4a8a3a');
  for(let k = 0; k < 6; k++){ const a = q() * TAU; line(g, px + Math.cos(a) * s * 0.05, py + Math.sin(a) * s * 0.05, px + Math.cos(a) * s * 0.11, py + Math.sin(a) * s * 0.11, '#c8c8d0', Math.max(0.5, s * 0.006)); circ(g, px + Math.cos(a) * s * 0.11, py + Math.sin(a) * s * 0.11, Math.max(0.6, s * 0.01), ['#e8e0d0', '#3a6aa8', '#e8c040'][k % 3]); }
  [['#c8302a', 0], ['#2a4a8a', 1], ['#e8d8b0', 2]].forEach(([c, k])=>{ const sx = l + s * (0.25 + k * 0.16), sy = top + s * 0.12; g.fillStyle = '#c8a878'; g.fillRect(sx - s * 0.05, sy - s * 0.01, s * 0.1, s * 0.02); g.fillStyle = c; g.fillRect(sx - s * 0.04, sy, s * 0.08, s * 0.08); g.fillStyle = '#c8a878'; g.fillRect(sx - s * 0.05, sy + s * 0.08, s * 0.1, s * 0.02); });
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(l, top, r - l, Math.max(1, s * 0.014));
}
/* a dummy on its stand: a coat half made on it, the tape round its neck, pins */
function tlDummy(g, I, s, x, y){
  const X = x * s, Y = y * s, cx = X + s / 2, q = R(x, y, 571), top = Y - RM_UP * s;
  ell(g, cx + s * 0.05, Y + s * 0.88, s * 0.26, s * 0.06, 'rgba(20,12,6,.32)');
  g.strokeStyle = '#4a3220'; g.lineWidth = Math.max(1, s * 0.03);
  [[-1, 0.86], [1, 0.86], [0, 0.9]].forEach(([d, f])=> line(g, cx, Y + s * 0.66, cx + d * s * 0.2, Y + s * f, '#4a3220', Math.max(1, s * 0.03)));
  g.fillStyle = '#5a3c24'; g.fillRect(cx - s * 0.025, Y + s * 0.3, s * 0.05, s * 0.4);
  const half = q() < 0.5, body = half ? '#272b36' : '#d8c8a6';
  g.fillStyle = lin(g, cx - s * 0.24, 0, cx + s * 0.24, 0, [[0, sh(body, -0.2)], [0.35, sh(body, 0.15)], [1, sh(body, -0.35)]]);
  g.beginPath(); g.moveTo(cx - s * 0.22, top + s * 0.28); g.quadraticCurveTo(cx - s * 0.26, top + s * 0.6, cx - s * 0.17, Y + s * 0.34); g.lineTo(cx + s * 0.17, Y + s * 0.34); g.quadraticCurveTo(cx + s * 0.26, top + s * 0.6, cx + s * 0.22, top + s * 0.28); g.quadraticCurveTo(cx, top + s * 0.18, cx - s * 0.22, top + s * 0.28); g.closePath(); g.fill();
  if(half){ g.fillStyle = '#d8c8a6'; g.beginPath(); g.moveTo(cx - s * 0.02, top + s * 0.22); g.lineTo(cx + s * 0.2, top + s * 0.3); g.quadraticCurveTo(cx + s * 0.23, top + s * 0.62, cx + s * 0.16, Y + s * 0.34); g.lineTo(cx - s * 0.02, Y + s * 0.34); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(244,239,224,.9)'; g.lineWidth = Math.max(0.6, s * 0.008); g.setLineDash([s * 0.02, s * 0.02]); g.beginPath(); g.moveTo(cx - s * 0.02, top + s * 0.24); g.lineTo(cx - s * 0.02, Y + s * 0.32); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#9a2a2a'; g.fillRect(cx - s * 0.19, top + s * 0.7, s * 0.17, s * 0.05); }
  else { g.strokeStyle = 'rgba(90,70,40,.4)'; g.lineWidth = Math.max(0.6, s * 0.006); g.beginPath(); g.moveTo(cx, top + s * 0.22); g.lineTo(cx, Y + s * 0.32); g.stroke(); }
  g.fillStyle = '#5a3c24'; g.fillRect(cx - s * 0.03, top + s * 0.08, s * 0.06, s * 0.14); ell(g, cx, top + s * 0.08, s * 0.05, s * 0.025, '#8a6440');   // its neck, its knob
  g.strokeStyle = '#e6c84a'; g.lineWidth = Math.max(1, s * 0.025); g.beginPath(); g.moveTo(cx - s * 0.07, top + s * 0.2); g.quadraticCurveTo(cx - s * 0.1, top + s * 0.45, cx - s * 0.06, top + s * 0.6); g.moveTo(cx + s * 0.07, top + s * 0.2); g.quadraticCurveTo(cx + s * 0.11, top + s * 0.4, cx + s * 0.08, top + s * 0.52); g.stroke();
  for(let k = 0; k < 4; k++) circ(g, cx - s * 0.12 + q() * s * 0.24, top + s * (0.35 + q() * 0.4), Math.max(0.7, s * 0.012), ['#c83a3a', '#e8e0d0'][k % 2]);
}
/* bolts of cloth, stacked on their table: each rolled, its end showing the roll */
function tlBolts(g, I, s, run){
  const X = run.x0 * s, Y = run.y0 * s, W = run.w * s, H = run.h * s;
  const l = X + s * 0.06, r = X + W - s * 0.06, top = Y + s * 0.1, bot = Y + H - s * 0.14;
  g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(l + s * 0.06, bot + s * 0.02, r - l, s * 0.1);
  g.fillStyle = '#6a4a2c'; g.fillRect(l, bot - s * 0.06, r - l, s * 0.1); g.fillStyle = '#8a6438'; g.fillRect(l, top, r - l, bot - top - s * 0.06);
  const hues = ['#7a2a2a', '#2e3b5a', '#5a6a3a', '#8a7a4a', '#4a4a52', '#6a3a5a', '#2a2e3a'];
  const rows = run.h * 3;
  for(let k = 0; k < rows; k++){
    const by = top + s * 0.04 + k * (bot - top - s * 0.14) / rows, bh = (bot - top - s * 0.14) / rows - s * 0.03;
    for(let j = 0; j < 2; j++){
      const q = R(run.x0 + j, k, 581), col = hues[Math.floor(q() * hues.length)], bl = l + s * 0.06 + j * (r - l - s * 0.12) / 2, bw = (r - l - s * 0.12) / 2 - s * 0.05;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(bl + s * 0.02, by + s * 0.02, bw, bh);
      g.fillStyle = lin(g, 0, by, 0, by + bh, [[0, sh(col, 0.15)], [0.5, col], [1, sh(col, -0.3)]]); g.fillRect(bl, by, bw, bh);
      if(q() < 0.35){ g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = Math.max(0.6, s * 0.006); for(let t = bl + s * 0.06; t < bl + bw; t += s * 0.06){ g.beginPath(); g.moveTo(t, by); g.lineTo(t, by + bh); g.stroke(); } }
      ell(g, bl, by + bh / 2, bh * 0.22, bh / 2, sh(col, -0.15));
      g.strokeStyle = sh(col, 0.25); g.lineWidth = Math.max(0.6, s * 0.006); for(let t = 1; t < 3; t++){ g.beginPath(); g.ellipse(bl, by + bh / 2, bh * 0.22 * t / 3, bh / 2 * t / 3, 0, 0, TAU); g.stroke(); }
    }
  }
}
function tlDecor(g, I, s, d){
  const mt = (d.things || []).find(t=> t.verb === 'Mirror');
  if(mt){                                                               // the long mirror, gilt, from the wall to the floor
    const X = mt.x * s, Y = (mt.y - 1) * s, l = X + s * 0.2, r = X + s * 0.8, t = Y + s * 0.08, b = Y + s * 1.06;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(l + s * 0.03, t + s * 0.04, r - l, b - t);
    g.fillStyle = '#b8913e'; rr(g, l, t, r - l, b - t, s * 0.06); g.fill();
    g.fillStyle = '#e3c475'; g.fillRect(l + s * 0.02, t + s * 0.02, r - l - s * 0.04, Math.max(1, s * 0.02));
    g.fillStyle = lin(g, l, t, r, b, [[0, '#cfe0e6'], [0.45, '#8aa4b0'], [1, '#5a7480']]); rr(g, l + s * 0.06, t + s * 0.06, r - l - s * 0.12, b - t - s * 0.12, s * 0.04); g.fill();
    g.fillStyle = 'rgba(70,50,30,.35)'; g.fillRect(l + s * 0.06, b - s * 0.36, r - l - s * 0.12, s * 0.3);   // the room in it
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(l + s * 0.1, t + s * 0.1); g.lineTo(l + s * 0.2, t + s * 0.1); g.lineTo(l + s * 0.1, t + s * 0.45); g.closePath(); g.fill();
    circ(g, (l + r) / 2, t, s * 0.05, '#e3c475');
  }
  /* beside it: his board of threads, and patterns pinned up */
  const sx = 5 * s, sy = 0;
  if(I.at(5, 0) === '#' && I.open(5, 1)){
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(sx + s * 0.16, sy + s * 0.14, s * 0.7, s * 0.5);
    g.fillStyle = '#8a6438'; g.fillRect(sx + s * 0.14, sy + s * 0.12, s * 0.7, s * 0.5);
    const cols = ['#c8302a', '#2a4a8a', '#e8d8b0', '#3a7a4a', '#e8b840', '#6a3a7a', '#1e1e24', '#d87a9a', '#7a5a3a'];
    for(let k = 0; k < 9; k++){ const tx = sx + s * (0.24 + (k % 3) * 0.24), ty = sy + s * (0.2 + Math.floor(k / 3) * 0.14); g.fillStyle = '#c8a878'; g.fillRect(tx - s * 0.05, ty - s * 0.008, s * 0.1, s * 0.016); g.fillStyle = cols[k]; g.fillRect(tx - s * 0.04, ty, s * 0.08, s * 0.08); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(tx - s * 0.035, ty + s * 0.005, s * 0.015, s * 0.07); }
  }
  if(I.at(7, 0) === '#' && I.open(7, 1)){
    const px = 7 * s;
    [[0.18, 0.12, -0.08], [0.48, 0.18, 0.1]].forEach(([a, b, rot], k)=>{ g.save(); g.translate(px + s * (a + 0.16), s * (b + 0.22)); g.rotate(rot);
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-s * 0.15, -s * 0.2, s * 0.32, s * 0.42); g.fillStyle = '#e8d8b4'; g.fillRect(-s * 0.17, -s * 0.22, s * 0.32, s * 0.42);
      g.strokeStyle = 'rgba(120,90,50,.7)'; g.lineWidth = Math.max(0.6, s * 0.007); g.setLineDash([s * 0.02, s * 0.015]); g.beginPath(); if(k){ g.moveTo(-s * 0.1, -s * 0.15); g.lineTo(s * 0.08, -s * 0.12); g.lineTo(s * 0.1, s * 0.14); g.lineTo(-s * 0.08, s * 0.15); g.closePath(); } else { g.arc(-s * 0.01, 0, s * 0.11, 0, TAU); } g.stroke(); g.setLineDash([]);
      circ(g, -s * 0.01, -s * 0.2, Math.max(0.8, s * 0.016), '#c83a3a'); g.restore(); });
  }
}
function tlGround(g, d, s, R0){
  const I = rmInfo(d), V = plBase(g, I, s, R0);
  rmRug(g, I, s, { c:',', x0:5, y0:6, x1:8, y1:8, w:4, h:3 });
  plWalls(g, I, s, V);
  plItems(I, V.xs, V.xe, V.ys, V.ye, 'tck').forEach(({ x, y, c, run })=>{
    if(c === 'k') tlRack(g, I, s, run);
    else if(c === 't') tlTable(g, I, s, run);
    else if(c === 'c') tlBolts(g, I, s, run);
    else if(c === 'o') tlDummy(g, I, s, x, y);
  });
  tlDecor(g, I, s, d);
  rmLight(g, I, s, R0);
}

/* ---------- the church: its flags, the aisle's runner, the pews, the pillars, the altar, the candles, its glass ---------- */
const CH_GLASS = ['#7a5ab0', '#3f78b8', '#b8584a', '#c8a040', '#4a9a7a'];
function chPew(g, I, s, run){
  const X = run.x0 * s + s * 0.04, W = run.w * s - s * 0.08, Y = run.y0 * s, wood = '#76502f';
  g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(X + s * 0.06, Y + s * 0.84, W, s * 0.14);
  g.fillStyle = sh(wood, 0.14); g.fillRect(X + s * 0.06, Y + s * 0.04, W - s * 0.12, s * 0.3);                              // the seat
  g.fillStyle = 'rgba(255,240,215,.16)'; g.fillRect(X + s * 0.06, Y + s * 0.04, W - s * 0.12, Math.max(1, s * 0.012));
  g.strokeStyle = 'rgba(40,20,8,.18)'; g.lineWidth = Math.max(0.6, s * 0.006); for(let k = 1; k < 3; k++){ g.beginPath(); g.moveTo(X + s * 0.06, Y + s * (0.04 + k * 0.1)); g.lineTo(X + W - s * 0.06, Y + s * (0.04 + k * 0.1)); g.stroke(); }
  const bt = Y + s * 0.3, bb = Y + s * 0.86;
  g.fillStyle = lin(g, 0, bt, 0, bb, [[0, sh(wood, -0.02)], [1, sh(wood, -0.32)]]); g.fillRect(X + s * 0.06, bt, W - s * 0.12, bb - bt);   // its back, towards you
  const n = run.w * 2, iw = W - s * 0.24;
  for(let k = 0; k < n; k++){ const px = X + s * 0.12 + k * iw / n + s * 0.02, pw = iw / n - s * 0.04; g.strokeStyle = sh(wood, -0.45); g.lineWidth = Math.max(0.8, s * 0.012); g.strokeRect(px, bt + s * 0.16, pw, bb - bt - s * 0.24); g.fillStyle = 'rgba(255,240,215,.07)'; g.fillRect(px, bt + s * 0.16, pw, Math.max(1, s * 0.01)); }
  g.fillStyle = sh(wood, 0.22); g.fillRect(X + s * 0.04, bt - s * 0.03, W - s * 0.08, s * 0.06);                              // its top rail
  g.fillStyle = 'rgba(255,240,215,.32)'; g.fillRect(X + s * 0.04, bt - s * 0.03, W - s * 0.08, Math.max(1, s * 0.012));
  g.fillStyle = sh(wood, -0.12); g.fillRect(X + s * 0.1, bt + s * 0.08, W - s * 0.2, s * 0.04);                               // the ledge for the books
  for(let k = 0; k < run.w; k++){ const q = R(run.x0 + k, run.y0, 591); if(q() < 0.7){ const bx = X + s * (0.25 + k + q() * 0.4); g.fillStyle = q() < 0.5 ? '#5a1e22' : '#2a3a5a'; g.fillRect(bx, bt + s * 0.01, s * 0.13, s * 0.08); g.fillStyle = 'rgba(230,200,120,.6)'; g.fillRect(bx, bt + s * 0.01, s * 0.13, Math.max(0.6, s * 0.008)); } }
  [X, X + W - s * 0.1].forEach(ex=>{                                                                                          // its ends, carved
    g.fillStyle = sh(wood, -0.18); rr(g, ex, Y + s * 0.02, s * 0.1, s * 0.86, s * 0.05); g.fill();
    ell(g, ex + s * 0.05, Y + s * 0.06, s * 0.07, s * 0.05, sh(wood, 0.12)); circ(g, ex + s * 0.05, Y + s * 0.06, s * 0.025, sh(wood, -0.3));
    g.fillStyle = 'rgba(255,240,215,.16)'; g.fillRect(ex, Y + s * 0.1, Math.max(1, s * 0.012), s * 0.74);
  });
}
const CH_UP = 0.78;
function chPillar(g, I, s, x, y){
  const X = x * s, Y = y * s, cx = X + s / 2, r = s * 0.22, foot = Y + s * 0.9, q = R(x, y, 601), base = '#d8ccb4';
  g.fillStyle = 'rgba(20,12,6,.32)'; g.beginPath(); g.moveTo(cx - r * 1.3, foot); g.lineTo(cx + r * 1.3, foot); g.lineTo(cx + r * 1.3 + s * 0.3, foot + s * 0.1); g.lineTo(cx - r * 1.3 + s * 0.3, foot + s * 0.1); g.closePath(); g.fill();
  const pw = r * 3, ph = s * 0.1;
  g.fillStyle = sh(base, -0.22); g.fillRect(cx - pw / 2, foot - ph, pw, ph); g.fillStyle = sh(base, 0.12); g.fillRect(cx - pw / 2, foot - ph - s * 0.05, pw, s * 0.05);
  g.fillStyle = sh(base, -0.1); g.beginPath(); g.ellipse(cx, foot - ph - s * 0.08, r * 1.25, s * 0.05, 0, 0, TAU); g.fill();   // the torus at its foot
  const sb = foot - ph - s * 0.08, st = Y - CH_UP * s + s * 0.36;
  g.fillStyle = lin(g, cx - r, 0, cx + r, 0, [[0, sh(base, -0.15)], [0.25, sh(base, 0.22)], [0.55, sh(base, 0.02)], [1, sh(base, -0.38)]]); g.fillRect(cx - r, st, r * 2, sb - st);
  for(let k = 1; k < 8; k++){ const fx = cx - r + r * 2 * k / 8; line(g, fx, st + s * 0.02, fx, sb, `rgba(60,40,20,${(0.1 + Math.abs(k - 2.5) * 0.015).toFixed(2)})`, Math.max(0.7, s * 0.009)); line(g, fx + Math.max(1, s * 0.012), st + s * 0.02, fx + Math.max(1, s * 0.012), sb, 'rgba(255,250,240,.12)', Math.max(0.6, s * 0.006)); }
  if(s >= 20) for(let k = 0; k < 14; k++){ g.fillStyle = q() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.08)'; g.fillRect(cx - r + q() * r * 2, st + q() * (sb - st), Math.max(0.7, s * 0.01), Math.max(0.7, s * 0.01)); }
  /* its capital: leaves curling under the slab */
  g.fillStyle = sh(base, 0.15); g.fillRect(cx - r * 1.05, st - s * 0.03, r * 2.1, s * 0.04);
  g.fillStyle = lin(g, cx - r * 1.6, 0, cx + r * 1.6, 0, [[0, sh(base, -0.12)], [0.3, sh(base, 0.24)], [1, sh(base, -0.36)]]);
  g.beginPath(); g.moveTo(cx - r, st - s * 0.03); g.quadraticCurveTo(cx - r * 1.1, st - s * 0.12, cx - r * 1.6, st - s * 0.17); g.lineTo(cx + r * 1.6, st - s * 0.17); g.quadraticCurveTo(cx + r * 1.1, st - s * 0.12, cx + r, st - s * 0.03); g.closePath(); g.fill();
  [-1, 1].forEach(dd=>{ g.strokeStyle = sh(base, -0.3); g.lineWidth = Math.max(0.8, s * 0.014); g.beginPath(); g.arc(cx + dd * r * 1.42, st - s * 0.13, s * 0.035, 0, TAU * 0.8); g.stroke(); });
  for(let k = -1; k <= 1; k++){ g.fillStyle = sh(base, -0.2); g.beginPath(); g.moveTo(cx + k * r * 0.6 - s * 0.03, st - s * 0.03); g.quadraticCurveTo(cx + k * r * 0.6, st - s * 0.14, cx + k * r * 0.6 + s * 0.03, st - s * 0.03); g.closePath(); g.fill(); }
  const aw = r * 3.3;
  g.fillStyle = sh(base, -0.05); g.fillRect(cx - aw / 2, st - s * 0.25, aw, s * 0.08);
  g.fillStyle = 'rgba(255,250,240,.25)'; g.fillRect(cx - aw / 2, st - s * 0.25, aw, Math.max(1, s * 0.012));
  g.fillStyle = sh(base, 0.06); g.fillRect(cx - aw / 2, st - s * 0.36, aw, s * 0.11);                                         // the slab's top, the vault's spring above it
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(cx - aw / 2, st - s * 0.36, aw, Math.max(1, s * 0.015));
}
/* the altar under its cloth: its candlesticks (their flames: chAnim), the book open on its stand, white flowers */
function chAltar(g, I, s, run){
  const X = run.x0 * s, W = run.w * s, Y = run.y0 * s;
  const l = X + s * 0.08, r = X + W - s * 0.08, top = Y + s * 0.06, front = Y + s * 0.42, bot = Y + s * 0.9;
  g.fillStyle = 'rgba(20,12,6,.3)'; g.fillRect(l + s * 0.06, bot, r - l, s * 0.1);
  g.fillStyle = lin(g, 0, front, 0, bot, [[0, '#ddd2bc'], [1, '#a89c84']]); g.fillRect(l, front, r - l, bot - front);
  for(let k = 0; k < run.w; k++){ const px = X + k * s + s * 0.18; g.strokeStyle = 'rgba(90,70,40,.35)'; g.lineWidth = Math.max(0.8, s * 0.012); g.strokeRect(px, front + s * 0.1, s * 0.64, bot - front - s * 0.18); }
  g.fillStyle = '#f6f1e6'; g.fillRect(l - s * 0.04, top, r - l + s * 0.08, front - top + s * 0.02);                            // the cloth over its top
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(l - s * 0.04, top, r - l + s * 0.08, Math.max(1, s * 0.014));
  const fl = X + W / 2 - s * 0.9, fr = X + W / 2 + s * 0.9;                                                                     // its frontal, hanging over the front
  g.fillStyle = '#efe7d6'; g.fillRect(fl, front, fr - fl, (bot - front) * 0.72);
  g.fillStyle = '#c9a24a'; g.fillRect(fl, front, fr - fl, s * 0.03); g.fillRect(fl, front + (bot - front) * 0.72 - s * 0.03, fr - fl, s * 0.03);
  for(let t = fl + s * 0.03; t < fr; t += s * 0.06) g.fillRect(t, front + (bot - front) * 0.72, Math.max(0.8, s * 0.015), s * 0.05);   // its fringe
  const mx = X + W / 2, my = front + (bot - front) * 0.36;
  g.strokeStyle = '#c9a24a'; g.lineWidth = Math.max(1, s * 0.018); for(let k = 0; k < 6; k++){ const a = k / 6 * TAU; g.beginPath(); g.ellipse(mx + Math.cos(a) * s * 0.07, my + Math.sin(a) * s * 0.05, s * 0.06, s * 0.03, a, 0, TAU); g.stroke(); }
  circ(g, mx, my, s * 0.03, '#c9a24a');
  /* the book, open on its stand */
  g.fillStyle = '#7a5530'; g.beginPath(); g.moveTo(mx - s * 0.18, top + s * 0.3); g.lineTo(mx + s * 0.18, top + s * 0.3); g.lineTo(mx + s * 0.14, top + s * 0.08); g.lineTo(mx - s * 0.14, top + s * 0.08); g.closePath(); g.fill();
  g.fillStyle = '#fbf6ea'; g.beginPath(); g.moveTo(mx - s * 0.16, top + s * 0.27); g.lineTo(mx, top + s * 0.29); g.lineTo(mx, top + s * 0.07); g.lineTo(mx - s * 0.13, top + s * 0.06); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(mx + s * 0.16, top + s * 0.27); g.lineTo(mx, top + s * 0.29); g.lineTo(mx, top + s * 0.07); g.lineTo(mx + s * 0.13, top + s * 0.06); g.closePath(); g.fill();
  g.fillStyle = 'rgba(90,70,50,.55)'; for(let k = 0; k < 4; k++){ g.fillRect(mx - s * 0.12, top + s * (0.1 + k * 0.045), s * 0.09, Math.max(0.6, s * 0.007)); g.fillRect(mx + s * 0.03, top + s * (0.1 + k * 0.045), s * 0.09, Math.max(0.6, s * 0.007)); }
  line(g, mx, top + s * 0.29, mx, top + s * 0.38, '#c82a2a', Math.max(0.8, s * 0.014));                                       // its ribbon
  /* the candlesticks, tall, brass */
  chAltarCandles(run).forEach(([cx0])=>{ const cx = cx0 * s;
    g.fillStyle = '#a8802e'; ell(g, cx, top + s * 0.3, s * 0.08, s * 0.03, '#a8802e'); g.fillStyle = lin(g, cx - s * 0.03, 0, cx + s * 0.03, 0, [[0, '#8a6420'], [0.4, '#f0d070'], [1, '#7a5418']]); g.fillRect(cx - s * 0.025, top - s * 0.12, s * 0.05, s * 0.42);
    ell(g, cx, top - s * 0.12, s * 0.05, s * 0.018, '#c9a24a'); g.fillStyle = '#f6f0e2'; g.fillRect(cx - s * 0.02, top - s * 0.32, s * 0.04, s * 0.2); });
  /* white flowers either side of the book */
  [mx - s * 0.5, mx + s * 0.5].forEach(fx=>{ g.fillStyle = '#c8d8e0'; g.fillRect(fx - s * 0.04, top + s * 0.14, s * 0.08, s * 0.14);
    for(let k = 0; k < 5; k++){ const a = -Math.PI / 2 + (k - 2) * 0.4; line(g, fx, top + s * 0.15, fx + Math.cos(a) * s * 0.14, top + s * 0.15 + Math.sin(a) * s * 0.14, '#4a7a3a', Math.max(0.6, s * 0.008)); ell(g, fx + Math.cos(a) * s * 0.15, top + s * 0.15 + Math.sin(a) * s * 0.15, s * 0.035, s * 0.025, '#fbfbf4'); } });
}
function chAltarCandles(run){ return [[run.x0 + 0.5, run.y0], [run.x0 + run.w - 0.5, run.y0]]; }
/* a stand of little candles, in red and amber glasses; an iron stand, a box for the coins */
function chVotiveSpots(x, y){ const out = []; for(let t = 0; t < 3; t++) for(let k = 0; k < 3 + t; k++) out.push([x + 0.5 - (0.25 + t * 0.06) + (0.5 + t * 0.12) * (k + 0.5) / (3 + t), y + 0.3 + t * 0.17]); return out; }
function chVotive(g, I, s, x, y){
  const X = x * s, Y = y * s, cx = X + s / 2;
  g.fillStyle = rad(g, cx, Y + s * 0.5, 0, s * 0.9, [[0, 'rgba(255,200,110,.35)'], [1, 'rgba(255,200,110,0)']]); g.fillRect(X - s * 0.4, Y - s * 0.4, s * 1.8, s * 1.8);
  ell(g, cx + s * 0.05, Y + s * 0.9, s * 0.36, s * 0.06, 'rgba(20,12,6,.35)');
  g.fillStyle = '#2a2420'; g.fillRect(cx - s * 0.32, Y + s * 0.78, s * 0.04, s * 0.12); g.fillRect(cx + s * 0.28, Y + s * 0.78, s * 0.04, s * 0.12);
  for(let t = 0; t < 3; t++){ const ty = Y + s * (0.3 + t * 0.17), tw = s * (0.5 + t * 0.12); g.fillStyle = '#2a2420'; g.fillRect(cx - tw / 2, ty, tw, s * 0.04); g.fillStyle = 'rgba(255,220,160,.2)'; g.fillRect(cx - tw / 2, ty, tw, Math.max(0.6, s * 0.008)); }
  chVotiveSpots(x, y).forEach(([vx, vy], i)=>{ const px = vx * s, py = vy * s; g.fillStyle = i % 3 === 1 ? 'rgba(230,150,40,.88)' : 'rgba(190,36,36,.88)'; rr(g, px - s * 0.03, py - s * 0.065, s * 0.06, s * 0.065, s * 0.012); g.fill(); g.fillStyle = 'rgba(255,240,200,.6)'; g.fillRect(px - s * 0.022, py - s * 0.06, s * 0.012, s * 0.05); });
  g.fillStyle = '#4a3a2a'; g.fillRect(cx - s * 0.1, Y + s * 0.82, s * 0.2, s * 0.1); g.fillStyle = '#1a1210'; g.fillRect(cx - s * 0.05, Y + s * 0.84, s * 0.1, s * 0.012);
}
/* the crypt's stair, going down in its corner, a rail round it */
function chStair(g, I, s, x, y){
  const X = x * s, Y = y * s;
  g.fillStyle = '#16100e'; g.fillRect(X + s * 0.06, Y + s * 0.06, s * 0.88, s * 0.88);
  for(let k = 0; k < 5; k++){ const v = 160 - k * 28; g.fillStyle = `rgb(${v},${v - 10},${v - 24})`; g.fillRect(X + s * 0.1, Y + s * (0.1 + k * 0.165), s * 0.8, s * 0.125); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X + s * 0.1, Y + s * (0.225 + k * 0.165), s * 0.8, s * 0.03); }
  g.strokeStyle = '#9a8e76'; g.lineWidth = Math.max(1.5, s * 0.05); g.strokeRect(X + s * 0.06, Y + s * 0.06, s * 0.88, s * 0.88);
  g.strokeStyle = '#2a2420'; g.lineWidth = Math.max(1, s * 0.025);
  [0.08, 0.5].forEach(f=>{ g.beginPath(); g.moveTo(X + s * f, Y + s * 0.06); g.lineTo(X + s * f, Y - s * 0.26); g.stroke(); });
  g.beginPath(); g.moveTo(X + s * 0.08, Y - s * 0.26); g.lineTo(X + s * 0.92, Y - s * 0.26); g.lineTo(X + s * 0.92, Y + s * 0.06); g.stroke();
  g.beginPath(); g.moveTo(X + s * 0.08, Y - s * 0.26); g.lineTo(X + s * 0.08, Y + s * 0.92); g.stroke();
}
/* its glass: the rose window over the altar, tall lancets, the side windows' colours falling across the floor */
function chGlassPane(g, s, l, t, w, h, seed){
  const q = R(seed, 3, 611);
  g.save(); g.beginPath(); g.moveTo(l, t + h); g.lineTo(l, t + w / 2); g.arc(l + w / 2, t + w / 2, w / 2, Math.PI, 0); g.lineTo(l + w, t + h); g.closePath(); g.clip();
  const n = 5;
  for(let k = 0; k < n; k++) for(let j = 0; j < 2; j++){ g.fillStyle = CH_GLASS[Math.floor(q() * CH_GLASS.length)]; g.fillRect(l + j * w / 2, t + k * h / n, w / 2 + 1, h / n + 1); }
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(l, t, w * 0.3, h);
  g.strokeStyle = '#2a2420'; g.lineWidth = Math.max(0.8, s * 0.012);
  for(let k = 1; k < n; k++){ g.beginPath(); g.moveTo(l, t + k * h / n); g.lineTo(l + w, t + k * h / n); g.stroke(); }
  g.beginPath(); g.moveTo(l + w / 2, t); g.lineTo(l + w / 2, t + h); g.stroke();
  g.restore();
  g.strokeStyle = '#8a7a60'; g.lineWidth = Math.max(1, s * 0.03); g.beginPath(); g.moveTo(l, t + h); g.lineTo(l, t + w / 2); g.arc(l + w / 2, t + w / 2, w / 2, Math.PI, 0); g.lineTo(l + w, t + h); g.stroke();
}
function chGlass(g, I, s){
  const W = I.W, alt = [...I.runs.values()].find(r=> r.c === 't' && r.y0 === 1);
  const rx = alt ? (alt.x0 + alt.w / 2) * s : W * s / 2, ry = s * 0.5, rr0 = s * 0.42;
  if(I.at(Math.floor(rx / s), 0) === '#'){
    circ(g, rx + s * 0.02, ry + s * 0.03, rr0, 'rgba(0,0,0,.3)'); circ(g, rx, ry, rr0, '#8a7a60');
    for(let k = 0; k < 12; k++){ const a0 = k / 12 * TAU, a1 = (k + 1) / 12 * TAU; g.fillStyle = CH_GLASS[k % CH_GLASS.length]; g.beginPath(); g.moveTo(rx, ry); g.arc(rx, ry, rr0 * 0.86, a0, a1); g.closePath(); g.fill(); }
    g.strokeStyle = '#2a2420'; g.lineWidth = Math.max(0.8, s * 0.012); for(let k = 0; k < 12; k++){ const a = k / 12 * TAU; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx + Math.cos(a) * rr0 * 0.86, ry + Math.sin(a) * rr0 * 0.86); g.stroke(); }
    for(let k = 0; k < 12; k++){ const a = (k + 0.5) / 12 * TAU; circ(g, rx + Math.cos(a) * rr0 * 0.62, ry + Math.sin(a) * rr0 * 0.62, rr0 * 0.12, 'rgba(255,240,200,.35)'); }
    circ(g, rx, ry, rr0 * 0.3, '#c8a040'); circ(g, rx, ry, rr0 * 0.18, '#f0d880');
    g.strokeStyle = '#8a7a60'; g.lineWidth = Math.max(1, s * 0.03); g.beginPath(); g.arc(rx, ry, rr0 * 0.3, 0, TAU); g.stroke(); g.beginPath(); g.arc(rx, ry, rr0 * 0.86, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.ellipse(rx - rr0 * 0.3, ry - rr0 * 0.35, rr0 * 0.3, rr0 * 0.14, -0.6, 0, TAU); g.fill();
  }
  [3, W - 4].forEach((x, i)=>{ if(I.at(x, 0) === '#' && I.open(x, 1)) chGlassPane(g, s, x * s + s * 0.3, s * 0.12, s * 0.4, s * 0.66, 11 + i); });
  /* the side windows: their glass edge-on in the thick walls, their colours falling across the floor */
  for(let y = 1; y < I.H - 1; y++){
    if(y % 3 !== 1) continue;
    [[0, 1], [W - 1, -1]].forEach(([x, dir])=>{
      if(I.at(x, y) !== '#' || !I.open(x + dir, y)) return;
      const col = CH_GLASS[((y / 3) | 0) % 3], ex = (dir > 0 ? x + 1 : x) * s;
      g.fillStyle = '#2a2420'; g.fillRect(ex - (dir > 0 ? s * 0.16 : -s * 0.02), y * s + s * 0.12, s * 0.14, s * 0.76);
      g.fillStyle = col; g.fillRect(ex - (dir > 0 ? s * 0.12 : -s * 0.04), y * s + s * 0.16, s * 0.07, s * 0.68);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(ex - (dir > 0 ? s * 0.12 : -s * 0.04), y * s + s * 0.16, Math.max(1, s * 0.015), s * 0.68);
      const n = parseInt(col.slice(1), 16), rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
      g.fillStyle = lin(g, ex, 0, ex + dir * s * 2.4, 0, [[0, `rgba(${rgb},.34)`], [1, `rgba(${rgb},0)`]]);
      g.beginPath(); g.moveTo(ex, y * s + s * 0.16); g.lineTo(ex, y * s + s * 0.84); g.lineTo(ex + dir * s * 2.4, y * s + s * 1.5); g.lineTo(ex + dir * s * 2.4, y * s + s * 0.82); g.closePath(); g.fill();
    });
  }
}
/* the aisle's runner, from the door to the altar */
function chRunner(g, I, s){
  const ax = Math.floor(I.W / 2), alt = [...I.runs.values()].find(r=> r.c === 't' && r.y0 === 1);
  const y0 = (alt ? alt.y1 + 1 : 2), y1 = I.H - 1, l = ax * s + s * 0.16, r = ax * s + s * 0.84;
  g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(l + s * 0.02, y0 * s + s * 0.1, r - l, (y1 - y0) * s);
  g.fillStyle = '#8a2228'; g.fillRect(l, y0 * s + s * 0.08, r - l, (y1 - y0) * s - s * 0.08);
  g.fillStyle = '#c9a24a'; g.fillRect(l + s * 0.04, y0 * s + s * 0.08, Math.max(1, s * 0.02), (y1 - y0) * s - s * 0.08); g.fillRect(r - s * 0.06, y0 * s + s * 0.08, Math.max(1, s * 0.02), (y1 - y0) * s - s * 0.08);
  for(let y = y0; y < y1; y++){ const cy = y * s + s * 0.55; g.fillStyle = 'rgba(230,180,80,.45)'; g.beginPath(); g.moveTo(ax * s + s * 0.5, cy - s * 0.14); g.lineTo(ax * s + s * 0.62, cy); g.lineTo(ax * s + s * 0.5, cy + s * 0.14); g.lineTo(ax * s + s * 0.38, cy); g.closePath(); g.fill();
    if(s >= 20) for(let k = 0; k < 12; k++){ const q = R(ax, y * 31 + k, 621); g.fillStyle = q() < 0.5 ? 'rgba(0,0,0,.1)' : 'rgba(255,200,200,.06)'; g.fillRect(l + q() * (r - l), y * s + q() * s, Math.max(0.7, s * 0.01), Math.max(0.7, s * 0.01)); } }
  for(let t = l + s * 0.02; t < r; t += s * 0.04) g.fillRect(t, y0 * s + s * 0.03, Math.max(0.6, s * 0.01), s * 0.05);
}
function chGround(g, d, s, R0){
  const I = rmInfo(d), V = plBase(g, I, s, R0);
  chRunner(g, I, s);
  plWalls(g, I, s, V);
  chGlass(g, I, s);
  const down = (d.things || []).find(t=> t.verb === 'Down');
  if(down) chStair(g, I, s, down.x, down.y);
  plItems(I, V.xs, V.xe, V.ys, V.ye, 't').forEach(({ x, y, c, run })=>{
    if(c === 't') (run.y0 === 1 ? chAltar : chPew)(g, I, s, run);
    else if(c === 'o') chPillar(g, I, s, x, y);
    else if(c === '*') chVotive(g, I, s, x, y);
  });
  rmLight(g, I, s, R0);
}
function chAnim(ctx, d, k, ox, oy, V, now){
  const I = rmInfo(d), t = now / 1000;
  for(let y = V.y0; y <= V.y1; y++) for(let x = V.x0; x <= V.x1; x++){
    if(I.at(x, y) === '*') chVotiveSpots(x, y).forEach(([vx, vy], i)=> cFlame(ctx, ox + vx * k, oy + (vy - 0.065) * k, k * 0.022, t + i * 0.37, x * 3 + i));
  }
  const alt = [...I.runs.values()].find(r=> r.c === 't' && r.y0 === 1);
  if(alt) chAltarCandles(alt).forEach(([cx, cy], i)=>{ const fx = ox + cx * k, fy = oy + (cy + 0.06 - 0.32) * k; cFlame(ctx, fx, fy, k * 0.035, t + i * 0.6, 40 + i);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(ctx, fx, fy - k * 0.04, 0, k * 0.6, [[0, 'rgba(255,214,140,.22)'], [1, 'rgba(255,214,140,0)']]); ctx.fillRect(fx - k * 0.6, fy - k * 0.64, k * 1.2, k * 1.2); ctx.restore(); });
}
function plTall(d){
  const I = rmInfo(d);
  if(I.tall) return I.tall;
  const list = [];
  for(let y = 0; y < I.H; y++) for(let x = 0; x < I.W; x++){
    if(I.at(x, y) !== 'o' || !I.open(x, y - 1)) continue;
    if(d.key === 'church') list.push({ x, y, w:1, up:CH_UP, draw:(g, dd, s)=> chPillar(g, rmInfo(dd), s, x, y) });
    else list.push({ x, y, w:1, up:RM_UP, draw:(g, dd, s)=> tlDummy(g, rmInfo(dd), s, x, y) });
  }
  return (I.tall = list);
}
PAINTERS.tailor = { handles:(d)=> d.key === 'tailor', sig:(d)=> rmInfo(d).sig, ground:tlGround, tall:plTall, standable:(d, x, y)=> rmInfo(d).open(x, y), bg:'#1e1712' };
PAINTERS.church = { handles:(d)=> d.key === 'church', sig:(d)=> rmInfo(d).sig, ground:chGround, anim:chAnim, tall:plTall, standable:(d, x, y)=> rmInfo(d).open(x, y), bg:'#1e1712' };

/* ---------- the tower: an eight-sided room of dark stone, paved in rings round its circle of runes ---------- */
const TW_OCT = [[3, 2], [8, 2], [10, 4], [10, 7], [8, 9], [3, 9], [1, 7], [1, 4]];
const TW_UP = 0.9, TW_FACE = 0.62;
function twStyle(d){
  const n = d.tower || 1;
  if(n >= 12) return { n, ghost:n % 2 === 1, master:true, floor:'#4c4236', mortar:'#211b16', wall:'#3a3028', wallL:'#7a6650', glow:'240,196,100', inlay:'#d8b060', flame:'gold', crystal:['#fbecb8', '#e0bc6a', '#9a7430'] };
  if(n % 2 === 1) return { n, ghost:true, master:false, floor:'#403c50', mortar:'#18161e', wall:'#2e2838', wallL:'#5c5070', glow:'180,140,255', inlay:'#a898c0', flame:'violet', crystal:['#e0d4fa', '#a690e4', '#5e48a8'] };
  return { n, ghost:false, master:false, floor:'#4a3a52', mortar:'#1a121e', wall:'#33263a', wallL:'#6a5478', glow:'255,150,225', inlay:'#c8a0c0', flame:'violet', crystal:['#fad4f2', '#e090e0', '#9a4aa0'] };
}
function twFloorPath(g, s){
  g.beginPath(); TW_OCT.forEach(([x, y], i)=> i ? g.lineTo(x * s, y * s) : g.moveTo(x * s, y * s)); g.closePath();
  g.rect(5 * s, 0.98 * s, s, s * 1.04); g.rect(5 * s, 8.98 * s, s, s * 1.04);
}
function twGround(g, d, s, R0){
  const St = twStyle(d), W = d.rows[0].length, H = d.rows.length, cx = W / 2 * s, cy = H / 2 * s;
  /* the tower's stone all round, seen from above: big blocks in courses */
  g.fillStyle = St.mortar; g.fillRect(-s, -s, (W + 2) * s, (H + 2) * s);
  for(let r = -2; r < H * 2 + 2; r++){
    const off = (r % 2) * 0.45, by = r * 0.5 * s;
    for(let n = -2; n < W + 2; n++){ const q = R(n, r, 631 + St.n), bx = (n * 0.9 - off) * s; g.fillStyle = sh(St.wall, (q() - 0.5) * 0.22); g.fillRect(bx + 1, by + 1, s * 0.9 - 2, s * 0.5 - 2); g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(bx + 1, by + 1, s * 0.9 - 2, Math.max(1, s * 0.012)); }
  }
  /* the floor: rings of curved slabs round the circle */
  g.save(); twFloorPath(g, s); g.clip();
  g.fillStyle = St.mortar; g.fillRect(0, 0, W * s, H * s);
  const gap = Math.max(0.8, s * 0.02);
  for(let ri = 0; ri < 10; ri++){
    const r0 = ri * 0.62, r1 = r0 + 0.62, n = ri === 0 ? 1 : Math.max(6, Math.round(TAU * (r0 + 0.31) / 0.95)), a0 = R(ri, St.n, 637)() * TAU;
    for(let k = 0; k < n; k++){
      const q = R(ri, k, 641 + St.n), aa = a0 + k / n * TAU, ab = a0 + (k + 1) / n * TAU;
      g.fillStyle = sh(St.floor, (q() - 0.5) * 0.22 - ri * 0.012);
      g.beginPath();
      if(!ri) g.arc(cx, cy, r1 * s - gap / 2, 0, TAU);
      else { const ga = gap / (r0 * s); g.arc(cx, cy, r1 * s - gap / 2, aa + ga / 2, ab - ga / 2); g.arc(cx, cy, r0 * s + gap / 2, ab - ga, aa + ga, true); g.closePath(); }
      g.fill();
      if(ri){ g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = Math.max(0.7, s * 0.012); g.beginPath(); g.arc(cx, cy, r0 * s + gap, aa + 0.02, ab - 0.02); g.stroke(); }
      if(s >= 24) for(let j = 0; j < 5; j++){ const am = aa + (ab - aa) * q(), rm = (r0 + 0.62 * q()) * s; g.fillStyle = q() < 0.55 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.05)'; g.fillRect(cx + Math.cos(am) * rm, cy + Math.sin(am) * rm, Math.max(0.8, s * 0.014), Math.max(0.8, s * 0.014)); }
      if(q() < 0.12){ g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = Math.max(0.7, s * 0.01); const am = aa + (ab - aa) * (0.3 + q() * 0.4); g.beginPath(); g.moveTo(cx + Math.cos(am) * r0 * s, cy + Math.sin(am) * r0 * s); g.lineTo(cx + Math.cos(am + 0.05) * (r0 + 0.35) * s, cy + Math.sin(am + 0.05) * (r0 + 0.35) * s); g.stroke(); }
    }
  }
  twRunes(g, d, s, St);
  /* the walls' shadows on the floor */
  TW_OCT.forEach((A, i)=>{ const B = TW_OCT[(i + 1) % TW_OCT.length], north = A[1] <= 4 && B[1] <= 4 && (A[1] < 4 || B[1] < 4);
    const nx = -(B[1] - A[1]), ny = B[0] - A[0], L0 = Math.hypot(nx, ny), ux = nx / L0, uy = ny / L0, w = (north ? 0.42 : 0.16) * s;
    g.fillStyle = lin(g, A[0] * s, A[1] * s, A[0] * s + ux * w, A[1] * s + uy * w, [[0, `rgba(6,4,10,${north ? 0.5 : 0.3})`], [1, 'rgba(6,4,10,0)']]);
    g.beginPath(); g.moveTo(A[0] * s, A[1] * s); g.lineTo(B[0] * s, B[1] * s); g.lineTo(B[0] * s + ux * w, B[1] * s + uy * w); g.lineTo(A[0] * s + ux * w, A[1] * s + uy * w); g.closePath(); g.fill(); });
  /* glows on the floor round the candles and the crystals */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const c = d.rows[y][x]; if(c !== '*' && c !== 'o') continue;
    g.fillStyle = rad(g, (x + 0.5) * s, (y + 0.7) * s, 0, s * 1.3, [[0, `rgba(${St.glow},.26)`], [1, `rgba(${St.glow},0)`]]); g.fillRect((x - 1) * s, (y - 0.7) * s, s * 3, s * 2.8); }
  g.restore();
  twFaces(g, d, s, St);
  twWays(g, d, s, St);
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const c = d.rows[y][x]; if(c === '*') twCandles(g, d, s, x, y, St); else if(c === 'o') twCrystal(g, d, s, x, y, St); }
  /* the dark round the edge */
  g.fillStyle = rad(g, cx, cy, s * 1.8, s * 6.4, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.5)']]); g.fillRect(-s, -s, (W + 2) * s, (H + 2) * s);
}
/* the walls you face: their stones, course on course, where the floor runs up to them; and a lit edge along the tops of
   the others */
function twFaces(g, d, s, St){
  const h = TW_FACE * s;
  [[[1, 4], [3, 2]], [[3, 2], [8, 2]], [[8, 2], [10, 4]]].forEach(([A, B], ei)=>{
    const ax = A[0] * s, ay = A[1] * s, bx = B[0] * s, by = B[1] * s;
    g.save(); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(bx, by - h); g.lineTo(ax, ay - h); g.closePath(); g.clip();
    g.fillStyle = lin(g, 0, Math.min(ay, by) - h, 0, Math.max(ay, by), [[0, sh(St.wallL, 0.06)], [1, sh(St.wall, 0.1)]]); g.fillRect(Math.min(ax, bx), Math.min(ay, by) - h, Math.abs(bx - ax), Math.abs(by - ay) + h);
    const rows = 4;
    for(let c = 0; c < rows; c++){
      const st = s * 0.42, x0 = Math.min(ax, bx), x1 = Math.max(ax, bx);
      for(let x = x0 - (c % 2) * st / 2; x < x1; x += st){
        const q = R(Math.round(x / st), c + ei * 7, 651 + St.n), t0 = (x - ax) / (bx - ax), t1 = (x + st - ax) / (bx - ax);
        const yb0 = ay + (by - ay) * t0 - c * h / rows, yb1 = ay + (by - ay) * t1 - c * h / rows;
        g.fillStyle = sh(St.wallL, (q() - 0.5) * 0.2 - 0.1 - c * 0.04);
        g.beginPath(); g.moveTo(x + 1, yb0 - 1); g.lineTo(x + st - 1, yb1 - 1); g.lineTo(x + st - 1, yb1 - h / rows + 1); g.lineTo(x + 1, yb0 - h / rows + 1); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x + 1, yb0 - h / rows + 1); g.lineTo(x + st - 1, yb1 - h / rows + 1); g.lineTo(x + st - 1, yb1 - h / rows + 1 + Math.max(1, s * 0.012)); g.lineTo(x + 1, yb0 - h / rows + 1 + Math.max(1, s * 0.012)); g.closePath(); g.fill();
      }
    }
    g.fillStyle = lin(g, 0, Math.min(ay, by) - h * 0.2, 0, Math.max(ay, by), [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.3)']]); g.fillRect(Math.min(ax, bx), Math.min(ay, by) - h, Math.abs(bx - ax), Math.abs(by - ay) + h);
    g.restore();
    line(g, ax, ay - h, bx, by - h, sh(St.wallL, 0.3), Math.max(1, s * 0.03));
    line(g, ax, ay, bx, by, 'rgba(0,0,0,.5)', Math.max(1, s * 0.02));
  });
  [[[10, 4], [10, 7]], [[10, 7], [8, 9]], [[8, 9], [3, 9]], [[3, 9], [1, 7]], [[1, 7], [1, 4]]].forEach(([A, B])=> line(g, A[0] * s, A[1] * s, B[0] * s, B[1] * s, sh(St.wallL, 0.12), Math.max(1.5, s * 0.05)));
}
/* the ways out of each floor: the stair up in the top alcove (the top floor: its window), the stair down in the bottom
   one (the ground floor: the door out) */
function twWays(g, d, s, St){
  (d.things || []).filter(t=> t.walk).forEach(t=>{
    const X = t.x * s, up = t.y < d.rows.length / 2;
    if(up){
      const l = X + s * 0.08, r = X + s * 0.92, bot = 2 * s, top = 0.98 * s;
      g.fillStyle = '#0c0910'; g.beginPath(); g.moveTo(l, bot); g.lineTo(l, top + (r - l) / 2); g.arc((l + r) / 2, top + (r - l) / 2, (r - l) / 2, Math.PI, 0); g.lineTo(r, bot); g.closePath(); g.fill();
      if(t.verb === 'Window'){
        g.save(); g.clip();
        g.fillStyle = lin(g, 0, top, 0, bot, [[0, '#0b1230'], [0.7, '#2a2a5a'], [1, '#5a3a6a']]); g.fillRect(l, top, r - l, bot - top);
        [[0.2, 0.2], [0.7, 0.15], [0.45, 0.35], [0.8, 0.45], [0.3, 0.55]].forEach(([a, b], i)=> circ(g, l + (r - l) * a, top + (bot - top) * b, Math.max(0.8, s * (0.012 + (i % 2) * 0.006)), 'rgba(255,250,230,.9)'));
        for(let k = 0; k < 6; k++) circ(g, l + (r - l) * (0.1 + k * 0.16), bot - s * (0.08 + (k % 3) * 0.03), Math.max(0.8, s * 0.012), 'rgba(255,214,130,.85)');   // the town far below
        g.restore();
        line(g, (l + r) / 2, top, (l + r) / 2, bot, '#6a5a7a', Math.max(1, s * 0.025)); line(g, l, top + (bot - top) * 0.55, r, top + (bot - top) * 0.55, '#6a5a7a', Math.max(1, s * 0.02));
      } else {
        for(let k = 0; k < 5; k++){ const v = 46 + k * 16, yy = top + s * 0.18 + k * (bot - top - s * 0.18) / 5; g.fillStyle = `rgb(${v},${v - 6},${v + 10})`; g.fillRect(l + s * 0.04, yy, r - l - s * 0.08, (bot - top - s * 0.18) / 5 - Math.max(1, s * 0.02)); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(l + s * 0.04, yy, r - l - s * 0.08, Math.max(1, s * 0.012)); }
      }
      g.strokeStyle = sh(St.wallL, 0.2); g.lineWidth = Math.max(1, s * 0.04); g.beginPath(); g.moveTo(l, bot); g.lineTo(l, top + (r - l) / 2); g.arc((l + r) / 2, top + (r - l) / 2, (r - l) / 2, Math.PI, 0); g.lineTo(r, bot); g.stroke();
      return;
    }
    const Y = t.y * s;
    if(t.verb === 'Out'){
      g.fillStyle = lin(g, 0, Y, 0, Y + s, [[0, 'rgba(16,14,30,.2)'], [1, 'rgba(16,14,30,.85)']]); g.fillRect(X, Y, s, s);
      g.fillStyle = lin(g, 0, Y + s * 0.02, 0, Y + s * 0.24, [[0, '#8a8478'], [1, '#5c564c']]); g.fillRect(X, Y + s * 0.02, s, s * 0.22);
      g.fillStyle = 'rgba(255,245,225,.25)'; g.fillRect(X, Y + s * 0.02, s, Math.max(1, s * 0.014));
      [[X, 1], [X + s, -1]].forEach(([ex, dir])=>{ g.fillStyle = '#4a2f1e'; g.beginPath(); g.moveTo(ex, Y + s * 0.24); g.lineTo(ex + dir * s * 0.16, Y + s * 0.3); g.lineTo(ex + dir * s * 0.16, Y + s * 0.95); g.lineTo(ex, Y + s); g.closePath(); g.fill(); circ(g, ex + dir * s * 0.12, Y + s * 0.6, Math.max(1, s * 0.022), '#d9b45a'); });
    } else {
      for(let k = 0; k < 5; k++){ const v = 110 - k * 20, yy = Y + s * 0.06 + k * s * 0.17; g.fillStyle = `rgb(${v},${v - 6},${v + 10})`; g.fillRect(X + s * 0.1, yy, s * 0.8, s * 0.13); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X + s * 0.1, yy + s * 0.13, s * 0.8, s * 0.04); }
      g.fillStyle = lin(g, 0, Y + s * 0.4, 0, Y + s, [[0, 'rgba(6,4,10,0)'], [1, 'rgba(6,4,10,.7)']]); g.fillRect(X, Y + s * 0.4, s, s * 0.6);
    }
  });
}
/* the circle of runes in the middle of each floor: two rings let into the stone, the runes between them; a spiral of
   smoke in it on the ghosts' floors, an eye on the others; gold on the masters' */
function twGlyph(g, sz, seed, col){
  const q = R(seed, 7, 661);
  g.strokeStyle = col; g.lineWidth = Math.max(0.8, sz * 0.18); g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -sz); g.lineTo(0, sz);
  const n = 1 + Math.floor(q() * 3);
  for(let j = 0; j < n; j++){ const y0 = -sz + q() * sz * 1.6, dir = q() < 0.5 ? -1 : 1; g.moveTo(0, y0); g.lineTo(dir * sz * 0.6, y0 + (q() - 0.3) * sz * 0.9); }
  if(q() < 0.4){ g.moveTo(sz * 0.35, -sz * 0.2); g.arc(0, -sz * 0.2, sz * 0.35, 0, TAU); }
  g.stroke(); g.lineCap = 'butt';
}
function twRunes(g, d, s, St){
  const cx = d.rows[0].length / 2 * s, cy = d.rows.length / 2 * s;
  [[2.6, 0.07], [2.15, 0.045]].forEach(([r, w])=>{
    g.strokeStyle = `rgba(${St.glow},.16)`; g.lineWidth = s * w * 4; g.beginPath(); g.arc(cx, cy, r * s, 0, TAU); g.stroke();
    g.strokeStyle = St.inlay; g.lineWidth = s * w; g.beginPath(); g.arc(cx, cy, r * s, 0, TAU); g.stroke();
    g.strokeStyle = `rgba(${St.glow},.85)`; g.lineWidth = Math.max(1, s * w * 0.35); g.beginPath(); g.arc(cx, cy, r * s, 0, TAU); g.stroke();
  });
  for(let k = 0; k < 16; k++){ const a = k / 16 * TAU, rm = 2.375 * s; g.save(); g.translate(cx + Math.cos(a) * rm, cy + Math.sin(a) * rm); g.rotate(a + Math.PI / 2); twGlyph(g, s * 0.13, k + St.n * 16, `rgba(${St.glow},.9)`); g.restore(); }
  if(St.ghost){
    [[s * 0.14, `rgba(${St.glow},.2)`], [Math.max(1, s * 0.035), `rgba(${St.glow},.85)`]].forEach(([lw0, col])=>{ g.strokeStyle = col; g.lineWidth = lw0; g.beginPath();
      for(let t = 0; t <= Math.PI * 6; t += 0.08){ const r = s * 0.08 + t * s * 0.085, px = cx + Math.cos(t) * r, py = cy + Math.sin(t) * r; t ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); });
  } else {
    for(let k = 0; k < 12; k++){ const a = k / 12 * TAU; line(g, cx + Math.cos(a) * s * 0.95, cy + Math.sin(a) * s * 0.95, cx + Math.cos(a) * s * 1.7, cy + Math.sin(a) * s * 1.7, `rgba(${St.glow},.7)`, Math.max(1, s * 0.03)); }
    g.fillStyle = `rgba(${St.glow},.3)`; g.beginPath(); g.moveTo(cx - s * 0.75, cy); g.quadraticCurveTo(cx, cy - s * 0.55, cx + s * 0.75, cy); g.quadraticCurveTo(cx, cy + s * 0.55, cx - s * 0.75, cy); g.closePath(); g.fill();
    g.strokeStyle = `rgba(${St.glow},.9)`; g.lineWidth = Math.max(1, s * 0.03); g.stroke();
    circ(g, cx, cy, s * 0.22, St.master ? '#7a5418' : '#5a1a64'); circ(g, cx, cy, s * 0.1, '#140a16'); circ(g, cx - s * 0.06, cy - s * 0.06, s * 0.04, 'rgba(255,255,255,.7)');
  }
}
/* a tall iron candlestick, three candles on its arms (their flames: twAnim) */
function twCandleSpots(x, y){ return [[x + 0.26, y - 0.18], [x + 0.5, y - 0.3], [x + 0.74, y - 0.18]]; }
function twCandles(g, d, s, x, y, St){
  const X = x * s, Y = y * s, cx = X + s / 2, foot = Y + s * 0.86;
  ell(g, cx + s * 0.04, foot + s * 0.02, s * 0.24, s * 0.06, 'rgba(0,0,0,.4)');
  g.strokeStyle = '#1e1a22'; g.lineWidth = Math.max(1, s * 0.03); [[-1, 0], [1, 0], [0, 0.04]].forEach(([dd, f])=> line(g, cx, foot - s * 0.14, cx + dd * s * 0.18, foot + s * f, '#1e1a22', Math.max(1, s * 0.03)));
  g.fillStyle = lin(g, cx - s * 0.03, 0, cx + s * 0.03, 0, [[0, '#2a2430'], [0.5, '#6a6070'], [1, '#1a1620']]); g.fillRect(cx - s * 0.025, Y - s * 0.12, s * 0.05, foot - Y + s * 0.0);
  g.strokeStyle = '#2a2430'; g.lineWidth = Math.max(1, s * 0.025); g.beginPath(); g.moveTo(X + s * 0.26, Y - s * 0.02); g.quadraticCurveTo(cx, Y + s * 0.12, X + s * 0.74, Y - s * 0.02); g.stroke();
  twCandleSpots(x, y).forEach(([vx, vy])=>{ const px = vx * s, py = vy * s; ell(g, px, py + s * 0.17, s * 0.05, s * 0.015, '#4a4050'); g.fillStyle = St.master ? '#f4ead2' : '#e8e0f0'; g.fillRect(px - s * 0.022, py, s * 0.044, s * 0.17); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(px - s * 0.02, py, s * 0.01, s * 0.15); ell(g, px + s * 0.015, py + s * 0.05, s * 0.008, s * 0.03, 'rgba(255,255,255,.6)'); });
}
/* a crystal standing on its stone foot: faceted, lit from inside */
function twCrystal(g, d, s, x, y, St){
  const X = x * s, Y = y * s, cx = X + s / 2, foot = Y + s * 0.82, top = Y - TW_UP * s + s * 0.08, [cL, cM, cD] = St.crystal;
  ell(g, cx + s * 0.06, foot + s * 0.06, s * 0.3, s * 0.07, 'rgba(0,0,0,.4)');
  g.fillStyle = '#2a2430'; g.beginPath(); g.moveTo(cx - s * 0.3, foot); g.lineTo(cx - s * 0.2, foot - s * 0.12); g.lineTo(cx + s * 0.2, foot - s * 0.12); g.lineTo(cx + s * 0.3, foot); g.lineTo(cx + s * 0.22, foot + s * 0.06); g.lineTo(cx - s * 0.22, foot + s * 0.06); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(cx - s * 0.2, foot - s * 0.12, s * 0.4, Math.max(1, s * 0.012));
  const w = s * 0.17, sb = foot - s * 0.1, st = top + s * 0.26;
  poly(g, [[cx - w, sb], [cx - w, st], [cx, top], [cx - w * 0.2, st + s * 0.04], [cx - w * 0.2, sb + s * 0.02]], cL);
  poly(g, [[cx - w * 0.2, sb + s * 0.02], [cx - w * 0.2, st + s * 0.04], [cx, top], [cx + w * 0.45, st + s * 0.02], [cx + w * 0.45, sb + s * 0.01]], cM);
  poly(g, [[cx + w * 0.45, sb + s * 0.01], [cx + w * 0.45, st + s * 0.02], [cx, top], [cx + w, st], [cx + w, sb]], cD);
  g.fillStyle = `rgba(${St.glow},.35)`; g.beginPath(); g.ellipse(cx - w * 0.1, (st + sb) / 2, w * 0.35, (sb - st) * 0.32, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(cx - w * 0.82, st + s * 0.04, Math.max(1, s * 0.016), (sb - st) * 0.7);
  line(g, cx - w * 0.6, st + s * 0.1, cx - w * 0.3, st - s * 0.04, 'rgba(255,255,255,.5)', Math.max(0.7, s * 0.01));
  [[-1, 0.12, 0.2], [1, 0.1, 0.16]].forEach(([dd, ww, hh])=>{ const bx = cx + dd * s * 0.24; poly(g, [[bx - s * ww / 2, foot - s * 0.08], [bx, foot - s * 0.08 - s * hh], [bx + s * ww / 2, foot - s * 0.08]], dd < 0 ? cL : cD); });
}
const _twTall = new Map();
function twTall(d){
  if(_twTall.has(d.key)) return _twTall.get(d.key);
  const list = [];
  d.rows.forEach((row, y)=> [...row].forEach((c, x)=>{
    if((c === '*' || c === 'o') && d.rows[y - 1] && d.rows[y - 1][x] !== '#'){
      const St = twStyle(d);
      list.push({ x, y, w:1, up:TW_UP, draw:(g, dd, s)=> (c === 'o' ? twCrystal : twCandles)(g, dd, s, x, y, St) });
    }
  }));
  _twTall.set(d.key, list);
  return list;
}
function twFlame(g, cx, by, r, t, seed, gold){
  const f = 1 + 0.16 * Math.sin(t * 9 + seed * 5.3) + 0.08 * Math.sin(t * 23 + seed * 2.1), lean = Math.sin(t * 5 + seed) * r * 0.16;
  g.fillStyle = gold ? 'rgba(255,170,40,.9)' : 'rgba(170,90,255,.88)';
  g.beginPath(); g.moveTo(cx - r * 0.6, by); g.quadraticCurveTo(cx - r * 0.7, by - r * 1.1 * f, cx + lean, by - r * 2.3 * f); g.quadraticCurveTo(cx + r * 0.7, by - r * 1.1 * f, cx + r * 0.6, by); g.closePath(); g.fill();
  g.fillStyle = gold ? 'rgba(255,224,130,.95)' : 'rgba(225,190,255,.95)';
  g.beginPath(); g.moveTo(cx - r * 0.34, by); g.quadraticCurveTo(cx - r * 0.38, by - r * 0.8 * f, cx + lean * 0.6, by - r * 1.5 * f); g.quadraticCurveTo(cx + r * 0.38, by - r * 0.8 * f, cx + r * 0.34, by); g.closePath(); g.fill();
  ell(g, cx, by - r * 0.25, r * 0.16, r * 0.3, 'rgba(255,255,240,.95)');
}
/* what moves: the candles' flames; the crystals breathing; the circle's glow coming and going */
function twAnim(ctx, d, k, ox, oy, V, now){
  const St = twStyle(d), t = now / 1000, W = d.rows[0].length, H = d.rows.length;
  const p = 0.5 + 0.5 * Math.sin(t * 1.6);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(${St.glow},${(0.05 + p * 0.1).toFixed(3)})`; ctx.lineWidth = k * 0.22; ctx.beginPath(); ctx.arc(ox + W / 2 * k, oy + H / 2 * k, 2.6 * k, 0, TAU); ctx.stroke();
  ctx.lineWidth = k * 0.12; ctx.beginPath(); ctx.arc(ox + W / 2 * k, oy + H / 2 * k, 2.15 * k, 0, TAU); ctx.stroke();
  for(let y = V.y0; y <= V.y1; y++) for(let x = V.x0; x <= V.x1; x++){
    const c = d.rows[y] && d.rows[y][x];
    if(c === 'o'){ const q = 0.5 + 0.5 * Math.sin(t * 2.2 + x * 1.7 + y), gx = ox + (x + 0.48) * k, gy = oy + (y + 0.1) * k; ctx.fillStyle = rad(ctx, gx, gy, 0, k * 0.55, [[0, `rgba(${St.glow},${(0.12 + q * 0.18).toFixed(3)})`], [1, `rgba(${St.glow},0)`]]); ctx.fillRect(gx - k * 0.6, gy - k * 0.6, k * 1.2, k * 1.2); }
  }
  ctx.restore();
  for(let y = V.y0; y <= V.y1; y++) for(let x = V.x0; x <= V.x1; x++){
    if(!(d.rows[y] && d.rows[y][x] === '*')) continue;
    twCandleSpots(x, y).forEach(([vx, vy], i)=>{ const fx = ox + vx * k, fy = oy + vy * k; twFlame(ctx, fx, fy, k * 0.045, t + i * 0.41, x * 3 + y + i, St.master);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(ctx, fx, fy - k * 0.05, 0, k * 0.5, [[0, `rgba(${St.glow},.18)`], [1, `rgba(${St.glow},0)`]]); ctx.fillRect(fx - k * 0.5, fy - k * 0.55, k, k); ctx.restore(); });
  }
}
PAINTERS.tower = {
  handles:(d)=> /^tower_\d+$/.test(d.key || '') && !!d.tower,
  sig:(d)=> 'tw' + (d.tower || 0) + ':' + rmSig(d),
  ground:twGround,
  anim:twAnim,
  tall:twTall,
  standable:(d, x, y)=> !!(d.rows[y] && d.rows[y][x] && d.rows[y][x] !== '#'),
  bg:'#0c0910',
};

return { start, free, handles, kindOf, PAINTERS, info:(d)=> cInfo(d), roomInfo:(d)=> rmInfo(d), stats:()=> ({ key:P.key, sig:P.sig, kind:P.kind }) };
})();
/* 13-walkmap.js's hook: a deck drawn here starts its canvas as it is shown */
function deckArtStart(world, d){ try { R5ART.start(world, d); } catch(e){ console.error('r5 art start:', e); } }
