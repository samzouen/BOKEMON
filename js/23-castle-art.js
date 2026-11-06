/* ============================================================
   23-castle-art.js — THE CASTLE'S PICTURES (3.97)
   The designer, of the mockups: "The houses and new castle looks great!!"
   Each building is drawn whole (its roof's tiles running its whole width,
   its timbers across its storeys, its doors and windows where they are)
   and cut into its squares, as the squares one stands on stay as they
   were; the palace too, with its pilasters, its arched and pedimented
   windows, the King's balcony and the great door; the towers drawn with
   their courses, windows and scaled cones; finer chimneys, signs, banners,
   lamps and cobbles. Everything here is drawn once at a size and kept
   (pic), the least lately used let go past a budget.
   One name outside: CA_ART.
   ============================================================ */
const CA_ART = (function(){
const rng = (seed)=>{ let a = seed >>> 0; return ()=>{ a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const sh = (hex, f)=> caShade(hex, f);
const L = (S, f)=> Math.max(1, S * f);
const mix = (a, b, t)=>{ const p = (h)=> [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; const A = p(a), B = p(b); return '#' + A.map((v, i)=> Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const GOLD = '#d9b247', GOLD_L = '#f4dc84', GOLD_D = '#a07a22';

function archPath(g, x, y, w, h, arch){
  g.beginPath();
  if(!arch){ g.rect(x, y, w, h); return; }
  const r = w / 2;
  g.moveTo(x, y + h); g.lineTo(x, y + r); g.arc(x + r, y + r, r, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath();
}
function grain(g, x, y, w, h, rnd, n, col){
  g.strokeStyle = col || 'rgba(30,15,5,.16)'; g.lineWidth = 1;
  for(let i = 0; i < n; i++){
    const yy = y + rnd() * h, x0 = x + rnd() * w * 0.6, len = Math.min(w * (0.2 + rnd() * 0.4), x + w - x0);   // (never past its own edge)
    g.beginPath(); g.moveTo(x0, yy); g.quadraticCurveTo(x0 + len / 2, yy + (rnd() - 0.5) * h * 0.08, x0 + len, yy); g.stroke();
  }
}
function speckle(g, x, y, w, h, rnd, n, cols, size){
  for(let i = 0; i < n; i++){ g.fillStyle = cols[i % cols.length]; g.fillRect(x + rnd() * w, y + rnd() * h, 1 + rnd() * size, 1 + rnd() * size * 0.6); }
}

/* ---------- roof coverings ---------- */
function roofTiles(g, x, y, w, h, S, base, rnd, o){
  o = o || {};
  const th = S * (o.th || 0.19), tw = S * (o.tw || 0.26), ry = o.fish ? tw * 0.5 : th * 0.5;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = sh(base, -0.42); g.fillRect(x, y, w, h);
  const rows = Math.ceil(h / th) + 2;
  for(let r = rows - 1; r >= 0; r--){
    const yy = y + r * th - th * 0.6, off = (r % 2) * tw / 2;
    const depth = (yy - y) / Math.max(1, h);                 // 0 at the ridge, 1 at the eaves
    for(let xx = x - tw + off; xx < x + w + tw; xx += tw){
      let v = (rnd() - 0.5) * 0.14 + 0.1 - depth * 0.22;
      if(o.weather && rnd() < 0.05) v -= 0.16;
      if(o.weather && rnd() < 0.04) v += 0.14;
      g.fillStyle = sh(base, v);
      g.beginPath();
      if(o.shingle){
        const sw = tw * (0.86 + rnd() * 0.12);
        g.rect(xx + 0.5, yy, sw - 1, th * 1.45);
        g.fill();
        g.fillStyle = 'rgba(20,8,0,.35)'; g.fillRect(xx + 0.5, yy + th * 1.35, sw - 1, th * 0.12);
        g.fillStyle = 'rgba(255,235,200,.12)'; g.fillRect(xx + 0.5, yy + th * 0.62, Math.max(1, sw * 0.08), th * 0.7);
        continue;
      }
      g.moveTo(xx + 0.6, yy); g.lineTo(xx + tw - 0.6, yy); g.lineTo(xx + tw - 0.6, yy + th * 1.2 - ry);
      g.ellipse(xx + tw / 2, yy + th * 1.2 - ry, tw / 2 - 0.6, ry, 0, 0, Math.PI);
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(30,10,0,.32)'; g.lineWidth = L(S, 0.016);
      g.beginPath(); g.ellipse(xx + tw / 2, yy + th * 1.2 - ry, tw / 2 - 0.6, ry, 0, 0.2, Math.PI - 0.2); g.stroke();
      g.fillStyle = 'rgba(255,240,215,.16)'; g.fillRect(xx + tw * 0.16, yy + th * 0.55, Math.max(1, tw * 0.1), th * 0.5);
    }
  }
  /* the light: a little brighter up by the ridge, a little warmer on the left */
  const lg = g.createLinearGradient(x, 0, x + w, 0);
  lg.addColorStop(0, 'rgba(255,240,210,.10)'); lg.addColorStop(1, 'rgba(20,10,30,.10)');
  g.fillStyle = lg; g.fillRect(x, y, w, h);
  g.restore();
}
function moss(g, x, y, w, h, S, rnd, n){
  for(let i = 0; i < n; i++){
    const mx = x + rnd() * w, my = y + h * (0.35 + rnd() * 0.6), r = S * (0.06 + rnd() * 0.1);
    for(let k = 0; k < 5; k++){ g.fillStyle = ['rgba(102,128,52,.55)', 'rgba(140,160,70,.5)', 'rgba(80,104,44,.5)'][k % 3]; g.beginPath(); g.ellipse(mx + (rnd() - 0.5) * r * 2, my + (rnd() - 0.5) * r * 0.8, r * (0.4 + rnd() * 0.5), r * (0.25 + rnd() * 0.3), 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(220,210,120,.6)'; for(let k = 0; k < 3; k++) g.fillRect(mx + (rnd() - 0.5) * r * 2, my + (rnd() - 0.5) * r, 1.5, 1.5);
  }
}
function ridge(g, x, y, w, S, base, o){
  o = o || {};
  g.fillStyle = sh(base, -0.38); g.fillRect(x, y, w, S * 0.26);
  const step = S * 0.34;
  for(let xx = x - step / 2; xx < x + w; xx += step){
    g.fillStyle = sh(base, -0.1); g.beginPath(); g.ellipse(xx + step / 2, y + S * 0.12, step * 0.5, S * 0.1, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,240,220,.28)'; g.fillRect(xx + step * 0.2, y + S * 0.05, step * 0.5, Math.max(1, S * 0.025));
  }
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, y + S * 0.23, w, Math.max(1, S * 0.03));
}
function eaves(g, x, y, w, S, beam){
  /* the fascia board, the gutter on it */
  g.fillStyle = sh(beam, -0.2); g.fillRect(x, y - S * 0.1, w, S * 0.1);
  g.fillStyle = '#7d8189'; g.fillRect(x, y - S * 0.06, w, S * 0.07);
  g.fillStyle = '#c3c8cf'; g.fillRect(x, y - S * 0.06, w, Math.max(1, S * 0.018));
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, y + S * 0.005, w, Math.max(1, S * 0.015));
}

/* ---------- windows, doors, small things ---------- */
function windowA(g, x, y, w, h, S, o){
  o = o || {};
  const fw = Math.max(1.5, S * 0.035), rnd = o.rnd || Math.random;
  if(o.shutter){
    [x - w * 0.47, x + w * 1.07].forEach(sx=>{
      g.fillStyle = o.shutter; g.fillRect(sx, y - fw * 0.5, w * 0.4, h + fw);
      g.fillStyle = 'rgba(0,0,0,.22)';
      for(let k = 1; k < 6; k++) g.fillRect(sx + w * 0.06, y + h * k / 6, w * 0.28, Math.max(1, S * 0.012));
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(sx, y - fw * 0.5, Math.max(1, w * 0.05), h + fw);
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = L(S, 0.012); g.strokeRect(sx, y - fw * 0.5, w * 0.4, h + fw);
    });
  }
  if(o.lintel){ g.fillStyle = o.lintel; g.fillRect(x - fw * 2.2, y - fw * 2.6, w + fw * 4.4, fw * 2); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x - fw * 2.2, y - fw * 2.6, w + fw * 4.4, Math.max(1, fw * 0.4)); }
  g.fillStyle = o.frame || '#5b3b22';
  archPath(g, x - fw, y - fw, w + fw * 2, h + fw * 2, o.arch); g.fill();
  const gl = g.createLinearGradient(x, y, x + w * 0.7, y + h);
  gl.addColorStop(0, '#d9f0fa'); gl.addColorStop(0.45, '#8bbddc'); gl.addColorStop(1, '#46739b');
  g.fillStyle = gl; archPath(g, x, y, w, h, o.arch); g.fill();
  if(o.lit){
    const lg = g.createRadialGradient(x + w / 2, y + h * 0.7, 0, x + w / 2, y + h * 0.7, Math.max(w, h));
    lg.addColorStop(0, `rgba(255,212,120,${0.92 * o.lit})`); lg.addColorStop(0.7, `rgba(255,170,80,${0.55 * o.lit})`); lg.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = lg; archPath(g, x, y, w, h, o.arch); g.fill();
  }
  g.save(); archPath(g, x, y, w, h, o.arch); g.clip();
  if(o.curtain){
    g.fillStyle = o.curtain;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.34, y); g.quadraticCurveTo(x + w * 0.12, y + h * 0.45, x + w * 0.2, y + h); g.lineTo(x, y + h); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x + w, y); g.lineTo(x + w * 0.66, y); g.quadraticCurveTo(x + w * 0.88, y + h * 0.45, x + w * 0.8, y + h); g.lineTo(x + w, y + h); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + w * 0.05, y, Math.max(1, w * 0.04), h); g.fillRect(x + w * 0.88, y, Math.max(1, w * 0.04), h);
    g.fillStyle = o.curtainTop || sh(o.curtain, -0.2); g.fillRect(x, y, w, h * 0.1);
  }
  g.fillStyle = 'rgba(255,255,255,.42)';
  g.beginPath(); g.moveTo(x + w * 0.06, y + h); g.lineTo(x + w * 0.26, y + h); g.lineTo(x + w * 0.78, y); g.lineTo(x + w * 0.58, y); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)';
  g.beginPath(); g.moveTo(x + w * 0.34, y + h); g.lineTo(x + w * 0.4, y + h); g.lineTo(x + w * 0.92, y); g.lineTo(x + w * 0.86, y); g.closePath(); g.fill();
  if(o.diamond){
    g.strokeStyle = 'rgba(40,30,20,.55)'; g.lineWidth = 1;
    const d = w / 3.2;
    for(let k = -6; k < 10; k++){ g.beginPath(); g.moveTo(x + k * d, y); g.lineTo(x + k * d + h, y + h); g.stroke(); g.beginPath(); g.moveTo(x + k * d, y); g.lineTo(x + k * d - h, y + h); g.stroke(); }
  }
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x, y + (o.arch ? w * 0.5 : 0), Math.max(1, w * 0.05), h);
  if(!o.arch) g.fillRect(x, y, w, Math.max(1, h * 0.06));
  g.restore();
  g.strokeStyle = o.frame || '#5b3b22'; g.lineWidth = Math.max(1.2, w * 0.06);
  g.beginPath(); g.moveTo(x + w / 2, y + (o.arch ? 0 : 0)); g.lineTo(x + w / 2, y + h);
  if(!o.diamond){ const ty = o.arch ? y + w * 0.5 + (h - w * 0.5) * 0.25 : y + h * 0.48; g.moveTo(x, ty); g.lineTo(x + w, ty); }
  g.stroke();
  if(o.arch && !o.diamond){ g.lineWidth = Math.max(1, w * 0.035); for(const a of [Math.PI * 1.25, Math.PI * 1.75]){ g.beginPath(); g.moveTo(x + w / 2, y + w / 2); g.lineTo(x + w / 2 + Math.cos(a) * w / 2, y + w / 2 + Math.sin(a) * w / 2); g.stroke(); } }
  /* sill */
  g.fillStyle = o.sill || '#e8dfcf'; g.fillRect(x - fw * 2, y + h + fw * 0.6, w + fw * 4, Math.max(2, S * 0.045));
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - fw * 2, y + h + fw * 0.6 + Math.max(2, S * 0.045), w + fw * 4, Math.max(1, S * 0.015));
  if(o.box) flowerBox(g, x - fw * 1.6, y + h + fw * 0.6 + S * 0.05, w + fw * 3.2, S * 0.09, S, o.box, rnd);
}
function flowerBox(g, x, y, w, h, S, cols, rnd){
  /* the greens spill over the box's top, a trail or two hangs down */
  for(let i = 0; i < 3; i++){ const tx = x + w * (0.15 + rnd() * 0.7); g.strokeStyle = '#3f7a34'; g.lineWidth = L(S, 0.018); g.beginPath(); g.moveTo(tx, y + h * 0.6); g.quadraticCurveTo(tx + S * 0.03, y + h * 1.6, tx - S * 0.01, y + h * (1.9 + rnd() * 0.8)); g.stroke(); g.fillStyle = '#4f8f3f'; g.beginPath(); g.arc(tx - S * 0.01, y + h * (1.9 + rnd() * 0.6), S * 0.02, 0, 7); g.fill(); }
  g.fillStyle = '#7a4a26'; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,220,180,.18)'; g.fillRect(x, y, w, Math.max(1, h * 0.2));
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, y + h * 0.8, w, h * 0.2);
  for(let i = 0; i < 10; i++){ g.fillStyle = ['#3d7a30', '#58993f', '#4a8a36'][i % 3]; g.beginPath(); g.arc(x + w * i / 9, y + h * 0.05, S * (0.035 + rnd() * 0.015), 0, 7); g.fill(); }
  for(let i = 0; i < 9; i++){
    const fx = x + w * (0.04 + rnd() * 0.92), fy = y - S * (0.01 + rnd() * 0.05), c = cols[i % cols.length], r = S * 0.016;
    g.fillStyle = c; for(let p = 0; p < 5; p++){ const a = p / 5 * Math.PI * 2; g.beginPath(); g.arc(fx + Math.cos(a) * r * 1.3, fy + Math.sin(a) * r * 1.3, r, 0, 7); g.fill(); }
    g.fillStyle = '#ffe17a'; g.beginPath(); g.arc(fx, fy, r * 0.8, 0, 7); g.fill();
  }
}
function doorA(g, cx, by, dw, dh, S, o){
  o = o || {};
  const rnd = o.rnd || Math.random, x = cx - dw / 2, y = by - dh, r = dw / 2, sw = dw * (o.wide ? 0.12 : 0.16);
  /* the surround: stone voussoirs, or a timber frame */
  g.fillStyle = o.surround || '#cbbfa9';
  archPath(g, x - sw, y - sw, dw + sw * 2, dh + sw, o.arch !== false); g.fill();
  if(o.arch !== false){
    g.strokeStyle = 'rgba(70,55,40,.45)'; g.lineWidth = L(S, 0.012);
    for(let i = 0; i <= 8; i++){ const a = Math.PI + i / 8 * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * r, y + r + Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * (r + sw), y + r + Math.sin(a) * (r + sw)); g.stroke(); }
    g.fillStyle = o.key || sh(o.surround || '#cbbfa9', 0.12); g.beginPath(); g.moveTo(cx - sw * 0.5, y - sw); g.lineTo(cx + sw * 0.5, y - sw); g.lineTo(cx + sw * 0.35, y + sw * 0.15); g.lineTo(cx - sw * 0.35, y + sw * 0.15); g.closePath(); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x - sw, y + r, Math.max(1, sw * 0.25), dh - r);
  g.fillStyle = '#22150c'; archPath(g, x, y, dw, dh, o.arch !== false); g.fill();
  /* the leaves */
  const inset = dw * 0.04;
  const lg = g.createLinearGradient(x, 0, x + dw, 0);
  lg.addColorStop(0, sh(o.color, -0.2)); lg.addColorStop(0.45, sh(o.color, 0.1)); lg.addColorStop(1, sh(o.color, -0.28));
  g.fillStyle = lg; archPath(g, x + inset, y + inset, dw - inset * 2, dh - inset, o.arch !== false); g.fill();
  g.save(); archPath(g, x + inset, y + inset, dw - inset * 2, dh - inset, o.arch !== false); g.clip();
  const planks = o.wide ? 8 : 5;
  g.strokeStyle = 'rgba(25,12,4,.42)'; g.lineWidth = L(S, 0.012);
  for(let i = 1; i < planks; i++){ const px = x + dw * i / planks; g.beginPath(); g.moveTo(px, y); g.lineTo(px, by); g.stroke(); }
  grain(g, x, y, dw, dh, rnd, o.wide ? 26 : 14);
  if(o.fan){
    const fg = g.createLinearGradient(0, y, 0, y + r);
    fg.addColorStop(0, o.fanLit ? '#ffe9a8' : '#cfe7f5'); fg.addColorStop(1, o.fanLit ? '#f2b05a' : '#6f9fc4');
    g.fillStyle = sh('#5a3a20', -0.2); g.beginPath(); g.arc(cx, y + r, r - inset, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = fg; g.beginPath(); g.arc(cx, y + r, r - inset * 2.4, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle = o.fanBars || '#5a3a20'; g.lineWidth = L(S, 0.012);
    for(let i = 1; i < 6; i++){ const a = Math.PI + i / 6 * Math.PI; g.beginPath(); g.moveTo(cx, y + r); g.lineTo(cx + Math.cos(a) * r, y + r + Math.sin(a) * r); g.stroke(); }
    g.fillStyle = sh(o.color, -0.35); g.fillRect(x, y + r - L(S, 0.02), dw, L(S, 0.04));
  }
  if(o.wide){ g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx - L(S, 0.01), y, L(S, 0.02), dh); }
  g.restore();
  /* hinges and a ring or two */
  const hinge = o.hinge || '#2b2a30';
  g.fillStyle = hinge;
  const straps = o.wide ? [[x + inset, 1], [x + dw - inset, -1]] : [[x + inset, 1]];
  [0.42, 0.8].forEach(f=>{ const hy = y + dh * f; straps.forEach(([sx, dir])=>{ const len = dw * (o.wide ? 0.32 : 0.55) * dir; g.fillRect(Math.min(sx, sx + len), hy, Math.abs(len), Math.max(2, dh * 0.04)); g.beginPath(); g.arc(sx + len, hy + Math.max(1, dh * 0.02), Math.max(1.5, dh * 0.03), 0, 7); g.fill(); }); });
  g.strokeStyle = o.knob || '#e2c062'; g.lineWidth = L(S, 0.014);
  (o.wide ? [cx - dw * 0.08, cx + dw * 0.08] : [x + dw * 0.78]).forEach(kx=>{ g.beginPath(); g.arc(kx, y + dh * 0.6, Math.max(2, dw * (o.wide ? 0.03 : 0.05)), 0, 7); g.stroke(); });
  /* the step */
  g.fillStyle = o.step || '#d4ccbe'; g.fillRect(x - sw * 1.3, by - S * 0.06, dw + sw * 2.6, S * 0.06);
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x - sw * 1.3, by - S * 0.06, dw + sw * 2.6, Math.max(1, S * 0.012));
}
function lantern(g, x, y, S, o){
  o = o || {};
  const s = S * (o.size || 1);
  const lg = g.createRadialGradient(x, y + s * 0.12, 0, x, y + s * 0.12, s * 0.42);
  lg.addColorStop(0, 'rgba(255,214,120,.5)'); lg.addColorStop(1, 'rgba(255,200,100,0)');
  g.fillStyle = lg; g.fillRect(x - s * 0.45, y - s * 0.3, s * 0.9, s * 0.9);
  g.strokeStyle = '#26252b'; g.lineWidth = L(s, 0.025);
  g.beginPath(); g.moveTo(x + (o.left ? s * 0.12 : -s * 0.12), y - s * 0.06); g.quadraticCurveTo(x, y - s * 0.12, x, y - s * 0.02); g.stroke();
  g.fillStyle = '#26252b'; g.fillRect(x - s * 0.07, y - s * 0.02, s * 0.14, s * 0.035); g.fillRect(x - s * 0.06, y + s * 0.2, s * 0.12, s * 0.03);
  g.beginPath(); g.moveTo(x - s * 0.08, y); g.lineTo(x, y - s * 0.07); g.lineTo(x + s * 0.08, y); g.fill();
  g.fillStyle = '#ffdf8a'; g.fillRect(x - s * 0.05, y + s * 0.015, s * 0.1, s * 0.185);
  g.fillStyle = '#fff6d0'; g.fillRect(x - s * 0.015, y + s * 0.06, s * 0.03, s * 0.08);
  g.fillStyle = '#26252b'; g.fillRect(x - L(s, 0.006), y + s * 0.015, L(s, 0.012), s * 0.185);
}
function stones(g, x, y, w, h, S, base, rnd, o){
  o = o || {};
  const rowH = S * (o.row || 0.2);
  g.fillStyle = sh(base, -0.38); g.fillRect(x, y, w, h);
  for(let yy = y; yy < y + h - 0.5; yy += rowH){
    const hh = Math.min(rowH, y + h - yy);
    let xx = x - rnd() * S * 0.3;
    while(xx < x + w){
      const bw = S * ((o.bw || 0.42) * (0.65 + rnd() * 0.7));
      const v = (rnd() - 0.5) * (o.vary || 0.2);
      g.fillStyle = sh(base, v);
      const gap = Math.max(1, S * 0.014);
      const bx = Math.max(x, xx + gap), bx2 = Math.min(x + w, xx + bw - gap);
      if(bx2 > bx){
        g.beginPath(); if(g.roundRect) g.roundRect(bx, yy + gap, bx2 - bx, hh - gap * 2, Math.min(S * 0.03, hh / 3)); else g.rect(bx, yy + gap, bx2 - bx, hh - gap * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(bx + 1, yy + gap, bx2 - bx - 2, Math.max(1, S * 0.012));
        g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(bx + 1, yy + hh - gap - Math.max(1, S * 0.014), bx2 - bx - 2, Math.max(1, S * 0.014));
      }
      xx += bw;
    }
  }
}
function barrel(g, x, by, S, rnd){
  const w = S * 0.3, h = S * 0.38, y = by - h;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + w / 2, by, w * 0.6, S * 0.04, 0, 0, 7); g.fill();
  const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#6b3f1f'); gr.addColorStop(0.4, '#a46a38'); gr.addColorStop(1, '#5a3418');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x + w * 0.08, y); g.quadraticCurveTo(x - w * 0.06, y + h / 2, x + w * 0.08, by); g.lineTo(x + w * 0.92, by); g.quadraticCurveTo(x + w * 1.06, y + h / 2, x + w * 0.92, y); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(30,15,5,.35)'; g.lineWidth = 1; for(let i = 1; i < 4; i++){ g.beginPath(); g.moveTo(x + w * i / 4, y); g.lineTo(x + w * i / 4, by); g.stroke(); }
  g.fillStyle = '#3a3a40'; [0.18, 0.78].forEach(f=> g.fillRect(x - w * 0.02, y + h * f, w * 1.04, Math.max(1.5, h * 0.06)));
  g.fillStyle = '#8a5a30'; g.beginPath(); g.ellipse(x + w / 2, y, w * 0.42, S * 0.035, 0, 0, 7); g.fill();
}
function potPlant(g, x, by, S, rnd, cols){
  const w = S * 0.22;
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x, by, w * 0.7, S * 0.03, 0, 0, 7); g.fill();
  g.fillStyle = '#b8603a'; g.beginPath(); g.moveTo(x - w / 2, by - S * 0.17); g.lineTo(x + w / 2, by - S * 0.17); g.lineTo(x + w * 0.36, by); g.lineTo(x - w * 0.36, by); g.closePath(); g.fill();
  g.fillStyle = '#d07a4e'; g.fillRect(x - w * 0.55, by - S * 0.19, w * 1.1, S * 0.04);
  for(let i = 0; i < 7; i++){ g.fillStyle = ['#3d7a30', '#58993f', '#4a8a36'][i % 3]; g.beginPath(); g.arc(x + (rnd() - 0.5) * w * 1.1, by - S * (0.24 + rnd() * 0.12), S * (0.05 + rnd() * 0.03), 0, 7); g.fill(); }
  if(cols) for(let i = 0; i < 5; i++){ g.fillStyle = cols[i % cols.length]; g.beginPath(); g.arc(x + (rnd() - 0.5) * w * 1.1, by - S * (0.24 + rnd() * 0.14), S * 0.022, 0, 7); g.fill(); }
}
function bench(g, x, by, S){
  const w = S * 0.75;
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, by - S * 0.03, w, S * 0.04);
  g.fillStyle = '#3a3338'; g.fillRect(x + w * 0.06, by - S * 0.18, S * 0.035, S * 0.18); g.fillRect(x + w * 0.88, by - S * 0.18, S * 0.035, S * 0.18);
  g.fillStyle = '#8a5a32'; g.fillRect(x, by - S * 0.2, w, S * 0.05); g.fillStyle = '#a8703e'; g.fillRect(x, by - S * 0.2, w, Math.max(1, S * 0.015));
  g.fillStyle = '#7a4c2a'; g.fillRect(x + w * 0.02, by - S * 0.36, w * 0.96, S * 0.045); g.fillRect(x + w * 0.02, by - S * 0.29, w * 0.96, S * 0.04);
}
function cat(g, x, by, S, col){
  const s = S * 0.2;
  g.fillStyle = col || '#e08a3c';
  g.beginPath(); g.ellipse(x, by - s * 0.45, s * 0.7, s * 0.45, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(x + s * 0.55, by - s * 0.85, s * 0.33, 0, 7); g.fill();
  g.beginPath(); g.moveTo(x + s * 0.32, by - s * 1.05); g.lineTo(x + s * 0.38, by - s * 1.35); g.lineTo(x + s * 0.55, by - s * 1.12); g.fill();
  g.beginPath(); g.moveTo(x + s * 0.62, by - s * 1.12); g.lineTo(x + s * 0.8, by - s * 1.35); g.lineTo(x + s * 0.84, by - s * 1.02); g.fill();
  g.strokeStyle = col || '#e08a3c'; g.lineWidth = s * 0.18; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - s * 0.6, by - s * 0.3); g.quadraticCurveTo(x - s * 1.1, by - s * 0.2, x - s * 0.9, by - s * 0.75); g.stroke(); g.lineCap = 'butt';
  g.fillStyle = 'rgba(120,50,10,.35)'; for(let i = 0; i < 3; i++) g.fillRect(x - s * 0.3 + i * s * 0.25, by - s * 0.85, s * 0.08, s * 0.3);
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 1; g.beginPath(); g.arc(x + s * 0.47, by - s * 0.86, s * 0.07, 0.2, Math.PI - 0.2); g.stroke(); g.beginPath(); g.arc(x + s * 0.68, by - s * 0.86, s * 0.07, 0.2, Math.PI - 0.2); g.stroke();
}
function downpipe(g, x, y0, y1, S){
  g.fillStyle = '#7d8189'; g.fillRect(x, y0, S * 0.055, y1 - y0);
  g.fillStyle = '#c3c8cf'; g.fillRect(x, y0, Math.max(1, S * 0.015), y1 - y0);
  for(let yy = y0 + S * 0.25; yy < y1 - S * 0.1; yy += S * 0.45){ g.fillStyle = '#55585f'; g.fillRect(x - S * 0.012, yy, S * 0.08, S * 0.025); }
  g.fillStyle = '#7d8189'; g.fillRect(x - S * 0.02, y1 - S * 0.06, S * 0.12, S * 0.05);
}
function ivy(g, x, y0, y1, S, rnd){
  const n = Math.round((y1 - y0) / S * 26);
  for(let i = 0; i < n; i++){
    const t = i / n, yy = y1 - t * (y1 - y0), xx = x + Math.sin(t * 11 + rnd()) * S * 0.12 + (rnd() - 0.3) * S * 0.18 * (1 - t * 0.5);
    g.fillStyle = ['#2f5f2a', '#3f7a34', '#4f8f3f', '#2a5226'][i % 4];
    g.beginPath(); g.ellipse(xx, yy, S * 0.05, S * 0.034, rnd() * 3, 0, 7); g.fill();
  }
}

