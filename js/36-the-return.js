/* ============================================================
   36-the-return.js — THE RETURN TO THE CASTLE (4.33)
   The designer, 2026-11-12: "The princess is with the player when the king is hit with the laser because of an
   earlier storyline. I messed it up a bit. Can we follow this progression?
     The player will be asked to return swiftly after the last tribe's unsealing. The king and player appear at the
     castle perimeter and see that soldiers are already fighting aliens. A chestnut knight reports that aliens used
     flying cocoons to land directly in the castle. The king, horrified, rushes in with the player hot on his heels (all
     animated, movement and hamburger menu locked out, force closing before sequence is finished brings player back to
     arrival moment)
     Commander and soldiers are fighting in the open castle area, near the fountain, citizens are running in terror,
     and soldiers are engaged, 2 per alien. Commander facing 1 alien commander and 1 alien captain. Commander tells the
     king that the princess is still in the castle with dauphin and advisor. The king is weakened but wants to help,
     but says he cannot abandon his citizens, and must trust in his daughter the dauphin and the player. He asks the
     player to help rescue the princess.
     The player fights through the castle, directed by dauphin and advisor who are fighting commander and captain
     respectively. Player battles 3 aliens along the right perimeter and 3 on the second floor, rescues princess, comes
     back and goes to the king but then the king is struck suddenly for the first time by wadjet"
   — and "Wadjet escapes into the northern edge of the map, not the castle wall, sorry! That's where the army's
   perimeter will be in the post region state where alien counts on the map are halved but aliens are continually
   battling at the north edge's rift."
   Asked: his shadows fight the Dauphin and the Advisor, who follow you out of the palace; the tribes march in as you
   come out with her; the fights "3 singles below, 1 single, 1 captain, 1 commander above".

   Here: the word at the last village (invReturnStart, from 28-unseal.js's unEnding); the gate, the rush in and the
   fountain (invArriveRun: one scene from the jungle into the castle; until it is over the stage stays 'arrive', and
   it plays again from the gate); the hall (invPalaceIntro), the sisters (invSisters), the tribes (invTribesV433), the
   strike by the fountain (invStrike), his flight (invAfterGrounds), the chase through the jungle to its north edge, the
   rift, its army, the Commander's soldiers (invRiftChaseJungleRun, invRiftHoldJungleRun); and afterwards the rift's
   perimeter at the north edge, its soldiers and aliens forever at it (riftJungleThings, riftJungleDraw). The stages,
   the bands and the things on the castle's own decks are 26-invasion.js's.
   ============================================================ */

/* ---------- where things stand on the jungle: by the castle's south gate, and at the north edge ---------- */
function invArriveAt(){
  const C = jgGround().places.castle, gx = C.gate.x, gy = C.y + C.h;    // the gate's west square; the road's first row
  return { gx, gy, you:{ x:gx + 1, y:gy + 3 }, king:{ x:gx + 3, y:gy + 3 }, lion:{ x:gx - 1, y:gy + 3 } };
}
function invNorth(){ return jgGround().places.north; }
const INV_RIFT_JG = { id:'inv-r1', rank:'commander', riftJg:true, tribe:null, lv:175 };

/* ============================================================
   THE WORD AT THE LAST VILLAGE
   ============================================================ */
/* the fourth ancestor woken and its village saved: a knight from the castle (in the unsealing's own scene); the state
   of the story moves on; says so */
async function invReturnStart(k){
  await unLines([
    ['n', `Hooves on the path — a Chestnut Knight bursts out of the trees, his armour scorched, and all but falls from his saddle before the King.`],
    ['knight', `<b>"Your Majesty! The castle — aliens, dropping out of the sky over the walls! The Commander begs you: come back, swiftly!"</b>`],
    ['king', `The King is on his feet before anyone can stop him, grey as ash.<br><br><b>"My castle… my daughters are in there!"</b>`],
    ['g', `<b>"Our fairies know the hidden paths — the quickest way there is. GO! We will follow when we can."</b>`],
    ['lion', `<b>"Hold on, Your Majesty. We run!"</b>`]], k);
  if(typeof unGone === 'function' && unGone()) return false;
  const w = unWar();
  unRite(k).done = true;
  w.escort = null;
  invReturnSet();
  return true;
}
/* the story moved on: the alarm said (25-quest.js's own), the invasion begun the new way */
function invReturnSet(){
  const q = questState();
  q.said.alarm = true; q.stage = 'end'; q.track = 'castle';
  const v = invState();
  v.stage = 'arrive'; v.v433 = true; v.won = v.won || {}; v.said = v.said || {};
  saveProfile();
}
/* a save from before 4.33 with the fourth ancestor woken and no alarm yet: word comes all the same */
function invReturnDue(){
  if(!(typeof questOn === 'function' && questOn()) || typeof warStage !== 'function') return false;
  const q = questState();
  return q.stage === 'unseal' && warStage() === 'done' && !q.said.alarm && !invState().stage;
}
/* the curtain down, and up again at the castle's gate (the jungle's render plays the arrival: invJgSceneDue) */
async function invReturnGo(why){
  if(why && invReturnDue()) invReturnSet();
  await sceneCurtain(true, 700);
  await sceneCurtainText(why ? `Word comes from the castle: aliens are dropping out of the sky inside its walls! You race back to its gate with the King…`
                             : `The fairies lead you by their hidden paths, as fast as Lucesco can run…`, 2300);
  invPlaceJungle(invArriveAt().you);
  goDeck(JG_KEY);
  setTimeout(()=>{ if(ui.screen !== JG_KEY) invCurtainUp(); }, 4000);            // (never left black)
}
/* you on the jungle at (x, y), Lucesco beside you, as the deck is next drawn */
function invPlaceJungle(at){
  const w = walkState();
  w.at = w.at || {};
  w.at[JG_KEY] = { x:at.x, y:at.y };
  if(typeof jgState === 'function') jgState().at = { x:at.x, y:at.y };
  w.face = 'u'; w.faceX = 'r';
  ui.walkFresh = false; ui.jgLion = null; ui.jgTrail = null;
  if(typeof caLion !== 'undefined') caLion.at = null;
}
async function invCurtainUp(){ if(!document.getElementById('sceneCurtain')) return; await sceneCurtainText('', 250); await sceneCurtain(false, 700); }

/* ============================================================
   A SCENE ON THE JUNGLE (as 26-invasion.js's invScene on the castle's decks): nothing to tap but its words — no steps,
   no bands, no menu, no map — and it may carry on into the castle
   ============================================================ */
async function invJgScene(fn){
  if(ui.sceneRunning || ui.unBusy) return false;
  const w = walkState();
  ui.sceneRunning = true; ui.unBusy = true; ui.invSceneKey = JG_KEY;
  document.body.classList.add('inv-scene', 'inv-lion-off');
  w.busy = true; releaseKeys();
  if(typeof jgHold === 'function') jgHold(true);
  invAfoot(true);                                                     // off his back: he is in the scene himself (an actor 'lion')
  try { return await fn(); }
  catch(e){ if(e !== INV_ABORT) console.error('invasion scene (jungle):', e); return false; }
  finally {
    ui.sceneRunning = false; ui.unBusy = false; ui.invSceneKey = null; ui.invClimax = false;
    document.body.classList.remove('inv-scene', 'inv-lion-off');
    if(typeof jgHold === 'function') jgHold(false);
    invAfoot(false);
    walkState().busy = false;
    if(ui.screen && DECKS[ui.screen]) refreshWalk();
  }
}
/* you on foot for a scene on the jungle (20-jungle.js's jgRiding), or back on his back after it */
function invAfoot(on){
  ui.jgAfoot = !!on;
  if(ui.screen !== JG_KEY) return;
  walkYouRefresh();
  if(typeof jgMountSync === 'function') jgMountSync();
}
/* you, walked along `path` on the jungle (ms a step), Lucesco `ahead` squares in front (an actor 'lion'), along `lionPath`
   if he is to go further than you */
async function invJgRun(path, ahead, ms, lionPath){
  const w = walkState(), p = w.at && w.at[JG_KEY], me = $('#walkYou'), world = $('#walkWorld');
  if(!p || !me || !world || !path || !path.length) return;
  const t = Math.max(1, Math.round(ms * SCENE_SPEED));
  me.style.transition = `transform ${t}ms linear`; world.style.transition = `transform ${t}ms linear`;
  const lp = lionPath || path;
  const lionTo = i=>{ const q = lp[Math.min(lp.length - 1, i)], el = document.getElementById('sa-lion'); if(!q || !el) return;
    const s = el._o.w, nx = q.x + 0.5 - s / 2, ny = q.y + 1 - s;
    if(Math.abs(nx - el._o.x) > 0.05) actorFace(el, nx > el._o.x);
    el.style.transition = `left ${t}ms linear, top ${t}ms linear`; el._o.x = nx; el._o.y = ny;
    el.style.left = (nx * WALK_T) + 'px'; el.style.top = (ny * WALK_T) + 'px'; el.style.zIndex = 10 + Math.floor(q.y + 1); };
  try {
    for(let i = 0; i < path.length; i++){
      if(ui.screen !== JG_KEY) throw INV_ABORT;
      const s = path[i], dx = s.x - p.x, dy = s.y - p.y;
      w.face = dx > 0 ? 'r' : dx < 0 ? 'l' : dy > 0 ? 'd' : 'u';
      if(dx) w.faceX = dx > 0 ? 'r' : 'l';
      p.x = s.x; p.y = s.y;
      lionTo(i + ahead);
      refreshWalk();
      if(typeof jgSeeThrough === 'function'){ jgSeeThrough(); jgShowBands(); jgShowFinds(); jgExplore(p.x, p.y); }
      await sceneWait(ms);
    }
  } finally {
    if(me.isConnected) me.style.transition = '';
    if(world.isConnected) world.style.transition = '';
    jgState().at = { x:p.x, y:p.y };
  }
}
/* you, walked along `path` on a castle deck (ms a step) — the camera with you */
async function invCaRun(key, path, ms, each){
  const w = walkState(), world = $('#walkWorld');
  if(!path || !path.length) return;
  if(world) world.style.transition = `transform ${Math.round(ms * SCENE_SPEED)}ms linear`;
  try {
    for(let i = 0; i < path.length; i++){
      if(ui.screen !== key) throw INV_ABORT;
      const s = path[i], was = w.at[key];
      if(was && s.x !== was.x) w.faceX = s.x > was.x ? 'r' : 'l';
      w.at[key] = { x:s.x, y:s.y };
      if(each) each(i);
      refreshWalk();
      await sceneWait(ms);
    }
  } finally { if(world && world.isConnected) world.style.transition = ''; }
}
/* an actor moved a square at a time along `path` (ms a step), its feet on each square */
function invActorStep(id, q, ms){
  const el = document.getElementById('sa-' + id);
  if(!el || !q) return;
  const s = el._o.w, nx = q.x + 0.5 - s / 2, ny = q.y + 1 - s, t = Math.round(ms * SCENE_SPEED);
  if(Math.abs(nx - el._o.x) > 0.05) actorFace(el, nx > el._o.x);
  el.style.transition = `left ${t}ms linear, top ${t}ms linear`;
  el._o.x = nx; el._o.y = ny;
  el.style.left = (nx * WALK_T) + 'px'; el.style.top = (ny * WALK_T) + 'px';
  el.style.zIndex = 10 + Math.floor(q.y + 1);
}
/* two of them locked in a fight: a blade's swipes between them, both of them lunging (on the first, the slash) */
function invDuel(aId, bId){
  const a = document.getElementById('sa-' + aId), b = document.getElementById('sa-' + bId);
  if(!a || !b) return;
  const ax = a._o.x + a._o.w / 2, ay = a._o.y + a._o.h, bx = b._o.x + b._o.w / 2, by = b._o.y + b._o.h;
  const dx = bx - ax, dy = by - ay;
  a.insertAdjacentHTML('beforeend', warSlashHtml(0, 0, { left:50 + dx / a._o.w * 50, top:52 + dy / a._o.h * 50 }));
  a.classList.add('inv-lunge'); b.classList.add('inv-lunge', 'inv-lunge-b');
}
function invUnduel(ids){ ids.forEach(id=>{ const e = document.getElementById('sa-' + id); if(!e) return; e.classList.remove('inv-lunge', 'inv-lunge-b'); const sl = e.querySelector('.war-slash'); if(sl) sl.remove(); }); }

