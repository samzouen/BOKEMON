/* ============================================================
   26-invasion.js — THE BATTLE FOR THE CASTLE (4.00)
   The designer's plan for the rest of the story (2026-11-07, from the
   earlier conversation, "removing elements that have already been planned"
   and following the latest version where the two differ):

     "a final invasion begins with innumerable aliens swarming the castle on
     all sides. having UFO technology, aliens land within the walls so
     soldiers on the walls are pincered. the royal army commander goes out
     to help fight with the player in the market, but eventually asks the
     player to go back into the palace after a few fights. then, the player
     sees the king, dauphin and advisor fighting with soldiers against
     aliens, but the king issues an urgent request for the player to help
     secure the fairy princess. the player will have to fight his way
     through aliens to reach the princess. the player escorts the princess
     to the king, who is getting cornered by multiple commanders. though he
     overwhelms them, a sudden black beam hits him - nemesis sent wadjet for
     this opportunity to gravely wound the fairy king to disable the divine
     council. The princess realises that she cannot be cowardly, and
     evolves. Once evolved, her sprite sends a burst of fairy magic (waves
     of pink glitter emanating across the whole screen) which heals the
     wounded soldiers and helps the fairy king hold on to life. (her
     mechanism in game is to transfuse life to a monster who would faint
     once per recharge meter, and she regenerates each turn too. then, she
     joins the battle too. the player must defeat wadjet who flees, who is
     accompanied by 6 waves of 3 aliens (he is the central member of the 6th
     wave). after wadjet escapes, the fairy king sends princess on wadjet's
     trail along with the player. wadjet, then princess, then player, then
     lucesco sprites race through the map to a point in the north wall where
     a small spacetime rift has opened. then, wadjet flies through but
     Lucesco stops the princess from following. however, using his keen
     nose, he tracks wadjet and notes the point in spacetime wadjet has
     escaped to. returning to the castle, the player finds it smoking and
     wants to help, but the four tribes with ancestors and guardians arrive
     to help the fairy king. together, they drive out the aliens."

   Asked (2026-11-07): the Commander fights "beside you on the map" (his own
   clash, in the market); the princess fights Wadjet as an AI ally, and
   joins your party when the King sends her after him; Wadjet is Nemesis's
   own cobra (nemesis_wadjet); and afterwards "1, but there will still be
   aliens in the forest for the player to hunt albeit a third the number
   before. however, at the perimeter, there will be many aliens within the
   compound struggling against the soldiers outside. the player can enter
   the perimeter to fight aliens there for the weekly and daily challenges."

   The stages (r6().inv.stage; before the first, 'muster' is read off the
   King's quest, 25-quest.js, once its alarm has been raised):
     muster  the alarm said: the Commander takes you out (invMuster), and
             on the grounds the saucers come down inside the walls
             (invLanding)
     market  three bands in the market square, the knights clashing with
             aliens all over the grounds, the Commander at the fountain;
             after the third he sends you back to the palace (invToPalace)
     palace  the hall a battle: the King, the Dauphin and the Advisor with
             the knights against them; the King sends you for his daughter
             (invHallScene); a band in the east corridor, another at the
             tower's stair
     tower   a commander's army before her door; she comes with you
     escort  she follows at your heels; into the hall: the King cornered,
             the black beam, Wadjet, her courage, her evolution, the pink
             light (invClimax), and Wadjet's fight
     wadjet  his fight lost or left: he waits in the hall, she heals you
     chase   he is beaten and flees: the King sends her with you (she joins
             your party), the race to the north wall, the rift, Lucesco's
             nose, the smoke, the tribes (invChase, invTribes)
     done    the great hall that night (invFinale); then the rift's
             perimeter (r6_perimeter), a third of the jungle's aliens, a wild one
             now and then on its paths
   ============================================================ */
const INV = { lv:175, wadjetLv:200, princessLv:100, alienLv:170 };
const INV_ORDER = ['muster', 'market', 'palace', 'tower', 'escort', 'wadjet', 'chase', 'done'];

/* ---------- the save: r6().inv ----------
   stage, won{} (each band of the invasion, for good), said{} (each scene
   once), grown (she has evolved), joined (she is one of yours). */
function invState(){
  const r = r6();
  if(!r.inv || typeof r.inv !== 'object') r.inv = {};
  const v = r.inv;
  ['won', 'said'].forEach(k=>{ if(!v[k] || typeof v[k] !== 'object') v[k] = {}; });
  return v;
}
function invOn(){ return !!(state && state.progress && state.progress.region6) && typeof questState === 'function'; }
function invStage(){
  if(!invOn()) return null;
  const v = invState();
  if(v.stage && INV_ORDER.includes(v.stage)) return v.stage;
  return questState().stage === 'end' ? 'muster' : null;
}
function invAt(...st){ return st.includes(invStage()); }
function invPast(st){ const s = invStage(); return !!s && INV_ORDER.indexOf(s) >= INV_ORDER.indexOf(st); }
function invActive(){ const s = invStage(); return !!s && s !== 'done'; }       // the castle invaded
function invAfter(){ return invStage() === 'done'; }
function invSaid(k){ return !!invState().said[k]; }
function invSay(k){ invState().said[k] = true; saveProfile(); }
function invSet(st){ invState().stage = st; saveProfile(); }
function invGrown(){ return !!invState().grown; }

/* ---------- Wadjet: Nemesis's cobra (the designer: "wadjet is the nemesis wadjet, not the past wadjet sprite") ---------- */
const WADJET = 'nemesis_wadjet';
(function invSpecies(){
  if(typeof SPECIES === 'undefined' || typeof MOVES === 'undefined') return;
  SPECIES[WADJET] = { name:'Wadjet', tier:'legendary', types:['Ghost', 'Dragon'], rate:13, nerfedRate:13, base:200, evo:[], evoMult:1.5, bonusStages:1,
                      color:'#3f8a3a', glyph:'蛇', bossOnly:true, noCatch:true, noLevelCap:true, fixedLook:WADJET, nemesisPiece:'cobra' };
  MOVES[WADJET] = [
    ['Basic', 'Fang of Night', 0.3, 'Single', 2, 1],
    ['Power1', 'Hood of Dread', 0.5, 'AOE', 4, 1, { confuseHit:{ chance:0.25, ffPower:0.6 } }],
    ['Power2', 'Shed Skin', null, 'Passive', 0, 21, { passive:{ cleanseEnd:1, evadeAlways:0.15 } }],
    ['Ultimate', 'Black Beam', 1.25, 'Single', 8, 41, { stunHit:0.25 }],
    ['Max', 'Black Beam Max', 1.5, 'Single', 8, 51, { stunHit:0.3 }]];
})();

/* ============================================================
   WHO STANDS WHERE
   ============================================================ */
/* the invasion's bands, by the deck they hold; each beaten for good */
const INV_BANDS = {
  r6_castle:[ { id:'inv-m1', x:21, y:39, rank:'captain' }, { id:'inv-m2', x:42, y:39, rank:'captain' }, { id:'inv-m3', x:31, y:45, rank:'captain' } ],
  r6_palace:[ { id:'inv-p1', x:30, y:16, rank:'captain' }, { id:'inv-p2', x:35, y:6, rank:'captain', guards:'stair' } ],
  r6_tower: [ { id:'inv-t1', x:6, y:13, rank:'commander', guards:'door' } ],
};
const INV_BAND_STAGE = { r6_castle:'market', r6_palace:'palace', r6_tower:'tower' };
function invBandsOf(key){
  const list = INV_BANDS[key] || [];
  list.forEach(b=>{
    if(b.aliens) return;
    const R = jgRng((JG.seed ^ jgDaySeed(b.id)) >>> 0), ri = n=> Math.floor(R() * n);
    b.aliens = [];
    for(let i = 0; i < (b.rank === 'commander' ? 4 : 2); i++) b.aliens.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]);
    b.aliens.push(JG_CAPTAIN);
    if(b.rank === 'commander') b.aliens.push(JG_COMMANDER);
    b.lead = b.aliens[b.aliens.length - 1];
    b.lv = INV.lv; b.deck = key; b.inv = true;
  });
  return list;
}
function invBandUp(b){
  if(b.perim) return invAfter() && !invPerimBeaten(b);
  return invAt(INV_BAND_STAGE[b.deck]) && !invState().won[b.id];
}
/* the knights and the aliens they hold, clashing (22-war.js's slashes): [knight sprite, kx, ky, alien, ax, ay] */
const INV_CLASH = {
  r6_castle:[ ['chestnut_knight2', 29, 50, 'alien_insect_physical', 32, 50], ['duck_knight2', 34, 58, 'alien_golem_ground', 37, 58],
              ['bug_knight1', 8, 46, 'alien_flower_grass', 11, 46], ['chestnut_knight2', 52, 46, 'alien_robot_steel', 55, 46],
              ['duck_knight2', 24, 24, 'alien_crocodilian_fire', 27, 24], ['bug_knight1', 36, 24, 'alien_magnet_electric', 39, 24] ],
  r6_palace:[ ['chestnut_knight2', 17, 13, 'alien_gremlin_fairy', 15, 13], ['chestnut_knight2', 22, 19, 'alien_toxic_gas_ghost', 24, 19],
              ['chestnut_knight2', 17, 25, 'alien_dolphin_water', 15, 25] ],
  r6_tower: [ ['chestnut_knight2', 26, 14, 'alien_grimgate_psychic', 23, 14] ],
};
/* the saucers, where they come down (the square under each), and the smoke later on: rooftops about the market */
const INV_UFOS = [{ x:24.5, y:33.2 }, { x:39.5, y:33.2 }, { x:31.5, y:57.6 }];
const INV_SMOKE = [[18.2, 33.6], [45.6, 33.4], [17.6, 41.2], [45.4, 41.4], [25.6, 47.4], [38.4, 47.4], [8.6, 47.6], [55.4, 47.6], [16.6, 54.6], [47.2, 54.6], [17.8, 25.6], [45.6, 25.4]];
/* the crack in the north wall (the grounds), where Wadjet came in and goes; you stand below it */
const INV_RIFT = { x:49.5, y:1.6, stand:{ x:49, y:3 } };
/* after the story: the perimeter round it on the grounds, and where you come out of it */
const INV_PERIM = { x:45, y:3, w:9, h:3, gate:49, out:[48, 6], soldiers:[[46, 6, 'chestnut_knight2'], [52, 6, 'bug_knight1']], commander:[50, 6] };

function invClashThings(T, pairs, when, o){
  o = o || {};
  pairs.forEach(([ks, kx, ky, al, ax, ay], i)=>{
    const dx = kx - ax, dy = ky - ay;
    T({ x:ax, y:ay, still:true, cls:'ca-npc war-alien inv-clash-alien', invAlien:true,
        html:()=> `<div class="war-fig">${jgMonImg(al, WALK_T * 1.5, dx > 0)}</div>` + warSlashHtml(dx, dy),
        verb:'Look', sub:(SPECIES[al] || {}).name || 'An alien', when, act:()=> caLines([`The knight and the alien are locked blade to claw. There's no getting between them!`]) });
    T({ x:kx, y:ky, still:true, cls:'ca-npc war-knight inv-clash-knight', invKnight:true,
        html:()=> `<div class="war-fig">${caMonImg(ks, WALK_T * 1.45, dx < 0)}</div>`,
        verb:'Talk', sub:ks === 'duck_knight2' ? 'Duck Knight' : ks === 'bug_knight1' ? 'Bug Knight' : 'Chestnut Knight',
        when:o.knightWhen || when, act:()=> o.talk ? o.talk() : invKnightTalk() });
  });
}
function invBandThing(b, when){
  const nm = (SPECIES[b.lead] || {}).name || 'Alien';
  const t = { x:b.x, y:b.y, band:b, cls:'ca-npc inv-band inv-band-' + b.rank,
    html:()=> `<div class="war-fig">${jgMonImg(b.lead, WALK_T * (b.rank === 'commander' ? 1.9 : b.rank === 'captain' ? 1.7 : 1.5), false)}</div>`,
    verb:'Fight', sub:b.rank === 'commander' ? `Commander ${nm}'s army` : b.rank === 'captain' ? `Captain ${nm}'s band` : `${nm} and its captives`,
    when, act:()=> invFight(b) };
  b.thing = t;
  return t;
}

/* ---------- the things each place shows ---------- */
function invThings(key, list, T){
  /* the people already here stand aside while the castle is invaded (and the princess, once she is with you) */
  list.forEach(t=>{
    if(!(t.who || (key === CA_KEY && (t.verb === 'Shop' || t.sub === 'The Painter')))) return;
    const base = t.when;
    t.when = ()=> (!base || base()) && !invHidden(key, t);
  });
  if(key === CA_KEY) invGroundsThings(T);
  else if(key === 'r6_palace') invPalaceThings(T);
  else if(key === 'r6_tower') invTowerThings(T);
  else if(key === 'r6_perimeter') invRiftThings(T);
}
function invHidden(key, t){
  const st = invStage();
  if(!st || st === 'muster') return false;
  if(key === 'r6_tower' && t.who === 'princess') return invPast('escort');          // she is with you
  if(key === 'r6_palace' && t.who === 'commander' && st === 'done') return true;     // he holds the rift now
  if(st === 'done') return false;
  return key === CA_KEY || key === 'r6_palace' || key === 'r6_tower';
}
const invFighting = ()=> invAt('market', 'palace', 'tower', 'escort', 'wadjet', 'chase');
function invGroundsThings(T){
  invBandsOf(CA_KEY).forEach(b=> T(invBandThing(b, ()=> invBandUp(b))));
  invClashThings(T, INV_CLASH.r6_castle, ()=> invFighting() && !ui.invRouted, { knightWhen:()=> invFighting() });
  /* the Commander at the fountain, holding an alien commander */
  T({ x:32, y:33, still:true, cls:'ca-npc war-alien inv-clash-alien', invAlien:true,
      html:()=> `<div class="war-fig">${jgMonImg(JG_COMMANDER, WALK_T * 1.9, true)}</div>` + warSlashHtml(-3, 0),
      verb:'Look', sub:'Commander Octopus', when:()=> invFighting() && !ui.invRouted, act:()=> invCommanderFightTalk() });
  T({ x:29, y:33, still:true, faceR:true, cls:'ca-npc war-knight inv-commander-fight', who:null,
      html:()=> `<div class="war-fig">${caMonImg('chestnut_knight2_c', WALK_T * 1.6, true)}</div>`,
      verb:'Talk', sub:'The Royal Commander', when:()=> invFighting(), act:()=> invCommanderFightTalk() });
  /* after the story: the rift's perimeter, its soldiers, the Commander at its gate */
  const P = INV_PERIM;
  T({ x:P.x, y:P.y, w:P.w, h:P.h, icon:'', html:()=> '', verb:'Enter', sub:'The rift perimeter', when:()=> invAfter(), act:()=> invPerimEnter() });
  P.soldiers.forEach(([x, y, sp])=> T({ x, y, still:true, cls:'ca-npc', html:()=> caMonImg(sp, WALK_T * 1.45, false, '', 'back'),
    verb:'Talk', sub:sp === 'bug_knight1' ? 'Bug Knight' : 'Chestnut Knight', when:()=> invAfter(), act:()=> caLines([['knight', caTurn('invPerimSoldier', INV_LINES.perimSoldier)]]) }));
  T({ x:P.commander[0], y:P.commander[1], still:true, cls:'ca-npc', html:()=> caMonImg('chestnut_knight2_c', WALK_T * 1.6, false),
      verb:'Talk', sub:'The Royal Commander', when:()=> invAfter(), act:()=> invPerimCommanderTalk() });
}
function invPalaceThings(T){
  const inHall = ()=> invAt('palace', 'tower', 'escort') && !ui.invClimax;
  /* the King on his dais, holding them off; the Dauphin and the Advisor beside him */
  T({ x:19, y:3, w:2, still:true, cls:'ca-npc inv-king-fight', html:()=> caMonImg('fairy_king_c', WALK_T * 1.75, false, CA_WHO.king.icon),
      verb:'Talk', sub:'The Fairy King', when:inHall, act:()=> invKingFightTalk() });
  T({ x:22, y:5, still:true, faceR:true, cls:'ca-npc war-knight', html:()=> `<div class="war-fig">${caMonImg('fairy_dauphin2', WALK_T * 1.55, true)}</div>`,
      verb:'Talk', sub:'The Dauphin', when:inHall, act:()=> caLines([['dauphin', caTurn('invDauphin', INV_LINES.dauphin)]]) });
  T({ x:17, y:5, still:true, cls:'ca-npc war-knight', html:()=> `<div class="war-fig">${caMonImg('fairybird1_c', WALK_T * 1.35, false)}</div>`,
      verb:'Talk', sub:'The Royal Advisor', when:inHall, act:()=> caLines([['advisor', caTurn('invAdvisor', INV_LINES.advisor)]]) });
  [['alien_plant_hydra_dragon', 24, 5, 22], ['alien_cocoon_flying', 15, 5, 17]].forEach(([al, ax, ay, kx])=>{
    T({ x:ax, y:ay, still:true, cls:'ca-npc war-alien inv-clash-alien', invAlien:true,
        html:()=> `<div class="war-fig">${jgMonImg(al, WALK_T * 1.5, kx > ax)}</div>` + warSlashHtml(kx - ax, 0),
        verb:'Look', sub:(SPECIES[al] || {}).name || 'An alien', when:inHall, act:()=> caLines([`There's no getting near — the royal family are fighting for their lives!`]) });
  });
  invClashThings(T, INV_CLASH.r6_palace, ()=> invAt('palace', 'tower', 'escort'));
  invBandsOf('r6_palace').forEach(b=> T(invBandThing(b, ()=> invBandUp(b))));
  /* Wadjet, waiting: his fight lost or left. The King lies on his dais, his daughter beside him. */
  const waiting = ()=> invAt('wadjet') && !ui.invClimax;
  T({ x:19, y:10, still:true, cls:'ca-npc inv-wadjet', html:()=> jgMonImg(WADJET + '_front', WALK_T * 2.3, false),
      verb:'Fight', sub:'Wadjet', when:waiting, mark:()=> true, act:()=> invWadjetChallenge() });
  T({ x:19, y:3, w:2, still:true, cls:'ca-npc inv-king-down', html:()=> caMonImg('fairy_king_c', WALK_T * 1.75, false, CA_WHO.king.icon),
      verb:'Look', sub:'The Fairy King', when:waiting, act:()=> caLines([`The King lies still on the dais. A soft pink light still glows around him: he is holding on.`]) });
  T({ x:22, y:4, still:true, cls:'ca-npc inv-princess-glow', html:()=> caMonImg('fairy_princess1', WALK_T * 1.5, false),
      verb:'Talk', sub:'The Little Princess', when:waiting, act:()=> invPrincessHeal() });
}
function invTowerThings(T){
  const up = ()=> invAt('tower');
  invClashThings(T, INV_CLASH.r6_tower, up);
  invBandsOf('r6_tower').forEach(b=> T(invBandThing(b, ()=> invBandUp(b))));
}

