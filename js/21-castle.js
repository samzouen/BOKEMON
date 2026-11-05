/* ============================================================
   21-castle.js — THE FAIRY KING'S CASTLE (3.88)
   The designer (2026-11-05): "please start creating maps for the fairy
   king's castle so we can open it up. the castle should have an ornate,
   medieval feel, full of fountains, gardens, and a market square with
   different activities. the king's palace within the walls consists of a
   main hall and a central tower."

   Through the jungle's south gate (20-jungle.js), once the King is home:
     · the grounds (r6_castle), 64 × 64 squares, the same square as the
       castle on the jungle's map: the gate court, the avenue, the market
       square with its grand fountain, the gardens and orchards, the houses,
       the palace with its central tower;
     · the walls (r6_wall_n/s/w/e), four squares wide on top, patrolled
       end to end by five Duck Knights and five Bug Knights, four Chestnut
       Knights on lookout; the castle below on the inner side, the forest
       below on the outer, both from high up;
     · the ramparts (r6_ramp_nw/ne/sw/se), one on each corner tower: a
       knight of each kind on lookout, and the jungle's corner of the map
       to look over, scrolling, from up there;
     · the palace (r6_palace): the King's hall, its guard rows, the throne,
       the four sealed blades; its corridors and servants; and the central
       tower's upper chambers (r6_tower), where the younger princess hides;
     · the tavern (r6_tavern) and the record store (r6_records) in the
       market square.

   Every map is drawn from its grid at runtime, square by square, as the
   jungle's is (jgPaint): nothing to upload. The monsters stand in their own
   pictures (assets/mon/<sprite>_front.png); until a picture is there, an
   emoji stands in.

   (3.90) The kingdom's people are monsters now (CA_FOLK): the knights, the
   townsfolk and the palace's Mantis servants can be caught from the alien
   bands nearest the castle; the Royal Commander pays for them freed; the
   Dauphin spars every day; the Painter is home (his portraits to come).
   ============================================================ */

/* ---------- the save: r6().castle ----------
   open (the gate opened for you), seen{} (each place's first look), met{}
   (who you have spoken to), talk{} (where each one's lines are up to). */
function caState(){
  const r = r6();
  if(!r.castle || typeof r.castle !== 'object') r.castle = {};
  const c = r.castle;
  ['seen', 'met', 'talk'].forEach(k=>{ if(!c[k] || typeof c[k] !== 'object') c[k] = {}; });
  return c;
}
function caOpen(){ return !!(state && state.progress && state.progress.region6 && caState().open); }
/* The King is home: the gate can open to anyone who has met its knights. */
function caCanOpen(){ return typeof jgState === 'function' && !!jgState().met.knights; }

/* ---------- who lives here ----------
   Their pictures, by the designer's names: `<sprite>_front.png` (and
   `_back.png` for those who turn away to fetch something). */
const CA_WHO = {
  king:      { sprite:'fairy_king_c',       name:'The Fairy King',      icon:'👑' },
  kingOut:   { sprite:'fairy_king_mounted_c', name:'The Fairy King',    icon:'👑' },
  dauphin:   { sprite:'fairy_dauphin2',     name:'The Dauphin',         icon:'⚔️' },
  princess:  { sprite:'fairy_princess',     name:'The Little Princess', icon:'🎀' },
  commander: { sprite:'chestnut_knight2_c', name:'The Royal Commander', icon:'🛡️' },
  advisor:   { sprite:'fairybird1_c',       name:'The Royal Advisor',   icon:'🐦' },   // (3.90) the picture uploaded
  knight:    { sprite:'chestnut_knight2',   name:'Chestnut Knight',     icon:'🛡️' },
  duck:      { sprite:'duck_knight2',       name:'Duck Knight',         icon:'🦆' },
  bug:       { sprite:'bug_knight1',        name:'Bug Knight',          icon:'🪲' },
  bunnyA:    { sprite:'fairybunny1',        name:'Fairybunny',          icon:'🐰' },
  bunnyB:    { sprite:'fairybunny',         name:'Little Fairybunny',   icon:'🐇' },
  painter:   { sprite:'painter',            name:'The Painter',         icon:'🎨' },
  cream:     { sprite:'cream_fairy1',       name:'Cream Fairy',         icon:'🍮' },
  choux:     { sprite:'choux_fairy1',       name:'Choux Fairy',         icon:'🧁' },
  melody:    { sprite:'melody_fairy',       name:'Melody Fairy',        icon:'🎵' },
  /* (3.90) the palace's servants are Mantises (the designer); townsfolk about the square */
  servant:   { sprite:'mantis1',            name:'A palace servant',    icon:'🧹' },
  servantY:  { sprite:'mantis',             name:'A young servant',     icon:'🧹' },
  townChoux: { sprite:'choux_fairy',        name:'A little Choux Fairy', icon:'🧁' },
  townBunny: { sprite:'fairybunny',         name:'A Fairybunny',        icon:'🐇' },
  townBird:  { sprite:'fairybird',          name:'A Fairybird',         icon:'🐦' },
  townDuck:  { sprite:'duck_knight',        name:'A Duck Knight cadet', icon:'🦆' },
  townCream: { sprite:'cream_fairy',        name:'A little Cream Fairy', icon:'🍮' },
  townMelody:{ sprite:'melody_fairy',       name:'A Melody Fairy',      icon:'🎵' },
};

/* ============================================================
   THE KINGDOM'S MONSTERS (3.90)
   The designer: "citizens and shopkeepers are monsters"; "all monsters
   except the king and princess, tribal guardians, sealed blades and tribal
   ancestors can be caught via the alien fights" — at Lv 98, as the tribes'
   fairies are. Each kit: Basic, Power1, Power2, Ultimate, Max, built from
   mechanics the game already has (their words come with them).
     · the knights: Chestnut Knight (elite, Grass/Physical, tanky damage),
       Duck Knight (Physical/Flying, tank), Bug Knight (Physical/Grass, tank);
     · the townsfolk: Fairybird (elite, support), Cream Fairy (elite, buffs
       and debuffs), Choux Fairy, Fairybunny, Melody Fairy, and the palace's
       servants, the Mantises (Grass/Psychic, confusion and sleep);
     · the royal family, never caught: the Fairy King (legendary,
       Fairy/Psychic, damage and debuffs, Lv 200), the Dauphin (legendary,
       Fairy/Steel, tanky damage), the little princess (legendary,
       Ground/Fairy, a strong buffer that cuts damage; Lv 99, her evolution at
       100 still to come in the story).
   Evolutions past 98 (110, 115, 130): one caught in its first form can still
   reach its last, under Region 6's cap of 150.
   ============================================================ */
const CA_FOLK = {
  chestnut_knight:{ name:'Chestnut Knight', tier:'elite', types:['Grass', 'Physical'], evo:[110, 130], glyph:'栗', color:'#8a5a2b', citizen:true, moves:[
    ['Basic', 'Burr Jab', 0.3, 'Single', 2, 1],
    ['Power1', 'Bristle Rush', 0.5, 'AOE', 4, 1, { shieldGain:1.5 }],
    ['Power2', 'Spiny Husk', null, 'Passive', 0, 21, { passive:{ block:1, riposte:0.5 } }],
    ['Ultimate', 'Chestnut Lance', 1.25, 'Single', 8, 41, { shieldGain:0.75 }],
    ['Max', 'Chestnut Lance Max', 1.5, 'Single', 8, 51, { shieldGain:0.75 }]] },
  duck_knight:    { name:'Duck Knight', tier:'wild', types:['Physical', 'Flying'], evo:[110, 130], glyph:'鸭', color:'#e3b53c', citizen:true, moves:[
    ['Basic', 'Leek Swipe', 0.25, 'Single', 2, 1],
    ['Power1', 'Quack Challenge', 0.4, 'AOE', 4, 5, { taunt:{ turns:1 } }],
    ['Power2', 'Down Padding', null, 'Passive', 0, 18, { passive:{ block:2, armour:0.15 } }],
    ['Ultimate', 'Leek Flurry', 0.6, 'Single', 8, 25, { hits:2 }],
    ['Max', 'Leek Flurry Max', 0.75, 'Single', 8, 51, { hits:2 }]] },
  bug_knight:     { name:'Bug Knight', tier:'wild', types:['Physical', 'Grass'], evo:[115], evoMult:1.5, glyph:'甲', color:'#3f6b4a', citizen:true, moves:[
    ['Basic', 'Horn Poke', 0.25, 'Single', 2, 1],
    ['Power1', 'Carapace Roll', 0.5, 'AOE', 4, 5, { shieldGain:1.5 }],
    ['Power2', 'Chitin Plates', null, 'Passive', 0, 18, { passive:{ block:2, shakeOff:1 } }],
    ['Ultimate', 'Beetle Ram', 1.25, 'Single', 8, 25, { stunHit:0.2 }],
    ['Max', 'Beetle Ram Max', 1.5, 'Single', 8, 51, { stunHit:0.25 }]] },
  fairybird:      { name:'Fairybird', tier:'elite', types:['Fairy', 'Flying'], evo:[115], evoMult:1.5, glyph:'雀', color:'#8ec8ec', citizen:true, moves:[
    ['Basic', 'Cloud Peck', 0.3, 'Single', 2, 1],
    ['Power1', 'Cloud Cushion', null, 'Self', 4, 1, { barrier:{ shields:2, on:'partner', worth:1, icon:'☁️' } }],
    ['Power2', 'Silver Lining', null, 'Passive', 0, 21, { passive:{ cleanseEnd:1, evadeAlways:0.15 } }],
    ['Ultimate', 'Sage Gale', 0.8, 'AOE', 8, 41, { softenHit:{ chance:0.5, amount:0.5 } }],
    ['Max', 'Sage Gale Max', 1.0, 'AOE', 8, 51, { softenHit:{ chance:1, amount:0.5 } }]] },
  cream_fairy:    { name:'Cream Fairy', tier:'elite', types:['Fairy'], evo:[115], evoMult:1.5, glyph:'奶', color:'#f0d9b5', citizen:true, moves:[
    ['Basic', 'Whipped Puff', 0.3, 'Single', 2, 1],
    ['Power1', 'Sweet Comfort', null, 'Self', 4, 1, { mend:{ pct:0.15, fleece:{ reduce:0.15, turns:3 } } }],
    ['Power2', 'Sugar Rush', null, 'Passive', 0, 21, { passive:{ empower:0.15 } }],
    ['Ultimate', 'Cream Splat', 1.25, 'Single', 8, 41, { blindHit:{ miss:0.25, turns:2 } }],
    ['Max', 'Cream Splat Max', 1.5, 'Single', 8, 51, { blindHit:{ miss:0.25, turns:2 } }]] },
  choux_fairy:    { name:'Choux Fairy', tier:'wild', types:['Fairy'], evo:[115], evoMult:1.5, glyph:'泡', color:'#e2ae68', citizen:true, moves:[
    ['Basic', 'Puff Pop', 0.25, 'Single', 2, 1],
    ['Power1', 'Pastry Shield', null, 'Self', 4, 5, { barrier:{ shields:1, on:'partner', worth:2, icon:'🧁' } }],
    ['Power2', 'Powdered Sugar', null, 'Passive', 0, 18, { passive:{ terrorize:0.1 } }],
    ['Ultimate', 'Choux Burst', 0.8, 'AOE', 8, 25, { softenHit:{ chance:0.35, amount:0.5 } }],
    ['Max', 'Choux Burst Max', 1.0, 'AOE', 8, 51, { softenHit:{ chance:0.5, amount:0.5 } }]] },
  fairybunny:     { name:'Fairybunny', tier:'wild', types:['Fairy'], evo:[115], evoMult:1.5, glyph:'兔', color:'#f2a6c2', citizen:true, moves:[
    ['Basic', 'Bunny Hop', 0.25, 'Single', 2, 1],
    ['Power1', 'Bunny Eyes', null, 'Single', 4, 5, { charm:{ turns:3, chance:0.2 } }],
    ['Power2', 'Lucky Paw', null, 'Passive', 0, 18, { passive:{ evadeAlways:0.2 } }],
    ['Ultimate', 'Lucky Comet', 1.25, 'Single', 8, 25, { confuseHit:{ chance:0.25, ffPower:0.6 } }],
    ['Max', 'Lucky Comet Max', 1.5, 'Single', 8, 51, { confuseHit:{ chance:0.3, ffPower:0.6 } }]] },
  melody_fairy:   { name:'Melody Fairy', tier:'wild', types:['Fairy'], evo:[], glyph:'乐', color:'#c69ae6', citizen:true, moves:[
    ['Basic', 'Note Tap', 0.25, 'Single', 2, 1],
    ['Power1', 'Encore', null, 'Self', 4, 5, { enchant:{ deal:1.25, turns:3 } }],
    ['Power2', 'Rousing Rhythm', null, 'Passive', 0, 18, { passive:{ speed:1, cleanseEnd:1 } }],
    ['Ultimate', 'Crescendo', 0.8, 'AOE', 8, 25],
    ['Max', 'Crescendo Max', 1.0, 'AOE', 8, 51, { softenHit:{ chance:0.35, amount:0.5 } }]] },
  mantis:         { name:'Mantis', tier:'wild', types:['Grass', 'Psychic'], evo:[115], evoMult:1.5, glyph:'螳', color:'#e7809e', citizen:true, moves:[
    ['Basic', 'Petal Scythe', 0.25, 'Single', 2, 1],
    ['Power1', 'Sleep Pollen', 0.4, 'AOE', 4, 5, { sleepHit:0.2 }],
    ['Power2', 'Hypnotic Sway', null, 'Passive', 0, 18, { passive:{ hypnosis:0.15 } }],
    ['Ultimate', 'Mesmerise', 0.8, 'AOE', 8, 25, { lunacy:{ chance:0.25, turns:1, ffPower:1, label:'Mesmerise',
      them:'🌀 The swaying scythes mesmerise them — confused!', you:' The swaying scythes mesmerise you — confused!' } }],
    ['Max', 'Mesmerise Max', 1.0, 'AOE', 8, 51, { lunacy:{ chance:0.3, turns:1, ffPower:1, label:'Mesmerise',
      them:'🌀 The swaying scythes mesmerise them — confused!', you:' The swaying scythes mesmerise you — confused!' }, sleepHit:0.15 }]] },
  /* the royal family: never caught */
  fairy_king:     { name:'Fairy King', tier:'legendary', types:['Fairy', 'Psychic'], evo:[], evoMult:1.5, bonusStages:1, glyph:'王', color:'#d6b2f0', royal:true,
    fixedLook:'fairy_king_mounted_c', moves:[
    ['Basic', 'Royal Decree', 0.3, 'Single', 2, 1],
    ['Power1', 'Sovereign Glare', 0.5, 'AOE', 4, 1, { softenHit:{ chance:0.5, amount:0.5 } }],
    ['Power2', 'Fairy Majesty', null, 'Passive', 0, 21, { passive:{ terrorize:0.15, exploit:1.3 } }],
    ['Ultimate', 'Judgement of the Glade', 1.25, 'Single', 8, 41, { confuseHit:{ chance:0.35, ffPower:1 } }],
    ['Max', 'Judgement of the Glade Max', 1.0, 'AOE', 8, 51, { softenHit:{ chance:0.5, amount:0.5 }, lunacy:{ chance:0.3, turns:1, ffPower:1, label:'Royal Judgement',
      them:'👑 The royal judgement shakes their minds — confused!', you:' The royal judgement shakes your minds — confused!' } }]] },
  fairy_dauphin:  { name:'The Dauphin', tier:'legendary', types:['Fairy', 'Steel'], evo:[110, 130], glyph:'储', color:'#ee89b2', royal:true,
    fixedLook:'fairy_dauphin2', moves:[
    ['Basic', 'Hammer Tap', 0.3, 'Single', 2, 1],
    ['Power1', 'Royal Bulwark', 0.5, 'AOE', 4, 1, { shieldGain:1.5 }],
    ['Power2', "Heir's Resolve", null, 'Passive', 0, 21, { passive:{ guardian:true, armour:0.2 } }],
    ['Ultimate', 'Crown Hammer', 1.25, 'Single', 8, 41, { stunHit:0.2, shieldGain:0.75 }],
    ['Max', 'Crown Hammer Max', 1.5, 'Single', 8, 51, { stunHit:0.25, shieldGain:0.75 }]] },
  fairy_princess: { name:'Fairy Princess', tier:'legendary', types:['Ground', 'Fairy'], evo:[100], evoMult:1.5, glyph:'姬', color:'#b4ddf0', royal:true, moves:[
    ['Basic', 'Gem Spark', 0.3, 'Single', 2, 1],
    ['Power1', 'Jewel Ward', null, 'Self', 4, 1, { barrier:{ shields:2, on:'partner', worth:2, icon:'💎' } }],
    ['Power2', 'Royal Grace', null, 'Passive', 0, 21, { passive:{ ward:0.2, wardName:'Royal Grace', cleanseEnd:1 } }],
    ['Ultimate', 'Prism Lullaby', 0.8, 'AOE', 8, 41, { softenHit:{ chance:1, amount:0.5 } }],
    ['Max', 'Prism Lullaby Max', 1.0, 'AOE', 8, 51, { softenHit:{ chance:1, amount:0.5 }, sleepHit:0.15 }]] },
};
const CA_CITIZENS = Object.keys(CA_FOLK).filter(id=> CA_FOLK[id].citizen);
(function caSpecies(){
  if(typeof SPECIES === 'undefined' || typeof MOVES === 'undefined') return;
  const RATE = { wild:[7, 5], elite:[11, 11], legendary:[13, 13] };
  Object.entries(CA_FOLK).forEach(([id, f])=>{
    const [rate, nerfedRate] = RATE[f.tier];
    const sp = { name:f.name, tier:f.tier, types:f.types.slice(), rate, nerfedRate, base:100, evo:f.evo.slice(), color:f.color, glyph:f.glyph, bossOnly:true };
    ['evoMult', 'bonusStages', 'fixedLook', 'citizen'].forEach(k=>{ if(f[k] != null) sp[k] = f[k]; });
    if(f.royal){ sp.royal = true; sp.noCatch = true; }
    SPECIES[id] = sp;
    MOVES[id] = f.moves.map(r=> r.slice());
  });
})();
/* a captive for an alien band near the castle: the townsfolk twice as often as the knights' and the elites' kind */
function caCitizenPick(){
  const w = CA_CITIZENS.map(id=> SPECIES[id].tier === 'wild' && !/_knight$/.test(id) ? 2 : 1);
  let r = Math.random() * w.reduce((a, b)=> a + b, 0);
  for(let i = 0; i < CA_CITIZENS.length; i++){ r -= w[i]; if(r < 0) return CA_CITIZENS[i]; }
  return CA_CITIZENS[0];
}
const CA_BLADES = ['fire', 'ground', 'water', 'grass'];   // sealed_blade_<el>: behind the throne
/* A monster's picture at `px` (its feet on the square's floor), flipped, with
   an emoji standing in until it is uploaded. `view` 'back' when it has turned
   away. */
function caMonImg(sprite, px, flip, icon, view){
  const w = Math.round(px), f = `${sprite}_${view || 'front'}`;
  const back = view === 'back' ? `if(!this.dataset.alt){this.dataset.alt=1;this.src='assets/mon/${sprite}_front.png';return;}` : '';
  return `<img class="ca-art" src="assets/mon/${f}.png" alt="" style="width:${w}px;height:${w}px;${flip ? 'transform:translateX(-50%) scaleX(-1);' : ''}"` +
    ` onerror="${back}walkArtMissing(this,'${icon || '🧚'}',${Math.round(w * 0.62)},0)">`;
}
function caFace(who){
  const c = CA_WHO[who] || {};
  return `<img src="assets/mon/${c.sprite}_front.png" alt="" onerror="this.replaceWith(document.createTextNode('${c.icon || '🧚'}'))">`;
}

/* ============================================================
   THE TILES — one set for every map here
   ============================================================ */
const CA_T = {
  VOID:0, WALL:1, TOWER:2, COBBLE:3, PAVE:4, GRASS:5, PATH:6, HEDGE:7, BED:8, WATER:9, FOUNT:10, TREE:11,
  HOUSE:12, PALACE:13, STALL:14, GATE:15, LAMP:16, BENCH:17, PLANTER:18,
  WALK:19, PARAPET:20, CRENEL:21, NOTCH:22, VIEWIN:23, VIEWOUT:24,
  MARBLE:25, CARPET:26, IWALL:27, COLUMN:28, THRONE:29, DAIS:30, PLANK:31, WOODWALL:32, HEARTH:33,
  TABLE:34, COUNTER:35, SHELF:36, RUG:37, STAIRS:38, PLINTH:39, BEDROYAL:40, WARDROBE:41, STOOL:42, CRATE:43,
};
const CA_WALKABLE = new Set([CA_T.COBBLE, CA_T.PAVE, CA_T.GRASS, CA_T.PATH, CA_T.WALK, CA_T.MARBLE, CA_T.CARPET, CA_T.DAIS, CA_T.PLANK, CA_T.RUG]);
function caSolidCode(t){ return !CA_WALKABLE.has(t); }

/* A map: its grid, the picture of each square (`spr`, chosen as it is
   built), and what stands up over the ground (`deco`). */
function caGrid(W, H, fill){
  return { W, H, g:new Uint8Array(W * H).fill(fill), spr:new Array(W * H).fill(null), deco:[], tags:{} };
}
function caAt(m, x, y){ return (x < 0 || y < 0 || x >= m.W || y >= m.H) ? CA_T.VOID : m.g[y * m.W + x]; }
function caPut(m, x, y, t, spr){ if(x >= 0 && y >= 0 && x < m.W && y < m.H){ m.g[y * m.W + x] = t; m.spr[y * m.W + x] = spr || null; } }
function caFill(m, x0, y0, w, h, t, spr){ for(let y = y0; y < y0 + h; y++) for(let x = x0; x < x0 + w; x++) caPut(m, x, y, t, typeof spr === 'function' ? spr(x, y) : spr); }
function caHash(x, y, k){ return jgHash(x + 977, y + 331, (k || 0) + 5); }
function caDeco(m, kind, x, y, w, h, o){ m.deco.push(Object.assign({ kind, x, y, w:w || 1, h:h || 1 }, o || {})); }
/* What square picture a tile gets when nothing more particular was chosen. */
function caDefaultSpr(m, x, y){
  const t = caAt(m, x, y), v = Math.floor(caHash(x, y, 1) * 6);
  switch(t){
    case CA_T.COBBLE: return 'cobble:' + v;
    case CA_T.PAVE: return 'pave:' + (v % 4);
    case CA_T.GRASS: return 'grass:' + (v % 4);
    case CA_T.PATH: return 'path:' + (v % 3);
    case CA_T.HEDGE: return 'hedge:' + (v % 3);
    case CA_T.WATER: case CA_T.FOUNT: return 'water';
    case CA_T.WALK: return 'wtop:' + (v % 4);
    case CA_T.MARBLE: return 'marble:' + ((x + y) & 1);
    case CA_T.PLANK: return 'plank:' + (y % 3);
    case CA_T.RUG: return 'rug:' + ((x + y) & 1);
    case CA_T.DAIS: return 'dais';
    default: return null;
  }
}

/* ============================================================
   THE GROUNDS — made once
   x across 0–63, y down 0–63, as the castle's square on the jungle's map.
   ============================================================ */
