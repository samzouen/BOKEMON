/* ============================================================
   22-war.js — THE FAIRY KINGDOM'S WAR (3.91)
   The four tribal ancestors, sealed by the Fairy King in the four blades
   behind his throne two hundred years ago, to end their wars. The story
   wakes them one by one (NE, SE, SW, NW: water, fire, earth, grass); each
   turns on whoever woke it, Lv 200, crowned, and fights alone.

   The designer (2026-11-05): "The ancestors should present special
   difficulties given that they battle alone.
     Earth (ground). Uses spike armour star. Passive: Shields up: moves 1
       step slower, and in the end phase of every round, it gains 3 shields
       with double shield effectiveness. It also starts battle in this state.
     Grass: uses leech seed Star. Extremely evasive: 75%, and its max move
       deals 18 hits of 0.1* atk.
     Fire: uses overheat star. It has a one turn HP loss cap at 3 points:
       67/34/1% of its life, and it adds lost HP as damage to each hit of its
       max move which hits 2 targets for 1x atk each. (Additional damage can
       be dodged and reduced)
     Water: passive: hyperspeed. Moves faster than Mach dragon star, uses ice
       tomb star. Max move Hits cannot be mitigated by damage reduction or
       shields, only dodged. Deals 1.2x atk to all enemy monsters with its max
       move."

   Each casts its ✦ Very High on its first action (and again each time its
   side recharges, every 7 turns), then its Max every turn, as every monster
   of theirs from Region 5 on. Their element and Fairy, as their tribes'
   people. The engine's side of it: Hyperspeed (machTier), Shields Up
   (ancRoundEnd, from endRound), a pure blow (computeDamage's `pure`, and
   the strike loop: no shield, guard, cut or cap), the lost health on each
   hit (`lostHp`), the floors (ancArmFloors, here).
   ============================================================ */
const ANC_LEVEL = 200;
const ANC_FOLK = {
  tribal_ancestor_water:{ key:'water', name:'Water Ancestor', el:'Water', vh:'Water', glyph:'潮', color:'#3d86c6', moves:[
    ['Basic', 'Tide Touch', 0.3, 'Single', 2, 1],
    ['Power1', 'Undertow Wave', 0.5, 'AOE', 4, 1],
    ['Power2', 'Hyperspeed', null, 'Passive', 0, 21, { passive:{ hyperspeed:true } }],
    ['Ultimate', 'Abyssal Torrent', 1.0, 'AOE', 8, 41, { pure:true }],
    ['Max', 'Abyssal Torrent Max', 1.2, 'AOE', 8, 51, { pure:true }]] },
  tribal_ancestor_fire:{ key:'fire', name:'Fire Ancestor', el:'Fire', vh:'Fire', glyph:'焰', color:'#d8582c', moves:[
    ['Basic', 'Ember Touch', 0.3, 'Single', 2, 1],
    ['Power1', 'Cinder Wave', 0.5, 'AOE', 4, 1],
    ['Power2', 'Undying Embers', null, 'Passive', 0, 21, { passive:{ floors:[0.67, 0.34, 0.01] } }],
    ['Ultimate', 'Phoenix Wrath', 0.8, 'AOE', 8, 41, { lostHp:1 }],
    ['Max', 'Phoenix Wrath Max', 1.0, 'AOE', 8, 51, { lostHp:1 }]] },
  tribal_ancestor_earth:{ key:'earth', name:'Earth Ancestor', el:'Ground', vh:'Ground', glyph:'岳', color:'#9a7442', moves:[
    ['Basic', 'Stone Touch', 0.3, 'Single', 2, 1],
    ['Power1', 'Rumbling Wave', 0.5, 'AOE', 4, 1],
    ['Power2', 'Shields Up', null, 'Passive', 0, 21, { passive:{ slow:1, shieldsUp:{ n:3, worth:2 } } }],
    ['Ultimate', "Mountain's Fall", 1.25, 'Single', 8, 41],
    ['Max', "Mountain's Fall Max", 1.5, 'Single', 8, 51]] },
  tribal_ancestor_grass:{ key:'grass', name:'Grass Ancestor', el:'Grass', vh:'Grass', glyph:'森', color:'#4f9a46', moves:[
    ['Basic', 'Thorn Touch', 0.3, 'Single', 2, 1],
    ['Power1', 'Bramble Wave', 0.5, 'AOE', 4, 1],
    ['Power2', 'Wild Grace', null, 'Passive', 0, 21, { passive:{ evadeAlways:0.75, unsweepable:true } }],
    ['Ultimate', 'Thousand Thorns', 0.1, 'Single', 8, 41, { hits:14 }],
    ['Max', 'Thousand Thorns Max', 0.1, 'Single', 8, 51, { hits:18 }]] },
};
/* the order the King wakes them: the north-east's first, then round */
const ANC_ORDER = ['tribal_ancestor_water', 'tribal_ancestor_fire', 'tribal_ancestor_earth', 'tribal_ancestor_grass'];
(function ancSpecies(){
  if(typeof SPECIES === 'undefined' || typeof MOVES === 'undefined') return;
  Object.entries(ANC_FOLK).forEach(([id, a])=>{
    /* never evolves, so one evolution's worth is baked in, as every such legendary; one picture, crowned or not */
    SPECIES[id] = { name:a.name, tier:'legendary', types:[a.el, 'Fairy'], rate:13, nerfedRate:13, base:200, evo:[], evoMult:1.5, bonusStages:1,
                    color:a.color, glyph:a.glyph, bossOnly:true, noCatch:true, noLevelCap:true, fixedLook:id, ancestor:a.key };
    MOVES[id] = a.moves.map(r=> r.slice());
  });
})();
function ancOf(e){ return e && SPECIES[e.species] && SPECIES[e.species].ancestor ? ANC_FOLK[e.species] : null; }

