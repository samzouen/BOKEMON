/* ============================================================
   43-the-duel.js — THE ERASER BEAM, AND LUCESCO'S ANSWER TO IT (4.59)
   The designer, 2026-11-17:
     "5. Can we change Wadjet's laser style please? Remove all references to prismatic laser, instead make it a black
        beam with purple-red outline. Let's call it the eraser beam. Style the charging after a black hole."
     "8. When wadjet starts charging his second eraser beam after the princess evolves, get Lucesco to tell the player
        to lend him energy to supercharge his glare with the power of his monsters' cores. A subtext tells the player to
        press his glare as quickly in succession as they can, and the player has to tap the glare button rapidly (show a
        hand emoticon simulating the pressing action on the laser with a press impact and animation until the player
        starts tapping the button. Lucesco starts glowing bright galaxy red (inside his silhouette, like his rift ambush
        turns him galaxy purple, and surrounded by a white-red glow that grows) according to the number of charges.
        Make the every button press add one count to the hidden charge (don't show the number of charges) and require
        30 charges to fully charge for the next part of the story. No other buttons take any action, not even back to
        region or hamburger menu. Give a decay of 3 charges per 2 seconds and make Lucesco glow brighter red with a
        brighter aura when the charge count increases. Give a hidden time limit of 10 seconds. Lucesco hurries the
        player at intervals without the dialogue blocking the charge button. If the 10 second deadline is crossed,
        Lucesco cries, 'Look out!' And camera pans to wadjet, who fires a beam and hits the castle with a large shaking
        then black explosion and fade to black which holds 3 seconds. Text appears, 'Game over. Try again.' Then, reset
        to wadjet charging his eraser beam and Lucesco asking the player to lend him energy to supercharge his glare."
     "9. Once Lucesco gains the necessary charges within the time limit, At the maximum count, make him fire his laser
        at Wadjet, who fires back at him directly instead of the princess. Their lasers clash with bright flash which
        dims back to the clashing pulsing glow with sparks flying out between the lasers. Lucesco asks for more power,
        and the player must tap the laser to maintain and overcome the deadlock. The laser reaches Lucesco and explodes
        into game over and reset at 0. Midpoint is a value of 20. At 40, the laser pushes to wadjet and destroys him
        with a large explosion … the value drops by 3 per second and at the 28 count and 33 and 39 count it increase
        to a 9, 14, and 20 drop per second for 2 seconds so the player has to fight harder. Each time it temporarily
        increases, make wadjet's beam larger and glow brighter."
   Here: the pictures — his black hole, his beam, the blasts, the smoke, Lucesco's red galaxy — and the two tapping
   fights (the charge, the deadlock). 41-the-stand.js tells the story round them; 42-the-hunt.js borrows the blasts.
   The readings taken: the deadlock lost ("reset at 0") is the same game over, and from the start of the charge again,
   no charge kept. Each surge comes once a try (the first time the deadlock reaches 28, 33, 39). Both clocks run in the
   game's time: not while the app is away or an eye break is on.
   ============================================================ */
const DUEL = {
  charge:{ need:30, ms:10000, decay:1.5,                                   // 1.5 a second: three every two
           hurry:[[3000, `More! Faster!`], [6000, `Hurry — he's nearly ready!`], [8300, `NOW! Everything you've got!`]] },
  clash:{ start:20, win:40, decay:3, surge:[[28, 9], [33, 14], [39, 20]], surgeMs:2000, introMs:700,
          surgeSay:[`He's pushing back — HARDER!`, `Don't let up! MORE!`, `One last push — GIVE IT EVERYTHING!`] },
  blackMs:3000, overMs:2200,
};

/* ============================================================
   THE PICTURES
   ============================================================ */
const duelWorld = ()=> $('#walkWorld');
/* his black hole: over his head, red and purple orbs drawn spiralling into it; `scale` its size */
function stHole(id, x, y, scale){
  duelCss();
  const world = duelWorld();
  if(!world) return null;
  let h = document.getElementById(id);
  if(!h){
    h = document.createElement('div');
    h.id = id;
    h.className = 'st-hole';
    const orbs = Array.from({ length:14 }, (_, i)=> `<b style="--a:${Math.round(i * 137.5 % 360)}deg;--dl:${(-i * 0.13).toFixed(2)}s;--d:${(1.15 + (i % 4) * 0.12).toFixed(2)}s;--c:${i % 2 ? '#b45cff' : '#ff3b6b'}"></b>`).join('');
    h.innerHTML = `<div class="sh-in"><i class="sh-halo"></i><i class="sh-disc"></i>${orbs}<i class="sh-core"></i></div>`;
    world.appendChild(h);
  }
  const T = WALK_T;
  h.style.cssText = `left:${(x * T).toFixed(1)}px;top:${(y * T).toFixed(1)}px;--t:${T}px;--hs:${(scale || 1).toFixed(2)};z-index:${Math.round(12 + y + 3)};`;
  return h;
}
function stHoleSize(id, scale){ const h = document.getElementById(id); if(h) h.style.setProperty('--hs', scale.toFixed(2)); }
/* emptied: it swells, and shrinks to nothing */
function stHoleGone(id, ms){
  const h = document.getElementById(id);
  if(!h) return;
  h.classList.add('fire');
  setTimeout(()=> h.remove(), (ms || 700) * Math.max(0.2, SCENE_SPEED));
}
/* where his hole is: over Wadjet's head (a scene actor's) */
function stHoleAt(actorId){
  const e = document.getElementById('sa-' + (actorId || 'wadjet')), o = e && e._o;
  return o ? { x:o.x + o.w / 2, y:o.y - 0.3 } : { x:31.5, y:30.2 };
}
/* the Eraser Beam: black, edged in purple and red, from (x0, y0) to (x1, y1) (squares) */
function stEBeam(x0, y0, x1, y1, o){
  duelCss();
  const world = duelWorld();
  if(!world) return null;
  const b = document.createElement('div');
  b.className = 'st-ebeam' + (o && o.big ? ' big' : '');
  b.style.setProperty('--t', WALK_T + 'px');
  b.innerHTML = '<i class="eb-body"></i><i class="eb-flow"></i><i class="eb-tip"></i>';
  world.appendChild(b);
  stBeamSet(b, x0, y0, x1, y1);
  return b;
}
/* Lucesco's glare, supercharged: his own beam, bigger, hotter */
function stRBeam(x0, y0, x1, y1){
  duelCss();
  const world = duelWorld();
  if(!world) return null;
  const b = document.createElement('div');
  b.className = 'jg-beam st-rbeam';
  b.innerHTML = '<i></i><b></b>';
  world.appendChild(b);
  stBeamSet(b, x0, y0, x1, y1);
  return b;
}
/* a beam laid from (x0, y0) to (x1, y1): where it starts, how long, which way */
function stBeamSet(b, x0, y0, x1, y1){
  if(!b) return;
  const T = WALK_T, len = Math.max(1, Math.hypot(x1 - x0, y1 - y0) * T), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  b.style.left = (x0 * T).toFixed(1) + 'px'; b.style.top = (y0 * T).toFixed(1) + 'px';
  b.style.width = len.toFixed(1) + 'px';
  b.style.transform = `rotate(${ang.toFixed(2)}deg)`;
  b.style.zIndex = Math.round(60 + Math.max(y0, y1));
}
function stBeamOut(b, ms){ if(!b) return; b.classList.add('out'); setTimeout(()=> b.remove(), ms || 320); }
/* a blast: black at its heart, purple and red round it, sparks — `r` squares across; kind: 'local' (a hit), 'huge' (the
   castle, or Lucesco), 'win' (Lucesco's beam home: red and white over the black) */