const CA_KEY = 'r6_castle';
let _caGrounds = null;
function caGrounds(){
  if(_caGrounds) return _caGrounds;
  const T = CA_T, W = 64, H = 64, m = caGrid(W, H, T.GRASS);
  const fill = (x, y, w, h, t, s)=> caFill(m, x, y, w, h, t, s);
  /* the walls (three deep) and the four corner towers, each with its door */
  fill(0, 0, W, H, T.WALL);
  fill(3, 3, W - 6, H - 6, T.GRASS);
  [[0, 0], [54, 0], [0, 54], [54, 54]].forEach(([x, y])=> fill(x, y, 10, 10, T.TOWER));
  m.tags.towers = { nw:{ x:0, y:0 }, ne:{ x:54, y:0 }, sw:{ x:0, y:54 }, se:{ x:54, y:54 } };
  m.tags.towerDoors = { nw:{ x:6, y:9, stand:{ x:6, y:10 } }, ne:{ x:57, y:9, stand:{ x:57, y:10 } },
                        sw:{ x:6, y:54, stand:{ x:6, y:53 } }, se:{ x:57, y:54, stand:{ x:57, y:53 } } };
  /* the ring road inside the walls, and the courts before the towers' doors */
  fill(10, 3, 44, 2, T.COBBLE); fill(10, 59, 44, 2, T.COBBLE);
  fill(3, 10, 2, 44, T.COBBLE); fill(59, 10, 2, 44, T.COBBLE);
  fill(3, 10, 7, 2, T.COBBLE); fill(54, 10, 7, 2, T.COBBLE); fill(3, 52, 7, 2, T.COBBLE); fill(54, 52, 7, 2, T.COBBLE);
  /* the gate (in the south wall) and its court */
  fill(30, 61, 4, 3, T.GATE);
  m.tags.gate = { x:30, y:60, w:4 };
  fill(25, 54, 14, 7, T.PAVE);
  /* the avenue from the gate court to the market square, and on to the palace */
  fill(29, 46, 6, 8, T.COBBLE);
  fill(29, 26, 6, 6, T.COBBLE);
  /* the street along the market's south side, and the houses' street */
  fill(5, 46, 54, 1, T.COBBLE);
  fill(5, 52, 23, 2, T.COBBLE); fill(36, 52, 23, 2, T.COBBLE);
  /* the market square: paving, its grand fountain in a ring of mosaic */
  fill(14, 32, 36, 14, T.PAVE);
  const fc = { x:31.5, y:38.5 };
  m.tags.fountain = fc;
  for(let y = 32; y < 46; y++) for(let x = 14; x < 50; x++){
    const d = Math.hypot((x + 0.5 - fc.x) / 1.15, y + 0.5 - fc.y);
    if(d < 3.6) caPut(m, x, y, T.WATER);
    else if(d < 5.6) caPut(m, x, y, T.PAVE, 'mosaic:' + Math.floor((Math.atan2(y + 0.5 - fc.y, x + 0.5 - fc.x) + Math.PI) / (Math.PI / 4)) % 8);
  }
  fill(31, 38, 2, 2, T.FOUNT);
  caDeco(m, 'fountGrand', 28.5, 34.2, 6, 6.2, { z:41 });
  /* its stalls: the two open-air shops (west, east), the fruit and flower sellers */
  m.tags.stalls = {
    retail: { x:16, y:35, w:5, scheme:'rose', keepers:[{ who:'bunnyA', x:17, y:34 }, { who:'bunnyB', x:19, y:34 }], stand:{ x:18, y:36 } },
    painter:{ x:43, y:35, w:5, scheme:'blue', keepers:[{ who:'painter', x:45, y:34 }], stand:{ x:45, y:36 } },
    fruit:  { x:16, y:42, w:4, scheme:'green', goods:'fruit' },
    flower: { x:44, y:42, w:4, scheme:'gold', goods:'flower' },
  };
  Object.values(m.tags.stalls).forEach(s=>{
    fill(s.x, s.y, s.w, 1, T.STALL, (x)=> 'stall-' + s.scheme + ':' + (x === s.x ? 'l' : x === s.x + s.w - 1 ? 'r' : 'm'));
    caDeco(m, 'awning', s.x, s.y - 1.15, s.w, 1.15, { scheme:s.scheme, goods:s.goods || '', z:s.y + 0.1 });
  });
  m.tags.stalls.painter.easel = { x:42, y:34 };
  caDeco(m, 'easel', 41.6, 33.2, 1.2, 1.8, { z:34.9 });
  [[27, 35], [36, 35], [27, 42], [36, 42]].forEach(([x, y])=> caPut(m, x, y, T.BENCH, 'bench'));
  [[15, 33], [48, 33], [15, 44], [48, 44], [28, 48], [35, 48], [28, 51], [35, 51], [28, 27], [35, 27], [28, 30], [35, 30]].forEach(([x, y])=>{
    const under = caAt(m, x, y);
    caPut(m, x, y, T.LAMP, under === T.PAVE ? 'pave:1' : under === T.COBBLE ? 'cobble:2' : 'grass:1'); caDeco(m, 'lamp', x, y - 1.3, 1, 2.3, { z:y + 0.5 });
  });
  /* a well and a notice board: the square's other goings-on */
  caPut(m, 23, 43, T.PLANTER, 'well'); m.tags.well = { x:23, y:43 };
  caPut(m, 40, 43, T.PLANTER, 'board'); caDeco(m, 'board', 39.9, 42.2, 1.2, 1.9, { z:43.4 }); m.tags.board = { x:40, y:43 };
  /* the tavern and the record store, fronting the square's north side */
  m.tags.buildings = [];
  const house = (x, y, w, h, scheme, o)=>{
    const b = Object.assign({ x, y, w, h, scheme }, o || {});
    m.tags.buildings.push(b);
    const front = b.front || 2;
    for(let yy = y; yy < y + h; yy++) for(let xx = x; xx < x + w; xx++){
      const roof = yy < y + h - front, edgeL = xx === x, edgeR = xx === x + w - 1;
      let part;
      if(roof) part = yy === y ? 'ridge' : (edgeL ? 'roofL' : edgeR ? 'roofR' : 'roof');
      else {
        const low = yy === y + h - 1, door = low && (b.door || []).includes(xx);
        part = door ? (b.door.indexOf(xx) === 0 ? 'doorL' : 'doorR') : low ? ((xx - x) % 2 ? 'base' : 'baseWin') : ((xx - x) % 2 === 0 ? 'win' : 'wall');
      }
      caPut(m, xx, yy, T.HOUSE, 'house-' + scheme + ':' + part);
    }
    if(b.sign) caDeco(m, 'sign', x + w / 2 - 0.8, y + h - front - 0.35, 1.6, 0.9, { text:b.sign, scheme, z:y + h - 0.6 });
    if(b.chimney) caDeco(m, 'chimney', x + w - 2.2, y - 0.9, 0.9, 1.6, { z:y });
    return b;
  };
  m.tags.tavern = house(14, 25, 8, 7, 'tavern', { door:[17, 18], sign:'🍺', chimney:true, front:3 });
  m.tags.records = house(42, 25, 8, 7, 'records', { door:[45, 46], sign:'🎵', front:3 });
  /* the palace: the King's hall, its two front towers, the central tower over it all */
  for(let y = 8; y < 20; y++) for(let x = 18; x < 46; x++){
    const ix = x - 18, iy = y - 8;
    let part;
    if(iy < 6) part = iy === 0 ? 'ridge' : 'roof';
    else if(iy === 6) part = 'cornice';
    else if(iy < 11) part = (ix % 3 === 1) ? 'win' : (ix % 3 === 0 ? 'pilaster' : 'wall');
    else part = (x === 31 || x === 32) ? (x === 31 ? 'doorL' : 'doorR') : (ix % 3 === 1 ? 'baseWin' : 'base');
    caPut(m, x, y, T.PALACE, 'palace:' + part);
  }
  m.tags.palaceDoor = { x:31, y:19, w:2 };
  caDeco(m, 'palaceTower', 16.6, 4.2, 4.2, 15.9, { z:19.2 });
  caDeco(m, 'palaceTower', 43.2, 4.2, 4.2, 15.9, { z:19.2 });
  caDeco(m, 'keep', 27.5, -1.2, 9, 15.4, { z:13.8 });
  [[22, 12.2], [26, 12.2], [37, 12.2], [41, 12.2]].forEach(([x, y])=> caDeco(m, 'banner', x, y, 1, 2.5, { z:19.1 }));
  /* the forecourt: steps up to the door, a fountain on either hand */
  fill(18, 20, 28, 6, T.PAVE);
  fill(30, 20, 4, 1, T.PAVE, (x)=> 'steps:' + (x - 30));
  [[20, 21], [41, 21]].forEach(([x, y])=>{
    fill(x, y, 3, 3, T.WATER, 'water'); caPut(m, x + 1, y + 1, T.FOUNT, 'water');
    caDeco(m, 'fountSmall', x - 0.15, y - 1.1, 3.3, 4.2, { z:y + 2.6 });
  });
  m.tags.palaceGuards = [{ x:29, y:20 }, { x:34, y:20 }];
  /* the gardens: west and east of the palace and the avenue — box hedges,
     flower beds, gravel walks, a pond with its fountain, blossom and cypress */
  const garden = (x0, y0, w, h, mirror)=>{
    fill(x0, y0, w, h, T.GRASS);
    fill(x0, y0, w, 1, T.HEDGE); fill(x0, y0 + h - 1, w, 1, T.HEDGE);
    fill(x0, y0, 1, h, T.HEDGE); fill(x0 + w - 1, y0, 1, h, T.HEDGE);
    const gx = x0 + Math.floor(w / 2) - 1, cy = y0 + Math.floor(h / 2);
    fill(gx, y0, 2, h, T.PATH); fill(x0, cy, w, 2, T.PATH);
    const bed = (bx, by, bw, bh, c)=> fill(bx, by, bw, bh, T.BED, 'bed:' + c);
    bed(x0 + 1, y0 + 2, gx - x0 - 2, 2, 'pink'); bed(gx + 3, y0 + 2, x0 + w - gx - 5, 2, 'gold');
    bed(x0 + 1, y0 + h - 4, gx - x0 - 2, 2, 'violet'); bed(gx + 3, y0 + h - 4, x0 + w - gx - 5, 2, 'white');
    /* a round pond where the walks cross, its fountain in the middle, the gravel going round it */
    fill(gx - 2, cy - 2, 6, 6, T.PATH);
    fill(gx - 1, cy - 1, 4, 4, T.WATER, 'water');
    [[gx - 1, cy - 1], [gx + 2, cy - 1], [gx - 1, cy + 2], [gx + 2, cy + 2]].forEach(([x, y])=> caPut(m, x, y, T.PATH));
    caPut(m, gx, cy, T.FOUNT, 'water'); caPut(m, gx + 1, cy, T.FOUNT, 'water'); caPut(m, gx, cy + 1, T.FOUNT, 'water'); caPut(m, gx + 1, cy + 1, T.FOUNT, 'water');
    caDeco(m, 'fountSmall', gx - 0.65, cy - 1.6, 3.3, 4.2, { z:cy + 2.1 });
    [[x0 + 2, y0 + 5], [x0 + w - 3, y0 + 5], [x0 + 2, y0 + h - 6], [x0 + w - 3, y0 + h - 6]].forEach(([tx, ty], i)=>{
      if(caAt(m, tx, ty) === T.GRASS){ caPut(m, tx, ty, T.TREE); caDeco(m, 'tree', tx - 0.5, ty - 1.25, 2, 2.2, { variant:(i + (mirror ? 1 : 0)) % 2 ? 'blossom' : 'cypress', z:ty + 0.9 }); }
    });
  };
  garden(5, 12, 11, 19, false);
  garden(48, 12, 11, 19, true);
  /* hedges and gaps: the gardens open onto the ring road and the forecourt */
  [[5, 21], [5, 22], [15, 21], [15, 22], [58, 21], [58, 22], [48, 21], [48, 22], [10, 12], [11, 12], [53, 12], [54, 12], [10, 30], [11, 30], [53, 30], [54, 30]].forEach(([x, y])=> caPut(m, x, y, T.PATH));
  /* topiary beside the palace */
  for(let x = 10; x < 18; x += 3){ caPut(m, x, 7, T.HEDGE, 'topiary'); caPut(m, x + 36, 7, T.HEDGE, 'topiary'); }
  fill(10, 5, 8, 1, T.PATH); fill(46, 5, 8, 1, T.PATH);
  /* the orchards beside the market */
  const orchard = (x0, y0, w, h)=>{
    fill(x0, y0, w, h, T.GRASS);
    for(let y = y0 + 1; y < y0 + h - 1; y += 3) for(let x = x0 + 1; x < x0 + w - 1; x += 3){
      caPut(m, x, y, T.TREE); caDeco(m, 'tree', x - 0.5, y - 1.25, 2, 2.2, { variant:(x + y) % 3 ? 'apple' : 'pear', z:y + 0.9 });
    }
    fill(x0, y0 + Math.floor(h / 2), w, 1, T.PATH);
  };
  orchard(5, 32, 8, 14); orchard(51, 32, 8, 14);
  /* the houses: a row along the houses' street on each side of the avenue, another along the ring road */
  const SCHEMES = ['red', 'blue', 'green', 'plum', 'ochre'];
  let hn = 0;
  const row = (x0, x1, y, h, doorRow)=>{
    for(let x = x0; x + 5 <= x1; x += 6){
      const w = 5, door = [x + 1 + (hn % 2) * 2];
      house(x, y, w, h, SCHEMES[hn++ % SCHEMES.length], { door, chimney:hn % 3 === 0 });
    }
  };
  row(5, 28, 47, 5); row(36, 59, 47, 5);
  row(10, 28, 54, 5); row(36, 54, 54, 5);                              // between the corner towers
  /* the avenue's planters and the gate court's */
  [[26, 55], [37, 55], [26, 59], [37, 59]].forEach(([x, y])=> caPut(m, x, y, T.PLANTER, 'planter'));
  /* anything walkable that can't be reached from the gate goes back to grass with a bush on it */
  const reach = new Uint8Array(W * H), q = [m.tags.gate.y * W + m.tags.gate.x];
  reach[q[0]] = 1;
  while(q.length){
    const v = q.pop(), x = v % W, y = (v - x) / W;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=>{
      const a = x + dx, b = y + dy;
      if(a < 0 || b < 0 || a >= W || b >= H) return;
      const u = b * W + a;
      if(!reach[u] && !caSolidCode(m.g[u])){ reach[u] = 1; q.push(u); }
    });
  }
  m.reach = reach;
  for(let i = 0; i < W * H; i++) if(!caSolidCode(m.g[i]) && !reach[i]){ m.g[i] = T.HEDGE; m.spr[i] = 'hedge:' + (i % 3); }
  /* every square without a picture of its own gets the ground's */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const i = y * W + x;
    if(m.spr[i]) continue;
    const t = m.g[i];
    if(t === T.WALL){
      const inner = Math.min(x, y, W - 1 - x, H - 1 - y);
      m.spr[i] = inner === 2 && y >= 2 && y <= H - 3 && x >= 2 && x <= W - 3 ? (y === 2 ? 'wallN' : y === H - 3 ? 'wallS' : x === 2 ? 'wallW' : 'wallE') : 'wallTop';
    } else if(t === T.TOWER) m.spr[i] = 'towerTop';
    else if(t === T.GATE) m.spr[i] = 'gate:' + (x - 30) + (y === 61 ? 'i' : 'o');
    else if(t === T.TREE || t === T.LAMP) m.spr[i] = 'grass:' + (i % 4);
    else m.spr[i] = caDefaultSpr(m, x, y);
  }
  Object.entries(m.tags.towerDoors).forEach(([k, d])=>{ m.spr[d.y * W + d.x] = 'towerDoor:' + (d.y < 30 ? 's' : 'n'); });
  ['nw', 'ne', 'sw', 'se'].forEach(k=>{ const t = m.tags.towers[k]; caDeco(m, 'cornerTower', t.x + 0.4, t.y - 1.6, 9.2, 11.4, { corner:k, z:t.y + 9.6 }); });
  m.deco.sort((a, b)=> a.z - b.z);
  _caGrounds = m;
  return m;
}

/* ============================================================
   THE PAINTER — what is in view, only (as the jungle's, jgPaint)
   ------------------------------------------------------------
   A map's squares from their pictures (an atlas, drawn once at the size they
   are shown), then what stands up over them (deco), back to front. A wall's
   or a rampart's views (`views`) are another map drawn smaller under it —
   the castle on the inner side, the jungle on the outer — moving more slowly
   than the wall as you walk, so it lies far below.
   ============================================================ */
const CA_P = { cv:null, stage:null, world:null, raf:0, key:'', last:0, atlas:null, S:0, map:null, views:null, bg:'#2b2a33' };
function caPaintStart(stage, world, m, views, bg){
  if(!stage || !world) return;
  let cv = stage.querySelector('canvas.ca-ground');
  if(!cv){
    cv = document.createElement('canvas');
    cv.className = 'ca-ground';
    cv.setAttribute('aria-hidden', 'true');
    stage.insertBefore(cv, stage.firstChild);
  }
  Object.assign(CA_P, { cv, stage, world, key:'', last:0, map:m, views:views || null, bg:bg || '#2b2a33' });
  if(!CA_P.raf && typeof requestAnimationFrame === 'function') CA_P.raf = requestAnimationFrame(caPaintTick);
}
function caPaintTick(now){
  CA_P.raf = 0;
  if(!CA_P.cv || !CA_P.cv.isConnected) return;
  const cam = riftCam(CA_P.world);
  if(cam.key !== CA_P.key || now - CA_P.last > 160){
    CA_P.key = cam.key; CA_P.last = now;
    try { caPaintDraw(cam, now); } catch(e){ console.error('castle paint:', e); }
  }
  CA_P.raf = requestAnimationFrame(caPaintTick);
}
function caSpr(key){
  const A = CA_P.atlas || (CA_P.atlas = new Map());
  let c = A.get(key);
  if(c) return c;
  const S = CA_P.S || 48;
  c = document.createElement('canvas');
  c.width = c.height = S;
  caDrawSprite(c.getContext('2d'), key, S);
  A.set(key, c);
  return c;
}
function caPaintDraw(cam, now){
  const cv = CA_P.cv, st = CA_P.stage, m = CA_P.map;
  if(!m) return;
  const W = st.clientWidth, H = st.clientHeight;
  if(!W || !H) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if(cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)){ cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d');
  const k = WALK_T * (cam.s || 1) * dpr, S = Math.max(8, Math.round(k));
  if(!CA_P.atlas || CA_P.S !== S){ CA_P.atlas = new Map(); CA_P.S = S; }
  const ox = dpr * (W / 2 + cam.e), oy = dpr * (H / 2 + cam.f);
  const x0 = Math.floor(-ox / k) - 1, y0 = Math.floor(-oy / k) - 1;
  const x1 = Math.ceil((cv.width - ox) / k) + 1, y1 = Math.ceil((cv.height - oy) / k) + 1;
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = CA_P.bg; ctx.fillRect(0, 0, cv.width, cv.height);
  const frame = Math.floor(now / 380) % 4;
  /* the far views first: they lie under the wall */
  if(CA_P.views) CA_P.views.forEach(v=> caDrawView(ctx, v, k, ox, oy, x0, y0, x1, y1, frame, now));
  for(let y = Math.max(0, y0); y <= Math.min(m.H - 1, y1); y++){
    const py = Math.round(oy + y * k), ph = Math.round(oy + (y + 1) * k) - py;
    for(let x = Math.max(0, x0); x <= Math.min(m.W - 1, x1); x++){
      const i = y * m.W + x, t = m.g[i];
      if(t === CA_T.VIEWIN || t === CA_T.VIEWOUT || t === CA_T.VOID) continue;
      const px = Math.round(ox + x * k), pw = Math.round(ox + (x + 1) * k) - px;
      let key = m.spr[i];
      if(key === 'water') key = 'water:' + ((frame + (x * 3 + y) % 4) % 4);
      if(key) ctx.drawImage(caSpr(key), px, py, pw, ph);
      caEdges(ctx, m, x, y, t, px, py, pw, ph);
    }
  }
  /* what stands up: back to front */
  m.deco.forEach(d=>{
    if(d.x + d.w < x0 - 1 || d.x > x1 + 1 || d.y + d.h < y0 - 1 || d.y > y1 + 1) return;
    caDrawDeco(ctx, d, ox + d.x * k, oy + d.y * k, d.w * k, d.h * k, now);
  });
}
/* the seams between squares: water's stone rim, the shade a wall or a hedge throws to the south */
function caEdges(ctx, m, x, y, t, px, py, pw, ph){
  const T = CA_T;
  if(t === T.WATER){
    const e = Math.max(1, Math.round(pw * 0.14));
    ctx.fillStyle = '#d9d2c3';
    const isW = (a, b)=>{ const u = caAt(m, a, b); return u === T.WATER || u === T.FOUNT; };
    if(!isW(x, y - 1)) ctx.fillRect(px, py, pw, e);
    if(!isW(x, y + 1)){ ctx.fillRect(px, py + ph - e, pw, e); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(px, py + ph - 1, pw, 2); ctx.fillStyle = '#d9d2c3'; }
    if(!isW(x - 1, y)) ctx.fillRect(px, py, e, ph);
    if(!isW(x + 1, y)) ctx.fillRect(px + pw - e, py, e, ph);
    return;
  }
  if(!caSolidCode(t)){
    const n = caAt(m, x, y - 1);
    if(n === T.HEDGE || n === T.HOUSE || n === T.PALACE || n === T.WALL || n === T.TOWER || n === T.IWALL || n === T.WOODWALL || n === T.PARAPET || n === T.CRENEL || n === T.STALL || n === T.COUNTER || n === T.SHELF){
      const gr = ctx.createLinearGradient(0, py, 0, py + ph * 0.45);
      gr.addColorStop(0, 'rgba(20,14,30,.34)'); gr.addColorStop(1, 'rgba(20,14,30,0)');
      ctx.fillStyle = gr; ctx.fillRect(px, py, pw, ph * 0.45);
    }
  }
}
/* ---------- the far views (walls, ramparts) ----------
   v: { src:'castle'|'jungle', x0, y0, x1, y1 (the squares of this map it fills),
        along:'x'|'y' (the way the wall runs), at0/src0 (a square along the wall and the source's square there),
        edge (this map's coordinate at the wall's foot), srcEdge (the source's there), out (+1: away is larger here),
        srcOut (+1: away is larger in the source), f (how much smaller) } */
function caDrawView(ctx, v, k, ox, oy, x0, y0, x1, y1, frame, now){
  const cx0 = Math.max(v.x0, x0), cy0 = Math.max(v.y0, y0), cx1 = Math.min(v.x1, x1 + 1), cy1 = Math.min(v.y1, y1 + 1);
  if(cx0 >= cx1 || cy0 >= cy1) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(ox + cx0 * k, oy + cy0 * k, (cx1 - cx0) * k, (cy1 - cy0) * k); ctx.clip();
  ctx.fillStyle = v.src === 'jungle' ? '#163a22' : '#4d6b3a'; ctx.fillRect(ox + cx0 * k, oy + cy0 * k, (cx1 - cx0) * k, (cy1 - cy0) * k);
  const p = caYou(), camAlong = p ? (v.along === 'x' ? p.x + 0.5 : p.y + 0.5) : (v.at0 + 0.5);
  const f = v.f || 0.62, kk = k * f;
  const camSrc = v.src0 + (camAlong - v.at0);                     // the source's square below you
  /* the source squares that can show: along, those within the view's width; away, its depth */
  const alongLo = v.along === 'x' ? cx0 : cy0, alongHi = v.along === 'x' ? cx1 : cy1;
  const deepLo = v.along === 'x' ? cy0 : cx0, deepHi = v.along === 'x' ? cy1 : cx1;
  const sA0 = Math.floor(camSrc + (alongLo - camAlong) / f) - 1, sA1 = Math.ceil(camSrc + (alongHi - camAlong) / f) + 1;
  const dist = (here)=> (here - v.edge) * v.out;                    // how far from the wall's foot, in this map's squares
  const dMax = Math.max(dist(deepLo), dist(deepHi)) / f + 1;
  const jg = v.src === 'jungle', gm = jg ? null : caGrounds();
  for(let d = 0; d <= dMax; d++){
    const sDeep = v.srcEdge + v.srcOut * d;
    for(let a = sA0; a <= sA1; a++){
      const along = camAlong + (a - camSrc) * f;
      const deep = v.edge + v.out * d * f;
      const X = v.along === 'x' ? along : (v.out > 0 ? deep : deep - f), Y = v.along === 'x' ? (v.out > 0 ? deep : deep - f) : along;
      const px = Math.round(ox + X * k), py = Math.round(oy + Y * k), pw = Math.ceil(kk) + 1, ph = Math.ceil(kk) + 1;
      const sx = v.along === 'x' ? a : sDeep, sy = v.along === 'x' ? sDeep : a;
      if(jg){ jgPaintTile(ctx, sx, sy, px, py, pw, ph, frame); }
      else {
        if(sx < 0 || sy < 0 || sx >= gm.W || sy >= gm.H) continue;
        let key = gm.spr[sy * gm.W + sx];
        if(key === 'water') key = 'water:' + frame;
        if(key) ctx.drawImage(caSpr(key), px, py, pw, ph);
      }
    }
  }
  /* trees and towers down there stand up too (the castle's), and the jungle's trees */
  if(!jg){
    gm.deco.forEach(dd=>{
      if(dd.kind === 'cornerTower') return;                          // the tower under your feet, and its kin: part of the walls
      const a = v.along === 'x' ? dd.x : dd.y, dpt = v.along === 'x' ? dd.y : dd.x, len = v.along === 'x' ? dd.w : dd.h;
      if(a + len < sA0 || a > sA1) return;
      const dd0 = (dpt - v.srcEdge) * v.srcOut;
      if(dd0 + (v.along === 'x' ? dd.h : dd.w) < -1 || dd0 > dMax + 2) return;
      const along = camAlong + (a - camSrc) * f, deep = v.edge + v.out * dd0 * f;
      const X = v.along === 'x' ? along : (v.out > 0 ? deep : deep - dd.w * f), Y = v.along === 'x' ? (v.out > 0 ? deep : deep - dd.h * f) : along;
      caDrawDeco(ctx, dd, ox + X * k, oy + Y * k, dd.w * kk, dd.h * kk, now);
    });
  } else {
    for(let d = 0; d <= dMax; d++) for(let a = sA0; a <= sA1; a++){
      const sx = v.along === 'x' ? a : v.srcEdge + v.srcOut * d, sy = v.along === 'x' ? v.srcEdge + v.srcOut * d : a;
      if(jgTile(sx, sy) !== JG_T.TREE) continue;
      const along = camAlong + (a - camSrc) * f, deep = v.edge + v.out * d * f;
      const X = v.along === 'x' ? along : deep, Y = v.along === 'x' ? deep : along;
      ctx.drawImage(jgSprite('tree', jgHash(sx, sy, 3) < 0.5 ? 0 : 1), Math.round(ox + (X - 0.5 * f) * k), Math.round(oy + (Y - 1.2 * f) * k), Math.round(2 * kk), Math.round(2 * kk));
    }
  }
  /* height: the wall's long shadow at its foot, and a haze over the far side */
  const rx = ox + cx0 * k, ry = oy + cy0 * k, rw = (cx1 - cx0) * k, rh = (cy1 - cy0) * k;
  const footX = ox + v.edge * k, footY = oy + v.edge * k;
  let gr;
  if(v.along === 'x') gr = ctx.createLinearGradient(0, footY, 0, footY + v.out * 3.2 * k);
  else gr = ctx.createLinearGradient(footX, 0, footX + v.out * 3.2 * k, 0);
  gr.addColorStop(0, 'rgba(18,12,30,.55)'); gr.addColorStop(0.35, 'rgba(18,12,30,.18)'); gr.addColorStop(1, 'rgba(180,200,230,.16)');
  ctx.fillStyle = gr; ctx.fillRect(rx, ry, rw, rh);
  ctx.restore();
}
/* where you stand on the deck now */
function caYou(){ const w = walkState(); return w && w.at && w.at[w.deck]; }

/* ============================================================
   THE PICTURES — each square drawn once at its size
   ============================================================ */
