/* ==========================================================
   51-kingdom-build3d.js — (4.78) THE CITY'S BUILDINGS, IN THREE DIMENSIONS.
   The designer: "I think the palace is not grandiose enough yet... and the empty space looks weird while pending its
   upgrade. do you think you can change to allow the walls to suit the available space inside, and also make sure all
   the buildings, not just the palace, are drawn 3D and with more and more opulent features? granary and palace don't
   look as amazing and detailed yet as they can be!"
   · Every building a body of blocks and roofs, seen from the south-east and above (as the board is: lit from the upper
     left): its front lit, its east side in shade, its top bright; roofs in planes (gable, hip, pyramid, a barn's
     gambrel), towers round, domes ribbed; each casting its shadow to the east.
   · From palace 6 the palace fills its whole ground (4 by 3) at every level, inside walls of its own that run round
     it: corner towers, a gatehouse, a forecourt with its avenue, gardens and fountain; on its terrace the palace, a
     great hall, wings, towers, a portico (7), domes (8), the great dome (9), gold (10).
   · Each main building fills its 2 by 2 lot at every level: its yard and what is kept in it, a fence round it (a wall
     from 6), so no lot is kept empty; before palace 6, on its single plot, a smaller body of its own.
   · More and more opulent, level by level: stone for timber, white stone, marble, gilding, domes, banners, statues.
   Painted on 47-kingdom-art.js's board: its painters (KC_ART.ART, BIG, LOTG) replaced by these, with its pieces (kit).
   ========================================================== */
