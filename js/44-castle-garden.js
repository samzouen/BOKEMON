/* ============================================================
   44-castle-garden.js — (4.65) THE CASTLE GARDENS, drawn whole
   The designer: "the fairy kingdom castle gardens need work compared to the rest of the castle, too! Could you really
   put in effort to that one, please? the fairy castle is gorgeous."
   Two formal parterres, west and east of the palace (their layout: caGrounds' `garden`, 21-castle.js, kept in
   m.tags.gardens). Their ground is one picture each, cut into its squares as the palace is ('gdn:<side>:<dx>:<dy>',
   8 × 8 squares a piece, a rim of two pixels round each piece so no seam shows): a clipped yew hedge round it, gravel
   walks with marble kerbs, the round court paved in rings of pink granite, marble and gold stone, four beds edged in
   box with lavender inside the box and roses within, a ring of white alyssum round each one's statue or spiral yew,
   petals fallen from the blossom on the walks. What stands up is drawn by the decos: the blossom trees and the cypress
   (caDrawDeco's 'tree', `garden`), the spiral yews, the marble fairies, the curved seats, the urns, the rose arches
   over the north and south gates, the clipped balls on the piers of the others; and the pond's lilies and koi
   (caDrawPool, `life`). The light, as everywhere in the castle, from the upper left.
   ============================================================ */
const CA_GARDEN = (function(){
const U = ()=> CA_ART.util;
const CHUNK = 8, RIM = 2;
const TAU = Math.PI * 2;
const hsh = (a, b, k)=> jgHash(a * 7 + 3, b * 13 + 5, k);
const shade = (hex, f)=> caShade(hex, f);
function spec(side){ const m = caGrounds(); return m && m.tags && m.tags.gardens ? m.tags.gardens[side] : null; }
/* Many small shapes of one colour go into one path and are filled (or stroked) at once: a bed's thousands of leaves
   and petals cost a few fills, not thousands. Its order is its colours' first use. */
function batch(){
  const fills = new Map(), strokes = new Map();
  const get = (map, key)=>{ let p = map.get(key); if(!p){ p = new Path2D(); map.set(key, p); } return p; };
  return {
    ell(col, x, y, rx, ry, rot){ const p = get(fills, col); p.moveTo(x + rx * Math.cos(rot || 0), y + rx * Math.sin(rot || 0)); p.ellipse(x, y, rx, ry, rot || 0, 0, TAU); },
    dot(col, x, y, r){ const p = get(fills, col); p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); },
    line(col, w, x0, y0, x1, y1, cx, cy){ const p = get(strokes, col + '|' + w); p.moveTo(x0, y0); if(cx != null) p.quadraticCurveTo(cx, cy, x1, y1); else p.lineTo(x1, y1); },
    arc(col, w, x, y, r, a0, a1){ const p = get(strokes, col + '|' + w); p.moveTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r); p.arc(x, y, r, a0, a1); },
    flush(g, strokesFirst){
      const F = ()=> fills.forEach((p, col)=>{ g.fillStyle = col; g.fill(p); });
      const T = ()=> strokes.forEach((p, key)=>{ const [col, w] = key.split('|'); g.strokeStyle = col; g.lineWidth = +w; g.lineCap = 'round'; g.stroke(p); });
      if(strokesFirst){ T(); F(); } else { F(); T(); }
      fills.clear(); strokes.clear();
    },
  };
}

/* ---------- the ground, whole ---------- */
const C = {
  soil:'#5b3d26', soilD:'#3f2918', gravel:'#e2d5b6', gravelD:'#c9b994', kerb:'#f1ece2', kerbD:'#bdb4a3',
  yew:'#2f5f2e', yewD:'#1f4422', yewL:'#4f8a43', box:'#4c8f3c', boxD:'#2d6328', boxL:'#7cbd5c',
  lav:['#8f6fd6', '#a487e8', '#7a5bc2', '#b9a1f0'], lavStem:'#6f8a5a',
  pink:'#f7cfdd', marble:'#f4f1ea', marbleD:'#d8d1c3', granite:'#e8b8bf', graniteD:'#c98f99', gold:'#d9b247', goldL:'#f4dc84', goldD:'#a07a22',
};
const ROSES = { pink:['#f27aa3', '#ff9fc0', '#d9507f', '#ffc6d9'], gold:['#f2bd3a', '#ffd86a', '#d99a1c', '#fff0a8'], white:['#fbf7f0', '#ffffff', '#e8dfd2', '#fff7e6'], red:['#d8344a', '#f25a6a', '#a81f33', '#ff8a96'] };
/* the shapes: a bed is its rectangle less the court's round; all in the picture's squares (0,0 its top left) */
function geom(sp){
  if(sp._g) return sp._g;
  const ccx = sp.cx - sp.x0, ccy = sp.cy - sp.y0, X = (a, b)=> sp.east ? [sp.w - b, sp.w - a] : [a, b];
  const [ox0, ox1] = X(1, 4), [ix0, ix1] = X(7, 10);
  const beds = [
    { x0:ox0, x1:ox1, y0:1, y1:8, rose:'pink', n:0 }, { x0:ix0, x1:ix1, y0:1, y1:8, rose:'gold', n:1 },
    { x0:ox0, x1:ox1, y0:11, y1:18, rose:'white', n:2 }, { x0:ix0, x1:ix1, y0:11, y1:18, rose:'red', n:3 },
  ];
  /* each bed's accent (the spiral yew, the fairy) stands where the layout put it: its square's middle */
  const feats = (sp.feats || []).map(f=> ({ kind:f.kind, x:f.x - sp.x0, y:f.y - sp.y0 }));
  beds.forEach(b=>{
    const f = feats.find(f=> (f.kind === 'gTopiary' || f.kind === 'gStatue') && f.x > b.x0 && f.x < b.x1 && f.y > b.y0 && f.y < b.y1);
    b.ax = f ? f.x : (b.x0 + b.x1) / 2; b.ay = f ? f.y : (b.y0 + b.y1) / 2;
    b.trees = feats.filter(f=> f.kind === 'tree' && f.x > b.x0 && f.x < b.x1 && f.y > b.y0 && f.y < b.y1);
  });
  sp._g = { ccx, ccy, R:sp.courtR - 0.04, bedR:sp.courtR + 0.06, pondR:sp.pondR + 0.17, beds, feats };
  return sp._g;
}
/* a bed's outline, inset by `ins`: its rectangle, the side by the court cut round it */
function bedPath(g, b, G, S, ins){
  const p = new Path2D();
  const r = G.bedR + ins, x0 = b.x0 + ins, x1 = b.x1 - ins, y0 = b.y0 + ins, y1 = b.y1 - ins;
  /* the corner nearest the court: the arc from where it meets the bed's two sides */
  const cxS = G.ccx, cyS = G.ccy;
  const nearX = Math.abs(x0 - cxS) < Math.abs(x1 - cxS) ? x0 : x1, nearY = Math.abs(y0 - cyS) < Math.abs(y1 - cyS) ? y0 : y1;
  const dyA = Math.sqrt(Math.max(0, r * r - (nearX - cxS) ** 2)), dxA = Math.sqrt(Math.max(0, r * r - (nearY - cyS) ** 2));
  const pA = [nearX, cyS + Math.sign(nearY - cyS) * dyA], pB = [cxS + Math.sign(nearX - cxS) * dxA, nearY];
  /* walk the rectangle's corners, swapping the near one for the arc */
  const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const near = pts.findIndex(([x, y])=> x === nearX && y === nearY);
  const cr = Math.min(0.32, (x1 - x0) / 4);                                        // the far corners a little rounded
  const start = (near + 1) % 4;
  for(let k = 0; k < 4; k++){
    const i = (start + k) % 4, [x, y] = pts[i];
    if(i === near){
      /* from the side we came along to the arc, round, then on */
      const prev = pts[(i + 3) % 4], fromV = prev[0] === x;                       // came down a side of constant x
      const a = fromV ? pA : pB, bb = fromV ? pB : pA;
      p.lineTo(a[0] * S, a[1] * S);
      const a0 = Math.atan2(a[1] - cyS, a[0] - cxS), a1 = Math.atan2(bb[1] - cyS, bb[0] - cxS);
      let d = a1 - a0; while(d > Math.PI) d -= TAU; while(d < -Math.PI) d += TAU;
      p.arc(cxS * S, cyS * S, r * S, a0, a0 + d, d < 0);
      continue;
    }
    const prev = pts[(i + 3) % 4], next = pts[(i + 1) % 4];
    const ux = Math.sign(prev[0] - x), uy = Math.sign(prev[1] - y), vx = Math.sign(next[0] - x), vy = Math.sign(next[1] - y);
    if(k === 0) p.moveTo((x + ux * cr) * S, (y + uy * cr) * S);
    else p.lineTo((x + ux * cr) * S, (y + uy * cr) * S);
    p.quadraticCurveTo(x * S, y * S, (x + vx * cr) * S, (y + vy * cr) * S);
  }
  p.closePath();
  return p;
}
/* ---------- textures: gravel, lavender and the roses are each a seamless tile, drawn once at a size and laid as a
   pattern (a bed's thousands of leaves and petals were too many to draw for each piece of the picture) ---------- */
/* draw `fn` at (x, y) and at its copies across the tile's edges, where a shape of size `r` would show */
function wrap(W, H, x, y, r, fn){
  for(const ox of [-W, 0, W]) for(const oy of [-H, 0, H]){
    if(x + ox + r < 0 || x + ox - r > W || y + oy + r < 0 || y + oy - r > H) continue;
    fn(x + ox, y + oy);
  }
}
function patGravel(S){
  const W = 2 * S;
  return U().pic(`gp:gravel@${S}`, W, W, g=>{
    g.fillStyle = C.gravel; g.fillRect(0, 0, W, W);
    const rnd = U().rng(1717), B = batch(), B2 = batch(), cols = ['#d3c4a0', '#efe5cc', '#cbb995', '#f6eedb', '#bfae88', '#e6d8b8'];
    const n = Math.round(4 * 150 * Math.min(1, S / 90));
    for(let i = 0; i < n; i++){
      const x = rnd() * W, y = rnd() * W, r = S * (0.012 + rnd() * 0.022), q = 0.6 + rnd() * 0.3, rot = rnd() * 3, col = cols[i % cols.length];
      wrap(W, W, x, y, r, (px, py)=>{ B.ell(col, px, py, r, r * q, rot); if(i % 5 === 0) B2.dot('rgba(255,255,255,.35)', px - r * 0.3, py - r * 0.3, r * 0.35); });
    }
    B.flush(g); B2.flush(g);
  });
}
const LAV_L = C.lav.map(c=> caShade(c, 0.22)), LAV_D = C.lav.map(c=> caShade(c, -0.18));
function patLavender(S){
  const W = 2 * S;
  return U().pic(`gp:lav@${S}`, W, W, g=>{
    const rnd = U().rng(4242), B = batch(), pts = [];
    for(let i = 0; i < Math.round(4 * 380 * Math.min(1, S / 70)); i++) pts.push([rnd() * W, rnd() * W, rnd(), rnd(), i]);
    pts.forEach(([x, y, a, b], i)=>{ if(i % 2 === 0) wrap(W, W, x, y, S * 0.1, (px, py)=> B.ell(i % 4 ? '#7c9670' : '#6a865f', px, py, S * (0.06 + a * 0.03), S * 0.035, b * 3)); });
    B.flush(g);
    pts.sort((p, q)=> p[1] - q[1]);
    const per = Math.ceil(pts.length / 3), sw = Math.max(1, S * 0.009);
    for(let band = 0; band < 3; band++){
      pts.slice(band * per, (band + 1) * per).forEach(([x, y, a, b, i])=>{
        const hgt = (0.12 + a * 0.1) * S, lean = (b - 0.5) * 0.07 * S, col = C.lav[i % 4];
        wrap(W, W, x, y, hgt + S * 0.05, (px, py)=>{
          B.line(C.lavStem, sw, px, py, px + lean, py - hgt, px + lean * 0.3, py - hgt * 0.5);
          for(let q = 0; q < 6; q++) B.ell(q < 2 ? LAV_L[i % 4] : q > 4 ? LAV_D[i % 4] : col, px + lean * (1 - q * 0.08) + (q % 2 ? 1 : -1) * S * 0.006, py - hgt + q * S * 0.018, S * 0.014, S * 0.016, 0);
        });
      });
      B.flush(g, true);                                   // the stems under their flowers
    }
  });
}
function patRoses(S, rose){
  const W = 3 * S, cols = ROSES[rose];
  return U().pic(`gp:rose:${rose}@${S}`, W, W, g=>{
    const rnd = U().rng(rose.length * 977 + 5), B = batch(), dens = Math.min(1, S / 70);
    const LEAF = ['#24561f', '#2f6a2c', '#3a7a33', '#2a5f27', '#447f3a'];
    for(let i = 0; i < Math.round(9 * 170 * dens); i++){
      const x = rnd() * W, y = rnd() * W, a = rnd(), b = rnd(), c = rnd();
      wrap(W, W, x, y, S * 0.09, (px, py)=> B.ell(LEAF[i % 5], px, py, S * (0.05 + a * 0.035), S * (0.032 + b * 0.02), c * 3));
    }
    B.flush(g);
    const bush = [];
    for(let i = 0; i < Math.round(9 * 46 * dens); i++) bush.push([rnd() * W, rnd() * W, rnd(), rnd()]);
    bush.sort((a, b)=> a[1] - b[1]);
    const per = Math.ceil(bush.length / 3);
    for(let band = 0; band < 3; band++){
      const part = bush.slice(band * per, (band + 1) * per);
      part.forEach(([x, y, q, seed])=>{
        const r2 = U().rng(Math.floor(seed * 1e9)), r = S * (0.08 + q * 0.05), leaves = [];
        for(let k = 0; k < 6; k++){ const a = r2() * TAU, d = r2() * r * 0.6; leaves.push([a, d]); }
        wrap(W, W, x, y, r * 1.6, (px, py)=>{
          B.ell('rgba(10,25,8,.32)', px + r * 0.3, py + r * 0.4, r * 1.0, r * 0.55, 0);
          leaves.forEach(([a, d])=>{ const lit = -(Math.cos(a) + Math.sin(a)) * d / Math.max(1, r);
            B.ell(lit > 0.15 ? '#5a9e4a' : lit < -0.2 ? '#2a5f27' : '#3f8037', px + Math.cos(a) * d, py + Math.sin(a) * d * 0.7 - r * 0.2, r * 0.42, r * 0.28, a); });
        });
      });
      B.flush(g);
      part.forEach(([x, y, q, seed])=>{
        const r2 = U().rng(Math.floor(seed * 1e9) + 1), r = S * (0.08 + q * 0.05), fl = 2 + Math.floor(r2() * 3), fls = [];
        for(let f = 0; f < fl; f++) fls.push([(r2() - 0.5) * r * 1.3, -r * 0.25 + (r2() - 0.5) * r * 0.9, S * (0.034 + r2() * 0.02)]);
        wrap(W, W, x, y, r * 1.6, (px, py)=> fls.forEach(([dx, dy, fr])=> roseFlower(B, px + dx, py + dy, fr, cols)));
      });
      B.flush(g);
    }
  });
}
/* gravel over a rectangle of the picture */
function gravel(g, S, x0, y0, x1, y1){ g.fillStyle = g.createPattern(patGravel(S), 'repeat'); g.fillRect(x0 * S, y0 * S, (x1 - x0) * S, (y1 - y0) * S); }
/* the round court: rings of stone about the pond — pink granite setts, a ring of marble flags, a band of gold stone,
   a kerb */
