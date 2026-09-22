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
/* Nobody aboard knows his name. He does not offer it, and he will not until
   Region 5 gives him back his core — so he is simply the Whalelord for now. */
function whaleName(){
  const m = (state.party || []).concat(state.storage || [])
    .find(x => x.species === 'whalelord');
  return (m && m.crowned) ? 'Cuain' : 'Whalelord';
}
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
/* ------------------------------------------------------------
   THE EXPEDITION
   Every fight won aboard — over the side or at the rail — is a day of sailing.
   The bar fills at 80. The whales stop the ship at 40, halfway, when the crew
   have settled and nobody is expecting anything.
   ------------------------------------------------------------ */
const EXPEDITION_TOTAL = 80;
const WALL_AT          = 40;
const WHALE_WINS_TO_GHOST = 1;   // beat the wall once and it will speak to you

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
  /* The decks are walked now — the tap version below is kept as a fallback in
     case the walkable subsystem is not loaded. */
  if(typeof renderWalkDeck === 'function') return renderWalkDeck('weather_deck');
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
        ${g.diversBeaten ? '<div class="dive-pulse"></div>' : ''}
        ${npcPortrait('diver1','🤿',48,'transparent')}</button>
      <button class="deck-pin dive-pin ${g.diversBeaten?'open':''}" style="left:24%;top:52%;" data-diver="2">
        ${g.diversBeaten ? '<div class="dive-pulse"></div>' : ''}
        ${npcPortrait('diver2','🤿',48,'transparent')}</button>


      ${g.ghostAccepted && !g.rivalBeaten ? `
        <button class="deck-pin ghost-here" style="left:22%;top:80%;" data-ghost="1">
          ${monPortrait('whalelord',60,{view:'front',bare:true})}</button>` : ''}
    </div>
    ${expeditionBar()}
    ${g.diversBeaten ? '' : `<div class="phase-flag">The divers are not letting anyone past.</div>`}
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

/* ------------------------------------------------------------
   When the ship stops, everybody aboard has an opinion about it — and each of
   them is a different kind of frightened.
   ------------------------------------------------------------ */
const BLOCKED_LINES = {
  sailor1: `<b>"We've stopped."</b> He keeps looking at the rail and then away again.<br><br>` +
           `<b>"Six weeks out and we've stopped for fish. I know how that sounds."</b>`,
  sailor2: `He is holding the signed drumstick and not really seeing it.<br><br>` +
           `<b>"Djenta'd have a song about this. Whole sea saying no."</b>`,
  sailor3: `<b>"I counted them."</b> He does not say how many.<br><br>` +
           `<b>"Gave up. Went below. Came back and counted again."</b>`,
  sailor4: `<b>"Cook's rationing. That's when you know."</b><br><br>` +
           `<i>He is trying to make it a joke and it is not working.</i>`,
  sailor5: `<b>"They're not hunting us. That's the part I don't like."</b><br><br>` +
           `<b>"A thing that wants to eat you, you can understand."</b>`,
  ship_captain: `He does not look up from the chart.<br><br>` +
           `<b>"I've plotted round ice. Round weather. Round war, once."</b><br><br>` +
           `<b>"Never had to plot round something that was waiting."</b>`,
  shipkeeper: `He has stopped sorting salvage. The crates are open and untouched.<br><br>` +
           `<b>"Forty years I've been at sea and I've never once been told to stop."</b><br><br>` +
           `<i>"Something down there is doing the telling."</i>`,
  cook: `<b>"They won't eat."</b> He means the crew.<br><br>` +
           `<b>"Made the good stew and all. Sat there going cold."</b>`,
  rival: `He is at the porthole for once, actually looking.<br><br>` +
           `<b>"Hundreds of them. Just sitting there."</b><br><br>` +
           `He catches himself being interested and puts it away. ` +
           `<b>"Nothing to do with me."</b>`,
};
function blockedLine(id){ return BLOCKED_LINES[id] || null; }

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
  const g = r4();
  const blocked = (g.wallFound && !g.solved) ? blockedLine('sailor'+n) : null;
  storyModal(npcPortrait('sailor'+n,'⚓',120,'transparent'), crewName('sailor'+n),
    blocked || SAILOR_LINES[(n-1) % SAILOR_LINES.length],
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
    /* Once the lane is open the whales are themselves again, and one can come
       up with the others. */
    if(g.solved && r < 0.17) return 'whale';
    if(r < (g.solved ? 0.32 : 0.20)) return 'water_starter';
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
/* Both kinds of fight feed the same meter. Returns true if the wall just
   appeared, so the caller can hand over to the captain instead of the usual
   victory screen. */
async function logExpedition(){
  const g = r4();
  /* Nothing moves while the whales are across the lane. The ship is not
     sailing anywhere, and the bar should say so — you are not making progress
     east by fighting whales, you are making progress towards understanding
     why they are there. */
  if(g.wallFound && !g.solved) return false;

  /* Once the truth is out the ship runs for open water and the last half goes
     twice as fast: forty more in twenty encounters. */
  const step = g.solved ? 2 : 1;
  g.dives = Math.min(EXPEDITION_TOTAL, (g.dives || 0) + step);

  if(!g.wallFound && g.dives >= WALL_AT){
    g.dives = WALL_AT;                   // stop exactly on the mark
    g.wallFound = true;
    await saveProfile();
    return true;
  }
  await saveProfile();
  return false;
}
/* A little ship crossing the North Sea. Bow to the right, a bow wave under it,
   and a wake trailing back the way it came. */
/* 80 points to Cosa Nostia: one a win before the whales, two a win after.
   It shows its number all the way, so the boys can watch it fill. compact
   leaves out the line underneath, for the deck screens. */
function expeditionBar(compact){
  const g = r4();
  const pct = expeditionPct();
  const done = g.solved, there = pct >= 100;
  return `<div class="exped">
    <div class="exped-head">
      <span>${there ? 'Cosa Nostia' : done ? 'Passage east' : 'Expedition'}</span>
      <span class="exped-pct">${pct}%</span>
    </div>
    <div class="exped-track">
      <div class="exped-fill" style="width:${pct}%"></div>
      ${g.wallFound && !done ? `<div class="exped-wall" style="left:50%"></div>` : ''}
      <div class="exped-ship" style="left:${pct}%">
        <svg viewBox="0 0 34 22" aria-hidden="true">
          <path d="M3 14 h26 l-4 5 H6 Z" fill="#3a5a7a"/>
          <path d="M9 14 V6 h9 l-2 4 h-3 v4 Z" fill="#f4ecd8" stroke="#3a5a7a" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M19 14 V7 l7 7 Z" fill="#f4ecd8" stroke="#3a5a7a" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M1 18 q3 2 6 0" fill="none" stroke="#7fb0cc" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
    ${compact ? '' : `<div class="exped-note">${
      there ? `Docked at Cosa Nostia.`
      : done ? `Running east, and making up the time. <b>Every win counts double.</b>`
      : g.wallFound ? 'Dead in the water. Nothing moves until this is settled.'
      : 'Days at sea, counted in the fights you win over the side and at the rail.'
    }</div>`}
  </div>`;
}

function expeditionPct(){
  return Math.min(100, Math.round(((r4().dives || 0) / EXPEDITION_TOTAL) * 100));
}

async function onDiveWin(){
  const fell = ((ui.battle && ui.battle.enemies) || []).filter(e=>e.hp<=0).map(e=>e.species);
  const blocked = await logExpedition();
  if(blocked) return resumeVictory(true, whaleWallFound);
  const got = await checkHunts(fell);
  await saveProfile();
  if(got && got.length) await huntThanks(got);   // before the victory screen
  if(revivalDue()) return resumeVictory(true, ()=> startRevivalCall());
  resumeVictory();
}

/* A raid or a haul at the rail counts exactly the same. */
async function onRailWin(){
  const fell = ((ui.battle && ui.battle.enemies) || []).filter(e=>e.hp<=0).map(e=>e.species);
  const blocked = await logExpedition();
  if(blocked) return resumeVictory(true, whaleWallFound);
  const got = await checkHunts(fell);
  await saveProfile();
  if(got && got.length) await huntThanks(got);   // before the victory screen
  if(revivalDue()) return resumeVictory(true, ()=> startRevivalCall());
  resumeVictory();
}
function whaleWallFound(){
  /* Three of them, abreast, filling the screen before anybody says anything. */
  const wall = `<div style="display:flex;justify-content:center;align-items:flex-end;gap:2px;margin:-6px 0 4px;">
      ${monPortrait('whale',96,{view:'front',bare:true,stage:1})}
      ${monPortrait('whale',120,{view:'front',bare:true,stage:1})}
      ${monPortrait('whale',96,{view:'front',bare:true,stage:1})}
    </div>`;
  storyModal(wall, 'Something is in the way',
    `You surface into shouting.<br><br>` +
    `They are abreast of one another, bow to stern across the whole lane, and they ` +
    `are <b>not moving</b>.<br><br>` +
    `Not feeding. Not travelling. Not going round.<br><br>` +
    `<i>Every one of them is facing the ship.</i>`,
    ()=>whaleWallCaptain(), { bg:'battle_diving', subtitle:'The Deep' });
}
function whaleWallCaptain(){
  storyModal(npcPortrait('ship_captain','⚓',140,'transparent'), crewName('ship_captain'),
    `You surface into shouting.<br><br>` +
    `<b>"We've stopped. Look for yourself."</b><br><br>` +
    `The sea ahead is not empty. It is <i>full</i>, in a way water should not be, and every ` +
    `one of them is facing the ship.<br><br>` +
    `<b>"Whales. Hundreds. Sitting across the lane like a wall and not one of them is moving aside."</b><br><br>` +
    `He does not raise his voice. <b>"I've sailed forty years. I've never seen an animal do that on purpose."</b><br><br>` +
    `<i>The Vane Shear is going nowhere. The researchers below will want to hear about this.</i>`,
    ()=>go('weather_deck'), { bg:'battle_cabin_deck', subtitle:'Weather Deck' });
}

function confirmWhaleDive(){
  const g = r4();
  if((g.whaleWins||0) >= WHALE_WINS_TO_GHOST && !g.ghostMet) return quietWater();
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
  saveProfile();
  ui.currentZone = { id:'diving', name:'The wall' };
  beginBattle({
    waves: Array.from({length:6}, (_,i)=>whaleWave(i)),
    isNpc:false, allowCatch:true, name:'The wall', bgKey:'battle_whales',
    /* A trip through the wall is a day at sea like any other, so it feeds the
       meter too — otherwise the bar froze at the halfway mark and nothing the
       player did between the block and the truth appeared to matter. */
    onWin: ()=> onWhaleWin() });
}
/* Clearing all six waves is what earns the meeting. Fleeing or fainting does
   not — you have to actually get through them once. */
async function onWhaleWin(){
  const g = r4();
  g.whaleWins = (g.whaleWins || 0) + 1;
  await saveProfile();
  onDiveWin();
}

/* Once you have been through them: they let you past. */
function quietWater(){
  storyModal('', 'They are not attacking',
    `They do not come for you.<br><br>` +
    `Two hundred tonnes of animal drifts past close enough to touch, and none of them so ` +
    `much as turns. Something has told them to let you through.<br><br>` +
    `Then, from further down than light reaches, a voice that is not a sound:<br><br>` +
    `<b>"Avenge me."</b>`,
    ()=>ghostIntro(), { bg:'battle_diving', subtitle:'The deep' });
}
async function ghostIntro(){
  const g = r4();
  g.ghostMet = true;
  await saveProfile();
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), 'Something older',
    `It is dead. You know this the way you know which way is up.<br><br>` +
    `<b>"Child. You carry a dragon with a hole in it. So do I."</b><br><br>` +
    `<b>"A man with a <span style="color:var(--cinnabar)">raven</span> did this. He was carrying the ` +
    `power of a dozen cores that were not his, and he cut me open and left me to sink."</b><br><br>` +
    `<b>"I did not sink. I took my core down deep where he could not follow, and I lived."</b>`,
    ()=>ghostIntro2(), { bg:'battle_diving', subtitle:'The deep' });
}
function ghostIntro2(){
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), 'Then the quiet ones',
    `A long pause. The light through it shifts.<br><br>` +
    `<b>"Then other people came. Quieter ones. They knew where to look, which means somebody told them."</b><br><br>` +
    `Something enormous and old moves behind the words.<br><br>` +
    `<b>"They cut out my core. That is what killed me."</b><br><br>` +
    `<b>"My people have no one to follow now. They will not move until this is finished."</b>`,
    ()=>ghostAsk(), { bg:'battle_diving', subtitle:'The deep' });
}
function ghostAsk(){
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), '"Avenge me"',
    `<b>"Avenge me. Find my core."</b><br><br>` +
    `<b>"Then your ship may pass east."</b>`,
    ()=>ghostAccept(), { bg:'battle_diving', subtitle:'The deep' });
}
async function ghostAccept(){
  const g = r4();
  g.ghostAccepted = true;
  await saveProfile();
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), 'It follows you up',
    `It rises with you, and it does not stop at the surface.<br><br>` +
    `<i>The Whalelord is aboard the ship now — and nobody but you can see him.</i>`,
    ()=>startCorpseScene(), { bg:'weather_deck', subtitle:'Weather Deck' });
}

