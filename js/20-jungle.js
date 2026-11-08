/* ============================================================
   20-jungle.js — THE TIME-LOST JUNGLE (3.84)
   The designer (2026-11-04): Region 6's first quest — "help the Cosmic
   Council quell an alien invasion that has affected the Fairy King's
   universe". Nemesis's crossing tore the spacetime fabric of the Fairy
   King's world (he sits on the Council) and let aliens in: Nemesis meant
   it, to blind the Council. Help him, and he will guide you through the
   tangled timelines towards Nemesis's past.

   Through the Rift's upper small portal (it wakes once the Council has
   called), a time-lost jungle: a maze 450 squares across (300 since 3.95), "a VERY gigantic
   maze with many different paths, many of which lead to dead ends", walked
   with Lucesco instead of Cuain. In from its east edge. In its corners four
   tribes of fairies (grass, water, fire, earth) under their guardians; in
   its middle the Fairy King's castle, its knights at the south gate.

   Aliens wander it, each with fairies it has taken over. Four squares in
   front of one and it sees you ("!"): you cannot move, it comes, you fight.
   Or challenge one yourself, standing beside it.
     · an alien: one wave — two of its fairies and it, in the middle;
     · a captain (Humanoid): three waves — two aliens, then itself;
     · a commander (Octopus): six — four aliens, a captain, then itself.
   Its fairies come on at Lv 98 (3.86: 100), then turn red and grow to Lv 150, and use
   their Ultimate every turn; a captain's or commander's own fairies cast
   Diamond Dust. The aliens: Lv 150–175, unnerfed; a Very High on their first
   turn and every five after, an Ultra on every third turn from the third.
   The captain and commander have no element, and cast a different Very
   High every turn. Aliens are never caught; the fairies, once freed, are
   (if you have none of them yet).

   Each tribe, once you have met its guardian, gives 5 Skill Tokens a day
   for 1 of its people freed (3.87; 3 until then). The castle's knights
   count the alien bands beaten each week: 50 pays 50 bronze medals.
   (3.90) The castle's own people (CA_CITIZENS): the Royal Commander, once
   met, gives 10 Skill Tokens a day for 2 of them freed.

   (3.95) The designer: "The density of aliens is much too scarce, I
   underestimated how big the map was. Can we reduce it to 300x300 and put
   the mazes at the four corners around each village? I still want a
   significant maze around each corner village. Limit the size of the
   village to 35 by 35 … Make the maze and forests more dense as well. Keep
   pathways to single square on average, although you can open clearings on
   occasions." So: 300 squares across, every path one square wide. Each
   corner is a maze 112 squares across with its village (35 × 35) inside,
   two gates into it; between the corners, and round the castle in the
   middle, woods with far more loops. Now and then the trees stand two or
   three deep and more (thickets: maze cells left wild). The floor is green,
   its shade drifting from place to place; the trees are olive; golden light
   falls through the canopy (jgRays). "360 aliens on the map, proportions
   of which are 10% commanders and 15% captains, the rest equally divided by
   12 elements … Swap the locations randomly daily": jgBands, made again
   each day. "do not divide the captured fairies in waves by region": every
   band's captives come from every tribe and the castle (jgCaptivePick).

   The ground is made from a seed (jgGround): every profile walks the same
   jungle, and nothing of it is saved but where you have been. It is far
   too big for the walk engine's whole-map painting and its shade squares:
   the deck's rows are all floor, the walls are `occupied`, and a canvas
   under the deck paints only what is in view (jgPaint), as the Rift's sky
   does.
   ============================================================ */
const JG_KEY = 'r6_jungle';
let _jgEx = null, _jgExOf = null;       // where you have been, as bits (jgExBits)
const JG = {
  W:300, H:300, v:395, seed:20261106,
  village:35, corner:112, newest:0.62,
  braid:{ maze:0.06, wood:0.45 },          // dead ends opened on through one more wall: the corner mazes keep nearly all of theirs
  loops:0.04,                              // the woods: walls knocked through besides, for more ways round
  thick:{ maze:0.05, wood:0.12 },          // cells left wild before the maze is made: thickets, three trees deep or more
  clearings:{ maze:8, wood:34 }, lakes:7,
  aliens:{ total:360, commander:36, captain:54, gap:7, safe:9, sight:4, clock:700, radius:6, active:18, lv:[150, 175] },   // (3.95) 10% commanders, 15% captains
  /* (3.87) "Please reduce their levels to 98, I forgot! 98 at the start
     before enrage, 98 again when caught" — as anything else you can catch
     (CATCH_LEVEL_CAP), so a fairy caught in its first form can still climb
     to its last. "reduce the tribal guardians' demands to 1 citizen per
     tribe for 5 tokens." */
  fairyLv:[98, 150], vhEvery:5, ultraFrom:3, ultraEvery:3,
  plus:{ alien:0, captain:1, commander:2 },
  daily:{ need:1, tokens:5 }, weekly:{ need:50, bronze:50 },
};

/* ---------- the save: r6().jungle ----------
   called (the Council's call heard), seen (the first walk in), at (where you
   left off), found{} (the five places), met{} (guardians, knights), the day's
   rescued{} / paid{}, the week's tally / tallyPaid, beaten{} (alien id → the
   day it was beaten: it is back the next day), explored (a picture of where
   you have been), talk{} (who has said what). */
function jgState(){
  const r = r6();
  if(!r.jungle || typeof r.jungle !== 'object') r.jungle = {};
  const j = r.jungle;
  ['found', 'met', 'rescued', 'paid', 'beaten', 'talk'].forEach(k=>{ if(!j[k] || typeof j[k] !== 'object') j[k] = {}; });
  /* (3.95) a new jungle (300 across): the old picture of where you had been,
     and where you stood, belong to the old one. What you found stays found. */
  if(j.mapV !== JG.v){ j.mapV = JG.v; j.explored = ''; j.at = null; _jgEx = null; }
  const d = today();
  if(j.day !== d){ j.day = d; j.rescued = {}; j.paid = {}; j.beaten = {}; }   // (3.95) the bands stand somewhere new each day
  const wk = tearWeekKey();
  if(j.week !== wk){ j.week = wk; j.tally = 0; j.tallyPaid = false; }
  return j;
}
/* Open to every player in Region 6, once Selene has shown them round. */
function jgOpen(){ return !!(state && state.progress && r6().roomSeen); }
function jgCallDue(){ return jgOpen() && !jgState().called; }
function jgPortalAwake(){ return jgOpen() && !!jgState().called; }

/* ---------- the four tribes ---------- */
const JG_TRIBES = {
  grass:{ name:'the Grass Tribe', short:'Grass', el:'Grass', icon:'🌿', guardian:'tribal_guardian_grass', members:['grass_fairy', 'grass_sprite'], corner:'nw',
          roof:['#4f7d31', '#6f9e45', '#8bb85a'], ground:'#a5c47e', wall:'#c9b27c' },
  water:{ name:'the Water Tribe', short:'Water', el:'Water', icon:'💧', guardian:'tribal_guardian_water', members:['water_fairy', 'water_sprite'], corner:'ne',
          roof:['#2f6b95', '#4b8fbb', '#6fb0d6'], ground:'#b7d2bf', wall:'#d9cfb4' },
  earth:{ name:'the Earth Tribe', short:'Earth', el:'Ground', icon:'🪨', guardian:'tribal_guardian_ground', members:['earth_fairy', 'earth_sprite'], corner:'sw',
          roof:['#6f4d2a', '#9a7044', '#b88b58'], ground:'#c6ae86', wall:'#a89a86' },
  fire: { name:'the Fire Tribe', short:'Fire', el:'Fire', icon:'🔥', guardian:'tribal_guardian_fire', members:['fire_sprite', 'bonedancer'], corner:'se',
          roof:['#8e3a20', '#c26038', '#de8a52'], ground:'#d8b28c', wall:'#c9a582' },
};
const JG_TRIBE_KEYS = ['grass', 'water', 'earth', 'fire'];

/* ---------- its monsters ----------
   The fairies of the tribes (Fairy, and their tribe's element), and the
   aliens — named as their pictures are, without "alien", their rank and
   their element (the designer). Each kit: Basic, Power1, Power2 (all of
   them), Ultimate, and a Max for the aliens (elite) only. (3.98) The
   designer: "max moves only come on starter, elite and legendary tier
   monsters. wild monsters never learn a max move" — the fairies are wild. */
/* (3.96) Their kits, as the designer asked: support, each tribe's two a
   pair — one with a passive that lifts its own side, one with a passive
   that drags the other side down (in the Power 2 slot), and an area Power 1
   for the one whose Ultimate strikes a single foe. Every effect is one the
   game already has. As captives they cast their Ultimate every turn, so no
   Ultimate heals or buffs: each is an attack that weakens, blinds, stuns,
   confuses or lulls. (Until 3.96 every one was the 3.84 placeholder: 0.2×,
   0.4×, 0.6× all, 1.25×, 1.5×.) */
const JG_FOLK = {
  water_fairy: { name:'Water Fairy',  el:'Water',  evo:[115], glyph:'泉', role:'buff', kit:[            // a healer: its side cleansed each turn
    ['Basic', 'Splash Charm', 0.25, 'Single', 2, 1],
    ['Power1', 'Dew Drop', null, 'Self', 4, 5, { mend:{ pct:0.15, fleece:{ reduce:0.10, turns:2 } } }],
    ['Power2', 'Tide Twirl', null, 'Passive', 0, 21, { passive:{ cleanseEnd:1 } }],
    ['Ultimate', 'Moon Tide', 0.8, 'AOE', 8, 41, { softenHit:{ chance:0.5, amount:0.5 } }]] },
  water_sprite:{ name:'Water Sprite', el:'Water',  glyph:'露', role:'debuff', kit:[                     // a blinder: the other side a step later
    ['Basic', 'Ripple', 0.25, 'Single', 2, 1, { softenHit:{ chance:0.2, amount:0.5 } }],
    ['Power1', 'Spring Jet', 0.4, 'AOE', 4, 5, { softenHit:{ chance:0.25, amount:0.5 } }],
    ['Power2', 'Mist Dance', null, 'Passive', 0, 21, { passive:{ undertow:1, undertowName:'Mist Dance' } }],
    ['Ultimate', 'Fountain Lance', 1.0, 'Single', 8, 41, { blindHit:{ miss:0.25, turns:2 } }]] },
  grass_fairy: { name:'Grass Fairy',  el:'Grass',  evo:[115], glyph:'芽', role:'buff', kit:[             // its side deals more
    ['Basic', 'Petal Puff', 0.25, 'Single', 2, 1],
    ['Power1', 'Seed Flurry', 0.4, 'AOE', 4, 5, { shieldGain:1 }],
    ['Power2', 'Blossom Wind', null, 'Passive', 0, 21, { passive:{ empower:0.12 } }],
    ['Ultimate', 'Gratitude Beam', 0.8, 'Single', 8, 41, { softenHit:{ chance:1, amount:0.5 } }]] },
  grass_sprite:{ name:'Grass Sprite', el:'Grass',  glyph:'叶', role:'debuff', kit:[                     // a lullaby over the other side
    ['Basic', 'Leaf Flick', 0.25, 'Single', 2, 1],
    ['Power1', 'Vine Ribbon', 0.4, 'Single', 4, 5, { stunHit:0.2 }],
    ['Power2', 'Meadow Song', null, 'Passive', 0, 21, { passive:{ drowse:0.1 } }],
    ['Ultimate', 'Thorn Waltz', 0.7, 'AOE', 8, 41, { stunHit:0.15 }]] },
  fire_sprite: { name:'Fire Sprite',  el:'Fire',   glyph:'烛', role:'buff', kit:[                       // its side a step sooner
    ['Basic', 'Spark Kiss', 0.25, 'Single', 2, 1],
    ['Power1', 'Ember Ribbon', null, 'Self', 4, 5, { kindle:{ deal:1.2, turns:2 } }],
    ['Power2', 'Lantern Ring', null, 'Passive', 0, 21, { passive:{ slipstream:1, slipName:'Lantern Ring' } }],
    ['Ultimate', 'Sunflare', 0.8, 'AOE', 8, 41, { blindHit:{ miss:0.25, turns:1 } }]] },
  bonedancer:  { name:'Bonedancer',   el:'Fire',   glyph:'舞', role:'debuff', kit:[                     // the other side deals less
    ['Basic', 'Bone Tap', 0.25, 'Single', 2, 1],
    ['Power1', 'Ghostfire', 0.4, 'AOE', 4, 5, { softenHit:{ chance:0.25, amount:0.5 } }],
    ['Power2', 'Skull Shuffle', null, 'Passive', 0, 21, { passive:{ terrorize:0.1 } }],
    ['Ultimate', 'Flame Dance', 0.8, 'AOE', 8, 41, { confuseHit:{ chance:0.25, ffPower:0.6 } }]] },
  earth_fairy: { name:'Earth Fairy',  el:'Ground', glyph:'星', role:'buff', kit:[                       // its side takes less
    ['Basic', 'Pebble Wish', 0.25, 'Single', 2, 1],
    ['Power1', 'Star Dust', null, 'Self', 4, 5, { barrier:{ shields:2, on:'partner', worth:1.5, icon:'⭐' } }],
    ['Power2', 'Rock Ring', null, 'Passive', 0, 21, { passive:{ ward:0.12, wardName:'Rock Ring' } }],
    ['Ultimate', 'Wishing Quake', 0.8, 'AOE', 8, 41, { stunHit:0.15 }]] },
  earth_sprite:{ name:'Earth Sprite', el:'Ground', glyph:'土', role:'debuff', kit:[                     // the other side dodges half as often
    ['Basic', 'Mud Flick', 0.25, 'Single', 2, 1, { softenHit:{ chance:0.2, amount:0.5 } }],
    ['Power1', 'Clay Charm', null, 'Single', 4, 5, { charm:{ turns:3, chance:0.2 } }],
    ['Power2', 'Sand Veil', null, 'Passive', 0, 21, { passive:{ trueSight:0.5, sightName:'Sand Veil' } }],
    ['Ultimate', 'Stone Song', 0.8, 'AOE', 8, 41, { sleepHit:0.2 }]] },
};
const JG_ALIENS = {
  alien_cocoon_flying:      { name:'Cocoon',      el:'Flying',   glyph:'茧', moves:['Spike Flick', 'Shell Spin', 'Barbed Gale', 'Pod Dive', 'Pod Dive Max'] },
  alien_crocodilian_fire:   { name:'Crocodilian', el:'Fire',     glyph:'鳄', moves:['Ember Snap', 'Scorch Jaw', 'Cinder Sweep', 'Death Roll', 'Skullfire Max'] },
  alien_dolphin_water:      { name:'Dolphin',     el:'Water',    glyph:'豚', moves:['Sonar Ping', 'Bubble Grin', 'Riptide Chorus', 'Tidal Tail', 'Abyssal Song Max'] },
  alien_flower_grass:       { name:'Flower',      el:'Grass',    glyph:'花', moves:['Petal Dart', 'Pollen Sting', 'Spore Storm', 'Thorn Lance', 'Starbloom Max'] },
  alien_golem_ground:       { name:'Golem',       el:'Ground',   glyph:'岩', moves:['Pebble Shot', 'Block Slam', 'Quake Stomp', 'Monolith Drop', 'Monolith Max'] },
  alien_gremlin_fairy:      { name:'Gremlin',     el:'Fairy',    glyph:'怪', moves:['Glitter Pinch', 'Hex Spark', 'Prank Comet', 'Mischief Ray', 'Mischief Nova Max'] },
  alien_grimgate_psychic:   { name:'Grimgate',    el:'Psychic',  glyph:'门', moves:['Stare', 'Mind Chain', 'Gate of Dread', 'Eye of the Gate', 'Open the Gate Max'] },
  alien_insect_physical:    { name:'Insect',      el:'Physical', glyph:'虫', moves:['Sickle Jab', 'Mantis Slash', 'Scythe Dance', 'Thousand Cuts', 'Thousand Cuts Max'] },
  alien_magnet_electric:    { name:'Magnet',      el:'Electric', glyph:'磁', moves:['Static Tap', 'Polar Shock', 'Flux Storm', 'Magnet Crush', 'Magnet Crush Max'] },
  alien_plant_hydra_dragon: { name:'Plant Hydra', el:'Dragon',   glyph:'蛟', moves:['Vine Bite', 'Twin Fang', 'Venom Roar', 'Hydra Bloom', 'Hydra Bloom Max'] },
  alien_robot_steel:        { name:'Robot',       el:'Steel',    glyph:'机', moves:['Bolt Driver', 'Laser Visor', 'Piston Barrage', 'Overclock Punch', 'Overclock Max'] },
  alien_toxic_gas_ghost:    { name:'Toxic Gas',   el:'Ghost',    glyph:'毒', moves:['Miasma', 'Choking Cloud', 'Phantom Smog', 'Chain Rattle', 'Chain Rattle Max'] },
  /* no element: no more and no less from any of yours, and theirs (the designer) */
  alien_captain_humanoid:   { name:'Humanoid',    el:null, rank:'captain',   glyph:'人', moves:['Swirl Jab', "Captain's Order", 'Spiral Storm', 'Spiral Kick', 'Vortex Command Max'] },
  alien_commander_octopus:  { name:'Octopus',     el:null, rank:'commander', glyph:'章', moves:['Tentacle Lash', 'Ink Eclipse', 'Eye Storm', 'Abyss Grip', 'Abyss Dominion Max'] },
};
const JG_ALIEN_IDS = Object.keys(JG_ALIENS).filter(id=> !JG_ALIENS[id].rank);
const JG_CAPTAIN = 'alien_captain_humanoid', JG_COMMANDER = 'alien_commander_octopus';
const JG_ELEMENTS = ['Fire', 'Water', 'Grass', 'Electric', 'Flying', 'Ground', 'Physical', 'Psychic', 'Ghost', 'Dragon', 'Steel', 'Fairy'];
function jgKit(names){
  return [['Basic', names[0], 0.2, 'Single', 2, 1], ['Power1', names[1], 0.4, 'Single', 4, 5], ['Power2', names[2], 0.6, 'AOE', 8, 21],
          ['Ultimate', names[3], 1.25, 'Single', 8, 41], ['Max', names[4], 1.5, 'Single', 8, 51]];
}
(function jgSpecies(){
  if(typeof SPECIES === 'undefined' || typeof MOVES === 'undefined') return;
  /* (3.94) wild, as the castle's townsfolk: "no crowns if I have not uploaded
     them, i.e. these are all wild tier monsters" (elite until 3.94; a save's
     crowned one gives its Crown back: runProfileMigrations) */
  Object.entries(JG_FOLK).forEach(([id, f])=>{
    const tribe = JG_TRIBE_KEYS.find(k=> JG_TRIBES[k].members.includes(id));
    SPECIES[id] = { name:f.name, tier:'wild', types:[f.el, 'Fairy'], rate:11, nerfedRate:11, base:100, evo:f.evo || [], color:TYPE_COLORS[f.el] || '#c98bd0',
                    glyph:f.glyph, bossOnly:true, tribe };
    MOVES[id] = (f.kit ? f.kit.map(r=> r.slice()) : jgKit(f.moves)).filter(r=> r[0] !== 'Max');   // (3.96) their own kits; (3.98) wild: never a Max
  });
  Object.entries(JG_ALIENS).forEach(([id, a])=>{
    SPECIES[id] = { name:a.name, tier:'elite', types:a.el ? [a.el] : [], rate:11, nerfedRate:11, base:150, evo:[], color:a.el ? TYPE_COLORS[a.el] : '#7a2430',
                    glyph:a.glyph, bossOnly:true, noLevelCap:true, noCatch:true, alien:a.rank || 'alien' };
    MOVES[id] = jgKit(a.moves);
  });
})();

/* ============================================================
   THE GROUND — made from its seed, once
   ============================================================ */