/* ---------- everyone indoors while the castle is invaded ---------- */
function invNoWalkers(key){
  if(!invFighting()) return false;
  return key === CA_KEY || key === 'r6_palace' || key === 'r6_tower';
}

/* ============================================================
   THE FIGHTS
   ============================================================ */
/* a band's waves: as the jungle's (jgWaves), its captives the castle's own people — or, at the perimeter after the
   story, anyone's (jgCaptivePick: the tribes' people and the castle's), so its fights count for every daily */
function invWaves(b){
  const R = Math.random;
  const pick = ()=> b.perim ? jgCaptivePick() : caCitizenPick();
  const fairy = (boss)=> ({ species:pick(), level:JG.fairyLv[0], ai:'best', nerfed:false, anyLevel:true, jg:{ mind:true, tribe:null },
    veryHigh:boss ? { type:'Fairy', plus:0, cast:true } : undefined });
  const alien = (sp)=>{
    const a = JG_ALIENS[sp], rank = a.rank || 'alien', plus = JG.plus[rank];
    const lv = rank === 'commander' ? JG.aliens.lv[1] : rank === 'captain' ? Math.min(JG.aliens.lv[1], b.lv) : Math.max(JG.aliens.lv[0], b.lv - (b.rank === 'alien' ? 0 : 3));
    const vh = a.el || JG_ELEMENTS[Math.floor(R() * JG_ELEMENTS.length)];
    return { species:sp, level:lv, ai:'best', nerfed:false, anyLevel:true, jg:{ alien:rank, el:a.el, plus, lastVh:vh }, veryHigh:{ type:vh, plus, cast:true } };
  };
  return b.aliens.map(sp=>{ const boss = !!JG_ALIENS[sp].rank; return [fairy(boss), alien(sp), fairy(boss)]; });
}
function invFight(b){
  if(!b || ui.invFighting || ui.caTalk || ui.sceneRunning) return;
  if(!invBandUp(b)) return;
  if(!battleParty().some(m=> m.currentHp > 0)){ b.calm = Date.now() + 8000; toast('Your team needs healing first. Rest by the tavern fire.'); return; }
  ui.invFighting = true;
  releaseKeys();
  const deck = walkState().deck;
  const waves = invWaves(b), nm = (SPECIES[b.lead] || {}).name || 'Alien';
  const name = b.rank === 'commander' ? `Commander ${nm}'s army` : b.rank === 'captain' ? `Captain ${nm}'s band` : `${nm} and its captives`;
  const begin = ()=>{
    ui.invFighting = false;
    ui.invFight = { id:b.id, deck, perim:!!b.perim };
    beginBattle({ waves, isNpc:false, allowCatch:true, name, bgKey:(deck === 'r6_palace' || deck === 'r6_tower') ? 'battle_palace' : 'battle_castle', foeRegion:6,
      encounter:true, encounterMusic:JG_FIGHT_MUSIC,
      onWaveStart:(i)=> jgWaveStart(i),
      onWin:(levelUps)=> invBandWon(b, levelUps),
      onLose:()=> invLost(b) });
    if(ui.battle){ ui.battle.inv = b.id; ui.battle.noFoeRecharge = true; }   // the aliens' own rules (jgEnemyMove), as in the jungle
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, JG_FIGHT_MUSIC); else begin();
}
/* won: for good (the perimeter's: for the day, as the jungle's) — its captives freed for the dailies, the King's count,
   then the victory page (jgWon), and back where you stood */
function invBandWon(b, levelUps){
  if(!b.perim){ invState().won[b.id] = true; saveProfile(); }
  jgWon(b, levelUps);
}
function invLost(b){
  ui.invFight = null;
  const perim = b && b.perim;
  return new Promise(res=>{
    storyModal(jgMonImg('chestnut_knight2_front', 140), 'Into the tavern',
      `<b>"Easy, easy — we've got you."</b><br><br>` + (perim
        ? `The Commander's soldiers carried you out of the perimeter and all the way to the tavern. You wake by the fire.`
        : `The knights carried you into the tavern and barred the door behind you. You wake by the fire.`) +
      `<br><br><i>Rest here to heal your team, then go back out. ${perim ? 'The perimeter is behind the palace, by the north wall.' : 'The bands you have beaten stay beaten.'}</i>`,
      ()=>{ res(); caGo('r6_tavern', [7, 10]); }, { subtitle:"The Fairy King's castle", bg:'palace' });
  });
}
function invBack(deck){
  const f = ui.invFight;
  ui.invFight = null;
  deck = deck || (f && f.deck) || CA_KEY;
  ui.walkFresh = false;
  walkState().busy = false;
  go(deck);
}
function invFled(){
  const f = ui.invFight, id = ui.battle && ui.battle.inv;
  const b = [].concat(...Object.keys(INV_BANDS).map(k=> invBandsOf(k)), invPerimBands()).find(x=> x.id === id);
  if(b) b.calm = Date.now() + 8000;                                    // it lets you go, for a moment
  toast('Got away safely!');
  invBack(f && f.deck);
}
function invVictoryButtons(){
  const r = document.getElementById('regionBtn'), a = document.getElementById('againBtn');
  if(a) a.remove();
  if(r){
    const nb = r.cloneNode(false);
    nb.textContent = (ui.invFight && ui.invFight.perim) ? 'Back to the perimeter' : 'Back to the castle';
    nb.addEventListener('click', ()=> invBack());
    r.replaceWith(nb);
  }
}
/* the victory page, a catch, a flight: back where you stood (as the jungle's, 06-progress.js and 05-battle-flow.js) */
if(typeof showVictory === 'function'){
  const _invShowVictory = showVictory;
  showVictory = function(){ const r = _invShowVictory.apply(this, arguments); if(ui.invFight && ui.battle && ui.battle.inv) invVictoryButtons(); return r; };
}
if(typeof afterCatch === 'function'){
  const _invAfterCatch = afterCatch;
  afterCatch = function(){ if(ui.invFight && ui.battle && ui.battle.inv) return invBack(); return _invAfterCatch.apply(this, arguments); };
}
if(typeof onFlee === 'function'){
  const _invOnFlee = onFlee;
  onFlee = function(){ if(ui.battle && ui.battle.inv && ui.battle.inv !== 'wadjet') return invFled(); return _invOnFlee.apply(this, arguments); };
}
/* a band that sees you, a step away: at you it comes */
function invBandNear(key, p){
  const d = DECKS[key];
  if(!d || !p) return null;
  const now = Date.now();
  const t = deckThings(d).find(t=> t.band && invBandUp(t.band) && !(t.band.calm > now) && Math.abs(t.x - p.x) + Math.abs(t.y - p.y) === 1);
  return t ? t.band : null;
}
function invAlert(b){
  const el = b && b.thing && b.thing.el;
  if(!el) return;
  el.classList.add('inv-alerted');
  playSfx('alert');
}

/* ============================================================
   WHAT THEY SAY
   ============================================================ */
const INV_LINES = {
  knight:[`<b>"Hold the line! For the King!"</b>`, `<b>"They just keep coming! Help the others — we'll hold this one!"</b>`, `<b>"I've got this one. Go, go!"</b>`],
  dauphin:[`<b>"Not one step closer to Father! HAAH!"</b>`, `<b>"My little sister — please, get her!"</b>`],
  advisor:[`<b>"Hoo! The stair is at the end of the east corridor. Hurry!"</b>`, `<b>"Patience and cleverness— oh, never mind! HOO!"</b>`],
  commander:[`<b>"Their bands are all over the market. Take them one at a time!"</b>`, `<b>"Don't worry about me — this one's mine!"</b>`, `<b>"For the castle!"</b>`],
  kingFight:[`<b>"My little one is alone in the tower! Go to her — bring her to me!"</b>`, `<b>"I can hold them a while yet. Go!"</b>`],
  perimSoldier:[`<b>"Nothing gets out of that compound on my watch."</b>`, `<b>"They keep crawling out of the crack in the wall. Fewer every day, mind you."</b>`, `<b>"Going in? Watch yourselves. Some of the big ones come through, now and then."</b>`],
};
function invKnightTalk(){ return caLines([['knight', caTurn('invKnight', INV_LINES.knight)]]); }
function invKingFightTalk(){ return caLines([['king', caTurn('invKingFight', INV_LINES.kingFight)]]); }
function invCommanderFightTalk(){
  if(invAt('market')){
    const left = invBandsOf(CA_KEY).filter(b=> invBandUp(b)).length;
    return caLines([['commander', caTurn('invCommander', INV_LINES.commander) + (left ? `<br><br><i>${left} of their bands still hold the market.</i>` : '')]]);
  }
  return caLines([['commander', `<b>"I'll hold the market. Get to the palace — go!"</b>`]]);
}
function invTalk(who, line){
  const st = invStage();
  if(!st || st === 'muster') return null;
  if(st === 'done'){
    if(who === 'king') return caLines([['king', caTurn('invKingAfter', [
      `<b>"The tribes and the castle, side by side at last. It took an invasion to do it… and you, my friends."</b>`,
      `<b>"Look after my daughter for me. And let her look after you. She is stronger than any of us knew."</b>`,
      `<b>"I am mending, slowly. The Commander's soldiers hold the rift day and night, and I sleep a little better for it."</b>`])]]);
    return null;
  }
  if(who === 'princess') return invPrincessTalk();
  return null;
}
/* the speakers the court does not have: Wadjet, the tribes' ancestors, the princess grown */
if(typeof caFaceOf === 'function'){
  const _invFaceOf = caFaceOf;
  caFaceOf = function(who){
    if(who === 'wadjet') return `<img src="assets/mon/${WADJET}_front.png" alt="">`;
    if(who === 'princess' && invGrown()) return `<img src="assets/mon/fairy_princess1_front.png" alt="">`;
    if(typeof who === 'string' && who.startsWith('a_') && JG_TRIBES[who.slice(2)]) return `<img src="assets/mon/tribal_ancestor_${who.slice(2)}_front.png" alt="">`;
    return _invFaceOf.apply(this, arguments);
  };
}
if(typeof caNameOf === 'function'){
  const _invNameOf = caNameOf;
  caNameOf = function(who){
    if(who === 'wadjet') return 'Wadjet';
    if(typeof who === 'string' && who.startsWith('a_') && JG_TRIBES[who.slice(2)]) return JG_TRIBES[who.slice(2)].short + ' Ancestor';
    return _invNameOf.apply(this, arguments);
  };
}

/* ============================================================
   THE WAY ABOUT, WHILE THE CASTLE IS INVADED
   ============================================================ */
/* the walls barred; the stair up the tower held by a band; the gate shut */
if(typeof caGo === 'function'){
  const _invCaGo = caGo;
  caGo = function(key, at){
    if(invFighting() && /^r6_(wall|ramp)_/.test(key)){ toast('The knights have barred the way up. The walls are under attack!'); return; }
    if(key === 'r6_palace' && invAt('market') && !invMarketCleared() && !ui.sceneRunning){ caLines([['lion', `<b>"Not yet! The Commander needs us here — the market is crawling with them."</b>`]]); return; }
    if(key === CA_KEY && invAt('escort') && ui.screen === 'r6_palace' && !ui.sceneRunning){ caLines([['princess', `<b>"No — Father's in the hall! Please, let's go to him."</b>`]]); return; }
    if(key === 'r6_tower' && invAt('palace')){
      const b = invBandsOf('r6_palace').find(x=> x.guards === 'stair');
      if(b && invBandUp(b)){
        caLines([`Captain ${(SPECIES[b.lead] || {}).name || 'Humanoid'}'s band stands in front of the stair. You'll have to get past them first!`]).then(()=> invFight(b));
        return;
      }
      invSet('tower');
    }
    return _invCaGo.apply(this, arguments);
  };
}
if(typeof caToJungle === 'function'){
  const _invToJungle = caToJungle;
  caToJungle = function(){
    if(invFighting()){ toast('The gate is barred. Nobody leaves while the castle is under attack!'); return; }
    return _invToJungle.apply(this, arguments);
  };
}
/* the battle music while the castle is invaded (the designer is finding the castle's and the palace's own) */
['r6_castle', 'r6_palace', 'r6_tower'].forEach(key=>{
  const d = typeof DECKS !== 'undefined' && DECKS[key];
  if(!d) return;
  const base = d.music;
  Object.defineProperty(d, 'music', { configurable:true, enumerable:true, get(){ return invActive() ? 'battle_region6' : base; } });
});

/* ---------- a step: the princess at your heels, a band that sees you, her door, the hall ---------- */
const _invTrail = [];
function invStep(key, p){
  if(!invOn()) return false;
  _invTrail.push({ x:p.x, y:p.y, key });
  if(_invTrail.length > 6) _invTrail.shift();
  if(invAt('escort') && (key === 'r6_palace' || key === 'r6_tower')) invPrincessFollowStep(key);
  if(ui.sceneRunning || ui.caTalk || ui.invFighting) return false;
  const b = invBandNear(key, p);
  if(b){
    const w = walkState();
    w.busy = true;
    invAlert(b);
    setTimeout(()=>{ w.busy = false; invFight(b); }, 450);
    return true;
  }
  /* her door, while the army before it stands */
  if(key === 'r6_tower' && invAt('tower') && p.y <= 11 && p.x <= 11){
    const t1 = invBandsOf('r6_tower')[0];
    if(t1 && invBandUp(t1)){
      walkState().busy = true;
      invAlert(t1);
      setTimeout(()=>{ walkState().busy = false; invFight(t1); }, 450);
      return true;
    }
  }
  /* into the hall, with her at your heels */
  if(key === 'r6_palace' && invAt('escort') && invInHall(p)){ setTimeout(()=> invClimax(), 120); return true; }
  return false;
}
function invInHall(p){ return !!p && p.x >= 12 && p.x <= 27 && p.y >= 2 && p.y <= 31; }

/* ---------- the princess at your heels (the escort) ---------- */
function invPrincessFollowStep(key){
  const el = document.getElementById('invPrin');
  if(!el) return;
  const tr = _invTrail.filter(s=> s.key === key);
  const at = tr[tr.length - 3] || tr[0];
  if(!at) return;
  const p = caYou();
  if(p && at.x === p.x && at.y === p.y) return;
  const was = el._at || at;
  el._at = { x:at.x, y:at.y };
  el.style.transform = `translate3d(${at.x * WALK_T}px,${at.y * WALK_T}px,0)`;
  el.style.zIndex = 10 + at.y;
  if(at.x !== was.x) faceRight(el, at.x > was.x);
}
function invPrincessFollowDraw(world, key, p){
  if(!p) return;
  const m = CA_MAPS[key]();
  const lion = caLion.at;
  const free = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]].map(([dx, dy])=> ({ x:p.x + dx, y:p.y + dy }))
    .find(q=> !caSolidCode(caAt(m, q.x, q.y)) && !wBlockedBy(DECKS[key], q.x, q.y) && !(lion && lion.x === q.x && lion.y === q.y)) || p;
  const el = document.createElement('div');
  el.className = 'walk-ent ca-npc inv-follow';
  el.id = 'invPrin';
  el.innerHTML = caMonImg('fairy_princess', WALK_T * 1.25, false);
  el._at = { x:free.x, y:free.y };
  el.style.transform = `translate3d(${free.x * WALK_T}px,${free.y * WALK_T}px,0)`;
  el.style.zIndex = 10 + free.y;
  world.appendChild(el);
  _invTrail.length = 0;
  _invTrail.push({ x:free.x, y:free.y, key }, { x:free.x, y:free.y, key }, { x:p.x, y:p.y, key });
}