/* ---------- the fight: alone, Lv 200, crowned, its ✦ Very High cast on its first action ---------- */
function ancBattle(id, opts){
  const A = ANC_FOLK[id];
  return Object.assign({
    waves:[[{ species:id, level:ANC_LEVEL, ai:'best', nerfed:false, anyLevel:true, crowned:true, veryHigh:{ type:A.vh, plus:2, cast:true } }]],
    isNpc:true, name:`The ${A.name}`, bgKey:'battle_jungle', foeRegion:6, onWaveStart:(i)=> ancWaveStart(i),
  }, opts || {});
}
/* as it walks on: the Earth's shields up from the start; the Fire's floors */
function ancWaveStart(i){
  const b = ui.battle;
  if(!b) return;
  b.enemies.forEach(e=>{
    const A = ancOf(e);
    if(!A) return;
    e.cls = 'anc-foe anc-' + A.key;
    const p = passiveDefOf(e);
    if(p && p.shieldsUp) grantBlock(e, p.shieldsUp.n, Math.ceil(p.shieldsUp.worth * enemyAtk(e)));
    if(p && p.floors) ancArmFloors(e);
  });
  ancCss();
}
/* Shields Up, at the end of every round: 3 more, each blocking twice its ATK.
   (Quiet under your ✦ Curse, as any passive.) */
function ancRoundEnd(e){
  const p = passiveOf(e);
  if(!p || !p.shieldsUp || !(e.hp > 0)) return;
  grantBlock(e, p.shieldsUp.n, Math.ceil(p.shieldsUp.worth * enemyAtk(e)));
  setTimeout(()=>{ if(ui.battle) battleMsg(`🪨 The ${escapeHtml(SPECIES[e.species].name)}'s shields rise again: <b>+${p.shieldsUp.n}</b>, each blocking <b>${Math.ceil(p.shieldsUp.worth * enemyAtk(e))}</b>.`); }, 300);
}
/* Undying Embers: in any one turn it loses health only down to the next
   floor below where that turn found it — 67%, 34%, 1% of its life — so it
   takes four turns at the least. Every way its health can drop goes through
   its `hp`, so the floor is kept there: the first loss of a round fixes that
   round's floor. (Quiet under your ✦ Curse; never in the Test Arena's
   immortal mode, where nothing falls.) */
function ancArmFloors(e){
  if(e._ancFloors) return;
  e._ancFloors = true;
  let hp = e.hp;
  Object.defineProperty(e, 'hp', { configurable:true, enumerable:true,
    get(){ return hp; },
    set(v){
      if(typeof v === 'number' && v < hp && hp > 0 && ui.battle && !ui.battle.arenaImmortal){
        const p = passiveOf(e);
        if(p && p.floors){
          const r = roundNo();
          if(e._flRound !== r){ e._flRound = r; e._flAt = ancFloorBelow(e, hp, p.floors); }
          if(e._flAt > 0 && v < e._flAt){ v = e._flAt; ancFloorHeld(e, p.floors); }
        }
      }
      hp = v;
    } });
}
function ancFloorBelow(e, hp, floors){
  for(const f of floors){ const at = Math.max(1, Math.ceil(e.maxHp * f)); if(at < hp) return at; }
  return 0;
}
function ancFloorHeld(e, floors){
  const r = roundNo();
  if(e._flSaid === r) return;
  e._flSaid = r;
  const pct = Math.round(e._flAt / e.maxHp * 100);
  if(typeof floatOver === 'function') floatOver(e, 'HOLDS');
  setTimeout(()=>{ if(ui.battle) battleMsg(`🔥 The ${escapeHtml(SPECIES[e.species].name)}'s embers hold — it cannot fall below <b>${pct}%</b> this turn!`); }, 800);
}
/* what its card says, in the Test Arena */
function ancNote(v){
  return `Alone, Lv ${ANC_LEVEL}, crowned. Its ✦ Very High on its first action and each time its side recharges (every 7 turns), then its Max every turn.<br>` +
    `<b>Water</b> — Ice Tomb ✦. Hyperspeed: it moves before anything, even a ✦ Mach Dragon. Its Max hits all of yours for 1.2× ATK, and only a dodge stops it.<br>` +
    `<b>Fire</b> — Overheat ✦. In any one turn it loses health only down to 67%, then 34%, then 1%. Its Max hits both of yours for 1× ATK plus all the health it has lost.<br>` +
    `<b>Earth</b> — Spike Armour ✦. Shields Up: a step slower; 3 shields from the start and 3 more every round, each blocking 2× its ATK.<br>` +
    `<b>Grass</b> — Leech Seed ✦. Dodges 75% of attacks (no dust sweeps it). Its Max strikes 18 times at 0.1× ATK, each feeding its seeds.`;
}

