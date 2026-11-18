/* ============================================================
   42-the-hunt.js — THE HUNT FOR WADJET (4.58)
   The designer, 2026-11-17: "11. Lucesco appears outside the castle with the player on his back. He says trust the
   fairies, focus on hunting Wadjet now he has the scent. He tells the player to hurry, 3 minutes, don't get caught up
   fighting aliens. A timer starts. Glare freezes aliens, ambush stuns but doesn't start a fight, removes the collision
   of aliens so they can be run over. If the timer fails or caught by an alien, restart with 4 phrases from the castle.
   Difficulty intended."
   After the stand at the palace doors (41-the-stand.js): out of the castle's south gate on Lucesco's back, his nose on
   Wadjet's trail — north, round the castle and up through the jungle to its northern edge (about 240 steps, five a
   second at a run: three minutes leaves room, not much). The clock runs only while you could be moving: not while
   anyone talks, the map or the menu is open, the screen wipes, the app is away. Seen by an alien is caught: it comes,
   and pins you. Caught, or out of time: four phrases to pick up his trail again (as a floor's guards' ten in the
   catacombs, 14-stealth.js: one written wrong practised until right three times running), and from the gate again,
   three minutes more. Pulsar Glare as ever (frozen 5 s, blind while it lasts); Rift Ambush pounces and leaves it
   lying stunned, no fight — and while it lies there you can ride straight over it. Nothing else to stop for: not
   the castle's gate, the portal home, the villages' doors, a challenge. Lucesco's Track points at the rift.
   At the edge: Wadjet, the rift opening behind him. (Asked nothing of it — the reading taken: his fight, the 4.31 one,
   moved here from the fountain, since the new order has no place for it there.) Outlast him and he slips through,
   and the rest is as it was: Lucesco after him, the army out of the rift, the Commander's soldiers, the perimeter.
   Lost: Lucesco drags you clear; he holds the rift open, waiting, till you are back.
   ============================================================ */
const HUNT = { ms:180000, phrases:4, ambushMs:6000, calmMs:7000, calmNear:14, near:{ dx:14, y:24 } };

/* ---------- where the story stands ---------- */
/* the hunt is on: after the stand, out of the castle — not at the rift yet */
function huntDue(){
  if(typeof invOn !== 'function' || !invOn() || !invNew() || !invAt('chase')) return false;
  const v = invState();
  return !!v.said.stood && !v.said.hunted;
}
function huntOn(){ return !!(ui.hunt && ui.hunt.running); }
function huntNear(p){ const N = invNorth(); return !!p && Math.abs(p.x - N.x) <= HUNT.near.dx && p.y <= HUNT.near.y; }

/* ============================================================
   OUT OF THE GATE (the stand's end: standAfter)
   ============================================================ */
async function huntStart(){
  ui.huntIntro = true;
  await sceneCurtain(true, 700);
  await sceneCurtainText(`Lucesco bounds out through the castle's south gate, the tribes' horns still sounding behind you…`, 900);
  await sceneWait(1800);
  await sceneCurtainText('', 400);                                       // (gone before the jungle draws in under it)
  ['king', 'prin', 'adv', 'dau', 'cmd', 'wadjet'].forEach(id=> sceneActorGone(id));
  document.querySelectorAll('#walkWorld .scene-actor').forEach(e=> e.remove());
  invPlaceJungle(invArriveAt().you);
  ui.sceneRunning = false;
  goDeck(JG_KEY);
  setTimeout(()=>{ if(ui.screen !== JG_KEY) invCurtainUp(); }, 4000);
}
/* the jungle drawn while it is due: Lucesco's words the first time; from the gate (a fresh three minutes) after */
function huntDueJg(){
  if(!huntDue() || huntOn() || ui.huntFailing) return false;
  const p = walkState().at && walkState().at[JG_KEY];
  if(huntNear(p)){ huntWon(); return true; }
  if(ui.huntIntro){ ui.huntIntro = false; invJgScene(()=> huntIntroRun(), { ride:true }); return true; }
  /* (left part-way: the app closed, the jungle left) back at the gate, and off again */
  const A = invArriveAt();
  if(!p || p.x !== A.you.x || p.y !== A.you.y){ invPlaceJungle(A.you); goDeck(JG_KEY); return true; }
  invJgScene(async ()=>{
    await invCurtainUp();
    await L([['lion', `<b>"Wadjet's trail — from the gate, north. Three minutes, before it goes cold. GO!"</b>`]]);
    huntGo();
  }, { ride:true });
  return true;
}
async function huntIntroRun(){
  const A = invArriveAt();
  await invCurtainUp();
  await sceneLook({ x:A.you.x - 4, y:A.you.y - 6, w:9, h:9 }, { ms:700 });
  await L([['lion', `Lucesco skids to a halt outside the gate and looks back once, at the smoke over the walls. Then he turns away.`],
           ['lion', `<b>"The fairies will hold. Trust them — the tribes are with them now. We have one job."</b>`],
           ['lion', `Wadjet's trail is a cold, coiling thread on the air, running north. Lucesco lowers his head.<br><br><b>"I've got his scent. Three minutes, and it's gone — hurry!"</b>`],
           ['lion', `<b>"And don't get caught up fighting aliens! If one sees us, it's over. Glare to freeze them. Ambush to knock one flat, and run right over it!"</b>`]]);
  await sceneCamFree(400);
  huntGo();
}

/* ============================================================
   THE CLOCK
   ============================================================ */
function huntGo(){
  huntStop();
  const q = questState(); q.track = 'rift'; saveProfile();
  ui.hunt = { running:true, left:HUNT.ms, last:performance.now(), iv:null };
  huntCalm();
  huntHud();
  ui.hunt.iv = setInterval(huntTick, 250);
  if(typeof questPulseUpdate === 'function') questPulseUpdate();
  if(typeof jgTell === 'function') jgTell('Three minutes — <b>north</b>, after Wadjet!', 'glare');
}
function huntStop(){
  if(ui.hunt){ clearInterval(ui.hunt.iv); ui.hunt.running = false; }
  const h = document.getElementById('huntClock'); if(h) h.remove();
}
/* the bands round the gate let you get going (they come round soon enough) */
function huntCalm(){
  const A = invArriveAt(), t = Date.now() + HUNT.calmMs;
  jgBands().forEach(b=>{ if(Math.abs(b.x - A.you.x) <= HUNT.calmNear && Math.abs(b.y - A.you.y) <= HUNT.calmNear) b.calm = Math.max(b.calm || 0, t); });
}
function huntPaused(){
  return ui.screen !== JG_KEY || !!(ui.sceneRunning || ui.jgTalk || ui.jgAlert || ui.unBusy || document.querySelector('.scene-say') || document.querySelector('.jg-map-ov') ||
    document.getElementById('sceneCurtain') && getComputedStyle(document.getElementById('sceneCurtain')).opacity > 0.5 ||
    (typeof eyeBreakActive === 'function' && eyeBreakActive()));
}
function huntTick(){
  const H = ui.hunt;
  if(!H || !H.running) return;
  const now = performance.now(), dt = Math.min(1000, now - H.last);
  H.last = now;
  if(huntPaused()) return;
  H.left = Math.max(0, H.left - dt / Math.max(0.02, typeof SCENE_SPEED === 'number' && SCENE_SPEED < 1 ? SCENE_SPEED : 1));
  huntHud();
  if(H.left <= 0) huntFail('time');
}
const HUNT_CLOCK = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="13.5" r="8.2" fill="#fff8ea" stroke="currentColor" stroke-width="2"/><path d="M12 13.5 V8.6 M12 13.5 L15.4 15.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><rect x="9.6" y="1.8" width="4.8" height="2.6" rx="1.1" fill="currentColor"/><path d="M18.6 5.6 L20.2 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
function huntHud(){
  huntCss();
  const stage = $('#walkStage');
  if(!stage || !ui.hunt) return null;
  let hud = document.getElementById('huntClock');
  if(!hud){ hud = document.createElement('div'); hud.id = 'huntClock'; hud.className = 'hunt-clock'; hud.setAttribute('role', 'timer'); stage.appendChild(hud); }
  const s = Math.ceil(ui.hunt.left / 1000);
  const txt = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  if(hud.dataset.t !== txt){ hud.dataset.t = txt; hud.innerHTML = `${HUNT_CLOCK}<b>${txt}</b>`; hud.setAttribute('aria-label', `${txt} left to catch Wadjet`); }
  hud.classList.toggle('low', s <= 30);
  hud.classList.toggle('crit', s <= 10);
  return hud;
}