/* ============================================================
   ON ARRIVING: the sky, the smoke, the crack in the wall — and whichever scene is due
   ============================================================ */
function invRender(key, world, p){
  if(!invOn()) return;
  invCss(); if(typeof warCss === 'function') warCss();
  ui.invClimax = false; ui.invRouted = false;
  const st = invStage();
  if(!st) return;
  if(key === CA_KEY){
    if(invFighting() && invPast('market')) INV_UFOS.forEach((u, i)=> invUfoEl('u' + i, u.x, u.y, world));
    if(invAt('palace', 'tower', 'escort', 'wadjet', 'chase')) INV_SMOKE.forEach(([x, y], i)=> invSmokeEl(world, x, y, i));
    if(invPast('wadjet')) invRiftEl(world, INV_RIFT.x, INV_RIFT.y, 2.3, 'invRiftGrounds', invAfter() ? 'small' : '');
    if(invAfter()) invPerimDraw(world);
  }
  if(key === 'r6_perimeter') invRiftDraw(world);
  if(invAt('escort') && (key === 'r6_palace' || key === 'r6_tower')) invPrincessFollowDraw(world, key, p);
  if(key === 'r6_perimeter'){ const stg = $('#walkStage'); if(stg){ stg.classList.remove('ca-in'); stg.classList.add('ca-out'); } }
  setTimeout(()=> invSceneDue(key), 420);
}
function invSceneDue(key){
  if(ui.screen !== key || ui.sceneRunning || ui.caTalk || document.querySelector('.scene-say')) return;
  const st = invStage(), v = invState();
  if(st === 'muster'){ if(key === 'r6_palace') return invMuster(); if(key === CA_KEY) return invLanding(); return; }
  if(st === 'market' && key === CA_KEY && invMarketCleared() && !v.said.toPalace) return invToPalace();
  if(st === 'palace' && key === 'r6_palace' && !v.said.hall) return invHallScene();
  if(st === 'tower' && key === 'r6_tower' && !v.said.towerIn) return invTowerIn();
  if(st === 'escort' && key === 'r6_palace' && invInHall(caYou())) return invClimax();
  if(st === 'chase'){
    if(!v.said.fled && key === 'r6_palace') return invAfterWadjet();
    if(key === CA_KEY){ invPrincessJoins(); return invScene(()=> v.said.chased ? invTribesRun() : invChaseRun()); }
    if(key === 'r6_palace') return invScene(async ()=>{ await invCut('r6_palace', CA_KEY, [31, 20], v.said.chased ? null : 'After Wadjet!'); await (v.said.chased ? invTribesRun() : invChaseRun()); });
  }
  if(st === 'done' && key === 'r6_palace' && !v.said.finale) return invScene(()=> invFinaleRun());
}
function invMarketCleared(){ return invBandsOf(CA_KEY).every(b=> invState().won[b.id]); }

/* ---------- a scene: you stand still, the walkers wait, and everything is put back after ----------
   While it plays, the way back and the Party button are put away; and if you are somewhere else all the same (the
   app left and come back to), it stops at its next line rather than talk on over another page (INV_ABORT). */
