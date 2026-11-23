/* ==========================================================
   47-kingdom-art.js — (4.73) THE CITY, DRAWN. The designer: "Please greatly improve the look of the city and surrounding
   forest for the math kingdom."
   The board (46-kingdom-city.js) painted on a canvas as the castle's grounds are: seen from above and a little from the
   south, lit from the upper left, shade falling to the lower right.
   · the forest: oaks in clusters of leaves, firs in drooping tiers, birches; bushes, ferns, rocks, mushrooms; its floor
     dark with moss; trees leaning over their neighbours, drawn back to front;
   · cleared land outside the walls: meadow, the stumps of the burning; fields of sprouts, then wheat, cabbages or
     pumpkins, gold when ripe; watered ones with a stone channel, fertile ones lush, with flowers;
   · inside, plots of lawn with cobbled streets between them: an empty plot pegged out for building; the market's
     square cobbled, the builders' yard sawdust, the granary's straw;
   · the buildings, each its own and growing with its level (the palace's towers and spire, the healer's herb garden and
     well, the market's stalls, bunting and fountain, the yard's crane, the granary's barn, silo and windmill, cottages
     to a manor, towers); ruins (broken walls, a fallen roof, ivy) until repaired;
   · the walls: a palisade of stakes, then stone with battlements, corner towers and a gatehouse; the moat all round,
     its bridge; the plots outside kept clear of it.
   Drawn once for each state of the city and size (KC_ART.paint keeps it), so it costs nothing while you look.
   ========================================================== */