function caShade(hex, f){
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v=> Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))));
  return '#' + c.map(v=> v.toString(16).padStart(2, '0')).join('');
}
const CA_HOUSE = {
  red:    { roof:'#b5452f', roof2:'#cf6243', wall:'#f2e6cc', beam:'#6b4426', door:'#7a3f22' },
  blue:   { roof:'#3f5e9a', roof2:'#5a7cbc', wall:'#efe7d4', beam:'#5a4632', door:'#2f4a73' },
  green:  { roof:'#3f7d4f', roof2:'#58996a', wall:'#f3ead2', beam:'#5e4a2c', door:'#365c3a' },
  plum:   { roof:'#7a4a86', roof2:'#9764a3', wall:'#f1e5da', beam:'#5a3b52', door:'#5e3366' },
  ochre:  { roof:'#c08a2e', roof2:'#d9a648', wall:'#f4ecd6', beam:'#6b5230', door:'#8a5a22' },
  tavern: { roof:'#6e4a2e', roof2:'#8c6340', wall:'#e7c99a', beam:'#4a3020', door:'#5c3a1e' },
  records:{ roof:'#3e3a72', roof2:'#5a55a0', wall:'#e9e2f4', beam:'#3a3358', door:'#2c6b6e' },
};
const CA_STALL = { rose:['#d8476a', '#fbe3ea'], blue:['#3c6fc4', '#e3edfb'], green:['#3f9d5a', '#e6f5e6'], gold:['#d59a26', '#fdf2d6'] };
function caDrawSprite(g, key, S){
  const [kind, vr] = key.split(':');
  const n = parseInt(vr, 10) || 0;
  const h = (k)=> jgHash(n * 31 + kind.length * 7, (vr || '').length * 13 + 5, k);
  const R = (x, y, w, hh, c)=>{ g.fillStyle = c; g.fillRect(Math.round(x * S), Math.round(y * S), Math.ceil(w * S), Math.ceil(hh * S)); };
  const dots = (base, cols, count, size)=>{
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    for(let k = 0; k < count; k++){ g.fillStyle = cols[k % cols.length]; g.beginPath(); g.arc(h(k) * S, h(k + 40) * S, S * (0.02 + h(k + 80) * size), 0, Math.PI * 2); g.fill(); }
  };
  const tufts = (col, count)=>{
    g.strokeStyle = col; g.lineWidth = Math.max(1, S / 24); g.lineCap = 'round';
    for(let k = 0; k < count; k++){
      const bx = S * (0.15 + 0.7 * h(k + 120)), by = S * (0.3 + 0.6 * h(k + 140));
      for(let mm = -1; mm <= 1; mm++){ g.beginPath(); g.moveTo(bx + mm * S * 0.04, by); g.lineTo(bx + mm * S * 0.08, by - S * (0.1 + 0.04 * Math.abs(mm))); g.stroke(); }
    }
  };
  const lw = Math.max(1, S / 32);
  switch(kind){
    case 'cobble': {
      R(0, 0, 1, 1, '#7d756a');
      const cols = ['#a49a8a', '#9a9080', '#b0a796', '#958b7c'];
      for(let r = 0; r < 4; r++) for(let c = -1; c < 4; c++){
        const x = c / 3 + (r % 2 ? 1 / 6 : 0) + 0.02, y = r / 4 + 0.02;
        g.fillStyle = cols[Math.floor(h(r * 5 + c + 9) * 4)];
        g.beginPath(); g.roundRect ? g.roundRect(x * S, y * S, S / 3 - S * 0.05, S / 4 - S * 0.05, S * 0.06) : g.rect(x * S, y * S, S / 3 - S * 0.05, S / 4 - S * 0.05); g.fill();
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x * S + S * 0.03, y * S + S * 0.02, S / 3 - S * 0.12, S * 0.03);
      }
      if(n === 5){ g.fillStyle = '#6f9a45'; g.beginPath(); g.arc(S * 0.5, S * 0.5, S * 0.05, 0, 7); g.fill(); }
      return;
    }
    case 'pave': {
      R(0, 0, 1, 1, '#d7ccb2');
      g.strokeStyle = 'rgba(120,100,70,.35)'; g.lineWidth = lw;
      g.strokeRect(lw / 2, lw / 2, S / 2 - lw, S / 2 - lw); g.strokeRect(S / 2 + lw / 2, lw / 2, S / 2 - lw, S / 2 - lw);
      g.strokeRect(lw / 2, S / 2 + lw / 2, S - lw, S / 2 - lw);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(S * 0.06, S * 0.06, S * 0.36, S * 0.05);
      if(n === 3){ g.strokeStyle = 'rgba(90,70,50,.3)'; g.beginPath(); g.moveTo(S * 0.6, S * 0.6); g.lineTo(S * 0.75, S * 0.82); g.lineTo(S * 0.7, S * 0.95); g.stroke(); }
      return;
    }
    case 'mosaic': {
      R(0, 0, 1, 1, n % 2 ? '#e7d9b8' : '#c8714f');
      g.fillStyle = n % 2 ? '#4f7fb0' : '#f3e7c8';
      g.beginPath(); g.moveTo(S / 2, S * 0.18); g.lineTo(S * 0.82, S / 2); g.lineTo(S / 2, S * 0.82); g.lineTo(S * 0.18, S / 2); g.closePath(); g.fill();
      g.fillStyle = '#d7b24a'; g.beginPath(); g.arc(S / 2, S / 2, S * 0.07, 0, 7); g.fill();
      g.strokeStyle = 'rgba(80,60,40,.3)'; g.lineWidth = lw; g.strokeRect(0, 0, S, S);
      return;
    }
    case 'steps': {
      R(0, 0, 1, 1, '#ece6da');
      for(let r = 0; r < 3; r++){ R(0, r / 3, 1, 0.05, 'rgba(110,100,90,.35)'); R(0, r / 3 + 0.05, 1, 0.06, 'rgba(255,255,255,.5)'); }
      return;
    }
    case 'grass': dots('#69a64b', ['#7fbb5c', '#5d9842', n === 2 ? '#f4d36a' : '#7fbb5c', n === 3 ? '#f2a0bf' : '#5d9842'], 7, 0.03); tufts('#4c8836', 2); return;
    case 'path': dots('#d2c39f', ['#bfae88', '#e3d6b6', '#a89878'], 9, 0.025); return;
    case 'hedge': {
      R(0, 0, 1, 1, '#2c5c2a');
      const cols = ['#3f7d3a', '#4b8c43', '#367233'];
      for(let k = 0; k < 7; k++){ g.fillStyle = cols[k % 3]; g.beginPath(); g.arc(h(k) * S, h(k + 7) * S * 0.7, S * (0.16 + h(k + 14) * 0.12), 0, 7); g.fill(); }
      R(0, 0.74, 1, 0.26, '#25502a'); R(0, 0.74, 1, 0.04, 'rgba(255,255,255,.12)');
      if(n === 1){ g.fillStyle = '#fff'; g.beginPath(); g.arc(S * 0.3, S * 0.3, S * 0.04, 0, 7); g.fill(); }
      return;
    }
    case 'topiary': {
      dots('#69a64b', ['#7fbb5c', '#5d9842'], 5, 0.03);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(S / 2, S * 0.85, S * 0.32, S * 0.1, 0, 0, 7); g.fill();
      g.fillStyle = '#7a5532'; g.fillRect(S * 0.46, S * 0.6, S * 0.08, S * 0.25);
      g.fillStyle = '#356f32'; g.beginPath(); g.arc(S / 2, S * 0.42, S * 0.32, 0, 7); g.fill();
      g.fillStyle = '#4f9447'; g.beginPath(); g.arc(S * 0.42, S * 0.34, S * 0.18, 0, 7); g.fill();
      return;
    }
    case 'bed': {
      R(0, 0, 1, 1, '#b9a98e'); R(0.06, 0.06, 0.88, 0.88, '#6b4a2e');
      const C = { pink:['#f07aa6', '#ffc2d8'], gold:['#f2c23a', '#ffe58a'], violet:['#9a6be0', '#c9a6ff'], white:['#ffffff', '#f2f2e6'] }[vr] || ['#f07aa6', '#fff'];
      for(let k = 0; k < 11; k++){
        const x = 0.14 + 0.72 * h(k), y = 0.14 + 0.72 * h(k + 30);
        g.fillStyle = '#3f7d34'; g.beginPath(); g.arc(x * S, y * S + S * 0.04, S * 0.06, 0, 7); g.fill();
        g.fillStyle = C[k % 2]; g.beginPath(); g.arc(x * S, y * S, S * 0.055, 0, 7); g.fill();
      }
      return;
    }
    case 'water': {
      R(0, 0, 1, 1, '#4b9ccc');
      const ph = n / 4 * Math.PI * 2;
      g.strokeStyle = 'rgba(220,245,255,.5)'; g.lineWidth = Math.max(1, S / 22);
      g.beginPath(); g.moveTo(S * 0.1, S * (0.35 + 0.06 * Math.sin(ph))); g.quadraticCurveTo(S * 0.4, S * 0.25, S * 0.66, S * (0.37 + 0.06 * Math.cos(ph))); g.stroke();
      g.beginPath(); g.moveTo(S * 0.4, S * (0.72 + 0.05 * Math.cos(ph))); g.quadraticCurveTo(S * 0.66, S * 0.62, S * 0.92, S * (0.73 + 0.05 * Math.sin(ph))); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(S * (0.3 + 0.4 * ((n + 1) % 4) / 4), S * 0.55, S * 0.025, 0, 7); g.fill();
      return;
    }
    case 'wallTop': case 'wallS': case 'wallW': case 'wallE': {
      R(0, 0, 1, 1, '#a39fb5');
      g.strokeStyle = 'rgba(60,55,80,.35)'; g.lineWidth = lw;
      g.strokeRect(0, 0, S / 2, S / 2); g.strokeRect(S / 2, S / 2, S / 2, S / 2); g.strokeRect(0, S / 2, S / 2, S / 2); g.strokeRect(S / 2, 0, S / 2, S / 2);
      if(kind === 'wallS') R(0, 0, 1, 0.22, '#8c88a0');
      if(kind === 'wallW') R(0.78, 0, 0.22, 1, '#8c88a0');
      if(kind === 'wallE') R(0, 0, 0.22, 1, '#8c88a0');
      return;
    }
    case 'wallN': {
      R(0, 0, 1, 1, '#8f8aa6');
      g.strokeStyle = 'rgba(40,36,60,.4)'; g.lineWidth = lw;
      for(let r = 0; r < 4; r++){ g.beginPath(); g.moveTo(0, r * S / 4); g.lineTo(S, r * S / 4); g.stroke();
        for(let c = 0; c < 3; c++){ const x = (c + (r % 2) * 0.5) * S / 2.5; g.beginPath(); g.moveTo(x, r * S / 4); g.lineTo(x, (r + 1) * S / 4); g.stroke(); } }
      R(0, 0.82, 1, 0.18, '#6f6a86');
      if(n % 3 === 0){ g.fillStyle = '#4f8a3f'; g.beginPath(); g.arc(S * 0.3, S * 0.2, S * 0.09, 0, 7); g.arc(S * 0.4, S * 0.35, S * 0.07, 0, 7); g.fill(); }
      return;
    }
    case 'towerTop': R(0, 0, 1, 1, '#8f8aa6'); return;
    case 'towerDoor': {
      R(0, 0, 1, 1, '#8f8aa6');
      g.fillStyle = '#3a2716'; g.beginPath(); g.moveTo(S * 0.18, S); g.lineTo(S * 0.18, S * 0.42); g.quadraticCurveTo(S * 0.5, S * 0.06, S * 0.82, S * 0.42); g.lineTo(S * 0.82, S); g.fill();
      g.fillStyle = '#7a5230'; g.beginPath(); g.moveTo(S * 0.25, S); g.lineTo(S * 0.25, S * 0.46); g.quadraticCurveTo(S * 0.5, S * 0.16, S * 0.75, S * 0.46); g.lineTo(S * 0.75, S); g.fill();
      R(0.25, 0.62, 0.5, 0.05, '#3a2716'); R(0.25, 0.82, 0.5, 0.05, '#3a2716');
      return;
    }
    case 'gate': {
      const part = vr || '0i', col = +part[0], inner = part[1] === 'i';
      if(!inner){ R(0, 0, 1, 1, '#3b3646'); R(0, 0, 1, 0.1, '#55506a'); return; }
      R(0, 0, 1, 1, '#5e3c22');
      for(let k = 0; k < 3; k++) R(k / 3 + 0.02, 0, 0.27, 1, k % 2 ? '#7d5432' : '#73492b');
      R(0, 0.25, 1, 0.07, '#2e2a33'); R(0, 0.7, 1, 0.07, '#2e2a33');
      if(col === 1 || col === 2){ g.fillStyle = '#d8b25a'; g.beginPath(); g.arc(col === 1 ? S * 0.85 : S * 0.15, S * 0.5, S * 0.07, 0, 7); g.fill(); }
      return;
    }
    case 'bench': {
      R(0, 0, 1, 1, '#d7ccb2');
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(S * 0.1, S * 0.7, S * 0.8, S * 0.12);
      R(0.12, 0.35, 0.76, 0.12, '#8a5a32'); R(0.12, 0.5, 0.76, 0.12, '#9c6a3c'); R(0.14, 0.62, 0.08, 0.16, '#3a3338'); R(0.78, 0.62, 0.08, 0.16, '#3a3338');
      return;
    }
    case 'planter': {
      R(0, 0, 1, 1, '#d7ccb2');
      R(0.12, 0.42, 0.76, 0.48, '#c9bfae'); R(0.12, 0.42, 0.76, 0.08, '#e6dfd2');
      for(let k = 0; k < 6; k++){ g.fillStyle = ['#e9548a', '#f5c947', '#ffffff'][k % 3]; g.beginPath(); g.arc(S * (0.22 + 0.11 * k), S * (0.34 + 0.06 * (k % 2)), S * 0.08, 0, 7); g.fill(); }
      return;
    }
    case 'well': {
      R(0, 0, 1, 1, '#d7ccb2');
      g.fillStyle = '#9a9286'; g.beginPath(); g.arc(S / 2, S * 0.55, S * 0.4, 0, 7); g.fill();
      g.fillStyle = '#1f3a52'; g.beginPath(); g.arc(S / 2, S * 0.55, S * 0.26, 0, 7); g.fill();
      g.strokeStyle = '#5a3a20'; g.lineWidth = S * 0.06; g.beginPath(); g.moveTo(S * 0.15, S * 0.15); g.lineTo(S * 0.85, S * 0.15); g.stroke();
      return;
    }
    case 'board': R(0, 0, 1, 1, '#d7ccb2'); return;
    case 'stall': {
      const scheme = (key.split('-')[1] || 'rose:m').split(':')[0], part = vr || 'm', C = CA_STALL[scheme] || CA_STALL.rose;
      R(0, 0, 1, 1, '#d7ccb2');
      R(0, 0.3, 1, 0.55, '#a8743f'); R(0, 0.3, 1, 0.1, '#c8925a'); R(0, 0.82, 1, 0.06, 'rgba(0,0,0,.25)');
      for(let k = 0; k < 4; k++) R(k / 4 + 0.03, 0.42, 0.2, 0.36, k % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.08)');
      if(part !== 'm') R(part === 'l' ? 0.04 : 0.86, 0, 0.1, 0.85, '#6b4426');
      R(0.1, 0.2, 0.8, 0.12, C[1]);
      return;
    }
    case 'roof': case 'ridge': case 'roofL': case 'roofR': break;
  }
  if(kind.startsWith('stall-')){
    const scheme = kind.slice(6), part = vr || 'm', C = CA_STALL[scheme] || CA_STALL.rose;
    R(0, 0, 1, 1, '#d7ccb2');
    R(0, 0.34, 1, 0.52, '#a8743f'); R(0, 0.34, 1, 0.1, '#c8925a'); R(0, 0.84, 1, 0.06, 'rgba(0,0,0,.25)');
    for(let k = 0; k < 4; k++) R(k / 4 + 0.03, 0.46, 0.2, 0.34, k % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.07)');
    if(part !== 'm') R(part === 'l' ? 0.04 : 0.86, 0, 0.1, 0.86, '#6b4426');
    R(0.06, 0.26, 0.88, 0.1, C[1]);
    return;
  }
  if(kind.startsWith('house-')){
    const C = CA_HOUSE[kind.slice(6)] || CA_HOUSE.red, part = vr;
    if(part === 'ridge' || part === 'roof' || part === 'roofL' || part === 'roofR'){
      R(0, 0, 1, 1, C.roof);
      for(let r = 0; r < 4; r++) for(let c = 0; c < 4; c++){
        g.fillStyle = (r + c) % 2 ? C.roof2 : caShade(C.roof, -0.08);
        g.beginPath(); g.arc((c + (r % 2) * 0.5) * S / 4, (r + 1) * S / 4, S / 8, Math.PI, 0); g.fill();
      }
      if(part === 'ridge'){ R(0, 0, 1, 0.24, caShade(C.roof, -0.35)); R(0, 0.2, 1, 0.05, 'rgba(255,255,255,.18)'); }
      if(part === 'roofL') R(0, 0, 0.14, 1, 'rgba(0,0,0,.18)');
      if(part === 'roofR') R(0.86, 0, 0.14, 1, 'rgba(255,255,255,.12)');
      return;
    }
    R(0, 0, 1, 1, C.wall);
    if(part === 'win' || part === 'wall'){
      R(0, 0, 1, 0.1, 'rgba(0,0,0,.28)');
      R(0, 0.1, 0.08, 0.9, C.beam); R(0.92, 0.1, 0.08, 0.9, C.beam); R(0, 0.9, 1, 0.1, C.beam);
      if(part === 'wall'){ g.strokeStyle = C.beam; g.lineWidth = S * 0.07; g.beginPath(); g.moveTo(S * 0.08, S * 0.9); g.lineTo(S * 0.92, S * 0.15); g.stroke(); }
      else {
        R(0.24, 0.22, 0.52, 0.48, '#3c5a7a'); R(0.28, 0.26, 0.2, 0.18, '#a9d3ef'); R(0.52, 0.26, 0.2, 0.18, '#93c3e6'); R(0.28, 0.48, 0.2, 0.18, '#93c3e6'); R(0.52, 0.48, 0.2, 0.18, '#a9d3ef');
        R(0.2, 0.7, 0.6, 0.1, '#8a5a32');
        for(let k = 0; k < 5; k++){ g.fillStyle = ['#e9548a', '#f5c947', '#ff8f6a'][k % 3]; g.beginPath(); g.arc(S * (0.26 + 0.12 * k), S * 0.68, S * 0.05, 0, 7); g.fill(); }
      }
      return;
    }
    R(0, 0, 0.08, 1, C.beam); R(0.92, 0, 0.08, 1, C.beam); R(0, 0.88, 1, 0.12, caShade(C.beam, -0.2));
    if(part === 'baseWin'){ R(0.26, 0.2, 0.48, 0.42, '#3c5a7a'); R(0.3, 0.24, 0.4, 0.34, '#9ccbe9'); R(0.49, 0.24, 0.02, 0.34, '#3c5a7a'); }
    if(part === 'doorL' || part === 'doorR'){
      const L = part === 'doorL';
      g.fillStyle = caShade(C.door, -0.3);
      g.beginPath(); g.moveTo(L ? S * 0.2 : 0, S); g.lineTo(L ? S * 0.2 : 0, S * 0.3); g.quadraticCurveTo(L ? S * 0.6 : S * 0.4, L ? S * 0.02 : S * 0.02, L ? S : S * 0.8, S * (L ? 0.06 : 0.3)); g.lineTo(L ? S : S * 0.8, S); g.fill();
      g.fillStyle = C.door; g.fillRect(L ? S * 0.28 : 0, S * 0.36, L ? S * 0.72 : S * 0.72, S * 0.64);
      g.fillStyle = '#e2c062'; g.beginPath(); g.arc(L ? S * 0.86 : S * 0.14, S * 0.68, S * 0.05, 0, 7); g.fill();
    }
    return;
  }
  if(kind === 'palace'){
    const part = vr;
    const white = '#f4f1ea', shade = '#dcd6ca', gold = '#d9b247', slate = '#3d5a8f';
    if(part === 'ridge' || part === 'roof'){
      R(0, 0, 1, 1, slate);
      for(let r = 0; r < 4; r++) for(let c = 0; c < 4; c++){ g.fillStyle = (r + c) % 2 ? '#4a6aa3' : '#36508a'; g.beginPath(); g.arc((c + (r % 2) * 0.5) * S / 4, (r + 1) * S / 4, S / 8, Math.PI, 0); g.fill(); }
      if(part === 'ridge'){ R(0, 0, 1, 0.22, gold); for(let k = 0; k < 3; k++){ g.fillStyle = '#f2d77a'; g.beginPath(); g.moveTo(S * (k + 0.5) / 3, 0); g.lineTo(S * (k + 0.7) / 3, S * 0.22); g.lineTo(S * (k + 0.3) / 3, S * 0.22); g.fill(); } }
      return;
    }
    R(0, 0, 1, 1, white);
    if(part === 'cornice'){ R(0, 0, 1, 0.3, shade); R(0, 0.3, 1, 0.12, gold); for(let k = 0; k < 5; k++) R(k / 5 + 0.04, 0.45, 0.1, 0.14, shade); R(0, 0.9, 1, 0.1, 'rgba(0,0,0,.1)'); return; }
    if(part === 'win'){
      g.fillStyle = gold; g.beginPath(); g.moveTo(S * 0.2, S); g.lineTo(S * 0.2, S * 0.36); g.arc(S / 2, S * 0.36, S * 0.3, Math.PI, 0); g.lineTo(S * 0.8, S); g.fill();
      g.fillStyle = '#3b5ea8'; g.beginPath(); g.moveTo(S * 0.27, S); g.lineTo(S * 0.27, S * 0.38); g.arc(S / 2, S * 0.38, S * 0.23, Math.PI, 0); g.lineTo(S * 0.73, S); g.fill();
      g.fillStyle = 'rgba(190,220,255,.6)'; g.fillRect(S * 0.32, S * 0.3, S * 0.12, S * 0.6);
      R(0.49, 0.18, 0.02, 0.82, gold);
      return;
    }
    if(part === 'pilaster'){ R(0.3, 0, 0.4, 1, shade); R(0.36, 0, 0.06, 1, 'rgba(255,255,255,.6)'); return; }
    if(part === 'wall') return;
    R(0, 0.84, 1, 0.16, shade); R(0, 0.82, 1, 0.04, gold);
    if(part === 'baseWin'){ R(0.3, 0.2, 0.4, 0.5, gold); R(0.34, 0.24, 0.32, 0.42, '#3b5ea8'); }
    if(part === 'doorL' || part === 'doorR'){
      const L = part === 'doorL';
      g.fillStyle = gold; g.beginPath(); g.moveTo(L ? S * 0.1 : 0, S); g.lineTo(L ? S * 0.1 : 0, S * 0.3); g.quadraticCurveTo(L ? S * 0.5 : S * 0.5, -S * 0.05, L ? S : S * 0.9, L ? S * 0.0 : S * 0.3); g.lineTo(L ? S : S * 0.9, S); g.fill();
      g.fillStyle = '#7a3a2a'; g.fillRect(L ? S * 0.2 : 0, S * 0.28, S * 0.8, S * 0.72);
      R(L ? 0.3 : 0.08, 0.4, 0.6, 0.04, gold); R(L ? 0.3 : 0.08, 0.66, 0.6, 0.04, gold);
      g.fillStyle = '#f2d77a'; g.beginPath(); g.arc(L ? S * 0.9 : S * 0.1, S * 0.6, S * 0.06, 0, 7); g.fill();
    }
    return;
  }
  /* ---------- on the walls ---------- */
  if(kind === 'wtop'){ R(0, 0, 1, 1, '#b1acc2'); g.strokeStyle = 'rgba(70,64,92,.32)'; g.lineWidth = lw; g.strokeRect(lw / 2, lw / 2, S - lw, S - lw); if(n === 1){ g.beginPath(); g.moveTo(S * 0.5, 0); g.lineTo(S * 0.5, S); g.stroke(); } if(n === 3) R(0.2, 0.6, 0.12, 0.08, '#8fb06a'); return; }
  if(kind === 'parapetH' || kind === 'parapetV'){
    const H_ = kind === 'parapetH';
    R(0, 0, 1, 1, '#8f8aa6');
    if(H_){ R(0, 0.2, 1, 0.3, '#c9c4d8'); R(0, 0.5, 1, 0.08, '#6f6a86'); }
    else { R(0.2, 0, 0.3, 1, '#c9c4d8'); R(0.5, 0, 0.08, 1, '#6f6a86'); }
    return;
  }
  if(kind === 'crenelH' || kind === 'crenelV' || kind === 'notchH' || kind === 'notchV'){
    const H_ = kind.endsWith('H'), notch = kind.startsWith('notch');
    R(0, 0, 1, 1, '#7d7894');
    if(!notch){
      if(H_){ R(0.08, 0.05, 0.84, 0.7, '#a6a1ba'); R(0.08, 0.05, 0.84, 0.12, '#c9c4d8'); }
      else { R(0.05, 0.08, 0.7, 0.84, '#a6a1ba'); R(0.05, 0.08, 0.12, 0.84, '#c9c4d8'); }
    } else { R(0, 0, 1, 1, '#9a95ae'); if(H_) R(0, 0.75, 1, 0.25, '#6f6a86'); else R(0.75, 0, 0.25, 1, '#6f6a86'); }
    return;
  }
  /* ---------- indoors ---------- */
  if(kind === 'marble'){ R(0, 0, 1, 1, n ? '#efe4e4' : '#fbf8f2'); g.strokeStyle = 'rgba(200,160,80,.45)'; g.lineWidth = lw; g.strokeRect(0, 0, S, S); g.strokeStyle = 'rgba(160,140,150,.25)'; g.beginPath(); g.moveTo(S * 0.1, S * 0.7); g.quadraticCurveTo(S * 0.5, S * 0.5, S * 0.9, S * 0.8); g.stroke(); return; }
  if(kind === 'carpet'){
    R(0, 0, 1, 1, '#a3263b');
    const e = vr || '';
    if(e.includes('l')) R(0, 0, 0.14, 1, '#d9b247'); if(e.includes('r')) R(0.86, 0, 0.14, 1, '#d9b247');
    if(e.includes('t')) R(0, 0, 1, 0.14, '#d9b247'); if(e.includes('b')) R(0, 0.86, 1, 0.14, '#d9b247');
    g.fillStyle = 'rgba(255,220,120,.25)'; g.beginPath(); g.moveTo(S / 2, S * 0.3); g.lineTo(S * 0.7, S / 2); g.lineTo(S / 2, S * 0.7); g.lineTo(S * 0.3, S / 2); g.fill();
    return;
  }
  if(kind === 'dais'){ R(0, 0, 1, 1, '#e8dccb'); R(0, 0, 1, 0.08, '#d9b247'); g.strokeStyle = 'rgba(170,140,90,.4)'; g.lineWidth = lw; g.strokeRect(0, 0, S, S); return; }
  if(kind === 'iwall'){
    const part = vr || 'plain';
    R(0, 0, 1, 1, '#efe0c6'); R(0, 0, 1, 0.12, '#c9a24a'); R(0, 0.7, 1, 0.3, '#7a4a2e'); R(0, 0.7, 1, 0.05, '#d9b247');
    if(part === 'window'){ g.fillStyle = '#d9b247'; g.beginPath(); g.moveTo(S * 0.25, S * 0.68); g.lineTo(S * 0.25, S * 0.36); g.arc(S / 2, S * 0.36, S * 0.25, Math.PI, 0); g.lineTo(S * 0.75, S * 0.68); g.fill(); g.fillStyle = '#9fd0f2'; g.beginPath(); g.moveTo(S * 0.3, S * 0.66); g.lineTo(S * 0.3, S * 0.37); g.arc(S / 2, S * 0.37, S * 0.2, Math.PI, 0); g.lineTo(S * 0.7, S * 0.66); g.fill(); R(0.49, 0.2, 0.02, 0.46, '#d9b247'); }
    if(part === 'tapestry'){ R(0.18, 0.12, 0.64, 0.6, n % 2 ? '#2f4f9a' : '#a3263b'); R(0.18, 0.12, 0.64, 0.06, '#d9b247'); g.fillStyle = '#f2d77a'; g.beginPath(); g.arc(S / 2, S * 0.4, S * 0.1, 0, 7); g.fill(); g.beginPath(); g.moveTo(S * 0.18, S * 0.72); g.lineTo(S / 2, S * 0.62); g.lineTo(S * 0.82, S * 0.72); g.fill(); }
    if(part === 'portrait'){ R(0.22, 0.16, 0.56, 0.46, '#d9b247'); R(0.27, 0.21, 0.46, 0.36, '#5a6f8a'); g.fillStyle = '#f2d8b0'; g.beginPath(); g.arc(S / 2, S * 0.36, S * 0.09, 0, 7); g.fill(); R(0.38, 0.45, 0.24, 0.12, '#a3263b'); }
    if(part === 'torch'){ R(0.45, 0.34, 0.1, 0.22, '#5a3a20'); g.fillStyle = '#ffb347'; g.beginPath(); g.ellipse(S / 2, S * 0.28, S * 0.08, S * 0.12, 0, 0, 7); g.fill(); g.fillStyle = '#fff3b0'; g.beginPath(); g.ellipse(S / 2, S * 0.3, S * 0.04, S * 0.06, 0, 0, 7); g.fill(); }
    if(part === 'top') { R(0, 0, 1, 1, '#c9b48e'); R(0, 0.85, 1, 0.15, '#c9a24a'); }
    return;
  }
  if(kind === 'plank'){ R(0, 0, 1, 1, n === 1 ? '#b98552' : '#c49260'); for(let r = 0; r < 3; r++){ R(0, r / 3, 1, 0.03, 'rgba(70,40,20,.35)'); R(((r + n) % 3) / 3 + 0.12, r / 3, 0.02, 1 / 3, 'rgba(70,40,20,.3)'); } g.fillStyle = 'rgba(70,40,20,.3)'; g.beginPath(); g.arc(S * 0.7, S * 0.5, S * 0.03, 0, 7); g.fill(); return; }
  if(kind === 'woodwall'){
    const part = vr || 'plain';
    R(0, 0, 1, 1, '#a56f40');
    for(let r = 0; r < 5; r++){ R(0, r / 5, 1, 0.04, 'rgba(60,30,10,.35)'); R(0, r / 5 + 0.04, 1, 0.03, 'rgba(255,220,170,.16)'); }
    if(part === 'window'){ R(0.2, 0.18, 0.6, 0.5, '#5a3a20'); R(0.25, 0.23, 0.5, 0.4, '#f5d58a'); R(0.49, 0.23, 0.02, 0.4, '#5a3a20'); R(0.25, 0.42, 0.5, 0.02, '#5a3a20'); R(0.16, 0.66, 0.68, 0.06, '#7a4a28'); g.fillStyle = '#5a9a4a'; g.beginPath(); g.arc(S * 0.3, S * 0.64, S * 0.06, 0, 7); g.fill(); }
    if(part === 'shelf'){ R(0.08, 0.36, 0.84, 0.05, '#5a3a20'); for(let k = 0; k < 5; k++){ g.fillStyle = ['#d9d0c0', '#c97b4a', '#6b9bd1', '#e8c547', '#9a6bd0'][k]; g.beginPath(); g.arc(S * (0.18 + 0.16 * k), S * 0.29, S * 0.06, 0, 7); g.fill(); } R(0.08, 0.64, 0.84, 0.05, '#5a3a20'); for(let k = 0; k < 4; k++) R(0.14 + 0.2 * k, 0.48, 0.12, 0.16, ['#e8e2d6', '#b8865a', '#d6c4a0', '#e8e2d6'][k]); }
    if(part === 'lamp'){ R(0.46, 0.2, 0.08, 0.26, '#3a2a1a'); g.fillStyle = 'rgba(255,200,110,.55)'; g.beginPath(); g.arc(S / 2, S * 0.46, S * 0.22, 0, 7); g.fill(); g.fillStyle = '#ffe3a0'; g.beginPath(); g.arc(S / 2, S * 0.46, S * 0.08, 0, 7); g.fill(); }
    if(part === 'records'){ for(let r = 0; r < 2; r++){ R(0.06, 0.18 + r * 0.38, 0.88, 0.04, '#3a2a1a'); for(let k = 0; k < 7; k++) R(0.1 + k * 0.12, 0.22 + r * 0.38, 0.09, 0.28, ['#2b2b3a', '#c94a6a', '#3a7ac4', '#e8c547', '#2b2b3a', '#5ab08a', '#9a6bd0'][(k + r * 3) % 7]); } }
    if(part === 'poster'){ R(0.2, 0.15, 0.6, 0.6, '#f2e6c8'); g.fillStyle = '#2b2b3a'; g.beginPath(); g.arc(S / 2, S * 0.42, S * 0.18, 0, 7); g.fill(); g.fillStyle = '#c94a6a'; g.beginPath(); g.arc(S / 2, S * 0.42, S * 0.06, 0, 7); g.fill(); }
    R(0, 0.86, 1, 0.14, '#6e4426');
    return;
  }
  if(kind === 'rug'){ R(0, 0, 1, 1, n ? '#c0503e' : '#c55a44'); g.strokeStyle = '#f2d59a'; g.lineWidth = Math.max(1, S / 14); g.strokeRect(S * 0.12, S * 0.12, S * 0.76, S * 0.76); g.fillStyle = '#2f5f8a'; g.beginPath(); g.moveTo(S / 2, S * 0.28); g.lineTo(S * 0.72, S / 2); g.lineTo(S / 2, S * 0.72); g.lineTo(S * 0.28, S / 2); g.fill(); return; }
  if(kind === 'stairs'){ R(0, 0, 1, 1, '#cfc6b6'); for(let r = 0; r < 4; r++){ R(0, r / 4, 1, 0.05, 'rgba(80,70,60,.4)'); R(0, r / 4 + 0.05, 1, 0.05, 'rgba(255,255,255,.4)'); } R(0, 0, 0.1, 1, '#a99f8f'); R(0.9, 0, 0.1, 1, '#a99f8f'); return; }
  if(kind === 'counter'){ R(0, 0, 1, 1, '#c49260'); R(0, 0.25, 1, 0.6, '#7a4a28'); R(0, 0.25, 1, 0.1, '#a56f40'); for(let k = 0; k < 3; k++) R(0.06 + k * 0.33, 0.42, 0.22, 0.34, 'rgba(255,220,170,.08)'); return; }
  if(kind === 'shelfrec'){ R(0, 0, 1, 1, '#c49260'); R(0.04, 0.1, 0.92, 0.78, '#5a3a20'); for(let r = 0; r < 2; r++) for(let k = 0; k < 6; k++) R(0.08 + k * 0.145, 0.15 + r * 0.38, 0.11, 0.3, ['#2b2b3a', '#c94a6a', '#3a7ac4', '#e8c547', '#5ab08a', '#9a6bd0'][(k + r * 2 + n) % 6]); return; }
  if(kind === 'plinth'){ R(0, 0, 1, 1, n ? '#efe4e4' : '#fbf8f2'); R(0.15, 0.5, 0.7, 0.4, '#8f8aa6'); R(0.15, 0.5, 0.7, 0.08, '#c9c4d8'); return; }
  if(kind === 'void'){ R(0, 0, 1, 1, '#1d1a26'); return; }
  R(0, 0, 1, 1, '#ff00ff');
}

