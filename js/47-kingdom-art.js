/* ==========================================================
   47-kingdom-art.js — (4.73) THE CITY, DRAWN. The designer: "Please greatly improve the look of the city and surrounding
   forest for the math kingdom."
   The board (46-kingdom-city.js) painted on a canvas as the castle's grounds are: seen from above and a little from the
   south, lit from the upper left, shade falling to the lower right.
   · the forest: oaks in clusters of leaves, firs in drooping tiers, birches; bushes, ferns, rocks, mushrooms; its floor
     dark with moss; trees leaning over their neighbours, drawn back to front;
   · cleared land outside the walls: meadow, the stumps of the burning; fields of sprouts, then wheat, cabbages or
     pumpkins, gold when ripe; watered ones with a stone channel, fertile ones lush, with flowers;
   · inside, plots of lawn with cobbled streets beside what is built: an empty plot beside them pegged out for building;
     the market's square cobbled, the builders' yard sawdust, the granary's straw, the barracks' sand;
   · the buildings, each its own and growing with its level; ruins (broken walls, a fallen roof, ivy) until repaired;
   · the walls: a palisade of stakes, then stone with battlements, corner towers and a gatehouse; the moat all round,
     its bridge; the plots outside kept clear of it.
   (4.74) The map 21 by 21 and the walls as far as the palace's level takes them, towers between their corners; white
   stone, gold bands and domes as they grow to 10; the army on them. "Can you make them scale to 10 and get more and more
   grand each time? Also more and more detailed?" Houses and the mages' towers to 10 (a crystal over the tower from 6);
   from palace 6 each main building fills its 2 by 2 lot at 6 (kept for it, roped and signed, till then): the barracks'
   fort and drill yard, the market's hall and square, the builders' workshop, crane and arch in its scaffold, the
   granary's barn, silos and windmill; the palace on its ground, 2 by 2 (6 to 8), 3 by 2 (9), 4 by 3 on its terrace (10),
   its gardens round it. The workers (the designer's monsters, CREW) and the heir on the palace steps. The forest's trees,
   bushes and the cobbles drawn once and stamped (a board this size).
   Drawn once for each state of the city and size (KC_ART.paint keeps it), so it costs nothing while you look.
   ========================================================== */
const KC_ART = (function(){
const TAU = Math.PI * 2;
/* a seeded dice (mulberry32): the same picture every time for the same plot */
function rng(seed){ let s = seed >>> 0; return ()=>{ s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* the same number for the same two (a cobble's row and column: neighbouring streets meet without a seam) */
function hash(a, b){ let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
/* (4.74) the map: 21 by 21 plots (KC_N), the palace in the middle (KC_C); the walls' reach by the palace's level (kcHalf).
   CUR: what is being drawn ({ C, G, h, P }), set by render */
const N = typeof KC_N !== 'undefined' ? KC_N : 21, MID = typeof KC_C !== 'undefined' ? KC_C : 10, U = N * 100;
const XY = i=> [i % N, Math.floor(i / N)];
let CUR = { h:2, P:1 };
const inside = (x, y)=> Math.abs(x - MID) <= CUR.h && Math.abs(y - MID) <= CUR.h;
function rr(g, x, y, w, h, r){ r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function rrPath(g, x, y, w, h, r){ g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function lin(g, x0, y0, x1, y1, stops){ const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c])=> gr.addColorStop(o, c)); return gr; }
function ell(g, x, y, rx, ry, col, a){ g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, TAU); g.fill(); }
/* a soft shade on the ground, to the lower right of what stands there */
function shade(g, x, y, rx, ry, a){ g.save(); g.fillStyle = `rgba(20,28,12,${a == null ? 0.28 : a})`; g.beginPath(); g.ellipse(x + rx * 0.18, y, rx, ry, 0, 0, TAU); g.fill(); g.restore(); }

/* ---------- WHERE THE WALLS STAND AND THE MOAT RUNS ----------
   The walls on the city's edge (200 and 700). Seen from the south and above, a wall stands up the page: the north
   wall's foot is set into the city by its own height (its top at 200), so the moat beyond it shows. The moat runs all
   round (196 − w to 704 + w), and the plots outside next to it keep out of its way (free). */
function geo(C){
  const W = C.walls || 0, M = C.moat || 0, stone = W >= 2, Pl = typeof kcPal === 'function' ? kcPal(C) : 1, h = typeof kcHalf === 'function' ? kcHalf(Pl) : 2;
  const H = !W ? 0 : stone ? 10 + Math.min(W, 6) + Math.max(0, W - 6) : 16, T = stone ? (W >= 6 ? 12 : 11) : 0, P = !W ? 0 : stone ? H + T + 5 : H + 4;
  const w = M ? 14 + 3 * M : 0, x0 = (MID - h) * 100, x1 = (MID + h + 1) * 100;
  return { W, M, stone, H, T, P, h, Pl, x0, x1, yN:x0 + P, w, lo:M ? x0 - 10 - w : W ? x0 - 6 : x0, hi:M ? x1 + 10 + w : W ? x1 + 8 : x1 };
}
/* the part of a plot outside that is free to grow or build on (kept clear of the walls and the moat) */
function free(x, y, G){
  let x0 = x * 100, y0 = y * 100, x1 = x0 + 100, y1 = y0 + 100;
  const a = MID - G.h - 1, b = MID + G.h + 1;
  if(!inside(x, y)){
    if(x >= a && x <= b){ if(y === a) y1 = Math.min(y1, G.lo); if(y === b) y0 = Math.max(y0, G.hi); }
    if(y >= a && y <= b){ if(x === a) x1 = Math.min(x1, G.lo); if(x === b) x0 = Math.max(x0, G.hi); }
  }
  return [x0, y0, x1, y1];
}

/* ---------- THE GROUND ---------- */
function meadow(g, C){
  g.fillStyle = lin(g, 0, 0, U, U, [[0, '#72ad4e'], [0.55, '#5f9a43'], [1, '#4d8638']]);
  g.fillRect(0, 0, U, U);
  const R = rng(11), A = (U / 900) * (U / 900);
  for(let i = 0; i < 160 * A; i++){ g.fillStyle = R() < 0.5 ? `rgba(38,74,28,${0.05 + R() * 0.08})` : `rgba(160,205,105,${0.05 + R() * 0.07})`; g.beginPath(); g.ellipse(R() * U, R() * U, 18 + R() * 60, 10 + R() * 34, R() * TAU, 0, TAU); g.fill(); }
  /* blades, batched by colour: only where they can be seen (not under the forest) */
  const open = C ? C.cells.map(c=> c.k !== 'wild') : null;
  ['#5a9640', '#7ab656', '#4a8436', '#8ec865', '#679f49'].forEach(c=>{
    g.strokeStyle = c; g.lineWidth = 1.2; g.beginPath();
    for(let i = 0; i < 1100 * A; i++){ const x = R() * U, y = R() * U, h = 3 + R() * 4.5; if(open && !open[Math.floor(y / 100) * N + Math.floor(x / 100)]) continue; g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3.2, y - h); }
    g.stroke();
  });
}
/* the forest floor, dark with moss, soft at its edge */
function forestFloor(g, C){
  /* (4.74) dark under the trees: a small picture of the map, a few pixels to a plot, drawn soft over the whole board (on a
     board this size, quicker than a shading for each plot) */
  const q = 4, m = document.createElement('canvas'); m.width = m.height = N * q + 2;
  const mg = m.getContext('2d'); mg.fillStyle = 'rgba(30,58,24,.88)';
  C.cells.forEach((c, i)=>{ if(c.k !== 'wild') return; const [x, y] = XY(i); mg.fillRect(1 + x * q, 1 + y * q, q, q); });
  const blur = document.createElement('canvas'); blur.width = blur.height = m.width;
  const bg = blur.getContext('2d'); try { bg.filter = 'blur(1.2px)'; } catch(e){} bg.drawImage(m, 0, 0);
  g.save(); g.imageSmoothingEnabled = true; g.drawImage(bg.filter && bg.filter !== 'none' ? blur : m, 1, 1, N * q, N * q, 0, 0, U, U); g.restore();
  const R = rng(23);
  C.cells.forEach((c, i)=>{
    if(c.k !== 'wild') return;
    const [x, y] = XY(i);
    for(let k = 0; k < 14; k++) ell(g, x * 100 + R() * 100, y * 100 + R() * 100, 3 + R() * 8, 2 + R() * 4, R() < 0.5 ? 'rgba(78,118,52,.5)' : 'rgba(104,84,48,.35)', R() * 3);
  });
}
/* a plot of lawn in the city: mown in stripes (rough and weedy round a ruin) */
function lawn(g, x0, y0, seed, rough){
  g.fillStyle = rough ? lin(g, x0, y0, x0 + 100, y0 + 100, [[0, '#7aa955'], [1, '#62914a']]) : lin(g, 0, 0, U, U, [[0, '#9acb6e'], [1, '#7fb459']]);
  g.fillRect(x0, y0, 100, 100);
  if(!rough){ g.fillStyle = 'rgba(255,255,255,.07)'; for(let k = 0; k < 100; k += 25) g.fillRect(x0, y0 + k, 100, 12.5); }
  const R = rng(seed);
  g.strokeStyle = rough ? '#4f8a3a' : '#6aa64c'; g.lineWidth = 1.1; g.beginPath();
  for(let k = 0; k < (rough ? 34 : 14); k++){ const x = x0 + R() * 100, y = y0 + R() * 100; g.moveTo(x, y); g.lineTo(x - 1.5, y - 3.5); g.moveTo(x, y); g.lineTo(x + 1.6, y - 3); }
  g.stroke();
  if(!rough) for(let k = 0; k < 4; k++) ell(g, x0 + 6 + R() * 88, y0 + 6 + R() * 88, 1.3, 1.3, k % 2 ? '#ffffff' : '#f6e27a');
}
/* trodden earth: the builders' yard (sawdust and chips), the granary's (straw) */
function earth(g, x0, y0, seed, top, bottom, straw){
  g.fillStyle = lin(g, x0, y0, x0 + 100, y0 + 100, [[0, top], [1, bottom]]); g.fillRect(x0, y0, 100, 100);
  const R = rng(seed);
  for(let k = 0; k < 30; k++) ell(g, x0 + R() * 100, y0 + R() * 100, 1 + R() * 2.4, 0.7 + R() * 1.2, R() < 0.5 ? 'rgba(90,64,36,.3)' : 'rgba(255,244,215,.35)', R() * 3);
  g.strokeStyle = straw ? 'rgba(240,212,120,.9)' : 'rgba(236,206,150,.8)'; g.lineWidth = straw ? 0.9 : 1.4; g.beginPath();
  for(let k = 0; k < (straw ? 46 : 22); k++){ const x = x0 + R() * 100, y = y0 + R() * 100, a = R() * TAU, l = straw ? 4.5 : 2; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); }
  g.stroke();
}
/* cobbles, on one grid for the whole city (so that streets meet without a seam), clipped to a rectangle */
const COB = ['#d9cdb4', '#cfc2a6', '#c6b89b', '#e0d5bf', '#c1b295', '#d3c6aa', '#bcae92'];
/* (4.74) the cobbles of each size drawn once into a tile (at the board's sharpness, CUR.k pixels to a unit) and laid as a
   pattern from the board's corner: the same grid everywhere, and quick on a board this size. Drawn only where the board's
   own scale is in force (not inside a building's art grown with GROW) */
const TILES = {};
function cobbleTile(sz, k){
  const id = sz + '@' + k.toFixed(4);
  if(TILES[id]) return TILES[id];
  const h = sz * 0.85, wS = sz * 1.15, key = Math.round(sz * 10), nC = Math.max(6, Math.round(64 / wS)), nR = 2 * Math.max(3, Math.round(32 / h));
  const tw = Math.max(8, Math.round(nC * wS * k)), th = Math.max(8, Math.round(nR * h * k));
  const c = document.createElement('canvas'); c.width = tw; c.height = th;
  const g = c.getContext('2d'); g.scale(tw / (nC * wS), th / (nR * h));
  g.fillStyle = '#958871'; g.fillRect(0, 0, nC * wS, nR * h);
  for(let r = -1; r <= nR; r++){
    const off = (((r % 2) + 2) % 2) * wS * 0.5, y = r * h, rm = ((r % nR) + nR) % nR;
    for(let q = -1; q <= nC; q++){
      const hs = hash(rm * 7 + key, ((q % nC) + nC) % nC), x = off + q * wS + ((hs & 7) / 7 - 0.5) * 0.7;
      g.fillStyle = COB[hs % COB.length]; rr(g, x + 0.55, y + 0.55, wS - 1.1, h - 1.1, Math.min(2.2, h * 0.36)); g.fill();
      g.fillStyle = 'rgba(255,255,255,.24)'; g.fillRect(x + 1.4, y + 1.1, wS - 3.2, Math.max(0.7, h * 0.15));
    }
  }
  return (TILES[id] = c);
}
function stones(g, x0, y0, x1, y1, sz){
  const k = CUR.k || 1, pat = g.createPattern(cobbleTile(sz, k), 'repeat');
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = pat;
  g.fillRect(x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k);
  g.restore();
}
/* an empty plot in the city, pegged out for building */
function pegs(g, x0, y0){
  const P = [[x0 + 22, y0 + 28], [x0 + 78, y0 + 28], [x0 + 78, y0 + 82], [x0 + 22, y0 + 82]];
  g.strokeStyle = 'rgba(255,250,232,.9)'; g.lineWidth = 0.9; g.beginPath(); P.forEach(([px, py], k)=> k ? g.lineTo(px, py - 4.5) : g.moveTo(px, py - 4.5)); g.closePath(); g.stroke();
  P.forEach(([px, py])=>{ shade(g, px + 1, py + 0.4, 2.4, 0.9, 0.3); g.fillStyle = '#8a5a2b'; g.fillRect(px - 1.2, py - 6, 2.4, 6.2); g.fillStyle = '#d8a060'; g.fillRect(px - 1.2, py - 6, 2.4, 1.4); });
}
/* the ground of a plot inside the walls */
const lvOf = (C, key)=>{ const i = typeof kcSeatOf === 'function' ? kcSeatOf(C, key) : -1, c = C.cells[i]; return c && c.k === key ? (c.lv || 0) : 0; };
const palFoot = P=> typeof kcPalaceFoot === 'function' ? kcPalaceFoot(P) : [MID, MID, 1, 1];
const inRect = (x, y, f)=> x >= f[0] && x < f[0] + f[2] && y >= f[1] && y < f[1] + f[3];
function lot(g, x, y, c, i, road){
  const x0 = x * 100, y0 = y * 100, k = c.k, C = CUR.C;
  /* (4.74) the palace's ground: paved under it, gardens round it; a main building's lot: its own ground once it fills it,
     kept for it till then */
  if(k === 'part'){
    if(c.of === 'palace') return inRect(x, y, palFoot(CUR.P)) ? stones(g, x0, y0, x0 + 100, y0 + 100, 9) : garden(g, x0, y0, i);
    return lvOf(C, c.of) >= 6 ? ground(g, c.of, x0, y0, i) : allotted(g, x0, y0, i);
  }
  if(C.plan && k === 'palace') return stones(g, x0, y0, x0 + 100, y0 + 100, 9);
  if(C.plan && BIG[k] && (c.lv || 0) >= 6) return ground(g, k, x0, y0, i);
  const ruined = !!ART[k] && !c.lv;
  if(k === 'market' && !ruined){ stones(g, x0, y0, x0 + 100, y0 + 100, 8.5); return; }
  if(k === 'yard' && !ruined){ earth(g, x0, y0, i * 7 + 1, '#c9ab7a', '#a98b5c', false); return; }
  if(k === 'granary' && !ruined){ earth(g, x0, y0, i * 7 + 2, '#cdb27a', '#b09260', true); return; }
  lawn(g, x0, y0, i * 7 + 3, ruined);
  if(k === 'tower'){ g.fillStyle = 'rgba(190,180,160,.85)'; g.beginPath(); g.ellipse(x0 + 50, y0 + 88, 30, 10, 0, 0, TAU); g.fill(); const R = rng(i + 5); for(let j = 0; j < 30; j++) ell(g, x0 + 22 + R() * 56, y0 + 82 + R() * 12, 0.9, 0.7, R() < 0.5 ? '#8f8676' : '#ece6d8'); }
  if(k === 'palace'){ stones(g, x0 + 32, y0 + 84, x0 + 68, y0 + 100, 6); [x0 + 24, x0 + 76].forEach(hx=>{ shade(g, hx + 1, y0 + 95, 5, 1.8, 0.3); ell(g, hx, y0 + 90, 4.4, 4.8, '#3f7f36'); ell(g, hx - 1.2, y0 + 88.6, 2.6, 2.8, '#62a24c'); }); }
  if(k === 'house'){ stones(g, x0 + 45, y0 + 84, x0 + 55, y0 + 100, 4.6); const R = rng(i + 9); for(let j = 0; j < 9; j++){ const fx = j < 5 ? x0 + 12 + j * 5 : x0 + 64 + (j - 5) * 5; ell(g, fx, y0 + 95 + R() * 2, 2.2, 1.8, '#4f8f3a'); ell(g, fx + R(), y0 + 94 + R() * 2, 1.2, 1.2, ['#e8414f', '#f2c23a', '#c9a6f0', '#f08bb4', '#ffffff'][j % 5]); } }
  if(k === 'clear' && !road && nearBuilt(C, x, y)) pegs(g, x0, y0);
}
/* a plot with something built beside it (a building, its ground or lot): there the streets run and the pegs go in */
const builtAt = (C, x, y)=>{ const c = x >= 0 && y >= 0 && x < N && y < N && C.cells[y * N + x]; return !!c && c.k !== 'clear' && c.k !== 'wild'; };
const nearBuilt = (C, x, y)=> builtAt(C, x + 1, y) || builtAt(C, x - 1, y) || builtAt(C, x, y + 1) || builtAt(C, x, y - 1);
/* streets: a cobbled one along every side two plots of the city share where one of them is built on (not inside one
   building's ground); from the gate up the empty plots of the middle column, the road */
function streets(g, C, G, road){
  const ok = (x, y)=> inside(x, y) && C.cells[y * N + x].k !== 'wild';
  const own = (x, y)=> typeof kcOwner === 'function' ? kcOwner(C, y * N + x) : null;
  const same = (a, b)=> a && a === b;
  for(let y = MID - G.h; y <= MID + G.h; y++) for(let x = MID - G.h; x <= MID + G.h; x++){
    if(!ok(x, y)) continue;
    if(ok(x + 1, y) && (builtAt(C, x, y) || builtAt(C, x + 1, y)) && !same(own(x, y), own(x + 1, y))) stones(g, (x + 1) * 100 - 8, y * 100, (x + 1) * 100 + 8, y * 100 + 100, 6);
    if(ok(x, y + 1) && (builtAt(C, x, y) || builtAt(C, x, y + 1)) && !same(own(x, y), own(x, y + 1))) stones(g, x * 100, (y + 1) * 100 - 8, x * 100 + 100, (y + 1) * 100 + 8, 6);
  }
  road.forEach(i=>{ const [x, y] = XY(i); stones(g, x * 100 + 40, y * 100, x * 100 + 60, y * 100 + 100, 6); });
}
/* cleared land outside the walls: a scatter of flowers where the Fire form burnt it back */
function clearedFlat(g, F, i){
  const [x0, y0, x1, y1] = F, R = rng(i * 131 + 7);
  for(let k = 0; k < 2; k++){ const x = x0 + 20 + R() * (x1 - x0 - 40), y = y0 + 20 + R() * (y1 - y0 - 40); ell(g, x, y, 9 + R() * 8, 4 + R() * 4, 'rgba(96,84,66,.16)', R()); }
  for(let k = 0; k < 7; k++) ell(g, x0 + 8 + R() * (x1 - x0 - 16), y0 + 8 + R() * (y1 - y0 - 16), 1.6, 1.6, ['#f4e27a', '#ffffff', '#f2a7c3', '#b7a4f0'][k % 4]);
}
/* a stump, burnt at its top */
function stump(g, x, y, r){
  shade(g, x + 2, y + 1.5, r * 1.3, r * 0.45, 0.22);
  g.fillStyle = lin(g, x - r, 0, x + r, 0, [[0, '#9a7050'], [0.55, '#76533a'], [1, '#4e3522']]);
  g.beginPath(); g.moveTo(x - r, y - r * 0.9); g.lineTo(x - r * 1.18, y + 0.5); g.lineTo(x + r * 1.18, y + 0.5); g.lineTo(x + r, y - r * 0.9); g.fill();
  ell(g, x, y - r * 0.9, r, r * 0.42, '#c9a878');
  g.strokeStyle = 'rgba(110,80,50,.7)'; g.lineWidth = 0.7; g.beginPath(); g.ellipse(x, y - r * 0.9, r * 0.62, r * 0.25, 0, 0, TAU); g.stroke();
  ell(g, x + r * 0.25, y - r * 0.95, r * 0.35, r * 0.16, 'rgba(50,40,32,.55)');
}

/* ---------- THE FOREST ---------- */
const OAK = ['#86be5e', '#66a146', '#4d8737', '#3b712d', '#2c5c25', '#204a1c'];
const OAK2 = ['#97c35a', '#78ad45', '#5d9437', '#477b2d', '#365f24', '#284a1c'];
function oak(g, x, y, s, R){
  const pal = R() < 0.35 ? OAK2 : OAK, h = 40 * s, rx = 30 * s, ry = 24 * s, cy = y - h;
  shade(g, x + 4, y + 2, rx * 0.95, ry * 0.32, 0.32);
  g.fillStyle = lin(g, x - 5 * s, 0, x + 5 * s, 0, [[0, '#7e5a3a'], [0.5, '#5e4129'], [1, '#3f2b1a']]);
  g.beginPath(); g.moveTo(x - 4.2 * s, y); g.quadraticCurveTo(x - 3 * s, y - h * 0.4, x - 2.6 * s, cy + ry * 0.3); g.lineTo(x + 2.6 * s, cy + ry * 0.3); g.quadraticCurveTo(x + 3 * s, y - h * 0.4, x + 4.6 * s, y); g.closePath(); g.fill();
  ell(g, x, y - 0.4, 6.2 * s, 2.2 * s, '#5e4129');
  /* the crown: a ring of clusters and more inside, each its knot of shade, then its leaves */
  const cl = [], ring = 7, a0 = R() * TAU;
  for(let i = 0; i < ring; i++){ const a = a0 + (i + (R() - 0.5) * 0.4) * TAU / ring, d = 0.66 + (R() - 0.5) * 0.14; cl.push([x + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, (10 + R() * 3.5) * s]); }
  for(let i = 0; i < 4; i++){ const a = R() * TAU, d = Math.sqrt(R()) * 0.4; cl.push([x + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry - 2 * s, (11 + R() * 4) * s]); }
  cl.sort((p, q)=> p[1] - q[1]);
  const lit = (px, py)=> Math.max(0, Math.min(1, 0.55 - ((px - x) / rx) * 0.38 - ((py - cy) / ry) * 0.45));
  cl.forEach(([px, py, r])=>{ const L = lit(px, py); g.fillStyle = L > 0.5 ? pal[3] : L > 0.28 ? pal[4] : pal[5];
    for(let j = 0; j < 5; j++){ const b = j / 5 * TAU + R() * 0.7, o = r * (0.3 + R() * 0.18); g.beginPath(); g.arc(px + r * 0.05 + Math.cos(b) * o, py + r * 0.1 + Math.sin(b) * o * 0.85, r * (0.52 + R() * 0.14), 0, TAU); g.fill(); } });
  cl.forEach(([px, py, r])=>{
    const L = lit(px, py);
    for(let j = 0; j < 20; j++){
      const a = R() * TAU, d = Math.sqrt(R()) * r * 1.02, qx = px + Math.cos(a) * d - r * 0.06, qy = py + Math.sin(a) * d * 0.86 - r * 0.08;
      const t = Math.max(0, Math.min(5, Math.round((1 - L) * 2.3 + (((qx - px) + (qy - py)) / (1.6 * r)) * 2.1 + R() * 0.9)));
      g.fillStyle = pal[t]; g.beginPath(); g.ellipse(qx, qy, (2.9 + R() * 1.6) * s, (1.7 + R() * 0.8) * s, a, 0, TAU); g.fill();
    }
  });
}
function fir(g, x, y, s, R){
  const h = 64 * s, w = 22 * s, tiers = 5;
  shade(g, x + 5, y + 2, w * 0.95, w * 0.3, 0.32);
  g.fillStyle = '#4e3522'; g.fillRect(x - 2.2 * s, y - 9 * s, 4.4 * s, 9 * s);
  for(let t = 0; t < tiers; t++){
    const f = t / tiers, ty = y - 6 * s - f * h * 0.78, tw = w * (1 - f * 0.72), th = h * 0.32;
    g.fillStyle = t % 2 ? '#1f4a2d' : '#225232';
    g.beginPath(); g.moveTo(x, ty - th);
    g.quadraticCurveTo(x - tw * 0.4, ty - th * 0.45, x - tw, ty);
    for(let k = 0; k <= 6; k++){ const px = x - tw + (2 * tw) * k / 6; g.lineTo(px, ty + (k % 2 ? 3.2 : 0.4) * s); }
    g.quadraticCurveTo(x + tw * 0.4, ty - th * 0.45, x, ty - th); g.fill();
    g.fillStyle = '#3a7348';
    g.beginPath(); g.moveTo(x, ty - th); g.quadraticCurveTo(x - tw * 0.4, ty - th * 0.45, x - tw, ty); g.lineTo(x - tw * 0.15, ty + 1.5 * s); g.closePath(); g.fill();
    g.fillStyle = 'rgba(160,210,160,.18)'; g.beginPath(); g.moveTo(x - tw * 0.2, ty - th * 0.6); g.lineTo(x - tw * 0.72, ty - 1); g.lineTo(x - tw * 0.36, ty - 0.5); g.closePath(); g.fill();
  }
}
/* a birch: white bark marked black, a light, hanging crown */
function birch(g, x, y, s, R){
  const h = 38 * s, rx = 21 * s, ry = 20 * s, cy = y - h;
  shade(g, x + 3, y + 1.5, rx * 0.85, ry * 0.26, 0.24);
  g.fillStyle = lin(g, x - 3 * s, 0, x + 3 * s, 0, [[0, '#fbfaf3'], [0.6, '#e6e3d6'], [1, '#bdb9a9']]);
  g.beginPath(); g.moveTo(x - 2.6 * s, y); g.lineTo(x - 1.7 * s, cy); g.lineTo(x + 1.7 * s, cy); g.lineTo(x + 2.8 * s, y); g.closePath(); g.fill();
  g.fillStyle = '#2b2b28';
  for(let k = 0; k < 6; k++){ const yy = y - 4 * s - k * h * 0.13; g.fillRect(x - 2.3 * s + R() * 1.5 * s, yy, (1.2 + R() * 1.6) * s, 0.9 * s); }
  const pal = ['#c9e184', '#b0d26a', '#93c058', '#77a648', '#5f8a3a', '#4a6e2e'];
  for(let j = 0; j < 90; j++){
    const a = R() * TAU, d = Math.sqrt(R()), qx = x + Math.cos(a) * d * rx, qy = cy + Math.sin(a) * d * ry + d * d * 4 * s;
    const t = Math.max(0, Math.min(5, Math.round(d * 1.6 + (((qx - x) + (qy - cy)) / (rx + ry)) * 2.4 + 0.8 + R() * 0.9)));
    g.fillStyle = pal[t]; g.beginPath(); g.ellipse(qx, qy, (1.3 + R() * 0.6) * s, (2.4 + R() * 1) * s, (R() - 0.5) * 0.7, 0, TAU); g.fill();
  }
}
function bush(g, x, y, s, R, berries){
  shade(g, x + 2, y + 1, 11 * s, 3.6 * s, 0.26);
  const pal = ['#7cb556', '#5f9c44', '#4a8336', '#386c2b'];
  for(let k = 0; k < 4; k++){ const bx = x + (R() - 0.5) * 12 * s, by = y - 4 * s - R() * 5 * s, r = (5 + R() * 3) * s; ell(g, bx + 1, by + 1.2, r, r * 0.82, pal[3]); ell(g, bx - 0.8, by - 0.6, r * 0.82, r * 0.66, pal[1 + (k % 2)]); ell(g, bx - 2, by - 2, r * 0.38, r * 0.28, pal[0]); }
  if(berries) for(let k = 0; k < 6; k++) ell(g, x + (R() - 0.5) * 14 * s, y - 3 * s - R() * 8 * s, 1.3 * s, 1.3 * s, '#c8323a');
}
function fern(g, x, y, s, R){
  g.strokeStyle = '#4f8a3a'; g.lineWidth = 1.3 * s;
  for(let k = 0; k < 6; k++){
    const a = -Math.PI / 2 + (k - 2.5) * 0.42 + (R() - 0.5) * 0.2, L = (9 + R() * 4) * s, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.8;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + ex) / 2 + Math.cos(a + 1.2) * 2, (y + ey) / 2, ex, ey); g.stroke();
    for(let j = 1; j < 5; j++){ const u = j / 5, px = x + (ex - x) * u, py = y + (ey - y) * u; ell(g, px - 1.6 * s, py, 1.8 * s, 0.8 * s, '#6aa84e', a + 1.2); ell(g, px + 1.6 * s, py, 1.8 * s, 0.8 * s, '#5a9a44', a - 1.2); }
  }
}
function rock(g, x, y, s){
  shade(g, x + 2, y + 1, 9 * s, 3 * s, 0.3);
  g.fillStyle = lin(g, x - 8 * s, y - 8 * s, x + 8 * s, y, [[0, '#b9b4a6'], [1, '#77726a']]);
  g.beginPath(); g.moveTo(x - 9 * s, y); g.lineTo(x - 7 * s, y - 6 * s); g.lineTo(x - 1 * s, y - 9 * s); g.lineTo(x + 6 * s, y - 7 * s); g.lineTo(x + 9 * s, y - 1 * s); g.closePath(); g.fill();
  ell(g, x - 3 * s, y - 7.2 * s, 4 * s, 1.6 * s, 'rgba(110,160,70,.8)', -0.2);
}
function mushrooms(g, x, y, s, R){
  for(let k = 0; k < 3; k++){ const mx = x + (k - 1) * 4 * s + (R() - 0.5) * 2, my = y + (R() - 0.5) * 2, r = (2.2 + R() * 1.2) * s;
    g.fillStyle = '#efe6d2'; g.fillRect(mx - 0.8 * s, my - r, 1.6 * s, r);
    ell(g, mx, my - r, r * 1.25, r * 0.75, '#c8323a'); ell(g, mx - r * 0.4, my - r * 1.15, r * 0.25, r * 0.15, '#ffffff'); ell(g, mx + r * 0.35, my - r * 0.9, r * 0.18, r * 0.12, '#ffffff'); }
}
/* (4.74) the forest is big now: a dozen oaks, firs and birches drawn once each (at the board's sharpness, a quarter larger
   than the largest), then stamped where the trees stand. [draw, how many, its box at scale 1: width, height, x and y of
   its foot in it] */
