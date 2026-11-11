/* ============================================================
   32-castle-walls.js — THE CASTLE'S WALLS, OUTSIDE AND IN (4.26)
   The designer (2026-11-11): "Could I request for the castle walls to be made more realistic, detailed and 3D from
   the outside please? The exterior undersells the interior. Could we also have the ramparts more clearly delineated
   as realistic walls please?"
   The curtain walls round the castle's grounds (three squares deep: 21-castle.js, caGrounds) were flat lilac squares,
   and from the jungle the whole castle a block of grey, blue and purple squares. Now the walls stand up, lit from the
   upper left as everything here is:
   - the south wall shows its outer face: dressed stone in courses over a sloping plinth, a string course under the
     battlements, buttresses, arrow loops, drains and the stains under them, ivy and moss; on top the battlements —
     merlons with arrow slits, the parapet between them, the wall walk behind;
   - the north wall shows its inner face, a blind arcade hung with the King's banners, under its walk and its
     battlements against the sky;
   - the west and east walls are seen from above: their walks between a low inner parapet and the battlements along
     their outer edges, each merlon a block with its shadow, their inner faces edge-on, their shade on the ground;
   - the gatehouse in the south wall: two drum towers, an arch with its portcullis drawn up and its oak doors open,
     the royal arms over it, machicolations, banners and burning torches;
   - the four corner towers round, their tops a flagged platform ringed with battlements (the ramparts you walk on),
     their bodies coursed, with arrow slits, corbels and a sloping foot.
   And from the jungle the castle is drawn as it is inside, with the same pictures (CA_WALL.jungle, from
   jgPaintLayer): the walls, the towers, the gatehouse, and the palace, the town and the gardens within them.
   Each side of wall is drawn in pieces of eight squares, kept (CA_ART.util.pic), and shown a square at a time.
   One name outside: CA_WALL.
   ============================================================ */
const CA_WALL = (function(){
const U = CA_ART.util, sh = U.sh, pic = U.pic, PIC_MAX_S = U.PIC_MAX_S, mix = U.mix;
const TAU = Math.PI * 2, RIM = 2, CH = 8, N = 64;
const ST = { stone:'#9d98b2', stoneL:'#bcb7cc', stoneD:'#76718c', mortar:'#555068', cap:'#cfcbdc', capL:'#eceaf3', capD:'#9893ac',
  walk:'#9c96aa', iron:'#2c2a33', ironL:'#5a5764', wood:'#6b4628', woodL:'#916339', woodD:'#4a2e18',
  royal:'#a3263b', royalD:'#6e1626', gold:'#d9b247', goldL:'#f4dc84', goldD:'#a07a22', blue:'#2f4f9a', blueL:'#4f72c0',
  leaf:['#3f6e2c', '#4f8236', '#5f9440', '#36612a'], moss:['rgba(92,124,50,.6)', 'rgba(124,150,62,.55)', 'rgba(66,96,38,.55)'] };
/* where in the grounds the walls are: their two ends (the towers' squares), the gate's span */
const W0 = 10, W1 = 54, GATE = [27, 37];
/* a number from 0 to 1 for where something is, the same every time */
const hsh = (a, b, c)=>{ let t = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1440662683)) | 0; t = Math.imul(t ^ (t >>> 13), 1274126177); t ^= t >>> 16; return (t >>> 0) / 4294967296; };
const R = (g, x, y, w, h, c)=>{ g.fillStyle = c; g.fillRect(x, y, w, h); };
const lin = (g, x0, y0, x1, y1, st)=>{ const gr = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c])=> gr.addColorStop(o, c)); return gr; };
const rr = (g, x, y, w, h, r)=>{ g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); else g.rect(x, y, w, h); };
const ell = (g, x, y, rx, ry, c)=>{ g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0.001, rx), Math.max(0.001, ry), 0, 0, TAU); g.fill(); };

/* ---------- stone ----------
   Everything below is drawn in squares (the picture scaled so that one square is one unit), along the wall `u`
   (squares from the grounds' corner) and across or down it `v`. */
/* dressed stone between u0 and u1 along, v0 and v1 down, in courses ch high: each block's length and tone from where
   it is, so that pieces of wall drawn apart meet */
function courses(g, u0, u1, v0, v1, ch, seed, o){
  o = o || {};
  const base = o.base || ST.stone, gap = 0.019;
  R(g, u0, v0, u1 - u0, v1 - v0, o.mortar || ST.mortar);
  for(let r = 0, v = v0; v < v1 - 0.005; r++, v += ch){
    const hh = Math.min(ch, v1 - v);
    let u = -3 - hsh(seed, r, 7) * 0.7, i = 0;
    while(u < u1){
      const L = (o.min || 0.44) + hsh(seed, r * 131 + i, 11) * (o.span || 0.42);
      if(u + L > u0){
        const t = (hsh(seed, r * 131 + i, 13) - 0.5) * (o.vary || 0.2) + (o.tone || 0);
        const bx = Math.max(u0, u + gap), bx2 = Math.min(u1, u + L - gap);
        if(bx2 > bx){
          const hue = hsh(seed, r * 131 + i, 19), b0 = o.plain ? base : hue < 0.22 ? mix(base, '#aba39c', 0.32) : hue > 0.8 ? mix(base, '#8f95b8', 0.3) : base;   // a warmer stone, a bluer one
          g.fillStyle = sh(b0, t); rr(g, bx, v + gap, bx2 - bx, hh - gap * 2, 0.025); g.fill();
          R(g, bx, v + gap, bx2 - bx, 0.02, 'rgba(255,255,255,.22)');
          R(g, bx, v + gap, 0.014, hh - gap * 2, 'rgba(255,255,255,.12)');
          R(g, bx, v + hh - gap - 0.024, bx2 - bx, 0.024, 'rgba(24,16,44,.3)');
          R(g, bx2 - 0.016, v + gap, 0.016, hh - gap * 2, 'rgba(24,16,44,.16)');
          const f = hsh(seed, r * 131 + i, 17);
          if(f < 0.07){ g.strokeStyle = 'rgba(40,30,60,.35)'; g.lineWidth = 0.008; g.beginPath(); g.moveTo(bx + (bx2 - bx) * 0.3, v + gap); g.lineTo(bx + (bx2 - bx) * 0.45, v + hh * 0.5); g.lineTo(bx + (bx2 - bx) * 0.38, v + hh - gap); g.stroke(); }
          else if(f < 0.13){ g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.ellipse(bx + (bx2 - bx) * 0.6, v + hh * 0.5, (bx2 - bx) * 0.2, hh * 0.25, 0, 0, TAU); g.fill(); }
        }
      }
      u += L; i++;
    }
  }
}
/* flagstones on a walk running along u (rows of them across it), v0 to v1 */
function flagsH(g, u0, u1, v0, v1, rows, seed){
  R(g, u0, v0, u1 - u0, v1 - v0, sh(ST.walk, -0.32));
  const rh = (v1 - v0) / rows, gap = 0.014;
  for(let r = 0; r < rows; r++){
    let u = -3 - hsh(seed, r, 3) * 0.8, i = 0;
    while(u < u1){
      const L = 0.55 + hsh(seed, r * 97 + i, 5) * 0.6;
      if(u + L > u0){
        const bx = Math.max(u0, u + gap), bx2 = Math.min(u1, u + L - gap), t = (hsh(seed, r * 97 + i, 9) - 0.5) * 0.14;
        if(bx2 > bx){ g.fillStyle = sh(ST.walk, t); rr(g, bx, v0 + r * rh + gap, bx2 - bx, rh - gap * 2, 0.03); g.fill(); R(g, bx, v0 + r * rh + gap, bx2 - bx, 0.012, 'rgba(255,255,255,.18)'); }
        if(hsh(seed, r * 97 + i, 21) < 0.18){ g.fillStyle = ['#8a6a2a', '#a07a30', '#6a8a30'][i % 3]; g.beginPath(); g.ellipse(u + L * hsh(seed, i, 23), v0 + r * rh + rh * 0.5, 0.05, 0.02, hsh(seed, i, 25) * 3, 0, TAU); g.fill(); }
      }
      u += L; i++;
    }
  }
}
/* flagstones on a walk running down the picture (u along it, v across): columns of them */
function flagsV(g, v0, v1, u0, u1, cols, seed){
  R(g, v0, u0, v1 - v0, u1 - u0, sh(ST.walk, -0.32));
  const cw = (v1 - v0) / cols, gap = 0.014;
  for(let c = 0; c < cols; c++){
    let u = -3 - hsh(seed, c, 3) * 0.8, i = 0;
    while(u < u1){
      const L = 0.5 + hsh(seed, c * 97 + i, 5) * 0.55;
      if(u + L > u0){
        const by = Math.max(u0, u + gap), by2 = Math.min(u1, u + L - gap), t = (hsh(seed, c * 97 + i, 9) - 0.5) * 0.14;
        if(by2 > by){ g.fillStyle = sh(ST.walk, t); rr(g, v0 + c * cw + gap, by, cw - gap * 2, by2 - by, 0.03); g.fill(); R(g, v0 + c * cw + gap, by, cw - gap * 2, 0.012, 'rgba(255,255,255,.18)'); R(g, v0 + c * cw + gap, by, 0.012, by2 - by, 'rgba(255,255,255,.1)'); }
        if(hsh(seed, c * 97 + i, 21) < 0.16){ g.fillStyle = ['#8a6a2a', '#a07a30', '#6a8a30'][i % 3]; g.beginPath(); g.ellipse(v0 + c * cw + cw * hsh(seed, i, 23), u + L * 0.5, 0.05, 0.02, hsh(seed, i, 25) * 3, 0, TAU); g.fill(); }
      }
      u += L; i++;
    }
  }
}
/* a cap stone seen from above, u0…u1 along, v0…v1 across (the top of a parapet), its front edge at v1 */
function capH(g, u0, u1, v0, v1, seed){
  R(g, u0, v0, u1 - u0, v1 - v0, ST.cap);
  let u = -3 - hsh(seed, 1, 1) * 0.5, i = 0;
  while(u < u1){ const L = 0.7 + hsh(seed, i, 2) * 0.5; if(u + L > u0){ R(g, Math.max(u0, u + L - 0.012), v0, 0.012, v1 - v0, 'rgba(60,50,80,.35)'); R(g, Math.max(u0, u), v0, Math.min(L, u1 - u), v1 - v0, `rgba(255,255,255,${(hsh(seed, i, 3) * 0.12).toFixed(3)})`); } u += L; i++; }
  R(g, u0, v0, u1 - u0, 0.018, ST.capL);
  R(g, u0, v1 - 0.022, u1 - u0, 0.022, ST.capD);
}
/* an arrow slit: a tall dark slot with a crossbar, its splayed stone round it */
function slit(g, cx, v0, v1){
  const h = v1 - v0;
  g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, cx - 0.06, v0 - 0.03, 0.12, h + 0.06, 0.05); g.fill();
  g.fillStyle = '#1d1a26'; rr(g, cx - 0.026, v0, 0.052, h, 0.026); g.fill();
  R(g, cx - 0.09, v0 + h * 0.4, 0.18, 0.04, '#1d1a26');
  R(g, cx - 0.026, v0, 0.012, h, 'rgba(255,255,255,.12)');
}
/* moss: small soft patches at (u, v) */
function moss(g, u, v, r, seed){
  for(let k = 0; k < 6; k++){ g.fillStyle = ST.moss[k % 3]; g.beginPath(); g.ellipse(u + (hsh(seed, k, 1) - 0.5) * r * 2, v + (hsh(seed, k, 2) - 0.5) * r * 0.7, r * (0.3 + hsh(seed, k, 3) * 0.4), r * (0.18 + hsh(seed, k, 4) * 0.2), 0, 0, TAU); g.fill(); }
}
/* ivy, rooted at the foot (u, vb), climbing to vt */
function ivy(g, u, vb, vt, wd, seed){
  g.strokeStyle = '#3a4a22'; g.lineWidth = 0.014;
  for(let s = 0; s < 4; s++){
    let x = u + (hsh(seed, s, 1) - 0.5) * wd, y = vb;
    g.beginPath(); g.moveTo(x, y);
    while(y > vt + (vb - vt) * hsh(seed, s, 2) * 0.4){ x += (hsh(seed, s * 31 + Math.round(y * 50), 3) - 0.5) * 0.12; y -= 0.08; g.lineTo(x, y); }
    g.stroke();
  }
  for(let k = 0; k < 70; k++){
    const fy = vb - (vb - vt) * Math.pow(hsh(seed, k, 5), 0.8), spread = wd * (0.3 + 0.7 * (fy - vt) / (vb - vt + 0.001));
    const fx = u + (hsh(seed, k, 6) - 0.5) * spread * 1.4, r = 0.035 + hsh(seed, k, 7) * 0.03;
    g.fillStyle = ST.leaf[k % 4]; g.beginPath(); g.ellipse(fx, fy, r, r * 0.75, hsh(seed, k, 8) * 3, 0, TAU); g.fill();
    if(k % 3 === 0){ g.fillStyle = 'rgba(200,230,140,.35)'; g.beginPath(); g.ellipse(fx - r * 0.3, fy - r * 0.3, r * 0.35, r * 0.2, 0, 0, TAU); g.fill(); }
  }
}