let _ancCss = false;
function ancCss(){
  if(_ancCss || typeof document === 'undefined') return;
  _ancCss = true;
  const s = document.createElement('style');
  s.id = 'ancCss';
  s.textContent = `
  .enemy-card.anc-water .avatar-layer .mon-sprite{ filter:drop-shadow(0 0 12px rgba(110,190,255,.9)) drop-shadow(0 4px 6px rgba(0,0,0,.35)) !important; }
  .enemy-card.anc-fire .avatar-layer .mon-sprite{ filter:drop-shadow(0 0 12px rgba(255,130,70,.9)) drop-shadow(0 4px 6px rgba(0,0,0,.35)) !important; }
  .enemy-card.anc-earth .avatar-layer .mon-sprite{ filter:drop-shadow(0 0 12px rgba(220,180,110,.9)) drop-shadow(0 4px 6px rgba(0,0,0,.35)) !important; }
  .enemy-card.anc-grass .avatar-layer .mon-sprite{ filter:drop-shadow(0 0 12px rgba(120,220,110,.9)) drop-shadow(0 4px 6px rgba(0,0,0,.35)) !important; }
  `;
  document.head.appendChild(s);
}

/* ============================================================
   THE WAR (3.92) — the designer's story, as the answers to three
   questions settled it: the King unseals each blade at its own tribe's
   village; the alien forces there are fought as the jungle's bands are
   (a captain's band three waves, a commander's six); the war council is
   the next talk with the King once the court has met you, and each village
   opens as soon as the ancestor before it is calmed.
     · The council (the throne room): the aliens grow bolder; the four
       ancestors could turn the tide — if they can be calmed once woken.
     · North-east, the Water tribe's: no invaders yet. The King unseals the
       blade; the Water Ancestor turns on you; beaten, its guardian calms it.
     · South-east, the Fire tribe's: 2 captains' bands and 1 commander's
       hold the village, the King's knights fighting them; beat every band,
       then the blade, then the Fire Ancestor.
     · South-west, the Earth tribe's: 4 captains, 1 commander.
     · North-west, the Grass tribe's: 5 captains, 2 commanders.
     · Then the throne room: the King's gift, the Psychic Stone.
   Lost — to a band or an ancestor — the knights carry you back to the
   castle, by the tavern fire, to heal and come again: the King waits.
   Calmed, an ancestor stays at its village, gruff but no longer hostile.
   ============================================================ */
const WAR_ORDER = ['water', 'fire', 'earth', 'grass'];          // NE, SE, SW, NW
const WAR_FORCES = { water:{ captains:0, commanders:0 }, fire:{ captains:2, commanders:1 }, earth:{ captains:4, commanders:1 }, grass:{ captains:5, commanders:2 } };
const WAR_BAND_LV = 175;
/* ---------- the save: r6().war ----------
   council (held), calmed{} (each tribe's ancestor), beaten{} (each war band
   by id — for good), said{} (what has been said once), stone (the gift). */
function warState(){
  const r = r6();
  if(!r.war || typeof r.war !== 'object') r.war = {};
  const w = r.war;
  ['calmed', 'beaten', 'said'].forEach(k=>{ if(!w[k] || typeof w[k] !== 'object') w[k] = {}; });
  return w;
}
/* the village the war is at: the first not calmed yet — 'done' after the last, null before the council */
function warStage(){
  if(!state || !state.progress || !state.progress.region6) return null;
  const w = warState();
  if(!w.council) return null;
  return WAR_ORDER.find(k=> !w.calmed[k]) || 'done';
}
const warAncId = k=> 'tribal_ancestor_' + k;
const WAR_VILLAGE = { water:'the Water tribe\'s village, in the north-east', fire:'the Fire tribe\'s village, in the south-east',
                      earth:'the Earth tribe\'s village, in the south-west', grass:'the Grass tribe\'s village, in the north-west' };