(function(){
if(typeof KC_ART === 'undefined' || !KC_ART.kit) return;
const { TAU, rng, rr, lin, ell, shade, stones, earth, flag, roundTower, GOLD, BLUE, RED, dome, banner, crown, fountain, stall, barrel,
  crate, bunting, dummy, target, rack, hay, sacks, sails, crane, logs, cart, topiary, parterre, ruin } = KC_ART.kit;

/* ---------- COLOUR ---------- */
const rgb = h=>{ const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
/* lighter (f > 1, towards white) or darker (f < 1) */
function tint(h, f){
  const c = rgb(h).map(v=> f >= 1 ? v + (255 - v) * (f - 1) : v * f);
  return '#' + c.map(v=> Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
const MAT = {
  cream:  { c:'#efe3c6', line:'rgba(122,104,76,.26)', quoin:'#fbf5e6' },
  marble: { c:'#f8f5ee', line:'rgba(150,138,116,.16)', quoin:'#ffffff' },
  stone:  { c:'#d8d2c5', line:'rgba(80,72,60,.3)', quoin:'#eeeae0' },
  grey:   { c:'#b9b2a4', line:'rgba(60,54,44,.32)', quoin:'#d8d2c5' },
  brick:  { c:'#c25a3f', line:'rgba(70,24,12,.3)', brick:true },
  barn:   { c:'#bb4337', line:'rgba(64,14,8,.3)', plank:true },
  plaster:{ c:'#f5ebd5', timber:'#5c3d26' },
  wood:   { c:'#b98b58', line:'rgba(70,44,20,.3)', plank:true },
  white:  { c:'#fbf8f1', line:'rgba(150,140,120,.16)', quoin:'#ffffff' },
  sand:   { c:'#e8d4a6', line:'rgba(120,96,60,.22)' },
};
const ROOF = {
  blue:  ['#86a7e6', '#4c6db0', '#2b4273'], red:  ['#ee9174', '#bc4c39', '#7c2a1d'], slate:['#93a2b8', '#606f87', '#39465a'],
  gold:  ['#fff0b0', '#e6b84a', '#9c6c16'], thatch:['#f2d892', '#d4ae58', '#9a782e'], copper:['#9fdcc0', '#53a389', '#2d6a57'],
  wood:  ['#cfa06a', '#9a6a3a', '#5e3e1e'], purple:['#a98ad0', '#6d4b8e', '#432a5e'], green:['#9ccf7a', '#5c9a40', '#36612a'],
};

/* ---------- THE VIEW: a building's frame o = { X, B }, its front-left corner on the ground; (x east, y back, z up) ----------
   (4.80) the designer: "the game has always made 3D a straight on but top-down perspective, but not skewed sideways" —
   straight on now: a front faces you square, its top seen from above behind it, nothing of its sides (DX 0; till 4.80
   0.32, the depth slanting off to the east). What is drawn on a side is drawn only while the view slants (DX > 0). */
const DX = 0, DY = 0.5;
const pt = (o, x, y, z)=> [o.X + x + y * DX, o.B - y * DY - z];
function path(g, o, P){ g.beginPath(); P.forEach((p, k)=>{ const [a, b] = pt(o, p[0], p[1], p[2]); if(k) g.lineTo(a, b); else g.moveTo(a, b); }); g.closePath(); }
function fillP(g, o, P, f){ path(g, o, P); g.fillStyle = f; g.fill(); }
function seg(g, o, a, b){ const [x0, y0] = pt(o, a[0], a[1], a[2]), [x1, y1] = pt(o, b[0], b[1], b[2]); g.moveTo(x0, y0); g.lineTo(x1, y1); }
function lines(g, o, S, col, w){ g.strokeStyle = col; g.lineWidth = w || 0.7; g.beginPath(); S.forEach(([a, b])=> seg(g, o, a, b)); g.stroke(); }
/* a gradient across two points of the frame */
const grad = (g, o, a, b, stops)=>{ const [x0, y0] = pt(o, a[0], a[1], a[2]), [x1, y1] = pt(o, b[0], b[1], b[2]); return lin(g, x0, y0, x1, y1, stops); };

/* the ground's shadow: everything standing casts it to the east and a little south (the light from the upper left) */
const SHX = 0.62, SHY = -0.26;
function hull(P){
  P = P.slice().sort((a, b)=> a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b)=> (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for(const p of P){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for(let i = P.length - 1; i >= 0; i--){ const p = P[i]; while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
function castShadow(g, o, x, y, w, d, h, a){
  const F = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]], P = [];
  F.forEach(([px, py])=>{ P.push(pt(o, px, py, 0)); P.push(pt(o, px + SHX * h, py + SHY * h, 0)); });
  const H = hull(P); g.fillStyle = `rgba(22,30,14,${a == null ? 0.26 : a})`; g.beginPath(); H.forEach(([px, py], k)=> k ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill();
}
function roundShadow(g, sx, sy, r, h, a){
  g.save(); g.fillStyle = `rgba(22,30,14,${a == null ? 0.24 : a})`; g.beginPath();
  g.ellipse(sx, sy, r, r * 0.4, 0, 0, TAU); g.ellipse(sx + SHX * h * 0.9, sy + 3, r * 0.9, r * 0.36, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(sx - r * 0.2, sy - r * 0.38); g.lineTo(sx + SHX * h * 0.9, sy + 3 - r * 0.36); g.lineTo(sx + SHX * h * 0.9, sy + 3 + r * 0.36); g.lineTo(sx + r * 0.2, sy + r * 0.38); g.closePath(); g.fill();
  g.restore();
}

/* ---------- A BLOCK: its front lit, its east side in shade, its top; the courses of its stone, planks or timbers ---------- */
function block(g, o, x, y, z, w, d, h, m, opt){
  opt = opt || {};
  const c = opt.c || m.c;
  if(DX){ const S = [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]];
    fillP(g, o, S, grad(g, o, [x + w, y, z], [x + w, y + d, z], [[0, tint(c, 0.8)], [1, tint(c, 0.64)]])); }
  if(opt.top !== false) fillP(g, o, [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], opt.topC || tint(c, 1.12));
  const Fr = [[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]];
  fillP(g, o, Fr, grad(g, o, [x, y, z], [x + w, y, z], [[0, tint(c, 1.04)], [1, tint(c, 0.92)]]));
  if(opt.tex !== false) texture(g, o, x, y, z, w, d, h, m, opt);
  /* the corner caught by the light; the line of the top (straight on: the top's edge, a little light; the front's
     ends, a little shade, so a block stands out from what is behind it) */
  if(DX) lines(g, o, [[[x + w, y, z], [x + w, y, z + h]]], 'rgba(255,255,255,.3)', 0.8);
  else { lines(g, o, [[[x, y, z + h], [x + w, y, z + h]]], 'rgba(255,255,255,.45)', 0.8); lines(g, o, [[[x + 0.4, y, z], [x + 0.4, y, z + h]], [[x + w - 0.4, y, z], [x + w - 0.4, y, z + h]]], 'rgba(0,0,0,.12)', 0.8); }
  if(opt.trim) lines(g, o, [[[x, y, z + h - 1], [x + w, y, z + h - 1]]].concat(DX ? [[[x + w, y, z + h - 1], [x + w, y + d, z + h - 1]]] : []), opt.trim, 2);
  if(opt.plinth) lines(g, o, [[[x, y, z + 1.6], [x + w, y, z + 1.6]]].concat(DX ? [[[x + w, y, z + 1.6], [x + w, y + d, z + 1.6]]] : []), opt.plinth, 3.2);
}
function texture(g, o, x, y, z, w, d, h, m, opt){
  if(m.plank){
    const S = [];
    for(let xx = x + 4.5; xx < x + w - 1; xx += 4.5) S.push([[xx, y, z], [xx, y, z + h]]);
    if(DX) for(let yy = y + 4.5; yy < y + d - 1; yy += 4.5) S.push([[x + w, yy, z], [x + w, yy, z + h]]);
    lines(g, o, S, m.line, 0.6); return;
  }
  if(m.timber){
    const T = m.timber, S = [], bay = 13;
    const nx = Math.max(1, Math.round(w / bay)), ny = Math.max(1, Math.round(d / bay));
    for(let k = 0; k <= nx; k++){ const xx = x + w * k / nx; S.push([[xx, y, z], [xx, y, z + h]]); }
    if(DX) for(let k = 0; k <= ny; k++){ const yy = y + d * k / ny; S.push([[x + w, yy, z], [x + w, yy, z + h]]); }
    [z + 1, z + h * 0.5, z + h - 1].forEach(zz=>{ S.push([[x, y, zz], [x + w, y, zz]]); if(DX) S.push([[x + w, y, zz], [x + w, y + d, zz]]); });
    S.push([[x, y, z + h * 0.5], [x + w / nx, y, z + h - 1]]); S.push([[x + w, y, z + h * 0.5], [x + w - w / nx, y, z + h - 1]]);
    lines(g, o, S, T, 1.8); return;
  }
  if(!m.line) return;
  const step = m.brick ? 3.4 : 6, S = [];
  for(let zz = z + step; zz < z + h - 0.5; zz += step){ S.push([[x, y, zz], [x + w, y, zz]]); if(DX) S.push([[x + w, y, zz], [x + w, y + d, zz]]); }
  lines(g, o, S, m.line, 0.6);
  if(opt.quoins && m.quoin){ for(let k = 0, zz = z; zz < z + h - 2; zz += step, k++){ const qw = k % 2 ? 4 : 6.5; fillP(g, o, [[x + w - qw, y, zz + 0.4], [x + w, y, zz + 0.4], [x + w, y, zz + step - 0.4], [x + w - qw, y, zz + step - 0.4]], m.quoin);
    fillP(g, o, [[x, y, zz + 0.4], [x + qw, y, zz + 0.4], [x + qw, y, zz + step - 0.4], [x, y, zz + step - 0.4]], m.quoin); } }
}

/* ---------- WINDOWS AND DOORS ---------- */
/* a window in a front (plane y): its lower left (x, z); arched, shuttered, its box of flowers, a balcony rail */
function winF(g, o, x, y, z, w, h, op){
  op = op || {};
  const [sx, sb] = pt(o, x, y, z), st = sb - h;
  const arch = op.arch ? w / 2 : 0;
  const shape = (e)=>{ g.beginPath(); if(arch){ g.moveTo(sx - e, sb + e); g.lineTo(sx - e, st + arch); g.arc(sx + w / 2, st + arch, w / 2 + e, Math.PI, 0); g.lineTo(sx + w + e, sb + e); g.closePath(); } else g.rect(sx - e, st - e, w + 2 * e, h + 2 * e); };
  if(op.frame !== false){ shape(1.1); g.fillStyle = op.frame || '#4e3b2a'; g.fill(); }
  shape(0); g.fillStyle = op.dark ? lin(g, sx, st, sx + w, sb, [[0, '#6b7d96'], [1, '#3e4a5c']]) : lin(g, sx, st, sx + w, sb, [[0, '#fff0b8'], [0.6, '#f6c763'], [1, '#e79a3e']]); g.fill();
  g.strokeStyle = op.frame || '#4e3b2a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(sx + w / 2, st + (arch ? 1 : 0)); g.lineTo(sx + w / 2, sb); if(h > 7){ g.moveTo(sx, st + h * 0.5); g.lineTo(sx + w, st + h * 0.5); } g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(sx + 0.6, st + arch * 0.6 + 0.6, Math.max(0.8, w * 0.18), Math.max(1, h * 0.3));
  if(op.sill !== false){ g.fillStyle = op.sill || 'rgba(255,250,236,.9)'; g.fillRect(sx - 1.6, sb + 0.4, w + 3.2, 1.5); }
  if(op.shutters){ g.fillStyle = op.shutters; g.fillRect(sx - 3.4, st, 2.6, h); g.fillRect(sx + w + 0.8, st, 2.6, h); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(sx - 3.4, st + h * 0.5, 2.6, 0.6); g.fillRect(sx + w + 0.8, st + h * 0.5, 2.6, 0.6); }
  if(op.flowers){ g.fillStyle = '#7a4a2a'; g.fillRect(sx - 1.4, sb + 1, w + 2.8, 2.2); ['#e8414f', '#f2c23a', '#f08bb4', '#ffffff'].forEach((c, k)=> ell(g, sx + 0.4 + k * (w / 3.2), sb + 0.6, 1.3, 1.2, c)); g.fillStyle = '#4f8f3a'; g.fillRect(sx - 1, sb, w + 2, 0.8); }
  if(op.gold){ g.strokeStyle = op.gold; g.lineWidth = 0.9; shape(1.9); g.stroke(); }
}
/* a window in an east side (plane x): along the depth from y, its width w, from z up h (in shade) */
function winS(g, o, x, y, z, w, h, op){
  if(!DX) return;
  op = op || {};
  fillP(g, o, [[x, y - 0.8, z - 0.8], [x, y + w + 0.8, z - 0.8], [x, y + w + 0.8, z + h + 0.8], [x, y - 0.8, z + h + 0.8]], op.frame || '#3e2f22');
  fillP(g, o, [[x, y, z], [x, y + w, z], [x, y + w, z + h], [x, y, z + h]], op.dark ? '#4a5568' : grad(g, o, [x, y, z + h], [x, y + w, z], [[0, '#f3d27a'], [1, '#c98a3a']]));
  lines(g, o, [[[x, y + w / 2, z], [x, y + w / 2, z + h]]], op.frame || '#3e2f22', 0.7);
}
/* an arched door in a front; `gold` its arch gilded; `steps` the stone before it */
function doorF(g, o, x, y, z, w, h, col, op){
  op = op || {};
  const [sx, sb] = pt(o, x, y, z), r = w / 2, st = sb - h;
  g.fillStyle = op.frame || '#3a281b'; g.beginPath(); g.moveTo(sx - 1.4, sb); g.lineTo(sx - 1.4, st + r); g.arc(sx + r, st + r, r + 1.4, Math.PI, 0); g.lineTo(sx + w + 1.4, sb); g.closePath(); g.fill();
  g.fillStyle = lin(g, sx, st, sx + w, sb, [[0, tint(col, 1.15)], [1, tint(col, 0.8)]]); g.beginPath(); g.moveTo(sx, sb); g.lineTo(sx, st + r); g.arc(sx + r, st + r, r, Math.PI, 0); g.lineTo(sx + w, sb); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(30,18,10,.4)'; g.lineWidth = 0.7; g.beginPath(); for(let k = 1; k < 3; k++){ g.moveTo(sx + w * k / 3, st + 2); g.lineTo(sx + w * k / 3, sb); } g.stroke();
  if(w >= 10){ g.strokeStyle = 'rgba(30,18,10,.45)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(sx + w / 2, st + 1); g.lineTo(sx + w / 2, sb); g.stroke(); }
  ell(g, sx + w * 0.68, sb - h * 0.42, 0.9, 0.9, op.knob || '#e8c25a');
  if(op.gold){ g.strokeStyle = op.gold; g.lineWidth = 1.6; g.beginPath(); g.arc(sx + r, st + r, r + 2.6, Math.PI, 0); g.stroke(); }
  if(op.lamp){ [sx - 4, sx + w + 4].forEach(lx=>{ g.fillStyle = '#3a2c20'; g.fillRect(lx - 0.6, sb - h * 0.75, 1.2, 4); const gl = g.createRadialGradient(lx, sb - h * 0.75 + 5, 0.5, lx, sb - h * 0.75 + 5, 6); gl.addColorStop(0, 'rgba(255,230,150,.9)'); gl.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = gl; g.fillRect(lx - 6, sb - h * 0.75 - 1, 12, 12); ell(g, lx, sb - h * 0.75 + 5, 1.6, 2, '#ffe39a'); }); }
}
/* a row of windows along a front: n of them, floors of them (from z0, each `fh` high); `skip` round the door */
function winRow(g, o, x, y, z0, w, n, floors, fh, op){
  op = op || {};
  const ww = op.ww || 6, wh = op.wh || Math.min(11, fh - 6);
  for(let f = 0; f < floors; f++) for(let k = 0; k < n; k++){
    const cx = x + w * (k + 0.5) / n;
    if(f === 0 && op.skip && Math.abs(cx - (x + w / 2)) < op.skip) continue;
    winF(g, o, cx - ww / 2, y, z0 + f * fh + (fh - wh) * 0.45, ww, wh, Object.assign({}, op, { arch:op.arch === 'top' ? f === floors - 1 : op.arch }));
  }
}
function winRowS(g, o, x, y, z0, d, n, floors, fh, op){
  op = op || {};
  const ww = op.ww || 5, wh = op.wh || Math.min(10, fh - 6);
  for(let f = 0; f < floors; f++) for(let k = 0; k < n; k++){ const cy = y + d * (k + 0.5) / n; winS(g, o, x, cy - ww / 2, z0 + f * fh + (fh - wh) * 0.45, ww, wh, op); }
}

/* ---------- ROOFS ---------- */
/* tiles: courses across a slope, from its eave (a0 → a1) to its ridge (b0 → b1), with the joints staggered */
function tiles(g, o, a0, a1, b0, b1, col, n, joints){
  const L = (p, q, t)=> [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t], S = [];
  for(let r = 1; r < n; r++){ const t = r / n; S.push([L(a0, b0, t), L(a1, b1, t)]); }
  if(joints){ const m = Math.max(3, Math.round(Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) / joints));
    for(let r = 0; r < n; r++) for(let k = 0; k < m; k++){ const u = (k + (r % 2) * 0.5) / m; if(u <= 0 || u >= 1) continue; const t0 = r / n, t1 = (r + 1) / n;
      S.push([L(L(a0, a1, u), L(b0, b1, u), t0), L(L(a0, a1, u), L(b0, b1, u), t1)]); } }
  lines(g, o, S, col, 0.6);
}
/* a gable roof along x on a block's walls (x, y, z: the walls' top; w, d), `rh` high; c = [light, mid, dark]; `wall`:
   the gable end's material */
function roofGable(g, o, x, y, z, w, d, rh, c, op){
  op = op || {};
  const v = op.ov == null ? 3 : op.ov, yr = y + d / 2, zr = z + rh, wc = op.wall || '#e8dcc0';
  fillP(g, o, [[x - v, yr, zr], [x + w + v, yr, zr], [x + w + v, y + d + v, z - 1], [x - v, y + d + v, z - 1]], c[0]);
  if(DX){ fillP(g, o, [[x + w, y, z], [x + w, y + d, z], [x + w, yr, zr]], tint(wc, 0.7));
    fillP(g, o, [[x + w + v, y - v, z - 1.4], [x + w + v + 0.9, y - v, z - 1.4], [x + w + v + 0.9, yr, zr], [x + w + v + 0.9, y + d + v, z - 1.4], [x + w + v, y + d + v, z - 1.4], [x + w + v, yr, zr]], tint(c[2], 0.85)); }
  const front = [[x - v, y - v, z - 1.4], [x + w + v, y - v, z - 1.4], [x + w + v, yr, zr], [x - v, yr, zr]];
  fillP(g, o, front, grad(g, o, [x, y - v, z], [x, yr, zr], [[0, tint(c[1], 0.9)], [1, c[1]]]));
  if(op.thatch){ const S = []; for(let k = 0; k <= Math.round(w / 2.2); k++){ const xx = x - v + (w + 2 * v) * k / Math.round(w / 2.2); S.push([[xx, y - v, z - 1.4], [xx + (k % 3 - 1) * 0.8, yr, zr]]); } lines(g, o, S, tint(c[2], 1.05), 0.7); }
  else tiles(g, o, [x - v, y - v, z - 1.4], [x + w + v, y - v, z - 1.4], [x - v, yr, zr], [x + w + v, yr, zr], 'rgba(0,0,0,.2)', Math.max(3, Math.round(rh / 4.5)), op.joints === false ? 0 : 5);
  fillP(g, o, [[x - v, y - v, z - 1.4], [x + (w + 2 * v) * 0.35 - v, y - v, z - 1.4], [x + (w + 2 * v) * 0.35 - v, yr, zr], [x - v, yr, zr]], 'rgba(255,255,255,.08)');
  lines(g, o, [[[x - v, yr, zr + 0.6], [x + w + v, yr, zr + 0.6]]], op.ridge || tint(c[0], 1.15), 2.2);
  lines(g, o, [[[x - v, y - v, z - 1.4], [x + w + v, y - v, z - 1.4]]], 'rgba(30,20,12,.45)', 1);
}
/* a gable roof along y (its gable to the front): the front's triangle in `wall`, its slopes to the east and the west */
function roofGableY(g, o, x, y, z, w, d, rh, c, op){
  op = op || {};
  const v = op.ov == null ? 3 : op.ov, xr = x + w / 2, zr = z + rh, wc = op.wall || '#e8dcc0';
  fillP(g, o, [[x - v, y - v, z - 1.4], [xr, y - v, zr], [xr, y + d + v, zr], [x - v, y + d + v, z - 1.4]], grad(g, o, [x, y, z], [xr, y, zr], [[0, tint(c[0], 0.95)], [1, c[0]]]));
  const east = [[xr, y - v, zr], [x + w + v, y - v, z - 1.4], [x + w + v, y + d + v, z - 1.4], [xr, y + d + v, zr]];
  fillP(g, o, east, grad(g, o, [xr, y, zr], [x + w + v, y, z], [[0, c[1]], [1, c[2]]]));
  tiles(g, o, [x + w + v, y - v, z - 1.4], [x + w + v, y + d + v, z - 1.4], [xr, y - v, zr], [xr, y + d + v, zr], 'rgba(0,0,0,.2)', Math.max(3, Math.round(rh / 4.5)), 5);
  tiles(g, o, [x - v, y - v, z - 1.4], [x - v, y + d + v, z - 1.4], [xr, y - v, zr], [xr, y + d + v, zr], 'rgba(0,0,0,.14)', Math.max(3, Math.round(rh / 4.5)), 0);
  fillP(g, o, [[x, y, z], [x + w, y, z], [xr, y, zr - 1.2]], grad(g, o, [x, y, z], [x + w, y, z], [[0, tint(wc, 1.02)], [1, tint(wc, 0.9)]]));
  lines(g, o, [[[x - v, y - v, z - 1.4], [xr, y - v, zr]], [[xr, y - v, zr], [x + w + v, y - v, z - 1.4]]], op.verge || tint(c[2], 0.9), 2);
  lines(g, o, [[[xr, y - v, zr + 0.5], [xr, y + d + v, zr + 0.5]]], tint(c[0], 1.15), 1.6);
  if(op.round){ const [sx, sy] = pt(o, xr, y, z + rh * 0.45); ell(g, sx, sy, 3, 3, '#3e2f22'); ell(g, sx, sy, 2.2, 2.2, op.round); }
}
/* a hip roof (a pyramid when square): its front, its east end, the back above the ridge */
function roofHip(g, o, x, y, z, w, d, rh, c, op){
  op = op || {};
  const v = op.ov == null ? 3 : op.ov, yr = y + d / 2, zr = z + rh, i = Math.min(d / 2, w / 2), xa = x + i, xb = x + w - i;
  const A = [x - v, y - v, z - 1.4], B = [x + w + v, y - v, z - 1.4], Cc = [x + w + v, y + d + v, z - 1.4], D = [x - v, y + d + v, z - 1.4], Ra = [xa, yr, zr], Rb = [xb, yr, zr];
  fillP(g, o, [D, Cc, Rb, Ra], c[0]);
  fillP(g, o, [B, Cc, Rb], grad(g, o, B, Rb, [[0, c[2]], [1, tint(c[1], 0.9)]]));
  tiles(g, o, B, Cc, Rb, Rb, 'rgba(0,0,0,.18)', Math.max(3, Math.round(rh / 5)), 0);
  if(!DX){ fillP(g, o, [A, D, Ra], grad(g, o, A, Ra, [[0, tint(c[0], 0.96)], [1, tint(c[0], 1.06)]])); tiles(g, o, A, D, Ra, Ra, 'rgba(0,0,0,.12)', Math.max(3, Math.round(rh / 5)), 0); }
  fillP(g, o, [A, B, Rb, Ra], grad(g, o, A, Ra, [[0, tint(c[1], 0.9)], [1, c[1]]]));
  tiles(g, o, A, B, Ra, Rb, 'rgba(0,0,0,.2)', Math.max(3, Math.round(rh / 4.5)), op.joints === false ? 0 : 5);
  fillP(g, o, [A, [x - v + (w + 2 * v) * 0.3, y - v, z - 1.4], [xa + (xb - xa) * 0.3, yr, zr], Ra], 'rgba(255,255,255,.08)');
  const ridge = op.ridge || tint(c[0], 1.15);
  lines(g, o, [[Ra, Rb], [B, Rb], [A, Ra]].concat(DX ? [] : [[D, Ra], [Cc, Rb]]), ridge, op.ridgeW || 1.6);
  lines(g, o, [[A, B]], 'rgba(30,20,12,.45)', 1);
  return pt(o, (xa + xb) / 2, yr, zr);
}
/* a barn's gambrel, its gable to the front: two pitches each side; `wall` its front's boards */
function roofGambrel(g, o, x, y, z, w, d, rh, c, op){
  op = op || {};
  const v = 3, y0 = y - v, y1 = y + d + v;
  const Q = [[x - v, z - 1.4], [x + w * 0.17, z + rh * 0.6], [x + w / 2, z + rh], [x + w * 0.83, z + rh * 0.6], [x + w + v, z - 1.4]];
  const quad = (a, b, f)=> fillP(g, o, [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], f);
  if(!DX) quad(Q[0], Q[1], tint(c[0], 1.04));
  quad(Q[1], Q[2], tint(c[0], 0.98));
  quad(Q[2], Q[3], grad(g, o, [Q[2][0], y, Q[2][1]], [Q[3][0], y, Q[3][1]], [[0, c[1]], [1, tint(c[1], 0.88)]]));
  quad(Q[3], Q[4], grad(g, o, [Q[3][0], y, Q[3][1]], [Q[4][0], y, Q[4][1]], [[0, tint(c[2], 1.05)], [1, c[2]]]));
  tiles(g, o, [Q[4][0], y0, Q[4][1]], [Q[4][0], y1, Q[4][1]], [Q[3][0], y0, Q[3][1]], [Q[3][0], y1, Q[3][1]], 'rgba(0,0,0,.2)', 4, 0);
  tiles(g, o, [Q[3][0], y0, Q[3][1]], [Q[3][0], y1, Q[3][1]], [Q[2][0], y0, Q[2][1]], [Q[2][0], y1, Q[2][1]], 'rgba(0,0,0,.18)', 3, 0);
  /* the front: the boards up into the gable */
  const wc = op.wall || MAT.barn.c, P = [[x, y, z], [x + w, y, z], [x + w * 0.83 - 0.6, y, z + rh * 0.6 - 1], [x + w / 2, y, z + rh - 1.6], [x + w * 0.17 + 0.6, y, z + rh * 0.6 - 1]];
  fillP(g, o, P, grad(g, o, [x, y, z], [x + w, y, z], [[0, tint(wc, 1.04)], [1, tint(wc, 0.9)]]));
  const S = []; for(let xx = x + 4.5; xx < x + w - 1; xx += 4.5){ const t = Math.abs(xx - (x + w / 2)) / (w / 2), top = t < 0.66 ? z + rh - 1.6 - (rh * 0.4) * (t / 0.66) : z + rh * 0.6 - 1 - (rh * 0.6) * ((t - 0.66) / 0.34); S.push([[xx, y, z], [xx, y, top]]); }
  lines(g, o, S, 'rgba(64,14,8,.3)', 0.6);
  const trim = op.trim || '#f6efe2';
  lines(g, o, [[[Q[0][0], y0, Q[0][1]], [Q[1][0], y0, Q[1][1]]], [[Q[1][0], y0, Q[1][1]], [Q[2][0], y0, Q[2][1]]], [[Q[2][0], y0, Q[2][1]], [Q[3][0], y0, Q[3][1]]], [[Q[3][0], y0, Q[3][1]], [Q[4][0], y0, Q[4][1]]]], trim, 2.2);
  lines(g, o, [[[Q[2][0], y0, Q[2][1] + 0.6], [Q[2][0], y1, Q[2][1] + 0.6]]], tint(c[0], 1.15), 1.6);
}
/* a flat roof's parapet of merlons on a block's front and east edges */
function merlons(g, o, x, y, z, w, d, m, op){
  op = op || {};
  const s = op.step || 8, mw = s * 0.55, mh = op.h || 4.5, t = op.t || 2.6;
  if(!DX) for(let xx = x; xx < x + w - 1; xx += s) block(g, o, xx, y + d - t, z, Math.min(mw, x + w - xx), t, mh, m, { tex:false });   // (4.80) the back's, behind
  for(let yy = y + d - mw; yy > y + mw; yy -= s){ block(g, o, x + w - t, yy, z, t, mw, mh, m, { tex:false }); if(!DX) block(g, o, x, yy, z, t, mw, mh, m, { tex:false }); }
  for(let xx = x; xx < x + w - 1; xx += s) block(g, o, xx, y, z, Math.min(mw, x + w - xx), t, mh, m, { tex:false, trim:op.gold });
}
/* a balustrade along a front (plane y), from x, w long */
function rail(g, o, x, y, z, w, h, col, gold){
  const [sx, sb] = pt(o, x, y, z);
  g.fillStyle = col || '#f6f0e2'; g.fillRect(sx, sb - h, w, 1.8); g.fillRect(sx, sb - 1.2, w, 1.4);
  for(let k = 0; k <= w / 3.2; k++){ g.fillRect(sx + 0.4 + k * 3.2, sb - h + 1, 1.2, h - 1.6); }
  if(gold){ g.fillStyle = gold; g.fillRect(sx, sb - h - 0.6, w, 0.9); }
}
/* a column standing at (x, y) from z: round, lit from the left; its capital and base */
function column(g, o, x, y, z, r, h, col, cap){
  const [sx, sb] = pt(o, x, y, z);
  g.fillStyle = lin(g, sx - r, 0, sx + r, 0, [[0, tint(col, 1.06)], [0.4, col], [1, tint(col, 0.72)]]); g.fillRect(sx - r, sb - h, 2 * r, h);
  g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 0.5; g.beginPath(); for(let k = -1; k <= 1; k++){ g.moveTo(sx + k * r * 0.5, sb - h + 2); g.lineTo(sx + k * r * 0.5, sb - 2); } g.stroke();
  g.fillStyle = cap || tint(col, 1.04); g.fillRect(sx - r - 1.2, sb - h - 1.6, 2 * r + 2.4, 2.2); g.fillRect(sx - r - 1, sb - 2, 2 * r + 2, 2);
}
/* a pediment over a portico: its triangle on the front (plane y), cornice, a medallion */
function pediment(g, o, x, y, z, w, h, col, gold){
  fillP(g, o, [[x - 1.5, y, z], [x + w + 1.5, y, z], [x + w / 2, y, z + h]], tint(col, 0.95));
  fillP(g, o, [[x + 3, y, z + 1.6], [x + w - 3, y, z + 1.6], [x + w / 2, y, z + h - 2.4]], tint(col, 0.86));
  lines(g, o, [[[x - 1.5, y, z], [x + w / 2, y, z + h]], [[x + w / 2, y, z + h], [x + w + 1.5, y, z]], [[x - 1.5, y, z], [x + w + 1.5, y, z]]], gold || tint(col, 1.1), 1.6);
  const [sx, sy] = pt(o, x + w / 2, y, z + h * 0.36); ell(g, sx, sy, 3.2, 3.2, gold || '#c8463c'); ell(g, sx, sy, 1.6, 1.6, tint(col, 1.05));
}
/* steps up to a front: n of them, from (x, y) w wide, rising toward the back */
function steps(g, o, x, y, z, w, n, rise, tread, m){
  for(let k = 0; k < n; k++) block(g, o, x + k * 0.01, y + k * tread, z, w, (n - k) * tread, (k + 1) * rise, m || MAT.white, { tex:false, top:true });
}
/* a round tower at (x, y) on the frame, from z: the kit's own, its shadow first */
function tower(g, o, x, y, z, r, h, roof, op){
  const [sx, sy] = pt(o, x, y, z);
  if(!z) roundShadow(g, sx, sy, r * 1.1, h, 0.2);
  roundTower(g, sx, sy, r, h, roof, op);
  return [sx, sy - h];
}
/* a dome on a drum, from (x, y, z) on a roof: the drum's windows, its ribs, its lantern */
function domeOn(g, o, x, y, z, r, hd, c, op){
  op = op || {};
  const [sx, sy] = pt(o, x, y, z);
  g.fillStyle = lin(g, sx - r, 0, sx + r, 0, [[0, '#fffdf6'], [0.45, '#ece5d4'], [1, '#aea692']]);
  g.beginPath(); g.moveTo(sx - r, sy - hd); g.lineTo(sx - r, sy); g.ellipse(sx, sy, r, r * 0.34, 0, Math.PI, 0, true); g.lineTo(sx + r, sy - hd); g.closePath(); g.fill();
  for(let k = 0; k < 6; k++){ const a = Math.PI * (0.12 + k * 0.152), wx = sx - Math.cos(a) * r * 0.86; if(Math.abs(wx - sx) > r * 0.8) continue; g.fillStyle = '#4e3b2a'; g.fillRect(wx - 1.6, sy - hd + 3, 3.2, hd - 6); g.fillStyle = '#f6c763'; g.fillRect(wx - 1, sy - hd + 3.6, 2, hd - 7.2); }
  if(op.band){ g.strokeStyle = op.band; g.lineWidth = 1.6; g.beginPath(); g.ellipse(sx, sy - hd, r, r * 0.34, 0, 0.05, Math.PI - 0.05); g.stroke(); }
  ell(g, sx, sy - hd, r, r * 0.34, '#efe8d6');
  const top = dome(g, sx, sy - hd + 0.4, r + 1, c, op.tip || GOLD[1], (r + 1) * 0.34);   // (4.80) sitting on the drum's top (its foot the top's near edge)
  if(op.crown) crown(g, sx, top + 3, op.crown);
  return top;
}
function flag3(g, o, x, y, z, col, h){ const [sx, sy] = pt(o, x, y, z); flag(g, sx, sy, col, h); }
/* a statue on its plinth: a figure in white stone or gold */
function statue(g, sx, sb, s, col){
  shade(g, sx + 3, sb + 1, 6 * s, 2 * s, 0.25);
  g.fillStyle = lin(g, sx - 4 * s, 0, sx + 4 * s, 0, [[0, '#f3efe6'], [1, '#b8b0a0']]); g.fillRect(sx - 4 * s, sb - 9 * s, 8 * s, 9 * s);
  g.fillStyle = '#fbf8f2'; g.fillRect(sx - 5 * s, sb - 10 * s, 10 * s, 1.8 * s);
  const c = col || '#e9e4da';
  g.fillStyle = lin(g, sx - 3 * s, 0, sx + 3 * s, 0, [[0, tint(c, 1.08)], [1, tint(c, 0.75)]]);
  g.beginPath(); g.moveTo(sx - 2.6 * s, sb - 10 * s); g.lineTo(sx - 1.8 * s, sb - 19 * s); g.lineTo(sx + 1.8 * s, sb - 19 * s); g.lineTo(sx + 2.6 * s, sb - 10 * s); g.closePath(); g.fill();
  ell(g, sx, sb - 21 * s, 2 * s, 2.2 * s, tint(c, 0.95));
  g.strokeStyle = tint(c, 0.85); g.lineWidth = 1.2 * s; g.beginPath(); g.moveTo(sx + 1.6 * s, sb - 17 * s); g.lineTo(sx + 4.6 * s, sb - 23 * s); g.stroke();
}
/* a lamp post, lit */
function lamp(g, sx, sb, h, gold){
  g.fillStyle = gold ? GOLD[2] : '#3a342c'; g.fillRect(sx - 0.8, sb - h, 1.6, h); g.fillRect(sx - 2, sb - 1.4, 4, 1.4);
  const gl = g.createRadialGradient(sx, sb - h - 2, 0.5, sx, sb - h - 2, 9); gl.addColorStop(0, 'rgba(255,236,170,.85)'); gl.addColorStop(1, 'rgba(255,210,110,0)');
  g.fillStyle = gl; g.fillRect(sx - 9, sb - h - 11, 18, 18);
  g.fillStyle = gold ? GOLD[1] : '#3a342c'; g.fillRect(sx - 2.2, sb - h - 5.6, 4.4, 1.2); ell(g, sx, sb - h - 2.4, 1.8, 2.4, '#fff0b0');
}
/* a tree in a garden, round and clipped (an orange tree in its tub at the palace, an apple tree at the granary) */
function gardenTree(g, sx, sb, s, fruit, tub){
  shade(g, sx + 5 * s, sb + 1, 9 * s, 3 * s, 0.26);
  if(tub){ g.fillStyle = lin(g, sx - 4 * s, 0, sx + 4 * s, 0, [[0, '#7aa0d8'], [1, '#3d5f98']]); g.fillRect(sx - 4 * s, sb - 6 * s, 8 * s, 6 * s); g.fillStyle = GOLD[1]; g.fillRect(sx - 4.4 * s, sb - 6.4 * s, 8.8 * s, 1.2 * s); }
  g.fillStyle = '#6b4426'; g.fillRect(sx - 0.9 * s, sb - (tub ? 13 : 9) * s, 1.8 * s, (tub ? 7 : 9) * s);
  const cy = sb - (tub ? 19 : 17) * s;
  ell(g, sx, cy, 8 * s, 7 * s, '#3b7a30'); ell(g, sx - 2 * s, cy - 2 * s, 5.4 * s, 4.6 * s, '#5aa245'); ell(g, sx - 3 * s, cy - 3.4 * s, 2.6 * s, 2.2 * s, '#86c862');
  if(fruit) [[-4, 1], [2, -3], [4, 2], [-1, 3], [0, -1]].forEach(([dx, dy])=> ell(g, sx + dx * s, cy + dy * s, 1.3 * s, 1.3 * s, fruit));
}

/* ============================================================
   THE PALACE
   ============================================================ */
/* (4.80) the designer: "palace 10 should not turn yellow" — its roofs and domes stay blue (gold only in its trim, its
   finials and its flags) */
const PALC = L=> ({ m:L >= 10 ? MAT.marble : L >= 8 ? MAT.white : MAT.cream, roof:ROOF.blue, gold:L >= 7 ? GOLD[1] : null, dome:BLUE });
/* on its own plot (1 to 5): a hall of cream stone, its hip roof, round towers at its front corners; a keep with a
   spire (3), a second floor and a balcony (4), a gold spire (5) */
function palacePlot(g, x0, y0, L){
  const o = { X:x0 + 24, B:y0 + 90 }, m = MAT.cream, w = 48, d = 30, h = 24 + 4 * Math.min(L, 4), gold = L >= 3 ? GOLD[1] : null;
  castShadow(g, o, 0, 0, w, d, h, 0.24);
  /* the keep behind (3) */
  if(L >= 3){ const kh = h + 22 + 3 * L; block(g, o, 15, 12, 0, 18, 14, kh, m, { quoins:true }); winF(g, o, 21, 12, kh - 14, 5, 8, { arch:true });
    roofHip(g, o, 15, 12, kh, 18, 14, 18 + 2 * L, L >= 5 ? ROOF.gold : ROOF.blue, { ov:2 }); const [fx, fy] = pt(o, 24, 19, kh + 18 + 2 * L); flag(g, fx, fy, '#e0b84a', 10); }
  block(g, o, 0, 0, 0, w, d, h, m, { quoins:true, trim:gold });
  winRow(g, o, 0, 0, 0, w, 3, L >= 4 ? 2 : 1, L >= 4 ? 14 : h, { arch:true, skip:8, ww:5.5, wh:9, flowers:L >= 2 });
  winRowS(g, o, w, 0, 0, d, 2, L >= 4 ? 2 : 1, L >= 4 ? 14 : h, { ww:4.5, wh:8 });
  doorF(g, o, w / 2 - 5, 0, 0, 10, 16, '#6b3f24', { gold:gold, lamp:L >= 2 });
  if(L >= 2) [9, w - 13].forEach(bx=>{ const [sx, sy] = pt(o, bx, 0, h - 4); banner(g, sx, sy, 4, 11, '#c8463c', gold || '#e0b84a'); });
  roofHip(g, o, 0, 0, h, w, d, 16 + L, ROOF.blue, { ridge:gold || undefined });
  if(L >= 4){ const [bx, by] = pt(o, w / 2 - 8, 0, 18); g.fillStyle = '#f4eee0'; g.fillRect(bx, by, 16, 1.6); rail(g, o, w / 2 - 8, -0.5, 18, 16, 4, '#f4eee0', gold); }
  /* the round towers at the front corners */
  const th = 40 + 5 * L, roof = L >= 5 ? 'dome' : 'cone';
  [[-2, 4], [w + 2, 4]].forEach(([tx, ty])=> tower(g, o, tx, ty, 0, 7, th, roof, { roof:BLUE[1], roofL:BLUE[0], roofD:BLUE[2], tip:gold || '#e0b84a', flag:'#c8463c', slits:2, band:L >= 4 ? GOLD[1] : null, domeC:GOLD, white:L >= 5 }));
  const [sx, sb] = pt(o, w / 2 - 9, -4, 0); g.fillStyle = '#e7dcc4'; g.fillRect(sx, sb - 2, 18, 3); g.fillStyle = '#d7cbb0'; g.fillRect(sx - 3, sb, 24, 3);
}
/* its ground from 6 (4 by 3 plots, the whole of it): inside its walls, the terrace it stands on (paved in great
   slabs), the forecourt's avenue from the gate, its gardens either side, the fountain's basin; the gardens hedged (7),
   in parterres (8), reflecting pools and a red carpet (10) */
const PG = { wall:14, front:286, back:40, terr:196, cross:244 };
function slabs(g, x0, y0, x1, y1, sw, sh, col, line){
  g.fillStyle = col; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.strokeStyle = line; g.lineWidth = 0.6; g.beginPath();
  for(let y = y0 + sh, r = 1; y < y1; y += sh, r++){ g.moveTo(x0, y); g.lineTo(x1, y); }
  for(let y = y0, r = 0; y < y1; y += sh, r++) for(let x = x0 + (r % 2) * sw / 2; x < x1; x += sw){ if(x <= x0) continue; g.moveTo(x, y); g.lineTo(x, Math.min(y1, y + sh)); }
  g.stroke();
}
function palaceGround(g, X, Y, w, h, L, i){
  const W = w * 100, R = rng(i * 13 + 7), cx = X + W / 2, lv = Math.min(L - 6, 4);
  const ax = 22 + 4 * lv, yT = Y + PG.terr, yc = Y + PG.cross, fr = 22 + 3 * lv;
  /* the lawn inside the walls, greener */
  g.fillStyle = lin(g, X, Y, X + W, Y + 300, [[0, '#a8d97c'], [1, '#86bd5e']]); g.fillRect(X + PG.wall, Y + PG.back, W - 2 * PG.wall, PG.front - PG.back);
  g.fillStyle = 'rgba(255,255,255,.08)'; for(let yy = Y + PG.back; yy < Y + PG.front; yy += 20) g.fillRect(X + PG.wall, yy, W - 2 * PG.wall, 10);
  /* the terrace's top, in great slabs (the palace on it) */
  slabs(g, X + 24, Y + PG.back + 2, X + W - 24, yT, 22, 11, L >= 9 ? '#efe9dc' : '#e2d6bc', 'rgba(140,120,90,.3)');
  /* the avenue, from the gate to the steps: big pale slabs, a gold border from 8 */
  slabs(g, cx - ax, yT, cx + ax, Y + PG.front, ax / 2, 12, L >= 9 ? '#f4efe4' : '#e9dfca', 'rgba(150,130,96,.32)');
  if(L >= 8){ g.fillStyle = GOLD[1]; g.fillRect(cx - ax - 2, yT, 2, Y + PG.front - yT); g.fillRect(cx + ax, yT, 2, Y + PG.front - yT); }
  /* the cross walk to the gardens (7) */
  if(L >= 7) slabs(g, X + PG.wall + 6, yc - 7, X + W - PG.wall - 6, yc + 7, 14, 14, '#e9dfca', 'rgba(150,130,96,.3)');
  /* the fountain's basin, at the crossing */
  ell(g, cx, yc, fr + 4, (fr + 4) * 0.55, '#d8ceb6'); ell(g, cx, yc, fr + 1.5, (fr + 1.5) * 0.55, '#bfb29a');
  ell(g, cx, yc + 0.6, fr, fr * 0.55, lin(g, 0, yc - fr, 0, yc + fr, [[0, '#7cc3ee'], [1, '#3d8dcf']]));
  ell(g, cx - fr * 0.3, yc - fr * 0.15, fr * 0.3, fr * 0.08, 'rgba(255,255,255,.45)');
  /* the gardens: beds either side, hedged (7), parterres (8), a pool each side (10) */
  [[X + PG.wall + 8, cx - ax - 8], [cx + ax + 8, X + W - PG.wall - 8]].forEach(([a, b], s)=>{
    const top = yT + 8, bot = Y + PG.front - 14;
    if(L >= 10){ const py = (top + yc - 9) / 2; g.fillStyle = '#e4dccb'; rr(g, a + 6, py - 14, b - a - 12, 28, 6); g.fill(); g.fillStyle = lin(g, 0, py - 11, 0, py + 11, [[0, '#86c9f0'], [1, '#4a96d6']]); rr(g, a + 9, py - 11, b - a - 18, 22, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(a + 14, py - 7, (b - a) * 0.35, 1.6); }
    const beds = L >= 10 ? [[a, yc + 10, b, bot]] : [[a, top, b, yc - 10], [a, yc + 10, b, bot]];
    beds.forEach(([x0, y0, x1, y1], k)=>{
      if(L >= 8) return parterre(g, x0 + 2, y0, x1 - x0 - 4, y1 - y0, R, [['#e8414f', '#f2c23a', '#ffffff'], ['#c9a6f0', '#f08bb4', '#ffffff'], ['#f2c23a', '#ff9d6e', '#ffffff']][(k + s) % 3]);
      g.fillStyle = L >= 7 ? '#2f6a2c' : '#5c9a42'; rr(g, x0 + 4, y0 + 2, x1 - x0 - 8, y1 - y0 - 4, 6); g.fill();
      g.fillStyle = '#8fc866'; rr(g, x0 + 7, y0 + 5, x1 - x0 - 14, y1 - y0 - 11, 4); g.fill();
      for(let j = 0; j < (x1 - x0) * (y1 - y0) / 60; j++) ell(g, x0 + 9 + R() * (x1 - x0 - 18), y0 + 7 + R() * (y1 - y0 - 15), 1.4, 1.4, ['#e8414f', '#f2c23a', '#ffffff', '#f08bb4', '#c9a6f0'][j % 5]);
    });
  });
  /* the red carpet (10), round the fountain */
  if(L >= 10){ const c1 = yc - fr * 0.55 - 6, c2 = yc + fr * 0.55 + 6;
    [[yT, c1], [c2, Y + PG.front]].forEach(([a, b])=>{ g.fillStyle = lin(g, cx - 8, 0, cx + 8, 0, [[0, '#c23a3a'], [0.5, '#e04848'], [1, '#a82e2e']]); g.fillRect(cx - 8, a, 16, b - a); g.fillStyle = GOLD[1]; g.fillRect(cx - 8, a, 1, b - a); g.fillRect(cx + 7, a, 1, b - a); }); }
}
/* its own walls round its ground, a little city wall: the runs (north and south: their face, the walk, the battlements;
   west and east: the walk seen from above), towers at the corners, the gatehouse */
function palaceWalls(g, X, Y, W, L, part){
  const lv = Math.min(L - 6, 4), H = 14 + lv * 1.6, T = 7, white = L >= 8, gold = L >= 9 ? GOLD[1] : null;
  const top = white ? '#fbf8f1' : '#efe3c6', face = white ? '#dcd5c6' : '#cdbf9f', walk = white ? '#cfc7b6' : '#b6a888';
  const xW = X + PG.wall, xE = X + W - PG.wall, yN = Y + PG.back, yS = Y + PG.front, gx = X + W / 2;
  const tOpt = { slits:2, flag:'#c8463c', white, band:gold, domeC:BLUE, roof:BLUE[1], roofL:BLUE[0], roofD:BLUE[2], tip:GOLD[1], cone:L >= 10 ? 2.1 : 1.7 };
  const tR = 12 + lv, tH = H + 30 + 5 * lv, tRoof = L >= 10 ? 'cone' : L >= 8 ? 'dome' : 'cone';   // (4.80) spires at 10
  const runH = (a, b, y, south)=>{
    g.fillStyle = lin(g, 0, y - H, 0, y, [[0, top], [1, face]]); g.fillRect(a, y - H, b - a, H);
    g.strokeStyle = 'rgba(70,60,48,.26)'; g.lineWidth = 0.7; g.beginPath(); for(let r = 1; r * 5 < H; r++){ g.moveTo(a, y - r * 5); g.lineTo(b, y - r * 5); } g.stroke();
    g.fillStyle = walk; g.fillRect(a, y - H - T, b - a, T); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(a, y - H - T, b - a, 1.6);
    if(gold && south){ g.fillStyle = gold; g.fillRect(a, y - H, b - a, 1.6); }
    const edge = south ? y - H : y - H - T;
    for(let x = a + 2; x < b - 4; x += 9){ g.fillStyle = top; g.fillRect(x, edge - 4.5, 5, 4.5); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x + 3.8, edge - 4.5, 1.2, 4.5); if(gold){ g.fillStyle = gold; g.fillRect(x, edge - 5, 5, 0.8); } }
    if(south && L >= 7) for(let x = a + 22; x < b - 16; x += 46){ banner(g, x, y - H + 1.5, 5, H - 3, L >= 9 ? '#3c6fc4' : '#c8463c', GOLD[1]); }
  };
  const runV = (x, west, a, b)=>{
    g.fillStyle = 'rgba(22,30,14,.18)'; g.fillRect(x + T / 2, a, 6, b - a);
    g.fillStyle = walk; g.fillRect(x - T / 2, a - H, T, b - a); g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x - T / 2, a - H, 1.6, b - a);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + T / 2 - 1.2, a - H, 1.2, b - a);
    if(west){ g.fillStyle = lin(g, x + T / 2, 0, x + T / 2 + 3, 0, [[0, tint(face, 0.8)], [1, tint(face, 0.66)]]); g.fillRect(x + T / 2, a - H, 3, b - a); }
    const ex = west ? x - T / 2 - 0.5 : x + T / 2 - 4.5;
    for(let yy = a + 3; yy < b - 3; yy += 9){ g.fillStyle = top; g.fillRect(ex, yy - H - 3, 5, 6.5); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ex, yy - H + 2.2, 5, 1.2); }
  };
  if(part === 'back'){
    runH(xW, xE, yN, false);
    [xW, xE].forEach(tx=>{ roundShadow(g, tx, yN + 2, tR, tH, 0.18); roundTower(g, tx, yN + 2, tR, tH, tRoof, tOpt); });
    runV(xW, true, yN + 6, yS - 2); runV(xE, false, yN + 6, yS - 2);
    return;
  }
  /* the front: the runs either side of the gate, corner towers, the gatehouse */
  runH(xW, gx - 36, yS, true); runH(gx + 36, xE, yS, true);
  [xW, xE].forEach(tx=>{ roundShadow(g, tx, yS + 3, tR, tH, 0.2); roundTower(g, tx, yS + 3, tR, tH, tRoof, tOpt); });
  const gr = 11 + lv * 0.8, gh = H + 26 + 4 * lv;
  /* the gatehouse: its arch between two drum towers, battlements, the arms of the kingdom over it */
  g.fillStyle = lin(g, 0, yS - H - 12, 0, yS, [[0, top], [1, face]]); g.fillRect(gx - 24, yS - H - 12, 48, H + 12);
  g.fillStyle = walk; g.fillRect(gx - 24, yS - H - 15, 48, 3);
  for(let x = gx - 22; x < gx + 20; x += 8){ g.fillStyle = top; g.fillRect(x, yS - H - 20, 4.5, 5); if(gold){ g.fillStyle = gold; g.fillRect(x, yS - H - 20.6, 4.5, 0.8); } }
  g.fillStyle = '#2a221a'; g.beginPath(); g.moveTo(gx - 11, yS); g.lineTo(gx - 11, yS - H + 1); g.arc(gx, yS - H + 1, 11, Math.PI, 0); g.lineTo(gx + 11, yS); g.fill();
  g.fillStyle = L >= 8 ? lin(g, gx - 19, 0, gx - 11, 0, [[0, GOLD[0]], [1, GOLD[2]]]) : '#7a4a2a'; g.fillRect(gx - 19, yS - H + 3, 7, H - 3); g.fillRect(gx + 12, yS - H + 3, 7, H - 3);
  if(L >= 8){ g.strokeStyle = GOLD[2]; g.lineWidth = 0.6; g.beginPath(); for(let k = 0; k < 3; k++){ g.moveTo(gx - 17.5 + k * 2, yS - H + 4); g.lineTo(gx - 17.5 + k * 2, yS - 1); g.moveTo(gx + 13.5 + k * 2, yS - H + 4); g.lineTo(gx + 13.5 + k * 2, yS - 1); } g.stroke(); }
  g.strokeStyle = gold || '#d6c7a2'; g.lineWidth = 1.4; g.beginPath(); g.arc(gx, yS - H + 1, 13, Math.PI, 0); g.stroke();
  [gx - 32, gx + 32].forEach(tx=>{ roundShadow(g, tx, yS + 4, gr, gh, 0.2); roundTower(g, tx, yS + 4, gr, gh, tRoof, Object.assign({}, tOpt, { slits:1, flag:L >= 8 ? GOLD[1] : '#c8463c' })); });
  g.fillStyle = '#3c6fc4'; g.beginPath(); const sy = yS - H - 6; g.moveTo(gx - 6, sy - 7); g.lineTo(gx + 6, sy - 7); g.lineTo(gx + 6, sy); g.lineTo(gx, sy + 4.5); g.lineTo(gx - 6, sy); g.closePath(); g.fill(); ell(g, gx, sy - 2.4, 2, 2, GOLD[1]);
  if(L >= 9) crown(g, gx, sy - 9, 0.9);
}
/* a cypress, tall and dark: the palace's garden behind it */
function cypress(g, sx, sb, h){
  shade(g, sx + h * 0.22, sb + 1, h * 0.18, 2.4, 0.24);
  g.fillStyle = '#5a3a22'; g.fillRect(sx - 0.8, sb - 4, 1.6, 4);
  g.fillStyle = lin(g, sx - h * 0.12, 0, sx + h * 0.12, 0, [[0, '#4f8f3a'], [0.5, '#2f6a2c'], [1, '#1f4a1e']]);
  g.beginPath(); g.moveTo(sx, sb - h); g.quadraticCurveTo(sx + h * 0.16, sb - h * 0.45, sx + h * 0.1, sb - 3); g.lineTo(sx - h * 0.1, sb - 3); g.quadraticCurveTo(sx - h * 0.16, sb - h * 0.45, sx, sb - h); g.fill();
  g.strokeStyle = 'rgba(140,200,110,.35)'; g.lineWidth = 0.7; g.beginPath(); for(let k = 1; k < 5; k++){ const yy = sb - h * k / 5.5; g.moveTo(sx - h * 0.08, yy + 2); g.quadraticCurveTo(sx - h * 0.02, yy - 1, sx + h * 0.02, yy); } g.stroke();
}
/* (4.80) behind the palace from 8 (the designer: "palace 10 should not turn yellow but instead have more grand buildings
   behind instead of a row of trees. palace 8 and 9 should also follow suit but to a lesser degree. they look rather
   similar to palace 6 and 7"): its back court, where the cypresses stood. A long range across the back (two floors at
   8, three at 9, four at 10), its end pavilions (hip roofs at 8, domes at 9, spires at 10); round towers rising behind
   the great hall (9, 10), and at 10 two more behind the wings. */
function palaceRear(g, X, Y, W, L, C){
  const m = C.m, gold = C.gold, cx = X + W / 2, n = L - 8, fl = 14;
  const floors = 2 + n, h = floors * fl + 6, rh = 20 + 5 * n, d = 26;
  const o = { X:X + 58, B:Y + PG.back + 64 }, ow = W - 116;
  const tOpt = { roof:C.roof[1], roofL:C.roof[0], roofD:C.roof[2], tip:GOLD[1], flag:'#c8463c', slits:3, band:gold, white:true, domeC:C.dome, cone:L >= 10 ? 3 : 2 };
  /* the towers behind it all: at 10, two behind the wings */
  if(L >= 10) [cx - 118, cx + 118].forEach(tx=> roundTower(g, tx, o.B - 4, 10, h + 60, 'cone', Object.assign({}, tOpt, { slits:2 })));
  /* the range */
  castShadow(g, o, 0, 0, ow, d, h, 0.16);
  block(g, o, 0, 0, 0, ow, d, h, m, { quoins:true, trim:gold, plinth:tint(m.c, 0.82) });
  winRow(g, o, 0, 0, 0, ow, 15, floors, fl, { arch:'top', ww:5, wh:8, sill:false });
  roofHip(g, o, 0, 0, h, ow, d, rh, C.roof, { ridge:gold || undefined, ov:2.5 });
  for(let k = 0; k < 6; k++){ const dx = ow * (0.1 + k * 0.16) - 5; block(g, o, dx, 6, h + 2, 10, 6, 7, m, { tex:false }); winF(g, o, dx + 3, 6, h + 3, 4, 5, { arch:true, sill:false, frame:'#5b4632' }); roofGableY(g, o, dx, 6, h + 9, 10, 6, 6, C.roof, { wall:m.c, ov:1.2 }); }
  /* its end pavilions, a floor higher */
  const pw = 40, pd = 30, ph = h + fl + 4;
  [o.X - 12, o.X + ow - pw + 12].forEach(px=>{
    const q = { X:px, B:o.B + 6 };
    castShadow(g, q, 0, 0, pw, pd, ph, 0.16);
    block(g, q, 0, 0, 0, pw, pd, ph, m, { quoins:true, trim:gold, plinth:tint(m.c, 0.82) });
    winRow(g, q, 0, 0, 0, pw, 3, floors + 1, fl, { arch:'top', ww:5.5, wh:9, sill:false, gold:null });
    if(n === 0){ const [sx, sy] = roofHip(g, q, 0, 0, ph, pw, pd, 26, C.roof, { ridge:gold || undefined }); g.fillStyle = GOLD[1]; g.fillRect(sx - 0.7, sy - 8, 1.4, 8); ell(g, sx, sy - 8, 1.8, 1.8, GOLD[0]); }
    else if(n === 1){ merlons(g, q, 0, 0, ph, pw, pd, m, { step:7, h:3, gold }); const top = domeOn(g, q, pw / 2, pd * 0.5, ph + 1, 13, 9, C.dome, { band:GOLD[1], tip:GOLD[1] }); flag(g, q.X + pw / 2, top - 1, '#c8463c', 10); }
    else { const [sx, sy] = roofHip(g, q, 0, 0, ph, pw, pd, 52, C.roof, { ridge:gold || undefined, ov:2 }); g.fillStyle = GOLD[1]; g.fillRect(sx - 0.7, sy - 10, 1.4, 10); flag(g, sx, sy - 10, '#c8463c', 11); }
  });
  /* the towers rising behind the great hall (9, 10) */
  if(L >= 9) [cx - 70, cx + 70].forEach(tx=> roundTower(g, tx, o.B + 10, 11 + n, h + 62 + 2 * (n - 1), 'cone', tOpt));   // (below the great tower's spire at 10)
}
/* (4.80) at 10, the great tower over the pavilion, in place of its dome (the designer: "maybe palace 10 can be taller
   too ... a castle which is taller and more grandiose"): a square tower set back on the pavilion's roof, turrets at its
   corners, a balcony; a round tower over it; its spire, the tallest thing in the kingdom */
function palaceGreatTower(g, op, pw, pd, ph, C){
  const m = C.m, gold = C.gold, tw = 38, td = 30, th = 46, ty = pd * 0.32, tx = pw / 2 - tw / 2;
  block(g, op, tx, ty, ph, tw, td, th, m, { quoins:true, trim:gold });
  winRow(g, op, tx, ty, ph + 4, tw, 2, 2, 20, { arch:true, ww:6, wh:12, sill:false, gold:GOLD[1] });
  { const [sx, sy] = pt(op, pw / 2, ty, ph + th - 6); ell(g, sx, sy, 5.4, 5.4, GOLD[1]); ell(g, sx, sy, 4, 4, '#fbf8f1'); }
  rail(g, op, tx - 2, ty - 0.5, ph + th, tw + 4, 4.5, '#fbf8f1', gold);
  /* its corner turrets, corbelled out at the top */
  [[tx - 1, 1], [tx + tw + 1, -1]].forEach(([x])=>{ const [sx, sy] = pt(op, x, ty + 2, ph + th - 22); roundTower(g, sx, sy, 5, 30, 'cone', { roof:C.roof[1], roofL:C.roof[0], roofD:C.roof[2], tip:GOLD[1], white:true, cone:3.4, flag:'#c8463c' }); });
  /* the round tower over it, its windows, the spire */
  const [cx, cy] = pt(op, pw / 2, ty + td / 2, ph + th);
  roundTower(g, cx, cy, 13, 50, 'cone', { roof:C.roof[1], roofL:C.roof[0], roofD:C.roof[2], tip:GOLD[1], white:true, band:GOLD[1], slits:0, cone:4.8, flag:'#c8463c' });
  [-6, 0, 6].forEach(dx=> winF(g, { X:cx + dx - 2, B:cy - 18 }, 0, 0, 0, 4, 11, { arch:true, sill:false, frame:'#4e3b2a' }));
}
/* the palace on its terrace, filling its ground: the great hall and its pavilion in the middle, the wings either side,
   round towers at their ends, the keep behind (6 to 8), the cypresses of its garden; a portico (7); an attic floor,
   domed towers, slender towers by the pavilion, the terrace's balustrade (8); the great dome over the pavilion and
   statues (9); gold, marble, the crown on the dome (10) */
function palaceGrand(g, X, Y, w, h, L){
  const W = w * 100, cx = X + W / 2, C = PALC(L), m = C.m, gold = C.gold, lv = Math.min(L - 6, 4);
  palaceWalls(g, X, Y, W, L, 'back');
  /* the cypresses along the back wall, behind everything (6, 7); from 8 the grand buildings of its back court instead */
  if(L >= 8) palaceRear(g, X, Y, W, L, C);
  else for(let k = 0; k < 15; k++){ const tx = X + 34 + k * 24.5; cypress(g, tx, Y + PG.back + 16 + (k % 2) * 3, 34 + (k % 3) * 5); }
  /* the terrace: its face; the buildings stand on its top, their fronts on the line yb */
  const yT = Y + PG.terr, tH = 10 + 2 * lv, tx0 = X + 24, tx1 = X + W - 24;
  g.fillStyle = 'rgba(22,30,14,.2)'; g.fillRect(tx0 + 4, yT, tx1 - tx0, 6);
  g.fillStyle = lin(g, 0, yT - tH, 0, yT, [[0, tint(m.c, 1.02)], [1, tint(m.c, 0.84)]]); g.fillRect(tx0, yT - tH, tx1 - tx0, tH);
  g.strokeStyle = m.line; g.lineWidth = 0.6; g.beginPath(); for(let zz = 5; zz < tH; zz += 5){ g.moveTo(tx0, yT - zz); g.lineTo(tx1, yT - zz); } g.stroke();
  if(gold){ g.fillStyle = gold; g.fillRect(tx0, yT - tH, tx1 - tx0, 1.4); }
  const yb = yT - tH - 6, fl = 14 + (L >= 9 ? 1 : 0), attic = L >= 8 ? 7 : 0, hh = 3 * fl + 6 + attic;
  const mw = 124 + 8 * lv, md = 64, ww = 78 + 4 * lv, wd = 52, wf = L >= 8 ? 3 : 2, wh = wf * fl + 6;
  const pw = 46 + 4 * lv, pd = md + 18, ph = hh + 10;
  const om = { X:cx - mw / 2 - md * DX / 2, B:yb - 6 }, op = { X:cx - pw / 2 - pd * DX / 2, B:yb + 3 };
  const oL = { X:om.X - ww - 6, B:yb - 16 }, oR = { X:om.X + mw + md * DX * 0 + 6 + 4, B:yb - 16 };
  const tOpt = { roof:C.roof[1], roofL:C.roof[0], roofD:C.roof[2], tip:GOLD[1], flag:'#c8463c', slits:3, band:L >= 7 ? GOLD[1] : null, white:L >= 8, domeC:C.dome, cone:L >= 10 ? 2.8 : 1.7 };
  /* shadows */
  castShadow(g, oL, 0, 0, ww, wd, wh, 0.2); castShadow(g, oR, 0, 0, ww, wd, wh, 0.2); castShadow(g, om, 0, 0, mw, md, hh, 0.22);
  /* the keep behind the hall (6 to 8): a square tower, its spire */
  if(L < 9){ const ok = { X:cx - 16 - 26 * DX / 2, B:om.B - md * DY * 0.75 }, kh = hh + 46 + 6 * lv;
    block(g, ok, 0, 0, 0, 32, 26, kh, m, { quoins:true, trim:gold });
    winRow(g, ok, 0, 0, hh + 6, 32, 2, 2, 16, { arch:true, ww:5, wh:9, sill:false }); winRowS(g, ok, 32, 0, hh + 6, 26, 1, 2, 16, { ww:5, wh:9 });
    const [sx, sy] = roofHip(g, ok, 0, 0, kh, 32, 26, 40 + 4 * lv, C.roof, { ridge:gold || undefined });
    g.fillStyle = GOLD[1]; g.fillRect(sx - 0.8, sy - 12, 1.6, 12); flag(g, sx, sy - 12, '#c8463c', 13); }
  /* the wings, their roofs, a balcony each (8), banners (9) */
  [oL, oR].forEach(o=>{
    block(g, o, 0, 0, 0, ww, wd, wh, m, { quoins:true, trim:gold, plinth:tint(m.c, 0.8) });
    winRow(g, o, 0, 0, 0, ww, 5, wf, fl, { arch:'top', ww:5.5, wh:9, flowers:L >= 8, gold:null });
    winRowS(g, o, ww, 0, 0, wd, 3, wf, fl, { ww:4.5, wh:8 });
    if(L >= 9) [0.3, 0.7].forEach(u=>{ const [sx, sy] = pt(o, ww * u - 3, 0, wh - 3); banner(g, sx, sy, 6, 15, '#3c6fc4', GOLD[1]); });
    roofHip(g, o, 0, 0, wh, ww, wd, 26 + 2 * lv, C.roof, { ridge:gold || undefined });
    if(L >= 8){ const [bx, by] = pt(o, ww / 2 - 12, -1.5, fl + 2); g.fillStyle = tint(m.c, 1.05); g.fillRect(bx - 1, by - 1, 26, 3); rail(g, o, ww / 2 - 12, -1.5, fl + 2, 24, 5, '#fbf8f1', gold); }
  });
  /* the great hall: three floors (an attic over them from 8), its roof, its dormers and chimneys */
  block(g, om, 0, 0, 0, mw, md, hh, m, { quoins:true, trim:gold, plinth:tint(m.c, 0.8) });
  winRow(g, om, 0, 0, 0, mw, 9, 3, fl, { arch:'top', ww:6, wh:10, flowers:L >= 8, gold:null });
  if(attic) winRow(g, om, 0, 0, 3 * fl + 3, mw, 9, 1, attic, { ww:5, wh:4, sill:false, frame:'#5b4632' });
  winRowS(g, om, mw, 0, 0, md, 4, 3, fl, { ww:5, wh:9 });
  roofHip(g, om, 0, 0, hh, mw, md, 30 + 3 * lv, C.roof, { ridge:gold || tint(C.roof[0], 1.1), ridgeW:gold ? 2 : 1.6 });
  [0.14, 0.86].forEach(u=>{ const dx = mw * u - 6; block(g, om, dx, 8, hh + 2, 12, 8, 9, m, { tex:false }); winF(g, om, dx + 3.5, 8, hh + 3.5, 5, 6, { arch:true, sill:false }); roofGableY(g, om, dx, 8, hh + 11, 12, 8, 7, C.roof, { wall:m.c, ov:1.4 }); });
  [[0.08, 0.72], [0.92, 0.72]].forEach(([u, v])=>{ block(g, om, mw * u - 3, md * v, hh + 12, 6, 6, 14, m, { tex:false }); block(g, om, mw * u - 4, md * v - 1, hh + 26, 8, 8, 2, m, { tex:false }); });
  /* slender towers either side of the pavilion (8) */
  const st = L >= 8 ? [cx - pw / 2 - 12, cx + pw / 2 + 12] : [];
  /* the pavilion in the middle, standing forward and higher: its own roof (6 to 8), or flat under the great dome (9) */
  g.save(); g.beginPath(); g.rect(X, om.B, W, 300); g.clip(); castShadow(g, op, 0, 0, pw, pd, ph, 0.2); g.restore();   // (4.80) on the ground before the hall, not up its front
  block(g, op, 0, 0, 0, pw, pd, ph, m, { quoins:true, trim:gold, plinth:tint(m.c, 0.8) });
  winRow(g, op, 0, 0, 0, pw, 3, 3, fl, { arch:true, ww:6.5, wh:11, skip:L >= 7 ? 30 : 8, flowers:L >= 8, gold:null });
  winRowS(g, op, pw, 0, 0, pd, 4, 3, fl, { ww:5, wh:9 });
  if(L >= 10){
    merlons(g, op, 0, 0, ph, pw, pd, m, { step:7, h:3.5, gold });
    palaceGreatTower(g, op, pw, pd, ph, C);
  } else if(L >= 9){
    merlons(g, op, 0, 0, ph, pw, pd, m, { step:7, h:3.5, gold });
    const top = domeOn(g, op, pw / 2, pd * 0.5, ph + 2, 24 + 2 * lv, 16, C.dome, { band:GOLD[1], tip:GOLD[1] });
    { const [fx] = pt(op, pw / 2, pd * 0.5, 0); flag(g, fx, top - 1, '#c8463c', 13); }
  } else {
    const [sx, sy] = roofHip(g, op, 0, 0, ph, pw, pd, 28 + 3 * lv, C.roof, { ridge:gold || undefined });
    g.fillStyle = GOLD[1]; g.fillRect(sx - 0.8, sy - 10, 1.6, 10); ell(g, sx, sy - 10, 2, 2, GOLD[0]);
  }
  /* the clock, or the arms of the kingdom, over the door */
  { const [sx, sy] = pt(op, pw / 2, 0, ph - 8); if(L >= 8){ ell(g, sx, sy, 6, 6, GOLD[1]); ell(g, sx, sy, 4.6, 4.6, '#fbf8f1'); g.strokeStyle = '#3a2c20'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy - 3.4); g.moveTo(sx, sy); g.lineTo(sx + 2.4, sy + 1); g.stroke(); } else crown(g, sx, sy + 3, 1); }
  /* the door; the portico before it (7): columns, the pediment, a balcony over it (8) */
  doorF(g, op, pw / 2 - 9, 0, 0, 18, 27, '#6b3f24', { gold:gold, lamp:true });
  if(L >= 7){
    const qw = 40 + 4 * lv, qx = pw / 2 - qw / 2, qh = 2 * fl + 3, n = L >= 9 ? 6 : 4;
    block(g, op, qx, -14, qh, qw, 14, 3.5, m, { tex:false, trim:gold });
    for(let k = 0; k < n; k++){ const xx = qx + 3 + (qw - 6) * k / (n - 1); column(g, op, xx, -12, 0, 2.6, qh, tint(m.c, 1.05), gold || undefined); }
    pediment(g, op, qx, -14, qh + 3.5, qw, 12 + lv, m.c, gold);
    if(L >= 8) rail(g, op, qx + 2, -13.5, qh + 3.5, qw - 4, 0, '#fbf8f1');
  }
  [-1, 1].forEach(s=>{ const [sx, sy] = pt(op, pw / 2 + s * (pw / 2 - 7) - 3.5, 0, ph - 6); banner(g, sx, sy, 7, 20, '#c8463c', GOLD[1]); });
  st.forEach(tx=>{ const [sx, sy] = [tx, yb + 2]; roundShadow(g, sx, sy, 9, hh + 34, 0.16); roundTower(g, sx, sy, 8.5 + lv * 0.4, hh + 30 + 4 * lv + (L >= 10 ? 22 : 0), L >= 10 ? 'cone' : 'dome', Object.assign({}, tOpt, { slits:2, flag:'#c8463c', cone:3.2 })); });
  /* the round towers at the wings' outer ends (spires at 10, taller) */
  const tr = 13 + lv, th = wh + 46 + 5 * lv + (L >= 10 ? 16 : 0), tRoof = L >= 10 ? 'cone' : L >= 8 ? 'dome' : 'cone';
  tower(g, oL, -2, 10, 0, tr, th, tRoof, tOpt); tower(g, oR, ww + 2, 10, 0, tr, th, tRoof, tOpt);
  /* the terrace's steps, its balustrade (8), statues beside the steps (9), lamps */
  const sw = 40 + 6 * lv, sx0 = cx - sw / 2;
  for(let k = 0; k < 5; k++){ const yy = yT - k * (tH / 5), ws = sw - k * 2; g.fillStyle = k % 2 ? tint(m.c, 1.08) : tint(m.c, 0.97); g.fillRect(cx - ws / 2, yy - tH / 5, ws, tH / 5 + 0.6); g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(cx - ws / 2, yy - 0.8, ws, 0.8); }
  if(L >= 10){ g.fillStyle = '#d24242'; g.fillRect(cx - 8, yb + 2, 16, yT - yb - 2); g.fillStyle = GOLD[1]; g.fillRect(cx - 8, yb + 2, 1, yT - yb - 2); g.fillRect(cx + 7, yb + 2, 1, yT - yb - 2); }
  if(L >= 8) [[tx0 + 2, sx0 - 2], [sx0 + sw + 2, tx1 - 2]].forEach(([a, b])=>{ g.fillStyle = '#fbf8f1'; g.fillRect(a, yT - tH - 6, b - a, 1.6); for(let x = a; x < b; x += 3.4) g.fillRect(x, yT - tH - 5, 1.3, 5); if(gold){ g.fillStyle = gold; g.fillRect(a, yT - tH - 6.6, b - a, 0.8); } });
  if(L >= 9) [sx0 - 9, sx0 + sw + 9].forEach(px=> statue(g, px, yT + 2, 1.05, null));   // (4.80) white marble at 10 too, not gold
  [sx0 - 2, sx0 + sw + 2].forEach(px=> lamp(g, px, yT - tH - 6, 13, L >= 9));
  /* the forecourt: the fountain, clipped trees in tubs along the avenue (7), lamps (8), statues in the gardens (10) */
  const yc = Y + PG.cross, ax = 22 + 4 * lv;
  fountain(g, cx, yc, 1.4 + 0.12 * lv);
  if(L >= 9) ell(g, cx, yc - 15 - 2 * lv, 3, 3, GOLD[1]);
  if(L >= 7) [-1, 1].forEach(s=>{ [yT + 14, Y + 274].forEach(ty=> gardenTree(g, cx + s * (ax + 9), ty, 0.82, L >= 8 ? '#f2a33a' : null, true)); });
  if(L >= 8) [-1, 1].forEach(s=> lamp(g, cx + s * (ax + 4), yc + 2, 14, L >= 9));
  if(L >= 10) [-1, 1].forEach(s=> statue(g, cx + s * 152, Y + 232, 1.05, null));
  palaceWalls(g, X, Y, W, L, 'front');
}
/* where the palace's people stand: the steward by the door at the top of the steps, the heir at their foot, servants in
   the gardens */
function palaceSpots(L, w, h){
  if(w === 1) return { steward:[34, 97, 0], heir:[63, 98, 1], hs:32, serve:[[86, 99, 1], [14, 99, 0]].slice(0, L >= 4 ? 2 : L >= 2 ? 1 : 0) };
  const cx = w * 50, lv = Math.min(L - 6, 4), yT = PG.terr, tH = 10 + 2 * lv;
  return { steward:[cx - 26, yT - tH - 3, 0], heir:[cx + 50, PG.cross + 4, 1], hs:40,
    serve:[[cx - 108, PG.cross - 4, 0], [cx + 112, PG.cross - 2, 1], [cx - 70, yT + 30, 0], [cx + 74, yT + 32, 1]].slice(0, L >= 8 ? 4 : 2) };
}

/* ============================================================
   THE GRANARY
   ============================================================ */
/* the granary's barn: red boards, the gambrel's white trim, the great doors (their X), the loft's door with its hay */
function barn(g, o, w, d, h, L, op){
  op = op || {};
  const rh = 18 + w * 0.26, gold = L >= 10;
  castShadow(g, o, 0, 0, w, d, h + rh * 0.7, 0.24);
  block(g, o, 0, 0, 0, w, d, h, MAT.barn, { top:false, plinth:L >= 6 ? '#a9a294' : null });
  winRowS(g, o, w, 0, 2, d, Math.max(1, Math.round(d / 18)), 1, h - 2, { ww:4.5, wh:6, frame:'#f6efe2' });
  roofGambrel(g, o, 0, 0, h, w, d, rh, L >= 8 ? ROOF.slate : ROOF.red.map(c=> tint(c, 0.8)), { wall:MAT.barn.c, trim:'#f8f1e4' });
  /* the great doors, their white X */
  const dw = Math.min(w * 0.46, 26), dh = Math.min(h - 2, 22), dx = w / 2 - dw / 2, [sx, sb] = pt(o, dx, 0, 0);
  g.fillStyle = '#7a2a22'; g.fillRect(sx, sb - dh, dw, dh);
  g.strokeStyle = '#f8f1e4'; g.lineWidth = 1.7; g.strokeRect(sx, sb - dh, dw, dh); g.beginPath(); g.moveTo(sx + dw / 2, sb - dh); g.lineTo(sx + dw / 2, sb);
  g.moveTo(sx, sb - dh); g.lineTo(sx + dw / 2, sb); g.moveTo(sx + dw / 2, sb - dh); g.lineTo(sx, sb); g.moveTo(sx + dw / 2, sb - dh); g.lineTo(sx + dw, sb); g.moveTo(sx + dw, sb - dh); g.lineTo(sx + dw / 2, sb); g.stroke();
  /* the loft's door, hay showing; the pulley beam over it */
  const lw = Math.min(10, w * 0.2), [lx, lb] = pt(o, w / 2 - lw / 2, 0, h + rh * 0.28);
  g.fillStyle = '#3a1c14'; g.fillRect(lx, lb - lw, lw, lw); g.fillStyle = '#e8c868'; g.fillRect(lx + 0.8, lb - lw * 0.5, lw - 1.6, lw * 0.5 - 0.6);
  g.strokeStyle = '#f8f1e4'; g.lineWidth = 1.2; g.strokeRect(lx, lb - lw, lw, lw);
  g.fillStyle = '#5a3a22'; g.fillRect(lx + lw / 2 - 1, lb - lw - 5, 2, 5);
  /* windows either side (2) */
  if(w >= 48) [w * 0.14, w * 0.86 - 6].forEach(wx=> winF(g, o, wx, 0, h * 0.45, 6, 7, { frame:'#f8f1e4' }));
  /* the cupola on the ridge (6), its weathervane — gold (10) */
  if(L >= 6){ const cw = 10, cxl = w / 2 - cw / 2, zt = h + rh - 2; block(g, o, cxl, d / 2 - 4, zt, cw, 8, 8, MAT.white, { tex:false });
    winF(g, o, cxl + 2.5, d / 2 - 4, zt + 1.5, 5, 5, { frame:'#3a281b', sill:false }); roofHip(g, o, cxl, d / 2 - 4, zt + 8, cw, 8, 7, gold ? ROOF.gold : L >= 8 ? ROOF.copper : ROOF.red, { ov:1.5 }); }
  const [vx, vy] = pt(o, w / 2, d / 2, h + rh + (L >= 6 ? 13 : 0));
  g.fillStyle = gold ? GOLD[1] : '#3a2c20'; g.fillRect(vx - 0.6, vy - 10, 1.2, 10); g.beginPath(); g.moveTo(vx - 5, vy - 8); g.lineTo(vx + 6, vy - 8); g.lineTo(vx + 2.5, vy - 10.5); g.closePath(); g.fill();
  if(gold){ ell(g, vx, vy - 12, 2.2, 1.8, GOLD[1]); g.fillStyle = '#c8463c'; g.fillRect(vx + 1.4, vy - 13.4, 1.2, 1.4); }
  if(op.banner){ [w * 0.12, w * 0.88 - 5].forEach(bx=>{ const [bxs, bys] = pt(o, bx, 0, h - 3); banner(g, bxs, bys, 5, 12, '#e0a42a', GOLD[1]); }); }
}
/* a silo: wooden staves (3), white stone with a copper dome (8), gold (10) */
function silo(g, sx, sb, r, h, L){
  const stone = L >= 8, goldR = L >= 10;
  roundShadow(g, sx, sb, r * 1.1, h, 0.22);
  if(!stone){
    g.fillStyle = lin(g, sx - r, 0, sx + r, 0, [[0, '#d8a874'], [0.45, '#b98652'], [1, '#7a5230']]);
    g.beginPath(); g.moveTo(sx - r, sb - h); g.lineTo(sx - r, sb); g.ellipse(sx, sb, r, r * 0.35, 0, Math.PI, 0, true); g.lineTo(sx + r, sb - h); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,36,16,.4)'; g.lineWidth = 0.6; g.beginPath(); for(let k = -3; k <= 3; k++){ const xx = sx + k * r / 3.6; g.moveTo(xx, sb - h); g.lineTo(xx, sb + r * 0.3 * Math.sqrt(1 - (k / 3.6) ** 2)); } g.stroke();
    g.strokeStyle = '#4a4e58'; g.lineWidth = 1.1; [0.2, 0.5, 0.8].forEach(t=>{ g.beginPath(); g.ellipse(sx, sb - h * t, r, r * 0.35, 0, 0.05, Math.PI - 0.05); g.stroke(); });
    const top = sb - h - r * 1.5; g.fillStyle = lin(g, sx - r, 0, sx + r, 0, [[0, ROOF.red[0]], [0.5, ROOF.red[1]], [1, ROOF.red[2]]]);
    g.beginPath(); g.moveTo(sx - r - 2, sb - h + 1); g.lineTo(sx, top); g.lineTo(sx + r + 2, sb - h + 1); g.ellipse(sx, sb - h + 1, r + 2, (r + 2) * 0.35, 0, 0, Math.PI); g.closePath(); g.fill();
    ell(g, sx, top, 1.4, 1.4, '#c9b48a');
    return;
  }
  roundTower(g, sx, sb, r, h, 'dome', { white:true, band:goldR ? GOLD[1] : '#b8a27a', domeC:goldR ? GOLD : ROOF.copper, tip:goldR ? GOLD[0] : '#e0d0a0' });
  g.fillStyle = '#4a3a2a'; g.fillRect(sx - 2, sb - h * 0.5, 4, 7); g.fillStyle = '#f6c763'; g.fillRect(sx - 1.3, sb - h * 0.5 + 0.8, 2.6, 5.4);
}
/* a windmill: a post mill on its trestle (5), a tower mill of stone (6), with a gallery (9), its cap gilded (10) */
function mill(g, sx, sb, s, L){
  if(L < 6){
    shade(g, sx + 6, sb + 1, 12 * s, 3 * s, 0.26);
    g.strokeStyle = '#6b4426'; g.lineWidth = 1.6 * s; g.beginPath(); g.moveTo(sx - 9 * s, sb); g.lineTo(sx, sb - 14 * s); g.lineTo(sx + 9 * s, sb); g.stroke();
    const o = { X:sx - 8 * s, B:sb - 14 * s }; block(g, o, 0, 0, 0, 16 * s, 12 * s, 20 * s, MAT.wood, {}); roofGableY(g, o, 0, 0, 20 * s, 16 * s, 12 * s, 8 * s, ROOF.wood, { wall:MAT.wood.c, ov:1.5 });
    sails(g, sx, sb - 30 * s, 24 * s); return;
  }
  shade(g, sx + 8, sb + 1, 15 * s, 4 * s, 0.28);
  const r0 = 11 * s, r1 = 7.5 * s, h = (48 + (L >= 9 ? 6 : 0)) * s;
  g.fillStyle = lin(g, sx - r0, 0, sx + r0, 0, [[0, '#f8f4ea'], [0.5, '#dcd4c2'], [1, '#a59b88']]);
  g.beginPath(); g.moveTo(sx - r0, sb); g.lineTo(sx - r1, sb - h); g.lineTo(sx + r1, sb - h); g.lineTo(sx + r0, sb); g.ellipse(sx, sb, r0, r0 * 0.35, 0, 0, Math.PI); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(90,80,64,.3)'; g.lineWidth = 0.7; for(let k = 1; k < h / 7; k++){ const t = k * 7 / h, r = r0 + (r1 - r0) * t; g.beginPath(); g.ellipse(sx, sb - k * 7, r, r * 0.35, 0, 0.15, Math.PI - 0.15); g.stroke(); }
  g.fillStyle = '#5a3a22'; g.beginPath(); g.moveTo(sx - 3.5 * s, sb); g.lineTo(sx - 3.5 * s, sb - 8 * s); g.arc(sx, sb - 8 * s, 3.5 * s, Math.PI, 0); g.lineTo(sx + 3.5 * s, sb); g.fill();
  [0.42, 0.68].forEach(t=>{ g.fillStyle = '#4e3b2a'; g.fillRect(sx - 2 * s, sb - h * t - 3 * s, 4 * s, 6 * s); g.fillStyle = '#f6c763'; g.fillRect(sx - 1.3 * s, sb - h * t - 2.3 * s, 2.6 * s, 4.6 * s); });
  if(L >= 9){ const gy = sb - h * 0.55; g.fillStyle = '#6b4426'; g.beginPath(); g.ellipse(sx, gy, r0 + 3, (r0 + 3) * 0.35, 0, 0, TAU); g.fill(); g.fillStyle = '#8a5a32'; g.fillRect(sx - r0 - 3, gy - 4, 2 * r0 + 6, 1.2); g.strokeStyle = '#8a5a32'; g.lineWidth = 0.8; g.beginPath(); for(let k = 0; k <= 8; k++){ const xx = sx - r0 - 3 + (2 * r0 + 6) * k / 8; g.moveTo(xx, gy - 4); g.lineTo(xx, gy + 1); } g.stroke(); }
  const capC = L >= 10 ? GOLD : ['#a5543a', '#7a3a26', '#4a1c10'];
  g.fillStyle = lin(g, sx - r1 - 3, 0, sx + r1 + 3, 0, [[0, capC[0]], [0.5, capC[1]], [1, capC[2]]]);
  g.beginPath(); g.moveTo(sx - r1 - 3, sb - h + 1); g.quadraticCurveTo(sx - r1, sb - h - 13 * s, sx, sb - h - 14 * s); g.quadraticCurveTo(sx + r1, sb - h - 13 * s, sx + r1 + 3, sb - h + 1); g.closePath(); g.fill();
  sails(g, sx + 1, sb - h - 5 * s, 30 * s);
  if(L >= 10){ g.fillStyle = GOLD[1]; g.fillRect(sx - 0.6, sb - h - 22 * s, 1.2, 8 * s); ell(g, sx, sb - h - 22 * s, 1.8, 1.8, GOLD[0]); }
}
/* a staddle-stone granary (7): a little timbered store raised on its mushroom stones, out of the rats' reach */
function store(g, o, L){
  const w = 30, d = 22, h = 16, z = 7;
  castShadow(g, o, 0, 0, w, d, h + z + 10, 0.22);
  [[2, 2], [w - 4, 2], [2, d - 4], [w - 4, d - 4], [w / 2 - 1, 2]].sort((a, b)=> b[1] - a[1]).forEach(([x, y])=>{ const [sx, sb] = pt(o, x, y, 0); g.fillStyle = '#a9a294'; g.fillRect(sx - 1.4, sb - z + 2, 2.8, z - 2); ell(g, sx, sb - z + 2, 3.4, 1.4, '#c9c2b4'); });
  block(g, o, 0, 0, z, w, d, h, L >= 9 ? MAT.plaster : MAT.wood, {});
  doorF(g, o, w / 2 - 4, 0, z, 8, 12, '#6b4426');
  roofGable(g, o, 0, 0, z + h, w, d, 11, L >= 10 ? ROOF.gold : ROOF.thatch, { thatch:L < 10, wall:MAT.wood.c });
  const [sx, sb] = pt(o, w / 2 - 4, -5, 0); g.fillStyle = '#8a5a32'; for(let k = 0; k < 3; k++) g.fillRect(sx + k * 0.6, sb - (k + 1) * 2.4, 8 - k * 1.2, 1.4);
}
function beehive(g, sx, sb){ shade(g, sx + 2, sb + 0.5, 5, 1.6, 0.25); g.fillStyle = '#a07a4a'; g.fillRect(sx - 4, sb - 2, 8, 2); g.fillStyle = lin(g, sx - 4, 0, sx + 4, 0, [[0, '#f2d27a'], [1, '#c09a44']]); g.beginPath(); g.moveTo(sx - 4, sb - 2); g.quadraticCurveTo(sx - 4.4, sb - 11, sx, sb - 11.5); g.quadraticCurveTo(sx + 4.4, sb - 11, sx + 4, sb - 2); g.closePath(); g.fill(); g.strokeStyle = 'rgba(140,100,40,.6)'; g.lineWidth = 0.6; g.beginPath(); [4.5, 7.5].forEach(dy=>{ g.moveTo(sx - 4, sb - dy); g.lineTo(sx + 4, sb - dy); }); g.stroke(); ell(g, sx, sb - 3.6, 1.2, 1, '#3a2418'); }
function scarecrow(g, sx, sb){ shade(g, sx + 2, sb + 0.5, 5, 1.6, 0.25); g.fillStyle = '#6b4426'; g.fillRect(sx - 0.8, sb - 20, 1.6, 20); g.fillRect(sx - 8, sb - 15, 16, 1.4); g.fillStyle = '#c9493a'; g.fillRect(sx - 4, sb - 15, 8, 7); g.fillStyle = '#3c6fc4'; g.fillRect(sx - 3.4, sb - 8.4, 6.8, 4); ell(g, sx, sb - 18, 3, 2.8, '#ecd27a'); g.fillStyle = '#a5741c'; g.fillRect(sx - 4.4, sb - 20.6, 8.8, 1.6); g.fillRect(sx - 2.6, sb - 23.4, 5.2, 3); }
function pumpkin(g, sx, sb, s){ s = s || 1; ell(g, sx, sb - 2.6 * s, 4 * s, 3 * s, '#e07a26'); ell(g, sx - 1 * s, sb - 3.2 * s, 1.4 * s, 2 * s, '#f29a46'); g.fillStyle = '#4f7a2a'; g.fillRect(sx - 0.4 * s, sb - 6.6 * s, 0.9 * s, 1.8 * s); }
/* a fence of rails round a lot (1 to 5), a low wall from 6, white with gold finials (9): drawn along its back and sides
   first (`part` 'back'), its front last ('front') */
function lotFence(g, X, Y, L, part, gap){
  const x0 = X + 8, x1 = X + 192, y0 = Y + 14, y1 = Y + 192, wallK = L >= 6, white = L >= 9;
  const post = (sx, sb)=>{ if(wallK){ g.fillStyle = white ? '#fbf8f1' : '#d8d2c5'; g.fillRect(sx - 2.2, sb - 9, 4.4, 9); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(sx + 1, sb - 9, 1.2, 9); if(white){ ell(g, sx, sb - 10, 1.8, 1.8, GOLD[1]); } else { g.fillStyle = '#eeeae0'; g.fillRect(sx - 2.6, sb - 10, 5.2, 1.4); } }
    else { g.fillStyle = '#8a5a2b'; g.fillRect(sx - 1.1, sb - 8, 2.2, 8); g.fillStyle = '#d8a060'; g.fillRect(sx - 1.1, sb - 8, 2.2, 1.3); } };
  const runH = (a, b, y)=>{
    if(wallK){ g.fillStyle = lin(g, 0, y - 6, 0, y, [[0, white ? '#fbf8f1' : '#dcd6ca'], [1, white ? '#ddd6c8' : '#b5aea2']]); g.fillRect(a, y - 6, b - a, 6); g.fillStyle = white ? '#ffffff' : '#ece8de'; g.fillRect(a, y - 7.2, b - a, 1.4); g.strokeStyle = 'rgba(80,72,60,.22)'; g.lineWidth = 0.5; g.beginPath(); for(let x = a + 6; x < b; x += 6){ g.moveTo(x, y - 6); g.lineTo(x, y); } g.stroke(); }
    else { g.strokeStyle = '#a07a4a'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(a, y - 6); g.lineTo(b, y - 6); g.moveTo(a, y - 2.6); g.lineTo(b, y - 2.6); g.stroke(); }
    for(let x = a; x <= b + 0.5; x += 18) post(x, y);
  };
  const runV = (x, a, b)=>{
    if(wallK){ g.fillStyle = white ? '#f6f2ea' : '#d6d0c3'; g.fillRect(x - 2, a - 7, 4, b - a); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x + 1.2, a - 7, 0.9, b - a); }
    else { g.strokeStyle = '#a07a4a'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, a - 6); g.lineTo(x, b - 6); g.moveTo(x + 0.6, a - 2.6); g.lineTo(x + 0.6, b - 2.6); g.stroke(); }
    for(let y = a; y <= b + 0.5; y += 18) post(x, y);
  };
  if(part === 'back'){ runH(x0, x1, y0); runV(x0, y0, y1); runV(x1, y0, y1); return; }
  const gx = X + 100, gw = gap || 16;
  runH(x0, gx - gw, y1); runH(gx + gw, x1, y1);
  if(wallK){ [gx - gw, gx + gw].forEach(px=>{ g.fillStyle = white ? '#fbf8f1' : '#d8d2c5'; g.fillRect(px - 3, y1 - 13, 6, 13); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(px + 1.6, y1 - 13, 1.4, 13); if(white) ell(g, px, y1 - 15, 2.4, 2.4, GOLD[1]); else ell(g, px, y1 - 14, 2.4, 1.4, '#ece8de'); }); }
}
/* the granary on its own plot (before palace 6): the barn, its hay, a silo (3), a fenced garden and a scarecrow (4),
   a windmill (5) */
function granaryPlot(g, x0, y0, L){
  if(!L) return ruin(g, x0, y0, 'granary', rng(x0 * 7 + y0));
  if(L >= 5) mill(g, x0 + 18, y0 + 60, 0.7, 5);
  if(L >= 3) silo(g, x0 + 84, y0 + 64, 7.5, 26 + 3 * L, 3);
  barn(g, { X:x0 + 30, B:y0 + 88 }, 36 + 2 * L, 26, 16 + L, L);
  [[x0 + 14, y0 + 96], [x0 + 24, y0 + 98], [x0 + 19, y0 + 90]].slice(0, L >= 2 ? 3 : 2).forEach(([hx, hy])=> hay(g, hx, hy, 0.62));
  if(L >= 2) sacks(g, x0 + 78, y0 + 96);
  if(L >= 4) scarecrow(g, x0 + 90, y0 + 94);
}
/* its lot (from palace 6): the yard of straw, the kitchen garden (its rows, its pumpkins), the fence; on it the barn,
   the silos, the windmill, the hay; the staddle-stone store and the apple trees (7), stone silos, beehives and the duck
   pond (8), the great windmill and the harvest hall's banners (9), gold (10) */
function granaryGround(g, X, Y, w, h, L, i){
  const R = rng(i * 11 + 3);
  /* the garden: tilled rows at the front right */
  const gx0 = X + 112, gx1 = X + 188, gy0 = Y + 128 + (L >= 6 ? 0 : 6), gy1 = Y + 186;
  g.fillStyle = lin(g, 0, gy0, 0, gy1, [[0, '#8a5e34'], [1, '#6e4a28']]); rr(g, gx0, gy0, gx1 - gx0, gy1 - gy0, 4); g.fill();
  g.strokeStyle = 'rgba(70,46,22,.7)'; g.lineWidth = 1; g.beginPath(); for(let yy = gy0 + 6; yy < gy1 - 2; yy += 7){ g.moveTo(gx0 + 3, yy); g.lineTo(gx1 - 3, yy); } g.stroke();
  for(let yy = gy0 + 5; yy < gy1 - 4; yy += 7) for(let xx = gx0 + 6; xx < gx1 - 4; xx += 8){ const k = Math.round((yy + xx) / 7) % 3; ell(g, xx, yy, 3, 2.4, k ? '#4f9a3a' : '#3f8a30'); ell(g, xx - 0.8, yy - 0.8, 1.6, 1.2, '#8bd06a'); }
  g.strokeStyle = 'rgba(70,110,45,.8)'; g.lineWidth = 1.6; rr(g, gx0, gy0, gx1 - gx0, gy1 - gy0, 4); g.stroke();
  /* a strip of wheat along the west (4), gold when ripe */
  if(L >= 4){ const wx0 = X + 14, wx1 = X + 42, wy0 = Y + 104, wy1 = Y + 186; g.fillStyle = '#c9a84a'; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.strokeStyle = '#e8c868'; g.lineWidth = 1; g.beginPath(); for(let k = 0; k < 120; k++){ const xx = wx0 + R() * (wx1 - wx0), yy = wy0 + 4 + R() * (wy1 - wy0 - 4); g.moveTo(xx, yy); g.lineTo(xx + (R() - 0.5) * 2, yy - 5); } g.stroke(); }
  /* the duck pond (8) */
  if(L >= 8){ const px = X + 70, py = Y + 172; ell(g, px, py, 24, 11, '#6a8a4a'); ell(g, px, py, 21, 9, lin(g, 0, py - 9, 0, py + 9, [[0, '#7cc3ee'], [1, '#3d8dcf']])); ell(g, px - 6, py - 3, 7, 1.6, 'rgba(255,255,255,.4)');
    [[px - 8, py + 1], [px + 7, py - 2]].forEach(([dx, dy])=>{ ell(g, dx, dy, 2.6, 1.6, '#ffffff'); ell(g, dx + 2, dy - 1.4, 1.2, 1.2, '#ffffff'); g.fillStyle = '#f2a33a'; g.fillRect(dx + 3, dy - 1.6, 1.4, 0.7); }); }
}
/* a hay rick: the stack of the harvest, thatched round its pole */
function rick(g, sx, sb, s){
  shade(g, sx + 10 * s, sb + 1, 14 * s, 4 * s, 0.26);
  g.fillStyle = lin(g, sx - 11 * s, 0, sx + 11 * s, 0, [[0, '#f6de92'], [0.5, '#e0bc5a'], [1, '#a8822e']]);
  g.beginPath(); g.moveTo(sx - 11 * s, sb); g.lineTo(sx - 12 * s, sb - 12 * s); g.quadraticCurveTo(sx - 11 * s, sb - 30 * s, sx, sb - 32 * s); g.quadraticCurveTo(sx + 11 * s, sb - 30 * s, sx + 12 * s, sb - 12 * s); g.lineTo(sx + 11 * s, sb); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(150,110,40,.55)'; g.lineWidth = 0.7; g.beginPath(); for(let k = -4; k <= 4; k++){ g.moveTo(sx + k * 2.6 * s, sb - 1); g.quadraticCurveTo(sx + k * 2.4 * s, sb - 18 * s, sx + k * 0.6 * s, sb - 30 * s); } g.stroke();
  g.strokeStyle = 'rgba(120,84,30,.6)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(sx - 11.6 * s, sb - 12 * s); g.quadraticCurveTo(sx, sb - 9 * s, sx + 11.6 * s, sb - 12 * s); g.stroke();
  g.fillStyle = '#6b4426'; g.fillRect(sx - 0.7 * s, sb - 37 * s, 1.4 * s, 6 * s);
}
/* hens about the yard */
function hens(g, x, y, n){ [[0, 0], [12, 5], [-9, 8], [20, -3], [5, 12]].slice(0, n).forEach(([dx, dy])=>{ const cx = x + dx, cy = y + dy; shade(g, cx + 1, cy + 1.6, 2.6, 0.9, 0.25); ell(g, cx, cy, 2.6, 1.8, '#ffffff'); ell(g, cx + 1.8, cy - 1.7, 1.2, 1.2, '#ffffff'); g.fillStyle = '#e0443c'; g.fillRect(cx + 1.4, cy - 3.2, 1, 1); g.fillStyle = '#f2a33a'; g.fillRect(cx + 2.6, cy - 1.9, 1.1, 0.6); }); }
/* the hen house: on legs, its ramp, its hens about it */
function coop(g, o, L){
  castShadow(g, o, 0, 0, 22, 16, 18, 0.22);
  [[1, 1], [19, 1], [1, 13], [19, 13]].sort((a, b)=> b[1] - a[1]).forEach(([x, y])=>{ const [sx, sb] = pt(o, x, y, 0); g.fillStyle = '#6b4426'; g.fillRect(sx - 0.8, sb - 5, 1.6, 5); });
  block(g, o, 0, 0, 5, 22, 16, 10, L >= 6 ? MAT.plaster : MAT.wood, {});
  roofGable(g, o, 0, 0, 15, 22, 16, 8, ROOF.red, { wall:MAT.wood.c, ov:2 });
  const [hx, hb] = pt(o, 8, 0, 5); g.fillStyle = '#2a1a10'; g.fillRect(hx, hb - 5, 5, 5);
  g.strokeStyle = '#8a5a32'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx + 2.5, hb); g.lineTo(hx + 1, hb + 8); g.stroke();
  [[-6, 12], [6, 14], [14, 10], [-12, 7]].forEach(([dx, dy])=>{ const cx = hx + dx, cy = hb + dy; ell(g, cx, cy, 2.4, 1.7, '#ffffff'); ell(g, cx + 1.6, cy - 1.6, 1.1, 1.1, '#ffffff'); g.fillStyle = '#e0443c'; g.fillRect(cx + 1.2, cy - 3, 0.9, 0.9); g.fillStyle = '#f2a33a'; g.fillRect(cx + 2.4, cy - 1.8, 1, 0.6); });
}
function granaryLot(g, X, Y, w, h, L, R){
  if(!L) return ruinLot(g, X, Y, 'granary', R);
  lotFence(g, X, Y, L, 'back');
  const gold = L >= 10;
  /* the back row: hay ricks (a windmill from 5), the hen house, the silos at the right (3) */
  if(L >= 5) mill(g, X + 34, Y + 94, L >= 6 ? 1.05 + (L >= 9 ? 0.12 : 0) : 1, L);
  else { rick(g, X + 28, Y + 82, 1); rick(g, X + 52, Y + 76, 0.85); }
  if(L >= 3){ const n = L >= 4 ? 2 : 1, r = L >= 6 ? 12 + (L >= 9 ? 1 : 0) : 9, sh = L >= 6 ? 62 + 4 * (L - 6) : 38 + 2 * L;
    for(let k = n - 1; k >= 0; k--) silo(g, X + 150 + k * 22, Y + 92 + k * 8, r - k * 1.5, sh - k * 8, L); }
  /* the apple trees (7) */
  if(L >= 7) [[X + 70, Y + 60], [X + 96, Y + 56], [X + 122, Y + 60]].forEach(([tx, ty])=> gardenTree(g, tx, ty, 0.95, '#d32f2c'));
  /* the barn */
  const bw = Math.min(100, 62 + 5 * L), bd = 40 + 2 * Math.min(L, 6), bh = 20 + 2 * Math.min(L, 8);
  barn(g, { X:X + 100 - bw / 2 - bd * DX / 2, B:Y + 128 }, bw, bd, bh, L, { banner:L >= 9 });
  /* the store on its staddle stones (7) */
  if(L >= 7) store(g, { X:X + 56, B:Y + 156 }, L);
  /* the hay, the sacks, the carts */
  [[X + 22, Y + 144, 1.1], [X + 38, Y + 152, 0.9], [X + 18, Y + 160, 0.9]].slice(0, L >= 2 ? 3 : 2).forEach(([hx, hy, s])=> hay(g, hx, hy, s));
  sacks(g, X + 100, Y + 160);
  hens(g, X + 70, Y + 150, L >= 6 ? 4 : 3);
  if(L >= 4) cart(g, X + 76, Y + 184, 'hay');
  if(L >= 3) scarecrow(g, X + 152, Y + 170);
  [[X + 124, Y + 188], [X + 138, Y + 190], [X + 176, Y + 188]].slice(0, L >= 5 ? 3 : 1).forEach(([px, py])=> pumpkin(g, px, py, 1.1));
  if(L >= 8) [[X + 184, Y + 122], [X + 184, Y + 136]].forEach(([bx, by])=> beehive(g, bx, by));
  if(gold){ /* the harvest's display: baskets of fruit and gold sheaves by the doors */
    [[X + 64, Y + 134], [X + 136, Y + 134]].forEach(([bx, by])=>{ shade(g, bx + 2, by + 0.5, 6, 1.8, 0.25); g.fillStyle = '#a5741c'; g.fillRect(bx - 5, by - 5, 10, 5); [['#d32f2c', -2.5, -6], ['#f2a33a', 1, -6.4], ['#7fbf4a', 3.4, -5.6], ['#e8d04a', -0.6, -8]].forEach(([c, dx, dy])=> ell(g, bx + dx, by + dy, 2, 2, c)); });
    [X + 90, X + 110].forEach(sx=>{ const sb = Y + 132; g.strokeStyle = GOLD[1]; g.lineWidth = 1; g.beginPath(); for(let k = -3; k <= 3; k++){ g.moveTo(sx + k * 0.7, sb); g.lineTo(sx + k * 1.8, sb - 12); } g.stroke(); g.fillStyle = GOLD[2]; g.fillRect(sx - 2.4, sb - 6, 4.8, 1.2); });
  }
  lotFence(g, X, Y, L, 'front', 18);
}
/* a ruined building on its lot: its broken walls bigger, rubble across the lot */
function ruinLot(g, X, Y, kind, R){
  g.save(); g.translate(X + 100, Y + 190); g.scale(1.7, 1.7); g.translate(-(X + 50), -(Y + 88 + 2)); ruin(g, X, Y, kind, R); g.restore();
}

