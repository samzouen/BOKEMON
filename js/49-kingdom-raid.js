/* ==========================================================
   49-kingdom-raid.js — (4.74) THE RAIDS. The designer:
   "Starting from castle level 2 (all buildings, towers and walls must be fully upgraded to level 2), the kingdom attracts
   the attention of the aliens, which will attack 3 times per level and must be defended against to progress kingdom
   construction to higher levels. … Walls can be manned by an army, which costs both gold and food upkeep. Towers can be
   loaded with spells which must be done prior to the attack. … The construction site can be loaded up with sums to provide
   limited self-repair to the walls. Barracks can be upgraded with sums to load up additional reserve defenders. These will
   all be deployed automatically during a battle. If the walls are breached, soldiers come out of the barracks to attack
   invaders. Invaders prioritise attacking towers within a certain proximity, then the palace. If the palace falls, the
   defence fails. There will be different types of spells that can be bought, some better at AOE and some better at single
   target which prioritise elite enemies. Some also prevent enemy special abilities."

   A raid plays itself out over the city's own board (47-kingdom-art.js draws it), in a layer over the kingdom screen:
   · the aliens come out of the forest in three waves; each walks to the nearest stretch of wall (to a breach, if one is
     near) and beats on it; the moat slows them and softens their blows (15% a level); fliers go over the walls, blasters
     hit walls twice as hard, healers mend the others (a Silence Bell stops all three);
   · the soldiers on the walls shoot the nearest; each tower's mage its bolts, and its spells when they serve: Thunder
     Spear at an elite (or the strongest), Fire Rain on a crowd, Frost Ring on two or more, Silence Bell on any with a
     power; the builders' repair kits mend a stretch that falls below a third;
   · a stretch beaten down is a breach: the invaders go in, for a tower near them, else the palace; the reserves (chestnut
     knights) come out of the barracks at the first one inside;
   · the palace beaten down: the raid is lost (the spells cast and the reserves fallen stay lost; nothing else). Every
     alien beaten: held off (kingdom.city.raids[castle level] + 1).
   Seen at its own speed, or twice as fast. Pure enough to run without a screen (krStep), for the tests.
   ========================================================== */
const KR_ALIENS = [
  { sp:'alien_insect_physical', type:'Physical', name:'Insect drone' },  { sp:'alien_crocodilian_fire', type:'Fire', name:'Fire lizard', ab:'blast' },
  { sp:'alien_dolphin_water', type:'Water', name:'Sea strider' },        { sp:'alien_flower_grass', type:'Grass', name:'Bloom', ab:'heal' },
  { sp:'alien_magnet_electric', type:'Electric', name:'Magnet drone' },  { sp:'alien_cocoon_flying', type:'Flying', name:'Sky cocoon', ab:'fly' },
  { sp:'alien_grimgate_psychic', type:'Psychic', name:'Grimgate' },      { sp:'alien_toxic_gas_ghost', type:'Ghost', name:'Gas wraith' },
  { sp:'alien_gremlin_fairy', type:'Fairy', name:'Gremlin' },            { sp:'alien_golem_ground', type:'Ground', name:'Rock golem' },
  { sp:'alien_robot_steel', type:'Steel', name:'Steel walker' },         { sp:'alien_plant_hydra_dragon', type:'Dragon', name:'Hydra vine', ab:'heal' },
];
const KR_ELITE = { sp:'alien_captain_humanoid', type:'Physical', name:'Alien captain', elite:true };
const KR_BOSS = { sp:'alien_commander_octopus', type:'Psychic', name:'Alien commander', elite:true, boss:true, ab:'blast' };
const KR_AB = { fly:'flies over the walls', heal:'heals the others', blast:'blasts the walls' };
const KR_STEP = 50;                                                   // ms of the raid a step
const KR_WAVES = [1500, 20000, 38000];                                // when each wave comes
const KR_LONGEST = 200000;                                            // the aliens give up after this
const krRand = ()=> (typeof kqRand === 'function' ? kqRand() : Math.random());
const krInt = (a, b)=> a + Math.floor(krRand() * (b - a + 1));
const krD = (a, b)=> Math.hypot(a.x - b.x, a.y - b.y);