/* ============================================================
   THE ARRIVAL: the castle's gate, the rush in, the fountain — one scene, and while it is not over, it begins again at
   the gate (the stage stays 'arrive')
   ============================================================ */
function invArriveScene(){
  if(ui.invArriving) return;
  /* not at the gate (a save left elsewhere on the jungle): put there first, and the jungle drawn round you */
  const A = invArriveAt(), p = walkState().at && walkState().at[JG_KEY];
  if(!p || p.x !== A.you.x || p.y !== A.you.y){ invPlaceJungle(A.you); goDeck(JG_KEY); return; }
  return invJgScene(()=> invArriveRun());
}
/* on one of the castle's own decks while the arrival is still due: back to the gate, and from the beginning */
async function invArriveRedirect(key){
  if(ui.invArriving || ui.sceneRunning || ui.screen !== key || !invAt('arrive')) return;
  ui.sceneRunning = true;
  try {
    await sceneCurtain(true, 500);
    invPlaceJungle(invArriveAt().you);
  } finally { ui.sceneRunning = false; }
  goDeck(JG_KEY);
  setTimeout(()=>{ if(ui.screen !== JG_KEY) invCurtainUp(); }, 4000);
}
async function invArriveRun(){
  ui.invArriving = true;
  try {
    const A = invArriveAt(), w = walkState(), world = $('#walkWorld');
    const { gx, gy } = A;
    /* you and Lucesco, the King on his horse beside you, the castle's south wall before you */
    invActor('lion', 'lucesco', A.lion.x, A.lion.y, 1.45, { flip:true });
    invActor('king', 'fairy_king_mounted_c', A.king.x, A.king.y, 2.3, { src:'assets/mon/fairy_king_mounted_c_back.png' });
    /* the fighting all along the road: the gate's two knights, and more */
    const duels = [['ka', 'chestnut_knight2', gx - 7, gy + 1, true, 'aa', 'alien_insect_physical', gx - 5, gy + 1],
                   ['kb', 'duck_knight2', gx + 11, gy + 1, false, 'ab', 'alien_magnet_electric', gx + 9, gy + 1],
                   ['kc', 'bug_knight1', gx - 3, gy + 2, true, 'ac', 'alien_crocodilian_fire', gx - 1.6, gy + 2],
                   ['kd', 'chestnut_knight2', gx + 7, gy + 2, false, 'ad', 'alien_golem_ground', gx + 5.6, gy + 2]];
    duels.forEach(([kid, ks, kx, ky, kr, aid, al, ax, ay])=>{
      invActor(kid, ks, kx, ky, 1.45, { flip:kr });
      invActor(aid, al, ax, ay, 1.5, { flip:!kr });
      const e = document.getElementById('sa-' + aid); if(e) e.classList.add('inv-band-actor');
      invDuel(aid, kid);
    });
    await invCurtainUp();
    await sceneLook({ x:gx - 6, y:gy - 6, w:16, h:10 }, { ms:900 });
    await L([`The fairies' hidden paths bring you out of the trees below the castle's south wall — and stop you dead.`,
             `Smoke is rising over the walls. All along the road the King's soldiers are fighting aliens, blade to claw.`,
             ['king', `<b>"What… what is this?"</b>`]]);
    /* one more, overhead: a cocoon, over the wall and down inside it */
    const fly = invCocoonFly(world, gx - 16, gy + 9, gx + 4, gy - 9, 1500);
    await sceneWait(400);
    await L([['lion', `<b>"Look — up there!"</b>`]]);
    await fly;
    await L([`Something like a great spiked seed-pod streaks over your heads, high over the wall — and drops inside the castle.`]);
    /* a knight from the gate, to the King */
    invActor('rep', 'chestnut_knight2', gx + 1, gy - 1, 1.45);
    { const e = document.getElementById('sa-rep'); if(e) e.style.opacity = '0'; }
    await invActorIn('rep', 250);
    await invActorTo('rep', gx + 3, gy + 1, 650);
    await L([['knight', `<b>"Your Majesty! Thank the stars! They came down out of the sky in flying cocoons — over the walls, straight INTO the castle!"</b>`],
             ['knight', `<b>"We're holding the gate, but inside… inside, it's all of them at once!"</b>`],
             ['king', `For a moment the King cannot speak.<br><br><b>"Inside? My people… my daughters!"</b>`]]);
    /* he rides in */
    invActorTo('rep', gx + 5, gy + 1, 400);
    await L([['king', `<b>"OUT OF MY WAY!"</b>`]]);
    await invActorTo('king', gx + 1.5, gy, 650);
    await Promise.all([invActorTo('king', gx + 1.5, gy - 3, 500), invActorFade('king', 500)]);
    await L([['lion', `<b>"After him!"</b>`]]);
    /* you, on his heels */
    const run = [{ x:A.you.x, y:A.you.y - 1 }, { x:A.you.x, y:A.you.y - 2 }];
    const lion = invActorTo('lion', A.you.x + 1, A.you.y - 2, 2 * 140);
    await invJgRun(run, 0, 140);
    await lion;
    /* through the gate: the grounds */
    await invRushRun();
  } finally { ui.invArriving = false; }
}
/* the grounds: in at the south gate behind the King, up through the market; the fountain */
async function invRushRun(){
  await sceneCurtain(true, 350);
  const w = walkState();
  w.at = w.at || {}; w.at[CA_KEY] = { x:31, y:59 }; w.faceX = 'r';
  ui.walkFresh = false; caLion.at = null;
  go(CA_KEY);
  await invWaitDeck(CA_KEY);
  ui.invSceneKey = CA_KEY;
  walkState().busy = true;
  const world = $('#walkWorld'), F = INV_FOUNT;
  INV_SMOKE.forEach(([x, y], i)=> invSmokeEl(world, x, y, i));
  invCocoonEls(world);
  /* the fighting by the fountain: the Commander against an alien commander and its captain; two knights on every alien */
  invActor('cmd', 'chestnut_knight2_c', F.cmd.x, F.cmd.y, 1.6);
  F.foes.forEach(([al, ax, ay], i)=>{ invActor('cf' + i, al, ax, ay, al === JG_COMMANDER ? 1.9 : 1.7, { flip:true }); const e = document.getElementById('sa-cf' + i); if(e) e.classList.add('inv-band-actor'); invDuel('cf' + i, 'cmd'); });
  F.pins.forEach(([al, ax, ay, k1, k2], i)=>{
    invActor('pa' + i, al, ax, ay, 1.5); invActor('pk' + i + 'a', k1, ax - 2, ay, 1.45, { flip:true }); invActor('pk' + i + 'b', k2, ax + 2, ay, 1.45);
    const e = document.getElementById('sa-pa' + i); if(e) e.classList.add('inv-band-actor');
    invDuel('pa' + i, 'pk' + i + 'a'); invDuel('pk' + i + 'b', 'pa' + i);
  });
  /* the King on his horse, ahead of you up the street; Lucesco at your side */
  invActor('king', 'fairy_king_mounted_c', 31, 56, 2.3, { src:'assets/mon/fairy_king_mounted_c_back.png' });
  invActor('lion', 'lucesco', 32, 59, 1.45, { flip:true });
  await sceneCurtain(false, 450);
  /* up the street and round the fountain, to the path before the palace: he rides, you run */
  const path = invPathTo(CA_KEY, { x:31, y:56 }, F.king);
  const ms = 125;
  const runs = path.length;
  const kingAt = i=> path[Math.min(runs - 1, i)];
  const yours = [{ x:31, y:58 }, { x:31, y:57 }].concat(path.slice(0, Math.max(0, runs - 2)));
  await invCaRun(CA_KEY, yours, ms, i=>{
    invActorStep('king', kingAt(i + 1), ms);
    invActorStep('lion', yours[Math.max(0, i - 1)], ms);
    const k0 = kingAt(i), k1 = kingAt(i + 1), kel = document.getElementById('sa-king'), img = kel && kel.querySelector('img');
    if(img && k0 && k1 && k1.y !== k0.y) img.src = `assets/mon/fairy_king_mounted_c_${k1.y < k0.y ? 'back' : 'front'}.png`;   // his back to you going north
  });
  { const kel = document.getElementById('sa-king'); if(kel) kel.querySelector('img').src = 'assets/mon/fairy_king_mounted_c_back.png'; }
  /* the fountain: what he sees — the townsfolk running for their doors as you look */
  invCitizensFlee();
  await sceneLook({ x:20, y:27, w:24, h:22 }, { ms:900 });
  await L([`Inside the walls, the market is a battlefield. Townsfolk run screaming for their doors; split cocoons lie smoking on the cobbles.`,
           `Everywhere you look, two knights hold one alien between them, blade and shield.`,
           ['commander', `By the fountain the Royal Commander stands alone against an alien commander and its captain at once, his blade flashing from one to the other.<br><br><b>"YOUR MAJESTY! Stay back — they're everywhere!"</b>`]]);
  await sceneLook({ x:20, y:27, w:14, h:10 }, { ms:700 });
  await L([['commander', `<b>"They dropped out of the sky — cocoons, dozens of them, right on top of us!"</b>`],
           ['commander', `<b>"The princess… she's still in the palace! The Dauphin and the Advisor are with her — but they're cut off in there!"</b>`]]);
  await sceneLook({ x:27, y:25, w:9, h:9 }, { ms:700 });
  await L([['king', `The King turns his horse toward the palace — and sways in the saddle, his light flickering like a candle in the wind.<br><br><b>"Then I will… I will…"</b>`],
           ['king', `He looks round at his people running past him, at his knights holding the line.<br><br><b>"…No. Look at them. My people are running for their lives. I cannot leave them — not one of them."</b>`],
           ['king', `<b>"I must trust my daughters… the Dauphin, and her little sister. And you, my friends."</b>`],
           ['king', `<b>"Please. Go into the palace, and bring my little one out to me."</b>`],
           ['lion', `<b>"We'll bring her back to you. Come on!"</b>`],
           `The King slides down from his saddle and plants himself on the path before his palace, between his people and the fighting.`]);
  /* the story on: the palace (the things drawn now stand where the scene's did) */
  const v = invState();
  v.said.arrived = true;
  invSet('palace');
  ['king', 'lion', 'cmd', 'cf0', 'cf1', 'rep'].concat(F.pins.map((p, i)=> ['pa' + i, 'pk' + i + 'a', 'pk' + i + 'b']).flat()).forEach(id=> sceneActorGone(id));
  document.querySelectorAll('.scene-actor[id^="sa-cz"]').forEach(e=> e.remove());
  await sceneCamFree(500);
  ui.sceneRunning = false;
  document.body.classList.remove('inv-lion-off');
  go(CA_KEY);
}
/* the townsfolk running for their doors (the tavern's, the record store's, the houses') */
function invCitizensFlee(){
  const folk = (typeof CA_CITIZENS !== 'undefined' ? CA_CITIZENS : []).filter(id=> SPECIES[id] && SPECIES[id].tier === 'wild' && !/_knight$/.test(id));
  if(!folk.length) return Promise.resolve();
  const runs = [[28, 44, 17, 32], [35, 44, 45, 32], [20, 40, 13, 34], [42, 40, 51, 36], [30, 47, 22, 52], [33, 47, 41, 52], [26, 37, 15, 41]];
  ui.invTownsfolk = runs.length;                                        // (how many ran: the test looks)
  return Promise.all(runs.map(([x0, y0, x1, y1], i)=>{
    const id = 'cz' + i;
    invActor(id, folk[i % folk.length], x0, y0, 1.3, { flip:x1 > x0 });
    const e = document.getElementById('sa-' + id); if(e) e.classList.add('inv-fleeing-run');
    return sceneWait(i * 220).then(()=> invActorTo(id, x1, y1, 2600 + (i % 3) * 400)).then(()=> invActorFade(id, 400));
  }));
}

