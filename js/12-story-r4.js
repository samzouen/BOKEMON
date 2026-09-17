/* ============================================================
   REGION 4 — THE NORTH SEA
   Everything happens on the RRS Vane Shear. Three decks:
     top       sailors, five fishermen, and the dive platform
     quarters  Jax, and two sailors who only want to talk
     research  the nine, once the Whalelord has spoken to you
   ============================================================ */

/* ------------------------------------------------------------
   THE SHIP'S COMPANY
   Role first, then the name. Everyone aboard is a he except Scientists 5, 6
   and 9, Diver Ines and Fisher Lena.
   ------------------------------------------------------------ */
const CREW = {
  ship_captain:        'Captain Halvard',
  shipkeeper:          'Shipkeeper Petreus',
  cook:                'Cook Gus',
  diver1:              'Diver Pell',
  diver2:              'Diver Ines',          // she
  fisherman1:          'Fisher Tobias',
  fisherman2:          'Fisher Marek',
  fisherman3:          'Fisher Onni',
  fisherman4:          'Fisher Stig',
  fisherman5:          'Fisher Lena',         // she
  sailor1:             'Sailor Rikk',
  sailor2:             'Sailor Dov',
  sailor3:             'Sailor Emre',
  sailor4:             'Sailor Nils',
  sailor5:             'Sailor Cato',
  scientist1:          'Scientist Aldous',
  scientist2:          'Scientist Pim',
  scientist3:          'Scientist Bertrand',
  scientist4:          'Scientist Casimir',
  scientist5:          'Scientist Odile',     // she
  scientist6:          'Scientist Mireille',  // she — and the one who did it
  scientist7:          'Scientist Osric',
  scientist8:          'Scientist Thaddeus',
  scientist9:          'Scientist Rhona',     // she
  scientist_supervisor:'Supervisor Barnaby',
};
function crewName(id){ return CREW[id] || 'Crew'; }
/* Just the given name, for when the role is already obvious from context. */
function crewFirst(id){ const n = crewName(id); return n.split(' ').slice(1).join(' ') || n; }

function r4(){
  const p = state.progress;
  p.region4 = p.region4 || {
    captainMet:false, diversBeaten:false,
    dives:0,                 // wild dives WON — drives the whale wall
    wallFound:false,
    whaleDives:0,            // dives taken since the wall appeared
    ghostMet:false, ghostAccepted:false,
    rivalBeaten:false, stoneWon:false,
    solved:false,
  };
  return p.region4;
}
const R4_WILD   = ['starfish','seahorse','duck','sea_turtle','lanternfish'];
const R4_ELITE  = ['plesiosaur','otter','loong','ninja'];
const DIVES_TO_WALL = 30;
const WHALE_DIVES_TO_GHOST = 3;

function r4Level(){
  const best = Math.max(...battleParty().map(m=>m.level), 66);
  return Math.max(66, Math.min(80, best));
}

/* ---------- the captain, once ---------- */
function captainIntro(){
  const g = r4();
  g.captainMet = true; saveProfile();
  storyModal(npcPortrait('ship_captain','⚓',140,'transparent'), crewName('ship_captain'),
    `The Vane Shear is a working ship and everyone on it is busy except you.<br><br>` +
    `The captain finds you at the rail — an old man, tanned to leather, small and built ` +
    `like a winch.<br><br>` +
    `"You're the one who saw off half of Port Akrotiri's troublemakers. Good. Then you'll ` +
    `understand why I'm worried about mine."<br><br>` +
    `He hands you a chart covered in crossed-out lines. His hands are enormous for a man that size.`,
    ()=>captainIntro2(), { bg:'weather_deck', subtitle:'Weather Deck' });
}
function captainIntro2(){
  storyModal(npcPortrait('ship_captain','⚓',140,'transparent'), 'Forty years of charts',
    `"Migration patterns. Forty years of them, and every one wrong since spring. The whales ` +
    `have stopped moving. They've started attacking anything that comes close."<br><br>` +
    `"We're sailing <b>east</b>, across the North Sea, and they are sitting square in the way."<br><br>` +
    `"My researchers want data. I want my crew in one piece. You want passage east."<br><br>` +
    `A pause. "We may be able to help one another."`,
    ()=>go('weather_deck'), { bg:'weather_deck', subtitle:'Weather Deck' });
}

/* ---------- TOP DECK ---------- */
function renderWeatherDeck(){
  const g = r4();
  if(!g.captainMet) return captainIntro();
  /* The deck plan is shown full-size below, so the backdrop must be something
     else — using the same key would paint the ship behind itself. */
  setScreenBg('sea');
  playMusicChain(['zone_weather_deck','region4','region']);
  $('#brandSub').textContent = 'Weather Deck';

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <!-- Pinned to the plan of the ship: bow at the top, stern at the bottom.
         Every position is a percentage of the artwork, so it holds at any size. -->
    <div class="ship-deck" id="shipDeck">
      <img src="assets/zones/weather_deck.png" alt="" class="ship-img"
           onerror="this.style.display='none';this.parentNode.classList.add('no-art')">

      <!-- Nothing stands here that does not have a job. The fishermen are a
           reaction test: five possible positions, under a second to react, on
           artwork already full of winches and nets. Anything else on deck is
           noise the eye has to rule out first. The off-duty sailors are below,
           on the cabin deck, where talking belongs. -->

      <!-- five fishermen down the starboard rail, alongside the nets -->
      ${[[70,41],[72,48],[73,55],[72,62],[70,69]].map((p,i)=>`
        <button class="deck-pin fisher" style="left:${p[0]}%;top:${p[1]}%;" data-fisher="${i+1}">
          ${npcPortrait('fisherman'+(i+1),'🎣',40,'transparent')}</button>`).join('')}

      <!-- the dive platform: one at each end of the port grating, so they read
           as flanking the ladder rather than huddling together -->
      <button class="deck-pin dive-pin ${g.diversBeaten?'open':''}" style="left:24%;top:40%;" data-diver="1">
        ${npcPortrait('diver1','🤿',48,'transparent')}</button>
      <button class="deck-pin dive-pin ${g.diversBeaten?'open':''}" style="left:24%;top:52%;" data-diver="2">
        ${npcPortrait('diver2','🤿',48,'transparent')}
        <div class="dive-label">${g.diversBeaten ? '🌊 Dive' : '🚫 Blocked'}</div>
      </button>


      ${g.ghostAccepted && !g.rivalBeaten ? `
        <button class="deck-pin ghost-here" style="left:22%;top:80%;" data-ghost="1">
          ${monPortrait('whalelord',60,{view:'front',bare:true})}</button>` : ''}
    </div>
    <div class="phase-flag">${g.diversBeaten
      ? 'Tap the divers to go over the side.'
      : 'The divers are not letting anyone past.'}</div>
  `;
  $('#backBtn').addEventListener('click', ()=>{ stopBirdLoop(); go('explore'); });
  screenEl.querySelectorAll('[data-fisher]').forEach(b=>b.addEventListener('click', ()=>fisherChat()));
  // the birds come and go whether or not you are watching
  if(battleParty().some(m=>m.currentHp>0)) startBirdLoop(); else stopBirdLoop();

  screenEl.querySelectorAll('[data-diver]').forEach(b=>b.addEventListener('click', ()=>{
    if(!r4().diversBeaten) return diversBlock();
    startDive();
  }));
  const gh = screenEl.querySelector('[data-ghost]');
  if(gh) gh.addEventListener('click', ()=>ghostChat('top'));
}

/* All five are off duty on the cabin deck — the weather deck is for working. */
const SAILOR_LINES = [
  `"Oi — it's you." He has the decency to look sheepish. "Look, about the competition. ` +
  `We'd had a few. We're not usually like that."`,
  `He holds up a drumstick with a signature scrawled down it.<br><br>` +
  `"<b>Djenta</b>. Signed it herself, after the last set. Says she's never going back to the dojo." ` +
  `He looks at it like it's a relic. "Best night of my life, that."`,
  `"You beat the whole band. The <i>whole</i> band." He shakes his head slowly. ` +
  `"Djenta shook your hand and everything. I'd not have washed it."`,
  `"Six weeks at sea and the cook's run out of onions. <i>Onions.</i>"`,
  `"You're the one the captain's banking on." He looks you over. "No pressure."`,
];
function sailorChat(n){
  storyModal(npcPortrait('sailor'+n,'⚓',120,'transparent'), crewName('sailor'+n),
    SAILOR_LINES[(n-1) % SAILOR_LINES.length],
    ()=>go('cabin_deck'), { bg:'cabin_deck', subtitle:'Cabin Deck' });
}
/* ---------- the raids ---------- */
let _birdTimer = null, _birdLive = null, _birdRunning = false;
function stopBirdLoop(){
  clearTimeout(_birdTimer); _birdTimer = null;
  if(_birdLive && _birdLive.el && _birdLive.el.parentNode) _birdLive.el.remove();
  _birdLive = null; _birdRunning = false;
}
function startBirdLoop(){
  stopBirdLoop();
  _birdRunning = true;
  const schedule = ()=>{
    _birdTimer = setTimeout(()=>{
      if(!_birdRunning) return stopBirdLoop();
      const marks = Array.from(document.querySelectorAll('.deck-pin.fisher'));
      if(!marks.length) return stopBirdLoop();
      pulseFisher(marks[Math.floor(Math.random()*marks.length)], schedule);
    }, 700 + Math.random()*1800);
  };
  schedule();
}
function pulseFisher(host, next){
  const el = document.createElement('div');
  el.className = 'gen-pulse bird-pulse';
  const win = 800 + Math.random()*200;           // 0.8–1.0s, as on the Generator Floor
  el.style.setProperty('--pulse-ms', win + 'ms');
  /* Do NOT touch host.style.position. The pin is already absolute, which makes
     it a containing block on its own — overwriting it with `relative` dropped
     the fisherman out of its pinned spot and into normal flow, which is why a
     sprite teleported and the ripple bloomed in the corner. */
  host.appendChild(el);
  const live = { el }; _birdLive = live;
  el.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    if(_birdLive !== live) return;
    _birdLive = null; el.remove(); stopBirdLoop();
    startBirdRaid();
  });
  setTimeout(()=>{
    if(_birdLive !== live) return;
    _birdLive = null;
    el.classList.add('gone');
    setTimeout(()=>{ if(el.parentNode) el.remove(); }, 260);
    next();
  }, win);
}