function court(g, S, G){
  const cx = G.ccx * S, cy = G.ccy * S;
  const ring = (r0, r1, len, cols, gap, hi)=>{
    const rm = (r0 + r1) / 2, n = Math.max(8, Math.round(TAU * rm / len));
    for(let i = 0; i < n; i++){
      const a0 = i / n * TAU + gap / rm, a1 = (i + 1) / n * TAU - gap / rm;
      g.fillStyle = cols[(i * 7 + Math.floor(r0 * 10)) % cols.length];
      g.beginPath(); g.arc(cx, cy, (r1 - gap) * S, a0, a1); g.arc(cx, cy, (r0 + gap) * S, a1, a0, true); g.closePath(); g.fill();
      if(hi){ g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = Math.max(1, S * 0.012); g.beginPath(); g.arc(cx, cy, (r1 - gap * 1.6) * S, a0 + 0.02, a1 - 0.02); g.stroke(); }
    }
  };
  /* the mortar under it all */
  g.fillStyle = '#b9ad97'; g.beginPath(); g.arc(cx, cy, (G.R + 0.02) * S, 0, TAU); g.fill();
  const r0 = G.pondR - 0.05, span = G.R - r0;
  ring(r0, r0 + span * 0.24, 0.2, [C.granite, '#f0c6cc', '#dda4ad', '#f5d3d8'], 0.012, true);
  ring(r0 + span * 0.24, r0 + span * 0.62, 0.5, [C.marble, '#ebe6db', '#f8f5ef', '#e4ddcf'], 0.014, true);
  ring(r0 + span * 0.62, r0 + span * 0.8, 0.18, ['#e7cf86', '#d9b960', '#f0dc9c', '#cfae55'], 0.012, true);
  ring(r0 + span * 0.8, G.R, 0.42, [C.kerb, '#e6e0d2', '#f7f3ea'], 0.016, false);
  /* a star of pink inlaid in the marble ring at the four walks */
  for(let i = 0; i < 4; i++){
    const a = i * Math.PI / 2, r = r0 + span * 0.43, x = cx + Math.cos(a) * r * S, y = cy + Math.sin(a) * r * S;
    g.fillStyle = '#e79cb0'; g.beginPath();
    for(let j = 0; j < 8; j++){ const rr = (j % 2 ? 0.07 : 0.17) * S, b = j / 8 * TAU + a; g.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); }
    g.closePath(); g.fill();
    g.fillStyle = C.goldL; g.beginPath(); g.arc(x, y, S * 0.035, 0, TAU); g.fill();
  }
  /* the light across it: brighter up and to the left */
  const lg = g.createLinearGradient(cx - G.R * S, cy - G.R * S, cx + G.R * S, cy + G.R * S);
  lg.addColorStop(0, 'rgba(255,250,235,.16)'); lg.addColorStop(1, 'rgba(40,30,50,.10)');
  g.fillStyle = lg; g.beginPath(); g.arc(cx, cy, G.R * S, 0, TAU); g.fill();
}
/* a kerb of marble along a path's edge: stones end to end, each with its lit top edge */
function kerbAlong(g, S, path, wid){
  g.save();
  g.lineJoin = 'round';
  g.strokeStyle = 'rgba(60,45,30,.28)'; g.lineWidth = (wid + 0.03) * S; g.setLineDash([]); g.translate(S * 0.02, S * 0.03); g.stroke(path); g.translate(-S * 0.02, -S * 0.03);
  g.strokeStyle = C.kerbD; g.lineWidth = wid * S; g.stroke(path);
  g.strokeStyle = C.kerb; g.lineWidth = wid * S * 0.72; g.stroke(path);
  g.strokeStyle = 'rgba(150,140,125,.55)'; g.lineWidth = wid * S; g.setLineDash([Math.max(1, S * 0.012), S * 0.3]); g.stroke(path);   // the joints
  g.restore();
}
/* a low box hedge along a path: its shadow, its sides, its clipped top with the light on it, leaves */
function boxAlong(g, S, path, wid, rnd, o){
  o = o || {};
  const hgt = (o.h || 0.12) * S;
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(25,30,15,.30)'; g.lineWidth = (wid + 0.05) * S; g.translate(S * 0.05, S * 0.06); g.stroke(path); g.translate(-S * 0.05, -S * 0.06);
  g.strokeStyle = C.boxD; g.lineWidth = wid * S; g.stroke(path);                          // its sides
  g.translate(0, -hgt);
  g.strokeStyle = C.box; g.lineWidth = wid * S * 0.92; g.stroke(path);                    // its top
  g.translate(-S * 0.012, -S * 0.012);
  g.strokeStyle = C.boxL; g.lineWidth = wid * S * 0.38; g.globalAlpha = 0.55; g.stroke(path);
  g.globalAlpha = 1;
  /* the leaves: tiny dots along it */
  g.setLineDash([Math.max(1, S * 0.012), S * 0.035]);
  g.strokeStyle = 'rgba(160,215,120,.55)'; g.lineWidth = wid * S * 0.6; g.stroke(path);
  g.setLineDash([Math.max(1, S * 0.01), S * 0.05]); g.lineDashOffset = S * 0.02;
  g.strokeStyle = 'rgba(25,60,20,.45)'; g.lineWidth = wid * S * 0.85; g.stroke(path);
  g.restore();
}
/* a rose open on its bush: its shade, its petals in a whorl, the light on its upper left (into a batch) */
const ROSE_SH = {}, ROSE_ED = {};
function roseFlower(B, fx, fy, fr, cols){
  B.dot(ROSE_SH[cols[0]] || (ROSE_SH[cols[0]] = shade(cols[2], -0.12)), fx + fr * 0.18, fy + fr * 0.22, fr);
  B.dot(cols[0], fx, fy, fr);
  const ew = Math.max(0.5, Math.round(fr * 0.14 * 4) / 4), iw = Math.max(0.6, Math.round(fr * 0.2 * 4) / 4), edge = ROSE_ED[cols[0]] || (ROSE_ED[cols[0]] = shade(cols[0], -0.12));
  for(let p = 0; p < 5; p++){ const b = p / 5 * TAU + 0.3; B.arc(edge, ew, fx + Math.cos(b) * fr * 0.55, fy + Math.sin(b) * fr * 0.55, fr * 0.5, b - 1.1, b + 1.1); }
  B.arc(cols[2], iw, fx + fr * 0.06, fy + fr * 0.05, fr * 0.5, 0.5, 4.7);
  B.arc(cols[2], iw, fx + fr * 0.03, fy + fr * 0.03, fr * 0.24, 2.4, 7.8);
  B.dot(cols[3], fx - fr * 0.36, fy - fr * 0.38, fr * 0.3);
}
/* white alyssum: a soft carpet of tiny flowers */
function alyssum(g, S, cx, cy, r, rnd){
  g.fillStyle = '#4f7f3c'; g.beginPath(); g.arc(cx * S, cy * S, r * S, 0, TAU); g.fill();
  const n = Math.round(r * r * Math.min(1, S / 70) * 700), B = batch();
  for(let i = 0; i < n; i++){
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.96, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    B.dot(i % 6 ? '#fbfbf4' : '#e9dff5', x * S, y * S, S * (0.012 + rnd() * 0.01));
  }
  B.flush(g);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc((cx - r * 0.3) * S, (cy - r * 0.3) * S, r * 0.5 * S, 0, TAU); g.fill();
}
/* the soil of a bed, dark */
function soil(g, S, path){ g.fillStyle = C.soil; g.fill(path); }
/* the yew hedge round the garden: each of its squares a block of clipped yew, its top lit, its south face where the
   hedge ends to the south, the piers by the gates a little proud; its shadow down and to the right */