/* ---------- a house ---------- */
const HOUSE_SHUTTER = { red:'#4c7a4a', blue:'#3e6aa3', green:'#7a5232', plum:'#6a4a7a', ochre:'#3f6e7a', tavern:'#4a3a26', records:'#2c6b6e' };
const HOUSE_CURTAIN = { red:'#c9546a', blue:'#e7d08a', green:'#d36a5a', plum:'#e4b8d8', ochre:'#5f8fc7', tavern:'#b4473a', records:'#7a5ad0' };
const HOUSE_STONE = { red:'#b7ab98', blue:'#aeb0b4', green:'#b6ac94', plum:'#b3a9a6', ochre:'#c2b394', tavern:'#a99a84', records:'#b0a9bb' };
const FLOWERS = [['#e8568f', '#ffffff', '#f6d03c'], ['#ff7a5a', '#ffd34a', '#ffffff'], ['#9a6be0', '#ffffff', '#f2a7c3'], ['#e8568f', '#ff9a3c'], ['#f6d03c', '#ffffff', '#5aa0e8']];
function drawHouse(g, b, S){
  const C = CA_HOUSE[b.scheme] || CA_HOUSE.red, sc = b.scheme;
  const rnd = rng((b.x * 73856093) ^ (b.y * 19349663) ^ 0x5bd1e995);
  const W = b.w * S, H = b.h * S, F = (b.front || 2) * S, R = H - F;
  const tavern = sc === 'tavern', records = sc === 'records';
  const flowers = FLOWERS[Math.floor(rnd() * FLOWERS.length)];
  /* the roof */
  roofTiles(g, 0, 0, W, R, S, C.roof, rnd, { shingle:tavern, weather:true, th:tavern ? 0.14 : 0.16, tw:tavern ? 0.19 : 0.22 });
  moss(g, 0, 0, W, R, S, rnd, tavern ? 4 : Math.floor(rnd() * 4));
  ridge(g, 0, 0, W, S, C.roof);
  g.fillStyle = C.beam; g.fillRect(0, 0, S * 0.07, R); g.fillRect(W - S * 0.07, 0, S * 0.07, R);
  g.fillStyle = 'rgba(255,240,220,.22)'; g.fillRect(0, 0, Math.max(1, S * 0.02), R);
  /* a dormer in the roof, on the wider houses */
  if(b.w >= 5){
    const dx = (b.chimney ? 0.36 : 0.5) * W + (rnd() - 0.5) * S * 0.4, dby = R * 0.86;
    dormer(g, dx, dby, S, C, rnd, { lit:tavern || rnd() < 0.4, flowers });
    if(b.w >= 8) dormer(g, W * 0.18, dby, S, C, rnd, { lit:false, flowers });
  }
  eaves(g, 0, R, W, S, C.beam);
  /* the upper storeys: timber over plaster */
  const storeys = (b.front || 2) - 1, pattern = ['x', 'k', 'v', 'h'][Math.floor(rnd() * 4)];
  const winFrame = tavern ? '#3a2616' : rnd() < 0.5 ? '#f3eee4' : sh(C.beam, -0.1);
  const isWin = (c)=> b.w % 2 ? c % 2 === 0 : (c < b.w / 2 ? c % 2 === 0 : (b.w - 1 - c) % 2 === 0);
  for(let s = 0; s < storeys; s++){
    const y0 = R + s * S;
    g.fillStyle = C.wall; g.fillRect(0, y0, W, S);
    speckle(g, 0, y0, W, S, rnd, Math.round(b.w * 22), ['rgba(130,100,60,.07)', 'rgba(255,255,255,.12)'], S * 0.05);
    g.fillStyle = 'rgba(80,60,30,.08)'; g.fillRect(0, y0 + S * 0.8, W, S * 0.2);
    for(let c = 0; c < b.w; c++){
      const bx = c * S;
      if(isWin(c)){
        const ww = S * 0.48, wh = S * 0.5;
        windowA(g, bx + (S - ww) / 2, y0 + S * 0.2, ww, wh, S, { frame:winFrame, shutter:(tavern || rnd() < 0.55) ? HOUSE_SHUTTER[sc] : null, curtain:rnd() < 0.7 ? HOUSE_CURTAIN[sc] : null, lit:(tavern ? 0.9 : rnd() < 0.3 ? 0.7 : 0), box:rnd() < 0.8 ? flowers : null, diamond:tavern, rnd });
      } else {
        g.save(); g.beginPath(); g.rect(bx, y0, S, S); g.clip();
        g.strokeStyle = C.beam; g.lineWidth = S * 0.075; g.lineCap = 'butt';
        const p = pattern, L0 = bx + S * 0.05, R0 = bx + S * 0.95, T0 = y0 + S * 0.08, B0 = y0 + S * 0.88;
        g.beginPath();
        if(p === 'x'){ g.moveTo(L0, T0); g.lineTo(R0, B0); g.moveTo(R0, T0); g.lineTo(L0, B0); }
        else if(p === 'k'){ g.moveTo(L0, B0); g.lineTo(bx + S * 0.5, T0); g.lineTo(R0, B0); }
        else if(p === 'v'){ g.moveTo(L0, T0); g.lineTo(bx + S * 0.5, B0); g.lineTo(R0, T0); }
        else { g.moveTo(L0, y0 + S * 0.48); g.lineTo(R0, y0 + S * 0.48); g.moveTo(L0, B0); g.lineTo(bx + S * 0.3, y0 + S * 0.48); g.moveTo(R0, B0); g.lineTo(bx + S * 0.7, y0 + S * 0.48); }
        g.stroke();
        g.strokeStyle = 'rgba(255,230,200,.16)'; g.lineWidth = Math.max(1, S * 0.012); g.stroke();
        g.restore();
        if(rnd() < 0.18 && !tavern){ g.fillStyle = '#c7b48a'; g.beginPath(); g.arc(bx + S * 0.5, y0 + S * 0.45, S * 0.07, 0, 7); g.fill(); g.fillStyle = '#6b4426'; g.beginPath(); g.arc(bx + S * 0.5, y0 + S * 0.45, S * 0.025, 0, 7); g.fill(); }
      }
    }
    /* posts, the plate along the top, the sill beam along the bottom with its joist ends */
    g.fillStyle = C.beam;
    for(let c = 0; c <= b.w; c++){ const px = c === 0 ? 0 : c === b.w ? W - S * 0.09 : c * S - S * 0.045; g.fillRect(px, y0, S * 0.09, S); }
    g.fillRect(0, y0, W, S * 0.08);
    g.fillRect(0, y0 + S * 0.88, W, S * 0.12);
    g.fillStyle = 'rgba(255,230,200,.14)'; g.fillRect(0, y0 + S * 0.88, W, Math.max(1, S * 0.015));
    grain(g, 0, y0 + S * 0.88, W, S * 0.12, rnd, b.w * 3, 'rgba(0,0,0,.2)');
    for(let c = 0; c <= b.w; c++){ const px = c === 0 ? 0 : c === b.w ? W - S * 0.09 : c * S - S * 0.045; g.fillStyle = 'rgba(255,230,200,.12)'; g.fillRect(px, y0, Math.max(1, S * 0.018), S); }
  }
  /* the ground floor: stone (or plaster over a stone plinth), the door, windows, things by the door */
  const y0 = H - S, stoneBase = HOUSE_STONE[sc] || '#b7ab98';
  const stoneFloor = tavern || records ? true : rnd() < 0.55;
  if(stoneFloor) stones(g, 0, y0, W, S, S, stoneBase, rnd, { row:0.2, bw:0.42 });
  else {
    g.fillStyle = sh(C.wall, -0.04); g.fillRect(0, y0, W, S);
    speckle(g, 0, y0, W, S, rnd, b.w * 18, ['rgba(130,100,60,.07)', 'rgba(255,255,255,.12)'], S * 0.05);
    stones(g, 0, y0 + S * 0.72, W, S * 0.28, S, stoneBase, rnd, { row:0.14, bw:0.36 });
  }
  /* the jetty's shade */
  const jg = g.createLinearGradient(0, y0, 0, y0 + S * 0.22); jg.addColorStop(0, 'rgba(20,10,4,.45)'); jg.addColorStop(1, 'rgba(20,10,4,0)');
  g.fillStyle = jg; g.fillRect(0, y0, W, S * 0.22);
  const doors = (b.door || []).map(dx=> dx - b.x);
  const wideDoor = doors.length >= 2;
  const dc = doors.length ? (doors[0] + (wideDoor ? 1 : 0.5)) * S : -9 * S;
  if(records){
    /* a shop front: an awning over two display windows */
    [[0.15, doors[0] - 0.2], [doors[doors.length - 1] + 1.2, b.w - 0.15]].forEach(([a, z])=>{
      const wx = a * S, ww = (z - a) * S;
      g.fillStyle = '#3a3358'; g.fillRect(wx - S * 0.05, y0 + S * 0.24, ww + S * 0.1, S * 0.62);
      const gl = g.createLinearGradient(wx, y0, wx + ww, y0 + S); gl.addColorStop(0, '#2c2a40'); gl.addColorStop(1, '#4a4470'); g.fillStyle = gl; g.fillRect(wx, y0 + S * 0.28, ww, S * 0.54);
      for(let i = 0; i < Math.floor(ww / (S * 0.42)); i++){
        const rx = wx + S * 0.22 + i * S * 0.42, ryy = y0 + S * (0.5 + (i % 2) * 0.06);
        g.fillStyle = '#141418'; g.beginPath(); g.arc(rx, ryy, S * 0.15, 0, 7); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.beginPath(); g.arc(rx, ryy, S * 0.1, 0, 7); g.stroke();
        g.fillStyle = ['#e8568f', '#f6d03c', '#5ac8d8', '#9a6be0'][i % 4]; g.beginPath(); g.arc(rx, ryy, S * 0.05, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(wx + ww * 0.1, y0 + S * 0.82); g.lineTo(wx + ww * 0.2, y0 + S * 0.82); g.lineTo(wx + ww * 0.45, y0 + S * 0.28); g.lineTo(wx + ww * 0.35, y0 + S * 0.28); g.fill();
    });
    /* the awning: violet and white, scalloped */
    const n = b.w * 3;
    for(let i = 0; i < n; i++){ g.fillStyle = i % 2 ? '#f4eefc' : '#6a4fb0'; g.fillRect(i * W / n, y0 + S * 0.02, W / n + 1, S * 0.18); g.beginPath(); g.arc((i + 0.5) * W / n, y0 + S * 0.2, W / n / 2, 0, Math.PI); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, y0 + S * 0.02, W, S * 0.03);
  }
  for(let c = 0; c < b.w && !records; c++){
    if(doors.includes(c)) continue;
    const nearDoor = doors.some(d=> Math.abs(d - c) === 1);
    if(nearDoor) continue;
    const ww = S * (tavern ? 0.62 : 0.46), wh = S * 0.4;
    windowA(g, c * S + (S - ww) / 2, y0 + S * 0.24, ww, wh, S, { frame:tavern ? '#3a2616' : winFrame, lintel:sh(stoneBase, 0.15), sill:sh(stoneBase, 0.2), curtain:rnd() < 0.6 ? HOUSE_CURTAIN[sc] : null, lit:tavern ? 1 : (rnd() < 0.25 ? 0.6 : 0), box:!tavern && rnd() < 0.5 ? flowers : null, diamond:tavern, rnd });
  }
  if(doors.length){
    const dw = wideDoor ? S * 1.25 : S * 0.6, dh = wideDoor ? S * 0.84 : S * 0.78;
    doorA(g, dc, H, dw, dh, S, { color:C.door, surround:sh(stoneBase, 0.08), wide:wideDoor, fan:wideDoor || rnd() < 0.5, fanLit:tavern || records, rnd, knob:'#e2c062' });
    lantern(g, dc + dw / 2 + S * 0.2, y0 + S * 0.2, S * 0.95, {});
    if(wideDoor) lantern(g, dc - dw / 2 - S * 0.2, y0 + S * 0.2, S * 0.95, { left:true });
    if(!wideDoor){ g.fillStyle = '#2f5da8'; g.beginPath(); g.ellipse(dc - dw / 2 - S * 0.14, y0 + S * 0.36, S * 0.06, S * 0.045, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(dc - dw / 2 - S * 0.16, y0 + S * 0.345, S * 0.04, S * 0.03); }
  }
  /* things by the door */
  const free = [];
  for(let c = 0; c < b.w; c++) if(!doors.includes(c) && doors.some(d=> Math.abs(d - c) === 1)) free.push(c);
  free.forEach((c, i)=>{
    const left = c < doors[0];
    const fx = c * S + (left ? S * 0.12 : S * 0.5);
    if(tavern){
      if(left){ barrel(g, c * S + S * 0.06, H, S, rnd); barrel(g, c * S + S * 0.38, H, S, rnd); barrel(g, c * S + S * 0.22, H - S * 0.36, S, rnd); }
      else { bench(g, c * S + S * 0.15, H - S * 0.02, S); g.fillStyle = '#e7c06a'; g.fillRect(c * S + S * 0.3, H - S * 0.3, S * 0.08, S * 0.1); g.fillStyle = '#fff6e0'; g.fillRect(c * S + S * 0.3, H - S * 0.31, S * 0.08, S * 0.03); }
      return;
    }
    const pick = rnd();
    if(pick < 0.35){ bench(g, c * S + S * 0.12, H - S * 0.02, S); if(rnd() < 0.5) cat(g, c * S + S * 0.45, H - S * 0.22, S, ['#e08a3c', '#3a3a40', '#f2efe8'][Math.floor(rnd() * 3)]); }
    else if(pick < 0.7){ potPlant(g, fx + S * 0.12, H, S, rnd, flowers); potPlant(g, fx + S * 0.36, H, S, rnd, null); }
    else { barrel(g, fx, H, S, rnd); potPlant(g, fx + S * 0.45, H, S, rnd, flowers); }
  });
  /* a downpipe at the far end, ivy now and then */
  const pipeX = doors.length && doors[0] < b.w / 2 ? W - S * 0.16 : S * 0.1;
  downpipe(g, pipeX, R, H, S);
  if(!tavern && !records && rnd() < 0.45) ivy(g, pipeX < W / 2 ? W - S * 0.25 : S * 0.25, R + S * 0.2, H, S, rnd);
}
function dormer(g, cx, by, S, C, rnd, o){
  /* seen from the front and above: a gable with its window, its roof's two slopes running back into the main roof */
  const w = S * 0.84, wallH = S * 0.44, rise = S * 0.3, back = S * 0.3, ov = S * 0.07;
  const eaveY = by - wallH, apexY = eaveY - rise;
  g.fillStyle = 'rgba(25,8,0,.3)';
  g.beginPath(); g.moveTo(cx + w / 2 + ov, by); g.lineTo(cx + w / 2 + S * 0.2, by + S * 0.03); g.lineTo(cx + w / 2 + S * 0.2, eaveY - back * 0.6); g.lineTo(cx + S * 0.12, apexY - back); g.lineTo(cx, apexY - back); g.closePath(); g.fill();
  const slope = (sx, col)=>{
    g.fillStyle = col;
    g.beginPath(); g.moveTo(sx, eaveY + S * 0.03); g.lineTo(cx, apexY); g.lineTo(cx, apexY - back); g.lineTo(sx, eaveY + S * 0.03 - back); g.closePath(); g.fill();
    g.save(); g.clip();
    g.strokeStyle = 'rgba(30,10,0,.3)'; g.lineWidth = Math.max(1, S * 0.012);
    for(let i = 1; i < 4; i++){ const xx = sx + (cx - sx) * i / 4; g.beginPath(); g.moveTo(xx, eaveY + S * 0.05 - (eaveY - apexY) * i / 4); g.lineTo(xx, apexY - back - S * 0.1); g.stroke(); }
    g.restore();
  };
  slope(cx - w / 2 - ov, sh(C.roof, 0.08));
  slope(cx + w / 2 + ov, sh(C.roof, -0.22));
  g.strokeStyle = sh(C.roof, -0.4); g.lineWidth = S * 0.05; g.beginPath(); g.moveTo(cx, apexY); g.lineTo(cx, apexY - back); g.stroke();
  /* the gable */
  g.fillStyle = C.wall;
  g.beginPath(); g.moveTo(cx - w / 2, by); g.lineTo(cx - w / 2, eaveY); g.lineTo(cx, apexY + S * 0.03); g.lineTo(cx + w / 2, eaveY); g.lineTo(cx + w / 2, by); g.closePath(); g.fill();
  g.fillStyle = C.beam; g.fillRect(cx - w / 2, eaveY - S * 0.02, w, S * 0.05); g.fillRect(cx - S * 0.025, apexY + S * 0.05, S * 0.05, eaveY - apexY - S * 0.05);
  g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(cx + w * 0.32, eaveY, w * 0.18, wallH);
  windowA(g, cx - S * 0.19, eaveY + S * 0.08, S * 0.38, S * 0.24, S, { frame:'#f3eee4', curtain:'#e7d08a', lit:o.lit ? 0.85 : 0, box:o.flowers, rnd });
  /* bargeboards, a little gold ball on top, the lead where it meets the roof */
  g.strokeStyle = C.beam; g.lineWidth = S * 0.055; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx - w / 2 - ov, eaveY + S * 0.03); g.lineTo(cx, apexY); g.lineTo(cx + w / 2 + ov, eaveY + S * 0.03); g.stroke(); g.lineCap = 'butt';
  g.strokeStyle = 'rgba(255,235,210,.25)'; g.lineWidth = Math.max(1, S * 0.012); g.beginPath(); g.moveTo(cx - w / 2 - ov, eaveY + S * 0.01); g.lineTo(cx, apexY - S * 0.02); g.stroke();
  g.fillStyle = GOLD; g.beginPath(); g.arc(cx, apexY - S * 0.02, S * 0.035, 0, 7); g.fill();
  g.fillStyle = '#8a8f98'; g.fillRect(cx - w / 2 - ov, by - S * 0.02, w + ov * 2, S * 0.04);
}

/* ---------- the palace hall, 28 by 12 ---------- */
function drawPalace(g, S){
  const W = 28 * S, rnd = rng(1337), slate = '#3d5a8f', white = '#f6f2ea', stone = '#efe7d8';
  /* roof: fish-scale slate, a gold ridge, round dormers */
  roofTiles(g, 0, 0, W, 6 * S, S, slate, rnd, { th:0.16, tw:0.22, fish:true, weather:false });
  const rl = g.createLinearGradient(0, 0, 0, 6 * S); rl.addColorStop(0, 'rgba(200,220,255,.16)'); rl.addColorStop(1, 'rgba(10,20,50,.22)');
  g.fillStyle = rl; g.fillRect(0, 0, W, 6 * S);
  g.fillStyle = GOLD_D; g.fillRect(0, 0, W, S * 0.26);
  const rg = g.createLinearGradient(0, 0, 0, S * 0.22); rg.addColorStop(0, GOLD_L); rg.addColorStop(1, GOLD);
  g.fillStyle = rg; g.fillRect(0, 0, W, S * 0.2);
  for(let x = S * 0.5; x < W; x += S){ g.fillStyle = GOLD_D; g.beginPath(); g.moveTo(x, S * 0.02); g.quadraticCurveTo(x + S * 0.12, S * 0.1, x, S * 0.18); g.quadraticCurveTo(x - S * 0.12, S * 0.1, x, S * 0.02); g.fill(); g.fillStyle = GOLD_L; g.beginPath(); g.arc(x, S * 0.1, S * 0.03, 0, 7); g.fill(); }
  [3.5, 7.5, 20.5, 24.5].forEach(c=> oculus(g, c * S, 3.5 * S, S));
  /* the eaves */
  g.fillStyle = 'rgba(10,15,40,.5)'; g.fillRect(0, 5.88 * S, W, 0.12 * S);
  /* the cornice and its gold frieze */
  const cy = 6 * S;
  g.fillStyle = white; g.fillRect(0, cy, W, S);
  g.fillStyle = '#ffffff'; g.fillRect(0, cy, W, S * 0.06);
  g.fillStyle = '#e9e2d4'; g.fillRect(0, cy + S * 0.22, W, S * 0.06);
  const cs = g.createLinearGradient(0, cy + S * 0.28, 0, cy + S * 0.42); cs.addColorStop(0, 'rgba(60,45,30,.35)'); cs.addColorStop(1, 'rgba(60,45,30,0)');
  g.fillStyle = cs; g.fillRect(0, cy + S * 0.28, W, S * 0.14);
  for(let x = 0; x < W; x += S * 0.16){ g.fillStyle = '#dcd3c2'; g.fillRect(x, cy + S * 0.3, S * 0.09, S * 0.12); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x, cy + S * 0.3, S * 0.09, Math.max(1, S * 0.012)); }
  const fz = g.createLinearGradient(0, cy + S * 0.48, 0, cy + S * 0.74); fz.addColorStop(0, GOLD_L); fz.addColorStop(0.5, GOLD); fz.addColorStop(1, GOLD_D);
  g.fillStyle = fz; g.fillRect(0, cy + S * 0.48, W, S * 0.26);
  for(let x = S * 0.25; x < W; x += S * 0.5){
    g.fillStyle = 'rgba(120,85,20,.45)'; g.beginPath(); g.ellipse(x, cy + S * 0.61, S * 0.13, S * 0.05, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,240,180,.5)'; g.beginPath(); g.ellipse(x - S * 0.03, cy + S * 0.595, S * 0.06, S * 0.02, 0, 0, 7); g.fill();
  }
  for(let j = 0; j < 9; j++){ const x = (3 * j + 2) * S; if(j === 4) continue; star(g, x, cy + S * 0.61, S * 0.11, '#2f4f9a', GOLD_L); }
  g.fillStyle = white; g.fillRect(0, cy + S * 0.76, W, S * 0.24);
  g.fillStyle = 'rgba(150,130,100,.35)'; g.fillRect(0, cy + S * 0.86, W, Math.max(1, S * 0.014));
  /* the walls: ashlar */
  const wy = 7 * S, wb = 11 * S;
  g.fillStyle = sh(stone, -0.18); g.fillRect(0, wy, W, wb - wy);
  for(let r = 0; r < 8; r++){
    const yy = wy + r * S * 0.5;
    for(let c = -1; c < 30; c++){
      const bx = c * S + (r % 2) * S * 0.5;
      g.fillStyle = sh(stone, (rnd() - 0.6) * 0.07); g.fillRect(bx + 1, yy + 1, S - 2, S * 0.5 - 2);
      g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(bx + 1, yy + 1, S - 2, 1);
    }
  }
  const ws = g.createLinearGradient(0, wy, 0, wy + S * 0.4); ws.addColorStop(0, 'rgba(60,45,30,.3)'); ws.addColorStop(1, 'rgba(60,45,30,0)');
  g.fillStyle = ws; g.fillRect(0, wy, W, S * 0.4);
  /* the string course between the storeys */
  const scY = 8.86 * S;
  g.fillStyle = white; g.fillRect(0, scY, W, S * 0.14); g.fillStyle = '#ffffff'; g.fillRect(0, scY, W, Math.max(1, S * 0.03)); g.fillStyle = GOLD; g.fillRect(0, scY + S * 0.1, W, Math.max(1, S * 0.025)); g.fillStyle = 'rgba(60,45,30,.25)'; g.fillRect(0, scY + S * 0.14, W, S * 0.05);
  /* windows: arched above, pedimented below; the centre bay is the King's balcony */
  for(let j = 0; j < 9; j++){
    const cx = (3 * j + 2) * S;
    if(j === 4) continue;
    const lit = (j + 1) % 3 === 0;
    /* upper */
    const uw = S * 0.82, uh = S * 1.22, uy = 7.42 * S;
    surround(g, cx - uw / 2, uy, uw, uh, S, true);
    windowA(g, cx - uw / 2, uy, uw, uh, S, { frame:GOLD, arch:true, lit:lit ? 0.9 : 0, curtain:'#a3263b', curtainTop:GOLD, sill:white, rnd });
    keystone(g, cx, uy - S * 0.1, S);
    balconette(g, cx, uy + uh - S * 0.02, S * 1.05, S * 0.26, S);
    /* lower */
    const lw2 = S * 0.84, lh = S * 1.18, ly = 9.48 * S;
    pediment(g, cx, ly - S * 0.08, S * 1.2, S * 0.32, S);
    surround(g, cx - lw2 / 2, ly, lw2, lh, S, false);
    windowA(g, cx - lw2 / 2, ly, lw2, lh, S, { frame:GOLD, lit:(j % 3 === 1) ? 0.85 : 0, curtain:'#a3263b', curtainTop:GOLD, sill:white, rnd });
  }
  /* pilasters with gold capitals */
  for(let j = 0; j < 10; j++){
    const px = (3 * j + 0.5) * S, pw = S * 0.56;
    g.fillStyle = '#fbf8f2'; g.fillRect(px - pw / 2, wy + S * 0.18, pw, wb - wy - S * 0.18);
    g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(px + pw * 0.3, wy + S * 0.18, pw * 0.2, wb - wy - S * 0.18);
    for(let f = 0; f < 4; f++){ const fx = px - pw * 0.3 + f * pw * 0.2; g.fillStyle = 'rgba(120,100,70,.18)'; g.fillRect(fx, wy + S * 0.45, Math.max(1, S * 0.03), wb - wy - S * 0.85); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(fx + Math.max(1, S * 0.03), wy + S * 0.45, Math.max(1, S * 0.015), wb - wy - S * 0.85); }
    /* the capital: gold, with its volutes */
    const cg = g.createLinearGradient(0, wy, 0, wy + S * 0.3); cg.addColorStop(0, GOLD_L); cg.addColorStop(1, GOLD_D);
    g.fillStyle = cg; g.fillRect(px - pw * 0.62, wy, pw * 1.24, S * 0.12); g.fillRect(px - pw * 0.5, wy + S * 0.12, pw, S * 0.14);
    g.fillStyle = GOLD_D; [-1, 1].forEach(s=>{ g.beginPath(); g.arc(px + s * pw * 0.45, wy + S * 0.2, S * 0.07, 0, 7); g.fill(); g.fillStyle = GOLD_L; g.beginPath(); g.arc(px + s * pw * 0.45, wy + S * 0.2, S * 0.03, 0, 7); g.fill(); g.fillStyle = GOLD_D; });
    /* its base */
    g.fillStyle = '#e8dfcf'; g.fillRect(px - pw * 0.62, wb - S * 0.2, pw * 1.24, S * 0.2); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(px - pw * 0.62, wb - S * 0.2, pw * 1.24, Math.max(1, S * 0.02));
  }
  /* the King's balcony over the door */
  const kx = 14 * S;
  const kw = S * 1.18, kh = S * 2.0, ky = 7.55 * S;
  surround(g, kx - kw / 2, ky, kw, kh, S, true);
  windowA(g, kx - kw / 2, ky, kw, kh, S, { frame:GOLD, arch:true, lit:1, curtain:'#a3263b', curtainTop:GOLD, sill:white, rnd });
  crest(g, kx, 7.12 * S, S);
  const bY = 9.62 * S;
  g.fillStyle = 'rgba(40,30,20,.3)'; g.fillRect(kx - S * 1.05, bY + S * 0.14, S * 2.1, S * 0.12);
  g.fillStyle = white; g.fillRect(kx - S * 1.1, bY, S * 2.2, S * 0.14); g.fillStyle = '#ffffff'; g.fillRect(kx - S * 1.1, bY, S * 2.2, Math.max(1, S * 0.03));
  [-0.75, 0, 0.75].forEach(f=>{ g.fillStyle = '#e8dfcf'; g.beginPath(); g.moveTo(kx + f * S - S * 0.1, bY + S * 0.14); g.lineTo(kx + f * S + S * 0.1, bY + S * 0.14); g.lineTo(kx + f * S + S * 0.04, bY + S * 0.38); g.lineTo(kx + f * S - S * 0.04, bY + S * 0.38); g.closePath(); g.fill(); g.fillStyle = GOLD; g.fillRect(kx + f * S - S * 0.1, bY + S * 0.14, S * 0.2, Math.max(1, S * 0.03)); });
  balconette(g, kx, bY, S * 2.1, S * 0.4, S);
  /* the base: rusticated, small barred windows */
  const by = 11 * S;
  g.fillStyle = sh('#e3d8c4', -0.3); g.fillRect(0, by, W, S);
  for(let r = 0; r < 3; r++) for(let c = -1; c < 44; c++){
    const bw = S * 0.66, bx = c * bw + (r % 2) * bw * 0.5, yy = by + r * S * 0.31;
    g.fillStyle = sh('#e3d8c4', (rnd() - 0.5) * 0.08); g.fillRect(bx + S * 0.025, yy + S * 0.025, bw - S * 0.05, S * 0.31 - S * 0.05);
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(bx + S * 0.025, yy + S * 0.025, bw - S * 0.05, Math.max(1, S * 0.015));
    g.fillStyle = 'rgba(80,60,40,.22)'; g.fillRect(bx + S * 0.025, yy + S * 0.25, bw - S * 0.05, Math.max(1, S * 0.03));
  }
  g.fillStyle = sh('#e3d8c4', -0.22); g.fillRect(0, by + S * 0.93, W, S * 0.07);
  g.fillStyle = GOLD; g.fillRect(0, by, W, Math.max(1, S * 0.03));
  for(let j = 0; j < 9; j++){
    if(j === 4) continue;
    const cx = (3 * j + 2) * S, ww = S * 0.5, wh = S * 0.34, wy2 = by + S * 0.28;
    g.fillStyle = '#cfc4ae'; g.fillRect(cx - ww / 2 - S * 0.06, wy2 - S * 0.06, ww + S * 0.12, wh + S * 0.12);
    g.fillStyle = '#2a2f3d'; g.fillRect(cx - ww / 2, wy2, ww, wh);
    g.fillStyle = 'rgba(255,220,140,.25)'; g.fillRect(cx - ww / 2, wy2 + wh * 0.5, ww, wh * 0.5);
    g.fillStyle = '#4a4a52'; for(let k = 1; k < 5; k++) g.fillRect(cx - ww / 2 + ww * k / 5 - 1, wy2, Math.max(1.5, S * 0.02), wh);
  }
  /* the grand door */
  const dw = S * 1.7, dh = S * 1.72;
  doorA(g, kx, 12 * S, dw, dh, S, { color:'#7e2c2a', surround:'#f3ece0', key:GOLD, wide:true, fan:true, fanLit:true, fanBars:GOLD, hinge:GOLD, knob:GOLD_L, step:'#efe9dc', rnd });
  /* gold panels on the leaves */
  g.strokeStyle = GOLD; g.lineWidth = L(S, 0.018);
  [[-1], [1]].forEach(([s])=>{ const x0 = kx + (s < 0 ? -dw / 2 + S * 0.14 : S * 0.08), pw = dw / 2 - S * 0.22; g.strokeRect(x0, 12 * S - dh + dw / 2 + S * 0.12, pw, S * 0.38); g.strokeRect(x0, 12 * S - S * 0.5, pw, S * 0.36); });
  lantern(g, kx - S * 1.32, 10.42 * S, S * 1.2, { left:true }); lantern(g, kx + S * 1.32, 10.42 * S, S * 1.2, {});
  /* bay trees in blue-and-white pots */
  [kx - S * 1.6, kx + S * 1.6].forEach(px=>{
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(px, 12 * S - S * 0.02, S * 0.2, S * 0.04, 0, 0, 7); g.fill();
    g.fillStyle = '#f4f2ee'; g.beginPath(); g.moveTo(px - S * 0.16, 12 * S - S * 0.28); g.lineTo(px + S * 0.16, 12 * S - S * 0.28); g.lineTo(px + S * 0.12, 12 * S - S * 0.02); g.lineTo(px - S * 0.12, 12 * S - S * 0.02); g.closePath(); g.fill();
    g.fillStyle = '#2f5da8'; g.fillRect(px - S * 0.15, 12 * S - S * 0.2, S * 0.3, S * 0.05); g.fillRect(px - S * 0.13, 12 * S - S * 0.1, S * 0.26, S * 0.03);
    g.fillStyle = '#6b4426'; g.fillRect(px - S * 0.02, 12 * S - S * 0.5, S * 0.04, S * 0.22);
    g.fillStyle = '#2f6b2e'; g.beginPath(); g.arc(px, 12 * S - S * 0.62, S * 0.2, 0, 7); g.fill();
    g.fillStyle = '#4f9447'; g.beginPath(); g.arc(px - S * 0.06, 12 * S - S * 0.68, S * 0.1, 0, 7); g.fill();
  });
}
function star(g, x, y, r, fill, stroke){
  g.fillStyle = fill; g.beginPath(); g.arc(x, y, r * 1.15, 0, 7); g.fill();
  g.fillStyle = stroke; g.beginPath();
  for(let i = 0; i < 10; i++){ const rr = i % 2 ? r * 0.42 : r, a = i / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}
function oculus(g, cx, cy, S){
  g.fillStyle = 'rgba(10,15,40,.4)'; g.beginPath(); g.ellipse(cx + S * 0.06, cy + S * 0.48, S * 0.5, S * 0.1, 0, 0, 7); g.fill();
  g.fillStyle = '#e9e2d4'; g.fillRect(cx - S * 0.42, cy, S * 0.84, S * 0.48);
  g.fillStyle = '#f8f4ec'; g.beginPath(); g.arc(cx, cy, S * 0.44, 0, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.arc(cx, cy, S * 0.44, -0.6, 1.2); g.lineTo(cx, cy); g.fill();
  g.fillStyle = GOLD; g.beginPath(); g.arc(cx, cy, S * 0.33, 0, 7); g.fill();
  const gl = g.createRadialGradient(cx - S * 0.08, cy - S * 0.08, 0, cx, cy, S * 0.28); gl.addColorStop(0, '#e2f2fb'); gl.addColorStop(1, '#4f80b8');
  g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, S * 0.27, 0, 7); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = L(S, 0.03); g.beginPath(); g.moveTo(cx - S * 0.27, cy); g.lineTo(cx + S * 0.27, cy); g.moveTo(cx, cy - S * 0.27); g.lineTo(cx, cy + S * 0.27); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(cx - S * 0.1, cy - S * 0.1, S * 0.06, 0, 7); g.fill();
  /* its hood */
  g.fillStyle = '#34507f'; g.beginPath(); g.arc(cx, cy, S * 0.52, Math.PI, 0); g.lineTo(cx + S * 0.44, cy); g.arc(cx, cy, S * 0.44, 0, Math.PI, true); g.closePath(); g.fill();
  g.fillStyle = GOLD; g.beginPath(); g.arc(cx, cy - S * 0.56, S * 0.05, 0, 7); g.fill();
}
function surround(g, x, y, w, h, S, arch){
  const p = S * 0.11;
  g.fillStyle = '#fbf8f1'; archPath(g, x - p, y - p, w + p * 2, h + p * 1.2, arch); g.fill();
  g.fillStyle = 'rgba(120,100,70,.18)'; archPath(g, x - p * 0.45, y - p * 0.45, w + p * 0.9, h + p * 0.6, arch); g.fill();
  g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x + w + p * 0.5, y + (arch ? w / 2 : 0), p * 0.5, h - (arch ? w / 2 : 0));
}
function keystone(g, cx, y, S){
  const cg = g.createLinearGradient(0, y, 0, y + S * 0.26); cg.addColorStop(0, GOLD_L); cg.addColorStop(1, GOLD_D);
  g.fillStyle = cg; g.beginPath(); g.moveTo(cx - S * 0.1, y); g.lineTo(cx + S * 0.1, y); g.lineTo(cx + S * 0.065, y + S * 0.24); g.lineTo(cx - S * 0.065, y + S * 0.24); g.closePath(); g.fill();
}
function pediment(g, cx, by, w, h, S){
  g.fillStyle = 'rgba(60,45,30,.25)'; g.beginPath(); g.moveTo(cx - w / 2, by + S * 0.04); g.lineTo(cx, by - h + S * 0.04); g.lineTo(cx + w / 2, by + S * 0.04); g.closePath(); g.fill();
  g.fillStyle = '#fbf8f1'; g.beginPath(); g.moveTo(cx - w / 2, by); g.lineTo(cx, by - h); g.lineTo(cx + w / 2, by); g.closePath(); g.fill();
  g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx - w / 2, by); g.lineTo(cx, by - h); g.lineTo(cx + w / 2, by); g.lineTo(cx + w / 2 - S * 0.06, by); g.lineTo(cx, by - h + S * 0.06); g.lineTo(cx - w / 2 + S * 0.06, by); g.closePath(); g.fill();
  g.fillRect(cx - w / 2, by - S * 0.02, w, S * 0.05);
  g.fillStyle = '#2f4f9a'; g.beginPath(); g.arc(cx, by - h * 0.38, S * 0.05, 0, 7); g.fill();
}
function balconette(g, cx, y, w, h, S){
  const x = cx - w / 2;
  g.fillStyle = GOLD_D; g.fillRect(x, y - h, w, Math.max(2, S * 0.035));
  g.fillStyle = GOLD; g.fillRect(x, y - Math.max(2, S * 0.035), w, Math.max(2, S * 0.035));
  const n = Math.max(4, Math.round(w / (S * 0.11)));
  for(let i = 0; i <= n; i++){
    const bx = x + i * w / n;
    g.fillStyle = GOLD; g.fillRect(bx - S * 0.012, y - h, S * 0.024, h);
    g.beginPath(); g.ellipse(bx, y - h * 0.5, S * 0.03, h * 0.16, 0, 0, 7); g.fill();
  }
  g.fillStyle = GOLD_L; g.fillRect(x, y - h, w, Math.max(1, S * 0.012));
}
function crest(g, cx, cy, S){
  const w = S * 0.56, h = S * 0.62;
  g.fillStyle = 'rgba(60,40,10,.3)'; g.beginPath(); g.moveTo(cx - w / 2 + 2, cy + 2); g.lineTo(cx + w / 2 + 2, cy + 2); g.lineTo(cx + w / 2 + 2, cy + h * 0.45); g.quadraticCurveTo(cx + 2, cy + h + 2, cx + 2, cy + h + 2); g.quadraticCurveTo(cx - w / 2 + 2, cy + h * 0.8, cx - w / 2 + 2, cy + h * 0.45); g.fill();
  g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx - w / 2, cy); g.lineTo(cx + w / 2, cy); g.lineTo(cx + w / 2, cy + h * 0.45); g.quadraticCurveTo(cx + w / 2, cy + h * 0.8, cx, cy + h); g.quadraticCurveTo(cx - w / 2, cy + h * 0.8, cx - w / 2, cy + h * 0.45); g.closePath(); g.fill();
  g.fillStyle = '#2f4f9a'; g.beginPath(); g.moveTo(cx - w * 0.4, cy + h * 0.08); g.lineTo(cx + w * 0.4, cy + h * 0.08); g.lineTo(cx + w * 0.4, cy + h * 0.45); g.quadraticCurveTo(cx + w * 0.4, cy + h * 0.74, cx, cy + h * 0.9); g.quadraticCurveTo(cx - w * 0.4, cy + h * 0.74, cx - w * 0.4, cy + h * 0.45); g.closePath(); g.fill();
  star(g, cx, cy + h * 0.42, S * 0.13, 'rgba(0,0,0,0)', GOLD_L);
  /* the crown over it */
  const ky = cy - S * 0.04;
  g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx - w * 0.42, ky); g.lineTo(cx - w * 0.46, ky - S * 0.2); g.lineTo(cx - w * 0.22, ky - S * 0.1); g.lineTo(cx, ky - S * 0.26); g.lineTo(cx + w * 0.22, ky - S * 0.1); g.lineTo(cx + w * 0.46, ky - S * 0.2); g.lineTo(cx + w * 0.42, ky); g.closePath(); g.fill();
  g.fillStyle = '#c8343a'; [[-0.46, -0.2], [0, -0.26], [0.46, -0.2]].forEach(([a, b])=>{ g.beginPath(); g.arc(cx + w * a, ky + S * b, S * 0.035, 0, 7); g.fill(); });
}