/* ============================================================
   THE BARRACKS
   ============================================================ */
/* a palisade of stakes (1 to 5) or a crenellated wall (6), for the barracks' lot: its back and sides, or its front */
function fortFence(g, X, Y, L, part){
  if(L >= 6) return lotFence(g, X, Y, L, part, 18);
  const x0 = X + 8, x1 = X + 192, y0 = Y + 14, y1 = Y + 192, H = 11;
  const stakes = (a, b, y)=>{ for(let x = a; x <= b; x += 5.5){ g.fillStyle = lin(g, x - 2.6, 0, x + 2.6, 0, [[0, '#b98652'], [1, '#6b4422']]); g.fillRect(x - 2.6, y - H, 5.2, H); g.fillStyle = '#d6a46a'; g.beginPath(); g.moveTo(x - 2.6, y - H); g.lineTo(x, y - H - 3.4); g.lineTo(x + 2.6, y - H); g.fill(); }
    g.fillStyle = '#5b3a1c'; g.fillRect(a - 2.6, y - H * 0.62, b - a + 5.2, 1.6); };
  const side = (x, a, b)=>{ for(let y = a; y <= b; y += 5.5){ g.fillStyle = lin(g, x - 2.6, 0, x + 2.6, 0, [[0, '#b98652'], [1, '#6b4422']]); g.fillRect(x - 2.6, y - H + 2, 5.2, H - 2); g.fillStyle = '#d6a46a'; g.beginPath(); g.moveTo(x - 2.6, y - H + 2); g.lineTo(x, y - H - 1.4); g.lineTo(x + 2.6, y - H + 2); g.fill(); } };
  if(part === 'back'){ stakes(x0, x1, y0); side(x0, y0 + 5, y1); side(x1, y0 + 5, y1); return; }
  stakes(x0, X + 82, y1); stakes(X + 118, x1, y1);
  [X + 84, X + 116].forEach(px=>{ g.fillStyle = '#6b4422'; g.fillRect(px - 3, y1 - H - 8, 6, H + 8); g.fillStyle = '#d6a46a'; g.fillRect(px - 3.6, y1 - H - 9.4, 7.2, 1.6); });
}
/* the hall of the barracks: grey stone, its gate, a red roof; a square watch tower */
function barrHall(g, o, w, d, h, L, fl){
  const m = L >= 9 ? MAT.white : MAT.stone, gold = L >= 10 ? GOLD[1] : null;
  castShadow(g, o, 0, 0, w, d, h + 12, 0.24);
  block(g, o, 0, 0, 0, w, d, h, m, { quoins:true, trim:gold, plinth:'#9e988c' });
  const floors = Math.max(1, Math.round((h - 4) / fl));
  winRow(g, o, 0, 0, 0, w, Math.max(3, Math.round(w / 20)), floors, fl, { ww:5, wh:8, skip:14, shutters:L >= 3 ? '#8a2e24' : null, frame:'#3e3428' });
  winRowS(g, o, w, 0, 0, d, Math.max(1, Math.round(d / 16)), floors, fl, { ww:4.5, wh:7 });
  /* the gate: a deep arch, its iron studs */
  const gw = 14 + Math.min(L, 6), gh = Math.min(h - 3, 16 + Math.min(L, 6));
  doorF(g, o, w / 2 - gw / 2, 0, 0, gw, gh, '#5a3a22', { gold:gold, frame:'#2e2620', knob:'#9aa0aa' });
  if(L >= 3) [w / 2 - gw / 2 - 9, w / 2 + gw / 2 + 3].forEach(bx=>{ const [sx, sy] = pt(o, bx, 0, h - 3); banner(g, sx, sy, 6, 14, '#c8463c', gold || '#e0b84a'); });
  roofGable(g, o, 0, 0, h, w, d, 14 + d * 0.22, L >= 10 ? ROOF.gold : ROOF.red, { wall:m.c, ridge:gold || undefined });
  /* the crest over the gate (5), gilded (10) */
  if(L >= 5){ const k = h < 36 ? 0.62 : 1, [sx, sy] = pt(o, w / 2, 0, gh + 4 + 7 * k); g.save(); g.translate(sx, sy); g.scale(k, k);
    g.fillStyle = gold || '#c8463c'; g.beginPath(); g.moveTo(-7, -6); g.lineTo(7, -6); g.lineTo(7, 1); g.quadraticCurveTo(0, 8, -7, 1); g.closePath(); g.fill();
    g.strokeStyle = '#f6eee0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-4, -3); g.lineTo(4, 4); g.moveTo(4, -3); g.lineTo(-4, 4); g.stroke(); g.restore(); }
}
function watchTower(g, o, w, h, L){
  const m = L >= 9 ? MAT.white : MAT.stone, gold = L >= 10 ? GOLD[1] : null;
  castShadow(g, o, 0, 0, w, w, h, 0.22);
  block(g, o, 0, 0, 0, w, w, h, m, { quoins:true, trim:gold });
  for(let k = 0; k < 3; k++){ const [sx, sy] = pt(o, w / 2 - 1, 0, h * (0.25 + 0.25 * k)); g.fillStyle = '#2d241c'; g.fillRect(sx, sy - 7, 2.4, 7); }
  winS(g, o, w, w / 2 - 2, h * 0.6, 4, 7, { dark:true });
  merlons(g, o, 0, 0, h, w, w, m, { step:6.5, h:4.5, gold });
  if(L >= 7){ const [sx, sy] = roofHip(g, o, 2, 2, h + 4.5, w - 4, w - 4, 16 + L, L >= 10 ? ROOF.gold : ROOF.red, { ov:1 }); flag(g, sx, sy, gold || '#c8463c', 14); }
  else { const [sx, sy] = pt(o, w / 2, w / 2, h); flag(g, sx, sy, '#c8463c', 18); }
}
/* a forge (5): an open shed, the fire, the anvil */
function forge(g, o, L){
  castShadow(g, o, 0, 0, 26, 18, 18, 0.2);
  block(g, o, 0, 10, 0, 26, 8, 16, MAT.stone, { tex:false });
  [[1, 1], [24, 1]].forEach(([x, y])=>{ const [sx, sb] = pt(o, x, y, 0); g.fillStyle = '#6b4426'; g.fillRect(sx - 1, sb - 16, 2, 16); });
  const [fx, fb] = pt(o, 7, 6, 0); g.fillStyle = '#5a5046'; g.fillRect(fx - 5, fb - 6, 10, 6); ell(g, fx, fb - 6, 4, 2, '#ff9a3a'); ell(g, fx, fb - 6.4, 2.4, 1.2, '#ffe07a');
  for(let k = 0; k < 3; k++) ell(g, fx + k * 1.6, fb - 12 - k * 5, 2.4 + k, 1.8 + k * 0.8, `rgba(220,220,220,${0.5 - k * 0.12})`);
  const [ax, ab] = pt(o, 18, 5, 0); g.fillStyle = '#4a4e58'; g.fillRect(ax - 4, ab - 5, 8, 2.4); g.fillRect(ax - 1.4, ab - 3, 2.8, 3);
  roofGable(g, o, 0, 0, 16, 26, 18, 7, ROOF.slate, { wall:MAT.stone.c, ov:2, joints:false });
}
function barracksPlot(g, x0, y0, L){
  if(!L) return ruin(g, x0, y0, 'barracks', rng(x0 * 3 + y0));
  ell(g, x0 + 22, y0 + 90, 20, 8, 'rgba(196,166,110,.75)'); ell(g, x0 + 20, y0 + 89, 14, 5.4, 'rgba(226,204,150,.7)');
  if(L >= 4) watchTower(g, { X:x0 + 72, B:y0 + 70 }, 16, 44 + 2 * L, L);
  barrHall(g, { X:x0 + 34, B:y0 + 88 }, 44, 24, 20 + 2 * L, L, 13);
  if(L >= 2) target(g, x0 + 22, y0 + 78);
  dummy(g, x0 + 12, y0 + 96);
  if(L >= 3) rack(g, x0 + 74, y0 + 99);
}
/* its ground: the drill yard's sand; the sparring ring marked out (7) */
function barracksGround(g, X, Y, w, h, L, i){
  const R = rng(i * 5 + 1);
  g.fillStyle = 'rgba(240,222,170,.55)'; g.beginPath(); g.ellipse(X + 100, Y + 152, 84, 36, 0, 0, TAU); g.fill();
  for(let k = 0; k < 40; k++) ell(g, X + 30 + R() * 140, Y + 126 + R() * 56, 2 + R() * 3, 1, 'rgba(150,120,70,.25)', R());
  if(L >= 7){ g.strokeStyle = 'rgba(140,100,50,.6)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(X + 132, Y + 160, 30, 13, 0, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,240,200,.25)'; g.beginPath(); g.ellipse(X + 132, Y + 160, 28, 12, 0, 0, TAU); g.fill(); }
}
/* its lot: the hall at the back, the watch tower at the back left, round towers at the hall's ends (8); the drill yard:
   straw men, targets, racks of spears; the forge (5), the sparring ring (7); a palisade, then walls (6), white (9), gold
   (10) */
function barracksLot(g, X, Y, w, h, L, R){
  if(!L) return ruinLot(g, X, Y, 'barracks', R);
  fortFence(g, X, Y, L, 'back');
  const gold = L >= 10 ? GOLD[1] : null;
  watchTower(g, { X:X + 18, B:Y + 84 }, 30, 56 + 4 * L, L);
  const hw = 104 + 4 * Math.min(L, 6), hd = 42, hh = 24 + 3 * Math.min(L, 8);
  const o = { X:X + 112 - hw / 2 - hd * DX / 2, B:Y + 106 };
  barrHall(g, o, hw, hd, hh, L, 14);
  if(L >= 8){ const opt = { roof:L >= 10 ? GOLD[1] : RED[1], roofL:L >= 10 ? GOLD[0] : RED[0], roofD:L >= 10 ? GOLD[2] : RED[2], tip:GOLD[1], flag:gold || '#c8463c', slits:2, domeC:GOLD, band:L >= 9 ? GOLD[1] : null, white:L >= 9 };
    tower(g, o, -3, 6, 0, 10, hh + 30 + 3 * (L - 8), L >= 10 ? 'dome' : 'cone', opt); tower(g, o, hw + 3, 6, 0, 10, hh + 30 + 3 * (L - 8), L >= 10 ? 'dome' : 'cone', opt); }
  if(L >= 5) forge(g, { X:X + 150, B:Y + 140 }, L);
  /* the yard */
  target(g, X + 34, Y + 136); if(L >= 4) target(g, X + 56, Y + 132); if(L >= 8) target(g, X + 78, Y + 130);
  rack(g, X + 158, Y + 156);
  if(L >= 6) rack(g, X + 158, Y + 180);
  [[X + 30, Y + 176], [X + 52, Y + 182], [X + 74, Y + 176], [X + 96, Y + 182]].slice(0, 1 + Math.min(3, Math.floor(L / 3))).forEach(([dx, dy])=> dummy(g, dx, dy));
  if(L >= 7) for(let k = 0; k < 10; k++){ const a = k / 10 * TAU; const px = X + 132 + Math.cos(a) * 30, py = Y + 160 + Math.sin(a) * 13; if(py < Y + 160) { g.fillStyle = '#6b4426'; g.fillRect(px - 0.9, py - 6, 1.8, 6); } }
  if(L >= 7){ g.strokeStyle = '#8a5a32'; g.lineWidth = 1; g.beginPath(); g.ellipse(X + 132, Y + 156, 30, 13, 0, Math.PI, TAU); g.stroke(); }
  if(L >= 3) [[X + 116, Y + 186], [X + 130, Y + 188]].forEach(([cx, cy])=> crate(g, cx, cy));
  fortFence(g, X, Y, L, 'front');
}

/* ============================================================
   THE MARKET
   ============================================================ */
/* a stall in three dimensions: its counter, its goods, four posts, its striped awning */
function stall3(g, o, w, d, cA, cB, goods){
  castShadow(g, o, 0, 0, w, d, 20, 0.2);
  [[1, d - 1], [w - 1, d - 1]].forEach(([x, y])=>{ const [sx, sb] = pt(o, x, y, 0); g.fillStyle = '#5a3a1e'; g.fillRect(sx - 0.9, sb - 22, 1.8, 22); });
  block(g, o, 0, 0, 0, w, d * 0.55, 9, MAT.wood, { tex:false, topC:'#c8975e' });
  const items = goods === 'fruit' ? ['#d32f2c', '#f2a33a', '#e8d04a', '#7fbf4a'] : goods === 'bread' ? ['#c98b48', '#e0a85c'] : goods === 'potion' ? ['#e8414f', '#3f9fe0', '#5fc04a', '#c37be8'] : ['#b9653a', '#3f7d9a', '#e0c070'];
  for(let k = 0; k < Math.round(w / 4); k++){ const [sx, sy] = pt(o, 2.5 + k * 4, d * 0.27, 9); if(goods === 'potion'){ g.fillStyle = '#e8e2d2'; g.fillRect(sx - 0.5, sy - 5, 1, 1.6); ell(g, sx, sy - 2.2, 1.6, 2, items[k % 4]); } else ell(g, sx, sy - 1.6, 1.8, 1.5, items[k % items.length]); }
  [[1, 0.5], [w - 1, 0.5]].forEach(([x, y])=>{ const [sx, sb] = pt(o, x, y, 0); g.fillStyle = '#6b4426'; g.fillRect(sx - 0.9, sb - 20, 1.8, 20); });
  /* the awning: a slope from the back, high, to the front, its stripes, its scalloped edge */
  const P = [[-2, -3, 17], [w + 2, -3, 17], [w + 2, d + 1, 24], [-2, d + 1, 24]];
  fillP(g, o, P, cA);
  const n = Math.max(3, Math.round(w / 5));
  for(let k = 0; k < n; k += 2) fillP(g, o, [[-2 + (w + 4) * k / n, -3, 17], [-2 + (w + 4) * (k + 1) / n, -3, 17], [-2 + (w + 4) * (k + 1) / n, d + 1, 24], [-2 + (w + 4) * k / n, d + 1, 24]], cB);
  for(let k = 0; k < n; k++){ const [sx, sy] = pt(o, -2 + (w + 4) * (k + 0.5) / n, -3, 17); g.fillStyle = k % 2 ? cB : cA; g.beginPath(); g.arc(sx, sy, (w + 4) / n / 2, 0, Math.PI); g.fill(); }
  fillP(g, o, [[w + 2, -3, 17], [w + 2.8, -3, 17], [w + 2.8, d + 1, 24], [w + 2, d + 1, 24]], 'rgba(0,0,0,.25)');
}
/* the market hall: an arcade of shops in front, its roof; a clock tower (8), gold domes (10) */
function marketHall(g, o, w, d, h, L){
  const m = L >= 9 ? MAT.white : MAT.cream, gold = L >= 10 ? GOLD[1] : null;
  castShadow(g, o, 0, 0, w, d, h + 14, 0.24);
  block(g, o, 0, 0, 0, w, d, h, m, { quoins:true, trim:gold });
  const n = Math.max(3, Math.round(w / 26)), aw = w / n - 8;
  for(let k = 0; k < n; k++){ const ax = k * (w / n) + 4, [sx, sb] = pt(o, ax, 0, 0), ah = Math.min(h - 8, 22);
    g.fillStyle = '#3e3024'; g.beginPath(); g.moveTo(sx, sb); g.lineTo(sx, sb - ah + aw / 2); g.arc(sx + aw / 2, sb - ah + aw / 2, aw / 2, Math.PI, 0); g.lineTo(sx + aw, sb); g.fill();
    g.fillStyle = '#8a5a2b'; g.fillRect(sx + 1.5, sb - 7, aw - 3, 7);
    const c = [['#d32f2c', '#e8d04a'], ['#3f9fe0', '#c37be8'], ['#c98b48', '#e0a85c'], ['#7fbf4a', '#f2a33a'], ['#e8414f', '#3f9fe0']][k % 5];
    for(let j = 0; j < 3; j++) ell(g, sx + 3 + j * (aw - 6) / 2, sb - 8.4, 2, 1.8, c[j % 2]);
    for(let j = 0; j < 5; j++){ g.fillStyle = j % 2 ? '#f6eee0' : ['#c8463c', '#3c6fc4', '#e0a42a', '#3f9d5a', '#8e6cb0'][k % 5]; g.fillRect(sx - 2 + j * (aw + 4) / 5, sb - ah - 2, (aw + 4) / 5, 4.4); } }
  winRow(g, o, 0, 0, h - 14, w, n, 1, 14, { ww:6, wh:8, arch:true, flowers:L >= 6 });
  winRowS(g, o, w, 0, 4, d, 2, 1, h - 6, { ww:5, wh:9 });
  roofGable(g, o, 0, 0, h, w, d, 16 + d * 0.2, L >= 10 ? ROOF.gold : ROOF.red, { wall:m.c, ridge:gold || undefined });
  if(L >= 10) [[-2, 6], [w + 2, 6]].forEach(([tx, ty])=> tower(g, o, tx, ty, 0, 9, h + 16, 'dome', { white:true, domeC:GOLD, tip:GOLD[0], band:GOLD[1] }));
  if(L >= 8){ const tw = 20, tx = w / 2 - tw / 2, th = h + 34 + 4 * (L - 8), ot = { X:o.X + tx + 6 * DX, B:o.B - 6 * DY };
    block(g, ot, 0, 0, 0, tw, 16, th, m, { quoins:true, trim:gold });
    const [cx, cy] = pt(ot, tw / 2, 0, th - 9); ell(g, cx, cy, 6.4, 6.4, gold || '#5a4632'); ell(g, cx, cy, 5.2, 5.2, '#fbf8f1'); g.strokeStyle = '#3a2c20'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 3.8); g.moveTo(cx, cy); g.lineTo(cx + 2.8, cy + 1); g.stroke();
    if(L >= 10){ const top = domeOn(g, ot, tw / 2, 8, th, 10, 6, GOLD, { band:GOLD[1], tip:GOLD[0] }); }
    else { const [sx, sy] = roofHip(g, ot, 0, 0, th, tw, 16, 20, ROOF.red, { ov:1.5 }); flag(g, sx, sy, '#e0b84a', 10); } }
}
function well(g, sx, sb){
  shade(g, sx + 4, sb + 1, 9, 3, 0.25);
  g.fillStyle = lin(g, sx - 8, 0, sx + 8, 0, [[0, '#e0dace'], [1, '#9e968a']]); g.fillRect(sx - 8, sb - 8, 16, 8); ell(g, sx, sb - 8, 8, 3, '#cfc8b8'); ell(g, sx, sb - 8, 6, 2.2, '#2f5f8a');
  g.fillStyle = '#6b4426'; g.fillRect(sx - 7, sb - 22, 1.6, 14); g.fillRect(sx + 5.4, sb - 22, 1.6, 14);
  g.fillStyle = ROOF.red[1]; g.beginPath(); g.moveTo(sx - 10, sb - 20); g.lineTo(sx, sb - 28); g.lineTo(sx + 10, sb - 20); g.closePath(); g.fill(); g.fillStyle = ROOF.red[2]; g.beginPath(); g.moveTo(sx, sb - 28); g.lineTo(sx + 10, sb - 20); g.lineTo(sx + 12, sb - 21); g.lineTo(sx + 2, sb - 29); g.closePath(); g.fill();
  g.strokeStyle = '#5a3a1e'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(sx, sb - 20); g.lineTo(sx, sb - 12); g.stroke(); g.fillStyle = '#8a5a2b'; g.fillRect(sx - 1.6, sb - 12, 3.2, 3);
}
function marketPlot(g, x0, y0, L){
  if(!L) return ruin(g, x0, y0, 'market', rng(x0 + y0 * 3));
  if(L >= 4){ /* the covered hall on its posts */
    const o = { X:x0 + 14, B:y0 + 62 }, w = 68, d = 24;
    [[1, d - 1], [w - 1, d - 1], [1, 1], [w - 1, 1], [w / 2, 1]].forEach(([x, y])=>{ const [sx, sb] = pt(o, x, y, 0); g.fillStyle = '#6b4426'; g.fillRect(sx - 1.2, sb - 20, 2.4, 20); });
    roofHip(g, o, 0, 0, 20, w, d, 14, ROOF.red, {});
    if(L >= 5){ const [sx, sy] = pt(o, w / 2, d / 2, 34); flag(g, sx, sy, '#e0b84a', 10); }
  }
  if(L >= 3) bunting(g, x0 + 4, x0 + 96, y0 + 30, 7.7);
  stall3(g, { X:x0 + 8, B:y0 + 74 }, 28, 14, '#c8463c', '#f6eee0', 'fruit');
  stall3(g, { X:x0 + 54, B:y0 + 70 }, 28, 14, '#3c6fc4', '#f6eee0', 'potion');
  if(L >= 2) stall3(g, { X:x0 + 30, B:y0 + 96 }, 28, 14, '#e0a42a', '#f6eee0', 'bread');
  barrel(g, x0 + 88, y0 + 86);
  if(L >= 5) fountain(g, x0 + 84, y0 + 98, 0.9);
}
/* its ground: the square's cobbles in a ring round the middle */
function marketGround(g, X, Y, w, h, L, i){
  const cx = X + 100, cy = Y + 150;
  g.strokeStyle = 'rgba(120,104,80,.35)'; g.lineWidth = 1.4; [26, 34].forEach(r=>{ g.beginPath(); g.ellipse(cx, cy, r, r * 0.55, 0, 0, TAU); g.stroke(); });
  if(L >= 7){ g.fillStyle = 'rgba(255,250,236,.35)'; g.beginPath(); g.ellipse(cx, cy, 24, 13, 0, 0, TAU); g.fill(); }
}
/* its lot: the hall at the back, stalls round the square, the well (a fountain from 7), bunting (3), the clock tower
   (8), more stalls and lamps (9), gold (10) */
