/* ==========================================================
   10-story-r3.js
   Region 3: Port Akrotiri, the plant, Ankylosaurus, the concert.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ============================================================
   ANKYLOSAURUS — a one-time meeting, and a request
   ============================================================ */
function ankyloState(){
  const r3 = state.progress.region3;
  r3.ankylo = r3.ankylo || { refusals:0, agreed:false, seen:false };
  return r3.ankylo;
}
/* Beatable repeatedly until CAUGHT and agreed; each refusal adds a toad wave. */
function ankyloAvailable(){
  const a = ankyloState();
  if(a.agreed) return false;
  if(!(state.caughtSpecies||[]).includes('toad')) return false;
  if((state.progress.region3.engineerDone||0) < 3) return false;   // all 3 protein commissions done
  const best = Math.max(...battleParty().map(m=>m.level), 1);
  return best >= 61;
}
/* Once Ankylosaurus has agreed to help, the plant is genuinely at peace. */
function plantAtPeace(){ return !!ankyloState().agreed; }
function ankyloWaves(){
  const a = ankyloState();
  const extra = Math.min(20, Math.max(0, a.refusals - 1));
  const toadWave = ()=>[
    {species:'toad',level:65,ai:'power1',nerfed:false},
    {species:'toad',level:65,ai:'best',nerfed:false},
    {species:'toad',level:65,ai:'power1',nerfed:false},
  ];
  const waves = [];
  for(let i=0;i<1+extra;i++) waves.push(toadWave());
  waves.push([
    {species:'toad',level:65,ai:'best',nerfed:false},
    {species:'ankylosaurus',level:65,ai:'ankylo',nerfed:false,boss:true},
    {species:'toad',level:65,ai:'best',nerfed:false},
  ]);
  return waves;
}
function startAnkyloEncounter(){
  ankyloState().seen = true;
  beginBattle({ isNpc:false, allowCatch:true, name:'Something far worse',
    waves: ankyloWaves(), bgKey:'battle_geothermal_plant' });
}

/* The conversation after it is caught. Refusing releases it. */
function ankyloConversation(mon){
  const a = ankyloState();
  if(a.refusals > 0) return ankyloReturnTalk(mon);
  ankyloPanel1(mon);
}

function ankyloPanel1(mon){
  storyModal(monPortrait('ankylosaurus',150,{view:'front',bare:true,stage:1}), 'It will not submit',
    `Ankylosaurus stares defiantly at you, unwilling to submit. You feel its thoughts in your head.<br><br>` +
    `<b>Ankylosaurus:</b> "Child, do not hinder me. I have a promise to fulfil."<br><br>` +
    `<b>${escapeHtml(state.name)}:</b> "This place is suffering from your attacks. Leave it alone, and I will leave you in peace."`,
    ()=>ankyloPanel2(mon), { subtitle:'Geothermal Plant' });
}
function ankyloPanel2(mon){
  storyModal(uiIcon('electric_core', 130, '⚡'), 'A promise',
    `<b>Ankylosaurus:</b> "Electricity… found here only. I need to bring it home… my friend needs power. ` +
    `His essence has been stolen."<br><br>` +
    `Ankylosaurus peers into your thoughts, sensing your realisation.<br><br>` +
    `<b>Ankylosaurus:</b> "You've met the robbers. You're after them too."<br><br>` +
    `<i>It pauses, weighing your intentions. You sense its hope in you.</i>`,
    ()=>ankyloPanel3(mon), { subtitle:'Geothermal Plant' });
}
function ankyloPanel3(mon){
  ankyloChoice(mon, `<b>Ankylosaurus:</b> "Will you look after my friend with me? Get back his essence?"`,
    'Yes, you can count on me.', "No, I'm done babysitting.");
}
function ankyloReturnTalk(mon){
  ankyloChoice(mon,
    `Ankylosaurus roars: <b>"Why do you trouble me still? I cannot abandon my friend."</b>`,
    "I've reconsidered. What's one more baby to take care of?",
    "I'm here for you, not for dead weight.");
}

function ankyloChoice(mon, prompt, yesLabel, noLabel){
  document.body.classList.remove('writing');
  document.body.classList.add('in-scene');
  window.scrollTo(0,0);
  $('#brandSub').textContent = 'Geothermal Plant';
  setScreenBg('geothermal_plant');
  screenEl.innerHTML = `
    <div class="scene">
      <div class="scene-emblem">${monPortrait('ankylosaurus',150,{view:'front',bare:true,stage:1})}</div>
      <div class="scene-title">Ankylosaurus</div>
      <div class="scene-body"><p>${prompt}</p></div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;">
        <button class="btn btn-primary" id="akYes">${escapeHtml(yesLabel)}</button>
        <button class="btn btn-ghost" id="akNo">${escapeHtml(noLabel)}</button>
      </div>
    </div>`;
  $('#akYes').addEventListener('click', ()=>ankyloAgree(mon));
  $('#akNo').addEventListener('click', ()=>ankyloRefuse(mon));
}

async function ankyloAgree(mon){
  const a = ankyloState();
  a.agreed = true;
  // it goes to storage, and the baby joins as a passenger
  const pi = state.party.findIndex(m=>m.uid===mon.uid);
  if(pi>=0){ state.party.splice(pi,1); state.storage.push(mon); }
  const baby = newMonster('newt_baby', 1);
  baby.currentHp = 1;
  state.party.push(baby);
  if(!state.caughtSpecies.includes('newt_baby')) state.caughtSpecies.push('newt_baby');
  state.inventory.protein = (state.inventory.protein||0) + 5;
  await saveProfile();

  storyModal(monPortrait('ankylosaurus',150,{view:'front',bare:true,stage:1}), '"Then I\'m counting on you."',
    `<b>Ankylosaurus:</b> "Then I'm counting on you. My strength is yours, if you will care for my friend too."<br><br>` +
    `It presses something small and softly humming into your care — a <b>Thunder Newt Baby</b>, ` +
    `no bigger than your two hands.`,
    ()=>storyModal(npcPortrait('plant_boss','🧑‍🏭',130,'transparent'), 'The attacks have stopped',
      `The plant boss finds you before you reach the gate, and for once he isn't shouting.<br><br>` +
      `"Whatever you said to it — it's gone quiet. Whole place has. First full shift we've run in months."<br><br>` +
      `He presses a crate into your arms.<br><br><b>+5 Protein Supplements</b>`,
      ()=>go('region'), { bg:'geothermal_plant', subtitle:'Geothermal Plant' }),
    { subtitle:'Geothermal Plant' });
}

async function ankyloRefuse(mon){
  const a = ankyloState();
  a.refusals = (a.refusals||0) + 1;
  // Undo the catch completely — including the caught-species record, which
  // otherwise marks it as a one-time legendary and blocks every future attempt.
  const pi = state.party.findIndex(m=>m.uid===mon.uid);
  if(pi>=0) state.party.splice(pi,1);
  const si = state.storage.findIndex(m=>m.uid===mon.uid);
  if(si>=0) state.storage.splice(si,1);
  state.caughtSpecies = (state.caughtSpecies||[]).filter(x=>x!=='ankylosaurus');
  await saveProfile();

  const line = a.refusals === 1
    ? `<b>Ankylosaurus:</b> "Then leave me be. The responsibility is mine."`
    : `<b>Ankylosaurus:</b> "My honour is worth more than your petty ambitions. Be gone before my patience expires."`;
  storyModal(monPortrait('ankylosaurus',150,{view:'front',bare:true,stage:1}), 'It turns away',
    line + `<br><br><i>It shrugs off your grip and lumbers back into the steam.</i>` +
    (a.refusals > 1 ? `<br><br><i>Its guard will be heavier next time.</i>` : ''),
    ()=>go('region'), { subtitle:'Geothermal Plant' });
}

/* ============================================================
   GEOTHERMAL PLANT — THE GENERATOR FLOOR
   The pipes below are quiet; now something is siphoning the turbines up top.
   Red pulses bloom across the plant and fade in under a second. Catch one and
   a fight starts — but these thieves are here for the power, not for you.
   ============================================================ */
const GEN_MIN_LV = 55, GEN_MAX_LV = 65;
const GEN_TARGET = 5;                       // suppressed fights for the daily reward
const GEN_PULSE_MIN = 800, GEN_PULSE_MAX = 1000;

/* Base forms only — the cute ones. Weighted so elites stay rare. */
const GEN_COMMON = ['thunderdog','zebra','thunderlion','thundersquirrel','magnet','tiger'];
const GEN_ELITE  = ['giraffe','thunderhound','thundercat'];