/* ---------- the forces at a village: where each band and its knight stand ---------- */
const _warBands = {};
function warBands(k){
  if(_warBands[k]) return _warBands[k];
  const F = WAR_FORCES[k], list = [];
  if(!F || !(F.captains + F.commanders)) return (_warBands[k] = list);
  const V = jgGround().places.villages[k], cx = V.lodge.x + 3, cy = V.lodge.y + 3;
  const R = jgRng(JG.seed ^ (0x7a11 + WAR_ORDER.indexOf(k) * 977)), ri = n=> Math.floor(R() * n);
  const n = F.captains + F.commanders;
  const reserved = new Set();
  const key = (x, y)=> x + ',' + y;
  const hold = (x0, y0, x1, y1)=>{ for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++) reserved.add(key(x, y)); };
  const L = V.lodge, S = warSpots(k);
  hold(L.x - 1, L.y - 1, L.x + L.w, L.y + L.h);                           // the lodge
  hold(L.x + 1, L.y + L.h, L.x + 4, L.y + L.h + 3);                       // the guardian, and where you arrive
  [S.king].concat(S.guards, [S.anc]).forEach(p=> hold(p.x - 1, p.y - 1, p.x + 1, p.y + 1));   // the King, his knights, the ancestor's place
  const free = (x, y)=> !reserved.has(key(x, y)) && !jgSolidAt(x, y) && jgVillageAt(x, y) === k;   // (3.95) on the village's own ground: the maze runs round its oval
  const KNIGHTS = ['chestnut_knight2', 'duck_knight2', 'bug_knight1'];
  for(let i = 0; i < n; i++){
    const rank = i < F.commanders ? 'commander' : 'captain';
    /* each clash side by side, as the pictures face: the knight on the lodge's side, the invader beyond */
    let band = null, knight = null;
    const fits = (bx, by, side)=> free(bx, by) && free(bx - side, by) && free(bx - 2 * side, by) && free(bx - 3 * side, by);
    for(const rad of [1, 0.85, 1.12, 0.72]){                  // its place on the ring, else a little in or out
      let th = -Math.PI / 2 + (i + 0.5) * (Math.PI * 2 / n);
      for(let tries = 0; tries < 57 && !band; tries++, th += 0.11){
        const side = Math.cos(th) >= 0 ? 1 : -1;
        const bx = Math.round(cx + Math.cos(th) * 7.5 * rad), by = Math.round(cy + Math.sin(th) * 6.8 * rad);
        if(fits(bx, by, side)){ band = { x:bx, y:by }; knight = { x:bx - 3 * side, y:by }; }
      }
      if(band) break;
    }
    /* never short of room: anywhere on the village's open ground */
    for(let y = V.y + 2; !band && y < V.y + V.h - 2; y++) for(let x = V.x + 4; !band && x < V.x + V.w - 4; x++){
      const side = x >= cx ? 1 : -1;
      if(fits(x, y, side)){ band = { x, y }; knight = { x:x - 3 * side, y }; }
    }
    if(!band) continue;
    hold(Math.min(band.x, knight.x) - 1, band.y - 2, Math.max(band.x, knight.x) + 1, band.y + 1);   // its ground, and room above for the pictures
    const aliens = [];
    const nA = rank === 'commander' ? 4 : 2;
    for(let a = 0; a < nA; a++) aliens.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]);
    if(rank === 'commander') aliens.push(JG_CAPTAIN, JG_COMMANDER); else aliens.push(JG_CAPTAIN);
    list.push({ id:`war-${k}-${i}`, war:k, rank, tribe:k, lv:WAR_BAND_LV, aliens, lead:aliens[aliens.length - 1], x:band.x, y:band.y,
                knight:{ x:knight.x, y:knight.y, sprite:KNIGHTS[i % KNIGHTS.length] } });
  }
  return (_warBands[k] = list);
}
function warBandsLeft(k){ const w = warState(); return warBands(k).filter(b=> !w.beaten[b.id]); }
/* where the King stands at a village, and his two knights; where its ancestor stays once calmed */
function warSpots(k){
  const V = jgGround().places.villages[k], L = V.lodge;
  return { king:{ x:L.x + 5, y:L.y + L.h + 1 }, guards:[{ x:L.x + 7, y:L.y + L.h + 1 }, { x:L.x - 2, y:L.y + L.h + 1 }], anc:{ x:L.x + L.w + 1, y:L.y + 1 } };
}