/* ---------- the walls, side by side ----------
   South (rows 61–63), its outer face towards you: the battlements on top (merlons from 0, their caps to 0.18 and
   their faces to 0.75; between them the walk in their shade, the parapet's cap 0.3–0.45 and its face to 0.75), a
   string course 0.75–0.83, the face to 2.6, the sloping plinth to 3. */
const ARROW_S = [12.6, 18.4, 24.2, 39.8, 45.6, 51.4], BUTTRESS_S = [15.5, 21.3, 42.7, 48.5], SPOUT_S = [13.8, 19.9, 25.6, 38.4, 44.1, 50.2], IVY_S = [[16.9, 1.2], [47.2, 1.05], [31.1, -1]];
function drawSouth(g, u0, u1){
  /* in the gaps of the battlements: the walk, in their shade, then the parapet's cap and its face */
  R(g, u0, 0, u1 - u0, 0.3, '#5d5870'); flagsH(g, u0, u1, 0.02, 0.3, 1, 101); R(g, u0, 0, u1 - u0, 0.3, 'rgba(22,16,42,.42)');
  capH(g, u0, u1, 0.3, 0.45, 103);
  courses(g, u0, u1, 0.45, 0.75, 0.15, 211, { min:0.38, span:0.36 });
  /* the merlons, each throwing its shadow to the right over the cap and into the gap */
  for(let i = Math.floor(u0) - 1; i <= Math.ceil(u1); i++){
    const a = i + 0.2, b = i + 0.8;
    g.fillStyle = 'rgba(22,16,42,.36)'; g.beginPath(); g.moveTo(b, 0.02); g.lineTo(b + 0.2, 0.1); g.lineTo(b + 0.2, 0.44); g.lineTo(b, 0.44); g.closePath(); g.fill();
    courses(g, a, b, 0.18, 0.75, 0.19, 307 + i * 7, { min:0.28, span:0.3 });
    R(g, a, 0.18, 0.05, 0.57, 'rgba(255,255,255,.2)'); R(g, b - 0.07, 0.18, 0.07, 0.57, 'rgba(22,16,42,.3)');
    g.fillStyle = lin(g, 0, 0, 0, 0.19, [[0, ST.capL], [0.5, ST.cap], [1, ST.capD]]); rr(g, a - 0.03, 0, b - a + 0.06, 0.19, 0.03); g.fill();
    R(g, a - 0.03, 0.175, b - a + 0.06, 0.03, 'rgba(22,16,42,.4)');
    if(((i % 2) + 2) % 2 === 0) slit(g, (a + b) / 2, 0.28, 0.66);
    if(hsh(i, 5, 1) < 0.3) moss(g, a + (b - a) * hsh(i, 5, 2), 0.04, 0.07, i * 13);
  }
  /* the string course: a moulding that throws its shade on the face below */
  R(g, u0, 0.75, u1 - u0, 0.09, ST.cap); R(g, u0, 0.75, u1 - u0, 0.024, ST.capL); R(g, u0, 0.82, u1 - u0, 0.02, ST.capD);
  /* the face */
  courses(g, u0, u1, 0.84, 2.58, 0.218, 401);
  g.fillStyle = lin(g, 0, 0.84, 0, 1.06, [[0, 'rgba(22,16,42,.45)'], [1, 'rgba(22,16,42,0)']]); g.fillRect(u0, 0.84, u1 - u0, 0.22);
  g.fillStyle = lin(g, 0, 1.06, 0, 2.58, [[0, 'rgba(22,16,42,0)'], [0.55, 'rgba(22,16,42,.07)'], [1, 'rgba(22,16,42,.27)']]); g.fillRect(u0, 1.06, u1 - u0, 1.52);
  for(let u = Math.floor(u0 / 1.7) * 1.7 + 0.6; u < u1; u += 1.7){ R(g, u, 1.06, 0.07, 0.07, 'rgba(18,12,30,.7)'); R(g, u, 1.13, 0.07, 0.015, 'rgba(255,255,255,.15)'); }   // putlog holes
  SPOUT_S.forEach(u=>{ if(u < u0 - 1 || u > u1 + 1) return;
    g.fillStyle = lin(g, 0, 0.94, 0, 2.4, [[0, 'rgba(36,44,36,.42)'], [1, 'rgba(36,44,36,0)']]); g.beginPath(); g.moveTo(u - 0.05, 0.94); g.lineTo(u + 0.05, 0.94); g.lineTo(u + 0.1, 2.4); g.lineTo(u - 0.09, 2.4); g.closePath(); g.fill();
    R(g, u - 0.08, 0.82, 0.16, 0.13, ST.stoneD); R(g, u - 0.08, 0.82, 0.16, 0.025, ST.stoneL); ell(g, u, 0.92, 0.04, 0.022, '#15121c'); });
  ARROW_S.forEach(u=>{ if(u > u0 - 1 && u < u1 + 1){ g.fillStyle = sh(ST.stone, 0.12); rr(g, u - 0.14, 1.22, 0.28, 0.98, 0.07); g.fill(); R(g, u - 0.14, 1.22, 0.28, 0.025, 'rgba(255,255,255,.32)'); R(g, u - 0.14, 2.175, 0.28, 0.025, 'rgba(22,16,42,.42)'); slit(g, u, 1.3, 2.12); } });
  /* buttresses: piers standing out from the face, their sides in shade, their sloping tops, their shade to the right */
  BUTTRESS_S.forEach((c, i)=>{ if(c < u0 - 2 || c > u1 + 2) return;
    const a = c - 0.4, b = c + 0.4, sd = 0.15;
    g.fillStyle = lin(g, b + sd, 0, b + sd + 0.45, 0, [[0, 'rgba(22,16,42,.36)'], [1, 'rgba(22,16,42,0)']]); g.beginPath(); g.moveTo(b + sd, 0.95); g.lineTo(b + sd + 0.45, 1.25); g.lineTo(b + sd + 0.45, 2.62); g.lineTo(b + sd, 2.62); g.closePath(); g.fill();
    courses(g, b, b + sd, 1.0, 2.62, 0.218, 541 + i, { base:sh(ST.stone, -0.28), min:0.6, span:0.1, plain:true });
    courses(g, a, b, 1.1, 2.62, 0.218, 503 + i, { base:sh(ST.stone, 0.1), min:0.36, span:0.3 });
    R(g, a, 1.1, 0.05, 1.52, 'rgba(255,255,255,.22)');
    g.fillStyle = lin(g, 0, 0.84, 0, 1.12, [[0, ST.capD], [0.6, ST.cap], [1, ST.capL]]); g.beginPath(); g.moveTo(a + 0.05, 0.84); g.lineTo(b + 0.05, 0.84); g.lineTo(b + sd, 1.02); g.lineTo(b, 1.12); g.lineTo(a - 0.03, 1.12); g.closePath(); g.fill();
    R(g, a - 0.03, 1.1, b - a + 0.03, 0.03, 'rgba(22,16,42,.42)');
    g.fillStyle = sh(ST.stone, 0.06); g.fillRect(a - 0.08, 2.48, b - a + sd + 0.16, 0.12); R(g, a - 0.08, 2.48, b - a + sd + 0.16, 0.022, ST.capL);
  });
  /* ivy, and moss low down */
  IVY_S.forEach(([u, top], i)=>{ if(top > 0 && u > u0 - 2 && u < u1 + 2) ivy(g, u, 2.62, top, 1.0, 900 + i); });
  for(let u = Math.floor(u0) - 1; u < u1 + 1; u += 1){ if(hsh(u, 9, 1) < 0.45) moss(g, u + hsh(u, 9, 2), 2.4 + hsh(u, 9, 3) * 0.14, 0.09, u * 7 + 1); }
  /* the plinth, sloping out to the ground: lit on its slope, in shade where the face stands on it */
  R(g, u0, 2.58, u1 - u0, 0.03, 'rgba(18,12,30,.55)');
  g.fillStyle = lin(g, 0, 2.61, 0, 3, [[0, '#c4bfd4'], [0.3, '#a8a3bb'], [1, '#6f6a86']]); g.fillRect(u0, 2.61, u1 - u0, 0.39);
  R(g, u0, 2.61, u1 - u0, 0.02, ST.capL); R(g, u0, 2.8, u1 - u0, 0.014, 'rgba(36,28,56,.4)');
  for(let u = -3 + 0.37, i = 0; u < u1; u += 0.62 + hsh(i, 4, 1) * 0.4, i++){ if(u < u0 - 1) continue; R(g, u, 2.63, 0.014, 0.17, 'rgba(36,28,56,.38)'); R(g, u + 0.27, 2.814, 0.014, 0.16, 'rgba(36,28,56,.38)'); }
  for(let u = Math.floor(u0) - 1; u < u1 + 1; u += 0.5){ if(hsh(Math.round(u * 2), 31, 1) < 0.3){ g.strokeStyle = '#5c7a34'; g.lineWidth = 0.014; for(let q = -1; q <= 1; q++){ g.beginPath(); g.moveTo(u + q * 0.03, 3); g.lineTo(u + q * 0.06, 2.9); g.stroke(); } } }
  R(g, u0, 2.96, u1 - u0, 0.04, 'rgba(18,12,30,.5)');
}
/* North (rows 0–2), its inner face towards you: the walk 0–0.48 (its battlements stand above the band, against the
   sky: drawCrest), its coping 0.48–0.6, the inner face to 2.82 — a blind arcade with doors to the stairs in the
   wall, lanterns and the King's banners — and its plinth */