function yew(g, S, sp, view){
  const isH = (lx, ly)=>{
    if(lx < 0 || ly < 0 || lx >= sp.w || ly >= sp.h) return false;
    const m = caGrounds(); return caAt(m, sp.x0 + lx, sp.y0 + ly) === CA_T.HEDGE;
  };
  const cells = [];
  for(let ly = 0; ly < sp.h; ly++) for(let lx = 0; lx < sp.w; lx++) if(isH(lx, ly) && lx >= view.x0 - 1 && lx <= view.x1 && ly >= view.y0 - 1 && ly <= view.y1) cells.push([lx, ly]);
  const TOP = 0.58;                                   // how much of a square its top takes where its south face shows
  /* the shadows first, all of them as one (no darker seams where they overlap) */
  const shp = new Path2D();
  cells.forEach(([lx, ly])=> shp.rect((lx + 0.2) * S, (ly + 0.28) * S, S, S));
  g.fillStyle = 'rgba(20,30,12,.34)'; g.fill(shp);
  cells.forEach(([lx, ly])=>{
    const s = isH(lx, ly + 1), n = isH(lx, ly - 1), w = isH(lx - 1, ly), e = isH(lx + 1, ly);
    const rnd = U().rng(lx * 131 + ly * 977 + sp.side * 7);
    const x = lx * S, y = ly * S, topH = s ? S : TOP * S;
    const endW = !w, endE = !e;
    const r = S * 0.16;
    /* its top */
    const tg = g.createLinearGradient(x, y, x + S, y + topH);
    tg.addColorStop(0, shade(C.yew, 0.16)); tg.addColorStop(1, shade(C.yew, -0.06));
    g.fillStyle = tg;
    g.beginPath();
    if(g.roundRect) g.roundRect(x + (endW ? S * 0.04 : 0), y + (n ? 0 : S * 0.02), S - (endW ? S * 0.04 : 0) - (endE ? S * 0.04 : 0), topH - (n ? 0 : S * 0.02) + (s ? 0 : 1), [endW && !n ? r : 0, endE && !n ? r : 0, 0, 0]);
    else g.rect(x, y, S, topH);
    g.fill();
    /* its leaves: small clipped tufts, lighter to the upper left */
    const nT = Math.round(Math.min(1, S / 80) * 70), B = batch();
    for(let i = 0; i < nT; i++){
      const px = x + (endW ? 0.06 : 0) * S + rnd() * S * (1 - (endW ? 0.06 : 0) - (endE ? 0.06 : 0)), py = y + rnd() * (topH - S * 0.03) + S * 0.02;
      const lit = 1 - ((px - x) / S + (py - y) / Math.max(1, topH)) / 2;
      B.ell(lit > 0.55 ? (i % 2 ? '#5e9c4c' : '#4b8a3f') : (i % 2 ? '#3a7034' : '#2a5a29'), px, py, S * (0.03 + rnd() * 0.03), S * (0.022 + rnd() * 0.02), rnd() * 3);
    }
    B.flush(g);
    /* the edges: rounded off, the right darker */
    if(endE){ const eg = g.createLinearGradient(x + S * 0.8, 0, x + S, 0); eg.addColorStop(0, 'rgba(10,25,8,0)'); eg.addColorStop(1, 'rgba(10,25,8,.35)'); g.fillStyle = eg; g.fillRect(x + S * 0.8, y, S * 0.2, topH); }
    if(endW){ g.fillStyle = 'rgba(200,240,170,.16)'; g.fillRect(x + S * 0.04, y + S * 0.02, S * 0.08, topH - S * 0.04); }
    if(!n){ g.fillStyle = 'rgba(210,245,180,.22)'; g.fillRect(x + S * 0.08, y + S * 0.02, S * 0.84, S * 0.06); }
    /* its south face, where the hedge ends */
    if(!s){
      const fy = y + topH, fh = S - topH;
      const fg = g.createLinearGradient(0, fy, 0, fy + fh);
      fg.addColorStop(0, shade(C.yew, -0.22)); fg.addColorStop(1, shade(C.yew, -0.45));
      g.fillStyle = fg;
      g.beginPath(); if(g.roundRect) g.roundRect(x + (endW ? S * 0.04 : 0), fy - 1, S - (endW ? S * 0.04 : 0) - (endE ? S * 0.04 : 0), fh, [0, 0, endE ? r * 0.6 : 0, endW ? r * 0.6 : 0]); else g.rect(x, fy, S, fh); g.fill();
      for(let i = 0; i < nT * 0.5; i++){
        const px = x + rnd() * S, py = fy + rnd() * fh * 0.95;
        B.ell(i % 2 ? 'rgba(70,120,55,.55)' : 'rgba(10,30,8,.35)', px, py, S * (0.025 + rnd() * 0.025), S * 0.018, 0);
      }
      B.flush(g);
      g.fillStyle = 'rgba(205,240,170,.25)'; g.fillRect(x + S * 0.06, fy, S * 0.88, Math.max(1, S * 0.015));   // the top's clipped edge
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + S * 0.04, y + S - Math.max(1, S * 0.02), S * 0.92, Math.max(1, S * 0.02));
    }
  });
}
/* petals fallen from the blossom: on the walks and the court under the north trees */
function petals(g, S, G, view, rnd){
  const B = batch();
  G.feats.filter(f=> f.kind === 'tree').forEach((f, ti)=>{
    const r2 = U().rng(Math.round(f.x * 31 + f.y * 17));
    for(let i = 0; i < 70; i++){
      const a = r2() * TAU, d = 0.6 + r2() * 2.6, x = f.x + Math.cos(a) * d * 1.1 + 0.4, y = f.y + Math.sin(a) * d * 0.8 + 0.6;
      if(x < view.x0 || x > view.x1 || y < view.y0 || y > view.y1) continue;
      B.ell(['#f7c6d8', '#f2a7c3', '#fde3ec'][i % 3], x * S, y * S, S * 0.03, S * 0.018, r2() * 3);
    }
  });
  B.flush(g);
}
/* the whole ground of garden `sp`, at `S` a square, `view`: the squares this piece shows (and a little round) */
function drawGround(g, S, sp, view){
  const G = geom(sp), rnd = U().rng(sp.side * 101 + 7);
  /* under it all: the beds' soil colour, so nothing shows through */
  g.fillStyle = '#4d7a3a'; g.fillRect(0, 0, sp.w * S, sp.h * S);
  /* the walks: gravel all over the inside first (the court and the beds go over it), and out through the gates */
  gravel(g, S, 0.5, 0.5, sp.w - 0.5, sp.h - 0.5); gravel(g, S, 4, 0, 7, 0.5); gravel(g, S, 4, sp.h - 0.5, 7, sp.h);
  gravel(g, S, 0, 8, 0.5, 11); gravel(g, S, sp.w - 0.5, 8, sp.w, 11);
  /* the rake's lines, faint, along the walks */
  g.strokeStyle = 'rgba(150,130,95,.12)'; g.lineWidth = Math.max(1, S * 0.012);
  for(let yy = 0.12; yy < sp.h; yy += 0.25){ g.beginPath(); g.moveTo(4.05 * S, yy * S); g.lineTo(6.95 * S, (yy + 0.01) * S); g.stroke(); }
  for(let xx = 0.12; xx < sp.w; xx += 0.25){ if(xx > 4 && xx < 7) continue; g.beginPath(); g.moveTo(xx * S, 8.05 * S); g.lineTo((xx + 0.01) * S, 10.95 * S); g.stroke(); }
  /* a marble threshold at each gate */
  const sill = (x0, y0, x1, y1)=>{ g.fillStyle = C.marbleD; g.fillRect(x0 * S, y0 * S, (x1 - x0) * S, (y1 - y0) * S); g.fillStyle = C.marble; g.fillRect(x0 * S, y0 * S, (x1 - x0) * S, (y1 - y0) * S * 0.7);
    g.strokeStyle = 'rgba(150,140,125,.5)'; g.lineWidth = Math.max(1, S * 0.01); for(let i = 1; i < 3; i++){ const xx = x1 - x0 > y1 - y0; g.beginPath(); if(xx){ g.moveTo((x0 + (x1 - x0) * i / 3) * S, y0 * S); g.lineTo((x0 + (x1 - x0) * i / 3) * S, y1 * S); } else { g.moveTo(x0 * S, (y0 + (y1 - y0) * i / 3) * S); g.lineTo(x1 * S, (y0 + (y1 - y0) * i / 3) * S); } g.stroke(); } };
  sill(4, 0.25, 7, 0.75); sill(4, sp.h - 0.75, 7, sp.h - 0.25); sill(0.25, 8, 0.75, 11); sill(sp.w - 0.75, 8, sp.w - 0.25, 11);
  /* the court */
  court(g, S, G);
  /* the beds */
  G.beds.forEach(b=>{
    if(b.x1 < view.x0 - 1 || b.x0 > view.x1 + 1 || b.y1 < view.y0 - 1 || b.y0 > view.y1 + 1) return;
    const r2 = U().rng(b.n * 977 + sp.side * 31 + 5);
    const outer = bedPath(g, b, G, S, 0);
    kerbAlong(g, S, outer, 0.1);
    const bed = bedPath(g, b, G, S, 0.05);
    soil(g, S, bed);
    g.save(); g.clip(bed);
    /* lavender inside the box all round, then a second line of box, then the roses */
    g.fillStyle = g.createPattern(patLavender(S), 'repeat'); g.fill(bed);
    const inner = bedPath(g, b, G, S, 0.6);
    g.fillStyle = shade(C.soil, -0.05); g.fill(inner);
    g.fillStyle = g.createPattern(patRoses(S, b.rose), 'repeat'); g.fill(inner);
    boxAlong(g, S, inner, 0.12, r2, { h:0.08 });
    /* the accent's ring of alyssum in its ring of box, and a little ring round each tree */
    const ar = 0.62;
    g.fillStyle = shade(C.soil, -0.1); g.beginPath(); g.arc(b.ax * S, b.ay * S, (ar + 0.08) * S, 0, TAU); g.fill();
    alyssum(g, S, b.ax, b.ay, ar, r2);
    const ring = new Path2D(); ring.arc(b.ax * S, b.ay * S, (ar + 0.05) * S, 0, TAU);
    boxAlong(g, S, ring, 0.1, r2, { h:0.07 });
    g.restore();
    boxAlong(g, S, bedPath(g, b, G, S, 0.16), 0.17, r2, { h:0.12 });
  });
  petals(g, S, G, view, rnd);
  /* the yew hedge round it all, over its own shadow */
  yew(g, S, sp, view);
}
/* one square of a garden ('gdn:<side>:<dx>:<dy>') into (px, py, pw, ph) */
function slice(ctx, key, S, px, py, pw, ph){
  const p = key.split(':'), side = +p[1], dx = +p[2], dy = +p[3];
  const sp = spec(side);
  if(!sp) return;
  const s = Math.max(8, Math.min(U().PIC_MAX_S, Math.round(S)));
  const cx = Math.floor(dx / CHUNK), cy = Math.floor(dy / CHUNK);
  const cw = Math.min(CHUNK, sp.w - cx * CHUNK), chh = Math.min(CHUNK, sp.h - cy * CHUNK);
  const cv = U().pic(`gdn:${side}:${cx},${cy}@${s}`, cw * s + 2 * RIM, chh * s + 2 * RIM, g=>{
    g.translate(RIM - cx * CHUNK * s, RIM - cy * CHUNK * s);
    drawGround(g, s, sp, { x0:cx * CHUNK - 0.6, y0:cy * CHUNK - 0.6, x1:cx * CHUNK + cw + 0.6, y1:cy * CHUNK + chh + 0.6 });
  });
  ctx.drawImage(cv, RIM + (dx - cx * CHUNK) * s, RIM + (dy - cy * CHUNK) * s, s, s, px, py, pw, ph);
}

/* ---------- what stands up ---------- */
/* a blossom tree: a gnarled trunk splitting into its limbs, the crown a dome of clouds of flowers, lit from the upper
   left, darker in under; a few fresh leaves; `flip` turns its lean the other way */
