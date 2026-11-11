/* ============================================================
   29-fx.js — BATTLE EFFECTS (4.15)
   The designer: "Do you think you'd be able to do FX art for battle skills, please? I'm thinking most moves of a
   certain type can use the same art, but special moves, very high and ultra moves can have their own art."

   Pixel art, drawn in code at the monsters' own pixel size (their sprites are 96×96 pixel art, drawn about 2 CSS px a
   pixel), so an effect sits with them rather than over them. Two canvases over the fight: one behind your monsters
   (the far side, and anything flying away from you) and one in front of them (what lands on yours), both under the
   names and health bars. Every pixel is written into a buffer of its own and put down once a frame, so nothing is
   smoothed: no blur, no anti-aliasing, a fade is a dither.

   How a move plays:
   - playEffect (05-battle-flow.js) asks fxPlay first: the move's own art (FX_MOVES, by name), or its type's (FX_TYPES).
     Its `cast` plays at once (a gathering at the one who made it, a shot on its way).
   - Each blow that lands flashes its target (flashHit), and flashHit asks fxStruck: the move's `impact` bursts there,
     as the damage number comes up. A barrage shows a burst a strike; a dodged blow shows none.
   - A move with no art of its own and a type without art yet: nothing, as before (the hit flash and the number).

   (4.16) The designer's notes on the first draft: shots twice the size ("increase the sizes of the projectiles by about 2x
   diameter for all moves"), sparks a quarter bigger, Fairy's sparks pink glitter rather than hearts, what rains down half
   as wide again and always from the side it was sent from ("from the top left against enemies and top right against
   players"); a buff turns its monster a silhouette with shimmering waves rising through it; the screen shakes as the
   blow lands ("at the same time when the hit sound and flashing sprites are played"), a little for every damaging
   Ultimate and Max, more for a legendary's Power 2, Ultimate and Max; a third canvas, behind theirs, for what burns
   behind a monster.
   ============================================================ */

const FX = {
  on:true,
  ctx:null,                 // the move playing: { name, recipe, side, from, to, t0, strikes, until }
  list:[],                  // effects running: { t0, dur, layer, step(fx, t, dt, e) }
  raf:0, last:0,
  P:2, W:0, H:0, ox:0, oy:0, // pixel size (CSS px), canvas size (pixels), the stage's corner on screen
  layers:{},                // under / back / front: { cv, g, img, buf }
  masks:{},                 // a sprite's shape and colours, by its picture, for a glow over it
  shookAt:0, shakes:[],     // (4.16) the last shake, and a record of them (the tests read it)
};
/* (4.16) The canvases, back to front: `under` behind every sprite (theirs stand below the other two), `back` over theirs
   and behind yours, `front` over yours. */
const FX_LAYERS = ['under', 'back', 'front'];

/* ---------- colours ---------- */
/* Six to a ramp, brightest first: the hot core, the body, the rim, the shadow. */
const FX_PAL = {
  Fire:     ['#fffbe6', '#ffe45c', '#ffa62b', '#f0561d', '#b0261a', '#5c1612'],
  Water:    ['#f4fdff', '#aeeaff', '#5cc1f7', '#2c7fd8', '#1d4a9c', '#122a5c'],
  Grass:    ['#f4ffe0', '#c4f07a', '#6fcb43', '#36953a', '#1f5f2c', '#123a1c'],
  Electric: ['#ffffff', '#fffab0', '#ffe03d', '#f5a91c', '#a8620f', '#54320a'],
  Ground:   ['#f6e8c4', '#dcb878', '#b08548', '#7a5530', '#4a321c', '#2a1c10'],
  Flying:   ['#ffffff', '#eaf6ff', '#c2e2f7', '#8db6d4', '#5a7f9c', '#36506a'],
  Physical: ['#ffffff', '#fff0cc', '#ffc670', '#e8843c', '#9c4624', '#4e2414'],
  Ghost:    ['#f5ecff', '#cdb0ff', '#9264f2', '#6236b8', '#361c6e', '#1a0d38'],
  Psychic:  ['#fff2fc', '#ffb8ec', '#f467d2', '#b8389f', '#6a1d61', '#360d32'],
  Dragon:   ['#f2f0ff', '#b2bbff', '#7377f2', '#4441c0', '#25217a', '#120f40'],
  Steel:    ['#ffffff', '#e8edf3', '#bac4d2', '#8490a3', '#4f5868', '#2b313c'],
  Fairy:    ['#ffffff', '#ffe8f6', '#ffbde3', '#f585c8', '#c0549a', '#6e2a58'],
  Smoke:    ['#d8d0c8', '#a89c92', '#7c7068', '#564c46', '#3a322e', '#221c1a'],
  Gold:     ['#fffdf0', '#fff1a6', '#ffd24a', '#f0a020', '#b86a12', '#6a3a0c'],
};
const _fxRGB = {};
function fxRGB(hex){
  let v = _fxRGB[hex];
  if(v === undefined){
    const n = parseInt(hex.slice(1), 16);
    v = _fxRGB[hex] = ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0;   // ABGR, as ImageData wants it on this end
  }
  return v;
}
function fxRamp(name){ return (FX_PAL[name] || FX_PAL.Fire).map(fxRGB); }
/* (4.16) A colour that lets a little of what is under it through (`a` 0–1): the dark laid over a backlit monster. */
function fxRGBA(hex, a){ return ((fxRGB(hex) & 0x00ffffff) | (Math.round(fxClamp(a, 0, 1) * 255) << 24)) >>> 0; }