function marketLot(g, X, Y, w, h, L, R){
  if(!L) return ruinLot(g, X, Y, 'market', R);
  const hw = 150 + 2 * Math.min(L, 6), hd = 38, hh = 26 + 2 * Math.min(L, 8);
  marketHall(g, { X:X + 100 - hw / 2 - hd * DX / 2, B:Y + 98 }, hw, hd, hh, L);
  if(L >= 3) bunting(g, X + 8, X + 192, Y + 110, 9);
  const cx = X + 100, cy = Y + 150;
  const S = [[X + 12, Y + 132, '#8e6cb0', 'potion'], [X + 156, Y + 132, '#c8463c', 'fruit'], [X + 14, Y + 172, '#c8463c', 'fruit'], [X + 152, Y + 172, '#3f9d5a', 'pots'], [X + 56, Y + 186, '#3c6fc4', 'potion'], [X + 112, Y + 186, '#e0a42a', 'bread']];
  const nS = L >= 9 ? 6 : L >= 6 ? 5 : L >= 3 ? 4 : 2;
  S.slice(0, nS).sort((a, b)=> a[1] - b[1]).forEach(([sx, sy, c, k])=> stall3(g, { X:sx, B:sy }, 30, 14, c, '#f6eee0', k));
  if(L >= 7) fountain(g, cx, cy + 4, 1.5 + 0.1 * (L - 7)); else well(g, cx, cy + 6);
  if(L >= 10) statue(g, cx, cy - 12, 0.9, GOLD[1]);
  if(L >= 8) [[X + 10, Y + 118], [X + 190, Y + 118], [X + 10, Y + 194], [X + 190, Y + 194]].forEach(([lx, ly])=> lamp(g, lx, ly, 16, L >= 10));
  barrel(g, X + 94, Y + 196); barrel(g, X + 104, Y + 198); crate(g, X + 180, Y + 154);
  if(L >= 4) cart(g, X + 60, Y + 140);
}