function drawBlossom(g, d, x, y, w, h, k){
  const rnd = U().rng(Math.round(d.x * 53 + d.y * 29) + 11), f = d.flip ? -1 : 1;
  const cx = x + w / 2, base = y + h - 0.06 * k;
  g.fillStyle = 'rgba(30,25,15,.24)'; g.beginPath(); g.ellipse(cx + 0.35 * k, base + 0.02 * k, 1.2 * k, 0.32 * k, 0, 0, TAU); g.fill();
  /* the trunk and limbs */
  const bark = '#5d3d26', barkD = '#3e2716', barkL = '#87613f';
  const limb = (x0, y0, x1, y1, w0, w1, bend)=>{
    const mx = (x0 + x1) / 2 + bend * k, my = (y0 + y1) / 2;
    g.fillStyle = bark; g.beginPath();
    g.moveTo(x0 - w0 / 2, y0); g.quadraticCurveTo(mx - (w0 + w1) / 4, my, x1 - w1 / 2, y1); g.lineTo(x1 + w1 / 2, y1); g.quadraticCurveTo(mx + (w0 + w1) / 4, my, x0 + w0 / 2, y0); g.closePath(); g.fill();
    g.strokeStyle = barkL; g.lineWidth = Math.max(1, w1 * 0.3); g.beginPath(); g.moveTo(x0 - w0 * 0.25, y0); g.quadraticCurveTo(mx - (w0 + w1) / 6, my, x1 - w1 * 0.2, y1); g.stroke();
    g.strokeStyle = barkD; g.lineWidth = Math.max(1, w1 * 0.25); g.beginPath(); g.moveTo(x0 + w0 * 0.3, y0); g.quadraticCurveTo(mx + (w0 + w1) / 6, my, x1 + w1 * 0.25, y1); g.stroke();
  };
  const fork = base - 1.15 * k;
  limb(cx, base, cx + f * 0.08 * k, fork, 0.3 * k, 0.2 * k, f * 0.08);
  /* its root flare */
  g.fillStyle = bark; g.beginPath(); g.ellipse(cx, base - 0.04 * k, 0.24 * k, 0.07 * k, 0, 0, TAU); g.fill();
  const limbs = [[-0.75, -0.95, 0.13, -0.1], [-0.15, -1.3, 0.12, 0.05], [0.55, -1.0, 0.12, 0.12], [0.95, -0.55, 0.09, 0.1], [-1.05, -0.45, 0.08, -0.08]];
  limbs.forEach(([dx, dy, lw, bend])=> limb(cx + f * 0.08 * k, fork, cx + f * dx * k, fork + dy * k, 0.18 * k, lw * k, f * bend));
  /* the crown: clouds of blossom over the limbs, back to front, lit from the upper left */
  const cy = fork - 0.75 * k, R = 1.35 * k;
  const pinks = ['#f7c3d6', '#f2a7c3', '#fbd9e6', '#e889ad', '#fde9f1', '#d97399'];
  const clouds = [];
  for(let i = 0; i < 26; i++){
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.78;
    clouds.push([cx + f * 0.06 * k + Math.cos(a) * d * 1.08, cy + Math.sin(a) * d * 0.72, (0.28 + rnd() * 0.2) * k]);
  }
  clouds.sort((p, q)=> p[1] - q[1]);
  /* the under side first: the darker mass */
  g.fillStyle = '#c86d93'; g.beginPath(); g.ellipse(cx + f * 0.06 * k, cy + 0.12 * k, R * 1.02, R * 0.66, 0, 0, TAU); g.fill();
  clouds.forEach(([px, py, r])=>{
    const lit = Math.max(0, Math.min(1, 0.55 - ((px - cx) / R) * 0.35 - ((py - cy) / R) * 0.5));
    /* the cloud's own shade: a darker ball under it, then the flowers, thick on its lit side */
    g.fillStyle = lit > 0.5 ? '#e48fb2' : '#cf6f97'; g.beginPath(); g.ellipse(px + r * 0.08, py + r * 0.1, r * 0.98, r * 0.86, 0, 0, TAU); g.fill();
    for(let j = 0; j < 46; j++){
      const a = rnd() * TAU, dd = Math.sqrt(rnd()) * r * 0.95, qx = px + Math.cos(a) * dd - r * 0.08, qy = py + Math.sin(a) * dd * 0.85 - r * 0.08;
      const up = ((qx - px) + (qy - py)) / (1.6 * r);                   // -1 upper left … +1 lower right
      const t = Math.max(0, Math.min(5, Math.round((1 - lit) * 2.4 + up * 2.2 + rnd() * 0.9)));
      g.fillStyle = [pinks[4], pinks[2], pinks[0], pinks[1], pinks[3], pinks[5]][t];
      g.beginPath(); g.arc(qx, qy, k * (0.045 + rnd() * 0.035), 0, TAU); g.fill();
    }
    /* a few whole flowers on its lit side */
    for(let j = 0; j < 4; j++){
      const qx = px - r * 0.4 + rnd() * r * 0.5, qy = py - r * 0.45 + rnd() * r * 0.4, fr = k * 0.045;
      g.fillStyle = '#fff4f8';
      for(let p = 0; p < 5; p++){ const b = p / 5 * TAU; g.beginPath(); g.arc(qx + Math.cos(b) * fr, qy + Math.sin(b) * fr, fr * 0.7, 0, TAU); g.fill(); }
      g.fillStyle = '#e0607f'; g.beginPath(); g.arc(qx, qy, fr * 0.4, 0, TAU); g.fill();
    }
  });
  /* fresh leaves among the flowers */
  for(let i = 0; i < 18; i++){ const a = rnd() * TAU, dd = Math.sqrt(rnd()) * R * 0.85; g.fillStyle = i % 2 ? '#7fb24a' : '#9cc95e'; g.beginPath(); g.ellipse(cx + Math.cos(a) * dd, cy + Math.sin(a) * dd * 0.66, 0.05 * k, 0.025 * k, a, 0, TAU); g.fill(); }
}
/* a cypress: a tall flame of dark green, scaled and tufted, lit on its left */
function drawCypress(g, d, x, y, w, h, k){
  const rnd = U().rng(Math.round(d.x * 41 + d.y * 23) + 3);
  const cx = x + w / 2, base = y + h - 0.06 * k, top = y + 0.08 * k, W = w * 0.36;
  g.fillStyle = 'rgba(30,25,15,.26)'; g.beginPath(); g.ellipse(cx + 0.4 * k, base, 0.55 * k, 0.16 * k, 0, 0, TAU); g.fill();
  g.fillStyle = '#4a3220'; g.fillRect(cx - 0.05 * k, base - 0.3 * k, 0.1 * k, 0.3 * k);
  const shape = new Path2D();
  shape.moveTo(cx, top);
  shape.bezierCurveTo(cx + W * 0.9, top + (base - top) * 0.25, cx + W * 1.05, top + (base - top) * 0.72, cx + W * 0.55, base - 0.22 * k);
  shape.quadraticCurveTo(cx, base - 0.1 * k, cx - W * 0.55, base - 0.22 * k);
  shape.bezierCurveTo(cx - W * 1.05, top + (base - top) * 0.72, cx - W * 0.9, top + (base - top) * 0.25, cx, top);
  const gr = g.createLinearGradient(cx - W, 0, cx + W, 0);
  gr.addColorStop(0, '#3f7a3a'); gr.addColorStop(0.45, '#2b5a2c'); gr.addColorStop(1, '#173b1b');
  g.fillStyle = gr; g.fill(shape);
  g.save(); g.clip(shape);
  for(let i = 0; i < 240; i++){
    const yy = top + rnd() * (base - top), half = W * Math.sin(Math.PI * Math.min(1, (yy - top) / (base - top) * 0.92 + 0.04)) * 1.05;
    const xx = cx + (rnd() * 2 - 1) * half, lit = (cx - xx) / Math.max(1, half);
    g.fillStyle = lit > 0.3 ? (i % 2 ? '#5a964a' : '#4a8540') : lit > -0.3 ? (i % 2 ? '#326a31' : '#2a5a2a') : (i % 2 ? '#1c461e' : '#163a19');
    g.beginPath(); g.ellipse(xx, yy, 0.07 * k, 0.045 * k, (rnd() - 0.5) * 0.8, Math.PI, TAU); g.fill();
  }
  g.restore();
  g.strokeStyle = 'rgba(200,240,170,.2)'; g.lineWidth = Math.max(1, 0.03 * k); g.beginPath(); g.moveTo(cx - W * 0.2, top + 0.2 * k); g.quadraticCurveTo(cx - W * 0.85, top + (base - top) * 0.45, cx - W * 0.6, base - 0.4 * k); g.stroke();
}
/* a spiral yew (n 0) or three clipped balls one over another (n 1), standing in its ring of alyssum */
function drawTopiary(g, d, x, y, w, h, k){
  const rnd = U().rng(Math.round(d.x * 17 + d.y * 13) + 1);
  const cx = x + w / 2, base = y + h - 0.12 * k;
  g.fillStyle = 'rgba(25,30,15,.28)'; g.beginPath(); g.ellipse(cx + 0.18 * k, base + 0.02 * k, 0.42 * k, 0.12 * k, 0, 0, TAU); g.fill();
  g.fillStyle = '#4a3220'; g.fillRect(cx - 0.04 * k, base - 0.25 * k, 0.08 * k, 0.25 * k);
  const ball = (bx, by, r)=>{
    const gr = g.createRadialGradient(bx - r * 0.35, by - r * 0.4, r * 0.1, bx, by, r);
    gr.addColorStop(0, '#6fae55'); gr.addColorStop(0.6, '#3f7d37'); gr.addColorStop(1, '#22501f');
    g.fillStyle = gr; g.beginPath(); g.arc(bx, by, r, 0, TAU); g.fill();
    for(let i = 0; i < 60 * r / k; i++){ const a = rnd() * TAU, dd = Math.sqrt(rnd()) * r * 0.92, px = bx + Math.cos(a) * dd, py = by + Math.sin(a) * dd; const lit = ((bx - px) + (by - py)) / r;
      g.fillStyle = lit > 0.3 ? 'rgba(160,215,120,.55)' : lit < -0.4 ? 'rgba(10,35,10,.4)' : 'rgba(70,130,55,.5)'; g.beginPath(); g.arc(px, py, k * (0.02 + rnd() * 0.02), 0, TAU); g.fill(); }
  };
  if((d.n || 0) % 2 === 0){
    /* the spiral: a cone of yew with a groove winding up it */
    const top = y + 0.12 * k, bw = 0.5 * k, H = base - 0.22 * k - top;
    const cone = new Path2D(); cone.moveTo(cx, top); cone.quadraticCurveTo(cx + bw * 0.55, top + H * 0.5, cx + bw, base - 0.22 * k); cone.quadraticCurveTo(cx, base - 0.08 * k, cx - bw, base - 0.22 * k); cone.quadraticCurveTo(cx - bw * 0.55, top + H * 0.5, cx, top);
    const gr = g.createLinearGradient(cx - bw, 0, cx + bw, 0); gr.addColorStop(0, '#5a9a48'); gr.addColorStop(0.5, '#336e30'); gr.addColorStop(1, '#1b441c');
    g.fillStyle = gr; g.fill(cone);
    g.save(); g.clip(cone);
    /* the groove winding up it: on its front half, a dark cut with the lit edge of the turn above it */
    const turns = 4.5, foot = base - 0.22 * k, steps = 220;
    const at = (u)=>{ const th = u * turns * TAU, half = bw * (1 - u) * 1.02; return [cx + Math.sin(th) * half, foot - u * H + Math.cos(th) * 0.07 * k * (1 - u), Math.cos(th)]; };
    const groove = (col, wdt, dy)=>{
      g.strokeStyle = col; g.lineCap = 'round';
      for(let i = 0; i < steps; i++){
        const u0 = i / steps, u1 = (i + 1) / steps, [x0, y0, c0] = at(u0), [x1, y1] = at(u1);
        if(c0 < 0.05) continue;                                   // the far side
        g.lineWidth = Math.max(1, wdt * k * (1 - u0 * 0.6)); g.beginPath(); g.moveTo(x0, y0 + dy * k); g.lineTo(x1, y1 + dy * k); g.stroke();
      }
    };
    groove('rgba(8,28,8,.62)', 0.07, 0);
    groove('rgba(160,215,120,.38)', 0.03, -0.045);
    for(let i = 0; i < 90; i++){ const yy = top + rnd() * H, half = bw * (yy - top) / H, px = cx + (rnd() * 2 - 1) * half, lit = (cx - px) / Math.max(1, half);
      g.fillStyle = lit > 0.3 ? 'rgba(170,220,130,.5)' : lit < -0.4 ? 'rgba(10,30,10,.4)' : 'rgba(80,140,60,.45)'; g.beginPath(); g.arc(px, yy, k * (0.02 + rnd() * 0.015), 0, TAU); g.fill(); }
    g.restore();
    /* a gold finial: a little star */
    g.fillStyle = C.gold; g.beginPath(); for(let i = 0; i < 10; i++){ const r = i % 2 ? 0.04 * k : 0.1 * k, a = i / 10 * TAU - Math.PI / 2; g.lineTo(cx + Math.cos(a) * r, top - 0.06 * k + Math.sin(a) * r); } g.fill();
    g.fillStyle = C.goldL; g.beginPath(); g.arc(cx - 0.02 * k, top - 0.08 * k, 0.025 * k, 0, TAU); g.fill();
  } else {
    ball(cx, base - 0.42 * k, 0.36 * k);
    g.fillStyle = '#4a3220'; g.fillRect(cx - 0.03 * k, base - 1.05 * k, 0.06 * k, 0.3 * k);
    ball(cx, base - 1.08 * k, 0.27 * k);
    g.fillStyle = '#4a3220'; g.fillRect(cx - 0.025 * k, base - 1.55 * k, 0.05 * k, 0.25 * k);
    ball(cx, base - 1.58 * k, 0.19 * k);
    g.fillStyle = C.gold; g.beginPath(); g.arc(cx, base - 1.83 * k, 0.05 * k, 0, TAU); g.fill();
  }
}
/* a marble fairy on her pedestal: n 0 playing a little harp, n 1 holding a star up; marble white, blue-grey in shade,
   gold on her star and the pedestal's band */