const INV_ABORT = { abort:true };
async function invScene(fn){
  if(ui.sceneRunning) return;
  ui.sceneRunning = true;
  ui.invSceneKey = ui.screen;
  document.body.classList.add('inv-scene');
  const w = walkState();
  w.busy = true;
  releaseKeys();
  try { await fn(); }
  catch(e){ if(e !== INV_ABORT) console.error('invasion scene:', e); }
  finally {
    ui.sceneRunning = false;
    ui.invSceneKey = null;
    ui.invClimax = false; ui.invRouted = false;          // the hall's own people back for the next drawing of it
    document.body.classList.remove('inv-scene');
    const w2 = walkState(); w2.busy = false;
    if(ui.screen && DECKS[ui.screen]) refreshWalk();
  }
}
/* lines, in a scene */
async function L(seq){
  if(ui.invSceneKey && ui.screen !== ui.invSceneKey) throw INV_ABORT;
  await caLines(seq);
  if(ui.invSceneKey && ui.screen !== ui.invSceneKey) throw INV_ABORT;
}
/* wait until the deck is drawn */
function invWaitDeck(key){
  return new Promise(res=>{
    let n = 0;
    const t = setInterval(()=>{ if((ui.screen === key && document.getElementById('walkYou')) || ++n > 60){ clearInterval(t); setTimeout(res, 120); } }, 100);
  });
}
/* the black curtain down, another place, the curtain up */
async function invCut(from, key, at, text){
  await sceneCurtain(true, 600);
  if(text) await sceneCurtainText(text, 1000);
  const w = walkState();
  w.at = w.at || {};
  w.at[key] = { x:at[0], y:at[1] };
  ui.walkFresh = false;
  caLion.at = null;
  ui.sceneRunning = true;                                // its arrival must not start a scene of its own
  go(key);
  await invWaitDeck(key);
  ui.invSceneKey = key;
  walkState().busy = true;
  if(text) await sceneCurtainText('', 300);
  await sceneCurtain(false, 600);
}
/* a monster on the deck for a scene: its feet on the bottom of square (x, y) */
function invSrc(name){ return /\//.test(name) ? name : `assets/mon/${name}${/^(alien_|tribal_guardian_)/.test(name) ? '' : '_front'}.png`; }
function invActor(id, name, x, y, size, o){
  const s = size || 1.45;
  return sceneActor(id, Object.assign({ x:x + 0.5 - s / 2, y:y + 1 - s, w:s, h:s, src:invSrc(name), person:false }, o || {}));
}
function invActorTo(id, x, y, ms){
  const el = document.getElementById('sa-' + id);
  if(!el) return Promise.resolve();
  const s = el._o.w;
  return sceneGlide([id], (x + 0.5 - s / 2) - el._o.x, (y + 1 - s) - el._o.y, ms);
}
function invActorFade(id, ms){
  const el = document.getElementById('sa-' + id);
  if(!el) return Promise.resolve();
  el.style.transition = `opacity ${ms * SCENE_SPEED}ms ease`;
  void el.offsetWidth;
  el.style.opacity = '0';
  return sceneWait(ms).then(()=> el.remove());
}
function invActorIn(id, ms){
  const el = document.getElementById('sa-' + id);
  if(!el) return Promise.resolve();
  el.style.opacity = '0';
  void el.offsetWidth;
  el.style.transition = `opacity ${ms * SCENE_SPEED}ms ease`;
  el.style.opacity = '1';
  return sceneWait(ms);
}

/* ============================================================
   THE SCENES
   ============================================================ */
/* the alarm said (questAlarm): the Commander takes you out */
function invMuster(){
  return invScene(async ()=>{
    await L([['commander', `<b>"Every knight to the walls! …You two, and you, Lucesco: with me. To the market!"</b>`]]);
    await invCut('r6_palace', CA_KEY, [31, 20], 'You run out into the castle…');
    await invLandingRun();
  });
}
function invLanding(){ return invScene(()=> invLandingRun()); }
async function invLandingRun(){
  const w = walkState();
  w.busy = true;
  await sceneLook({ x:31.5, y:37 }, { zoom:0.55, ms:900 });
  await L([`A deep hum shakes the air. Lights drop out of the clouds — one, two, three of them — straight down over the castle walls.`]);
  await invUfosLand();
  /* the knights on the walls, caught between */
  const kn = [['wk1', 0.4, 37.6], ['wk2', 0.4, 40.4]];
  kn.forEach(([id, x, y])=> invActor(id, 'chestnut_knight2', x, y, 1.4));
  await sceneLook({ x:0, y:35.5, w:8, h:7 }, { ms:900 });
  invActor('wa1', 'alien_insect_physical', 3.6, 37.8, 1.45); invActor('wa2', 'alien_gremlin_fairy', 3.6, 40.6, 1.45);
  await Promise.all([invActorIn('wa1', 500), invActorIn('wa2', 500)]);
  kn.forEach(([id])=>{ const el = document.getElementById('sa-' + id); if(el) faceRight(el, true); });
  await L([['knight', `<b>"Behind us! They've come down INSIDE the walls!"</b>`], ['knight', `<b>"We're caught between them — hold, hold!"</b>`]]);
  ['wk1', 'wk2', 'wa1', 'wa2'].forEach(id=> sceneActorGone(id));
  /* the Commander, out of the palace and down to the fountain */
  await sceneLook({ x:31, y:27, w:3, h:9 }, { ms:900 });
  invActor('cmd', 'chestnut_knight2_c', 31, 20, 1.6);
  await invActorTo('cmd', 31, 26, 700);
  await invActorTo('cmd', 29, 31, 600);
  await invActorTo('cmd', 29, 33, 400);
  await L([['commander', `<b>"They landed INSIDE the walls — the knights up on the ramparts are caught between them!"</b>`],
                 ['commander', `<b>"The market is thick with them. Clear it with me: take their bands one at a time, and I'll hold this lot at the fountain!"</b>`],
                 ['lion', `<b>"We're with you, Commander!"</b>`]]);
  sceneActorGone('cmd');
  for(let i = 0; i < INV_UFOS.length; i++) document.getElementById('iu-u' + i) && document.getElementById('iu-u' + i).remove();
  invSet('market');
  await sceneCamFree(500);
  ui.sceneRunning = false;
  go(CA_KEY);                                                           // the bands, the clashes
}
async function invUfosLand(){
  const world = $('#walkWorld');
  if(!world) return;
  const els = INV_UFOS.map((u, i)=> invUfoEl('u' + i, u.x, u.y, world, true));
  await sceneWait(60);
  els.forEach((el, i)=>{ if(el){ el.style.transitionDelay = (i * 280 * SCENE_SPEED) + 'ms'; el.classList.remove('inv-ufo-high'); } });
  await sceneWait(1700 + 2 * 280);
  els.forEach(el=> el && el.classList.add('inv-ufo-beaming'));
  INV_UFOS.slice(0, 2).forEach((u, i)=>{ invActor('ua' + i + 'a', JG_ALIEN_IDS[i * 3], u.x - 1.2, u.y, 1.4); invActor('ua' + i + 'b', JG_ALIEN_IDS[i * 3 + 1], u.x + 0.2, u.y + 0.4, 1.4); });
  await Promise.all(['ua0a', 'ua0b', 'ua1a', 'ua1b'].map(id=> invActorIn(id, 700)));
  await sceneWait(500);
  els.forEach(el=> el && el.classList.remove('inv-ufo-beaming'));
  await sceneWait(300);
  ['ua0a', 'ua0b', 'ua1a', 'ua1b'].forEach(id=> sceneActorGone(id));
}

/* the market cleared: the Commander sends you back to the palace */
function invToPalace(){
  return invScene(async ()=>{
    await sceneLook({ x:28, y:31, w:5, h:3 }, { ms:800 });
    await L([['commander', `<b>"Well fought! The market is ours… for now."</b>`],
                   ['commander', `<b>"Listen to me. The palace! If they reach the King while he is this weak… Go back, now, as fast as you can. I'll hold them here. GO!"</b>`]]);
    invSay('toPalace');
    invSet('palace');
    await sceneCamFree(500);
    ui.sceneRunning = false;
    go(CA_KEY);                                                         // smoke, from now on
  });
}

/* the great hall: the royal family fighting; the King sends you for his daughter */
function invHallScene(){
  return invScene(async ()=>{
    await sceneLook({ x:12, y:1, w:16, h:9 }, { ms:900 });
    await L([`The great hall is a storm of light and noise. Aliens pour in through the broken windows, and the King's knights meet them blade to claw.`,
                   ['dauphin', `<b>"Father, behind you!"</b>`]]);
    invShockwave(20, 3.4, 'violet');
    await sceneShake(400, ms=> 0.08 * (1 - ms / 400));
    await L([['king', `A blaze of violet light, and an alien is flung clear across the hall.<br><br><b>"I am not finished yet!"</b>`],
                   ['king', `<b>"My friends — thank the stars. Listen to me. My little one is alone in the tower, and they are everywhere. Go to her. Bring her down here to me, where I can keep her safe."</b>`],
                   ['advisor', `<b>"Hoo! The stair is at the end of the east corridor — and they've got there first!"</b>`],
                   ['lion', `<b>"Then we go through them. Come on!"</b>`]]);
    invSay('hall');
    await sceneCamFree(600);
  });
}
function invTowerIn(){
  return invScene(async ()=>{
    await L([['lion', `<b>"Listen… They're up here too. Her room is at the west end of the gallery, and look who's standing in front of it."</b>`]]);
    invSay('towerIn');
  });
}
/* her room: she comes with you */
async function invPrincessTalk(){
  if(!invAt('tower')) return caLines([['princess', `<b>"…"</b>`]]);
  const t1 = invBandsOf('r6_tower')[0];
  if(t1 && invBandUp(t1)) return caLines([['princess', `A tiny voice comes from behind the wardrobe. <b>"Are they still out there? I can hear them… Please make them go away!"</b>`]]);
  return invScene(async ()=>{
    await L([
      ['princess', `Something behind the wardrobe squeaks. <b>"Go away, go away! I heard them on the stairs!"</b>`],
      ['lion', `<b>"It's only me, little one. Lucesco. The aliens on the stairs are gone — my friends saw to that."</b>`],
      ['princess', `A small face peeks out. <b>"…Lucesco? Is it over?"</b>`],
      ['you', `<b>"Not yet. Your father wants you down in the hall with him, where he can keep you safe."</b>`],
      ['princess', `<b>"Down there? But that's where all the fighting is! I'm not brave like my sister. I can't fight. I just… hide."</b>`],
      ['lion', `<b>"Then hide behind me. Nothing gets past these paws. Stay close, and we will take you to him."</b>`],
      ['princess', `She slips out from behind the wardrobe and takes a fistful of Lucesco's mane.<br><br><b>"…Okay. But stay close. Please stay really close."</b>`]]);
    invSet('escort');
    ui.sceneRunning = false;
    go('r6_tower');
  });
}

/* ---------- THE CLIMAX: the King cornered, the black beam, Wadjet, her courage ---------- */
function invClimax(){
  return invScene(async ()=>{
    ui.invClimax = true;
    if(typeof questRefreshThings === 'function') questRefreshThings();
    const pe = document.getElementById('invPrin'), you = caYou() || { x:19, y:12 };
    const pat = pe && pe._at ? pe._at : { x:you.x + 1, y:you.y };
    if(pe) pe.remove();
    invActor('prin', 'fairy_princess', pat.x, pat.y, 1.25);
    invActor('king', 'fairy_king_c', 19.5, 3, 2.3);
    [['c1', 16.6, 3.6], ['c2', 19.5, 5.4], ['c3', 22.4, 3.6]].forEach(([id, x, y], i)=> invActor(id, JG_COMMANDER, x, y, 1.9, { flip:i === 0 }));
    await sceneLook({ x:13, y:0.5, w:14, h:7 }, { ms:900 });
    await L([['princess', `<b>"Father!"</b>`],
                   `Three alien commanders have the King backed against his throne.`,
                   ['king', `<b>"Stay back, little one! Stay—"</b>`]]);
    /* he overwhelms them */
    sceneGlow('kingBurst', 20, 3.2, 4.5);
    invShockwave(20, 3.2, 'violet');
    const shake = sceneShake(700, ms=> 0.12 * (1 - ms / 700));
    await Promise.all([sceneHop('c1', 12.2, 2.4, 1.4, 700), sceneHop('c2', 18.8, 9.6, 1.0, 700), sceneHop('c3', 26.0, 2.4, 1.4, 700), shake]);
    await Promise.all(['c1', 'c2', 'c3'].map(id=> invActorFade(id, 450)));
    await sceneGlowOut(['kingBurst'], 500);
    await L([['king', `The King throws out his arms, and a ring of violet light bursts from him. The commanders are flung clear across the hall.<br><br><b>"Not in my hall. Not while I still stand."</b>`]]);
    /* the air tears; the cobra; the black beam */
    const world = $('#walkWorld');
    invRiftEl(world, 25.2, 8.6, 1.8, 'invRiftHall', '');
    await sceneWait(600);
    invActor('wadjet', WADJET, 24.7, 8.4, 2.4);
    await invActorIn('wadjet', 700);
    await L([`The air beside the columns tears open like cloth. Something long and dark slides out of it…`]);
    playSfx('alert');
    invBeam(24.9, 7.9, 20.0, 3.4, 1100);
    await sceneWait(250);
    await sceneFlash(120, 80, null, 400);
    sceneShake(600, ms=> 0.1 * (1 - ms / 600));
    sceneActor('king', { faint:1 });
    const ke = document.getElementById('sa-king'); if(ke) ke.classList.add('inv-hurt');
    await sceneWait(700);
    const rh = document.getElementById('invRiftHall'); if(rh) rh.remove();
    await L([
      `A beam of pure black lances across the hall and strikes the King. He falls without a sound.`,
      ['wadjet', `<b>"Hsss… So the great Fairy King CAN be cornered. I only had to wait for the right moment."</b>`],
      ['lion', `<b>"Wadjet! Nemesis's cobra!"</b>`],
      ['wadjet', `<b>"Nemesis sends his regards, lion. One of the Divine Council's lights, snuffed out. Without its King, your precious Council is half blind in this world."</b>`]]);
    /* she runs to him */
    await invActorTo('prin', 21, 4, 700);
    await L([['princess', `<b>"Father! Father, please, wake up!"</b>`],
                   ['king', `The King's eyes flicker open.<br><br><b>"…Run… little one… hide…"</b>`],
                   ['princess', `<b>"No. I've hidden my whole life. I hid when the aliens came. I hid when my sister went to fight. I'm not hiding any more!"</b>`],
                   `A light begins to shine from the little princess — brighter, and brighter…`]);
    /* her courage: she evolves */
    sceneGlow('prinGlow', 21.5, 4.3, 3);
    await sceneWait(600);
    await new Promise(done=> playEvolutions([{ species:'fairy_princess', name:'The Little Princess', stageFrom:0, stageTo:1, newMoves:[], from:99, to:INV.princessLv,
      headline:`<b>The Little Princess</b> found her courage!`, note:`Lv ${INV.princessLv}` }], done));
    const v = invState();
    v.grown = true; saveProfile();
    await sceneGlowOut(['prinGlow'], 300);
    sceneActor('prin', { src:invSrc('fairy_princess1') });
    { const pe2 = document.getElementById('sa-prin'); if(pe2){ const s = 1.65, o = pe2._o; sceneActor('prin', { x:o.x + (o.w - s) / 2, y:o.y + (o.h - s), w:s, h:s }); pe2.classList.add('inv-princess-glow'); } }
    /* the pink light, across everything: the wounded knights stand, the King holds on */
    await invGlitterBurst('sa-prin');
    document.querySelectorAll('.inv-clash-knight').forEach(el=> el.classList.add('inv-healed', 'war-won'));
    if(ke) ke.classList.add('inv-holding');
    await L([`A wave of pink light rolls out from her, across the whole hall and beyond — and everywhere it touches, the wounded knights stand up again. The King draws a long breath, and holds on.`,
                   ['king', `<b>"…My daughter…"</b>`],
                   ['princess', `<b>"Get away from my father!"</b>`],
                   ['wadjet', `<b>"A late bloomer. How touching. Then I'll put out two lights instead of one. To me, my army!"</b>`],
                   `Aliens pour in through every broken window!`]);
    invSet('wadjet');
    ui.sceneRunning = false;
    invWadjetBattle();
  });
}

/* ---------- WADJET'S FIGHT: six waves of three, he is the middle of the sixth; the princess at your side ---------- */
function invWadjetWaves(){
  const R = Math.random, pickA = ()=> JG_ALIEN_IDS[Math.floor(R() * JG_ALIEN_IDS.length)];
  const alien = (sp, lv)=>{
    const a = JG_ALIENS[sp], rank = a.rank || 'alien', plus = JG.plus[rank];
    const vh = a.el || JG_ELEMENTS[Math.floor(R() * JG_ELEMENTS.length)];
    return { species:sp, level:lv, ai:'best', nerfed:false, anyLevel:true, jg:{ alien:rank, el:a.el, plus, lastVh:vh }, veryHigh:{ type:vh, plus, cast:true } };
  };
  const waves = [];
  for(let i = 0; i < 5; i++) waves.push([alien(pickA(), INV.alienLv), alien(i >= 3 ? JG_CAPTAIN : pickA(), i >= 3 ? INV.lv : INV.alienLv), alien(pickA(), INV.alienLv)]);
  waves.push([alien(JG_COMMANDER, INV.lv), { species:WADJET, level:INV.wadjetLv, ai:'best', nerfed:false, anyLevel:true, veryHigh:{ type:'Ghost', plus:2, cast:true } }, alien(JG_COMMANDER, INV.lv)]);
  return waves;
}
function invWadjetBattle(){
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first. Talk to the princess.'); go('r6_palace'); return; }
  releaseKeys();
  const begin = ()=>{
    beginBattle({ waves:invWadjetWaves(), isNpc:true, name:'Wadjet', bgKey:'battle_palace', foeRegion:6, encounter:true, encounterMusic:['battle_legendary', 'battle_boss'],
      ally:{ species:'fairy_princess', level:INV.princessLv, name:'The Little Princess', kind:'princess' },
      onWaveStart:(i)=> invWadjetWaveStart(i),
      onWin:()=> invWadjetWon(),
      onLose:()=> invWadjetLost() });
    if(ui.battle){ ui.battle.inv = 'wadjet'; ui.battle.noFoeRecharge = true; }
    setTimeout(()=>{ if(ui.battle && ui.battle.inv === 'wadjet') battleMsg(`The Little Princess fights at your side! When one of your team would fall, her Life Transfusion catches it — once each time the recharge meter fills.`); }, 900);
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, ['battle_legendary', 'battle_boss']); else begin();
}
function invWadjetWaveStart(i){
  jgWaveStart(i);
  const b = ui.battle;
  if(b && i === b.waves.length - 1) setTimeout(()=>{ if(ui.battle === b) battleMsg(`Wadjet slithers into the fight himself, two alien commanders at his side!`); }, 700);
}
function invWadjetChallenge(){
  if(ui.caTalk) return;
  ui.caTalk = true;
  r5Ask([caFaceOf('wadjet')], 'Wadjet', `<b>"Back again? Then come. I have all the time in the world."</b><br><br><i>Six waves of three: his aliens, then Wadjet himself (Lv ${INV.wadjetLv}) with two commanders. The princess fights at your side.</i>`, 'Fight Wadjet', 'Not yet')
    .then(yes=>{ ui.caTalk = false; if(yes) invWadjetBattle(); else refreshWalk(); });
}
function invPrincessHeal(){
  return caLines([['princess', `<b>"Hold still."</b> She lays a glowing hand on each of your monsters in turn, and a warm pink light runs through them.`]]).then(()=>{
    healParty(1);
    toast('Your team is fully healed!');
    refreshWalk();
  });
}
function invWadjetWon(){
  const v = invState();
  v.won.wadjet = true;
  invSet('chase');
  ui.walkFresh = false;
  const w = walkState();
  w.busy = false;
  w.at = w.at || {};
  w.at.r6_palace = { x:19, y:14 };
  caLion.at = null;
  go('r6_palace');
}
function invWadjetLost(){
  return new Promise(res=>{
    storyModal(jgMonImg('fairy_princess1_front', 140), 'The princess',
      `Wadjet's laughter fills the hall as your last monster falls. Then a pink light wraps around all of you, and drags you clear.<br><br><b>"I've got you. I've got you!"</b>` +
      `<br><br><i>Talk to the princess to heal your team, then face Wadjet again. He is waiting in the hall.</i>`,
      ()=>{ res(); invBackToHall(); }, { subtitle:'The battle for the castle', bg:'palace' });
  });
}
function invBackToHall(){
  const w = walkState();
  w.at = w.at || {};
  w.at.r6_palace = { x:19, y:14 };
  ui.walkFresh = false;
  caLion.at = null;
  go('r6_palace');
}
/* she joins you: Lv 100, her second form (her evolution at 100) */
function invPrincessJoins(){
  const v = invState();
  if(v.joined) return null;
  const m = newMonster('fairy_princess', INV.princessLv);
  m.currentHp = monMaxHp(m);
  if(slottedCount() < 6) state.party.push(m); else state.storage.push(m);
  ['caughtSpecies', 'encounteredSpecies'].forEach(k=>{ state[k] = state[k] || []; if(!state[k].includes('fairy_princess')) state[k].push('fairy_princess'); });
  v.joined = true; v.grown = true;
  saveProfile();
  const where = state.party.includes(m) ? 'your team' : 'storage — your six are full';
  toast(`The Little Princess joins ${where}!`);
  return m;
}

/* ---------- after his fight: he flees; the King sends her after him with you ---------- */
function invAfterWadjet(){
  return invScene(async ()=>{
    ui.invClimax = true;
    if(typeof questRefreshThings === 'function') questRefreshThings();
    invActor('king', 'fairy_king_c', 19.5, 3, 2.3, { faint:1 });
    const ke = document.getElementById('sa-king'); if(ke) ke.classList.add('inv-hurt', 'inv-holding');
    invActor('prin', 'fairy_princess1', 21.2, 4, 1.65);
    { const pe = document.getElementById('sa-prin'); if(pe) pe.classList.add('inv-princess-glow'); }
    invActor('wadjet', WADJET, 19.5, 10, 2.4);
    await sceneLook({ x:13, y:1, w:14, h:12 }, { ms:900 });
    await L([['wadjet', `<b>"Hsss… Impossible. Beaten by a child who was hiding behind a wardrobe this morning."</b>`],
                   ['wadjet', `<b>"This isn't over, princess. The cobra always comes back."</b>`]]);
    await invActorTo('wadjet', 19.5, 31, 1500);
    await invActorFade('wadjet', 300);
    await L([['princess', `<b>"It's getting away! Father—"</b>`],
                   ['king', `The King lifts his head. Her light still glows around him.<br><br><b>"…Go. Follow it. Find out where it goes."</b>`],
                   ['king', `<b>"You saved my life today, and every knight in this hall. You are not a little one any more. Go with them — you are one of them now."</b>`],
                   ['princess', `<b>"…I will, Father."</b>`]]);
    invPrincessJoins();
    await L([['lion', `<b>"It's making for the north wall. After it!"</b>`]]);
    invSay('fled');
    await invCut('r6_palace', CA_KEY, [31, 20], null);
    await invChaseRun();
  });
}

/* ---------- THE CHASE: Wadjet, the princess, you, Lucesco — to the crack in the north wall ---------- */
function invPathTo(key, from, to){
  const m = CA_MAPS[key](), d = DECKS[key], W = m.W, H = m.H;
  const prev = new Int32Array(W * H).fill(-2), q = [from.y * W + from.x];
  prev[q[0]] = -1;
  for(let h = 0; h < q.length; h++){
    const v = q[h], x = v % W, y = (v - x) / W;
    if(x === to.x && y === to.y) break;
    for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const a = x + dx, b = y + dy, u = b * W + a;
      if(a < 0 || b < 0 || a >= W || b >= H || prev[u] !== -2) continue;
      if(caSolidCode(m.g[u]) || (d && wBlockedBy(d, a, b))) continue;
      prev[u] = v; q.push(u);
    }
  }
  const end = to.y * W + to.x;
  if(prev[end] === -2) return [from, to];
  const out = [];
  for(let v = end; v !== -1; v = prev[v]){ const x = v % W; out.push({ x, y:(v - x) / W }); }
  return out.reverse();
}
async function invChaseRun(){
  const w = walkState(), key = CA_KEY;
  w.busy = true;
  const path = invPathTo(key, { x:31, y:20 }, INV_RIFT.stand);
  const lionEl = document.getElementById('caLion');
  if(lionEl) lionEl.style.display = 'none';
  const at = i=> path[Math.max(0, Math.min(path.length - 1, i))];
  /* who is where on the path: Wadjet well ahead, the princess, you, Lucesco */
  const pos = { wadjet:7, prin:3, you:1, lion:0 };
  invActor('wadjet', WADJET, at(pos.wadjet).x, at(pos.wadjet).y, 2.0);
  invActor('prin', 'fairy_princess1', at(pos.prin).x, at(pos.prin).y, 1.5);
  invActor('lion', 'lucesco', at(pos.lion).x, at(pos.lion).y, 1.45);
  w.at[key] = { x:at(pos.you).x, y:at(pos.you).y };
  const world = $('#walkWorld');
  if(world) world.style.transition = `transform ${Math.round(150 * SCENE_SPEED)}ms linear`;
  refreshWalk();
  await L([`Wadjet bursts out of the palace doors and streaks away across the grounds!`]);
  const step = 150, end = path.length - 1;
  const move = (id, i)=>{
    const el = document.getElementById('sa-' + id);
    if(!el) return;
    const s = el._o.w, p = at(i), nx = p.x + 0.5 - s / 2, ny = p.y + 1 - s;
    if(Math.abs(nx - el._o.x) > 0.05) actorFace(el, nx > el._o.x);
    el.style.transition = `left ${step * SCENE_SPEED}ms linear, top ${step * SCENE_SPEED}ms linear`;
    el._o.x = nx; el._o.y = ny;
    el.style.left = (nx * WALK_T) + 'px'; el.style.top = (ny * WALK_T) + 'px';
    el.style.zIndex = 10 + Math.floor(p.y + 1);
  };
  while(pos.wadjet < end){
    pos.wadjet++; pos.prin = Math.min(end - 2, pos.prin + 1); pos.you = Math.min(end - 3, pos.you + 1); pos.lion = Math.min(end - 4, pos.lion + 1);
    move('wadjet', pos.wadjet); move('prin', pos.prin); move('lion', pos.lion);
    const yp = at(pos.you), was = w.at[key];
    if(yp.x !== was.x) w.faceX = yp.x > was.x ? 'r' : 'l';
    w.at[key] = { x:yp.x, y:yp.y };
    refreshWalk();
    await sceneWait(step);
  }
  /* the others catch up */
  for(let k = 0; k < 3; k++){
    pos.prin = Math.min(end - 1, pos.prin + 1); pos.you = Math.min(end - 2, pos.you + 1); pos.lion = Math.min(end - 3, pos.lion + 1);
    move('prin', pos.prin); move('lion', pos.lion);
    w.at[key] = { x:at(pos.you).x, y:at(pos.you).y }; refreshWalk();
    await sceneWait(step);
  }
  if(world) world.style.transition = '';
  await sceneLook({ x:INV_RIFT.x - 3.5, y:0, w:7, h:6 }, { ms:600 });
  /* Wadjet, into the crack */
  await sceneHop('wadjet', INV_RIFT.x - 1.0, INV_RIFT.y - 0.6, 0.8, 600);
  const we = document.getElementById('sa-wadjet');
  if(we){ we.style.transition = `transform ${600 * SCENE_SPEED}ms ease-in, opacity ${600 * SCENE_SPEED}ms ease-in`; void we.offsetWidth; we.style.transform = 'scale(.15)'; we.style.opacity = '0'; }
  await sceneWait(650);
  sceneActorGone('wadjet');
  await L([['princess', `<b>"It's getting away!"</b>`]]);
  /* she runs at it; Lucesco leaps between */
  const st = INV_RIFT.stand;
  const pr = invActorTo('prin', st.x, st.y, 500);
  await sceneWait(200);
  const le = document.getElementById('sa-lion');
  if(le){ const s = le._o.w; await sceneHop('lion', st.x + 0.5 - s / 2, (st.y - 0.6) + 1 - s, 1.6, 600); }
  await pr;
  await invActorTo('prin', st.x, st.y + 1, 300);
  await L([['lion', `<b>"No! You don't know where it leads. It could drop you a thousand years from home."</b>`],
                 ['princess', `<b>"But it hurt my father!"</b>`],
                 ['lion', `<b>"Then we will find it. Wait…"</b> He puts his nose right up to the crack, and breathes in, long and slow.`],
                 ['lion', `<b>"Hot sand. Old stone. A great river… and something buried deep under it. That serpent has gone a long, long way back in time."</b>`],
                 ['lion', `<b>"I have its scent now. Wherever it hides, I'll know the way."</b>`],
                 `The crack shrinks to a sliver of purple light, flickering in the stones of the wall.`]);
  { const r = document.getElementById('invRiftGrounds'); if(r) r.classList.add('small'); }
  invSay('chased');
  await invTribesRun();
}

/* ---------- the smoke, the horns: the four tribes come, and drive the aliens out ---------- */
async function invTribesRun(){
  await sceneLook({ x:31.5, y:40 }, { zoom:0.55, ms:1300 });
  await L([['princess', `<b>"Look — the market! It's on fire, and they're all still fighting down there!"</b>`],
                 ['you', `<b>"Then we go and help them. Come on!"</b>`],
                 `A horn sounds from the south gate. Then another, and another — deep and wild, like nothing from the castle.`]);
  await sceneLook({ x:31.5, y:56.5 }, { zoom:0.6, ms:1100 });
  /* in at the gate, four columns: each tribe's ancestor, its guardian, two of its people */
  const cols = { grass:28.5, water:30.5, earth:32.5, fire:34.5 };
  const ids = [];
  JG_TRIBE_KEYS.forEach(k=>{
    const T = JG_TRIBES[k], x = cols[k];
    const sp = k === 'earth' ? 'ground' : k;
    invActor('anc' + k, `tribal_ancestor_${k}`, x, 62, 2.4); invActor('gd' + k, `tribal_guardian_${sp}`, x, 64, 1.9);
    invActor('f1' + k, T.members[0], x - 0.6, 66, 1.3); invActor('f2' + k, T.members[1], x + 0.6, 66, 1.3);
    ids.push('anc' + k, 'gd' + k, 'f1' + k, 'f2' + k);
  });
  await sceneGlide(ids, 0, -8, 1600);
  await L([['g_water', `<b>"The tribes keep their word, Fairy King!"</b>`],
                 ['a_fire', `<b>"Out of our jungle, star-spawn! OUT!"</b>`]]);
  /* up into the market: the aliens break and run, their saucers lift away */
  await sceneLook({ x:31.5, y:42 }, { zoom:0.55, ms:900 });
  const glide = sceneGlide(ids, 0, -10, 1700);
  await sceneWait(700);
  document.querySelectorAll('.inv-clash-alien').forEach(el=> el.classList.add('inv-fleeing'));
  document.querySelectorAll('.inv-ufo').forEach((el, i)=>{ el.style.transitionDelay = (i * 260 * SCENE_SPEED) + 'ms'; el.classList.add('inv-ufo-off'); });
  await glide;
  ui.invRouted = true;
  if(typeof questRefreshThings === 'function') questRefreshThings();
  document.querySelectorAll('.inv-clash-knight').forEach(el=> el.classList.add('war-won'));
  document.querySelectorAll('.inv-smoke').forEach(el=> el.classList.add('inv-smoke-out'));
  await L([['a_earth', `<b>"…Stone… stands… with the castle."</b>`],
                 ['g_grass', `<b>"Tag! You're ALL it!"</b>`],
                 `The aliens break and run. Their saucers lift off one by one, and streak away over the walls.`,
                 ['knight', `<b>"They're running! The tribes have come — the tribes have come!"</b>`]]);
  await sceneCurtain(true, 700);
  await sceneCurtainText('By nightfall, the last of the aliens have fled, back through the crack in the north wall.', 2200);
  ids.forEach(id=> sceneActorGone(id));
  invSet('done');
  const w = walkState();
  w.at = w.at || {}; w.at.r6_palace = { x:19, y:12 };
  ui.walkFresh = false; caLion.at = null;
  ui.sceneRunning = true;
  go('r6_palace');
  await invWaitDeck('r6_palace');
  ui.invSceneKey = 'r6_palace';
  walkState().busy = true;
  await sceneCurtainText('', 300);
  await sceneCurtain(false, 700);
  await invFinaleRun();
}