const KC_ART = (function(){
const TAU = Math.PI * 2;
/* a seeded dice (mulberry32): the same picture every time for the same plot */
function rng(seed){ let s = seed >>> 0; return ()=>{ s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* the same number for the same two (a cobble's row and column: neighbouring streets meet without a seam) */
function hash(a, b){ let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
const N = 9;
const XY = i=> [i % N, Math.floor(i / N)];
const inside = (x, y)=> x >= 2 && x <= 6 && y >= 2 && y <= 6;
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
  const W = C.walls || 0, M = C.moat || 0, stone = W >= 2;
  const H = !W ? 0 : stone ? 10 + W : 16, T = stone ? 11 : 0, P = !W ? 0 : stone ? H + T + 5 : H + 4;
  const w = M ? 14 + 3 * M : 0;
  return { W, M, stone, H, T, P, yN:200 + P, w, lo:M ? 190 - w : W ? 194 : 200, hi:M ? 710 + w : W ? 708 : 700 };
}
/* the part of a plot outside that is free to grow or build on */
function free(x, y, G){
  let x0 = x * 100, y0 = y * 100, x1 = x0 + 100, y1 = y0 + 100;
  if(!inside(x, y)){
    if(x >= 1 && x <= 7){ if(y === 1) y1 = Math.min(y1, G.lo); if(y === 7) y0 = Math.max(y0, G.hi); }
    if(y >= 1 && y <= 7){ if(x === 1) x1 = Math.min(x1, G.lo); if(x === 7) x0 = Math.max(x0, G.hi); }
  }
  return [x0, y0, x1, y1];
}

/* ---------- THE GROUND ---------- */
function meadow(g){
  g.fillStyle = lin(g, 0, 0, 900, 900, [[0, '#72ad4e'], [0.55, '#5f9a43'], [1, '#4d8638']]);
  g.fillRect(0, 0, 900, 900);
  const R = rng(11);
  for(let i = 0; i < 160; i++){ g.fillStyle = R() < 0.5 ? `rgba(38,74,28,${0.05 + R() * 0.08})` : `rgba(160,205,105,${0.05 + R() * 0.07})`; g.beginPath(); g.ellipse(R() * 900, R() * 900, 18 + R() * 60, 10 + R() * 34, R() * TAU, 0, TAU); g.fill(); }
  /* blades, batched by colour */
  ['#5a9640', '#7ab656', '#4a8436', '#8ec865', '#679f49'].forEach(c=>{
    g.strokeStyle = c; g.lineWidth = 1.2; g.beginPath();
    for(let i = 0; i < 1100; i++){ const x = R() * 900, y = R() * 900, h = 3 + R() * 4.5; g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3.2, y - h); }
    g.stroke();
  });
}
/* the forest floor, dark with moss, soft at its edge */
function forestFloor(g, C){
  C.cells.forEach((c, i)=>{
    if(c.k !== 'wild') return;
    const [x, y] = XY(i), cx = x * 100 + 50, cy = y * 100 + 50;
    const gr = g.createRadialGradient(cx, cy, 20, cx, cy, 92);
    gr.addColorStop(0, 'rgba(30,58,24,.92)'); gr.addColorStop(0.62, 'rgba(34,64,26,.78)'); gr.addColorStop(1, 'rgba(40,72,30,0)');
    g.fillStyle = gr; g.fillRect(cx - 95, cy - 95, 190, 190);
  });
  const R = rng(23);
  C.cells.forEach((c, i)=>{
    if(c.k !== 'wild') return;
    const [x, y] = XY(i);
    for(let k = 0; k < 14; k++) ell(g, x * 100 + R() * 100, y * 100 + R() * 100, 3 + R() * 8, 2 + R() * 4, R() < 0.5 ? 'rgba(78,118,52,.5)' : 'rgba(104,84,48,.35)', R() * 3);
  });
}
/* a plot of lawn in the city: mown in stripes (rough and weedy round a ruin) */
function lawn(g, x0, y0, seed, rough){
  g.fillStyle = rough ? lin(g, x0, y0, x0 + 100, y0 + 100, [[0, '#7aa955'], [1, '#62914a']]) : lin(g, x0, y0, x0 + 100, y0 + 100, [[0, '#94c76a'], [1, '#7db358']]);
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
function stones(g, x0, y0, x1, y1, sz){
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  g.fillStyle = '#958871'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const h = sz * 0.85, wS = sz * 1.15, key = Math.round(sz * 10);
  for(let r = Math.floor(y0 / h) - 1; r <= Math.ceil(y1 / h); r++){
    const off = (r & 1) * wS * 0.5, y = r * h;
    for(let c = Math.floor((x0 - off) / wS) - 1; c <= Math.ceil((x1 - off) / wS); c++){
      const hs = hash(r * 7 + key, c), x = off + c * wS + ((hs & 7) / 7 - 0.5) * 0.7;
      g.fillStyle = COB[hs % COB.length]; rr(g, x + 0.55, y + 0.55, wS - 1.1, h - 1.1, Math.min(2.2, h * 0.36)); g.fill();
      g.fillStyle = 'rgba(255,255,255,.24)'; g.fillRect(x + 1.4, y + 1.1, wS - 3.2, Math.max(0.7, h * 0.15));
    }
  }
  g.restore();
}
/* an empty plot in the city, pegged out for building */
function pegs(g, x0, y0){
  const P = [[x0 + 22, y0 + 28], [x0 + 78, y0 + 28], [x0 + 78, y0 + 82], [x0 + 22, y0 + 82]];
  g.strokeStyle = 'rgba(255,250,232,.9)'; g.lineWidth = 0.9; g.beginPath(); P.forEach(([px, py], k)=> k ? g.lineTo(px, py - 4.5) : g.moveTo(px, py - 4.5)); g.closePath(); g.stroke();
  P.forEach(([px, py])=>{ shade(g, px + 1, py + 0.4, 2.4, 0.9, 0.3); g.fillStyle = '#8a5a2b'; g.fillRect(px - 1.2, py - 6, 2.4, 6.2); g.fillStyle = '#d8a060'; g.fillRect(px - 1.2, py - 6, 2.4, 1.4); });
}
/* the ground of a plot inside the walls */
function lot(g, x, y, c, i, road){
  const x0 = x * 100, y0 = y * 100, k = c.k, ruined = !!ART[k] && !c.lv;
  if(k === 'market' && !ruined){ stones(g, x0, y0, x0 + 100, y0 + 100, 8.5); return; }
  if(k === 'yard' && !ruined){ earth(g, x0, y0, i * 7 + 1, '#c9ab7a', '#a98b5c', false); return; }
  if(k === 'granary' && !ruined){ earth(g, x0, y0, i * 7 + 2, '#cdb27a', '#b09260', true); return; }
  lawn(g, x0, y0, i * 7 + 3, ruined);
  if(k === 'tower'){ g.fillStyle = 'rgba(190,180,160,.85)'; g.beginPath(); g.ellipse(x0 + 50, y0 + 88, 30, 10, 0, 0, TAU); g.fill(); const R = rng(i + 5); for(let j = 0; j < 30; j++) ell(g, x0 + 22 + R() * 56, y0 + 82 + R() * 12, 0.9, 0.7, R() < 0.5 ? '#8f8676' : '#ece6d8'); }
  if(k === 'palace'){ stones(g, x0 + 32, y0 + 84, x0 + 68, y0 + 100, 6); [x0 + 24, x0 + 76].forEach(hx=>{ shade(g, hx + 1, y0 + 95, 5, 1.8, 0.3); ell(g, hx, y0 + 90, 4.4, 4.8, '#3f7f36'); ell(g, hx - 1.2, y0 + 88.6, 2.6, 2.8, '#62a24c'); }); }
  if(k === 'house'){ stones(g, x0 + 45, y0 + 84, x0 + 55, y0 + 100, 4.6); const R = rng(i + 9); for(let j = 0; j < 9; j++){ const fx = j < 5 ? x0 + 12 + j * 5 : x0 + 64 + (j - 5) * 5; ell(g, fx, y0 + 95 + R() * 2, 2.2, 1.8, '#4f8f3a'); ell(g, fx + R(), y0 + 94 + R() * 2, 1.2, 1.2, ['#e8414f', '#f2c23a', '#c9a6f0', '#f08bb4', '#ffffff'][j % 5]); } }
  if(k === 'clear' && !road) pegs(g, x0, y0);
}
/* streets: a cobbled one along every side two plots of the city share; from the gate up an empty plot to the town */
function streets(g, C, G, road){
  const ok = (x, y)=> inside(x, y) && C.cells[y * N + x].k !== 'wild';
  for(let y = 2; y <= 6; y++) for(let x = 2; x <= 6; x++){
    if(!ok(x, y)) continue;
    if(ok(x + 1, y)) stones(g, (x + 1) * 100 - 8, y * 100, (x + 1) * 100 + 8, y * 100 + 100, 6);
    if(ok(x, y + 1)) stones(g, x * 100, (y + 1) * 100 - 8, x * 100 + 100, (y + 1) * 100 + 8, 6);
  }
  if(road) stones(g, 440, 600, 460, 700, 6);
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
const trackX = y=> 450 + 8 * Math.sin(y / 34 + 0.6);
function trackRows(C, G){
  const rows = [];
  for(let y = 6; y <= 8; y++){ const c = C.cells[y * N + 4]; if(c.k === 'field') break; if(c.k === 'wild' || (c.k === 'clear' && !inside(4, y))) rows.push(y); }
  return rows;
}
function track(g, C, G){
  const rows = trackRows(C, G);
  rows.forEach(y=>{
    const start = y === 7 ? (G.M ? 708 + G.w : G.W ? 703 : 700) : y * 100, end = y * 100 + 100;
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
    out.push({ y, f:(g, R2)=> (kind === 'oak' ? oak : kind === 'fir' ? fir : birch)(g, x, y, s, R2), seed:i * 13 + k });
  }
  for(let k = 0; k < 2; k++){
    const y = y0 + 0.52 * fh + R() * 0.44 * fh, x = clearOf(x0 + 0.1 * fw + R() * 0.8 * fw, y), r = R(), s = 0.8 + R() * 0.4, berry = R() < 0.3;
    if(gl && Math.abs(x - (x0 + x1) / 2) < 30 && Math.abs(y - (y0 + y1) / 2) < 22) continue;
    const f = r < 0.4 ? (g, R2)=> bush(g, x, y, s, R2, berry) : r < 0.65 ? (g, R2)=> fern(g, x, y, s, R2) : r < 0.85 ? g=> rock(g, x, y, s) : (g, R2)=> mushrooms(g, x, y, s, R2);
    out.push({ y, f, seed:i * 13 + 7 + k });
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
  g.fillStyle = lin(g, x - r, 0, x + r, 0, [[0, '#ece6d8'], [0.45, '#cfc6b3'], [1, '#8f8676']]);
  g.beginPath(); g.moveTo(x - r, y - h); g.lineTo(x - r, y); g.ellipse(x, y, r, r * 0.35, 0, Math.PI, 0, true); g.lineTo(x + r, y - h); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(90,80,64,.35)'; g.lineWidth = 0.8;
  for(let k = 1; k < h / 6; k++){ g.beginPath(); g.ellipse(x, y - k * 6, r, r * 0.35, 0, 0.15, Math.PI - 0.15); g.stroke(); }
  if(opts.slits) for(let k = 0; k < opts.slits; k++){ g.fillStyle = '#2d241c'; g.fillRect(x - 1 + (k % 2 ? r * 0.3 : -r * 0.25), y - h * (0.35 + 0.3 * k), 2, 6); }
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
  const col = kind === 'healer' ? ['#5c9c72', '#3a6e4e'] : kind === 'granary' ? ['#a24c34', '#5f2418'] : ['#8a7a62', '#5a4a36'];
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

/* ---------- THE BUILDINGS ---------- */
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
function healer(g, x0, y0, L){
  shade(g, x0 + 52, y0 + 88, 36, 8, 0.28);
  [[x0 + 8, y0 + 74], [x0 + 8, y0 + 84]].forEach(([bx, by])=>{ g.fillStyle = '#7a5530'; g.fillRect(bx, by, 16, 7); for(let j = 0; j < 5; j++){ ell(g, bx + 2 + j * 3, by + 1, 2, 2.6, ['#5fa84a', '#8bc46a', '#4c9a5a'][j % 3]); if(L >= 2 && j % 2) ell(g, bx + 2 + j * 3, by - 1.2, 0.9, 0.9, '#c9a6f0'); } });
  wall(g, x0 + 30, y0 + 52, 46, 34, '#fbf8f0', '#d9d2c2');
  door(g, x0 + 47, y0 + 68, 12, 18, '#5f8a4a');
  ell(g, x0 + 53, y0 + 66, 4.5, 2, '#4f9a6a');
  windowLit(g, x0 + 35, y0 + 60, 7, 9); windowLit(g, x0 + 64, y0 + 60, 7, 9);
  gable(g, x0 + 30, y0 + 34, 46, 20, '#4f9a6a', '#2f6a45', '#7ac496');
  ell(g, x0 + 53, y0 + 44, 6, 6, '#fbf8f0'); g.strokeStyle = '#2f6a45'; g.lineWidth = 1.1; g.beginPath(); g.arc(x0 + 53, y0 + 44, 6, 0, TAU); g.stroke();
  g.fillStyle = '#5fb07a'; g.beginPath(); g.moveTo(x0 + 53, y0 + 39.5); g.quadraticCurveTo(x0 + 57.5, y0 + 44, x0 + 53, y0 + 48.5); g.quadraticCurveTo(x0 + 48.5, y0 + 44, x0 + 53, y0 + 39.5); g.fill();
  const wx = x0 + 84, wy = y0 + 86;
  shade(g, wx + 1, wy, 9, 3, 0.3);
  g.fillStyle = lin(g, wx - 7, 0, wx + 7, 0, [[0, '#c9c2b2'], [1, '#8a8274']]); g.beginPath(); g.ellipse(wx, wy - 6, 7, 2.8, 0, 0, TAU); g.rect(wx - 7, wy - 6, 14, 6); g.fill();
  ell(g, wx, wy - 6, 5.4, 2, '#3f8fd0');
  g.fillStyle = '#6b4426'; g.fillRect(wx - 7, wy - 18, 1.6, 12); g.fillRect(wx + 5.4, wy - 18, 1.6, 12);
  g.fillStyle = '#9a5a3a'; g.beginPath(); g.moveTo(wx - 9, wy - 17); g.lineTo(wx, wy - 23); g.lineTo(wx + 9, wy - 17); g.closePath(); g.fill();
  if(L >= 3){ g.fillStyle = 'rgba(200,235,240,.55)'; g.fillRect(x0 + 6, y0 + 50, 20, 18); g.strokeStyle = '#e8f0f0'; g.lineWidth = 0.8; for(let k = 1; k < 4; k++){ g.beginPath(); g.moveTo(x0 + 6 + k * 5, y0 + 50); g.lineTo(x0 + 6 + k * 5, y0 + 68); g.stroke(); } g.fillStyle = 'rgba(95,168,74,.7)'; g.fillRect(x0 + 8, y0 + 60, 16, 6); }
  if(L >= 4) chimney(g, x0 + 66, y0 + 40, 10, true);
  if(L >= 5){ g.fillStyle = '#3f7f58'; g.beginPath(); g.moveTo(x0 + 43, y0 + 69); g.lineTo(x0 + 53, y0 + 62); g.lineTo(x0 + 63, y0 + 69); g.closePath(); g.fill(); g.fillStyle = '#e8e2d2'; g.fillRect(x0 + 44, y0 + 69, 1.6, 17); g.fillRect(x0 + 60.4, y0 + 69, 1.6, 17);
    [x0 + 34, x0 + 63].forEach(bx=>{ g.fillStyle = '#7a4a2a'; g.fillRect(bx, y0 + 69.5, 9, 2.2); ell(g, bx + 2, y0 + 69.2, 1.4, 1.4, '#f08bb4'); ell(g, bx + 5, y0 + 69, 1.4, 1.4, '#ffffff'); ell(g, bx + 7.5, y0 + 69.2, 1.4, 1.4, '#c9a6f0'); }); }
}
function market(g, x0, y0, L){
  shade(g, x0 + 52, y0 + 90, 44, 8, 0.2);
  const stall = (x, y, cA, cB, goods)=>{
    shade(g, x + 15, y + 1, 17, 3, 0.25);
    g.fillStyle = '#6b4426'; g.fillRect(x, y - 22, 2, 22); g.fillRect(x + 26, y - 22, 2, 22);
    g.fillStyle = lin(g, 0, y - 10, 0, y, [[0, '#b9874f'], [1, '#8a5a2b']]); g.fillRect(x - 1, y - 10, 30, 10);
    for(let k = 0; k < 6; k++){ const gx = x + 3 + k * 4.3; if(goods === 'fruit'){ ell(g, gx, y - 11.5, 2.1, 2.1, ['#d32f2c', '#f2a33a', '#e8d04a', '#7fbf4a'][k % 4]); ell(g, gx + 1.5, y - 13.4, 2, 2, ['#e8d04a', '#d32f2c', '#7fbf4a', '#f2a33a'][k % 4]); }
      else if(goods === 'bread'){ ell(g, gx, y - 11.6, 2.4, 1.6, '#c98b48'); ell(g, gx - 0.6, y - 12.2, 1.2, 0.6, '#e8b878'); }
      else { g.fillStyle = ['#b9653a', '#3f7d9a', '#e0c070'][k % 3]; g.beginPath(); g.ellipse(gx, y - 12, 1.8, 2.6, 0, 0, TAU); g.fill(); } }
    for(let k = 0; k < 6; k++){ g.fillStyle = k % 2 ? cB : cA; g.beginPath(); g.moveTo(x - 3 + k * 5.6, y - 30); g.lineTo(x - 3 + (k + 1) * 5.6, y - 30); g.lineTo(x - 3 + (k + 1) * 5.6, y - 23); g.arc(x - 3 + (k + 0.5) * 5.6, y - 23, 2.8, 0, Math.PI); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - 3, y - 25, 34, 2);
  };
  if(L >= 4){ gable(g, x0 + 14, y0 + 10, 72, 18, '#b9533c', '#7a2f20', '#e0846a'); if(L >= 5) flag(g, x0 + 50, y0 + 9, '#e0b84a', 10); }
  if(L >= 3){ g.strokeStyle = 'rgba(70,50,35,.7)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x0 + 4, y0 + 30); g.quadraticCurveTo(x0 + 50, y0 + 44, x0 + 96, y0 + 30); g.stroke();
    for(let k = 1; k < 10; k++){ const u = k / 10, px = x0 + 4 + 92 * u, py = y0 + 30 + 14 * 4 * u * (1 - u) * 0.55; g.fillStyle = ['#e8414f', '#f2c23a', '#3c6fc4', '#3f9d5a'][k % 4]; g.beginPath(); g.moveTo(px - 2.2, py); g.lineTo(px + 2.2, py); g.lineTo(px, py + 4.5); g.closePath(); g.fill(); } }
  const fountain = ()=>{ const fx = x0 + 84, fy = y0 + 92; shade(g, fx + 1, fy + 1, 10, 3, 0.25); ell(g, fx, fy, 9, 3.4, '#b3ab9b'); ell(g, fx, fy - 0.6, 7.2, 2.4, '#4f9fdc'); g.fillStyle = '#c2bcae'; g.fillRect(fx - 1.2, fy - 9, 2.4, 8.5); ell(g, fx, fy - 9, 3, 1.2, '#c2bcae'); g.strokeStyle = 'rgba(220,240,255,.9)'; g.lineWidth = 1; g.beginPath(); g.moveTo(fx, fy - 10); g.quadraticCurveTo(fx - 4, fy - 14, fx - 6, fy - 2); g.moveTo(fx, fy - 10); g.quadraticCurveTo(fx + 4, fy - 14, fx + 6, fy - 2); g.stroke(); };
  stall(x0 + 10, y0 + 70, '#c8463c', '#f6eee0', 'fruit');
  stall(x0 + 56, y0 + 66, '#3c6fc4', '#f6eee0', 'bread');
  (L >= 5 ? [[x0 + 46, y0 + 78]] : [[x0 + 46, y0 + 78], [x0 + 88, y0 + 84]]).forEach(([bx, by])=>{ shade(g, bx + 1, by, 5, 2, 0.3); g.fillStyle = lin(g, bx - 4.5, 0, bx + 4.5, 0, [[0, '#b07a45'], [1, '#6b4422']]); g.fillRect(bx - 4.5, by - 10, 9, 10); ell(g, bx, by - 10, 4.5, 1.8, '#8a5a2b'); g.fillStyle = '#4a3a2a'; g.fillRect(bx - 4.5, by - 7.5, 9, 1); g.fillRect(bx - 4.5, by - 3, 9, 1); });
  if(L >= 2) stall(x0 + 33, y0 + 94, '#e0a42a', '#f6eee0', 'pots');
  if(L >= 5) fountain();
}
function yard(g, x0, y0, L){
  shade(g, x0 + 50, y0 + 90, 42, 8, 0.2);
  if(L >= 3){ gable(g, x0 + 56, y0 + 12, 32, 12, '#8a5a2b', '#5a3a1a', '#b98a5a'); wall(g, x0 + 56, y0 + 24, 32, 18, '#c9a77a', '#8a6a44'); door(g, x0 + 67, y0 + 28, 10, 14, '#5a3a1a'); }
  wall(g, x0 + 54, y0 + 56, 36, 30, '#d9d2c2', '#a59d8c');
  if(L >= 5) for(let k = 0; k < 4; k++){ g.fillStyle = '#d9d2c2'; g.fillRect(x0 + 55 + k * 9.5, y0 + 51, 6, 5); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x0 + 59.5 + k * 9.5, y0 + 51, 1.5, 5); }
  g.strokeStyle = 'rgba(80,70,56,.4)'; g.lineWidth = 0.7; for(let r = 0; r < 4; r++){ g.beginPath(); g.moveTo(x0 + 54, y0 + 62 + r * 7); g.lineTo(x0 + 90, y0 + 62 + r * 7); g.stroke(); }
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 1.6; [56, 72, 88].forEach(px=>{ g.beginPath(); g.moveTo(x0 + px, y0 + 86); g.lineTo(x0 + px, y0 + 44); g.stroke(); }); [50, 66].forEach(py=>{ g.beginPath(); g.moveTo(x0 + 54, y0 + py); g.lineTo(x0 + 92, y0 + py); g.stroke(); });
  const cx = x0 + 26, cy = y0 + 84;
  g.strokeStyle = '#7a4f28'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx - 10, cy); g.lineTo(cx, cy - 46 - 3 * L); g.lineTo(cx + 10, cy); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy - 46 - 3 * L); g.lineTo(cx + 26, cy - 40 - 3 * L); g.stroke();
  g.strokeStyle = '#3a342c'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx + 25, cy - 40 - 3 * L); g.lineTo(cx + 25, cy - 18); g.stroke();
  g.fillStyle = '#b3ab9b'; g.fillRect(cx + 21, cy - 18, 8, 6);
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy - 14, 11, 0, TAU); g.stroke(); g.lineWidth = 1; for(let k = 0; k < 4; k++){ const a = k * Math.PI / 4; g.beginPath(); g.moveTo(cx - Math.cos(a) * 11, cy - 14 - Math.sin(a) * 11); g.lineTo(cx + Math.cos(a) * 11, cy - 14 + Math.sin(a) * 11); g.stroke(); }
  for(let k = 0; k < 3; k++){ const ly = y0 + 92 - k * 4.5, lx = x0 + 6 + k * 2; g.fillStyle = lin(g, 0, ly - 4, 0, ly, [[0, '#b07a45'], [1, '#7a4f28']]); rr(g, lx, ly - 4, 30 - k * 4, 4.2, 2); g.fill(); ell(g, lx + 30 - k * 4, ly - 1.9, 1.8, 2.1, '#e2b98a'); }
  if(L >= 5) flag(g, cx, cy - 46 - 3 * L, '#c8463c', 9);
  if(L >= 4){ const kx = x0 + 40, ky = y0 + 96; shade(g, kx + 8, ky + 1, 12, 2.2, 0.28); g.fillStyle = '#8a5a2b'; g.fillRect(kx, ky - 9, 18, 6); g.fillStyle = '#b3ab9b'; [[2, 13], [7, 14], [12, 13], [5, 17]].forEach(([dx, dy])=> g.fillRect(kx + dx, ky - dy, 5, 4)); g.strokeStyle = '#4a3322'; g.lineWidth = 1.3; g.beginPath(); g.arc(kx + 4, ky - 2, 2.6, 0, TAU); g.moveTo(kx + 16.6, ky - 2); g.arc(kx + 14, ky - 2, 2.6, 0, TAU); g.moveTo(kx + 18, ky - 6); g.lineTo(kx + 24, ky - 3); g.stroke(); }
  [[x0 + 62, y0 + 96], [x0 + 74, y0 + 97], [x0 + 68, y0 + 91]].forEach(([bx, by])=>{ g.fillStyle = lin(g, bx, by - 7, bx + 10, by, [[0, '#d9d2c2'], [1, '#948b7a']]); g.fillRect(bx, by - 7, 10, 7); g.strokeStyle = 'rgba(60,50,40,.35)'; g.lineWidth = 0.6; g.strokeRect(bx, by - 7, 10, 7); });
}
function granary(g, x0, y0, L){
  shade(g, x0 + 46, y0 + 90, 40, 8, 0.28);
  if(L >= 5){ const mx = x0 + 22, my = y0 + 22; g.strokeStyle = '#6b4426'; g.lineWidth = 1.4; for(let k = 0; k < 4; k++){ const a = k * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(a) * 20, my + Math.sin(a) * 20); g.stroke(); g.fillStyle = 'rgba(246,238,224,.92)'; g.beginPath(); g.moveTo(mx + Math.cos(a) * 6, my + Math.sin(a) * 6); g.lineTo(mx + Math.cos(a) * 20, my + Math.sin(a) * 20); g.lineTo(mx + Math.cos(a + 0.28) * 19, my + Math.sin(a + 0.28) * 19); g.lineTo(mx + Math.cos(a + 0.5) * 6, my + Math.sin(a + 0.5) * 6); g.closePath(); g.fill(); } ell(g, mx, my, 2.2, 2.2, '#5a3a1a'); }
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
function house(g, x0, y0, L){
  const fence = ()=>{ g.strokeStyle = '#a07a4a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0 + 8, y0 + 90); g.lineTo(x0 + 42, y0 + 90); g.moveTo(x0 + 58, y0 + 90); g.lineTo(x0 + 92, y0 + 90); g.stroke(); for(let k = 0; k < 10; k++){ if(k === 5 || k === 4) continue; g.fillStyle = '#d8b27a'; g.fillRect(x0 + 8 + k * 8.4, y0 + 85, 2, 7); } };
  if(L <= 1){ cottage(g, x0 + 30, y0 + 84, 40, 26, null, true); for(let k = 0; k < 4; k++) ell(g, x0 + 16 + k * 3, y0 + 86, 2.2, 2, '#5fa84a'); return; }
  if(L === 2){ cottage(g, x0 + 24, y0 + 84, 52, 30, '#b9533c', false, { box:true, chimney:true }); fence(); return; }
  if(L === 3){ cottage(g, x0 + 8, y0 + 86, 36, 26, null, true); cottage(g, x0 + 56, y0 + 82, 38, 28, '#b9533c', false, { box:true, chimney:true }); return; }
  if(L === 4){ cottage(g, x0 + 22, y0 + 86, 56, 46, '#5f6f86', false, { beams:true, wall:'#f6eee0', wallD:'#d6c8a8', chimney:true, box:true }); fence(); return; }
  cottage(g, x0 + 16, y0 + 84, 68, 44, '#3e5f9a', false, { beams:true, wall:'#f6eee0', wallD:'#d6c8a8', chimney:true, box:true, door:'#3c2a1c' });
  flag(g, x0 + 50, y0 + 16, '#e0b84a', 8);
}
function tower(g, x0, y0, L){
  roundTower(g, x0 + 50, y0 + 88, 15, 44 + 7 * L, L >= 3 ? 'cone' : 'flat', { slits:3, flag:'#c8463c', roof:'#6b4a8a', roofL:'#8e6cb0', roofD:'#43295e', tip:'#e0b84a' });
  g.fillStyle = '#4a3a2a'; g.beginPath(); g.moveTo(x0 + 44, y0 + 89); g.lineTo(x0 + 44, y0 + 80); g.arc(x0 + 50, y0 + 80, 6, Math.PI, 0); g.lineTo(x0 + 56, y0 + 89); g.fill();
}
const ART = { palace, healer, market, yard, granary, house, tower };
/* each a little larger than its plot's middle, so that it reads at the board's size */
const GROW = { palace:1.04, healer:1.1, market:1.06, yard:1.06, granary:1.08, house:1.12, tower:1.08 };

/* ---------- THE WALLS AND THE MOAT ---------- */
function moatFlat(g, G){
  const w = G.w, o0 = 196 - w, o1 = 704 + w;
  g.beginPath(); rrPath(g, o0, o0, o1 - o0, o1 - o0, 12 + w); rrPath(g, 196, 196, 508, 508, 10);
  g.fillStyle = lin(g, 0, o0, 0, o1, [[0, '#55a6e6'], [1, '#2f78b6']]); g.fill('evenodd');
  /* deeper along the walls' side */
  g.save(); g.beginPath(); rrPath(g, o0, o0, o1 - o0, o1 - o0, 12 + w); rrPath(g, 196, 196, 508, 508, 10); g.clip('evenodd');
  g.strokeStyle = 'rgba(20,60,110,.35)'; g.lineWidth = 7; g.beginPath(); rrPath(g, 196, 196, 508, 508, 10); g.stroke();
  g.restore();
  /* its banks: stone on the outside, earth at the walls */
  g.strokeStyle = '#a49d8f'; g.lineWidth = 3; g.beginPath(); rrPath(g, o0, o0, o1 - o0, o1 - o0, 12 + w); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); rrPath(g, o0 - 1.2, o0 - 1.2, o1 - o0 + 2.4, o1 - o0 + 2.4, 13 + w); g.stroke();
  g.strokeStyle = 'rgba(70,64,56,.6)'; g.lineWidth = 2; g.beginPath(); rrPath(g, 196, 196, 508, 508, 10); g.stroke();
  /* ripples and lily pads along each side */
  const R = rng(91 + G.M), at = (side, along, d)=> side === 0 ? [o0 + along, 196 - d] : side === 1 ? [o0 + along, 704 + d] : side === 2 ? [196 - d, o0 + along] : [704 + d, o0 + along];
  g.strokeStyle = 'rgba(225,245,255,.75)'; g.lineWidth = 1.2; g.beginPath();
  for(let k = 0; k < 64; k++){ const side = k % 4, [px, py] = at(side, 30 + R() * (o1 - o0 - 60), w * (0.25 + R() * 0.5));
    if(side < 2){ g.moveTo(px - 4, py); g.quadraticCurveTo(px, py - 1.5, px + 4, py); } else { g.moveTo(px, py - 4); g.quadraticCurveTo(px - 1.5, py, px, py + 4); } }
  g.stroke();
  for(let k = 0; k < 12; k++){ const side = k % 4, [px, py] = at(side, 40 + R() * (o1 - o0 - 80), w * (0.25 + R() * 0.5));
    if(side === 1 && Math.abs(px - 450) < 26) continue;
    g.fillStyle = '#3f8a3a'; g.beginPath(); g.moveTo(px, py); g.arc(px, py, 3.6, 0.3, TAU - 0.3); g.closePath(); g.fill(); if(k % 3 === 0) ell(g, px + 1, py - 1, 1.3, 1.3, '#f6c6da'); }
}
/* the shade the walls cast on the ground (to the lower right) */
function wallShade(g, G){
  if(!G.W) return;
  g.fillStyle = 'rgba(20,28,12,.2)';
  g.fillRect(200 + (G.T || 6) / 2, G.yN, 7, 700 - G.yN);
  g.fillRect(700 + (G.T || 6) / 2, G.yN, 7, 704 - G.yN);
  g.fillRect(205, G.yN, 495, 5);
}
/* the walls, as things standing on the board, each where it stands (drawn in turn with everything else) */
function wallItems(G){
  const { W, stone, H, T, yN } = G;
  if(!W) return [];
  const out = [];
  const colTop = ['', '', '#cfc8b8', '#d6d0c2', '#dfdace', '#e8e4da'][W] || '#cfc8b8', colFace = ['', '', '#aaa292', '#b2aa9b', '#bcb5a7', '#c6c0b3'][W] || '#aaa292';
  const roofs = { roof:'#5f6f86', roofL:'#8798b4', roofD:'#3c4a60' };
  const stakes = (g, x0, x1, y)=>{
    for(let x = x0; x <= x1; x += 6.5){ g.fillStyle = lin(g, x - 3, 0, x + 3, 0, [[0, '#b07b45'], [1, '#6b4422']]); g.fillRect(x - 3, y - H, 6, H); g.fillStyle = '#d0965a'; g.beginPath(); g.moveTo(x - 3, y - H); g.lineTo(x, y - H - 4); g.lineTo(x + 3, y - H); g.fill(); }
    g.fillStyle = '#5b3a1c'; g.fillRect(x0 - 3, y - H * 0.62, x1 - x0 + 6, 2); g.fillRect(x0 - 3, y - H * 0.26, x1 - x0 + 6, 2);
  };
  /* a run along the north or the south: its face, its walk on top, its battlements on the outer edge */
  const runH = (x0, x1, y, south)=> out.push({ y:y + (south ? 0.5 : 0), f:g=>{
    if(!stone) return stakes(g, x0, x1, y);
    g.fillStyle = lin(g, 0, y - H, 0, y, [[0, colTop], [1, colFace]]); g.fillRect(x0, y - H, x1 - x0, H);
    g.strokeStyle = 'rgba(70,60,48,.3)'; g.lineWidth = 0.8;
    for(let r = 1; r * 5 < H; r++){ g.beginPath(); g.moveTo(x0, y - r * 5); g.lineTo(x1, y - r * 5); g.stroke(); for(let x = x0 + (r % 2) * 5; x < x1; x += 10){ g.beginPath(); g.moveTo(x, y - r * 5); g.lineTo(x, y - r * 5 + 5); g.stroke(); } }
    g.fillStyle = '#968e80'; g.fillRect(x0, y - H - T, x1 - x0, T);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x0, y - H - T, x1 - x0, 2);
    const edge = south ? y - H : y - H - T;
    for(let x = x0 + 2; x < x1 - 4; x += 11){ g.fillStyle = colTop; g.fillRect(x, edge - 5, 6, 5); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 4.5, edge - 5, 1.5, 5); }
    if(W >= 5 && south) for(let x = x0 + 40; x < x1 - 30; x += 90){ g.fillStyle = '#c8463c'; g.fillRect(x, y - H + 1, 7, H - 2); g.fillStyle = '#e0b84a'; g.fillRect(x, y - H + 1, 7, 1.6); }
  } });
  /* a run down the west or the east: its walk seen from above, battlements on its outer edge */
  const runV = (x, west)=>{ for(let y = Math.floor(yN / 100) * 100; y < 700; y += 100) out.push({ y:Math.min(700, y + 100) - 1, f:g=>{
    const ya = Math.max(y, yN), yb = Math.min(700, y + 100);
    if(!stone){ for(let yy = ya; yy < yb; yy += 6.5){ g.fillStyle = lin(g, x - 3, 0, x + 3, 0, [[0, '#b07b45'], [1, '#6b4422']]); g.fillRect(x - 3, yy - H + 4, 6, H - 2); g.fillStyle = '#d0965a'; g.beginPath(); g.moveTo(x - 3, yy - H + 4); g.lineTo(x, yy - H); g.lineTo(x + 3, yy - H + 4); g.fill(); } return; }
    g.fillStyle = '#968e80'; g.fillRect(x - T / 2, ya - H, T, yb - ya);
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x - T / 2, ya - H, 2, yb - ya);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + T / 2 - 1.5, ya - H, 1.5, yb - ya);
    const ex = west ? x - T / 2 - 1 : x + T / 2 - 5;
    for(let yy = ya + 2; yy < yb - 4; yy += 11){ g.fillStyle = colTop; g.fillRect(ex, yy - H - 4, 6, 8); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(ex, yy - H + 2.5, 6, 1.5); }
  } }); };
  runH(200, 700, yN, false);
  runV(200, true); runV(700, false);
  runH(200, 424, 700, true); runH(476, 700, 700, true);
  if(stone) [[200, yN + 2], [700, yN + 2], [200, 703], [700, 703]].forEach(([tx, ty])=> out.push({ y:ty + 2, f:g=> roundTower(g, tx, ty, 12 + W, H + 10 + 2 * W, W >= 4 ? 'cone' : 'flat', Object.assign({ slits:2, flag:W >= 3 ? '#c8463c' : null }, roofs)) }));
  else [[200, yN], [700, yN], [200, 700], [700, 700]].forEach(([tx, ty])=> out.push({ y:ty + 1, f:g=>{ g.fillStyle = lin(g, tx - 4.5, 0, tx + 4.5, 0, [[0, '#b07b45'], [1, '#6b4422']]); g.fillRect(tx - 4.5, ty - H - 6, 9, H + 6); g.fillStyle = '#d0965a'; g.beginPath(); g.moveTo(tx - 4.5, ty - H - 6); g.lineTo(tx, ty - H - 11); g.lineTo(tx + 4.5, ty - H - 6); g.fill(); } }));
  out.push({ y:704, f:g=>{
    if(!stone){ g.fillStyle = '#6b4422'; g.fillRect(420, 700 - H - 8, 6, H + 8); g.fillRect(474, 700 - H - 8, 6, H + 8); g.fillStyle = '#8a5a2b'; g.fillRect(426, 700 - H + 2, 48, H - 2); g.strokeStyle = 'rgba(40,24,10,.6)'; g.lineWidth = 1; for(let k = 1; k < 6; k++){ g.beginPath(); g.moveTo(426 + k * 8, 700 - H + 2); g.lineTo(426 + k * 8, 700); g.stroke(); } g.beginPath(); g.moveTo(426, 700 - H + 3); g.lineTo(474, 699); g.stroke(); return; }
    /* the gatehouse: two drum towers, the arch between, its portcullis */
    roundTower(g, 418, 704, 11, H + 14, W >= 3 ? 'cone' : 'flat', Object.assign({ flag:'#c8463c' }, roofs));
    roundTower(g, 482, 704, 11, H + 14, W >= 3 ? 'cone' : 'flat', Object.assign({ flag:'#c8463c' }, roofs));
    g.fillStyle = lin(g, 0, 700 - H - 8, 0, 700, [[0, colTop], [1, colFace]]); g.fillRect(428, 700 - H - 8, 44, H + 8);
    for(let x = 430; x < 468; x += 9){ g.fillStyle = colTop; g.fillRect(x, 700 - H - 13, 5, 5); }
    g.fillStyle = '#2a221a'; g.beginPath(); g.moveTo(439, 700); g.lineTo(439, 700 - H + 5); g.arc(450, 700 - H + 5, 11, Math.PI, 0); g.lineTo(461, 700); g.fill();
    g.strokeStyle = '#5a5046'; g.lineWidth = 1.1; for(let k = 1; k < 6; k++){ g.beginPath(); g.moveTo(439 + k * 3.7, 700 - H - 2); g.lineTo(439 + k * 3.7, 700 - 4); g.stroke(); } for(let k = 1; k < 4; k++){ g.beginPath(); g.moveTo(439, 700 - 4 - k * (H / 4)); g.lineTo(461, 700 - 4 - k * (H / 4)); g.stroke(); }
    if(W >= 3){ g.fillStyle = '#3c6fc4'; g.beginPath(); g.moveTo(444, 700 - H - 7); g.lineTo(456, 700 - H - 7); g.lineTo(456, 700 - H); g.lineTo(450, 700 - H + 4); g.lineTo(444, 700 - H); g.closePath(); g.fill(); ell(g, 450, 700 - H - 2.5, 2.2, 2.2, '#e0b84a'); }
  } });
  /* the bridge over the moat */
  if(G.M) out.push({ y:704 + G.w, f:g=>{
    const y0 = 699, y1 = 708 + G.w;
    shade(g, 452, y1 - 1, 15, 2.5, 0.3);
    g.fillStyle = lin(g, 436, 0, 464, 0, [[0, '#a8743f'], [1, '#7a4f28']]); g.fillRect(437, y0, 26, y1 - y0);
    g.strokeStyle = 'rgba(40,24,10,.45)'; g.lineWidth = 0.8; for(let yy = y0 + 4; yy < y1; yy += 4){ g.beginPath(); g.moveTo(437, yy); g.lineTo(463, yy); g.stroke(); }
    g.fillStyle = '#5a3a1e'; g.fillRect(434, y0 + 2, 3, y1 - y0 - 2); g.fillRect(463, y0 + 2, 3, y1 - y0 - 2);
    [434, 463].forEach(px=>{ g.fillStyle = '#4a2f18'; g.fillRect(px - 0.5, y1 - 7, 4, 7); g.fillRect(px - 0.5, y0 + 2, 4, 5); });
  } });
  return out;
}