/* A seeded random, so an effect looks the same each frame it is drawn. */
function fxRand(seed){ let s = (seed >>> 0) || 1; return ()=>{ s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
/* The 4×4 ordered dither: a pixel stands while its threshold is under the cover wanted. */
const FX_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function fxCover(x, y, a){ return a >= 1 || (a > 0 && (FX_BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16 < a); }
const fxClamp = (v, a, b)=> v < a ? a : v > b ? b : v;
const fxEaseOut = u=> 1 - (1 - u) * (1 - u);
const fxEaseIn = u=> u * u;

/* ---------- the canvases ---------- */
function fxCss(){
  if(document.getElementById('fxCss')) return;
  const s = document.createElement('style');
  s.id = 'fxCss';
  s.textContent = `
    .fx-px{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated;image-rendering:crisp-edges;}
    .fx-px.under{z-index:-1;}   /* (4.16) behind every sprite: the screen is its own layer above the backdrop, so this sits on it */
    .fx-px.back{z-index:5;}
    .fx-px.front{z-index:8;}
    body.ultra-invert .fx-px{filter:invert(1) hue-rotate(180deg);}   /* an Ultra turns the screen over: the art keeps its own colours */
    html.ultra-invert{filter:invert(1) hue-rotate(180deg);transition:filter .12s;}   /* (4.18) the whole screen, from the page's root (its backdrop too) */
    html.ultra-invert .fx-px, html.ultra-invert #fxLayer{filter:invert(1) hue-rotate(180deg) !important;}   /* …the art in its own colours (the designer: "the ultra moves' fx and impact splashes/explosions/waves should be in ordinary colour, not inverted") */
    html.fx-invert{filter:invert(1) hue-rotate(180deg);}              /* (4.16) Heavensplitter's critical: the whole screen over, its backdrop too… */
    html.fx-invert .fx-px, html.fx-invert .fx-keep{filter:invert(1) hue-rotate(180deg) !important;}   /* …all but the art and the Monkey King */
    html.fx-invert .crowned-aura.fx-keep{filter:drop-shadow(0 0 10px rgba(255,209,102,.95)) drop-shadow(0 0 24px rgba(255,180,60,.6)) invert(1) hue-rotate(180deg) !important;}   /* crowned: his glow kept gold too */
  `;
  document.head.appendChild(s);
}
/* Your monster's sprite: what sets the pixel. */
function fxRefSprite(){
  const me = (typeof pid === 'function') ? document.getElementById(pid('playerBob')) : null;
  return (me && me.querySelector('img')) || document.querySelector('#battleStage .player-avatar img') ||
         document.querySelector('#battleStage .enemy-card .avatar-layer img');
}
/* Both canvases, sized to the stage now (a fight is drawn afresh often: they are made again as needed). */
function fxReady(){
  const stage = document.getElementById('battleStage');
  if(!stage) return false;
  fxCss();
  const r = stage.getBoundingClientRect();
  if(!(r.width > 0 && r.height > 0)) return false;
  const img = fxRefSprite();
  let P = 2;
  if(img){ const w = img.getBoundingClientRect().width, n = img.naturalWidth || 96; if(w > 0 && n > 0) P = Math.max(1.25, w / n); }
  const W = Math.max(1, Math.round(r.width / P)), H = Math.max(1, Math.round(r.height / P));
  FX.P = r.width / W; FX.W = W; FX.H = H; FX.ox = r.left; FX.oy = r.top;
  FX_LAYERS.forEach(k=>{
    let L = FX.layers[k];
    if(!L || !L.cv.isConnected || L.cv.parentNode !== stage){
      const cv = document.createElement('canvas');
      cv.className = 'fx-px ' + k;
      cv.setAttribute('aria-hidden', 'true');
      stage.appendChild(cv);
      L = FX.layers[k] = { cv, g:cv.getContext('2d'), img:null, buf:null, dirty:false };
    }
    if(L.cv.width !== W || L.cv.height !== H || !L.img){
      L.cv.width = W; L.cv.height = H;
      L.img = L.g.createImageData(W, H);
      L.buf = new Uint32Array(L.img.data.buffer);
    }
  });
  return true;
}
/* One pixel, on a layer's buffer. */
function fxSet(L, x, y, c){
  x = x | 0; y = y | 0;
  if(x < 0 || y < 0 || x >= FX.W || y >= FX.H) return;
  L.buf[y * FX.W + x] = c;
}

/* ---------- where things are ---------- */
/* The middle of a monster's sprite on the canvas (pixels), by the id of its card or its bob. */
function fxSpriteOf(id){
  const el = id ? document.getElementById(id) : null;
  if(!el) return null;
  return el.querySelector('.avatar-layer img, .bob img, img') || el;
}
function fxAnchor(id, fallback){
  const el = fxSpriteOf(id);
  if(!el) return fallback || null;
  const r = el.getBoundingClientRect();
  if(!(r.width > 0)) return fallback || null;
  /* a sprite stands in the lower part of its square: aim at its body, a little below the middle */
  return { x:(r.left + r.width / 2 - FX.ox) / FX.P, y:(r.top + r.height * 0.58 - FX.oy) / FX.P, w:r.width / FX.P, h:r.height / FX.P,
           foot:(r.top + r.height * 0.92 - FX.oy) / FX.P, id };
}
function fxSideOf(id){ return !id ? null : /^enemy-/.test(id) ? 'enemy' : /Bob/.test(id) ? 'player' : null; }
function fxEnemyRowMiddle(){
  const ids = (ui.battle && ui.battle.enemies || []).map((e, i)=> e && e.hp > 0 ? 'enemy-' + i : null).filter(Boolean);
  const pts = ids.map(id=> fxAnchor(id)).filter(Boolean);
  if(!pts.length) return { x:FX.W * 0.7, y:FX.H * 0.2, w:40, h:40, foot:FX.H * 0.3 };
  return { x:pts.reduce((a, p)=> a + p.x, 0) / pts.length, y:pts[0].y, w:40, h:40, foot:pts[0].foot };
}
/* (4.16) The canvas over a sprite and the one behind it: theirs stand below `back` (so it is over them) and above
   `under`; yours stand between `back` and `front`. */
const fxOverOf = id=> /^enemy-/.test(id || '') ? 'back' : 'front';
const fxUnderOf = id=> /^enemy-/.test(id || '') ? 'under' : 'back';
const fxUnderFor = side=> side === 'player' ? 'back' : 'under';
/* (4.16) The monster behind an id: one of theirs, the Monkey King beside you, or one of yours on the field. */
function fxMonOf(id){
  const b = ui.battle;
  if(!b || !id) return null;
  if(/^enemy-\d+$/.test(id)) return b.enemies[+id.slice(6)] || null;
  if(id === 'allyBob'){ const A = typeof battleAlly === 'function' ? battleAlly() : null; return A ? A.mon : null; }
  try { if(typeof playerField === 'function' && typeof pid === 'function'){ const m = playerField().find(x=> x && pid('playerBob', x) === id); if(m) return m; } } catch(e){}
  return typeof activeMon === 'function' ? activeMon() : null;
}
function fxSpeciesOf(id){ const m = fxMonOf(id); return m ? m.species : null; }
/* (4.22) …and the other way: where a monster stands on the stage (one of theirs, the Monkey King, one of yours on the
   field), or null (one of yours on the bench). */
function fxIdOfMon(m){
  const b = ui.battle;
  if(!b || !m) return null;
  const i = (b.enemies || []).indexOf(m);
  if(i >= 0) return 'enemy-' + i;
  try { const A = typeof battleAlly === 'function' ? battleAlly() : null; if(A && A.mon === m) return 'allyBob'; } catch(e){}
  try { if(typeof playerField === 'function' && typeof pid === 'function' && playerField().includes(m)) return pid('playerBob', m); } catch(e){}
  return null;
}
/* (4.22) Art for what happens beside a move's own (a stone's passive firing, shields gained or lost): `fn` run once the
   fight is drawn — its canvases ready and one of `need`'s sprites on the stage — after `delay` ms; tried again every
   120 ms, `tries` times (a passive can fire before its fight is first drawn), then let go (`fail`). Nothing if the
   effects are off, or the fight it was for is over. */
function fxCue(fn, o){
  o = o || {};
  const b0 = ui.battle, fail = ()=>{ if(o.fail) try { o.fail(); } catch(e){} };
  let left = o.tries == null ? 20 : o.tries;
  const go = ()=>{
    if(!FX.on || !ui.battle || (b0 && ui.battle !== b0)) return fail();
    const need = typeof o.need === 'function' ? o.need() : o.need;
    if(fxReady() && (!need || !need.length || need.some(id=> !!fxAnchor(id)))){ try { fn(); } catch(e){ fxErr(e); } return; }
    if(left-- > 0) setTimeout(go, 120);
    else fail();
  };
  setTimeout(go, o.delay || 0);
}

/* ---------- the frame ---------- */
function fxAdd(e){
  e.t0 = (e.t0 != null) ? e.t0 : performance.now();
  e.layer = e.layer || 'back';
  FX.list.push(e);
  if(!FX.raf) FX.raf = requestAnimationFrame(fxFrame);
  return e;
}
function fxFrame(now){
  FX.raf = 0;
  if(!fxReady()){ FX.list = []; return; }
  const dt = FX.last ? Math.min(0.05, (now - FX.last) / 1000) : 1 / 60;
  FX.last = now;
  const back = FX.layers.back;
  FX_LAYERS.forEach(k=> FX.layers[k].buf.fill(0));
  /* (4.18) Each canvas is drawn in its entries' order — and by their `z` first (a stable sort): what lies on a sprite's
     own surface (a buff's ripple, steel's sheen, a backlit monster, a glow: z -1) under everything else drawn over that
     sprite (the designer: "The new rippling wave on monsters who receive buffs now obscures the very high move
     animations such as spike armour"), an Ultra's orb (z 1) over its beams. */
  const cur = FX.list.some(e=> e.z) ? FX.list.slice().sort((p, q)=> (p.z || 0) - (q.z || 0)) : FX.list;
  FX.list = [];                                       // what a step adds (fxLater, a host's end) lands here, kept below
  const keep = cur.filter(e=>{
    const t = now - e.t0;
    if(t < 0) return true;
    if(t > e.dur) return false;
    try { e.step(FX.layers[e.layer] || back, t, dt, e); } catch(err){ fxErr(err); return false; }
    return true;
  });
  FX.list = keep.concat(FX.list);
  FX_LAYERS.forEach(k=>{ const L = FX.layers[k]; L.g.putImageData(L.img, 0, 0); });
  if(FX.list.length) FX.raf = requestAnimationFrame(fxFrame);
  else FX.last = 0;
}

/* Something to start a moment later, on the effects' own clock (not a timer: it waits for the frames). */
function fxLater(ms, fn){
  let done = false;
  return fxAdd({ layer:'back', dur:ms + 1000, step(L, t){ if(!done && t >= ms){ done = true; try { fn(); } catch(e){ fxErr(e); } } } });
}
/* An effect that fails is dropped quietly (a fight never stops for its art); the tests read what failed. */
function fxErr(e){ (FX.errors = FX.errors || []).push(String(e && e.message || e) + ' @ ' + String(e && e.stack || '').split('\n')[1]); if(FX.errors.length > 50) FX.errors.shift(); }

/* ---------- shapes ---------- */
/* Every pixel within R of (cx, cy) asks `f(dx, dy, d, ang)` for its colour (0: none). */
function fxPaint(L, cx, cy, R, f){
  cx = Math.round(cx); cy = Math.round(cy); R = Math.ceil(R);
  for(let y = -R; y <= R; y++){
    const yy = cy + y;
    if(yy < 0 || yy >= FX.H) continue;
    for(let x = -R; x <= R; x++){
      const xx = cx + x;
      if(xx < 0 || xx >= FX.W) continue;
      const c = f(x, y, Math.sqrt(x * x + y * y), Math.atan2(y, x), xx, yy);
      if(c) L.buf[yy * FX.W + xx] = c;
    }
  }
}
function fxDisc(L, cx, cy, r, c, cover){
  if(r <= 0) return;
  fxPaint(L, cx, cy, r + 1, (x, y, d, a, X, Y)=> d <= r && (cover == null || fxCover(X, Y, cover)) ? c : 0);
}
function fxRing(L, cx, cy, r, th, c, cover, sy){
  sy = sy || 1;
  const R = r + 1;
  fxPaint(L, cx, cy, R, (x, y, d0, a, X, Y)=>{
    const d = Math.sqrt(x * x + (y / sy) * (y / sy));
    return (d <= r && d > r - th && (cover == null || fxCover(X, Y, cover))) ? c : 0;
  });
}
function fxLine(L, x0, y0, x1, y1, c, w, cover){
  w = w || 1;
  if(w >= 4) return fxBand(L, x0, y0, x1, y1, w, c, cover);   // (4.16) a wide one as a filled band: the brush cost w² a step
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for(let i = 0; i <= n; i++){
    const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
    for(let a = 0; a < w; a++) for(let b = 0; b < w; b++){
      const X = Math.round(x - (w - 1) / 2 + a), Y = Math.round(y - (w - 1) / 2 + b);
      if(cover == null || fxCover(X, Y, cover)) fxSet(L, X, Y, c);
    }
  }
}
/* A flame's ball: bands of colour from the rim in (`cols`, rim first), whose edge wanders (`seed`, moving with `t`),
   and a dark line round it (`outline`: a colour, or false), as the sprites have. `up` lets the top reach further. */
function fxFlameBall(L, cx, cy, r, ramp, t, seed, opts){
  opts = opts || {};
  const k = seed || 1, wob = opts.wob == null ? 0.22 : opts.wob, cover = opts.cover == null ? 1 : opts.cover;
  const p1 = (k * 1.7) % 6.28, p2 = (k * 2.9) % 6.28, p3 = (k * 4.3) % 6.28;
  const edge = a=> 1 + wob * (0.55 * Math.sin(3 * a + p1 + t * 0.011) + 0.3 * Math.sin(5 * a + p2 - t * 0.017) + 0.15 * Math.sin(9 * a + p3 + t * 0.023));
  const up = opts.up || 0;
  const cols = opts.cols || [ramp[4], ramp[3], ramp[2], ramp[1], ramp[0]];
  const n = cols.length, line = opts.outline === false ? 0 : (opts.outline || ramp[5]);
  fxPaint(L, cx, cy, r * (1 + wob + up) + 2, (x, y, d, a, X, Y)=>{
    if(!fxCover(X, Y, cover)) return 0;
    const reach = r * edge(a) * (1 + up * Math.max(0, -Math.sin(a)));
    if(d > reach + (line ? 1 : 0)) return 0;
    if(d > reach) return line;
    return cols[Math.min(n - 1, Math.floor((1 - d / reach) * n * 0.999))];
  });
  if(opts.core) fxDisc(L, cx, cy, opts.core, ramp[0]);
}

/* ---------- more shapes ---------- */
/* A filled polygon ([[x, y], …]), scanline by scanline. */
function fxPoly(L, pts, c, cover){
  let y0 = 1e9, y1 = -1e9;
  pts.forEach(p=>{ if(p[1] < y0) y0 = p[1]; if(p[1] > y1) y1 = p[1]; });
  const n = pts.length;
  for(let y = Math.floor(y0); y <= Math.ceil(y1); y++){
    const yc = y + 0.5, xs = [];
    for(let i = 0; i < n; i++){
      const a = pts[i], b = pts[(i + 1) % n];
      if((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q)=> p - q);
    for(let k = 0; k + 1 < xs.length; k += 2)
      for(let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) if(cover == null || fxCover(x, y, cover)) fxSet(L, x, y, c);
  }
}
/* (4.16) A wide line as a filled band, `w` across, its ends square and reaching half its width past each point (as the
   old square brush did). A beam crossing the screen 20 pixels wide cost the brush 400 pixels a step; this costs its
   area once. */
function fxBand(L, x0, y0, x1, y1, w, c, cover){
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy), h = w / 2;
  if(d < 0.5){ fxDisc(L, x0, y0, h, c, cover); return; }
  const ux = dx / d, uy = dy / d, nx = -uy * h, ny = ux * h, ax = x0 - ux * h, ay = y0 - uy * h, bx = x1 + ux * h, by = y1 + uy * h;
  fxPoly(L, [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]], c, cover);
}
/* …with a dark line round it, a pixel wide. */
function fxPolyLined(L, pts, fill, line, cover){
  let cx = 0, cy = 0;
  pts.forEach(p=>{ cx += p[0]; cy += p[1]; });
  cx /= pts.length; cy /= pts.length;
  if(line) fxPoly(L, pts.map(([x, y])=>{ const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1; return [x + dx / d * 1.3, y + dy / d * 1.3]; }), line, cover);
  fxPoly(L, pts, fill, cover);
}
function fxRot(pts, cx, cy, ang){ const c = Math.cos(ang), s = Math.sin(ang); return pts.map(([x, y])=> [cx + x * c - y * s, cy + x * s + y * c]); }
/* A twinkle: a cross of light, thick at its heart, with a smaller diagonal cross. */
function fxStar4(L, cx, cy, r, c, core){
  cx = Math.round(cx); cy = Math.round(cy); r = Math.max(1, Math.round(r));
  for(let i = -r; i <= r; i++){
    const w = Math.abs(i) <= r * 0.3 && r > 2 ? 1 : 0;
    for(let j = -w; j <= w; j++){ fxSet(L, cx + i, cy + j, c); fxSet(L, cx + j, cy + i, c); }
  }
  const d = Math.round(r * 0.4);
  for(let i = -d; i <= d; i++){ fxSet(L, cx + i, cy + i, c); fxSet(L, cx + i, cy - i, c); }
  if(core) fxSet(L, cx, cy, core);
}
/* A zigzag of lightning from one point to another; returns its corners (for forks). */
function fxBolt(L, x0, y0, x1, y1, seed, c, w, jag, segs){
  const rnd = fxRand(seed), len = Math.hypot(x1 - x0, y1 - y0), n = segs || Math.max(3, Math.round(len / 7));
  const nx = -(y1 - y0) / (len || 1), ny = (x1 - x0) / (len || 1), pts = [[x0, y0]];
  for(let i = 1; i < n; i++){ const u = i / n, off = (rnd() - 0.5) * 2 * (jag == null ? 5 : jag); pts.push([x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off]); }
  pts.push([x1, y1]);
  for(let i = 0; i + 1 < pts.length; i++) fxLine(L, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c, w || 1);
  return pts;
}
/* A lump of rock: lit from the top left, shaded below, a dark line round it. pal: [light, mid, dark, line] */
function fxRock(L, cx, cy, r, ang, seed, pal, cover){
  const rnd = fxRand(seed), n = 7, pts = [];
  for(let i = 0; i < n; i++){ const a = ang + i / n * Math.PI * 2, rr = r * (0.72 + rnd() * 0.38); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  fxPolyLined(L, pts, pal[1], pal[3], cover);
  if(r >= 2.5){
    fxPoly(L, pts.map(([x, y])=> [cx + (x - cx) * 0.62 + r * 0.22, cy + (y - cy) * 0.55 + r * 0.32]), pal[2], cover);
    fxPoly(L, pts.map(([x, y])=> [cx + (x - cx) * 0.38 - r * 0.25, cy + (y - cy) * 0.38 - r * 0.28]), pal[0], cover);
  }
}
/* A leaf, pointed both ends, its rib down the middle. pal: [light, mid, dark, line] */
function fxLeaf(L, cx, cy, len, ang, pal, cover){
  const pts = [], n = 8, wd = len * 0.3;
  for(let i = 0; i <= n; i++){ const u = i / n; pts.push([(u - 0.5) * len, Math.sin(u * Math.PI) * wd]); }
  for(let i = n - 1; i >= 1; i--){ const u = i / n; pts.push([(u - 0.5) * len, -Math.sin(u * Math.PI) * wd]); }
  fxPolyLined(L, fxRot(pts, cx, cy, ang), pal[1], pal[3], cover);
  if(len >= 5){
    const c = Math.cos(ang), s = Math.sin(ang);
    fxLine(L, cx - c * len * 0.4, cy - s * len * 0.4, cx + c * len * 0.38, cy + s * len * 0.38, pal[2], 1, cover);
    fxSet(L, Math.round(cx - c * len * 0.12 - s * wd * 0.5), Math.round(cy - s * len * 0.12 + c * wd * 0.5), pal[0]);
  }
}
/* A sickle of wind, its belly towards `ang`. pal: [light, mid, dark, line] */
function fxCrescent(L, cx, cy, r, ang, pal, cover){
  const pts = [], n = 10, span = 1.15, d = r * 0.32, ri = r * 0.8;
  for(let i = 0; i <= n; i++){ const a = -span + 2 * span * i / n; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for(let i = n; i >= 0; i--){ const a = -span + 2 * span * i / n; pts.push([-d + Math.cos(a) * ri, Math.sin(a) * ri]); }
  fxPolyLined(L, fxRot(pts, cx, cy, ang), pal[1], pal[3], cover);
  const c = Math.cos(ang), s = Math.sin(ang);
  fxLine(L, cx + c * r * 0.86 - s * r * 0.4, cy + s * r * 0.86 + c * r * 0.4, cx + c * r * 0.86 + s * r * 0.4, cy + s * r * 0.86 - c * r * 0.4, pal[0], 1, cover);
}
/* A comic burst of a blow: a star of `n` spikes, white at its heart, ringed with the type's colours. */
function fxImpactStar(L, cx, cy, r, n, rot, cols, line, cover){
  const pts = [];
  for(let i = 0; i < n * 2; i++){ const a = rot + i * Math.PI / n, rr = i % 2 ? r * 0.48 : r * (0.88 + 0.12 * Math.sin(i * 7.1)); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  fxPolyLined(L, pts, cols[0], line, cover);
  if(cols[1]) fxPoly(L, pts.map(([x, y])=> [cx + (x - cx) * 0.62, cy + (y - cy) * 0.62]), cols[1], cover);
  if(cols[2]) fxPoly(L, pts.map(([x, y])=> [cx + (x - cx) * 0.32, cy + (y - cy) * 0.32]), cols[2], cover);
}
/* A small heart, a dark line round it. */
const FX_HEART = ['.oo.oo.', 'offoffo', 'offfffo', '.offfo.', '..ofo..', '...o...'];
function fxHeart(L, x, y, c, line){
  x = Math.round(x) - 3; y = Math.round(y) - 3;
  FX_HEART.forEach((r, j)=>{ for(let i = 0; i < 7; i++){ const k = r[i]; if(k === 'f') fxSet(L, x + i, y + j, c); else if(k === 'o' && line) fxSet(L, x + i, y + j, line); } });
}

/* ---------- particles ---------- */
/* A spray of particles: each { x, y, vx, vy, life, size, ramp, grav, drag, shape }. One effect draws them all. */
function fxSpray(layer, parts, dur){
  let last = 0;
  return fxAdd({ layer, dur:dur || 900, step(L, t, dt){
    const d = (t - last) / 1000; last = t;
    parts.forEach(p=>{
      if(t < (p.delay || 0)) return;
      const age = t - (p.delay || 0);
      if(age > p.life) return;
      p.vy += (p.grav || 0) * d; p.vx *= Math.max(0, 1 - (p.drag || 0) * d); p.vy *= Math.max(0, 1 - (p.drag || 0) * d);
      p.x += p.vx * d; p.y += p.vy * d;
      const u = age / p.life, ramp = p.ramp;
      const c = ramp[Math.min(ramp.length - 1, Math.floor(u * ramp.length))];
      if(p.draw){ p.draw(L, p.x, p.y, u, c, age); return; }
      const s0 = (p.size || 1) > 1 ? p.size * FX_PART : 1;   // (4.16) a quarter bigger
      const s = p.shrink ? Math.max(1, Math.round(s0 * (1 - u))) : Math.round(s0);
      if(p.shape === 'streak'){ fxLine(L, p.x, p.y, p.x - p.vx * 0.03, p.y - p.vy * 0.03, c, 1); return; }
      if(p.shape === 'flame'){                                    // a small teardrop of flame, its point up
        const X = Math.round(p.x), Y = Math.round(p.y), rr = Math.max(1, s / 2);
        if(p.outline) fxDisc(L, X, Y, rr + 1, p.outline);
        fxDisc(L, X, Y, rr, c);
        for(let j = 1; j <= s; j++) fxSet(L, X, Y - Math.round(rr) - j + 1, c);
        if(p.outline) fxSet(L, X, Y - Math.round(rr) - s, p.outline);
        return;
      }
      if(p.shape === 'tall'){ for(let j = 0; j < s + 1; j++) fxSet(L, Math.round(p.x), Math.round(p.y) + j, c); return; }
      if(s <= 1) fxSet(L, Math.round(p.x), Math.round(p.y), c);
      else fxDisc(L, p.x, p.y, s / 2, c);
    });
  } });
}
/* (4.16) The designer: "the particle sizes are ok and should stay the same or maybe increase to 1.25x perhaps". */
const FX_PART = 1.25;
function fxBurstParts(x, y, n, o){
  o = o || {};
  const rnd = fxRand(o.seed || (x * 31 + y * 17 + n));
  const out = [];
  for(let i = 0; i < n; i++){
    const a = (o.ang != null ? o.ang : 0) + (o.spread != null ? (rnd() - 0.5) * o.spread : rnd() * Math.PI * 2);
    const v = (o.vmin || 40) + rnd() * ((o.vmax || 120) - (o.vmin || 40));
    const rs = rnd();
    out.push({ x:x + (rnd() - 0.5) * (o.jit || 2), y:y + (rnd() - 0.5) * (o.jit || 2), vx:Math.cos(a) * v, vy:Math.sin(a) * v,
      life:(o.lmin || 250) + rnd() * ((o.lmax || 550) - (o.lmin || 250)), size:o.size || (rs < 0.12 ? 2.4 : rs < 0.42 ? 1.6 : 1), ramp:o.ramp,
      grav:o.grav || 0, drag:o.drag == null ? 2 : o.drag, delay:o.delay ? rnd() * o.delay : 0, shape:o.shape, shrink:o.shrink });
  }
  return out;
}

/* ---------- a sprite's glow ---------- */
/* Its shape, read once from its picture (same origin), for a glow laid exactly over it. */
function fxMask(img){
  const src = img && img.currentSrc || img && img.src;
  if(!src || !img.complete || !img.naturalWidth) return null;
  if(FX.masks[src]) return FX.masks[src];
  try {
    const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h), col = new Uint32Array(w * h), lum = new Uint8Array(w * h);
    let top = h, bot = 0, left = w, right = 0;
    for(let i = 0; i < w * h; i++){
      m[i] = d[i * 4 + 3] > 40 ? 1 : 0;
      col[i] = ((255 << 24) | (d[i * 4 + 2] << 16) | (d[i * 4 + 1] << 8) | d[i * 4]) >>> 0;   // (4.16) its own colours, for a clone
      lum[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) | 0;              // and its light and dark, for a tint
      if(m[i]){ const y = (i / w) | 0, x = i - y * w; if(y < top) top = y; if(y > bot) bot = y; if(x < left) left = x; if(x > right) right = x; }   // (4.18) and its sides
    }
    return (FX.masks[src] = { w, h, m, c:col, lum, top, bot, left, right });
  } catch(e){ return (FX.masks[src] = null); }
}
/* (4.16) A sprite as the canvas sees it: where its picture lies on ours, and how its pixels map onto ours. */
function fxSpriteBox(id){
  const img = fxSpriteOf(id);
  if(!img || img.tagName !== 'IMG') return null;
  const mk = fxMask(img);
  if(!mk) return null;
  const r = img.getBoundingClientRect();
  if(!(r.width > 0 && r.height > 0)) return null;
  return { img, mk, x0:(r.left - FX.ox) / FX.P, y0:(r.top - FX.oy) / FX.P, W:Math.ceil(r.width / FX.P), H:Math.ceil(r.height / FX.P),
           sx:mk.w / (r.width / FX.P), sy:mk.h / (r.height / FX.P) };
}
/* the picture's pixel under ours (x, y from the box's corner), or -1 */
function fxBoxAt(B, x, y){ const u = Math.floor(x * B.sx), v = Math.floor(y * B.sy); return (u >= 0 && v >= 0 && u < B.mk.w && v < B.mk.h && B.mk.m[v * B.mk.w + u]) ? v * B.mk.w + u : -1; }
const fxBoxEdge = (B, x, y)=> fxBoxAt(B, x - 1, y) >= 0 || fxBoxAt(B, x + 1, y) >= 0 || fxBoxAt(B, x, y - 1) >= 0 || fxBoxAt(B, x, y + 1) >= 0;

/* (4.18) Where a sprite's picture begins at the top (canvas y), for what hangs just over its head. */
function fxSpriteTop(id){
  const B = fxSpriteBox(id);
  if(B) return B.y0 + B.mk.top / B.sy;
  const a = fxAnchor(id);
  return a ? a.y - a.h * 0.42 : null;
}
/* (4.18) The battlefield dimmed under the sprites (the designer: "apart from causing an invert, we might have to dim the
   background of the battlefield to create more contrast"; and of Nova: "dim the background so it looks bright"): a dark
   veil over the backdrop, on the canvas behind every sprite, before anything else drawn there. In over 150 ms, out over
   250 once every hold on it is let go (fxDimOn / fxDimOff). */
function fxDimOn(a){
  if(!FX.on || !ui.battle || !fxReady()) return;
  const e0 = FX.dimE, live = !!(e0 && e0.dur > 0 && FX.list.includes(e0));
  FX.dimHeld = live ? (FX.dimHeld || 0) + 1 : 1;
  FX.dimA = live ? Math.max(FX.dimA || 0, a || 0.45) : (a || 0.45);
  if(live){ if(e0.off){ e0.back = performance.now() - e0.t0; e0.from = e0.k; e0.off = 0; } return; }
  const e = FX.dimE = { layer:'under', z:-2, dur:60000, off:0, back:0, from:0, k:0, step(L, t){
    let k = e.back ? Math.min(1, e.from + (t - e.back) / 150) : Math.min(1, t / 150);
    if(e.off){ const u = (t - e.off) / 250; if(u >= 1){ e.dur = 0; return; } k = Math.min(k, e.k0 * (1 - u)); }
    e.k = k;
    if(k > 0.01) L.buf.fill(fxRGBA('#06050c', FX.dimA * k));
  } };
  fxAdd(e);
}
function fxDimOff(all){
  FX.dimHeld = all ? 0 : Math.max(0, (FX.dimHeld || 0) - 1);
  const e = FX.dimE;
  if(!FX.dimHeld && e && !e.off) { e.off = Math.max(1, performance.now() - e.t0); e.k0 = e.k; }
}
/* (4.16) A buff's look (the designer: "the monster turn yellow silhouette and have orange shimmering waves move upwards
   within the silhouette to show the buff nature of the move … do this for buffs, please"): the sprite in one colour, in
   three shades by its own light and dark (so it is still itself), bands of a second colour rising through it, and a
   rim of light round it. o: { ramp:[dark, mid, light], wave, rim, t, cover, speed (px a second), period, band } */
function fxTint(L, id, o){
  const B = fxSpriteBox(id);
  if(!B) return;
  const mk = B.mk, ramp = o.ramp, cv = o.cover == null ? 1 : o.cover, t = o.t || 0, sp = o.speed == null ? 34 : o.speed, per = o.period || 10, band = o.band || 2.4;
  for(let y = -1; y <= B.H; y++) for(let x = -1; x <= B.W; x++){
    const X = Math.round(B.x0 + x), Y = Math.round(B.y0 + y), i = fxBoxAt(B, x, y);
    if(i >= 0){
      if(!fxCover(X, Y, cv)) continue;
      let c = 0;
      if(o.wave){ const ph = ((y + t * sp / 1000 + Math.sin(x * 0.42 + t * 0.006) * 1.6) % per + per) % per; if(ph < band) c = ph < band * 0.45 && o.crest ? o.crest : o.wave; }
      if(!c){ const l = mk.lum[i]; c = l < 72 ? ramp[0] : l < 165 ? ramp[1] : ramp[2]; }
      fxSet(L, X, Y, c);
    } else if(o.rim && cv > 0.35 && fxBoxEdge(B, x, y) && fxCover(X, Y, cv)) fxSet(L, X, Y, o.rim);
  }
}
/* A buff's look, run for a while over one sprite: in over 140 ms, out over the last 220. */
function fxBuffLook(id, look, dur, delay){
  if(!id) return;
  const d0 = delay || 0, D = dur || 900;
  return fxAdd({ layer:fxOverOf(id), z:-1, dur:d0 + D, step(L, t){
    if(t < d0) return;
    const u = t - d0, cv = u < 140 ? u / 140 : u > D - 220 ? Math.max(0, (D - u) / 220) : 1;
    fxTint(L, id, Object.assign({ t:u, cover:cv }, look));
  } });
}
/* (4.16) Backlit (the designer: "turn the monster sprite very dark (overly black slightly transparent layer) to create
   the impression of being backlit strongly by bright flames"): near black over it, its own light and dark faintly kept,
   a hot edge just inside it and the light behind it showing round it. o: { a (0–1), edge, rim } */
function fxDark(L, id, o){
  const B = fxSpriteBox(id);
  if(!B) return;
  const a = o.a == null ? 1 : o.a, shades = [fxRGBA('#050303', 0.9 * a), fxRGBA('#120c09', 0.88 * a), fxRGBA('#21160f', 0.86 * a)];
  for(let y = -1; y <= B.H; y++) for(let x = -1; x <= B.W; x++){
    const X = Math.round(B.x0 + x), Y = Math.round(B.y0 + y), i = fxBoxAt(B, x, y);
    if(i >= 0){
      if(a <= 0) continue;
      const edge = o.edge && (fxBoxAt(B, x - 1, y) < 0 || fxBoxAt(B, x + 1, y) < 0 || fxBoxAt(B, x, y - 1) < 0);
      if(edge && fxCover(X, Y, a)){ fxSet(L, X, Y, o.edge); continue; }
      const l = B.mk.lum[i];
      fxSet(L, X, Y, shades[l < 72 ? 0 : l < 165 ? 1 : 2]);
    } else if(o.rim && fxBoxEdge(B, x, y) && fxCover(X, Y, a)) fxSet(L, X, Y, o.rim);
  }
}
/* (4.16) Metal (the designer: "glowing completely light grey with a diagonal white bloom like a metallic reflection
   running through it"): light grey in three shades by its own light and dark, and a band of white crossing it
   corner to corner with a softer glow either side. o: { pos (0–1 across), cover, ramp, white, rim } */
function fxSheen(L, id, o){
  const B = fxSpriteBox(id);
  if(!B) return;
  const ramp = o.ramp || [FX_STEEL[3], FX_STEEL[2], FX_STEEL[1]], white = o.white || FX_STEEL[0], cv = o.cover == null ? 1 : o.cover;
  const span = B.W + B.H * 0.6, at = -span * 0.15 + (o.pos || 0) * span * 1.3, w = o.width || 2.2;
  for(let y = -1; y <= B.H; y++) for(let x = -1; x <= B.W; x++){
    const X = Math.round(B.x0 + x), Y = Math.round(B.y0 + y), i = fxBoxAt(B, x, y), d = Math.abs(x + y * 0.6 - at);
    if(i >= 0){
      if(!fxCover(X, Y, cv)) continue;
      if(d < w){ fxSet(L, X, Y, white); continue; }
      if(d < w * 2.6 && fxCover(X, Y, 0.55)){ fxSet(L, X, Y, white); continue; }
      const l = B.mk.lum[i];
      fxSet(L, X, Y, ramp[l < 72 ? 0 : l < 165 ? 1 : 2]);
    } else if(fxBoxEdge(B, x, y) && fxCover(X, Y, cv)) fxSet(L, X, Y, d < w * 3 ? white : (o.rim || FX_STEEL[3]));
  }
}
/* (4.16) A copy of a sprite in its own colours, some of it showing (a dither), off to one side and wavering:
   the Monkey King's clones. o: { dx, dy, cover, wob, t } */
function fxClone(L, id, o){
  const B = fxSpriteBox(id);
  if(!B) return;
  const t = o.t || 0, wob = o.wob == null ? 1.2 : o.wob;
  for(let y = 0; y < B.H; y++){
    const sh = Math.sin(y * 0.5 + t * 0.02) * wob;
    for(let x = 0; x < B.W; x++){
      const i = fxBoxAt(B, x, y);
      if(i < 0) continue;
      const X = Math.round(B.x0 + (o.dx || 0) + x + sh), Y = Math.round(B.y0 + (o.dy || 0) + y);
      if(fxCover(X, Y, o.cover == null ? 0.5 : o.cover)) fxSet(L, X, Y, o.tint || B.mk.c[i]);
    }
  }
}
/* (4.18) A sprite's picture drawn anywhere (what leaves a monster: Gigaton Smash's steel images of it, Devastate's
   landings, Sonic Skydive's dive): its middle at (cx, cy), `scale`, turned by `rot` (radians), flipped (`flipX`,
   `flipY`); in its own colours, one colour (`tint`), or three shades of a `ramp` by its own light and dark; `edge` a
   colour round its outline; `band` (0–1) a bloom of `white` crossing it corner to corner; `cover` of it (a dither). */
function fxSpriteAt(L, id, cx, cy, o){
  let B = fxSpriteBox(id);
  if(!B) return;
  o = o || {};
  if(o.img && o.img !== B.img){                                      // another picture of it (its front), the size it stands at
    const M = fxMask(o.img);
    if(M) B = Object.assign({}, B, { mk:M, sx:M.w / B.W, sy:M.h / B.H });
  }
  const mk = B.mk, s = o.scale || 1, cv = o.cover == null ? 1 : o.cover, rot = o.rot || 0, c = Math.cos(rot), sn = Math.sin(rot);
  const mx = (mk.left + mk.right + 1) / 2 / B.sx, my = (mk.top + mk.bot + 1) / 2 / B.sy;                // its picture's own middle, in the box
  const hw = (mk.right - mk.left + 1) / 2 / B.sx, hh = (mk.bot - mk.top + 1) / 2 / B.sy;
  const R = Math.ceil(Math.hypot(hw, hh) * s) + 1, X0 = Math.round(cx), Y0 = Math.round(cy);
  const span = (mk.right - mk.left) / B.sx + (mk.bot - mk.top) / B.sy * 0.6, bandAt = o.band == null ? null : -span * 0.15 + o.band * span * 1.3;
  const at = (u, v)=> fxBoxAt(B, u + mx, v + my);
  for(let y = -R; y <= R; y++) for(let x = -R; x <= R; x++){
    let u = (x * c + y * sn) / s, v = (-x * sn + y * c) / s;
    if(o.flipX) u = -u;
    if(o.flipY) v = -v;
    const i = at(u, v);
    if(i < 0) continue;
    const X = X0 + x, Y = Y0 + y;
    if(cv < 1 && !fxCover(X, Y, cv)) continue;
    let col = o.ramp ? o.ramp[mk.lum[i] < 72 ? 0 : mk.lum[i] < 165 ? 1 : 2] : (o.tint || mk.c[i]);
    if(o.edge && (at(u - 1, v) < 0 || at(u + 1, v) < 0 || at(u, v - 1) < 0 || at(u, v + 1) < 0)) col = o.edge;
    else if(bandAt != null){ const d = Math.abs((u + hw) + (v + hh) * 0.6 - bandAt); if(d < 2.2 || (d < 5.5 && fxCover(X, Y, 0.55))) col = o.white || FX_STEEL[0]; }
    fxSet(L, X, Y, col);
  }
}
/* (4.18) A monster's picture from the front. Yours stand with their backs to you (<species>_back.png); theirs face you.
   Sonic Skydive shows yours from the front, diving at them (the designer: "its inverted front sprite"). Loaded once
   and kept; until it has loaded (or if there is none), its own picture. */
function fxFrontImg(id){
  const img = fxSpriteOf(id);
  if(!img || img.tagName !== 'IMG' || img.dataset.view !== 'back') return img;
  let src = null;
  try {
    const sp = img.dataset.species, st = +img.dataset.stageN || 0, cr = img.dataset.crowned === '1', ex = img.dataset.exalted === '1';
    const key = spriteCacheKey(sp, st, 'front', cr, ex), k0 = spriteKey(sp, st, cr, ex);
    const over = (typeof ASSETS !== 'undefined' && ASSETS.sprites) ? (ASSETS.sprites[k0 + '_front'] || ASSETS.sprites[k0]) : null;
    src = over || (typeof spriteResolved[key] === 'string' ? spriteResolved[key] : spritePath(sp, st, 'front', cr, ex));
  } catch(e){ return img; }
  if(!src) return img;
  FX.fronts = FX.fronts || {};
  let f = FX.fronts[src];
  if(!f){ f = FX.fronts[src] = new Image(); f.onerror = ()=>{ f.failed = true; }; f.src = src; }
  return (f.complete && f.naturalWidth && !f.failed) ? f : img;
}
/* (4.18) Where a sprite's picture has its middle (canvas), for what stands in for it. */
function fxSpriteMid(id){
  const B = fxSpriteBox(id);
  if(!B) { const a = fxAnchor(id); return a ? { x:a.x, y:a.y - a.h * 0.08, w:a.w * 0.6, h:a.h * 0.6 } : null; }
  return { x:B.x0 + (B.mk.left + B.mk.right + 1) / 2 / B.sx, y:B.y0 + (B.mk.top + B.mk.bot + 1) / 2 / B.sy, w:(B.mk.right - B.mk.left + 1) / B.sx, h:(B.mk.bot - B.mk.top + 1) / B.sy };
}
/* (4.18) A monster's own sprite hidden while its art stands in for it (Devastate, Sonic Skydive, Vengeance: it fades
   out, then comes back): an opacity on its picture until fxSpriteShow, given back on its own after `max` ms whatever
   happens. */
function fxSpriteHide(id, ms, max){
  const img = fxSpriteOf(id);
  if(!img || !img.style) return null;
  img.style.transition = 'opacity ' + (ms || 200) + 'ms';
  img.style.opacity = '0';
  FX.hidden = (FX.hidden || []).filter(h=> h.img !== img);
  const h = { img, id };
  FX.hidden.push(h);
  setTimeout(()=>{ if((FX.hidden || []).includes(h)) fxSpriteShow(id, 250, h); }, max || 6000);
  return h;
}
function fxSpriteShow(id, ms, h){
  if(h && !(FX.hidden || []).includes(h)) return false;          // (4.18) hidden again since (theirs, the next of yours it strikes), or back already
  const img = h ? h.img : fxSpriteOf(id);
  if(!img || !img.style) return false;
  img.style.transition = 'opacity ' + (ms || 200) + 'ms';
  img.style.opacity = '';
  FX.hidden = (FX.hidden || []).filter(x=> x.img !== img);
  return true;
}
/* (4.16) A colour over the top of a sprite, thickest at its crown and gone by `frac` of the way down (Curse). */
function fxTopTint(L, id, c, frac, a){
  const B = fxSpriteBox(id);
  if(!B) return;
  const top = B.mk.top / B.sy, bot = B.mk.bot / B.sy, depth = Math.max(1, (bot - top) * (frac || 0.45));
  for(let y = Math.floor(top); y <= top + depth; y++) for(let x = 0; x < B.W; x++){
    if(fxBoxAt(B, x, y) < 0) continue;
    const X = Math.round(B.x0 + x), Y = Math.round(B.y0 + y);
    if(fxCover(X, Y, a * (1 - (y - top) / depth))) fxSet(L, X, Y, c);
  }
}
/* Lays `c` over the sprite of `id`, `a` of it (a dither), and a rim `rim` round its edge. */
function fxGlow(L, id, c, a, rim){
  const img = fxSpriteOf(id);
  if(!img || img.tagName !== 'IMG') return;
  const mk = fxMask(img);
  if(!mk) return;
  const r = img.getBoundingClientRect();
  const x0 = (r.left - FX.ox) / FX.P, y0 = (r.top - FX.oy) / FX.P, sx = mk.w / (r.width / FX.P), sy = mk.h / (r.height / FX.P);
  const W = Math.ceil(r.width / FX.P), H = Math.ceil(r.height / FX.P);
  const at = (x, y)=>{ const u = Math.floor(x * sx), v = Math.floor(y * sy); return u >= 0 && v >= 0 && u < mk.w && v < mk.h && mk.m[v * mk.w + u]; };
  for(let y = -1; y <= H; y++) for(let x = -1; x <= W; x++){
    const X = Math.round(x0 + x), Y = Math.round(y0 + y);
    if(at(x, y)){ if(fxCover(X, Y, a)) fxSet(L, X, Y, c); }
    else if(rim && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) fxSet(L, X, Y, rim);
  }
}

/* A band of light across the sprite of `id`: its pixels whose (x + y/2) falls within `w` of `pos` (pixels from its left). */
function fxGlowBand(L, id, pos, w, c){
  const img = fxSpriteOf(id);
  if(!img || img.tagName !== 'IMG') return;
  const mk = fxMask(img);
  if(!mk) return;
  const r = img.getBoundingClientRect();
  const x0 = (r.left - FX.ox) / FX.P, y0 = (r.top - FX.oy) / FX.P, sx = mk.w / (r.width / FX.P), sy = mk.h / (r.height / FX.P);
  const W = Math.ceil(r.width / FX.P), H = Math.ceil(r.height / FX.P);
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    if(Math.abs(x + y * 0.5 - pos) > w) continue;
    const u = Math.floor(x * sx), v = Math.floor(y * sy);
    if(u < mk.w && v < mk.h && mk.m[v * mk.w + u]) fxSet(L, Math.round(x0 + x), Math.round(y0 + y), c);
  }
}

/* ---------- a move, played ---------- */
/* playEffect's art (05-battle-flow.js asks here first). Returns true when this move has art: it plays.
   opts: `at` (the one aimed at), `targets` (all of them), `from` (who made it; yours by default, the one in front),
   `type`, `tier` (a stone's), `charge` (0–1, how far past its base a scaling move was written). With nobody to aim at
   (or aimed at itself) it is a cast on its own side: `ctx.self`, drawn round the one who made it. */
function fxPlay(moveName, opts, done){
  if(FX.invertTill && performance.now() > FX.invertTill + 500) fxInvertOff();   // (4.16) never left turned over
  if(!FX.on || !ui.battle) return false;
  opts = opts || {};
  const at = opts.at || null;
  const tids = (opts.targets && opts.targets.length) ? opts.targets.slice() : (at ? [at] : []);
  const fromId = opts.from || (fxSideOf(at) === 'player' ? null : (typeof pid === 'function' ? pid('playerBob') : null));
  /* (4.16) a legendary's own element for a move of its with no art of its own (FX_SPECIES_EL) */
  const species = fxSpeciesOf(fromId);
  if(!opts.tier && !FX_MOVES[fxBaseName(moveName)] && species && FX_SPECIES_EL[species]) opts = Object.assign({}, opts, { type:FX_SPECIES_EL[species] });
  const recipe = fxRecipe(moveName, opts);
  if(!recipe || !fxReady()) return false;
  const now = performance.now();
  const self = !tids.length || (!!opts.from && tids.length === 1 && tids[0] === opts.from);
  const side = self ? 'self' : (fxSideOf(tids[0]) || 'enemy');
  /* (4.24) `fromAt`: where it comes from, if not its maker's own picture — one of the Monkey King's clones, his move
     again (fxCloneEchoes). What only he has (his aura round his picture, his picture kept) is not drawn: no `fromId`. */
  const from = opts.fromAt || fxAnchor(fromId) || (side === 'player' ? fxEnemyRowMiddle() : { x:FX.W * 0.25, y:FX.H * 0.75, w:40, h:40, foot:FX.H * 0.85 });
  const to = self ? [] : tids.map(id=> fxAnchor(id)).filter(Boolean);
  if(!self && !to.length) to.push(side === 'player' ? (fxAnchor(pid('playerBob')) || from) : fxEnemyRowMiddle());
  const ctx = { name:moveName, type:opts.type, tier:opts.tier, recipe, side, self, from, fromId:opts.fromAt ? null : fromId, foe:!!(fromId && /^enemy-/.test(fromId)),
                to, tids, t0:now, strikes:0, until:now + (recipe.window || 3500) + (recipe.hold || 0), seed:(Math.random() * 1e9) | 0, opts,
                big:fxBig(moveName, opts), charge:opts.charge == null ? null : +opts.charge,
                species, slot:fxSlotFor(species, moveName), crit:!!opts.bonus, aside:!!opts.aside };   // (4.16) who made it, its slot; a bonus round won
  /* (4.22) `aside`: art beside a move's (a stone's passive firing): the move playing keeps the blows that land (fxStruck) */
  if(!opts.aside) FX.ctx = ctx;
  ctx.shake = fxShakeOf(ctx);
  try {
    if(self && recipe.aura) recipe.aura(ctx);
    else if(recipe.cast) recipe.cast(ctx);
  } catch(e){ fxErr(e); }
  const ms = opts.duration || recipe.dur || 700;
  if(done) setTimeout(done, ms);
  return true;
}
/* (4.17) A refined stone's move is named with its mark ("Diamond Dust +", "Overheat ✦", "Fusion Flare ✦"): its art is
   its stone's own. Until 4.17 the mark hid it, and a refined stone played its element's plain art instead. */
const fxBaseName = name=> String(name || '').replace(/ [+✦]$/, '');
function fxRecipe(name, opts){
  if(FX_MOVES[fxBaseName(name)]) return FX_MOVES[fxBaseName(name)];
  const t = opts && opts.type;
  if(t) return FX_TYPES[t] || null;
  /* one of theirs with no element at all (the aliens' captains and commanders): its own colours */
  const f = opts && opts.from, e = f && /^enemy-/.test(f) && ui.battle ? ui.battle.enemies[+f.slice(6)] : null;
  return (e && SPECIES[e.species] && !(SPECIES[e.species].types || []).length) ? FX_TYPES.Void : null;
}
/* How long a move's art wants its blow kept back (the fight waits that much longer before it lands). */
function fxHoldFor(name){ const r = FX.on && FX_MOVES[fxBaseName(name)]; return (r && r.hold) || 0; }
function fxDurFor(name){ const r = FX.on && FX_MOVES[fxBaseName(name)]; return (r && r.dur) || 0; }   // (4.17) how long its art plays
/* How heavy a move is, for the type's art: by its slot (every monster's moves, read once), or a stone's tier. */
let _fxSlots = null;
function fxSlotOf(name){
  if(!_fxSlots){
    _fxSlots = {};
    const rank = { Basic:1, Power1:2, Power2:3, Ultimate:4, Max:5 };
    try { Object.keys(MOVES).forEach(sp=> (MOVES[sp] || []).forEach(r=>{ if(rank[r[0]] && !(rank[_fxSlots[r[1]]] > rank[r[0]])) _fxSlots[r[1]] = r[0]; })); } catch(e){}
  }
  return _fxSlots[name] || null;
}
function fxBig(name, opts){
  const tier = opts && opts.tier;
  if(tier) return ({ low:0.95, mid:1.05, high:1.12, veryhigh:1.2, ultra:1.2 })[tier] || 1;
  return ({ Basic:1, Power1:1.05, Power2:1.15, Ultimate:1.3, Max:1.45 })[fxSlotOf(name)] || 1;
}
/* flashHit's art: the move playing bursts on what it struck — and (4.16) the screen shakes with it. */
function fxStruck(el){
  const c = FX.ctx;
  if(!FX.on || !c || !el || !el.id || performance.now() > c.until) return;
  const side = fxSideOf(el.id);
  if(!side || (side !== c.side && c.side !== 'self')) return;
  if(!fxReady()) return;
  const at = fxAnchor(el.id);
  if(!at) return;
  if(c.recipe.impact){ at.id = el.id; try { c.recipe.impact(c, at, c.strikes++, side); } catch(e){ fxErr(e); } }
  fxShakeHit(c);
}

/* (4.16) The designer: "minor screen shake to be used for all damaging ultimate/max moves even for non-legendaries, but
   more pronounced shake for legendary damaging power2 and ultimate/max moves. Use the shake on at the same time when
   the hit sound and flashing sprites are played." So a move's shake is given by its slot and its maker's kind, as each
   of its blows lands (fxStruck, from flashHit: the flash, with the hit's sound) — and only then, so a move that harms
   nothing never shakes. An Ultra's strikes shake too. Levels: 1 a little; 2 an Ultra's strike; 3 and 4 a legendary's. */
const FX_SLOT_EXTRA = { 'Unleash':'Power2', 'Hyperbeam':'Ultimate', 'Unleash Max':'Max', 'Hyperbeam Max':'Max' };   // the Cataclysm's spends
function fxSlotFor(sp, name){
  const r = sp && typeof MOVES !== 'undefined' && MOVES[sp] ? MOVES[sp].find(x=> x[1] === name) : null;
  return r ? r[0] : (FX_SLOT_EXTRA[name] || null);
}
function fxShakeOf(ctx){
  if(ctx.tier === 'ultra') return 2;
  if(ctx.tier) return 0;
  const slot = ctx.slot, leg = !!(ctx.species && SPECIES[ctx.species] && SPECIES[ctx.species].tier === 'legendary');
  if(slot === 'Max') return leg ? 4 : 1;
  if(slot === 'Ultimate') return leg ? 3 : 1;
  if(slot === 'Power2') return leg ? 3 : 0;
  return 0;
}
const FX_SHAKE = { 1:[2, 130], 2:[3, 140], 3:[4, 190], 4:[5, 230] };   // px, ms
function fxShakeHit(ctx){
  const lv = ctx.shake;
  if(!lv) return;
  const now = performance.now();
  if(now - FX.shookAt < 90) return;                    // one shake for a blow on several at once
  FX.shookAt = now;
  const [px, ms] = FX_SHAKE[lv];
  FX.shakes.push({ name:ctx.name, lv, at:now });
  if(FX.shakes.length > 60) FX.shakes.shift();
  fxShake(px * (ctx.crit ? 1.4 : 1), ms * (ctx.crit ? 1.3 : 1));
}
/* (4.16) The designer: "let's decide on a predominant element for each legendary so you don't have to mix effects from
   both elements which can feel out of place". Their own art is drawn in it (30-fx-moves.js); a move of theirs with no
   art of its own plays that element's (the royal family's, for now). The Cyborg keeps its own mix. */
const FX_SPECIES_EL = { phoenix:'Fire', forest_fairy:'Grass', water_dragon:'Water', water_dragon_nerfed:'Water', ankylosaurus:'Ground',
  newt:'Electric', monkey_king:'Physical', whalelord:'Ghost', caladrius:'Water', ghost_guardian:'Ghost', mindcat:'Psychic',
  fairy_king:'Psychic', fairy_dauphin:'Steel', fairy_princess:'Fairy' };
/* What lands on yours is drawn in front of them; the rest behind. */
const fxLayerFor = side=> side === 'player' ? 'front' : 'back';

/* ---------- the path of a shot ---------- */
function fxArc(a, b, lift){
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - (lift == null ? Math.hypot(b.x - a.x, b.y - a.y) * 0.16 : lift);
  return u=> ({ x:(1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x, y:(1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y });
}
/* (4.16) Where what rains down comes from (the designer: "all 'raining down' moves should come from the top left against
   enemies and top right against players"): above the screen, off to the side it was sent from, `slant` across for each
   pixel it falls. `side`: the side it falls on. */
function fxSkyFrom(at, side, slant){ const s = side === 'player' ? 1 : -1, h = Math.max(24, at.y + 14); return { x:at.x + s * h * (slant == null ? 0.42 : slant), y:-14 }; }
/* The width of what rains down (the designer: "Width of beams raining down from the sky and particles raining down
   should also be increased by 1.5x"). */
const FX_RAIN_W = 1.5;
/* where a shot leaves from: a little in front of the one who threw it, towards its target */
function fxMuzzle(from, to){
  const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy) || 1;
  return { x:from.x + dx / d * Math.min(14, from.w * 0.18), y:from.y - from.h * 0.12 + dy / d * 6 };
}

/* ============================================================
   FIRE
   ============================================================ */
const FX_FIRE = fxRamp('Fire'), FX_SMOKE = fxRamp('Smoke'), FX_GOLD = fxRamp('Gold');
/* sacred fire (the phoenix's Max): gold at the heart, crimson at the edge */
const FX_SACRED = [FX_GOLD[0], FX_GOLD[1], FX_GOLD[2], FX_FIRE[2], FX_FIRE[4], FX_FIRE[5]];

/* A tongue of flame standing on (x, y): `h` tall, `w` across at its foot, swaying with `t`. Hottest at its heart and
   foot, red at its edges and tip, a dark line round it. */
function fxTongue(L, x, y, h, w, t, k, pal, cover){
  pal = pal || FX_FIRE;
  const H = Math.max(1, Math.round(h)), cv = cover == null ? 1 : cover;
  for(let j = 0; j <= H; j++){
    const f = j / H, prof = f < 0.22 ? 0.72 + f * 1.27 : Math.pow((1 - f) / 0.78, 0.85);
    const ww = w * prof * (0.85 + 0.15 * Math.sin(t * 0.035 + j * 0.7 + k));
    const sway = Math.sin(t * 0.012 + j * 0.22 + k * 1.3) * (0.5 + f * 2.5);
    const half = Math.max(0, Math.round(ww)), cx = Math.round(x + sway), Y = Math.round(y - j);
    for(let i = -half - 1; i <= half + 1; i++){
      const X = cx + i;
      if(!fxCover(X, Y, cv)) continue;
      if(Math.abs(i) > half || j === H){ fxSet(L, X, Y, pal[5]); continue; }
      const heat = (1 - f) * (1 - (half ? Math.abs(i) / (half + 0.5) : 0) * 0.8);
      fxSet(L, X, Y, pal[heat > 0.72 ? 0 : heat > 0.52 ? 1 : heat > 0.34 ? 2 : heat > 0.18 ? 3 : 4]);
    }
  }
}

/* A fireball on its way: a wandering ball with a comet's tail, shedding embers. */
function fxFireball(ctx, a, b, opts){
  opts = opts || {};
  const t0 = opts.delay || 40, tt = opts.time || 250, r = opts.r || 6, layer = opts.layer || 'back', pal = opts.pal || FX_FIRE;
  const path = fxArc(a, b, opts.lift), seed = (ctx.seed + (opts.k || 0) * 977) | 0, rnd = fxRand(seed);
  const embers = [];
  fxAdd({ layer, dur:t0 + tt + 600, step(L, t, dt){
    embers.forEach(p=>{
      const age = t - p.born;
      if(age > p.life) return;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 20 * dt;
      fxSet(L, Math.round(p.x), Math.round(p.y), pal[Math.min(5, 1 + Math.floor(age / p.life * 5))]);
    });
    if(t < t0 || t > t0 + tt) return;
    const v = (t - t0) / tt, u = v * v * 0.6 + v * 0.4;        // gathering speed
    const p = path(u);
    for(let i = 0; i < 3; i++) embers.push({ x:p.x + (rnd() - 0.5) * r, y:p.y + (rnd() - 0.5) * r, vx:(rnd() - 0.5) * 30, vy:-8 - rnd() * 22, born:t, life:180 + rnd() * 280 });
    for(let k = 8; k >= 1; k--){                                 // the tail: smaller and redder the further back
      const s = path(Math.max(0, u - k * 0.02)), rr = r * (1 - k * 0.095);
      if(rr >= 1) fxFlameBall(L, s.x, s.y, rr, pal, t, seed + k, { wob:0.32, cols:[pal[4], pal[3], pal[3], pal[2]], outline:pal[5], cover:1 - k * 0.06 });
    }
    fxFlameBall(L, p.x, p.y, r, pal, t, seed, { wob:0.26, cols:[pal[3], pal[2], pal[1], pal[1], pal[0]], outline:pal[5] });
  } });
}
/* A fire burst where a blow lands: a white flash, a ball of flame that swells and breaks up, tongues licking up,
   embers thrown out, and a wisp of smoke. `big` for a heavier blow. */
function fxFireBurst(at, layer, opts){
  opts = opts || {};
  const big = opts.big || 1, seed = opts.seed || ((at.x * 131 + at.y * 71) | 0), rnd = fxRand(seed), pal = opts.pal || FX_FIRE;
  const R = 11 * big;
  fxAdd({ layer, dur:640, step(L, t){
    if(t < 45){ const rr = R * (0.4 + t / 150); fxDisc(L, at.x, at.y, rr, pal[0]); fxRing(L, at.x, at.y, rr + 2, 2, pal[1]); return; }
    const grow = fxEaseOut(Math.min(1, (t - 30) / 160)), fade = t < 260 ? 1 : Math.max(0, 1 - (t - 260) / 300);
    if(fade <= 0) return;
    fxFlameBall(L, at.x, at.y - grow * 3 * big, R * (0.5 + grow * 0.7), pal, t, seed, { wob:0.34, up:0.4, cover:fade,
      cols:t < 150 ? [pal[3], pal[2], pal[1], pal[0], pal[0]] : [pal[4], pal[3], pal[2], pal[1], pal[0]], outline:pal[5] });
  } });
  const tongues = [];
  for(let i = 0; i < 6 + big * 3; i++) tongues.push({ x:at.x + (rnd() - 0.5) * R * 1.5, y:at.y + (rnd() - 0.4) * R * 0.8, vx:(rnd() - 0.5) * 16, vy:-(45 + rnd() * 55) * big,
    life:280 + rnd() * 260, size:3 + Math.round(rnd() * 2), ramp:[pal[1], pal[2], pal[3], pal[4]], drag:1.2, delay:60 + rnd() * 140, shape:'flame', shrink:true });
  fxSpray(layer, tongues, 900);
  fxSpray(layer, fxBurstParts(at.x, at.y, Math.round(16 * big), { seed:seed + 3, vmin:60 * big, vmax:170 * big, ramp:[pal[0], pal[1], pal[2], pal[3], pal[4]], grav:-30, drag:2.4, lmin:260, lmax:640 }), 1000);
  const puffs = [];
  for(let i = 0; i < 3 + big; i++) puffs.push({ x:at.x + (rnd() - 0.5) * R, y:at.y - R * 0.4, vx:(rnd() - 0.5) * 10, vy:-14 - rnd() * 14, r:2.5 + rnd() * 2.5 * big, delay:240 + rnd() * 140, life:440 + rnd() * 220 });
  fxAdd({ layer, dur:1100, step(L, t, dt){
    puffs.forEach(p=>{
      if(t < p.delay || t > p.delay + p.life) return;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const u = (t - p.delay) / p.life;
      fxDisc(L, p.x, p.y, p.r * (1 + u * 0.8), FX_SMOKE[2 + Math.min(2, Math.floor(u * 3))], 0.6 * (1 - u));
    });
  } });
}

/* ============================================================
   THE TYPE KITS — each type's shot (on its way), burst (where a blow lands) and aura (a cast on its own side).
   Every move of a type without art of its own plays its kit, bigger for a bigger move (fxBig: Basic 1 to Max 1.45).
   ============================================================ */
const FX_WATER = fxRamp('Water'), FX_GRASS = fxRamp('Grass'), FX_ELEC = fxRamp('Electric'), FX_GROUND = fxRamp('Ground'),
      FX_FLY = fxRamp('Flying'), FX_PHYS = fxRamp('Physical'), FX_GHOST = fxRamp('Ghost'), FX_PSY = fxRamp('Psychic'),
      FX_DRAGON = fxRamp('Dragon'), FX_STEEL = fxRamp('Steel'), FX_FAIRY = fxRamp('Fairy');
/* [light, mid, dark, line] sets, for the drawn things */
const FX_LEAFC = [FX_GRASS[1], FX_GRASS[2], FX_GRASS[3], FX_GRASS[5]];
const FX_ROCKC = [FX_GROUND[1], FX_GROUND[2], FX_GROUND[3], FX_GROUND[5]];
const FX_WINDC = [FX_FLY[0], FX_FLY[1], FX_FLY[3], FX_FLY[5]];
const FX_STEELC = [FX_STEEL[0], FX_STEEL[2], FX_STEEL[3], FX_STEEL[5]];
/* Things moving along a path: `draw(L, p, u, t)` for each, from `delay` for `time` ms. */
function fxTravel(layer, a, b, o, draw){
  const t0 = o.delay || 40, tt = o.time || 250, path = o.path || fxArc(a, b, o.lift);
  return fxAdd({ layer, dur:t0 + tt + (o.tail || 0), step(L, t, dt){
    if(o.each) o.each(L, t, dt);
    if(t < t0 || t > t0 + tt) return;
    const v = (t - t0) / tt, u = o.linear ? v : v * v * 0.6 + v * 0.4;
    draw(L, path(u), u, t, path);
  } });
}
/* A puff of smoke or dust: grows, rises, thins out. */
function fxPuffs(layer, at, n, o){
  const rnd = fxRand(o.seed || 1), puffs = [];
  for(let i = 0; i < n; i++) puffs.push({ x:at.x + (rnd() - 0.5) * (o.spread || 10), y:at.y + (rnd() - 0.5) * (o.spreadY || 6), vx:(rnd() - 0.5) * (o.vx || 16), vy:-(o.rise || 12) - rnd() * (o.rise || 12),
    r:(o.r || 3) * (0.7 + rnd() * 0.6), delay:(o.delay || 0) + rnd() * (o.stagger || 120), life:(o.life || 480) * (0.8 + rnd() * 0.4) });
  fxAdd({ layer, dur:(o.delay || 0) + (o.stagger || 120) + (o.life || 480) * 1.3, step(L, t, dt){
    puffs.forEach(p=>{
      if(t < p.delay || t > p.delay + p.life) return;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const u = (t - p.delay) / p.life;
      fxDisc(L, p.x, p.y, p.r * (1 + u * (o.grow || 0.8)), o.pal[Math.min(o.pal.length - 1, Math.floor(u * o.pal.length))], (o.thick || 0.65) * (1 - u));
    });
  } });
}
/* A ring running out across the ground at someone's feet. */
function fxGroundRing(layer, at, o){
  fxAdd({ layer, dur:o.dur || 600, delay:0, step(L, t){
    if(t < (o.delay || 0)) return;
    const u = fxEaseOut((t - (o.delay || 0)) / ((o.dur || 600) - (o.delay || 0))), rr = (o.r0 || 6) + u * (o.r1 || 30);
    const cv = u < 0.6 ? 1 : 1 - (u - 0.6) * 2.5;
    if(o.line) fxRing(L, at.x, at.foot != null ? at.foot : at.y, rr + 1, 1, o.line, cv, o.sy || 0.3);
    fxRing(L, at.x, at.foot != null ? at.foot : at.y, rr, o.th || 2, o.cols[Math.min(o.cols.length - 1, Math.floor(u * o.cols.length))], cv, o.sy || 0.3);
  } });
}
/* A flash at the start of a burst: a disc, gone in a blink. */
function fxFlash(layer, at, r, c, ms){
  fxAdd({ layer, dur:ms || 50, step(L, t){ fxDisc(L, at.x, at.y, r * (0.7 + t / ((ms || 50) * 2)), c); } });
}

/* (4.16) The designer: "please increase the sizes of the projectiles by about 2x diameter for all moves". */
const FX_SHOT = 2;
/* (4.16) Each type's buff look (fxTint): three shades, the waves rising through them, a rim. */
const FX_BUFF = {};
function fxBuffOf(type){ return FX_BUFF[type] || FX_BUFF.Physical; }

/* ---------- FIRE ---------- */
const FX_KIT = {};
FX_KIT.Fire = {
  shot(ctx, a, b, o){ fxFireball(ctx, a, b, { k:o.k, delay:o.delay, time:250, r:5.5 * FX_SHOT * o.big, layer:o.layer, lift:o.lift }); },
  burst(at, layer, o){ fxFireBurst(at, layer, { seed:o.seed, big:o.big }); },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const rnd = fxRand(ctx.seed), big = o.big || 1;
    if(o.buff) fxBuffLook(id, fxBuffOf('Fire'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_FIRE[1], FX_FIRE[2], FX_FIRE[3]], line:FX_FIRE[5], r1:a.w * 0.5 * big, dur:600 });
    for(let i = 0; i < 7; i++){
      const ang = i / 7 * Math.PI * 2 + rnd(), x0 = a.x + Math.cos(ang) * a.w * 0.34, y0 = a.foot + Math.sin(ang) * a.w * 0.09;
      const hgt = a.h * (0.22 + rnd() * 0.2) * big, delay = 40 + rnd() * 160, life = 520;
      fxAdd({ layer:Math.sin(ang) < 0 ? fxUnderOf(id) : fxOverOf(id), dur:delay + life, step(L, t){
        if(t < delay) return;
        const u = (t - delay) / life, rise = u < 0.3 ? fxEaseOut(u / 0.3) : 1 - fxEaseIn((u - 0.3) / 0.7) * 0.9;
        fxTongue(L, x0, y0, hgt * rise, 3.5, t, i, FX_FIRE, u > 0.75 ? 1 - (u - 0.75) * 4 : 1);
      } });
    }
    fxSpray(fxOverOf(id), fxBurstParts(a.x, a.foot - a.h * 0.2, 14, { seed:ctx.seed + 5, ang:-Math.PI / 2, spread:1.6, vmin:30, vmax:70, ramp:[FX_FIRE[1], FX_FIRE[2], FX_FIRE[3], FX_FIRE[4]], drag:0.6, lmin:400, lmax:700, delay:200 }), 1000);
  },
};

/* ---------- WATER ---------- */
function fxWaterBall(L, x, y, r, t, seed, cover, wob){
  fxFlameBall(L, x, y, r, FX_WATER, t, seed, { wob:wob == null ? 0.12 : wob, cols:[FX_WATER[3], FX_WATER[2], FX_WATER[2], FX_WATER[1]], outline:FX_WATER[5], cover });   // (4.19) `wob`: a big one rounder
  if(r >= 6) fxDisc(L, x - r * 0.38, y - r * 0.42, r * 0.17, FX_WATER[0], cover);   // (4.16) a bigger ball, a bigger gleam
  else if(r >= 3){ fxSet(L, Math.round(x - r * 0.4), Math.round(y - r * 0.45), FX_WATER[0]); fxSet(L, Math.round(x - r * 0.4) + 1, Math.round(y - r * 0.45), FX_WATER[0]); fxSet(L, Math.round(x - r * 0.4), Math.round(y - r * 0.45) + 1, FX_WATER[0]); }
}
function fxSplash(at, layer, o){
  const big = o.big || 1, seed = o.seed || 1;
  fxFlash(layer, at, 6 * big, FX_WATER[0], 45);
  fxAdd({ layer, dur:380, step(L, t){                          // a crown of water thrown up
    const u = t / 380, rise = fxEaseOut(Math.min(1, t / 150)), cv = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45;
    for(let i = 0; i < 7; i++){
      const ang = -Math.PI / 2 + (i - 3) * 0.34, len = (11 + (i % 2) * 5) * big * rise, sx = at.x + Math.cos(ang) * 3, sy = at.y + 5;
      const ex = at.x + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len;
      fxLine(L, sx, sy, ex, ey, FX_WATER[5], 4, cv);
      fxLine(L, sx, sy, ex, ey, FX_WATER[2], 2, cv);
      fxDisc(L, ex, ey, 1.6, FX_WATER[0], cv);
    }
    fxWaterBall(L, at.x, at.y + 5, 7 * big * (1 - u * 0.5), t, seed, cv);
  } });
  fxGroundRing(layer, at, { cols:[FX_WATER[1], FX_WATER[2], FX_WATER[3]], line:FX_WATER[5], r0:4, r1:at.w * 0.42 * big, dur:620, sy:0.32 });
  fxGroundRing(layer, at, { cols:[FX_WATER[1], FX_WATER[2]], r0:2, r1:at.w * 0.25 * big, dur:620, delay:140, sy:0.32 });
  fxSpray(layer, fxBurstParts(at.x, at.y, Math.round(18 * big), { seed, ang:-Math.PI / 2, spread:2.6, vmin:70 * big, vmax:160 * big, grav:420, drag:0.6, ramp:[FX_WATER[0], FX_WATER[1], FX_WATER[2], FX_WATER[3]], lmin:380, lmax:620, size:3 }), 900);
  fxSpray(layer, fxBurstParts(at.x, at.y, 8, { seed:seed + 1, vmin:40, vmax:90, drag:3, ramp:[FX_WATER[0], FX_WATER[1]], lmin:150, lmax:260, shape:'streak' }), 400);
}
FX_KIT.Water = {
  shot(ctx, a, b, o){
    const r = 5 * FX_SHOT * o.big, drops = [], rnd = fxRand(ctx.seed + o.k * 31);
    fxTravel(o.layer, a, b, { delay:o.delay, time:260, lift:o.lift, tail:500, each(L, t, dt){
      drops.forEach(p=>{ const age = t - p.born; if(age > p.life) return; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt;
        fxSet(L, Math.round(p.x), Math.round(p.y), FX_WATER[Math.min(4, 1 + Math.floor(age / p.life * 4))]); });
    } }, (L, p, u, t, path)=>{
      for(let i = 0; i < 2; i++) drops.push({ x:p.x + (rnd() - 0.5) * r, y:p.y + (rnd() - 0.5) * r, vx:(rnd() - 0.5) * 30, vy:-20 - rnd() * 20, born:t, life:260 + rnd() * 200 });
      for(let k = 5; k >= 1; k--){ const q = path(Math.max(0, u - k * 0.025)); fxDisc(L, q.x, q.y, r * (0.7 - k * 0.1), FX_WATER[k > 3 ? 1 : 2], 1 - k * 0.12); }
      fxWaterBall(L, p.x, p.y, r, t, ctx.seed + o.k);
    });
  },
  burst(at, layer, o){ fxSplash(at, layer, o); },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const big = o.big || 1, n = 16;
    if(o.buff) fxBuffLook(id, fxBuffOf('Water'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_WATER[1], FX_WATER[2], FX_WATER[3]], line:FX_WATER[5], r1:a.w * 0.5 * big, dur:700 });
    fxAdd({ layer:fxOverOf(id), dur:900, step(L, t){                    // droplets spiralling up round it
      for(let i = 0; i < n; i++){
        const ph = (i / n) * Math.PI * 2, u = ((t / 900) + i / n * 0.5) % 1, ang = ph + t * 0.008;
        const x = a.x + Math.cos(ang) * a.w * (0.42 - u * 0.12), y = a.foot - u * a.h * 0.95, behind = Math.sin(ang) < 0;
        if(behind) continue;
        fxDisc(L, x, y, 1.6, FX_WATER[u < 0.5 ? 2 : 1], t > 650 ? 1 - (t - 650) / 250 : 1);
      }
    } });
    fxAdd({ layer:fxUnderOf(id), dur:900, step(L, t){
      for(let i = 0; i < n; i++){
        const ph = (i / n) * Math.PI * 2, u = ((t / 900) + i / n * 0.5) % 1, ang = ph + t * 0.008;
        if(Math.sin(ang) >= 0) continue;
        fxDisc(L, a.x + Math.cos(ang) * a.w * (0.42 - u * 0.12), a.foot - u * a.h * 0.95, 1.4, FX_WATER[3], t > 650 ? 1 - (t - 650) / 250 : 1);
      }
    } });
  },
};