/* ============================================================
   THE PALACE: the Dauphin and the Advisor send you on; the sisters; out with her
   ============================================================ */
function invPalaceIntro(){
  return invScene(async ()=>{
    await sceneLook({ x:12, y:4, w:16, h:9 }, { ms:900 });
    await L([`The great hall is a storm of light and noise. Aliens pour in through the broken windows, and the King's knights meet them blade to claw.`,
             ['dauphin', `Across the hall the Dauphin holds off an alien commander, blade against tentacles.<br><br><b>"You! You came — is Father all right?"</b>`],
             ['you', `<b>"He's outside, by the fountain. He sent us for your sister."</b>`],
             ['dauphin', `<b>"She's up in her room — they've cut us off from the stair! Go — I've got this one!"</b>`],
             ['advisor', `The Advisor beats a storm of feathers into the face of its captain.<br><br><b>"Hoo! Through the east door, then all the way up the corridor to the stair! Mind the ones in the corridor!"</b>`],
             ['lion', `<b>"Leave them to us!"</b>`]]);
    invSay('hall2');
    await sceneCamFree(600);
  });
}
/* down from the tower with her, into the hall: the Dauphin and the Advisor win their fights; the sisters; they come with you */
function invSisters(){
  return invScene(async ()=>{
    const you = caYou() || { x:27, y:16 };
    const pe = document.getElementById('invPrin'), pat = pe && pe._at ? pe._at : { x:you.x + 1, y:you.y };
    if(pe) pe.remove();
    invActor('prin', 'fairy_princess', pat.x, pat.y, 1.25);
    invActor('dau', 'fairy_dauphin2', 17, 9, 1.55); invActor('ac', JG_COMMANDER, 14, 9, 1.9, { flip:true });
    invActor('adv', 'fairybird1_c', 22, 9, 1.35, { flip:true }); invActor('ap', JG_CAPTAIN, 25, 9, 1.7);
    ['ac', 'ap'].forEach(id=>{ const e = document.getElementById('sa-' + id); if(e) e.classList.add('inv-band-actor'); });
    invDuel('ac', 'dau'); invDuel('ap', 'adv');
    await sceneLook({ x:12, y:5, w:Math.max(16, Math.min(22, Math.max(you.x, pat.x) + 3 - 12)), h:Math.max(9, you.y - 3) }, { ms:900 });   // (you and her in it too)
    await L([`Across the hall the Dauphin's blade flashes — once, twice — and the alien commander reels back. The Advisor's wings beat its captain clean off its feet.`]);
    invUnduel(['ac', 'ap', 'dau', 'adv']);
    sceneShake(400, ms=> 0.06 * (1 - ms / 400));
    await Promise.all([invHopTo('ac', 13, 2, 1.6, 650).then(()=> invActorFade('ac', 300)), invHopTo('ap', 26, 2, 1.6, 650).then(()=> invActorFade('ap', 300))]);
    await L([['dauphin', `<b>"Ha! And STAY out!"</b>`],
             ['princess', `<b>"…Sister?"</b>`]]);
    /* the two of them over to her, the camera with them (she is behind you, by the east door) */
    await Promise.all([invActorTo('dau', pat.x - 1, pat.y - 1, 1100), invActorTo('adv', pat.x + 1, pat.y - 1, 1100),
                       sceneLook({ x:Math.min(26, pat.x - 7), y:Math.max(5, pat.y - 6), w:14, h:9 }, { ms:1000 })]);
    { const a = document.getElementById('sa-dau'), b = document.getElementById('sa-adv'); if(a) actorFace(a, true); if(b) actorFace(b, false); }
    await L([['dauphin', `<b>"Little sister!"</b> She sweeps the princess off her feet.<br><br><b>"You're safe — you're safe. Did they hurt you?"</b>`],
             ['princess', `<b>"They were outside my door. Lucesco and…and these two came. They fought all of them."</b>`],
             ['advisor', `<b>"Hoo! Hoo! Not a scratch on her! His Majesty will be so— where IS His Majesty?"</b>`],
             ['you', `<b>"Outside, by the fountain. He's waiting for her."</b>`],
             ['dauphin', `<b>"Then we all go. Nothing touches either of you now — not while I'm here."</b>`]]);
    invSay('sisters');
    ['prin', 'dau', 'adv'].forEach(id=> sceneActorGone(id));
    await sceneCamFree(500);
    ui.sceneRunning = false;
    go('r6_palace');                                                    // the three of them at your heels
  });
}

/* ============================================================
   OUT OF THE PALACE WITH HER: the tribes' horns (asked: "As you come out with her")
   ============================================================ */
function invTribesV433(){
  return invScene(async ()=>{
    await L([['princess', `She stops on the palace steps, holding tight to Lucesco's mane.<br><br><b>"Listen… what's that?"</b>`]]);
    const ids = await invTribesMarch();
    /* after them: the tribes drive the aliens out of the castle; the Commander and his knights to the walls */
    await L([['a_fire', `<b>"AFTER THEM! Not one of them sets foot in our jungle again!"</b>`]]);
    const out = sceneGlide(ids, 0, 16, 1800);
    await sceneWait(900);
    ids.forEach(id=> invActorFade(id, 800));
    await out;
    await L([['commander', `<b>"KNIGHTS! To the walls — make sure not one of them is left inside!"</b>`]]);
    document.querySelectorAll('.walk-ent.inv-clash-knight, .walk-ent.inv-commander-fight').forEach(el=> el.classList.add('inv-gone'));
    await sceneWait(900);
    invSay('walls');
    if(typeof questRefreshThings === 'function') questRefreshThings();
    await L([`The tribes pour out through the gate after the fleeing aliens, and the Commander's knights run for the walls. The market falls quiet — all but the crackle of the fires.`]);
    await sceneCamFree(800);
    await L([['dauphin', `<b>"Father's by the fountain — look, there he is! Come on!"</b>`]]);
    if(typeof questRefreshThings === 'function') questRefreshThings();
  });
}

/* ============================================================
   THE STRIKE: by the fountain, with her in her father's arms — Wadjet
   ============================================================ */
