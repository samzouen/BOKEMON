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
     escort  she follows at your heels; (4.31) down from the tower, the horns:
             the four tribes march in at the south gate and drive the aliens
             out of the market (invTribesEarly); then the King's cry from the
             great hall, and Lucesco: run! Into the hall (invClimax): the King
             struck down by Wadjet's Prismatic Laser, Wadjet gathering another,
             his two shadows fighting the Advisor and the Dauphin; her courage,
             her evolution, her pink light — the shadows burn away, the King
             holds on, she stays at his side — and Wadjet turns on you
             (34-nemesis.js: survive ten turns)
     wadjet  his fight lost or left: he waits in the hall, she heals you
     chase   (4.31) he slips away into the past: Lucesco's nose, out of the
             palace and across the grounds to the north wall; Wadjet opening a
             rift and gone through it; aliens pouring out of it the other way,
             a commander's army to beat; more behind them — the Royal Commander
             and his soldiers come up behind you, drive them back, thank you
             for finding their way in, and put a perimeter round it; back to
             the King (invAfterNem, invRiftChaseRun, invRiftHoldRun). A save
             from before 4.31 that beat the old six waves keeps the old chase:
             the race to the crack, the smoke, the tribes (invChaseRun,
             invTribesRun).
     done    the great hall: the King awake again, Lucesco's whiff of the land
             Wadjet went to — a land in the past — the King's promise to follow
             you there, the Advisor's "convalesce!", and the princess goes in
             his place (invFinaleNem; before 4.31, invFinaleRun); then the rift's
             perimeter (r6_perimeter), a third of the jungle's aliens, a wild one
             now and then on its paths

   (4.31) The designer: "The fight with wadjet comes when he appears suddenly and ambushes the fairy king, a member of
   the cosmic council, with a laser. The plan is to stop the fairy king's forces from rallying against nemesis. But the
   princess will be the king's representative and fulfilment of the promise to aid the player after the aliens were
   dealt with. The fight happens immediately after he fires the prismatic laser at the fairy king. If he flees, the
   player chases him to the rift using Lucesco's nose. They will find him opening a rift and porting through. Lucesco
   will attempt to follow him through but alien commanders and captains will come out and attack the player. After the
   player defeats the commander, Lucesco will remark that there are too many aliens to fight and that the player needs
   to escape before being surrounded. However, The king's forces led by the royal army commander will appear behind
   Lucesco and take on the aliens. The army commander will thank the player for finding the rift of the aliens and
   declare that the forces will set up a perimeter. The player is encouraged to return to the king to aid him. The chase
   ends there without further fighting. After the king recovers, Lucesco will reveal that the chase wasn't fruitless.
   He caught a whiff of the land that wadjet had ported to, a land in the past, and the king will remark that he will
   fulfil his promise and follow the player there. However, the advisor will demand that the king convalesces and the
   princess will volunteer to be the player's help, much to the surprise and delight of the royal family, who had been
   trying to get her out of her timidity" — "Tribes march in before the chase because they help the castle to defend
   against the alien onslaught before the king cries out in the palace and the player is told by Lucesco to rush to
   him, discovering wadjet's assassination attempt. Wadjet would have fired a laser but will be charging another. His
   two shadows will be engaged with the advisor and dauphin in a fight. This is where the princess evolves and dispels
   the shadows and heals her father. Wadjet then turns his attention to the player. The princess doesn't join him in
   the fight, she rushes to help her father."

   (4.33) The designer: "The princess is with the player when the king is hit with the laser because of an earlier
   storyline. I messed it up a bit. Can we follow this progression?" — and "Wadjet escapes into the northern edge of the
   map, not the castle wall". The story from the last unsealing on, told that way (36-the-return.js; `v433` in the
   save), the stages:
     arrive  word at the last village: back to the castle, swiftly; at its gate the soldiers already fighting, a
             Chestnut Knight's report (flying cocoons, down inside the walls); the King runs in, you at his heels; by
             the fountain the Commander and his soldiers, two on every alien, the Commander against an alien commander
             and its captain, the townsfolk running; the princess still in the palace with the Dauphin and the Advisor;
             the King, spent, cannot leave his people — he asks you to bring her out (one scene, nothing else to be
             done while it plays; left part-way, it begins again from the gate)
     palace  in the hall the Dauphin against an alien commander, the Advisor against its captain, sending you on;
             three aliens down the east corridor, the last at the stair
     tower   upstairs an alien, a captain's band, and a commander's army at her door
     escort  she follows you down; in the hall the Dauphin and the Advisor come with you; out of the palace — the
             tribes' horns, and they drive the aliens out of the castle; to the King by the fountain — and Wadjet strikes
             him down; his shadows at the Dauphin and the Advisor; her courage; Wadjet turns on you
     wadjet  his fight lost or left: he waits by the fountain
     chase   he slips away: Lucesco's nose, out of the castle and through the jungle to its north edge; his rift; the
             army out of it; the Commander's soldiers; the perimeter, there
     done    the finale in the great hall; the perimeter at the jungle's north edge, half the jungle's aliens
   A save part-way into the old invasion (the alarm said, up to the princess at your heels) begins it again this way, from
   the gate (invMigrate). Wadjet's fight, lost to, in the hall, and what comes after it, stay as they were told.
   ============================================================ */
const INV = { lv:175, wadjetLv:200, princessLv:100, alienLv:170 };
const INV_ORDER = ['muster', 'market', 'arrive', 'palace', 'tower', 'escort', 'wadjet', 'chase', 'done'];

/* ---------- the save: r6().inv ----------
   stage, won{} (each band of the invasion, for good), said{} (each scene
   once), grown (she has evolved), joined (she is one of yours), (4.31) nem
   (the story told the 4.31 way: Wadjet's laser, his ten turns, the rift). */
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
  invMigrate(v);
  if(v.stage && INV_ORDER.includes(v.stage)) return v.stage;
  return questState().stage === 'end' ? 'muster' : null;
}
/* (4.33) told the designer's new way (36-the-return.js) */
function invNew(){ return invOn() && !!invState().v433; }
/* a save part-way into the old invasion — the alarm said, and anywhere up to the princess at your heels — begins it
   again the new way, from the castle gate (what it had won in the old way is the old way's) */
const INV_OLD_START = ['muster', 'market', 'palace', 'tower', 'escort'];
function invMigrate(v){
  if(v.v433 || typeof invArriveRun !== 'function') return;
  const st = v.stage && INV_ORDER.includes(v.stage) ? v.stage : (questState().stage === 'end' ? 'muster' : null);
  if(!st || !INV_OLD_START.includes(st)) return;
  v.stage = 'arrive'; v.v433 = true; v.won = {}; v.said = {};
  delete v.nem; delete v.grown;
  saveProfile();
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
/* the invasion's bands, by the deck they hold; each beaten for good. (4.33) The designer: "Player battles 3 aliens
   along the right perimeter and 3 on the second floor" — asked which: "3 singles below, 1 single, 1 captain, 1
   commander above". Down the palace's east corridor three aliens, the last at the stair; upstairs an alien, a captain's
   band, and a commander's army at her door. (Until 4.33: three captains' bands in the market, two in the palace, the
   commander's army at her door.) */
const INV_BANDS = {
  r6_palace:[ { id:'inv-q1', x:34, y:23, rank:'alien' }, { id:'inv-q2', x:32, y:13, rank:'alien' }, { id:'inv-q3', x:35, y:7, rank:'alien', guards:'stair' } ],
  r6_tower: [ { id:'inv-u1', x:11, y:13, rank:'alien' }, { id:'inv-u2', x:8, y:14, rank:'captain' }, { id:'inv-t1', x:6, y:12, rank:'commander', guards:'door' } ],
};
const INV_BAND_STAGE = { r6_palace:'palace', r6_tower:'tower' };
function invBandsOf(key){
  const list = INV_BANDS[key] || [];
  list.forEach(b=>{
    if(b.aliens) return;
    const R = jgRng((JG.seed ^ jgDaySeed(b.id)) >>> 0), ri = n=> Math.floor(R() * n);
    b.aliens = [];
    if(b.rank === 'alien') b.aliens.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]);   // (4.33) one alien and its captives
    else {
      for(let i = 0; i < (b.rank === 'commander' ? 4 : 2); i++) b.aliens.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]);
      b.aliens.push(JG_CAPTAIN);
      if(b.rank === 'commander') b.aliens.push(JG_COMMANDER);
    }
    b.lead = b.aliens[b.aliens.length - 1];
    b.lv = INV.lv; b.deck = key; b.inv = true;
  });
  return list;
}
/* every band of a deck beaten */
function invDeckCleared(key){ return invBandsOf(key).every(b=> invState().won[b.id]); }
function invBandUp(b){
  if(b.perim) return invAfter() && !invPerimBeaten(b);
  if(b.riftBand) return invAt('chase') && !!invState().nem && invSaid('riftOut') && !invState().won[b.id];
  return invAt(INV_BAND_STAGE[b.deck]) && !invState().won[b.id];
}
/* (4.31) the army that comes out of the rift after Wadjet has gone through it: a commander's (as the tower's), at the
   foot of the crack in the north wall until it is beaten */
const INV_RIFT_BAND = { id:'inv-r1', x:49, y:3, rank:'commander', riftBand:true };
function invRiftBand(){
  const b = INV_RIFT_BAND;
  if(!b.aliens){
    const R = jgRng((JG.seed ^ jgDaySeed(b.id)) >>> 0), ri = n=> Math.floor(R() * n);
    b.aliens = [];
    for(let i = 0; i < 4; i++) b.aliens.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]);
    b.aliens.push(JG_CAPTAIN, JG_COMMANDER);
    b.lead = JG_COMMANDER;
    b.lv = INV.lv; b.deck = CA_KEY; b.inv = true;
  }
  return b;
}
/* (4.31) the tribes have marched in (invTribesEarly): the market is theirs and the castle's again */
function invRouted(){ return !!ui.invRouted || invSaid('tribes'); }
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
/* (4.31) where each tribe's ancestor stands in the market once they have driven the aliens out */
const INV_TRIBE_POST = { grass:[27, 44], water:[30, 45], earth:[34, 45], fire:[37, 44] };
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
const invFighting = ()=> invAt('market', 'arrive', 'palace', 'tower', 'escort', 'wadjet', 'chase');
/* (4.33) the grounds as the designer's new way has them: "Commander and soldiers are fighting in the open castle area,
   near the fountain, citizens are running in terror, and soldiers are engaged, 2 per alien. Commander facing 1 alien
   commander and 1 alien captain." The King waits on the path before the palace, the fountain at his back, his eyes on
   its doors; the cocoons they came down in lie split open about the market. */