/* ---------- GRASS ---------- */
function fxLeafParts(at, n, o){
  const rnd = fxRand(o.seed || 1), out = [];
  for(let i = 0; i < n; i++){
    const a = rnd() * Math.PI * 2, v = (o.vmin || 50) + rnd() * ((o.vmax || 120) - (o.vmin || 50)), rot = rnd() * 6.28, spin = (rnd() - 0.5) * 0.04, len = (o.len || 5) * (0.8 + rnd() * 0.5);
    out.push({ x:at.x, y:at.y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - (o.up || 0), life:(o.life || 600) * (0.7 + rnd() * 0.5), ramp:[0], grav:o.grav == null ? 60 : o.grav, drag:2.2, delay:rnd() * (o.delay || 60),
      draw(L, x, y, u, c, age){ fxLeaf(L, x, y, len, rot + age * spin, FX_LEAFC, u > 0.7 ? 1 - (u - 0.7) * 3.3 : 1); } });
  }
  return out;
}
FX_KIT.Grass = {
  shot(ctx, a, b, o){
    const n = o.big > 1.2 ? 4 : 3;
    for(let i = 0; i < n; i++){
      const lift = (o.lift || 0) + (i - (n - 1) / 2) * 18, spin = 0.03 + i * 0.006;
      fxTravel(o.layer, a, b, { delay:o.delay + i * 35, time:270, lift:Math.hypot(b.x - a.x, b.y - a.y) * 0.16 + lift }, (L, p, u, t)=>{
        fxLeaf(L, p.x, p.y, 7 * FX_SHOT * o.big, t * spin + i, FX_LEAFC);
        if(((t / 40) | 0) % 2 === 0) fxDisc(L, p.x - (b.x - a.x) * 0.04, p.y + 3, 1.2, FX_GRASS[1]);
      });
    }
  },
  burst(at, layer, o){
    const big = o.big || 1, rnd = fxRand(o.seed);
    fxAdd({ layer, dur:220, step(L, t){                        // two razor cuts crossing
      const u = Math.min(1, t / 90), len = 13 * big;
      for(const s of [-1, 1]){
        const x0 = at.x - len * s, y0 = at.y - len, x1 = at.x + len * s, y1 = at.y + len * 0.8;
        const ex = x0 + (x1 - x0) * u, ey = y0 + (y1 - y0) * u;
        fxLine(L, x0, y0, ex, ey, FX_GRASS[4], 3, t > 150 ? 0.5 : 1);
        fxLine(L, x0, y0, ex, ey, FX_GRASS[1], 1);
      }
    } });
    fxSpray(layer, fxLeafParts(at, Math.round(8 * big), { seed:o.seed, vmin:50, vmax:140 * big, len:5 + big, life:650 }), 900);
    fxSpray(layer, fxBurstParts(at.x, at.y, 10, { seed:o.seed + 2, vmin:20, vmax:60, ramp:[FX_GRASS[0], FX_GRASS[1], FX_GRASS[1], FX_GRASS[2]], grav:-20, drag:1.5, lmin:400, lmax:700 }), 900);
  },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const n = 9, big = o.big || 1;
    if(o.buff) fxBuffLook(id, fxBuffOf('Grass'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_GRASS[1], FX_GRASS[2], FX_GRASS[3]], line:FX_GRASS[5], r1:a.w * 0.5 * big, dur:700 });
    for(const behind of [true, false]) fxAdd({ layer:behind ? fxUnderOf(id) : fxOverOf(id), dur:1000, step(L, t){
      for(let i = 0; i < n; i++){
        const u = Math.min(1, t / 1000 + i * 0.02), ang = i / n * Math.PI * 2 + t * 0.006;
        if((Math.sin(ang) < 0) !== behind) continue;
        const x = a.x + Math.cos(ang) * a.w * 0.4, y = a.foot - u * a.h * 0.9 - i * 2;
        fxLeaf(L, x, y, 6, ang * 2 + i, FX_LEAFC, t > 760 ? 1 - (t - 760) / 240 : 1);
      }
    } });
  },
};

