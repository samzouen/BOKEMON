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
async function invJgScene(fn, o){
  if(ui.sceneRunning || ui.unBusy) return false;
  const w = walkState();
  ui.sceneRunning = true; ui.unBusy = true; ui.invSceneKey = JG_KEY;
  document.body.classList.add('inv-scene', 'inv-lion-off');
  w.busy = true; releaseKeys();
  if(typeof jgHold === 'function') jgHold(true);
  if(!(o && o.ride)) invAfoot(true);                                  // off his back: he is in the scene himself (an actor 'lion') — (4.57) not for the gate: you ride him in
  try { return await fn(); }
  catch(e){ if(e !== INV_ABORT) console.error('invasion scene (jungle):', e); return false; }
  finally {
    ui.sceneRunning = false; ui.unBusy = false; ui.invSceneKey = null; ui.invClimax = false;
    document.body.classList.remove('inv-scene', 'inv-lion-off');
    if(typeof jgHold === 'function') jgHold(false);
    if(!ui.jgAfootHold) invAfoot(false);                              // (4.60: still on foot into Wadjet's fight, 42-the-hunt.js)
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
/* ============================================================
   (4.57) ON LUCESCO'S BACK THROUGH THE GROUNDS
   The designer, 2026-11-17: "Let the player ride on Lucesco all the way back through the castle grounds, only coming
   off inside the palace itself." From the castle's gate on, while the castle is fought for (the new way), you ride him
   on its grounds as you do in the jungle (20-jungle.js's jgRideArt): in at the gate behind the King, up through the
   market, to the palace's doors. Inside the palace and its tower you are on foot, he at your heels as ever; out of its
   doors, on his back again. (21-castle.js: caRender puts nobody beside you, caLionStep keeps him under you.)
   ============================================================ */
function caRideOn(key){
  if((key || ui.screen) === 'r6_perimeter') return typeof jgRiding === 'function' && jgRiding();   // (4.64) the rift's perimeter: on his back, as on the jungle outside it
  return (key || ui.screen) === CA_KEY && typeof invOn === 'function' && invOn() && invNew() && invAt('arrive', 'palace', 'tower', 'escort', 'wadjet', 'chase') && !ui.caAfoot;
}
(function caRideHook(){
  const d = typeof DECKS !== 'undefined' && DECKS[CA_KEY];
  if(!d || typeof jgRideArt !== 'function') return;
  const base = d.youArt;
  d.youArt = function(dd){
    if(caRideOn(CA_KEY)){ if(typeof jgCss === 'function') jgCss(); return jgRideArt(); }
    return base ? base.apply(this, arguments) : null;
  };
})();

/* you, walked along `path` on the jungle (ms a step), Lucesco `ahead` squares in front (an actor 'lion'), along `lionPath`
   if he is to go further than you */
async function invJgRun(path, ahead, ms, lionPath){
  const w = walkState(), p = w.at && w.at[JG_KEY], me = $('#walkYou'), world = $('#walkWorld');
  if(!p || !me || !world || !path || !path.length) return;
  const t = Math.max(1, Math.round(ms * SCENE_SPEED));
  me.style.transition = `transform ${t}ms linear`; world.style.transition = `transform ${t}ms linear`;
  const lp = lionPath === false ? null : (lionPath || path);          // (4.60: false — he isn't with you; leave him be)
  const lionTo = i=>{ if(!lp) return; const q = lp[Math.min(lp.length - 1, i)], el = document.getElementById('sa-lion'); if(!q || !el) return;
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
  return invJgScene(()=> invArriveRun(), { ride:true });              // (4.57) on Lucesco's back, all the way in
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
    /* you on Lucesco's back ((4.57): the designer, "Let the player ride on Lucesco all the way back through the castle
       grounds, only coming off inside the palace itself"), the King on his horse beside you, the castle's south wall
       before you */
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
    /* you, on his heels — on Lucesco's back */
    const run = [{ x:A.you.x, y:A.you.y - 1 }, { x:A.you.x, y:A.you.y - 2 }];
    await invJgRun(run, 0, 140);
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
  /* the King on his horse, ahead of you up the street; you on Lucesco's back (4.57) */
  invActor('king', 'fairy_king_mounted_c', 31, 56, 2.3, { src:'assets/mon/fairy_king_mounted_c_back.png' });
  await sceneCurtain(false, 450);
  /* up the street and round the fountain, to the path before the palace: he rides, Lucesco runs */
  const path = invPathTo(CA_KEY, { x:31, y:56 }, F.king);
  const ms = 125;
  const runs = path.length;
  const kingAt = i=> path[Math.min(runs - 1, i)];
  const yours = [{ x:31, y:58 }, { x:31, y:57 }].concat(path.slice(0, Math.max(0, runs - 2)));
  await invCaRun(CA_KEY, yours, ms, i=>{
    invActorStep('king', kingAt(i + 1), ms);
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
           /* (4.56) he does not get down: he turns on them (the King's hunt, below) */
           `The King wheels his horse round to face the market. Out there the knights' line has broken: aliens are loose among the running townsfolk — more of them than there are knights to hold them.`,
           ['king', `Violet light kindles in his hands, and his voice drops to something you have never heard from him before.<br><br><b>"Not one of my people. Not ONE."</b>`]]);
  /* the story on: the palace (the things drawn now stand where the scene's did) */
  const v = invState();
  v.said.arrived = true;
  invSet('palace');
  ['king', 'cmd', 'cf0', 'cf1', 'rep'].concat(F.pins.map((p, i)=> ['pa' + i, 'pk' + i + 'a', 'pk' + i + 'b']).flat()).forEach(id=> sceneActorGone(id));
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
    const id = 'cz' + i, aid = 'cza' + i, ms = 2600 + (i % 3) * 400;
    invActor(id, folk[i % folk.length], x0, y0, 1.3, { flip:x1 > x0 });
    const e = document.getElementById('sa-' + id); if(e) e.classList.add('inv-fleeing-run');
    /* (4.57) "each castle's fairy running, pursued by an alien": a square and a bit behind it, all the way */
    const d = Math.hypot(x1 - x0, y1 - y0) || 1, bx = (x1 - x0) / d * 1.3, by = (y1 - y0) / d * 1.3;
    invActor(aid, KH.kinds[i % KH.kinds.length], x0 - bx, y0 - by, 1.5, { flip:x1 > x0 });
    const ae = document.getElementById('sa-' + aid); if(ae) ae.classList.add('inv-band-actor', 'inv-chaser');
    return sceneWait(i * 220).then(()=> Promise.all([invActorTo(id, x1, y1, ms), invActorTo(aid, x1 - bx, y1 - by, ms)]))
      .then(()=> Promise.all([invActorFade(id, 400), invActorFade(aid, 400)]));
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
             ['advisor', `The Advisor beats a storm of feathers into the face of its captain.<br><br><b>"Hoo! Through the east door, then all the way up the corridor to the stair! Three of them are holding it — mind them!"</b>`],   // (4.57) all three at the stair
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
  invEraserCharge('wadjet', true);
  await sceneLook({ x:26, y:24, w:12, h:14 }, { ms:500 });
  await L([`At the fountain's rim, right behind the King, the air ripples like water — and a great dark cobra uncoils out of nothing. Over its head the air is tearing open into a black hole, red and purple light spiralling down into it.`,
           ['princess', `<b>"Father—!"</b>`]]);
  /* the laser: through the King's back */
  try { playSfx('core_blast'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  const hit = (()=>{ const H = stHoleAt('wadjet'); return invEraserBeam(H.x, H.y, F.king.x + 0.5, F.king.y + 0.15, 1100); })();
  invEraserFlash(900);
  await sceneWait(500);
  invEraserCharge('wadjet', false);
  if(ke){ sceneActor('king', { faint:1 }); ke.classList.add('inv-hurt'); }
  await hit;
  await invHopTo('prin', F.prin.x + 0.6, F.prin.y - 0.6, 0.4, 350);
  await L([`The black beam strikes the King full in the back. He falls without a sound.`,
           ['princess', `<b>"FATHER!"</b>`],
           ['wadjet', `<b>"Hsss… One beam. That was all it took."</b>`],
           ['wadjet', `<b>"The great Fairy King, of the Cosmic Council. One word from him, and every sword in this kingdom would march against Nemesis. Now there will be no word. And this next beam makes sure of it."</b>`]]);
  invEraserCharge('wadjet', true);
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
  invEraserCharge('wadjet', false);
  if(ke) ke.classList.add('inv-holding');
  await burst;
  ['sh1', 'sh2'].forEach(id=> sceneActorGone(id));
  await L([`A wave of pink light rolls out from her, across the whole square. Where it touches the shadows, they burn away like mist in the sun — and the dark over Wadjet's head shrinks to nothing.`,
           ['wadjet', `<b>"Hsss! My beam—!"</b>`],
           `The pink light settles over the King like a blanket. He draws a long breath — and holds on.`,
           ['king', `<b>"…My daughter…"</b>`],
           ['princess', `She doesn't let go of his hand.<br><br><b>"I've got you, Father. I'm not leaving you."</b>`]]);
  /* the Dauphin and the Advisor to the King's side */
  await Promise.all([invActorTo('adv', F.king.x - 1.4, F.king.y - 0.4, 500), invActorTo('dau', F.king.x + 2.2, F.king.y + 0.6, 500)]);
  { const a = document.getElementById('sa-adv'), d = document.getElementById('sa-dau'); if(a) actorFace(a, true); if(d) actorFace(d, false); }
  await L([['dauphin', `<b>"Little sister…?! — Guard Father! Nothing gets past us now!"</b>`],
           ['wadjet', `<b>"A late bloomer. How touching. No matter: the dark always comes back… and I have all the time in the world."</b>`]]);
  /* he turns on you */
  await invHopTo('wadjet', F.wadjet.x, F.wadjet.y, 1.1, 650);           // he rears up
  await L([['wadjet', `He rises over the King's head, his eyes on you.<br><br><b>"But first — you, little trainer. You and your lion have been a thorn in Nemesis's side from the very start. Let's see how long you last against a serpent who can turn back time."</b>`],
           ['lion', `<b>"Here he comes — stand your ground!"</b>`]]);
  invSet('wadjet');
  ui.sceneRunning = false;
  invWadjetBattle();
}
/* (4.59) his Eraser Beam, seen: black, edged in purple and red, from (x0, y0) to (x1, y1) in squares — (4.61) its aura on
   what it strikes for ms, then eight blasts round it, all of it shaking (43-the-duel.js's stEraseHit); done when they are */
function invEraserBeam(x0, y0, x1, y1, ms){
  if(typeof stEBeam !== 'function') return Promise.resolve();
  const b = stEBeam(x0, y0, x1, y1, {});
  return stEraseHit(x1, y1, { r:2.2, boom:2.8, n:8, aura:ms, spread:0.6 }).then(()=> stBeamOut(b));
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
  const rift = invRiftEl(world, N.rift.x, N.rift.y + 0.9, INV_RIFT_JG_SIZE, 'invRiftJg', '');
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
  return invRiftArmyRun(rift);
}
/* Lucesco after him — and out of it, the other way, an army. (4.58) After his fight at the edge (42-the-hunt.js) you are
   on Lucesco's back: the two of you leap at it together, and land back */
async function invRiftArmyRun(rift, o){
  const N = invNorth(), w = walkState(), you = w.at[JG_KEY], ride = !document.getElementById('sa-lion');
  await L([['lion', `<b>"Oh no you don't — RAAH!"</b>`]]);
  let jump, back;
  if(ride){
    const me = $('#walkYou'), T = WALK_T, at = (x, y)=> `translate3d(${(x * T).toFixed(1)}px,${(y * T).toFixed(1)}px,0)`;
    const run = me && typeof me.animate === 'function' && !(typeof jgReduced === 'function' && jgReduced())
      ? me.animate([{ transform:at(you.x, you.y) }, { transform:at((you.x + N.x) / 2, Math.min(you.y, 3) - 1.4), offset:0.25 }, { transform:at(N.x, 3.2), offset:0.48 },
                    { transform:at(N.x, 3.2), offset:0.55 }, { transform:at((you.x + N.x) / 2, Math.min(you.y, 3) - 1.1), offset:0.78 }, { transform:at(you.x, you.y) }],
                   { duration:1100 * SCENE_SPEED, easing:'ease-in-out' }) : null;
    jump = sceneWait(520); back = run ? run.finished.catch(()=>{}) : sceneWait(1100);
  } else jump = invHopTo('lion', N.x, 3, 1.4, 520);
  await sceneWait(380);
  if(rift) rift.classList.add('inv-rift-flare');
  try { playSfx('ambush'); } catch(e){}
  await jump;
  if(!ride) back = invHopTo('lion', you.x + 1, you.y, 1.1, 520);
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
  const rift = document.getElementById('invRiftJg') || invRiftEl(world, N.rift.x, N.rift.y + 0.9, INV_RIFT_JG_SIZE, 'invRiftJg', '');
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
        act:()=> caLines([[knightWho(ks), caTurn('invPerimSoldier', INV_LINES.perimSoldier)]]) });   // (4.70) a Duck or Bug Knight speaks as itself, not as the Chestnut Knight (26-invasion.js)
  });
}
/* drawn with the jungle: the rift (from the chase on), and afterwards its palisade and the aliens penned in it */
function riftJungleDraw(world){
  invNorthMist(world);
  if(!invOn()) return;
  const N = invNorth(), v = invState();
  const shown = invAfter() || (invAt('chase') && !!v.nem && !!v.said.riftOut);
  if(!shown) return;
  invRiftEl(world, N.rift.x, N.rift.y + 0.9, INV_RIFT_JG_SIZE, 'invRiftJg', '');
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
  if(st === 'palace') return caLines([['lion', `<b>"The princess is up in the tower. The stair is at the end of the east corridor — and three of them are standing right in front of it."</b>`]]);   // (4.57)
  if(st === 'tower') return caLines([['lion', `<b>"Her room is at the west end of the gallery upstairs. The servants are holding them off — let's help them, and whatever stands at her door, we go through it."</b>`]]);
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
/* one in flight, from (x0, y0) to (x1, y1) in squares, over everything; resolves as it is gone. (4.56) `quiet`: the
   King's hunt's, every few seconds — no alarm, and not counted with the scenes' */
function invCocoonFly(world, x0, y0, x1, y1, ms, quiet){
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
  if(!quiet){
    try { playSfx('alert'); } catch(e){}
    ui.invCocoonsFlown = (ui.invCocoonsFlown || 0) + 1;                 // (the test looks)
  }
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
  /* the rift's army, at its foot */
  .walk-ent.inv-rift-army img{ filter:drop-shadow(0 0 9px rgba(170,40,230,.9)); }
  .inv-stake.inv-stake-gate{ filter:brightness(1.15) saturate(.8); }
  .q-sniff-rift svg, .jg-map-rift svg{ vertical-align:middle; }
  .jg-map-rift svg{ vertical-align:-2px; }
  @media (prefers-reduced-motion: reduce){ .inv-cocoon .ic-in, .inv-cocoon-smoke i, .scene-actor.inv-fleeing-run .sa-in{ animation-duration:6s; } }
  `;
  document.head.appendChild(s);
}

/* ============================================================
   THE KING'S HUNT (4.56) — (4.57) THE CHASES PAST THE FOUNTAIN
   The designer, 2026-11-16: "can you help me upgrade the fairy king's urgent return to the castle? I love the cocoon
   animations and sprites! Please have more running citizens and aliens roaming, more than soldiers available. Have the
   king on his horse track and hunt down aliens on his steed automatically, and laser them down with his purple beam.
   Hold the laser and play the alien electrocution animation for much longer but without the sound until the alien
   turns black, then fades into dust that floats off. … The king will only target roaming aliens, not the ones who are
   fighting his soldiers. Furthermore the king will occasionally stop, lean forward a little, and have a black shadow
   over his head to show how spent he is. Talking to the king will show a message about how exhausted it is, to the
   point it seems like he might fade away at any moment, yet his fierce protectiveness makes him terrifying as he
   ruthlessly channels his life force into intensely hot psychic beams. He then speaks, telling the player to please
   hurry and save his beloved daughters, especially the younger princess."
   (4.57) The designer, 2026-11-17: "When the townspeople are running, they don't glide from square to square but
   jerkily flash across squares. Is it due to the bandwidth of the programme not being high enough to render this? Also
   the aliens are wandering about. Can we have each castle's fairy running, pursued by an alien, like how whalelord
   follows the player? Have the fairies spawn from the corners outside the fountain run past the fountain, and the king
   will zap the aliens as they run past, letting the fairy escape and fade. Let's reduce this to 5 aliens on screen at a
   time apart from the ones fighting soldiers."
   (Not the bandwidth: each of their steps set the picture's whole `transition` to its fade alone, which took the move
   out of it — so the step jumped. The move and the fade are one list now, always (khPlace, khFade); and each move runs a
   little longer than the step, so one runs on into the next with no stop between.)
   While the castle is invaded and the tribes have not come yet (the new way: the palace, the tower, the escort), the
   grounds have, besides the knights' fights: townsfolk running for their lives out of the market's four corners, past
   the grand fountain on the palace's side of it, and on to the far corner — each with an alien at its heels, a square
   behind, stepping where it stepped; five of those at a time at most. The King on his horse keeps to the fountain: as
   each comes past he holds his beam on the alien — it crackles and blackens, silently, then dust on the wind — while the
   fairy runs on, out of danger, and fades away. After two or three he stops, bowed in the saddle, a shadow over his
   head. He never turns on the ones the knights are fighting.
   ============================================================ */
const KH = {
  pairs:5,                                  // (4.57) at once: a fairy running, an alien at its heels (the knights' own fights besides)
  tick:50, kingMs:250, runMs:250, glide:1.2, // a step (his horse; a fairy and the one after it); each move a little longer than its step
  reach:4, holdMs:3200, dustMs:1700,        // his beam's reach (squares); held this long; then dust
  restEvery:[2, 3], restMs:3600, firstMs:900,
  spawnMs:[700, 2100],                      // the next pair out of a corner, so long after the last
  escape:5, fadeMs:650,                     // a fairy whose alien he has caught runs on this many squares, and fades away
  ring:3,                                   // he keeps to within this of the fountain's basin
  stuckMs:4000,                             // a pair that cannot get past anyone for this long gives up (fades)
  kinds:['alien_insect_physical', 'alien_magnet_electric', 'alien_crocodilian_fire', 'alien_golem_ground', 'alien_gremlin_fairy',
         'alien_toxic_gas_ghost', 'alien_dolphin_water', 'alien_flower_grass', 'alien_robot_steel', 'alien_grimgate_psychic'],
};
let _kh = null;
/* while it goes on: the castle invaded, the new way, before the tribes come — and not in one of its scenes */
function khOn(){
  return typeof invOn === 'function' && invOn() && invNew() && invAt('palace', 'tower', 'escort') && !invRouted() && !ui.invClimax;
}
const KH_FOUNT = { x0:28, y0:35, x1:34, y1:41 };                                      // the grand fountain's basin
const KH_CORNERS = [{ x:16, y:32 }, { x:47, y:32 }, { x:16, y:45 }, { x:47, y:45 }];  // the market's corners: out of one, across to the far one
const KH_PAST = { x0:27, x1:35, y0:32, y1:32 };                                       // …by the fountain, on the palace's side of it: past him (the first row of the market: the fountain's crown hides the next ones)
const KH_POST = { x:31, y:31 };                                                       // where he waits for them: the path before the fountain
const KH_FOLK = ['choux_fairy', 'choux_fairy1', 'fairybunny', 'fairybunny1', 'fairybird', 'fairybird1', 'cream_fairy', 'cream_fairy1', 'melody_fairy'];
function khStart(world){
  khStop();
  if(!world || !khOn()) return;
  khCss();
  const m = CA_MAPS[CA_KEY](), T = WALK_T;
  const H = _kh = { world, m, T, clock:0, last:performance.now(), pairs:[], kills:0, restAt:2 + (Math.random() < 0.5 ? 1 : 0), n:0, beams:0,
                    spawned:0, escaped:0, nextPair:900, corner:-1 };
  ui.kingHunt = H;
  H.grid = khGrid(H);                                                  // (4.57) the ground, once: asked of the deck's things square by square, a path cost a fifth of a second
  H.corners = KH_CORNERS.map(c=> khNearestOpen(m, c));
  /* the King: where the rush left him, on the path before the fountain (or his post, or near it) */
  const k = [INV_FOUNT.king, KH_POST, { x:30, y:31 }, { x:32, y:31 }, { x:30, y:30 }, { x:32, y:30 }].find(q=> khGround(m, q.x, q.y) && !khTaken(q.x, q.y)) || INV_FOUNT.king;
  H.king = { kind:'king', x:k.x, y:k.y, state:'hunt', next:KH.firstMs, el:khEl(H, 'kh-king', khKingImg('front'), k.x, k.y) };
  H.king.el.id = 'khKing';
  /* three already on their way across */
  [0.3, 0.55, 0.8].forEach(t=> khPair(H, t));
  H.iv = setInterval(khTick, KH.tick);
}
function khStop(){
  if(!_kh) return;
  const H = _kh;
  clearInterval(H.iv);
  (H.timers || []).forEach(t=> clearTimeout(t));
  H.pairs.forEach(q=> clearTimeout(q.a._boltT));
  if(H.world) H.world.querySelectorAll('.kh-ent, .kh-beam, .kh-dustcloud').forEach(el=> el.remove());
  _kh = null; ui.kingHunt = null;
}
/* the tribes march in (invTribesMarch): the aliens break and run with the rest, the townsfolk get indoors, and the King
   rides back to the fountain to wait for her (the things drawn there take over: 26-invasion.js) */
function khRout(H){
  H.routed = true;
  if(H.king && H.king.beam){ H.king.beam.remove(); H.king.beam = null; }
  H.pairs.forEach(q=>{
    const a = q.a;
    clearTimeout(a._boltT);
    if(a.state !== 'gone' && a.state !== 'dust'){ a.state = 'gone'; khPlace(a.el, a.x, a.y + 6, 1400); khFade(a.el, 0, 1400); }
    q.state = 'gone'; khFade(q.f.el, 0, 800);
  });
  if(H.king) khFade(H.king.el, 0, 900);
  const t = setTimeout(()=>{ if(_kh === H) khStop(); }, 1600);
  (H.timers = H.timers || []).push(t);
}
/* the nearest square anyone can stand on to (x, y), within three */
function khNearestOpen(m, d){
  for(let r = 0; r <= 3; r++) for(let dy = -r; dy <= r; dy++) for(let dx = -r; dx <= r; dx++){
    if(Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = d.x + dx, y = d.y + dy;
    if(khGround(m, x, y)) return { x, y };
  }
  return null;
}
/* a square of the grounds anyone can stand on (the knights' fights and the stalls are things: not those) */
function khGround(m, x, y){
  const H = _kh;
  if(H && H.grid && m === H.m) return x >= 0 && y >= 0 && x < m.W && y < m.H && H.grid[y * m.W + x] === 1;
  return !caSolidCode(caAt(m, x, y)) && !wBlockedBy(DECKS[CA_KEY], x, y);
}
/* (4.57) the grounds' squares anyone can stand on, worked out once for the hunt: the map's own, less what the deck's
   things stand on (the first thing on a square says, as wThingAt does) — the knights' fights do not move */
function khGrid(H){
  const m = H.m, W = m.W, N = W * m.H, g = new Uint8Array(N), seen = new Uint8Array(N);
  for(let i = 0; i < N; i++) g[i] = caSolidCode(m.g[i]) ? 0 : 1;
  deckThings(DECKS[CA_KEY]).forEach(t=>{
    for(let dy = 0; dy < (t.h || 1); dy++) for(let dx = 0; dx < (t.w || 1); dx++){
      const x = t.x + dx, y = t.y + dy;
      if(x < 0 || y < 0 || x >= W || y >= m.H) continue;
      const i = y * W + x;
      if(seen[i]) continue;
      seen[i] = 1;
      if(!t.walk) g[i] = 0;
    }
  });
  return g;
}
/* the whole way from a to b over the ground (squares, both ends in it): for the first few, already on their way */
function khRoute(H, a, b){
  const m = H.m, W = m.W, prev = new Int32Array(W * m.H).fill(-1), s = a.y * W + a.x, e = b.y * W + b.x, q = [s];
  prev[s] = s;
  for(let h = 0; h < q.length && prev[e] < 0; h++){
    const c = q[h], cx = c % W, cy = (c - cx) / W;
    for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const x = cx + dx, y = cy + dy, i = y * W + x;
      if(x < 0 || y < 0 || x >= W || y >= m.H || prev[i] >= 0 || !khGround(m, x, y)) continue;
      prev[i] = c; q.push(i);
    }
  }
  if(prev[e] < 0) return [];
  const out = [];
  for(let c = e; ; c = prev[c]){ out.push({ x:c % W, y:(c - c % W) / W }); if(c === s) break; }
  return out.reverse();
}
/* somebody of the hunt on (x, y) (or you): not two on one square */
function khTaken(x, y, me){
  const H = _kh; if(!H) return false;
  const p = caYou(), L = typeof caLion !== 'undefined' && caLion.at;
  if(p && p.x === x && p.y === y) return true;
  if(L && L.x === x && L.y === y) return true;                          // Lucesco, at your side (not while you are on his back)
  if(H.king && H.king !== me && H.king.x === x && H.king.y === y) return true;
  return H.pairs.some(q=> (q.f !== me && q.state !== 'gone' && q.f.x === x && q.f.y === y) || (q.a !== me && khAlienUp(q.a) && q.a.x === x && q.a.y === y));
}
/* an alien of theirs on the grounds, standing (after a fairy, or under his beam) */
function khAlienUp(a){ return a.state === 'chase' || a.state === 'zap'; }
/* right beside Lucesco (his square or one next to it) */
function khByLion(x, y){ const L = typeof caLion !== 'undefined' && caLion.at; return !!L && Math.max(Math.abs(x - L.x), Math.abs(y - L.y)) <= 1; }
/* how far (in squares, either way) from you */
function khFromYou(x, y){ const p = caYou(); return p ? Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) : 0; }
function khDist(a, b){ return Math.hypot(a.x - b.x, a.y - b.y); }
/* within r of the fountain's basin */
function khRing(x, y, r){ r = r == null ? KH.ring : r; const F = KH_FOUNT; return x >= F.x0 - r && x <= F.x1 + r && y >= F.y0 - r && y <= F.y1 + r; }
/* ---------- the figures ---------- */
/* a picture standing on its square's foot, as the castle's people do (.ca-art: 21-castle.js; spriteFeet) */
function khImg(src, px){ const w = Math.round(px); return `<img class="ca-art kh-art" src="${src}" alt="" style="width:${w}px;height:${w}px" onload="spriteFeet(this)" onerror="this.style.visibility='hidden'">`; }
function khKingImg(view){ return khImg(`assets/mon/fairy_king_mounted_c_${view}.png`, WALK_T * 2.3); }
function khEl(H, cls, html, x, y){
  const el = document.createElement('div');
  el.className = 'walk-ent kh-ent ' + cls;
  el.innerHTML = `<div class="kh-fig">${html}</div>`;
  H.world.appendChild(el);
  khPlace(el, x, y, 0);
  return el;
}
/* (4.57) its move (ms, over to x, y) and its fade (khFade) are one transition list, transform then opacity — neither
   ever put out of it by the other */
function khPlace(el, x, y, ms){
  if(ms != null) el._mv = Math.round(ms);
  el.style.transitionDuration = `${el._mv || 0}ms, ${el._fd || 0}ms`;
  el.style.transform = `translate3d(${x * WALK_T}px,${y * WALK_T}px,0)`;
  el.style.zIndex = 10 + y;
}
function khFade(el, to, ms){
  el._fd = Math.round(ms);
  el.style.transitionDuration = `${el._mv || 0}ms, ${el._fd}ms`;
  el.style.opacity = String(to);
}
/* a step of one of them (a fairy, an alien, the King): facing the way it goes, gliding there */
function khMove(o, s, ms){
  if(s.x !== o.x){ o.faceR = s.x > o.x; faceRight(o.el, o.faceR); }
  o.x = s.x; o.y = s.y;
  khPlace(o.el, s.x, s.y, ms * KH.glide);
}
/* (4.57) a fairy out of a corner, running for its life past the fountain to the far one, an alien a square behind it —
   or, `along` (0–1) its way across already (the first few) */
function khPair(H, along){
  const live = H.pairs.filter(q=> q.a.state === 'wait' || khAlienUp(q.a)).length;
  if(live >= KH.pairs) return null;
  let c = Math.floor(Math.random() * 4);
  if(c === H.corner) c = (c + 1 + Math.floor(Math.random() * 3)) % 4;
  const from = H.corners[c], to = H.corners[3 - c];
  if(!from || !to) return null;
  /* by the fountain on the way: a square of the market before it, on the palace's side — past him */
  const past = { x:KH_PAST.x0 + Math.floor(Math.random() * (KH_PAST.x1 - KH_PAST.x0 + 1)), y:KH_PAST.y0 + Math.floor(Math.random() * (KH_PAST.y1 - KH_PAST.y0 + 1)) };
  const wp = khNearestOpen(H.m, past);
  let at = from, back = from;
  if(along){
    const route = khRoute(H, from, wp).concat(khRoute(H, wp, to).slice(1));
    if(route.length < 8) return null;
    const i0 = Math.max(1, Math.min(route.length - 3, Math.round(route.length * along)));
    at = route[i0]; back = route[i0 - 1];
    /* (past the fountain already: on to the far corner) */
    const w = route.findIndex(s=> s.x === wp.x && s.y === wp.y);
    if(w >= 0 && i0 >= w) wp.done = true;
  }
  if(khTaken(at.x, at.y) || (along && khTaken(back.x, back.y))) return null;
  H.corner = c;
  const sp = KH_FOLK[Math.floor(Math.random() * KH_FOLK.length)], al = KH.kinds[Math.floor(Math.random() * KH.kinds.length)];
  const q = { id:'hp' + (H.n++), wp, goal:to, state:'run', next:H.clock + (along ? 150 : 300), left:0, stuck:0 };
  q.f = { kind:'folk', sp, x:at.x, y:at.y, faceR:false, el:khEl(H, 'kh-folk', khImg(`assets/mon/${sp}_front.png`, WALK_T * 1.3), at.x, at.y) };
  q.a = { kind:'alien', sp:al, x:back.x, y:back.y, faceR:false, state:along ? 'chase' : 'wait', el:khEl(H, 'kh-alien', khImg(`assets/mon/${al}.png`, WALK_T * 1.5), back.x, back.y) };
  const ahead = wp.done ? to : wp;
  q.f.faceR = q.a.faceR = ahead.x > at.x;
  faceRight(q.f.el, q.f.faceR); faceRight(q.a.el, q.a.faceR);
  if(!along){ q.f.el.style.opacity = '0'; q.a.el.style.opacity = '0'; void q.f.el.offsetWidth; khFade(q.f.el, 1, 300); }
  H.pairs.push(q); H.spawned++;
  return q;
}
/* ---------- the clock: a twentieth of a second at a time, stopped while anyone talks or a scene plays ---------- */
function khPaused(){
  return !!(ui.caTalk || ui.sceneRunning || walkState().busy || document.querySelector('.scene-say') || (typeof eyeBreakActive === 'function' && eyeBreakActive()));
}
function khTick(){
  const H = _kh;
  if(!H) return;
  if(ui.screen !== CA_KEY || !H.world.isConnected || !khOn()){ khStop(); return; }
  const now = performance.now(), dt = Math.min(250, now - H.last);
  H.last = now;
  if(ui.sceneRunning){ if(!H.routed && document.querySelector('.inv-clash-alien.inv-fleeing')) khRout(H); return; }   // (the tribes are driving them out)
  if(khPaused()) return;
  H.clock += dt;
  if(H.clock >= H.nextPair) H.nextPair = H.clock + (khPair(H, 0) ? KH.spawnMs[0] + Math.random() * (KH.spawnMs[1] - KH.spawnMs[0]) : 500);
  H.pairs.forEach(q=> khPairStep(H, q));
  khKingStep(H);
  H.pairs = H.pairs.filter(q=> !(q.state === 'gone' && (q.a.state === 'gone' || q.a.state === 'wait')));
}
/* the next step towards any of `goals` (squares), round whatever is in the way */
function khPath(H, me, goals){
  const W = H.m.W, set = new Set(goals.map(g=> g.y * W + g.x));
  const s = caPathNext(H.m, me, set, (x, y)=> khGround(H.m, x, y) && !khTaken(x, y, me));
  return s && !khTaken(s.x, s.y, me) ? s : null;                       // (a goal is let in even when someone is on it: not to step on them)
}
/* (4.57) a pair's step: the fairy on (past the fountain, then to the far corner), the alien into the square it left —
   as the Whalelord follows you. Over the far side, or (its alien caught) far enough off, or stuck: it fades away. */
function khPairStep(H, q){
  if(q.state === 'gone' || H.clock < q.next) return;
  const f = q.f, a = q.a;
  if((f.x === q.goal.x && f.y === q.goal.y) || (q.state === 'free' && q.left <= 0) || q.stuck >= KH.stuckMs){
    q.state = 'gone';
    khFade(f.el, 0, KH.fadeMs);
    if(a.state === 'chase' || a.state === 'wait'){ a.state = 'gone'; khFade(a.el, 0, KH.fadeMs); }
    if(q.free) H.escaped++;
    const t = setTimeout(()=>{ f.el.remove(); if(a.state === 'gone') a.el.remove(); }, KH.fadeMs + 80);
    (H.timers = H.timers || []).push(t);
    return;
  }
  if(!q.wp.done && Math.abs(f.x - q.wp.x) + Math.abs(f.y - q.wp.y) <= 1) q.wp.done = true;   // by the fountain: on to the far corner
  const s = khPath(H, f, [q.wp.done ? q.goal : q.wp]);
  if(!s){ q.stuck += 250; q.next = H.clock + 250; return; }
  q.stuck = 0;
  const ms = KH.runMs * (q.state === 'free' ? 0.85 : 1) * (0.94 + Math.random() * 0.12);
  const was = { x:f.x, y:f.y };
  khMove(f, s, ms);
  if(a.state === 'wait'){                                              // out of the corner after it
    a.state = 'chase'; a.x = was.x; a.y = was.y;
    khPlace(a.el, was.x, was.y, 0); khFade(a.el, 1, 260);
  } else if(a.state === 'chase') khMove(a, was, ms);
  if(q.state === 'free') q.left--;
  q.next = H.clock + ms;
}
/* ---------- the King ---------- */
function khKingView(H, view){
  const k = H.king;
  if(k.view === view) return;
  k.view = view;
  const img = k.el.querySelector('img');
  if(img) img.src = `assets/mon/fairy_king_mounted_c_${view}.png`;
}
/* the one after a fairy he can reach from where he stands (his beam's reach, straight), the nearest — one he can see,
   and not through you (or Lucesco): never one behind the fountain's crown and basin, where his beam would end in the
   painted water */
function khInReach(H, at, among, reach){
  let best = null, bd = Infinity;
  (among || []).forEach(a=>{ if(a.state !== 'chase' || khHidden(a) || !khClear(at, a)) return; const d = khDist(a, at); if(d <= (reach || KH.reach) && d < bd){ bd = d; best = a; } });
  return best;
}
function khHidden(a){ return a.x >= KH_FOUNT.x0 - 1 && a.x <= KH_FOUNT.x1 + 1 && a.y >= KH_FOUNT.y0 - 2 && a.y <= KH_FOUNT.y1 + 1; }
/* his beam's line, from his raised hand to it, clear of you and of Lucesco */
function khClear(k, a){
  const x0 = k.x + 0.5, y0 = k.y - 0.62, x1 = a.x + 0.5, y1 = a.y + 0.3, vx = x1 - x0, vy = y1 - y0, L = vx * vx + vy * vy || 1;
  const off = q=>{ if(!q) return Infinity; const cx = q.x + 0.5, cy = q.y + 0.1, t = Math.max(0, Math.min(1, ((cx - x0) * vx + (cy - y0) * vy) / L)); return Math.hypot(x0 + vx * t - cx, y0 + vy * t - cy); };
  return off(caYou()) > 0.75 && off(typeof caLion !== 'undefined' && caLion.at) > 0.6;
}
function khKingStep(H){
  const k = H.king;
  if(!k || H.clock < k.next) return;
  if(k.state === 'rest'){ k.el.classList.remove('kh-spent'); k.state = 'hunt'; k.next = H.clock + 300; return; }
  if(k.state === 'beam') return khBeamEnd(H);
  /* bowed in the saddle, a shadow over his head: after two or three */
  if(H.kills >= H.restAt){
    H.restAt = H.kills + KH.restEvery[0] + Math.floor(Math.random() * (KH.restEvery[1] - KH.restEvery[0] + 1));
    k.state = 'rest'; k.el.classList.add('kh-spent'); khKingView(H, 'front');
    k.next = H.clock + KH.restMs;
    H.rests = (H.rests || 0) + 1;
    return;
  }
  /* one coming past within his reach: he fires */
  const chasers = H.pairs.filter(q=> q.a.state === 'chase').map(q=> q.a);
  const near = khInReach(H, k, chasers, KH.reach);
  if(near) return khBeam(H, near);
  /* you have come up to him: he holds still for you (a word with him: khKingNear) */
  if(khFromYou(k.x, k.y) <= 2){ k.next = H.clock + 300; return; }
  /* out to meet the nearest one coming — never far from the fountain; none near: back to the path before it */
  const coming = chasers.filter(a=> khRing(a.x, a.y, KH.ring + KH.reach)).sort((a, b)=> khDist(k, a) - khDist(k, b))[0];
  let goals = [];
  if(coming){
    for(let dy = -3; dy <= 3; dy++) for(let dx = -3; dx <= 3; dx++){
      const dd = Math.hypot(dx, dy); if(dd > 3 || dd < 1.5) continue;
      const x = coming.x + dx, y = coming.y + dy;
      if(khRing(x, y) && y <= KH_FOUNT.y0 && khGround(H.m, x, y)) goals.push({ x, y });   // (his side of it: the palace's)
    }
  } else if(khDist(k, KH_POST) > 1.5) goals.push(KH_POST);
  goals = goals.filter(g=> khFromYou(g.x, g.y) >= 2 && !khByLion(g.x, g.y));   // never right beside you (his picture is tall)
  const s = goals.length ? khPath(H, k, goals) : null;
  if(!s || khFromYou(s.x, s.y) < 2 || khByLion(s.x, s.y)){ k.next = H.clock + 300; return; }
  khKingView(H, s.y < k.y ? 'back' : 'front');
  khMove(k, s, KH.kingMs);
  k.next = H.clock + KH.kingMs;
}
/* his beam: from his raised hand to it, held — it crackles, blackens; then dust. Its fairy runs on, free. */
function khBeam(H, a){
  const k = H.king, T = WALK_T;
  a.state = 'zap';
  const q = H.pairs.find(p=> p.a === a);
  if(q && q.state === 'run'){ q.state = 'free'; q.free = true; q.left = KH.escape; }
  k.state = 'beam'; k.target = a;
  k.faceR = a.x > k.x || (a.x === k.x && k.faceR); faceRight(k.el, k.faceR);
  khKingView(H, 'front');
  const fx = (k.x + 0.5 + (k.faceR ? 0.18 : -0.18)) * T, fy = (k.y - 0.62) * T, tx = (a.x + 0.5) * T, ty = (a.y + 0.3) * T;
  const len = Math.hypot(tx - fx, ty - fy), ang = Math.atan2(ty - fy, tx - fx) * 180 / Math.PI;
  const beam = document.createElement('div');
  beam.className = 'kh-beam';
  beam.style.cssText = `left:${fx.toFixed(1)}px;top:${fy.toFixed(1)}px;width:${len.toFixed(1)}px;transform:rotate(${ang.toFixed(2)}deg);z-index:${Math.round(12 + Math.max(k.y, a.y))};`;
  beam.innerHTML = '<i></i><b></b><em></em>';
  H.world.appendChild(beam);
  k.beam = beam;
  k.el.classList.add('kh-cast');
  /* (it finishes the stride it is in, onto its square, and goes no further) */
  a.el.classList.add('kh-zap');
  a.el.style.setProperty('--hold', KH.holdMs + 'ms');
  khBolts(a);
  H.beams++;
  k.next = H.clock + KH.holdMs;
}
/* the alien under it: bolts, purple and white, flickering round it all the while */
function khBolts(a){
  let svg = a.el.querySelector('.kh-bolts');
  if(!svg){ svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'kh-bolts'); svg.setAttribute('viewBox', '0 0 180 180'); svg.setAttribute('aria-hidden', 'true'); a.el.appendChild(svg); }
  const tick = ()=>{
    if(!svg.isConnected || a.state !== 'zap'){ svg.innerHTML = ''; return; }
    let h = '';
    for(let i = 0; i < 5; i++){ const pts = typeof jgBoltPts === 'function' ? jgBoltPts(true) : ''; h += `<polyline class="g" points="${pts}"></polyline><polyline class="c" points="${pts}"></polyline>`; }
    svg.innerHTML = h;
    a._boltT = setTimeout(tick, 55);
  };
  tick();
}
function khBeamEnd(H){
  const k = H.king, a = k.target;
  k.state = 'hunt'; k.target = null; k.next = H.clock + 450;
  k.el.classList.remove('kh-cast');
  if(k.beam){ const b = k.beam; b.classList.add('out'); setTimeout(()=> b.remove(), 300); k.beam = null; }
  if(!a) return;
  H.kills++;
  khDust(H, a);
}
/* black as soot, it comes apart: dust, drifting off on the wind */
function khDust(H, a){
  a.state = 'dust';
  clearTimeout(a._boltT);
  const svg = a.el.querySelector('.kh-bolts'); if(svg) svg.remove();
  a.el.classList.remove('kh-zap'); a.el.classList.add('kh-dust');
  const T = WALK_T, box = document.createElement('div');
  box.className = 'kh-dustcloud';
  box.style.cssText = `left:${(a.x + 0.5) * T}px;top:${(a.y + 0.35) * T}px;z-index:${Math.round(11 + a.y)};--t:${T}px;`;
  let h = '';
  for(let i = 0; i < 40; i++){
    const dx = (-0.4 + Math.random() * 2.6) * T, dy = (-2.1 + Math.random() * 1.5) * T, r = 2.5 + Math.random() * 5;
    const sx = (Math.random() - 0.5) * 0.9 * T, sy = (Math.random() - 0.55) * 1.1 * T;
    h += `<i style="left:${sx.toFixed(1)}px;top:${sy.toFixed(1)}px;width:${r.toFixed(1)}px;height:${r.toFixed(1)}px;--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px;animation-delay:${Math.round(Math.random() * 380)}ms;animation-duration:${Math.round(KH.dustMs * (0.75 + Math.random() * 0.5))}ms"></i>`;
  }
  box.innerHTML = h;
  H.world.appendChild(box);
  setTimeout(()=>{ a.state = 'gone'; a.el.remove(); }, Math.round(KH.dustMs * 0.7));
  setTimeout(()=> box.remove(), KH.dustMs * 1.4);
}
/* ---------- talking to him ---------- */
const KH_LINES = {
  look:[`The King reins in beside you. He is grey to the lips, and the light round him gutters like a candle burnt down to the last of its wick. He looks as if he might fade away at any moment.`,
        `And yet he is terrifying. Whenever an alien so much as turns towards his people, he pours his own life into his psychic beam without a moment's thought for what it costs him — and it burns white-hot.`],
  palace:[`<b>"Please… hurry. Save my daughters. My little one most of all — she is so small, and she will be so frightened."</b>`,
          `<b>"I can hold them here a little longer. Not long. Go — bring my girls out to me. My little one first."</b>`],
  tower:[`<b>"She is in the tower? Then she is hiding — she always hides. Please, hurry… bring her out before they find her."</b>`],
  escort:[`<b>"You have her? Oh, my little one… keep her close, keep her away from them, and bring her to me."</b>`],
};
function khKingNear(key, p){
  const H = _kh;
  if(key !== CA_KEY || !H || !H.king || !p) return null;
  const k = H.king;
  if(Math.max(Math.abs(k.x - p.x), Math.abs(k.y - p.y)) > 2) return null;   // (he is tall: two squares off is beside him)
  return { key:'khKing', at:{ x:k.x, y:k.y }, html:`💬 Talk<small>The Fairy King</small>`, face:`<img src="assets/mon/fairy_king_mounted_c_front.png" alt="">`, act:()=> khKingTalk() };
}
function khKingTalk(){
  const H = _kh;
  if(H && H.king && H.king.state === 'beam') khBeamEnd(H);            // (he lets it go to look at you)
  const st = invAt('tower') ? 'tower' : invAt('escort') ? 'escort' : 'palace';
  const first = !invSaid('khTalk');
  if(first) invSay('khTalk');
  return caLines((first ? KH_LINES.look : [KH_LINES.look[0]]).concat([['king', caTurn('khKing' + st, KH_LINES[st])]]));
}
/* ---------- how it looks ---------- */
let _khCss = false;
function khCss(){
  if(_khCss || typeof document === 'undefined') return;
  _khCss = true;
  invReturnCss();
  const s = document.createElement('style');
  s.id = 'khCss';
  s.textContent = `
  .walk-ent.kh-ent{ position:absolute; left:0; top:0; width:${WALK_T}px; height:${WALK_T}px; pointer-events:none; overflow:visible;
    transition-property:transform, opacity; transition-duration:0ms, 0ms; transition-timing-function:linear, ease; }
  .kh-ent .kh-fig{ position:absolute; left:0; right:0; bottom:0; display:flex; justify-content:center; align-items:flex-end; }
  .kh-ent .kh-fig img{ max-width:none; }
  .kh-ent.face-r .kh-fig img{ scale:-1 1; }
  .walk-ent.kh-ent .kh-art{ filter:brightness(1) saturate(1) drop-shadow(0 0 0 rgba(0,0,0,0)) drop-shadow(0 3px 2px rgba(0,0,0,.35)); }
  /* the townsfolk: running, bobbing as they go */
  .walk-ent.kh-folk .kh-fig{ animation:invRun .3s ease-in-out infinite; }
  /* an alien after one of them: a red menace about it, lunging as it runs */
  .walk-ent.kh-alien .kh-art{ filter:brightness(1) saturate(1) drop-shadow(0 0 4px rgba(255,40,40,.75)) drop-shadow(0 2px 2px rgba(0,0,0,.35)); }
  .walk-ent.kh-alien .kh-fig{ animation:khPounce .5s ease-in-out infinite; }
  @keyframes khPounce{ 0%,100%{ translate:0 0; rotate:0deg; } 50%{ translate:0 -5%; rotate:-4deg; } }
  .walk-ent.kh-alien.face-r .kh-fig{ animation-direction:reverse; }
  /* under his beam: shaking, crackling, and going black from the edges in, over the whole of the hold */
  .walk-ent.kh-alien.kh-zap .kh-fig{ animation:khShake .09s steps(2) infinite; }
  .walk-ent.kh-alien.kh-zap .kh-art{ transition:filter var(--hold, 3200ms) cubic-bezier(.4,0,.75,1);
    filter:brightness(0) saturate(1) drop-shadow(0 0 3px #e6ccff) drop-shadow(0 0 10px rgba(170,90,255,.95)); }
  @keyframes khShake{ 0%{ rotate:-6deg; translate:-2px 0; } 50%{ rotate:6deg; translate:2px -1px; } 100%{ rotate:-3deg; translate:0 1px; } }
  .walk-ent.kh-ent .kh-bolts{ position:absolute; left:-40%; top:-110%; width:180%; height:180%; overflow:visible; pointer-events:none; }
  .kh-bolts polyline{ fill:none; stroke-linecap:round; stroke-linejoin:round; }
  .kh-bolts .g{ stroke:#b77cff; stroke-width:6; opacity:.7; }
  .kh-bolts .c{ stroke:#fff; stroke-width:1.8; }
  /* then dust: the black shape falls apart, its specks drifting up and away on the wind */
  .walk-ent.kh-alien.kh-dust .kh-fig{ animation:none; transition:opacity .9s ease-in, translate .9s ease-in, scale .9s ease-in; opacity:0; translate:0 -6px; scale:.92; }
  .walk-ent.kh-alien.kh-dust .kh-art{ filter:brightness(0) saturate(1) drop-shadow(0 0 2px rgba(60,40,80,.6)) drop-shadow(0 0 0 rgba(0,0,0,0)); }
  .kh-dustcloud{ position:absolute; width:0; height:0; pointer-events:none; }
  .kh-dustcloud i{ position:absolute; border-radius:50%; background:radial-gradient(circle at 40% 35%, #5a5262, #17141a 70%); opacity:0; animation:khDust 1.6s ease-out both; }
  .kh-dustcloud i:nth-child(3n){ background:radial-gradient(circle at 40% 35%, #8a7aa0, #3a2f48 70%); }   /* a little of his violet still in it */
  @keyframes khDust{ 0%{ opacity:.95; translate:0 0; scale:1; } 70%{ opacity:.55; } 100%{ opacity:0; translate:var(--dx) var(--dy); scale:.4; } }
  /* the King on his horse: casting, a violet blaze about him; spent, bowed forward, a shadow over his head */
  .walk-ent.kh-king .kh-art{ filter:brightness(1) saturate(1) drop-shadow(0 0 6px rgba(200,150,255,.55)) drop-shadow(0 3px 2px rgba(0,0,0,.35)); transition:filter .6s ease; }
  .walk-ent.kh-king.kh-cast .kh-art{ filter:brightness(1.08) saturate(1) drop-shadow(0 0 8px rgba(240,200,255,1)) drop-shadow(0 0 18px rgba(170,90,255,.95)); }
  .walk-ent.kh-king.kh-spent .kh-art{ filter:brightness(.72) saturate(.55) drop-shadow(0 0 6px rgba(20,0,35,.9)) drop-shadow(0 3px 2px rgba(0,0,0,.35)); }
  .walk-ent.kh-king .kh-fig{ transition:rotate .6s ease, translate .6s ease; }
  .walk-ent.kh-king.kh-spent .kh-fig{ rotate:-7deg; translate:0 3px; }
  .walk-ent.kh-king.kh-spent.face-r .kh-fig{ rotate:7deg; }
  .walk-ent.kh-king .kh-fig::before{ content:''; position:absolute; left:42%; bottom:calc(${WALK_T}px * 1.6); width:calc(${WALK_T}px * 1.25); height:calc(${WALK_T}px * .9);
    translate:-50% 0; border-radius:50%; pointer-events:none; opacity:0; transition:opacity .6s ease; z-index:2;
    background:radial-gradient(closest-side, rgba(8,4,14,.92), rgba(20,8,30,.7) 45%, rgba(20,8,30,0)); filter:blur(3px); }
  .walk-ent.kh-king.kh-spent .kh-fig::before{ opacity:1; animation:khGloom 2.4s ease-in-out infinite; }
  @keyframes khGloom{ 0%,100%{ scale:1; translate:-50% 0; } 50%{ scale:1.12 .92; translate:-50% -6%; } }
  /* his beam: violet, white at its heart, held — flickering with what it costs him */
  .kh-beam{ position:absolute; height:0; pointer-events:none; transform-origin:0 0; }
  .kh-beam i{ position:absolute; left:0; right:0; top:-10px; height:20px; border-radius:10px; transform-origin:0 50%;
    background:linear-gradient(to bottom, rgba(150,70,255,0), rgba(150,70,255,.75) 25%, rgba(214,170,255,.95) 45%, rgba(214,170,255,.95) 55%, rgba(150,70,255,.75) 75%, rgba(150,70,255,0));
    filter:blur(1.5px); animation:khBeamIn .18s ease-out both, khBeamFlick .11s steps(2) .18s infinite; }
  .kh-beam b{ position:absolute; left:0; right:0; top:-2.5px; height:5px; border-radius:3px; background:#fff; box-shadow:0 0 6px #fff, 0 0 16px #c58cff, 0 0 30px rgba(150,70,255,.8); transform-origin:0 50%; animation:khBeamIn .18s ease-out both; }
  .kh-beam em{ position:absolute; right:-22px; top:-22px; width:44px; height:44px; border-radius:50%;
    background:radial-gradient(circle, #fff 0 18%, rgba(214,170,255,.85) 40%, rgba(150,70,255,0) 70%); animation:khSplash .16s ease-in-out infinite alternate; }
  .kh-beam.out{ opacity:0; transition:opacity .28s ease-out; }
  @keyframes khBeamIn{ from{ scale:0 1; } to{ scale:1 1; } }
  @keyframes khBeamFlick{ 0%{ opacity:.85; scale:1 .8; } 100%{ opacity:1; scale:1 1.15; } }
  @keyframes khSplash{ from{ scale:.8; opacity:.8; } to{ scale:1.15; opacity:1; } }
  @media (prefers-reduced-motion: reduce){ .walk-ent.kh-folk .kh-fig, .walk-ent.kh-alien .kh-fig, .walk-ent.kh-alien.kh-zap .kh-fig, .kh-beam i, .kh-beam em, .walk-ent.kh-king.kh-spent .kh-fig::before{ animation:none; } }
  `;
  document.head.appendChild(s);
}
/* ---------- into the game ---------- */
/* the grounds drawn: the hunt, while it goes on (and stopped, anywhere else) */
if(typeof invRender === 'function'){
  const _khRender = invRender;
  invRender = function(key, world){ const r = _khRender.apply(this, arguments); if(key === CA_KEY) setTimeout(()=>{ if(ui.screen === CA_KEY) khStart(world); }, 60); else khStop(); return r; };
}
/* beside him: a word with him */
if(typeof caNearActs === 'function'){
  const _khNear = caNearActs;
  caNearActs = function(key, p){ const acts = _khNear.apply(this, arguments); const k = khKingNear(key, p); if(k) acts.push(k); return acts; };
}
/* he, and they, stand in your way: the aliens, and the fairies running from them */
if(typeof caWalkerAt === 'function'){
  const _khAt = caWalkerAt;
  caWalkerAt = function(key, x, y){
    if(_khAt.apply(this, arguments)) return true;
    const H = _kh;
    if(key !== CA_KEY || !H) return false;
    return !!(H.king && H.king.x === x && H.king.y === y) || H.pairs.some(q=> (khAlienUp(q.a) && q.a.x === x && q.a.y === y) || (q.state !== 'gone' && q.f.x === x && q.f.y === y));
  };
}

/* ============================================================
   (4.64) ON HIS BACK IN THE RIFT'S PERIMETER, WITH HIS GLARE AND HIS AMBUSH
   The designer, 2026-11-19: "please keep the player on lucesco when he enters. he isn't able to use glare or ambush right
   now while inside the perimeter." In at its gate on his back (as you ride the jungle: jgRiding), you stay on it inside
   (caRideOn, above; the deck's youArt), and his dial is under Party there (the deck's padMoves): Pulsar Glare and Rift
   Ambush on today's bands inside it (invPerimBands, 26-invasion.js), two squares any way, a direction held aiming them
   (jgAim) — as on the jungle's (20-jungle.js: jgGlare, jgAmbush), their looks and their sounds the same. His Glare's
   wait is the jungle's own (jgState().glareIn), counted down by your steps in here too. A band he has glared at, or
   pounced on, starts its fight weakened or stunned (invFight's `edge`, as jgEdgeApply has it). No wall to leap in here.
   ============================================================ */
const PERIM_KEY = 'r6_perimeter';
function perimFree(){ const w = walkState(); return ui.screen === PERIM_KEY && !w.busy && !ui.caTalk && !ui.invFighting && !ui.sceneRunning && !ui.jgFx && !document.querySelector('.scene-say'); }
/* today's bands within `reach` of p: nearest first, then the ones you face */
function perimInReach(p, reach){
  if(!p || typeof invPerimBands !== 'function') return [];
  const fx = walkState().faceX === 'r' ? 1 : -1;
  return invPerimBands().filter(b=> invBandUp(b) && !(b.x === p.x && b.y === p.y) && Math.max(Math.abs(b.x - p.x), Math.abs(b.y - p.y)) <= reach)
    .map(b=> ({ b, d:Math.hypot(b.x - p.x, b.y - p.y), ahead:Math.sign(b.x - p.x) === fx ? 0 : 1 })).sort((a, c)=> a.d - c.d || a.ahead - c.ahead).map(o=> o.b);
}
function perimGlareTarget(p, dir){ return jgAim(p, perimInReach(p, JG_GLARE.reach), dir, b=> !jgBandStunned(b)); }
function perimAmbushTarget(p, dir){ return jgAim(p, perimInReach(p, JG_AMBUSH.reach), dir, b=> jgBandStunned(b)); }
/* a band's figure on the deck (its thing's element: walk-ent) */
function perimBandEl(b){
  const d = DECKS[PERIM_KEY];
  const t = d && d.things.find(t=>{ try { return t.band === b; } catch(e){ return false; } });
  return (t && t.el && t.el.isConnected) ? t.el : null;
}
function perimPadState(p){
  const free = !!p && perimFree(), riding = caRideOn(PERIM_KEY), gn = jgGlareIn(), z = { ready:false, lit:false, sub:'', fill:0 };
  return {
    J:false, jump:z,
    glare:{ ready:!gn, lit:free && riding && !gn && !!perimGlareTarget(p), sub:gn ? jgSteps(gn) : '', fill:gn ? 1 - gn / JG_GLARE.steps : 0 },
    ambush:{ ready:true, lit:free && riding && !!perimAmbushTarget(p), sub:'', fill:0 },
    track:Object.assign({ on:false, what:'', pic:'' }, z),
    talk:{ lit:free },
  };
}
function perimPadPress(mv){
  const p = caYou();
  if(!p || !perimFree()) return;
  jgDialFlash(mv);
  if(mv === 'talk') return jgTell(`<b>"They're penned in here. Ride close, and I'll glare at them, or pounce."</b>`);
  if(mv === 'jump') return jgTell('No wall to leap in here: the palisade keeps them in.');
  if(mv === 'track') return jgTell('Every band in here is in plain sight.');
  if(!caRideOn(PERIM_KEY)) return jgTell('Lucesco needs you on his back for that.');
  const held = walkHeldDir();
  if(mv === 'glare'){
    const n = jgGlareIn();
    if(n) return jgTell(`Lucesco's eyes are still dim. ${jgSteps(n)} to go.`);
    const b = perimGlareTarget(p, held);
    if(!b) return jgTell('No alien close enough to glare at.');
    return perimGlare(b);
  }
  if(mv === 'ambush'){
    const b = perimAmbushTarget(p, held);
    if(!b) return jgTell('No alien close enough to pounce on.');
    return perimAmbush(b);
  }
}
/* his glare: the laser from his eyes, the band paralysed (its 5 s), his eyes' wait begun */
async function perimGlare(b){
  const w = walkState(), p = caYou(), me = $('#walkYou'), el = perimBandEl(b);
  if(!p || !me || !el || !perimFree()) return;
  w.busy = true; ui.jgFx = 'glare';
  (ui.jgBandEls || (ui.jgBandEls = {}))[b.id] = el;
  jgTell(`Lucesco uses <b>Pulsar Glare</b> on ${escapeHtml(jgBandName(b))}!`, 'glare');
  if(b.x !== p.x){ w.faceX = b.x > p.x ? 'r' : 'l'; faceRight(me, w.faceX === 'r'); }
  const j = jgState();
  j.glareIn = JG_GLARE.steps; j.glares = (j.glares || 0) + 1;
  b.zapUntil = Date.now() + JG_GLARE.ms;
  try { playSfx('timestop'); playSfx('pulsar'); } catch(e){}
  const beam = jgBeam(b);
  const eyes = me.querySelector('.jg-eyes');
  if(eyes){ eyes.classList.remove('on'); void eyes.offsetWidth; eyes.classList.add('on'); }
  jgZapStart(b, true);
  try { await new Promise(r=> setTimeout(r, JG_GLARE.beam)); }
  finally {
    if(beam){ beam.classList.add('out'); setTimeout(()=> beam.remove(), 220); }
    if(eyes) eyes.classList.remove('on');
    if(el.isConnected) jgZapStart(b, false);                              // the beam gone: twitching, for the rest of its 5 s
    ui.jgFx = null; w.busy = false; w.actSig = null;
    if(typeof jgSave === 'function') jgSave(false);
    if(ui.screen === PERIM_KEY) refreshWalk();
    clearTimeout(b._zapEndT);
    b._zapEndT = setTimeout(()=>{ jgZapEnd(b); if(ui.screen === PERIM_KEY){ walkState().actSig = null; refreshWalk(); } }, Math.max(0, b.zapUntil - Date.now()) + 40);
  }
}
/* his ambush: the two of you into starlight, across, a red flash on it as it falls flat — and the fight */
async function perimAmbush(b){
  const w = walkState(), p = caYou(), me = $('#walkYou'), world = $('#walkWorld'), el = perimBandEl(b);
  if(!p || !me || !world || !perimFree()) return;
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first. Rest by the tavern fire.'); return; }
  releaseKeys();
  w.busy = true; ui.jgFx = 'ambush';
  jgTell(`Lucesco uses <b>Rift Ambush</b> on ${escapeHtml(jgBandName(b))}!`, 'ambush');
  const glared = jgBandStunned(b), T = WALK_T, reduce = jgReduced();
  const from = jgDrawnAt(me) || { x:p.x * T, y:p.y * T }, to = { x:b.x * T, y:b.y * T - 0.34 * T };
  const at = q=> `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,0)`, wait = ms=> new Promise(r=> setTimeout(r, ms));
  if(b.x !== p.x){ w.faceX = b.x > p.x ? 'r' : 'l'; faceRight(me, w.faceX === 'r'); }
  me.style.transition = 'none'; me.style.transform = at(from); me.style.zIndex = 12 + Math.max(p.y, b.y);
  const fx = [];
  try {
    playSfx('ambush');
    me.classList.add('jg-starry', 'jg-swirl');
    await wait(reduce ? 120 : JG_AMBUSH.dark);
    b._pounced = true;
    if(el){ el.classList.remove('jg-zap', 'jg-stun'); clearTimeout(b._boltT); const svg = el.querySelector('.jg-bolts'); if(svg) svg.remove(); el.classList.add('jg-pounced'); }
    if(typeof me.animate === 'function' && !reduce){
      const a = me.animate([{ transform:at(from), opacity:1 }, { transform:at(to), opacity:0.2 }], { duration:JG_AMBUSH.fly + JG_AMBUSH.fadeIn, easing:'cubic-bezier(.55,0,.85,.45)', fill:'forwards' });
      await a.finished.catch(()=>{});
    }
    me.getAnimations().forEach(a=> a.cancel());
    me.style.opacity = ''; me.style.transform = at(to);
    me.classList.remove('jg-starry', 'jg-swirl');
    const cx = to.x + 0.5 * T, cy = to.y + 0.342 * T, z = (parseInt(me.style.zIndex, 10) || 12) - 1;
    const ring = (cls, size)=>{ const e = document.createElement('i'); e.className = cls;
      e.style.cssText = `left:${(cx - size / 2).toFixed(1)}px;top:${(cy - size / 2).toFixed(1)}px;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;z-index:${z}`;
      world.appendChild(e); fx.push(e); };
    ring('jg-pulse', 2.7 * T);
    if(!reduce) ring('jg-wave', 1.2 * T);
    stopSfx('ambush', 60);
    playSfx('hit_dealt');
    await wait(reduce ? 200 : JG_AMBUSH.after);
  } catch(e){}
  fx.forEach(e=> setTimeout(()=> e.remove(), 900));
  stopSfx('ambush', 60);
  me.classList.remove('jg-starry', 'jg-swirl');
  ui.jgFx = null; w.busy = false;
  b._pounced = false;
  invFight(b, { ambush:true, glare:glared });
  /* it did not begin (the team down, a scene): back where you leapt from */
  if(!ui.invFighting && !ui.battle && ui.screen === PERIM_KEY){ me.style.transform = at(from); if(el) el.classList.remove('jg-pounced'); w.actSig = null; refreshWalk(); }
}
function perimCss(){
  if(document.getElementById('perimCss')) return;
  const s = document.createElement('style');
  s.id = 'perimCss';
  s.textContent = `
  .walk-ent.inv-band.jg-zap .war-fig .jg-art{ filter:brightness(0) drop-shadow(0 0 2px #ff3a3a) drop-shadow(0 0 8px rgba(255,0,0,.95)) !important; }
  .walk-ent.inv-band.jg-stun:not(.jg-zap) .war-fig .jg-art{ filter:drop-shadow(0 0 3px #000) drop-shadow(0 0 9px rgba(255,30,30,.95)) !important; animation:perimTwitch .14s steps(2) infinite; }
  @keyframes perimTwitch{ from{ translate:-1.5px 0; } to{ translate:1.5px 0; } }
  .walk-ent.inv-band .jg-bolts{ position:absolute; left:-40%; top:-60%; width:180%; height:180%; overflow:visible; pointer-events:none; z-index:3; }
  .walk-ent.inv-band.jg-zap .jg-bolts .g{ stroke-width:6; opacity:.75; }
  .walk-ent.inv-band.jg-zap .jg-bolts .c{ stroke:#fff; stroke-width:1.8; }
  .walk-ent.inv-band.jg-pounced .war-fig{ transform-origin:50% 92%; rotate:84deg; translate:0 12%; transition:rotate .18s ease-in; }
  @media (prefers-reduced-motion: reduce){ .walk-ent.inv-band.jg-stun:not(.jg-zap) .war-fig .jg-art{ animation:none; } }
  `;
  document.head.appendChild(s);
}
/* into the game: his ride and his dial on the perimeter's deck; his dial's state and presses there; your steps there
   counting his eyes' wait down */
(function perimHooks(){
  const d = typeof DECKS !== 'undefined' && DECKS[PERIM_KEY];
  if(d && typeof jgRideArt === 'function'){
    const base = d.youArt;
    d.youArt = function(dd){
      if(caRideOn(PERIM_KEY)){ if(typeof jgCss === 'function') jgCss(); perimCss(); return jgRideArt(); }
      return base ? base.apply(this, arguments) : null;
    };
    d.padMoves = { dial:true, html:()=>{ if(typeof jgCss === 'function') jgCss(); perimCss(); return jgPadHtml(); }, wire:(box)=> jgPadWire(box), refresh:(box, dd, p)=> jgPadRefresh(box, p) };
  }
  if(typeof jgPadState === 'function'){
    const _ps = jgPadState;
    jgPadState = function(p){ if(ui.screen === PERIM_KEY) return perimPadState(p); return _ps.apply(this, arguments); };
  }
  if(typeof jgPadPress === 'function'){
    const _pp = jgPadPress;
    jgPadPress = function(mv){ if(ui.screen === PERIM_KEY) return perimPadPress(mv); return _pp.apply(this, arguments); };
  }
  if(typeof caStep === 'function'){
    const _cs = caStep;
    caStep = function(key, p){
      if(key === PERIM_KEY){ const j = jgState(); if(j.glareIn > 0){ j.glareIn = Math.min(JG_GLARE.steps, j.glareIn) - 1; walkState().actSig = null; } }
      return _cs.apply(this, arguments);
    };
  }
})();