const FISHER_LINES = [
  `"Birds." He says it the way other men swear. "Every haul, the moment it's up. ` +
  `Faster than you'd credit."`,
  `"Third net this week." He holds up something torn. "Whatever's coming up is ` +
  `bigger than what we're fishing for."`,
  `"Used to be you'd get herring." He looks at the water without affection. ` +
  `"Now you get whatever's angry."`,
  `"Keep an eye on the rail. When it goes red, something's already moving."`,
];
function fisherChat(){
  storyModal('🎣', 'Starboard rail',
    FISHER_LINES[Math.floor(Math.random()*FISHER_LINES.length)] +
    `<br><br><i>Tap a red pulse the moment it appears.</i>`,
    ()=>go('weather_deck'), { bg:'weather_deck', subtitle:'Weather Deck' });
}

/* ---------- the divers' trial ---------- */
function diversBlock(){
  storyModal(npcPortrait('diver1','🤿',130,'transparent'), 'The dive platform',
    `Two divers block the ladder. Neither moves.<br><br>` +
    `<b>"Captain says you're diving. Captain says a lot of things."</b><br><br>` +
    `The woman beside him doesn't look up from her gauge.<br><br>` +
    `<b>"Nothing down there is friendly any more. If you can't handle us, the water will eat you."</b>`,
    ()=>startDiverTrial(0), { bg:'weather_deck', subtitle:'Weather Deck' });
}
const DIVER_GENERIC = ()=>{
  const pick = ()=>R4_WILD[Math.floor(Math.random()*R4_WILD.length)];
  return [pick(),pick(),pick()].map(s=>({species:s, level:65, ai:'best'}));
};
const DIVER_WAVE2 = ()=>{
  const pick = ()=>R4_WILD[Math.floor(Math.random()*R4_WILD.length)];
  return [{species:pick(),level:65,ai:'best'},
          {species:'water_starter',level:65,ai:'best'},
          {species:pick(),level:65,ai:'best'}];
};
const DIVERS = [
  { id:'diver1', label:'Diver', closer:'loong' },
  { id:'diver2', label:'Diver', closer:'ninja' },
];
function startDiverTrial(i){
  if(!ensurePool()) return;
  const d = DIVERS[i];
  beginBattle({ isNpc:true, name:crewName(d.id), npcId:d.id, bgKey:'battle_diving',
    waves:[ DIVER_GENERIC(), DIVER_WAVE2(),
            [{species:'plesiosaur',level:65,ai:'best'},{species:'otter',level:65,ai:'best'}],
            [{species:d.closer,level:65,ai:'best'}] ],
    onWin: ()=> onDiverWin(i) });
}
async function onDiverWin(i){
  if(i < DIVERS.length-1){
    return storyModal(npcPortrait(DIVERS[i+1].id,'🤿',120,'transparent'), 'Her turn',
      `She is already on the platform with her mask pushed up.<br><br>` +
      `"Same test. Don't expect me to go easier."`,
      ()=>startDiverTrial(i+1), { bg:'weather_deck', subtitle:'Weather Deck' });
  }
  const g = r4();
  g.diversBeaten = true;
  await saveProfile();
  storyModal(npcPortrait('diver1','🤿',130,'transparent'), 'The ladder is yours',
    `"…Right. Yes. Fine." He steps aside and, after a moment, actually smiles.<br><br>` +
    `<b>"Tank's yours. Don't touch the whales — they're not themselves."</b>`,
    ()=>go('weather_deck'), { bg:'weather_deck', subtitle:'Weather Deck' });
}

/* ---------- DIVING ---------- */
function startDive(){
  const g = r4();
  if(!ensurePool()) return;
  if(g.wallFound && !g.solved) return confirmWhaleDive();
  ui.currentZone = { id:'diving', name:'Dive' };
  const lv = r4Level();
  const roll = ()=>{
    const r = Math.random();
    if(r < 0.05) return R4_ELITE[Math.floor(Math.random()*R4_ELITE.length)];
    if(r < 0.20) return 'water_starter';
    return R4_WILD[Math.floor(Math.random()*R4_WILD.length)];
  };
  /* Ordinary wilds come up small, so your sons can raise them. Elites and the
     starter arrive at whatever stage their level allows. A Loong is never
     small — nobody nets a hatchling dragon by accident. */
  const ANY_FORM = ['plesiosaur','otter','ninja','water_starter'];
  const spec = (sp, level)=>{
    if(sp === 'loong')            return { species:sp, level, forceStage:R4_MAXSTAGE };
    if(ANY_FORM.includes(sp))     return { species:sp, level };
    return { species:sp, level, forceStage:0 };
  };
  const n = 1 + Math.floor(Math.random()*3);
  beginBattle({
    waves:[ Array.from({length:n},()=> spec(roll(), lv + Math.floor(Math.random()*3)-1)) ],
    isNpc:false, allowCatch:true, name:'Wild encounter', bgKey:'battle_diving',
    onWin: ()=> onDiveWin() });
}

/* Thirty won dives and the ship stops. No bar, no counter — the dives simply
   feel like time passing, because they are. */
async function onDiveWin(){
  const g = r4();
  const fell = ((ui.battle && ui.battle.enemies) || []).filter(e=>e.hp<=0).map(e=>e.species);
  if(!g.wallFound){
    g.dives++;
    if(g.dives >= DIVES_TO_WALL){ g.wallFound = true; await saveProfile(); return resumeVictory(true, whaleWallFound); }
  }
  const got = await checkHunts(fell);
  await saveProfile();
  if(got && got.length) return resumeVictory(true, ()=>huntPaid(got));
  resumeVictory();
}
function huntPaid(got){
  const g = got[0];
  const nm = SPECIES[g.species] ? SPECIES[g.species].name : g.species;
  storyModal(npcPortrait('scientist'+g.sci,'🧑‍🔬',130,'transparent'), 'That is exactly it',
    `They take the readings before you have finished surfacing.<br><br>` +
    `<b>"A ${escapeHtml(nm)}. Do you know how long we have been asking for one?"</b><br><br>` +
    got.map(x=>`<b>+${x.reward} Skill Tokens</b> — #${x.sci}`).join('<br>'),
    ()=>go('weather_deck'), { bg:'laboratory_deck', subtitle:'Laboratory' });
}
function whaleWallFound(){
  storyModal(npcPortrait('ship_captain','⚓',140,'transparent'), 'The ship has stopped',
    `You surface into shouting.<br><br>` +
    `<b>"We've stopped. Look for yourself."</b><br><br>` +
    `The sea ahead is not empty. It is <i>full</i>, in a way water should not be, and every ` +
    `one of them is facing the ship.<br><br>` +
    `<b>"Whales. Hundreds. Sitting across the lane like a wall and not one of them is moving aside."</b><br><br>` +
    `He does not raise his voice. "I've sailed forty years. I've never seen an animal do that on purpose."`,
    ()=>go('weather_deck'), { bg:'weather_deck', subtitle:'Weather Deck' });
}

function confirmWhaleDive(){
  const g = r4();
  if(g.whaleDives >= WHALE_DIVES_TO_GHOST && !g.ghostMet) return quietWater();
  storyModal('🐋', 'The whales are enraged',
    `Every one of them is facing the ship, and they have not moved in hours.<br><br>` +
    `<i>Going over the side now means going through them.</i><br><br>` +
    `<b>Proceed with caution?</b>`,
    ()=>startWhaleFight(), { bg:'weather_deck', subtitle:'Weather Deck', confirm:true,
      onCancel:()=>go('weather_deck') });
}
/* Enraged whales are the grown ones — the pod's fighters. Once the Whalelord is
   avenged the sea goes back to holding both young and old. */
function whaleWave(n){
  const solved = r4().solved;
  return Array.from({length:3},()=>({
    species:'whale', level:r4Level(), enraged:!solved, ai:'best',
    forceStage: solved ? undefined : R4_MAXSTAGE,
  }));
}
function startWhaleFight(){
  const g = r4();
  g.whaleDives++;
  saveProfile();
  ui.currentZone = { id:'diving', name:'The wall' };
  beginBattle({
    waves: Array.from({length:6}, (_,i)=>whaleWave(i)),
    isNpc:false, allowCatch:true, name:'The wall', bgKey:'battle_whales',
    onWin: ()=> resumeVictory() });
}