/* ---------- the things the war puts in the jungle (jgThings asks) ---------- */
function warJungleThings(list, P){
  WAR_ORDER.forEach(k=>{
    const S = warSpots(k), A = ANC_FOLK[warAncId(k)];
    /* the King, mounted, with two knights, while the war is at this village */
    list.push({ x:S.king.x, y:S.king.y, cls:'jg-npc war-king', faceR:true, html:()=> jgMonImg('fairy_king_mounted_c_front', WALK_T * 2.3, false, 'fairy_king_c_front'),   // (3.96) faces right with face-r, so he can turn to you
      verb:'Talk', sub:'The Fairy King', when:()=> warStage() === k, mark:()=> warStage() === k && !warBandsLeft(k).length, act:()=> warKingVillage(k) });
    S.guards.forEach((g, i)=> list.push({ x:g.x, y:g.y, cls:'jg-npc war-guard', still:true, faceR:i === 1, html:()=> jgMonImg('chestnut_knight2_front', WALK_T * 1.5),
      verb:'Talk', sub:'Chestnut Knight', when:()=> warStage() === k, act:()=> warKnightTalk(k) }));
    /* the invaders, each band fought by one of the King's knights */
    warBands(k).forEach(b=>{
      const dx = b.knight.x - b.x, dy = b.knight.y - b.y;
      list.push({ x:b.x, y:b.y, get cls(){ return 'jg-npc war-alien war-' + b.rank; },
        html:()=> `<div class="war-fig">${jgMonImg(b.lead, WALK_T * (b.rank === 'commander' ? 1.9 : 1.6), dx > 0)}</div>` +
                  `<span class="war-spark" style="left:${50 + dx * 50}%;top:${30 + dy * 50}%;">💥</span>`,
        verb:'Fight', sub:b.rank === 'commander' ? "Commander Octopus's army" : "Captain Humanoid's band",
        when:()=> warStage() === k && !warState().beaten[b.id], act:()=> warFight(b) });
      list.push({ x:b.knight.x, y:b.knight.y, still:true, get cls(){ return 'jg-npc war-knight' + (warState().beaten[b.id] ? ' war-won' : ''); },
        html:()=> `<div class="war-fig">${jgMonImg(b.knight.sprite + '_front', WALK_T * 1.45, dx < 0)}</div>`,
        verb:'Talk', get sub(){ return b.knight.sprite === 'duck_knight2' ? 'Duck Knight' : b.knight.sprite === 'bug_knight1' ? 'Bug Knight' : 'Chestnut Knight'; },
        when:()=> warStage() === k, act:()=> warKnightTalk(k, b) });
    });
    /* calmed: the ancestor stays at its village, gruff but no longer hostile */
    list.push({ x:S.anc.x, y:S.anc.y, cls:'jg-npc war-anc anc-' + k, html:()=> jgMonImg(warAncId(k) + '_front', WALK_T * 2.5),
      verb:'Talk', sub:A ? A.name : 'The ancestor', when:()=> !!warState().calmed[k], act:()=> warAncestorTalk(k) });
  });
  warCss();
}

/* ---------- words ---------- */
const warFace = {
  king:()=> jgFace('fairy_king_mounted_c_front', 'fairy_king_c_front'),
  guardian:k=> jgFace(JG_TRIBES[k].guardian),
  anc:k=> jgFace(warAncId(k) + '_front'),
  knight:()=> jgFace('chestnut_knight2_front'),
  lion:()=> riftLucescoFace(),
  you:()=> facePlayer(),
};
const WAR_NAME = { king:'The Fairy King', knight:'Chestnut Knight', lion:'Lucesco', you:'You' };
/* lines in turn in the jungle: each [who, html] — who: 'king', 'knight', 'lion', 'you', or ['guardian'|'anc', k] */
async function warLines(seq){
  if(ui.jgTalk) return;
  ui.jgTalk = true;
  releaseKeys();
  try {
    for(const [who, html] of seq){
      if(ui.screen !== JG_KEY) break;
      const [w, k] = Array.isArray(who) ? who : [who];
      const face = w === 'guardian' ? warFace.guardian(k) : w === 'anc' ? warFace.anc(k) : warFace[w]();
      const name = w === 'guardian' ? `${JG_TRIBES[k].short} Guardian` : w === 'anc' ? ANC_FOLK[warAncId(k)].name : WAR_NAME[w];
      await jgSay([face], name, html);
    }
  } finally { ui.jgTalk = false; refreshWalk(); }
}