const TREES = { oak:[oak, 12, 84, 92, 41, 80], fir:[fir, 7, 58, 82, 26, 72], birch:[birch, 6, 54, 75, 26, 66],
  bush:[(g, x, y, s, R)=> bush(g, x, y, s, R, false), 5, 36, 26, 17, 20], bushB:[(g, x, y, s, R)=> bush(g, x, y, s, R, true), 4, 36, 26, 17, 20],
  fern:[fern, 4, 34, 20, 17, 16], rock:[(g, x, y, s)=> rock(g, x, y, s), 1, 26, 16, 11, 11], mush:[mushrooms, 4, 24, 14, 12, 11] }, STAMPS = { k:0 };
function stamps(k){
  if(STAMPS.k === k) return STAMPS;
  Object.keys(STAMPS).forEach(key=> delete STAMPS[key]); STAMPS.k = k;
  const sc = k * 1.25;
  Object.entries(TREES).forEach(([kind, [fn, n, w, h, ax, ay]])=>{
    STAMPS[kind] = Array.from({ length:n }, (_, j)=>{
      const c = document.createElement('canvas'); c.width = Math.ceil(w * sc); c.height = Math.ceil(h * sc);
      const g = c.getContext('2d'); g.scale(sc, sc); fn(g, ax, ay, 1, rng(7001 + j * 7919 + kind.length * 131));
      return { c, w, h, ax, ay };
    });
  });
  return STAMPS;
}
function tree(g, kind, x, y, s, n){
  const list = stamps(CUR.k || 1)[kind], t = list[n % list.length];
  g.drawImage(t.c, x - t.ax * s, y - t.ay * s, t.w * s, t.h * s);
}
/* the forest has its parts: dark with firs in some, oaks and birches in others (a slow wave over the board) */
const zone = (x, y)=> Math.max(0, Math.min(1, 0.5 + 0.3 * Math.sin(x * 0.83 + 1.3) * Math.cos(y * 0.71 - 0.4) + 0.22 * Math.sin((x + y) * 0.47 + 2.1)));
/* a glade here and there: a clearing in the trees, with a pond, a fallen log, or a deer; rabbits */
const glade = (i, ctx)=> hash(i, 77) % 8 === 3 && !ctx.path.includes(i);
const gladeKind = i=> ['pond', 'log', 'deer'][hash(i, 78) % 3];
function gladeFloor(g, i, F){
  const cx = (F[0] + F[2]) / 2, cy = (F[1] + F[3]) / 2 + 4, rx = (F[2] - F[0]) * 0.46, ry = (F[3] - F[1]) * 0.4, R = rng(i * 5 + 3);
  /* a few soft patches of light overlapping: no edge to it */
  for(let k = 0; k < 6; k++){
    const bx = cx + (R() - 0.5) * rx * 0.9, by = cy + (R() - 0.5) * ry * 0.8, br = Math.min(rx, ry) * (0.5 + R() * 0.32);
    const gr = g.createRadialGradient(bx, by, 2, bx, by, br);
    gr.addColorStop(0, 'rgba(120,176,80,.6)'); gr.addColorStop(0.55, 'rgba(106,162,70,.42)'); gr.addColorStop(1, 'rgba(90,140,60,0)');
    g.fillStyle = gr; g.fillRect(bx - br, by - br, br * 2, br * 2);
  }
  for(let k = 0; k < 12; k++){ const a = R() * TAU, d = Math.sqrt(R()) * 0.8; ell(g, cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, 1.5, 1.5, ['#f4e27a', '#ffffff', '#f2a7c3', '#b7a4f0', '#ff9d6e'][k % 5]); }
  if(gladeKind(i) === 'pond'){
    const px = cx + 4, py = cy + 4;
    g.fillStyle = '#6f8a52'; g.beginPath(); g.ellipse(px, py, 25, 14, 0, 0, TAU); g.fill();
    g.fillStyle = lin(g, 0, py - 12, 0, py + 12, [[0, '#2f78b6'], [1, '#4f9fe0']]);
    g.beginPath(); for(let k = 0; k <= 16; k++){ const a = k / 16 * TAU, r = 1 + Math.sin(a * 3 + i) * 0.08; const qx = px + Math.cos(a) * 22 * r, qy = py + Math.sin(a) * 11.5 * r; k ? g.lineTo(qx, qy) : g.moveTo(qx, qy); } g.closePath(); g.fill();
    g.strokeStyle = 'rgba(230,246,255,.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px - 10, py + 2); g.quadraticCurveTo(px - 6, py + 0.5, px - 2, py + 2); g.moveTo(px + 5, py - 3); g.quadraticCurveTo(px + 9, py - 4.5, px + 13, py - 3); g.stroke();
    [[px - 12, py - 4], [px + 10, py + 5], [px + 2, py - 6]].forEach(([lx, ly], k)=>{ g.fillStyle = '#3f8a3a'; g.beginPath(); g.moveTo(lx, ly); g.arc(lx, ly, 2.8, 0.3, TAU - 0.3); g.closePath(); g.fill(); if(!k) ell(g, lx + 0.8, ly - 0.8, 1.1, 1.1, '#f6c6da'); });
  }
}
/* the glade's own things, standing */
function reeds(g, x, y){
  g.strokeStyle = '#5f8a3a'; g.lineWidth = 1.1;
  for(let k = 0; k < 7; k++){ const rx = x + k * 3.2 - 10, h = 9 + (k % 3) * 3; g.beginPath(); g.moveTo(rx, y); g.quadraticCurveTo(rx + 1, y - h * 0.6, rx + (k % 2 ? 1.6 : -1.2), y - h); g.stroke(); if(k % 2 === 0) ell(g, rx + (k % 2 ? 1.6 : -1.2), y - h + 1.5, 1, 2.4, '#7a4f28'); }
}
function log(g, x, y, R){
  shade(g, x + 3, y + 1.5, 20, 3, 0.3);
  g.fillStyle = lin(g, 0, y - 8, 0, y, [[0, '#9a7050'], [0.5, '#7a5538'], [1, '#4e3522']]);
  rr(g, x - 20, y - 8, 38, 8, 4); g.fill();
  ell(g, x + 18, y - 4, 2.8, 4, '#d9b88a'); g.strokeStyle = 'rgba(110,80,50,.7)'; g.lineWidth = 0.6; g.beginPath(); g.ellipse(x + 18, y - 4, 1.4, 2.2, 0, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(40,26,14,.35)'; g.lineWidth = 0.7; g.beginPath(); for(let k = 0; k < 5; k++){ g.moveTo(x - 16 + k * 7, y - 7); g.lineTo(x - 13 + k * 7, y - 1.5); } g.stroke();
  for(let k = 0; k < 5; k++) ell(g, x - 14 + k * 5 + R() * 2, y - 8, 2.4, 1.3, k % 2 ? '#6aa84e' : '#4f8a3a');
  mushrooms(g, x - 8, y + 3, 0.8, R);
}
function deer(g, x, y, s){
  shade(g, x, y + 0.5, 9 * s, 2 * s, 0.28);
  const body = '#b8794a', dark = '#8a5530';
  g.strokeStyle = dark; g.lineWidth = 1.5 * s; g.lineCap = 'round'; g.beginPath();
  [[-5.5, 0], [-3.5, 0.4], [4, 0.4], [6, 0]].forEach(([lx, k])=>{ g.moveTo(x + lx * s, y - 7 * s); g.lineTo(x + (lx + k) * s, y); }); g.stroke(); g.lineCap = 'butt';
  ell(g, x, y - 8.5 * s, 8 * s, 4 * s, body);
  ell(g, x - 1, y - 10 * s, 5 * s, 1.6 * s, 'rgba(255,255,255,.18)');
  for(let k = 0; k < 4; k++) ell(g, x - 3 * s + k * 2.4 * s, y - 9.5 * s + (k % 2) * 1.2 * s, 0.7 * s, 0.7 * s, '#f6e6cf');
  ell(g, x - 8 * s, y - 9.5 * s, 1.6 * s, 1.2 * s, '#f6e6cf');
  g.fillStyle = body; g.beginPath(); g.moveTo(x + 5 * s, y - 10 * s); g.lineTo(x + 8.5 * s, y - 16 * s); g.lineTo(x + 10.5 * s, y - 15 * s); g.lineTo(x + 8 * s, y - 8.5 * s); g.closePath(); g.fill();
  ell(g, x + 10.5 * s, y - 16.5 * s, 3 * s, 2 * s, body, -0.3);
  ell(g, x + 13 * s, y - 15.8 * s, 1 * s, 0.8 * s, '#2b1d14');
  ell(g, x + 8.6 * s, y - 19 * s, 0.9 * s, 2 * s, dark, -0.5); ell(g, x + 10.4 * s, y - 19.4 * s, 0.9 * s, 2 * s, dark, 0.3);
  ell(g, x + 10 * s, y - 16.8 * s, 0.6 * s, 0.6 * s, '#1a120c');
}
function rabbit(g, x, y){
  shade(g, x + 0.5, y + 0.4, 3.6, 1, 0.25);
  ell(g, x, y - 2.4, 3.4, 2.5, '#a8957e'); ell(g, x + 2.8, y - 4.2, 1.9, 1.6, '#a8957e');
  ell(g, x + 2.4, y - 7, 0.6, 2, '#a8957e', 0.15); ell(g, x + 3.4, y - 6.8, 0.6, 1.9, '#968470', 0.35);
  ell(g, x - 3.2, y - 2.6, 1.1, 1.1, '#ffffff'); ell(g, x + 3.6, y - 4.4, 0.4, 0.4, '#1a120c');
}
/* the track out of the town to the south, through the trees (and the burnt plots) */
const trackX = y=> MID * 100 + 50 + 8 * Math.sin(y / 34 + 0.6);
function trackRows(C, G){
  const rows = [], h = G && G.h != null ? G.h : CUR.h;
  for(let y = MID + h; y < N; y++){ const c = C.cells[y * N + MID]; if(c.k === 'field') break; if(c.k === 'wild' || (c.k === 'clear' && !(Math.abs(y - MID) <= h))) rows.push(y); }
  return rows;
}
function track(g, C, G){
  const rows = trackRows(C, G);
  rows.forEach(y=>{
    const start = y === MID + G.h + 1 ? (G.M ? G.x1 + 8 + G.w : G.W ? G.x1 + 3 : G.x1) : y * 100, end = y * 100 + 100;
    const pts = []; for(let yy = start; yy <= end; yy += 4) pts.push([trackX(yy), yy]);
    const stroke = (w, col)=>{ g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([px, py], k)=> k ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); };
    stroke(17, 'rgba(70,52,30,.35)'); stroke(13, '#b8956a'); stroke(5, 'rgba(226,200,150,.6)');
    const R = rng(y * 41 + 2);
    for(let k = 0; k < 12; k++){ const py = start + R() * (end - start), px = trackX(py) + (R() - 0.5) * 10; ell(g, px, py, 1, 0.7, R() < 0.5 ? 'rgba(90,64,36,.5)' : 'rgba(255,244,215,.5)'); }
    g.strokeStyle = '#5f9a40'; g.lineWidth = 1.1; g.beginPath(); for(let k = 0; k < 10; k++){ const py = start + R() * (end - start), side = k % 2 ? 1 : -1, px = trackX(py) + side * 7.5; g.moveTo(px, py); g.lineTo(px + side * 1.5, py - 3.5); } g.stroke();
  });
  return rows;
}
/* what grows on one wild plot (in its free part): trees on a jittered three or four, low things between; a glade's
   few; out of the track's way */
function forestItems(i, F, ctx){
  const [x0, y0, x1, y1] = F, fw = x1 - x0, fh = y1 - y0, R = rng(i * 977 + 31), out = [];
  const gl = glade(i, ctx), onTrack = ctx.path.includes(i);
  const clearOf = (x, y)=>{ if(!onTrack) return x; const tx = trackX(y), d = x - tx; return Math.abs(d) < 22 ? tx + (d < 0 ? -22 - R() * 10 : 22 + R() * 10) : x; };
  const spots = gl ? [[0.1, 0.34], [0.9, 0.9]] : [[0.24, 0.42], [0.72, 0.36], [0.48, 0.84], [0.86, 0.80]];
  const n = gl ? 1 + (R() < 0.5 ? 1 : 0) : (fw * fh < 6500 ? 2 : 3) + (R() < 0.5 ? 1 : 0);
  for(let k = 0; k < n; k++){
    const [sx, sy] = spots[k], y = y0 + sy * fh + (R() - 0.5) * 0.14 * fh, x = clearOf(x0 + sx * fw + (R() - 0.5) * 0.18 * fw, y);
    const z = zone(x / 100, y / 100), pf = Math.max(0.08, Math.min(0.85, z * 0.95 - 0.08)), pb = 0.05 + 0.08 * (1 - z), r = R();
    const kind = r < pf ? 'fir' : r < pf + pb ? 'birch' : 'oak', s = kind === 'fir' ? 0.85 + R() * 0.3 : 0.8 + R() * 0.32;
    const v = hash(i * 13 + k, 4242);
    out.push({ y, f:g=> tree(g, kind, x, y, s, v), tree:kind });
  }
  for(let k = 0; k < 2; k++){
    const y = y0 + 0.52 * fh + R() * 0.44 * fh, x = clearOf(x0 + 0.1 * fw + R() * 0.8 * fw, y), r = R(), s = 0.8 + R() * 0.4, berry = R() < 0.3;
    if(gl && Math.abs(x - (x0 + x1) / 2) < 30 && Math.abs(y - (y0 + y1) / 2) < 22) continue;
    const kind = r < 0.4 ? (berry ? 'bushB' : 'bush') : r < 0.65 ? 'fern' : r < 0.85 ? 'rock' : 'mush', v = hash(i * 13 + 7 + k, 4243);
    out.push({ y, f:g=> tree(g, kind, x, y, s, v), tree:kind });
  }
  if(gl){
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 4, kind = gladeKind(i);
    if(kind === 'pond') out.push({ y:cy - 8, f:g=> reeds(g, cx - 10, cy - 7) });
    if(kind === 'log') out.push({ y:cy + 6, f:(g, R2)=> log(g, cx, cy + 6, R2), seed:i * 13 + 11 });
    if(kind === 'deer'){ const dx = cx - 4, flip = hash(i, 80) % 2; out.push({ y:cy + 8, f:g=>{ g.save(); if(flip){ g.translate(2 * dx, 0); g.scale(-1, 1); } deer(g, dx, cy + 8, 1.05); g.restore(); } }); }
    if(kind !== 'pond' || hash(i, 79) % 2) out.push({ y:cy + 16, f:g=> rabbit(g, cx + (kind === 'deer' ? 20 : -18), cy + 16) });
  }
  return out;
}