/* ---------- ELECTRIC ---------- */
function fxZap(L, x0, y0, x1, y1, seed, w, jag){
  fxBolt(L, x0, y0, x1, y1, seed, FX_ELEC[3], (w || 1) + 2, jag);
  fxBolt(L, x0, y0, x1, y1, seed, FX_ELEC[1], w || 1, jag);
}
function fxSparks(at, layer, o){
  const big = o.big || 1, seed = o.seed || 1;
  fxFlash(layer, at, 7 * big, FX_ELEC[0], 50);
  fxAdd({ layer, dur:320, step(L, t){
    const n = 7, step = (t / 50) | 0, rnd = fxRand(seed + step * 101);
    for(let i = 0; i < n; i++){
      const ang = i / n * Math.PI * 2 + rnd() * 0.6, len = (8 + rnd() * 8) * big * (t < 200 ? 1 : 1 - (t - 200) / 120);
      if(len < 2) continue;
      fxZap(L, at.x, at.y, at.x + Math.cos(ang) * len, at.y + Math.sin(ang) * len, seed + step * 7 + i, 1, 2.5);
    }
    if(t < 140) fxRing(L, at.x, at.y, 5 + t / 8 * big, 1, FX_ELEC[1]);
  } });
  fxSpray(layer, fxBurstParts(at.x, at.y, Math.round(10 * big), { seed:seed + 3, vmin:90, vmax:200, drag:3, ramp:[FX_ELEC[0], FX_ELEC[1], FX_ELEC[2]], lmin:150, lmax:320, shape:'streak' }), 500);
}
FX_KIT.Electric = {
  shot(ctx, a, b, o){
    const t0 = o.delay, seed = ctx.seed + o.k * 77, w = o.big > 1.2 ? 2 : 1;
    fxAdd({ layer:o.layer, dur:t0 + 300, step(L, t){
      if(t < t0) return;
      const u = Math.min(1, (t - t0) / 90), step = ((t - t0) / 45) | 0;        // it reaches across, then crackles
      const ex = a.x + (b.x - a.x) * u, ey = a.y + (b.y - a.y) * u;
      fxZap(L, a.x, a.y, ex, ey, seed + step, w, 6);
      if(u >= 1 && step % 2 === 0){
        const pts = fxBolt(L, a.x, a.y, b.x, b.y, seed + step + 3, 0, 0, 6);
        const f = pts[Math.min(pts.length - 2, 2 + (step % 3))];
        fxZap(L, f[0], f[1], f[0] + (b.x - a.x) * 0.18, f[1] + (b.y - a.y) * 0.05 - 10, seed + step + 9, 1, 3);
      }
    } });
    fxSpray(o.layer, fxBurstParts(a.x, a.y, 6, { seed, vmin:40, vmax:100, drag:3, ramp:[FX_ELEC[0], FX_ELEC[1], FX_ELEC[2]], lmin:100, lmax:200, shape:'streak', delay:t0 }), 400);
  },
  burst(at, layer, o){ fxSparks(at, layer, o); },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const big = o.big || 1;
    if(o.buff) fxBuffLook(id, fxBuffOf('Electric'), 900, 40);   // a buff's look, for a buff (not an attack's gathering)
    fxAdd({ layer:fxOverOf(id), dur:800, step(L, t){                     // arcs crawling over it
      const step = (t / 60) | 0, rnd = fxRand(ctx.seed + step * 13);
      for(let i = 0; i < 3; i++){
        const a1 = rnd() * 6.28, a2 = a1 + 0.8 + rnd(), r = a.w * 0.38 * big;
        fxZap(L, a.x + Math.cos(a1) * r, a.y + Math.sin(a1) * r * 0.9, a.x + Math.cos(a2) * r, a.y + Math.sin(a2) * r * 0.9, ctx.seed + step * 5 + i, 1, 4);
      }
    } });
    fxSpray(fxOverOf(id), fxBurstParts(a.x, a.y, 14, { seed:ctx.seed, vmin:60, vmax:150, drag:3, ramp:[FX_ELEC[0], FX_ELEC[1], FX_ELEC[2]], lmin:150, lmax:300, shape:'streak', delay:600 }), 900);
  },
};

