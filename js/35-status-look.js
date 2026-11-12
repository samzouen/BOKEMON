/* ============================================================
   35-status-look.js — WHAT A STUN, A NAP AND VENOM LOOK LIKE ON A MONSTER (4.31)
   The designer: "Please have animations for venom debuff and stun. Stun can be the 3 small spinning stars on the head
   with trailing faint lines behind each, and a slight forward tilt which should apply to sleep as well."
     · Stunned (yours: stunned; theirs: paralysed or stunned): three small stars circling over its head, each drawing a
       faint trail behind it, and it leans a little forward — towards the other side (theirs face you; yours face them).
     · Asleep: the same lean (its z's as before, theirs).
     · Venom (34-nemesis.js: Wadjet's Hood of Dread, his shadows' Night Venom): small green bubbles rising off it and
       popping, and a faint green tint coming and going on it.
   Drawn over each monster's own sprite, in the fight, whichever side: every time the marks are drawn
   (renderStatusBadges) each sprite is given what it now carries, and loses what it no longer does.
   ============================================================ */
const ST_LOOK = { stars:3, orbit:1.25, trail:0.95 };   // stars, seconds an orbit, radians of trail behind each

/* the little five-pointed star, centred on 0,0 */
function stStarPath(r){
  const p = [];
  for(let k = 0; k < 10; k++){ const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; p.push((rr * Math.cos(a)).toFixed(2) + ' ' + (rr * Math.sin(a)).toFixed(2)); }
  return 'M' + p.join(' L') + 'Z';
}
/* ---------- the stars, circling ---------- */
const _stStun = new Set();
let _stRaf = 0;
function stStunOn(host, on){
  let el = host.querySelector(':scope > .st-stun');
  if(!on){ if(el){ _stStun.delete(el); el.remove(); } return; }
  if(el) return;
  el = document.createElement('span');
  el.className = 'st-stun';
  el.setAttribute('aria-hidden', 'true');
  const star = stStarPath(6.2);
  el.innerHTML = `<svg viewBox="-50 -16 100 32" preserveAspectRatio="xMidYMid meet">` +
    Array.from({ length:ST_LOOK.stars }, (_, k)=> `<g class="st-s${k}"><path class="st-trail" d="" /><path class="st-star" d="${star}" /></g>`).join('') + `</svg>`;
  el._parts = Array.from({ length:ST_LOOK.stars }, (_, k)=> ({ g:el.querySelector('.st-s' + k), trail:el.querySelector('.st-s' + k + ' .st-trail'), star:el.querySelector('.st-s' + k + ' .st-star') }));
  el._t0 = performance.now() - Math.random() * 1000;
  host.appendChild(el);
  _stStun.add(el);
  stStunDraw(el, performance.now());
  if(!(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) stStunLoop();
}
function stStunLoop(){
  if(_stRaf) return;
  const step = now=>{
    _stRaf = 0;
    _stStun.forEach(el=>{ if(!el.isConnected){ _stStun.delete(el); return; } stStunDraw(el, now); });
    if(_stStun.size) _stRaf = requestAnimationFrame(step);
  };
  _stRaf = requestAnimationFrame(step);
}
/* each star on an ellipse over the head (wide and flat: seen from the side), its trail the arc it has just come along,
   fading out behind it; the near half of the circle drawn bright, the far half dimmer and smaller */
function stStunDraw(el, now){
  const RX = 34, RY = 9, t = (now - el._t0) / 1000, a0 = t * 2 * Math.PI / ST_LOOK.orbit;
  el._parts.forEach((p, k)=>{
    const a = a0 + k * 2 * Math.PI / ST_LOOK.stars, x = RX * Math.cos(a), y = RY * Math.sin(a);
    const near = (Math.sin(a) + 1) / 2;                                   // 0 behind the head, 1 in front
    p.star.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(a * 180 / Math.PI * 1.6 % 360).toFixed(1)}) scale(${(0.72 + 0.34 * near).toFixed(3)})`);
    p.star.style.opacity = (0.55 + 0.45 * near).toFixed(3);
    const pts = [];
    for(let j = 0; j <= 8; j++){ const b = a - ST_LOOK.trail * j / 8; pts.push(`${(RX * Math.cos(b)).toFixed(2)} ${(RY * Math.sin(b)).toFixed(2)}`); }
    p.trail.setAttribute('d', 'M' + pts.join(' L'));
    p.trail.style.opacity = (0.18 + 0.22 * near).toFixed(3);
  });
}
/* ---------- the venom's bubbles ---------- */
function stVenomOn(host, on){
  let el = host.querySelector(':scope > .st-venom');
  host.classList.toggle('st-venom-on', !!on);
  if(!on){ if(el) el.remove(); return; }
  if(el) return;
  el = document.createElement('span');
  el.className = 'st-venom';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = Array.from({ length:7 }, (_, k)=>{
    const s = 4 + Math.random() * 5, l = 18 + Math.random() * 64, d = 1.5 + Math.random() * 1.3, dl = -Math.random() * 2.6, dx = (Math.random() - 0.5) * 10;
    return `<i style="left:${l.toFixed(1)}%;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;--dx:${dx.toFixed(1)}px;animation-duration:${d.toFixed(2)}s;animation-delay:${dl.toFixed(2)}s"></i>`;
  }).join('');
  host.appendChild(el);
}
/* ---------- the lean ---------- */
function stTiltOn(host, on, side){
  host.classList.toggle('st-tilt', !!on);
  host.classList.toggle('st-tilt-foe', !!on && side === 'enemy');
  host.classList.toggle('st-tilt-mine', !!on && side === 'player');
}
/* ---------- what each one carries ---------- */
function stLookPaint(){
  const b = ui.battle;
  if(!b) return;
  stLookCss();
  (b.enemies || []).forEach((e, i)=>{
    const host = document.getElementById('enemyBob-' + i);
    if(!host) return;
    const up = e.hp > 0;
    const stun = up && !!(getEStatus(e, 'paralysed') || getEStatus(e, 'stunned'));
    const nap = up && !!getEStatus(e, 'asleep');
    stStunOn(host, stun);
    stTiltOn(host, stun || nap, 'enemy');
    stVenomOn(host, up && !!getEStatus(e, 'venom'));
  });
  const venom = !!(typeof getPStatus === 'function' && getPStatus(0, 'venom'));
  (typeof shownPlayers === 'function' ? shownPlayers() : []).forEach(m=>{
    const host = document.getElementById(pid('playerBob', m));
    if(!host) return;
    const up = m.currentHp > 0;
    const stun = up && !!getMStatus(m, 'stunned');
    const nap = up && !!getMStatus(m, 'asleep');
    stStunOn(host, stun);
    stTiltOn(host, stun || nap, 'player');
    stVenomOn(host, up && venom);
  });
}
if(typeof renderStatusBadges === 'function'){
  const _stRenderBadges = renderStatusBadges;
  renderStatusBadges = function(){
    const r = _stRenderBadges.apply(this, arguments);
    try { stLookPaint(); } catch(e){ console.error('status look:', e); }
    return r;
  };
}
function stLookCss(){
  if(document.getElementById('stLookCss')) return;
  const st = document.createElement('style');
  st.id = 'stLookCss';
  st.textContent = `
  .bob{ position:relative; }
  /* the stars: over the head, a little wider than it */
  .st-stun{ position:absolute; left:8%; right:8%; top:-6%; height:30%; z-index:4; pointer-events:none; }
  .st-stun svg{ width:100%; height:100%; overflow:visible; display:block; }
  .st-stun .st-star{ fill:#ffe45c; stroke:#b07a12; stroke-width:1.1; stroke-linejoin:round; }
  .st-stun .st-trail{ fill:none; stroke:#fff6c8; stroke-width:2; stroke-linecap:round; }
  /* the lean, forward: theirs towards you, yours towards them; the feet stay where they are */
  .bob.st-tilt{ perspective:240px; }
  .bob.st-tilt .mon-sprite{ transform-origin:50% 100%; transition:rotate .45s cubic-bezier(.3,1.3,.5,1); }
  .bob.st-tilt-foe .mon-sprite{ rotate:x -20deg; }
  .bob.st-tilt-mine .mon-sprite{ rotate:x 20deg; }
  /* the venom: green bubbles rising off it, popping; a green tint coming and going */
  .st-venom{ position:absolute; left:10%; right:10%; top:24%; bottom:4%; z-index:3; pointer-events:none; }
  .st-venom i{ position:absolute; bottom:0; border-radius:50%; opacity:0;
    background:radial-gradient(circle at 35% 32%, #f2ffe0 0 18%, #9be35f 30%, #4fae2c 72%, rgba(42,110,26,.9) 100%);
    box-shadow:0 0 4px rgba(120,230,80,.6); animation:stBubble 2s ease-in infinite; }
  @keyframes stBubble{
    0%{ opacity:0; transform:translate(0,0) scale(.5); }
    12%{ opacity:.95; }
    78%{ opacity:.9; transform:translate(var(--dx), -62px) scale(1); }
    88%{ opacity:.9; transform:translate(var(--dx), -68px) scale(1.45); }
    100%{ opacity:0; transform:translate(var(--dx), -70px) scale(1.7); }
  }
  @keyframes stVenomTint{
    0%,100%{ filter:drop-shadow(0 3px 4px rgba(35,32,25,.2)); }
    50%{ filter:drop-shadow(0 3px 4px rgba(35,32,25,.2)) sepia(.45) hue-rotate(55deg) saturate(1.6) drop-shadow(0 0 4px rgba(120,220,80,.55)); }
  }
  .bob.st-venom-on .mon-sprite{ animation:stVenomTint 2.2s ease-in-out infinite; }
  .bob.st-venom-on .mon-sprite.breathe-normal{ animation:breatheNormal 4s ease-in-out infinite, stVenomTint 2.2s ease-in-out infinite; }
  .bob.st-venom-on .mon-sprite.breathe-weak{ animation:breatheWeak 7.6s ease-in-out infinite, stVenomTint 2.2s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce){
    .st-venom i{ animation:none; opacity:.8; bottom:40%; }
    .bob.st-venom-on .mon-sprite, .bob.st-venom-on .mon-sprite.breathe-normal, .bob.st-venom-on .mon-sprite.breathe-weak{ animation:none; }
    .bob.st-tilt .mon-sprite{ transition:none; }
  }`;
  document.head.appendChild(st);
}