/* ---------- FIELDS (in the free part of their plot) ---------- */
function fieldGround(g, F, c, i){
  const R = rng(i * 59 + 3), x = F[0] + 5, y = F[1] + 6, w = F[2] - F[0] - 10, h = F[3] - F[1] - 12;
  rr(g, x, y, w, h, 6);
  g.fillStyle = c.irr ? lin(g, 0, y, 0, y + h, [[0, '#7a5230'], [1, '#5e3e24']]) : lin(g, 0, y, 0, y + h, [[0, '#9a6a3c'], [1, '#7f5530']]);
  g.fill();
  g.save(); rr(g, x, y, w, h, 6); g.clip();
  for(let yy = y + 10; yy < y + h - 4; yy += 12){ g.fillStyle = 'rgba(60,36,18,.35)'; g.fillRect(x, yy, w, 3); g.fillStyle = 'rgba(200,150,100,.16)'; g.fillRect(x, yy - 2, w, 1.4); }
  for(let k = 0; k < 20; k++) ell(g, x + 3 + R() * (w - 6), y + 4 + R() * (h - 8), 0.9, 0.7, 'rgba(50,32,18,.5)');
  g.restore();
  g.strokeStyle = 'rgba(70,110,45,.75)'; g.lineWidth = 2.4; rr(g, x, y, w, h, 6); g.stroke();
}
function fieldCrops(g, F, c, i){
  const R = rng(i * 71 + 5), L = c.lv || 1, kind = L === 1 ? 'sprout' : ['wheat', 'cabbage', 'pumpkin'][(i * 7 + 1) % 3];
  const x = F[0] + 5, y = F[1] + 6, w = F[2] - F[0] - 10, h = F[3] - F[1] - 12;
  const top = y + 12, bottom = y + h - (c.irr ? 18 : 6), rows = Math.max(2, Math.floor((bottom - top) / 11.5) + 1), cols = Math.max(3, Math.floor((w - 12) / 12.3) + 1);
  for(let r = 0; r < rows; r++){
    const cy = top + (bottom - top) * r / (rows - 1);
    for(let k = 0; k < cols; k++){
      const cx = x + 8 + (w - 18) * k / (cols - 1) + (r % 2) * 3 + (R() - 0.5) * 1.5;
      if(kind === 'sprout'){ g.strokeStyle = c.fer ? '#4fb03a' : '#6cbf4a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 2.4, cy - 4.5); g.moveTo(cx, cy); g.lineTo(cx + 2.4, cy - 4.5); g.moveTo(cx, cy); g.lineTo(cx, cy - 5.5); g.stroke(); }
      else if(kind === 'wheat'){
        const gold = L >= 3, col = gold ? (c.fer ? '#f0c64a' : '#e2b84a') : (c.fer ? '#5fb03e' : '#7bbf52');
        g.strokeStyle = gold ? '#b78a2e' : '#4f8a34'; g.lineWidth = 1.1;
        for(let s2 = -1; s2 <= 1; s2++){ g.beginPath(); g.moveTo(cx + s2 * 2, cy); g.lineTo(cx + s2 * 2.6, cy - 11); g.stroke(); ell(g, cx + s2 * 2.6, cy - 12.5, 1.3, 3, col, s2 * 0.2); }
      }
      else if(kind === 'cabbage'){ const r2 = L >= 3 ? 4.4 : 3.4; shade(g, cx + 1, cy + 0.6, r2, r2 * 0.4, 0.25); ell(g, cx, cy - r2 * 0.7, r2, r2 * 0.85, c.fer ? '#3f9a42' : '#5aa84a'); ell(g, cx - r2 * 0.25, cy - r2 * 0.95, r2 * 0.6, r2 * 0.5, c.fer ? '#7cd06a' : '#9ad27a'); g.strokeStyle = 'rgba(40,90,40,.6)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(cx, cy - r2 * 0.2); g.lineTo(cx, cy - r2 * 1.3); g.stroke(); }
      else {
        g.strokeStyle = '#4f8a34'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - 5, cy - 1); g.quadraticCurveTo(cx, cy - 6, cx + 5, cy - 1); g.stroke();
        ell(g, cx - 3, cy - 4, 2.6, 1.5, '#5aa84a', 0.4);
        if((r + k) % 2 === 0){ const pr = L >= 3 ? 4 : 2.8; shade(g, cx + 2, cy + 0.5, pr, pr * 0.4, 0.25); ell(g, cx + 1.5, cy - pr * 0.7, pr * 1.15, pr * 0.85, '#e07a26'); ell(g, cx + 0.6, cy - pr * 0.95, pr * 0.35, pr * 0.6, '#f29a46'); g.fillStyle = '#4f6a2a'; g.fillRect(cx + 1, cy - pr * 1.6, 1.2, 2); }
      }
    }
  }
  if(c.fer) for(let k = 0; k < 7; k++) ell(g, x + 6 + R() * (w - 12), y + 8 + R() * (h - 20), 1.7, 1.7, k % 2 ? '#f08bb4' : '#fff0a0');
  if(c.irr){
    /* a stone-lined channel along its foot, water in it, a little sluice */
    const cy = y + h - 13;
    rr(g, x + 2, cy, w - 4, 11, 3); g.fillStyle = '#8f8a80'; g.fill();
    rr(g, x + 4, cy + 2, w - 8, 7, 2.5); g.fillStyle = lin(g, 0, cy + 2, 0, cy + 9, [[0, '#3f8fd0'], [1, '#2a6fa8']]); g.fill();
    g.strokeStyle = 'rgba(225,245,255,.8)'; g.lineWidth = 1; g.beginPath(); for(let sx = x + 9; sx < x + w - 12; sx += 16){ g.moveTo(sx, cy + 5); g.quadraticCurveTo(sx + 3, cy + 4, sx + 6, cy + 5.5); } g.stroke();
    const sl = x + w * 0.62; g.fillStyle = '#7a5530'; g.fillRect(sl, cy - 1, 3, 13); g.fillRect(sl + 6, cy - 1, 3, 13); g.fillStyle = '#9a7048'; g.fillRect(sl - 1, cy - 2, 11, 3);
  }
}

/* ---------- BUILDING PIECES ---------- */
function windowLit(g, x, y, w, h, arch){
  g.fillStyle = '#5b4632'; if(arch){ g.beginPath(); g.moveTo(x - 1, y + h + 1); g.lineTo(x - 1, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2 + 1, Math.PI, 0); g.lineTo(x + w + 1, y + h + 1); g.fill(); } else g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = lin(g, x, y, x + w, y + h, [[0, '#ffe9a8'], [1, '#f0b452']]);
  if(arch){ g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.fill(); } else g.fillRect(x, y, w, h);
  g.strokeStyle = '#5b4632'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x + w / 2, y + (arch ? 1 : 0)); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.5); g.lineTo(x + w, y + h * 0.5); g.stroke();
}
function door(g, x, y, w, h, col){
  g.fillStyle = '#3c2a1c'; g.beginPath(); g.moveTo(x - 1.2, y + h); g.lineTo(x - 1.2, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2 + 1.2, Math.PI, 0); g.lineTo(x + w + 1.2, y + h); g.fill();
  g.fillStyle = col || '#7a4a2a'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.fill();
  g.strokeStyle = 'rgba(30,18,10,.45)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x + w * 0.35, y + 2); g.lineTo(x + w * 0.35, y + h); g.moveTo(x + w * 0.68, y + 2); g.lineTo(x + w * 0.68, y + h); g.stroke();
  ell(g, x + w * 0.78, y + h * 0.6, 0.8, 0.8, '#e0b84a');
}
/* a gable roof seen from the south and above: its slope a trapezoid of courses, its ridge lit */
function gable(g, x, y, w, h, col, dark, light, kind){
  g.fillStyle = col; g.beginPath(); g.moveTo(x - 4, y + h); g.lineTo(x + w * 0.12, y); g.lineTo(x + w * 0.88, y); g.lineTo(x + w + 4, y + h); g.closePath(); g.fill();
  g.save(); g.clip();
  if(kind === 'thatch'){ g.strokeStyle = dark; g.lineWidth = 0.8; for(let k = 0; k < 40; k++){ const px = x - 4 + (w + 8) * k / 40; g.beginPath(); g.moveTo(px, y); g.lineTo(px + (k % 3 - 1), y + h); g.stroke(); } }
  else { g.strokeStyle = dark; g.lineWidth = 0.9; for(let r = 1; r < 6; r++){ const yy = y + h * r / 6; g.beginPath(); g.moveTo(x - 4, yy); g.lineTo(x + w + 4, yy); g.stroke(); for(let k = 0; k < 12; k++){ const px = x - 4 + (w + 8) * (k + (r % 2) * 0.5) / 12; g.beginPath(); g.moveTo(px, yy - h / 6); g.lineTo(px, yy); g.stroke(); } } }
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x - 4, y, w * 0.4, h);
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x + w * 0.7, y, w * 0.4, h);
  g.restore();
  g.fillStyle = light; g.fillRect(x + w * 0.12, y - 1.5, w * 0.76, 3);
  g.strokeStyle = 'rgba(30,20,12,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 4, y + h); g.lineTo(x + w * 0.12, y); g.lineTo(x + w * 0.88, y); g.lineTo(x + w + 4, y + h); g.stroke();
}
function wall(g, x, y, w, h, top, bottom, beams){
  g.fillStyle = lin(g, x, 0, x + w, 0, [[0, top], [1, bottom]]); g.fillRect(x, y, w, h);
  if(beams){ g.strokeStyle = '#3e2b1c'; g.lineWidth = 2.2; g.strokeRect(x + 1, y + 1, w - 2, h - 2); g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.45); g.lineTo(x + w, y + h * 0.45); g.moveTo(x + 1, y + 1); g.lineTo(x + w / 2, y + h * 0.45); g.moveTo(x + w - 1, y + 1); g.lineTo(x + w / 2, y + h * 0.45); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + w - 3, y, 3, h);
}
function chimney(g, x, y, h, smoke){
  g.fillStyle = lin(g, x, 0, x + 6, 0, [[0, '#b46a4e'], [1, '#7a3f2c']]); g.fillRect(x, y - h, 6, h);
  g.fillStyle = '#5a3022'; g.fillRect(x - 1, y - h - 2, 8, 2.5);
  if(smoke) for(let k = 0; k < 4; k++) ell(g, x + 3 + k * 2.5, y - h - 6 - k * 6, 3 + k * 1.3, 2.4 + k, `rgba(235,235,235,${0.5 - k * 0.1})`);
}
function flag(g, x, y, col, h){
  g.fillStyle = '#5b3a2a'; g.fillRect(x - 0.7, y - h, 1.4, h);
  g.fillStyle = col; g.beginPath(); g.moveTo(x + 0.7, y - h); g.quadraticCurveTo(x + 8, y - h - 1.5, x + 13, y - h + 2); g.quadraticCurveTo(x + 8, y - h + 4.5, x + 0.7, y - h + 6); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 0.7, y - h + 0.6, 6, 1.2);
}
function roundTower(g, x, y, r, h, roof, opts){
  opts = opts || {};
  shade(g, x + r * 0.4, y + 1, r * 1.3, r * 0.45, 0.3);
  g.fillStyle = opts.white ? lin(g, x - r, 0, x + r, 0, [[0, '#fbf9f4'], [0.45, '#e6e0d4'], [1, '#aaa294']]) : lin(g, x - r, 0, x + r, 0, [[0, '#ece6d8'], [0.45, '#cfc6b3'], [1, '#8f8676']]);
  g.beginPath(); g.moveTo(x - r, y - h); g.lineTo(x - r, y); g.ellipse(x, y, r, r * 0.35, 0, Math.PI, 0, true); g.lineTo(x + r, y - h); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(90,80,64,.35)'; g.lineWidth = 0.8;
  for(let k = 1; k < h / 6; k++){ g.beginPath(); g.ellipse(x, y - k * 6, r, r * 0.35, 0, 0.15, Math.PI - 0.15); g.stroke(); }
  if(opts.slits) for(let k = 0; k < opts.slits; k++){ g.fillStyle = '#2d241c'; g.fillRect(x - 1 + (k % 2 ? r * 0.3 : -r * 0.25), y - h * (0.35 + 0.3 * k), 2, 6); }
  if(opts.band){ g.strokeStyle = opts.band; g.lineWidth = 2.4; g.beginPath(); g.ellipse(x, y - h + 5, r, r * 0.35, 0, 0.05, Math.PI - 0.05); g.stroke(); }
  if(roof === 'dome'){ ell(g, x, y - h, r, r * 0.35, '#d9d2c2'); const top = dome(g, x, y - h + 1, r + 1.5, opts.domeC || GOLD, opts.tip); if(opts.flag) flag(g, x, top + 2, opts.flag, 10); return; }
  if(roof === 'cone'){
    const top = y - h - r * 1.7;
    g.fillStyle = lin(g, x - r, 0, x + r, 0, [[0, opts.roofL || '#6f8fd0'], [0.5, opts.roof || '#4a6aa8'], [1, opts.roofD || '#2f4778']]);
    g.beginPath(); g.moveTo(x - r - 2.5, y - h + 1); g.lineTo(x, top); g.lineTo(x + r + 2.5, y - h + 1); g.ellipse(x, y - h + 1, r + 2.5, (r + 2.5) * 0.35, 0, 0, Math.PI); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(20,30,60,.35)'; g.lineWidth = 0.7; for(let k = 1; k < 4; k++){ g.beginPath(); g.moveTo(x - (r + 2.5) * (1 - k / 4), y - h + 1 - (y - h + 1 - top) * k / 4); g.lineTo(x + (r + 2.5) * (1 - k / 4), y - h + 1 - (y - h + 1 - top) * k / 4); g.stroke(); }
    ell(g, x, top, 1.6, 1.6, opts.tip || '#e0b84a');
    if(opts.flag) flag(g, x, top, opts.flag, 10);
  } else {
    ell(g, x, y - h, r, r * 0.35, '#d9d2c2');
    ell(g, x, y - h, r * 0.72, r * 0.25, '#9a9282');
    for(let k = 0; k < 6; k++){ const a = Math.PI * (0.05 + k / 5.6), mx = x - Math.cos(a) * r * 0.92, my = y - h + Math.sin(a) * r * 0.3; g.fillStyle = lin(g, mx - 2, 0, mx + 2, 0, [[0, '#ece6d8'], [1, '#a69d8c']]); g.fillRect(mx - 2.4, my - 5, 4.8, 5.5); }
    if(opts.flag) flag(g, x, y - h - 2, opts.flag, 14);
  }
}
/* ---------- (4.74) MORE PIECES: for the grander buildings, their yards, the gardens ---------- */
const GOLD = ['#ffe08a', '#e8bf4a', '#a5741c'], BLUE = ['#7193d6', '#4a6aa8', '#2f4778'], RED = ['#e07a64', '#b4483c', '#7a2a20'];
/* a roof rising to a point, in courses */
function pyramid(g, cx, yb, w, h, c){
  g.fillStyle = lin(g, cx - w / 2, 0, cx + w / 2, 0, [[0, c[0]], [0.5, c[1]], [1, c[2]]]);
  g.beginPath(); g.moveTo(cx - w / 2 - 3, yb); g.lineTo(cx, yb - h); g.lineTo(cx + w / 2 + 3, yb); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(20,30,60,.3)'; g.lineWidth = 0.7;
  for(let k = 1; k < 5; k++){ const t = k / 5, yy = yb - h * t, hw = (w / 2 + 3) * (1 - t); g.beginPath(); g.moveTo(cx - hw, yy); g.lineTo(cx + hw, yy); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.13)'; g.beginPath(); g.moveTo(cx - w / 2 - 3, yb); g.lineTo(cx, yb - h); g.lineTo(cx - w * 0.1, yb); g.closePath(); g.fill();
}
/* a dome, ribbed, its finial */
function dome(g, cx, yb, r, c, tip){
  g.fillStyle = lin(g, cx - r, 0, cx + r, 0, [[0, c[0]], [0.5, c[1]], [1, c[2]]]);
  g.beginPath(); g.moveTo(cx - r, yb); g.bezierCurveTo(cx - r, yb - r * 1.3, cx + r, yb - r * 1.3, cx + r, yb); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 0.7;
  for(let k = -2; k <= 2; k++){ g.beginPath(); g.moveTo(cx + k * r * 0.38, yb); g.quadraticCurveTo(cx + k * r * 0.24, yb - r * 0.8, cx, yb - r * 0.97); g.stroke(); }
  ell(g, cx - r * 0.38, yb - r * 0.62, r * 0.2, r * 0.13, 'rgba(255,255,255,.4)', -0.5);
  const t = tip || GOLD[1]; g.fillStyle = t; g.fillRect(cx - 0.8, yb - r * 0.97 - 9, 1.6, 9); ell(g, cx, yb - r * 0.97 - 9.5, 2.2, 2.2, t);
  return yb - r * 0.97 - 11;
}
/* battlements along a flat roof's edge */
function parapet(g, x, y, w, col){
  g.fillStyle = col; g.fillRect(x - 1, y - 3, w + 2, 3);
  for(let px = x; px < x + w - 4; px += 10){ g.fillStyle = col; g.fillRect(px, y - 8, 6, 5); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(px + 4.5, y - 8, 1.5, 5); }
}
/* steps, the widest at the bottom */
function stair(g, cx, yb, w, n){
  for(let k = 0; k < n; k++){ const ww = w - k * 4, yy = yb - (k + 1) * 3.2; g.fillStyle = k % 2 ? '#e8dfca' : '#d6cbb2'; g.fillRect(cx - ww / 2, yy, ww, 3.4); g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(cx - ww / 2, yy + 2.6, ww, 0.8); }
}
/* a banner hanging on a wall */
function banner(g, x, y, w, h, col, trim){
  g.fillStyle = col; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x + w / 2, y + h - w * 0.45); g.lineTo(x, y + h); g.closePath(); g.fill();
  g.fillStyle = trim || GOLD[1]; g.fillRect(x - 0.6, y - 1, w + 1.2, 1.8); ell(g, x + w / 2, y + h * 0.38, w * 0.2, w * 0.2, trim || GOLD[0]);
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x + w - 1.2, y, 1.2, h - 1);
}
/* the kingdom's crown, in gold */
function crown(g, cx, y, s){
  g.fillStyle = lin(g, cx - 7 * s, 0, cx + 7 * s, 0, [[0, GOLD[0]], [1, GOLD[2]]]);
  g.beginPath(); g.moveTo(cx - 7 * s, y); g.lineTo(cx - 7 * s, y - 6 * s); g.lineTo(cx - 3.5 * s, y - 3 * s); g.lineTo(cx, y - 8 * s); g.lineTo(cx + 3.5 * s, y - 3 * s); g.lineTo(cx + 7 * s, y - 6 * s); g.lineTo(cx + 7 * s, y); g.closePath(); g.fill();
  ell(g, cx, y - 2 * s, 1.3 * s, 1.3 * s, '#c8463c'); ell(g, cx - 4.5 * s, y - 2 * s, 0.9 * s, 0.9 * s, '#3c6fc4'); ell(g, cx + 4.5 * s, y - 2 * s, 0.9 * s, 0.9 * s, '#3c6fc4');
}
/* a hall's face: dressed stone in courses, its windows in a row or two, its door in the middle */
function hall(g, x, yb, w, h, o){
  o = o || {};
  wall(g, x, yb - h, w, h, o.top || '#f1e9d6', o.bottom || '#cdbf9f');
  g.strokeStyle = o.course || 'rgba(120,104,80,.24)'; g.lineWidth = 0.7;
  for(let yy = yb - 6; yy > yb - h + 2; yy -= 6){ g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
  const n = o.win == null ? Math.max(2, Math.floor(w / 22)) : o.win, rows = o.rows || 1, ww = o.ww || 7, wh = o.wh || 11;
  for(let r = 0; r < rows; r++) for(let k = 0; k < n; k++){
    const wx = x + (w / n) * (k + 0.5) - ww / 2, wy = yb - h + 8 + r * (wh + 9);
    if(o.door && r === rows - 1 && Math.abs(wx + ww / 2 - (x + w / 2)) < o.door[0] / 2 + ww) continue;
    windowLit(g, wx, wy, ww, wh, true);
  }
  if(o.door){ const [dw, dh, col] = o.door; door(g, x + w / 2 - dw / 2, yb - dh, dw, dh, col); if(o.gold){ g.strokeStyle = o.gold; g.lineWidth = 1.8; g.beginPath(); g.arc(x + w / 2, yb - dh + dw / 2, dw / 2 + 2.2, Math.PI, 0); g.stroke(); } }
  if(o.trim){ g.fillStyle = o.trim; g.fillRect(x, yb - h, w, 2.2); }
}
function fountain(g, fx, fy, s){
  s = s || 1;
  shade(g, fx + 1, fy + 1, 10 * s, 3 * s, 0.25); ell(g, fx, fy, 9 * s, 3.4 * s, '#b3ab9b'); ell(g, fx, fy - 0.6 * s, 7.2 * s, 2.4 * s, '#4f9fdc');
  g.fillStyle = '#c2bcae'; g.fillRect(fx - 1.2 * s, fy - 9 * s, 2.4 * s, 8.5 * s); ell(g, fx, fy - 9 * s, 3 * s, 1.2 * s, '#c2bcae');
  g.strokeStyle = 'rgba(220,240,255,.9)'; g.lineWidth = Math.max(1, s * 0.8); g.beginPath(); g.moveTo(fx, fy - 10 * s); g.quadraticCurveTo(fx - 4 * s, fy - 14 * s, fx - 6 * s, fy - 2 * s); g.moveTo(fx, fy - 10 * s); g.quadraticCurveTo(fx + 4 * s, fy - 14 * s, fx + 6 * s, fy - 2 * s); g.stroke();
}
/* a market stall: its posts, its counter of goods, its striped awning */
function stall(g, x, y, cA, cB, goods){
  shade(g, x + 15, y + 1, 17, 3, 0.25);
  g.fillStyle = '#6b4426'; g.fillRect(x, y - 22, 2, 22); g.fillRect(x + 26, y - 22, 2, 22);
  g.fillStyle = lin(g, 0, y - 10, 0, y, [[0, '#b9874f'], [1, '#8a5a2b']]); g.fillRect(x - 1, y - 10, 30, 10);
  for(let k = 0; k < 6; k++){ const gx = x + 3 + k * 4.3;
    if(goods === 'fruit'){ ell(g, gx, y - 11.5, 2.1, 2.1, ['#d32f2c', '#f2a33a', '#e8d04a', '#7fbf4a'][k % 4]); ell(g, gx + 1.5, y - 13.4, 2, 2, ['#e8d04a', '#d32f2c', '#7fbf4a', '#f2a33a'][k % 4]); }
    else if(goods === 'bread'){ ell(g, gx, y - 11.6, 2.4, 1.6, '#c98b48'); ell(g, gx - 0.6, y - 12.2, 1.2, 0.6, '#e8b878'); }
    else if(goods === 'potion'){ const c = ['#e8414f', '#3f9fe0', '#5fc04a', '#c37be8'][k % 4]; g.fillStyle = '#e8e2d2'; g.fillRect(gx - 0.6, y - 16.4, 1.2, 2); ell(g, gx, y - 12.4, 1.8, 2.2, c); ell(g, gx - 0.6, y - 13.2, 0.5, 0.7, 'rgba(255,255,255,.7)'); }
    else { g.fillStyle = ['#b9653a', '#3f7d9a', '#e0c070'][k % 3]; g.beginPath(); g.ellipse(gx, y - 12, 1.8, 2.6, 0, 0, TAU); g.fill(); } }
  for(let k = 0; k < 6; k++){ g.fillStyle = k % 2 ? cB : cA; g.beginPath(); g.moveTo(x - 3 + k * 5.6, y - 30); g.lineTo(x - 3 + (k + 1) * 5.6, y - 30); g.lineTo(x - 3 + (k + 1) * 5.6, y - 23); g.arc(x - 3 + (k + 0.5) * 5.6, y - 23, 2.8, 0, Math.PI); g.closePath(); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - 3, y - 25, 34, 2);
}
function barrel(g, bx, by){ shade(g, bx + 1, by, 5, 2, 0.3); g.fillStyle = lin(g, bx - 4.5, 0, bx + 4.5, 0, [[0, '#b07a45'], [1, '#6b4422']]); g.fillRect(bx - 4.5, by - 10, 9, 10); ell(g, bx, by - 10, 4.5, 1.8, '#8a5a2b'); g.fillStyle = '#4a3a2a'; g.fillRect(bx - 4.5, by - 7.5, 9, 1); g.fillRect(bx - 4.5, by - 3, 9, 1); }
function crate(g, x, y){ shade(g, x + 5, y + 0.5, 6, 1.8, 0.28); g.fillStyle = lin(g, x, y - 9, x + 10, y, [[0, '#c89058'], [1, '#8a5a2b']]); g.fillRect(x, y - 9, 10, 9); g.strokeStyle = 'rgba(70,40,16,.55)'; g.lineWidth = 0.8; g.strokeRect(x + 0.4, y - 8.6, 9.2, 8.2); g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 10, y); g.stroke(); }
/* the bunting over the market: a sagging string of pennants */
function bunting(g, x0, x1, y, sag){
  g.strokeStyle = 'rgba(70,50,35,.7)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); g.stroke();
  const n = Math.max(6, Math.round((x1 - x0) / 10));
  for(let k = 1; k < n; k++){ const u = k / n, px = x0 + (x1 - x0) * u, py = y + sag * 4 * u * (1 - u); g.fillStyle = ['#e8414f', '#f2c23a', '#3c6fc4', '#3f9d5a'][k % 4]; g.beginPath(); g.moveTo(px - 2.2, py); g.lineTo(px + 2.2, py); g.lineTo(px, py + 4.5); g.closePath(); g.fill(); }
}
/* the barracks' things: a straw man, a target, a rack of spears */
function dummy(g, x, y){
  shade(g, x + 1, y + 0.5, 6, 2, 0.28);
  g.fillStyle = '#6b4426'; g.fillRect(x - 1, y - 22, 2, 22); g.fillRect(x - 8, y - 17, 16, 1.8);
  g.fillStyle = lin(g, x - 5, 0, x + 5, 0, [[0, '#ecd27a'], [1, '#b8923e']]); rr(g, x - 5, y - 19, 10, 12, 4); g.fill();
  g.strokeStyle = 'rgba(120,90,30,.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - 5, y - 13); g.lineTo(x + 5, y - 13); g.stroke();
  ell(g, x, y - 22, 3.6, 3.4, '#d8c08a');
  g.strokeStyle = '#c8463c'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 4, y - 17); g.lineTo(x + 4, y - 11); g.stroke();
}
function target(g, x, y){
  shade(g, x + 2, y + 0.5, 7, 2, 0.26);
  g.strokeStyle = '#6b4426'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x, y - 14); g.lineTo(x + 5, y); g.stroke();
  ['#f3e6c8', '#c8463c', '#f3e6c8', '#3c6fc4', '#e8bf4a'].forEach((c, k)=> ell(g, x, y - 15, 8 - k * 1.6, 8 - k * 1.6, c));
  g.strokeStyle = '#5a3a22'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + 1.5, y - 16); g.lineTo(x + 8, y - 20); g.stroke();
  g.fillStyle = '#f6eee0'; g.fillRect(x + 7, y - 21.4, 2.6, 1.6);
}
function rack(g, x, y){
  shade(g, x + 7, y + 0.5, 9, 1.8, 0.26);
  g.fillStyle = '#7a4f28'; g.fillRect(x, y - 10, 2, 10); g.fillRect(x + 14, y - 10, 2, 10); g.fillRect(x - 1, y - 9, 18, 1.6); g.fillRect(x - 1, y - 3, 18, 1.4);
  for(let k = 0; k < 4; k++){ const sx = x + 2.5 + k * 3.4; g.strokeStyle = '#8a5a32'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(sx, y); g.lineTo(sx, y - 17); g.stroke(); g.fillStyle = '#d8dce4'; g.beginPath(); g.moveTo(sx, y - 20); g.lineTo(sx - 1.1, y - 16.6); g.lineTo(sx + 1.1, y - 16.6); g.fill(); }
}
/* the granary's things: hay, sacks */
function hay(g, x, y, s){
  s = s || 1; shade(g, x + 2, y + 0.5, 9 * s, 2.4 * s, 0.28);
  g.fillStyle = lin(g, x - 9 * s, y - 14 * s, x + 9 * s, y, [[0, '#f2d888'], [1, '#c09a44']]);
  g.beginPath(); g.moveTo(x - 9 * s, y); g.quadraticCurveTo(x - 9 * s, y - 15 * s, x, y - 15 * s); g.quadraticCurveTo(x + 9 * s, y - 15 * s, x + 9 * s, y); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(150,110,40,.6)'; g.lineWidth = 0.6; g.beginPath(); for(let k = -3; k <= 3; k++){ g.moveTo(x + k * 2.4 * s, y - 1); g.lineTo(x + k * 1.6 * s, y - 13 * s); } g.stroke();
}
function sacks(g, x, y){
  [[0, 0], [7, 1], [3.5, -5]].forEach(([dx, dy])=>{ const sx = x + dx, sy = y + dy; shade(g, sx + 1, sy + 0.4, 4, 1.4, 0.25); g.fillStyle = lin(g, sx - 3.5, 0, sx + 3.5, 0, [[0, '#efe2c0'], [1, '#c4b088']]); rr(g, sx - 3.5, sy - 7, 7, 7, 2.5); g.fill(); g.fillStyle = '#a08a60'; g.fillRect(sx - 1.5, sy - 8.4, 3, 1.6); });
}
/* the windmill's sails, turning on (mx, my) */
function sails(g, mx, my, L){
  g.strokeStyle = '#6b4426'; g.lineWidth = 1.4;
  for(let k = 0; k < 4; k++){ const a = k * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(a) * L, my + Math.sin(a) * L); g.stroke();
    g.fillStyle = 'rgba(246,238,224,.92)'; g.beginPath(); g.moveTo(mx + Math.cos(a) * L * 0.3, my + Math.sin(a) * L * 0.3); g.lineTo(mx + Math.cos(a) * L, my + Math.sin(a) * L); g.lineTo(mx + Math.cos(a + 0.28) * L * 0.95, my + Math.sin(a + 0.28) * L * 0.95); g.lineTo(mx + Math.cos(a + 0.5) * L * 0.3, my + Math.sin(a + 0.5) * L * 0.3); g.closePath(); g.fill(); }
  ell(g, mx, my, 2.4, 2.4, '#5a3a1a');
}
/* a windmill of its own: a white tower, its cap, its sails */
function windmill(g, x, y, s){
  shade(g, x + 4, y + 1, 12 * s, 3.4 * s, 0.3);
  g.fillStyle = lin(g, x - 10 * s, 0, x + 10 * s, 0, [[0, '#f4efe4'], [0.5, '#d9d2c2'], [1, '#a69d8c']]);
  g.beginPath(); g.moveTo(x - 10 * s, y); g.lineTo(x - 6.5 * s, y - 40 * s); g.lineTo(x + 6.5 * s, y - 40 * s); g.lineTo(x + 10 * s, y); g.closePath(); g.fill();
  door(g, x - 3 * s, y - 9 * s, 6 * s, 9 * s, '#6b4426');
  windowLit(g, x - 2 * s, y - 27 * s, 4 * s, 6 * s, true);
  g.fillStyle = '#7a3a26'; g.beginPath(); g.moveTo(x - 8.5 * s, y - 39 * s); g.quadraticCurveTo(x, y - 54 * s, x + 8.5 * s, y - 39 * s); g.closePath(); g.fill();
  sails(g, x, y - 43 * s, 27 * s);
}
/* the builders' things: a treadwheel crane (its jib `ht` high) with a block on its rope; logs; dressed stone; a cart */
function crane(g, cx, cy, ht){
  g.strokeStyle = '#7a4f28'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx - 10, cy); g.lineTo(cx, cy - ht); g.lineTo(cx + 10, cy); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy - ht); g.lineTo(cx + 26, cy - ht + 6); g.stroke();
  g.strokeStyle = '#3a342c'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx + 25, cy - ht + 6); g.lineTo(cx + 25, cy - 18); g.stroke();
  g.fillStyle = '#b3ab9b'; g.fillRect(cx + 21, cy - 18, 8, 6);
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy - 14, 11, 0, TAU); g.stroke(); g.lineWidth = 1;
  for(let k = 0; k < 4; k++){ const a = k * Math.PI / 4; g.beginPath(); g.moveTo(cx - Math.cos(a) * 11, cy - 14 - Math.sin(a) * 11); g.lineTo(cx + Math.cos(a) * 11, cy - 14 + Math.sin(a) * 11); g.stroke(); }
}
function logs(g, x, y){ for(let k = 0; k < 3; k++){ const ly = y - k * 4.5, lx = x + k * 2; g.fillStyle = lin(g, 0, ly - 4, 0, ly, [[0, '#b07a45'], [1, '#7a4f28']]); rr(g, lx, ly - 4, 30 - k * 4, 4.2, 2); g.fill(); ell(g, lx + 30 - k * 4, ly - 1.9, 1.8, 2.1, '#e2b98a'); } }
function blocks(g, pts){ pts.forEach(([bx, by])=>{ g.fillStyle = lin(g, bx, by - 7, bx + 10, by, [[0, '#d9d2c2'], [1, '#948b7a']]); g.fillRect(bx, by - 7, 10, 7); g.strokeStyle = 'rgba(60,50,40,.35)'; g.lineWidth = 0.6; g.strokeRect(bx, by - 7, 10, 7); }); }
function cart(g, x, y, load){
  shade(g, x + 8, y + 1, 12, 2.2, 0.28); g.fillStyle = '#8a5a2b'; g.fillRect(x, y - 9, 18, 6);
  if(load === 'hay'){ g.fillStyle = lin(g, 0, y - 18, 0, y - 9, [[0, '#f2d888'], [1, '#c09a44']]); rr(g, x + 1, y - 17, 16, 9, 4); g.fill(); }
  else { g.fillStyle = '#b3ab9b'; [[2, 13], [7, 14], [12, 13], [5, 17]].forEach(([dx, dy])=> g.fillRect(x + dx, y - dy, 5, 4)); }
  g.strokeStyle = '#4a3322'; g.lineWidth = 1.3; g.beginPath(); g.arc(x + 4, y - 2, 2.6, 0, TAU); g.moveTo(x + 16.6, y - 2); g.arc(x + 14, y - 2, 2.6, 0, TAU); g.moveTo(x + 18, y - 6); g.lineTo(x + 24, y - 3); g.stroke();
}
/* the palace's gardens: clipped yew, beds of flowers */
function topiary(g, x, y, s){
  shade(g, x + 1.5, y + 0.5, 5 * s, 1.6 * s, 0.28);
  g.fillStyle = '#b9653a'; g.fillRect(x - 3 * s, y - 4 * s, 6 * s, 4 * s); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 1.6 * s, y - 4 * s, 1.4 * s, 4 * s);
  ell(g, x, y - 9 * s, 4.4 * s, 4.6 * s, '#2f6a2c'); ell(g, x - 1.2 * s, y - 10.2 * s, 2.6 * s, 2.6 * s, '#4f9440');
  ell(g, x, y - 16 * s, 3 * s, 3.2 * s, '#2f6a2c'); ell(g, x - 0.8 * s, y - 16.8 * s, 1.8 * s, 1.8 * s, '#5aa24a');
}
/* a bed of flowers, hedged (seen from above) */
function parterre(g, x, y, w, h, R, cols){
  g.fillStyle = '#2f6a2c'; rr(g, x, y, w, h, 5); g.fill();
  g.fillStyle = '#4f9440'; rr(g, x, y, w, h - 2, 5); g.fill();
  g.fillStyle = '#8fc866'; rr(g, x + 3.5, y + 3.5, w - 7, h - 9, 3); g.fill();
  const cx = x + w / 2, cy = y + (h - 2) / 2, rx = (w - 10) * 0.34, ry = (h - 12) * 0.34;
  ell(g, cx, cy, rx + 1.6, ry + 1.6, '#4f7d33');
  for(let k = 0; k < Math.round(w * h / 18); k++){ const a = R() * TAU, d = Math.sqrt(R()); ell(g, cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, 1.45, 1.45, cols[k % cols.length]); }
}
/* the little soldiers on the walls (the army) */
function soldier(g, x, y, s, gold){
  shade(g, x + 1, y + 0.5, 3 * s, 1 * s, 0.3);
  g.fillStyle = '#4a3a2a'; g.fillRect(x - 1.6 * s, y - 3 * s, 1.2 * s, 3 * s); g.fillRect(x + 0.4 * s, y - 3 * s, 1.2 * s, 3 * s);
  g.fillStyle = '#3c6fc4'; rr(g, x - 2.4 * s, y - 7.6 * s, 4.8 * s, 4.9 * s, 1 * s); g.fill();
  ell(g, x, y - 9.2 * s, 1.9 * s, 1.9 * s, '#f2d0a8');
  g.fillStyle = gold ? GOLD[1] : '#b8bcc4'; g.beginPath(); g.arc(x, y - 9.6 * s, 2.15 * s, Math.PI, 0); g.fill();
  g.strokeStyle = '#6b4426'; g.lineWidth = 0.7 * s; g.beginPath(); g.moveTo(x + 3 * s, y - 1 * s); g.lineTo(x + 3 * s, y - 14 * s); g.stroke();
  g.fillStyle = '#e4e8ee'; g.beginPath(); g.moveTo(x + 3 * s, y - 16.5 * s); g.lineTo(x + 2.1 * s, y - 13.8 * s); g.lineTo(x + 3.9 * s, y - 13.8 * s); g.fill();
  ell(g, x - 2.6 * s, y - 5.6 * s, 1.6 * s, 2.2 * s, '#c8463c'); ell(g, x - 2.6 * s, y - 5.6 * s, 0.6 * s, 0.6 * s, GOLD[1]);
}
/* a ruin: walls broken off, the roof fallen in (in its old colour), ivy, stones and weeds; the market's, broken stalls */
function ruin(g, x0, y0, kind, R){
  const base = y0 + 86;
  shade(g, x0 + 54, base, 36, 7, 0.22);
  const rubble = (n)=>{ for(let k = 0; k < n; k++){ const sx = x0 + 14 + R() * 72, sy = base - 1 + R() * 9, w = 4 + R() * 5; shade(g, sx + w / 2, sy + 0.5, w * 0.6, 1.4, 0.25); g.fillStyle = ['#c6bfb0', '#a59d8c', '#b8b0a0'][k % 3]; rr(g, sx, sy - 3.5, w, 3.5 + R() * 1.6, 1.2); g.fill(); } };
  const weeds = (n)=>{ g.strokeStyle = '#5f9a40'; g.lineWidth = 1.3; g.beginPath(); for(let k = 0; k < n; k++){ const wx = x0 + 16 + R() * 68, wy = base + R() * 8; g.moveTo(wx, wy); g.lineTo(wx - 2, wy - 6); g.moveTo(wx, wy); g.lineTo(wx + 2.5, wy - 5); g.moveTo(wx, wy); g.lineTo(wx + 0.3, wy - 7); } g.stroke(); };
  if(kind === 'market'){
    const post = (x, y, h, a)=>{ g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = lin(g, -1.4, 0, 1.4, 0, [[0, '#8a5a32'], [1, '#5a3a1e']]); g.fillRect(-1.4, -h, 2.8, h); g.restore(); };
    post(x0 + 16, base - 8, 30, -0.04); post(x0 + 44, base - 8, 20, 0.38); post(x0 + 58, base - 12, 28, 0.03); post(x0 + 86, base - 12, 16, -0.45);
    g.save(); g.translate(x0 + 14, base - 22); g.rotate(0.2); g.fillStyle = '#8a5a2b'; g.fillRect(0, 0, 30, 5); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 4, 30, 1); g.restore();
    g.fillStyle = '#9a6a3a'; g.fillRect(x0 + 56, base - 26, 30, 5);
    /* a torn awning hanging from a post, a tatter on the other */
    const torn = (pts, cA, cB)=>{ g.save(); g.beginPath(); pts.forEach(([px, py], k)=> k ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.clip(); for(let k = -2; k < 12; k++){ g.fillStyle = k % 2 ? cB : cA; g.beginPath(); g.moveTo(x0 + k * 7, y0); g.lineTo(x0 + k * 7 + 7, y0); g.lineTo(x0 + k * 7 - 9, y0 + 100); g.lineTo(x0 + k * 7 - 16, y0 + 100); g.fill(); } g.restore(); };
    torn([[x0 + 15, base - 38], [x0 + 42, base - 33], [x0 + 34, base - 26], [x0 + 30, base - 30], [x0 + 24, base - 20], [x0 + 19, base - 27]], 'rgba(200,70,60,.8)', 'rgba(246,238,224,.8)');
    torn([[x0 + 58, base - 40], [x0 + 74, base - 39], [x0 + 68, base - 32], [x0 + 64, base - 36], [x0 + 60, base - 29]], 'rgba(60,111,196,.75)', 'rgba(246,238,224,.8)');
    /* a broken crate */
    g.fillStyle = '#a8743f'; g.beginPath(); g.moveTo(x0 + 70, base + 2); g.lineTo(x0 + 70, base - 7); g.lineTo(x0 + 76, base - 9); g.lineTo(x0 + 80, base - 5); g.lineTo(x0 + 80, base + 2); g.closePath(); g.fill();
    g.strokeStyle = '#6b4422'; g.lineWidth = 0.9; g.stroke();
    rubble(5); weeds(6);
    return;
  }
  const wx0 = x0 + 24, wx1 = x0 + 78;
  /* its walls, broken off: high at the left, down to a stump at the right */
  const top = [[0, 38], [5, 42], [9, 34], [14, 37], [19, 27], [25, 30], [30, 20], [37, 23], [42, 14], [48, 16], [54, 9]];
  g.fillStyle = lin(g, wx0, 0, wx1, 0, [[0, '#ddd5c4'], [1, '#9c937f']]);
  g.beginPath(); g.moveTo(wx0, base); top.forEach(([dx, dy])=> g.lineTo(wx0 + dx, base - dy)); g.lineTo(wx1, base); g.closePath(); g.fill();
  g.save(); g.clip();
  g.strokeStyle = 'rgba(80,70,56,.32)'; g.lineWidth = 0.8;
  for(let r = 1; r < 9; r++){ g.beginPath(); g.moveTo(wx0, base - r * 5); g.lineTo(wx1, base - r * 5); g.stroke(); for(let x = wx0 + (r % 2) * 4; x < wx1; x += 8){ g.beginPath(); g.moveTo(x, base - r * 5); g.lineTo(x, base - r * 5 + 5); g.stroke(); } }
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(wx1 - 6, base - 40, 6, 40);
  g.restore();
  /* the doorway, its door gone; an empty window */
  g.fillStyle = '#2d241c'; g.beginPath(); g.moveTo(x0 + 42, base); g.lineTo(x0 + 42, base - 12); g.arc(x0 + 48, base - 12, 6, Math.PI, 0); g.lineTo(x0 + 54, base); g.fill();
  g.fillRect(x0 + 29, base - 28, 6, 8);
  /* the roof fallen in: a slab of it leaning on the wall, its rafters bare */
  const col = kind === 'barracks' ? ['#b4483c', '#7a2a20'] : kind === 'granary' ? ['#8a5a3a', '#4f2a18'] : ['#8a7a62', '#5a4a36'];
  g.fillStyle = col[0]; g.beginPath(); g.moveTo(x0 + 16, base - 34); g.lineTo(x0 + 44, base - 50); g.lineTo(x0 + 52, base - 41); g.lineTo(x0 + 25, base - 25); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 0.8; for(let k = 1; k < 4; k++){ g.beginPath(); g.moveTo(x0 + 16 + 9 * k / 4 * 1, base - 34 + 9 * k / 4); g.lineTo(x0 + 44 + 8 * k / 4, base - 50 + 9 * k / 4); g.stroke(); }
  g.fillStyle = col[1]; g.beginPath(); g.moveTo(x0 + 25, base - 25); g.lineTo(x0 + 52, base - 41); g.lineTo(x0 + 53, base - 37); g.lineTo(x0 + 26, base - 21.5); g.closePath(); g.fill();
  g.strokeStyle = '#4a3322'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath();
  for(let k = 0; k < 3; k++){ g.moveTo(x0 + 54 + k * 7, base - 36 + k * 4); g.lineTo(x0 + 60 + k * 7, base - 15 + k * 3); }
  g.moveTo(x0 + 52, base - 38); g.lineTo(x0 + 76, base - 24); g.stroke(); g.lineCap = 'butt';
  /* ivy over the high end */
  for(let k = 0; k < 18; k++) ell(g, wx0 - 1 + R() * 20, base - 3 - R() * 34, 2.3, 1.6, R() < 0.5 ? '#4f8a3a' : '#6aa84e', R() * 3);
  rubble(7); weeds(7);
}

