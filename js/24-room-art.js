/* ============================================================
   24-room-art.js — INSIDE THE CASTLE, AND THE RECORDS (3.97)
   The designer: "Can you draw me the art for the record stall too
   please? I want it to look detailed, no more placeholders for all art …
   More detail inside the palace would be wonderful :)"
   Each room is drawn whole, as the buildings outside are (23-castle-art.js):
   its floor (polished marble, its veins, a gold stud where four slabs
   meet; long boards, each its own length and shade), its runners and
   rugs, the light falling in from its windows, its walls (plaster over
   panelling, pine logs, the record store's plum paint) and what hangs on
   them — then cut into its squares. What stands in a room (the throne,
   the columns, the banquet tables, the bookcases, the beds, the bar, the
   record bins…) is drawn once at a size and kept; only what moves (a
   flame, a spinning record, a jukebox's lights, a pendulum) is drawn
   each time. And the records: a sleeve for each, its picture its own,
   and the disc inside it.
   One name outside: CA_ROOM.
   ============================================================ */
const CA_ROOM = (function(){
const { rng, sh, L, mix, GOLD, GOLD_L, GOLD_D, archPath, grain, speckle, pic, still, PIC_MAX_S, stones, moss } = CA_ART.util;
const T = CA_T;
const WALLS = new Set([T.IWALL, T.WOODWALL, T.VOID]);
const wallAt = (m, x, y)=> WALLS.has(caAt(m, x, y));                 // off the map is wall too
const keyAt = (m, x, y)=> (x < 0 || y < 0 || x >= m.W || y >= m.H) ? '' : (m.spr[y * m.W + x] || '');
const partAt = (m, x, y)=>{ const k = keyAt(m, x, y), i = k.indexOf(':'); return i < 0 ? '' : k.slice(i + 1); };
const TAU = Math.PI * 2;
const rr = (g, x, y, w, h, r)=>{ g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); else g.rect(x, y, w, h); };
const ell = (g, x, y, rx, ry, c)=>{ g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); g.fill(); };
const circ = (g, x, y, r, c)=>{ g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); g.fill(); };
const lin = (g, x0, y0, x1, y1, stops)=>{ const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c])=> gr.addColorStop(o, c)); return gr; };
const rad = (g, x, y, r0, r1, stops)=>{ const gr = g.createRadialGradient(x, y, Math.max(0, r0), x, y, Math.max(0.1, r1)); stops.forEach(([o, c])=> gr.addColorStop(o, c)); return gr; };
const shadow = (g, cx, cy, rx, ry, a)=> ell(g, cx, cy, rx, ry, `rgba(20,12,6,${a == null ? 0.22 : a})`);

/* ---------- what a room is made of: its walls' faces, its runners, its rugs (found once) ----------
   A wall square with floor below it is a wall's face, seen from the front; the square above that one is
   the upper part of the same wall when it is wall too (rows 0 and 1 of a room: a wall two squares high).
   A face with floor above it as well is a thin wall: its top, then its face. */
function info(m){
  if(m._ri) return m._ri;
  const W = m.W, H = m.H, lv = new Uint8Array(W * H), thin = new Uint8Array(W * H);
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    if(!wallAt(m, x, y) || wallAt(m, x, y + 1)) continue;
    lv[y * W + x] = 1;
    if(y > 0 && !wallAt(m, x, y - 1)) thin[y * W + x] = 1;
    else if(y > 0 && (y - 2 < 0 || wallAt(m, x, y - 2)) && !lv[(y - 1) * W + x]) lv[(y - 1) * W + x] = 2;
  }
  const comps = (test)=>{
    const seen = new Uint8Array(W * H), out = [];
    for(let i = 0; i < W * H; i++){
      if(seen[i] || !test(m.spr[i] || '', i)) continue;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      const st = [i]; seen[i] = 1;
      while(st.length){
        const v = st.pop(), x = v % W, y = (v - x) / W;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=>{ const a = x + dx, b = y + dy, u = b * W + a;
          if(a >= 0 && b >= 0 && a < W && b < H && !seen[u] && test(m.spr[u] || '', u)){ seen[u] = 1; st.push(u); } });
      }
      out.push({ x:x0, y:y0, w:x1 - x0 + 1, h:y1 - y0 + 1 });
    }
    return out;
  };
  const runners = comps((k)=> k.startsWith('carpet'));
  const rugs = comps((k)=> k.startsWith('rug:'));
  const stairs = comps((k, i)=> m.g[i] === T.STAIRS);                 // found whole here: a piece of the picture may hold only part of one
  /* the windows (their light falls across the floor below), the throne's drape */
  const windows = [], drapes = [];
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    if(lv[y * W + x] !== 1) continue;
    const p = partAt(m, x, y);
    if(p === 'window') windows.push({ x, y });
    if(p === 'drape' && partAt(m, x - 1, y) !== 'drape'){ let w = 1; while(partAt(m, x + w, y) === 'drape') w++; drapes.push({ x, y, w }); }
  }
  return (m._ri = { lv, thin, runners, rugs, stairs, windows, drapes });
}
const lvAt = (m, I, x, y)=> (x < 0 || y < 0 || x >= m.W || y >= m.H) ? 0 : I.lv[y * m.W + x];

/* ---------- the palettes ---------- */
const PAL = {
  royal:   { plaster:'#f3e8d3', motif:'rgba(176,132,52,.20)', wains:'#6f4128', wainsL:'#8d5634', wainsD:'#4a2a18', rail:GOLD, cap:'#d9c8a6', capL:'#f1e5c8', capD:'#b39c74', kind:'damask' },
  princess:{ plaster:'#f8dfe8', motif:'rgba(222,112,158,.24)', wains:'#f3f0f4', wainsL:'#ffffff', wainsD:'#d6c6d6', rail:GOLD, cap:'#e9d2dc', capL:'#fbeef3', capD:'#c7a9b8', kind:'hearts' },
  dauphin: { plaster:'#dbe4f4', motif:'rgba(64,96,170,.20)', wains:'#34507f', wainsL:'#4a6aa3', wainsD:'#22385c', rail:GOLD, cap:'#cfd7e6', capL:'#ecf1fa', capD:'#a6b2c8', kind:'stars' },
  tavern:  { log:'#b9773f', logL:'#d9a066', logD:'#7a4622', chink:'#e9d3a8', wains:'#7c4d2a', wainsL:'#99653a', wainsD:'#55321a', rail:'#5a3a22', cap:'#4b2f1b', capL:'#6f4a2c', capD:'#2e1c10', plank:'#c08a55' },
  records: { paint:'#4a2b5c', paintL:'#5c3a72', paintD:'#331d42', wains:'#5a3720', wainsL:'#7a4d2e', wainsD:'#3a2312', rail:'#c9a24a', cap:'#2b1f31', capL:'#463350', capD:'#160f1a', plank:'#a7703f' },
};
/* which palette a wall square of this room has */
function palOf(m, x, y, lvl){
  if(m.room === 'tavern') return PAL.tavern;
  if(m.room === 'records') return PAL.records;
  /* a wall's face is papered as the room it faces: the floor at its foot */
  const fy = y + (lvl === 2 ? 2 : 1);
  if(m.room === 'tower' && fy <= 10){ if(x <= 10) return PAL.princess; if(x >= 20) return PAL.dauphin; }
  return PAL.royal;
}
/* a wall's top is the house's stone whatever the room (a bedroom's own colours are on its walls' faces) */
const capOf = (m)=> m.room === 'tavern' ? PAL.tavern : m.room === 'records' ? PAL.records : PAL.royal;

/* ============================================================
   FLOORS
   ============================================================ */
function marble(g, m, x, y, s){
  const X = x * s, Y = y * s, alt = (x + y) & 1, R = rng(4100 + x * 131 + y * 977);
  g.fillStyle = alt ? '#ede1dc' : '#f8f3ea'; g.fillRect(X, Y, s, s);
  /* clouds in the stone */
  for(let i = 0; i < 4; i++){ g.fillStyle = alt ? 'rgba(196,160,160,.10)' : 'rgba(214,196,164,.11)'; g.beginPath(); g.ellipse(X + R() * s, Y + R() * s, s * (0.18 + R() * 0.25), s * (0.08 + R() * 0.12), R() * 3, 0, TAU); g.fill(); }
  /* its veins */
  g.lineCap = 'round';
  for(let i = 0; i < 2; i++){
    g.strokeStyle = alt ? `rgba(150,104,112,${0.18 + R() * 0.12})` : `rgba(168,146,120,${0.16 + R() * 0.12})`; g.lineWidth = Math.max(0.6, s * (0.008 + R() * 0.01));
    const a = R(), b = R();
    g.beginPath(); g.moveTo(X, Y + a * s); g.bezierCurveTo(X + s * 0.3, Y + (a + (R() - 0.5) * 0.5) * s, X + s * 0.7, Y + (b + (R() - 0.5) * 0.5) * s, X + s, Y + b * s); g.stroke();
    if(R() < 0.5){ g.lineWidth *= 0.6; g.beginPath(); g.moveTo(X + s * 0.5, Y + (a + b) / 2 * s); g.quadraticCurveTo(X + s * (0.5 + R() * 0.3), Y + s * R(), X + s * (0.7 + R() * 0.3), Y + s * R()); g.stroke(); }
  }
  /* bevel: a little light along the top and left, a hairline of shade at the bottom and right */
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(X, Y, s, L(s, 0.018)); g.fillRect(X, Y, L(s, 0.018), s);
  g.fillStyle = 'rgba(110,90,70,.20)'; g.fillRect(X, Y + s - L(s, 0.016), s, L(s, 0.016)); g.fillRect(X + s - L(s, 0.016), Y, L(s, 0.016), s);
  /* a soft shine */
  g.fillStyle = lin(g, X, Y, X + s, Y + s, [[0, 'rgba(255,255,255,.16)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(X, Y, s, s);
}
/* a gold stud where four slabs meet */
function studs(g, m, s, R0){
  for(let y = Math.max(1, R0.y0); y <= Math.min(m.H - 1, R0.y1); y++) for(let x = Math.max(1, R0.x0); x <= Math.min(m.W - 1, R0.x1); x++){
    if(wallAt(m, x, y) || wallAt(m, x - 1, y) || wallAt(m, x, y - 1) || wallAt(m, x - 1, y - 1)) continue;
    const X = x * s, Y = y * s, r = s * 0.06;
    g.fillStyle = GOLD_D; g.beginPath(); g.moveTo(X, Y - r * 1.25); g.lineTo(X + r * 1.25, Y); g.lineTo(X, Y + r * 1.25); g.lineTo(X - r * 1.25, Y); g.closePath(); g.fill();
    g.fillStyle = GOLD; g.beginPath(); g.moveTo(X, Y - r); g.lineTo(X + r, Y); g.lineTo(X, Y + r); g.lineTo(X - r, Y); g.closePath(); g.fill();
    g.fillStyle = GOLD_L; g.beginPath(); g.moveTo(X, Y - r); g.lineTo(X + r * 0.45, Y - r * 0.2); g.lineTo(X - r * 0.2, Y + r * 0.2); g.closePath(); g.fill();
  }
}
/* long boards across a room, three to a square, each its own length and shade; the joints staggered */
function planks(g, m, s, R0, base){
  const bh = s / 3, x1 = R0.x1 + 1;
  for(let r = Math.max(0, R0.y0 * 3); r < Math.min(m.H, R0.y1 + 1) * 3; r++){
    const R = rng(91000 + r * 7919);
    let at = -R() * 3, i = 0;
    while(at < x1){
      const len = 1.3 + R() * 2.4, v = (R() - 0.5) * 0.16, seed = R();
      if(at + len > R0.x0 - 1){
        const X = at * s, Y = r * bh, W = len * s, Rb = rng(Math.floor(seed * 1e9));
        g.fillStyle = sh(base, v); g.fillRect(X, Y, W, bh);
        g.fillStyle = lin(g, 0, Y, 0, Y + bh, [[0, 'rgba(255,236,200,.16)'], [0.45, 'rgba(255,236,200,0)'], [1, 'rgba(40,20,5,.14)']]); g.fillRect(X, Y, W, bh);
        grain(g, X + 2, Y + bh * 0.12, Math.max(2, W - 4), bh * 0.76, Rb, Math.max(3, Math.round(len * 3)), 'rgba(60,30,10,.16)');
        if(Rb() < 0.35){ const kx = X + W * (0.2 + Rb() * 0.6), ky = Y + bh * (0.35 + Rb() * 0.3); ell(g, kx, ky, bh * 0.2, bh * 0.12, 'rgba(70,36,12,.30)'); ell(g, kx, ky, bh * 0.08, bh * 0.05, 'rgba(50,24,8,.45)'); }
        g.fillStyle = 'rgba(48,24,8,.55)'; g.fillRect(X + W - L(s, 0.012), Y, L(s, 0.012), bh);    // the joint
        g.fillStyle = 'rgba(40,20,6,.45)';
        [X + s * 0.1, X + W - s * 0.12].forEach(nx=>{ g.fillRect(nx, Y + bh * 0.28, L(s, 0.018), L(s, 0.018)); g.fillRect(nx, Y + bh * 0.62, L(s, 0.018), L(s, 0.018)); });
      }
      at += len; i++;
    }
    g.fillStyle = 'rgba(48,24,8,.45)'; g.fillRect((R0.x0 - 1) * s, (r + 1) * bh - L(s, 0.01), (R0.x1 - R0.x0 + 3) * s, L(s, 0.014));
  }
}

/* ---------- runners: the long carpets, crimson and gold ---------- */
function runner(g, r, s, o){
  o = o || {};
  const v = r.h >= r.w, X = r.x * s, Y = r.y * s, W = r.w * s, H = r.h * s;
  const inset = s * 0.05;
  g.save();
  const x = X + inset, y = Y + (o.topIn != null ? o.topIn * s : inset), w = W - 2 * inset, h = H - (o.topIn != null ? o.topIn * s : inset) - inset;
  g.fillStyle = o.base || '#9b1d31'; g.fillRect(x, y, w, h);
  g.fillStyle = v ? lin(g, x, 0, x + w, 0, [[0, 'rgba(0,0,0,.18)'], [0.2, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.2)']]) : lin(g, 0, y, 0, y + h, [[0, 'rgba(0,0,0,.18)'], [0.2, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.2)']]);
  g.fillRect(x, y, w, h);
  /* its borders: a band of gold, a dark line, a fine gold line */
  const bw = Math.min(w, h) * (o.wide ? 0.07 : 0.11);
  g.strokeStyle = GOLD; g.lineWidth = bw; g.strokeRect(x + bw / 2, y + bw / 2, w - bw, h - bw);
  g.strokeStyle = 'rgba(90,60,10,.6)'; g.lineWidth = L(s, 0.012); g.strokeRect(x + bw, y + bw, w - 2 * bw, h - 2 * bw);
  g.strokeStyle = GOLD_L; g.lineWidth = L(s, 0.014); g.strokeRect(x + bw * 1.9, y + bw * 1.9, w - 3.8 * bw, h - 3.8 * bw);
  /* a little row of studs in the gold band */
  g.fillStyle = sh(o.base || '#9b1d31', -0.25);
  const along = v ? h : w, n = Math.floor(along / (s * 0.25));
  for(let i = 0; i < n; i++){
    const a = (i + 0.5) / n;
    if(v){ circ(g, x + bw / 2, y + a * h, bw * 0.18, '#7a1426'); circ(g, x + w - bw / 2, y + a * h, bw * 0.18, '#7a1426'); }
    else { circ(g, x + a * w, y + bw / 2, bw * 0.18, '#7a1426'); circ(g, x + a * w, y + h - bw / 2, bw * 0.18, '#7a1426'); }
  }
  /* its field: a chain of medallions down the middle, little fleurons either side */
  const cx = x + w / 2, cy = y + h / 2;
  const step = s * (o.wide ? 1.5 : 1), m0 = v ? y : x, m1 = v ? y + h : x + w;
  const first = m0 + step / 2 + ((m1 - m0) % step) / 2;
  for(let p = first; p < m1 - step * 0.3; p += step){
    const px = v ? cx : p, py = v ? p : cy, R = Math.min(w, h) * (o.wide ? 0.13 : 0.27);
    g.fillStyle = 'rgba(244,214,120,.30)'; g.beginPath(); g.moveTo(px, py - R * (v ? 1.35 : 1)); g.lineTo(px + R * (v ? 1 : 1.35), py); g.lineTo(px, py + R * (v ? 1.35 : 1)); g.lineTo(px - R * (v ? 1 : 1.35), py); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(250,224,140,.65)'; g.lineWidth = L(s, 0.014); g.stroke();
    g.fillStyle = 'rgba(40,40,110,.55)'; g.beginPath(); g.moveTo(px, py - R * 0.62); g.lineTo(px + R * 0.62, py); g.lineTo(px, py + R * 0.62); g.lineTo(px - R * 0.62, py); g.closePath(); g.fill();
    for(let k = 0; k < 4; k++){ const a = k * Math.PI / 2; circ(g, px + Math.cos(a) * R * 0.32, py + Math.sin(a) * R * 0.32, R * 0.12, 'rgba(250,224,140,.85)'); }
    circ(g, px, py, R * 0.12, '#f6dc8c');
    if(o.wide){
      /* the hall's: fleurons in the side fields between */
      [-1, 1].forEach(sd=>{
        const fx = v ? cx + sd * w * 0.27 : p + step / 2, fy = v ? p + step / 2 : cy + sd * h * 0.27;
        if((v ? fy : fx) > m1 - bw * 2) return;
        g.fillStyle = 'rgba(250,224,140,.42)';
        g.beginPath(); g.ellipse(fx, fy - s * 0.06, s * 0.035, s * 0.07, 0, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(fx - s * 0.06, fy, s * 0.06, s * 0.03, 0.5, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(fx + s * 0.06, fy, s * 0.06, s * 0.03, -0.5, 0, TAU); g.fill();
        circ(g, fx, fy + s * 0.04, s * 0.025, 'rgba(250,224,140,.55)');
      });
    }
  }
  /* fringe at an end that lies on the floor */
  const fr = (fx, fy, horiz)=>{
    g.strokeStyle = GOLD_L; g.lineWidth = L(s, 0.012);
    const nn = Math.floor((horiz ? w : h) / (s * 0.06));
    for(let i = 0; i <= nn; i++){ const a = i / nn; g.beginPath(); if(horiz){ g.moveTo(x + a * w, fy); g.lineTo(x + a * w + s * 0.01, fy + s * 0.07 * (fy > y ? 1 : -1)); } else { g.moveTo(fx, y + a * h); g.lineTo(fx + s * 0.07 * (fx > x ? 1 : -1), y + a * h); } g.stroke(); }
  };
  if(o.fringe){ if(v){ if(o.fringe.includes('t')) fr(0, y, true); if(o.fringe.includes('b')) fr(0, y + h, true); } else { if(o.fringe.includes('l')) fr(x, 0, false); if(o.fringe.includes('r')) fr(x + w, 0, false); } }
  /* a little wear down the middle, where everyone walks */
  g.fillStyle = v ? lin(g, cx - w * 0.2, 0, cx + w * 0.2, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,230,230,.05)'], [1, 'rgba(255,255,255,0)']]) : 'rgba(255,255,255,0)';
  g.fillRect(x, y, w, h);
  g.restore();
}

/* ---------- rugs ---------- */
function rugPrincess(g, r, s){
  const X = r.x * s + s * 0.08, Y = r.y * s + s * 0.08, W = r.w * s - s * 0.16, H = r.h * s - s * 0.16, cx = X + W / 2, cy = Y + H / 2;
  shadow(g, cx, cy + s * 0.03, W * 0.5, H * 0.5, 0.12);
  /* a scalloped edge, pink, a ring of flowers, a heart in the middle */
  const n = 22;
  g.fillStyle = '#f2a6c4'; g.beginPath();
  for(let i = 0; i <= n * 2; i++){ const a = i / (n * 2) * TAU, rr0 = i % 2 ? 1 : 0.94; g.lineTo(cx + Math.cos(a) * W / 2 * rr0, cy + Math.sin(a) * H / 2 * rr0); }
  g.fill();
  ell(g, cx, cy, W * 0.44, H * 0.44, '#fbd3e2');
  g.strokeStyle = '#ffffff'; g.lineWidth = L(s, 0.02); g.setLineDash([s * 0.05, s * 0.04]); g.beginPath(); g.ellipse(cx, cy, W * 0.4, H * 0.4, 0, 0, TAU); g.stroke(); g.setLineDash([]);
  for(let i = 0; i < 10; i++){
    const a = i / 10 * TAU, fx = cx + Math.cos(a) * W * 0.32, fy = cy + Math.sin(a) * H * 0.32;
    for(let k = 0; k < 5; k++){ const b = k / 5 * TAU; circ(g, fx + Math.cos(b) * s * 0.05, fy + Math.sin(b) * s * 0.05, s * 0.04, i % 2 ? '#ffffff' : '#c98ad8'); }
    circ(g, fx, fy, s * 0.03, '#f6d36a');
  }
  g.fillStyle = '#e8578f'; const hs = s * 0.3;
  g.beginPath(); g.moveTo(cx, cy + hs * 0.8); g.bezierCurveTo(cx - hs * 1.3, cy - hs * 0.1, cx - hs * 0.55, cy - hs * 1.1, cx, cy - hs * 0.35); g.bezierCurveTo(cx + hs * 0.55, cy - hs * 1.1, cx + hs * 1.3, cy - hs * 0.1, cx, cy + hs * 0.8); g.fill();
  ell(g, cx - hs * 0.35, cy - hs * 0.4, hs * 0.16, hs * 0.1, 'rgba(255,255,255,.55)');
}
/* a woven rug, Scandinavian: stripes, a band of diamonds, a fringe at its ends */
function rugNordic(g, r, s){
  const X = r.x * s + s * 0.1, Y = r.y * s + s * 0.12, W = r.w * s - s * 0.2, H = r.h * s - s * 0.24;
  shadow(g, X + W / 2, Y + H / 2 + s * 0.04, W * 0.52, H * 0.52, 0.12);
  g.fillStyle = '#efe4cf'; g.fillRect(X, Y, W, H);
  const bands = [['#b8342b', 0.0, 0.08], ['#1f3c66', 0.1, 0.04], ['#b8342b', 0.86, 0.04], ['#1f3c66', 0.92, 0.08]];
  bands.forEach(([c, a, b])=>{ g.fillStyle = c; g.fillRect(X, Y + H * a, W, H * b); });
  /* the diamonds */
  const n = Math.max(3, Math.round(W / (s * 0.5))), dw = W / n;
  for(let i = 0; i < n; i++){
    const dx = X + dw * (i + 0.5), dy = Y + H * 0.48;
    g.fillStyle = '#b8342b'; g.beginPath(); g.moveTo(dx, dy - H * 0.26); g.lineTo(dx + dw * 0.42, dy); g.lineTo(dx, dy + H * 0.26); g.lineTo(dx - dw * 0.42, dy); g.closePath(); g.fill();
    g.fillStyle = '#efe4cf'; g.beginPath(); g.moveTo(dx, dy - H * 0.15); g.lineTo(dx + dw * 0.24, dy); g.lineTo(dx, dy + H * 0.15); g.lineTo(dx - dw * 0.24, dy); g.closePath(); g.fill();
    circ(g, dx, dy, dw * 0.07, '#1f3c66');
    g.fillStyle = '#1f3c66'; [-1, 1].forEach(sd=>{ g.fillRect(dx + sd * dw * 0.5 - dw * 0.04, dy - H * 0.04, dw * 0.08, H * 0.08); });
  }
  /* little stitches: the weave */
  g.fillStyle = 'rgba(60,40,20,.10)'; for(let yy = Y; yy < Y + H; yy += L(s, 0.03) * 2) g.fillRect(X, yy, W, L(s, 0.012));
  g.strokeStyle = '#efe4cf'; g.lineWidth = L(s, 0.014);
  for(let xx = X + s * 0.03; xx < X + W; xx += s * 0.06){ g.beginPath(); g.moveTo(xx, Y); g.lineTo(xx + s * 0.01, Y - s * 0.07); g.moveTo(xx, Y + H); g.lineTo(xx - s * 0.01, Y + H + s * 0.07); g.stroke(); }
}
/* a round rug, braided, before the fire */
function rugBraid(g, cx, cy, rx, ry, s){
  shadow(g, cx, cy + s * 0.04, rx * 1.02, ry * 1.02, 0.12);
  const cols = ['#a8452e', '#d8b07a', '#6b7f4a', '#c46a3c', '#e3cfa2', '#7a4a2e'];
  for(let i = 0; i < 9; i++){
    const f = 1 - i / 9;
    ell(g, cx, cy, rx * f, ry * f, cols[i % cols.length]);
    g.strokeStyle = 'rgba(40,20,8,.25)'; g.lineWidth = L(s, 0.01); g.setLineDash([s * 0.03, s * 0.025]);
    g.beginPath(); g.ellipse(cx, cy, rx * (f - 0.05), ry * (f - 0.05), 0, 0, TAU); g.stroke(); g.setLineDash([]);
  }
}
/* a rug of the record store: a record, black and grooved, its label pink */
function rugVinyl(g, cx, cy, rx, ry, s){
  shadow(g, cx, cy + s * 0.05, rx * 1.02, ry * 1.02, 0.18);
  ell(g, cx, cy, rx, ry, '#17141b');
  g.lineWidth = L(s, 0.012);
  for(let i = 0; i < 16; i++){ const f = 0.96 - i * 0.04; g.strokeStyle = i % 3 ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.13)'; g.beginPath(); g.ellipse(cx, cy, rx * f, ry * f, 0, 0, TAU); g.stroke(); }
  /* the shine on the grooves */
  g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.clip();
  g.fillStyle = 'rgba(255,255,255,.10)';
  g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, Math.max(rx, ry), -2.2, -1.6); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, Math.max(rx, ry), 0.9, 1.5); g.closePath(); g.fill();
  g.restore();
  ell(g, cx, cy, rx * 0.34, ry * 0.34, '#e8578f');
  ell(g, cx, cy, rx * 0.3, ry * 0.3, '#f07aa6');
  g.fillStyle = '#ffffff'; g.font = `900 ${Math.round(s * 0.16)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('MELODY', cx, cy - ry * 0.13);
  g.font = `700 ${Math.round(s * 0.1)}px sans-serif`; g.fillText('♪  RECORDS  ♪', cx, cy + ry * 0.12);
  ell(g, cx, cy, s * 0.05, s * 0.035, '#17141b');
}
/* a rug of the library, deep blue, worked all over */
function rugPersian(g, r, s, col){
  const X = r.x * s, Y = r.y * s, W = r.w * s, H = r.h * s, c = col || '#24406e';
  shadow(g, X + W / 2, Y + H / 2 + s * 0.04, W * 0.52, H * 0.52, 0.12);
  g.fillStyle = c; g.fillRect(X, Y, W, H);
  g.strokeStyle = '#b8862e'; g.lineWidth = s * 0.12; g.strokeRect(X + s * 0.06, Y + s * 0.06, W - s * 0.12, H - s * 0.12);
  g.strokeStyle = '#7a1e2c'; g.lineWidth = s * 0.05; g.strokeRect(X + s * 0.15, Y + s * 0.15, W - s * 0.3, H - s * 0.3);
  g.fillStyle = '#e9d29a';
  for(let xx = X + s * 0.2; xx < X + W - s * 0.1; xx += s * 0.2){ g.fillRect(xx, Y + s * 0.045, s * 0.04, s * 0.03); g.fillRect(xx, Y + H - s * 0.075, s * 0.04, s * 0.03); }
  const cx = X + W / 2, cy = Y + H / 2;
  g.fillStyle = '#7a1e2c'; g.beginPath(); g.moveTo(cx, cy - H * 0.3); g.lineTo(cx + W * 0.3, cy); g.lineTo(cx, cy + H * 0.3); g.lineTo(cx - W * 0.3, cy); g.closePath(); g.fill();
  g.fillStyle = '#e9d29a'; g.beginPath(); g.moveTo(cx, cy - H * 0.2); g.lineTo(cx + W * 0.2, cy); g.lineTo(cx, cy + H * 0.2); g.lineTo(cx - W * 0.2, cy); g.closePath(); g.fill();
  ell(g, cx, cy, W * 0.08, H * 0.08, c);
  [[0.22, 0.22], [0.78, 0.22], [0.22, 0.78], [0.78, 0.78]].forEach(([a, b])=>{ ell(g, X + W * a, Y + H * b, s * 0.14, s * 0.1, '#b8862e'); ell(g, X + W * a, Y + H * b, s * 0.06, s * 0.045, '#7a1e2c'); });
  g.strokeStyle = '#e9d29a'; g.lineWidth = L(s, 0.012);
  for(let yy = Y + s * 0.04; yy < Y + H; yy += s * 0.06){ g.beginPath(); g.moveTo(X, yy); g.lineTo(X - s * 0.07, yy + s * 0.01); g.moveTo(X + W, yy); g.lineTo(X + W + s * 0.07, yy + s * 0.01); g.stroke(); }
}

/* a doormat by the way out: bristles, a border, WELCOME */
function doormat(g, r, s){
  const X = r.x * s, Y = r.y * s, W = r.w * s, H = r.h * s;
  shadow(g, X + W / 2, Y + H / 2 + s * 0.03, W * 0.52, H * 0.55, 0.15);
  g.fillStyle = '#b8864a'; rr(g, X, Y, W, H, s * 0.06); g.fill();
  const R = rng(9900 + Math.round(r.x * 10));
  for(let i = 0; i < 60; i++){ g.fillStyle = R() < 0.5 ? 'rgba(90,50,20,.25)' : 'rgba(255,230,180,.18)'; g.fillRect(X + R() * W, Y + R() * H, L(s, 0.02), L(s, 0.02)); }
  g.strokeStyle = '#7a4a22'; g.lineWidth = s * 0.05; rr(g, X + s * 0.06, Y + s * 0.06, W - s * 0.12, H - s * 0.12, s * 0.04); g.stroke();
  g.fillStyle = '#6b3e1e'; g.font = `900 ${Math.round(s * 0.2)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('WELCOME', X + W / 2, Y + H / 2 + s * 0.01, W * 0.8);
}

/* ---------- the dais, the stairs ---------- */
function dais(g, m, r, s){
  const X = r.x * s, Y = r.y * s, W = r.w * s, H = r.h * s;
  /* its top: the marble, raised and a shade warmer, in a gold frame */
  g.fillStyle = 'rgba(255,244,222,.38)'; g.fillRect(X, Y, W, H);
  g.strokeStyle = GOLD; g.lineWidth = s * 0.05; g.strokeRect(X + s * 0.25, Y + s * 0.2, W - s * 0.5, H - s * 0.8);
  g.strokeStyle = 'rgba(160,120,40,.5)'; g.lineWidth = L(s, 0.012); g.strokeRect(X + s * 0.33, Y + s * 0.28, W - s * 0.66, H - s * 0.96);
}
/* its two steps down to the hall: from above, each step's tread, and the riser below it facing you; where the carpet
   runs up them, crimson treads and darker risers, a gold stair rod at each */
function daisSteps(g, m, r, s){
  const X = r.x * s, Y = r.y * s, W = r.w * s, H = r.h * s, by = Y + H;
  const c = r.carpet, cx0 = c ? (c.x + 0.05) * s : 0, cx1 = c ? (c.x + c.w - 0.05) * s : 0;
  const band = (y0, hh, stone, rug)=>{
    g.fillStyle = stone; g.fillRect(X, y0, W, hh);
    if(c){ g.fillStyle = rug; g.fillRect(cx0, y0, cx1 - cx0, hh); }
  };
  /* the top step's lip, its riser, the lower tread, its riser */
  band(by - s * 0.56, s * 0.04, '#fffaf0', '#c23a52');
  band(by - s * 0.52, s * 0.14, '#d8ccb6', '#76132a');
  band(by - s * 0.38, s * 0.2, '#f3ece0', '#9b1d31');
  band(by - s * 0.38, s * 0.03, '#fffaf0', '#c23a52');
  band(by - s * 0.18, s * 0.14, '#cdbfa6', '#6a1024');
  /* a little shade at the foot of each riser, the gold edging along the steps */
  g.fillStyle = 'rgba(40,24,10,.18)'; g.fillRect(X, by - s * 0.4, W, s * 0.03); g.fillRect(X, by - s * 0.06, W, s * 0.06);
  g.fillStyle = GOLD; g.fillRect(X, by - s * 0.56, W, L(s, 0.018)); g.fillRect(X, by - s * 0.38, W, L(s, 0.018));
  if(c){
    /* the carpet's gold border down the steps, and the stair rods */
    g.fillStyle = GOLD; g.fillRect(cx0, by - s * 0.56, s * 0.1, s * 0.56); g.fillRect(cx1 - s * 0.1, by - s * 0.56, s * 0.1, s * 0.56);
    [by - s * 0.53, by - s * 0.2].forEach(ry=>{
      g.fillStyle = GOLD_D; g.fillRect(cx0 - s * 0.08, ry, cx1 - cx0 + s * 0.16, s * 0.045);
      g.fillStyle = GOLD_L; g.fillRect(cx0 - s * 0.08, ry, cx1 - cx0 + s * 0.16, L(s, 0.014));
      circ(g, cx0 - s * 0.08, ry + s * 0.022, s * 0.035, GOLD); circ(g, cx1 + s * 0.08, ry + s * 0.022, s * 0.035, GOLD);
    });
  }
  /* the dais's sides: a moulded edge */
  g.fillStyle = 'rgba(120,96,70,.35)'; g.fillRect(X, Y, s * 0.06, H); g.fillRect(X + W - s * 0.06, Y, s * 0.06, H);
  g.fillStyle = GOLD; g.fillRect(X + s * 0.06, Y, L(s, 0.016), H - s * 0.56); g.fillRect(X + W - s * 0.06 - L(s, 0.016), Y, L(s, 0.016), H - s * 0.56);
  g.fillStyle = lin(g, 0, by, 0, by + s * 0.25, [[0, 'rgba(30,20,10,.22)'], [1, 'rgba(30,20,10,0)']]); g.fillRect(X, by, W, s * 0.25);
}
function stairsUp(g, r, s){
  const X = r.x * s, Y = r.y * s, W = r.w * s, H = r.h * s, n = r.h * 3;
  g.fillStyle = '#d8cfbf'; g.fillRect(X, Y, W, H);
  for(let i = 0; i < n; i++){
    const yy = Y + H * i / n, f = i / n;
    g.fillStyle = mix('#a99b86', '#efe7da', f); g.fillRect(X, yy, W, H / n * 0.62);
    g.fillStyle = mix('#7c6e5c', '#c9bda8', f); g.fillRect(X, yy + H / n * 0.62, W, H / n * 0.38);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(X, yy, W, L(s, 0.014));
  }
  g.fillStyle = lin(g, 0, Y, 0, Y + H * 0.5, [[0, 'rgba(20,12,4,.45)'], [1, 'rgba(20,12,4,0)']]); g.fillRect(X, Y, W, H * 0.5);
  /* the balustrades, a gold rail along each */
  [X, X + W - s * 0.16].forEach(bx=>{
    g.fillStyle = '#efe6d8'; g.fillRect(bx, Y, s * 0.16, H);
    for(let yy = Y + s * 0.1; yy < Y + H; yy += s * 0.2){ g.fillStyle = '#cfc3ae'; g.fillRect(bx + s * 0.03, yy, s * 0.1, s * 0.05); }
    g.fillStyle = GOLD; g.fillRect(bx + s * 0.05, Y, s * 0.06, H);
    g.fillStyle = GOLD_L; g.fillRect(bx + s * 0.06, Y, L(s, 0.015), H);
  });
  [X, X + W - s * 0.2].forEach(bx=>{ g.fillStyle = '#efe6d8'; g.fillRect(bx, Y + H - s * 0.3, s * 0.2, s * 0.3); g.fillStyle = GOLD; circ(g, bx + s * 0.1, Y + H - s * 0.3, s * 0.08, GOLD); circ(g, bx + s * 0.08, Y + H - s * 0.32, s * 0.03, GOLD_L); });
}
function stairsDown(g, r, s){
  const X = r.x * s, Y = r.y * s, W = r.w * s, H = r.h * s, n = r.h * 3;
  for(let i = 0; i < n; i++){
    const yy = Y + H * i / n, f = i / n;
    g.fillStyle = mix('#e9e1d2', '#4a4038', f); g.fillRect(X, yy, W, H / n * 0.7);
    g.fillStyle = mix('#b9ad98', '#2a241f', f); g.fillRect(X, yy + H / n * 0.7, W, H / n * 0.3);
  }
  g.fillStyle = lin(g, 0, Y, 0, Y + H, [[0, 'rgba(10,6,4,0)'], [1, 'rgba(10,6,4,.6)']]); g.fillRect(X, Y, W, H);
  [X, X + W - s * 0.14].forEach(bx=>{ g.fillStyle = '#efe6d8'; g.fillRect(bx, Y - s * 0.1, s * 0.14, H + s * 0.1); g.fillStyle = GOLD; g.fillRect(bx + s * 0.04, Y - s * 0.1, s * 0.06, H + s * 0.1); });
}

/* ============================================================
   WALLS
   ============================================================ */
/* the top of a wall, seen from above, its edges moulded where they meet a room */
function wallTop(g, m, x, y, s, p){
  const X = x * s, Y = y * s, R = rng(5200 + x * 71 + y * 313);
  g.fillStyle = p.cap; g.fillRect(X, Y, s, s);
  if(m.room === 'tavern'){ grain(g, X, Y, s, s, R, 6, 'rgba(0,0,0,.25)'); }
  else { for(let i = 0; i < 3; i++){ g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(X + R() * s, Y + R() * s, s * (0.2 + R() * 0.3), s * 0.06); } }
  const e = s * 0.1;
  if(!wallAt(m, x - 1, y)){ g.fillStyle = p.capL; g.fillRect(X, Y, e, s); g.fillStyle = p.capD; g.fillRect(X + e, Y, L(s, 0.02), s); }
  if(!wallAt(m, x + 1, y)){ g.fillStyle = p.capD; g.fillRect(X + s - e, Y, e, s); g.fillStyle = p.capL; g.fillRect(X + s - e - L(s, 0.02), Y, L(s, 0.02), s); }
  if(!wallAt(m, x, y - 1) && y > 0){ g.fillStyle = p.capL; g.fillRect(X, Y, s, e); g.fillStyle = p.capD; g.fillRect(X, Y + e, s, L(s, 0.02)); }
  if(m.room !== 'tavern' && m.room !== 'records' && (!wallAt(m, x - 1, y) || !wallAt(m, x + 1, y))){ g.fillStyle = GOLD; g.fillRect(X + s * 0.46, Y, s * 0.08, s); }
}
/* the classic face: plaster above, a gold chair rail, panelling below, a skirting board */
function plasterArea(g, X, Y, w, h, p, x, y){
  g.fillStyle = p.plaster; g.fillRect(X, Y, w, h);
  g.fillStyle = lin(g, 0, Y, 0, Y + h, [[0, 'rgba(255,255,255,.12)'], [1, 'rgba(120,90,50,.08)']]); g.fillRect(X, Y, w, h);
  /* the paper's little figures, half a square apart */
  g.save(); g.beginPath(); g.rect(X, Y, w, h); g.clip();
  const st = w / 2;
  for(let j = -1; j * st < h + st; j++) for(let i = 0; i < 3; i++){
    const fx = X + i * st + (j & 1 ? st / 2 : 0) - st / 4, fy = Y + j * st + st / 2;
    g.fillStyle = p.motif;
    if(p.kind === 'hearts'){ const r = st * 0.13; g.beginPath(); g.moveTo(fx, fy + r); g.bezierCurveTo(fx - r * 1.6, fy - r * 0.2, fx - r * 0.6, fy - r * 1.4, fx, fy - r * 0.4); g.bezierCurveTo(fx + r * 0.6, fy - r * 1.4, fx + r * 1.6, fy - r * 0.2, fx, fy + r); g.fill(); }
    else if(p.kind === 'stars'){ const r = st * 0.14; g.beginPath(); for(let k = 0; k < 10; k++){ const a = k / 10 * TAU - Math.PI / 2, q = k % 2 ? r * 0.42 : r; g.lineTo(fx + Math.cos(a) * q, fy + Math.sin(a) * q); } g.fill(); }
    else {
      const r = st * 0.16;
      g.beginPath(); g.ellipse(fx, fy - r * 0.5, r * 0.32, r * 0.75, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(fx - r * 0.55, fy, r * 0.6, r * 0.25, 0.6, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(fx + r * 0.55, fy, r * 0.6, r * 0.25, -0.6, 0, TAU); g.fill();
      g.fillRect(fx - r * 0.45, fy + r * 0.25, r * 0.9, r * 0.16);
    }
  }
  g.restore();
}
function faceClassic(g, m, x, y, s, lvl, thin){
  const p = palOf(m, x, y, lvl), X = x * s, Y = y * s;
  if(lvl === 2){
    plasterArea(g, X, Y, s, s, p, x, y);
    /* the cornice: gold and cream mouldings under the ceiling */
    g.fillStyle = sh(p.plaster, -0.12); g.fillRect(X, Y, s, s * 0.2);
    g.fillStyle = p.plaster; g.fillRect(X, Y + s * 0.03, s, s * 0.06);
    for(let i = 0; i < 4; i++){ g.fillStyle = sh(p.plaster, -0.22); g.fillRect(X + i * s / 4 + s * 0.05, Y + s * 0.1, s * 0.14, s * 0.06); }
    g.fillStyle = GOLD; g.fillRect(X, Y + s * 0.18, s, s * 0.035);
    g.fillStyle = 'rgba(80,50,10,.25)'; g.fillRect(X, Y + s * 0.215, s, L(s, 0.012));
    return;
  }
  let top = 0;
  if(thin){
    top = s * THIN_CAP;
    g.fillStyle = p.cap; g.fillRect(X, Y, s, top);
    g.fillStyle = p.capL; g.fillRect(X, Y, s, s * 0.06);
    g.fillStyle = GOLD; g.fillRect(X, Y + top - s * 0.05, s, s * 0.035);
  }
  const FY = Y + top, fh = s - top;
  plasterArea(g, X, FY, s, fh * 0.6, p, x, y);
  /* the chair rail */
  g.fillStyle = p.rail; g.fillRect(X, FY + fh * 0.6, s, fh * 0.045);
  g.fillStyle = 'rgba(255,240,190,.6)'; g.fillRect(X, FY + fh * 0.6, s, L(s, 0.012));
  /* a panel */
  const py0 = FY + fh * 0.645, ph = fh * 0.27;
  g.fillStyle = p.wains; g.fillRect(X, py0, s, ph);
  const ix = X + s * 0.12, iy = py0 + ph * 0.18, iw = s * 0.76, ih = ph * 0.62;
  g.fillStyle = p.wainsD; g.fillRect(ix, iy, iw, L(s, 0.02)); g.fillRect(ix, iy, L(s, 0.02), ih);
  g.fillStyle = p.wainsL; g.fillRect(ix, iy + ih - L(s, 0.02), iw, L(s, 0.02)); g.fillRect(ix + iw - L(s, 0.02), iy, L(s, 0.02), ih);
  if(p !== PAL.princess){ g.strokeStyle = 'rgba(217,178,71,.55)'; g.lineWidth = L(s, 0.01); g.strokeRect(ix + s * 0.04, iy + ih * 0.15, iw - s * 0.08, ih * 0.7); }
  /* the skirting */
  g.fillStyle = sh(p.wains, -0.35); g.fillRect(X, FY + fh * 0.915, s, fh * 0.085);
  g.fillStyle = 'rgba(217,178,71,.8)'; g.fillRect(X, FY + fh * 0.915, s, L(s, 0.014));
}

/* ---------- what hangs on a palace wall ---------- */
/* the span of a face square, top and bottom, where a hanging thing may reach: up into the wall's upper square if it has one */
const THIN_CAP = 0.18, railOf = (th)=> th ? THIN_CAP + (1 - THIN_CAP) * 0.6 : 0.6;
function span(m, I, x, y, s){
  const up = lvAt(m, I, x, y - 1) === 2, th = I.thin[y * m.W + x];
  return { top:(up ? (y - 1 + 0.26) : (y + (th ? THIN_CAP + 0.04 : 0.06))) * s, rail:(y + railOf(th)) * s, X:x * s, up, th };
}
function winClassic(g, m, I, x, y, s){
  const sp = span(m, I, x, y, s), cx = sp.X + s / 2, w = s * 0.5, top = sp.top + s * 0.1, bot = sp.rail - s * 0.04, h = bot - top;
  /* the curtains' shadow, the stone round it */
  g.fillStyle = 'rgba(80,60,30,.18)'; archPath(g, cx - w / 2 - s * 0.07, top - s * 0.02, w + s * 0.18, h + s * 0.08, true); g.fill();
  g.fillStyle = '#efe4cc'; archPath(g, cx - w / 2 - s * 0.08, top - s * 0.06, w + s * 0.16, h + s * 0.08, true); g.fill();
  g.fillStyle = GOLD; archPath(g, cx - w / 2 - s * 0.03, top - s * 0.02, w + s * 0.06, h + s * 0.04, true); g.fill();
  /* the glass: the sky, a little cloud, the light on it */
  g.fillStyle = lin(g, 0, top, 0, bot, [[0, '#7fb6e8'], [0.6, '#bfe0f6'], [1, '#e8f5fb']]); archPath(g, cx - w / 2, top, w, h, true); g.fill();
  g.save(); archPath(g, cx - w / 2, top, w, h, true); g.clip();
  ell(g, cx - w * 0.15, top + h * 0.55, w * 0.3, h * 0.05, 'rgba(255,255,255,.75)');
  ell(g, cx + w * 0.2, top + h * 0.5, w * 0.2, h * 0.04, 'rgba(255,255,255,.65)');
  g.fillStyle = '#7dbb63'; g.fillRect(cx - w / 2, bot - h * 0.12, w, h * 0.12);
  /* the stained glass in its arch */
  const ar = w / 2, acy = top + ar;
  const cols = ['#c8343a', '#f2c23a', '#3c6fc4', '#3f9d5a', '#9a6be0', '#f2c23a'];
  for(let i = 0; i < 6; i++){ g.fillStyle = cols[i]; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(cx, acy); g.arc(cx, acy, ar, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); g.closePath(); g.fill(); }
  g.globalAlpha = 1; circ(g, cx, acy, ar * 0.32, '#fff2b0');
  g.strokeStyle = GOLD_D; g.lineWidth = L(s, 0.014);
  for(let i = 1; i < 6; i++){ const a = Math.PI + i * Math.PI / 6; g.beginPath(); g.moveTo(cx, acy); g.lineTo(cx + Math.cos(a) * ar, acy + Math.sin(a) * ar); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(cx - w * 0.38, bot); g.lineTo(cx - w * 0.18, acy); g.lineTo(cx - w * 0.06, acy); g.lineTo(cx - w * 0.26, bot); g.closePath(); g.fill();
  g.restore();
  /* the lead: a mullion, transoms */
  g.fillStyle = GOLD_D; g.fillRect(cx - L(s, 0.018), acy, L(s, 0.036), bot - acy);
  [0.45, 0.72].forEach(f=> g.fillRect(cx - w / 2, acy + (bot - acy) * f, w, L(s, 0.024)));
  g.fillRect(cx - w / 2, acy - L(s, 0.012), w, L(s, 0.024));
  /* the sill */
  g.fillStyle = '#f6eedc'; g.fillRect(cx - w / 2 - s * 0.1, bot, w + s * 0.2, s * 0.05); g.fillStyle = 'rgba(80,60,30,.3)'; g.fillRect(cx - w / 2 - s * 0.1, bot + s * 0.05, w + s * 0.2, L(s, 0.012));
  /* the curtains, crimson, tied back with gold */
  const curtain = (sd)=>{
    const ex = cx + sd * (w / 2 + s * 0.13), ix = cx + sd * (w / 2 - s * 0.02);
    g.fillStyle = '#9b1d31';
    g.beginPath(); g.moveTo(ex, top - s * 0.12); g.lineTo(ix, top - s * 0.12); g.quadraticCurveTo(ix - sd * s * 0.02, top + h * 0.45, ex - sd * s * 0.02, top + h * 0.55);
    g.quadraticCurveTo(ex - sd * s * 0.04, top + h * 0.75, ex + sd * s * 0.02, bot + s * 0.02); g.lineTo(ex + sd * s * 0.08, bot + s * 0.02); g.lineTo(ex + sd * s * 0.08, top - s * 0.12); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = L(s, 0.012); g.beginPath(); g.moveTo(ex + sd * s * 0.03, top); g.lineTo(ex + sd * s * 0.03, bot); g.stroke();
    g.strokeStyle = 'rgba(255,190,190,.25)'; g.beginPath(); g.moveTo(ex - sd * s * 0.02, top); g.quadraticCurveTo(ex - sd * s * 0.05, top + h * 0.4, ex - sd * s * 0.03, top + h * 0.5); g.stroke();
    circ(g, ex, top + h * 0.55, s * 0.035, GOLD); g.fillStyle = GOLD; g.fillRect(ex - s * 0.01, top + h * 0.55, s * 0.02, s * 0.1); circ(g, ex, top + h * 0.55 + s * 0.11, s * 0.025, GOLD_L);
  };
  curtain(-1); curtain(1);
  /* the pelmet, its fringe */
  g.fillStyle = '#7d1526'; rr(g, cx - w / 2 - s * 0.16, top - s * 0.16, w + s * 0.32, s * 0.1, s * 0.03); g.fill();
  g.fillStyle = GOLD; g.fillRect(cx - w / 2 - s * 0.16, top - s * 0.075, w + s * 0.32, s * 0.02);
  for(let i = 0; i < 9; i++){ const fx = cx - w / 2 - s * 0.14 + i * (w + s * 0.28) / 8; g.fillStyle = GOLD_L; g.fillRect(fx - L(s, 0.008), top - s * 0.06, L(s, 0.016), s * 0.04); }
}
function tapestry(g, m, I, x, y, s, n){
  const sp = span(m, I, x, y, s), cx = sp.X + s / 2, w = s * 0.62, top = sp.top + s * 0.04, bot = sp.rail - s * 0.02, h = bot - top;
  const C = n % 2 ? ['#2a4a8e', '#1e3670', '#3c62ad'] : ['#9b1d31', '#761426', '#b8304a'];
  g.fillStyle = 'rgba(40,20,0,.18)'; g.fillRect(cx - w / 2 + s * 0.03, top + s * 0.03, w, h);
  /* the cloth: a swallow's tail at its foot, folds */
  g.fillStyle = C[0]; g.beginPath(); g.moveTo(cx - w / 2, top); g.lineTo(cx + w / 2, top); g.lineTo(cx + w / 2, bot - h * 0.12); g.lineTo(cx, bot); g.lineTo(cx - w / 2, bot - h * 0.12); g.closePath(); g.fill();
  for(let i = 0; i < 4; i++){ g.fillStyle = i % 2 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.06)'; g.fillRect(cx - w / 2 + i * w / 4, top, w / 8, h * 0.86); }
  g.strokeStyle = GOLD; g.lineWidth = s * 0.03;
  g.beginPath(); g.moveTo(cx - w / 2 + s * 0.05, top + s * 0.04); g.lineTo(cx + w / 2 - s * 0.05, top + s * 0.04); g.lineTo(cx + w / 2 - s * 0.05, bot - h * 0.14); g.lineTo(cx, bot - s * 0.05); g.lineTo(cx - w / 2 + s * 0.05, bot - h * 0.14); g.closePath(); g.stroke();
  /* its device: a crown over a star, or the fairy-flower */
  const dy = top + h * 0.42;
  if(n % 2){
    g.fillStyle = GOLD_L; g.beginPath(); for(let k = 0; k < 16; k++){ const a = k / 16 * TAU - Math.PI / 2, q = k % 2 ? s * 0.07 : s * 0.17; g.lineTo(cx + Math.cos(a) * q, dy + Math.sin(a) * q); } g.closePath(); g.fill();
    circ(g, cx, dy, s * 0.05, C[2]); circ(g, cx, dy, s * 0.025, GOLD_L);
  } else {
    g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx - s * 0.15, dy + s * 0.08); g.lineTo(cx - s * 0.17, dy - s * 0.08); g.lineTo(cx - s * 0.08, dy - s * 0.01); g.lineTo(cx, dy - s * 0.12); g.lineTo(cx + s * 0.08, dy - s * 0.01); g.lineTo(cx + s * 0.17, dy - s * 0.08); g.lineTo(cx + s * 0.15, dy + s * 0.08); g.closePath(); g.fill();
    g.fillStyle = GOLD_L; g.fillRect(cx - s * 0.15, dy + s * 0.05, s * 0.3, s * 0.03);
    circ(g, cx, dy - s * 0.12, s * 0.025, '#f2f2ff'); circ(g, cx - s * 0.17, dy - s * 0.08, s * 0.02, '#f2f2ff'); circ(g, cx + s * 0.17, dy - s * 0.08, s * 0.02, '#f2f2ff');
    circ(g, cx, dy + s * 0.01, s * 0.022, '#c8343a');
  }
  /* the rod, its finials, a tassel */
  g.fillStyle = GOLD_D; g.fillRect(cx - w / 2 - s * 0.08, top - s * 0.03, w + s * 0.16, s * 0.04);
  circ(g, cx - w / 2 - s * 0.08, top - s * 0.01, s * 0.035, GOLD); circ(g, cx + w / 2 + s * 0.08, top - s * 0.01, s * 0.035, GOLD);
  g.fillStyle = GOLD; g.fillRect(cx - L(s, 0.01), bot - s * 0.01, L(s, 0.02), s * 0.05); g.beginPath(); g.moveTo(cx - s * 0.03, bot + s * 0.1); g.lineTo(cx, bot + s * 0.03); g.lineTo(cx + s * 0.03, bot + s * 0.1); g.closePath(); g.fill();
}
/* the portraits: the fairy kings and queens of old, each in a gold frame */
function portrait(g, m, I, x, y, s, n){
  const sp = span(m, I, x, y, s), cx = sp.X + s / 2, w = s * 0.56, h = Math.min(s * 0.74, (sp.rail - sp.top) * 0.78), top = sp.top + ((sp.rail - sp.top) - h) * 0.38;
  g.fillStyle = 'rgba(40,20,0,.22)'; g.fillRect(cx - w / 2 + s * 0.03, top + s * 0.04, w, h);
  g.fillStyle = GOLD_D; g.fillRect(cx - w / 2, top, w, h);
  g.fillStyle = GOLD; g.fillRect(cx - w / 2 + s * 0.02, top + s * 0.02, w - s * 0.04, h - s * 0.04);
  g.fillStyle = GOLD_L; g.fillRect(cx - w / 2 + s * 0.02, top + s * 0.02, w - s * 0.04, L(s, 0.014));
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b])=> circ(g, cx - w / 2 + s * 0.035 + a * (w - s * 0.07), top + s * 0.035 + b * (h - s * 0.07), s * 0.03, GOLD_L));
  const ix = cx - w / 2 + s * 0.07, iy = top + s * 0.07, iw = w - s * 0.14, ih = h - s * 0.14;
  const bgs = [['#3c5a3a', '#1f3220'], ['#5a3a5e', '#2d1d31'], ['#2f4a6e', '#1a2a40']], bg = bgs[n % 3];
  g.fillStyle = lin(g, ix, iy, ix, iy + ih, [[0, bg[0]], [1, bg[1]]]); g.fillRect(ix, iy, iw, ih);
  g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
  const pcx = ix + iw / 2, hy = iy + ih * 0.42, hr = iw * 0.17;
  /* wings, a robe, a face, hair, a crown */
  g.fillStyle = 'rgba(220,240,255,.5)'; [-1, 1].forEach(sd=>{ g.beginPath(); g.ellipse(pcx + sd * iw * 0.3, hy + ih * 0.2, iw * 0.2, ih * 0.16, sd * -0.6, 0, TAU); g.fill(); });
  g.fillStyle = ['#9b1d31', '#2a4a8e', '#3f7d3a'][n % 3]; g.beginPath(); g.moveTo(ix + iw * 0.12, iy + ih); g.quadraticCurveTo(pcx, hy + ih * 0.05, ix + iw * 0.88, iy + ih); g.closePath(); g.fill();
  g.fillStyle = '#f5f0e6'; g.beginPath(); g.moveTo(pcx - iw * 0.18, hy + hr * 1.2); g.lineTo(pcx, hy + hr * 2.4); g.lineTo(pcx + iw * 0.18, hy + hr * 1.2); g.closePath(); g.fill();
  circ(g, pcx, hy + hr * 1.7, hr * 0.18, GOLD);
  const hair = ['#e8c770', '#6b4226', '#d9d9e8'][n % 3];
  if(n % 3 !== 2){ g.fillStyle = hair; g.beginPath(); g.ellipse(pcx, hy + hr * 0.3, hr * 1.25, hr * 1.4, 0, 0, TAU); g.fill(); }
  circ(g, pcx, hy, hr, '#f2d2b4');
  circ(g, pcx - hr * 0.38, hy - hr * 0.05, hr * 0.1, '#3a2a2a'); circ(g, pcx + hr * 0.38, hy - hr * 0.05, hr * 0.1, '#3a2a2a');
  g.strokeStyle = '#a0584a'; g.lineWidth = L(s, 0.01); g.beginPath(); g.arc(pcx, hy + hr * 0.25, hr * 0.35, 0.3, Math.PI - 0.3); g.stroke();
  if(n % 3 === 2){ g.fillStyle = '#e6e6ef'; g.beginPath(); g.moveTo(pcx - hr, hy + hr * 0.2); g.quadraticCurveTo(pcx, hy + hr * 2.2, pcx + hr, hy + hr * 0.2); g.quadraticCurveTo(pcx, hy + hr * 0.9, pcx - hr, hy + hr * 0.2); g.fill(); }
  g.fillStyle = hair; g.beginPath(); g.arc(pcx, hy - hr * 0.1, hr * 1.02, Math.PI, 0); g.fill();
  g.fillStyle = GOLD_L; g.beginPath(); g.moveTo(pcx - hr * 0.8, hy - hr * 0.75); g.lineTo(pcx - hr * 0.85, hy - hr * 1.5); g.lineTo(pcx - hr * 0.4, hy - hr * 1.05); g.lineTo(pcx, hy - hr * 1.65); g.lineTo(pcx + hr * 0.4, hy - hr * 1.05); g.lineTo(pcx + hr * 0.85, hy - hr * 1.5); g.lineTo(pcx + hr * 0.8, hy - hr * 0.75); g.closePath(); g.fill();
  circ(g, pcx, hy - hr * 1.15, hr * 0.12, '#c8343a');
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(ix, iy, iw * 0.4, ih);
  g.restore();
  /* its little plaque */
  g.fillStyle = GOLD; g.fillRect(cx - s * 0.1, top + h - s * 0.05, s * 0.2, s * 0.035);
}
/* a gold sconce and its torch (the flame itself is drawn as it moves: 'flame') */
function sconce(g, m, I, x, y, s){
  const sp = span(m, I, x, y, s), cx = sp.X + s / 2, fy = sp.rail - s * 0.42;
  g.fillStyle = rad(g, cx, fy - s * 0.1, 0, s * 0.85, [[0, 'rgba(255,200,110,.42)'], [0.5, 'rgba(255,180,90,.14)'], [1, 'rgba(255,170,80,0)']]); g.fillRect(cx - s, fy - s, s * 2, s * 2);
  g.fillStyle = GOLD_D; g.beginPath(); g.moveTo(cx - s * 0.1, fy + s * 0.12); g.quadraticCurveTo(cx, fy + s * 0.34, cx + s * 0.1, fy + s * 0.12); g.lineTo(cx + s * 0.08, fy + s * 0.04); g.lineTo(cx - s * 0.08, fy + s * 0.04); g.closePath(); g.fill();
  g.fillStyle = GOLD; rr(g, cx - s * 0.07, fy + s * 0.02, s * 0.14, s * 0.22, s * 0.05); g.fill();
  circ(g, cx, fy + s * 0.13, s * 0.03, '#c8343a');
  g.fillStyle = '#5a3a20'; g.beginPath(); g.moveTo(cx - s * 0.025, fy + s * 0.08); g.lineTo(cx + s * 0.025, fy + s * 0.08); g.lineTo(cx + s * 0.04, fy - s * 0.12); g.lineTo(cx - s * 0.04, fy - s * 0.12); g.closePath(); g.fill();
  g.fillStyle = '#3a2a1a'; rr(g, cx - s * 0.06, fy - s * 0.17, s * 0.12, s * 0.07, s * 0.02); g.fill();
  g.strokeStyle = GOLD_D; g.lineWidth = L(s, 0.012); g.beginPath(); g.moveTo(cx - s * 0.06, fy - s * 0.14); g.lineTo(cx + s * 0.06, fy - s * 0.14); g.stroke();
}
/* the King's canopy behind the throne: a gold crown of a pelmet, crimson velvet falling either side, a field of blue sown with gold */
function drape(g, m, I, d, s){
  const X0 = (d.x - 0.35) * s, X1 = (d.x + d.w + 0.35) * s, cx = (X0 + X1) / 2, W = X1 - X0;
  const sp = span(m, I, d.x, d.y, s), top = sp.top + s * 0.06, bot = (d.y + 1) * s;
  /* the blue field behind */
  g.fillStyle = '#233f7a'; g.fillRect(X0 + W * 0.16, top + s * 0.2, W * 0.68, bot - top - s * 0.2);
  g.fillStyle = 'rgba(244,214,120,.5)';
  for(let yy = top + s * 0.4; yy < bot - s * 0.1; yy += s * 0.28) for(let xx = X0 + W * 0.2 + ((yy / (s * 0.28)) & 1 ? s * 0.14 : 0); xx < X0 + W * 0.82; xx += s * 0.28){
    g.beginPath(); for(let k = 0; k < 8; k++){ const a = k / 8 * TAU, q = k % 2 ? s * 0.018 : s * 0.05; g.lineTo(xx + Math.cos(a) * q, yy + Math.sin(a) * q); } g.closePath(); g.fill();
  }
  /* the sun-and-crown above the throne */
  const ey = top + s * 0.62;
  for(let k = 0; k < 16; k++){ const a = k / 16 * TAU; g.strokeStyle = k % 2 ? GOLD_D : GOLD_L; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(cx + Math.cos(a) * s * 0.18, ey + Math.sin(a) * s * 0.18); g.lineTo(cx + Math.cos(a) * s * (k % 2 ? 0.3 : 0.4), ey + Math.sin(a) * s * (k % 2 ? 0.3 : 0.4)); g.stroke(); }
  circ(g, cx, ey, s * 0.2, GOLD); circ(g, cx, ey, s * 0.15, GOLD_L);
  g.fillStyle = GOLD_D; g.beginPath(); g.moveTo(cx - s * 0.11, ey + s * 0.06); g.lineTo(cx - s * 0.12, ey - s * 0.07); g.lineTo(cx - s * 0.05, ey - s * 0.01); g.lineTo(cx, ey - s * 0.1); g.lineTo(cx + s * 0.05, ey - s * 0.01); g.lineTo(cx + s * 0.12, ey - s * 0.07); g.lineTo(cx + s * 0.11, ey + s * 0.06); g.closePath(); g.fill();
  /* the velvet: swagged across the top, falling either side, tied with gold */
  [-1, 1].forEach(sd=>{
    const ex = sd < 0 ? X0 : X1, ix = cx + sd * W * 0.2;
    g.fillStyle = '#8e1a2d';
    g.beginPath(); g.moveTo(ex, top); g.lineTo(ix, top); g.quadraticCurveTo(cx + sd * W * 0.28, top + (bot - top) * 0.45, ex - sd * W * 0.08, top + (bot - top) * 0.55);
    g.quadraticCurveTo(ex - sd * W * 0.12, top + (bot - top) * 0.8, ex - sd * W * 0.04, bot); g.lineTo(ex, bot); g.closePath(); g.fill();
    for(let i = 1; i < 4; i++){ g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = L(s, 0.016); g.beginPath(); g.moveTo(ex - sd * i * W * 0.035, top); g.quadraticCurveTo(ex - sd * i * W * 0.05, top + (bot - top) * 0.5, ex - sd * i * W * 0.025, bot); g.stroke(); }
    g.strokeStyle = 'rgba(255,170,180,.22)'; g.beginPath(); g.moveTo(ex - sd * W * 0.02, top); g.lineTo(ex - sd * W * 0.02, bot); g.stroke();
    const ty = top + (bot - top) * 0.55;
    g.strokeStyle = GOLD; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(ex, ty - s * 0.04); g.quadraticCurveTo(ex - sd * W * 0.06, ty + s * 0.04, ex - sd * W * 0.1, ty); g.stroke();
    circ(g, ex - sd * W * 0.1, ty, s * 0.04, GOLD_L);
    g.fillStyle = GOLD; g.beginPath(); g.moveTo(ex - sd * W * 0.1 - s * 0.04, ty + s * 0.18); g.lineTo(ex - sd * W * 0.1, ty + s * 0.04); g.lineTo(ex - sd * W * 0.1 + s * 0.04, ty + s * 0.18); g.closePath(); g.fill();
  });
  /* the swags */
  for(let i = 0; i < 3; i++){
    const a = X0 + W * (0.12 + i * 0.26), b = a + W * 0.26;
    g.fillStyle = '#a3263b'; g.beginPath(); g.moveTo(a, top + s * 0.1); g.quadraticCurveTo((a + b) / 2, top + s * 0.5, b, top + s * 0.1); g.lineTo(b, top + s * 0.18); g.quadraticCurveTo((a + b) / 2, top + s * 0.32, a, top + s * 0.18); g.closePath(); g.fill();
    g.strokeStyle = GOLD; g.lineWidth = L(s, 0.02); g.beginPath(); g.moveTo(a, top + s * 0.12); g.quadraticCurveTo((a + b) / 2, top + s * 0.52, b, top + s * 0.12); g.stroke();
  }
  /* the pelmet: a crown of gold */
  g.fillStyle = GOLD_D; g.fillRect(X0 - s * 0.05, top - s * 0.04, W + s * 0.1, s * 0.16);
  g.fillStyle = GOLD; g.fillRect(X0 - s * 0.05, top - s * 0.02, W + s * 0.1, s * 0.11);
  const pts = 7;
  for(let i = 0; i < pts; i++){
    const px = X0 + W * i / (pts - 1);
    g.fillStyle = GOLD; g.beginPath(); g.moveTo(px - s * 0.08, top - s * 0.02); g.lineTo(px, top - s * (i % 2 ? 0.16 : 0.26)); g.lineTo(px + s * 0.08, top - s * 0.02); g.closePath(); g.fill();
    circ(g, px, top - s * (i % 2 ? 0.17 : 0.28), s * 0.035, i === 3 ? '#c8343a' : GOLD_L);
  }
  g.fillStyle = 'rgba(255,240,190,.55)'; g.fillRect(X0 - s * 0.05, top - s * 0.02, W + s * 0.1, L(s, 0.016));
  [0.2, 0.5, 0.8].forEach(f=>{ circ(g, X0 + W * f, top + s * 0.035, s * 0.03, f === 0.5 ? '#3c6fc4' : '#3f9d5a'); });
}
/* the way up the central tower: an arch, its steps going up into it */
function stairArch(g, m, I, x0, w, y, s){
  const X = x0 * s, W = w * s, sp = span(m, I, x0, y, s), top = sp.top + s * 0.05, bot = (y + 1) * s;
  g.fillStyle = '#efe4cc'; archPath(g, X - s * 0.12, top - s * 0.06, W + s * 0.24, bot - top + s * 0.06, true); g.fill();
  g.fillStyle = GOLD; archPath(g, X - s * 0.04, top, W + s * 0.08, bot - top, true); g.fill();
  g.fillStyle = '#2a2018'; archPath(g, X, top + s * 0.04, W, bot - top - s * 0.04, true); g.fill();
  g.save(); archPath(g, X, top + s * 0.04, W, bot - top - s * 0.04, true); g.clip();
  for(let i = 0; i < 6; i++){ const yy = bot - (i + 1) * s * 0.14; g.fillStyle = mix('#8a7c68', '#2a2018', i / 6); g.fillRect(X, yy, W, s * 0.09); }
  g.fillStyle = rad(g, X + W / 2, top + s * 0.4, 0, W * 0.7, [[0, 'rgba(255,200,120,.25)'], [1, 'rgba(255,200,120,0)']]); g.fillRect(X, top, W, bot - top);
  g.restore();
  g.fillStyle = GOLD_L; g.beginPath(); g.moveTo(X + W / 2 - s * 0.08, top - s * 0.06); g.lineTo(X + W / 2 + s * 0.08, top - s * 0.06); g.lineTo(X + W / 2 + s * 0.05, top + s * 0.12); g.lineTo(X + W / 2 - s * 0.05, top + s * 0.12); g.closePath(); g.fill();
}

/* ---------- the tavern's walls: pine logs, chinked; boards below ---------- */
function faceLogs(g, m, x, y, s, lvl){
  const p = PAL.tavern, X = x * s, Y = y * s, R = rng(6100 + x * 53 + y * 17);
  const lh = s * 0.2, rows = 5;
  const bottom = lvl === 1 ? 0.62 : 1;
  for(let i = 0; i < rows * bottom; i++){
    const yy = Y + i * lh, hh = Math.min(lh, Y + s * bottom - yy);
    if(hh <= 0) break;
    const tone = (R() - 0.5) * 0.1;
    g.fillStyle = lin(g, 0, yy, 0, yy + lh, [[0, sh(p.logL, tone)], [0.35, sh(p.log, tone)], [1, sh(p.logD, tone)]]); g.fillRect(X, yy, s, hh);
    grain(g, X, yy + lh * 0.2, s, lh * 0.6, R, 3, 'rgba(70,35,10,.22)');
    if(R() < 0.25){ const kx = X + s * (0.2 + R() * 0.6); ell(g, kx, yy + lh * 0.5, lh * 0.18, lh * 0.14, 'rgba(90,45,15,.45)'); }
    g.fillStyle = p.chink; g.fillRect(X, yy + lh - L(s, 0.022), s, L(s, 0.022));
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X, yy + lh - L(s, 0.03), s, L(s, 0.008));
  }
  if(lvl === 2){
    /* the great beam under the roof */
    g.fillStyle = lin(g, 0, Y, 0, Y + s * 0.26, [[0, '#6b4226'], [1, '#3e2615']]); g.fillRect(X, Y, s, s * 0.26);
    grain(g, X, Y + s * 0.04, s, s * 0.18, R, 4, 'rgba(0,0,0,.25)');
    g.fillStyle = 'rgba(255,220,170,.15)'; g.fillRect(X, Y, s, L(s, 0.016));
    return;
  }
  /* boards below a rail */
  const ry = Y + s * 0.62;
  g.fillStyle = p.rail; g.fillRect(X, ry, s, s * 0.05); g.fillStyle = 'rgba(255,220,170,.25)'; g.fillRect(X, ry, s, L(s, 0.012));
  for(let i = 0; i < 4; i++){ const bx = X + i * s / 4; g.fillStyle = sh(p.wains, (R() - 0.5) * 0.12); g.fillRect(bx, ry + s * 0.05, s / 4, s * 0.31); g.fillStyle = 'rgba(30,15,5,.4)'; g.fillRect(bx + s / 4 - L(s, 0.012), ry + s * 0.05, L(s, 0.012), s * 0.31); }
  g.fillStyle = p.wainsD; g.fillRect(X, Y + s * 0.92, s, s * 0.08);
}
/* a cottage window: four panes, gingham curtains, pots of flowers on the sill, the hills outside */
function winCottage(g, m, I, x, y, s){
  const sp = span(m, I, x, y, s), cx = sp.X + s / 2, w = s * 0.58, top = sp.top + s * 0.12, bot = sp.rail - s * 0.06, h = bot - top;
  g.fillStyle = '#f4efe2'; g.fillRect(cx - w / 2 - s * 0.05, top - s * 0.05, w + s * 0.1, h + s * 0.1);
  g.fillStyle = lin(g, 0, top, 0, bot, [[0, '#8cc4ec'], [0.7, '#d8eef8'], [1, '#f2e8c8']]); g.fillRect(cx - w / 2, top, w, h);
  g.save(); g.beginPath(); g.rect(cx - w / 2, top, w, h); g.clip();
  g.fillStyle = '#6fae5a'; g.beginPath(); g.moveTo(cx - w / 2, bot); g.quadraticCurveTo(cx - w * 0.1, bot - h * 0.5, cx + w / 2, bot - h * 0.2); g.lineTo(cx + w / 2, bot); g.closePath(); g.fill();
  g.fillStyle = '#4f8f45'; g.beginPath(); g.moveTo(cx - w / 2, bot - h * 0.15); g.quadraticCurveTo(cx + w * 0.2, bot - h * 0.32, cx + w / 2, bot); g.lineTo(cx - w / 2, bot); g.closePath(); g.fill();
  g.fillStyle = '#2f5f3a'; g.beginPath(); g.moveTo(cx + w * 0.25, bot - h * 0.65); g.lineTo(cx + w * 0.36, bot - h * 0.22); g.lineTo(cx + w * 0.14, bot - h * 0.22); g.closePath(); g.fill();
  ell(g, cx - w * 0.2, top + h * 0.22, w * 0.18, h * 0.06, 'rgba(255,255,255,.8)');
  g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(cx - w * 0.4, bot); g.lineTo(cx - w * 0.2, top); g.lineTo(cx - w * 0.08, top); g.lineTo(cx - w * 0.28, bot); g.closePath(); g.fill();
  g.restore();
  g.fillStyle = '#f4efe2'; g.fillRect(cx - L(s, 0.02), top, L(s, 0.04), h); g.fillRect(cx - w / 2, top + h / 2 - L(s, 0.02), w, L(s, 0.04));
  /* gingham curtains, a valance */
  const ging = (gx, gy, gw, gh)=>{
    g.fillStyle = '#fff6f0'; g.fillRect(gx, gy, gw, gh);
    g.fillStyle = 'rgba(200,52,58,.45)'; const c = s * 0.045;
    for(let xx = gx; xx < gx + gw; xx += c * 2) g.fillRect(xx, gy, Math.min(c, gx + gw - xx), gh);
    for(let yy = gy; yy < gy + gh; yy += c * 2) g.fillRect(gx, yy, gw, Math.min(c, gy + gh - yy));
  };
  [-1, 1].forEach(sd=>{ const gx = sd < 0 ? cx - w / 2 - s * 0.1 : cx + w / 2 - s * 0.04; ging(gx, top - s * 0.04, s * 0.14, h * 0.7); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(gx + (sd < 0 ? s * 0.11 : 0), top, s * 0.03, h * 0.66); });
  ging(cx - w / 2 - s * 0.1, top - s * 0.1, w + s * 0.2, s * 0.1);
  g.fillStyle = '#5a3a22'; g.fillRect(cx - w / 2 - s * 0.12, top - s * 0.12, w + s * 0.24, s * 0.03);
  /* the sill and its pots */
  g.fillStyle = '#7a4a28'; g.fillRect(cx - w / 2 - s * 0.08, bot, w + s * 0.16, s * 0.05);
  [[-0.3, '#e9548a'], [0.02, '#f5c947'], [0.3, '#ffffff']].forEach(([f, c], i)=>{
    const px = cx + w * f;
    g.fillStyle = '#c0663a'; g.beginPath(); g.moveTo(px - s * 0.06, bot - s * 0.08); g.lineTo(px + s * 0.06, bot - s * 0.08); g.lineTo(px + s * 0.045, bot); g.lineTo(px - s * 0.045, bot); g.closePath(); g.fill();
    for(let k = 0; k < 4; k++) ell(g, px + (k - 1.5) * s * 0.03, bot - s * 0.12 - (k % 2) * s * 0.03, s * 0.03, s * 0.025, '#4f8f45');
    for(let k = 0; k < 3; k++) circ(g, px + (k - 1) * s * 0.035, bot - s * 0.16 - (k % 2) * s * 0.02, s * 0.022, c);
  });
}
/* shelves on the tavern's wall: plates, jars of jam, a teapot, mugs on hooks, herbs drying */
function shelfTavern(g, m, I, x, y, s, n){
  const sp = span(m, I, x, y, s), X = sp.X, s0 = sp.rail - s * 0.62, s1 = sp.rail - s * 0.26;
  [s0, s1].forEach((sy, j)=>{
    g.fillStyle = '#6b4226'; g.fillRect(X + s * 0.04, sy, s * 0.92, s * 0.05); g.fillStyle = 'rgba(255,220,170,.3)'; g.fillRect(X + s * 0.04, sy, s * 0.92, L(s, 0.012));
    g.fillStyle = '#4a2c18'; g.beginPath(); g.moveTo(X + s * 0.1, sy + s * 0.05); g.lineTo(X + s * 0.18, sy + s * 0.05); g.lineTo(X + s * 0.1, sy + s * 0.13); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(X + s * 0.9, sy + s * 0.05); g.lineTo(X + s * 0.82, sy + s * 0.05); g.lineTo(X + s * 0.9, sy + s * 0.13); g.closePath(); g.fill();
    const R = rng(800 + x * 13 + j * 7 + n);
    let px = X + s * 0.1;
    while(px < X + s * 0.86){
      const what = Math.floor(R() * 4), sw = s * (0.13 + R() * 0.05);
      if(px + sw > X + s * 0.9) break;
      if(what === 0){ circ(g, px + sw / 2, sy - sw * 0.5, sw * 0.5, '#f4f1ea'); circ(g, px + sw / 2, sy - sw * 0.5, sw * 0.34, ['#3c6fc4', '#c8343a', '#3f9d5a'][Math.floor(R() * 3)]); circ(g, px + sw / 2, sy - sw * 0.5, sw * 0.22, '#f4f1ea'); }
      else if(what === 1){ const c = ['#c8343a', '#e8862a', '#7a2a6a', '#e8c547'][Math.floor(R() * 4)]; g.fillStyle = 'rgba(240,250,255,.6)'; rr(g, px, sy - sw * 0.9, sw * 0.8, sw * 0.9, sw * 0.12); g.fill(); g.fillStyle = c; rr(g, px + sw * 0.06, sy - sw * 0.62, sw * 0.68, sw * 0.58, sw * 0.08); g.fill(); g.fillStyle = '#fff6f0'; g.fillRect(px - sw * 0.04, sy - sw * 1.02, sw * 0.88, sw * 0.16); g.fillStyle = 'rgba(200,52,58,.6)'; for(let k = 0; k < 3; k++) g.fillRect(px + k * sw * 0.3, sy - sw * 1.02, sw * 0.12, sw * 0.16); }
      else if(what === 2){ ell(g, px + sw * 0.5, sy - sw * 0.38, sw * 0.5, sw * 0.38, '#3c6fc4'); g.fillStyle = '#3c6fc4'; g.fillRect(px + sw * 0.85, sy - sw * 0.55, sw * 0.3, sw * 0.08); ell(g, px + sw * 0.5, sy - sw * 0.76, sw * 0.12, sw * 0.06, '#2a4f8e'); ell(g, px + sw * 0.35, sy - sw * 0.48, sw * 0.1, sw * 0.1, 'rgba(255,255,255,.4)'); }
      else { g.fillStyle = '#e9dcc0'; rr(g, px, sy - sw * 0.7, sw * 0.7, sw * 0.7, sw * 0.08); g.fill(); g.strokeStyle = '#e9dcc0'; g.lineWidth = L(s, 0.02); g.beginPath(); g.arc(px + sw * 0.78, sy - sw * 0.36, sw * 0.16, -1.3, 1.3); g.stroke(); g.fillStyle = '#c8343a'; g.fillRect(px, sy - sw * 0.45, sw * 0.7, sw * 0.08); }
      px += sw + s * 0.03;
    }
  });
  /* herbs hanging under the lower shelf */
  for(let k = 0; k < 3; k++){
    const hx = X + s * (0.22 + k * 0.28), hy = s1 + s * 0.05;
    g.strokeStyle = '#7a5a3a'; g.lineWidth = L(s, 0.01); g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx, hy + s * 0.05); g.stroke();
    for(let j = 0; j < 5; j++) ell(g, hx + (j - 2) * s * 0.018, hy + s * (0.08 + (j % 2) * 0.03), s * 0.02, s * 0.06, k === 1 ? '#9a7ac8' : '#6f9a45');
  }
}
/* a brass lantern on a bracket (its flame: 'flame') */
function lanternWall(g, m, I, x, y, s){
  const sp = span(m, I, x, y, s), cx = sp.X + s / 2, ly = sp.rail - s * 0.46;
  g.fillStyle = rad(g, cx, ly, 0, s * 0.9, [[0, 'rgba(255,196,110,.45)'], [0.5, 'rgba(255,180,90,.14)'], [1, 'rgba(255,170,80,0)']]); g.fillRect(cx - s, ly - s, s * 2, s * 2);
  g.strokeStyle = '#3a2a1a'; g.lineWidth = L(s, 0.025); g.beginPath(); g.moveTo(cx - s * 0.18, ly - s * 0.2); g.lineTo(cx, ly - s * 0.2); g.lineTo(cx, ly - s * 0.14); g.stroke();
  g.fillStyle = '#3a2a1a'; g.fillRect(cx - s * 0.2, ly - s * 0.26, s * 0.04, s * 0.18);
  g.fillStyle = '#b8862e'; g.beginPath(); g.moveTo(cx - s * 0.09, ly - s * 0.08); g.lineTo(cx, ly - s * 0.16); g.lineTo(cx + s * 0.09, ly - s * 0.08); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,230,160,.55)'; g.fillRect(cx - s * 0.07, ly - s * 0.08, s * 0.14, s * 0.16);
  g.strokeStyle = '#8a6420'; g.lineWidth = L(s, 0.014); g.strokeRect(cx - s * 0.07, ly - s * 0.08, s * 0.14, s * 0.16); g.beginPath(); g.moveTo(cx, ly - s * 0.08); g.lineTo(cx, ly + s * 0.08); g.stroke();
  g.fillStyle = '#b8862e'; g.fillRect(cx - s * 0.09, ly + s * 0.08, s * 0.18, s * 0.04);
}
/* a cuckoo clock: a carved little house, its leaves, its face, its weights */
function cuckoo(g, m, I, x, y, s){
  const sp = span(m, I, x, y, s), cx = sp.X + s / 2, top = sp.top + s * 0.18, w = s * 0.4;
  g.fillStyle = '#5a3418'; g.beginPath(); g.moveTo(cx - w * 0.68, top + w * 0.42); g.lineTo(cx, top); g.lineTo(cx + w * 0.68, top + w * 0.42); g.closePath(); g.fill();
  g.fillStyle = '#7a4a26'; g.fillRect(cx - w / 2, top + w * 0.36, w, w * 0.8);
  for(let k = 0; k < 5; k++) ell(g, cx - w * 0.5 + k * w * 0.25, top + w * 0.38, w * 0.12, w * 0.07, '#3f6a2e');
  circ(g, cx, top + w * 0.25, w * 0.08, '#2a1a0a');
  circ(g, cx, top + w * 0.72, w * 0.26, '#f4ecd6'); g.strokeStyle = '#3a2a1a'; g.lineWidth = L(s, 0.012);
  for(let k = 0; k < 12; k++){ const a = k / 12 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * w * 0.2, top + w * 0.72 + Math.sin(a) * w * 0.2); g.lineTo(cx + Math.cos(a) * w * 0.24, top + w * 0.72 + Math.sin(a) * w * 0.24); g.stroke(); }
  g.lineWidth = L(s, 0.018); g.beginPath(); g.moveTo(cx, top + w * 0.72); g.lineTo(cx + w * 0.1, top + w * 0.62); g.moveTo(cx, top + w * 0.72); g.lineTo(cx - w * 0.04, top + w * 0.86); g.stroke();
  g.strokeStyle = '#3a2a1a'; g.lineWidth = L(s, 0.008);
  [-0.15, 0.15].forEach(f=>{ g.beginPath(); g.moveTo(cx + w * f, top + w * 1.16); g.lineTo(cx + w * f, top + w * (f < 0 ? 1.7 : 1.9)); g.stroke(); g.fillStyle = '#8a5a22'; g.beginPath(); g.ellipse(cx + w * f, top + w * (f < 0 ? 1.8 : 2.0), w * 0.07, w * 0.12, 0, 0, TAU); g.fill(); });
}
function pictureFrame(g, m, I, x, y, s){
  const sp = span(m, I, x, y, s), cx = sp.X + s / 2, top = sp.top + s * 0.28, w = s * 0.56, h = s * 0.4;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(cx - w / 2 + s * 0.02, top + s * 0.03, w, h);
  g.fillStyle = '#5a3418'; g.fillRect(cx - w / 2, top, w, h);
  const ix = cx - w / 2 + s * 0.04, iy = top + s * 0.04, iw = w - s * 0.08, ih = h - s * 0.08;
  g.fillStyle = lin(g, 0, iy, 0, iy + ih, [[0, '#9fd0f0'], [1, '#e8f4fa']]); g.fillRect(ix, iy, iw, ih);
  g.fillStyle = '#f4f8ff'; g.beginPath(); g.moveTo(ix, iy + ih * 0.7); g.lineTo(ix + iw * 0.3, iy + ih * 0.2); g.lineTo(ix + iw * 0.5, iy + ih * 0.5); g.lineTo(ix + iw * 0.68, iy + ih * 0.3); g.lineTo(ix + iw, iy + ih * 0.7); g.closePath(); g.fill();
  g.fillStyle = '#8aa0b8'; g.beginPath(); g.moveTo(ix, iy + ih * 0.75); g.lineTo(ix + iw * 0.3, iy + ih * 0.32); g.lineTo(ix + iw * 0.38, iy + ih * 0.42); g.lineTo(ix + iw * 0.22, iy + ih * 0.75); g.closePath(); g.fill();
  g.fillStyle = '#5f9a4a'; g.fillRect(ix, iy + ih * 0.72, iw, ih * 0.28);
  g.fillStyle = '#2f5f3a'; for(let k = 0; k < 4; k++){ const tx = ix + iw * (0.1 + k * 0.22); g.beginPath(); g.moveTo(tx, iy + ih * 0.55); g.lineTo(tx + iw * 0.06, iy + ih * 0.82); g.lineTo(tx - iw * 0.06, iy + ih * 0.82); g.closePath(); g.fill(); }
}
/* the chimney breast over the tavern's hearth: rough stones */
function chimneyStones(g, m, x, y, s, lvl){
  const X = x * s, Y = y * s, R = rng(3300 + x * 17 + y * 5);
  g.fillStyle = '#8a8076'; g.fillRect(X, Y, s, s);
  for(let r = 0; r < 5; r++){
    let xx = X - R() * s * 0.2;
    while(xx < X + s){ const w = s * (0.22 + R() * 0.2); g.fillStyle = sh('#a39a8e', (R() - 0.5) * 0.3); rr(g, xx + L(s, 0.02), Y + r * s / 5 + L(s, 0.02), w - L(s, 0.04), s / 5 - L(s, 0.04), s * 0.04); g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(xx + s * 0.03, Y + r * s / 5 + s * 0.025, w * 0.5, L(s, 0.012)); xx += w; }
  }
  if(lvl === 2){ g.fillStyle = 'rgba(30,20,10,.25)'; g.fillRect(X, Y, s, s * 0.2); }
  if(caAt(m, x - 1, y) !== caAt(m, x, y) || !/chimney/.test(keyAt(m, x - 1, y))){ g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X, Y, s * 0.04, s); }
}

/* ---------- the record store's walls: plum paint, panelling, records on show, posters ---------- */
function facePlum(g, m, x, y, s, lvl){
  const p = PAL.records, X = x * s, Y = y * s;
  g.fillStyle = p.paint; g.fillRect(X, Y, s, s);
  for(let i = 0; i < 4; i++){ g.fillStyle = i % 2 ? p.paintL : p.paintD; g.globalAlpha = 0.25; g.fillRect(X + i * s / 4, Y, s / 8, s); }
  g.globalAlpha = 1;
  if(lvl === 2){
    g.fillStyle = p.paintD; g.fillRect(X, Y, s, s * 0.14);
    g.fillStyle = p.rail; g.fillRect(X, Y + s * 0.14, s, s * 0.025);
    return;
  }
  const ry = Y + s * 0.62;
  g.fillStyle = p.rail; g.fillRect(X, ry, s, s * 0.035);
  g.fillStyle = p.wains; g.fillRect(X, ry + s * 0.035, s, s * 0.3);
  g.fillStyle = p.wainsD; g.fillRect(X + s * 0.1, ry + s * 0.08, s * 0.8, L(s, 0.02)); g.fillRect(X + s * 0.1, ry + s * 0.08, L(s, 0.02), s * 0.2);
  g.fillStyle = p.wainsL; g.fillRect(X + s * 0.1, ry + s * 0.28, s * 0.8, L(s, 0.02)); g.fillRect(X + s * 0.9 - L(s, 0.02), ry + s * 0.08, L(s, 0.02), s * 0.2);
  g.fillStyle = '#24140a'; g.fillRect(X, Y + s * 0.93, s, s * 0.07);
}
/* a ledge of records on show, their sleeves facing out */
function recordWall(g, m, I, x, y, s){
  const sp = span(m, I, x, y, s), X = sp.X;
  const keys = REC_KEYS();
  [sp.rail - s * 0.55, sp.rail - s * 0.08].forEach((ly, j)=>{
    g.fillStyle = '#3a2312'; g.fillRect(X, ly, s, s * 0.05); g.fillStyle = 'rgba(255,220,170,.25)'; g.fillRect(X, ly, s, L(s, 0.012));
    for(let k = 0; k < 2; k++){
      const key = keys[Math.floor(caHash(x * 3 + k, y + j * 7, 11) * keys.length)], cw = s * 0.4, cx0 = X + s * 0.06 + k * s * 0.46, cy0 = ly - cw - s * 0.005;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(cx0 + s * 0.02, cy0 + s * 0.02, cw, cw);
      g.save(); g.translate(cx0, cy0); g.scale(cw / 100, cw / 100); coverArt(g, key, 100); g.restore();
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(cx0 + cw * 0.5, cy0); g.lineTo(cx0, cy0 + cw * 0.5); g.closePath(); g.fill();
    }
  });
}
const POSTERS = [
  { bg:'#f2c23a', fg:'#2b1f31', a:'LIVE!', b:'THE BAND CONCERT', art:'guitar' },
  { bg:'#3fb6c8', fg:'#ffffff', a:'♪ NEW', b:'TIME RIFT · OUT NOW', art:'disc' },
  { bg:'#f07aa6', fg:'#ffffff', a:'DANCE', b:'EVERY SATURDAY', art:'star' },
];
function poster(g, m, I, x, y, s, n){
  const sp = span(m, I, x, y, s), cx = sp.X + s / 2, w = s * 0.62, h = Math.min(s * 0.86, sp.rail - sp.top - s * 0.04), top = sp.rail - h - s * 0.06, P = POSTERS[n % POSTERS.length];
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(cx - w / 2 + s * 0.025, top + s * 0.03, w, h);
  g.fillStyle = P.bg; g.fillRect(cx - w / 2, top, w, h);
  g.save(); g.beginPath(); g.rect(cx - w / 2, top, w, h); g.clip();
  g.fillStyle = 'rgba(255,255,255,.22)'; for(let k = 0; k < 8; k++){ g.beginPath(); g.moveTo(cx, top + h * 0.45); g.arc(cx, top + h * 0.45, h, k / 8 * TAU, k / 8 * TAU + 0.25); g.closePath(); g.fill(); }
  if(P.art === 'guitar'){
    g.fillStyle = '#c8343a'; ell(g, cx, top + h * 0.55, w * 0.2, h * 0.14, '#c8343a'); ell(g, cx, top + h * 0.42, w * 0.15, h * 0.1, '#c8343a');
    circ(g, cx, top + h * 0.5, w * 0.06, '#2b1f31'); g.fillStyle = '#5a3418'; g.fillRect(cx - w * 0.03, top + h * 0.12, w * 0.06, h * 0.32); g.fillStyle = '#2b1f31'; g.fillRect(cx - w * 0.05, top + h * 0.08, w * 0.1, h * 0.07);
  } else if(P.art === 'disc'){
    circ(g, cx, top + h * 0.45, w * 0.32, '#17141b'); circ(g, cx, top + h * 0.45, w * 0.11, '#f2c23a'); circ(g, cx, top + h * 0.45, w * 0.025, '#17141b');
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = L(s, 0.01); [0.18, 0.24, 0.29].forEach(f=>{ g.beginPath(); g.arc(cx, top + h * 0.45, w * f, 0, TAU); g.stroke(); });
  } else {
    g.fillStyle = '#ffffff'; g.beginPath(); for(let k = 0; k < 10; k++){ const a = k / 10 * TAU - Math.PI / 2, q = k % 2 ? w * 0.13 : w * 0.3; g.lineTo(cx + Math.cos(a) * q, top + h * 0.45 + Math.sin(a) * q); } g.closePath(); g.fill();
  }
  g.restore();
  g.fillStyle = P.fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 ${Math.round(s * 0.11)}px sans-serif`; g.fillText(P.a, cx, top + h * 0.12);
  g.font = `800 ${Math.max(5, Math.round(s * 0.05))}px sans-serif`; g.fillText(P.b, cx, top + h * 0.86, w * 0.92);
  g.fillStyle = 'rgba(255,250,220,.75)'; [[-1, -1], [1, -1]].forEach(([a])=>{ g.save(); g.translate(cx + a * w * 0.44, top + s * 0.01); g.rotate(a * 0.6); g.fillRect(-s * 0.05, -s * 0.015, s * 0.1, s * 0.03); g.restore(); });
}
/* a gold record, framed */
function goldRecord(g, m, I, x, y, s){
  const X = x * s, Y = y * s, cx = X + s / 2, cy = Y + s * 0.58, w = s * 0.56;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(cx - w / 2 + s * 0.02, cy - w / 2 + s * 0.03, w, w);
  g.fillStyle = '#1a1420'; g.fillRect(cx - w / 2, cy - w / 2, w, w);
  g.fillStyle = GOLD; g.fillRect(cx - w / 2, cy - w / 2, w, s * 0.03); g.fillRect(cx - w / 2, cy + w / 2 - s * 0.03, w, s * 0.03); g.fillRect(cx - w / 2, cy - w / 2, s * 0.03, w); g.fillRect(cx + w / 2 - s * 0.03, cy - w / 2, s * 0.03, w);
  circ(g, cx, cy - s * 0.03, w * 0.34, GOLD); g.strokeStyle = GOLD_D; g.lineWidth = L(s, 0.008); [0.3, 0.26, 0.22, 0.18].forEach(f=>{ g.beginPath(); g.arc(cx, cy - s * 0.03, w * f, 0, TAU); g.stroke(); });
  circ(g, cx, cy - s * 0.03, w * 0.1, '#c8343a'); circ(g, cx, cy - s * 0.03, w * 0.02, '#1a1420');
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(cx, cy - s * 0.03); g.arc(cx, cy - s * 0.03, w * 0.34, -2.4, -1.9); g.closePath(); g.fill();
  g.fillStyle = GOLD_L; g.fillRect(cx - w * 0.25, cy + w * 0.36, w * 0.5, s * 0.03);
}
/* the sign over the record store's counter: neon, pink and blue */
function neonSign(g, x0, w, y, s){
  const cx = (x0 + w / 2) * s, cy = (y + 0.55) * s;
  g.fillStyle = '#1d1222'; rr(g, x0 * s + s * 0.1, y * s + s * 0.2, w * s - s * 0.2, s * 0.7, s * 0.12); g.fill();
  g.strokeStyle = '#3a2a40'; g.lineWidth = L(s, 0.02); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `italic 900 ${Math.round(s * 0.42)}px Georgia, serif`;
  g.shadowColor = '#ff5fa8'; g.shadowBlur = s * 0.25; g.fillStyle = '#ffd0e6'; g.fillText("Melody's", cx - w * s * 0.14, cy);
  g.shadowColor = '#5fe0ff'; g.font = `900 ${Math.round(s * 0.34)}px sans-serif`; g.fillStyle = '#d8f8ff'; g.fillText('RECORDS', cx + w * s * 0.22, cy + s * 0.02);
  g.shadowBlur = 0;
  g.strokeStyle = '#ff9ccc'; g.lineWidth = L(s, 0.02); g.beginPath(); g.arc(cx - w * s * 0.4, cy, s * 0.13, 0, TAU); g.stroke();
  g.fillStyle = '#ff9ccc'; g.font = `900 ${Math.round(s * 0.2)}px sans-serif`; g.fillText('♪', cx - w * s * 0.4, cy + s * 0.01);
}
/* the string of little lights under the record store's ceiling */
function fairyLights(g, x0, x1, y, s){
  g.strokeStyle = 'rgba(40,30,30,.8)'; g.lineWidth = L(s, 0.012);
  g.beginPath();
  for(let x = x0; x <= x1; x += 0.05){ const yy = (y + 0.08 + 0.1 * Math.abs(Math.sin((x - x0) * Math.PI / 1.5))) * s; x === x0 ? g.moveTo(x * s, yy) : g.lineTo(x * s, yy); }
  g.stroke();
  const cols = ['#ffd36a', '#ff7aa6', '#7ad8ff', '#a6ff8a'];
  for(let x = x0 + 0.25, i = 0; x < x1; x += 0.5, i++){
    const yy = (y + 0.1 + 0.1 * Math.abs(Math.sin((x - x0) * Math.PI / 1.5))) * s;
    g.fillStyle = rad(g, x * s, yy, 0, s * 0.12, [[0, cols[i % 4] + 'aa'], [1, cols[i % 4] + '00']]); g.fillRect(x * s - s * 0.12, yy - s * 0.12, s * 0.24, s * 0.24);
    circ(g, x * s, yy + s * 0.02, s * 0.025, cols[i % 4]);
  }
}

/* ============================================================
   THE ROOM, ALL TOGETHER
   ============================================================ */
const FLOORLESS = new Set([T.STAIRS]);
function paint(g, m, s, R0){
  if(m.painter) return m.painter(g, m, s, R0);                         // (4.25) a room that paints itself (31-huts.js: the tribes' houses)
  if(m.walk) return walkPaint(g, m, s, R0);                            // (3.98) a wall's walk, a rampart (below)
  const I = info(m), room = m.room;
  const inR = (r)=> r.x + r.w >= R0.x0 && r.x <= R0.x1 && r.y + r.h >= R0.y0 && r.y <= R0.y1;
  const xa = Math.max(0, R0.x0), xb = Math.min(m.W - 1, R0.x1), ya = Math.max(0, R0.y0), yb = Math.min(m.H - 1, R0.y1);
  /* the floor */
  if(room === 'tavern' || room === 'records') planks(g, m, s, R0, (room === 'tavern' ? PAL.tavern : PAL.records).plank);
  else {
    for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++) if(!wallAt(m, x, y)) marble(g, m, x, y, s);
    studs(g, m, s, R0);
    (m.tags.inlay || []).forEach(r=>{ if(!inR(r)) return;
      g.strokeStyle = 'rgba(160,110,120,.45)'; g.lineWidth = s * 0.06; g.strokeRect(r.x * s, r.y * s, r.w * s, r.h * s);
      g.strokeStyle = GOLD; g.lineWidth = L(s, 0.02); g.strokeRect(r.x * s - s * 0.05, r.y * s - s * 0.05, r.w * s + s * 0.1, r.h * s + s * 0.1); });
  }
  /* what lies on it */
  const D = m.tags.dais;
  if(D && inR(D)) dais(g, m, D, s);
  I.runners.forEach(r=>{
    /* the hall's runner goes on up the dais's steps to the throne */
    const up = D && D.carpet && r.y === D.y + D.h && r.x === D.carpet.x;
    const rr0 = up ? { x:r.x, y:D.carpet.y, w:r.w, h:r.y + r.h - D.carpet.y } : r;
    if(!inR({ x:rr0.x - 1, y:rr0.y - 1, w:rr0.w + 2, h:rr0.h + 2 })) return;
    const v = r.h >= r.w, wide = r.w >= 3, endT = !up && !wallAt(m, r.x, r.y - 1), endB = !wallAt(m, r.x, r.y + r.h);
    runner(g, rr0, s, { wide, fringe:v ? (endT ? 't' : '') + (endB ? 'b' : '') : (!wallAt(m, r.x - 1, r.y) ? 'l' : '') + (!wallAt(m, r.x + r.w, r.y) ? 'r' : ''), topIn:up ? 0 : null });
  });
  if(D && inR(D)) daisSteps(g, m, D, s);
  I.rugs.forEach(r=>{ if(!inR({ x:r.x - 1, y:r.y - 1, w:r.w + 2, h:r.h + 2 })) return; room === 'tower' ? rugPrincess(g, r, s) : room === 'tavern' ? rugNordic(g, r, s) : rugPersian(g, r, s); });
  (m.tags.floor || []).forEach(f=>{ if(!inR({ x:f.x - 1, y:f.y - 1, w:f.w + 2, h:f.h + 2 })) return;
    if(f.kind === 'vinyl') rugVinyl(g, (f.x + f.w / 2) * s, (f.y + f.h / 2) * s, f.w / 2 * s, f.h / 2 * s, s);
    else if(f.kind === 'braid') rugBraid(g, (f.x + f.w / 2) * s, (f.y + f.h / 2) * s, f.w / 2 * s, f.h / 2 * s, s);
    else if(f.kind === 'persian') rugPersian(g, f, s, f.col);
    else if(f.kind === 'mat') doormat(g, f, s);
  });
  I.stairs.forEach(r=>{ if(inR(r)) (wallAt(m, r.x, r.y - 1) ? stairsUp : stairsDown)(g, r, s); });
  /* the light: through each window, a long pale shaft across the floor; round each lamp, a warm pool */
  g.save();
  g.beginPath();
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++) if(!wallAt(m, x, y) && !FLOORLESS.has(caAt(m, x, y))) g.rect(x * s, y * s, s, s);
  g.clip();
  I.windows.forEach(wd=>{
    if(wd.x + 4 < R0.x0 || wd.x - 1 > R0.x1 || wd.y + 6 < R0.y0 || wd.y > R0.y1) return;
    const x0 = (wd.x + 0.22) * s, x1 = (wd.x + 0.78) * s, y0 = (wd.y + 1) * s, len = (room === 'tavern' ? 2.6 : 3.6) * s, dx = len * 0.42;
    g.fillStyle = lin(g, 0, y0, 0, y0 + len, [[0, 'rgba(255,248,214,.34)'], [0.6, 'rgba(255,248,214,.14)'], [1, 'rgba(255,248,214,0)']]);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 + dx + s * 0.12, y0 + len); g.lineTo(x0 + dx - s * 0.12, y0 + len); g.closePath(); g.fill();
    /* the window's leading, in shadow */
    g.strokeStyle = 'rgba(120,100,60,.10)'; g.lineWidth = s * 0.03;
    g.beginPath(); g.moveTo((x0 + x1) / 2, y0); g.lineTo((x0 + x1) / 2 + dx, y0 + len); g.stroke();
    g.beginPath(); g.moveTo(x0 + dx * 0.45, y0 + len * 0.45); g.lineTo(x1 + dx * 0.45, y0 + len * 0.45); g.stroke();
  });
  (m.tags.glows || []).forEach(gl=>{
    if(gl.x + 3 < R0.x0 || gl.x - 3 > R0.x1 || gl.y + 3 < R0.y0 || gl.y - 3 > R0.y1) return;
    g.fillStyle = rad(g, gl.x * s, gl.y * s, 0, (gl.r || 2) * s, [[0, gl.c || 'rgba(255,190,100,.20)'], [1, 'rgba(255,190,100,0)']]); g.fillRect((gl.x - 3) * s, (gl.y - 3) * s, 6 * s, 6 * s);
  });
  /* the shade under each wall (light from above and to the left) */
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++){
    if(wallAt(m, x, y)) continue;
    const X = x * s, Y = y * s;
    if(wallAt(m, x, y - 1)){ g.fillStyle = lin(g, 0, Y, 0, Y + s * 0.5, [[0, 'rgba(30,18,10,.34)'], [1, 'rgba(30,18,10,0)']]); g.fillRect(X, Y, s, s * 0.5); }
    if(wallAt(m, x - 1, y)){ g.fillStyle = lin(g, X, 0, X + s * 0.3, 0, [[0, 'rgba(30,18,10,.24)'], [1, 'rgba(30,18,10,0)']]); g.fillRect(X, Y, s * 0.3, s); }
    if(wallAt(m, x + 1, y)){ g.fillStyle = lin(g, X + s, 0, X + s * 0.85, 0, [[0, 'rgba(30,18,10,.12)'], [1, 'rgba(30,18,10,0)']]); g.fillRect(X + s * 0.85, Y, s * 0.15, s); }
  }
  g.restore();
  /* the walls: tops, faces, and what hangs on them */
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++){
    if(!wallAt(m, x, y)) continue;
    const i = y * m.W + x, lvl = I.lv[i];
    if(!lvl){ wallTop(g, m, x, y, s, capOf(m)); continue; }
    if(room === 'tavern'){ /chimney/.test(keyAt(m, x, y)) ? chimneyStones(g, m, x, y, s, lvl) : faceLogs(g, m, x, y, s, lvl); }
    else if(room === 'records') facePlum(g, m, x, y, s, lvl);
    else faceClassic(g, m, x, y, s, lvl, I.thin[i]);
  }
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++){
    const i = y * m.W + x;
    if(I.lv[i] !== 1) continue;
    const pt = partAt(m, x, y), kind = pt.split(':')[0], n = parseInt(pt.split(':')[1], 10) || 0;
    if(room === 'tavern'){
      if(kind === 'window') winCottage(g, m, I, x, y, s);
      else if(kind === 'shelf') shelfTavern(g, m, I, x, y, s, n);
      else if(kind === 'lamp') lanternWall(g, m, I, x, y, s);
      else if(kind === 'clock') cuckoo(g, m, I, x, y, s);
      else if(kind === 'picture') pictureFrame(g, m, I, x, y, s);
    } else if(room === 'records'){
      if(kind === 'records') recordWall(g, m, I, x, y, s);
      else if(kind === 'poster') poster(g, m, I, x, y, s, x);
    } else {
      if(caAt(m, x, y + 1) === T.STAIRS) continue;                     // the arch over a stair going up (below)
      if(kind === 'window') winClassic(g, m, I, x, y, s);
      else if(kind === 'tapestry') tapestry(g, m, I, x, y, s, n);
      else if(kind === 'portrait') portrait(g, m, I, x, y, s, x + y);
      else if(kind === 'torch') sconce(g, m, I, x, y, s);
    }
  }
  I.drapes.forEach(d=>{ if(d.x + d.w + 1 >= R0.x0 && d.x - 1 <= R0.x1 && d.y - 1 <= R0.y1 && d.y + 1 >= R0.y0) drape(g, m, I, d, s); });
  if(room !== 'tavern' && room !== 'records') I.stairs.forEach(r=>{ if(lvAt(m, I, r.x, r.y - 1) === 1 && inR({ x:r.x - 1, y:r.y - 2, w:r.w + 2, h:2 })) stairArch(g, m, I, r.x, r.w, r.y - 1, s); });
  /* above the walls' faces: the tavern's herbs, the record store's sign and lights and gold records */
  (m.tags.upper || []).forEach(u=>{
    if(u.x + (u.w || 1) + 1 < R0.x0 || u.x - 1 > R0.x1 || u.y - 1 > R0.y1 || u.y + 1 < R0.y0) return;
    if(u.kind === 'neon') neonSign(g, u.x, u.w, u.y, s);
    else if(u.kind === 'lights') fairyLights(g, u.x, u.x + u.w, u.y, s);
    else if(u.kind === 'gold') goldRecord(g, m, I, u.x, u.y, s);
    else if(u.kind === 'herbs') for(let k = 0; k < (u.w || 1) * 2; k++){
      const hx = (u.x + 0.25 + k * 0.5) * s, hy = (u.y + 0.26) * s, c = ['#6f9a45', '#9a7ac8', '#c9a24a', '#e9e2cf'][k % 4];
      g.strokeStyle = '#3a2a1a'; g.lineWidth = L(s, 0.01); g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx, hy + s * 0.08); g.stroke();
      if(c === '#e9e2cf'){ for(let j = 0; j < 3; j++) circ(g, hx + (j - 1) * s * 0.035, hy + s * (0.14 + (j % 2) * 0.03), s * 0.04, c); }
      else for(let j = 0; j < 6; j++) ell(g, hx + (j - 2.5) * s * 0.016, hy + s * (0.15 + (j % 2) * 0.04), s * 0.018, s * 0.07, c);
      g.fillStyle = '#c8343a'; g.fillRect(hx - s * 0.02, hy + s * 0.07, s * 0.04, s * 0.02);
    }
  });
}

/* one square of a room into (px, py, pw, ph): the room's picture at a size near S, cut in pieces of 4 by 4 squares (a
   piece is drawn when a square of it first comes into view: small pieces waste little past the screen's edge — at an
   iPad's size, 8 by 8 meant some 15 million pixels drawn on walking into the hall, most of them out of sight) */
const CH = 4, RIM = 2;
function slice(ctx, m, x, y, S, px, py, pw, ph){
  const s = Math.max(8, Math.min(PIC_MAX_S, Math.round(S)));
  const cx = Math.floor(x / CH), cy = Math.floor(y / CH);
  const cw = Math.min(CH, m.W - cx * CH), chh = Math.min(CH, m.H - cy * CH);
  const cv = pic(`r:${m.room}:${cx},${cy}@${s}`, cw * s + 2 * RIM, chh * s + 2 * RIM, g=>{
    g.translate(RIM - cx * CH * s, RIM - cy * CH * s);
    paint(g, m, s, { x0:cx * CH - 1, y0:cy * CH - 1, x1:cx * CH + cw, y1:cy * CH + chh });   // a square round it: what reaches over its edge
  });
  ctx.drawImage(cv, RIM + (x - cx * CH) * s, RIM + (y - cy * CH) * s, s, s, px, py, pw, ph);
}

/* ============================================================
   WHAT STANDS IN THE ROOMS
   Each drawn into (x, y, w, h), k the size of a square; its foot about
   at its rect's bottom.
   ============================================================ */
/* a flame, flickering: (cx, by) its foot, r its size */
function flameAt(g, cx, by, r, t, seed){
  const f = 1 + 0.12 * Math.sin(t * 9 + seed * 5.3) + 0.07 * Math.sin(t * 23 + seed * 2.1), lean = Math.sin(t * 5 + seed) * r * 0.12;
  g.fillStyle = rad(g, cx, by - r * 0.8, 0, r * 3.2, [[0, 'rgba(255,200,110,.28)'], [1, 'rgba(255,170,80,0)']]); g.fillRect(cx - r * 3.2, by - r * 4, r * 6.4, r * 6.4);
  g.fillStyle = 'rgba(255,140,40,.9)';
  g.beginPath(); g.moveTo(cx - r * 0.55, by); g.quadraticCurveTo(cx - r * 0.65, by - r * 1.1 * f, cx + lean, by - r * 2.2 * f); g.quadraticCurveTo(cx + r * 0.65, by - r * 1.1 * f, cx + r * 0.55, by); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,230,140,.95)';
  g.beginPath(); g.moveTo(cx - r * 0.3, by); g.quadraticCurveTo(cx - r * 0.35, by - r * 0.8 * f, cx + lean * 0.6, by - r * 1.45 * f); g.quadraticCurveTo(cx + r * 0.35, by - r * 0.8 * f, cx + r * 0.3, by); g.closePath(); g.fill();
  ell(g, cx, by - r * 0.25, r * 0.16, r * 0.3, 'rgba(255,255,240,.95)');
}
/* a candle: (cx, top) its top */
function candle(g, cx, top, w, hh, col){
  g.fillStyle = col || '#fbf6e8'; g.fillRect(cx - w / 2, top, w, hh);
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(cx + w * 0.15, top, w * 0.35, hh);
  g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(cx - w / 2, top, w, Math.max(1, w * 0.25));
  g.fillStyle = '#3a2a1a'; g.fillRect(cx - Math.max(0.5, w * 0.06), top - w * 0.35, Math.max(1, w * 0.12), w * 0.35);
}

/* ---------- the palace ---------- */
function drawThrone(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.93;
  shadow(g, cx, base, w * 0.5, k * 0.18, 0.3);
  /* the steps it stands on */
  g.fillStyle = '#e8dfcf'; rr(g, x + w * 0.04, base - k * 0.3, w * 0.92, k * 0.34, k * 0.05); g.fill();
  g.fillStyle = 'rgba(120,96,70,.35)'; g.fillRect(x + w * 0.04, base - k * 0.1, w * 0.92, k * 0.14);
  g.fillStyle = GOLD; g.fillRect(x + w * 0.04, base - k * 0.3, w * 0.92, k * 0.03);
  /* the back: a tall gold frame, its arch crowned */
  const bx = x + w * 0.18, bw = w * 0.64, bt = y + h * 0.12, bb = base - k * 0.9;
  g.fillStyle = GOLD_D; archPath(g, bx - k * 0.04, bt - k * 0.04, bw + k * 0.08, bb - bt + k * 0.08, true); g.fill();
  g.fillStyle = lin(g, bx, 0, bx + bw, 0, [[0, GOLD_L], [0.4, GOLD], [1, GOLD_D]]); archPath(g, bx, bt, bw, bb - bt, true); g.fill();
  /* the velvet, buttoned */
  const vx = bx + k * 0.14, vw = bw - k * 0.28, vt = bt + k * 0.16, vb = bb - k * 0.04;
  g.fillStyle = '#8e1a2d'; archPath(g, vx, vt, vw, vb - vt, true); g.fill();
  g.save(); archPath(g, vx, vt, vw, vb - vt, true); g.clip();
  g.fillStyle = lin(g, vx, 0, vx + vw, 0, [[0, 'rgba(255,150,160,.18)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.25)']]); g.fillRect(vx, vt, vw, vb - vt);
  for(let r = 0; r < 6; r++) for(let c = 0; c < 4; c++){
    const tx = vx + vw * (c + 0.5 + (r % 2) * 0.5) / 4.5, ty = vt + vw * 0.55 + r * k * 0.22;
    g.strokeStyle = 'rgba(60,0,10,.35)'; g.lineWidth = L(k, 0.012); g.beginPath(); g.moveTo(tx - k * 0.1, ty - k * 0.1); g.lineTo(tx + k * 0.1, ty + k * 0.1); g.moveTo(tx + k * 0.1, ty - k * 0.1); g.lineTo(tx - k * 0.1, ty + k * 0.1); g.stroke();
    circ(g, tx, ty, k * 0.025, GOLD_L);
  }
  g.restore();
  /* the sun at its head, the crown over it */
  const sy = vt + vw * 0.35;
  for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; g.strokeStyle = GOLD_L; g.lineWidth = k * 0.025; g.beginPath(); g.moveTo(cx + Math.cos(a) * k * 0.12, sy + Math.sin(a) * k * 0.12); g.lineTo(cx + Math.cos(a) * k * 0.22, sy + Math.sin(a) * k * 0.22); g.stroke(); }
  circ(g, cx, sy, k * 0.12, GOLD_L); circ(g, cx, sy, k * 0.07, '#c8343a');
  const cy0 = bt - k * 0.06;
  g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx - k * 0.42, cy0 + k * 0.06); g.lineTo(cx - k * 0.46, cy0 - k * 0.3); g.lineTo(cx - k * 0.22, cy0 - k * 0.1); g.lineTo(cx, cy0 - k * 0.42); g.lineTo(cx + k * 0.22, cy0 - k * 0.1); g.lineTo(cx + k * 0.46, cy0 - k * 0.3); g.lineTo(cx + k * 0.42, cy0 + k * 0.06); g.closePath(); g.fill();
  g.fillStyle = GOLD_L; g.fillRect(cx - k * 0.42, cy0 - k * 0.02, k * 0.84, k * 0.07);
  [[-0.46, -0.3], [0, -0.42], [0.46, -0.3]].forEach(([a, b])=> circ(g, cx + a * k, cy0 + b * k, k * 0.05, '#f4f4ff'));
  [-0.2, 0, 0.2].forEach(a=> circ(g, cx + a * k, cy0 + k * 0.02, k * 0.035, a ? '#3c6fc4' : '#c8343a'));
  /* the finials on its posts */
  [bx - k * 0.02, bx + bw + k * 0.02].forEach(px=>{ g.fillStyle = GOLD_D; g.fillRect(px - k * 0.07, bb - k * 1.3, k * 0.14, k * 1.35); g.fillStyle = GOLD; g.fillRect(px - k * 0.05, bb - k * 1.3, k * 0.07, k * 1.35); circ(g, px, bb - k * 1.38, k * 0.1, GOLD); circ(g, px - k * 0.03, bb - k * 1.41, k * 0.035, GOLD_L); });
  /* the seat, its cushion; the arms, curled */
  const st = bb - k * 0.12, sb = base - k * 0.36;
  g.fillStyle = GOLD_D; rr(g, x + w * 0.12, st, w * 0.76, sb - st, k * 0.08); g.fill();
  g.fillStyle = '#a3263b'; rr(g, x + w * 0.2, st - k * 0.06, w * 0.6, k * 0.3, k * 0.12); g.fill();
  g.fillStyle = 'rgba(255,170,180,.3)'; rr(g, x + w * 0.24, st - k * 0.04, w * 0.52, k * 0.08, k * 0.04); g.fill();
  g.strokeStyle = GOLD_L; g.lineWidth = L(k, 0.02); rr(g, x + w * 0.2, st - k * 0.06, w * 0.6, k * 0.3, k * 0.12); g.stroke();
  /* the apron: carved scrolls */
  g.fillStyle = GOLD; g.fillRect(x + w * 0.14, st + k * 0.24, w * 0.72, sb - st - k * 0.24);
  g.strokeStyle = GOLD_D; g.lineWidth = L(k, 0.022);
  for(let i = 0; i < 3; i++){ const sx = x + w * (0.28 + i * 0.22); g.beginPath(); g.arc(sx, st + k * 0.38, k * 0.07, 0.5, TAU - 0.5); g.stroke(); }
  [-1, 1].forEach(sd=>{
    const ax = sd < 0 ? x + w * 0.04 : x + w * 0.96 - k * 0.24;
    g.fillStyle = GOLD; rr(g, ax, st - k * 0.3, k * 0.24, sb - st + k * 0.3, k * 0.08); g.fill();
    g.fillStyle = GOLD_D; g.fillRect(ax + (sd < 0 ? k * 0.16 : 0), st - k * 0.3, k * 0.08, sb - st + k * 0.3);
    circ(g, ax + k * 0.12, st - k * 0.3, k * 0.13, GOLD); g.strokeStyle = GOLD_D; g.lineWidth = L(k, 0.02); g.beginPath(); g.arc(ax + k * 0.12, st - k * 0.3, k * 0.07, 0, 5); g.stroke();
    g.fillStyle = '#a3263b'; rr(g, ax + k * 0.03, st - k * 0.24, k * 0.18, k * 0.2, k * 0.06); g.fill();
    /* a lion's paw for a foot */
    ell(g, ax + k * 0.12, sb + k * 0.02, k * 0.14, k * 0.07, GOLD_D); [-1, 0, 1].forEach(c=> circ(g, ax + k * 0.12 + c * k * 0.07, sb + k * 0.04, k * 0.035, GOLD));
  });
  /* the footstool */
  g.fillStyle = GOLD_D; rr(g, cx - k * 0.32, base - k * 0.3, k * 0.64, k * 0.16, k * 0.04); g.fill();
  g.fillStyle = '#a3263b'; rr(g, cx - k * 0.3, base - k * 0.38, k * 0.6, k * 0.14, k * 0.06); g.fill();
  [-0.22, 0, 0.22].forEach(a=> circ(g, cx + a * k, base - k * 0.31, k * 0.018, GOLD_L));
}
/* the stone a sealed blade is sunk in (its glow drawn as it pulses; the blade itself is its own picture over it) */
function drawBladeStone(g, d, x, y, w, h, k){
  const cx = x + w / 2, top = y + h * 0.7, bot = y + h * 0.95;
  shadow(g, cx, bot, w * 0.42, k * 0.1, 0.3);
  g.fillStyle = '#7d7894'; g.beginPath(); g.moveTo(x + w * 0.12, bot); g.lineTo(x + w * 0.18, top + k * 0.06); g.quadraticCurveTo(cx, top - k * 0.08, x + w * 0.82, top + k * 0.06); g.lineTo(x + w * 0.88, bot); g.closePath(); g.fill();
  g.fillStyle = '#a6a1ba'; g.beginPath(); g.moveTo(x + w * 0.18, top + k * 0.06); g.quadraticCurveTo(cx, top - k * 0.08, x + w * 0.82, top + k * 0.06); g.quadraticCurveTo(cx, top + k * 0.14, x + w * 0.18, top + k * 0.06); g.fill();
  g.strokeStyle = 'rgba(40,36,60,.35)'; g.lineWidth = L(k, 0.014);
  g.beginPath(); g.moveTo(x + w * 0.3, top + k * 0.14); g.lineTo(x + w * 0.36, bot - k * 0.04); g.moveTo(x + w * 0.66, top + k * 0.12); g.lineTo(x + w * 0.6, top + k * 0.24); g.stroke();
  /* a ring of gold, runes */
  g.fillStyle = GOLD_D; g.fillRect(x + w * 0.15, bot - k * 0.12, w * 0.7, k * 0.06);
  const C = { fire:'#ff7a4a', ground:'#e0b070', water:'#7ac4ff', grass:'#7ae07a' }[d.el] || '#fff';
  g.fillStyle = C; g.globalAlpha = 0.8;
  for(let i = 0; i < 4; i++){ const rx = x + w * (0.26 + i * 0.16), ry = top + k * 0.2; g.fillRect(rx - k * 0.012, ry, k * 0.024, k * 0.08); g.fillRect(rx - k * 0.035, ry + k * 0.03, k * 0.07, k * 0.016); }
  g.globalAlpha = 1;
  /* its little cracks of light: where the sword went in */
  ell(g, cx, top + k * 0.03, k * 0.1, k * 0.03, '#2a2433');
}
function bladeGlow(g, d, x, y, w, h, k, t){
  const C = { fire:'255,106,58', ground:'201,160,106', water:'90,180,255', grass:'106,210,106' }[d.el] || '255,255,255';
  const p = 0.45 + 0.2 * Math.sin(t * 2 + d.x);
  g.fillStyle = rad(g, x + w / 2, y + h * 0.42, 0, w * 0.75, [[0, `rgba(${C},${p * 0.7})`], [0.6, `rgba(${C},${p * 0.18})`], [1, `rgba(${C},0)`]]); g.fillRect(x - w * 0.3, y - h * 0.1, w * 1.6, h);
  for(let i = 0; i < 3; i++){ const ph = (t * 0.5 + i / 3 + d.x * 0.1) % 1; circ(g, x + w * (0.3 + 0.4 * ((i * 0.37 + d.x * 0.13) % 1)), y + h * (0.68 - ph * 0.5), k * 0.025 * (1 - ph), `rgba(${C},${1 - ph})`); }
}
function drawColumn(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.985, sw = w * 0.5;
  shadow(g, cx + k * 0.1, base - k * 0.04, w * 0.48, k * 0.1, 0.22);
  /* the plinth and its mouldings */
  g.fillStyle = '#e9e1d2'; g.fillRect(cx - w * 0.44, base - k * 0.24, w * 0.88, k * 0.24);
  g.fillStyle = 'rgba(120,100,80,.25)'; g.fillRect(cx - w * 0.44, base - k * 0.08, w * 0.88, k * 0.08);
  g.fillStyle = GOLD; g.fillRect(cx - w * 0.44, base - k * 0.25, w * 0.88, k * 0.03);
  ell(g, cx, base - k * 0.3, w * 0.36, k * 0.07, '#f4efe4'); ell(g, cx, base - k * 0.38, w * 0.31, k * 0.06, '#e3dacb');
  /* the shaft, fluted, lit from the left */
  const top = y + h * 0.2, bot = base - k * 0.38;
  g.fillStyle = lin(g, cx - sw / 2, 0, cx + sw / 2, 0, [[0, '#fbf8f2'], [0.35, '#ffffff'], [0.7, '#e2dbcd'], [1, '#c9bfae']]); g.fillRect(cx - sw / 2, top, sw, bot - top);
  for(let i = 1; i < 6; i++){ const fx = cx - sw / 2 + sw * i / 6; g.fillStyle = 'rgba(140,124,100,.22)'; g.fillRect(fx - L(k, 0.008), top, L(k, 0.016), bot - top); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(fx + L(k, 0.01), top, L(k, 0.01), bot - top); }
  /* a gold band round it, a garland */
  const gy = top + (bot - top) * 0.62;
  g.fillStyle = GOLD; g.fillRect(cx - sw / 2 - k * 0.01, gy, sw + k * 0.02, k * 0.06); g.fillStyle = GOLD_L; g.fillRect(cx - sw / 2, gy, sw * 0.5, L(k, 0.014));
  g.strokeStyle = '#4f8f45'; g.lineWidth = L(k, 0.03); g.beginPath(); g.moveTo(cx - sw / 2, gy - k * 0.25); g.quadraticCurveTo(cx, gy - k * 0.05, cx + sw / 2, gy - k * 0.25); g.stroke();
  [0.25, 0.5, 0.75].forEach(f=> circ(g, cx - sw / 2 + sw * f, gy - k * 0.25 + Math.sin(f * Math.PI) * k * 0.13, k * 0.03, f === 0.5 ? '#f07aa6' : '#ffffff'));
  /* the capital: acanthus of gold, scrolls at its corners, the slab */
  const ct = y + h * 0.04;
  g.fillStyle = GOLD_D; g.beginPath(); g.moveTo(cx - sw * 0.6, top); g.lineTo(cx - w * 0.5, ct + k * 0.16); g.lineTo(cx + w * 0.5, ct + k * 0.16); g.lineTo(cx + sw * 0.6, top); g.closePath(); g.fill();
  for(let i = 0; i < 5; i++){ const lx = cx - sw * 0.5 + sw * i / 4; g.fillStyle = i % 2 ? GOLD : GOLD_L; g.beginPath(); g.ellipse(lx, top - k * 0.12, k * 0.07, k * 0.14, (i - 2) * 0.25, 0, TAU); g.fill(); }
  [-1, 1].forEach(sd=>{ circ(g, cx + sd * w * 0.42, ct + k * 0.2, k * 0.09, GOLD); g.strokeStyle = GOLD_D; g.lineWidth = L(k, 0.018); g.beginPath(); g.arc(cx + sd * w * 0.42, ct + k * 0.2, k * 0.05, 0, 5); g.stroke(); });
  g.fillStyle = '#efe8dc'; g.fillRect(cx - w * 0.5, ct, w, k * 0.14); g.fillStyle = GOLD; g.fillRect(cx - w * 0.5, ct + k * 0.12, w, k * 0.03);
  g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(cx - w * 0.5, ct, w, L(k, 0.016));
}
/* the banquet table: white linen, a gold runner, places laid, candles, the feast; chairs along its sides */
function drawBanquet(g, d, x, y, w, h, k){
  const tx = x + w * 0.14, tw = w * 0.72, tt = y + k * 0.3, tb = y + h - k * 0.32;
  shadow(g, x + w / 2, tb + k * 0.18, w * 0.5, k * 0.2, 0.2);
  /* the chairs, tucked in on both sides (their backs to the walls) */
  for(let i = 0; i < 6; i++){
    const cyy = tt + k * 0.75 + i * (tb - tt - k * 1.1) / 5;
    [-1, 1].forEach(sd=>{
      const bx = sd < 0 ? x + w * 0.02 : x + w * 0.98 - k * 0.16;
      g.fillStyle = '#5a3418'; g.fillRect(bx + (sd < 0 ? k * 0.1 : -k * 0.04), cyy + k * 0.18, k * 0.08, k * 0.24);
      g.fillStyle = '#8e1a2d'; rr(g, bx + (sd < 0 ? k * 0.05 : -k * 0.06), cyy - k * 0.02, k * 0.18, k * 0.26, k * 0.05); g.fill();
      g.fillStyle = '#6b3e1e'; rr(g, bx, cyy - k * 0.36, k * 0.16, k * 0.6, k * 0.06); g.fill();
      g.fillStyle = '#a3263b'; rr(g, bx + k * 0.035, cyy - k * 0.3, k * 0.09, k * 0.46, k * 0.04); g.fill();
      circ(g, bx + k * 0.08, cyy - k * 0.38, k * 0.04, GOLD);
    });
  }
  /* the table: its cloth hanging in folds over the front end */
  g.fillStyle = '#5a3418'; g.fillRect(tx + k * 0.06, tb - k * 0.05, k * 0.1, k * 0.32); g.fillRect(tx + tw - k * 0.16, tb - k * 0.05, k * 0.1, k * 0.32);
  g.fillStyle = '#fbf8f0'; g.fillRect(tx, tt, tw, tb - tt);
  g.fillStyle = '#ece6d8'; g.beginPath(); g.moveTo(tx, tb); for(let i = 0; i <= 8; i++){ const fx = tx + tw * i / 8; g.lineTo(fx, tb + (i % 2 ? k * 0.2 : k * 0.12)); } g.lineTo(tx + tw, tb); g.closePath(); g.fill();
  g.fillStyle = 'rgba(160,150,130,.25)'; for(let i = 1; i < 8; i += 2) g.fillRect(tx + tw * i / 8 - L(k, 0.01), tb, L(k, 0.02), k * 0.18);
  g.strokeStyle = 'rgba(200,190,170,.6)'; g.lineWidth = L(k, 0.012); g.strokeRect(tx + k * 0.04, tt + k * 0.04, tw - k * 0.08, tb - tt - k * 0.08);
  /* the gold runner, its fringe */
  const rx = tx + tw * 0.38, rw = tw * 0.24;
  g.fillStyle = GOLD; g.fillRect(rx, tt - k * 0.02, rw, tb - tt + k * 0.18);
  g.fillStyle = '#a3263b'; g.fillRect(rx + rw * 0.2, tt, rw * 0.6, tb - tt + k * 0.1);
  g.fillStyle = GOLD_L; for(let yy = tt + k * 0.2; yy < tb; yy += k * 0.4) g.fillRect(rx + rw * 0.45, yy, rw * 0.1, k * 0.1);
  /* the places: plates with gold rims, goblets, knives and forks */
  for(let i = 0; i < 6; i++){
    const py = tt + k * 0.75 + i * (tb - tt - k * 1.1) / 5;
    [tx + tw * 0.17, tx + tw * 0.83].forEach((px, j)=>{
      circ(g, px, py, k * 0.17, 'rgba(0,0,0,.08)'); circ(g, px, py - k * 0.01, k * 0.16, '#ffffff'); g.strokeStyle = GOLD; g.lineWidth = L(k, 0.016); g.beginPath(); g.arc(px, py - k * 0.01, k * 0.13, 0, TAU); g.stroke();
      circ(g, px, py - k * 0.01, k * 0.07, ['#f5d6a0', '#e8b4c8', '#cfe6b0'][(i + j) % 3]);
      g.fillStyle = '#b8b8c8'; g.fillRect(px - k * 0.2, py - k * 0.08, L(k, 0.02), k * 0.16); g.fillRect(px + k * 0.19, py - k * 0.08, L(k, 0.02), k * 0.16);
      const gx = px + (j ? -k * 0.2 : k * 0.2), gy = py - k * 0.2;
      ell(g, gx, gy + k * 0.08, k * 0.05, k * 0.02, 'rgba(180,170,150,.5)'); g.fillStyle = GOLD; g.fillRect(gx - L(k, 0.008), gy, L(k, 0.016), k * 0.08);
      g.fillStyle = 'rgba(160,30,60,.85)'; g.beginPath(); g.moveTo(gx - k * 0.05, gy - k * 0.1); g.lineTo(gx + k * 0.05, gy - k * 0.1); g.lineTo(gx + k * 0.03, gy); g.lineTo(gx - k * 0.03, gy); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(gx - k * 0.04, gy - k * 0.1, L(k, 0.012), k * 0.07);
    });
  }
  /* down the middle: candelabras, a roast, fruit, a cake, bread, flowers */
  const mid = tx + tw / 2, n = Math.floor((tb - tt) / k);
  const dish = (i, yy)=>{
    const kind = (i + Math.round(d.x)) % 5;
    if(kind === 0){ ell(g, mid, yy + k * 0.05, k * 0.24, k * 0.1, '#e8e4dc'); ell(g, mid, yy, k * 0.2, k * 0.13, '#a0522d'); ell(g, mid - k * 0.05, yy - k * 0.04, k * 0.08, k * 0.04, '#c8784a'); [-1, 1].forEach(sd=>{ g.fillStyle = '#f4ecd6'; g.fillRect(mid + sd * k * 0.16, yy - k * 0.02, sd * k * 0.08, k * 0.03); }); for(let j = 0; j < 4; j++) circ(g, mid - k * 0.18 + j * k * 0.12, yy + k * 0.1, k * 0.03, '#6f9a45'); }
    else if(kind === 1){ ell(g, mid, yy + k * 0.06, k * 0.2, k * 0.08, GOLD); [['#e0393e', -0.08, 0], ['#f2a33a', 0.07, -0.02], ['#7fbf4a', 0, -0.08], ['#8a3a8a', -0.02, 0.03], ['#e8d04a', 0.1, 0.04]].forEach(([c, a, b])=> circ(g, mid + a * k, yy + b * k, k * 0.07, c)); g.fillStyle = 'rgba(255,255,255,.4)'; circ(g, mid - k * 0.1, yy - k * 0.03, k * 0.02, 'rgba(255,255,255,.6)'); }
    else if(kind === 2){ ell(g, mid, yy + k * 0.1, k * 0.2, k * 0.07, '#ffffff'); g.fillStyle = '#f7c6d8'; g.fillRect(mid - k * 0.15, yy - k * 0.12, k * 0.3, k * 0.2); ell(g, mid, yy - k * 0.12, k * 0.15, k * 0.05, '#fde4ee'); g.fillStyle = '#ffffff'; for(let j = 0; j < 5; j++) circ(g, mid - k * 0.12 + j * k * 0.06, yy - k * 0.06, k * 0.025, '#ffffff'); circ(g, mid, yy - k * 0.18, k * 0.035, '#e0393e'); }
    else if(kind === 3){ ell(g, mid, yy + k * 0.06, k * 0.22, k * 0.08, '#c9a46a'); for(let j = 0; j < 3; j++){ ell(g, mid - k * 0.1 + j * k * 0.1, yy - (j % 2) * k * 0.04, k * 0.09, k * 0.06, '#d8a25a'); g.strokeStyle = '#a8722e'; g.lineWidth = L(k, 0.01); g.beginPath(); g.moveTo(mid - k * 0.14 + j * k * 0.1, yy - (j % 2) * k * 0.04); g.lineTo(mid - k * 0.06 + j * k * 0.1, yy - k * 0.02 - (j % 2) * k * 0.04); g.stroke(); } }
    else { g.fillStyle = '#e9e2f4'; rr(g, mid - k * 0.06, yy - k * 0.02, k * 0.12, k * 0.12, k * 0.03); g.fill(); [['#f07aa6', -0.06, -0.1], ['#ffffff', 0.05, -0.12], ['#f2c23a', 0, -0.17], ['#9a6be0', -0.1, -0.03], ['#f07aa6', 0.09, -0.04]].forEach(([c, a, b])=> circ(g, mid + a * k, yy + b * k, k * 0.05, c)); for(let j = 0; j < 4; j++) ell(g, mid + (j - 1.5) * k * 0.08, yy - k * 0.02, k * 0.04, k * 0.02, '#4f8f45'); }
  };
  for(let i = 0; i < n; i++){
    const yy = tt + k * (0.55 + i);
    if(yy > tb - k * 0.3) break;
    if(i === 1 || i === n - 2) candelabraSmall(g, mid, yy + k * 0.1, k);
    else dish(i, yy);
  }
}
function candelabraSmall(g, cx, by, k){
  ell(g, cx, by, k * 0.1, k * 0.04, GOLD_D); g.fillStyle = GOLD; g.fillRect(cx - k * 0.015, by - k * 0.3, k * 0.03, k * 0.3);
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.024); g.beginPath(); g.moveTo(cx - k * 0.16, by - k * 0.32); g.quadraticCurveTo(cx, by - k * 0.14, cx + k * 0.16, by - k * 0.32); g.stroke();
  [-0.16, 0, 0.16].forEach(a=>{ ell(g, cx + a * k, by - k * (a ? 0.32 : 0.34), k * 0.035, k * 0.015, GOLD_L); candle(g, cx + a * k, by - k * (a ? 0.5 : 0.56), k * 0.045, k * 0.18); });
}
function banquetFlames(g, d, x, y, w, h, k, t){
  const tt = y + k * 0.3, tb = y + h - k * 0.32, mid = x + w / 2, n = Math.floor((tb - tt) / k);
  [1, n - 2].forEach((i, j)=>{ const by = tt + k * (0.55 + i) + k * 0.1; [-0.16, 0, 0.16].forEach((a, q)=> flameAt(g, mid + a * k, by - k * (a ? 0.5 : 0.56) - k * 0.03, k * 0.035, t, d.x + j * 3 + q)); });
}
/* a column's reflection in the polished floor, below it: drawn as it is, so its kept picture need not reach so far */
function columnReflect(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.985, sw = w * 0.5;
  g.fillStyle = lin(g, 0, base, 0, base + k * 0.9, [[0, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(cx - sw / 2, base, sw, k * 0.9);
  g.fillStyle = lin(g, 0, base, 0, base + k * 0.5, [[0, 'rgba(217,178,71,.25)'], [1, 'rgba(217,178,71,0)']]); g.fillRect(cx - w * 0.4, base, w * 0.8, k * 0.25);
}
/* a bookcase: carved walnut, gold; every book its own */
function drawBookcase(g, d, x, y, w, h, k){
  const R = rng(2200 + Math.round(d.x * 13 + d.y * 7));
  const fx = x + w * 0.03, fw = w * 0.94, top = y + k * 0.05, face = y + k * 0.62, bot = y + h - k * 0.03;
  shadow(g, x + w / 2, bot, w * 0.52, k * 0.12, 0.25);
  /* its top, seen from above */
  g.fillStyle = '#4a2a16'; g.fillRect(fx, top, fw, face - top);
  g.fillStyle = '#5e3820'; g.fillRect(fx + k * 0.04, top + k * 0.04, fw - k * 0.08, face - top - k * 0.08);
  grain(g, fx + k * 0.04, top + k * 0.06, fw - k * 0.08, face - top - k * 0.12, R, 6, 'rgba(0,0,0,.2)');
  /* the crown moulding */
  g.fillStyle = '#3a2010'; g.fillRect(fx - k * 0.04, face - k * 0.06, fw + k * 0.08, k * 0.14);
  g.fillStyle = GOLD; g.fillRect(fx - k * 0.04, face + k * 0.06, fw + k * 0.08, k * 0.035);
  g.fillStyle = 'rgba(255,220,170,.25)'; g.fillRect(fx - k * 0.04, face - k * 0.06, fw + k * 0.08, L(k, 0.014));
  /* the case */
  const cy0 = face + k * 0.1, cy1 = bot - k * 0.14;
  g.fillStyle = '#4a2a16'; g.fillRect(fx, cy0, fw, cy1 - cy0);
  g.fillStyle = '#2a170b'; g.fillRect(fx + k * 0.1, cy0 + k * 0.04, fw - k * 0.2, cy1 - cy0 - k * 0.04);
  const shelves = 5, sh0 = (cy1 - cy0 - k * 0.04) / shelves;
  for(let r = 0; r < shelves; r++){
    const sy = cy0 + k * 0.04 + r * sh0, floor = sy + sh0 - k * 0.04;
    let bx = fx + k * 0.12;
    const end = fx + fw - k * 0.12;
    while(bx < end - k * 0.05){
      const kind = R();
      if(kind < 0.08 && end - bx > k * 0.3){
        /* a stack lying down */
        const n = 2 + Math.floor(R() * 3);
        for(let j = 0; j < n; j++){ const bw = k * (0.24 + R() * 0.06), bh = sh0 * 0.13; const c = ['#7a1e2c', '#24406e', '#2f5f3a', '#8a5a22', '#5a2f6a'][Math.floor(R() * 5)]; g.fillStyle = c; g.fillRect(bx, floor - bh * (j + 1), bw, bh - L(k, 0.008)); g.fillStyle = GOLD; g.fillRect(bx + bw * 0.1, floor - bh * (j + 1) + bh * 0.35, bw * 0.8, L(k, 0.012)); }
        bx += k * 0.32;
      } else if(kind < 0.13 && end - bx > k * 0.24){
        /* something on show: a little globe, a vase, an hourglass */
        const o = Math.floor(R() * 3), ox = bx + k * 0.11;
        if(o === 0){ circ(g, ox, floor - sh0 * 0.42, k * 0.09, '#5aa0d0'); g.fillStyle = '#6fae5a'; g.beginPath(); g.ellipse(ox - k * 0.02, floor - sh0 * 0.45, k * 0.04, k * 0.05, 0.4, 0, TAU); g.fill(); g.strokeStyle = GOLD; g.lineWidth = L(k, 0.014); g.beginPath(); g.arc(ox, floor - sh0 * 0.42, k * 0.11, -1.2, 1.9); g.stroke(); g.fillStyle = GOLD_D; g.fillRect(ox - k * 0.06, floor - k * 0.04, k * 0.12, k * 0.04); }
        else if(o === 1){ g.fillStyle = '#e8eef8'; g.beginPath(); g.moveTo(ox - k * 0.05, floor); g.quadraticCurveTo(ox - k * 0.11, floor - sh0 * 0.3, ox - k * 0.03, floor - sh0 * 0.55); g.lineTo(ox + k * 0.03, floor - sh0 * 0.55); g.quadraticCurveTo(ox + k * 0.11, floor - sh0 * 0.3, ox + k * 0.05, floor); g.closePath(); g.fill(); g.strokeStyle = '#3c6fc4'; g.lineWidth = L(k, 0.014); g.beginPath(); g.moveTo(ox - k * 0.07, floor - sh0 * 0.25); g.quadraticCurveTo(ox, floor - sh0 * 0.32, ox + k * 0.07, floor - sh0 * 0.25); g.stroke(); }
        else { g.fillStyle = GOLD_D; g.fillRect(ox - k * 0.07, floor - sh0 * 0.62, k * 0.14, k * 0.03); g.fillRect(ox - k * 0.07, floor - k * 0.03, k * 0.14, k * 0.03); g.fillStyle = 'rgba(220,240,255,.7)'; g.beginPath(); g.moveTo(ox - k * 0.05, floor - sh0 * 0.58); g.lineTo(ox + k * 0.05, floor - sh0 * 0.58); g.lineTo(ox, floor - sh0 * 0.31); g.lineTo(ox + k * 0.05, floor - k * 0.04); g.lineTo(ox - k * 0.05, floor - k * 0.04); g.lineTo(ox, floor - sh0 * 0.31); g.closePath(); g.fill(); g.fillStyle = '#e8c870'; g.beginPath(); g.moveTo(ox - k * 0.04, floor - k * 0.04); g.lineTo(ox + k * 0.04, floor - k * 0.04); g.lineTo(ox, floor - sh0 * 0.2); g.closePath(); g.fill(); }
        bx += k * 0.24;
      } else {
        const bw = k * (0.06 + R() * 0.06), bh = sh0 * (0.62 + R() * 0.3);
        if(bx + bw > end) break;
        const c = ['#7a1e2c', '#24406e', '#2f5f3a', '#8a5a22', '#5a2f6a', '#a3563a', '#1f4f5a', '#c9a24a', '#6e2a1e'][Math.floor(R() * 9)];
        const lean = R() < 0.06 ? 0.2 : 0;
        g.save(); g.translate(bx, floor); g.rotate(lean);
        g.fillStyle = c; g.fillRect(0, -bh, bw, bh);
        g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, -bh, bw * 0.3, bh);
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(bw * 0.8, -bh, bw * 0.2, bh);
        g.fillStyle = GOLD; g.fillRect(0, -bh * 0.86, bw, L(k, 0.012)); g.fillRect(0, -bh * 0.18, bw, L(k, 0.012));
        if(R() < 0.5) g.fillRect(bw * 0.25, -bh * 0.6, bw * 0.5, bh * 0.16);
        g.restore();
        bx += bw + (lean ? k * 0.06 : L(k, 0.008));
      }
    }
    /* the shelf, its lip catching the light */
    g.fillStyle = '#5e3820'; g.fillRect(fx + k * 0.08, floor, fw - k * 0.16, k * 0.06);
    g.fillStyle = 'rgba(255,220,170,.3)'; g.fillRect(fx + k * 0.08, floor, fw - k * 0.16, L(k, 0.012));
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(fx + k * 0.1, sy, fw - k * 0.2, k * 0.05);
  }
  /* the sides, carved, a gold line down each */
  [fx, fx + fw - k * 0.1].forEach(sx=>{ g.fillStyle = '#5e3820'; g.fillRect(sx, cy0, k * 0.1, cy1 - cy0); g.fillStyle = GOLD; g.fillRect(sx + k * 0.04, cy0 + k * 0.1, L(k, 0.02), cy1 - cy0 - k * 0.2); });
  /* the plinth */
  g.fillStyle = '#3a2010'; g.fillRect(fx - k * 0.03, cy1, fw + k * 0.06, bot - cy1);
  g.fillStyle = GOLD; g.fillRect(fx - k * 0.03, cy1, fw + k * 0.06, L(k, 0.02));
  /* a ladder on a rail, now and then */
  if((Math.round(d.x) + Math.round(d.y)) % 3 === 0){
    const lx = fx + fw * 0.66;
    g.fillStyle = GOLD; g.fillRect(fx, cy0 + k * 0.02, fw, L(k, 0.02));
    g.strokeStyle = '#8a5a32'; g.lineWidth = L(k, 0.04);
    g.beginPath(); g.moveTo(lx, cy0); g.lineTo(lx + k * 0.12, bot); g.moveTo(lx + k * 0.3, cy0); g.lineTo(lx + k * 0.42, bot); g.stroke();
    g.lineWidth = L(k, 0.03); for(let i = 1; i < 7; i++){ const f = i / 7; g.beginPath(); g.moveTo(lx + k * 0.12 * f, cy0 + (bot - cy0) * f); g.lineTo(lx + k * 0.3 + k * 0.12 * f, cy0 + (bot - cy0) * f); g.stroke(); }
  }
}
/* a tall candelabra of gold, five candles (their flames as they flicker) */
const CANDELABRA = [[-0.34, 0.32], [-0.17, 0.2], [0, 0.08], [0.17, 0.2], [0.34, 0.32]];
function drawCandelabra(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.97, top = y + h * 0.3;
  shadow(g, cx, base, k * 0.3, k * 0.08, 0.25);
  g.fillStyle = GOLD_D; g.beginPath(); g.moveTo(cx - k * 0.26, base); g.quadraticCurveTo(cx, base - k * 0.2, cx + k * 0.26, base); g.closePath(); g.fill();
  [-1, 0, 1].forEach(c=> ell(g, cx + c * k * 0.2, base - k * 0.01, k * 0.06, k * 0.03, GOLD));
  g.fillStyle = lin(g, cx - k * 0.05, 0, cx + k * 0.05, 0, [[0, GOLD_L], [1, GOLD_D]]); g.fillRect(cx - k * 0.045, top, k * 0.09, base - top - k * 0.1);
  [0.25, 0.5, 0.75].forEach(f=>{ ell(g, cx, top + (base - top) * f, k * 0.08, k * 0.04, GOLD); ell(g, cx - k * 0.02, top + (base - top) * f - k * 0.01, k * 0.03, k * 0.015, GOLD_L); });
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.04);
  g.beginPath(); g.moveTo(cx - k * 0.34, top - k * 0.32 + k * 0.32); g.quadraticCurveTo(cx - k * 0.3, top + k * 0.12, cx, top + k * 0.04); g.quadraticCurveTo(cx + k * 0.3, top + k * 0.12, cx + k * 0.34, top); g.stroke();
  g.beginPath(); g.moveTo(cx - k * 0.17, top - k * 0.2 + k * 0.2); g.quadraticCurveTo(cx - k * 0.15, top + k * 0.08, cx, top + k * 0.04); g.quadraticCurveTo(cx + k * 0.15, top + k * 0.08, cx + k * 0.17, top); g.stroke();
  CANDELABRA.forEach(([a, b])=>{ const px = cx + a * k, py = top - b * k + (b > 0.2 ? k * 0.32 : b > 0.1 ? k * 0.2 : 0) - (b > 0.1 ? 0 : 0); ell(g, px, py, k * 0.06, k * 0.025, GOLD_L); candle(g, px, py - k * 0.22, k * 0.06, k * 0.22); });
}
function candelabraFlames(g, d, x, y, w, h, k, t){
  const cx = x + w / 2, top = y + h * 0.3;
  CANDELABRA.forEach(([a, b], i)=>{ const py = top - b * k + (b > 0.2 ? k * 0.32 : b > 0.1 ? k * 0.2 : 0); flameAt(g, cx + a * k, py - k * 0.25, k * 0.045, t, d.x + i); });
}
/* a palm in a gold urn */
function drawPalm(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.97, R = rng(3100 + Math.round(d.x * 7 + d.y * 3));
  shadow(g, cx, base, k * 0.34, k * 0.08, 0.25);
  const ut = base - k * 0.5;
  g.fillStyle = lin(g, cx - k * 0.28, 0, cx + k * 0.28, 0, [[0, GOLD_L], [0.4, GOLD], [1, GOLD_D]]);
  g.beginPath(); g.moveTo(cx - k * 0.32, ut); g.lineTo(cx + k * 0.32, ut); g.quadraticCurveTo(cx + k * 0.3, base - k * 0.12, cx + k * 0.14, base - k * 0.06); g.lineTo(cx - k * 0.14, base - k * 0.06); g.quadraticCurveTo(cx - k * 0.3, base - k * 0.12, cx - k * 0.32, ut); g.closePath(); g.fill();
  g.fillStyle = GOLD_D; g.fillRect(cx - k * 0.18, base - k * 0.08, k * 0.36, k * 0.08);
  g.fillStyle = '#3a2a1a'; ell(g, cx, ut, k * 0.3, k * 0.07, '#3a2a1a');
  g.strokeStyle = GOLD_D; g.lineWidth = L(k, 0.016); g.beginPath(); g.moveTo(cx - k * 0.3, ut + k * 0.12); g.quadraticCurveTo(cx, ut + k * 0.2, cx + k * 0.3, ut + k * 0.12); g.stroke();
  /* the fronds */
  const fronds = 9;
  for(let i = 0; i < fronds; i++){
    const a = -Math.PI / 2 + (i - (fronds - 1) / 2) * 0.36 + (R() - 0.5) * 0.15, len = k * (0.75 + R() * 0.3);
    const sx = cx + (R() - 0.5) * k * 0.08, sy = ut - k * 0.05;
    const ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len * 0.95, mx = sx + Math.cos(a) * len * 0.5, my = sy + Math.sin(a) * len * 0.5 - k * 0.15;
    g.strokeStyle = '#3f6a2e'; g.lineWidth = L(k, 0.025); g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(mx, my, ex, ey + k * 0.15); g.stroke();
    for(let j = 1; j < 9; j++){
      const f = j / 9, px = sx + (ex - sx) * f + (mx - (sx + ex) / 2) * 2 * f * (1 - f), py = sy + (ey + k * 0.15 - sy) * f + (my - (sy + ey + k * 0.15) / 2) * 2 * f * (1 - f);
      const ll = k * 0.18 * (1 - f * 0.6);
      [-1, 1].forEach(sd=>{ g.strokeStyle = j % 2 ? '#4f8f45' : '#5ea852'; g.lineWidth = L(k, 0.03); g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a + sd * 1.1) * ll, py + Math.sin(a + sd * 1.1) * ll + ll * 0.4); g.stroke(); });
    }
  }
}
/* a suit of armour on its stand, a halberd */
function drawArmour(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.97, gold = !!d.gold;
  const M = gold ? ['#e8d48a', '#c9a64a', '#8a6a22'] : ['#eef1f6', '#b9c0cc', '#7d8594'], trim = gold ? '#3c6fc4' : GOLD;
  shadow(g, cx, base, k * 0.36, k * 0.09, 0.28);
  g.fillStyle = '#5a3a20'; rr(g, cx - k * 0.32, base - k * 0.12, k * 0.64, k * 0.12, k * 0.03); g.fill();
  /* the halberd */
  const hx = cx + k * 0.36;
  g.fillStyle = '#6b4426'; g.fillRect(hx - k * 0.02, y + h * 0.05, k * 0.04, base - y - h * 0.05 - k * 0.08);
  g.fillStyle = M[0]; g.beginPath(); g.moveTo(hx, y + h * 0.01); g.lineTo(hx + k * 0.04, y + h * 0.08); g.lineTo(hx - k * 0.04, y + h * 0.08); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(hx + k * 0.02, y + h * 0.1); g.quadraticCurveTo(hx + k * 0.22, y + h * 0.12, hx + k * 0.2, y + h * 0.22); g.lineTo(hx + k * 0.02, y + h * 0.2); g.closePath(); g.fill();
  g.fillStyle = M[2]; g.beginPath(); g.moveTo(hx - k * 0.02, y + h * 0.12); g.lineTo(hx - k * 0.12, y + h * 0.15); g.lineTo(hx - k * 0.02, y + h * 0.18); g.closePath(); g.fill();
  /* legs */
  const legT = base - k * 0.85;
  [-1, 1].forEach(sd=>{
    const lx = cx + sd * k * 0.1;
    g.fillStyle = lin(g, lx - k * 0.07, 0, lx + k * 0.07, 0, [[0, M[0]], [1, M[2]]]); rr(g, lx - k * 0.07, legT, k * 0.14, k * 0.72, k * 0.04); g.fill();
    ell(g, lx, legT + k * 0.38, k * 0.08, k * 0.06, M[1]);
    g.fillStyle = M[1]; g.beginPath(); g.moveTo(lx - k * 0.08, base - k * 0.12); g.lineTo(lx + sd * k * 0.16, base - k * 0.12); g.lineTo(lx + sd * k * 0.12, base - k * 0.2); g.lineTo(lx - k * 0.07, base - k * 0.22); g.closePath(); g.fill();
  });
  /* the skirt of plates, the breastplate */
  for(let i = 0; i < 3; i++){ g.fillStyle = i % 2 ? M[1] : M[0]; rr(g, cx - k * 0.22 + i * k * 0.01, legT - k * 0.08 + i * k * 0.07, k * 0.44 - i * k * 0.02, k * 0.09, k * 0.03); g.fill(); }
  const bt = legT - k * 0.62;
  g.fillStyle = lin(g, cx - k * 0.24, 0, cx + k * 0.24, 0, [[0, M[0]], [0.45, '#ffffff'], [1, M[2]]]);
  g.beginPath(); g.moveTo(cx - k * 0.24, bt); g.lineTo(cx + k * 0.24, bt); g.quadraticCurveTo(cx + k * 0.26, legT - k * 0.2, cx + k * 0.16, legT - k * 0.04); g.lineTo(cx - k * 0.16, legT - k * 0.04); g.quadraticCurveTo(cx - k * 0.26, legT - k * 0.2, cx - k * 0.24, bt); g.closePath(); g.fill();
  g.strokeStyle = trim; g.lineWidth = L(k, 0.02); g.beginPath(); g.moveTo(cx, bt + k * 0.04); g.lineTo(cx, legT - k * 0.08); g.stroke();
  g.fillStyle = trim; g.beginPath(); g.moveTo(cx - k * 0.08, bt + k * 0.18); g.lineTo(cx + k * 0.08, bt + k * 0.18); g.lineTo(cx, bt + k * 0.32); g.closePath(); g.fill();
  /* pauldrons, arms, gauntlets */
  [-1, 1].forEach(sd=>{
    ell(g, cx + sd * k * 0.27, bt + k * 0.06, k * 0.13, k * 0.1, M[1]); ell(g, cx + sd * k * 0.27, bt + k * 0.03, k * 0.11, k * 0.06, M[0]);
    g.fillStyle = M[1]; rr(g, cx + sd * k * 0.27 - k * 0.06, bt + k * 0.1, k * 0.12, k * 0.42, k * 0.05); g.fill();
    circ(g, cx + sd * k * 0.27, bt + k * 0.56, k * 0.065, M[2]);
  });
  g.strokeStyle = M[2]; g.lineWidth = L(k, 0.03); g.beginPath(); g.moveTo(cx + k * 0.3, bt + k * 0.5); g.lineTo(hx, bt + k * 0.45); g.stroke();
  /* the helm, its visor, its plume */
  const hy = bt - k * 0.2;
  g.fillStyle = lin(g, cx - k * 0.16, 0, cx + k * 0.16, 0, [[0, M[0]], [0.4, '#ffffff'], [1, M[2]]]); rr(g, cx - k * 0.15, hy - k * 0.12, k * 0.3, k * 0.32, k * 0.13); g.fill();
  g.fillStyle = '#2a2a33'; g.fillRect(cx - k * 0.11, hy - k * 0.01, k * 0.22, k * 0.035); g.fillRect(cx - k * 0.012, hy + k * 0.03, k * 0.024, k * 0.12);
  g.fillStyle = M[1]; for(let i = 0; i < 4; i++) g.fillRect(cx - k * 0.08 + i * k * 0.05, hy + k * 0.06, k * 0.02, k * 0.06);
  const pc = gold ? '#3c6fc4' : '#c8343a';
  g.fillStyle = pc; g.beginPath(); g.moveTo(cx, hy - k * 0.1); g.quadraticCurveTo(cx - k * 0.05, hy - k * 0.42, cx + k * 0.22, hy - k * 0.36); g.quadraticCurveTo(cx + k * 0.06, hy - k * 0.28, cx + k * 0.06, hy - k * 0.1); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(cx + k * 0.02, hy - k * 0.15); g.quadraticCurveTo(cx, hy - k * 0.36, cx + k * 0.16, hy - k * 0.34); g.lineTo(cx + k * 0.02, hy - k * 0.2); g.closePath(); g.fill();
}
/* a tall porcelain vase on a pedestal, white and blue, flowers in it */
function drawVase(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.97;
  shadow(g, cx, base, k * 0.3, k * 0.08, 0.22);
  g.fillStyle = '#efe6d8'; g.fillRect(cx - k * 0.22, base - k * 0.5, k * 0.44, k * 0.5);
  g.fillStyle = 'rgba(120,100,80,.25)'; g.fillRect(cx + k * 0.06, base - k * 0.5, k * 0.16, k * 0.5);
  g.fillStyle = GOLD; g.fillRect(cx - k * 0.26, base - k * 0.54, k * 0.52, k * 0.05); g.fillRect(cx - k * 0.24, base - k * 0.06, k * 0.48, k * 0.04);
  const vb = base - k * 0.54, vt = vb - k * 0.62;
  g.fillStyle = lin(g, cx - k * 0.2, 0, cx + k * 0.2, 0, [[0, '#ffffff'], [0.6, '#eef2fa'], [1, '#c9d2e4']]);
  g.beginPath(); g.moveTo(cx - k * 0.1, vb); g.quadraticCurveTo(cx - k * 0.32, vb - k * 0.3, cx - k * 0.08, vt + k * 0.12); g.lineTo(cx - k * 0.1, vt); g.lineTo(cx + k * 0.1, vt); g.lineTo(cx + k * 0.08, vt + k * 0.12); g.quadraticCurveTo(cx + k * 0.32, vb - k * 0.3, cx + k * 0.1, vb); g.closePath(); g.fill();
  g.strokeStyle = '#2f5ea8'; g.lineWidth = L(k, 0.02);
  g.beginPath(); g.moveTo(cx - k * 0.2, vb - k * 0.2); g.quadraticCurveTo(cx, vb - k * 0.28, cx + k * 0.2, vb - k * 0.2); g.stroke();
  g.beginPath(); g.moveTo(cx - k * 0.12, vb - k * 0.42); g.bezierCurveTo(cx - k * 0.04, vb - k * 0.5, cx + k * 0.04, vb - k * 0.34, cx + k * 0.12, vb - k * 0.42); g.stroke();
  [-0.08, 0.06].forEach(a=> circ(g, cx + a * k, vb - k * 0.31, k * 0.03, '#2f5ea8'));
  /* flowers and leaves */
  for(let i = 0; i < 6; i++){ const a = -Math.PI / 2 + (i - 2.5) * 0.4; g.strokeStyle = '#3f7d3a'; g.lineWidth = L(k, 0.02); g.beginPath(); g.moveTo(cx, vt); g.quadraticCurveTo(cx + Math.cos(a) * k * 0.15, vt - k * 0.2, cx + Math.cos(a) * k * 0.3, vt + Math.sin(a) * k * 0.32); g.stroke(); ell(g, cx + Math.cos(a) * k * 0.22, vt + Math.sin(a) * k * 0.2 - k * 0.04, k * 0.06, k * 0.025, '#4f8f45'); }
  [['#f07aa6', -0.14, -0.3], ['#ffffff', 0.12, -0.32], ['#f2c23a', 0, -0.38], ['#c98ad8', -0.24, -0.18], ['#f07aa6', 0.24, -0.2], ['#ffffff', -0.05, -0.22]].forEach(([c, a, b])=>{
    for(let j = 0; j < 5; j++){ const q = j / 5 * TAU; circ(g, cx + a * k + Math.cos(q) * k * 0.035, vt + b * k + Math.sin(q) * k * 0.035, k * 0.03, c); }
    circ(g, cx + a * k, vt + b * k, k * 0.02, c === '#f2c23a' ? '#e07a2a' : '#f6d36a');
  });
}
/* a grandfather clock: walnut, a gold face, its pendulum (moving: clockSwing) */
function drawClock(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.98, cw = k * 0.6, top = y + h * 0.12;
  shadow(g, cx, base, k * 0.36, k * 0.08, 0.25);
  g.fillStyle = '#4a2a16'; g.fillRect(cx - cw / 2, top + k * 0.3, cw, base - top - k * 0.3);
  g.fillStyle = '#5e3820'; g.fillRect(cx - cw / 2 + k * 0.05, top + k * 0.3, cw - k * 0.1, base - top - k * 0.3);
  g.fillStyle = '#3a2010'; g.fillRect(cx - cw / 2 - k * 0.04, base - k * 0.18, cw + k * 0.08, k * 0.18);
  /* the hood, its crest */
  g.fillStyle = '#3a2010'; g.beginPath(); g.moveTo(cx - cw / 2 - k * 0.06, top + k * 0.42); g.lineTo(cx - cw / 2 - k * 0.06, top + k * 0.08); g.quadraticCurveTo(cx, top - k * 0.16, cx + cw / 2 + k * 0.06, top + k * 0.08); g.lineTo(cx + cw / 2 + k * 0.06, top + k * 0.42); g.closePath(); g.fill();
  circ(g, cx, top - k * 0.05, k * 0.05, GOLD); [-1, 1].forEach(sd=> circ(g, cx + sd * (cw / 2 + k * 0.02), top + k * 0.04, k * 0.04, GOLD));
  /* the face: a gold ring, numerals, the moon in its arch */
  const fy = top + k * 0.3;
  circ(g, cx, fy, k * 0.22, GOLD); circ(g, cx, fy, k * 0.18, '#f8f2e2');
  g.fillStyle = '#2a4a8e'; g.beginPath(); g.arc(cx, fy - k * 0.04, k * 0.12, Math.PI, 0); g.closePath(); g.fill(); circ(g, cx + k * 0.04, fy - k * 0.1, k * 0.035, '#f6e9a8');
  g.fillStyle = '#3a2a1a'; for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; g.fillRect(cx + Math.cos(a) * k * 0.15 - L(k, 0.008), fy + Math.sin(a) * k * 0.15 - L(k, 0.008), L(k, 0.016), L(k, 0.016)); }
  g.strokeStyle = '#2a1a0a'; g.lineWidth = L(k, 0.018); g.beginPath(); g.moveTo(cx, fy); g.lineTo(cx + k * 0.08, fy - k * 0.07); g.moveTo(cx, fy); g.lineTo(cx - k * 0.02, fy + k * 0.13); g.stroke();
  /* the window onto the pendulum */
  const wy0 = fy + k * 0.32, wy1 = base - k * 0.35;
  g.fillStyle = '#2a170b'; rr(g, cx - k * 0.17, wy0, k * 0.34, wy1 - wy0, k * 0.06); g.fill();
  g.fillStyle = 'rgba(200,220,240,.12)'; rr(g, cx - k * 0.17, wy0, k * 0.34, wy1 - wy0, k * 0.06); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.02); rr(g, cx - k * 0.17, wy0, k * 0.34, wy1 - wy0, k * 0.06); g.stroke();
  [-1, 1].forEach(sd=>{ g.fillStyle = GOLD_D; g.fillRect(cx + sd * k * 0.08 - k * 0.025, wy0 + k * 0.04, k * 0.05, k * 0.2); });
}
function clockSwing(g, d, x, y, w, h, k, t){
  const cx = x + w / 2, top = y + h * 0.12, wy0 = top + k * 0.62, len = (y + h * 0.98 - k * 0.35) - wy0 - k * 0.18;
  const a = Math.sin(t * Math.PI) * 0.22;
  const ex = cx + Math.sin(a) * len, ey = wy0 + Math.cos(a) * len;
  g.save(); g.beginPath(); rr(g, cx - k * 0.16, wy0, k * 0.32, len + k * 0.16, k * 0.06); g.clip();
  g.strokeStyle = GOLD_D; g.lineWidth = L(k, 0.018); g.beginPath(); g.moveTo(cx, wy0); g.lineTo(ex, ey); g.stroke();
  circ(g, ex, ey, k * 0.07, GOLD); circ(g, ex - k * 0.02, ey - k * 0.02, k * 0.025, GOLD_L);
  g.restore();
}
/* a sideboard: walnut and gold; on it a tea set, a cake on a stand, a bowl of fruit */
function drawSideboard(g, d, x, y, w, h, k){
  const top = y + h * 0.4, base = y + h * 0.97, X = x + k * 0.06, W = w - k * 0.12;
  shadow(g, x + w / 2, base, w * 0.5, k * 0.08, 0.22);
  g.fillStyle = '#4a2a16'; g.fillRect(X, top, W, base - top);
  g.fillStyle = '#6e4428'; g.fillRect(X - k * 0.03, top - k * 0.06, W + k * 0.06, k * 0.1);
  g.fillStyle = 'rgba(255,220,170,.3)'; g.fillRect(X - k * 0.03, top - k * 0.06, W + k * 0.06, L(k, 0.014));
  const n = Math.max(2, Math.round(W / k));
  for(let i = 0; i < n; i++){ const dx = X + k * 0.06 + i * (W - k * 0.12) / n, dw = (W - k * 0.12) / n - k * 0.06; g.fillStyle = '#5e3820'; g.fillRect(dx, top + k * 0.12, dw, base - top - k * 0.26); g.strokeStyle = GOLD; g.lineWidth = L(k, 0.014); g.strokeRect(dx + k * 0.04, top + k * 0.16, dw - k * 0.08, base - top - k * 0.34); circ(g, dx + dw / 2, top + (base - top) * 0.45, k * 0.03, GOLD); }
  g.fillStyle = '#3a2010'; g.fillRect(X, base - k * 0.1, W, k * 0.1);
  /* what is on it */
  const S = top - k * 0.04, at = (f)=> X + W * f;
  /* the cake on its stand */
  g.fillStyle = '#e8e4dc'; g.fillRect(at(0.2) - k * 0.02, S - k * 0.14, k * 0.04, k * 0.14); ell(g, at(0.2), S - k * 0.14, k * 0.2, k * 0.05, '#ffffff');
  g.fillStyle = '#f7d8e4'; g.fillRect(at(0.2) - k * 0.15, S - k * 0.42, k * 0.3, k * 0.26); ell(g, at(0.2), S - k * 0.42, k * 0.15, k * 0.05, '#fde8f0');
  g.fillStyle = '#ffffff'; for(let j = 0; j < 6; j++) circ(g, at(0.2) - k * 0.13 + j * k * 0.052, S - k * 0.17, k * 0.025, '#ffffff');
  g.fillStyle = '#e88ab0'; g.fillRect(at(0.2) - k * 0.15, S - k * 0.3, k * 0.3, k * 0.03);
  [-0.07, 0, 0.07].forEach(a=> circ(g, at(0.2) + a * k, S - k * 0.47, k * 0.03, '#e0393e'));
  /* the teapot and cups */
  ell(g, at(0.5), S - k * 0.13, k * 0.13, k * 0.11, '#ffffff'); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(at(0.5) + k * 0.1, S - k * 0.12); g.quadraticCurveTo(at(0.5) + k * 0.22, S - k * 0.14, at(0.5) + k * 0.24, S - k * 0.26); g.lineTo(at(0.5) + k * 0.2, S - k * 0.24); g.quadraticCurveTo(at(0.5) + k * 0.18, S - k * 0.16, at(0.5) + k * 0.1, S - k * 0.08); g.fill();
  g.strokeStyle = '#3c6fc4'; g.lineWidth = L(k, 0.014); g.beginPath(); g.ellipse(at(0.5), S - k * 0.13, k * 0.1, k * 0.04, 0, 0, Math.PI); g.stroke(); circ(g, at(0.5), S - k * 0.25, k * 0.025, GOLD);
  [0.36, 0.64].forEach(f=>{ ell(g, at(f), S - k * 0.02, k * 0.07, k * 0.025, '#ffffff'); g.fillStyle = '#ffffff'; g.fillRect(at(f) - k * 0.045, S - k * 0.1, k * 0.09, k * 0.08); g.fillStyle = '#3c6fc4'; g.fillRect(at(f) - k * 0.045, S - k * 0.07, k * 0.09, L(k, 0.012)); });
  /* the fruit */
  ell(g, at(0.82), S - k * 0.04, k * 0.17, k * 0.06, GOLD);
  [['#e0393e', -0.07, -0.1], ['#f2a33a', 0.06, -0.1], ['#7fbf4a', 0, -0.17], ['#8a3a8a', -0.1, -0.04], ['#e8d04a', 0.1, -0.04]].forEach(([c, a, b])=> circ(g, at(0.82) + a * k, S + b * k, k * 0.06, c));
}
/* a settee: velvet, buttoned, gold feet */
function drawSettee(g, d, x, y, w, h, k){
  const base = y + h * 0.96, X = x + k * 0.08, W = w - k * 0.16, col = d.col || '#2a4a8e';
  shadow(g, x + w / 2, base, w * 0.48, k * 0.08, 0.22);
  g.fillStyle = col; g.beginPath(); g.moveTo(X, base - k * 0.4); g.lineTo(X, y + h * 0.28); g.quadraticCurveTo(X + W * 0.25, y + h * 0.08, X + W / 2, y + h * 0.18); g.quadraticCurveTo(X + W * 0.75, y + h * 0.08, X + W, y + h * 0.28); g.lineTo(X + W, base - k * 0.4); g.closePath(); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.03); g.beginPath(); g.moveTo(X, y + h * 0.28); g.quadraticCurveTo(X + W * 0.25, y + h * 0.08, X + W / 2, y + h * 0.18); g.quadraticCurveTo(X + W * 0.75, y + h * 0.08, X + W, y + h * 0.28); g.stroke();
  for(let i = 0; i < 5; i++) circ(g, X + W * (0.15 + i * 0.175), y + h * 0.36, k * 0.022, GOLD_L);
  g.fillStyle = sh(col, 0.15); rr(g, X + k * 0.06, base - k * 0.5, W - k * 0.12, k * 0.2, k * 0.08); g.fill();
  g.fillStyle = sh(col, -0.2); g.fillRect(X, base - k * 0.32, W, k * 0.18);
  [X, X + W].forEach(ax=>{ ell(g, ax, base - k * 0.42, k * 0.08, k * 0.14, sh(col, -0.1)); circ(g, ax, base - k * 0.5, k * 0.05, GOLD); });
  [X + k * 0.06, X + W - k * 0.06, X + W / 2].forEach(fx=>{ g.fillStyle = GOLD_D; g.fillRect(fx - k * 0.025, base - k * 0.14, k * 0.05, k * 0.14); });
  ell(g, X + W * 0.25, base - k * 0.5, k * 0.13, k * 0.1, '#f2d77a');
}
/* a reading table in the library: an open book, a lamp, a quill, a pile of books, two chairs */
function drawReading(g, d, x, y, w, h, k){
  const cx = x + w / 2, tt = y + h * 0.3, tb = y + h * 0.72;
  shadow(g, cx, tb + k * 0.2, w * 0.46, k * 0.16, 0.22);
  const chair = (cy, back)=>{
    g.fillStyle = '#5a3418'; g.fillRect(cx - k * 0.22, cy, k * 0.05, k * 0.3); g.fillRect(cx + k * 0.17, cy, k * 0.05, k * 0.3);
    g.fillStyle = '#7a1e2c'; rr(g, cx - k * 0.26, cy - k * 0.06, k * 0.52, k * 0.16, k * 0.05); g.fill();
    if(back){ g.fillStyle = '#6b3e1e'; rr(g, cx - k * 0.26, cy - k * 0.42, k * 0.52, k * 0.38, k * 0.06); g.fill(); g.fillStyle = '#7a1e2c'; rr(g, cx - k * 0.19, cy - k * 0.36, k * 0.38, k * 0.26, k * 0.04); g.fill(); }
  };
  chair(tt - k * 0.12, true);
  g.fillStyle = '#4a2a16'; [x + w * 0.14, x + w * 0.82].forEach(lx=> g.fillRect(lx, tb - k * 0.05, k * 0.08, k * 0.36));
  g.fillStyle = '#6e4428'; rr(g, x + w * 0.08, tt, w * 0.84, tb - tt, k * 0.06); g.fill();
  g.fillStyle = '#2f5f3a'; g.fillRect(x + w * 0.16, tt + k * 0.08, w * 0.68, tb - tt - k * 0.16);
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.014); g.strokeRect(x + w * 0.16, tt + k * 0.08, w * 0.68, tb - tt - k * 0.16);
  g.fillStyle = '#4a2a16'; g.fillRect(x + w * 0.08, tb - k * 0.02, w * 0.84, k * 0.1);
  /* the open book */
  const bx = cx - k * 0.1, by = tt + (tb - tt) * 0.5;
  g.fillStyle = '#7a1e2c'; rr(g, bx - k * 0.34, by - k * 0.22, k * 0.68, k * 0.44, k * 0.03); g.fill();
  g.fillStyle = '#fbf6e8'; g.beginPath(); g.moveTo(bx, by - k * 0.18); g.quadraticCurveTo(bx - k * 0.15, by - k * 0.22, bx - k * 0.31, by - k * 0.18); g.lineTo(bx - k * 0.31, by + k * 0.18); g.quadraticCurveTo(bx - k * 0.15, by + k * 0.14, bx, by + k * 0.18); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(bx, by - k * 0.18); g.quadraticCurveTo(bx + k * 0.15, by - k * 0.22, bx + k * 0.31, by - k * 0.18); g.lineTo(bx + k * 0.31, by + k * 0.18); g.quadraticCurveTo(bx + k * 0.15, by + k * 0.14, bx, by + k * 0.18); g.closePath(); g.fill();
  g.fillStyle = 'rgba(80,60,40,.45)'; for(let i = 0; i < 6; i++){ g.fillRect(bx - k * 0.27, by - k * 0.12 + i * k * 0.05, k * 0.22, L(k, 0.01)); g.fillRect(bx + k * 0.05, by - k * 0.12 + i * k * 0.05, k * (i === 2 ? 0.1 : 0.22), L(k, 0.01)); }
  g.fillStyle = '#c8343a'; g.fillRect(bx + k * 0.12, by - k * 0.04, k * 0.1, k * 0.08);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(bx - L(k, 0.01), by - k * 0.18, L(k, 0.02), k * 0.36);
  /* the quill and its ink */
  circ(g, cx + w * 0.26, by + k * 0.1, k * 0.05, '#1a1a2a'); circ(g, cx + w * 0.26, by + k * 0.09, k * 0.03, '#3a3a5a');
  g.strokeStyle = '#f4f4f8'; g.lineWidth = L(k, 0.04); g.beginPath(); g.moveTo(cx + w * 0.26, by + k * 0.08); g.quadraticCurveTo(cx + w * 0.3, by - k * 0.1, cx + w * 0.36, by - k * 0.22); g.stroke();
  /* a pile of books */
  [['#24406e', 0], ['#8a5a22', 1], ['#5a2f6a', 2]].forEach(([c, i])=>{ g.fillStyle = c; g.fillRect(x + w * 0.18 + i * k * 0.01, tt + k * 0.12 - i * k * 0.06, k * 0.3, k * 0.07); g.fillStyle = GOLD; g.fillRect(x + w * 0.2 + i * k * 0.01, tt + k * 0.14 - i * k * 0.06, k * 0.26, L(k, 0.01)); });
  /* the lamp: brass, a green shade */
  const lx = cx + w * 0.3, ly = tt + k * 0.18;
  ell(g, lx, ly + k * 0.1, k * 0.09, k * 0.035, GOLD_D); g.fillStyle = GOLD; g.fillRect(lx - k * 0.015, ly - k * 0.18, k * 0.03, k * 0.28);
  g.fillStyle = '#2f6f4a'; g.beginPath(); g.moveTo(lx - k * 0.14, ly - k * 0.12); g.lineTo(lx + k * 0.14, ly - k * 0.12); g.lineTo(lx + k * 0.08, ly - k * 0.26); g.lineTo(lx - k * 0.08, ly - k * 0.26); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,230,150,.5)'; ell(g, lx, ly - k * 0.11, k * 0.13, k * 0.03, 'rgba(255,236,170,.9)');
  g.fillStyle = rad(g, lx, ly, 0, k * 0.6, [[0, 'rgba(255,230,150,.3)'], [1, 'rgba(255,230,150,0)']]); g.fillRect(lx - k * 0.6, ly - k * 0.3, k * 1.2, k * 0.9);
  chair(tb + k * 0.06, false);
}
/* a globe on a stand */
function drawGlobe(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.97, gy = y + h * 0.36, r = k * 0.3;
  shadow(g, cx, base, k * 0.3, k * 0.08, 0.22);
  g.strokeStyle = '#5a3418'; g.lineWidth = L(k, 0.04);
  [-1, 0, 1].forEach(sd=>{ g.beginPath(); g.moveTo(cx, base - k * 0.45); g.lineTo(cx + sd * k * 0.26, base - k * 0.02); g.stroke(); });
  g.fillStyle = '#5a3418'; g.fillRect(cx - k * 0.03, gy + r, k * 0.06, base - k * 0.45 - gy - r);
  circ(g, cx, gy, r, '#3f8ac4');
  g.save(); g.beginPath(); g.arc(cx, gy, r, 0, TAU); g.clip();
  g.fillStyle = '#7fb85a';
  g.beginPath(); g.ellipse(cx - r * 0.35, gy - r * 0.2, r * 0.32, r * 0.42, 0.4, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(cx + r * 0.38, gy + r * 0.25, r * 0.28, r * 0.35, -0.3, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(cx + r * 0.2, gy - r * 0.55, r * 0.25, r * 0.12, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = L(k, 0.01);
  [-0.5, 0, 0.5].forEach(f=>{ g.beginPath(); g.ellipse(cx, gy + f * r, r * Math.sqrt(1 - f * f), r * 0.12, 0, 0, TAU); g.stroke(); });
  g.fillStyle = lin(g, cx - r, gy - r, cx + r, gy + r, [[0, 'rgba(255,255,255,.35)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,40,.3)']]); g.fillRect(cx - r, gy - r, r * 2, r * 2);
  g.restore();
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.03); g.beginPath(); g.arc(cx, gy, r * 1.12, -2.2, 1.3); g.stroke();
  circ(g, cx + Math.cos(-2.2) * r * 1.12, gy + Math.sin(-2.2) * r * 1.12, k * 0.025, GOLD_L);
}

/* ---------- the tower's rooms ---------- */
function drawCanopyBed(g, d, x, y, w, h, k){
  const blue = !!d.blue;
  const C = blue ? { cloth:'#3d5a9a', cloth2:'#6f8fcf', quilt:'#4a6ab0', quilt2:'#d9e4f7', trim:GOLD, head:'#2a3f72' } : { cloth:'#e57aa6', cloth2:'#f7c6d8', quilt:'#f29cbf', quilt2:'#ffffff', trim:GOLD, head:'#d65a8a' };
  const X = x + w * 0.06, W = w * 0.88, base = y + h * 0.97, ct = y + h * 0.04;
  shadow(g, x + w / 2, base, w * 0.5, k * 0.12, 0.22);
  /* the back posts and the headboard */
  g.fillStyle = GOLD_D; g.fillRect(X, ct, k * 0.1, base - ct - k * 1.6); g.fillRect(X + W - k * 0.1, ct, k * 0.1, base - ct - k * 1.6);
  const hb = ct + k * 0.55;
  g.fillStyle = C.head; g.beginPath(); g.moveTo(X + k * 0.12, hb + k * 0.9); g.lineTo(X + k * 0.12, hb + k * 0.2); g.quadraticCurveTo(X + W / 2, hb - k * 0.25, X + W - k * 0.12, hb + k * 0.2); g.lineTo(X + W - k * 0.12, hb + k * 0.9); g.closePath(); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.035); g.stroke();
  for(let r = 0; r < 2; r++) for(let c = 0; c < 5; c++) circ(g, X + W * (0.2 + c * 0.15), hb + k * (0.25 + r * 0.25), k * 0.025, GOLD_L);
  if(!blue){ g.fillStyle = '#ffffff'; const hx = X + W / 2, hy = hb + k * 0.1, r = k * 0.12; g.beginPath(); g.moveTo(hx, hy + r); g.bezierCurveTo(hx - r * 1.6, hy - r * 0.2, hx - r * 0.6, hy - r * 1.4, hx, hy - r * 0.4); g.bezierCurveTo(hx + r * 0.6, hy - r * 1.4, hx + r * 1.6, hy - r * 0.2, hx, hy + r); g.fill(); }
  else { g.fillStyle = GOLD_L; g.beginPath(); for(let i = 0; i < 10; i++){ const a = i / 10 * TAU - Math.PI / 2, q = i % 2 ? k * 0.05 : k * 0.13; g.lineTo(X + W / 2 + Math.cos(a) * q, hb + k * 0.1 + Math.sin(a) * q); } g.closePath(); g.fill(); }
  /* the mattress, the pillows, the quilt */
  const mt = hb + k * 0.75, mb = base - k * 0.45;
  g.fillStyle = '#ffffff'; rr(g, X + k * 0.12, mt, W - k * 0.24, mb - mt, k * 0.1); g.fill();
  [0.3, 0.7].forEach(f=>{ g.fillStyle = '#fbfbff'; rr(g, X + W * f - k * 0.32, mt + k * 0.05, k * 0.64, k * 0.36, k * 0.14); g.fill(); g.strokeStyle = 'rgba(160,160,190,.4)'; g.lineWidth = L(k, 0.014); g.stroke(); g.fillStyle = 'rgba(200,200,220,.35)'; g.fillRect(X + W * f - k * 0.2, mt + k * 0.24, k * 0.4, L(k, 0.014)); });
  const qt = mt + k * 0.5;
  g.fillStyle = C.quilt; rr(g, X + k * 0.08, qt, W - k * 0.16, mb - qt + k * 0.3, k * 0.1); g.fill();
  g.fillStyle = C.quilt2; rr(g, X + k * 0.08, qt, W - k * 0.16, k * 0.22, k * 0.08); g.fill();
  /* the quilt's squares */
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = L(k, 0.014);
  for(let i = 1; i < 4; i++){ g.beginPath(); g.moveTo(X + k * 0.08 + (W - k * 0.16) * i / 4, qt + k * 0.22); g.lineTo(X + k * 0.08 + (W - k * 0.16) * i / 4, mb + k * 0.3); g.stroke(); }
  for(let i = 1; i < 4; i++){ const yy = qt + k * 0.22 + (mb + k * 0.3 - qt - k * 0.22) * i / 4; g.beginPath(); g.moveTo(X + k * 0.08, yy); g.lineTo(X + W - k * 0.08, yy); g.stroke(); }
  for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++){ const qx = X + k * 0.08 + (W - k * 0.16) * (i + 0.5) / 4, qy = qt + k * 0.22 + (mb + k * 0.3 - qt - k * 0.22) * (j + 0.5) / 4;
    if(blue){ g.fillStyle = 'rgba(255,230,150,.75)'; g.beginPath(); for(let q = 0; q < 10; q++){ const a = q / 10 * TAU - Math.PI / 2, rr0 = q % 2 ? k * 0.025 : k * 0.06; g.lineTo(qx + Math.cos(a) * rr0, qy + Math.sin(a) * rr0); } g.closePath(); g.fill(); }
    else { for(let q = 0; q < 5; q++){ const a = q / 5 * TAU; circ(g, qx + Math.cos(a) * k * 0.035, qy + Math.sin(a) * k * 0.035, k * 0.03, (i + j) % 2 ? '#ffffff' : '#c98ad8'); } circ(g, qx, qy, k * 0.02, '#f6d36a'); } }
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(X + k * 0.08, mb + k * 0.22, W - k * 0.16, k * 0.08);
  /* a plush on the little princess's bed */
  if(!blue){ const px = X + W * 0.72, py = qt + k * 0.05; circ(g, px, py, k * 0.13, '#f4e6d0'); ell(g, px - k * 0.07, py - k * 0.18, k * 0.04, k * 0.11, '#f4e6d0'); ell(g, px + k * 0.07, py - k * 0.18, k * 0.04, k * 0.11, '#f4e6d0'); ell(g, px - k * 0.07, py - k * 0.18, k * 0.02, k * 0.07, '#f7c6d8'); ell(g, px + k * 0.07, py - k * 0.18, k * 0.02, k * 0.07, '#f7c6d8'); circ(g, px - k * 0.045, py - k * 0.01, k * 0.015, '#3a2a2a'); circ(g, px + k * 0.045, py - k * 0.01, k * 0.015, '#3a2a2a'); circ(g, px, py + k * 0.04, k * 0.015, '#e8578f'); }
  /* the footboard and front posts */
  g.fillStyle = C.head; rr(g, X + k * 0.06, base - k * 0.42, W - k * 0.12, k * 0.26, k * 0.06); g.fill();
  g.fillStyle = GOLD; g.fillRect(X + k * 0.06, base - k * 0.42, W - k * 0.12, k * 0.035);
  [X, X + W - k * 0.12].forEach(px=>{ g.fillStyle = lin(g, px, 0, px + k * 0.12, 0, [[0, GOLD_L], [1, GOLD_D]]); g.fillRect(px, ct + k * 0.25, k * 0.12, base - ct - k * 0.25); circ(g, px + k * 0.06, base - k * 0.02, k * 0.08, GOLD_D); });
  /* the canopy: its valance scalloped, curtains tied to the front posts */
  g.fillStyle = C.cloth; g.fillRect(X - k * 0.04, ct, W + k * 0.08, k * 0.32);
  g.fillStyle = sh(C.cloth, -0.15); g.fillRect(X - k * 0.04, ct, W + k * 0.08, k * 0.06);
  const sc = 7;
  for(let i = 0; i < sc; i++){ const sx = X - k * 0.04 + (W + k * 0.08) * (i + 0.5) / sc; g.fillStyle = C.cloth2; g.beginPath(); g.arc(sx, ct + k * 0.32, (W + k * 0.08) / sc / 2, 0, Math.PI); g.fill(); circ(g, sx, ct + k * 0.32 + (W + k * 0.08) / sc / 2, k * 0.025, GOLD); }
  g.fillStyle = GOLD; g.fillRect(X - k * 0.04, ct + k * 0.28, W + k * 0.08, k * 0.04);
  [-1, 1].forEach(sd=>{
    const px = sd < 0 ? X + k * 0.06 : X + W - k * 0.06, ty = base - k * 1.25;
    g.fillStyle = C.cloth2; g.beginPath(); g.moveTo(px - sd * k * 0.02, ct + k * 0.36); g.quadraticCurveTo(px + sd * k * 0.28, ty - k * 0.3, px + sd * k * 0.08, ty); g.quadraticCurveTo(px + sd * k * 0.2, ty + k * 0.4, px + sd * k * 0.04, base - k * 0.5); g.lineTo(px - sd * k * 0.06, base - k * 0.5); g.lineTo(px - sd * k * 0.06, ct + k * 0.36); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = L(k, 0.014); g.beginPath(); g.moveTo(px, ct + k * 0.4); g.quadraticCurveTo(px + sd * k * 0.16, ty - k * 0.2, px + sd * k * 0.05, ty); g.stroke();
    g.strokeStyle = GOLD; g.lineWidth = L(k, 0.03); g.beginPath(); g.moveTo(px - sd * k * 0.04, ty); g.lineTo(px + sd * k * 0.12, ty + k * 0.02); g.stroke(); circ(g, px + sd * k * 0.13, ty + k * 0.05, k * 0.03, GOLD_L);
  });
  [X + k * 0.06, X + W - k * 0.06].forEach(px=> circ(g, px, ct - k * 0.04, k * 0.07, GOLD));
}
function drawWardrobe(g, d, x, y, w, h, k){
  const X = x + w * 0.05, W = w * 0.9, top = y + h * 0.1, base = y + h * 0.97;
  shadow(g, x + w / 2, base, w * 0.48, k * 0.1, 0.24);
  g.fillStyle = '#efe2f4'; g.fillRect(X, top + k * 0.2, W, base - top - k * 0.32);
  g.fillStyle = lin(g, X, 0, X + W, 0, [[0, 'rgba(255,255,255,.4)'], [1, 'rgba(120,80,140,.18)']]); g.fillRect(X, top + k * 0.2, W, base - top - k * 0.32);
  /* the crown on top */
  g.fillStyle = '#e3d2ec'; g.beginPath(); g.moveTo(X - k * 0.06, top + k * 0.26); g.lineTo(X - k * 0.06, top + k * 0.12); g.quadraticCurveTo(X + W / 2, top - k * 0.22, X + W + k * 0.06, top + k * 0.12); g.lineTo(X + W + k * 0.06, top + k * 0.26); g.closePath(); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.03); g.beginPath(); g.moveTo(X - k * 0.06, top + k * 0.12); g.quadraticCurveTo(X + W / 2, top - k * 0.22, X + W + k * 0.06, top + k * 0.12); g.stroke();
  g.fillStyle = GOLD; g.fillRect(X - k * 0.06, top + k * 0.22, W + k * 0.12, k * 0.05);
  const cx = X + W / 2;
  g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx - k * 0.16, top + k * 0.02); g.lineTo(cx - k * 0.18, top - k * 0.14); g.lineTo(cx - k * 0.08, top - k * 0.06); g.lineTo(cx, top - k * 0.2); g.lineTo(cx + k * 0.08, top - k * 0.06); g.lineTo(cx + k * 0.18, top - k * 0.14); g.lineTo(cx + k * 0.16, top + k * 0.02); g.closePath(); g.fill();
  circ(g, cx, top - k * 0.2, k * 0.03, '#f07aa6');
  /* two doors, a mirror in one, the other just open: a sleeve of a dress peeps out */
  const dt = top + k * 0.36, db = base - k * 0.22, dw = W / 2 - k * 0.06;
  [0, 1].forEach(i=>{
    const dx = X + k * 0.04 + i * (W / 2);
    g.fillStyle = '#e9d8f0'; g.fillRect(dx, dt, dw, db - dt);
    g.strokeStyle = GOLD; g.lineWidth = L(k, 0.02); g.strokeRect(dx + k * 0.06, dt + k * 0.08, dw - k * 0.12, db - dt - k * 0.16);
    if(i === 0){ g.fillStyle = lin(g, dx, dt, dx + dw, db, [[0, '#dfe9f4'], [0.5, '#f8fbff'], [1, '#c9d6e6']]); rr(g, dx + k * 0.1, dt + k * 0.14, dw - k * 0.2, db - dt - k * 0.28, k * 0.2); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(dx + k * 0.16, dt + k * 0.5); g.lineTo(dx + k * 0.3, dt + k * 0.3); g.lineTo(dx + k * 0.34, dt + k * 0.36); g.lineTo(dx + k * 0.2, dt + k * 0.56); g.closePath(); g.fill(); }
    else { for(let j = 0; j < 3; j++) circ(g, dx + dw / 2, dt + (db - dt) * (0.3 + j * 0.2), k * 0.04, '#f07aa6'); }
    circ(g, dx + (i ? k * 0.06 : dw - k * 0.06), dt + (db - dt) * 0.5, k * 0.035, GOLD);
  });
  g.fillStyle = '#f7b8d0'; g.beginPath(); g.moveTo(X + W - k * 0.02, dt + (db - dt) * 0.4); g.quadraticCurveTo(X + W + k * 0.14, dt + (db - dt) * 0.55, X + W + k * 0.04, dt + (db - dt) * 0.75); g.lineTo(X + W - k * 0.02, dt + (db - dt) * 0.7); g.closePath(); g.fill();
  g.fillStyle = '#d8c4e2'; g.fillRect(X - k * 0.03, base - k * 0.22, W + k * 0.06, k * 0.12);
  [X + k * 0.04, X + W - k * 0.12].forEach(fx=>{ g.fillStyle = GOLD_D; g.fillRect(fx, base - k * 0.1, k * 0.08, k * 0.1); });
}
/* a fireplace: marble and gold in the palace, rough stone in the tavern; its fire drawn as it burns */
function drawHearth(g, d, x, y, w, h, k){
  const marble = !!d.marble, base = y + h * 0.97;
  const ox = x + w * 0.04, ow = w * 0.92, mt = y + h * 0.42;
  if(marble){
    /* the overmantel: a gold mirror */
    const mx = x + w * 0.22, mw = w * 0.56, my = y + h * 0.02, mh = mt - my - k * 0.08;
    g.fillStyle = GOLD_D; rr(g, mx, my, mw, mh, k * 0.12); g.fill();
    g.fillStyle = lin(g, mx, my, mx + mw, my + mh, [[0, '#dfe9f4'], [0.5, '#fafcff'], [1, '#c9d6e6']]); rr(g, mx + k * 0.06, my + k * 0.06, mw - k * 0.12, mh - k * 0.12, k * 0.1); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(mx + mw * 0.2, my + mh * 0.8); g.lineTo(mx + mw * 0.45, my + mh * 0.2); g.lineTo(mx + mw * 0.52, my + mh * 0.25); g.lineTo(mx + mw * 0.27, my + mh * 0.85); g.closePath(); g.fill();
    circ(g, mx + mw / 2, my, k * 0.07, GOLD);
  } else {
    /* the chimney breast, rough stones */
    const R = rng(4400);
    g.fillStyle = '#8a8076'; g.fillRect(x + w * 0.1, y, w * 0.8, mt - y);
    for(let r = 0; r < 6; r++){ let xx = x + w * 0.1 - R() * k * 0.2; while(xx < x + w * 0.9){ const sw = k * (0.25 + R() * 0.2), sy = y + r * (mt - y) / 6; g.fillStyle = sh('#a39a8e', (R() - 0.5) * 0.3); rr(g, Math.max(xx, x + w * 0.1) + L(k, 0.02), sy + L(k, 0.02), Math.min(sw, x + w * 0.9 - xx) - L(k, 0.04), (mt - y) / 6 - L(k, 0.04), k * 0.04); g.fill(); xx += sw; } }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + w * 0.86, y, w * 0.04, mt - y);
    /* a wreath on it */
    const wx = x + w / 2, wy = y + (mt - y) * 0.45;
    for(let i = 0; i < 14; i++){ const a = i / 14 * TAU; ell(g, wx + Math.cos(a) * k * 0.2, wy + Math.sin(a) * k * 0.2, k * 0.08, k * 0.05, i % 2 ? '#3f7d3a' : '#4f9447'); }
    [0.3, 2.2, 4.1].forEach(a=> circ(g, wx + Math.cos(a) * k * 0.2, wy + Math.sin(a) * k * 0.2, k * 0.035, '#c8343a'));
    g.fillStyle = '#c8343a'; g.beginPath(); g.moveTo(wx, wy + k * 0.2); g.lineTo(wx - k * 0.08, wy + k * 0.32); g.lineTo(wx, wy + k * 0.27); g.lineTo(wx + k * 0.08, wy + k * 0.32); g.closePath(); g.fill();
  }
  /* the surround */
  const st = marble ? '#f2ece2' : '#9a8f84', sd = marble ? '#d6cbb8' : '#756b61';
  g.fillStyle = st; g.fillRect(ox, mt, ow, base - mt);
  if(!marble){ const R = rng(4500); for(let r = 0; r < 4; r++) for(let i = 0; i < 5; i++){ g.fillStyle = sh('#a8a094', (R() - 0.5) * 0.25); rr(g, ox + ow * (i / 5 + (r % 2) * 0.1) - k * 0.05, mt + k * 0.08 + r * (base - mt) / 4.2, ow / 5 - k * 0.03, (base - mt) / 4.2 - k * 0.03, k * 0.04); g.fill(); } }
  else { g.fillStyle = 'rgba(160,140,150,.3)'; for(let i = 0; i < 3; i++){ g.fillRect(ox + ow * 0.08, mt + (base - mt) * (0.25 + i * 0.25), ow * 0.12, L(k, 0.012)); g.fillRect(ox + ow * 0.8, mt + (base - mt) * (0.25 + i * 0.25), ow * 0.12, L(k, 0.012)); } }
  /* the mantel shelf, and what stands on it */
  g.fillStyle = marble ? GOLD : '#6b4226'; g.fillRect(ox - k * 0.08, mt - k * 0.02, ow + k * 0.16, k * 0.12);
  g.fillStyle = marble ? GOLD_L : 'rgba(255,220,170,.3)'; g.fillRect(ox - k * 0.08, mt - k * 0.02, ow + k * 0.16, L(k, 0.016));
  if(marble){
    [0.12, 0.88].forEach(f=>{ const cx = ox + ow * f; ell(g, cx, mt - k * 0.02, k * 0.06, k * 0.02, GOLD_D); g.fillStyle = GOLD; g.fillRect(cx - k * 0.015, mt - k * 0.22, k * 0.03, k * 0.2); candle(g, cx, mt - k * 0.42, k * 0.05, k * 0.2); });
    const cx = ox + ow / 2; g.fillStyle = GOLD; rr(g, cx - k * 0.14, mt - k * 0.3, k * 0.28, k * 0.28, k * 0.08); g.fill(); circ(g, cx, mt - k * 0.17, k * 0.1, '#fbf6e8'); g.strokeStyle = '#3a2a1a'; g.lineWidth = L(k, 0.012); g.beginPath(); g.moveTo(cx, mt - k * 0.17); g.lineTo(cx, mt - k * 0.24); g.moveTo(cx, mt - k * 0.17); g.lineTo(cx + k * 0.05, mt - k * 0.15); g.stroke();
  } else {
    /* jars, a copper pot, a candle */
    [['#c8343a', 0.12], ['#e8862a', 0.22]].forEach(([c, f])=>{ const jx = ox + ow * f; g.fillStyle = 'rgba(240,250,255,.6)'; rr(g, jx - k * 0.06, mt - k * 0.16, k * 0.12, k * 0.15, k * 0.03); g.fill(); g.fillStyle = c; g.fillRect(jx - k * 0.05, mt - k * 0.11, k * 0.1, k * 0.09); g.fillStyle = '#fff6f0'; g.fillRect(jx - k * 0.065, mt - k * 0.18, k * 0.13, k * 0.04); });
    ell(g, ox + ow * 0.78, mt - k * 0.09, k * 0.12, k * 0.08, '#c0703a'); g.fillStyle = '#e0904a'; g.fillRect(ox + ow * 0.78 - k * 0.1, mt - k * 0.14, k * 0.2, k * 0.03);
    candle(g, ox + ow * 0.9, mt - k * 0.26, k * 0.045, k * 0.24);
  }
  /* the firebox */
  const fx = ox + ow * 0.2, fw = ow * 0.6, ft = mt + (base - mt) * 0.22;
  g.fillStyle = marble ? GOLD : sd; archPath(g, fx - k * 0.06, ft - k * 0.06, fw + k * 0.12, base - ft + k * 0.06, true); g.fill();
  g.fillStyle = '#1a100a'; archPath(g, fx, ft, fw, base - ft, true); g.fill();
  g.fillStyle = 'rgba(80,50,40,.6)'; for(let i = 0; i < 4; i++) g.fillRect(fx + k * 0.04, ft + fw * 0.4 + i * (base - ft - fw * 0.4) / 4, fw - k * 0.08, L(k, 0.012));
  /* the logs and the grate */
  const ly = base - k * 0.14;
  g.fillStyle = '#6b4226'; rr(g, fx + fw * 0.12, ly - k * 0.08, fw * 0.76, k * 0.1, k * 0.05); g.fill();
  g.fillStyle = '#5a3418'; g.save(); g.translate(fx + fw / 2, ly - k * 0.12); g.rotate(-0.2); rr(g, -fw * 0.3, -k * 0.05, fw * 0.6, k * 0.1, k * 0.05); g.fill(); g.restore();
  ell(g, fx + fw * 0.14, ly - k * 0.03, k * 0.05, k * 0.05, '#c9a070');
  g.fillStyle = '#2a2a33'; g.fillRect(fx + fw * 0.06, base - k * 0.06, fw * 0.88, k * 0.04); [0.1, 0.3, 0.5, 0.7, 0.9].forEach(f=> g.fillRect(fx + fw * f - L(k, 0.01), base - k * 0.14, L(k, 0.02), k * 0.1));
  /* the hearthstone, a brass fender in the palace */
  g.fillStyle = marble ? '#e8dfcf' : '#7a7066'; g.fillRect(ox - k * 0.1, base - k * 0.02, ow + k * 0.2, k * 0.06);
  if(marble){ g.fillStyle = GOLD; g.fillRect(fx - k * 0.15, base - k * 0.02, fw + k * 0.3, k * 0.04); }
}
function hearthFire(g, d, x, y, w, h, k, t){
  const base = y + h * 0.97, ox = x + w * 0.04, ow = w * 0.92, mt = y + h * 0.42, fx = ox + ow * 0.2, fw = ow * 0.6, ft = mt + (base - mt) * 0.22;
  g.save(); archPath(g, fx, ft, fw, base - ft, true); g.clip();
  g.fillStyle = rad(g, fx + fw / 2, base - k * 0.1, 0, fw * 0.7, [[0, 'rgba(255,170,60,.55)'], [1, 'rgba(255,120,40,0)']]); g.fillRect(fx, ft, fw, base - ft);
  for(let i = 0; i < 9; i++){
    const ph = (t * 1.6 + i * 0.37) % 1, px = fx + fw * (0.22 + 0.56 * jgHash(i, 3, 7)), by = base - k * 0.16;
    g.fillStyle = `rgba(255,${130 + 100 * (1 - ph)},40,${0.9 * (1 - ph)})`;
    g.beginPath(); g.ellipse(px + Math.sin(t * 4 + i) * k * 0.02, by - (base - ft) * 0.55 * ph, fw * (0.1 - 0.06 * ph), (base - ft) * (0.22 - 0.1 * ph), 0, 0, TAU); g.fill();
  }
  ell(g, fx + fw / 2, base - k * 0.16, fw * 0.3, k * 0.08, 'rgba(255,240,170,.85)');
  g.restore();
  if(!d.marble){ for(let i = 0; i < 4; i++){ const ph = (t * 0.5 + i / 4) % 1; circ(g, fx + fw * (0.3 + 0.4 * jgHash(i, 5, 2)) + Math.sin(t * 3 + i) * k * 0.05, ft - ph * k * 0.6, k * 0.015 * (1 - ph) + 0.5, `rgba(255,200,90,${1 - ph})`); } }
  g.fillStyle = rad(g, fx + fw / 2, base, 0, w * (0.75 + 0.05 * Math.sin(t * 7)), [[0, 'rgba(255,170,80,.24)'], [1, 'rgba(255,170,80,0)']]); g.fillRect(x - w * 0.3, base - h * 0.6, w * 1.6, h);
  if(d.marble){ const cx = ox + ow * 0.12, cx2 = ox + ow * 0.88; [cx, cx2].forEach((c, i)=> flameAt(g, c, mt - k * 0.45, k * 0.035, t, i + 7)); }
  else flameAt(g, ox + ow * 0.9, mt - k * 0.29, k * 0.035, t, 3);
}
/* the Dauphin's: a rack of swords and lances, a shield */
function drawWeaponRack(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.97;
  shadow(g, cx, base, w * 0.44, k * 0.07, 0.2);
  g.fillStyle = '#5a3418'; g.fillRect(x + w * 0.08, base - k * 0.16, w * 0.84, k * 0.12); g.fillRect(x + w * 0.08, y + h * 0.42, w * 0.84, k * 0.07);
  [0.18, 0.82].forEach(f=> g.fillRect(x + w * f - k * 0.03, y + h * 0.4, k * 0.06, base - y - h * 0.4));
  [[0.24, '#c9ccd8', 1], [0.4, '#e8ebf2', 0], [0.6, '#c9ccd8', 0], [0.76, '#e8ebf2', 1]].forEach(([f, c, lance])=>{
    const sx = x + w * f;
    if(lance){ g.fillStyle = '#7a4a28'; g.fillRect(sx - k * 0.02, y + h * 0.04, k * 0.04, base - y - h * 0.2); g.fillStyle = c; g.beginPath(); g.moveTo(sx, y); g.lineTo(sx + k * 0.05, y + h * 0.08); g.lineTo(sx - k * 0.05, y + h * 0.08); g.closePath(); g.fill(); g.fillStyle = '#3c6fc4'; g.beginPath(); g.moveTo(sx, y + h * 0.1); g.lineTo(sx + k * 0.16, y + h * 0.14); g.lineTo(sx, y + h * 0.18); g.closePath(); g.fill(); }
    else { g.fillStyle = c; g.fillRect(sx - k * 0.025, y + h * 0.12, k * 0.05, h * 0.5); g.beginPath(); g.moveTo(sx - k * 0.025, y + h * 0.12); g.lineTo(sx, y + h * 0.06); g.lineTo(sx + k * 0.025, y + h * 0.12); g.fill(); g.fillStyle = GOLD; g.fillRect(sx - k * 0.08, y + h * 0.62, k * 0.16, k * 0.04); g.fillStyle = '#3a2a6a'; g.fillRect(sx - k * 0.02, y + h * 0.65, k * 0.04, k * 0.16); circ(g, sx, y + h * 0.65 + k * 0.18, k * 0.03, GOLD); }
  });
  /* the shield */
  const sy = y + h * 0.5;
  g.fillStyle = '#2a4a8e'; g.beginPath(); g.moveTo(cx - k * 0.22, sy); g.lineTo(cx + k * 0.22, sy); g.lineTo(cx + k * 0.2, sy + k * 0.3); g.quadraticCurveTo(cx, sy + k * 0.5, cx - k * 0.2, sy + k * 0.3); g.closePath(); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.03); g.stroke();
  g.fillStyle = GOLD_L; g.beginPath(); for(let i = 0; i < 10; i++){ const a = i / 10 * TAU - Math.PI / 2, q = i % 2 ? k * 0.04 : k * 0.1; g.lineTo(cx + Math.cos(a) * q, sy + k * 0.18 + Math.sin(a) * q); } g.closePath(); g.fill();
}
/* the Dauphin's desk: maps and a compass, a candle */
function drawDesk(g, d, x, y, w, h, k){
  const top = y + h * 0.3, base = y + h * 0.97, X = x + w * 0.06, W = w * 0.88;
  shadow(g, x + w / 2, base, w * 0.48, k * 0.08, 0.22);
  g.fillStyle = '#4a2a16'; g.fillRect(X, top + k * 0.3, W, base - top - k * 0.3);
  g.fillStyle = '#5e3820'; [0, 1].forEach(i=> g.fillRect(X + k * 0.06 + i * W * 0.62, top + k * 0.38, W * 0.32, base - top - k * 0.5));
  [0, 1].forEach(i=>{ for(let j = 0; j < 2; j++){ g.strokeStyle = GOLD; g.lineWidth = L(k, 0.012); g.strokeRect(X + k * 0.1 + i * W * 0.62, top + k * 0.42 + j * (base - top - k * 0.5) / 2, W * 0.32 - k * 0.08, (base - top - k * 0.5) / 2 - k * 0.06); circ(g, X + k * 0.06 + i * W * 0.62 + W * 0.16, top + k * 0.42 + (j + 0.5) * (base - top - k * 0.5) / 2, k * 0.025, GOLD); } });
  g.fillStyle = '#6e4428'; g.fillRect(X - k * 0.04, top, W + k * 0.08, k * 0.36);
  g.fillStyle = '#2f5f3a'; g.fillRect(X + k * 0.06, top + k * 0.04, W - k * 0.12, k * 0.26);
  /* a map, a compass, a candle */
  g.fillStyle = '#f2e6c4'; g.save(); g.translate(x + w * 0.4, top + k * 0.16); g.rotate(-0.08); g.fillRect(-k * 0.4, -k * 0.13, k * 0.8, k * 0.26);
  g.strokeStyle = '#3c6fc4'; g.lineWidth = L(k, 0.012); g.beginPath(); g.moveTo(-k * 0.3, k * 0.05); g.quadraticCurveTo(0, -k * 0.1, k * 0.3, k * 0.04); g.stroke();
  g.fillStyle = '#6fae5a'; g.beginPath(); g.ellipse(-k * 0.1, -k * 0.03, k * 0.1, k * 0.05, 0.3, 0, TAU); g.fill();
  g.fillStyle = '#c8343a'; g.font = `900 ${Math.round(k * 0.12)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✕', k * 0.18, -k * 0.04); g.restore();
  circ(g, x + w * 0.8, top + k * 0.15, k * 0.08, GOLD); circ(g, x + w * 0.8, top + k * 0.15, k * 0.06, '#fbf6e8'); g.fillStyle = '#c8343a'; g.beginPath(); g.moveTo(x + w * 0.8, top + k * 0.1); g.lineTo(x + w * 0.81, top + k * 0.15); g.lineTo(x + w * 0.79, top + k * 0.15); g.fill();
}
/* the little princess's: a dressing table and its mirror, ribbons, a music box */
function drawVanity(g, d, x, y, w, h, k){
  const cx = x + w / 2, top = y + h * 0.5, base = y + h * 0.97;
  shadow(g, cx, base, w * 0.46, k * 0.08, 0.2);
  /* the mirror */
  const my = y + h * 0.05, mh = top - my - k * 0.02;
  g.fillStyle = GOLD; g.beginPath(); g.ellipse(cx, my + mh / 2, w * 0.26, mh / 2, 0, 0, TAU); g.fill();
  g.fillStyle = lin(g, cx - w * 0.22, my, cx + w * 0.22, my + mh, [[0, '#e6eef8'], [0.5, '#ffffff'], [1, '#cfdaea']]); g.beginPath(); g.ellipse(cx, my + mh / 2, w * 0.22, mh / 2 - k * 0.05, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(cx - w * 0.1, my + mh * 0.7); g.lineTo(cx, my + mh * 0.25); g.lineTo(cx + w * 0.04, my + mh * 0.3); g.lineTo(cx - w * 0.06, my + mh * 0.75); g.closePath(); g.fill();
  g.fillStyle = '#f07aa6'; g.beginPath(); g.moveTo(cx, my + k * 0.02); g.lineTo(cx - k * 0.14, my - k * 0.06); g.lineTo(cx - k * 0.12, my + k * 0.08); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cx, my + k * 0.02); g.lineTo(cx + k * 0.14, my - k * 0.06); g.lineTo(cx + k * 0.12, my + k * 0.08); g.closePath(); g.fill(); circ(g, cx, my + k * 0.02, k * 0.04, '#e8578f');
  /* the table: white, gold, a pink skirt */
  g.fillStyle = '#ffffff'; g.fillRect(x + w * 0.08, top, w * 0.84, k * 0.12); g.fillStyle = GOLD; g.fillRect(x + w * 0.08, top + k * 0.1, w * 0.84, k * 0.03);
  g.fillStyle = '#f7c6d8'; g.beginPath(); g.moveTo(x + w * 0.08, top + k * 0.13); for(let i = 0; i <= 10; i++) g.lineTo(x + w * (0.08 + 0.84 * i / 10), base - k * 0.04 - (i % 2) * k * 0.05); g.lineTo(x + w * 0.92, top + k * 0.13); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(220,100,150,.4)'; g.lineWidth = L(k, 0.012); for(let i = 1; i < 10; i += 2){ g.beginPath(); g.moveTo(x + w * (0.08 + 0.084 * i), top + k * 0.15); g.lineTo(x + w * (0.08 + 0.084 * i), base - k * 0.08); g.stroke(); }
  /* on it: a music box, a brush, a bottle of scent */
  g.fillStyle = '#c98ad8'; g.fillRect(x + w * 0.16, top - k * 0.12, k * 0.26, k * 0.12); g.fillStyle = GOLD; g.fillRect(x + w * 0.16, top - k * 0.14, k * 0.26, k * 0.03); circ(g, x + w * 0.16 + k * 0.13, top - k * 0.06, k * 0.025, '#ffffff');
  g.fillStyle = '#e8c3a0'; rr(g, x + w * 0.6, top - k * 0.06, k * 0.22, k * 0.07, k * 0.03); g.fill();
  g.fillStyle = 'rgba(200,170,240,.85)'; g.beginPath(); g.ellipse(x + w * 0.82, top - k * 0.07, k * 0.05, k * 0.07, 0, 0, TAU); g.fill(); circ(g, x + w * 0.82, top - k * 0.16, k * 0.025, GOLD);
}
function drawToyChest(g, d, x, y, w, h, k){
  const X = x + w * 0.08, W = w * 0.84, base = y + h * 0.97, top = y + h * 0.5;
  shadow(g, x + w / 2, base, w * 0.46, k * 0.07, 0.2);
  /* the lid, open, propped against the wall */
  g.fillStyle = '#e88ab0'; g.beginPath(); g.moveTo(X, top); g.lineTo(X + k * 0.06, y + h * 0.08); g.lineTo(X + W - k * 0.06, y + h * 0.08); g.lineTo(X + W, top); g.closePath(); g.fill();
  g.fillStyle = GOLD; g.fillRect(X + k * 0.06, y + h * 0.08, W - k * 0.12, k * 0.04);
  g.fillStyle = '#ffffff'; g.font = `900 ${Math.round(k * 0.22)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', x + w / 2, (top + y + h * 0.08) / 2);
  /* the toys peeking out */
  circ(g, X + W * 0.25, top - k * 0.04, k * 0.12, '#3c6fc4'); g.fillStyle = '#ffffff'; g.fillRect(X + W * 0.25 - k * 0.12, top - k * 0.06, k * 0.24, k * 0.04);
  ell(g, X + W * 0.62, top - k * 0.08, k * 0.1, k * 0.12, '#c8a070'); circ(g, X + W * 0.55, top - k * 0.2, k * 0.045, '#c8a070'); circ(g, X + W * 0.69, top - k * 0.2, k * 0.045, '#c8a070'); circ(g, X + W * 0.6, top - k * 0.1, k * 0.012, '#2a1a0a'); circ(g, X + W * 0.65, top - k * 0.1, k * 0.012, '#2a1a0a');
  g.fillStyle = '#f2c23a'; g.fillRect(X + W * 0.78, top - k * 0.14, k * 0.12, k * 0.12); g.fillStyle = '#c8343a'; g.font = `900 ${Math.round(k * 0.1)}px sans-serif`; g.fillText('A', X + W * 0.78 + k * 0.06, top - k * 0.08);
  /* the chest */
  g.fillStyle = '#f7c6d8'; g.fillRect(X, top, W, base - top - k * 0.04);
  g.fillStyle = GOLD; g.fillRect(X, top, W, k * 0.04); g.fillRect(X, base - k * 0.1, W, k * 0.04);
  g.fillStyle = '#e88ab0'; [0.2, 0.5, 0.8].forEach(f=>{ for(let q = 0; q < 5; q++){ const a = q / 5 * TAU; circ(g, X + W * f + Math.cos(a) * k * 0.035, top + (base - top) * 0.5 + Math.sin(a) * k * 0.035, k * 0.03, '#ffffff'); } circ(g, X + W * f, top + (base - top) * 0.5, k * 0.02, '#f6d36a'); });
}
function drawRockingHorse(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.95;
  shadow(g, cx, base, w * 0.42, k * 0.07, 0.2);
  g.strokeStyle = '#8a5a32'; g.lineWidth = L(k, 0.06); g.beginPath(); g.moveTo(x + w * 0.08, base - k * 0.25); g.quadraticCurveTo(cx, base + k * 0.05, x + w * 0.92, base - k * 0.25); g.stroke();
  g.lineWidth = L(k, 0.045); [-1, 1].forEach(sd=>{ g.beginPath(); g.moveTo(cx + sd * w * 0.15, base - k * 0.12); g.lineTo(cx + sd * w * 0.2, base - k * 0.55); g.stroke(); });
  const by = base - k * 0.72;
  ell(g, cx, by, w * 0.32, k * 0.2, '#f4f1ea');
  g.fillStyle = '#f4f1ea'; g.beginPath(); g.moveTo(cx + w * 0.18, by - k * 0.08); g.lineTo(cx + w * 0.3, by - k * 0.5); g.lineTo(cx + w * 0.44, by - k * 0.42); g.lineTo(cx + w * 0.36, by - k * 0.08); g.closePath(); g.fill();
  ell(g, cx + w * 0.42, by - k * 0.42, w * 0.1, k * 0.09, '#f4f1ea'); circ(g, cx + w * 0.42, by - k * 0.46, k * 0.02, '#2a1a0a');
  g.fillStyle = '#f07aa6'; for(let i = 0; i < 5; i++) ell(g, cx + w * (0.22 + i * 0.04), by - k * (0.15 + i * 0.07), k * 0.05, k * 0.03, '#f07aa6');
  g.fillStyle = '#c8343a'; rr(g, cx - w * 0.12, by - k * 0.2, w * 0.22, k * 0.14, k * 0.04); g.fill(); g.fillStyle = GOLD; g.fillRect(cx - w * 0.12, by - k * 0.09, w * 0.22, k * 0.03);
  g.strokeStyle = '#f07aa6'; g.lineWidth = L(k, 0.04); g.beginPath(); g.moveTo(cx - w * 0.3, by - k * 0.02); g.quadraticCurveTo(cx - w * 0.44, by + k * 0.1, cx - w * 0.38, by + k * 0.25); g.stroke();
}
/* an armchair, velvet, its back to the wall or to the room */
function drawArmchair(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.96, col = d.col || '#7a1e2c';
  shadow(g, cx, base, w * 0.44, k * 0.08, 0.22);
  g.fillStyle = sh(col, -0.1); g.beginPath(); g.moveTo(x + w * 0.14, base - k * 0.3); g.lineTo(x + w * 0.14, y + h * 0.2); g.quadraticCurveTo(cx, y, x + w * 0.86, y + h * 0.2); g.lineTo(x + w * 0.86, base - k * 0.3); g.closePath(); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.025); g.beginPath(); g.moveTo(x + w * 0.14, y + h * 0.2); g.quadraticCurveTo(cx, y, x + w * 0.86, y + h * 0.2); g.stroke();
  for(let i = 0; i < 3; i++) circ(g, x + w * (0.32 + i * 0.18), y + h * 0.3, k * 0.02, GOLD_L);
  g.fillStyle = sh(col, 0.12); rr(g, x + w * 0.2, base - k * 0.55, w * 0.6, k * 0.26, k * 0.08); g.fill();
  [x + w * 0.08, x + w * 0.76].forEach(ax=>{ g.fillStyle = col; rr(g, ax, base - k * 0.6, w * 0.16, k * 0.44, k * 0.07); g.fill(); g.fillStyle = sh(col, 0.2); rr(g, ax, base - k * 0.62, w * 0.16, k * 0.1, k * 0.05); g.fill(); });
  g.fillStyle = sh(col, -0.25); g.fillRect(x + w * 0.12, base - k * 0.3, w * 0.76, k * 0.16);
  [x + w * 0.14, x + w * 0.82].forEach(fx=>{ g.fillStyle = GOLD_D; g.fillRect(fx - k * 0.02, base - k * 0.14, k * 0.05, k * 0.14); });
}
/* a little round table with tea for two */
function drawTeaTable(g, d, x, y, w, h, k){
  const cx = x + w / 2, top = y + h * 0.45, base = y + h * 0.95;
  shadow(g, cx, base, w * 0.36, k * 0.08, 0.2);
  g.fillStyle = GOLD_D; g.fillRect(cx - k * 0.03, top + k * 0.1, k * 0.06, base - top - k * 0.14); ell(g, cx, base - k * 0.04, k * 0.2, k * 0.05, GOLD_D);
  ell(g, cx, top + k * 0.06, w * 0.42, k * 0.2, '#e8dfcf'); ell(g, cx, top, w * 0.42, k * 0.2, '#f6f0e6'); g.strokeStyle = GOLD; g.lineWidth = L(k, 0.02); g.beginPath(); g.ellipse(cx, top, w * 0.42, k * 0.2, 0, 0, TAU); g.stroke();
  ell(g, cx, top - k * 0.06, k * 0.11, k * 0.09, '#ffffff'); g.fillStyle = '#ffffff'; g.fillRect(cx + k * 0.08, top - k * 0.1, k * 0.1, k * 0.03); circ(g, cx, top - k * 0.15, k * 0.02, GOLD);
  [-1, 1].forEach(sd=>{ ell(g, cx + sd * w * 0.26, top + k * 0.02, k * 0.06, k * 0.025, '#ffffff'); g.fillStyle = '#ffffff'; g.fillRect(cx + sd * w * 0.26 - k * 0.035, top - k * 0.04, k * 0.07, k * 0.06); g.fillStyle = '#c98ad8'; g.fillRect(cx + sd * w * 0.26 - k * 0.035, top - k * 0.02, k * 0.07, L(k, 0.012)); });
}
/* a golden harp */
function drawHarp(g, d, x, y, w, h, k){
  const base = y + h * 0.97, X = x + w * 0.2, W = w * 0.6;
  shadow(g, x + w / 2, base, w * 0.38, k * 0.07, 0.22);
  g.fillStyle = GOLD_D; g.fillRect(X, base - k * 0.12, W, k * 0.1);
  /* the column, the neck, the soundboard */
  g.fillStyle = lin(g, X, 0, X + k * 0.1, 0, [[0, GOLD_L], [1, GOLD_D]]); g.fillRect(X, y + h * 0.1, k * 0.1, base - y - h * 0.1 - k * 0.1);
  circ(g, X + k * 0.05, y + h * 0.08, k * 0.08, GOLD);
  g.strokeStyle = GOLD; g.lineWidth = L(k, 0.06); g.beginPath(); g.moveTo(X + k * 0.05, y + h * 0.12); g.bezierCurveTo(X + W * 0.4, y + h * 0.04, X + W * 0.7, y + h * 0.3, X + W, y + h * 0.22); g.stroke();
  g.lineWidth = L(k, 0.08); g.strokeStyle = '#a8742a'; g.beginPath(); g.moveTo(X + W, y + h * 0.22); g.lineTo(X + k * 0.12, base - k * 0.12); g.stroke();
  /* the strings */
  g.strokeStyle = 'rgba(255,255,240,.85)'; g.lineWidth = L(k, 0.008);
  for(let i = 1; i < 10; i++){ const f = i / 10, sx = X + k * 0.1 + (W - k * 0.1) * f, topY = y + h * (0.12 + 0.12 * f) - Math.sin(f * Math.PI) * h * 0.05, botY = y + h * 0.22 + (base - k * 0.12 - y - h * 0.22) * (1 - f); g.beginPath(); g.moveTo(sx, topY + k * 0.04); g.lineTo(sx, Math.max(topY + k * 0.1, botY)); g.stroke(); }
}
/* a chest of oak, iron bands */
function drawChest(g, d, x, y, w, h, k){
  const X = x + w * 0.08, W = w * 0.84, base = y + h * 0.95, top = y + h * 0.3;
  shadow(g, x + w / 2, base, w * 0.46, k * 0.07, 0.22);
  g.fillStyle = '#7a4a28'; g.fillRect(X, top + k * 0.2, W, base - top - k * 0.2);
  g.fillStyle = '#8a5a32'; g.beginPath(); g.moveTo(X, top + k * 0.22); g.quadraticCurveTo(X + W / 2, top - k * 0.08, X + W, top + k * 0.22); g.closePath(); g.fill();
  g.fillStyle = '#3a3338'; [0.15, 0.85].forEach(f=> g.fillRect(X + W * f - k * 0.03, top + k * 0.02, k * 0.06, base - top - k * 0.02)); g.fillRect(X, top + k * 0.2, W, k * 0.05);
  g.fillStyle = GOLD; g.fillRect(X + W / 2 - k * 0.06, top + k * 0.22, k * 0.12, k * 0.14); circ(g, X + W / 2, top + k * 0.3, k * 0.02, '#2a1a0a');
}
/* a potted plant: a big pot, broad leaves */
function drawPlantPot(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.97, R = rng(5100 + Math.round(d.x * 5 + d.y * 11)), pot = d.pot || '#c0663a';
  shadow(g, cx, base, k * 0.3, k * 0.07, 0.22);
  const pt = base - k * 0.42;
  g.fillStyle = pot; g.beginPath(); g.moveTo(cx - k * 0.26, pt); g.lineTo(cx + k * 0.26, pt); g.lineTo(cx + k * 0.19, base - k * 0.02); g.lineTo(cx - k * 0.19, base - k * 0.02); g.closePath(); g.fill();
  g.fillStyle = sh(pot, 0.15); g.fillRect(cx - k * 0.29, pt - k * 0.02, k * 0.58, k * 0.08);
  g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(cx + k * 0.06, pt + k * 0.06, k * 0.14, base - pt - k * 0.08);
  for(let i = 0; i < 9; i++){
    const a = -Math.PI / 2 + (i - 4) * 0.34 + (R() - 0.5) * 0.2, len = k * (0.55 + R() * 0.45);
    const ex = cx + Math.cos(a) * len * 0.7, ey = pt + Math.sin(a) * len;
    g.strokeStyle = '#3f6a2e'; g.lineWidth = L(k, 0.02); g.beginPath(); g.moveTo(cx, pt); g.quadraticCurveTo((cx + ex) / 2, pt - k * 0.1, ex, ey); g.stroke();
    g.fillStyle = i % 2 ? '#3f7d3a' : '#4f9447'; g.save(); g.translate(ex, ey); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, -k * 0.12, k * 0.1, k * 0.18, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = L(k, 0.01); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -k * 0.28); g.stroke();
    if(d.split){ g.fillStyle = 'rgba(0,0,0,.25)'; [-0.08, -0.16].forEach(q=>{ g.fillRect(-k * 0.1, q * k, k * 0.05, L(k, 0.012)); g.fillRect(k * 0.05, q * k, k * 0.05, L(k, 0.012)); }); }
    g.restore();
  }
}

/* ---------- the tavern ---------- */
/* the bar: pine, its front in panels; on it the taps, mugs, a cake under glass, a bell, the buns */
function drawBar(g, d, x, y, w, h, k){
  const top = y + h * 0.3, front = y + h * 0.46, base = y + h * 0.97, X = x + k * 0.1, W = w - k * 0.2;
  /* the top, seen from above (the keepers' legs behind it) */
  g.fillStyle = '#8a5a32'; g.fillRect(X - k * 0.05, top, W + k * 0.1, front - top);
  grain(g, X, top + k * 0.04, W, front - top - k * 0.06, rng(4700), 10, 'rgba(40,20,5,.22)');
  g.fillStyle = 'rgba(255,220,170,.3)'; g.fillRect(X - k * 0.05, top, W + k * 0.1, L(k, 0.016));
  /* the front: panels, a foot rail of brass */
  g.fillStyle = '#7a4a28'; g.fillRect(X, front, W, base - front);
  const n = Math.round(W / k);
  for(let i = 0; i < n; i++){ const px = X + k * 0.06 + i * W / n, pw = W / n - k * 0.12; g.fillStyle = '#6b3e1e'; g.fillRect(px, front + k * 0.12, pw, base - front - k * 0.36); g.fillStyle = 'rgba(255,220,170,.18)'; g.fillRect(px, front + k * 0.12, pw, L(k, 0.014)); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px, base - k * 0.24 - L(k, 0.014), pw, L(k, 0.014));
    g.strokeStyle = 'rgba(255,220,170,.22)'; g.lineWidth = L(k, 0.012); g.beginPath(); g.moveTo(px + pw / 2, front + k * 0.2); g.lineTo(px + pw / 2 - k * 0.1, front + k * 0.3); g.lineTo(px + pw / 2, front + k * 0.4); g.lineTo(px + pw / 2 + k * 0.1, front + k * 0.3); g.closePath(); g.stroke(); }
  g.fillStyle = '#5a3418'; g.fillRect(X - k * 0.05, front - k * 0.02, W + k * 0.1, k * 0.08);
  g.fillStyle = '#c9a24a'; g.fillRect(X, base - k * 0.16, W, k * 0.04); g.fillStyle = '#f2d77a'; g.fillRect(X, base - k * 0.16, W, L(k, 0.012));
  g.fillStyle = '#4a2c18'; g.fillRect(X, base - k * 0.08, W, k * 0.08);
  /* along the top */
  const S0 = top + (front - top) * 0.55, at = (f)=> X + W * f;
  /* the taps */
  [0.08, 0.14].forEach((f, i)=>{ g.fillStyle = '#c9a24a'; g.fillRect(at(f) - k * 0.03, S0 - k * 0.32, k * 0.06, k * 0.3); circ(g, at(f), S0 - k * 0.34, k * 0.05, i ? '#3f9d5a' : '#c8343a'); g.fillStyle = '#e8d6a8'; g.fillRect(at(f) - k * 0.04, S0 - k * 0.1, k * 0.08, k * 0.04); });
  /* mugs */
  [0.24, 0.29, 0.62, 0.68].forEach((f, i)=>{ g.fillStyle = '#e9dcc0'; rr(g, at(f) - k * 0.06, S0 - k * 0.16, k * 0.12, k * 0.16, k * 0.02); g.fill(); g.fillStyle = '#fff8e8'; ell(g, at(f), S0 - k * 0.16, k * 0.06, k * 0.025, i % 2 ? '#fff8e8' : '#f6e2b0'); g.strokeStyle = '#c9b48e'; g.lineWidth = L(k, 0.018); g.beginPath(); g.arc(at(f) + k * 0.07, S0 - k * 0.08, k * 0.04, -1.3, 1.3); g.stroke(); g.fillStyle = '#c8343a'; g.fillRect(at(f) - k * 0.06, S0 - k * 0.1, k * 0.12, L(k, 0.014)); });
  /* the cake under its glass dome */
  const cxx = at(0.44);
  ell(g, cxx, S0, k * 0.2, k * 0.05, '#e8e4dc'); g.fillStyle = '#b8743a'; g.fillRect(cxx - k * 0.14, S0 - k * 0.16, k * 0.28, k * 0.15); ell(g, cxx, S0 - k * 0.16, k * 0.14, k * 0.04, '#f4ecd6');
  g.fillStyle = '#ffffff'; for(let j = 0; j < 4; j++) circ(g, cxx - k * 0.1 + j * k * 0.065, S0 - k * 0.17, k * 0.022, '#ffffff'); circ(g, cxx, S0 - k * 0.22, k * 0.03, '#c8343a');
  g.fillStyle = 'rgba(220,240,255,.28)'; g.beginPath(); g.moveTo(cxx - k * 0.18, S0); g.lineTo(cxx - k * 0.18, S0 - k * 0.24); g.quadraticCurveTo(cxx, S0 - k * 0.46, cxx + k * 0.18, S0 - k * 0.24); g.lineTo(cxx + k * 0.18, S0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = L(k, 0.014); g.stroke(); circ(g, cxx, S0 - k * 0.37, k * 0.025, '#c9a24a');
  /* a plate of choux buns, a bell, a little pot of flowers */
  ell(g, at(0.82), S0 - k * 0.02, k * 0.18, k * 0.06, '#ffffff'); [[-0.08, 0], [0.06, 0], [-0.01, -0.06]].forEach(([a, b])=>{ circ(g, at(0.82) + a * k, S0 - k * 0.07 + b * k, k * 0.07, '#e8b46a'); circ(g, at(0.82) + a * k - k * 0.02, S0 - k * 0.09 + b * k, k * 0.025, '#fbe6b8'); });
  g.fillStyle = '#c9a24a'; g.beginPath(); g.moveTo(at(0.93) - k * 0.07, S0); g.quadraticCurveTo(at(0.93) - k * 0.06, S0 - k * 0.12, at(0.93), S0 - k * 0.13); g.quadraticCurveTo(at(0.93) + k * 0.06, S0 - k * 0.12, at(0.93) + k * 0.07, S0); g.closePath(); g.fill(); circ(g, at(0.93), S0 - k * 0.15, k * 0.025, '#c9a24a');
  g.fillStyle = '#c0663a'; g.fillRect(at(0.53) - k * 0.05, S0 - k * 0.1, k * 0.1, k * 0.1); [['#f07aa6', -0.03], ['#ffffff', 0.03], ['#f2c23a', 0]].forEach(([c, a], i)=> circ(g, at(0.53) + a * k, S0 - k * (0.15 + (i === 2 ? 0.04 : 0)), k * 0.03, c));
}
/* a round table: a checked cloth, a candle in a jar, a plate of buns, a mug */
function drawTavernTable(g, d, x, y, w, h, k){
  const cx = x + w / 2, top = y + h * 0.38;
  shadow(g, cx, y + h * 0.9, w * 0.42, h * 0.09, 0.24);
  g.fillStyle = '#6b4226'; g.fillRect(cx - k * 0.05, top + k * 0.2, k * 0.1, y + h * 0.88 - top - k * 0.2); ell(g, cx, y + h * 0.88, k * 0.22, k * 0.06, '#5a3418');
  /* the cloth: falls a little over the edge */
  ell(g, cx, top + k * 0.12, w * 0.47, h * 0.24, '#e8d8c8');
  g.save(); g.beginPath(); g.ellipse(cx, top, w * 0.46, h * 0.24, 0, 0, TAU); g.clip();
  g.fillStyle = '#fff6f0'; g.fillRect(x, top - h * 0.3, w, h * 0.6);
  g.fillStyle = 'rgba(200,52,58,.45)'; const c = k * 0.09;
  for(let xx = x; xx < x + w; xx += c * 2) g.fillRect(xx, top - h * 0.3, c, h * 0.6);
  for(let yy = top - h * 0.3; yy < top + h * 0.3; yy += c * 2) g.fillRect(x, yy, w, c);
  g.restore();
  g.fillStyle = 'rgba(200,52,58,.5)'; for(let i = 0; i < 9; i++){ const a = Math.PI * 0.1 + i * Math.PI * 0.1; g.fillRect(cx + Math.cos(a) * w * 0.46 - k * 0.03, top + Math.sin(a) * h * 0.24, k * 0.06, k * 0.08); }
  /* the plate of buns, a mug, the candle */
  ell(g, cx - w * 0.16, top + h * 0.04, k * 0.2, k * 0.08, '#ffffff'); [[-0.06, 0], [0.06, 0.01], [0, -0.05]].forEach(([a, b])=> { circ(g, cx - w * 0.16 + a * k, top + h * 0.02 + b * k, k * 0.07, '#e8b46a'); circ(g, cx - w * 0.16 + a * k - k * 0.02, top + h * 0.01 + b * k, k * 0.025, '#fbe6b8'); });
  g.fillStyle = '#e9dcc0'; rr(g, cx + w * 0.16, top - k * 0.06, k * 0.12, k * 0.14, k * 0.02); g.fill(); ell(g, cx + w * 0.16 + k * 0.06, top - k * 0.06, k * 0.06, k * 0.02, '#f6e2b0');
  g.fillStyle = 'rgba(255,220,170,.45)'; rr(g, cx - k * 0.06, top - k * 0.24, k * 0.12, k * 0.14, k * 0.03); g.fill();
  candle(g, cx, top - k * 0.22, k * 0.07, k * 0.12);
}
function tableFlame(g, d, x, y, w, h, k, t){ const cx = x + w / 2, top = y + h * 0.38; flameAt(g, cx, top - k * 0.24, k * 0.04, t, d.x * 3 + d.y); }
function drawStool(g, d, x, y, w, h, k){
  const cx = x + w / 2;
  shadow(g, cx, y + h * 0.88, w * 0.4, h * 0.1, 0.22);
  g.strokeStyle = '#5a3418'; g.lineWidth = L(k, 0.05);
  [[-0.3, 0.9], [0.3, 0.9], [0, 0.95]].forEach(([a, b])=>{ g.beginPath(); g.moveTo(cx + a * w * 0.5, y + h * 0.5); g.lineTo(cx + a * w, y + h * b); g.stroke(); });
  g.lineWidth = L(k, 0.025); g.beginPath(); g.moveTo(cx - w * 0.24, y + h * 0.72); g.lineTo(cx + w * 0.24, y + h * 0.72); g.stroke();
  ell(g, cx, y + h * 0.5, w * 0.44, h * 0.18, '#6b4226'); ell(g, cx, y + h * 0.45, w * 0.44, h * 0.18, '#a56f40');
  ell(g, cx, y + h * 0.42, w * 0.34, h * 0.13, '#c8343a'); ell(g, cx - w * 0.08, y + h * 0.39, w * 0.12, h * 0.04, 'rgba(255,255,255,.3)');
}
function drawBarrels(g, d, x, y, w, h, k){
  shadow(g, x + w / 2, y + h * 0.95, w * 0.5, k * 0.1, 0.25);
  const barrel = (bx, by, bw, bh)=>{
    g.fillStyle = lin(g, bx, 0, bx + bw, 0, [[0, '#6b3e1e'], [0.35, '#a56f40'], [1, '#5a3418']]);
    g.beginPath(); g.moveTo(bx + bw * 0.06, by + bh * 0.1); g.quadraticCurveTo(bx - bw * 0.04, by + bh * 0.55, bx + bw * 0.06, by + bh); g.lineTo(bx + bw * 0.94, by + bh); g.quadraticCurveTo(bx + bw * 1.04, by + bh * 0.55, bx + bw * 0.94, by + bh * 0.1); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,20,5,.35)'; g.lineWidth = L(k, 0.012); for(let i = 1; i < 5; i++){ g.beginPath(); g.moveTo(bx + bw * i / 5, by + bh * 0.1); g.quadraticCurveTo(bx + bw * (i / 5 + (i / 5 - 0.5) * 0.08), by + bh * 0.55, bx + bw * i / 5, by + bh); g.stroke(); }
    [0.22, 0.8].forEach(f=>{ g.fillStyle = '#3a3338'; g.fillRect(bx, by + bh * f, bw, bh * 0.06); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(bx, by + bh * f, bw, L(k, 0.012)); });
    ell(g, bx + bw / 2, by + bh * 0.1, bw * 0.44, bh * 0.1, '#8a5a32'); ell(g, bx + bw / 2, by + bh * 0.1, bw * 0.36, bh * 0.07, '#a56f40');
    g.strokeStyle = 'rgba(40,20,5,.3)'; g.beginPath(); g.moveTo(bx + bw * 0.2, by + bh * 0.1); g.lineTo(bx + bw * 0.8, by + bh * 0.1); g.stroke();
  };
  barrel(x + w * 0.02, y + h * 0.42, w * 0.48, h * 0.55);
  barrel(x + w * 0.5, y + h * 0.38, w * 0.48, h * 0.59);
  barrel(x + w * 0.26, y + h * 0.02, w * 0.44, h * 0.44);
  /* a spigot */
  g.fillStyle = '#c9a24a'; g.fillRect(x + w * 0.2, y + h * 0.72, k * 0.1, k * 0.05); g.fillRect(x + w * 0.2 + k * 0.08, y + h * 0.72, k * 0.03, k * 0.1);
}
/* the tavern's cat, curled up asleep on a cushion by the fire */
function drawCat(g, d, x, y, w, h, k){
  const cx = x + w / 2, cy = y + h * 0.62;
  shadow(g, cx, y + h * 0.88, w * 0.42, k * 0.08, 0.2);
  ell(g, cx, cy + k * 0.08, w * 0.42, k * 0.2, '#c8343a'); ell(g, cx, cy + k * 0.04, w * 0.4, k * 0.17, '#e04a50');
  [[-0.32, 0], [0.32, 0], [0, -0.16], [0, 0.16]].forEach(([a, b])=> circ(g, cx + a * w, cy + k * 0.04 + b * k, k * 0.03, '#f2d77a'));
  /* the cat: a ginger curl, its tail round its nose */
  ell(g, cx, cy - k * 0.04, k * 0.3, k * 0.19, '#e8913c');
  g.strokeStyle = '#c86a22'; g.lineWidth = L(k, 0.03); [-0.1, 0, 0.1].forEach(a=>{ g.beginPath(); g.arc(cx + a * k, cy - k * 0.04, k * 0.14, -2.4, -1.6); g.stroke(); });
  circ(g, cx + k * 0.2, cy - k * 0.04, k * 0.12, '#f0a04c');
  g.fillStyle = '#e8913c'; g.beginPath(); g.moveTo(cx + k * 0.12, cy - k * 0.12); g.lineTo(cx + k * 0.15, cy - k * 0.24); g.lineTo(cx + k * 0.21, cy - k * 0.14); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(cx + k * 0.23, cy - k * 0.14); g.lineTo(cx + k * 0.3, cy - k * 0.24); g.lineTo(cx + k * 0.32, cy - k * 0.1); g.closePath(); g.fill();
  g.strokeStyle = '#5a3418'; g.lineWidth = L(k, 0.012); g.beginPath(); g.arc(cx + k * 0.17, cy - k * 0.04, k * 0.025, 0.2, Math.PI - 0.2); g.stroke(); g.beginPath(); g.arc(cx + k * 0.25, cy - k * 0.04, k * 0.025, 0.2, Math.PI - 0.2); g.stroke();
  circ(g, cx + k * 0.21, cy, k * 0.012, '#e8578f');
  g.strokeStyle = '#e8913c'; g.lineWidth = L(k, 0.06); g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - k * 0.26, cy); g.quadraticCurveTo(cx - k * 0.1, cy + k * 0.18, cx + k * 0.16, cy + k * 0.08); g.stroke(); g.lineCap = 'butt';
  g.fillStyle = '#5a3418'; g.font = `700 ${Math.round(k * 0.14)}px sans-serif`; g.textAlign = 'center'; g.fillText('z', cx + k * 0.38, cy - k * 0.22); g.font = `700 ${Math.round(k * 0.1)}px sans-serif`; g.fillText('z', cx + k * 0.46, cy - k * 0.32);
}
function drawFirewood(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.95;
  shadow(g, cx, base, w * 0.44, k * 0.07, 0.22);
  g.fillStyle = '#7a5a3a'; g.beginPath(); g.moveTo(x + w * 0.1, base - k * 0.5); g.lineTo(x + w * 0.9, base - k * 0.5); g.lineTo(x + w * 0.84, base); g.lineTo(x + w * 0.16, base); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(40,20,5,.35)'; g.lineWidth = L(k, 0.014); for(let i = 1; i < 6; i++){ g.beginPath(); g.moveTo(x + w * (0.1 + i * 0.13), base - k * 0.5); g.lineTo(x + w * (0.14 + i * 0.12), base); g.stroke(); }
  for(let r = 0; r < 3; r++) for(let i = 0; i < 4 - r; i++){ const lx = x + w * (0.24 + i * 0.18 + r * 0.09), ly = base - k * (0.5 + r * 0.14); ell(g, lx, ly, k * 0.09, k * 0.07, '#8a5a32'); ell(g, lx, ly, k * 0.065, k * 0.05, '#d9b282'); g.strokeStyle = 'rgba(120,80,40,.5)'; g.lineWidth = L(k, 0.008); g.beginPath(); g.ellipse(lx, ly, k * 0.035, k * 0.025, 0, 0, TAU); g.stroke(); }
  g.fillStyle = '#c0663a'; g.save(); g.translate(x + w * 0.78, base - k * 0.66); g.rotate(-0.5); g.fillRect(0, 0, k * 0.4, k * 0.035); g.fillStyle = '#9a9aa8'; g.fillRect(k * 0.36, -k * 0.05, k * 0.12, k * 0.13); g.restore();
}

/* ---------- the record store ---------- */
/* a bin of records on legs: their tops in rows, a few tipped forward so their sleeves show; letter cards */
function drawRecBin(g, d, x, y, w, h, k){
  const X = x + k * 0.08, W = w - k * 0.16, top = y + h * 0.18, front = y + h * 0.56, base = y + h * 0.97, R = rng(6600 + Math.round(d.x * 13 + d.y * 7));
  shadow(g, x + w / 2, base, w * 0.5, k * 0.09, 0.25);
  /* inside: the sleeves, standing */
  g.fillStyle = '#3a2312'; g.fillRect(X, top, W, front - top);
  const keys = REC_KEYS(), rows = 2;
  for(let r = 0; r < rows; r++){
    const ry = top + k * 0.08 + r * (front - top - k * 0.1) / rows, n = Math.floor(W / (k * 0.07));
    for(let i = 0; i < n; i++){ g.fillStyle = sh(['#2b2b3a', '#c94a6a', '#3a7ac4', '#e8c547', '#5ab08a', '#9a6bd0', '#e8862a', '#f4f1ea'][Math.floor(R() * 8)], -0.1 - r * 0.15); g.fillRect(X + k * 0.04 + i * k * 0.07, ry, k * 0.055, (front - top) / rows - k * 0.04); }
  }
  /* the front ones, tipped toward you: their covers */
  [0.08, 0.56].forEach((f, i)=>{
    const key = keys[Math.floor(R() * keys.length)], cw = k * 0.66, cx0 = X + W * f, cy0 = front - cw * 0.62;
    g.save(); g.translate(cx0, cy0); g.transform(1, 0, -0.08, 0.62, 0, 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(k * 0.03, k * 0.03, cw, cw);
    g.save(); g.scale(cw / 100, cw / 100); coverArt(g, key, 100); g.restore();
    g.restore();
  });
  /* letter cards */
  [['A–F', 0.36], ['G–M', 0.9]].forEach(([t, f])=>{ const lx = X + W * f - k * 0.13; g.fillStyle = '#fff8e8'; rr(g, lx, top - k * 0.1, k * 0.26, k * 0.16, k * 0.03); g.fill(); g.fillStyle = '#4a2b5c'; g.font = `900 ${Math.round(k * 0.08)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, lx + k * 0.13, top - k * 0.02); });
  /* the crate */
  g.fillStyle = '#8a5a32'; g.fillRect(X - k * 0.04, front, W + k * 0.08, base - front - k * 0.2);
  g.fillStyle = '#a56f40'; g.fillRect(X - k * 0.04, front, W + k * 0.08, k * 0.06);
  grain(g, X, front + k * 0.08, W, base - front - k * 0.3, R, 6, 'rgba(40,20,5,.25)');
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X - k * 0.04, front + (base - front - k * 0.2) / 2, W + k * 0.08, L(k, 0.014));
  [X - k * 0.04, X + W - k * 0.04].forEach(px=>{ g.fillStyle = '#5a3418'; g.fillRect(px, front, k * 0.08, base - front); });
  g.fillStyle = '#5a3418'; g.fillRect(X - k * 0.04, top - k * 0.02, k * 0.06, front - top); g.fillRect(X + W - k * 0.02, top - k * 0.02, k * 0.06, front - top);
  /* a SALE tag */
  if(Math.round(d.x + d.y) % 2){ const tx = X + W * 0.75, ty = front + k * 0.14; g.fillStyle = '#f2c23a'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + k * 0.3, ty); g.lineTo(tx + k * 0.36, ty + k * 0.08); g.lineTo(tx + k * 0.3, ty + k * 0.16); g.lineTo(tx, ty + k * 0.16); g.closePath(); g.fill(); g.fillStyle = '#c8343a'; g.font = `900 ${Math.round(k * 0.1)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SALE', tx + k * 0.15, ty + k * 0.085); }
}
/* the counter: plum panels, a record on its front; a brass till, a turntable (it turns while a record is sampled), records waiting */
function drawRecCounter(g, d, x, y, w, h, k){
  const top = y + h * 0.3, front = y + h * 0.46, base = y + h * 0.97, X = x + k * 0.1, W = w - k * 0.2;
  g.fillStyle = '#2b1f31'; g.fillRect(X - k * 0.05, top, W + k * 0.1, front - top);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(X - k * 0.05, top, W + k * 0.1, L(k, 0.014));
  g.fillStyle = '#4a2b5c'; g.fillRect(X, front, W, base - front);
  const n = Math.round(W / k);
  for(let i = 0; i < n; i++){ const px = X + k * 0.06 + i * W / n, pw = W / n - k * 0.12; g.fillStyle = '#5c3a72'; g.fillRect(px, front + k * 0.12, pw, base - front - k * 0.3); g.strokeStyle = '#c9a24a'; g.lineWidth = L(k, 0.014); g.strokeRect(px + k * 0.04, front + k * 0.16, pw - k * 0.08, base - front - k * 0.38); }
  /* a record on its front */
  const rx = X + W * 0.5, ry = front + (base - front) * 0.42;
  circ(g, rx, ry, k * 0.26, '#17141b'); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = L(k, 0.01); [0.2, 0.15, 0.11].forEach(f=>{ g.beginPath(); g.arc(rx, ry, k * f, 0, TAU); g.stroke(); }); circ(g, rx, ry, k * 0.08, '#f07aa6'); circ(g, rx, ry, k * 0.015, '#17141b');
  g.fillStyle = '#1d1222'; g.fillRect(X - k * 0.05, front - k * 0.02, W + k * 0.1, k * 0.07); g.fillStyle = '#c9a24a'; g.fillRect(X - k * 0.05, front - k * 0.02, W + k * 0.1, L(k, 0.014));
  g.fillStyle = '#1d1222'; g.fillRect(X, base - k * 0.1, W, k * 0.1);
  /* the till */
  const tx = X + W * 0.09, S0 = top + (front - top) * 0.6;
  g.fillStyle = '#b8862e'; g.beginPath(); g.moveTo(tx - k * 0.2, S0); g.lineTo(tx + k * 0.2, S0); g.lineTo(tx + k * 0.16, S0 - k * 0.24); g.lineTo(tx - k * 0.16, S0 - k * 0.24); g.closePath(); g.fill();
  g.fillStyle = '#e8c870'; g.fillRect(tx - k * 0.14, S0 - k * 0.38, k * 0.28, k * 0.15); g.fillStyle = '#2b2b3a'; g.fillRect(tx - k * 0.1, S0 - k * 0.35, k * 0.2, k * 0.08); g.fillStyle = '#7ae07a'; g.font = `700 ${Math.round(k * 0.06)}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('3.00', tx, S0 - k * 0.31);
  for(let r = 0; r < 2; r++) for(let c = 0; c < 4; c++) circ(g, tx - k * 0.11 + c * k * 0.073, S0 - k * 0.16 + r * k * 0.07, k * 0.025, '#f4f1ea');
  /* the turntable's plinth */
  const ttx = X + W * 0.8;
  g.fillStyle = '#6b4226'; rr(g, ttx - k * 0.34, S0 - k * 0.2, k * 0.68, k * 0.24, k * 0.04); g.fill();
  g.fillStyle = '#4a2c18'; g.fillRect(ttx - k * 0.34, S0 - k * 0.02, k * 0.68, k * 0.06);
  ell(g, ttx - k * 0.05, S0 - k * 0.1, k * 0.24, k * 0.09, '#2a2a33');
  circ(g, ttx + k * 0.25, S0 - k * 0.14, k * 0.03, '#c9a24a');
  /* a stack of records waiting */
  const sx = X + W * 0.42;
  for(let i = 0; i < 4; i++){ g.fillStyle = ['#c94a6a', '#3a7ac4', '#e8c547', '#5ab08a'][i]; g.save(); g.translate(sx, S0 - i * k * 0.035); g.rotate((i - 1.5) * 0.06); g.fillRect(-k * 0.2, -k * 0.035, k * 0.4, k * 0.035); g.restore(); }
  /* a little plant */
  const px = X + W * 0.6; g.fillStyle = '#c0663a'; g.fillRect(px - k * 0.05, S0 - k * 0.1, k * 0.1, k * 0.1); for(let i = 0; i < 5; i++) ell(g, px + (i - 2) * k * 0.03, S0 - k * (0.16 + (i % 2) * 0.04), k * 0.03, k * 0.06, '#4f8f45');
}
function counterLive(g, d, x, y, w, h, k, t){
  const top = y + h * 0.3, front = y + h * 0.46, X = x + k * 0.1, W = w - k * 0.2, S0 = top + (front - top) * 0.6, ttx = X + W * 0.8, cx = ttx - k * 0.05, cy = S0 - k * 0.11;
  const on = typeof caRecPlaying === 'function' && caRecPlaying();
  ell(g, cx, cy, k * 0.21, k * 0.075, '#17141b');
  g.save(); g.translate(cx, cy); g.scale(1, 0.36);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = L(k, 0.012); [0.17, 0.13].forEach(f=>{ g.beginPath(); g.arc(0, 0, k * f, 0, TAU); g.stroke(); });
  const a = on ? t * 3.5 : 0.6;
  g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, k * 0.2, a, a + 0.5); g.closePath(); g.fill();
  circ(g, 0, 0, k * 0.07, on ? '#f07aa6' : '#e8c547'); circ(g, Math.cos(a) * k * 0.04, Math.sin(a) * k * 0.04, k * 0.012, '#ffffff');
  g.restore();
  g.strokeStyle = '#c9a24a'; g.lineWidth = L(k, 0.02); g.beginPath(); g.moveTo(ttx + k * 0.25, S0 - k * 0.14); g.lineTo(ttx + k * 0.22, S0 - k * 0.04); g.lineTo(on ? cx + k * 0.1 : ttx + k * 0.24, on ? cy : S0 - k * 0.02); g.stroke();
  /* while one is sampled: its sleeve on a little stand, and notes */
  if(on && audio.musicEl){
    const key = audio.musicEl.dataset.track, cw = k * 0.5, sx = X + W * 0.2 - cw / 2, sy = S0 - cw - k * 0.06;   // to the left of Melody, not over her
    g.fillStyle = '#c9a24a'; g.fillRect(sx + cw * 0.2, S0 - k * 0.06, cw * 0.6, k * 0.04);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(sx + k * 0.02, sy + k * 0.02, cw, cw);
    g.save(); g.translate(sx, sy); g.scale(cw / 100, cw / 100); coverArt(g, key, 100); g.restore();
    for(let i = 0; i < 3; i++){ const p = (t * 0.6 + i / 3) % 1; g.fillStyle = `rgba(255,140,200,${1 - p})`; g.font = `${Math.round(k * 0.3)}px sans-serif`; g.textAlign = 'center'; g.fillText(i % 2 ? '♫' : '♪', cx + k * 0.2 + Math.sin(p * 5 + i) * k * 0.15, cy - k * 0.15 - p * k * 0.8); }
  }
}
function drawGramophone(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.96;
  shadow(g, cx, base, w * 0.42, k * 0.08, 0.25);
  /* the cabinet: walnut, brass corners, a little door */
  const ct = base - k * 0.74;
  g.fillStyle = '#5a3418'; g.fillRect(x + w * 0.14, ct, w * 0.72, base - ct - k * 0.06);
  g.fillStyle = '#6e4428'; g.fillRect(x + w * 0.18, ct + k * 0.12, w * 0.64, base - ct - k * 0.26);
  g.strokeStyle = '#c9a24a'; g.lineWidth = L(k, 0.014); g.strokeRect(x + w * 0.22, ct + k * 0.16, w * 0.56, base - ct - k * 0.34); circ(g, x + w * 0.72, ct + k * 0.38, k * 0.025, '#c9a24a');
  [[0.14, 0], [0.86, 0]].forEach(([f])=>{ g.fillStyle = '#c9a24a'; g.fillRect(x + w * f - k * 0.03, ct, k * 0.06, k * 0.06); g.fillRect(x + w * f - k * 0.03, base - k * 0.12, k * 0.06, k * 0.06); });
  g.fillStyle = '#3a2010'; g.fillRect(x + w * 0.12, ct - k * 0.04, w * 0.76, k * 0.08);
  g.fillStyle = '#3a2010'; [0.18, 0.78].forEach(f=> g.fillRect(x + w * f, base - k * 0.06, k * 0.08, k * 0.06));
  /* the crank */
  g.strokeStyle = '#c9a24a'; g.lineWidth = L(k, 0.025); g.beginPath(); g.moveTo(x + w * 0.86, ct + k * 0.3); g.lineTo(x + w * 0.98, ct + k * 0.3); g.lineTo(x + w * 0.98, ct + k * 0.42); g.stroke(); circ(g, x + w * 0.98, ct + k * 0.44, k * 0.03, '#3a2010');
  /* the horn: a great brass flower */
  const hx = cx + w * 0.06, hy = ct - k * 0.3;
  g.strokeStyle = '#a8742a'; g.lineWidth = L(k, 0.06); g.beginPath(); g.moveTo(hx, ct - k * 0.06); g.quadraticCurveTo(hx + k * 0.12, hy, cx - w * 0.02, hy - k * 0.12); g.stroke();
  const bx = x + w * 0.2, by = y + h * 0.16;
  g.save(); g.translate(bx, by); g.rotate(-0.5);
  g.fillStyle = lin(g, -k * 0.45, 0, k * 0.45, 0, [[0, '#f4dc84'], [0.4, '#d9a83a'], [1, '#8a5a1a']]);
  g.beginPath(); g.moveTo(k * 0.55, k * 0.05); g.quadraticCurveTo(0, -k * 0.02, -k * 0.05, -k * 0.38); g.quadraticCurveTo(-k * 0.3, -k * 0.12, -k * 0.05, k * 0.42); g.quadraticCurveTo(0, k * 0.12, k * 0.55, k * 0.1); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,70,10,.5)'; g.lineWidth = L(k, 0.012);
  for(let i = 0; i < 5; i++){ const f = i / 4; g.beginPath(); g.moveTo(k * 0.5, k * 0.07); g.quadraticCurveTo(-k * 0.02, k * (-0.02 + f * 0.14), -k * 0.12 + Math.sin(f * Math.PI) * -k * 0.08, -k * 0.34 + f * k * 0.74); g.stroke(); }
  ell(g, -k * 0.08, k * 0.02, k * 0.1, k * 0.4, 'rgba(40,20,0,.45)');
  g.restore();
}
function gramLive(g, d, x, y, w, h, k, t){
  const cx = x + w / 2, base = y + h * 0.96, ct = base - k * 0.74, on = typeof caRecPlaying === 'function' && caRecPlaying();
  const px = cx - w * 0.06, py = ct - k * 0.02;
  ell(g, px, py, w * 0.3, k * 0.08, '#17141b');
  g.save(); g.translate(px, py); g.scale(1, 0.27);
  const a = on ? t * 3.3 : 0.4;
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, w * 0.29, a, a + 0.5); g.closePath(); g.fill();
  circ(g, 0, 0, w * 0.09, '#c94a6a'); circ(g, Math.cos(a) * w * 0.05, Math.sin(a) * w * 0.05, w * 0.015, '#ffffff');
  g.restore();
  g.strokeStyle = '#c9a24a'; g.lineWidth = L(k, 0.025); g.beginPath(); g.moveTo(cx + w * 0.1, ct - k * 0.08); g.lineTo(px + w * (on ? 0.12 : 0.2), py - k * (on ? 0.0 : 0.02)); g.stroke();
  if(on){ for(let i = 0; i < 3; i++){ const p = (t * 0.6 + i / 3) % 1; g.fillStyle = `rgba(90,60,140,${1 - p})`; g.font = `${Math.round(k * 0.36)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(i % 2 ? '♫' : '♪', x - w * 0.05 - p * w * 0.3 + Math.sin(p * 6 + i) * k * 0.1, y + h * (0.12 - p * 0.45)); } }
}
/* a jukebox: an arch of coloured light, chrome, the records inside */
function drawJukebox(g, d, x, y, w, h, k){
  const cx = x + w / 2, base = y + h * 0.97, X = x + w * 0.1, W = w * 0.8, top = y + h * 0.04;
  shadow(g, cx, base, w * 0.46, k * 0.08, 0.28);
  g.fillStyle = '#6b2a1e'; g.beginPath(); g.moveTo(X, base); g.lineTo(X, top + W / 2); g.arc(cx, top + W / 2, W / 2, Math.PI, 0); g.lineTo(X + W, base); g.closePath(); g.fill();
  g.fillStyle = lin(g, X, 0, X + W, 0, [[0, 'rgba(255,255,255,.15)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.3)']]); g.fill();
  /* the window onto the records */
  const wy = top + W * 0.3;
  g.fillStyle = '#1d1222'; g.beginPath(); g.moveTo(X + W * 0.16, wy + W * 0.5); g.lineTo(X + W * 0.16, wy + W * 0.3); g.arc(cx, wy + W * 0.3, W * 0.34, Math.PI, 0); g.lineTo(X + W * 0.84, wy + W * 0.5); g.closePath(); g.fill();
  for(let i = 0; i < 5; i++){ const rx = X + W * (0.26 + i * 0.12); g.fillStyle = '#17141b'; g.fillRect(rx - k * 0.01, wy + W * 0.12, k * 0.02, W * 0.38); circ(g, rx, wy + W * 0.32, k * 0.02, ['#f07aa6', '#7ad8ff', '#ffd36a', '#a6ff8a', '#ff7a5a'][i]); }
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(X + W * 0.22, wy + W * 0.5); g.lineTo(X + W * 0.36, wy - W * 0.02); g.lineTo(X + W * 0.44, wy - W * 0.02); g.lineTo(X + W * 0.3, wy + W * 0.5); g.closePath(); g.fill();
  /* chrome, the panel of buttons, the grille */
  g.fillStyle = '#d9dde6'; g.fillRect(X + W * 0.1, wy + W * 0.52, W * 0.8, k * 0.06); g.fillStyle = '#ffffff'; g.fillRect(X + W * 0.1, wy + W * 0.52, W * 0.8, L(k, 0.012));
  const pY = wy + W * 0.52 + k * 0.1;
  g.fillStyle = '#f4ecd6'; g.fillRect(X + W * 0.16, pY, W * 0.68, k * 0.18);
  for(let r = 0; r < 2; r++) for(let c = 0; c < 6; c++){ g.fillStyle = '#4a2b5c'; g.fillRect(X + W * (0.19 + c * 0.105), pY + k * (0.03 + r * 0.075), W * 0.08, k * 0.04); }
  const gy = pY + k * 0.24;
  g.fillStyle = '#2a2a33'; rr(g, X + W * 0.2, gy, W * 0.6, base - gy - k * 0.14, k * 0.06); g.fill();
  g.strokeStyle = '#c9ccd8'; g.lineWidth = L(k, 0.014); for(let i = 1; i < 7; i++){ g.beginPath(); g.moveTo(X + W * 0.2 + W * 0.6 * i / 7, gy + k * 0.03); g.lineTo(X + W * 0.2 + W * 0.6 * i / 7, base - k * 0.17); g.stroke(); }
  g.fillStyle = '#d9dde6'; g.fillRect(X, base - k * 0.1, W, k * 0.1);
}
function jukeLive(g, d, x, y, w, h, k, t){
  const cx = x + w / 2, X = x + w * 0.1, W = w * 0.8, top = y + h * 0.04, base = y + h * 0.97;
  /* the tubes of light round its arch and down its sides, their colours going round */
  const cols = ['#ff5fa8', '#ffb347', '#ffe66a', '#7af07a', '#5fd8ff', '#b07aff'];
  g.lineWidth = Math.max(2, k * 0.07); g.lineCap = 'round';
  for(let i = 0; i < 12; i++){
    const a0 = Math.PI + i / 12 * Math.PI, a1 = a0 + Math.PI / 12, c = cols[(i + Math.floor(t * 4)) % 6];
    g.strokeStyle = c; g.beginPath(); g.arc(cx, top + W / 2, W / 2 - k * 0.05, a0, a1); g.stroke();
  }
  [X + k * 0.05, X + W - k * 0.05].forEach((sx, j)=>{ for(let i = 0; i < 6; i++){ g.strokeStyle = cols[(i + j * 3 + Math.floor(t * 4)) % 6]; const yy = top + W / 2 + i * (base - top - W / 2 - k * 0.15) / 6; g.beginPath(); g.moveTo(sx, yy); g.lineTo(sx, yy + (base - top - W / 2 - k * 0.15) / 6 - k * 0.02); g.stroke(); } });
  g.lineCap = 'butt';
  g.fillStyle = rad(g, cx, top + W * 0.6, 0, w * 1.1, [[0, `rgba(255,${120 + 80 * Math.sin(t * 2)},200,.16)`], [1, 'rgba(255,120,200,0)']]); g.fillRect(x - w * 0.6, y - h * 0.1, w * 2.2, h * 1.2);
}
/* a listening corner: a low cabinet with a turntable and headphones, a stool, a sign */
function drawListen(g, d, x, y, w, h, k){
  const top = y + h * 0.42, base = y + h * 0.97, X = x + k * 0.1, W = w - k * 0.2;
  shadow(g, x + w / 2, base, w * 0.48, k * 0.08, 0.22);
  g.fillStyle = '#5a3418'; g.fillRect(X, top + k * 0.16, W, base - top - k * 0.2);
  g.fillStyle = '#7a4a28'; g.fillRect(X - k * 0.04, top, W + k * 0.08, k * 0.2);
  g.fillStyle = 'rgba(255,220,170,.3)'; g.fillRect(X - k * 0.04, top, W + k * 0.08, L(k, 0.014));
  for(let i = 0; i < 2; i++){ const px = X + k * 0.08 + i * W / 2; g.fillStyle = '#6b3e1e'; g.fillRect(px, top + k * 0.28, W / 2 - k * 0.16, base - top - k * 0.42); for(let j = 0; j < 6; j++){ g.fillStyle = ['#c94a6a', '#3a7ac4', '#e8c547', '#5ab08a', '#9a6bd0', '#f4f1ea'][(j + i * 2) % 6]; g.fillRect(px + k * 0.04 + j * k * 0.1, top + k * 0.32, k * 0.07, base - top - k * 0.52); } }
  /* the turntable */
  const tx = X + W * 0.3, ty = top + k * 0.04;
  g.fillStyle = '#e8e4dc'; rr(g, tx - k * 0.3, ty - k * 0.12, k * 0.6, k * 0.2, k * 0.04); g.fill();
  ell(g, tx - k * 0.04, ty - k * 0.03, k * 0.22, k * 0.07, '#17141b'); ell(g, tx - k * 0.04, ty - k * 0.03, k * 0.06, k * 0.02, '#5fd8ff');
  g.strokeStyle = '#9a9aa8'; g.lineWidth = L(k, 0.016); g.beginPath(); g.moveTo(tx + k * 0.24, ty - k * 0.08); g.lineTo(tx + k * 0.1, ty - k * 0.02); g.stroke();
  /* the headphones */
  const hx = X + W * 0.74, hy = ty - k * 0.06;
  g.strokeStyle = '#2a2a33'; g.lineWidth = L(k, 0.035); g.beginPath(); g.arc(hx, hy, k * 0.14, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  [-1, 1].forEach(sd=>{ ell(g, hx + sd * k * 0.14, hy + k * 0.02, k * 0.06, k * 0.08, '#ff5fa8'); ell(g, hx + sd * k * 0.14, hy + k * 0.02, k * 0.035, k * 0.05, '#2a2a33'); });
  g.strokeStyle = '#2a2a33'; g.lineWidth = L(k, 0.01); g.beginPath(); g.moveTo(hx + k * 0.14, hy + k * 0.1); g.quadraticCurveTo(hx + k * 0.3, hy + k * 0.3, tx + k * 0.3, ty + k * 0.05); g.stroke();
  /* a little sign */
  g.fillStyle = '#f2c23a'; rr(g, X + W * 0.42, ty - k * 0.32, k * 0.4, k * 0.16, k * 0.03); g.fill(); g.fillStyle = '#4a2b5c'; g.font = `900 ${Math.round(k * 0.08)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LISTEN ♪', X + W * 0.42 + k * 0.2, ty - k * 0.24);
}
/* boxes of new records, just come */
function drawBoxes(g, d, x, y, w, h, k){
  const base = y + h * 0.97;
  shadow(g, x + w / 2, base, w * 0.48, k * 0.08, 0.24);
  const box = (bx, by, bw, bh, label)=>{
    g.fillStyle = '#c8955a'; g.fillRect(bx, by, bw, bh);
    g.fillStyle = '#d9a86a'; g.fillRect(bx, by, bw, bh * 0.18); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(bx + bw * 0.7, by, bw * 0.3, bh);
    g.fillStyle = 'rgba(240,230,200,.8)'; g.fillRect(bx + bw * 0.45, by, bw * 0.1, bh * 0.4);
    if(label){ g.fillStyle = '#c8343a'; g.font = `900 ${Math.round(k * 0.12)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, bx + bw * 0.35, by + bh * 0.62); }
  };
  box(x + w * 0.06, base - k * 0.62, w * 0.88, k * 0.6, 'NEW!');
  box(x + w * 0.16, base - k * 1.06, w * 0.66, k * 0.46, '♪');
  /* records sticking out of the top one */
  for(let i = 0; i < 4; i++){ g.fillStyle = ['#3a7ac4', '#c94a6a', '#e8c547', '#5ab08a'][i]; g.fillRect(x + w * (0.24 + i * 0.12), base - k * 1.22, w * 0.1, k * 0.18); }
}

/* ============================================================
   EVERYTHING, BY KIND: drawn once and kept (still), then what moves
   ============================================================ */
const KEEP = {
  throne:still(drawThrone, 0.5), blade:still(drawBladeStone, 0.3), column:still(drawColumn, 0.3), longTable:still(drawBanquet, 0.5), bookcase:still(drawBookcase, 0.4),
  candelabra:still(drawCandelabra, 0.4), palm:still(drawPalm, 0.6), armour:still(drawArmour, 0.4), vase:still(drawVase, 0.4), clock:still(drawClock, 0.4),
  sideboard:still(drawSideboard, 0.4), settee:still(drawSettee, 0.4), readingTable:still(drawReading, 0.5), globe:still(drawGlobe, 0.4),
  canopyBed:still(drawCanopyBed, 0.4), wardrobe:still(drawWardrobe, 0.4), hearth:still(drawHearth, 0.4), weaponRack:still(drawWeaponRack, 0.4), desk:still(drawDesk, 0.4),
  vanity:still(drawVanity, 0.4), toyChest:still(drawToyChest, 0.4), rockingHorse:still(drawRockingHorse, 0.4), armchair:still(drawArmchair, 0.4), teaTable:still(drawTeaTable, 0.4),
  harp:still(drawHarp, 0.4), chest:still(drawChest, 0.4), plantPot:still(drawPlantPot, 0.6),
  bar:still(drawBar, 0.4), table:still(drawTavernTable, 0.4), stool:still(drawStool, 0.3), barrels:still(drawBarrels, 0.4), cat:still(drawCat, 0.5), firewood:still(drawFirewood, 0.4),
  recBin:still(drawRecBin, 0.4), recCounter:still(drawRecCounter, 0.4), gramophone:still(drawGramophone, 0.5), jukebox:still(drawJukebox, 0.4), listen:still(drawListen, 0.4), boxes:still(drawBoxes, 0.4),
};
const LIVE = { blade:bladeGlow, column:columnReflect, longTable:banquetFlames, candelabra:candelabraFlames, clock:clockSwing, hearth:hearthFire, table:tableFlame, recCounter:counterLive, gramophone:gramLive, jukebox:jukeLive };
/* the moving bits drawn under the still picture (a glow behind a stone) rather than over it */
const UNDER = new Set(['blade', 'column']);
function furn(g, d, x, y, w, h, k, t){
  if(d.kind === 'flame'){ flameAt(g, x + w / 2, y + h, k * (d.r || 0.05), t, d.x * 7 + d.y); return true; }
  const WK = WALL_KEEP[d.kind], WL = WALL_LIVE[d.kind];                 // (3.98) the walls' and ramparts' things
  if(WK || WL){ if(WK) WK(g, d, x, y, w, h, k); if(WL) WL(g, d, x, y, w, h, k, t); return true; }
  const P = KEEP[d.kind];
  if(!P) return false;
  const Lv = LIVE[d.kind];
  if(Lv && UNDER.has(d.kind)) Lv(g, d, x, y, w, h, k, t);
  P(g, d, x, y, w, h, k);
  if(Lv && !UNDER.has(d.kind)) Lv(g, d, x, y, w, h, k, t);
  return true;
}
/* a room made: where its flames burn (each torch, each lantern) and the warm light round them, found from its walls */
function dress(m, room){
  m.room = room; m._ri = null;
  const I = info(m), glows = m.tags.glows = m.tags.glows || [];
  for(let y = 0; y < m.H; y++) for(let x = 0; x < m.W; x++){
    if(I.lv[y * m.W + x] !== 1) continue;
    const kind = partAt(m, x, y).split(':')[0], th = I.thin[y * m.W + x], rail = y + railOf(th);
    if(kind === 'torch'){ caDeco(m, 'flame', x + 0.35, rail - 0.57 - 0.4, 0.3, 0.4, { z:y + 0.5, r:0.055 }); glows.push({ x:x + 0.5, y:y + 1.4, r:1.7, c:'rgba(255,186,96,.22)' }); }
    if(kind === 'lamp'){ caDeco(m, 'flame', x + 0.4, rail - 0.41 - 0.3, 0.2, 0.3, { z:y + 0.5, r:0.03 }); glows.push({ x:x + 0.5, y:y + 1.4, r:1.8, c:'rgba(255,190,100,.22)' }); }
  }
  m.deco.forEach(d=>{
    if(d.kind === 'candelabra') glows.push({ x:d.x + d.w / 2, y:d.y + d.h * 0.8, r:1.6, c:'rgba(255,200,110,.20)' });
    if(d.kind === 'hearth') glows.push({ x:d.x + d.w / 2, y:d.y + d.h + 0.5, r:2.6, c:'rgba(255,160,70,.24)' });
    if(d.kind === 'table') glows.push({ x:d.x + d.w / 2, y:d.y + d.h * 0.5, r:1.1, c:'rgba(255,200,110,.16)' });
    if(d.kind === 'jukebox') glows.push({ x:d.x + d.w / 2, y:d.y + d.h, r:1.8, c:'rgba(255,120,200,.16)' });
  });
  m.deco.sort((a, b)=> a.z - b.z);
  return m;
}

/* ============================================================
   THE WALLS' WALKS AND THE RAMPARTS (3.98)
   The designer: "yes please upgrade the castle's walkways and battlements". Each wall's walk is paved with great
   flagstones laid in courses along it, worn paler down the middle where the patrols march, moss in the joints and
   the jungle's leaves blown up onto them; along its forest side the battlements — merlons as tall as a man, an arrow
   loop in each, the gaps between them at a man's waist (lower where a lookout stands) — and along the castle's side
   a low parapet under its coping; braziers burning on the parapet, the King's banners hanging on whichever side
   faces you, pennants along the walls that run north and south. A rampart is paved round a compass rose, its stair
   winding down into the tower, its spyglass on a brass tripod, its flag flying from its outer corner, and through
   each arch the walk going on to its wall. What stands up (the battlements, the parapets, what is on them) is set
   out as things standing on the walk (walkDress): what stands in front of you hides you behind it (the see-through
   layer, 21-castle.js) and the merlons reach up over the far views; the floor is painted in pieces as a room's is
   (slice → walkPaint).
   ============================================================ */
/* the sizes, in squares: a battlement's or parapet's depth seen from above (D, walls across), a battlement's and a
   parapet's thickness (DV, DPV, walls down); the sill's height (HS; HN at a lookout's notch), a merlon's (HM), the
   parapet's (HP); how far a wall's face is seen going down below a wall in front (DROP); a merlon's share of its square */
const WG = { D:0.36, DV:0.5, DPV:0.4, HS:0.42, HN:0.27, HM:0.86, HP:0.38, DROP:0.72, MER:0.62 };
const WS = { mortar:'#7d788c', flags:['#aca6b4', '#a39eae', '#b3adb9', '#9d98a8', '#a8a2ae', '#b0abb8', '#9a96a6', '#aea7b0'],
  face:'#928da9', faceD:'#76718e', cap:'#d4d0e0', capL:'#f0eef6', worn:'#ddd8e6', mortarF:'#5c5872', iron:'#2c2a33', ironL:'#4a4754' };
const wFloorT = new Set([T.WALK, T.PLANTER, T.STAIRS]);
const wFloor = (m, x, y)=> wFloorT.has(caAt(m, x, y));
const wCell = (m, x, y)=> (x < 0 || y < 0 || x >= m.W || y >= m.H || !m.walk) ? null : (m.walk.cell.get(y * m.W + x) || null);

/* ---------- the floor ---------- */
function flagStone(g, X, Y, W, H, s, seed, tone){
  const R = rng(seed), j = Math.max(1, s * 0.02);
  const x = X + j / 2, y = Y + j / 2, w = W - j, h = H - j;
  if(w < 2 || h < 2) return;
  const r = Math.min(s * 0.05, h * 0.28, w * 0.28);
  g.fillStyle = tone; rr(g, x, y, w, h, r); g.fill();
  /* lit from the upper left */
  g.fillStyle = lin(g, x, y, x + w * 0.45, y + h, [[0, 'rgba(255,255,255,.14)'], [0.55, 'rgba(255,255,255,0)'], [1, 'rgba(40,30,70,.09)']]); rr(g, x, y, w, h, r); g.fill();
  speckle(g, x + r * 0.5, y + r * 0.5, w - r, h - r, R, Math.max(4, Math.round(w * h / (s * s) * 30)), ['rgba(255,255,255,.2)', 'rgba(64,54,96,.15)', 'rgba(255,255,255,.1)', 'rgba(48,40,80,.12)'], s * 0.017);
  const e = L(s, 0.014);
  g.fillStyle = 'rgba(255,255,255,.24)'; g.fillRect(x + r * 0.6, y, w - r * 1.2, e); g.fillRect(x, y + r * 0.6, e, h - r * 1.2);
  g.fillStyle = 'rgba(44,36,70,.2)'; g.fillRect(x + r * 0.6, y + h - e, w - r * 1.2, e); g.fillRect(x + w - e, y + r * 0.6, e, h - r * 1.2);
  if(R() < 0.45){ const cx = x + w * R(), cy = y + h * R(); ell(g, cx, cy, w * (0.25 + R() * 0.3), h * (0.2 + R() * 0.3), R() < 0.5 ? 'rgba(255,250,240,.05)' : 'rgba(40,30,60,.05)'); }   // clouds in the stone
  const f = R();
  if(f < 0.07){                                                         // a crack
    let cx = x + w * (0.15 + R() * 0.3), cy = y + h * R();
    g.strokeStyle = 'rgba(40,32,64,.45)'; g.lineWidth = L(s, 0.01); g.beginPath(); g.moveTo(cx, cy);
    for(let i = 0; i < 4; i++){ cx += w * (0.08 + R() * 0.12); cy += (R() - 0.5) * h * 0.4; cy = Math.max(y + 2, Math.min(y + h - 2, cy)); g.lineTo(cx, cy); }
    g.stroke();
  } else if(f < 0.17){                                                  // a corner knocked off
    const cxr = R() < 0.5, cyr = R() < 0.5, c = Math.min(w, h) * (0.16 + R() * 0.12);
    const ax = cxr ? x + w : x, ay = cyr ? y + h : y;
    g.fillStyle = WS.mortar; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + (cxr ? -c : c), ay); g.lineTo(ax, ay + (cyr ? -c : c)); g.closePath(); g.fill();
  } else if(f < 0.3){                                                   // a worn hollow
    ell(g, x + w * (0.3 + R() * 0.4), y + h * (0.35 + R() * 0.3), w * 0.22, h * 0.24, 'rgba(46,36,80,.07)');
  }
  if(R() < 0.3){                                                        // lichen
    const lx = x + w * (0.1 + R() * 0.8), ly = y + h * (0.15 + R() * 0.7), col = R() < 0.7 ? 'rgba(214,214,150,.5)' : 'rgba(226,170,90,.42)';
    for(let i = 0; i < 6; i++) circ(g, lx + (R() - 0.5) * s * 0.07, ly + (R() - 0.5) * s * 0.05, s * (0.008 + R() * 0.012), col);
  }
  if(R() < 0.2){                                                        // moss in the joint below it
    const n = 2 + Math.floor(R() * 4);
    for(let i = 0; i < n; i++) ell(g, x + w * R(), y + h + j * 0.2, s * (0.02 + R() * 0.025), s * (0.012 + R() * 0.01), WS_MOSS[i % 3]);
  }
}
const WS_MOSS = ['rgba(98,128,58,.75)', 'rgba(132,158,74,.7)', 'rgba(78,104,46,.72)'];
function leaf(g, x, y, s, R){
  const len = s * (0.06 + R() * 0.05), wd = len * (0.38 + R() * 0.2), a = R() * Math.PI * 2;
  const col = ['#6f8f3a', '#8a9a3c', '#a07a3a', '#7a5a2a', '#5e7f34', '#b08a3e'][Math.floor(R() * 6)];
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = 'rgba(20,14,30,.22)'; g.beginPath(); g.moveTo(-len + 1.5, 1.5); g.quadraticCurveTo(1.5, -wd + 1.5, len + 1.5, 1.5); g.quadraticCurveTo(1.5, wd + 1.5, -len + 1.5, 1.5); g.fill();
  g.fillStyle = col; g.beginPath(); g.moveTo(-len, 0); g.quadraticCurveTo(0, -wd, len, 0); g.quadraticCurveTo(0, wd, -len, 0); g.fill();
  g.strokeStyle = 'rgba(40,30,10,.4)'; g.lineWidth = Math.max(0.6, s * 0.006); g.beginPath(); g.moveTo(-len * 1.15, 0); g.lineTo(len * 0.9, 0); g.stroke();
  g.restore();
}
function puddle(g, cx, cy, s, R){
  const rx = s * (0.16 + R() * 0.12), ry = rx * 0.55;
  g.fillStyle = 'rgba(60,64,96,.3)';
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.ellipse(cx + rx * 0.5, cy + ry * 0.3, rx * 0.6, ry * 0.7, 0, 0, TAU); g.fill();
  g.fillStyle = lin(g, cx - rx, cy - ry, cx + rx, cy + ry, [[0, 'rgba(190,206,236,.5)'], [1, 'rgba(120,140,190,.32)']]);
  g.beginPath(); g.ellipse(cx, cy, rx * 0.86, ry * 0.8, 0, 0, TAU); g.ellipse(cx + rx * 0.5, cy + ry * 0.3, rx * 0.5, ry * 0.58, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = L(s, 0.012); g.beginPath(); g.ellipse(cx - rx * 0.2, cy - ry * 0.25, rx * 0.4, ry * 0.25, -0.2, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
}
/* a compass rose let into the rampart's floor */
function compassRose(g, cx, cy, r, s){
  g.fillStyle = 'rgba(30,24,50,.25)'; g.beginPath(); g.arc(cx + s * 0.03, cy + s * 0.04, r * 1.06, 0, TAU); g.fill();
  g.fillStyle = '#58536f'; g.beginPath(); g.arc(cx, cy, r * 1.04, 0, TAU); g.fill();
  g.fillStyle = lin(g, cx - r, cy - r, cx + r, cy + r, [[0, '#d9d4e4'], [1, '#aba6bd']]); g.beginPath(); g.arc(cx, cy, r * 0.94, 0, TAU); g.fill();
  g.strokeStyle = '#58536f'; g.lineWidth = L(s, 0.02); g.beginPath(); g.arc(cx, cy, r * 0.8, 0, TAU); g.stroke();
  for(let i = 0; i < 32; i++){ const a = i / 32 * TAU, r0 = r * (i % 4 ? 0.86 : 0.82); g.strokeStyle = 'rgba(70,64,96,.7)'; g.lineWidth = L(s, i % 4 ? 0.008 : 0.016); g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92); g.stroke(); }
  const point = (a, len, wd, c1, c2)=>{
    const tx = cx + Math.cos(a) * len, ty = cy + Math.sin(a) * len, lx = cx + Math.cos(a - Math.PI / 2) * wd, ly = cy + Math.sin(a - Math.PI / 2) * wd, qx = cx + Math.cos(a + Math.PI / 2) * wd, qy = cy + Math.sin(a + Math.PI / 2) * wd;
    g.fillStyle = c1; g.beginPath(); g.moveTo(cx, cy); g.lineTo(lx, ly); g.lineTo(tx, ty); g.closePath(); g.fill();
    g.fillStyle = c2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(qx, qy); g.lineTo(tx, ty); g.closePath(); g.fill();
  };
  for(let i = 0; i < 4; i++) point(Math.PI / 4 + i * Math.PI / 2, r * 0.56, r * 0.12, '#8f8aa6', '#6f6a86');
  for(let i = 0; i < 4; i++) point(-Math.PI / 2 + i * Math.PI / 2, r * 0.78, r * 0.17, i === 0 ? '#c8343a' : '#4a4660', i === 0 ? '#e0606a' : '#77728f');
  circ(g, cx, cy, r * 0.09, GOLD); circ(g, cx - r * 0.025, cy - r * 0.025, r * 0.035, GOLD_L);
  g.fillStyle = '#3a3550'; g.font = `900 ${Math.round(r * 0.2)}px 'Baloo 2', system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('N', cx, cy - r * 0.68 - r * 0.0); 
}
/* the stair down into the tower: round, winding down past its newel into the dark */
function spiralStair(g, r, s, stand){
  const cx = (r.x + r.w / 2) * s, cy = (r.y + r.h / 2) * s, R = Math.min(r.w, r.h) * s * 0.47, r0 = R * 0.2;
  const a0 = stand ? Math.atan2((stand.y + 0.5) * s - cy, (stand.x + 0.5) * s - cx) : Math.PI;
  g.fillStyle = 'rgba(30,24,50,.3)'; g.beginPath(); g.arc(cx + s * 0.04, cy + s * 0.05, R * 1.1, 0, TAU); g.fill();
  /* the kerb round it */
  g.fillStyle = '#c6c1d4'; g.beginPath(); g.arc(cx, cy, R * 1.08, 0, TAU); g.fill();
  for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; g.strokeStyle = 'rgba(70,64,96,.45)'; g.lineWidth = L(s, 0.012); g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(a) * R * 1.08, cy + Math.sin(a) * R * 1.08); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(cx, cy, R * 1.08, Math.PI * 0.95, Math.PI * 1.6); g.arc(cx, cy, R * 1.0, Math.PI * 1.6, Math.PI * 0.95, true); g.fill();
  /* the well */
  g.fillStyle = '#100e18'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  /* the steps, winding down from where you go in: each a wedge, darker as it goes */
  const n = 11, step = TAU * 0.072;
  for(let i = n - 1; i >= 0; i--){
    const a = a0 + i * step, f = i / n;
    const tone = mix('#d9d4e4', '#1c1a26', Math.min(1, f * 1.15));
    g.fillStyle = tone; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.arc(cx, cy, R * 0.98, a, a + step * 1.02); g.lineTo(cx + Math.cos(a + step) * r0, cy + Math.sin(a + step) * r0); g.closePath(); g.fill();
    g.strokeStyle = `rgba(0,0,0,${0.35 + f * 0.3})`; g.lineWidth = L(s, 0.018); g.beginPath(); g.moveTo(cx + Math.cos(a + step) * r0, cy + Math.sin(a + step) * r0); g.lineTo(cx + Math.cos(a + step) * R * 0.98, cy + Math.sin(a + step) * R * 0.98); g.stroke();
    if(i < 3){ g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = L(s, 0.01); g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * R * 0.98, cy + Math.sin(a) * R * 0.98); g.stroke(); }
  }
  g.fillStyle = rad(g, cx, cy, R * 0.3, R, [[0, 'rgba(8,6,14,0)'], [1, 'rgba(8,6,14,.35)']]); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  /* the newel */
  circ(g, cx, cy, r0 * 1.05, '#8f8aa6'); circ(g, cx - r0 * 0.2, cy - r0 * 0.25, r0 * 0.6, '#c9c4d8');
  /* a rope rail round the inside of the kerb */
  g.strokeStyle = '#a07a3a'; g.lineWidth = L(s, 0.03); g.beginPath(); g.arc(cx, cy, R * 0.95, a0 + 0.35, a0 + TAU - 0.35); g.stroke();
  g.strokeStyle = 'rgba(255,230,170,.5)'; g.lineWidth = L(s, 0.01); g.beginPath(); g.arc(cx, cy, R * 0.95 - L(s, 0.008), a0 + 0.35, a0 + TAU - 0.35); g.stroke();
}
/* the shade the walls throw on the walk (light from the upper left): the parts of a wall square's shadow on (x, y) */
function wShadeOn(g, m, x, y, s){
  const polys = [];
  const add = (pts)=> polys.push(pts);
  const M = (1 - WG.MER) / 2;
  /* a wall north of the walk (its faces toward you): its shadow falls on the squares below it */
  for(const wx of [x - 1, x]){
    const c = wCell(m, wx, y - 1);
    if(!c || c.side !== 'n') continue;
    const hs = c.k === 'o' ? WG.HN : c.k === 'r' ? WG.HP : WG.HS, Y0 = y;
    add([[wx, Y0], [wx + 1, Y0], [wx + 1 + 0.3 * hs, Y0 + 0.6 * hs], [wx + 0.3 * hs, Y0 + 0.6 * hs]]);
    if(c.k === 'm' || c.k === 'k' || c.k === 'p'){
      const hm = WG.HM + (c.k === 'p' ? 0.22 : 0), u0 = c.k === 'm' ? wx + M : wx + 0.05, u1 = c.k === 'm' ? wx + 1 - M : wx + 0.95;
      add([[u0, Y0], [u1, Y0], [u1 + 0.3 * hm, Y0 + 0.6 * hm], [u0 + 0.3 * hm, Y0 + 0.6 * hm]]);
    }
  }
  /* a wall west of the walk: its shadow falls to its right, a little down */
  for(const wy of [y - 1, y]){
    const c = wCell(m, x - 1, wy);
    if(!c || c.side !== 'w') continue;
    const hs = c.k === 'o' ? WG.HN : c.k === 'r' ? WG.HP : WG.HS, X0 = x;
    add([[X0, wy], [X0, wy + 1], [X0 + 0.3 * hs, wy + 1 + 0.6 * hs], [X0 + 0.3 * hs, wy + 0.6 * hs]]);
    if(c.k === 'm' || c.k === 'p'){
      const hm = WG.HM + (c.k === 'p' ? 0.22 : 0), u0 = c.k === 'm' ? wy + M : wy + 0.05, u1 = c.k === 'm' ? wy + 1 - M : wy + 0.95;
      add([[X0, u0], [X0, u1], [X0 + 0.3 * hm, u1 + 0.6 * hm], [X0 + 0.3 * hm, u0 + 0.6 * hm]]);
    }
  }
  if(polys.length){
    g.save(); g.beginPath(); g.rect(x * s, y * s, s, s); g.clip();
    /* each shadow darkest at the wall's foot, fading as it falls away (light from the upper left) */
    polys.forEach(p=>{
      const fx = (p[0][0] + p[1][0]) / 2 * s, fy = (p[0][1] + p[1][1]) / 2 * s, tx = (p[2][0] + p[3][0]) / 2 * s, ty = (p[2][1] + p[3][1]) / 2 * s;
      g.fillStyle = lin(g, fx, fy, tx, ty, [[0, 'rgba(26,20,52,.26)'], [0.7, 'rgba(26,20,52,.12)'], [1, 'rgba(26,20,52,.02)']]);
      g.beginPath(); g.moveTo(p[0][0] * s, p[0][1] * s); for(let i = 1; i < p.length; i++) g.lineTo(p[i][0] * s, p[i][1] * s); g.closePath(); g.fill();
    });
    g.restore();
  }
  /* where the walk meets a wall: a line of shade at its foot */
  const X = x * s, Y = y * s, ao = s * 0.09;
  const at = (dx, dy)=> wCell(m, x + dx, y + dy);
  if(at(0, -1)){ g.fillStyle = lin(g, 0, Y, 0, Y + ao, [[0, 'rgba(26,20,52,.32)'], [1, 'rgba(26,20,52,0)']]); g.fillRect(X, Y, s, ao); }
  if(at(0, 1)){ g.fillStyle = lin(g, 0, Y + s, 0, Y + s - ao, [[0, 'rgba(26,20,52,.24)'], [1, 'rgba(26,20,52,0)']]); g.fillRect(X, Y + s - ao, s, ao); }
  if(at(-1, 0)){ g.fillStyle = lin(g, X, 0, X + ao, 0, [[0, 'rgba(26,20,52,.28)'], [1, 'rgba(26,20,52,0)']]); g.fillRect(X, Y, ao, s); }
  if(at(1, 0)){ g.fillStyle = lin(g, X + s, 0, X + s - ao, 0, [[0, 'rgba(26,20,52,.2)'], [1, 'rgba(26,20,52,0)']]); g.fillRect(X + s - ao, Y, ao, s); }
}
function walkPaint(g, m, s, R0){
  const W = m.walk, xa = Math.max(0, R0.x0), xb = Math.min(m.W - 1, R0.x1), ya = Math.max(0, R0.y0), yb = Math.min(m.H - 1, R0.y1);
  g.save(); g.beginPath();
  let any = false;
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++) if(wFloor(m, x, y)){ g.rect(x * s, y * s, s, s); any = true; }
  if(!any){ g.restore(); return; }
  g.clip();
  g.fillStyle = WS.mortar; g.fillRect(xa * s, ya * s, (xb - xa + 1) * s, (yb - ya + 1) * s);
  /* the flagstones: great slabs of every size, in courses along the walk (a rampart's across it) — each course its
     own depth, each slab its own length and shade, and here and there a slab split in two */
  const along = W.kind === 'ramp' || W.across;
  const lo = along ? ya : xa, hi = (along ? yb : xb) + 1, aLo = along ? xa : ya, aHi = (along ? xb : yb) + 1;
  const slab = (a0, len, c0, dep, sd)=>{
    const tone = WS.flags[sd % WS.flags.length];
    if(along) flagStone(g, a0 * s, c0 * s, len * s, dep * s, s, sd, tone); else flagStone(g, c0 * s, a0 * s, dep * s, len * s, s, sd, tone);
  };
  const Rc = rng(66000 + W.seed * 53);
  for(let c0 = 0, ci = 0; c0 < hi; ci++){
    const dep = 0.48 + Rc() * 0.5, c1 = c0 + dep;
    if(c1 > lo){
      const R = rng(77000 + ci * 7919 + W.seed * 31);
      let at = -R() * 1.5;
      while(at < aHi){
        const len = 0.6 + R() * 0.95, sd = Math.floor(R() * 1e9), sp = R();
        if(at + len > aLo - 0.01){
          if(sp < 0.16 && dep > 0.7){ const d1 = dep * (0.4 + R() * 0.2); slab(at, len, c0, d1, sd); slab(at, len, c0 + d1, dep - d1, sd + 1); }   // two, one behind the other
          else if(sp < 0.3 && len > 1){ const l1 = len * (0.35 + R() * 0.3); slab(at, l1, c0, dep, sd); slab(at + l1, len - l1, c0, dep, sd + 3); }   // two, side by side
          else slab(at, len, c0, dep, sd);
        }
        at += len;
      }
    }
    c0 = c1;
  }
  /* worn paler down the middle, where the patrols march */
  if(W.kind === 'wall'){
    const sp = m.tags.sp, mid = (sp.walk[0] + sp.walk[1]) / 2;
    if(sp.across){ const y0 = (mid - 1.1) * s, y1 = (mid + 1.1) * s; g.fillStyle = lin(g, 0, y0, 0, y1, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,252,240,.09)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(xa * s, y0, (xb - xa + 1) * s, y1 - y0); }
    else { const x0 = (mid - 1.1) * s, x1 = (mid + 1.1) * s; g.fillStyle = lin(g, x0, 0, x1, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,252,240,.09)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(x0, ya * s, x1 - x0, (yb - ya + 1) * s); }
  }
  /* the rampart's compass rose, its stair */
  if(W.kind === 'ramp'){
    if(7 + 1.6 >= xa && 7 - 1.6 <= xb + 1 && 7 + 1.6 >= ya && 7 - 1.6 <= yb + 1) compassRose(g, 7 * s, 7 * s, s * 1.3, s);
    const st = m.tags.stair;
    if(st && st.x + st.w + 1 >= xa && st.x - 1 <= xb && st.y + st.h + 1 >= ya && st.y - 1 <= yb) spiralStair(g, st, s, st.stand);
  }
  /* what the jungle blew up here: leaves; and here and there a puddle from the last rain */
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++){
    if(!wFloor(m, x, y) || caAt(m, x, y) === T.STAIRS) continue;
    const R = rng(5150 + x * 977 + y * 131 + W.seed * 7);
    const near = (cx, cy)=> W.kind === 'ramp' && Math.hypot(cx - 7, cy - 7) < 1.5;
    if(R() < 0.035 && !near(x + 0.5, y + 0.5)) puddle(g, (x + 0.3 + R() * 0.4) * s, (y + 0.3 + R() * 0.4) * s, s, R);
    const nl = R() < 0.22 ? (R() < 0.3 ? 2 : 1) : 0;
    for(let i = 0; i < nl; i++){ const lx = x + 0.1 + R() * 0.8, ly = y + 0.1 + R() * 0.8; if(!near(lx, ly)) leaf(g, lx * s, ly * s, s, R); }
  }
  /* the walls' shade on it */
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++) if(wFloor(m, x, y)) wShadeOn(g, m, x, y, s);
  g.restore();
}

/* ---------- what stands up: the battlements, the parapets ---------- */
/* a face of the walls' stone between y0 and y1, its courses counted from `foot` so the pieces of one face meet; lit
   from the left; `drop`: the face going on down below a wall in front of you, into the shadow at its foot */
function wFace(g, x, y0, w, y1, k, foot, seed, o){
  o = o || {};
  if(y1 - y0 < 0.5 || w < 0.5) return;
  g.save(); g.beginPath(); g.rect(x, y0, w, y1 - y0); g.clip();
  g.fillStyle = WS.mortarF; g.fillRect(x, y0, w, y1 - y0);
  const ch = k * 0.2, gap = Math.max(0.8, k * 0.014), e = Math.max(1, k * 0.012);
  const first = Math.floor((y0 - foot) / ch) - 1, last = Math.ceil((y1 - foot) / ch) + 1;
  for(let c = first; c <= last; c++){
    const cy = foot + c * ch, Rc = rng(seed * 7 + (c + 50) * 131);
    let bx = x - Rc() * k * 0.4;
    while(bx < x + w){
      const bw = k * (0.26 + Rc() * 0.3);
      g.fillStyle = sh(o.base || WS.face, (Rc() - 0.5) * 0.16);
      g.fillRect(bx + gap, cy + gap, bw - gap * 2, ch - gap * 2);
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(bx + gap, cy + gap, bw - gap * 2, e);
      g.fillStyle = 'rgba(30,24,52,.16)'; g.fillRect(bx + gap, cy + ch - gap - e, bw - gap * 2, e);
      bx += bw;
    }
  }
  g.fillStyle = lin(g, x, 0, x + w, 0, [[0, 'rgba(255,255,255,.12)'], [0.45, 'rgba(255,255,255,0)'], [1, 'rgba(30,20,60,.14)']]); g.fillRect(x, y0, w, y1 - y0);
  if(o.drop){
    /* below the walk's level the face goes on down out of the light */
    const yt = Math.max(y0, o.drop);
    g.fillStyle = lin(g, 0, yt, 0, y1, [[0, 'rgba(14,10,30,.1)'], [0.6, 'rgba(14,10,30,.55)'], [1, 'rgba(14,10,30,.8)']]); g.fillRect(x, yt, w, y1 - yt);
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = lin(g, 0, y1 - (y1 - yt) * 0.45, 0, y1, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,1)']]); g.fillRect(x, y1 - (y1 - yt) * 0.45, w, (y1 - yt) * 0.45);
    g.globalCompositeOperation = 'source-over';
  } else if(!o.noFoot){
    g.fillStyle = lin(g, 0, y1 - k * 0.24, 0, y1, [[0, 'rgba(20,14,40,0)'], [1, 'rgba(20,14,40,.26)']]); g.fillRect(x, y1 - k * 0.24, w, k * 0.24);
  }
  g.restore();
}
/* a coping stone's top, seen from above: (x, y) its far corner, d its depth on the screen */
function wCap(g, x, y, w, d, k, seed, o){
  o = o || {};
  if(d < 0.5 || w < 0.5) return;
  const R = rng(seed), ov = o.flush ? 0 : k * 0.022, e = Math.max(1, k * 0.016);
  g.fillStyle = o.base || WS.cap; g.fillRect(x - ov, y, w + ov * 2, d);
  speckle(g, x, y, w, d, R, Math.max(3, Math.round(w * d / (k * k) * 46)), ['rgba(255,255,255,.26)', 'rgba(60,50,92,.14)', 'rgba(60,50,92,.1)'], k * 0.016);
  if(o.joints) for(let jx = x + o.joints * k * (0.3 + R() * 0.5); jx < x + w - k * 0.15; jx += o.joints * k * (0.7 + R() * 0.5)){ g.fillStyle = 'rgba(60,52,90,.35)'; g.fillRect(jx, y, Math.max(1, k * 0.012), d); }
  g.fillStyle = 'rgba(255,255,255,.42)'; g.fillRect(x - ov, y, w + ov * 2, e);                         // its far edge, catching the light
  g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x - ov, y, Math.max(1, k * 0.022), d);              // its left
  g.fillStyle = 'rgba(40,30,72,.2)'; g.fillRect(x + w + ov - Math.max(1, k * 0.022), y, Math.max(1, k * 0.022), d);
  g.fillStyle = WS.capL; g.fillRect(x - ov, y + d - Math.max(1.2, k * 0.026), w + ov * 2, Math.max(1.2, k * 0.026));   // its near arris
  if(!o.flush){ g.fillStyle = 'rgba(28,20,50,.32)'; g.fillRect(x - ov, y + d, w + ov * 2, Math.max(1, k * 0.034)); }   // the shadow under its lip
}
/* an arrow loop through a merlon: a cross of slits, round-ended */
function arrowLoop(g, cx, top, h, k){
  const w = Math.max(1.5, k * 0.05);
  g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, cx - w * 1.6, top - w * 0.6, w * 3.2, h + w * 1.2, w * 1.4); g.fill();   // its splay, catching the light
  g.fillStyle = 'rgba(30,24,52,.35)'; rr(g, cx - w * 1.1, top - w * 0.2, w * 2.2, h + w * 0.4, w); g.fill();
  g.fillStyle = '#19161f'; rr(g, cx - w / 2, top, w, h, w / 2); g.fill();
  circ(g, cx, top + h - w * 0.3, w * 0.8, '#19161f');
}
/* a piece of the battlements (d.side: which side of the walk it stands on; d.cells: m merlon, o a lookout's notch,
   k a corner's great merlon, p a post beside an opening) */
function drawBattlement(g, d, x, y, w, h, k){
  const X = tx=> x + (tx - d.x) * k, Y = ty=> y + (ty - d.y) * k, M = (1 - WG.MER) / 2, cells = d.cells, seed = d.seed || 1;
  const merl = c=> c === 'm' || c === 'k' || c === 'p';
  const span = (a, c)=> c === 'm' ? [a + M, a + 1 - M] : c === 'k' ? [a + 0.04, a + 0.96] : [a + 0.06, a + 0.94];
  const hOf = c=> WG.HM + (c === 'p' ? 0.22 : c === 'k' ? 0.08 : 0);
  if(d.side === 'n' || d.side === 's'){
    const near = d.side === 's', r = d.r, far = near ? r : r + 1 - WG.D, front = far + WG.D;
    const bottom = near ? front + WG.DROP : front;
    for(let i = 0; i < cells.length; i++){
      const a = d.a0 + i, c = cells[i], hs = c === 'o' ? WG.HN : WG.HS;
      wFace(g, X(a), Y(front - hs), X(a + 1) - X(a), Y(bottom), k, Y(front), seed, { drop:near ? Y(front) : 0 });
      wCap(g, X(a), Y(far - hs), X(a + 1) - X(a), Y(front - hs) - Y(far - hs), k, seed + a * 11, { base:c === 'o' ? WS.worn : WS.cap, flush:true });
    }
    for(let i = 0; i < cells.length; i++){
      const a = d.a0 + i, c = cells[i];
      if(!merl(c)) continue;
      const [u0, u1] = span(a, c), hm = hOf(c);
      if(!near){                                                        // its shadow across the sill's top, to its right
        g.fillStyle = 'rgba(26,20,52,.24)'; g.beginPath();
        g.moveTo(X(u1), Y(far - WG.HS)); g.lineTo(X(u1 + 0.16), Y(far - WG.HS)); g.lineTo(X(u1 + 0.16), Y(front - WG.HS)); g.lineTo(X(u1), Y(front - WG.HS)); g.closePath(); g.fill();
      }
      wFace(g, X(u0), Y(front - hm), X(u1) - X(u0), Y(bottom), k, Y(front), seed + 3, { drop:near ? Y(front) : 0 });
      wCap(g, X(u0), Y(far - hm), X(u1) - X(u0), Y(front - hm) - Y(far - hm), k, seed + a * 17);
      if(c === 'p') postBall(g, (X(u0) + X(u1)) / 2, (Y(far - hm) + Y(front - hm)) / 2, k);
      else arrowLoop(g, (X(u0) + X(u1)) / 2, Y(front - hm) + k * 0.1, (hm - WG.HS) * k * 0.95, k);
    }
    return;
  }
  /* down the side of the walk */
  const c0 = d.r, fx0 = d.side === 'w' ? c0 + 1 - WG.DV : c0, fx1 = fx0 + WG.DV;
  for(let i = 0; i < cells.length; i++){
    const a = d.a0 + i, c = cells[i], hs = c === 'o' ? WG.HN : WG.HS;
    wFace(g, X(fx0), Y(a + 1 - hs), X(fx1) - X(fx0), Y(a + 1), k, Y(a + 1), seed + a * 5);
    wCap(g, X(fx0), Y(a - hs), X(fx1) - X(fx0), Y(a + 1 - hs) - Y(a - hs), k, seed + a * 9, { base:c === 'o' ? WS.worn : WS.cap, flush:true });
  }
  for(let i = 0; i < cells.length; i++){
    const a = d.a0 + i, c = cells[i];
    if(!merl(c)) continue;
    const [u0, u1] = span(a, c), hm = hOf(c);
    wFace(g, X(fx0), Y(u1 - hm), X(fx1) - X(fx0), Y(u1 - WG.HS), k, Y(u1), seed + a * 3, { noFoot:true });
    wCap(g, X(fx0), Y(u0 - hm), X(fx1) - X(fx0), Y(u1 - hm) - Y(u0 - hm), k, seed + a * 19);
    if(c === 'p') postBall(g, (X(fx0) + X(fx1)) / 2, (Y(u0 - hm) + Y(u1 - hm)) / 2, k);
  }
}
/* a stone ball on a post beside an opening in the battlements */
function postBall(g, cx, cy, k){
  shadow(g, cx + k * 0.04, cy + k * 0.05, k * 0.17, k * 0.07, 0.3);
  g.fillStyle = WS.face; g.fillRect(cx - k * 0.13, cy - k * 0.06, k * 0.26, k * 0.08);
  g.fillStyle = rad(g, cx - k * 0.05, cy - k * 0.2, k * 0.02, k * 0.18, [[0, WS.capL], [0.6, WS.cap], [1, WS.faceD]]);
  g.beginPath(); g.arc(cx, cy - k * 0.16, k * 0.15, 0, TAU); g.fill();
}
/* a piece of the parapet on the castle's side: a low wall under its coping */
function drawParapetW(g, d, x, y, w, h, k){
  const X = tx=> x + (tx - d.x) * k, Y = ty=> y + (ty - d.y) * k, seed = d.seed || 1, len = d.cells.length;
  if(d.side === 'n' || d.side === 's'){
    const near = d.side === 's', r = d.r, far = near ? r : r + 1 - WG.D, front = far + WG.D;
    const bottom = near ? front + WG.DROP : front;
    wFace(g, X(d.a0), Y(front - WG.HP), X(d.a0 + len) - X(d.a0), Y(bottom), k, Y(front), seed, { drop:near ? Y(front) : 0 });
    wCap(g, X(d.a0), Y(far - WG.HP), X(d.a0 + len) - X(d.a0), Y(front - WG.HP) - Y(far - WG.HP), k, seed + 5, { joints:0.95, flush:true });
    return;
  }
  const c0 = d.r, fx0 = d.side === 'w' ? c0 + 1 - WG.DPV : c0, fx1 = fx0 + WG.DPV;
  wCap(g, X(fx0), Y(d.a0 - WG.HP), X(fx1) - X(fx0), Y(d.a0 + len - WG.HP) - Y(d.a0 - WG.HP), k, seed + 7, { flush:true });
  /* its coping's joints, across it */
  const R = rng(seed + 13);
  for(let jy = d.a0 + 0.4 + R() * 0.5; jy < d.a0 + len; jy += 0.75 + R() * 0.45){ g.fillStyle = 'rgba(60,52,90,.35)'; g.fillRect(X(fx0), Y(jy - WG.HP), X(fx1) - X(fx0), Math.max(1, k * 0.012)); }
}
/* the King's banner, hanging on the face toward you (LIVE: it stirs) */
function drawWBanner(g, d, x, y, w, h, k, t){
  const blue = d.n % 2 === 1, C = blue ? ['#2f4f9a', '#22397a', '#4a6ab8'] : ['#a3263b', '#7c1a2b', '#c23a50'];
  const bx = x + w * 0.12, bw = w * 0.76, top = y + k * 0.1, bh = h - k * 0.32, sw = Math.sin(t * 1.6 + d.x * 0.7) * k * 0.025;
  /* its rod and rings */
  g.fillStyle = '#3a2a1a'; g.fillRect(x + w * 0.04, top - k * 0.05, w * 0.92, Math.max(2, k * 0.05));
  circ(g, x + w * 0.04, top - k * 0.025, k * 0.04, GOLD); circ(g, x + w * 0.96, top - k * 0.025, k * 0.04, GOLD);
  /* the cloth, its tail cut in two points */
  const path = ()=>{ g.beginPath(); g.moveTo(bx, top); g.lineTo(bx + bw, top); g.quadraticCurveTo(bx + bw + sw, top + bh * 0.5, bx + bw + sw * 1.6, top + bh); g.lineTo(bx + bw / 2 + sw, top + bh - k * 0.2); g.lineTo(bx + sw * 1.6, top + bh); g.quadraticCurveTo(bx + sw, top + bh * 0.5, bx, top); g.closePath(); };
  g.fillStyle = 'rgba(10,6,20,.3)'; g.save(); g.translate(k * 0.04, k * 0.05); path(); g.fill(); g.restore();
  path(); g.fillStyle = lin(g, bx, 0, bx + bw, 0, [[0, C[2]], [0.35, C[0]], [1, C[1]]]); g.fill();
  g.save(); path(); g.clip();
  g.strokeStyle = GOLD; g.lineWidth = Math.max(1.5, k * 0.035); path(); g.stroke();
  g.fillStyle = lin(g, 0, top, 0, top + bh, [[0, 'rgba(255,255,255,.12)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.2)']]); g.fillRect(bx - k, top, bw + 2 * k, bh);
  /* a fold or two */
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(bx + bw * 0.62 + sw * 0.5, top, bw * 0.08, bh);
  g.restore();
  /* the crest: a crown over a star */
  const cx = bx + bw / 2 + sw * 0.6, cy = top + bh * 0.36, cr = bw * 0.24;
  g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx - cr, cy + cr * 0.35); g.lineTo(cx - cr * 1.05, cy - cr * 0.45); g.lineTo(cx - cr * 0.5, cy - cr * 0.05); g.lineTo(cx, cy - cr * 0.7); g.lineTo(cx + cr * 0.5, cy - cr * 0.05); g.lineTo(cx + cr * 1.05, cy - cr * 0.45); g.lineTo(cx + cr, cy + cr * 0.35); g.closePath(); g.fill();
  g.fillStyle = GOLD_L; g.fillRect(cx - cr, cy + cr * 0.22, cr * 2, cr * 0.16);
  const sy = cy + cr * 1.25, sr = cr * 0.55;
  g.fillStyle = GOLD; g.beginPath(); for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? sr * 0.42 : sr; g.lineTo(cx + Math.cos(a) * rr2, sy + Math.sin(a) * rr2); } g.closePath(); g.fill();
}
/* an iron brazier on the parapet, burning (the fire LIVE) */
function drawBrazier(g, d, x, y, w, h, k){
  const cx = x + w / 2, foot = y + h - k * 0.04, bowl = foot - k * 0.42, bw = w * 0.86;
  shadow(g, cx + k * 0.05, foot, bw * 0.42, k * 0.06, 0.3);
  g.strokeStyle = WS.iron; g.lineWidth = Math.max(1.5, k * 0.045); g.lineCap = 'round';
  [[-0.36, 0], [0.36, 0], [0, 0.05]].forEach(([dx, dy])=>{ g.beginPath(); g.moveTo(cx + dx * bw * 0.5, bowl + k * 0.06); g.lineTo(cx + dx * bw * 1.05, foot - dy * k); g.stroke(); });
  g.beginPath(); g.moveTo(cx - bw * 0.3, foot - k * 0.14); g.lineTo(cx + bw * 0.3, foot - k * 0.14); g.stroke();
  /* the bowl: a band of iron, riveted, its rim catching the light */
  g.fillStyle = lin(g, cx - bw / 2, 0, cx + bw / 2, 0, [[0, WS.ironL], [0.35, WS.iron], [1, '#1a1920']]);
  g.beginPath(); g.moveTo(cx - bw / 2, bowl - k * 0.08); g.lineTo(cx + bw / 2, bowl - k * 0.08); g.lineTo(cx + bw * 0.36, bowl + k * 0.12); g.lineTo(cx - bw * 0.36, bowl + k * 0.12); g.closePath(); g.fill();
  for(let i = 0; i < 5; i++) circ(g, cx - bw * 0.36 + i * bw * 0.18, bowl + k * 0.015, Math.max(0.8, k * 0.014), '#6a6676');
  g.fillStyle = '#5a5664'; g.fillRect(cx - bw / 2, bowl - k * 0.1, bw, Math.max(1.5, k * 0.03));
  /* its coals */
  g.fillStyle = '#3a1608'; g.beginPath(); g.ellipse(cx, bowl - k * 0.085, bw * 0.46, k * 0.05, 0, 0, TAU); g.fill();
  const R = rng(Math.round(d.x * 31 + d.y * 7));
  for(let i = 0; i < 9; i++) circ(g, cx + (R() - 0.5) * bw * 0.8, bowl - k * 0.09 + (R() - 0.5) * k * 0.05, k * (0.02 + R() * 0.02), ['#ff8a2a', '#ffb347', '#c8341a'][i % 3]);
}
function brazierFire(g, d, x, y, w, h, k, t){
  const cx = x + w / 2, foot = y + h - k * 0.04, bowl = foot - k * 0.42;
  const prev = g.globalCompositeOperation;
  g.globalCompositeOperation = 'lighter';
  const gl = 0.85 + 0.15 * Math.sin(t * 7 + d.x);
  g.fillStyle = rad(g, cx, bowl - k * 0.2, 0, k * 1.1, [[0, `rgba(255,170,70,${0.32 * gl})`], [0.5, `rgba(255,120,40,${0.1 * gl})`], [1, 'rgba(255,120,40,0)']]); g.fillRect(cx - k * 1.1, bowl - k * 1.3, k * 2.2, k * 2.2);
  g.globalCompositeOperation = prev;
  for(let i = 0; i < 3; i++) flameAt(g, cx + (i - 1) * w * 0.2, bowl - k * 0.07, k * (i === 1 ? 0.2 : 0.13), t, d.x * 3 + i);
}
/* a pennant on a short pole on the parapet (LIVE: it flies) */
function drawPennant(g, d, x, y, w, h, k, t){
  const px = x + k * 0.1, foot = y + h, top = y + k * 0.06;
  g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1.5, k * 0.04); g.beginPath(); g.moveTo(px, foot); g.lineTo(px, top); g.stroke();
  circ(g, px, top, k * 0.04, GOLD);
  const C = d.n % 2 ? '#2f4f9a' : '#a3263b', len = k * 0.62, f = (u)=> Math.sin(t * 3.2 + u * 5 + d.y) * k * 0.05 * u;
  g.fillStyle = C; g.beginPath(); g.moveTo(px, top + k * 0.04);
  for(let i = 0; i <= 8; i++){ const u = i / 8; g.lineTo(px + len * u, top + k * 0.04 + k * 0.1 * u + f(u)); }
  for(let i = 8; i >= 0; i--){ const u = i / 8; g.lineTo(px + len * u, top + k * 0.32 - k * 0.12 * u + f(u)); }
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(px, top + k * 0.04); for(let i = 0; i <= 8; i++){ const u = i / 8; g.lineTo(px + len * u, top + k * 0.04 + k * 0.1 * u + f(u)); } for(let i = 8; i >= 0; i--){ const u = i / 8; g.lineTo(px + len * u, top + k * 0.1 + k * 0.08 * u + f(u)); } g.closePath(); g.fill();
}
/* the flag on a rampart's outer corner (LIVE) */
function drawFlagpole(g, d, x, y, w, h, k, t){
  const px = x + k * 0.5, foot = y + h - k * 0.05, top = y + k * 0.1;
  g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(2, k * 0.06); g.beginPath(); g.moveTo(px, foot); g.lineTo(px, top); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = Math.max(1, k * 0.018); g.beginPath(); g.moveTo(px - k * 0.015, foot); g.lineTo(px - k * 0.015, top); g.stroke();
  circ(g, px, top, k * 0.07, GOLD); circ(g, px - k * 0.02, top - k * 0.02, k * 0.025, GOLD_L);
  const len = k * 1.15, f = (u)=> Math.sin(t * 2.6 + u * 4.2 + d.x) * k * 0.09 * u;
  const yt = top + k * 0.08;
  g.fillStyle = '#2f4f9a'; g.beginPath(); g.moveTo(px, yt);
  for(let i = 0; i <= 10; i++){ const u = i / 10; g.lineTo(px + len * u, yt + k * 0.14 * u + f(u)); }
  for(let i = 10; i >= 0; i--){ const u = i / 10; g.lineTo(px + len * u, yt + k * 0.5 - k * 0.2 * u + f(u)); }
  g.closePath(); g.fill();
  g.fillStyle = GOLD; for(let i = 1; i <= 10; i++){ const u = i / 10; if(i % 2) continue; circ(g, px + len * u, yt + k * 0.14 * u + f(u), k * 0.018, GOLD); }
  g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(px, yt); for(let i = 0; i <= 10; i++){ const u = i / 10; g.lineTo(px + len * u, yt + k * 0.14 * u + f(u)); } for(let i = 10; i >= 0; i--){ const u = i / 10; g.lineTo(px + len * u, yt + k * 0.22 * u + f(u) + k * 0.05); } g.closePath(); g.fill();
  /* a crown on it */
  const u = 0.32, cx = px + len * u, cy = yt + k * 0.25 + f(u) - k * 0.02, cr = k * 0.09;
  g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx - cr, cy + cr * 0.4); g.lineTo(cx - cr, cy - cr * 0.4); g.lineTo(cx - cr * 0.45, cy); g.lineTo(cx, cy - cr * 0.6); g.lineTo(cx + cr * 0.45, cy); g.lineTo(cx + cr, cy - cr * 0.4); g.lineTo(cx + cr, cy + cr * 0.4); g.closePath(); g.fill();
}
/* the spyglass at a rampart's outer corner: brass on a wooden tripod, looking out over the jungle */
function drawSpyglass(g, d, x, y, w, h, k){
  const cx = x + w * 0.5, hub = y + h * 0.5, foot = y + h * 0.95;
  const dir = d.corner === 'nw' ? [-1, -1] : d.corner === 'ne' ? [1, -1] : d.corner === 'sw' ? [-1, 1] : [1, 1];
  shadow(g, cx + k * 0.08, foot, w * 0.34, k * 0.08, 0.28);
  /* the tripod's legs: the far one first */
  const leg = (fx, fy, far)=>{ g.strokeStyle = far ? '#5a3a20' : '#7a4f2a'; g.lineWidth = Math.max(1.5, k * 0.05); g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, hub); g.lineTo(fx, fy); g.stroke(); g.strokeStyle = 'rgba(255,230,190,.25)'; g.lineWidth = Math.max(0.8, k * 0.014); g.beginPath(); g.moveTo(cx - k * 0.012, hub); g.lineTo(fx - k * 0.012, fy); g.stroke(); circ(g, fx, fy, k * 0.03, '#3a2a1a'); };
  leg(cx + w * 0.04, foot - k * 0.2, true);
  leg(cx - w * 0.34, foot, false); leg(cx + w * 0.34, foot, false);
  circ(g, cx, hub, k * 0.07, GOLD_D); circ(g, cx, hub, k * 0.05, GOLD); circ(g, cx - k * 0.015, hub - k * 0.015, k * 0.02, GOLD_L);
  /* the glass: tapering brass in three draws, a leather grip, its lens toward the jungle */
  const ang = Math.atan2(dir[1] * 0.42 - 0.35, dir[0]);
  g.save(); g.translate(cx, hub - k * 0.06); g.rotate(ang);
  const seg = (x0, x1, r0, r1, c)=>{ g.fillStyle = lin(g, 0, -r0, 0, r0, [[0, GOLD_L], [0.35, c], [1, GOLD_D]]); g.beginPath(); g.moveTo(x0, -r0); g.lineTo(x1, -r1); g.lineTo(x1, r1); g.lineTo(x0, r0); g.closePath(); g.fill(); };
  seg(-k * 0.34, -k * 0.12, k * 0.045, k * 0.055, GOLD);
  g.fillStyle = '#4a2a18'; g.fillRect(-k * 0.12, -k * 0.065, k * 0.14, k * 0.13);
  seg(k * 0.02, k * 0.3, k * 0.06, k * 0.075, GOLD);
  seg(k * 0.3, k * 0.5, k * 0.085, k * 0.095, '#c9a24a');
  g.fillStyle = '#2a2a3a'; g.beginPath(); g.ellipse(k * 0.5, 0, k * 0.025, k * 0.09, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(170,220,255,.8)'; g.beginPath(); g.ellipse(k * 0.505, -k * 0.02, k * 0.012, k * 0.04, 0, 0, TAU); g.fill();
  g.fillStyle = GOLD_D; g.fillRect(-k * 0.38, -k * 0.035, k * 0.05, k * 0.07);
  g.restore();
}
/* past a rampart's arch, the walk going on along its wall (over the far view), fading away */
function drawWallStub(g, d, x, y, w, h, k){
  const X = tx=> x + (tx - d.x) * k, Y = ty=> y + (ty - d.y) * k, s = k, o = d.o;   // o: the passage's squares {x0, y0, x1, y1}, its way out (dir)
  g.save();
  g.fillStyle = WS.mortar; g.fillRect(X(o.x0), Y(o.y0), X(o.x1) - X(o.x0), Y(o.y1) - Y(o.y0));
  g.beginPath(); g.rect(X(o.x0), Y(o.y0), X(o.x1) - X(o.x0), Y(o.y1) - Y(o.y0)); g.clip();
  const across = o.dir === 'e' || o.dir === 'w', R = rng(4242 + Math.round(o.x0 * 13 + o.y0 * 7));
  for(let c = 0; c < (across ? (o.y1 - o.y0) * 2 : (o.x1 - o.x0) * 2); c++){
    let at = -R() * 1.2; const end = across ? o.x1 - o.x0 : o.y1 - o.y0;
    while(at < end){ const len = 0.55 + R() * 0.8, tone = WS.flags[Math.floor(R() * WS.flags.length)], sd = Math.floor(R() * 1e9);
      if(across) flagStone(g, X(o.x0 + at), Y(o.y0 + c * 0.5), len * s, 0.5 * s, s, sd, tone); else flagStone(g, X(o.x0 + c * 0.5), Y(o.y0 + at), 0.5 * s, len * s, s, sd, tone);
      at += len; }
  }
  g.restore();
  /* its low walls either side */
  if(across){
    wFace(g, X(o.x0), Y(o.y0 - WG.HP + WG.D * 0), X(o.x1) - X(o.x0), Y(o.y0), k, Y(o.y0), 77, {});
    wCap(g, X(o.x0), Y(o.y0 - WG.D - WG.HP), X(o.x1) - X(o.x0), WG.D * k, k, 78, { joints:0.95, flush:true });
    wCap(g, X(o.x0), Y(o.y1 - WG.HP), X(o.x1) - X(o.x0), WG.D * k, k, 79, { joints:0.95, flush:true });
    wFace(g, X(o.x0), Y(o.y1 - WG.HP + WG.D), X(o.x1) - X(o.x0), Y(o.y1 + WG.D + 0.5), k, Y(o.y1 + WG.D), 80, { drop:Y(o.y1 + WG.D) });
  } else {
    wCap(g, X(o.x0 - WG.DPV), Y(o.y0 - WG.HP), WG.DPV * k, Y(o.y1) - Y(o.y0), k, 81, { flush:true });
    wCap(g, X(o.x1), Y(o.y0 - WG.HP), WG.DPV * k, Y(o.y1) - Y(o.y0), k, 82, { flush:true });
  }
  /* fading out as it goes */
  g.save(); g.globalCompositeOperation = 'destination-out';
  const gx0 = o.dir === 'e' ? X(o.x0) : o.dir === 'w' ? X(o.x1) : 0, gx1 = o.dir === 'e' ? X(o.x1) : o.dir === 'w' ? X(o.x0) : 0;
  const gy0 = o.dir === 's' ? Y(o.y0) : o.dir === 'n' ? Y(o.y1) : 0, gy1 = o.dir === 's' ? Y(o.y1) : o.dir === 'n' ? Y(o.y0) : 0;
  g.fillStyle = across ? lin(g, gx0, 0, gx1, 0, [[0, 'rgba(0,0,0,0)'], [0.35, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,1)']]) : lin(g, 0, gy0, 0, gy1, [[0, 'rgba(0,0,0,0)'], [0.35, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,1)']]);
  g.fillRect(x - k, y - k, w + 2 * k, h + 2 * k);
  g.restore();
}
const WALL_KEEP = { battlement:still(drawBattlement, 0.3), parapetW:still(drawParapetW, 0.3), brazier:still(drawBrazier, 0.3), spyglass:still(drawSpyglass, 0.4), wallStub:still(drawWallStub, 0.6) };
const WALL_LIVE = { wbanner:drawWBanner, brazier:brazierFire, pennant:drawPennant, flagpole:drawFlagpole };

/* ---------- a wall's or a rampart's things, set out once ---------- */
function walkDress(m, kind, id){
  const W = m.W, walk = m.walk = { kind, id, seed:(kind === 'ramp' ? 300 : 100) + ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se'].indexOf(id) * 17, cell:new Map() };
  m.room = kind + '_' + id;                                            // its own pieces of picture (slice)
  m._ri = null;
  const put = (x, y, side, k)=> walk.cell.set(y * W + x, { side, k });
  if(kind === 'wall'){
    const sp = m.tags.sp; walk.across = sp.across;
    const bs = sp.across ? (sp.crenel < sp.walk[0] ? 'n' : 's') : (sp.crenel < sp.walk[0] ? 'w' : 'e');
    const ps = sp.across ? (sp.parapet < sp.walk[0] ? 'n' : 's') : (sp.parapet < sp.walk[0] ? 'w' : 'e');
    for(let a = 0; a < 64; a++){
      const bx = sp.across ? a : sp.crenel, by = sp.across ? sp.crenel : a, px = sp.across ? a : sp.parapet, py = sp.across ? sp.parapet : a;
      put(bx, by, bs, caAt(m, bx, by) === T.NOTCH ? 'o' : 'm');
      put(px, py, ps, 'r');
    }
  } else {
    for(let i = 2; i <= 11; i++){
      [[i, 2, 'n'], [i, 11, 's'], [2, i, 'w'], [11, i, 'e']].forEach(([x, y, side])=>{
        if((side === 'w' || side === 'e') && (y === 2 || y === 11)) return;   // the corners go with the rows
        const t = caAt(m, x, y);
        if(t !== T.CRENEL && t !== T.NOTCH) return;                    // an opening: an arch onto a wall
        let k = t === T.NOTCH ? 'o' : 'm';
        if((x === 2 || x === 11) && (y === 2 || y === 11)) k = 'k';
        else if(k === 'm'){ const hz = side === 'n' || side === 's', n1 = hz ? caAt(m, x - 1, y) : caAt(m, x, y - 1), n2 = hz ? caAt(m, x + 1, y) : caAt(m, x, y + 1); if(n1 === T.WALK || n2 === T.WALK) k = 'p'; }
        put(x, y, side, k);
      });
    }
  }
  /* the pieces: along each line of wall, up to four squares, cut where it is broken */
  const lines = new Map();
  walk.cell.forEach((c, i)=>{
    const x = i % W, y = (i - x) / W, hz = c.side === 'n' || c.side === 's', key = c.side + ':' + (hz ? y : x) + ':' + (c.k === 'r' ? 'r' : 'b');
    if(!lines.has(key)) lines.set(key, []);
    lines.get(key).push({ a:hz ? x : y, k:c.k });
  });
  lines.forEach((list, key)=>{
    const [side, rS, what] = key.split(':'), r = +rS, par = what === 'r';
    list.sort((p, q)=> p.a - q.a);
    let run = [];
    const flush = ()=>{
      if(!run.length) return;
      const a0 = run[0].a, len = run.length, cells = run.map(p=> p.k).join('');
      const H_ = par ? WG.HP : WG.HM + 0.25;
      const o = { side, r, a0, cells, seed:walk.seed * 101 + r * 7 + a0 * 13, n:`${m.room}:${side}:${r}:${a0}` };
      if(side === 'n') caDeco(m, par ? 'parapetW' : 'battlement', a0, r + 1 - WG.D - H_ - 0.05, len, WG.D + H_ + 0.05, Object.assign(o, { z:r + 0.99 }));
      else if(side === 's') caDeco(m, par ? 'parapetW' : 'battlement', a0, r - H_ - 0.05, len, H_ + WG.D + WG.DROP + 0.07, Object.assign(o, { z:r + 0.5 }));
      else { const th = par ? WG.DPV : WG.DV, fx = side === 'w' ? r + 1 - th : r;
        caDeco(m, par ? 'parapetW' : 'battlement', fx, a0 - H_ - 0.05, th, len + H_ + 0.05, Object.assign(o, { z:a0 + len - 0.01 })); }
      run = [];
    };
    list.forEach(p=>{ if(run.length && (p.a !== run[run.length - 1].a + 1 || p.a % 4 === 0)) flush(); run.push(p); });
    flush();
  });
  /* what stands on them, and what hangs from them */
  if(kind === 'wall'){
    const sp = m.tags.sp, A = (a, b)=> sp.across ? [a, b] : [b, a];
    const bs = walk.cell.get((sp.across ? sp.crenel * W + 0 : 0 * W + sp.crenel)).side;
    const ps = walk.cell.get((sp.across ? sp.parapet * W + 0 : 0 * W + sp.parapet)).side;
    [6, 18, 30, 42, 54].forEach((a, i)=>{
      if(ps === 's') caDeco(m, 'wbanner', a + 0.08, sp.parapet - WG.HP + WG.D - 0.1, 0.84, 1.75, { z:sp.parapet + 0.6, n:i });            // down the parapet's face, over the castle
      else if(bs === 's' && caAt(m, a, sp.crenel) === T.CRENEL) caDeco(m, 'wbanner', a + 0.12, sp.crenel - WG.HM + WG.D - 0.1, 0.76, 1.75, { z:sp.crenel + 0.6, n:i });   // down the battlements' face, over the jungle
      else if(!sp.across){ const [x, y] = A(a, sp.parapet); caDeco(m, 'pennant', (ps === 'w' ? x + 1 - WG.DPV / 2 : x + WG.DPV / 2) - 0.1, y + 0.5 - WG.HP - 1.2, 0.9, 1.2, { z:Math.floor(y / 4) * 4 + 4 - 0.005, n:i }); }
    });
    [12, 24, 36, 48, 60].forEach(a=>{
      const [x, y] = A(a, sp.parapet);
      if(ps === 's') caDeco(m, 'brazier', x + 0.2, y - WG.HP + WG.D * 0.55 - 0.9, 0.6, 0.9, { z:y + 0.55 });
      else if(ps === 'n') caDeco(m, 'brazier', x + 0.2, y + 1 - WG.D * 0.45 - WG.HP - 0.9, 0.6, 0.9, { z:y + 0.995 });
      else { const cx = ps === 'w' ? x + 1 - WG.DPV / 2 : x + WG.DPV / 2; caDeco(m, 'brazier', cx - 0.3, y + 0.5 - WG.HP - 0.9, 0.6, 0.9, { z:Math.floor(y / 4) * 4 + 4 - 0.005 }); }
    });
  } else {
    const c = id, R = CA_RAMP[c];
    /* the flag on the outer corner, standing on its great merlon */
    const fx = c[1] === 'w' ? 2 : 11, fy = c[0] === 'n' ? 2 : 11;
    const footY = (c[0] === 'n' ? fy + 1 - WG.D : fy) - (WG.HM + 0.08) + WG.D / 2;
    caDeco(m, 'flagpole', fx, footY - 2.25, 1.7, 2.3, { z:fy + (c[0] === 'n' ? 0.995 : 0.6) });
    /* past each arch, the walk going on */
    Object.keys(R.walls).forEach(s=>{
      const o = s === 'e' ? { x0:12, y0:6, x1:14, y1:8, dir:'e' } : s === 'w' ? { x0:0, y0:6, x1:2, y1:8, dir:'w' } : s === 'n' ? { x0:6, y0:0, x1:8, y1:2, dir:'n' } : { x0:6, y0:12, x1:8, y1:14, dir:'s' };
      caDeco(m, 'wallStub', o.x0 - 0.5, o.y0 - 0.8, o.x1 - o.x0 + 1, o.y1 - o.y0 + 1.6, { o, z:s === 's' ? 13 : s === 'n' ? 1.5 : 7.5, n:m.room + ':' + s });
    });
  }
  m.deco.sort((a, b)=> a.z - b.z);
  return m;
}

/* ============================================================
   THE RECORDS: a sleeve for each, its own picture; the disc inside
   Drawn on a square of 100 (scaled to whatever size it is wanted at).
   ============================================================ */
function REC_KEYS(){ return (typeof REC_LIST !== 'undefined' ? REC_LIST.map(r=> r.key) : ['region']); }
const LABEL = { region:'#f2c23a', region2:'#3f9d5a', region3:'#e8862a', region4:'#3c6fc4', region5:'#c8343a', region6:'#9a6be0',
  zone_sacred_grove:'#e8c860', zone_rocky_caverns:'#5fc8e0', zone_volcanic_caldera:'#ff5a2a', zone_geothermal_plant:'#4ab0a0', zone_band_concert:'#f07aa6',
  zone_catacombs:'#8a8aa8', zone_jungle:'#6fbf4a', battle_start:'#e8414f', battle_wild:'#7fbf4a', battle_boss:'#b8862e', battle_legendary:'#f4dc84',
  battle_padrino:'#3a3a48', battle_padrino_final:'#ff7a2a', battle_region6:'#5aff8a', battle_region6_future:'#ff5fa8', battle_region6_past:'#c9a46a' };
const C_ = { sky:(g, a, b, y0, y1)=>{ g.fillStyle = lin(g, 0, y0 || 0, 0, y1 || 100, [[0, a], [1, b]]); g.fillRect(0, y0 || 0, 100, (y1 || 100) - (y0 || 0)); } };
function hill(g, y, amp, col, seed, freq){
  g.fillStyle = col; g.beginPath(); g.moveTo(0, 100); g.lineTo(0, y);
  for(let x = 0; x <= 100; x += 4) g.lineTo(x, y - amp * (0.5 + 0.5 * Math.sin(x * (freq || 0.06) + seed)) - amp * 0.3 * Math.sin(x * 0.17 + seed * 2));
  g.lineTo(100, 100); g.closePath(); g.fill();
}
function stars(g, n, seed, col, y1){ const R = rng(seed); for(let i = 0; i < n; i++){ const r = R() * 0.9 + 0.2; circ(g, R() * 100, R() * (y1 || 100), r, col || `rgba(255,255,255,${0.4 + R() * 0.6})`); } }
function star(g, x, y, r, col, pts){ g.fillStyle = col; g.beginPath(); for(let i = 0; i < (pts || 5) * 2; i++){ const a = i / ((pts || 5) * 2) * TAU - Math.PI / 2, q = i % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); }
function rays(g, x, y, n, r, col, a0){ g.fillStyle = col; for(let i = 0; i < n; i++){ const a = (a0 || 0) + i / n * TAU; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, a, a + Math.PI / n); g.closePath(); g.fill(); } }
function pine(g, x, y, h, col){ g.fillStyle = col; for(let i = 0; i < 3; i++){ const yy = y - h * (0.3 + i * 0.25), ww = h * (0.32 - i * 0.07); g.beginPath(); g.moveTo(x, yy - h * 0.3); g.lineTo(x + ww, yy + h * 0.08); g.lineTo(x - ww, yy + h * 0.08); g.closePath(); g.fill(); } g.fillRect(x - h * 0.03, y - h * 0.25, h * 0.06, h * 0.25); }
function caption(g, t, col, bg){
  g.font = '900 7px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
  const w = g.measureText(t).width + 6;
  if(bg){ g.fillStyle = bg; rr(g, 4, 88, w, 9, 2); g.fill(); }
  g.fillStyle = col; g.fillText(t, 7, 92.8);
}
const COVERS = {
  /* Riverside Meadow: morning, a river winding through the meadow, flowers, the sun */
  region(g){
    C_.sky(g, '#7cc4f0', '#fdf0c4', 0, 60);
    g.fillStyle = rad(g, 74, 22, 0, 26, [[0, 'rgba(255,250,200,.9)'], [1, 'rgba(255,250,200,0)']]); g.fillRect(40, 0, 60, 60); circ(g, 74, 22, 9, '#fff6c8');
    [[18, 18], [40, 12], [30, 26]].forEach(([x, y])=>{ ell(g, x, y, 9, 3, 'rgba(255,255,255,.85)'); ell(g, x + 5, y - 2, 6, 3, 'rgba(255,255,255,.85)'); });
    hill(g, 52, 6, '#a6d27e', 1, 0.05); hill(g, 60, 6, '#79b85a', 3, 0.07);
    g.fillStyle = '#5fa8dc'; g.beginPath(); g.moveTo(47, 56); g.bezierCurveTo(56, 64, 30, 72, 38, 82); g.bezierCurveTo(44, 90, 70, 92, 66, 100); g.lineTo(96, 100); g.bezierCurveTo(92, 88, 62, 86, 56, 78); g.bezierCurveTo(50, 70, 66, 62, 51, 56); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.8; [[44, 76, 52, 75], [60, 88, 70, 87], [50, 64, 55, 63]].forEach(([a, b, c, d])=>{ g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
    [[14, 50, 9], [86, 52, 11], [24, 54, 7]].forEach(([x, y, h])=>{ g.fillStyle = '#6b4a2a'; g.fillRect(x - 0.8, y - h * 0.3, 1.6, h * 0.3); circ(g, x, y - h * 0.55, h * 0.4, '#3f8a3a'); circ(g, x - h * 0.15, y - h * 0.65, h * 0.25, '#56a24a'); });
    const R = rng(11); for(let i = 0; i < 40; i++){ const x = R() * 100, y = 66 + R() * 34; if(x > 30 && x < 75 && y < 90) continue; circ(g, x, y, 0.9 + R() * 0.8, ['#ffffff', '#f5c947', '#f07aa6', '#e8414f'][i % 4]); }
    g.strokeStyle = '#3a3a48'; g.lineWidth = 0.7; [[60, 30], [66, 34]].forEach(([x, y])=>{ g.beginPath(); g.moveTo(x - 2, y - 1); g.quadraticCurveTo(x - 1, y - 2, x, y); g.quadraticCurveTo(x + 1, y - 2, x + 2, y - 1); g.stroke(); });
    caption(g, 'REGION 1', '#2a4a1a', 'rgba(255,255,255,.75)');
  },
  /* Emerald March: the old woods — great trunks, light falling between, a rune stone, fireflies */
  region2(g){
    C_.sky(g, '#2f5a3a', '#0f2418');
    g.fillStyle = 'rgba(220,255,180,.16)'; [[30, 10], [55, 14], [72, 8]].forEach(([x, w])=>{ g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w + 18, 100); g.lineTo(x + 10, 100); g.closePath(); g.fill(); });
    [[8, 14, '#2a1c10'], [88, 16, '#24180c'], [24, 8, '#3a2a18'], [70, 9, '#33241a']].forEach(([x, w, c])=>{ g.fillStyle = c; g.fillRect(x - w / 2, 0, w, 100); g.fillStyle = 'rgba(110,150,60,.45)'; g.fillRect(x - w / 2, 40, w * 0.4, 60); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + w * 0.2, 0, w * 0.3, 100); g.fillStyle = c; g.beginPath(); g.moveTo(x - w / 2, 100); g.quadraticCurveTo(x - w, 96, x - w * 1.3, 100); g.fill(); g.beginPath(); g.moveTo(x + w / 2, 100); g.quadraticCurveTo(x + w, 95, x + w * 1.3, 100); g.fill(); });
    for(let i = 0; i < 6; i++) ell(g, 10 + i * 18, 8, 16, 9, i % 2 ? '#1f4a28' : '#2a5a30');
    hill(g, 88, 4, '#1f3a1a', 2);
    g.fillStyle = '#8a9a90'; g.beginPath(); g.moveTo(40, 92); g.lineTo(42, 62); g.quadraticCurveTo(50, 56, 58, 62); g.lineTo(60, 92); g.closePath(); g.fill();
    g.fillStyle = 'rgba(90,140,60,.6)'; g.beginPath(); g.ellipse(46, 64, 5, 3, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(56, 88, 6, 3, 0, 0, TAU); g.fill();
    g.strokeStyle = '#a6ff9a'; g.lineWidth = 1.2; g.shadowColor = '#a6ff9a'; g.shadowBlur = 4;
    g.beginPath(); g.moveTo(50, 66); g.lineTo(50, 84); g.moveTo(45, 72); g.lineTo(55, 72); g.moveTo(46, 80); g.lineTo(50, 76); g.lineTo(54, 80); g.stroke(); g.shadowBlur = 0;
    const R = rng(22); for(let i = 0; i < 16; i++){ const x = R() * 100, y = 20 + R() * 70; circ(g, x, y, 2.5, 'rgba(220,255,120,.18)'); circ(g, x, y, 0.8, '#eaff9a'); }
    caption(g, 'REGION 2', '#dfffd0', 'rgba(0,0,0,.35)');
  },
  /* Port Akrotiri: sunset over the sea, the volcano smoking, white houses on the cliff */
  region3(g){
    C_.sky(g, '#4a2a6a', '#ff9a4a', 0, 62);
    circ(g, 62, 56, 12, '#ffd36a'); g.fillStyle = 'rgba(255,240,180,.5)'; g.fillRect(50, 55, 24, 2);
    g.fillStyle = '#3a2a3a'; g.beginPath(); g.moveTo(40, 62); g.lineTo(62, 26); g.lineTo(70, 26); g.lineTo(96, 62); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,120,40,.85)'; g.beginPath(); g.moveTo(62, 26); g.lineTo(70, 26); g.lineTo(68, 30); g.lineTo(64, 30); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,110,40,.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(66, 30); g.quadraticCurveTo(68, 40, 63, 48); g.stroke();
    for(let i = 0; i < 6; i++) circ(g, 66 + Math.sin(i) * 4 - i * 2, 22 - i * 4, 3 + i * 1.3, `rgba(90,80,100,${0.55 - i * 0.07})`);
    C_.sky(g, '#2a5a9a', '#173a6a', 62, 100);
    for(let i = 0; i < 10; i++){ g.fillStyle = `rgba(255,200,120,${0.6 - i * 0.05})`; g.fillRect(56 - i * 0.5, 64 + i * 3.5, 12 + i, 1.2); }
    g.fillStyle = '#c9b49a'; g.beginPath(); g.moveTo(0, 100); g.lineTo(0, 46); g.quadraticCurveTo(18, 44, 36, 60); g.lineTo(42, 100); g.closePath(); g.fill();
    [[4, 50, 8, 7], [13, 47, 9, 8], [6, 58, 10, 7], [18, 56, 8, 6], [26, 62, 9, 7], [10, 66, 9, 7]].forEach(([x, y, w, h], i)=>{ g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h); g.fillStyle = '#2a4a8e'; g.fillRect(x + w * 0.35, y + h * 0.35, w * 0.3, h * 0.65); if(i % 2 === 0){ g.fillStyle = '#2f6ac0'; g.beginPath(); g.arc(x + w / 2, y, w * 0.38, Math.PI, 0); g.fill(); } });
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(74, 82); g.lineTo(80, 70); g.lineTo(80, 82); g.closePath(); g.fill(); g.fillStyle = '#7a4a2a'; g.fillRect(70, 82, 14, 2.5);
    caption(g, 'REGION 3', '#ffffff', 'rgba(0,0,0,.3)');
  },
  /* The North Sea: a ship on a grey sea — and an eye beneath it */
  region4(g){
    C_.sky(g, '#8a9ab0', '#c9d2dc', 0, 52);
    [[20, 14, 14], [56, 10, 18], [84, 20, 12]].forEach(([x, y, r])=>{ ell(g, x, y, r, r * 0.4, 'rgba(110,120,140,.7)'); ell(g, x + r * 0.4, y - 3, r * 0.6, r * 0.35, 'rgba(140,150,170,.7)'); });
    C_.sky(g, '#3a5a7a', '#0a1a2e', 52, 100);
    g.fillStyle = 'rgba(255,255,255,.35)'; for(let i = 0; i < 8; i++){ const y = 54 + i * 2.4; g.beginPath(); for(let x = 0; x <= 100; x += 5) g.lineTo(x, y + Math.sin(x * 0.3 + i) * 0.8); g.lineTo(100, y + 0.6); g.lineTo(0, y + 0.6); g.closePath(); g.fill(); }
    /* the ship */
    g.fillStyle = '#5a3418'; g.beginPath(); g.moveTo(30, 50); g.lineTo(70, 50); g.lineTo(64, 58); g.lineTo(36, 58); g.closePath(); g.fill();
    g.fillStyle = '#3a2010'; g.fillRect(30, 50, 40, 1.5);
    g.fillStyle = '#3a2a1a'; g.fillRect(43, 20, 1.4, 30); g.fillRect(56, 26, 1.2, 24);
    g.fillStyle = '#f4efe2'; g.beginPath(); g.moveTo(44.5, 21); g.quadraticCurveTo(54, 30, 44.5, 46); g.closePath(); g.fill(); g.beginPath(); g.moveTo(57.3, 27); g.quadraticCurveTo(65, 35, 57.3, 47); g.closePath(); g.fill();
    g.fillStyle = '#c8343a'; g.beginPath(); g.moveTo(43.7, 20); g.lineTo(49, 18); g.lineTo(43.7, 16); g.closePath(); g.fill();
    /* beneath: the eye */
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(50, 84, 30, 10, 0, 0, TAU); g.fill();
    g.fillStyle = '#e8c547'; g.beginPath(); g.ellipse(50, 84, 14, 7, 0, 0, TAU); g.fill();
    g.fillStyle = '#1a1a10'; g.beginPath(); g.ellipse(50, 84, 2.4, 6.2, 0, 0, TAU); g.fill();
    circ(g, 46, 81, 1.3, 'rgba(255,255,255,.8)');
    g.strokeStyle = 'rgba(20,40,60,.8)'; g.lineWidth = 3; g.lineCap = 'round';
    [[8, 100, 16, 76, 26, 92], [92, 100, 86, 74, 76, 92]].forEach(([a, b, c, d, e, f])=>{ g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(c, d, e, f); g.stroke(); });
    g.lineCap = 'butt';
    caption(g, 'REGION 4', '#ffffff', 'rgba(0,0,0,.35)');
  },
  /* Cosa Nostia: the harbour town by night, its lit windows; under the water, the catacombs */
  region5(g){
    C_.sky(g, '#0d1230', '#2a2a5a', 0, 60);
    stars(g, 30, 55, null, 50);
    g.fillStyle = rad(g, 76, 18, 0, 18, [[0, 'rgba(255,250,220,.5)'], [1, 'rgba(255,250,220,0)']]); g.fillRect(56, 0, 40, 40); circ(g, 76, 18, 8, '#fff6dc'); circ(g, 73, 16, 1.5, 'rgba(200,200,180,.6)'); circ(g, 78, 21, 1.1, 'rgba(200,200,180,.6)');
    const R = rng(55);
    [[0, 34, 12], [11, 28, 10], [20, 38, 12], [31, 24, 9], [39, 32, 11], [49, 40, 10], [58, 30, 12], [69, 36, 10], [78, 42, 12], [89, 34, 11]].forEach(([x, y, w])=>{
      g.fillStyle = '#1c1a2e'; g.fillRect(x, y + 10, w, 60 - y - 10); g.beginPath(); g.moveTo(x - 1, y + 10); g.lineTo(x + w / 2, y + 4); g.lineTo(x + w + 1, y + 10); g.closePath(); g.fill();
      for(let i = 0; i < 4; i++) if(R() < 0.6){ g.fillStyle = R() < 0.8 ? '#ffd36a' : '#ff9a5a'; g.fillRect(x + 2 + (i % 2) * (w - 6), y + 14 + Math.floor(i / 2) * 9, 2.4, 3); }
    });
    g.fillStyle = '#1c1a2e'; g.fillRect(70, 18, 3, 16);
    C_.sky(g, '#1a2a4a', '#0a1020', 60, 100);
    for(let i = 0; i < 12; i++){ g.fillStyle = 'rgba(255,211,106,.35)'; g.fillRect(R() * 100, 61 + R() * 14, 3 + R() * 4, 0.8); }
    g.fillStyle = 'rgba(255,246,220,.3)'; for(let i = 0; i < 6; i++) g.fillRect(72 + Math.sin(i) * 2, 62 + i * 2.2, 8 - i, 0.8);
    g.fillStyle = '#2a2638'; g.fillRect(0, 78, 100, 22);
    for(let i = 0; i < 4; i++){ const x = 6 + i * 24; g.fillStyle = '#0e0c16'; g.beginPath(); g.moveTo(x, 100); g.lineTo(x, 86); g.arc(x + 8, 86, 8, Math.PI, 0); g.lineTo(x + 16, 100); g.closePath(); g.fill(); circ(g, x + 8, 92, 3, 'rgba(255,190,100,.3)'); g.fillStyle = '#f4ecd6'; g.fillRect(x + 7.4, 91, 1.2, 3); circ(g, x + 8, 90.2, 0.8, '#ffd36a'); }
    caption(g, 'REGION 5', '#ffd36a', 'rgba(0,0,0,.45)');
  },
  /* The Time Rift: a tear of light across the stars, a clock broken loose, the crescent moon and the evening star */
  region6(g){
    C_.sky(g, '#1a0f3a', '#4a2a7a');
    g.fillStyle = rad(g, 50, 55, 0, 60, [[0, 'rgba(255,120,220,.35)'], [1, 'rgba(255,120,220,0)']]); g.fillRect(0, 0, 100, 100);
    stars(g, 50, 66);
    g.fillStyle = '#fff0ff'; g.shadowColor = '#ff7ae0'; g.shadowBlur = 8;
    g.beginPath(); g.moveTo(20, 96); g.lineTo(38, 66); g.lineTo(33, 62); g.lineTo(54, 38); g.lineTo(49, 35); g.lineTo(80, 6); g.lineTo(58, 40); g.lineTo(63, 43); g.lineTo(44, 68); g.lineTo(49, 71); g.closePath(); g.fill(); g.shadowBlur = 0;
    g.save(); g.translate(26, 30); g.rotate(-0.3);
    circ(g, 0, 0, 13, 'rgba(244,220,132,.9)'); circ(g, 0, 0, 11, '#fbf4dc'); g.strokeStyle = '#4a2a7a'; g.lineWidth = 0.8;
    for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 8.5, Math.sin(a) * 8.5); g.lineTo(Math.cos(a) * 10.5, Math.sin(a) * 10.5); g.stroke(); }
    g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(4, -6); g.moveTo(0, 0); g.lineTo(-6, 2); g.stroke();
    g.fillStyle = '#1a0f3a'; g.beginPath(); g.moveTo(6, 13); g.lineTo(9, 6); g.lineTo(14, 8); g.lineTo(13, 14); g.closePath(); g.fill();
    g.restore();
    circ(g, 78, 72, 9, '#f6efd2'); circ(g, 82, 69, 8, '#2e1c58');
    star(g, 88, 46, 4, '#fff6c8', 4); circ(g, 88, 46, 6, 'rgba(255,246,200,.2)');
    caption(g, 'REGION 6', '#ffd0f4', 'rgba(0,0,0,.35)');
  },
  /* The Sacred Grove: gold light through great trees, a stone shrine, a glowing leaf */
  zone_sacred_grove(g){
    C_.sky(g, '#f6e3a0', '#6f9a45');
    g.fillStyle = 'rgba(255,255,220,.35)'; for(let i = 0; i < 5; i++){ g.beginPath(); g.moveTo(40 + i * 6, 0); g.lineTo(44 + i * 6, 0); g.lineTo(56 + i * 9, 100); g.lineTo(46 + i * 9, 100); g.closePath(); g.fill(); }
    [[6, 22, '#5a3a20'], [94, 24, '#4a2e18']].forEach(([x, w, c])=>{ g.fillStyle = c; g.beginPath(); g.moveTo(x - w / 2, 100); g.quadraticCurveTo(x - w * 0.3, 50, x - w * 0.2, 0); g.lineTo(x + w * 0.2, 0); g.quadraticCurveTo(x + w * 0.3, 50, x + w / 2, 100); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x, 0, w * 0.2, 100); });
    for(let i = 0; i < 7; i++) ell(g, i * 16, 4, 16, 10, i % 2 ? '#3f7d3a' : '#4f9447');
    hill(g, 86, 3, '#4f8a3a', 4);
    g.fillStyle = '#b8b0a0'; g.fillRect(36, 72, 28, 4); g.fillRect(40, 58, 4, 14); g.fillRect(56, 58, 4, 14); g.fillRect(34, 54, 32, 4); g.fillStyle = '#9a9286'; g.fillRect(32, 52, 36, 2.5);
    g.fillStyle = rad(g, 50, 64, 0, 14, [[0, 'rgba(200,255,140,.8)'], [1, 'rgba(200,255,140,0)']]); g.fillRect(36, 50, 28, 28);
    g.fillStyle = '#b8ff6a'; g.beginPath(); g.moveTo(50, 58); g.quadraticCurveTo(57, 63, 50, 70); g.quadraticCurveTo(43, 63, 50, 58); g.fill(); g.strokeStyle = '#5a9a2a'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(50, 59); g.lineTo(50, 70); g.stroke();
    const R = rng(77); for(let i = 0; i < 14; i++){ g.fillStyle = 'rgba(255,200,220,.85)'; g.save(); g.translate(R() * 100, R() * 90); g.rotate(R() * 3); g.beginPath(); g.ellipse(0, 0, 1.6, 0.9, 0, 0, TAU); g.fill(); g.restore(); }
    caption(g, 'THE SACRED GROVE', '#2a4a1a', 'rgba(255,255,255,.7)');
  },
  /* The Rocky Caverns: stalactites, crystals glowing blue and violet, a lantern */
  zone_rocky_caverns(g){
    C_.sky(g, '#2a2030', '#120c16');
    g.fillStyle = '#3a2e3a'; for(let i = 0; i < 9; i++){ const x = i * 12 + 2, h = 10 + (i * 37 % 20); g.beginPath(); g.moveTo(x - 5, 0); g.lineTo(x + 5, 0); g.lineTo(x, h); g.closePath(); g.fill(); }
    g.fillStyle = '#2a2028'; for(let i = 0; i < 6; i++){ const x = i * 18 + 6, h = 8 + (i * 23 % 14); g.beginPath(); g.moveTo(x - 6, 100); g.lineTo(x + 6, 100); g.lineTo(x, 100 - h); g.closePath(); g.fill(); }
    const crystal = (x, y, h, a, c, c2)=>{ g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = rad(g, 0, -h / 2, 0, h, [[0, c + '66'], [1, c + '00']]); g.fillRect(-h, -h * 1.5, h * 2, h * 2); g.fillStyle = c; g.beginPath(); g.moveTo(-h * 0.18, 0); g.lineTo(-h * 0.2, -h * 0.75); g.lineTo(0, -h); g.lineTo(h * 0.2, -h * 0.75); g.lineTo(h * 0.18, 0); g.closePath(); g.fill(); g.fillStyle = c2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -h); g.lineTo(h * 0.2, -h * 0.75); g.lineTo(h * 0.18, 0); g.closePath(); g.fill(); g.restore(); };
    crystal(30, 86, 24, -0.2, '#5fd8ff', '#2a9ad8'); crystal(38, 88, 16, 0.25, '#7ae8ff', '#3ab0e0'); crystal(70, 84, 28, 0.15, '#b07aff', '#7a4ad8'); crystal(62, 88, 14, -0.35, '#d0a0ff', '#9a6ae0'); crystal(84, 90, 12, 0.3, '#5fd8ff', '#2a9ad8');
    g.strokeStyle = '#6b5a4a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(50, 0); g.lineTo(50, 34); g.stroke();
    g.fillStyle = rad(g, 50, 40, 0, 16, [[0, 'rgba(255,200,110,.6)'], [1, 'rgba(255,200,110,0)']]); g.fillRect(30, 20, 40, 40);
    g.fillStyle = '#4a3a2a'; g.fillRect(46, 34, 8, 2); g.fillRect(47, 44, 6, 2); g.fillStyle = 'rgba(255,220,140,.9)'; g.fillRect(47, 36, 6, 8);
    stars(g, 18, 88, 'rgba(160,220,255,.6)');
    caption(g, 'THE ROCKY CAVERNS', '#cfeaff', 'rgba(0,0,0,.4)');
  },
  /* The Volcanic Caldera: the mountain blowing, rivers of lava, embers on the wind */
  zone_volcanic_caldera(g){
    C_.sky(g, '#3a0a0a', '#c83a1a');
    g.fillStyle = rad(g, 50, 30, 0, 40, [[0, 'rgba(255,200,80,.8)'], [1, 'rgba(255,120,40,0)']]); g.fillRect(0, 0, 100, 70);
    for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + (i - 4.5) * 0.18; g.strokeStyle = `rgba(255,${150 + i * 8},60,.8)`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(50, 34); g.quadraticCurveTo(50 + Math.cos(a) * 20, 34 + Math.sin(a) * 30, 50 + Math.cos(a) * 34, 34 + Math.sin(a) * 18 + 14); g.stroke(); }
    g.fillStyle = '#2a1414'; g.beginPath(); g.moveTo(4, 80); g.lineTo(42, 34); g.lineTo(58, 34); g.lineTo(96, 80); g.closePath(); g.fill();
    g.fillStyle = '#ff6a2a'; g.beginPath(); g.moveTo(42, 34); g.lineTo(58, 34); g.lineTo(55, 38); g.lineTo(45, 38); g.closePath(); g.fill();
    g.strokeStyle = '#ff8a3a'; g.lineWidth = 2; g.lineCap = 'round'; [[46, 38, 38, 56, 28, 78], [54, 38, 60, 54, 72, 78]].forEach(([a, b, c, d, e, f])=>{ g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(c, d, e, f); g.stroke(); }); g.lineCap = 'butt';
    g.fillStyle = '#ff5a1a'; g.fillRect(0, 80, 100, 20);
    g.fillStyle = '#ffb347'; for(let i = 0; i < 8; i++){ g.beginPath(); g.ellipse(8 + i * 12, 86 + (i % 3) * 4, 5, 1.4, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#2a1414'; for(let i = 0; i < 5; i++){ g.beginPath(); g.ellipse(12 + i * 20, 82 + (i % 2) * 10, 6, 2.5, 0, 0, TAU); g.fill(); }
    const R = rng(91); for(let i = 0; i < 20; i++) circ(g, R() * 100, R() * 70, 0.6 + R() * 0.8, `rgba(255,${180 + R() * 70},90,.9)`);
    caption(g, 'THE VOLCANIC CALDERA', '#ffe0c0', 'rgba(0,0,0,.4)');
  },
  /* The Geothermal Plant: pipes, a gauge, a valve wheel, steam */
  zone_geothermal_plant(g){
    C_.sky(g, '#2a4a4a', '#16282a');
    g.fillStyle = 'rgba(255,255,255,.06)'; for(let y = 0; y < 100; y += 10) g.fillRect(0, y, 100, 0.6);
    const pipe = (x0, y0, x1, y1, w, c)=>{ g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = w * 0.25; g.beginPath(); g.moveTo(x0, y0 - w * 0.2); g.lineTo(x1, y1 - w * 0.2); g.stroke(); g.lineCap = 'butt'; };
    pipe(-5, 70, 105, 70, 9, '#8a5a32'); pipe(20, -5, 20, 105, 7, '#5a8a8a'); pipe(80, -5, 80, 70, 8, '#b87a3a'); pipe(20, 30, 80, 30, 6, '#5a8a8a');
    [[20, 70], [80, 70], [20, 30], [80, 30]].forEach(([x, y])=>{ g.fillStyle = '#c9a24a'; g.fillRect(x - 6, y - 6, 12, 12); g.fillStyle = '#e8c870'; g.fillRect(x - 6, y - 6, 12, 2); [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([a, b])=> circ(g, x + a, y + b, 0.9, '#7a5a1a')); });
    circ(g, 50, 52, 14, '#c9a24a'); circ(g, 50, 52, 12, '#f4f1ea');
    g.strokeStyle = '#3a3a48'; g.lineWidth = 0.6; for(let i = 0; i <= 8; i++){ const a = Math.PI * 0.8 + i / 8 * Math.PI * 1.4; g.beginPath(); g.moveTo(50 + Math.cos(a) * 9, 52 + Math.sin(a) * 9); g.lineTo(50 + Math.cos(a) * 11, 52 + Math.sin(a) * 11); g.stroke(); }
    g.strokeStyle = '#c8343a'; g.lineWidth = 0.8; g.beginPath(); g.arc(50, 52, 10, Math.PI * 1.9, Math.PI * 2.2); g.stroke();
    g.strokeStyle = '#c8343a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(50, 52); g.lineTo(58, 46); g.stroke(); circ(g, 50, 52, 1.6, '#3a3a48');
    g.strokeStyle = '#c8343a'; g.lineWidth = 2.4; g.beginPath(); g.arc(80, 86, 8, 0, TAU); g.stroke(); g.lineWidth = 1.4; for(let i = 0; i < 3; i++){ const a = i / 3 * Math.PI; g.beginPath(); g.moveTo(80 + Math.cos(a) * 8, 86 + Math.sin(a) * 8); g.lineTo(80 - Math.cos(a) * 8, 86 - Math.sin(a) * 8); g.stroke(); } circ(g, 80, 86, 2, '#c8343a');
    for(let i = 0; i < 8; i++) circ(g, 32 + i * 3 + Math.sin(i) * 3, 64 - i * 6, 4 + i * 0.8, `rgba(240,250,250,${0.6 - i * 0.06})`);
    caption(g, 'THE GEOTHERMAL PLANT', '#d8f0f0', 'rgba(0,0,0,.4)');
  },
  /* The Band Concert: spotlights, a guitar and drums on the stage, hands in the air */
  zone_band_concert(g){
    C_.sky(g, '#2a1040', '#6a2a8a');
    [[15, '#ff5fa8'], [50, '#5fd8ff'], [85, '#ffe66a']].forEach(([x, c])=>{ g.fillStyle = c + '55'; g.beginPath(); g.moveTo(x - 2, 0); g.lineTo(x + 2, 0); g.lineTo(x + 22, 76); g.lineTo(x - 22, 76); g.closePath(); g.fill(); circ(g, x, 2, 3, c); });
    g.fillStyle = '#1a0a24'; g.fillRect(0, 70, 100, 8); g.fillStyle = '#c9a24a'; g.fillRect(0, 70, 100, 1.2);
    /* the drums */
    ell(g, 50, 62, 9, 8, '#c8343a'); ell(g, 50, 62, 6, 5.5, '#f4f1ea'); ell(g, 38, 58, 4, 2, '#e8c547'); ell(g, 62, 56, 4.5, 2, '#e8c547'); g.fillStyle = '#9a9aa8'; g.fillRect(37.6, 58, 0.8, 12); g.fillRect(61.6, 56, 0.8, 14);
    /* the guitar, the microphone */
    g.save(); g.translate(22, 56); g.rotate(-0.6); ell(g, 0, 6, 6, 5, '#ff7a2a'); ell(g, 0, 0, 4.4, 3.8, '#ff7a2a'); circ(g, 0, 3, 1.6, '#2a1040'); g.fillStyle = '#5a3418'; g.fillRect(-0.9, -18, 1.8, 18); g.fillStyle = '#2a1a0a'; g.fillRect(-1.6, -21, 3.2, 4); g.restore();
    g.strokeStyle = '#c9ccd8'; g.lineWidth = 1; g.beginPath(); g.moveTo(80, 70); g.lineTo(80, 50); g.lineTo(74, 44); g.stroke(); circ(g, 73, 43, 2, '#3a3a48');
    g.fillStyle = '#ffffff'; g.font = '900 10px sans-serif'; g.textAlign = 'center'; [['♪', 30, 30], ['♫', 66, 24], ['♪', 84, 36]].forEach(([t, x, y])=> g.fillText(t, x, y));
    g.fillStyle = '#0e0616'; g.fillRect(0, 84, 100, 16);
    for(let i = 0; i < 9; i++){ const x = 6 + i * 11; circ(g, x, 86, 4, '#0e0616'); g.save(); g.translate(x + 3, 84); g.rotate(-0.3 + (i % 3) * 0.3); g.fillRect(-1, -10, 2, 10); circ(g, 0, -11, 1.8, '#0e0616'); g.restore(); }
    caption(g, 'THE BAND CONCERT', '#ffe66a', 'rgba(0,0,0,.45)');
  },
  /* The Catacombs: arches going on into the dark, candles in their niches, a little ghost */
  zone_catacombs(g){
    C_.sky(g, '#2a2a38', '#0e0e16');
    for(let i = 0; i < 5; i++){
      const f = 1 - i * 0.18, w = 80 * f, h = 84 * f, x = 50 - w / 2, y = 96 - h;
      g.fillStyle = mix('#5a5868', '#1a1a24', i / 5); g.beginPath(); g.moveTo(x, 100); g.lineTo(x, y + w / 2); g.arc(50, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, 100); g.lineTo(x + w - 6 * f, 100); g.lineTo(x + w - 6 * f, y + w / 2); g.arc(50, y + w / 2, w / 2 - 6 * f, 0, Math.PI, true); g.lineTo(x + 6 * f, 100); g.closePath(); g.fill();
      if(i < 3){ [x + 3 * f, x + w - 3 * f].forEach(cx=>{ g.fillStyle = 'rgba(255,190,100,.25)'; circ(g, cx, y + h * 0.55, 5 * f, 'rgba(255,190,100,.25)'); g.fillStyle = '#f4ecd6'; g.fillRect(cx - 0.8 * f, y + h * 0.55, 1.6 * f, 3 * f); circ(g, cx, y + h * 0.55 - 0.8 * f, 0.9 * f, '#ffd36a'); }); }
    }
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 92, 100, 8);
    g.fillStyle = 'rgba(240,244,255,.92)'; g.beginPath(); g.moveTo(42, 70); g.lineTo(42, 58); g.arc(50, 58, 8, Math.PI, 0); g.lineTo(58, 70); g.lineTo(55, 67); g.lineTo(52, 70); g.lineTo(50, 67); g.lineTo(47, 70); g.lineTo(44.5, 67); g.closePath(); g.fill();
    circ(g, 47, 57, 1.3, '#2a2a38'); circ(g, 53, 57, 1.3, '#2a2a38'); ell(g, 50, 62, 1.5, 2, '#2a2a38');
    g.fillStyle = 'rgba(240,244,255,.15)'; circ(g, 50, 60, 14, 'rgba(240,244,255,.12)');
    caption(g, 'THE CATACOMBS', '#d8d8f0', 'rgba(0,0,0,.4)');
  },
  /* The Time-Lost Jungle: huge leaves, a waterfall, an old temple with a clock carved on it */
  zone_jungle(g){
    C_.sky(g, '#a6e0c8', '#2a6a3a');
    g.fillStyle = '#5aa0c8'; g.fillRect(58, 10, 14, 66); g.fillStyle = 'rgba(255,255,255,.55)'; for(let i = 0; i < 5; i++) g.fillRect(59 + i * 3, 10, 1, 66); ell(g, 65, 78, 14, 4, 'rgba(255,255,255,.7)');
    g.fillStyle = '#7a8a6a'; g.beginPath(); g.moveTo(14, 82); g.lineTo(20, 46); g.lineTo(46, 46); g.lineTo(52, 82); g.closePath(); g.fill();
    g.fillStyle = '#6a7a5a'; g.fillRect(18, 40, 30, 7); g.fillRect(22, 34, 22, 7);
    circ(g, 33, 60, 8, '#8a9a7a'); g.strokeStyle = '#4a5a3a'; g.lineWidth = 1; g.beginPath(); g.arc(33, 60, 7, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(33, 60); g.lineTo(33, 55); g.moveTo(33, 60); g.lineTo(37, 62); g.stroke();
    g.fillStyle = '#2a1a10'; g.fillRect(29, 70, 8, 12);
    g.strokeStyle = '#3f7d3a'; g.lineWidth = 1.2; [[22, 40, 18, 70], [46, 40, 50, 64]].forEach(([a, b, c, d])=>{ g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 + 4, (b + d) / 2, c, d); g.stroke(); });
    const leaf = (x, y, r, a, c)=>{ g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(r * 0.5, -r * 0.4, r, 0); g.quadraticCurveTo(r * 0.5, r * 0.4, 0, 0); g.fill(); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(r, 0); g.stroke(); g.restore(); };
    leaf(-4, 10, 40, 0.4, '#2f6a2a'); leaf(-4, 30, 34, 0.1, '#3f8a3a'); leaf(104, 6, 42, 2.6, '#2f6a2a'); leaf(104, 40, 30, 3.0, '#3f8a3a'); leaf(10, 104, 36, -0.9, '#2a5a24'); leaf(92, 104, 36, -2.2, '#2a5a24'); leaf(50, -4, 26, 1.4, '#3f8a3a');
    const R = rng(13); for(let i = 0; i < 10; i++){ const x = R() * 100, y = 30 + R() * 50; circ(g, x, y, 2, 'rgba(240,255,120,.2)'); circ(g, x, y, 0.7, '#f0ff9a'); }
    caption(g, 'THE TIME-LOST JUNGLE', '#ffffff', 'rgba(0,0,0,.35)');
  },
  /* Battle!: red against blue, a bolt between them */
  battle_start(g){
    g.fillStyle = '#d8343a'; g.beginPath(); g.moveTo(0, 0); g.lineTo(62, 0); g.lineTo(38, 100); g.lineTo(0, 100); g.closePath(); g.fill();
    g.fillStyle = '#2a5ab8'; g.beginPath(); g.moveTo(62, 0); g.lineTo(100, 0); g.lineTo(100, 100); g.lineTo(38, 100); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.5; for(let i = 0; i < 14; i++){ g.beginPath(); g.moveTo(50, 50); g.lineTo(50 + Math.cos(i / 14 * TAU) * 80, 50 + Math.sin(i / 14 * TAU) * 80); g.stroke(); }
    g.fillStyle = '#ffe14a'; g.strokeStyle = '#2a1a0a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(58, 4); g.lineTo(36, 52); g.lineTo(50, 52); g.lineTo(40, 96); g.lineTo(68, 40); g.lineTo(54, 40); g.lineTo(66, 4); g.closePath(); g.fill(); g.stroke();
    g.font = 'italic 900 22px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = '#2a1a0a';
    g.strokeText('V', 22, 30); g.fillStyle = '#ffffff'; g.fillText('V', 22, 30); g.strokeText('S', 80, 72); g.fillText('S', 80, 72);
    caption(g, 'BATTLE!', '#ffffff', 'rgba(0,0,0,.35)');
  },
  /* A Wild Battle: lines rushing, tall grass, two eyes in it */
  battle_wild(g){
    C_.sky(g, '#bfe86a', '#3f8a2a');
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.2; for(let i = 0; i < 24; i++){ const a = i / 24 * TAU; g.beginPath(); g.moveTo(50 + Math.cos(a) * 18, 46 + Math.sin(a) * 18); g.lineTo(50 + Math.cos(a) * 80, 46 + Math.sin(a) * 80); g.stroke(); }
    g.fillStyle = '#1f4a1a'; g.beginPath(); g.moveTo(0, 100); for(let x = 0; x <= 100; x += 5) g.lineTo(x, 52 + (x / 5 % 2 ? 0 : 10) + Math.sin(x) * 3); g.lineTo(100, 100); g.closePath(); g.fill();
    g.fillStyle = '#2a5a24'; g.beginPath(); g.moveTo(0, 100); for(let x = 2; x <= 102; x += 6) g.lineTo(x, 64 + (x / 6 % 2 ? 0 : 8)); g.lineTo(100, 100); g.closePath(); g.fill();
    [[38, 78], [60, 78]].forEach(([x, y])=>{ g.fillStyle = rad(g, x, y, 0, 8, [[0, 'rgba(255,240,100,.7)'], [1, 'rgba(255,240,100,0)']]); g.fillRect(x - 8, y - 8, 16, 16); g.fillStyle = '#ffe14a'; g.beginPath(); g.ellipse(x, y, 5, 3, x < 50 ? 0.25 : -0.25, 0, TAU); g.fill(); g.fillStyle = '#1a1a10'; g.beginPath(); g.ellipse(x, y, 1.2, 2.6, 0, 0, TAU); g.fill(); });
    g.fillStyle = '#ffffff'; g.strokeStyle = '#2a1a0a'; g.lineWidth = 2; g.font = '900 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('!', 50, 30); g.fillText('!', 50, 30);
    caption(g, 'A WILD BATTLE', '#ffffff', 'rgba(0,0,0,.35)');
  },
  /* Boss Battle: a crown, burning */
  battle_boss(g){
    C_.sky(g, '#1a0606', '#5a0e0e');
    rays(g, 50, 46, 16, 80, 'rgba(255,90,40,.18)', 0.1);
    for(let i = 0; i < 12; i++){ const x = i * 9; g.fillStyle = i % 2 ? '#ff7a2a' : '#ffb347'; g.beginPath(); g.moveTo(x - 4, 100); g.quadraticCurveTo(x - 6, 82, x + 2, 70 - (i % 3) * 6); g.quadraticCurveTo(x + 4, 84, x + 8, 100); g.closePath(); g.fill(); }
    g.fillStyle = '#d9a83a'; g.strokeStyle = '#5a3a0a'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(24, 64); g.lineTo(20, 28); g.lineTo(36, 44); g.lineTo(50, 20); g.lineTo(64, 44); g.lineTo(80, 28); g.lineTo(76, 64); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f4dc84'; g.fillRect(24, 58, 52, 7); g.strokeRect(24, 58, 52, 7);
    [[20, 28], [50, 20], [80, 28]].forEach(([x, y])=> circ(g, x, y, 3, '#f4f4ff'));
    [[36, 52, '#c8343a'], [50, 50, '#3c6fc4'], [64, 52, '#3f9d5a']].forEach(([x, y, c])=>{ circ(g, x, y, 3.6, c); circ(g, x - 1, y - 1, 1, 'rgba(255,255,255,.7)'); });
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(28, 60); g.lineTo(26, 36); g.lineTo(30, 40); g.closePath(); g.fill();
    caption(g, 'BOSS BATTLE', '#ffd36a', 'rgba(0,0,0,.45)');
  },
  /* Legendary Battle: a sphere of light, wings of light, the deep sky */
  battle_legendary(g){
    C_.sky(g, '#0a1440', '#1a2a6a');
    stars(g, 60, 101);
    rays(g, 50, 50, 20, 70, 'rgba(255,240,180,.12)', 0);
    [-1, 1].forEach(sd=>{ for(let i = 0; i < 5; i++){ g.strokeStyle = `rgba(255,${230 - i * 10},${170 - i * 10},${0.75 - i * 0.12})`; g.lineWidth = 2.6 - i * 0.3; g.beginPath(); g.moveTo(50 + sd * 10, 50); g.quadraticCurveTo(50 + sd * (26 + i * 4), 22 - i * 3, 50 + sd * (44 - i * 2), 30 + i * 9); g.stroke(); } });
    g.fillStyle = rad(g, 50, 50, 0, 22, [[0, '#ffffff'], [0.35, '#ffe9a0'], [1, 'rgba(255,220,120,0)']]); g.fillRect(28, 28, 44, 44);
    circ(g, 50, 50, 8, '#fffbe8');
    star(g, 50, 50, 5, '#ffffff', 4);
    caption(g, 'LEGENDARY BATTLE', '#ffe9a0', 'rgba(0,0,0,.4)');
  },
  /* Padrino's Theme: a black hat, its red band, a rose, pinstripes */
  battle_padrino(g){
    g.fillStyle = '#16161e'; g.fillRect(0, 0, 100, 100);
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 0.6; for(let x = 4; x < 100; x += 6){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 100); g.stroke(); }
    g.fillStyle = 'rgba(217,178,71,.12)'; circ(g, 50, 44, 30, 'rgba(217,178,71,.1)');
    g.fillStyle = '#0a0a0e'; g.beginPath(); g.ellipse(50, 56, 34, 8, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(30, 56); g.quadraticCurveTo(28, 28, 40, 24); g.quadraticCurveTo(50, 30, 60, 24); g.quadraticCurveTo(72, 28, 70, 56); g.closePath(); g.fill();
    g.fillStyle = '#b81e2e'; g.beginPath(); g.moveTo(30.6, 48); g.quadraticCurveTo(50, 52, 69.4, 48); g.lineTo(69.8, 54); g.quadraticCurveTo(50, 58, 30.2, 54); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 1; g.beginPath(); g.moveTo(36, 30); g.quadraticCurveTo(34, 40, 34, 46); g.stroke();
    /* the rose */
    g.strokeStyle = '#2f5a2a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(50, 92); g.quadraticCurveTo(46, 82, 50, 72); g.stroke();
    ell(g, 45, 84, 4, 2, '#3f7d3a');
    circ(g, 50, 70, 6, '#b81e2e'); g.strokeStyle = '#7a0e1a'; g.lineWidth = 0.8; g.beginPath(); g.arc(50, 70, 3.5, 0.5, 4.5); g.stroke(); g.beginPath(); g.arc(50.5, 69.5, 1.6, 3, 7); g.stroke();
    g.fillStyle = '#d9b247'; g.font = 'italic 900 7px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DON PADRINO', 50, 12);
    caption(g, "PADRINO'S THEME", '#d9b247', 'rgba(0,0,0,.5)');
  },
  /* Padrino's Last Stand: his pocket watch, cracked, the fire behind, his hat's shadow */
  battle_padrino_final(g){
    C_.sky(g, '#ff9a3a', '#8a1a0a');
    rays(g, 50, 54, 18, 80, 'rgba(255,240,180,.18)', 0.2);
    g.fillStyle = 'rgba(20,10,10,.5)'; g.beginPath(); g.ellipse(50, 26, 30, 6, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(34, 26); g.quadraticCurveTo(34, 8, 42, 6); g.quadraticCurveTo(50, 10, 58, 6); g.quadraticCurveTo(66, 8, 66, 26); g.closePath(); g.fill();
    g.strokeStyle = '#d9b247'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(50, 34); g.quadraticCurveTo(70, 30, 86, 40); g.stroke();
    circ(g, 50, 34, 3, '#d9b247');
    circ(g, 50, 60, 24, '#b8862e'); circ(g, 50, 60, 21, '#f4dc84'); circ(g, 50, 60, 18.5, '#fbf4dc');
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 0.8; for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; g.beginPath(); g.moveTo(50 + Math.cos(a) * 14.5, 60 + Math.sin(a) * 14.5); g.lineTo(50 + Math.cos(a) * 17, 60 + Math.sin(a) * 17); g.stroke(); }
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(50, 60); g.lineTo(50, 48); g.moveTo(50, 60); g.lineTo(58, 64); g.stroke(); circ(g, 50, 60, 1.6, '#3a2a1a');
    g.strokeStyle = '#2a1a0a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(40, 46); g.lineTo(46, 56); g.lineTo(42, 62); g.lineTo(48, 72); g.moveTo(46, 56); g.lineTo(52, 54); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(36, 54); g.quadraticCurveTo(40, 44, 50, 41); g.lineTo(50, 44); g.quadraticCurveTo(42, 47, 39, 55); g.closePath(); g.fill();
    caption(g, "PADRINO'S LAST STAND", '#ffffff', 'rgba(0,0,0,.45)');
  },
  /* The Alien Invasion: a saucer over the castle, its green beam */
  battle_region6(g){
    C_.sky(g, '#0a1a1a', '#1a3a3a');
    stars(g, 36, 140, null, 60);
    g.fillStyle = 'rgba(110,255,140,.28)'; g.beginPath(); g.moveTo(44, 34); g.lineTo(56, 34); g.lineTo(76, 90); g.lineTo(24, 90); g.closePath(); g.fill();
    g.fillStyle = 'rgba(180,255,190,.25)'; g.beginPath(); g.moveTo(47, 34); g.lineTo(53, 34); g.lineTo(62, 90); g.lineTo(38, 90); g.closePath(); g.fill();
    ell(g, 50, 30, 26, 7, '#9aa4b8'); ell(g, 50, 28, 26, 5, '#d4dae6'); g.fillStyle = 'rgba(160,255,200,.85)'; g.beginPath(); g.ellipse(50, 24, 10, 8, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(46, 21, 3, 2, -0.4, 0, TAU); g.fill();
    for(let i = 0; i < 7; i++) circ(g, 30 + i * 6.6, 31, 1.4, i % 2 ? '#ffe14a' : '#ff5fa8');
    g.fillStyle = '#16222a'; g.fillRect(14, 74, 72, 26);
    [[14, 58, 12], [40, 50, 20], [74, 58, 12]].forEach(([x, y, w])=>{ g.fillStyle = '#16222a'; g.fillRect(x, y + 8, w, 40); g.beginPath(); g.moveTo(x - 2, y + 8); g.lineTo(x + w / 2, y - 6); g.lineTo(x + w + 2, y + 8); g.closePath(); g.fill(); g.fillStyle = '#ffd36a'; g.fillRect(x + w / 2 - 1.2, y + 14, 2.4, 3.4); });
    for(let i = 0; i < 10; i++){ g.fillStyle = '#16222a'; g.fillRect(14 + i * 7.4, 70, 4, 4); }
    caption(g, 'THE ALIEN INVASION', '#aaffc0', 'rgba(0,0,0,.45)');
  },
  /* Challenge the Future: a striped sun going down over a glowing grid, the towers of tomorrow */
  battle_region6_future(g){
    C_.sky(g, '#1a0a3a', '#ff5fa8', 0, 62);
    g.save(); g.beginPath(); g.arc(50, 50, 22, 0, TAU); g.clip(); C_.sky(g, '#ffe66a', '#ff5fa8', 28, 72); g.fillStyle = '#1a0a3a'; for(let i = 0; i < 6; i++) g.fillRect(20, 52 + i * 3.4, 60, 0.8 + i * 0.35); g.restore();
    [[6, 40, 8], [16, 30, 7], [26, 44, 9], [66, 36, 8], [76, 26, 8], [88, 42, 10]].forEach(([x, y, w])=>{ g.fillStyle = '#2a0f4a'; g.fillRect(x, y, w, 62 - y); g.fillStyle = '#5fe0ff'; for(let i = 0; i < 4; i++) g.fillRect(x + 2, y + 4 + i * 5, w - 4, 0.8); });
    g.fillStyle = '#12052a'; g.fillRect(0, 62, 100, 38);
    g.strokeStyle = '#ff5fa8'; g.lineWidth = 0.8;
    for(let i = 0; i < 8; i++){ const y = 62 + Math.pow(i / 7, 1.8) * 38; g.beginPath(); g.moveTo(0, y); g.lineTo(100, y); g.stroke(); }
    for(let i = -8; i <= 8; i++){ g.beginPath(); g.moveTo(50 + i * 3, 62); g.lineTo(50 + i * 16, 100); g.stroke(); }
    g.strokeStyle = '#5fe0ff'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(50, 92); g.lineTo(50, 74); g.moveTo(44, 80); g.lineTo(50, 72); g.lineTo(56, 80); g.stroke(); g.lineCap = 'butt';
    caption(g, 'CHALLENGE THE FUTURE', '#5fe0ff', 'rgba(0,0,0,.45)');
  },
  /* Echoes of the Past: an hourglass among old columns, rings going out */
  battle_region6_past(g){
    C_.sky(g, '#e8d4a8', '#9a7a4a');
    g.strokeStyle = 'rgba(90,60,30,.25)'; for(let i = 1; i < 6; i++){ g.lineWidth = 1.4 - i * 0.15; g.beginPath(); g.arc(50, 52, i * 10, 0, TAU); g.stroke(); }
    [[12, 30, 9], [84, 40, 9], [24, 56, 7]].forEach(([x, y, w])=>{ g.fillStyle = '#c9b48a'; g.fillRect(x - w / 2, y, w, 100 - y); g.fillStyle = 'rgba(90,60,30,.25)'; for(let i = 1; i < 4; i++) g.fillRect(x - w / 2 + i * w / 4, y, 0.6, 100 - y); g.fillStyle = '#b8a078'; g.fillRect(x - w / 2 - 2, y - 3, w + 4, 3); });
    g.fillStyle = '#c9b48a'; g.beginPath(); g.moveTo(80, 36); g.lineTo(88, 36); g.lineTo(86, 30); g.closePath(); g.fill();
    g.fillStyle = '#6b4a22'; g.fillRect(36, 22, 28, 4); g.fillRect(36, 78, 28, 4);
    g.fillStyle = '#6b4a22'; g.fillRect(38, 26, 2, 52); g.fillRect(60, 26, 2, 52);
    g.fillStyle = 'rgba(230,245,255,.7)'; g.beginPath(); g.moveTo(41, 26); g.lineTo(59, 26); g.quadraticCurveTo(58, 44, 51, 52); g.quadraticCurveTo(58, 60, 59, 78); g.lineTo(41, 78); g.quadraticCurveTo(42, 60, 49, 52); g.quadraticCurveTo(42, 44, 41, 26); g.closePath(); g.fill();
    g.fillStyle = '#e0b860'; g.beginPath(); g.moveTo(45, 36); g.lineTo(55, 36); g.quadraticCurveTo(53, 46, 50, 50); g.quadraticCurveTo(47, 46, 45, 36); g.fill();
    g.fillRect(49.6, 50, 0.8, 22); g.beginPath(); g.moveTo(43, 78); g.quadraticCurveTo(50, 66, 57, 78); g.closePath(); g.fill();
    caption(g, 'ECHOES OF THE PAST', '#3a2a10', 'rgba(255,255,255,.55)');
  },
};
/* a sleeve's picture into (0, 0, S, S) of g: the printed picture, a fine border, the wear on it */
function coverArt(g, key, S){
  g.save(); g.scale(S / 100, S / 100);
  g.beginPath(); g.rect(0, 0, 100, 100); g.clip();
  (COVERS[key] || COVERS.region)(g);
  /* the sleeve's wear: a ring where the record pressed, softened corners, a little sheen */
  g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 1.2; g.beginPath(); g.arc(50, 50, 44, 0, TAU); g.stroke();
  g.fillStyle = lin(g, 0, 0, 100, 100, [[0, 'rgba(255,255,255,.14)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.14)']]); g.fillRect(0, 0, 100, 100);
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 99, 99);
  g.restore();
}
/* the disc: grooves catching the light, its label in the sleeve's colour */
function discArt(g, key, S){
  const c = S / 2, r = S / 2 - 1, lab = LABEL[key] || '#f2c23a';
  circ(g, c, c, r, '#141118');
  g.lineWidth = Math.max(0.5, S * 0.004);
  for(let i = 0; i < 26; i++){ const f = 0.97 - i * 0.022; g.strokeStyle = i % 4 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.11)'; g.beginPath(); g.arc(c, c, r * f, 0, TAU); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.13)'; [[-2.3, -1.7], [0.85, 1.45]].forEach(([a, b])=>{ g.beginPath(); g.moveTo(c, c); g.arc(c, c, r, a, b); g.closePath(); g.fill(); });
  circ(g, c, c, r * 0.36, lab);
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = Math.max(0.5, S * 0.006); g.beginPath(); g.arc(c, c, r * 0.3, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.45)'; g.font = `900 ${Math.round(S * 0.055)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('博刻MON', c, c - r * 0.17);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(c - r * 0.18, c + r * 0.13, r * 0.36, Math.max(1, S * 0.008)); g.fillRect(c - r * 0.12, c + r * 0.19, r * 0.24, Math.max(1, S * 0.008));
  circ(g, c, c, Math.max(1.5, S * 0.018), '#e8e4dc');
}
const URLS = new Map();
function artURL(kind, key, px){
  const id = kind + ':' + key + '@' + px;
  if(URLS.has(id)) return URLS.get(id);
  let url = '';
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = px;
    const g = cv.getContext('2d');
    (kind === 'disc' ? discArt : coverArt)(g, key, px);
    url = cv.toDataURL('image/png');
  } catch(e){ console.error('record art:', key, e); }
  URLS.set(id, url);
  return url;
}

return { slice, furn, dress, info, walkDress, geo:WG,
  cover:(key, px)=> artURL('cover', key, px || 220), disc:(key, px)=> artURL('disc', key, px || 200), coverArt, discArt, label:(key)=> LABEL[key] || '#f2c23a' };
})();