/* ---------- what stands up over the ground ---------- */
function caDrawDeco(g, d, x, y, w, h, now){
  const k = w / (d.w || 1);                                           // one square, here
  const t = now / 1000;
  switch(d.kind){
    case 'tree': {
      g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x + w * 0.5, y + h * 0.9, w * 0.32, h * 0.08, 0, 0, 7); g.fill();
      if(d.variant === 'cypress'){
        g.fillStyle = '#5a3d22'; g.fillRect(x + w * 0.47, y + h * 0.72, w * 0.06, h * 0.18);
        g.fillStyle = '#244f2c'; g.beginPath(); g.ellipse(x + w * 0.5, y + h * 0.42, w * 0.2, h * 0.38, 0, 0, 7); g.fill();
        g.fillStyle = '#356b3a'; g.beginPath(); g.ellipse(x + w * 0.45, y + h * 0.36, w * 0.1, h * 0.26, 0, 0, 7); g.fill();
        return;
      }
      g.fillStyle = '#6a4626'; g.fillRect(x + w * 0.45, y + h * 0.55, w * 0.1, h * 0.36);
      const cols = d.variant === 'blossom' ? ['#f2a7c3', '#f7c6d8', '#e889ad'] : ['#3f7d3a', '#4f9447', '#5ea852'];
      for(let n = 0; n < 6; n++){ g.fillStyle = cols[n % 3]; g.beginPath(); g.arc(x + w * (0.3 + 0.4 * jgHash(n, d.x * 7 + d.y, 2)), y + h * (0.2 + 0.3 * jgHash(n, d.x + d.y * 5, 3)), w * (0.17 + 0.06 * jgHash(n, d.x, 4)), 0, 7); g.fill(); }
      if(d.variant === 'apple' || d.variant === 'pear'){ g.fillStyle = d.variant === 'apple' ? '#e0393e' : '#e8d04a'; for(let n = 0; n < 5; n++){ g.beginPath(); g.arc(x + w * (0.3 + 0.4 * jgHash(n, d.y, 9)), y + h * (0.22 + 0.3 * jgHash(n, d.x, 8)), w * 0.035, 0, 7); g.fill(); } }
      return;
    }
    case 'lamp': {
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.95, w * 0.22, h * 0.04, 0, 0, 7); g.fill();
      g.fillStyle = '#2f2b36'; g.fillRect(x + w * 0.45, y + h * 0.3, w * 0.1, h * 0.66); g.fillRect(x + w * 0.35, y + h * 0.9, w * 0.3, h * 0.06);
      g.fillStyle = 'rgba(255,214,120,.28)'; g.beginPath(); g.arc(x + w / 2, y + h * 0.2, w * 0.5, 0, 7); g.fill();
      g.fillStyle = '#2f2b36'; g.fillRect(x + w * 0.32, y + h * 0.1, w * 0.36, h * 0.2);
      g.fillStyle = '#ffd77a'; g.fillRect(x + w * 0.37, y + h * 0.13, w * 0.26, h * 0.14);
      return;
    }
    case 'awning': {
      const C = CA_STALL[d.scheme] || CA_STALL.rose, n = Math.max(2, Math.round(d.w * 2));
      g.fillStyle = '#6b4426'; g.fillRect(x + k * 0.06, y + h * 0.2, k * 0.08, h * 0.8); g.fillRect(x + w - k * 0.14, y + h * 0.2, k * 0.08, h * 0.8);
      for(let i = 0; i < n; i++){ g.fillStyle = i % 2 ? C[1] : C[0]; g.fillRect(x + w * i / n, y, w / n + 1, h * 0.55); }
      for(let i = 0; i < n; i++){ g.fillStyle = i % 2 ? C[1] : C[0]; g.beginPath(); g.arc(x + w * (i + 0.5) / n, y + h * 0.55, w / n / 2, 0, Math.PI); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x, y + h * 0.5, w, h * 0.05);
      if(d.goods === 'fruit') for(let i = 0; i < d.w * 3; i++){ g.fillStyle = ['#e0393e', '#f2a33a', '#e8d04a', '#7fbf4a'][i % 4]; g.beginPath(); g.arc(x + k * (0.3 + i * 0.33), y + h * 0.98 + k * 0.12, k * 0.1, 0, 7); g.fill(); }
      if(d.goods === 'flower') for(let i = 0; i < d.w * 3; i++){ g.fillStyle = ['#f07aa6', '#ffffff', '#9a6be0', '#f2c23a'][i % 4]; g.beginPath(); g.arc(x + k * (0.3 + i * 0.33), y + h * 0.98 + k * 0.1, k * 0.1, 0, 7); g.fill(); }
      return;
    }
    case 'easel': {
      g.strokeStyle = '#7a4a28'; g.lineWidth = Math.max(1.5, k * 0.07);
      g.beginPath(); g.moveTo(x + w * 0.5, y); g.lineTo(x + w * 0.15, y + h); g.moveTo(x + w * 0.5, y); g.lineTo(x + w * 0.85, y + h); g.moveTo(x + w * 0.5, y); g.lineTo(x + w * 0.5, y + h * 0.95); g.stroke();
      g.fillStyle = '#f7f2e4'; g.fillRect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.42);
      g.fillStyle = '#8fc2e8'; g.fillRect(x + w * 0.16, y + h * 0.15, w * 0.68, h * 0.18);
      g.fillStyle = '#6aa84f'; g.fillRect(x + w * 0.16, y + h * 0.33, w * 0.68, h * 0.18);
      return;
    }
    case 'board': {
      g.fillStyle = '#6b4426'; g.fillRect(x + w * 0.1, y + h * 0.2, w * 0.08, h * 0.8); g.fillRect(x + w * 0.82, y + h * 0.2, w * 0.08, h * 0.8);
      g.fillStyle = '#9c6a3c'; g.fillRect(x, y + h * 0.1, w, h * 0.45);
      [['#f7f2e4', 0.08, 0.16], ['#fde9a8', 0.42, 0.2], ['#e3f0fb', 0.68, 0.14]].forEach(([c, a, b])=>{ g.fillStyle = c; g.fillRect(x + w * a, y + h * b, w * 0.26, h * 0.3); });
      return;
    }
    case 'sign': {
      g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1, k * 0.05);
      g.beginPath(); g.moveTo(x + w * 0.2, y); g.lineTo(x + w * 0.2, y + h * 0.25); g.moveTo(x + w * 0.8, y); g.lineTo(x + w * 0.8, y + h * 0.25); g.stroke();
      g.fillStyle = '#6e4426'; g.fillRect(x, y + h * 0.22, w, h * 0.78);
      g.fillStyle = '#f2d59a'; g.fillRect(x + w * 0.06, y + h * 0.3, w * 0.88, h * 0.62);
      g.font = `${Math.round(h * 0.5)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d.text || '', x + w / 2, y + h * 0.62);
      return;
    }
    case 'chimney': {
      g.fillStyle = '#8a4a3a'; g.fillRect(x, y + h * 0.35, w, h * 0.65); g.fillStyle = '#6e3a2e'; g.fillRect(x - w * 0.08, y + h * 0.3, w * 1.16, h * 0.1);
      for(let i = 0; i < 3; i++){ const p = ((t * 0.4 + i / 3) % 1); g.fillStyle = `rgba(230,230,240,${0.45 * (1 - p)})`; g.beginPath(); g.arc(x + w * (0.5 + 0.3 * Math.sin(p * 4 + i)), y + h * (0.3 - p * 0.9), w * (0.18 + p * 0.3), 0, 7); g.fill(); }
      return;
    }
    case 'banner': {
      const sway = Math.sin(t * 1.6 + d.x) * w * 0.05;
      g.fillStyle = '#d9b247'; g.fillRect(x - w * 0.05, y, w * 1.1, h * 0.06);
      g.fillStyle = '#2f4f9a'; g.beginPath(); g.moveTo(x + w * 0.1, y + h * 0.05); g.lineTo(x + w * 0.9, y + h * 0.05); g.lineTo(x + w * 0.9 + sway, y + h * 0.85); g.lineTo(x + w * 0.5 + sway, y + h); g.lineTo(x + w * 0.1 + sway, y + h * 0.85); g.fill();
      g.fillStyle = '#f2d77a'; g.font = `${Math.round(w * 0.55)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♛', x + w * 0.5 + sway * 0.6, y + h * 0.4);
      return;
    }
    case 'fountGrand': case 'fountSmall': {
      const grand = d.kind === 'fountGrand', cx = x + w / 2, base = y + h * (grand ? 0.78 : 0.82);
      const stone = '#e8e2d6', sh = '#bdb5a6';
      const tier = (yy, rw, rh)=>{ g.fillStyle = sh; g.beginPath(); g.ellipse(cx, yy + rh * 0.35, rw, rh, 0, 0, 7); g.fill(); g.fillStyle = stone; g.beginPath(); g.ellipse(cx, yy, rw, rh, 0, 0, 7); g.fill(); g.fillStyle = '#6fb6e0'; g.beginPath(); g.ellipse(cx, yy, rw * 0.82, rh * 0.68, 0, 0, 7); g.fill(); };
      const column = (y0, y1, cw)=>{ g.fillStyle = stone; g.fillRect(cx - cw / 2, y1, cw, y0 - y1); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(cx + cw * 0.15, y1, cw * 0.35, y0 - y1); };
      const sheet = (yy, rw, len)=>{ for(let i = 0; i < 9; i++){ const a = i / 8, px = cx - rw + a * rw * 2; g.strokeStyle = `rgba(200,235,255,${0.45 + 0.25 * Math.sin(t * 6 + i)})`; g.lineWidth = Math.max(1, k * 0.04); g.beginPath(); g.moveTo(px, yy); g.quadraticCurveTo(px + (a - 0.5) * k * 0.3, yy + len * 0.6, px + (a - 0.5) * k * 0.4, yy + len); g.stroke(); } };
      if(grand){
        column(base, base - h * 0.42, w * 0.12);
        tier(base - h * 0.4, w * 0.3, h * 0.07); sheet(base - h * 0.37, w * 0.28, h * 0.33);
        column(base - h * 0.42, base - h * 0.66, w * 0.08);
        tier(base - h * 0.64, w * 0.18, h * 0.045); sheet(base - h * 0.62, w * 0.17, h * 0.2);
        column(base - h * 0.66, base - h * 0.82, w * 0.05);
        /* the top: a fairy holding a star up, gold */
        g.fillStyle = '#e2bf55'; g.beginPath(); g.ellipse(cx, base - h * 0.86, w * 0.035, h * 0.05, 0, 0, 7); g.fill();
        g.beginPath(); g.ellipse(cx - w * 0.05, base - h * 0.88, w * 0.05, h * 0.025, -0.5, 0, 7); g.ellipse(cx + w * 0.05, base - h * 0.88, w * 0.05, h * 0.025, 0.5, 0, 7); g.fill();
        g.fillStyle = '#fff3b0'; g.beginPath(); for(let i = 0; i < 10; i++){ const r = i % 2 ? w * 0.02 : w * 0.05, a = i / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(cx + Math.cos(a) * r, base - h * 0.96 + Math.sin(a) * r); } g.fill();
      } else {
        column(base, base - h * 0.4, w * 0.12);
        tier(base - h * 0.38, w * 0.24, h * 0.06); sheet(base - h * 0.35, w * 0.22, h * 0.3);
      }
      /* the spray, falling back into the basin */
      for(let i = 0; i < (grand ? 26 : 12); i++){
        const ph = ((t * 0.9 + i / (grand ? 26 : 12)) % 1), side = i % 2 ? 1 : -1, sp = jgHash(i, d.x, 5);
        const top = base - h * (grand ? 0.9 : 0.62);
        const px = cx + side * (0.05 + sp * 0.35) * w * ph, py = top + (base - top) * ph * ph - h * 0.12 * Math.sin(ph * Math.PI);
        g.fillStyle = `rgba(220,245,255,${0.85 - ph * 0.6})`; g.beginPath(); g.arc(px, py, Math.max(1, k * (0.05 - ph * 0.02)), 0, 7); g.fill();
      }
      return;
    }
    case 'palaceTower': case 'cornerTower': case 'keep': return caDrawTower(g, d, x, y, w, h, k, t);
    default: return caDrawFurniture(g, d, x, y, w, h, k, t);
  }
}
/* the towers: the palace's two, the corner ones (flat tops with battlements: the ramparts), the central tower */
function caDrawTower(g, d, x, y, w, h, k, t){
  const corner = d.kind === 'cornerTower', keep = d.kind === 'keep';
  const stone = corner ? '#a6a1ba' : '#f4f1ea', dark = corner ? '#7d7894' : '#d6cfc0', gold = '#d9b247';
  const cx = x + w / 2, bw = w * (keep ? 0.62 : 0.86), top = y + h * (corner ? 0.14 : keep ? 0.34 : 0.3), bot = y + h * (corner ? 0.98 : 0.98);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(cx, bot, bw * 0.55, k * 0.3, 0, 0, 7); g.fill();
  /* the body: a round tower, lit from the left */
  const gr = g.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
  gr.addColorStop(0, caShade(stone, 0.15)); gr.addColorStop(0.45, stone); gr.addColorStop(1, dark);
  g.fillStyle = gr; g.fillRect(cx - bw / 2, top, bw, bot - top);
  g.beginPath(); g.ellipse(cx, bot, bw / 2, k * 0.25, 0, 0, Math.PI); g.fill();
  /* courses of stone */
  g.strokeStyle = corner ? 'rgba(50,44,70,.28)' : 'rgba(150,130,100,.25)'; g.lineWidth = Math.max(1, k * 0.03);
  for(let yy = top + k * 0.5; yy < bot; yy += k * 0.5){ g.beginPath(); g.moveTo(cx - bw / 2, yy); g.lineTo(cx + bw / 2, yy); g.stroke(); }
  /* windows */
  const rows = keep ? 4 : corner ? 2 : 3;
  for(let r = 0; r < rows; r++){
    const wy = top + (bot - top) * (0.16 + r * (0.7 / rows));
    const cols = keep ? 3 : 1;
    for(let c = 0; c < cols; c++){
      const wx = cx + (c - (cols - 1) / 2) * bw * 0.28;
      g.fillStyle = corner ? '#3a3448' : gold; g.beginPath(); g.moveTo(wx - k * 0.2, wy + k * 0.55); g.lineTo(wx - k * 0.2, wy + k * 0.18); g.arc(wx, wy + k * 0.18, k * 0.2, Math.PI, 0); g.lineTo(wx + k * 0.2, wy + k * 0.55); g.fill();
      if(!corner){ g.fillStyle = (r === 1 && c === 1) ? '#ffe9a0' : '#3b5ea8'; g.beginPath(); g.moveTo(wx - k * 0.14, wy + k * 0.52); g.lineTo(wx - k * 0.14, wy + k * 0.2); g.arc(wx, wy + k * 0.2, k * 0.14, Math.PI, 0); g.lineTo(wx + k * 0.14, wy + k * 0.52); g.fill(); }
    }
  }
  if(keep){
    /* a balcony round it, gold */
    const by = top + (bot - top) * 0.42;
    g.fillStyle = gold; g.fillRect(cx - bw * 0.62, by, bw * 1.24, k * 0.16);
    for(let i = 0; i <= 10; i++) g.fillRect(cx - bw * 0.6 + i * bw * 0.12, by - k * 0.3, k * 0.06, k * 0.3);
    g.fillRect(cx - bw * 0.62, by - k * 0.34, bw * 1.24, k * 0.08);
  }
  if(corner){
    /* the battlements of the rampart, and a knight's pennant */
    const cy = top;
    g.fillStyle = dark; g.fillRect(cx - bw * 0.56, cy - k * 0.1, bw * 1.12, k * 0.5);
    for(let i = 0; i < 7; i++){ g.fillStyle = i % 2 ? dark : caShade(stone, 0.1); g.fillRect(cx - bw * 0.56 + i * bw * 0.16, cy - k * 0.55, bw * 0.16, k * 0.5); }
    const sway = Math.sin(t * 2 + d.x) * k * 0.15;
    g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1, k * 0.05); g.beginPath(); g.moveTo(cx, cy - k * 0.5); g.lineTo(cx, cy - k * 2.1); g.stroke();
    g.fillStyle = '#2f4f9a'; g.beginPath(); g.moveTo(cx, cy - k * 2.1); g.lineTo(cx + k * 1.1 + sway, cy - k * 1.8); g.lineTo(cx, cy - k * 1.5); g.fill();
    return;
  }
  /* a conical roof of blue slate, a gold finial and a pennant */
  const rw = bw * (keep ? 1.28 : 1.2), ry = top, apex = y + (keep ? 0 : h * 0.02);
  g.fillStyle = '#36508a'; g.beginPath(); g.moveTo(cx - rw / 2, ry); g.lineTo(cx, apex + k * 0.6); g.lineTo(cx + rw / 2, ry); g.closePath(); g.fill();
  g.fillStyle = '#4a6aa3'; g.beginPath(); g.moveTo(cx - rw / 2, ry); g.lineTo(cx, apex + k * 0.6); g.lineTo(cx - rw * 0.08, ry); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(20,30,60,.3)'; g.lineWidth = Math.max(1, k * 0.03);
  for(let i = 1; i < 5; i++){ const yy = ry - (ry - apex - k * 0.6) * i / 5, half = rw / 2 * (1 - i / 5); g.beginPath(); g.moveTo(cx - half, yy); g.lineTo(cx + half, yy); g.stroke(); }
  g.fillStyle = gold; g.fillRect(cx - rw / 2, ry - k * 0.08, rw, k * 0.16);
  g.beginPath(); g.arc(cx, apex + k * 0.55, k * 0.14, 0, 7); g.fill();
  g.fillRect(cx - k * 0.03, apex - k * 0.2, k * 0.06, k * 0.7);
  const sway = Math.sin(t * 2.2 + d.x) * k * 0.15;
  g.fillStyle = keep ? '#a3263b' : '#2f4f9a'; g.beginPath(); g.moveTo(cx, apex - k * 0.2); g.lineTo(cx + k * (keep ? 1.6 : 1.1) + sway, apex + k * 0.05); g.lineTo(cx, apex + k * 0.3); g.fill();
  if(keep){ g.fillStyle = '#f2d77a'; g.font = `${Math.round(k * 0.36)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♛', cx + k * 0.6 + sway * 0.5, apex + k * 0.05); }
}

/* ============================================================
   THE OTHER MAPS: the walls, the ramparts, the palace, the tower, the
   tavern, the record store — each made once
   ============================================================ */
const CA_WALLS = ['n', 's', 'w', 'e'], CA_CORNERS = ['nw', 'ne', 'sw', 'se'];
const CA_WALL_NAME = { n:'North wall', s:'South wall', w:'West wall', e:'East wall' };
const CA_CORNER_NAME = { nw:'North-west rampart', ne:'North-east rampart', sw:'South-west rampart', se:'South-east rampart' };
/* the jungle's square of the castle: where the views outside begin */
function caJc(){ return jgGround().places.castle; }
/* A wall: its walkway four squares wide, a low parapet on the castle's side,
   battlements on the forest's (with four notches, a lookout in each), and
   beyond them the views. North and south run across; west and east down. */
const CA_WALL_SPEC = {
  /* out: the forest's rows/cols; walk: the walkway's; inner: the parapet's; crenel: the battlements' */
  n:{ across:true, out:[0, 3], crenel:3, walk:[4, 8], parapet:8, inn:[9, 14] },
  s:{ across:true, inn:[0, 5], parapet:5, walk:[6, 10], crenel:10, out:[11, 14] },
  w:{ across:false, out:[0, 3], crenel:3, walk:[4, 8], parapet:8, inn:[9, 14] },
  e:{ across:false, inn:[0, 5], parapet:5, walk:[6, 10], crenel:10, out:[11, 14] },
};
const CA_LOOKOUT_AT = [12, 24, 39, 51];
const _caMaps = {};
function caWallMap(k){
  if(_caMaps['wall_' + k]) return _caMaps['wall_' + k];
  const sp = CA_WALL_SPEC[k], T = CA_T, L = 64, D = 14;
  const m = caGrid(sp.across ? L : D, sp.across ? D : L, T.VOID);
  const set = (a, b, t, s)=> sp.across ? caPut(m, a, b, t, s) : caPut(m, b, a, t, s);   // a: along, b: across
  for(let a = 0; a < L; a++){
    for(let b = sp.out[0]; b < sp.out[1]; b++) set(a, b, T.VIEWOUT);
    for(let b = sp.inn[0]; b < sp.inn[1]; b++) set(a, b, T.VIEWIN);
    for(let b = sp.walk[0]; b < sp.walk[1]; b++) set(a, b, T.WALK, 'wtop:' + Math.floor(caHash(a, b, 4) * 4));
    set(a, sp.parapet, T.PARAPET, sp.across ? 'parapetH' : 'parapetV');
    const notch = CA_LOOKOUT_AT.includes(a);
    set(a, sp.crenel, notch ? T.NOTCH : T.CRENEL, (notch ? 'notch' : 'crenel') + (sp.across ? 'H' : 'V') + (notch ? '' : ':' + (a % 2)));
  }
  const jc = caJc();
  const along = sp.across ? 'x' : 'y';
  const inEdge = sp.inn[0] === 0 ? sp.inn[1] : sp.inn[0], outEdge = sp.out[0] === 0 ? sp.out[1] : sp.out[0];
  const inOut = sp.inn[0] === 0 ? -1 : 1, outOut = sp.out[0] === 0 ? -1 : 1;
  const inSrcEdge = { n:3, s:60, w:3, e:60 }[k], inSrcOut = { n:1, s:-1, w:1, e:-1 }[k];
  const outSrcEdge = { n:jc.y - 1, s:jc.y + 64, w:jc.x - 1, e:jc.x + 64 }[k], outSrcOut = { n:-1, s:1, w:-1, e:1 }[k];
  const rect = (r)=> sp.across ? { x0:0, y0:r[0], x1:L, y1:r[1] } : { x0:r[0], y0:0, x1:r[1], y1:L };
  m.views = [
    Object.assign(rect(sp.inn), { src:'castle', along, at0:0, src0:0, edge:inEdge, srcEdge:inSrcEdge, out:inOut, srcOut:inSrcOut, f:0.6 }),
    Object.assign(rect(sp.out), { src:'jungle', along, at0:0, src0:sp.across ? jc.x : jc.y, edge:outEdge, srcEdge:outSrcEdge, out:outOut, srcOut:outSrcOut, f:0.6 }),
  ];
  m.tags = { sp, lanes:[sp.walk[0], sp.walk[1] - 1], mid:sp.walk[0] + 1 };
  _caMaps['wall_' + k] = m;
  return m;
}
/* A rampart: a corner tower's flat top, battlements all round, a stair down
   in its inner corner, an arch to each of its two walls; the forest beyond
   its outer sides, the castle beyond its inner ones. */
const CA_RAMP = {
  nw:{ out:['n', 'w'], walls:{ e:['n', 'w'], s:['w', 'n'] } },        // side → [wall, which end of it]
  ne:{ out:['n', 'e'], walls:{ w:['n', 'e'], s:['e', 'n'] } },
  sw:{ out:['s', 'w'], walls:{ e:['s', 'w'], n:['w', 's'] } },
  se:{ out:['s', 'e'], walls:{ w:['s', 'e'], n:['e', 's'] } },
};
function caRampMap(c){
  if(_caMaps['ramp_' + c]) return _caMaps['ramp_' + c];
  const T = CA_T, N = 14, m = caGrid(N, N, T.VOID), R = CA_RAMP[c];
  caFill(m, 2, 2, 10, 10, T.CRENEL, (x, y)=> (y === 2 || y === 11 ? 'crenelH:' : 'crenelV:') + ((x + y) % 2));
  caFill(m, 3, 3, 8, 8, T.WALK, (x, y)=> 'wtop:' + Math.floor(caHash(x, y, 6) * 4));
  /* the views: the sides beyond the battlements */
  const jc = caJc(), tw = caGrounds().tags.towers[c];
  const side = (s)=> ({ n:{ x0:0, y0:0, x1:N, y1:2 }, s:{ x0:0, y0:12, x1:N, y1:N }, w:{ x0:0, y0:2, x1:2, y1:12 }, e:{ x0:12, y0:2, x1:N, y1:12 } })[s];
  m.views = ['n', 's', 'w', 'e'].map(s=>{
    const outer = R.out.includes(s), along = (s === 'n' || s === 's') ? 'x' : 'y', r = side(s);
    for(let y = r.y0; y < r.y1; y++) for(let x = r.x0; x < r.x1; x++) caPut(m, x, y, outer ? T.VIEWOUT : T.VIEWIN);
    const edge = { n:2, s:12, w:2, e:12 }[s], out = (s === 'n' || s === 'w') ? -1 : 1;
    const towerMid = along === 'x' ? tw.x + 4 : tw.y + 4;
    if(outer){
      const srcEdge = { n:jc.y - 1, s:jc.y + 64, w:jc.x - 1, e:jc.x + 64 }[s];
      return Object.assign(r, { src:'jungle', along, at0:7, src0:(along === 'x' ? jc.x : jc.y) + towerMid, edge, srcEdge, out, srcOut:out, f:0.6 });
    }
    const srcEdge = { n:tw.y - 1, s:tw.y + 10, w:tw.x - 1, e:tw.x + 10 }[s];
    return Object.assign(r, { src:'castle', along, at0:7, src0:towerMid, edge, srcEdge, out, srcOut:out, f:0.6 });
  });
  /* the arches to the walls, and the stair down (in the inner corner) */
  m.tags = { arches:{}, notches:[] };
  Object.entries(R.walls).forEach(([s, [wall, end]])=>{
    const at = { e:[11, 6], w:[2, 6], n:[6, 2], s:[6, 11] }[s];
    const span = (s === 'e' || s === 'w') ? [[at[0], 6], [at[0], 7]] : [[6, at[1]], [7, at[1]]];
    span.forEach(([x, y])=> caPut(m, x, y, T.WALK, 'wtop:2'));
    m.tags.arches[s] = { wall, end, x:span[0][0], y:span[0][1], w:(s === 'n' || s === 's') ? 2 : 1, h:(s === 'e' || s === 'w') ? 2 : 1,
      stand:{ x:s === 'e' ? 10 : s === 'w' ? 3 : 6, y:s === 's' ? 10 : s === 'n' ? 3 : 6 } };
  });
  const inner = { nw:[9, 9], ne:[3, 9], sw:[9, 3], se:[3, 3] }[c];
  caFill(m, inner[0], inner[1], 2, 2, T.STAIRS, 'stairs');
  m.tags.stair = { x:inner[0], y:inner[1], w:2, h:2, stand:{ x:inner[0] + (c[1] === 'w' ? -1 : 2), y:inner[1] + (c[0] === 'n' ? 0 : 1) } };
  if(m.tags.stair.stand.x < 3 || m.tags.stair.stand.x > 10) m.tags.stair.stand.x = Math.max(3, Math.min(10, m.tags.stair.stand.x));
  /* the lookouts, one of each kind, in notches of the outer battlements */
  const outerNotches = [];
  R.out.forEach(s=>{ [4, 9].forEach(a=> outerNotches.push(s === 'n' ? [a, 2] : s === 's' ? [a, 11] : s === 'w' ? [2, a] : [11, a])); });
  ['duck', 'bug', 'knight'].forEach((who, i)=>{
    const [x, y] = outerNotches[i];
    caPut(m, x, y, T.NOTCH, (y === 2 || y === 11) ? 'notchH' : 'notchV');
    m.tags.notches.push({ who, x, y });
  });
  /* the spyglass in the outer corner */
  const sx = c[1] === 'w' ? 3 : 10, sy = c[0] === 'n' ? 3 : 10;
  m.tags.glass = { x:sx, y:sy };
  caPut(m, sx, sy, T.PLANTER, 'wtop:0');
  caDeco(m, 'spyglass', sx - 0.1, sy - 0.9, 1.2, 1.9, { z:sy + 0.5, corner:c });
  _caMaps['ramp_' + c] = m;
  return m;
}
/* THE PALACE: the King's hall — guard rows down its carpet, the dais, the
   throne, the four sealed blades behind it — and its corridors, with a
   banquet hall in the west, a library in the east and the stair up the
   central tower. */
function caPalaceMap(){
  if(_caMaps.palace) return _caMaps.palace;
  const T = CA_T, W = 40, H = 34, m = caGrid(W, H, T.IWALL);
  const wallRow = (y, x0, x1, kind)=>{ for(let x = x0; x < x1; x++) caPut(m, x, y, T.IWALL, 'iwall:' + (kind ? kind(x) : 'plain')); };
  caFill(m, 0, 0, W, H, T.IWALL, 'iwall:top');
  /* the hall */
  caFill(m, 12, 2, 16, 31, T.MARBLE);
  wallRow(1, 12, 28, (x)=> x % 4 === 1 ? 'window' : x % 4 === 3 ? 'tapestry:' + (x % 8 > 3 ? 1 : 0) : 'plain');
  caFill(m, 14, 2, 12, 5, T.DAIS);
  for(let y = 7; y < 33; y++) for(let x = 18; x < 22; x++) caPut(m, x, y, T.CARPET, 'carpet:' + (x === 18 ? 'l' : x === 21 ? 'r' : '') + (y === 7 ? 't' : ''));
  caFill(m, 19, 2, 2, 2, T.THRONE, 'dais'); caDeco(m, 'throne', 18.6, 0.9, 2.8, 3.3, { z:3.9 });
  m.tags.blades = [{ el:'fire', x:15, y:2 }, { el:'ground', x:16, y:2 }, { el:'water', x:23, y:2 }, { el:'grass', x:24, y:2 }];
  m.tags.blades.forEach(b=>{ caPut(m, b.x, b.y, T.PLINTH, 'plinth:0'); caDeco(m, 'blade', b.x - 0.1, b.y - 1.2, 1.2, 2.2, { el:b.el, z:b.y + 0.9 }); });
  m.tags.court = { king:{ x:19, y:3, w:2 }, dauphin:{ x:22, y:4 }, advisor:{ x:17, y:4 }, commander:{ x:22, y:8 } };
  m.tags.guards = [];
  for(let y = 10; y < 32; y += 3){ m.tags.guards.push({ x:16, y }, { x:23, y }); }
  for(let y = 8; y < 33; y += 3){ [13, 26].forEach(x=>{ caPut(m, x, y, T.COLUMN, 'marble:0'); caDeco(m, 'column', x - 0.05, y - 1.6, 1.1, 2.6, { z:y + 0.9 }); }); }
  /* the corridors, west and east, and their rooms */
  caFill(m, 2, 2, 9, 31, T.MARBLE); caFill(m, 29, 2, 9, 31, T.MARBLE);
  wallRow(1, 2, 11, (x)=> x % 3 === 0 ? 'portrait' : x % 3 === 1 ? 'torch' : 'window');
  wallRow(1, 29, 38, (x)=> x % 3 === 0 ? 'window' : x % 3 === 1 ? 'torch' : 'portrait');
  for(let y = 4; y < 32; y++){ caPut(m, 6, y, T.RUG, 'carpet:' + (y === 4 ? 't' : '')); caPut(m, 33, y, T.RUG, 'carpet:' + (y === 4 ? 't' : '')); }
  /* the hall's side walls, with doorways */
  for(let y = 2; y < 33; y++){ if(![15, 16, 27, 28].includes(y)) { caPut(m, 11, y, T.IWALL, 'iwall:top'); caPut(m, 28, y, T.IWALL, 'iwall:top'); } }
  /* the banquet hall (north-west): a long table */
  caFill(m, 3, 5, 2, 8, T.TABLE, 'marble:1'); caDeco(m, 'longTable', 2.7, 4.6, 2.6, 8.6, { z:12.5 });
  caFill(m, 8, 5, 2, 8, T.TABLE, 'marble:1'); caDeco(m, 'longTable', 7.7, 4.6, 2.6, 8.6, { z:12.5 });
  /* the library (south-east): shelves */
  [[30, 20], [30, 24], [36, 20], [36, 24]].forEach(([x, y])=>{ caFill(m, x, y, 2, 2, T.SHELF, 'marble:0'); caDeco(m, 'bookcase', x - 0.05, y - 1.2, 2.1, 3.2, { z:y + 1.9 }); });
  /* the stair up the central tower (north-east) */
  caFill(m, 35, 2, 2, 3, T.STAIRS, 'stairs');
  m.tags.stair = { x:35, y:2, w:2, h:3, stand:{ x:35, y:5 } };
  /* the way out: the hall's great doors */
  caFill(m, 18, 33, 4, 1, T.IWALL, 'iwall:plain');
  m.tags.door = { x:18, y:32, w:4, stand:{ x:19, y:31 } };
  m.tags.posts = [{ x:4, y:16 }, { x:8, y:27 }, { x:31, y:15 }, { x:35, y:29 }];   // a Chestnut Knight in each corridor
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const i = y * W + x; if(!m.spr[i]) m.spr[i] = caDefaultSpr(m, x, y) || 'iwall:top'; }
  m.deco.sort((a, b)=> a.z - b.z);
  _caMaps.palace = m;
  return m;
}
/* THE CENTRAL TOWER'S UPPER CHAMBERS: a gallery round the stairwell, the
   little princess's room (she is hiding), the Dauphin's, a sitting room. */
function caTowerMap(){
  if(_caMaps.tower) return _caMaps.tower;
  const T = CA_T, W = 30, H = 22, m = caGrid(W, H, T.IWALL);
  caFill(m, 0, 0, W, H, T.IWALL, 'iwall:top');
  caFill(m, 2, 12, 26, 4, T.MARBLE);                                   // the gallery
  for(let x = 3; x < 27; x++) caPut(m, x, 13, T.RUG, 'carpet:' + (x === 3 ? 'l' : x === 26 ? 'r' : ''));
  caFill(m, 2, 2, 9, 9, T.MARBLE); caFill(m, 13, 2, 5, 9, T.MARBLE); caFill(m, 20, 2, 8, 9, T.MARBLE);   // three rooms
  for(let x = 2; x < 28; x++) caPut(m, x, 1, T.IWALL, 'iwall:' + (x % 4 === 0 ? 'window' : x % 4 === 2 ? 'tapestry:1' : 'plain'));
  [5, 6, 15, 23, 24].forEach(x=> caPut(m, x, 11, T.MARBLE));           // doorways
  /* the princess's room: her bed, the wardrobe she hides behind, a rug */
  caFill(m, 2, 2, 3, 3, T.BEDROYAL, 'marble:1'); caDeco(m, 'canopyBed', 1.9, 0.6, 3.2, 4.6, { z:4.9 });
  caFill(m, 9, 2, 2, 2, T.WARDROBE, 'marble:1'); caDeco(m, 'wardrobe', 8.9, 0.4, 2.2, 3.7, { z:3.9 });
  caFill(m, 5, 6, 3, 3, T.RUG, (x, y)=> 'rug:' + ((x + y) & 1));
  m.tags.princess = { x:10, y:4 };
  /* the sitting room (middle): a hearth */
  caFill(m, 14, 2, 3, 1, T.HEARTH, 'iwall:plain'); caDeco(m, 'hearth', 13.8, 0.4, 3.4, 2.8, { z:2.9, marble:true });
  /* the Dauphin's room: her armour stand, a bed */
  caFill(m, 25, 2, 3, 3, T.BEDROYAL, 'marble:1'); caDeco(m, 'canopyBed', 24.9, 0.6, 3.2, 4.6, { z:4.9, blue:true });
  caFill(m, 21, 2, 1, 1, T.PLANTER, 'marble:0'); caDeco(m, 'armour', 20.6, 0.5, 1.8, 2.6, { z:2.8 });
  caFill(m, 13, 17, 4, 2, T.STAIRS, 'stairs');
  m.tags.stair = { x:13, y:17, w:4, h:2, stand:{ x:14, y:16 } };
  m.tags.posts = [{ x:3, y:14 }, { x:26, y:14 }];
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const i = y * W + x; if(!m.spr[i]) m.spr[i] = caDefaultSpr(m, x, y) || 'iwall:top'; }
  m.deco.sort((a, b)=> a.z - b.z);
  _caMaps.tower = m;
  return m;
}
/* THE TAVERN — "a woody, scandinavian, warm cosy feeling": pine walls and
   plank floors, a fire in a stone hearth, round tables, a rug, lamps; Cream
   Fairy and Choux Fairy behind the counter. */
function caTavernMap(){
  if(_caMaps.tavern) return _caMaps.tavern;
  const T = CA_T, W = 16, H = 12, m = caGrid(W, H, T.WOODWALL);
  caFill(m, 0, 0, W, H, T.WOODWALL, 'woodwall:plain');
  caFill(m, 1, 2, 14, 9, T.PLANK);
  for(let x = 1; x < 15; x++) caPut(m, x, 1, T.WOODWALL, 'woodwall:' + (x === 5 || x === 10 ? 'window' : x === 7 || x === 13 ? 'shelf' : x === 3 ? 'lamp' : 'plain'));
  caFill(m, 1, 2, 3, 1, T.HEARTH, 'plank:0'); caDeco(m, 'hearth', 0.8, 0.3, 3.4, 2.9, { z:2.9 });
  caFill(m, 9, 3, 6, 1, T.COUNTER, 'counter'); caDeco(m, 'mugs', 9, 2.55, 6, 0.7, { z:3.2 });
  m.tags.keepers = [{ who:'cream', x:10, y:2 }, { who:'choux', x:13, y:2 }];
  [[3, 6], [6, 8], [3, 9]].forEach(([x, y])=>{ caPut(m, x, y, T.TABLE, 'plank:1'); caDeco(m, 'table', x - 0.3, y - 0.55, 1.6, 1.5, { z:y + 0.8 }); });
  [[2, 6], [4, 6], [5, 8], [7, 8], [2, 9], [4, 9]].forEach(([x, y])=>{ caPut(m, x, y, T.STOOL, 'plank:2'); caDeco(m, 'stool', x + 0.15, y + 0.1, 0.7, 0.8, { z:y + 0.7 }); });
  caFill(m, 9, 6, 4, 3, T.RUG, (x, y)=> 'rug:' + ((x + y) & 1));
  caPut(m, 14, 9, T.CRATE, 'plank:0'); caDeco(m, 'barrels', 13.6, 8.1, 1.8, 1.9, { z:9.9 });
  caFill(m, 7, 11, 2, 1, T.WOODWALL, 'woodwall:plain');
  m.tags.door = { x:7, y:10, w:2, stand:{ x:7, y:10 } };
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const i = y * W + x; if(!m.spr[i]) m.spr[i] = caDefaultSpr(m, x, y) || 'woodwall:plain'; }
  m.deco.sort((a, b)=> a.z - b.z);
  _caMaps.tavern = m;
  return m;
}
/* THE RECORD STORE — record shelves, bins to flick through, a gramophone to
   sample one on, Melody Fairy at the counter. */
function caRecordsMap(){
  if(_caMaps.records) return _caMaps.records;
  const T = CA_T, W = 14, H = 11, m = caGrid(W, H, T.WOODWALL);
  caFill(m, 0, 0, W, H, T.WOODWALL, 'woodwall:records');
  caFill(m, 1, 2, 12, 8, T.PLANK);
  for(let x = 1; x < 13; x++) caPut(m, x, 1, T.WOODWALL, 'woodwall:' + (x === 4 || x === 9 ? 'poster' : 'records'));
  [[2, 4], [2, 7], [5, 5], [5, 7]].forEach(([x, y])=> caFill(m, x, y, 2, 1, T.SHELF, 'shelfrec:' + ((x + y) % 3)));
  caFill(m, 9, 3, 4, 1, T.COUNTER, 'counter');
  m.tags.keeper = { who:'melody', x:11, y:2 };
  caPut(m, 12, 6, T.PLANTER, 'plank:0'); caDeco(m, 'gramophone', 11.7, 4.9, 1.6, 2.1, { z:6.9 });
  m.tags.gramophone = { x:12, y:6 };
  caFill(m, 6, 10, 2, 1, T.WOODWALL, 'woodwall:plain');
  m.tags.door = { x:6, y:9, w:2, stand:{ x:6, y:9 } };
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const i = y * W + x; if(!m.spr[i]) m.spr[i] = caDefaultSpr(m, x, y) || 'woodwall:plain'; }
  m.deco.sort((a, b)=> a.z - b.z);
  _caMaps.records = m;
  return m;
}
/* indoors, and the spyglass on a rampart */
function caDrawFurniture(g, d, x, y, w, h, k, t){
  const gold = '#d9b247', wood = '#7a4a28', woodL = '#a56f40';
  const shadow = (cx, cy, rx, ry)=>{ g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill(); };
  switch(d.kind){
    case 'spyglass': {
      shadow(x + w / 2, y + h * 0.93, w * 0.3, h * 0.05);
      g.strokeStyle = '#4a3a2a'; g.lineWidth = Math.max(1.5, k * 0.06);
      g.beginPath(); g.moveTo(x + w * 0.5, y + h * 0.55); g.lineTo(x + w * 0.2, y + h * 0.95); g.moveTo(x + w * 0.5, y + h * 0.55); g.lineTo(x + w * 0.8, y + h * 0.95); g.moveTo(x + w * 0.5, y + h * 0.55); g.lineTo(x + w * 0.5, y + h * 0.95); g.stroke();
      const dir = d.corner === 'nw' ? [-1, -1] : d.corner === 'ne' ? [1, -1] : d.corner === 'sw' ? [-1, 1] : [1, 1];
      g.save(); g.translate(x + w * 0.5, y + h * 0.5); g.rotate(Math.atan2(dir[1] * 0.4, dir[0]));
      g.fillStyle = gold; g.fillRect(-w * 0.1, -h * 0.06, w * 0.7, h * 0.12); g.fillStyle = '#8a6a2a'; g.fillRect(w * 0.5, -h * 0.08, w * 0.12, h * 0.16);
      g.restore();
      return;
    }
    case 'throne': {
      shadow(x + w / 2, y + h * 0.95, w * 0.45, h * 0.06);
      g.fillStyle = gold; g.beginPath(); g.moveTo(x + w * 0.12, y + h * 0.95); g.lineTo(x + w * 0.12, y + h * 0.2); g.quadraticCurveTo(x + w * 0.5, y - h * 0.08, x + w * 0.88, y + h * 0.2); g.lineTo(x + w * 0.88, y + h * 0.95); g.fill();
      g.fillStyle = '#2f4f9a'; g.beginPath(); g.moveTo(x + w * 0.22, y + h * 0.62); g.lineTo(x + w * 0.22, y + h * 0.28); g.quadraticCurveTo(x + w * 0.5, y + h * 0.08, x + w * 0.78, y + h * 0.28); g.lineTo(x + w * 0.78, y + h * 0.62); g.fill();
      g.fillStyle = '#a3263b'; g.fillRect(x + w * 0.18, y + h * 0.6, w * 0.64, h * 0.16);
      g.fillStyle = '#f2d77a'; g.font = `${Math.round(w * 0.28)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♛', x + w / 2, y + h * 0.3);
      return;
    }
    case 'blade': {
      /* (3.90) the glow and the stone it is sunk in; the blade itself is its uploaded picture (sealed_blade_<el>), a thing standing over it */
      const C = { fire:'#ff6a3a', ground:'#c9a06a', water:'#5ab4ff', grass:'#6ad26a' }[d.el] || '#fff';
      const glow = 0.45 + 0.2 * Math.sin(t * 2 + d.x);
      g.fillStyle = C; g.globalAlpha = glow * 0.6; g.beginPath(); g.arc(x + w / 2, y + h * 0.4, w * 0.6, 0, 7); g.fill(); g.globalAlpha = 1;
      g.fillStyle = '#8f8aa6'; g.fillRect(x + w * 0.18, y + h * 0.72, w * 0.64, h * 0.2); g.fillStyle = '#c9c4d8'; g.fillRect(x + w * 0.18, y + h * 0.72, w * 0.64, h * 0.05);
      return;
    }
    case 'column': {
      shadow(x + w / 2, y + h * 0.96, w * 0.42, h * 0.05);
      const gr = g.createLinearGradient(x + w * 0.2, 0, x + w * 0.8, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d9d2c4');
      g.fillStyle = gr; g.fillRect(x + w * 0.24, y + h * 0.12, w * 0.52, h * 0.8);
      g.strokeStyle = 'rgba(150,140,120,.35)'; g.lineWidth = Math.max(1, k * 0.03); for(let i = 1; i < 4; i++){ g.beginPath(); g.moveTo(x + w * (0.24 + 0.13 * i), y + h * 0.14); g.lineTo(x + w * (0.24 + 0.13 * i), y + h * 0.9); g.stroke(); }
      g.fillStyle = gold; g.fillRect(x + w * 0.14, y + h * 0.04, w * 0.72, h * 0.1); g.fillRect(x + w * 0.16, y + h * 0.9, w * 0.68, h * 0.07);
      return;
    }
    case 'longTable': {
      shadow(x + w / 2, y + h * 0.97, w * 0.55, h * 0.03);
      g.fillStyle = wood; g.fillRect(x + w * 0.1, y + h * 0.06, w * 0.8, h * 0.9);
      g.fillStyle = '#f4efe2'; g.fillRect(x + w * 0.16, y + h * 0.08, w * 0.68, h * 0.86);
      g.fillStyle = gold; g.fillRect(x + w * 0.46, y + h * 0.08, w * 0.08, h * 0.86);
      for(let i = 0; i < 4; i++){ const yy = y + h * (0.16 + i * 0.22); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + w * 0.3, yy, w * 0.1, 0, 7); g.arc(x + w * 0.7, yy, w * 0.1, 0, 7); g.fill(); g.fillStyle = ['#e0393e', '#f2a33a', '#7fbf4a', '#e8d04a'][i]; g.beginPath(); g.arc(x + w * 0.5, yy + h * 0.05, w * 0.07, 0, 7); g.fill(); }
      return;
    }
    case 'bookcase': {
      g.fillStyle = '#5a3a20'; g.fillRect(x, y, w, h * 0.95);
      for(let r = 0; r < 4; r++) for(let i = 0; i < 7; i++){ g.fillStyle = ['#a3263b', '#2f4f9a', '#3f7d3a', '#d9b247', '#7a4a86', '#c97b4a', '#2b5f6a'][(i + r * 3) % 7]; g.fillRect(x + w * (0.06 + i * 0.13), y + h * (0.06 + r * 0.22), w * 0.1, h * 0.17); }
      g.fillStyle = '#3a2410'; for(let r = 1; r < 5; r++) g.fillRect(x, y + h * (0.03 + r * 0.22), w, h * 0.03);
      return;
    }
    case 'canopyBed': {
      shadow(x + w / 2, y + h * 0.96, w * 0.5, h * 0.04);
      const cloth = d.blue ? '#4a6ab0' : '#e88ab0', cloth2 = d.blue ? '#7a9ad8' : '#f7c6d8';
      g.fillStyle = gold; g.fillRect(x + w * 0.06, y, w * 0.06, h * 0.95); g.fillRect(x + w * 0.88, y, w * 0.06, h * 0.95);
      g.fillStyle = cloth; g.fillRect(x + w * 0.04, y, w * 0.92, h * 0.14);
      for(let i = 0; i < 6; i++){ g.fillStyle = cloth2; g.beginPath(); g.arc(x + w * (0.12 + i * 0.152), y + h * 0.14, w * 0.075, 0, Math.PI); g.fill(); }
      g.fillStyle = '#ffffff'; g.fillRect(x + w * 0.14, y + h * 0.3, w * 0.72, h * 0.6);
      g.fillStyle = cloth; g.fillRect(x + w * 0.14, y + h * 0.5, w * 0.72, h * 0.4);
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + w * 0.35, y + h * 0.38, w * 0.14, h * 0.06, 0, 0, 7); g.ellipse(x + w * 0.65, y + h * 0.38, w * 0.14, h * 0.06, 0, 0, 7); g.fill();
      return;
    }
    case 'wardrobe': {
      shadow(x + w / 2, y + h * 0.97, w * 0.5, h * 0.04);
      g.fillStyle = '#e9d8f0'; g.fillRect(x + w * 0.04, y + h * 0.06, w * 0.92, h * 0.9);
      g.fillStyle = gold; g.fillRect(x + w * 0.04, y + h * 0.02, w * 0.92, h * 0.07); g.fillRect(x + w * 0.49, y + h * 0.1, w * 0.02, h * 0.84);
      g.fillStyle = '#c9b0d8'; g.fillRect(x + w * 0.12, y + h * 0.16, w * 0.3, h * 0.66); g.fillRect(x + w * 0.58, y + h * 0.16, w * 0.3, h * 0.66);
      g.fillStyle = gold; g.beginPath(); g.arc(x + w * 0.45, y + h * 0.52, w * 0.03, 0, 7); g.arc(x + w * 0.55, y + h * 0.52, w * 0.03, 0, 7); g.fill();
      return;
    }
    case 'hearth': {
      const stone = d.marble ? '#efe8dc' : '#9a8f84', stoneD = d.marble ? '#cfc4b2' : '#7a7066';
      g.fillStyle = stone; g.fillRect(x, y + h * 0.1, w, h * 0.86);
      g.fillStyle = stoneD; for(let r = 0; r < 4; r++) for(let i = 0; i < 4; i++) g.fillRect(x + w * (i * 0.25 + (r % 2) * 0.12), y + h * (0.14 + r * 0.2), w * 0.2, h * 0.02);
      g.fillStyle = d.marble ? gold : '#6e4426'; g.fillRect(x - w * 0.03, y + h * 0.06, w * 1.06, h * 0.09);
      g.fillStyle = '#1f1410'; g.beginPath(); g.moveTo(x + w * 0.2, y + h * 0.96); g.lineTo(x + w * 0.2, y + h * 0.48); g.quadraticCurveTo(x + w * 0.5, y + h * 0.26, x + w * 0.8, y + h * 0.48); g.lineTo(x + w * 0.8, y + h * 0.96); g.fill();
      for(let i = 0; i < 7; i++){
        const ph = (t * 1.7 + i * 0.37) % 1, fx = x + w * (0.3 + 0.4 * jgHash(i, 3, 7)), base = y + h * 0.94;
        g.fillStyle = `rgba(255,${120 + 100 * (1 - ph)},40,${0.85 * (1 - ph)})`;
        g.beginPath(); g.ellipse(fx, base - h * 0.4 * ph, w * (0.09 - 0.05 * ph), h * (0.16 - 0.08 * ph), 0, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(255,190,90,.18)'; g.beginPath(); g.arc(x + w / 2, y + h * 0.85, w * 0.7, 0, 7); g.fill();
      return;
    }
    case 'armour': {
      shadow(x + w / 2, y + h * 0.96, w * 0.32, h * 0.04);
      g.fillStyle = '#5a3a20'; g.fillRect(x + w * 0.47, y + h * 0.3, w * 0.06, h * 0.65);
      g.fillStyle = '#c9ccd8'; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.42, w * 0.28, h * 0.2, 0, 0, 7); g.fill();
      g.fillStyle = '#e8ebf2'; g.beginPath(); g.arc(x + w / 2, y + h * 0.16, w * 0.16, 0, 7); g.fill();
      g.fillStyle = gold; g.fillRect(x + w * 0.3, y + h * 0.4, w * 0.4, h * 0.04);
      g.fillStyle = '#e88ab0'; g.beginPath(); g.moveTo(x + w / 2, y + h * 0.02); g.lineTo(x + w * 0.62, y - h * 0.08); g.lineTo(x + w * 0.56, y + h * 0.06); g.fill();
      return;
    }
    case 'mugs': for(let i = 0; i < 5; i++){ const mx = x + k * (0.4 + i * 1.15); g.fillStyle = '#e8d6a8'; g.fillRect(mx, y + h * 0.1, k * 0.26, h * 0.6); g.fillStyle = '#fff8e8'; g.fillRect(mx, y + h * 0.06, k * 0.26, h * 0.14); g.strokeStyle = '#c9b48e'; g.lineWidth = Math.max(1, k * 0.04); g.beginPath(); g.arc(mx + k * 0.3, y + h * 0.4, k * 0.08, -1.2, 1.2); g.stroke(); } return;
    case 'table': {
      shadow(x + w / 2, y + h * 0.92, w * 0.42, h * 0.08);
      g.fillStyle = wood; g.fillRect(x + w * 0.46, y + h * 0.45, w * 0.08, h * 0.45);
      g.fillStyle = woodL; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.42, w * 0.46, h * 0.26, 0, 0, 7); g.fill();
      g.fillStyle = '#c49260'; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.38, w * 0.4, h * 0.2, 0, 0, 7); g.fill();
      g.fillStyle = '#fff3d6'; g.fillRect(x + w * 0.46, y + h * 0.14, w * 0.08, h * 0.18);
      g.fillStyle = `rgba(255,200,90,${0.7 + 0.2 * Math.sin(t * 5 + d.x)})`; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.1, w * 0.04, h * 0.06, 0, 0, 7); g.fill();
      return;
    }
    case 'stool': g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.85, w * 0.4, h * 0.12, 0, 0, 7); g.fill(); g.fillStyle = woodL; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.45, w * 0.42, h * 0.22, 0, 0, 7); g.fill(); g.fillStyle = wood; g.fillRect(x + w * 0.2, y + h * 0.5, w * 0.1, h * 0.35); g.fillRect(x + w * 0.7, y + h * 0.5, w * 0.1, h * 0.35); return;
    case 'barrels': for(let i = 0; i < 2; i++){ const bx = x + w * (0.05 + i * 0.47); g.fillStyle = '#8a5a32'; g.fillRect(bx, y + h * 0.2, w * 0.45, h * 0.75); g.fillStyle = '#3a3338'; g.fillRect(bx, y + h * 0.32, w * 0.45, h * 0.05); g.fillRect(bx, y + h * 0.78, w * 0.45, h * 0.05); g.fillStyle = '#a56f40'; g.beginPath(); g.ellipse(bx + w * 0.225, y + h * 0.2, w * 0.225, h * 0.08, 0, 0, 7); g.fill(); } return;
    case 'gramophone': {
      shadow(x + w / 2, y + h * 0.95, w * 0.4, h * 0.05);
      g.fillStyle = '#6e4426'; g.fillRect(x + w * 0.15, y + h * 0.6, w * 0.7, h * 0.32);
      g.fillStyle = '#2b2b3a'; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.6, w * 0.32, h * 0.06, 0, 0, 7); g.fill();
      g.strokeStyle = gold; g.lineWidth = Math.max(1, k * 0.05); g.beginPath(); g.moveTo(x + w * 0.6, y + h * 0.58); g.lineTo(x + w * 0.62, y + h * 0.3); g.stroke();
      g.fillStyle = gold; g.beginPath(); g.moveTo(x + w * 0.6, y + h * 0.32); g.quadraticCurveTo(x + w * 0.2, y, x + w * 0.05, y + h * 0.08); g.quadraticCurveTo(x + w * 0.4, y + h * 0.2, x + w * 0.66, y + h * 0.28); g.fill();
      if(caRecPlaying()){ for(let i = 0; i < 3; i++){ const p = (t * 0.6 + i / 3) % 1; g.fillStyle = `rgba(90,60,140,${1 - p})`; g.font = `${Math.round(k * 0.4)}px sans-serif`; g.fillText('♪', x - w * 0.1 - p * w * 0.3, y + h * (0.1 - p * 0.5)); } }
      return;
    }
  }
}