const BANNER_N = [17.5, 29.5, 34.5, 46.5];
function drawNorth(g, u0, u1){
  flagsH(g, u0, u1, 0, 0.48, 2, 131);
  R(g, u0, 0, u1 - u0, 0.1, 'rgba(22,16,42,.38)');                     // the battlements' shade
  R(g, u0, 0.48, u1 - u0, 0.12, ST.cap); R(g, u0, 0.48, u1 - u0, 0.024, ST.capL); R(g, u0, 0.58, u1 - u0, 0.02, ST.capD);
  /* the inner face: courses, then a blind arcade over them — its bays set back in shade, its piers standing out */
  courses(g, u0, u1, 0.6, 2.82, 0.21, 431, { tone:0.02 });
  g.fillStyle = lin(g, 0, 0.6, 0, 0.84, [[0, 'rgba(22,16,42,.45)'], [1, 'rgba(22,16,42,0)']]); g.fillRect(u0, 0.6, u1 - u0, 0.24);
  for(let j = -1; j < 20; j++){
    const p = W0 + j * 3, a = p + 0.24, b = p + 2.76, top = 0.95, spring = 1.25, cx = (a + b) / 2;
    if(b < u0 - 1 || a > u1 + 1) continue;
    const arch = ()=>{ g.beginPath(); g.moveTo(a, 2.82); g.lineTo(a, spring); g.quadraticCurveTo(cx, top - 0.34, b, spring); g.lineTo(b, 2.82); g.closePath(); };
    g.save(); arch(); g.clip();
    R(g, a, 0.6, b - a, 2.3, 'rgba(22,16,42,.24)');
    g.fillStyle = lin(g, 0, top - 0.2, 0, spring + 0.45, [[0, 'rgba(22,16,42,.32)'], [1, 'rgba(22,16,42,0)']]); g.fillRect(a, 0.6, b - a, 1.1);
    g.fillStyle = lin(g, a, 0, a + 0.38, 0, [[0, 'rgba(22,16,42,.32)'], [1, 'rgba(22,16,42,0)']]); g.fillRect(a, 0.6, 0.38, 2.3);
    g.restore();
    g.strokeStyle = sh(ST.stone, 0.14); g.lineWidth = 0.12; g.beginPath(); g.moveTo(a, spring); g.quadraticCurveTo(cx, top - 0.34, b, spring); g.stroke();
    g.strokeStyle = 'rgba(22,16,42,.45)'; g.lineWidth = 0.012;
    for(let q = 1; q < 11; q++){ const t = q / 11, x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * cx + t * t * b, y = (1 - t) * (1 - t) * spring + 2 * (1 - t) * t * (top - 0.34) + t * t * spring; g.beginPath(); g.moveTo(x, y - 0.055); g.lineTo(x, y + 0.055); g.stroke(); }
    /* a door to the stair in the wall, now and then */
    if(((j % 4) + 4) % 4 === 1){
      const dw = 0.56, dt = 1.95, db = 2.82;
      g.fillStyle = sh(ST.stone, 0.1); g.beginPath(); g.moveTo(cx - dw * 0.66, db); g.lineTo(cx - dw * 0.66, dt + 0.05); g.quadraticCurveTo(cx, dt - dw * 0.8, cx + dw * 0.66, dt + 0.05); g.lineTo(cx + dw * 0.66, db); g.closePath(); g.fill();
      g.fillStyle = lin(g, cx - dw / 2, 0, cx + dw / 2, 0, [[0, ST.woodL], [1, ST.woodD]]); g.beginPath(); g.moveTo(cx - dw / 2, db); g.lineTo(cx - dw / 2, dt + 0.1); g.quadraticCurveTo(cx, dt - dw * 0.45, cx + dw / 2, dt + 0.1); g.lineTo(cx + dw / 2, db); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(30,16,6,.45)'; g.lineWidth = 0.01; for(let q = 1; q < 4; q++){ g.beginPath(); g.moveTo(cx - dw / 2 + q * dw / 4, dt + 0.05); g.lineTo(cx - dw / 2 + q * dw / 4, db); g.stroke(); }
      [0.4, 0.74].forEach(f=> R(g, cx - dw / 2, dt + (db - dt) * f, dw, 0.04, ST.iron)); ell(g, cx + dw * 0.26, dt + (db - dt) * 0.56, 0.028, 0.028, ST.gold);
      R(g, cx - dw * 0.7, db - 0.04, dw * 1.4, 0.04, 'rgba(18,12,30,.4)');
    }
  }
  for(let j = -1; j < 21; j++){
    const p = W0 + j * 3;
    if(p < u0 - 1 || p > u1 + 1) continue;
    courses(g, p - 0.24, p + 0.24, 0.6, 2.82, 0.21, 611 + j, { base:sh(ST.stone, 0.1), min:0.46, span:0.1 });
    R(g, p - 0.24, 0.6, 0.04, 2.22, 'rgba(255,255,255,.24)'); R(g, p + 0.18, 0.6, 0.06, 2.22, 'rgba(22,16,42,.3)');
    R(g, p - 0.28, 1.2, 0.56, 0.08, ST.cap); R(g, p - 0.28, 1.2, 0.56, 0.02, ST.capL); R(g, p - 0.28, 1.28, 0.56, 0.028, 'rgba(22,16,42,.4)');
    if(((j % 2) + 2) % 2 === 0 && j >= 0){ R(g, p - 0.02, 1.55, 0.04, 0.14, ST.iron); R(g, p - 0.08, 1.67, 0.16, 0.035, ST.iron); g.fillStyle = 'rgba(255,214,120,.92)'; rr(g, p - 0.06, 1.705, 0.12, 0.15, 0.02); g.fill(); R(g, p - 0.08, 1.85, 0.16, 0.03, ST.iron); }
    R(g, p - 0.3, 2.66, 0.6, 0.16, sh(ST.stone, 0.05)); R(g, p - 0.3, 2.66, 0.6, 0.02, ST.capL);
  }
  /* the King's banners, hung from the walk's edge */
  BANNER_N.forEach(c=>{ if(c > u0 - 1 && c < u1 + 1) banner(g, c, 0.62, 0.6, 1.18); });
  for(let u = Math.floor(u0) - 1; u < u1 + 1; u += 1){ if(hsh(u, 19, 1) < 0.35) moss(g, u + hsh(u, 19, 2), 2.7, 0.08, u * 11 + 3); }
  /* its plinth */
  R(g, u0, 2.8, u1 - u0, 0.03, 'rgba(18,12,30,.5)');
  g.fillStyle = lin(g, 0, 2.83, 0, 3, [[0, '#b9b4ca'], [1, '#77728d']]); g.fillRect(u0, 2.83, u1 - u0, 0.17); R(g, u0, 2.83, u1 - u0, 0.02, ST.capL); R(g, u0, 2.97, u1 - u0, 0.03, 'rgba(20,14,30,.45)');
}
/* the north wall's battlements, standing above it against the sky: v from -0.95 to 0 (their foot on the walk's far
   edge): merlons, their caps -0.95 to -0.77; between them the parapet, its cap -0.6 to -0.45, its inner face to 0 */