/* ---------- GROUND ---------- */
function fxRockParts(at, n, o){
  const rnd = fxRand(o.seed || 1), out = [];
  for(let i = 0; i < n; i++){
    const a = -Math.PI / 2 + (rnd() - 0.5) * (o.spread || 2.6), v = (o.vmin || 60) + rnd() * ((o.vmax || 150) - (o.vmin || 60)), r = (o.r || 2) * (0.6 + rnd() * 0.8), spin = (rnd() - 0.5) * 0.02, sd = (o.seed || 1) + i;
    out.push({ x:at.x + (rnd() - 0.5) * 6, y:at.y, vx:Math.cos(a) * v, vy:Math.sin(a) * v, life:(o.life || 600) * (0.8 + rnd() * 0.4), ramp:[0], grav:o.grav || 420, drag:0.5, delay:rnd() * (o.delay || 40),
      draw(L, x, y, u, c, age){ fxRock(L, x, y, r, age * spin, sd, FX_ROCKC, u > 0.8 ? 1 - (u - 0.8) * 5 : 1); } });
  }
  return out;
}
function fxQuakeCrack(layer, at, o){
  const rnd = fxRand(o.seed || 1), arms = [];
  for(const s of [-1, 1]){ const pts = [[at.x, at.foot]]; let x = at.x, y = at.foot; for(let i = 0; i < 4; i++){ x += s * (2.5 + rnd() * 3) * (o.big || 1); y += (rnd() - 0.5) * 4; pts.push([x, y]); } arms.push(pts); }
  fxAdd({ layer:'back', dur:o.dur || 700, step(L, t){
    const u = Math.min(1, t / 140), cv = t < 450 ? 1 : 1 - (t - 450) / ((o.dur || 700) - 450);
    arms.forEach(pts=>{ const m = Math.max(1, Math.round((pts.length - 1) * u)); for(let i = 0; i < m; i++){ fxLine(L, pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, FX_GROUND[4], 2, cv); fxLine(L, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], FX_GROUND[5], 1, cv); } });
  } });
}
FX_KIT.Ground = {
  shot(ctx, a, b, o){
    const n = o.big > 1.2 ? 3 : 2;
    for(let i = 0; i < n; i++){
      const lift = Math.hypot(b.x - a.x, b.y - a.y) * (0.28 + i * 0.06), r = (3.5 + (i === 0 ? 1 : 0)) * FX_SHOT * o.big;
      fxTravel(o.layer, a, { x:b.x + (i - 0.5) * 10, y:b.y }, { delay:o.delay + i * 45, time:300, lift, linear:true }, (L, p, u, t)=>{
        fxRock(L, p.x, p.y, r, t * 0.01 + i, ctx.seed + i, FX_ROCKC);
        if(((t / 30) | 0) % 2) fxDisc(L, p.x - r - 2, p.y + 2, 1.2, FX_GROUND[1]);
      });
    }
  },
  burst(at, layer, o){
    const big = o.big || 1;
    fxFlash(layer, at, 5 * big, FX_GROUND[0], 40);
    fxPuffs(layer, { x:at.x, y:at.y + 4 }, Math.round(6 * big), { seed:o.seed, pal:[FX_GROUND[1], FX_GROUND[1], FX_GROUND[2], FX_GROUND[2]], r:4 * big, spread:16 * big, rise:10, life:520, stagger:60, thick:0.8 });
    fxSpray(layer, fxRockParts(at, Math.round(7 * big), { seed:o.seed + 1, r:2 * big, vmin:60, vmax:150 * big, life:620 }), 900);
    fxQuakeCrack(layer, at, { seed:o.seed + 2, big });
  },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const big = o.big || 1;
    if(o.buff) fxBuffLook(id, fxBuffOf('Ground'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[3]], line:FX_GROUND[5], r1:a.w * 0.55 * big, dur:650 });
    fxSpray(fxOverOf(id), fxRockParts({ x:a.x, y:a.foot }, 8, { seed:ctx.seed, r:2.2, vmin:90, vmax:150, spread:1.2, life:700, grav:300 }), 1000);
    fxPuffs(fxUnderOf(id), { x:a.x, y:a.foot }, 6, { seed:ctx.seed + 3, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[2]], r:4, spread:a.w * 0.7, rise:6, life:600 });
  },
};