const JG_T = { HEDGE:0, PATH:1, WATER:2, GLADE:3, VILLAGE:4, CASTLE:5, GATE:6, HUT:7, TREE:8, SHORE:9, ENTRY:10, ROAD:11 };
const JG_SOLID = [true, false, true, false, false, true, true, true, true, false, false, false];   // by tile: the gate is the castle's (shut, for now)
function jgRng(seed){ let a = seed >>> 0; return ()=>{ a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function jgHash(x, y, k){ let h = (x * 374761393 + y * 668265263 + (k || 0) * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
let _jgGround = null;
/* (3.95) 300 squares across. The maze is made on cells: each cell one square
   (on the odd rows and columns), each wall between two cells one square (on
   the even), so every path is one square wide. A growing tree over every
   cell that is left to it; then, in the woods only, most dead ends opened
   on and more walls knocked through. The corners keep theirs: a real maze
   round each village. The designer: "is it possible to have landmarks more
   circular? villages, lakes, should approximate ovoids or circles" — so the
   villages, the lakes, the clearings and the glade you arrive in are ovals
   and circles, each with an edge of trees (the cells within 2 squares of it
   left out of the maze), and the ways into them dug through it. The maze
   itself, and the castle (64 × 64, as its own maps are), stay square. */
function jgGround(){
  if(_jgGround) return _jgGround;
  const { W, H } = JG, CW = (W - 1) >> 1, CH = (H - 1) >> 1;         // 149 × 149 cells
  const R = jgRng(JG.seed), ri = n=> Math.floor(R() * n);
  const mix = list=>{ for(let i = list.length - 1; i > 0; i--){ const j = ri(i + 1); const t = list[i]; list[i] = list[j]; list[j] = t; } return list; };
  const g = new Uint8Array(W * H);                                    // all forest
  const put = (x, y, t)=>{ if(x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = t; };
  const at = (x, y)=> (x < 0 || y < 0 || x >= W || y >= H) ? JG_T.HEDGE : g[y * W + x];
  const fill = (x0, y0, w, h, t)=>{ for(let y = y0; y < y0 + h; y++) for(let x = x0; x < x0 + w; x++) put(x, y, t); };
  const oval = (x, y, cx, cy, rx, ry)=> ((x - cx) / rx) * ((x - cx) / rx) + ((y - cy) / ry) * ((y - cy) / ry) <= 1;
  const fillOval = (cx, cy, rx, ry, t)=>{ for(let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for(let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if(oval(x, y, cx, cy, rx, ry)) put(x, y, t); };
  const TX = i=> 2 * i + 1;                                           // a cell's square, across or down
  const CA = JG.corner, EDGE = 2.2;                                   // a round place's edge of trees: the maze keeps this far off
  const inCorner = (x, y)=> (x < CA || x >= W - CA) && (y < CA || y >= H - CA);
  const zoneOf = (i, j)=> inCorner(TX(i), TX(j)) ? 'maze' : 'wood';
  /* cells the maze keeps out of: 1 a place (village, castle, the way in, a lake), 2 a thicket */
  const keep = new Uint8Array(CW * CH);
  const span = (a, b)=> [Math.max(0, Math.ceil((a - 1) / 2)), Math.min(CW - 1, Math.floor((b - 1) / 2))];
  const keepRect = (x0, y0, x1, y1, v)=>{ const [i0, i1] = span(x0, x1), [j0, j1] = span(y0, y1); for(let j = j0; j <= j1; j++) for(let i = i0; i <= i1; i++) keep[j * CW + i] = v; };
  const keepOval = (cx, cy, rx, ry, v)=>{
    const [i0, i1] = span(cx - rx - EDGE - 1, cx + rx + EDGE + 1), [j0, j1] = span(cy - ry - EDGE - 1, cy + ry + EDGE + 1);
    for(let j = j0; j <= j1; j++) for(let i = i0; i <= i1; i++) if(oval(TX(i), TX(j), cx, cy, rx + EDGE, ry + EDGE)) keep[j * CW + i] = v;
  };
  const places = { villages:{}, castle:null, entry:null, lakes:[], glades:[], gates:[] };
  const busy = [];
  const clash = (x, y, w, h, pad)=> busy.some(b=> x < b.x + b.w + pad && x + w + pad > b.x && y < b.y + b.h + pad && y + h + pad > b.y);
  /* the castle in the middle (64 × 64, as its own maps are), a road 4 wide round its walls */
  const CS = 64, cx0 = (W - CS) >> 1, cy0 = (H - CS) >> 1, ring = 4;
  const road = { x:cx0 - ring, y:cy0 - ring, w:CS + ring * 2, h:CS + ring * 2 };
  keepRect(road.x - 1, road.y - 1, road.x + road.w + 1, road.y + road.h + 1, 1);
  busy.push({ x:road.x - 2, y:road.y - 2, w:road.w + 4, h:road.h + 4 });
  /* the villages: ovals 35 across at most, set into their corners, a maze all round each */
  const VS = JG.village, off = 25;
  const VSHAPE = { grass:[17.5, 17.5], water:[17.5, 16.2], earth:[16.2, 17.5], fire:[17.5, 16.8] };
  const corners = { nw:[off, off], ne:[W - off - VS - 1, off], sw:[off, H - off - VS - 1], se:[W - off - VS - 1, H - off - VS - 1] };
  const vill = {};
  JG_TRIBE_KEYS.forEach(k=>{
    const [vx, vy] = corners[JG_TRIBES[k].corner], [rx, ry] = VSHAPE[k], cx = vx + (VS >> 1), cy = vy + (VS >> 1);
    vill[k] = { vx, vy, cx, cy, rx, ry };
    keepOval(cx, cy, rx, ry, 1);
    busy.push({ x:vx - 3, y:vy - 3, w:VS + 6, h:VS + 6 });
  });
  /* the way in: a half-round glade at the east edge, half way down */
  const ecx = W - 1, ecy = H >> 1, er = 5.6;
  keepOval(ecx, ecy, er, er, 1);
  busy.push({ x:W - 10, y:ecy - 9, w:10, h:19 });
  /* lakes, in the woods: ovals, their cells kept out, a shore all round */
  let tries = 0;
  while(places.lakes.length < JG.lakes && tries++ < 4000){
    const rx = 7.5 + R() * 3, ry = 5.5 + R() * 2.5, cx = 14 + ri(W - 28), cy = 14 + ri(H - 28);
    const x = Math.floor(cx - rx), y = Math.floor(cy - ry), w = Math.ceil(2 * rx) + 1, h = Math.ceil(2 * ry) + 1;
    if(x < 5 || y < 5 || x + w > W - 5 || y + h > H - 5) continue;
    if(inCorner(x, y) || inCorner(x + w, y) || inCorner(x, y + h) || inCorner(x + w, y + h) || clash(x, y, w, h, 10)) continue;
    keepOval(cx, cy, rx, ry, 1);
    places.lakes.push({ x, y, w, h, cx, cy, rx, ry }); busy.push({ x, y, w, h });
  }
  /* thickets: here and there a cell left wild — three trees deep, more where two touch */
  const nearPlace = (i, j)=> [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].some(([a, b])=>{ const u = i + a, v = j + b; return u >= 0 && v >= 0 && u < CW && v < CH && keep[v * CW + u] === 1; });
  for(let j = 0; j < CH; j++) for(let i = 0; i < CW; i++){
    if(keep[j * CW + i] || R() >= JG.thick[zoneOf(i, j)] || nearPlace(i, j)) continue;
    keep[j * CW + i] = 2;
    if(R() < 0.4){
      const [a, b] = [[1, 0], [0, 1], [-1, 0], [0, -1]][ri(4)], u = i + a, v = j + b;
      if(u >= 0 && v >= 0 && u < CW && v < CH && !keep[v * CW + u] && !nearPlace(u, v)) keep[v * CW + u] = 2;
    }
  }
  /* the maze: a growing tree, mostly from the newest (long winding runs), now and then from anywhere (branches) */
  const seen = new Uint8Array(CW * CH), links = new Uint8Array(CW * CH);   // bits: 1 E, 2 S, 4 W, 8 N
  const DIRS = [[1, 0, 1, 4], [0, 1, 2, 8], [-1, 0, 4, 1], [0, -1, 8, 2]];
  const free = (i, j)=> i >= 0 && j >= 0 && i < CW && j < CH && !keep[j * CW + i];
  const openCell = (i, j)=> put(TX(i), TX(j), JG_T.PATH);
  const knock = (i, j, dx, dy)=> put(TX(i) + dx, TX(j) + dy, JG_T.PATH);
  const si = (W - 13) >> 1, sj = (ecy - 1) >> 1;                       // a cell a little way in from the way in
  keep[sj * CW + si] = 0;
  const stack = [sj * CW + si];
  seen[sj * CW + si] = 1; openCell(si, sj);
  while(stack.length){
    const k = R() < JG.newest ? stack.length - 1 : ri(stack.length);
    const c = stack[k], i = c % CW, j = (c - i) / CW;
    const opts = DIRS.filter(([dx, dy])=> free(i + dx, j + dy) && !seen[(j + dy) * CW + i + dx]);
    if(!opts.length){ stack[k] = stack[stack.length - 1]; stack.pop(); continue; }
    const [dx, dy, bit, back] = opts[ri(opts.length)];
    const a = i + dx, b = j + dy;
    seen[b * CW + a] = 1; links[c] |= bit; links[b * CW + a] |= back;
    openCell(a, b); knock(i, j, dx, dy);
    stack.push(b * CW + a);
  }
  /* loops: dead ends opened on (most, in the woods; a few, in the corners), and in the woods more walls knocked through */
  const deg = v=> (v & 1) + ((v >> 1) & 1) + ((v >> 2) & 1) + ((v >> 3) & 1);
  const link = (i, j, d)=>{ const [dx, dy, bit, back] = DIRS[d]; links[j * CW + i] |= bit; links[(j + dy) * CW + i + dx] |= back; knock(i, j, dx, dy); };
  for(let j = 0; j < CH; j++) for(let i = 0; i < CW; i++){
    const c = j * CW + i;
    if(!seen[c] || deg(links[c]) !== 1 || R() >= JG.braid[zoneOf(i, j)]) continue;
    const opts = [0, 1, 2, 3].filter(d=>{ const [dx, dy, bit] = DIRS[d]; return !(links[c] & bit) && free(i + dx, j + dy) && seen[(j + dy) * CW + i + dx]; });
    if(opts.length) link(i, j, opts[ri(opts.length)]);
  }
  for(let j = 0; j < CH; j++) for(let i = 0; i < CW; i++){
    const c = j * CW + i;
    if(!seen[c] || zoneOf(i, j) !== 'wood') continue;
    for(const d of [0, 1]){
      const [dx, dy, bit] = DIRS[d];
      if(!(links[c] & bit) && free(i + dx, j + dy) && seen[(j + dy) * CW + i + dx] && zoneOf(i + dx, j + dy) === 'wood' && R() < JG.loops) link(i, j, d);
    }
  }
  /* clearings, now and then: a round patch of open grass where the paths meet (a tree or two standing in the big ones) */
  tries = 0;
  const made = { maze:0, wood:0 }, want = { maze:JG.clearings.maze * 4, wood:JG.clearings.wood };
  while((made.maze < want.maze || made.wood < want.wood) && tries++ < 8000){
    const ci = 3 + ri(CW - 6), cj = 3 + ri(CH - 6), z = zoneOf(ci, cj);
    if(made[z] >= want[z] || !seen[cj * CW + ci]) continue;
    const r = z === 'maze' ? 1.6 + R() * 0.9 : 2.2 + R() * 2.3, cx = TX(ci), cy = TX(cj);
    const x = Math.floor(cx - r), y = Math.floor(cy - r), w = Math.ceil(2 * r) + 1;
    if(clash(x, y, w, w, 3) || inCorner(cx, cy) !== (z === 'maze')) continue;
    fillOval(cx, cy, r, r, JG_T.GLADE);
    if(r >= 3.4){ const n = 1 + Math.floor(r * r / 9); for(let k = 0; k < n; k++){ const a = R() * Math.PI * 2, d = R() * (r - 1.6); put(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), JG_T.TREE); } }
    places.glades.push({ x, y, w, h:w, cx, cy, r, zone:z }); busy.push({ x, y, w, h:w }); made[z]++;
  }
  /* a way out of a round place: from its middle along an odd row (or column) near it, out
     of it, then dug through its edge of trees to the first path of the maze */
  const gate = (cx, cy, dx, dy, inside, spread)=>{
    const c0 = Math.round(dx ? cy : cx), rows = [];
    for(let o = -spread; o <= spread; o++){ const p = c0 + o; if(p & 1) rows.push(p); }
    for(const p of mix(rows)){
      let x = dx ? Math.round(cx) : p, y = dx ? p : Math.round(cy);
      if(!inside(x, y)) continue;
      for(let guard = 0; inside(x, y) && guard < 80; guard++){ x += dx; y += dy; }
      if(JG_SOLID[at(x - dx, y - dy)]) continue;                      // it must come out of open ground, not a hut or a tree
      const dug = [];
      let ok = false;
      for(let k = 0; k < 7; k++){
        if(x < 1 || y < 1 || x >= W - 1 || y >= H - 1) break;
        const t = at(x, y);
        if(!JG_SOLID[t]){ ok = t === JG_T.PATH || t === JG_T.GLADE; break; }
        dug.push([x, y, t]); put(x, y, JG_T.PATH); x += dx; y += dy;
      }
      if(ok && dug.length){ places.gates.push({ x:dug[0][0], y:dug[0][1] }); return dug.map(([a, b])=> [a, b]); }   // (3.99) the squares dug, from inside out: a village's barricade
      dug.forEach(([a, b, t])=> put(a, b, t));
    }
    return false;
  };
  /* openings along one side of the castle's road: `n` of them, spread out, each where the maze reaches it */
  const openSide = (fixed, from, to, horiz, dir, n, avoid)=>{
    for(let s = 0; s < n; s++){
      const lo = from + Math.floor((to - from) * s / n), hi = from + Math.floor((to - from) * (s + 1) / n);
      const cand = [];
      for(let p = lo; p <= hi; p++) if(p % 2 === 1 && !(avoid && avoid(p))) cand.push(p);
      for(const p of mix(cand)){
        const x = horiz ? p : fixed, y = horiz ? fixed : p, dx = horiz ? 0 : dir, dy = horiz ? dir : 0;
        let far = 1; while(far <= 4 && JG_SOLID[at(x + dx * far, y + dy * far)]) far++;
        const fx = x + dx * far, fy = y + dy * far;
        if(far > 4 || fx < 1 || fy < 1 || fx >= W - 1 || fy >= H - 1 || at(fx, fy) !== JG_T.PATH) continue;
        for(let k = 1; k < far; k++) put(x + dx * k, y + dy * k, JG_T.PATH);
        places.gates.push({ x:x + dx, y:y + dy });
        break;
      }
    }
  };
  /* the castle: the road round its walls; the castle; the gate in its south wall; ways in from the woods on every side */
  fill(road.x, road.y, road.w, road.h, JG_T.ROAD);
  fill(cx0, cy0, CS, CS, JG_T.CASTLE);
  const gx = cx0 + CS / 2 - 2;
  fill(gx, cy0 + CS - 3, 4, 3, JG_T.GATE);
  places.castle = { x:cx0, y:cy0, w:CS, h:CS, gx, gate:{ x:gx, y:cy0 + CS - 1, w:4 }, stand:{ x:gx + 1, y:cy0 + CS + 2 },
                    knights:[{ x:gx - 1, y:cy0 + CS }, { x:gx + 4, y:cy0 + CS }], road };
  const rx1 = road.x + road.w - 1, ry1 = road.y + road.h - 1;
  openSide(road.x, road.y + 3, ry1 - 3, false, -1, 3);
  openSide(rx1, road.y + 3, ry1 - 3, false, 1, 3);
  openSide(road.y, road.x + 3, rx1 - 3, true, -1, 3);
  openSide(ry1, road.x + 3, rx1 - 3, true, 1, 3, p=> p >= gx - 6 && p <= gx + 9);
  /* the villages: open ground, eight huts round a green, the guardian's lodge in the middle; two gates, towards the middle of the jungle */
  JG_TRIBE_KEYS.forEach(k=>{
    const { vx, vy, cx, cy, rx, ry } = vill[k], c = JG_TRIBES[k].corner;
    fillOval(cx, cy, rx, ry, JG_T.VILLAGE);
    const huts = [];
    for(let n = 0; n < 8; n++){
      const ang = n / 8 * Math.PI * 2 + 0.3;
      const hx = Math.round(cx + 0.5 + Math.cos(ang) * rx * 0.66) - 2, hy = Math.round(cy + 0.5 + Math.sin(ang) * ry * 0.66) - 2;
      fill(hx, hy, 4, 3, JG_T.HUT); huts.push({ x:hx, y:hy, w:4, h:3 });
    }
    const lodge = { x:cx - 3, y:cy - 3, w:6, h:4 };
    fill(lodge.x, lodge.y, lodge.w, lodge.h, JG_T.HUT);
    places.villages[k] = { x:vx, y:vy, w:VS, h:VS, cx, cy, rx, ry, huts, lodge, guardian:{ x:lodge.x + 2, y:lodge.y + lodge.h }, stand:{ x:lodge.x + 2, y:lodge.y + lodge.h + 2 } };
    for(let n = 0, tr = 0; n < 26 && tr < 500; tr++){
      const tx = vx + 1 + ri(VS - 2), ty = vy + 1 + ri(VS - 2);
      if(!oval(tx, ty, cx, cy, rx - 1.8, ry - 1.8) || Math.hypot(tx - cx, ty - cy) < 8) continue;
      if(huts.concat([lodge]).some(h=> tx >= h.x - 2 && tx < h.x + h.w + 2 && ty >= h.y - 2 && ty < h.y + h.h + 3)) continue;
      if(g[ty * W + tx] !== JG_T.VILLAGE) continue;
      g[ty * W + tx] = JG_T.TREE; n++;
    }
    const inV = (x, y)=> oval(x, y, cx, cy, rx, ry);
    /* (3.99) each way in, kept: where its tribe walls it off (25-quest.js) */
    const gx1 = c[1] === 'w' ? 1 : -1, gy1 = c[0] === 'n' ? 1 : -1;
    const ways = [[gx1, 0, gate(cx, cy, gx1, 0, inV, 9)], [0, gy1, gate(cx, cy, 0, gy1, inV, 9)]];
    places.villages[k].ways = ways.filter(w=> w[2]).map(([dx, dy, sq])=> ({ d:[dx, dy], sq }));
  });
  /* the way in: the half-round glade at the east edge, the portal at its edge; two ways west into the woods */
  fillOval(ecx, ecy, er, er, JG_T.ENTRY);
  places.entry = { x:W - 6, y:ecy - 5, w:6, h:11, portal:{ x:W - 2, y:ecy - 1, w:2, h:2 }, stand:{ x:W - 4, y:ecy } };
  const inE = (x, y)=> x < W && oval(x, y, ecx, ecy, er, er);
  gate(ecx, ecy - 2, -1, 0, inE, 1);
  gate(ecx, ecy + 2, -1, 0, inE, 1);
  /* the lakes: water with a shore of open ground all round it, and ways onto the shore from every side the maze reaches */
  places.lakes.forEach(L=>{
    fillOval(L.cx, L.cy, L.rx, L.ry, JG_T.SHORE);
    /* (4.02) its water an oval indeed (the designer: "for the pools both in the castle and in the jungle, could you make
       the shape ovoid or circular? … the square blocky pool shape just doesn't look pleasing"): every square the oval
       touches is water, and the oval itself is drawn over them (jgDrawLakes) — until 4.02 the squares within a
       wobbling oval (jgLakeWaterOld), drawn square by square. Its middle and its reach, in squares (mx, my, ex, ey). */
    L.mx = L.cx + 0.5; L.my = L.cy + 0.5; L.ex = (L.rx - 2.4) * JG_LAKE.fit; L.ey = (L.ry - 2.4) * JG_LAKE.fit;
    for(let yy = L.y; yy < L.y + L.h; yy++) for(let xx = L.x; xx < L.x + L.w; xx++){
      const nx = Math.max(xx, Math.min(L.mx, xx + 1)), ny = Math.max(yy, Math.min(L.my, yy + 1));
      if(((nx - L.mx) / L.ex) ** 2 + ((ny - L.my) / L.ey) ** 2 < 1) g[yy * W + xx] = JG_T.WATER;
    }
    const inL = (x, y)=> oval(x, y, L.cx, L.cy, L.rx, L.ry);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=> gate(L.cx, L.cy, dx, dy, inL, 3));
  });
  /* anything walkable that cannot be reached from the way in goes back to forest */
  const reach = new Uint8Array(W * H), q = new Int32Array(W * H);
  let qh = 0, qt = 0; const s0 = places.entry.stand.y * W + places.entry.stand.x; q[qt++] = s0; reach[s0] = 1;
  while(qh < qt){
    const v = q[qh++], x = v % W, y = (v - x) / W;
    if(x > 0){ const u = v - 1; if(!reach[u] && !JG_SOLID[g[u]]){ reach[u] = 1; q[qt++] = u; } }
    if(x < W - 1){ const u = v + 1; if(!reach[u] && !JG_SOLID[g[u]]){ reach[u] = 1; q[qt++] = u; } }
    if(y > 0){ const u = v - W; if(!reach[u] && !JG_SOLID[g[u]]){ reach[u] = 1; q[qt++] = u; } }
    if(y < H - 1){ const u = v + W; if(!reach[u] && !JG_SOLID[g[u]]){ reach[u] = 1; q[qt++] = u; } }
  }
  for(let i = 0; i < W * H; i++) if(!JG_SOLID[g[i]] && !reach[i]) g[i] = JG_T.HEDGE;
  _jgGround = { g, W, H, places, R, inCorner };
  return _jgGround;
}
function jgTile(x, y){ const G = jgGround(); return (x < 0 || y < 0 || x >= G.W || y >= G.H) ? JG_T.HEDGE : G.g[y * G.W + x]; }
/* (3.99) The tribes' barricades (25-quest.js): which squares are whose wall (1 + the tribe's place in
   JG_TRIBE_KEYS), and which tribes' walls still stand. Solid while they stand; a path again once lifted. */
let _jgBar = null;
const _jgBarUp = [false, false, false, false];
function jgSolidAt(x, y){
  const G = jgGround();
  if(x < 0 || y < 0 || x >= G.W || y >= G.H) return true;
  const i = y * G.W + x;
  if(JG_SOLID[G.g[i]]) return true;
  return !!(_jgBar && _jgBar[i] && _jgBarUp[_jgBar[i] - 1]);
}
/* a square of a barricade still standing: the tribe's key, else null */
function jgBarAt(x, y){
  if(!_jgBar || x < 0 || y < 0 || x >= JG.W || y >= JG.H) return null;
  const v = _jgBar[y * JG.W + x];
  return v && _jgBarUp[v - 1] ? JG_TRIBE_KEYS[v - 1] : null;
}
function jgVillageAt(x, y){
  const V = jgGround().places.villages;
  /* (3.95) its oval, not the square round it (the maze runs in the corners of that) */
  return JG_TRIBE_KEYS.find(k=>{ const v = V[k], a = (x - v.cx) / v.rx, b = (y - v.cy) / v.ry; return a * a + b * b <= 1; }) || null;
}
/* the nearest tribe's lands: whose people its aliens hold */
function jgTribeOf(x, y){
  const V = jgGround().places.villages;
  let best = 'water', bd = Infinity;
  JG_TRIBE_KEYS.forEach(k=>{ const v = V[k], d = Math.hypot(v.x + v.w / 2 - x, v.y + v.h / 2 - y); if(d < bd){ bd = d; best = k; } });
  return best;
}
/* (3.95) Whose people a band holds: everyone's — the designer: "do not
   divide the captured fairies in waves by region" (jgCaptivePick). A band
   still knows the village it is nearest. */
function jgZoneOf(x, y){ return jgTribeOf(x, y); }

/* ============================================================
   THE ALIENS — where each band stands, made again each day
   (3.95) 360 of them: 36 commanders' bands, 54 captains', and 270 lone
   aliens, 22 of each kind of alien and 23 of six kinds (which six, the
   day's draw). Where they stand is the day's draw too, from a seed of the
   day: everyone meets the same jungle that day, and a different one the
   next. Never right by a village, the way in or the castle gate.
   ============================================================ */
let _jgBands = null, _jgBandsDay = null;
function jgDaySeed(day){ let h = 2166136261; const s = String(day); for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/* (4.00) After the battle for the castle the designer: "there will still be aliens in the forest for the player to
   hunt albeit a third the number before" — 120 of the 360, in the same shares (26-invasion.js: invAfter). */
function jgAlienCounts(){
  const A = JG.aliens;
  if(!(typeof invAfter === 'function' && invAfter())) return A;
  return Object.assign({}, A, { total:Math.round(A.total / 3), commander:Math.round(A.commander / 3), captain:Math.round(A.captain / 3) });
}
function jgBands(){
  const day = today(), A = jgAlienCounts(), key = day + ':' + A.total;
  if(_jgBands && _jgBandsDay === key) return _jgBands;
  const G = jgGround(), { W, H, places } = G;
  const R = jgRng((JG.seed ^ 0x51ed ^ jgDaySeed(day)) >>> 0), ri = n=> Math.floor(R() * n);
  const mix = list=>{ for(let i = list.length - 1; i > 0; i--){ const j = ri(i + 1); const t = list[i]; list[i] = list[j]; list[j] = t; } return list; };
  const C = places.castle, ccx = C.x + C.w / 2, ccy = C.y + C.h / 2, far = Math.hypot(ccx, ccy);
  const safe = [places.entry, ...Object.values(places.villages), { x:C.x - 8, y:C.y + C.h - 2, w:C.w + 16, h:14 }];
  const tooNear = (x, y)=> safe.some(s=> x > s.x - A.safe && x < s.x + s.w + A.safe && y > s.y - A.safe && y < s.y + s.h + A.safe);
  const spots = [];
  for(let y = 1; y < H - 1; y++) for(let x = 1; x < W - 1; x++){
    const t = G.g[y * W + x];
    if((t === JG_T.PATH || t === JG_T.GLADE || t === JG_T.SHORE) && !tooNear(x, y)) spots.push(y * W + x);
  }
  mix(spots);
  /* the lone aliens' kinds: 22 each, and today's six one more */
  const kinds = [];
  mix(JG_ALIEN_IDS.slice()).forEach((id, n)=>{ for(let k = 0; k < 22 + (n < 6 ? 1 : 0); k++) kinds.push(id); });
  mix(kinds);
  const nReg = A.total - A.commander - A.captain;
  while(kinds.length < nReg) kinds.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]);
  const ranks = [];
  for(let k = 0; k < A.commander; k++) ranks.push('commander');
  for(let k = 0; k < A.captain; k++) ranks.push('captain');
  for(let k = 0; k < nReg; k++) ranks.push('alien');
  /* a grid of who stands where, for the gap between bands */
  const taken = new Int32Array(W * H).fill(-1);
  const bands = [];
  const roomy = (x, y, gap)=>{
    for(let dy = -gap + 1; dy < gap; dy++){
      const yy = y + dy; if(yy < 0 || yy >= H) continue;
      const span = gap - 1 - Math.abs(dy);
      for(let dx = -span; dx <= span; dx++){ const xx = x + dx; if(xx >= 0 && xx < W && taken[yy * W + xx] >= 0) return false; }
    }
    return true;
  };
  let si = 0, gap = A.gap, reg = 0;
  for(let r = 0; r < ranks.length; r++){
    const rank = ranks[r];
    let placed = null;
    for(let pass = 0; pass < 3 && !placed; pass++){
      for(let n = 0; n < spots.length && !placed; n++){
        const v = spots[(si + n) % spots.length];
        const x = v % W, y = (v - x) / W;
        if(taken[v] >= 0 || !roomy(x, y, gap)) continue;
        placed = { x, y }; si = (si + n + 1) % spots.length;
      }
      if(!placed) gap = Math.max(2, gap - 2);                         // never short of room: a little closer together
    }
    if(!placed) break;
    const { x, y } = placed;
    const d = Math.hypot(x - ccx, y - ccy);
    const lv = Math.round(A.lv[0] + (A.lv[1] - A.lv[0]) * Math.max(0, Math.min(1, 1 - (d - 40) / (far - 40))));
    const band = { id:'b' + bands.length, rank, x, y, hx:x, hy:y, face:'ldru'[ri(4)], tribe:jgTribeOf(x, y),
      lv:rank === 'commander' ? A.lv[1] : rank === 'captain' ? Math.min(A.lv[1], lv + 3) : lv, aliens:[] };
    if(rank === 'alien') band.aliens.push(kinds[reg++]);
    else {
      for(let k = 0; k < (rank === 'commander' ? 4 : 2); k++) band.aliens.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]);
      if(rank === 'commander') band.aliens.push(JG_CAPTAIN, JG_COMMANDER);
      else band.aliens.push(JG_CAPTAIN);
    }
    band.lead = band.aliens[band.aliens.length - 1];
    taken[y * W + x] = bands.length;
    bands.push(band);
  }
  _jgBands = bands; _jgBandsDay = key;
  return bands;
}
function jgBandBeaten(b){ return b.intro ? !!(typeof questIntroWon === 'function' && questIntroWon(b.id)) : jgState().beaten[b.id] === today(); }   // (3.99) the first three: for good
function jgBandAt(x, y){ return jgBands().find(b=> b.x === x && b.y === y && !jgBandBeaten(b)) || null; }

/* ============================================================
   THE DECK
   ============================================================ */
const JG_ROW = '.'.repeat(JG.W);
const JG_DECK = {
  key:JG_KEY, region:6, title:'The Time-Lost Jungle', bg:'jungle', music:'zone_jungle', noGhost:true,
  /* a little further back than the past: about 13 squares across on a tablet, 9 on a phone */
  get view(){
    const W = window.innerWidth, H = window.innerHeight;
    const stage = Math.min(Math.min(W, W >= 700 ? 720 : 480) - 32, H - 300);
    const avail = Math.min(W - 24, Math.max(220, H - 330));
    const want = Math.min(W, H) >= 700 ? 13 : 9;
    return Math.max(7, avail / (Math.max(200, stage) / want));
  },
  backLabel:'Rift', backTo:'r6_rift',
  rows:Array.from({ length:JG.H }, ()=> JG_ROW),
  bx:0, by:0, bs:1 / 32, nat:[1, 1],
  get spawn(){ const s = jgGround().places.entry.stand; return [s.x, s.y]; },
  occupied:(x, y)=> jgSolidAt(x, y) || !!jgBandAt(x, y) || jgFolkAt(x, y),   // (3.96) and the villages' people
  get things(){ return jgThings(); },
  /* (3.96) its 100 finds (jgFinds): the deck's prizes, as the ship's and the catacombs' are — glinting near you (ownTwinkles: jgShowFinds) */
  get prizes(){ return jgFinds(); },
  ownTwinkles:true,
  get prizeLines(){ return JG_FIND_LINES; },
  nearActs:(d, p)=> jgNearActs(p),
  youArt:()=> jgRiding() ? jgRideArt() : null,                       // (4.03) on Lucesco's back (walkYouArt, 13-walkmap.js)
  onStep:(p, d)=> jgStep(p, d),
  onRender:(world, d)=> jgRender(world, d),
  sideAct:()=> ({ html:'🗺️ Map', act:()=> jgMapOpen() }),
};
if(typeof DECKS !== 'undefined') DECKS[JG_KEY] = JG_DECK;
let _jgThings = null;
function jgThings(){
  if(_jgThings) return _jgThings;
  const P = jgGround().places, list = [];
  const pt = P.entry.portal;
  list.push({ x:pt.x, y:pt.y, w:pt.w, h:pt.h, icon:'', verb:'The portal', sub:'Back to the Rift', act:()=> jgHome() });
  JG_TRIBE_KEYS.forEach(k=>{
    const v = P.villages[k], t = JG_TRIBES[k];
    /* (3.96) the designer: "way too big" — 2.1 squares, now 1.6: half as tall again as you */
    list.push({ x:v.guardian.x, y:v.guardian.y, w:2, h:1, cls:'jg-npc jg-guardian', html:(tt, px)=> jgMonImg(t.guardian, WALK_T * 1.6),
      verb:'Talk', sub:`${t.short} Guardian`, mark:()=> !jgState().met[k], act:()=> jgGuardian(k) });
  });
  P.castle.knights.forEach((kn, i)=>{
    list.push({ x:kn.x, y:kn.y, cls:'jg-npc jg-knight', html:()=> jgMonImg(JG_GATE_KNIGHT + '_front', WALK_T * 1.5, false, 'fairy_knight_front'),
      verb:'Talk', sub:JG_GATE_KNIGHT_NAME, mark:()=> !jgState().met.knights, act:()=> jgKnights(), faceR:i === 1 });
  });
  const g = P.castle.gate;
  /* (3.88) open once the King is home (21-castle.js): its green arrow, and in */
  list.push({ x:g.x, y:g.y, w:g.w, h:1, icon:'', act:()=> jgGate(),
    get verb(){ return (typeof caOpen === 'function' && caOpen()) ? 'Enter' : 'The castle gate'; },
    get sub(){ return (typeof caOpen === 'function' && caOpen()) ? '' : 'Shut'; },
    get where(){ return (typeof caOpen === 'function' && caOpen()) ? "The Fairy King's castle" : undefined; },
    arrow:'up' });
  if(typeof warJungleThings === 'function') warJungleThings(list, P);   // (3.92) the war: the King, his knights, the invaders at the villages, the ancestors woken
  if(typeof questJungleThings === 'function') questJungleThings(list, P);   // (3.99) the tribes' barricades
  _jgThings = list;
  return list;
}
/* `alt`: (3.87) another picture to stand in until this one is there. */
function jgMonImg(file, px, flip, alt){
  const w = Math.round(px);
  const err = alt ? `if(!this.dataset.alt){this.dataset.alt=1;this.src='assets/mon/${alt}.png';}else{this.style.display='none';}` : `this.style.display='none'`;
  /* (3.96) flipped with scale, not transform: a figure's 1.314 (index.html, .walk-ent img) stays, and its centring with it */
  return `<img class="jg-art" src="assets/mon/${file}.png" alt="" style="width:${w}px;height:${w}px;${flip ? 'scale:-1 1;' : ''}" onload="spriteFeet(this)" onerror="${err}">`;
}
/* (3.87) the designer: "chestnut_knight2 (grass physical), 2 of whom now
   guard the entrance instead of the earlier fairy knight which is no longer
   in use" — the old Fairy Knight's picture stands in until theirs is there */
const JG_GATE_KNIGHT = 'chestnut_knight2', JG_GATE_KNIGHT_NAME = 'Chestnut Knight';

/* ---------- in and out ---------- */
function jgEnter(where){
  if(!jgPortalAwake()) return false;
  const j = jgState();
  const P = jgGround().places;
  let at = null;
  if(where === 'last' && j.at && !jgSolidAt(j.at.x, j.at.y) && !jgBandAt(j.at.x, j.at.y) && !(typeof questSealedAt === 'function' && questSealedAt(j.at.x, j.at.y))) at = j.at;
  else if(where === 'castle' && j.found.castle) at = P.castle.stand;
  else if(JG_TRIBES[where] && j.found[where]) at = P.villages[where].stand;
  if(!at) at = P.entry.stand;
  const w = walkState();
  w.at = w.at || {};
  w.at[JG_KEY] = { x:at.x, y:at.y };
  w.face = 'l';
  ui.walkFresh = false;
  ui.jgLion = null;
  goDeck(JG_KEY);
  return true;
}
function jgHome(){
  if(ui.jgTalk || ui.jgAlert) return;
  jgSave(true);
  goDeck('r6_rift');
}
/* Where you stand, kept with the save now and then (and as you go). */
let _jgSteps = 0;
/* (3.96) Not in the middle of a walk: a save (the whole profile, written
   out) every 25 steps was a hitch you could feel. Now it waits until you
   have stood still a moment. */
let _jgSaveSoon = null;
function jgSave(now){
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(p) jgState().at = { x:p.x, y:p.y };
  clearTimeout(_jgSaveSoon);
  if(now){ _jgSaveSoon = null; saveProfile(); return; }
  _jgSaveSoon = setTimeout(()=>{ _jgSaveSoon = null; if(typeof walkHolding === 'function' && walkHolding()) return jgSave(false); saveProfile(); }, 1500);
}

/* ---------- Lucesco, at your heels (as in the past, 19-past.js) ---------- */
function jgLionPlace(){
  const el = document.getElementById('jgLion'), at = ui.jgLion;
  if(!el || !at) return;
  el.style.transform = `translate3d(${at.x * WALK_T}px,${at.y * WALK_T}px,0)`;
  el.style.zIndex = 10 + at.y;
  faceRight(el, !!at.faceR);
  jgSeeThrough();                                                       // (3.96) the crowns over you both, see-through
}
function jgLionStep(p){
  const trail = (ui.jgTrail || []).concat([{ x:p.x, y:p.y }]).slice(-3);
  ui.jgTrail = trail;
  if(jgRiding()){ jgMountSync(); return; }                              // (4.03) you are on his back: where you are, he is
  const to = trail[trail.length - 2];
  if(to){
    const at = ui.jgLion;
    ui.jgLion = { x:to.x, y:to.y, faceR:at ? (to.x !== at.x ? to.x > at.x : at.faceR) : false };
    jgLionPlace();
  }
}

/* ---------- a step ---------- */
function jgStep(p, d){
  jgZoomStep();                                     // (4.08) the third step after his move: the camera back out
  jgLionStep(p);
  jgSeeThrough();                                                       // (3.96) (again, if he did not move)
  const j = jgState();
  if(j.jumpIn > 0) j.jumpIn--;                      // (3.96) Lucesco gets his breath back: a step at a time
  if(j.glareIn > 0) j.glareIn = Math.min(JG_GLARE.steps, j.glareIn) - 1;   // (4.03) …and his eyes their fire (Pulsar Glare); (4.08) 15 steps at most
  jgSave(false);
  jgExplore(p.x, p.y);
  jgDiscover(p.x, p.y);
  jgShowBands();
  jgShowFolk();                                     // (3.96) the villages' people, the finds' glints
  jgShowFinds();
  if(typeof questStep === 'function' && questStep(p)) return true;   // (3.99) at a barricade, with its blade: its guardian
  return jgLook();                                  // seen: the held key lets go
}
/* The five places, found as you come to them. */
function jgDiscover(x, y){
  const j = jgState(), P = jgGround().places;
  const v = jgVillageAt(x, y);
  if(v && !j.found[v]){
    j.found[v] = true; saveProfile();
    toast(`${JG_TRIBES[v].icon} You found the village of ${JG_TRIBES[v].name}!`);
  }
  const C = P.castle;
  if(!j.found.castle && x >= C.x - 6 && x < C.x + C.w + 6 && y >= C.y - 6 && y < C.y + C.h + 6){
    j.found.castle = true; saveProfile();
    toast('🏰 You found the Fairy King\'s castle!');
  }
}

/* ---------- where you have been: one bit for every 3 × 3 squares ---------- */
const JG_EX = { cell:3, r:5 };
function jgExBits(){
  const j = jgState();                               // first: (3.95) it may clear the old jungle's picture
  if(_jgEx && _jgExOf === state) return _jgEx;       // (another profile: its own picture)
  _jgExOf = state;
  const n = Math.ceil(JG.W / JG_EX.cell) * Math.ceil(JG.H / JG_EX.cell);
  _jgEx = new Uint8Array(Math.ceil(n / 8));
  const s = j.explored;
  if(typeof s === 'string' && s){
    try { const bin = atob(s); for(let i = 0; i < Math.min(bin.length, _jgEx.length); i++) _jgEx[i] = bin.charCodeAt(i); } catch(e){}
  }
  return _jgEx;
}
function jgExplore(x, y){
  const bits = jgExBits(), c = JG_EX.cell, CWn = Math.ceil(JG.W / c), r = JG_EX.r;
  let changed = false;
  for(let yy = Math.max(0, Math.floor((y - r) / c)); yy <= Math.min(Math.ceil(JG.H / c) - 1, Math.floor((y + r) / c)); yy++)
    for(let xx = Math.max(0, Math.floor((x - r) / c)); xx <= Math.min(CWn - 1, Math.floor((x + r) / c)); xx++){
      const i = yy * CWn + xx;
      if(!(bits[i >> 3] & (1 << (i & 7)))){ bits[i >> 3] |= 1 << (i & 7); changed = true; }
    }
  if(changed){
    let s = '';
    for(let i = 0; i < bits.length; i++) s += String.fromCharCode(bits[i]);
    jgState().explored = btoa(s);
  }
}
function jgExplored(x, y){
  const c = JG_EX.cell, i = Math.floor(y / c) * Math.ceil(JG.W / c) + Math.floor(x / c), bits = jgExBits();
  return !!(bits[i >> 3] & (1 << (i & 7)));
}

/* ============================================================
   ON THE MAP: the painting, Lucesco, the bands, the counters
   ============================================================ */
function jgRender(world, d){
  jgCss(); sceneCss(); riftCss();
  ui.jgFighting = false; ui.jgAlert = null;          // nothing left over from a fight that never began
  if(typeof questJungleBefore === 'function') questJungleBefore();   // (3.99) the barricades standing, the first three aliens
  const stage = $('#walkStage');
  if(stage) stage.classList.add('jg-stage');
  jgPaintStart(stage, world);
  const w = walkState(), p = w.at && w.at[JG_KEY];
  /* Lucesco: where he was, or beside you as you arrive */
  if(!ui.jgLion && p){
    const free = [[1, 0], [0, 1], [0, -1], [-1, 0]].map(([dx, dy])=> ({ x:p.x + dx, y:p.y + dy }))
      .find(q=> !jgSolidAt(q.x, q.y) && !wBlockedBy(d, q.x, q.y) && !jgBandAt(q.x, q.y));
    ui.jgLion = free ? { x:free.x, y:free.y, faceR:free.x < p.x } : { x:p.x, y:p.y, faceR:false };
  }
  if(p) ui.jgTrail = [{ x:p.x, y:p.y }];
  const lion = document.createElement('div');
  lion.className = 'walk-ent rift-lion past-lion jg-lion';
  lion.id = 'jgLion';
  lion.innerHTML = riftLucescoImg(WALK_T);
  world.appendChild(lion);
  jgLionPlace();
  jgMountSync();                                    // (4.03) riding: his own picture put away, you on his back (youArt)
  /* the awake portal you came through, at the east edge */
  const pt = jgGround().places.entry.portal;
  const por = document.createElement('div');
  por.className = 'past-art rift-portal jg-portal';
  por.style.cssText = `left:${(pt.x - 0.3) * WALK_T}px;top:${(pt.y + pt.h - 2.7) * WALK_T}px;width:${2.2 * WALK_T}px;height:${3 * WALK_T}px;z-index:${10 + pt.y + pt.h - 1};`;
  por.innerHTML = riftPortalSvg(false);
  world.appendChild(por);
  ui.jgBandEls = {};
  ui.jgFolkEls = {}; ui.jgFindEls = {};             // (3.96) a new world: theirs drawn afresh
  /* those right by you as you arrive give you a moment */
  if(p){ const now = Date.now(); jgBands().forEach(b=>{ if(Math.abs(b.x - p.x) + Math.abs(b.y - p.y) < 8) b.calm = Math.max(b.calm || 0, now + 3000); }); }
  jgShowBands();
  jgShowFolk(); jgShowFinds();
  jgHud();
  if(p){ jgExplore(p.x, p.y); jgDiscover(p.x, p.y); }
  jgTickStart();
  /* the first time in: Cuain goes, Lucesco comes */
  if(!jgState().seen && !ui.sceneRunning) setTimeout(()=>{ if(ui.screen === JG_KEY) jgArrive(); }, 450);
  if(typeof questJungleAfter === 'function') questJungleAfter(stage);   // (3.99) Lucesco's pulse, and what the story has for you here
}

/* ---------- the painting: what is in view, only ---------- */
const JG_P = { cv:null, stage:null, world:null, raf:0, key:'', last:0, atlas:null, S:0, win:null, layerKey:'' };
/* (3.96) The ground's canvas lives inside the deck's world and moves with
   it: the glide of each step is the browser's own, sprites and ground
   together, and nothing is painted while you walk. It holds the squares in
   view and JG_PAINT_MARGIN more all round, and is painted again only when
   the view comes within JG_PAINT_NEAR of its edge (every few steps), the
   size of a square changes, or water in it ripples. (3.84–3.95: a canvas
   under the world, painted again on every frame of every step to follow
   the camera, and a frame behind it when the page was busy: the stutter.) */
const JG_PAINT_MARGIN = 5, JG_PAINT_NEAR = 2;
function jgPaintStart(stage, world){
  if(!stage || !world) return;
  stage.querySelectorAll(':scope > canvas.jg-ground').forEach(c=> c.remove());
  let cv = world.querySelector(':scope > canvas.jg-ground');
  if(!cv){
    cv = document.createElement('canvas');
    cv.className = 'jg-ground';
    cv.setAttribute('aria-hidden', 'true');
    world.insertBefore(cv, world.firstChild);
  }
  /* (3.96) over everyone: what of the trees' crowns reaches out over the paths (jgPaintLayer's `ov`) */
  let ov = world.querySelector(':scope > canvas.jg-over');
  if(!ov){
    ov = document.createElement('canvas');
    ov.className = 'jg-over';
    ov.setAttribute('aria-hidden', 'true');
    world.appendChild(ov);
  }
  jgRays(stage);
  Object.assign(JG_P, { cv, ov, stage, world, key:'', last:0, layerKey:'', win:null, holes:null, seeRaf:0 });
  if(!JG_P.raf && typeof requestAnimationFrame === 'function') JG_P.raf = requestAnimationFrame(jgPaintTick);
}
/* (3.95) "slowly shifting, cascading rays of golden light from the top
   diagonally down to connote sunlight filtering down across the map":
   shafts of light over the map (not the buttons), each swaying on its own
   slow clock, a shimmer running down it. Still, if the device asks for
   less motion. */
const JG_RAYS = [[-6, 13, 0.4, 27, -4], [13, 8, 0.28, 19, -13], [28, 18, 0.44, 33, -21], [49, 10, 0.3, 23, -7], [63, 21, 0.36, 37, -29], [85, 12, 0.3, 21, -16]];
function jgRays(stage){
  if(!stage || stage.querySelector('.jg-rays')) return;
  const el = document.createElement('div');
  el.className = 'jg-rays';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = JG_RAYS.map(([x, w, o, d, dl])=> `<i style="--x:${x}%;--w:${w}%;--o:${o};--d:${d}s;--dl:${dl}s"></i>`).join('');
  stage.appendChild(el);
}
function jgPaintTick(now){
  JG_P.raf = 0;
  if(!JG_P.cv || !JG_P.cv.isConnected) return;          // the map is gone: the clock stops
  try { jgPaintDraw(null, now); } catch(e){ console.error('jungle paint:', e); }
  JG_P.raf = requestAnimationFrame(jgPaintTick);
}
/* Paints the ground if the view needs it (the camera's own view, where it
   is going: sceneCamView); otherwise does nothing. `cam` is not needed (the
   old painter's). */
function jgPaintDraw(cam, now){
  const cv = JG_P.cv, view = typeof sceneCamView === 'function' ? sceneCamView() : null;
  if(!cv || !view) return;
  /* (4.08) drawn as sharp as the camera is close: Lucesco's zoom (walkZoomS) — the layer's pixels to a square, `k`, go
     up with it, its size on the page (in the world's own pixels) does not */
  const zz = ui.walkZoom, zs = Math.max(1, zz && zz.deck === JG_KEY ? (zz.to || zz.s || 1) : 1);
  const T = WALK_T, dpr = Math.min(1.5, window.devicePixelRatio || 1), k = T * dpr * zs;
  const S = Math.max(8, Math.round(k));
  if(!JG_P.atlas || JG_P.S !== S){ JG_P.atlas = new Map(); JG_P.S = S; JG_P.layerKey = ''; }
  const frame = Math.floor((now || 0) / 420) % 4, key = T + ':' + k.toFixed(3);
  let w = JG_P.win;
  const inside = w && view.x0 - JG_PAINT_NEAR >= w.x0 && view.y0 - JG_PAINT_NEAR >= w.y0 && view.x1 + JG_PAINT_NEAR <= w.x1 + 1 && view.y1 + JG_PAINT_NEAR <= w.y1 + 1;
  if(inside && JG_P.layerKey === key && !(w.water && w.frame !== frame)) return;
  if(!inside || JG_P.layerKey !== key){
    const cols = Math.ceil(view.x1 - view.x0) + 2 * JG_PAINT_MARGIN + 1, rows = Math.ceil(view.y1 - view.y0) + 2 * JG_PAINT_MARGIN + 1;
    const x0 = Math.floor(view.x0) - JG_PAINT_MARGIN, y0 = Math.floor(view.y0) - JG_PAINT_MARGIN;
    w = JG_P.win = { x0, y0, x1:x0 + cols - 1, y1:y0 + rows - 1, water:false, frame };
  }
  const fresh = !inside || JG_P.layerKey !== key;                       // new squares (not only the water's ripple): the crowns over the paths too
  const cols = w.x1 - w.x0 + 1, rows = w.y1 - w.y0 + 1, pw = Math.ceil(cols * k), ph = Math.ceil(rows * k);
  const ov = JG_P.ov && JG_P.ov.isConnected ? JG_P.ov : null;
  [cv].concat(fresh && ov ? [ov] : []).forEach(c=>{
    if(c.width !== pw || c.height !== ph){ c.width = pw; c.height = ph; }
    c.style.left = (w.x0 * T) + 'px'; c.style.top = (w.y0 * T) + 'px';
    c.style.width = (pw / (dpr * zs)) + 'px'; c.style.height = (ph / (dpr * zs)) + 'px';
  });
  JG_P.k = k;
  if(!fresh){ jgPaintWater(cv.getContext('2d'), w, k, frame); w.frame = frame; return; }   // (3.96) only the water rippling: only its squares
  w.water = jgPaintLayer(cv.getContext('2d'), w.x0, w.y0, w.x1, w.y1, k, frame, pw, ph, fresh ? ov : null);
  w.frame = frame;
  JG_P.layerKey = key;
  if(fresh){ JG_P.holes = null; jgSeeThrough(true); }                   // the see-through, cut again in the new layer
}
/* (3.96) The crowns over the path you (and Lucesco) stand under go see-through, as the Old Town's church spire
   does (3.31): a window in them, gliding with you as you step. Only that patch of the layer is drawn again, so it
   costs next to nothing.
   (3.98) The designer: "make sure trees don't obscure either lucesco or the player sprite (the translucent 'see
   through effect' treatment)". The window was a small soft circle at your middle, 72% clear there and fading to
   nothing by your edges, so a crown still hid your head, your feet and most of Lucesco. It is now cut to the figure
   itself: an oval round the whole of you (and of him), 85% clear right out past the figure's edge, then fading. The
   same tree is drawn under you on the ground layer, so the window never shows as a hole: only whoever is in it.
   `fig`: where in its picture's box a figure is drawn (centre x, centre y, half width, half height, as fractions of
   the box), from the pictures themselves (the avatars 21–58 × 7–79 of 80; Lucesco 10–87 × 5–90 of 96). */
const JG_SEE = { cut:0.85, solid:0.66, grow:[1.16, 1.08],
  fig:{ you:[0.49, 0.54, 0.24, 0.46], lion:[0.51, 0.5, 0.41, 0.45], emoji:[0.5, 0.5, 0.42, 0.46] } };
/* the figure a walker draws, in squares from its own square's top-left corner: [cx, cy, half w, half h], measured
   off its picture as the page draws it (scaled up, nudged, as each one is); null if it is not drawn */
function seeFigure(el){
  if(!el) return null;
  const er = el.getBoundingClientRect(), T = er.width;
  if(!T) return null;
  const pic = el.querySelector('img') || el.querySelector('.walk-emoji');
  const r = pic ? pic.getBoundingClientRect() : er;
  if(!r.width || !r.height) return null;
  const F = JG_SEE.fig, f = !pic || pic.tagName !== 'IMG' ? F.emoji : /lion/i.test(el.id + ' ' + el.className) ? F.lion : F.you;
  return [(r.left - er.left + r.width * f[0]) / T, (r.top - er.top + r.height * f[1]) / T, r.width * f[2] / T, r.height * f[3] / T];
}
/* how far a window reaches out from its middle, [x, y], in the same units as its figure's half-size */
function seeReach(hw, hh){ return [hw * JG_SEE.grow[0] / JG_SEE.solid, hh * JG_SEE.grow[1] / JG_SEE.solid]; }
/* the window itself, cut into a layer over everyone (its context already cutting: destination-out): an oval round a
   figure at (cx, cy) of half-size (hw, hh), all in the layer's pixels — clear to JG_SEE.cut out a little past the
   figure, then fading to nothing */
function seeCut(g, cx, cy, hw, hh, cut){
  const [a, b] = seeReach(hw, hh), c = cut != null ? cut : JG_SEE.cut, s = JG_SEE.solid;   // (4.08) `cut`: a fainter window (the castle's low things, CA_BEHIND)
  if(!(a > 0 && b > 0)) return;
  g.save();
  g.translate(cx, cy); g.scale(1, b / a);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, a);
  gr.addColorStop(0, `rgba(0,0,0,${c})`); gr.addColorStop(s, `rgba(0,0,0,${c})`);
  gr.addColorStop(s + (1 - s) * 0.5, `rgba(0,0,0,${(c * 0.4).toFixed(3)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(-a, -a, 2 * a, 2 * a);
  g.restore();
}
/* the windows: [x, y, half w, half h] in squares, for you and for Lucesco */
function jgSeePoints(){
  const W = walkState(), p = W.at && W.at[JG_KEY], L = ui.jgLion;
  if(!p) return null;
  /* (4.03) riding: one window, round the two of you together */
  if(jgRiding()){
    const fr = jgRideFigure() || [0.5, 0.2, 0.72, 0.78];
    return [[p.x + fr[0], p.y + fr[1], fr[2], fr[3]]].concat(jgZapWindows());
  }
  const fy = seeFigure(document.getElementById('walkYou')) || [0.49, 0.55, 0.31, 0.59];
  const pts = [[p.x + fy[0], p.y + fy[1], fy[2], fy[3]]];
  if(L){ const fl = seeFigure(document.getElementById('jgLion')) || [0.5, 0.35, 0.65, 0.71]; pts.push([L.x + fl[0], L.y + fl[1], fl[2], fl[3]]); }
  return pts.concat(jgZapWindows());
}
function jgSeeThrough(now){
  const ov = JG_P.ov, w = JG_P.win;
  if(!ov || !w || !JG_P.k || !ov.isConnected) return;
  const to = jgSeePoints();
  if(!to) return;
  const from = JG_P.holes;
  cancelAnimationFrame(JG_P.seeRaf); JG_P.seeRaf = 0;
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(now || !from || from.length !== to.length || reduce){ jgOverPatch(from, to); JG_P.holes = to; return; }
  const t0 = performance.now(), D = typeof WALK_REP === 'number' ? WALK_REP : 200;
  let last = from;
  const step = t=>{
    const a = Math.min(1, (t - t0) / D);
    const cur = to.map((q, i)=> q.map((v, j)=> from[i][j] + (v - from[i][j]) * a));
    jgOverPatch(last, cur);
    last = cur; JG_P.holes = cur;
    JG_P.seeRaf = a < 1 ? requestAnimationFrame(step) : 0;
  };
  JG_P.seeRaf = requestAnimationFrame(step);
}
/* the patch round the windows `was` (put back) and `now` (cut): the crowns there drawn again, then the windows cut */
function jgOverPatch(was, now){
  const ov = JG_P.ov, w = JG_P.win, k = JG_P.k, g = ov.getContext('2d');
  const all = (was || []).concat(now || []).filter(q=> q && q.length >= 4);
  if(!all.length) return;
  const ext = all.map(q=> seeReach(q[2], q[3]));                       // (3.98) each window's own reach
  const X0 = Math.floor(Math.min(...all.map((q, i)=> q[0] - ext[i][0])) - 0.5), X1 = Math.ceil(Math.max(...all.map((q, i)=> q[0] + ext[i][0])) + 0.5);
  const Y0 = Math.floor(Math.min(...all.map((q, i)=> q[1] - ext[i][1])) - 0.5), Y1 = Math.ceil(Math.max(...all.map((q, i)=> q[1] + ext[i][1])) + 0.5);
  const px = v=> Math.round((v - w.x0) * k), py = v=> Math.round((v - w.y0) * k);
  const rx = px(X0), ry = py(Y0), rw = px(X1) - rx, rh = py(Y1) - ry;
  g.save();
  g.beginPath(); g.rect(rx, ry, rw, rh); g.clip();
  g.clearRect(rx, ry, rw, rh);
  for(let y = Y0; y <= Y1 + 1; y++) for(let x = X0 - 1; x <= X1 + 1; x++){
    if(jgTile(x, y) !== JG_T.HEDGE) continue;
    g.drawImage(jgSprite('tree3', jgTreeKey(x, y)), Math.round((x - w.x0 - 0.2) * k), Math.round((y - w.y0 - 0.6) * k), Math.round(1.4 * k), Math.round(1.6 * k));
  }
  jgVillageTreesOver(g, X0, Y0, X1, Y1, w.x0, w.y0, k);               // (3.97) the villages' trees too
  g.globalCompositeOperation = 'destination-out';                       // only over the paths, as the layer is
  g.fillStyle = '#000';
  for(let y = Y0; y < Y1; y++) for(let x = X0; x < X1; x++) if(JG_SOLID[jgTile(x, y)]) g.fillRect(px(x), py(y), px(x + 1) - px(x), py(y + 1) - py(y));
  (now || []).forEach(q=>{ if(q && q.length >= 4) seeCut(g, (q[0] - w.x0) * k, (q[1] - w.y0) * k, q[2] * k, q[3] * k); });   // (3.98) round each figure
  g.restore();
}
/* (3.96) the water's next ripple, its squares alone (the rest of the layer as it was) */
function jgPaintWater(ctx, w, k, frame){
  jgDrawLakes(ctx, w.x0, w.y0, w.x1, w.y1, k, frame);                  // (4.02) the lakes, round (until 4.02 their squares, one by one)
}
/* ---------- (4.02) THE LAKES, ROUND ----------
   The designer: "for the pools both in the castle and in the jungle, could you make the shape ovoid or circular? this
   may mean that some tiles are locked out from walking even if most of the tile is not the pool but appears to be
   land. the square blocky pool shape just doesn't look pleasing." A lake's squares are water (which
   nobody walks on; jgGround: every square the oval touches), but drawn as its shore, and the lake itself over them,
   the oval: a rim of wet sand round it, the shallows, the deep water, ripples and a glint (jgLakeShape: its outline). */
/* fit: how far the oval reaches, of the old wobbling one's (squares within 0.86–1 of it were water); rim: its wet
   sand, round it */
const JG_LAKE = { fit:0.84, rim:0.32, rays:96 };
const _jgLakes = new Map();
/* its outline: points (in squares) round the oval (`water`) and round its wet sand (`rim`); (x, y) its middle */
function jgLakeShape(L){
  let r = _jgLakes.get(L);
  if(r) return r;
  const n = JG_LAKE.rays, ring = (ex, ey)=> [...Array(n)].map((_, i)=>{ const a = i / n * Math.PI * 2; return [L.mx + Math.cos(a) * ex, L.my + Math.sin(a) * ey]; });
  r = { x:L.mx, y:L.my, water:ring(L.ex, L.ey), rim:ring(L.ex + JG_LAKE.rim, L.ey + JG_LAKE.rim) };
  _jgLakes.set(L, r);
  return r;
}
/* (4.02) a square was water before 4.02 (the finds were laid out on that jungle: jgFinds) */
function jgLakeWaterOld(x, y){
  return jgGround().places.lakes.some(L=>{
    if(x < L.x || y < L.y || x >= L.x + L.w || y >= L.y + L.h) return false;
    const d = ((x - L.cx) / (L.rx - 2.4)) ** 2 + ((y - L.cy) / (L.ry - 2.4)) ** 2;
    return d < 0.86 + 0.14 * Math.sin(x * 0.9 + y * 1.3);
  });
}
/* the lakes in the squares x0…x1, y0…y1 onto a layer whose corner is square (x0, y0), k pixels to a square */
function jgDrawLakes(ctx, x0, y0, x1, y1, k, frame){
  const G = jgGround();
  G.places.lakes.forEach((L, li)=>{
    if(L.x > x1 + 1 || L.y > y1 + 1 || L.x + L.w < x0 - 1 || L.y + L.h < y0 - 1) return;
    const S = jgLakeShape(L);
    const shape = (pts, scale)=>{                                                            // scale: toward its middle
      ctx.beginPath();
      pts.forEach(([X, Y], i)=>{ const px = (S.x + (X - S.x) * scale - x0) * k, py = (S.y + (Y - S.y) * scale - y0) * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.closePath();
    };
    shape(S.rim, 1); ctx.fillStyle = '#86955a'; ctx.fill();                                  // its rim of wet sand
    shape(S.water, 1); ctx.fillStyle = '#4f9bc8'; ctx.fill();                                // the shallows
    [['#4189bb', 0.86], ['#3478aa', 0.72], ['#2d6f9c', 0.58]].forEach(([c, sc])=>{ shape(S.water, sc); ctx.fillStyle = c; ctx.fill(); });   // deeper
    ctx.save();
    shape(S.water, 1); ctx.clip();
    const ph = frame / 4 * Math.PI * 2, cx = (S.x - x0) * k, cy = (S.y - y0) * k, rx = L.ex * k, ry = L.ey * k;
    ctx.strokeStyle = 'rgba(220,245,255,.45)'; ctx.lineWidth = Math.max(1, k * 0.045); ctx.lineCap = 'round';
    for(let i = 0; i < 14; i++){                                                             // ripples drifting
      const a = jgHash(i, li, 71) * Math.PI * 2, r = Math.sqrt(jgHash(li, i, 72)) * 0.8;
      const px = cx + Math.cos(a) * rx * r + Math.sin(ph + i) * k * 0.08, py = cy + Math.sin(a) * ry * r, len = k * (0.3 + 0.2 * jgHash(i, li, 73));
      ctx.beginPath(); ctx.moveTo(px - len, py + k * 0.04 * Math.sin(ph + i)); ctx.quadraticCurveTo(px, py - k * 0.08, px + len, py + k * 0.04 * Math.cos(ph + i)); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.75)';                                                 // a glint or two
    for(let i = 0; i < 3; i++){
      if((frame + i) % 4 > 1) continue;
      const a = jgHash(i, li + frame, 74) * Math.PI * 2, r = Math.sqrt(jgHash(li + frame, i, 75)) * 0.6;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, k * 0.05, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  });
}
/* the squares x0…x1, y0…y1 onto a layer whose corner is square (x0, y0); says whether any water was drawn.
   (3.96) `ov`: a second layer, over everyone, for what of the trees reaches out over the paths */
function jgPaintLayer(ctx, x0, y0, x1, y1, k, frame, lw, lh, ov){
  ctx.fillStyle = '#2a3417'; ctx.fillRect(0, 0, lw, lh);
  let water = false;
  const trees = [];                                                   // the tree squares in view, as drawn: [px, py, pw, ph]
  const solid = [];                                                   // (3.97) and every square nobody stands on (trees, huts, water…)
  for(let y = y0; y <= y1; y++){
    const py = Math.round((y - y0) * k), ph = Math.round((y + 1 - y0) * k) - py;
    for(let x = x0; x <= x1; x++){
      const px = Math.round((x - x0) * k), pw = Math.round((x + 1 - x0) * k) - px;
      const t = jgTile(x, y);
      if(t === JG_T.WATER) water = true;
      if(t === JG_T.HEDGE){ ctx.fillStyle = jgShadeCss(x, y); ctx.fillRect(px, py, pw, ph); trees.push([px, py, pw, ph]); }   // the deep shade under the trees
      else jgPaintTile(ctx, x, y, px, py, pw, ph, frame, 1);
      if(JG_SOLID[t]) solid.push([px, py, pw, ph]);
    }
  }
  if(water) jgDrawLakes(ctx, x0, y0, x1, y1, k, frame);                 // (4.02) the lakes, round, over their squares
  /* (3.96) the designer: "Can we allow the trees to rise up to half a tile and include dark shadowy trunks at the bottom
     of each row? Make it look like real trees please. The round tops of the trees can protrude up to 1/3 or even 1/2 a
     tile on top tile into the empty path" — and of the mockups, "Round olive trees are amazing!". A round olive tree
     on every tree square; where a path runs below it, its trunk shows in the shade under its crown, its shadow on the
     path; its crown reaches up to 0.4 of a square over the square above. Row by row, back to front: on the ground,
     what stands on the trees' own squares; over everyone (`ov`), what reaches over a path, which you can walk under
     (see-through round you and Lucesco: jgSeeThrough). */
  ctx.fillStyle = 'rgba(10,16,4,.42)';
  for(let y = y0 - 1; y <= y1; y++) for(let x = x0 - 1; x <= x1 + 1; x++){
    if(jgTile(x, y) !== JG_T.HEDGE || jgTile(x, y + 1) === JG_T.HEDGE) continue;
    ctx.beginPath(); ctx.ellipse((x - x0 + 0.56) * k, (y - y0 + 1.0) * k, 0.46 * k, 0.13 * k, 0, 0, Math.PI * 2); ctx.fill();
  }
  const drawTrees = g=>{
    for(let y = y0; y <= y1 + 1; y++) for(let x = x0 - 1; x <= x1 + 1; x++){
      if(jgTile(x, y) !== JG_T.HEDGE) continue;
      g.drawImage(jgSprite('tree3', jgTreeKey(x, y)), Math.round((x - x0 - 0.2) * k), Math.round((y - y0 - 0.6) * k), Math.round(1.4 * k), Math.round(1.6 * k));
    }
  };
  /* whole on the ground (what reaches over a path is drawn again over everyone, and under you shows only where it is
     see-through); on `ov` whole too, then the trees' own squares cleared out of it: no clipping, so it is quick */
  drawTrees(ctx);
  if(ov){
    const og = ov.getContext('2d');
    og.clearRect(0, 0, ov.width, ov.height);
    drawTrees(og);
    jgVillageTreesOver(og, x0, y0, x1, y1, x0, y0, k);                // (3.97) and the villages' tall trees
    og.globalCompositeOperation = 'destination-out';
    og.fillStyle = '#000';
    solid.forEach(r=> og.fillRect(r[0], r[1], r[2], r[3]));
    og.globalCompositeOperation = 'source-over';
  }
  /* trees stand up over the ground round them (the villages') */
  for(let y = y0; y <= y1 + 1; y++) for(let x = x0; x <= x1; x++){
    if(jgTile(x, y) !== JG_T.TREE) continue;
    const spr = jgSprite('tree', jgHash(x, y, 3) < 0.5 ? 0 : 1);
    ctx.drawImage(spr, Math.round((x - 0.5 - x0) * k), Math.round((y - 1.2 - y0) * k), Math.round(2 * k), Math.round(2 * k));
  }
  if(typeof questPaintBars === 'function') questPaintBars(ctx, x0, y0, x1, y1, k);   // (3.99) the tribes' walls of thorns, while they stand
  return water;
}
/* (3.97) The designer: "The see through needs to happen … for tall trees which reach up 2 tiles. … also apply to the
   jungle village trees." A village tree over everyone: only what of it rises above its own row (its crown over the
   square behind it), so who stands beside it or in front of it is not hidden. Squares x0…, y0… from the layer's corner. */
function jgVillageTreesOver(g, X0, Y0, X1, Y1, x0, y0, k){
  for(let y = Y0; y <= Y1 + 2; y++) for(let x = X0 - 1; x <= X1 + 1; x++){
    if(jgTile(x, y) !== JG_T.TREE) continue;
    const px = Math.round((x - 0.5 - x0) * k), py = Math.round((y - 1.2 - y0) * k), base = Math.round((y - y0) * k), sz = Math.round(2 * k);
    if(base <= py) continue;
    g.save(); g.beginPath(); g.rect(px, py, sz, base - py); g.clip();
    g.drawImage(jgSprite('tree', jgHash(x, y, 3) < 0.5 ? 0 : 1), px, py, sz, sz);
    g.restore();
  }
}
/* (3.96) a tree square's look: 1 a path below it (its trunk shows), ×2 one of four shapes, ×8 deep in the woods (darker) */
function jgTreeKey(x, y){
  const H = (a, b)=> jgTile(a, b) === JG_T.HEDGE;
  const front = H(x, y + 1) ? 0 : 1;
  const deep = H(x - 1, y - 1) && H(x, y - 1) && H(x + 1, y - 1) && H(x - 1, y) && H(x + 1, y) && H(x - 1, y + 1) && H(x, y + 1) && H(x + 1, y + 1) ? 1 : 0;
  return front | (Math.floor(jgHash(x, y, 41) * 4) << 1) | (deep << 3);
}
/* the shade under the trees: almost black-green, a little lighter and darker here and there */
const _jgShade = new Map();
function jgShadeCss(x, y){
  const d = Math.floor(jgHash(x, y, 91) * 4);
  let c = _jgShade.get(d);
  if(!c){ c = `rgb(${24 + d * 3},${33 + d * 4},${15 + d * 2})`; _jgShade.set(d, c); }
  return c;
}
/* (3.95) The floor's green: a colour for every square, drifting slowly from
   place to place — fresher by the Grass tribe, bluer by the Water's,
   yellower by the Earth's and the Fire's, emerald round the castle — and
   lighter and darker in patches. Worked out once (about 40 ms). */
const JG_FLOOR_HUE = { grass:100, water:146, earth:80, fire:68, castle:124 };
let _jgFloor = null;
function jgHslRgb(h, s, l){
  h = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t=>{ t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}
function jgFloor(){
  if(_jgFloor) return _jgFloor;
  const G = jgGround(), { W, H, places } = G;
  const rgb = new Uint8ClampedArray(W * H * 4);
  const anchors = JG_TRIBE_KEYS.map(k=>{ const v = places.villages[k]; return [v.x + v.w / 2, v.y + v.h / 2, JG_FLOOR_HUE[k]]; });
  const C = places.castle; anchors.push([C.x + C.w / 2, C.y + C.h / 2, JG_FLOOR_HUE.castle]);
  const noise = (x, y, s, k)=>{
    const gx = x / s, gy = y / s, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = jgHash(x0, y0, k), b = jgHash(x0 + 1, y0, k), c = jgHash(x0, y0 + 1, k), d = jgHash(x0 + 1, y0 + 1, k);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    let ws = 0, hs = 0;
    for(let k = 0; k < anchors.length; k++){ const A = anchors[k], w = 1 / ((A[0] - x) * (A[0] - x) + (A[1] - y) * (A[1] - y) + 900); ws += w; hs += w * A[2]; }
    const n = 0.62 * noise(x, y, 26, 11) + 0.38 * noise(x, y, 7, 12);
    const c = jgHslRgb(hs / ws + (noise(x, y, 41, 13) - 0.5) * 16, 0.40 + (n - 0.5) * 0.18, 0.345 + (n - 0.5) * 0.16);
    const i = (y * W + x) * 4; rgb[i] = c[0]; rgb[i + 1] = c[1]; rgb[i + 2] = c[2]; rgb[i + 3] = 255;
  }
  _jgFloor = { rgb, css:new Map() };
  return _jgFloor;
}
function jgFloorCss(x, y){
  if(x < 0 || y < 0 || x >= JG.W || y >= JG.H) return '#3f6e31';
  const F = jgFloor(), i = (y * JG.W + x) * 4, key = (F.rgb[i] << 16) | (F.rgb[i + 1] << 8) | F.rgb[i + 2];
  let s = F.css.get(key);
  if(!s){ s = `rgb(${F.rgb[i]},${F.rgb[i + 1]},${F.rgb[i + 2]})`; F.css.set(key, s); }
  return s;
}
/* (3.95) A wall square is a tree's crown, olive: joined to the crowns beside
   it, rounded where a path runs by, darker where the trees stand deep. */
function jgWallKey(x, y){
  const H = (a, b)=> jgTile(a, b) === JG_T.HEDGE;
  const mask = (H(x, y - 1) ? 1 : 0) | (H(x + 1, y) ? 2 : 0) | (H(x, y + 1) ? 4 : 0) | (H(x - 1, y) ? 8 : 0);
  const deep = mask === 15 && H(x - 1, y - 1) && H(x + 1, y - 1) && H(x - 1, y + 1) && H(x + 1, y + 1) ? 1 : 0;
  return mask | (Math.floor(jgHash(x, y, 2) * 3) << 4) | (deep << 6);
}
/* `pass`: 1 the ground and the crowns' shapes, the leaves left to a second pass over them all (jgPaintDraw);
   left out, everything in this square at once (the castle's views over the jungle) */
const JG_LEAF_SPILL = 0.3;                                            // how far a crown's leaves spread into the crowns beside it, in squares
function jgPaintTile(ctx, x, y, px, py, pw, ph, frame, pass){
  const t = jgTile(x, y), v = jgHash(x, y, 1);
  let spr = null, floor = false;
  switch(t){
    case JG_T.HEDGE: {                                                // (3.96) the shade under a round olive tree, and (drawn alone: the castle's views) the tree
      ctx.fillStyle = jgShadeCss(x, y); ctx.fillRect(px, py, pw, ph);
      if(pass !== 1){
        const n = jgTreeKey(x, y);
        if(n & 1){ ctx.fillStyle = 'rgba(10,16,4,.42)'; ctx.beginPath(); ctx.ellipse(px + pw * 0.56, py + ph * 0.94, pw * 0.44, ph * 0.08, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.drawImage(jgSprite('tree3', n), Math.round(px - pw * 0.2), Math.round(py - ph * 0.6), Math.round(pw * 1.4), Math.round(ph * 1.6));
      }
      return;
    }
    case JG_T.PATH: floor = true; spr = jgSprite('fl', Math.floor(v * 10)); break;
    case JG_T.GLADE: floor = true; spr = jgSprite('glade', Math.floor(v * 4)); break;
    case JG_T.TREE: { const vk = jgVillageAt(x, y); if(vk) spr = jgSprite('village-' + vk, Math.floor(v * 3)); else { floor = true; spr = jgSprite('glade', Math.floor(v * 4)); } break; }
    case JG_T.SHORE: spr = jgSprite('shore', Math.floor(v * 3)); break;
    case JG_T.WATER: spr = pass === 1 ? jgSprite('shore', Math.floor(v * 3)) : jgSprite('water', (frame + Math.floor(v * 4)) % 4); break;   // (4.02) the lake drawn over them, round
    case JG_T.VILLAGE: spr = jgSprite('village-' + (jgVillageAt(x, y) || 'grass'), Math.floor(v * 3)); break;
    case JG_T.HUT: {                                                  // (3.96) a flowering grass mound, sliced square by square
      const vk = jgVillageAt(x, y) || 'grass', r = jgHutRect(x, y, vk), S = JG_P.S || 48;
      ctx.drawImage(jgSprite('village-' + vk, Math.floor(v * 3)), px, py, pw, ph);
      if(r) ctx.drawImage(jgSprite(`mound-${vk}-${r.w}x${r.h}`, r.n), (x - r.x) * S, (y - r.y) * S, S, S, px, py, pw, ph);
      return;
    }
    case JG_T.CASTLE: spr = jgSprite('castle-' + jgCastlePart(x, y), (x + y) & 1); break;
    case JG_T.GATE: spr = jgSprite('gate', 0); break;
    case JG_T.ROAD: spr = jgSprite('road', Math.floor(v * 3)); break;
    case JG_T.ENTRY: floor = true; spr = jgSprite('entry', Math.floor(v * 3)); break;
  }
  if(floor){ ctx.fillStyle = jgFloorCss(x, y); ctx.fillRect(px, py, pw, ph); }
  if(spr) ctx.drawImage(spr, px, py, pw, ph);
  /* what touches it: the shade the trees throw, the water's sandy rim */
  const solid = JG_SOLID[t];
  if(!solid){
    const n = jgTile(x, y - 1), w = jgTile(x - 1, y);
    if(n === JG_T.HEDGE || n === JG_T.CASTLE) ctx.drawImage(jgSprite('shadeN', 0), px, py, pw, ph);   // (3.96) a mound throws its own round shadow
    if(w === JG_T.HEDGE) ctx.drawImage(jgSprite('shadeW', 0), px, py, pw, ph);
  } else if(t === JG_T.WATER && pass !== 1){
    ctx.fillStyle = 'rgba(232,222,170,.6)';
    const e = Math.max(1, Math.round(pw * 0.12));
    if(jgTile(x, y - 1) !== JG_T.WATER) ctx.fillRect(px, py, pw, e);
    if(jgTile(x, y + 1) !== JG_T.WATER) ctx.fillRect(px, py + ph - e, pw, e);
    if(jgTile(x - 1, y) !== JG_T.WATER) ctx.fillRect(px, py, e, ph);
    if(jgTile(x + 1, y) !== JG_T.WATER) ctx.fillRect(px + pw - e, py, e, ph);
  }
}
/* (3.96) the hut (or the lodge) a square is part of, and which look it has: `n` 0/1 a hut (its window on the left or the right), 2 the lodge */
function jgHutRect(x, y, vk){
  const v = jgGround().places.villages[vk || jgVillageAt(x, y) || 'grass'];
  if(!v) return null;
  const L = v.lodge;
  if(x >= L.x && y >= L.y && x < L.x + L.w && y < L.y + L.h) return { x:L.x, y:L.y, w:L.w, h:L.h, n:2 };
  const i = v.huts.findIndex(h=> x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h);
  if(i < 0) return null;
  const h = v.huts[i];
  return { x:h.x, y:h.y, w:h.w, h:h.h, n:i & 1 };
}
/* the castle's squares: its wall (three deep, battlements round the outside), towers, the keep, gardens */
function jgCastlePart(x, y){
  const c = jgGround().places.castle, ix = x - c.x, iy = y - c.y, edge = Math.min(ix, iy, c.w - 1 - ix, c.h - 1 - iy);
  if(edge === 0) return 'crenel';
  if(edge < 3) return 'wall';
  if((ix < 10 || ix >= c.w - 10) && (iy < 10 || iy >= c.h - 10)) return 'tower';
  if(Math.abs(ix - c.w / 2 + 0.5) < 13 && Math.abs(iy - c.h / 2 + 0.5) < 13) return 'keep';
  return 'garden';
}
/* One square's picture, drawn once at the size it is shown (and again if that changes). */
function jgSprite(kind, n){
  const key = kind + ':' + n;
  const A = JG_P.atlas || (JG_P.atlas = new Map());
  let c = A.get(key);
  if(c) return c;
  const S = JG_P.S || 48;
  c = document.createElement('canvas');
  const big = kind === 'tree';
  c.width = c.height = big ? S * 2 : kind === 'leaf' ? S + 2 * Math.round(S * JG_LEAF_SPILL) : S;
  if(kind.startsWith('mound-')){ const d = kind.split('-')[2].split('x'); c.width = (+d[0] || 4) * S; c.height = (+d[1] || 3) * S; }   // (3.96) a whole mound
  if(kind === 'tree3'){ c.width = Math.round(S * 1.4); c.height = Math.round(S * 1.6); }                                        // (3.96) a tree and the crown over the square above
  const g = c.getContext('2d');
  jgDrawSprite(g, kind, n, S);
  A.set(key, c);
  return c;
}
function jgDrawSprite(g, kind, n, S){
  const h = (k)=> jgHash(n * 31 + 7, kind.length * 17 + 3, k);
  const dots = (base, cols, count, size)=>{
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    for(let k = 0; k < count; k++){
      g.fillStyle = cols[k % cols.length];
      g.beginPath(); g.arc(h(k) * S, h(k + 40) * S, S * (0.03 + h(k + 80) * size), 0, Math.PI * 2); g.fill();
    }
  };
  const tufts = (col, count)=>{
    g.strokeStyle = col; g.lineWidth = Math.max(1, S / 22); g.lineCap = 'round';
    for(let k = 0; k < count; k++){
      const bx = S * (0.15 + 0.7 * h(k + 120)), by = S * (0.3 + 0.6 * h(k + 140));
      for(let m = -1; m <= 1; m++){ g.beginPath(); g.moveTo(bx + m * S * 0.05, by); g.lineTo(bx + m * S * 0.1, by - S * (0.14 + 0.05 * Math.abs(m))); g.stroke(); }
    }
  };
  /* (3.96) a round olive tree, its square's corner at (0.2, 0.6) of a square in the picture: the crown
     reaching 0.4 of a square up over the square above; `n` 1: a path below (its trunk shows), ×2 its shape,
     ×8 deep in the woods (darker) */
  if(kind === 'tree3'){
    const front = n & 1, v = (n >> 1) & 3, deep = (n >> 3) & 1, ox = S * 0.2, oy = S * 0.6;
    const jx = [-0.05, 0.03, -0.02, 0.05][v] * S, jr = [0.95, 1.04, 0.99, 1.08][v];
    const c = deep ? ['#263418', '#33441d', '#435a25', '#58702f'] : ['#2f3d19', '#3d4f22', '#4f6429', '#68803a'];
    if(front){
      const tg = g.createLinearGradient(ox + S * 0.4 + jx, 0, ox + S * 0.6 + jx, 0);
      tg.addColorStop(0, '#3a2814'); tg.addColorStop(0.5, '#5a3f22'); tg.addColorStop(1, '#2a1c0c');
      g.fillStyle = tg; g.beginPath();
      g.moveTo(ox + S * 0.42 + jx, oy + S * 0.55); g.lineTo(ox + S * 0.58 + jx, oy + S * 0.55);
      g.lineTo(ox + S * 0.63 + jx, oy + S * 0.97); g.quadraticCurveTo(ox + S * 0.5 + jx, oy + S * 0.92, ox + S * 0.37 + jx, oy + S * 0.97);
      g.closePath(); g.fill();
      g.strokeStyle = '#24170a'; g.lineWidth = Math.max(1, S / 30); g.lineCap = 'round';
      g.beginPath(); g.moveTo(ox + S * 0.4 + jx, oy + S * 0.95); g.quadraticCurveTo(ox + S * 0.32 + jx, oy + S * 0.99, ox + S * 0.27 + jx, oy + S * 0.98);
      g.moveTo(ox + S * 0.6 + jx, oy + S * 0.95); g.quadraticCurveTo(ox + S * 0.68 + jx, oy + S * 0.99, ox + S * 0.73 + jx, oy + S * 0.98); g.stroke();
    }
    const cx = ox + S * 0.5 + jx, cy = oy + S * 0.18;
    const blob = (bx, by, r, col)=>{ g.fillStyle = col; g.beginPath(); g.arc(bx, by, r, 0, Math.PI * 2); g.fill(); };
    blob(cx, cy + S * 0.06, S * 0.56 * jr, c[0]);                                  // its shaded underside
    blob(cx - S * 0.24, cy + S * 0.1, S * 0.34 * jr, c[1]); blob(cx + S * 0.24, cy + S * 0.12, S * 0.33 * jr, c[1]);
    blob(cx, cy - S * 0.02, S * 0.46 * jr, c[1]);
    blob(cx - S * 0.1, cy - S * 0.1, S * 0.3 * jr, c[2]); blob(cx + S * 0.16, cy - S * 0.04, S * 0.22 * jr, c[2]);
    blob(cx - S * 0.16, cy - S * 0.2, S * 0.14 * jr, c[3]); blob(cx + S * 0.06, cy - S * 0.24, S * 0.1 * jr, c[3]);   // the sun on its top
    return;
  }
  /* (3.95) a tree's crown, seen from above: olive, joined to its neighbours,
     rounded and leafy where a path runs by; `n` = which sides join (1 N,
     2 E, 4 S, 8 W), its look (×16) and whether it stands deep (×64) */
  if(kind === 'wall' || kind === 'leaf'){
    const jn = n & 1, je = n & 2, js = n & 4, jw = n & 8, look = (n >> 4) & 3, deep = (n >> 6) & 1;
    /* one colour under every crown (no seams between them); the leaves vary */
    const base = deep ? '#253117' : '#33421d';
    const P = deep ? [['#2c3a1a', '#33431e', '#4a5d2a'], ['#2f3a19', '#36441d', '#4e5e29'], ['#29391d', '#304321', '#45602e']][look]
                   : [['#3d4f22', '#485c28', '#627936'], ['#415024', '#4c5d29', '#677a35'], ['#3a5025', '#455e2c', '#5c7a3b']][look];
    const e = S * 0.07, r = S * 0.36;
    const shape = (o, sp)=>{                                          // the crown's outline, offset `o`, spreading `sp` into joined neighbours
      const x0 = o + (jw ? -sp : e), x1 = o + S + (je ? sp : -e), y0 = o + (jn ? -sp : e), y1 = o + S + (js ? sp : -e);
      const tl = (!jn && !jw) ? r : 0, tr = (!jn && !je) ? r : 0, br = (!js && !je) ? r : 0, bl = (!js && !jw) ? r : 0;
      g.beginPath(); g.moveTo(x0 + tl, y0); g.lineTo(x1 - tr, y0);
      if(tr) g.quadraticCurveTo(x1, y0, x1, y0 + tr);
      g.lineTo(x1, y1 - br); if(br) g.quadraticCurveTo(x1, y1, x1 - br, y1);
      g.lineTo(x0 + bl, y1); if(bl) g.quadraticCurveTo(x0, y1, x0, y1 - bl);
      g.lineTo(x0, y0 + tl); if(tl) g.quadraticCurveTo(x0, y0, x0 + tl, y0);
      g.closePath();
    };
    if(kind === 'wall'){
      /* the crown's body: leafy bumps over a path, its top in the sun, its underside in shadow */
      g.fillStyle = base;
      const bump = (cx, cy)=>{ g.beginPath(); g.arc(cx, cy, S * 0.11, 0, Math.PI * 2); g.fill(); };
      [0.3, 0.7].forEach((f, i)=>{
        const j = (h(90 + i) - 0.5) * S * 0.12;
        if(!jn) bump(S * f + j, e + S * 0.05);
        if(!js) bump(S * f - j, S - e - S * 0.05);
        if(!jw) bump(e + S * 0.05, S * f + j);
        if(!je) bump(S - e - S * 0.05, S * f - j);
      });
      shape(0, 0); g.fill();
      return;
    }
    /* the leaves: clumps over the crown and a little into the crowns beside it (drawn over them all) */
    const m = Math.round(S * JG_LEAF_SPILL);
    g.save(); shape(m, m); g.clip();
    for(let k = 0; k < 11; k++){
      g.fillStyle = P[k % 2];
      g.beginPath(); g.arc(m + S * (-0.1 + 1.2 * h(k)), m + S * (-0.1 + 1.2 * h(k + 20)), S * (0.15 + 0.12 * h(k + 40)), 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = P[2]; g.globalAlpha = deep ? 0.28 : 0.45;
    for(let k = 0; k < 5; k++){ g.beginPath(); g.arc(m + S * (0.1 + 0.75 * h(k + 60)), m + S * (0.06 + 0.62 * h(k + 70)), S * (0.05 + 0.05 * h(k + 80)), 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    g.restore();
    g.save(); g.beginPath(); g.rect(m, m, S, S); g.clip();
    if(!jn){ g.fillStyle = 'rgba(214,226,140,.18)'; g.fillRect(m, m, S, S * 0.13); }                          // sun on the crowns' tops
    if(!js){ const gr = g.createLinearGradient(0, m + S * 0.6, 0, m + S); gr.addColorStop(0, 'rgba(12,16,4,0)'); gr.addColorStop(1, 'rgba(12,16,4,.4)'); g.fillStyle = gr; g.fillRect(m, m + S * 0.6, S, S * 0.4); }
    g.restore();
    return;
  }
  /* (3.95) the green floor's grass, over its colour (jgFloorCss): tufts, clover, now and then a flower */
  if(kind === 'fl'){
    if(n < 4) tufts('rgba(30,70,24,.45)', 1 + (n % 2));
    else if(n < 6){ g.fillStyle = 'rgba(150,200,110,.35)'; for(let k = 0; k < 5; k++){ g.beginPath(); g.arc(h(k) * S, h(k + 40) * S, S * (0.03 + h(k + 80) * 0.03), 0, Math.PI * 2); g.fill(); } }
    else if(n === 6){ g.fillStyle = ['#fff6d8', '#f3d66c', '#f2a7c3'][Math.floor(h(5) * 3)]; g.beginPath(); g.arc(S * (0.25 + 0.5 * h(6)), S * (0.25 + 0.5 * h(7)), S * 0.055, 0, Math.PI * 2); g.fill(); tufts('rgba(30,70,24,.4)', 1); }
    else { g.fillStyle = 'rgba(20,46,16,.22)'; for(let k = 0; k < 4; k++){ g.beginPath(); g.arc(h(k + 3) * S, h(k + 33) * S, S * (0.04 + h(k + 63) * 0.05), 0, Math.PI * 2); g.fill(); } }
    return;
  }
  /* a clearing: the same green, sunnier, with flowers */
  if(kind === 'glade'){
    g.fillStyle = 'rgba(255,246,170,.13)'; g.fillRect(0, 0, S, S);
    const cols = ['#f3d66c', '#ef9ab9', '#ffffff', '#b8e08a'];
    for(let k = 0; k < 5; k++){ g.fillStyle = cols[(k + n) % cols.length]; g.beginPath(); g.arc(h(k) * S, h(k + 40) * S, S * (0.03 + h(k + 80) * 0.03), 0, Math.PI * 2); g.fill(); }
    tufts('rgba(30,70,24,.4)', 2);
    return;
  }
  if(kind === 'shore'){ dots('#a3b673', ['#c9c78e', '#86a45a'], 5, 0.04); return; }
  if(kind === 'road'){ dots('#a49b8a', ['#b8b0a0', '#8f8676', '#c4bdae'], 7, 0.07); return; }
  if(kind === 'entry'){ g.fillStyle = 'rgba(220,255,200,.16)'; g.fillRect(0, 0, S, S); g.fillStyle = 'rgba(200,240,170,.45)'; for(let k = 0; k < 5; k++){ g.beginPath(); g.arc(h(k) * S, h(k + 40) * S, S * 0.04, 0, Math.PI * 2); g.fill(); } tufts('rgba(30,70,24,.4)', 1); return; }
  if(kind === 'water'){
    g.fillStyle = '#2d6f9c'; g.fillRect(0, 0, S, S);
    const ph = n / 4 * Math.PI * 2;
    g.strokeStyle = 'rgba(190,230,255,.38)'; g.lineWidth = Math.max(1, S / 24);
    g.beginPath(); g.moveTo(S * 0.12, S * (0.36 + 0.06 * Math.sin(ph))); g.quadraticCurveTo(S * 0.4, S * 0.26, S * 0.66, S * (0.38 + 0.06 * Math.cos(ph))); g.stroke();
    g.beginPath(); g.moveTo(S * 0.42, S * (0.72 + 0.05 * Math.cos(ph))); g.quadraticCurveTo(S * 0.66, S * 0.62, S * 0.9, S * (0.73 + 0.05 * Math.sin(ph))); g.stroke();
    return;
  }
  if(kind.startsWith('village-')){
    const T = JG_TRIBES[kind.slice(8)] || JG_TRIBES.grass;
    dots(T.ground, ['rgba(255,255,255,.22)', 'rgba(0,0,0,.08)', 'rgba(90,130,60,.35)'], 6, 0.05);
    tufts('rgba(80,120,50,.55)', n === 1 ? 2 : 0);
    if(n === 2){ g.fillStyle = ['#f3d66c', '#ef9ab9', '#ffffff'][(n * 7) % 3]; g.beginPath(); g.arc(S * 0.62, S * 0.4, S * 0.06, 0, Math.PI * 2); g.fill(); }
    return;
  }
  /* (3.96) the designer: "The house also don't look tribal. Could you draw
     them as flowering grass mounds please?" A dome of grass the size of the
     hut (4 × 3 squares; the guardian's lodge 6 × 4), its flowers the
     tribe's colours, a round wooden door at the front and a little round
     window beside it; the lodge, lanterns by its door and the tribe's
     pennant on top. Drawn whole, then shown a square at a time. */
  if(kind.startsWith('mound-')){
    const [, tk, dims] = kind.split('-'), [tw, th] = dims.split('x').map(Number);
    jgDrawMound(g, tk, tw || 4, th || 3, n, S);
    return;
  }
  if(kind.startsWith('castle-')){
    const part = kind.slice(7);
    if(part === 'wall' || part === 'crenel'){
      g.fillStyle = '#9b97b0'; g.fillRect(0, 0, S, S);
      g.strokeStyle = 'rgba(60,55,80,.35)'; g.lineWidth = 1;
      g.strokeRect(0.5, 0.5, S - 1, S / 2 - 1); g.strokeRect(S / 2 + 0.5, S / 2 + 0.5, S / 2 - 1, S / 2 - 1); g.strokeRect(0.5, S / 2 + 0.5, S / 2 - 1, S / 2 - 1);
      if(part === 'crenel' && n === 0){ g.fillStyle = '#7d7994'; g.fillRect(S * 0.2, S * 0.2, S * 0.6, S * 0.6); }
      return;
    }
    if(part === 'tower' || part === 'keep'){
      g.fillStyle = part === 'keep' ? ['#5d4aa8', '#6e5bc0'][n] : ['#4c62b5', '#5b73c9'][n]; g.fillRect(0, 0, S, S);
      g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(0, 0, S, S * 0.2);
      return;
    }
    dots('#6fa25a', ['#8bc06e', '#f0d36a', '#e98fb0'], 4, 0.05);
    return;
  }
  if(kind === 'gate'){
    g.fillStyle = '#6b4526'; g.fillRect(0, 0, S, S); g.fillStyle = '#8a5c34'; g.fillRect(2, 0, S - 4, S);
    g.fillStyle = '#c9a24a'; g.fillRect(S * 0.45, S * 0.45, S * 0.1, S * 0.1);
    return;
  }
  if(kind === 'shadeN'){
    const gr = g.createLinearGradient(0, 0, 0, S * 0.42); gr.addColorStop(0, 'rgba(14,20,4,.48)'); gr.addColorStop(1, 'rgba(14,20,4,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S * 0.42);
    return;
  }
  if(kind === 'shadeW'){ g.fillStyle = 'rgba(14,20,4,.22)'; g.fillRect(0, 0, S * 0.12, S); return; }
  if(kind === 'tree'){
    const Z = S * 2;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(Z * 0.5, Z * 0.86, Z * 0.32, Z * 0.1, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#4a3420'; g.fillRect(Z * 0.45, Z * 0.5, Z * 0.1, Z * 0.36);
    const cols = n ? ['#3b4a20', '#4a5c27', '#5b6e30'] : ['#404f22', '#506229', '#627633'];   // (3.95) olive, as the forest's
    for(let k = 0; k < 6; k++){
      g.fillStyle = cols[k % 3];
      g.beginPath(); g.arc(Z * (0.28 + 0.44 * h(k + 80)), Z * (0.2 + 0.32 * h(k + 90)), Z * (0.16 + 0.07 * h(k + 99)), 0, Math.PI * 2); g.fill();
    }
  }
}

/* (3.96) The tribes' mounds: the grass of each (fresher by the Grass tribe,
   bluer by the Water's, yellower by the Earth's and the Fire's) and its
   flowers. */
const JG_MOUND = {
  grass:{ top:'#93c95c', mid:'#5f9a3c', low:'#365f22', blade:['#b2df7e', '#4b8231'], flowers:['#f4a9c8', '#fff4dc', '#f6d76a', '#e98bb5'], pennant:'#5fb04a' },
  water:{ top:'#8fc99a', mid:'#579a72', low:'#2f5e4a', blade:['#b0e0b9', '#3c7a5e'], flowers:['#8fd0f2', '#ffffff', '#c3a6ef', '#6fb5e8'], pennant:'#3f8fd0' },
  earth:{ top:'#b1bf66', mid:'#7a8f3e', low:'#4a5a23', blade:['#cfd889', '#5e722d'], flowers:['#f6d76a', '#f2a457', '#fbeccc', '#e2b65a'], pennant:'#c98a3a' },
  fire: { top:'#bcc15e', mid:'#879038', low:'#545a20', blade:['#dadc84', '#6b772b'], flowers:['#f0573c', '#f7a03c', '#ffd85c', '#ff7a59'], pennant:'#e0502c' },
};
function jgDrawMound(g, tk, tw, th, n, S){
  const M = JG_MOUND[tk] || JG_MOUND.grass, Wd = tw * S, Ht = th * S, lodge = n === 2;
  const h = k=> jgHash(tw * 31 + th * 7 + n * 101, (tk.charCodeAt(0) || 0) * 13 + k, 77);
  const by = Ht * 0.94, x0 = Wd * 0.03, x1 = Wd * 0.97, top = Ht * (lodge ? 0.07 : 0.1);
  const dome = ()=>{
    g.beginPath(); g.moveTo(x0, by);
    g.bezierCurveTo(x0 - Wd * 0.01, Ht * 0.36, Wd * 0.2, top, Wd * 0.5, top);
    g.bezierCurveTo(Wd * 0.8, top, x1 + Wd * 0.01, Ht * 0.36, x1, by);
    g.closePath();
  };
  /* its shadow on the green */
  g.fillStyle = 'rgba(10,24,6,.3)'; g.beginPath(); g.ellipse(Wd * 0.5, by, Wd * 0.5, Ht * 0.075, 0, 0, Math.PI * 2); g.fill();
  /* the mound: sunlit up and to the left, in shade low down and to the right */
  const gr = g.createLinearGradient(Wd * 0.28, top, Wd * 0.62, by);
  gr.addColorStop(0, M.top); gr.addColorStop(0.55, M.mid); gr.addColorStop(1, M.low);
  g.fillStyle = gr; dome(); g.fill();
  g.save(); dome(); g.clip();
  /* grass, blade by blade */
  g.lineCap = 'round'; g.lineWidth = Math.max(1, S / 24);
  const blades = Math.round(tw * th * 30);
  for(let k = 0; k < blades; k++){
    const bx = h(k) * Wd, bb = top + h(k + 500) * (by - top) * 1.02, lean = (h(k + 300) - 0.5) * S * 0.07;
    g.strokeStyle = M.blade[k % 2]; g.globalAlpha = 0.3 + 0.4 * h(k + 900);
    g.beginPath(); g.moveTo(bx, bb); g.quadraticCurveTo(bx + lean * 0.4, bb - S * 0.06, bx + lean, bb - S * (0.1 + 0.06 * h(k + 400))); g.stroke();
  }
  g.globalAlpha = 1;
  /* a soft light on its crown, shade along its foot */
  const hi = g.createRadialGradient(Wd * 0.38, top + Ht * 0.18, 0, Wd * 0.38, top + Ht * 0.18, Wd * 0.42);
  hi.addColorStop(0, 'rgba(255,250,200,.22)'); hi.addColorStop(1, 'rgba(255,250,200,0)');
  g.fillStyle = hi; g.fillRect(0, 0, Wd, Ht);
  const sh = g.createLinearGradient(0, by - Ht * 0.28, 0, by);
  sh.addColorStop(0, 'rgba(8,22,4,0)'); sh.addColorStop(1, 'rgba(8,22,4,.38)');
  g.fillStyle = sh; g.fillRect(0, by - Ht * 0.28, Wd, Ht * 0.28);
  g.restore();
  /* tufts standing out of its outline */
  g.strokeStyle = M.low; g.lineWidth = Math.max(1, S / 22);
  for(let k = 0; k < tw * 9; k++){
    const t = k / (tw * 9), a = Math.PI * (1 - t);
    const ex = Wd * 0.5 + Math.cos(a) * (x1 - x0) * 0.5, ey = by - Math.sin(a) * (by - top) * (0.94 + 0.06 * Math.sin(a));
    if(ey > by - S * 0.15) continue;
    const ox = Math.cos(a), oy = -Math.sin(a), L = S * (0.07 + 0.05 * h(k + 700));
    g.globalAlpha = 0.7;
    g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + ox * L + (h(k + 800) - 0.5) * S * 0.05, ey + oy * L); g.stroke();
  }
  g.globalAlpha = 1;
  /* the round door, in a frame of wood; a garland of flowers over it */
  const dw = S * (lodge ? 1.3 : 1.02), dh = S * (lodge ? 1.55 : 1.22), dcx = Wd * 0.5, dyb = by - S * 0.01, fr = S * 0.1;
  const arch = (w, hh, grow)=>{ const r = w / 2 + grow; g.beginPath(); g.moveTo(dcx - r, dyb); g.lineTo(dcx - r, dyb - hh + w / 2); g.arc(dcx, dyb - hh + w / 2, r, Math.PI, 0); g.lineTo(dcx + r, dyb); g.closePath(); };
  g.fillStyle = '#8a5f36'; arch(dw, dh, fr); g.fill();
  g.fillStyle = '#5a3a1e'; arch(dw, dh, 0); g.fill();
  g.save(); arch(dw, dh, 0); g.clip();
  g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = Math.max(1, S / 30);
  for(let k = 1; k < 4; k++){ const xx = dcx - dw / 2 + k * dw / 4; g.beginPath(); g.moveTo(xx, dyb - dh); g.lineTo(xx, dyb); g.stroke(); }
  g.restore();
  g.fillStyle = '#e8c35a'; g.beginPath(); g.arc(dcx + dw * 0.26, dyb - dh * 0.42, S * 0.055, 0, Math.PI * 2); g.fill();
  const flower = (fx, fy, r, col)=>{
    g.fillStyle = col;
    for(let p = 0; p < 5; p++){ const a = p / 5 * Math.PI * 2 + fx * 0.7; g.beginPath(); g.arc(fx + Math.cos(a) * r * 0.85, fy + Math.sin(a) * r * 0.85, r * 0.6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(fx, fy, r * 0.45, 0, Math.PI * 2); g.fill();
  };
  const gr2 = dw / 2 + fr * 1.4;
  for(let k = 0; k <= 8; k++){                                       // the garland round the arch
    const a = Math.PI * (1 - k / 8);
    flower(dcx + Math.cos(a) * gr2, dyb - dh + dw / 2 - Math.sin(a) * gr2, S * 0.075, M.flowers[k % M.flowers.length]);
  }
  /* a little round window, lamplit (the huts); lanterns either side of the door (the lodge) */
  if(!lodge){
    const wx = Wd * (n ? 0.78 : 0.22), wy = by - Ht * 0.42, wr = S * 0.22;
    g.fillStyle = '#8a5f36'; g.beginPath(); g.arc(wx, wy, wr + S * 0.06, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffe7a3'; g.beginPath(); g.arc(wx, wy, wr, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#8a5f36'; g.lineWidth = Math.max(1, S / 24);
    g.beginPath(); g.moveTo(wx - wr, wy); g.lineTo(wx + wr, wy); g.moveTo(wx, wy - wr); g.lineTo(wx, wy + wr); g.stroke();
  } else {
    [-1, 1].forEach(sd=>{
      const lx = dcx + sd * (dw / 2 + S * 0.45), ly = dyb - S * 0.75;
      const glow = g.createRadialGradient(lx, ly, 0, lx, ly, S * 0.5);
      glow.addColorStop(0, 'rgba(255,214,110,.55)'); glow.addColorStop(1, 'rgba(255,214,110,0)');
      g.fillStyle = glow; g.fillRect(lx - S * 0.5, ly - S * 0.5, S, S);
      g.fillStyle = '#5a3a1e'; g.fillRect(lx - S * 0.03, ly, S * 0.06, S * 0.7);
      g.fillStyle = '#ffd36a'; g.beginPath(); g.ellipse(lx, ly, S * 0.12, S * 0.15, 0, 0, Math.PI * 2); g.fill();
    });
    /* the tribe's pennant, on a pole from its crown */
    const px = Wd * 0.5, py = top + S * 0.05;
    g.strokeStyle = '#5a3a1e'; g.lineWidth = Math.max(2, S / 14);
    g.beginPath(); g.moveTo(px, py + S * 0.1); g.lineTo(px, py - S * 0.75); g.stroke();
    g.fillStyle = M.pennant; g.beginPath(); g.moveTo(px, py - S * 0.75); g.lineTo(px + S * 0.6, py - S * 0.58); g.lineTo(px, py - S * 0.4); g.closePath(); g.fill();
  }
  /* and flowers all over it, in clumps, thickest round its crown */
  const clumps = Math.round(tw * th * (lodge ? 1.5 : 1.25));
  for(let c = 0; c < clumps; c++){
    let cx = 0, cy = 0, tries = 0;
    do {
      cx = Wd * (0.1 + 0.8 * h(c * 7 + tries + 1000));
      const crown = h(c * 11 + tries + 2000) < 0.55;
      cy = crown ? top + (by - top) * (0.08 + 0.3 * h(c + tries + 3000)) : top + (by - top) * (0.2 + 0.62 * h(c + tries + 3000));
      dome(); tries++;
    } while(tries < 12 && (!g.isPointInPath(cx, cy) || (Math.abs(cx - dcx) < dw * 0.9 && cy > dyb - dh - S * 0.35)));
    if(tries >= 12) continue;
    const k = 2 + Math.floor(h(c + 4000) * 4);
    for(let f = 0; f < k; f++){
      const fx = cx + (h(c * 5 + f + 5000) - 0.5) * S * 0.5, fy = cy + (h(c * 5 + f + 6000) - 0.5) * S * 0.32;
      dome(); if(!g.isPointInPath(fx, fy)) continue;
      flower(fx, fy, S * (0.05 + 0.025 * h(c + f + 7000)), M.flowers[(c + f) % M.flowers.length]);
    }
  }
}

/* ---------- the bands on the map: only those near you are drawn, and only those nearer still move ---------- */
function jgShowBands(){
  const world = $('#walkWorld'), w = walkState(), p = w.at && w.at[JG_KEY];
  if(!world || !p || ui.screen !== JG_KEY) return;
  const all = jgBands();
  /* (3.95) a new day while you walk: new bands in new places — yesterday's pictures go */
  if(ui.jgBandEls && ui.jgBandDay !== _jgBandsDay){ Object.values(ui.jgBandEls).forEach(el=> el.remove()); ui.jgBandEls = {}; }
  ui.jgBandDay = _jgBandsDay;
  const els = ui.jgBandEls || (ui.jgBandEls = {});
  const R = 15;
  all.forEach(b=>{
    const near = Math.abs(b.x - p.x) <= R && Math.abs(b.y - p.y) <= R && !jgBandBeaten(b);
    let el = els[b.id];
    if(near && !el){
      el = document.createElement('div');
      el.className = 'walk-ent jg-band jg-' + b.rank;
      el.id = 'jgBand-' + b.id;
      el.innerHTML = `<div class="jg-cone"></div><div class="jg-alien-art">${jgMonImg(b.lead, WALK_T * (b.rank === 'alien' ? 1.35 : 1.6))}</div><b class="jg-mark">!</b>`;
      world.appendChild(el);
      els[b.id] = el;
      jgBandPlace(b);
      if(jgBandStunned(b)) jgZapStart(b, false);                       // (4.03) still paralysed as it comes back into view
    } else if(!near && el){ el.remove(); delete els[b.id]; }
  });
}
const JG_DIR = { l:[-1, 0], r:[1, 0], u:[0, -1], d:[0, 1] };
/* how far it sees: up to four squares straight ahead, stopped by hedge and wall */
function jgSight(b){
  const [dx, dy] = JG_DIR[b.face];
  let n = 0;
  for(let k = 1; k <= JG.aliens.sight; k++){ if(jgSolidAt(b.x + dx * k, b.y + dy * k)) break; n = k; }
  return n;
}
function jgBandPlace(b){
  const el = ui.jgBandEls && ui.jgBandEls[b.id];
  if(!el) return;
  const T = WALK_T;
  el.style.transform = `translate3d(${b.x * T}px,${b.y * T}px,0)`;
  el.style.zIndex = 10 + b.y;
  faceRight(el.querySelector('.jg-alien-art'), b.face === 'r');
  const cone = el.querySelector('.jg-cone'), n = jgSight(b), [dx, dy] = JG_DIR[b.face];
  if(cone){
    cone.style.display = n && !jgBandStunned(b) && !b._pounced ? '' : 'none';   // (4.03) no sight while paralysed
    cone.style.left = (dx > 0 ? T : dx < 0 ? -n * T : 0) + 'px';
    cone.style.top = (dy > 0 ? T : dy < 0 ? -n * T : 0) + 'px';
    cone.style.width = (dx ? n * T : T) + 'px';
    cone.style.height = (dy ? n * T : T) + 'px';
    cone.dataset.face = b.face;
  }
}

/* ============================================================
   (3.96) THE VILLAGES' OWN PEOPLE
   The designer: "the villages are sad and empty. Please fill them with
   fairies either walking, or facing each other in conversation, or
   pottering in a small perimeter outside their houses." Sixteen in each
   village, of its own tribe: five out walking on the green, three pairs
   chatting face to face (a word bubble each, in turn), and five about
   their own front doors (now and then popping inside a moment). Made from
   the jungle's seed, so each starts where it always starts; they move only
   while you are near, on the bands' clock, and stop to look at you when you
   come up beside them. The walkers keep out of the gates, the guardian's
   ground and where you arrive. While the war is at their village they stay
   indoors.
   ============================================================ */
const JG_VILLAGE_FOLK = { grass:['grass_fairy', 'grass_fairy1', 'grass_sprite'], water:['water_fairy', 'water_fairy1', 'water_sprite'],
                          earth:['earth_fairy', 'earth_sprite'], fire:['fire_sprite', 'bonedancer'] };
/* each picture (96 × 96): how tall what is drawn in it is, its middle across, where its feet are — then how tall to show it, in squares */
const JG_FOLK_LOOK = {
  water_fairy:[0.39, 0.49, 0.69, 0.78], water_fairy1:[0.40, 0.50, 0.70, 0.86], water_sprite:[0.32, 0.50, 0.66, 0.7],
  grass_fairy:[0.32, 0.45, 0.67, 0.7], grass_fairy1:[0.54, 0.47, 0.77, 0.92], grass_sprite:[0.54, 0.51, 0.77, 0.88],
  earth_fairy:[0.42, 0.50, 0.71, 0.8], earth_sprite:[0.40, 0.58, 0.70, 0.78],
  fire_sprite:[0.52, 0.50, 0.76, 0.86], bonedancer:[0.73, 0.50, 0.86, 1.0],
};
const JG_FOLK_PLAN = { walk:5, chat:3, potter:5, near:14 };
const JG_FOLK_SAY = ['…', '♪', '!', '?', '✿', 'ha!', '♥', '…!'];
const JG_FOLK_LINES = {
  grass:[
    `<b>"Hello! Mind the moss — it's ticklish."</b>`,
    `<b>"Our mounds grow a new flower every morning. I've named this one Bob."</b>`,
    `<b>"The Guardian can hear the grass growing. Shh… can you?"</b>`,
    `<b>"The invaders carried off my cousin. If you see fairies with an alien band, set them free!"</b>`,
    `<b>"Lucesco! I've never seen a lion up close. Is his mane really fire?"</b>`],
  water:[
    `<b>"Splish! Come to see the lakes? The water's lovely today."</b>`,
    `<b>"Before the sky tore, our lakes were as still as glass."</b>`,
    `<b>"The Guardian can hear one raindrop land on the far side of the jungle."</b>`,
    `<b>"If you find our people with the aliens, bring them home, won't you?"</b>`,
    `<b>"I'm practising my bubbles. This one's nearly as big as my head!"</b>`],
  earth:[
    `<b>"Careful — I've only just swept this path."</b>`,
    `<b>"Our mounds stay cool in the sun and snug in the rain. Clever, aren't they?"</b>`,
    `<b>"I'm counting pebbles. Two hundred and… oh! I've lost count again."</b>`,
    `<b>"The Guardian never sleeps. Well — maybe a little nap at noon."</b>`,
    `<b>"The aliens took my brother. You'll free him, won't you?"</b>`],
  fire:[
    `<b>"Warm day, isn't it? Every day is warm here!"</b>`,
    `<b>"The bonedancers dance all night. My feet hurt just from watching."</b>`,
    `<b>"Don't worry — our lanterns never singe the grass."</b>`,
    `<b>"The invaders don't like our fire one bit. Good!"</b>`,
    `<b>"Is that lion made of fire too? We could be cousins!"</b>`],
};
let _jgFolk = null, _jgFolkKeep = {}, _jgFolkBy = {};
function jgFolkAll(){
  if(_jgFolk) return _jgFolk;
  const P = jgGround().places, list = [];
  const finds = new Set(jgFinds().map(([x, y])=> x + ',' + y));
  JG_TRIBE_KEYS.forEach((k, ti)=>{
    const V = P.villages[k], L = V.lodge, R = jgRng((JG.seed ^ (0x5f01 + ti * 7919)) >>> 0), ri = n=> Math.floor(R() * n);
    const kinds = JG_VILLAGE_FOLK[k], pick = ()=> kinds[ri(kinds.length)];
    const key = (x, y)=> x + ',' + y, keep = new Set(), used = new Set();
    const hold = (x0, y0, x1, y1)=>{ for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++) keep.add(key(x, y)); };
    hold(L.x - 1, L.y + L.h, L.x + L.w, L.y + L.h + 3);                                  // before the lodge: its guardian, where you arrive
    P.gates.forEach(g=>{ if(Math.hypot(g.x - V.cx, g.y - V.cy) < Math.max(V.rx, V.ry) + 4) hold(g.x - 2, g.y - 2, g.x + 2, g.y + 2); });   // the ways in
    if(typeof warSpots === 'function'){ const S = warSpots(k); [S.king, S.anc].concat(S.guards).forEach(q=> hold(q.x - 1, q.y - 1, q.x + 1, q.y + 1)); }
    if(typeof warBands === 'function') warBands(k).forEach(b=> hold(Math.min(b.x, b.knight.x) - 1, b.y - 1, Math.max(b.x, b.knight.x) + 1, b.y + 1));
    const open = (x, y)=> jgVillageAt(x, y) === k && jgTile(x, y) === JG_T.VILLAGE && !keep.has(key(x, y)) && !used.has(key(x, y)) && !finds.has(key(x, y));
    const roomy = (x, y)=> [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy])=> !used.has(key(x + dx, y + dy)));
    const add = f=>{ f.id = 'f' + k + list.length; f.tribe = k; f.x0 = f.x; f.y0 = f.y; list.push(f); used.add(key(f.x, f.y)); _jgFolkBy[f.id] = f; return f; };
    /* about their own doors: one each at five of the eight huts (the first five with room before the door) */
    const huts = V.huts.slice();
    for(let i = huts.length - 1; i > 0; i--){ const j = ri(i + 1); const t = huts[i]; huts[i] = huts[j]; huts[j] = t; }
    let potters = 0;
    huts.forEach(h=>{
      if(potters >= JG_FOLK_PLAN.potter) return;
      const a = h.x + (h.w >> 1) - 1 + ri(2), dy = h.y + h.h;                             // before its round door (either half of it)
      const dx = open(a, dy) ? a : open(h.x + h.w - 1 - (a - h.x), dy) ? h.x + h.w - 1 - (a - h.x) : null;
      if(dx == null) return;
      add({ kind:'potter', sprite:pick(), x:dx, y:dy, faceR:R() < 0.5, door:{ x:dx, y:dy }, box:{ x0:h.x - 1, y0:h.y - 1, x1:h.x + h.w, y1:h.y + h.h + 1 } });
      potters++;
    });
    /* pairs talking, side by side on the green, facing each other */
    const doorFront = (x, y)=> V.huts.concat([L]).some(h=> y >= h.y + h.h && y <= h.y + h.h + 1 && x >= h.x - 1 && x <= h.x + h.w);
    for(let n = 0, tries = 0; n < JG_FOLK_PLAN.chat && tries < 600; tries++){
      const a = R() * Math.PI * 2, rr = 0.3 + 0.5 * R();
      const x = Math.round(V.cx + Math.cos(a) * V.rx * rr), y = Math.round(V.cy + Math.sin(a) * V.ry * rr);
      if(!open(x, y) || !open(x + 1, y) || !roomy(x, y) || !roomy(x + 1, y) || doorFront(x, y) || doorFront(x + 1, y)) continue;
      const one = add({ kind:'chat', sprite:pick(), x, y, faceR:true }), two = add({ kind:'chat', sprite:pick(), x:x + 1, y, faceR:false });
      one.mate = two.id; two.mate = one.id; one.lead = true; n++;
    }
    /* out walking: anywhere on the green */
    for(let n = 0, tries = 0; n < JG_FOLK_PLAN.walk && tries < 600; tries++){
      const a = R() * Math.PI * 2, rr = 0.15 + 0.75 * R();
      const x = Math.round(V.cx + Math.cos(a) * V.rx * rr), y = Math.round(V.cy + Math.sin(a) * V.ry * rr);
      if(!open(x, y) || !roomy(x, y)) continue;
      add({ kind:'walk', sprite:pick(), x, y, faceR:R() < 0.5 }); n++;
    }
    _jgFolkKeep[k] = keep;
  });
  _jgFolk = list;
  return list;
}
function jgFolkAway(f){ return typeof warStage === 'function' && warStage() === f.tribe; }   // the war is at their village: indoors
function jgFolkHere(f){ return !f.inside && !jgFolkAway(f); }
/* somebody of a village standing on (x, y) — `but` not counted */
function jgFolkAt(x, y, but){
  const k = jgVillageAt(x, y);
  if(!k) return false;
  return jgFolkAll().some(f=> f !== but && f.tribe === k && f.x === x && f.y === y && jgFolkHere(f));
}
function jgFolkName(id){ const f = JG_FOLK[id] || JG_FOLK[String(id).replace(/1$/, '')]; return f ? f.name : 'Fairy'; }
function jgFolkImg(id){
  const L = JG_FOLK_LOOK[id] || [0.5, 0.5, 0.75, 0.7], T = WALK_T;
  const px = Math.round(T * L[3] / L[0]);                          // the picture, so that what is in it stands L[3] squares tall
  const bottom = Math.round(-(1 - L[2]) * px + T * 0.04);          // its feet on the square's bottom edge
  return `<img class="jg-folk-art" src="assets/mon/${id}_front.png" alt="" style="width:${px}px;height:${px}px;bottom:${bottom}px;` +
    `translate:${(-L[1] * 100).toFixed(1)}% 0;transform-origin:${(L[1] * 100).toFixed(1)}% 50%;" onerror="this.style.display='none'">`;
}
/* only those near you are drawn (as the bands are) */
function jgShowFolk(){
  const world = $('#walkWorld'), w = walkState(), p = w.at && w.at[JG_KEY];
  if(!world || !p || ui.screen !== JG_KEY) return;
  const els = ui.jgFolkEls || (ui.jgFolkEls = {}), R = JG_FOLK_PLAN.near;
  jgFolkAll().forEach(f=>{
    const show = !jgFolkAway(f) && Math.abs(f.x - p.x) <= R && Math.abs(f.y - p.y) <= R;
    let el = els[f.id];
    if(!show){ if(el){ el.remove(); delete els[f.id]; } return; }
    if(el && el.isConnected) return;
    el = document.createElement('div');
    el.className = 'walk-ent jg-folk jg-folk-' + f.kind + ' jg-fresh';
    el.style.setProperty('--fd', (-(jgHash(f.x0, f.y0, 9) * 2.4)).toFixed(2) + 's');   // its hover, out of step with the rest
    const L = JG_FOLK_LOOK[f.sprite] || [0.5, 0.5, 0.75, 0.7];
    el.innerHTML = jgFolkImg(f.sprite) + (f.kind === 'chat' ? `<i class="jg-say ${f.faceR ? 'r' : 'l'}" style="bottom:${Math.round(WALK_T * (L[3] + 0.1))}px"></i>` : '');
    world.appendChild(el); els[f.id] = el;
    jgFolkPlace(f);
    requestAnimationFrame(()=> requestAnimationFrame(()=> el.classList.remove('jg-fresh')));
  });
}
function jgFolkPlace(f){
  const el = ui.jgFolkEls && ui.jgFolkEls[f.id];
  if(!el) return;
  el.style.transform = `translate3d(${f.x * WALK_T}px,${f.y * WALK_T}px,0)`;
  el.style.zIndex = 10 + f.y;
  faceRight(el, !!f.faceR);
  el.classList.toggle('jg-in', !!f.inside);
}
function jgFolkFree(f, x, y, p, lion){
  if(f.kind === 'potter'){ const b = f.box; if(x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) return false; }
  if(jgVillageAt(x, y) !== f.tribe || jgTile(x, y) !== JG_T.VILLAGE || jgSolidAt(x, y)) return false;   // (3.99) nor onto its barricade
  if(f.kind === 'walk' && _jgFolkKeep[f.tribe] && _jgFolkKeep[f.tribe].has(x + ',' + y)) return false;
  if((p && p.x === x && p.y === y) || (lion && lion.x === x && lion.y === y)) return false;
  if(jgFolkAt(x, y, f) || wBlockedBy(JG_DECK, x, y) || jgFindAt(x, y)) return false;   // (the finds stay in sight)
  return true;
}
/* their clock (the bands', jgTickOnce): a step, a look about, a word */
function jgFolkTick(p){
  const els = ui.jgFolkEls || {}, lion = ui.jgLion;
  jgFolkAll().forEach(f=>{
    const el = els[f.id];
    if(!el) return;                                                // not near you: it waits where it is
    if(f.kind === 'chat'){ if(f.lead) jgFolkChat(f, els); return; }
    if(f.inside){                                                  // indoors a moment, then out of its door again
      if(--f.inside > 0) return;
      if(jgFolkFree(f, f.door.x, f.door.y, p, lion)){ f.x = f.door.x; f.y = f.door.y; f.inside = 0; jgFolkPlace(f); }
      else f.inside = 1;
      return;
    }
    const dx = p.x - f.x, dy = p.y - f.y;
    if(Math.abs(dx) + Math.abs(dy) === 1){ if(dx) f.faceR = dx > 0; jgFolkPlace(f); return; }   // you, beside it: it stops and looks at you
    const r = Math.random();
    if(f.kind === 'potter' && f.x === f.door.x && f.y === f.door.y && r < 0.07){ f.inside = 4 + Math.floor(Math.random() * 6); jgFolkPlace(f); return; }
    if(r > (f.kind === 'walk' ? 0.55 : 0.32)){ if(r > 0.94){ f.faceR = !f.faceR; jgFolkPlace(f); } return; }   // stands a moment, now and then turning about
    const dirs = Object.keys(JG_DIR).filter(d=> jgFolkFree(f, f.x + JG_DIR[d][0], f.y + JG_DIR[d][1], p, lion));
    if(!dirs.length) return;
    const go = f.kind === 'walk' && f.last && dirs.includes(f.last) && Math.random() < 0.7 ? f.last : dirs[Math.floor(Math.random() * dirs.length)];
    f.last = go;
    const [mx, my] = JG_DIR[go];
    f.x += mx; f.y += my;
    if(mx) f.faceR = mx > 0;
    jgFolkPlace(f);
    el.classList.remove('jg-step'); void el.offsetWidth; el.classList.add('jg-step');
  });
}
/* a pair talking: one, then the other, a word bubble over whoever speaks; now and then a quiet moment */
function jgFolkChat(f, els){
  const m = _jgFolkBy[f.mate];
  if(!m) return;
  f.t = (f.t || 0) + 1;
  if(f.t < (f.next || 0)) return;
  f.t = 0;
  const quiet = f.speaker && Math.random() < 0.25;
  f.speaker = quiet ? null : (f.speaker === f.id ? m.id : f.id);
  f.next = quiet ? 2 : 3 + Math.floor(Math.random() * 4);
  [f, m].forEach(x=>{
    const e = els[x.id];
    if(!e) return;
    const on = f.speaker === x.id;
    e.classList.toggle('talking', on);
    if(on){ const b = e.querySelector('.jg-say'); if(b) b.textContent = JG_FOLK_SAY[Math.floor(Math.random() * JG_FOLK_SAY.length)]; }
  });
}
function jgFolkNear(p){
  const els = ui.jgFolkEls || {};
  return jgFolkAll().find(f=> els[f.id] && jgFolkHere(f) && Math.abs(f.x - p.x) + Math.abs(f.y - p.y) === 1) || null;
}
function jgFolkTalk(f){
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(p && p.x !== f.x){ f.faceR = p.x > f.x; jgFolkPlace(f); }
  const j = jgState(), key = 'folk_' + f.tribe, lines = JG_FOLK_LINES[f.tribe] || JG_FOLK_LINES.grass;
  j.talk[key] = (j.talk[key] || 0) + 1;
  return jgLines([jgFace(f.sprite + '_front')], jgFolkName(f.sprite), [lines[(j.talk[key] - 1) % lines.length]]);
}

/* ============================================================
   (3.96) FINDS: 100 of them, 10 Skill Tokens each
   The designer: "could you randomly but evenly distribute 100 finds of 10
   tickets across the 90000 squares on the spaces that are walkable and
   reachable? Make all of these do a subtle twinkle occasionally … All
   outside the fairy king castle perimeters but inside villages is fine."
   One in each block of 30 × 30 squares, on an open square of it chosen at
   random, at least 12 steps from the others where it can be; the four
   blocks inside the castle's ring give theirs to the roomiest. From the
   jungle's seed: the same for everyone, always (every open square of the
   jungle can be reached, 3.95). They are the deck's prizes (13-walkmap.js:
   checkPrize, takePrize), kept in r6().found.r6_jungle, and only those near
   you are drawn — a glint now and then (walkTwinkleEl).
   ============================================================ */
const JG_FINDS = { n:100, grid:10, apart:12, near:13 };
let _jgFinds = null, _jgFindIx = null;
function jgFinds(){
  if(_jgFinds) return _jgFinds;
  const G = jgGround(), { W, H, places, g } = G, R = jgRng((JG.seed ^ 0x71c4e7) >>> 0);
  const rd = places.castle.road, E = places.entry, avoid = new Set();
  jgThings().forEach(t=>{ for(let y = t.y - 1; y <= t.y + (t.h || 1); y++) for(let x = t.x - 1; x <= t.x + (t.w || 1); x++) avoid.add(y * W + x); });   // where somebody stands, or something is
  Object.values(places.villages).forEach(v=>{ for(let y = v.stand.y - 1; y <= v.stand.y + 1; y++) for(let x = v.stand.x - 1; x <= v.stand.x + 1; x++) avoid.add(y * W + x); });
  const ok = v=>{
    const x = v % W, y = (v - x) / W;
    /* (4.02) as the jungle was before its lakes were made round, so every find stays where it was (jgLakeWaterOld) */
    const t = g[v] === JG_T.WATER || g[v] === JG_T.SHORE ? (jgLakeWaterOld(x, y) ? JG_T.WATER : JG_T.SHORE) : g[v];
    if(JG_SOLID[t] || t === JG_T.ROAD || t === JG_T.ENTRY || avoid.has(v)) return false;
    if(x >= rd.x - 1 && x <= rd.x + rd.w && y >= rd.y - 1 && y <= rd.y + rd.h) return false;   // the castle and the road round it
    if(x >= E.x - 3 && y >= E.y - 3 && y <= E.y + E.h + 3) return false;                       // the way in
    return true;
  };
  const C = JG_FINDS.grid, cw = W / C, ch = H / C, cells = [];
  for(let cy = 0; cy < C; cy++) for(let cx = 0; cx < C; cx++){
    const list = [];
    for(let y = Math.floor(cy * ch); y < Math.floor((cy + 1) * ch); y++) for(let x = Math.floor(cx * cw); x < Math.floor((cx + 1) * cw); x++){ const v = y * W + x; if(ok(v)) list.push(v); }
    cells.push(list);
  }
  const picks = [];
  const apart = v=> picks.every(u=> Math.abs(u % W - v % W) + Math.abs(Math.floor(u / W) - Math.floor(v / W)) >= JG_FINDS.apart);
  const place = list=>{ for(let t = 0; t < 60; t++){ const v = list[Math.floor(R() * list.length)]; if(apart(v) || t === 59){ picks.push(v); return; } } };
  let spare = 0;
  cells.forEach(list=>{ if(list.length) place(list); else spare++; });
  const roomiest = cells.filter(l=> l.length).sort((a, b)=> b.length - a.length);
  for(let s = 0; s < spare && roomiest.length; s++) place(roomiest[s % roomiest.length]);
  /* (4.02) …and one that the rounder lake now covers steps out of the water to the nearest square one can stand on */
  const dry = v=>{
    if(!JG_SOLID[g[v]]) return v;
    const seen = new Set([v]), q = [v];
    for(let h = 0; h < q.length; h++){
      const u = q[h], x = u % W;
      for(const w of [u - W, u + W, x > 0 ? u - 1 : -1, x < W - 1 ? u + 1 : -1]){
        if(w < 0 || w >= W * H || seen.has(w)) continue;
        if(!JG_SOLID[g[w]]) return w;
        seen.add(w); q.push(w);
      }
    }
    return v;
  };
  _jgFinds = picks.slice(0, JG_FINDS.n).map(dry).map(v=> [v % W, Math.floor(v / W)]);
  _jgFindIx = new Map(_jgFinds.map(([x, y], i)=> [y * W + x, i]));
  return _jgFinds;
}
/* an untaken find on (x, y)? */
function jgFindAt(x, y){
  jgFinds();
  const i = _jgFindIx.get(y * JG.W + x);
  return i != null && !(typeof prizeTaken === 'function' && prizeTaken(JG_KEY, i));
}
function jgShowFinds(){
  const world = $('#walkWorld'), w = walkState(), p = w.at && w.at[JG_KEY];
  if(!world || !p || ui.screen !== JG_KEY || typeof walkTwinkleEl !== 'function') return;
  const els = ui.jgFindEls || (ui.jgFindEls = {}), R = JG_FINDS.near;
  jgFinds().forEach(([x, y], i)=>{
    const show = Math.abs(x - p.x) <= R && Math.abs(y - p.y) <= R && !prizeTaken(JG_KEY, i);
    let el = els[i];
    if(!show){ if(el){ el.remove(); delete els[i]; } return; }
    if(el && el.isConnected) return;
    el = walkTwinkleEl(x, y, i);
    world.appendChild(el); els[i] = el;
  });
}
const JG_FIND_LINES = [
  `Something glints in the grass.`,
  `Oh, what's this?`,
  `Lucesco sniffs at something shiny.`,
  `Hold on — look!`,
  `Lucky!`,
  `A fairy must have dropped this.`,
  `Tucked under a leaf…`,
  `Well, well.`,
];

/* ============================================================
   (3.96) LUCESCO'S LEAP
   The designer: "giving him a jump ability that allows him to carry the
   player over a single wall in the maze. Double walls not possible …
   animate by cutting each different player sprite's legs and placing them
   in the right position over his sprite to let him jump with the player …
   This ability will have a cooldown based on the number of steps taken,
   maybe every 50 steps?" Face a wall of trees one tree thick with open
   ground beyond it and his button says Jump: you ride him over (your
   picture from the waist up, on his back), and land beyond. Then 50 steps
   before he can again (jgState().jumpIn, counted down by jgStep). Only the
   forest's trees: not water, a hut, the castle's walls, or two trees deep.
   ============================================================ */
const JG_JUMP = { steps:50, ms:900, high:1.05 };
/* how much of each picture is legs — what is cut away as you sit on him (the rest: 44%).
   (4.03) All ten looked at on his back, now that you ride him everywhere: the two smallest (m5, f5) stand low in their
   squares and showed little more than a head, so they are cut at the waist; m3's raised boot stuck out in front of
   you, so his cut goes round it (JG_RIDE_CLIP, a polygon in percent of his picture). */
const JG_RIDE_CUT = { m2:0.42, m3:0.55, m5:0.36, f2:0.45, f5:0.36 };
const JG_RIDE_CLIP = { m3:'0 0, 100% 0, 100% 45%, 34% 45%, 34% 27%, 0 27%' };
/* (4.05) The designer: "i actually propose not truncating the player sprite but instead cutting out one leg of the player
   where appropriate to intimate that that leg has gone behind lucesco's torso, and rely on the mane to partly obscure
   and make the cut part look less obvious. there can be a fade in over the cut part". So the whole picture sits on his
   back — the row that was the cut (JG_RIDE_SEAT, of the picture's 80) on his back, as before — and the leg on the
   mane's side is cut away with a soft edge (JG_RIDE_LEG: a polygon in the picture's 80 × 80); the other hangs down his
   side. And: "the girls' ones need a bit of work with placement, f1 and f2's upper bodies might need shifting to the left
   and up, f4 and f5 can be higher too" (JG_RIDE_X: px of 80 to the left; their seats 4 rows lower, so they sit 4 higher);
   "m5 is troublesome because he's looking over his back … shall we flip his sprite?" (JG_RIDE_FLIP). Over the rider, his
   head and mane (JG_MANE: a polygon of his picture), through which the rider shows faintly. */
const JG_RIDE_SEAT = { m1:44.8, m2:46.4, m3:36, m4:44.8, m5:51.2, f1:48.8, f2:48, f3:44.8, f4:48.8, f5:56 };
const JG_RIDE_X = { f1:-6, f2:-3 };
const JG_RIDE_FLIP = { m5:true };
const JG_RIDE_LEG = {
  m1:'18,52 35.5,52 35.5,80 18,80',
  m2:'25,49 43.5,48 43.5,62 25,62',
  m3:'12,26 28.5,26 28.5,33 35,37 35,47 12,47',
  m4:'21,51 38.5,51 38.5,80 21,80',
  m5:'38.5,59 52,59 52,80 38.5,80',
  f1:'30,49 45.5,49 45.5,80 30,80',
  f2:'30,57 42.5,57 42.5,80 30,80',
  f3:'21,49 34,49 34,66 21,66',
  f4:'26,55 39.5,55 39.5,80 26,80',
  f5:'30,66 37.5,66 37.5,80 30,80',
};
const JG_MANE = '0 0, 54% 0, 54% 40%, 66% 42%, 77% 41%, 77% 46%, 62.5% 48%, 58.5% 64.5%, 41.5% 69%, 10.5% 69%, 0 62.5%';
const JG_MANE_SHOW = 0.68;            // the mane over the rider: the rider through it at about a third
const _jgLegMasks = {};
function jgLegMask(av){
  if(_jgLegMasks[av] != null) return _jgLegMasks[av];
  const pts = JG_RIDE_LEG[av];
  if(!pts) return (_jgLegMasks[av] = '');
  /* the picture, but for the leg, its edge feathered: opaque where the rider shows (an alpha mask) */
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80' width='80' height='80'><defs><filter id='f' x='-10%' y='-10%' width='120%' height='120%'>` +
    `<feGaussianBlur stdDeviation='1.7'/></filter></defs><path fill='black' fill-rule='evenodd' filter='url(#f)' d='M-20 -20H100V100H-20Z M${pts.split(' ').join(' L')}Z'/></svg>`;
  /* (unquoted, every quote and bracket escaped: it goes inside a style="…") */
  const data = encodeURIComponent(svg).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
  return (_jgLegMasks[av] = `url(data:image/svg+xml,${data})`);
}
/* (4.03) where his eyes are in his picture (lucesco_front.png, 96 × 96): the middle of the blue band across his face */
const JG_EYES = { x:30.5 / 96, y:31.5 / 96, w:0.3, h:0.17 };
function jgJumpIn(){ return Math.max(0, jgState().jumpIn | 0); }
function jgJumpFrom(p, dir){
  const v = JG_DIR[dir];
  if(!v || !p) return null;
  const wx = p.x + v[0], wy = p.y + v[1], x = p.x + 2 * v[0], y = p.y + 2 * v[1];
  if(jgTile(wx, wy) !== JG_T.HEDGE) return null;                          // only the forest's trees
  if(x < 1 || y < 1 || x >= JG.W - 1 || y >= JG.H - 1) return null;
  if(jgSolidAt(x, y) || jgBandAt(x, y) || wBlockedBy(JG_DECK, x, y) || jgFolkAt(x, y)) return null;   // two deep, or somebody there
  if(typeof questSealedAt === 'function' && (questSealedAt(x, y) || questSealedAt(p.x, p.y))) return null;   // (3.99) never into (or out of) a tribe's village while its magic walls it off
  return { x, y, dir };
}
function jgJumpHtml(mark){
  const T = WALK_T, LS = 1.577 * T, av = (state && state.avatar) || 'm1', cut = JG_RIDE_CUT[av] != null ? JG_RIDE_CUT[av] : 0.44;
  /* his picture as he is on the map (1.577 × a square, lifted a tenth); you astride his back, behind the mane */
  const RS = Math.round(1.2 * T), backX = -0.2885 * T + 0.63 * LS, backY = -0.4465 * T + 0.45 * LS;
  const lx = 0.5 * T - LS / 2, ly = 0.342 * T - LS / 2;
  const clip = JG_RIDE_CLIP[av] ? `polygon(${JG_RIDE_CLIP[av]})` : `inset(0 0 ${Math.round(cut * 100)}% 0)`;
  /* (4.03) his eyes, for Pulsar Glare: a red fire laid over them, out until he glares (jgGlare) */
  const ew = JG_EYES.w * LS, eh = JG_EYES.h * LS;
  /* (4.03) Rift Ambush: each picture's shape filled with stars, over it gone black (.jg-starry) */
  const stars = (src, l, t, s, c)=> `<i class="jg-stars" style="left:${Math.round(l)}px;top:${Math.round(t)}px;width:${Math.round(s)}px;height:${Math.round(s)}px;` +
    `-webkit-mask-image:url(${src});mask-image:url(${src});${c ? `clip-path:${c};` : ''}"></i>`;
  /* (4.05) the whole picture, its seat on his back, one leg cut away (jgLegMask), flipped if it looks back; his head and
     mane over it, the rider through them faintly (.jg-ride-mane) */
  const k = RS / 80, seat = JG_RIDE_SEAT[av] != null ? JG_RIDE_SEAT[av] : (1 - cut) * 80;
  const yl = backX - RS / 2 + (JG_RIDE_X[av] || 0) * k, yt = backY - seat * k;
  const leg = jgLegMask(av), flip = JG_RIDE_FLIP[av] ? 'scale:-1 1;' : '';
  const box = `left:${Math.round(yl)}px;top:${Math.round(yt)}px;width:${RS}px;height:${RS}px;`;
  const masked = leg ? `-webkit-mask-image:${leg};mask-image:${leg};-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;` : '';
  void clip;
  return `<i class="jg-ride-shadow"></i><div class="jg-ride-arc">` +
    `<img class="jg-ride-lion" src="assets/mon/lucesco_front.png" alt="" style="width:${Math.round(LS)}px;height:${Math.round(LS)}px;left:${Math.round(lx)}px;top:${Math.round(ly)}px">` +
    stars('assets/mon/lucesco_front.png', lx, ly, LS) +
    `<i class="jg-eyes" style="width:${Math.round(ew)}px;height:${Math.round(eh)}px;left:${Math.round(lx + JG_EYES.x * LS - ew / 2)}px;top:${Math.round(ly + JG_EYES.y * LS - eh / 2)}px"></i>` +
    `<div class="jg-ride-rider" style="${box}${flip}${masked}">` +
      `<img class="jg-ride-you" src="assets/avatar/${av}.png" alt="" onerror="avatarFallback(this)" data-px="${RS}" data-id="${av}" data-bare="1" style="left:0;top:0;width:${RS}px;height:${RS}px">` +
      stars(`assets/avatar/${av}.png`, 0, 0, RS) +
    `</div>` +
    `<img class="jg-ride-mane" src="assets/mon/lucesco_front.png" alt="" style="width:${Math.round(LS)}px;height:${Math.round(LS)}px;left:${Math.round(lx)}px;top:${Math.round(ly)}px;clip-path:polygon(${JG_MANE});opacity:${JG_MANE_SHOW}">` +
    `</div>`;
}
async function jgJump(J){
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(!p || !J || w.busy || ui.jgAlert || ui.jgTalk || jgJumpIn()) return;
  const world = $('#walkWorld'), me = $('#walkYou'), lion = document.getElementById('jgLion');
  if(!world || !me) return;
  releaseKeys();
  w.busy = true;
  const T = WALK_T, from = { x:p.x, y:p.y }, v = JG_DIR[J.dir];
  const faceR = v[0] ? v[0] > 0 : w.faceX === 'r';
  if(v[0]) w.faceX = v[0] > 0 ? 'r' : 'l';
  const ride = document.createElement('div');
  ride.className = 'walk-ent jg-ride' + (faceR ? ' face-r' : '');
  ride.style.zIndex = 12 + Math.max(from.y, J.y);
  ride.style.transform = `translate3d(${from.x * T}px,${from.y * T}px,0)`;
  ride.innerHTML = jgJumpHtml();
  world.appendChild(ride);
  me.classList.add('jg-riding');
  if(lion) lion.classList.add('jg-riding');
  /* the camera glides with the leap, not ahead of it */
  p.x = J.x; p.y = J.y;
  world.style.transition = `transform ${(JG_JUMP.ms * 0.8 / 1000).toFixed(2)}s ease-in-out ${(JG_JUMP.ms * 0.12 / 1000).toFixed(2)}s`;
  refreshWalk();
  const D = JG_JUMP.ms, reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arc = ride.querySelector('.jg-ride-arc'), sh = ride.querySelector('.jg-ride-shadow');
  const at = (x, y)=> `translate3d(${x * T}px,${y * T}px,0)`;
  try {
    if(typeof ride.animate === 'function' && !reduce){
      const up = -JG_JUMP.high * T;
      const a1 = ride.animate([{ transform:at(from.x, from.y), offset:0 }, { transform:at(from.x, from.y), offset:0.12 },
                               { transform:at(J.x, J.y), offset:0.9 }, { transform:at(J.x, J.y), offset:1 }], { duration:D, easing:'linear', fill:'forwards' });
      arc.animate([{ transform:'translateY(0) scaleY(1)', offset:0 }, { transform:`translateY(${0.05 * T}px) scaleY(.9)`, offset:0.12, easing:'cubic-bezier(.25,.7,.55,1)' },
                   { transform:`translateY(${up}px) scaleY(1.05)`, offset:0.5, easing:'cubic-bezier(.45,0,.75,.35)' }, { transform:`translateY(${0.04 * T}px) scaleY(.92)`, offset:0.9 },
                   { transform:'translateY(0) scaleY(1)', offset:1 }], { duration:D, fill:'forwards' });
      if(sh) sh.animate([{ transform:'scale(1)', opacity:1, offset:0 }, { transform:'scale(1)', opacity:1, offset:0.12 }, { transform:'scale(.55)', opacity:0.45, offset:0.5 },
                         { transform:'scale(1)', opacity:1, offset:0.9 }, { transform:'scale(1)', opacity:1, offset:1 }], { duration:D, fill:'forwards' });
      await a1.finished.catch(()=>{});
    } else {
      await new Promise(r=> setTimeout(r, 120));
      ride.style.transform = at(J.x, J.y);
      await new Promise(r=> setTimeout(r, 200));
    }
  } catch(e){}
  if(world.isConnected) world.style.transition = '';
  ride.remove();
  me.classList.remove('jg-riding');
  /* Lucesco beside you where you land: ahead of you if he can, else to a side */
  const free = [[v[0], v[1]], [v[1], v[0]], [-v[1], -v[0]]].map(([dx, dy])=> ({ x:J.x + dx, y:J.y + dy }))
    .find(q=> !jgSolidAt(q.x, q.y) && !wBlockedBy(JG_DECK, q.x, q.y) && !jgBandAt(q.x, q.y) && !jgFolkAt(q.x, q.y));
  ui.jgLion = free ? { x:free.x, y:free.y, faceR:free.x !== J.x ? free.x < J.x : faceR } : { x:J.x, y:J.y, faceR };
  ui.jgTrail = [{ x:J.x, y:J.y }];
  if(jgRiding()){ if(lion) lion.classList.remove('jg-riding'); jgMountSync(); }    // (4.03) you stay on his back: he lands under you
  else if(lion){ lion.classList.add('jg-fresh'); jgLionPlace(); requestAnimationFrame(()=> requestAnimationFrame(()=>{ lion.classList.remove('jg-fresh', 'jg-riding'); })); }
  const j = jgState();
  j.jumpIn = JG_JUMP.steps;
  j.jumps = (j.jumps || 0) + 1;
  w.busy = false;
  jgSave(false);
  jgExplore(J.x, J.y);
  jgDiscover(J.x, J.y);
  jgShowBands(); jgShowFolk(); jgShowFinds();
  w.actSig = null;
  refreshWalk();
  if(typeof checkPrize === 'function' && checkPrize()){ releaseKeys(); return; }   // landed on a find
  jgLook();
}
/* the button beside you, while you face a wall he can leap */
function jgJumpAct(p){
  const J = jgJumpFrom(p, walkState().face);
  if(!J) return null;
  const n = jgJumpIn();
  const j = jgState();
  if(!j.talk.jumpHint){ j.talk.jumpHint = 1; setTimeout(()=> toast('🦁 Lucesco can carry you over this wall — tap Jump!'), 50); }
  if(n) return { key:'jgJump' + n, cls:'lion off', html:lucescoActHtml('Jump', `in ${n} step${n === 1 ? '' : 's'}`),
                 act:()=> toast(`🦁 Lucesco is catching his breath — ${n} more step${n === 1 ? '' : 's'}.`) };
  return { key:'jgJump', cls:'lion leap', html:lucescoActHtml('Jump!', 'over the trees'), act:()=> jgJump(J) };
}

/* ============================================================
   (4.03) ON LUCESCO'S BACK
   The designer: "I ADORE the way the sprites currently ride on Lucesco … Can you make riding him the default in the
   jungle? It's a lovely feeling." Once he has come to you on your first walk in (jgArrive), you ride him everywhere
   in the jungle: your picture on the map (#walkYou, from the deck's youArt) is the leap's — him, and you astride his
   back from the waist up; his own picture beside you (#jgLion) is put away, and where he stands is where you stand.
   ============================================================ */
function jgRiding(){ return !!(typeof state !== 'undefined' && state && state.progress && jgState().seen) && !ui.jgAfoot; }
function jgRideArt(){ return `<div class="jg-ride jg-mount">${jgJumpHtml()}</div>`; }
function jgMountSync(){
  const w = walkState(), p = w.at && w.at[JG_KEY], lion = document.getElementById('jgLion'), on = jgRiding();
  if(lion) lion.classList.toggle('jg-off', on);
  if(on && p) ui.jgLion = { x:p.x, y:p.y, faceR:w.faceX === 'r' };
}
/* the first walk in: he comes onto your square, and you are on his back with a little hop */
async function jgMount(){
  const w = walkState(), p = w.at && w.at[JG_KEY], lion = document.getElementById('jgLion');
  if(!p || !$('#walkYou')) return;
  if(lion && !lion.classList.contains('jg-off')){
    ui.jgLion = { x:p.x, y:p.y, faceR:w.faceX === 'r' };
    jgLionPlace();
    await new Promise(r=> setTimeout(r, 260));
  }
  walkYouRefresh();
  jgMountSync();
  jgSeeThrough(true);
  const arc = document.querySelector('#walkYou .jg-ride-arc');
  if(arc && typeof arc.animate === 'function' && !jgReduced())
    arc.animate([{ transform:'translateY(0)' }, { transform:`translateY(${(-0.35 * WALK_T).toFixed(1)}px)`, offset:0.4 }, { transform:'translateY(0)' }], { duration:420, easing:'ease-out' });
}
function jgReduced(){ return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; }
/* the two of you, for the see-through window: [cx, cy, half w, half h] in squares, from your square's corner */
function jgRideFigure(){
  const me = document.getElementById('walkYou');
  if(!me) return null;
  const er = me.getBoundingClientRect(), T = er.width, li = me.querySelector('.jg-ride-lion'), yi = me.querySelector('.jg-ride-you');
  if(!T || !li) return null;
  const lr = li.getBoundingClientRect();
  if(!lr.width) return null;
  let x0 = lr.left + lr.width * 10 / 96, x1 = lr.left + lr.width * 87 / 96, y0 = lr.top + lr.height * 5 / 96;
  const y1 = lr.top + lr.height * 90 / 96;
  if(yi){ const yr = yi.getBoundingClientRect(); if(yr.width){ x0 = Math.min(x0, yr.left + yr.width * 21 / 80); x1 = Math.max(x1, yr.left + yr.width * 58 / 80); y0 = Math.min(y0, yr.top + yr.height * 7 / 80); } }
  return [((x0 + x1) / 2 - er.left) / T, ((y0 + y1) / 2 - er.top) / T, (x1 - x0) / 2 / T, (y1 - y0) / 2 / T];
}

/* ============================================================
   (4.03) PULSAR GLARE AND RIFT AMBUSH
   The designer: "can you give him two more moves? When an alien is nearby and even if obscured by trees, can you allow
   him to face the alien and fire a stunning red laser from his eyes towards the alien? Label it Pulsar Glare. Max range
   two squares in any direction including diagonal. This laser disables the alien for 5 seconds from moving and they
   vibrate and have a forward tilt to simulate getting electrocuted and paralysed … This stops them from moving and
   disables their sight cone so they cannot approach or start battle with the player … When battle is initiated on an
   alien in this state, the alien of the first wave (not the full wave) starts the battle 25% weakened for 3 turns and
   with 15% HP lost. The lost HP only happens if the battle is started with the alien in this state and cannot stack
   with repeated lasers. Cooldown on this ability, 50 steps. When this move animates, make the laser initiate instantly
   and stop the movement of all sprites even if they were mid animation crossing between tiles. Please create a fierce
   red glow around Lucesco's eyes as the beam fires and radiates and pulses brightly for 1s. also turn the alien's
   silhouette black as it rapidly vibrates and flips between a range of forward and backward tilt (say between 5 to 20
   degrees in either direction) with dramatic and rapid electric lines to simulate the intense electrocution when the
   beam is firing, before it enters the less intense paralysed stage."
   "Then, Lucesco can also execute "Rift Ambush" on an alien within two steps in any direction including diagonal. This
   replaces the challenge button. Lucesco can ambush through trees in this manner. He and the player turn into a starry
   silhouette, then reddish flashes and flies rapidly towards the alien's position but fades out and reappears on the
   alien's location with a reddish flash on a quick gash on the landing tile through spacetime … When pounced upon, the
   alien falls horizontal towards the bottom of its tile and Lucesco stands on top of it. When battle is initiated in
   this manner, the first wave's enemy alien starts the battle stunned for 1 turn and with 15% HP lost. HP lost stacks
   with pulsar glare." And: "Rift ambush no cooldown but its HP loss effect cannot stack via fleeing and ambushing
   again" — every fight builds its waves afresh at full health (jgWaves), so each fight takes its 15% (or 30%) once.
   The effects on the fight: jgEdgeApply, at its first wave (jgWaveStart).
   ============================================================ */
/* (4.08) the designer: "please reduce the cooldown of pulsar glare to 15 steps" (50 until 4.08) */
const JG_GLARE = { reach:2, steps:15, ms:5000, beam:1000, hp:0.15, weak:0.25, turns:3 };
const JG_AMBUSH = { reach:2, hp:0.15, stun:1, dark:420, fly:260, fadeIn:330, after:620 };   // (4.05) its timings, ms
function jgGlareIn(){
  const j = jgState();
  if((j.glareIn | 0) > JG_GLARE.steps) j.glareIn = JG_GLARE.steps;     // (4.08) a save's wait from the old 50: 15 at most
  return Math.max(0, j.glareIn | 0);
}
function jgBandStunned(b){ return !!(b && b.zapUntil && b.zapUntil > Date.now()); }
function jgBandName(b){ const nm = SPECIES[b.lead] ? SPECIES[b.lead].name : 'alien'; return b.rank === 'alien' ? nm : (b.rank === 'captain' ? 'Captain ' : 'Commander ') + nm; }
/* the bands within his reach of p: two squares any way, diagonals too, trees or no trees — nearest first, then the one
   you are facing */
function jgReachable(p, reach){
  const fx = walkState().faceX === 'r' ? 1 : -1;
  return jgBands().filter(b=> !jgBandBeaten(b) && !(b.x === p.x && b.y === p.y) && Math.max(Math.abs(b.x - p.x), Math.abs(b.y - p.y)) <= reach)
    .map(b=> ({ b, d:Math.hypot(b.x - p.x, b.y - p.y), ahead:Math.sign(b.x - p.x) === fx ? 0 : 1 }))
    .sort((a, c)=> a.d - c.d || a.ahead - c.ahead).map(o=> o.b);
}
/* his glare: the nearest that is not already twitching; his ambush: one he has glared first, else the nearest — never
   into or out of a tribe's village while its magic walls it off (questSealedAt, 25-quest.js) */
function jgGlareTarget(p){ const all = jgReachable(p, JG_GLARE.reach); return all.find(b=> !jgBandStunned(b)) || all[0] || null; }
function jgAmbushable(p, b){ return !(typeof questSealedAt === 'function' && (questSealedAt(b.x, b.y) || questSealedAt(p.x, p.y))); }
function jgAmbushTarget(p){ const all = jgReachable(p, JG_AMBUSH.reach).filter(b=> jgAmbushable(p, b)); return all.find(b=> jgBandStunned(b)) || all[0] || null; }
/* the buttons (jgNearActs) */
function jgLucescoActs(p){
  const acts = [];
  if(!jgRiding()) return acts;
  const g = jgGlareTarget(p);
  if(g){
    const n = jgGlareIn();
    acts.push(n ? { key:'jgGlareIn' + n, cls:'lion off', html:lucescoActHtml('Pulsar Glare', `in ${n} step${n === 1 ? '' : 's'}`),
                    act:()=> toast(`Lucesco's eyes are still dim. ${n} more step${n === 1 ? '' : 's'}.`) }
                : { key:'jgGlare:' + g.id, cls:'lion glare', at:{ x:g.x, y:g.y }, html:lucescoActHtml('Pulsar Glare', jgBandName(g)), act:()=> jgGlare(g) });
  }
  const a = jgAmbushTarget(p);
  if(a) acts.push({ key:'jgAmb:' + a.id, cls:'lion ambush', at:{ x:a.x, y:a.y }, html:lucescoActHtml('Rift Ambush', jgBandName(a)), act:()=> jgAmbush(a) });
  return acts;
}

/* Time stops: the world and everyone in it held where they are drawn this instant — a band halfway between two squares
   stays halfway — and everything they were doing (a throb, a hover) paused, but `keep`'s own. The function it gives
   back lets them all go on from there. */
function jgFreeze(keep, camera){
  const world = $('#walkWorld');
  if(!world) return ()=>{};
  const keepEl = keep && ui.jgBandEls && ui.jgBandEls[keep.id];
  /* (4.08) `camera` false: everyone held but the world itself, free to zoom (jgZoomIn) */
  const held = (camera === false ? [] : [world]).concat(Array.from(world.querySelectorAll('.walk-ent'))).map(el=>{
    const tf = getComputedStyle(el).transform;
    const was = { tr:el.style.transition, tf:el.style.transform };
    el.style.transition = 'none';
    if(tf && tf !== 'none') el.style.transform = tf;
    return { el, was };
  });
  world.classList.add('jg-frozen');
  if(keepEl) keepEl.classList.add('jg-fx-on');
  return ()=>{
    world.classList.remove('jg-frozen');
    if(keepEl) keepEl.classList.remove('jg-fx-on');
    held.forEach(({ el, was })=>{ el.style.transition = was.tr; });
    void world.offsetWidth;                                             // from where they are held, on to where they were going
    held.forEach(({ el, was })=>{ el.style.transform = was.tf; });
  };
}
/* (4.08) LUCESCO'S MOVES, CLOSE UP
   The designer: "When using Lucesco's attack moves on the map, please pause the sprites to zoom in on Lucesco as centre
   in a half second until the screen is 7 tiles high and wide, then execute his move. Keep the zoom in for 5 seconds or
   until he moves up down left right more than 2 steps. If already zoomed in, execute the moves without delay. This is
   to give a better view of the action to my sons". Everyone is held where they are drawn (jgFreeze, the camera left
   free) while it comes in over 0.5 s, the two of you in the middle, until the stage is 7 squares across (from about 9
   on a phone, 13 on a tablet); then the move. The camera follows you so (walkZoomS, 13-walkmap.js) and goes back out
   over 0.5 s, 5 s after the move or at your third step. A move made meanwhile goes off at once and starts the 5 s
   again. */
const JG_ZOOM = { squares:7, ms:500, hold:5000, steps:2 };
function jgZoomed(){ const z = ui.walkZoom; return !!(z && z.deck === JG_KEY); }
/* how much nearer: the stage's squares across, down to 7 (1 if it shows no more than that already) */
function jgZoomScale(){
  const st = $('#walkStage');
  if(!st || !WALK_T) return 1;
  return Math.max(1, Math.min(st.clientWidth, st.clientHeight) / WALK_T / JG_ZOOM.squares);
}
/* back out: the camera to where it should be now (refreshWalk), gliding there over `ms` (as you may be walking meanwhile,
   a glide the steps' own glides join) — the ground drawn first for where it is going (jgPaintDraw) */
function jgZoomGlide(ms){
  try { jgPaintDraw(null, performance.now()); } catch(e){}
  const world = $('#walkWorld');
  if(world) world.style.transition = `transform ${ms}ms ease-in-out`;
  refreshWalk();
  clearTimeout(ui._jgZoomGlide);
  ui._jgZoomGlide = setTimeout(()=>{ const wd = $('#walkWorld'); if(wd) wd.style.transition = ''; }, ms + 40);
}
/* in, before one of his moves: a promise that resolves once it is in — or null, in already (or nothing to do), so the
   move goes off that very instant. The camera is moved frame by frame on the clock (eased in and out), not left to a
   CSS glide: on a busy tablet the glide could start late, and the move went off with the camera hardly in. However
   the frames fall, at 0.5 s it is exactly in. */
function jgZoomIn(){
  if(jgZoomed()){ clearTimeout(ui.walkZoom.t); ui.walkZoom.steps = 0; return null; }
  const to = jgZoomScale();
  if(to <= 1.001 || ui.screen !== JG_KEY){ ui.walkZoom = { deck:JG_KEY, s:1, to:1, steps:0, t:0 }; return null; }
  const thaw = jgFreeze(null, false);
  ui.walkZoom = { deck:JG_KEY, s:1, to, steps:0, t:0 };
  try { jgPaintDraw(null, performance.now()); } catch(e){}               // the ground for where it is going, sharp there, first
  const world = $('#walkWorld');
  if(world) world.style.transition = 'none';
  clearTimeout(ui._jgZoomGlide);
  return new Promise(r=>{
    const t0 = performance.now(), ease = u=> u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
    const frame = ()=>{
      const z = ui.walkZoom;
      if(!z || z.deck !== JG_KEY || ui.screen !== JG_KEY){ thaw(); return r(); }
      const u = Math.min(1, (performance.now() - t0) / JG_ZOOM.ms);
      z.s = 1 + (to - 1) * ease(u);
      jgCamApply();
      if(u < 1) return requestAnimationFrame(frame);
      z.s = to;
      jgCamApply();
      /* the last of it laid down (a reflow) before the walk's own glide is back on, or that glide would run from the
         last frame drawn to here — after the move had begun */
      const wd = $('#walkWorld'); if(wd){ void wd.offsetWidth; wd.style.transition = ''; }
      refreshWalk();
      thaw(); r();
    };
    requestAnimationFrame(frame);
  });
}
/* the world where the camera says, this instant (refreshWalk's own transform, nothing else) */
function jgCamApply(){
  const world = $('#walkWorld'), c = typeof walkCamXY === 'function' ? walkCamXY() : null;
  if(world && c) world.style.transform = `translate3d(${c.tx}px, ${c.ty}px, 0)` + (c.s !== 1 ? ` scale(${c.s.toFixed(4)})` : '');
}
/* the move done: in for 5 s more, or until the third step (jgStep) */
function jgZoomHold(){
  const z = ui.walkZoom;
  if(!z || z.deck !== JG_KEY) return;
  z.steps = 0;
  clearTimeout(z.t);
  z.t = setTimeout(()=> jgZoomOut(), JG_ZOOM.hold);
}
function jgZoomOut(){
  const z = ui.walkZoom;
  if(!z || z.deck !== JG_KEY) return;
  clearTimeout(z.t);
  if(ui.screen === JG_KEY && (ui.jgFx || ui.jgFighting || walkState().busy)){ z.t = setTimeout(()=> jgZoomOut(), 300); return; }   // in the middle of something: after it
  ui.walkZoom = null;
  if(ui.screen === JG_KEY) jgZoomGlide(JG_ZOOM.ms);
}
/* a step of yours: the third since his move takes the camera back out */
function jgZoomStep(){
  const z = ui.walkZoom;
  if(!z || z.deck !== JG_KEY || ui.jgFx) return;
  z.steps = (z.steps || 0) + 1;
  if(z.steps > JG_ZOOM.steps) jgZoomOut();
}
/* where an element of the world is drawn this instant (its transform's offset, in the world's own pixels) */
function jgDrawnAt(el){
  try { const m = new DOMMatrixReadOnly(getComputedStyle(el).transform); return { x:m.m41, y:m.m42 }; } catch(e){ return null; }
}
async function jgGlare(b){
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(!p || !b || w.busy || ui.jgAlert || ui.jgTalk || ui.jgFx || ui.jgFighting || jgGlareIn() || jgBandBeaten(b) || !jgRiding()) return;
  const world = $('#walkWorld'), me = $('#walkYou');
  if(!world || !me) return;
  releaseKeys();
  w.busy = true; ui.jgFx = 'glare';
  const closeUp = jgZoomIn();                                           // (4.08) close up first (at once if it is already)
  if(closeUp){ await closeUp; if(ui.screen !== JG_KEY || jgBandBeaten(b)){ ui.jgFx = null; w.busy = false; return; } }
  const thaw = jgFreeze(b, closeUp ? false : undefined);                // (4.08) just come in: the camera still, nothing of it to hold
  /* he turns to it, and fires at once */
  if(b.x !== p.x){ w.faceX = b.x > p.x ? 'r' : 'l'; faceRight(me, w.faceX === 'r'); }
  const j = jgState();
  j.glareIn = JG_GLARE.steps; j.glares = (j.glares || 0) + 1;
  b.zapUntil = Date.now() + JG_GLARE.ms;
  playSfx('timestop');
  playSfx('pulsar');                                                    // (4.05) the laser's own sound (was 'spark')
  const beam = jgBeam(b);
  const eyes = me.querySelector('.jg-eyes');
  if(eyes){ eyes.classList.remove('on'); void eyes.offsetWidth; eyes.classList.add('on'); }
  jgZapStart(b, true);
  jgSeeThrough(true);
  try { await new Promise(r=> setTimeout(r, JG_GLARE.beam)); }
  finally {
    if(beam){ beam.classList.add('out'); setTimeout(()=> beam.remove(), 220); }
    if(eyes) eyes.classList.remove('on');
    if(ui.jgBandEls && ui.jgBandEls[b.id]) jgZapStart(b, false);         // the beam gone: paralysed, for the rest of its 5 s
    thaw();
    ui.jgFx = null; w.busy = false;
    w.actSig = null;                                                     // his button: "in 50 steps" now
    jgSave(false);
    if(ui.screen === JG_KEY) refreshWalk();
    clearTimeout(b._zapEndT);
    b._zapEndT = setTimeout(()=> jgZapEnd(b), Math.max(0, b.zapUntil - Date.now()) + 40);
    jgZoomHold();                                                        // (4.08) close up 5 s more, or until your third step
  }
}
/* the laser: from his eyes (as he is drawn, mirrored when he faces right) to the alien, at full length at once */
function jgBeam(b){
  const world = $('#walkWorld'), me = $('#walkYou'), el = ui.jgBandEls && ui.jgBandEls[b.id];
  if(!world || !me) return null;
  const T = WALK_T, LS = 1.577 * T, lx = 0.5 * T - LS / 2, ly = 0.342 * T - LS / 2;
  const yo = jgDrawnAt(me) || { x:0, y:0 }, at = (el && jgDrawnAt(el)) || { x:b.x * T, y:b.y * T };
  let ex = lx + JG_EYES.x * LS;
  const ey = ly + JG_EYES.y * LS;
  if(me.classList.contains('face-r')) ex = T - ex;
  const fx = yo.x + ex, fy = yo.y + ey, tx = at.x + 0.5 * T, ty = at.y + 0.42 * T;
  const len = Math.hypot(tx - fx, ty - fy), ang = Math.atan2(ty - fy, tx - fx) * 180 / Math.PI;
  const beam = document.createElement('div');
  beam.className = 'jg-beam';
  beam.style.cssText = `left:${fx.toFixed(1)}px;top:${fy.toFixed(1)}px;width:${len.toFixed(1)}px;transform:rotate(${ang.toFixed(2)}deg)`;
  beam.innerHTML = '<i></i><b></b><em></em>';
  world.appendChild(beam);
  return beam;
}
/* the alien under the beam (hard: black, flipping between tilts, crackling) and after it (paralysed: tipped forward,
   shaking, sparking red); its cone out while it lasts */
function jgZapStart(b, hard){
  const el = ui.jgBandEls && ui.jgBandEls[b.id];
  if(!el) return;
  el.classList.toggle('jg-zap', !!hard);
  el.classList.add('jg-stun');
  const cone = el.querySelector('.jg-cone'); if(cone) cone.style.display = 'none';
  let svg = el.querySelector('.jg-bolts');
  if(!svg){ svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'jg-bolts'); svg.setAttribute('viewBox', '0 0 180 180'); svg.setAttribute('aria-hidden', 'true'); el.appendChild(svg); }
  jgBoltsRun(b, el, svg);
}
/* a bolt of lightning: from somewhere on the alien, in jagged steps, outward (the bolts' box: 1.8 squares, the square
   itself at 40–140 across and 60–160 down, the alien's middle about 90, 100) */
function jgBoltPts(hard){
  const a = Math.random() * Math.PI * 2, r = (hard ? 34 : 28) * Math.sqrt(Math.random()), n = 4 + Math.floor(Math.random() * 3);
  let x = 90 + Math.cos(a) * r, y = 102 + Math.sin(a) * r * 0.95;
  const pts = [[x, y]], dir = a + (Math.random() - 0.5) * 1.3, step = (hard ? 62 : 40) / n;
  for(let i = 0; i < n; i++){ const t = dir + (Math.random() - 0.5) * 1.7; x += Math.cos(t) * step; y += Math.sin(t) * step; pts.push([x, y]); }
  return pts.map(([x, y])=> x.toFixed(1) + ',' + y.toFixed(1)).join(' ');
}
function jgBoltsRun(b, el, svg){
  clearTimeout(b._boltT);
  const tick = ()=>{
    if(!svg.isConnected || !jgBandStunned(b)){ svg.innerHTML = ''; return; }
    const hard = el.classList.contains('jg-zap');
    const n = hard ? 6 : 1 + Math.floor(Math.random() * 2.4);
    let h = '';
    for(let i = 0; i < n; i++){ const pts = jgBoltPts(hard); h += `<polyline class="g" points="${pts}"></polyline><polyline class="c" points="${pts}"></polyline>`; }
    svg.innerHTML = h;
    b._boltT = setTimeout(tick, hard ? 45 : 70 + Math.random() * 90);
  };
  tick();
}
function jgZapEnd(b){
  if(jgBandStunned(b)) return;                                      // glared again meanwhile: its own end comes later
  b.zapUntil = 0;
  clearTimeout(b._boltT);
  const el = ui.jgBandEls && ui.jgBandEls[b.id];
  if(el && !b._pounced){ el.classList.remove('jg-zap', 'jg-stun'); const svg = el.querySelector('.jg-bolts'); if(svg) svg.remove(); }
  /* not in the middle of one of his moves, or of a fight beginning: those set out the picture as they want it */
  if(ui.screen !== JG_KEY || ui.jgFx || ui.jgFighting || b._pounced) return;
  jgBandPlace(b);
  jgSeeThrough(true);
  walkState().actSig = null; refreshWalk();
}
/* the windows in the crowns over a twitching or pounced-on alien, as over you (jgSeePoints) */
function jgZapWindows(){
  const out = [];
  jgBands().forEach(b=>{
    if(!jgBandStunned(b) && !b._pounced) return;
    const el = ui.jgBandEls && ui.jgBandEls[b.id], img = el && el.querySelector('.jg-art');
    if(!el || !img) return;
    const er = el.getBoundingClientRect(), T = er.width, r = img.getBoundingClientRect();
    if(!T || !r.width) return;
    out.push([b.x + (r.left - er.left + r.width / 2) / T, b.y + (r.top - er.top + r.height * 0.55) / T, r.width * 0.38 / T, r.height * 0.44 / T]);
  });
  return out;
}

/* ---------- Rift Ambush ---------- */
async function jgAmbush(b){
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(!p || !b || w.busy || ui.jgAlert || ui.jgTalk || ui.jgFx || ui.jgFighting || jgBandBeaten(b) || !jgRiding() || !jgAmbushable(p, b)) return;
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first.'); return; }
  const world = $('#walkWorld'), me = $('#walkYou'), el = ui.jgBandEls && ui.jgBandEls[b.id];
  if(!world || !me) return;
  releaseKeys();
  w.busy = true; ui.jgFx = 'ambush';
  const closeUp = jgZoomIn();                                           // (4.08) close up first (at once if it is already)
  if(closeUp){ await closeUp; if(ui.screen !== JG_KEY || jgBandBeaten(b)){ ui.jgFx = null; w.busy = false; return; } }
  const glared = jgBandStunned(b);
  const T = WALK_T, from = jgDrawnAt(me) || { x:p.x * T, y:p.y * T }, to = { x:b.x * T, y:b.y * T - 0.34 * T };   // (raised: he stands on it)
  const at = q=> `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,0)`;
  const wait = ms=> new Promise(r=> setTimeout(r, ms));
  const reduce = jgReduced();
  if(b.x !== p.x){ w.faceX = b.x > p.x ? 'r' : 'l'; faceRight(me, w.faceX === 'r'); }
  me.style.transition = 'none';
  me.style.transform = at(from);
  me.style.zIndex = 12 + Math.max(p.y, b.y);
  /* (4.05) the designer: "remove the rift animation, and the moment cosmic silhouette lucesco shift and fades, apply a fade
     in simultaneously that completes just shortly after the moment the previous silhouette fadeout completes. keep it as
     a cosmic silhouette that fades in, then it with a bright red pulse flash lucesco and the player's sprite appears in
     place of the silhouette and the monster is already lying down. do not flash the player's sprite … instead, leave a
     trailing slow purple cosmic shockwave aura … from the centre of lucesco's sprite. also do not make the red aura before
     the ambush flash, instead, just let lucesco darken into cosmic silhouette with a faintly swirling red glow around his
     silhouette"; "play the 'hit' sfx from battles at the moment when lucesco's reappearance causes a flash"; and "a
     yiu-yiu-yiu pulsing sound that gradually increases in volume as Lucesco fades into cosmic silhouette and plays until
     the 'hit' sound" (the `ambush` sound, stopped as the hit plays) */
  const DARK = reduce ? 120 : JG_AMBUSH.dark, FLY = JG_AMBUSH.fly, IN = JG_AMBUSH.fadeIn;
  let ghost = null, fx = [];
  try {
    /* 1. the two of you darken into starlight, a faint red glow swirling round you */
    playSfx('ambush');
    me.classList.add('jg-starry', 'jg-swirl');
    await wait(DARK);
    /* 2. the silhouette flies at it, fading as it goes; another fades in on its square as it does, done just after — and
       under it the alien already lies flat */
    ghost = me.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.classList.add('jg-ghost');
    ghost.style.transition = 'none';
    ghost.style.transform = at(to);
    ghost.style.opacity = '0';
    world.appendChild(ghost);
    b._pounced = true;
    if(el){
      el.classList.remove('jg-zap', 'jg-stun'); clearTimeout(b._boltT);
      const svg = el.querySelector('.jg-bolts'); if(svg) svg.remove();
      el.classList.add('jg-pounced'); const cone = el.querySelector('.jg-cone'); if(cone) cone.style.display = 'none';
    }
    if(typeof me.animate === 'function' && !reduce){
      const mid = { x:from.x + (to.x - from.x) * 0.55, y:from.y + (to.y - from.y) * 0.55 };
      me.animate([{ transform:at(from), opacity:1 }, { transform:at(mid), opacity:0.7, offset:0.5 }, { transform:at(to), opacity:0 }],
                 { duration:FLY, easing:'cubic-bezier(.55,0,.85,.45)', fill:'forwards' });
      const arrive = ghost.animate([{ opacity:0 }, { opacity:1 }], { duration:IN, easing:'cubic-bezier(.3,0,.6,1)', fill:'forwards' });
      await arrive.finished.catch(()=>{});
    } else { ghost.style.opacity = '1'; await wait(80); }
    /* 3. a bright red pulse — and there you both are, on it: no flash on you; a slow purple shockwave from his middle */
    me.getAnimations().forEach(a=> a.cancel());
    me.style.opacity = '';
    me.style.transform = at(to);
    me.classList.remove('jg-starry', 'jg-swirl');
    ghost.remove(); ghost = null;
    const cx = to.x + 0.5 * T, cy = to.y + 0.342 * T, z = (parseInt(me.style.zIndex, 10) || 12) - 1;
    const ring = (cls, size)=>{ const e = document.createElement('i'); e.className = cls;
      e.style.cssText = `left:${(cx - size / 2).toFixed(1)}px;top:${(cy - size / 2).toFixed(1)}px;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;z-index:${z}`;
      world.appendChild(e); fx.push(e); return e; };
    ring('jg-pulse', 2.7 * T);
    if(!reduce) ring('jg-wave', 1.2 * T);
    stopSfx('ambush', 60);
    playSfx('hit_dealt');
    jgSeeThrough(true);
    await wait(reduce ? 200 : JG_AMBUSH.after);
  } catch(e){}
  if(ghost) ghost.remove();
  fx.forEach(e=> setTimeout(()=> e.remove(), 900));
  stopSfx('ambush', 60);
  me.classList.remove('jg-starry', 'jg-swirl');
  ui.jgFx = null;
  /* the fight — with what his moves did to its first alien (jgEdgeApply). Where you stand stays where you leapt from
     until it is won (jgWon puts you on its square): a flight, or a fight lost, leaves you where you were */
  const go = jgFight(b, true, { ambush:true, glare:glared });
  jgZoomHold();                                                         // (4.08) 5 s more (the fight, if it begins, takes the screen meanwhile)
  if(go === false){                                                     // (it did not begin: all back as it was)
    b._pounced = false;
    if(el) el.classList.remove('jg-pounced');
    me.style.transition = ''; me.style.zIndex = ''; w.busy = false;
    jgBandPlace(b);
    refreshWalk();
  }
}
/* What his moves did to the fight's first alien, as its first wave comes on (jgWaveStart): Rift Ambush — stunned for
   its first turn, 15% of its health gone; Pulsar Glare (if it was still twitching when the fight began) — 15% more, and
   its attacks a quarter weaker for its first three turns (the `glared` status, 04-battle.js). Only that one alien:
   a captain's or a commander's waves after it come on whole. */
function jgEdgeApply(bt){
  const edge = bt && bt.jgEdge;
  if(!edge || (!edge.glare && !edge.ambush)) return;
  const e = bt.enemies.find(x=> x && x.jg && x.jg.alien && x.hp > 0);
  if(!e) return;
  const cut = (edge.glare ? JG_GLARE.hp : 0) + (edge.ambush ? JG_AMBUSH.hp : 0);
  e.hp = Math.max(1, Math.round(e.maxHp * (1 - cut)));
  const arr = eStatuses(e);
  if(edge.glare && !arr.some(s=> s.type === 'glared')) arr.push({ type:'glared', turnsLeft:JG_GLARE.turns, amount:JG_GLARE.weak, byRound:true });
  if(edge.ambush && !arr.some(s=> s.type === 'paralysed')) arr.push({ type:'paralysed', turnsLeft:JG_AMBUSH.stun });
  const what = edge.glare && edge.ambush ? 'Pulsar Glare and Rift Ambush!' : edge.ambush ? 'Rift Ambush!' : 'Pulsar Glare!';
  const said = `${what} The ${SPECIES[e.species].name} starts the fight${edge.ambush ? ' stunned,' : ''} with ${Math.round(cut * 100)}% of its HP gone` +
    (edge.glare ? `, and its attacks ${Math.round(JG_GLARE.weak * 100)}% weaker for ${JG_GLARE.turns} turns.` : '.');
  bt.jgEdgeSaid = said;
  setTimeout(()=>{
    if(ui.battle !== bt) return;
    renderBattle();
    if(typeof floatOver === 'function') floatOver(e, edge.ambush ? 'STUNNED' : 'WEAKENED');
    battleMsg(said);
  }, 1500);
}
let _jgTick = null;
function jgTickStart(){
  clearInterval(_jgTick);
  _jgTick = setInterval(jgTickOnce, JG.aliens.clock);
}
function jgTickOnce(){
  if(ui.screen !== JG_KEY){ clearInterval(_jgTick); _jgTick = null; return; }
  if(ui.jgAlert || ui.jgTalk || ui.jgFx || ui.sceneRunning || walkState().busy || document.querySelector('.scene-say') || (typeof eyeBreakActive === 'function' && eyeBreakActive())) return;
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(!p) return;
  const R = JG.aliens.active, rad = JG.aliens.radius;
  const lion = ui.jgLion;
  jgBands().forEach(b=>{
    if(jgBandBeaten(b) || Math.abs(b.x - p.x) > R || Math.abs(b.y - p.y) > R) return;
    if(b.calm && b.calm > Date.now()) return;
    if(jgBandStunned(b)) return;                                      // (4.03) paralysed by his Pulsar Glare
    const r = Math.random();
    if(r < 0.25){                                                     // stands a moment, looking about
      if(r < 0.08){ const opts = jgOpenDirs(b, p); if(opts.length) b.face = opts[Math.floor(r * 100) % opts.length]; jgBandPlace(b); }
      return;
    }
    const [dx, dy] = JG_DIR[b.face], nx = b.x + dx, ny = b.y + dy;
    const blocked = (x, y)=> jgSolidAt(x, y) || (x === p.x && y === p.y) || (lion && x === lion.x && y === lion.y) || jgBandAt(x, y)
      || Math.abs(x - b.hx) + Math.abs(y - b.hy) > rad || wBlockedBy(JG_DECK, x, y);
    if(blocked(nx, ny) || r > 0.9){
      const opts = jgOpenDirs(b, p).filter(f=> !blocked(b.x + JG_DIR[f][0], b.y + JG_DIR[f][1]));
      const ahead = opts.filter(f=> f !== { l:'r', r:'l', u:'d', d:'u' }[b.face]);
      const pick = ahead.length ? ahead : opts;
      if(pick.length) b.face = pick[Math.floor(r * 1000) % pick.length];
    } else { b.x = nx; b.y = ny; }
    jgBandPlace(b);
  });
  jgShowBands();                                    // one that has wandered into view
  jgFolkTick(p);                                    // (3.96) the villages' people: a step, a look, a word
  jgLook();
  refreshWalk();
  if(typeof questPulseUpdate === 'function') questPulseUpdate();   // (3.99) the nearest alien may have moved
}
function jgOpenDirs(b){ return Object.keys(JG_DIR).filter(f=> !jgSolidAt(b.x + JG_DIR[f][0], b.y + JG_DIR[f][1])); }

/* ---------- seen ---------- */
function jgLook(){
  if(ui.jgAlert || ui.screen !== JG_KEY) return false;
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(!p) return false;
  const now = Date.now();
  const b = jgBands().find(b=>{
    if(jgBandBeaten(b) || (b.calm && b.calm > now) || jgBandStunned(b) || Math.abs(b.x - p.x) + Math.abs(b.y - p.y) > JG.aliens.sight) return false;   // (4.03) a paralysed one sees nothing
    const [dx, dy] = JG_DIR[b.face], n = jgSight(b);
    for(let k = 1; k <= n; k++) if(b.x + dx * k === p.x && b.y + dy * k === p.y) return true;
    return false;
  });
  if(!b) return false;
  jgSpotted(b);
  return true;
}
/* It saw you: "!", you cannot move, it comes to you, and the fight begins. */
async function jgSpotted(b){
  if(ui.jgAlert) return;
  ui.jgAlert = b.id;
  releaseKeys();
  const w = walkState();
  w.busy = true;
  jgHold(true);
  const el = ui.jgBandEls && ui.jgBandEls[b.id];
  if(el) el.classList.add('alert');
  playSfx('alert');
  const wait = ms=> new Promise(r=> setTimeout(r, ms));
  await wait(750);
  const p = w.at[JG_KEY];
  const [dx, dy] = JG_DIR[b.face];
  for(let k = 0; k < 6 && Math.abs(b.x - p.x) + Math.abs(b.y - p.y) > 1; k++){
    b.x += dx; b.y += dy; jgBandPlace(b);
    await wait(230);
  }
  await wait(250);
  jgHold(false);
  if(el) el.classList.remove('alert');
  ui.jgAlert = null;
  if(ui.screen !== JG_KEY){ w.busy = false; return; }
  jgFight(b, true);
}
/* a pane over everything that swallows your taps while it comes */
function jgHold(on){
  let h = document.getElementById('jgHold');
  if(on && !h){ h = document.createElement('div'); h.id = 'jgHold'; h.className = 'jg-hold'; document.body.appendChild(h); }
  if(!on && h) h.remove();
}

/* ---------- the buttons beside you ---------- */
function jgNearActs(p){
  const acts = [{ key:'jgLion', cls:'lion', html:lucescoActHtml('Talk'), act:()=> jgLionTalk() }];   // (3.96) his face on it
  const jump = jgJumpAct(p);                                                                          // (3.96) his leap, facing a wall he can clear
  if(jump) acts.push(jump);
  const f = jgFolkNear(p);                                                                            // (3.96) one of the villagers beside you
  if(f) acts.push({ key:'jgF' + f.id, at:{ x:f.x, y:f.y }, html:`💬 Talk<small>${escapeHtml(jgFolkName(f.sprite))}</small>`, act:()=> jgFolkTalk(f) });
  /* (4.03) his Pulsar Glare and Rift Ambush, at an alien within two squares; the ambush is the challenge now — a plain
     Challenge is left only for a band beside you that he cannot ambush (across a tribe's sealed wall) */
  const lu = jgLucescoActs(p);
  acts.push(...lu);
  const ambushing = jgRiding();
  jgBands().forEach(b=>{
    if(jgBandBeaten(b) || Math.abs(b.x - p.x) + Math.abs(b.y - p.y) !== 1) return;
    if(ambushing && jgAmbushable(p, b)) return;
    const nm = SPECIES[b.lead].name;
    acts.push({ key:'jgB' + b.id, cls:'jg-fight', at:{ x:b.x, y:b.y },
      html:`⚔️ Challenge<small>${escapeHtml(b.rank === 'alien' ? nm : (b.rank === 'captain' ? 'Captain ' : 'Commander ') + nm)}</small>`,
      act:()=> jgFight(b, false) });
  });
  return acts;
}

/* ---------- the counters over the map ---------- */
function jgHud(){
  const stage = $('#walkStage');
  if(!stage) return;
  let hud = document.getElementById('jgHud');
  if(!hud){ hud = document.createElement('div'); hud.id = 'jgHud'; hud.className = 'jg-hud'; stage.parentNode.insertBefore(hud, stage); }
  const j = jgState(), bits = [];
  JG_TRIBE_KEYS.forEach(k=>{
    if(!j.met[k]) return;
    const n = Math.min(JG.daily.need, j.rescued[k] || 0);
    bits.push(`<span class="jg-chip${j.paid[k] ? ' done' : ''}" title="${escapeHtml(JG_TRIBES[k].name)}: freed today">${JG_TRIBES[k].icon} ${j.paid[k] ? '✓' : n + '/' + JG.daily.need}</span>`);
  });
  if(typeof caCommanderMet === 'function' && caCommanderMet()){                     // (3.90) the castle's people, for the Royal Commander
    const n = Math.min(CA_RESCUE.need, j.rescued.castle || 0);
    bits.push(`<span class="jg-chip${j.paid.castle ? ' done' : ''}" title="The castle's people: freed today">🏰 ${j.paid.castle ? '✓' : n + '/' + CA_RESCUE.need}</span>`);
  }
  if(typeof questHudBits === 'function') bits.push(...questHudBits());                 // (3.99) the King's fifty, then his week's challenge
  hud.innerHTML = bits.join('');
  hud.style.display = bits.length ? '' : 'none';
}

/* ---------- the map of where you have been ---------- */
function jgMapOpen(){
  if(ui.jgAlert || ui.jgTalk) return;
  releaseKeys();
  const G = jgGround(), P = G.places, j = jgState(), w = walkState(), p = w.at && w.at[JG_KEY];
  const ov = document.createElement('div');
  ov.className = 'jg-map-ov';
  const side = Math.min(window.innerWidth - 32, window.innerHeight - 180, 600);
  ov.innerHTML = `<div class="jg-map-card"><div class="jg-map-title">The Time-Lost Jungle</div>
      <canvas id="jgMapCv" width="${JG.W}" height="${JG.H}" style="width:${side}px;height:${side}px;"></canvas>
      <div class="jg-map-key">🧍 you · ${JG_TRIBE_KEYS.map(k=> JG_TRIBES[k].icon + ' ' + JG_TRIBES[k].short).join(' · ')} · 🏰 castle · 🌀 the portal</div>
      <button class="btn btn-ghost" id="jgMapClose">Close</button></div>`;
  document.body.appendChild(ov);
  const cv = ov.querySelector('#jgMapCv'), ctx = cv.getContext('2d');
  const img = ctx.createImageData(JG.W, JG.H), D = img.data;
  const COL = { 0:[44,54,24], 2:[46,111,156], 3:[150,196,110], 4:[214,196,150], 5:[132,128,160], 6:[120,80,40], 7:[150,100,60], 8:[52,64,28], 9:[170,180,120], 10:[150,190,120], 11:[170,162,146] };   // (3.95) the paths in their own green (jgFloor)
  const F = jgFloor().rgb;
  for(let y = 0; y < JG.H; y++) for(let x = 0; x < JG.W; x++){
    const i = (y * JG.W + x) * 4, seen = jgExplored(x, y), t = G.g[y * JG.W + x], c = t === JG_T.PATH ? [Math.min(255, F[i] + 24), Math.min(255, F[i + 1] + 30), Math.min(255, F[i + 2] + 18)] : (COL[t] || [0, 0, 0]);
    if(seen){ D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; } else { D[i] = 14; D[i + 1] = 22; D[i + 2] = 18; }
    D[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  JG_TRIBE_KEYS.forEach(k=>{ if(j.found[k]){ const v = P.villages[k]; ctx.fillText(JG_TRIBES[k].icon, v.x + v.w / 2, v.y + v.h / 2); } });
  if(j.found.castle) ctx.fillText('🏰', P.castle.x + P.castle.w / 2, P.castle.y + P.castle.h / 2);
  ctx.fillText('🌀', P.entry.x + P.entry.w / 2, P.entry.y + P.entry.h / 2);
  if(p){ ctx.fillStyle = '#ff4d4d'; ctx.beginPath(); ctx.arc(p.x + 0.5, p.y + 0.5, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
  const close = ()=> ov.remove();
  ov.querySelector('#jgMapClose').addEventListener('click', close);
  ov.addEventListener('click', e=>{ if(e.target === ov) close(); });
}

/* ============================================================
   THE FIGHTS
   ============================================================ */
/* A band's waves. Each: two of the tribe's fairies (the tribe whose lands it
   holds) and an alien between them; a captain's band, three; a commander's,
   six — the captain next to last, the commander last. */
/* (3.95) Whose people the jungle's bands hold: anyone's — the designer: "do
   not divide the captured fairies in waves by region. Let them be randomly
   encountered regardless of region so that a mix of fairy types are
   available." The tribes' fairies, and the castle's people as caCitizenPick
   weighs them (its townsfolk twice as often as its knights and elites); a
   tribe's fairy as often as a townsman. Each still counts for its own tribe,
   or for the castle, when it is freed. */
function jgCaptivePool(){
  const pool = Object.keys(JG_FOLK).map(id=> [id, 2]);
  if(typeof CA_CITIZENS !== 'undefined') CA_CITIZENS.forEach(id=> pool.push([id, SPECIES[id] && SPECIES[id].tier === 'wild' && !/_knight$/.test(id) ? 2 : 1]));
  return pool;
}
function jgCaptivePick(){
  const pool = jgCaptivePool();
  let r = Math.random() * pool.reduce((a, p)=> a + p[1], 0);
  for(const [id, w] of pool){ r -= w; if(r < 0) return id; }
  return pool[0][0];
}
function jgWaves(b){
  const R = Math.random, T = JG_TRIBES[b.tribe] || JG_TRIBES.water;
  /* the war's forces at a village still hold that village's own people (22-war.js) */
  const pick = ()=> b.war ? T.members[Math.floor(R() * T.members.length)] : jgCaptivePick();
  const fairy = (boss)=> ({ species:pick(), level:JG.fairyLv[0], ai:'best', nerfed:false, anyLevel:true,
    jg:{ mind:true, tribe:b.tribe },
    /* the designer: "captain and commander encounters also galvanise their fairies to use diamond dust on their respective waves" */
    veryHigh:boss ? { type:'Fairy', plus:0, cast:true } : undefined });
  const alien = (sp)=>{
    const a = JG_ALIENS[sp], rank = a.rank || 'alien', plus = JG.plus[rank];
    const lv = rank === 'commander' ? JG.aliens.lv[1] : rank === 'captain' ? Math.min(JG.aliens.lv[1], b.lv) : Math.max(JG.aliens.lv[0], b.lv - (b.rank === 'alien' ? 0 : 3));
    const vh = a.el || JG_ELEMENTS[Math.floor(R() * JG_ELEMENTS.length)];
    return { species:sp, level:lv, ai:'best', nerfed:false, anyLevel:true, jg:{ alien:rank, el:a.el, plus, lastVh:vh },
             veryHigh:{ type:vh, plus, cast:true } };
  };
  return b.aliens.map(sp=>{
    const boss = !!JG_ALIENS[sp].rank;
    return [fairy(boss), alien(sp), fairy(boss)];
  });
}
/* (3.85) the bands' music, from the first flash to the last blow (walkEncounter
   and encounterMusic): battle_region6 — the designer: "regular battle sounds
   alien" — else the walking meetings' own, else the wild theme. */
const JG_FIGHT_MUSIC = ['battle_region6', 'battle_encounter', 'battle_wild'];
function jgFight(b, seen, opts){
  if(!b || jgBandBeaten(b) || ui.jgFighting) return false;
  if(!battleParty().some(m=> m.currentHp > 0)){ b.calm = Date.now() + 10000; walkState().busy = false; toast('Your team needs healing first.'); return false; }
  ui.jgFighting = true;
  releaseKeys();
  jgSave(true);
  const waves = jgWaves(b), lead = SPECIES[b.lead].name;
  const name = b.rank === 'commander' ? `Commander ${lead}'s band` : b.rank === 'captain' ? `Captain ${lead}'s band` : `${lead} and its captives`;
  /* (4.03) what Lucesco's moves did to it, as the fight begins: still twitching from his Pulsar Glare, or ambushed
     (jgEdgeApply, on its first wave) */
  const edge = { id:b.id, glare:!!((opts && opts.glare) || jgBandStunned(b)), ambush:!!(opts && opts.ambush) };
  const begin = ()=>{
    ui.jgFighting = false;
    b._pounced = false;                                                  // (its jungle is drawn afresh after the fight)
    ui.jgFight = { id:b.id, rank:b.rank, tribe:b.tribe, waves:waves.length };
    ui.jgEdge = edge;
    beginBattle({ waves, isNpc:false, allowCatch:true, name, bgKey:'battle_jungle', foeRegion:6, encounter:true, encounterMusic:JG_FIGHT_MUSIC,
      onWaveStart:(i)=> jgWaveStart(i),
      onWin:(levelUps)=> jgWon(b, levelUps),
      onLose:()=>{ ui.jgFight = null; go('region'); } });          // lost, as any fight: the region's page, to recover
    ui.jgEdge = null;
    if(ui.battle) ui.battle.jungle = b.id;
    if(ui.battle && typeof questFightLines === 'function') questFightLines(b, ui.battle);   // (3.99) Lucesco's words in the first three
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, JG_FIGHT_MUSIC); else begin();
  return true;
}
/* A wave on the field: what each of them is (their spec's `jg`), their glow;
   the fairies at Lv 100 for a moment, then the alien's grip takes them. */
/* (3.86) The aliens' own boosts — the designer: "for normal aliens, 15% atk,
   crit chance (1.5x), dmg boost, dmg reduction, dodge%. 25% for captains,
   35% for commanders." ATK in its ATK bonuses (e.atkPct: enemyAtk), the rest
   as a talent set of its own (e.talentFx: talentFxOf) — its criticals ×1.5,
   its dodge allowed past the talents' 30%. Not the captive fairies. */
const JG_BOOST = { alien:0.15, captain:0.25, commander:0.35 };
function jgBoostFx(p){
  const fx = talentFxSum([{ fx:[{ k:'crit', v:p }, { k:'dmg', v:p }, { k:'def', v:p }, { k:'dodge', v:p }] }]);
  fx.dodgeCap = Math.max(TALENT_DODGE_CAP, p);
  fx.jgBoost = p;
  return fx;
}
function jgWaveStart(i){
  const b = ui.battle;
  if(!b) return;
  jgCss();
  const specs = b.waves[i] || [];
  b.enemies.forEach((e, k)=>{
    const sp = specs[k] || {};
    e.jg = sp.jg ? Object.assign({}, sp.jg) : null;
    if(e.jg && e.jg.alien){
      e.cls = 'jg-foe-alien' + (e.jg.alien !== 'alien' ? ' jg-foe-' + e.jg.alien : '');
      const p = JG_BOOST[e.jg.alien] || JG_BOOST.alien;
      e.atkPct = p;
      e.talentFx = jgBoostFx(p);
    }
  });
  if(i === 0 && ui.jgEdge){ b.jgEdge = ui.jgEdge; ui.jgEdge = null; jgEdgeApply(b); }   // (4.03) Lucesco's Pulsar Glare, his Rift Ambush
  setTimeout(()=> jgEnrage(b), 520);
}
function jgEnrage(b){
  if(ui.battle !== b) return;
  const to = JG.fairyLv[1];
  let n = 0;
  b.enemies.forEach(e=>{
    if(!e.jg || !e.jg.mind || e.hp <= 0 || e.jg.grown) return;
    const big = makeEnemy(e.species, to, { nerfed:false, ai:e.ai, anyLevel:true });
    const frac = e.maxHp ? e.hp / e.maxHp : 1;
    e.level = to; e.atk = big.atk; e.maxHp = big.maxHp; e.hp = Math.max(1, Math.round(big.maxHp * frac));
    e.jg.grown = true;
    e.cls = 'jg-foe-mind jg-enraging';
    n++;
  });
  if(!n) return;
  renderBattle();
  battleMsg(`😡 The alien's grip tightens — its captives' eyes burn red! They grow to Lv ${to}.`);
  setTimeout(()=>{ if(ui.battle === b) b.enemies.forEach(e=>{ if(e.cls) e.cls = e.cls.replace(' jg-enraging', ''); }); }, 1400);
}
/* Each of their actions (through futureUltraFor, which every enemy action asks):
     · a captive fairy: its Ultimate, always;
     · an alien: an Ultra on its 3rd action and every 3rd after; its Very High
       (cast before it moves, as a stone is) on its 1st and every 5th after;
     · the captain and commander: a different Very High every action. */
function jgEnemyMove(e){
  const b = ui.battle, J = e.jg;
  if(!b || !J || e._windup) return null;
  const r = roundNo();
  if(e._jgRound !== r){ e._jgRound = r; e._jgActs = (e._jgActs || 0) + 1; jgArm(e); }
  const n = e._jgActs;
  if(J.mind){
    const row = (MOVES[e.species] || []).find(m=> m[0] === 'Ultimate' && (e.level || 1) >= m[5]);
    return row || null;
  }
  if(J.alien && n >= JG.ultraFrom && (n - JG.ultraFrom) % JG.ultraEvery === 0){
    const type = J.el || JG_ELEMENTS[Math.floor(Math.random() * JG_ELEMENTS.length)];
    return enemyUltraMove(type, J.plus);
  }
  return null;
}
/* the Very High for its next action, ready before that action begins */
function jgArm(e){
  const J = e.jg, n = e._jgActs;
  if(!J || !J.alien) return;
  if(J.alien === 'alien'){
    if(n % JG.vhEvery === 0) e.stone = { type:J.el, plus:J.plus, cast:true, used:false, passiveDone:true };   // for its action n + 1: the 6th, the 11th…
    return;
  }
  const others = JG_ELEMENTS.filter(t=> t !== J.lastVh);
  J.lastVh = others[Math.floor(Math.random() * others.length)];
  e.stone = { type:J.lastVh, plus:J.plus, cast:true, used:false, passiveDone:true };
}
if(typeof futureUltraFor === 'function'){
  const _jgFutureUltraFor = futureUltraFor;
  futureUltraFor = function(e){ return (e && e.jg) ? jgEnemyMove(e) : _jgFutureUltraFor.apply(this, arguments); };
}
/* Won: the band is gone for the day; its captives are free (each counts for
   its tribe); the knights' tally; then the usual page, where a freed fairy
   you have none of can be caught — at its own Lv 100 again. */
function jgWon(b, levelUps){
  const j = jgState(), bt = ui.battle;
  j.beaten[b.id] = today();
  j.tally = (j.tally || 0) + (typeof questCountOf === 'function' ? questCountOf(b) : 1);   // (4.08) a captain's band 3, a commander's 6
  /* (4.03) a Rift Ambush won: you come back standing where you pounced on it (until it is won, where you leapt from) */
  const edge = bt && bt.jgEdge;
  if(edge && edge.ambush && edge.id === b.id){
    const w = walkState(); w.at = w.at || {};
    w.at[JG_KEY] = { x:b.x, y:b.y }; j.at = { x:b.x, y:b.y };
    ui.jgLion = null; ui.jgTrail = null;
  }
  /* every wave's captives are free now — counted for their tribes; each kind of them can be caught */
  const freed = {}, kinds = new Set();
  let citizens = 0;
  ((bt && bt.waves) || []).forEach(w=> (w || []).forEach(sp=>{
    if(!sp || !sp.jg || !sp.jg.mind) return;
    const S = SPECIES[sp.species] || {}, k = S.tribe;
    if(k) freed[k] = (freed[k] || 0) + 1;
    else if(S.citizen) citizens++;                                     // (3.90) the castle's people
    kinds.add(sp.species);
  }));
  if(bt){
    bt.enemies.forEach(e=>{ if(e.jg && e.jg.mind) e.level = JG.fairyLv[0]; });     // the grip gone: itself again
    kinds.forEach(sp=>{ if(!bt.enemies.some(e=> e.species === sp)) bt.enemies.push({ species:sp, level:JG.fairyLv[0], hp:0, maxHp:1, atk:1, stage:0, jg:{ mind:true, freed:true } }); });
  }
  /* XP: two fights' worth a wave, as an NPC's fight pays (the usual page has paid one) */
  const more = awardXpToParty(2 * (b.aliens.length || 1) - 1) || [];
  jgMergeUps(levelUps, more);
  const notes = [];
  Object.entries(freed).forEach(([k, n])=>{
    j.rescued[k] = (j.rescued[k] || 0) + n;
    notes.push(`${JG_TRIBES[k].icon} ${n} of ${JG_TRIBES[k].name} freed${j.met[k] ? ` (${Math.min(JG.daily.need, j.rescued[k])}/${JG.daily.need} today)` : ''}.`);
  });
  const pays = JG_TRIBE_KEYS.filter(k=> j.met[k] && !j.paid[k] && (j.rescued[k] || 0) >= JG.daily.need);
  pays.forEach(k=>{ j.paid[k] = true; state.inventory.tokens = (state.inventory.tokens || 0) + JG.daily.tokens; });
  /* (3.90) the Royal Commander's: 10 Skill Tokens a day for 2 of the castle's people (CA_RESCUE), once you have met him */
  let castlePays = false;
  if(citizens){
    const met = typeof caCommanderMet === 'function' && caCommanderMet(), need = CA_RESCUE.need;
    j.rescued.castle = (j.rescued.castle || 0) + citizens;
    notes.push(`🏰 ${citizens} of the castle's people freed${met ? ` (${Math.min(need, j.rescued.castle)}/${need} today)` : ''}.`);
    if(met && !j.paid.castle && j.rescued.castle >= need){
      castlePays = true; j.paid.castle = true;
      state.inventory.tokens = (state.inventory.tokens || 0) + CA_RESCUE.tokens;
    }
  }
  /* (3.99) the King's count (25-quest.js): the first three, his fifty, then his challenge each week — in place of
     the knights' weekly 50 (3.84–3.98), which paid 50 bronze medals for 50 bands and nothing for fewer */
  const kq = typeof questTally === 'function' ? questTally(b) : null;
  if(kq) notes.push(...kq.notes);
  ui.victoryNotes = (ui.victoryNotes || []).concat(notes);
  saveProfile();
  const thanks = pays.map(k=> ()=> jgTribeThanks(k)).concat(castlePays ? [()=> caCommanderThanks()] : [], kq ? kq.thanks : []);
  const next = ()=>{ const t = thanks.shift(); if(t) return t().then(next); resumeVictory(); };
  /* (3.87) an evolution the second share of XP brought plays too (it went by unseen) */
  const evolved = more.filter(e=> e && e.evos && e.evos.length);
  if(evolved.length) playEvolutions(evolved, next); else next();
}
/* the second XP's level-ups folded into the first's (the victory page shows that list) */
function jgMergeUps(ups, more){
  if(!Array.isArray(ups) || !Array.isArray(more)) return;
  more.forEach(m=>{
    const e = ups.find(x=> x && m && x.uid === m.uid);
    if(!e){ ups.push(m); return; }
    if(Number.isFinite(m.to)) e.to = Math.max(e.to || 0, m.to);
    if(Number.isFinite(m.from)) e.from = Math.min(Number.isFinite(e.from) ? e.from : m.from, m.from);
    if(m.evos && m.evos.length) e.evos = (e.evos || []).concat(m.evos);              // (3.87) the page names them too
    if(m.newMoves && m.newMoves.length) e.newMoves = (e.newMoves || []).concat(m.newMoves);
    ['breakthrough', 'ready'].forEach(k=>{ if(m[k]) e[k] = m[k]; });
  });
}
/* A flight: the band lets you go — it turns away for a while. */
function jgFled(){
  const id = ui.battle && ui.battle.jungle, b = id && jgBands().find(x=> x.id === id);
  if(b){ b.calm = Date.now() + 8000; b.face = { l:'r', r:'l', u:'d', d:'u' }[b.face]; }
  toast('Got away safely!');
  jgBack();
}
/* The victory page's ways on, for a fight in the jungle: back into it. */
function jgVictoryButtons(){
  const r = document.getElementById('regionBtn'), a = document.getElementById('againBtn');
  if(a) a.remove();
  if(r){
    const nb = r.cloneNode(false);
    nb.textContent = '🌴 Back to the jungle';
    nb.addEventListener('click', ()=> jgBack());
    r.replaceWith(nb);
  }
}
/* after the fight, the catch, or a flight: back into the jungle where you stood */
function jgBack(){
  ui.jgFight = null;
  ui.walkFresh = false;
  const w = walkState(); w.busy = false;
  go(JG_KEY);
}
/* The tribe's thanks: a popup, as the scientists' are. */
/* "one of our people", "3 of our people" */
function jgPeople(n){ return n === 1 ? 'one of our people' : `${n} of our people`; }
function jgTribeThanks(k){
  const T = JG_TRIBES[k];
  return new Promise(res=>{
    storyModal(jgMonImg(T.guardian, 140), `${T.icon} ${T.short} Guardian`,
      `<b>"You freed ${jgPeople(JG.daily.need)} today. ${T.name.replace(/^the /, 'The ')} will not forget it."</b><br><br>` +
      `${tokenIcon(18)} <b>+${JG.daily.tokens} Skill Tokens</b> (you have ${state.inventory.tokens}).<br><br><i>Free ${JG.daily.need === 1 ? 'another' : JG.daily.need + ' more'} tomorrow, and they will thank you again.</i>`,
      ()=> res(), { subtitle:T.name.replace(/^the /, 'The '), bg:'jungle' });
  });
}
/* ============================================================
   THE PEOPLE
   ============================================================ */
function jgSay(faces, name, html){
  return new Promise(res=>{
    let done = false, t = null;
    const fin = ()=>{ if(done) return; done = true; clearInterval(t); res(); };
    t = setInterval(()=>{ if(ui.screen !== JG_KEY){ document.querySelectorAll('.scene-say').forEach(x=> x.remove()); fin(); } }, 250);
    sceneSay(faces, name, html).then(fin);
  });
}
async function jgLines(faces, name, lines){
  if(ui.jgTalk) return;
  ui.jgTalk = true;
  try { for(const l of lines){ if(ui.screen !== JG_KEY) break; await jgSay(faces, name, l); } }
  finally { ui.jgTalk = false; refreshWalk(); }
}
const jgFace = (file, alt)=> `<img src="assets/mon/${file}.png" alt="" onerror="${alt ? `if(!this.dataset.alt){this.dataset.alt=1;this.src='assets/mon/${alt}.png';}else{this.replaceWith(document.createTextNode('🧚'));}` : `this.replaceWith(document.createTextNode('🧚'))`}">`;   // (3.87) `alt` stands in
const JG_LION_LINES = [
  `<b>"These paths twist and turn. When one ends, go back to the last fork and try another."</b>`,
  `<b>"An alien looks only straight ahead — four steps. Keep out of its line, or face it."</b>`,
  `<b>"The fairies with them are not wicked. Their minds are not their own. Beat the alien's band, and they are free."</b>`,
  `<b>"Four tribes live in the corners of this land, they say — but nobody has seen them in two hundred years. The Fairy King's castle stands in the middle."</b>`,
  `<b>"If you are lost, look at the map. It shows where we have been."</b>`,
  `<b>"Face a wall of trees only one tree thick, and I can leap it with you on my back. Then I need fifty steps to get my breath back."</b>`,   // (3.96)
];
function jgLionTalk(){
  if(typeof questLionTalk === 'function') return questLionTalk();     // (3.99) what to sniff out, and where the story is
  return jgLionChat();
}
function jgLionChat(){
  const j = jgState();
  j.talk.lion = (j.talk.lion || 0) + 1;
  return jgLines([riftLucescoFace()], 'Lucesco', [JG_LION_LINES[(j.talk.lion - 1) % JG_LION_LINES.length]]);
}
/* A tribe's guardian: the first time, who they are and what they ask; after, how the day stands. */
async function jgGuardian(k){
  const T = JG_TRIBES[k], j = jgState(), face = [jgFace(T.guardian)], nm = `${T.short} Guardian`;
  /* (3.99) met at the barricade now (25-quest.js), so anyone in the village has met them; this first meeting is
     only for a save that somehow walked in without it */
  if(!j.met[k]){
    await jgLines(face, nm, [
      `A tall figure in a great ${T.short.toLowerCase()} mask steps out of the lodge, a staff in its hand. Fairies peep out from the huts behind it.`,
      `<b>"Stop, strangers. …You walk with Lucesco? Then you are friends of the Fairy King."</b>`,
      `<b>"The invaders came through the torn sky. They took our people — they bend their minds and make them fight."</b>`,
      `<b>"Free ${JG.daily.need === 1 ? 'one' : JG.daily.need} of ${T.name.replace(/^the /, 'the ')}'s people each day — beat the aliens that hold them — and we will give you ${tokenIcon(18)} ${JG.daily.tokens} Skill Tokens."</b>`,
    ]);
    j.met[k] = true; saveProfile(); jgHud(); refreshWalk();
    return;
  }
  const n = Math.min(JG.daily.need, j.rescued[k] || 0);
  await jgLines(face, nm, [j.paid[k]
    ? `<b>"You freed ${jgPeople(JG.daily.need)} today. Rest, friends — come back tomorrow."</b>`
    : `<b>"${n ? jgPeople(n).replace(/^one/, 'One') + ' freed today.' : 'None of our people freed yet today.'} ${JG.daily.need - n === 1 ? 'One more' : (JG.daily.need - n) + ' more'}, and the tribe will thank you."</b><br><br><i>Any band in the jungle may hold some of ${T.name.replace(/^the /, 'the ')}'s people.</i>`]);
}
async function jgKnights(){
  const j = jgState(), face = [jgFace(JG_GATE_KNIGHT + '_front', 'fairy_knight_front')], nm = JG_GATE_KNIGHT_NAME;
  if(!j.met.knights){
    await jgLines(face, nm, [
      `Two knights in polished armour cross their spears in front of the gate.<br><br><b>"Halt! Who comes to the castle of the Fairy King?"</b>`,
      `They see Lucesco, and lower their spears at once.<br><br><b>"Lucesco! The Lion of the Rift himself. Then these are the travellers His Majesty spoke of."</b>`,
      `<b>"His Majesty the Fairy King is home from the front, where the rift in our sky is widest. He is in the palace — go in, he will want to see you at once."</b>`,
    ]);
    j.met.knights = true; saveProfile(); jgHud(); refreshWalk();
    /* (3.88) …and the gates open */
    if(typeof caGateOpens === 'function' && !caOpen()) return caGateOpens();
    return;
  }
  await jgLines(face, nm, [typeof questKnightLine === 'function' ? questKnightLine() : `<b>"For the King!"</b>`]);   // (3.99) the King keeps the count now
}
function jgGate(){
  /* (3.88) the King is home: the knights you have met open it, and then it stands open */
  if(typeof caOpen === 'function' && caOpen()) return caEnter();
  if(typeof caCanOpen === 'function' && caCanOpen()) return caGateOpens();
  return jgLines([], '', [`The great doors are shut, carved with flowers and stars. Beyond them you can hear fountains.<br><br><i>Speak to the knights first.</i>`]);
}

/* ============================================================
   THE STORY: the Council's call, the portal, the first walk in
   ============================================================ */
const JG_CALL = [
  `The Council's ring of lights is flashing — and one of them, green and gold, burns brighter than all the rest. Vesper squawks and flaps.`,
  `A voice, deep and kind, comes out of the console:<br><br><b>"Travellers of the Rift. I am the Fairy King, of the Cosmic Council. I need your help."</b>`,
  `<b>"When Nemesis tore through time, it tore the sky of my world too. Through the tear came invaders — aliens from beyond the stars. They have taken my people's minds."</b>`,
  `<b>"Nemesis meant it to happen. With my world in chaos, the Council is half blind, and cannot hunt it."</b>`,
  `<b>"Drive them out, and I will guide you through the tangled timelines — all the way to Nemesis's past."</b>`,
  `The light flickers out. Across the room, one of the small portals begins to glow green.`,
];
/* Played inside Vesper's visit to the station (riftCouncil), when the call is due. */
async function jgCouncilCall(){
  const king = [`<span class="rift-face-art jg-king-light">${jgKingLightSvg()}</span>`];
  for(let i = 0; i < JG_CALL.length; i++){
    if(ui.screen !== 'r6_rift') return false;
    await riftSay(i === 0 || i === JG_CALL.length - 1 ? [riftVesperFace()] : king, i === 0 || i === JG_CALL.length - 1 ? 'Vesper' : 'The Fairy King', JG_CALL[i]);
  }
  jgState().called = true;
  saveProfile();
  return true;
}
/* The Rift's upper small portal, awake: the first time, Lucesco goes with you. */
async function jgRiftPortal(){
  if(ui.riftTalk) return;
  if(!jgState().seen){
    ui.riftTalk = true;
    try { await riftSay([riftLucescoFace()], 'Lucesco', `The small portal is glowing green, and the smell of rain and flowers drifts out of it.<br><br><b>"The Fairy King's world. This time, I will walk with you — Cuain cannot find the way there."</b>`); }
    finally { ui.riftTalk = false; }
    if(ui.screen === 'r6_rift') jgEnter('entry');
    return;
  }
  jgChooser(false);
}
function jgKingLightSvg(){
  return `<svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true"><defs><radialGradient id="jgKL"><stop offset="0" stop-color="#fffbe0"/><stop offset=".4" stop-color="#b9f0a0"/><stop offset="1" stop-color="#3a8a4a" stop-opacity="0"/></radialGradient></defs>` +
    `<circle cx="40" cy="40" r="36" fill="url(#jgKL)"/><path d="M40,16 l5,15 15,5 -15,5 -5,15 -5,-15 -15,-5 15,-5 z" fill="#fff8c8"/>` +
    `<path d="M24,58 l4,-12 6,8 6,-12 6,12 6,-8 4,12 z" fill="#e9c75a" stroke="#a8862c" stroke-width="1.5"/></svg>`;
}
/* the portal, awake: the first time straight in; after, where to */
function jgPortal(){
  if(!jgPortalAwake()) return false;
  if(!jgState().seen) return jgEnter('entry');
  jgChooser(false);
  return true;
}
/* Where to start: where you left off, or a place you have found (the designer:
   "explore offers starting from the last point, or from one of the 5
   civilizations once discovered"). From Region 6's Explore it offers the Rift too. */
function jgChooser(withRift){
  /* (4.07) the designer: "The explore screen in region 6 is too large and pushes options off screen. Can we make it
     mirror the UI of interacting directly with the portal?" Opened from Region 6's Explore before the jungle (or the
     Rift, whose awake portal brings them) had been drawn this visit, the list had none of its styles: each picture at
     its full size, the card 1,442px tall. Its styles first, wherever it is opened from. */
  jgCss();
  if(typeof riftCss === 'function') riftCss();
  const j = jgState(), opts = [];
  /* (3.97) the designer: "include the portal itself as a quick travel destination. Replace the emoticons that show
     each destination with the guardians' pictures and the king's picture for the tribes and castle respectively. For
     where the player last left off, show Lucesco's image." */
  const pic = (file, alt)=> `<img class="jg-go-pic" src="assets/mon/${file}.png" alt="" onerror="this.replaceWith(document.createTextNode('${alt}'))">`;
  if(withRift) opts.push({ k:'rift', pic:'<span class="jg-go-pic jg-go-emoji">🌀</span>', name:'The Time Rift', sub:'Selene, Vesper and the portals' });
  if(j.at) opts.push({ k:'last', pic:pic('lucesco_front', '🦁'), name:'Where you left off', sub:'Lucesco remembers the way' });
  opts.push({ k:'entry', pic:`<span class="jg-go-pic jg-go-portal">${typeof riftPortalSvg === 'function' ? riftPortalSvg(false) : '🌀'}</span>`, name:'The portal', sub:'The glade where the jungle begins' });
  JG_TRIBE_KEYS.forEach(k=>{ if(j.found[k]) opts.push({ k, pic:pic(JG_TRIBES[k].guardian, JG_TRIBES[k].icon), name:JG_TRIBES[k].name.replace(/^the /, 'The '), sub:'Their village, by their guardian' }); });
  if(j.found.castle) opts.push({ k:'castle', pic:pic('fairy_king_c_front', '🏰'), name:'The Fairy King\'s castle', sub:(typeof caOpen === 'function' && caOpen()) ? 'Inside its gates' : 'The south gate' });   // (3.89) in, once it is open
  if(!withRift && opts.length === 1) return jgEnter(opts[0].k);
  const ov = document.createElement('div');
  ov.className = 'refine-scrim jg-choose';
  ov.innerHTML = `<div class="refine-card"><div class="refine-name">Where to?</div>
      <div class="jg-choose-list">${opts.map(o=> `<button class="btn btn-ghost jg-go" data-k="${o.k}">${o.pic}<span class="jg-go-words">${escapeHtml(o.name)}<small>${escapeHtml(o.sub)}</small></span></button>`).join('')}</div>
      <button class="btn btn-ghost" id="jgChooseNo" style="margin-top:10px;">Cancel</button></div>`;
  document.body.appendChild(ov);
  const close = ()=> ov.remove();
  ov.addEventListener('click', e=>{ if(e.target === ov) close(); });
  ov.querySelector('#jgChooseNo').addEventListener('click', ()=>{ close(); if(withRift) go('region'); });
  ov.querySelectorAll('.jg-go').forEach(btn=> btn.addEventListener('click', ()=>{
    close();
    const k = btn.dataset.k;
    if(k === 'rift') return riftGo();
    if(k === 'castle' && typeof caOpen === 'function' && caOpen() && typeof caEnter === 'function') return caEnter();
    jgEnter(k);
  }));
}
/* The first walk in: Cuain stays behind, Lucesco comes. */
async function jgArrive(){
  const j = jgState();
  if(j.seen || ui.jgTalk) return;
  ui.jgTalk = true;
  const w = walkState(), p = w.at[JG_KEY];
  w.busy = true;
  const lion = document.getElementById('jgLion');
  if(lion) lion.classList.add('jg-hidden');
  let gh = null;
  try {
    await jgSay([], '', `The portal spins you out onto soft moss. Giant trees close over your heads, and the air hums — as if time here had lost its place.`);
    if(r4().ghostAccepted && p){
      gh = document.createElement('div');
      gh.className = 'walk-ent walk-ghost jg-cuain';
      gh.innerHTML = monPortrait('whalelord', 30, { view:'front', bare:true, crowned:whaleName() === 'Cuain' });
      gh.style.transform = `translate3d(${(p.x - 1) * WALK_T}px,${p.y * WALK_T}px,0)`;
      gh.style.zIndex = 10 + p.y;
      $('#walkWorld').appendChild(gh);
      const nm = whaleName();
      await jgSay([faceMon('whalelord')], nm, `<b>"Whatever waits in here, I am with you. At the slightest sign of trouble, I will come."</b>`);
      await jgSay([faceMon('whalelord')], nm, `<b>"But this is not my world, and I cannot find the way in it. You need someone who walks between worlds."</b>`);
      gh.classList.add('jg-fade');
      await new Promise(r=> setTimeout(r, 900));
    }
    if(lion){ lion.classList.remove('jg-hidden'); lion.classList.add('jg-appear'); }
    await new Promise(r=> setTimeout(r, 500));
    /* (3.99) the designer: "the forest has grown much thicker since he last came to the Fairy King's domain. He can
       recognise the castle's direction and leap some obstacles, and will guide the player to the king." */
    await jgSay([riftLucescoFace()], 'Lucesco', `<b>"Rrrr… The forest has grown so thick since I last came to the Fairy King's lands. I hardly know it."</b>`);
    await jgSay([riftLucescoFace()], 'Lucesco', `<b>"But I still know the smell of his castle — it lies that way. And where the trees stand only one deep, I can leap them with you on my back."</b>`);
    await jgSay([riftLucescoFace()], 'Lucesco', `<b>"Stay close. These paths wind and split, and many go nowhere. I will take you to the King."</b>`);
    await jgSay([riftLucescoFace()], 'Lucesco', `<b>"Climb onto my back. My paws know these paths better than your feet."</b>`);   // (4.03)
    j.seen = true;
    saveProfile();
    await jgMount();                                    // (4.03) he comes onto your square: from here on you ride him
  } finally {
    if(gh) gh.remove();
    ui.jgTalk = false;
    w.busy = false;
    refreshWalk();
  }
  if(typeof questArrived === 'function' && ui.screen === JG_KEY) questArrived();   // (3.99) and at once, the first aliens
}

/* ---------- its backdrop: a green dusk under the canopy ---------- */
let _jgSky = null;
function jungleSkyUri(){
  if(_jgSky) return _jgSky;
  try {
    const c = document.createElement('canvas');
    c.width = 160; c.height = 320;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 320);
    gr.addColorStop(0, '#0f2a1a'); gr.addColorStop(0.5, '#1f4a2c'); gr.addColorStop(1, '#3d6b3a');
    g.fillStyle = gr; g.fillRect(0, 0, 160, 320);
    for(let k = 0; k < 40; k++){
      g.fillStyle = `rgba(${40 + (k * 13) % 50},${90 + (k * 29) % 70},${40 + (k * 7) % 40},.5)`;
      g.beginPath(); g.arc((k * 37) % 160, (k * 53) % 90, 14 + (k * 11) % 18, 0, Math.PI * 2); g.fill();
    }
    for(let k = 0; k < 18; k++){ g.fillStyle = 'rgba(255,250,190,.5)'; g.beginPath(); g.arc((k * 61) % 160, 120 + (k * 43) % 190, 1.2, 0, Math.PI * 2); g.fill(); }
    _jgSky = c.toDataURL('image/png');
  } catch(e){ _jgSky = ''; }
  return _jgSky;
}

/* ============================================================
   LOOKS
   ============================================================ */
let _jgCss = false;
function jgCss(){
  if(_jgCss || typeof document === 'undefined') return;
  _jgCss = true;
  const s = document.createElement('style');
  s.id = 'jgCss';
  s.textContent = `
  .walk-stage.jg-stage{ background:#2a3417; }
  .jg-rays{ position:absolute; inset:0; z-index:3; pointer-events:none; overflow:hidden; mix-blend-mode:screen; }
  .jg-rays i{ position:absolute; top:-45%; left:var(--x); width:var(--w); height:190%; opacity:var(--o); transform-origin:50% 0; will-change:transform;
    -webkit-mask-image:linear-gradient(180deg, transparent 0%, #000 22%, #000 58%, transparent 95%); mask-image:linear-gradient(180deg, transparent 0%, #000 22%, #000 58%, transparent 95%);
    animation:jgRaySway var(--d) ease-in-out var(--dl) infinite alternate; }
  .jg-rays i::before{ content:''; position:absolute; inset:0;
    background:linear-gradient(90deg, rgba(255,204,92,0) 0%, rgba(255,214,112,.40) 28%, rgba(255,234,164,.62) 50%, rgba(255,214,112,.40) 72%, rgba(255,204,92,0) 100%);
    animation:jgRayGlow calc(var(--d) * .62) ease-in-out var(--dl) infinite alternate; }
  .jg-rays i::after{ content:''; position:absolute; left:0; right:0; top:-40%; height:180%;
    background:repeating-linear-gradient(180deg, rgba(255,242,196,0) 0px, rgba(255,242,196,0) 80px, rgba(255,246,206,.26) 120px, rgba(255,242,196,0) 160px);
    animation:jgRayFall 8s linear var(--dl) infinite; }
  @keyframes jgRaySway{ from{ transform:rotate(23deg) translateX(-16%); } to{ transform:rotate(29deg) translateX(18%); } }
  @keyframes jgRayGlow{ from{ opacity:.28; } to{ opacity:1; } }
  @keyframes jgRayFall{ from{ transform:translateY(-160px); } to{ transform:translateY(0); } }
  @media (prefers-reduced-motion: reduce){ .jg-rays i, .jg-rays i::before, .jg-rays i::after{ animation:none; } .jg-rays i{ transform:rotate(26deg); } }
  .jg-ground{ position:absolute; left:0; top:0; display:block; z-index:0; pointer-events:none; }   /* (3.96) inside the world: placed and sized as it is painted */
  .jg-over{ position:absolute; left:0; top:0; display:block; z-index:1000; pointer-events:none; }   /* (3.96) the crowns over the paths: over everyone */
  .jg-stage .walk-world{ z-index:1; }
  .walk-ent.jg-lion{ transition:transform .2s linear, opacity .5s; }
  .walk-ent.jg-lion.jg-hidden{ opacity:0; }
  .walk-ent.jg-lion.jg-appear{ animation:jgAppear .7s ease-out both; }
  @keyframes jgAppear{ from{ opacity:0; filter:brightness(3) drop-shadow(0 0 12px #fff8c0); } to{ opacity:1; filter:none; } }
  .walk-ent.jg-cuain{ transition:opacity .9s, filter .9s; }
  .walk-ent.jg-cuain.jg-fade{ opacity:0; filter:blur(3px) brightness(1.6); }
  .jg-portal{ position:absolute; pointer-events:none; filter:hue-rotate(80deg) saturate(1.3) drop-shadow(0 0 10px rgba(120,255,160,.6)); }
  .jg-portal > svg{ width:100%; height:100%; display:block; overflow:visible; }
  .jg-portal .rp-swirl{ opacity:.85 !important; }
  .jg-portal .rp-sleep{ animation:none !important; opacity:1 !important; }
  .rift-portal.jg-awake{ filter:hue-rotate(80deg) saturate(1.3) drop-shadow(0 0 10px rgba(120,255,160,.65)); }
  .rift-portal.jg-awake .rp-swirl{ opacity:.85 !important; animation-duration:9s !important; }
  .rift-portal.jg-awake .rp-sleep{ animation:none !important; opacity:1 !important; }
  .walk-ent.jg-npc{ overflow:visible; }
  /* (3.96) centred with translate, not transform: face-r's scale:-1 1 (13-walkmap.js) is applied
     after a transform, so it mirrored the shift too and the picture jumped its own width to the
     right ("they flip to a different square when approached from the right") */
  .walk-ent.jg-npc .jg-art{ position:absolute; left:50%; bottom:0; translate:-50% var(--feet, 0); transform:none; image-rendering:pixelated; pointer-events:none;
    filter:drop-shadow(0 3px 2px rgba(0,0,0,.35)); }   /* transform:none: its own size, not a person's 1.314 (index.html), as before 3.96 */
  /* (3.96) the villages' people: a gentle hover (fairies), a hop as they step, a word bubble as they talk */
  .walk-ent.jg-folk{ overflow:visible; pointer-events:none; transition:transform .62s linear, opacity .45s; }
  .walk-ent.jg-folk-potter{ transition:transform .9s ease-in-out, opacity .45s; }
  .walk-ent.jg-folk.jg-fresh{ transition:none; }
  .walk-ent.jg-folk::before{ content:''; position:absolute; left:26%; right:26%; bottom:-3%; height:15%; border-radius:50%; background:rgba(8,20,4,.22); }
  .walk-ent.jg-folk .jg-folk-art{ position:absolute; left:50%; image-rendering:pixelated; pointer-events:none; filter:drop-shadow(0 2px 1px rgba(0,0,0,.28));
    transform:none; animation:jgHover 2.4s ease-in-out var(--fd, 0s) infinite; }   /* (not a person's 1.314: sized by jgFolkImg) */
  .walk-ent.jg-folk.jg-step .jg-folk-art{ animation:jgFolkHop .62s ease-in-out, jgHover 2.4s ease-in-out var(--fd, 0s) infinite; }
  .walk-ent.jg-folk.talking .jg-folk-art{ animation:jgFolkTalk .42s ease-in-out infinite alternate; }
  .walk-ent.jg-folk.jg-in{ opacity:0; }
  @keyframes jgHover{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-4%); } }
  @keyframes jgFolkHop{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-9%); } }
  @keyframes jgFolkTalk{ from{ transform:translateY(0) rotate(0deg); } to{ transform:translateY(-3%) rotate(-3deg); } }
  .jg-say{ position:absolute; font:900 calc(var(--wt, 48px) * .3)/1 'Nunito',sans-serif; color:#3a3a3a; background:#fffef6; border-radius:9px;
    padding:3px 6px; min-width:1.4em; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,.35); opacity:0; transform:scale(.6); transition:opacity .18s, transform .18s; pointer-events:none; z-index:2; white-space:nowrap; font-style:normal; }
  .jg-say.r{ left:58%; } .jg-say.l{ right:58%; }
  .jg-say::after{ content:''; position:absolute; bottom:-4px; width:8px; height:8px; background:#fffef6; transform:rotate(45deg); }
  .jg-say.r::after{ left:6px; } .jg-say.l::after{ right:6px; }
  .walk-ent.jg-folk.talking .jg-say{ opacity:1; transform:scale(1); }
  /* (3.96) Lucesco's leap: you on his back, over the trees */
  .walk-you.jg-riding, .walk-ent.jg-lion.jg-riding{ opacity:0 !important; transition:none !important; }
  .walk-ent.jg-lion.jg-fresh{ transition:none !important; }
  .walk-ent.jg-ride{ overflow:visible; pointer-events:none; }
  .jg-ride .jg-ride-arc{ position:absolute; inset:0; transform-origin:50% 100%; }
  .jg-ride.face-r .jg-ride-arc{ scale:-1 1; }
  .jg-ride .jg-ride-lion, .jg-ride .jg-ride-you, .jg-ride .jg-ride-mane{ position:absolute; image-rendering:pixelated; pointer-events:none; max-width:none; transform:none; object-fit:fill; }
  .jg-ride .jg-ride-rider{ position:absolute; pointer-events:none; }
  .jg-ride .jg-ride-lion{ filter:drop-shadow(0 0 5px rgba(255,140,60,.6)); }
  .jg-ride .jg-ride-shadow{ position:absolute; left:4%; right:4%; bottom:-10%; height:26%; border-radius:50%; background:rgba(0,0,0,.3); }
  .wact.lion.leap{ background:#c0702c; border-color:#8e4f1a; color:#fff; }
  /* (4.03) riding him: you astride his back as you walk (#walkYou, the deck's youArt); his own picture put away */
  .walk-ent.jg-lion.jg-off{ display:none !important; }
  .walk-you .jg-mount{ position:absolute; inset:0; pointer-events:none; }
  .walk-you.face-r .jg-mount .jg-ride-arc{ scale:-1 1; }
  .jg-ride .jg-stars{ display:none; }
  /* Pulsar Glare: his eyes ablaze for the second the beam lasts, the beam itself (over the crowns: it goes through trees) */
  .jg-ride .jg-eyes{ position:absolute; border-radius:50%; pointer-events:none; opacity:0; z-index:1;
    background:radial-gradient(ellipse closest-side, #fff 0 14%, rgba(255,110,90,1) 30%, rgba(255,25,25,.85) 55%, rgba(255,0,0,0) 100%); }
  .jg-ride .jg-eyes.on{ animation:jgEyes 1s ease-out both; }
  .jg-ride .jg-eyes.on::after{ content:''; position:absolute; left:-90%; right:-90%; top:-150%; bottom:-150%; border-radius:50%;
    background:radial-gradient(ellipse closest-side, rgba(255,50,30,.6), rgba(255,0,0,.18) 60%, rgba(255,0,0,0)); animation:jgEyesHalo .16s ease-in-out infinite alternate; }
  @keyframes jgEyes{ 0%{ opacity:0; transform:scale(.4); } 7%{ opacity:1; transform:scale(1.6); } 18%{ transform:scale(1.05); } 30%{ transform:scale(1.7); } 44%{ transform:scale(1.1); }
    58%{ transform:scale(1.75); } 74%{ opacity:1; transform:scale(1.2); } 100%{ opacity:0; transform:scale(2); } }
  @keyframes jgEyesHalo{ from{ transform:scale(.8); opacity:.75; } to{ transform:scale(1.3); opacity:1; } }
  .jg-beam{ position:absolute; height:0; z-index:1003; pointer-events:none; transform-origin:0 0; }
  .jg-beam i{ position:absolute; left:0; right:0; top:-8px; height:16px; border-radius:8px; font-style:normal;
    background:linear-gradient(180deg, rgba(255,0,0,0), rgba(255,30,30,.7) 30%, rgba(255,110,90,.95) 50%, rgba(255,30,30,.7) 70%, rgba(255,0,0,0));
    box-shadow:0 0 16px 5px rgba(255,20,20,.6); animation:jgBeamThrob .07s linear infinite alternate; }
  .jg-beam b{ position:absolute; left:0; right:0; top:-2px; height:4px; border-radius:2px; background:#fff; box-shadow:0 0 6px #fff, 0 0 12px #ff5040; }
  .jg-beam em{ position:absolute; right:-22px; top:-22px; width:44px; height:44px; border-radius:50%; font-style:normal;
    background:radial-gradient(circle closest-side, #fff 0 16%, rgba(255,90,70,.95) 38%, rgba(255,0,0,.4) 66%, rgba(255,0,0,0) 100%); animation:jgBeamHit .09s ease-in-out infinite alternate; }
  .jg-beam::before{ content:''; position:absolute; left:-14px; top:-14px; width:28px; height:28px; border-radius:50%;
    background:radial-gradient(circle closest-side, #fff 0 20%, rgba(255,70,50,.85) 45%, rgba(255,0,0,0)); }
  @keyframes jgBeamThrob{ from{ transform:scaleY(.75); opacity:.85; } to{ transform:scaleY(1.3); opacity:1; } }
  @keyframes jgBeamHit{ from{ transform:scale(.75); } to{ transform:scale(1.35); } }
  .jg-beam.out{ opacity:0; transition:opacity .2s ease-out; }
  /* the alien under the beam: black, flipping between tilts, lightning all over it; after it, paralysed: tipped
     forward and shaking, red sparks (jgBoltsRun) — forward is the way it faces (--fw) */
  .jg-band.jg-zap .jg-alien-art .jg-art{ filter:brightness(0) drop-shadow(0 0 2px #ff3a3a) drop-shadow(0 0 8px rgba(255,0,0,.95)) !important;
    animation:jgZapTilt .32s steps(1, end) infinite !important; transform-origin:50% 92%; }
  @keyframes jgZapTilt{ 0%{ rotate:-18deg; translate:-2px 0; } 12.5%{ rotate:14deg; translate:2px -1px; } 25%{ rotate:-7deg; translate:-1px 1px; } 37.5%{ rotate:19deg; translate:2px 0; }
    50%{ rotate:-12deg; translate:-2px -1px; } 62.5%{ rotate:6deg; translate:1px 1px; } 75%{ rotate:-20deg; translate:-2px 0; } 87.5%{ rotate:9deg; translate:2px -1px; } }
  .jg-band.jg-stun:not(.jg-zap) .jg-alien-art .jg-art{ --fw:-1; filter:drop-shadow(0 0 3px #000) drop-shadow(0 0 9px rgba(255,30,30,.95)) !important;
    animation:jgStunShake .12s linear infinite !important; transform-origin:50% 94%; }
  .jg-band.jg-stun:not(.jg-zap) .jg-alien-art.face-r .jg-art{ --fw:1; }
  @keyframes jgStunShake{ 0%{ rotate:calc(var(--fw) * 11deg); translate:-1px 0; } 25%{ rotate:calc(var(--fw) * 13.5deg); translate:1px 0; }
    50%{ rotate:calc(var(--fw) * 10deg); translate:0 1px; } 75%{ rotate:calc(var(--fw) * 12.5deg); translate:-1px -1px; } 100%{ rotate:calc(var(--fw) * 11deg); translate:-1px 0; } }
  .jg-band .jg-bolts{ position:absolute; left:-40%; top:-60%; width:180%; height:180%; overflow:visible; pointer-events:none; z-index:3; }
  .jg-bolts polyline{ fill:none; stroke-linecap:round; stroke-linejoin:round; }
  .jg-bolts .g{ stroke:#ff2626; stroke-width:5; opacity:.5; }
  .jg-bolts .c{ stroke:#ffd9d9; stroke-width:1.4; }
  .jg-band.jg-zap .jg-bolts .g{ stroke-width:6; opacity:.75; }
  .jg-band.jg-zap .jg-bolts .c{ stroke:#fff; stroke-width:1.8; }
  .jg-band.jg-stun .jg-mark{ display:none; }
  /* time stopped: everything held where it is drawn, its own motions paused too — but his eyes and the struck alien's */
  .walk-world.jg-frozen .walk-ent:not(.walk-you):not(.jg-fx-on), .walk-world.jg-frozen .walk-ent:not(.walk-you):not(.jg-fx-on) *{ animation-play-state:paused !important; }
  /* Rift Ambush: (4.05) you both darken into starlight, a faint red glow swirling round you; fly and fade as another
     silhouette fades in on its square; a red pulse, and there you are on it, a slow purple shockwave going out */
  .walk-you.jg-starry .jg-ride-lion{ filter:drop-shadow(0 0 5px rgba(255,140,60,0)) brightness(0) !important; transition:filter .4s cubic-bezier(.2,.55,.45,1); }
  .walk-you.jg-starry .jg-ride-you{ filter:brightness(0) !important; transition:filter .4s cubic-bezier(.2,.55,.45,1); }
  .walk-you.jg-starry .jg-ride-mane{ opacity:0 !important; }
  .walk-you.jg-starry .jg-ride-arc{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)); }
  .walk-you.jg-starry .jg-stars{ display:block; position:absolute; pointer-events:none; font-style:normal;
    -webkit-mask-size:100% 100%; mask-size:100% 100%; -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat;
    background:radial-gradient(1.6px 1.6px at 20% 30%, #fff, rgba(255,255,255,0) 70%), radial-gradient(1.2px 1.2px at 70% 20%, #fff, rgba(255,255,255,0) 70%),
      radial-gradient(1.8px 1.8px at 45% 65%, #fff, rgba(255,255,255,0) 70%), radial-gradient(1.1px 1.1px at 80% 75%, #dfe8ff, rgba(255,255,255,0) 70%),
      radial-gradient(1.4px 1.4px at 15% 80%, #fff, rgba(255,255,255,0) 70%), radial-gradient(1.1px 1.1px at 55% 40%, #e6dcff, rgba(255,255,255,0) 70%),
      linear-gradient(160deg, #1d0f52, #43208a 45%, #140838);
    background-size:17px 17px, 23px 23px, 29px 29px, 13px 13px, 19px 19px, 11px 11px, 100% 100%;
    animation:jgStarDrift 1.1s linear infinite, jgStarsIn .42s cubic-bezier(.25,.4,.5,1) both; }
  @keyframes jgStarDrift{ from{ background-position:0 0, 0 0, 0 0, 0 0, 0 0, 0 0, 0 0; } to{ background-position:17px -17px, -23px 23px, 29px 29px, -13px -13px, 19px -19px, 11px 11px, 0 0; } }
  @keyframes jgStarsIn{ from{ opacity:0; } to{ opacity:1; } }
  /* the faint red glow swirling round the silhouette: a red shadow going round it, under its purple rim */
  .walk-you.jg-swirl .jg-ride-arc{ animation:jgSwirl 1.05s linear infinite; }
  .walk-you.jg-ghost .jg-stars{ animation:jgStarDrift 1.1s linear infinite !important; }   /* the one fading in: starry from the first */
  @keyframes jgSwirl{
    0%{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)) drop-shadow(4px 0 8px rgba(255,40,40,.58)); }
    12.5%{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)) drop-shadow(2.8px 2.8px 7px rgba(255,40,40,.5)); }
    25%{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)) drop-shadow(0 4px 8px rgba(255,40,40,.58)); }
    37.5%{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)) drop-shadow(-2.8px 2.8px 7px rgba(255,40,40,.5)); }
    50%{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)) drop-shadow(-4px 0 8px rgba(255,40,40,.58)); }
    62.5%{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)) drop-shadow(-2.8px -2.8px 7px rgba(255,40,40,.5)); }
    75%{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)) drop-shadow(0 -4px 8px rgba(255,40,40,.58)); }
    87.5%{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)) drop-shadow(2.8px -2.8px 7px rgba(255,40,40,.5)); }
    100%{ filter:drop-shadow(0 0 3px rgba(170,140,255,.95)) drop-shadow(0 0 9px rgba(120,90,255,.6)) drop-shadow(4px 0 8px rgba(255,40,40,.58)); } }
  /* the reveal: a bright red pulse under you both, then a slow purple shockwave from his middle */
  .jg-pulse, .jg-wave{ position:absolute; pointer-events:none; border-radius:50%; font-style:normal; }
  .jg-pulse{ background:radial-gradient(circle closest-side, rgba(255,240,235,.95) 0 16%, rgba(255,80,60,1) 32%, rgba(255,25,25,.8) 50%, rgba(255,0,0,.3) 64%, rgba(255,0,0,0) 76%);
    animation:jgPulse .46s cubic-bezier(.1,.75,.35,1) forwards; }
  @keyframes jgPulse{ 0%{ transform:scale(.62); opacity:1; } 28%{ transform:scale(1.02); opacity:1; } 100%{ transform:scale(1.42); opacity:0; } }
  .jg-wave{ border:3px solid rgba(200,165,255,.9); box-shadow:0 0 10px 3px rgba(150,100,255,.75), inset 0 0 14px 3px rgba(150,100,255,.6);
    background:radial-gradient(1.4px 1.4px at 22% 30%, #fff, rgba(255,255,255,0) 70%), radial-gradient(1.2px 1.2px at 74% 62%, #e9e0ff, rgba(255,255,255,0) 70%),
      radial-gradient(1.6px 1.6px at 40% 80%, #fff, rgba(255,255,255,0) 70%), radial-gradient(circle closest-side, rgba(120,80,255,0) 55%, rgba(120,80,255,.28) 82%, rgba(120,80,255,0) 100%);
    background-size:13px 13px, 17px 17px, 21px 21px, 100% 100%;
    animation:jgWave 1.15s cubic-bezier(.18,.55,.3,1) .06s both; }
  @keyframes jgWave{ 0%{ transform:scale(.18); opacity:0; } 8%{ opacity:1; } 100%{ transform:scale(2.5); opacity:0; } }
  /* pounced on: it falls flat along the bottom of its square, backwards, and he stands on it */
  .jg-band.jg-pounced .jg-alien-art .jg-art{ animation:none !important; rotate:90deg; translate:-50% -8%; transform-origin:50% 100%;
    transition:rotate .18s ease-in, translate .18s ease-in; filter:drop-shadow(0 0 3px #000) drop-shadow(0 0 7px rgba(210,20,30,.9)) brightness(.9) !important; }
  .jg-band.jg-pounced .jg-alien-art.face-r .jg-art{ rotate:-90deg; translate:50% -8%; }
  .jg-band.jg-pounced .jg-mark, .jg-band.jg-pounced .jg-cone{ display:none !important; }
  .wact.lion.glare{ background:#8e1d22; border-color:#5e1014; color:#fff; }
  .wact.lion.ambush{ background:#3b2a7a; border-color:#251a52; color:#fff; }
  @media (prefers-reduced-motion: reduce){ .jg-band.jg-zap .jg-alien-art .jg-art, .jg-band.jg-stun .jg-alien-art .jg-art, .walk-you.jg-starry .jg-stars, .walk-you.jg-swirl .jg-ride-arc, .jg-beam i, .jg-beam em{ animation:none !important; } }
  .walk-ent.jg-band{ transition:transform .3s linear; overflow:visible; pointer-events:none; }
  .jg-band .jg-alien-art{ position:absolute; inset:0; display:flex; align-items:flex-end; justify-content:center; }
  .jg-band .jg-alien-art .jg-art{ image-rendering:pixelated; flex:0 0 auto; margin-bottom:-6%;
    filter:drop-shadow(0 0 3px #000) drop-shadow(0 0 7px rgba(210,20,30,.9)); animation:jgThrob 1.6s ease-in-out infinite; }
  .jg-band .jg-alien-art.face-r .jg-art{ transform:scaleX(-1); }
  @keyframes jgThrob{ 0%,100%{ filter:drop-shadow(0 0 3px #000) drop-shadow(0 0 6px rgba(210,20,30,.75)); } 50%{ filter:drop-shadow(0 0 4px #000) drop-shadow(0 0 12px rgba(255,40,40,1)); } }
  .jg-cone{ position:absolute; pointer-events:none; z-index:-1; border-radius:6px;
    background:repeating-linear-gradient(45deg, rgba(255,60,60,.20) 0 8px, rgba(255,60,60,.32) 8px 16px); box-shadow:inset 0 0 0 1px rgba(255,90,90,.5); }
  .jg-band .jg-mark{ position:absolute; left:50%; top:calc(var(--wt, 48px) * -1.45); transform:translateX(-50%) scale(0); font:900 calc(var(--wt, 48px) * 1.05)/1 'Baloo 2',cursive;
    color:#ffdd33; -webkit-text-stroke:3px #5a1a00; text-shadow:0 3px 0 #5a1a00, 0 0 12px rgba(255,220,60,.8); opacity:0; z-index:5;
    transition:transform .2s cubic-bezier(.2,1.8,.4,1), opacity .1s; }
  .jg-band.alert .jg-mark{ transform:translateX(-50%) scale(1); opacity:1; animation:jgMark .5s ease-in-out .2s 2; }
  @keyframes jgMark{ 0%,100%{ transform:translateX(-50%) scale(1) rotate(0); } 30%{ transform:translateX(-50%) scale(1.15) rotate(-8deg); } 60%{ transform:translateX(-50%) scale(1.15) rotate(8deg); } }
  .jg-hold{ position:fixed; inset:0; z-index:84; }
  .jg-hud{ display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin:2px 0 6px; }
  .jg-chip{ font:800 12px/1 'Nunito',sans-serif; padding:5px 9px; border-radius:12px; background:rgba(20,40,24,.72); color:#e8f6df; box-shadow:0 1px 3px rgba(0,0,0,.3); }
  .jg-chip.done{ background:rgba(46,120,70,.85); }
  .wact.jg-fight{ background:#7a2430; color:#fff; }
  .jg-map-ov{ position:fixed; inset:0; z-index:86; background:rgba(8,14,10,.72); display:flex; align-items:center; justify-content:center; }
  .jg-map-card{ background:#f4ecd8; border-radius:16px; padding:14px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,.5); }
  .jg-map-title{ font:800 18px/1.2 'Baloo 2',cursive; margin-bottom:8px; }
  #jgMapCv{ image-rendering:pixelated; border-radius:8px; display:block; margin:0 auto; background:#0e1612; }
  .jg-map-key{ font-size:12px; font-weight:700; color:var(--ink-soft); margin:8px 0; }
  .jg-choose-list{ display:flex; flex-direction:column; gap:8px; margin-top:10px; }
  .jg-choose .btn.jg-go{ display:flex; flex-direction:row; align-items:center; gap:10px; text-align:left; padding-top:6px; padding-bottom:6px; }
  .jg-choose .jg-go-words{ display:flex; flex-direction:column; align-items:flex-start; }
  .jg-choose .btn.jg-go small{ font:700 11px/1.2 'Nunito',sans-serif; color:var(--ink-soft); margin-top:2px; }
  .jg-choose .jg-go-pic{ width:46px; height:46px; flex:0 0 46px; object-fit:contain; image-rendering:pixelated; display:flex; align-items:center; justify-content:center;
    margin:-4px 0; filter:drop-shadow(0 1px 1px rgba(0,0,0,.3)); }
  .jg-choose .jg-go-emoji{ font-size:30px; }
  .jg-choose .jg-go-portal svg{ width:100%; height:100%; overflow:visible; filter:hue-rotate(80deg) saturate(1.3); }
  /* (4.07) never taller than the screen: the list scrolls inside the card on a short phone */
  .jg-choose .refine-card{ max-height:calc(100vh - 44px); max-height:calc(100dvh - 44px); overflow-y:auto; overscroll-behavior:contain; }
  .jg-king-light svg{ display:block; }
  /* the fight */
  .enemy-card.jg-foe-alien .avatar-layer .mon-sprite{ filter:drop-shadow(0 0 3px #000) drop-shadow(0 0 3px #000) drop-shadow(0 0 10px rgba(220,20,30,1)) !important; }
  .enemy-card.jg-foe-mind .avatar-layer .mon-sprite{ filter:sepia(.7) saturate(3.4) hue-rotate(-30deg) brightness(.95) drop-shadow(0 0 7px rgba(255,40,40,1)) !important; }
  /* (4.03) the designer: "The red glow of sprites should be allowed to overlap/bleed out of their spot in the battle UI
     as it is currently cut off in a square". A card clips what it holds (index.html), so that a fallen one sinks out of
     sight behind its plate; while an alien or a captive stands, its glow spills over the edges, onto its neighbours */
  .enemy-card.jg-foe-alien:not(.fainted), .enemy-card.jg-foe-mind:not(.fainted){ overflow:visible; }
  .enemy-card.jg-enraging .avatar-layer{ animation:jgEnrage 1.2s ease-out; }
  @keyframes jgEnrage{ 0%{ transform:scale(1); filter:brightness(1); } 30%{ transform:scale(1.22); filter:brightness(2.2) drop-shadow(0 0 16px #ff2020); } 100%{ transform:scale(1); filter:none; } }
  @media (prefers-reduced-motion: reduce){ .jg-band .jg-alien-art .jg-art, .enemy-card.jg-enraging .avatar-layer, .walk-ent.jg-folk .jg-folk-art{ animation:none !important; } }
  `;
  document.head.appendChild(s);
}