/* ---------- towers: round, coursed, with a scaled cone (or battlements) ----------
   The body is drawn once a size (towerPic) and its pennant over it each frame (towerFlag). */
function towerGeo(d, x, y, w, h, k){
  const corner = d.kind === 'cornerTower', keep = d.kind === 'keep';
  const cx = x + w / 2, bw = w * (keep ? 0.62 : 0.86), top = y + h * (corner ? 0.14 : keep ? 0.34 : 0.3), bot = y + h * 0.98;
  const rw = bw * (keep ? 1.3 : 1.22), apexY = y + (keep ? 0 : h * 0.02) + k * 0.6;
  return { corner, keep, cx, bw, top, bot, rw, apexY };
}
function towerBody(g, d, x, y, w, h, k){
  const { corner, keep, cx, bw, top, bot, rw, apexY } = towerGeo(d, x, y, w, h, k);
  const stone = corner ? '#a8a3bc' : '#f4efe4', dark = corner ? '#6f6a86' : '#cbc1ae';
  const rnd = rng(Math.round(d.x * 100 + d.y * 7));
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(cx + k * 0.15, bot, bw * 0.6, k * 0.32, 0, 0, 7); g.fill();
  /* the body, lit from the left */
  const gr = g.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
  gr.addColorStop(0, sh(stone, -0.06)); gr.addColorStop(0.2, sh(stone, 0.22)); gr.addColorStop(0.5, stone); gr.addColorStop(0.82, dark); gr.addColorStop(1, sh(dark, -0.18));
  g.fillStyle = gr; g.beginPath(); g.moveTo(cx - bw / 2, top); g.lineTo(cx + bw / 2, top); g.lineTo(cx + bw / 2, bot); g.ellipse(cx, bot, bw / 2, k * 0.24, 0, 0, Math.PI); g.closePath(); g.fill();
  /* courses that curve round it, joints that crowd at its edges */
  const course = k * 0.42;
  g.lineWidth = Math.max(1, k * 0.022);
  for(let yy = top + course, r = 0; yy < bot; yy += course, r++){
    g.strokeStyle = corner ? 'rgba(40,36,60,.32)' : 'rgba(140,120,90,.3)';
    g.beginPath(); g.ellipse(cx, yy, bw / 2, k * 0.07, 0, 0.05, Math.PI - 0.05); g.stroke();
    for(let j = 0; j < 6; j++){
      const a = (j + (r % 2) * 0.5 + 0.25) / 6 * Math.PI, jx = cx - Math.cos(a) * bw / 2;
      g.beginPath(); g.moveTo(jx, yy - course + k * 0.07 * Math.sin(a)); g.lineTo(jx, yy + k * 0.07 * Math.sin(a)); g.stroke();
      if(rnd() < 0.25){ g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.1)' : 'rgba(60,50,40,.07)'; g.fillRect(jx, yy - course + 2, Math.abs(Math.cos(a)) * bw * 0.12 + k * 0.1, course - 2); }
    }
  }
  /* a plinth at its foot */
  g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(cx - bw / 2, bot - k * 0.5, bw, k * 0.5);
  g.fillStyle = corner ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.35)'; g.fillRect(cx - bw / 2, bot - k * 0.52, bw, Math.max(1, k * 0.03));
  /* windows: arched with gold, or arrow slits */
  const rows = keep ? 4 : corner ? 2 : 3;
  for(let r = 0; r < rows; r++){
    const wy = top + (bot - top) * (0.14 + r * (0.68 / rows));
    const cols = keep ? 3 : 1;
    for(let c = 0; c < cols; c++){
      const wx = cx + (c - (cols - 1) / 2) * bw * 0.28;
      if(corner || (!keep && r === rows - 1)){
        g.fillStyle = corner ? '#2e2a3a' : '#2f2b36';
        g.beginPath(); if(g.roundRect) g.roundRect(wx - k * 0.06, wy, k * 0.12, k * 0.55, k * 0.06); else g.rect(wx - k * 0.06, wy, k * 0.12, k * 0.55); g.fill();
        g.fillRect(wx - k * 0.16, wy + k * 0.22, k * 0.32, k * 0.08);
        g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(wx - k * 0.1, wy - k * 0.04, k * 0.2, Math.max(1, k * 0.03));
        continue;
      }
      const ww = k * 0.34, wh = k * 0.6;
      const lit = keep ? (r === 1 && c === 1) || (r === 2 && c === 0) : r === 1;
      g.fillStyle = '#fbf8f1'; archPath(g, wx - ww / 2 - k * 0.07, wy - k * 0.07, ww + k * 0.14, wh + k * 0.1, true); g.fill();
      windowA(g, wx - ww / 2, wy, ww, wh, k, { frame:GOLD, arch:true, lit:lit ? 1 : 0, sill:'#fbf8f1' });
    }
  }
  if(keep){
    /* a balcony round it, gold */
    const by = top + (bot - top) * 0.44;
    g.fillStyle = 'rgba(40,30,20,.3)'; g.beginPath(); g.ellipse(cx, by + k * 0.18, bw * 0.62, k * 0.14, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#efe7d6'; g.beginPath(); g.ellipse(cx, by + k * 0.08, bw * 0.64, k * 0.12, 0, 0, Math.PI); g.lineTo(cx - bw * 0.64, by); g.fill();
    g.fillStyle = GOLD; g.fillRect(cx - bw * 0.64, by - k * 0.02, bw * 1.28, k * 0.06);
    for(let i = 0; i <= 14; i++){ const a = i / 14 * Math.PI, bx = cx - Math.cos(a) * bw * 0.64; g.fillStyle = GOLD; g.fillRect(bx - k * 0.02, by - k * 0.34, k * 0.04, k * 0.34); g.beginPath(); g.ellipse(bx, by - k * 0.17, k * 0.035, k * 0.06, 0, 0, 7); g.fill(); }
    g.fillStyle = GOLD_L; g.fillRect(cx - bw * 0.64, by - k * 0.38, bw * 1.28, k * 0.06);
  }
  if(corner){
    /* battlements, each merlon lit on its left; the pennant's pole */
    const cy = top;
    g.fillStyle = sh(dark, -0.1); g.fillRect(cx - bw * 0.56, cy - k * 0.1, bw * 1.12, k * 0.55);
    for(let i = 0; i < 7; i++){
      if(i % 2) continue;
      const mx = cx - bw * 0.56 + i * bw * 0.16;
      g.fillStyle = sh(stone, 0.05); g.fillRect(mx, cy - k * 0.6, bw * 0.16, k * 0.55);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(mx, cy - k * 0.6, bw * 0.16, Math.max(1, k * 0.05));
      g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(mx + bw * 0.12, cy - k * 0.6, bw * 0.04, k * 0.55);
    }
    g.fillStyle = 'rgba(0,0,0,.2)'; for(let i = 0; i < 9; i++) g.fillRect(cx - bw * 0.52 + i * bw * 0.13, cy + k * 0.42, k * 0.08, k * 0.14);
    g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1, k * 0.05); g.beginPath(); g.moveTo(cx, cy - k * 0.5); g.lineTo(cx, cy - k * 2.1); g.stroke();
    return;
  }
  /* corbels under the roof */
  for(let i = 0; i < 9; i++){ const a = (i + 0.5) / 9 * Math.PI, ex = cx - Math.cos(a) * bw * 0.5; g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ex - k * 0.05, top + k * 0.02, k * 0.1, k * 0.2); g.fillStyle = sh(stone, 0.05); g.fillRect(ex - k * 0.05, top, k * 0.1, k * 0.16); }
  /* the cone: blue fish-scale slates, a gold band with its fringe, a gold finial */
  const ry = top;
  const conePath = ()=>{ g.beginPath(); g.moveTo(cx - rw / 2, ry); g.quadraticCurveTo(cx - rw * 0.12, ry - (ry - apexY) * 0.45, cx, apexY); g.quadraticCurveTo(cx + rw * 0.12, ry - (ry - apexY) * 0.45, cx + rw / 2, ry); g.closePath(); };
  g.save(); conePath(); g.clip();
  const cg = g.createLinearGradient(cx - rw / 2, 0, cx + rw / 2, 0);
  cg.addColorStop(0, '#3e5a96'); cg.addColorStop(0.25, '#6c8cd0'); cg.addColorStop(0.55, '#4462a8'); cg.addColorStop(1, '#1f3264');
  g.fillStyle = cg; g.fillRect(cx - rw / 2, apexY, rw, ry - apexY);
  const rowsN = Math.max(6, Math.round((ry - apexY) / (k * 0.2)));
  for(let r = 0; r < rowsN; r++){
    const yy = ry - (r + 1) * (ry - apexY) / rowsN, f = (yy - apexY) / (ry - apexY);
    const half = rw / 2 * Math.min(1, f * 1.15), n = 10, sw = half * 2 / n;
    g.strokeStyle = 'rgba(10,20,50,.38)'; g.lineWidth = Math.max(1, k * 0.018);
    for(let i = 0; i < n + 1; i++){ const sx = cx - half + (i + (r % 2) * 0.5) * sw; g.beginPath(); g.arc(sx, yy, sw / 2, 0.15, Math.PI - 0.15); g.stroke(); }
  }
  const hl = g.createLinearGradient(0, apexY, 0, ry); hl.addColorStop(0, 'rgba(255,255,255,.12)'); hl.addColorStop(1, 'rgba(0,0,0,.12)');
  g.fillStyle = hl; g.fillRect(cx - rw / 2, apexY, rw, ry - apexY);
  g.restore();
  /* a lucarne on the keep's cone */
  if(keep){
    const lx = cx, ly = ry - (ry - apexY) * 0.36, lw2 = k * 0.6;
    g.fillStyle = '#fbf8f1'; g.fillRect(lx - lw2 / 2, ly - k * 0.1, lw2, k * 0.62);
    windowA(g, lx - k * 0.18, ly, k * 0.36, k * 0.42, k, { frame:GOLD, arch:true, lit:1, sill:'#fbf8f1' });
    g.fillStyle = '#34507f'; g.beginPath(); g.moveTo(lx - lw2 * 0.65, ly); g.lineTo(lx, ly - k * 0.42); g.lineTo(lx + lw2 * 0.65, ly); g.closePath(); g.fill();
    g.strokeStyle = GOLD; g.lineWidth = Math.max(1, k * 0.04); g.beginPath(); g.moveTo(lx - lw2 * 0.65, ly); g.lineTo(lx, ly - k * 0.42); g.lineTo(lx + lw2 * 0.65, ly); g.stroke();
  }
  const bandG = g.createLinearGradient(0, ry - k * 0.1, 0, ry + k * 0.1); bandG.addColorStop(0, GOLD_L); bandG.addColorStop(1, GOLD_D);
  g.fillStyle = bandG; g.fillRect(cx - rw / 2, ry - k * 0.09, rw, k * 0.17);
  g.fillStyle = GOLD; for(let i = 0; i < 12; i++){ g.beginPath(); g.arc(cx - rw / 2 + (i + 0.5) * rw / 12, ry + k * 0.08, rw / 24, 0, Math.PI); g.fill(); }
  g.fillStyle = GOLD; g.fillRect(cx - k * 0.03, apexY - k * 0.8, k * 0.06, k * 0.85);
  g.beginPath(); g.arc(cx, apexY - k * 0.05, k * 0.13, 0, 7); g.fill();
  g.fillStyle = GOLD_L; g.beginPath(); g.arc(cx - k * 0.04, apexY - k * 0.09, k * 0.05, 0, 7); g.fill();
  g.fillStyle = GOLD; g.beginPath(); g.arc(cx, apexY - k * 0.45, k * 0.06, 0, 7); g.fill();
}
/* its pennant, in the wind */
function towerFlag(g, d, x, y, w, h, k, t){
  const { corner, keep, cx, top, apexY } = towerGeo(d, x, y, w, h, k);
  if(corner){
    const cy = top, sway = Math.sin(t * 2 + d.x) * k * 0.15;
    g.fillStyle = '#2f4f9a'; g.beginPath(); g.moveTo(cx, cy - k * 2.1); g.quadraticCurveTo(cx + k * 0.6, cy - k * 2.05 + sway * 0.3, cx + k * 1.1 + sway, cy - k * 1.8); g.quadraticCurveTo(cx + k * 0.6, cy - k * 1.6, cx, cy - k * 1.5); g.fill();
    return;
  }
  const sway = Math.sin(t * 2.2 + d.x) * k * 0.15, fy = apexY - k * 0.8;
  g.fillStyle = keep ? '#a3263b' : '#2f4f9a';
  g.beginPath(); g.moveTo(cx, fy); g.quadraticCurveTo(cx + k * (keep ? 0.9 : 0.6), fy + sway * 0.3, cx + k * (keep ? 1.6 : 1.1) + sway, fy + k * 0.22); g.quadraticCurveTo(cx + k * (keep ? 0.9 : 0.6), fy + k * 0.4, cx, fy + k * 0.48); g.closePath(); g.fill();
  if(keep){ g.fillStyle = GOLD_L; g.font = `${Math.round(k * 0.3)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♛', cx + k * 0.55 + sway * 0.4, fy + k * 0.24); }
}

/* ---------- chimneys, signs, banners ---------- */
function drawChimney(g, d, x, y, w, h, k, t){
  const top = y + h * 0.3;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + w * 0.9, top + h * 0.1, w * 0.25, h * 0.6);
  g.fillStyle = '#8a4636'; g.fillRect(x, top, w, y + h - top);
  for(let r = 0; y + h - (r + 1) * k * 0.12 > top; r++){
    const yy = y + h - (r + 1) * k * 0.12;
    for(let c = -1; c < 4; c++){ const bx = x + c * w / 3 + (r % 2) * w / 6; g.fillStyle = ['#9a5040', '#8a4434', '#a85a48', '#7c3e30'][(r * 3 + c + 8) % 4]; g.fillRect(Math.max(x, bx + 1), yy + 1, Math.min(w / 3 - 2, x + w - bx - 1), k * 0.12 - 2); }
  }
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, top, w * 0.18, y + h - top);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + w * 0.78, top, w * 0.22, y + h - top);
  g.fillStyle = '#6f6a66'; g.fillRect(x - w * 0.12, top - k * 0.06, w * 1.24, k * 0.14);
  g.fillStyle = '#a19c96'; g.fillRect(x - w * 0.12, top - k * 0.06, w * 1.24, Math.max(1, k * 0.03));
  [0.3, 0.7].forEach((f, i)=>{ g.fillStyle = '#b8603a'; g.fillRect(x + w * f - k * 0.08, top - k * 0.24, k * 0.16, k * 0.2); g.fillStyle = '#2a1a14'; g.fillRect(x + w * f - k * 0.06, top - k * 0.26, k * 0.12, k * 0.04); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + w * f - k * 0.08, top - k * 0.24, k * 0.04, k * 0.2); });
  for(let i = 0; i < 4; i++){ const p = ((t * 0.35 + i / 4) % 1); g.fillStyle = `rgba(232,232,240,${0.5 * (1 - p)})`; g.beginPath(); g.arc(x + w * (0.3 + 0.35 * Math.sin(p * 4 + i)) + p * k * 0.4, top - k * 0.3 - p * k * 1.4, k * (0.12 + p * 0.28), 0, 7); g.fill(); }
}
function drawSign(g, d, x, y, w, h, k, t){
  const swing = Math.sin(t * 1.3 + d.x) * 0.04;
  g.strokeStyle = '#26252b'; g.lineWidth = Math.max(1.5, k * 0.05);
  g.beginPath(); g.moveTo(x - w * 0.05, y + h * 0.08); g.lineTo(x + w * 1.05, y + h * 0.08); g.stroke();
  g.lineWidth = Math.max(1, k * 0.025);
  g.beginPath(); g.arc(x - w * 0.05, y + h * 0.16, k * 0.07, Math.PI * 1.5, Math.PI * 3.2); g.stroke();
  g.beginPath(); g.arc(x + w * 1.05, y + h * 0.16, k * 0.07, Math.PI * -0.2, Math.PI * 1.5); g.stroke();
  g.save(); g.translate(x + w / 2, y + h * 0.08); g.rotate(swing);
  const bw = w * 0.86, bh = h * 0.72, bx = -bw / 2, by = h * 0.16;
  g.strokeStyle = '#3a3a40'; g.lineWidth = Math.max(1, k * 0.02);
  g.beginPath(); g.moveTo(-bw * 0.36, 0); g.lineTo(-bw * 0.36, by); g.moveTo(bw * 0.36, 0); g.lineTo(bw * 0.36, by); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(bx + k * 0.05, by + k * 0.05, bw, bh);
  g.fillStyle = '#6e4426'; if(g.roundRect){ g.beginPath(); g.roundRect(bx, by, bw, bh, k * 0.08); g.fill(); } else g.fillRect(bx, by, bw, bh);
  g.strokeStyle = GOLD; g.lineWidth = Math.max(1, k * 0.03); if(g.roundRect){ g.beginPath(); g.roundRect(bx + k * 0.05, by + k * 0.05, bw - k * 0.1, bh - k * 0.1, k * 0.06); g.stroke(); }
  g.fillStyle = '#f6e3b4'; g.fillRect(bx + k * 0.1, by + k * 0.1, bw - k * 0.2, bh - k * 0.2);
  g.font = `${Math.round(bh * 0.55)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d.text || '', 0, by + bh / 2 + 1);
  g.restore();
}
function drawBanner(g, d, x, y, w, h, k, t){
  const sway = Math.sin(t * 1.6 + d.x) * w * 0.05;
  g.fillStyle = GOLD_D; g.fillRect(x - w * 0.12, y, w * 1.24, h * 0.05);
  g.fillStyle = GOLD_L; g.beginPath(); g.arc(x - w * 0.12, y + h * 0.025, w * 0.07, 0, 7); g.arc(x + w * 1.12, y + h * 0.025, w * 0.07, 0, 7); g.fill();
  const body = ()=>{ g.beginPath(); g.moveTo(x + w * 0.08, y + h * 0.05); g.lineTo(x + w * 0.92, y + h * 0.05); g.lineTo(x + w * 0.92 + sway, y + h * 0.84); g.lineTo(x + w * 0.5 + sway, y + h * 0.97); g.lineTo(x + w * 0.08 + sway, y + h * 0.84); g.closePath(); };
  const bg = g.createLinearGradient(x, 0, x + w, 0); bg.addColorStop(0, '#24407e'); bg.addColorStop(0.35, '#3a5cb0'); bg.addColorStop(0.65, '#2a4a92'); bg.addColorStop(1, '#1c3268');
  g.fillStyle = bg; body(); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = Math.max(1, w * 0.06); body(); g.stroke();
  /* a crown, drawn */
  const cx = x + w * 0.5 + sway * 0.55, cy = y + h * 0.36, s = w * 0.28;
  g.fillStyle = GOLD_L; g.beginPath(); g.moveTo(cx - s, cy + s * 0.5); g.lineTo(cx - s * 1.1, cy - s * 0.4); g.lineTo(cx - s * 0.5, cy); g.lineTo(cx, cy - s * 0.7); g.lineTo(cx + s * 0.5, cy); g.lineTo(cx + s * 1.1, cy - s * 0.4); g.lineTo(cx + s, cy + s * 0.5); g.closePath(); g.fill();
  g.fillStyle = '#c8343a'; g.beginPath(); g.arc(cx, cy + s * 0.15, s * 0.16, 0, 7); g.fill();
  star(g, x + w * 0.5 + sway * 0.75, y + h * 0.62, w * 0.12, 'rgba(0,0,0,0)', GOLD);
  g.fillStyle = GOLD; for(let i = 0; i < 5; i++){ const fx = x + w * (0.12 + i * 0.19) + sway; g.fillRect(fx, y + h * 0.84 + (i === 2 ? h * 0.1 : Math.abs(i - 2) * h * 0.05), Math.max(1, w * 0.04), h * 0.06); }
}


function drawLamp(g, d, x, y, w, h, k, t){
  const cx = x + w / 2, foot = y + h * 0.96, headY = y + h * 0.12;
  const glow = g.createRadialGradient(cx, headY + k * 0.22, 0, cx, headY + k * 0.22, k * 0.75);
  glow.addColorStop(0, 'rgba(255,214,120,.38)'); glow.addColorStop(1, 'rgba(255,200,100,0)');
  g.fillStyle = glow; g.fillRect(cx - k * 0.8, headY - k * 0.5, k * 1.6, k * 1.6);
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(cx + k * 0.04, foot, k * 0.24, k * 0.06, 0, 0, 7); g.fill();
  const iron = '#2c2a33', ironL = '#55525f';
  g.fillStyle = iron; g.fillRect(cx - k * 0.16, foot - k * 0.08, k * 0.32, k * 0.08); g.fillRect(cx - k * 0.11, foot - k * 0.2, k * 0.22, k * 0.13);
  g.fillStyle = ironL; g.fillRect(cx - k * 0.16, foot - k * 0.08, k * 0.32, Math.max(1, k * 0.015));
  g.fillStyle = iron; g.fillRect(cx - k * 0.045, headY + k * 0.5, k * 0.09, foot - k * 0.2 - headY - k * 0.5);
  g.fillStyle = ironL; g.fillRect(cx - k * 0.03, headY + k * 0.5, Math.max(1, k * 0.02), foot - k * 0.2 - headY - k * 0.5);
  g.fillStyle = iron; g.beginPath(); g.ellipse(cx, foot - k * 0.62, k * 0.08, k * 0.04, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx, headY + k * 0.55, k * 0.1, k * 0.045, 0, 0, 7); g.fill();
  g.strokeStyle = iron; g.lineWidth = Math.max(1, k * 0.03);
  [-1, 1].forEach(s=>{ g.beginPath(); g.moveTo(cx, headY + k * 0.62); g.quadraticCurveTo(cx + s * k * 0.18, headY + k * 0.62, cx + s * k * 0.16, headY + k * 0.48); g.stroke(); });
  /* the lantern: four panes, a little roof, a finial */
  const lw = k * 0.3, lh = k * 0.34, lx = cx - lw / 2, ly = headY + k * 0.12;
  g.fillStyle = iron; g.beginPath(); g.moveTo(lx - k * 0.02, ly + lh); g.lineTo(lx + lw + k * 0.02, ly + lh); g.lineTo(cx + k * 0.06, ly + lh + k * 0.06); g.lineTo(cx - k * 0.06, ly + lh + k * 0.06); g.closePath(); g.fill();
  const lg = g.createLinearGradient(0, ly, 0, ly + lh); lg.addColorStop(0, '#fff3c4'); lg.addColorStop(1, '#ffc65a');
  g.fillStyle = lg; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + lw, ly); g.lineTo(lx + lw * 0.88, ly + lh); g.lineTo(lx + lw * 0.12, ly + lh); g.closePath(); g.fill();
  g.strokeStyle = iron; g.lineWidth = Math.max(1, k * 0.025); g.stroke();
  g.beginPath(); g.moveTo(cx, ly); g.lineTo(cx, ly + lh); g.stroke();
  g.fillStyle = '#fffbe8'; g.beginPath(); g.ellipse(cx - lw * 0.18, ly + lh * 0.55, k * 0.025, k * 0.05, 0, 0, 7); g.fill();
  g.fillStyle = iron; g.beginPath(); g.moveTo(lx - k * 0.06, ly + k * 0.01); g.lineTo(cx, ly - k * 0.14); g.lineTo(lx + lw + k * 0.06, ly + k * 0.01); g.closePath(); g.fill();
  g.fillStyle = ironL; g.beginPath(); g.moveTo(lx - k * 0.06, ly + k * 0.01); g.lineTo(cx, ly - k * 0.14); g.lineTo(cx - k * 0.02, ly - k * 0.08); g.closePath(); g.fill();
  g.fillStyle = GOLD; g.beginPath(); g.arc(cx, ly - k * 0.17, k * 0.035, 0, 7); g.fill();
}
function drawAwning(g, d, x, y, w, h, k, t){
  const C = CA_STALL[d.scheme] || CA_STALL.rose, n = Math.max(2, Math.round(d.w * 2));
  const wood = '#7a4c2a';
  [x + k * 0.06, x + w - k * 0.14].forEach(px=>{ g.fillStyle = wood; g.fillRect(px, y + h * 0.2, k * 0.08, h * 0.8); g.fillStyle = 'rgba(255,230,200,.2)'; g.fillRect(px, y + h * 0.2, Math.max(1, k * 0.02), h * 0.8); });
  const top = y + h * 0.02, low = y + h * 0.5;
  for(let i = 0; i < n; i++){
    const sx = x + w * i / n, sw = w / n + 1, c = i % 2 ? C[1] : C[0];
    const fg = g.createLinearGradient(sx, 0, sx + sw, 0); fg.addColorStop(0, sh(c, 0.12)); fg.addColorStop(0.5, c); fg.addColorStop(1, sh(c, -0.14));
    g.fillStyle = fg; g.beginPath(); g.moveTo(sx, top); g.lineTo(sx + sw, top); g.lineTo(sx + sw, low); g.lineTo(sx, low); g.closePath(); g.fill();
  }
  const sg = g.createLinearGradient(0, top, 0, low); sg.addColorStop(0, 'rgba(255,255,255,.18)'); sg.addColorStop(0.6, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,.12)');
  g.fillStyle = sg; g.fillRect(x, top, w, low - top);
  for(let i = 0; i < n; i++){ const c = i % 2 ? C[1] : C[0]; g.fillStyle = sh(c, -0.06); g.beginPath(); g.moveTo(x + w * i / n, low - 1); g.lineTo(x + w * (i + 1) / n, low - 1); g.arc(x + w * (i + 0.5) / n, low - 1, w / n / 2, 0, Math.PI); g.fill(); }
  g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 1; for(let i = 0; i < n; i++){ g.beginPath(); g.arc(x + w * (i + 0.5) / n, low - 1, w / n / 2, 0.15, Math.PI - 0.15); g.stroke(); }
  g.fillStyle = '#fff6e0'; g.fillRect(x, low - h * 0.04, w, Math.max(1, h * 0.025));
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, top, w, Math.max(1, h * 0.03));
  /* goods in crates and buckets along the counter's front */
  const gy = y + h * 0.98;
  for(let i = 0; i < d.w; i++){
    const cx0 = x + k * (i + 0.12), cw = k * 0.76;
    if(d.goods === 'fruit' || d.goods === 'flower'){
      g.fillStyle = '#8a5a32'; g.fillRect(cx0, gy + k * 0.04, cw, k * 0.16); g.fillStyle = '#a8703e'; g.fillRect(cx0, gy + k * 0.04, cw, Math.max(1, k * 0.02));
      const cols = d.goods === 'fruit' ? [['#e0393e', '#c42a30'], ['#f2a33a', '#d88a22'], ['#e8d04a', '#cdb432'], ['#7fbf4a', '#62a032']][(i + Math.round(d.x)) % 4] : [['#f07aa6', '#ffffff'], ['#9a6be0', '#f2c23a'], ['#ffffff', '#f07aa6'], ['#f2c23a', '#ff7a5a']][(i + Math.round(d.x)) % 4];
      for(let j = 0; j < 7; j++){ const fx = cx0 + cw * (0.1 + 0.8 * (j / 6)), fy = gy + k * (0.02 + (j % 2) * 0.03); g.fillStyle = cols[j % 2]; g.beginPath(); g.arc(fx, fy, k * 0.065, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(fx - k * 0.02, fy - k * 0.02, k * 0.018, 0, 7); g.fill(); }
      if(d.goods === 'flower'){ g.strokeStyle = '#3f7d34'; g.lineWidth = Math.max(1, k * 0.015); for(let j = 0; j < 5; j++){ const fx = cx0 + cw * (0.15 + 0.7 * j / 4); g.beginPath(); g.moveTo(fx, gy + k * 0.06); g.lineTo(fx + (j - 2) * k * 0.02, gy - k * 0.06); g.stroke(); } }
    }
  }
}