/* ---------- FLYING ---------- */
FX_KIT.Flying = {
  shot(ctx, a, b, o){
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    for(let i = 0; i < 2; i++){
      fxTravel(o.layer, a, b, { delay:o.delay + i * 60, time:200, lift:(o.lift || 0) + (i ? -14 : 14), linear:true }, (L, p, u, t, path)=>{
        const q = path(Math.max(0, u - 0.08));
        fxLine(L, q.x, q.y, p.x, p.y, FX_FLY[2], 2, 0.6);
        fxCrescent(L, p.x, p.y, 8 * FX_SHOT * o.big, ang, FX_WINDC);
      });
    }
  },
  burst(at, layer, o){
    const big = o.big || 1, seed = o.seed || 1, rnd = fxRand(seed);
    fxAdd({ layer, dur:260, step(L, t){                          // slashes of wind across it
      const u = Math.min(1, t / 80), cv = t < 160 ? 1 : 1 - (t - 160) / 100;
      for(let i = 0; i < 3; i++){
        const ang = -0.6 + i * 0.6 + (seed % 7) * 0.05, len = 16 * big, cx = at.x + (i - 1) * 4, cy = at.y + (i - 1) * 3;
        const x0 = cx - Math.cos(ang) * len, y0 = cy - Math.sin(ang) * len, x1 = cx + Math.cos(ang) * len * (2 * u - 1), y1 = cy + Math.sin(ang) * len * (2 * u - 1);
        fxLine(L, x0, y0, x1, y1, FX_FLY[5], 4, cv);
        fxLine(L, x0, y0, x1, y1, FX_FLY[2], 2, cv);
        fxLine(L, x0, y0, x1, y1, FX_FLY[0], 1, cv);
      }
    } });
    const feathers = [];
    for(let i = 0; i < Math.round(6 * big); i++){ const sw = rnd() * 6.28, vx = (rnd() - 0.5) * 80;
      feathers.push({ x:at.x + (rnd() - 0.5) * 10, y:at.y - 4, vx, vy:-30 - rnd() * 40, life:700, ramp:[0], grav:60, drag:2.5, delay:100 + rnd() * 100,
        draw(L, x, y, u, c, age){ const a2 = Math.sin(age * 0.012 + sw) * 0.9; fxLeaf(L, x + Math.sin(age * 0.01 + sw) * 3, y, 6, a2, [FX_FLY[0], FX_FLY[1], FX_FLY[3], FX_FLY[4]], u > 0.7 ? 1 - (u - 0.7) * 3.3 : 1); } }); }
    fxSpray(layer, feathers, 1000);
    fxAdd({ layer, dur:420, step(L, t){ const u = fxEaseOut(t / 420); fxRing(L, at.x, at.y, 6 + u * 18 * big, 1, FX_FLY[1], 1 - u, 0.6); } });
  },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const big = o.big || 1;
    if(o.buff) fxBuffLook(id, fxBuffOf('Flying'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    for(const behind of [true, false]) fxAdd({ layer:behind ? fxUnderOf(id) : fxOverOf(id), dur:900, step(L, t){       // a whirlwind round it
      const cv = t < 650 ? 1 : 1 - (t - 650) / 250;
      for(let i = 0; i < 4; i++){
        const y = a.foot - (i + 0.5) * a.h * 0.22, rx = a.w * (0.32 + i * 0.05) * big, base = t * 0.012 + i * 1.7;
        for(let j = 0; j < 16; j++){
          const ang = base + j * 0.08, s = Math.sin(ang);
          if((s < 0) !== behind) continue;
          const X = a.x + Math.cos(ang) * rx, Y = y + s * rx * 0.25;
          fxDisc(L, X, Y, 1.6, FX_FLY[4], cv);
          fxSet(L, Math.round(X), Math.round(Y), j > 10 ? FX_FLY[0] : FX_FLY[2]);
        }
      }
      if(cv < 1) return;
    } });
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_FLY[1], FX_FLY[2]], r1:a.w * 0.5 * big, dur:600 });
  },
};