/* ---------- THE FINALE: the great hall, that night ---------- */
async function invFinaleRun(){
  const gx = { grass:15, water:17, earth:22, fire:24 }, ax = { grass:14.6, water:17.4, earth:21.6, fire:24.4 };
  const ids = [];
  JG_TRIBE_KEYS.forEach(k=>{
    const sp = k === 'earth' ? 'ground' : k;
    invActor('fg' + k, `tribal_guardian_${sp}`, gx[k], 6, 1.6); invActor('fa' + k, `tribal_ancestor_${k}`, ax[k], 8.6, 2.2);
    ids.push('fg' + k, 'fa' + k);
  });
  const you = caYou() || { x:19, y:12 };
  invActor('prin', 'fairy_princess1', you.x + 1, you.y, 1.5);
  ids.push('prin');
  await sceneLook({ x:12, y:0.5, w:16, h:12 }, { ms:900 });
  await L([
    `That night, the great hall is fuller than it has been in two hundred years.`,
    ['king', `The King sits on his throne, pale, the Dauphin at his side.<br><br><b>"Two hundred years ago, I sealed your ancestors to end a war. Today, they came to save my castle."</b>`],
    ['a_fire', `<b>"Don't get sentimental, King. We came for the aliens, not for you."</b>`],
    ['a_water', `<b>"…And yet, we came. It is a beginning."</b>`],
    ['g_water', `<b>"The tribes will not hide from the castle again. You have our word."</b>`],
    ['commander', `<b>"Your Majesty: the crack in the north wall is still open, and a few aliens still creep through it. With your leave, I will put a perimeter round it, and my soldiers will hold it day and night."</b>`],
    ['king', `<b>"Do it, Commander."</b>`],
    ['commander', `<b>"And you two, and you, Lucesco: you will always be welcome inside it. Every alien you beat there counts for His Majesty's challenge, and frees the people they have taken, for the tribes and for us."</b>`],
    ['princess', `<b>"Father… I want to go with them. That serpent hurt you. I want to find it."</b>`],
    ['king', `<b>"…I know. I knew it the moment I saw you shine. Go, then, with my blessing."</b>`],
    ['king', `<b>"Lucesco, my old friend. Keep her safe."</b>`],
    ['lion', `<b>"With my life."</b>`],
    ['dauphin', `<b>"Little sister! Come home and spar with me sometimes, all right? I want to see this new you."</b>`],
    ['princess', `<b>"You're on!"</b>`]]);
  invSay('finale');
  ids.forEach(id=> sceneActorGone(id));
  await sceneCamFree(500);
  const here = state.party.some(m=> m.species === 'fairy_princess');
  await new Promise(res=> storyModal(jgMonImg('fairy_princess1_front', 140), 'The battle for the castle is won',
    `The tribes and the castle stand together at last. The Little Princess has joined you${here ? '' : ' (she is waiting in storage: your six were full)'}.` +
    `<br><br><i>The Royal Commander holds the rift in the north wall, behind the palace. Go inside the perimeter any day: every alien there counts for the King's challenge and the tribes' and the castle's daily thanks. A third of the jungle's aliens are still out there, too, and now and then one leaps out on its paths.</i>`,
    ()=> res(), { subtitle:"The Fairy King's castle", bg:'palace' }));
  ui.walkFresh = false;
  go('r6_palace');
}

/* ============================================================
   THE LITTLE PRINCESS IN A FIGHT (the designer: "her mechanism in game is to transfuse life to a monster who would
   faint once per recharge meter, and she regenerates each turn too")
     · Life Transfusion: one of your side about to fall stands again with 40% of its health, and she gives 20% of
       her own for it (never below 1) — once, and once more each time the 100-word recharge meter fills.
     · Regeneration: 10% of her health back at the start of every round.
   As one of your team, wherever she stands (out front or waiting her turn), so long as she is standing herself;
   against Wadjet, as an ally at your side (04-battle.js: the vault's ally, `kind:'princess'`): never on the field,
   never struck, singing Prism Lullaby over every one of them after your leader's turn.
   ============================================================ */
const PRINCESS = { species:'fairy_princess', heal:0.4, cost:0.2, regen:0.1, sing:0.8 };
function princessSource(exclude){
  const b = ui.battle;
  if(!b) return null;
  const A = typeof battleAlly === 'function' ? battleAlly() : null;
  if(A && A.kind === 'princess' && A.mon) return A.mon;
  return (battleParty() || []).find(m=> m && m.species === PRINCESS.species && m.currentHp > 0 && m !== exclude && !(typeof isPassenger === 'function' && isPassenger(m))) || null;
}
function transfuseDue(m){
  const b = ui.battle;
  if(!b || !m || m.currentHp > 0) return false;
  if(typeof isAllyMon === 'function' && isAllyMon(m)) return false;
  /* (4.07) one of your team: her Life Transfusion is Dazzling Benevolence's always-on part — as often as one of yours
     falls (the designer: "No longer once per recharge meter") */
  if(!princessAllyHere()) return !!giftGiver(m);
  if(b.transfuseUsed) return false;                       // the Wadjet fight's ally: as in 4.00, once a meter
  const src = princessSource(m);
  return !!src && src !== m;
}
/* the Wadjet fight's princess, at your side (4.00) — she keeps her song and 4.00's Life Transfusion */
function princessAllyHere(){ const A = typeof battleAlly === 'function' ? battleAlly() : null; return !!(A && A.kind === 'princess' && A.mon); }
function doTransfuse(m, rise){
  if(!princessAllyHere()) return giveLife(m, rise);      // (4.07)
  const b = ui.battle, src = princessSource(m);
  b.transfuseUsed = true;
  const max = monMaxHp(m);
  m.currentHp = Math.max(1, Math.ceil(max * PRINCESS.heal));
  const smax = monMaxHp(src);
  src.currentHp = Math.max(1, src.currentHp - Math.ceil(smax * PRINCESS.cost));
  renderBattle();
  try { drainHp(pid('playerHp', m), 0, m.currentHp, max); } catch(e){}
  try { playEffect('Life Transfusion', { type:'Fairy' }); } catch(e){}
  const who = (typeof isAllyMon === 'function' && isAllyMon(src)) ? 'The Little Princess' : escapeHtml(displayName(src));
  battleMsg(`${who} catches ${escapeHtml(displayName(m))} as it falls — Life Transfusion! It stands again with ${Math.round(PRINCESS.heal * 100)}% of its health. (Her light comes back when the recharge meter fills.)`);
  logBattle(`Life Transfusion: ${displayName(m)} → ${m.currentHp}/${max}; ${displayName(src)} gave ${Math.ceil(smax * PRINCESS.cost)}`);
  setTimeout(rise, 1100);
}
/* every place a fallen monster of yours may rise again (the phoenix's Rebirth) asks her first */
if(typeof rebirthDue === 'function'){
  const _invRebirthDue = rebirthDue;
  rebirthDue = function(m){ const mm = m || (typeof activeMon === 'function' ? activeMon() : null); if(transfuseDue(mm)) return true; return _invRebirthDue.apply(this, arguments); };
}
if(typeof offerRebirth === 'function'){
  const _invOfferRebirth = offerRebirth;
  offerRebirth = function(rise, fall, who){ const mm = who || (typeof activeMon === 'function' ? activeMon() : null); if(transfuseDue(mm)) return doTransfuse(mm, rise); return _invOfferRebirth.apply(this, arguments); };
}
/* the recharge meter brings her light back (it calls allyRecharge every time it fills) */
if(typeof allyRecharge === 'function'){
  const _invAllyRecharge = allyRecharge;
  allyRecharge = function(){
    if(ui.battle) ui.battle.transfuseUsed = false;
    const A = battleAlly();
    if(A && A.kind === 'princess') return;
    return _invAllyRecharge.apply(this, arguments);
  };
}
/* the start of each round (the ally's pre-turn is asked every round): her regeneration */
function princessRegen(){
  const b = ui.battle;
  if(!b || b._princessRegen === b.roundNo) return;
  b._princessRegen = b.roundNo;
  const A = battleAlly(), list = [];
  if(A && A.kind === 'princess' && A.mon) list.push(A.mon);
  /* (4.07) one of your team heals by her Lithification now (5% a round she deals no damage: lithifyRoundEnd), the
     designer: "Fold a 5% of her own HP healing effect into lithification's passive proc for herself" */
  let any = false;
  list.forEach(m=>{
    const max = monMaxHp(m);
    if(m.currentHp > 0 && m.currentHp < max){ m.currentHp = Math.min(max, m.currentHp + Math.ceil(max * PRINCESS.regen)); any = true; }
  });
  if(any) renderBattle();
}
if(typeof allyPreTurn === 'function'){
  const _invAllyPreTurn = allyPreTurn;
  allyPreTurn = function(done){
    princessRegen();
    const A = battleAlly();
    if(A && A.kind === 'princess') return done();
    return _invAllyPreTurn.apply(this, arguments);
  };
}
if(typeof makeAlly === 'function'){
  const _invMakeAlly = makeAlly;
  makeAlly = function(spec){ const A = _invMakeAlly.apply(this, arguments); if(A && spec && spec.kind) A.kind = spec.kind; return A; };
}
if(typeof allyTurn === 'function'){
  const _invAllyTurn = allyTurn;
  allyTurn = function(){ const A = battleAlly(); if(A && A.kind === 'princess') return princessAllyTurn(); return _invAllyTurn.apply(this, arguments); };
}
if(typeof allyPlateHtml === 'function'){
  const _invAllyPlate = allyPlateHtml;
  allyPlateHtml = function(){
    const A = battleAlly();
    if(!(A && A.kind === 'princess')) return _invAllyPlate.apply(this, arguments);
    const m = A.mon, b = ui.battle;
    return `<div class="ally-plate"><b>${escapeHtml(displayName(m))}</b> <span>Lv ${m.level}</span>` +
      `<small>${b && b.transfuseUsed ? 'Life Transfusion spent: back when the meter fills' : 'Life Transfusion ready'} · HP ${m.currentHp}/${monMaxHp(m)} · sings after you</small></div>`;
  };
}
/* her turn, at your side: Prism Lullaby over every one of them */
function princessAllyTurn(){
  const b = ui.battle, A = battleAlly();
  if(!b || !A) return advanceTurn();
  const foes = livingEnemies().filter(e=> e.hp > 0 && !e.broken);
  if(!foes.length) return advanceTurn();
  b.phase = 'resolving';
  setFocus(null);
  b.control = null;
  renderBattle();
  const mk = A.mon, atk = monAtk(mk);
  b.actionSeq = (b.actionSeq || 0) + 1;
  b.actionMon = null;
  b.actionDodges = [];
  battleMsg(`${escapeHtml(displayName(mk))} — Prism Lullaby! A song of light rings out over every one of them.`);
  bob(document.getElementById('allyBob'), +1);
  foes.forEach(t=>{ try { playEffect('Prism Lullaby', { type:'Fairy', at:'enemy-' + b.enemies.indexOf(t) }); } catch(e){} });
  setTimeout(()=>{
    if(ui.battle !== b) return;
    const hits = [];
    foes.forEach(t=>{
      if(t.hp <= 0) return;
      const idx = b.enemies.indexOf(t);
      const dodged = rollDodge(t, idx, 0, false, false, mk);
      const raw = dodged ? 0 : enemyGuard(t, computeDamage(PRINCESS.sing, atk, monRef(mk), t, true));
      if(raw > 0) hits.push({ t, idx, oldHp:t.hp, newHp:Math.max(0, t.hp - raw), dmg:raw, dodged:false });
    });
    if(hits.length){ applyHits(hits, { blow:'a' + b.actionSeq, noStore:true }); reportHits(hits); }
    logBattle(`${displayName(mk)} used Prism Lullaby (ally) — ${PRINCESS.sing}× ATK ${atk} on ${foes.length} → ${hits.map(h=> h.dmg).join(', ') || 'all dodged'}`);
    renderStatusBadges();
    setTimeout(()=>{
      if(ui.battle !== b) return;
      if(livingEnemies().length === 0) return onWaveCleared();
      advanceTurn();
    }, 900);
  }, 420);
}

/* ============================================================
   (4.07) THE FAIRY PRINCESS'S OWN MOVES — the designer's kit for her, one of your team (21-castle.js has the rows;
   the Wadjet fight's ally above keeps 4.00's song and Life Transfusion):
   · Charm (Basic): "Reduces a monster's atk by 30% and has a 30% chance of putting it to sleep" — no damage ("No
     attack multiplier"). Its attacks 30% weaker for 3 turns (a refresh, never a stack: 'adored', 04-battle.js).
   · Dazzling Benevolence (Power 1): "blinds all enemies for 1 turn: 50% miss chance. if enemies are protected by diamond
     dust this effect instead increases to 75% miss chance and cannot be dispelled" — each for its next turn.
     Its always-on part, Life Transfusion: "when a player's monster would faint, fairy princess transfuses 50% of her
     max HP to heal the monster for an equal amount, and removes all debuffs on the monster (including party wide
     debuffs)" — "No longer once per recharge meter", and "pair with rock's ultra passive which caps her at 1HP. She
     will continually transfuse half of 1HP rounded up and retain 1HP herself, making other monsters on her party
     survive for that whole turn no matter what attacks they take." So: half her health, rounded up (at full health,
     half her max); given her last, Metamorph's last stand holds her on 1 HP if it is ready (or its hold does), or she
     falls with it.
   · Lithification (Power 2): "can be used actively once per recharge meter to summon 5 party-wide damage block stacks"
     — the team's pool, Steel Aegis's; its always-on part: "each turn she does not deal direct damage (spike armour
     spikes still work), she grants the party a party-wide damage block stack in the end phase. also increases party's
     damage block effectiveness by 20% whether on the field or the bench", with "a 5% of her own HP healing effect" —
     "from the bench too".
   · Comet Augury (Ultimate 3.0× / 1.5×, Max 4.0× / 2.0×), quick: "Summons a comet that lands 3 turns later (not a
     status, don't count it as such) … deals 4.0x aoe damage. in the fifth turn deals a blast wave for 2.0x aoe damage.
     the comet lands even if fairy princess is not on the field. comet augury cannot be recast until the comet lands"
     — it lands in the pre-turn ("Earliest recast R+3 as comet lands in the pre-turn"), "not count as her direct
     damage", never critical, "No dodge, hits through shields", and like every pre-turn strike no type or resistance.
     Its 4 bonus words: "a 5 turn undispellable debuff labelled 'portent' where immediately the player's own side
     takes increased damage (curse's bucket) for 2 turns, but then the effect then switches to the enemies' side for
     the last 3 turns … 50% … then 25% … then 25% … then 50% … for 2 turns", "two portents can coexist but cannot stack
     beyond the effect of one portent"; and "this move can benefit from overcharge (2 comets, 2 blast waves)".
   ============================================================ */
const PRINCESS_KIT = { give:0.5, lithHeal:0.05, lithAmp:0.2, cometDelay:3,
  portent:[{ side:'player', amp:0.5 }, { side:'player', amp:0.25 }, { side:'enemy', amp:0.25 }, { side:'enemy', amp:0.5 }, { side:'enemy', amp:0.5 }] };
/* Yours with one of her always-on parts (`key`: lifeGift, lithStone), standing — out front, waiting, or a companion
   beside one of yours. A ✦ Curse of theirs quiets them, as any passive (passiveOf). */
function kitHolders(key){
  if(!ui.battle) return [];
  const seen = new Set(), out = [];
  const pool = playerField().concat(battleParty(),
    (typeof companionsAllowed === 'function' && companionsAllowed() && typeof bondedCompanions === 'function') ? bondedCompanions() : []);
  pool.forEach(m=>{
    if(!m || !m.uid || seen.has(m.uid) || !(m.currentHp > 0)) return;
    seen.add(m.uid);
    const p = passiveOf(m);
    if(p && p[key]) out.push(m);
  });
  return out;
}