const INV_FOUNT = {
  king:{ x:31, y:30 }, you:{ x:31, y:26 },
  cmd:{ x:25, y:33 }, foes:[['alien_commander_octopus', 22, 32], ['alien_captain_humanoid', 22, 34]],
  pins:[['alien_insect_physical', 39, 33, 'chestnut_knight2', 'duck_knight2'], ['alien_golem_ground', 40, 39, 'bug_knight1', 'chestnut_knight2'],
        ['alien_flower_grass', 23, 39, 'duck_knight2', 'bug_knight1'], ['alien_robot_steel', 44, 46, 'chestnut_knight2', 'chestnut_knight2']],
  cocoons:[[20.5, 33.8], [43.5, 33.8], [24.5, 45.6], [38.5, 45.6]],
  /* the strike: Wadjet out of nothing at the fountain's rim, right behind the King; she at his side, the Dauphin and the
     Advisor either side */
  wadjet:{ x:31, y:32 }, prin:{ x:32, y:29 }, dau:{ x:34, y:28 }, adv:{ x:28, y:28 },
};
const knightName = ks=> ks === 'duck_knight2' ? 'Duck Knight' : ks === 'bug_knight1' ? 'Bug Knight' : 'Chestnut Knight';
function invGroundsThings(T){
  const NEW = ()=> invNew();
  /* ---- (4.33) ---- */
  const held = ()=> NEW() && invAt('palace', 'tower', 'escort') && !invRouted();       // the aliens, till the tribes come
  const posted = ()=> NEW() && invAt('palace', 'tower', 'escort') && !invSaid('walls');  // the knights, till the Commander sends them to the walls
  const F = INV_FOUNT;
  F.pins.forEach(([al, ax, ay, k1, k2])=>{
    T({ x:ax, y:ay, still:true, cls:'ca-npc war-alien inv-clash-alien inv-pinned', invAlien:true,
        html:()=> `<div class="war-fig">${jgMonImg(al, WALK_T * 1.5, false)}</div>` + warSlashHtml(-2, 0) + warSlashHtml(2, 0),
        verb:'Look', sub:(SPECIES[al] || {}).name || 'An alien', when:held, act:()=> caLines([`Two knights have it pinned between them, blade and shield. There's no getting in there!`]) });
    [[k1, ax - 2, true], [k2, ax + 2, false]].forEach(([ks, kx, faceR])=>
      T({ x:kx, y:ay, still:true, cls:'ca-npc war-knight inv-clash-knight', invKnight:true,
          html:()=> `<div class="war-fig">${caMonImg(ks, WALK_T * 1.45, faceR)}</div>`,
          verb:'Talk', sub:knightName(ks), when:posted, act:()=> invKnightTalk() }));
  });
  /* the Commander, an alien commander and its captain on him at once */
  F.foes.forEach(([al, ax, ay])=>{
    T({ x:ax, y:ay, still:true, cls:'ca-npc war-alien inv-clash-alien', invAlien:true,
        html:()=> `<div class="war-fig">${jgMonImg(al, WALK_T * (al === JG_COMMANDER ? 1.9 : 1.7), true)}</div>` + warSlashHtml(F.cmd.x - ax, F.cmd.y - ay),
        verb:'Look', sub:al === JG_COMMANDER ? 'Commander Octopus' : 'Captain Humanoid', when:held, act:()=> invCommanderFightTalk() });
  });
  T({ x:F.cmd.x, y:F.cmd.y, still:true, cls:'ca-npc war-knight inv-commander-fight', who:null,
      html:()=> `<div class="war-fig">${caMonImg('chestnut_knight2_c', WALK_T * 1.6, false)}</div>`,
      verb:'Talk', sub:'The Royal Commander', when:posted, act:()=> invCommanderFightTalk() });
  /* the King, waiting for his daughter */
  T({ x:F.king.x, y:F.king.y, still:true, cls:'ca-npc inv-king-wait', who:null,
      html:()=> caMonImg('fairy_king_c', WALK_T * 1.75, false, CA_WHO.king.icon, 'back'),
      verb:'Talk', sub:'The Fairy King', mark:()=> invAt('escort') && invRouted(),
      when:()=> NEW() && invAt('palace', 'tower', 'escort') && !ui.invClimax, act:()=> invKingFountTalk() });
  /* his fight lost or left: Wadjet on the fountain's rim; the King on the path, she beside him, the Dauphin and the
     Advisor standing guard */
  const waiting = ()=> NEW() && invAt('wadjet') && !ui.invClimax;
  T({ x:F.wadjet.x, y:F.wadjet.y, still:true, cls:'ca-npc inv-wadjet', html:()=> jgMonImg(WADJET + '_front', WALK_T * 2.3, false),
      verb:'Fight', sub:'Wadjet', when:waiting, mark:()=> true, act:()=> invWadjetChallenge() });
  T({ x:F.king.x, y:F.king.y, still:true, cls:'ca-npc inv-king-down', who:null, html:()=> caMonImg('fairy_king_c', WALK_T * 1.75, false, CA_WHO.king.icon),
      verb:'Look', sub:'The Fairy King', when:waiting, act:()=> caLines([`The King lies on the path before his palace. A soft pink light still glows around him: he is holding on.`]) });
  T({ x:F.prin.x, y:F.prin.y, still:true, cls:'ca-npc inv-princess-glow', who:null, html:()=> caMonImg('fairy_princess1', WALK_T * 1.5, false),
      verb:'Talk', sub:'The Little Princess', when:waiting, act:()=> invPrincessHeal() });
  T({ x:F.adv.x, y:F.adv.y, still:true, cls:'ca-npc', who:null, html:()=> caMonImg('fairybird1_c', WALK_T * 1.35, true),
      verb:'Talk', sub:'The Royal Advisor', when:waiting, act:()=> caLines([['advisor', caTurn('invAdvisorWatch', INV_LINES.advisorWatch)]]) });
  T({ x:F.dau.x, y:F.dau.y, still:true, cls:'ca-npc', who:null, html:()=> caMonImg('fairy_dauphin2', WALK_T * 1.55, false),
      verb:'Talk', sub:'The Dauphin', when:waiting, act:()=> caLines([['dauphin', caTurn('invDauphinWatch', INV_LINES.dauphinWatch)]]) });

  /* ---- the old way (a save from 4.31 at Wadjet's fight in the hall) ---- */
  const OLD = ()=> !NEW();
  invClashThings(T, INV_CLASH.r6_castle, ()=> OLD() && invFighting() && !invRouted(), { knightWhen:()=> OLD() && invFighting() });
  /* the Commander at the fountain, holding an alien commander (till the tribes come; then, (4.31), till he takes his
     soldiers to the north wall after you) */
  T({ x:32, y:33, still:true, cls:'ca-npc war-alien inv-clash-alien', invAlien:true,
      html:()=> `<div class="war-fig">${jgMonImg(JG_COMMANDER, WALK_T * 1.9, true)}</div>` + warSlashHtml(-3, 0),
      verb:'Look', sub:'Commander Octopus', when:()=> OLD() && invFighting() && !invRouted(), act:()=> invCommanderFightTalk() });
  T({ x:29, y:33, still:true, faceR:true, cls:'ca-npc war-knight inv-commander-fight', who:null,
      html:()=> `<div class="war-fig">${caMonImg('chestnut_knight2_c', WALK_T * 1.6, true)}</div>`,
      verb:'Talk', sub:'The Royal Commander', when:()=> OLD() && invFighting() && !invSaid('riftOut') && !invSaid('fled'), act:()=> invCommanderFightTalk() });
  /* (4.31) the tribes, once they have marched in: their ancestors in the market, till the castle is saved ((4.33) they
     go after the aliens) */
  JG_TRIBE_KEYS.forEach(k=>{
    const [x, y] = INV_TRIBE_POST[k];
    T({ x, y, still:true, cls:'ca-npc inv-tribe-post',
        html:()=> `<div class="war-fig">${jgMonImg(`tribal_ancestor_${k}_front`, WALK_T * 2, x < 32)}</div>`,
        verb:'Talk', sub:JG_TRIBES[k].short + ' Ancestor', when:()=> OLD() && invSaid('tribes') && invActive(),
        act:()=> caLines([['a_' + k, INV_LINES.tribePost[k]]]) });
  });
  /* (4.33) the rift's perimeter is at the jungle's north edge now (36-the-return.js): none on the grounds */
}
function invPalaceThings(T){
  const NEW = ()=> invNew();
  /* ---- (4.33) the Dauphin against an alien commander, the Advisor against its captain, in the hall ---- */
  const hold = ()=> NEW() && invAt('palace', 'tower') && !ui.invClimax;
  [['fairy_dauphin2', 17, 9, 1.55, 'dauphin', 'The Dauphin', JG_COMMANDER, 14, 9, 1.9, 'Commander Octopus'],
   ['fairybird1_c', 22, 9, 1.35, 'advisor', 'The Royal Advisor', JG_CAPTAIN, 25, 9, 1.7, 'Captain Humanoid']].forEach(([sp, x, y, sz, who, nm, al, ax, ay, asz, anm])=>{
    T({ x:ax, y:ay, still:true, cls:'ca-npc war-alien inv-clash-alien', invAlien:true,
        html:()=> `<div class="war-fig">${jgMonImg(al, WALK_T * asz, x > ax)}</div>` + warSlashHtml(x - ax, 0),
        verb:'Look', sub:anm, when:hold, act:()=> caLines([['lion', `<b>"Leave that one to ${who === 'dauphin' ? 'the Dauphin' : 'the Advisor'}! The princess first!"</b>`]]) });
    T({ x, y, still:true, cls:'ca-npc war-knight', who:null, faceR:x < ax,
        html:()=> `<div class="war-fig">${caMonImg(sp, WALK_T * sz, x < ax)}</div>`,
        verb:'Talk', sub:nm, when:hold, act:()=> caLines([[who, caTurn('inv433' + who, INV_LINES[who + 'Hold'])]]) });
  });
  /* ---- the old way: the King on his dais, holding them off; the Dauphin and the Advisor beside him ---- */
  const inHall = ()=> !NEW() && invAt('palace', 'tower', 'escort') && !ui.invClimax && !invSaid('cry');   // (4.31) till his cry: then Wadjet's in there
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
  invClashThings(T, INV_CLASH.r6_palace, ()=> invAt('palace', 'tower') || (invAt('escort') && !NEW()));
  invBandsOf('r6_palace').forEach(b=> T(invBandThing(b, ()=> invBandUp(b))));
  /* Wadjet, waiting: his fight lost or left. The King lies on his dais, his daughter beside him — (4.31) and after
     Wadjet has gone, while you chase him, still; the Dauphin and the Advisor standing guard over him. ((4.33) The new
     way, Wadjet waits by the fountain; while you chase him, the King lies here in the hall.) */
  const waiting = ()=> !NEW() && invAt('wadjet') && !ui.invClimax;
  const watch = ()=> ((invAt('wadjet') && !NEW()) || (invAt('chase') && !!invState().nem)) && !ui.invClimax;
  T({ x:19, y:10, still:true, cls:'ca-npc inv-wadjet', html:()=> jgMonImg(WADJET + '_front', WALK_T * 2.3, false),
      verb:'Fight', sub:'Wadjet', when:waiting, mark:()=> true, act:()=> invWadjetChallenge() });
  T({ x:19, y:3, w:2, still:true, cls:'ca-npc inv-king-down', html:()=> caMonImg('fairy_king_c', WALK_T * 1.75, false, CA_WHO.king.icon),
      verb:'Look', sub:'The Fairy King', when:watch, act:()=> caLines([`The King lies still on the dais. A soft pink light still glows around him: he is holding on.`]) });
  T({ x:22, y:4, still:true, cls:'ca-npc inv-princess-glow', html:()=> caMonImg('fairy_princess1', WALK_T * 1.5, false),
      verb:'Talk', sub:'The Little Princess', when:watch, act:()=> invPrincessHeal() });
  T({ x:17, y:5, still:true, cls:'ca-npc', html:()=> caMonImg('fairybird1_c', WALK_T * 1.35, true),
      verb:'Talk', sub:'The Royal Advisor', when:()=> watch() && !!invState().nem, act:()=> caLines([['advisor', caTurn('invAdvisorWatch', INV_LINES.advisorWatch)]]) });
  T({ x:23, y:6, still:true, cls:'ca-npc', html:()=> caMonImg('fairy_dauphin2', WALK_T * 1.55, false),
      verb:'Talk', sub:'The Dauphin', when:()=> watch() && !!invState().nem, act:()=> caLines([['dauphin', invAt('chase') ? INV_LINES.dauphinChase : caTurn('invDauphinWatch', INV_LINES.dauphinWatch)]]) });
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
      `<br><br><i>Rest here to heal your team, then go back out. ${perim ? 'The perimeter is at the jungle\'s northern edge.' : 'The bands you have beaten stay beaten.'}</i>`,
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
  const b = [].concat(...Object.keys(INV_BANDS).map(k=> invBandsOf(k)), invPerimBands(), [invRiftBand()]).find(x=> x.id === id);
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
  perimSoldier:[`<b>"Nothing gets out of that compound on my watch."</b>`, `<b>"They keep crawling out of that rift. Fewer every day, mind you."</b>`, `<b>"Going in? Watch yourselves. Some of the big ones come through, now and then."</b>`],
  /* (4.31) the tribes in the market; the Dauphin and the Advisor watching over the King */
  tribePost:{
    grass:`<b>"Ha! Did you see them run? Tag — they're it!"</b>`,
    water:`<b>"The tribes keep their word. Go to your King, friends. The market is ours to hold."</b>`,
    earth:`<b>"…Stone… stands… here."</b>`,
    fire:`<b>"Two hundred years in a blade, and the first thing I do when I'm out is save HIS castle. Don't tell anyone."</b>` },
  advisorWatch:[`<b>"Hoo… he can turn back time, they say. Then don't try to beat him: outlast him! Even a cobra tires."</b>`,
                `<b>"Hoo! The princess hasn't let go of His Majesty's hand once. Not once!"</b>`],
  dauphinWatch:[`<b>"We'll guard Father. That snake is yours — and don't let it fool you, it's only playing for time."</b>`,
                `<b>"My little sister… did you SEE her? All these years I thought she was afraid of everything."</b>`],
  dauphinChase:`<b>"Go on — Lucesco's nose knows the way. We'll keep watch over Father."</b>`,
  /* (4.33) the new way: in the hall, the Dauphin and the Advisor sending you on; by the fountain, the King and the Commander */
  dauphinHold:[`<b>"She's up in her room! The stair's at the end of the east corridor — go, I've got this one!"</b>`,
               `<b>"Don't look at me, look at the STAIR! My little sister first!"</b>`],
  advisorHold:[`<b>"Hoo! Through the east door, then all the way up the corridor to the stair! Mind the ones in the corridor!"</b>`,
               `<b>"Patience and cleverness, they said. Nobody said anything about tentacles! HOO!"</b>`],
  kingFount:[`<b>"My little one is in there somewhere. Please — bring her out to me."</b>`,
             `<b>"I cannot leave them. Not one of my people will I leave. Go — I trust you."</b>`],
  kingFountTower:[`<b>"Up in the tower? Then she is hiding. She always hides. Good girl… stay hidden till they come for you."</b>`],
  kingFountEscort:[`<b>"Is that… is that her? My little one!"</b>`],
  cmdFount:[`<b>"Two on each of them — that's it, hold them, HOLD!"</b>`, `<b>"Don't mind me — this pair is mine. Get the princess!"</b>`, `<b>"For the King!"</b>`],
};
function invKnightTalk(){ return caLines([['knight', caTurn('invKnight', INV_LINES.knight)]]); }
function invKingFightTalk(){ return caLines([['king', caTurn('invKingFight', INV_LINES.kingFight)]]); }
/* (4.33) the King by the fountain, waiting for his daughter */
function invKingFountTalk(){
  if(invAt('escort') && invRouted() && typeof invStrike === 'function') return invStrike();
  if(invAt('escort')) return caLines([['king', caTurn('invKingFountE', INV_LINES.kingFountEscort)]]);
  return caLines([['king', caTurn('invKingFount' + (invAt('tower') ? 'T' : ''), invAt('tower') ? INV_LINES.kingFountTower.concat(INV_LINES.kingFount) : INV_LINES.kingFount)]]);
}
function invCommanderFightTalk(){
  if(invNew() && !invRouted()) return caLines([['commander', caTurn('invCmdFount', INV_LINES.cmdFount)]]);
  if(invRouted()) return caLines([['commander', invAt('escort')
    ? `<b>"The tribes! I never thought I'd be glad to hear those horns. The market is ours — now get the princess to her father!"</b>`
    : `<b>"The market is ours, thanks to the tribes. Never mind me — the King needs you. Go!"</b>`]]);
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
    if(key === CA_KEY && invAt('escort') && !invNew() && ui.screen === 'r6_palace' && !ui.sceneRunning){ caLines([['princess', `<b>"No — Father's in the hall! Please, let's go to him."</b>`]]); return; }
    /* (4.33) the princess's door: the hall to the palace's doors with her once the Dauphin and the Advisor are with you */
    if(key === CA_KEY && invAt('escort') && invNew() && ui.screen === 'r6_palace' && !invSaid('sisters') && !ui.sceneRunning){ caLines([['princess', `<b>"Wait — my sister's in the hall! We can't leave her!"</b>`]]); return; }
    if(key === 'r6_tower' && invAt('palace')){
      const b = invBandsOf('r6_palace').find(x=> x.guards === 'stair');
      if(b && invBandUp(b)){
        const nm = (SPECIES[b.lead] || {}).name || 'Humanoid';
        caLines([b.rank === 'alien' ? `An alien ${nm} stands in front of the stair. You'll have to get past it first!` : `Captain ${nm}'s band stands in front of the stair. You'll have to get past them first!`]).then(()=> invFight(b));
        return;
      }
      /* (4.33) "3 aliens along the right perimeter": not up the stair with any of them at your back */
      if(invNew() && !invDeckCleared('r6_palace')){
        const left = invBandsOf('r6_palace').filter(x=> invBandUp(x)).length;
        caLines([['lion', `<b>"Not with ${left === 1 ? 'that one' : 'those ' + left} still down here — they'd follow us up and trap us at her door. Clear the corridor first!"</b>`]]);
        return;
      }
      invSet('tower');
    }
    return _invCaGo.apply(this, arguments);
  };
}
/* the gate shut while the castle is fought for — (4.33) open again once Wadjet has fled it: after him! */
function invGateShut(){ return invFighting() && !(invAt('chase') && invState().nem); }
if(typeof caToJungle === 'function'){
  const _invToJungle = caToJungle;
  caToJungle = function(){
    if(invGateShut()){ toast('The gate is barred. Nobody leaves while the castle is under attack!'); return; }
    return _invToJungle.apply(this, arguments);
  };
}
/* the battle music while the castle is invaded (the designer is finding the castle's and the palace's own) — (4.29) "have
   the battle music play during the invasion of villages and the castle even when in the overworld to give a sense of
   tension": on its walls and their stairs too (not in the tavern by the fire, nor the record store), and as you walk
   (musicLive: walkMusicSync, 13-walkmap.js), so it comes the moment the castle is attacked and goes when it is saved */