/* ---------- THE BUILDINGS, A PLOT EACH (levels 1 to 5; houses and towers to 10) ---------- */
function palace(g, x0, y0, L){
  shade(g, x0 + 54, y0 + 90, 44, 9, 0.3);
  g.fillStyle = '#cfc4ab'; g.fillRect(x0 + 34, y0 + 86, 32, 5); g.fillStyle = '#e2d8c2'; g.fillRect(x0 + 37, y0 + 83, 26, 4);
  wall(g, x0 + 24, y0 + 44, 52, 42, '#f1e9d6', '#cdbf9f');
  g.strokeStyle = 'rgba(120,104,80,.28)'; g.lineWidth = 0.7; for(let r = 0; r < 7; r++){ g.beginPath(); g.moveTo(x0 + 24, y0 + 50 + r * 6); g.lineTo(x0 + 76, y0 + 50 + r * 6); g.stroke(); }
  const gold = L >= 3 ? '#e8bf4a' : '#cbb07a';
  door(g, x0 + 43, y0 + 64, 14, 22, '#6b3f24');
  g.strokeStyle = gold; g.lineWidth = 1.4; g.beginPath(); g.arc(x0 + 50, y0 + 71, 8.5, Math.PI, 0); g.stroke();
  windowLit(g, x0 + 29, y0 + 52, 7, 10, true); windowLit(g, x0 + 64, y0 + 52, 7, 10, true);
  if(L >= 2){ [x0 + 30, x0 + 64].forEach(bx=>{ g.fillStyle = '#c8463c'; g.fillRect(bx, y0 + 64, 6, 13); g.fillStyle = '#e0b84a'; g.beginPath(); g.moveTo(bx, y0 + 77); g.lineTo(bx + 3, y0 + 80); g.lineTo(bx + 6, y0 + 77); g.fill(); ell(g, bx + 3, y0 + 68, 1.6, 1.6, '#f4d36a'); }); }
  g.fillStyle = lin(g, x0 + 20, 0, x0 + 80, 0, [[0, '#7193d6'], [0.5, '#4a6aa8'], [1, '#2f4778']]);
  g.beginPath(); g.moveTo(x0 + 20, y0 + 46); g.lineTo(x0 + 34, y0 + 26); g.lineTo(x0 + 66, y0 + 26); g.lineTo(x0 + 80, y0 + 46); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(20,30,60,.3)'; g.lineWidth = 0.7; for(let r = 1; r < 4; r++){ const yy = y0 + 26 + r * 5; g.beginPath(); g.moveTo(x0 + 34 - r * 3.5, yy); g.lineTo(x0 + 66 + r * 3.5, yy); g.stroke(); }
  g.fillStyle = gold; g.fillRect(x0 + 34, y0 + 24.5, 32, 2.2);
  if(L >= 4) g.fillRect(x0 + 20, y0 + 45, 60, 2.2);
  const th = 48 + 4 * L;
  roundTower(g, x0 + 17, y0 + 88, 9, th, 'cone', { flag:'#c8463c', tip:gold, slits:2 });
  roundTower(g, x0 + 83, y0 + 88, 9, th, 'cone', { flag:'#c8463c', tip:gold, slits:2 });
  if(L >= 3){ const top = y0 + (L >= 5 ? -2 : 4); g.fillStyle = L >= 5 ? lin(g, x0 + 44, 0, x0 + 56, 0, [[0, '#ffe08a'], [1, '#b8860b']]) : lin(g, x0 + 44, 0, x0 + 56, 0, [[0, '#7193d6'], [1, '#2f4778']]); g.beginPath(); g.moveTo(x0 + 44, y0 + 27); g.lineTo(x0 + 50, top); g.lineTo(x0 + 56, y0 + 27); g.closePath(); g.fill(); flag(g, x0 + 50, top, '#e0b84a', 9); }
  else flag(g, x0 + 50, y0 + 26, '#c8463c', 12);
}
/* (4.74) the barracks (the healer's house was): a hall of grey stone, a red roof; a straw man and a target to practise
   on; spears racked (3), its banners (3), a watch turret (4), its crest gilded (5) */