function genState(){
  const r3 = state.progress.region3;
  r3.generator = r3.generator || { day:null, wins:0, claimed:false };
  if(r3.generator.day !== today()){ r3.generator.day = today(); r3.generator.wins = 0; r3.generator.claimed = false; }
  return r3.generator;
}
function genUnlocked(){ return !!(state.progress.region3||{}).powerStone; }

/* Level tracks the player, inside the zone's own band. */
function genLevel(){
  const best = Math.max(...battleParty().map(m=>m.level), GEN_MIN_LV);
  return Math.max(GEN_MIN_LV, Math.min(GEN_MAX_LV, best));
}
function genPickSpecies(){
  const r = Math.random();
  if(r < 0.05) return GEN_ELITE[Math.floor(Math.random()*GEN_ELITE.length)];
  if(r < 0.20) return 'electric_starter';
  return GEN_COMMON[Math.floor(Math.random()*GEN_COMMON.length)];
}
function genWave(){
  const n = Math.random() < 0.5 ? 2 : 3;     // always a pack
  const lv = genLevel();
  return Array.from({length:n}, ()=>({
    species: genPickSpecies(),
    level: lv + Math.floor(Math.random()*3) - 1,
    forceStage: 0,                           // base form, always
    elusive: true,
    nerfed: false,
  }));
}

function renderGenerator(){
  if(!genUnlocked()) return go('explore');
  const g = genState();
  stopGenLoop();
  setScreenBg('plant_generator');
  playMusicChain(['zone_plant_generator','zone_geothermal_plant','region3','region']);
  $('#brandSub').textContent = 'Generator Floor';
  const canFight = battleParty().some(m=>m.currentHp>0);
  const pct = Math.min(100, g.wins/GEN_TARGET*100);

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="gen-note">Electric monsters are feeding off the turbines. Tap a <b>red pulse</b>
      the moment you see it — they vanish in under a second.</div>

    <!-- the cutaway diagram the pulses appear on — separate from the zone art -->
    <div class="gen-stage" id="genStage">
      <img src="assets/zones/plant_generator_map.png" alt="" class="gen-img"
           onerror="this.style.display='none';this.parentNode.classList.add('gen-noart')">
    </div>

    <div class="trial-bar" style="margin:10px 0 4px;"><span style="width:${pct}%"></span></div>
    <div class="trial-count">${g.wins} / ${GEN_TARGET} suppressed today${
      g.claimed ? ' · reward claimed' : (g.wins>=GEN_TARGET ? ' · reward ready!' : '')}</div>



    <button class="btn btn-ghost" id="returnBtn" style="margin-top:10px;">Return</button>
  `;
  $('#backBtn').addEventListener('click', ()=>{ stopGenLoop(); go('explore'); });
  $('#returnBtn').addEventListener('click', ()=>{ stopGenLoop(); go('explore'); });
  // the boss pays out the moment the fifth is seen off
  if(ui.pendingGenReward){ ui.pendingGenReward = false; return setTimeout(genReward, 300); }
  if(canFight) startGenLoop();
}

/* --- the pulses --- */
let _genTimer = null, _genLive = null, _genRunning = false;
function stopGenLoop(){
  clearTimeout(_genTimer); _genTimer = null;
  if(_genLive && _genLive.el && _genLive.el.parentNode) _genLive.el.remove();
  _genLive = null; _genRunning = false;
}
function startGenLoop(){
  stopGenLoop();
  _genRunning = true;
  const schedule = ()=>{
    _genTimer = setTimeout(()=>{
      const stage = document.getElementById('genStage');
      if(!_genRunning || !stage) return stopGenLoop();
      spawnPulse(stage, schedule);
    }, 600 + Math.random()*1600);
  };
  schedule();
}
function spawnPulse(stage, next){
  const el = document.createElement('div');
  el.className = 'gen-pulse';
  // keep clear of the very edges so a small finger can land on it
  el.style.left = (12 + Math.random()*72) + '%';
  el.style.top  = (14 + Math.random()*64) + '%';
  stage.appendChild(el);
  const window_ = GEN_PULSE_MIN + Math.random()*(GEN_PULSE_MAX - GEN_PULSE_MIN);
  el.style.setProperty('--pulse-ms', window_ + 'ms');
  const live = { el };
  _genLive = live;
  el.addEventListener('click', ()=>{
    if(_genLive !== live) return;
    _genLive = null;
    el.remove();
    stopGenLoop();
    startGenFight();
  });
  setTimeout(()=>{
    if(_genLive !== live) return;
    _genLive = null;
    el.classList.add('gone');
    setTimeout(()=>{ if(el.parentNode) el.remove(); }, 260);
    next();
  }, window_);
}

function startGenFight(){
  if(!ensurePool()) return;
  ui.currentZone = { id:'plant_generator', name:'Generator Floor' };
  beginBattle({
    waves:[ genWave() ], isNpc:false, allowCatch:true, name:'Power thieves',
    bgKey:'battle_plant_generator',
    onWin: ()=> onGenWin(),
  });
}
async function onGenWin(){
  const g = genState();
  g.wins++;
  const hitTarget = (g.wins === GEN_TARGET && !g.claimed);
  if(hitTarget){ g.claimed = true; state.inventory.tokens = (state.inventory.tokens||0) + 10; }
  await saveProfile();
  if(hitTarget){
    ui.pendingGenReward = true;      // the boss thanks you after the victory screen
  }
  resumeVictory();          // the ordinary victory screen, so catching still works
}
function genReward(){
  storyModal(npcPortrait('plant_boss','🧑‍🏭',130,'transparent'), 'Turbines holding',
    `"Five of the little thieves seen off. Output's back where it should be."<br><br>` +
    `He counts something into your hand without looking up.<br><br>` +
    `<b>+10 Skill Tokens</b><br><br><i>Come back tomorrow — they always come back.</i>`,
    ()=>go('generator'), { bg:'plant_generator', subtitle:'Generator Floor' });
}

/* --- Plant: the boss, the stone, the engineer --- */
async function plantIntro(){
  const r3 = state.progress.region3;
  r3.plantIntro = true;
  await saveProfile();
  storyModal(npcPortrait('plant_boss','🧑‍🏭',130,'transparent'), 'The plant boss',
    `"Visitors! Don't get many." He wipes his hands on a rag that makes them no cleaner.<br><br>` +
    `You ask about a <b>power stone</b>.<br><br>` +
    `"Ha — I've a crate of them. But look around." He gestures at the pipework, where something ` +
    `orange is moving. "The fire monsters come up the tubes and nest in the couplings. My people can't ` +
    `shift them.<br><br>Help my workers, and the stone's yours."`,
    ()=>renderPlant(), { bg:'geothermal_plant', subtitle:'Geothermal Plant' });
}

async function usePowerStone(){
  const r3 = state.progress.region3;
  const dragon = state.party.concat(state.storage)
    .find(m=>isEgg(m) || m.species==='water_dragon_nerfed' || m.species==='water_dragon');
  if(!dragon) return toast('Nothing here needs it yet.');
  r3.powerStoneUsed = true;
  const before = dragon.level;
  dragon.xpFights = (dragon.xpFights||0) + 15;
  const ups = [];
  while(dragon.level < levelCap() && (dragon.xpFights||0) >= fightsNeeded(dragon.level)){
    dragon.xpFights -= fightsNeeded(dragon.level);
    dragon.level++;
  }
  dragon.currentHp = monMaxHp(dragon);
  await saveProfile();
  storyModal(powerStoneIcon(110), 'The stone goes in',
    `The stone sinks into the hollow and stays there, humming faintly.<br><br>` +
    `<b>${escapeHtml(displayName(dragon))}</b> looks <b>significantly more energetic</b>.<br><br>` +
    `<b>+15 fights' worth of growth</b>${dragon.level>before?` · now level ${dragon.level}`:''}`,
    ()=>renderPlant(), { bg:'geothermal_plant', subtitle:'Geothermal Plant' });
}