['r6_castle', 'r6_palace', 'r6_tower']
  .concat(typeof CA_WALLS !== 'undefined' ? CA_WALLS.map(k=> 'r6_wall_' + k) : [])
  .concat(typeof CA_CORNERS !== 'undefined' ? CA_CORNERS.map(c=> 'r6_ramp_' + c) : []).forEach(key=>{
  const d = typeof DECKS !== 'undefined' && DECKS[key];
  if(!d) return;
  const base = d.music;
  Object.defineProperty(d, 'music', { configurable:true, enumerable:true, get(){ return invActive() ? 'battle_region6' : base; } });
  d.musicLive = true;
});

/* ---------- a step: the princess at your heels ((4.33) her sister and the Advisor after her), a band that sees you,
   her door, the hall, the King ---------- */
const _invTrail = [];
/* who follows you where: she, in the palace and the tower; (4.33) and on the grounds, with her sister and the Advisor */
function invFollowOn(key){ return invAt('escort') && !ui.invClimax && (key === 'r6_palace' || key === 'r6_tower' || (key === CA_KEY && invNew())); }
function invFollowers(){
  const f = [{ id:'invPrin', sprite:'fairy_princess', size:1.25, back:3 }];
  if(invNew() && invSaid('sisters')) f.push({ id:'invDau', sprite:'fairy_dauphin2', size:1.4, back:5 }, { id:'invAdv', sprite:'fairybird1_c', size:1.25, back:7 });
  return f;
}
function invStep(key, p){
  if(!invOn()) return false;
  _invTrail.push({ x:p.x, y:p.y, key });
  if(_invTrail.length > 10) _invTrail.shift();
  if(invFollowOn(key)) invFollowStep(key);
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
    const t1 = invBandsOf('r6_tower').find(x=> x.guards === 'door');
    if(t1 && invBandUp(t1)){
      walkState().busy = true;
      invAlert(t1);
      setTimeout(()=>{ walkState().busy = false; invFight(t1); }, 450);
      return true;
    }
  }
  /* into the hall, with her at your heels — (4.31) after the tribes' horns and the King's cry; (4.33) her sister and the
     Advisor, their fights won, come with you */
  if(key === 'r6_palace' && invAt('escort') && invInHall(p)){
    if(!invNew()){ setTimeout(()=> invSaid('cry') ? invClimax() : invTribesEarly(), 120); return true; }
    if(!invSaid('sisters') && typeof invSisters === 'function'){ setTimeout(()=> invSisters(), 120); return true; }
  }
  /* (4.33) the tribes come, the aliens gone: to the King by the fountain — and Wadjet strikes */
  if(key === CA_KEY && invNew() && invAt('escort') && invSaid('tribes') && !ui.invClimax && typeof invStrike === 'function'){
    const K = INV_FOUNT.king;
    if(Math.abs(p.x - K.x) + Math.abs(p.y - K.y) <= 3){ setTimeout(()=> invStrike(), 120); return true; }
  }
  return false;
}
function invInHall(p){ return !!p && p.x >= 12 && p.x <= 27 && p.y >= 2 && p.y <= 31; }