/* ============================================================
   THE DECKS — each map as a walkable place
   ============================================================ */
const CA_MAPS = {
  r6_castle:()=> caGrounds(),
  r6_wall_n:()=> caWallMap('n'), r6_wall_s:()=> caWallMap('s'), r6_wall_w:()=> caWallMap('w'), r6_wall_e:()=> caWallMap('e'),
  r6_ramp_nw:()=> caRampMap('nw'), r6_ramp_ne:()=> caRampMap('ne'), r6_ramp_sw:()=> caRampMap('sw'), r6_ramp_se:()=> caRampMap('se'),
  r6_palace:()=> caPalaceMap(), r6_tower:()=> caTowerMap(), r6_tavern:()=> caTavernMap(), r6_records:()=> caRecordsMap(),
};
function caKeyOf(k){ return k; }
/* about 13 squares across on a tablet, 9 on a phone (as the jungle) — a room smaller than that fills the stage */
function caViewSquares(want){
  const W = window.innerWidth, H = window.innerHeight;
  const stage = Math.min(Math.min(W, W >= 700 ? 720 : 480) - 32, H - 300);
  const avail = Math.min(W - 24, Math.max(220, H - 330));
  const n = want || (Math.min(W, H) >= 700 ? 13 : 9);
  return Math.max(7, avail / (Math.max(200, stage) / n));
}
function caRows(m){ return m._rows || (m._rows = Array.from({ length:m.H }, ()=> '.'.repeat(m.W))); }
function caMakeDeck(key, o){
  const map = CA_MAPS[key];
  const d = {
    key, region:6, title:o.title, bg:o.bg || 'jungle', music:o.music || 'region6', noGhost:true,
    get view(){ return caViewSquares(o.squares); },
    backLabel:o.backLabel || 'Leave', backTo:o.backTo || CA_KEY,
    get rows(){ return caRows(map()); },
    bx:0, by:0, bs:1 / 32, nat:[1, 1],
    get spawn(){ return o.spawn(); },
    occupied:(x, y)=> caSolidCode(caAt(map(), x, y)) || caWalkerAt(key, x, y),
    get things(){ return caThings(key); },
    nearActs:(dk, p)=> caNearActs(key, p),
    onStep:(p)=> caStep(key, p),
    onRender:(world)=> caRender(key, world),
  };
  if(typeof DECKS !== 'undefined') DECKS[key] = d;
}
/* every place here, its name and where its back button goes */
const CA_PLACES = {
  r6_castle: { title:"The Fairy King's Castle", backLabel:'Jungle', backTo:'r6_jungle', music:'zone_castle', spawn:()=> [31, 59] },
  r6_palace: { title:'The Palace', backLabel:'Castle', music:'zone_palace', spawn:()=> [19, 31] },
  r6_tower:  { title:'The Central Tower', backLabel:'Castle', music:'zone_palace', spawn:()=> [14, 16] },
  r6_tavern: { title:'The Tavern', backLabel:'Castle', music:'zone_tavern', spawn:()=> [7, 10] },
  r6_records:{ title:'The Record Store', backLabel:'Castle', music:'zone_records', spawn:()=> [6, 9] },
};
CA_WALLS.forEach(k=>{ CA_PLACES['r6_wall_' + k] = { title:'The ' + CA_WALL_NAME[k], backLabel:'Castle', music:'zone_castle', spawn:()=> caWallStand(k, 'a') }; });
CA_CORNERS.forEach(c=>{ CA_PLACES['r6_ramp_' + c] = { title:'The ' + CA_CORNER_NAME[c], backLabel:'Castle', music:'zone_castle', spawn:()=>{ const s = caRampMap(c).tags.stair.stand; return [s.x, s.y]; } }; });
Object.entries(CA_PLACES).forEach(([k, o])=> caMakeDeck(k, o));
/* A wall's two ends: 'a' its west (north and south walls) or north end (west and east walls), 'b' the other. */
function caWallStand(k, end){
  const sp = CA_WALL_SPEC[k], mid = sp.walk[0] + 1;
  const a = end === 'a' ? 1 : 62;
  return sp.across ? [a, mid] : [mid, a];
}
/* to another of the castle's places, standing at (x, y) there */
function caGo(key, at){
  if(ui.caTalk) return;
  const w = walkState();
  w.at = w.at || {};
  if(at) w.at[key] = { x:at[0] != null ? at[0] : at.x, y:at[1] != null ? at[1] : at.y };
  ui.walkFresh = false;
  caLion.at = null;
  goDeck(key);
}
/* out of the gate: back into the jungle, before it */
function caToJungle(){
  if(ui.caTalk) return;
  const s = caJc().stand, w = walkState();
  w.at = w.at || {};
  w.at[JG_KEY] = { x:s.x, y:s.y };
  if(typeof jgState === 'function') jgState().at = { x:s.x, y:s.y };
  ui.walkFresh = false; ui.jgLion = null;
  goDeck(JG_KEY);
}
/* in at the gate (20-jungle.js's jgGate, once it is open) */
function caEnter(){
  const w = walkState();
  w.at = w.at || {};
  w.at[CA_KEY] = { x:31, y:59 };
  ui.walkFresh = false;
  caLion.at = null;
  goDeck(CA_KEY);
}