/* ---- Charm ---- */
function castPrincessCharm(mon, mv, target){
  const b = ui.battle, d = mv.charmAtk;
  const t = (target && target.hp > 0) ? target : livingEnemies()[0];
  if(!t) return setTimeout(()=> afterPlayerAttack(mon, []), 600);
  const nm = escapeHtml(SPECIES[t.species].name), idx = b.enemies.indexOf(t);
  bob($('#' + pid('playerBob')), +1);
  try { playEffect(mv.name, { type:'Fairy', at:'enemy-' + idx }); } catch(e){}
  addEStatus(t, { type:'adored', turnsLeft:d.turns, byRound:true, cut:d.cut, mine:true });   // a refresh, never a stack
  const took = !!getEStatus(t, 'adored');
  let line = took ? `💗 ${escapeHtml(mv.name)} — ${nm} is charmed: its attacks deal <b>${Math.round(d.cut * 100)}% less</b> for ${d.turns} turns.`
           : enemyDust() ? `✨ ${escapeHtml(mv.name)} — their diamond dust keeps ${nm} from being charmed.`
           : `${escapeHtml(mv.name)} — ${nm} will not be charmed.`;
  if(took && t.hp > 0 && Math.random() < d.sleep){ const z = putToSleep(t, mv.name); if(z) line += ' ' + z; }
  renderStatusBadges();
  battleMsg(line);
  logBattle(`${displayName(mon)} used ${mv.name} on ${SPECIES[t.species].name}: ${took ? 'charmed' : 'not charmed'}${getEStatus(t, 'asleep') ? ', asleep' : ''}`);
  setTimeout(()=> afterPlayerAttack(mon, []), 1000);
}

/* ---- Dazzling Benevolence ---- */
function castDazzle(mon, mv){
  const b = ui.battle, d = mv.dazzle, foes = livingEnemies();
  const dust = !!enemyDust(), miss = dust ? d.dust : d.miss;
  bob($('#' + pid('playerBob')), +1);
  try { playEffect(mv.name, { type:'Fairy' }); } catch(e){}
  let n = 0;
  foes.forEach(t=>{
    /* for its next turn: this round's, if it is still to come, else the next round's */
    const st = { type:'blinded', until:roundNo() + (turnStillToCome(t) ? 0 : 1), miss, mine:true };
    const was = getEStatus(t, 'blinded');
    if(was && (was.until == null || was.until >= roundNo())){
      st.until = Math.max(st.until, was.until == null ? st.until : was.until);
      st.miss = Math.max(st.miss, was.miss || BLIND_MISS);
      if(was.unsweepable) st.unsweepable = st.through = true;
    }
    if(dust) st.unsweepable = st.through = true;              // through their dust, and nothing clears it
    addEStatus(t, st);
    if(blindOf(t)) n++;
  });
  renderStatusBadges();
  const who = n === foes.length ? (foes.length > 1 ? 'Every one of them is' : `${escapeHtml(SPECIES[foes[0].species].name)} is`) : `${n} of them are`;
  battleMsg(!n ? `${escapeHtml(mv.name)} — but none of them is dazzled.`
    : dust ? `✨ ${escapeHtml(mv.name)}! Their diamond dust only scatters her light further — ${who.toLowerCase()} blinded: <b>${Math.round(miss * 100)}%</b> of their attacks will miss on their next turn, and nothing can clear it.`
           : `🔆 ${escapeHtml(mv.name)}! ${who} blinded: <b>${Math.round(miss * 100)}%</b> of their attacks will miss on their next turn.`);
  logBattle(`${displayName(mon)} used ${mv.name}: ${n} of ${foes.length} blinded at ${miss}${dust ? ' (through their dust)' : ''}`);
  setTimeout(()=> afterPlayerAttack(mon, []), 1000);
}

/* ---- Life Transfusion (Dazzling Benevolence's always-on part) ---- */
function giftGiver(m){ return kitHolders('lifeGift').find(p=> p !== m && p.uid !== (m && m.uid)) || null; }
/* every mark of theirs on it and on your side, lifted (not what cannot be: a Portent, a bog — unsweepable — nor a
   Binding Curse of theirs, which holds) */
function giftCleanse(m){
  let n = 0;
  const ps = partyStatuses();
  Object.keys(ps).forEach(k=>{
    const st = ps[k];
    if(!st || st.unsweepable || statusOwner(k, st, 'player') !== 'enemy') return;
    if(k === 'curse' && typeof foeBinder === 'function' && foeBinder()) return;
    delete ps[k]; afterStatusGone(k, 'player'); n++;
  });
  monStatuses(m).slice().forEach(st=>{
    if(st.unsweepable || statusOwner(st.type, st, 'player') !== 'enemy') return;
    const list = monStatuses(m), i = list.indexOf(st);
    if(i >= 0){ list.splice(i, 1); afterStatusGone(st.type, 'player'); n++; }
  });
  return n;
}
function giveLife(m, rise){
  const src = giftGiver(m);
  if(!src) return rise();
  const give = Math.max(1, Math.ceil((src.currentHp || 0) * PRINCESS_KIT.give));
  const max = monMaxHp(m);
  m.currentHp = Math.min(max, give);
  const before = src.currentHp;
  let left = before - give, how = '';
  if(left <= 0){
    if(endureActive(src)){ left = 1; how = 'hold'; }                    // Metamorph's hold, this turn and the next
    else if(bedrockReady(src)){ bedrockSave(src); left = 1; how = 'stand'; }   // its last stand: 1 HP, a shield, and the hold
    else { left = 0; how = 'fall'; }
  }
  src.currentHp = Math.max(0, left);
  const lifted = giftCleanse(m);
  renderBattle();
  try { drainHp(pid('playerHp', m), 0, m.currentHp, max); } catch(e){}
  try { playEffect('Life Transfusion', { type:'Fairy' }); } catch(e){}
  const who = escapeHtml(displayName(src)), nm = escapeHtml(displayName(m));
  battleMsg(`💗 ${who} catches ${nm} as it falls — Life Transfusion! She gives it <b>${give} HP</b>, and it stands again` +
    (lifted ? ` with ${lifted === 1 ? 'a mark' : `${lifted} marks`} of theirs lifted` : '') + '.' +
    (how === 'stand' ? ` 🦋 <b>Metamorph!</b> ${who} holds on at 1 HP — a shield forms, and she holds on through the next turn.`
     : how === 'hold' ? ` ${who} holds on at 1 HP.`
     : how === 'fall' ? ` It was the last of her light: ${who} falls.` : ''));
  logBattle(`Life Transfusion: ${displayName(m)} → ${m.currentHp}/${max}; ${displayName(src)} gave ${give} (${before}→${src.currentHp})${how ? ' · ' + how : ''}`);
  setTimeout(()=>{
    if(!ui.battle) return;
    if(how === 'fall' && src === companionOnField()) companionFalls(src);   // out front beside one of yours: she leaves the field
    rise();
  }, 1100);
}

/* ---- Lithification ---- */
function castLithify(mon, mv){
  const b = ui.battle, d = mv.lithify;
  (b.usedSoul || (b.usedSoul = {}))['lithify:' + mon.uid] = true;        // back when the meter fills (feedRecharge)
  grantTeamBlock('player', d.shields, monAtk(mon));
  bob($('#' + pid('playerBob')), +1);
  try { playEffect(mv.name, { type:'Ground' }); } catch(e){}
  playSfx('power_up');
  battleMsg(`🪨 ${escapeHtml(mv.name)}! Stone grows over your whole team: <b>${d.shields} shields</b>, each soaking up to <b>${Math.round(monAtk(mon) * shieldAmp('player'))}</b>.`);
  logBattle(`${displayName(mon)} used ${mv.name}: ${d.shields} team shields at ${monAtk(mon)}`);
  setTimeout(()=> afterPlayerAttack(mon, []), 1000);
}
/* every shield of yours soaks 20% more while she stands, on the field or off it (applyBlock, 04-battle.js) */
function lithifyAmp(){ return kitHolders('lithStone').length ? 1 + PRINCESS_KIT.lithAmp : 1; }
/* a blow of hers that reached them this round: no stone at its end (Spike Armour's spikes, the comet: not hers) */
function noteDealtDirect(mon, hits){
  const b = ui.battle;
  if(!b || !mon || !mon.uid) return;
  if((hits || []).some(h=> h && h.t && !h.dodged && ((h.raw != null ? h.raw : h.dmg) > 0))) (b._dealt || (b._dealt = {}))[mon.uid] = roundNo();
}
/* the end phase (endRound): each of hers that dealt no damage this round, a shield for your team and 5% of her health */
function lithifyRoundEnd(){
  const b = ui.battle;
  if(!b || livingEnemies().length === 0) return '';
  const r = roundNo(), said = [];
  kitHolders('lithStone').forEach(m=>{
    if(b._dealt && b._dealt[m.uid] === r) return;
    grantTeamBlock('player', 1, monAtk(m));
    const max = monMaxHp(m), before = m.currentHp;
    m.currentHp = Math.min(max, before + Math.max(1, Math.ceil(max * PRINCESS_KIT.lithHeal)));
    const healed = m.currentHp - before;
    if(healed > 0 && playerField().includes(m)){ try { drainHp(pid('playerHp', m), before, m.currentHp, max); showDamageNumber(pid('playerBob', m), healed, { heal:true }); } catch(e){} }
    said.push(`🪨 ${escapeHtml(displayName(m))}'s Lithification: a shield for your team${healed > 0 ? `, and <b>${healed} HP</b> back for her` : ''}.`);
  });
  return said.join(' ');
}

/* ---- Comet Augury, and the Portent ---- */
function castComet(mon, mv){
  const b = ui.battle, d = mv.comet, r = roundNo();
  /* Overcharge, rolled as it is cast (as a charge's): up, two comets and two blast waves — one Portent */
  const oc = getPStatus(0, 'overcharge');
  const surge = !!(oc && livingEnemies().length && Math.random() < overchargeChance());
  if(oc) spendOverchargeFirst(oc);
  b.comets = (b.comets || []).filter(c=> c.blastRound >= r);
  b.comets.push({ owner:mon.uid, name:mv.name, atk:monAtk(mon), hit:d.hit, blast:d.blast, n:surge ? 2 : 1,
                  landRound:r + PRINCESS_KIT.cometDelay, blastRound:r + PRINCESS_KIT.cometDelay + 1 });
  const won = !!b._portentWon;
  b._portentWon = false;
  if(won) b.portents = (b.portents || []).filter(p=> r - p.from < PRINCESS_KIT.portent.length).concat([{ from:r, owner:mon.uid }]);
  try { playEffect(mv.name, { type:'Fairy' }); } catch(e){}
  playSfx('power_up');
  logBattle(`${displayName(mon)} used ${mv.name} (quick): ${surge ? 2 : 1} comet(s) at ${monAtk(mon)} ATK, landing round ${r + PRINCESS_KIT.cometDelay}${won ? ', with a Portent' : ''}`);
  b.phase = 'player';
  renderBattle();
  battleMsg(`☄️ ${escapeHtml(mv.name)}! ${surge ? 'Two comets are' : 'A comet is'} called down out of the sky — ${surge ? 'they land' : 'it lands'} as the third round from now begins.` +
    (surge ? ' ⚡ The Overcharge doubled it.' : '') +
    (won ? ` 🔮 A <b>Portent</b> hangs over the field: your side takes <b>+50%</b> damage this round, <b>+25%</b> the next, and then it turns on them.` : '') +
    ` It cost no turn — choose your move.`);
}
/* how many rounds until a comet of hers lands (0: none falling) — and Comet Augury waits for it */
function cometFalling(m){
  const b = ui.battle;
  if(!b || !b.comets || !m) return 0;
  const r = roundNo(), mine = b.comets.filter(c=> c.owner === m.uid && c.landRound > r);
  return mine.length ? Math.min(...mine.map(c=> c.landRound - r)) : 0;
}
/* the pre-turn (beginRound, after the pre-hits): the comets that land this round, and the blast waves of last round's */
function runComets(done){
  const b = ui.battle;
  if(!b || !b.comets || !b.comets.length) return done();
  const r = roundNo(), queue = [];
  b.comets.forEach(c=>{
    for(let k = 0; k < (c.n || 1); k++){
      if(c.landRound === r) queue.push({ c, mult:c.hit, land:true });
      if(c.blastRound === r) queue.push({ c, mult:c.blast, land:false });
    }
  });
  b.comets = b.comets.filter(c=> c.blastRound > r);
  if(!queue.length) return done();
  let i = 0;
  const step = ()=>{
    if(!ui.battle) return;
    const foes = livingEnemies();
    if(i >= queue.length || !foes.length) return done();
    const q = queue[i++];
    const owner = tipOwner(q.c.owner);
    const buff = ownBuffMultiplier(owner || { uid:q.c.owner });        // her damage buffs, her Feeble — as a pre-hit's
    const hits = foes.map(t=>{
      const dmg = Math.ceil(q.mult * q.c.atk * buff * hexAmp(t) * curseBucket(getEStatus(t, 'curse'), 'enemy'));   // a Curse and a Portent, one bucket
      return { t, idx:b.enemies.indexOf(t), dmg, oldHp:t.hp, newHp:Math.max(0, t.hp - dmg), pierce:true };   // through every shield
    });
    cometFlash(q.land);
    applyHits(hits, { noLeech:true, by:owner || null });                // no dodge, never critical, not her direct damage
    reportHits(hits);
    renderStatusBadges();
    const sum = hits.reduce((a, h)=> a + (h.dmg || 0), 0);
    battleMsg(q.land ? `☄️ The comet falls on them — <b>${sum}</b> in all!` : `💥 Its blast wave rolls over them — <b>${sum}</b> in all!`);
    logBattle(`${q.c.name}: ${q.land ? 'lands' : 'blast wave'} ${q.mult}× ${q.c.atk} → ${hits.map(h=> h.dmg).join(', ')}`);
    setTimeout(step, 1000);
  };
  step();
}
/* the sky, lit for a moment as it lands (white-violet), a softer pulse for its blast wave */
function cometFlash(land){
  try {
    const f = document.createElement('div');
    f.className = 'comet-flash' + (land ? '' : ' wave');
    document.body.appendChild(f);
    setTimeout(()=> f.remove(), 1100);
  } catch(e){}
}
/* the Portent: what it adds to the blows on `side` this round (0 if nothing) — never more than one Portent's */
function portentAmp(side){
  const b = ui.battle;
  if(!b || !b.portents || !b.portents.length) return 0;
  const r = roundNo();
  let best = 0;
  b.portents.forEach(p=>{ const st = PRINCESS_KIT.portent[r - p.from]; if(st && st.side === side) best = Math.max(best, st.amp); });
  return best;
}
function portentPillHtml(side){
  const a = portentAmp(side);
  if(!a) return '';
  return `<span class="status-pill ${side === 'player' ? 'foe' : 'mine'}"${pillAt('portent', side === 'player' ? 'ps' : 'fs')}>🔮 Portent +${Math.round(a * 100)}%</span>`;
}
function portentTip(c){
  const side = c.yours ? 'player' : 'enemy', a = portentAmp(side);
  return `The princess's Portent: ${c.yours ? 'your' : 'their'} side takes <b>${Math.round(a * 100)}% more</b> damage this round, in one bucket with a Curse's. ` +
    `It passes from your side (+50%, then +25%) to theirs (+25%, then +50% for two rounds) — her comet falls in the first +50% — and nothing can lift it.`;
}
/* her comet, falling: a countdown on their row (not a status: nothing counts it, sweeps it or steals it) */
function cometPillHtml(){
  const b = ui.battle;
  if(!b || !b.comets || !b.comets.length) return '';
  const r = roundNo(), c = b.comets.filter(x=> x.blastRound > r - 1).sort((x, y)=> x.landRound - y.landRound)[0];
  if(!c) return '';
  const left = Math.max(0, c.landRound - r);
  return `<span class="status-pill mine"${pillAt('comet', 'fs')}>☄️ Comet${c.n > 1 ? ' ×' + c.n : ''} ${left}</span>`;
}
function cometTip(){
  const b = ui.battle;
  if(!b || !b.comets || !b.comets.length) return '';
  const r = roundNo();
  return b.comets.map(c=>{
    const left = c.landRound - r, o = tipOwner(c.owner);
    const hit = Math.ceil(c.hit * c.atk), wave = Math.ceil(c.blast * c.atk);
    return (left > 0 ? `${c.n > 1 ? 'Two comets land' : 'A comet lands'} in <b>${left}</b> round${left === 1 ? '' : 's'}` : `${c.n > 1 ? 'Their' : 'Its'} blast wave rolls out next round`) +
      ` (${o ? escapeHtml(displayName(o)) + "'s " : ''}${escapeHtml(c.name)}): <b>${c.hit}×</b> her ATK (<b>${hit}</b>) on every one of them, then a blast wave of <b>${c.blast}×</b> (<b>${wave}</b>). ` +
      `No dodge, through every shield, never critical.`;
  }).join(' ');
}
let _kitCss = false;
function princessKitCss(){
  if(_kitCss || typeof document === 'undefined') return;
  _kitCss = true;
  const s = document.createElement('style');
  s.id = 'princessKitCss';
  s.textContent = `
  .comet-flash{ position:fixed; inset:0; z-index:91; pointer-events:none; background:radial-gradient(circle at 50% 28%, rgba(255,255,255,.95), rgba(214,196,255,.6) 30%, rgba(120,90,255,0) 70%);
    animation:cometFlash 1s ease-out both; }
  .comet-flash.wave{ background:radial-gradient(circle at 50% 30%, rgba(214,196,255,.0) 20%, rgba(190,160,255,.55) 34%, rgba(150,120,255,0) 60%); animation:cometWave 1s ease-out both; }
  @keyframes cometFlash{ 0%{ opacity:0; } 12%{ opacity:1; } 100%{ opacity:0; } }
  @keyframes cometWave{ 0%{ opacity:0; transform:scale(.5); } 25%{ opacity:1; } 100%{ opacity:0; transform:scale(1.6); } }
  @media (prefers-reduced-motion: reduce){ .comet-flash{ animation-duration:.4s; } }`;
  document.head.appendChild(s);
}
if(typeof document !== 'undefined') princessKitCss();

