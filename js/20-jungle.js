/* ============================================================
   20-jungle.js — THE TIME-LOST JUNGLE (3.84)
   The designer (2026-11-04): Region 6's first quest — "help the Cosmic
   Council quell an alien invasion that has affected the Fairy King's
   universe". Nemesis's crossing tore the spacetime fabric of the Fairy
   King's world (he sits on the Council) and let aliens in: Nemesis meant
   it, to blind the Council. Help him, and he will guide you through the
   tangled timelines towards Nemesis's past.

   Through the Rift's upper small portal (it wakes once the Council has
   called), a time-lost jungle: a maze 450 squares across, "a VERY gigantic
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
   Its fairies come on at Lv 100, then turn red and grow to Lv 150, and use
   their Ultimate every turn; a captain's or commander's own fairies cast
   Diamond Dust. The aliens: Lv 150–175, unnerfed; a Very High on their first
   turn and every five after, an Ultra on every third turn from the third.
   The captain and commander have no element, and cast a different Very
   High every turn. Aliens are never caught; the fairies, once freed, are
   (if you have none of them yet).

   Each tribe, once you have met its guardian, gives 5 tickets a day for 3
   of its people freed. The castle's knights count the alien bands beaten
   each week: 50 pays 50 bronze medals.

   The ground is made from a seed (jgGround): every profile walks the same
   jungle, and nothing of it is saved but where you have been. It is far
   too big for the walk engine's whole-map painting and its shade squares:
   the deck's rows are all floor, the walls are `occupied`, and a canvas
   under the deck paints only what is in view (jgPaint), as the Rift's sky
   does.
   ============================================================ */
const JG_KEY = 'r6_jungle';
const JG = {
  W:450, H:450, cell:3, newest:0.5, braid:0.18, glades:46, lakes:14, seed:20261104,
  aliens:{ regular:92, captain:14, commander:4, gap:13, safe:16, sight:4, clock:700, radius:7, active:18, lv:[150, 175] },
  fairyLv:[100, 150], vhEvery:5, ultraFrom:3, ultraEvery:3,
  plus:{ alien:0, captain:1, commander:2 },
  daily:{ need:3, tokens:5 }, weekly:{ need:50, bronze:50 },
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
  const d = today();
  if(j.day !== d){ j.day = d; j.rescued = {}; j.paid = {}; }
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
   them), Ultimate, Max, as the starters'. */