/* ---------- what stands about in each place ---------- */
const _caThings = {};
function caNpc(who, x, y, o){
  const c = CA_WHO[who] || {};
  return Object.assign({ x, y, cls:'ca-npc', html:()=> caMonImg(c.sprite, WALK_T * ((o && o.scale) || 1.45), o && o.faceR, c.icon), verb:'Talk', sub:c.name, act:()=> caTalk(who, o && o.line) }, o || {});
}
/* the counter in front of a shopkeeper: spoken to across it */
function caCounter(who, x, y, act){ return { x, y, icon:'', verb:'Talk', sub:(CA_WHO[who] || {}).name, act }; }
function caThings(key){
  if(_caThings[key]) return _caThings[key];
  const list = [];
  const T = (o)=> list.push(o);
  if(key === CA_KEY){
    const m = caGrounds(), tg = m.tags;
    T({ x:tg.gate.x, y:tg.gate.y, w:tg.gate.w, walk:true, icon:'', verb:'Out', where:'To the jungle', arrow:'down', act:()=> caToJungle() });
    CA_CORNERS.forEach(c=>{ const d = tg.towerDoors[c]; T({ x:d.x, y:d.y, icon:'', verb:'Up', where:'The ' + CA_CORNER_NAME[c], arrow:'up', act:()=>{ const s = caRampMap(c).tags.stair.stand; caGo('r6_ramp_' + c, [s.x, s.y]); } }); });
    T({ x:tg.palaceDoor.x, y:tg.palaceDoor.y, w:2, icon:'', verb:'Enter', where:'The palace', arrow:'up', act:()=> caGo('r6_palace', [19, 31]) });
    T({ x:tg.tavern.door[0], y:31, w:2, icon:'', verb:'Enter', where:'The tavern', arrow:'up', act:()=> caGo('r6_tavern', [7, 10]) });
    T({ x:tg.records.door[0], y:31, w:2, icon:'', verb:'Enter', where:'The record store', arrow:'up', act:()=> caGo('r6_records', [6, 9]) });
    tg.stalls.retail.keepers.forEach(k=> T(caNpc(k.who, k.x, k.y, { act:()=> caShopTalk('retail') })));
    { const st = tg.stalls.retail; T({ x:st.x, y:st.y, w:st.w, icon:'', verb:'Shop', sub:"The Fairybunnies' stall", act:()=> caShopTalk('retail') }); }   // across its counter
    /* (3.90) the painter is home, his picture uploaded; his portraits are still to come */
    tg.stalls.painter.keepers.forEach(k=> T(caNpc(k.who, k.x, k.y, { scale:1.6, act:()=> caPainterTalk() })));
    { const st = tg.stalls.painter; T({ x:st.x, y:st.y, w:st.w, icon:'', verb:'Talk', sub:'The Painter', act:()=> caPainterTalk() }); }   // across his counter
    T({ x:tg.stalls.painter.easel.x, y:tg.stalls.painter.easel.y, icon:'', verb:'Look', sub:"The painter's easel", act:()=> caLook('easel') });
    T({ x:tg.well.x, y:tg.well.y, icon:'', verb:'Look', sub:'The wishing well', act:()=> caLook('well') });
    T({ x:tg.board.x, y:tg.board.y, icon:'', verb:'Read', sub:'The notice board', act:()=> caLook('board') });
    T({ x:28, y:35, w:8, h:8, walk:true, icon:'', verb:'Look', sub:'The grand fountain', act:()=> caLook('fountain') });
    tg.palaceGuards.forEach((g, i)=> T(caNpc('knight', g.x, g.y, { faceR:i === 0, line:'palaceGate' })));
  } else if(key.startsWith('r6_wall_')){
    const k = key.slice(8), m = caWallMap(k), sp = m.tags.sp;
    const end = (e)=>{
      const a = e === 'a' ? 0 : 63;
      return sp.across ? { x:a, y:sp.walk[0], h:4 } : { x:sp.walk[0], y:a, w:4 };
    };
    ['a', 'b'].forEach(e=> T(Object.assign(end(e), { walk:true, icon:'', verb:'Go on', where:caEndLabel(k, e), arrow:sp.across ? (e === 'a' ? 'left' : 'right') : (e === 'a' ? 'up' : 'down'), act:()=> caWallEnd(k, e) })));
    CA_LOOKOUT_AT.forEach((a, i)=> T(caNpc('knight', sp.across ? a : sp.crenel, sp.across ? sp.crenel : a, { line:'lookout', still:true, faceR:!sp.across ? sp.out[0] > sp.walk[0] : i % 2 === 0 })));
  } else if(key.startsWith('r6_ramp_')){
    const c = key.slice(8), m = caRampMap(c), tg = m.tags;
    T({ x:tg.stair.x, y:tg.stair.y, w:2, h:2, icon:'', verb:'Down', where:'Into the castle', arrow:'down', act:()=>{ const d = caGrounds().tags.towerDoors[c].stand; caGo(CA_KEY, [d.x, d.y]); } });
    Object.entries(tg.arches).forEach(([s, a])=> T({ x:a.x, y:a.y, w:a.w, h:a.h, walk:true, icon:'', verb:'Along', where:'The ' + CA_WALL_NAME[a.wall], arrow:{ e:'right', w:'left', n:'up', s:'down' }[s], act:()=> caGo('r6_wall_' + a.wall, caWallStand(a.wall, caEndOf(a.wall, a.end))) }));
    tg.notches.forEach(n=> T(caNpc(n.who, n.x, n.y, { line:'rampart', still:true })));
    T({ x:tg.glass.x, y:tg.glass.y, icon:'', verb:'Look out', sub:'The spyglass', act:()=> caOverview(c) });
  } else if(key === 'r6_palace'){
    const m = caPalaceMap(), tg = m.tags, ct = tg.court;
    T({ x:tg.door.x, y:tg.door.y, w:tg.door.w, walk:true, icon:'', verb:'Out', where:'Into the castle', arrow:'down', act:()=>{ const d = caGrounds().tags.palaceDoor; caGo(CA_KEY, [d.x, d.y + 1]); } });
    T({ x:tg.stair.x, y:tg.stair.y, w:2, h:3, icon:'', verb:'Up', where:'The central tower', arrow:'up', act:()=> caGo('r6_tower', [14, 16]) });
    T(caNpc('king', ct.king.x, ct.king.y, { w:2, scale:1.75, mark:()=> typeof warKingDue === 'function' && warKingDue() }));   // (3.92) "!" when the war has a word for you
    T(caNpc('dauphin', ct.dauphin.x, ct.dauphin.y, { scale:1.55 }));
    T(caNpc('advisor', ct.advisor.x, ct.advisor.y, { scale:1.35, faceR:true }));
    T(caNpc('commander', ct.commander.x, ct.commander.y, { scale:1.6 }));
    tg.blades.forEach(b=>{ const el = ({ fire:'fire', ground:'earth', water:'water', grass:'grass' })[b.el];
      T({ x:b.x, y:b.y, icon:'', cls:'ca-npc ca-blade', still:true, html:()=> caMonImg('sealed_blade_' + el, WALK_T * 1.3, false, '🗡️'),   // (3.90) its picture
          verb:'Look', sub:'The sealed ' + el + ' blade', act:()=> caLook('blade-' + b.el) }); });
    tg.guards.forEach((g, i)=> T(caNpc('knight', g.x, g.y, { faceR:g.x < 20, line:'hallGuard', still:true })));
    tg.posts.forEach((g, i)=> T(caNpc('knight', g.x, g.y, { faceR:i % 2 === 0, line:'corridor' })));
  } else if(key === 'r6_tower'){
    const m = caTowerMap(), tg = m.tags;
    T({ x:tg.stair.x, y:tg.stair.y, w:4, h:2, icon:'', verb:'Down', where:'The palace', arrow:'down', act:()=> caGo('r6_palace', [35, 5]) });
    T(caNpc('princess', tg.princess.x, tg.princess.y, { scale:1.2, cls:'ca-npc ca-hiding', faceR:false }));
    tg.posts.forEach((g, i)=> T(caNpc('knight', g.x, g.y, { faceR:i === 0, line:'tower' })));
  } else if(key === 'r6_tavern'){
    const m = caTavernMap(), tg = m.tags;
    T({ x:tg.door.x, y:tg.door.y, w:2, walk:true, icon:'', verb:'Out', where:'Into the market', arrow:'down', act:()=>{ const b = caGrounds().tags.tavern; caGo(CA_KEY, [b.door[0], 32]); } });
    tg.keepers.forEach(k=>{ T(caNpc(k.who, k.x, k.y, { act:()=> caTavernTalk(k.who) })); T(caCounter(k.who, k.x, k.y + 1, ()=> caTavernTalk(k.who))); });
    T({ x:1, y:2, w:3, icon:'', verb:'Look', sub:'The fire', act:()=> caLook('hearth') });
  } else if(key === 'r6_records'){
    const m = caRecordsMap(), tg = m.tags;
    T({ x:tg.door.x, y:tg.door.y, w:2, walk:true, icon:'', verb:'Out', where:'Into the market', arrow:'down', act:()=>{ const b = caGrounds().tags.records; caGo(CA_KEY, [b.door[0], 32]); } });
    T(caNpc(tg.keeper.who, tg.keeper.x, tg.keeper.y, { act:()=> caShopTalk('records') })); T(caCounter(tg.keeper.who, tg.keeper.x, tg.keeper.y + 1, ()=> caShopTalk('records')));
    T({ x:tg.gramophone.x, y:tg.gramophone.y, icon:'', verb:'Look', sub:'The gramophone', act:()=> caShopTalk('records') });
  }
  _caThings[key] = list;
  return list;
}
/* which end of a wall a rampart's arch meets: a wall's 'a' end is its west or north one */
function caEndOf(wall, cornerSide){ return (cornerSide === 'w' || cornerSide === 'n') ? 'a' : 'b'; }
/* a wall's ends lead on two ways: its rampart, or straight on along the next wall */
const CA_WALL_ENDS = {
  n:{ a:['nw', 'w', 'a'], b:['ne', 'e', 'a'] }, s:{ a:['sw', 'w', 'b'], b:['se', 'e', 'b'] },
  w:{ a:['nw', 'n', 'a'], b:['sw', 's', 'a'] }, e:{ a:['ne', 'n', 'b'], b:['se', 's', 'b'] },
};
function caEndLabel(k, e){ const [c, wall] = CA_WALL_ENDS[k][e]; return 'Rampart · ' + CA_WALL_NAME[wall]; }
async function caWallEnd(k, e){
  if(ui.caTalk) return;
  const [c, wall, end] = CA_WALL_ENDS[k][e];
  const pick = await caChoose([], '', `The wall meets the <b>${CA_CORNER_NAME[c].toLowerCase()}</b>'s tower here.`, ['🏰 Up to the ' + CA_CORNER_NAME[c].toLowerCase(), '➡️ Along the ' + CA_WALL_NAME[wall].toLowerCase()]);
  if(pick === 0){ const arch = Object.values(caRampMap(c).tags.arches).find(a=> a.wall === k); caGo('r6_ramp_' + c, arch ? [arch.stand.x, arch.stand.y] : null); }
  else if(pick === 1) caGo('r6_wall_' + wall, caWallStand(wall, end));
}
/* a question with a few answers: resolves with the one chosen (or -1) */
function caChoose(faces, name, html, options){
  sceneCss();
  return new Promise(done=>{
    const box = document.createElement('div');
    box.className = 'scene-say ca-choose';
    box.innerHTML = `<div class="ss-faces">${(faces || []).join('')}</div>` +
      `<div class="ss-body">${name ? `<div class="ss-name">${escapeHtml(name)}</div>` : ''}<div>${html}</div>` +
      `<div class="ss-go ca-opts">${options.map((o, i)=> `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}" data-a="${i}">${o}</button>`).join('')}` +
      `<button class="btn btn-ghost" data-a="-1">Stay here</button></div></div>`;
    document.body.appendChild(box);
    box.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{ box.remove(); done(+b.dataset.a); }));
  });
}

/* ---------- who walks about: the walls' patrols, the palace's servants and patrols ---------- */
const CA_WALKERS = {};
function caWalkerDefs(key){
  if(CA_WALKERS[key]) return CA_WALKERS[key];
  const list = [];
  if(key.startsWith('r6_wall_')){
    const k = key.slice(8), sp = caWallMap(k).tags.sp, [l0, l1] = caWallMap(k).tags.lanes;
    /* the designer: "duck_knight2 and bug_knight1 patrols heading left and right on the wall tops, each
       comprising 5 of the same monster moving left and right from end to end" — along its edges */
    list.push({ id:k + 'd', who:'duck', n:5, along:sp.across ? 'x' : 'y', lane:l0, lo:2, hi:61, pos:14, dir:1 });
    list.push({ id:k + 'b', who:'bug', n:5, along:sp.across ? 'x' : 'y', lane:l1, lo:2, hi:61, pos:48, dir:-1 });
  } else if(key === 'r6_palace'){
    list.push({ id:'pd', who:'duck', n:3, along:'y', lane:4, lo:4, hi:30, pos:8, dir:1 });
    list.push({ id:'pb', who:'bug', n:3, along:'y', lane:35, lo:6, hi:30, pos:26, dir:-1 });
    list.push({ id:'ps1', who:'servant', wander:{ x0:2, y0:14, x1:10, y1:31 }, x:8, y:20 });
    list.push({ id:'ps2', who:'servant', wander:{ x0:29, y0:6, x1:37, y1:18 }, x:31, y:9 });
    list.push({ id:'ps3', who:'servantY', wander:{ x0:12, y0:24, x1:27, y1:31 }, x:20, y:29 });
  } else if(key === 'r6_tower'){
    list.push({ id:'ts1', who:'servant', wander:{ x0:2, y0:12, x1:27, y1:15 }, x:8, y:14 });
    list.push({ id:'ts2', who:'servantY', wander:{ x0:20, y0:5, x1:27, y1:10 }, x:22, y:7 });
  } else if(key === CA_KEY){
    /* (3.90) townsfolk about the market square, the avenue and the west garden */
    list.push({ id:'gc', who:'townChoux',  line:'townChoux',  wander:{ x0:22, y0:44, x1:41, y1:45 }, x:24, y:45 });
    list.push({ id:'gb', who:'townBunny',  line:'townBunny',  wander:{ x0:14, y0:37, x1:24, y1:41 }, x:20, y:39 });
    list.push({ id:'gr', who:'townCream',  line:'townCream',  wander:{ x0:39, y0:37, x1:49, y1:41 }, x:42, y:39 });
    list.push({ id:'gm', who:'townMelody', line:'townMelody', wander:{ x0:24, y0:32, x1:39, y1:33 }, x:30, y:33 });
    list.push({ id:'gd', who:'townDuck',   line:'townDuck',   wander:{ x0:29, y0:47, x1:34, y1:53 }, x:30, y:50 });
    list.push({ id:'gf', who:'townBird',   line:'townBird',   wander:{ x0:6, y0:13, x1:14, y1:29 }, x:10, y:21 });
  }
  list.forEach(wk=> wk.cells = caWalkerCells(wk));
  CA_WALKERS[key] = list;
  return list;
}
function caWalkerCells(wk){
  if(wk.wander) return [{ x:wk.x, y:wk.y }];
  const out = [];
  for(let i = 0; i < wk.n; i++){ const a = wk.pos - wk.dir * i; out.push(wk.along === 'x' ? { x:a, y:wk.lane } : { x:wk.lane, y:a }); }
  return out;
}
function caWalkerAt(key, x, y){ return (CA_WALKERS[key] || []).some(wk=> wk.cells.some(c=> c.x === x && c.y === y)); }
let _caTick = null;
function caWalkStart(key){
  clearInterval(_caTick);
  _caTick = setInterval(()=> caWalkTick(key), 460);
}
function caWalkTick(key){
  if(ui.screen !== key){ clearInterval(_caTick); _caTick = null; return; }
  if(ui.caTalk || ui.sceneRunning || walkState().busy || document.querySelector('.scene-say') || (typeof eyeBreakActive === 'function' && eyeBreakActive())) return;
  const p = caYou(), m = CA_MAPS[key](), list = caWalkerDefs(key);
  const free = (x, y, me)=> !caSolidCode(caAt(m, x, y)) && !(p && p.x === x && p.y === y) &&
    !list.some(o=> o !== me && o.cells.some(c=> c.x === x && c.y === y)) && !wBlockedBy(DECKS[key], x, y);
  list.forEach(wk=>{
    if(wk.wander){
      if(Math.random() < 0.45) return;
      const c = wk.cells[0], dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy])=>{ const x = c.x + dx, y = c.y + dy, a = wk.wander;
        return x >= a.x0 && y >= a.y0 && x <= a.x1 && y <= a.y1 && free(x, y, wk); });
      if(!dirs.length) return;
      const keep = wk.last && dirs.find(([dx, dy])=> dx === wk.last[0] && dy === wk.last[1]);
      const [dx, dy] = keep && Math.random() < 0.7 ? keep : dirs[Math.floor(Math.random() * dirs.length)];
      wk.last = [dx, dy];
      if(dx) wk.faceR = dx > 0;
      c.x += dx; c.y += dy;
    } else {
      if(wk.pos + wk.dir > wk.hi || wk.pos + wk.dir < wk.lo) wk.dir = -wk.dir;
      const next = wk.pos + wk.dir;
      const head = wk.along === 'x' ? { x:next, y:wk.lane } : { x:wk.lane, y:next };
      if(!free(head.x, head.y, wk)) return;                                   // somebody in the way: it waits
      wk.pos = next; wk.cells = caWalkerCells(wk);
      if(wk.along === 'x') wk.faceR = wk.dir > 0;
    }
    caWalkerPlace(wk);
  });
}
const CA_WALKER_SCALE = { servant:1.3, servantY:1.15, townChoux:1.25, townBunny:1.3, townCream:1.3, townMelody:1.35, townDuck:1.3, townBird:1.3 };
function caWalkerDraw(world, key){
  const els = ui.caWalkerEls = {};
  caWalkerDefs(key).forEach(wk=>{
    wk.els = wk.cells.map((c, i)=>{
      const el = document.createElement('div');
      el.className = 'walk-ent ca-walker';
      const who = CA_WHO[wk.who] || {};
      el.innerHTML = caMonImg(who.sprite, WALK_T * (CA_WALKER_SCALE[wk.who] || 1.4), false, who.icon);
      world.appendChild(el);
      return el;
    });
    els[wk.id] = wk.els;
    caWalkerPlace(wk);
  });
}
function caWalkerPlace(wk){
  (wk.els || []).forEach((el, i)=>{
    const c = wk.cells[i];
    if(!c) return;
    el.style.transform = `translate3d(${c.x * WALK_T}px,${c.y * WALK_T}px,0)`;
    el.style.zIndex = 10 + c.y;
    faceRight(el, wk.along === 'y' ? !!wk.faceR : !!wk.faceR);
  });
}
/* the one beside you, if any of them is: you can speak to them */
function caWalkerNear(key, p){
  for(const wk of caWalkerDefs(key)) for(const c of wk.cells) if(Math.abs(c.x - p.x) + Math.abs(c.y - p.y) === 1) return { wk, c };
  return null;
}

/* ---------- Lucesco, at your heels here too ---------- */
const caLion = { at:null, trail:[] };
function caLionAt(x, y){ return !!(caLion.at && caLion.at.x === x && caLion.at.y === y && ui.screen && ui.screen.startsWith('r6_') && ui.screen !== JG_KEY && CA_MAPS[ui.screen]); }
function caLionPlace(){
  const el = document.getElementById('caLion'), at = caLion.at;
  if(!el || !at) return;
  el.style.transform = `translate3d(${at.x * WALK_T}px,${at.y * WALK_T}px,0)`;
  el.style.zIndex = 10 + at.y;
  faceRight(el, !!at.faceR);
}
function caLionStep(p){
  caLion.trail = (caLion.trail || []).concat([{ x:p.x, y:p.y }]).slice(-3);
  const to = caLion.trail[caLion.trail.length - 2];
  if(to){ const at = caLion.at; caLion.at = { x:to.x, y:to.y, faceR:at ? (to.x !== at.x ? to.x > at.x : at.faceR) : false }; caLionPlace(); }
}

/* ---------- a step, the buttons beside you ---------- */
function caStep(key, p){
  caLionStep(p);
  caFirstLooks(key, p);
  return false;
}
function caNearActs(key, p){
  const acts = [{ key:'caLion', html:'🦁 Talk<small>Lucesco</small>', act:()=> caLionTalk(key) }];
  const n = caWalkerNear(key, p);
  if(n){ const who = CA_WHO[n.wk.who] || {}; acts.push({ key:'caW' + n.wk.id, at:n.c, html:`💬 Talk<small>${escapeHtml(who.name || '')}</small>`, act:()=> caTalk(n.wk.who, n.wk.line || (/^servant/.test(n.wk.who) ? 'servant' : 'patrol')) }); }
  return acts;
}

/* ---------- arriving ---------- */
function caRender(key, world){
  caCss(); sceneCss();
  ui.caTalk = false;
  const stage = $('#walkStage');
  if(stage) stage.classList.add('ca-stage', key === CA_KEY ? 'ca-out' : key.startsWith('r6_wall') || key.startsWith('r6_ramp') ? 'ca-high' : 'ca-in');
  const m = CA_MAPS[key]();
  caPaintStart(stage, world, m, m.views || null, key.startsWith('r6_wall') || key.startsWith('r6_ramp') ? '#163a22' : key === CA_KEY ? '#3d5a30' : '#1d1a26');
  /* Lucesco: where he was, or beside you as you arrive */
  const w = walkState(), p = w.at && w.at[key];
  if(p && (!caLion.at || Math.abs(caLion.at.x - p.x) + Math.abs(caLion.at.y - p.y) > 2)){
    const free = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy])=> ({ x:p.x + dx, y:p.y + dy })).find(q=> !caSolidCode(caAt(m, q.x, q.y)) && !wBlockedBy(DECKS[key], q.x, q.y) && !caWalkerAt(key, q.x, q.y));
    caLion.at = free ? { x:free.x, y:free.y, faceR:free.x < p.x } : null;
  }
  caLion.trail = p ? [{ x:p.x, y:p.y }] : [];
  if(caLion.at){
    const lion = document.createElement('div');
    lion.className = 'walk-ent rift-lion ca-lion';
    lion.id = 'caLion';
    lion.innerHTML = riftLucescoImg(WALK_T);
    world.appendChild(lion);
    caLionPlace();
  }
  caWalkerDraw(world, key);
  caWalkStart(key);
  if(p) caFirstLooks(key, p);
}

/* ============================================================
   THE PEOPLE: what they say
   ============================================================ */