/* The fourth dive: they let you through. */
function quietWater(){
  storyModal('🐋', 'They are not attacking',
    `They do not come for you.<br><br>` +
    `Two hundred tonnes of animal drifts past close enough to touch, and none of them so ` +
    `much as turns. Something has told them to let you through.<br><br>` +
    `Then, from further down than light reaches, a voice that is not a sound:<br><br>` +
    `<b>"Avenge me."</b>`,
    ()=>ghostIntro(), { bg:'battle_whales', subtitle:'The deep' });
}
async function ghostIntro(){
  const g = r4();
  g.ghostMet = true;
  await saveProfile();
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), 'Something older',
    `It is dead. You know this the way you know which way is up.<br><br>` +
    `<b>"Child. You carry a dragon with a hole in it. So do I."</b><br><br>` +
    `<b>"There was a man with a <span style="color:var(--cinnabar)">raven</span>. He held the power of cores that were never his — ` +
    `many of them, all at once — and he opened me from jaw to fin and left me to sink."</b><br><br>` +
    `<b>"I did not sink. I carried my core down where he could not follow, and I lived."</b>`,
    ()=>ghostIntro2(), { bg:'battle_whales', subtitle:'The deep' });
}
function ghostIntro2(){
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), 'Then the quiet ones',
    `A long pause. The light through it shifts.<br><br>` +
    `<b>"Then other people came. Quieter ones. They knew where to look, which means somebody told them."</b><br><br>` +
    `Something enormous and old moves behind the words.<br><br>` +
    `<b>"They took it while I still needed it. That is what killed me."</b><br><br>` +
    `<b>"My people have no one to follow now. They will not move until this is finished."</b>`,
    ()=>ghostAsk(), { bg:'battle_whales', subtitle:'The deep' });
}
function ghostAsk(){
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), '"Avenge me"',
    `<b>"Avenge me. Find my core."</b><br><br>` +
    `<b>"Then your ship may pass east."</b>`,
    ()=>ghostAccept(), { bg:'battle_whales', subtitle:'The deep' });
}
async function ghostAccept(){
  const g = r4();
  g.ghostAccepted = true;
  await saveProfile();
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), 'It follows you up',
    `It rises with you, and it does not stop at the surface.<br><br>` +
    `<i>The Whalelord can now be found aboard the ship. The <b>Research Deck</b> is open.</i>`,
    ()=>go('weather_deck'), { bg:'weather_deck', subtitle:'Weather Deck' });
}

function ghostChat(where){
  const g = r4();
  const body = g.rivalBeaten
    ? `<b>"I have watched him fight now. That is not the power that opened me."</b><br><br>` +
      `<b>"Look to the ones in white coats."</b>`
    : (where === 'quarters'
      ? `It hangs in the passage outside one particular cabin and will not move on.<br><br>` +
        `<b>"There is a strange power in that room. Not the raven's. Something borrowed."</b><br><br>` +
        `<b>"I will not name a man on a feeling. Make him show you what he has."</b>`
      : `<b>"Nothing up here. Salt and rope and frightened men."</b><br><br>` +
        `<b>"Below, though. Below there is something."</b>`);
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), 'The Whalelord',
    body, ()=>go(where === 'quarters' ? 'cabin_deck' : 'weather_deck'),
    { bg: where === 'quarters' ? 'cabin_deck' : 'weather_deck' });
}

/* ---------- QUARTERS DECK ---------- */
function renderCabinDeck(){
  const g = r4();
  /* The plan is shown full size below, so the backdrop must be something else. */
  setScreenBg('sea');
  playMusicChain(['zone_cabin_deck','region4','region']);
  $('#brandSub').textContent = 'Cabin Deck';

  /* Six cabins, three a side, down the middle of the ship. Five sailors and
     one rival — exactly enough. */
  const CABINS = [
    { x:37, y:44 }, { x:64, y:44 },   // forward pair, either side of the passage
    { x:37, y:56 }, { x:64, y:56 },   // middle pair
    { x:37, y:67 }, { x:64, y:67 },   // after pair
  ];
  const occupants = [
    { kind:'sailor', n:1 }, { kind:'sailor', n:2 },
    { kind:'sailor', n:3 }, { kind:'rival' },
    { kind:'sailor', n:4 }, { kind:'sailor', n:5 },
  ];

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="ship-deck" id="cabinDeck">
      <img src="assets/zones/cabin_deck.png" alt="" class="ship-img"
           onerror="this.style.display='none';this.parentNode.classList.add('no-art')">

      <!-- the chart room, forward under the bridge. The shipkeeper keeps his
           salvage here now, where a quartermaster would actually keep it. -->
      <button class="deck-pin" style="left:44%;top:17%;" data-captain="1">
        ${npcPortrait('ship_captain','⚓',50,'transparent')}
        <div class="dive-label">Chart room</div>
      </button>
      <button class="deck-pin" style="left:36%;top:24%;" data-keeper="1">
        ${npcPortrait('shipkeeper','⚓',50,'transparent')}
        <div class="dive-label">Salvage</div>
      </button>

      <!-- six cabins -->
      ${occupants.map((o,i)=>{
        const c = CABINS[i];
        return o.kind === 'rival'
          ? `<button class="deck-pin" style="left:${c.x}%;top:${c.y}%;" data-rival="1">
               ${npcPortrait('rival','🧑',54,'transparent')}
               <div class="dive-label">${g.rivalBeaten ? 'Nothing to bet' : "Someone's cabin"}</div>
             </button>`
          : `<button class="deck-pin" style="left:${c.x}%;top:${c.y}%;" data-sailor="${o.n}">
               ${npcPortrait('sailor'+o.n,'⚓',48,'transparent')}</button>`;
      }).join('')}

      <!-- the galley, aft -->
      <button class="deck-pin" style="left:63%;top:79%;" data-cook="1">
        ${npcPortrait('cook','🧑‍🍳',50,'transparent')}
        <div class="dive-label">Galley</div>
      </button>

      ${g.ghostAccepted && !g.rivalBeaten ? `
        <button class="deck-pin ghost-here" style="left:38%;top:88%;" data-ghost="1">
          ${monPortrait('whalelord',58,{view:'front',bare:true})}</button>` : ''}
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('explore'));
  screenEl.querySelectorAll('[data-sailor]').forEach(b=>b.addEventListener('click', ()=>sailorChat(+b.dataset.sailor)));
  const cp = screenEl.querySelector('[data-captain]');
  if(cp) cp.addEventListener('click', ()=>chartRoom());
  const kp = screenEl.querySelector('[data-keeper]');
  if(kp) kp.addEventListener('click', ()=>shipkeeperShop());
  const ck = screenEl.querySelector('[data-cook]');
  if(ck) ck.addEventListener('click', ()=>cookChat());
  const rb = screenEl.querySelector('[data-rival]');
  if(rb) rb.addEventListener('click', ()=>rivalCabin());
  const gh = screenEl.querySelector('[data-ghost]');
  if(gh) gh.addEventListener('click', ()=>ghostChat('quarters'));
}

/* The chart room. He is always working on the same problem, and what he says
   depends entirely on how far you have got with it. */
const CHART_LINES = {
  early: [
    `He has the same chart out, and it has more crossings-out than it did yesterday.<br><br>` +
    `"Forty years I've plotted this run. Never once had to draw a line round something."`,
    `"Researchers want samples. Crew want to be somewhere else. And I want to know ` +
    `what's got into the whales."<br><br>He taps the chart. "One of those I can actually do something about."`,
  ],
  blocked: [
    `He does not look up.<br><br>` +
    `"Still there. All of them. Not feeding, not moving, not going round us."<br><br>` +
    `"An animal that won't move for a ship is an animal that's decided something."`,
    `"I've tried going north about. Tried south. They shift with us." He rubs his eyes. ` +
    `"That's not instinct. That's a picket line."`,
    `"Three days behind schedule and nothing to put in the log but <i>whales, still</i>."<br><br>` +
    `He is quieter for a moment. "They're not attacking us, you know. They're just... not letting us past."`,
  ],
  knowing: [
    `"You've been down there. You've seen whatever it is." He studies you. ` +
    `"I'll not ask you to explain. I've stopped expecting this trip to make sense."<br><br>` +
    `"Just tell me when I can sail."`,
    `"Whatever you're doing about it — keep doing it." A pause. "Faster, if you can manage it."`,
  ],
  solved: [
    `The chart is rolled up for the first time since you came aboard.<br><br>` +
    `"Lane's clear. Whales went at first light, all together, like somebody called them."<br><br>` +
    `Then his face changes. "Two of my researchers. In irons. On my ship."`,
    `"I signed her on myself." He says it flatly. "Read her papers. Shook her hand."<br><br>` +
    `"And the supervisor — I'd have trusted that man with the ship."`,
    `"Cosa Nostia." He says the name like something he has found in the bilges.<br><br>` +
    `"We've been carrying a delivery for them the whole way out, and I plotted the course myself."`,
    `"You'll forgive me if I'm not celebrating." He almost smiles. "I'm glad, mind. ` +
    `I'm just going to be some time being glad about it."`,
  ],
};
function chartRoom(){
  const g = r4();
  const stage = g.solved ? 'solved'
              : g.ghostAccepted ? 'knowing'
              : g.wallFound ? 'blocked' : 'early';
  const lines = CHART_LINES[stage];
  storyModal(npcPortrait('ship_captain','⚓',130,'transparent'), crewName('ship_captain'),
    lines[Math.floor(Math.random()*lines.length)],
    ()=>go('cabin_deck'), { bg:'cabin_deck', subtitle:'Cabin Deck' });
}

/* The cook has opinions, and one of them turns out to matter. */
function cookChat(){
  const g = r4();
  let body;
  if(g.solved){
    body = `"Heard they took two of the white coats off in irons." He is scrubbing a pot ` +
           `with real violence. "Never trusted a man who says yes to everything."<br><br>` +
           `He slides a bowl across the counter without being asked.`;
  } else if(g.ghostAccepted){
    body = `"You want feeding or you want gossip?" He does not wait for an answer.<br><br>` +
           `"Odd ship, this one. Researchers eating at two in the morning, coming in wet." ` +
           `He shrugs. "Not my business. I just cook."`;
  } else {
    body = `"Six weeks out and I'm down to the tinned stuff." He looks genuinely wounded by this.<br><br>` +
           `"You eat, though. Whatever else you're doing up there, you eat."`;
  }
  storyModal(npcPortrait('cook','🧑‍🍳',130,'transparent'), crewName('cook'),
    body, ()=>go('cabin_deck'), { bg:'cabin_deck', subtitle:'Cabin Deck' });
}