/* ---------- PHYSICAL ---------- */
FX_KIT.Physical = {
  shot(ctx, a, b, o){
    const ang = Math.atan2(b.y - a.y, b.x - a.x), c = Math.cos(ang), s = Math.sin(ang);
    fxAdd({ layer:o.layer, dur:o.delay + 240, step(L, t){             // a rush: streaks of speed towards it
      if(t < o.delay) return;
      const u = Math.min(1, (t - o.delay) / 220), cv = 1 - u * 0.6;
      for(let i = 0; i < 5; i++){
        const off = (i - 2) * 4, d0 = 10 + u * Math.hypot(b.x - a.x, b.y - a.y) * 0.8 - i * 5, len = 12 + i * 2;
        const x0 = a.x + c * d0 - s * off, y0 = a.y + s * d0 + c * off;
        fxLine(L, x0, y0, x0 - c * len, y0 - s * len, i === 2 ? FX_PHYS[1] : FX_PHYS[2], 1, cv);
      }
    } });
  },
  burst(at, layer, o){
    const big = o.big || 1, rot = (o.seed % 10) * 0.1;
    fxAdd({ layer, dur:260, step(L, t){
      const u = t < 70 ? fxEaseOut(t / 70) : 1, cv = t < 160 ? 1 : 1 - (t - 160) / 100;
      fxImpactStar(L, at.x, at.y, 17 * big * (0.6 + 0.4 * u), 9, rot, [FX_PHYS[2], FX_PHYS[1], FX_PHYS[0]], FX_PHYS[5], cv);
    } });
    fxAdd({ layer, dur:380, step(L, t){ const u = fxEaseOut(t / 380), rr = 10 + u * 22 * big; fxRing(L, at.x, at.y, rr + 1, 1, FX_PHYS[5], 1 - u, 0.75); fxRing(L, at.x, at.y, rr, 2, FX_PHYS[u < 0.5 ? 2 : 3], 1 - u, 0.75); } });
    fxSpray(layer, fxBurstParts(at.x, at.y, Math.round(10 * big), { seed:o.seed, vmin:80, vmax:180, drag:3, ramp:[FX_PHYS[0], FX_PHYS[1], FX_PHYS[2], FX_PHYS[3]], lmin:150, lmax:320, shape:'streak' }), 500);
  },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const big = o.big || 1, rnd = fxRand(ctx.seed), lines = [];
    for(let i = 0; i < 14; i++) lines.push({ x:a.x + (rnd() - 0.5) * a.w * 0.8, y0:a.foot - rnd() * a.h * 0.3, len:6 + rnd() * 10, sp:90 + rnd() * 80, d:rnd() * 300 });
    if(o.buff) fxBuffLook(id, fxBuffOf('Physical'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_PHYS[1], FX_PHYS[2], FX_PHYS[3]], line:FX_PHYS[5], r1:a.w * 0.55 * big, dur:600 });
    fxAdd({ layer:fxOverOf(id), dur:900, step(L, t){
      lines.forEach(l=>{ if(t < l.d) return; const y = l.y0 - (t - l.d) / 1000 * l.sp; if(y < a.foot - a.h * 1.1) return; fxLine(L, l.x, y, l.x, y + l.len, FX_PHYS[3], 2); fxLine(L, l.x, y, l.x, y + l.len * 0.6, FX_PHYS[1], 1); });
    } });
  },
};

/* ---------- GHOST ---------- */
FX_KIT.Ghost = {
  shot(ctx, a, b, o){
    const smoke = [], rnd = fxRand(ctx.seed + o.k * 5), dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    const base = fxArc(a, b, o.lift), path = u=>{ const p = base(u), w = Math.sin(u * Math.PI * 2.5) * 9 * Math.sin(u * Math.PI); return { x:p.x + nx * w, y:p.y + ny * w }; };
    const r = 4.5 * FX_SHOT * o.big;
    fxTravel(o.layer, a, b, { delay:o.delay, time:300, path, tail:450, each(L, t, dt){
      smoke.forEach(p=>{ const age = t - p.born; if(age > p.life) return; p.y -= 10 * dt; fxDisc(L, p.x, p.y, p.r * (1 + age / p.life), FX_GHOST[age < p.life * 0.4 ? 3 : 4], 0.7 * (1 - age / p.life)); });
    } }, (L, p, u, t)=>{
      smoke.push({ x:p.x + (rnd() - 0.5) * r * 0.6, y:p.y + (rnd() - 0.5) * r * 0.6, r:(2 + rnd() * 1.5) * 1.6, born:t, life:300 });
      fxFlameBall(L, p.x, p.y, r, FX_GHOST, t, ctx.seed, { wob:0.3, up:0.3, cols:[FX_GHOST[3], FX_GHOST[2], FX_GHOST[1], FX_GHOST[0]], outline:FX_GHOST[5] });
      fxRect(L, p.x - r * 0.35 - 1, p.y - r * 0.25, 2, 2, FX_GHOST[5]); fxRect(L, p.x + r * 0.25, p.y - r * 0.25, 2, 2, FX_GHOST[5]);   // two eyes in the wisp
    });
  },
  burst(at, layer, o){
    const big = o.big || 1, flip = (o.seed % 2) ? 1 : -1;
    fxAdd({ layer, dur:330, step(L, t){                          // three claw marks raked across it
      const u = Math.min(1, t / 100), cv = t < 200 ? 1 : 1 - (t - 200) / 130;
      for(let i = 0; i < 3; i++){
        const ox = (i - 1) * 6 * big, len = 15 * big, x0 = at.x + ox - flip * len * 0.6, y0 = at.y - len, x1 = at.x + ox + flip * len * 0.6, y1 = at.y + len * 0.8;
        const ex = x0 + (x1 - x0) * u, ey = y0 + (y1 - y0) * u;
        fxLine(L, x0, y0, ex, ey, FX_GHOST[5], 3, cv);
        fxLine(L, x0, y0, ex, ey, FX_GHOST[1], 1, cv);
      }
    } });
    fxPuffs(layer, at, Math.round(5 * big), { seed:o.seed, pal:[FX_GHOST[2], FX_GHOST[3], FX_GHOST[4]], r:3.5 * big, spread:14, rise:16, life:560, delay:80, thick:0.7 });
    fxSpray(layer, fxBurstParts(at.x, at.y, 8, { seed:o.seed + 1, ang:-Math.PI / 2, spread:2.2, vmin:30, vmax:70, ramp:[FX_GHOST[1], FX_GHOST[2], FX_GHOST[3]], drag:0.8, lmin:400, lmax:700, shape:'flame', size:3, shrink:true }), 900);
  },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    if(o.buff) fxBuffLook(id, fxBuffOf('Ghost'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    fxPuffs(fxUnderOf(id), { x:a.x, y:a.foot - 4 }, 10, { seed:ctx.seed, pal:[FX_GHOST[3], FX_GHOST[4], FX_GHOST[4]], r:5, spread:a.w * 0.8, rise:14, life:800, stagger:300, thick:0.6 });
    for(const behind of [true, false]) fxAdd({ layer:behind ? fxUnderOf(id) : fxOverOf(id), dur:1000, step(L, t){      // three wisps circling
      for(let i = 0; i < 3; i++){
        const ang = t * 0.006 + i * 2.09, x = a.x + Math.cos(ang) * a.w * 0.45, y = a.y - a.h * 0.1 + Math.sin(ang) * a.w * 0.12 - Math.sin(t * 0.01 + i) * 3;
        if((Math.sin(ang) < 0) !== behind) continue;
        fxFlameBall(L, x, y, 3, FX_GHOST, t, ctx.seed + i, { wob:0.3, up:0.5, cols:[FX_GHOST[3], FX_GHOST[2], FX_GHOST[1]], outline:FX_GHOST[5], cover:t > 780 ? 1 - (t - 780) / 220 : 1 });
      }
    } });
  },
};

/* ---------- PSYCHIC ---------- */
FX_KIT.Psychic = {
  shot(ctx, a, b, o){
    for(let i = 0; i < 3; i++)
      fxTravel(o.layer, a, b, { delay:o.delay + i * 45, time:240, lift:o.lift, linear:true }, (L, p, u, t)=>{
        const r = (4 + u * 4) * FX_SHOT * o.big;
        fxRing(L, p.x, p.y, r + 1, 1, FX_PSY[4]);
        fxRing(L, p.x, p.y, r, 3, i === 1 ? FX_PSY[1] : FX_PSY[2]);
      });
  },
  burst(at, layer, o){
    const big = o.big || 1, rnd = fxRand(o.seed);
    fxFlash(layer, at, 6 * big, FX_PSY[0], 45);
    for(let i = 0; i < 3; i++) fxAdd({ layer, dur:420 + i * 80, step(L, t){
      if(t < i * 80) return;
      const u = fxEaseOut((t - i * 80) / 420), rr = 5 + u * (18 + i * 6) * big;
      fxRing(L, at.x, at.y, rr + 1, 1, FX_PSY[4], 1 - u);
      fxRing(L, at.x, at.y, rr, 2, FX_PSY[i === 0 ? 1 : 2], 1 - u);
    } });
    const stars = [];
    for(let i = 0; i < Math.round(6 * big); i++){ const ang = rnd() * 6.28, d = 8 + rnd() * 14 * big, del = 60 + rnd() * 200;
      stars.push({ x:at.x + Math.cos(ang) * d, y:at.y + Math.sin(ang) * d, vx:0, vy:-8, life:320, ramp:[0], delay:del, draw(L, x, y, u){ fxStar4(L, x, y, 3 * Math.sin(u * Math.PI) + 0.5, FX_PSY[u < 0.5 ? 0 : 1], FX_PSY[0]); } }); }
    fxSpray(layer, stars, 700);
  },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const big = o.big || 1;
    if(o.buff) fxBuffLook(id, fxBuffOf('Psychic'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    for(const behind of [true, false]) fxAdd({ layer:behind ? fxUnderOf(id) : fxOverOf(id), dur:950, step(L, t){       // rings turning round it, tilted
      const cv = t < 700 ? 1 : 1 - (t - 700) / 250;
      for(let i = 0; i < 2; i++){
        const tilt = i ? 0.35 : -0.35, rx = a.w * 0.48 * big, ry = a.w * 0.16, n = 90, spin = t * 0.004 * (i ? 1 : -1);
        for(let j = 0; j < n; j++){
          const ang = j / n * Math.PI * 2 + spin, s = Math.sin(ang);
          if((s < 0) !== behind) continue;
          const x = Math.cos(ang) * rx, y = s * ry, X = a.x + x * Math.cos(tilt) - y * Math.sin(tilt), Y = a.y - a.h * 0.05 + x * Math.sin(tilt) + y * Math.cos(tilt);
          fxDisc(L, X, Y, 1.5, FX_PSY[4], cv);
          if(fxCover(Math.round(X), Math.round(Y), cv)) fxSet(L, Math.round(X), Math.round(Y), (j % 6) ? FX_PSY[1] : FX_PSY[0]);
        }
      }
    } });
  },
};

/* ---------- DRAGON ---------- */
function fxDragonBurst(at, layer, o){
  fxFireBurst(at, layer, { seed:o.seed, big:o.big, pal:FX_DRAGON });
  const rnd = fxRand(o.seed + 9), shards = [];
  for(let i = 0; i < Math.round(6 * (o.big || 1)); i++){ const ang = rnd() * 6.28, v = 70 + rnd() * 90, rot = rnd() * 6;
    shards.push({ x:at.x, y:at.y, vx:Math.cos(ang) * v, vy:Math.sin(ang) * v, life:520, ramp:[0], grav:140, drag:2, delay:30,
      draw(L, x, y, u, c, age){ fxPolyLined(L, fxRot([[0, -3], [2, 0], [0, 3], [-2, 0]], x, y, rot + age * 0.02), u < 0.5 ? FX_DRAGON[1] : FX_DRAGON[2], FX_DRAGON[5]); } }); }
  fxSpray(layer, shards, 800);
}
FX_KIT.Dragon = {
  shot(ctx, a, b, o){ fxFireball(ctx, a, b, { k:o.k, delay:o.delay, time:260, r:5.5 * FX_SHOT * o.big, layer:o.layer, lift:o.lift, pal:FX_DRAGON }); },
  burst(at, layer, o){ fxDragonBurst(at, layer, o); },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const big = o.big || 1;
    if(o.buff) fxBuffLook(id, fxBuffOf('Dragon'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    for(const behind of [true, false]) fxAdd({ layer:behind ? fxUnderOf(id) : fxOverOf(id), dur:1000, step(L, t){      // a ribbon coiling up round it
      const head = Math.min(1, t / 600), tail = Math.max(0, (t - 400) / 600);
      const at = u=>{ const ang = u * Math.PI * 4.5; return { s:Math.sin(ang), x:a.x + Math.cos(ang) * a.w * 0.42 * big, y:a.foot - u * a.h * 1.05 + Math.sin(ang) * 4, w:2.8 - u * 1.2 }; };
      for(let pass = 0; pass < 2; pass++) for(let u = tail; u <= head; u += 0.005){
        const q = at(u);
        if((q.s < 0) !== behind) continue;
        if(pass === 0) fxDisc(L, q.x, q.y, q.w + 1, FX_DRAGON[5]);
        else { fxDisc(L, q.x, q.y, q.w, u > head - 0.04 ? FX_DRAGON[0] : FX_DRAGON[2]); fxSet(L, Math.round(q.x), Math.round(q.y - q.w * 0.5), FX_DRAGON[1]); }
      }
    } });
  },
};

/* ---------- STEEL ---------- */
function fxShuriken(L, x, y, r, ang){
  const pts = [];
  for(let i = 0; i < 8; i++){ const a = ang + i * Math.PI / 4, rr = i % 2 ? r * 0.38 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  fxPolyLined(L, pts, FX_STEEL[2], FX_STEEL[5]);
  fxDisc(L, x, y, Math.max(1, r * 0.22), FX_STEEL[4]);
  fxSet(L, Math.round(x + Math.cos(ang) * r * 0.6), Math.round(y + Math.sin(ang) * r * 0.6), FX_STEEL[0]);
}
FX_KIT.Steel = {
  shot(ctx, a, b, o){
    fxTravel(o.layer, a, b, { delay:o.delay, time:240, lift:o.lift, linear:true }, (L, p, u, t, path)=>{
      const q = path(Math.max(0, u - 0.06));
      fxLine(L, q.x, q.y, p.x, p.y, FX_STEEL[2], 2, 0.5);
      fxShuriken(L, p.x, p.y, 8 * FX_SHOT * o.big, t * 0.04);
    });
  },
  burst(at, layer, o){
    const big = o.big || 1;
    fxFlash(layer, at, 6 * big, FX_STEEL[0], 45);
    fxAdd({ layer, dur:360, step(L, t){ const u = fxEaseOut(t / 360), rr = 6 + u * 18 * big; fxRing(L, at.x, at.y, rr + 1, 1, FX_STEEL[5], 1 - u); fxRing(L, at.x, at.y, rr, 2, FX_STEEL[u < 0.5 ? 1 : 2], 1 - u); } });
    fxSpray(layer, fxBurstParts(at.x, at.y, Math.round(14 * big), { seed:o.seed, vmin:100, vmax:220, grav:300, drag:1.5, ramp:[FX_ELEC[0], FX_ELEC[1], FX_ELEC[2], FX_ELEC[3]], lmin:200, lmax:420, shape:'streak' }), 600);
    const rnd = fxRand(o.seed + 3), bits = [];
    for(let i = 0; i < 5; i++){ const ang = -Math.PI / 2 + (rnd() - 0.5) * 2.4, v = 60 + rnd() * 80, rot = rnd() * 6;
      bits.push({ x:at.x, y:at.y, vx:Math.cos(ang) * v, vy:Math.sin(ang) * v, life:560, ramp:[0], grav:360, drag:0.6, delay:20, draw(L, x, y, u, c, age){ fxPolyLined(L, fxRot([[-2, -2], [3, 0], [-1, 2]], x, y, rot + age * 0.02), FX_STEEL[2], FX_STEEL[5]); } }); }
    fxSpray(layer, bits, 800);
  },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    if(o.buff) fxMetal(id, 1000, 40);                               // (4.16) a buff: grey all over, a bloom of white crossing it
    else fxAdd({ layer:fxOverOf(id), z:-1, dur:700, step(L, t){       // an attack's gathering: a gleam sweeping across it, its outline in silver
      fxGlow(L, id, 0, 0, FX_STEEL[1]);
      fxGlowBand(L, id, -a.w * 0.6 + (t / 500) * a.w * 1.5, 5, FX_STEEL[0]);
    } });
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_STEEL[1], FX_STEEL[2], FX_STEEL[3]], line:FX_STEEL[5], r1:a.w * 0.5, dur:600 });
    fxSpray(fxOverOf(id), [0, 1, 2].map(i=> ({ x:a.x + (i - 1) * a.w * 0.3, y:a.y - a.h * 0.2 + i * 6, vx:0, vy:0, life:300, ramp:[0], delay:250 + i * 120, draw(L, x, y, u){ fxStar4(L, x, y, 4 * Math.sin(u * Math.PI) + 1, FX_STEEL[0], FX_STEEL[0]); } })), 800);
  },
};
/* (4.16) Steel's buff look (Steel Soul, Steel Aegis, a Steel monster's own): the sprite light grey, a bloom of white
   crossing it corner to corner twice, a few glints. */