function drawCrest(g, u0, u1){
  capH(g, u0, u1, -0.6, -0.45, 117);
  courses(g, u0, u1, -0.45, 0, 0.15, 223, { min:0.38, span:0.36, tone:-0.08 });
  R(g, u0, -0.45, u1 - u0, 0.04, 'rgba(22,16,42,.3)');
  for(let i = Math.floor(u0) - 1; i <= Math.ceil(u1); i++){
    const a = i + 0.2, b = i + 0.8;
    g.fillStyle = 'rgba(22,16,42,.3)'; g.beginPath(); g.moveTo(b, -0.62); g.lineTo(b + 0.18, -0.55); g.lineTo(b + 0.18, 0); g.lineTo(b, 0); g.closePath(); g.fill();
    courses(g, a, b, -0.77, 0, 0.19, 317 + i * 7, { min:0.28, span:0.3, tone:-0.03 });
    R(g, a, -0.77, 0.05, 0.77, 'rgba(255,255,255,.18)'); R(g, b - 0.07, -0.77, 0.07, 0.77, 'rgba(22,16,42,.28)');
    g.fillStyle = lin(g, 0, -0.95, 0, -0.75, [[0, ST.capL], [0.5, ST.cap], [1, ST.capD]]); rr(g, a - 0.03, -0.95, b - a + 0.06, 0.2, 0.03); g.fill();
    R(g, a - 0.03, -0.775, b - a + 0.06, 0.03, 'rgba(22,16,42,.38)');
    if(hsh(i, 6, 1) < 0.28) moss(g, a + (b - a) * hsh(i, 6, 2), -0.9, 0.07, i * 17);
  }
}
/* a royal banner hung at (cx, top), w wide, h long: red, a gold crown, a gold fringe, swallow-tailed */
function banner(g, cx, top, w, h){
  R(g, cx - w / 2 - 0.04, top - 0.02, w + 0.08, 0.04, ST.iron);
  g.fillStyle = 'rgba(20,14,30,.25)'; g.beginPath(); g.moveTo(cx - w / 2 + 0.04, top + 0.04); g.lineTo(cx + w / 2 + 0.04, top + 0.04); g.lineTo(cx + w / 2 + 0.04, top + h + 0.04); g.lineTo(cx + 0.04, top + h - 0.12); g.lineTo(cx - w / 2 + 0.04, top + h + 0.04); g.closePath(); g.fill();
  g.fillStyle = lin(g, cx - w / 2, 0, cx + w / 2, 0, [[0, sh(ST.royal, 0.12)], [0.55, ST.royal], [1, ST.royalD]]);
  g.beginPath(); g.moveTo(cx - w / 2, top); g.lineTo(cx + w / 2, top); g.lineTo(cx + w / 2, top + h); g.lineTo(cx, top + h - 0.14); g.lineTo(cx - w / 2, top + h); g.closePath(); g.fill();
  R(g, cx - w / 2 + 0.04, top + 0.02, 0.025, h - 0.1, ST.gold); R(g, cx + w / 2 - 0.065, top + 0.02, 0.025, h - 0.1, ST.gold);
  const ky = top + h * 0.42, kw = w * 0.5;
  g.fillStyle = ST.gold; g.beginPath(); g.moveTo(cx - kw / 2, ky + 0.08); g.lineTo(cx - kw / 2 - 0.02, ky - 0.08); g.lineTo(cx - kw / 4, ky); g.lineTo(cx, ky - 0.12); g.lineTo(cx + kw / 4, ky); g.lineTo(cx + kw / 2 + 0.02, ky - 0.08); g.lineTo(cx + kw / 2, ky + 0.08); g.closePath(); g.fill();
  R(g, cx - kw / 2, ky + 0.06, kw, 0.04, ST.goldL);
  for(let i = 0; i < 6; i++) ell(g, cx - w / 2 + (i + 0.5) * w / 6, top + h - 0.02 - (Math.abs(i - 2.5) < 1 ? 0.1 : 0.03), 0.02, 0.03, ST.goldL);
}
/* West (cols 0–2), seen from above: the outer face edge-on 0–0.08, the battlements' cap 0.1–0.62 (each merlon a
   block on it, its top lifted half a square and its south face showing, its shadow to the right on the walk), the
   walk to 2.2, the low inner parapet 2.2–2.4, the inner face edge-on to 3, in shade. East (cols 61–63) is its
   mirror, its inner face in the light. Here x is across the wall and y along it. */
function drawSide(g, u0, u1, east){
  const Xr = (v0, v1)=> east ? [3 - v1, 3 - v0] : [v0, v1];
  const box = (v0, v1, y0, y1, c)=>{ const [a, b] = Xr(v0, v1); R(g, a, y0, b - a, y1 - y0, c); };
  /* the walk, a little sunk between its parapets */
  { const [a, b] = Xr(0.62, 2.2); flagsV(g, a, b, u0, u1, 3, east ? 151 : 141); g.fillStyle = 'rgba(22,16,42,.12)'; g.fillRect(a, u0, b - a, u1 - u0); }
  { const [a, b] = Xr(1.1, 1.72); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(a, u0, b - a, u1 - u0); }   // worn by the patrols
  box(0.62, 0.84, u0, u1, 'rgba(22,16,42,.26)');                        // the battlements' shade along it
  /* the battlements: the outer face edge-on, the parapet's cap, continuous */
  box(0, 0.08, u0, u1, '#34304a'); box(0.08, 0.1, u0, u1, 'rgba(255,255,255,.28)');
  box(0.1, 0.62, u0, u1, ST.cap);
  for(let u = -3 + hsh(east ? 2 : 1, 1, 1) * 0.5, i = 0; u < u1; u += 0.62 + hsh(i, east ? 2 : 1, 7) * 0.4, i++){ if(u < u0 - 1) continue; box(0.1, 0.62, u, u + 0.014, 'rgba(50,42,72,.35)'); }
  box(east ? 0.59 : 0.1, east ? 0.62 : 0.13, u0, u1, east ? 'rgba(22,16,42,.32)' : 'rgba(255,255,255,.4)');
  /* each merlon: a block standing on it, its top lifted, its south face showing, its shadow down and to the right */
  for(let i = Math.floor(u0) - 1; i <= Math.ceil(u1) + 1; i++){
    const a = i + 0.2, b = i + 0.8, top = a - 0.5, face = b - 0.5;
    if(!east){ g.fillStyle = 'rgba(22,16,42,.32)'; g.beginPath(); g.moveTo(0.62, face - 0.06); g.lineTo(1.1, face + 0.2); g.lineTo(1.1, b + 0.26); g.lineTo(0.62, b); g.closePath(); g.fill(); }
    else { g.fillStyle = 'rgba(22,16,42,.24)'; g.beginPath(); g.moveTo(2.38, b); g.lineTo(2.92, b); g.lineTo(2.92, b + 0.14); g.lineTo(2.38, b + 0.08); g.closePath(); g.fill(); }
    const [f0, f1] = Xr(0.1, 0.62);
    courses(g, f0, f1, face, b, 0.165, 701 + i * 3 + (east ? 1 : 0), { min:0.2, span:0.2, tone:-0.06 });
    R(g, f0, face, f1 - f0, 0.03, 'rgba(22,16,42,.3)'); R(g, f0, b - 0.03, f1 - f0, 0.03, 'rgba(22,16,42,.42)');
    if(((i % 2) + 2) % 2 === 0){ g.fillStyle = '#1d1a26'; rr(g, (f0 + f1) / 2 - 0.024, face + 0.08, 0.048, b - face - 0.17, 0.022); g.fill(); R(g, (f0 + f1) / 2 - 0.075, face + 0.2, 0.15, 0.035, '#1d1a26'); }
    g.fillStyle = lin(g, f0, 0, f1, 0, east ? [[0, ST.cap], [1, ST.capD]] : [[0, ST.capL], [1, ST.cap]]); rr(g, f0 - 0.025, top, f1 - f0 + 0.05, face - top, 0.035); g.fill();
    R(g, f0 - 0.025, top, f1 - f0 + 0.05, 0.028, ST.capL); R(g, f0 - 0.025, face - 0.035, f1 - f0 + 0.05, 0.035, ST.capD);
    R(g, east ? f1 + 0.005 : f0 - 0.025, top, 0.022, face - top, east ? 'rgba(22,16,42,.32)' : 'rgba(255,255,255,.6)');
    if(hsh(i, east ? 8 : 7, 1) < 0.25) moss(g, f0 + (f1 - f0) * hsh(i, 7, 2), top + 0.15, 0.07, i * 19 + (east ? 5 : 0));
  }
  /* the low parapet on the inner edge, then the inner face seen edge-on: courses running along it, in shade on the
     west wall, in the light on the east */
  box(2.2, 2.4, u0, u1, ST.cap); box(east ? 2.2 : 2.37, east ? 2.23 : 2.4, u0, u1, 'rgba(22,16,42,.38)'); box(east ? 2.37 : 2.2, east ? 2.4 : 2.23, u0, u1, ST.capL);
  const fc = east ? sh(ST.stone, 0.06) : sh(ST.stone, -0.24), [s0, s1] = Xr(2.4, 3);
  g.fillStyle = lin(g, s0, 0, s1, 0, east ? [[0, sh(fc, -0.12)], [1, sh(fc, 0.1)]] : [[0, sh(fc, 0.08)], [1, sh(fc, -0.16)]]); g.fillRect(s0, u0, s1 - s0, u1 - u0);
  [2.52, 2.64, 2.76, 2.88].forEach(v=> box(v, v + 0.014, u0, u1, 'rgba(26,20,46,.42)'));
  for(let u = -3, i = 0; u < u1; u += 0.34 + hsh(i, east ? 4 : 3, 1) * 0.3, i++){ if(u < u0 - 1) continue; const v = [2.4, 2.52, 2.64, 2.76, 2.88][i % 5]; box(v, v + 0.12, u, u + 0.016, 'rgba(26,20,46,.42)'); }
  for(let u = Math.floor(u0) - 1; u < u1 + 1; u += 1){ if(hsh(u, east ? 23 : 21, 1) < 0.3){ const [a, b] = Xr(2.8, 2.98); moss(g, (a + b) / 2, u + hsh(u, 21, 2), 0.08, u * 5 + (east ? 2 : 1)); } }
  box(2.94, 3, u0, u1, east ? 'rgba(255,255,255,.14)' : 'rgba(18,12,30,.36)');
}
/* ---------- a square of wall: its side's piece (8 squares of it), drawn once a size ----------
   key 'cw:<side>:<x>:<y>' (21-castle.js, caGrounds) */