function engineerOffer(){
  const r3 = state.progress.region3;
  const paid = r3.engineerDone||0;
  if(plantAtPeace()){
    return storyModal(npcPortrait('engineer1','🛠️',120,'transparent'), 'The Engineer',
      `He wipes his hands and actually smiles at you.<br><br>` +
      `"Whatever you did out there — the drills haven't so much as hiccupped since. ` +
      `First quiet week we've had. I'll not forget it."<br><br>` +
      `<i>He doesn't have another job for you. For once, he doesn't need one.</i>`,
      ()=>go('plant'), { bg:'geothermal_plant', subtitle:'Geothermal Plant' });
  }
  storyModal(npcPortrait('engineer1','🛠️',120,'transparent'), 'The Engineer',
    `"There's a nastier problem below." He taps a chewed-looking drill bit on the bench.<br><br>` +
    `"Three of the big ones have <b>melted our drills and taken the metal into their hide</b>. ` +
    `Fire and steel both, now. They're beyond my crew."<br><br>` +
    `"It's extra work and I'd understand a no."` +
    (paid>=3 ? `<br><br><i>He has nothing left to pay you with, but the toads keep coming back.</i>` : ''),
    ()=>engineerChoice());
}
function engineerChoice(){
  screenEl.innerHTML += `
    <div style="display:flex;gap:10px;margin-top:12px;max-width:520px;margin-left:auto;margin-right:auto;">
      <button class="btn btn-ghost" id="engNo" style="flex:1;">Not today</button>
      <button class="btn btn-primary" id="engYes" style="flex:1;">Take the commission</button>
    </div>`;
  $('#engNo').addEventListener('click', ()=>renderPlant());
  $('#engYes').addEventListener('click', ()=>{
    if(!ensurePool()) return;
    ui.currentZone = { id:'geothermal_plant', name:'Geothermal Plant' };
    /* Once the party is strong enough, the commission occasionally turns up
       something far worse than toads. */
    // 5% once the toads are known and the party is strong enough
    if(ankyloAvailable() && (isDev() || Math.random() < 0.05)) return startAnkyloEncounter();
    beginBattle({ isNpc:false, allowCatch:true, name:'Slag Toads', npcId:'engineer1',
      waves:[[{species:'toad',level:51,ai:'power1',nerfed:false},
              {species:'toad',level:51,ai:'best',nerfed:false},
              {species:'toad',level:51,ai:'power1',nerfed:false}]],
      onWin: onEngineerWin });
  });
}
async function onEngineerWin(){
  const r3 = state.progress.region3;
  const paid = r3.engineerDone||0;
  if(paid >= 3 || plantAtPeace()) return resumeVictory();
  r3.engineerDone = paid + 1;
  state.inventory.protein = (state.inventory.protein||0) + 1;
  await saveProfile();
  const left = 3 - r3.engineerDone;
  storyModal(npcPortrait('engineer1','🛠️',120,'transparent'), 'Commission complete',
    `"That's the drills back, more or less." He presses a Protein Supplement into your hand.<br><br>` +
    `<b>+1 Protein Supplement</b>${left?` · ${left} more commission${left>1?'s':''} available`:''}`,
    ()=> resumeVictory(), { bg:'geothermal_plant', subtitle:'Geothermal Plant' });
}

/* --- the ship, and the shuttered dojo --- */
function vaneShearClosed(){
  const r3 = state.progress.region3;
  if(!r3.vaneShearSeen){ r3.vaneShearSeen = true; saveProfile(); }
  /* Once the band is beaten the crew comes back aboard and he has his reason. */
  if(r3.shipPass) return vaneShearOpen();
  storyModal(npcPortrait('shipkeeper','⚓',120,'transparent'), 'RRS Vane Shear',
    `A white-bearded giant blocks the gangway. He folds his arms, which takes a moment.<br><br>` +
    `"No."<br><br>` +
    `A pause, in case that was enough. It usually is.<br><br>` +
    `"Crew's ashore. Sailors, researchers, the lot — gone up to that <b>band competition</b>. ` +
    `Nobody boards while they're off her."<br><br>` +
    `He looks past you at the harbour, which ends the conversation.<br><br>` +
    `<i>"Come back when you've a reason I care about."</i>`,
    ()=>go('explore'), { bg:'vane_shear', subtitle:'RRS Vane Shear' });
}


/* He remembers you beat the lot of them, which is a reason he cares about. */
function vaneShearOpen(){
  storyModal(npcPortrait('shipkeeper','⚓',130,'transparent'), 'RRS Vane Shear',
    `The gangway is down and the crew are aboard, and the white-bearded giant is ` +
    `standing exactly where he was before.<br><br>` +
    `He looks at you for a while.<br><br>` +
    `<b>"You beat the whole band."</b> It is not quite a question.<br><br>` +
    `<b>"Aye. That'll do."</b> He steps aside — barely. <b>"Captain's on the weather deck. ` +
    `We're sailing east on the tide, and she'll want a word before we go."</b>`,
    ()=> boardTheShip(), { bg:'vane_shear', subtitle:'RRS Vane Shear' });
}
async function boardTheShip(){
  state.progress.currentRegion = 4;
  state.progress.region4 = state.progress.region4 || {};
  await saveProfile();
  storyModal(npcPortrait('ship_captain','⚓',140,'transparent'), 'Under way',
    `Port Akrotiri slides astern faster than you expect.<br><br>` +
    `<i>You are aboard the RRS Vane Shear, bound east across the North Sea.</i><br><br>` +
    `<b>The Weather Deck, the Cabin Deck and the Laboratory are yours to explore.</b>`,
    ()=> go('explore'), { bg:'weather_deck', subtitle:'Weather Deck' });
}

/* ============================================================
   DEVELOPER PROFILE
   A profile flagged as `isDev` can jump to any point in the story, so scripted
   sequences can be re-tested without replaying the whole game. Everything here
   is inert on a normal profile.
   ============================================================ */
function isDev(){ return !!(state && state.isDev); }

/* Scripted acquisitions, cleared when their region is reset. */
const REGION_SCRIPTED = {
  1: { species:['phoenix','ground_starter'], flags:['strangeKey'] },
  2: { species:['forest_fairy','sacred_seed','lanternfish','water_dragon','water_dragon_nerfed','dragon_egg'], flags:[] },
  3: { species:['ankylosaurus','newt','newt_baby'], flags:[] },
};

async function makeDevProfile(){
  state.isDev = true;
  state.settings.xpMode = 'dev';
  state.inventory.tokens   = 500;
  state.inventory.protein  = 500;
  state.inventory.crowns   = 500;
  state.inventory.voidStones = 500;
  state.medals = { bronze:500, silver:500, gold:500 };
  await saveProfile();
  toast('🛠️ Developer profile enabled.');
}

/* Wipe a region's story back to its opening, keeping the team and inventory.
   Later regions always go with it — you can't half-rewind a story. */
async function resetRegion(n){
  const p = state.progress;
  const clear = [];
  for(let r = n; r <= 3; r++) clear.push(r);

  clear.forEach(r=>{
    if(r===1){
      p.region1 = { guardianCleared:false, rivalCleared:false, thugsCleared:[],
                    thugBossCleared:false, investigateProtein:0, dojoCleared:[] };
    }
    if(r===2){
      p.region2 = { courage:0, trialDone:false, seedGranted:false, challengeDone:false,
                    rivalCleared:false, waterDojo:[], paths:{}, uniform:false, password:false,
                    cavernDone:false, eggGranted:false, crownGranted:false };
    }
    if(r===3){
      p.region3 = { monkeyMet:false, monkeyChoice:null, plantIntro:false, helped:{}, helpCount:0,
                    powerStone:false, powerStoneUsed:false, engineerDone:0,
                    ankylo:{ refusals:0, agreed:false, seen:false } };
    }
    // remove that region's scripted monsters and items
    const sc = REGION_SCRIPTED[r] || { species:[], flags:[] };
    state.party   = state.party.filter(m=>!sc.species.includes(m.species));
    state.storage = state.storage.filter(m=>!sc.species.includes(m.species));
    sc.flags.forEach(f=>{ state.inventory[f] = false; });
    sc.species.forEach(sp=>{
      state.caughtSpecies = (state.caughtSpecies||[]).filter(x=>x!==sp);
    });
    if(r===2) state.lanternGranted = false;
  });

  p.currentRegion = n;
  if(!state.party.length){
    state.party.push(newMonster(state.starterSpecies || 'fire_starter', 5));
  }
  await saveProfile();
  toast(`🛠️ Region ${n}${n<3?'+':''} reset.`);
  go('regionSelect');
}

/* --- shortcuts through the long scripted stretches --- */
function devShortcut(){
  if(!isDev()) return;
  const p = state.progress;
  // Region 2: drop straight into the tail of each sequence
  if(p.region2){
    if(!p.region2.trialDone && p.region2.courage < 27) p.region2.courage = 27;
    const paths = pathState();
    ['upper','lower'].forEach(id=>{ if(paths[id].step < 8) paths[id].step = 8; });
    if(paths.disused.step < 4) paths.disused.step = 4;
  }
  saveProfile();
}