function drawStatue(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h - 0.1 * k, n = (d.n || 0) % 2;
  const M = '#f6f3ec', MD = '#c9c4ba', MS = '#a8a39b';
  g.fillStyle = 'rgba(25,25,15,.28)'; g.beginPath(); g.ellipse(cx + 0.25 * k, base + 0.02 * k, 0.5 * k, 0.13 * k, 0, 0, TAU); g.fill();
  /* the pedestal: a plinth, a die with a gold band, a cap */
  const ped = (x0, y0, ww, hh, col)=>{ g.fillStyle = col; g.fillRect(x0, y0, ww, hh); };
  const pw = 0.62 * k;
  ped(cx - pw / 2 - 0.06 * k, base - 0.14 * k, pw + 0.12 * k, 0.14 * k, MD);
  ped(cx - pw / 2 - 0.06 * k, base - 0.18 * k, pw + 0.12 * k, 0.05 * k, M);
  const dg = g.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0); dg.addColorStop(0, '#fbfaf6'); dg.addColorStop(0.6, M); dg.addColorStop(1, MD);
  g.fillStyle = dg; g.fillRect(cx - pw / 2, base - 0.78 * k, pw, 0.6 * k);
  g.fillStyle = C.gold; g.fillRect(cx - pw / 2, base - 0.56 * k, pw, 0.05 * k);
  g.fillStyle = C.goldL; g.fillRect(cx - pw / 2, base - 0.56 * k, pw, Math.max(1, 0.015 * k));
  /* a carved star on the die */
  g.fillStyle = MD; g.beginPath(); for(let i = 0; i < 10; i++){ const r = i % 2 ? 0.035 * k : 0.08 * k, a = i / 10 * TAU - Math.PI / 2; g.lineTo(cx + Math.cos(a) * r, base - 0.35 * k + Math.sin(a) * r); } g.fill();
  ped(cx - pw / 2 - 0.05 * k, base - 0.84 * k, pw + 0.1 * k, 0.07 * k, M);
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(cx - pw / 2 - 0.05 * k, base - 0.78 * k, pw + 0.1 * k, Math.max(1, 0.015 * k));
  /* the fairy: wings first, behind her; her gown; her body, arms, head and hair; what she holds. Each part marble lit
     from the left, edged a little darker so the parts read apart */
  const fb = base - 0.84 * k;
  const edge = 'rgba(120,114,104,.55)';
  const marble = (path, x0, x1)=>{ const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, M); gr.addColorStop(1, MS); g.fillStyle = gr; g.fill(path); g.strokeStyle = edge; g.lineWidth = Math.max(1, 0.012 * k); g.stroke(path); };
  const sh0 = fb - 1.0 * k;                                          // her shoulders
  /* wings: an upper and a lower pair, from her shoulder blades, up and out, veined */
  [[-1, 0.3, 0.1, -0.55, 0.05], [1, 0.3, 0.1, 0.55, 0.05], [-1, 0.21, 0.075, -1.05, 0.2], [1, 0.21, 0.075, 1.05, 0.2]].forEach(([sx, rx, ry, rot, dy])=>{
    const wx = cx + sx * (rx * 0.75) * k, wy = sh0 + dy * k - Math.abs(Math.sin(rot)) * rx * 0.35 * k;
    const p = new Path2D(); p.ellipse(wx, wy, rx * k, ry * k, rot + (sx < 0 ? Math.PI : 0) * 0, 0, TAU);
    marble(p, wx - rx * k, wx + rx * k);
    g.strokeStyle = 'rgba(140,134,124,.55)'; g.lineWidth = Math.max(1, 0.01 * k);
    for(let v = -1; v <= 1; v++){ g.beginPath(); g.moveTo(cx + sx * 0.05 * k, sh0 + dy * k); g.lineTo(wx + Math.cos(rot) * rx * 0.8 * k * sx * sx + v * 0.02 * k, wy + Math.sin(rot) * rx * 0.8 * k + v * ry * 0.4 * k); g.stroke(); }
  });
  /* her gown: a bell from the waist to the pedestal, folds in it */
  const waist = fb - 0.72 * k;
  const gown = new Path2D(); gown.moveTo(cx - 0.09 * k, waist); gown.quadraticCurveTo(cx - 0.25 * k, fb - 0.3 * k, cx - 0.3 * k, fb); gown.quadraticCurveTo(cx, fb + 0.05 * k, cx + 0.3 * k, fb); gown.quadraticCurveTo(cx + 0.25 * k, fb - 0.3 * k, cx + 0.09 * k, waist); gown.closePath();
  marble(gown, cx - 0.3 * k, cx + 0.3 * k);
  g.strokeStyle = 'rgba(140,134,124,.45)'; g.lineWidth = Math.max(1, 0.012 * k);
  for(let i = -2; i <= 2; i++){ g.beginPath(); g.moveTo(cx + i * 0.03 * k, waist + 0.04 * k); g.quadraticCurveTo(cx + i * 0.08 * k, fb - 0.3 * k, cx + i * 0.12 * k, fb - 0.01 * k); g.stroke(); }
  g.fillStyle = C.gold; g.fillRect(cx - 0.1 * k, waist - 0.01 * k, 0.2 * k, Math.max(1, 0.025 * k));                       // a gold sash
  /* her bodice and shoulders */
  const body = new Path2D(); body.moveTo(cx - 0.09 * k, waist); body.quadraticCurveTo(cx - 0.12 * k, sh0 + 0.08 * k, cx - 0.13 * k, sh0 + 0.02 * k); body.quadraticCurveTo(cx, sh0 - 0.03 * k, cx + 0.13 * k, sh0 + 0.02 * k); body.quadraticCurveTo(cx + 0.12 * k, sh0 + 0.08 * k, cx + 0.09 * k, waist); body.closePath();
  marble(body, cx - 0.13 * k, cx + 0.13 * k);
  /* her neck, her head, her hair gathered up, a little crown */
  g.fillStyle = MD; g.fillRect(cx - 0.03 * k, sh0 - 0.07 * k, 0.06 * k, 0.08 * k);
  const hy = sh0 - 0.16 * k;
  const head = new Path2D(); head.ellipse(cx, hy, 0.095 * k, 0.11 * k, 0, 0, TAU); marble(head, cx - 0.1 * k, cx + 0.1 * k);
  const hair = new Path2D(); hair.ellipse(cx + 0.01 * k, hy - 0.05 * k, 0.105 * k, 0.075 * k, 0, Math.PI * 0.95, Math.PI * 2.05); hair.ellipse(cx + 0.02 * k, hy - 0.13 * k, 0.05 * k, 0.045 * k, 0, 0, TAU);
  marble(hair, cx - 0.1 * k, cx + 0.12 * k);
  g.fillStyle = C.gold; g.beginPath(); g.moveTo(cx - 0.08 * k, hy - 0.07 * k); for(let i = 0; i <= 4; i++) g.lineTo(cx - 0.08 * k + i * 0.04 * k, hy - 0.07 * k - (i % 2 ? 0.03 : 0.065) * k); g.lineTo(cx + 0.08 * k, hy - 0.07 * k); g.closePath(); g.fill();
  if(n === 0){
    /* a little harp held against her, her arms round it; gold strings */
    const hx = cx + 0.12 * k, hb = waist + 0.12 * k;
    const harp = new Path2D(); harp.moveTo(hx - 0.05 * k, hb); harp.quadraticCurveTo(hx + 0.2 * k, hb - 0.1 * k, hx + 0.1 * k, hb - 0.36 * k); harp.lineTo(hx + 0.05 * k, hb - 0.38 * k); harp.quadraticCurveTo(hx + 0.13 * k, hb - 0.12 * k, hx - 0.07 * k, hb - 0.02 * k); harp.closePath();
    marble(harp, hx - 0.05 * k, hx + 0.2 * k);
    g.strokeStyle = C.gold; g.lineWidth = Math.max(0.6, 0.008 * k); for(let i = 0; i < 4; i++){ g.beginPath(); g.moveTo(hx - 0.02 * k + i * 0.028 * k, hb - 0.03 * k - i * 0.02 * k); g.lineTo(hx + 0.06 * k + i * 0.012 * k, hb - 0.3 * k + i * 0.03 * k); g.stroke(); }
    const arm1 = new Path2D(); arm1.ellipse(cx + 0.13 * k, sh0 + 0.15 * k, 0.035 * k, 0.14 * k, -0.25, 0, TAU); marble(arm1, cx + 0.1 * k, cx + 0.17 * k);
    const arm2 = new Path2D(); arm2.ellipse(cx - 0.06 * k, sh0 + 0.17 * k, 0.035 * k, 0.13 * k, -1.0, 0, TAU); marble(arm2, cx - 0.12 * k, cx + 0.02 * k);
  } else {
    /* one arm raised, a gold star in her hand and its light; the other at her side */
    const arm = new Path2D(); arm.ellipse(cx + 0.15 * k, sh0 - 0.08 * k, 0.035 * k, 0.15 * k, 0.32, 0, TAU); marble(arm, cx + 0.11 * k, cx + 0.2 * k);
    const arm2 = new Path2D(); arm2.ellipse(cx - 0.15 * k, sh0 + 0.16 * k, 0.034 * k, 0.15 * k, 0.15, 0, TAU); marble(arm2, cx - 0.19 * k, cx - 0.11 * k);
    const sx = cx + 0.2 * k, sy = sh0 - 0.28 * k;
    const gl = g.createRadialGradient(sx, sy, 0, sx, sy, 0.3 * k); gl.addColorStop(0, 'rgba(255,240,160,.6)'); gl.addColorStop(1, 'rgba(255,240,160,0)'); g.fillStyle = gl; g.beginPath(); g.arc(sx, sy, 0.3 * k, 0, TAU); g.fill();
    g.fillStyle = C.gold; g.beginPath(); for(let i = 0; i < 10; i++){ const r = i % 2 ? 0.045 * k : 0.11 * k, a = i / 10 * TAU - Math.PI / 2; g.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } g.closePath(); g.fill();
    g.strokeStyle = C.goldD; g.lineWidth = Math.max(1, 0.01 * k); g.stroke();
    g.fillStyle = C.goldL; g.beginPath(); g.arc(sx - 0.015 * k, sy - 0.015 * k, 0.03 * k, 0, TAU); g.fill();
  }
  /* a touch of moss and weather low on the pedestal */
  g.fillStyle = 'rgba(110,140,70,.35)'; g.beginPath(); g.ellipse(cx - pw * 0.3, base - 0.17 * k, 0.12 * k, 0.03 * k, 0, 0, TAU); g.fill();
}
/* a curved seat of marble on the court's north side, facing the fountain: a slab bent round the court's middle on
   three scrolled supports, the shade under it, a gold rosette on each support */