/* ============================================================
   THE CABIN DECK CHALLENGES
   Once the Whalelord smells something down here, everybody aboard is fair game.
   Crew fight at full evolution and full skill; only the last wave is crowned.
   ============================================================ */
const R4_MAXSTAGE = 9;                       // force the grown form, whatever it is

/* The three openers are the same for both officers — the same birds, the same
   small fry, the same divers' catch. Only the back half tells them apart. */
const OFFICER_OPEN = (lv)=>[
  [{species:'pelican',level:lv,  ai:'best', forceStage:R4_MAXSTAGE},
   {species:'swan',   level:lv,  ai:'best', forceStage:R4_MAXSTAGE},
   {species:'mantaray',level:lv, ai:'best', forceStage:R4_MAXSTAGE}],
  [{species:'starfish',level:lv+1, ai:'best', forceStage:R4_MAXSTAGE},
   {species:'duck',    level:lv+1, ai:'best', forceStage:R4_MAXSTAGE},
   {species:'seahorse',level:lv+1, ai:'best', forceStage:R4_MAXSTAGE}],
  [{species:'cormorant',level:lv+2, ai:'best'},
   {species:'sea_turtle',level:lv+2, ai:'best', forceStage:R4_MAXSTAGE},
   {species:'cormorant',level:lv+2, ai:'best'}],
];
const SHIPKEEPER_TEAM = {
  label:'Shipkeeper', npcId:'shipkeeper',
  waves:[ ...OFFICER_OPEN(71),
    [{species:'otter',level:74,ai:'best',forceStage:R4_MAXSTAGE},
     {species:'water_starter',level:74,ai:'best',forceStage:R4_MAXSTAGE},
     {species:'whale',level:74,ai:'best',forceStage:R4_MAXSTAGE}],
    [{species:'plesiosaur',level:75,ai:'best'},
     {species:'moon_swan',level:75,ai:'best'},
     {species:'ninja',level:75,ai:'best',forceStage:R4_MAXSTAGE}],
    [{species:'loong',level:76,ai:'best',forceStage:R4_MAXSTAGE,crowned:true,supplements:10}],
  ],
};
const CAPTAIN_TEAM = {
  label:'Ship Captain', npcId:'ship_captain',
  waves:[ ...OFFICER_OPEN(72),
    [{species:'whale',level:75,ai:'best',forceStage:R4_MAXSTAGE},
     {species:'water_starter',level:75,ai:'best',forceStage:R4_MAXSTAGE},
     {species:'plesiosaur',level:75,ai:'best'}],
    [{species:'ninja',level:76,ai:'best',forceStage:R4_MAXSTAGE},
     {species:'moon_swan',level:76,ai:'best'},
     {species:'loong',level:76,ai:'best',forceStage:R4_MAXSTAGE}],
    /* An otter to finish: a sea-dog's animal, and the only one he named. */
    [{species:'otter',level:77,ai:'best',forceStage:R4_MAXSTAGE,crowned:true,supplements:10}],
  ],
};

/* ---------- THE RIVAL, AND THE WAGER ---------- */
/* Stones are lost and won in this order, on both sides. */
const WAGER_ORDER = ['dragonStone','electricStone','waterStone','ghostStone'];
const WAGER_TOKENS = 50;

function rivalStones(){
  const g = r4();
  g.rivalStones = g.rivalStones || ['ghostStone'];   // his own, to begin with
  return g.rivalStones;
}
/* What YOU put up: your first stone by the order, else tokens, else nothing. */
function playerStake(){
  for(const id of WAGER_ORDER){ if(state.inventory[id]) return { kind:'stone', id }; }
  if((state.inventory.tokens||0) >= WAGER_TOKENS) return { kind:'tokens', n:WAGER_TOKENS };
  return { kind:'none' };
}
/* What HE puts up: anything he took from you first, his Ghost Stone last. */
function rivalStake(){
  const his = rivalStones();
  for(const id of WAGER_ORDER){ if(his.includes(id) && id !== 'ghostStone') return id; }
  return his.includes('ghostStone') ? 'ghostStone' : null;
}
function r4StoneName(id){
  const d = ELEMENTAL_STONES.find(s=>s.id===id);
  return d ? d.name : id;
}

function rivalCabin(){
  const g = r4();
  if(!rivalStake()) return storyModal(npcPortrait('rival','🧑',140,'transparent'), 'Nothing left',
    `<b>"That's the lot."</b> He is smiling, and it doesn't reach anything.<br><br>` +
    `<b>"Nothing left to bet. Enjoy them while they're yours."</b>`,
    ()=>go('cabin_deck'), { bg:'cabin_deck', subtitle:'Cabin Deck' });

  const mine = playerStake(), his = rivalStake();
  const stakeLine = mine.kind === 'stone' ? `your <b>${r4StoneName(mine.id)}</b>`
                  : mine.kind === 'tokens' ? `<b>${WAGER_TOKENS} Skill Tokens</b>`
                  : null;
  storyModal(npcPortrait('rival','🧑',140,'transparent'), 'He was waiting',
    `He is leaning on the rail outside his cabin like he has been there for hours, and ` +
    `probably has.<br><br>` +
    `<b>"Took you long enough."</b><br><br>` +
    `He doesn't look surprised to see you. That is the first thing that feels wrong.<br><br>` +
    (stakeLine
      ? `<b>"Don't. I know what you're about to ask."</b> A shrug. <b>"Fine — I'll make it worth ` +
        `something. Stones on the table."</b><br><br>` +
        `<i>His <b>${r4StoneName(his)}</b> against ${stakeLine}.</i>`
      : `<b>"You've got nothing."</b> He looks you over and laughs, not unkindly.<br><br>` +
        `<b>"Keep your pocket money. I'll beat you for free."</b><br><br>` +
        `<i>His <b>${r4StoneName(his)}</b> against nothing at all.</i>`),
    ()=>startRivalWager(), { bg:'cabin_deck', subtitle:'Cabin Deck' });
}

function startRivalWager(){
  if(!ensurePool()) return;
  ui.r4Wager = { mine: playerStake(), his: rivalStake() };
  beginBattle({ isNpc:true, name:'Jax', npcId:'rival', bgKey:'battle_quarters',
    /* Six borrowed things, each carrying a skill that is not its own. */
    /* Six borrowed things, each carrying a skill that is not its own — and
       deliberately out of step with one another. Overheat sharpens Firehound
       and does nothing at all for the Eagle behind it. */
    waves:[
      [{species:'dragon',     level:70, ai:'dragon',    veryHigh:{type:'Dragon', plus:1}}],
      [{species:'tricerarmor',level:70, ai:'tricer',    veryHigh:{type:'Steel',  plus:1}}],
      [{species:'thundercat', level:70, ai:'maxer'}],
      [{species:'loong',      level:70, ai:'maxer'}],
      [{species:'firehound',  level:70, ai:'firehound', veryHigh:{type:'Fire',   plus:1}}],
      [{species:'eagle',      level:75, ai:'stoop', crowned:true, supplements:10,
        veryHigh:{type:'Flying', plus:0}}],
    ],
    onWin: ()=> onR4RivalWin(), onLose: ()=> onR4RivalLose() });
}

async function onR4RivalWin(){
  const w = ui.r4Wager || {}; ui.r4Wager = null;
  const g = r4();
  const won = w.his;
  if(won){
    state.inventory[won] = true;
    rivalStones().splice(rivalStones().indexOf(won), 1);
  }
  if(!g.rivalBeaten){ g.rivalBeaten = true; }
  if(won === 'ghostStone') g.stoneWon = true;
  await saveProfile();
  storyModal(npcPortrait('rival','🧑',140,'transparent'), 'He hands it over',
    `He looks at the stone for a moment before he gives it up.<br><br>` +
    `<b>"Keep it. I'll want it back."</b><br><br>` +
    `<b>${r4StoneName(won)} received.</b>` +
    (g.stoneWon ? `<br><br><i>The Whalelord has moved to the Research Deck.</i>` : ''),
    ()=>go('cabin_deck'), { bg:'cabin_deck', subtitle:'Cabin Deck' });
}
async function onR4RivalLose(){
  const w = ui.r4Wager || {}; ui.r4Wager = null;
  const mine = w.mine || { kind:'none' };
  if(mine.kind === 'stone'){
    state.inventory[mine.id] = false;
    state.inventory[stoneOnKey(mine.id)] = null;
    rivalStones().push(mine.id);
  } else if(mine.kind === 'tokens'){
    state.inventory.tokens = Math.max(0, (state.inventory.tokens||0) - mine.n);
  }
  await saveProfile();
  storyModal(npcPortrait('rival','🧑',140,'transparent'), 'He pockets it',
    mine.kind === 'none'
      ? `<b>"Told you."</b> He is already walking away.<br><br><i>You lost nothing. Come back stronger.</i>`
      : `<b>"Keep practising."</b> He pockets it without looking at it.<br><br>` +
        `<b>"You'll want it back. Come find me when you think you can take it."</b><br><br>` +
        `<i>Lost: ${mine.kind==='stone' ? r4StoneName(mine.id) : WAGER_TOKENS + ' Skill Tokens'}.</i>`,
    ()=>go('cabin_deck'), { bg:'cabin_deck', subtitle:'Cabin Deck' });
}


/* ============================================================
   THE INVESTIGATION
   Nine researchers. Beat all nine to earn a guess; two guesses a day. Each
   wrong accusation buys another clue, up to three. The clues describe two
   creatures the Whalelord saw — a scientist is a suspect if EITHER of theirs
   fits, and only all three together close it.
   ============================================================ */