function devPanel(){
  if(!isDev()) return '';
  return `
    <div class="dev-panel">
      <div class="dev-head">🛠️ Developer</div>
      <div class="dev-sub">Story resets keep your team, levels, storage and inventory.
        Scripted catches and passengers for the region are removed.</div>
      <div class="dev-btns">
        ${[1,2,3].map(n=>`<button class="btn btn-ghost dev-btn" data-devreset="${n}">Reset R${n}${n<3?'+':''}</button>`).join('')}
      </div>
    </div>`;
}
function wireDevPanel(){
  screenEl.querySelectorAll('[data-devreset]').forEach(b=>b.addEventListener('click', ()=>{
    const n = +b.dataset.devreset;
    confirmDialogHtml(
      `Reset <b>Region ${n}${n<3?' and everything after it':''}</b>?<br><br>` +
      `Your party, levels, storage and inventory stay. Scripted catches and passengers ` +
      `from ${n<3?'those regions':'that region'} are removed.`,
      ()=> resetRegion(n));
  }));
}


/* ============================================================
   THE ROCK BAND CONCERT
   Region 3's Challenge. Three scenes set it up, then a pentagon of sailor fans
   around the Electric Dojo band in the centre.
   ============================================================ */
function concertState(){
  const r3 = state.progress.region3;
  r3.concert = r3.concert || { seen:false, sailors:[], bandCleared:false, stage:0 };
  r3.dojo = r3.dojo || { started:false, electricDone:false, sageDone:false, verdict:null, stone:false };
  r3.concert.failstars = r3.concert.failstars || [];
  return r3.concert;
}
function sailorsBeaten(){ return (concertState().sailors||[]).length; }
function sailorDone(n){ return (concertState().sailors||[]).includes(n); }

const SAILOR_WAVE1 = (lv)=>[
  {species:'starfish', level:lv, ai:'power1'},
  {species:'duck',     level:lv, ai:'power1'},
  {species:'seahorse', level:lv, ai:'power1'},
];
const SAILORS = {
  1: { label:'Sailor', waves:[ SAILOR_WAVE1(51),
       [{species:'sea_turtle',level:55,ai:'best'},{species:'plesiosaur',level:55,ai:'best'}] ] },
  2: { label:'Sailor', waves:[ SAILOR_WAVE1(52),
       [{species:'plesiosaur',level:56,ai:'best'},{species:'otter',level:56,ai:'best'}] ] },
  3: { label:'Sailor', waves:[ SAILOR_WAVE1(53),
       [{species:'otter',level:57,ai:'best'},{species:'loong',level:57,ai:'best'}] ] },
  4: { label:'Sailor', waves:[ SAILOR_WAVE1(54),
       [{species:'loong',level:58,ai:'best'},{species:'ninja',level:58,ai:'best'}] ] },
  5: { label:'Sailor', waves:[ SAILOR_WAVE1(60),
       [{species:'sea_turtle',level:61,ai:'best'},{species:'sea_turtle',level:61,ai:'best'}],
       [{species:'plesiosaur',level:62,ai:'best'}],
       [{species:'otter',level:63,ai:'best'}],
       [{species:'loong',level:64,ai:'best'}],
       [{species:'ninja',level:65,ai:'best'}] ] },
};

const DOJO_WAVE1 = (lv)=>[
  {species:'thunderdog',  level:lv, ai:'power1'},
  {species:'zebra',       level:lv, ai:'power1'},
  {species:'thunderlion', level:lv, ai:'power1'},
];
/* Fought in this order — the four disciples, then the master last. The
   pentagon draws them in a different order; see BAND_LAYOUT. */
const ELECTRIC_BAND = [
  { id:'electric_disciple1', label:'Electric Disciple', waves:[ DOJO_WAVE1(54),
      [{species:'thundersquirrel',level:60,ai:'best'}] ] },
  { id:'electric_disciple2', label:'Electric Disciple', waves:[ DOJO_WAVE1(55),
      [{species:'magnet',level:60,ai:'best'}] ] },
  { id:'electric_disciple3', label:'Electric Disciple', waves:[ DOJO_WAVE1(56),
      [{species:'tiger',level:60,ai:'best'}] ] },
  { id:'electric_disciple4', label:'Electric Disciple', waves:[ DOJO_WAVE1(57),
      [{species:'electric_starter',level:60,ai:'best'},{species:'giraffe',level:61,ai:'best'}] ] },
  { id:'electric_master',    label:'Electric Master',   waves:[ DOJO_WAVE1(58),
      [{species:'thundersquirrel',level:61,ai:'best'},{species:'magnet',level:61,ai:'best'},{species:'tiger',level:61,ai:'best'}],
      [{species:'electric_starter',level:65,ai:'best'},{species:'giraffe',level:65,ai:'best'}],
      [{species:'thundercat',level:71,ai:'best'}] ] },
];
/* Left to right on the button, with the master in the middle. */
const BAND_LAYOUT = ['electric_disciple1','electric_disciple2','electric_master','electric_disciple3','electric_disciple4'];

/* --- the three opening scenes --- */
function concertIntro(){
  storyModal('', 'The band competition',
    `The whole port has emptied into one square. Stacked speakers, bunting strung between masts, ` +
    `and a stage built out of cargo pallets that is somehow holding.<br><br>` +
    `Someone is soundchecking a bass through what is clearly a ship's horn. It is <b>extremely loud</b> ` +
    `and nobody seems to mind.`,
    ()=>concertIntro2(), { bg:'band_concert', subtitle:'Band Competition' });
}
function concertIntro2(){
  storyModal(npcPortrait('electric_master','⚡',130,'transparent'), 'Trouble backstage',
    `Behind the stage you find five musicians in matching jackets trying very hard to rehearse — ` +
    `and a knot of <b>sailors</b> pressed around them waving programmes and pens.<br><br>` +
    `"One more, just one more—"<br>"Sign my hat!"<br>"Can you play the fast one again?"<br><br>` +
    `Nobody in the band has managed to finish a bar.`,
    ()=>concertIntro3(), { bg:'band_concert', subtitle:'Band Competition' });
}
async function concertIntro3(){
  const c = concertState();
  c.seen = true;
  await saveProfile();
  storyModal(npcPortrait('electric_master','⚡',130,'transparent'), 'Djenta',
    `A young woman lowers her guitar and looks at you with the expression of someone at the end ` +
    `of a long day.<br><br>` +
    `"If you're here about the Dojo — it's shut until the competition's done. I'm sorry."<br><br>` +
    `You explain: an organisation is stealing the cores of legendary monsters, and you are in a hurry.<br><br>` +
    `She studies you for a moment, then jerks her chin at the crowd.<br><br>` +
    `"Tell you what. Get rid of <b>these five</b> so we can actually rehearse, and I'll make time ` +
    `for you. All five of us will."`,
    ()=>go('challenge'), { bg:'band_concert', subtitle:'Band Competition' });
}