function drawBench(g, d, x, y, w, h, k){
  const ox = x - d.x * k, oy = y - d.y * k;                       // where square (0, 0) falls
  const ccx = ox + d.ccx * k, ccy = oy + d.ccy * k;
  const mx = d.x + d.w / 2, my = d.y + d.h - 0.45;                     // the seat's middle, near its square's middle
  const am = Math.atan2(my - d.ccy, mx - d.ccx), rm = Math.hypot(mx - d.ccx, my - d.ccy), r0 = rm - 0.16, r1 = rm + 0.16, half = 0.27;
  const a0 = am - half, a1 = am + half, H = 0.26 * k, T = 0.1 * k;
  const M = '#f7f4ee', MD = '#cdc5b6', MS = '#9e9687';
  const P = (r, a, lift)=> [ccx + Math.cos(a) * r * k, ccy + Math.sin(a) * r * k - (lift || 0)];
  const band = (ra, rb, aa, ab, lift, fill)=>{ g.beginPath(); g.arc(ccx, ccy - lift, ra * k, aa, ab); g.arc(ccx, ccy - lift, rb * k, ab, aa, true); g.closePath(); g.fillStyle = fill; g.fill(); };
  /* its shadow, on the paving below and behind */
  g.save(); g.translate(0.08 * k, 0.06 * k); band(r0 - 0.02, r1 + 0.05, a0 - 0.03, a1 + 0.03, 0, 'rgba(30,25,15,.26)'); g.restore();
  /* the dark under the seat */
  band(r0 + 0.02, r1 - 0.02, a0 + 0.02, a1 - 0.02, H * 0.5, 'rgba(36,30,22,.55)');
  /* the supports: scrolled, the left of each lit */
  [a0 + 0.07, am, a1 - 0.07].forEach(a=>{
    const [fx, fy] = P(r0 + 0.07, a, 0), wdt = 0.17 * k;
    const sg = g.createLinearGradient(fx - wdt / 2, 0, fx + wdt / 2, 0); sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.5, M); sg.addColorStop(1, MS);
    g.fillStyle = sg; g.beginPath();
    g.moveTo(fx - wdt / 2, fy); g.lineTo(fx + wdt / 2, fy);
    g.quadraticCurveTo(fx + wdt * 0.15, fy - H * 0.5, fx + wdt * 0.55, fy - H + T * 0.2);
    g.lineTo(fx - wdt * 0.55, fy - H + T * 0.2);
    g.quadraticCurveTo(fx - wdt * 0.15, fy - H * 0.5, fx - wdt / 2, fy); g.closePath(); g.fill();
    g.strokeStyle = MS; g.lineWidth = Math.max(1, 0.012 * k); g.beginPath(); g.arc(fx, fy - H * 0.55, wdt * 0.22, 0.6, 5.6); g.stroke();
    g.fillStyle = C.gold; g.beginPath(); g.arc(fx, fy - H * 0.55, wdt * 0.12, 0, TAU); g.fill();
    g.fillStyle = MD; g.fillRect(fx - wdt * 0.6, fy - 0.025 * k, wdt * 1.2, 0.025 * k);
  });
  /* the slab: its front face (toward the fountain), then its top */
  g.beginPath(); g.arc(ccx, ccy - H, r0 * k, a0, a1); g.arc(ccx, ccy - H + T, r0 * k, a1, a0, true); g.closePath();
  const fg = g.createLinearGradient(0, ccy - H, 0, ccy - H + T); fg.addColorStop(0, MD); fg.addColorStop(1, MS); g.fillStyle = fg; g.fill();
  const tg = g.createLinearGradient(...P(r1, a0, H), ...P(r0, a1, H)); tg.addColorStop(0, '#ffffff'); tg.addColorStop(1, M);
  band(r0, r1, a0, a1, H, tg);
  /* veins in the marble of its top */
  g.save(); g.beginPath(); g.arc(ccx, ccy - H, r1 * k, a0, a1); g.arc(ccx, ccy - H, r0 * k, a1, a0, true); g.closePath(); g.clip();
  g.strokeStyle = 'rgba(150,145,140,.35)'; g.lineWidth = Math.max(0.7, 0.008 * k);
  for(let i = 0; i < 4; i++){ const aa = a0 + (i + 0.3) / 4 * (a1 - a0), [vx, vy] = P(r0 + 0.04, aa, H), [wx, wy] = P(r1 - 0.04, aa + 0.12, H); g.beginPath(); g.moveTo(vx, vy); g.quadraticCurveTo((vx + wx) / 2 + 0.04 * k, (vy + wy) / 2, wx, wy); g.stroke(); }
  g.restore();
  /* its ends, a little rolled; a fine gold line along its front */
  [a0, a1].forEach(a=>{ const [ex, ey] = P((r0 + r1) / 2, a, H); g.fillStyle = MD; g.beginPath(); g.ellipse(ex, ey + T * 0.4, 0.06 * k, 0.17 * k, a + Math.PI / 2, 0, TAU); g.fill(); g.fillStyle = M; g.beginPath(); g.ellipse(ex, ey, 0.05 * k, 0.16 * k, a + Math.PI / 2, 0, TAU); g.fill(); });
  g.strokeStyle = C.gold; g.lineWidth = Math.max(1, 0.014 * k); g.beginPath(); g.arc(ccx, ccy - H + T * 0.45, r0 * k, a0 + 0.04, a1 - 0.04); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = Math.max(1, 0.014 * k); g.beginPath(); g.arc(ccx, ccy - H, (r1 - 0.03) * k, a0 + 0.05, a1 - 0.05); g.stroke();
}
/* a marble urn on its plinth, a gold band round its lip, roses spilling over it and ivy trailing down */
function drawUrn(g, d, x, y, w, h, k){
  const rnd = U().rng(Math.round(d.x * 19 + d.y * 37) + (d.n || 0));
  const cx = x + w / 2, base = y + h - 0.08 * k;
  const M = '#f6f3ec', MD = '#cfc9bd', MS = '#aaa397';
  g.fillStyle = 'rgba(30,25,15,.26)'; g.beginPath(); g.ellipse(cx + 0.18 * k, base + 0.02 * k, 0.42 * k, 0.11 * k, 0, 0, TAU); g.fill();
  /* the plinth */
  const pw = 0.5 * k;
  const pg = g.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0); pg.addColorStop(0, '#fbfaf6'); pg.addColorStop(1, MD);
  g.fillStyle = pg; g.fillRect(cx - pw / 2, base - 0.42 * k, pw, 0.42 * k);
  g.fillStyle = M; g.fillRect(cx - pw / 2 - 0.04 * k, base - 0.46 * k, pw + 0.08 * k, 0.06 * k);
  g.fillStyle = MS; g.fillRect(cx - pw / 2 - 0.03 * k, base - 0.06 * k, pw + 0.06 * k, 0.06 * k);
  g.strokeStyle = 'rgba(150,140,125,.45)'; g.lineWidth = Math.max(1, 0.012 * k); g.strokeRect(cx - pw / 2 + 0.07 * k, base - 0.36 * k, pw - 0.14 * k, 0.22 * k);
  /* the urn: a foot, a fluted bowl, its lip */
  const top = base - 1.12 * k, foot = base - 0.46 * k;
  g.fillStyle = MD; g.beginPath(); g.moveTo(cx - 0.12 * k, foot); g.lineTo(cx + 0.12 * k, foot); g.lineTo(cx + 0.07 * k, foot - 0.14 * k); g.lineTo(cx - 0.07 * k, foot - 0.14 * k); g.closePath(); g.fill();
  const bowl = new Path2D(); bowl.moveTo(cx - 0.1 * k, foot - 0.14 * k); bowl.bezierCurveTo(cx - 0.42 * k, foot - 0.22 * k, cx - 0.4 * k, top + 0.18 * k, cx - 0.32 * k, top + 0.06 * k); bowl.lineTo(cx + 0.32 * k, top + 0.06 * k); bowl.bezierCurveTo(cx + 0.4 * k, top + 0.18 * k, cx + 0.42 * k, foot - 0.22 * k, cx + 0.1 * k, foot - 0.14 * k); bowl.closePath();
  const bg = g.createLinearGradient(cx - 0.4 * k, 0, cx + 0.4 * k, 0); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.45, M); bg.addColorStop(1, MS);
  g.fillStyle = bg; g.fill(bowl);
  g.save(); g.clip(bowl); g.strokeStyle = 'rgba(140,132,120,.4)'; g.lineWidth = Math.max(1, 0.014 * k);
  for(let i = -4; i <= 4; i++){ g.beginPath(); g.moveTo(cx + i * 0.025 * k, foot - 0.14 * k); g.quadraticCurveTo(cx + i * 0.1 * k, top + 0.35 * k, cx + i * 0.075 * k, top + 0.1 * k); g.stroke(); }
  g.restore();
  g.fillStyle = C.gold; g.fillRect(cx - 0.36 * k, top + 0.02 * k, 0.72 * k, 0.06 * k);
  g.fillStyle = C.goldL; g.fillRect(cx - 0.36 * k, top + 0.02 * k, 0.72 * k, Math.max(1, 0.015 * k));
  g.fillStyle = M; g.beginPath(); g.ellipse(cx, top + 0.01 * k, 0.38 * k, 0.07 * k, 0, 0, TAU); g.fill();
  /* what grows in it: a mound of leaves, roses on it, ivy trailing over the lip */
  const cols = [ROSES.pink, ROSES.white, ROSES.gold, ROSES.red][(d.n || 0) % 4];
  for(let i = 0; i < 6; i++){ const tx = cx + (rnd() - 0.5) * 0.6 * k; g.strokeStyle = '#3f7a34'; g.lineWidth = Math.max(1, 0.018 * k); g.beginPath(); g.moveTo(tx, top + 0.04 * k); g.quadraticCurveTo(tx + (rnd() - 0.5) * 0.2 * k, top + 0.3 * k, tx + (rnd() - 0.5) * 0.15 * k, top + (0.35 + rnd() * 0.3) * k); g.stroke();
    for(let j = 0; j < 4; j++){ g.fillStyle = j % 2 ? '#4f9443' : '#3a7a33'; g.beginPath(); g.ellipse(tx + (rnd() - 0.5) * 0.12 * k, top + (0.1 + j * 0.1) * k, 0.035 * k, 0.025 * k, rnd() * 3, 0, TAU); g.fill(); } }
  for(let i = 0; i < 26; i++){ const a = Math.PI + rnd() * Math.PI, r = Math.sqrt(rnd()) * 0.36 * k; g.fillStyle = ['#2f6a2c', '#3f7f37', '#4f9443'][i % 3]; g.beginPath(); g.ellipse(cx + Math.cos(a) * r, top - 0.02 * k + Math.sin(a) * r * 0.7, 0.07 * k, 0.05 * k, a, 0, TAU); g.fill(); }
  for(let i = 0; i < 9; i++){
    const a = Math.PI * (1.05 + rnd() * 0.9), r = (0.08 + rnd() * 0.26) * k, fx = cx + Math.cos(a) * r, fy = top - 0.05 * k + Math.sin(a) * r * 0.7, fr = 0.05 * k;
    g.fillStyle = cols[2]; g.beginPath(); g.arc(fx + fr * 0.15, fy + fr * 0.2, fr, 0, TAU); g.fill();
    g.fillStyle = cols[0]; g.beginPath(); g.arc(fx, fy, fr, 0, TAU); g.fill();
    g.strokeStyle = cols[2]; g.lineWidth = Math.max(0.6, fr * 0.22); g.beginPath(); g.arc(fx, fy, fr * 0.55, 0.4, 4.6); g.stroke();
    g.fillStyle = cols[3]; g.beginPath(); g.arc(fx - fr * 0.35, fy - fr * 0.35, fr * 0.3, 0, TAU); g.fill();
  }
}
/* a rose arch over a gate: two posts of white iron with gold tops, the arch of them, roses climbing all over */
function drawArch(g, d, x, y, w, h, k){
  const rnd = U().rng(Math.round(d.x * 29 + d.y * 11) + (d.south ? 5 : 0));
  const lx = x + 0.45 * k, rx = x + w - 0.45 * k, base = y + h - 0.1 * k, spring = y + 1.45 * k, cx = (lx + rx) / 2, R = (rx - lx) / 2, RY = 1.05 * k;
  const EA = (a, dr)=> [cx + Math.cos(a) * (R + dr), spring + Math.sin(a) * (RY + dr)];
  const IRON = '#f3f0ea', IROND = '#b9b2a6';
  /* the shadows of the posts on the ground */
  g.fillStyle = 'rgba(30,25,15,.24)'; [lx, rx].forEach(px=>{ g.beginPath(); g.ellipse(px + 0.18 * k, base, 0.26 * k, 0.08 * k, 0, 0, TAU); g.fill(); });
  /* the posts: a lattice of two uprights with rungs, the far one lit less */
  const post = (px)=>{
    [-0.1, 0.1].forEach((o, i)=>{ g.fillStyle = i ? IROND : IRON; g.fillRect(px + o * k - 0.035 * k, spring, 0.07 * k, base - spring); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(px + o * k - 0.035 * k, spring, Math.max(1, 0.015 * k), base - spring); });
    g.strokeStyle = IROND; g.lineWidth = Math.max(1, 0.02 * k);
    for(let yy = spring + 0.15 * k; yy < base - 0.05 * k; yy += 0.22 * k){ g.beginPath(); g.moveTo(px - 0.1 * k, yy); g.lineTo(px + 0.1 * k, yy + 0.11 * k); g.moveTo(px + 0.1 * k, yy); g.lineTo(px - 0.1 * k, yy + 0.11 * k); g.stroke(); }
    g.fillStyle = IROND; g.fillRect(px - 0.15 * k, base - 0.08 * k, 0.3 * k, 0.08 * k);
    g.fillStyle = C.gold; g.beginPath(); g.arc(px, spring - 0.02 * k, 0.08 * k, 0, TAU); g.fill();
    g.fillStyle = C.goldL; g.beginPath(); g.arc(px - 0.025 * k, spring - 0.045 * k, 0.025 * k, 0, TAU); g.fill();
  };
  post(lx); post(rx);
  /* the arch: two hoops with a lattice between */
  g.strokeStyle = IROND; g.lineWidth = Math.max(1.5, 0.065 * k); g.beginPath(); g.ellipse(cx, spring, R + 0.1 * k, RY + 0.1 * k, 0, Math.PI, TAU); g.stroke();
  g.strokeStyle = IRON; g.lineWidth = Math.max(1.5, 0.065 * k); g.beginPath(); g.ellipse(cx, spring, R - 0.1 * k, RY - 0.1 * k, 0, Math.PI, TAU); g.stroke();
  g.strokeStyle = IROND; g.lineWidth = Math.max(1, 0.02 * k);
  for(let i = 1; i < 18; i++){ const a = Math.PI + i / 18 * Math.PI, [ax, ay] = EA(a, -0.1 * k), [bx, by] = EA(a, 0.1 * k); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
  /* a gold crest at its top: the castle's star */
  const sy = spring - RY - 0.16 * k;
  g.fillStyle = C.gold; g.beginPath(); for(let i = 0; i < 10; i++){ const r = i % 2 ? 0.06 * k : 0.15 * k, a = i / 10 * TAU - Math.PI / 2; g.lineTo(cx + Math.cos(a) * r, sy + Math.sin(a) * r); } g.closePath(); g.fill();
  g.fillStyle = C.goldL; g.beginPath(); g.arc(cx - 0.02 * k, sy - 0.02 * k, 0.04 * k, 0, TAU); g.fill();
  /* the roses: leaves and flowers clustered up the posts and over the arch, thicker low and at the shoulders */
  const along = [];
  for(let i = 0; i < 70; i++){
    const t = rnd();
    if(t < 0.3){ along.push([lx + (rnd() - 0.5) * 0.3 * k, spring + rnd() * (base - spring - 0.2 * k)]); }
    else if(t < 0.6){ along.push([rx + (rnd() - 0.5) * 0.3 * k, spring + rnd() * (base - spring - 0.2 * k)]); }
    else { const a = Math.PI + rnd() * Math.PI, [ax, ay] = EA(a, 0); along.push([ax + (rnd() - 0.5) * 0.2 * k, ay + (rnd() - 0.5) * 0.2 * k]); }
  }
  along.forEach(([px, py], i)=>{
    for(let j = 0; j < 5; j++){ g.fillStyle = ['#2f6a2c', '#3f7f37', '#4f9443', '#285a26'][(i + j) % 4]; g.beginPath(); g.ellipse(px + (rnd() - 0.5) * 0.22 * k, py + (rnd() - 0.5) * 0.18 * k, 0.07 * k, 0.045 * k, rnd() * 3, 0, TAU); g.fill(); }
  });
  along.forEach(([px, py], i)=>{
    if(i % 2) return;
    const cols = i % 6 === 0 ? ROSES.red : ROSES.pink, fr = (0.045 + rnd() * 0.02) * k, fx = px + (rnd() - 0.5) * 0.15 * k, fy = py + (rnd() - 0.5) * 0.12 * k;
    g.fillStyle = cols[2]; g.beginPath(); g.arc(fx + fr * 0.15, fy + fr * 0.2, fr, 0, TAU); g.fill();
    g.fillStyle = cols[0]; g.beginPath(); g.arc(fx, fy, fr, 0, TAU); g.fill();
    g.strokeStyle = cols[2]; g.lineWidth = Math.max(0.6, fr * 0.22); g.beginPath(); g.arc(fx, fy, fr * 0.55, 0.4, 4.6); g.stroke();
    g.fillStyle = cols[3]; g.beginPath(); g.arc(fx - fr * 0.35, fy - fr * 0.35, fr * 0.3, 0, TAU); g.fill();
  });
  /* a trailing spray hanging from the arch's top */
  for(let i = 0; i < 3; i++){
    const a = Math.PI * (1.3 + i * 0.2), [px, py] = EA(a, 0);
    g.strokeStyle = '#3f7a34'; g.lineWidth = Math.max(1, 0.015 * k); g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + 0.05 * k, py + 0.25 * k, px - 0.02 * k, py + 0.45 * k); g.stroke();
    for(let j = 0; j < 4; j++){ g.fillStyle = '#4f9443'; g.beginPath(); g.ellipse(px + (j % 2 ? 0.04 : -0.03) * k, py + (0.1 + j * 0.1) * k, 0.04 * k, 0.025 * k, 0.5, 0, TAU); g.fill(); }
    g.fillStyle = ROSES.pink[0]; g.beginPath(); g.arc(px - 0.02 * k, py + 0.46 * k, 0.04 * k, 0, TAU); g.fill();
  }
}
/* a clipped ball of box on a gate's pier */
function drawBall(g, d, x, y, w, h, k){
  const rnd = U().rng(Math.round(d.x * 7 + d.y * 3) + 9);
  const cx = x + w / 2, cy = y + h - 0.62 * k, r = 0.34 * k;
  g.fillStyle = 'rgba(15,30,10,.35)'; g.beginPath(); g.ellipse(cx + 0.06 * k, cy + r * 0.85, r * 0.95, r * 0.3, 0, 0, TAU); g.fill();
  const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  gr.addColorStop(0, '#78b75c'); gr.addColorStop(0.6, '#3f7d37'); gr.addColorStop(1, '#1f4a1d');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  for(let i = 0; i < 70; i++){ const a = rnd() * TAU, dd = Math.sqrt(rnd()) * r * 0.94, px = cx + Math.cos(a) * dd, py = cy + Math.sin(a) * dd, lit = ((cx - px) + (cy - py)) / r;
    g.fillStyle = lit > 0.3 ? 'rgba(170,225,130,.55)' : lit < -0.4 ? 'rgba(8,30,8,.42)' : 'rgba(70,130,55,.5)'; g.beginPath(); g.arc(px, py, k * (0.018 + rnd() * 0.018), 0, TAU); g.fill(); }
}
const stillOf = (draw, pad)=> { let f = null; return (g, d, x, y, w, h, k)=> (f || (f = U().still(draw, pad)))(g, d, x, y, w, h, k); };
/* (4.73) THE ORCHARDS' FRUIT TREES. The designer: "Please improve the castle's apple tree graphics." An apple or a pear
   tree as the gardens' trees are drawn: a short trunk with its root flare, splitting into limbs; a round crown pruned
   as an orchard's is, in clouds of leaves lit from the upper left, darker in under; its fruit hanging round the crown's
   lower and outer parts, each lit with a stalk and a leaf; a windfall or two on the grass in its shade. */