/* ---------- finer cobbles ---------- */
function drawCobble(g, S, n){
  const h = (k)=> jgHash(n * 31 + 7, 19, k);
  g.fillStyle = '#6e665b'; g.fillRect(0, 0, S, S);
  const cols = ['#a49a8a', '#9a9080', '#b2a998', '#948a7b', '#aaa08e', '#8f8676'];
  for(let r = 0; r < 4; r++) for(let c = -1; c < 4; c++){
    const x = (c / 3 + (r % 2 ? 1 / 6 : 0)) * S + S * 0.018, y = r / 4 * S + S * 0.02, w = S / 3 - S * 0.036, hh = S / 4 - S * 0.04;
    const v = h(r * 5 + c + 9);
    g.fillStyle = cols[Math.floor(v * cols.length)];
    const rr = S * (0.05 + 0.03 * h(r * 7 + c + 3));
    g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, hh, rr); else g.rect(x, y, w, hh); g.fill();
    g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(x + w * 0.4, y + hh * 0.3, w * 0.3, hh * 0.16, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(30,20,10,.18)'; g.beginPath(); g.ellipse(x + w * 0.55, y + hh * 0.86, w * 0.42, hh * 0.12, 0, 0, 7); g.fill();
  }
  if(n === 5 || n === 2){ g.fillStyle = '#6f9a45'; for(let i = 0; i < 4; i++){ g.beginPath(); g.arc(S * (0.3 + 0.1 * i), S * (0.5 + (i % 2) * 0.02), S * 0.03, 0, 7); g.fill(); } }
  if(n === 3){ g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(S * 0.66, S * 0.25, S * 0.02, 0, 7); g.fill(); }
}