function stBlast(x, y, r, kind){
  duelCss();
  const world = duelWorld();
  if(!world) return null;
  const el = document.createElement('div');
  el.className = 'st-blast ' + (kind || 'local');
  const n = kind === 'local' ? 14 : 26;
  el.style.cssText = `left:${(x * WALK_T).toFixed(1)}px;top:${(y * WALK_T).toFixed(1)}px;--t:${WALK_T}px;--r:${r};z-index:${Math.round(70 + y)};`;
  el.innerHTML = '<i class="bl-flash"></i><i class="bl-core"></i><i class="bl-ring"></i><i class="bl-ring b2"></i>' +
    Array.from({ length:n }, (_, i)=> `<b style="--a:${Math.round(i * 360 / n + Math.random() * 12)}deg;--s:${(0.6 + Math.random() * 0.8).toFixed(2)};--c:${['#ff2a55', '#b45cff', '#14001e', '#ff7aa0'][i % 4]};animation-delay:${Math.round(Math.random() * 120)}ms"></b>`).join('');
  world.appendChild(el);
  setTimeout(()=> el.remove(), (kind === 'local' ? 1000 : 1800));
  return el;
}
/* smoke rising off something, for as long as it is there */
function stSmoke(id, x, y, z){
  duelCss();
  const world = duelWorld();
  if(!world) return null;
  let s = document.getElementById(id);
  if(!s){ s = document.createElement('div'); s.id = id; s.className = 'st-smoke'; world.appendChild(s);
    s.innerHTML = Array.from({ length:9 }, (_, i)=> `<i style="--dl:${(-i * 0.29).toFixed(2)}s;--x0:${((Math.random() - 0.5) * 0.5).toFixed(2)};--x1:${((Math.random() - 0.5) * 1.6).toFixed(2)}"></i>`).join(''); }
  s.style.cssText = `left:${(x * WALK_T).toFixed(1)}px;top:${(y * WALK_T).toFixed(1)}px;--t:${WALK_T}px;z-index:${z != null ? z : Math.round(11 + y)};`;
  return s;
}
/* the clash between two beams: a bright flash, then its glow pulsing, sparks flying out */
function stClashEl(x, y){
  duelCss();
  const world = duelWorld();
  if(!world) return null;
  const c = document.createElement('div');
  c.className = 'st-meet';
  c.style.setProperty('--t', WALK_T + 'px');
  c.innerHTML = '<i class="mt-flash"></i><i class="mt-glow"></i><i class="mt-core"></i>' +
    Array.from({ length:16 }, (_, i)=> `<b style="--a:${Math.round(i * 22.5 + Math.random() * 10)}deg;--c:${i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ff5a3c' : '#c27aff'};animation-delay:${(Math.random() * 0.45).toFixed(2)}s"></b>`).join('');
  world.appendChild(c);
  stClashAt(c, x, y);
  return c;
}
function stClashAt(c, x, y){ if(!c) return; c.style.left = (x * WALK_T).toFixed(1) + 'px'; c.style.top = (y * WALK_T).toFixed(1) + 'px'; c.style.zIndex = Math.round(90 + y); }