function drawFruitTree(g, d, x, y, w, h, k){
  const rnd = U().rng(Math.round(d.x * 61 + d.y * 37) + 17), apple = d.variant !== 'pear', f = rnd() < 0.5 ? -1 : 1;
  const cx = x + w / 2, base = y + h - 0.1 * k, size = 0.92 + rnd() * 0.16;
  /* its shade on the grass, and a windfall or two in it */
  g.fillStyle = 'rgba(28,40,18,.27)'; g.beginPath(); g.ellipse(cx + 0.22 * k, base + 0.02 * k, 0.95 * k * size, 0.26 * k, 0, 0, TAU); g.fill();
  const fallen = 1 + Math.floor(rnd() * 3);
  for(let i = 0; i < fallen; i++){ const fx = cx + (rnd() - 0.35) * 1.3 * k, fy = base - 0.02 * k + (rnd() - 0.5) * 0.18 * k; fruitAt(g, fx, fy, 0.065 * k, apple, rnd, true); }
  /* the trunk and its limbs */
  const bark = '#5f4029', barkD = '#3d2817', barkL = '#8c6744';
  const limb = (x0, y0, x1, y1, w0, w1, bend)=>{
    const mx = (x0 + x1) / 2 + bend * k, my = (y0 + y1) / 2;
    g.fillStyle = bark; g.beginPath();
    g.moveTo(x0 - w0 / 2, y0); g.quadraticCurveTo(mx - (w0 + w1) / 4, my, x1 - w1 / 2, y1); g.lineTo(x1 + w1 / 2, y1); g.quadraticCurveTo(mx + (w0 + w1) / 4, my, x0 + w0 / 2, y0); g.closePath(); g.fill();
    g.strokeStyle = barkL; g.lineWidth = Math.max(1, w1 * 0.28); g.beginPath(); g.moveTo(x0 - w0 * 0.25, y0); g.quadraticCurveTo(mx - (w0 + w1) / 6, my, x1 - w1 * 0.2, y1); g.stroke();
    g.strokeStyle = barkD; g.lineWidth = Math.max(1, w1 * 0.24); g.beginPath(); g.moveTo(x0 + w0 * 0.3, y0); g.quadraticCurveTo(mx + (w0 + w1) / 6, my, x1 + w1 * 0.25, y1); g.stroke();
  };
  const fork = base - 0.72 * k;
  limb(cx, base, cx + f * 0.05 * k, fork, 0.26 * k, 0.19 * k, f * 0.05);
  g.fillStyle = bark; g.beginPath(); g.ellipse(cx, base - 0.03 * k, 0.21 * k, 0.065 * k, 0, 0, TAU); g.fill();       // the root flare
  g.strokeStyle = barkD; g.lineWidth = Math.max(1, 0.02 * k); g.beginPath(); g.moveTo(cx - 0.02 * k, base - 0.1 * k); g.lineTo(cx + 0.01 * k, base - 0.4 * k); g.stroke();
  [[-0.55, -0.55, 0.1, -0.08], [0.05, -0.8, 0.1, 0.04], [0.5, -0.6, 0.09, 0.08], [-0.2, -0.75, 0.07, -0.03]].forEach(([dx, dy, lw, bend])=>
    limb(cx + f * 0.05 * k, fork, cx + f * dx * k * size, fork + dy * k, 0.15 * k, lw * k, f * bend));
  /* the crown: clusters of leaves, back to front, lit from the upper left. (4.73, the designer: "fine tune the apple
     tree background dark green blob to more closely match the shape of the leaves and to be less simply oval and more
     organic … missing leaf details on the left side of the tree") No oval behind them: a ring of clusters makes its
     edge, evenly round it, more fill its middle; each lays its own bumpy shade first, so the crown's dark is the
     shape of its leaves, and leaves stand out over every edge. */
  const ccx = cx + f * 0.04 * k, ccy = fork - 0.5 * k, RX = 0.98 * k * size, RY = 0.74 * k * size;
  const greens = ['#9ccf6e', '#74b552', '#559a3f', '#3f8133', '#2f6829', '#235220'];
  const clouds = [], ring = 11, a0 = rnd() * TAU;
  for(let i = 0; i < ring; i++){
    const a = a0 + (i + (rnd() - 0.5) * 0.35) * TAU / ring, dd = 0.7 + (rnd() - 0.5) * 0.12;
    clouds.push([ccx + Math.cos(a) * dd * RX, ccy + Math.sin(a) * dd * RY, (0.27 + rnd() * 0.08) * k, true]);
  }
  for(let i = 0; i < 9; i++){ const a = rnd() * TAU, dd = Math.sqrt(rnd()) * 0.46; clouds.push([ccx + Math.cos(a) * dd * RX, ccy + Math.sin(a) * dd * RY - 0.04 * k, (0.3 + rnd() * 0.12) * k, false]); }
  clouds.sort((p, q)=> p[1] - q[1]);
  const lit = (px, py)=> Math.max(0, Math.min(1, 0.55 - ((px - ccx) / RX) * 0.35 - ((py - ccy) / RY) * 0.45));
  /* the shade: each cluster a knot of overlapping rounds, darker where the light does not reach */
  clouds.forEach(([px, py, r])=>{
    const L = lit(px, py);
    g.fillStyle = L > 0.55 ? '#2e6428' : L > 0.3 ? '#285a23' : '#214c1d';
    for(let j = 0; j < 6; j++){
      const b = j / 6 * TAU + rnd() * 0.6, o = r * (0.32 + rnd() * 0.16);
      g.beginPath(); g.arc(px + r * 0.06 + Math.cos(b) * o, py + r * 0.1 + Math.sin(b) * o * 0.85, r * (0.5 + rnd() * 0.16), 0, TAU); g.fill();
    }
  });
  /* the leaves: thick over each cluster, its rim included, lit by where they sit */
  clouds.forEach(([px, py, r, edge])=>{
    const L = lit(px, py);
    for(let j = 0; j < 40; j++){
      const a = rnd() * TAU, dd = Math.sqrt(rnd()) * r * 1.02, qx = px + Math.cos(a) * dd - r * 0.06, qy = py + Math.sin(a) * dd * 0.88 - r * 0.08;
      const up = ((qx - px) + (qy - py)) / (1.6 * r);
      const t = Math.max(0, Math.min(5, Math.round((1 - L) * 2.2 + up * 2.2 + rnd() * 0.9)));
      g.fillStyle = greens[t];
      g.beginPath(); g.ellipse(qx, qy, k * (0.05 + rnd() * 0.03), k * (0.028 + rnd() * 0.015), a, 0, TAU); g.fill();
    }
    /* on the crown's edge, leaves standing out from it, pointing away from the middle */
    if(edge) for(let j = 0; j < 9; j++){
      const out = Math.atan2(py - ccy, px - ccx), a = out + (rnd() - 0.5) * 1.9, qx = px + Math.cos(a) * r * (0.85 + rnd() * 0.25), qy = py + Math.sin(a) * r * 0.8 * (0.85 + rnd() * 0.25);
      const t = Math.max(0, Math.min(5, Math.round((1 - lit(qx, qy)) * 2.4 + 1 + rnd())));
      g.fillStyle = greens[t];
      g.beginPath(); g.ellipse(qx, qy, k * (0.055 + rnd() * 0.025), k * 0.026, a, 0, TAU); g.fill();
    }
  });
  /* its fruit: round the crown's lower and outer parts, where it catches the eye; a few leaves before some of them */
  const n = 11 + Math.floor(rnd() * 5), hung = [];
  for(let i = 0; i < n; i++){
    const a = (0.1 + rnd() * 0.8) * Math.PI + (rnd() < 0.3 ? Math.PI : 0), dd = 0.55 + rnd() * 0.38;
    hung.push([ccx + Math.cos(a) * dd * RX, ccy + Math.sin(a) * dd * RY + 0.06 * k]);
  }
  hung.sort((p, q)=> p[1] - q[1]).forEach(([fx, fy])=>{
    fruitAt(g, fx, fy, (apple ? 0.078 : 0.07) * k, apple, rnd, false);
    if(rnd() < 0.35){ g.fillStyle = greens[1 + Math.floor(rnd() * 2)]; g.beginPath(); g.ellipse(fx + (rnd() - 0.5) * 0.08 * k, fy - 0.07 * k, 0.055 * k, 0.026 * k, rnd() * 3, 0, TAU); g.fill(); }
  });
}
/* one apple or pear: its shape, its shade, its light, its stalk (`ground`: lying, no stalk) */
function fruitAt(g, x, y, r, apple, rnd, ground){
  const col = apple ? (rnd() < 0.25 ? ['#e0503a', '#a32b1f', '#ffd6c4'] : ['#d32f2c', '#8e1d1b', '#ffc9bd']) : ['#d9cd4a', '#a99a2c', '#fffbd0'];
  if(ground){ g.fillStyle = 'rgba(20,30,10,.3)'; g.beginPath(); g.ellipse(x + r * 0.3, y + r * 0.7, r * 1.1, r * 0.35, 0, 0, TAU); g.fill(); }
  g.fillStyle = col[0]; g.beginPath();
  if(apple) g.ellipse(x, y, r, r * 0.92, 0, 0, TAU);
  else { g.ellipse(x, y + r * 0.25, r * 0.9, r * 0.8, 0, 0, TAU); g.moveTo(x + r * 0.55, y - r * 0.3); g.ellipse(x, y - r * 0.45, r * 0.55, r * 0.6, 0, 0, TAU); }
  g.fill();
  if(!ground){ g.strokeStyle = 'rgba(70,45,15,.45)'; g.lineWidth = Math.max(1, r * 0.12); g.stroke(); }   // a fine edge: it reads against the leaves
  g.fillStyle = col[1]; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(x + r * 0.35, y + r * 0.35, r * 0.55, r * 0.45, 0.6, 0, TAU); g.fill(); g.globalAlpha = 1;
  g.fillStyle = col[2]; g.beginPath(); g.ellipse(x - r * 0.38, y - r * (apple ? 0.35 : 0.55), r * 0.26, r * 0.18, -0.6, 0, TAU); g.fill();
  if(!ground){
    g.strokeStyle = '#4a3218'; g.lineWidth = Math.max(1, r * 0.18); g.beginPath(); g.moveTo(x, y - r * (apple ? 0.85 : 1.05)); g.lineTo(x + r * 0.15, y - r * (apple ? 1.25 : 1.45)); g.stroke();
  }
}
const fruitPic = stillOf(drawFruitTree, 0.6);
const treePic = stillOf((g, d, x, y, w, h, k)=> d.variant === 'cypress' ? drawCypress(g, d, x, y, w, h, k) : drawBlossom(g, d, x, y, w, h, k), 0.6);
const topiaryPic = stillOf(drawTopiary, 0.4), statuePic = stillOf(drawStatue, 0.4), benchPic = stillOf(drawBench, 0.8), urnPic = stillOf(drawUrn, 0.4), archPic = stillOf(drawArch, 0.4), ballPic = stillOf(drawBall, 0.3);