function band(side){ return side === 's' ? 61 : side === 'e' ? 61 : 0; }
function slice(ctx, key, S, px, py, pw, ph){
  const p = key.split(':'), side = p[1], x = +p[2], y = +p[3];
  const s = Math.max(8, Math.min(PIC_MAX_S, Math.round(S))), across = side === 'n' || side === 's';
  const a = across ? x : y, c = Math.floor(a / CH), a0 = c * CH, b0 = band(side);
  const cv = pic(`cw:${side}:${c}@${s}`, across ? CH * s + 2 * RIM : 3 * s + 2 * RIM, across ? 3 * s + 2 * RIM : CH * s + 2 * RIM, g=>{
    if(across) g.setTransform(s, 0, 0, s, RIM - a0 * s, RIM); else g.setTransform(s, 0, 0, s, RIM, RIM - a0 * s);
    const u0 = a0 - RIM / s, u1 = a0 + CH + RIM / s;
    if(side === 's') drawSouth(g, u0, u1);
    else if(side === 'n') drawNorth(g, u0, u1);
    else drawSide(g, u0, u1, side === 'e');
  });
  const sx = RIM + (across ? x - a0 : x - b0) * s, sy = RIM + (across ? y - b0 : y - a0) * s;
  ctx.drawImage(cv, sx, sy, s, s, px, py, pw, ph);
}
/* the north wall's battlements (a deco, kind 'cwCrest', one per eight squares: d.part), drawn once a size */
function crest(g, d, x, y, w, h, k){
  const kc = Math.max(4, Math.min(PIC_MAX_S, Math.round(k))), a0 = d.part * CH;
  const cv = pic(`cwc:${d.part}@${kc}`, CH * kc + 2 * RIM, 1 * kc + 2 * RIM, g2=>{ g2.setTransform(kc, 0, 0, kc, RIM - a0 * kc, RIM + 0.97 * kc); drawCrest(g2, a0 - RIM / kc, a0 + CH + RIM / kc); });
  const s = k / kc;
  g.drawImage(cv, x - RIM * s, y + (d.h - 0.97) * k - RIM * s, cv.width * s, cv.height * s);
}
/* which piece of wall a square of the grounds shows (or null: none) */
function keyAt(x, y){
  if(y <= 2) return `cw:n:${x}:${y}`;
  if(y >= N - 3) return `cw:s:${x}:${y}`;
  if(x <= 2) return `cw:w:${x}:${y}`;
  if(x >= N - 3) return `cw:e:${x}:${y}`;
  return null;
}

/* ---------- the gatehouse ----------
   Over the gate's squares in the south wall (x 30–33): its rect 26.6–37.4 across, 59.2–64 down, drawn in the
   grounds' squares. Two drum towers either side (their middles at 28.3 and 35.7), the gate's block between them with
   its battlements and machicolations, the royal arms, the arch with the portcullis drawn up into it and the oak
   doors open, banners, and a torch either side (burning: drawn each time, gateFlames). */