function caFaceOf(who){
  if(who === 'you') return facePlayer();
  if(who === 'lion') return riftLucescoFace();
  return caFace(who);
}
function caNameOf(who){ return who === 'you' ? 'You' : who === 'lion' ? 'Lucesco' : (CA_WHO[who] || {}).name || ''; }
function caSay(faces, name, html){
  return new Promise(res=>{
    let done = false, t = null;
    const here = ui.screen;
    const fin = ()=>{ if(done) return; done = true; clearInterval(t); res(); };
    t = setInterval(()=>{ if(ui.screen !== here){ document.querySelectorAll('.scene-say').forEach(x=> x.remove()); fin(); } }, 250);
    sceneSay(faces, name, html).then(fin);
  });
}
/* lines in turn: each [who, html], or html said by nobody in particular */
async function caLines(seq){
  if(ui.caTalk) return;
  ui.caTalk = true;
  releaseKeys();
  const here = ui.screen;
  try {
    for(const l of seq){
      if(ui.screen !== here) break;
      const [who, html] = Array.isArray(l) ? l : [null, l];
      await caSay(who ? [caFaceOf(who)] : [], who ? caNameOf(who) : '', html);
    }
  } finally { ui.caTalk = false; refreshWalk(); }
}
/* one of a set of lines, a different one each time */
function caTurn(key, lines){
  const t = caState().talk;
  const n = t[key] = (t[key] || 0) + 1;
  return lines[(n - 1) % lines.length];
}
const CA_LINES = {
  king:[
    `<b>"Welcome, my friends. Rest here as long as you need. The castle is yours to wander."</b>`,
    `<b>"Two hundred years ago I sealed the four tribal ancestors in those blades, to end their wars. I pray they never need to be woken."</b>`,
    `<b>"The aliens grow bolder each day. Soon we must talk, you and I, about what must be done."</b>`,
  ],
  dauphin:[
    `<b>"Strong travellers! Good. Father says I must wait for the war council… I am very bad at waiting."</b>`,
    `<b>"My Steel Aegis has never been broken. Not once! …Well. Once. By the Commander. That doesn't count."</b>`,
    `<b>"Spar with me! Every day! We shall see who is stronger."</b>`,
  ],
  commander:[
    `<b>"Hmph. Stand straight as you pass the guard rows. Order is what keeps a kingdom standing."</b>`,
    `<b>"The blades must stay sealed. …Unless we have no other choice. And soon, we may not."</b>`,
    `<b>"No, I am NOT the King. Please stop bowing at me."</b>`,
  ],
  advisor:[
    `<b>"Hoo. I advise His Majesty. Mostly, I advise him not to listen to the Commander."</b>`,
    `<b>"The aliens came through the torn sky. Patience and cleverness will win this war, not just strong arms."</b>`,
    `<b>"Have you been up on the walls? From each rampart you can see a whole corner of the jungle. Very useful for lost travellers. Hoo."</b>`,
  ],
  princess:[
    `A small voice comes from behind the wardrobe. <b>"I-is there going to be a war? I don't want a war."</b>`,
    `<b>"My big sister says I'm a scaredy-cat. Maybe she's right. I'm staying right here."</b>`,
    `<b>"Lucesco used to give me rides on his back when I was little. …Is he still fluffy?"</b>`,
  ],
  palaceGate:[ `<b>"The King's guests! Go in, go in — His Majesty is in the great hall."</b>`, `<b>"Wipe your feet. The servants have just polished the floors."</b>` ],
  hallGuard:[ `The knight stands perfectly still and stares straight ahead.`, `<b>"Eyes front! …The throne is that way."</b>`, `The knight's eyes flick towards you, then back. Not a word.` ],
  corridor:[ `<b>"Mind the floors — the servants have just polished them. I slipped twice this morning."</b>`, `<b>"The banquet hall is to the west, the library to the east. And the stairs up the tower are at the far end."</b>` ],
  lookout:[ `<b>"All quiet on the wall… for now."</b>`, `<b>"See that? An alien band, out by the lake. They never come near the walls, though."</b>`, `<b>"Stand clear of the patrols, friend. They march from end to end all day long."</b>` ],
  rampart:[ `<b>"Use the spyglass, traveller. From up here you can see this whole corner of the jungle."</b>`, `<b>"Each corner has a tribe. They never joined the castle, but they are still the King's people."</b>` ],
  tower:[ `<b>"Shh. The little princess is in her room. She won't come out — she is frightened of the war."</b>`, `<b>"The Dauphin's room is at the end. Don't touch her armour. Trust me."</b>` ],
  patrol:[ `<b>"Left, right, left, right! Can't stop — patrol duty!"</b>`, `<b>"Halt! …Oh, it's the King's guests. As you were!"</b>` ],
  servant:[ `<b>"Excuse me! Fresh linens for the little princess."</b>`, `<b>"Dinner is at seven, as always. The cook is making star-fruit pie."</b>`, `<b>"So many knights to feed! I've never been so busy."</b>`,
            `<b>"I sway the little princess to sleep every night. We Mantises are very good at lullabies."</b>` ],
  townChoux:[ `<b>"Have you tried the tavern's choux buns? My big sister bakes them!"</b>`, `<b>"Choux! …Sorry. That's how we say hello."</b>` ],
  townBunny:[ `<b>"Big sale at the stall today! …There's always a big sale at the stall."</b>`, `<b>"Hop, hop! The bunnies' stall sells gold medals, you know. Real ones!"</b>` ],
  townCream:[ `<b>"The aliens took some of the market folk. The Royal Commander rewards anyone who brings two of them home in a day."</b>`, `<b>"Mmm. The fountain smells of rosewater today."</b>` ],
  townMelody:[ `<b>"La la la! Have you been to the record store? My cousin sells music there."</b>`, `<b>"Every place in the kingdom has its own song. Can you hear this one?"</b>` ],
  townDuck:[ `<b>"Quack! I mean — cadet reporting! One day I'll patrol the walls too."</b>`, `<b>"Five in a row on the walls, left, right, left, right. I practise in my room."</b>` ],
  townBird:[ `<b>"Hoo. I'm studying to be an advisor, like the great Royal Advisor."</b>`, `<b>"The aliens took my cousin. If you see a Fairybird in one of their bands… bring him home?"</b>` ],
  duck:[ `<b>"Quack— ahem. HALT! …Oh. It's you. Carry on."</b>` ],
  bug:[ `<b>"Click-click. From up here I can see right across the jungle."</b>` ],
  knight:[ `<b>"Use the spyglass. You can see this whole corner of the jungle from here."</b>` ],
};
function caTalk(who, line){
  if(ui.caTalk) return;
  if(who === 'king' || who === 'commander' || who === 'advisor' || who === 'dauphin'){ if(!caState().met.court) return caCourtScene(); }
  if(who === 'princess') return caPrincessTalk();
  if(who === 'king' && typeof warKingCastle === 'function') return warKingCastle();   // (3.92) the war: the council, the rides, the gift
  if(who === 'dauphin') return caDauphinTalk();          // (3.90) her spar
  if(who === 'commander') return caCommanderTalk();      // (3.90) the castle's people
  if(who === 'painter') return caPainterTalk();          // (3.90) home again
  const set = CA_LINES[line || who] || CA_LINES[who] || [`<b>"Hello!"</b>`];
  return caLines([[who, caTurn(line || who, set)]]);
}
/* "an elite royal army commander … whom the player funnily mistakes for the king due to his regal appearance" */
function caCourtScene(){
  caState().met.court = true; saveProfile();
  return caLines([
    ['you', `You walk up the long hall, past the rows of knights, to the most magnificent fairy you have ever seen — tall, shining, a great plume on his helmet. You bow low.<br><br><b>"Your Majesty! We came as fast as we could!"</b>`],
    ['commander', `<b>"…Ahem."</b> The magnificent fairy coughs. <b>"I am honoured. Truly. But I am only the Royal Commander."</b>`],
    ['advisor', `<b>"Hoo-hoo-hoo! It happens every time. It's the helmet, Commander. You polish it far too much."</b>`],
    ['dauphin', `<b>"Ha! They thought Sir Chestnut was Father! I am never letting him forget this."</b>`],
    ['king', `A warm laugh comes from the throne. <b>"Over here, my friends. The one with the crown."</b>`],
    ['king', `<b>"Lucesco has told me everything. You have been freeing my people from the aliens. The whole kingdom thanks you."</b>`],
    ['king', `<b>"Rest. Explore my castle. Soon we must talk about the four blades behind me — and about what we may have to do with them."</b>`],
    ['lion', `<b>"He is a good king. He has always been a good king."</b>`],
  ]);
}
function caPrincessTalk(){
  const c = caState();
  if(!c.met.princess){
    c.met.princess = true; saveProfile();
    return caLines([
      ['princess', `Something behind the wardrobe squeaks. <b>"G-go away! Is it the aliens? Please don't be the aliens!"</b>`],
      ['lion', `<b>"It is only me, little one. Lucesco. And two friends of mine."</b>`],
      ['princess', `A small face peeks out. <b>"…Lucesco? It really is you!"</b> Then she ducks back again. <b>"I'm still not coming out. Everyone says there will be a war."</b>`],
    ]);
  }
  return caLines([['princess', caTurn('princess', CA_LINES.princess)]]);
}
function caLionTalk(key){
  const lines = [
    `<b>"I came here often, long ago, when the King was young. It has hardly changed."</b>`,
    `<b>"There are four ramparts, one on each corner tower. From each one you can see a corner of the jungle."</b>`,
    `<b>"The little princess… I remember the day she was born. She was so very small."</b>`,
    `<b>"Smell that? Cinnamon. The tavern by the fountain. Rest there if your team is tired."</b>`,
  ];
  return caLines([['lion', caTurn('lion', lines)]]);
}
function caLook(what){
  const BL = { fire:['fire', 'It is warm to look at, and it hums, low and angry, as if it is still fighting.'], ground:['earth', 'It is heavy and still. A deep grumble comes from inside the stone.'],
               water:['water', 'Frost creeps round its stone, and a restless sound like waves comes from it.'], grass:['grass', 'Tiny leaves curl from the cracks in its stone. It seems to whisper.'] };
  if(what.startsWith('blade-')){
    const [nm, feel] = BL[what.slice(6)];
    return caLines([`A sword sunk deep in stone, wrapped in chains of light: the sealed blade of the ${nm} ancestor. ${feel}`]);
  }
  const L = {
    well:[`A wishing well. You drop a pebble in and make a wish. Far below, it goes <i>plink</i>.`, ['lion', `<b>"What did you wish for? …No, don't tell me. Then it won't come true."</b>`]],
    board:[`📜 <b>CASTLE NOTICES</b><br>• <b>The Tavern</b> — rest by the fire.<br>• <b>The Record Store</b> — music for every journey.<br>• <b>The Fairybunnies' stall</b> — special bargains, this week only!<br>• <b>The Painter</b> — portraits coming soon!<br>• From the walls, by order of the Commander: <i>"Do not get in the patrols' way."</i>`],
    fountain:[`The grand fountain. A golden fairy holds a star high above the spray, and coins glitter at the bottom of the basin.`],
    hearth:[`The fire crackles and pops. The whole room smells of pine wood and cinnamon buns.`],
    easel:[`A half-finished painting of the grand fountain, still wet. Beside it, a row of blank canvases, waiting.`],
  };
  return caLines(L[what] || [`Nothing much to see.`]);
}
/* the tavern: rest by the fire — the Recover page's words, in the warm */
async function caTavernTalk(who){
  if(ui.caTalk) return;
  const lines = who === 'cream'
    ? `<b>"Welcome in, dears! Sit by the fire and rest a while. Your monsters look tired."</b>`
    : `<b>"Would you like a choux bun? They're fresh! …No? Then rest by the fire, at least."</b>`;
  ui.caTalk = true;
  let yes = false;
  try { yes = await r5Ask([caFace(who)], caNameOf(who), lines, '🔥 Rest by the fire', 'Not now'); }
  finally { ui.caTalk = false; }
  if(yes) leaveDeck('recover');
}

/* ---------- the first look at each place ---------- */
function caFirstLooks(key, p){
  const c = caState();
  if(ui.caTalk || ui.sceneRunning) return;
  const once = (k, seq)=>{ if(c.seen[k]) return false; c.seen[k] = true; saveProfile(); setTimeout(()=>{ if(ui.screen === key) caLines(seq); }, 450); return true; };
  if(key === CA_KEY) once('grounds', [['lion', `<b>"The Fairy King's castle. I have not walked here in two hundred years…"</b>`], ['lion', `<b>"It is even more beautiful than I remember."</b>`]]);
  else if(key === 'r6_palace' && !c.met.court && p.y <= 11) caCourtScene();
  else if(key.startsWith('r6_wall_')) once('walls', [`From up here you can see the whole castle below you on one side — and the jungle stretching away on the other.`]);
  else if(key.startsWith('r6_ramp_')) once('ramparts', [['knight', CA_LINES.rampart[0]]]);
  else if(key === 'r6_tower') once('tower', [['knight', CA_LINES.tower[0]]]);
  else if(key === 'r6_tavern') once('tavern', [['cream', `<b>"Oh! Visitors! Come in, come in, out of the cold. The fire's lit and the buns are warm."</b>`]]);
  else if(key === 'r6_records') once('records', [['melody', `<b>"♪ La-la-la— oh! A customer! Welcome, welcome!"</b>`]]);
}

/* ============================================================
   THE SPYGLASS: a rampart's corner of the jungle, from high up
   ------------------------------------------------------------
   The designer: "each corner has a rampart from which the corresponding
   corner of the map can be observed with a slight zoom out and by
   scrolling. this will help the player to navigate." The jungle's quarter
   on that side, every hedge and path of it (not only where you have been),
   its village and the alien bands still out today; drag to look about.
   ============================================================ */
function caOverview(c){
  if(ui.caTalk) return;
  releaseKeys();
  const G = jgGround(), P = G.places, half = JG.W / 2;
  const q = { x0:c[1] === 'w' ? 0 : half, y0:c[0] === 'n' ? 0 : half };
  q.x1 = q.x0 + half; q.y1 = q.y0 + half;
  const C = P.castle, corner = { x:c[1] === 'w' ? C.x : C.x + C.w, y:c[0] === 'n' ? C.y : C.y + C.h };
  const ov = document.createElement('div');
  ov.className = 'ca-ov';
  const side = Math.min(window.innerWidth - 32, window.innerHeight - 190, 640);
  ov.innerHTML = `<div class="ca-ov-card"><div class="ca-ov-title">🔭 The ${escapeHtml(CA_CORNER_NAME[c])}: the jungle's ${{ nw:'north-west', ne:'north-east', sw:'south-west', se:'south-east' }[c]}</div>
      <canvas id="caOvCv" style="width:${side}px;height:${side}px;"></canvas>
      <div class="ca-ov-key">Drag to look about · 🏰 you are here · 🔴 an alien band</div>
      <div class="ca-ov-btns"><button class="btn btn-ghost" id="caOvZoom">🔍 Closer</button><button class="btn btn-primary" id="caOvClose">Close</button></div></div>`;
  document.body.appendChild(ov);
  const cv = ov.querySelector('#caOvCv'), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(side * dpr); cv.height = Math.round(side * dpr);
  const ctx = cv.getContext('2d');
  const view = { z:9, cx:(corner.x + (c[1] === 'w' ? q.x0 + 40 : q.x1 - 40)) / 2, cy:(corner.y + (c[0] === 'n' ? q.y0 + 40 : q.y1 - 40)) / 2 };
  const clamp = ()=>{
    const hw = side / view.z / 2;
    view.cx = Math.max(q.x0 + hw, Math.min(q.x1 - hw, view.cx));
    view.cy = Math.max(q.y0 + hw, Math.min(q.y1 - hw, view.cy));
  };
  clamp();
  let raf = 0;
  const draw = ()=>{
    raf = 0;
    const k = view.z * dpr, ox = cv.width / 2 - view.cx * k, oy = cv.height / 2 - view.cy * k;
    ctx.fillStyle = '#163a22'; ctx.fillRect(0, 0, cv.width, cv.height);
    const x0 = Math.max(q.x0, Math.floor(-ox / k)), y0 = Math.max(q.y0, Math.floor(-oy / k));
    const x1 = Math.min(q.x1 - 1, Math.ceil((cv.width - ox) / k)), y1 = Math.min(q.y1 - 1, Math.ceil((cv.height - oy) / k));
    for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){
      const px = Math.round(ox + x * k), py = Math.round(oy + y * k);
      jgPaintTile(ctx, x, y, px, py, Math.round(ox + (x + 1) * k) - px, Math.round(oy + (y + 1) * k) - py, 0);
    }
    for(let y = y0; y <= y1 + 1; y++) for(let x = x0; x <= x1; x++){
      if(jgTile(x, y) !== JG_T.TREE) continue;
      ctx.drawImage(jgSprite('tree', jgHash(x, y, 3) < 0.5 ? 0 : 1), Math.round(ox + (x - 0.5) * k), Math.round(oy + (y - 1.2) * k), Math.round(2 * k), Math.round(2 * k));
    }
    jgBands().forEach(b=>{
      if(jgBandBeaten(b) || b.x < x0 || b.x > x1 || b.y < y0 || b.y > y1) return;
      ctx.fillStyle = b.rank === 'alien' ? '#e0393e' : '#9a1020'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.arc(ox + (b.x + 0.5) * k, oy + (b.y + 0.5) * k, (b.rank === 'alien' ? 4 : 6) * dpr, 0, 7); ctx.fill(); ctx.stroke();
    });
    ctx.font = `${Math.round(20 * dpr)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    JG_TRIBE_KEYS.forEach(t=>{
      const v = P.villages[t];
      if(v.x + v.w < q.x0 || v.x > q.x1 || v.y + v.h < q.y0 || v.y > q.y1) return;
      const vx = ox + (v.x + v.w / 2) * k, vy = oy + (v.y + v.h / 2) * k;
      ctx.fillText(JG_TRIBES[t].icon, vx, vy);
      ctx.font = `bold ${Math.round(12 * dpr)}px sans-serif`; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3 * dpr;
      ctx.strokeText(JG_TRIBES[t].name.replace(/^the /, 'The '), vx, vy + 18 * dpr); ctx.fillText(JG_TRIBES[t].name.replace(/^the /, 'The '), vx, vy + 18 * dpr);
      ctx.font = `${Math.round(20 * dpr)}px sans-serif`;
    });
    ctx.fillText('🏰', ox + corner.x * k, oy + corner.y * k);
  };
  const redraw = ()=>{ if(!raf) raf = requestAnimationFrame(draw); };
  draw();
  let drag = null;
  cv.addEventListener('pointerdown', e=>{ drag = { x:e.clientX, y:e.clientY, cx:view.cx, cy:view.cy }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e=>{ if(!drag) return; view.cx = drag.cx - (e.clientX - drag.x) / view.z; view.cy = drag.cy - (e.clientY - drag.y) / view.z; clamp(); redraw(); });
  ['pointerup', 'pointercancel'].forEach(t=> cv.addEventListener(t, ()=>{ drag = null; }));
  ov.querySelector('#caOvZoom').addEventListener('click', e=>{ view.z = view.z === 9 ? 15 : 9; e.target.textContent = view.z === 9 ? '🔍 Closer' : '🔭 Further'; clamp(); redraw(); });
  const close = ()=>{ ov.remove(); };
  ov.querySelector('#caOvClose').addEventListener('click', close);
  ov.addEventListener('click', e=>{ if(e.target === ov) close(); });
  ui.caOverview = { view, q, side, redraw };
}

/* ============================================================
   THE GATE OPENS (from the jungle side, 20-jungle.js's jgGate)
   ============================================================ */
async function caGateOpens(){
  const face = [jgFace(JG_GATE_KNIGHT + '_front', 'fairy_knight_front')];
  await jgLines(face, JG_GATE_KNIGHT_NAME, [
    `The knights stand to attention as you come near.<br><br><b>"Good news, travellers! His Majesty the Fairy King has come home from the front!"</b>`,
    `<b>"He has heard what you have done for our people. By his order, the gates of the castle are open to you."</b>`,
  ]);
  caState().open = true; saveProfile();
  toast('🏰 The great gates swing open!');
  playSfx('stone_high');
  setTimeout(()=> caEnter(), 700);
}

/* ============================================================
   THE DAUPHIN'S SPAR (3.90) — the designer: "always looking for a fight
   with the player to get stronger (5 bronze medals daily, flanked by
   chestnut_knight2_c and fairy_bird2_c), [she] casts steel aegis, knight
   casts diamond dust and fairy bird casts mirage. they all use ultra moves
   then max moves whenever they can"; "all 3 are 175".
   Asked in the throne room, once the court has met you: one wave, the
   Royal Commander (Chestnut Knight, crowned), the Dauphin and the Royal
   Advisor (Fairybird, crowned), all Lv 175. Each casts its Very High on its
   first action — Diamond Dust, Steel Aegis, Mirage — and throws its Ultra
   stone in the same action (Grass, Steel, Flying); after that, its Max
   every turn. Their side recharges every 7 turns, as any (foeRecharge: turn
   8, 15…): the Very High and the Ultra again. The first win of each day pays
   10 bronze medals (5 until the designer raised it, for its difficulty); a
   spar after that is for the fun of it. It can be given
   up; lost, the team comes round as after any loss, and nothing else is
   lost, not even XP. You are back before the throne either way.
   ============================================================ */
const CA_SPAR = { level:175, bronze:10, foes:[   // (3.90) the designer: "due to the difficulty of the dauphin fight, increase rewards to 10 bronze daily"
  { who:'commander', species:'chestnut_knight', crowned:true,  vh:'Fairy',  ultra:'Grass' },
  { who:'dauphin',   species:'fairy_dauphin',   crowned:false, vh:'Steel',  ultra:'Steel' },
  { who:'advisor',   species:'fairybird',       crowned:true,  vh:'Flying', ultra:'Flying' }] };
function caSpar(){ const c = caState(); if(!c.spar || typeof c.spar !== 'object') c.spar = {}; return c.spar; }
function caSparPaidToday(){ return caSpar().paid === today(); }
async function caDauphinTalk(){
  if(ui.caTalk) return;
  const s = caSpar(), paid = caSparPaidToday();
  const rules = `<br><br><i>Lv ${CA_SPAR.level}: the Royal Commander, the Dauphin and the Royal Advisor. Each casts its Very High (Diamond Dust, Steel Aegis, Mirage) and an Ultra stone first, then its Max every turn.</i>`;
  const html = !s.asked
    ? `<b>"You! Father's guests! I have waited all day for somebody strong enough."</b><br><br><b>"Spar with me! Sir Chestnut and the Advisor will stand at my side, and we will hold nothing back. Win, and you shall have ${CA_SPAR.bronze} bronze medals from my own purse."</b>` + rules
    : paid ? caTurn('sparAgain', [`<b>"Again? Ha! I like you."</b>`, `<b>"One more! I almost had you last time. …Almost."</b>`]) + `<br><br><i>Today's ${CA_SPAR.bronze} bronze medals are yours already. This one is for the fun of it — the medals come again tomorrow.</i>`
    : caTurn('sparAsk', [`<b>"Ready for today's spar? My hammer is!"</b>`, `<b>"Sir Chestnut says I must practise every day. So: you, me, now!"</b>`, `<b>"I have been training all morning. Let's see who is stronger today!"</b>`])
      + `<br><br><i>Win: 🥉 ${CA_SPAR.bronze} bronze medals, the first win each day.</i>` + rules;
  releaseKeys();
  ui.caTalk = true;
  let yes = false;
  try { yes = await r5Ask([caFace('dauphin')], caNameOf('dauphin'), html, '⚔️ Spar!', 'Not now'); }
  finally { ui.caTalk = false; }
  if(!s.asked){ s.asked = true; saveProfile(); }
  if(yes) caSparBegin(); else refreshWalk();
}
function caSparBegin(){
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first. Rest by the tavern fire.'); return; }
  releaseKeys();
  walkTeardown();
  beginBattle(Object.assign(caSparBattle(), { onWin:(levelUps)=> caSparWon(levelUps) }));
  setTimeout(()=>{ if(ui.battle && ui.battle.caSpar) battleMsg('⚔️ The Dauphin raises her hammer — the Royal Commander and the Royal Advisor at her side!'); }, 700);
}
/* the fight itself, as the throne room has it — and (3.91) the Test Arena's card */
function caSparBattle(){
  const wave = CA_SPAR.foes.map(f=> ({ species:f.species, level:CA_SPAR.level, ai:'best', nerfed:false, anyLevel:true, crowned:f.crowned,
    veryHigh:{ type:f.vh, plus:0, cast:true }, caSpar:{ who:f.who, ultra:f.ultra } }));
  return { waves:[wave], isNpc:true, caSpar:true, name:"The Dauphin's spar", bgKey:'battle_palace', foeRegion:6, onWaveStart:(i)=> caSparWaveStart(i) };
}
function caSparNote(){
  return `The Royal Commander (Chestnut Knight, crowned), the Dauphin and the Royal Advisor (Fairybird, crowned), all Lv ${CA_SPAR.level}. ` +
    `Each casts its Very High on its first action — Diamond Dust, Steel Aegis, Mirage — and throws its Ultra stone (Grass, Steel, Flying) in the same action; then its Max every turn. ` +
    `Their side recharges every 7 turns: both again. In the throne room the first win each day pays ${CA_SPAR.bronze} bronze medals; here, nothing.`;
}
/* as they walk on: which of the three each is, and its Ultra stone (their recharge brings it back) */
function caSparWaveStart(i){
  const b = ui.battle;
  if(!b) return;
  const spec = b.waves[i] || [];
  b.enemies.forEach((e, k)=>{
    const s = spec[k] || {};
    if(!s.caSpar) return;
    e.caSpar = Object.assign({}, s.caSpar);
    e.futureUltra = { type:s.caSpar.ultra, plus:0, used:false };
  });
}
/* each of their actions asks (futureUltraFor): the Ultra whenever it is ready — its first action, and the first after each recharge */
function caSparUltra(e){
  const u = e.futureUltra;
  if(!u || u.used || e._windup || !ui.battle) return null;
  u.used = true;
  return enemyUltraMove(u.type, u.plus);
}
if(typeof futureUltraFor === 'function'){
  const _caFutureUltraFor = futureUltraFor;
  futureUltraFor = function(e){ return (e && e.caSpar) ? caSparUltra(e) : _caFutureUltraFor.apply(this, arguments); };
}
function caDauphinImg(){ return jgMonImg('fairy_dauphin2_front', 140); }
function caSparWon(levelUps){
  /* (3.91) once a spar: a win told twice (a last blow and a burn together) pays and counts once */
  const bt = ui.battle;
  if(bt){ if(bt.caSparWonDone) return; bt.caSparWonDone = true; }
  const s = caSpar(), pay = s.paid !== today();
  s.wins = (s.wins || 0) + 1;
  if(pay){
    s.paid = today();
    state.medals = state.medals || {};
    state.medals.bronze = (state.medals.bronze || 0) + CA_SPAR.bronze;
  }
  saveProfile();
  const line = caTurn('sparWon', [`"Ow, ow, ow… That was WONDERFUL! Again tomorrow?"`, `"You broke my Steel Aegis! Nobody breaks my Steel Aegis!"`, `"Hmph. Fine. You win today. I'll train twice as hard tonight!"`]);
  storyModal(caDauphinImg(), 'The Dauphin',
    `<b>${line}</b><br><br>` + (pay ? `🥉 <b>+${CA_SPAR.bronze} bronze medals</b> (you have ${state.medals.bronze}).` : `<i>Today's medals are yours already — more tomorrow.</i>`),
    ()=> caSparBack(), { subtitle:"The Dauphin's spar", bg:'palace' });
}
function caSparEnded(how){
  const b = ui.battle;
  if(!b || !b.caSpar || b.caSparDone) return;
  b.caSparDone = true;
  b.phase = 'resolving';
  if(how === 'lost') healingTeam().forEach(m=>{ m.currentHp = Math.max(1, Math.floor(monMaxHp(m) * 0.10)); });   // as after any loss — but no XP lost
  const brk = tallyBattleForEyeBreak();
  stopMusic();
  if(how === 'lost') playSfx('defeat');
  saveProfile();
  const line = how === 'lost'
    ? caTurn('sparLost', [`"Ha! My Steel Aegis holds! Come back stronger — I'll be right here."`, `"Victory for the crown! …Are your monsters all right? Rest by the tavern fire, then try again."`])
    : `"Giving up already? Ha! Come back whenever you're ready."`;
  storyModal(caDauphinImg(), 'The Dauphin',
    `<b>${line}</b><br><br><i>${how === 'lost' ? 'Your team fainted and recovered a little. Nothing else is lost — not even XP.' : 'Nothing is lost.'} Spar again whenever you like.</i>`,
    ()=> caSparBack(), { subtitle:"The Dauphin's spar", bg:'palace' });
  if(brk) showEyeBreak();
}
/* back before the throne, where you asked */
function caSparBack(){
  ui.walkFresh = false;
  walkState().busy = false;
  goDeck('r6_palace');
}

/* ============================================================
   THE ROYAL COMMANDER'S THANKS (3.90) — the designer: "the chestnut
   commander awards 10 tokens per day for 2 fairy kingdom citizens rescued".
   The alien bands nearest the castle hold its people (20-jungle.js,
   jgZoneOf); once you have met the court, each day's first 2 of them freed
   pay 10 Skill Tokens (jgWon), with his thanks.
   ============================================================ */
const CA_RESCUE = { need:2, tokens:10 };
function caCommanderMet(){ return !!(state && state.progress && state.progress.region6 && caState().met.court); }
function caCommanderThanks(){
  return new Promise(res=>{
    storyModal(jgMonImg('chestnut_knight2_c_front', 140), '🛡️ The Royal Commander',
      `<b>"${CA_RESCUE.need} of our people, home safe. You have the castle's thanks — and mine."</b><br><br>` +
      `${tokenIcon(18)} <b>+${CA_RESCUE.tokens} Skill Tokens</b> (you have ${state.inventory.tokens}).<br><br><i>Free ${CA_RESCUE.need} more tomorrow, and he will thank you again.</i>`,
      ()=> res(), { subtitle:'The Royal Commander', bg:'jungle' });
  });
}
/* his word in the throne room: how many of them are home today */
function caCommanderTalk(){
  const j = typeof jgState === 'function' ? jgState() : { rescued:{}, paid:{} };
  const n = Math.min(CA_RESCUE.need, j.rescued.castle || 0);
  const c = caState();
  if(!c.met.rescue){
    c.met.rescue = true; saveProfile();
    return caLines([
      ['commander', `<b>"A word, travellers. The aliens have taken some of our own people — townsfolk, knights, even the young ones."</b>`],
      ['commander', `<b>"The bands closest to the castle hold them. Free ${CA_RESCUE.need} of our people in a day, and I will pay you ${CA_RESCUE.tokens} Skill Tokens. Every day."</b>`],
    ]);
  }
  const said = j.paid.castle ? `<b>"You have brought ${CA_RESCUE.need} of our people home today. Thank you. Rest now."</b>`
    : caTurn('commander', CA_LINES.commander) + `<br><br><i>The castle's people freed today: ${n}/${CA_RESCUE.need} — ${CA_RESCUE.tokens} Skill Tokens at ${CA_RESCUE.need}.</i>`;
  return caLines([['commander', said]]);
}
/* the painter, home now with his paints: his portraits are still to come */
function caPainterTalk(){
  return caLines([['painter', caTurn('painter', [
    `<b>"Ah, visitors! Forgive the mess — my paints only arrived this morning."</b>`,
    `<b>"Portraits! Soon I shall paint portraits. Come back when my canvases are ready."</b>`,
    `<b>"Hold still… no, no, I'm only practising. The real paintings are coming soon."</b>`])]]);
}