const SCI = [
  { n:1, look:'bespectacled, holding a flask',    wild:['starfish','starfish','starfish'], elite:'plesiosaur' },
  { n:2, look:'small, bespectacled',              wild:['duck','duck','duck'],             elite:'water_starter' },
  { n:3, look:'bespectacled, carrying a journal', wild:['sea_turtle','sea_turtle'],        elite:'plesiosaur' },
  { n:4, look:'cocky, bespectacled',              wild:['seahorse','seahorse','seahorse'], elite:'ninja' },
  { n:5, look:'curly ponytail, clipboard',        wild:['starfish','starfish','duck'],     elite:'water_starter' },
  { n:6, look:'long black hair, clipboard',       wild:['lanternfish','lanternfish'],      elite:'loong' },
  { n:7, look:'senior',                           wild:['duck','duck','seahorse'],         elite:'otter' },
  { n:8, look:'senior, high forehead',            wild:['sea_turtle','sea_turtle','sea_turtle'], elite:'loong' },
  { n:9, look:'athletic redhead, red sunglasses', wild:['lanternfish','lanternfish'],      elite:'ninja' },
];
const CULPRIT = 6;
const ALIBI = { 1:5, 5:1, 2:7, 7:2, 3:8, 8:3, 4:9, 9:4 };
const GUESSES_PER_DAY = 2;

const CLUES = [
  `"There was a red glow on one of them. I could not tell if they were eyes, or a stone set in its hide."`,
  `"The other had no hands. No feet, no flippers. It moved the way weed moves."`,
  `"And then it flashed — bright, all at once — and the water bit me. I have not felt that since I was small."`,
];

function inv(){
  const g = r4();
  g.inv = g.inv || { beaten:[], firstWins:[], clues:1, guessDay:null, guesses:0, done:false };
  if(g.inv.guessDay !== today()){ g.inv.guessDay = today(); g.inv.guesses = 0; }
  return g.inv;
}
function sciBeaten(n){ return inv().beaten.includes(n); }
function allBeaten(){ return SCI.every(s=>sciBeaten(s.n)); }
function guessesLeft(){ return Math.max(0, GUESSES_PER_DAY - inv().guesses); }

/* ---------- the deck ---------- */
function renderLaboratoryDeck(){
  const g = r4();
  setScreenBg('laboratory_deck');
  playMusicChain(['zone_laboratory_deck','region4','region']);
  $('#brandSub').textContent = 'Laboratory';

  if(!g.rivalBeaten){
    screenEl.innerHTML = `
      <button class="back-link" id="backBtn">← Explore</button>
      <div class="screen-title">Laboratory Deck</div>
      <div class="phase-flag">The Whalelord will not come down here while it still has
        questions about the man in the cabin above.</div>`;
    return $('#backBtn').addEventListener('click', ()=>go('explore'));
  }
  if(g.solved) return renderLaboratoryAfter();

  const v = inv();
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="sci-top">
      <button class="deck-sprite" data-sup="1">
        ${npcPortrait('scientist_supervisor','🧑‍🔬',70,'transparent')}
        <div class="dive-label">${allBeaten() ? 'Report' : 'Supervisor'}</div>
      </button>
      <button class="deck-sprite ghost-here" style="position:static;" data-ghost="1">
        ${monPortrait('whalelord',70,{view:'front',bare:true})}
        <div class="dive-label">Clues</div>
      </button>
    </div>

    <div class="sci-grid">
      ${SCI.map(s=>`<button class="sci-cell ${sciBeaten(s.n)?'beaten':''}" data-sci="${s.n}">
        ${npcPortrait('scientist'+s.n,'🧑‍🔬',62,'transparent')}
        ${sciBeaten(s.n) ? `<svg class="sci-tick" viewBox="0 0 24 24"><path d="M4 12.5 L9.5 18 L20 6"
          fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
      </button>`).join('')}
    </div>

    <div class="phase-flag">${allBeaten()
      ? (guessesLeft() ? `All nine beaten. Tap the supervisor to name someone. <b>${guessesLeft()} guess${guessesLeft()>1?'es':''} left today.</b>`
                       : `No guesses left today. Think it over and come back tomorrow.`)
      : `Beat all nine to earn a guess. <b>${inv().beaten.length} / 9</b>`}</div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('explore'));
  screenEl.querySelectorAll('[data-sci]').forEach(b=>b.addEventListener('click', ()=>fightScientist(+b.dataset.sci)));
  screenEl.querySelector('[data-ghost]').addEventListener('click', ()=>showClues());
  screenEl.querySelector('[data-sup]').addEventListener('click', ()=>{
    if(!allBeaten()) return storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'),
      'Not yet', `"You've not spoken to everyone." He says it kindly, as he says everything.<br><br>` +
      `"Come back when you have."`, ()=>go('laboratory_deck'), { bg:'laboratory_deck' });
    if(!guessesLeft()) return storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'),
      'Sleep on it', `"You've made two accusations today. That's two more than most people make in a lifetime."<br><br>` +
      `"Take some time. Think it through properly."`, ()=>go('laboratory_deck'), { bg:'laboratory_deck' });
    go('accuse');
  });
}

function showClues(){
  const v = inv();
  storyModal(monPortrait('whalelord',140,{view:'front',bare:true}), 'What it saw',
    `<b>"Two of them swam beside the people who took it from me."</b><br><br>` +
    CLUES.slice(0, v.clues).map((c,i)=>`<div class="clue-line"><b>${i+1}.</b> ${c}</div>`).join('') +
    (v.clues < CLUES.length
      ? `<br><i>It remembers more. It has not thought of it yet.</i>`
      : `<br><i>That is everything.</i>`),
    ()=>go('laboratory_deck'), { bg:'laboratory_deck', subtitle:'Laboratory' });
}

/* ---------- fighting one of them ---------- */
function fightScientist(n){
  const s = SCI.find(x=>x.n===n);
  if(!ensurePool()) return;
  ui.r4Sci = n;
  beginBattle({ isNpc:true, name:crewName('scientist'+n), npcId:'scientist'+n, bgKey:'battle_laboratory',
    waves:[ s.wild.map(sp=>({species:sp, level:65, ai:'best'})),
            [{species:s.elite, level:65, ai:'best'}] ],
    onWin: ()=> onSciWin(n) });
}
async function onSciWin(n){
  const v = inv();
  const first = !v.firstWins.includes(n);
  if(!v.beaten.includes(n)) v.beaten.push(n);
  if(first){ v.firstWins.push(n); state.inventory.protein = (state.inventory.protein||0) + 1; }
  await saveProfile();
  storyModal(npcPortrait('scientist'+n,'🧑‍🔬',120,'transparent'), 'Beaten',
    `They pack their monsters away without much grace.<br><br>` +
    (first ? `<b>+1 Protein Supplement</b><br><br>` : '') +
    (allBeaten() ? `<i>That is all nine. The supervisor is waiting.</i>`
                 : `<i>${9 - inv().beaten.length} still to go.</i>`),
    ()=>go('laboratory_deck'), { bg:'laboratory_deck', subtitle:'Laboratory' });
}

/* ---------- the accusation board ---------- */
function renderAccuse(){
  const v = inv();
  setScreenBg('laboratory_deck');
  $('#brandSub').textContent = 'Name someone';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Research Deck</button>
    <div class="clue-box">
      <div class="clue-head">👻 What the Whalelord saw</div>
      ${CLUES.slice(0, v.clues).map((c,i)=>`<div class="clue-line"><b>${i+1}.</b> ${c}</div>`).join('')}
    </div>
    <div class="phase-flag">${guessesLeft()} guess${guessesLeft()>1?'es':''} left today. Tap someone to look closer.</div>
    <div class="acc-grid">
      ${SCI.map(s=>`<button class="acc-cell" data-acc="${s.n}">
        <div class="acc-face">${npcPortrait('scientist'+s.n,'🧑‍🔬',52,'transparent')}</div>
        <div class="acc-mons">
          ${monPortrait(s.wild[0],30,{bare:true})}${monPortrait(s.elite,30,{bare:true})}
        </div>
      </button>`).join('')}
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('laboratory_deck'));
  screenEl.querySelectorAll('[data-acc]').forEach(b=>b.addEventListener('click', ()=>focusScientist(+b.dataset.acc)));
}

/* A closer look at one of them, with their two creatures big enough to judge. */
function focusScientist(n){
  const s = SCI.find(x=>x.n===n), v = inv();
  const ov = document.createElement('div');
  ov.className = 'refine-scrim';
  ov.innerHTML = `
    <div class="refine-card">
      <div class="clue-box tight">
        ${CLUES.slice(0, v.clues).map((c,i)=>`<div class="clue-line"><b>${i+1}.</b> ${c}</div>`).join('')}
      </div>
      <div style="margin:14px 0 6px;">${npcPortrait('scientist'+n,'🧑‍🔬',92,'transparent')}</div>
      <div class="refine-sub">${escapeHtml(s.look)}</div>
      <div class="focus-mons">
        <div>${monPortrait(s.wild[0],64,{bare:true})}
          <div class="fm-name">${escapeHtml(SPECIES[s.wild[0]].name)}</div></div>
        <div>${monPortrait(s.elite,64,{bare:true})}
          <div class="fm-name">${escapeHtml(SPECIES[s.elite].name)}</div></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
        <button class="btn btn-primary" id="accYes">You're the culprit!</button>
        <button class="btn btn-ghost" id="accNo">Back</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
  ov.querySelector('#accNo').addEventListener('click', close);
  ov.querySelector('#accYes').addEventListener('click', ()=>{ close(); accuse(n); });
}

async function accuse(n){
  const v = inv();
  v.guesses++;
  await saveProfile();
  if(n === CULPRIT) return accuseCulprit();

  // wrong: an alibi, and someone to confirm it
  const buddy = ALIBI[n];
  if(v.clues < CLUES.length){ v.clues++; await saveProfile(); }
  storyModal(npcPortrait('scientist'+n,'🧑‍🔬',130,'transparent'), 'An alibi',
    `<b>"Me?"</b> They look more baffled than offended.<br><br>` +
    `<b>"I was in the wet lab all night. Ask ${buddy===9?'her':'them'}."</b>`,
    ()=>alibiConfirm(n, buddy), { bg:'laboratory_deck', subtitle:'Laboratory' });
}
function alibiConfirm(n, buddy){
  const v = inv();
  storyModal(npcPortrait('scientist'+buddy,'🧑‍🔬',130,'transparent'), 'Confirmed',
    `<b>"They were. I was there too — we were arguing about salinity, which took some hours."</b><br><br>` +
    `The supervisor appears at your elbow, gentle as ever.<br><br>` +
    `<b>"Easy does it. An accusation is a serious thing on a small ship."</b><br><br>` +
    `<b>"Look again. Take your time."</b>` +
    (v.clues <= CLUES.length ? `<br><br><i>The Whalelord has remembered something else.</i>` : ''),
    ()=>go('laboratory_deck'), { bg:'laboratory_deck', subtitle:'Laboratory' });
}

/* ---------- the culprit ---------- */
function accuseCulprit(){
  storyModal(npcPortrait('scientist6','🧑‍🔬',130,'transparent'), '"Me?"',
    `<b>"Me?"</b> She actually laughs.<br><br>` +
    `<b>"I was with the supervisor. All evening. Inventory."</b>`,
    ()=>culprit2(), { bg:'laboratory_deck', subtitle:'Laboratory' });
}
function culprit2(){
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'), 'He vouches for her',
    `<b>"She was. I'd stake my post on it."</b><br><br>` +
    `A beat. He turns to go.`,
    ()=>culprit3(), { bg:'laboratory_deck', subtitle:'Laboratory' });
}
function culprit3(){
  storyModal(npcPortrait('scientist9','🧑‍🔬',130,'transparent'), '"Wait."',
    `She has not moved from the rail.<br><br>` +
    `<b>"That's not what you were doing."</b><br><br>` +
    `<b>"I saw you at the dive platform. Two in the morning. In a suit."</b>`,
    ()=>culprit4(), { bg:'laboratory_deck', subtitle:'Laboratory' });
}
function culprit4(){
  storyModal(npcPortrait('diver1','🤿',130,'transparent'), 'The borrowed suit',
    `<b>"…He borrowed mine."</b> He looks ill. <b>"Said he'd dropped something over the side."</b><br><br>` +
    `<b>"He was gone about an hour."</b>`,
    ()=>culprit5(), { bg:'laboratory_deck', subtitle:'Laboratory' });
}
function culprit5(){
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'), 'The mask comes off',
    `The supervisor stops smiling. It is a small change and it makes him unrecognisable.<br><br>` +
    `<b>"An hour is generous. It took forty minutes."</b>`,
    ()=>culprit6(), { bg:'laboratory_deck', subtitle:'Laboratory' });
}
function culprit6(){
  storyModal(npcPortrait('scientist6','🧑‍🔬',130,'transparent'), '"No point hiding it"',
    `<b>"No point hiding it any more, then."</b><br><br>` +
    `She sets down the clipboard she has been carrying all week.<br><br>` +
    `<b>"Do you know what it costs to keep a ship like this at sea? We were three months ` +
    `from being shut down. Nobody would pay for us."</b>`,
    ()=>culprit7(), { bg:'laboratory_deck', subtitle:'Laboratory' });
}
function culprit7(){
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'), 'Who would pay',
    `<b>"<span style="color:var(--cinnabar)">Padrino</span> would. He offered us everything we needed — for one thing in return."</b><br><br>` +
    `<b>"The core. We were taking it to him in <b>Cosa Nostia</b>. That is where this ship has ` +
    `been sailing all along."</b><br><br>` +
    `<b>"Two more days east and it would have been his. You have cost us a great deal."</b>`,
    ()=>startCulpritFight(0), { bg:'laboratory_deck', subtitle:'Laboratory' });
}