/* ---------- the council: the throne room, the next talk with the King once the court has met you ---------- */
async function warKingCastle(){
  const w = warState(), st = warStage();
  if(!w.council){
    await caLines([
      ['king', `<b>"My friends. Sit with us — the war council will not wait any longer."</b>`],
      ['commander', `<b>"Every day the aliens bring more of their kind through the torn sky. We free our people, and they take more. The walls will not hold forever."</b>`],
      ['king', `<b>"Two hundred years ago, the four tribal ancestors fought each other until the jungle burned. I sealed them in those blades behind me, to make the peace."</b>`],
      ['advisor', `<b>"Hoo. And now we need them. One ancestor is worth a hundred knights. But they will not wake gently, Your Majesty."</b>`],
      ['dauphin', `<b>"Then we fight them until they listen! Our friends here have beaten every alien band they have met."</b>`],
      ['king', `<b>"The guardians remember them. If an ancestor is beaten, its guardian may yet calm it. We wake them one by one — the north-east first, where the Water tribe lives."</b>`],
      ['commander', `<b>"The aliens will hear of it, and try to stop us. After the first, expect them at every village."</b>`],
      ['lion', `<b>"Then we will be there first. I know the way to every corner of this jungle."</b>`],
    ]);
    w.council = true;
    if(typeof jgState === 'function') jgState().found.water = true;
    saveProfile();
    return warOfferRide('water');
  }
  if(st && st !== 'done') return warOfferRide(st);
  if(st === 'done' && !w.stone) return warGift();
  return caLines([['king', caTurn('kingAfter', [
    `<b>"The four ancestors are awake, and with us. Whatever comes through that sky now, we will meet it together."</b>`,
    `<b>"The tribes have not stood with the castle in two hundred years. You did that, my friends."</b>`])]]);
}
/* the King's "!" in the throne room: the council to hold, a ride to take, the gift to give */
function warKingDue(){
  if(!state || !state.progress || !state.progress.region6 || !caState().met.court) return false;
  const w = warState(), st = warStage();
  return !w.council || (st === 'done' && !w.stone);
}
/* "Ride with me": straight to the village — Lucesco knows the way */
async function warOfferRide(k){
  const left = warBandsLeft(k).length;
  const html = `<b>"I ride for ${WAR_VILLAGE[k]}${left ? ' — and the aliens are there before us' : ''}. Will you ride with me?"</b>` +
    (left ? `<br><br><i>${left} alien band${left > 1 ? 's' : ''} hold the village: beat them all, then the King unseals the blade.</i>` : `<br><br><i>The King unseals the blade there; its ancestor will turn on you. Lv ${ANC_LEVEL}, alone.</i>`);
  ui.caTalk = true;
  let yes = false;
  try { yes = await r5Ask([caFace('king')], 'The Fairy King', html, '🐴 Ride with the King', 'Not yet'); }
  finally { ui.caTalk = false; }
  if(yes) warRide(k); else refreshWalk();
}
function warRide(k){
  const j = jgState();
  j.found[k] = true;
  saveProfile();
  if(typeof caLion !== 'undefined') caLion.at = null;
  toast(`🐴 You ride out with the King to ${JG_TRIBES[k].name}.`);
  jgEnter(k);
}

