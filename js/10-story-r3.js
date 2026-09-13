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
  storyModal(npcPortrait('electric_master','⚡',130,'transparent'), 'The Electric Master',
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
    `Our Master has hung up her gloves for a guitar.<br>` +
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
  storyModal(npcPortrait('electric_master','⚡',130,'transparent'), 'A swan song',
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
  const up = figlioBonus();          // +1 level per victory, forever
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