function invStrike(){ return invScene(()=> invStrikeRun()); }
async function invStrikeRun(){
  const v = invState(), F = INV_FOUNT;
  v.nem = true; saveProfile();
  ui.invClimax = true;
  if(typeof questRefreshThings === 'function') questRefreshThings();
  const you = caYou() || F.you;
  /* who is where: the three at your heels, the King on the path */
  const at = id=>{ const e = document.getElementById(id); return e && e._at ? e._at : null; };
  const pp = at('invPrin') || { x:you.x + 1, y:you.y }, dp = at('invDau') || { x:you.x - 1, y:you.y - 1 }, ap = at('invAdv') || { x:you.x + 1, y:you.y - 1 };
  ['invPrin', 'invDau', 'invAdv'].forEach(id=>{ const e = document.getElementById(id); if(e) e.remove(); });
  invActor('prin', 'fairy_princess', pp.x, pp.y, 1.25);
  invActor('dau', 'fairy_dauphin2', dp.x, dp.y, 1.55);
  invActor('adv', 'fairybird1_c', ap.x, ap.y, 1.35);
  invActor('king', 'fairy_king_c', F.king.x, F.king.y, 1.75, { src:'assets/mon/fairy_king_c_back.png' });
  const ke = document.getElementById('sa-king');
  await sceneLook({ x:26, y:24, w:12, h:12 }, { ms:800 });
  /* she runs to him */
  await L([['princess', `<b>"FATHER!"</b>`]]);
  if(ke) ke.querySelector('img').src = 'assets/mon/fairy_king_c_front.png';
  await invActorTo('prin', F.prin.x, F.prin.y, 700);
  await Promise.all([invActorTo('dau', F.dau.x, F.dau.y, 700), invActorTo('adv', F.adv.x, F.adv.y, 700)]);
  { const a = document.getElementById('sa-adv'), d = document.getElementById('sa-dau'); if(a) actorFace(a, true); if(d) actorFace(d, false); }
  await L([['king', `The King drops to his knees and catches her up in his arms.<br><br><b>"My little one… you're safe. You're safe."</b>`],
           ['princess', `<b>"They were everywhere, Father, and my sister came, and Lucesco, and—"</b>`],
           ['king', `<b>"Shh. I know. I know."</b> Over her head he looks up at you, and at the Dauphin.<br><br><b>"Thank you. All of you. I—"</b>`]]);
  /* the hum; the air on the fountain's rim ripples — Wadjet */
  await sceneWait(300);
  await L([`A high, thin hum. Every shadow in the square leans the wrong way.`]);
  invShockwave(F.wadjet.x + 0.5, F.wadjet.y + 0.3, 'violet');
  invActor('wadjet', WADJET, F.wadjet.x, F.wadjet.y, 2.4);
  { const we = document.getElementById('sa-wadjet'); if(we){ we.style.opacity = '0'; } }
  await invActorIn('wadjet', 500);
  invPrismOn('wadjet', true);
  await sceneLook({ x:26, y:24, w:12, h:14 }, { ms:500 });
  await L([`At the fountain's rim, right behind the King, the air ripples like water — and a great dark cobra uncoils out of nothing. In its hood, a light of every colour at once.`,
           ['princess', `<b>"Father—!"</b>`]]);
  /* the laser: through the King's back */
  try { playSfx('core_blast'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  invPrismBeam(F.wadjet.x + 0.35, F.wadjet.y - 0.9, F.king.x + 0.5, F.king.y + 0.15, 1100);
  sceneShake(800, ms=> 0.1 * (1 - ms / 800));
  invPrismFlash(900);
  await sceneWait(500);
  invPrismOn('wadjet', false);
  if(ke){ sceneActor('king', { faint:1 }); ke.classList.add('inv-hurt'); }
  await invHopTo('prin', F.prin.x + 0.6, F.prin.y - 0.6, 0.4, 350);
  await L([`The light strikes the King full in the back. He falls without a sound.`,
           ['princess', `<b>"FATHER!"</b>`],
           ['wadjet', `<b>"Hsss… One beam. That was all it took."</b>`],
           ['wadjet', `<b>"The great Fairy King, of the Cosmic Council. One word from him, and every sword in this kingdom would march against Nemesis. Now there will be no word. And this next light makes sure of it."</b>`]]);
  invPrismOn('wadjet', true);
  /* his shadows, at the Dauphin and the Advisor: blade and wing, and the blows going through */
  invActor('sh1', WADJET, F.adv.x - 2.6, F.adv.y + 0.2, 2.0, { flip:true });
  invActor('sh2', WADJET, F.dau.x + 2.4, F.dau.y + 0.2, 2.0);
  ['sh1', 'sh2'].forEach(id=>{ const e = document.getElementById('sa-' + id); if(e){ e.classList.add('inv-shade'); e.style.opacity = '0'; } });
  await Promise.all([invActorIn('sh1', 400), invActorIn('sh2', 400)]);
  invDuel('sh1', 'adv'); invDuel('sh2', 'dau');
  await L([`Two shadows peel away from the cobra and fly at the Dauphin and the Advisor.`,
           ['dauphin', `<b>"Get away from him!"</b> The Dauphin's blade sweeps through a shadow of the cobra — and passes clean through it.`],
           ['advisor', `<b>"Hoo! Shadows! Our blows go straight through them!"</b>`],
           ['lion', `<b>"Wadjet! Nemesis's cobra!"</b>`],
           ['wadjet', `<b>"Hsss… Late, lion. Much too late."</b>`]]);
  /* she kneels by him */
  await invActorTo('prin', F.king.x + 0.9, F.king.y - 0.4, 400);
  await L([['princess', `<b>"Father! Father, please, wake up!"</b>`],
           ['king', `The King's eyes flicker open.<br><br><b>"…Run… little one… hide…"</b>`],
           ['wadjet', `<b>"Yes, little one. Run along and hide. You're so very good at it."</b>`],
           ['princess', `<b>"No. I've hidden my whole life. I hid when the aliens came. I hid while everyone else fought for me. I'm not hiding any more!"</b>`],
           `A light begins to shine from the little princess — brighter, and brighter…`]);
  /* her courage: she evolves */
  { const pe2 = document.getElementById('sa-prin'); if(pe2){ const o = pe2._o; sceneGlow('prinGlow', o.x + o.w / 2, o.y + o.h * 0.6, 3); } }
  await sceneWait(600);
  await new Promise(done=> playEvolutions([{ species:'fairy_princess', name:'The Little Princess', stageFrom:0, stageTo:1, newMoves:[], from:99, to:INV.princessLv,
    headline:`<b>The Little Princess</b> found her courage!`, note:`Lv ${INV.princessLv}` }], done));
  v.grown = true; saveProfile();
  await sceneGlowOut(['prinGlow'], 300);
  sceneActor('prin', { src:invSrc('fairy_princess1') });
  { const pe2 = document.getElementById('sa-prin'); if(pe2){ const s = 1.65, o = pe2._o; sceneActor('prin', { x:o.x + (o.w - s) / 2, y:o.y + (o.h - s), w:s, h:s }); pe2.classList.add('inv-princess-glow'); } }
  /* her pink light: the shadows burn away, the light in his hood gutters out, her father holds on */
  const burst = invGlitterBurst('sa-prin');
  await sceneWait(450);
  ['sh1', 'sh2'].forEach(id=>{ const e = document.getElementById('sa-' + id); if(e){ e.classList.remove('inv-lunge', 'inv-lunge-b'); e.classList.add('inv-dispel'); const sl = e.querySelector('.war-slash'); if(sl) sl.remove(); } });
  invUnduel(['adv', 'dau']);
  invPrismOn('wadjet', false);
  if(ke) ke.classList.add('inv-holding');
  await burst;
  ['sh1', 'sh2'].forEach(id=> sceneActorGone(id));
  await L([`A wave of pink light rolls out from her, across the whole square. Where it touches the shadows, they burn away like mist in the sun — and the light in Wadjet's hood gutters out.`,
           ['wadjet', `<b>"Hsss! My light—!"</b>`],
           `The pink light settles over the King like a blanket. He draws a long breath — and holds on.`,
           ['king', `<b>"…My daughter…"</b>`],
           ['princess', `She doesn't let go of his hand.<br><br><b>"I've got you, Father. I'm not leaving you."</b>`]]);
  /* the Dauphin and the Advisor to the King's side */
  await Promise.all([invActorTo('adv', F.king.x - 1.4, F.king.y - 0.4, 500), invActorTo('dau', F.king.x + 2.2, F.king.y + 0.6, 500)]);
  { const a = document.getElementById('sa-adv'), d = document.getElementById('sa-dau'); if(a) actorFace(a, true); if(d) actorFace(d, false); }
  await L([['dauphin', `<b>"Little sister…?! — Guard Father! Nothing gets past us now!"</b>`],
           ['wadjet', `<b>"A late bloomer. How touching. No matter: the light always comes back… and I have all the time in the world."</b>`]]);
  /* he turns on you */
  await invHopTo('wadjet', F.wadjet.x, F.wadjet.y, 1.1, 650);           // he rears up
  await L([['wadjet', `He rises over the King's head, his eyes on you.<br><br><b>"But first — you, little trainer. You and your lion have been a thorn in Nemesis's side from the very start. Let's see how long you last against a serpent who can turn back time."</b>`],
           ['lion', `<b>"Here he comes — stand your ground!"</b>`]]);
  invSet('wadjet');
  ui.sceneRunning = false;
  invWadjetBattle();
}
/* his laser, seen: a beam of every colour at once, from (x0, y0) to (x1, y1) in squares */
function invPrismBeam(x0, y0, x1, y1, ms){
  const world = $('#walkWorld');
  if(!world) return;
  invReturnCss();
  const T = WALK_T, dx = (x1 - x0) * T, dy = (y1 - y0) * T, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
  const el = document.createElement('div');
  el.className = 'inv-pbeam';
  el.style.cssText = `left:${x0 * T}px;top:${y0 * T}px;width:${len}px;height:${0.5 * T}px;margin-top:${-0.25 * T}px;transform:rotate(${ang}rad);animation-duration:${ms * SCENE_SPEED}ms;`;
  world.appendChild(el);
  setTimeout(()=> el.remove(), ms * SCENE_SPEED + 60);
}

/* ============================================================
   HE SLIPS AWAY: Lucesco's nose — out of the castle, through the jungle to its north edge
   ============================================================ */
function invAfterGrounds(){
  return invScene(async ()=>{
    const F = INV_FOUNT;
    ui.invClimax = true;
    if(typeof questRefreshThings === 'function') questRefreshThings();
    invActor('king', 'fairy_king_c', F.king.x, F.king.y, 1.75, { faint:1 });
    const ke = document.getElementById('sa-king'); if(ke) ke.classList.add('inv-hurt', 'inv-holding');
    invActor('prin', 'fairy_princess1', F.prin.x, F.prin.y, 1.65);
    { const pe = document.getElementById('sa-prin'); if(pe) pe.classList.add('inv-princess-glow'); }
    invActor('adv', 'fairybird1_c', F.adv.x, F.adv.y, 1.35, { flip:true });
    invActor('dau', 'fairy_dauphin2', F.dau.x, F.dau.y, 1.55);
    await sceneLook({ x:26, y:24, w:12, h:13 }, { ms:900 });
    await L([`Where Wadjet was, there is nothing: only a cold, coiling smell, and the faint tick of something running backwards.`,
             ['dauphin', `<b>"He's gone! Where did he go?"</b>`],
             ['lion', `Lucesco lifts his nose and breathes in, long and slow.<br><br><b>"Not far. He can turn back time, but he can't wash off his smell… He's out of the castle. North — through the jungle, all the way to its northern edge!"</b>`],
             ['princess', `<b>"Go after him! I'll stay with Father. I won't let go of him — not for a second."</b>`]]);
    invActor('cmd', 'chestnut_knight2_c', 38, 33, 1.6);
    await invActorTo('cmd', 35, 30, 600);
    await L([['commander', `<b>"Your Majesty—!"</b> The Commander stops dead, and takes in the King, the princess, the light.`],
             ['commander', `<b>"…Go. Go after that thing. I'll gather every soldier who can still stand, and follow you."</b>`],
             ['advisor', `<b>"Hoo! We'll get His Majesty inside, out of the cold. Go, go!"</b>`],
             ['lion', `<b>"Follow my nose — come on!"</b>`]]);
    invSay('fled');
    return invChaseGoRun();
  });
}
/* the curtain: out of the gate and north, to the jungle's edge (the jungle's render runs the chase: invJgSceneDue) */
async function invChaseGoRun(){
  const q = questState(); q.track = 'rift'; saveProfile();
  await sceneCurtain(true, 700);
  await sceneCurtainText(`Lucesco follows the scent out through the south gate and north through the jungle — on and on, to its very edge…`, 2400);
  ['king', 'prin', 'adv', 'dau', 'cmd'].forEach(id=> sceneActorGone(id));
  invPlaceJungle(invChaseStart());
  ui.invChaseNow = true;
  ui.sceneRunning = false;
  goDeck(JG_KEY);
  setTimeout(()=>{ if(ui.screen !== JG_KEY) invCurtainUp(); }, 4000);
}
/* where the chase picks up: twelve squares' walk south of the rift's glade */
let _invChaseStart = null;
function invChaseStart(){
  if(_invChaseStart) return _invChaseStart;
  const N = invNorth(), st = N.stand, W = JG.W;
  const seen = new Map([[st.y * W + st.x, 0]]), q = [st];
  let best = st;
  for(let h = 0; h < q.length; h++){
    const c = q[h], d = seen.get(c.y * W + c.x);
    if(d >= 12 && c.y > best.y){ best = c; if(d >= 14) break; }
    for(const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]){
      const x = c.x + dx, y = c.y + dy, i = y * W + x;
      if(seen.has(i) || jgSolidAt(x, y)) continue;
      seen.set(i, d + 1); q.push({ x, y });
    }
  }
  return (_invChaseStart = { x:best.x, y:best.y });
}

/* ============================================================
   THE RIFT AT THE JUNGLE'S NORTH EDGE
   ============================================================ */
async function invRiftChaseJungleRun(){
  const N = invNorth(), st = N.stand, w = walkState(), world = $('#walkWorld');
  const p = w.at[JG_KEY];
  const path = (p && unPath(p, st)) || [];
  const lead = path[Math.min(path.length - 1, 2)] || st;
  invActor('lion', 'lucesco', lead.x, lead.y, 1.45);
  invActor('wadjet', WADJET, N.x, 3, 2.0, { z:40 });                  // at the very edge, waiting for no one (in front of what opens behind him)
  await invCurtainUp();
  if(path.length > 3) await L([['lion', `He drops his nose to the ground. <b>"…There. Cold scales, and something burnt. Not far now!"</b>`]]);
  await invJgRun(path.slice(0, Math.max(0, path.length - 1)), 3, 150, path);   // (he ends a square ahead of you)
  /* the edge: the trees end in a grey mist; he is there */
  await sceneLook({ x:N.x - 5, y:0, w:11, h:9 }, { ms:700 });
  const rift = invRiftEl(world, N.rift.x, N.rift.y + 0.6, 2.8, 'invRiftJg', '');
  if(rift){ rift.style.transform = 'scale(.05)'; rift.style.opacity = '0'; }
  await L([`There he is — coiled at the very edge of the jungle, where the trees end and a wall of grey mist begins.`]);
  try { playSfx('timestop'); } catch(e){}
  if(rift){ void rift.offsetWidth; rift.style.transform = ''; rift.style.opacity = ''; }
  sceneShake(700, ms=> 0.06 * (1 - ms / 700));
  await sceneWait(1000);
  await L([`The mist splits with a sound like tearing silk. A crack of purple light opens in the mist ahead of him — and it is getting wider.`,
           ['wadjet', `<b>"Hsss… The lion's nose. I should have guessed."</b>`],
           ['wadjet', `<b>"Follow me if you like, lion. Where I'm going, your trail goes cold a thousand years before you were born."</b>`]]);
  /* in he goes */
  await invHopTo('wadjet', N.rift.x - 0.5, N.rift.y, 0.8, 600);
  const we = document.getElementById('sa-wadjet');
  if(we){ we.style.transition = `transform ${600 * SCENE_SPEED}ms ease-in, opacity ${600 * SCENE_SPEED}ms ease-in`; void we.offsetWidth; we.style.transform = 'scale(.15)'; we.style.opacity = '0'; }
  await sceneWait(650);
  sceneActorGone('wadjet');
  /* Lucesco after him — and out of it, the other way, an army */
  await L([['lion', `<b>"Oh no you don't — RAAH!"</b>`]]);
  const you = w.at[JG_KEY];
  const jump = invHopTo('lion', N.x, 3, 1.4, 520);
  await sceneWait(380);
  if(rift) rift.classList.add('inv-rift-flare');
  try { playSfx('ambush'); } catch(e){}
  await jump;
  const back = invHopTo('lion', you.x + 1, you.y, 1.1, 520);
  sceneShake(500, ms=> 0.08 * (1 - ms / 500));
  const out = [['ra0', JG_COMMANDER, 2.0, N.x, 3], ['ra1', JG_CAPTAIN, 1.7, N.x - 2, 3], ['ra2', JG_CAPTAIN, 1.7, N.x + 2, 3],
               ['ra3', JG_ALIEN_IDS[2], 1.45, N.x - 3, 4], ['ra4', JG_ALIEN_IDS[5], 1.45, N.x + 3, 4]];
  const pours = out.map(([id, sp, size, x, y], i)=>{
    invActor(id, sp, N.rift.x - 0.5, N.rift.y, size);
    const el = document.getElementById('sa-' + id); if(el){ el.style.opacity = '0'; el.classList.add('inv-band-actor'); }
    return sceneWait(i * 160).then(()=> Promise.all([invActorIn(id, 300), invHopTo(id, x, y, 0.9, 560)]));
  });
  await Promise.all([back].concat(pours));
  if(rift) rift.classList.remove('inv-rift-flare');
  await L([`The rift flares — and something comes out of it the other way. Aliens: captains, soldiers, and at their head a hulking commander!`,
           ['lion', `<b>"Grr! They're coming THROUGH it! Get ready!"</b>`]]);
  invSay('riftOut');
  out.forEach(([id])=> sceneActorGone(id));
  sceneActorGone('lion');
  ui.sceneRunning = false;
  jgShowBands();
  jgFight(invRiftBandJg(), false);
}
/* the army out of the rift beaten: more behind them — and the castle's soldiers up behind you */
async function invRiftHoldJungleRun(){
  const N = invNorth(), w = walkState(), you = w.at[JG_KEY] || N.stand, world = $('#walkWorld');
  const rift = document.getElementById('invRiftJg') || invRiftEl(world, N.rift.x, N.rift.y + 0.6, 2.8, 'invRiftJg', '');
  invActor('lion', 'lucesco', you.x + 1, you.y, 1.45);
  await sceneLook({ x:N.x - 6, y:0, w:13, h:Math.max(9, you.y + 4) }, { ms:700 });
  await L([`The commander's army breaks and scatters — but the rift flares again, brighter than before.`]);
  if(rift) rift.classList.add('inv-rift-flare');
  try { playSfx('ambush'); } catch(e){}
  const al = [['rb0', JG_CAPTAIN, 1.7, N.x - 3, 2], ['rb1', JG_CAPTAIN, 1.7, N.x + 3, 2], ['rb2', JG_ALIEN_IDS[1], 1.45, N.x - 1, 3],
              ['rb3', JG_ALIEN_IDS[4], 1.45, N.x + 1, 3], ['rb4', JG_ALIEN_IDS[7], 1.45, N.x - 4, 4], ['rb5', JG_ALIEN_IDS[9], 1.45, N.x + 4, 4]];
  await Promise.all(al.map(([id, sp, size, x, y], i)=>{
    invActor(id, sp, N.rift.x - 0.5, N.rift.y, size);
    const el = document.getElementById('sa-' + id); if(el){ el.style.opacity = '0'; el.classList.add('inv-band-actor'); }
    return sceneWait(i * 140).then(()=> Promise.all([invActorIn(id, 280), invHopTo(id, x, y, 0.9, 520)]));
  }));
  if(rift) rift.classList.remove('inv-rift-flare');
  await L([`More of them come pouring out — captains, soldiers, more and more, spreading out along the edge of the trees to cut you off.`,
           ['lion', `<b>"There are too many of them! We can't fight them all — we have to get out of here before they surround us!"</b>`]]);
  /* a trumpet: the castle's own */
  const kn = [['cm', 'chestnut_knight2_c', 1.6, you.x, you.y + 5], ['k1', 'chestnut_knight2', 1.45, you.x - 2, you.y + 6], ['k2', 'bug_knight1', 1.45, you.x + 2, you.y + 6],
              ['k3', 'duck_knight2', 1.45, you.x - 1, you.y + 7], ['k4', 'chestnut_knight2', 1.45, you.x + 1, you.y + 7]];
  kn.forEach(([id, sp, size, x, y])=>{ invActor(id, sp, x, y, size); const el = document.getElementById('sa-' + id); if(el) el.style.opacity = '0'; });
  await L([`Then a trumpet sounds behind you — the castle's own.`]);
  await Promise.all(kn.map(([id])=> invActorIn(id, 400)).concat([sceneGlide(kn.map(k=> k[0]), 0, -3, 1000)]));
  await L([['commander', `<b>"FOR THE KING! Shields up — drive them back into that hole!"</b>`]]);
  const charge = sceneGlide(['k1', 'k2', 'k3', 'k4'], 0, -5, 900);
  await sceneWait(500);
  sceneShake(700, ms=> 0.09 * (1 - ms / 700));
  try { playSfx('hit_dealt'); } catch(e){}
  await Promise.all(al.map(([id], i)=> sceneWait(i * 90).then(()=> Promise.all([invHopTo(id, N.rift.x - 0.5, N.rift.y, 0.5, 600), invActorFade(id, 600)]))).concat([charge]));
  await invActorTo('cm', you.x, you.y + 1, 600);
  await L([`The castle's soldiers crash into them shield-first. Step by step they drive the aliens back — and back into the rift they came out of.`,
           ['commander', `<b>"Ha! And STAY in there!"</b>`],
           ['commander', `<b>"So this is where they've been coming from… a hole in the world, right at the edge of the jungle. And you two sniffed it out. You have my thanks — the whole castle's."</b>`],
           ['commander', `<b>"Soldiers! A perimeter round that rift: stakes, shields, and a guard on it day and night. Nothing comes out of there without going through us!"</b>`],
           ['knight', `<b>"Yes, Commander!"</b>`],
           ['commander', `<b>"As for you two — back to His Majesty. He needs his friends around him far more than he needs me. Go on. We'll hold here."</b>`]]);
  invSay('perimSet');
  invSet('done');
  await sceneCurtain(true, 700);
  await sceneCurtainText(`Back in the great hall, the princess never once lets go of her father's hand. That evening, the King opens his eyes.`, 2600);
  ['lion', 'cm', 'k1', 'k2', 'k3', 'k4'].forEach(id=> sceneActorGone(id));
  const w2 = walkState();
  w2.at = w2.at || {}; w2.at.r6_palace = { x:19, y:12 };
  ui.walkFresh = false; caLion.at = null;
  go('r6_palace');
  await invWaitDeck('r6_palace');
  ui.invSceneKey = 'r6_palace';
  document.body.classList.remove('inv-lion-off');
  walkState().busy = true;
  await sceneCurtainText('', 300);
  await sceneCurtain(false, 700);
  await invFinaleNem();
}

/* ---------- the army out of the rift, on the jungle: a commander's, at its foot, till it is beaten ---------- */
function invRiftBandJg(){
  const b = INV_RIFT_JG;
  if(!b.aliens){
    const src = invRiftBand();
    b.aliens = src.aliens.slice(); b.lead = JG_COMMANDER; b.lv = INV.lv;
    const N = invNorth(); b.x = N.x; b.y = 3; b.hx = b.x; b.hy = b.y; b.face = 'd';
    Object.defineProperty(b, 'calm', { get(){ return Infinity; }, set(){}, enumerable:true });   // it stands its ground: you go to it
  }
  return b;
}
function invRiftBandOn(){ if(!invOn()) return false; const v = invState(); return invAt('chase') && !!v.nem && !!v.said.riftOut && !v.won[INV_RIFT_JG.id]; }

/* ---------- afterwards: the perimeter at the north edge — its soldiers and the aliens forever at it ---------- */
/* [knight, kx, ky, alien, ax, ay], from the rift's glade's middle (N.x): the aliens inside the palisade, the knights
   outside it, at each other across the stakes */
const RIFT_JG_CLASH = [['chestnut_knight2', -7, 2, 'alien_robot_steel', -4, 2], ['bug_knight1', 6, 2, 'alien_gremlin_fairy', 3, 2],
                       ['duck_knight2', -3, 5, 'alien_toxic_gas_ghost', -3, 3], ['chestnut_knight2', 2, 5, 'alien_dolphin_water', 2, 3]];
function riftPenAt(x, y){ const N = invNorth(), P = N && N.pen; return !!P && x >= P.x && x < P.x + P.w && y >= P.y && y < P.y + P.h; }
function riftJungleThings(list, P){
  const N = P.north;
  if(!N) return;
  const after = ()=> typeof invAfter === 'function' && invAfter();
  const T = o=> list.push(Object.assign({ late:true }, o));              // (laid after the finds: they stay where they were)
  T({ x:N.gate.x, y:N.gate.y, w:N.gate.w, h:1, icon:'', verb:'Enter', sub:'The rift perimeter', when:after, act:()=> invRiftEnter() });
  T({ x:N.x - 2, y:N.stand.y + 1, cls:'jg-npc', faceR:true, html:()=> jgMonImg('chestnut_knight2_c_front', WALK_T * 1.6, false),
      verb:'Talk', sub:'The Royal Commander', when:after, act:()=> invPerimCommanderTalk() });
  RIFT_JG_CLASH.forEach(([ks, kdx, ky, al, adx, ay])=>{
    const kx = N.x + kdx, ax = N.x + adx, dx = kx - ax, dy = ky - ay;
    T({ x:ax, y:ay, cls:'jg-npc war-alien inv-clash-alien', html:()=> `<div class="war-fig">${jgMonImg(al, WALK_T * 1.5, dx > 0)}</div>` + warSlashHtml(dx, dy),
        verb:'Look', sub:(SPECIES[al] || {}).name || 'An alien', when:after, act:()=> caLines([`It throws itself at the palisade again and again. The knight on the other side never gives an inch.`]) });
    T({ x:kx, y:ky, cls:'jg-npc war-knight inv-clash-knight', html:()=> `<div class="war-fig">${jgMonImg(ks + '_front', WALK_T * 1.45, dx < 0)}</div>`,
        verb:'Talk', sub:ks === 'duck_knight2' ? 'Duck Knight' : ks === 'bug_knight1' ? 'Bug Knight' : 'Chestnut Knight', when:after,
        act:()=> caLines([['knight', caTurn('invPerimSoldier', INV_LINES.perimSoldier)]]) });
  });
}
/* drawn with the jungle: the rift (from the chase on), and afterwards its palisade and the aliens penned in it */
function riftJungleDraw(world){
  invNorthMist(world);
  if(!invOn()) return;
  const N = invNorth(), v = invState();
  const shown = invAfter() || (invAt('chase') && !!v.nem && !!v.said.riftOut);
  if(!shown) return;
  invRiftEl(world, N.rift.x, N.rift.y + 0.6, 2.8, 'invRiftJg', '');
  if(!invAfter()) return;
  const P = N.pen, sq = [];
  for(let y = P.y; y < P.y + P.h - 1; y++){ sq.push([P.x, y]); sq.push([P.x + P.w - 1, y]); }
  for(let x = P.x; x < P.x + P.w; x++) if(x < N.gate.x || x >= N.gate.x + N.gate.w) sq.push([x, P.y + P.h - 1]);
  invStakes(world, sq);
  /* its gate: two posts and a bar */
  invStakes(world, [[N.gate.x, P.y + P.h - 1], [N.gate.x + 1, P.y + P.h - 1]], 'inv-stake-gate');
  const T = WALK_T;
  [['alien_insect_physical', N.x - 1.4, 1.9], ['alien_flower_grass', N.x + 1.6, 2.5], ['alien_magnet_electric', N.x - 3.2, 3.1]].forEach(([al, x, y], i)=>{
    const a = document.createElement('div');
    a.className = 'inv-penned';
    a.style.cssText = `left:${(x - 0.7) * T}px;top:${(y - 0.6) * T}px;width:${1.4 * T}px;height:${1.4 * T}px;z-index:${12 + Math.floor(y)};animation-delay:${-i * 0.4}s;`;
    a.innerHTML = jgMonImg(al, T * 1.4, i % 2 === 1);
    world.appendChild(a);
  });
}
/* the jungle's northern edge: where the trees end, a wall of grey mist (the rest of time, beyond it) */
function invNorthMist(world){
  if(!world || document.getElementById('invNorthMist')) return;
  const T = WALK_T, N = invNorth(), el = document.createElement('div');
  el.id = 'invNorthMist';
  el.className = 'inv-north-mist';
  el.style.cssText = `left:0;top:${-1.6 * T}px;width:${JG.W * T}px;height:${3.4 * T}px;--t:${T}px;`;
  /* its thickest drifts over the rift's glade */
  el.innerHTML = [-11, -5, 0, 5, 10].map((dx, i)=> `<i style="left:${(N.x + dx - 3.5) * T}px;top:${(i % 2 ? 1.5 : 1.1) * T}px;animation-delay:${-i * 2}s"></i>`).join('');
  world.appendChild(el);
}
/* in at its gate (the first time, the Commander's word on it) */
function invRiftEnter(){
  const N = invNorth(), w = walkState();
  w.at = w.at || {}; w.at[JG_KEY] = { x:N.stand.x, y:N.stand.y }; jgState().at = { x:N.stand.x, y:N.stand.y };
  const go_ = ()=>{ ui.jgLion = null; caGo('r6_perimeter', [12, 17]); };
  if(!invSaid('perimIn')){
    return caLines([['commander', `<b>"The perimeter. My soldiers keep them penned in here, round the rift. Go in whenever you like: there are always more of them."</b>`],
                    ['commander', `<b>"Every one you beat in there counts for His Majesty's challenge, and frees whoever they've taken — the tribes' people and ours."</b>`]])
      .then(()=>{ invSay('perimIn'); go_(); });
  }
  go_();
}
/* out of the compound: back on the glade before its gate */
function invRiftOut(){
  invPlaceJungle(invNorth().stand);
  walkState().face = 'd';
  goDeck(JG_KEY);
}

/* ---------- Lucesco's nose on it (25-quest.js), and the jungle's map ---------- */
function invRiftKnown(){
  if(!invOn()) return false;
  const v = invState();
  return invAfter() || (invAt('chase') && !!v.nem && !!v.said.fled);
}
function invRiftSniffOpt(){
  if(!invRiftKnown()) return null;
  return { k:'rift', sub:invAfter() ? 'The perimeter, at the north edge' : 'Wadjet’s trail, to the north edge' };
}
const RIFT_ICON = px=> `<svg viewBox="0 0 40 50" width="${px}" height="${Math.round(px * 1.25)}" aria-hidden="true"><defs><radialGradient id="riG${px}" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#0a0212"/><stop offset=".6" stop-color="#3a0e5e"/><stop offset="1" stop-color="#b65cff"/></radialGradient></defs>` +
  `<path d="M20 2 L23 9 L27 12 L24 18 L28 23 L24 28 L27 34 L23 39 L25 45 L20 48 L15 45 L17 39 L13 34 L16 28 L12 23 L16 18 L13 12 L17 9 Z" fill="url(#riG${px})" stroke="#e6b3ff" stroke-width="2" stroke-linejoin="round"/></svg>`;
function riftSniffPic(){ return `<span class="jg-go-pic q-sniff-pic q-sniff-rift">${RIFT_ICON(26)}</span>`; }
function riftMapKey(){ return invRiftKnown() ? ` · <span class="jg-map-rift">${RIFT_ICON(13)}</span> the rift` : ''; }
function riftMapDraw(ctx){
  if(!invRiftKnown()) return;
  const N = invNorth(), x = N.rift.x, y = N.rift.y + 3;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#b65cff'; ctx.strokeStyle = '#f3dcff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(3, -3); ctx.lineTo(1.5, 1); ctx.lineTo(4, 5); ctx.lineTo(0, 10); ctx.lineTo(-3, 4); ctx.lineTo(-1.5, 0); ctx.lineTo(-4, -4); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

/* ---------- Lucesco, by where the story stands ---------- */
/* in the jungle (his Just talk): the castle invaded, and you out here; after Wadjet, his trail */
function invLionJungle(){
  if(!invOn()) return null;
  const st = invStage(), v = invState(), say = html=> jgLines([riftLucescoFace()], 'Lucesco', [html]);
  const ask = (html, yes, then)=> typeof unLionAsk === 'function' ? unLionAsk(html, yes, then) : say(html);
  if(invNew() && ['palace', 'tower', 'escort', 'wadjet'].includes(st))
    return ask(`<b>"What are we doing out here? The castle is full of them — the princess! Shall I take us straight back?"</b>`, 'Back to the castle', ()=> invToCastleGate());
  if(st === 'chase' && v.nem && v.said.fled && !v.said.perimSet){
    const p = walkState().at && walkState().at[JG_KEY], N = invNorth();
    if(p && Math.abs(p.x - N.x) <= 14 && p.y <= 24) return say(`<b>"He's close — I can smell him. The edge of the jungle, right ahead!"</b>`);
    return ask(`<b>"Wadjet's trail goes north, to the very edge of the jungle. I know the way by his smell — shall I take us there?"</b>`, 'After Wadjet', ()=> invToRift());
  }
  return null;
}
/* in the castle: his trail, while you are after him */
function invLionCastle(key){
  if(!invOn()) return null;
  const st = invStage(), v = invState();
  /* (a 4.31 save after him too: his rift is at the jungle's north edge now) */
  if(st === 'chase' && v.nem && v.said.fled && !v.said.perimSet){
    if(ui.caTalk) return true;
    ui.caTalk = true;
    return r5Ask([riftLucescoFace()], 'Lucesco', `<b>"Wadjet's trail goes north, out of the castle and through the jungle to its very edge. I know the way by his smell — shall I take us there?"</b>`, 'After Wadjet', 'Not yet')
      .then(yes=>{ ui.caTalk = false; if(yes) invToRift(); else refreshWalk(); });
  }
  if(!invNew()) return null;
  if(st === 'palace') return caLines([['lion', `<b>"The princess is up in the tower. The stair is at the end of the east corridor — and the corridor is crawling with them."</b>`]]);
  if(st === 'tower') return caLines([['lion', `<b>"Her room is at the west end of the gallery upstairs. Whatever stands at her door, we go through it."</b>`]]);
  if(st === 'escort') return caLines([['lion', invSaid('tribes') ? `<b>"The King, by the fountain. Let's bring her to him."</b>` : `<b>"Stay close, little one. Nothing gets past these paws."</b>`]]);
  if(st === 'wadjet') return caLines([['lion', `<b>"He turns back time — so don't try to beat him. Outlast him! Talk to the princess first, if the team needs healing."</b>`]]);
  return null;
}
if(typeof caLionTalk === 'function'){
  const _invLionTalk = caLionTalk;
  caLionTalk = function(key){ const r = invLionCastle(key); if(r) return r; return _invLionTalk.apply(this, arguments); };
}
/* straight to the rift: the curtain, and at the trail's end (or by its army, waiting) */
async function invToRift(){
  const v = invState(), N = invNorth();
  await sceneCurtain(true, 600);
  await sceneCurtainText(`Lucesco puts his nose to the ground and runs, north, north, north…`, 1600);
  if(!v.said.riftOut){ invPlaceJungle(invChaseStart()); ui.invChaseNow = true; }
  else invPlaceJungle({ x:N.stand.x, y:N.stand.y + 1 });
  goDeck(JG_KEY);
  setTimeout(()=>{ if(ui.screen !== JG_KEY || !ui.invChaseNow) invCurtainUp(); }, ui.invChaseNow ? 4000 : 900);
}
/* back into the castle, in at its gate */
async function invToCastleGate(){
  await sceneCurtain(true, 600);
  const w = walkState(); w.at = w.at || {}; w.at[CA_KEY] = { x:31, y:59 };
  ui.walkFresh = false; caLion.at = null;
  goDeck(CA_KEY);
  setTimeout(()=> invCurtainUp(), 700);
}

/* ============================================================
   WHAT THE NEW WAY HAS WAITING (26-invasion.js's invSceneDue, for a save told this way)
   ============================================================ */
function invSceneDue433(key, st, v){
  if(st === 'arrive') return true;                                     // (invRender sends you to the gate)
  if(st === 'palace'){ if(key === 'r6_palace' && !v.said.hall2) return invPalaceIntro(); return true; }
  if(st === 'tower'){ if(key === 'r6_tower' && !v.said.towerIn) return invTowerIn(); return true; }
  if(st === 'escort'){
    if(key === 'r6_palace' && !v.said.sisters && invInHall(caYou())) return invSisters();
    if(key === CA_KEY && v.said.sisters && !v.said.tribes) return invTribesV433();
    return true;
  }
  if(st === 'wadjet') return true;
  if(st === 'chase'){
    if(!v.said.fled){ if(key === CA_KEY) return invAfterGrounds(); if(key === 'r6_palace') caGo(CA_KEY, [INV_FOUNT.you.x, INV_FOUNT.you.y]); }
    return true;
  }
  return undefined;                                                    // the finale, as the old way has it
}
/* the jungle's own: the word from the castle (a save from before 4.33), the arrival, the chase, the rift */
function invJgSceneDue(){
  if(ui.screen !== JG_KEY || ui.sceneRunning || ui.unBusy || ui.jgTalk || ui.jgFighting || ui.jgAlert || document.querySelector('.scene-say')) return;
  if(!invOn()) return;
  if(invReturnDue()) return invReturnGo('late');
  const st = invStage(), v = invState();
  if(st === 'arrive') return invArriveScene();
  if(st === 'chase' && v.nem){
    const p = walkState().at && walkState().at[JG_KEY], N = invNorth();
    const near = !!p && Math.abs(p.x - N.x) <= 14 && p.y <= 24;
    if(!v.said.riftOut && (ui.invChaseNow || (v.said.fled && near))){ ui.invChaseNow = false; return invJgScene(()=> invRiftChaseJungleRun()); }
    if(v.said.riftOut && v.won[INV_RIFT_JG.id] && !v.said.perimSet && near) return invJgScene(()=> invRiftHoldJungleRun());
  }
  if(ui.invChaseNow){ ui.invChaseNow = false; invCurtainUp(); }
}

/* ============================================================
   INTO THE JUNGLE'S OWN WORKINGS
   ============================================================ */
(function invJgHooks(){
  if(typeof jgRender !== 'function') return;
  const _render = jgRender;
  jgRender = function(world, d){
    const r = _render.apply(this, arguments);
    try {
      invCss(); invReturnCss(); if(typeof warCss === 'function') warCss();
      riftJungleDraw(world);
      setTimeout(invJgSceneDue, 650);
    } catch(err){ console.error('return render:', err); }
    return r;
  };
  /* the rift's army among the jungle's bands while it stands */
  const _bands = jgBands;
  jgBands = function(){
    const list = _bands.apply(this, arguments);
    const on = invRiftBandOn();
    if(list._riftOn !== on){
      for(let i = list.length - 1; i >= 0; i--) if(list[i].riftJg) list.splice(i, 1);
      if(on) list.push(invRiftBandJg());
      list._riftOn = on;
    }
    return list;
  };
  const _beaten = jgBandBeaten;
  jgBandBeaten = function(b){ return b && b.riftJg ? !!invState().won[b.id] : _beaten.apply(this, arguments); };
  const _won = jgWon;
  jgWon = function(b, levelUps){
    if(b && b.riftJg){ invState().won[b.id] = true; saveProfile(); }
    return _won.apply(this, arguments);
  };
  const _place = jgBandPlace;
  jgBandPlace = function(b){
    const r = _place.apply(this, arguments);
    const el = b && b.riftJg && ui.jgBandEls && ui.jgBandEls[b.id];
    if(el){ const cone = el.querySelector('.jg-cone'); if(cone) cone.style.display = 'none'; el.classList.add('inv-rift-army'); }
    return r;
  };
  /* the arrival: the battle's music by the castle's gate (as a village under attack has it, (4.29)) */
  if(typeof jgUnderAttack === 'function'){
    const _attack = jgUnderAttack;
    jgUnderAttack = function(x, y){
      if(invOn() && invAt('arrive')){ const A = invArriveAt(); if(Math.abs(x - A.you.x) <= 14 && Math.abs(y - A.you.y) <= 10) return true; }
      return _attack.apply(this, arguments);
    };
  }
  /* the palisade and what is inside it: nobody walks there */
  if(typeof JG_DECK !== 'undefined'){
    const _occ = JG_DECK.occupied;
    JG_DECK.occupied = (x, y)=> _occ(x, y) || (y <= 6 && invOn() && invAfter() && riftPenAt(x, y));
  }
})();

/* ============================================================
   THE PICTURES: the cocoons they came down in
   ============================================================ */
/* a cocoon, landed and split open (its two halves peeled back, the inside still glowing) — or, `closed`, in flight */
function invCocoonSvg(closed){
  const shell = `<radialGradient id="icShell${closed ? 'F' : ''}" cx=".38" cy=".32" r=".85"><stop offset="0" stop-color="#e6dac4"/><stop offset=".5" stop-color="#a8957b"/><stop offset="1" stop-color="#5b4c3d"/></radialGradient>`;
  const spikes = (pts)=> pts.map(([x, y, a])=> `<path d="M${x} ${y} l${(Math.cos(a) * 9).toFixed(1)} ${(Math.sin(a) * 9).toFixed(1)} l${(Math.cos(a + 2.2) * 5).toFixed(1)} ${(Math.sin(a + 2.2) * 5).toFixed(1)} Z" fill="#efe6d4" stroke="#3d3229" stroke-width="1.6" stroke-linejoin="round"/>`).join('');
  if(closed) return `<svg viewBox="0 0 120 80" class="inv-cocoon-art" aria-hidden="true"><defs>${shell}</defs>` +
    `<ellipse cx="60" cy="42" rx="50" ry="28" fill="url(#icShellF)" stroke="#3d3229" stroke-width="3"/>` +
    spikes([[24, 22, -2.4], [44, 15, -1.9], [64, 14, -1.5], [84, 17, -1.1], [101, 28, -0.6], [17, 50, 3.0], [104, 52, 0.2]]) +
    `<path d="M30 44 q14 9 30 6 q16 -3 30 -11" stroke="#c8343c" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="46" cy="32" rx="9" ry="5" fill="#ff6b5a" opacity=".85"/><ellipse cx="44" cy="31" rx="3" ry="2" fill="#fff" opacity=".8"/></svg>`;
  return `<svg viewBox="0 0 120 90" class="inv-cocoon-art" aria-hidden="true"><defs>${shell}` +
    `<radialGradient id="icIn" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#ff7a5a"/><stop offset=".5" stop-color="#7a1c22"/><stop offset="1" stop-color="#2a0c10"/></radialGradient></defs>` +
    `<ellipse cx="60" cy="80" rx="48" ry="8" fill="rgba(0,0,0,.28)"/>` +
    `<path d="M12 56 C12 80 108 80 108 56 C96 66 24 66 12 56 Z" fill="url(#icShell)" stroke="#3d3229" stroke-width="2.5"/>` +
    `<ellipse class="ic-in" cx="60" cy="56" rx="46" ry="11.5" fill="url(#icIn)" stroke="#3d3229" stroke-width="2"/>` +
    `<path d="M14 54 C4 34 24 14 46 19 C40 31 35 44 30 54 Z" fill="url(#icShell)" stroke="#3d3229" stroke-width="2.5"/>` +
    `<path d="M106 54 C116 32 96 12 74 17 C81 29 87 43 91 54 Z" fill="url(#icShell)" stroke="#3d3229" stroke-width="2.5"/>` +
    spikes([[20, 29, -2.6], [34, 19, -2.0], [100, 27, -0.5], [86, 17, -1.1]]) +
    `<path d="M24 66 q9 4 18 2 M78 68 q9 -1 17 -6" stroke="#c8343c" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<path d="M44 52 q3 9 -1 15 M76 51 q-2 8 2 13" stroke="#b9d36a" stroke-width="2" fill="none" opacity=".55"/></svg>`;
}
function invCocoonEls(world){
  world = world || $('#walkWorld');
  if(!world) return;
  invReturnCss();
  const T = WALK_T;
  INV_FOUNT.cocoons.forEach(([x, y], i)=>{
    const el = document.createElement('div');
    el.className = 'inv-cocoon';
    el.style.cssText = `left:${(x - 1.15) * T}px;top:${(y - 1.6) * T}px;width:${2.3 * T}px;height:${1.72 * T}px;z-index:${Math.round(10 + y)};`;
    el.innerHTML = invCocoonSvg(false) + `<div class="inv-cocoon-smoke" style="--sm:${T}px;animation-delay:${-i * 0.9}s"><i></i><i></i><i></i></div>`;
    world.appendChild(el);
  });
}
/* one in flight, from (x0, y0) to (x1, y1) in squares, over everything; resolves as it is gone */
function invCocoonFly(world, x0, y0, x1, y1, ms){
  world = world || $('#walkWorld');
  if(!world) return sceneWait(ms);
  invReturnCss();
  const T = WALK_T, el = document.createElement('div');
  el.className = 'inv-cocoon-fly';
  const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  el.style.cssText = `left:${x0 * T}px;top:${y0 * T}px;width:${2.7 * T}px;height:${1.8 * T}px;--ang:${ang}deg;`;
  el.innerHTML = `<i class="icf-trail"></i>` + invCocoonSvg(true);
  world.appendChild(el);
  void el.offsetWidth;
  const t = Math.max(1, ms * SCENE_SPEED);
  el.style.transition = `left ${t}ms cubic-bezier(.3,.1,.6,1), top ${t}ms cubic-bezier(.2,0,.7,1), opacity ${t * 0.25}ms ease ${t * 0.75}ms, transform ${t}ms ease-in`;
  el.style.left = (x1 * T) + 'px'; el.style.top = (y1 * T) + 'px'; el.style.opacity = '0'; el.style.transform = 'scale(.55)';
  try { playSfx('alert'); } catch(e){}
  ui.invCocoonsFlown = (ui.invCocoonsFlown || 0) + 1;                   // (the test looks)
  return sceneWait(ms).then(()=> el.remove());
}

let _invRetCss = false;
function invReturnCss(){
  if(_invRetCss || typeof document === 'undefined') return;
  _invRetCss = true;
  const s = document.createElement('style');
  s.id = 'invReturnCss';
  s.textContent = `
  /* Lucesco's own figure put away while a scene's actor stands in for him */
  body.inv-lion-off #caLion, body.inv-lion-off #jgLion{ visibility:hidden !important; }
  body.inv-scene #jgHud, body.inv-scene .q-pulse{ visibility:hidden !important; pointer-events:none !important; }
  /* the jungle's northern edge: a wall of grey mist where the trees end */
  .inv-north-mist{ position:absolute; pointer-events:none; z-index:11;
    background:linear-gradient(to bottom, rgba(222,226,232,.97) 0%, rgba(218,223,229,.94) 45%, rgba(210,215,222,.78) 62%, rgba(205,211,219,.42) 80%, rgba(200,206,214,0) 100%); }
  .inv-north-mist i{ position:absolute; width:calc(var(--t) * 7); height:calc(var(--t) * 1.6); border-radius:50%; filter:blur(6px);
    background:radial-gradient(closest-side, rgba(236,239,243,.9), rgba(236,239,243,0)); animation:invMistDrift 9s ease-in-out infinite alternate; }
  @keyframes invMistDrift{ from{ translate:calc(var(--t) * -1.5) 0; } to{ translate:calc(var(--t) * 1.5) calc(var(--t) * .2); } }
  /* the cocoons they came down in: split open, the inside still glowing, a wisp of smoke */
  .inv-cocoon{ position:absolute; pointer-events:none; }
  .inv-cocoon .inv-cocoon-art{ width:100%; height:100%; display:block; overflow:visible; filter:drop-shadow(0 3px 2px rgba(30,20,15,.35)); }
  .inv-cocoon .ic-in{ animation:invCocoonGlow 2.2s ease-in-out infinite; }
  @keyframes invCocoonGlow{ 0%,100%{ opacity:.85; } 50%{ opacity:1; filter:brightness(1.35); } }
  .inv-cocoon-smoke{ position:absolute; left:50%; top:46%; width:0; height:0; }
  .inv-cocoon-smoke i{ position:absolute; left:calc(var(--sm) * -.3); top:calc(var(--sm) * -.3); width:calc(var(--sm) * .6); height:calc(var(--sm) * .6); border-radius:50%;
    background:radial-gradient(circle at 40% 35%, rgba(150,145,150,.8), rgba(90,85,95,.55) 60%, rgba(70,66,74,0) 74%); animation:invPuff 3.6s ease-out infinite; }
  .inv-cocoon-smoke i:nth-child(2){ animation-delay:-1.2s; } .inv-cocoon-smoke i:nth-child(3){ animation-delay:-2.4s; }
  .inv-cocoon-fly{ position:absolute; pointer-events:none; z-index:90; translate:-50% -50%; }
  .inv-cocoon-fly .inv-cocoon-art{ width:100%; height:100%; display:block; rotate:var(--ang); filter:drop-shadow(0 6px 8px rgba(0,0,0,.4)); }
  .inv-cocoon-fly .icf-trail{ position:absolute; right:55%; top:42%; width:260%; height:22%; rotate:var(--ang); transform-origin:100% 50%; border-radius:999px;
    background:linear-gradient(90deg, rgba(255,140,110,0), rgba(255,170,120,.55) 70%, rgba(255,240,210,.9)); filter:blur(2px); }
  /* the knights who run for the walls, the townsfolk who run for their doors */
  .walk-ent.inv-gone{ transition:opacity .8s ease; opacity:0 !important; }
  .scene-actor.inv-fleeing-run .sa-in{ animation:invRun .32s ease-in-out infinite; }
  @keyframes invRun{ 0%,100%{ translate:0 0; } 50%{ translate:0 -7%; } }
  /* the King waiting by the fountain, faint, his eyes on the palace's doors */
  .walk-ent.inv-king-wait .ca-art{ filter:drop-shadow(0 0 7px rgba(190,140,255,.6)) grayscale(.15) brightness(.95); }
  /* his laser, seen: every colour at once, white at its heart */
  .inv-pbeam{ position:absolute; transform-origin:0 50%; pointer-events:none; z-index:72; border-radius:999px;
    background:linear-gradient(to bottom, rgba(255,90,90,0), rgba(255,90,90,.85) 14%, #ffd84d 28%, #ffffff 44%, #ffffff 56%, #5be06a 70%, #4db8ff 82%, rgba(184,108,255,.85) 92%, rgba(184,108,255,0));
    box-shadow:0 0 22px 8px rgba(255,255,255,.75), 0 0 46px 18px rgba(200,170,255,.5); animation:invBeamGo 1.1s ease-out both; }
  /* the rift's army, at its foot */
  .walk-ent.inv-rift-army img{ filter:drop-shadow(0 0 9px rgba(170,40,230,.9)); }
  .inv-stake.inv-stake-gate{ filter:brightness(1.15) saturate(.8); }
  .q-sniff-rift svg, .jg-map-rift svg{ vertical-align:middle; }
  .jg-map-rift svg{ vertical-align:-2px; }
  @media (prefers-reduced-motion: reduce){ .inv-cocoon .ic-in, .inv-cocoon-smoke i, .scene-actor.inv-fleeing-run .sa-in{ animation-duration:6s; } }
  `;
  document.head.appendChild(s);
}