/* ---------- at the village ---------- */
async function warKingVillage(k){
  const left = warBandsLeft(k).length;
  if(left) return warLines([['king', caTurn('warHold' + k, [
    `<b>"They are everywhere! Help my knights drive them out — ${left} band${left > 1 ? 's' : ''} still hold the village."</b>`,
    `<b>"I cannot wake the blade while the invaders stand so close. Clear them, my friends!"</b>`])]]);
  return warUnseal(k);
}
function warKnightTalk(k, b){
  const w = warState();
  if(b && !w.beaten[b.id]) return warLines([['knight', caTurn('warKnight', [`<b>"Hold the line! Hold— oof! Help us, traveller!"</b>`, `<b>"There are too many of them! Their captain is right there!"</b>`])]]);
  return warLines([['knight', caTurn('warKnightWon', [`<b>"We hold the village! Thank you, friend."</b>`, `<b>"For the King! …and for you, of course."</b>`])]]);
}
async function warUnseal(k){
  const w = warState(), first = !w.said['unseal-' + k];
  w.said['unseal-' + k] = true; saveProfile();
  const seq = first ? [
    ['king', `The King lifts the ${k} blade from its sheath. Its chains of light tremble.<br><br><b>"Ancestor of ${JG_TRIBES[k].name.replace(/^the /, 'the ')}. Two hundred years you have slept. Wake now — your people need you."</b>`],
    [['guardian', k], `<b>"Careful, Your Majesty. It will not know us."</b>`],
    [['anc', k], WAR_WAKE[k]],
  ] : [
    ['king', `<b>"Again, my friends. The blade has sealed itself — I will wake it once more."</b>`],
    [['anc', k], `<b>"YOU AGAIN!"</b>`],
  ];
  seq.push(['lion', `<b>"It does not know friend from foe. Get ready!"</b>`]);
  await warLines(seq);
  if(ui.screen !== JG_KEY) return;
  warFightAncestor(k);
}
const WAR_WAKE = {
  water:`The chains burst into spray. The Water Ancestor rises, cold and vast.<br><br><b>"TWO HUNDRED YEARS IN A CAGE OF STEEL. WHO DARES?"</b>`,
  fire:`The chains melt away. The Fire Ancestor bursts out in a roar of flame.<br><br><b>"WHO WOKE ME? WHERE IS THE KING WHO CAGED ME? I WILL BURN HIM!"</b>`,
  earth:`The ground shakes, and the chains crack like stone. The Earth Ancestor heaves itself up.<br><br><b>"…Too… loud. Who… disturbs… the mountain?"</b>`,
  grass:`Vines tear the chains apart. The Grass Ancestor unfolds, laughing.<br><br><b>"Free! FREE! And who is this — fresh little things to play with?"</b>`,
};
function warFightAncestor(k){
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first. Rest by the tavern fire.'); return; }
  releaseKeys();
  jgSave(true);
  const begin = ()=>{
    ui.jgFight = null;
    beginBattle(ancBattle(warAncId(k), { encounter:true, encounterMusic:['battle_legendary', 'battle_boss'], onWin:()=> warAncestorWon(k), onLose:()=> warLost(k) }));
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, ['battle_legendary', 'battle_boss']); else begin();
}
/* beaten: back in the village, its guardian calms it */
function warAncestorWon(k){
  const w = warState();
  w.calmed[k] = true;
  w.said['won-' + k] = true;
  saveProfile();
  ui.walkFresh = false;
  jgEnter(k);
  setTimeout(()=> warCalm(k), 900);
}
async function warCalm(k){
  if(ui.screen !== JG_KEY) return;
  const next = warStage();
  await warLines(WAR_CALM[k].concat([
    next === 'done'
      ? ['king', `<b>"The fourth! The tribes and the castle, together again at last. Come back to the throne room with me, my friends — I have something for you."</b>`]
      : ['king', `<b>"Well fought! On to ${WAR_VILLAGE[next]}. Talk to me when you are ready to ride."</b>`],
  ]));
  if(next && next !== 'done'){ jgState().found[next] = true; saveProfile(); }
}
const WAR_CALM = {
  water:[[['guardian', 'water'], `The Water Guardian steps between you and the ancestor, staff raised.<br><br><b>"Grandmother of the tides! It is us — your people. The King did not wake you for war against us."</b>`],
         [['anc', 'water'], `<b>"…The little guardian. You have grown."</b> The waters settle. <b>"Very well. I will hear him out. But I do not forgive."</b>`]],
  fire: [[['guardian', 'fire'], `<b>"Ancestor! Stop! The aliens burn our forests now — not the King. Turn your fire on them!"</b>`],
         [['anc', 'fire'], `The flames sink to embers. <b>"…Hmph. Aliens. Fine. I will burn THEM. But keep that King out of my sight."</b>`]],
  earth:[[['guardian', 'earth'], `<b>"Great One. Rest your fists. These are friends. The tribe needs you to stand, not to crush."</b>`],
         [['anc', 'earth'], `A long, long rumble. <b>"…Friends. …Mm. The mountain… will stand."</b>`]],
  grass:[[['guardian', 'grass'], `<b>"Elder! Enough games! The jungle itself is dying under the invaders. We need you."</b>`],
         [['anc', 'grass'], `The vines curl away. <b>"Dying? MY jungle? …Oh, that will not do at all. Point me at them, little guardian."</b>`]],
};
function warAncestorTalk(k){
  return warLines([[['anc', k], caTurn('warAnc' + k, WAR_GRUFF[k])]]);
}
const WAR_GRUFF = {
  water:[`<b>"Do not stand so close. I am listening to the tide."</b>`, `<b>"The King caged me. I have not forgotten. …But the invaders are worse."</b>`],
  fire: [`<b>"What? Can't you see I'm busy being angry?"</b>`, `<b>"Point me at an alien. Any alien. Please."</b>`],
  earth:[`<b>"…"</b> It does not move. A pebble rolls off its shoulder.`, `<b>"…Small one. …Strong. …Good."</b>`],
  grass:[`<b>"Hee hee. You again! Want to play? …No? Boring."</b>`, `<b>"The vines tell me everything. The aliens are afraid of you, you know."</b>`],
};
/* lost, to a band or an ancestor: the knights carry you back to the castle, by the tavern fire */
function warLost(k){
  return new Promise(res=>{
    storyModal(jgMonImg('chestnut_knight2_front', 140), '🛡️ Back at the castle',
      `<b>"Easy, easy — we've got you."</b><br><br>The King's knights carried you all the way back to the castle. You wake by the tavern fire.` +
      `<br><br><i>Rest here to heal your team. The King waits at ${WAR_VILLAGE[k || warStage()] || 'the village'}: talk to him in the throne room to ride out again.</i>`,
      ()=>{ res(); const t = caGrounds().tags.tavern; caGo(CA_KEY, [t.door[0], 32]); }, { subtitle:"The Fairy King's castle", bg:'palace' });
  });
}
/* a band at the village: as the jungle's (jgWaves, jgWaveStart, jgWon) — its people freed for their tribe — beaten for good */
function warFight(b){
  if(!b || warState().beaten[b.id] || ui.jgFighting) return;
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first. Rest by the tavern fire.'); return; }
  ui.jgFighting = true;
  releaseKeys();
  jgSave(true);
  const waves = jgWaves(b), lead = SPECIES[b.lead].name;
  const name = b.rank === 'commander' ? `Commander ${lead}'s army` : `Captain ${lead}'s band`;
  const begin = ()=>{
    ui.jgFighting = false;
    ui.jgFight = { id:b.id, rank:b.rank, tribe:b.tribe, waves:waves.length, war:true };
    beginBattle({ waves, isNpc:false, allowCatch:true, name, bgKey:'battle_jungle', foeRegion:6, encounter:true, encounterMusic:JG_FIGHT_MUSIC,
      onWaveStart:(i)=> jgWaveStart(i),
      onWin:(levelUps)=>{ warState().beaten[b.id] = true; jgWon(b, levelUps); },
      onLose:()=>{ ui.jgFight = null; return warLost(b.war); } });
    if(ui.battle) ui.battle.jungle = b.id;
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, JG_FIGHT_MUSIC); else begin();
}