/* ---------- the pond's life: lily pads with their flowers, koi going round under them ---------- */
function pondLife(g, d, cx, cy, rx, ry, k, t){
  const seed = Math.round(d.cx * 7 + d.cy * 3);
  /* the koi, under the surface: each round on its own ring, its tail beating */
  const KOI = [['#f26b21', '#ffffff'], ['#ffffff', '#e2402a'], ['#f2a52a', '#f6efe4'], ['#ffffff', '#2a2a30']];
  for(let i = 0; i < 4; i++){
    const dir = i % 2 ? -1 : 1, r = 0.62 + 0.13 * i + 0.05 * Math.sin(t * 0.7 + i), sp = (0.32 + 0.06 * i) * dir;
    const a = t * sp + i * 1.7 + jgHash(seed, i, 71) * 6, px = cx + Math.cos(a) * rx * r, py = cy + Math.sin(a) * ry * r;
    const head = a + dir * Math.PI / 2, L = k * 0.4, beat = Math.sin(t * 7 + i * 2) * 0.35;
    g.save(); g.translate(px, py); g.rotate(head); g.globalAlpha = 0.82;
    const [c0, c1] = KOI[i];
    g.fillStyle = c0; g.beginPath(); g.ellipse(0, 0, L * 0.5, L * 0.17, 0, 0, TAU); g.fill();
    g.fillStyle = c1; g.beginPath(); g.ellipse(L * 0.05, -L * 0.02, L * 0.18, L * 0.1, 0.3, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-L * 0.22, L * 0.03, L * 0.1, L * 0.07, 0, 0, TAU); g.fill();
    g.fillStyle = c0; g.beginPath(); g.moveTo(-L * 0.45, 0); g.lineTo(-L * 0.78, -L * (0.18 + beat * 0.2)); g.quadraticCurveTo(-L * 0.68, 0, -L * 0.78, L * (0.18 - beat * 0.2)); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(L * 0.18, -L * 0.07, L * 0.12, L * 0.03, 0, 0, TAU); g.fill();
    g.restore();
  }
  g.globalAlpha = 1;
  /* the lily pads, on the surface, rocking a little; flowers on three */
  for(let i = 0; i < 9; i++){
    const a = (i + 0.35 * jgHash(seed, i, 72)) / 9 * TAU, r = 0.7 + 0.22 * jgHash(seed, i, 73), px = cx + Math.cos(a) * rx * r, py = cy + Math.sin(a) * ry * r;
    const pr = k * (0.15 + 0.07 * jgHash(seed, i, 74)), rock = Math.sin(t * 0.8 + i) * 0.06, notch = jgHash(seed, i, 75) * TAU;
    g.fillStyle = 'rgba(10,40,30,.25)'; g.beginPath(); g.ellipse(px + pr * 0.1, py + pr * 0.15, pr, pr * 0.8, 0, 0, TAU); g.fill();
    g.fillStyle = i % 2 ? '#4f9a43' : '#3f8a3a'; g.beginPath(); g.moveTo(px, py); g.ellipse(px, py, pr, pr * 0.8, rock, notch + 0.35, notch + TAU - 0.05); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(160,220,120,.5)'; g.lineWidth = Math.max(1, k * 0.01);
    for(let v = 0; v < 5; v++){ const b = notch + 0.6 + v * 1.1; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(b) * pr * 0.85, py + Math.sin(b) * pr * 0.68); g.stroke(); }
    if(i % 3 !== 1){
      const fx = px + pr * 0.1, fy = py - pr * 0.15, fr = k * 0.07, col = i === 2 ? '#ffffff' : '#f6a6c4';
      for(let p = 0; p < 8; p++){ const b = p / 8 * TAU; g.fillStyle = p % 2 ? col : shade(col, -0.12); g.beginPath(); g.ellipse(fx + Math.cos(b) * fr * 0.55, fy + Math.sin(b) * fr * 0.45, fr * 0.45, fr * 0.2, b, 0, TAU); g.fill(); }
      g.fillStyle = '#f7d04a'; g.beginPath(); g.arc(fx, fy, fr * 0.25, 0, TAU); g.fill();
    }
  }
}

/* butterflies over a garden: four, each wandering its own slow loop over the beds, its wings beating; a faint shadow
   on the ground below. While one is in sight the castle repaints a little oftener (flying). */
const FLY = [['#ffe36e', '#f2b81c'], ['#ffffff', '#d9d4ea'], ['#9fd4ff', '#4f8fd6'], ['#ffb3d1', '#e8649a']];
let flying = false;
function flutter(g, d, x, y, w, h, k, t){
  for(let i = 0; i < 4; i++){
    const ph = (d.garden || 0) * 7.3 + i * 2.3;
    const u = 0.5 + 0.4 * Math.sin(t * (0.19 + i * 0.03) + ph) * Math.cos(t * 0.06 + i), v = 0.5 + 0.44 * Math.sin(t * (0.15 + i * 0.025) + ph * 1.7);
    const du = Math.cos(t * (0.19 + i * 0.03) + ph), hgt = (0.55 + 0.2 * Math.sin(t * 2.3 + i)) * k;
    const bx = x + u * w, gy = y + v * h, by = gy - hgt;
    const flap = 0.25 + 0.75 * Math.abs(Math.cos(t * 12 + i * 1.3)), [c0, c1] = FLY[i];
    g.fillStyle = 'rgba(20,20,10,.14)'; g.beginPath(); g.ellipse(bx + 0.08 * k, gy, 0.07 * k * flap, 0.025 * k, 0, 0, TAU); g.fill();
    g.save(); g.translate(bx, by); g.rotate(du * 0.35);
    [[-1], [1]].forEach(([sd])=>{
      g.fillStyle = c1; g.beginPath(); g.ellipse(sd * 0.055 * k * flap, 0.035 * k, 0.045 * k * flap, 0.04 * k, sd * 0.5, 0, TAU); g.fill();
      g.fillStyle = c0; g.beginPath(); g.ellipse(sd * 0.065 * k * flap, -0.025 * k, 0.065 * k * flap, 0.055 * k, -sd * 0.4, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(sd * 0.07 * k * flap, -0.04 * k, 0.012 * k, 0, TAU); g.fill();
    });
    g.fillStyle = '#3a2f2a'; g.beginPath(); g.ellipse(0, 0, 0.012 * k, 0.05 * k, 0, 0, TAU); g.fill();
    g.strokeStyle = '#3a2f2a'; g.lineWidth = Math.max(1, 0.006 * k); g.beginPath(); g.moveTo(-0.004 * k, -0.045 * k); g.lineTo(-0.025 * k, -0.08 * k); g.moveTo(0.004 * k, -0.045 * k); g.lineTo(0.025 * k, -0.08 * k); g.stroke();
    g.restore();
  }
  flying = true;
}
function takeFlying(){ const f = flying; flying = false; return f; }
/* the textures for size S made ahead, one at a time while nothing else is happening, so the first sight of a garden
   does not wait on them (slice makes any still missing at once) */
let warmed = 0;
function warm(S){
  const s = Math.max(8, Math.min(U().PIC_MAX_S, Math.round(S)));
  if(warmed === s) return;
  warmed = s;
  const jobs = [()=> patGravel(s), ()=> patLavender(s), ...Object.keys(ROSES).map(r=> ()=> patRoses(s, r))];
  const next = ()=>{ if(warmed !== s || !jobs.length) return; jobs.shift()(); setTimeout(next, 60); };
  setTimeout(next, 200);
}

return {
  slice, pondLife, warm, flutter, takeFlying,
  tree:treePic, fruit:fruitPic, topiary:topiaryPic, statue:statuePic, bench:benchPic, urn:urnPic, arch:archPic, ball:ballPic,
};
})();