/* ------------------------------------------------------------
   THE BODY
   He is invisible to everybody but the player, so a child's word is all the
   crew has — until there is something they CAN see. The body is what turns one
   child's story into the captain's problem, and it is what puts every soul on
   the ship, researchers included, onto the investigation.
   ------------------------------------------------------------ */
/* Where the scene has you pinned, and the one thing you may do there. The
   stage is kept in the save, so leaving the region, choosing another deck or
   closing the app all put you back on the same tile with the same button. */
function corpseLock(){
  const g = r4();
  if(g.corpseStage === 'captain')
    return { deck:'cabin_deck', x:11, y:7,
             label:'Tell the Captain what happened', act:()=> whaleCorpseTell() };
  if(g.corpseStage === 'deck')
    return { deck:'weather_deck', x:12, y:6,
             label:'Speak to the Captain.', act:()=> corpseDeckCaptain() };
  return null;
}
async function startCorpseScene(){
  const g = r4();
  g.corpseStage = 'captain';
  await saveProfile();
  const w = walkState();
  w.deck = 'cabin_deck'; w.at = w.at || {}; w.at.cabin_deck = { x:11, y:7 };
  w.face = 'u'; w.busy = true;
  go('cabin_deck');
}
function whaleCorpseTell(){
  storyModal(npcPortrait('ship_captain','⚓',140,'transparent'), crewName('ship_captain'),
    `He looks up from the chart table. You are standing in front of him and you have not ` +
    `said anything yet.<br><br>` +
    `You tell him there is somebody beside you. He looks where you are pointing and sees a ` +
    `doorway and a wet coat on a hook.<br><br>` +
    `<b>"There's nothing there, child."</b><br><br>` +
    `So you tell him the rest instead. The whales are not angry at the ship. ` +
    `<b>Their lord has been murdered</b>, and they will not move until that is put right.<br><br>` +
    `He does not laugh. He has been staring at a wall of whales for eleven days.`,
    ()=> whaleCorpseHaul(), { bg:'battle_cabin_deck', subtitle:'Cabin Deck' });
}
function whaleCorpseHaul(){
  storyModal(npcPortrait('ship_captain','⚓',140,'transparent'), 'Lines over the side',
    `<b>"Then we'd best find him."</b> He is already at the door.<br><br>` +
    `<b>"Every line we have and both winches, and I want the fishermen on all of them."</b><br><br>` +
    `<b>"Slowly, mind. Bring him up whole."</b>`,
    ()=> blackoutTo(()=> corpseSceneOnDeck(), { text:'Time passes…', hold:1600 }),
    { bg:'battle_cabin_deck', subtitle:'Cabin Deck' });
}
/* The black lifts on the weather deck: the body across the bow, you under it,
   the captain at your shoulder and the supervisor up from the laboratory. */
async function corpseSceneOnDeck(){
  const g = r4();
  g.corpseSeen = true;                       // from here on, the body is part of the deck
  g.corpseStage = 'deck';
  await saveProfile();
  const w = walkState();
  w.deck = 'weather_deck'; w.at = w.at || {}; w.at.weather_deck = { x:12, y:6 };
  w.face = 'u'; w.busy = true;
  go('weather_deck');
}
function corpseDeckCaptain(){
  storyModal(npcPortrait('ship_captain','⚓',140,'transparent'), crewName('ship_captain'),
    `They have laid him along the bow and he covers it end to end. The fishermen have their ` +
    `caps off, and nobody told them to.<br><br>` +
    `Under one flipper is a hole the size of a door. It is cut straight, and there is not a ` +
    `tooth mark anywhere near it.<br><br>` +
    `You say it out loud, because somebody has to: <b>whoever did this is on this ship</b>, and ` +
    `until they are found the whales will not let anybody past.<br><br>` +
    `<b>"On my ship."</b> He says it flatly. <b>"Then every soul aboard helps, starting now. ` +
    `Deck crew, cooks, the lot."</b>`,
    ()=> corpseDeckSupervisor(), { bg:'weather_deck', subtitle:'Weather Deck' });
}
function corpseDeckSupervisor(){
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'),
    crewName('scientist_supervisor'),
    `He has come up from the laboratory still holding a clipboard, and for once he is not ` +
    `eating anything.<br><br>` +
    `<b>"My researchers as well. All nine of them, and me."</b><br><br>` +
    `<b>"Whatever you need to ask, ask it. Nobody down there is too busy for this."</b><br><br>` +
    `<i>The <b>Research Deck</b> is open.</i>`,
    ()=> corpseSceneEnd(), { bg:'weather_deck', subtitle:'Weather Deck' });
}
/* One more beat of black, and then it is just you and him again — and your
   legs are yours. */
async function corpseSceneEnd(){
  const g = r4();
  g.corpseStage = null;
  await saveProfile();
  blackoutTo(()=>{
    const w = walkState();
    w.deck = 'weather_deck'; w.at.weather_deck = { x:12, y:6 }; w.busy = false; w.face = 'u';
    go('weather_deck');
  }, { hold:700 });
}
/* Standing under him afterwards. A core is not a battery. It is everyone he
   came from, and it is gone. */
function corpseChat(){
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), whaleName(),
    `He hangs above his own body and does not look away from it.<br><br>` +
    `<b>"That is not a wound. That is a theft."</b><br><br>` +
    `<b>"A core is not something you carry. It is handed down. Father to son, and on, and ` +
    `on. Every one of them put something into it."</b><br><br>` +
    `<b>"My father is in there, and his father before him. A thousand years of my ancestors ` +
    `are in there."</b><br><br>` +
    `<b>"They did not just kill me. They stole everyone I came from."</b><br><br>` +
    `His voice drops, which is worse than shouting.<br><br>` +
    `<b>"Find them, child. My people will not move, and I will not rest, until somebody ` +
    `answers for this."</b>`,
    ()=> go('weather_deck'), { bg:'weather_deck', subtitle:'Weather Deck' });
}

/* ------------------------------------------------------------
   CUAIN, WALKING BEHIND YOU
   He can feel the Ghost Stone from the moment he comes aboard and mistakes it
   for his own core — which is exactly what a stone full of borrowed death
   would feel like. His core is nowhere on the ship at all: it is a thousand
   feet up, in the belly of a dragon, which is why he can never point at it.
   ------------------------------------------------------------ */
function ghostChat(where){
  const g = r4();
  /* He has been accepted but the captain has not been told: that scene first,
     from wherever you are standing. */
  if(g.ghostAccepted && !g.corpseSeen) return startCorpseScene();
  if(g.cuainJoined) return cuainQuip();          // he is with you now, and has opinions
  const deck = where || 'cabin_deck';
  const onLab = deck === 'laboratory_deck';
  const onWeather = deck === 'weather_deck';
  let body;

  if(g.solved){
    body = `<b>"It is done. It is not enough."</b><br><br>` +
           `<b>"My people can rest now. I cannot. Not until my core comes home."</b>`;
  } else if(onLab && labStage() === 'investigation'){
    /* Once the investigation is open he is here to name people. The first time
       he explains himself; after that every visit is what he can remember, and
       a wrong name is what shakes another piece loose. */
    const v = inv();
    if(!v.labSpoken){
      v.labSpoken = true;
      saveProfile();
      body = `He hangs above the benches and looks at them one at a time. Not one of them looks up.<br><br>` +
             `<b>"They cannot see me. Only you."</b><br><br>` +
             `<b>"Two creatures swam beside the ones who cut me. I saw them from underneath, and I ` +
             `was already dying, so what I have is pieces."</b><br><br>` +
             `<b>"Ask me again and I will give you what I have."</b>`;
    } else {
      body = `<b>"Pieces. It is all I have."</b><br><br>` +
             CLUES.slice(0, v.clues).map((c,k)=>`<b>${k+1}.</b> ${c}`).join('<br><br>') +
             (v.clues < CLUES.length
               ? `<br><br><i>He strains at something further down and cannot reach it. Name somebody ` +
                 `and be wrong, and he will try harder.</i>`
               : `<br><br><i>That is everything he has.</i>`) +
             `<br><br><i>${v.beaten.length} of 9 tested.</i>`;
    }
  } else if(g.stoneWon){
    /* the stone is his now, and it is not what he hoped */
    body = `He has been quiet since the boy handed the stone over.<br><br>` +
           `<b>"I was wrong. I am sorry."</b><br><br>` +
           `<b>"That stone is brimming with ghost energy, but it is not mine. ` +
           `It was so loud I thought it was me."</b><br><br>` +
           `<b>"Now I am holding it I can tell. My core is not on this ship. Not ` +
           `anywhere on it."</b><br><br>` +
           `<b>"Go down to the laboratory. Ask them. If my essence is not there ` +
           `either, then somebody has carried it a very long way."</b>`;
  } else if(onLab){
    body = `He drifts between the benches, barely looking.<br><br>` +
           `<b>"My core is not down here."</b><br><br>` +
           `<b>"I could feel it much more strongly upstairs. Take me back up."</b>`;
  } else if(onWeather){
    body = `<b>"Nothing up here. Rope and wind and tired men."</b><br><br>` +
           `<b>"But below. Below I can feel my core. Take me down there."</b>`;
  } else if(!crewCleared()){
    /* he will not point at anybody until every other person has been ruled out */
    const left = CABIN_FOES.filter(x=>!huntBeaten(x)).length;
    body = `He drifts down the passage, stopping outside one door and then another.<br><br>` +
           `<b>"My core is down here. Somebody on this deck has it."</b><br><br>` +
           `<b>"I cannot tell which one through a door. Test them. Every single one."</b><br><br>` +
           `<i>${left} still to see. Choose <b>Investigate</b> when you are beside somebody.</i>`;
  } else {
    body = `He has stopped moving. He is facing one cabin and nothing else.<br><br>` +
           `<b>"Him. It was never any of the others."</b><br><br>` +
           `<b>"That boy is carrying my power. I can feel it through the door."</b><br><br>` +
           `<b>"Beat him. Make him give me back my core."</b>`;
  }
  /* He is spoken to in the place he is standing, not in a generic cabin. */
  const BG = { weather_deck:'region4', cabin_deck:'battle_cabin_deck',
               laboratory_deck:'battle_laboratory_deck' };
  const SUB = { weather_deck:'Weather Deck', cabin_deck:'Cabin Deck',
                laboratory_deck:'Laboratory' };
  /* The story line first. After that he is not a recording: most taps get one
     of his observations instead, and every fourth repeats where things stand.
     The laboratory clues are exempt — they are the point of asking him there. */
  if(!(onLab && labStage() === 'investigation')){
    const key = body.slice(0, 48);
    ui.ghostHeard = ui.ghostHeard || {};
    const n = ui.ghostHeard[key] || 0;
    ui.ghostHeard[key] = n + 1;
    if(n > 0 && n % 4 !== 0) return cuainQuip();
  }
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), whaleName(),
    body, ()=>go(deck), { bg: BG[deck] || 'sea', subtitle: SUB[deck] || 'The Vane Shear' });
}