function barracks(g, x0, y0, L){
  shade(g, x0 + 58, y0 + 90, 40, 8, 0.26);
  ell(g, x0 + 22, y0 + 89, 20, 8, 'rgba(196,166,110,.75)'); ell(g, x0 + 20, y0 + 88, 14, 5.4, 'rgba(226,204,150,.7)');
  if(L >= 2) target(g, x0 + 30, y0 + 76);
  wall(g, x0 + 40, y0 + 52, 50, 34, '#dcd7ce', '#a49e92');
  g.strokeStyle = 'rgba(80,74,64,.3)'; g.lineWidth = 0.7; for(let r = 1; r < 6; r++){ g.beginPath(); g.moveTo(x0 + 40, y0 + 52 + r * 6); g.lineTo(x0 + 90, y0 + 52 + r * 6); g.stroke(); }
  door(g, x0 + 59, y0 + 68, 12, 18, '#5a3a22');
  windowLit(g, x0 + 45, y0 + 59, 6, 8); windowLit(g, x0 + 79, y0 + 59, 6, 8);
  gable(g, x0 + 40, y0 + 34, 50, 19, RED[1], RED[2], RED[0]);
  if(L >= 5){ g.fillStyle = GOLD[1]; g.beginPath(); g.moveTo(x0 + 60, y0 + 38); g.lineTo(x0 + 70, y0 + 38); g.lineTo(x0 + 70, y0 + 44); g.quadraticCurveTo(x0 + 65, y0 + 50, x0 + 60, y0 + 44); g.closePath(); g.fill(); ell(g, x0 + 65, y0 + 42, 1.6, 1.6, '#c8463c'); }
  if(L >= 3){ banner(g, x0 + 51, y0 + 64, 5, 13, '#c8463c'); banner(g, x0 + 74, y0 + 64, 5, 13, '#c8463c'); }
  if(L >= 4) roundTower(g, x0 + 90, y0 + 88, 7.5, 50, 'cone', { roof:RED[1], roofL:RED[0], roofD:RED[2], tip:GOLD[1], flag:L >= 5 ? GOLD[1] : '#c8463c', slits:1 });
  dummy(g, x0 + 14, y0 + 92);
  if(L >= 3) rack(g, x0 + 24, y0 + 99);
}
function market(g, x0, y0, L){
  shade(g, x0 + 52, y0 + 90, 44, 8, 0.2);
  if(L >= 4){ gable(g, x0 + 14, y0 + 10, 72, 18, '#b9533c', '#7a2f20', '#e0846a'); if(L >= 5) flag(g, x0 + 50, y0 + 9, '#e0b84a', 10); }
  if(L >= 3) bunting(g, x0 + 4, x0 + 96, y0 + 30, 7.7);
  stall(g, x0 + 10, y0 + 70, '#c8463c', '#f6eee0', 'fruit');
  stall(g, x0 + 56, y0 + 66, '#3c6fc4', '#f6eee0', 'potion');
  (L >= 5 ? [[x0 + 46, y0 + 78]] : [[x0 + 46, y0 + 78], [x0 + 88, y0 + 84]]).forEach(([bx, by])=> barrel(g, bx, by));
  if(L >= 2) stall(g, x0 + 33, y0 + 94, '#e0a42a', '#f6eee0', 'bread');
  if(L >= 5) fountain(g, x0 + 84, y0 + 92, 1);
}
function yard(g, x0, y0, L){
  shade(g, x0 + 50, y0 + 90, 42, 8, 0.2);
  if(L >= 3){ gable(g, x0 + 56, y0 + 12, 32, 12, '#8a5a2b', '#5a3a1a', '#b98a5a'); wall(g, x0 + 56, y0 + 24, 32, 18, '#c9a77a', '#8a6a44'); door(g, x0 + 67, y0 + 28, 10, 14, '#5a3a1a'); }
  wall(g, x0 + 54, y0 + 56, 36, 30, '#d9d2c2', '#a59d8c');
  if(L >= 5) for(let k = 0; k < 4; k++){ g.fillStyle = '#d9d2c2'; g.fillRect(x0 + 55 + k * 9.5, y0 + 51, 6, 5); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x0 + 59.5 + k * 9.5, y0 + 51, 1.5, 5); }
  g.strokeStyle = 'rgba(80,70,56,.4)'; g.lineWidth = 0.7; for(let r = 0; r < 4; r++){ g.beginPath(); g.moveTo(x0 + 54, y0 + 62 + r * 7); g.lineTo(x0 + 90, y0 + 62 + r * 7); g.stroke(); }
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 1.6; [56, 72, 88].forEach(px=>{ g.beginPath(); g.moveTo(x0 + px, y0 + 86); g.lineTo(x0 + px, y0 + 44); g.stroke(); }); [50, 66].forEach(py=>{ g.beginPath(); g.moveTo(x0 + 54, y0 + py); g.lineTo(x0 + 92, y0 + py); g.stroke(); });
  crane(g, x0 + 26, y0 + 84, 46 + 3 * L);
  logs(g, x0 + 6, y0 + 92);
  if(L >= 5) flag(g, x0 + 26, y0 + 84 - 46 - 3 * L, '#c8463c', 9);
  if(L >= 4) cart(g, x0 + 40, y0 + 96);
  blocks(g, [[x0 + 62, y0 + 96], [x0 + 74, y0 + 97], [x0 + 68, y0 + 91]]);
}
function granary(g, x0, y0, L){
  shade(g, x0 + 46, y0 + 90, 40, 8, 0.28);
  if(L >= 5) sails(g, x0 + 22, y0 + 22, 20);
  g.fillStyle = '#8b5e33'; rr(g, x0 + 66, y0 + 62, 28, 30, 3); g.fill();
  for(let r = 0; r < 4; r++) for(let k = 0; k < 4; k++){ const px = x0 + 70 + k * 6.5, py = y0 + 68 + r * 7; ell(g, px, py, 2.4, 2, r % 2 ? '#6fb34a' : '#4f9a3a'); }
  wall(g, x0 + 14, y0 + 50, 48, 38, '#b8503a', '#7a2f22');
  g.strokeStyle = 'rgba(40,14,8,.35)'; g.lineWidth = 0.7; for(let k = 1; k < 10; k++){ g.beginPath(); g.moveTo(x0 + 14 + k * 4.8, y0 + 50); g.lineTo(x0 + 14 + k * 4.8, y0 + 88); g.stroke(); }
  g.fillStyle = '#5a2a1a'; g.beginPath(); g.moveTo(x0 + 10, y0 + 52); g.lineTo(x0 + 18, y0 + 36); g.lineTo(x0 + 30, y0 + 28); g.lineTo(x0 + 46, y0 + 28); g.lineTo(x0 + 58, y0 + 36); g.lineTo(x0 + 66, y0 + 52); g.closePath(); g.fill();
  g.fillStyle = '#7a3a26'; g.beginPath(); g.moveTo(x0 + 10, y0 + 52); g.lineTo(x0 + 18, y0 + 36); g.lineTo(x0 + 30, y0 + 28); g.lineTo(x0 + 38, y0 + 28); g.lineTo(x0 + 38, y0 + 52); g.closePath(); g.fill();
  g.strokeStyle = '#f3e6d0'; g.lineWidth = 1.8; g.strokeRect(x0 + 28, y0 + 66, 20, 22); g.beginPath(); g.moveTo(x0 + 28, y0 + 66); g.lineTo(x0 + 48, y0 + 88); g.moveTo(x0 + 48, y0 + 66); g.lineTo(x0 + 28, y0 + 88); g.stroke();
  g.fillStyle = '#3a2418'; g.fillRect(x0 + 32, y0 + 54, 12, 9); g.fillStyle = '#e2c46a'; g.fillRect(x0 + 33, y0 + 59, 10, 4);
  (L >= 2 ? [[x0 + 12, y0 + 96], [x0 + 22, y0 + 97], [x0 + 17, y0 + 89]] : [[x0 + 12, y0 + 96], [x0 + 22, y0 + 97]]).forEach(([hx, hy])=>{ shade(g, hx + 1, hy, 5.5, 2, 0.3); g.fillStyle = lin(g, 0, hy - 8, 0, hy, [[0, '#ecd27a'], [1, '#c9a24d']]); rr(g, hx - 5, hy - 8, 10, 8, 2); g.fill(); g.strokeStyle = 'rgba(140,100,40,.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(hx - 5, hy - 4); g.lineTo(hx + 5, hy - 4); g.stroke(); });
  if(L >= 3) roundTower(g, x0 + 78, y0 + 58, 8, 26, 'cone', { roof:'#7a3a26', roofL:'#a5543a', roofD:'#4a1c10', tip:'#c9b48a' });
  if(L >= 4){ g.strokeStyle = '#a07a4a'; g.lineWidth = 1; g.strokeRect(x0 + 64.5, y0 + 60.5, 31, 33); for(let k = 0; k < 5; k++){ g.fillStyle = '#d8b27a'; g.fillRect(x0 + 64 + k * 7.6, y0 + 89, 1.8, 5.5); }
    const sx = x0 + 88, sy = y0 + 78; g.fillStyle = '#6b4426'; g.fillRect(sx - 0.8, sy - 16, 1.6, 16); g.fillRect(sx - 7, sy - 12, 14, 1.6); g.fillStyle = '#c9493a'; g.fillRect(sx - 3.5, sy - 12, 7, 7); g.fillStyle = '#3c6fc4'; g.fillRect(sx - 3, sy - 5.5, 6, 4); ell(g, sx, sy - 15, 3, 2.8, '#ecd27a'); g.fillStyle = '#a5741c'; g.fillRect(sx - 4.4, sy - 17.6, 8.8, 1.6); g.fillRect(sx - 2.6, sy - 20.4, 5.2, 3); }
}
function cottage(g, x, y, w, h, roof, thatch, opts){
  opts = opts || {};
  shade(g, x + w / 2 + 3, y + 2, w * 0.62, 5, 0.28);
  wall(g, x, y - h, w, h, opts.wall || '#f2e6cc', opts.wallD || '#cdbb96', opts.beams);
  door(g, x + w / 2 - 4.5, y - 14, 9, 14, opts.door || '#7a4a2a');
  windowLit(g, x + 5, y - h + 6, 7, 7); if(w > 34) windowLit(g, x + w - 12, y - h + 6, 7, 7);
  if(opts.box){ g.fillStyle = '#7a4a2a'; g.fillRect(x + 4, y - h + 13.5, 9, 2.2); ell(g, x + 6, y - h + 13.2, 1.4, 1.4, '#e8414f'); ell(g, x + 9.5, y - h + 13.2, 1.4, 1.4, '#f2c23a'); }
  const rh = h * 0.72;
  if(thatch) gable(g, x, y - h - rh, w, rh, '#d9b45a', '#a8812e', '#f0d488', 'thatch');
  else gable(g, x, y - h - rh, w, rh, roof, 'rgba(0,0,0,.28)', 'rgba(255,255,255,.35)');
  if(opts.chimney) chimney(g, x + w * 0.72, y - h - rh * 0.35, 9, true);
}
/* (4.74) a house of two floors: stone below; above, timbered or white; a balcony, gilding */
function townhouse(g, x, yb, w, o){
  const h1 = 24, h2 = 22, top = yb - h1 - h2;
  shade(g, x + w / 2 + 4, yb + 2, w * 0.62, 6, 0.28);
  wall(g, x, yb - h1, w, h1, o.stone || '#e4dccb', o.stoneD || '#b8ad96');
  g.strokeStyle = 'rgba(80,70,56,.28)'; g.lineWidth = 0.7; for(let r = 1; r < 4; r++){ g.beginPath(); g.moveTo(x, yb - r * 6); g.lineTo(x + w, yb - r * 6); g.stroke(); }
  door(g, x + w / 2 - 5, yb - 16, 10, 16, o.door || '#5a3a22');
  windowLit(g, x + 6, yb - h1 + 6, 8, 9, o.arch); windowLit(g, x + w - 14, yb - h1 + 6, 8, 9, o.arch);
  wall(g, x - 2, top, w + 4, h2, o.upper || '#f6eee0', o.upperD || '#d6c8a8', o.beams);
  for(let k = 0; k < 3; k++) windowLit(g, x + 5 + k * (w - 18) / 2, top + 5, 8, 10, o.arch);
  if(o.box) for(let k = 0; k < 3; k++){ const bx = x + 4 + k * (w - 18) / 2; g.fillStyle = '#7a4a2a'; g.fillRect(bx, top + 15.5, 10, 2.2); ell(g, bx + 2.5, top + 15.2, 1.4, 1.4, '#e8414f'); ell(g, bx + 6, top + 15.2, 1.4, 1.4, '#f2c23a'); ell(g, bx + 8.6, top + 15.2, 1.2, 1.2, '#f08bb4'); }
  if(o.balcony){ const bx = x + w / 2 - 15; g.fillStyle = '#efe8da'; g.fillRect(bx, top + h2 - 2, 30, 3); g.strokeStyle = '#efe8da'; g.lineWidth = 1; for(let k = 0; k <= 7; k++){ g.beginPath(); g.moveTo(bx + 1 + k * 4, top + h2 - 2); g.lineTo(bx + 1 + k * 4, top + h2 - 9); g.stroke(); } g.fillRect(bx, top + h2 - 10, 30, 1.6); if(o.trim){ g.fillStyle = o.trim; g.fillRect(bx, top + h2 - 10.6, 30, 1.2); } }
  gable(g, x - 2, top - 22, w + 4, 22, o.roof || '#b9533c', 'rgba(0,0,0,.28)', 'rgba(255,255,255,.35)');
  if(o.trim){ g.fillStyle = o.trim; g.fillRect(x - 2, top - 1.2, w + 4, 2.2); g.fillRect(x + (w + 4) * 0.12 - 2, top - 23.5, (w + 4) * 0.76, 2); }
  if(o.chimney) chimney(g, x + w * 0.74, top - 9, 10, true);
}
function house(g, x0, y0, L){
  const fence = ()=>{ g.strokeStyle = '#a07a4a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0 + 8, y0 + 90); g.lineTo(x0 + 42, y0 + 90); g.moveTo(x0 + 58, y0 + 90); g.lineTo(x0 + 92, y0 + 90); g.stroke(); for(let k = 0; k < 10; k++){ if(k === 5 || k === 4) continue; g.fillStyle = '#d8b27a'; g.fillRect(x0 + 8 + k * 8.4, y0 + 85, 2, 7); } };
  if(L <= 1){ cottage(g, x0 + 30, y0 + 84, 40, 26, null, true); for(let k = 0; k < 4; k++) ell(g, x0 + 16 + k * 3, y0 + 86, 2.2, 2, '#5fa84a'); return; }
  if(L === 2){ cottage(g, x0 + 24, y0 + 84, 52, 30, '#b9533c', false, { box:true, chimney:true }); fence(); return; }
  if(L === 3){ cottage(g, x0 + 8, y0 + 86, 36, 26, null, true); cottage(g, x0 + 56, y0 + 82, 38, 28, '#b9533c', false, { box:true, chimney:true }); return; }
  if(L === 4){ cottage(g, x0 + 22, y0 + 86, 56, 46, '#5f6f86', false, { beams:true, wall:'#f6eee0', wallD:'#d6c8a8', chimney:true, box:true }); fence(); return; }
  if(L === 5){ cottage(g, x0 + 16, y0 + 84, 68, 44, '#3e5f9a', false, { beams:true, wall:'#f6eee0', wallD:'#d6c8a8', chimney:true, box:true, door:'#3c2a1c' }); flag(g, x0 + 50, y0 + 16, '#e0b84a', 8); return; }
  /* (4.74) 6: two floors, timbered above; 7: a turret; 8: white stone, a balcony; 9: gilded; 10: a gold dome, a fountain */
  const white = L >= 8, x = x0 + 14, w = 58;
  if(L >= 7){ const roofs = L >= 10 ? { roof:GOLD[1], roofL:GOLD[0], roofD:GOLD[2] } : white ? { roof:BLUE[1], roofL:BLUE[0], roofD:BLUE[2] } : { roof:RED[1], roofL:RED[0], roofD:RED[2] };
    roundTower(g, x0 + 84, y0 + 80, 8.5, 54 + 3 * (L - 7), L >= 10 ? 'dome' : 'cone', Object.assign({ white, band:L >= 9 ? GOLD[1] : null, flag:L >= 9 ? '#c8463c' : null, tip:GOLD[1], domeC:GOLD, slits:1 }, roofs)); }
  townhouse(g, x, y0 + 86, w, white ? { stone:'#f2eee6', stoneD:'#c9c2b4', upper:'#fbf8f2', upperD:'#ddd6c8', roof:L >= 10 ? '#3e5f9a' : BLUE[1], arch:true, balcony:true, chimney:true, box:true, trim:L >= 9 ? GOLD[1] : null, door:'#3c2a1c' }
                                  : { beams:true, roof:'#b9533c', chimney:true, box:true });
  if(L >= 10){ fountain(g, x0 + 12, y0 + 97, 0.8); topiary(g, x0 + 92, y0 + 98, 0.75); }
  else if(L >= 7) fence();
}
/* the fairybird mages' towers: taller; white stone from 6, a crystal floating over it, glowing; runes round it (8);
   gold bands (7), a balcony (9), a gold dome (10) */
function tower(g, x0, y0, L){
  const h = 44 + 7 * Math.min(L, 5) + 3 * Math.max(0, L - 5), r = L >= 8 ? 16.5 : 15, cx = x0 + 50, white = L >= 6;
  const purple = { roof:'#6b4a8a', roofL:'#8e6cb0', roofD:'#43295e', tip:GOLD[1] };
  roundTower(g, cx, y0 + 88, r, h, L >= 10 ? 'dome' : L >= 3 ? 'cone' : 'flat', Object.assign({ slits:3, flag:L >= 6 ? null : '#c8463c', white, band:L >= 7 ? GOLD[1] : null, domeC:GOLD }, purple));
  g.fillStyle = '#4a3a2a'; g.beginPath(); g.moveTo(cx - 6, y0 + 89); g.lineTo(cx - 6, y0 + 80); g.arc(cx, y0 + 80, 6, Math.PI, 0); g.lineTo(cx + 6, y0 + 89); g.fill();
  if(L >= 9){ const by = y0 + 88 - h * 0.62; g.fillStyle = '#efe8da'; g.beginPath(); g.ellipse(cx, by, r + 4, (r + 4) * 0.36, 0, 0, Math.PI); g.lineTo(cx - r - 4, by - 2); g.ellipse(cx, by - 2, r + 4, (r + 4) * 0.36, 0, Math.PI, 0, true); g.closePath(); g.fill(); g.strokeStyle = GOLD[1]; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, by - 2, r + 4, (r + 4) * 0.36, 0, 0.1, Math.PI - 0.1); g.stroke(); }
  if(L >= 8){ g.save(); g.strokeStyle = 'rgba(160,220,255,.75)'; g.lineWidth = 1.3; g.shadowColor = 'rgba(120,200,255,.9)'; g.shadowBlur = 6; g.beginPath(); g.ellipse(cx, y0 + 88 - h * 0.35, r + 7, (r + 7) * 0.34, 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(220,245,255,.95)'; for(let k = 0; k < 6; k++){ const a = k / 6 * TAU + 0.3; g.fillRect(cx + Math.cos(a) * (r + 7) - 1, y0 + 88 - h * 0.35 + Math.sin(a) * (r + 7) * 0.34 - 1.4, 2, 2.8); } g.restore(); }
  if(L >= 6){ /* the crystal, over the roof */
    const top = y0 + 88 - h - (L >= 10 ? (r + 1.5) * 1.3 + 22 : r * 1.7 + 10), s = 0.9 + 0.08 * (L - 6);
    const gl = g.createRadialGradient(cx, top, 1, cx, top, 16 * s); gl.addColorStop(0, 'rgba(200,240,255,.85)'); gl.addColorStop(1, 'rgba(120,190,255,0)');
    g.fillStyle = gl; g.fillRect(cx - 16 * s, top - 16 * s, 32 * s, 32 * s);
    g.fillStyle = lin(g, cx - 4 * s, top - 8 * s, cx + 4 * s, top + 8 * s, [[0, '#e8fbff'], [0.5, '#7fd0f0'], [1, '#6a5ad0']]);
    g.beginPath(); g.moveTo(cx, top - 8 * s); g.lineTo(cx + 4.4 * s, top); g.lineTo(cx, top + 8 * s); g.lineTo(cx - 4.4 * s, top); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(cx, top - 8 * s); g.lineTo(cx - 4.4 * s, top); g.lineTo(cx - 1, top - 0.5); g.closePath(); g.fill();
    if(L >= 8) [[-9, -6], [8, -9], [10, 5], [-8, 7]].forEach(([dx, dy])=>{ g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(cx + dx * s - 0.5, top + dy * s - 2, 1, 4); g.fillRect(cx + dx * s - 2, top + dy * s - 0.5, 4, 1); });
  }
}
/* ---------- (4.74) THE GRAND BUILDINGS: from level 6, each on its lot (2 by 2); the palace on its ground, 2 by 2 (6 to 8),
   3 by 2 (9), 4 by 3 (10) ("more and more grand each time … more and more detailed"). (X, Y): its ground's top left ---------- */
function palaceBig(g, X, Y, w, h, L){
  const W = w * 100, cx = X + W / 2, base = Y + h * 100 - 8, big = w >= 4, mid = w === 3;
  const gold = L >= 8 ? GOLD[1] : '#d4b064';
  const roofs = { roof:BLUE[1], roofL:BLUE[0], roofD:BLUE[2], tip:gold };
  const face = { top:'#faf4e6', bottom:'#d8caa8', trim:L >= 7 ? gold : null };
  const fb = big ? base - 78 : base;                                   // its own foot (on its terrace at 10)
  shade(g, cx + 12, base - 4, W * 0.46, big ? 24 : 16, 0.26);
  /* the rear towers, the keep and its roof */
  const rt = big ? [132, 12, 100] : mid ? [104, 11, 82] : [62, 10, 64 + 4 * (L - 6)];
  [-1, 1].forEach(s=> roundTower(g, cx + s * rt[0], fb - (big ? 120 : 96), rt[1], rt[2], L >= 9 ? 'dome' : 'cone', Object.assign({ flag:'#c8463c', slits:2, band:L >= 8 ? gold : null, domeC:L >= 10 ? GOLD : BLUE }, roofs)));
  const kw = big ? 104 : mid ? 84 : 70, kh = big ? 112 : mid ? 94 : 82, kb = fb - (big ? 66 : 58);
  hall(g, cx - kw / 2, kb, kw, kh, Object.assign({ rows:2, win:big ? 4 : 3, ww:8, wh:12 }, face));
  if(!mid && !big){ pyramid(g, cx, kb - kh, kw, 44, BLUE); g.fillStyle = gold; g.fillRect(cx - 0.8, kb - kh - 56, 1.6, 12); flag(g, cx, kb - kh - 56, L >= 8 ? GOLD[1] : '#c8463c', 10); }
  else { parapet(g, cx - kw / 2, kb - kh, kw, face.top); const top = dome(g, cx, kb - kh - 6, kw * (big ? 0.4 : 0.34), L >= 10 ? GOLD : BLUE, gold);
    if(big){ g.fillStyle = gold; g.fillRect(cx - 1, top - 22, 2, 22); flag(g, cx, top - 22, '#c8463c', 12); } else flag(g, cx, top, '#c8463c', 10); }
  /* the wings (3 and 4 wide) */
  if(w >= 3){
    const ww = big ? 86 : 66, wh = big ? 52 : 44, wb = fb - 6, hw = big ? 88 : 75;
    [-1, 1].forEach(s=>{ const wx = s < 0 ? cx - hw - ww : cx + hw;
      hall(g, wx, wb, ww, wh, Object.assign({ win:3 }, face));
      gable(g, wx, wb - wh - 18, ww, 18, BLUE[1], 'rgba(20,30,60,.35)', BLUE[0]);
      if(L >= 9) [0.25, 0.75].forEach(u=> banner(g, wx + ww * u - 3, wb - wh + 6, 6, 16, '#3c6fc4')); });
  }
  /* the great hall, its door; its banners (7), its ridge gilded (8), a balcony over the door (9) */
  const hw2 = big ? 176 : mid ? 150 : 140, hh = big ? 66 : mid ? 58 : 54, hb = fb - 12;
  hall(g, cx - hw2 / 2, hb, hw2, hh, Object.assign({ win:big ? 7 : 6, door:[24, 36, '#6b3f24'], gold }, face));
  gable(g, cx - hw2 / 2, hb - hh - 24, hw2, 24, BLUE[1], 'rgba(20,30,60,.35)', BLUE[0]);
  if(L >= 8){ g.fillStyle = gold; g.fillRect(cx - hw2 / 2 + hw2 * 0.12, hb - hh - 25.6, hw2 * 0.76, 2.4); }
  crown(g, cx, hb - hh - 3, L >= 8 ? 1.3 : 1.05);
  if(L >= 7) [-1, 1].forEach(s=> banner(g, cx + s * 21 - 3.5, hb - hh + 6, 7, 20, '#c8463c'));
  if(L >= 9){ const by = hb - 40, bx = cx - 17; g.fillStyle = '#efe8da'; g.fillRect(bx, by, 34, 3); g.strokeStyle = '#efe8da'; g.lineWidth = 1; for(let k = 0; k <= 8; k++){ g.beginPath(); g.moveTo(bx + 1 + k * 4, by); g.lineTo(bx + 1 + k * 4, by - 7); g.stroke(); } g.fillRect(bx, by - 8, 34, 1.6); g.fillStyle = gold; g.fillRect(bx, by - 8.6, 34, 1.2); }
  /* (10) the terrace: its top, its towers, its face, the grand stair; the forecourt's fountains and beds */
  if(big){
    stones(g, X + 30, hb, X + W - 30, fb, 5);
    [-1, 1].forEach(s=> roundTower(g, cx + s * 90, fb - 2, 13, 108, 'dome', Object.assign({ flag:'#c8463c', slits:2, band:gold, domeC:GOLD }, roofs)));
    wall(g, X + 30, fb, W - 60, 30, '#efe6d2', '#c8b994');
    g.strokeStyle = 'rgba(120,104,80,.3)'; g.lineWidth = 0.7; for(let yy = fb + 6; yy < fb + 30; yy += 6){ g.beginPath(); g.moveTo(X + 30, yy); g.lineTo(X + W - 30, yy); g.stroke(); }
    g.fillStyle = '#f6efdf'; g.fillRect(X + 28, fb - 2, W - 56, 3); for(let x = X + 32; x < X + W - 32; x += 6){ g.fillRect(x, fb - 7, 1.6, 5); } g.fillRect(X + 28, fb - 8, W - 56, 1.6);
    g.fillStyle = gold; g.fillRect(X + 28, fb - 8.6, W - 56, 1);
    stair(g, cx, fb + 30, 72, 9);
    [-1, 1].forEach(s=>{ fountain(g, cx + s * 96, base - 10, 1.8); const R = rng(77 + s); parterre(g, cx + s * 148 - 22, base - 38, 44, 26, R, ['#e8414f', '#f2c23a', '#ffffff', '#c9a6f0']); });
    banner(g, cx - 52, fb + 4, 8, 20, '#3c6fc4'); banner(g, cx + 44, fb + 4, 8, 20, '#3c6fc4');
  } else stair(g, cx, fb, 44, 4);
  /* the towers at the hall's ends (3 wide) */
  if(mid) [-1, 1].forEach(s=> roundTower(g, cx + s * 76, fb - 2, 12, 92, L >= 9 ? 'dome' : 'cone', Object.assign({ flag:'#c8463c', slits:2, band:gold, domeC:BLUE }, roofs)));
  /* the front towers */
  const ft = big ? [184, 18, 128] : mid ? [140, 16, 104] : [84, 15, 90 + 4 * (L - 6)];
  [-1, 1].forEach(s=> roundTower(g, cx + s * ft[0], base - 2, ft[1], ft[2], L >= 8 ? 'dome' : 'cone', Object.assign({ flag:L >= 10 ? GOLD[1] : '#c8463c', slits:3, band:L >= 7 ? gold : null, domeC:L >= 10 ? GOLD : BLUE }, roofs)));
}
/* the barracks, a fort: its keep and square tower, the drill yard before them; more to train on with each level; round
   towers (8), walls round the yard (9), gilded (10) */
function barracksBig(g, X, Y, w, h, L){
  shade(g, X + 110, Y + 116, 86, 8, 0.22);
  const gold = L >= 10 ? GOLD[1] : '#c8463c';
  /* the square tower at the back left */
  const tx = X + 22, tw = 36, tb = Y + 112, th = 86;
  wall(g, tx, tb - th, tw, th, '#e2ddd3', '#9e988c');
  g.strokeStyle = 'rgba(80,74,64,.3)'; g.lineWidth = 0.7; for(let yy = tb - 6; yy > tb - th; yy -= 6){ g.beginPath(); g.moveTo(tx, yy); g.lineTo(tx + tw, yy); g.stroke(); }
  for(let k = 0; k < 3; k++){ g.fillStyle = '#2d241c'; g.fillRect(tx + tw / 2 - 1.2, tb - th + 14 + k * 22, 2.4, 8); }
  parapet(g, tx, tb - th, tw, '#e2ddd3'); flag(g, tx + tw / 2, tb - th - 8, gold, 16);
  /* the keep: grey stone, its gate, its windows; the red roof */
  const kx = X + 62, kw = 122, kb = Y + 108, kh = 48;
  hall(g, kx, kb, kw, kh, { top:'#dcd7ce', bottom:'#a49e92', course:'rgba(80,74,64,.3)', win:5, ww:7, wh:10, door:[22, 30, '#4a3322'], gold:L >= 10 ? GOLD[1] : null, trim:L >= 10 ? GOLD[1] : null });
  g.strokeStyle = '#5a5046'; g.lineWidth = 1; for(let k = 1; k < 5; k++){ g.beginPath(); g.moveTo(kx + kw / 2 - 11 + k * 4.4, kb - 28); g.lineTo(kx + kw / 2 - 11 + k * 4.4, kb - 3); g.stroke(); }
  gable(g, kx, kb - kh - 26, kw, 26, RED[1], RED[2], RED[0]);
  if(L >= 10){ g.fillStyle = GOLD[1]; g.fillRect(kx + kw * 0.12, kb - kh - 27.6, kw * 0.76, 2.4); }
  /* its crest, its banners */
  const sx = kx + kw / 2; g.fillStyle = L >= 10 ? GOLD[1] : '#c8463c'; g.beginPath(); g.moveTo(sx - 7, kb - kh - 20); g.lineTo(sx + 7, kb - kh - 20); g.lineTo(sx + 7, kb - kh - 12); g.quadraticCurveTo(sx, kb - kh - 3, sx - 7, kb - kh - 12); g.closePath(); g.fill();
  g.strokeStyle = '#f6eee0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(sx - 4, kb - kh - 17); g.lineTo(sx + 4, kb - kh - 9); g.moveTo(sx + 4, kb - kh - 17); g.lineTo(sx - 4, kb - kh - 9); g.stroke();
  [kx + 16, kx + kw - 24].forEach(bx=> banner(g, bx, kb - kh + 5, 8, 20, '#c8463c', L >= 10 ? GOLD[1] : '#e0b84a'));
  if(L >= 8) [kx - 2, kx + kw + 2].forEach(rx=> roundTower(g, rx, kb + 4, 11, 74 + 4 * (L - 8), L >= 10 ? 'dome' : 'cone', { roof:RED[1], roofL:RED[0], roofD:RED[2], tip:GOLD[1], flag:gold, slits:2, domeC:GOLD, band:L >= 9 ? GOLD[1] : null }));
  /* walls round the yard (9) */
  if(L >= 9) [[X + 4, X + 12], [X + 188, X + 196]].forEach(([a])=>{ g.fillStyle = lin(g, a, 0, a + 8, 0, [[0, '#e2ddd3'], [1, '#a49e92']]); g.fillRect(a, Y + 120, 8, 70); for(let yy = Y + 122; yy < Y + 186; yy += 10){ g.fillStyle = '#e2ddd3'; g.fillRect(a - 1, yy, 10, 5); } });
  /* the drill yard: straw men in a row, targets, racks; a sparring ring (7) */
  if(L >= 7){ g.strokeStyle = '#8a5a2b'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(X + 132, Y + 160, 34, 14, 0, 0, TAU); g.stroke(); for(let k = 0; k < 10; k++){ const a = k / 10 * TAU; g.fillStyle = '#6b4426'; g.fillRect(X + 132 + Math.cos(a) * 34 - 1, Y + 160 + Math.sin(a) * 14 - 6, 2, 6); } }
  target(g, X + 30, Y + 136); target(g, X + 54, Y + 132);
  rack(g, X + 160, Y + 128);
  dummy(g, X + 26, Y + 176); dummy(g, X + 50, Y + 182);
  if(L >= 8) dummy(g, X + 74, Y + 176);
  rack(g, X + 160, Y + 194);
}
/* the market: its hall at the back, an arcade of shops; the square in front, stalls round a fountain under bunting; a
   clock tower (8), more stalls (9), gold domes (10) */
function marketBig(g, X, Y, w, h, L){
  shade(g, X + 104, Y + 96, 84, 7, 0.2);
  const hx = X + 26, hw = 148, hb = Y + 96, hh = 46;
  if(L >= 8){ const tx = X + 100; wall(g, tx - 13, hb - hh - 64, 26, 70, '#f3e9d4', '#cdb894'); g.strokeStyle = 'rgba(120,104,80,.25)'; g.lineWidth = 0.7; for(let yy = hb - hh + 4; yy > hb - hh - 64; yy -= 6){ g.beginPath(); g.moveTo(tx - 13, yy); g.lineTo(tx + 13, yy); g.stroke(); }
    ell(g, tx, hb - hh - 44, 8.5, 8.5, '#f8f4ea'); g.strokeStyle = '#5a4632'; g.lineWidth = 1.2; g.beginPath(); g.arc(tx, hb - hh - 44, 8.5, 0, TAU); g.moveTo(tx, hb - hh - 44); g.lineTo(tx, hb - hh - 50); g.moveTo(tx, hb - hh - 44); g.lineTo(tx + 4.5, hb - hh - 42); g.stroke();
    if(L >= 10) dome(g, tx, hb - hh - 64, 13, GOLD); else pyramid(g, tx, hb - hh - 64, 26, 26, RED); }
  wall(g, hx, hb - hh, hw, hh, '#f3e9d4', '#cdb894');
  for(let k = 0; k < 5; k++){ const ax = hx + 8 + k * 28.5, aw = 20;
    g.fillStyle = '#4a3a2c'; g.beginPath(); g.moveTo(ax, hb); g.lineTo(ax, hb - 22); g.arc(ax + aw / 2, hb - 22, aw / 2, Math.PI, 0); g.lineTo(ax + aw, hb); g.fill();
    g.fillStyle = '#8a5a2b'; g.fillRect(ax + 2, hb - 7, aw - 4, 7);
    ell(g, ax + 6, hb - 8, 2.8, 2.4, ['#d32f2c', '#f2a33a', '#7fbf4a', '#e8d04a', '#3f7d9a'][k]); ell(g, ax + 13, hb - 8.6, 2.8, 2.4, ['#e8d04a', '#7fbf4a', '#d32f2c', '#3f7d9a', '#f2a33a'][k]);
    for(let j = 0; j < 5; j++){ g.fillStyle = j % 2 ? '#f6eee0' : ['#c8463c', '#3c6fc4', '#e0a42a', '#3f9d5a', '#8e6cb0'][k]; g.fillRect(ax - 2 + j * 4.8, hb - 33, 4.8, 5); } }
  for(let k = 0; k < 6; k++) ell(g, hx + 14 + k * 24, hb - hh + 7, 2.6, 2.6, '#ffe9a8');
  gable(g, hx, hb - hh - 24, hw, 24, RED[1], RED[2], RED[0]);
  if(L >= 10){ dome(g, hx + 12, hb - hh - 2, 12, GOLD); dome(g, hx + hw - 12, hb - hh - 2, 12, GOLD); }
  bunting(g, X + 8, X + 192, Y + 104, 9);
  if(L >= 9){ stall(g, X + 8, Y + 128, '#8e6cb0', '#f6eee0', 'potion'); stall(g, X + 166, Y + 128, '#c8463c', '#f6eee0', 'fruit'); }
  if(L >= 7) fountain(g, X + 100, Y + 136, 1.7);
  stall(g, X + 14, Y + 166, '#c8463c', '#f6eee0', 'fruit');
  stall(g, X + 60, Y + 176, '#3c6fc4', '#f6eee0', 'potion');
  stall(g, X + 112, Y + 176, '#e0a42a', '#f6eee0', 'bread');
  stall(g, X + 158, Y + 166, '#3f9d5a', '#f6eee0', 'pots');
  barrel(g, X + 98, Y + 196); crate(g, X + 186, Y + 196);
}
/* the builders' yard: the workshop (timber, stone from 8), the great crane, what they are building in its scaffold;
   dressed stone, logs, a cart; a kiln (8), a second crane (9), its gold gear (10) */
function yardBig(g, X, Y, w, h, L){
  shade(g, X + 140, Y + 102, 52, 7, 0.22);
  /* the workshop */
  const wx = X + 94, ww = 94, wb = Y + 102, wh = 46, stone = L >= 8;
  wall(g, wx, wb - wh, ww, wh, stone ? '#e2ddd3' : '#c9a77a', stone ? '#a49e92' : '#8a6a44', !stone);
  if(stone){ g.strokeStyle = 'rgba(80,74,64,.3)'; g.lineWidth = 0.7; for(let yy = wb - 6; yy > wb - wh; yy -= 6){ g.beginPath(); g.moveTo(wx, yy); g.lineTo(wx + ww, yy); g.stroke(); } }
  g.fillStyle = '#2d241c'; g.beginPath(); g.moveTo(wx + 30, wb); g.lineTo(wx + 30, wb - 24); g.arc(wx + 47, wb - 24, 17, Math.PI, 0); g.lineTo(wx + 64, wb); g.fill();
  g.fillStyle = '#8a5a2b'; g.fillRect(wx + 22, wb - 30, 8, 30); g.fillRect(wx + 64, wb - 30, 8, 30);
  g.fillStyle = '#6b6258'; g.fillRect(wx + 36, wb - 14, 22, 3); g.fillStyle = '#9a9286'; g.fillRect(wx + 40, wb - 20, 6, 6); ell(g, wx + 52, wb - 16, 3, 2.4, '#ff9a3a');
  windowLit(g, wx + 8, wb - wh + 8, 8, 9); windowLit(g, wx + ww - 16, wb - wh + 8, 8, 9);
  gable(g, wx, wb - wh - 22, ww, 22, L >= 10 ? RED[1] : stone ? '#5f6f86' : '#8a5a2b', L >= 10 ? RED[2] : stone ? '#3c4a60' : '#5a3a1a', L >= 10 ? RED[0] : stone ? '#8798b4' : '#b98a5a');
  chimney(g, wx + ww - 22, wb - wh - 8, 14, true);
  if(L >= 10){ const gx = wx + ww / 2, gy = wb - wh - 11; g.fillStyle = GOLD[1]; for(let k = 0; k < 8; k++){ const a = k / 8 * TAU; g.save(); g.translate(gx + Math.cos(a) * 6.5, gy + Math.sin(a) * 6.5); g.rotate(a); g.fillRect(-1.6, -1.6, 3.2, 3.2); g.restore(); } ell(g, gx, gy, 6, 6, GOLD[1]); ell(g, gx, gy, 2.4, 2.4, GOLD[2]); }
  /* what they are building: an arch going up in its scaffold (the back left) */
  const ax = X + 16, ab = Y + 106;
  g.fillStyle = lin(g, ax, 0, ax + 60, 0, [[0, '#ece6d8'], [1, '#a69d8c']]); g.fillRect(ax + 6, ab - 50, 12, 50); g.fillRect(ax + 42, ab - 38, 12, 38);
  g.beginPath(); g.moveTo(ax + 6, ab - 50); g.arc(ax + 30, ab - 50, 24, Math.PI, Math.PI * 1.55); g.lineTo(ax + 30 + Math.cos(Math.PI * 1.55) * 12, ab - 50 + Math.sin(Math.PI * 1.55) * 12); g.arc(ax + 30, ab - 50, 12, Math.PI * 1.55, Math.PI, true); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(80,70,56,.35)'; g.lineWidth = 0.7; for(let yy = ab - 6; yy > ab - 50; yy -= 6){ g.beginPath(); g.moveTo(ax + 6, yy); g.lineTo(ax + 18, yy); g.stroke(); if(yy > ab - 38){ g.beginPath(); g.moveTo(ax + 42, yy); g.lineTo(ax + 54, yy); g.stroke(); } }
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 1.6; [ax, ax + 24, ax + 60].forEach(px=>{ g.beginPath(); g.moveTo(px, ab); g.lineTo(px, ab - 70); g.stroke(); }); [ab - 22, ab - 46, ab - 68].forEach(py=>{ g.beginPath(); g.moveTo(ax - 3, py); g.lineTo(ax + 63, py); g.stroke(); });
  g.fillStyle = '#b07a45'; g.fillRect(ax - 3, ab - 48, 66, 3); g.fillRect(ax - 3, ab - 24, 66, 3);
  /* the cranes, the kiln, the stone, the logs, the cart */
  if(L >= 9) crane(g, X + 132, Y + 156, 62);
  if(L >= 8){ const kx = X + 84, ky = Y + 140; shade(g, kx + 2, ky + 1, 13, 3, 0.3); g.fillStyle = lin(g, kx - 12, 0, kx + 12, 0, [[0, '#d07a5a'], [1, '#8a4a32']]); g.beginPath(); g.moveTo(kx - 12, ky); g.bezierCurveTo(kx - 12, ky - 22, kx + 12, ky - 22, kx + 12, ky); g.closePath(); g.fill(); g.fillStyle = '#2d1a10'; g.beginPath(); g.arc(kx, ky, 5, Math.PI, 0); g.fill(); ell(g, kx, ky - 1.5, 3.4, 2.4, '#ff9a3a'); ell(g, kx, ky - 1, 1.8, 1.2, '#ffe07a'); g.fillStyle = '#8a4a32'; g.fillRect(kx + 3, ky - 22, 5, 6); }
  crane(g, X + 44, Y + 172, 70 + 2 * (L - 6));
  blocks(g, [[X + 150, Y + 186], [X + 162, Y + 187], [X + 174, Y + 186], [X + 156, Y + 180], [X + 168, Y + 180], [X + 162, Y + 174]]);
  blocks(g, [[X + 110, Y + 132], [X + 122, Y + 133]]);
  logs(g, X + 78, Y + 192);
  cart(g, X + 140, Y + 152);
}
/* the granary: the windmill, the great barn, the silos (a third from 8), the kitchen garden; hay, sacks; a hay cart (7);
   stone silos (8); gilded (10) */
function granaryBig(g, X, Y, w, h, L){
  shade(g, X + 110, Y + 118, 84, 8, 0.22);
  const gold = L >= 10;
  windmill(g, X + 32, Y + 108, 1.3);
  if(L >= 8) roundTower(g, X + 182, Y + 96, 10, 54, 'cone', { roof:gold ? GOLD[1] : '#7a3a26', roofL:gold ? GOLD[0] : '#a5543a', roofD:gold ? GOLD[2] : '#4a1c10', tip:'#c9b48a', white:true });
  /* the barn */
  const bx = X + 64, bw = 86, bb = Y + 120, bh = 44;
  wall(g, bx, bb - bh, bw, bh, '#b8503a', '#7a2f22');
  g.strokeStyle = 'rgba(40,14,8,.35)'; g.lineWidth = 0.7; for(let k = 1; k < 18; k++){ g.beginPath(); g.moveTo(bx + k * 4.8, bb - bh); g.lineTo(bx + k * 4.8, bb); g.stroke(); }
  g.fillStyle = '#5a2a1a'; g.beginPath(); g.moveTo(bx - 6, bb - bh + 2); g.lineTo(bx + 6, bb - bh - 18); g.lineTo(bx + 24, bb - bh - 30); g.lineTo(bx + bw - 24, bb - bh - 30); g.lineTo(bx + bw - 6, bb - bh - 18); g.lineTo(bx + bw + 6, bb - bh + 2); g.closePath(); g.fill();
  g.fillStyle = '#7a3a26'; g.beginPath(); g.moveTo(bx - 6, bb - bh + 2); g.lineTo(bx + 6, bb - bh - 18); g.lineTo(bx + 24, bb - bh - 30); g.lineTo(bx + bw / 2, bb - bh - 30); g.lineTo(bx + bw / 2, bb - bh + 2); g.closePath(); g.fill();
  if(gold){ g.fillStyle = GOLD[1]; g.fillRect(bx + 24, bb - bh - 31.5, bw - 48, 2.4); }
  g.strokeStyle = '#f3e6d0'; g.lineWidth = 2; const dx = bx + bw / 2 - 14; g.strokeRect(dx, bb - 30, 28, 30); g.beginPath(); g.moveTo(dx, bb - 30); g.lineTo(dx + 28, bb); g.moveTo(dx + 28, bb - 30); g.lineTo(dx, bb); g.stroke();
  g.fillStyle = '#3a2418'; g.fillRect(bx + bw / 2 - 8, bb - bh + 2, 16, 10); g.fillStyle = '#e2c46a'; g.fillRect(bx + bw / 2 - 7, bb - bh + 7, 14, 5);
  windowLit(g, bx + 8, bb - bh + 10, 7, 8); windowLit(g, bx + bw - 15, bb - bh + 10, 7, 8);
  /* a weathervane */
  const vx = bx + bw / 2; g.fillStyle = gold ? GOLD[1] : '#5a3a1a'; g.fillRect(vx - 0.7, bb - bh - 44, 1.4, 14); g.beginPath(); g.moveTo(vx - 6, bb - bh - 42); g.lineTo(vx + 7, bb - bh - 42); g.lineTo(vx + 3, bb - bh - 45); g.closePath(); g.fill();
  /* the silos at the right */
  roundTower(g, X + 170, Y + 116, 12, 62, 'cone', { roof:gold ? GOLD[1] : '#7a3a26', roofL:gold ? GOLD[0] : '#a5543a', roofD:gold ? GOLD[2] : '#4a1c10', tip:'#c9b48a', white:L >= 8 });
  roundTower(g, X + 188, Y + 128, 9, 46, 'cone', { roof:gold ? GOLD[1] : '#7a3a26', roofL:gold ? GOLD[0] : '#a5543a', roofD:gold ? GOLD[2] : '#4a1c10', tip:'#c9b48a', white:L >= 8 });
  /* the kitchen garden: rows of cabbages, pumpkins along the end */
  const gx0 = X + 100, gx1 = X + 190, gy0 = Y + 144, gy1 = Y + 188;
  g.fillStyle = lin(g, 0, gy0, 0, gy1, [[0, '#8a5e34'], [1, '#6e4a28']]); rr(g, gx0, gy0, gx1 - gx0, gy1 - gy0, 5); g.fill();
  g.strokeStyle = 'rgba(70,110,45,.75)'; g.lineWidth = 2; rr(g, gx0, gy0, gx1 - gx0, gy1 - gy0, 5); g.stroke();
  for(let r = 0; r < 3; r++) for(let k = 0; k < 7; k++){ const cx = gx0 + 9 + k * 12.4 + (r % 2) * 3, cy = gy0 + 14 + r * 13; if(r === 2 && k % 2){ ell(g, cx, cy - 2.6, 4, 3, '#e07a26'); ell(g, cx - 0.8, cy - 3.2, 1.3, 2, '#f29a46'); continue; } ell(g, cx, cy - 2.4, 4, 3.4, '#4f9a3a'); ell(g, cx - 1, cy - 3.2, 2.4, 2, '#8bd06a'); }
  /* hay, sacks, the cart */
  hay(g, X + 22, Y + 160, 1.25); hay(g, X + 44, Y + 170, 1); hay(g, X + 14, Y + 186, 0.9);
  sacks(g, X + 66, Y + 190);
  if(L >= 7) cart(g, X + 62, Y + 150, 'hay');
}
/* the building's own ground on its lot: the market's square, the yard's sawdust, the granary's straw, the barracks' sand */
function ground(g, key, x0, y0, i){
  if(key === 'market') return stones(g, x0, y0, x0 + 100, y0 + 100, 8.5);
  if(key === 'yard') return earth(g, x0, y0, i * 7 + 1, '#c9ab7a', '#a98b5c', false);
  if(key === 'granary') return earth(g, x0, y0, i * 7 + 2, '#cdb27a', '#b09260', true);
  if(key === 'barracks') return earth(g, x0, y0, i * 7 + 4, '#d6c08e', '#bba26e', false);
  return lawn(g, x0, y0, i * 7 + 3, false);
}
/* the palace's gardens, on its ground round it: paths, beds of flowers in clipped hedges; a fountain at the back */
function garden(g, x0, y0, i){
  lawn(g, x0, y0, i * 7 + 3, false);
  g.fillStyle = '#e6dcc4'; g.fillRect(x0, y0 + 43, 100, 14); g.fillRect(x0 + 43, y0, 14, 100);
  const R = rng(i * 13 + 5);
  for(let k = 0; k < 40; k++){ const along = R() * 100, across = 43 + R() * 14; const [px, py] = k % 2 ? [x0 + along, y0 + across] : [x0 + across, y0 + along]; ell(g, px, py, 0.9, 0.7, R() < 0.5 ? 'rgba(150,130,96,.5)' : 'rgba(255,250,236,.7)'); }
  const cols = [['#e8414f', '#f2c23a', '#ffffff'], ['#c9a6f0', '#f08bb4', '#ffffff'], ['#f2c23a', '#ff9d6e', '#ffffff'], ['#3c6fc4', '#c9a6f0', '#ffffff']];
  [[6, 6], [60, 6], [6, 60], [60, 60]].forEach(([dx, dy], k)=> parterre(g, x0 + dx, y0 + dy, 34, 34, R, cols[(k + i) % 4]));
  ell(g, x0 + 50, y0 + 50, 12, 12, '#e6dcc4');
}
/* a lot kept for a building still on its small plot: fresh ground pegged out, a rope round the whole */
function allotted(g, x0, y0, i){
  lawn(g, x0, y0, i * 7 + 3, false);
  const R = rng(i * 17 + 3); for(let k = 0; k < 3; k++) ell(g, x0 + 20 + R() * 60, y0 + 20 + R() * 60, 12 + R() * 8, 6 + R() * 4, 'rgba(150,112,70,.18)', R());
}
function lotRope(g, x0, y0, x1, y1){
  const P = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  g.strokeStyle = 'rgba(255,250,232,.85)'; g.lineWidth = 1.1; g.setLineDash([5, 3]); g.beginPath(); P.forEach(([px, py], k)=> k ? g.lineTo(px, py - 4.5) : g.moveTo(px, py - 4.5)); g.closePath(); g.stroke(); g.setLineDash([]);
  const pegs = [...P, [(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1], [x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]];
  pegs.forEach(([px, py])=>{ shade(g, px + 1, py + 0.4, 2.4, 0.9, 0.3); g.fillStyle = '#8a5a2b'; g.fillRect(px - 1.3, py - 6.5, 2.6, 6.7); g.fillStyle = '#d8a060'; g.fillRect(px - 1.3, py - 6.5, 2.6, 1.5); });
}
/* the sign on a kept lot: what will stand there */
function lotSign(g, x, y, key){
  shade(g, x + 2, y + 0.5, 6, 1.6, 0.3);
  g.fillStyle = '#6b4426'; g.fillRect(x - 1.2, y - 22, 2.4, 22);
  g.fillStyle = lin(g, 0, y - 34, 0, y - 18, [[0, '#e2b77a'], [1, '#b98a52']]); rr(g, x - 13, y - 34, 26, 16, 2.5); g.fill();
  g.strokeStyle = '#6b4426'; g.lineWidth = 1; rr(g, x - 13, y - 34, 26, 16, 2.5); g.stroke();
  const cx = x, cy = y - 26;
  if(key === 'barracks'){ g.strokeStyle = '#4a4e58'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - 6, cy - 5); g.lineTo(cx + 6, cy + 5); g.moveTo(cx + 6, cy - 5); g.lineTo(cx - 6, cy + 5); g.stroke(); g.strokeStyle = '#8a5a2b'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 5, cy + 1.5); g.lineTo(cx - 2, cy + 4.5); g.moveTo(cx + 5, cy + 1.5); g.lineTo(cx + 2, cy + 4.5); g.stroke(); }
  else if(key === 'market'){ ell(g, cx, cy, 6, 6, GOLD[1]); g.strokeStyle = GOLD[2]; g.lineWidth = 0.8; g.beginPath(); g.arc(cx, cy, 6, 0, TAU); g.stroke(); g.fillStyle = '#b98a52'; g.fillRect(cx - 1.8, cy - 1.8, 3.6, 3.6); }
  else if(key === 'yard'){ g.save(); g.translate(cx, cy); g.rotate(-0.6); g.fillStyle = '#8a5a2b'; g.fillRect(-1, -2, 2, 10); g.fillStyle = '#5a5e68'; g.fillRect(-5, -6, 10, 4.5); g.restore(); }
  else { g.strokeStyle = '#a5741c'; g.lineWidth = 1; for(let k = -2; k <= 2; k++){ g.beginPath(); g.moveTo(cx + k * 0.8, cy + 6); g.lineTo(cx + k * 2.4, cy - 4); g.stroke(); ell(g, cx + k * 2.4, cy - 5, 1.2, 2.4, '#e8bf4a', k * 0.25); } }
}
const ART = { palace, barracks, market, yard, granary, house, tower };
const BIG = { palace:palaceBig, barracks:barracksBig, market:marketBig, yard:yardBig, granary:granaryBig };
/* each a little larger than its plot's middle, so that it reads at the board's size */
const GROW = { palace:1.04, barracks:1.08, market:1.06, yard:1.06, granary:1.08, house:1.12, tower:1.08 };

/* ---------- THE WALLS AND THE MOAT ---------- */
function moatFlat(g, G){
  const w = G.w, i0 = G.x0 - 4, i1 = G.x1 + 4, o0 = i0 - w, o1 = i1 + w;
  g.beginPath(); rrPath(g, o0, o0, o1 - o0, o1 - o0, 12 + w); rrPath(g, i0, i0, i1 - i0, i1 - i0, 10);
  g.fillStyle = lin(g, 0, o0, 0, o1, [[0, '#55a6e6'], [1, '#2f78b6']]); g.fill('evenodd');
  /* deeper along the walls' side */
  g.save(); g.beginPath(); rrPath(g, o0, o0, o1 - o0, o1 - o0, 12 + w); rrPath(g, i0, i0, i1 - i0, i1 - i0, 10); g.clip('evenodd');
  g.strokeStyle = 'rgba(20,60,110,.35)'; g.lineWidth = 7; g.beginPath(); rrPath(g, i0, i0, i1 - i0, i1 - i0, 10); g.stroke();
  g.restore();
  /* its banks: stone on the outside, earth at the walls */
  g.strokeStyle = '#a49d8f'; g.lineWidth = 3; g.beginPath(); rrPath(g, o0, o0, o1 - o0, o1 - o0, 12 + w); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); rrPath(g, o0 - 1.2, o0 - 1.2, o1 - o0 + 2.4, o1 - o0 + 2.4, 13 + w); g.stroke();
  g.strokeStyle = 'rgba(70,64,56,.6)'; g.lineWidth = 2; g.beginPath(); rrPath(g, i0, i0, i1 - i0, i1 - i0, 10); g.stroke();
  /* ripples and lily pads along each side */
  const R = rng(91 + G.M), at = (side, along, d)=> side === 0 ? [o0 + along, i0 - d] : side === 1 ? [o0 + along, i1 + d] : side === 2 ? [i0 - d, o0 + along] : [i1 + d, o0 + along];
  g.strokeStyle = 'rgba(225,245,255,.75)'; g.lineWidth = 1.2; g.beginPath();
  for(let k = 0; k < 64 * G.h / 2; k++){ const side = k % 4, [px, py] = at(side, 30 + R() * (o1 - o0 - 60), w * (0.25 + R() * 0.5));
    if(side < 2){ g.moveTo(px - 4, py); g.quadraticCurveTo(px, py - 1.5, px + 4, py); } else { g.moveTo(px, py - 4); g.quadraticCurveTo(px - 1.5, py, px, py + 4); } }
  g.stroke();
  for(let k = 0; k < 12 * G.h / 2; k++){ const side = k % 4, [px, py] = at(side, 40 + R() * (o1 - o0 - 80), w * (0.25 + R() * 0.5));
    if(side === 1 && Math.abs(px - (MID * 100 + 50)) < 26) continue;
    g.fillStyle = '#3f8a3a'; g.beginPath(); g.moveTo(px, py); g.arc(px, py, 3.6, 0.3, TAU - 0.3); g.closePath(); g.fill(); if(k % 3 === 0) ell(g, px + 1, py - 1, 1.3, 1.3, '#f6c6da'); }
}
/* the shade the walls cast on the ground (to the lower right) */
function wallShade(g, G){
  if(!G.W) return;
  g.fillStyle = 'rgba(20,28,12,.2)';
  g.fillRect(G.x0 + (G.T || 6) / 2, G.yN, 7, G.x1 - G.yN);
  g.fillRect(G.x1 + (G.T || 6) / 2, G.yN, 7, G.x1 + 4 - G.yN);
  g.fillRect(G.x0 + 5, G.yN, G.x1 - G.x0 - 5, 5);
}
/* the walls, as things standing on the board, each where it stands (drawn in turn with everything else). (4.74) Longer
   as the palace grows, with towers between the corners; white stone from 6, a gold band (8), gold domes (10) */
function wallItems(G){
  const { W, stone, H, T, yN, x0, x1 } = G;
  if(!W) return [];
  const out = [], gx = MID * 100 + 50, white = W >= 6, gold = W >= 8 ? GOLD[1] : null;
  const colTop = white ? '#f7f4ee' : ['', '', '#cfc8b8', '#d6d0c2', '#dfdace', '#e8e4da'][W] || '#cfc8b8';
  const colFace = white ? '#dcd6ca' : ['', '', '#aaa292', '#b2aa9b', '#bcb5a7', '#c6c0b3'][W] || '#aaa292';
  const walkC = white ? '#c9c2b4' : '#968e80';
  const roofs = W >= 10 ? { roof:GOLD[1], roofL:GOLD[0], roofD:GOLD[2], tip:GOLD[0] } : white ? { roof:BLUE[1], roofL:BLUE[0], roofD:BLUE[2], tip:GOLD[1] } : { roof:'#5f6f86', roofL:'#8798b4', roofD:'#3c4a60' };
  const tRoof = W >= 10 ? 'dome' : W >= 4 ? 'cone' : 'flat', tR = 12 + Math.min(W, 6) + (W >= 8 ? 2 : 0), tH = H + 10 + 2 * Math.min(W, 6) + 3 * Math.max(0, W - 6);
  const tOpt = Object.assign({ slits:2, flag:W >= 3 ? '#c8463c' : null, white, band:gold, domeC:GOLD }, roofs);
  const stakes = (g, a, b, y)=>{
    for(let x = a; x <= b; x += 6.5){ g.fillStyle = lin(g, x - 3, 0, x + 3, 0, [[0, '#b07b45'], [1, '#6b4422']]); g.fillRect(x - 3, y - H, 6, H); g.fillStyle = '#d0965a'; g.beginPath(); g.moveTo(x - 3, y - H); g.lineTo(x, y - H - 4); g.lineTo(x + 3, y - H); g.fill(); }
    g.fillStyle = '#5b3a1c'; g.fillRect(a - 3, y - H * 0.62, b - a + 6, 2); g.fillRect(a - 3, y - H * 0.26, b - a + 6, 2);
  };
  /* a run along the north or the south: its face, its walk on top, its battlements on the outer edge */
  const runH = (a, b, y, south)=> out.push({ y:y + (south ? 0.5 : 0), f:g=>{
    if(!stone) return stakes(g, a, b, y);
    g.fillStyle = lin(g, 0, y - H, 0, y, [[0, colTop], [1, colFace]]); g.fillRect(a, y - H, b - a, H);
    g.strokeStyle = 'rgba(70,60,48,.3)'; g.lineWidth = 0.8;
    for(let r = 1; r * 5 < H; r++){ g.beginPath(); g.moveTo(a, y - r * 5); g.lineTo(b, y - r * 5); g.stroke(); for(let x = a + (r % 2) * 5; x < b; x += 10){ g.beginPath(); g.moveTo(x, y - r * 5); g.lineTo(x, y - r * 5 + 5); g.stroke(); } }
    g.fillStyle = walkC; g.fillRect(a, y - H - T, b - a, T);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(a, y - H - T, b - a, 2);
    if(gold && south){ g.fillStyle = gold; g.fillRect(a, y - H, b - a, 1.8); }
    const edge = south ? y - H : y - H - T;
    for(let x = a + 2; x < b - 4; x += 11){ g.fillStyle = colTop; g.fillRect(x, edge - 5, 6, 5); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 4.5, edge - 5, 1.5, 5); if(gold && W >= 9){ g.fillStyle = gold; g.fillRect(x, edge - 5.6, 6, 1); } }
    if(W >= 5 && south) for(let x = a + 40; x < b - 30; x += 90){ g.fillStyle = W >= 8 ? '#3c6fc4' : '#c8463c'; g.fillRect(x, y - H + 1, 7, H - 2); g.fillStyle = '#e0b84a'; g.fillRect(x, y - H + 1, 7, 1.6); }
  } });
  /* a run down the west or the east: its walk seen from above, battlements on its outer edge */
  const runV = (x, west)=>{ for(let y = Math.floor(yN / 100) * 100; y < x1; y += 100) out.push({ y:Math.min(x1, y + 100) - 1, f:g=>{
    const ya = Math.max(y, yN), yb = Math.min(x1, y + 100);
    if(!stone){ for(let yy = ya; yy < yb; yy += 6.5){ g.fillStyle = lin(g, x - 3, 0, x + 3, 0, [[0, '#b07b45'], [1, '#6b4422']]); g.fillRect(x - 3, yy - H + 4, 6, H - 2); g.fillStyle = '#d0965a'; g.beginPath(); g.moveTo(x - 3, yy - H + 4); g.lineTo(x, yy - H); g.lineTo(x + 3, yy - H + 4); g.fill(); } return; }
    g.fillStyle = walkC; g.fillRect(x - T / 2, ya - H, T, yb - ya);
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x - T / 2, ya - H, 2, yb - ya);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + T / 2 - 1.5, ya - H, 1.5, yb - ya);
    const ex = west ? x - T / 2 - 1 : x + T / 2 - 5;
    for(let yy = ya + 2; yy < yb - 4; yy += 11){ g.fillStyle = colTop; g.fillRect(ex, yy - H - 4, 6, 8); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(ex, yy - H + 2.5, 6, 1.5); }
  } }); };
  runH(x0, x1, yN, false);
  runV(x0, true); runV(x1, false);
  runH(x0, gx - 26, x1, true); runH(gx + 26, x1, x1, true);
  if(stone){
    const tw = (tx, ty)=> out.push({ y:ty + 2, f:g=> roundTower(g, tx, ty, tR, tH, tRoof, tOpt) });
    [[x0, yN + 2], [x1, yN + 2], [x0, x1 + 3], [x1, x1 + 3]].forEach(([tx, ty])=> tw(tx, ty));
    /* towers between the corners, no more than about four plots apart */
    const n = Math.ceil((x1 - x0) / 420);
    for(let k = 1; k < n; k++){ const t = x0 + (x1 - x0) * k / n; tw(t, yN + 2); if(Math.abs(t - gx) > 90) tw(t, x1 + 3); }
    const m = Math.ceil((x1 - yN) / 420);
    for(let k = 1; k < m; k++){ const t = yN + (x1 - yN) * k / m; tw(x0, t); tw(x1, t); }
  }
  else [[x0, yN], [x1, yN], [x0, x1], [x1, x1]].forEach(([tx, ty])=> out.push({ y:ty + 1, f:g=>{ g.fillStyle = lin(g, tx - 4.5, 0, tx + 4.5, 0, [[0, '#b07b45'], [1, '#6b4422']]); g.fillRect(tx - 4.5, ty - H - 6, 9, H + 6); g.fillStyle = '#d0965a'; g.beginPath(); g.moveTo(tx - 4.5, ty - H - 6); g.lineTo(tx, ty - H - 11); g.lineTo(tx + 4.5, ty - H - 6); g.fill(); } }));
  out.push({ y:x1 + 4, f:g=>{
    if(!stone){ g.fillStyle = '#6b4422'; g.fillRect(gx - 30, x1 - H - 8, 6, H + 8); g.fillRect(gx + 24, x1 - H - 8, 6, H + 8); g.fillStyle = '#8a5a2b'; g.fillRect(gx - 24, x1 - H + 2, 48, H - 2); g.strokeStyle = 'rgba(40,24,10,.6)'; g.lineWidth = 1; for(let k = 1; k < 6; k++){ g.beginPath(); g.moveTo(gx - 24 + k * 8, x1 - H + 2); g.lineTo(gx - 24 + k * 8, x1); g.stroke(); } g.beginPath(); g.moveTo(gx - 24, x1 - H + 3); g.lineTo(gx + 24, x1 - 1); g.stroke(); return; }
    /* the gatehouse: two drum towers, the arch between, its portcullis */
    const gr = 11 + (W >= 6 ? 2 : 0), gh = H + 14 + 2 * Math.max(0, W - 5);
    roundTower(g, gx - 32, x1 + 4, gr, gh, W >= 10 ? 'dome' : W >= 3 ? 'cone' : 'flat', Object.assign({}, tOpt, { slits:0 }));
    roundTower(g, gx + 32, x1 + 4, gr, gh, W >= 10 ? 'dome' : W >= 3 ? 'cone' : 'flat', Object.assign({}, tOpt, { slits:0 }));
    g.fillStyle = lin(g, 0, x1 - H - 8, 0, x1, [[0, colTop], [1, colFace]]); g.fillRect(gx - 22, x1 - H - 8, 44, H + 8);
    for(let x = gx - 20; x < gx + 18; x += 9){ g.fillStyle = colTop; g.fillRect(x, x1 - H - 13, 5, 5); }
    g.fillStyle = '#2a221a'; g.beginPath(); g.moveTo(gx - 11, x1); g.lineTo(gx - 11, x1 - H + 5); g.arc(gx, x1 - H + 5, 11, Math.PI, 0); g.lineTo(gx + 11, x1); g.fill();
    g.strokeStyle = W >= 8 ? '#a5741c' : '#5a5046'; g.lineWidth = 1.1; for(let k = 1; k < 6; k++){ g.beginPath(); g.moveTo(gx - 11 + k * 3.7, x1 - H - 2); g.lineTo(gx - 11 + k * 3.7, x1 - 4); g.stroke(); } for(let k = 1; k < 4; k++){ g.beginPath(); g.moveTo(gx - 11, x1 - 4 - k * (H / 4)); g.lineTo(gx + 11, x1 - 4 - k * (H / 4)); g.stroke(); }
    if(W >= 3){ g.fillStyle = '#3c6fc4'; g.beginPath(); g.moveTo(gx - 6, x1 - H - 7); g.lineTo(gx + 6, x1 - H - 7); g.lineTo(gx + 6, x1 - H); g.lineTo(gx, x1 - H + 4); g.lineTo(gx - 6, x1 - H); g.closePath(); g.fill(); ell(g, gx, x1 - H - 2.5, 2.2, 2.2, '#e0b84a'); }
    if(W >= 8) crown(g, gx, x1 - H - 14, 1);
  } });
  /* the bridge over the moat */
  if(G.M) out.push({ y:x1 + 4 + G.w, f:g=>{
    const y0 = x1 - 1, y1 = x1 + 8 + G.w;
    shade(g, gx + 2, y1 - 1, 15, 2.5, 0.3);
    g.fillStyle = lin(g, gx - 14, 0, gx + 14, 0, [[0, '#a8743f'], [1, '#7a4f28']]); g.fillRect(gx - 13, y0, 26, y1 - y0);
    g.strokeStyle = 'rgba(40,24,10,.45)'; g.lineWidth = 0.8; for(let yy = y0 + 4; yy < y1; yy += 4){ g.beginPath(); g.moveTo(gx - 13, yy); g.lineTo(gx + 13, yy); g.stroke(); }
    g.fillStyle = '#5a3a1e'; g.fillRect(gx - 16, y0 + 2, 3, y1 - y0 - 2); g.fillRect(gx + 13, y0 + 2, 3, y1 - y0 - 2);
    [gx - 16, gx + 13].forEach(px=>{ g.fillStyle = '#4a2f18'; g.fillRect(px - 0.5, y1 - 7, 4, 7); g.fillRect(px - 0.5, y0 + 2, 4, 5); });
  } });
  return out;
}
/* (4.74) the army on the walls: on the walk of stone walls, inside the palisade; a gold helmet from walls 8 */
function armyItems(G, n){
  if(!G.W || !n) return [];
  const out = [], gx = MID * 100 + 50, s = 0.95, gold = G.W >= 8, per = Math.min(n, 48), len = G.x1 - G.x0, side = G.x1 - G.yN;
  const nN = Math.ceil(per * 0.3), nS = Math.ceil((per - nN) * 0.45), nW = Math.floor((per - nN - nS) / 2), nE = per - nN - nS - nW;
  const walk = G.H + G.T / 2 - 2;
  for(let k = 0; k < nN; k++){ const x = G.x0 + 34 + (len - 68) * (k + 0.5) / nN; out.push(G.stone ? { y:G.yN + 0.6, f:g=> soldier(g, x, G.yN - walk, s, gold) } : { y:G.yN + 10, f:g=> soldier(g, x, G.yN + 10, s, gold) }); }
  for(let k = 0; k < nS; k++){ let x = G.x0 + 34 + (len - 68) * (k + 0.5) / nS; if(Math.abs(x - gx) < 50) x += x < gx ? -50 : 50; out.push(G.stone ? { y:G.x1 + 0.6, f:g=> soldier(g, x, G.x1 - walk, s, gold) } : { y:G.x1 - 20, f:g=> soldier(g, x, G.x1 - 20, s, gold) }); }
  [[nW, G.x0, 12], [nE, G.x1, -12]].forEach(([m, x, inn])=>{ for(let k = 0; k < m; k++){ const t = G.yN + 34 + (side - 68) * (k + 0.5) / m, seg = Math.min(G.x1, Math.floor(t / 100) * 100 + 100) - 1;
    out.push(G.stone ? { y:seg + 0.4, f:g=> soldier(g, x, t - G.H + 2, s, gold) } : { y:t, f:g=> soldier(g, x + inn, t, s, gold) }); } });
  return out;
}