const GH = { x:26.6, y:59.2, w:10.8, h:4.8, towers:[28.3, 35.7], tr:1.35 };
function drawGatehouse(g){
  /* the block between the towers */
  const L = 29.0, Rt = 35.0, top = 61.0, foot = 63.72;
  g.fillStyle = 'rgba(20,14,30,.3)'; g.fillRect(L, foot, Rt - L, 0.28);
  courses(g, L, Rt, top, foot, 0.22, 811, { base:sh(ST.stone, 0.03) });
  g.fillStyle = lin(g, 0, top, 0, foot, [[0, 'rgba(24,16,44,0)'], [1, 'rgba(24,16,44,.18)']]); g.fillRect(L, top, Rt - L, foot - top);
  /* its battlements, higher than the walls' */
  capH(g, L, Rt, 60.62, 60.84, 813);
  courses(g, L, Rt, 60.84, 61.0, 0.16, 815, { min:0.3, span:0.3 });
  for(let i = 0; i < 6; i++){ const a = L + 0.12 + i * 1.0, b = a + 0.6;
    g.fillStyle = 'rgba(28,22,50,.24)'; g.fillRect(b, 60.5, 0.14, 0.34);
    courses(g, a, b, 60.42, 61.0, 0.19, 817 + i, { min:0.28, span:0.3 });
    g.fillStyle = lin(g, 0, 60.24, 0, 60.44, [[0, ST.capL], [1, ST.capD]]); rr(g, a - 0.025, 60.24, b - a + 0.05, 0.2, 0.03); g.fill(); }
  /* machicolations: the parapet out on corbels, the slots between them */
  R(g, L, 61.0, Rt - L, 0.1, ST.cap); R(g, L, 61.0, Rt - L, 0.02, ST.capL);
  for(let u = L + 0.1; u < Rt - 0.1; u += 0.42){ R(g, u, 61.1, 0.2, 0.2, sh(ST.stone, 0.06)); R(g, u + 0.2, 61.1, 0.22, 0.17, '#1d1a26'); R(g, u, 61.28, 0.2, 0.02, 'rgba(24,16,44,.35)'); }
  /* the arch: its dark passage, the paving going in, the doors folded back, the portcullis drawn up */
  const aL = 30.4, aR = 33.6, spring = 62.62, crown = 61.95, mid = (aL + aR) / 2;
  const archPath = ()=>{ g.beginPath(); g.moveTo(aL, 64); g.lineTo(aL, spring); g.quadraticCurveTo(aL, crown + 0.05, mid, crown); g.quadraticCurveTo(aR, crown + 0.05, aR, spring); g.lineTo(aR, 64); g.closePath(); };
  g.save(); archPath(); g.clip();
  g.fillStyle = lin(g, 0, crown, 0, 64, [[0, '#120f18'], [0.65, '#241f2e'], [1, '#4a4452']]); g.fillRect(aL, crown, aR - aL, 64 - crown);
  g.fillStyle = 'rgba(255,214,140,.16)'; g.beginPath(); g.ellipse(mid, 62.9, 0.7, 0.45, 0, 0, TAU); g.fill();                     // the grounds' light at its far end
  for(let r = 0; r < 4; r++){ const yy = 63.25 + r * 0.19; for(let c = 0; c < 8; c++){ const xx = aL + (c + (r % 2) * 0.5) * 0.42; ell(g, xx, yy, 0.17, 0.07, `rgba(150,140,160,${(0.18 + r * 0.08).toFixed(2)})`); } }
  [[aL, 1], [aR, -1]].forEach(([e, d])=>{ g.fillStyle = lin(g, e, 0, e + d * 0.5, 0, [[0, ST.woodD], [1, ST.wood]]); g.beginPath(); g.moveTo(e, 62.55); g.lineTo(e + d * 0.48, 62.75); g.lineTo(e + d * 0.48, 63.95); g.lineTo(e, 64); g.closePath(); g.fill();
    for(let q = 0; q < 3; q++){ const yy = 62.85 + q * 0.38; g.strokeStyle = ST.iron; g.lineWidth = 0.035; g.beginPath(); g.moveTo(e, yy - 0.04); g.lineTo(e + d * 0.48, yy + 0.02); g.stroke(); }
    for(let q = 0; q < 5; q++) ell(g, e + d * 0.24, 62.8 + q * 0.24, 0.018, 0.018, ST.ironL); });
  g.strokeStyle = '#3a3742'; g.lineWidth = 0.05;
  for(let u = aL + 0.25; u < aR; u += 0.36){ g.beginPath(); g.moveTo(u, crown - 0.1); g.lineTo(u, 62.45); g.stroke(); g.fillStyle = '#3a3742'; g.beginPath(); g.moveTo(u - 0.05, 62.42); g.lineTo(u, 62.58); g.lineTo(u + 0.05, 62.42); g.closePath(); g.fill(); }
  for(let v = crown + 0.12; v < 62.45; v += 0.16){ g.beginPath(); g.moveTo(aL, v); g.lineTo(aR, v); g.stroke(); }
  g.strokeStyle = 'rgba(160,150,175,.35)'; g.lineWidth = 0.012; for(let u = aL + 0.25; u < aR; u += 0.36){ g.beginPath(); g.moveTo(u - 0.018, crown); g.lineTo(u - 0.018, 62.42); g.stroke(); }
  g.restore();
  /* the arch's stones, its keystone with the King's sun */
  g.strokeStyle = sh(ST.stone, 0.12); g.lineWidth = 0.2; archPath(); g.stroke();
  g.strokeStyle = 'rgba(40,30,60,.45)'; g.lineWidth = 0.012;
  for(let q = 0; q <= 12; q++){ const t = q / 12, a = Math.PI * (1 - t), x0 = mid + Math.cos(a) * 1.6, y0 = spring - Math.sin(a) * (spring - crown); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(a) * 0.12, y0 - Math.sin(a) * 0.12); g.stroke(); }
  g.fillStyle = ST.capL; g.beginPath(); g.moveTo(mid - 0.14, crown - 0.16); g.lineTo(mid + 0.14, crown - 0.16); g.lineTo(mid + 0.09, crown + 0.1); g.lineTo(mid - 0.09, crown + 0.1); g.closePath(); g.fill();
  sun(g, mid, crown - 0.03, 0.07);
  /* the royal arms over the arch, between two banners */
  const sy = 61.42;
  g.fillStyle = 'rgba(20,14,30,.3)'; rr(g, mid - 0.34, sy - 0.02, 0.72, 0.5, 0.05); g.fill();
  g.fillStyle = ST.capL; rr(g, mid - 0.36, sy - 0.04, 0.72, 0.5, 0.05); g.fill();
  g.fillStyle = lin(g, mid - 0.22, 0, mid + 0.22, 0, [[0, ST.blueL], [1, ST.blue]]); g.beginPath(); g.moveTo(mid - 0.22, sy + 0.02); g.lineTo(mid + 0.22, sy + 0.02); g.lineTo(mid + 0.22, sy + 0.2); g.quadraticCurveTo(mid + 0.2, sy + 0.36, mid, sy + 0.42); g.quadraticCurveTo(mid - 0.2, sy + 0.36, mid - 0.22, sy + 0.2); g.closePath(); g.fill();
  g.strokeStyle = ST.gold; g.lineWidth = 0.025; g.stroke();
  crownAt(g, mid, sy + 0.2, 0.2);
  banner(g, 29.88, 61.32, 0.42, 0.98); banner(g, 34.12, 61.32, 0.42, 0.98);
  /* torch brackets either side of the arch (their flames: gateFlames) */
  [aL - 0.22, aR + 0.22].forEach(u=>{ R(g, u - 0.03, 62.62, 0.06, 0.22, ST.iron); g.fillStyle = ST.iron; g.beginPath(); g.moveTo(u - 0.09, 62.5); g.lineTo(u + 0.09, 62.5); g.lineTo(u + 0.05, 62.64); g.lineTo(u - 0.05, 62.64); g.closePath(); g.fill(); });
  /* the drum towers, in front */
  GH.towers.forEach((c, i)=> drum(g, c, GH.tr, 59.86, 63.68, 830 + i));
  /* the plinth along its foot */
  g.fillStyle = 'rgba(20,14,30,.35)'; g.fillRect(L - 1.4, 63.94, Rt - L + 2.8, 0.06);
}
/* a drum tower: its middle at u, radius r, its top ellipse at vt, its foot at vb */
function drum(g, u, r, vt, vb, seed){
  const ry = r * 0.36;
  g.fillStyle = 'rgba(20,14,30,.3)'; g.beginPath(); g.ellipse(u + 0.2, vb + 0.05, r * 1.05, ry * 0.7, 0, 0, TAU); g.fill();
  /* the body, round: courses curving with it, lit from the left */
  g.save(); g.beginPath(); g.moveTo(u - r, vt); g.lineTo(u + r, vt); g.lineTo(u + r, vb); g.ellipse(u, vb, r, ry, 0, 0, Math.PI); g.closePath(); g.clip();
  g.fillStyle = lin(g, u - r, 0, u + r, 0, [[0, sh(ST.stone, -0.1)], [0.22, sh(ST.stone, 0.18)], [0.5, ST.stone], [0.85, sh(ST.stone, -0.22)], [1, sh(ST.stone, -0.32)]]); g.fillRect(u - r, vt, 2 * r, vb - vt + ry);
  for(let v = vt + 0.5, row = 0; v < vb + ry; v += 0.22, row++){
    g.strokeStyle = 'rgba(40,32,62,.32)'; g.lineWidth = 0.014; g.beginPath(); g.ellipse(u, v, r, ry * 0.5, 0, 0.04, Math.PI - 0.04); g.stroke();
    for(let j = 0; j < 7; j++){ const a = (j + (row % 2) * 0.5 + 0.3) / 7 * Math.PI, x = u - Math.cos(a) * r; g.beginPath(); g.moveTo(x, v - 0.22 + ry * 0.5 * Math.sin(a)); g.lineTo(x, v + ry * 0.5 * Math.sin(a)); g.stroke();
      if(hsh(seed, row * 7 + j, 1) < 0.2){ g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, v - 0.2 + ry * 0.5 * Math.sin(a), Math.abs(Math.cos(a)) * r * 0.25 + 0.08, 0.18); } }
  }
  g.fillStyle = lin(g, 0, vt, 0, vb, [[0, 'rgba(24,16,44,0)'], [1, 'rgba(24,16,44,.2)']]); g.fillRect(u - r, vt, 2 * r, vb - vt + ry);
  g.restore();
  /* arrow slits, two rows */
  [[-0.35, 61.2], [0.42, 61.35], [0, 62.45]].forEach(([d, v])=> slit(g, u + d * r, v, v + 0.5));
  /* corbels under its parapet, the parapet, its ring of merlons round a flagged top */
  for(let j = 0; j < 9; j++){ const a = (j + 0.5) / 9 * Math.PI, x = u - Math.cos(a) * r * 1.02, yv = vt + 0.5 + ry * 0.5 * Math.sin(a); R(g, x - 0.06, yv, 0.12, 0.16, sh(ST.stone, 0.05)); R(g, x - 0.06, yv + 0.14, 0.12, 0.02, 'rgba(24,16,44,.35)'); }
  const pr = r * 1.06;
  g.fillStyle = lin(g, u - pr, 0, u + pr, 0, [[0, sh(ST.stone, 0.05)], [0.3, sh(ST.stone, 0.2)], [1, sh(ST.stone, -0.25)]]);
  g.beginPath(); g.ellipse(u, vt + 0.5, pr, ry, 0, 0, Math.PI); g.lineTo(u - pr, vt); g.ellipse(u, vt, pr, ry, 0, Math.PI, 0, true); g.closePath(); g.fill();
  ell(g, u, vt, pr, ry, ST.cap);
  ell(g, u, vt, pr - 0.16, ry - 0.07, sh(ST.walk, -0.12));
  g.strokeStyle = 'rgba(60,50,80,.3)'; g.lineWidth = 0.01; for(let q = 1; q < 4; q++){ g.beginPath(); g.ellipse(u, vt, (pr - 0.16) * q / 4, (ry - 0.07) * q / 4, 0, 0, TAU); g.stroke(); }
  const merl = (front)=>{ for(let j = 0; j < 12; j++){ const a = j / 12 * TAU + 0.13, s = Math.sin(a); if(front ? s < 0 : s >= 0) continue;
    const x = u + Math.cos(a) * pr * 0.93, yv = vt + s * ry * 0.93, w = 0.16 + 0.2 * Math.abs(s);
    const lit = Math.cos(a) < 0 ? 0.12 : -0.15;
    R(g, x - w / 2, yv - 0.4, w, 0.4, sh(ST.stone, lit)); R(g, x - w / 2, yv - 0.46, w, 0.07, ST.capL); R(g, x + w / 2 - 0.03, yv - 0.4, 0.03, 0.4, 'rgba(24,16,44,.25)'); } };
  merl(false); merl(true);
  /* its pole and pennant (drawn with the flames) */
}
function sun(g, x, y, r){ g.strokeStyle = ST.gold; g.lineWidth = r * 0.2; for(let i = 0; i < 8; i++){ const a = i / 8 * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2); g.lineTo(x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7); g.stroke(); } ell(g, x, y, r, r, ST.gold); ell(g, x - r * 0.25, y - r * 0.25, r * 0.4, r * 0.4, ST.goldL); }
function crownAt(g, x, y, w){ g.fillStyle = ST.gold; g.beginPath(); g.moveTo(x - w / 2, y + w * 0.3); g.lineTo(x - w / 2 - w * 0.04, y - w * 0.25); g.lineTo(x - w / 4, y + w * 0.02); g.lineTo(x, y - w * 0.38); g.lineTo(x + w / 4, y + w * 0.02); g.lineTo(x + w / 2 + w * 0.04, y - w * 0.25); g.lineTo(x + w / 2, y + w * 0.3); g.closePath(); g.fill(); R(g, x - w / 2, y + w * 0.22, w, w * 0.1, ST.goldL); }
/* what moves on it: the torches' flames, the drum towers' pennants */
function gateFlames(g, x, y, k, t){
  const P = (u, v)=> [x + (u - GH.x) * k, y + (v - GH.y) * k];
  [30.18, 33.82].forEach((u, i)=>{ const [fx, fy] = P(u, 62.5), f = 1 + 0.15 * Math.sin(t * 9 + i * 2) + 0.08 * Math.sin(t * 23 + i), r = k * 0.07;
    g.fillStyle = `rgba(255,190,110,${(0.18 * f).toFixed(3)})`; g.beginPath(); g.ellipse(fx, fy, k * 0.35, k * 0.3, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,120,30,.9)'; g.beginPath(); g.moveTo(fx - r, fy); g.quadraticCurveTo(fx - r, fy - r * 1.4 * f, fx + Math.sin(t * 5 + i) * r * 0.3, fy - r * 2.5 * f); g.quadraticCurveTo(fx + r, fy - r * 1.4 * f, fx + r, fy); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,225,130,.95)'; g.beginPath(); g.moveTo(fx - r * 0.5, fy); g.quadraticCurveTo(fx - r * 0.5, fy - r * f, fx, fy - r * 1.7 * f); g.quadraticCurveTo(fx + r * 0.5, fy - r * f, fx + r * 0.5, fy); g.closePath(); g.fill(); });
  GH.towers.forEach((u, i)=>{ const [px, py] = P(u, 59.86), sway = Math.sin(t * 2 + i * 1.7) * k * 0.12;
    g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1, k * 0.04); g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - k * 1.15); g.stroke();
    g.fillStyle = ST.royal; g.beginPath(); g.moveTo(px, py - k * 1.15); g.quadraticCurveTo(px + k * 0.4, py - k * 1.12 + sway * 0.3, px + k * 0.75 + sway, py - k * 0.95); g.quadraticCurveTo(px + k * 0.4, py - k * 0.8, px, py - k * 0.75); g.closePath(); g.fill(); });
}
function gatehouse(g, d, x, y, w, h, k, t){
  const kc = Math.max(4, Math.min(PIC_MAX_S, Math.round(k))), M = 0.3;
  const cv = pic(`gatehouse@${kc}`, (GH.w + 2 * M) * kc, (GH.h + 2 * M) * kc, g2=>{ g2.setTransform(kc, 0, 0, kc, (M - GH.x) * kc, (M - GH.y) * kc); drawGatehouse(g2); });
  const s = k / kc;
  g.drawImage(cv, x - M * k, y - M * k, cv.width * s, cv.height * s);
  gateFlames(g, x, y, k, t);
}