/* ============================================================
   THE BUILDERS' YARD
   ============================================================ */
/* timber stacked to season, under a lean-to */
function timber(g, x, y){ const o = { X:x, B:y }; castShadow(g, o, 0, 0, 40, 14, 14, 0.2); for(let r = 0; r < 4; r++) for(let k = 0; k < 6 - (r % 2); k++){ const [sx, sy] = pt(o, 0, 2, 2 + r * 3.2); const cx = sx + 3.4 + k * 6.6 + (r % 2) * 3.3; ell(g, cx, sy - 0.5, 3.2, 3.2, '#8a5a2b'); ell(g, cx, sy - 0.5, 2.4, 2.4, '#e2b98a'); ell(g, cx, sy - 0.5, 0.9, 0.9, '#c49460'); }
  fillP(g, o, [[-2, -2, 17], [42, -2, 17], [42, 14, 22], [-2, 14, 22]], '#8a6a44'); fillP(g, o, [[-2, -2, 17], [42, -2, 17], [42, -2, 18.4], [-2, -2, 18.4]], '#5e4428'); }
/* a cube of dressed stone, in three dimensions */
function cube(g, sx, sb, s, col){ const o = { X:sx, B:sb }; block(g, o, 0, 0, 0, 9 * s, 7 * s, 7 * s, { c:col || '#dcd6ca', line:null }, { tex:false }); }
/* scaffolding round what is going up: poles, ledgers, planks, a ladder */
function scaffold(g, o, w, d, h){
  const P = [[0, 0], [w, 0], [0, d], [w, d], [w / 2, 0]];
  const S = []; P.forEach(([x, y])=> S.push([[x, y, 0], [x, y, h]]));
  for(let zz = 12; zz <= h; zz += 12){ S.push([[0, 0, zz], [w, 0, zz]]); S.push([[w, 0, zz], [w, d, zz]]); }
  lines(g, o, S, '#8a5a2b', 1.5);
  for(let zz = 12; zz <= h; zz += 12) fillP(g, o, [[-1, -3, zz], [w + 1, -3, zz], [w + 1, 0, zz], [-1, 0, zz]], '#c0884e');
  const [lx, lb] = pt(o, w * 0.7, -2, 0); g.strokeStyle = '#6b4426'; g.lineWidth = 1; g.beginPath(); g.moveTo(lx, lb); g.lineTo(lx + 3, lb - 24); g.moveTo(lx + 5, lb); g.lineTo(lx + 8, lb - 24); for(let k = 1; k < 7; k++){ g.moveTo(lx + k * 0.43, lb - k * 3.4); g.lineTo(lx + 5 + k * 0.43, lb - k * 3.4); } g.stroke();
}
/* what the builders are building: a stone base (1), an arch going up (4), a tower half built (7), the white arch done
   with its gold keystone (10) */