/* ============================================================
   AFTERWARDS: THE RIFT'S PERIMETER (r6_perimeter)
   The crack in the north wall, behind the palace: a compound fenced round
   it, the aliens that still creep through it inside, pushing against the
   palisade, the Commander's soldiers outside holding them in. Go in by its
   gate: its bands (ten a day, as the jungle's: beaten for the day) are
   fought as the jungle's, their captives the tribes' people and the
   castle's — so they count for the King's week and every daily thanks.
   ============================================================ */
let _invRiftMap = null;
function invRiftMap(){
  if(_invRiftMap) return _invRiftMap;
  const T = CA_T, W = 26, H = 20, m = caGrid(W, H, T.COBBLE);
  caFill(m, 0, 0, W, 3, T.WALL);
  for(let x = 0; x < W; x++){ m.spr[x] = 'wallTop'; m.spr[W + x] = 'wallTop'; m.spr[2 * W + x] = 'wallN'; }
  caFill(m, 4, 3, 18, 12, T.PATH);                                       // the compound: the ground torn up
  for(let y = 3; y <= 15; y++){ caPut(m, 3, y, T.PLANTER, 'cobble:' + (y % 6)); caPut(m, 22, y, T.PLANTER, 'cobble:' + ((y + 3) % 6)); }
  for(let x = 4; x <= 21; x++) if(x !== 12 && x !== 13) caPut(m, x, 15, T.PLANTER, 'cobble:' + (x % 6));
  caPut(m, 12, 15, T.PATH); caPut(m, 13, 15, T.PATH);                    // its gate
  m.tags.rift = { x:13, y:1.4 };
  m.tags.gate = { x:12, y:15, w:2 };
  m.tags.exit = { x:9, y:19, w:8 };
  for(let i = 0; i < W * H; i++) if(!m.spr[i]) m.spr[i] = caDefaultSpr(m, i % W, Math.floor(i / W));
  return (_invRiftMap = m);
}
const INV_RIFT_CLASH = [['chestnut_knight2', 1, 5, 'alien_robot_steel', 4, 5], ['bug_knight1', 1, 10, 'alien_crocodilian_fire', 4, 10],
                        ['duck_knight2', 24, 6, 'alien_golem_ground', 21, 6], ['chestnut_knight2', 24, 11, 'alien_gremlin_fairy', 21, 11],
                        ['bug_knight1', 7, 17, 'alien_insect_physical', 7, 14], ['duck_knight2', 18, 17, 'alien_dolphin_water', 18, 14]];
function invPerimBeaten(b){ return jgState().beaten[b.id] === today(); }
let _invPerim = null, _invPerimDay = null;
function invPerimBands(){
  const day = today();
  if(_invPerim && _invPerimDay === day) return _invPerim;
  const R = jgRng((JG.seed ^ 0x9e11 ^ jgDaySeed('rift' + day)) >>> 0), ri = n=> Math.floor(R() * n);
  const ranks = ['commander', 'captain', 'captain', 'captain', 'alien', 'alien', 'alien', 'alien', 'alien', 'alien'];
  const taken = [];
  const busy = new Set(INV_RIFT_CLASH.map(c=> c[4] + ',' + c[5]));
  const list = [];
  ranks.forEach((rank, i)=>{
    for(let tries = 0; tries < 200; tries++){
      const x = 6 + ri(14), y = 4 + ri(9);
      if(busy.has(x + ',' + y) || (x >= 11 && x <= 14 && y >= 12)) continue;
      if(taken.some(t=> Math.abs(t.x - x) + Math.abs(t.y - y) < 3)) continue;
      taken.push({ x, y });
      const b = { id:'rf' + i, perim:true, deck:'r6_perimeter', rank, x, y, tribe:null, aliens:[], lv:rank === 'alien' ? 160 : INV.lv };
      if(rank === 'alien') b.aliens.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]);
      else { for(let k = 0; k < (rank === 'commander' ? 4 : 2); k++) b.aliens.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]); b.aliens.push(JG_CAPTAIN); if(rank === 'commander') b.aliens.push(JG_COMMANDER); }
      b.lead = b.aliens[b.aliens.length - 1];
      list.push(b);
      break;
    }
  });
  _invPerim = list; _invPerimDay = day;
  return list;
}
function invRiftThings(T){
  T({ x:9, y:19, w:8, walk:true, icon:'', verb:'Out', where:'Back into the castle', arrow:'down', act:()=> caGo(CA_KEY, INV_PERIM.out) });
  T({ x:15, y:16, still:true, cls:'ca-npc', html:()=> caMonImg('chestnut_knight2_c', WALK_T * 1.6, false), verb:'Talk', sub:'The Royal Commander', act:()=> invPerimCommanderTalk() });
  invClashThings(T, INV_RIFT_CLASH, ()=> invAfter(), { talk:()=> caLines([['knight', caTurn('invPerimSoldier', INV_LINES.perimSoldier)]]) });
  /* today's bands: a deck's things are made once, so all ten places are made, and each shows while its band is up */
  for(let i = 0; i < 10; i++){
    const slot = { get b(){ return invPerimBands()[i]; } };
    const t = { get x(){ return slot.b ? slot.b.x : -5; }, get y(){ return slot.b ? slot.b.y : -5; }, get band(){ const b = slot.b; if(b) b.thing = t; return b; },
      get cls(){ return 'ca-npc inv-band inv-band-' + (slot.b ? slot.b.rank : 'alien'); },
      html:()=> slot.b ? `<div class="war-fig">${jgMonImg(slot.b.lead, WALK_T * (slot.b.rank === 'commander' ? 1.9 : slot.b.rank === 'captain' ? 1.7 : 1.5), false)}</div>` : '',
      verb:'Fight', get sub(){ const b = slot.b, nm = b ? (SPECIES[b.lead] || {}).name : ''; return !b ? '' : b.rank === 'commander' ? `Commander ${nm}'s army` : b.rank === 'captain' ? `Captain ${nm}'s band` : `${nm} and its captives`; },
      when:()=> !!slot.b && invBandUp(slot.b), act:()=> invFight(slot.b) };
    T(t);
  }
}
function invPerimEnter(){
  if(!invSaid('perimIn')){
    return caLines([['commander', `<b>"The perimeter. My soldiers keep them penned in here, round the crack. Go in whenever you like: there are always more of them."</b>`],
                    ['commander', `<b>"Every one you beat in there counts for His Majesty's challenge, and frees whoever they've taken — the tribes' people and ours."</b>`]])
      .then(()=>{ invSay('perimIn'); caGo('r6_perimeter', [12, 17]); });
  }
  caGo('r6_perimeter', [12, 17]);
}
function invPerimCommanderTalk(){
  const left = invPerimBands().filter(b=> invBandUp(b)).length, j = jgState(), q = questState();
  const wk = q.wk ? `${q.wk.paid ? 'done' : (q.wk.n || 0) + '/' + QUEST.weekly}` : '—';
  const castle = `${Math.min(CA_RESCUE.need, j.rescued.castle || 0)}/${CA_RESCUE.need}`;
  return caLines([['commander', caTurn('invPerimCmd', [
    `<b>"They keep coming through that crack, but fewer every day. We'll hold them."</b>`,
    `<b>"In you go. Mind the big ones."</b>`,
    `<b>"His Majesty is mending. The tribes send fruit and firewood. Strange days, good days."</b>`]) +
    `<br><br><i>${left ? `${left} of today's ${invPerimBands().length} bands are inside.` : `Today's bands are all beaten. More come through tomorrow.`} The King's week: ${wk}. The castle's people freed today: ${castle}.</i>`]]);
}

/* ---------- the deck ---------- */
if(typeof CA_MAPS !== 'undefined'){
  CA_MAPS.r6_perimeter = ()=> invRiftMap();
  CA_PLACES.r6_perimeter = { title:'The Rift Perimeter', backLabel:'Castle', music:'zone_perimeter', spawn:()=> [12, 17] };
  caMakeDeck('r6_perimeter', CA_PLACES.r6_perimeter);
}

/* ---------- the jungle, afterwards: a wild one now and then on its paths (as the catacombs' were) ---------- */
const INV_WILD = { rate:1 / 45, calm:24 };
function invJungleRoll(p){
  const s = ui.invWild || (ui.invWild = { calm:INV_WILD.calm });
  if(ui.jgTalk || ui.jgFighting || ui.sceneRunning || walkState().busy) return false;
  if(s.calm > 0){ s.calm--; return false; }
  if(!p || jgVillageAt(p.x, p.y) || jgBandAt(p.x, p.y)) return false;
  const C = jgGround().places.castle;
  if(Math.abs(p.x - (C.x + C.w / 2)) < C.w / 2 + 6 && Math.abs(p.y - (C.y + C.h / 2)) < C.h / 2 + 6) return false;   // not right by the castle
  if(Math.random() >= INV_WILD.rate) return false;
  s.calm = INV_WILD.calm;
  const sp = JG_ALIEN_IDS[Math.floor(Math.random() * JG_ALIEN_IDS.length)];
  const b = { id:'wild' + Date.now(), rank:'alien', x:p.x, y:p.y, hx:p.x, hy:p.y, face:'d', tribe:jgTribeOf(p.x, p.y),
              lv:JG.aliens.lv[0] + Math.floor(Math.random() * 10), aliens:[sp], lead:sp, wild:true };
  toast('An alien leaps out of the undergrowth!');
  jgFight(b, true);
  return true;
}
if(typeof jgStep === 'function'){
  const _invJgStep = jgStep;
  jgStep = function(p, d){
    const r = _invJgStep.apply(this, arguments);
    if(!r && invAfter() && invJungleRoll(p)) return true;
    return r;
  };
  if(typeof JG_DECK !== 'undefined') JG_DECK.onStep = (p, d)=> jgStep(p, d);
}

/* ============================================================
   THE PICTURES: saucers, smoke, the crack, the palisade, the black beam, her pink light
   ============================================================ */
function invUfoSvg(){
  return `<svg viewBox="0 0 200 116" class="inv-ufo-art" aria-hidden="true"><defs>` +
    `<linearGradient id="iuHull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f6"/><stop offset=".45" stop-color="#aeb6c6"/><stop offset="1" stop-color="#5c6478"/></linearGradient>` +
    `<radialGradient id="iuDome" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#e9fffb"/><stop offset=".45" stop-color="#7fe7dc" stop-opacity=".9"/><stop offset="1" stop-color="#2a8a9a" stop-opacity=".85"/></radialGradient>` +
    `</defs>` +
    `<path d="M62 56 C62 20 138 20 138 56 Z" fill="url(#iuDome)" stroke="#2b5d68" stroke-width="2.5"/>` +
    `<path d="M76 40 C80 31 92 27 101 27" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".75"/>` +
    `<ellipse cx="100" cy="70" rx="64" ry="13" fill="#3f4558"/>` +
    `<ellipse class="iu-core" cx="100" cy="76" rx="24" ry="6.5" fill="#b9ffd2"/>` +
    `<ellipse cx="100" cy="60" rx="96" ry="22" fill="url(#iuHull)" stroke="#40475a" stroke-width="2.5"/>` +
    `<ellipse cx="100" cy="58" rx="80" ry="9" fill="none" stroke="#ffffff" stroke-width="2" opacity=".45"/>` +
    [20, 44, 72, 100, 128, 156, 180].map((x, i)=> `<circle class="iu-light iu-l${i % 3}" cx="${x}" cy="${62 + Math.round(Math.sin((x - 100) / 60) * 0)}" r="6"/>`).join('') +
    `</svg>`;
}
function invUfoEl(id, gx, gy, world, high){
  world = world || $('#walkWorld');
  if(!world) return null;
  const old = document.getElementById('iu-' + id);
  if(old) old.remove();
  const T = WALK_T, w = 3.3 * T, h = 1.95 * T;
  const el = document.createElement('div');
  el.className = 'inv-ufo' + (high ? ' inv-ufo-high' : '');
  el.id = 'iu-' + id;
  el.style.cssText = `left:${gx * T - w / 2}px;top:${(gy - 1.25) * T - h}px;width:${w}px;height:${h}px;z-index:${Math.round(14 + gy)};`;
  el.innerHTML = `<div class="inv-ufo-shadow" style="top:${h + 1.15 * T}px;"></div><div class="inv-ufo-beam" style="height:${1.35 * T}px;"></div><div class="inv-ufo-body">${invUfoSvg()}</div>`;
  world.appendChild(el);
  return el;
}
function invSmokeEl(world, x, y, i){
  const T = WALK_T, el = document.createElement('div');
  el.className = 'inv-smoke';
  el.style.cssText = `left:${x * T}px;top:${y * T}px;z-index:${Math.round(60 + y)};--sm:${T}px;`;
  el.innerHTML = '<b></b><i></i><i></i><i></i><i></i><i></i><i></i>';
  el.style.animationDelay = `${-i * 0.7}s`;
  world.appendChild(el);
  return el;
}
function invRiftEl(world, cx, cy, size, id, extra){
  world = world || $('#walkWorld');
  if(!world) return null;
  const old = document.getElementById(id);
  if(old) old.remove();
  const T = WALK_T, w = size * T, h = size * 1.25 * T;
  const el = document.createElement('div');
  el.className = 'inv-rift ' + (extra || '');
  el.id = id;
  el.style.cssText = `left:${cx * T - w / 2}px;top:${cy * T - h / 2}px;width:${w}px;height:${h}px;z-index:${Math.round(12 + cy)};`;
  el.innerHTML = `<svg viewBox="0 0 100 125" aria-hidden="true"><defs><radialGradient id="irIn" cx=".5" cy=".5" r=".55">` +
    `<stop offset="0" stop-color="#0a0212"/><stop offset=".55" stop-color="#2a0a46"/><stop offset=".85" stop-color="#7b2fbf"/><stop offset="1" stop-color="#d79bff" stop-opacity=".2"/></radialGradient></defs>` +
    `<path class="ir-glow" d="M50 2 C58 18 60 30 66 40 C72 52 64 60 70 72 C76 86 62 98 56 110 C54 116 51 121 50 123 C49 121 46 116 44 110 C38 98 24 86 30 72 C36 60 28 52 34 40 C40 30 42 18 50 2 Z" fill="#b65cff" opacity=".35"/>` +
    `<path class="ir-edge" d="M50 6 L54 20 L61 26 L56 38 L63 48 L57 58 L64 70 L56 80 L60 94 L53 104 L50 120 L47 104 L40 94 L44 80 L36 70 L43 58 L37 48 L44 38 L39 26 L46 20 Z" fill="url(#irIn)"/>` +
    `<g class="ir-swirl"><path d="M50 63 m-9 0 a9 16 0 1 1 9 16" fill="none" stroke="#d6a3ff" stroke-width="2.4" opacity=".8"/><path d="M50 63 m-4.5 0 a4.5 8 0 1 1 4.5 8" fill="none" stroke="#fbeaff" stroke-width="2" opacity=".85"/></g>` +
    `<g class="ir-motes"><circle cx="66" cy="34" r="2.2"/><circle cx="33" cy="58" r="1.8"/><circle cx="64" cy="88" r="1.6"/><circle cx="38" cy="96" r="2"/></g>` +
    `</svg>`;
  world.appendChild(el);
  return el;
}
/* the palisade's stakes along a run of squares, and the compound's people */
function invStakes(world, squares, cls){
  const T = WALK_T;
  squares.forEach(([x, y])=>{
    const s = document.createElement('div');
    s.className = 'inv-stake ' + (cls || '');
    s.style.cssText = `left:${(x + 0.08) * T}px;top:${(y - 0.15) * T}px;width:${0.84 * T}px;height:${1.15 * T}px;z-index:${11 + y};`;
    s.innerHTML = `<svg viewBox="0 0 84 115" preserveAspectRatio="none" aria-hidden="true">` +
      [6, 34, 62].map(px=> `<path d="M${px} 115 V20 L${px + 8} 4 L${px + 16} 20 V115 Z" fill="#8a5a33" stroke="#4a2d16" stroke-width="2.5"/><path d="M${px + 4} 112 V24" stroke="#b07c4a" stroke-width="3" opacity=".7"/>`).join('') +
      `<rect x="0" y="44" width="84" height="9" fill="#6b4426" stroke="#3a2412" stroke-width="2"/><rect x="0" y="82" width="84" height="9" fill="#6b4426" stroke="#3a2412" stroke-width="2"/></svg>`;
    world.appendChild(s);
  });
}
function invRiftDraw(world){
  const m = invRiftMap(), sq = [];
  for(let y = 3; y <= 15; y++){ sq.push([3, y]); sq.push([22, y]); }
  for(let x = 4; x <= 21; x++) if(x !== 12 && x !== 13) sq.push([x, 15]);
  invStakes(world, sq);
  invRiftEl(world, m.tags.rift.x, m.tags.rift.y, 2.6, 'invRiftPerim', '');
}
/* on the grounds: the crack, the palisade round it, a few of them pushing against it */
function invPerimDraw(world){
  const P = INV_PERIM, T = WALK_T, sq = [];
  for(let y = P.y; y < P.y + P.h - 1; y++){ sq.push([P.x, y]); sq.push([P.x + P.w - 1, y]); }
  for(let x = P.x; x < P.x + P.w; x++) if(x !== P.gate) sq.push([x, P.y + P.h - 1]);
  [['alien_robot_steel', 46.6, 3.4], ['alien_gremlin_fairy', 49.8, 3.9], ['alien_toxic_gas_ghost', 52.2, 3.3]].forEach(([al, x, y], i)=>{
    const a = document.createElement('div');
    a.className = 'inv-penned';
    a.style.cssText = `left:${(x - 0.7) * T}px;top:${(y - 0.6) * T}px;width:${1.4 * T}px;height:${1.4 * T}px;z-index:${12 + Math.floor(y)};animation-delay:${-i * 0.4}s;`;
    a.innerHTML = jgMonImg(al, T * 1.4, i % 2 === 1);
    world.appendChild(a);
  });
  invStakes(world, sq);
}
/* the black beam, from (x0, y0) to (x1, y1) in squares */
function invBeam(x0, y0, x1, y1, ms){
  const world = $('#walkWorld');
  if(!world) return;
  const T = WALK_T, dx = (x1 - x0) * T, dy = (y1 - y0) * T, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
  const el = document.createElement('div');
  el.className = 'inv-beam';
  el.style.cssText = `left:${x0 * T}px;top:${y0 * T}px;width:${len}px;height:${0.42 * T}px;margin-top:${-0.21 * T}px;transform:rotate(${ang}rad);animation-duration:${ms * SCENE_SPEED}ms;`;
  world.appendChild(el);
  setTimeout(()=> el.remove(), ms * SCENE_SPEED + 60);
}
/* rings of light going out from (cx, cy) */
function invShockwave(cx, cy, kind){
  const world = $('#walkWorld');
  if(!world) return;
  const T = WALK_T;
  for(let i = 0; i < 3; i++){
    const r = document.createElement('div');
    r.className = 'inv-wave inv-wave-' + (kind || 'violet');
    r.style.cssText = `left:${cx * T}px;top:${cy * T}px;width:${T}px;height:${T}px;margin:${-T / 2}px 0 0 ${-T / 2}px;animation-delay:${i * 160 * SCENE_SPEED}ms;animation-duration:${900 * SCENE_SPEED}ms;`;
    world.appendChild(r);
    setTimeout(()=> r.remove(), (1200 + i * 160) * SCENE_SPEED);
  }
}
/* her pink light: waves going out across the whole screen from her, and glitter everywhere */
function invGlitterBurst(fromId){
  invCss();
  const src = document.getElementById(fromId);
  const r = src ? src.getBoundingClientRect() : { left:innerWidth / 2, top:innerHeight / 2, width:0, height:0 };
  const cx = r.left + r.width / 2, cy = r.top + r.height * 0.55;
  const ov = document.createElement('div');
  ov.className = 'inv-glitter';
  ov.style.setProperty('--gx', cx + 'px'); ov.style.setProperty('--gy', cy + 'px');
  for(let i = 0; i < 5; i++){
    const ring = document.createElement('i');
    ring.className = 'ig-ring';
    ring.style.cssText = `left:${cx}px;top:${cy}px;animation-delay:${i * 320 * SCENE_SPEED}ms;animation-duration:${1900 * SCENE_SPEED}ms;`;
    ov.appendChild(ring);
  }
  for(let i = 0; i < 90; i++){
    const s = document.createElement('b');
    s.className = 'ig-spark';
    s.style.cssText = `left:${Math.random() * 100}vw;top:${Math.random() * 100}vh;--sz:${6 + Math.random() * 13}px;animation-delay:${Math.random() * 1500 * SCENE_SPEED}ms;animation-duration:${(1300 + Math.random() * 900) * SCENE_SPEED}ms;`;
    ov.appendChild(s);
  }
  document.body.appendChild(ov);
  try { playSfx('stone_veryhigh'); } catch(e){}
  setTimeout(()=> ov.classList.add('out'), 2700 * SCENE_SPEED);
  setTimeout(()=> ov.remove(), 3600 * SCENE_SPEED);
  return sceneWait(2900);
}