/* ---------- the King's gift, in the throne room, after the fourth ---------- */
async function warGift(){
  const w = warState();
  const st = typeof stoneDef === 'function' ? stoneDef('psychicStone') : null;
  const had = typeof ownsStone === 'function' && ownsStone('psychicStone');
  await caLines([
    ['king', `<b>"Four ancestors woken, and four tribes standing with the castle again. In two hundred years, nobody has done what you have done."</b>`],
    ['king', had ? `<b>"I would give you the Psychic Stone of my house — but I see you carry one already. Then take my thanks, and my kingdom's friendship, always."</b>`
                 : `He holds out a stone that glows a soft violet.<br><br><b>"The Psychic Stone of my house. A Psychic monster that carries it learns half again as fast. Take it, with my thanks."</b>`],
  ]);
  w.stone = true;
  if(!had){ addStone('psychicStone', 1); toast('🔮 You received the Psychic Stone!'); playSfx('stone_high'); }
  saveProfile();
}

let _warCss = false;
function warCss(){
  if(_warCss || typeof document === 'undefined') return;
  _warCss = true;
  const s = document.createElement('style');
  s.id = 'warCss';
  s.textContent = `
  .walk-ent.war-alien, .walk-ent.war-knight, .walk-ent.war-king, .walk-ent.war-anc, .walk-ent.war-guard{ overflow:visible; }
  .walk-ent .war-fig{ position:absolute; inset:0; display:flex; align-items:flex-end; justify-content:center; }
  .walk-ent.war-alien .war-fig{ animation:warLunge 1.1s ease-in-out infinite; filter:drop-shadow(0 0 6px rgba(220,30,40,.85)); }
  .walk-ent.war-knight .war-fig{ animation:warLunge 1.1s ease-in-out infinite; animation-delay:-.55s; }
  .walk-ent.war-knight.war-won .war-fig{ animation:warCheer 1.6s ease-in-out infinite; }
  @keyframes warLunge{ 0%,100%{ transform:translateY(0) scale(1); } 35%{ transform:translateY(-3px) scale(1.04); } 50%{ transform:translateY(1px) scale(.98); } }
  @keyframes warCheer{ 0%,100%{ transform:translateY(0); } 30%{ transform:translateY(-6px); } 45%{ transform:translateY(0); } }
  .walk-ent .war-spark{ position:absolute; transform:translate(-50%,-50%); font-size:18px; pointer-events:none; animation:warSpark 1.1s steps(1) infinite; }
  @keyframes warSpark{ 0%{ opacity:0; } 40%{ opacity:1; } 60%{ opacity:0; } }
  .walk-ent.war-anc .jg-art{ filter:drop-shadow(0 0 10px rgba(255,240,190,.7)); }
  `;
  document.head.appendChild(s);
}