function project(g, o, L){
  const m = L >= 10 ? MAT.marble : MAT.stone;
  if(L >= 10){ castShadow(g, o, 0, 0, 44, 14, 50, 0.2); block(g, o, 0, 0, 0, 12, 14, 46, m, {}); block(g, o, 32, 0, 0, 12, 14, 46, m, {}); block(g, o, 0, 0, 46, 44, 14, 10, m, { trim:GOLD[1] });
    const [sx, sb] = pt(o, 12, 0, 0); g.fillStyle = 'rgba(0,0,0,0)'; const [ax, ay] = pt(o, 22, 0, 46); g.fillStyle = GOLD[1]; g.beginPath(); g.moveTo(ax - 4, ay - 8); g.lineTo(ax + 4, ay - 8); g.lineTo(ax + 3, ay); g.lineTo(ax - 3, ay); g.closePath(); g.fill(); return; }
  if(L >= 7){ castShadow(g, o, 0, 0, 30, 30, 40, 0.2); block(g, o, 0, 0, 0, 30, 30, 22 + 3 * (L - 7), m, { quoins:true }); const S = []; for(let k = 0; k < 6; k++){ const x = 2 + k * 5; S.push([[x, 0, 22 + 3 * (L - 7)], [x, 0, 25 + 3 * (L - 7) + (k % 2) * 3]]); } lines(g, o, S, '#a59d8c', 3); scaffold(g, o, 30, 30, 40); return; }
  if(L >= 4){ block(g, o, 0, 0, 0, 12, 14, 30 + 2 * (L - 4), m, {}); block(g, o, 30, 0, 0, 12, 14, 22 + 2 * (L - 4), m, {}); scaffold(g, o, 42, 14, 36); return; }
  block(g, o, 0, 0, 0, 36, 20, 8 + 2 * L, m, {}); scaffold(g, o, 36, 20, 24);
}
function workshop(g, o, w, d, h, L){
  const stone = L >= 8, m = stone ? MAT.stone : MAT.plaster, gold = L >= 10;
  castShadow(g, o, 0, 0, w, d, h + 10, 0.24);
  block(g, o, 0, 0, 0, w, d, h, m, { quoins:stone });
  const [sx, sb] = pt(o, w / 2 - 14, 0, 0); g.fillStyle = '#2d241c'; g.beginPath(); g.moveTo(sx, sb); g.lineTo(sx, sb - 16); g.arc(sx + 14, sb - 16, 14, Math.PI, 0); g.lineTo(sx + 28, sb); g.fill();
  g.fillStyle = '#6b6258'; g.fillRect(sx + 6, sb - 9, 16, 2.4); ell(g, sx + 20, sb - 12, 3, 2.4, '#ff9a3a');
  g.fillStyle = '#8a5a2b'; g.fillRect(sx - 6, sb - 22, 6, 22); g.fillRect(sx + 28, sb - 22, 6, 22);
  winRow(g, o, 0, 0, h - 14, w, 4, 1, 14, { ww:6, wh:8, skip:22 });
  winRowS(g, o, w, 0, 4, d, 2, 1, h - 6, { ww:5, wh:8 });
  roofGable(g, o, 0, 0, h, w, d, 14 + d * 0.18, gold ? ROOF.red : stone ? ROOF.slate : ROOF.wood, { wall:m.c });
  const [cx, cy] = pt(o, w * 0.78, d * 0.6, h + 10); g.fillStyle = lin(g, cx - 3, 0, cx + 3, 0, [[0, '#b46a4e'], [1, '#7a3f2c']]); g.fillRect(cx - 3, cy - 12, 6, 14); g.fillStyle = '#5a3022'; g.fillRect(cx - 4, cy - 14, 8, 2.4);
  for(let k = 0; k < 3; k++) ell(g, cx + 2 + k * 2.4, cy - 19 - k * 6, 3 + k * 1.2, 2.2 + k, `rgba(235,235,235,${0.5 - k * 0.12})`);
  if(gold){ const [gx, gy] = pt(o, w / 2, 0, h + 8); g.fillStyle = GOLD[1]; for(let k = 0; k < 8; k++){ const a = k / 8 * TAU; g.save(); g.translate(gx + Math.cos(a) * 6.5, gy + Math.sin(a) * 6.5); g.rotate(a); g.fillRect(-1.6, -1.6, 3.2, 3.2); g.restore(); } ell(g, gx, gy, 6, 6, GOLD[1]); ell(g, gx, gy, 2.4, 2.4, GOLD[2]); }
}
function yardPlot(g, x0, y0, L){
  workshop(g, { X:x0 + 50, B:y0 + 70 }, 36, 20, 20 + L, L);
  crane(g, x0 + 26, y0 + 86, 40 + 3 * L);
  logs(g, x0 + 6, y0 + 96);
  if(L >= 4) cart(g, x0 + 40, y0 + 98);
  [[x0 + 64, y0 + 98], [x0 + 76, y0 + 99], [x0 + 70, y0 + 92]].forEach(([bx, by])=> cube(g, bx, by, 0.9));
  if(L >= 5){ const [sx, sy] = [x0 + 26, y0 + 86 - 40 - 3 * L]; flag(g, sx, sy, '#c8463c', 9); }
}
function yardGround(g, X, Y, w, h, L, i){
  const R = rng(i * 7 + 5);
  for(let k = 0; k < 60; k++) ell(g, X + 110 + R() * 80, Y + 150 + R() * 40, 1.2 + R() * 1.6, 0.8, 'rgba(240,236,226,.6)', R());
  g.fillStyle = 'rgba(120,90,50,.22)'; g.beginPath(); g.ellipse(X + 60, Y + 172, 34, 12, 0, 0, TAU); g.fill();
}
/* its lot: the workshop, what is being built in its scaffold, the treadwheel crane (a second from 9), the kiln (8); the
   stone, the logs, the carts */