/* ============================================================
   CAUGHT, OR TOO SLOW: four phrases, and from the gate again
   ============================================================ */
async function huntFail(why, b){
  if(ui.huntFailing) return;
  ui.huntFailing = true;
  huntStop();
  const w = walkState();
  w.busy = true; releaseKeys();
  try {
    if(typeof jgHold === 'function') jgHold(false);
    if(why === 'time'){
      await jgLines([riftLucescoFace()], 'Lucesco', [`Lucesco stops dead and lifts his nose — and lifts it again.<br><br><b>"…It's gone. His scent's gone cold. We were too slow."</b>`]);
    } else {
      playSfx('alert');
      sceneShake(400, ms=> 0.06 * (1 - ms / 400));
      const nm = b ? jgBandName(b) : 'An alien';
      await jgLines([riftLucescoFace()], 'Lucesco', [`${escapeHtml(nm)} slams into Lucesco's side and pins him to the ground. More of them come crashing out of the trees.<br><br><b>"Grr— they've got us! Hold on!"</b>`]);
      if(b) b.calm = Date.now() + 12000;
    }
    await sceneCurtain(true, 600);
    const back = ()=> new Promise(res=>{
      const again = ()=>{ invPlaceJungle(invArriveAt().you); res(); };
      if(typeof activePool !== 'function' || !activePool().length) return again();
      sceneCurtain(false, 500);
      huntPhrases(HUNT.phrases, ()=> storyModal(jgMonImg('lucesco_front', 140), 'Lucesco',
        (why === 'time' ? `<b>"Back to the castle gate — his trail starts there. Faster this time!"</b>` : `<b>"We slipped them — just. Back to the gate, and after him again. Don't let them see us!"</b>`) +
        `<br><br><i>Three minutes more. Glare to freeze them; Ambush to knock one flat and ride over it.</i>`, ()=> again(), { subtitle:"Wadjet's trail" }));
    });
    const v = invState(); v.huntTries = (v.huntTries || 0) + 1; saveProfile();
    await back();
  } finally {
    ui.huntFailing = false;
    w.busy = false;
  }
  goDeck(JG_KEY);
  setTimeout(()=>{ if(ui.screen === JG_KEY) invCurtainUp(); }, 600);
}
/* the phrases: as the catacombs' (14-stealth.js's captureTest) — recently missed first, then the rest; one written
   wrong is practised until right three times running, and counts as one */
function huntPhrases(n, done){
  const pool = activePool().map(w=> w.text);
  const inPool = new Set(pool);
  const recent = (state.recentWrong || []).filter(w=> inPool.has(w));
  const queue = [];
  [...recent, ...shuffle(pool)].forEach(w=>{ if(queue.length < n && !queue.includes(w)) queue.push(w); });
  while(queue.length < n && pool.length) queue.push(pool[Math.floor(Math.random() * pool.length)]);
  let k = 0, streak = -1;
  const step = ()=>{
    if(k >= queue.length){ ui.captureTest = null; return done(); }
    const left = 3 - streak;
    ui.captureTest = { k, of:queue.length, word:queue[k], practising:streak >= 0, streak:Math.max(0, streak) };
    startQuiz({
      title:"Wadjet's trail",
      subtitle: streak >= 0
        ? `Practice: get this right ${left} more time${left === 1 ? '' : 's'} in a row. It counts as one phrase. (${k} of ${queue.length} done)`
        : `Write ${queue.length} phrases to pick up his trail again. (${k} of ${queue.length} done)`,
      words:[queue[k]], lockExit:true,
      onComplete:(res)=>{
        const passed = !!(res && res[0] && res[0].passed);
        if(streak >= 0){ if(!passed) streak = 0; else if(++streak >= 3){ k++; streak = -1; } }
        else if(passed) k++;
        else streak = 0;
        step();
      },
      onExit:()=>{},
    });
  };
  step();
}

/* ============================================================
   AMBUSH, IN THE HUNT: knocked flat, no fight — ridden over
   ============================================================ */
function huntPounce(b){
  const w = walkState(), me = $('#walkYou');
  b.zapUntil = Date.now() + HUNT.ambushMs;                              // (stunned: it neither moves nor sees)
  b.ghost = true;
  w.at[JG_KEY] = { x:b.x, y:b.y }; jgState().at = { x:b.x, y:b.y };
  if(me){ me.style.transition = ''; me.style.zIndex = ''; }
  w.busy = false;
  w.actSig = null;
  refreshWalk();
  if(typeof jgTell === 'function') jgTell(`${escapeHtml(jgBandName(b))} is down — ride over it!`, 'ambush');
  clearTimeout(b._huntT);
  b._huntT = setTimeout(()=> huntUnpounce(b), HUNT.ambushMs);
  return true;                                                          // (it lies where it fell: jgAmbush leaves it so)
}
function huntUnpounce(b){
  b._pounced = false;
  const el = ui.jgBandEls && ui.jgBandEls[b.id];
  if(el) el.classList.remove('jg-pounced');
  /* still under you: it stays something you can ride off, till you have */
  const p = walkState().at && walkState().at[JG_KEY];
  if(!(p && p.x === b.x && p.y === b.y)) b.ghost = false;
  if(ui.screen === JG_KEY){ jgBandPlace(b); refreshWalk(); }
}

/* ============================================================
   AT THE EDGE (4.59): the designer — "When he is spotted at the edge of the player's screen near the rift, Lucesco will
   cry 'Hang on tight, we're tearing through spacetime. Use my rift ambush!' The player will press a more brightly
   glowing rift ambush that ports Lucesco through directly onto Wadjet and knocks him down, and Lucesco snarls, 'It's
   over, Nemesis!' Then, the player presses glare and burns away nemesis. Then, laughter and the shaking screen, with a
   voice which 'Do you never learn? Death itself bows to me.' And Nemesis bursts back up from under Lucesco with a black
   red-purple explosion (make this his standard aoe attack within the battle fx), blowing both Lucesco's sprite and the
   player's sprite, now separated, apart in different directions. Whalelord and Monkey King appear next to the fallen
   player, saying, 'get up! the fight starts.'"
   He waits at the jungle's edge all through the hunt, the rift opening behind him (huntJungleDraw); the moment any of
   him is on the screen (huntSees), the clock stops and it begins.
   ============================================================ */