function fxMetal(id, dur, delay){
  if(!id) return;
  const D = dur || 1000, d0 = delay || 0;
  return fxAdd({ layer:fxOverOf(id), z:-1, dur:d0 + D, step(L, t){
    if(t < d0) return;
    const u = t - d0, cv = u < 140 ? u / 140 : u > D - 220 ? Math.max(0, (D - u) / 220) : 1;
    fxSheen(L, id, { pos:((u - 120) / (D * 0.45)) % 1.0, cover:cv });
  } });
}

/* ---------- FAIRY ---------- */
/* (4.16) The designer: "please change fairy particles to pinkish glitter instead of hearts". A fleck of glitter: it
   catches the light now and then (a little four-pointed glint), and between whiles is a pink speck or two. */
const FX_GLITTER = [fxRGB('#ffffff'), fxRGB('#ffc8ea'), fxRGB('#ff94d2'), fxRGB('#ff62bc'), fxRGB('#e83f9e'), fxRGB('#ffb0de')];
function fxGlitter(L, x, y, k, age, size, cover){
  const c = FX_GLITTER[1 + (k % 5)], X = Math.round(x), Y = Math.round(y);
  if(cover != null && !fxCover(X, Y, cover)) return;
  const ph = (age * 0.011 + k * 1.7) % 2.4;                         // each its own moment to catch the light
  if(ph < 0.9) fxStar4(L, X, Y, (size || 2.5) * Math.sin(ph / 0.9 * Math.PI) + 1, c, FX_GLITTER[0]);
  else { fxRect(L, X, Y, 2, 2, c); fxSet(L, X + (k % 2), Y + 1 - (k % 2), FX_GLITTER[4]); }
}
/* A spray of glitter thrown out from (x, y), settling slowly. */
function fxGlitterParts(x, y, n, o){
  const rnd = fxRand(o.seed || 1), out = [];
  for(let i = 0; i < n; i++){
    const ang = (o.ang != null ? o.ang : 0) + (o.spread != null ? (rnd() - 0.5) * o.spread : rnd() * 6.28), v = (o.vmin || 40) + rnd() * ((o.vmax || 130) - (o.vmin || 40)), k = (o.seed || 1) + i * 7;
    out.push({ x:x + (rnd() - 0.5) * (o.jit || 4), y:y + (rnd() - 0.5) * (o.jit || 4), vx:Math.cos(ang) * v, vy:Math.sin(ang) * v - (o.up || 20), life:(o.life || 700) * (0.75 + rnd() * 0.5), ramp:[0],
      grav:o.grav == null ? 46 : o.grav, drag:o.drag == null ? 2.6 : o.drag, delay:rnd() * (o.delay || 80), size:(o.size || 2.4) * (0.7 + rnd() * 0.6),
      draw(L, px, py, u, c, age){ fxGlitter(L, px, py, k, age, this.size, u > 0.75 ? 1 - (u - 0.75) * 4 : 1); } });
  }
  return out;
}
FX_KIT.Fairy = {
  shot(ctx, a, b, o){
    const trail = [], r = 4.2 * FX_SHOT * o.big, rnd = fxRand(ctx.seed + o.k * 13);
    fxTravel(o.layer, a, b, { delay:o.delay, time:280, lift:o.lift, tail:420, each(L, t){
      trail.forEach(p=>{ const age = t - p.born; if(age > 360) return; fxGlitter(L, p.x, p.y + age * 0.03, p.k, age, 2, 1 - age / 360); });
    } }, (L, p, u, t)=>{
      if(((t / 25) | 0) % 2) trail.push({ x:p.x + (rnd() - 0.5) * r, y:p.y + (rnd() - 0.5) * r, born:t, k:trail.length });
      fxFlameBall(L, p.x, p.y, r, FX_FAIRY, t, ctx.seed, { wob:0.08, cols:[FX_FAIRY[3], FX_FAIRY[2], FX_FAIRY[1], FX_FAIRY[0]], outline:FX_FAIRY[5] });
      for(let i = 0; i < 4; i++){ const ang = t * 0.015 + i * 1.57; fxGlitter(L, p.x + Math.cos(ang) * r * 1.6, p.y + Math.sin(ang) * r * 1.6, i, t + i * 90, 3); }
    });
  },
  burst(at, layer, o){
    const big = o.big || 1;
    fxFlash(layer, at, 6 * big, FX_FAIRY[0], 45);
    fxAdd({ layer, dur:420, step(L, t){ const u = fxEaseOut(t / 420); fxRing(L, at.x, at.y, 5 + u * 18 * big, 2, FX_FAIRY[u < 0.5 ? 2 : 3], 1 - u); } });
    fxSpray(layer, fxGlitterParts(at.x, at.y, Math.round(28 * big), { seed:o.seed, vmin:50, vmax:160 * big, life:900, size:3.4 }), 1200);
  },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    const rnd = fxRand(ctx.seed), sp = [];
    if(o.buff) fxBuffLook(id, fxBuffOf('Fairy'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    for(let i = 0; i < 22; i++){ const k = i * 3; sp.push({ x:a.x + (rnd() - 0.5) * a.w * 0.9, y:a.foot - rnd() * a.h * 0.5, vx:(rnd() - 0.5) * 10, vy:-25 - rnd() * 30, life:700, ramp:[0], delay:rnd() * 500,
      draw(L, x, y, u, c, age){ fxGlitter(L, x, y, k, age, 3, u > 0.75 ? 1 - (u - 0.75) * 4 : 1); } }); }
    fxSpray(fxOverOf(id), sp, 1300);
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_FAIRY[1], FX_FAIRY[2], FX_FAIRY[3]], line:FX_FAIRY[5], r1:a.w * 0.5, dur:700 });
  },
};

/* ---------- NO ELEMENT (the aliens' captains and commanders) ---------- */
const FX_VOID = [fxRGB('#ffe8f0'), fxRGB('#ff8fb0'), fxRGB('#d43c6c'), fxRGB('#8a1f48'), fxRGB('#4a0f30'), fxRGB('#1c0614')];
FX_KIT.Void = {
  shot(ctx, a, b, o){ fxFireball(ctx, a, b, { k:o.k, delay:o.delay, time:260, r:5.5 * FX_SHOT * o.big, layer:o.layer, lift:o.lift, pal:FX_VOID }); },
  burst(at, layer, o){
    const big = o.big || 1;
    fxFireBurst(at, layer, { seed:o.seed, big, pal:FX_VOID });
    fxAdd({ layer, dur:420, step(L, t){ const u = fxEaseOut(t / 420), rr = 6 + u * 20 * big; fxRing(L, at.x, at.y, rr + 1, 1, FX_VOID[5], 1 - u); fxRing(L, at.x, at.y, rr, 2, FX_VOID[2], 1 - u); } });
  },
  aura(ctx, id, o){
    const a = fxAnchor(id); if(!a) return;
    if(o.buff) fxBuffLook(id, fxBuffOf('Void'), 950, 60);   // a buff's look, for a buff (not an attack's gathering)
    fxPuffs(fxUnderOf(id), { x:a.x, y:a.foot - 4 }, 9, { seed:ctx.seed, pal:[FX_VOID[2], FX_VOID[3], FX_VOID[4]], r:5, spread:a.w * 0.8, rise:14, life:700, stagger:250, thick:0.65 });
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_VOID[1], FX_VOID[2], FX_VOID[3]], line:FX_VOID[5], r1:a.w * 0.5 * (o.big || 1), dur:650 });
  },
};
/* (4.16) Each type's buff look: [dark, mid, light] for the sprite's shades, the waves rising, their crests, the rim. */
Object.assign(FX_BUFF, {
  Fire:     { ramp:[fxRGB('#e09a1c'), fxRGB('#ffd23a'), fxRGB('#fff176')], wave:fxRGB('#ff8a1e'), crest:fxRGB('#ff5a14'), rim:fxRGB('#fff4b0') },   // the designer's: yellow, orange waves
  Water:    { ramp:[FX_WATER[3], FX_WATER[2], FX_WATER[1]], wave:FX_WATER[0], crest:fxRGB('#ffffff'), rim:FX_WATER[1] },
  Grass:    { ramp:[FX_GRASS[3], FX_GRASS[2], FX_GRASS[1]], wave:FX_GRASS[0], crest:fxRGB('#ffffff'), rim:FX_GRASS[1] },
  Electric: { ramp:[fxRGB('#e8c21a'), fxRGB('#fff07a'), fxRGB('#fffccc')], wave:fxRGB('#ffffff'), crest:FX_ELEC[2], rim:FX_ELEC[1] },
  Ground:   { ramp:[FX_GROUND[3], FX_GROUND[2], FX_GROUND[1]], wave:FX_GROUND[0], crest:fxRGB('#fff6dc'), rim:FX_GROUND[1] },
  Flying:   { ramp:[FX_FLY[3], FX_FLY[2], FX_FLY[1]], wave:FX_FLY[0], crest:fxRGB('#ffffff'), rim:FX_FLY[1] },
  Physical: { ramp:[FX_PHYS[3], FX_PHYS[2], FX_PHYS[1]], wave:FX_PHYS[0], crest:fxRGB('#ffffff'), rim:FX_PHYS[1] },
  Ghost:    { ramp:[FX_GHOST[3], FX_GHOST[2], FX_GHOST[1]], wave:FX_GHOST[0], crest:fxRGB('#ffffff'), rim:FX_GHOST[1] },
  Psychic:  { ramp:[FX_PSY[3], FX_PSY[2], FX_PSY[1]], wave:FX_PSY[0], crest:fxRGB('#ffffff'), rim:FX_PSY[1] },
  Dragon:   { ramp:[FX_DRAGON[3], FX_DRAGON[2], FX_DRAGON[1]], wave:fxRGB('#d8dcff'), crest:fxRGB('#ffffff'), rim:FX_DRAGON[1] },   // the dragon fire's blue-purple
  Steel:    { ramp:[FX_STEEL[3], FX_STEEL[2], FX_STEEL[1]], wave:FX_STEEL[0], crest:fxRGB('#ffffff'), rim:FX_STEEL[1] },
  Fairy:    { ramp:[fxRGB('#e46cb2'), fxRGB('#ff9fd2'), fxRGB('#ffd6ee')], wave:fxRGB('#ffffff'), crest:fxRGB('#ff5fb4'), rim:fxRGB('#ffd6ee') },
  Void:     { ramp:[FX_VOID[3], FX_VOID[2], FX_VOID[1]], wave:FX_VOID[0], crest:fxRGB('#ffffff'), rim:FX_VOID[1] },
});
/* a filled box, `cover` of it (moved here from 30-fx-moves.js: the kits use it) */
function fxRect(L, x, y, w, h, c, cover){ for(let j = 0; j < h; j++) for(let i = 0; i < w; i++){ const X = Math.round(x) + i, Y = Math.round(y) + j; if(cover == null || fxCover(X, Y, cover)) fxSet(L, X, Y, c); } }

/* The recipe every type's moves share: its kit's shot at each one aimed at (two for a High stone), its burst where
   each blow lands, its aura for a cast on its own side. */
function fxTypeRecipe(type){
  return {
    dur:700, kit:type,
    cast(ctx){
      const K = FX_KIT[type], layer = ctx.side === 'player' ? 'front' : 'back';
      ctx.to.forEach((b, k)=>{
        const a = fxMuzzle(ctx.from, b);
        K.shot(ctx, a, b, { k, big:ctx.big, layer, delay:30 + k * 50 });
        if(ctx.tier === 'high') K.shot(ctx, a, b, { k:k + 7, big:ctx.big * 0.9, layer, delay:105 + k * 50, lift:-14 });
      });
    },
    aura(ctx){ FX_KIT[type].aura(ctx, ctx.fromId, { big:ctx.big, buff:true }); },   // a move of the type cast on its own side: a buff
    impact(ctx, at, k, side){ FX_KIT[type].burst(at, fxLayerFor(side), { seed:ctx.seed + k * 13, big:ctx.big, k }); },
  };
}
const FX_TYPES = {};
Object.keys(FX_KIT).forEach(t=>{ FX_TYPES[t] = fxTypeRecipe(t); });

/* The moves with art of their own: js/30-fx-moves.js fills it. */
const FX_MOVES = {};

/* (4.16) Heavensplitter's critical (the designer: "the screen colour should be inverted except for monkey king and the
   beam weapon"): the screen turned over (the page's root, so its backdrop too: the body's background is drawn outside the
   body's own filter) from `from` ms to `to` ms, all but the art and `keep` (his sprite). On timers
   of its own, not the effects' clock, so it always comes back; a fight drawn afresh meanwhile gets his new sprite kept
   too (fxInvertKeep, from the beam's frames). */
function fxInvertFor(from, to, keep){
  const on = ()=>{ document.documentElement.classList.add('fx-invert'); if(keep) keep.classList.add('fx-keep'); FX.invertTill = Math.max(FX.invertTill || 0, performance.now() + (to - from)); };
  const off = ()=>{ const left = (FX.invertTill || 0) - performance.now(); if(left > 40) setTimeout(off, left); else fxInvertOff(); };   // a second one under way keeps it on to its end
  setTimeout(on, from);
  setTimeout(off, to);
}
function fxInvertOff(){ document.documentElement.classList.remove('fx-invert'); document.querySelectorAll('.fx-keep').forEach(el=> el.classList.remove('fx-keep')); FX.invertTill = 0; }
function fxInvertKeep(id){ if(!document.documentElement.classList.contains('fx-invert')) return; const img = fxSpriteOf(id); if(img && img.classList && !img.classList.contains('fx-keep')) img.classList.add('fx-keep'); }
/* A small shake of the stage, for the heavy blows. */
function fxShake(px, ms){
  const st = document.getElementById('battleStage');
  if(!st || !st.animate) return;
  const k = [];
  for(let i = 0; i <= 6; i++) k.push({ transform:i === 6 ? 'translate(0,0)' : `translate(${(i % 2 ? -1 : 1) * px * (1 - i / 6)}px,${(i % 3 - 1) * px * 0.5 * (1 - i / 6)}px)` });
  try { st.animate(k, { duration:ms || 140, easing:'linear' }); } catch(e){}
}
