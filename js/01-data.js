/* ==========================================================
   01-data.js
   Game data: species, movesets, zones, assets. Add new monsters here.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */

/* ============================================================
   博刻MON (BoKeMON) — 博 broad learning · 刻 carving through diligence · MON monsters
   ------------------------------------------------------------
   This phase establishes:
   - the persistent save model (localStorage, wrapped in a small `store` shim)
   - embedded Region 1 game data (species + moves tables)
   - stat computation from the locked design formula
   - profile create / select / import
   - starter selection
   - home + region navigation, hamburger menu skeleton
   Battle, quiz, party management, catching etc. are stubbed as
   clearly-labelled "coming in a later phase" screens so the whole
   shell is walkable and testable now.
============================================================ */

/* ---------- GAME DATA (Region 1) ----------
   Mirrors the design spreadsheet. Growth rate is per 5 levels.
   `nerfedRate` = rate when encountered wild; `rate` = unnerfed (owned).
   Types feed the type-triangle system in a later phase.
   `color` + `glyph` are placeholder-art hints (SWAP POINT for real sprites). */
const SPECIES = {
  /* evoMult: single-evolution species get 1.5x the usual evolution bonus, to
     compensate for never gaining a second stage. */
  water_starter:   { name:'Turtle',      tier:'starter',   types:['Water'],         rate:10, nerfedRate:10, base:5,   evo:[21,36], color:'#3b7ea1', glyph:'水' },
  fire_starter:    { name:'Salamander',  tier:'starter',   types:['Fire'],          rate:10, nerfedRate:10, base:5,   evo:[21,36], color:'#d4643a', glyph:'火' },
  grass_starter:   { name:'Frog',        tier:'starter',   types:['Grass'],         rate:10, nerfedRate:10, base:5,   evo:[21,36], color:'#4a9d5b', glyph:'木' },
  ground_starter:  { name:'Rhino',       tier:'starter',   types:['Ground'],        rate:10, nerfedRate:10, base:5,   evo:[21,36], color:'#b08a5a', glyph:'土', npcOnlyRegion1:true },
  electric_starter:{ name:'Mouse',       tier:'special',   types:['Electric'],      rate:10, nerfedRate:10, base:20,  evo:[21,36], color:'#e0b53a', glyph:'电' },

  /* --- Region 1 wilds --- */
  rat:             { name:'Rat',         tier:'wild',      types:['Physical'],      rate:7,  nerfedRate:5,  base:5,   evo:[11],    evoMult:1.5, color:'#9a8f80', glyph:'鼠' },
  bird:            { name:'Bird',        tier:'wild',      types:['Flying'],        rate:7,  nerfedRate:5,  base:5,   evo:[18],    evoMult:1.5, color:'#7aa9d4', glyph:'鸟' },
  moth:            { name:'Moth',        tier:'wild',      types:['Grass'],         rate:7,  nerfedRate:5,  base:5,   evo:[18],    evoMult:1.5, color:'#a6789c', glyph:'蛾' },
  earth_snake:     { name:'Earth Snake', tier:'wild',      types:['Ground'],        rate:7,  nerfedRate:5,  base:5,   evo:[11,25], color:'#8a9a5b', glyph:'蛇', npcOnlyRegion1:true },

  /* --- Region 2: Sacred Grove --- */
  sparrow:         { name:'Sparrow',     tier:'wild',      types:['Flying'],        rate:7,  nerfedRate:5,  base:5,   evo:[18],    evoMult:1.5, color:'#8fa6c4', glyph:'雀' },
  squirrel:        { name:'Squirrel',    tier:'wild',      types:['Physical'],      rate:7,  nerfedRate:5,  base:5,   evo:[18],    evoMult:1.5, color:'#b58a5e', glyph:'松' },
  deer:            { name:'Deer',        tier:'wild',      types:['Physical'],      rate:7,  nerfedRate:5,  base:5,   evo:[18],    evoMult:1.5, color:'#a8845c', glyph:'鹿' },

  /* --- Region 2: Rocky Caverns --- */
  golem:           { name:'Golem',       tier:'wild',      types:['Ground'],        rate:7,  nerfedRate:5,  base:5,   evo:[11,25], color:'#8b8177', glyph:'岩' },
  bat:             { name:'Bat',         tier:'wild',      types:['Flying'],        rate:7,  nerfedRate:5,  base:5,   evo:[11,25], color:'#6b5f77', glyph:'蝠' },

  /* --- Region 2: Water Dojo --- */
  starfish:        { name:'Starfish',    tier:'wild',      types:['Water'],         rate:7,  nerfedRate:5,  base:5,   evo:[18],    evoMult:1.5, color:'#d98aa0', glyph:'星' },
  seahorse:        { name:'Seahorse',    tier:'wild',      types:['Water'],         rate:7,  nerfedRate:5,  base:5,   evo:[11,25], color:'#4fa3b8', glyph:'马' },
  duck:            { name:'Duck',        tier:'wild',      types:['Water'],         rate:7,  nerfedRate:5,  base:5,   evo:[18],    evoMult:1.5, color:'#c9b45e', glyph:'鸭' },

  /* --- Region 3: Port Akrotiri --- */
  snail:           { name:'Snail',       tier:'wild',      types:['Fire'],           rate:7,  nerfedRate:5,  base:31,  evo:[18],    evoMult:1.5, color:'#c47a4a', glyph:'蜗' },
  boobybird:       { name:'Boobybird',   tier:'wild',      types:['Fire'],           rate:7,  nerfedRate:5,  base:31,  evo:[11,25], color:'#d4713a', glyph:'鸟' },
  firefly:         { name:'Firefly',     tier:'wild',      types:['Fire'],           rate:7,  nerfedRate:5,  base:31,  evo:[18],    evoMult:1.5, color:'#e0a13a', glyph:'萤' },
  toad:            { name:'Toad',        tier:'elite',     types:['Fire','Steel'],   rate:11, nerfedRate:11, base:51,  evo:[],      color:'#a87c4a', glyph:'蟾' },
  /* Legendary who lost his crown: runs at elite growth until the story
     restores it, then regains rate 13 AND the three crowned stages. */
  monkey_king:     { name:'Monkey',      tier:'legendary', types:['Physical','Fairy'], rate:13, nerfedRate:13, base:61, evo:[31], evoMult:1.5,
                     color:'#b8813a', glyph:'猴', nerfedUntilCrowned:true, storyCrownOnly:true },

  newt_baby:       { name:'Thunder Newt Baby', tier:'special', types:['Psychic','Electric'], rate:0, nerfedRate:0, base:1, evo:[], color:'#7fa8c8', glyph:'蝾', isBaby:true, hatchesAt:31, hatchesInto:'newt' },
  newt:            { name:'Thunder Newt', tier:'legendary', types:['Psychic','Electric'], rate:13, nerfedRate:13, base:31, evo:[31], evoMult:1.5,
                     color:'#5f9ac8', glyph:'雷', nerfedUntilCrowned:true, storyCrownOnly:true },
  ankylosaurus:    { name:'Ankylosaurus', tier:'legendary', types:['Ground','Steel'], rate:13, nerfedRate:13, base:65, evo:[5], evoMult:1.5, color:'#7a8a6a', glyph:'甲' },

  /* --- Region 3: the Electric Dojo --- */
  thunderdog:      { name:'Thunderdog',     tier:'wild',  types:['Electric'], rate:7,  nerfedRate:5,  base:54, evo:[18],    evoMult:1.5, color:'#e0b53a', glyph:'犬' },
  zebra:           { name:'Zebra',          tier:'wild',  types:['Electric'], rate:7,  nerfedRate:5,  base:54, evo:[18],    evoMult:1.5, color:'#c8c2b4', glyph:'斑' },
  thunderlion:     { name:'Thunderlion',    tier:'wild',  types:['Electric'], rate:7,  nerfedRate:5,  base:54, evo:[18],    evoMult:1.5, color:'#d4a03a', glyph:'狮' },
  thundersquirrel: { name:'Thundersquirrel',tier:'wild',  types:['Electric'], rate:7,  nerfedRate:5,  base:60, evo:[],      color:'#c9903a', glyph:'鼠' },
  magnet:          { name:'Magnet',         tier:'wild',  types:['Electric'], rate:7,  nerfedRate:5,  base:60, evo:[11,25], color:'#9aa8b0', glyph:'磁' },
  tiger:           { name:'Tiger',          tier:'elite', types:['Electric'], rate:11, nerfedRate:11, base:60, evo:[18],    evoMult:1.5, color:'#e08a2a', glyph:'虎' },
  giraffe:         { name:'Giraffe',        tier:'elite', types:['Electric'], rate:11, nerfedRate:11, base:61, evo:[21,36], color:'#d8b45a', glyph:'鹿' },
  thundercat:      { name:'Thundercat',     tier:'elite', types:['Electric'], rate:11, nerfedRate:11, base:71, evo:[],      color:'#e8c23a', glyph:'猫' },

  /* --- Region 3: the sailor fans --- */
  sea_turtle:      { name:'Sea Turtle', tier:'wild',  types:['Water','Steel'],    rate:7,  nerfedRate:5,  base:55, evo:[18],    evoMult:1.5, color:'#4f8a7a', glyph:'龟' },
  plesiosaur:      { name:'Plesiosaur', tier:'elite', types:['Water','Steel'],    rate:11, nerfedRate:11, base:55, evo:[],      color:'#5a7f9a', glyph:'蛇' },
  otter:           { name:'Otter',      tier:'elite', types:['Water','Physical'], rate:11, nerfedRate:11, base:56, evo:[21,41], color:'#8a6a4a', glyph:'獭' },
  loong:           { name:'Loong',      tier:'elite', types:['Water','Dragon'],   rate:11, nerfedRate:11, base:57, evo:[41],    evoMult:1.5, color:'#3f8fa8', glyph:'龙' },
  ninja:           { name:'Ninja',      tier:'elite', types:['Water','Physical'], rate:11, nerfedRate:11, base:58, evo:[21,41], color:'#4a4a5a', glyph:'忍' },

  /* --- The Great Sage dojo challengers --- */
  boxer:           { name:'Boxer',        tier:'wild',  types:['Physical'], rate:7,  nerfedRate:5,  base:63, evo:[],      color:'#c8564a', glyph:'拳' },
  kicker:          { name:'Kicker',       tier:'wild',  types:['Physical'], rate:7,  nerfedRate:5,  base:63, evo:[],      color:'#b8704a', glyph:'腿' },
  spinner:         { name:'Spinner',      tier:'wild',  types:['Physical'], rate:7,  nerfedRate:5,  base:63, evo:[],      color:'#a87a5a', glyph:'旋' },
  judo_blue:       { name:'Judo Blue',    tier:'wild',  types:['Physical'], rate:7,  nerfedRate:5,  base:65, evo:[],      color:'#4a6a9a', glyph:'柔' },
  judo_red:        { name:'Judo Red',     tier:'wild',  types:['Physical'], rate:7,  nerfedRate:5,  base:65, evo:[],      color:'#9a4a4a', glyph:'道' },
  weasel:          { name:'Weasel',       tier:'wild',  types:['Physical'], rate:7,  nerfedRate:5,  base:65, evo:[18],    evoMult:1.5, color:'#b09a6a', glyph:'太' },
  yoga:            { name:'Yoga',         tier:'wild',  types:['Physical'], rate:7,  nerfedRate:5,  base:65, evo:[11,25], color:'#8a6a9a', glyph:'瑜' },
  fighting_ape:    { name:'Fighting Ape', tier:'wild',  types:['Physical'], rate:7,  nerfedRate:5,  base:67, evo:[18],    evoMult:1.5, color:'#7a5a4a', glyph:'猿' },
  lizardape:       { name:'Lizardape',    tier:'elite', types:['Physical'], rate:11, nerfedRate:11, base:67, evo:[21,36], color:'#5a7a5a', glyph:'蜥' },
  strongman:       { name:'Strongman',    tier:'wild',  types:['Physical'], rate:7,  nerfedRate:5,  base:67, evo:[11,25], color:'#8a5a3a', glyph:'力' },

  /* --- Electric, for the siblings and Figlio --- */
  thunderhound:    { name:'Thunderhound', tier:'elite', types:['Electric'], rate:11, nerfedRate:11, base:67, evo:[21],    evoMult:1.5, color:'#d8a83a', glyph:'獒' },
  howler:          { name:'Howler',       tier:'elite', types:['Electric'], rate:11, nerfedRate:11, base:71, evo:[25],    evoMult:1.5, color:'#c89a4a', glyph:'嚎' },

  /* --- Region 4: the North Sea --- */
  whale:           { name:'Whale',     tier:'wild',      types:['Water'],        rate:7,  nerfedRate:5,  base:70, evo:[25], evoMult:1.5, color:'#4a7a9a', glyph:'鲸' },
  /* Cuain. A legendary running on a hole where his core should be — elite in
     every respect until Region 5 gives it back. One evolution's worth of stats
     baked in, like Phoenix: he arrives already grown. */
  whalelord:       { name:'Whalelord', tier:'legendary', types:['Water','Ghost'], rate:13, nerfedRate:11, base:66, evo:[], evoMult:1.5,
                     color:'#3a5a7a', glyph:'鲲', nerfedUntilCrowned:true, storyCrownOnly:true, preEvolved:true },

  /* --- Legendaries & story --- */
  /* --- Region 2: Rocky Caverns starters --- */
  flying_starter:  { name:'Raven',       tier:'starter',   types:['Flying'],        rate:10, nerfedRate:10, base:5,   evo:[21,36], color:'#6b7a8f', glyph:'鸦' },
  physical_starter:{ name:'Jackal',      tier:'starter',   types:['Physical'],      rate:10, nerfedRate:10, base:5,   evo:[21,36], color:'#a8814f', glyph:'豺' },
  ghost_starter:   { name:'Shadow',      tier:'starter',   types:['Ghost'],         rate:10, nerfedRate:10, base:5,   evo:[21,36], color:'#5c5470', glyph:'影' },
  psychic_starter: { name:'Fox',         tier:'starter',   types:['Psychic'],       rate:10, nerfedRate:10, base:5,   evo:[21,36], color:'#b06a9e', glyph:'狐' },

  /* --- Elites: no evolutions, flat growth, bigger protein cap --- */
  sumo:            { name:'Sumo',        tier:'elite',     types:['Physical'],      rate:11, nerfedRate:11, base:5,   evo:[],      color:'#c08a6a', glyph:'相' },
  goblin:          { name:'Goblin',      tier:'elite',     types:['Ghost'],         rate:11, nerfedRate:11, base:5,   evo:[],      color:'#6d7a5a', glyph:'鬼' },
  squid:           { name:'Squid',       tier:'elite',     types:['Psychic'],       rate:11, nerfedRate:11, base:5,   evo:[],      color:'#8a6aa8', glyph:'鱿' },




  /* --- Story monsters --- */
  lanternfish:     { name:'Lanternfish', tier:'wild',      types:['Water','Electric'], rate:7, nerfedRate:5, base:5, evo:[18], evoMult:1.5, color:'#4fa8b8', glyph:'灯' },
  water_dragon:    { name:'Water Dragon',tier:'legendary', types:['Water','Dragon'],rate:13, nerfedRate:13, base:100, evo:[31],    evoMult:1.5, color:'#2f7fa8', glyph:'龙', bossOnly:true },
  /* Hatched from the egg with its core still missing: legendary by nature,
     elite in practice until Region 5 returns what was taken. */
  water_dragon_nerfed:{ name:'Water Dragon', tier:'legendary', types:['Water','Dragon'],rate:13, nerfedRate:11, base:31, evo:[31], evoMult:1.5,
                     color:'#5a92a8', glyph:'龙', weakened:true, nerfedUntilCrowned:true, storyCrownOnly:true },
  dragon_egg:      { name:'Dragon Egg',  tier:'special',   types:['Water','Dragon'],rate:0,  nerfedRate:0,  base:1,   evo:[],      color:'#7fa8b8', glyph:'卵', isEgg:true, hatchesAt:31, hatchesInto:'water_dragon_nerfed' },

  phoenix:         { name:'Phoenix',     tier:'legendary', types:['Fire','Flying'], rate:13, nerfedRate:13, base:25,  evo:[],      evoMult:1.5, color:'#c8453a', glyph:'凤', frozenRegion1:true, bonusStages:1 },
  forest_fairy:    { name:'Forest Fairy',tier:'legendary', types:['Grass','Fairy'], rate:13, nerfedRate:13, base:100, evo:[1],     evoMult:1.5, color:'#5fa86b', glyph:'仙', bossOnly:true },
  sacred_seed:     { name:'Sacred Seed', tier:'special',   types:['Grass'],         rate:0,  nerfedRate:0,  base:1,   evo:[],      color:'#7fa86b', glyph:'种', isSeed:true },
};