/* his figure on the screen: any of it (he stands on row 3, two squares tall) */
function huntSees(p){
  const N = invNorth(), v = typeof sceneCamView === 'function' ? sceneCamView() : null;
  if(!p || !v) return huntNear(p);
  const x0 = N.x - 0.5, x1 = N.x + 1.5, y0 = 3 + 1 - 2.2, y1 = 4;
  return x1 > v.x0 + 0.1 && x0 < v.x1 - 0.1 && y1 > v.y0 + 0.15 && y0 < v.y1 - 0.15;
}
function huntWon(){
  huntStop();
  const v = invState();
  v.said.hunted = true; saveProfile();
  return invJgScene(()=> huntRiftRun(), { ride:true });
}
async function huntRiftRun(){
  const N = invNorth(), w = walkState(), world = $('#walkWorld');
  const p = w.at[JG_KEY];
  stCss(); duelCss();
  document.querySelectorAll('.hunt-wadjet').forEach(e=> e.remove());
  invActor('wadjet', WADJET, N.x, 3, 2.2);
  if(!document.getElementById('invRiftJg')) invRiftEl(world, N.rift.x, N.rift.y + 0.9, INV_RIFT_JG_SIZE, 'invRiftJg', '');
  await sceneLook([{ x:p.x - 1, y:p.y - 1, w:3, h:3 }, { x:N.x - 2, y:0, w:5, h:5 }], { ms:700 });
  await L([`There he is — coiled at the very edge of the jungle, the rift tearing open behind him, slowly — too slowly for him.`,
           ['lion', `<b>"Hang on tight — we're tearing through spacetime. Use my Rift Ambush!"</b>`]]);
  if(await huntWant('ambush', `Tap <b>Ambush</b>!`) === 'abort') throw INV_ABORT;
  await huntPortLeap({ x:N.x, y:3 });
  await L([['lion', `Lucesco pins him to the ground and snarls into his face.<br><br><b>"It's over, Nemesis!"</b>`]]);
  if(await huntWant('glare', `Tap <b>Glare</b>!`) === 'abort') throw INV_ABORT;
  await huntBurnAway();
  await huntLaugh();
  const fell = await huntBurst();
  await huntCompanions(fell);
  invSay('riftWadjet');
  ui.sceneRunning = false;
  /* (4.60) the designer: "the player, however, incorrectly gets up on lucesco instead of as just the player sprite.
     lucesco has been separated by the knockback." On your own feet into his fight — not back on his back as the scene
     ends (invJgScene) — and he still where the burst threw him */
  ui.jgAfootHold = true;
  huntWadjetBattle();
}
/* the one move he wants (`mv`): only it lit, brighter than bright, a word along the bottom; nothing else answers */
function huntWant(mv, hint){
  return new Promise(res=>{
    const H = ui.huntPort = { want:mv, res };
    document.body.classList.add('hunt-want-' + mv);
    if(typeof stTapHint === 'function') stTapHint(hint);
    walkState().busy = true;
    refreshWalk();
    H.iv = setInterval(()=>{ if(ui.screen !== JG_KEY) huntWantDone('abort'); }, 300);
  });
}
function huntWantDone(result){
  const H = ui.huntPort;
  if(!H) return;
  ui.huntPort = null;
  clearInterval(H.iv);
  document.body.classList.remove('hunt-want-ambush', 'hunt-want-glare');
  if(typeof stTapHint === 'function') stTapHint(null);
  if(ui.screen === JG_KEY) refreshWalk();
  H.res(result || true);
}
/* Rift Ambush, through spacetime: as his own (20-jungle.js's jgAmbush) — starlight, the flight, the silhouette fading in
   on its square, the red pulse — however far it is; and Wadjet under you, knocked flat */