let _invCss = false;
function invCss(){
  if(_invCss || typeof document === 'undefined') return;
  _invCss = true;
  const s = document.createElement('style');
  s.id = 'invCss';
  s.textContent = `
  .walk-ent.inv-band{ overflow:visible; }
  .walk-ent.inv-band .war-fig{ animation:invIdle 1.6s ease-in-out infinite; filter:drop-shadow(0 0 6px rgba(220,30,40,.85)); }
  .walk-ent.inv-band-commander .war-fig{ filter:drop-shadow(0 0 9px rgba(170,40,230,.9)); }
  .walk-ent.inv-band.inv-alerted::after{ content:'!'; position:absolute; left:50%; top:-62%; translate:-50% 0; font:900 26px/1 'Baloo 2', system-ui, sans-serif; color:#ffe14a;
    -webkit-text-stroke:2px #5a2600; text-shadow:0 2px 0 #5a2600; animation:invBang .45s ease-out both; }
  @keyframes invBang{ 0%{ transform:scale(.3); opacity:0; } 60%{ transform:scale(1.25); opacity:1; } 100%{ transform:scale(1); } }
  @keyframes invIdle{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-3px); } }
  .walk-ent.inv-clash-alien.inv-fleeing{ transition:opacity .7s ease, transform .7s ease; opacity:0 !important; }
  .walk-ent.inv-king-fight .ca-art{ filter:drop-shadow(0 0 10px rgba(190,120,255,.95)) drop-shadow(0 0 3px #fff); animation:invRegal 2.4s ease-in-out infinite; }
  @keyframes invRegal{ 0%,100%{ filter:drop-shadow(0 0 6px rgba(190,120,255,.8)); } 50%{ filter:drop-shadow(0 0 16px rgba(210,150,255,1)) drop-shadow(0 0 4px #fff); } }
  .walk-ent.inv-king-down .ca-art{ rotate:90deg; translate:0 18%; filter:drop-shadow(0 0 10px rgba(255,150,210,.9)); }
  .walk-ent.inv-princess-glow .ca-art, .scene-actor.inv-princess-glow img{ filter:drop-shadow(0 0 10px rgba(255,140,205,.95)) drop-shadow(0 0 3px #fff); }
  .walk-ent.inv-wadjet .jg-art{ filter:drop-shadow(0 0 10px rgba(90,230,120,.75)) drop-shadow(0 0 4px #000); animation:invIdle 2s ease-in-out infinite; }
  .walk-ent.inv-clash-knight.inv-healed .war-fig{ filter:drop-shadow(0 0 8px rgba(255,150,210,.95)); }
  .walk-ent.inv-follow .ca-art{ filter:drop-shadow(0 0 4px rgba(255,255,255,.7)); }
  .scene-actor.inv-hurt img{ filter:grayscale(.55) brightness(.75) drop-shadow(0 0 8px rgba(40,0,60,.9)); transition:filter .6s; }
  .scene-actor.inv-hurt.inv-holding img{ filter:grayscale(.25) brightness(.9) drop-shadow(0 0 12px rgba(255,140,205,.95)); }
  .inv-ufo{ position:absolute; pointer-events:none; transition:transform 1.7s cubic-bezier(.2,.75,.25,1), opacity 1.7s ease; }
  .inv-ufo.inv-ufo-high{ transform:translateY(-1400%) scale(.55); opacity:.0; }
  .inv-ufo.inv-ufo-off{ transform:translate(140%,-1600%) scale(.4) rotate(-12deg); opacity:0; transition:transform 1.6s ease-in, opacity 1.6s ease-in; }
  .inv-ufo-body{ position:absolute; inset:0; animation:invHover 2.6s ease-in-out infinite; }
  .inv-ufo-art{ width:100%; height:100%; display:block; filter:drop-shadow(0 6px 6px rgba(0,0,0,.35)); }
  .inv-ufo-shadow{ position:absolute; left:18%; width:64%; height:18%; border-radius:50%; background:radial-gradient(closest-side, rgba(0,0,0,.35), rgba(0,0,0,0)); animation:invShadow 2.6s ease-in-out infinite; }
  .inv-ufo-beam{ position:absolute; left:22%; width:56%; top:88%; opacity:0; transition:opacity .45s ease; clip-path:polygon(32% 0, 68% 0, 100% 100%, 0 100%);
    background:linear-gradient(to bottom, rgba(200,255,220,.85), rgba(150,255,200,.35) 70%, rgba(150,255,200,.05)); }
  .inv-ufo.inv-ufo-beaming .inv-ufo-beam{ opacity:1; }
  .inv-ufo .iu-light{ fill:#ffe46b; animation:invBlink 1.2s steps(2) infinite; }
  .inv-ufo .iu-l1{ fill:#ff6b8a; animation-delay:-.4s; } .inv-ufo .iu-l2{ fill:#7ef0ff; animation-delay:-.8s; }
  .inv-ufo .iu-core{ animation:invCore 1.4s ease-in-out infinite; }
  @keyframes invHover{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6%); } }
  @keyframes invShadow{ 0%,100%{ transform:scale(1); opacity:.9; } 50%{ transform:scale(.88); opacity:.7; } }
  @keyframes invBlink{ 0%{ opacity:1; } 100%{ opacity:.25; } }
  @keyframes invCore{ 0%,100%{ opacity:.65; } 50%{ opacity:1; } }
  .inv-smoke{ position:absolute; width:0; height:0; pointer-events:none; transition:opacity 1.5s ease; }
  .inv-smoke.inv-smoke-out{ opacity:0; }
  .inv-smoke i{ position:absolute; left:calc(var(--sm) * -.45); top:calc(var(--sm) * -.45); width:calc(var(--sm) * .9); height:calc(var(--sm) * .9); border-radius:50%;
    background:radial-gradient(circle at 40% 35%, rgba(128,124,128,.92), rgba(62,58,64,.78) 58%, rgba(50,46,52,0) 72%); animation:invPuff 4.2s ease-out infinite; }
  .inv-smoke i:nth-child(2){ animation-delay:-.7s; } .inv-smoke i:nth-child(3){ animation-delay:-1.4s; } .inv-smoke i:nth-child(4){ animation-delay:-2.1s; } .inv-smoke i:nth-child(5){ animation-delay:-2.8s; } .inv-smoke i:nth-child(6){ animation-delay:-3.5s; }
  .inv-smoke b{ position:absolute; left:calc(var(--sm) * -.22); top:calc(var(--sm) * -.12); width:calc(var(--sm) * .44); height:calc(var(--sm) * .3); border-radius:50% 50% 40% 40%;
    background:radial-gradient(closest-side, rgba(255,210,90,.95), rgba(255,120,40,.7) 55%, rgba(255,90,30,0)); animation:invFlame .5s ease-in-out infinite alternate; }
  @keyframes invFlame{ from{ transform:scale(.85, .8); opacity:.75; } to{ transform:scale(1.1, 1.25) translateY(-8%); opacity:1; } }
  body.inv-scene #backBtn, body.inv-scene #walkParty{ visibility:hidden; }
  @keyframes invPuff{ 0%{ transform:translate(0,0) scale(.45); opacity:0; } 12%{ opacity:.95; } 100%{ transform:translate(calc(var(--sm) * .9), calc(var(--sm) * -4.2)) scale(2.7); opacity:0; } }
  .inv-rift{ position:absolute; pointer-events:none; filter:drop-shadow(0 0 10px rgba(190,90,255,.9)); animation:invRiftPulse 1.8s ease-in-out infinite; transition:transform .9s ease, opacity .9s ease; }
  .inv-rift svg{ width:100%; height:100%; display:block; overflow:visible; }
  .inv-rift .ir-edge{ stroke:#e6b3ff; stroke-width:2.5; stroke-linejoin:round; }
  .inv-rift .ir-swirl{ transform-origin:50px 63px; animation:invSwirl 2.6s linear infinite; }
  .inv-rift .ir-glow{ animation:invRiftGlow 1.8s ease-in-out infinite; transform-origin:50px 62px; }
  .inv-rift .ir-motes circle{ fill:#f3d2ff; animation:invMote 2.4s ease-out infinite; }
  .inv-rift .ir-motes circle:nth-child(2){ animation-delay:-.6s; } .inv-rift .ir-motes circle:nth-child(3){ animation-delay:-1.2s; } .inv-rift .ir-motes circle:nth-child(4){ animation-delay:-1.8s; }
  @keyframes invRiftGlow{ 0%,100%{ transform:scale(1); opacity:.3; } 50%{ transform:scale(1.12, 1.05); opacity:.55; } }
  @keyframes invMote{ 0%{ transform:translate(0,0); opacity:0; } 20%{ opacity:1; } 100%{ transform:translate(0,-14px); opacity:0; } }
  .inv-rift.small{ transform:scale(.45); }
  @keyframes invRiftPulse{ 0%,100%{ filter:drop-shadow(0 0 7px rgba(190,90,255,.75)); } 50%{ filter:drop-shadow(0 0 16px rgba(220,130,255,1)); } }
  @keyframes invSwirl{ to{ transform:rotate(360deg); } }
  .inv-stake{ position:absolute; pointer-events:none; }
  .inv-stake svg{ width:100%; height:100%; display:block; }
  .inv-penned{ position:absolute; pointer-events:none; animation:invPush 1.1s ease-in-out infinite; filter:drop-shadow(0 0 5px rgba(220,30,40,.8)); }
  .inv-penned img{ width:100%; height:100%; object-fit:contain; }
  @keyframes invPush{ 0%,100%{ transform:translateY(0) rotate(-2deg); } 50%{ transform:translateY(5%) rotate(3deg); } }
  .inv-beam{ position:absolute; transform-origin:0 50%; pointer-events:none; z-index:70; border-radius:999px;
    background:linear-gradient(to bottom, rgba(150,40,200,0), rgba(120,30,170,.9) 24%, #07020b 42%, #000 50%, #07020b 58%, rgba(120,30,170,.9) 76%, rgba(150,40,200,0));
    box-shadow:0 0 18px 6px rgba(130,40,190,.75); animation:invBeamGo .9s ease-out both; }
  @keyframes invBeamGo{ 0%{ clip-path:inset(0 100% 0 0); opacity:1; } 28%{ clip-path:inset(0 0 0 0); } 75%{ opacity:1; } 100%{ opacity:0; } }
  .inv-wave{ position:absolute; border-radius:50%; pointer-events:none; z-index:69; animation:invWaveGo .9s ease-out both; }
  .inv-wave-violet{ border:5px solid rgba(205,150,255,.95); box-shadow:0 0 18px rgba(190,120,255,.9), inset 0 0 12px rgba(230,200,255,.8); }
  @keyframes invWaveGo{ 0%{ transform:scale(.3); opacity:1; } 100%{ transform:scale(9); opacity:0; } }
  .inv-glitter{ position:fixed; inset:0; pointer-events:none; z-index:92; overflow:hidden; transition:opacity .9s ease;
    background:radial-gradient(circle at var(--gx) var(--gy), rgba(255,175,220,.42), rgba(255,175,220,.12) 45%, rgba(255,175,220,0) 75%); }
  .inv-glitter.out{ opacity:0; }
  .inv-glitter .ig-ring{ position:absolute; width:46px; height:46px; margin:-23px 0 0 -23px; border-radius:50%; border:6px solid rgba(255,140,205,.9);
    box-shadow:0 0 26px rgba(255,150,210,.95), inset 0 0 18px rgba(255,205,232,.85); animation:igRing 1.9s ease-out both; }
  @keyframes igRing{ 0%{ transform:scale(.2); opacity:1; } 100%{ transform:scale(48); opacity:0; } }
  .inv-glitter .ig-spark{ position:absolute; width:var(--sz); height:var(--sz); background:#ffe0f2;
    clip-path:polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%); filter:drop-shadow(0 0 4px #ff8fcf); animation:igSpark 1.6s ease-in-out both; }
  @keyframes igSpark{ 0%{ opacity:0; transform:scale(.2) rotate(0deg); } 40%{ opacity:1; transform:scale(1.25) rotate(45deg); } 100%{ opacity:0; transform:translateY(-34px) scale(.4) rotate(90deg); } }
  @media (prefers-reduced-motion: reduce){ .inv-glitter .ig-spark, .inv-smoke i, .inv-ufo-body, .inv-rift .ir-swirl, .inv-penned{ animation-duration:6s; } }
  `;
  document.head.appendChild(s);
}