/* --- the zone screen --- */
function renderConcert(){
  const c = concertState();
  if(!c.seen) return concertIntro();
  setScreenBg('band_concert');
  playMusicChain(['zone_band_concert','region3','region']);
  $('#brandSub').textContent = 'Band Competition';
  const beaten = sailorsBeaten();

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Challenge</button>
    <div class="zone-hero">
      <img src="assets/zones/band_concert.png" alt="" class="zone-hero-img" onerror="this.style.display='none'">
      <div class="zone-hero-name">Band Competition</div>
    </div>
    ${c.bandCleared ? `
      <div class="plant-note">The band has gone on tour. The rest of the bill is still here,
        and several of them would like your opinion.</div>
      <div class="failstar-grid">
        ${FAILSTARS.map((f,i)=>`
          <button class="sailor-btn ${failstarDone(f.id)?'done':''}" data-failstar="${i}">
            ${npcPortrait(f.id,'🎤',56,'transparent')}
            ${failstarDone(f.id)?'<span class="worker-done">✓</span>':''}
          </button>`).join('')}
        <button class="sailor-btn figlio ${figlioBeatenToday()?'done':''}" data-figlio="1">
          ${npcPortrait('figlio','🎙️',56,'transparent')}
          ${figlioDone()?'<span class="worker-done">✓</span>':''}
        </button>
      </div>
    ` : `
    <div class="plant-note">Clear the sailor fans so the Electric Dojo can rehearse.
      <b>${beaten}/5</b> seen off.</div>

    <div class="pentagon">
      <div class="pent-row top">
        ${[1,5,2].map(n=>sailorButton(n)).join('')}
      </div>
      <button class="band-btn ${c.bandCleared?'done':''}" id="bandBtn">
        ${BAND_LAYOUT.map(id=>npcPortrait(id,'⚡',52,'transparent')).join('')}
        <div class="band-label">${c.bandCleared?'The Electric Dojo — cleared':'The Electric Dojo'}</div>
      </button>
      <div class="pent-row bottom">
        ${[3,4].map(n=>sailorButton(n)).join('')}
      </div>
    </div>`}

    <button class="btn btn-ghost" id="returnBtn" style="margin-top:14px;">Return</button>
  `;
  $('#backBtn').addEventListener('click', ()=>go('challenge'));
  $('#returnBtn').addEventListener('click', ()=>go('challenge'));
  screenEl.querySelectorAll('[data-sailor]').forEach(b=>b.addEventListener('click', ()=>onSailorTap(+b.dataset.sailor)));
  screenEl.querySelectorAll('[data-failstar]').forEach(b=>b.addEventListener('click', ()=>openFailstar(+b.dataset.failstar)));
  const fg = screenEl.querySelector('[data-figlio]');
  if(fg) fg.addEventListener('click', ()=>openFiglio());
  const bb = $('#bandBtn');
  if(bb) bb.addEventListener('click', onBandTap);
}

function sailorButton(n){
  const done = sailorDone(n);
  const locked = n===5 && sailorsBeaten() < 4;
  return `<button class="sailor-btn ${done?'done':''} ${locked?'locked':''}" data-sailor="${n}">
    ${npcPortrait('sailor'+n,'⚓',56,'transparent')}
    ${done?'<span class="worker-done">✓</span>':''}
  </button>`;
}

function onSailorTap(n){
  if(sailorDone(n)) return toast('That one has already given up.');
  if(n===5 && sailorsBeaten() < 4){
    return storyModal(npcPortrait('sailor5','⚓',120,'transparent'), 'Not now',
      `He doesn't even lower his camera.<br><br>"Leave me alone, I need to take pictures!"`,
      ()=>go('concert'), { bg:'band_concert', subtitle:'Band Competition' });
  }
  const def = SAILORS[n];
  if(!ensurePool()) return;
  beginBattle({ isNpc:true, name:def.label, npcId:'sailor'+n, concertFight:true,
    waves: def.waves.map(w=>w.map(e=>({...e, nerfed:false}))),
    bgKey:'battle_band_concert',
    onWin: ()=> onSailorWin(n) });
}

async function onSailorWin(n){
  const c = concertState();
  if(!c.sailors.includes(n)) c.sailors.push(n);
  state.inventory.tokens = (state.inventory.tokens||0) + 5;
  await saveProfile();
  const left = 5 - sailorsBeaten();
  challengeResult('⚓', 'Sailor sent packing',
    (left ? `He shuffles off, grumbling. <b>${left}</b> still crowding the stage.`
          : `The last of them wanders away. Behind you, a guitar finally makes it through a whole bar.`) +
    `<br><br><b>+5 Skill Tokens</b>`,
    'concert');
}

/* The competition result, and what it leaves behind. */
function bandAftermath(){
  storyModal(npcPortrait('electric_master','⚡',130,'transparent'), 'They win it',
    `They win the competition, of course. You can hear it from the harbour.<br><br>` +
    `By evening the five of them are loading amplifiers onto a lorry, bound for a tour that takes ` +
    `in every region on the map.<br><br>` +
    `The Dojo doors stay shut. A new sign hangs on them:<br><br>` +
    `<div class="dojo-sign">ELECTRIC DOJO — <b>CLOSED</b><br><br>` +
    `<b>Djenta</b> has hung up her gloves for a guitar.<br>` +
    `We are <b>seeking a new Dojo Master</b>.<br><br>` +
    `<i>Strength alone will not do. Come and be judged.</i></div>`,
    ()=>go('challenge'), { bg:'band_concert', subtitle:'Band Competition' });
}

function onBandTap(){
  const c = concertState();
  if(sailorsBeaten() < 5){
    return storyModal(npcPortrait('electric_master','⚡',120,'transparent'), 'Not yet',
      `She shakes her head before you've finished asking.<br><br>` +
      `"That's not our deal. <b>Get rid of these pests first!</b>"`,
      ()=>go('concert'), { bg:'band_concert', subtitle:'Band Competition' });
  }
  if(c.bandCleared) return toast('You have already beaten all five.');
  confirmDialogHtml(
    `All five of the Electric Dojo, <b>back to back</b>, with no chance to heal between them.<br><br>` +
    `If your team falls you start again from the first.<br><br>` +
    `Ready?`,
    ()=> startBandGauntlet(0));
}

/* Five trainers, one continuous run. */
function startBandGauntlet(i){
  const m = ELECTRIC_BAND[i];
  ui.bandIndex = i;
  if(!ensurePool()) return;
  beginBattle({ isNpc:true, name:m.label, npcId:m.id,
    waves: m.waves.map(w=>w.map(e=>({...e, nerfed:false}))),
    bgKey:'battle_band_concert',
    bandRun:true, concertFight:true,
    onWin: ()=> onBandStageWin(i) });
}
async function onBandStageWin(i){
  if(i < ELECTRIC_BAND.length-1){
    const nxt = ELECTRIC_BAND[i+1];
    return storyModal(npcPortrait(nxt.id,'⚡',120,'transparent'), 'Next!',
      `No rest, no healing — the next one is already plugging in.<br><br>` +
      `<b>${escapeHtml(nxt.label)}</b> steps up.`,
      ()=> startBandGauntlet(i+1), { bg:'band_concert', subtitle:'Band Competition' });
  }
  const c = concertState();
  c.bandCleared = true;
  const r3 = state.progress.region3;
  r3.shipPass = true;
  r3.dojoOpen = false;              // she is leaving; the Dojo needs a new master
  state.inventory.protein = (state.inventory.protein||0) + 7;
  await saveProfile();
  storyModal(npcPortrait('electric_master','⚡',130,'transparent'), "Djenta's swan song",
    `She is out of breath and, oddly, delighted.<br><br>` +
    `"All five. Nobody's done that." She unslings her guitar and looks at it for a moment.<br><br>` +
    `"That was my <b>swan song</b>, you know. Win or lose today, I'm going pro — the band, the touring, ` +
    `all of it. The Dojo's had the best of me."<br><br>` +
    `She presses a crate of supplements into your arms, and a stamped card on top.<br><br>` +
    `<b>+7 Protein Supplements</b><br><b>Ship pass — RRS Vane Shear</b><br><br>` +
    `<i>"The sailors gave us that for putting up with them. You've earned it more than we have."</i>`,
    ()=>bandAftermath(), { bg:'band_concert', subtitle:'Band Competition' });
}


/* ============================================================
   THE LOSING ACTS
   Once the band has gone, the rest of the bill is still hanging about. Five
   comically wrong performers, and one who is genuinely good.
   ============================================================ */
const FAILSTAR_LV = 65;
const FAILSTARS = [
  { id:'failstar1', act:'a country ballad on a banjo, with four extra verses nobody asked for',
    robbed:'"Robbed! That was <b>storytelling</b>. Rock doesn\'t have storytelling."',
    zone:'Tranquil Forest', mons:['rat','bird','moth'] },
  { id:'failstar2', act:'a slow blues number about a harbour crane',
    robbed:'"They wouldn\'t know <b>soul</b> if it bit them. I was robbed and everyone knows it."',
    zone:'Sacred Grove', mons:['sparrow','squirrel','deer','grass_starter'] },
  { id:'failstar3', act:'a rap listing every tree species in the region, with no beat',
    robbed:'"Sixteen bars, zero mistakes. <b>Robbed.</b> The judges couldn\'t keep up."',
    zone:'Rocky Caverns', mons:['earth_snake','ground_starter','golem','bat'] },
  { id:'failstar4', act:'hip-hop, over a backing track that is mostly seagulls',
    robbed:'"That beat was ahead of its time. I was <b>robbed</b> by people who like guitars."',
    zone:'Water Dojo', mons:['starfish','seahorse','duck','water_starter'] },
  { id:'failstar5', act:'breakdancing. There is no music at all.',
    robbed:'"It\'s a <b>music</b> competition, they said. Well, I was robbed, and my knees are fine."',
    zone:'Volcanic Caldera', mons:['snail','boobybird','firefly','fire_starter','toad'] },
];