function yardLot(g, X, Y, w, h, L, R){
  lotFence(g, X, Y, L, 'back');
  project(g, { X:X + 16, B:Y + 100 }, L);
  timber(g, X + 16, Y + 136);
  workshop(g, { X:X + 92, B:Y + 100 }, 92, 42, 26 + 2 * Math.min(L, 6), L);
  if(L >= 8){ const kx = X + 74, ky = Y + 136; shade(g, kx + 6, ky + 1, 14, 3.4, 0.3); g.fillStyle = lin(g, kx - 12, 0, kx + 12, 0, [[0, '#d07a5a'], [1, '#8a4a32']]); g.beginPath(); g.moveTo(kx - 12, ky); g.bezierCurveTo(kx - 12, ky - 22, kx + 12, ky - 22, kx + 12, ky); g.closePath(); g.fill(); g.fillStyle = '#2d1a10'; g.beginPath(); g.arc(kx, ky, 5, Math.PI, 0); g.fill(); ell(g, kx, ky - 1.5, 3.4, 2.4, '#ff9a3a'); ell(g, kx, ky - 1, 1.8, 1.2, '#ffe07a'); g.fillStyle = '#8a4a32'; g.fillRect(kx + 3, ky - 22, 5, 6); }
  crane(g, X + 48, Y + 172, 66 + 2 * L);
  if(L >= 9) crane(g, X + 134, Y + 160, 60);
  [[X + 150, Y + 186], [X + 162, Y + 187], [X + 174, Y + 186], [X + 156, Y + 178], [X + 168, Y + 179], [X + 162, Y + 171]].slice(0, 3 + Math.min(3, Math.floor(L / 3))).forEach(([bx, by])=> cube(g, bx, by, 1, L >= 10 ? '#f6f2ea' : null));
  logs(g, X + 78, Y + 190);
  if(L >= 3) cart(g, X + 110, Y + 150, L >= 6 ? null : 'hay');
  lotFence(g, X, Y, L, 'front', 18);
}