/* ---------- (4.74) WHO WORKS WHERE: the designer's monsters, drawn small on the board ----------
   "construction yard: please use the strongman evolution line as workers. barracks: please use the chestnut knight
   evolution line as workers. towers: please use advisor evolution line as mages. market: please use the fairybunny
   evolution line as staff granary: please use the choux fairy and cream fairy lines. castle: please use mantis evolution
   line as servants, along with kingdom steward as the butler." The heir (the partner, in its form) on the palace steps.
   More of them as each grows, and further along their lines. Their pictures load once (the board is painted again when
   they have). */
const CREW = {
  yard:[['strongman', 'strongman1', 'strongman2']],
  barracks:[['chestnut_knight', 'chestnut_knight1', 'chestnut_knight2']],
  tower:[['fairybird', 'fairybird1', 'fairybird1_c']],
  market:[['fairybunny', 'fairybunny1']],
  granary:[['choux_fairy', 'choux_fairy1'], ['cream_fairy', 'cream_fairy1']],
  palace:[['mantis', 'mantis1']],
};
/* the part of each picture its creature fills (the rest is clear); others are measured when they load */
const BOX = { strongman:[24, 27, 71, 68], strongman1:[17, 1, 83, 72], strongman2:[1, 15, 83, 80], chestnut_knight:[31, 24, 65, 71], chestnut_knight1:[20, 23, 75, 73], chestnut_knight2:[3, 9, 93, 86],
  fairybird:[13, 30, 83, 66], fairybird1:[19, 16, 77, 79], fairybird1_c:[2, 2, 94, 94], fairybunny:[21, 19, 66, 71], fairybunny1:[26, 16, 70, 79], choux_fairy:[30, 31, 66, 65], choux_fairy1:[25, 22, 70, 73],
  cream_fairy:[26, 28, 64, 65], cream_fairy1:[28, 20, 67, 75], mantis:[34, 25, 62, 70], mantis1:[27, 13, 73, 81], kingdom_steward:[27, 23, 68, 72], grandpa:[20, 5, 62, 77] };