async function huntPortLeap(t){
  const w = walkState(), p = w.at[JG_KEY], world = $('#walkWorld'), me = $('#walkYou');
  if(!p || !me || !world) return;
  const T = WALK_T, from = (typeof jgDrawnAt === 'function' && jgDrawnAt(me)) || { x:p.x * T, y:p.y * T }, to = { x:t.x * T, y:t.y * T - 0.34 * T };
  const at = q=> `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,0)`;
  if(typeof jgTell === 'function') jgTell(`Lucesco uses <b>Rift Ambush</b> on Wadjet!`, 'ambush');
  if(t.x !== p.x){ w.faceX = t.x > p.x ? 'r' : 'l'; faceRight(me, w.faceX === 'r'); }
  me.style.transition = 'none'; me.style.transform = at(from); me.style.zIndex = 14 + Math.max(p.y, t.y);
  try { playSfx('ambush'); } catch(e){}
  me.classList.add('jg-starry', 'jg-swirl');
  await sceneWait(JG_AMBUSH.dark + 200);
  const ghost = me.cloneNode(true);
  ghost.removeAttribute('id'); ghost.classList.add('jg-ghost');
  ghost.style.transition = 'none'; ghost.style.transform = at(to); ghost.style.opacity = '0';
  world.appendChild(ghost);
  const FLY = JG_AMBUSH.fly * 2.2, IN = JG_AMBUSH.fadeIn * 1.6;
  if(typeof me.animate === 'function'){
    const mid = { x:from.x + (to.x - from.x) * 0.55, y:from.y + (to.y - from.y) * 0.55 - T };
    me.animate([{ transform:at(from), opacity:1 }, { transform:at(mid), opacity:0.7, offset:0.5 }, { transform:at(to), opacity:0 }], { duration:FLY * SCENE_SPEED, easing:'cubic-bezier(.55,0,.85,.45)', fill:'forwards' });
    const arrive = ghost.animate([{ opacity:0 }, { opacity:1 }], { duration:IN * SCENE_SPEED, easing:'cubic-bezier(.3,0,.6,1)', fill:'forwards' });
    await arrive.finished.catch(()=>{});
  } else { ghost.style.opacity = '1'; await sceneWait(80); }
  me.getAnimations().forEach(a=> a.cancel());
  me.style.opacity = ''; me.style.transform = at(to);
  me.classList.remove('jg-starry', 'jg-swirl');
  ghost.remove();
  /* the red pulse, a slow purple shockwave — and he is down */
  const cx = to.x + 0.5 * T, cy = to.y + 0.342 * T;
  [['jg-pulse', 2.7], ['jg-wave', 1.2]].forEach(([cls, sz])=>{ const e = document.createElement('i'); e.className = cls;
    e.style.cssText = `left:${(cx - sz * T / 2).toFixed(1)}px;top:${(cy - sz * T / 2).toFixed(1)}px;width:${(sz * T).toFixed(1)}px;height:${(sz * T).toFixed(1)}px;z-index:${14 + t.y}`;
    world.appendChild(e); setTimeout(()=> e.remove(), 1400); });
  try { stopSfx('ambush', 60); playSfx('hit_dealt'); } catch(e){}
  sceneActor('wadjet', { faint:1 });
  const we = document.getElementById('sa-wadjet'); if(we) we.classList.add('inv-hurt');
  sceneShake(500, ms=> 0.1 * (1 - ms / 500));
  w.at[JG_KEY] = { x:t.x, y:t.y }; jgState().at = { x:t.x, y:t.y };
  await sceneWait(JG_AMBUSH.after);
}
/* his glare, down into him: he fries, as an alien does — and burns away to nothing */
async function huntBurnAway(){
  const me = $('#walkYou'), we = document.getElementById('sa-wadjet');
  if(typeof jgTell === 'function') jgTell(`Lucesco uses <b>Pulsar Glare</b> on Wadjet!`, 'glare');
  try { playSfx('timestop'); playSfx('pulsar'); } catch(e){}
  const eyes = me && me.querySelector('.jg-eyes');
  if(eyes){ eyes.classList.remove('on'); void eyes.offsetWidth; eyes.classList.add('on', 'st-hold'); }
  const E = stEyes(), o = we && we._o;
  const beam = (E && o) ? stBeam('jg-beam st-lbeam', E.x, E.y, o.x + o.w / 2, o.y + o.h * 0.62, '<i></i><b></b><em></em>') : null;
  const f = { id:'wadjet', state:'zap' };
  if(we){ we.classList.add('st-zap'); stBolts(f, we); }
  await sceneShake(1100, ms=> 0.04 + 0.03 * Math.sin(ms / 50));
  if(beam){ beam.classList.add('out'); setTimeout(()=> beam.remove(), 220); }
  if(eyes) eyes.classList.remove('on', 'st-hold');
  f.state = 'gone';
  if(we){ we.classList.remove('st-zap'); stDust(f, we); }
  await sceneWait(1500);
  sceneActorGone('wadjet');
}
/* laughter, the ground shaking — and the voice */
async function huntLaugh(){
  let shaking = true;
  (async ()=>{ while(shaking && ui.screen === JG_KEY){ await sceneShake(700, ms=> 0.035 + 0.02 * Math.sin(ms / 80)); } })();
  try {
    await sceneWait(500);
    await L([`Silence — and then laughter. Low and cold, coming from everywhere and nowhere at once. The ground begins to shake.`,
             ['voice', `<b>"Do you never learn? Death itself bows to me."</b>`]]);
  } finally { shaking = false; }
}
/* up from under you, in a black and purple-red blast: you off his back and thrown one way, he the other */
/* a square near (x, y) that isn't a tree */
function huntFree(x, y){ for(const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]]) if(!jgSolidAt(x + dx, y + dy)) return { x:x + dx, y:y + dy }; return { x, y }; }
/* where the burst throws you, and him; (4.60) where you stand after his fight, and where Lucesco still lies */
const huntKnockYou = ()=>{ const N = invNorth(); return huntFree(N.x - 3, 6); };
const huntKnockLion = ()=>{ const N = invNorth(); return huntFree(N.x + 3, 6); };
const huntAfterYou = ()=>{ const N = invNorth(); return huntFree(N.x - 3, N.stand.y); };
async function huntBurst(){
  const N = invNorth(), w = walkState(), me = $('#walkYou'), T = WALK_T, c = { x:N.x, y:3 };
  const youTo = huntKnockYou(), lionTo = huntKnockLion();
  try { playSfx('core_blast'); playSfx('hit_taken'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  stBlast(c.x + 0.5, c.y + 0.3, 6, 'huge');
  sceneShake(1300, ms=> 0.3 * (1 - ms / 1300));
  /* the two of you, apart */
  invAfoot(true);
  invActor('lion', 'lucesco', c.x, c.y, 1.45);
  /* he, up out of it */
  invActor('wadjet', WADJET, c.x, c.y, 2.2);
  const we = document.getElementById('sa-wadjet'); if(we){ we.classList.add('st-rewind'); setTimeout(()=> we.classList.remove('st-rewind'), 700); }
  const tr = q=> `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,0)`;
  const a = { x:c.x * T, y:c.y * T }, b = { x:youTo.x * T, y:youTo.y * T }, m = { x:(a.x + b.x) / 2, y:Math.min(a.y, b.y) - 2 * T };
  w.at[JG_KEY] = { x:c.x, y:c.y }; refreshWalk();
  me.style.transition = 'none';
  const fly = typeof me.animate === 'function'
    ? me.animate([{ transform:tr(a) + ' rotate(0deg)' }, { transform:tr(m) + ' rotate(-190deg)', offset:0.5 }, { transform:tr(b) + ' rotate(-360deg)' }], { duration:750 * SCENE_SPEED, easing:'cubic-bezier(.25,.6,.45,1)' }).finished.catch(()=>{})
    : sceneWait(750);
  await Promise.all([fly, invHopTo('lion', lionTo.x, lionTo.y, 1.8, 750)]);
  w.at[JG_KEY] = { x:youTo.x, y:youTo.y }; jgState().at = { x:youTo.x, y:youTo.y }; w.faceX = 'r';
  refreshWalk();
  sceneFaintPlayer(1);
  sceneActor('lion', { faint:-1 });
  const le = document.getElementById('sa-lion'); if(le) le.classList.add('inv-hurt');
  sceneShake(400, ms=> 0.08 * (1 - ms / 400));
  await sceneWait(900);
  return youTo;
}
/* the Monkey King and the Whalelord, at your side: "Get up!" */
/* (4.60) the designer: "crowned monkey king and whalelord … (they're always crowned at this point in the story)" */
function huntWhaleSprite(){ return 'whalelord_c'; }
async function huntCompanions(at){
  invActor('mk', 'monkey_king_c', at.x - 1.2, at.y, 1.7);
  invActor('wl', huntWhaleSprite(), at.x + 1.3, at.y + 0.2, 2.2, { flip:true });
  ['mk', 'wl'].forEach(id=>{ const e = document.getElementById('sa-' + id); if(e) e.style.opacity = '0'; });
  sceneGlow('huntPals', at.x + 0.5, at.y + 0.3, 4);
  try { playSfx('power_up'); } catch(e){}
  await Promise.all([invActorIn('mk', 400), invActorIn('wl', 400)]);
  await sceneGlowOut(['huntPals'], 400);
  await L([['cuain', `The ghost of a great whale rises over you, and the Monkey King lands beside you in a crouch, his staff spinning.<br><br><b>"Get up!"</b>`],
           ['mk', `<b>"Get up — the fight starts now!"</b>`]]);
  sceneFaintPlayer(0);
  await sceneWait(300);
}
function huntWadjetBattle(){
  if(!battleParty().some(m=> m.currentHp > 0)){ huntAfootDone(); toast('Your team needs healing first.'); return go('region'); }
  nemBeginBattle({ bg:'battle_jungle', onWin:()=> huntWadjetWon(), onLose:()=> huntWadjetLost() });
}
/* on his back again from here on (off the jungle, only the flag: the jungle draws you so next time) */
function huntAfootDone(){ ui.jgAfootHold = false; if(typeof invAfoot === 'function') invAfoot(false); }
async function huntWadjetWon(){
  const v = invState();
  v.won.wadjet = true; saveProfile();
  huntAfootDone();
  invPlaceJungle(huntAfterYou());
  /* into the dark, and the jungle drawn under it with its scene already set (Wadjet, the rift, the two beside you):
     huntAfterRun lifts it — no bare jungle for a moment first. (If no scene comes, it lifts by itself.) */
  const c = sceneCurtainEl();
  await sceneCurtain(true, 450);
  ui.huntAfter = true;
  goDeck(JG_KEY);
  setTimeout(()=>{ if(document.getElementById('sceneCurtain') === c && !ui.sceneRunning) invCurtainUp(); }, 4000);
}
function huntWadjetLost(){
  huntAfootDone();
  return new Promise(res=>{
    storyModal(jgMonImg('lucesco_front', 140), 'Lucesco',
      `Wadjet's laughter rings through the mist as your last monster falls. Lucesco snatches you up by the collar and bolts for the trees.<br><br><b>"He can't leave the rift yet — he's holding it open. Heal up, and we'll go straight back for him!"</b>` +
      `<br><br><i>Wadjet is waiting at the jungle's north edge. Lucesco knows the way.</i>`,
      ()=>{ res(); const N = invNorth(); invPlaceJungle({ x:N.stand.x, y:N.stand.y + 6 }); go('region'); }, { subtitle:'The jungle\'s northern edge' });
  });
}
/* ============================================================
   (4.59) WON: the designer — "At the end, when the player beats Wadjet, Wadjet says, 'Defiant fool! if only I were
   complete, you would have been crushed.' He pulses once more but it is blocked by the monkey king and whalelord who have
   white round aura shields, pushing them and the player sprite 2 tiles backwards, then he zips into the rift. Lucesco
   tries to go after him on his own but is thrown back out as aliens jump out of the rift. More and more pour out, and
   Lucesco tells the player to run while he holds them back but Then the army commander catches up (no more post wadjet
   fight, wadjet's is the last), and tells his soldiers to fight the aliens. He tells Lucesco to leave the aliens to them.
   Then; the epilogue of the story is just like it was before."
   ============================================================ */
async function huntAfterRun(){
  const N = invNorth(), w = walkState(), world = $('#walkWorld');
  /* (4.60) all of it set in the dark (down already, straight out of his fight; after a break, drawn now): you where a
     push of two squares ends at the trees' edge; Lucesco still lying where the burst threw him */
  if(!document.getElementById('sceneCurtain')) await sceneCurtain(true, 350);
  const you = huntAfterYou(), down = huntKnockLion();
  w.at[JG_KEY] = { x:you.x, y:you.y }; jgState().at = { x:you.x, y:you.y }; refreshWalk();
  stCss(); duelCss();
  invActor('wadjet', WADJET, N.x, 3, 2.2);
  const we = document.getElementById('sa-wadjet'); if(we) we.classList.add('inv-hurt');
  const rift = invRiftEl(world, N.rift.x, N.rift.y + 0.9, INV_RIFT_JG_SIZE, 'invRiftJg', '');
  invActor('mk', 'monkey_king_c', you.x - 1.2, you.y, 1.7);
  invActor('wl', huntWhaleSprite(), you.x + 1.3, you.y + 0.2, 2.2, { flip:true });
  invActor('lion', 'lucesco', down.x, down.y, 1.45, { flip:true });
  sceneActor('lion', { faint:-1 });
  { const le = document.getElementById('sa-lion'); if(le) le.classList.add('inv-hurt'); }
  await invCurtainUp();
  await sceneLook({ x:N.x - 6, y:-0.5, w:13, h:you.y + 6 }, { ms:700 });
  await L([`Wadjet sways at the very edge of the jungle, his light guttering — spent. Behind him the rift tears all the way open with a sound like ripping silk.`,
           ['wadjet', `<b>"Defiant fool! If only I were complete, you would have been crushed."</b>`]]);
  await huntShieldBlock(you);
  await huntZip(rift);
  await L([['lion', `<b>"Oh no you don't — you're not getting away! RAAH!"</b>`]]);
  await huntLionThrown(rift);
  await huntPour(rift);
  await L([`More and more of them come pouring out — captains, soldiers, spreading out along the edge of the trees to cut you off.`,
           ['lion', `Lucesco staggers up between you and them, every hair on end.<br><br><b>"Run! Get out of here — I'll hold them back!"</b>`]]);
  await huntCommander();
  invSay('riftOut'); invSay('perimSet');
  invSet('done');
  /* the epilogue, as it was */
  await sceneCurtain(true, 700);
  await sceneCurtainText(`Back in the great hall, the princess never once lets go of her father's hand. That evening, the King opens his eyes.`, 2600);
  ['lion', 'mk', 'wl', 'cm'].concat(HUNT_POUR.map(a=> a[0]), HUNT_ARMY.map((_, i)=> 'hs' + i)).forEach(id=> sceneActorGone(id));
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
/* his last pulse — blocked: the Monkey King and the Whalelord before you, white shields up, all of you driven back two
   squares. (4.60) the designer: "have them stop at the edges of the treeline, do not go in. sprites should not cross
   trees." — each driven back as far as two squares goes before the trees, and no further (not even into a gap between
   two of them) */
function huntClearAt(x, y){ return !jgSolidAt(x, y) && !(jgSolidAt(x - 1, y) && jgSolidAt(x + 1, y)); }
/* how many of `n` squares back (down) an actor at (x, y) of size `s` can go: every square its feet span, clear */
function huntRoom(x, y, s, n){
  const c = x + 0.5, a = Math.floor(c - s * 0.25), b = Math.floor(c + s * 0.25 - 1e-3), row = Math.floor(y + 1 - 1e-3);
  for(let k = 1; k <= n; k++) for(let cx = a; cx <= b; cx++) if(!huntClearAt(cx, row + k)) return k - 1;
  return n;
}
async function huntShieldBlock(you){
  const we = document.getElementById('sa-wadjet'), wo = we && we._o;
  const mk0 = { x:you.x - 0.7, y:you.y - 1 }, wl0 = { x:you.x + 0.8, y:you.y - 0.8 };
  await Promise.all([invActorTo('mk', mk0.x, mk0.y, 260), invActorTo('wl', wl0.x, wl0.y, 260)]);
  const sh = ['mk', 'wl'].map(id=> huntShield(id));
  try { playSfx('stone_high'); } catch(e){}
  await sceneWait(350);
  if(wo){ stBlast(wo.x + wo.w / 2, wo.y + wo.h * 0.55, 9, 'pulse'); }
  try { playSfx('core_blast'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  sh.forEach(e=> e && e.classList.add('hit'));
  sceneShake(900, ms=> 0.22 * (1 - ms / 900));
  await sceneWait(250);
  /* driven back — to the trees' edge at most */
  const rk = huntRoom(mk0.x, mk0.y, 1.7, 2), rw = huntRoom(wl0.x, wl0.y, 2.2, 2), ry = huntRoom(you.x, you.y, 1, 2);
  const path = [{ x:you.x, y:you.y + 1 }, { x:you.x, y:you.y + 2 }].slice(0, ry);
  await Promise.all([invActorTo('mk', mk0.x, mk0.y + rk, 520), invActorTo('wl', wl0.x, wl0.y + rw, 520),
                     path.length ? invJgRun(path, 0, 520 / path.length, false) : sceneWait(520), huntShieldsFollow(sh, 520)]);
  await sceneWait(300);
  sh.forEach(e=> e && e.classList.add('out'));
  setTimeout(()=> sh.forEach(e=> e && e.remove()), 600);
}
function huntShield(id){
  const a = document.getElementById('sa-' + id), world = $('#walkWorld');
  if(!a || !world) return null;
  const o = a._o, T = WALK_T, s = Math.max(o.w, o.h) * 1.25;
  const e = document.createElement('div');
  e.className = 'hunt-shield';
  e.dataset.of = id;
  e.style.cssText = `left:${((o.x + o.w / 2 - s / 2) * T).toFixed(1)}px;top:${((o.y + o.h / 2 - s / 2) * T).toFixed(1)}px;width:${(s * T).toFixed(1)}px;height:${(s * T).toFixed(1)}px;z-index:${Math.round(20 + o.y + o.h)};`;
  world.appendChild(e);
  return e;
}
/* the shields kept round their bearers as they are driven back */
function huntShieldsFollow(sh, ms){
  const t0 = performance.now(), dur = Math.max(1, ms * SCENE_SPEED) + 80;
  return new Promise(done=>{
    const frame = now=>{
      sh.forEach(e=>{ if(!e) return; const a = document.getElementById('sa-' + e.dataset.of); if(!a || !a._o) return;
        const cs = getComputedStyle(a), x = parseFloat(cs.left) + a._o.w * WALK_T / 2, y = parseFloat(cs.top) + a._o.h * WALK_T / 2;
        e.style.left = (x - e.offsetWidth / 2).toFixed(1) + 'px'; e.style.top = (y - e.offsetHeight / 2).toFixed(1) + 'px'; });
      if(now - t0 < dur) requestAnimationFrame(frame); else done();
    };
    requestAnimationFrame(frame);
  });
}
/* into the rift he zips */
async function huntZip(rift){
  const N = invNorth(), we = document.getElementById('sa-wadjet');
  if(rift) rift.classList.add('inv-rift-flare');
  try { playSfx('rewind'); } catch(e){}
  if(we){ we.classList.remove('inv-hurt'); }
  await invHopTo('wadjet', N.rift.x - 0.5, N.rift.y + 0.6, 0.4, 260);
  if(we){ we.style.transition = `transform ${260 * SCENE_SPEED}ms ease-in, opacity ${260 * SCENE_SPEED}ms ease-in`; void we.offsetWidth; we.style.transform = 'scale(.1)'; we.style.opacity = '0'; }
  await sceneWait(300);
  sceneActorGone('wadjet');
  if(rift) rift.classList.remove('inv-rift-flare');
  await sceneWait(300);
}
/* Lucesco after him, on his own — and thrown back out as the first of them jump out of it */
const HUNT_POUR = [['ra0', JG_COMMANDER, 2.0, 0, 3], ['ra1', JG_CAPTAIN, 1.7, -2, 3], ['ra2', JG_CAPTAIN, 1.7, 2, 3],
                   ['ra3', JG_ALIEN_IDS[2], 1.45, -3, 4], ['ra4', JG_ALIEN_IDS[5], 1.45, 3, 4],
                   ['rb0', JG_CAPTAIN, 1.7, -4, 2], ['rb1', JG_CAPTAIN, 1.7, 4, 2], ['rb2', JG_ALIEN_IDS[1], 1.45, -1, 4],
                   ['rb3', JG_ALIEN_IDS[4], 1.45, 1, 4], ['rb4', JG_ALIEN_IDS[7], 1.45, -5, 4], ['rb5', JG_ALIEN_IDS[9], 1.45, 5, 4]];
/* (4.60) the designer: "When lucesco pounces in, he does so alone from where he had been knocked back to. let him travel
   all the way into the rift, disappear for a while, before getting knocked back out by the aliens." Up from where the
   burst threw him, alone, in one bound into the rift's mouth, and swallowed by it; for a while nothing but the rift
   churning, a roar, blows from inside; then flung back out, tumbling, to land between you and them — and after him, the
   first of them */
async function huntLionThrown(rift){
  const N = invNorth(), mouth = { x:N.rift.x - 0.5, y:N.rift.y + 0.6 };
  const le = document.getElementById('sa-lion');
  if(le) le.classList.remove('inv-hurt');
  sceneActor('lion', { faint:0 });
  try { playSfx('roar'); } catch(e){}
  await sceneWait(220);
  await invHopTo('lion', mouth.x, mouth.y, 1.8, 560);
  if(rift) rift.classList.add('inv-rift-flare');
  try { playSfx('ambush'); } catch(e){}
  const l2 = document.getElementById('sa-lion');
  if(l2){ l2.style.transition = `transform ${300 * SCENE_SPEED}ms ease-in, opacity ${300 * SCENE_SPEED}ms ease-in`; void l2.offsetWidth; l2.style.transform = 'scale(.12)'; l2.style.opacity = '0'; }
  await sceneWait(340);
  if(rift) rift.classList.remove('inv-rift-flare');
  /* gone; the rift churning, the sounds of it from inside */
  let churning = true;
  (async ()=>{ while(churning && ui.screen === JG_KEY){ await sceneShake(500, ms=> 0.025 + 0.02 * Math.sin(ms / 40)); } })();
  try {
    await sceneWait(650); try { playSfx('hit_taken'); } catch(e){}
    if(rift) rift.classList.add('inv-rift-flare');
    await sceneWait(600); try { playSfx('roar'); } catch(e){}
    await sceneWait(650); try { playSfx('hit_taken'); } catch(e){}
  } finally { churning = false; }
  /* flung back out — tumbling — and after him, the first of them */
  const land = huntFree(N.x - 1, 5);
  if(l2){ l2.style.transition = `transform ${160 * SCENE_SPEED}ms ease-out, opacity ${160 * SCENE_SPEED}ms ease-out`; void l2.offsetWidth; l2.style.transform = ''; l2.style.opacity = '1'; }
  sceneShake(700, ms=> 0.15 * (1 - ms / 700));
  try { playSfx('core_blast'); playSfx('hit_taken'); } catch(e){}
  const first = HUNT_POUR.slice(0, 5);
  first.forEach(([id, sp, size])=>{ invActor(id, sp, mouth.x, mouth.y, size); const el = document.getElementById('sa-' + id); if(el){ el.style.opacity = '0'; el.classList.add('inv-band-actor'); } });
  const tumble = l2 && typeof l2.animate === 'function' ? l2.animate([{ rotate:'0deg' }, { rotate:'-720deg' }], { duration:600 * SCENE_SPEED, easing:'ease-out' }) : null;
  await Promise.all([invHopTo('lion', land.x, land.y, 1.4, 600)].concat(first.map(([id, , , dx, y], i)=> sceneWait(200 + i * 110).then(()=> Promise.all([invActorIn(id, 220), invHopTo(id, N.x + dx, y, 0.9, 520)])))));
  if(tumble) tumble.cancel();
  sceneActor('lion', { faint:-1 });
  if(document.getElementById('sa-lion')) document.getElementById('sa-lion').classList.add('inv-hurt');
  if(rift) rift.classList.remove('inv-rift-flare');
  await L([`The rift flares — and Lucesco is flung back out of it, tumbling over and over. Behind him, aliens come leaping out: captains, soldiers, and at their head a hulking commander.`]);
  sceneActor('lion', { faint:0 });
  const l3 = document.getElementById('sa-lion'); if(l3) l3.classList.remove('inv-hurt');
}
/* more and more */
async function huntPour(rift){
  const N = invNorth();
  if(rift) rift.classList.add('inv-rift-flare');
  const more = HUNT_POUR.slice(5);
  more.forEach(([id, sp, size])=>{ invActor(id, sp, N.rift.x - 0.5, N.rift.y + 0.6, size); const el = document.getElementById('sa-' + id); if(el){ el.style.opacity = '0'; el.classList.add('inv-band-actor'); } });
  await Promise.all(more.map(([id, , , dx, y], i)=> sceneWait(i * 120).then(()=> Promise.all([invActorIn(id, 220), invHopTo(id, N.x + dx, y, 0.9, 500)]))));
  if(rift) rift.classList.remove('inv-rift-flare');
}
/* the Commander's soldiers, up out of the jungle behind you: at them — and his word to Lucesco.
   (4.60) the designer: "the number of aliens is correct, but the number of soldiers must be commensurate too. also,
   soldiers should file in from the different paths, obeying the impassable trees. please have 1.5x the number of
   soldiers, approximately, to make defeating the aliens convincing." Eleven aliens: sixteen soldiers and their
   Commander, in four files up four of the jungle's paths from the south, each its own way round the trees, a square at a
   time; each to one of them — the commander and the captains two apiece */
const HUNT_FILES = [[-7, 17], [-1, 17], [3, 17], [9, 17]];                 // where each file comes up from: (dx from his rift, y)
const HUNT_ARMY = Array.from({ length:16 }, (_, i)=> ['chestnut_knight2', 'duck_knight2', 'bug_knight1'][i % 3]);
const HUNT_MARCH = { step:150, gap:1.25 };                                 // ms a square; a file's next a square and a bit behind
/* an actor walked along `path`, a square at a time */
async function huntMarch(id, path, ms){
  for(const q of path || []){
    if(ui.screen !== JG_KEY) throw INV_ABORT;
    invActorStep(id, q, ms);
    await sceneWait(ms);
  }
}
/* who goes at which of them, and where each stands to do it: the squares round each alien, none of them a tree, none
   taken (by an alien, by you and yours, by another soldier) */
function huntArmyPlan(taken){
  const N = invNorth(), aliens = HUNT_POUR.map(([id, , , dx, y])=> ({ id, x:N.x + dx, y }));
  aliens.forEach(a=> taken.add(a.x + ',' + a.y));
  const order = aliens.concat(aliens.filter(a=> /^(ra0|ra1|ra2|rb0|rb1)$/.test(a.id)));
  return order.slice(0, HUNT_ARMY.length).map(a=>{
    const at = [[0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1], [0, 2]].map(([dx, dy])=> ({ x:a.x + dx, y:a.y + dy })).find(q=> !jgSolidAt(q.x, q.y) && !taken.has(q.x + ',' + q.y));
    if(at) taken.add(at.x + ',' + at.y);
    return { alien:a.id, at };
  });
}
async function huntCommander(){
  const N = invNorth(), w = walkState(), you = w.at[JG_KEY] || { x:N.x, y:9 };
  /* the squares not to walk through or stand on: you, the two beside you, Lucesco */
  const taken = new Set([you.x + ',' + you.y]);
  ['mk', 'wl', 'lion'].forEach(id=>{ const e = document.getElementById('sa-' + id), o = e && e._o; if(!o) return;
    const row = Math.floor(o.y + o.h - 1e-3), c = o.x + o.w / 2; for(let x = Math.floor(c - o.w * 0.25); x <= Math.floor(c + o.w * 0.25 - 1e-3); x++) taken.add(x + ',' + row); });
  const cmAt = huntFree(you.x + 2, you.y);
  taken.add(cmAt.x + ',' + cmAt.y);
  const plan = huntArmyPlan(taken);
  const routeOf = (from, to)=> unPath(from, to, (x, y)=> taken.has(x + ',' + y)) || unPath(from, to);
  const starts = HUNT_FILES.map(([dx, y])=> huntFree(N.x + dx, y));
  await sceneLook({ x:N.x - 8, y:-0.5, w:17, h:16 }, { ms:700 });
  await L([`Then a trumpet sounds behind you — the castle's own.`]);
  /* the Commander up the middle path, the files behind and beside him */
  invActor('cm', 'chestnut_knight2_c', starts[1].x, starts[1].y, 1.6);
  const cmGo = huntMarch('cm', routeOf(starts[1], cmAt), HUNT_MARCH.step);
  const marches = HUNT_ARMY.map((sp, i)=>{
    const f = i % HUNT_FILES.length, rank = Math.floor(i / HUNT_FILES.length) + (f === 1 ? 1 : 0), P = plan[i], from = starts[f];
    if(!P || !P.at) return null;
    const route = routeOf(from, P.at);
    return sceneWait(HUNT_MARCH.step * HUNT_MARCH.gap * (rank + 0.4 * f)).then(()=>{
      invActor('hs' + i, sp, from.x, from.y, 1.45);
      return huntMarch('hs' + i, route || [P.at], HUNT_MARCH.step);
    }).then(()=>{ invDuel(P.alien, 'hs' + i); try { playSfx('hit_dealt'); } catch(e){} });
  });
  await cmGo;
  await L([['commander', `<b>"FOR THE KING! Soldiers — at them!"</b>`]]);
  await Promise.all(marches);
  sceneShake(600, ms=> 0.08 * (1 - ms / 600));
  try { playSfx('hit_dealt'); } catch(e){}
  await L([`The castle's soldiers crash into the aliens shield-first, and the edge of the jungle rings with blades.`,
           ['commander', `<b>"Leave the aliens to us, Lucesco. You two have done more than enough today."</b>`],
           ['commander', `<b>"So this is where they've been coming from… a hole in the world, right at the edge of the jungle. Soldiers! A perimeter round that rift: stakes, shields, and a guard on it day and night. Nothing comes out of there without going through us!"</b>`],
           ['knight', `<b>"Yes, Commander!"</b>`],
           ['commander', `<b>"As for you two — back to His Majesty. He needs his friends around him far more than he needs me. Go on. We'll hold here."</b>`]]);
}

/* ============================================================
   INTO THE GAME
   ============================================================ */
(function huntHooks(){
  /* the jungle drawn: the hunt, its edge, his fight waiting — before 36-the-return.js's own */
  if(typeof invJgSceneDue === 'function'){
    const _due = invJgSceneDue;
    invJgSceneDue = function(){
      if(ui.screen !== JG_KEY || ui.sceneRunning || ui.unBusy || ui.jgTalk || ui.jgFighting || ui.jgAlert || document.querySelector('.scene-say')) return;
      if(invOn() && invNew() && invAt('chase') && invSaid('stood')){
        if(ui.huntAfter){ ui.huntAfter = false; return invJgScene(()=> huntAfterRun()); }
        if(huntDue()){ huntDueJg(); return; }
        if(invSaid('hunted') && !invState().won.wadjet && !invSaid('riftOut')) return;   // (he waits at the edge: walk up to him)
        /* (4.59) his fight won, the rest of it left part-way (the app closed): from the edge again */
        if(invSaid('hunted') && invState().won.wadjet && !invSaid('perimSet') && !invSaid('riftOut')){ const p = walkState().at && walkState().at[JG_KEY]; if(huntNear(p)) return invJgScene(()=> huntAfterRun()); return; }
      }
      return _due.apply(this, arguments);
    };
  }
  /* a step: at the edge, it is over */
  if(typeof jgStep === 'function'){
    const _step = jgStep;
    jgStep = function(p, d){
      if(huntOn() && huntSees(p)){ huntWon(); return true; }              // (4.59) he is on the screen: it begins
      /* ridden off one he knocked flat: it stands in the way again */
      jgBands().forEach(b=>{ if(b.ghost && !b._pounced && !(b.x === p.x && b.y === p.y)) b.ghost = false; });
      return _step.apply(this, arguments);
    };
  }
  /* seen, it comes — and it has you; Rift Ambush knocks one flat, no fight; nothing else to stop for */
  if(typeof jgFight === 'function'){
    const _fight = jgFight;
    jgFight = function(b, seen, opts){
      if(huntOn() || ui.huntFailing){
        if(opts && opts.ambush) return huntPounce(b);
        if(!seen){ if(typeof jgTell === 'function') jgTell('No time to fight — after Wadjet!'); return false; }
        huntFail('caught', b);
        return false;
      }
      return _fight.apply(this, arguments);
    };
  }
  /* (4.59) at the edge: the one move he wants, alone and bright; nothing else answers */
  if(typeof jgPadState === 'function'){
    const _ps = jgPadState;
    jgPadState = function(p){
      const H = ui.huntPort;
      if(H && ui.screen === JG_KEY){ const z = { ready:false, lit:false, sub:'', fill:0 }, on = k=> k === H.want ? { ready:true, lit:true, sub:'', fill:0 } : z;
        return { J:false, jump:z, glare:on('glare'), ambush:on('ambush'), track:Object.assign({ on:false, what:'', pic:'' }, z), talk:{ lit:false } }; }
      return _ps.apply(this, arguments);
    };
  }
  if(typeof jgPadPress === 'function'){
    const _pp = jgPadPress;
    jgPadPress = function(mv){
      const H = ui.huntPort;
      if(H && ui.screen === JG_KEY){ if(mv === H.want){ if(typeof jgDialFlash === 'function') jgDialFlash(mv); huntWantDone(true); } return; }
      return _pp.apply(this, arguments);
    };
  }
  if(typeof riftJungleDraw === 'function'){
    const _draw = riftJungleDraw;
    riftJungleDraw = function(world){ const r = _draw.apply(this, arguments); try { huntJungleDraw(world); } catch(e){ console.error('hunt draw:', e); } return r; };
  }
  /* a band knocked flat: you can ride over it */
  if(typeof jgBandAt === 'function'){
    const _at = jgBandAt;
    jgBandAt = function(x, y){ const b = _at.apply(this, arguments); return b && b.ghost ? null : b; };
  }
  /* the ways out of the jungle shut while it goes on */
  const no = (msg)=> ()=>{ if(typeof jgTell === 'function') jgTell(msg); };
  [['jgGate', `Not back in there — Wadjet went <b>north</b>!`], ['jgHome', `No time — after Wadjet!`], ['hutEnter', `No time to stop — after Wadjet!`]].forEach(([fn, msg])=>{
    if(typeof window[fn] !== 'function') return;
    const _f = window[fn];
    window[fn] = function(){ if(huntOn()) return no(msg)(); return _f.apply(this, arguments); };
  });
  /* Lucesco: north, and fast — no carrying you there now ((4.33) "shall I take us there?") */
  if(typeof invLionJungle === 'function'){
    const _lion = invLionJungle;
    invLionJungle = function(){
      if(huntDue()) return jgLines([riftLucescoFace()], 'Lucesco', [huntOn() ? `<b>"North! Follow my nose — and don't let them see us!"</b>` : `<b>"Wadjet's trail starts at the castle gate. Let's go!"</b>`]);
      if(invOn() && invAt('chase') && invSaid('hunted') && !invState().won.wadjet) return jgLines([riftLucescoFace()], 'Lucesco', [`<b>"He's still at the edge, holding the rift open. Heal up if you need to — then let's finish this!"</b>`]);
      return _lion.apply(this, arguments);
    };
  }
  if(typeof invLionCastle === 'function'){
    const _lc = invLionCastle;
    invLionCastle = function(key){
      if(huntDue()) return caLines([['lion', `<b>"Wadjet's trail starts outside the castle gate. Come on — every second counts!"</b>`]]);
      return _lc.apply(this, arguments);
    };
  }
  /* (4.31's way to the rift — a curtain and there — not while the hunt is due) */
  if(typeof invToRift === 'function'){
    const _tr = invToRift;
    invToRift = function(){ if(huntDue()) return; return _tr.apply(this, arguments); };
  }
})();
/* (4.59) the jungle's edge while you hunt him: the rift opening (half as big again, its galaxy in it), and Wadjet before
   it, waiting for it — and from his fight on, the rift there still */
function huntJungleDraw(world){
  if(!invOn() || !invNew() || !invAt('chase') || !invSaid('stood') || invSaid('perimSet')) return;
  const N = invNorth();
  if(!document.getElementById('invRiftJg')) invRiftEl(world, N.rift.x, N.rift.y + 0.9, INV_RIFT_JG_SIZE, 'invRiftJg', '');
  let fig = document.getElementById('huntWadjet');
  if(!huntDue()){ if(fig) fig.remove(); return; }
  if(!fig){
    const T = WALK_T, s = 2.2;
    fig = document.createElement('div');
    fig.id = 'huntWadjet'; fig.className = 'hunt-wadjet';
    fig.style.cssText = `left:${((N.x + 0.5 - s / 2) * T).toFixed(1)}px;top:${((3 + 1 - s) * T).toFixed(1)}px;width:${(s * T).toFixed(1)}px;height:${(s * T).toFixed(1)}px;z-index:13;`;
    fig.innerHTML = jgMonImg(WADJET + '_front', T * s, false);
    world.appendChild(fig);
  }
}
/* his fight waiting at the edge (lost once): walk up to him */
function huntJungleThings(list, P){
  const N = P.north;
  if(!N) return;
  list.push({ x:N.x, y:3, cls:'jg-npc inv-rift-army', html:()=> jgMonImg(WADJET + '_front', WALK_T * 2.2, false), late:true,
    verb:'Fight', sub:'Wadjet', mark:()=> true,
    when:()=> invOn() && invNew() && invAt('chase') && invSaid('stood') && invSaid('hunted') && !invState().won.wadjet && !ui.sceneRunning,
    act:()=> r5Ask([caFaceOf('wadjet')], 'Wadjet', `<b>"Back again? The rift is nearly open. Come, then — quickly."</b><br><br><i>Wadjet, Lv ${NEM.lv}. He turns back time: hold on for ${NEM.turns} turns and he is spent. From his fifth turn he gathers the Eraser Beam — bring him down before it fires.</i>`, 'Fight Wadjet', 'Not yet')
      .then(yes=>{ if(yes) huntWadjetBattle(); else refreshWalk(); }) });
}
if(typeof riftJungleThings === 'function'){
  const _rt = riftJungleThings;
  riftJungleThings = function(list, P){ const r = _rt.apply(this, arguments); huntJungleThings(list, P); return r; };
}

/* ============================================================
   HOW IT LOOKS
   ============================================================ */
let _huntCss = false;
function huntCss(){
  if(_huntCss || typeof document === 'undefined') return;
  _huntCss = true;
  const s = document.createElement('style');
  s.id = 'huntCss';
  s.textContent = `
  .hunt-clock{ position:absolute; left:50%; top:8px; translate:-50% 0; z-index:9; display:flex; align-items:center; gap:6px; padding:5px 12px 5px 9px;
    border-radius:999px; background:rgba(28,18,40,.82); color:#ffe9b8; border:1.5px solid rgba(255,214,140,.7); box-shadow:0 2px 8px rgba(0,0,0,.35);
    font:800 17px/1 'Baloo 2', 'Nunito', system-ui, sans-serif; letter-spacing:.02em; pointer-events:none; font-variant-numeric:tabular-nums; }
  .hunt-clock svg{ color:#ffd27a; flex:0 0 auto; }
  .hunt-clock.low{ color:#ffd0c4; border-color:rgba(255,120,100,.85); animation:huntLow 1s ease-in-out infinite; }
  .hunt-clock.low svg{ color:#ff9a80; }
  .hunt-clock.crit{ background:rgba(120,10,20,.9); color:#fff; animation:huntLow .5s ease-in-out infinite; }
  @keyframes huntLow{ 0%,100%{ scale:1; } 50%{ scale:1.08; } }
  body.inv-scene .hunt-clock{ visibility:hidden; }
  /* (4.59) Wadjet at the jungle's edge, waiting for the rift; the white round shields of the Monkey King and the Whalelord */
  .hunt-wadjet{ position:absolute; pointer-events:none; }
  .hunt-wadjet img{ width:100%; height:100%; animation:invIdle 2.4s ease-in-out infinite; filter:drop-shadow(0 0 8px rgba(150,40,220,.85)); }
  .hunt-shield{ position:absolute; pointer-events:none; border-radius:50%; opacity:0; scale:.4; z-index:96 !important;
    background:radial-gradient(circle, rgba(255,255,255,0) 50%, rgba(255,255,255,.35) 66%, rgba(255,255,255,.9) 74%, rgba(220,240,255,.35) 80%, rgba(255,255,255,0) 86%);
    box-shadow:0 0 18px 6px rgba(255,255,255,.7), inset 0 0 22px rgba(220,240,255,.75); animation:huntShieldUp .3s cubic-bezier(.2,1.4,.4,1) forwards; }
  .hunt-shield.hit{ animation:huntShieldUp .3s cubic-bezier(.2,1.4,.4,1) forwards, huntShieldHit .5s ease-out; }
  .hunt-shield.out{ opacity:0 !important; transition:opacity .5s ease; }
  @keyframes huntShieldUp{ to{ opacity:1; scale:1; } }
  @keyframes huntShieldHit{ 0%{ filter:brightness(2.4); } 100%{ filter:brightness(1); } }
  @media (prefers-reduced-motion: reduce){ .hunt-clock.low, .hunt-clock.crit{ animation:none; } }
  `;
  document.head.appendChild(s);
}