/* She was holding most of it back. He was holding all of it. */
const CULPRIT_WAVES = [
  [{species:'lanternfish',level:78},{species:'lanternfish',level:78}],
  [{species:'seahorse',level:79},{species:'starfish',level:79},{species:'duck',level:79}],
  [{species:'plesiosaur',level:80},{species:'otter',level:80}],
  [{species:'loong',level:82,crowned:false}],
];
const SUP_WAVES = [
  [{species:'duck',level:80},{species:'starfish',level:80},{species:'seahorse',level:80}],
  [{species:'sea_turtle',level:81},{species:'sea_turtle',level:81}],
  [{species:'lanternfish',level:82},{species:'otter',level:82}],
  [{species:'ninja',level:83},{species:'plesiosaur',level:83}],
  [{species:'loong',level:84}],
  [{species:'water_dragon',level:85,crowned:true,supplements:10}],
];
function startCulpritFight(i){
  if(!ensurePool()) return;
  const who = i===0 ? { id:'scientist6', name:'Researcher', waves:CULPRIT_WAVES }
                    : { id:'scientist_supervisor', name:'Supervisor', waves:SUP_WAVES };
  beginBattle({ isNpc:true, name:who.name, npcId:who.id, bgKey:'battle_laboratory',
    waves: who.waves.map(w=>w.map(e=>({...e, ai:'best'}))),
    onWin: ()=> i===0 ? nextCulprit() : onMysterySolved() });
}
function nextCulprit(){
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'), 'His turn',
    `He has not moved. He is not going to run.<br><br>` +
    `<b>"She was always the better researcher. I am the better trainer."</b>`,
    ()=>startCulpritFight(1), { bg:'laboratory_deck', subtitle:'Laboratory' });
}

/* ---------- the ending ---------- */
async function onMysterySolved(){
  const g = r4();
  g.solved = true;
  await saveProfile();
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'), 'Taken below',
    `The crew take them below. Nobody says much.<br><br>` +
    `<b>"You understand nothing. That creature was <i>dying</i>. We took what it could no ` +
    `longer use — and Padrino paid us enough to keep forty people in work."</b><br><br>` +
    `<b>Whalelord:</b> "You took it while I still swam."`,
    ()=>theTheft(), { bg:'laboratory_deck', subtitle:'Laboratory' });
}
function theTheft(){
  storyModal(npcPortrait('rival','🧑',140,'transparent'), 'Over the rail',
    `The core is in a crate on the deck, wrapped in oilcloth, and the captain is sending ` +
    `for a guard.<br><br>` +
    `She does not arrive in time.<br><br>` +
    `He is over the rail before anyone shouts, and the thing rising out of the dark behind ` +
    `him is enormous and has wings.`,
    ()=>theTheft2(), { bg:'weather_deck', subtitle:'Weather Deck' });
}
function theTheft2(){
  storyModal(npcPortrait('rival','🧑',140,'transparent'), '"I\'m not, really"',
    `<b>"Sorry. I'm not, really."</b><br><br>` +
    `<b>"You know what this is? It's <span style="color:var(--cinnabar)">power</span>. Real power — the kind that made a ` +
    `dragon out of a rock and a king out of a monkey."</b><br><br>` +
    `<b>"Padrino's going to give me everything he has. His people, his money, all of it. ` +
    `And when he's finished, <u>I'll be the one in charge</u>."</b><br><br>` +
    `<b>"I want to be the strongest there has ever been. You never did. That's the whole ` +
    `difference between us."</b><br><br>` +
    `<i>And he is gone, east, with the core.</i>`,
    ()=>cuainJoins(), { bg:'weather_deck', subtitle:'Weather Deck' });
}
async function cuainJoins(){
  const mon = newMonster('whalelord', 66);
  if(state.party.length < 6) state.party.push(mon); else state.storage.push(mon);
  if(!state.caughtSpecies.includes('whalelord')) state.caughtSpecies.push('whalelord');
  await saveProfile();
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), 'It comes with you',
    `<b>"Then it is not here."</b> It sounds, impossibly, relieved. <b>"It is somewhere. ` +
    `That is more than I had this morning."</b><br><br>` +
    `<b>"I will come with you. I am less than I was — but not so little that you must carry me."</b><br><br>` +
    `Below, the whales part. The lane east is open.<br><br>` +
    `<b>The Whalelord joined your team at Lv 66.</b>`,
    ()=>go('laboratory_deck'), { bg:'weather_deck', subtitle:'Weather Deck' });
}