/* Lucesco, filling with it: galaxy red inside his silhouette, a white-red glow growing round him (f: 0–1) */
function stChargeGlow(f, pop){
  duelCss();
  const me = $('#walkYou');
  if(!me) return;
  f = Math.max(0, Math.min(1, f));
  if(f <= 0 && !pop){ stChargeOff(); return; }
  me.classList.add('st-chg');
  me.style.setProperty('--chg', f.toFixed(3));
  const p = typeof caYou === 'function' ? caYou() : null, world = duelWorld();
  if(p && world){
    let a = document.getElementById('stAura');
    if(!a){ a = document.createElement('div'); a.id = 'stAura'; a.className = 'st-aura'; a.innerHTML = '<i></i><i class="b"></i>'; world.appendChild(a); }
    a.style.cssText = `left:${((p.x + 0.5) * WALK_T).toFixed(1)}px;top:${((p.y + 0.35) * WALK_T).toFixed(1)}px;--t:${WALK_T}px;--chg:${f.toFixed(3)};z-index:${9 + p.y};`;
    if(pop){ a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop'); }
  }
}
function stChargeOff(){
  const me = $('#walkYou');
  if(me){ me.classList.remove('st-chg', 'st-pant'); me.style.removeProperty('--chg'); }
  const a = document.getElementById('stAura'); if(a) a.remove();
}

/* the hand over his Glare: pressing it, again and again, till you do */
function stHand(on){
  duelCss();
  clearInterval(stHand._iv);
  let h = document.getElementById('stHand');
  if(!on){ if(h) h.remove(); return; }
  const btn = document.querySelector('#walkMoves [data-mv="glare"]');
  const ic = btn && (btn.querySelector('.seg-ic') || btn);
  if(!ic) return;
  if(!h){ h = document.createElement('div'); h.id = 'stHand'; h.className = 'st-hand'; h.setAttribute('aria-hidden', 'true');
    h.innerHTML = '<i class="sh-ring"></i><span class="sh-fin">👆</span>'; document.body.appendChild(h); }
  const place = ()=>{ const r = ic.getBoundingClientRect(); h.style.left = (r.left + r.width / 2).toFixed(1) + 'px'; h.style.top = (r.top + r.height / 2).toFixed(1) + 'px'; };
  place();
  /* the button itself pressed in time with it */
  stHand._iv = setInterval(()=>{
    if(!h.isConnected){ clearInterval(stHand._iv); return; }
    place();
    btn.classList.remove('press'); void btn.offsetWidth; btn.classList.add('press');
    setTimeout(()=> btn.classList.remove('press'), 160);
  }, 900);
}
/* the word along the bottom while you tap (it stays till the tapping is over) */
function stTapHint(html){
  duelCss();
  const stage = $('#walkStage');
  let el = document.getElementById('stTapHint');
  if(!html){ if(el) el.remove(); return; }
  if(!stage) return;
  if(!el){ el = document.createElement('div'); el.id = 'stTapHint'; el.className = 'st-tap-hint'; el.setAttribute('role', 'status'); stage.appendChild(el); }
  el.innerHTML = html;
}
/* a shout from Lucesco over his head, that blocks nothing */
function stBubble(text, ms, loud){
  duelCss();
  const stage = $('#walkStage'), me = $('#walkYou');
  if(!stage || !me) return;
  document.querySelectorAll('.st-bubble').forEach(b=> b.remove());
  const art = me.querySelector('.jg-ride-lion') || me;
  const sr = stage.getBoundingClientRect(), r = art.getBoundingClientRect();
  const b = document.createElement('div');
  b.className = 'st-bubble' + (loud ? ' loud' : '');
  b.innerHTML = `<b>"${text}"</b>`;
  const x = Math.max(70, Math.min(sr.width - 70, r.left + r.width / 2 - sr.left)), y = Math.max(8, r.top - sr.top - 8);
  b.style.left = x.toFixed(0) + 'px'; b.style.top = y.toFixed(0) + 'px';
  stage.appendChild(b);
  setTimeout(()=> b.classList.add('out'), (ms || 1500) - 300);
  setTimeout(()=> b.remove(), ms || 1500);
}

/* ============================================================
   THE TAPPING: his Glare, as fast as you can — nothing else answers while it goes on
   ============================================================ */
function stTapPaused(){ return document.hidden || (typeof eyeBreakActive === 'function' && eyeBreakActive()); }
/* the keys while it goes on: Space, Enter or G his Glare; nothing else */
function duelKeys(on){
  if(on && !duelKeys._h){
    duelKeys._h = e=>{
      const S = ui.stand;
      if(!S || !S.tap) return;
      if(document.getElementById('eyeBreakOverlay')) return;
      e.preventDefault(); e.stopPropagation();
      if(e.repeat) return;
      if(e.key === ' ' || e.key === 'Enter' || e.key === 'g' || e.key === 'G'){
        const btn = document.querySelector('#walkMoves [data-mv="glare"]');
        if(btn){ btn.classList.remove('press'); void btn.offsetWidth; btn.classList.add('press'); setTimeout(()=> btn.classList.remove('press'), 160); }
        stTapPress(S);
      }
    };
    window.addEventListener('keydown', duelKeys._h, true);
  }
  if(!on && duelKeys._h){ window.removeEventListener('keydown', duelKeys._h, true); duelKeys._h = null; }
}
/* one game of it: mode 'charge' or 'clash'; resolves true (done it), false (lost it) or 'abort' (the scene left) */
function stTapGame(S, mode, o){
  duelCss();
  const G = S.tap = Object.assign({ mode, n:0, v:DUEL.clash.start, vd:DUEL.clash.start, t:0, last:performance.now(), presses:0, said:{}, surged:[], surge:null, over:false }, o || {});
  document.body.classList.add('st-tapping');
  duelKeys(true);
  if(typeof refreshWalk === 'function') refreshWalk();
  return new Promise(res=>{
    G.res = res;
    const frame = now=>{
      if(G.over) return;
      if(ui.stand !== S || ui.screen !== CA_KEY){ stTapEnd(S, 'abort'); return; }
      const dt = Math.min(200, now - G.last);
      G.last = now;
      if(!G.manual && !stTapPaused()){                                   // (G.manual: a test turns its clock by hand, stTapAdvance)
        const k = (typeof SCENE_SPEED === 'number' && SCENE_SPEED < 1) ? Math.max(0.02, SCENE_SPEED) : 1;   // (a test's quick scenes: its clock quick too)
        G.t += dt / k;
        if(G.mode === 'charge') stChargeTick(S, G, dt / k); else stClashTick(S, G, dt / k);
      }
      if(!G.over) G.raf = requestAnimationFrame(frame);
    };
    G.raf = requestAnimationFrame(frame);
  });
}
/* (for the tests) its clock turned on by `ms` of the game's time, by hand */
function stTapAdvance(S, ms){
  const G = S && S.tap;
  if(!G || G.over) return;
  for(let left = ms; left > 0 && !G.over; left -= 50){
    const dt = Math.min(50, left);
    G.t += dt;
    if(G.mode === 'charge') stChargeTick(S, G, dt); else stClashTick(S, G, dt);
  }
}
function stTapEnd(S, result){
  const G = S && S.tap;
  if(!G || G.over) return;
  G.over = true;
  cancelAnimationFrame(G.raf);
  S.tap = null;
  S.lastTap = G;
  document.body.classList.remove('st-tapping');
  duelKeys(false);
  stHand(false);
  stTapHint(null);
  if(typeof refreshWalk === 'function' && ui.screen === CA_KEY) refreshWalk();
  G.res(result);
}
/* a press of his Glare */
function stTapPress(S){
  const G = S && S.tap;
  if(!G || G.over) return;
  G.presses++;
  if(G.presses === 1) stHand(false);
  try { playSfx('spark'); } catch(e){}
  if(G.mode === 'charge'){
    G.n += 1;
    stChargeGlow(G.n / DUEL.charge.need, true);
    if(G.n >= DUEL.charge.need) stTapEnd(S, true);
    return;
  }
  G.v = Math.min(DUEL.clash.win, G.v + 1);
  stSurgeCheck(S, G);
  stChargeGlow(0.75 + 0.25 * G.v / DUEL.clash.win, true);
  if(G.v >= DUEL.clash.win) stTapEnd(S, true);
}
/* the charge: falling away three every two seconds; ten seconds, and he has fired */
function stChargeTick(S, G, dt){
  G.n = Math.max(0, G.n - DUEL.charge.decay * dt / 1000);
  stChargeGlow(Math.max(0.04, G.n / DUEL.charge.need));
  stHoleSize('stHole', 1.05 + 0.75 * Math.min(1, G.t / DUEL.charge.ms));   // his, swelling all the while
  DUEL.charge.hurry.forEach(([at, line])=>{ if(!G.said[at] && G.t >= at){ G.said[at] = true; stBubble(line, 1500, at >= 8000); } });
  if(G.t >= DUEL.charge.ms) stTapEnd(S, false);
}
/* the deadlock: three a second; at 28, 33 and 39 (once each) he pushes harder for two seconds */
function stClashTick(S, G, dt){
  if(G.t >= DUEL.clash.introMs){
    let rate = DUEL.clash.decay;
    if(G.surge){ if(G.t < G.surge.until) rate = G.surge.rate; else { G.surge = null; stSurgeLook(S, G, 0); } }
    G.v = Math.max(0, G.v - rate * dt / 1000);
  }
  if(G.v < 10 && !G.said.low){ G.said.low = true; stBubble(`We're losing it — MORE!`, 1400, true); }
  if(G.v >= 16) G.said.low = false;
  G.vd += (G.v - G.vd) * Math.min(1, dt / 90);
  stClashDraw(S, G);
  if(G.v <= 0) stTapEnd(S, false);
}
function stSurgeCheck(S, G){
  DUEL.clash.surge.forEach(([at, rate], k)=>{
    if(G.surged[k] || G.v < at) return;
    G.surged[k] = true;
    G.surge = { k:k + 1, rate, until:G.t + DUEL.clash.surgeMs };
    stSurgeLook(S, G, k + 1);
    stBubble(DUEL.clash.surgeSay[k], 1500, true);
  });
}
/* his beam, larger and brighter while he pushes (k 1–3), as it was after */
function stSurgeLook(S, G, k){
  const D = S.duel;
  if(!D || !D.wb) return;
  D.wb.style.setProperty('--k', [1, 1.4, 1.75, 2.15][k].toFixed(2));
  D.wb.classList.toggle('surge', k > 0);
  if(k > 0){
    stHoleSize('stHole', 1.25 + k * 0.25);
    sceneShake(DUEL.clash.surgeMs * 0.5, ms=> 0.03 + 0.02 * k);
    try { playSfx('core_blast'); } catch(e){}
  } else stHoleSize('stHole', 1.2);
}
/* the two beams, and where they meet: Lucesco's eyes to it, his hole to it — 0 at Lucesco, 40 at Wadjet */
function stClashDraw(S, G){
  const D = S.duel;
  if(!D) return;
  const E = D.E, H = D.H, f = Math.max(0, Math.min(1, G.vd / DUEL.clash.win));
  const mx = E.x + (H.x - E.x) * f, my = E.y + (H.y - E.y) * f;
  stBeamSet(D.lb, E.x, E.y, mx, my);
  stBeamSet(D.wb, H.x, H.y, mx, my);
  stClashAt(D.cl, mx, my);
}

/* ============================================================
   HOW IT LOOKS
   ============================================================ */
let _duelCss = false;
function duelCss(){
  if(_duelCss || typeof document === 'undefined') return;
  _duelCss = true;
  const s = document.createElement('style');
  s.id = 'duelCss';
  s.textContent = `
  /* his black hole: a black heart, a burning ring turning round it, red and purple orbs drawn spiralling in */
  .st-hole{ position:absolute; width:0; height:0; pointer-events:none; }
  .st-hole .sh-in{ position:absolute; left:0; top:0; scale:var(--hs, 1); transition:scale .45s cubic-bezier(.2,.9,.3,1.25); }
  .st-hole .sh-halo{ position:absolute; left:calc(var(--t) * -1.4); top:calc(var(--t) * -1.4); width:calc(var(--t) * 2.8); height:calc(var(--t) * 2.8); border-radius:50%;
    background:radial-gradient(circle, rgba(0,0,0,0) 28%, rgba(70,0,100,.5) 42%, rgba(200,20,80,.28) 56%, rgba(60,0,90,0) 72%); animation:shHalo 1.6s ease-in-out infinite; }
  .st-hole .sh-disc{ position:absolute; left:calc(var(--t) * -.95); top:calc(var(--t) * -.95); width:calc(var(--t) * 1.9); height:calc(var(--t) * 1.9); border-radius:50%;
    background:conic-gradient(from 0deg, rgba(255,40,90,0) 0deg, rgba(255,40,90,.95) 40deg, rgba(160,40,255,.9) 110deg, rgba(255,60,120,0) 160deg, rgba(190,60,255,.85) 220deg, rgba(255,30,80,.95) 290deg, rgba(255,40,90,0) 360deg);
    -webkit-mask:radial-gradient(circle, transparent 0 36%, #000 41% 60%, transparent 70%); mask:radial-gradient(circle, transparent 0 36%, #000 41% 60%, transparent 70%);
    filter:blur(1px) drop-shadow(0 0 6px rgba(255,40,110,.9)); animation:shSpin .9s linear infinite; }
  .st-hole .sh-core{ position:absolute; left:calc(var(--t) * -.42); top:calc(var(--t) * -.42); width:calc(var(--t) * .84); height:calc(var(--t) * .84); border-radius:50%;
    background:radial-gradient(circle, #000 0 58%, #120018 70%, rgba(150,40,220,.9) 82%, rgba(255,60,120,0) 100%); box-shadow:0 0 12px 4px rgba(150,30,220,.75), 0 0 26px 8px rgba(255,30,90,.45); }
  .st-hole b{ position:absolute; left:0; top:0; width:calc(var(--t) * .17); height:calc(var(--t) * .17); margin:calc(var(--t) * -.085); border-radius:50%;
    background:radial-gradient(circle, #fff 0 18%, var(--c) 46%, rgba(0,0,0,0) 72%); box-shadow:0 0 8px 2px var(--c); opacity:0;
    animation:shOrb var(--d, 1.3s) cubic-bezier(.45,0,.9,.55) infinite; animation-delay:var(--dl, 0s); }
  @keyframes shOrb{ 0%{ transform:rotate(var(--a)) translateX(calc(var(--t) * 2.3)) scale(1.15); opacity:0; } 14%{ opacity:1; } 100%{ transform:rotate(calc(var(--a) + 320deg)) translateX(0) scale(.12); opacity:.25; } }
  @keyframes shSpin{ to{ rotate:360deg; } }
  @keyframes shHalo{ 0%,100%{ scale:.92; opacity:.85; } 50%{ scale:1.1; opacity:1; } }
  .st-hole.fire .sh-in{ animation:shFire .7s cubic-bezier(.3,0,.7,1) forwards; }
  @keyframes shFire{ 0%{ scale:var(--hs, 1); } 25%{ scale:calc(var(--hs, 1) * 1.45); } 100%{ scale:0; opacity:0; } }
  /* the Eraser Beam: black, edged in purple and red, dark energy running down it */
  .st-ebeam{ position:absolute; height:0; transform-origin:0 0; pointer-events:none; --k:1; }
  .st-ebeam i{ position:absolute; left:0; right:0; font-style:normal; }
  .st-ebeam .eb-body{ top:calc(var(--t) * -.3 * var(--k)); height:calc(var(--t) * .6 * var(--k)); border-radius:999px;
    background:linear-gradient(to bottom, rgba(255,40,90,0) 0%, rgba(255,40,90,.85) 9%, #d4205f 17%, #7a1ad0 27%, #1a0026 37%, #000 44%, #000 56%, #1a0026 63%, #7a1ad0 73%, #d4205f 83%, rgba(255,40,90,.85) 91%, rgba(255,40,90,0) 100%);
    box-shadow:0 0 calc(var(--t) * .3 * var(--k)) calc(var(--t) * .08 * var(--k)) rgba(170,40,240,.8), 0 0 calc(var(--t) * .7 * var(--k)) calc(var(--t) * .16 * var(--k)) rgba(255,30,90,.45);
    animation:ebThrob .09s linear infinite alternate, ebIn .16s ease-out both; transition:top .25s ease, height .25s ease, filter .25s ease; }
  .st-ebeam .eb-flow{ top:calc(var(--t) * -.09 * var(--k)); height:calc(var(--t) * .18 * var(--k)); border-radius:999px; mix-blend-mode:screen; opacity:.8;
    background:repeating-linear-gradient(90deg, rgba(150,40,255,0) 0 calc(var(--t) * .35), rgba(190,80,255,.75) calc(var(--t) * .35) calc(var(--t) * .45), rgba(150,40,255,0) calc(var(--t) * .45) calc(var(--t) * .8));
    animation:ebFlow .32s linear infinite; transition:top .25s ease, height .25s ease; }
  .st-ebeam .eb-tip{ left:auto; right:calc(var(--t) * -.36 * var(--k)); top:calc(var(--t) * -.36 * var(--k)); width:calc(var(--t) * .72 * var(--k)); height:calc(var(--t) * .72 * var(--k)); border-radius:50%;
    background:radial-gradient(circle, rgba(0,0,0,.8) 0 18%, rgba(122,26,208,.7) 40%, rgba(255,40,90,.45) 60%, rgba(255,40,90,0) 76%); animation:ebTip .1s ease-in-out infinite alternate; }
  .st-ebeam.big{ --k:1.45; }
  .st-ebeam.surge .eb-body{ filter:brightness(1.35) saturate(1.4) drop-shadow(0 0 calc(var(--t) * .25) rgba(255,60,140,.95)); }
  @keyframes ebThrob{ from{ transform:scaleY(.86); } to{ transform:scaleY(1.12); } }
  @keyframes ebIn{ from{ clip-path:inset(0 100% 0 0); } to{ clip-path:inset(0 0 0 0); } }
  @keyframes ebFlow{ from{ background-position:0 0; } to{ background-position:calc(var(--t) * .8) 0; } }
  @keyframes ebTip{ from{ transform:scale(.8); } to{ transform:scale(1.25); } }
  .st-ebeam.out, .jg-beam.st-rbeam.out{ opacity:0; transition:opacity .3s ease; }
  /* Lucesco's glare, supercharged: his beam, three times as thick */
  .jg-beam.st-rbeam i{ top:-22px; height:44px; border-radius:22px; box-shadow:0 0 26px 9px rgba(255,40,30,.75), 0 0 52px 16px rgba(255,120,90,.4); }
  .jg-beam.st-rbeam b{ top:-6px; height:12px; border-radius:6px; box-shadow:0 0 10px #fff, 0 0 22px #ff6a50; }
  /* where the beams meet: a flash, then a pulsing glow with sparks flying out */
  .st-meet{ position:absolute; width:0; height:0; pointer-events:none; }
  .st-meet i{ position:absolute; border-radius:50%; translate:-50% -50%; font-style:normal; }
  .st-meet .mt-flash{ width:calc(var(--t) * 7); height:calc(var(--t) * 7); background:radial-gradient(circle, #fff 0 20%, rgba(255,240,240,.9) 34%, rgba(255,120,170,.55) 55%, rgba(200,80,255,0) 72%); animation:mtFlash .75s ease-out both; }
  .st-meet .mt-glow{ width:calc(var(--t) * 2.4); height:calc(var(--t) * 2.4); background:radial-gradient(circle, rgba(255,255,255,.95) 0 18%, rgba(255,150,120,.85) 34%, rgba(255,60,120,.5) 54%, rgba(170,60,255,0) 72%); animation:mtPulse .32s ease-in-out infinite alternate; }
  .st-meet .mt-core{ width:calc(var(--t) * .8); height:calc(var(--t) * .8); background:#fff; box-shadow:0 0 14px 6px #fff, 0 0 30px 12px rgba(255,120,160,.8); animation:mtPulse .16s ease-in-out infinite alternate; }
  .st-meet b{ position:absolute; left:0; top:0; width:calc(var(--t) * .13); height:calc(var(--t) * .13); margin:calc(var(--t) * -.065); border-radius:50%; background:var(--c); box-shadow:0 0 6px 2px var(--c);
    rotate:var(--a); animation:mtSpark .5s ease-out infinite; }
  @keyframes mtFlash{ 0%{ scale:.3; opacity:0; } 12%{ scale:1; opacity:1; } 100%{ scale:.35; opacity:0; } }
  @keyframes mtPulse{ from{ scale:.82; } to{ scale:1.22; } }
  @keyframes mtSpark{ from{ translate:0 0; opacity:1; } to{ translate:calc(var(--t) * 1.9) 0; opacity:0; } }
  /* a blast: black heart, purple and red round it, sparks */
  .st-blast{ position:absolute; width:0; height:0; pointer-events:none; }
  .st-blast i{ position:absolute; left:0; top:0; border-radius:50%; translate:-50% -50%; font-style:normal; }
  .st-blast .bl-flash{ width:calc(var(--t) * var(--r) * 1.6); height:calc(var(--t) * var(--r) * 1.6); background:radial-gradient(circle, rgba(255,235,245,.95) 0 10%, rgba(255,60,120,.8) 26%, rgba(150,30,230,.55) 46%, rgba(80,0,120,.25) 60%, rgba(0,0,0,0) 72%); mix-blend-mode:screen; animation:blFlash .55s ease-out both; }
  .st-blast .bl-core{ border-radius:46% 54% 50% 50% / 52% 46% 54% 48%; filter:blur(.6px); width:calc(var(--t) * var(--r) * .5); height:calc(var(--t) * var(--r) * .5); background:radial-gradient(circle, #000 0 34%, #1e0028 46%, rgba(150,30,220,.9) 60%, rgba(255,40,90,.7) 74%, rgba(255,40,90,0) 88%); animation:blCore .8s cubic-bezier(.15,.8,.3,1) both; }
  .st-blast .bl-ring{ width:calc(var(--t) * var(--r) * .5); height:calc(var(--t) * var(--r) * .5); border:3px solid rgba(255,70,130,.95); box-shadow:0 0 14px 4px rgba(170,40,255,.8), inset 0 0 12px rgba(255,40,90,.7); animation:blRing .8s ease-out both; }
  .st-blast .bl-ring.b2{ border-color:rgba(190,90,255,.9); animation-delay:.1s; }
  .st-blast b{ position:absolute; left:0; top:0; width:calc(var(--t) * .18 * var(--s)); height:calc(var(--t) * .18 * var(--s)); margin:calc(var(--t) * -.09 * var(--s)); border-radius:50%; background:var(--c); box-shadow:0 0 8px 2px var(--c);
    rotate:var(--a); animation:blSpark .9s cubic-bezier(.1,.7,.3,1) both; }
  .st-blast.huge .bl-core{ animation-duration:1.1s; } .st-blast.huge .bl-ring{ animation-duration:1.05s; } .st-blast.huge b{ animation-duration:1.3s; }
  /* a pulse: no heart to it — black rings edged in purple and red, rolling out */
  .st-blast.pulse .bl-core{ display:none; } .st-blast.pulse .bl-flash{ opacity:.6; }
  .st-blast.pulse .bl-ring{ border:calc(var(--t) * .14) solid rgba(16,0,26,.85); box-shadow:0 0 0 3px rgba(255,50,110,.85), 0 0 18px 6px rgba(170,40,255,.75), inset 0 0 14px rgba(255,40,90,.7); animation-duration:.9s; }
  .st-blast.local .bl-core{ width:calc(var(--t) * var(--r) * .45); height:calc(var(--t) * var(--r) * .45); animation-duration:.6s; }
  /* Lucesco's glare home: red and white, a fireball, the dark of him torn apart in it */
  .st-blast.win .bl-flash{ background:radial-gradient(circle, #fff 0 14%, rgba(255,220,200,.95) 24%, rgba(255,80,50,.85) 40%, rgba(200,20,40,.45) 56%, rgba(0,0,0,0) 72%); animation-duration:.9s; }
  .st-blast.win .bl-core{ background:radial-gradient(circle, #fff 0 16%, #ffd7c7 26%, #ff5a2a 42%, #b8102a 58%, rgba(40,0,20,.85) 70%, rgba(120,20,200,0) 86%); animation-duration:1.2s; }
  .st-blast.win .bl-ring{ border-color:rgba(255,150,110,.95); box-shadow:0 0 16px 5px rgba(255,80,60,.85), inset 0 0 12px rgba(255,200,160,.7); }
  @keyframes blFlash{ 0%{ scale:.2; opacity:0; } 15%{ scale:1; opacity:1; } 100%{ scale:1.3; opacity:0; } }
  @keyframes blCore{ 0%{ scale:.1; opacity:1; } 25%{ scale:1; opacity:1; } 50%{ opacity:.8; } 100%{ scale:1.4; opacity:0; } }
  @keyframes blRing{ 0%{ scale:.2; opacity:1; } 100%{ scale:3.4; opacity:0; } }
  @keyframes blSpark{ from{ translate:0 0; opacity:1; } to{ translate:calc(var(--t) * var(--r) * .9) 0; opacity:0; } }
  /* smoke rising */
  .st-smoke{ position:absolute; width:0; height:0; pointer-events:none; }
  .st-smoke i{ position:absolute; left:calc(var(--t) * -.4); top:calc(var(--t) * -.4); width:calc(var(--t) * .8); height:calc(var(--t) * .8); border-radius:50%; font-style:normal;
    background:radial-gradient(circle, rgba(46,40,54,.92) 0 22%, rgba(70,62,80,.7) 46%, rgba(90,82,100,0) 72%); animation:smRise 2.6s ease-out infinite; animation-delay:var(--dl); opacity:0; }
  @keyframes smRise{ 0%{ transform:translate(calc(var(--t) * var(--x0)), 0) scale(.5); opacity:0; } 12%{ opacity:1; } 60%{ opacity:.7; } 100%{ transform:translate(calc(var(--t) * var(--x1)), calc(var(--t) * -2.6)) scale(2.5); opacity:0; } }
  /* the King under it: shaking, burning; afterwards, dark, lying there */
  .scene-actor.st-erased .sa-in{ animation:khShake .07s steps(2) infinite; }
  .scene-actor.st-erased img{ filter:brightness(.72) drop-shadow(0 0 6px rgba(255,40,90,.95)) drop-shadow(0 0 16px rgba(140,30,220,.9)) !important; }
  .scene-actor.st-burnt img{ filter:brightness(.42) saturate(.5) contrast(1.1) drop-shadow(0 2px 2px rgba(0,0,0,.45)) !important; }
  /* Lucesco filling with it: galaxy red inside his silhouette, a white-red glow round him */
  .walk-you.st-chg .jg-ride-arc > .jg-stars{ display:block; position:absolute; pointer-events:none; font-style:normal;
    -webkit-mask-size:100% 100%; mask-size:100% 100%; -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat;
    background:radial-gradient(1.6px 1.6px at 20% 30%, #fff, rgba(255,255,255,0) 70%), radial-gradient(1.2px 1.2px at 70% 20%, #ffe2d8, rgba(255,255,255,0) 70%),
      radial-gradient(1.8px 1.8px at 45% 65%, #fff, rgba(255,255,255,0) 70%), radial-gradient(1.1px 1.1px at 80% 75%, #ffd0c8, rgba(255,255,255,0) 70%),
      radial-gradient(1.4px 1.4px at 15% 80%, #fff, rgba(255,255,255,0) 70%), radial-gradient(1.1px 1.1px at 55% 40%, #ffe6dc, rgba(255,255,255,0) 70%),
      linear-gradient(160deg, #4a0010, #c8102c 38%, #ff4a3a 60%, #a3061f 80%, #3a000c);
    background-size:17px 17px, 23px 23px, 29px 29px, 13px 13px, 19px 19px, 11px 11px, 100% 100%;
    opacity:calc(.12 + .88 * var(--chg, 0)); animation:jgStarDrift .8s linear infinite; transition:opacity .12s ease; }
  .walk-you.st-chg .jg-ride-mane{ opacity:calc(.9 * (1 - var(--chg, 0))) !important; }
  .walk-you.st-chg .jg-ride-arc{ filter:drop-shadow(0 0 calc(3px + 9px * var(--chg, 0)) rgba(255,70,60,calc(.45 + .55 * var(--chg, 0)))) drop-shadow(0 0 calc(2px + 5px * var(--chg, 0)) rgba(255,255,255,calc(.25 + .7 * var(--chg, 0)))); }
  .walk-you.st-pant .jg-ride-arc{ animation:stPant .5s ease-in-out infinite alternate; }
  @keyframes stPant{ from{ transform:translateY(0) scaleY(1); } to{ transform:translateY(1px) scaleY(.965); } }
  .st-aura{ position:absolute; width:0; height:0; pointer-events:none; }
  .st-aura i{ position:absolute; left:calc(var(--t) * -1.5); top:calc(var(--t) * -1.5); width:calc(var(--t) * 3); height:calc(var(--t) * 3); border-radius:50%; font-style:normal;
    background:radial-gradient(circle, rgba(255,255,255,.95) 0 14%, rgba(255,200,190,.75) 26%, rgba(255,60,50,.55) 44%, rgba(255,30,30,0) 70%);
    scale:calc(.35 + 1.05 * var(--chg, 0)); opacity:calc(.25 + .75 * var(--chg, 0)); mix-blend-mode:screen; transition:scale .12s ease, opacity .12s ease; animation:stAura .5s ease-in-out infinite alternate; }
  .st-aura i.b{ background:radial-gradient(circle, rgba(255,255,255,0) 40%, rgba(255,250,250,.55) 52%, rgba(255,80,60,0) 64%); animation-duration:.33s; }
  .st-aura.pop i{ animation:stAuraPop .18s ease-out; }
  @keyframes stAura{ from{ filter:brightness(1); } to{ filter:brightness(1.35); } }
  @keyframes stAuraPop{ from{ filter:brightness(1.9); } to{ filter:brightness(1); } }
  /* the hand, pressing his Glare */
  .st-hand{ position:fixed; width:0; height:0; z-index:200; pointer-events:none; }
  .st-hand .sh-fin{ position:absolute; left:0; top:0; font-size:46px; line-height:1; translate:-38% 8px; filter:drop-shadow(0 3px 3px rgba(0,0,0,.4)); animation:stHandPress .9s ease-in-out infinite; }
  .st-hand .sh-ring{ position:absolute; left:-30px; top:-30px; width:60px; height:60px; border-radius:50%; border:4px solid rgba(255,240,200,.95); box-shadow:0 0 12px rgba(255,200,120,.9); opacity:0; animation:stHandRing .9s ease-out infinite; }
  @keyframes stHandPress{ 0%,100%{ transform:translateY(26px) scale(1); } 38%,48%{ transform:translateY(2px) scale(.88); } }
  @keyframes stHandRing{ 0%,36%{ scale:.3; opacity:0; } 42%{ scale:.45; opacity:1; } 90%,100%{ scale:1.6; opacity:0; } }
  /* the word along the bottom while you tap */
  .st-tap-hint{ position:absolute; left:50%; bottom:12px; translate:-50% 0; z-index:12; pointer-events:none; white-space:nowrap; padding:7px 16px; border-radius:999px;
    background:rgba(40,8,16,.86); color:#fff4e8; border:2px solid rgba(255,120,100,.85); font:800 17px/1.15 'Baloo 2', 'Nunito', system-ui, sans-serif; letter-spacing:.01em;
    box-shadow:0 0 18px rgba(255,70,60,.55); animation:stHint 1s ease-in-out infinite; }
  .st-tap-hint b{ color:#ff9a86; }
  @keyframes stHint{ 0%,100%{ scale:1; } 50%{ scale:1.06; } }
  /* his shouts, that block nothing */
  .st-bubble{ position:absolute; z-index:13; translate:-50% -100%; pointer-events:none; max-width:70%; padding:6px 12px; border-radius:14px; background:#fff8ea; color:#3a1a12;
    border:2px solid #e2353e; font:800 15px/1.2 'Nunito', system-ui, sans-serif; box-shadow:0 3px 10px rgba(0,0,0,.3); animation:stBubbleIn .18s cubic-bezier(.2,1.4,.4,1) both; }
  .st-bubble::after{ content:''; position:absolute; left:50%; bottom:-9px; translate:-50% 0; border:8px solid transparent; border-top-color:#e2353e; border-bottom:0; }
  .st-bubble.loud{ font-size:17px; background:#fff1e0; }
  .st-bubble.out{ opacity:0; transition:opacity .3s ease; }
  @keyframes stBubbleIn{ from{ scale:.5; opacity:0; } to{ scale:1; opacity:1; } }
  /* nothing to tap but his Glare (and an eye break's own button) */
  body.st-tapping *{ pointer-events:none !important; }
  body.st-tapping #walkMoves [data-mv="glare"], body.st-tapping #eyeBreakOverlay, body.st-tapping #eyeBreakOverlay *{ pointer-events:auto !important; }
  body.st-tapping #walkMoves{ visibility:visible !important; }
  /* the move he wants: brighter than bright */
  body.st-tapping #walkMoves .seg.glare, body.hunt-want-glare #walkMoves .seg.glare, body.hunt-want-ambush #walkMoves .seg.ambush{ filter:brightness(1.18) saturate(1.3); }
  body.st-tapping #walkMoves .seg-glow.glare, body.hunt-want-glare #walkMoves .seg-glow.glare, body.hunt-want-ambush #walkMoves .seg-glow.ambush{ opacity:1 !important; animation:duelGlow .5s ease-in-out infinite alternate !important; }
  @keyframes duelGlow{ from{ filter:blur(calc(var(--dpx, 160px) * .04)) brightness(1.1); scale:1.02; } to{ filter:blur(calc(var(--dpx, 160px) * .075)) brightness(1.7); scale:1.14; } }
  @media (prefers-reduced-motion: reduce){
    .st-hole .sh-disc, .st-hole b, .st-ebeam .eb-flow, .st-meet b, .st-smoke i, .st-aura i, .st-hand .sh-fin, .st-tap-hint, .walk-you.st-pant .jg-ride-arc{ animation-duration:3s; }
  }
  `;
  document.head.appendChild(s);
}