function failstarDone(id){ return (concertState().failstars||[]).includes(id); }
function figlioDone(){ return !!concertState().figlio; }

function openFailstar(i){
  const f = FAILSTARS[i];
  if(failstarDone(f.id)) return toast('They have played for you already.');
  document.body.classList.add('in-scene');
  window.scrollTo(0,0);
  setScreenBg('band_concert');
  $('#brandSub').textContent = 'Band Competition';
  screenEl.innerHTML = `
    <div class="scene">
      <div class="scene-emblem">${npcPortrait(f.id,'🎤',140,'transparent')}</div>
      <div class="scene-title">A performance</div>
      <div class="scene-body">
        <p>They perform <b>${escapeHtml(f.act)}</b></p>
        <p>It goes on for some time.</p>
        <p>Finally they stop, beaming, and ask what you thought.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;">
        <button class="btn btn-ghost" id="fsKind">"It was… really something."</button>
        <button class="btn btn-primary" id="fsHonest">Tell them honestly</button>
      </div>
    </div>`;
  $('#fsKind').addEventListener('click', ()=>{
    document.body.classList.remove('in-scene');
    storyModal(npcPortrait(f.id,'🎤',130,'transparent'), 'Vindicated',
      `Their whole face lights up.<br><br>${f.robbed}<br><br>` +
      `<i>They go back to rehearsing, louder than before.</i>`,
      ()=>go('concert'), { bg:'band_concert', subtitle:'Band Competition' });
  });
  $('#fsHonest').addEventListener('click', ()=>{
    document.body.classList.remove('in-scene');
    storyModal(npcPortrait(f.id,'🎤',130,'transparent'), 'They take it badly',
      `Their face falls, then hardens.<br><br>` +
      `"Oh, a <b>critic</b>. Fine. Let's see how your <i>opinions</i> hold up in a battle."`,
      ()=>startFailstarFight(i), { bg:'band_concert', subtitle:'Band Competition' });
  });
}

function startFailstarFight(i){
  const f = FAILSTARS[i];
  if(!ensurePool()) return;
  beginBattle({ isNpc:true, name:'Performer', npcId:f.id, concertFight:true,
    bgKey:'battle_band_concert',
    waves: f.mons.map(sp=>[{ species:sp, level:FAILSTAR_LV, ai:'best', nerfed:false }]),
    onWin: ()=> onFailstarWin(i) });
}
async function onFailstarWin(i){
  const f = FAILSTARS[i];
  const c = concertState();
  c.failstars = c.failstars || [];
  if(!c.failstars.includes(f.id)) c.failstars.push(f.id);
  state.inventory.tokens = (state.inventory.tokens||0) + 5;
  await saveProfile();
  challengeResult('🎤', 'A fair review',
    `"…Alright. Maybe the banjo was a lot."<br><br>They shake your hand, grudgingly.<br><br>` +
    `<b>+5 Skill Tokens</b>`, 'concert');
}

/* ============================================================
   THE DOJO SUCCESSION
   Two teams argue for the empty Electric Dojo: three siblings who want it to
   stay electric, and three fighters sent by the Great Sage dojo. Each team is
   fought straight through with no healing between members.
   ============================================================ */
const FIGHT_WAVE1 = (lv)=>[
  {species:'boxer',   level:lv, ai:'power1'},
  {species:'kicker',  level:lv, ai:'power1'},
  {species:'spinner', level:lv, ai:'power1'},
];
const YOGA_WAVE  = (lv)=>[{species:'yoga',level:lv,ai:'best'},{species:'yoga',level:lv,ai:'best'}];
const JUDO_WAVE  = (lv)=>[
  {species:'judo_blue', level:lv, ai:'best'},
  {species:'judo_red',  level:lv, ai:'best'},
  {species:'weasel',    level:lv, ai:'best'},
];
const APE_WAVE   = (lv)=>[
  {species:'fighting_ape', level:lv, ai:'best'},
  {species:'lizardape',    level:lv, ai:'best'},
  {species:'strongman',    level:lv, ai:'best'},
];

const GREAT_SAGE_TEAM = [
  { id:'physical_disciple1', label:'Sage Disciple', waves:[ FIGHT_WAVE1(63), YOGA_WAVE(65) ] },
  { id:'physical_disciple2', label:'Sage Disciple', waves:[ FIGHT_WAVE1(63), JUDO_WAVE(65) ] },
  { id:'physical_disciple3', label:'Sage Disciple', waves:[ FIGHT_WAVE1(63), JUDO_WAVE(65), APE_WAVE(67) ] },
];

const DOJO_E_WAVE1 = (lv)=>[
  {species:'thunderdog',  level:lv, ai:'power1'},
  {species:'zebra',       level:lv, ai:'power1'},
  {species:'thunderlion', level:lv, ai:'power1'},
];
const ELECTRIC_SIBLINGS = [
  { id:'electric_new_master1', label:'Electric Sibling', waves:[ DOJO_E_WAVE1(63),
      [{species:'thunderhound',level:67,ai:'best'},{species:'thundersquirrel',level:67,ai:'best'}],
      [{species:'electric_starter',level:71,ai:'best',crowned:true,supplements:10}] ] },
  { id:'electric_new_master2', label:'Electric Sibling', waves:[ DOJO_E_WAVE1(63),
      [{species:'thunderhound',level:67,ai:'best'},{species:'magnet',level:67,ai:'best'}],
      [{species:'giraffe',level:71,ai:'best',crowned:true,supplements:10}] ] },
  { id:'electric_new_master3', label:'Electric Sibling', waves:[ DOJO_E_WAVE1(63),
      [{species:'thunderhound',level:67,ai:'best'},{species:'tiger',level:67,ai:'best'}],
      [{species:'thunderhound',level:71,ai:'best',crowned:true,supplements:10}] ] },
];

/* ============================================================
   THE SUCCESSION — who should hold the Electric Dojo?
   Two teams, each fought straight through without healing. You may rest
   between teams. Then you decide, and something very old turns up to watch.
   ============================================================ */
function dojoState(){
  const r3 = state.progress.region3;
  r3.dojo = r3.dojo || { started:false, electricDone:false, sageDone:false,
                          verdict:null, stone:false };
  return r3.dojo;
}
function hasNewt(){
  return state.party.concat(state.storage).some(m=>m.species==='newt' || m.species==='newt_baby');
}