const JG_FOLK = {
  water_fairy: { name:'Water Fairy',  el:'Water',  evo:[115], glyph:'泉', moves:['Splash Charm', 'Dew Drop', 'Tide Twirl', 'Moon Tide', 'Moon Tide Max'] },
  water_sprite:{ name:'Water Sprite', el:'Water',  glyph:'露', moves:['Ripple', 'Spring Jet', 'Mist Dance', 'Fountain Lance', 'Fountain Lance Max'] },
  grass_fairy: { name:'Grass Fairy',  el:'Grass',  evo:[115], glyph:'芽', moves:['Petal Puff', 'Seed Flurry', 'Blossom Wind', 'Gratitude Beam', 'Gratitude Beam Max'] },
  grass_sprite:{ name:'Grass Sprite', el:'Grass',  glyph:'叶', moves:['Leaf Flick', 'Vine Ribbon', 'Meadow Song', 'Thorn Waltz', 'Thorn Waltz Max'] },
  fire_sprite: { name:'Fire Sprite',  el:'Fire',   glyph:'烛', moves:['Spark Kiss', 'Ember Ribbon', 'Lantern Ring', 'Sunflare', 'Sunflare Max'] },
  bonedancer:  { name:'Bonedancer',   el:'Fire',   glyph:'舞', moves:['Bone Tap', 'Ghostfire', 'Skull Shuffle', 'Flame Dance', 'Flame Dance Max'] },
  earth_fairy: { name:'Earth Fairy',  el:'Ground', glyph:'星', moves:['Pebble Wish', 'Star Dust', 'Rock Ring', 'Wishing Quake', 'Wishing Quake Max'] },
  earth_sprite:{ name:'Earth Sprite', el:'Ground', glyph:'土', moves:['Mud Flick', 'Clay Charm', 'Sand Veil', 'Stone Song', 'Stone Song Max'] },
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
  Object.entries(JG_FOLK).forEach(([id, f])=>{
    const tribe = JG_TRIBE_KEYS.find(k=> JG_TRIBES[k].members.includes(id));
    SPECIES[id] = { name:f.name, tier:'elite', types:[f.el, 'Fairy'], rate:11, nerfedRate:11, base:100, evo:f.evo || [], color:TYPE_COLORS[f.el] || '#c98bd0',
                    glyph:f.glyph, bossOnly:true, tribe };
    MOVES[id] = jgKit(f.moves);
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
function jgGround(){
  if(_jgGround) return _jgGround;
  const { W, H } = JG, C = JG.cell, CW = W / C, CH = H / C;          // 150 × 150 cells
  const R = jgRng(JG.seed), ri = n=> Math.floor(R() * n);
  const g = new Uint8Array(W * H);                                    // all hedge
  const put = (x, y, t)=>{ if(x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = t; };
  const cellOpen = (i, j)=>{ for(let dy = 0; dy < 2; dy++) for(let dx = 0; dx < 2; dx++) put(i * C + dx, j * C + dy, JG_T.PATH); };
  const knock = (i, j, dx, dy)=>{                                     // the hedge between two cells: two squares
    if(dx === 1){ put(i * C + 2, j * C, JG_T.PATH); put(i * C + 2, j * C + 1, JG_T.PATH); }
    if(dx === -1){ put((i - 1) * C + 2, j * C, JG_T.PATH); put((i - 1) * C + 2, j * C + 1, JG_T.PATH); }
    if(dy === 1){ put(i * C, j * C + 2, JG_T.PATH); put(i * C + 1, j * C + 2, JG_T.PATH); }
    if(dy === -1){ put(i * C, (j - 1) * C + 2, JG_T.PATH); put(i * C + 1, (j - 1) * C + 2, JG_T.PATH); }
  };
  /* the maze: a growing tree, half newest (long runs), half at random (branches) */
  const seen = new Uint8Array(CW * CH), links = new Uint8Array(CW * CH);   // bits: 1 E, 2 S, 4 W, 8 N
  const DIRS = [[1, 0, 1, 4], [0, 1, 2, 8], [-1, 0, 4, 1], [0, -1, 8, 2]];
  const stack = [[CW - 1, Math.floor(CH / 2)]];
  seen[stack[0][1] * CW + stack[0][0]] = 1; cellOpen(stack[0][0], stack[0][1]);
  while(stack.length){
    const k = R() < JG.newest ? stack.length - 1 : ri(stack.length);
    const [i, j] = stack[k];
    const opts = DIRS.filter(([dx, dy])=>{ const a = i + dx, b = j + dy; return a >= 0 && b >= 0 && a < CW && b < CH && !seen[b * CW + a]; });
    if(!opts.length){ stack.splice(k, 1); continue; }
    const [dx, dy, bit, back] = opts[ri(opts.length)];
    const a = i + dx, b = j + dy;
    seen[b * CW + a] = 1; links[j * CW + i] |= bit; links[b * CW + a] |= back;
    cellOpen(a, b); knock(i, j, dx, dy);
    stack.push([a, b]);
  }
  /* loops: some dead ends opened on through one more hedge */
  const deg = v=> (v & 1) + ((v >> 1) & 1) + ((v >> 2) & 1) + ((v >> 3) & 1);
  for(let j = 0; j < CH; j++) for(let i = 0; i < CW; i++){
    if(deg(links[j * CW + i]) !== 1 || R() >= JG.braid) continue;
    const opts = DIRS.filter(([dx, dy, bit])=>{ const a = i + dx, b = j + dy; return !(links[j * CW + i] & bit) && a >= 0 && b >= 0 && a < CW && b < CH; });
    if(!opts.length) continue;
    const [dx, dy, bit, back] = opts[ri(opts.length)];
    links[j * CW + i] |= bit; links[(j + dy) * CW + i + dx] |= back;
    knock(i, j, dx, dy);
  }
  const fill = (x0, y0, w, h, t)=>{ for(let y = y0; y < y0 + h; y++) for(let x = x0; x < x0 + w; x++) put(x, y, t); };
  const places = { villages:{}, castle:null, entry:null, lakes:[], glades:[] };
  const busy = [];
  const clash = (x, y, w, h, pad)=> busy.some(b=> x < b.x + b.w + pad && x + w + pad > b.x && y < b.y + b.h + pad && y + h + pad > b.y);
  /* the castle: the middle; a ring of road round its walls; the gate in its south wall */
  const CS = 64, cx0 = Math.floor((W - CS) / 2), cy0 = Math.floor((H - CS) / 2), ring = 4;
  fill(cx0 - ring, cy0 - ring, CS + ring * 2, CS + ring * 2, JG_T.ROAD);
  fill(cx0, cy0, CS, CS, JG_T.CASTLE);
  const gx = cx0 + CS / 2 - 2;
  fill(gx, cy0 + CS - 3, 4, 3, JG_T.GATE);
  places.castle = { x:cx0, y:cy0, w:CS, h:CS, gx, gate:{ x:gx, y:cy0 + CS - 1, w:4 }, stand:{ x:gx + 1, y:cy0 + CS + 2 },
                    knights:[{ x:gx - 1, y:cy0 + CS }, { x:gx + 4, y:cy0 + CS }] };
  busy.push({ x:cx0 - ring, y:cy0 - ring, w:CS + ring * 2, h:CS + ring * 2 });
  /* the villages, in the corners: open ground, eight huts round a green, the guardian's lodge at the back */
  const VS = 36, corners = { nw:[2, 2], ne:[W - VS - 3, 2], sw:[2, H - VS - 3], se:[W - VS - 3, H - VS - 3] };
  JG_TRIBE_KEYS.forEach(k=>{
    const [vx, vy] = corners[JG_TRIBES[k].corner];
    fill(vx, vy, VS, VS, JG_T.VILLAGE);
    const huts = [];
    for(let n = 0; n < 8; n++){
      const ang = n / 8 * Math.PI * 2 + 0.3, rr = VS * 0.33;
      const hx = Math.round(vx + VS / 2 + Math.cos(ang) * rr) - 2, hy = Math.round(vy + VS / 2 + Math.sin(ang) * rr) - 2;
      fill(hx, hy, 4, 3, JG_T.HUT); huts.push({ x:hx, y:hy, w:4, h:3 });
    }
    const lodge = { x:vx + VS / 2 - 3, y:vy + VS / 2 - 3, w:6, h:4 };
    fill(lodge.x, lodge.y, lodge.w, lodge.h, JG_T.HUT);
    places.villages[k] = { x:vx, y:vy, w:VS, h:VS, huts, lodge, guardian:{ x:lodge.x + 2, y:lodge.y + lodge.h }, stand:{ x:lodge.x + 2, y:lodge.y + lodge.h + 2 } };
    /* trees about the village, clear of the huts, the green and the lodge's front */
    for(let n = 0, tr = 0; n < 34 && tr < 400; tr++){
      const tx = vx + 1 + ri(VS - 2), ty = vy + 1 + ri(VS - 2);
      if(Math.hypot(tx - (vx + VS / 2), ty - (vy + VS / 2)) < 8) continue;
      if(huts.concat([lodge]).some(h=> tx >= h.x - 2 && tx < h.x + h.w + 2 && ty >= h.y - 2 && ty < h.y + h.h + 3)) continue;
      if(g[ty * W + tx] !== JG_T.VILLAGE) continue;
      g[ty * W + tx] = JG_T.TREE; n++;
    }
    busy.push({ x:vx, y:vy, w:VS, h:VS });
  });
  /* the way in: the east edge, half way down — a small glade, the portal at its edge */
  const ey = Math.floor(H / 2) - 4, ex = W - 10;
  fill(ex, ey, 10, 9, JG_T.ENTRY);
  places.entry = { x:ex, y:ey, w:10, h:9, portal:{ x:W - 2, y:ey + 3, w:2, h:2 }, stand:{ x:W - 4, y:ey + 4 } };
  busy.push({ x:ex, y:ey, w:10, h:9 });
  /* lakes: water with a shore of open ground all round it (so no way is cut) */
  let tries = 0;
  while(places.lakes.length < JG.lakes && tries++ < 2000){
    const w = 14 + ri(18), h = 10 + ri(14), x = 6 + ri(W - w - 12), y = 6 + ri(H - h - 12);
    if(clash(x, y, w, h, 8)) continue;
    fill(x, y, w, h, JG_T.SHORE);
    const cxl = x + w / 2, cyl = y + h / 2, rx = w / 2 - 2.2, ry = h / 2 - 2.2;
    for(let yy = y; yy < y + h; yy++) for(let xx = x; xx < x + w; xx++){
      const d = ((xx + .5 - cxl) / rx) ** 2 + ((yy + .5 - cyl) / ry) ** 2;
      if(d < 0.82 + 0.18 * Math.sin(xx * 0.9 + yy * 1.3)) g[yy * W + xx] = JG_T.WATER;
    }
    places.lakes.push({ x, y, w, h }); busy.push({ x, y, w, h });
  }
  /* glades: open grass, a few trees standing in them */
  tries = 0;
  while(places.glades.length < JG.glades && tries++ < 3000){
    const w = 6 + ri(10), h = 6 + ri(10), x = 4 + ri(W - w - 8), y = 4 + ri(H - h - 8);
    if(clash(x, y, w, h, 6)) continue;
    fill(x, y, w, h, JG_T.GLADE);
    const n = Math.floor(w * h / 40);
    for(let k = 0; k < n; k++) put(x + 2 + ri(w - 4), y + 2 + ri(h - 4), JG_T.TREE);
    places.glades.push({ x, y, w, h }); busy.push({ x, y, w, h });
  }
  /* anything walkable that cannot be reached from the way in goes back to hedge (a glade's tree can box in a square) */
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
  _jgGround = { g, W, H, places, R };
  return _jgGround;
}
function jgTile(x, y){ const G = jgGround(); return (x < 0 || y < 0 || x >= G.W || y >= G.H) ? JG_T.HEDGE : G.g[y * G.W + x]; }
function jgSolidAt(x, y){ return JG_SOLID[jgTile(x, y)]; }
function jgVillageAt(x, y){
  const V = jgGround().places.villages;
  return JG_TRIBE_KEYS.find(k=>{ const v = V[k]; return x >= v.x && y >= v.y && x < v.x + v.w && y < v.y + v.h; }) || null;
}
/* the nearest tribe's lands: whose people its aliens hold */
function jgTribeOf(x, y){
  const V = jgGround().places.villages;
  let best = 'water', bd = Infinity;
  JG_TRIBE_KEYS.forEach(k=>{ const v = V[k], d = Math.hypot(v.x + v.w / 2 - x, v.y + v.h / 2 - y); if(d < bd){ bd = d; best = k; } });
  return best;
}

/* ============================================================
   THE ALIENS — where each band stands, made from the seed too
   ============================================================ */
let _jgBands = null;
function jgBands(){
  if(_jgBands) return _jgBands;
  const G = jgGround(), { W, H, places } = G, A = JG.aliens;
  const R = jgRng(JG.seed ^ 0x51ed), ri = n=> Math.floor(R() * n);
  const C = places.castle, ccx = C.x + C.w / 2, ccy = C.y + C.h / 2, far = Math.hypot(ccx, ccy);
  const safe = [places.entry, ...Object.values(places.villages), { x:C.x - 8, y:C.y + C.h - 2, w:C.w + 16, h:14 }];
  const tooNear = (x, y)=> safe.some(s=> x > s.x - A.safe && x < s.x + s.w + A.safe && y > s.y - A.safe && y < s.y + s.h + A.safe);
  const bands = [];
  const ok = (x, y)=> jgTile(x, y) === JG_T.PATH || jgTile(x, y) === JG_T.GLADE || jgTile(x, y) === JG_T.SHORE;
  const free = (x, y, gap)=> bands.every(b=> Math.abs(b.x - x) + Math.abs(b.y - y) >= gap);
  const place = (rank, n, inR, outR)=>{
    let tries = 0;
    while(n > 0 && tries++ < 40000){
      const x = 2 + ri(W - 4), y = 2 + ri(H - 4);
      const d = Math.hypot(x - ccx, y - ccy);
      if(d < inR || d > outR || !ok(x, y) || tooNear(x, y) || !free(x, y, A.gap)) continue;
      const lv = Math.round(A.lv[0] + (A.lv[1] - A.lv[0]) * Math.max(0, Math.min(1, 1 - (d - 40) / (far - 40))));
      const band = { id:'b' + bands.length, rank, x, y, hx:x, hy:y, face:'ldru'[ri(4)], tribe:jgTribeOf(x, y),
        lv:rank === 'commander' ? A.lv[1] : rank === 'captain' ? Math.min(A.lv[1], lv + 3) : lv,
        aliens:[] };
      const n2 = rank === 'commander' ? 4 : rank === 'captain' ? 2 : 1;
      for(let k = 0; k < n2; k++) band.aliens.push(JG_ALIEN_IDS[ri(JG_ALIEN_IDS.length)]);
      if(rank === 'commander') band.aliens.push(JG_CAPTAIN, JG_COMMANDER);
      if(rank === 'captain') band.aliens.push(JG_CAPTAIN);
      band.lead = band.aliens[band.aliens.length - 1];
      bands.push(band); n--;
    }
  };
  place('commander', A.commander, 46, 120);
  place('captain', A.captain, 60, 210);
  place('alien', A.regular, 44, 400);
  _jgBands = bands;
  return bands;
}
function jgBandBeaten(b){ return jgState().beaten[b.id] === today(); }
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
  occupied:(x, y)=> jgSolidAt(x, y) || !!jgBandAt(x, y),
  get things(){ return jgThings(); },
  nearActs:(d, p)=> jgNearActs(p),
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
    list.push({ x:v.guardian.x, y:v.guardian.y, w:2, h:1, cls:'jg-npc jg-guardian', html:(tt, px)=> jgMonImg(t.guardian, WALK_T * 2.1),
      verb:'Talk', sub:`${t.short} Guardian`, mark:()=> !jgState().met[k], act:()=> jgGuardian(k) });
  });
  P.castle.knights.forEach((kn, i)=>{
    list.push({ x:kn.x, y:kn.y, cls:'jg-npc jg-knight', html:()=> jgMonImg('fairy_knight_front', WALK_T * 1.5, i === 1),
      verb:'Talk', sub:'Fairy Knight', mark:()=> !jgState().met.knights, act:()=> jgKnights(), faceR:i === 1 });
  });
  const g = P.castle.gate;
  list.push({ x:g.x, y:g.y, w:g.w, h:1, icon:'', verb:'The castle gate', sub:'Shut', act:()=> jgGate() });
  _jgThings = list;
  return list;
}
function jgMonImg(file, px, flip){
  const w = Math.round(px);
  return `<img class="jg-art" src="assets/mon/${file}.png" alt="" style="width:${w}px;height:${w}px;${flip ? 'transform:scaleX(-1);' : ''}" onerror="this.style.display='none'">`;
}

/* ---------- in and out ---------- */
function jgEnter(where){
  if(!jgPortalAwake()) return false;
  const j = jgState();
  const P = jgGround().places;
  let at = null;
  if(where === 'last' && j.at && !jgSolidAt(j.at.x, j.at.y) && !jgBandAt(j.at.x, j.at.y)) at = j.at;
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
function jgSave(now){
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(p) jgState().at = { x:p.x, y:p.y };
  if(now || ++_jgSteps % 25 === 0) saveProfile();
}

/* ---------- Lucesco, at your heels (as in the past, 19-past.js) ---------- */
function jgLionPlace(){
  const el = document.getElementById('jgLion'), at = ui.jgLion;
  if(!el || !at) return;
  el.style.transform = `translate3d(${at.x * WALK_T}px,${at.y * WALK_T}px,0)`;
  el.style.zIndex = 10 + at.y;
  faceRight(el, !!at.faceR);
}
function jgLionStep(p){
  const trail = (ui.jgTrail || []).concat([{ x:p.x, y:p.y }]).slice(-3);
  ui.jgTrail = trail;
  const to = trail[trail.length - 2];
  if(to){
    const at = ui.jgLion;
    ui.jgLion = { x:to.x, y:to.y, faceR:at ? (to.x !== at.x ? to.x > at.x : at.faceR) : false };
    jgLionPlace();
  }
}

/* ---------- a step ---------- */
function jgStep(p, d){
  jgLionStep(p);
  jgSave(false);
  jgExplore(p.x, p.y);
  jgDiscover(p.x, p.y);
  jgShowBands();
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
let _jgEx = null, _jgExOf = null;
function jgExBits(){
  if(_jgEx && _jgExOf === state) return _jgEx;       // (another profile: its own picture)
  _jgExOf = state;
  const n = Math.ceil(JG.W / JG_EX.cell) * Math.ceil(JG.H / JG_EX.cell);
  _jgEx = new Uint8Array(Math.ceil(n / 8));
  const s = jgState().explored;
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
  /* the awake portal you came through, at the east edge */
  const pt = jgGround().places.entry.portal;
  const por = document.createElement('div');
  por.className = 'past-art rift-portal jg-portal';
  por.style.cssText = `left:${(pt.x - 0.3) * WALK_T}px;top:${(pt.y + pt.h - 2.7) * WALK_T}px;width:${2.2 * WALK_T}px;height:${3 * WALK_T}px;z-index:${10 + pt.y + pt.h - 1};`;
  por.innerHTML = riftPortalSvg(false);
  world.appendChild(por);
  ui.jgBandEls = {};
  /* those right by you as you arrive give you a moment */
  if(p){ const now = Date.now(); jgBands().forEach(b=>{ if(Math.abs(b.x - p.x) + Math.abs(b.y - p.y) < 8) b.calm = Math.max(b.calm || 0, now + 3000); }); }
  jgShowBands();
  jgHud();
  if(p){ jgExplore(p.x, p.y); jgDiscover(p.x, p.y); }
  jgTickStart();
  /* the first time in: Cuain goes, Lucesco comes */
  if(!jgState().seen && !ui.sceneRunning) setTimeout(()=>{ if(ui.screen === JG_KEY) jgArrive(); }, 450);
}

/* ---------- the painting: what is in view, only ---------- */
const JG_P = { cv:null, stage:null, world:null, raf:0, key:'', last:0, atlas:null, S:0 };
function jgPaintStart(stage, world){
  if(!stage || !world) return;
  let cv = stage.querySelector('canvas.jg-ground');
  if(!cv){
    cv = document.createElement('canvas');
    cv.className = 'jg-ground';
    cv.setAttribute('aria-hidden', 'true');
    stage.insertBefore(cv, stage.firstChild);
  }
  Object.assign(JG_P, { cv, stage, world, key:'', last:0 });
  if(!JG_P.raf && typeof requestAnimationFrame === 'function') JG_P.raf = requestAnimationFrame(jgPaintTick);
}
function jgPaintTick(now){
  JG_P.raf = 0;
  if(!JG_P.cv || !JG_P.cv.isConnected) return;          // the map is gone: the clock stops
  const cam = riftCam(JG_P.world);
  if(cam.key !== JG_P.key || now - JG_P.last > 220){
    JG_P.key = cam.key; JG_P.last = now;
    try { jgPaintDraw(cam, now); } catch(e){ console.error('jungle paint:', e); }
  }
  JG_P.raf = requestAnimationFrame(jgPaintTick);
}
function jgPaintDraw(cam, now){
  const cv = JG_P.cv, st = JG_P.stage;
  const W = st.clientWidth, H = st.clientHeight;
  if(!W || !H) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if(cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)){ cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d');
  const T = WALK_T, s = cam.s || 1, k = T * s * dpr;              // one square, on the canvas
  const S = Math.max(8, Math.round(k));
  if(!JG_P.atlas || JG_P.S !== S){ JG_P.atlas = new Map(); JG_P.S = S; }
  const ox = dpr * (W / 2 + cam.e), oy = dpr * (H / 2 + cam.f);     // where the world's corner is
  const x0 = Math.floor(-ox / k) - 1, y0 = Math.floor(-oy / k) - 1;
  const x1 = Math.ceil((cv.width - ox) / k) + 1, y1 = Math.ceil((cv.height - oy) / k) + 1;
  ctx.fillStyle = '#163a22'; ctx.fillRect(0, 0, cv.width, cv.height);
  const frame = Math.floor(now / 420) % 4;
  for(let y = y0; y <= y1; y++){
    const py = Math.round(oy + y * k), ph = Math.round(oy + (y + 1) * k) - py;
    for(let x = x0; x <= x1; x++){
      const px = Math.round(ox + x * k), pw = Math.round(ox + (x + 1) * k) - px;
      jgPaintTile(ctx, x, y, px, py, pw, ph, frame);
    }
  }
  /* trees stand up over the ground round them */
  for(let y = y0; y <= y1 + 1; y++) for(let x = x0; x <= x1; x++){
    if(jgTile(x, y) !== JG_T.TREE) continue;
    const spr = jgSprite('tree', jgHash(x, y, 3) < 0.5 ? 0 : 1);
    ctx.drawImage(spr, Math.round(ox + (x - 0.5) * k), Math.round(oy + (y - 1.2) * k), Math.round(2 * k), Math.round(2 * k));
  }
}
function jgPaintTile(ctx, x, y, px, py, pw, ph, frame){
  const t = jgTile(x, y), v = jgHash(x, y, 1);
  let spr;
  switch(t){
    case JG_T.HEDGE: spr = jgSprite('hedge', Math.floor(v * 6)); break;
    case JG_T.PATH: spr = jgSprite('path', Math.floor(v * 6)); break;
    case JG_T.GLADE: spr = jgSprite('glade', Math.floor(v * 4)); break;
    case JG_T.TREE: { const vk = jgVillageAt(x, y); spr = vk ? jgSprite('village-' + vk, Math.floor(v * 3)) : jgSprite('glade', Math.floor(v * 4)); break; }
    case JG_T.SHORE: spr = jgSprite('shore', Math.floor(v * 3)); break;
    case JG_T.WATER: spr = jgSprite('water', (frame + Math.floor(v * 4)) % 4); break;
    case JG_T.VILLAGE: spr = jgSprite('village-' + (jgVillageAt(x, y) || 'grass'), Math.floor(v * 3)); break;
    case JG_T.HUT: spr = jgSprite('hut-' + (jgVillageAt(x, y) || 'grass'), jgHutPart(x, y)); break;
    case JG_T.CASTLE: spr = jgSprite('castle-' + jgCastlePart(x, y), (x + y) & 1); break;
    case JG_T.GATE: spr = jgSprite('gate', 0); break;
    case JG_T.ROAD: spr = jgSprite('road', Math.floor(v * 3)); break;
    case JG_T.ENTRY: spr = jgSprite('entry', Math.floor(v * 3)); break;
  }
  if(spr) ctx.drawImage(spr, px, py, pw, ph);
  /* what touches it: a hedge's sunlit top, the shade a hedge throws, the water's sandy rim, a hut's door */
  const solid = JG_SOLID[t];
  if(t === JG_T.HEDGE){
    if(!JG_SOLID[jgTile(x, y - 1)]){ ctx.fillStyle = 'rgba(160,220,120,.30)'; ctx.fillRect(px, py, pw, Math.max(1, ph * 0.16)); }
    if(!JG_SOLID[jgTile(x, y + 1)]){ ctx.fillStyle = 'rgba(6,24,10,.45)'; ctx.fillRect(px, py + ph * 0.86, pw, ph * 0.14 + 1); }
  } else if(!solid){
    const n = jgTile(x, y - 1), w = jgTile(x - 1, y);
    if(n === JG_T.HEDGE || n === JG_T.HUT || n === JG_T.CASTLE) ctx.drawImage(jgSprite('shadeN', 0), px, py, pw, ph);
    if(w === JG_T.HEDGE) ctx.drawImage(jgSprite('shadeW', 0), px, py, pw, ph);
  } else if(t === JG_T.WATER){
    ctx.fillStyle = 'rgba(232,222,170,.6)';
    const e = Math.max(1, Math.round(pw * 0.12));
    if(jgTile(x, y - 1) !== JG_T.WATER) ctx.fillRect(px, py, pw, e);
    if(jgTile(x, y + 1) !== JG_T.WATER) ctx.fillRect(px, py + ph - e, pw, e);
    if(jgTile(x - 1, y) !== JG_T.WATER) ctx.fillRect(px, py, e, ph);
    if(jgTile(x + 1, y) !== JG_T.WATER) ctx.fillRect(px + pw - e, py, e, ph);
  }
}
/* a hut's squares, by where they are in it: 0 its ridge, 1 its roof, 2 its front wall, 3 the door in it */
function jgHutPart(x, y){
  const v = jgGround().places.villages[jgVillageAt(x, y) || 'grass'];
  const r = v && v.huts.concat([v.lodge]).find(h=> x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h);
  if(!r) return 1;
  if(y === r.y + r.h - 1) return (x === r.x + Math.floor((r.w - 1) / 2) || (r.w > 4 && x === r.x + Math.floor(r.w / 2))) ? 3 : 2;
  return y === r.y ? 0 : 1;
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
  c.width = c.height = big ? S * 2 : S;
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
  if(kind === 'hedge'){
    g.fillStyle = '#163a22'; g.fillRect(0, 0, S, S);
    const cols = ['#1f4d2c', '#2b6337', '#3a7d43', '#4c9450'];
    for(let k = 0; k < 9; k++){
      g.fillStyle = cols[Math.floor(h(k + 21) * cols.length)];
      g.beginPath(); g.arc(h(k) * S, h(k + 7) * S, S * (0.17 + h(k + 14) * 0.2), 0, Math.PI * 2); g.fill();
    }
    if(n % 3 === 0){                                                  // a flower, now and then
      g.fillStyle = ['#e85d8a', '#f2c94c', '#ffffff', '#b07cf0'][n % 4];
      g.beginPath(); g.arc(S * (0.25 + 0.5 * h(42)), S * (0.25 + 0.5 * h(43)), S * 0.07, 0, Math.PI * 2); g.fill();
    }
    if(n === 4){                                                      // a vine
      g.strokeStyle = 'rgba(120,180,80,.7)'; g.lineWidth = Math.max(1, S / 18);
      g.beginPath(); g.moveTo(S * 0.2, 0); g.quadraticCurveTo(S * 0.55, S * 0.45, S * 0.3, S); g.stroke();
    }
    return;
  }
  if(kind === 'path'){ dots('#8c7650', ['#7a6544', '#9d8760', '#a8956d'], 6, 0.04); tufts('#5f8a3e', n % 2 ? 1 : 0); return; }
  if(kind === 'glade'){ dots('#5e9a48', ['#76b25a', '#f3d66c', '#ef9ab9', '#ffffff', '#76b25a'], 7, 0.035); tufts('#3f7a34', 2); return; }
  if(kind === 'shore'){ dots('#a3b673', ['#c9c78e', '#86a45a'], 5, 0.04); return; }
  if(kind === 'road'){ dots('#a49b8a', ['#b8b0a0', '#8f8676', '#c4bdae'], 7, 0.07); return; }
  if(kind === 'entry'){ dots('#6c8f5a', ['#89b071', '#c7e3a8'], 6, 0.04); tufts('#4f7a3c', 1); return; }
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
  if(kind.startsWith('hut-')){
    const T = JG_TRIBES[kind.slice(4)] || JG_TRIBES.grass;
    if(n >= 2){                                                       // the front wall, under the eaves; a door in it
      g.fillStyle = T.wall; g.fillRect(0, 0, S, S);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, S, S * 0.16);
      g.strokeStyle = 'rgba(90,60,30,.35)'; g.lineWidth = Math.max(1, S / 28);
      for(let k = 1; k < 4; k++){ g.beginPath(); g.moveTo(k * S / 4, S * 0.16); g.lineTo(k * S / 4, S); g.stroke(); }
      if(n === 3){ g.fillStyle = '#4a2f18'; g.beginPath(); g.moveTo(S * 0.25, S); g.lineTo(S * 0.25, S * 0.42); g.quadraticCurveTo(S * 0.5, S * 0.2, S * 0.75, S * 0.42); g.lineTo(S * 0.75, S); g.fill(); }
      return;
    }
    g.fillStyle = T.roof[n === 0 ? 0 : 1]; g.fillRect(0, 0, S, S);   // thatch: rows of straw, darker along the ridge
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = Math.max(1, S / 30);
    for(let k = 1; k < 5; k++){ g.beginPath(); g.moveTo(0, k * S / 5); g.lineTo(S, k * S / 5 + (k % 2 ? 1 : -1)); g.stroke(); }
    g.fillStyle = T.roof[2]; g.globalAlpha = .35;
    for(let k = 0; k < 6; k++){ g.fillRect(h(k) * S, h(k + 9) * S, S * 0.18, S * 0.05); }
    g.globalAlpha = 1;
    if(n === 0){ g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, S, S * 0.22); }
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
    const gr = g.createLinearGradient(0, 0, 0, S * 0.42); gr.addColorStop(0, 'rgba(8,28,10,.46)'); gr.addColorStop(1, 'rgba(8,28,10,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S * 0.42);
    return;
  }
  if(kind === 'shadeW'){ g.fillStyle = 'rgba(8,28,10,.2)'; g.fillRect(0, 0, S * 0.12, S); return; }
  if(kind === 'tree'){
    const Z = S * 2;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(Z * 0.5, Z * 0.86, Z * 0.32, Z * 0.1, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5a3d22'; g.fillRect(Z * 0.45, Z * 0.5, Z * 0.1, Z * 0.36);
    const cols = n ? ['#2f6b35', '#3d8442', '#4f9a4c'] : ['#356f2f', '#4a8a3a', '#62a54a'];
    for(let k = 0; k < 6; k++){
      g.fillStyle = cols[k % 3];
      g.beginPath(); g.arc(Z * (0.28 + 0.44 * h(k + 80)), Z * (0.2 + 0.32 * h(k + 90)), Z * (0.16 + 0.07 * h(k + 99)), 0, Math.PI * 2); g.fill();
    }
  }
}

/* ---------- the bands on the map: only those near you are drawn, and only those nearer still move ---------- */
function jgShowBands(){
  const world = $('#walkWorld'), w = walkState(), p = w.at && w.at[JG_KEY];
  if(!world || !p || ui.screen !== JG_KEY) return;
  const els = ui.jgBandEls || (ui.jgBandEls = {});
  const R = 15;
  jgBands().forEach(b=>{
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
    cone.style.display = n ? '' : 'none';
    cone.style.left = (dx > 0 ? T : dx < 0 ? -n * T : 0) + 'px';
    cone.style.top = (dy > 0 ? T : dy < 0 ? -n * T : 0) + 'px';
    cone.style.width = (dx ? n * T : T) + 'px';
    cone.style.height = (dy ? n * T : T) + 'px';
    cone.dataset.face = b.face;
  }
}

/* ---------- their clock: a step every 0.7 s, for those near you ---------- */
let _jgTick = null;
function jgTickStart(){
  clearInterval(_jgTick);
  _jgTick = setInterval(jgTickOnce, JG.aliens.clock);
}
function jgTickOnce(){
  if(ui.screen !== JG_KEY){ clearInterval(_jgTick); _jgTick = null; return; }
  if(ui.jgAlert || ui.jgTalk || ui.sceneRunning || walkState().busy || document.querySelector('.scene-say') || (typeof eyeBreakActive === 'function' && eyeBreakActive())) return;
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(!p) return;
  const R = JG.aliens.active, rad = JG.aliens.radius;
  const lion = ui.jgLion;
  jgBands().forEach(b=>{
    if(jgBandBeaten(b) || Math.abs(b.x - p.x) > R || Math.abs(b.y - p.y) > R) return;
    if(b.calm && b.calm > Date.now()) return;
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
  jgLook();
  refreshWalk();
}
function jgOpenDirs(b){ return Object.keys(JG_DIR).filter(f=> !jgSolidAt(b.x + JG_DIR[f][0], b.y + JG_DIR[f][1])); }

/* ---------- seen ---------- */
function jgLook(){
  if(ui.jgAlert || ui.screen !== JG_KEY) return false;
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(!p) return false;
  const now = Date.now();
  const b = jgBands().find(b=>{
    if(jgBandBeaten(b) || (b.calm && b.calm > now) || Math.abs(b.x - p.x) + Math.abs(b.y - p.y) > JG.aliens.sight) return false;
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
  const acts = [{ key:'jgLion', html:'🦁 Talk<small>Lucesco</small>', act:()=> jgLionTalk() }];
  jgBands().forEach(b=>{
    if(jgBandBeaten(b) || Math.abs(b.x - p.x) + Math.abs(b.y - p.y) !== 1) return;
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
  if(j.met.knights) bits.push(`<span class="jg-chip${j.tallyPaid ? ' done' : ''}" title="Alien bands beaten this week">🛡️ ${j.tallyPaid ? '✓' : Math.min(JG.weekly.need, j.tally || 0) + '/' + JG.weekly.need}</span>`);
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
  const COL = { 0:[24,58,34], 1:[150,126,86], 2:[46,111,156], 3:[110,160,84], 4:[214,196,150], 5:[132,128,160], 6:[120,80,40], 7:[150,100,60], 8:[40,90,40], 9:[170,180,120], 10:[120,160,100], 11:[170,162,146] };
  for(let y = 0; y < JG.H; y++) for(let x = 0; x < JG.W; x++){
    const i = (y * JG.W + x) * 4, seen = jgExplored(x, y), c = COL[G.g[y * JG.W + x]] || [0, 0, 0];
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
function jgWaves(b){
  const R = Math.random, T = JG_TRIBES[b.tribe] || JG_TRIBES.water;
  const fairy = (boss)=> ({ species:T.members[Math.floor(R() * T.members.length)], level:JG.fairyLv[0], ai:'best', nerfed:false, anyLevel:true,
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
function jgFight(b, seen){
  if(!b || jgBandBeaten(b) || ui.jgFighting) return;
  if(!battleParty().some(m=> m.currentHp > 0)){ b.calm = Date.now() + 10000; walkState().busy = false; toast('Your team needs healing first.'); return; }
  ui.jgFighting = true;
  releaseKeys();
  jgSave(true);
  const waves = jgWaves(b), lead = SPECIES[b.lead].name;
  const name = b.rank === 'commander' ? `Commander ${lead}'s band` : b.rank === 'captain' ? `Captain ${lead}'s band` : `${lead} and its captives`;
  const begin = ()=>{
    ui.jgFighting = false;
    ui.jgFight = { id:b.id, rank:b.rank, tribe:b.tribe, waves:waves.length };
    beginBattle({ waves, isNpc:false, allowCatch:true, name, bgKey:'battle_jungle', foeRegion:6, encounter:true,
      onWaveStart:(i)=> jgWaveStart(i),
      onWin:(levelUps)=> jgWon(b, levelUps),
      onLose:()=>{ ui.jgFight = null; go('region'); } });          // lost, as any fight: the region's page, to recover
    if(ui.battle) ui.battle.jungle = b.id;
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin); else begin();
}
/* A wave on the field: what each of them is (their spec's `jg`), their glow;
   the fairies at Lv 100 for a moment, then the alien's grip takes them. */
function jgWaveStart(i){
  const b = ui.battle;
  if(!b) return;
  jgCss();
  const specs = b.waves[i] || [];
  b.enemies.forEach((e, k)=>{
    const sp = specs[k] || {};
    e.jg = sp.jg ? Object.assign({}, sp.jg) : null;
    if(e.jg && e.jg.alien) e.cls = 'jg-foe-alien' + (e.jg.alien !== 'alien' ? ' jg-foe-' + e.jg.alien : '');
  });
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
  j.tally = (j.tally || 0) + 1;
  /* every wave's captives are free now — counted for their tribes; each kind of them can be caught */
  const freed = {}, kinds = new Set();
  ((bt && bt.waves) || []).forEach(w=> (w || []).forEach(sp=>{
    if(!sp || !sp.jg || !sp.jg.mind) return;
    const k = (SPECIES[sp.species] || {}).tribe;
    if(k) freed[k] = (freed[k] || 0) + 1;
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
  let weekly = false;
  if(j.met.knights && !j.tallyPaid && j.tally >= JG.weekly.need){
    j.tallyPaid = true; weekly = true;
    state.medals = state.medals || {}; state.medals.bronze = (state.medals.bronze || 0) + JG.weekly.bronze;
  }
  if(j.met.knights) notes.push(`🛡️ Alien bands beaten this week: ${Math.min(JG.weekly.need, j.tally)}/${JG.weekly.need}.`);
  ui.victoryNotes = (ui.victoryNotes || []).concat(notes);
  saveProfile();
  const thanks = pays.map(k=> ()=> jgTribeThanks(k)).concat(weekly ? [()=> jgKnightsPay()] : []);
  const next = ()=>{ const t = thanks.shift(); if(t) return t().then(next); resumeVictory(); };
  next();
}
/* the second XP's level-ups folded into the first's (the victory page shows that list) */
function jgMergeUps(ups, more){
  if(!Array.isArray(ups) || !Array.isArray(more)) return;
  more.forEach(m=>{
    const e = ups.find(x=> x && m && x.uid === m.uid);
    if(!e){ ups.push(m); return; }
    if(Number.isFinite(m.to)) e.to = Math.max(e.to || 0, m.to);
    if(Number.isFinite(m.from)) e.from = Math.min(Number.isFinite(e.from) ? e.from : m.from, m.from);
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
function jgTribeThanks(k){
  const T = JG_TRIBES[k];
  return new Promise(res=>{
    storyModal(jgMonImg(T.guardian, 140), `${T.icon} ${T.short} Guardian`,
      `<b>"You freed ${JG.daily.need} of our people today. ${T.name.replace(/^the /, 'The ')} will not forget it."</b><br><br>` +
      `🎟️ <b>+${JG.daily.tokens} tickets</b> (you have ${state.inventory.tokens}).<br><br><i>Free ${JG.daily.need} more tomorrow, and they will thank you again.</i>`,
      ()=> res(), { subtitle:T.name.replace(/^the /, 'The '), bg:'jungle' });
  });
}
function jgKnightsPay(){
  return new Promise(res=>{
    storyModal(jgMonImg('fairy_knight_front', 140), '🛡️ The Fairy Knights',
      `<b>"${JG.weekly.need} bands of invaders in one week! The castle thanks you, champions."</b><br><br>` +
      `🥉 <b>+${JG.weekly.bronze} bronze medals</b>.<br><br><i>The count starts again on Monday.</i>`,
      ()=> res(), { subtitle:'The castle gate', bg:'jungle' });
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
const jgFace = (file)=> `<img src="assets/mon/${file}.png" alt="" onerror="this.replaceWith(document.createTextNode('🧚'))">`;
const JG_LION_LINES = [
  `<b>"These paths twist and turn. When one ends, go back to the last fork and try another."</b>`,
  `<b>"An alien looks only straight ahead — four steps. Keep out of its line, or face it."</b>`,
  `<b>"The fairies with them are not wicked. Their minds are not their own. Beat the alien's band, and they are free."</b>`,
  `<b>"Four tribes live in the corners of this land, and the Fairy King's castle stands in the middle."</b>`,
  `<b>"If you are lost, look at the map. It shows where we have been."</b>`,
];
function jgLionTalk(){
  const j = jgState();
  j.talk.lion = (j.talk.lion || 0) + 1;
  return jgLines([riftLucescoFace()], 'Lucesco', [JG_LION_LINES[(j.talk.lion - 1) % JG_LION_LINES.length]]);
}
/* A tribe's guardian: the first time, who they are and what they ask; after, how the day stands. */
async function jgGuardian(k){
  const T = JG_TRIBES[k], j = jgState(), face = [jgFace(T.guardian)], nm = `${T.short} Guardian`;
  if(!j.met[k]){
    await jgLines(face, nm, [
      `A tall figure in a great ${T.short.toLowerCase()} mask steps out of the lodge, a staff in its hand. Fairies peep out from the huts behind it.`,
      `<b>"Stop, strangers. …You walk with Lucesco? Then you are friends of the Fairy King."</b>`,
      `<b>"The invaders came through the torn sky. They took our people — they bend their minds and make them fight."</b>`,
      `<b>"Free ${JG.daily.need} of ${T.name.replace(/^the /, 'the ')} each day — beat the aliens that hold them — and we will give you 🎟️ ${JG.daily.tokens} tickets."</b>`,
    ]);
    j.met[k] = true; saveProfile(); jgHud(); refreshWalk();
    return;
  }
  const n = Math.min(JG.daily.need, j.rescued[k] || 0);
  await jgLines(face, nm, [j.paid[k]
    ? `<b>"You freed ${JG.daily.need} of our people today. Rest, friends — come back tomorrow."</b>`
    : `<b>"${n} of our people freed today. ${JG.daily.need - n} more, and the tribe will thank you."</b><br><br><i>The aliens near this village hold ${T.name.replace(/^the /, 'the ')}'s people.</i>`]);
}
async function jgKnights(){
  const j = jgState(), face = [jgFace('fairy_knight_front')], nm = 'Fairy Knight';
  if(!j.met.knights){
    await jgLines(face, nm, [
      `Two knights in rose-pink armour cross their spears in front of the gate.<br><br><b>"Halt! Who comes to the castle of the Fairy King?"</b>`,
      `They see Lucesco, and lower their spears at once.<br><br><b>"Lucesco! The Lion of the Rift himself. Then these are the travellers His Majesty spoke of."</b>`,
      `<b>"The King is not here. He is away at the front, where the rift in our sky is widest, mending the tear. He will return when it is closed."</b>`,
      `<b>"Until then, prove yourselves against the invaders. Each week, beat ${JG.weekly.need} of their bands, and the castle will reward you: 🥉 ${JG.weekly.bronze} bronze medals."</b>`,
    ]);
    j.met.knights = true; saveProfile(); jgHud(); refreshWalk();
    return;
  }
  await jgLines(face, nm, [j.tallyPaid
    ? `<b>"${JG.weekly.need} bands this week! Rest, champions. The count begins again on Monday."</b>`
    : `<b>"${Math.min(JG.weekly.need, j.tally || 0)} bands beaten this week. ${JG.weekly.need - Math.min(JG.weekly.need, j.tally || 0)} more for the castle's reward."</b>`]);
}
function jgGate(){
  return jgLines([], '', [`The great doors are shut, carved with flowers and stars. Beyond them you can hear fountains.<br><br><i>The knights will not open it while the King is away.</i>`]);
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
  const j = jgState(), opts = [];
  if(withRift) opts.push({ k:'rift', html:'🌀 The Time Rift', sub:'Selene, Vesper and the portals' });
  opts.push({ k:'last', html:'🌴 The jungle', sub:j.at ? 'Where you left off' : 'From the portal' });
  JG_TRIBE_KEYS.forEach(k=>{ if(j.found[k]) opts.push({ k, html:`${JG_TRIBES[k].icon} ${JG_TRIBES[k].name.replace(/^the /, 'The ')}`, sub:'Their village' }); });
  if(j.found.castle) opts.push({ k:'castle', html:'🏰 The Fairy King\'s castle', sub:'The south gate' });
  if(!withRift && opts.length === 1) return jgEnter('last');
  const ov = document.createElement('div');
  ov.className = 'refine-scrim jg-choose';
  ov.innerHTML = `<div class="refine-card"><div class="refine-name">Where to?</div>
      <div class="jg-choose-list">${opts.map(o=> `<button class="btn btn-ghost jg-go" data-k="${o.k}">${o.html}<small>${escapeHtml(o.sub)}</small></button>`).join('')}</div>
      <button class="btn btn-ghost" id="jgChooseNo" style="margin-top:10px;">Cancel</button></div>`;
  document.body.appendChild(ov);
  const close = ()=> ov.remove();
  ov.addEventListener('click', e=>{ if(e.target === ov) close(); });
  ov.querySelector('#jgChooseNo').addEventListener('click', ()=>{ close(); if(withRift) go('region'); });
  ov.querySelectorAll('.jg-go').forEach(btn=> btn.addEventListener('click', ()=>{
    close();
    const k = btn.dataset.k;
    if(k === 'rift') return riftGo();
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
    await jgSay([riftLucescoFace()], 'Lucesco', `<b>"Rrrr. I have never set paw in this land. But the Fairy King knows me well — he will help us."</b>`);
    await jgSay([riftLucescoFace()], 'Lucesco', `<b>"Stay close. These paths wind and split, and many go nowhere. The castle stands in the middle; the tribes live in the corners."</b>`);
    j.seen = true;
    saveProfile();
  } finally {
    if(gh) gh.remove();
    ui.jgTalk = false;
    w.busy = false;
    refreshWalk();
  }
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
  .walk-stage.jg-stage{ background:#163a22; }
  .jg-ground{ position:absolute; inset:0; width:100%; height:100%; display:block; z-index:0; pointer-events:none; }
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
  .walk-ent.jg-npc .jg-art{ position:absolute; left:50%; bottom:0; transform:translateX(-50%); image-rendering:pixelated; pointer-events:none;
    filter:drop-shadow(0 3px 2px rgba(0,0,0,.35)); }
  .walk-ent.jg-knight.face-r .jg-art{ transform:translateX(-50%) scaleX(-1); }
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
  .jg-choose .btn.jg-go{ display:flex; flex-direction:column; align-items:flex-start; text-align:left; }
  .jg-choose .btn.jg-go small{ font:700 11px/1.2 'Nunito',sans-serif; color:var(--ink-soft); margin-top:2px; }
  .jg-king-light svg{ display:block; }
  /* the fight */
  .enemy-card.jg-foe-alien .avatar-layer .mon-sprite{ filter:drop-shadow(0 0 3px #000) drop-shadow(0 0 3px #000) drop-shadow(0 0 10px rgba(220,20,30,1)) !important; }
  .enemy-card.jg-foe-mind .avatar-layer .mon-sprite{ filter:sepia(.7) saturate(3.4) hue-rotate(-30deg) brightness(.95) drop-shadow(0 0 7px rgba(255,40,40,1)) !important; }
  .enemy-card.jg-enraging .avatar-layer{ animation:jgEnrage 1.2s ease-out; }
  @keyframes jgEnrage{ 0%{ transform:scale(1); filter:brightness(1); } 30%{ transform:scale(1.22); filter:brightness(2.2) drop-shadow(0 0 16px #ff2020); } 100%{ transform:scale(1); filter:none; } }
  @media (prefers-reduced-motion: reduce){ .jg-band .jg-alien-art .jg-art, .enemy-card.jg-enraging .avatar-layer{ animation:none; } }
  `;
  document.head.appendChild(s);
}