/* ---------- THE WHOLE BOARD ---------- */
function render(K, S){
  const t0 = performance.now(), C = K.city, G = geo(C);
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'); g.scale(S / 900, S / 900);
  const ctx = { path:trackRows(C, G).map(y=> y * N + 4) };
  meadow(g);
  forestFloor(g, C);
  C.cells.forEach((c, i)=>{ if(c.k === 'wild' && glade(i, ctx)){ const [x, y] = XY(i); gladeFloor(g, i, free(x, y, G)); } });
  /* an empty plot in the middle of the south side, the walls up: the road from the gate runs up it */
  const gateLot = C.cells[6 * N + 4], road = !!G.W && gateLot && gateLot.k === 'clear';
  /* the ground of each plot: lawns, yards and the market's square in the city, fields and the cleared outside */
  C.cells.forEach((c, i)=>{
    const [x, y] = XY(i);
    if(c.k === 'wild') return;
    if(inside(x, y)) lot(g, x, y, c, i, road && i === 6 * N + 4);
    else if(c.k === 'field') fieldGround(g, free(x, y, G), c, i);
    else clearedFlat(g, free(x, y, G), i);
  });
  streets(g, C, G, road);
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
    const art = ART[c.k];
    if(!art) return;
    items.push({ y:y0 + 88, seed:i * 31 + 9, f:(g2, R)=>{
      if(!c.lv) return ruin(g2, x0, y0, c.k, R);
      const s = GROW[c.k] || 1;
      g2.save(); g2.translate(x0 + 50, y0 + 90); g2.scale(s, s); g2.translate(-(x0 + 50), -(y0 + 90));
      art(g2, x0, y0, c.lv);
      g2.restore();
    } });
  });
  wallItems(G).forEach(o=> items.push(o));
  items.sort((a, b)=> a.y - b.y);
  items.forEach(o=>{ try { o.f(g, rng((o.seed || Math.round(o.y * 7)) + 101)); } catch(e){ console.error('kingdom art:', e); } });
  /* light: warm from the upper left, the edges of the world in shade */
  const v = g.createRadialGradient(380, 340, 220, 450, 450, 700);
  v.addColorStop(0, 'rgba(255,240,200,.06)'); v.addColorStop(0.6, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(8,18,6,.42)');
  g.fillStyle = v; g.fillRect(0, 0, 900, 900);
  info.ms = Math.round(performance.now() - t0); info.walls = G.W; info.moat = G.M; info.items = items.length; info.size = S;
  return cv;
}
const info = { ms:0, walls:0, moat:0, items:0, size:0, renders:0 };
let kept = null;
function sig(K){ const C = K.city; return C.cells.map(c=> c.k.slice(0, 2) + (c.lv || 0) + (c.irr ? 'i' : '') + (c.fer ? 'f' : '')).join('') + '|' + C.walls + '|' + C.moat; }
/* paint the board into `canvas` (its own size, its screen's sharpness), from what is kept if nothing has changed */
function paint(canvas, K){
  const css = canvas.clientWidth || 600, dpr = Math.min(2, window.devicePixelRatio || 1), S = Math.max(300, Math.min(1800, Math.round(css * dpr)));
  const key = sig(K) + '@' + S;
  if(!kept || kept.key !== key){ kept = { key, cv:render(K, S) }; info.renders++; }
  if(canvas.width !== S){ canvas.width = S; canvas.height = S; }
  canvas.getContext('2d').drawImage(kept.cv, 0, 0);
}
return { paint, info, render, geo, free, trackRows };
})();