/* ---------- the King's hall, as a backdrop: for the spar and its words, until there is art (battle_palace.png) ---------- */
let _caPalaceBg = null;
function caPalaceBgUri(){
  if(_caPalaceBg) return _caPalaceBg;
  try {
    const W = 540, H = 960, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const hz = H * 0.46;                                                       // where the floor meets the far wall
    /* the far wall: cream and rose, gilded */
    let gr = g.createLinearGradient(0, 0, 0, hz);
    gr.addColorStop(0, '#d9b8cf'); gr.addColorStop(0.55, '#f1dfe8'); gr.addColorStop(1, '#f8ece2');
    g.fillStyle = gr; g.fillRect(0, 0, W, hz);
    /* tall arched windows, light pouring in */
    for(let k = 0; k < 4; k++){
      const x = W * (0.16 + k * 0.227), w = 54, top = hz * 0.16, bot = hz * 0.82;
      g.fillStyle = '#c99a3c'; g.beginPath(); g.moveTo(x - w / 2 - 6, bot); g.lineTo(x - w / 2 - 6, top + w / 2); g.arc(x, top + w / 2, w / 2 + 6, Math.PI, 0); g.lineTo(x + w / 2 + 6, bot); g.closePath(); g.fill();
      const wg = g.createLinearGradient(0, top, 0, bot); wg.addColorStop(0, '#fffbe8'); wg.addColorStop(1, '#bfe2f2');
      g.fillStyle = wg; g.beginPath(); g.moveTo(x - w / 2, bot); g.lineTo(x - w / 2, top + w / 2); g.arc(x, top + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w / 2, bot); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(160,120,60,.5)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, top); g.lineTo(x, bot); g.moveTo(x - w / 2, top + w * 0.95); g.lineTo(x + w / 2, top + w * 0.95); g.stroke();
    }
    /* the throne on its dais, banners either side */
    const tx = W / 2;
    g.fillStyle = '#b07ab8'; g.fillRect(tx - 92, hz - 26, 184, 26);
    g.fillStyle = '#e0c060'; g.fillRect(tx - 92, hz - 30, 184, 5);
    g.fillStyle = '#d4a93c'; g.beginPath(); g.moveTo(tx - 34, hz - 30); g.lineTo(tx - 34, hz - 120); g.quadraticCurveTo(tx, hz - 156, tx + 34, hz - 120); g.lineTo(tx + 34, hz - 30); g.closePath(); g.fill();
    g.fillStyle = '#c0407a'; g.fillRect(tx - 22, hz - 108, 44, 60);
    [-150, 150].forEach(dx=>{
      g.fillStyle = '#c64a83'; g.beginPath(); g.moveTo(tx + dx - 24, hz * 0.14); g.lineTo(tx + dx + 24, hz * 0.14); g.lineTo(tx + dx + 24, hz * 0.66); g.lineTo(tx + dx, hz * 0.6); g.lineTo(tx + dx - 24, hz * 0.66); g.closePath(); g.fill();
      g.fillStyle = '#f2cf5b'; g.font = 'bold 30px serif'; g.textAlign = 'center'; g.fillText('♛', tx + dx, hz * 0.36);
    });
    /* the floor: marble in perspective, the red carpet down the middle */
    gr = g.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, '#efe3e8'); gr.addColorStop(1, '#fbf6f2');
    g.fillStyle = gr; g.fillRect(0, hz, W, H - hz);
    const vx = W / 2, vy = hz - 40;
    g.strokeStyle = 'rgba(176,140,160,.35)'; g.lineWidth = 1.5;
    for(let k = -9; k <= 9; k++){ g.beginPath(); g.moveTo(vx + k * 12, hz); g.lineTo(vx + k * 150, H); g.stroke(); }
    for(let r = 0; r < 12; r++){ const y = hz + (H - hz) * Math.pow(r / 12, 1.8); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = '#b8323f'; g.beginPath(); g.moveTo(vx - 26, hz); g.lineTo(vx + 26, hz); g.lineTo(vx + 210, H); g.lineTo(vx - 210, H); g.closePath(); g.fill();
    g.strokeStyle = '#e8c35a'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(vx - 22, hz); g.lineTo(vx - 196, H); g.moveTo(vx + 22, hz); g.lineTo(vx + 196, H); g.stroke();
    /* columns down both sides, nearer ones bigger */
    [[0.06, 0.88], [0.94, 0.88], [0.17, 0.62], [0.83, 0.62], [0.25, 0.5], [0.75, 0.5]].sort((a, b)=> a[1] - b[1]).forEach(([fx, s])=>{
      const cx = W * fx, w = 64 * s, base = hz + (H - hz) * (s - 0.42) * 1.4, top = 0;
      const cg = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
      cg.addColorStop(0, '#d8cbd3'); cg.addColorStop(0.45, '#fffaf6'); cg.addColorStop(1, '#c9b8c3');
      g.fillStyle = cg; g.fillRect(cx - w / 2, top, w, base - top);
      g.fillStyle = '#e2c05e'; g.fillRect(cx - w / 2 - 6 * s, base - 16 * s, w + 12 * s, 16 * s); g.fillRect(cx - w / 2 - 6 * s, top + 40 * s, w + 12 * s, 12 * s);
    });
    /* light from the windows */
    g.globalCompositeOperation = 'lighter';
    for(let k = 0; k < 4; k++){
      const x = W * (0.16 + k * 0.227);
      const lg = g.createLinearGradient(0, hz * 0.3, 0, H * 0.9); lg.addColorStop(0, 'rgba(255,240,200,.16)'); lg.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = lg; g.beginPath(); g.moveTo(x - 24, hz * 0.3); g.lineTo(x + 24, hz * 0.3); g.lineTo(x + 140 + k * 10, H * 0.9); g.lineTo(x + 40 + k * 10, H * 0.9); g.closePath(); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    _caPalaceBg = c.toDataURL('image/jpeg', 0.86);
  } catch(e){ _caPalaceBg = typeof r6SkyUri === 'function' ? r6SkyUri() : ''; }
  return _caPalaceBg;
}

/* ============================================================
   THE LOOK
   ============================================================ */
let _caCss = false;
function caCss(){
  if(_caCss || typeof document === 'undefined') return;
  _caCss = true;
  const s = document.createElement('style');
  s.id = 'caCss';
  s.textContent = `
  .walk-stage.ca-stage{ background:#2b2a33; }
  .ca-ground{ position:absolute; inset:0; width:100%; height:100%; display:block; z-index:0; pointer-events:none; }
  .ca-stage .walk-world{ z-index:1; }
  .walk-ent.ca-npc, .walk-ent.ca-walker{ overflow:visible; }
  .walk-ent .ca-art{ position:absolute; left:50%; bottom:0; transform:translateX(-50%); image-rendering:pixelated; pointer-events:none;
    filter:drop-shadow(0 3px 2px rgba(0,0,0,.35)); }
  .walk-ent.face-r .ca-art{ transform:translateX(-50%) scaleX(-1); }
  .walk-ent.ca-walker{ transition:transform .44s linear; pointer-events:none; }
  .walk-ent.ca-lion{ transition:transform .2s linear; }
  .walk-ent.ca-hiding .ca-art{ opacity:.85; animation:caTremble 1.4s ease-in-out infinite; }
  .walk-ent.ca-blade .ca-art{ bottom:16%; filter:drop-shadow(0 0 5px rgba(236,226,255,.9)); animation:caBladeBob 3.2s ease-in-out infinite; }
  .walk-ent.ca-blade::after{ content:''; position:absolute; left:50%; bottom:44%; width:86%; height:24%; border:2px solid rgba(244,236,255,.85); border-radius:50%;
    transform:translateX(-50%) rotate(-14deg); box-shadow:0 0 6px rgba(220,200,255,.9), inset 0 0 4px rgba(220,200,255,.7); pointer-events:none; animation:caSeal 2.6s ease-in-out infinite; }
  @keyframes caSeal{ 0%,100%{ opacity:.5; } 50%{ opacity:1; } }
  @keyframes caBladeBob{ 0%,100%{ margin-bottom:0; } 50%{ margin-bottom:2px; } }
  @keyframes caTremble{ 0%,100%{ margin-left:0; } 25%{ margin-left:-1px; } 75%{ margin-left:1px; } }
  .walk-ent .walk-emoji{ position:absolute; left:50%; bottom:6%; transform:translateX(-50%); filter:drop-shadow(0 2px 2px rgba(0,0,0,.4)); }
  .ca-choose .ca-opts{ display:flex; flex-direction:column; gap:8px; align-items:stretch; }
  .ca-choose .ca-opts .btn{ width:100%; }
  .ca-ov{ position:fixed; inset:0; z-index:400; background:rgba(10,16,24,.72); display:flex; align-items:center; justify-content:center; }
  .ca-ov-card{ background:#1e2a22; border:2px solid #d9b247; border-radius:16px; padding:12px; color:#fff; box-shadow:0 10px 40px rgba(0,0,0,.6); text-align:center; }
  .ca-ov-title{ font-weight:900; margin-bottom:8px; }
  .ca-ov canvas{ display:block; border-radius:10px; touch-action:none; cursor:grab; background:#163a22; }
  .ca-ov-key{ font-size:12px; opacity:.85; margin:8px 0; }
  .ca-ov-btns{ display:flex; gap:8px; } .ca-ov-btns .btn{ flex:1; }
  .ca-shop{ position:fixed; inset:0; z-index:380; background:rgba(20,14,10,.6); display:flex; align-items:center; justify-content:center; padding:12px; }
  .ca-shop-card{ width:min(560px, 100%); max-height:92vh; overflow:auto; background:#fff8ec; border:3px solid #d9b247; border-radius:18px; padding:14px; box-shadow:0 12px 40px rgba(0,0,0,.45); }
  .ca-shop-head{ display:flex; gap:10px; align-items:center; }
  .ca-shop-faces{ display:flex; } .ca-shop-faces img{ width:72px; height:72px; object-fit:contain; image-rendering:pixelated; }
  .ca-shop-faces{ font-size:44px; }
  .ca-shop-say{ flex:1; background:#fff; border-radius:12px; padding:8px 10px; font-size:14px; border:1px solid #ecdcb8; }
  .ca-shop-purse{ display:flex; gap:12px; justify-content:center; font-weight:800; margin:10px 0; }
  .ca-wares{ display:grid; gap:8px; }
  .ca-ware{ display:grid; grid-template-columns:52px 1fr auto; grid-template-rows:auto auto; gap:2px 10px; align-items:center; text-align:left;
    background:#fff; border:2px solid #ecdcb8; border-radius:14px; padding:8px 10px; cursor:pointer; font:inherit; color:inherit; }
  .ca-ware-ic{ grid-row:1 / span 2; display:flex; align-items:center; justify-content:center; }
  .ca-ware-nm{ font-weight:900; } .ca-ware-pr{ font-weight:900; white-space:nowrap; } .ca-ware-ds{ grid-column:2 / span 2; font-size:12px; opacity:.8; }
  .ca-ware.cant{ opacity:.7; } .ca-ware.gone{ opacity:.45; cursor:default; }
  .ca-rec-tabs{ display:flex; gap:6px; margin-bottom:8px; } .ca-rec-tab{ flex:1; border:2px solid #ecdcb8; background:#fff; border-radius:10px; padding:6px; font-weight:800; cursor:pointer; font:inherit; }
  .ca-rec-tab.on{ background:#6a4ab0; color:#fff; border-color:#6a4ab0; }
  .ca-rec-list{ display:grid; gap:6px; }
  .ca-rec{ display:flex; align-items:center; gap:8px; background:#fff; border:1px solid #ecdcb8; border-radius:12px; padding:6px 8px; }
  .ca-rec.on{ border-color:#6a4ab0; box-shadow:0 0 0 2px rgba(106,74,176,.25); }
  .ca-rec-disc{ font-size:20px; } .ca-rec-nm{ flex:1 1 auto; min-width:0; font-weight:800; font-size:14px; } .ca-rec-own{ font-weight:900; color:#2f8a4a; font-size:13px; flex:0 0 auto; min-width:64px; text-align:center; }
  .ca-rec .mini-btn{ width:auto; flex:0 0 auto; min-width:64px; padding:6px 10px; margin:0; }
  .rec-switches .mini-btn{ width:auto; flex:1 1 auto; }
  .ca-rec-note{ font-size:12px; opacity:.8; margin:10px 0; }
  .rec-box{ margin:12px 0; background:#fff8ec; border:2px solid #ecdcb8; border-radius:14px; padding:10px; }
  .rec-head{ font-weight:900; margin-bottom:6px; } .rec-head small{ opacity:.6; }
  .rec-switches{ display:flex; gap:6px; flex-wrap:wrap; } .rec-switches .mini-btn.on{ background:#6a4ab0; color:#fff; }
  .rec-hint{ font-size:12px; opacity:.75; margin:6px 0; }
  .rec-row{ display:flex; align-items:center; gap:8px; padding:4px 0; border-top:1px solid #f0e4c8; font-size:14px; }
  .rec-nm{ flex:1; font-weight:700; } .rec-ck{ font-size:12px; white-space:nowrap; }
  `;
  document.head.appendChild(s);
}

/* ============================================================
   THE FAIRYBUNNIES' STALL (3.89) — the designer: "different items on
   limited sale different than the usual shop. in particular, 5 gold medals
   are sold for 10 skill tokens each instead of the usual 15 tokens. a
   one-time single copy of diamond dust can be bought for 30 silver medals,
   and a one-time grass stone can be bought for 100 tickets."
   Five gold medals a week (the count starts again on Monday); the Diamond
   Dust and the Grass Stone once ever (the Grass Stone not at all if you
   already hold it: there is one of each element's).
   ============================================================ */
const CA_WARES = [
  { id:'gold',  name:'Gold Medal',   cur:'tokens', cost:10,  weekly:5, desc:'Ten Skill Tokens each, not the usual fifteen. Five a week.' },
  { id:'dust',  name:'Diamond Dust', cur:'silver', cost:30,  once:true, desc:'A Very High Fairy skill stone. Only one copy, ever.' },
  { id:'grass', name:'Grass Stone',  cur:'tokens', cost:100, once:true, desc:'Attach it to a Grass monster for 1.5× experience. One only, ever.' },
];
function caStall(){
  const c = caState();
  if(!c.stall || typeof c.stall !== 'object') c.stall = {};
  const s = c.stall, wk = tearWeekKey();
  if(s.week !== wk){ s.week = wk; s.gold = 0; }
  return s;
}
function caWareLeft(w){
  const s = caStall();
  if(w.id === 'gold') return Math.max(0, w.weekly - (s.gold || 0));
  if(w.id === 'dust') return s.dust ? 0 : 1;
  if(w.id === 'grass') return (s.grass || ownsStone('grassStone')) ? 0 : 1;
  return 0;
}
function caWareIcon(w, px){
  if(w.id === 'gold') return `<span style="font-size:${Math.round(px * 0.8)}px;line-height:1;">${medalIcon('gold')}</span>`;
  if(w.id === 'dust') return elemIcon('Fairy', px, { tint:TIER_TINT.veryhigh, glow:TIER_GLOW.veryhigh, title:false });
  return uiIcon('grass_stone', px, '🌿');
}
function caShopTalk(which){
  if(which === 'retail') return caStallOpen();
  return caRecordsOpen();
}
function caStallOpen(){
  if(ui.caTalk || document.querySelector('.ca-shop')) return;
  releaseKeys();
  caCss();
  const ov = document.createElement('div');
  ov.className = 'ca-shop';
  const draw = (said)=>{
    const m = state.medals || {};
    ov.innerHTML = `<div class="ca-shop-card">
      <div class="ca-shop-head"><div class="ca-shop-faces">${caFace('bunnyA')}${caFace('bunnyB')}</div>
        <div class="ca-shop-say"><b>The Fairybunnies' stall</b><br>${said || 'Bargains! Real bargains! Only here, only for you!'}</div></div>
      <div class="ca-shop-purse"><span>${medalIcon('silver')} ${m.silver || 0}</span><span>${medalIcon('gold')} ${m.gold || 0}</span><span>${tokenIcon(16)} ${state.inventory.tokens || 0}</span></div>
      <div class="ca-wares">${CA_WARES.map(w=>{
        const left = caWareLeft(w), can = left > 0 && medalCount(w.cur) >= w.cost;
        return `<button class="ca-ware${left ? (can ? '' : ' cant') : ' gone'}" data-w="${w.id}" ${left ? '' : 'disabled'}>
          <span class="ca-ware-ic">${caWareIcon(w, 40)}</span>
          <span class="ca-ware-nm">${escapeHtml(w.name)}</span>
          <span class="ca-ware-pr">${left ? `${curIcon(w.cur)} ${w.cost}` : (w.weekly ? 'Sold out — more on Monday' : 'Sold')}</span>
          <span class="ca-ware-ds">${escapeHtml(w.desc)}${w.weekly && left ? ` <b>${left} left this week.</b>` : ''}</span>
        </button>`; }).join('')}</div>
      <button class="btn btn-ghost" id="caShopClose">Leave</button></div>`;
    ov.querySelector('#caShopClose').addEventListener('click', ()=> ov.remove());
    ov.querySelectorAll('.ca-ware[data-w]').forEach(b=> b.addEventListener('click', ()=> caBuyWare(CA_WARES.find(w=> w.id === b.dataset.w), draw, ov)));
  };
  document.body.appendChild(ov);
  draw();
  ui.caStallDraw = draw;
}
async function caBuyWare(w, draw, ov){
  if(!w || caWareLeft(w) <= 0) return;
  if(medalCount(w.cur) < w.cost){ draw(`<i>"Oh! You need ${w.cost} ${curName(w.cur)} for that one."</i>`); return; }
  const snap = { medals:Object.assign({}, state.medals), inv:Object.assign({}, state.inventory), stall:Object.assign({}, caStall()), stones:state.moveStones.length };
  const undo = ()=>{ state.medals = snap.medals; state.inventory = snap.inv; caState().stall = snap.stall; state.moveStones.length = snap.stones; };
  await spend(w.cur, w.cost);
  const s = caStall();
  if(w.id === 'gold'){ state.medals.gold = (state.medals.gold || 0) + 1; s.gold = (s.gold || 0) + 1; }
  if(w.id === 'grass'){ addStone('grassStone', 1); s.grass = true; }
  if(w.id === 'dust'){
    s.dust = true;
    const stone = { uid:'s' + Date.now() + Math.floor(Math.random() * 1000), tier:'veryhigh', type:'Fairy', name:stoneName('Fairy', 'veryhigh') };
    state.moveStones.push(stone);
    ov.remove();
    return stoneSaveReveal([stone], 'Purchased!', undo, 'deck:' + CA_KEY);
  }
  const sv = showSyncingOverlay('Syncing…');
  const ok = await saveProfile({ awaitCloud:true });
  hideSyncingOverlay(sv);
  if(!ok){ undo(); showSyncFailure(); draw(); return; }
  playSfx(w.id === 'gold' ? 'stone_low' : 'stone_mid');
  draw(w.id === 'gold' ? `<i>"One shiny gold medal! Thank you, thank you!"</i>` : `<i>"The Grass Stone is yours! Attach it from a Grass monster's Stats page."</i>`);
}

/* ============================================================
   THE RECORDS (3.89) — the designer: "a record store that allows the player
   to purchase different tracks to be played or turned off from the storage
   bag. these can be manually checked as a playlist to be played instead of
   the regular zone music, and also can be set to be played as an eye break
   playlist. allow the records to be sampled inside the store, and purchased
   for 3 silver medals each. for a start, please put in the 6 different
   region tracks, zone tracks and battle tracks I have uploaded."
   Owned records live in the bag (state.inventory.records): `owned`, the
   playlist (`list`, on while `on`), the eye-break playlist (`eye`, on while
   `eyeOn`). A playlist that is on plays instead of a place's own music (any
   region or zone track — never a fight's), one record after another, round
   and round; the eye-break playlist plays while an eye break lasts.
   ============================================================ */
const REC_PRICE = { cur:'silver', cost:3 };
const REC_LIST = [
  { key:'region',  title:'Region 1',  group:'Regions' }, { key:'region2', title:'Region 2', group:'Regions' }, { key:'region3', title:'Region 3', group:'Regions' },
  { key:'region4', title:'Region 4',  group:'Regions' }, { key:'region5', title:'Region 5', group:'Regions' }, { key:'region6', title:'Region 6 · The Time Rift', group:'Regions' },
  { key:'zone_sacred_grove', title:'The Sacred Grove', group:'Places' }, { key:'zone_rocky_caverns', title:'The Rocky Caverns', group:'Places' },
  { key:'zone_volcanic_caldera', title:'The Volcanic Caldera', group:'Places' }, { key:'zone_geothermal_plant', title:'The Geothermal Plant', group:'Places' },
  { key:'zone_band_concert', title:'The Band Concert', group:'Places' }, { key:'zone_catacombs', title:'The Catacombs', group:'Places' },
  { key:'zone_jungle', title:'The Time-Lost Jungle', group:'Places' },
  { key:'battle_start', title:'Battle!', group:'Battles' }, { key:'battle_wild', title:'A Wild Battle', group:'Battles' }, { key:'battle_boss', title:'Boss Battle', group:'Battles' },
  { key:'battle_legendary', title:'Legendary Battle', group:'Battles' }, { key:'battle_padrino', title:"Padrino's Theme", group:'Battles' },
  { key:'battle_padrino_final', title:"Padrino's Last Stand", group:'Battles' }, { key:'battle_region6', title:'The Alien Invasion', group:'Battles' },
  { key:'battle_region6_future', title:'Challenge the Future', group:'Battles' }, { key:'battle_region6_past', title:'Echoes of the Past', group:'Battles' },
];
function recState(){
  const inv = state.inventory || (state.inventory = {});
  if(!inv.records || typeof inv.records !== 'object') inv.records = {};
  const r = inv.records;
  ['owned', 'list', 'eye'].forEach(k=>{ if(!Array.isArray(r[k])) r[k] = []; });
  return r;
}
function recOwned(k){ return recState().owned.includes(k); }
function recTitle(k){ return (REC_LIST.find(r=> r.key === k) || { title:k }).title; }
/* the records that should play now instead of `name` (a place's own track), if any */
function recPlaying(){ return !!(audio.musicEl && audio.musicEl.dataset.rec); }
function recWants(name){
  if(typeof state === 'undefined' || !state || !state.inventory) return null;
  const r = recState();
  if(r.eyeOn && typeof eyeBreakActive === 'function' && eyeBreakActive()){ const l = r.eye.filter(recOwned); if(l.length) return 'eye'; }
  if(r.on && /^(region|zone_|main_menu)/.test(name || '')){ const l = r.list.filter(recOwned); if(l.length) return 'list'; }
  return null;
}
/* one record after another from playlist `kind`, round and round; carries on if one of its records is already playing */
function recPlay(kind, next){
  const r = recState(), list = (kind === 'eye' ? r.eye : r.list).filter(recOwned);
  if(!list.length) return false;
  const el = audio.musicEl;
  if(!next && el && el.dataset.rec === kind && list.includes(el.dataset.track) && !el.ended) return true;
  r.at = r.at || {};
  const i = next ? ((r.at[kind] || 0) + 1) % list.length : Math.min(r.at[kind] || 0, list.length - 1);
  r.at[kind] = i;
  const track = list[i];
  playMusic(track, { fromRecords:true, loop:false, restart:true });
  const now = audio.musicEl;
  if(now && now.dataset.track === track){
    now.dataset.rec = kind;
    now.addEventListener('ended', ()=>{ if(audio.musicEl === now) recPlay(kind, true); });
  }
  return true;
}
/* (09-story-r2.js) an eye break starts and ends: its playlist, then whatever the place wanted */
function recEyeBreakStart(){ if(recWants('') === 'eye') recPlay('eye'); }
function recEyeBreakEnd(){
  const el = audio.musicEl;
  if(el && el.dataset.rec === 'eye'){
    const want = audio.placeWanted;
    stopMusic();
    if(want) setTimeout(()=> playMusicChain(want.names, want.opts), 50);
  }
}
function recSampling(){ return !!(audio.musicEl && audio.musicEl.dataset.sample); }
function caRecPlaying(){ return recSampling(); }

/* ---------- Melody Fairy's store: sample, buy ---------- */
function caRecordsOpen(){
  if(ui.caTalk || document.querySelector('.ca-shop')) return;
  releaseKeys();
  caCss();
  const ov = document.createElement('div');
  ov.className = 'ca-shop ca-recs';
  let group = ui.caRecGroup || 'Regions';
  const stopSample = ()=>{
    if(recSampling()){ stopMusic(); setTimeout(()=> playMusicChain(['zone_records', 'region6', 'region']), 60); }
  };
  const draw = (said)=>{
    const m = state.medals || {}, r = recState();
    const shown = REC_LIST.filter(x=> x.group === group);
    const playing = recSampling() ? audio.musicEl.dataset.track : null;
    ov.innerHTML = `<div class="ca-shop-card">
      <div class="ca-shop-head"><div class="ca-shop-faces">${caFace('melody')}</div>
        <div class="ca-shop-say"><b>Melody Fairy's Records</b><br>${said || '♪ Listen to any record you like — and take home the ones you love!'}</div></div>
      <div class="ca-shop-purse"><span>${medalIcon('silver')} ${m.silver || 0}</span><span>🎵 ${r.owned.length} of ${REC_LIST.length} records</span></div>
      <div class="ca-rec-tabs">${['Regions', 'Places', 'Battles'].map(g=> `<button class="ca-rec-tab${g === group ? ' on' : ''}" data-g="${g}">${g}</button>`).join('')}</div>
      <div class="ca-rec-list">${shown.map(x=>{
        const own = r.owned.includes(x.key), on = playing === x.key;
        return `<div class="ca-rec${own ? ' own' : ''}${on ? ' on' : ''}">
          <span class="ca-rec-disc">${on ? '💿' : '📀'}</span>
          <span class="ca-rec-nm">${escapeHtml(x.title)}</span>
          <button class="mini-btn" data-play="${x.key}">${on ? '⏹ Stop' : '▶ Listen'}</button>
          ${own ? `<span class="ca-rec-own">✓ Yours</span>` : `<button class="mini-btn ca-rec-buy" data-buy="${x.key}">${curIcon(REC_PRICE.cur)} ${REC_PRICE.cost}</button>`}
        </div>`; }).join('')}</div>
      <div class="ca-rec-note">Your records are in your bag: <b>Storage → Items → Records</b>. Choose which play in place of each place's music, and which play during eye breaks.</div>
      <button class="btn btn-ghost" id="caShopClose">Leave</button></div>`;
    ov.querySelector('#caShopClose').addEventListener('click', ()=>{ stopSample(); ov.remove(); });
    ov.querySelectorAll('.ca-rec-tab').forEach(b=> b.addEventListener('click', ()=>{ group = ui.caRecGroup = b.dataset.g; draw(); }));
    ov.querySelectorAll('[data-play]').forEach(b=> b.addEventListener('click', ()=>{
      const k = b.dataset.play;
      if(recSampling() && audio.musicEl.dataset.track === k){ stopSample(); setTimeout(()=> draw(), 80); return; }
      playMusic(k, { fromRecords:true, restart:true });
      if(audio.musicEl && audio.musicEl.dataset.track === k) audio.musicEl.dataset.sample = '1';
      draw(`<i>"♪ ${escapeHtml(recTitle(k))}! Isn't it lovely?"</i>`);
    }));
    ov.querySelectorAll('[data-buy]').forEach(b=> b.addEventListener('click', ()=> caBuyRecord(b.dataset.buy, draw)));
  };
  document.body.appendChild(ov);
  draw();
}
async function caBuyRecord(k, draw){
  if(recOwned(k)) return;
  if(medalCount(REC_PRICE.cur) < REC_PRICE.cost){ draw(`<i>"Each record is ${REC_PRICE.cost} silver medals, dear."</i>`); return; }
  const snap = { medals:Object.assign({}, state.medals), owned:recState().owned.slice(), list:recState().list.slice() };
  await spend(REC_PRICE.cur, REC_PRICE.cost);
  const r = recState();
  r.owned.push(k);
  if(!r.list.includes(k)) r.list.push(k);                          // ready in your playlist (off until you switch it on)
  const sv = showSyncingOverlay('Syncing…');
  const ok = await saveProfile({ awaitCloud:true });
  hideSyncingOverlay(sv);
  if(!ok){ state.medals = snap.medals; r.owned = snap.owned; r.list = snap.list; showSyncFailure(); draw(); return; }
  playSfx('stone_low');
  draw(`<i>"${escapeHtml(recTitle(k))} is yours! It's in your bag."</i>`);
}

/* ---------- in the bag: Storage → Items (07-screens.js asks for these) ---------- */
function recStorageHtml(){
  const r = recState();
  if(!r.owned.length) return '';
  const rows = REC_LIST.filter(x=> r.owned.includes(x.key)).map(x=> `
    <div class="rec-row">
      <span class="rec-nm">🎵 ${escapeHtml(x.title)}</span>
      <label class="rec-ck"><input type="checkbox" data-rl="${x.key}" ${r.list.includes(x.key) ? 'checked' : ''}> Playlist</label>
      <label class="rec-ck"><input type="checkbox" data-re="${x.key}" ${r.eye.includes(x.key) ? 'checked' : ''}> Eye break</label>
    </div>`).join('');
  return `<div class="rec-box">
    <div class="rec-head">🎶 Records <small>${r.owned.length}</small></div>
    <div class="rec-switches">
      <button class="mini-btn${r.on ? ' on' : ''}" id="recOn">${r.on ? '🔊 My playlist: ON' : '🔈 My playlist: OFF'}</button>
      <button class="mini-btn${r.eyeOn ? ' on' : ''}" id="recEyeOn">${r.eyeOn ? '👀 Eye-break music: ON' : '👀 Eye-break music: OFF'}</button>
    </div>
    <div class="rec-hint">While your playlist is on, its records play instead of each place's own music (never a fight's).</div>
    ${rows}</div>`;
}
function recStorageWire(){
  const r = recState();
  const save = ()=>{ saveProfile(); };
  const on = $('#recOn'), eo = $('#recEyeOn');
  if(on) on.addEventListener('click', ()=>{
    r.on = !r.on; save();
    if(!r.on && recPlaying() && audio.musicEl.dataset.rec === 'list'){ stopMusic(); }
    else if(r.on) recPlay('list');
    renderStorage();
  });
  if(eo) eo.addEventListener('click', ()=>{ r.eyeOn = !r.eyeOn; save(); renderStorage(); });
  screenEl.querySelectorAll('[data-rl]').forEach(c=> c.addEventListener('change', ()=>{
    const k = c.dataset.rl; r.list = c.checked ? r.list.concat(r.list.includes(k) ? [] : [k]) : r.list.filter(x=> x !== k); save();
  }));
  screenEl.querySelectorAll('[data-re]').forEach(c=> c.addEventListener('change', ()=>{
    const k = c.dataset.re; r.eye = c.checked ? r.eye.concat(r.eye.includes(k) ? [] : [k]) : r.eye.filter(x=> x !== k); save();
  }));
}