function renderDojo(){
  const d = dojoState();
  if(!d.started) return dojoIntro();
  setScreenBg('challenge');
  playMusicChain(['zone_electric_dojo','region3','region']);
  $('#brandSub').textContent = 'Electric Dojo';
  const both = d.electricDone && d.sageDone;

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Challenge</button>
    <div class="screen-title">The Electric Dojo</div>
    <div class="screen-sub">Two claims. One hall.</div>

    <div class="challenge-card ${d.electricDone?'cleared':''}" id="teamE">
      ${ELECTRIC_SIBLINGS.map(m=>npcPortrait(m.id,'⚡',44,'transparent')).join('')}
      <div style="flex:1;">
        <div class="cc-title">The Siblings ${d.electricDone?'<span class="clear-tag">Judged</span>':''}</div>
        <div class="cc-desc">${d.electricDone
          ? 'Judged — but they will go again any time, for the exercise.'
          : 'Three of them, back to back. They grew up in this hall.'}</div>
      </div>
    </div>

    <div class="challenge-card ${d.sageDone?'cleared':''}" id="teamS">
      ${GREAT_SAGE_TEAM.map(m=>npcPortrait(m.id,'🥋',44,'transparent')).join('')}
      <div style="flex:1;">
        <div class="cc-title">The Sage Disciples ${d.sageDone?'<span class="clear-tag">Judged</span>':''}</div>
        <div class="cc-desc">${d.sageDone
          ? 'Judged — but they will go again any time, for the exercise.'
          : 'Three of them, back to back. They came a very long way.'}</div>
      </div>
    </div>

    ${d.verdict
      ? `<div class="phase-flag">You gave the hall to <b>${d.verdict==='electric'?'the siblings':'the Sage disciples'}</b>. It is settled.</div>`
      : (both ? `<button class="btn btn-primary" id="giveVerdict" style="margin-top:14px;">Give your verdict</button>`
              : `<div class="phase-flag">Test both teams before you decide. You may rest in between.</div>`)}
    <button class="btn btn-ghost" id="returnBtn" style="margin-top:10px;">Return</button>
  `;
  $('#backBtn').addEventListener('click', ()=>go('challenge'));
  $('#returnBtn').addEventListener('click', ()=>go('challenge'));
  /* Both teams will go again as often as you like — for the exercise only. */
  $('#teamE').addEventListener('click', ()=> d.electricDone ? rematchTeam('electric') : startTeamRun('electric', 0));
  $('#teamS').addEventListener('click', ()=> d.sageDone    ? rematchTeam('sage', 0)   : startTeamRun('sage', 0));
  const gv = $('#giveVerdict');
  if(gv && !d.verdict) gv.addEventListener('click', ()=> dojoVerdict());
}

async function dojoIntro(){
  const d = dojoState();
  d.started = true;
  await saveProfile();
  storyModal(npcPortrait('electric_new_master3','⚡',140,'transparent'), 'Two claims',
    `The Dojo doors are open again, but the hall is not quiet.<br><br>` +
    `On one side stand <b>three siblings</b>, sleeves rolled, arguing that the hall has been ` +
    `electric for four generations and ought to stay that way.<br><br>` +
    `On the other, <b>three fighters</b> in unfamiliar colours, who bow very correctly and say ` +
    `nothing at all until spoken to.`,
    ()=>dojoIntro2(), { bg:'challenge', subtitle:'Electric Dojo' });
}
function dojoIntro2(){
  storyModal(npcPortrait('physical_disciple2','🥋',140,'transparent'), 'The Great Sage dojo',
    `"We are sent by the <b>Great Sage Grandmaster</b>," the tallest says. "Standards here have ` +
    `slipped. A hall without a master is a hall going to waste."<br><br>` +
    `"We have taken three dojos already. We will take this one properly — by being better."<br><br>` +
    `The siblings look as though they would like to say something and have decided not to.`,
    ()=>dojoIntro3(), { bg:'challenge', subtitle:'Electric Dojo' });
}
function dojoIntro3(){
  storyModal(npcPortrait('electric_new_master3','⚡',140,'transparent'), '"You decide"',
    `The eldest sibling turns to you.<br><br>` +
    `"You beat the band. Every one of them, back to back." She says it without resentment. ` +
    `"Nobody here can say you don't know what strong looks like."<br><br>` +
    `"So test us. Both teams, however you like. Then <b>say who should have the hall</b>, and ` +
    `we'll all of us live with it."<br><br>` +
    `<i>Each team is fought straight through, without healing. You may rest between teams.</i>`,
    ()=>go('dojo'), { bg:'challenge', subtitle:'Electric Dojo' });
}

/* A friendly rematch: the same fights, XP only, no tokens and no proteins. */
function rematchTeam(which){
  const first = which === 'electric' ? ELECTRIC_SIBLINGS[0] : GREAT_SAGE_TEAM[0];
  storyModal(npcPortrait(first.id, which==='electric'?'⚡':'🥋', 130, 'transparent'),
    which==='electric' ? 'The siblings want another go' : 'The disciples want another go',
    which === 'electric'
      ? `The eldest is already rolling her shoulders.<br><br>` +
        `<b>"You caught us cold last time. Again — properly."</b><br><br>` +
        `<i>All three, back to back. Nothing at stake but the exercise.</i>`
      : `They are lined up before you have finished crossing the hall.<br><br>` +
        `<b>"We have been drilling. We would like to know whether it helped."</b><br><br>` +
        `<i>All three, back to back. Nothing at stake but the exercise.</i>`,
    ()=> startTeamRun(which, 0, true),
    { bg:'challenge', subtitle:'Electric Dojo' });
}

/* Each team is a continuous run, like the band gauntlet. */
function teamRoster(which){ return which==='electric' ? ELECTRIC_SIBLINGS : GREAT_SAGE_TEAM; }
function startTeamRun(which, i, rematch){
  const roster = teamRoster(which);
  const m = roster[i];
  if(!ensurePool()) return;
  ui.dojoRun = { which, i, rematch:!!rematch };
  beginBattle({ isNpc:true, name:m.label, npcId:m.id, concertFight:true,
    bgKey:'battle_electric_dojo',
    waves: m.waves.map(w=>w.map(e=>({...e, nerfed:false}))),
    onWin: ()=> onTeamStageWin(which, i, !!rematch) });
}
async function onTeamStageWin(which, i, rematch){
  const roster = teamRoster(which);
  // a rematch is for the exercise: experience only, nothing else changes hands
  if(!rematch){
    state.inventory.protein = (state.inventory.protein||0) + 3;
    await saveProfile();
  }
  if(i < roster.length-1){
    const nxt = roster[i+1];
    return storyModal(npcPortrait(nxt.id, which==='electric'?'⚡':'🥋', 120,'transparent'), 'Next!',
      (rematch ? '' : `<b>+3 Protein Supplements</b><br><br>`) + `No rest — the next one is already stepping onto the mat.`,
      ()=> startTeamRun(which, i+1, rematch), { bg:'challenge', subtitle:'Electric Dojo' });
  }
  const d = dojoState();
  if(which==='electric') d.electricDone = true; else d.sageDone = true;
  await saveProfile();
  storyModal(npcPortrait(roster[i].id, which==='electric'?'⚡':'🥋', 120,'transparent'), 'All three',
    which==='electric'
      ? `The siblings sit down where they stand, grinning at the ceiling.<br><br>` +
        `"That's us done. Whatever you decide — that was a good fight."<br><br><b>+3 Protein Supplements</b>`
      : `The disciples bow, deeply and without complaint.<br><br>` +
        `"Thank you. That was instructive."<br><br><b>+3 Protein Supplements</b>`,
    
    ()=>go('dojo'), { bg:'challenge', subtitle:'Electric Dojo' });
}

/* --- the verdict --- */
function dojoVerdict(){
  document.body.classList.add('in-scene');
  window.scrollTo(0,0);
  setScreenBg('challenge');
  $('#brandSub').textContent = 'Electric Dojo';
  screenEl.innerHTML = `
    <div class="scene">
      <div class="scene-title">Who should have the hall?</div>
      <div class="scene-body">
        <p>Both teams line up. Nobody is pretending this doesn't matter.</p>
        <p>Whatever you say, they have agreed to live with.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;">
        <button class="btn btn-primary" id="vE">⚡ The siblings — it is their home</button>
        <button class="btn btn-primary" id="vS">🥋 The Sage disciples — they are stronger</button>
      </div>
    </div>`;
  $('#vE').addEventListener('click', ()=>settleVerdict('electric'));
  $('#vS').addEventListener('click', ()=>settleVerdict('sage'));
}

async function settleVerdict(pick){
  document.body.classList.remove('in-scene');
  const d = dojoState();
  if(d.verdict) return go('dojo');      // already settled; no second stone
  d.verdict = pick;
  await saveProfile();
  storyModal(npcPortrait(pick==='electric'?'electric_new_master3':'physical_disciple3',
                         pick==='electric'?'⚡':'🥋',140,'transparent'),
    pick==='electric' ? 'The hall stays electric' : 'The hall changes hands',
    pick==='electric'
      ? `The siblings do not cheer. The eldest simply bows, once, and holds it a long moment.<br><br>` +
        `The disciples accept it without argument. "Then we were not better. We will come back when ` +
        `we are."`
      : `The disciples bow as one. "We will not waste it."<br><br>` +
        `The siblings take it standing. "Teach it properly," the eldest says, "or we'll be back."`,
    ()=>monkeyArrives(pick), { bg:'challenge', subtitle:'Electric Dojo' });
}