/* Move tables live here for later phases; unused in Phase 1 but embedded now
   so battle/stats pages can read them without another data pass. */
const MOVES = {
  /* [slot, name, multiplier, target, words, unlockLevel, extras?]
     extras: { scale:{per,max} } — keeps accepting words past the requirement,
              adding `per` to the multiplier each time, up to `max`.
             { hits:n } — the total damage lands as n separate strikes on the
              same target, so per-hit effects (Leech Seed) trigger n times. */
  water_starter:   [['Basic','Tackle',0.2,'Single',2,1],['Power1','Bubble',0.4,'Single',4,5],['Power2','Surf',0.6,'AOE',8,21],['Ultimate','Waterfall',1.25,'Single',8,41],['Max','Waterfall Max',1.5,'Single',8,51]],
  fire_starter:    [['Basic','Scratch',0.2,'Single',2,1],['Power1','Ember',0.4,'Single',4,5],['Power2','Flamethrower',0.6,'AOE',8,21],['Ultimate','Fire Blast',1.25,'Single',8,41],['Max','Fire Blast Max',1.5,'Single',8,51]],
  grass_starter:   [['Basic','Tackle',0.2,'Single',2,1],['Power1','Vine Whip',0.4,'Single',4,5],['Power2','Razor Leaf',0.6,'AOE',8,21],['Ultimate','Solar Beam',1.25,'Single',8,41],['Max','Solar Beam Max',1.5,'Single',8,51]],
  ground_starter:  [['Basic','Tackle',0.2,'Single',2,1],['Power1','Body Slam',0.4,'Single',4,5],['Power2','Earthquake',0.6,'AOE',8,21],['Ultimate','Horn Drill',1.25,'Single',8,41],['Max','Horn Drill Max',1.5,'Single',8,51]],
  electric_starter:[['Basic','Tackle',0.2,'Single',2,1],['Power1','Thundershock',0.4,'Single',4,5],['Power2','Thunderbolt',0.6,'AOE',8,21],['Ultimate','Thunder',1.25,'Single',8,41],['Max','Thunder Max',1.5,'Single',8,51]],

  rat:             [['Basic','Tackle',0.2,'Single',2,1],['Power1','Bite',0.4,'Single',4,5],['Power2','Fury Swipes',0.6,'AOE',8,11],['Ultimate','Super Fang',1.25,'Single',8,25]],
  bird:            [['Basic','Peck',0.2,'Single',2,1],['Power1','Claw',0.4,'Single',4,5],['Power2','Gust',0.6,'AOE',8,11],['Ultimate','Aerial Ace',1.25,'Single',8,25]],
  moth:            [['Basic','Tackle',0.2,'Single',2,1],['Power1','Sting',0.4,'Single',4,5],['Power2','Poison Powder',0.6,'AOE',8,11],['Ultimate','Revitalise',null,'Support',10,25]],
  earth_snake:     [['Basic','Tackle',0.2,'Single',2,1],['Power1','Bite',0.4,'Single',4,5],['Power2','Tail Whip',0.6,'AOE',8,11],['Ultimate','Constrict',1.25,'Single',8,25]],

  sparrow:         [['Basic','Peck',0.2,'Single',2,1],['Power1','Quick Attack',0.4,'Single',4,5],['Power2','Whirlwind',0.6,'AOE',8,18],['Ultimate','Sky Dive',1.25,'Single',8,28]],
  squirrel:        [['Basic','Scratch',0.2,'Single',2,1],['Power1','Headbutt',0.4,'Single',4,5],['Power2','Acorn Barrage',0.6,'AOE',8,18],['Ultimate','Spin Slam',1.25,'Single',8,28]],
  deer:            [['Basic','Tackle',0.2,'Single',2,1],['Power1','Horn Jab',0.4,'Single',4,5],['Power2','Stampede',0.6,'AOE',8,18],['Ultimate','Antler Charge',1.25,'Single',8,28]],

  golem:           [['Basic','Rock Toss',0.2,'Single',2,1],['Power1','Boulder Punch',0.4,'Single',4,5],['Power2','Rockslide',0.6,'AOE',8,18],['Ultimate','Seismic Slam',1.25,'Single',8,28]],
  bat:             [['Basic','Bite',0.2,'Single',2,1],['Power1','Wing Slash',0.4,'Single',4,5],['Power2','Screech',0.6,'AOE',8,18],['Ultimate','Night Swoop',1.25,'Single',8,28]],

  starfish:        [['Basic','Slap',0.2,'Single',2,1],['Power1','Water Gun',0.4,'Single',4,5],['Power2','Spiral Spray',0.6,'AOE',8,18],['Ultimate','Tidal Star',1.25,'Single',8,28]],
  seahorse:        [['Basic','Tackle',0.2,'Single',2,1],['Power1','Bubble Jet',0.4,'Single',4,5],['Power2','Whirlpool',0.6,'AOE',8,18],['Ultimate','Aqua Lance',1.25,'Single',8,28]],
  duck:            [['Basic','Peck',0.2,'Single',2,1],['Power1','Splash Wing',0.4,'Single',4,5],['Power2','Downpour',0.6,'AOE',8,18],['Ultimate','Torrent Dive',1.25,'Single',8,28]],

  /* --- Rocky Caverns starters: same shape as the Region 1 starters --- */
  flying_starter:  [['Basic','Peck',0.2,'Single',2,1],['Power1','Wing Slash',0.4,'Single',4,5],['Power2','Gale Force',0.6,'AOE',8,21],['Ultimate','Storm Dive',1.25,'Single',8,41],['Max','Storm Dive Max',1.5,'Single',8,51]],
  physical_starter:[['Basic','Scratch',0.2,'Single',2,1],['Power1','Lunge',0.4,'Single',4,5],['Power2','Rend',0.6,'AOE',8,21],['Ultimate','Savage Strike',1.25,'Single',8,41],['Max','Savage Strike Max',1.5,'Single',8,51]],
  ghost_starter:   [['Basic','Touch',0.2,'Single',2,1],['Power1','Shadow Sneak',0.4,'Single',4,5],['Power2','Nightfall',0.6,'AOE',8,21],['Ultimate','Umbral Rend',1.25,'Single',8,41],['Max','Umbral Rend Max',1.5,'Single',8,51]],
  psychic_starter: [['Basic','Tackle',0.2,'Single',2,1],['Power1','Mind Jab',0.4,'Single',4,5],['Power2','Psywave',0.6,'AOE',8,21],['Ultimate','Mind Shatter',1.25,'Single',8,41],['Max','Mind Shatter Max',1.5,'Single',8,51]],

  /* --- Elites: never evolve, so their kit is their whole identity --- */
  sumo:            [['Basic','Slap',0.2,'Single',2,1],['Power1','Palm Thrust',0.4,'Single',4,5],['Power2','Earth Stomp',0.6,'AOE',8,21],['Ultimate','Grand Charge',1.25,'Single',8,41],['Max','Grand Charge Max',1.5,'Single',8,51]],
  goblin:          [['Basic','Claw',0.2,'Single',2,1],['Power1','Hex',0.4,'Single',4,5],['Power2','Shadow Cackle',0.6,'AOE',8,21],['Ultimate','Grave Mischief',1.25,'Single',8,41],['Max','Grave Mischief Max',1.5,'Single',8,51]],
  squid:           [['Basic','Ink Jet',0.2,'Single',2,1],['Power1','Tentacle Slap',0.4,'Single',4,5],['Power2','Mind Fog',0.6,'AOE',8,21],['Ultimate','Abyssal Gaze',1.25,'Single',8,41],['Max','Abyssal Gaze Max',1.5,'Single',8,51]],

  snail:           [['Basic','Roll',0.2,'Single',2,1],['Power1','Molten Gout',0.4,'Single',4,1],
                    ['Power2','Lava Shell',null,'Self',8,18,{shell:{reduce:0.6, thorns:0.5, turns:1}}],
                    ['Ultimate','Magma Goo',null,'AOE',8,25,{dot:{pct:0.3, turns:5, rider:'noflee'}}]],
  boobybird:       [['Basic','Fire Punch',0.2,'Single',2,1],['Power1','Fire Breath',0.4,'Single',4,1],['Power2','Flamethrower',0.6,'AOE',8,11],['Ultimate','Eruption',1.0,'AOE',8,25]],
  firefly:         [['Basic','Cinder',0.2,'Single',2,1],['Power1','Cinder Wing',0.4,'Single',4,1],['Power2','Cinder Gust',0.6,'AOE',8,18],
                    ['Ultimate','Scorching Ash',null,'AOE',8,25,{dot:{pct:0.3, turns:5, rider:'miss', miss:0.20}}]],
  toad:            [['Basic','Leap',0.2,'Single',2,1],['Power1','Flame Lash',0.4,'Single',4,1],['Power2','Slag Cannon',0.6,'AOE',8,21],
                    ['Ultimate','Slag Eruption',0.8,'AOE',8,41,{shell:{reduce:0, thorns:0.3, turns:1}}],
                    ['Max','Slag Eruption Max',1.0,'AOE',8,51,{shell:{reduce:0, thorns:0.5, turns:1}}]],
  monkey_king:     [['Basic','Jingu Thrust',0.3,'Single',2,1],
                    ['Power1','Cloud Step',0.8,'Single',4,1,{stun:0.5}],
                    ['Power2','72 Transformations',null,'Self',4,35,{clones:{turns:3, mult:0.5, evade:0.20}}],
                    ['Ultimate','Heavensplitter',1.25,'Single',7,45,{bonus:{words:4, mult:2}}],
                    ['Max','Heavensplitter Max',1.5,'Single',7,999,{bonus:{words:4, mult:2}, coreOnly:true}]],

  /* --- Story monsters --- */
  lanternfish:     [['Basic','Bump',0.2,'Single',2,1],['Power1','Shock Bubble',0.4,'Single',4,5],['Power2','Lantern Flash',0.6,'AOE',8,18],['Ultimate','Deep Current',1.25,'Single',8,28]],
  /* Cataclysm is a CHARGING ultimate — see the charge engine below. Its 'Max'
     upgrade is unlocked by the Dragon Core, not by level. */
  water_dragon:    [['Basic','Aqua Fang',0.3,'Single',4,1],['Power1','Torrent Claw',0.6,'Single',8,5],['Power2','Tsunami',0.8,'AOE',10,35],
                    ['Ultimate','Cataclysm',null,'Charge',10,45,{charge:{max:2, unleash:1.0, hyper:1.5}}],
                    ['Max','Cataclysm Max',null,'Charge',10,999,{charge:{max:3, unleash:1.25, hyper:1.75}, coreOnly:true}]],
  water_dragon_nerfed:[['Basic','Aqua Fang',0.3,'Single',4,1],['Power1','Torrent Claw',0.6,'Single',8,5],['Power2','Tsunami',0.8,'AOE',10,35],
                    ['Ultimate','Cataclysm',null,'Charge',10,45,{charge:{max:2, unleash:1.0, hyper:1.5}}],
                    ['Max','Cataclysm Max',null,'Charge',10,999,{charge:{max:3, unleash:1.25, hyper:1.75}, coreOnly:true}]],
  dragon_egg:      [['Basic',null,null,null,null,999],['Power1',null,null,null,null,999],['Power2',null,null,null,null,999],['Ultimate',null,null,null,null,999]],

  phoenix:         [['Basic','Ember',0.3,'Single',4,1],['Power1','Firestorm',0.6,'AOE',8,5],['Power2','Nova',1.0,'AOE',8,35],
                    ['Ultimate','Incinerate',1.25,'Single',8,45,{scale:{per:0.15,max:2.0}}],
                    ['Max','Incinerate Max',1.5,'Single',8,55,{scale:{per:0.15,max:2.5}}]],
  forest_fairy:    [['Basic','Fairy Wind',0.4,'Single',2,1],['Power1','Giga Drain',0.8,'Single',5,5],['Power2','Overgrowth',0.7,'AOE',8,35],
                    ['Ultimate','Verdant Wrath',1.4,'Single',10,45,{hits:2, split:true}],
                    ['Max','Verdant Wrath Max',1.8,'Single',10,55,{hits:3, split:true}]],
  newt_baby:       [['Basic',null,null,null,null,999],['Power1',null,null,null,null,999],['Power2',null,null,null,null,999],['Ultimate',null,null,null,null,999]],
  newt:            [['Basic','Psyshock',0.2,'Single',4,31,{paralyse:0.20}],
                    ['Power1','Psywave',0.5,'AOE',8,31,{paralyse:0.20}],
                    ['Power2','Tachypsychia',null,'Self',4,35,{tachy:{turns:3, bonusAction:0.30, evadeFirst:0.80, evadeAfter:0.30}}],
                    ['Ultimate','Volt Concussion',0.4,'Single',8,45,{hits:3, paralyse:0.20}],
                    ['Max','Volt Concussion Max',0.4,'Single',8,999,{hits:4, paralyse:0.20, coreOnly:true}]],
  ankylosaurus:    [['Basic','Hammertail',0.1,'Single',4,1,{hits:3}],
                    ['Power1','Seismic Shock',0.2,'AOE',8,1,{hits:2}],
                    ['Power2','Steel Soul',null,'Self',4,35,{soul:{turns:3, reduce:0.2, bonus:0.1}}],
                    ['Ultimate','Rampage',0.2,'AOE',8,45,{hits:5}],
                    ['Max','Rampage Max',0.3,'AOE',8,55,{hits:5, bonus:{words:2, aftershock:true}}]],
  /* Swift Strike: an enemy using it seizes the initiative; the player, who
     usually moves first anyway, gets extra power instead. */
  thunderdog:      [['Basic','Bite',0.2,'Single',2,1],
                    ['Power1','Swift Strike',0.3,'Single',4,1,{first:true, playerBonus:0.2}],
                    ['Power2','Thunderhowl',0.5,'AOE',8,18],
                    ['Ultimate','Pack Attack',0.5,'Single',8,25,{hits:3}]],
  zebra:           [['Basic','Kick',0.2,'Single',2,1],
                    ['Power1','Swift Strike',0.3,'Single',4,1,{first:true, playerBonus:0.2}],
                    ['Power2','Blitz Strike',0.5,'AOE',8,18],
                    ['Ultimate','Thundercrash',1.5,'Single',8,25]],
  thunderlion:     [['Basic','Claw',0.2,'Single',2,1],
                    ['Power1','Swift Strike',0.3,'Single',4,1,{first:true, playerBonus:0.2}],
                    ['Power2','Thundershred',0.6,'AOE',8,25],
                    ['Ultimate','Pride Attack',0.5,'Single',8,25,{hits:3}]],
  thundersquirrel: [['Basic','Tackle',0.2,'Single',2,1],
                    ['Power1','Acorn Bolt',0.4,'Single',4,1],
                    ['Power2','Thunderroll',0.6,'AOE',8,18],
                    ['Ultimate','Charm',null,'Single',8,25,{charm:{turns:5, chance:0.20}}]],
  magnet:          [['Basic','Spark',0.2,'Single',2,1],
                    ['Power1','Magnet Pulse',0.4,'Multi2',5,1],
                    ['Power2','Magnet Wave',0.5,'AOE',8,18],
                    ['Ultimate','Disrupt',null,'Single',8,25,{disrupt:{turns:5, stun:0.15}}]],
  tiger:           [['Basic','Tackle',0.2,'Single',2,1],
                    ['Power1','Thunderfist',0.5,'Single',4,1],
                    ['Power2','Thunderlariat',0.6,'AOE',8,21],
                    ['Ultimate','Tesla Bolt',0.4,'Single',8,41,{hits:3, stunHit:0.15}],
                    ['Max','Tesla Bolt Max',0.4,'Single',8,51,{hits:4, stunHit:0.15}]],
  giraffe:         [['Basic','Tackle',0.2,'Single',2,1],
                    ['Power1','Orb Beam',0.5,'Single',4,1],
                    ['Power2','Thundertail',0.6,'AOE',8,21],
                    ['Ultimate','Livewire',1.1,'Single',8,41,{repeat:0.20}],
                    ['Max','Livewire Max',1.4,'Single',8,51,{repeat:0.20}]],
  /* Lightning Cat is a PASSIVE — it takes effect the moment Thundercat enters
     the field and is never chosen as an action. */
  thundercat:      [['Basic','Swipe',0.2,'Single',2,1],
                    ['Power1','Wildbolt',0.5,'Single',4,1],
                    ['Power2','Lightning Cat',null,'Passive',0,21,{passive:{first:true, playerDouble:0.20}}],
                    ['Ultimate','Omnislash',1.0,'SingleAOE',8,41,{splash:0.5}],
                    ['Max','Omnislash Max',1.1,'SingleAOE',8,51,{splash:0.65}]],
  /* Several of these are BOTH passive and active: the passive fires on entering
     the field, the active can be used again later for the same effect. */
  sea_turtle:      [['Basic','Slap',0.2,'Single',2,1],
                    ['Power1','Beak Crush',0.4,'Single',4,1],
                    ['Power2','Iron Shell',null,'Passive',0,18,{passive:{block:3}}],
                    ['Ultimate','Whirlpool',0.8,'AOE',8,25]],
  plesiosaur:      [['Basic','Slam',0.3,'Single',2,1],
                    ['Power1','Water Jet',0.5,'Single',4,1],
                    ['Power2','Crashing Wave',0.6,'AOE',8,21],
                    ['Ultimate','Fortress',0.3,'Single',8,41,{passive:{block:2}, hits:3, randomTargets:true}],
                    ['Max','Fortress Max',0.3,'Single',8,51,{passive:{block:2}, hits:4, randomTargets:true, regainBlock:1}]],
  otter:           [['Basic','Bite',0.3,'Single',2,1],
                    ['Power1','Tsuki',0.5,'Single',4,1],
                    ['Power2','Guard',null,'Self',4,21,{passive:{guard:true, block:1}, grant:{guard:true, block:1}, blockedWhile:'guard'}],
                    ['Ultimate','Iaijutsu',1.0,'Single',8,41,{spend:{status:'guard', clearBlock:true, mult:1.6, perStack:0.2}}],
                    ['Max','Iaijutsu Max',1.2,'Single',8,51,{spend:{status:'guard', clearBlock:true, mult:1.8, perStack:0.25}}]],
  loong:           [['Basic','Bite',0.3,'Single',2,1],
                    ['Power1','Water Jet',0.5,'Single',4,1],
                    ['Power2','Soar',null,'Self',4,21,{passive:{airborne:1}, grant:{airborne:1}, blockedWhile:'airborne'}],
                    ['Ultimate','Dragon Dive',0.8,'AOE',8,41,{spend:{status:'airborne', mult:1.6}}],
                    ['Max','Dragon Dive Max',1.0,'AOE',8,51,{spend:{status:'airborne', mult:2.0}}]],
  ninja:           [['Basic','Slash',0.3,'Single',2,1],
                    ['Power1','Shurikens',0.3,'Multi2',5,1],
                    ['Power2','Onkei-jutsu',null,'Self',4,21,{passive:{invisible:1}, grant:{invisible:1, prep:1}}],
                    ['Ultimate','Ansatsu',1.0,'Single',8,41,{spend:{status:'invisible', clearPrep:true, mult:1.5, perPrep:0.3}}],
                    ['Max','Ansatsu Max',1.2,'Single',8,51,{spend:{status:'invisible', clearPrep:true, mult:1.7, perPrep:0.4}}]],

  /* --- Great Sage dojo. The first three strike before the player, as the
         Electric trio do; the rest trade their AOE Power2 for a passive stance
         and take a weak AOE on Power1 instead. --- */
  boxer:           [['Basic','Jab',0.2,'Single',2,1],
                    ['Power1','Lead Hook',0.3,'Single',4,1,{first:true, playerBonus:0.2}],
                    ['Power2','Body Blow',0.5,'AOE',8,18],
                    ['Ultimate','Combination',0.5,'Single',8,25,{hits:3}]],
  kicker:          [['Basic','Low Kick',0.2,'Single',2,1],
                    ['Power1','Snap Kick',0.3,'Single',4,1,{first:true, playerBonus:0.2}],
                    ['Power2','Roundhouse',0.5,'AOE',8,18],
                    ['Ultimate','Axe Kick',1.5,'Single',8,25]],
  spinner:         [['Basic','Palm Strike',0.2,'Single',2,1],
                    ['Power1','Whirl Step',0.3,'Single',4,1,{first:true, playerBonus:0.2}],
                    ['Power2','Cyclone Sweep',0.5,'AOE',8,18],
                    ['Ultimate','Drill Spin',0.5,'Single',8,25,{hits:3}]],

  judo_blue:       [['Basic','Grip',0.2,'Single',2,1],
                    ['Power1','Osoto Gari',0.3,'AOE',4,1],
                    ['Power2','Kumi-kata',null,'Passive',0,21,{passive:{block:1}}],
                    ['Ultimate','Seoi Nage',null,'Single',8,25,{reflect:1.0}]],
  judo_red:        [['Basic','Grip',0.2,'Single',2,1],
                    ['Power1','Harai Goshi',0.3,'AOE',4,1],
                    ['Power2','Kumi-kata',null,'Passive',0,21,{passive:{block:1}}],
                    ['Ultimate','Seoi Nage',null,'Single',8,25,{reflect:1.0}]],
  weasel:          [['Basic','Push Hands',0.2,'Single',2,1],
                    ['Power1','Cloud Hands',0.3,'AOE',4,1],
                    ['Power2','Silk Reeling',null,'Passive',0,21,{passive:{counterTurns:1, counterRet:0.5}}],
                    ['Ultimate','Four Ounces',null,'Single',8,25,{reflect:1.0}]],

  yoga:            [['Basic','Breath Strike',0.2,'Single',2,1],
                    ['Power1','Sun Salutation',0.3,'AOE',4,1],
                    ['Power2','Stillness',null,'Passive',0,21,{passive:{evadeTurns:1, evadeChance:1.0}}],
                    ['Ultimate','Asana Flow',0.2,'Single',8,25,{hits:6, fullHpDouble:true}]],

  fighting_ape:    [['Basic','Knuckle Drag',0.2,'Single',2,1],
                    ['Power1','Chest Beat',0.3,'AOE',4,1],
                    ['Power2','Iron Hide',null,'Passive',0,21,{passive:{block:1}}],
                    ['Ultimate','Ground Pound',0.6,'AOE',8,25]],
  lizardape:       [['Basic','Tail Lash',0.35,'Single',2,1],
                    ['Power1','Seismic Roar',0.5,'AOE',4,1],
                    ['Power2','Scaled Stance',null,'Passive',0,21,{passive:{block:1, counterTurns:1, counterRet:0.5}}],
                    ['Ultimate','Primal Rend',0.5,'Single',8,41,{hits:3}],
                    ['Max','Primal Rend Max',0.4,'Single',8,51,{hits:4, fullHpDouble:true}]],
  strongman:       [['Basic','Shoulder Barge',0.2,'Single',2,1],
                    ['Power1','Shockwave Clap',0.3,'AOE',4,1],
                    ['Power2','Braced Stance',null,'Passive',0,21,{passive:{block:2}}],
                    ['Ultimate','Bearhug',1.0,'Single',8,25,{stunHit:0.50}]],

  /* --- Electric --- */
  thunderhound:    [['Basic','Snap',0.2,'Single',2,1],
                    ['Power1','Rolling Thunder',0.6,'AOE',4,1],
                    ['Power2','Hunter\'s Instinct',null,'Passive',0,21,{passive:{thresholdStun:[0.75,0.50,0.25]}}],
                    ['Ultimate','Throat Take',1.2,'Single',8,41],
                    ['Max','Throat Take Max',1.5,'Single',8,51,{stunnedMult:2.0}]],
  howler:          [['Basic','Bark',0.2,'Single',2,1],
                    ['Power1','Static Howl',0.5,'AOE',4,1],
                    ['Power2','Alpha Call',null,'Passive',0,21,{passive:{block:1}}],
                    ['Ultimate','Sky Splitter',1.0,'AOE',8,41],
                    ['Max','Sky Splitter Max',1.25,'AOE',8,51,{stunHit:0.25, softenHit:{chance:0.50, amount:0.50}}]],

  whale:           [['Basic','Tail Slap',0.25,'Single',2,1],
                    ['Power1','Breaching Swell',0.4,'AOE',4,1],
                    ['Power2','Bulk',null,'Passive',0,1,{passive:{block:2}}],
                    ['Ultimate','Depth Charge',1.5,'Single',8,25]],

  /* Every move pays more the worse things are going. */
  whalelord:       [['Basic','Malice',0.3,'Single',2,1],
                    ['Power1','Grudge',null,'AOE',5,1,{grudge:{flat:0.25, missing:0.75}, passive:{noFlee:true}}],
                    ['Power2','Haunting Aria',null,'Self',5,1,{aria:{turns:5, pulse:0.5, chance:0.50}}],
                    ['Ultimate','Vengeance',1.25,'Single',8,1,{wrath:{turns:5, per:0.2, bonus:0.03, bonusCap:0.30, dmgCap:15}}],
                    ['Max','Vengeance Max',1.5,'Single',10,1,{wrath:{turns:5, per:0.3, bonus:0.05, bonusCap:0.50, dmgCap:15}}]],

  sacred_seed:     [['Basic',null,null,null,null,999],['Power1',null,null,null,null,999],['Power2',null,null,null,null,999],['Ultimate',null,null,null,null,999]],
};