const SPR = {};
let sprN = 0, sprT = 0;
const sprName = url=> url.replace(/^.*\//, '').replace(/(_front)?\.png$/, '');
function measure(img){
  try { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; let a = c.width, b = c.height, e = -1, f = -1;
    for(let y = 0; y < c.height; y++) for(let q = 0; q < c.width; q++) if(d[(y * c.width + q) * 4 + 3] > 24){ if(q < a) a = q; if(q > e) e = q; if(y < b) b = y; if(y > f) f = y; }
    if(e >= a && f >= b) return [a, b, e + 1, f + 1];
  } catch(err){ /* a picture from another origin: guessed */ }
  const w = img.naturalWidth || 96, h = img.naturalHeight || 96; return [w * 0.24, h * 0.2, w * 0.76, h * 0.8];
}
/* a picture, ready (or null: asked for, and the board painted again once it comes); its stand-in if it is missing */
function pic(url, alt){
  let s = SPR[url];
  if(!s){
    s = SPR[url] = { img:new Image(), ok:false, box:null, tries:0 };
    s.img.onload = ()=>{ const n = sprName(s.img.src); s.box = BOX[n] || measure(s.img); s.ok = true; sprN++; clearTimeout(sprT); sprT = setTimeout(()=>{ if(typeof kcPaintBoard === 'function') kcPaintBoard(); }, 80); };
    s.img.onerror = ()=>{ if(alt && !s.tries++) s.img.src = alt; else s.dead = true; };
    s.img.src = url;
  }
  return s.ok ? s : null;
}
const monUrl = k=> 'assets/mon/' + k + '_front.png';
function crewPic(k){ return k === 'steward' ? pic(monUrl('kingdom_steward'), 'assets/npc/grandpa.png') : pic(monUrl(k)); }
function heirPic(){
  const K = CUR.K, P = K && K.partner;
  if(!P) return null;
  const sex = typeof kdGender === 'function' ? kdGender(K) : 'male', F = typeof KD_FORMS !== 'undefined' && KD_FORMS[P.form];
  return pic(`assets/mon/kingdom_${P.form}_${sex}_front.png`, F ? monUrl(F.standIn) : null);
}
/* one of them, drawn standing at (x, y): its height in the board's units; turned to face left */
function figure(g, s, x, y, ht, flip){
  if(!s) return;
  const [a, b, c, d] = s.box, bw = c - a, bh = d - b, sc = ht / bh, dw = bw * sc;
  shade(g, x, y + 0.5, Math.max(4, dw * 0.34), 2.2, 0.3);
  g.save(); g.translate(x, y); if(flip) g.scale(-1, 1);
  g.imageSmoothingEnabled = true; try { g.imageSmoothingQuality = 'high'; } catch(e){}
  g.drawImage(s.img, a, b, bw, bh, -dw / 2, -ht, dw, ht);
  g.restore();
}
/* where they stand ([x, y (feet), facing left], in the plot or on the lot), and how many by the level */
const SPOTS = {
  1:{ barracks:[[30, 97, 0], [46, 99, 1]], market:[[21, 97, 0], [64, 98, 1]], yard:[[20, 97, 0], [86, 99, 1]], granary:[[34, 98, 0], [57, 98, 1]], tower:[[71, 97, 1]] },
  2:{ barracks:[[40, 192, 0], [96, 186, 1], [126, 168, 0], [150, 170, 1]], market:[[30, 188, 0], [80, 196, 1], [128, 197, 0], [176, 188, 1]],
      yard:[[72, 184, 0], [118, 142, 1], [184, 196, 1], [30, 124, 0]], granary:[[48, 193, 0], [92, 196, 1], [124, 197, 0], [172, 196, 1]] },
};
const stageOf = (line, L)=> line.length >= 3 ? (L >= 7 ? 2 : L >= 4 ? 1 : 0) : (L >= 5 ? 1 : 0);
function crewItems(key, L, X, Y, w, h){
  const out = [], key0 = (Y + h * 100) - 12 + 0.5, lines = CREW[key];
  if(!lines || !L) return out;
  if(key === 'palace') return palaceCrew(L, X, Y, w, h);
  const spots = (w > 1 ? SPOTS[2] : SPOTS[1])[key] || [], n = key === 'tower' ? 1 : w > 1 ? 3 + (L >= 8 ? 1 : 0) : 1 + (L >= 3 ? 1 : 0);
  for(let k = 0; k < Math.min(n, spots.length); k++){
    const line = lines[k % lines.length], st = Math.max(0, stageOf(line, L) - (k % 2)), [dx, dy, flip] = spots[k], ht = [26, 30, 34][st];
    out.push({ y:key0, tag:'crew', f:g=> figure(g, crewPic(line[st]), X + dx, Y + dy, ht, flip) });
  }
  return out;
}
/* the palace's: the steward at the door, the heir at the foot of the steps, the mantis servants */
function palaceCrew(L, X, Y, w, h){
  const out = [], key0 = (Y + h * 100) - 12 + 0.5, line = CREW.palace[0], st = stageOf(line, L);
  let spots;
  if(w === 1) spots = { steward:[34, 97, 0], heir:[63, 98, 1], hs:32, serve:[[86, 99, 1], [14, 99, 0]].slice(0, L >= 4 ? 2 : L >= 2 ? 1 : 0) };
  else {
    const W = w * 100, cx = W / 2, base = h * 100 - 8, fb = w >= 4 ? base - 78 : base;
    spots = w >= 4 ? { steward:[cx - 28, fb - 1, 0], heir:[cx + 4, fb, 1], hs:42, serve:[[cx - 58, base + 3, 0], [cx + 62, base + 4, 1], [cx - 128, base + 2, 0], [cx + 130, base + 3, 1]] }
                   : { steward:[cx - 34, fb + 4, 0], heir:[cx + 2, fb + 6, 1], hs:38, serve:[[cx + 36, fb + 5, 1], [cx - 64, fb + 3, 0], [cx + 66, fb + 4, 1]].slice(0, w >= 3 ? 3 : 2) };
  }
  out.push({ y:key0, tag:'crew', f:g=> figure(g, crewPic('steward'), X + spots.steward[0], Y + spots.steward[1], 30, spots.steward[2]) });
  spots.serve.forEach(([dx, dy, flip], k)=>{ const s2 = Math.max(0, st - (k % 2)); out.push({ y:key0, tag:'crew', f:g=> figure(g, crewPic(line[s2]), X + dx, Y + dy, [26, 30][s2], flip) }); });
  out.push({ y:key0 + 0.1, tag:'crew', f:g=> figure(g, heirPic(), X + spots.heir[0], Y + spots.heir[1], spots.hs, spots.heir[2]) });
  return out;
}
/* the pictures asked for early (while the game starts), so that the board has them when it is first drawn */
function preload(K){
  Object.values(CREW).forEach(ls=> ls.forEach(l=> l.forEach(k=> crewPic(k)))); crewPic('steward');
  const P = K && K.partner;
  if(P && typeof KD_FORM_ORDER !== 'undefined'){ const sex = typeof kdGender === 'function' ? kdGender(K) : 'male'; KD_FORM_ORDER.forEach(f=> pic(`assets/mon/kingdom_${f}_${sex}_front.png`, KD_FORMS[f] ? monUrl(KD_FORMS[f].standIn) : null)); }
}
if(typeof window !== 'undefined') setTimeout(()=>{ try { preload(); } catch(e){} }, 1500);

/* ---------- THE WHOLE BOARD ---------- */
/* a garden plot's own standing things: a fountain along the back row, clipped yew in the others */
function gardenItems(x0, y0, y){
  const back = typeof KC_PALACE_GROUND !== 'undefined' && y === KC_PALACE_GROUND[1];
  return [{ y:y0 + 56, f:g=> back ? fountain(g, x0 + 50, y0 + 55, 1.3) : topiary(g, x0 + 50, y0 + 57, 1.1) }];
}
function render(K, S, into){
  const t0 = performance.now(), C = K.city, G = geo(C);
  CUR = { K, C, G, h:G.h, P:G.Pl, k:S / U };
  const cv = into && into.width === S ? into : document.createElement('canvas');
  if(cv !== into){ cv.width = cv.height = S; }
  const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S, S); g.scale(S / U, S / U);
  const ctx = { path:trackRows(C, G).map(y=> y * N + MID) }, T = {}, mark = k=>{ const t = performance.now(); T[k] = Math.round(t - (T._ || t0)); T._ = t; };
  meadow(g, C); mark('meadow');
  forestFloor(g, C); mark('floor');
  C.cells.forEach((c, i)=>{ if(c.k === 'wild' && glade(i, ctx)){ const [x, y] = XY(i); gladeFloor(g, i, free(x, y, G)); } });
  /* the road from the gate: up the empty plots of the middle column, from the south wall */
  const road = new Set();
  if(G.W) for(let y = MID + G.h; y > MID; y--){ const i = y * N + MID; if(C.cells[i].k !== 'clear') break; road.add(i); }
  /* the ground of each plot: lawns, yards and the market's square in the city, fields and the cleared outside */
  C.cells.forEach((c, i)=>{
    const [x, y] = XY(i);
    if(c.k === 'wild') return;
    if(inside(x, y)) lot(g, x, y, c, i, road.has(i));
    else if(c.k === 'field') fieldGround(g, free(x, y, G), c, i);
    else clearedFlat(g, free(x, y, G), i);
  });
  /* the lots kept for main buildings still on their small plots, roped round */
  if(C.plan && typeof KC_LOTS !== 'undefined') Object.entries(KC_LOTS).forEach(([key, [lx, ly]])=>{ if(lvOf(C, key) < 6) lotRope(g, lx * 100 + 10, ly * 100 + 12, lx * 100 + 190, ly * 100 + 192); });
  mark('ground');
  streets(g, C, G, road); mark('streets');
  if(G.M) moatFlat(g, G);
  track(g, C, G);
  wallShade(g, G);
  /* everything that stands, back to front */
  const items = [];
  C.cells.forEach((c, i)=>{
    const [x, y] = XY(i), x0 = x * 100, y0 = y * 100;
    if(c.k === 'wild'){ forestItems(i, free(x, y, G), ctx).forEach(o=> items.push(o)); return; }
    if(c.k === 'field'){ const F = free(x, y, G); items.push({ y:(F[1] + F[3]) / 2, f:g2=> fieldCrops(g2, F, c, i), seed:i }); return; }
    if(c.k === 'clear'){ if(!inside(x, y)){ const F = free(x, y, G), R = rng(i * 7 + 1), on = ctx.path.includes(i); for(let k = 0; k < 2; k++){ const sy = F[1] + 30 + R() * (F[3] - F[1] - 45); let sx = F[0] + 20 + R() * (F[2] - F[0] - 40); if(on && Math.abs(sx - trackX(sy)) < 18) sx = trackX(sy) + (k ? 26 : -26); const r = 4.5 + R() * 3; items.push({ y:sy, f:g2=> stump(g2, sx, sy, r) }); } } return; }
    if(c.k === 'part'){
      if(c.of === 'palace'){ if(!inRect(x, y, palFoot(G.Pl))) gardenItems(x0, y0, y).forEach(o=> items.push(o)); return; }
      const lt = typeof KC_LOTS !== 'undefined' && KC_LOTS[c.of];
      if(lt && lvOf(C, c.of) < 6 && x === lt[0] + 1 && y === lt[1]) items.push({ y:y0 + 74, f:g2=> lotSign(g2, x0 + 52, y0 + 74, c.of) });
      return;
    }
    const art = ART[c.k];
    if(!art) return;
    /* (4.74) a main building filling its lot, the palace its ground: drawn whole */
    if(C.plan && BIG[c.k] && (c.lv || 0) >= 6 && typeof kcSeatOf === 'function' && kcSeatOf(C, c.k) === i){
      const [fx, fy, fw, fh] = kcFoot(C, c.k);
      items.push({ y:(fy + fh) * 100 - 12, seed:i * 31 + 9, tag:'bld', f:(g2, R)=> BIG[c.k](g2, fx * 100, fy * 100, fw, fh, c.lv, R) });
      crewItems(c.k, c.lv, fx * 100, fy * 100, fw, fh).forEach(o=> items.push(o));
      return;
    }
    const L = BIG[c.k] ? Math.min(c.lv || 0, 5) : (c.lv || 0);
    items.push({ y:y0 + 88, seed:i * 31 + 9, tag:'bld', f:(g2, R)=>{
      if(!L) return ruin(g2, x0, y0, c.k, R);
      const s = GROW[c.k] || 1;
      g2.save(); g2.translate(x0 + 50, y0 + 90); g2.scale(s, s); g2.translate(-(x0 + 50), -(y0 + 90));
      art(g2, x0, y0, L);
      g2.restore();
    } });
    crewItems(c.k, L, x0, y0, 1, 1).forEach(o=> items.push(o));
  });
  wallItems(G).forEach(o=>{ o.tag = 'wall'; items.push(o); });
  armyItems(G, C.army || 0).forEach(o=>{ o.tag = 'wall'; items.push(o); });
  items.sort((a, b)=> a.y - b.y); mark('list');
  items.forEach(o=>{ const t = performance.now(); try { o.f(g, rng((o.seed || Math.round(o.y * 7)) + 101)); } catch(e){ console.error('kingdom art:', e); } const tag = o.tree ? 'trees' : o.tag || 'other'; T[tag] = (T[tag] || 0) + performance.now() - t; });
  ['trees', 'other', 'bld', 'wall', 'crew'].forEach(k=>{ if(T[k]) T[k] = Math.round(T[k]); }); mark('items');
  /* light: warm from the upper left, the edges of the world in shade */
  const cm = MID * 100 + 50, v = g.createRadialGradient(cm - 70, cm - 110, U * 0.24, cm, cm, U * 0.78);
  v.addColorStop(0, 'rgba(255,240,200,.06)'); v.addColorStop(0.6, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(8,18,6,.42)');
  g.fillStyle = v; g.fillRect(0, 0, U, U);
  info.ms = Math.round(performance.now() - t0); info.walls = G.W; info.moat = G.M; info.items = items.length; info.size = S; info.sprites = sprN; delete T._; info.t = T;
  return cv;
}
const info = { ms:0, walls:0, moat:0, items:0, size:0, renders:0, sprites:0 };
let kept = null;
function sig(K){
  const C = K.city, P = K.partner, sex = typeof kdGender === 'function' ? kdGender(K) : '';
  return C.cells.map(c=> (c.k === 'part' ? 'p' + c.of.slice(0, 2) : c.k.slice(0, 2) + (c.lv || 0)) + (c.irr ? 'i' : '') + (c.fer ? 'f' : '')).join('')
    + '|' + C.walls + '|' + C.moat + '|' + (C.plan || 0) + '|' + (C.army || 0) + '|' + (P ? P.form + sex : '') + '|' + sprN;
}
/* paint the board into `canvas` (its own size, its screen's sharpness), from what is kept if nothing has changed */
function paint(canvas, K){
  const css = canvas.clientWidth || 600, dpr = Math.min(2, window.devicePixelRatio || 1), S = Math.max(300, Math.min(2048, Math.round(css * dpr)));
  const key = sig(K) + '@' + S;
  if(!kept || kept.key !== key){ kept = { key, cv:render(K, S, kept && kept.cv) }; info.renders++; }
  if(canvas.width !== S){ canvas.width = S; canvas.height = S; }
  canvas.getContext('2d').drawImage(kept.cv, 0, 0);
}
return { paint, info, render, geo, free, trackRows, pic, figure, preload };
})();