/* ---------- afterwards: scientist 9 takes over ---------- */
function renderLaboratoryAfter(){
  const g = r4();
  g.after = g.after || { day:null, beaten:false };
  if(g.after.day !== today()){ g.after.day = today(); g.after.beaten = false; }
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="screen-title">Laboratory Deck</div>
    <div class="screen-sub">Under new management.</div>
    <div class="sci-top">
      <button class="deck-sprite" data-nine="1">
        ${npcPortrait('scientist9','🧑‍🔬',80,'transparent')}
        <div class="dive-label">${g.after.beaten ? 'Beaten today' : 'Challenge'}</div>
      </button>
    </div>
    <div class="phase-flag">${g.after.beaten
      ? 'She has had enough for one day.'
      : 'Beat her for <b>5 Bronze Medals</b>. Once a day.'}</div>
    ${huntsPanel()}
  `;
  $('#backBtn').addEventListener('click', ()=>go('explore'));
  screenEl.querySelector('[data-nine]').addEventListener('click', ()=> startSupervisorDaily());
  wireHuntRows();
}
/* The same two rows appear on the Laboratory Deck and the Challenge page. */
function wireHuntRows(){
  screenEl.querySelectorAll('[data-hunt]').forEach(b=>
    b.addEventListener('click', ()=> huntRequest(b.dataset.hunt)));
}

/* Scientist 9's standing daily invitation, reachable from the lab deck or the
   Challenge page. */
function startSupervisorDaily(){
  const g = r4();
  g.after = g.after || { day:null, beaten:false };
  if(g.after.day !== today()){ g.after.day = today(); g.after.beaten = false; }
  if(g.after.beaten) return toast('Tomorrow.');
  if(!ensurePool()) return;
  beginBattle({ isNpc:true, name:crewName('scientist9'), npcId:'scientist9', bgKey:'battle_laboratory',
    waves:[ [{species:'lanternfish',level:82,ai:'best'},{species:'lanternfish',level:82,ai:'best'}],
            [{species:'otter',level:83,ai:'best'},{species:'plesiosaur',level:83,ai:'best'}],
            [{species:'ninja',level:85,ai:'best'}] ],
    onWin: ()=> onNineWin() });
}
async function onNineWin(){
  const g = r4();
  g.after.beaten = true;
  state.medals.bronze = (state.medals.bronze||0) + 5;
  await saveProfile();
  storyModal(npcPortrait('scientist9','🧑‍🔬',130,'transparent'), 'Good',
    `She pushes the sunglasses up into her hair, grinning.<br><br>` +
    `<b>"Again tomorrow. I'll have found something new by then."</b><br><br>` +
    `<b>+5 Bronze Medals</b>`,
    ()=>go('laboratory_deck'), { bg:'laboratory_deck', subtitle:'Laboratory' });
}

/* ============================================================
   REGION 4 CHALLENGES
   Nothing here until the Whalelord points below decks. After that the officers
   are fair game, and once the truth is out the new science supervisor takes up
   a standing daily invitation.
   ============================================================ */
function renderChallengeR4(){
  const g = r4();
  setScreenBg('battle_cabin_deck');
  $('#brandSub').textContent = 'Challenge';
  const open = !!g.ghostAccepted;          // the ghost has to smell it first

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Region</button>
    <div class="screen-title">Challenge</div>
    ${!open ? `<div class="phase-flag">Nobody aboard wants a fight yet.</div>` : `
      <div class="challenge-card" id="cCaptain">
        ${npcPortrait('ship_captain','⚓',54,'transparent')}
        <div style="flex:1;">
          <div class="cc-title">${crewName('ship_captain')} ${g.captainBeaten?'<span class="clear-tag">Beaten</span>':''}</div>
          <div class="cc-desc">${g.captainBeaten
            ? (g.wallFound ? 'He gets bored. He will go again for the exercise.' : 'Busy with the charts.')
            : 'Six waves. Forty years of not losing a ship.'}</div>
        </div>
      </div>
      <div class="challenge-card" id="cKeeper">
        ${npcPortrait('shipkeeper','⚓',54,'transparent')}
        <div style="flex:1;">
          <div class="cc-title">${crewName('shipkeeper')} ${g.keeperBeaten?'<span class="clear-tag">Beaten</span>':''}</div>
          <div class="cc-desc">${g.keeperBeaten ? 'He has made his point.' : 'Six waves, and all shoulders.'}</div>
        </div>
      </div>
      ${g.solved ? huntsPanel() : ''}
      ${g.solved ? `
      <div class="challenge-card" id="cSci9">
        ${npcPortrait('scientist9','🧑‍🔬',54,'transparent')}
        <div style="flex:1;">
          <div class="cc-title">${crewName('scientist9')}</div>
          <div class="cc-desc">${(g.after&&g.after.beaten) ? 'She has had enough for one day.' : 'Once a day. <b>5 Bronze Medals</b>.'}</div>
        </div>
      </div>` : ''}
    `}
    <button class="btn btn-ghost" id="returnBtn" style="margin-top:12px;">Return</button>
  `;
  $('#backBtn').addEventListener('click', ()=>go('region'));
  $('#returnBtn').addEventListener('click', ()=>go('region'));
  const cc = $('#cCaptain');
  if(cc) cc.addEventListener('click', ()=>{
    if(g.captainBeaten && !g.wallFound) return toast('He is busy with the charts.');
    startOfficer('captain', g.captainBeaten);
  });
  const ck = $('#cKeeper');
  if(ck) ck.addEventListener('click', ()=>{
    if(g.keeperBeaten) return toast('He has made his point.');
    startOfficer('keeper', false);
  });
  const c9 = $('#cSci9');
  if(c9) c9.addEventListener('click', ()=> startSupervisorDaily());
  wireHuntRows();
}

function startOfficer(which, rematch){
  if(!ensurePool()) return;
  const t = which === 'captain' ? CAPTAIN_TEAM : SHIPKEEPER_TEAM;
  beginBattle({ isNpc:true, name:crewName(t.npcId), npcId:t.npcId, bgKey:'battle_cabin_deck',
    waves: t.waves.map(w=>w.map(e=>({...e}))),
    onWin: ()=> onOfficerWin(which, !!rematch) });
}
async function onOfficerWin(which, rematch){
  const g = r4();
  if(!rematch){
    if(which === 'captain') g.captainBeaten = true; else g.keeperBeaten = true;
    state.inventory.protein = (state.inventory.protein||0) + 1;
    await saveProfile();
  }
  storyModal(npcPortrait(which==='captain'?'ship_captain':'shipkeeper','⚓',130,'transparent'),
    rematch ? 'Again, then' : 'Well fought',
    rematch
      ? `<b>"That's the one."</b> He is breathing hard and enjoying it enormously.<br><br>` +
        `<i>Nothing changes hands. He just likes the exercise.</i>`
      : (which==='captain'
        ? `<b>"Well."</b> He puts his hands in his pockets. <b>"That's me told."</b><br><br>` +
          `<b>+1 Protein Supplement</b>`
        : `He grunts, which from him is applause.<br><br><b>+1 Protein Supplement</b>`),
    ()=>go('challenge'), { bg:'battle_cabin_deck', subtitle:'Challenge' });
}

/* ============================================================
   THE SHIPKEEPER — Region 4 only
   One Water Stone, 100 Skill Tokens, once ever. Entirely optional: Jax
   waives his stake if you spend yourself dry, so this can never dead-end.
   ============================================================ */
/* Gruff, and fond of you in a way he would deny. The stone itself lives in the
   shop now; here he just wants a word before you go over the side again. */
const KEEPER_LINES = [
  `He is sorting salvage into two piles, one of which appears to be "rubbish".<br><br>` +
  `<b>"Back again."</b> He does not look up. <b>"Still in one piece, I see. Keep it that way."</b><br><br>` +
  `<i>"Things down there aren't in a mood. Don't go picking at them just because you can."</i>`,
  `<b>"You'll want something off me."</b> He straightens, which takes a while.<br><br>` +
  `<b>"Everyone does. Fair enough — I've got things worth wanting."</b><br><br>` +
  `<i>He looks at your monsters rather than at you. "Feed those. They're doing the work."</i>`,
  `<b>"Crew talk about you, you know."</b> A pause. <b>"Not unkindly."</b><br><br>` +
  `He turns back to his crates. <i>"Mind how you go."</i>`,
];
function shipkeeperShop(){
  storyModal(npcPortrait('shipkeeper','⚓',130,'transparent'), crewName('shipkeeper'),
    KEEPER_LINES[Math.floor(Math.random()*KEEPER_LINES.length)],
    ()=>go('cabin_deck'),
    { bg:'battle_cabin_deck', subtitle:'Cabin Deck',
      action:{ label:'🛒 Shop', fn:()=>go('shop') } });
}

/* ============================================================
   DAILY HUNTS
   Two researchers each want something brought back. One ordinary, one rare.
   ============================================================ */
function hunts(){
  const g = r4();
  g.hunts = g.hunts || { day:null, a:null, b:null, doneA:false, doneB:false };
  if(g.hunts.day !== today()){
    const pool = [1,2,3,4,5,7,8,9].filter(n=>n!==CULPRIT);
    const who = pool.sort(()=>Math.random()-0.5).slice(0,2);
    g.hunts = {
      day: today(),
      a: { sci:who[0], species: R4_WILD[Math.floor(Math.random()*R4_WILD.length)], reward:5 },
      b: { sci:who[1], species: (Math.random()<0.5 ? 'water_starter'
              : R4_ELITE[Math.floor(Math.random()*R4_ELITE.length)]), reward:10 },
      doneA:false, doneB:false,
    };
    saveProfile();
  }
  return g.hunts;
}
/* Called whenever a wild dive is won — checks both hunts against what fell. */
async function checkHunts(defeated){
  const g = r4();
  if(!g.solved) return null;
  const h = hunts();
  let got = null;
  [['a','doneA'],['b','doneB']].forEach(([k,dk])=>{
    if(h[dk] || !h[k]) return;
    if(defeated.includes(h[k].species)){
      h[dk] = true;
      state.inventory.tokens = (state.inventory.tokens||0) + h[k].reward;
      got = got || [];
      got.push({ sci:h[k].sci, species:h[k].species, reward:h[k].reward });
    }
  });
  if(got) await saveProfile();
  return got;
}
/* Tapping a researcher shows the animal they want, not a description of it —
   a child should be able to recognise it in the water. */