/* ---------- the corner towers: round, their tops a flagged platform ringed with battlements ----------
   (23-castle-art.js asks for these, in place of its own, for d.kind 'cornerTower': rect x, y, w, h in pixels, k a
   square.) The top's middle 2.3 squares down the rect, the foot's 1.3 up from its bottom; radius 0.43 of its width. */
function towerGeo(d, x, y, w, h, k){
  const cx = x + w / 2, r = w * 0.43, ry = r * 0.36, ty = y + 2.3 * k, by = y + h - 1.3 * k;
  return { cx, r, ry, ty, by };
}
function cornerBody(g, d, x, y, w, h, k){
  const { cx, r, ry, ty, by } = towerGeo(d, x, y, w, h, k), seed = Math.round(d.x * 13 + d.y * 7);
  /* its shadow, to the lower right */
  g.fillStyle = 'rgba(20,14,30,.28)'; g.beginPath(); g.ellipse(cx + k * 0.5, by + ry * 0.35, r * 1.1, ry * 0.95, 0, 0, TAU); g.fill();
  /* the sloping foot */
  const fr = r * 1.08, fy = by - 0.75 * k;
  g.fillStyle = lin(g, cx - fr, 0, cx + fr, 0, [[0, sh(ST.stone, -0.05)], [0.25, sh(ST.stone, 0.16)], [0.6, ST.stone], [1, sh(ST.stone, -0.32)]]);
  g.beginPath(); g.moveTo(cx - r, fy); g.lineTo(cx + r, fy); g.lineTo(cx + fr, by); g.ellipse(cx, by, fr, ry, 0, 0, Math.PI); g.lineTo(cx - r, fy); g.closePath(); g.fill();
  g.strokeStyle = ST.capL; g.lineWidth = Math.max(1, k * 0.025); g.beginPath(); g.ellipse(cx, fy, r, ry * 0.92, 0, 0.05, Math.PI - 0.05); g.stroke();
  /* the body, round, coursed, lit from the left */
  g.save(); g.beginPath(); g.moveTo(cx - r, ty); g.lineTo(cx + r, ty); g.lineTo(cx + r, fy); g.ellipse(cx, fy, r, ry * 0.92, 0, 0, Math.PI); g.closePath(); g.clip();
  g.fillStyle = lin(g, cx - r, 0, cx + r, 0, [[0, sh(ST.stone, -0.12)], [0.18, sh(ST.stone, 0.16)], [0.45, ST.stone], [0.82, sh(ST.stone, -0.24)], [1, sh(ST.stone, -0.36)]]); g.fillRect(cx - r, ty, 2 * r, fy - ty + ry);
  const course = 0.36 * k;
  for(let yy = ty + course, row = 0; yy < fy + ry; yy += course, row++){
    g.strokeStyle = 'rgba(40,32,62,.3)'; g.lineWidth = Math.max(1, k * 0.016); g.beginPath(); g.ellipse(cx, yy, r, ry * 0.92, 0, 0.03, Math.PI - 0.03); g.stroke();
    for(let j = 0; j < 9; j++){
      const a = (j + (row % 2) * 0.5 + 0.25) / 9 * Math.PI, jx = cx - Math.cos(a) * r, dy = ry * 0.92 * Math.sin(a);
      g.beginPath(); g.moveTo(jx, yy - course + dy); g.lineTo(jx, yy + dy); g.stroke();
      const f = hsh(seed, row * 9 + j, 1);
      if(f < 0.22){ g.fillStyle = f < 0.11 ? 'rgba(255,255,255,.09)' : 'rgba(40,30,60,.08)'; g.fillRect(jx, yy - course + dy + 1, Math.abs(Math.cos(a)) * r * 0.2 + k * 0.12, course - 2); }
    }
  }
  g.fillStyle = lin(g, 0, ty, 0, fy, [[0, 'rgba(24,16,44,0)'], [0.75, 'rgba(24,16,44,.06)'], [1, 'rgba(24,16,44,.2)']]); g.fillRect(cx - r, ty, 2 * r, fy - ty + ry);
  /* a stain under each spout, moss low down */
  [-0.5, 0.15, 0.62].forEach((f, i)=>{ const sx = cx + f * r; g.fillStyle = lin(g, 0, ty + 0.9 * k, 0, ty + 4 * k, [[0, 'rgba(40,46,40,.28)'], [1, 'rgba(40,46,40,0)']]); g.fillRect(sx - 0.06 * k, ty + 0.9 * k, 0.12 * k, 3.1 * k); });
  for(let i = 0; i < 9; i++){ const a = (0.08 + 0.84 * hsh(seed, i, 3)) * Math.PI, mx = cx - Math.cos(a) * r * 0.95, my = fy - k * (0.2 + 0.7 * hsh(seed, i, 4)) + ry * 0.9 * Math.sin(a);
    for(let q = 0; q < 4; q++){ g.fillStyle = ST.moss[q % 3]; g.beginPath(); g.ellipse(mx + (hsh(seed, i * 4 + q, 5) - 0.5) * k * 0.3, my + (hsh(seed, i * 4 + q, 6) - 0.5) * k * 0.1, k * 0.09, k * 0.05, 0, 0, TAU); g.fill(); } }
  g.restore();
  /* arrow slits, three rows, staggered */
  [[-0.55, 0.32], [0.1, 0.3], [0.62, 0.36], [-0.25, 0.52], [0.38, 0.55], [-0.62, 0.72], [0.05, 0.74], [0.6, 0.76]].forEach(([f, t])=>{
    const sx = cx + f * r, sv = ty + (fy - ty) * t, sw = Math.sqrt(1 - f * f);
    g.save(); g.translate(sx, sv); g.scale(Math.max(0.35, sw), 1); g.scale(k, k); slit(g, 0, 0, 0.62); g.restore(); });
  /* a door at its foot, on the castle's side, for the north towers (towerDoors: its x) */
  if(d.door != null){
    const dx = x + (d.door - d.x) * k, dw = 0.62 * k, dt = fy - 0.25 * k, db = by + ry * 0.55;
    g.fillStyle = sh(ST.stone, 0.1); g.beginPath(); g.moveTo(dx - dw * 0.68, db); g.lineTo(dx - dw * 0.68, dt - dw * 0.2); g.quadraticCurveTo(dx, dt - dw * 1.05, dx + dw * 0.68, dt - dw * 0.2); g.lineTo(dx + dw * 0.68, db); g.closePath(); g.fill();
    g.fillStyle = lin(g, dx - dw / 2, 0, dx + dw / 2, 0, [[0, ST.woodL], [1, ST.woodD]]); g.beginPath(); g.moveTo(dx - dw / 2, db); g.lineTo(dx - dw / 2, dt); g.quadraticCurveTo(dx, dt - dw * 0.7, dx + dw / 2, dt); g.lineTo(dx + dw / 2, db); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,16,6,.5)'; g.lineWidth = Math.max(1, k * 0.012); for(let q = 1; q < 4; q++){ g.beginPath(); g.moveTo(dx - dw / 2 + q * dw / 4, dt - dw * 0.25 * Math.sin(q / 4 * Math.PI)); g.lineTo(dx - dw / 2 + q * dw / 4, db); g.stroke(); }
    [0.35, 0.7].forEach(f=> R(g, dx - dw / 2, dt + (db - dt) * f, dw, k * 0.05, ST.iron));
    ell(g, dx + dw * 0.28, dt + (db - dt) * 0.55, k * 0.03, k * 0.03, ST.gold);
  }
  /* corbels round its top, the parapet out on them */
  const pr = r * 1.06;
  for(let j = 0; j < 15; j++){ const a = (j + 0.5) / 15 * Math.PI, ex = cx - Math.cos(a) * r * 1.01, ey = ty + 0.42 * k + ry * Math.sin(a); R(g, ex - 0.07 * k, ey, 0.14 * k, 0.24 * k, sh(ST.stone, Math.cos(a) > 0 ? 0.08 : -0.12)); R(g, ex - 0.07 * k, ey + 0.21 * k, 0.14 * k, 0.03 * k, 'rgba(24,16,44,.35)'); }
  g.fillStyle = lin(g, cx - pr, 0, cx + pr, 0, [[0, sh(ST.stone, 0.02)], [0.25, sh(ST.stone, 0.2)], [0.6, ST.stone], [1, sh(ST.stone, -0.3)]]);
  g.beginPath(); g.ellipse(cx, ty + 0.45 * k, pr, ry, 0, 0, Math.PI); g.lineTo(cx - pr, ty); g.ellipse(cx, ty, pr, ry, 0, Math.PI, 0, true); g.closePath(); g.fill();
  /* the platform: a ring of cap stones round its flags, the hatch to the stair, a compass rose let in */
  ell(g, cx, ty, pr, ry, ST.cap);
  const ir = pr - 0.42 * k, iry = ry - 0.15 * k;
  ell(g, cx, ty, ir, iry, sh(ST.walk, -0.06));
  g.save(); g.beginPath(); g.ellipse(cx, ty, ir, iry, 0, 0, TAU); g.clip();
  g.strokeStyle = 'rgba(60,50,80,.32)'; g.lineWidth = Math.max(1, k * 0.012);
  for(let q = 1; q < 5; q++){ g.beginPath(); g.ellipse(cx, ty, ir * q / 5, iry * q / 5, 0, 0, TAU); g.stroke(); }
  for(let q = 0; q < 16; q++){ const a = q / 16 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * ir * 0.2, ty + Math.sin(a) * iry * 0.2); g.lineTo(cx + Math.cos(a) * ir, ty + Math.sin(a) * iry); g.stroke(); }
  g.fillStyle = 'rgba(28,22,50,.2)'; g.beginPath(); g.ellipse(cx, ty - iry * 0.25, ir, iry * 0.85, 0, 0, Math.PI, true); g.fill();   // the shade of its back battlements
  ell(g, cx - ir * 0.3, ty - iry * 0.1, ir * 0.22, iry * 0.22, '#d8d4e2'); g.fillStyle = '#8a3040'; g.beginPath(); g.moveTo(cx - ir * 0.3, ty - iry * 0.32); g.lineTo(cx - ir * 0.27, ty - iry * 0.1); g.lineTo(cx - ir * 0.33, ty - iry * 0.1); g.closePath(); g.fill();
  g.fillStyle = '#4a4560'; g.beginPath(); g.moveTo(cx - ir * 0.3, ty + iry * 0.12); g.lineTo(cx - ir * 0.27, ty - iry * 0.1); g.lineTo(cx - ir * 0.33, ty - iry * 0.1); g.closePath(); g.fill();
  g.fillStyle = '#1d1a26'; g.beginPath(); g.ellipse(cx + ir * 0.42, ty + iry * 0.28, ir * 0.24, iry * 0.3, 0, 0, TAU); g.fill();
  g.strokeStyle = ST.gold; g.lineWidth = Math.max(1, k * 0.025); g.beginPath(); g.ellipse(cx + ir * 0.42, ty + iry * 0.28, ir * 0.24, iry * 0.3, 0, Math.PI, 0); g.stroke();
  for(let q = 0; q < 4; q++){ R(g, cx + ir * (0.25 + q * 0.06), ty + iry * (0.18 + q * 0.07), ir * 0.1, k * 0.025, 'rgba(160,150,175,.4)'); }
  g.restore();
  /* the battlements round it: the far ones first (their inner faces, in the light), then the near ones */
  const merl = (front)=>{ for(let j = 0; j < 18; j++){
    const a = (j + 0.5) / 18 * TAU, s = Math.sin(a); if(front ? s <= 0 : s > 0) continue;
    const mx = cx + Math.cos(a) * (pr - 0.2 * k), my = ty + s * (ry - 0.07 * k), mw = k * (0.22 + 0.3 * Math.abs(s)), mh = 0.52 * k;
    const tone = front ? (Math.cos(a) < 0 ? 0.14 : -0.2 + Math.cos(a) * -0.1) : (Math.cos(a) > 0 ? 0.08 : -0.12);
    g.fillStyle = 'rgba(28,22,50,.2)'; g.fillRect(mx + mw / 2, my - mh * 0.8, k * 0.1, mh * 0.8);
    R(g, mx - mw / 2, my - mh, mw, mh, sh(ST.stone, tone));
    R(g, mx - mw / 2, my - mh - 0.08 * k, mw, 0.1 * k, front ? ST.capL : ST.cap);
    R(g, mx - mw / 2, my - mh * 0.45, mw, Math.max(1, k * 0.012), 'rgba(40,32,62,.3)');
    if(front && Math.abs(Math.cos(a)) < 0.6 && j % 2 === 0){ g.fillStyle = '#1d1a26'; rr(g, mx - 0.025 * k, my - mh * 0.78, 0.05 * k, mh * 0.55, 0.025 * k); g.fill(); }
  } };
  merl(false);
  g.fillStyle = sh(ST.stone, -0.06); g.beginPath(); g.ellipse(cx, ty, pr, ry, 0, 0, Math.PI); g.ellipse(cx, ty, pr - 0.16 * k, ry - 0.06 * k, 0, Math.PI, 0, true); g.closePath(); g.fill();
  merl(true);
}
function cornerFlag(g, d, x, y, w, h, k, t){
  const { cx, ty } = towerGeo(d, x, y, w, h, k), sway = Math.sin(t * 2 + d.x) * k * 0.15, top = ty - 0.25 * k;
  g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1, k * 0.05); g.beginPath(); g.moveTo(cx, ty - 0.1 * k); g.lineTo(cx, top - 2.2 * k); g.stroke();
  ell(g, cx, top - 2.22 * k, k * 0.06, k * 0.06, ST.gold);
  g.fillStyle = ST.blue; g.beginPath(); g.moveTo(cx, top - 2.15 * k); g.quadraticCurveTo(cx + k * 0.6, top - 2.1 * k + sway * 0.3, cx + k * 1.15 + sway, top - 1.85 * k); g.quadraticCurveTo(cx + k * 0.6, top - 1.62 * k, cx, top - 1.5 * k); g.closePath(); g.fill();
  g.fillStyle = ST.goldL; g.beginPath(); g.moveTo(cx, top - 2.15 * k); g.quadraticCurveTo(cx + k * 0.6, top - 2.1 * k + sway * 0.3, cx + k * 1.15 + sway, top - 1.85 * k); g.lineTo(cx + k * 1.0 + sway, top - 1.86 * k); g.quadraticCurveTo(cx + k * 0.55, top - 2.03 * k, cx, top - 2.05 * k); g.closePath(); g.fill();
}