/* --- and then the sky gets his attention --- */
function monkeyArrives(pick){
  storyModal(monPortrait('monkey_king',150,{view:'front',bare:true,stage:1}), 'Something older',
    `The doors do not open. He is simply there, sitting on a beam that nobody remembers being ` +
    `strong enough to hold anything.<br><br>` +
    `All three Sage disciples are on the floor before you register them moving — foreheads down, ` +
    `arms out.<br><br>` +
    `<b>"Great Sage."</b><br><br>` +
    `He does not look at them.`,
    ()=>monkeyVerdict(pick), { bg:'challenge', subtitle:'Electric Dojo' });
}
function monkeyVerdict(pick){
  storyModal(monPortrait('monkey_king',150,{view:'front',bare:true,stage:1}),
    pick==='sage' ? '"Adequate."' : '"You lost."',
    pick==='sage'
      ? `He glances at the kneeling disciples once.<br><br><b>"Adequate."</b><br><br>` +
        `They stay down. He has already stopped considering them.`
      : `He glances at the kneeling disciples once.<br><br><b>"You lost. To a child."</b><br><br>` +
        `Nobody gets up.`,
    ()=>monkeyToPlayer(), { bg:'challenge', subtitle:'Electric Dojo' });
}
function monkeyToPlayer(){
  storyModal(monPortrait('monkey_king',150,{view:'front',bare:true,stage:1}), 'To you',
    `Now he looks at you. It is not a comfortable thing.<br><br>` +
    `<b>"You've grown."</b><br><br>` +
    `A pause.<br><br>` +
    `<b>"Not enough. My friend who keeps that dojo would end you. The man with my crown ` +
    `would not need to try."</b><br><br>` +
    `<b>"Find the stones. Then come and find me."</b><br><br>` +
    `The beam is empty. It may always have been.`,
    ()=>dojoReward(), { bg:'challenge', subtitle:'Electric Dojo' });
}

/* --- the siblings settle up --- */
async function dojoReward(){
  const d = dojoState();
  if(d.stone) return go('challenge');   // the stone is given once, ever
  if(hasNewt()){
    d.stone = true;
    state.inventory.electricStone = true;
    await saveProfile();
    return storyModal(uiIcon('electric_stone',130,'⚡'), 'The Electric Stone',
      `The youngest sibling has been staring at your party for some time.<br><br>` +
      `"That's… you have it. You actually have it." She turns out her pack and presses a stone ` +
      `into your hands, still warm.<br><br>` +
      `"We came here for the <b>Thunder Newt</b>. We heard one was hurt — that something had been ` +
      `<b>taken</b> out of it." She swallows. "We brought this to help. It should be yours now, ` +
      `since you're the one carrying it."<br><br>` +
      `<b>Electric Stone received.</b>`,
      ()=>go('challenge'), { bg:'challenge', subtitle:'Electric Dojo' });
  }
  await saveProfile();
  storyModal(npcPortrait('electric_new_master3','⚡',140,'transparent'), 'What they came for',
    `The eldest sibling stops you before you reach the door.<br><br>` +
    `"We didn't come here for the hall. Not really." She shows you a stone in her palm — ` +
    `an <b>Electric Stone</b>, bright as a struck match.<br><br>` +
    `"There's a <b>Thunder Newt</b> somewhere in this region. Something was cut out of it and ` +
    `it's been dying slowly ever since. This would mend it."<br><br>` +
    `"They say it's gone deep — into the <b>volcano</b>, where it's warm. And that it only shows ` +
    `itself to trainers strong enough to be worth the risk."<br><br>` +
    `<i>"If you find it before we do — come back. The stone is for the Newt, not for us."</i>`,
    ()=>go('challenge'), { bg:'challenge', subtitle:'Electric Dojo' });
}

/* --- Figlio: the runner-up, and rather more than that --- */
function openFiglio(){
  if(figlioBeatenToday())
    return storyModal(npcPortrait('figlio','🎙️',130,'transparent'), 'Not today',
      `He waves you off, good-naturedly.<br><br>` +
      `"Once a day. I have a voice to look after."<br><br>` +
      `<i>Come back tomorrow — he will be a little stronger.</i>`,
      ()=>go('concert'), { bg:'band_concert', subtitle:'Band Competition' });
  if(figlioDone()) return figlioRematch();
  storyModal(npcPortrait('figlio','🎙️',140,'transparent'), 'The runner-up',
    `He sings unaccompanied, standing very still, and the whole square goes quiet for it.<br><br>` +
    `When he finishes there is a pause before anyone remembers to applaud.<br><br>` +
    `He asks what you thought, and for once you don't have to be kind about it.`,
    ()=>figlioChallenge(), { bg:'band_concert', subtitle:'Band Competition' });
}
function figlioRematch(){
  storyModal(npcPortrait('figlio','🎙️',140,'transparent'), 'Again, then',
    `He is already reaching for a ball before you've said anything.<br><br>` +
    `"Same terms. I've been training." A flicker of a smile. ` +
    `"Beating you is the only review I trust."<br><br>` +
    `<i>His team starts at level <b>${66+figlioBonus()}</b>.</i>`,
    ()=>startFiglioFight(), { bg:'band_concert', subtitle:'Band Competition' });
}

function figlioChallenge(){
  storyModal(npcPortrait('figlio','🎙️',140,'transparent'), '"Then prove it"',
    `He accepts the praise with a small nod, and doesn't look pleased.<br><br>` +
    `"Second. Again." He straightens his collar. "I lost to that band. But <b>you</b> beat them — ` +
    `so if I beat you, that settles what I actually am."<br><br>` +
    `"Humour me. As a trainer, not a singer."`,
    ()=>startFiglioFight(), { bg:'band_concert', subtitle:'Band Competition' });
}
/* He can be met once a day, and he is a level stronger each time. */
function today(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function figlioBeatenToday(){ return concertState().figlioDay === today(); }
function figlioBonus(){ return concertState().figlioWins || 0; }

function startFiglioFight(){
  if(!ensurePool()) return;
  /* +1 level per victory, but the staircase flattens at 91 so it stays a
     hard fight rather than an impossible one. */
  const up = Math.min(figlioBonus(), 20);
  beginBattle({ isNpc:true, name:'Figlio', npcId:'figlio', concertFight:true,
    bgKey:'battle_band_concert', figlio:true,
    waves:[
      [{species:'ground_starter',  level:66+up, ai:'best'}],
      [{species:'psychic_starter', level:67+up, ai:'best'}],
      [{species:'ghost_starter',   level:68+up, ai:'best'}],
      [{species:'physical_starter',level:69+up, ai:'best'}],
      [{species:'flying_starter',  level:70+up, ai:'best'}],
      [{species:'howler',level:71+up, ai:'best', crowned:true, supplements:10}],
    ],
    onWin: onFiglioWin });
}
async function onFiglioWin(){
  const c = concertState();
  const firstTime = !c.figlio;
  c.figlio = true;
  c.figlioDay = today();
  c.figlioWins = (c.figlioWins||0) + 1;
  state.medals.silver = (state.medals.silver||0) + 3;
  if(firstTime) state.inventory.dragonStone = true;
  await saveProfile();
  if(!firstTime){
    return challengeResult('🎙️', 'A closer thing each time',
      `He straightens his collar, breathing hard.<br><br>` +
      `"Better. I'll be better still tomorrow."<br><br>` +
      `<b>+3 Silver Medals</b> · next time his team is level <b>${66+figlioBonus()}</b> and up.`,
      'concert');
  }
  storyModal(npcPortrait('figlio','🎙️',140,'transparent'), '"You know the name, then"',
    `He returns his last monster to its ball and studies you for a long moment.<br><br>` +
    `"You fight like someone who's been in the caverns." A pause. "You've met my father."<br><br>` +
    `<b>Padrino.</b> He says the name the way you'd hold something at arm's length.`,
    ()=>figlioReveal2(), { bg:'band_concert', subtitle:'Band Competition' });
}
function figlioReveal2(){
  storyModal(npcPortrait('figlio','🎙️',140,'transparent'), 'The prodigal son',
    `"I was to be <b>Sottocapo</b>. Groomed for it since I could walk." He shrugs, and for the first ` +
    `time looks his age. "I wanted a life that was mine. So I sing."<br><br>` +
    `"He's found someone else, I hear. Some trainer he's <b>adopted</b> — young, talented, very keen ` +
    `to belong to something." He looks away. "I almost feel sorry for them."<br><br>` +
    `"I can't agree with what he wants. The <b>ultimate monster</b>, stitched together from stolen ` +
    `cores. That isn't strength, it's collecting."`,
    ()=>figlioGift(), { bg:'band_concert', subtitle:'Band Competition' });
}
function figlioGift(){
  storyModal(uiIcon('dragon_stone', 130, '🐉'), 'The Dragon Stone',
    `He presses a stone into your hand — the same shape as the rough one from the plant, but ` +
    `cut and clear, and humming.<br><br>` +
    `"A <b>Dragon Stone</b>. Attach it to any dragon you're raising and it will learn far faster. ` +
    `You'll want that."<br><br>` +
    `"There are <b>elemental stones</b> like it scattered about, and they're the only things I know of ` +
    `that answer a stolen core. Collect them."<br><br>` +
    `<i>"Good luck with my father. You'll need more than luck."</i>`,
    ()=>go('concert'), { bg:'band_concert', subtitle:'Band Competition' });
}