const TYPE_COLORS = {
  Water:'#3b7ea1', Fire:'#d4643a', Grass:'#4a9d5b', Electric:'#e0b53a',
  Flying:'#7aa9d4', Ground:'#b08a5a', Physical:'#9a8f80', Psychic:'#b3689e',
  Ghost:'#6b5b95', Dragon:'#5a6fc0', Steel:'#8a949e', Fairy:'#d98fb0',
};

const STARTER_CHOICES = ['water_starter','fire_starter','grass_starter'];

/* Player avatars: five per gender, chosen when a trainer is created.
   Art lives at assets/avatar/<id>.png; a lettered tile stands in until then. */
const AVATARS = {
  male:   ['m1','m2','m3','m4','m5'],
  female: ['f1','f2','f3','f4','f5'],
};
const ALL_AVATARS = [...AVATARS.male, ...AVATARS.female];
/* Avatars are FULL BODY, so the art is contained (never cropped) inside its
   square. Anything with `bare` drops the tile background for a clean cut-out. */
function avatarImg(id, size, opts){
  opts = (typeof opts === 'string') ? { cls:opts } : (opts || {});
  const px = size||64;
  const safe = id || 'm1';
  const bg = opts.bare ? 'transparent' : 'var(--paper-3)';
  const radius = opts.bare ? 0 : Math.round(px*0.24);
  return `<img src="assets/avatar/${safe}.png" alt="" class="avatar-img ${opts.cls||''}"
    data-px="${px}" data-id="${safe}" data-bare="${opts.bare?1:0}"
    style="width:${px}px;height:${px}px;border-radius:${radius}px;object-fit:contain;background:${bg};"
    onerror="avatarFallback(this)">`;
}
function avatarFallback(img){
  try{
    const px = +img.dataset.px, id = img.dataset.id||'m1';
    const female = id.startsWith('f');
    const bare = img.dataset.bare === '1';
    img.outerHTML = `<div class="avatar-img" style="width:${px}px;height:${px}px;border-radius:${bare?0:Math.round(px*0.24)}px;
      background:${bare?'transparent':(female?'#b5708f':'#5a7fa8')};color:${bare?(female?'#b5708f':'#5a7fa8'):'#fff'};
      display:flex;align-items:center;justify-content:center;
      font-family:'Baloo 2',cursive;font-weight:800;font-size:${Math.round(px*0.42)}px;">${female?'♀':'♂'}</div>`;
  }catch(e){}
}
/* Existing saves predate avatars — playerAvatar() returns null for them so the
   UI can invite the player to pick one instead of silently assigning. */
function playerAvatar(){ return (state && state.avatar) || null; }