/* ---------- the market: stalls with their keepers behind the counters, planters, benches, the well, the board ----------
   The designer: "Can you put the fairies properly behind their stalls instead of above? And the stalls and potted
   plant deco needs to be more detailed, please!" A stall is one picture: its canopy high over its keepers' heads,
   its posts, its counter with a skirt in its colours and its goods on top. Over everyone (the see-through layer,
   21-castle.js) it is drawn again on the squares behind it, so the counter stands in front of its keepers' legs
   and the canopy over whoever passes behind. */
function signIcon(g, kind, cx, cy, r){
  if(kind === 'medals'){
    g.fillStyle = '#e8c547'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.strokeStyle = '#a07a22'; g.lineWidth = Math.max(1, r * 0.18); g.stroke();
    star(g, cx, cy, r * 0.55, 'rgba(0,0,0,0)', '#fff3b0');
  } else if(kind === 'paintings'){
    g.fillStyle = '#e9d3a8'; g.beginPath(); g.ellipse(cx, cy, r * 1.15, r * 0.85, -0.3, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + r * 0.55, cy + r * 0.25, r * 0.22, 0, 7); g.fill();
    [['#e0393e', -0.5, -0.3], ['#3c6fc4', 0, -0.5], ['#f2c23a', 0.45, -0.2], ['#3f9d5a', -0.45, 0.3]].forEach(([c, dx, dy])=>{ g.fillStyle = c; g.beginPath(); g.arc(cx + dx * r, cy + dy * r, r * 0.2, 0, 7); g.fill(); });
  } else if(kind === 'fruit'){
    g.fillStyle = '#d93a3e'; g.beginPath(); g.arc(cx - r * 0.18, cy + r * 0.1, r * 0.62, 0, 7); g.arc(cx + r * 0.18, cy + r * 0.1, r * 0.62, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(cx - r * 0.35, cy - r * 0.1, r * 0.16, 0, 7); g.fill();
    g.strokeStyle = '#5a3a1a'; g.lineWidth = Math.max(1, r * 0.14); g.beginPath(); g.moveTo(cx, cy - r * 0.4); g.lineTo(cx + r * 0.1, cy - r * 0.85); g.stroke();
    g.fillStyle = '#4f9a3a'; g.beginPath(); g.ellipse(cx + r * 0.35, cy - r * 0.72, r * 0.3, r * 0.14, -0.5, 0, 7); g.fill();
  } else {
    for(let i = 0; i < 5; i++){ const a = i / 5 * Math.PI * 2 - Math.PI / 2; g.fillStyle = '#f07aa6'; g.beginPath(); g.ellipse(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, r * 0.36, r * 0.24, a, 0, 7); g.fill(); }
    g.fillStyle = '#f2c23a'; g.beginPath(); g.arc(cx, cy, r * 0.3, 0, 7); g.fill();
  }
}
function goodsOn(g, kind, X0, top, W, k, rnd){
  if(kind === 'medals'){
    /* gold medals in stacks, a cushion with three on ribbons, bright stones, a SALE tag */
    for(let i = 0; i < 3; i++){
      const sx = X0 + W * (0.12 + i * 0.1);
      for(let j = 0; j < 4 + (i % 2); j++){ g.fillStyle = j % 2 ? '#d9b247' : '#efd36a'; g.beginPath(); g.ellipse(sx, top + 0.06 * k - j * 0.045 * k, 0.11 * k, 0.04 * k, 0, 0, 7); g.fill(); g.strokeStyle = '#a07a22'; g.lineWidth = 1; g.stroke(); }
    }
    const cx = X0 + W * 0.52;
    g.fillStyle = '#7a2a5a'; g.beginPath(); if(g.roundRect) g.roundRect(cx - 0.42 * k, top - 0.08 * k, 0.84 * k, 0.24 * k, 0.08 * k); else g.rect(cx - 0.42 * k, top - 0.08 * k, 0.84 * k, 0.24 * k); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(cx - 0.38 * k, top - 0.06 * k, 0.76 * k, 0.04 * k);
    [-0.25, 0, 0.25].forEach((dx, i)=>{
      const mx = cx + dx * k, my = top - 0.12 * k;
      g.fillStyle = ['#c8343a', '#2f5da8', '#3f9d5a'][i]; g.beginPath(); g.moveTo(mx - 0.06 * k, my - 0.2 * k); g.lineTo(mx + 0.06 * k, my - 0.2 * k); g.lineTo(mx + 0.03 * k, my); g.lineTo(mx - 0.03 * k, my); g.closePath(); g.fill();
      g.fillStyle = '#e8c547'; g.beginPath(); g.arc(mx, my + 0.02 * k, 0.085 * k, 0, 7); g.fill();
      g.strokeStyle = '#a07a22'; g.lineWidth = Math.max(1, k * 0.015); g.stroke();
      star(g, mx, my + 0.02 * k, 0.045 * k, 'rgba(0,0,0,0)', '#fff3b0');
    });
    [['#9a6be0', 0.78], ['#4fb0e0', 0.84], ['#e04f8a', 0.9]].forEach(([c, f], i)=>{
      const gx = X0 + W * f, gy = top + 0.02 * k - (i % 2) * 0.05 * k, r = 0.07 * k;
      g.fillStyle = c; g.beginPath(); g.moveTo(gx, gy - r); g.lineTo(gx + r * 0.8, gy); g.lineTo(gx, gy + r); g.lineTo(gx - r * 0.8, gy); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.moveTo(gx, gy - r); g.lineTo(gx + r * 0.3, gy - r * 0.2); g.lineTo(gx - r * 0.2, gy - r * 0.1); g.closePath(); g.fill();
    });
    const tx = X0 + W * 0.66, ty = top - 0.3 * k;
    g.fillStyle = '#fffaf0'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + 0.42 * k, ty); g.lineTo(tx + 0.42 * k, ty + 0.2 * k); g.lineTo(tx, ty + 0.2 * k); g.lineTo(tx - 0.06 * k, ty + 0.1 * k); g.closePath(); g.fill();
    g.strokeStyle = '#a07a22'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#c8343a'; g.font = `900 ${Math.round(0.14 * k)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SALE!', tx + 0.2 * k, ty + 0.105 * k);
    return;
  }
  if(kind === 'paintings'){
    /* little framed paintings leaning up, a jar of brushes, a palette */
    [[0.08, 0.5, 0.42, '#8fc2e8', '#6aa84f'], [0.3, 0.42, 0.36, '#f2b880', '#3f6e9a'], [0.62, 0.46, 0.38, '#cfe0f5', '#e8c547']].forEach(([f, fw, fh, sky, land], i)=>{
      const px = X0 + W * f, pw = fw * k, ph = fh * k, py = top + 0.1 * k - ph;
      g.fillStyle = '#c9a24a'; g.fillRect(px - 0.04 * k, py - 0.04 * k, pw + 0.08 * k, ph + 0.08 * k);
      g.fillStyle = '#8a6a2a'; g.fillRect(px - 0.04 * k, py + ph, pw + 0.08 * k, 0.04 * k);
      const gr = g.createLinearGradient(0, py, 0, py + ph); gr.addColorStop(0, sky); gr.addColorStop(1, '#ffffff'); g.fillStyle = gr; g.fillRect(px, py, pw, ph);
      g.fillStyle = land; g.beginPath(); g.moveTo(px, py + ph); g.quadraticCurveTo(px + pw * 0.3, py + ph * 0.45, px + pw * 0.6, py + ph * 0.7); g.quadraticCurveTo(px + pw * 0.8, py + ph * 0.55, px + pw, py + ph * 0.75); g.lineTo(px + pw, py + ph); g.closePath(); g.fill();
      if(i === 1){ g.fillStyle = '#f4efe4'; g.fillRect(px + pw * 0.4, py + ph * 0.42, pw * 0.22, ph * 0.3); g.fillStyle = '#3f5aa0'; g.beginPath(); g.moveTo(px + pw * 0.38, py + ph * 0.44); g.lineTo(px + pw * 0.51, py + ph * 0.18); g.lineTo(px + pw * 0.64, py + ph * 0.44); g.fill(); }
      else { g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(px + pw * 0.75, py + ph * 0.28, ph * 0.1, 0, 7); g.fill(); }
    });
    const jx = X0 + W * 0.88, jy = top + 0.06 * k;
    g.fillStyle = '#9cc4d8'; g.fillRect(jx - 0.09 * k, jy - 0.2 * k, 0.18 * k, 0.22 * k);
    ['#c8343a', '#3c6fc4', '#f2c23a', '#3f9d5a'].forEach((c, i)=>{ g.strokeStyle = '#7a4a28'; g.lineWidth = Math.max(1, 0.02 * k); g.beginPath(); g.moveTo(jx - 0.05 * k + i * 0.035 * k, jy - 0.18 * k); g.lineTo(jx - 0.09 * k + i * 0.06 * k, jy - 0.42 * k); g.stroke(); g.fillStyle = c; g.beginPath(); g.arc(jx - 0.09 * k + i * 0.06 * k, jy - 0.44 * k, 0.025 * k, 0, 7); g.fill(); });
    return;
  }
  if(kind === 'fruit'){
    const crates = [['#d93a3e', 'apple'], ['#f29a2e', 'orange'], ['#c9d44a', 'pear'], ['#7a3f9a', 'grape']];
    const cw = W / crates.length;
    crates.forEach(([c, what], i)=>{
      const bx = X0 + cw * i + 0.05 * k, bw = cw - 0.1 * k, by = top - 0.06 * k;
      g.fillStyle = '#9c6a3c'; g.fillRect(bx, by, bw, 0.2 * k);
      g.fillStyle = '#7a4c2a'; g.fillRect(bx, by + 0.08 * k, bw, 0.03 * k); g.fillRect(bx, by + 0.17 * k, bw, 0.03 * k);
      g.fillStyle = 'rgba(255,230,200,.2)'; g.fillRect(bx, by, bw, Math.max(1, 0.02 * k));
      const nx = Math.max(3, Math.round(bw / (0.12 * k)));
      for(let r = 0; r < 2; r++) for(let j = 0; j < nx - r; j++){
        const fx = bx + bw * (j + 0.5 + r * 0.5) / nx, fy = by - r * 0.07 * k, fr = 0.065 * k;
        if(what === 'grape'){ for(let q = 0; q < 3; q++){ g.fillStyle = sh(c, (rnd() - 0.5) * 0.3); g.beginPath(); g.arc(fx + (q - 1) * fr * 0.6, fy - (q % 2) * fr * 0.5, fr * 0.55, 0, 7); g.fill(); } continue; }
        g.fillStyle = sh(c, (rnd() - 0.5) * 0.2); g.beginPath();
        if(what === 'pear'){ g.ellipse(fx, fy, fr * 0.8, fr * 1.05, 0, 0, 7); } else g.arc(fx, fy, fr, 0, 7);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(fx - fr * 0.35, fy - fr * 0.35, fr * 0.28, 0, 7); g.fill();
        if(what === 'apple' || what === 'pear'){ g.strokeStyle = '#5a3a1a'; g.lineWidth = 1; g.beginPath(); g.moveTo(fx, fy - fr); g.lineTo(fx + fr * 0.2, fy - fr * 1.4); g.stroke(); }
      }
      g.fillStyle = '#fffaf0'; g.fillRect(bx + bw * 0.3, by + 0.22 * k, bw * 0.4, 0.12 * k);
      g.fillStyle = '#7a4c2a'; g.font = `700 ${Math.round(0.09 * k)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2 ✦', bx + bw * 0.5, by + 0.285 * k);
    });
    return;
  }
  /* flowers: buckets of them */
  const kinds = [['#e8414f', 'tulip'], ['#ffffff', 'daisy'], ['#f2c23a', 'sun'], ['#9a6be0', 'lav'], ['#f07aa6', 'tulip']];
  const bw = W / kinds.length;
  kinds.forEach(([c, what], i)=>{
    const bx = X0 + bw * i + bw * 0.18, ww = bw * 0.64, by = top - 0.04 * k;
    g.fillStyle = '#8a8f98'; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + ww, by); g.lineTo(bx + ww * 0.88, by + 0.22 * k); g.lineTo(bx + ww * 0.12, by + 0.22 * k); g.closePath(); g.fill();
    g.fillStyle = '#c3c8cf'; g.fillRect(bx, by, ww, Math.max(1.5, 0.03 * k));
    g.strokeStyle = '#3f7d34'; g.lineWidth = Math.max(1, 0.018 * k);
    for(let j = 0; j < 6; j++){
      const sx = bx + ww * (0.15 + 0.7 * j / 5), tx = sx + (j - 2.5) * 0.04 * k, ty = by - (0.3 + rnd() * 0.15) * k;
      g.beginPath(); g.moveTo(sx, by + 0.02 * k); g.lineTo(tx, ty); g.stroke();
      if(what === 'lav'){ g.fillStyle = c; for(let q = 0; q < 4; q++){ g.beginPath(); g.ellipse(tx, ty + q * 0.035 * k, 0.025 * k, 0.03 * k, 0, 0, 7); g.fill(); } continue; }
      if(what === 'sun'){ g.fillStyle = c; for(let q = 0; q < 8; q++){ const a = q / 8 * Math.PI * 2; g.beginPath(); g.ellipse(tx + Math.cos(a) * 0.045 * k, ty + Math.sin(a) * 0.045 * k, 0.03 * k, 0.015 * k, a, 0, 7); g.fill(); } g.fillStyle = '#6a4325'; g.beginPath(); g.arc(tx, ty, 0.03 * k, 0, 7); g.fill(); continue; }
      if(what === 'daisy'){ g.fillStyle = c; for(let q = 0; q < 6; q++){ const a = q / 6 * Math.PI * 2; g.beginPath(); g.arc(tx + Math.cos(a) * 0.03 * k, ty + Math.sin(a) * 0.03 * k, 0.022 * k, 0, 7); g.fill(); } g.fillStyle = '#f2c23a'; g.beginPath(); g.arc(tx, ty, 0.018 * k, 0, 7); g.fill(); continue; }
      g.fillStyle = sh(c, (rnd() - 0.5) * 0.2); g.beginPath(); g.moveTo(tx - 0.04 * k, ty - 0.04 * k); g.lineTo(tx - 0.02 * k, ty + 0.03 * k); g.lineTo(tx + 0.02 * k, ty + 0.03 * k); g.lineTo(tx + 0.04 * k, ty - 0.04 * k); g.lineTo(tx + 0.013 * k, ty - 0.015 * k); g.lineTo(tx, ty - 0.05 * k); g.lineTo(tx - 0.013 * k, ty - 0.015 * k); g.closePath(); g.fill();
    }
    g.fillStyle = '#4f8f3f'; for(let j = 0; j < 4; j++){ g.beginPath(); g.ellipse(bx + ww * (0.2 + j * 0.2), by - 0.04 * k, 0.05 * k, 0.025 * k, (j - 1.5) * 0.5, 0, 7); g.fill(); }
  });
}
function drawStall(g, d, x, y, w, h, k){
  const C = CA_STALL[d.scheme] || CA_STALL.rose, rnd = rng(Math.round(d.x * 31 + d.y * 17));
  const cols = d.cols || Math.round(d.w - 0.3);
  const X0 = x + 0.15 * k, W = cols * k, Y0 = y + 2.4 * k;           // the counter's row: its left edge, its top
  const Yb = Y0 - 2.32 * k, Yf = Y0 - 1.62 * k;                       // the canopy's back and front edges
  const wood = '#7a4c2a', woodL = '#a8703e', woodD = '#4e2e16';
  g.fillStyle = 'rgba(30,20,10,.22)'; g.beginPath(); g.ellipse(X0 + W / 2, Y0 + 0.95 * k, W * 0.56, 0.12 * k, 0, 0, 7); g.fill();
  /* the back posts */
  [X0 + 0.2 * k, X0 + W - 0.3 * k].forEach(px=>{ g.fillStyle = woodD; g.fillRect(px, Yb, 0.09 * k, Y0 - Yb); g.fillStyle = 'rgba(255,230,200,.16)'; g.fillRect(px, Yb, Math.max(1, 0.025 * k), Y0 - Yb); });
  /* the canopy: stripes running back to front, its folds lit from the left */
  const n = Math.max(4, cols * 2);
  const bL = X0 + 0.12 * k, bR = X0 + W - 0.12 * k, fL = X0 - 0.12 * k, fR = X0 + W + 0.12 * k;
  for(let i = 0; i < n; i++){
    const a0 = i / n, a1 = (i + 1) / n, c = i % 2 ? C[1] : C[0];
    const q = [[bL + (bR - bL) * a0, Yb], [bL + (bR - bL) * a1, Yb], [fL + (fR - fL) * a1 + 0.5, Yf], [fL + (fR - fL) * a0, Yf]];
    const gr = g.createLinearGradient(q[3][0], 0, q[2][0], 0);
    gr.addColorStop(0, sh(c, 0.12)); gr.addColorStop(0.55, c); gr.addColorStop(1, sh(c, -0.16));
    g.fillStyle = gr; g.beginPath(); q.forEach((p, j)=> j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
  }
  const dg = g.createLinearGradient(0, Yb, 0, Yf); dg.addColorStop(0, 'rgba(40,20,30,.28)'); dg.addColorStop(1, 'rgba(255,255,255,.1)');
  g.fillStyle = dg; g.beginPath(); g.moveTo(bL, Yb); g.lineTo(bR, Yb); g.lineTo(fR, Yf); g.lineTo(fL, Yf); g.closePath(); g.fill();
  g.fillStyle = woodD; g.fillRect(bL - 0.05 * k, Yb - 0.06 * k, bR - bL + 0.1 * k, 0.09 * k);
  /* the valance: a scallop a stripe, a white trim */
  for(let i = 0; i < n; i++){
    const c = i % 2 ? C[1] : C[0], sx = fL + (fR - fL) * i / n, sw = (fR - fL) / n;
    g.fillStyle = sh(c, -0.04); g.fillRect(sx, Yf, sw + 0.5, 0.12 * k);
    g.beginPath(); g.ellipse(sx + sw / 2, Yf + 0.12 * k, sw / 2, 0.1 * k, 0, 0, Math.PI); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = Math.max(1, k * 0.012); g.beginPath(); g.ellipse(sx + sw / 2, Yf + 0.12 * k, sw / 2, 0.1 * k, 0, 0.2, Math.PI - 0.2); g.stroke();
  }
  g.fillStyle = '#fff6e0'; g.fillRect(fL, Yf - 0.02 * k, fR - fL, Math.max(1.5, 0.035 * k));
  /* its sign over the front */
  const sx = X0 + W / 2, sy = Yf - 0.26 * k;
  g.fillStyle = woodD; g.fillRect(sx - 0.34 * k, sy - 0.2 * k, 0.68 * k, 0.4 * k);
  g.fillStyle = '#f6e3b4'; g.fillRect(sx - 0.3 * k, sy - 0.16 * k, 0.6 * k, 0.32 * k);
  g.strokeStyle = '#d9b247'; g.lineWidth = Math.max(1, 0.02 * k); g.strokeRect(sx - 0.27 * k, sy - 0.13 * k, 0.54 * k, 0.26 * k);
  signIcon(g, d.goods, sx, sy, 0.1 * k);
  /* the front posts */
  [X0 + 0.02 * k, X0 + W - 0.12 * k].forEach(px=>{
    g.fillStyle = wood; g.fillRect(px, Yf, 0.1 * k, Y0 + 0.9 * k - Yf);
    g.fillStyle = woodL; g.fillRect(px, Yf, Math.max(1, 0.03 * k), Y0 + 0.9 * k - Yf);
    g.fillStyle = woodD; g.fillRect(px - 0.02 * k, Y0 + 0.82 * k, 0.14 * k, 0.08 * k);
  });
  /* the counter: its top, its front under a skirt in the stall's colours */
  const ct = Y0 - 0.22 * k, cf = Y0 + 0.12 * k, cb = Y0 + 0.9 * k;
  g.fillStyle = woodL; g.fillRect(X0, ct, W, cf - ct);
  g.fillStyle = 'rgba(255,240,220,.28)'; g.fillRect(X0, ct, W, Math.max(1, 0.03 * k));
  grain(g, X0, ct, W, cf - ct, rnd, cols * 4, 'rgba(80,40,10,.18)');
  g.fillStyle = wood; g.fillRect(X0, cf, W, cb - cf);
  for(let i = 1; i < cols * 3; i++){ g.fillStyle = 'rgba(40,20,5,.25)'; g.fillRect(X0 + W * i / (cols * 3), cf, 1, cb - cf); }
  grain(g, X0, cf, W, cb - cf, rnd, cols * 5, 'rgba(30,15,5,.16)');
  const m = n;
  for(let i = 0; i < m; i++){
    const c = i % 2 ? C[1] : C[0], kx = X0 + W * i / m, kw = W / m;
    g.fillStyle = c; g.fillRect(kx, cf, kw + 0.5, 0.2 * k);
    g.beginPath(); g.ellipse(kx + kw / 2, cf + 0.2 * k, kw / 2, 0.09 * k, 0, 0, Math.PI); g.fill();
  }
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(X0, cf, W, Math.max(1, 0.02 * k));
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(X0, cb - 0.06 * k, W, 0.06 * k);
  goodsOn(g, d.goods, X0, ct + 0.12 * k, W, k, rnd);
}
function drawPlanter(g, d, x, y, w, h, k){
  /* a stone urn on a plinth, something growing in it: a clipped bay, geraniums spilling over, a little lemon tree, lavender */
  const rnd = rng(Math.round(d.x * 13 + d.y * 7)), v = d.n || 0, cx = x + w / 2, by = y + h - 0.08 * k;
  g.fillStyle = 'rgba(30,20,10,.25)'; g.beginPath(); g.ellipse(cx + 0.05 * k, by, 0.46 * k, 0.1 * k, 0, 0, 7); g.fill();
  const stone = '#d6cfc2', stoneD = '#a49b8c';
  g.fillStyle = stoneD; g.fillRect(cx - 0.36 * k, by - 0.14 * k, 0.72 * k, 0.14 * k);
  g.fillStyle = stone; g.fillRect(cx - 0.36 * k, by - 0.14 * k, 0.72 * k, Math.max(1, 0.03 * k));
  const ug = g.createLinearGradient(cx - 0.36 * k, 0, cx + 0.36 * k, 0); ug.addColorStop(0, sh(stone, 0.12)); ug.addColorStop(0.5, stone); ug.addColorStop(1, stoneD);
  g.fillStyle = ug; g.beginPath(); g.moveTo(cx - 0.18 * k, by - 0.14 * k); g.quadraticCurveTo(cx - 0.44 * k, by - 0.34 * k, cx - 0.38 * k, by - 0.58 * k); g.lineTo(cx + 0.38 * k, by - 0.58 * k); g.quadraticCurveTo(cx + 0.44 * k, by - 0.34 * k, cx + 0.18 * k, by - 0.14 * k); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,105,85,.4)'; g.lineWidth = Math.max(1, 0.015 * k); g.beginPath(); g.moveTo(cx - 0.36 * k, by - 0.4 * k); g.quadraticCurveTo(cx, by - 0.34 * k, cx + 0.36 * k, by - 0.4 * k); g.stroke();
  g.fillStyle = '#e8e2d6'; g.beginPath(); g.ellipse(cx, by - 0.58 * k, 0.43 * k, 0.09 * k, 0, 0, 7); g.fill();
  g.fillStyle = '#5a4030'; g.beginPath(); g.ellipse(cx, by - 0.6 * k, 0.35 * k, 0.06 * k, 0, 0, 7); g.fill();
  const top = by - 0.6 * k;
  if(v % 4 === 0){
    g.fillStyle = '#6a4626'; g.fillRect(cx - 0.025 * k, top - 0.42 * k, 0.05 * k, 0.42 * k);
    g.fillStyle = '#2f6b2e'; g.beginPath(); g.arc(cx, top - 0.62 * k, 0.32 * k, 0, 7); g.fill();
    for(let i = 0; i < 26; i++){ const a = rnd() * 7, r = rnd() * 0.28 * k; g.fillStyle = ['#3f7d3a', '#4f9447', '#5ea852', '#2f6b2e'][i % 4]; g.beginPath(); g.arc(cx + Math.cos(a) * r, top - 0.62 * k + Math.sin(a) * r, 0.06 * k, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(cx - 0.12 * k, top - 0.74 * k, 0.12 * k, 0, 7); g.fill();
  } else if(v % 4 === 1){
    for(let i = 0; i < 22; i++){ const a = Math.PI + rnd() * Math.PI, r = rnd() * 0.36 * k; g.fillStyle = ['#3d7a30', '#58993f', '#4a8a36'][i % 3]; g.beginPath(); g.arc(cx + Math.cos(a) * r, top + Math.sin(a) * r * 0.8, 0.07 * k, 0, 7); g.fill(); }
    for(let i = 0; i < 5; i++){ const tx = cx + (rnd() - 0.5) * 0.7 * k; g.strokeStyle = '#3f7a34'; g.lineWidth = Math.max(1, 0.02 * k); g.beginPath(); g.moveTo(tx, top); g.quadraticCurveTo(tx + (rnd() - 0.5) * 0.2 * k, top + 0.2 * k, tx + (rnd() - 0.5) * 0.15 * k, top + 0.34 * k); g.stroke(); }
    for(let i = 0; i < 12; i++){ const a = Math.PI + rnd() * Math.PI, r = rnd() * 0.34 * k, fx = cx + Math.cos(a) * r, fy = top + Math.sin(a) * r * 0.8; g.fillStyle = ['#e8414f', '#ff6a7a', '#f07aa6'][i % 3]; for(let p = 0; p < 4; p++){ const b2 = p / 4 * Math.PI * 2; g.beginPath(); g.arc(fx + Math.cos(b2) * 0.025 * k, fy + Math.sin(b2) * 0.025 * k, 0.025 * k, 0, 7); g.fill(); } }
  } else if(v % 4 === 2){
    g.fillStyle = '#6a4626'; g.fillRect(cx - 0.025 * k, top - 0.5 * k, 0.05 * k, 0.5 * k);
    for(let i = 0; i < 30; i++){ const a = rnd() * 7, r = rnd() * 0.34 * k; g.fillStyle = ['#3f7d3a', '#4f9447', '#2f6b2e'][i % 3]; g.beginPath(); g.ellipse(cx + Math.cos(a) * r, top - 0.72 * k + Math.sin(a) * r * 0.9, 0.06 * k, 0.04 * k, a, 0, 7); g.fill(); }
    for(let i = 0; i < 7; i++){ const a = rnd() * 7, r = rnd() * 0.28 * k; g.fillStyle = '#f2d23a'; g.beginPath(); g.ellipse(cx + Math.cos(a) * r, top - 0.72 * k + Math.sin(a) * r, 0.05 * k, 0.04 * k, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(cx + Math.cos(a) * r - 0.015 * k, top - 0.73 * k + Math.sin(a) * r, 0.012 * k, 0, 7); g.fill(); }
  } else {
    for(let i = 0; i < 16; i++){
      const tx = cx + (i / 15 - 0.5) * 0.66 * k, hgt = (0.3 + rnd() * 0.28) * k, lean = (i / 15 - 0.5) * 0.25 * k;
      g.strokeStyle = '#6a8a4a'; g.lineWidth = Math.max(1, 0.02 * k); g.beginPath(); g.moveTo(tx, top); g.lineTo(tx + lean, top - hgt); g.stroke();
      g.fillStyle = ['#9a6be0', '#8a5ad0', '#b48af0'][i % 3]; for(let q = 0; q < 4; q++){ g.beginPath(); g.ellipse(tx + lean * (1 - q * 0.06), top - hgt + q * 0.045 * k, 0.025 * k, 0.03 * k, 0, 0, 7); g.fill(); }
    }
  }
}
function drawBench(g, d, x, y, w, h, k){
  const bx = x + 0.08 * k, bw = w - 0.16 * k, by = y + h - 0.12 * k;
  g.fillStyle = 'rgba(30,20,10,.2)'; g.beginPath(); g.ellipse(bx + bw / 2, by + 0.04 * k, bw * 0.55, 0.08 * k, 0, 0, 7); g.fill();
  const iron = '#2c2a33';
  [bx + 0.06 * k, bx + bw - 0.12 * k].forEach(px=>{
    g.fillStyle = iron; g.fillRect(px, by - 0.62 * k, 0.06 * k, 0.62 * k);
    g.strokeStyle = iron; g.lineWidth = Math.max(1, 0.03 * k); g.beginPath(); g.arc(px + 0.03 * k, by - 0.28 * k, 0.08 * k, Math.PI * 0.5, Math.PI * 1.6); g.stroke();
  });
  for(let i = 0; i < 3; i++){ const sy = by - 0.6 * k + i * 0.11 * k; g.fillStyle = i % 2 ? '#8a5a32' : '#9c6a3c'; g.fillRect(bx, sy, bw, 0.08 * k); g.fillStyle = 'rgba(255,230,200,.25)'; g.fillRect(bx, sy, bw, Math.max(1, 0.02 * k)); }
  for(let i = 0; i < 2; i++){ const sy = by - 0.26 * k + i * 0.09 * k; g.fillStyle = '#a8703e'; g.fillRect(bx - 0.02 * k, sy, bw + 0.04 * k, 0.07 * k); g.fillStyle = 'rgba(40,20,5,.3)'; g.fillRect(bx - 0.02 * k, sy + 0.06 * k, bw + 0.04 * k, Math.max(1, 0.015 * k)); }
}
function drawWell(g, d, x, y, w, h, k){
  const cx = x + w / 2, by = y + h - 0.1 * k, r = 0.46 * k;
  g.fillStyle = 'rgba(30,20,10,.25)'; g.beginPath(); g.ellipse(cx + 0.06 * k, by, r * 1.2, 0.14 * k, 0, 0, 7); g.fill();
  /* its ring of stones, the dark water in it */
  const top = by - 0.45 * k;
  g.fillStyle = '#9a9286'; g.fillRect(cx - r, top, r * 2, by - top);
  for(let row = 0; row < 3; row++) for(let i = 0; i < 5; i++){
    const sw = r * 2 / 4.5, sx = cx - r + i * sw - (row % 2) * sw / 2, sy = top + row * 0.15 * k;
    g.fillStyle = sh('#a8a092', ((i * 7 + row * 3) % 5 - 2) * 0.04); g.fillRect(Math.max(cx - r, sx + 1), sy + 1, Math.min(sw - 2, cx + r - sx - 1), 0.13 * k);
  }
  g.fillStyle = '#b8b0a2'; g.beginPath(); g.ellipse(cx, top, r, 0.16 * k, 0, 0, 7); g.fill();
  g.fillStyle = '#1f3a52'; g.beginPath(); g.ellipse(cx, top, r * 0.78, 0.11 * k, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(160,210,255,.35)'; g.beginPath(); g.ellipse(cx - r * 0.25, top - 0.02 * k, r * 0.25, 0.03 * k, 0, 0, 7); g.fill();
  /* posts, the roof, the crank, the bucket */
  const wood = '#6b4426';
  [cx - r * 0.95, cx + r * 0.85].forEach(px=>{ g.fillStyle = wood; g.fillRect(px, top - 0.95 * k, 0.08 * k, 0.95 * k); g.fillStyle = 'rgba(255,230,200,.2)'; g.fillRect(px, top - 0.95 * k, Math.max(1, 0.02 * k), 0.95 * k); });
  g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1, 0.03 * k); g.beginPath(); g.moveTo(cx - r * 0.9, top - 0.62 * k); g.lineTo(cx + r * 0.9, top - 0.62 * k); g.stroke();
  g.strokeStyle = '#c9b48a'; g.lineWidth = Math.max(1, 0.015 * k); g.beginPath(); g.moveTo(cx, top - 0.62 * k); g.lineTo(cx, top - 0.3 * k); g.stroke();
  g.fillStyle = '#8a5a32'; g.beginPath(); g.moveTo(cx - 0.09 * k, top - 0.3 * k); g.lineTo(cx + 0.09 * k, top - 0.3 * k); g.lineTo(cx + 0.07 * k, top - 0.14 * k); g.lineTo(cx - 0.07 * k, top - 0.14 * k); g.closePath(); g.fill();
  g.fillStyle = '#3a3a40'; g.fillRect(cx - 0.09 * k, top - 0.26 * k, 0.18 * k, Math.max(1, 0.02 * k));
  const ry = top - 0.95 * k;
  g.save(); g.beginPath(); g.moveTo(cx - r * 1.25, ry + 0.12 * k); g.lineTo(cx, ry - 0.42 * k); g.lineTo(cx + r * 1.25, ry + 0.12 * k); g.closePath(); g.clip();
  roofTiles(g, cx - r * 1.3, ry - 0.45 * k, r * 2.6, 0.6 * k, k, '#8c6340', rnd0(), { shingle:true, th:0.1, tw:0.14 });
  g.restore();
  g.strokeStyle = '#4e2e16'; g.lineWidth = Math.max(1.5, 0.05 * k); g.beginPath(); g.moveTo(cx - r * 1.25, ry + 0.12 * k); g.lineTo(cx, ry - 0.42 * k); g.lineTo(cx + r * 1.25, ry + 0.12 * k); g.stroke();
}
function rnd0(){ return rng(7); }
function drawBoard(g, d, x, y, w, h, k){
  const wood = '#6b4426', bx = x + 0.05 * w, bw = w * 0.9, by = y + h * 0.12, bh = h * 0.42;
  g.fillStyle = 'rgba(30,20,10,.22)'; g.beginPath(); g.ellipse(x + w / 2, y + h - 0.05 * k, w * 0.45, 0.08 * k, 0, 0, 7); g.fill();
  [x + w * 0.12, x + w * 0.82].forEach(px=>{ g.fillStyle = wood; g.fillRect(px, y + h * 0.1, w * 0.07, h * 0.9); g.fillStyle = 'rgba(255,230,200,.2)'; g.fillRect(px, y + h * 0.1, Math.max(1, w * 0.02), h * 0.9); });
  g.fillStyle = '#9c6a3c'; g.fillRect(bx, by, bw, bh);
  g.strokeStyle = '#5a3a20'; g.lineWidth = Math.max(1, 0.04 * k); g.strokeRect(bx, by, bw, bh);
  g.fillStyle = '#4e2e16'; g.beginPath(); g.moveTo(bx - 0.08 * k, by); g.lineTo(bx + bw / 2, by - 0.22 * k); g.lineTo(bx + bw + 0.08 * k, by); g.closePath(); g.fill();
  [['#f7f2e4', 0.06, 0.12, 0.3, 0.55, 'lines'], ['#fde9a8', 0.4, 0.08, 0.26, 0.42, 'cat'], ['#e3f0fb', 0.7, 0.16, 0.24, 0.5, 'map'], ['#ffe0e6', 0.38, 0.56, 0.3, 0.36, 'lines']].forEach(([c, fx, fy, fw, fh, what])=>{
    const px = bx + bw * fx, py = by + bh * fy, pw = bw * fw, ph = bh * fh;
    g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(px + 1, py + 1, pw, ph);
    g.fillStyle = c; g.fillRect(px, py, pw, ph);
    g.fillStyle = '#c8343a'; g.beginPath(); g.arc(px + pw / 2, py + 0.03 * k, Math.max(1, 0.02 * k), 0, 7); g.fill();
    g.strokeStyle = 'rgba(60,50,40,.55)'; g.lineWidth = 1;
    if(what === 'lines') for(let i = 1; i < 5; i++){ g.beginPath(); g.moveTo(px + pw * 0.15, py + ph * i / 5.5); g.lineTo(px + pw * (0.6 + (i % 2) * 0.25), py + ph * i / 5.5); g.stroke(); }
    if(what === 'cat'){ g.fillStyle = '#e08a3c'; g.beginPath(); g.arc(px + pw / 2, py + ph * 0.55, pw * 0.2, 0, 7); g.fill(); g.beginPath(); g.moveTo(px + pw * 0.33, py + ph * 0.45); g.lineTo(px + pw * 0.38, py + ph * 0.25); g.lineTo(px + pw * 0.47, py + ph * 0.4); g.fill(); g.beginPath(); g.moveTo(px + pw * 0.53, py + ph * 0.4); g.lineTo(px + pw * 0.62, py + ph * 0.25); g.lineTo(px + pw * 0.67, py + ph * 0.45); g.fill(); }
    if(what === 'map'){ g.strokeStyle = '#3c6fc4'; g.beginPath(); g.moveTo(px + pw * 0.1, py + ph * 0.7); g.quadraticCurveTo(px + pw * 0.5, py + ph * 0.3, px + pw * 0.9, py + ph * 0.6); g.stroke(); g.fillStyle = '#c8343a'; g.font = `900 ${Math.round(ph * 0.3)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✕', px + pw * 0.65, py + ph * 0.42); }
  });
}
function drawEasel(g, d, x, y, w, h, k){
  const wood = '#7a4a28';
  g.fillStyle = 'rgba(30,20,10,.2)'; g.beginPath(); g.ellipse(x + w / 2, y + h - 0.04 * k, w * 0.4, 0.07 * k, 0, 0, 7); g.fill();
  g.strokeStyle = wood; g.lineWidth = Math.max(1.5, k * 0.06); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x + w * 0.5, y + h * 0.02); g.lineTo(x + w * 0.16, y + h); g.moveTo(x + w * 0.5, y + h * 0.02); g.lineTo(x + w * 0.84, y + h); g.moveTo(x + w * 0.5, y + h * 0.05); g.lineTo(x + w * 0.56, y + h * 0.96); g.stroke();
  g.lineCap = 'butt'; g.fillStyle = '#5a3418'; g.fillRect(x + w * 0.12, y + h * 0.58, w * 0.76, h * 0.04);
  /* the canvas: the palace, its blue spires, a summer sky */
  const cx = x + w * 0.12, cy = y + h * 0.12, cw = w * 0.76, ch = h * 0.46;
  g.fillStyle = '#f7f2e4'; g.fillRect(cx - 0.03 * k, cy - 0.03 * k, cw + 0.06 * k, ch + 0.06 * k);
  const sg = g.createLinearGradient(0, cy, 0, cy + ch); sg.addColorStop(0, '#7fb8e6'); sg.addColorStop(1, '#d8eefa');
  g.fillStyle = sg; g.fillRect(cx, cy, cw, ch);
  g.fillStyle = '#6aa84f'; g.fillRect(cx, cy + ch * 0.74, cw, ch * 0.26);
  g.fillStyle = '#f4f1ea'; g.fillRect(cx + cw * 0.2, cy + ch * 0.42, cw * 0.6, ch * 0.34);
  [[0.22, 0.12], [0.5, 0.2], [0.78, 0.12]].forEach(([fx, tw])=>{ const tx = cx + cw * fx; g.fillStyle = '#f4f1ea'; g.fillRect(tx - cw * tw / 2, cy + ch * 0.3, cw * tw, ch * 0.46); g.fillStyle = '#3f5aa0'; g.beginPath(); g.moveTo(tx - cw * tw * 0.65, cy + ch * 0.32); g.lineTo(tx, cy + ch * (fx === 0.5 ? 0.02 : 0.1)); g.lineTo(tx + cw * tw * 0.65, cy + ch * 0.32); g.closePath(); g.fill(); });
  g.fillStyle = '#7a3a2a'; g.fillRect(cx + cw * 0.46, cy + ch * 0.6, cw * 0.08, ch * 0.16);
  g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(cx + cw * 0.86, cy + ch * 0.16, ch * 0.08, 0, 7); g.fill();
  /* its palette on the ledge */
  g.fillStyle = '#e9d3a8'; g.beginPath(); g.ellipse(x + w * 0.7, y + h * 0.6, w * 0.16, h * 0.04, 0, 0, 7); g.fill();
  ['#e0393e', '#3c6fc4', '#f2c23a'].forEach((c, i)=>{ g.fillStyle = c; g.beginPath(); g.arc(x + w * (0.62 + i * 0.07), y + h * 0.598, Math.max(1, 0.03 * k), 0, 7); g.fill(); });
}
/* a thing that never moves, drawn once at a size and kept */
function still(draw, pad){
  return (g, d, x, y, w, h, k)=>{
    const kc = Math.max(4, Math.min(PIC_MAX_S, Math.round(k))), M = pad == null ? 0.4 : pad;
    const cv = pic(`d:${d.kind}:${d.x},${d.y}:${d.n || 0}@${kc}`, (d.w + 2 * M) * kc, (d.h + 2 * M) * kc, g2=> draw(g2, d, M * kc, M * kc, d.w * kc, d.h * kc, kc));
    const s = k / kc;
    g.drawImage(cv, x - M * k, y - M * k, cv.width * s, cv.height * s);
  };
}
const stallPic = still(drawStall, 0.6), planterPic = still(drawPlanter), benchPic = still(drawBench), wellPic = still(drawWell), boardPic = still(drawBoard), easelPic = still(drawEasel);

/* ---------- the pictures, kept: each drawn once at a size, the least lately used let go past a budget ----------
   A building is a picture cut into its squares (8 by 8 at most a piece, so none grows too large, with a rim of
   two pixels of what lies next to it, so no seam shows where the pieces meet); a tower is a picture of its body. */
const PIC_BUDGET = 20e6, PIC_MAX_S = 160, CHUNK = 8, RIM = 2;
const PICS = new Map();
let picPx = 0, picTick = 0;
function pic(key, w, h, draw){
  let e = PICS.get(key);
  if(e){ e.used = ++picTick; return e.cv; }
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h));
  try { draw(cv.getContext('2d')); } catch(err){ console.error('castle picture:', key, err); }
  e = { cv, px:cv.width * cv.height, used:++picTick };
  PICS.set(key, e); picPx += e.px;
  if(picPx > PIC_BUDGET){
    const old = [...PICS.entries()].sort((a, b)=> a[1].used - b[1].used);
    for(const [k2, e2] of old){
      if(picPx <= PIC_BUDGET * 0.8) break;
      if(e2 === e) continue;
      PICS.delete(k2); picPx -= e2.px; e2.cv.width = e2.cv.height = 0;      // let the memory go
    }
  }
  return cv;
}
function bldInfo(id){
  if(id === 'pal') return { w:28, h:12, draw:(g, S)=> drawPalace(g, S) };
  const b = (caGrounds().tags.buildings || [])[id];
  return b ? { w:b.w, h:b.h, draw:(g, S)=> drawHouse(g, b, S) } : null;
}
/* one square of a building ('bld:<i>:<dx>:<dy>' or 'pal:<dx>:<dy>') into (px, py, pw, ph), its picture at a size near S */
function bldSlice(ctx, key, S, px, py, pw, ph){
  const p = key.split(':'), pal = p[0] === 'pal';
  const id = pal ? 'pal' : +p[1], dx = +p[pal ? 1 : 2], dy = +p[pal ? 2 : 3];
  const info = bldInfo(id);
  if(!info) return;
  const s = Math.max(8, Math.min(PIC_MAX_S, Math.round(S)));
  const cx = Math.floor(dx / CHUNK), cy = Math.floor(dy / CHUNK);
  const cw = Math.min(CHUNK, info.w - cx * CHUNK), chh = Math.min(CHUNK, info.h - cy * CHUNK);
  const cv = pic(`b:${id}:${cx},${cy}@${s}`, cw * s + 2 * RIM, chh * s + 2 * RIM, g=>{ g.translate(RIM - cx * CHUNK * s, RIM - cy * CHUNK * s); info.draw(g, s); });
  ctx.drawImage(cv, RIM + (dx - cx * CHUNK) * s, RIM + (dy - cy * CHUNK) * s, s, s, px, py, pw, ph);
}
/* a tower: its body from its picture, its pennant drawn now */
function tower(g, d, x, y, w, h, k, t){
  const kc = Math.max(4, Math.min(PIC_MAX_S, Math.round(k))), M = 1.2;
  const cv = pic(`t:${d.kind}:${d.x},${d.y}@${kc}`, (d.w + 2 * M) * kc, (d.h + 2 * M) * kc, g2=> towerBody(g2, d, M * kc, M * kc, d.w * kc, d.h * kc, kc));
  const s = k / kc;
  g.drawImage(cv, x - M * k, y - M * k, cv.width * s, cv.height * s);
  towerFlag(g, d, x, y, w, h, k, t);
}
function picStats(){ return { n:PICS.size, px:picPx, budget:PIC_BUDGET }; }
function picClear(){ PICS.forEach(e=>{ e.cv.width = e.cv.height = 0; }); PICS.clear(); picPx = 0; }

return { bldSlice, tower, chimney:drawChimney, sign:drawSign, banner:drawBanner, lamp:drawLamp, cobble:drawCobble, house:drawHouse, palace:drawPalace,
  stall:stallPic, planter:planterPic, bench:benchPic, well:wellPic, board:boardPic, easel:easelPic, picStats, picClear,
  /* the rooms inside (24-room-art.js) draw with these too */
  util:{ rng, sh, L, mix, GOLD, GOLD_L, GOLD_D, archPath, grain, speckle, pic, still, PIC_MAX_S } };
})();