/* ============================================================
   THE HOUSES AND THE MAGES' TOWERS
   ============================================================ */
/* a house: a cottage of plaster and timber, thatched (1); red tiles, flowers, a chimney (2); with its annex (3); two
   floors (4); a blue roof, a jettied floor, a flag (5); stone below (6); a turret (7); white stone, a balcony (8);
   gilded (9); a gold-domed turret and a fountain (10) */
function chimney3(g, o, x, y, z, h){ block(g, o, x, y, z, 6, 6, h, MAT.brick, { tex:false }); block(g, o, x - 1, y - 1, z + h, 8, 8, 2, MAT.stone, { tex:false }); const [sx, sy] = pt(o, x + 3, y + 3, z + h + 2); for(let k = 0; k < 3; k++) ell(g, sx + 1 + k * 2.4, sy - 4 - k * 5.5, 2.6 + k * 1.1, 2 + k * 0.9, `rgba(235,235,235,${0.5 - k * 0.12})`); }
function houseArt(g, x0, y0, L){
  const R = rng(x0 * 3 + y0 * 7);
  if(L <= 3){
    const o = { X:x0 + 28, B:y0 + 86 }, w = 34 + 2 * L, d = 22, h = 16 + L;
    castShadow(g, o, 0, 0, w, d, h + 12, 0.24);
    if(L === 3){ const o2 = { X:x0 + 8, B:y0 + 92 }; castShadow(g, o2, 0, 0, 20, 16, 22, 0.22); block(g, o2, 0, 0, 0, 20, 16, 13, MAT.plaster, {}); doorF(g, o2, 6, 0, 0, 7, 10, '#7a4a2a'); roofGable(g, o2, 0, 0, 13, 20, 16, 10, ROOF.thatch, { thatch:true, wall:MAT.plaster.c, ov:2 }); }
    block(g, o, 0, 0, 0, w, d, h, MAT.plaster, {});
    doorF(g, o, w / 2 - 4, 0, 0, 8, 12, '#7a4a2a');
    winF(g, o, 4, 0, 5, 6, 6, { flowers:L >= 2, shutters:L >= 2 ? '#3f7d5a' : null }); if(w > 36) winF(g, o, w - 10, 0, 5, 6, 6, { flowers:L >= 2, shutters:L >= 2 ? '#3f7d5a' : null });
    winS(g, o, w, d / 2 - 2.5, 5, 5, 6);
    roofGable(g, o, 0, 0, h, w, d, 14, L >= 2 ? ROOF.red : ROOF.thatch, { thatch:L < 2, wall:MAT.plaster.c });
    if(L >= 2) chimney3(g, o, w * 0.7, d * 0.6, h + 6, 10);
    if(L >= 2){ g.strokeStyle = '#a07a4a'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x0 + 6, y0 + 96); g.lineTo(x0 + 42, y0 + 96); g.moveTo(x0 + 58, y0 + 96); g.lineTo(x0 + 94, y0 + 96); g.stroke(); for(let k = 0; k < 11; k++){ if(k === 5) continue; g.fillStyle = '#d8b27a'; g.fillRect(x0 + 6 + k * 8.4, y0 + 91, 2, 6); } }
    else for(let k = 0; k < 4; k++) ell(g, x0 + 14 + k * 3.4, y0 + 90, 2.2, 2, '#5fa84a');
    return;
  }
  /* two floors and more */
  const white = L >= 8, stoneBelow = L >= 6, gold = L >= 9 ? GOLD[1] : null;
  const o = { X:x0 + 22, B:y0 + 88 }, w = 46 + (L >= 5 ? 6 : 0), d = 26, h1 = 16, h2 = 15;
  castShadow(g, o, 0, 0, w, d, h1 + h2 + 14, 0.24);
  const mBelow = white ? MAT.white : stoneBelow ? MAT.stone : MAT.plaster, mAbove = white ? MAT.white : MAT.plaster;
  block(g, o, 0, 0, 0, w, d, h1, mBelow, { quoins:stoneBelow, top:false });
  const jet = L >= 5 && !white ? 2 : 0;
  block(g, o, -jet, -jet, h1, w + 2 * jet, d + jet, h2, mAbove, { trim:gold });
  doorF(g, o, w / 2 - 5, 0, 0, 10, 13, white ? '#3c2a1c' : '#7a4a2a', { gold, lamp:L >= 9 });
  [5, w - 13].forEach(wx=> winF(g, o, wx, 0, 4, 7, 8, { arch:white, shutters:white ? null : '#3f6fa0', flowers:true, gold:L >= 10 ? GOLD[1] : null }));
  for(let k = 0; k < 3; k++) winF(g, o, 5 + k * (w - 17) / 2, -jet, h1 + 3.5, 7, 8.5, { arch:white, flowers:L >= 6, gold:L >= 10 ? GOLD[1] : null });
  winRowS(g, o, w, 0, 0, d, 2, 2, 15, { ww:4.5, wh:7 });
  if(white){ const [bx, by] = pt(o, w / 2 - 13, -1.5, h1 + 1); g.fillStyle = '#efe8da'; g.fillRect(bx, by - 1, 26, 2.4); rail(g, o, w / 2 - 13, -1.5, h1 + 1, 26, 6, '#f6f0e2', gold); }
  const roofC = L >= 10 ? ROOF.blue : white ? ROOF.blue : L >= 5 ? ROOF.slate : ROOF.red;
  roofGable(g, o, -jet, -jet, h1 + h2, w + 2 * jet, d + jet, 16, roofC, { wall:mAbove.c, ridge:gold || undefined });
  if(L >= 4){ const dx = w / 2 - 5; block(g, o, dx, 6, h1 + h2 + 1, 10, 6, 8, mAbove, { tex:false }); winF(g, o, dx + 3, 6, h1 + h2 + 2.5, 4, 5, { sill:false }); roofGableY(g, o, dx, 6, h1 + h2 + 9, 10, 6, 6, roofC, { wall:mAbove.c, ov:1.2 }); }
  chimney3(g, o, w * 0.76, d * 0.62, h1 + h2 + 6, 11);
  if(L >= 6) chimney3(g, o, w * 0.12, d * 0.62, h1 + h2 + 6, 9);
  if(L === 5){ const [sx, sy] = pt(o, w / 2, d / 2, h1 + h2 + 16); flag(g, sx, sy, '#e0b84a', 8); }
  if(L >= 7){ const tx = w + 4, roofs = L >= 10 ? { roof:GOLD[1], roofL:GOLD[0], roofD:GOLD[2] } : white ? { roof:BLUE[1], roofL:BLUE[0], roofD:BLUE[2] } : { roof:RED[1], roofL:RED[0], roofD:RED[2] };
    tower(g, o, tx - 2, 3, 0, 8.5, h1 + h2 + 16 + 3 * (L - 7), L >= 10 ? 'dome' : 'cone', Object.assign({ white, band:gold, flag:L >= 9 ? '#c8463c' : null, tip:GOLD[1], domeC:GOLD, slits:1 }, roofs)); }

  if(L >= 10){ fountain(g, x0 + 11, y0 + 97, 0.75); topiary(g, x0 + 92, y0 + 98, 0.7); }
  else if(L >= 9){ lamp(g, x0 + 10, y0 + 96, 12, true); for(let k = 0; k < 6; k++) ell(g, x0 + 60 + k * 5, y0 + 96 + (k % 2), 1.6, 1.6, ['#e8414f', '#f2c23a', '#c9a6f0'][k % 3]); }
  else if(L >= 6){ g.strokeStyle = '#a07a4a'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x0 + 6, y0 + 97); g.lineTo(x0 + 40, y0 + 97); g.moveTo(x0 + 60, y0 + 97); g.lineTo(x0 + 94, y0 + 97); g.stroke(); }
}
/* the mages' tower on a plinth of three steps (its old picture on top, raised) */
const oldTower = KC_ART.ART.tower;
function towerArt(g, x0, y0, L){
  const o = { X:x0 + 28, B:y0 + 96 }, m = L >= 6 ? MAT.white : MAT.stone;
  castShadow(g, o, 0, 0, 44, 22, 10, 0.2);
  block(g, o, 0, 0, 0, 44, 22, 3, m, { tex:false }); block(g, o, 3, 2, 3, 38, 18, 3, m, { tex:false }); block(g, o, 6, 4, 6, 32, 14, 3, m, { tex:false, trim:L >= 7 ? GOLD[1] : null });
  g.save(); g.translate(3.5, -6.5); g.translate(x0 + 50, y0 + 88); g.scale(0.94, 0.94); g.translate(-(x0 + 50), -(y0 + 88));
  oldTower(g, x0, y0, L);
  g.restore();
}

/* ============================================================
   IN PLACE: these painters for 47-kingdom-art.js's
   ============================================================ */
const any = f=> (f.any = true, f);
KC_ART.ART.palace = palacePlot;
KC_ART.ART.granary = granaryPlot;
KC_ART.BIG.palace = any(palaceGrand);
KC_ART.BIG.granary = any(granaryLot);
KC_ART.LOTG.palace = palaceGround;
KC_ART.LOTG.granary = granaryGround;
KC_ART.ART.barracks = barracksPlot;
KC_ART.ART.market = marketPlot;
KC_ART.ART.yard = yardPlot;
KC_ART.ART.house = houseArt;
KC_ART.ART.tower = towerArt;
KC_ART.BIG.barracks = any(barracksLot);
KC_ART.BIG.market = any(marketLot);
KC_ART.BIG.yard = any(yardLot);
KC_ART.LOTG.barracks = barracksGround;
KC_ART.LOTG.market = marketGround;
KC_ART.LOTG.yard = yardGround;
KC_ART.PALSPOTS.fn = palaceSpots;
/* where the workers stand on each lot, in front of what is built there */
Object.assign(KC_ART.SPOTS[2], {
  granary:[[56, 176, 0], [98, 184, 1], [140, 142, 1], [176, 152, 1]],
  barracks:[[50, 156, 0], [110, 168, 1], [132, 188, 0], [90, 148, 1]],
  market:[[74, 164, 0], [128, 162, 1], [100, 180, 0], [44, 152, 1]],
  yard:[[96, 126, 1], [124, 180, 0], [70, 164, 1], [182, 142, 0]],
});
window.KC_3D = { pt, block, roofGable, roofGableY, roofHip, roofGambrel, tint, MAT, ROOF, DX, DY };
})();