/* ---------- THE RAID, SET UP FROM THE CITY ---------- */
function krSetup(K){
  const C = K.city, CL = kcCastle(K), nx = kcRaidNext(K), n = nx ? nx.n : 1, P = kcLv(K, 'palace');
  const G = KC_ART.geo(C), W = C.walls || 0, M = C.moat || 0, mid = KC_C * 100 + 50;
  const R = { K, C, CL, n, P, W, M, G, t:0, speed:1, over:false, won:false, x0:G.x0, x1:G.x1,
              segs:[], towers:[], soldiers:[], aliens:[], reserves:[], fx:[], spawn:[], kits:C.kits || 0, resLeft:C.reserves || 0,
              log:{ killed:0, kits:0, spells:0, fallen:0, breaches:0, towersDown:0 } };
  /* the walls, a stretch for each plot along each side */
  const segMax = W >= 2 ? 80 + 60 * W : 100;
  const len = Math.round((G.x1 - G.x0) / 100);
  for(let k = 0; k < len; k++){
    const a = G.x0 + k * 100, b = a + 100;
    R.segs.push({ side:'N', x0:a, y0:G.x0, x1:b, y1:G.x0, hp:segMax, max:segMax });
    R.segs.push({ side:'S', x0:a, y0:G.x1, x1:b, y1:G.x1, hp:segMax, max:segMax, gate:a === KC_C * 100 });
    R.segs.push({ side:'W', x0:G.x0, y0:a, x1:G.x0, y1:b, hp:segMax, max:segMax });
    R.segs.push({ side:'E', x0:G.x1, y0:a, x1:G.x1, y1:b, hp:segMax, max:segMax });
  }
  /* the palace (its middle, at its own level's size); the towers and their spells; the soldiers along the walls */
  const pf = kcPalaceFoot(P);
  R.palace = { x:(pf[0] + pf[2] / 2) * 100, y:(pf[1] + pf[3] / 2) * 100 + 20, hp:300 + 120 * P, max:300 + 120 * P };
  kcTowers(C).forEach(i=>{ const c = C.cells[i], [x, y] = kcXY(i), L = c.lv || 1;
    R.towers.push({ i, x:x * 100 + 50, y:y * 100 + 60, L, hp:150 + 40 * L, max:150 + 40 * L, range:kcTowerRange(P) * 100, cd:krInt(0, 800), scd:0,
                    spells:(c.spells || []).map(s=> ({ k:s.k, casts:s.casts })), down:false }); });
  const army = Math.min(C.army || 0, kcArmyMax(K)), per = army;
  for(let s = 0; s < per; s++){
    const u = (s + 0.5) / per * 4, side = Math.floor(u), f = u - side, span = G.x1 - G.x0;
    const at = side === 0 ? [G.x0 + f * span, G.x0] : side === 1 ? [G.x1, G.x0 + f * span] : side === 2 ? [G.x1 - f * span, G.x1] : [G.x0, G.x1 - f * span];
    R.soldiers.push({ x:at[0], y:at[1], cd:krInt(0, 1400) });
  }
  const bk = kcSeatOf(C, 'barracks'), [bx, by] = kcXY(bk >= 0 ? bk : kcAt(KC_C, KC_C));
  R.barracks = { x:bx * 100 + 50, y:by * 100 + 70, L:Math.max(1, kcLv(K, 'barracks')) };
  /* the aliens: more, stronger, with each castle level and each raid of it; a captain from raid 2, the commander at 3 */
  const count = 5 + 2 * CL + 2 * n, hp = 40 + 22 * CL, dmg = 6 + 3 * CL;
  const list = Array.from({ length:count }, ()=> Object.assign({}, KR_ALIENS[krInt(0, KR_ALIENS.length - 1)]));
  if(n >= 2) list.push(Object.assign({}, KR_ELITE));
  if(n >= 3) list.push(Object.assign({}, KR_BOSS));
  list.forEach((a, k)=>{
    const wave = k % 3, at = KR_WAVES[wave] + krInt(0, 3500);
    const m = a.boss ? 5 : a.elite ? 2.5 : 1;
    R.spawn.push({ at, a:Object.assign(a, { hp:Math.round(hp * m), max:Math.round(hp * m), dmg:Math.round(dmg * (a.boss ? 2 : a.elite ? 1.5 : 1)), speed:a.ab === 'fly' ? 36 : a.boss ? 22 : 28,
      size:a.boss ? 136 : a.elite ? 106 : 80, cd:0, state:'out', slowUntil:0, silentUntil:0 }) });
  });
  R.spawn.sort((p, q)=> p.at - q.at);
  R.total = R.spawn.length;
  return R;
}
/* where one comes out of the forest: on a side, a few plots from the walls */
function krEntry(R){
  const side = krInt(0, 3), far = 200 + krInt(0, 40), along = R.x0 - 150 + krRand() * (R.x1 - R.x0 + 300);
  const lo = R.x0 - far, hi = R.x1 + far, clamp = v=> Math.max(20, Math.min(KC_N * 100 - 20, v));
  return side === 0 ? { x:clamp(along), y:clamp(lo) } : side === 1 ? { x:clamp(hi), y:clamp(along) } : side === 2 ? { x:clamp(along), y:clamp(hi) } : { x:clamp(lo), y:clamp(along) };
}
const krIn = (R, p, pad)=> p.x > R.x0 + (pad || 0) && p.x < R.x1 - (pad || 0) && p.y > R.x0 + (pad || 0) && p.y < R.x1 - (pad || 0);
/* the nearest point of the walls to p, and its stretch */
function krWallAt(R, p){
  let best = null, bd = 1e9;
  R.segs.forEach(s=>{ const q = s.side === 'N' || s.side === 'S' ? { x:Math.max(s.x0, Math.min(s.x1, p.x)), y:s.y0 } : { x:s.x0, y:Math.max(s.y0, Math.min(s.y1, p.y)) };
    const d = krD(p, q); if(d < bd){ bd = d; best = { s, q, d }; } });
  return best;
}
const krSegMid = s=> ({ x:(s.x0 + s.x1) / 2, y:(s.y0 + s.y1) / 2 });
function krHit(R, a, d, from){
  if(a.dead) return;
  a.hp -= d; R.fx.push({ k:'hit', x:a.x, y:a.y - a.size * 0.6, t:R.t, life:350, d:Math.round(d) });
  if(a.hp <= 0){ a.dead = true; R.log.killed++; R.fx.push({ k:'pop', x:a.x, y:a.y - a.size * 0.4, t:R.t, life:500 }); }
}
const krAlive = R=> R.aliens.filter(a=> !a.dead);
const krSilent = (R, a)=> R.t < a.silentUntil;