function huntRequest(key){
  const h = hunts();
  const d = h[key];
  if(!d) return;
  const done = key === 'a' ? h.doneA : h.doneB;
  const nm = SPECIES[d.species] ? SPECIES[d.species].name : d.species;
  storyModal(npcPortrait('scientist'+d.sci,'🧑‍🔬',120,'transparent'), crewName('scientist'+d.sci),
    done
      ? `<b>"You brought it. That is the whole afternoon accounted for."</b><br><br>` +
        `<i>Nothing more today.</i>`
      : `<b>"This one."</b> ${crewFirst('scientist'+d.sci)} turns a plate towards you.<br><br>` +
        `<div style="display:flex;justify-content:center;margin:10px 0;">
           ${monPortrait(d.species, 130, { view:'front', bare:true })}
         </div>` +
        `<b>${escapeHtml(nm)}</b><br><br>` +
        `<i>"Beat one and bring the readings back. ${tokenIcon(15)} ${d.reward} tokens for the trouble."</i>`,
    ()=>go(ui.prevScreen === 'challenge' ? 'challenge' : 'laboratory_deck'),
    { bg:'battle_laboratory', subtitle:'Laboratory',
      action: done ? null : { label:'🌊 Capture', fn:()=>go('weather_deck') } });
}

function huntsPanel(){
  const h = hunts();
  const row = (k, dk)=>{
    const d = h[k]; if(!d) return '';
    const nm = SPECIES[d.species] ? SPECIES[d.species].name : d.species;
    return `<button class="hunt-row ${h[dk]?'done':''}" data-hunt="${k}">
      ${npcPortrait('scientist'+d.sci,'🧑‍🔬',36,'transparent')}
      <span><b>${escapeHtml(crewFirst('scientist'+d.sci))}</b> wants a <b>${escapeHtml(nm)}</b></span>
      <span class="hunt-pay">${h[dk] ? '✓' : tokenIcon(14)+' '+d.reward}</span>
    </button>`;
  };
  return `<div class="hunt-box">
    <div class="hunt-title">Today's requests</div>
    ${row('a','doneA')}${row('b','doneB')}
    <div class="hunt-note">Bring them back by defeating one while diving.</div>
  </div>`;
}

/* ============================================================
   THE WEATHER DECK — BIRD RAIDS
   Five fishermen, red pulses, 0.8–1.0s to react. The roster is base-form only,
   Lv 60–65, and one of them is not a bird you fight.
   ============================================================ */
const BIRD_COMMON = ['pelican','swan','cormorant','mantaray'];
const BIRD_MIN_LV = 60, BIRD_MAX_LV = 65;

function birdLevel(){
  const best = Math.max(...battleParty().map(m=>m.level), BIRD_MIN_LV);
  return Math.max(BIRD_MIN_LV, Math.min(BIRD_MAX_LV, best));
}
/* Caladrius is not in the ordinary roll — it has its own schedule. */
function caladriusStage(){
  const g = r4();
  if(!g.wallFound) return 'none';        // it only appears once the ship has stopped
  if(!g.caladriusSeen) return 'plea';    // the first meeting, guaranteed
  if(!g.solved) return 'none';           // it will not return until the truth is out
  if(!g.caladriusHealed) return 'heal';  // the second meeting, guaranteed
  return 'wild';                          // thereafter, rarely, and hard to hold
}
/* What comes up on the line when it isn't a bird. Loong arrives GROWN — it is
   not a hatchling anybody hauls over a rail by accident. */
const HAUL_COMMON = ['starfish','seahorse','duck','sea_turtle','lanternfish'];

function birdRoll(){
  const stage = caladriusStage();
  if(stage === 'plea' || stage === 'heal') return 'caladrius';
  const r = Math.random();
  if(stage === 'wild' && r < 0.03) return 'caladrius';
  if(r < 0.08) return 'moon_swan';        // 5%, above the caladrius slice
  return BIRD_COMMON[Math.floor(Math.random()*BIRD_COMMON.length)];
}
function haulRoll(){
  const r = Math.random();
  if(r < 0.05) return 'loong';            // grown, and thoroughly unimpressed
  return HAUL_COMMON[Math.floor(Math.random()*HAUL_COMMON.length)];
}

/* Two thirds of the time it is birds on the catch. The rest of the time the
   catch itself is the problem. */
function startBirdRaid(){
  if(!ensurePool()) return;
  const stage = caladriusStage();
  if(stage === 'plea' || stage === 'heal'){
    const first = birdRoll();
    if(first === 'caladrius') return stage === 'plea' ? caladriusPlea() : caladriusHeals();
  }
  const haul = Math.random() < 0.35;
  ui.currentZone = { id:'weather_deck', name:haul ? 'The haul' : 'The rail' };
  const lv = birdLevel();

  if(haul){
    const n = 1 + Math.floor(Math.random()*3);
    const wave = Array.from({length:n}, ()=>{
      const sp = haulRoll();
      // a Loong is hauled up fully grown; everything else comes up small
      return sp === 'loong'
        ? { species:'loong', level:Math.max(lv, 41), ai:'best' }
        : { species:sp, level:lv + Math.floor(Math.random()*3)-1, forceStage:0 };
    });
    return beginBattle({ waves:[wave], isNpc:false, allowCatch:true, name:'In the net',
      bgKey:'battle_weather_deck', onWin: ()=> resumeVictory() });
  }

  const pick = birdRoll();
  const n = 1 + Math.floor(Math.random()*3);
  const wave = Array.from({length:n}, ()=>{
    const sp = birdRoll();
    const spec = { species:(sp==='caladrius'?'moon_swan':sp), level:lv + Math.floor(Math.random()*3)-1, forceStage:0 };
    if(spec.species === 'mantaray' || spec.species === 'moon_swan') spec.elusive = true;
    return spec;
  });
  if(pick === 'caladrius'){
    wave.length = 1;
    wave[0] = { species:'caladrius', level:lv, forceStage:0, elusive:true, ai:'caladrius' };
  }
  beginBattle({ waves:[wave], isNpc:false, allowCatch:true, name:'Raid on the hauls',
    bgKey:'battle_weather_deck', onWin: ()=> resumeVictory() });
}

/* --- the first meeting: it asks --- */
async function caladriusPlea(){
  const g = r4();
  g.caladriusSeen = true;
  await saveProfile();
  storyModal(monPortrait('caladrius',150,{view:'front',bare:true}), 'A white bird',
    `The gulls scatter all at once, and what lands on the rail is not a gull.<br><br>` +
    `It is white to the point of glare. It does not startle, and it does not look away. ` +
    `It turns its head and holds your eye — <b>steadily, for far longer than a bird should</b> — ` +
    `and its whole body is angled toward the water behind it.<br><br>` +
    `Twice it looks down at the sea, and twice back at you.<br><br>` +
    `<i>You are fairly sure it is asking you for something. Something is down there, and it ` +
    `matters to this bird, and it does not believe it can manage alone.</i><br><br>` +
    `Then it opens its wings and is simply gone.`,
    ()=>go('weather_deck'), { bg:'weather_deck', subtitle:'Weather Deck' });
}

/* --- the second meeting: it helps --- */
const CALADRIUS_XP_FIGHTS = 30;
async function caladriusHeals(){
  const g = r4();
  const cuain = state.party.concat(state.storage).find(m=>m.species==='whalelord');
  if(!cuain) return startBirdRaid();          // nothing to heal yet
  g.caladriusHealed = true;
  await saveProfile();
  storyModal(monPortrait('caladrius',150,{view:'front',bare:true}), 'It came back',
    `It is on the rail again, and this time it is not looking at you at all.<br><br>` +
    `Its head is fixed on the cold grey shape that has followed you up from the deep. ` +
    `Something in the set of its shoulders changes — it draws itself up, the way a small ` +
    `animal does when it has decided to do something difficult.<br><br>` +
    `<i>It knew he was there. You think it has known since the first time.</i><br><br>` +
    `The Whalelord does not move. For once, he has nothing to say.`,
    ()=>caladriusHeals2(cuain), { bg:'weather_deck', subtitle:'Weather Deck' });
}
async function caladriusHeals2(cuain){
  const before = cuain.level;
  /* Thirty fights' worth, given to Cuain alone — the party XP path expects a
     party, so we credit him directly and then let the usual level-up run. */
  const cap = levelCap();
  cuain.xpFights = (cuain.xpFights||0) + CALADRIUS_XP_FIGHTS;
  while(cuain.level < cap && cuain.xpFights >= fightsNeeded(cuain.level)){
    cuain.xpFights -= fightsNeeded(cuain.level);
    const beforeMax = computeMaxHp(cuain.species, cuain.level, cuain.supplements, cuain);
    cuain.level++;
    const afterMax = computeMaxHp(cuain.species, cuain.level, cuain.supplements, cuain);
    cuain.currentHp = Math.min(afterMax, cuain.currentHp + (afterMax - beforeMax));
  }
  await saveProfile();
  storyModal(uiIcon('whalelord_core',140,'🔵'), 'A temporary mending',
    `The bird spreads its wings over the water and holds them there, and does not move ` +
    `again for a long time.<br><br>` +
    `Light goes out of it and into the dead whale, and for a moment you can see what he ` +
    `used to be — vast, and whole, and unhurried.<br><br>` +
    `When it finally folds its wings it looks thinner than it did, and it will not meet ` +
    `your eye. <i>You get the distinct impression it is embarrassed that this is all it ` +
    `can do.</i><br><br>` +
    `<b>${escapeHtml(displayName(cuain))} is strengthened.</b>` +
    (cuain.level > before ? ` <i>Lv ${before} → Lv ${cuain.level}</i>` : '') + `<br><br>` +
    `<b>Whalelord:</b> "It is not my core. It will not hold."<br><br>` +
    `The bird has already gone.`,
    ()=>go('weather_deck'), { bg:'weather_deck', subtitle:'Weather Deck' });
}