/* ---------- at your heels (the escort) ---------- */
function invFollowStep(key){
  const tr = _invTrail.filter(s=> s.key === key), p = caYou();
  invFollowers().forEach(f=>{
    const el = document.getElementById(f.id);
    if(!el) return;
    const at = tr[tr.length - f.back] || tr[0];
    if(!at || (p && at.x === p.x && at.y === p.y)) return;
    const was = el._at || at;
    el._at = { x:at.x, y:at.y };
    el.style.transform = `translate3d(${at.x * WALK_T}px,${at.y * WALK_T}px,0)`;
    el.style.zIndex = 10 + at.y;
    if(at.x !== was.x) faceRight(el, at.x > was.x);
  });
}
function invPrincessFollowStep(key){ return invFollowStep(key); }   // (its name until 4.33)
function invFollowersDraw(world, key, p){
  if(!p) return;
  const m = CA_MAPS[key](), lion = caLion.at, taken = [p].concat(lion ? [lion] : []);
  const ring = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [0, 2], [1, -1], [-1, -1], [2, 0], [-2, 0]];
  const placed = [];
  invFollowers().forEach(f=>{
    const free = ring.map(([dx, dy])=> ({ x:p.x + dx, y:p.y + dy }))
      .find(q=> !caSolidCode(caAt(m, q.x, q.y)) && !wBlockedBy(DECKS[key], q.x, q.y) && !taken.some(t=> t.x === q.x && t.y === q.y)) || p;
    taken.push(free); placed.push(free);
    const el = document.createElement('div');
    el.className = 'walk-ent ca-npc inv-follow';
    el.id = f.id;
    el.innerHTML = caMonImg(f.sprite, WALK_T * f.size, false);
    el._at = { x:free.x, y:free.y };
    el.style.transform = `translate3d(${free.x * WALK_T}px,${free.y * WALK_T}px,0)`;
    el.style.zIndex = 10 + free.y;
    world.appendChild(el);
  });
  /* the trail they walk: each a step further back along it (she 3, her sister 5, the Advisor 7) */
  _invTrail.length = 0;
  const at = i=> placed[i] || placed[0];
  [at(2), at(2), at(1), at(1), at(0), at(0), p].forEach(q=> _invTrail.push({ x:q.x, y:q.y, key }));
}
function invPrincessFollowDraw(world, key, p){ return invFollowersDraw(world, key, p); }

/* ============================================================
   ON ARRIVING: the sky, the smoke, the crack in the wall — and whichever scene is due
   ============================================================ */
function invRender(key, world, p){
  if(!invOn()) return;
  invCss(); if(typeof warCss === 'function') warCss();
  ui.invClimax = false; ui.invRouted = false;
  const st = invStage();
  if(!st) return;
  /* (4.33) left part-way through the return to the castle: it begins again from the castle's gate (36-the-return.js) */
  if(st === 'arrive' && typeof invArriveRedirect === 'function'){ setTimeout(()=> invArriveRedirect(key), 250); return; }
  if(key === CA_KEY){
    if(invNew()){ if(invAt('palace', 'tower', 'escort', 'wadjet', 'chase') && typeof invCocoonEls === 'function') invCocoonEls(world); }   // (4.33) the cocoons they came down in
    else if(invFighting() && invPast('market') && !invRouted()) INV_UFOS.forEach((u, i)=> invUfoEl('u' + i, u.x, u.y, world));
    if(invAt('palace', 'tower', 'escort', 'wadjet', 'chase')) INV_SMOKE.forEach(([x, y], i)=> invSmokeEl(world, x, y, i));
    if(invRiftShown()) invRiftEl(world, INV_RIFT.x, INV_RIFT.y, 2.3, 'invRiftGrounds', '');
  }
  if(key === 'r6_perimeter') invRiftDraw(world);
  if(invFollowOn(key)) invFollowersDraw(world, key, p);
  if(key === 'r6_perimeter'){ const stg = $('#walkStage'); if(stg){ stg.classList.remove('ca-in'); stg.classList.add('ca-out'); } }
  setTimeout(()=> invSceneDue(key), 420);
}
/* (4.31) the crack in the north wall on the grounds: once Wadjet has torn it open (before 4.31: from his fight on).
   (4.33) Only for the old chase of a save from before 4.31: the rift is at the jungle's north edge now. */