/* ---------- ONE STEP OF THE RAID (KR_STEP ms) ---------- */
function krStep(R){
  if(R.over) return;
  const dt = KR_STEP, t = (R.t += dt);
  /* the waves */
  while(R.spawn.length && R.spawn[0].at <= t){ const s = R.spawn.shift(), e = krEntry(R); R.aliens.push(Object.assign(s.a, { x:e.x, y:e.y })); }
  const alive = krAlive(R);
  /* the aliens */
  alive.forEach(a=>{
    const slow = t < a.slowUntil ? 0.5 : 1;
    const fly = a.ab === 'fly' && !krSilent(R, a);
    if(a.ab === 'heal' && !krSilent(R, a) && t % 1000 < dt) alive.forEach(b=>{ if(b !== a && !b.dead && krD(a, b) < 110 && b.hp < b.max) b.hp = Math.min(b.max, b.hp + b.max * 0.04); });
    const inside = krIn(R, a);
    if(a.state === 'out' && (inside || fly)) a.state = 'in';
    if(a.state === 'out'){
      /* to a breach near it, else the nearest stretch of wall */
      const br = R.segs.filter(s=> s.down).map(s=> ({ s, p:krSegMid(s) })).filter(o=> krD(a, o.p) < 380).sort((p, q)=> krD(a, p.p) - krD(a, q.p))[0];
      if(br){ const d = krD(a, br.p);
        if(d < 14){ const c = { x:R.palace.x, y:R.palace.y }, k = 40 / Math.max(1, krD(br.p, c)); a.x = br.p.x + (c.x - br.p.x) * k; a.y = br.p.y + (c.y - br.p.y) * k; a.state = 'in'; return; }
        krMove(R, a, br.p, slow); return; }
      const w = krWallAt(R, a);
      if(w.d > 16){ krMove(R, a, w.q, slow); return; }
      /* at the wall: beat on it */
      a.cd -= dt; if(a.cd > 0) return; a.cd = 1200;
      const s = w.s; if(s.down) return;
      s.hp -= a.dmg * (1 - 0.15 * R.M) * (a.ab === 'blast' && !krSilent(R, a) ? 2 : 1);
      R.fx.push({ k:'thud', x:w.q.x, y:w.q.y, t, life:260 });
      /* the builders' kits: a stretch below a third is mended by half */
      if(s.hp > 0 && s.hp < s.max * 0.34 && R.kits > 0){ R.kits--; R.log.kits++; s.hp = Math.min(s.max, s.hp + s.max * 0.5); R.fx.push({ k:'mend', x:w.q.x, y:w.q.y, t, life:900 }); }
      if(s.hp <= 0){ s.hp = 0; s.down = true; R.log.breaches++; R.fx.push({ k:'breach', x:krSegMid(s).x, y:krSegMid(s).y, t, life:1200 }); }
      return;
    }
    /* inside: a reserve on it, fight it; else a tower near, else the palace */
    const foe = R.reserves.filter(r=> !r.dead && krD(r, a) < 34)[0];
    let tgt = foe;
    if(!tgt){ const tw = R.towers.filter(x=> !x.down && krD(x, a) < 300).sort((p, q)=> krD(a, p) - krD(a, q))[0]; tgt = tw || R.palace; }
    if(krD(a, tgt) > (tgt === R.palace ? 50 : 28)){ krMove(R, a, tgt, slow); return; }
    a.cd -= dt; if(a.cd > 0) return; a.cd = 1200;
    tgt.hp -= a.dmg; R.fx.push({ k:'thud', x:tgt.x, y:tgt.y - 10, t, life:260 });
    if(tgt === R.palace){ if(tgt.hp <= 0){ tgt.hp = 0; R.over = true; R.won = false; } }
    else if(tgt.hp <= 0){ tgt.dead = tgt.down = true; if(R.towers.includes(tgt)) R.log.towersDown++; else R.log.fallen++; }
  });
  /* the soldiers on the walls */
  const atkS = 5 + R.W;
  R.soldiers.forEach(s=>{ s.cd -= dt; if(s.cd > 0) return;
    const a = krAlive(R).filter(b=> krD(s, b) < 240).sort((p, q)=> krD(s, p) - krD(s, q))[0];
    if(!a){ s.cd = 200; return; } s.cd = 1500;
    R.fx.push({ k:'arrow', x:s.x, y:s.y, tx:a.x, ty:a.y - a.size * 0.45, t, life:220 }); krHit(R, a, atkS, s); });
  /* the towers: a bolt; a spell when it serves */
  R.towers.forEach(w=>{
    if(w.down) return;
    const near = krAlive(R).filter(a=> krD(w, a) < w.range);
    w.scd -= dt;
    if(near.length && w.scd <= 0) krSpell(R, w, near);
    w.cd -= dt; if(w.cd > 0) return;
    const a = near.sort((p, q)=> krD(w, p) - krD(w, q))[0];
    if(!a){ w.cd = 200; return; } w.cd = 1600;
    R.fx.push({ k:'bolt', x:w.x, y:w.y - 70, tx:a.x, ty:a.y - a.size * 0.45, t, life:260 }); krHit(R, a, 8 + 5 * w.L, w);
  });
  /* the reserves: out of the barracks once an alien is inside; each goes for the nearest one inside */
  if(R.resLeft > 0 && krAlive(R).some(a=> a.state === 'in')){
    const L = R.barracks.L;
    for(let k = 0; k < R.resLeft; k++) R.reserves.push({ x:R.barracks.x + (k % 4) * 14 - 21, y:R.barracks.y + Math.floor(k / 4) * 12, hp:50 + 15 * L, max:50 + 15 * L, dmg:7 + 3 * L, cd:krInt(0, 600), dead:false });
    R.resLeft = 0; R.fx.push({ k:'call', x:R.barracks.x, y:R.barracks.y - 30, t, life:1400 });
  }
  R.reserves.forEach(r=>{
    if(r.dead) return;
    const a = krAlive(R).filter(b=> b.state === 'in').sort((p, q)=> krD(r, p) - krD(r, q))[0];
    if(!a) return;
    if(krD(r, a) > 26){ krMove(R, r, a, 1, 46); return; }
    r.cd -= dt; if(r.cd > 0) return; r.cd = 1000; krHit(R, a, r.dmg, r);
  });
  R.fx = R.fx.filter(f=> t - f.t < f.life);
  /* won: all come and all beaten (or, very long, they give up) */
  if(!R.over && ((!R.spawn.length && !krAlive(R).length) || t >= KR_LONGEST)){ R.over = true; R.won = true; }
}
function krMove(R, a, to, slow, speed){
  const d = krD(a, to); if(d < 0.5) return;
  /* the moat slows them as they wade it */
  const inMoat = R.M && !krIn(R, a) && krIn(R, a, -(16 + R.G.w));
  const v = (speed || a.speed) * slow * (inMoat ? 0.5 : 1) * KR_STEP / 1000, k = Math.min(1, v / d);
  a.x += (to.x - a.x) * k; a.y += (to.y - a.y) * k;
}
/* a tower's spells, as they serve: one at a time, a few seconds between */
function krSpell(R, w, near){
  const P = R.P, have = k=> w.spells.find(s=> s.k === k && s.casts > 0);
  const use = (s, fx)=>{ s.casts--; R.log.spells++; w.scd = 3000; R.fx.push(Object.assign({ t:R.t, life:900 }, fx)); };
  let s;
  if((s = have('silence')) && near.some(a=> a.ab && !krSilent(R, a))){ near.forEach(a=>{ a.silentUntil = R.t + 9000; }); return use(s, { k:'silence', x:w.x, y:w.y - 40, r:w.range }); }
  if((s = have('thunder'))){ const tg = near.filter(a=> a.elite)[0] || near.slice().sort((p, q)=> q.hp - p.hp)[0];
    if(tg && (tg.elite || tg.hp > 60)){ krHit(R, tg, 50 + 18 * P, w); return use(s, { k:'thunder', x:w.x, y:w.y - 70, tx:tg.x, ty:tg.y - tg.size * 0.5 }); } }
  if((s = have('fire'))){ const c = near.find(a=> near.filter(b=> krD(a, b) < 90).length >= 3);
    if(c){ near.filter(b=> krD(c, b) < 90).forEach(b=> krHit(R, b, 28 + 9 * P, w)); return use(s, { k:'fire', x:c.x, y:c.y, r:90 }); } }
  if((s = have('frost')) && near.filter(a=> R.t >= a.slowUntil).length >= 2){ near.forEach(a=>{ a.slowUntil = R.t + 6000; }); return use(s, { k:'frost', x:w.x, y:w.y - 20, r:w.range }); }
}
/* the city afterwards: the spells cast gone, the kits used, the fallen reserves; won, the raid counted */
function krSettle(R){
  const C = R.C;
  R.towers.forEach(w=>{ const c = C.cells[w.i]; if(c && c.k === 'tower') c.spells = w.spells.filter(s=> s.casts > 0).map(s=> ({ k:s.k, casts:s.casts })); });
  C.kits = R.kits;
  C.reserves = R.resLeft + R.reserves.filter(r=> !r.dead).length;
  if(R.won){ C.raids = C.raids || {}; C.raids[R.CL] = (C.raids[R.CL] || 0) + 1; }
}