/* ---------- from the jungle: the castle as it is inside ----------
   jgPaintLayer asks, with its layer's corner (x0, y0) in the jungle's squares and k a square's pixels: the grounds'
   squares and what stands on them, where the castle is (jgGround().places.castle — the grounds square for square),
   then a shade where the walls stand on the road. `over`: only what rises over the road beyond the castle's top
   (the corner towers' tops), for the layer over everyone. */
const _jgSpr = { S:0, A:null };
function sprAt(key, S){
  if(_jgSpr.S !== S || !_jgSpr.A){ _jgSpr.S = S; _jgSpr.A = new Map(); }
  let c = _jgSpr.A.get(key);
  if(!c){ c = document.createElement('canvas'); c.width = c.height = S; caDrawSprite(c.getContext('2d'), key, S); _jgSpr.A.set(key, c); }
  return c;
}
function jungle(ctx, x0, y0, x1, y1, k, now){
  if(typeof jgGround !== 'function' || typeof caGrounds !== 'function') return;
  const C = jgGround().places.castle, m = caGrounds(), S = Math.max(8, Math.round(k));
  if(x1 < C.x - 2 || x0 > C.x + C.w + 2 || y1 < C.y - 3 || y0 > C.y + C.h + 2) return;
  const gx0 = Math.max(0, x0 - C.x), gy0 = Math.max(0, y0 - C.y), gx1 = Math.min(m.W - 1, x1 - C.x), gy1 = Math.min(m.H - 1, y1 - C.y);
  const PX = gx=> Math.round((C.x + gx - x0) * k), PY = gy=> Math.round((C.y + gy - y0) * k);
  for(let gy = gy0; gy <= gy1; gy++){
    const py = PY(gy), ph = PY(gy + 1) - py;
    for(let gx = gx0; gx <= gx1; gx++){
      const px = PX(gx), pw = PX(gx + 1) - px, i = gy * m.W + gx, t = m.g[i];
      let key = m.spr[i];
      if(key === 'water' || t === CA_T.WATER) key = 'water:0';
      if(key && /^(bld|pal):/.test(key)) CA_ART.bldSlice(ctx, key, S, px, py, pw, ph);
      else if(key && key.startsWith('cw:')) slice(ctx, key, S, px, py, pw, ph);
      else if(key) ctx.drawImage(sprAt(key, S), px, py, pw, ph);
      caEdges(ctx, m, gx, gy, t, px, py, pw, ph);
    }
  }
  /* the walls' shade on the road: under the south face, beside the east wall (the light is from the upper left) */
  const ox = (C.x - x0) * k, oy = (C.y - y0) * k;
  let gr = ctx.createLinearGradient(0, oy + C.h * k, 0, oy + (C.h + 0.7) * k); gr.addColorStop(0, 'rgba(20,14,30,.42)'); gr.addColorStop(1, 'rgba(20,14,30,0)');
  ctx.fillStyle = gr; ctx.fillRect(ox, oy + C.h * k, C.w * k, 0.7 * k);
  gr = ctx.createLinearGradient(ox + C.w * k, 0, ox + (C.w + 0.9) * k, 0); gr.addColorStop(0, 'rgba(20,14,30,.34)'); gr.addColorStop(1, 'rgba(20,14,30,0)');
  ctx.fillStyle = gr; ctx.fillRect(ox + C.w * k, oy + 0.4 * k, 0.9 * k, (C.h + 0.3) * k);
  gr = ctx.createLinearGradient(ox, 0, ox - 0.25 * k, 0); gr.addColorStop(0, 'rgba(20,14,30,.22)'); gr.addColorStop(1, 'rgba(20,14,30,0)');
  ctx.fillStyle = gr; ctx.fillRect(ox - 0.25 * k, oy, 0.25 * k, C.h * k);
  /* what stands up in it, back to front */
  const t = now || 0;
  m.deco.forEach(d=>{
    if(C.x + d.x + d.w < x0 - 1 || C.x + d.x > x1 + 1 || C.y + d.y + d.h < y0 - 1 || C.y + d.y > y1 + 1) return;
    caDrawDeco(ctx, d, (C.x + d.x - x0) * k, (C.y + d.y - y0) * k, d.w * k, d.h * k, t);
  });
}
function jungleOver(g, x0, y0, x1, y1, k, now){
  if(typeof jgGround !== 'function' || typeof caGrounds !== 'function') return;
  const C = jgGround().places.castle, m = caGrounds();
  if(x1 < C.x - 2 || x0 > C.x + C.w + 2 || y1 < C.y - 4 || y0 > C.y + 12) return;
  m.deco.forEach(d=>{
    if(d.y >= 0) return;                                             // only what rises above the castle's top edge
    if(C.x + d.x + d.w < x0 - 1 || C.x + d.x > x1 + 1 || C.y + d.y + d.h < y0 - 1 || C.y + d.y > y1 + 1) return;
    caDrawDeco(g, d, (C.x + d.x - x0) * k, (C.y + d.y - y0) * k, d.w * k, d.h * k, now || 0);
  });
}

return { slice, keyAt, crest, gatehouse, GH, cornerBody, cornerFlag, jungle, jungleOver };
})();