function invRiftShown(){
  const v = invState();
  if(v.nem || v.v433 || invAfter()) return false;
  if(!invAt('chase')) return invAt('wadjet') && !!v.grown && !invSaid('cry');
  return true;
}
function invSceneDue(key){
  if(ui.screen !== key || ui.sceneRunning || ui.caTalk || document.querySelector('.scene-say')) return;
  const st = invStage(), v = invState();
  /* (4.33) the new way's own (36-the-return.js) */
  if(v.v433 && typeof invSceneDue433 === 'function'){ const r = invSceneDue433(key, st, v); if(r !== undefined) return r; }
  if(st === 'muster'){ if(key === 'r6_palace') return invMuster(); if(key === CA_KEY) return invLanding(); return; }
  if(st === 'market' && key === CA_KEY && invMarketCleared() && !v.said.toPalace) return invToPalace();
  if(st === 'palace' && key === 'r6_palace' && !v.said.hall) return invHallScene();
  if(st === 'tower' && key === 'r6_tower' && !v.said.towerIn) return invTowerIn();
  /* (4.31) down from the tower with her: the tribes' horns, the King's cry — then the hall */
  if(st === 'escort' && key === 'r6_palace'){
    if(!v.said.cry) return invTribesEarly();
    if(invInHall(caYou())) return invClimax();
  }
  /* (4.31) a save from before 4.31 that lost to (or left) the old Wadjet: the tribes come now */
  if(st === 'wadjet' && !v.said.tribes && (key === 'r6_palace' || key === CA_KEY)) return invTribesEarly();
  if(st === 'chase' && v.nem){
    /* he has slipped away: Lucesco's nose, in the hall where you beat him — (4.33) then after him, to the jungle's north
       edge (the rift, its army, the soldiers: there, 36-the-return.js) */
    if(!v.said.fled){ if(key === 'r6_palace') return invAfterNem(); if(key === CA_KEY){ caGo('r6_palace', [19, 14]); } return; }
    return;
  }
  if(st === 'chase'){
    if(!v.said.fled && key === 'r6_palace') return invAfterWadjet();
    if(key === CA_KEY){ invPrincessJoins(); return invScene(()=> v.said.chased ? invTribesRun() : invChaseRun()); }
    if(key === 'r6_palace') return invScene(async ()=>{ await invCut('r6_palace', CA_KEY, [31, 20], v.said.chased ? null : 'After Wadjet!'); await (v.said.chased ? invTribesRun() : invChaseRun()); });
  }
  if(st === 'done' && key === 'r6_palace' && !v.said.finale) return invScene(()=> invFinaleRun());
  /* (4.34) a save past the finale without its epilogue: the tribes have come to the castle (37-peace.js) */
  if(st === 'done' && v.said.finale && !v.said.epilogue && typeof peaceEpilogueDue === 'function') return peaceEpilogueDue(key);
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
/* the black curtain down, another place, the curtain up — (4.31) `mid` run once it is drawn, behind the curtain */
async function invCut(from, key, at, text, mid){
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
  if(mid) mid();
  if(text) await sceneCurtainText('', 300);
  await sceneCurtain(false, 600);
}
/* (4.31) a monster actor jumping to stand on square (x, y), as invActorTo slides one there */
function invHopTo(id, x, y, lift, ms){
  const el = document.getElementById('sa-' + id);
  if(!el) return Promise.resolve();
  const s = el._o.w;
  return sceneHop(id, x + 0.5 - s / 2, y + 1 - s, lift, ms);
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
  /* (4.33) every one of them up here beaten, not only the army at her door */
  const up = invNew() ? invBandsOf('r6_tower').some(b=> invBandUp(b)) : invBandsOf('r6_tower').some(b=> b.guards === 'door' && invBandUp(b));
  if(up) return caLines([['princess', `A tiny voice comes from behind the wardrobe. <b>"Are they still out there? I can hear them… Please make them go away!"</b>`]]);
  const NEW = invNew();
  return invScene(async ()=>{
    await L([
      ['princess', `Something behind the wardrobe squeaks. <b>"Go away, go away! I heard them on the stairs!"</b>`],
      ['lion', `<b>"It's only me, little one. Lucesco. The aliens on the stairs are gone — my friends saw to that."</b>`],
      ['princess', `A small face peeks out. <b>"…Lucesco? Is it over?"</b>`],
      NEW ? ['you', `<b>"Not yet. Your father is outside, by the fountain. He sent us to bring you out to him."</b>`]
          : ['you', `<b>"Not yet. Your father wants you down in the hall with him, where he can keep you safe."</b>`],
      ['princess', NEW ? `<b>"Father's back?! But… out there? That's where all the fighting is! I'm not brave like my sister. I can't fight. I just… hide."</b>`
                       : `<b>"Down there? But that's where all the fighting is! I'm not brave like my sister. I can't fight. I just… hide."</b>`],
      ['lion', `<b>"Then hide behind me. Nothing gets past these paws. Stay close, and we will take you to him."</b>`],
      ['princess', `She slips out from behind the wardrobe and takes a fistful of Lucesco's mane.<br><br><b>"…Okay. But stay close. Please stay really close."</b>`]]);
    invSet('escort');
    ui.sceneRunning = false;
    go('r6_tower');
  });
}

/* ============================================================
   (4.31) DOWN FROM THE TOWER: the tribes' horns, and the King's cry
   ============================================================ */
function invTribesEarly(){
  return invScene(async ()=>{
    const v = invState();
    if(!v.said.tribes){
      if(ui.screen === CA_KEY){
        await invTribesMarch();
        ui.sceneRunning = false;
        go(CA_KEY);                                                     // the market as the tribes hold it
        return;
      }
      await L([['lion', `Lucesco's ears go up. <b>"Listen! …Horns. Out at the south gate — and they're not ours."</b>`]]);
      await invTribesCutaway();
    }
    if(invAt('escort') && !v.said.cry) await invKingCry();
  });
}
/* "Meanwhile, at the south gate…": the march on the grounds, and back to where you stood */
async function invTribesCutaway(){
  const w = walkState(), from = ui.screen, back = Object.assign({}, caYou() || { x:35, y:5 });
  w.at = w.at || {};
  const was = w.at[CA_KEY] ? Object.assign({}, w.at[CA_KEY]) : null;
  document.body.classList.add('inv-away');                             // you are not there: nobody stands where you would
  try {
    await invCut(from, CA_KEY, [31, 58], 'Meanwhile, at the south gate…');
    await invTribesMarch();
    if(was) w.at[CA_KEY] = was; else delete w.at[CA_KEY];
    await invCut(CA_KEY, from, [back.x, back.y], null, ()=> document.body.classList.remove('inv-away'));
  } finally {
    document.body.classList.remove('inv-away');
  }
}
/* the four tribes in at the south gate, up into the market; the aliens break, the saucers lift away. `o.smokeOut`:
   the fires put out after (the old ending, before 4.31) */
async function invTribesMarch(o){
  o = o || {};
  await sceneLook({ x:31.5, y:56.5 }, { zoom:0.6, ms:1100 });
  await L([`A horn sounds from the south gate. Then another, and another — deep and wild, like nothing from the castle.`]);
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
  invSay('tribes');
  if(typeof questRefreshThings === 'function') questRefreshThings();
  document.querySelectorAll('.inv-clash-knight').forEach(el=> el.classList.add('war-won'));
  if(o.smokeOut) document.querySelectorAll('.inv-smoke').forEach(el=> el.classList.add('inv-smoke-out'));
  await L([['a_earth', `<b>"…Stone… stands… with the castle."</b>`],
           ['g_grass', `<b>"Tag! You're ALL it!"</b>`],
           invNew() ? `The aliens break and run — over the walls, out through the gate, anywhere the tribes are not.`   // (4.33) they came in cocoons, not saucers
                    : `The aliens break and run. Their saucers lift off one by one, and streak away over the walls.`,
           ['knight', `<b>"They're running! The tribes have come — the tribes have come!"</b>`]]);
  return ids;
}
/* the King's cry from the great hall: Wadjet's laser */
async function invKingCry(){
  await sceneWait(400);
  try { playSfx('core_blast'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  sceneShake(800, ms=> 0.1 * (1 - ms / 800));
  await invPrismFlash(1100);
  await L([`Then, from the great hall: a high, thin hum — a flash of light that throws every shadow in the corridor the wrong way — and the King's voice, crying out.`,
           ['princess', `<b>"That was Father!"</b>`],
           ['lion', `<b>"The King! To the great hall — RUN!"</b>`]]);
  invSay('cry');
  await invCut('r6_palace', 'r6_palace', [21, 13], 'You race for the great hall…');
  await invClimaxRun();
}
/* a flash of every colour at once over the screen (his laser, seen from the corridor) */
function invPrismFlash(ms){
  invCss();
  const f = document.createElement('div');
  f.className = 'inv-prism-flash';
  f.style.animationDuration = Math.round(ms * SCENE_SPEED) + 'ms';
  document.body.appendChild(f);
  setTimeout(()=> f.remove(), ms * SCENE_SPEED + 60);
  return sceneWait(ms);
}
/* the light gathering in his hood (a scene actor's), or gone out */
function invPrismOn(id, on){
  const el = document.getElementById('sa-' + id);
  if(!el) return;
  let g = el.querySelector('.inv-prism-glow');
  if(on){ if(!g){ g = document.createElement('i'); g.className = 'inv-prism-glow'; el.appendChild(g); } return; }
  if(g){ g.classList.add('out'); setTimeout(()=> g.remove(), 700 * Math.max(SCENE_SPEED, 0.2)); }
}

/* ============================================================
   (4.31) THE CLIMAX: the King struck down, Wadjet gathering another laser, his shadows at the Advisor and the
   Dauphin; her courage; her light — the shadows gone, her father holding on, she at his side; Wadjet turns on you
   ============================================================ */
function invClimax(){ return invScene(()=> invClimaxRun()); }
async function invClimaxRun(){
  const v = invState();
  v.nem = true; saveProfile();
  ui.invClimax = true;
  if(typeof questRefreshThings === 'function') questRefreshThings();
  const pe = document.getElementById('invPrin'), you = caYou() || { x:21, y:13 };
  const pat = pe && pe._at ? pe._at : { x:you.x + 1, y:you.y };
  if(pe) pe.remove();
  invActor('prin', 'fairy_princess', pat.x, pat.y, 1.25);
  invActor('king', 'fairy_king_c', 19.5, 3, 2.3, { faint:1 });
  const ke = document.getElementById('sa-king'); if(ke) ke.classList.add('inv-hurt');
  /* his shadows, at the Advisor and the Dauphin: blade and claw, and the blades going through */
  invActor('adv', 'fairybird1_c', 16, 8, 1.35);
  invActor('sh1', WADJET, 13.6, 8.2, 2.0, { flip:true });
  invActor('dau', 'fairy_dauphin2', 23, 8, 1.55, { flip:true });
  invActor('sh2', WADJET, 25.4, 8.2, 2.0);
  [['sh1', 2.4], ['sh2', -2.4]].forEach(([id, dx])=>{
    const e = document.getElementById('sa-' + id);
    if(!e) return;
    e.classList.add('inv-shade', 'inv-lunge');
    e.insertAdjacentHTML('beforeend', warSlashHtml(0, 0, { left:50 + dx / e._o.w * 50, top:52 }));
  });
  ['adv', 'dau'].forEach(id=>{ const e = document.getElementById('sa-' + id); if(e) e.classList.add('inv-lunge', 'inv-lunge-b'); });
  /* Wadjet over the King, the light gathering in his hood again */
  invActor('wadjet', WADJET, 19.5, 6.4, 2.4);
  invPrismOn('wadjet', true);
  await sceneLook({ x:12, y:0.5, w:16, h:13 }, { ms:900 });
  await L([
    `The great hall has gone quiet — all but a high, thin hum.`,
    `The King lies crumpled on his dais, smoke curling from his robes. Over him rears a great dark cobra, and in its hood a new light is gathering: every colour at once.`,
    ['princess', `<b>"FATHER!"</b>`],
    ['dauphin', `<b>"Get away from him!"</b> The Dauphin's blade sweeps through a shadow of the cobra — and passes clean through it.`],
    ['advisor', `<b>"Hoo! Shadows! Our blows go straight through them!"</b>`],
    ['lion', `<b>"Wadjet! Nemesis's cobra!"</b>`],
    ['wadjet', `<b>"Hsss… Late, lion. Much too late. One beam was all it took."</b>`],
    ['wadjet', `<b>"The great Fairy King, of the Cosmic Council. One word from him, and every sword in this kingdom would march against Nemesis. Now there will be no word. And this next light makes sure of it."</b>`]]);
  /* she runs to him */
  await invActorTo('prin', 21.4, 4.3, 700);
  await L([['princess', `<b>"Father! Father, please, wake up!"</b>`],
           ['king', `The King's eyes flicker open.<br><br><b>"…Run… little one… hide…"</b>`],
           ['wadjet', `<b>"Yes, little one. Run along and hide. You're so very good at it."</b>`],
           ['princess', `<b>"No. I've hidden my whole life. I hid when the aliens came. I hid while everyone else fought for me. I'm not hiding any more!"</b>`],
           `A light begins to shine from the little princess — brighter, and brighter…`]);
  /* her courage: she evolves */
  sceneGlow('prinGlow', 22.0, 4.6, 3);
  await sceneWait(600);
  await new Promise(done=> playEvolutions([{ species:'fairy_princess', name:'The Little Princess', stageFrom:0, stageTo:1, newMoves:[], from:99, to:INV.princessLv,
    headline:`<b>The Little Princess</b> found her courage!`, note:`Lv ${INV.princessLv}` }], done));
  v.grown = true; saveProfile();
  await sceneGlowOut(['prinGlow'], 300);
  sceneActor('prin', { src:invSrc('fairy_princess1') });
  { const pe2 = document.getElementById('sa-prin'); if(pe2){ const s = 1.65, o = pe2._o; sceneActor('prin', { x:o.x + (o.w - s) / 2, y:o.y + (o.h - s), w:s, h:s }); pe2.classList.add('inv-princess-glow'); } }
  /* her pink light: the shadows burn away, the light in his hood gutters out, the King holds on */
  const burst = invGlitterBurst('sa-prin');
  await sceneWait(450);
  ['sh1', 'sh2'].forEach(id=>{ const e = document.getElementById('sa-' + id); if(e){ e.classList.remove('inv-lunge'); e.classList.add('inv-dispel'); const sl = e.querySelector('.war-slash'); if(sl) sl.remove(); } });
  ['adv', 'dau'].forEach(id=>{ const e = document.getElementById('sa-' + id); if(e) e.classList.remove('inv-lunge', 'inv-lunge-b'); });
  invPrismOn('wadjet', false);
  if(ke) ke.classList.add('inv-holding');
  document.querySelectorAll('.inv-clash-knight').forEach(el=> el.classList.add('inv-healed', 'war-won'));
  await burst;
  ['sh1', 'sh2'].forEach(id=> sceneActorGone(id));
  await L([`A wave of pink light rolls out from her, across the whole hall. Where it touches the shadows, they burn away like mist in the sun — and the light in Wadjet's hood gutters out.`,
           ['wadjet', `<b>"Hsss! My light—!"</b>`],
           `The pink light settles over the King like a blanket. He draws a long breath — and holds on.`,
           ['king', `<b>"…My daughter…"</b>`],
           ['princess', `She doesn't let go of his hand.<br><br><b>"I've got you, Father. I'm not leaving you."</b>`]]);
  /* the Dauphin and the Advisor to the King's side */
  await Promise.all([invActorTo('adv', 17.2, 4.6, 600), invActorTo('dau', 23.2, 5.2, 600)]);
  { const a = document.getElementById('sa-adv'), d = document.getElementById('sa-dau'); if(a) actorFace(a, true); if(d) actorFace(d, false); }
  await L([['dauphin', `<b>"Little sister…?! — Guard Father! Nothing gets past us now!"</b>`],
           ['wadjet', `<b>"A late bloomer. How touching. No matter: the light always comes back… and I have all the time in the world."</b>`]]);
  /* he turns on you */
  await invActorTo('wadjet', 20, 10.4, 700);
  await L([['wadjet', `<b>"But first — you, little trainer. You and your lion have been a thorn in Nemesis's side from the very start. Let's see how long you last against a serpent who can turn back time."</b>`],
           ['lion', `<b>"Here he comes — stand your ground!"</b>`]]);
  invSet('wadjet');
  ui.sceneRunning = false;
  invWadjetBattle();
}

/* ---------- WADJET'S FIGHT (4.31: 34-nemesis.js — ten turns to outlast him; she stays with her father) ---------- */
function invWadjetBattle(){
  const NEW = invNew();
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first. Talk to the princess.'); return NEW ? invBackToFountain() : go('r6_palace'); }
  /* (4.33) fought where he struck: on the grounds, by the fountain */
  nemBeginBattle({ bg:NEW ? 'battle_castle' : 'battle_palace', onWin:()=> invWadjetWon(), onLose:()=> invWadjetLost() });
}
function invWadjetChallenge(){
  if(ui.caTalk) return;
  ui.caTalk = true;
  r5Ask([caFaceOf('wadjet')], 'Wadjet', `<b>"Back again? Then come. I have all the time in the world."</b><br><br><i>Wadjet, Lv ${NEM.lv}. He turns back time: hold on for ${NEM.turns} turns and he is spent. From his fifth turn he gathers the Prismatic Laser — bring him down before it fires. The Monkey King will tell you what to do.</i>`, 'Fight Wadjet', 'Not yet')
    .then(yes=>{ ui.caTalk = false; if(yes) invWadjetBattle(); else refreshWalk(); });
}
function invPrincessHeal(){
  return caLines([['princess', `<b>"Hold still."</b> Without letting go of her father's hand, she reaches out with the other, and a warm pink light runs through each of your monsters in turn.`]]).then(()=>{
    healParty(1);
    toast('Your team is fully healed!');
    refreshWalk();
  });
}
function invWadjetWon(){
  const v = invState();
  v.won.wadjet = true;
  v.nem = true;                                                         // he slipped away into the past: the 4.31 chase
  invSet('chase');
  ui.walkFresh = false;
  const w = walkState();
  w.busy = false;
  w.at = w.at || {};
  caLion.at = null;
  /* (4.33) back on the grounds where he struck */
  if(v.v433){ w.at[CA_KEY] = { x:INV_FOUNT.you.x, y:INV_FOUNT.you.y }; go(CA_KEY); return; }
  w.at.r6_palace = { x:19, y:14 };
  go('r6_palace');
}
function invWadjetLost(){
  const NEW = invNew();
  return new Promise(res=>{
    storyModal(jgMonImg('fairy_princess1_front', 140), 'The princess',
      `Wadjet's laughter fills the ${NEW ? 'square' : 'hall'} as your last monster falls. Then, from the King's side, a pink light wraps around all of you, and drags you clear.<br><br><b>"I've got you. I've got you!"</b>` +
      `<br><br><i>Talk to the princess to heal your team, then face Wadjet again. He is waiting ${NEW ? 'by the fountain' : 'in the hall'}.</i>`,
      ()=>{ res(); NEW ? invBackToFountain() : invBackToHall(); }, { subtitle:'The battle for the castle', bg:'palace' });
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
/* (4.33) back on the path before the palace, the King a few steps off, Wadjet on the fountain's rim beyond him */
function invBackToFountain(){
  const w = walkState();
  w.at = w.at || {};
  w.at[CA_KEY] = { x:INV_FOUNT.you.x, y:INV_FOUNT.you.y };
  ui.walkFresh = false;
  caLion.at = null;
  go(CA_KEY);
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

/* ---------- (4.31) after his fight: he has slipped away into the past — Lucesco's nose ---------- */
function invAfterWadjet(){ return invState().nem ? invAfterNem() : invAfterWadjetOld(); }
function invAfterNem(){
  return invScene(async ()=>{
    ui.invClimax = true;
    if(typeof questRefreshThings === 'function') questRefreshThings();
    invActor('king', 'fairy_king_c', 19.5, 3, 2.3, { faint:1 });
    const ke = document.getElementById('sa-king'); if(ke) ke.classList.add('inv-hurt', 'inv-holding');
    invActor('prin', 'fairy_princess1', 21.2, 4, 1.65);
    { const pe = document.getElementById('sa-prin'); if(pe) pe.classList.add('inv-princess-glow'); }
    invActor('adv', 'fairybird1_c', 17, 5, 1.35, { flip:true });
    invActor('dau', 'fairy_dauphin2', 23, 6, 1.55);
    await sceneLook({ x:13, y:1, w:14, h:14 }, { ms:900 });
    await L([
      `Where Wadjet was, there is nothing: only a cold, coiling smell, and the faint tick of something running backwards.`,
      ['dauphin', `<b>"He's gone! Where did he go?"</b>`],
      ['lion', `Lucesco lifts his nose and breathes in, long and slow.<br><br><b>"Not far. He can turn back time, but he can't wash off his smell… He's out of the palace — out of the castle. North, into the jungle… all the way to its northern edge!"</b>`],
      ['princess', `<b>"Go after him! I'll stay with Father. I won't let go of him — not for a second."</b>`],
      ['advisor', `<b>"Hoo! Go, go! We'll watch over His Majesty."</b>`],
      ['lion', `<b>"Follow my nose — come on!"</b>`]]);
    invSay('fled');
    /* (4.33) the designer: "Wadjet escapes into the northern edge of the map, not the castle wall" (36-the-return.js) */
    if(typeof invChaseGoRun === 'function') return invChaseGoRun();
    await invCut('r6_palace', CA_KEY, [31, 20], 'After Wadjet!');
    await invRiftChaseRun();
  });
}
/* ---------- after his fight (a save from before 4.31 that beat his six waves): he flees; the King sends her after him with you ---------- */
function invAfterWadjetOld(){
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
           ['you', `<b>"Then we go and help them. Come on!"</b>`]]);
  const ids = await invTribesMarch({ smokeOut:true });
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

/* ---------- THE FINALE: the great hall, that night (before 4.31; (4.31) invFinaleNem for the story told the new way) ---------- */
async function invFinaleRun(){
  if(invState().nem) return invFinaleNem();
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
    `<br><br><i>The Royal Commander holds the rift at the jungle's northern edge (the crack in the wall led there). Go inside the perimeter any day: every alien there counts for the King's challenge and the tribes' and the castle's daily thanks. Half of the jungle's aliens are still out there, too, and now and then one leaps out on its paths.</i>`,
    ()=> res(), { subtitle:"The Fairy King's castle", bg:'palace' }));
  ui.walkFresh = false;
  go('r6_palace');
}

/* ---------- (4.31) THE CHASE: Lucesco's nose, across the grounds to the north wall; the rift; the army out of it ---------- */
async function invRiftChaseRun(){
  const w = walkState(), key = CA_KEY, v = invState(), st = INV_RIFT.stand;
  w.busy = true;
  const path = invPathTo(key, { x:31, y:20 }, { x:st.x, y:st.y + 1 });
  const lionEl = document.getElementById('caLion');
  if(lionEl) lionEl.style.display = 'none';
  const at = i=> path[Math.max(0, Math.min(path.length - 1, i))];
  const end = path.length - 1;
  const pos = { lion:3, you:0 };
  invActor('lion', 'lucesco', at(pos.lion).x, at(pos.lion).y, 1.45);
  invActor('wadjet', WADJET, st.x, st.y - 0.3, 2.0);                   // at the foot of the wall, waiting for no one
  w.at[key] = { x:at(0).x, y:at(0).y };
  const world = $('#walkWorld');
  if(world) world.style.transition = `transform ${Math.round(150 * SCENE_SPEED)}ms linear`;
  refreshWalk();
  await L([['lion', `He drops his nose to the flagstones. <b>"…There. Cold scales, and something burnt. This way!"</b>`]]);
  const step = 150;
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
  const youTo = i=>{
    const yp = at(i), was = w.at[key];
    if(yp.x !== was.x) w.faceX = yp.x > was.x ? 'r' : 'l';
    w.at[key] = { x:yp.x, y:yp.y };
    refreshWalk();
  };
  const stop = Math.max(4, end - 2), half = Math.floor(stop / 2);
  let sniffed = false;
  while(pos.lion < stop){
    pos.lion++; pos.you = Math.max(0, pos.lion - 3);
    move('lion', pos.lion); youTo(pos.you);
    await sceneWait(step);
    if(!sniffed && pos.lion >= half){
      sniffed = true;
      if(world) world.style.transition = '';
      await L([['lion', `He stops dead, nose up. <b>"Stronger… he's close. The north wall!"</b>`]]);
      if(world) world.style.transition = `transform ${Math.round(150 * SCENE_SPEED)}ms linear`;
    }
  }
  pos.you = Math.max(0, stop - 2); youTo(pos.you); await sceneWait(step);
  if(world) world.style.transition = '';
  /* Wadjet, at the foot of the wall: the stones tear open */
  await sceneLook({ x:st.x - 4, y:0, w:9, h:8 }, { ms:700 });
  const rift = invRiftEl(world, INV_RIFT.x, INV_RIFT.y, 2.3, 'invRiftGrounds', '');
  if(rift){ rift.style.transform = 'scale(.05)'; rift.style.opacity = '0'; }
  await L([`There he is — coiled at the foot of the north wall, his hood flared wide against the stones.`]);
  try { playSfx('timestop'); } catch(e){}
  if(rift){ void rift.offsetWidth; rift.style.transform = ''; rift.style.opacity = ''; }
  sceneShake(700, ms=> 0.06 * (1 - ms / 700));
  await sceneWait(1000);
  await L([`The stones split with a sound like tearing silk. A crack of purple light opens in the wall — and it is getting wider.`,
           ['wadjet', `<b>"Hsss… The lion's nose. I should have guessed."</b>`],
           ['wadjet', `<b>"Follow me if you like, lion. Where I'm going, your trail goes cold a thousand years before you were born."</b>`]]);
  /* in he goes */
  await invHopTo('wadjet', INV_RIFT.x - 0.5, INV_RIFT.y + 0.4, 0.8, 600);
  const we = document.getElementById('sa-wadjet');
  if(we){ we.style.transition = `transform ${600 * SCENE_SPEED}ms ease-in, opacity ${600 * SCENE_SPEED}ms ease-in`; void we.offsetWidth; we.style.transform = 'scale(.15)'; we.style.opacity = '0'; }
  await sceneWait(650);
  sceneActorGone('wadjet');
  /* Lucesco after him — and out of it, the other way, an army */
  await L([['lion', `<b>"Oh no you don't — RAAH!"</b>`]]);
  const lionJump = invHopTo('lion', st.x, st.y, 1.4, 520);
  await sceneWait(380);
  if(rift) rift.classList.add('inv-rift-flare');
  try { playSfx('ambush'); } catch(e){}
  const out = [['ra0', JG_COMMANDER, 2.0, st.x, st.y + 1], ['ra1', JG_CAPTAIN, 1.7, st.x - 2, st.y + 1], ['ra2', JG_CAPTAIN, 1.7, st.x + 2, st.y + 1],
               ['ra3', JG_ALIEN_IDS[2], 1.45, st.x - 3, st.y + 2], ['ra4', JG_ALIEN_IDS[5], 1.45, st.x + 3, st.y + 2]];
  await lionJump;
  /* he is thrown back down beside you */
  const you = caYou() || { x:st.x, y:st.y + 4 };
  const back = invHopTo('lion', you.x + 1, you.y, 1.1, 520);
  sceneShake(500, ms=> 0.08 * (1 - ms / 500));
  const pours = out.map(([id, sp, size, x, y], i)=>{
    invActor(id, sp, INV_RIFT.x - 0.5, INV_RIFT.y + 0.6, size);
    const el = document.getElementById('sa-' + id); if(el){ el.style.opacity = '0'; el.classList.add('inv-band-actor'); }
    return sceneWait(i * 160).then(()=> Promise.all([invActorIn(id, 300), invHopTo(id, x, y, 0.9, 560)]));
  });
  await Promise.all([back].concat(pours));
  if(rift) rift.classList.remove('inv-rift-flare');
  await L([`The rift flares — and something comes out of it the other way. Aliens: captains, soldiers, and at their head a hulking commander!`,
           ['lion', `<b>"Grr! They're coming THROUGH it! Get ready!"</b>`]]);
  v.said.riftOut = true; saveProfile();
  ui.sceneRunning = false;
  invFight(invRiftBand());
}
/* ---------- (4.31) the commander's army beaten: more behind them — and the castle's soldiers up behind you ---------- */
async function invRiftHoldRun(){
  const w = walkState(), st = INV_RIFT.stand;
  w.busy = true;
  const you = caYou() || { x:st.x, y:st.y + 3 };
  const lionEl = document.getElementById('caLion');
  if(lionEl) lionEl.style.display = 'none';
  invActor('lion', 'lucesco', you.x + 1, you.y, 1.45);
  await sceneLook({ x:st.x - 5, y:0, w:10, h:you.y + 6 }, { ms:700 });
  const rift = document.getElementById('invRiftGrounds');
  await L([`The commander's army breaks and scatters — but the rift flares again, brighter than before.`]);
  if(rift) rift.classList.add('inv-rift-flare');
  try { playSfx('ambush'); } catch(e){}
  const al = [['rb0', JG_CAPTAIN, 1.7, st.x - 3, st.y], ['rb1', JG_CAPTAIN, 1.7, st.x + 3, st.y], ['rb2', JG_ALIEN_IDS[1], 1.45, st.x - 1, st.y + 1],
              ['rb3', JG_ALIEN_IDS[4], 1.45, st.x + 1, st.y + 1], ['rb4', JG_ALIEN_IDS[7], 1.45, st.x - 4, st.y + 2], ['rb5', JG_ALIEN_IDS[9], 1.45, st.x + 4, st.y + 2]];
  await Promise.all(al.map(([id, sp, size, x, y], i)=>{
    invActor(id, sp, INV_RIFT.x - 0.5, INV_RIFT.y + 0.6, size);
    const el = document.getElementById('sa-' + id); if(el){ el.style.opacity = '0'; el.classList.add('inv-band-actor'); }
    return sceneWait(i * 140).then(()=> Promise.all([invActorIn(id, 280), invHopTo(id, x, y, 0.9, 520)]));
  }));
  if(rift) rift.classList.remove('inv-rift-flare');
  await L([`More of them come pouring out — captains, soldiers, more and more, spreading out along the wall to cut you off.`,
           ['lion', `<b>"There are too many of them! We can't fight them all — we have to get out of here before they surround us!"</b>`]]);
  /* a trumpet: the castle's own */
  const kn = [['cm', 'chestnut_knight2_c', 1.6, you.x, you.y + 5], ['k1', 'chestnut_knight2', 1.45, you.x - 2, you.y + 6], ['k2', 'bug_knight1', 1.45, you.x + 2, you.y + 6],
              ['k3', 'duck_knight2', 1.45, you.x - 1, you.y + 7], ['k4', 'chestnut_knight2', 1.45, you.x + 1, you.y + 7]];
  kn.forEach(([id, sp, size, x, y])=>{ invActor(id, sp, x, y, size); const el = document.getElementById('sa-' + id); if(el) el.style.opacity = '0'; });
  await L([`Then a trumpet sounds behind you — the castle's own.`]);
  await Promise.all(kn.map(([id])=> invActorIn(id, 400)).concat([sceneGlide(kn.map(k=> k[0]), 0, -3, 1000)]));
  await L([['commander', `<b>"FOR THE KING! Shields up — drive them back into that hole!"</b>`]]);
  /* they charge past you; the aliens are driven back through the crack */
  const charge = sceneGlide(['k1', 'k2', 'k3', 'k4'], 0, -5, 900);
  await sceneWait(500);
  sceneShake(700, ms=> 0.09 * (1 - ms / 700));
  try { playSfx('hit_dealt'); } catch(e){}
  await Promise.all(al.map(([id], i)=> sceneWait(i * 90).then(()=> Promise.all([invHopTo(id, INV_RIFT.x - 0.5, INV_RIFT.y + 0.6, 0.5, 600), invActorFade(id, 600)]))).concat([charge]));
  await invActorTo('cm', you.x, you.y + 1, 600);
  await L([`The castle's soldiers crash into them shield-first. Step by step they drive the aliens back — and back through the crack they came out of.`,
           ['commander', `<b>"Ha! And STAY in there!"</b>`],
           ['commander', `<b>"So this is where they've been coming from… a hole in my own wall, right under my nose. And you two sniffed it out. You have my thanks — the whole castle's."</b>`],
           ['commander', `<b>"Soldiers! A perimeter round that crack: stakes, shields, and a guard on it day and night. Nothing comes out of there without going through us!"</b>`],
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
  ui.sceneRunning = true;
  go('r6_palace');
  await invWaitDeck('r6_palace');
  ui.invSceneKey = 'r6_palace';
  walkState().busy = true;
  await sceneCurtainText('', 300);
  await sceneCurtain(false, 700);
  await invFinaleNem();
}

/* ---------- (4.31) THE FINALE: the King awake; Lucesco's whiff of a land in the past; the King's promise; the Advisor;
   the princess goes in her father's place ---------- */
async function invFinaleNem(){
  const v = invState();
  const ids = [];
  if(v.said.tribes){
    const gx = { grass:15, water:17, earth:22, fire:24 }, ax = { grass:14.6, water:17.4, earth:21.6, fire:24.4 };
    JG_TRIBE_KEYS.forEach(k=>{
      const sp = k === 'earth' ? 'ground' : k;
      invActor('fg' + k, `tribal_guardian_${sp}`, gx[k], 7, 1.6); invActor('fa' + k, `tribal_ancestor_${k}`, ax[k], 9.6, 2.2);
      ids.push('fg' + k, 'fa' + k);
    });
  }
  invActor('prin', 'fairy_princess1', 19.5, 5, 1.5);
  { const pe = document.getElementById('sa-prin'); if(pe) pe.classList.add('inv-princess-glow'); }
  ids.push('prin');
  await sceneLook({ x:12, y:0.5, w:16, h:12 }, { ms:900 });
  const tribes = v.said.tribes ? [
    ['king', `<b>"Two hundred years ago, I sealed your ancestors to end a war. Today, they came to save my castle."</b>`],
    ['a_fire', `<b>"Don't get sentimental, King. We came for the aliens, not for you."</b>`],
    ['a_water', `<b>"…And yet, we came. It is a beginning."</b>`],
    ['g_water', `<b>"The tribes will not hide from the castle again. You have our word."</b>`]] : [];
  await L([].concat(
    v.said.tribes ? [`That evening, the great hall is fuller than it has been in two hundred years.`] : [],
    [['king', `The King sits on his throne, pale, wrapped in his daughter's soft pink light.<br><br><b>"…So. I am still here. I hear I have a great many people to thank for that."</b>`]],
    tribes,
    [['king', `<b>"And you, my friends. You stood between that serpent and my family. Did it get away?"</b>`],
     ['lion', `<b>"Through a rift at the jungle's northern edge, Your Majesty. But the chase wasn't for nothing."</b>`],   // (4.33) not the north wall
     ['lion', `<b>"I caught a whiff of the other side as he went through. Hot sand. Old stone. A great river… and something buried deep beneath it. That place isn't far away — it's long ago. He has gone back into the past."</b>`],
     ['king', `<b>"Into the past…"</b> The King is quiet for a long moment.`],
     ['king', `<b>"I made you a promise, my friends: once the aliens were dealt with, this castle would stand with you against Nemesis. I keep my promises. Wherever that serpent has gone, I will follow you there myself."</b>`],
     ['advisor', `<b>"Hoo! Your Majesty will do no such thing! You were struck down not a day ago. You will stay in that bed and CONVALESCE — by order of… of everyone!"</b>`],
     ['king', `<b>"But a promise is—"</b>`],
     ['princess', `<b>"…Then I'll go. In your place, Father."</b>`],
     `The whole hall turns to look at her.`,
     ['dauphin', `<b>"You? Little sister — you used to hide from thunderstorms!"</b>`],
     ['princess', `<b>"I used to. Father made them a promise, and I'm his daughter. I'll keep it for him."</b>`],
     ['king', `The King looks at her for a long moment — and then he smiles, the first smile anyone has seen on him in days.<br><br><b>"All these years we tried to coax you out from behind that wardrobe… and it took a serpent to do it."</b>`],
     ['advisor', `<b>"Hoo hoo! The little one, a hero! Oh, I may need to sit down."</b>`],
     ['king', `<b>"Go, then, with my blessing — and keep my promise for me. Lucesco, my old friend: keep her safe."</b>`],
     ['lion', `<b>"With my life."</b>`],
     ['dauphin', `<b>"Come home and spar with me sometimes, all right? I want to see this new you."</b>`],
     ['princess', `<b>"You're on!"</b>`]]));
  invPrincessJoins();
  /* (4.33) the King's gift, here now (until 4.33 it came in the throne room after the fourth ancestor, before the alarm) */
  const w = warState();
  if(!w.stone){
    const had = typeof ownsStone === 'function' && ownsStone('psychicStone');
    await L([['king', `<b>"One thing more. Four ancestors woken, four tribes standing with the castle again, my family safe… In two hundred years, nobody has done what you have done."</b>`],
             ['king', had ? `<b>"I would give you the Psychic Stone of my house — but I see you carry one already. Then take my thanks, and my kingdom's friendship, always."</b>`
                          : `He holds out a stone that glows a soft violet.<br><br><b>"The Psychic Stone of my house. A Psychic monster that carries it learns half again as fast. Take it, with my thanks."</b>`]]);
    w.stone = true;
    if(!had && typeof addStone === 'function'){ addStone('psychicStone', 1); toast('🔮 You received the Psychic Stone!'); try { playSfx('stone_high'); } catch(e){} }
    saveProfile();
  }
  invSay('finale');
  /* (4.34) the epilogue: the guardians' strength for the King, the Earth Ancestor's thanks and the tribes' pledge, the
     Ground Stone for the princess (37-peace.js) */
  if(typeof peaceEpilogue === 'function'){
    if(!v.said.tribes){ JG_TRIBE_KEYS.forEach(k=>{ const sp = k === 'earth' ? 'ground' : k;
      invActor('fg' + k, `tribal_guardian_${sp}`, PEACE_HALL.guard[k], 7, 1.6); invActor('fa' + k, `tribal_ancestor_${k}`, PEACE_HALL.anc[k], 9.6, 2.2); ids.push('fg' + k, 'fa' + k); });
      await L([`The four tribes come to the castle — guardians, ancestors and all.`]); }
    await peaceEpilogue();
  }
  ids.forEach(id=> sceneActorGone(id));
  await sceneCamFree(500);
  const here = state.party.some(m=> m.species === 'fairy_princess');
  await new Promise(res=> storyModal(jgMonImg('fairy_princess1_front', 140), 'The battle for the castle is won',
    typeof peaceLastPage === 'function' && v.said.epilogue ? peaceLastPage(here) :
    `The castle is saved, and the tribes stand with it. The Little Princess has joined you in her father's place${here ? '' : ' (she is waiting in storage: your six were full)'}.` +
    `<br><br><i>The Royal Commander holds the rift at the jungle's northern edge, where his soldiers fight the aliens that keep coming through it. Go inside the perimeter any day: every alien there counts for the King's challenge and the tribes' and the castle's daily thanks. Half of the jungle's aliens are still out there, too, and now and then one leaps out on its paths.</i>`,
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
   against Wadjet before 4.31, as an ally at your side (04-battle.js: the vault's ally, `kind:'princess'`): never on the
   field, never struck, singing Prism Lullaby over every one of them after your leader's turn. ((4.31) She no longer
   fights him with you: she stays at her father's side. The ally's workings are kept, unused.)
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
   (4.33) The rift at the jungle's north edge (until 4.33: the crack in the
   north wall, behind the palace): a compound fenced round it, the aliens
   that still creep through it inside, pushing against the palisade, the
   Commander's soldiers outside holding them in. Go in by its gate (on the
   jungle, 36-the-return.js): its bands (ten a day, as the jungle's: beaten
   for the day) are fought as the jungle's, their captives the tribes'
   people and the castle's — so they count for the King's week and every
   daily thanks.
   ============================================================ */
let _invRiftMap = null;
function invRiftMap(){
  if(_invRiftMap) return _invRiftMap;
  const T = CA_T, W = 26, H = 20, m = caGrid(W, H, T.GRASS);
  /* (4.33) the jungle's edge along the top, the rift opening in front of it; the trees close in at either side */
  const tree = (x, y, w)=>{ caPut(m, x, y, T.TREE); caDeco(m, 'tree', x + 0.5 - w / 2, y - 1.3, w, 2.3, { variant:'jungle', z:y + 0.9 }); };
  for(let x = 0; x < W; x++){ tree(x, 0, 2.1); tree(x, 1, 2.1); }
  for(let y = 2; y < H; y++){ tree(0, y, 1.7); tree(W - 1, y, 1.7); }
  caFill(m, 4, 3, 18, 12, T.PATH);                                       // the compound: the ground torn up
  for(let y = 3; y <= 15; y++){ caPut(m, 3, y, T.PLANTER, 'cobble:' + (y % 6)); caPut(m, 22, y, T.PLANTER, 'cobble:' + ((y + 3) % 6)); }
  for(let x = 4; x <= 21; x++) if(x !== 12 && x !== 13) caPut(m, x, 15, T.PLANTER, 'cobble:' + (x % 6));
  caPut(m, 12, 15, T.PATH); caPut(m, 13, 15, T.PATH);                    // its gate
  for(let y = 16; y < H; y++){ caPut(m, 12, y, T.PATH); caPut(m, 13, y, T.PATH); }   // the way out to the glade
  m.tags.rift = { x:13, y:2.1 };
  m.tags.gate = { x:12, y:15, w:2 };
  m.tags.exit = { x:9, y:19, w:8 };
  for(let i = 0; i < W * H; i++) if(!m.spr[i]) m.spr[i] = caDefaultSpr(m, i % W, Math.floor(i / W));
  m.deco.sort((a, b)=> a.z - b.z);
  return (_invRiftMap = m);
}
/* (4.33) the knights outside the palisade a square in from the trees (x 1 and 24 were the old compound's wall-foot) */
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
  T({ x:9, y:19, w:8, walk:true, icon:'', verb:'Out', where:'Back into the jungle', arrow:'down', act:()=> typeof invRiftOut === 'function' ? invRiftOut() : caGo(CA_KEY, INV_PERIM.out) });   // (4.33) the jungle's north edge
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
    return caLines([['commander', `<b>"The perimeter. My soldiers keep them penned in here, round the rift. Go in whenever you like: there are always more of them."</b>`],
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
    `<b>"They keep coming through that rift, but fewer every day. We'll hold them."</b>`,
    `<b>"In you go. Mind the big ones."</b>`,
    `<b>"His Majesty is mending. The tribes send fruit and firewood. Strange days, good days."</b>`]) +
    `<br><br><i>${left ? `${left} of today's ${invPerimBands().length} bands are inside.` : `Today's bands are all beaten. More come through tomorrow.`} The King's week: ${wk}. The castle's people freed today: ${castle}.</i>`]]);
}

/* ---------- the deck ---------- */
if(typeof CA_MAPS !== 'undefined'){
  CA_MAPS.r6_perimeter = ()=> invRiftMap();
  CA_PLACES.r6_perimeter = { title:'The Rift Perimeter', backLabel:'Jungle', backTo:'r6_jungle', music:'zone_perimeter', spawn:()=> [12, 17] };   // (4.33) at the jungle's north edge
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
  /* (4.33) "movement and hamburger menu locked out": while a scene of the story plays, nothing to tap but its words */
  body.inv-scene #hamburgerBtn, body.inv-scene #walkSide, body.inv-scene #walkActs, body.inv-scene #walkPath, body.inv-scene #walkSteps{ visibility:hidden !important; pointer-events:none !important; }
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
  /* (4.31) the tribes' march seen from the palace: you are not on the grounds */
  body.inv-away #walkYou, body.inv-away #caLion, body.inv-away #walkGhost{ visibility:hidden !important; }
  /* the tribes' ancestors, holding the market */
  .walk-ent.inv-tribe-post{ overflow:visible; }
  .walk-ent.inv-tribe-post .war-fig{ animation:invIdle 2.4s ease-in-out infinite; filter:drop-shadow(0 3px 2px rgba(35,32,25,.3)); }
  /* his laser, seen from the corridor: every colour at once */
  .inv-prism-flash{ position:fixed; inset:0; z-index:95; pointer-events:none; animation:invPrismFlash 1.1s ease-out both;
    background:linear-gradient(100deg, rgba(255,255,255,.95) 0%, rgba(255,246,252,.7) 32%, rgba(255,255,255,0) 78%),
               linear-gradient(180deg, rgba(255,90,90,.4), rgba(255,213,74,.4) 25%, rgba(108,240,106,.4) 50%, rgba(90,180,255,.4) 75%, rgba(184,108,255,.4)); }
  @keyframes invPrismFlash{ 0%{ opacity:0; } 10%{ opacity:1; } 40%{ opacity:.85; } 100%{ opacity:0; } }
  /* the light gathering in his hood */
  /* (as the fight's, 34-nemesis.js: a prism of every colour, turning, wreathed in white) */
  .scene-actor .inv-prism-glow{ position:absolute; left:50%; top:24%; width:22%; aspect-ratio:1; translate:-50% -50%; rotate:45deg; border-radius:24%; pointer-events:none; z-index:3;
    background:conic-gradient(#ff4d4d, #ffe34d, #5be06a, #4db8ff, #c86cff, #ff4d4d);
    box-shadow:0 0 12px 4px rgba(255,255,255,.9), 0 0 32px 12px rgba(200,170,255,.7);
    animation:invPrismSpin 1.2s linear infinite, invPrismPulse 1.1s ease-in-out infinite; transition:opacity .6s ease, scale .6s ease; }
  .scene-actor .inv-prism-glow.out{ animation:none; opacity:0; scale:.2; }
  @keyframes invPrismPulse{ 0%,100%{ scale:.85; } 50%{ scale:1.15; } }
  @keyframes invPrismSpin{ from{ rotate:45deg; filter:hue-rotate(0deg); } to{ rotate:405deg; filter:hue-rotate(360deg); } }
  /* his shadows: dark copies of him; blades pass through them; her light burns them away */
  .scene-actor.inv-shade img{ filter:brightness(.24) contrast(1.35) saturate(.4) drop-shadow(0 0 6px rgba(150,100,255,.85)) drop-shadow(0 0 14px rgba(90,40,200,.5)); opacity:.9; }
  .scene-actor.inv-dispel img{ animation:invDispel 1.2s ease-in both; }
  @keyframes invDispel{ 0%{ filter:brightness(.24) contrast(1.35) saturate(.4) drop-shadow(0 0 6px rgba(150,100,255,.85)); opacity:.9; }
    35%{ filter:brightness(2.4) saturate(0) drop-shadow(0 0 14px #ff9fd8); opacity:1; } 100%{ filter:brightness(3) blur(6px) drop-shadow(0 0 20px #ffc2e6); opacity:0; transform:scale(1.25); } }
  .scene-actor.inv-lunge .sa-in{ animation:invLungeL 1.1s ease-in-out infinite; }
  .scene-actor.inv-lunge.face-r .sa-in{ animation-name:invLungeR; }
  .scene-actor.inv-lunge-b .sa-in{ animation-delay:-.55s; }
  @keyframes invLungeL{ 0%,100%{ translate:0 0; } 35%{ translate:-9% -2%; } 50%{ translate:2% 0; } }
  @keyframes invLungeR{ 0%,100%{ translate:0 0; } 35%{ translate:9% -2%; } 50%{ translate:-2% 0; } }
  .scene-actor .war-slash{ position:absolute; width:78%; height:78%; translate:-50% -50%; pointer-events:none; overflow:visible; z-index:4; }
  .scene-actor.inv-band-actor img{ filter:drop-shadow(0 0 6px rgba(220,30,40,.85)); }
  /* the crack flaring as they come through it */
  .inv-rift.inv-rift-flare{ animation:invRiftFlare .5s ease-in-out infinite alternate; }
  @keyframes invRiftFlare{ from{ filter:drop-shadow(0 0 14px rgba(220,130,255,1)) brightness(1.2); } to{ filter:drop-shadow(0 0 30px rgba(255,190,255,1)) brightness(1.6); } }
  @media (prefers-reduced-motion: reduce){ .scene-actor.inv-lunge .sa-in, .scene-actor .inv-prism-glow{ animation:none; } }
  `;
  document.head.appendChild(s);
}