/* ---------- ON SCREEN: a layer over the kingdom, the board cut to the walls and round them ---------- */
const KR_PICS = {};
function krPic(sp){
  let im = KR_PICS[sp];
  if(!im){ im = KR_PICS[sp] = new Image(); im.src = sp.startsWith('assets/') ? sp : 'assets/mon/' + sp + '.png'; }
  return im.complete && im.naturalWidth ? im : null;
}
async function kdRaidStart(){
  const K = kd(), nx = kcRaidNext(K);
  if(!nx || !nx.ready || document.getElementById('kdRaid')) return;
  kdCss(); krCss();
  const R = krSetup(K);
  KR_ALIENS.concat([KR_ELITE, KR_BOSS]).forEach(a=> krPic(a.sp)); ['chestnut_knight_front', 'chestnut_knight1_front'].forEach(krPic);
  const box = document.createElement('div');
  box.className = 'kr-over'; box.id = 'kdRaid';
  box.innerHTML = `<div class="kr-top">
      <div class="kr-title"><b>Raid ${R.n} of 3</b><small>Castle level ${R.CL}</small></div>
      <div class="kr-pal"><span>The palace</span><i><b id="krPal"></b></i><em id="krPalN"></em></div>
      <div class="kr-btns"><button class="btn btn-ghost" id="krFast" aria-pressed="false">Twice as fast</button><button class="btn btn-ghost" id="krQuit">Give up</button></div></div>
    <div class="kr-stage"><canvas id="krCv" aria-label="The raid, seen from above"></canvas></div>
    <div class="kr-bar" id="krBar" aria-live="polite"></div>`;
  document.body.appendChild(box);
  const cv = box.querySelector('#krCv');
  /* the board behind it all (drawn once) */
  R.bg = KC_ART.render(K, 1600);
  /* the walls and a little round them, the rest of the stage filled with more of the forest (as tall as it is) */
  const size = ()=>{
    const st = box.querySelector('.kr-stage'), sw = st.clientWidth, sh = Math.max(200, st.clientHeight || sw), dpr = Math.min(2, window.devicePixelRatio || 1);
    const U = KC_N * 100, pad = 230, span = Math.min(U, R.x1 - R.x0 + 2 * pad), mid = (R.x0 + R.x1) / 2;
    let vw = span, vh = span;
    if(sh / sw > 1) vh = Math.min(U, span * sh / sw); else vw = Math.min(U, span * sw / sh);
    const fit = Math.min(sw / vw, sh / vh), cw = Math.round(vw * fit), ch = Math.round(vh * fit);
    R.view = { x:Math.max(0, Math.min(U - vw, mid - vw / 2)), y:Math.max(0, Math.min(U - vh, mid - vh / 2)), w:vw, h:vh };
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  };
  size(); addEventListener('resize', size);
  box.querySelector('#krFast').addEventListener('click', e=>{ R.speed = R.speed === 1 ? 2 : 1; e.currentTarget.setAttribute('aria-pressed', String(R.speed === 2)); e.currentTarget.textContent = R.speed === 2 ? 'Normal speed' : 'Twice as fast'; });
  box.querySelector('#krQuit').addEventListener('click', ()=>{ if(!R.over){ R.over = true; R.won = false; R.quit = true; } });
  let last = performance.now(), acc = 0;
  const frame = now=>{
    if(!box.isConnected) return;
    acc += Math.min(250, now - last) * R.speed; last = now;
    while(acc >= KR_STEP && !R.over){ krStep(R); acc -= KR_STEP; }
    krDraw(R, cv);
    krHud(R, box);
    if(R.over){ removeEventListener('resize', size); return krEnd(R, box); }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function krDraw(R, cv){
  const g = cv.getContext('2d'), V = R.view, k = cv.width / V.w, sb = R.bg.width / (KC_N * 100);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(R.bg, V.x * sb, V.y * sb, V.w * sb, V.h * sb, 0, 0, cv.width, cv.height);
  g.setTransform(k, 0, 0, k, -V.x * k, -V.y * k);
  const T = R.t;
  /* the walls' wounds: a bar over each beaten stretch, rubble in a breach */
  R.segs.forEach(s=>{
    if(s.hp >= s.max) return;
    const m = krSegMid(s), horiz = s.side === 'N' || s.side === 'S';
    if(s.down){ g.fillStyle = 'rgba(70,52,36,.92)'; if(horiz) g.fillRect(s.x0 + 18, s.y0 - 26, 64, 30); else g.fillRect(s.x0 - 14, s.y0 + 18, 28, 64);
      g.fillStyle = '#a99a84'; for(let q = 0; q < 7; q++){ const rx = horiz ? s.x0 + 22 + q * 9 : s.x0 - 10 + (q % 3) * 8, ry = horiz ? s.y0 - 6 - (q % 3) * 6 : s.y0 + 24 + q * 8; g.fillRect(rx, ry, 7, 5); } return; }
    const f = s.hp / s.max; g.fillStyle = 'rgba(30,20,10,.55)'; g.fillRect(m.x - 30, m.y - 42, 60, 7); g.fillStyle = f > 0.5 ? '#6fbf5a' : f > 0.34 ? '#e8c34a' : '#d9533c'; g.fillRect(m.x - 29, m.y - 41, 58 * f, 5);
  });
  /* the towers' health, when hurt; one beaten down, smoke */
  R.towers.forEach(w=>{ if(w.down){ g.fillStyle = 'rgba(60,60,60,.45)'; g.beginPath(); g.arc(w.x, w.y - 60, 22, 0, Math.PI * 2); g.fill(); return; }
    if(w.hp < w.max){ g.fillStyle = 'rgba(30,20,10,.55)'; g.fillRect(w.x - 24, w.y - 128, 48, 6); g.fillStyle = '#6fbf5a'; g.fillRect(w.x - 23, w.y - 127, 46 * w.hp / w.max, 4); } });
  /* the reserves, the aliens (back to front) */
  const who = R.reserves.filter(r=> !r.dead).map(r=> ({ y:r.y, f:()=> krFig(g, krPic('chestnut_knight1_front'), r.x, r.y, 30, false, r.hp / r.max, '#3f8f6b') }))
    .concat(krAlive(R).map(a=> ({ y:a.y, f:()=> krFig(g, krPic(a.sp), a.x, a.y, a.size, a.x > KC_C * 100 + 50, a.hp / a.max, a.elite ? '#b03ad8' : '#d9533c', a, R) })));
  who.sort((p, q)=> p.y - q.y).forEach(o=> o.f());
  /* what flies */
  R.fx.forEach(f=>{
    const u = (T - f.t) / f.life;
    if(f.k === 'arrow' || f.k === 'bolt' || f.k === 'thunder'){
      const x = f.x + (f.tx - f.x) * Math.min(1, u * 1.3), y = f.y + (f.ty - f.y) * Math.min(1, u * 1.3);
      if(f.k === 'arrow'){ g.strokeStyle = '#3a2412'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(x - (f.tx - f.x) * 0.06, y - (f.ty - f.y) * 0.06); g.lineTo(x, y); g.stroke(); }
      else if(f.k === 'bolt'){ g.fillStyle = 'rgba(170,230,255,.95)'; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(120,200,255,.35)'; g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.fill(); }
      else { g.strokeStyle = `rgba(255,236,120,${1 - u})`; g.lineWidth = 5; g.beginPath(); g.moveTo(f.x, f.y); const n = 6; for(let q = 1; q <= n; q++){ const px = f.x + (f.tx - f.x) * q / n + (q < n ? (krRand() - 0.5) * 30 : 0), py = f.y + (f.ty - f.y) * q / n; g.lineTo(px, py); } g.stroke(); }
    }
    else if(f.k === 'fire'){ g.fillStyle = `rgba(255,120,40,${0.45 * (1 - u)})`; g.beginPath(); g.arc(f.x, f.y, f.r, 0, Math.PI * 2); g.fill(); for(let q = 0; q < 8; q++){ const a = q * 0.8 + u * 3; g.fillStyle = `rgba(255,${180 + q * 8},60,${1 - u})`; g.beginPath(); g.arc(f.x + Math.cos(a) * f.r * 0.6, f.y + Math.sin(a) * f.r * 0.5 - 30 * (1 - u), 9, 0, Math.PI * 2); g.fill(); } }
    else if(f.k === 'frost' || f.k === 'silence'){ g.strokeStyle = f.k === 'frost' ? `rgba(150,220,255,${1 - u})` : `rgba(190,140,255,${1 - u})`; g.lineWidth = 6; g.beginPath(); g.arc(f.x, f.y, f.r * Math.min(1, u * 1.6), 0, Math.PI * 2); g.stroke(); }
    else if(f.k === 'hit'){ g.fillStyle = `rgba(255,255,255,${1 - u})`; g.font = '800 26px Nunito, sans-serif'; g.textAlign = 'center'; g.fillText('−' + f.d, f.x, f.y - 20 * u); }
    else if(f.k === 'mend'){ g.strokeStyle = `rgba(120,230,120,${1 - u})`; g.lineWidth = 4; g.beginPath(); g.arc(f.x, f.y - 20, 16 + 20 * u, 0, Math.PI * 2); g.stroke(); }
    else if(f.k === 'breach'){ g.fillStyle = `rgba(90,60,30,${0.6 * (1 - u)})`; g.beginPath(); g.arc(f.x, f.y - 10, 30 + 50 * u, 0, Math.PI * 2); g.fill(); }
    else if(f.k === 'thud'){ g.fillStyle = `rgba(255,240,200,${0.8 * (1 - u)})`; g.beginPath(); g.arc(f.x, f.y - 12, 8 + 10 * u, 0, Math.PI * 2); g.fill(); }
    else if(f.k === 'call'){ g.fillStyle = `rgba(255,255,255,${1 - u})`; g.font = '800 30px Nunito, sans-serif'; g.textAlign = 'center'; g.fillText('To arms!', f.x, f.y - 30 * u); }
  });
}
/* one of them: its picture (or a ball, till it has loaded), a health bar over it, a ring if slowed or silenced */
function krFig(g, im, x, y, ht, flip, f, col, a, R){
  g.fillStyle = 'rgba(20,28,12,.3)'; g.beginPath(); g.ellipse(x + 3, y, ht * 0.32, ht * 0.1, 0, 0, Math.PI * 2); g.fill();
  if(im){ g.save(); g.translate(x, y); if(flip) g.scale(-1, 1); g.imageSmoothingEnabled = true; g.drawImage(im, -ht * 0.62, -ht * 1.12, ht * 1.24, ht * 1.24); g.restore(); }
  else { g.fillStyle = col; g.beginPath(); g.arc(x, y - ht * 0.45, ht * 0.4, 0, Math.PI * 2); g.fill(); }
  if(a && R && R.t < a.slowUntil){ g.strokeStyle = 'rgba(150,220,255,.9)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y - 2, ht * 0.45, ht * 0.16, 0, 0, Math.PI * 2); g.stroke(); }
  if(a && R && R.t < a.silentUntil){ g.fillStyle = 'rgba(190,140,255,.95)'; g.beginPath(); g.arc(x + ht * 0.4, y - ht * 1.05, 6, 0, Math.PI * 2); g.fill(); }
  if(f < 1){ g.fillStyle = 'rgba(20,14,10,.6)'; g.fillRect(x - ht * 0.45, y - ht * 1.2, ht * 0.9, 6); g.fillStyle = col; g.fillRect(x - ht * 0.45 + 1, y - ht * 1.2 + 1, (ht * 0.9 - 2) * Math.max(0, f), 4); }
}
function krHud(R, box){
  const pb = box.querySelector('#krPal'); if(pb){ const f = R.palace.hp / R.palace.max; pb.style.width = (f * 100).toFixed(1) + '%'; pb.className = f < 0.3 ? 'low' : ''; }
  const pn = box.querySelector('#krPalN'); if(pn) pn.textContent = `${Math.ceil(R.palace.hp)} / ${R.palace.max}`;
  const bar = box.querySelector('#krBar'); if(!bar) return;
  const wave = KR_WAVES.filter(w=> w <= R.t).length, left = krAlive(R).length + R.spawn.length;
  const spells = R.towers.reduce((a, w)=> a + w.spells.reduce((b, s)=> b + s.casts, 0), 0);
  const html = `<span>Wave ${Math.max(1, wave)} of 3</span><span>${left} alien${left === 1 ? '' : 's'} left</span><span>${kcIcon('soldier')}${R.soldiers.length}</span><span>${kcIcon('tower')}${R.towers.filter(w=> !w.down).length} · ${spells} cast${spells === 1 ? '' : 's'} left</span><span>${kcIcon('kit')}${R.kits}</span><span>${kcIcon('reserve')}${R.resLeft + R.reserves.filter(r=> !r.dead).length}</span>${R.log.breaches ? `<span class="br">${R.log.breaches} breach${R.log.breaches > 1 ? 'es' : ''}</span>` : ''}`;
  if(bar._h !== html){ bar._h = html; bar.innerHTML = html; }
}
async function krEnd(R, box){
  krSettle(R);
  await saveProfile();
  const won = R.won, L = R.log;
  const card = document.createElement('div');
  card.className = 'kd-card kd-overcard kr-end';
  card.innerHTML = `<div class="kd-h">${won ? 'The city held!' : R.quit ? 'The city gave way' : 'The palace fell'}</div>
    <p class="kd-sub2">${won ? `Raid ${R.n} of castle level ${R.CL} is held off. ${R.n < 3 ? `It opens ${KC_RAID_UNLOCKS[R.n]}.` : 'Everything can go up a level now.'}`
                             : 'The aliens fall back for now. Nothing is lost but the spells cast and the reserves who fell. Load the towers, the yard and the barracks, man the walls, and try again.'}</p>
    <p class="kd-sub2">${L.killed} aliens beaten · ${L.spells} spell${L.spells === 1 ? '' : 's'} cast · ${L.kits} repair kit${L.kits === 1 ? '' : 's'} used${L.breaches ? ` · ${L.breaches} breach${L.breaches > 1 ? 'es' : ''}` : ''}${L.fallen ? ` · ${L.fallen} reserve${L.fallen > 1 ? 's' : ''} fell` : ''}</p>
    <div class="kd-row"><button class="btn btn-primary" id="krBack">Back to the city</button></div>`;
  box.appendChild(card);
  card.querySelector('#krBack').addEventListener('click', ()=>{ box.remove(); if(ui.screen === 'kingdom') renderKingdom(); });
  setTimeout(()=>{ const b = card.querySelector('#krBack'); if(b) b.focus(); }, 60);
}
function krCss(){
  if(document.getElementById('krCss')) return;
  const st = document.createElement('style'); st.id = 'krCss';
  st.textContent = `
  .kr-over{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;gap:8px;padding:10px 16px 12px;background:#1d2618;color:#f6f1e4;}
  .kr-pal em{font-style:normal;font-variant-numeric:tabular-nums;font-size:12px;opacity:.85;min-width:5.5em;text-align:right;}
  .kr-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
  .kr-title{display:flex;flex-direction:column;line-height:1.1;} .kr-title b{font:800 20px 'Baloo 2',cursive;} .kr-title small{font-size:12px;opacity:.8;}
  .kr-pal{flex:1 1 180px;display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;}
  .kr-pal i{flex:1;height:12px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden;}
  .kr-pal b{display:block;height:100%;width:100%;background:#6fbf5a;transition:width .3s;} .kr-pal b.low{background:#d9533c;}
  .kr-btns{display:flex;gap:6px;} .kr-btns .btn{padding:6px 12px;font-size:13px;}
  .kr-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;}
  .kr-stage canvas{border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.45);background:#3a5a2a;touch-action:manipulation;}
  .kr-bar{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;font-size:13px;font-weight:800;}
  .kr-bar span{display:inline-flex;align-items:center;gap:4px;} .kr-bar .kc-ic{width:18px;height:18px;} .kr-bar .br{color:#ffb38a;}
  .kr-end{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:min(440px,calc(100vw - 32px));color:var(--ink);text-align:center;}
  @media (max-width:560px){ .kr-over{padding:8px 10px;} .kr-title b{font-size:17px;} .kr-btns .btn{padding:5px 9px;font-size:12px;} }`;
  document.head.appendChild(st);
}