/* ---------- QUARTERS DECK ---------- */
function renderCabinDeck(){
  const g = r4();
  if(typeof renderWalkDeck === 'function') return renderWalkDeck('cabin_deck');
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
        ${pings('ship_captain') ? '<div class="suspect-pulse"></div>' : ''}
        ${npcPortrait('ship_captain','⚓',50,'transparent')}</button>
      <button class="deck-pin" style="left:36%;top:24%;" data-keeper="1">
        ${pings('shipkeeper') ? '<div class="suspect-pulse"></div>' : ''}
        ${npcPortrait('shipkeeper','⚓',50,'transparent')}</button>

      <!-- six cabins -->
      ${occupants.map((o,i)=>{
        const c = CABINS[i];
        return o.kind === 'rival'
          ? `<button class="deck-pin" style="left:${c.x}%;top:${c.y}%;" data-rival="1">
               ${pings('rival') ? '<div class="suspect-pulse"></div>' : ''}
               ${npcPortrait('rival','🧑',54,'transparent')}</button>`
          : `<button class="deck-pin" style="left:${c.x}%;top:${c.y}%;" data-sailor="${o.n}">
               ${pings('sailor'+o.n) ? '<div class="suspect-pulse"></div>' : ''}
               ${npcPortrait('sailor'+o.n,'⚓',48,'transparent')}</button>`;
      }).join('')}

      <!-- the galley, aft -->
      <button class="deck-pin" style="left:63%;top:79%;" data-cook="1">
        ${pings('cook') ? '<div class="suspect-pulse"></div>' : ''}
        ${npcPortrait('cook','🧑‍🍳',50,'transparent')}</button>

      ${g.ghostAccepted && !g.rivalBeaten ? `
        <button class="deck-pin ghost-here" style="left:38%;top:88%;" data-ghost="1">
          ${monPortrait('whalelord',58,{view:'front',bare:true})}</button>` : ''}
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('explore'));
  /* While the hunt is on, anyone still pinging wants a fight; everyone else
     carries on being themselves. */
  screenEl.querySelectorAll('[data-sailor]').forEach(b=>b.addEventListener('click', ()=>{
    const id = 'sailor'+b.dataset.sailor;
    pings(id) ? crewChallenge(id) : sailorChat(+b.dataset.sailor);
  }));
  const cp = screenEl.querySelector('[data-captain]');
  if(cp) cp.addEventListener('click', ()=> pings('ship_captain') ? crewChallenge('ship_captain') : chartRoom());
  const kp = screenEl.querySelector('[data-keeper]');
  if(kp) kp.addEventListener('click', ()=> pings('shipkeeper') ? crewChallenge('shipkeeper') : shipkeeperShop());
  const ck = screenEl.querySelector('[data-cook]');
  if(ck) ck.addEventListener('click', ()=> pings('cook') ? crewChallenge('cook') : cookChat());
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
    ()=>go('cabin_deck'), { bg:'cabin_deck', subtitle:'Cabin Deck',
      action:{ label:'Check travel progress', fn: ()=> travelProgress() } });
}
/* The captain reads the chart for you, rounded down to the fifth. */
function travelProgress(){
  const pct = expeditionPct();
  const band = Math.floor(pct / 20) * 20;
  const line = pct >= 100
    ? `"We're there, lad. Docked already. Easy to miss when you're having fun, eh?"`
    : band >= 20
      ? `"Hrm, I'd wager we're more than ${band}% of the way to Cosa Nostia."`
      : `"Hrm. We've barely cleared the harbour — not yet a fifth of the way to Cosa Nostia."`;
  storyModal(npcPortrait('ship_captain','⚓',130,'transparent'), crewName('ship_captain'),
    `He squints at the chart and taps it with a thick finger.<br><br><b>${line}</b>`,
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
  const blocked = (g.wallFound && !g.solved) ? blockedLine('cook') : null;
  storyModal(npcPortrait('cook','🧑‍🍳',130,'transparent'), crewName('cook'),
    blocked || body, ()=>go('cabin_deck'), { bg:'battle_cabin_deck', subtitle:'Cabin Deck' });
}

/* Each crew member is two waves of what they happen to own. */
/* The Whalelord hangs behind whoever it wants looked at next. */
function crewChallenge(id){
  storyModal(npcPortrait(id, '⚓', 130, 'transparent'), crewName(id),
    `The Whalelord drifts in behind you and settles, watching.<br><br>` +
    `<b>"…All right."</b> ${crewFirst(id)} sets down whatever they were holding. ` +
    `<b>"If it clears the air, let's have it."</b>`,
    ()=>fightCrew(id), { bg:'battle_cabin_deck', subtitle:'Cabin Deck' });
}

/* THE SAME FIVE, a year on and a long way north.
   They are the fans who crowded the Electric Dojo's stage in Region 3, and
   they bring back EXACTLY those teams — SAILORS in 10-story-r3.js: the same
   monsters, the same levels, the same order, the same AI. The only addition is
   a wave in FRONT: three of the birds that raid the fishermen's rail on the
   weather deck, at that sailor's opening level and in the opener's gentle
   Power1 style. SAILOR_BIRDS picks three of the four rail birds; the pelican
   is the one left out. The manta brings its own 35% dodge (Shadowed Wings) —
   a ✦ Curse mutes it. The 80% a manta shows at the rail is the Elusive flag
   startBirdRaid adds, and that does not come with it into a sailor's team.

   A fight holds six waves at most. Sailor 5 already fields six, so his team
   comes back exactly as it was at the concert, with no birds. */
const SAILOR_BIRDS = ['mantaray','swan','cormorant'];
const SAILOR_WAVE_CAP = 6;
function sailorTeam(n){
  const waves = SAILORS[n].waves.map(w=>w.map(e=>({...e})));
  if(waves.length >= SAILOR_WAVE_CAP) return waves;
  const lv = waves[0][0].level;
  return [ SAILOR_BIRDS.map(sp=>({ species:sp, level:lv, ai:'power1' })), ...waves ];
}
function crewTeam(id){
  const sailor = /^sailor([1-5])$/.exec(id);
  if(sailor) return sailorTeam(+sailor[1]);
  const lv = 67;
  const CREW_TEAMS = {
    /* Gus — feeds a ship; everything here finds food */
    cook:    [ [{species:'pelican',level:lv},{species:'cormorant',level:lv}],
               [{species:'otter',level:lv+2}] ],
  };
  if(CREW_TEAMS[id])
    return CREW_TEAMS[id].map(w=>w.map(e=>({...e, ai:'best'})));
  if(id === 'ship_captain') return CAPTAIN_TEAM.waves;
  if(id === 'shipkeeper')   return SHIPKEEPER_TEAM.waves;
  return [[{species:'duck', level:lv, ai:'best'}]];
}
function fightCrew(id){
  if(!ensurePool()) return;
  beginBattle({ isNpc:true, name:crewName(id), npcId:id, bgKey:'battle_cabin_deck',
    waves: crewTeam(id).map(w=>w.map(e=>({...e}))),
    onWin: ()=> onCrewWin(id) });
}
async function onCrewWin(id){
  const h = hunt();
  const first = !h.beaten.includes(id);
  if(first){
    h.beaten.push(id);
    state.inventory.protein = (state.inventory.protein||0) + 1;
    if(id === 'ship_captain') r4().captainBeaten = true;
    if(id === 'shipkeeper')   r4().keeperBeaten  = true;
    await saveProfile();
  }
  const left = CABIN_FOES.filter(x=>!huntBeaten(x)).length;
  storyModal(npcPortrait(id, '⚓', 130, 'transparent'), crewName(id),
    `<b>"Well fought."</b><br><br>` +
    (first ? `<b>+1 Protein Supplement</b><br><br>` : '') +
    (left ? `<i>${left} still to see. The Whalelord is watching each of them go.</i>`
          : `<i>That is everyone. The Whalelord turns, at last, towards one particular cabin.</i>`),
    ()=>go('cabin_deck'), { bg:'battle_cabin_deck', subtitle:'Cabin Deck' });
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

/* ------------------------------------------------------------
   The order of the cabin deck hunt.
   Nothing on this deck is challengeable until the Whalelord has come aboard
   and said it smells something down here. Then the crew ping. Jax pings LAST,
   once everyone else has been cleared — the Whalelord will not name the boy
   until it has ruled out every other person on the deck.
   ------------------------------------------------------------ */
const CABIN_FOES = ['sailor1','sailor2','sailor3','sailor4','sailor5',
                    'ship_captain','shipkeeper','cook'];
function hunt(){
  const g = r4();
  g.hunt = g.hunt || { beaten:[] };
  return g.hunt;
}
function huntOpen(){ return !!r4().ghostAccepted; }
function huntBeaten(id){ return hunt().beaten.includes(id); }
function crewCleared(){ return CABIN_FOES.every(huntBeaten); }
/* A crew member pings while the hunt is open and they have not been beaten. */
function pings(id){
  if(!huntOpen()) return false;
  if(id === 'rival') return crewCleared() && !r4().rivalBeaten;
  return !huntBeaten(id);
}

/* Before any of that, he is simply insufferable. */
const JAX_IDLE = [
  `He is lying on the bunk with his boots on, reading nothing.<br><br>` +
  `<b>"You're on this boat too. Of course you are."</b><br><br>` +
  `He does not get up.`,
  `<b>"Whales."</b> He says it to the ceiling. <b>"Everyone's very excited about whales."</b><br><br>` +
  `<i>He has not asked you a single question since you came aboard.</i>`,
  `He glances at your party and looks away again.<br><br>` +
  `<b>"When there's something worth my time, I'll know."</b>`,
];
function rivalIdle(){
  const g = r4();
  const blocked = (g.wallFound && !g.solved) ? blockedLine('rival') : null;
  storyModal(npcPortrait('rival','🧑',140,'transparent'), 'Jax',
    blocked || JAX_IDLE[Math.floor(Math.random()*JAX_IDLE.length)],
    ()=>go('cabin_deck'), { bg:'battle_cabin_deck', subtitle:'Cabin Deck' });
}

function rivalCabin(){
  /* He will not be drawn until the Whalelord has cleared everybody else. */
  if(!huntOpen() || !crewCleared()) return rivalIdle();
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
    `<b>"Keep it. It's not the one I need."</b><br><br>` +
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
/* What each of them says they were doing that night, in their own words. The
   pairs back each other up. Mireille names the supervisor — who is the other
   one who did it, so her story holds until somebody else was awake. */
const SCI_ALIBI = {
  1: `"Me? I was counting plankton samples with Odile until sunrise. Eleven thousand and six. She counted the other half — ask her."`,
  2: `"I was in the darkroom with Osric, developing the sonar photographs. If that door opens, the pictures are ruined, so neither of us left. Honestly!"`,
  3: `"Thaddeus and I spent the whole night in the map room, charting the whale lane. It's all in my journal — his handwriting on every other page."`,
  4: `"Please. Rhona and I had the night watch on the tanks. Four hours of staring at bubbles. If I wanted excitement, I'd have joined the crew."`,
  5: `"Aldous and I were counting plankton all night. My eyes still hurt. Look at the clipboard — both our names, every hour."`,
  6: `"Inventory, with Barnaby. The whole night — jars, labels, crates, all of it." She smiles and does not look away. "Ask him, if you like. He'll tell you."`,
  7: `"I was developing photographs in the darkroom with Pim. At my age, young one, one does not go swimming in the middle of the night."`,
  8: `"Bertrand and I were charting the whale lane in the map room. Every line on that chart is ours, and it took us until dawn."`,
  9: `"Casimir had the night watch on the tanks, and I sat up with him. I couldn't sleep anyway. We were there until dawn."`,
};
const ALIBI_WHAT = { 1:'counting plankton samples', 5:'counting plankton samples',
  2:'in the darkroom with the sonar photographs', 7:'in the darkroom with the sonar photographs',
  3:'charting the whale lane in the map room', 8:'charting the whale lane in the map room',
  4:'on the night watch at the tanks', 9:'on the night watch at the tanks' };

/* Before a test, each of them says where they were. You can leave it there
   (Back) or test them anyway (Challenge). */
function sciAlibi(n){
  const d = sciDef(n); if(!d) return;
  const v = inv();
  const ov = document.createElement('div');
  ov.className = 'refine-scrim';
  ov.innerHTML = `
    <div class="refine-card">
      ${npcPortrait('scientist'+n,'🧑‍🔬',96,'transparent')}
      <div class="refine-name">${escapeHtml(crewName('scientist'+n))}</div>
      <div class="move-info-body">
        <p><b>"I had nothing to do with it."</b></p>
        <p>${SCI_ALIBI[n] || ''}</p>
        ${v.beaten.includes(n) ? `<p><i>Already tested this round.</i></p>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
        <button class="btn btn-primary" id="aliGo">Challenge</button>
        <button class="btn btn-ghost" id="aliNo">Back</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) ov.remove(); };
  ov.querySelector('#aliNo').addEventListener('click', close);
  ov.querySelector('#aliGo').addEventListener('click', ()=>{ close(); fightScientist(n); });
}

/* The clues describe them as they are now, fully grown, so every picture on
   the board is the last form, never the first. */
function finalStage(sp){ const e = SPECIES[sp] && SPECIES[sp].evo; return e ? e.length : 0; }
const FOCUS_PX = 165;       // 2.5 × the old 66
const ZOOM_PX  = 330;       // 5 × the old 66
function boardCss(){
  if(document.getElementById('boardCss')) return;
  const st = document.createElement('style');
  st.id = 'boardCss';
  st.textContent = `
    .focus-pair{display:flex;width:100%;margin-top:8px;}
    .focus-pair .fp-half{flex:1;display:flex;min-width:0;}
    .focus-pair .fp-half.l{justify-content:flex-end;}
    .focus-pair .fp-half.r{justify-content:flex-start;}
    .focus-pair button{all:unset;cursor:zoom-in;display:block;line-height:0;max-width:100%;}
    .focus-pair .mon-sprite, .mon-zoom .mon-sprite{filter:none !important;box-shadow:none !important;
      background:transparent !important;}
    .focus-pair .mon-sprite{max-width:100%;height:auto !important;aspect-ratio:1/1;}
    .mon-zoom{position:fixed;inset:0;background:rgba(20,18,14,.72);z-index:90;
      display:flex;align-items:center;justify-content:center;}
    .mon-zoom .mon-sprite{max-width:92vw;height:auto !important;aspect-ratio:1/1;}
  `;
  document.head.appendChild(st);
}
function zoomMon(sp){
  boardCss();
  const z = document.createElement('div');
  z.className = 'mon-zoom';
  z.innerHTML = monPortrait(sp, ZOOM_PX, { view:'front', bare:true, stage:finalStage(sp) });
  z.addEventListener('click', e=>{ if(e.target === z) z.remove(); });   // outside the picture only
  document.body.appendChild(z);
}

const GUESSES_PER_DAY = 2;

const CLUES = [
  `"A red glow. One of their monsters had red eyes or a red stone in its body."`,
  `"I... I think one of their monsters had no hands, feet or flippers. Fins only."`,
  `"I remember more! One of their monsters shocked me - electricity! And it flashed brightly at me, I could barely see!"`,
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
/* ------------------------------------------------------------
   THE LABORATORY DECK — three stages.

   1  BLOCKED. The ship has stopped and nobody knows why. All TEN of them are
      puzzled — nine researchers and their supervisor — and two are a shade
      less puzzled than they should be.

      Worth knowing: you only ever fight the nine, and the accusation board
      only ever offers the nine. Barnaby takes the reports; he is never a
      candidate. That gap is the trick of the whole mystery, so the counts on
      screen are deliberately different — ten people, nine suspects.
   2  INVESTIGATION. Only once Jax has handed over the Ghost Stone and been
      cleared does the Whalelord come down here and start naming people.
   3  SOLVED. Rhona runs the deck, and the requests come in.
   ------------------------------------------------------------ */
function labStage(){
  const g = r4();
  if(g.solved) return 'after';
  /* The Whalelord will not accuse a room full of scientists while it still has
     a question about the boy upstairs. Jax first, and completely. */
  if(g.rivalBeaten && g.stoneWon && g.ghostAccepted) return 'investigation';
  return 'blocked';
}

/* What the nine make of a sea that has stopped letting them past. Two of these
   are a slip, and both vanish the moment the investigation opens — by then
   everybody is being careful. */
const PUZZLED = {
  1: `He is holding a flask up to the light and not looking at it.<br><br>` +
     `<b>"Chemistry doesn't do this. Chemistry doesn't hold a grudge."</b>`,
  2: `<b>"I've run it four times."</b> He pushes his glasses up. <b>"The pod structure is wrong. ` +
     `They're not organised for feeding or for breeding."</b><br><br>` +
     `<b>"They're organised for... standing somewhere."</b>`,
  3: `He turns the journal round so you can see. Page after page of the same tally.<br><br>` +
     `<b>"Day eleven. Still there. Day twelve. Still there."</b>`,
  4: `<b>"It's a blockade."</b> He is enjoying being the one to say it.<br><br>` +
     `<b>"Say what you like about animals not having politics."</b>`,
  5: `<b>"Barnaby says not to worry the crew."</b> She is worrying anyway.<br><br>` +
     `<b>"How am I meant to write this up? <i>The sea declined?</i>"</b>`,
  /* Mireille. She is not puzzled at all, and she nearly says so. */
  6: `She does not look up from the sink.<br><br>` +
     `<b>"They're grieving."</b><br><br>` +
     `A pause, slightly too long. <b>"Whales do that. It's in the literature."</b><br><br>` +
     `<i>You did not tell her anything had died.</i>`,
  7: `<b>"Forty years of migration charts, all useless in a fortnight."</b><br><br>` +
     `He does not seem sorry about it. <b>"Something changed. I would like to know what."</b>`,
  8: `<b>"An animal will move for a ship. Every time. Always has."</b><br><br>` +
     `He taps the bench. <b>"Unless something matters more than the ship."</b>`,
  9: `She is in a wetsuit, half out of it, hair still wet.<br><br>` +
     `<b>"I've been down twice. They let me right through."</b> She looks genuinely thrilled. ` +
     `<b>"They're not angry at <i>us</i>."</b>`,
};
/* Supervisor Barnaby. Kindly, reassuring, and far too precise about the date. */
const PUZZLED_SUP =
  `He is eating a sandwich and being calm at everyone.<br><br>` +
  `<b>"They'll move. Animals always move. We'll be under way by the weekend."</b><br><br>` +
  `He says it warmly, and then, half to himself:<br><br>` +
  `<b>"It only started on the ninth. That's nothing, in whale terms."</b><br><br>` +
  `<i>Nobody on this ship has told you when it started.</i>`;

function renderLaboratoryDeck(){
  const stage = labStage();
  if(typeof renderWalkDeck === 'function') return renderWalkDeck('laboratory_deck');
  setScreenBg('sea');
  playMusicChain(['zone_laboratory_deck','region4','region']);
  $('#brandSub').textContent = 'Laboratory';

  const v = inv();
  const investigating = stage === 'investigation';
  /* Pinned to the plan: dry work forward, cold rooms amidships, wet work aft by
     the tanks. Mireille is in the wet lab, which is exactly how she had reason
     to be near a diving suit at two in the morning. */
  /* The hull is narrower than it looks: the rooms run roughly 36%–66% across.
     Anything wider than that sits on the plating outside. */
  const STATIONS = [
    { n:1, x:39, y:20 },   // forward bench, port
    { n:2, x:61, y:23 },   // by the companionway
    { n:3, x:39, y:32 },   // notes and charts
    { n:4, x:61, y:33 },   // cold room door
    { n:5, x:41, y:41 },   // the long bench
    { n:6, x:60, y:47 },   // WET LAB — the sinks
    { n:7, x:41, y:49 },   // microscopes
    { n:8, x:41, y:57 },   // instrument rack
    { n:9, x:60, y:57 },   // tank bench, aft
  ];
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="ship-deck" id="labDeck">
      <img src="assets/zones/laboratory_deck.png" alt="" class="ship-img"
           onerror="this.style.display='none';this.parentNode.classList.add('no-art')">

      <button class="deck-pin" style="left:50%;top:13%;" data-sup="1">
        ${npcPortrait('scientist_supervisor','🧑‍🔬',48,'transparent')}</button>

      ${investigating ? `<button class="deck-pin" style="left:50%;top:66%;" data-ghost="1">
        ${monPortrait('whalelord',52,{view:'front',bare:true})}</button>` : ''}

      ${STATIONS.map(st=>`
        <button class="deck-pin sci-pin ${investigating && sciBeaten(st.n) ? 'beaten' : ''}"
                style="left:${st.x}%;top:${st.y}%;" data-sci="${st.n}">
          ${investigating && !sciBeaten(st.n) ? '<div class="suspect-pulse"></div>' : ''}
          ${npcPortrait('scientist'+st.n,'🧑‍🔬',44,'transparent')}
          ${investigating && sciBeaten(st.n) ? `<svg class="sci-tick" viewBox="0 0 24 24"><path d="M4 12.5 L9.5 18 L20 6"
            fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
        </button>`).join('')}
    </div>

    <div class="phase-flag">${
      !investigating
        ? 'Ten of them down here, and not one can explain it.'
        : (allBeaten()
            ? (guessesLeft()
                ? `All nine beaten. Tap the supervisor to name someone. <b>${guessesLeft()} guess${guessesLeft()>1?'es':''} left today.</b>`
                : `No guesses left today. Think it over and come back tomorrow.`)
            : `Beat all nine to earn a guess. <b>${v.beaten.length} / 9</b>`)
    }</div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('explore'));
  screenEl.querySelectorAll('[data-sci]').forEach(b=>b.addEventListener('click', ()=>{
    const n = +b.dataset.sci;
    if(!investigating) return puzzledChat(n);
    fightScientist(n);
  }));
  screenEl.querySelector('[data-sup]').addEventListener('click', ()=>{
    if(!investigating) return puzzledSup();
    if(!allBeaten()) return supervisorNudge();
    if(!guessesLeft()) return supervisorPatience();
    go('accuse');
  });
  const gh = screenEl.querySelector('[data-ghost]');
  if(gh) gh.addEventListener('click', ()=>showClues());
}

function puzzledChat(n){
  storyModal(npcPortrait('scientist'+n,'🧑‍🔬',130,'transparent'), crewName('scientist'+n),
    PUZZLED[n] || `<b>"I have nothing useful to tell you."</b>`,
    ()=>go('laboratory_deck'), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}
function puzzledSup(){
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'),
    crewName('scientist_supervisor'), PUZZLED_SUP,
    ()=>go('laboratory_deck'), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
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
  beginBattle({ isNpc:true, name:crewName('scientist9'), npcId:'scientist9', bgKey:'battle_laboratory_deck',
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
      <div class="phase-flag">The crew are aboard, not on a list. Go and find them.</div>
      <div class="challenge-card" id="cCaptainHidden" style="display:none;">
        ${npcPortrait('ship_captain','⚓',54,'transparent')}
        <div style="flex:1;">
          <div class="cc-title">${crewName('ship_captain')} ${g.captainBeaten?'<span class="clear-tag">Beaten</span>':''}</div>
          <div class="cc-desc">${g.captainBeaten
            ? (g.wallFound ? 'He gets bored. He will go again for the exercise.' : 'Busy with the charts.')
            : 'Six waves. Forty years of not losing a ship.'}</div>
        </div>
      </div>
      <div class="challenge-card" id="cKeeperHidden" style="display:none;">
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
  /* The captain and the shipkeeper are fought where they stand, on the deck —
     a murder mystery should not have a menu of suspects. */
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
  const g = r4();
  const blocked = (g.wallFound && !g.solved) ? blockedLine('shipkeeper') : null;
  storyModal(npcPortrait('shipkeeper','⚓',130,'transparent'), crewName('shipkeeper'),
    blocked || KEEPER_LINES[Math.floor(Math.random()*KEEPER_LINES.length)],
    ()=>go('cabin_deck'),
    { bg:'battle_cabin_deck', subtitle:'Cabin Deck',
      action:{ label:'🛒 Shop', fn:()=>{
        /* opened from the deck? the shop's Back should return there */
        if(typeof walkState === 'function' && walkState().deck) ui.walkBack = walkState().deck;
        go('shop');
      } } });
}

/* ============================================================
   DAILY HUNTS
   Two researchers each want something brought back. One ordinary, one rare.
   ============================================================ */
function hunts(){
  const g = r4();
  g.hunts = g.hunts || { day:null, a:null, b:null, doneA:false, doneB:false };
  const hadRhona = [g.hunts.a, g.hunts.b].some(h=> h && h.sci === 9);
  if(g.hunts.day !== today() || hadRhona){
    /* Rhona has her own task now; the others take turns asking. */
    const pool = [1,2,3,4,5,7,8].filter(n=>n!==CULPRIT);
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
    { bg:'battle_laboratory_deck', subtitle:'Laboratory',
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
  if(!g.cuainRevived) return 'none';     // it will not come to the rail again until it has helped him
  if(legendaryTaken('caladrius')) return 'gone';   // one of each legendary: once caught, never again
  return 'wild';                          // thereafter, very rarely
}
/* The rail's own roster: mostly birds (and the manta, which flies), a grown
   Loong now and then — it is found on the line as well as in the deep — a
   Moon Swan rarely, and Caladrius very rarely, once it has helped him. Nothing
   from the sea floor comes up here. */
function birdRoll(){
  const stage = caladriusStage();
  if(stage === 'plea') return 'caladrius';
  const r = Math.random();
  if(stage === 'wild' && r < 0.03) return 'caladrius';
  if(r < 0.08) return 'moon_swan';
  if(r < 0.14) return 'loong';
  return BIRD_COMMON[Math.floor(Math.random()*BIRD_COMMON.length)];
}

function startBirdRaid(){
  if(!ensurePool()) return;
  if(caladriusStage() === 'plea') return caladriusPlea();
  ui.currentZone = { id:'weather_deck', name:'The rail' };
  const lv = birdLevel();
  const pick = birdRoll();
  const n = 1 + Math.floor(Math.random()*3);
  const wave = Array.from({length:n}, ()=>{
    const sp = birdRoll();
    if(sp === 'loong') return { species:'loong', level:Math.max(lv, 41), ai:'best' };   // grown
    const spec = { species:(sp==='caladrius'?'moon_swan':sp), level:lv + Math.floor(Math.random()*3)-1, forceStage:0 };
    if(spec.species === 'mantaray' || spec.species === 'moon_swan') spec.elusive = true;
    return spec;
  });
  if(pick === 'caladrius'){
    wave.length = 1;
    /* A heavenly bird: always 77, and Elusive — given the chance it simply
       leaves. Pin it down (Magma Goo, or anything with the noflee rider) and it
       has to fight: Vita once to steady itself, then Conversio again and again. */
    wave[0] = { species:'caladrius', level:77, elusive:true, ai:'caladrius' };
  }
  beginBattle({ waves:[wave], isNpc:false, allowCatch:true, name:'Raid on the hauls',
    bgKey:'battle_weather_deck', onWin: ()=> onRailWin() });
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


/* ============================================================
   THE INVESTIGATION — the nine, the clues, the accusation
   ============================================================ */
const SCI_LV = 68;

function sciDef(n){ return SCI.find(x=>x.n === n); }

function fightScientist(n){
  if(!ensurePool()) return;
  const d = sciDef(n);
  if(!d) return;
  beginBattle({ isNpc:true, name:crewName('scientist'+n), npcId:'scientist'+n,
    bgKey:'battle_laboratory_deck',
    waves:[ d.wild.map(sp=>({species:sp, level:SCI_LV, ai:'best'})),
            [{species:d.elite, level:SCI_LV+1, ai:'best'}] ],
    onWin: ()=> onScientistWin(n) });
}
async function onScientistWin(n){
  const v = inv();
  const first = !v.beaten.includes(n);
  /* The nine come round again after a wrong name, so the supplement is for the
     first time you beat each of them, not for each round of testing. */
  v.firstWins = v.firstWins || [];
  const everFirst = first && !v.firstWins.includes(n);
  if(first){
    v.beaten.push(n);
    if(everFirst){
      v.firstWins.push(n);
      state.inventory.protein = (state.inventory.protein||0) + 1;
    }
    await saveProfile();
  }
  storyModal(npcPortrait('scientist'+n,'🧑‍🔬',130,'transparent'), crewName('scientist'+n),
    `<b>"Well fought. Honestly."</b><br><br>` +
    (everFirst ? `<b>+1 Protein Supplement</b><br><br>` : '') +
    (allBeaten() ? `<i>That is all nine. ${crewFirst('scientist_supervisor')} will hear your report.</i>`
                 : `<i>${v.beaten.length} of 9 tested.</i>`),
    ()=>go('laboratory_deck'), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}

/* What the Whalelord remembers, as much of it as you have earned. */
function showClues(){
  const v = inv();
  storyModal(monPortrait('whalelord',140,{view:'front',bare:true}), 'What we know',
    `<b>Two creatures swam beside them.</b> A researcher is worth suspecting if ` +
    `<i>either</i> of theirs fits.<br><br>` +
    CLUES.slice(0, v.clues).map((c,k)=>`<b>${k+1}.</b> ${c}`).join('<br><br>') +
    (v.clues < CLUES.length
      ? `<br><br><i>It remembers more, but not clearly. Name somebody and be wrong, and it will try harder.</i>`
      : ''),
    ()=>go('laboratory_deck'), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}
function supervisorNudge(){
  const v = inv();
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'),
    crewName('scientist_supervisor'),
    `He is eating a sandwich and seems delighted to be interrupted.<br><br>` +
    `<b>"Talk to all of them first. Every single one."</b> He says it warmly. ` +
    `<b>"You can't clear a person you haven't met."</b><br><br>` +
    `<i>${v.beaten.length} of 9 tested.</i>`,
    ()=>go('laboratory_deck'), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}
function supervisorPatience(){
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'),
    crewName('scientist_supervisor'), `<b>"That's twice today."</b> Still kindly, still patient.<br><br>` +
    `<b>"These are people you're naming, and they have to work alongside whoever you pick."</b><br><br>` +
    `<b>"Take some time. Think it through. They'll still be here tomorrow."</b>`,
    ()=>go('laboratory_deck'), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}

/* ---------- the accusation board ---------- */
function renderAccuse(){
  const v = inv();
  setScreenBg('battle_laboratory_deck');
  $('#brandSub').textContent = 'Name someone';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Laboratory</button>
    <div class="clue-box">
      <b>What the Whalelord remembers</b><br><br>
      ${CLUES.slice(0, v.clues).map((c,k)=>`<b>${k+1}.</b> ${c}`).join('<br><br>')}
    </div>
    <div class="phase-flag">Tap to see their monster portraits more closely.</div>
    <div class="sci-grid">
      ${SCI.map(d=>`
        <button class="sci-cell" data-acc="${d.n}">
          ${npcPortrait('scientist'+d.n,'🧑‍🔬',46,'transparent')}
          <div class="sci-name">${escapeHtml(crewFirst('scientist'+d.n))}</div>
          <div class="sci-mons">
            ${monPortrait(d.wild[0], 22, {view:'front', bare:true, stage:finalStage(d.wild[0])})}
            ${monPortrait(d.elite, 22, {view:'front', bare:true, stage:finalStage(d.elite)})}
          </div>
        </button>`).join('')}
    </div>
    <div class="phase-flag"><b>${guessesLeft()}</b> accusation${guessesLeft()===1?'':'s'} left today.</div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('laboratory_deck'));
  screenEl.querySelectorAll('[data-acc]').forEach(b=>
    b.addEventListener('click', ()=>focusScientist(+b.dataset.acc)));
}

/* A closer look before you commit. */
function focusScientist(n){
  const d = sciDef(n), v = inv();
  boardCss();
  const pics = [d.wild[0], d.elite];
  const ov = document.createElement('div');
  ov.className = 'refine-scrim';
  ov.innerHTML = `
    <div class="refine-card" style="max-width:420px;">
      <div class="sci-focus">
        ${npcPortrait('scientist'+n,'🧑‍🔬',110,'transparent')}
        <div class="refine-name">${escapeHtml(crewName('scientist'+n))}</div>
        <div class="refine-sub">${escapeHtml(d.look)}</div>
        <div class="focus-pair">
          ${pics.map((sp, i)=>`<div class="fp-half ${i === 0 ? 'l' : 'r'}">
            <button data-zoom="${sp}">${monPortrait(sp, FOCUS_PX, {view:'front', bare:true, stage:finalStage(sp)})}</button>
          </div>`).join('')}
        </div>
        <div class="refine-sub" style="margin-top:4px;">Tap a monster to see it at full size.</div>
      </div>
      <div class="clue-box" style="margin-top:12px;">
        ${CLUES.slice(0, v.clues).map((c,k)=>`<b>${k+1}.</b> ${c}`).join('<br><br>')}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
        <button class="btn btn-primary" id="accYes">You're the culprit!</button>
        <button class="btn btn-ghost" id="accNo">Back</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#accNo').addEventListener('click', close);
  ov.querySelectorAll('[data-zoom]').forEach(b=> b.addEventListener('click', ()=> zoomMon(b.dataset.zoom)));
  ov.querySelector('#accYes').addEventListener('click', ()=>{ close(); accuse(n); });
}

async function accuse(n){
  const v = inv();
  v.guesses++;
  if(n === CULPRIT){
    /* The right name: Rhona, the captain and the shipkeeper come down and stand
       by — through the fight and the talk after it, until the bow. */
    const g = r4();
    g.culpritNamed = true;
    const w = walkState(), at = w.at && w.at.laboratory_deck;
    if(at && UP_FRONT.some(u=> u.x === at.x && u.y === at.y)) w.at.laboratory_deck = { x:13, y:6 };
    await saveProfile();
    return accuseCulprit();
  }
  /* Wrong. Their alibi partner speaks up, the Whalelord tries harder — and the
     nine have to be tested again from the top before anybody else can be named.
     Being wrong costs the work, never the case. */
  if(v.clues < CLUES.length) v.clues++;
  v.beaten = [];
  await saveProfile();
  alibiConfirm(n);
}
function alibiConfirm(n){
  const buddy = ALIBI[n];
  const v = inv();
  storyModal(npcPortrait('scientist'+buddy,'🧑‍🔬',130,'transparent'), crewName('scientist'+buddy),
    `<b>"No. Not a chance."</b> ${crewFirst('scientist'+buddy)} does not even look up.<br><br>` +
    `<b>"We were both ${ALIBI_WHAT[n] || 'on shift'}. All night. Ask anyone."</b><br><br>` +
    `<i>${crewFirst('scientist'+n)} is cleared.</i><br><br>` +
    `<i>Word goes round the deck. All nine will have to be tested again before you can name ` +
    `anybody else.</i>` +
    (v.clues < CLUES.length || v.clues === CLUES.length
      ? `<br><br>👻 <i>The Whalelord strains, and remembers something else.</i>` : ''),
    ()=>go('laboratory_deck'), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}

/* ---------- the culprit, and what follows ---------- */
function accuseCulprit(){
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'),
    crewName('scientist_supervisor'),
    `<b>"Mireille?"</b> He actually laughs. <b>"No, no. She was with me."</b><br><br>` +
    `<b>"Both of us, the whole night. Inventory."</b> He is still smiling. ` +
    `<b>"Dull work, but it does rather settle the question."</b>`,
    ()=>culprit2(), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}
function culprit2(){
  storyModal(npcPortrait('scientist9','🧑‍🔬',130,'transparent'), crewName('scientist9'),
    `<b>"That's not right."</b><br><br>` +
    `${crewFirst('scientist9')} has gone very still.<br><br>` +
    `<b>"I was up at two. I couldn't sleep, so I went to check the tanks."</b><br><br>` +
    `<b>"You weren't doing inventory. Neither of you were here at all."</b>`,
    ()=>culprit3(), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}
function culprit3(){
  storyModal(npcPortrait('diver1','🤿',130,'transparent'), crewName('diver1'),
    `The diver has been standing in the hatchway for a while.<br><br>` +
    `<b>"Somebody borrowed a suit that week."</b> He says it slowly, working it out ` +
    `as he goes. <b>"Signed it back in wet. I thought it was one of the lads."</b><br><br>` +
    `He looks at the woman by the sink.<br><br>` +
    `<b>"It was your handwriting."</b>`,
    ()=>culprit4(), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}
function culprit4(){
  storyModal(npcPortrait('scientist6','🧑‍🔬',130,'transparent'), crewName('scientist6'),
    `She puts down what she is holding and dries her hands, unhurried.<br><br>` +
    `<b>"It was already dying."</b><br><br>` +
    `<b>"Somebody had opened it from jaw to fin and left it to sink, and it didn't. ` +
    `It swam three hundred miles with a hole in it."</b> Her voice does not rise at all. ` +
    `<b>"We were only ever going to be the ones who finished it."</b>`,
    ()=>culprit5(), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}
function culprit5(){
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'),
    crewName('scientist_supervisor'),
    `The warmth goes out of him like a light switched off. It is the speed of it ` +
    `that is frightening.<br><br>` +
    `<b>"A core like that funds a department for twenty years."</b><br><br>` +
    `<b>"Cosa Nostia paid for this berth, this equipment, and half of your captain's fuel. ` +
    `They asked for one thing."</b><br><br>` +
    `<i>He rolls up his sleeves.</i> <b>"You should have kept counting whales."</b>`,
    ()=>startCulpritFight(0), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}

function startCulpritFight(i){
  if(!ensurePool()) return;
  if(i === 0){
    return beginBattle({ isNpc:true, name:crewName('scientist6'), npcId:'scientist6',
      bgKey:'battle_laboratory_deck',
      waves:[ [{species:'lanternfish',level:78,ai:'best'},{species:'lanternfish',level:78,ai:'best'}],
              [{species:'moon_swan',level:79,ai:'best'},{species:'cormorant',level:79,ai:'best'}],
              [{species:'plesiosaur',level:80,ai:'best'},{species:'otter',level:80,ai:'best'}],
              [{species:'loong',level:82,ai:'best',forceStage:R4_MAXSTAGE}] ],
      onWin: ()=> startCulpritFight(1) });
  }
  storyModal(npcPortrait('scientist_supervisor','🧑‍🔬',130,'transparent'),
    crewName('scientist_supervisor'),
    `<b>"She was the hands."</b> He steps over her fallen monsters without looking down.<br><br>` +
    `<b>"I was the reason."</b>`,
    ()=> beginBattle({ isNpc:true, name:crewName('scientist_supervisor'),
      npcId:'scientist_supervisor', bgKey:'battle_laboratory_deck',
      waves:[ [{species:'sea_turtle',level:80,ai:'best'},{species:'duck',level:80,ai:'best'},{species:'seahorse',level:80,ai:'best'}],
              [{species:'pelican',level:81,ai:'best'},{species:'swan',level:81,ai:'best'}],
              [{species:'mantaray',level:82,ai:'best'},{species:'cormorant',level:82,ai:'best'}],
              [{species:'whale',level:83,ai:'best',forceStage:R4_MAXSTAGE}],
              [{species:'moon_swan',level:84,ai:'best'},{species:'plesiosaur',level:84,ai:'best'}],
              [{species:'ninja',level:85,ai:'best',forceStage:R4_MAXSTAGE,crowned:true,supplements:10}] ],
      onWin: ()=> startEpilogue() }),
    { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}

/* ------------------------------------------------------------
   AFTER THE FIGHT, AND THE BOW
   From the moment the two of them go down, every word is said in a small
   window so the deck stays in view behind it. Each part is a stage kept in the
   save (escapeStage), so a closed app or a trip off the ship puts the player
   straight back into it: 'epilogue' in the laboratory, 'bow' on the weather
   deck with one button, 'room' in the cabin while you come round.
   ------------------------------------------------------------ */
/* Who stands by in the laboratory once Mireille has been named. */
const UP_FRONT = [
  { id:'scientist9',   x:12, y:7, icon:'🧑‍🔬', line:`<b>"Two of our own. I still can't quite believe it."</b>` },
  { id:'ship_captain', x:14, y:7, icon:'⚓',   line:`<b>"Go on. We're right behind you."</b>` },
  { id:'shipkeeper',   x:15, y:7, icon:'🧰',   line:`<b>"Nobody leaves this deck until it's done."</b>` },
];
function crewUpFront(){
  const g = r4();
  return !!(g.culpritNamed && !g.solved && (!g.escapeStage || g.escapeStage === 'epilogue'));
}
function upFrontChat(id){
  const u = UP_FRONT.find(x=> x.id === id);
  if(u) sceneSay([faceNpc(u.id, u.icon)], crewName(u.id), u.line);
}
function escapeLock(){
  const g = r4(), w = walkState();
  if(g.escapeStage === 'epilogue'){
    const p = (w.at && w.at.laboratory_deck) ||
      { x:DECKS.laboratory_deck.spawn[0], y:DECKS.laboratory_deck.spawn[1] };
    return { deck:'laboratory_deck', x:p.x, y:p.y, label:null, auto:()=> culpritEpilogue() };
  }
  if(g.escapeStage === 'bow')
    return { deck:'weather_deck', x:14, y:4, ghost:{ x:14, y:5 }, face:'u',
             label: ui.sceneRunning ? null : 'Stop Jax from leaving',
             act:()=> runJaxEscape(), stage:()=> stageBow() };
  if(g.escapeStage === 'room')
    return { deck:'cabin_deck', x:14, y:25, ghost:{ x:14, y:26 }, face:'l',
             label:null, stage:()=> stageRoom(), auto:()=> runWakeUp() };
  return null;
}
/* Whatever scene has you, if any. The walkmap asks only this. */
function storyLock(){ return corpseLock() || escapeLock() || revivalLock(); }

async function startEpilogue(){
  const g = r4();
  g.escapeStage = 'epilogue';
  await saveProfile();
  go('laboratory_deck');                       // the lock starts the epilogue itself
}
async function culpritEpilogue(){
  if(ui.sceneRunning) return;
  ui.sceneRunning = true;
  await sceneWait(600);
  const cap = faceNpc('ship_captain','⚓'), rhona = faceNpc('scientist9','🧑‍🔬');
  await sceneSay([cap], crewName('ship_captain'),
    `<b>"Twenty years I've carried scientists on this ship, and I have never once been ashamed ` +
    `of it. Until today."</b><br><br>` +
    `<b>"You cut open a living creature for money. Whatever Cosa Nostia paid you, it was never ` +
    `yours to sell."</b>`);
  await sceneSay([rhona], crewName('scientist9'),
    `<b>"We came out here to learn from them. You turned our laboratory into a butcher's shop."</b><br><br>` +
    `<b>"And for what? A bigger budget?"</b>`);
  await sceneSay([cap], crewName('ship_captain'),
    `He turns to you, and some of the hardness goes out of his face.<br><br>` +
    `<b>"You found them when none of us could. Thank you."</b>`);
  await sceneSay([rhona], crewName('scientist9'),
    `<b>"Thank you. Truly."</b> She looks out at the water. <b>"Is that enough? Will they let us go now?"</b>`);
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"WAIT."</b><br><br>` +
    `<b>"My core! I can feel my core! It is close — it is ABOVE US!"</b><br><br>` +
    `<b>"Hurry! Take me up there! NOW!"</b>`);
  const g = r4();
  g.escapeStage = 'bow';
  await saveProfile();
  ui.sceneRunning = false;
  blackoutTo(()=> go('weather_deck'), { hold:700 });
}

/* The bow, before anybody moves: Jax at the very point of it, his Loong in
   the air beside him, the crew below, and you with the Whalelord at your
   back. Nothing happens until you press the one button. */
function stageBow(){
  sceneActor('jax',     { x:13, y:3, src:'assets/npc/rival.png', icon:'🧑', z:61 });
  sceneActor('loong',   { x:14, y:2, w:2, h:2, src:'assets/mon/loong1_c_front.png', icon:'🐉', bob:true, z:60 });
  sceneActor('captain', { x:12, y:6, src:'assets/npc/ship_captain.png', icon:'⚓' });
  sceneActor('keeper',  { x:13, y:6, src:'assets/npc/shipkeeper.png', icon:'🧰' });
  sceneActor('rhona',   { x:14, y:6, src:'assets/npc/scientist9.png', icon:'🧑‍🔬' });
}
function stageRoom(){
  sceneActor('thaddeus', { x:13, y:25, src:'assets/npc/scientist8.png', icon:'🧑‍🔬' });
}

async function runJaxEscape(){
  if(ui.sceneRunning) return;
  ui.sceneRunning = true;
  refreshWalk();                               // the button goes; from here you watch
  const name = state.name || 'You';
  const me = facePlayer(), jax = faceNpc('rival','🧑'), whale = faceMon('whalelord');
  await sceneSay([me], name, `<b>"Jax, stop right there!"</b>`);
  await sceneSay([jax, faceImg('assets/UI/whalelord_core.png','💠')], 'Jax', `<b>"Looking for this?"</b>`);
  await sceneSay([whale], whaleName(), `<b>"My core! Give it back!"</b>`);
  await sceneSay([jax], 'Jax',
    `<b>"Never hide a whale's treasure in the ocean."</b><br><br>` +
    `<b>"The moment I took it, I knew those whales would come looking. So I never kept it down ` +
    `here at all."</b><br><br>` +
    `<b>"I had my Loong carry it. Flying high above your heads, the whole time."</b>`);

  await sceneWait(2000);
  await sceneSay([faceNpc('ship_captain','⚓')], crewName('ship_captain'),
    `<b>"You murderer. We gave you passage on our ship. Return that core at once!"</b>`);
  await sceneSay([jax], 'Jax',
    `<b>"Murderer? I never hurt the whale. Your scientists did all the work. They handed me the core."</b>`);
  await sceneSay([faceNpc('scientist9','🧑‍🔬')], crewName('scientist9'),
    `<b>"That doesn't matter. You're working for the same person, aren't you?"</b>`);
  await sceneSay([faceNpc('shipkeeper','🧰')], crewName('shipkeeper'),
    `<b>"If you won't hand the core over, we'll just have to force you to."</b>`);
  await sceneSay([jax], 'Jax',
    `<i>Jax laughs.</i><br><br>` +
    `<b>"From what I've seen, none of you have what it takes. You see, I know a thing or two ` +
    `about the power of the core."</b>`);
  await sceneSay([whale], whaleName(), `<b>"Watch out, he's summoning my power!"</b>`);

  /* The core's power, gathering over the middle of the deck. */
  await sceneWait(500);
  /* The deck trembles while the power gathers: faint and quick at first,
     harder towards the end of the charge, hardest in the blast and the white,
     then gone fast as the white lifts. The timings match core_blast.mp3: a
     5-second charge, then the white (0.5 s in, 3.5 s held, 0.5 s out). */
  const CHARGE = 5000, WHITE_IN = 500, WHITE_HOLD = 3500, WHITE_OUT = 500;
  const peak = CHARGE + WHITE_IN, lift = peak + WHITE_HOLD, total = lift + WHITE_OUT;
  const quake = sceneShake(total, ms=>{
    if(ms < CHARGE) return 0.02 + 0.08 * Math.pow(ms / CHARGE, 2);
    if(ms < peak)   return 0.10 + 0.05 * ((ms - CHARGE) / WHITE_IN);
    if(ms < lift)   return 0.15;
    return 0.15 * Math.pow(Math.max(0, 1 - (ms - lift) / WHITE_OUT), 2);
  });
  playSfx('core_blast');                          // assets/sfx/core_blast.mp3
  await sceneBall(13.5, 5.5, 3, CHARGE);
  await sceneFlash(WHITE_IN, WHITE_HOLD, ()=>{
    const b = document.getElementById('sceneBall'); if(b) b.remove();
    sceneFaintPlayer(1);
    sceneActor('captain', { faint:-1 });
    sceneActor('keeper',  { faint:1 });
    sceneActor('rhona',   { faint:-1 });
    sceneActor('loong',   { flip:true });  // turned east, ready to go
  }, WHITE_OUT);
  await quake;
  await sceneSay([jax], 'Jax', `<b>"Thanks for the ride."</b>`);

  /* Up onto its back: 0.6 of a tile above and 0.3 to the right of the point
     where its four squares meet, in front of it. */
  await sceneHop('jax', 15 + 0.3 - 0.5, 3 - 0.6 - 0.5, 1.2, 700);
  ['jax','loong'].forEach(id=>{                // bob as one
    const el = document.getElementById('sa-' + id); if(!el) return;
    el._o.bob = true; el.classList.remove('bob'); void el.offsetWidth; el.classList.add('bob');
  });
  /* a mild rumble as the Loong goes: you feel it more than see it */
  const rumble = sceneShake(2600, ms=> 0.045 - 0.025 * (ms / 2600));
  await sceneGlide(['jax','loong'], 12, 0, 2600);
  await rumble;
  sceneActorGone('jax'); sceneActorGone('loong');

  await sceneWait(1000);
  await sceneSay([whale], whaleName(), `<b>"${escapeHtml(name)}! ${escapeHtml(name)}!"</b>`);
  await sceneSay([me], name, `<b>"... Ugh..."</b>`);

  await sceneCurtain(true, 900);
  await sceneWait(2000);
  await sceneCurtainText('You wake up in your own room. Someone is attending to you.', 900);
  await sceneWait(1800);
  const g = r4();
  g.escapeStage = 'room';
  await saveProfile();
  sceneClear();
  go('cabin_deck');                            // the room is set, but it does not start itself
  await sceneCurtainText('', 500);
  await sceneCurtain(false, 900);
  ui.sceneRunning = false;
  await runWakeUp();
}

async function runWakeUp(){
  if(ui.sceneRunning) return;
  ui.sceneRunning = true;
  stageRoom();
  await sceneWait(2000);
  const name = state.name || 'You';
  const me = facePlayer(), whale = faceMon('whalelord'), th = faceNpc('scientist8','🧑‍🔬');
  const wn = whaleName();
  await sceneSay([th], crewName('scientist8'), `<b>"Don't move too much, you were hit badly."</b>`);
  await sceneSay([me], name, `<b>"Jax... The core..."</b>`);
  await sceneSay([whale], wn, `<b>"Take care of yourself. Rest."</b>`);
  await sceneSay([me], name, `<b>"Whalelord... I'm sorry. I failed you."</b>`);
  await sceneSay([whale], wn, `<b>"You did your best. I... I'm glad you're not too hurt."</b>`);
  await sceneSay([whale], wn,
    `<b>A moment of silence. The whalelord struggles with guilt.</b><br><br>` +
    `<b>"I should thank you. All this while, I've been seeking my own revenge, and my core. ` +
    `I never thought about the danger I was putting you through."</b>`);
  await sceneSay([whale], wn,
    `<b>"You helped me without ever asking anything in return. Now it's my turn to do my part. ` +
    `Though I might be weak, I promise, I'll help you on your mission. Whatever it takes."</b>`);
  await sceneSay([whale], wn,
    `<b>"I will follow you from now on. My power... what's left of it... let's use it for good, ` +
    `together."</b><br><br>` +
    `<b>Whalelord has joined your party. He does not take up a monster slot.</b>`);
  await sceneWait(1000);
  await sceneSay([th], crewName('scientist8'),
    `<b>"Um. You've been talking to yourself. We'd better take a second look at your head."</b>`);

  await sceneCurtain(true, 900);
  await sceneWait(2000);
  const g = r4();
  g.escapeStage = null;
  g.solved = true;                             // the whales have their answer
  g.cuainJoined = true;
  /* A passenger: in your party for good, never one of your six. */
  grantCuain();
  await saveProfile();
  sceneClear();
  ui.sceneRunning = false;
  go('cabin_deck');
  await sceneCurtain(false, 900);
  toast('The whales have gone. The lane east is open.');
}

/* ------------------------------------------------------------
   CALADRIUS, AND A SEVENTH
   Past 60 on the expedition the Whalelord feels something good nearby. The
   white bird binds the Ghost Stone to him and gives him back enough of his
   strength to fight: from then on he battles, takes protein and learns skills
   like anyone — a seventh, never one of your six, and still never put away.
   Staged in the save (revivalStage: 'call', then 'deck') like the other scenes.
   ------------------------------------------------------------ */
const REVIVAL_AT = 60;
function revivalLock(){
  const g = r4(), w = walkState();
  if(g.revivalStage === 'call'){
    const d = (w.deck && DECKS[w.deck]) ? w.deck : 'weather_deck';
    const p = (w.at && w.at[d]) || { x:DECKS[d].spawn[0], y:DECKS[d].spawn[1] };
    return { deck:d, x:p.x, y:p.y, label:null, auto:()=> runRevivalCall() };
  }
  if(g.revivalStage === 'deck')
    return { deck:'weather_deck', x:14, y:6, ghost:{ x:14, y:5 }, face:'u',
             label: ui.sceneRunning ? null : 'Speak to the bird',
             act:()=> runCaladrius(), stage:()=> stageCaladrius() };
  return null;
}
/* After a win: has the expedition just passed the mark? */
function revivalDue(){
  const g = r4();
  return !!(g.solved && !g.cuainRevived && !g.revivalStage && (g.dives || 0) >= REVIVAL_AT);
}
async function startRevivalCall(){
  const g = r4();
  g.revivalStage = 'call';
  await saveProfile();
  const w = walkState();
  go((w.deck && DECKS[w.deck]) ? w.deck : 'weather_deck');   // the lock starts the call
}
async function runRevivalCall(){
  if(ui.sceneRunning) return;
  ui.sceneRunning = true;
  await sceneWait(400);
  const whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([whale], wn, `<b>"Wait. Do you feel that?"</b>`);
  await sceneSay([whale], wn,
    `<b>"Something is here. Something old — a legendary, like me."</b><br><br>` +
    `<b>"Not like the man with the raven. This one is... good."</b>`);
  await sceneSay([whale], wn, `<b>"It is waiting for us on the weather deck. Come, quickly."</b>`);
  const g = r4();
  g.revivalStage = 'deck';
  await saveProfile();
  ui.sceneRunning = false;
  blackoutTo(()=> go('weather_deck'), { hold:500 });
}
function stageCaladrius(){
  sceneActor('caladrius', { x:14, y:3, w:2, h:2, src:'assets/mon/caladrius_front.png', icon:'🕊️', bob:true, z:60 });
}
/* The stone goes onto him for good — or until he is crowned. */
async function bindGhostStone(){
  const c = state.party.find(isCuain) || grantCuain();
  state.inventory.ghostStone = true;
  state.inventory[stoneOnKey('ghostStone')] = c.uid;
  await saveProfile();
  return c;
}
async function runCaladrius(){
  if(ui.sceneRunning) return;
  ui.sceneRunning = true;
  refreshWalk();                                   // the button goes
  const bird = faceMon('caladrius'), whale = faceMon('whalelord'), wn = whaleName();
  const st = ELEMENTAL_STONES.find(s=> s.id === 'ghostStone') || { icon:'ghost_stone', emoji:'👻' };
  await sceneSay([bird], 'The white bird',
    `It does not speak. It does not need to — its thoughts arrive in your head as clearly as if ` +
    `they were your own.<br><br>` +
    `<i>It knows what was done to the Whalelord. It felt the great battle from far away — the man ` +
    `with the raven, and power that was not his to use. It flew as fast as it could, and it came ` +
    `too late.</i>`);
  await sceneSay([bird], 'The white bird',
    `<i>Its gaze moves to the Whalelord, and you feel what it finds there: a great, restless wish ` +
    `to be more than a ghost at your shoulder. To fight beside you.</i>`);
  await bindGhostStone();
  await sceneSay([bird, uiIcon(st.icon, 64, st.emoji)], 'The white bird',
    `<i>Its eyes drop to your bag. Before you quite understand, the Ghost Stone floats out of it, ` +
    `crosses the air, and settles into the Whalelord like a key finding its lock.</i><br><br>` +
    `<b>The Ghost Stone is bound to the Whalelord. It cannot be removed until he is crowned.</b>`);
  await sceneSay([bird], 'The white bird',
    `<i>Then it spreads its pure, icy wings, and summons its healing might.</i>`);

  /* Both of them light up blue-white, and the screen shimmers for three seconds. */
  sceneGlow('bird', 15, 4, 3.2, 59);             // the middle of its two-by-two square
  sceneGlow('whale', 14.5, 5.5, 2.2, 1);          // behind him, on his tile
  await sceneShimmer(3000);
  await sceneGlowOut(['bird', 'whale'], 900);

  await sceneSay([whale], wn, `<b>"My power, it's returned! Thank you, Caladrius."</b>`);
  await sceneSay([bird], 'Caladrius',
    `<i>It looks fatigued. One of the three feathers on its crown has turned dark, as if a ` +
    `shadowy mark has fallen over it. But it looks glad for the Whalelord.</i>`);
  await sceneSay([whale], wn, `<b>"I will repay you for this favour, noble Caladrius."</b>`);
  await sceneSay([bird], 'Caladrius',
    `<i>Caladrius seems to smile. Then it lifts its wings and soars into the sky.</i>`);

  /* Away up and to the left, fifty degrees above the horizon. */
  const a = 50 * Math.PI / 180, D = 14;
  await sceneGlide(['caladrius'], -Math.cos(a) * D, -Math.sin(a) * D, 2200);
  sceneActorGone('caladrius');
  await sceneWait(2000);

  await sceneSay([whale], wn, `<b>"Finally, I can fulfil my promise to you, dear friend."</b>`);
  await sceneSay([whale], wn,
    `<b>"My power isn't fully returned yet. For that, I'll need my core. But I can now fight ` +
    `alongside you. Perhaps as a ghost, I'll be able to help you in new ways I never could while ` +
    `I lived in the ocean."</b>`);
  await sceneSay([whale], wn,
    `<b>"That Caladrius could help us more, if he wished. But I suppose he has his pride as Lord ` +
    `of the Northern Skies. Perhaps if you <u>battle enough with the birds</u>, he might deem you ` +
    `worthy of a challenge."</b>`);

  const g = r4();
  g.revivalStage = null;
  g.cuainRevived = true;
  const c = state.party.find(isCuain) || grantCuain();
  c.revived = true;                               // a seventh fighter from here on
  await saveProfile();
  sceneClear();
  ui.sceneRunning = false;
  go('weather_deck');
  toast('The Whalelord can now fight beside you.');
}

/* Before the victory screen: whoever asked for it comes to collect. */
async function huntThanks(got){
  for(const x of got){
    const nm = SPECIES[x.species] ? SPECIES[x.species].name : x.species;
    await sceneSay([faceNpc('scientist' + x.sci, '🧑‍🔬')], crewName('scientist' + x.sci),
      `<b>"A ${escapeHtml(nm)}! That's exactly the specimen I needed — thank you."</b><br><br>` +
      `<b>"I'll only study it, I promise. The moment I'm done, it goes straight back to the sea."</b>` +
      `<br><br><b>+${x.reward} tokens</b>`);
  }
}

/* ---------- the laboratory, after it is over ---------- */
function huntKeyFor(n){
  const h = hunts();
  if(h.a && h.a.sci === n && !h.doneA) return 'a';
  if(h.b && h.b.sci === n && !h.doneB) return 'b';
  return null;
}
function sciHasHunt(n){ return labStage() === 'after' && !!huntKeyFor(n); }
function rhonaHasTask(){
  if(labStage() !== 'after') return false;
  const a = r4().after;
  return !(a && a.day === today() && a.beaten);
}
function sciAfterChat(n){
  const key = huntKeyFor(n);
  if(key) return huntRequest(key);
  storyModal(npcPortrait('scientist' + n, '🧑‍🔬', 120, 'transparent'), crewName('scientist' + n),
    `<b>"Back to proper work at last. Thank you — for all of it."</b>`,
    ()=> go('laboratory_deck'), { bg:'battle_laboratory_deck', subtitle:'Laboratory' });
}
/* Rhona has the supervisor's place now, and means to earn it. */
function rhonaTask(){
  const g = r4();
  g.after = g.after || { day:null, beaten:false };
  if(g.after.day !== today()){ g.after.day = today(); g.after.beaten = false; }
  const done = g.after.beaten;
  const ov = document.createElement('div');
  ov.className = 'refine-scrim';
  ov.innerHTML = `
    <div class="refine-card">
      ${npcPortrait('scientist9', '🧑‍🔬', 96, 'transparent')}
      <div class="refine-name">${escapeHtml(crewName('scientist9'))}</div>
      <div class="move-info-body">
        <p><b>"${done ? `Again tomorrow. I'll have found something new by then.`
                     : `I have to get stronger if I'm to be a supervisor worthy of respect.<br>Care to help me practise?`}"</b></p>
        ${done ? '' : `<p><i>Once a day · 5 Bronze Medals</i></p>`}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
        ${done ? '' : `<button class="btn btn-primary" id="rhGo">Challenge</button>`}
        <button class="btn btn-ghost" id="rhNo">Back</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) ov.remove(); };
  ov.querySelector('#rhNo').addEventListener('click', close);
  const go_ = ov.querySelector('#rhGo');
  if(go_) go_.addEventListener('click', ()=>{ close(); startSupervisorDaily(); });
}

/* ------------------------------------------------------------
   HIM, AFTERWARDS
   He follows you everywhere now and has opinions about people. Talk to him
   too much and he will tell you so — three times — and then pretend he cannot
   hear you for ten minutes.
   ------------------------------------------------------------ */
const CUAIN_QUIPS = [
  `You wash your hands in water and then dry them straight away. Why not just stay wet? It is lovely.`,
  `You sleep lying down, with both eyes shut, for hours. Very brave. Or very foolish.`,
  `You draw tiny pictures called words, and then worry whether the lines went in the right order. We just sing.`,
  `You wrap your feet in little boats and call them shoes.`,
  `Your young ones fall over all the time. Ours are born swimming.`,
  `You sing only when nobody is listening. We sing so the whole ocean can hear.`,
  `Why do you blow on hot soup? Just wait. Waiting is free.`,
  `You carry a little glowing box and stare into it instead of the sea. The sea is right there.`,
  `When a human says "five minutes", I have learned it means an hour.`,
  `You give names to your boats, but not to your fish. Strange.`,
  `When you are happy you show your teeth. When we show our teeth, it is not because we are happy.`,
  `You make your bed neat every morning, and every night you mess it up again.`,
  `Your captain drinks hot brown water and becomes kind. I would like to try this.`,
  `You keep your treasure in boxes with locks. We keep ours in songs. Nobody can steal a song.`,
  `You wave your front flippers at each other when you meet. I have started doing it too.`,
  `The cook shouts at the soup. The soup does not listen. Still, he shouts.`,
  `You count everything. Days, coins, words. Have you counted the waves yet? There are a lot.`,
  `You put on a coat when you are cold. I simply grow more blubber. Much simpler.`,
  `You hold hands when you are scared. I have no hands. I will hold your attention instead.`,
  `Your faces leak when you are sad, and also when you laugh too hard. Very confusing.`,
];
const CUAIN_CHATTY_WINDOW = 2 * 60 * 1000, CUAIN_CHATTY_LIMIT = 10, CUAIN_SULK = 10 * 60 * 1000;
function cuainQuip(){
  const t = ui.cuainTalk = ui.cuainTalk || { times:[], chatty:0, quietUntil:0, bag:[] };
  const now = Date.now();
  if(t.quietUntil && now >= t.quietUntil){ t.times = []; t.chatty = 0; t.quietUntil = 0; }
  t.times = t.times.filter(x=> now - x < CUAIN_CHATTY_WINDOW);
  t.times.push(now);
  const sulk = `<b>"..."</b><br><br><b>The whalelord pretends he can't hear you.</b>`;
  let line;
  if(t.quietUntil){
    line = sulk;
  } else if(t.times.length > CUAIN_CHATTY_LIMIT){
    if(t.chatty < 3){ t.chatty++; line = `<b>"You're awfully chatty today. Shouldn't we get going?"</b>`; }
    else { t.quietUntil = now + CUAIN_SULK; line = sulk; }
  } else {
    if(!t.bag.length){                         // every line once, in a new order, then again
      t.bag = CUAIN_QUIPS.map((_, i)=> i);
      for(let i = t.bag.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1)); [t.bag[i], t.bag[j]] = [t.bag[j], t.bag[i]];
      }
    }
    line = `<b>"${CUAIN_QUIPS[t.bag.pop()]}"</b>`;
  }
  return sceneSay([faceMon('whalelord')], whaleName(), line);
}
