/* ==========================================================
   15-region5.js
   Region 5 — Cosa Nostia. Part one: the lower town (the
   harbour) and the first tier of the catacombs under it.
   Loads after 14-stealth.js and before 11-app.js.
   ========================================================== */

/* ------------------------------------------------------------
   THE STORY SO FAR
   The Vane Shear docks at Cosa Nostia. Jax flew the Whalelord's core here,
   and the Whalelord can feel it at the very top of the town — in the Old
   Town, behind a barred gate, above a funicular the Family owns. The only
   other way up is under: the catacombs, a thousand years of the town's dead,
   where the Family's soldatos carry crates by lantern light. The Family's
   boats bring them in through the sea cave on the beach; the old way in, the
   arch in the cliff, is barred.

   The catacombs do not go down: they climb (2.90). In at the sea cave, at
   sea level, and up through the hill under the town, tier by tier — the
   first under the harbour's slopes, the second under the Old Town. Every
   floor is drawn with up the page as up the hill, as the town's maps are.

   Part one:
     the harbour     walked, like the ship's decks. Townsfolk, services, and
                     a soldato at the sea cave who has to be beaten.
     the catacombs   four floors, walked in the dark (14-stealth.js), each
                     with two side rooms off it, one through the other (2.72)
       The Landing     fight floor · three soldatos and a lookout
                       → The Counting Room → The Old Ossuary
       The Cistern     fight floor · the Black Capo on the bridge (optional)
                       → The Pump Room → The Drowned Chapel
       The Bone Halls  evade floor · far too many to fight
                       → The Charnel House → The Skull Wall (fight rooms)
       The Long Stair  fight floor · the Purple Capo at the top, before a
                       gate barred from the other side. Beating him ends part one.
                       → The Barracks → The Armoury
   Every fight floor and every side room has at least three soldatos and a
   lookout. Beaten, they stay away for the rest of the day; each new day the
   Family regroups and every post is manned again. The capos stay beaten.
   Both capos are the ones from Region 2's caverns, sent down here since.
   Everyone the Family sends is a man.
   Beyond the Long Stair's gate the Whalelord feels far too many soldiers to
   fight through: the floors above stay sealed until the story opens them.

   Tier 2 (2.88) — the Old Town's catacombs, beyond that gate. The ghosts
   drove the physical monsters up out of the depths long ago; they live here
   now, and every one of them can be caught here (all thirteen on every
   floor, 2.90). Each floor is the size of the town's own map (26×39):
       The Garrison    evade floor · the Family's soldiers, rows of them
       The Quarry      fight floor · the terraces the Old Town was cut from
       The Wine Cellars fight floor · barrel vaults, a drain, the bottling room
       The Fight Pit   fight floor · the Consigliere in the ring (2.95: once
                       the Grey Capo); above him the
                       crypt stair, up into the church
   THE GATE (2.90): with the Purple Capo beaten the Whalelord feels something
   in the Armoury, the furthest room off the Long Stair — the ghost of the
   phoenix that came before yours, raging at the Padrino and the barrier that
   holds the dead down. It forces the gate open; the dead rise and hold the
   Family's men on the second tier (r5().rush) while you run up through it,
   up the crypt stair, and into the Old Town's church (r5().oldTown). The
   developer's profile finds the gate open, and the floors in the Explore
   list, from the start.
   THE RUN AND THE DISGUISE (2.91): the dead can hold the Padrino's psychics
   off for three minutes and no longer — that is the run, timed, up through
   all four floors; run out of time and they catch you (ten phrases) and you
   start again from the gate. Up in the church, Ugo the tailor, who lights its
   candles, takes you across the piazza to his shop and makes you a junior
   soldato. In that uniform nobody on watch looks twice at you, in the
   catacombs or in the Old Town's streets (now walked, 26×39, from the town's
   plan); the soldatos will talk to one of their own, about the Padrino's
   great work up at the villa, and you can show one your face and fight him.
   With your phoenix there, the ghost phoenix gives it the last of its power
   (the Sacred Flame, and a Fire Stone) and goes to rest once you are
   disguised; without one it waits in the Armoury until you bring one.
   ------------------------------------------------------------ */

function r5(){
  const p = state.progress;
  p.region5 = p.region5 || {
    arrived:false,          // the arrival on the pier has played
    heardTunnels:false,     // the boatwright has told you about the catacombs
    gateBeaten:false,       // the soldato at the sea cave
    intro:false,            // the Whalelord's first words in the dark
    reached:[],             // catacomb floors you have stood on
    beaten:{},              // floor -> guard ids beaten there (14-stealth.js)
    seen:{},                // floor -> tiles you have seen, '0'/'1'
    found:{},               // floor -> prizes taken
    said:{},                // one-off lines already said
    evadeTries:{},
    capoBlack:false, capoPurple:false,
    tier1:false,            // the Purple Capo beaten: part one done
    tier2Open:false,        // the Long Stair's gate is open (the ghost phoenix opens it, 2.90)
    capoGrey:false,         // the Consigliere beaten in his pit (2.95: the Grey Capo once — the name kept for old saves)
    tier2:false,            // …and with him the second tier
    phoenixMet:false,       // the ghost phoenix met, in the Armoury, and the gate forced (2.90)
    phoenixKin:false,       // …with your phoenix there to know it
    rush:false,             // the night the dead rose: the second tier's men held by ghosts (2.90)
    rushLeft:null,          // …for this long still, in ms (null: all three minutes) (2.91)
    rushTries:0,            // runs the time ran out on
    oldTown:false,          // up the crypt stair into the church: the Old Town reached (2.90)
    lastAt:null,            // { id, x, y, entry }: where you left off in the catacombs (2.90)
    disguise:false,         // Ugo the tailor's junior soldato's uniform: yours (2.91)
    disguised:false,        // …and on you right now
    phoenixGift:false,      // the ghost phoenix's last power given to your phoenix: the Sacred Flame, and a Fire Stone (2.91)
    phoenixGone:false,      // …and the ghost phoenix gone to rest
    figlioMet:false,        // Figlio, home from Region 3, met outside the opera house (2.92)
    figlioWins5:0,          // …and beaten here (his staircase starts again at 94)
    hill:false,             // walked up the hill on his arm: the Hilltop open (2.92)
    tower:{ beaten:[], reached:0 },   // the psychics' tower: floors whose disciple is beaten; the highest stood on (2.92)
    holdBroken:false,       // the Ghost Master beaten, (3.00) the Fairy Stone taken: the hold on the dead is broken (2.92)
    ninoMet:false,          // (3.02) Nino seen as a boy — the Padrino's little brother (the tower, or the catch-up on the hill)
    mkVilla:false,          // (3.04) the Monkey King has met you outside the villa, and gone in over the Sottocapo's head
    sottoBeaten:false,      // …the Sottocapo beaten at the villa's door: it is yours, and he has gone ahead to his master
    villa:false,            // …in, the first time: the calm
    madrinaMet:false, madrinaGone:false,   // …the Madrina's photograph, and her going down to her brother
    cellarSeen:false,       // …the stair down, under the villa, its word said: (3.18) down into the floors under it
    watch:{},               // (3.18) the Watch's chiefs beaten there — black, purple, consigliere: each one's lock on the gate open
    jaxBeaten:false,        // (3.18) Jax beaten at the vault's door: he has gone in ahead
  };
  const g = p.region5;
  g.reached = g.reached || []; g.said = g.said || {};
  g.tower = g.tower || { beaten:[], reached:0 };
  g.tower.beaten = g.tower.beaten || [];
  return g;
}
function r5Zone(id){ return (REGION_ZONES[5] || []).find(z=> z.id === id) || null; }

/* The floors, bottom to top: in at the sea cave and up through the hill
   (2.90 — they used to be called top to bottom). Quick travel only ever
   offers floors reached. */
const R5_FLOORS = ['cata_landing', 'cata_cistern', 'cata_bones', 'cata_stair'];
/* Tier 2 (2.88): the Old Town's, climbed from the Long Stair's gate up. */
const R5_FLOORS_T2 = ['cata_garrison', 'cata_quarry', 'cata_cellars', 'cata_pit'];
/* The gate is open when the story opens it — or always, for the developer. */
function r5Tier2Open(){ return !!r5().tier2Open || (typeof isDev === 'function' && isDev()); }
/* (3.18) The top tier: under the villa, down its cellar stair — once the
   Madrina has gone down ahead of you (its finds count from then on). */
const R5_FLOORS_T3 = ['cata_deep', 'cata_watch', 'cata_crypt'];
function r5Tier3Open(){ return !!r5().madrinaMet; }

/* ============================================================
   THE PLACES
   All positions are in tiles. The harbour is painted (assets/zones/
   harbour.png, 750×1125, 26×39 tiles); the catacomb floors are drawn from
   their own grids at runtime (paintCatacomb) until they have paintings.
   Each floor's `arrive` names where its stairs are: `top` is the stair up,
   `bottom` the stair down. Arriving puts you on that stair.
   ============================================================ */
/* Tier 2's wild monsters (2.90): the thirteen physical monsters the ghosts
   drove up out of the depths, every one of them on every floor. A floor's
   wild block says `t2:true` and which kinds it has more of (`more`: a weight
   in place of the usual 2, or 1 for a rare one); its table is filled in
   below R5_DECKS (the decks stay plain data, which the tools read). The rare
   ones come a little stronger (`plus` levels). */
const R5_T2_WILD = ['strongman','fighting_ape','weasel','yoga','boxer','kicker','spinner',
                    'judo_blue','judo_red','tricerarmor','lizardape','sumo','physical_starter'];
const R5_T2_RARE = { tricerarmor:2, lizardape:2, sumo:2, physical_starter:1 };
function r5T2Table(more){
  return R5_T2_WILD.map(sp=> Object.assign({ sp, w:(more && more[sp]) || (R5_T2_RARE[sp] ? 1 : 2) },
                                           R5_T2_RARE[sp] ? { plus:R5_T2_RARE[sp] } : {}));
}
/* (3.18) The top tier's wild ones: the hill's psychics — the ones the
   exorcists brought in to keep the dead down, living in the dark under the
   villa (3.15's seven wild psychics and the Tapir, weight 2; its eight elites,
   rarer and a little stronger; and once in a long while the Fox, or a Raven —
   part 6 §12b, "its wild psychics with the Fox and the Raven rare").
   (3.24) The Ram is one of the wild ones now, and the Ladybird one of the
   eight elites in its place. (3.26) "squid goes to villa, max level 98":
   the Squid, an elite only trainers had, is one of the rarer ones here too
   (+2 levels; met at 98 at most, as everything wild — CATCH_LEVEL_CAP).
   (3.35) The designer: "tailed cat appeared in the harbour-connected
   catacombs (the first tier) when all psychic monsters should only appear
   in the third tier - the villa-connected catacombs". The Tailed Cat has
   left the first tier's floors and rooms (the Long Stair, the Bone Halls'
   and the Stair's rooms) and lives here, one of the rarer ones (1, +2). No
   wild Psychic is met anywhere in the first two tiers now.
   (3.36) The Firefox is a wild one now and the Hermit Sloth an elite: each
   has taken the other's place in the lists. */
const R5_T3_WILD = ['leopard','puffball','polygon','quetzal','nurse','firefox','unicorn','ram','tapir',
                    'hydra','ladybird','mime','hermit_sloth','seadragon','plasma_manta','sylph','steelcrab','squid',
                    'tailed_cat','psychic_starter','flying_starter'];
const R5_T3_RARE = { hydra:2, ladybird:2, mime:2, hermit_sloth:2, seadragon:2, plasma_manta:2, sylph:2, steelcrab:2, squid:2,
                     tailed_cat:2, psychic_starter:1, flying_starter:1 };
function r5T3Table(more){
  return R5_T3_WILD.map(sp=> Object.assign({ sp, w:(more && more[sp]) || (R5_T3_RARE[sp] ? 1 : 2) },
                                           R5_T3_RARE[sp] ? { plus:R5_T3_RARE[sp] } : {}));
}
const CATA_PRIZE_LINES = [
  `Something glints between the bones.`,
  `Tucked into a burial niche, wrapped in old cloth:`,
  `The Family missed one.`,
  `Somebody hid this down here a long time ago.`,
];
const R5_DECKS = {
  harbour: {
    key:'harbour', region:5, title:'The Harbour', art:'harbour', nat:[750,1125],
    bx:0, by:0, bs:26/750, bg:'region5', music:'zone_harbour',
    rows:[
"##########################","##########################","############..############","############..############",
"############..############","############..############","############..############","###.########..######.##.##",
"..........................","..........................","#######..#######..########","#######..#######..########",
"#######..#######..########","#######..#######..########","#######..#######..########","####.##..#######..########",
"####.##..#######..##.#####","####.##..###.###..#...####","..........................","..........................",
"########..######..########","########..######..########","########..######..########","########..######..########",
"########.########.########","########.########.########","#####.##.###..###.########","####..##...#..#...###.####",
"..........................","..........................","##.........#..#.#........#","#.........##..####.####.##",
"##.......##...####.####.##","####..####################","####..####################","####..####################",
"####..####################","####..####################","####..####################",
    ],
    spawn:[4,37],
    arrive:{ cave:[1,31], pier:[4,37], gate:[12,3],
             /* (3.03) out of the town's rooms, onto their doors */
             marta:[4,15], lucia:[20,16], station:[20,7], customs:[12,26], warehouse:[21,27] },
    things:[
      { x:3,  y:7,  walk:true, verb:'Old arch', act:()=> r5OldArch() },
      { x:12, y:2,  w:2, verb:'Old Town', act:()=> r5OldTownGate(), when:()=> !r5().disguise },
      /* (2.91) in the Family's colours, the gate's soldatos let a junior up */
      { x:12, y:3,  walk:true, verb:'Up', where:'The Old Town', act:()=> r5GateUp(), when:()=> !!r5().disguise },
      { x:14, y:8,  sprite:'soldato2', icon:'💂', verb:'Talk', act:()=> r5Loiter('steps') },
      /* (3.03) Enzo is inside his station now, at the ticket window */
      { x:20, y:7,  walk:true, verb:'In', where:'The station', arrow:'up', act:()=> r5RoomDoor('room_station') },
      { x:23, y:7,  walk:true, verb:'Funicular', act:()=> r5Funicular() },
      { x:4,  y:15, walk:true, verb:'In', where:"Signora Marta's", arrow:'up', act:()=> r5RoomDoor('room_marta') },
      { x:12, y:17, sprite:'boatwright', icon:'🪚', verb:'Talk', act:()=> r5Boatwright(),
        mark:()=> !r5().heardTunnels },
      { x:21, y:17, sprite:'net_mender', icon:'🧶', verb:'Talk', act:()=> r5NetMender() },
      { x:20, y:16, walk:true, verb:'In', where:"Lucia's", arrow:'up', act:()=> r5RoomDoor('room_lucia') },
      { x:5,  y:26, sprite:'shopkeeper5', icon:'🐟', verb:'Shop', act:()=> r5Fishmonger() },
      { x:12, y:26, w:2, walk:true, verb:'In', where:'The customs house', arrow:'up', act:()=> r5RoomDoor('room_customs') },
      { x:10, y:28, sprite:'soldato1', icon:'💂', verb:'Talk', act:()=> r5Loiter('customs') },
      /* (3.03) Tino minds your things inside the warehouse now */
      { x:21, y:27, walk:true, verb:'In', where:'The warehouse', arrow:'up', act:()=> r5RoomDoor('room_warehouse') },
      /* the Family's way into the catacombs: its boats come in here at night */
      { x:1,  y:31, walk:true, verb:'In', where:'The Catacombs', arrow:'left', act:()=> r5CaveIn(),
        when:()=> r5().gateBeaten },
      { x:2,  y:31, sprite:'soldato1', icon:'💂', verb:'Talk', act:()=> r5GateSoldato(),
        when:()=> !r5().gateBeaten, mark:()=> r5().heardTunnels },
      /* (3.31) on the sand above his lighthouse, not on its roof (the square he stood on is the roof now) */
      { x:21, y:30, sprite:'lighthouse_keeper', icon:'🏮', verb:'Talk', act:()=> r5Keeper() },
      { x:5,  y:37, sprite:'ship_captain', icon:'⚓', verb:'Captain', act:()=> r5Captain() },
      { x:4,  y:38, walk:true, verb:'Board', where:'The Vane Shear', act:()=> r5Board() },
    ],
    onRender:(world, d)=> r5HarbourRender(world, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 1. THE LANDING: where the Family unloads, in from the sea cave at
     the bottom. Crates, soldatos walking the aisles, and a lookout in the
     pillared hall above, below the stair up. A door in the hall's west wall
     leads to the Counting Room. ---- */
  cata_landing: {
    key:'cata_landing', region:5, title:'The Landing', bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[21*32, 28*32], entry:'cave',
    rows:[
"#####################","##########.##########","##########.##########","###...............###",
"###.o...o...o...o.###","##*...............*##","###.o...o...o...o.###","#.................###",
"###.######.######.###","###.######.######.###","###.................#","##########.########,#",
"##########.########.#","###...............###","###.cc.cc...cc.cc.###","#,#.cc.cc...cc.cc.###",
"#.................###","#.#.cc.cc...cc.cc.###","#.#.cc.cc...cc.cc.###","###...............###",
"##########.##########","##########.##########","########.....########","#######*.....*#######",
"########.....########","#########...#########","##########.##########","#####################",
    ],
    spawn:[10,26],
    arrive:{ cave:[10,26], up:[10,1], r1:[1,7] },
    prizes:[[1,18],[19,12]],
    things:[
      { x:10, y:26, walk:true, verb:'Out', where:'The Harbour', arrow:'down', act:()=> goFloor('harbour','cave') },
      { x:10, y:1,  walk:true, verb:'Up',  where:'The Cistern', act:()=> goFloor('cata_cistern','down') },
      { x:1,  y:7,  walk:true, verb:'Through', where:'The Counting Room', arrow:'left', act:()=> goFloor('cata_landing_r1','top') },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      intro:()=> r5DarkIntro(),
      /* (3.07) and every day after, the first thing he ever said down here */
      first:`<b>"Dark, is it not? You cannot see a thing."</b><br><br><b>"I can. The dead do not need eyes."</b>`,
      guards:[
        { id:'a', kind:'soldato', path:[[3,16],[17,16]], face:'r', clock:600, pause:3, roster:'landing_a', sprite:'soldato1' },
        { id:'b', kind:'lookout', x:10, y:5, face:'d', spin:'ccw', clock:640, pause:4, roster:'landing_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[17,13],[3,13]], face:'l', clock:620, pause:3, roster:'landing_c', sprite:'soldato2' },
        { id:'d', kind:'soldato', path:[[3,10],[19,10]], face:'r', clock:580, pause:3, roster:'landing_d', sprite:'soldato1' },
      ],
      wild:{ rate:0.035, size:2, lv:[76,82],
        table:[{sp:'crow',w:3},{sp:'ghost',w:3},{sp:'cyclops',w:2},{sp:'ghost_flame',w:1}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 2. THE CISTERN: black water, plank bridges, and nothing to stop a
     lantern's light. The Black Capo holds the bridge; the rims go round him.
     The upper walk runs east to the Pump Room. ---- */
  cata_cistern: {
    key:'cata_cistern', region:5, title:'The Cistern', bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[25*32, 27*32], entry:'down',
    rows:[
"#########################","##########.##############","#########...#############","#########.,.#############",
"#########...#############","##########.##############","##########.##############","###...................###",
"###.~~o~~~~~~~~~o~~.#####","###.~~~~~~~~~~~~~~~.#####","###.===============.#####","###.~~~~~~~~~~~~~~~.#####",
"###.~~o~~~~~~~~~o~~.#####","###.~~~~~~~~~~~~~~~.,####","##,...###########...#####","#####.###########.#######",
"#.......................#","#.~~~~~~~~~~=~~~~~~~~~~.#","#.~~~~~~~~~~=~~~~~~~~~~.#","#.~~o~~~~~~~=~~~~~~~o~~.#",
"#.~~~~~~~~~~=~~~~~~~~~~.#","#.~~~~~~~~~~=~~~~~~~~~~.#","#.~~o~~~~~~~=~~~~~~~o~~.#","#.~~~~~~~~~~=~~~~~~~~~~.#",
"#.......,...............#","#.#######################","#########################",
    ],
    spawn:[1,25],
    arrive:{ down:[1,25], up:[10,1], r1:[21,7] },
    prizes:[[2,14],[20,13]],
    things:[
      { x:1,  y:25, walk:true, verb:'Down', where:'The Landing',    act:()=> goFloor('cata_landing','up') },
      { x:10, y:1,  walk:true, verb:'Up',   where:'The Bone Halls', act:()=> goFloor('cata_bones','down') },
      { x:21, y:7,  walk:true, verb:'Through', where:'The Pump Room', arrow:'right', act:()=> goFloor('cata_cistern_r1','top') },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"Their lanterns shine a long way here. There is nothing down here to stop the light."</b><br><br>` +
            `<b>"Keep to the edges, where it is darkest."</b>`,
      guards:[
        /* (3.18) once the villa's door is broken he has gone down to the Watch, under the villa */
        { id:'capo', kind:'capo', x:12, y:16, face:'d', clock:700, roster:'capo_black', sprite:'capo_black', when:()=> !r5().sottoBeaten },
        { id:'a', kind:'soldato', path:[[23,24],[23,16]], face:'u', clock:560, pause:3, roster:'cistern_a', sprite:'soldato2' },
        { id:'b', kind:'soldato', path:[[4,7],[19,7]], face:'r', clock:620, pause:3, roster:'cistern_b', sprite:'soldato1' },
        { id:'c', kind:'soldato', path:[[1,22],[1,16]], face:'u', clock:600, pause:3, roster:'cistern_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:19, y:11, face:'u', spin:'ccw', clock:660, pause:4, roster:'cistern_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.04, size:3, lv:[78,84],
        table:[{sp:'crow',w:2},{sp:'ghost',w:3},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1},{sp:'goblin',w:1,plus:1}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 3. THE BONE HALLS: narrow, and full of them. Far too many to fight:
     caught is caught, and ten phrases buy another go. Every one of them can
     be got past (tools/floor-bench.js proves it, from every way in to every
     way out). A burial niche off the bottom hall opens on the Charnel House. ---- */
  cata_bones: {
    key:'cata_bones', region:5, title:'The Bone Halls', bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[23*32, 24*32], entry:'down',
    rows:[
"#######################","#################.#####","#################.#####","#################.#####",
"###,................###","###.................###","###...o..o...o..o...###","###................,###",
"#####.#####.###########","#####.#####.###########","#####...............###","###########.##.,....###",
"###########.##......###","###########.##......###","###########.##......###","##############,.....###",
"###################.###","###################.###","#.....................#","###.##.###.,.###.##.###",
"###.##.###...###.##.###","###.#######.###########","###########.###########","#######################",
    ],
    spawn:[11,22],
    arrive:{ down:[11,22], up:[17,1], r1:[3,21] },
    arriveSay:{ down:'the stair at the bottom of The Bone Halls', up:'the stair at the top of The Bone Halls',
                r1:'the way through from The Charnel House' },
    prizes:[[14,15]],
    things:[
      { x:11, y:22, walk:true, verb:'Down', where:'The Cistern',    act:()=> goFloor('cata_cistern','up') },
      { x:17, y:1,  walk:true, verb:'Up',   where:'The Long Stair', act:()=> goFloor('cata_stair','down') },
      { x:3,  y:21, walk:true, verb:'Through', where:'The Charnel House', arrow:'down', act:()=> goFloor('cata_bones_r1','top') },
    ],
    stealth:{ kind:'evade', feel:4, retryPhrases:10,
      first:`<b>"Wait. Stop here a moment."</b><br><br>` +
            `<b>"I can feel them all through this floor. So many of them. Far too many to fight."</b>`,
      warn:`<b>"If they catch you here, they will not come one at a time. Every one of them on this floor will come running, and there will be nowhere left to go."</b><br><br>` +
           `<b>"Watch their lanterns, wait for your moment, and do not let them see you at all."</b>`,
      again:`<b>"Careful. I can feel far too many of them on this floor. If one of them sees you, they will all come."</b>`,
      guards:[
        { id:'a',  kind:'soldato', path:[[1,18],[21,18]],   face:'r', clock:600, pause:3, sprite:'soldato1' },
        { id:'l1', kind:'lookout', x:16, y:13, face:'r', spin:'ccw',  clock:640, pause:5, sprite:'soldato2' },
        { id:'b',  kind:'soldato', path:[[11,14],[11,8]], face:'u', clock:620, pause:3, sprite:'soldato2' },
        { id:'t1', kind:'talker',  x:8,  y:4, face:'r', sprite:'soldato1' },
        { id:'t2', kind:'talker',  x:12, y:4, face:'l', sprite:'soldato2' },
        { id:'l2', kind:'lookout', x:18, y:6, face:'l', spin:'cw', clock:580, pause:5, sprite:'soldato1' },
      ] },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 4. THE LONG STAIR: a great gallery climbing the hill, soldatos
     crossing it, a lookout near the top, and the Purple Capo before a barred
     gate at the very top. A passage off the foot of the gallery leads to the
     Barracks. ---- */
  cata_stair: {
    key:'cata_stair', region:5, title:'The Long Stair', bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[17*32, 31*32], entry:'down',
    rows:[
"#################","#################","########G########","######.....######",
"######.....######","######.....######","###...........###","###...........###",
"###..o.....o..###","###...........###","#,............*##","###...........###",
"###..o.....o..###","###...........###","##*...........###","###............,#",
"###..o.....o..###","###...........###","###...........###","#,............###",
"###..o.....o..###","###.............#","###...........###","########.########",
"#####.......#####","#####.......#####","####*.......*####","#####.......#####",
"########.########","########.########","#################",
    ],
    spawn:[8,29],
    arrive:{ down:[8,29], r1:[15,21], gate:[8,3] },
    prizes:[[1,19],[15,15]],
    things:[
      { x:8,  y:29, walk:true, verb:'Down', where:'The Bone Halls', act:()=> goFloor('cata_bones','up') },
      { x:15, y:21, walk:true, verb:'Through', where:'The Barracks', arrow:'right', act:()=> goFloor('cata_stair_r1','top') },
      { x:8,  y:2,  verb:'The gate', act:()=> r5SealedGate(), when:()=> !r5Tier2Open() },
      /* tier 2 (2.88): once the gate is open, through it to the Garrison */
      { x:8,  y:3,  walk:true, verb:'Through', where:'The Garrison', arrow:'up', act:()=> goFloor('cata_garrison','gate'),
        when:()=> r5Tier2Open() },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"Someone is waiting at the top of these stairs."</b><br><br><b>"Someone who knows you."</b>`,
      guards:[
        { id:'a', kind:'soldato', path:[[3,18],[13,18]], face:'r', clock:580, pause:3, roster:'stair_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[13,10],[3,10]], face:'l', clock:620, pause:3, roster:'stair_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[3,13],[13,13]], face:'r', clock:600, pause:3, roster:'stair_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:8, y:7, face:'l', spin:'cw', clock:640, pause:4, roster:'stair_l', sprite:'soldato2' },
        /* (2.88: a step down from the gate, so nobody's lamp is on it as you come back through) */
        { id:'capo', kind:'capo', x:8, y:5, face:'d', clock:700, roster:'capo_purple', sprite:'capo_purple' },
      ],
      wild:{ rate:0.04, size:3, lv:[80,86],
        table:[{sp:'ghost',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'crow',w:1},
               {sp:'goblin_knight',w:1,plus:2},{sp:'horned_lynx',w:1,plus:2},{sp:'puppet',w:1,plus:1},{sp:'goblin',w:1,plus:1},{sp:'firehound',w:1,plus:2}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ============================================================
     THE SIDE ROOMS (2.72): two off every floor, one through the other —
     floor → room 1 → room 2. Each has three soldatos and a lookout, and
     its own ghosts in the dark, a little stronger the further in it is.
     A room's `top` is the door you come in by; `bottom` the door on.
     ============================================================ */

  /* ---- The Counting Room: the Family counts its crates here, and counts them again. A fight room off The Landing. ---- */
  cata_landing_r1: {
    key:'cata_landing_r1', region:5, title:"The Counting Room", room:true, bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[19*32, 13*32],
    rows:[
"###################","#*.c...........c.*#","#..c..cc...cc..c..#","#.................#",
"#.cc..cc...cc..cc.#","#.................#","...................","#.................#",
"#.cc..cc...cc..cc.#","#.................#","#..c..cc...cc..c..#","#*.c...........c.*#",
"###################",
    ],
    spawn:[18,6],
    arrive:{ top:[18,6], bottom:[0,6] },
    things:[
      { x:18, y:6, walk:true, verb:'Through', where:"The Landing", arrow:'right', act:()=> goFloor('cata_landing','r1') },
      { x:0, y:6, walk:true, verb:'Through', where:"The Old Ossuary", arrow:'left', act:()=> goFloor('cata_landing_r2','top') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[1,9],[17,9]], face:'r', clock:600, pause:3, roster:'lr1_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[17,3],[1,3]], face:'l', clock:640, pause:3, roster:'lr1_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[9,8],[9,4]], face:'u', clock:560, pause:4, roster:'lr1_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:4, y:6, face:'d', spin:'ccw', clock:620, pause:4, roster:'lr1_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.035, size:2, lv:[80,86],
        table:[{sp:'crow',w:3},{sp:'ghost',w:3},{sp:'cyclops',w:2},{sp:'ghost_flame',w:1}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- The Old Ossuary: the oldest dead in the hill, stacked to the roof. A fight room off The Counting Room. ---- */
  cata_landing_r2: {
    key:'cata_landing_r2', region:5, title:"The Old Ossuary", room:true, bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[17*32, 13*32],
    rows:[
"#################","#,..o...,...o..,#","#...............#","#.o...........o.#",
"#....###.###....#","#....#.....#.....","#...............#","#....#..*..#....#",
"#....#.....#....#","#.o..###.###..o.#","#...............#","#,..o...,...o..,#",
"#################",
    ],
    spawn:[16,5],
    arrive:{ top:[16,5] },
    things:[
      { x:16, y:5, walk:true, verb:'Through', where:"The Counting Room", arrow:'right', act:()=> goFloor('cata_landing_r1','bottom') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[1,10],[15,10]], face:'r', clock:620, pause:3, roster:'lr2_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[15,2],[1,2]], face:'l', clock:580, pause:3, roster:'lr2_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[3,9],[3,3]], face:'u', clock:660, pause:3, roster:'lr2_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:8, y:5, face:'u', spin:'cw', clock:600, pause:4, roster:'lr2_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.035, size:2, lv:[82,88],
        table:[{sp:'crow',w:3},{sp:'ghost',w:3},{sp:'cyclops',w:2},{sp:'ghost_flame',w:1}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- The Pump Room: the old pumps that kept the cistern from filling. A fight room off The Cistern. ---- */
  cata_cistern_r1: {
    key:'cata_cistern_r1', region:5, title:"The Pump Room", room:true, bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[19*32, 13*32],
    rows:[
"###################","#.......~~~.......#","#.cc....~~~....cc.#","#.cc....===....cc.#",
"#.......~~~.......#","#...o...~~~...o...#","........===........","#...o...~~~...o...#",
"#.......~~~.......#","#.cc....===....cc.#","#.cc....~~~....cc.#","#.......~~~.......#",
"###################",
    ],
    spawn:[0,6],
    arrive:{ top:[0,6], bottom:[18,6] },
    things:[
      { x:0, y:6, walk:true, verb:'Through', where:"The Cistern", arrow:'left', act:()=> goFloor('cata_cistern','r1') },
      { x:18, y:6, walk:true, verb:'Through', where:"The Drowned Chapel", arrow:'right', act:()=> goFloor('cata_cistern_r2','top') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[5,11],[5,1]], face:'u', clock:600, pause:3, roster:'cr1_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[13,1],[13,11]], face:'d', clock:640, pause:3, roster:'cr1_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[7,6],[11,6]], face:'r', clock:560, pause:4, roster:'cr1_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:9, y:9, face:'u', spin:'ccw', clock:620, pause:4, roster:'cr1_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.035, size:2, lv:[82,88],
        table:[{sp:'crow',w:2},{sp:'ghost',w:3},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1},{sp:'goblin',w:1,plus:1}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- The Drowned Chapel: a chapel the water took, pews and all. A fight room off The Pump Room. ---- */
  cata_cistern_r2: {
    key:'cata_cistern_r2', region:5, title:"The Drowned Chapel", room:true, bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[17*32, 13*32],
    rows:[
"#################","#~~~~~~~~~~~~~~~#","#~~...........~~#","#~.o...o.o...o.~#",
"#~.............~#","#~.cc.cc.cc.cc.~#","...............~#","#~.............~#",
"#~.cc.cc.cc.cc.~#","#~.............~#","#~~.....*.....~~#","#~~~~~~...~~~~~~#",
"#################",
    ],
    spawn:[0,6],
    arrive:{ top:[0,6] },
    things:[
      { x:0, y:6, walk:true, verb:'Through', where:"The Pump Room", arrow:'left', act:()=> goFloor('cata_cistern_r1','bottom') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[2,9],[14,9]], face:'r', clock:620, pause:3, roster:'cr2_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[14,4],[2,4]], face:'l', clock:580, pause:3, roster:'cr2_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[3,2],[13,2]], face:'r', clock:660, pause:3, roster:'cr2_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:10, y:6, face:'l', spin:'cw', clock:600, pause:4, roster:'cr2_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.035, size:2, lv:[84,90],
        table:[{sp:'crow',w:2},{sp:'ghost',w:3},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1},{sp:'goblin',w:1,plus:1}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- The Charnel House: where the bones were brought to be sorted. A fight room off The Bone Halls. ---- */
  cata_bones_r1: {
    key:'cata_bones_r1', region:5, title:"The Charnel House", room:true, bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[17*32, 13*32],
    rows:[
"########.########","#,.....#.#.....,#","#......#.#......#","#..o.........o..#",
"#,.............,#","#...............#","###..o.....o..###","#,.............,#",
"#...............#","#..o...#.#...o..#","#......#.#......#","#,.....#.#.....,#",
"########.########",
    ],
    spawn:[8,0],
    arrive:{ top:[8,0], bottom:[8,12] },
    things:[
      { x:8, y:0, walk:true, verb:'Through', where:"The Bone Halls", arrow:'up', act:()=> goFloor('cata_bones','r1') },
      { x:8, y:12, walk:true, verb:'Through', where:"The Skull Wall", arrow:'down', act:()=> goFloor('cata_bones_r2','top') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[1,8],[15,8]], face:'r', clock:600, pause:3, roster:'br1_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[15,5],[1,5]], face:'l', clock:640, pause:3, roster:'br1_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[4,3],[12,3]], face:'r', clock:560, pause:3, roster:'br1_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:8, y:7, face:'d', spin:'ccw', clock:620, pause:4, roster:'br1_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.035, size:2, lv:[84,90],
        table:[{sp:'ghost',w:3},{sp:'crow',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1},{sp:'goblin_knight',w:1,plus:2},{sp:'goblin',w:1,plus:1},{sp:'firehound',w:1,plus:2}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- The Skull Wall: a wall of skulls, every one of them watching. A fight room off The Charnel House. ---- */
  cata_bones_r2: {
    key:'cata_bones_r2', region:5, title:"The Skull Wall", room:true, bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[17*32, 12*32],
    rows:[
"########.########","#...............#","#.o...o...o...o.#","#...............#",
"#..###.....###..#","#..#,,.....,,#..#","#..###.....###..#","#...............#",
"#.o...o...o...o.#","#...............#","#,.,.,.,*,.,.,.,#","#################",
    ],
    spawn:[8,0],
    arrive:{ top:[8,0] },
    things:[
      { x:8, y:0, walk:true, verb:'Through', where:"The Charnel House", arrow:'up', act:()=> goFloor('cata_bones_r1','bottom') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[1,9],[15,9]], face:'r', clock:620, pause:3, roster:'br2_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[15,1],[1,1]], face:'l', clock:580, pause:3, roster:'br2_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[8,7],[8,4]], face:'u', clock:660, pause:3, roster:'br2_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:15, y:5, face:'l', spin:'cw', clock:600, pause:4, roster:'br2_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.035, size:2, lv:[86,92],
        table:[{sp:'ghost',w:3},{sp:'crow',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1},{sp:'goblin_knight',w:1,plus:2},{sp:'goblin',w:1,plus:1},{sp:'firehound',w:1,plus:2}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- The Barracks: where the Family's men sleep between their shifts. A fight room off The Long Stair. ---- */
  cata_stair_r1: {
    key:'cata_stair_r1', region:5, title:"The Barracks", room:true, bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[19*32, 13*32],
    rows:[
"###################","#.cc.cc.cc.cc.cc..#","#.................#","#.................#",
"#.cc.cc.cc.cc.cc..#","#.................#",".....ccccccc.......","#.................#",
"#.cc.cc.cc.cc.cc..#","#.................#","#.................#","#.cc.cc.cc.cc.cc..#",
"###################",
    ],
    spawn:[0,6],
    arrive:{ top:[0,6], bottom:[18,6] },
    things:[
      { x:0, y:6, walk:true, verb:'Through', where:"The Long Stair", arrow:'left', act:()=> goFloor('cata_stair','r1') },
      { x:18, y:6, walk:true, verb:'Through', where:"The Armoury", arrow:'right', act:()=> goFloor('cata_stair_r2','top') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[1,9],[17,9]], face:'r', clock:600, pause:3, roster:'sr1_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[17,3],[1,3]], face:'l', clock:640, pause:3, roster:'sr1_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[13,8],[13,4]], face:'u', clock:560, pause:3, roster:'sr1_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:3, y:2, face:'r', spin:'ccw', clock:620, pause:4, roster:'sr1_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.035, size:2, lv:[86,92],
        table:[{sp:'ghost',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'crow',w:1},{sp:'goblin_knight',w:1,plus:2},{sp:'horned_lynx',w:1,plus:2},{sp:'puppet',w:1,plus:1},{sp:'goblin',w:1,plus:1},{sp:'firehound',w:1,plus:2}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- The Armoury: racks of the Family's weapons, and the men who guard them. A fight room off The Barracks. ---- */
  cata_stair_r2: {
    key:'cata_stair_r2', region:5, title:"The Armoury", room:true, bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[17*32, 13*32],
    rows:[
"#################","#*.............*#","#.ccc.ccc.ccc...#","#...............#",
"#.ccc.ccc.ccc...#","#...............#","................#","#...............#",
"#.ccc.ccc.ccc...#","#...............#","#.ccc.ccc.ccc...#","#*.............*#",
"#################",
    ],
    spawn:[0,6],
    arrive:{ top:[0,6] },
    things:[
      { x:0, y:6, walk:true, verb:'Through', where:"The Barracks", arrow:'left', act:()=> goFloor('cata_stair_r1','bottom') },
      /* (2.92) the ghost phoenix's orb, 2×2 in the middle of the room: the
         night it is met, and each time you come in while it waits here */
      { x:5, y:5, w:2, h:2, verb:'Touch', act:()=> r5TouchOrb(), when:()=> r5OrbHere(),
        mark:()=> !r5().phoenixMet || (!r5().phoenixGift && !!r5MyPhoenix()) },
      /* (2.91) the ghost phoenix, waiting here for a phoenix to give the
         last of its power to — risen out of its orb (r5PaintGPWaiting) */
      { x:5, y:5, w:2, h:2, verb:'Ghost phoenix', act:()=> r5ArmouryPhoenix(), when:()=> r5GPWaiting() && !!ui.gpOut,
        mark:()=> !r5().phoenixGift && !!r5MyPhoenix() },          // a phoenix to bring it: "!"
    ],
    stealth:{ kind:'fight', feel:4,
      /* nobody stands watch in here while the ghost phoenix waits in it (2.91),
         or once its orb has shown itself (2.92) */
      guards:[
        { id:'a', kind:'soldato', path:[[1,9],[15,9]], face:'r', clock:620, pause:3, roster:'sr2_a', sprite:'soldato1', when:()=> !r5GPHaunts() },
        { id:'b', kind:'soldato', path:[[15,3],[1,3]], face:'l', clock:580, pause:3, roster:'sr2_b', sprite:'soldato2', when:()=> !r5GPHaunts() },
        { id:'c', kind:'soldato', path:[[14,8],[14,4]], face:'u', clock:660, pause:3, roster:'sr2_c', sprite:'soldato1', when:()=> !r5GPHaunts() },
        { id:'l', kind:'lookout', x:6, y:6, face:'l', spin:'cw', clock:600, pause:4, roster:'sr2_l', sprite:'soldato2', when:()=> !r5GPHaunts() },
      ],
      wild:{ rate:0.035, size:2, lv:[88,94],
        table:[{sp:'ghost',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'crow',w:1},{sp:'goblin_knight',w:1,plus:2},{sp:'horned_lynx',w:1,plus:2},{sp:'puppet',w:1,plus:1},{sp:'goblin',w:1,plus:1},{sp:'firehound',w:1,plus:2}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    /* (2.92) while the ghost phoenix (or its orb) is here, you and the
       Whalelord keep turning to face it as you walk */
    onStep:(p, d)=>{ const stop = stealthStep(p, d); r5FaceGPHere(); return stop; },
    ghostChat:(id)=> r5GhostChat(id),
  },
  /* ============================================================
     TIER 2 (2.88) — THE OLD TOWN'S CATACOMBS
     Past the Long Stair's gate the tunnels climb into the hill, under the
     Old Town. The physical monsters live here: the ghosts drove them up out
     of the deep places long ago. Each floor is the size of the town's map,
     26×39, and is climbed bottom to top — up the page is up the hill, as on
     the town's own maps. A floor's `entry` is the way in from the floor
     before; `art` is the painting it will wear when it has one
     (assets/zones/<art>.png, drawn over the tier's references at 32 px a
     tile — until then it is drawn from its grid).
     ============================================================ */

  /* ---- 1. THE GARRISON: the rows and rows of soldiers the Whalelord felt
     through the gate. A gatehouse, two dormitories either side of the muster
     walk, a mess hall, and the landing below the stair up. Far too many to
     fight. ---- */
  cata_garrison: {
    key:'cata_garrison', region:5, title:'The Garrison', bg:'catacombs', music:'zone_catacombs', tier:2,
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32], art:'catacombs2_garrison', entry:'gate',
    rows:[
"##########################","############..############","############..############","####*................*####",
"####..................####","####..................####","######.#####..#####.######","######.#####..#####.######",
"##bb..................bb##","##......................##","##..tttttt......tttttt..##","##......................##",
"##......................##","##..tttttt......tttttt..##","##......................##","##......................##",
"####.#######..#######.####","##........#....#........##","##kk......#....#......kk##","##.............#........##",
"##kk......#....#......kk##","##........#....#........##","##kk......#....#......kk##","##........#....#........##",
"##kk......#....#......kk##","##........#.............##","##kk......#....#......kk##","##........#....#........##",
"#####.######..######.#####","##......................##","##......................##","##.cc................cc.##",
"##.cc...b........b...cc.##","##......................##","############..############","############..############",
"############..############","############..############","############GG############",
    ],
    spawn:[12,37],
    arrive:{ gate:[12,37], up:[12,1] },
    arriveSay:{ gate:'the gate, at the bottom of The Garrison', up:'the stair at the top of The Garrison' },
    prizes:[[23,33]],
    things:[
      { x:12, y:37, walk:true, verb:'Through', where:'The Long Stair', arrow:'down', act:()=> goFloor('cata_stair','gate') },
      { x:12, y:1,  walk:true, verb:'Up', where:'The Quarry', act:()=> goFloor('cata_quarry','down') },
    ],
    stealth:{ kind:'evade', feel:4, retryPhrases:10,
      first:`<b>"There they are. Rows and rows of them, just as I said."</b><br><br>` +
            `<b>"This is where the Family keeps its soldiers. They sleep here, eat here, and wait here."</b>`,
      warn:`<b>"Far too many to fight. If one of them sees you, they will all come."</b><br><br>` +
           `<b>"The stair up is at the far end. Keep to the dark, watch the lanterns, and do not let a single one of them find you."</b>`,
      again:`<b>"Careful. This is their barracks. If one of them sees us, they will all come."</b>`,
      guards:[
        { id:'a',  kind:'soldato', path:[[5,4],[20,4]],   face:'r', clock:600, pause:3, sprite:'soldato1' },
        { id:'t1', kind:'talker',  x:6,  y:9,  face:'d', sprite:'soldato2' },
        { id:'t2', kind:'talker',  x:6,  y:11, face:'u', sprite:'soldato1' },
        { id:'l1', kind:'lookout', x:18, y:12, face:'l', spin:'cw',  clock:640, pause:5, sprite:'soldato2' },
        { id:'e',  kind:'soldato', path:[[22,15],[3,15]], face:'l', clock:640, pause:3, sprite:'soldato1' },
        { id:'b',  kind:'soldato', path:[[12,17],[12,27]], face:'d', clock:620, pause:3, sprite:'soldato2' },
        { id:'d',  kind:'soldato', path:[[8,17],[8,27]],  face:'d', clock:580, pause:3, sprite:'soldato1' },
        { id:'t3', kind:'talker',  x:4,  y:21, face:'r', sprite:'soldato2' },
        { id:'t4', kind:'talker',  x:6,  y:21, face:'l', sprite:'soldato1' },
        { id:'l2', kind:'lookout', x:19, y:22, face:'u', spin:'ccw', clock:600, pause:4, sprite:'soldato2' },
        { id:'c',  kind:'soldato', path:[[3,29],[22,29]], face:'r', clock:620, pause:3, sprite:'soldato2' },
        { id:'l3', kind:'lookout', x:12, y:31, face:'l', spin:'cw',  clock:660, pause:4, sprite:'soldato1' },
      ],
      /* (2.90) the physical monsters live on every floor of this tier — even
         here, in the dark between the soldiers' rows: an evade floor with a
         wild table has things in the dark, as a fight floor does */
      wild:{ rate:0.03, size:3, lv:[88,96], t2:true } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 2. THE QUARRY: where the Old Town's stone was cut — four terraces
     zigzagging up the face, a man walking each, niches in the rock to stand
     in while he passes, and the old gallery at the top. More of the strong
     ones here: strongmen, apes, a Tricerarmor. ---- */
  cata_quarry: {
    key:'cata_quarry', region:5, title:'The Quarry', bg:'catacombs', music:'zone_catacombs', tier:2,
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32], art:'catacombs2_quarry', entry:'down',
    rows:[
"##########################","############..############","############..############","###*..................*###",
"###..................,.###","###...o............o...###","###.......rr...........###","###...........rr.......###",
"###...o............o...###","###.,..................###","###..#####################","##....r...........r.....##",
"##......................##","##...........r..........##","############.########..###","#########.######.####..###",
"##........r.............##","##......................##","##..............r.......##","###..#.###########.#######",
"###..##.######.###########","##.........r............##","##......................##","##...r.............r....##",
"############.########..###","#########.######.####..###","##............r.........##","##......................##",
"##......r...........r...##","###..#####################","##,..................,..##","##......................##",
"##...rr...rr...rr.......##","##...rr...rr...rr.......##","##.................~~~~~##","##cc...............~~~~~##",
"##ccc.............,~~~~~##","############..############","##########################",
    ],
    spawn:[13,37],
    arrive:{ down:[13,37], up:[12,1] },
    prizes:[[23,11],[2,23]],
    things:[
      { x:13, y:37, walk:true, verb:'Down', where:'The Garrison', act:()=> goFloor('cata_garrison','up') },
      { x:12, y:1,  walk:true, verb:'Up', where:'The Wine Cellars', act:()=> goFloor('cata_cellars','down') },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"They cut the Old Town out of this hill, stone by stone. This is where it came from."</b><br><br>` +
            `<b>"And something lives here now. Not ghosts. Strong things, and cross. The dead drove them up out of the deep places, long ago."</b>`,
      guards:[
        { id:'a', kind:'soldato', path:[[3,27],[22,27]], face:'r', clock:600, pause:3, roster:'quarry_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[22,22],[3,22]], face:'l', clock:620, pause:3, roster:'quarry_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[3,17],[22,17]], face:'r', clock:580, pause:3, roster:'quarry_c', sprite:'soldato1' },
        { id:'d', kind:'soldato', path:[[22,12],[3,12]], face:'l', clock:640, pause:3, roster:'quarry_d', sprite:'soldato2' },
        { id:'l', kind:'lookout', x:12, y:6,  face:'d', spin:'cw',  clock:660, pause:4, roster:'quarry_l', sprite:'soldato1' },
        { id:'m', kind:'lookout', x:8,  y:31, face:'r', spin:'ccw', clock:620, pause:4, roster:'quarry_m', sprite:'soldato2' },
      ],
      /* more of the strong ones here: strongmen, apes, a Tricerarmor, a Lizardape */
      wild:{ rate:0.03, size:3, lv:[90,98], t2:true, more:{ strongman:4, fighting_ape:4, tricerarmor:2, lizardape:2 } } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 3. THE WINE CELLARS: right under the Old Town — barrel vaults, the
     drain that carries the hill's water away, and the Family's bottling
     room. More of the quick ones here: weasels and yogis. ---- */
  cata_cellars: {
    key:'cata_cellars', region:5, title:'The Wine Cellars', bg:'catacombs', music:'zone_catacombs', tier:2,
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32], art:'catacombs2_cellars', entry:'down',
    rows:[
"##########################","############..############","############..############","#########*......*#########",
"#########........#########","#########........#########","############..############","##.....................,##",
"##..b..b..b....b..b..b..##","##..b..b..b....b..b..b..##","##..b..b..b....b..b..b..##","##......................##",
"##..b..b..b....b..b..b..##","##..b..b..b....b..b..b..##","##..b..b..b....b..b..b..##","##,.....................##",
"###.########..########.###","##......................##","##~~~=~~~~~~==~~~~~~=~~~##","##~~~=~~~~~~==~~~~~~=~~~##",
"##......................##","###.########..########.###","##......................##","##.bbbbbbb......bbbbbbb.##",
"##........o....o........##","##......................##","##.bbbbbbb......bbbbbbb.##","##......................##",
"##........o....o........##","##.bbbbbbb......bbbbbbb.##","##......................##","######.############.######",
"##cc...................b##","##cc.tttt........tttt...##","##......................##","##...tttt........tttt.cc##",
"##b...................cc##","############.#############","##########################",
    ],
    spawn:[12,37],
    arrive:{ down:[12,37], up:[13,1] },
    prizes:[[2,15],[23,30]],
    things:[
      { x:12, y:37, walk:true, verb:'Down', where:'The Quarry', act:()=> goFloor('cata_quarry','up') },
      { x:13, y:1,  walk:true, verb:'Up', where:'The Fight Pit', act:()=> goFloor('cata_pit','down') },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"Barrels. Barrels and barrels of them. Can you smell it? Wine."</b><br><br>` +
            `<b>"We must be right under the Old Town now. The Family keeps its stores here, where nobody up there can see."</b>`,
      guards:[
        { id:'a', kind:'soldato', path:[[3,11],[22,11]], face:'r', clock:600, pause:3, roster:'cellars_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[22,17],[3,17]], face:'l', clock:620, pause:3, roster:'cellars_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[12,22],[12,30]], face:'d', clock:580, pause:3, roster:'cellars_c', sprite:'soldato1' },
        { id:'d', kind:'soldato', path:[[3,34],[22,34]], face:'r', clock:640, pause:3, roster:'cellars_d', sprite:'soldato2' },
        { id:'l', kind:'lookout', x:12, y:9, face:'d', spin:'cw', clock:660, pause:4, roster:'cellars_l', sprite:'soldato2' },
      ],
      /* more of the quick ones here: weasels and yogis */
      wild:{ rate:0.035, size:3, lv:[92,100], t2:true, more:{ weasel:4, yoga:4 } } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 4. THE FIGHT PIT: the Family's betting ring, under the church. A
     ring of sand behind a rail, benches round it, the Consigliere in the
     middle (2.95; he was the Grey Capo). Above him the crypt stair climbs
     to a door barred from the church's side. More of the fighters here:
     boxers, kickers, judoka, a Sumo — and, once in a long while, a Jackal. ---- */
  cata_pit: {
    key:'cata_pit', region:5, title:'The Fight Pit', bg:'catacombs', music:'zone_catacombs', tier:2,
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32], art:'catacombs2_pit', entry:'down',
    rows:[
"##########################","############..############","############..############","############..############",
"#########*......*#########","#########........#########","#########........#########","############..############",
"###c..................c###","###.tttttt......tttttt.###","###....................###","###....................###",
"###..*..............*..###","###.....xxxxssxxxx.....###","###....xxssssssssxx....###","###....xssssssssssx....###",
"###....xssssssssssx....###","###....xssssssssssx....###","###....xssssssssssx....###","###....xssssssssssx....###",
"###....xssssssssssx....###","###....xssssssssssx....###","###....xssssssssssx....###","###....xssssssssssx....###",
"###....xxssssssssxx....###","###.....xxxxssxxxx.....###","###..*..............*..###","###....................###",
"###....................###","###.tttttt......tttttt.###","###b..................b###","############..############",
"############..############","#######cc.........,#######","#######cc..........#######","#######..........cc#######",
"#######,.........cc#######","############.#############","##########################",
    ],
    spawn:[12,37],
    arrive:{ down:[12,37], up:[12,1] },
    arriveSay:{ down:'the stair at the bottom of The Fight Pit', up:'the crypt stair, at the top of The Fight Pit' },
    prizes:[[3,19],[22,19]],
    things:[
      { x:12, y:37, walk:true, verb:'Down', where:'The Wine Cellars', act:()=> goFloor('cata_cellars','up') },
      /* (2.90) up the crypt stair into the Old Town's church — barred until the night the dead rose */
      { x:12, y:1,  walk:true, verb:'Up', where:'The Church', act:()=> r5CryptStair() },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"Listen. Cheering, and money changing hands."</b><br><br>` +
            `<b>"The Family makes monsters fight down here, for bets. And someone is standing in the middle of the ring. He wants an audience."</b>`,
      guards:[
        { id:'capo', kind:'capo', x:12, y:19, face:'d', clock:700, roster:'consigliere', sprite:'consigliere' },
        { id:'a', kind:'soldato', path:[[4,10],[4,28]], face:'d', clock:600, pause:3, roster:'pit_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[21,28],[21,10]], face:'u', clock:620, pause:3, roster:'pit_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[20,27],[5,27]], face:'l', clock:640, pause:3, roster:'pit_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:12, y:10, face:'d', spin:'ccw', clock:660, pause:4, roster:'pit_l', sprite:'soldato2' },
      ],
      /* more of the fighters here: boxers, kickers, spinners, judoka, a Sumo */
      wild:{ rate:0.035, size:3, lv:[94,100], t2:true, more:{ boxer:4, kicker:4, spinner:4, judo_blue:3, judo_red:3, sumo:2 } } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ============================================================
     UNDER THE VILLA (3.18) — THE TOP TIER
     Down the villa's cellar stair: three floors, each the town's size
     (26×39), up the page as up the hill — so you come in at the top of each
     and go down the page. No ghost comes down here (`under`: Nino keeps the
     dead away from his brother's house, so nobody on watch is busy with
     them — 14-stealth.js) and the Padrino's own men know every face (no
     disguise works). Nino leads: R5_LEAD. His chalk drawings are on the
     walls (`h`, 13-walkmap.js), each with a Drawing to look at.
     ============================================================ */

  /* ---- 1. THE DEEP CELLARS: the villa's own cellars, older and deeper than
     the house — the long wine vault, the hall of pillars, the old ice house
     (its pit full of black water now), the store room; the Padrino's men on
     watch. ---- */
  cata_deep: {
    key:'cata_deep', region:5, title:'The Deep Cellars', bg:'catacombs', music:'zone_catacombs', tier:3, under:true,
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32], art:'catacombs3_deep', entry:'top',
    rows:[
"##########################","############..############","############..############","#########*......*#########",
"########h........#########","#########........#########","###########....###########","###########....###########",
"##*....................*##","##......................##","##..wwwwww......wwwwww..##","##......................##",
"##..wwwwww......wwwwww..##","#h......................##","##..wwwwww......wwwwww..##","##......................##",
"##..wwwwww......wwwwww..##","##......................##","###########....###########","###########....###########",
"###....................###","###...o............o...###","###....................###","###...o............o...###",
"###....................###","###########....###########","##,......##....##cc...cc##","##.......##....##......c##",
"##..~~~..##....##.......##","##..~~~..............bb.##","#h..~~~..##....##.......##","##.......##....##....bbb##",
"##......,##....##cc.....##","###########....###########","#########*......*#########","#########........#########",
"#########........#########","############..############","##########################",
    ],
    spawn:[12,1],
    arrive:{ top:[12,1], bottom:[12,37] },
    arriveSay:{ top:'the stair down from the villa, at the top of The Deep Cellars', bottom:'the stair at the bottom of The Deep Cellars' },
    prizes:[[22,27],[7,32]],
    things:[
      { x:12, y:1,  walk:true, verb:'Up', where:'The villa', act:()=> goFloor('villa','cellar') },
      { x:12, y:37, walk:true, verb:'Down', where:'The Watch', act:()=> goFloor('cata_watch','top') },
      { x:8,  y:4,  verb:'Drawing', act:()=> r5Chalk(1) },
      { x:1,  y:13, verb:'Drawing', act:()=> r5Chalk(2) },
      { x:1,  y:30, verb:'Drawing', act:()=> r5Chalk(3) },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"No ghosts down here. Not one. He is keeping every one of them away."</b><br><br>` +
            `<b>"So the Padrino's men will see us — and they know your face. Keep to the dark."</b>`,
      guards:[
        { id:'a', kind:'soldato', path:[[3,9],[22,9]],   face:'r', clock:600, pause:3, roster:'deep_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[22,17],[3,17]], face:'l', clock:620, pause:3, roster:'deep_b', sprite:'soldato2' },
        { id:'l', kind:'lookout', x:12, y:22, face:'d', spin:'cw', clock:660, pause:4, roster:'deep_l', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[17,28],[22,28]], face:'r', clock:640, pause:3, roster:'deep_c', sprite:'soldato1' },
        { id:'d', kind:'soldato', path:[[10,35],[15,35]], face:'r', clock:600, pause:3, roster:'deep_d', sprite:'soldato2' },
      ],
      /* more of the quick ones here: Leopards, Puffballs */
      wild:{ rate:0.03, size:3, lv:[92,98], t3:true, more:{ leopard:3, puffball:3 } } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 2. THE WATCH: the Family's old guard hall — the Black Capo's wing to
     the west, the Purple Capo's to the east, the gallery of pillars between
     them, the Consigliere's long hall below, and the iron gate with three
     locks. Each of them, beaten, unlocks his lock and goes down ahead to his
     master. ---- */
  cata_watch: {
    key:'cata_watch', region:5, title:'The Watch', bg:'catacombs', music:'zone_catacombs', tier:3, under:true,
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32], art:'catacombs3_watch', entry:'top',
    rows:[
"##########################","############..############","############..############","########*........*########",
"########..........########","########..........########","########..........########","##########......##########",
"##########......##########","##*....*##o....o##*....*##","##.ttt..##......##..ttt.##","##......##......##......##",
"##......................##","##........o....o........##","##......##......##......##","##......##......##......##",
"##.ttt..##......##..ttt.##","##......##o....o##......##","##########......##########","#########h......##########",
"##########......##########","##########o....o##########","##########......##########","##########......h#########",
"##########......##########","###*..................*###","###....................###","###..o..............o..###",
"###.....tttttttttt.....###","###....................###","###..o..............o..###","###....................###",
"###*..................*###","###########....###########","###########....###########","############GG############",
"##########################","##########################","##########################",
    ],
    spawn:[12,1],
    arrive:{ top:[12,1], bottom:[12,34] },
    arriveSay:{ top:'the stair at the top of The Watch', bottom:'the gate, at the bottom of The Watch' },
    prizes:[[3,11],[22,14]],
    things:[
      { x:12, y:1,  walk:true, verb:'Up', where:'The Deep Cellars', act:()=> goFloor('cata_deep','bottom') },
      { x:12, y:35, w:2, verb:'The gate', act:()=> r5WatchGate(), when:()=> !r5WatchOpen() },
      { x:12, y:34, walk:true, verb:'Through', where:'The Family Crypt', arrow:'down', act:()=> goFloor('cata_crypt','top'), when:()=> r5WatchOpen() },
      { x:9,  y:19, verb:'Drawing', act:()=> r5Chalk(4) },
      { x:16, y:23, verb:'Drawing', act:()=> r5Chalk(5) },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"Listen — far below us. The Monkey King, still fighting his way down."</b><br><br>` +
            `<b>"And the Family's chiefs are here, keeping watch over the way down. All three of them."</b>`,
      guards:[
        { id:'black',  kind:'capo', x:4,  y:13, face:'r', clock:700, roster:'watch_black', sprite:'capo_black', when:()=> !!r5().sottoBeaten && !(r5().watch || {}).black },
        { id:'purple', kind:'capo', x:21, y:13, face:'l', clock:700, roster:'watch_purple', sprite:'capo_purple', when:()=> !!r5().sottoBeaten && !(r5().watch || {}).purple },
        { id:'consig', kind:'capo', x:12, y:30, face:'u', clock:700, roster:'watch_consigliere', sprite:'consigliere', when:()=> !!r5().sottoBeaten && !(r5().watch || {}).consigliere },
        { id:'a', kind:'soldato', path:[[12,8],[12,24]], face:'d', clock:620, pause:3, roster:'watch_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[4,26],[21,26]], face:'r', clock:640, pause:3, roster:'watch_b', sprite:'soldato2' },
      ],
      /* more of the strong ones here: Hydras, Mimes, Firefoxes */
      wild:{ rate:0.025, size:3, lv:[94,98], t3:true, more:{ hydra:2, mime:2, firefox:3 } } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 3. THE FAMILY CRYPT: the Family's dead, every generation of them, in
     tombs with the same knight carved on every lid — a knight with a burning
     sword. Nino's small grave in its alcove, empty. A trail of green leaves
     across the stones to the vault's great door — and Jax in front of it.
     Nobody else on watch: even the Family's men do not like to stand among
     their own dead. ---- */
  cata_crypt: {
    key:'cata_crypt', region:5, title:'The Family Crypt', bg:'catacombs', music:'zone_catacombs', tier:3, under:true,
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32], art:'catacombs3_crypt', entry:'top', vaultDoor:true,
    rows:[
"##########################","############..############","############..############","#########*......*#########",
"#########........#########","#########........#########","#########........#########","###*..................*###",
"###....................###","###..ZZ..ZZ....ZZ..ZZ..###","###....................###","###o..................o###",
"###....................###","###..ZZ..ZZ....ZZ..ZZ..###","###......................#","###o..................o.Z#",
"###......................h","###..ZZ..ZZ....ZZ..ZZ....#","###....................###","###o..................o###",
"###....................###","###..ZZ..ZZ....ZZ..ZZ..###","###....................###","###o..................o###",
"###....................###","##h....................###","###....................###","###########....###########",
"###########....###########","###########....###########","######*............*######","######..............######",
"######..o........o..######","######..............######","######..............######","######..............######",
"###########GGGG###########","##########################","##########################",
    ],
    spawn:[12,1],
    arrive:{ top:[12,1], vault:[12,35] },
    arriveSay:{ top:'the stair at the top of The Family Crypt', vault:'the vault\'s door, at the bottom of The Family Crypt' },
    prizes:[[4,26]],
    chalkFresh:[[25,16]],
    grave:[24,15],
    leaves:[[12,5],[13,7],[12,8],[13,10],[12,12],[13,14],[12,16],[13,18],[12,20],[13,22],[12,24],[13,26],[12,28],[13,30],[12,32],[13,34]],
    things:[
      { x:12, y:1,  walk:true, verb:'Up', where:'The Watch', act:()=> goFloor('cata_watch','bottom') },
      { x:2,  y:25, verb:'Drawing', act:()=> r5Chalk(6) },
      { x:25, y:16, verb:'Drawing', act:()=> r5Chalk(7) },
      { x:24, y:15, verb:'Grave', act:()=> r5Grave() },
      { x:9,  y:9,  w:2, verb:'Tomb', act:()=> r5Tomb() },
      { x:12, y:35, sprite:'rival_padrino', icon:'🧑', verb:'Jax', act:()=> r5JaxDoor(), when:()=> !r5().jaxBeaten, mark:()=> !r5().said.jaxMet },
      /* (3.19) Jax gone in ahead: the door stands open — through it, the vault */
      { x:12, y:35, walk:true, verb:'In', where:'The Vault', arrow:'down', act:()=> r5VaultDoor(), when:()=> !!r5().jaxBeaten },
      { x:11, y:36, w:4, verb:'The vault', act:()=> r5VaultDoor() },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"The Family's dead, every one of them. Walk softly."</b><br><br>` +
            `<b>"And the cold — it is right below us now."</b>`,
      guards:[],
      /* the gentle ones among the tombs: Unicorns, Nurses, Sylphs */
      wild:{ rate:0.02, size:2, lv:[95,98], t3:true, more:{ unicorn:3, nurse:3, sylph:2 } } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 4. THE VAULT (3.19): through the crypt's great iron door — the
     Padrino's vault, one round room, lit. Machines hum along its walls (`Y`),
     a great clock is carved into the floor (vaultClock), Cyborg's iron cradle
     stands at the far end (`M`), a stone table on the left (`E`) and on the
     right the cage of iron and roots (`Q`, its bars an actor over the
     Forest Guardian). Nobody on watch, nothing wild — the whole Family is
     here. A room small enough to see all of at once (`view`: 11 tiles
     across), so everything that happens in it is in sight. THE VAULT, below. ---- */
  cata_vault: {
    key:'cata_vault', region:5, title:'The Vault', bg:'catacombs', music:'zone_catacombs', tier:3, under:true, room:true, vault:true,
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], art:'catacombs3_vault', view:11, vaultClock:[5.5, 6.1, 2.55],
    rows:[
"###########","#*Y.....Y*#","#.........#","#.........#",
"#.EE...QQ.#","#......QQ.#","#.........#","#.........#",
"#Y.......Y#","#*..MMM..*#","###########",
    ],
    spawn:[5,1],
    arrive:{ top:[5,1] },
    things:[
      { x:5, y:1, walk:true, verb:'Up', where:'The Family Crypt', act:()=> goFloor('cata_crypt', 'vault') },
      { x:5, y:6, verb:'The Padrino', act:()=> r5VaultPadrino(), when:()=> r5VaultState() === 'ready' },
      /* (3.20) after the fight he kneels by his broken machine */
      { x:4, y:7, verb:'The Padrino', act:()=> r5VaultPadrino(), when:()=> ['won', 'crowned'].includes(r5VaultState()) },
      { x:7, y:4, w:2, h:2, verb:'The cage', act:()=> r5VaultCage() },
      { x:2, y:4, w:2, verb:'The table', act:()=> r5VaultTable() },
      { x:4, y:9, w:3, verb:'Cyborg', act:()=> r5VaultCyborg(), when:()=> !r5VaultAt('nemesis') },
      /* (3.20) where Nemesis went: the space-time tear, over the empty cradle */
      { x:4, y:9, w:3, verb:'The tear', where:'The space-time tear', act:()=> r5VaultTear(), when:()=> r5VaultAt('nemesis') },
      { x:7, y:2, verb:'Monkey King', act:()=> r5VaultMK(), when:()=> ['ready', 'won', 'crowned'].includes(r5VaultState()) },
    ],
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5VaultRender(world, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ============================================================
     THE CHURCH (2.90) — the Old Town's, at the top of the crypt stair
     Where the catacombs come out: a nave of pews and pillars, candles on the
     altar, the crypt stair down in its east corner and the great door out to
     the piazza. The Old Town's streets are still to come, so the door only
     looks out at them. Explore → The Old Town comes here too, once you have.
     Drawn from its grid (paintChurch) until it has a painting of its own
     (assets/zones/church.png, `art`, at 32 px a tile).
     ============================================================ */
  church: {
    key:'church', region:5, title:'The Church', bg:'region5', music:'zone_church', art:'church',
    bx:0, by:0, bs:1/32, nat:[17*32, 15*32],
    rows:[
"#################","#*....ttttt....*#","#...............#","#.o...........o.#",
"#...ttt...ttt...#","#...............#","#.o.ttt...ttt.o.#","#...............#",
"#...ttt...ttt...#","#.o...........o.#","#...ttt...ttt...#","#...............#",
"#.o...........o.#","#...............#","########.########",
    ],
    spawn:[15,11],
    arrive:{ crypt:[15,11], door:[8,14] },
    things:[
      { x:15, y:11, walk:true, verb:'Down', where:'The Fight Pit', act:()=> goFloor('cata_pit', 'up') },
      { x:8,  y:14, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5OldTownDoor() },
      { x:6,  y:1,  w:5, verb:'Look', act:()=> r5Altar() },
    ],
    paint:(d)=> paintChurch(d),
    onRender:(world, d)=> r5ChurchRender(world, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ============================================================
     UGO'S (2.91) — the tailor's, on the piazza
     Not a shop you buy from: the back room where Ugo, who has made every
     uniform in Cosa Nostia for forty years and been paid for none, made you
     one of your own. Racks of the Family's coats along the wall, his cutting
     table, two dummies, bolts of cloth, a long mirror. Drawn from its grid
     (paintTailor) until it has a painting (assets/zones/tailor.png).
     ============================================================ */
  tailor: {
    key:'tailor', region:5, title:"Ugo's", bg:'region5', music:'zone_old_town', art:'tailor',
    bx:0, by:0, bs:1/32, nat:[13*32, 11*32],
    rows:[
"#############","#kkkk...kkkk#","#...........#","#.tttt...o.o#","#.tttt......#","#...........#",
"#o........cc#","#.........cc#","#...........#","#...........#","######.######",
    ],
    spawn:[6,10],
    arrive:{ door:[6,10] },
    things:[
      { x:6, y:10, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5TailorOut() },
      { x:4, y:5,  sprite:'tailor', icon:'🧵', verb:'Talk', act:()=> r5Tailor() },
      { x:6, y:1,  walk:true, verb:'Mirror', act:()=> r5Mirror() },
    ],
    paint:(d)=> paintTailor(d),
    onRender:(world, d)=> r5TailorRender(world, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ============================================================
     THE OLD TOWN (2.91) — its streets, from the town's own plan (26×39, up
     the page is up the hill)
     At the top, the steps up to the hilltop and the Padrino's villa, Nonna's
     house, the barber's and the opera house; the church in the middle with a
     lane down either side, the police station and the post office; below the
     church's steps the piazza and its fountain, the café (its capos at the
     tables outside), the trattoria, Ugo's and the gelateria; along the bottom
     the belvedere over the harbour, the funicular station, and the steps down
     to the harbour gate.
     The Family's own streets: lit (no dark to hide in), soldatos on every
     corner — and in disguise nobody looks twice at you. Out of it here, they
     know you at once (kind 'town', 14-stealth.js; r5TownCaught). Drawn from
     its grid (paintTown) until it has a painting (assets/zones/old_town.png).
     ============================================================ */
  old_town: {
    key:'old_town', region:5, title:'The Old Town', bg:'region5', music:'zone_old_town', art:'old_town',
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32],
    rows:[
"#ggggggggggg==#BBBBBBBBBB#","#BBBBBBggggg==#BBBBBBBBBB#","#BBBBBBBBBBB==#BBBBBBBBBB#","#BBBBBBBBBBB==#BBBBBBBBBB#",
"#BBBBBBBBBBB==#BBBBBBBBBB#","#BBBBBBBBBBB==#BBBBBBBBBB#","#BBBBBBBBBBB==#BBBBBBBBBB#","..........................",
"..........................","=gggggg.BBBBBBBBBB.gggggg=","=BBBBBB.BBBBBBBBBB.BBBBBB=","=BBBBBB.BBBBBBBBBB.BBBBBB=",
"=BBBBBB.BBBBBBBBBB.BBBBBB=","=BBBBBB.BBBBBBBBBB.BBBBBB=","=BBBBBB.BBBBBBBBBB.BBBBBB=","=BBBBBB.BBBBBBBBBB.BBBBBB=",
"=BBBBBB.BBBBBBBBBB.BBBBBB=","=BBBBBB.BBBBBBBBBB.BBBBBB=","........BBBBBBBBBB........","..........======..........",
"..........======..........",".BBBBBB,,,,,,,,,,,,BBBBBB=","=BBBBBBt,,,,,,,,,,tBBBBBB=","=BBBBBB,,,t,,,,,,,,BBBBBB=",
"=BBBBBB,,,,,~~,,,,,BBBBBB=","=BBBBBB,,,,~~~~,,,,BBBBBB=",".BBBBBBg,,t~~~~,,,gBBBBBB=",".BBBBBB,,,,,~~,,,,,BBBBBB=",
".BBBBBB,,,,,,,,,,,,BBBBBB=",".BBBBBBg,,,,,,,,,,gBBBBBB.",".BBBBBB,,,,,,,,,,,,BBBBBB.","..........................",
"#w........................","#w,,,,,,,,,,==####BBBBB###","#w,tt,,,,,tw==####BBBBB###","#wwwt,,,,,tw==####BBBBB###",
"###ww,,ttttw==####BBBBB###","#####wwwwwww==####BBBBB###","############==######x#####",
    ],
    spawn:[12,19],
    arrive:{ church:[12,19], tailor:[18,23], harbour:[12,38], hill:[12,0],
             /* (3.03) out of the town's rooms, onto their doors */
             nonna:[3,7], barber:[9,7], opera:[19,7], police:[3,18], post:[21,18], cafe:[7,23], trattoria:[3,31], gelateria:[21,31] },
    /* (3.31) The church's roof and bell tower stand up over the street behind
       it (rows 7–8): whoever walks there goes behind them, and they turn
       see-through while you are near (walkOverlays, 13-walkmap.js). Traced
       round the painting of 2026-10-20 — a new painting needs a new outline. */
    over:[
      { name:'church roof', foot:9, poly:[
        [7.96,9.5],[7.96,8.86],[8.02,8.80],[8.17,8.80],[8.17,8.40],[8.24,8.30],[9.15,8.30],[9.16,8.18],[9.26,8.18],
        [9.26,7.70],[9.38,7.70],[9.38,8.18],[9.48,8.18],[9.50,8.30],[10.44,8.30],[10.51,8.37],[10.51,8.76],[10.72,8.76],
        [12.83,7.81],[12.90,7.70],[13.10,7.70],[13.17,7.80],[15.47,8.85],[15.53,8.92],[15.53,9.5]] },
    ],
    things:[
      { x:12, y:19, w:2, walk:true, verb:'In', where:'The Church', arrow:'up', act:()=> r5TownChurch() },
      /* (3.31) the café's and Ugo's side doors are two squares tall, as the painting has them */
      { x:18, y:23, h:2, walk:true, verb:'In', where:"Ugo's", arrow:'right', act:()=> goFloor('tailor', 'door') },
      { x:12, y:38, walk:true, verb:'Down', where:'The Harbour', act:()=> r5TownDown() },
      { x:12, y:5,  w:2, verb:'Up the hill', act:()=> r5VillaRoad(), when:()=> !r5().hill },
      /* (2.92) once Figlio has walked you up, the steps are yours, to the top */
      { x:12, y:0,  w:2, walk:true, verb:'Up', where:'The Hilltop', act:()=> r5HillUp(), when:()=> !!r5().hill },
      /* (2.92) Figlio, home from Region 3's band competition, outside the opera house —
         (3.31) by its right-hand door: the way in is the big one in the middle */
      { x:21, y:7,  sprite:'figlio', icon:'🎙️', verb:'Talk', act:()=> r5Figlio(), when:()=> !!r5().disguise,
        mark:()=> !r5().figlioMet },
      /* (3.03) every house and shop on the streets has its room, and its people in it */
      /* (3.31) a door the painting draws wide takes two squares (Nonna's and the barber's are narrow: one) */
      { x:3,  y:7,  walk:true, verb:'In', where:"Nonna's", arrow:'up', act:()=> r5RoomDoor('room_nonna') },
      { x:9,  y:7,  walk:true, verb:'In', where:"The barber's", arrow:'up', act:()=> r5RoomDoor('room_barber') },
      { x:19, y:7,  w:2, walk:true, verb:'In', where:'The opera house', arrow:'up', act:()=> r5RoomDoor('room_opera') },
      { x:3,  y:18, w:2, walk:true, verb:'In', where:'The police station', arrow:'up', act:()=> r5RoomDoor('room_police') },
      { x:21, y:18, w:2, walk:true, verb:'In', where:'The post office', arrow:'up', act:()=> r5RoomDoor('room_post') },
      { x:7,  y:23, h:2, walk:true, verb:'In', where:'The café', arrow:'left', act:()=> r5RoomDoor('room_cafe') },
      /* (3.30) the trattoria and the gelateria open onto the street below, as the painting has them */
      { x:3,  y:31, w:2, walk:true, verb:'In', where:'The trattoria', arrow:'up', act:()=> r5RoomDoor('room_trattoria') },
      { x:21, y:31, w:2, walk:true, verb:'In', where:'The gelateria', arrow:'up', act:()=> r5RoomDoor('room_gelateria') },
      { x:11, y:24, w:4, h:4, verb:'Fountain', act:()=> r5Fountain() },        // (3.30) the painting's fountain is bigger
      { x:5,  y:35, walk:true, verb:'Look', act:()=> r5Belvedere() },
      { x:20, y:32, walk:true, verb:'Funicular', act:()=> r5TownFunicular() },
      /* the capos, at the café's tables: whichever you have beaten below —
         (2.95) and the Consigliere, once he has walked out of his ring. Each
         of them is one man, in one place: down there, or up here. */
      /* (3.18) …until the villa's door is broken: then they are all down on the Watch, under the villa */
      /* (3.30) on the painting's chairs: two at the near table, one at the far one */
      { x:11, y:23, sprite:'capo_purple', icon:'🕴️', verb:'Capo', act:()=> r5CapoLook('purple'), when:()=> !!r5().capoPurple && !r5().sottoBeaten },
      { x:9,  y:23, sprite:'capo_black',  icon:'🕴️', verb:'Capo', act:()=> r5CapoLook('black'), when:()=> !!r5().capoBlack && !r5().sottoBeaten },
      { x:9,  y:25, sprite:'consigliere', icon:'🕴️', verb:'Consigliere', act:()=> r5CapoLook('consigliere'), when:()=> !!r5().capoGrey && !r5().sottoBeaten },
    ],
    stealth:{ kind:'town', light:true, feel:0,
      guards:[
        { id:'a',  kind:'soldato', path:[[1,8],[24,8]],   face:'r', clock:640, pause:3, sprite:'soldato2' },
        { id:'b',  kind:'soldato', path:[[24,20],[1,20]], face:'l', clock:620, pause:3, sprite:'soldato1' },
        { id:'c',  kind:'soldato', path:[[24,31],[1,31]], face:'l', clock:660, pause:3, sprite:'soldato2' },
        { id:'d',  kind:'soldato', path:[[9,28],[16,28]], face:'r', clock:700, pause:4, sprite:'soldato1' },
        { id:'t1', kind:'talker',  x:11, y:7,  face:'r', sprite:'soldato1' },
        { id:'t2', kind:'talker',  x:14, y:7,  face:'l', sprite:'soldato2' },
        { id:'t3', kind:'talker',  x:11, y:32, face:'r', sprite:'soldato2' },
        { id:'t4', kind:'talker',  x:14, y:32, face:'l', sprite:'soldato1' },
        { id:'l1', kind:'lookout', x:5,  y:34, face:'d', spin:'cw',  clock:680, pause:5, sprite:'soldato2' },
        { id:'l2', kind:'lookout', x:2,  y:19, face:'r', spin:'ccw', clock:640, pause:4, sprite:'soldato1' },
        { id:'l3', kind:'lookout', x:23, y:19, face:'l', spin:'cw',  clock:660, pause:4, sprite:'soldato2' },
      ] },
    paint:(d)=> paintTown(d),
    onRender:(world, d)=> r5TownRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ============================================================
     THE HILLTOP (2.92) — the Padrino's estate, from the hilltop's plan
     (26×39, up the page is up the hill)
     The steps up from the Old Town, the lemon terraces and Grandpa's
     cottage, the terrace path, the lemon farm and the guard house, the gate
     square — and the estate inside its walls: the villa, its forecourt and
     fountain, and (reworked from the plan's watchtower, outside the wall)
     the psychics' tower in the east garden. The Family's ground, like the
     Old Town: lit, men on watch, and in uniform nobody looks twice (kind
     'town'). Reached the first time on Figlio's arm (r5HillEscort). Drawn
     from its grid (paintTown) until assets/zones/hilltop.png is there.
     (3.32) Fitted to the designer's painting (2026-10-20), every door at the
     bottom of its building: the villa's great door at the top of its
     courtyard, the fountain in the middle, two lanes round it; the estate's
     path two lanes wide inside the gate, the pool's terrace scenery; the
     tower's door and its path; the road two lanes, and below it the lemon
     farm's shed door (two squares), the guard house's door and the brick
     path down; the second road; Grandpa's door onto a road of its own.
     ============================================================ */
  hilltop: {
    key:'hilltop', region:5, title:'The Hilltop', bg:'region5', music:'zone_hilltop', art:'hilltop',
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32],
    rows:[
"ggggBBBBBBBBBBBBBBBBBBBBgg","ggggBBBBBBBBBBBBBBBBBBBBgg","ggggggggBBBBBBBBBBgBBBBBgg","ggggggggBBBBBBBBBBgBBBBBgg",
"ggggggggBBB,,,,BBBgBBBBBgg","ggggggggBB,,~~,,BBgBBBBBgg","ggggggggBBg,~~,gBBgBB,gggg","ggggggggBBg,,,,gBBggg,gggg",
"gggggggggggg,,ggggggg,gggg","gggggg,,gggg,,ggggggg,gggg","gggggg,,,,,,,,,,,,,,,,,,gg","gggggg,,gg,g,,g,gg,,g,,ggg",
"wwwwwwwwwwww,,wwwwwwwwwwww","..........................","..........................","gggggggggggg==gggggggggggg",
"ggggggBBBBBg==ggBBBBBBBggg","ggggggBBBBBg==ggBBBBBBBggg","gggggBBBBBBg==ggBBBBBBBggg","gggggBBBBBBg==ggBBBBBBBggg",
"gggggggggBBg==ggBBBBBBBggg","gggggggg,,,g==ggBBB,BBBggg","gggggggg,,gg==ggggg,gggggg","..........................",
"..........................","gggggggggggg==gggggggggggg","gggggggggggg==gggBBBBBgggg","gggggggggggg==gggBBBBBgggg",
"gggggggggggg==gggBBBBBgggg","gggggggggggg==gggBBBBBgggg","gggggggggggg==ggggg,gggggg","gggggggggggg==............",
"gggggggggggg==............","############==gggggggggggg","############==gggggggggggg","############==gggggggggggg",
"############==gggggggggggg","############==gggggggggggg","############==gggggggggggg",
    ],
    spawn:[12,38],
    arrive:{ down:[12,38], tower:[21,6],
             /* (3.03) out of the hill's rooms, onto their doors — (3.32) at the bottom of each */
             lemons:[9,21], guards:[19,21], grandpa:[19,30],
             villa:[12,4] },                                   // (3.04) out of the villa's great door
    /* (3.32) the two topiaries beside the gate stand up over the path behind
       them (walkOverlays, 13-walkmap.js): whoever walks there goes behind
       them. Traced round the painting of 2026-10-20. */
    /* (3.33) the poolside's corner — below the lower deck chair, right of the
       screen (6–7, rows 9–11) — shut until the villa is open (wSolid) */
    shut:(x, y)=> x >= 6 && x <= 7 && y >= 9 && y <= 11 && !r5().sottoBeaten,
    over:[
      { name:'topiary, west of the gate', foot:11, poly:[[11.25,10.45],[11.32,10.38],[11.66,10.38],[11.73,10.45],[11.73,10.84],
        [11.84,10.94],[11.84,11.36],[11.6,11.45],[11.6,11.72],[11.1,11.72],[11.1,10.94],[11.24,10.84]] },
      { name:'topiary, east of the gate', foot:11, poly:[[14.35,10.45],[14.41,10.38],[14.73,10.38],[14.79,10.45],[14.79,10.84],
        [14.96,10.95],[14.96,11.36],[14.9,11.45],[14.9,11.78],[14.48,11.78],[14.48,11.45],[14.22,11.36],[14.22,10.95],[14.35,10.84]] },
    ],
    things:[
      { x:12, y:38, w:2, walk:true, verb:'Down', where:'The Old Town', act:()=> r5HillDown() },
      { x:21, y:6,  walk:true, verb:'In', where:'The Tower', arrow:'up', act:()=> r5TowerIn() },
      /* (2.95) the Sottocapo, the Padrino's right hand, filling the villa's
         great doorway: nobody goes in past him — (3.32) between the middle
         columns, at the top of the courtyard; you speak to him from beside them */
      { x:12, y:4,  w:2, sprite:'sottocapo', icon:'🕴️', verb:'Talk', act:()=> r5VillaDoor(), when:()=> !r5().sottoBeaten,
        mark:()=> !!r5().holdBroken },
      /* (3.04) beaten, he runs inside, down to his master: the door is yours */
      { x:12, y:4,  w:2, walk:true, verb:'In', where:'The villa', arrow:'up', act:()=> r5RoomDoor('villa'), when:()=> !!r5().sottoBeaten },
      { x:12, y:5,  w:2, h:2, verb:'Fountain', act:()=> r5VillaFountain() },   // (3.32) in the courtyard, before the door
      /* (3.03) the hill's houses have their rooms, and their people in them —
         (3.32) every door at the bottom of its building: the lemon farm's is
         its packing shed's (two squares: the big door is behind its crates) */
      { x:9,  y:21, w:2, walk:true, verb:'In', where:'The lemon farm', arrow:'up', act:()=> r5RoomDoor('room_lemons') },
      /* (3.33) up on the dirt patch, in the doorway */
      { x:19, y:21, walk:true, verb:'In', where:'The guard house', arrow:'up', act:()=> r5RoomDoor('room_guards') },
      { x:19, y:30, walk:true, verb:'In', where:"Grandpa's", arrow:'up', act:()=> r5RoomDoor('room_grandpa') },
      /* (3.33) the Padrino's pool, once the villa is open: at the water's
         corner, a swim — the Whalelord will not have it (r5PoolDive) */
      { x:5,  y:9,  verb:'Dive and relax', act:()=> r5PoolDive(), when:()=> !!r5().sottoBeaten },
    ],
    stealth:{ kind:'town', light:true, feel:0,
      guards:[
        { id:'a',  kind:'soldato', path:[[1,14],[24,14]], face:'r', clock:640, pause:3, sprite:'soldato2' },
        { id:'b',  kind:'soldato', path:[[24,24],[1,24]], face:'l', clock:660, pause:3, sprite:'soldato1' },
        { id:'c',  kind:'soldato', path:[[8,10],[23,10]], face:'r', clock:620, pause:3, sprite:'soldato2' },
        { id:'g1', kind:'talker',  x:11, y:13, face:'r', sprite:'soldato1' },
        { id:'g2', kind:'talker',  x:14, y:13, face:'l', sprite:'soldato2' },
        { id:'v1', kind:'talker',  x:10, y:5,  face:'r', sprite:'soldato2' },      // (3.32) either side of the fountain
        { id:'v2', kind:'talker',  x:15, y:5,  face:'l', sprite:'soldato1' },
        { id:'l1', kind:'lookout', x:2,  y:13, face:'r', spin:'cw', clock:680, pause:5, sprite:'soldato1' },
      ] },
    paint:(d)=> paintTown(d),
    onRender:(world, d)=> r5TownRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ============================================================
     THE TOWN'S ROOMS (3.03) — inside the buildings of the harbour, the Old
     Town and the Hilltop, the designer's: "draw up some rooms for the
     existing buildings, and put 10 tokens in each of them … have the
     relevant NPCs inhabit it. None of them should be sleeping." Each is
     drawn from its grid (paintRoom, with its look in R5_ROOM_LOOKS) until it
     has a painting of its own (assets/zones/<key>.png at 32 px a tile); each
     has one find of 10 Skill Tokens (prizes), whose owner says you may keep
     it (R5_ROOM_FIND). In at the building's door (r5RoomDoor), out at its
     own (r5RoomOut). The Old Town's and the Hilltop's count among the finds
     once you can walk there (opens).
     ============================================================ */
  room_marta: { key:'room_marta', region:5, house:true, zone:'harbour', title:"Signora Marta's", bg:'region5', music:'zone_harbour', art:'room_marta',
    bx:0, by:0, bs:1/32, nat:[11*32, 8*32], spawn:[5,7], arrive:{ door:[5,7] }, prizes:[[9,6]],
    rows:["###########","#SSF...SSR#","#........R#","#..CtC....#","#..CtC..P.#","#...,,,...#","#.........#","#####.#####"],
    things:[
      { x:5, y:7, walk:true, verb:'Out', where:'The Harbour', arrow:'down', act:()=> r5RoomOut('harbour', 'marta') },
      { x:6, y:2, sprite:'fishwife', icon:'👩', verb:'Talk', act:()=> r5Marta() },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_lucia: { key:'room_lucia', region:5, house:true, zone:'harbour', title:"Lucia's", bg:'region5', music:'zone_harbour', art:'room_lucia',
    bx:0, by:0, bs:1/32, nat:[11*32, 8*32], spawn:[5,7], arrive:{ door:[5,7] }, prizes:[[3,1]],
    rows:["###########","#NN.SS.NNR#","#........R#","#.N.....t.#","#.N..,,.C.#","#....,,...#","#.........#","#####.#####"],
    things:[
      { x:5, y:7, walk:true, verb:'Out', where:'The Harbour', arrow:'down', act:()=> r5RoomOut('harbour', 'lucia') },
      { x:5, y:3, sprite:'pippo', icon:'🧒', verb:'Talk', act:()=> r5Folk('pippo') },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_station: { key:'room_station', region:5, house:true, zone:'harbour', title:"The station", bg:'region5', music:'zone_harbour', art:'room_station',
    bx:0, by:0, bs:1/32, nat:[13*32, 8*32], spawn:[6,7], arrive:{ door:[6,7] }, prizes:[[11,6]],
    rows:["#############","#S.S.....S.S#","#...K.K.....#","#...........#","#.LL....LL..#","#...........#","#.LL....LL..#","######.######"],
    things:[
      { x:6, y:7, walk:true, verb:'Out', where:'The Harbour', arrow:'down', act:()=> r5RoomOut('harbour', 'station') },
      { x:5, y:2, sprite:'station_master', icon:'🎩', verb:'Talk', act:()=> r5StationMaster() },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_customs: { key:'room_customs', region:5, house:true, zone:'harbour', title:"The customs house", bg:'region5', music:'zone_harbour', art:'room_customs',
    bx:0, by:0, bs:1/32, nat:[13*32, 9*32], spawn:[6,8], arrive:{ door:[6,8] }, prizes:[[1,7]],
    rows:["#############","#SSS.SSS.SSS#","#.D...S...D.#","#...........#","#KKKKK.KKKKK#","#...........#","#.L.......L.#","#...........#","######.######"],
    things:[
      { x:6, y:8, walk:true, verb:'Out', where:'The Harbour', arrow:'down', act:()=> r5RoomOut('harbour', 'customs') },
      { x:6, y:4, sprite:'customs_clerk', icon:'🧾', verb:'Talk', act:()=> r5Folk('customs_clerk') },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_warehouse: { key:'room_warehouse', region:5, house:true, zone:'harbour', title:"The warehouse", bg:'region5', music:'zone_harbour', art:'room_warehouse',
    bx:0, by:0, bs:1/32, nat:[13*32, 10*32], spawn:[6,9], arrive:{ door:[6,9] }, prizes:[[3,1]],
    rows:["#############","#cc.cc.cc.cc#","#cc.cc.cc.cc#","#...........#","#bb.......bb#","#b..cc.cc..b#","#...cc.cc...#","#...........#","#c.........c#","######.######"],
    things:[
      { x:6, y:9, walk:true, verb:'Out', where:'The Harbour', arrow:'down', act:()=> r5RoomOut('harbour', 'warehouse') },
      { x:6, y:4, sprite:'dockhand', icon:'📦', verb:'Storage', act:()=> r5Dockhand() },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_nonna: { key:'room_nonna', region:5, house:true, zone:'old_town', title:"Nonna's", bg:'region5', music:'zone_old_town', art:'room_nonna', opens:()=> !!r5().disguise,
    bx:0, by:0, bs:1/32, nat:[11*32, 9*32], spawn:[5,8], arrive:{ door:[5,8] }, prizes:[[9,6]],
    rows:["###########","#SS.F..SSP#","#...A.....#","#.,,,,,...#","#.,,,,,.t.#","#.,,,,,CtC#","#.........#","#P.......R#","#####.#####"],
    things:[
      { x:5, y:8, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5RoomOut('old_town', 'nonna') },
      { x:5, y:2, sprite:'nonna', icon:'👵', verb:'Talk', act:()=> r5Folk('nonna') },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_barber: { key:'room_barber', region:5, house:true, zone:'old_town', title:"The barber's", bg:'region5', music:'zone_old_town', art:'room_barber', opens:()=> !!r5().disguise,
    bx:0, by:0, bs:1/32, nat:[11*32, 8*32], spawn:[5,7], arrive:{ door:[5,7] }, prizes:[[9,2]],
    rows:["###########","#SS.....SS#","#.V..V..V.#","#.........#","#.........#","#LL.....LL#","#.........#","#####.#####"],
    things:[
      { x:5, y:7, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5RoomOut('old_town', 'barber') },
      { x:4, y:3, sprite:'barber', icon:'💈', verb:'Talk', act:()=> r5Folk('barber') },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_opera: { key:'room_opera', region:5, house:true, zone:'old_town', title:"The opera house", bg:'region5', music:'zone_opera', art:'room_opera', opens:()=> !!r5().disguise,
    bx:0, by:0, bs:1/32, nat:[15*32, 12*32], spawn:[7,11], arrive:{ door:[7,11] }, prizes:[[13,1]],
    rows:["###############","#_____________#","#_____________#","#_____________#","#...HH........#","#.............#","#.ZZZZZ.ZZZZZ.#","#.............#","#.ZZZZZ.ZZZZZ.#","#.............#","#.ZZZZZ.ZZZZZ.#","#######.#######"],
    things:[
      { x:7, y:11, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5RoomOut('old_town', 'opera') },
      { x:6, y:4, sprite:'maestro', icon:'🎹', verb:'Talk', act:()=> r5Folk('maestro') },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_police: { key:'room_police', region:5, house:true, zone:'old_town', title:"The police station", bg:'region5', music:'zone_old_town', art:'room_police', opens:()=> !!r5().disguise,
    bx:0, by:0, bs:1/32, nat:[13*32, 9*32], spawn:[6,8], arrive:{ door:[6,8] }, prizes:[[10,2]],
    rows:["#############","#SS..S.J...R#","#......J....#","#.D.D..J....#","#.C.C..JJ.JJ#","#...........#","#..........P#","#S..........#","######.######"],
    things:[
      { x:6, y:8, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5RoomOut('old_town', 'police') },
      { x:2, y:2, sprite:'police1', icon:'👮', verb:'Talk', act:()=> r5Folk('police1') },
      { x:4, y:2, sprite:'police2', icon:'👮', verb:'Talk', act:()=> r5Folk('police2') },
      { x:3, y:1, walk:true, verb:'Poster', act:()=> r5WantedPoster() },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_post: { key:'room_post', region:5, house:true, zone:'old_town', title:"The post office", bg:'region5', music:'zone_old_town', art:'room_post', opens:()=> !!r5().disguise,
    bx:0, by:0, bs:1/32, nat:[11*32, 8*32], spawn:[5,7], arrive:{ door:[5,7] }, prizes:[[1,6]],
    rows:["###########","#SSSS.SSSS#","#.c.....c.#","#KKKK.KKKK#","#.........#","#.b.....b.#","#.........#","#####.#####"],
    things:[
      { x:5, y:7, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5RoomOut('old_town', 'post') },
      { x:5, y:3, sprite:'post_clerk', icon:'📮', verb:'Storage', act:()=> r5PostOffice() },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_cafe: { key:'room_cafe', region:5, house:true, zone:'old_town', title:"The café", bg:'region5', music:'zone_old_town', art:'room_cafe', opens:()=> !!r5().disguise,
    bx:0, by:0, bs:1/32, nat:[13*32, 8*32], spawn:[6,7], arrive:{ door:[6,7] }, prizes:[[11,5]],
    rows:["#############","#SSS.SSS.SSS#","#KKKKK.KKKKK#","#...........#","#.Ct.....tC.#","#...........#","#.Ct.....tC.#","######.######"],
    things:[
      { x:6, y:7, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5RoomOut('old_town', 'cafe') },
      { x:6, y:2, sprite:'barista', icon:'☕', verb:'Talk', act:()=> r5Folk('barista') },
      /* (3.07) two soldatos over their coffee, at the table furthest from the
         door (the find, 11,5, left clear) — out in the streets with the dead
         once the hold breaks */
      { x:2, y:4, sprite:'soldato2', icon:'💂', verb:'Talk', act:()=> r5Folk('cafe1'), when:()=> !r5().holdBroken, faceR:true },
      { x:4, y:4, sprite:'soldato1', icon:'💂', verb:'Talk', act:()=> r5Folk('cafe2'), when:()=> !r5().holdBroken },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_trattoria: { key:'room_trattoria', region:5, house:true, zone:'old_town', title:"The trattoria", bg:'region5', music:'zone_old_town', art:'room_trattoria', opens:()=> !!r5().disguise,
    bx:0, by:0, bs:1/32, nat:[13*32, 9*32], spawn:[6,8], arrive:{ door:[6,8] }, prizes:[[11,4]],
    rows:["#############","#S.FF.S.FF.S#","#...........#","#KKKKK.KKKKK#","#...........#","#.CtC...CtC.#","#...........#","#.CtC...CtC.#","######.######"],
    things:[
      { x:6, y:8, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5RoomOut('old_town', 'trattoria') },
      { x:6, y:3, sprite:'trattoria_cook', icon:'🍝', verb:'Talk', act:()=> r5Trattoria() },
      /* (3.07) two soldatos at their supper, either side of a table (the
         find, 11,4, left clear) — gone once the hold breaks */
      { x:2, y:5, sprite:'soldato1', icon:'💂', verb:'Talk', act:()=> r5Folk('tratt1'), when:()=> !r5().holdBroken, faceR:true },
      { x:4, y:5, sprite:'soldato2', icon:'💂', verb:'Talk', act:()=> r5Folk('tratt2'), when:()=> !r5().holdBroken },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_gelateria: { key:'room_gelateria', region:5, house:true, zone:'old_town', title:"The gelateria", bg:'region5', music:'zone_old_town', art:'room_gelateria', opens:()=> !!r5().disguise,
    bx:0, by:0, bs:1/32, nat:[11*32, 8*32], spawn:[5,7], arrive:{ door:[5,7] }, prizes:[[9,5]],
    rows:["###########","#SS.S.S.SS#","#KKKK.KKKK#","#.........#","#.Ct...tC.#","#.........#","#P.......P#","#####.#####"],
    things:[
      { x:5, y:7, walk:true, verb:'Out', where:'The Old Town', arrow:'down', act:()=> r5RoomOut('old_town', 'gelateria') },
      { x:5, y:2, sprite:'gelataio', icon:'🍨', verb:'Talk', act:()=> r5Folk('gelataio') },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_grandpa: { key:'room_grandpa', region:5, house:true, zone:'hilltop', title:"Grandpa's", bg:'region5', music:'zone_hilltop', art:'room_grandpa', opens:()=> !!r5().hill,
    bx:0, by:0, bs:1/32, nat:[11*32, 8*32], spawn:[5,7], arrive:{ door:[5,7] }, prizes:[[1,6]],
    rows:["###########","#SS.F...SR#","#...A....R#","#.........#","#..CtC..P.#","#...,,,...#","#...,,,...#","#####.#####"],
    things:[
      { x:5, y:7, walk:true, verb:'Out', where:'The Hilltop', arrow:'down', act:()=> r5RoomOut('hilltop', 'grandpa') },
      { x:5, y:2, sprite:'grandpa', icon:'👴', verb:'Talk', act:()=> r5Grandpa() },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_lemons: { key:'room_lemons', region:5, house:true, zone:'hilltop', title:"The lemon farm", bg:'region5', music:'zone_hilltop', art:'room_lemons', opens:()=> !!r5().hill,
    bx:0, by:0, bs:1/32, nat:[13*32, 9*32], spawn:[6,8], arrive:{ door:[6,8] }, prizes:[[3,1]],
    rows:["#############","#cc.cc.cc.cc#","#...........#","#.tttt.tttt.#","#...........#","#cc.......cc#","#cc..P.P..cc#","#...........#","######.######"],
    things:[
      { x:6, y:8, walk:true, verb:'Out', where:'The Hilltop', arrow:'down', act:()=> r5RoomOut('hilltop', 'lemons') },
      { x:6, y:4, sprite:'lemon_farmer', icon:'🍋', verb:'Talk', act:()=> r5Folk('lemon_farmer') },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  room_guards: { key:'room_guards', region:5, house:true, zone:'hilltop', title:"The guard house", bg:'region5', music:'zone_hilltop', art:'room_guards', opens:()=> !!r5().hill,
    bx:0, by:0, bs:1/32, nat:[13*32, 9*32], spawn:[6,8], arrive:{ door:[6,8] }, prizes:[[10,7]],
    rows:["#############","#RR.RR..SS.F#","#...........#","#...........#","#....tt.....#","#...........#","#R.........R#","#R.........R#","######.######"],
    things:[
      { x:6, y:8, walk:true, verb:'Out', where:'The Hilltop', arrow:'down', act:()=> r5RoomOut('hilltop', 'guards') },
      { x:4, y:4, sprite:'soldato1', icon:'💂', verb:'Talk', act:()=> r5Folk('cards1'), when:()=> !r5().holdBroken, faceR:true },   // (3.07) facing his cards
      { x:7, y:4, sprite:'soldato2', icon:'💂', verb:'Talk', act:()=> r5Folk('cards2'), when:()=> !r5().holdBroken },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5RoomRender(world, d), ghostChat:(id)=> r5GhostChat(id) },

  /* ============================================================
     THE VILLA (3.04) — the Padrino's house, in at its great door once the
     Sottocapo is beaten. Calm: lamps lit, a clock ticking, not one ghost in
     it (Nino keeps them out — scene 6 of §12b). The hall up the middle, from
     the great door to the cellar stair; the salon (the Madrina by the fire,
     the photograph on the mantel) and the dining room (supper laid for six)
     either side of it; the study (the Padrino's desk) and the kitchen at the
     back. Drawn from its grid (paintRoom, its look and R5_ROOM_DECOR.villa)
     until assets/zones/villa.png is there (19×15, 32 px a tile).
     ============================================================ */
  villa: { key:'villa', region:5, house:true, zone:'hilltop', title:'The villa', bg:'region5', music:'zone_villa', art:'villa', opens:()=> !!r5().sottoBeaten,
    bx:0, by:0, bs:1/32, nat:[19*32, 15*32], spawn:[9,14], arrive:{ door:[9,14], cellar:[9,1] }, prizes:[[6,5]],
    rows:["###################","#SSS..S#...#SS.FFS#","#.DD...#...#......#","#.C....#...#.tt...#","#.................#",
          "#......#...#......#","########...########","#SSFFSS#...#SS..SS#","#.A..A.#...#.CCCC.#","#.,,,,.......tttt.#",
          "#.,,,,.#...#.CCCC.#","#P.AA.P#o.o#......#","#......#...#.S..S.#","#P....P#...#P....P#","#########.#########"],
    things:[
      { x:9,  y:14, walk:true, verb:'Out', where:'The Hilltop', arrow:'down', act:()=> r5RoomOut('hilltop', 'villa') },
      { x:9,  y:1,  walk:true, verb:'Down', where:'The cellars', act:()=> r5CellarStair() },
      { x:3,  y:9,  sprite:'madrina', icon:'👵', verb:'Talk', act:()=> r5Madrina(), when:()=> !r5().madrinaGone, mark:()=> !r5().madrinaMet },
      { x:3,  y:7,  w:2, verb:'Photograph', act:()=> r5Photograph() },
      { x:2,  y:2,  w:2, verb:'Desk', act:()=> r5VillaDesk() },
      { x:15, y:1,  w:2, verb:'Stove', act:()=> r5VillaKitchen() },
      { x:13, y:9,  w:4, verb:'Table', act:()=> r5VillaTable() },
    ],
    paint:(d)=> paintRoom(d), onRender:(world, d)=> r5VillaRender(world, d), ghostChat:(id)=> r5GhostChat(id) },

  /* ============================================================
     THE TOWER (2.92) — the psychics' tower, inside the estate walls
     Thirteen floors, one room each, climbed from the door: a disciple on
     every floor — the ghost disciples and the psychic disciples by turns —
     and the Psychic Master and the Ghost Master at the top. A uniform does
     not fool them: the ones who talk to the dead feel the Whalelord the
     moment you come in, and the mind-readers hear your thoughts. Every one
     of them fights you. Each stands in front of the stair up; beat them and they step
     aside, and the stair is yours for good. The ghost floors are rooms of
     candles, the psychic floors of crystal pillars. Drawn from their grids
     (paintTower) until assets/zones/tower_ghost.png and tower_psychic.png
     are there (11×11, 352×352 at 32 px a tile); the ground floor (its door
     out) and the top floor (its window) look for tower_ground.png and
     tower_top.png first, then the ghost floors' painting (artAlt).
     ============================================================ */
  tower_1: { key:'tower_1', region:5, tower:1, title:'The Tower · Floor 1', bg:'region5', music:'zone_tower', art:'tower_ground', artAlt:'tower_ghost',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#...*.*...#","#.........#","#...*.*...#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Out', where:'The estate', arrow:'down', act:()=> r5TowerOut() },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 2', act:()=> goFloor('tower_2', 'down'), when:()=> r5TowerBeaten(1) },
      { x:5, y:2, sprite:'ghost_disciple1', icon:'👻', verb:'Challenge', act:()=> r5TowerChallenge(1), when:()=> !r5TowerBeaten(1) },
      { x:3, y:2, sprite:'ghost_disciple1', icon:'👻', verb:'Talk', act:()=> r5TowerTalk(1), when:()=> r5TowerBeaten(1) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_2: { key:'tower_2', region:5, tower:2, title:'The Tower · Floor 2', bg:'region5', music:'zone_tower', art:'tower_psychic',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#..o...o..#","#.........#","#..o...o..#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 1', act:()=> goFloor('tower_1', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 3', act:()=> goFloor('tower_3', 'down'), when:()=> r5TowerBeaten(2) },
      { x:5, y:2, sprite:'psychic_disciple1', icon:'🔮', verb:'Challenge', act:()=> r5TowerChallenge(2), when:()=> !r5TowerBeaten(2) },
      { x:3, y:2, sprite:'psychic_disciple1', icon:'🔮', verb:'Talk', act:()=> r5TowerTalk(2), when:()=> r5TowerBeaten(2) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_3: { key:'tower_3', region:5, tower:3, title:'The Tower · Floor 3', bg:'region5', music:'zone_tower', art:'tower_ghost',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#...*.*...#","#.........#","#...*.*...#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 2', act:()=> goFloor('tower_2', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 4', act:()=> goFloor('tower_4', 'down'), when:()=> r5TowerBeaten(3) },
      { x:5, y:2, sprite:'ghost_disciple2', icon:'👻', verb:'Challenge', act:()=> r5TowerChallenge(3), when:()=> !r5TowerBeaten(3) },
      { x:3, y:2, sprite:'ghost_disciple2', icon:'👻', verb:'Talk', act:()=> r5TowerTalk(3), when:()=> r5TowerBeaten(3) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_4: { key:'tower_4', region:5, tower:4, title:'The Tower · Floor 4', bg:'region5', music:'zone_tower', art:'tower_psychic',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#..o...o..#","#.........#","#..o...o..#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 3', act:()=> goFloor('tower_3', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 5', act:()=> goFloor('tower_5', 'down'), when:()=> r5TowerBeaten(4) },
      { x:5, y:2, sprite:'psychic_disciple2', icon:'🔮', verb:'Challenge', act:()=> r5TowerChallenge(4), when:()=> !r5TowerBeaten(4) },
      { x:3, y:2, sprite:'psychic_disciple2', icon:'🔮', verb:'Talk', act:()=> r5TowerTalk(4), when:()=> r5TowerBeaten(4) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_5: { key:'tower_5', region:5, tower:5, title:'The Tower · Floor 5', bg:'region5', music:'zone_tower', art:'tower_ghost',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#...*.*...#","#.........#","#...*.*...#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 4', act:()=> goFloor('tower_4', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 6', act:()=> goFloor('tower_6', 'down'), when:()=> r5TowerBeaten(5) },
      { x:5, y:2, sprite:'ghost_disciple3', icon:'👻', verb:'Challenge', act:()=> r5TowerChallenge(5), when:()=> !r5TowerBeaten(5) },
      { x:3, y:2, sprite:'ghost_disciple3', icon:'👻', verb:'Talk', act:()=> r5TowerTalk(5), when:()=> r5TowerBeaten(5) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_6: { key:'tower_6', region:5, tower:6, title:'The Tower · Floor 6', bg:'region5', music:'zone_tower', art:'tower_psychic',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#..o...o..#","#.........#","#..o...o..#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 5', act:()=> goFloor('tower_5', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 7', act:()=> goFloor('tower_7', 'down'), when:()=> r5TowerBeaten(6) },
      { x:5, y:2, sprite:'psychic_disciple3', icon:'🔮', verb:'Challenge', act:()=> r5TowerChallenge(6), when:()=> !r5TowerBeaten(6) },
      { x:3, y:2, sprite:'psychic_disciple3', icon:'🔮', verb:'Talk', act:()=> r5TowerTalk(6), when:()=> r5TowerBeaten(6) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_7: { key:'tower_7', region:5, tower:7, title:'The Tower · Floor 7', bg:'region5', music:'zone_tower', art:'tower_ghost',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#...*.*...#","#.........#","#...*.*...#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 6', act:()=> goFloor('tower_6', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 8', act:()=> goFloor('tower_8', 'down'), when:()=> r5TowerBeaten(7) },
      { x:5, y:2, sprite:'ghost_disciple4', icon:'👻', verb:'Challenge', act:()=> r5TowerChallenge(7), when:()=> !r5TowerBeaten(7) },
      { x:3, y:2, sprite:'ghost_disciple4', icon:'👻', verb:'Talk', act:()=> r5TowerTalk(7), when:()=> r5TowerBeaten(7) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_8: { key:'tower_8', region:5, tower:8, title:'The Tower · Floor 8', bg:'region5', music:'zone_tower', art:'tower_psychic',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#..o...o..#","#.........#","#..o...o..#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 7', act:()=> goFloor('tower_7', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 9', act:()=> goFloor('tower_9', 'down'), when:()=> r5TowerBeaten(8) },
      { x:5, y:2, sprite:'psychic_disciple4', icon:'🔮', verb:'Challenge', act:()=> r5TowerChallenge(8), when:()=> !r5TowerBeaten(8) },
      { x:3, y:2, sprite:'psychic_disciple4', icon:'🔮', verb:'Talk', act:()=> r5TowerTalk(8), when:()=> r5TowerBeaten(8) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_9: { key:'tower_9', region:5, tower:9, title:'The Tower · Floor 9', bg:'region5', music:'zone_tower', art:'tower_ghost',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#...*.*...#","#.........#","#...*.*...#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 8', act:()=> goFloor('tower_8', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 10', act:()=> goFloor('tower_10', 'down'), when:()=> r5TowerBeaten(9) },
      { x:5, y:2, sprite:'ghost_disciple5', icon:'👻', verb:'Challenge', act:()=> r5TowerChallenge(9), when:()=> !r5TowerBeaten(9) },
      { x:3, y:2, sprite:'ghost_disciple5', icon:'👻', verb:'Talk', act:()=> r5TowerTalk(9), when:()=> r5TowerBeaten(9) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_10: { key:'tower_10', region:5, tower:10, title:'The Tower · Floor 10', bg:'region5', music:'zone_tower', art:'tower_psychic',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#..o...o..#","#.........#","#..o...o..#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 9', act:()=> goFloor('tower_9', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 11', act:()=> goFloor('tower_11', 'down'), when:()=> r5TowerBeaten(10) },
      { x:5, y:2, sprite:'psychic_disciple5', icon:'🔮', verb:'Challenge', act:()=> r5TowerChallenge(10), when:()=> !r5TowerBeaten(10) },
      { x:3, y:2, sprite:'psychic_disciple5', icon:'🔮', verb:'Talk', act:()=> r5TowerTalk(10), when:()=> r5TowerBeaten(10) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_11: { key:'tower_11', region:5, tower:11, title:'The Tower · Floor 11', bg:'region5', music:'zone_tower', art:'tower_ghost',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#...*.*...#","#.........#","#...*.*...#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 10', act:()=> goFloor('tower_10', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 12', act:()=> goFloor('tower_12', 'down'), when:()=> r5TowerBeaten(11) },
      { x:5, y:2, sprite:'ghost_disciple6', icon:'👻', verb:'Challenge', act:()=> r5TowerChallenge(11), when:()=> !r5TowerBeaten(11) },
      { x:3, y:2, sprite:'ghost_disciple6', icon:'👻', verb:'Talk', act:()=> r5TowerTalk(11), when:()=> r5TowerBeaten(11) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_12: { key:'tower_12', region:5, tower:12, title:'The Tower · Floor 12', bg:'region5', music:'zone_tower', art:'tower_psychic',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9], up:[5,1] },
    rows:["###########","#####.#####","###.....###","##.......##","#..o...o..#","#.........#","#..o...o..#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 11', act:()=> goFloor('tower_11', 'up') },
      { x:5, y:1, walk:true, verb:'Up', where:'Floor 13', act:()=> goFloor('tower_13', 'down'), when:()=> r5TowerBeaten(12) },
      { x:5, y:2, sprite:'psychic_master', icon:'🔮', verb:'Challenge', act:()=> r5TowerChallenge(12), when:()=> !r5TowerBeaten(12) },
      { x:3, y:2, sprite:'psychic_master', icon:'🔮', verb:'Talk', act:()=> r5TowerTalk(12), when:()=> r5TowerBeaten(12) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
  tower_13: { key:'tower_13', region:5, tower:13, title:'The Tower · Floor 13', bg:'region5', music:'zone_tower', art:'tower_top', artAlt:'tower_ghost',
    bx:0, by:0, bs:1/32, nat:[11*32, 11*32], spawn:[5,9], arrive:{ down:[5,9] },
    rows:["###########","#####.#####","###.....###","##.......##","#...*.*...#","#.........#","#...*.*...#","##.......##","###.....###","#####.#####","###########"],
    things:[
      { x:5, y:9, walk:true, verb:'Down', where:'Floor 12', act:()=> goFloor('tower_12', 'up') },
      { x:5, y:1, walk:true, verb:'Window', act:()=> r5TowerWindow(), when:()=> r5TowerBeaten(13) },
      { x:5, y:2, sprite:'ghost_master', icon:'👻', verb:'Challenge', act:()=> r5TowerChallenge(13), when:()=> !r5TowerBeaten(13) },
      { x:3, y:2, sprite:'ghost_master', icon:'👻', verb:'Talk', act:()=> r5TowerTalk(13), when:()=> r5TowerBeaten(13) },
    ],
    paint:(d)=> paintTower(d), onRender:(world, d)=> r5TowerRender(world, d), ghostChat:(id)=> r5GhostChat(id) },
};
[...R5_FLOORS, ...R5_FLOORS_T2].forEach(id=>{ R5_DECKS[id].prizeLines = CATA_PRIZE_LINES; });
/* Tier 2's wild tables: all thirteen on every floor (2.90). (3.18) The top
   tier's: the hill's psychics. */
Object.values(R5_DECKS).forEach(d=>{
  const w = d.stealth && d.stealth.wild;
  if(w && w.t2 && !w.table) w.table = r5T2Table(w.more);
  if(w && w.t3 && !w.table) w.table = r5T3Table(w.more);
});
R5_FLOORS_T3.forEach(id=>{ R5_DECKS[id].prizeLines = CATA_PRIZE_LINES; });
/* Look for any floor's own painting now, so it is ready the first time the
   floor is shown (cataPainting, 14-stealth.js). */
Object.values(R5_DECKS).forEach(d=>{ if(d.art && d.paint) cataPainting(d); if(d.artAlt) cataPainting({ art:d.artAlt }); });
/* The side rooms, floor by floor: [room 1, room 2]. */
const R5_ROOMS = {
  cata_landing: ['cata_landing_r1', 'cata_landing_r2'],
  cata_cistern: ['cata_cistern_r1', 'cata_cistern_r2'],
  cata_bones:   ['cata_bones_r1',   'cata_bones_r2'],
  cata_stair:   ['cata_stair_r1',   'cata_stair_r2'],
};
const R5_ALL_ROOMS = Object.values(R5_ROOMS).flat();
/* The hill's own dead (2.95): every Ghost in the first tier's wild tables,
   its floors and side rooms. The ghosts that pour up the Garrison the night
   the dead rise, and haunt the Family's men (14-stealth.js), are these. (2.97:
   the Tailed Cats that live down there among them are not dead; 3.14: the
   Tapirs have left, and the Goblin and Jax's Firehound are among the dead;
   3.35: the Tailed Cats have gone up under the villa, with the psychics.) */
const R5_HILL_GHOSTS = [...new Set([...R5_FLOORS, ...R5_ALL_ROOMS].flatMap(id=>{
  const w = R5_DECKS[id] && R5_DECKS[id].stealth && R5_DECKS[id].stealth.wild;
  return ((w && w.table) || []).map(t=> t.sp);
}))].filter(sp=> ((SPECIES[sp] || {}).types || []).includes('Ghost'));
/* The disguise (2.91), wherever it works — every catacomb floor and side
   room, the church, Ugo's and the Old Town's streets: put on or taken off
   from the button beside Party (13-walkmap.js), it makes you a junior
   soldato to look at, and any soldato beside you can be talked to. */
Object.values(R5_DECKS).forEach(d=>{
  if(d.key === 'harbour') return;
  d.youArt = r5YouArt; d.sideAct = r5SideAct; d.nearActs = r5NearActs;
});
Object.assign(DECKS, R5_DECKS);

/* ============================================================
   THE FAMILY, UNDERGROUND
   Soldatos bring two waves, the capos three. Every enemy ghost in a
   catacomb fight arrives lurking. The Goblin Knights swing their Max.
   Beaten soldatos and lookouts are back at their posts the next calendar
   day (stealthBeaten, 14-stealth.js): the Family regroups.
   ============================================================ */
const R5_SOLDATO_SHOUTS = [
  `<b>"Hey! You — in the light!"</b>`,
  `<b>"Oi! Who let a kid down here?"</b>`,
  `<b>"Intruder! Stay right where you are!"</b>`,
  `<b>"Got you. The Capo will want a word about this."</b>`,
];
const R5_SOLDATO_BEATEN = [
  `He drops his lantern and runs for the stairs.<br><br><i>He will not be back on watch today.</i>`,
  `<b>"This is not worth what they pay me."</b><br><br><i>He will not be back on watch today.</i>`,
  `He backs away into the dark, holding his lantern out in front of him like a shield.<br><br><i>He will not be back on watch today.</i>`,
];
function r5Pick(list){ return list[Math.floor(Math.random() * list.length)]; }
/* A soldato's two waves: `lv` for the first, one higher for the second.
   Species by name, or { species, ai } for one that fights its own way. */
function r5Squad(lv, w1, w2, ai){
  const mk = (list, l)=> list.map(sp=> typeof sp === 'string' ? { species:sp, level:l } : Object.assign({ level:l }, sp));
  return { label:'Soldato', ai: ai || ['power1','power2'], waves:[ mk(w1, lv), mk(w2, lv + 1) ] };
}
const R5_KNIGHT = { species:'goblin_knight', ai:'maxer' };
const R5_ROSTERS = {
  gate: { label:'Soldato', ai:['power1','power2'], waves:[
    [{species:'goblin',level:80},{species:'squid',level:80}],
    [{species:'sumo',level:81},{species:'ghost_starter',level:81}] ] },
  landing_a: { label:'Soldato', ai:['power1','power2'], waves:[
    [{species:'crow',level:80},{species:'ghost',level:80}],
    [{species:'goblin',level:81},{species:'cyclops',level:81}] ] },
  landing_b: { label:'Soldato', ai:['power1','power2'], waves:[
    [{species:'bat',level:80},{species:'golem',level:80},{species:'crow',level:80}],
    [{species:'squid',level:82},{species:'ghost',level:82}] ] },
  cistern_a: { label:'Soldato', ai:['power1','power2'], waves:[
    [{species:'ghost',level:82},{species:'ghost_flame',level:82}],
    [{species:'goblin',level:83},{species:'squid',level:83}] ] },
  cistern_b: { label:'Soldato', ai:['power2','best'], waves:[
    [{species:'crow',level:82},{species:'cyclops',level:82},{species:'ghost',level:82}],
    [{species:'goblin_knight',level:83,ai:'maxer'}] ] },
  stair_a: { label:'Soldato', ai:['power1','power2'], waves:[
    [{species:'cyclops',level:84},{species:'ghost_flame',level:84}],
    [{species:'goblin_knight',level:85,ai:'maxer'},{species:'ghost',level:85}] ] },
  stair_b: { label:'Soldato', ai:['power1','best'], waves:[
    [{species:'crow',level:84},{species:'ghost',level:84},{species:'ghost',level:84}],
    [{species:'puppet',level:86}] ] },
  /* 2.72: the floors' new men, and the side rooms'. A lookout is a soldato
     standing still; he fights the same way. */
  landing_c: r5Squad(82, ['ghost','ghost_flame'], ['sumo','crow']),
  landing_d: r5Squad(82, ['cyclops','bat'], ['goblin','ghost']),
  cistern_c: r5Squad(83, ['ghost','cyclops'], ['squid','ghost_flame']),
  cistern_l: r5Squad(83, ['crow','ghost_flame','bat'], ['goblin','sumo']),
  stair_c:   r5Squad(85, ['ghost','crow','cyclops'], ['goblin','squid']),
  stair_l:   r5Squad(85, ['ghost_flame','ghost'], [R5_KNIGHT,'ghost'], ['power1','best']),
  /* the Counting Room and the Old Ossuary, off the Landing */
  lr1_a: r5Squad(83, ['crow','ghost','cyclops'], ['squid','goblin']),
  lr1_b: r5Squad(83, ['ghost_flame','bat'], ['sumo','ghost_starter']),
  lr1_c: r5Squad(83, ['golem','ghost','crow'], ['puppet']),
  lr1_l: r5Squad(84, ['ghost','cyclops'], [R5_KNIGHT,'ghost']),
  lr2_a: r5Squad(85, ['ghost','crow','ghost_flame'], ['goblin','squid']),
  lr2_b: r5Squad(85, ['cyclops','bat','ghost'], ['puppet','crow']),
  lr2_c: r5Squad(85, ['ghost_flame','ghost'], [R5_KNIGHT,'cyclops']),
  lr2_l: r5Squad(86, ['crow','crow','ghost'], ['horned_lynx'], ['power2','best']),
  /* the Pump Room and the Drowned Chapel, off the Cistern */
  cr1_a: r5Squad(86, ['ghost','ghost','crow'], ['squid','goblin']),
  cr1_b: r5Squad(86, ['cyclops','ghost_flame'], ['puppet','ghost']),
  cr1_c: r5Squad(86, ['bat','crow','cyclops'], ['sumo','ghost_starter']),
  cr1_l: r5Squad(86, ['ghost_flame','ghost'], [R5_KNIGHT], ['power2','best']),
  cr2_a: r5Squad(88, ['ghost','crow','ghost_flame'], ['goblin','puppet'], ['power2','best']),
  cr2_b: r5Squad(88, ['cyclops','ghost','ghost'], ['squid','horned_lynx'], ['power2','best']),
  cr2_c: r5Squad(88, ['crow','bat','ghost_flame'], [R5_KNIGHT,'puppet'], ['power2','best']),
  cr2_l: r5Squad(88, ['ghost','cyclops','crow'], ['psychic_starter'], ['power2','best']),
  /* the Charnel House and the Skull Wall, off the Bone Halls */
  br1_a: r5Squad(88, ['ghost','ghost','cyclops'], ['goblin','squid'], ['power2','best']),
  br1_b: r5Squad(88, ['crow','ghost_flame','ghost'], ['puppet','sumo'], ['power2','best']),
  br1_c: r5Squad(88, ['cyclops','crow'], [R5_KNIGHT,'ghost'], ['power2','best']),
  br1_l: r5Squad(88, ['ghost_flame','ghost_flame','ghost'], ['horned_lynx','puppet'], ['power2','best']),
  br2_a: r5Squad(90, ['ghost','crow','cyclops'], ['goblin','puppet'], ['power2','best']),
  br2_b: r5Squad(90, ['ghost_flame','ghost','ghost'], [R5_KNIGHT,'squid'], ['power2','best']),
  br2_c: r5Squad(90, ['crow','crow','cyclops'], ['horned_lynx','ghost'], ['power2','best']),
  br2_l: r5Squad(90, ['ghost','ghost_flame','crow'], ['ghost_starter'], ['power2','best']),
  /* the Barracks and the Armoury, off the Long Stair */
  sr1_a: r5Squad(90, ['cyclops','ghost_flame','ghost'], ['goblin','sumo'], ['power2','best']),
  sr1_b: r5Squad(90, ['crow','ghost','ghost'], ['puppet','squid'], ['power2','best']),
  sr1_c: r5Squad(90, ['ghost_flame','cyclops'], [R5_KNIGHT,'horned_lynx'], ['power2','best']),
  sr1_l: r5Squad(90, ['crow','crow','ghost'], ['psychic_starter'], ['power2','best']),
  sr2_a: r5Squad(92, ['ghost','cyclops','ghost_flame'], ['goblin','puppet'], ['best','best']),
  sr2_b: r5Squad(92, ['crow','ghost_flame','ghost'], [R5_KNIGHT,'squid'], ['best','best']),
  sr2_c: r5Squad(92, ['cyclops','ghost','crow'], ['horned_lynx','puppet'], ['best','best']),
  sr2_l: r5Squad(92, ['ghost','ghost','ghost_flame'], ['ghost_starter'], ['best','best']),
  capo_black: { label:'Black Capo', ai:['power2','best','best'],
    shout:`<b>"Well, well. The kid from the caverns."</b><br><br>He does not hurry. He never does.<br><br>` +
          `<b>"I told you my people don't forget a face."</b>`,
    onBeaten:()=> r5CapoBlackBeaten(),
    waves:[
    [{species:'ghost',level:84},{species:'crow',level:84},{species:'cyclops',level:84}],
    [{species:'goblin',level:85},{species:'puppet',level:85},{species:'squid',level:85}],
    [{species:'ghost_starter',level:87}] ] },
  capo_purple: { label:'Purple Capo', ai:['power2','best','best'],
    shout:`<b>"YOU."</b> He laughs, short and sharp.<br><br>` +
          `<b>"I told you to come and challenge the boss, if you dared. I never thought you'd be daft enough to actually come."</b>`,
    onBeaten:()=> r5CapoPurpleBeaten(),
    waves:[
    [{species:'ghost',level:86},{species:'crow',level:86},{species:'ghost_flame',level:86}],
    [{species:'goblin_knight',level:87,ai:'maxer'},{species:'puppet',level:87},{species:'horned_lynx',level:87}],
    [{species:'psychic_starter',level:89}] ] },

  /* Tier 2 (2.88), under the Old Town. Down here the Family fights with the
     physical monsters it has taken for its pit — a Ghost of yours beats
     them — and keeps a Squid or a Fox for anyone who brings one. Only the
     thirteen that live here (R5_T2_WILD): no Otters or Ninjas (2.90). */
  quarry_a:  r5Squad(94, ['strongman','boxer'], ['sumo','squid']),
  quarry_b:  r5Squad(94, ['fighting_ape','kicker','goblin'], ['strongman','squid']),
  quarry_c:  r5Squad(95, ['judo_blue','judo_red'], ['lizardape','ghost'], ['power2','best']),
  quarry_d:  r5Squad(95, ['spinner','boxer','crow'], ['tricerarmor'], ['power2','best']),
  quarry_l:  r5Squad(96, ['strongman','fighting_ape'], ['sumo','psychic_starter'], ['power2','best']),
  quarry_m:  r5Squad(94, ['kicker','spinner'], ['sumo','goblin']),
  cellars_a: r5Squad(96, ['weasel','yoga','ghost'], ['lizardape','squid'], ['power2','best']),
  cellars_b: r5Squad(96, ['boxer','kicker'], ['sumo','goblin'], ['power2','best']),
  cellars_c: r5Squad(97, ['judo_red','spinner','crow'], ['sumo','squid'], ['power2','best']),
  cellars_d: r5Squad(97, ['fighting_ape','strongman'], ['lizardape','puppet'], ['power2','best']),
  cellars_l: r5Squad(98, ['yoga','weasel','ghost_flame'], ['tricerarmor','psychic_starter'], ['best','best']),
  pit_a:     r5Squad(98, ['boxer','kicker','spinner'], ['sumo','squid'], ['best','best']),
  pit_b:     r5Squad(98, ['judo_blue','judo_red'], ['tricerarmor','goblin'], ['best','best']),
  pit_c:     r5Squad(99, ['fighting_ape','strongman','weasel'], ['lizardape','sumo'], ['best','best']),
  pit_l:     r5Squad(99, ['yoga','boxer'], ['tricerarmor','psychic_starter'], ['best','best']),
  /* (2.95) the Consigliere — the pit's master (he was the Grey Capo) */
  consigliere: { label:'Consigliere', ai:['power2','best','best'],
    /* (2.90) by the time you can fight him, you have run through his pit once */
    get shout(){
      return (typeof r5 === 'function' && (r5().oldTown || r5().rush))
        ? `<b>"Well now. You're the one who ran through my pit the night the dead got loose."</b><br><br>He spreads his arms to the empty benches.<br><br>` +
          `<b>"Nobody walks through here for free twice, kid. Beat my champions — in front of everybody."</b>`
        : `<b>"Well now. A new face in my pit."</b><br><br>He spreads his arms to the empty benches.<br><br>` +
          `<b>"Nobody walks through here for free, kid. You want to leave? Beat my champions — in front of everybody."</b>`;
    },
    onBeaten:()=> r5ConsigliereBeaten(),
    waves:[
    [{species:'sumo',level:100},{species:'judo_red',level:100},{species:'strongman',level:100}],
    [{species:'physical_starter',level:100},{species:'lizardape',level:100},{species:'squid',level:100}],
    [{species:'tricerarmor',level:100}] ] },   // 2.99: 101 and 103 before — none of theirs past 100

  /* (3.18) Under the villa: the Padrino's own men, with the psychics the
     exorcists keep — a Physical monster of yours beats them; two waves, at
     99 and 100. They think about their second wave (ai 'smart', as the
     tower's psychics do). */
  deep_a:  r5Squad(99, ['leopard','tapir','quetzal'], ['ram','psychic_starter'], ['power2','smart']),
  deep_b:  r5Squad(99, ['puffball','unicorn'], ['seadragon','squid'], ['power2','smart']),
  deep_c:  r5Squad(99, ['polygon','nurse','tapir'], ['steelcrab','tailed_cat'], ['power2','smart']),
  deep_d:  r5Squad(99, ['hermit_sloth','leopard'], ['firefox','moon_swan'], ['power2','smart']),
  deep_l:  r5Squad(99, ['quetzal','unicorn','puffball'], ['mime'], ['power2','smart']),
  watch_a: r5Squad(99, ['tapir','leopard','polygon'], ['hydra','squid'], ['smart','smart']),
  watch_b: r5Squad(99, ['nurse','hermit_sloth'], ['plasma_manta','sylph'], ['smart','smart']),
  /* The Watch's three chiefs, a third time (the capos) and a second (the
     Consigliere): three waves each at 100, the last crowned. Beaten, each
     unlocks his lock on the gate and goes down to his master (r5WatchBeaten). */
  watch_black: { label:'Black Capo', ai:['best','best','best'],
    shout:`<b>"Well, well. The kid from the caverns — a third time."</b><br><br>He does not hurry. He never does.<br><br>` +
          `<b>"My people don't forget a face. Neither do I."</b>`,
    onBeaten:()=> r5WatchBeaten('black'),
    waves:[
    [{species:'goblin_knight',level:100,ai:'maxer'},{species:'puppet',level:100},{species:'horned_lynx',level:100}],
    [{species:'firehound',level:100},{species:'goblin',level:100},{species:'squid',level:100}],
    [{species:'ghost_starter',level:100,crowned:true,supplements:10}] ] },
  watch_purple: { label:'Purple Capo', ai:['best','best','best'],
    shout:`<b>"YOU. A third time."</b> He cracks his knuckles, one at a time.<br><br><b>"Third time lucky — for me."</b>`,
    onBeaten:()=> r5WatchBeaten('purple'),
    waves:[
    [{species:'ghost_flame',level:100},{species:'tailed_cat',level:100},{species:'mime',level:100}],
    [{species:'goblin_knight',level:100,ai:'maxer'},{species:'hydra',level:100},{species:'firefox',level:100}],
    [{species:'psychic_starter',level:100,crowned:true,supplements:10}] ] },
  watch_consigliere: { label:'Consigliere', ai:['best','best','best'],
    shout:`<b>"Well now. The kid from my pit."</b> He folds his hands.<br><br>` +
          `<b>"I advised the Padrino that nothing happened down there. He did not believe me. Shall we make it true this time?"</b>`,
    onBeaten:()=> r5WatchBeaten('consigliere'),
    waves:[
    [{species:'sumo',level:100},{species:'judo_red',level:100},{species:'strongman',level:100}],
    [{species:'lizardape',level:100},{species:'tricerarmor',level:100},{species:'steelcrab',level:100}],
    [{species:'physical_starter',level:100,crowned:true,supplements:10}] ] },
};
/* Soldatos shout and give up in their own words; filled in once, here. */
Object.values(R5_ROSTERS).forEach(r=>{
  if(r.label !== 'Soldato') return;
  Object.defineProperty(r, 'shout', { get:()=> r5Pick(R5_SOLDATO_SHOUTS) });
  Object.defineProperty(r, 'beaten', { get:()=> r5Pick(R5_SOLDATO_BEATEN) });
});

/* ============================================================
   GETTING ABOUT
   ============================================================ */
/* Onto a floor (or the harbour) at one of its named stairs — or, given `at`
   ([x, y]), on that tile, having come in by `where` (a resume, 2.90). A
   catacomb floor entered this way starts over: guards back at their posts. */
function goFloor(id, where, at){
  const d = DECKS[id]; if(!d) return;
  const w = walkState();
  const a = at || (d.arrive && d.arrive[where]) || d.spawn;
  walkTeardown();
  w.at = w.at || {}; w.at[id] = { x:a[0], y:a[1] }; w.face = 'd';
  w.ghostAt = w.ghostAt || {}; w.ghostAt[id] = { x:a[0], y:a[1] };
  ui.walkFresh = false;
  if(r5IsCata(d)){
    ui.stealthFresh = true;
    ui.floorEntry = ui.floorEntry || {}; ui.floorEntry[id] = where;
    ui.currentZone = r5Zone('catacombs') || ui.currentZone;
    const r = r5();
    if(!r.reached.includes(id)) r.reached.push(id);
    r5NoteSpot(id, a[0], a[1], where);
    saveProfile();
  } else if(id === 'harbour'){
    ui.currentZone = r5Zone('harbour') || ui.currentZone;
  } else if(id === 'church' || id === 'tailor' || id === 'old_town'){
    if(d.stealth) ui.stealthFresh = true;              // the streets' men back on their rounds (2.91)
    ui.currentZone = r5Zone('old_town') || ui.currentZone;
  } else if(id === 'hilltop' || d.tower){
    if(d.stealth) ui.stealthFresh = true;              // (2.92)
    ui.currentZone = r5Zone('hilltop') || ui.currentZone;
  } else if(d.house){                                  // (3.03) a room in the town: its own part of town
    ui.currentZone = r5Zone(d.zone) || ui.currentZone;
  } else if(d.vault){                                  // (3.19) the vault, under the crypt: lit, nobody on watch
    ui.currentZone = r5Zone('catacombs') || ui.currentZone;
    const r = r5();
    if(!r.reached.includes(id)){ r.reached.push(id); saveProfile(); }
  }
  ui.returnDeck = null;
  w.busy = true;
  tileWipe(()=>{ w.busy = false; go(id); });
}
function r5ToHarbour(){ goFloor('harbour', 'cave'); }
/* A catacomb floor or side room — walked in the dark — rather than the Old
   Town's lit streets (2.91), which have men on watch too. */
function r5IsCata(d){ return !!(d && d.stealth && d.stealth.kind !== 'town'); }

/* ============================================================
   WHERE YOU LEFT OFF (2.90)
   The catacombs remember the last place you stood in them — floor or side
   room, and the way you came in — in the save (r5().lastAt), so coming back
   carries on from there: the first card under Explore → The Catacombs, or the
   sea cave. Every man is back at his post when you do; a spot his lantern
   would find in his first beats, or one you were caught or marched out from,
   gives way to the stair you came in by.
   ============================================================ */
function r5NoteSpot(id, x, y, entry){
  const r = r5(), d = DECKS[id];
  if(!r5IsCata(d)) return;
  const was = r.lastAt && r.lastAt.id === id ? r.lastAt.entry : null;
  r.lastAt = { id, x, y, entry: entry || was || d.entry || 'top' };
}
/* Every step in the dark (stealthStep): noted at once, saved now and then. */
function r5NoteStep(d, p){
  r5NoteSpot(d.key, p.x, p.y, (ui.floorEntry || {})[d.key]);
  r5WispStep(d, p);                              // (3.02) come close to the little light, and it goes
  r5HillStep(d, p);                              // (3.04) into the villa's forecourt: the Monkey King
  r5MaliceStep(d, p);                            // (3.17) now and then, the cold under the island
  r5LeadStep(d, p);                              // (3.18) under the villa: Nino waits, or goes on ahead
  const now = Date.now();
  if(now - (ui.r5SavedAt || 0) > 4000){ ui.r5SavedAt = now; saveProfile(); }
}
/* Caught, or marched out: next time, the stair you came in by. */
function r5BackToEntry(id){
  const d = DECKS[id]; if(!d) return;
  const entry = ((ui.floorEntry || {})[id]) || (r5().lastAt && r5().lastAt.id === id && r5().lastAt.entry) || d.entry || 'top';
  const a = (d.arrive && d.arrive[entry]) || d.spawn;
  r5NoteSpot(id, a[0], a[1], entry);
}
function r5LastSpot(){
  const r = r5(), a = r.lastAt;
  if(!a || !r5IsCata(DECKS[a.id])) return null;
  if(DECKS[a.id].tier === 2 && !r5Tier2Open()) return null;
  return a;
}
/* Can you be put down on this tile with every man back at his post? Not in
   a wall, not where one of them stands, and not in his light in his first
   few beats. */
function r5SafeSpot(d, a){
  if(!d.rows[a.y] || a.x < 0 || a.x >= d.rows[0].length || wSolid(d, a.x, a.y)) return false;
  if(stealthRush(d)) return true;
  const beaten = stealthBeaten(d.key);
  /* in disguise (2.91) a lantern finding you is nothing; only not on top of a man */
  const disguised = stealthDisguised(d);
  /* (3.00) a man fighting ghosts sees nothing either — but nobody lands on him */
  return !stealthOnWatch(d).filter(def=> !beaten.includes(def.id)).some(def=>{
    if(guardHaunted(d, def)){ const g0 = guardStart(def); return g0.x === a.x && g0.y === a.y; }
    const g = guardStart(def);
    if(disguised) return g.x === a.x && g.y === a.y;
    for(let beat = 0; beat < 3; beat++){
      if((g.x === a.x && g.y === a.y) || guardLight(d, g, def).has(a.x + ',' + a.y)) return true;
      guardAdvance(d, g, def);
    }
    return false;
  });
}
function r5Resume(a){
  a = a || r5LastSpot();
  if(!a) return goFloor('cata_landing', 'cave');
  const d = DECKS[a.id];
  const entry = a.entry || d.entry || 'top';
  return goFloor(a.id, entry, r5SafeSpot(d, a) ? [a.x, a.y] : null);
}
/* The sea cave, from the harbour: the Landing is just inside — or, if you
   left off further up, the Whalelord can take you back there. */
async function r5CaveIn(){
  const last = r5LastSpot();
  if(!last || last.id === 'cata_landing') return goFloor('cata_landing', 'cave');
  const yes = await r5Ask([faceMon('whalelord')], whaleName(),
    `<b>"We left off in ${escapeHtml(DECKS[last.id].title)}. I remember the way back up, if you want it."</b>`,
    '🕯️ Carry on', 'The Landing');
  return yes ? r5Resume(last) : goFloor('cata_landing', 'cave');
}
/* Explore → The Catacombs: carry on where you left off, or pick a floor. */
function renderCatacombs(){
  const r = r5();
  /* Tier 2's floors once reached — or, for the developer, all of them, to
     try them before the story opens the gate (2.88). */
  const lower = R5_FLOORS.filter(f=> r.reached.includes(f));
  const floors = (lower.length ? lower : ['cata_landing'])
    .concat(R5_FLOORS_T2.filter(f=> r.reached.includes(f) || (typeof isDev === 'function' && isDev())))
    .concat(R5_FLOORS_T3.filter(f=> r.reached.includes(f)));                // (3.18) under the villa, once reached
  const enter = f=> goFloor(f, DECKS[f].entry || 'top');
  const last = r5LastSpot();
  if(floors.length <= 1){ ui.stealthFresh = true; return last ? r5Resume(last) : enter(floors[0] || 'cata_landing'); }
  setScreenBg('catacombs');
  playMusicChain(['zone_catacombs', 'region5', 'region']);
  $('#brandSub').textContent = 'The Catacombs';
  /* a floor's watch counts its side rooms too, once you have found them */
  const onWatch = id=> DECKS[id].stealth.kind === 'evade' ? 0
    : stealthOnWatch(DECKS[id]).filter(g=> !stealthBeaten(id).includes(g.id)).length;
  const note = id=>{
    const d = DECKS[id];
    const rooms = (R5_ROOMS[id] || []).filter(x=> r.reached.includes(x));
    const left = onWatch(id) + rooms.reduce((n, x)=> n + onWatch(x), 0);
    const where = rooms.length ? ` (and ${rooms.length} side room${rooms.length > 1 ? 's' : ''})` : '';
    if(d.stealth.kind === 'evade')
      return 'Too many to fight. Do not be seen.' + (rooms.length ? ` ${left} on watch in the side rooms.` : '');
    return left ? `${left} of the Family on watch${where}` : `Nobody left on watch today${where}`;
  };
  const all = [...R5_FLOORS, ...R5_FLOORS_T2, ...R5_FLOORS_T3];
  const card = f=> `
        <div class="challenge-card" data-floor="${f}">
          <div class="region-num">${all.indexOf(f) + 1}</div>
          <div style="flex:1;">
            <div class="cc-title">${escapeHtml(DECKS[f].title)}</div>
            <div class="cc-desc">${escapeHtml(note(f))}</div>
          </div>
        </div>`;
  const upper = floors.filter(f=> R5_FLOORS_T2.includes(f));
  const top = floors.filter(f=> R5_FLOORS_T3.includes(f));
  const devOnly = upper.length && !r5().tier2Open && !upper.some(f=> r.reached.includes(f));
  /* where you left off, first (2.90) */
  const lastRoom = last && DECKS[last.id].room;
  const carry = last ? `
        <div class="challenge-card" id="carryOn" style="border:2px solid var(--jade, #3a8a6a);">
          <div class="region-num">🕯️</div>
          <div style="flex:1;">
            <div class="cc-title">Carry on</div>
            <div class="cc-desc">Back to where you left off — ${escapeHtml(DECKS[last.id].title)}${lastRoom ? ' (a side room)' : ''}</div>
          </div>
        </div>
        <div class="screen-sub" style="margin:6px 0 0;">Or start a floor from its stair:</div>` : '';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="screen-title">The Catacombs</div>
    <div class="screen-sub">${last ? 'Where to?' : 'Which floor?'}</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
      ${carry}
      ${floors.filter(f=> R5_FLOORS.includes(f)).map(card).join('')}
      ${upper.length ? `<div class="screen-sub" style="margin:6px 0 0;">Under the Old Town${devOnly ? ' <i>(developer: the gate is still shut)</i>' : ''}</div>` : ''}
      ${upper.map(card).join('')}
      ${top.length ? `<div class="screen-sub" style="margin:6px 0 0;">Under the villa</div>` : ''}
      ${top.map(card).join('')}
    </div>
    <button class="btn btn-ghost" id="returnBtn" style="margin-top:14px;">Return</button>`;
  $('#backBtn').addEventListener('click', ()=> go('explore'));
  $('#returnBtn').addEventListener('click', ()=> go('explore'));
  const co = $('#carryOn');
  if(co) co.addEventListener('click', ()=> r5Resume(last));
  screenEl.querySelectorAll('[data-floor]').forEach(c=> c.addEventListener('click', ()=> enter(c.dataset.floor)));
}
/* Explore → The Harbour: where you last stood in it (it is a big place),
   or the pier the first time. */
function renderHarbourZone(){
  const w = walkState();
  w.at = w.at || {};
  if(!r5().arrived || !w.at.harbour){ w.at.harbour = { x:4, y:37 }; w.face = 'u'; }
  ui.walkFresh = false;
  return renderWalkDeck('harbour');
}
/* First time into Region 5, from the region list: straight off the ship. */
function r5ArrivalDue(){ return !r5().arrived; }
function r5Arrive(){
  const w = walkState();
  w.at = w.at || {}; w.at.harbour = { x:4, y:37 }; w.face = 'u';
  w.ghostAt = w.ghostAt || {}; w.ghostAt.harbour = { x:4, y:38 };
  ui.walkFresh = false;
  ui.currentZone = r5Zone('harbour');
  go('harbour');
}
/* From the Vane Shear's chart room, once she is docked. */
async function r5GoAshore(){
  state.progress.currentRegion = 5;
  await saveProfile();
  if(r5ArrivalDue()) return r5Arrive();
  const w = walkState();
  w.at = w.at || {}; w.at.harbour = { x:4, y:37 }; w.face = 'u';
  ui.currentZone = r5Zone('harbour');
  ui.walkFresh = false;
  go('harbour');
}
/* Back aboard the ship. */
async function r5Board(){
  state.progress.currentRegion = 4;
  await saveProfile();
  walkTeardown();
  ui.walkFresh = true;
  ui.currentZone = (REGION_ZONES[4] || [])[0] || null;
  walkState().busy = true;
  tileWipe(()=>{ walkState().busy = false; go('weather_deck'); });
}

/* ============================================================
   ARRIVING
   ============================================================ */
/* (3.07) What he felt the moment he stepped ashore, said again on the first
   visit each day. */
const R5_HARBOUR_WORD = `<b>"My core. I can feel it, up there, at the very top of the town."</b><br><br>` +
                        `<b>"Jax brought it here. And he did not bring it for himself."</b>`;
function r5HarbourRender(world, d){
  if(!r5().arrived) return r5ArrivalScene();
  /* (3.20) the goodbye on the pier, if the app was closed before it */
  if(r5FarewellDue()) return setTimeout(()=>{ if(ui.screen === 'harbour' && r5FarewellDue() && !ui.sceneRunning && !document.querySelector('.scene-say')) r5FarewellStart(); }, 600);
  if(!ui.sceneRunning && r5DailyDue('first_harbour')) r5PlaceWord('harbour', 'first_harbour', R5_HARBOUR_WORD);
}
async function r5ArrivalScene(){
  if(ui.sceneRunning) return;
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  await sceneWait(700);
  const cap = faceNpc('ship_captain','⚓'), whale = faceMon('whalelord'), wn = whaleName();
  const me = facePlayer(), name = state.name || 'You';
  await sceneSay([cap], crewName('ship_captain'),
    `<b>"Cosa Nostia."</b> He says the name like something he has found in the bilges.<br><br>` +
    `<b>"This is as far as the Vane Shear goes, and further than I'd like."</b>`);
  await sceneSay([cap], crewName('ship_captain'),
    `<b>"We'll lie at anchor a while and take on stores. If you want the ship, come down to the pier. I'll be about."</b><br><br>` +
    `<b>"And mind yourself ashore. The Family runs this town. Every net, every boat, every crate on that quay."</b>`);
  ghostAlert();
  await sceneWait(600);
  await sceneSay([whale], wn, `<b>"It is here."</b>`);
  await sceneSay([whale], wn, R5_HARBOUR_WORD);
  await sceneSay([whale], wn,
    `<b>"There is something else, too. Under our feet. A great many somethings."</b><br><br>` +
    `<b>"This whole hill is full of the dead."</b>`);
  await sceneSay([me], name, `<b>"Then let's find a way up."</b>`);
  r5().arrived = true;
  r5().said.first_harbour = r5Day();             // (3.07) his word for the harbour: said, for today
  await saveProfile();
  w.busy = false;
  ui.sceneRunning = false;
  refreshWalk();
  toast('Talk to the people of the harbour.');
}

/* ============================================================
   THE HARBOUR'S PEOPLE
   Talking happens in the small window, with the town in view behind it.
   ============================================================ */
const R5_NAMES = {
  fishwife:'Signora Marta', boatwright:'Boatwright Beppe', net_mender:'Net-mender Lucia',
  shopkeeper5:'Fishmonger Sal', dockhand:'Dockhand Tino', lighthouse_keeper:'Keeper Aldo',
  station_master:'Station master Enzo',
  tailor:'Tailor Ugo',                    // the Old Town (2.91)
};
/* Two buttons instead of one: resolves true for the first. */
function r5Ask(faces, name, html, yes, no){
  sceneCss();
  return new Promise(done=>{
    const box = document.createElement('div');
    box.className = 'scene-say';
    box.innerHTML = `<div class="ss-faces">${(faces || []).join('')}</div>` +
      `<div class="ss-body"><div class="ss-name">${escapeHtml(name || '')}</div><div>${html}</div>` +
      `<div class="ss-go" style="gap:8px;"><button class="btn btn-ghost" data-a="0" style="width:auto;">${no || 'Leave'}</button>` +
      `<button class="btn btn-primary" data-a="1" style="width:auto;">${yes}</button></div></div>`;
    document.body.appendChild(box);
    box.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{ box.remove(); done(b.dataset.a === '1'); }));
  });
}
/* A line that is only ever said once. */
function r5Once(key){ const r = r5(); if(r.said[key]) return false; r.said[key] = true; saveProfile(); return true; }
/* (3.07) …and a line said once a day: the Whalelord's word as you step into
   a place (the designer: "Please make the special whalelord dialogue when we
   step in each place for the first time repeat once a day. It's such a waste
   of great dialogue to only have it once ever"). said[key] keeps the day it
   was last said (r5Day, 14-stealth.js); `true`, from a save before 3.07, was
   some other day. What happens once in the story (the night the dead rose,
   the ghost phoenix, the Monkey King…) stays r5Once. */
function r5Daily(key){ const r = r5(), t = r5Day(); if(r.said[key] === t) return false; r.said[key] = t; saveProfile(); return true; }
function r5DailyDue(key){ return r5().said[key] !== r5Day(); }
/* …said half a second after you come in, if you are still there and nobody
   else has started talking — and only then counted as said for the day
   (and `onSay` told, for anything said along with it). */
function r5PlaceWord(deck, key, lines, onSay){
  setTimeout(async ()=>{
    const w = walkState();
    if(ui.screen !== deck || w.deck !== deck || w.busy || ui.sceneRunning || !document.getElementById('walkWorld') ||
       document.querySelector('.scene-say') || document.body.classList.contains('in-scene')) return;
    if(!r5Daily(key)) return;
    if(onSay) onSay();
    for(const html of [].concat(lines)) await sceneSay([faceMon('whalelord')], whaleName(), html);
  }, 500);
}
/* Somebody with more than one thing to say says the next one each time. */
function r5Next(key, lines){
  const r = r5();
  r.said['n_' + key] = ((r.said['n_' + key] || 0) + 1) % lines.length;
  return lines[r.said['n_' + key]];
}
/* …the same, starting from the first (2.91): for lists whose first line is
   the one to say first. */
function r5Turn(key, lines){
  const r = r5(), i = (r.said['t_' + key] || 0) % lines.length;
  r.said['t_' + key] = i + 1;
  return lines[i];
}

function r5Captain(){
  const cap = faceNpc('ship_captain','⚓');
  const lines = [
    `<b>"Stores are coming aboard slow. Everything in this town goes through the Family first, and they take their time."</b>`,
    `<b>"Rhona has the laboratory running again. Says she wants specimens. I told her to ask you."</b>`,
    `<b>"If you want the ship, she's right there."</b> He nods at the Vane Shear, riding at anchor past the end of the pier.`,
  ];
  r5Ask([cap], crewName('ship_captain'), r5Next('captain', lines), '⚓ Go aboard', 'Stay ashore')
    .then(yes=>{ if(yes) r5Board(); });
}
/* The fisherman's wife. (Nonna is somebody else, up in the Old Town.)
   (3.03) In her own kitchen now, by the soup. */
async function r5Marta(){
  const face = faceNpc('fishwife', '👩');
  const first = r5Once('marta');
  const html = first
    ? `She turns round from the stove.<br><br><b>"Look at you. All bones and bruises."</b> ` +
      `She is small and round and not the least bit afraid of you.<br><br>` +
      `<b>"Sit. My Gino is out with the boats, and there is soup whether he is here or not."</b>`
    : r5Next('marta', [
        `<b>"Back again? Sit. Eat."</b>`,
        `<b>"The Family takes half of every catch, you know. Half! And they call it protection."</b><br><br>` +
        `She snorts. <b>"Protection from them, mostly."</b>`,
        `<b>"My Gino says the tunnels under the hill go all the way up to the Old Town. He says there are ghosts in them."</b><br><br>` +
        `<b>"He says a lot of things, my Gino."</b>`,
      ]);
  const yes = await r5Ask([face], R5_NAMES.fishwife, html, '🍲 Rest here', 'Not now');
  if(yes) leaveDeck('recover');
}
async function r5Boatwright(){
  const face = faceNpc('boatwright', '🪚'), whale = faceMon('whalelord'), wn = whaleName();
  const r = r5();
  if(!r.heardTunnels){
    await sceneSay([face], R5_NAMES.boatwright,
      `He is planing a keel and does not stop.<br><br>` +
      `<b>"A boy came in over the water three nights back. On a flying dragon, if you'll believe it. ` +
      `Didn't stop at the harbour. Straight up to the Old Town."</b>`);
    await sceneSay([whale], wn, `<b>"Jax."</b>`);
    await sceneSay([face], R5_NAMES.boatwright,
      `<b>"You want to get up there? There's three ways."</b> He counts them on fingers black with tar.<br><br>` +
      `<b>"The gate, and the Family won't open it for you. The funicular, and the Family owns it."</b><br><br>` +
      `<b>"And the old tunnels."</b> He points his plane down at the beach, at the cave in the rocks. ` +
      `<b>"The catacombs. The Family brings its boats in there at night. Nobody sane goes in after them."</b>`);
    r.heardTunnels = true;
    await saveProfile();
    await sceneSay([whale], wn, `<b>"Then it is lucky that I am not sane. I am dead."</b>`);
    return refreshWalkAll();
  }
  return sceneSay([face], R5_NAMES.boatwright, r5Next('boatwright', [
    `<b>"The catacombs run under the whole town, right up under the Old Town."</b><br><br>` +
    `<b>"There used to be a way in by the cliff steps. The Family barred it. Now it's the sea cave or nothing."</b>`,
    `<b>"This one?"</b> He slaps the hull. <b>"The Family's. They all are, in the end."</b>`,
    `<b>"If you do go in there, don't take a lantern. Lanterns are how the Family finds each other."</b>`,
  ]));
}
function r5NetMender(){
  return sceneSay([faceNpc('net_mender','🧶')], R5_NAMES.net_mender, r5Next('lucia', [
    `<b>"Don't stand in my light."</b> She squints at a net with more hole than net.<br><br>` +
    `<b>"Grandad says the dead in those tunnels don't sleep proper. They hide in the dark and jump at anything that comes by."</b>`,
    `<b>"The Family's men go in there every night, carrying crates. Every one of them has a lantern."</b><br><br>` +
    `<b>"They can't see a thing outside it. Grandad says that's the Family all over."</b>`,
    `<b>"If you're going in there, keep out of the light. That's all I know."</b>`,
  ]));
}
async function r5Fishmonger(){
  const yes = await r5Ask([faceNpc('shopkeeper5','🐟')], R5_NAMES.shopkeeper5, r5Next('sal', [
    `<b>"Fresh this morning! Well. This morning somewhere."</b><br><br><b>"Buy something. The Family takes their cut either way."</b>`,
    `<b>"Medals? I take medals. I take anything."</b> He lowers his voice. <b>"The Family takes the rest."</b>`,
  ]), '🛒 Shop', 'Leave');
  if(yes) leaveDeck('shop');
}
async function r5Dockhand(){
  const yes = await r5Ask([faceNpc('dockhand','📦')], R5_NAMES.dockhand, r5Turn('tino', [
    `<b>"Need something minding? I've got crates, and I don't ask what's in them."</b>`,
    `<b>"Some of the Family's crates hum. I keep those ones at the back."</b>`,
    `<b>"Nobody counts what goes in here, and nobody counts what comes out. Best warehouse on the island."</b>`,
  ]), '📦 Storage', 'Leave');
  if(yes) leaveDeck('storage');
}
async function r5Keeper(){
  await sceneSay([faceNpc('lighthouse_keeper','🏮')], R5_NAMES.lighthouse_keeper, r5Next('aldo', [
    `<b>"The Family's boats go in and out of that cave down the beach at night, with no lights on."</b><br><br>` +
    `<b>"It glows in there. Purple, like the old arch up by the cliff."</b>`,
    `<b>"I keep the lamp lit so honest boats don't hit the rocks."</b> He sniffs. ` +
    `<b>"The Family's boats don't need it. They know the way in the dark."</b>`,
  ]));
  if(r5Once('keeperCave'))
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"The dead are in that cave. A great many of them. Something like me."</b>`);
}
function r5StationMaster(){
  if(r5().holdBroken && r5Once('enzoFree'))
    return sceneSay([faceNpc('station_master','🎩')], R5_NAMES.station_master,
      `<b>"Last night the little car went up the hill all by itself — full of singing."</b> He shakes his head. <b>"Forty years, and that's a first."</b>`);
  return sceneSay([faceNpc('station_master','🎩')], R5_NAMES.station_master, r5Next('enzo', [
    `<b>"The funicular runs to the Old Town. Family only, these days."</b><br><br>He taps a sign: <b>NO PAPERS, NO RIDE</b>.`,
    `<b>"Forty years I've run this station. Now I sell tickets nobody is allowed to buy."</b>`,
    `<b>"See that clock? Not one minute lost in forty years. The car used to run on time, too."</b>`,
  ]));
}
async function r5Funicular(){
  await sceneSay([], 'The funicular',
    `The little car waits at the bottom of its rails. A soldato sits inside it with his feet up, wide awake, glaring at anybody who comes near.`);
  await sceneSay([faceMon('whalelord')], whaleName(), `<b>"Leave him. We will not get up that way today."</b>`);
}
async function r5OldTownGate(){
  await sceneSay([], 'The Old Town gate',
    `The gate at the top of the steps is shut and barred. Two soldatos lean on the wall above it, watching the harbour.`);
  if(r5().oldTown)
    return sceneSay([faceMon('whalelord')], whaleName(),
      `<b>"We have been up there already — under the hill, with the dead, not through this gate."</b><br><br>` +
      `<b>"The Old Town is on your Explore list now. We go in through the church."</b>`);
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"My core is up there, somewhere past that gate. I can feel it the way you feel the sun on your face with your eyes shut."</b><br><br>` +
    `<b>"Not this way. Not yet."</b>`);
}
/* In the Family's colours (2.91), the gate's soldatos lift the bar for a
   junior going up on the Family's business. */
async function r5GateUp(){
  const r = r5();
  if(!r.disguise) return r5OldTownGate();
  if(!r.disguised && !r.holdBroken){             // (3.00) with the dead up for good, nobody has eyes for you
    const yes = await r5Ask([faceMon('whalelord')], whaleName(),
      `<b>"Those two on the gate would know your face. But a junior soldato going up to the Old Town on the Family's business..."</b>`,
      '🎭 Put on the disguise', 'Not now');
    if(!yes) return;
    r.disguised = true;
    saveProfile();
  }
  await sceneSay([faceNpc('soldato2', '💂')], 'Soldato', r5Turn('gateUp', [
    `He glances at your uniform and lifts the bar.<br><br><b>"Up you go, junior. Don't keep the capos waiting."</b>`,
    `<b>"Back up already? They work you juniors hard."</b> He lifts the bar without looking at you.`,
  ]));
  goFloor('old_town', 'harbour');
}
/* The old way into the catacombs: an arch in the cliff, barred from inside. */
async function r5OldArch(){
  await sceneSay([], 'The old arch',
    `An old stone arch in the cliff, with columns either side. Once it was the way into the catacombs.<br><br>` +
    `Iron bars close it now, locked from the inside. Behind them, the dark glows a soft purple.`);
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"The dead are just behind these bars. But this way is shut."</b>`);
}
function r5Loiter(where){
  const face = faceNpc(where === 'steps' ? 'soldato2' : 'soldato1', '💂');
  const lines = where === 'steps'
    ? [ `<b>"Old Town's closed. Family orders."</b>`,
        `<b>"Move along, kid. Nothing up there for you."</b>` ]
    : [ `<b>"You're the one who came in on the research ship."</b> He looks you up and down. <b>"Word gets around. Keep your nose clean."</b>`,
        `<b>"The customs house? Go in if you like. Nobody comes out any richer."</b>` ];
  return sceneSay([face], 'Soldato', r5Next('loiter_' + where, lines));
}
/* The soldato at the sea cave: the only way into the catacombs is past him. */
async function r5GateSoldato(){
  const face = faceNpc('soldato1', '💂');
  const r = r5();
  const yes = await r5Ask([face], 'Soldato',
    `<b>"Oi. Where do you think you're going?"</b><br><br>He plants himself in front of the cave mouth.<br><br>` +
    `<b>"Nobody goes in there. Family business."</b>`, '⚔️ Fight', 'Leave');
  if(!yes){
    if(!r.heardTunnels && r5Once('gateHint'))
      await sceneSay([faceMon('whalelord')], whaleName(), `<b>"He is guarding that cave. I wonder what is in there."</b>`);
    return;
  }
  if(!ensurePool()) return;
  walkTeardown();
  beginBattle(Object.assign(r5GateBattle(), { onWin: ()=> r5GateBeaten() }));
}
/* (3.11) The setups below are shared with the Test Arena's Challengers. */
function r5GateBattle(){
  const def = R5_ROSTERS.gate;
  return { isNpc:true, name:'Soldato', npcId:'soldato1', noFlee:true,
    waves: def.waves.map((w, wi)=> w.map(s=> Object.assign({ ai: s.ai || def.ai[wi] || 'power1', nerfed:false }, s))) };
}
async function r5GateBeaten(){
  const r = r5();
  r.gateBeaten = true;
  await saveProfile();
  const w = walkState();
  w.at = w.at || {}; w.at.harbour = { x:3, y:31 }; w.face = 'l';
  ui.walkFresh = false;
  go('harbour');
  const whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([faceNpc('soldato1','💂')], 'Soldato',
    `He runs off along the beach, holding his hat on.<br><br><b>"Fine! Go in there, then! The dead can have you!"</b>`);
  await sceneSay([whale], wn, `<b>"The dead do not frighten me. I am one."</b>`);
  await sceneSay([whale], wn,
    `<b>"In there, you will not be able to see. I will. Stay close to me."</b><br><br>` +
    `<i>The catacombs are open. They are on the Explore screen too.</i>`);
}
function refreshWalkAll(){ if(DECKS[ui.screen]) go(ui.screen); }

/* ============================================================
   NINO (3.02) — the Padrino's little brother (part 6 §12b, his story, as
   the designer agreed it; (3.17) §12c: he was ill from the day he was born —
   Nemesis's doing — and died at six, long ago; not lost in the tunnels).
   While the mediums press every ghost in the hill down he is only a little
   light — the wisp, drawn here: a small pale glow "about as big as an
   apple" — that waits ahead of you, and goes when you come close. When the
   hold breaks (the tower, floor 13) he grows into a boy — his ghost,
   `ghost_child` (3.03, the designer: "nino first appears as npc/ghost_child
   with a different sprite"). He never speaks: the Whalelord says what he
   feels, and (3.17) shows what he shows him — the Bone Demon. The Ghost
   Master cannot see or hear him: the Ghost Guardian at her side has always
   kept him from her (it is Nemesis's vessel); she sees him only at the end.
   `padrino_brother` is the boy alive — the body Cyborg brings back, and
   Nino as he was in the past (the Madrina's photograph): NINO_BODY.
   r5().said: wispLanding (the light seen), wispFind (the Landing's find it
   waited over) and wispFindGone / wispFound, wispWaits (the Whalelord's "It
   always waits for us"), wispCistern / wispBones / wispStair (waited there),
   wispShield (the night the dead rose); r5().ninoMet once he is a boy;
   (3.17) boneVision once he has shown the Whalelord the Bone Demon.
   ============================================================ */
const NINO_GHOST = 'ghost_child';
const NINO_BODY = 'padrino_brother';
/* Before he can be seen as a boy: the little light. */
function r5NinoEarly(){ const r = r5(); return !r.holdBroken && !r.ninoMet; }
function r5NinoFace(){ r5Css(); return `<span class="r5-nino-face">${faceNpc(NINO_GHOST, '👦')}</span>`; }
/* The boy himself, on the deck: his ghost, as drawn (a soft glow round it;
   until the picture is there, the stand-in is see-through and faintly blue). */
function r5NinoActor(x, y, fadeMs){
  const el = sceneActor('nino', { x, y, w:1, h:1, src:`assets/npc/${NINO_GHOST}.png`, icon:'👦' });
  if(!el) return null;
  r5Css();
  el.classList.add('r5-nino');
  if(fadeMs){
    el.style.transition = 'none'; el.style.opacity = '0';
    void el.offsetWidth;
    el.style.transition = `opacity ${fadeMs * SCENE_SPEED}ms ease`;
    el.style.opacity = '1';
  }
  return el;
}
/* The little light: centred on tile (x, y) — (x + 0.5, y + 0.5) — fading in.
   A scene glow, so sceneClear clears it; above the dark (it is a light). */
const R5_WISP_TILES = 0.95;
function r5Wisp(x, y, fadeMs){
  r5Css();
  const world = $('#walkWorld'); if(!world) return null;
  const T = WALK_T, D = R5_WISP_TILES;
  let o = document.getElementById('sg-wisp');
  if(!o){
    o = document.createElement('div');
    o.id = 'sg-wisp'; o.className = 'scene-glow r5-wisp';
    o.innerHTML = '<i></i>';
    o.style.opacity = '0';
    world.appendChild(o);
  }
  o._at = { x, y };
  o.style.transition = 'none';
  o.style.left = ((x + 0.5 - D / 2) * T) + 'px';
  o.style.top = ((y + 0.5 - D / 2) * T) + 'px';
  o.style.width = o.style.height = (D * T) + 'px';
  void o.offsetWidth;
  o.style.transition = `opacity ${(fadeMs || 700) * SCENE_SPEED}ms ease`;
  o.style.opacity = '1';
  return o;
}
/* It floats on to (x, y). */
function r5WispTo(x, y, ms){
  const o = document.getElementById('sg-wisp');
  if(!o) return sceneWait(ms);
  const T = WALK_T, D = R5_WISP_TILES;
  o._at = { x, y };
  o.style.transition = `left ${ms * SCENE_SPEED}ms ease-in-out, top ${ms * SCENE_SPEED}ms ease-in-out, opacity ${600 * SCENE_SPEED}ms ease`;
  void o.offsetWidth;
  o.style.left = ((x + 0.5 - D / 2) * T) + 'px';
  o.style.top = ((y + 0.5 - D / 2) * T) + 'px';
  return sceneWait(ms);
}
function r5WispOut(ms){ ui.r5WispAt = null; return sceneGlowOut(['wisp'], ms || 700); }
/* Which of the Landing's finds he waits over: the one he chose, or the first
   you have not taken. -1: none left to show. */
function r5WispFindIndex(){
  const s = r5().said, d = R5_DECKS.cata_landing;
  if(s.wispFind != null) return prizeTaken('cata_landing', s.wispFind) ? -1 : s.wispFind;
  return (d.prizes || []).findIndex((q, k)=> !prizeTaken('cata_landing', k));
}
/* Where he waits on this floor now, if anywhere: { x, y, near, key }. He goes
   when you come within `near` steps of him (0: he stays); `key` marks that
   wait done. After the Purple Capo he leads: the Long Stair's door to the
   Barracks, the Barracks' to the Armoury, and in the Armoury, by the orb.
   Once he has brought you to the ghost phoenix his leading is done: after
   that he is seen again only the night the dead rise, and in the tower. */
function r5WispSpot(d){
  if(!d || !r5NinoEarly()) return null;
  const r = r5(), s = r.said || {};
  if(r.phoenixMet) return null;
  const leading = !!r.tier1 && !r.rush;
  switch(d.key){
    case 'cata_landing': {
      if(!s.wispLanding || s.wispFindGone) return null;
      const i = r5WispFindIndex();
      return i < 0 ? null : { x:d.prizes[i][0], y:d.prizes[i][1], near:1, key:'wispFindGone', find:i };
    }
    case 'cata_cistern':  return s.wispCistern ? null : { x:5, y:15, near:2, key:'wispCistern' };
    case 'cata_bones':    return s.wispBones ? null : { x:19, y:17, near:2, key:'wispBones' };
    case 'cata_stair':
      if(leading) return { x:15, y:21, near:2, key:null };
      return (s.wispStair || r.tier1) ? null : { x:8, y:23, near:2, key:'wispStair' };
    case 'cata_stair_r1': return leading ? { x:17, y:6, near:2, key:null } : null;
    case 'cata_stair_r2': return (leading && s.gpOrb) ? { x:5.5, y:3.1, near:0, key:null } : null;
  }
  return null;
}
/* On each render of a floor: put him where he waits. */
function r5WispRender(d){
  const spot = r5WispSpot(d);
  if(!spot){ ui.r5WispAt = null; return; }
  const s = r5().said;
  if(spot.find != null && s.wispFind == null){ s.wispFind = spot.find; saveProfile(); }
  ui.r5WispAt = Object.assign({ deck:d.key }, spot);
  r5Wisp(spot.x, spot.y, 900);
}
/* A step: come close and he goes. The first time he does it, the Whalelord
   sees the pattern. */
function r5WispStep(d, p){
  const w = ui.r5WispAt;
  if(!w || w.deck !== d.key || !w.near || ui.sceneRunning || !p) return;
  if(Math.abs(p.x - w.x) + Math.abs(p.y - w.y) > w.near) return;
  ui.r5WispAt = null;
  r5WispOut(800);
  const r = r5();
  if(w.key) r.said[w.key] = true;
  saveProfile();
  /* said half a second on — unless that same step found a fight, or a way
     off the floor; then it is said the next time instead */
  const still = ()=> ui.screen === d.key && walkState().deck === d.key && !ui.sceneRunning && !document.querySelector('.scene-say');
  /* never seen before (a save past the Landing): "Did you see that?" */
  if(!r.said.wispLanding){ setTimeout(()=>{ if(still()) r5WispFirstSight(); }, 500); return; }
  if(r.said.wispWaits || w.key === 'wispFindGone') return;
  setTimeout(()=>{
    if(!still() || r.said.wispWaits) return;
    r.said.wispWaits = true;
    saveProfile();
    sceneSay([faceMon('whalelord')], whaleName(), `<b>"It always waits for us. Then, when we get close, it goes."</b>`);
  }, 500);
}
/* The first time anyone sees him (scene 1 of §12b). */
async function r5WispFirstSight(){
  const r = r5();
  if(r.said.wispLanding) return;
  r.said.wispLanding = true;
  saveProfile();
  const say = html=> sceneSay([faceMon('whalelord')], whaleName(), html);
  ghostAlert();
  await say(`<b>"Wait. Did you see that? A little light."</b>`);
  await say(`<b>"It is a ghost — but not like the others down here. They are angry. That one is just… sad. And very small."</b>`);
}
/* The Landing: at the end of the tunnel, the little light — then it is gone;
   and it waits over one of the floor's finds. */
async function r5LandingGlimpse(){
  const d = R5_DECKS.cata_landing;
  if(!r5NinoEarly() || r5().said.wispLanding || walkState().deck !== 'cata_landing') return;
  ui.sceneRunning = true;
  r5Wisp(10, 23, 900);                            // three tiles up the tunnel from the cave: in sight
  await sceneWait(1600);
  await r5WispOut(900);
  ui.sceneRunning = false;
  await r5WispFirstSight();
  r5WispRender(d);
}
/* After the Purple Capo (scene 3): the light comes to you, then floats off to
   the Barracks' door, and waits. */
async function r5WispLead(){
  const w = walkState();
  if(!r5NinoEarly() || w.deck !== 'cata_stair' || r5().phoenixMet) return;
  const p = (w.at && w.at.cata_stair) || { x:8, y:4 };
  const seen = !!r5().said.wispLanding;
  r5Wisp(p.x + 1, p.y + 1, 700);
  await sceneWait(900);
  const say = html=> sceneSay([faceMon('whalelord')], whaleName(), html);
  if(!seen){
    r5().said.wispLanding = true; saveProfile();
    await say(`<b>"Wait. Did you see that? A little light."</b><br><br>` +
              `<b>"It is a ghost — but not like the others down here. They are angry. That one is just… sad. And very small."</b>`);
  }
  r5WispTo(15, 21, 2200);
  await sceneWait(900);
  await say(`<b>"The little light. It wants us to follow."</b>`);
  ui.r5WispAt = { deck:'cata_stair', x:15, y:21, near:2, key:null };
}
/* The night the dead rose (scene 4): by the nearest of the Garrison's men,
   it keeps his ghosts off him. */
async function r5WispShield(){
  const id = 'cata_garrison', st = ui.stealth && ui.stealth[id], p = walkState().at && walkState().at[id];
  if(!st || !st.guards.length || !p || r5().said.wispShield) return;
  const far = g=> Math.abs(g.x - p.x) + Math.abs(g.y - p.y);
  const g = st.guards.slice().sort((a, b)=> far(a) - far(b))[0];
  const el = document.getElementById('guard-' + g.id);
  r5Wisp(g.x - 0.75, g.y - 0.2, 600);
  if(el) el.classList.add('nino-shield');
  await sceneWait(1000);
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"The little light is keeping the ghosts off that soldier! It does not want anyone hurt. Run!"</b>`);
  r5().said.wispShield = true;
  saveProfile();
  r5WispOut(900);
  setTimeout(()=>{ if(el) el.classList.remove('nino-shield'); }, 1500);
}
/* Floor 13, before the fight (scene 5): a flicker at the edge of her candles.
   (3.17) She cannot see it — only the flames, leaning toward it. */
async function r5TowerFlicker(){
  r5Wisp(7, 5, 250); await sceneWait(380);
  await r5WispOut(260);
  await sceneWait(260);
  r5Wisp(7, 5, 250); await sceneWait(560);
  await r5WispOut(420);
  await sceneSay([r5TowerFace(13)], 'Ghost Master', `For a moment every candle flame leans the same way. She turns her head sharply.<br><br><b>"…What was that?"</b>`);
}
/* (3.02) A save that broke the hold before Nino was in the story — (3.17)
   rewritten for §12c: the Ghost Master never saw him, so she does not come.
   On the hill the little light catches you up, grows into a boy only you and
   the Whalelord can see, writes his name in the air, shows the Whalelord the
   Bone Demon, and runs to the villa. */
async function r5NinoCatchUp(){
  const r = r5(), w = walkState();
  if(r.ninoMet || ui.sceneRunning || w.deck !== 'hilltop') return;
  ui.sceneRunning = true;
  w.busy = true;
  if(typeof releaseKeys === 'function') releaseKeys();
  const p = (w.at && w.at.hilltop) || { x:12, y:11 };
  const wl = ()=> faceMon('whalelord'), W = whaleName();
  const gx = Math.max(1, Math.min(23, p.x + 1)), gy = Math.max(1, p.y - 2);
  r5Wisp(gx, gy, 800);
  await sceneWait(900);
  await sceneSay([wl()], W, `<b>"Look — the little light. It has come out of the tower after us."</b>`);
  r5NinoActor(gx, gy - 0.25, 1200);
  await sceneGlowOut(['wisp'], 1200);
  await sceneSay([r5NinoFace()], '', `It grows — and grows — into a boy. A small boy in short trousers and a cap, see-through like mist. He looks at you, and smiles.`);
  await sceneSay([wl()], W, `<b>"Now I can see him properly. He is not a monster at all. He is a boy. A human boy."</b>`);
  await sceneSay([r5NinoFace()], '', `He writes in the air with one finger. The letters glow for a moment, then fade:<br><br><span class="r5-airname"><b>N I N O</b></span>`);
  await sceneSay([wl()], W, `<b>"Nino. That is his name."</b>`);
  r.ninoMet = true;
  await saveProfile();
  await r5BoneVision();
  await r5MoveActor('nino', 12.5, 9, 1800, true);
  sceneActorGone('nino');
  await sceneSay([], '', `Then he runs — up the hill, toward the villa — and he is gone.`);
  await sceneSay([wl()], W, `<b>"Toward the Padrino's house. The dead are free now, and the Padrino is the one they are angriest with…"</b><br><br><b>"…and that little boy ran straight to him."</b>`);
  w.busy = false;
  ui.sceneRunning = false;
}
/* (3.17) The picture Nino paints in the Whalelord's mind (part 6 §12c — the
   designer: "it should paint the image of bone demon in the whalelord's mind,
   trying to reveal the truth about what's controlling the ghost guardian and
   the family by proxy"). Its picture: assets/mon/bone_demon_front.png, or
   bone_demon.png; 💀 until then. Said once (r5().said.boneVision). */
const R5_BONE_DEMON_ART = ['assets/mon/bone_demon_front.png', 'assets/mon/bone_demon.png'];
/* An <img> that tries each picture of a list in turn, then shows the emoji. */
function r5ArtImg(list, emoji){
  return `<img src="${list[0]}" alt="" data-chain="${list.join('|')}" data-i="0" data-emoji="${emoji || '❓'}" onerror="r5ArtNext(this)">`;
}
function r5ArtNext(img){
  const list = (img.dataset.chain || '').split('|'), i = +(img.dataset.i || 0) + 1;
  if(i < list.length){ img.dataset.i = String(i); img.src = list[i]; return; }
  img.outerHTML = `<span class="rv-emoji">${img.dataset.emoji || '❓'}</span>`;
}
function r5VisionShow(list, emoji){
  r5Css();
  let o = document.getElementById('r5Vision');
  if(!o){
    o = document.createElement('div');
    o.id = 'r5Vision';
    document.body.appendChild(o);
  }
  o.innerHTML = `<div class="rv-pic">${r5ArtImg(list, emoji)}</div>`;
  o.style.transition = 'none'; o.style.opacity = '0';
  void o.offsetWidth;
  o.style.transition = `opacity ${900 * SCENE_SPEED}ms ease`;
  o.style.opacity = '1';
  return o;
}
async function r5VisionHide(ms){
  const o = document.getElementById('r5Vision');
  if(!o) return;
  o.style.transition = `opacity ${(ms || 900) * SCENE_SPEED}ms ease`;
  o.style.opacity = '0';
  await sceneWait(ms || 900);
  o.remove();
}
async function r5BoneVision(){
  const r = r5(), W = whaleName(), wl = ()=> faceMon('whalelord');
  r.said.boneVision = true;
  saveProfile();
  await sceneSay([wl()], W, `<b>"He is showing me something. A picture — in my head."</b>`);
  playSfx('malice');
  r5VisionShow(R5_BONE_DEMON_ART, '💀');
  await sceneWait(1100);
  await sceneSay([wl()], W, `<b>"A monster. A great beast with a dragon's head… and a hundred legs, all made of bone."</b>`);
  await sceneSay([wl()], W, `<b>"It is old. So very old. And he is frightened of it — not for himself. For his brother. For his whole family."</b>`);
  await sceneSay([wl()], W, r.said.malice1
    ? `<b>"I have never seen it before. But I have felt it: that cold, deep under the island. It is this."</b>`
    : `<b>"I have never seen it before. But he wants us to know it is here."</b>`);
  await r5VisionHide(900);
}

/* ============================================================
   THE COLD UNDER THE ISLAND (3.17) — Nemesis (part 6 §12c)
   It hides in its rift, deep under the hill, and shows itself only now and
   then. Each time the edges of the world go dark, the stones shiver, and the
   Whalelord and the Forest Fairy feel it — the designer: "some deep, dark,
   and terrifying malice emanates from time to time in the depths of the
   island … it feels like an ancient power". It comes on a walk, some steps
   in (r5MaliceStep, from r5NoteStep), never while anything else is said:
     malice1      the first time — any catacomb floor or room but the Landing,
                  the Old Town's streets, the Hilltop
     (the ghost phoenix: the Whalelord wonders if that is it — r5SenseArmoury;
     3.35: the phoenix tells him no — something very old is behind the
     Padrino, and it is cold (said.gpBehind) — and the lines below follow on)
     maliceGP     "despite ghost phoenix disappearing … the malice has not left
                  the island": the first time after it goes to rest ('rest'); or,
                  with no phoenix of yours, once you are up in the Old Town:
                  it is not the phoenix waiting in the Armoury ('waiting') —
                  and then maliceGPRest if it goes to rest after all
     maliceHill   the Hilltop: "an ancient power"
     maliceDay    the day of the last passing word — now and then after the
                  first, one walk in three, never twice in a day
   The Forest Fairy speaks here for the first time — your own, as you have her.
   ============================================================ */
/* Your Forest Fairy (the Sacred Seed, grown — Region 2): party first, then
   storage. The story keeps her with you; null only for a save made up in a test. */
function r5Fairy(){
  return (state.party || []).concat(state.storage || []).find(m=> m && m.species === 'forest_fairy') || null;
}
function r5FairyFace(){
  const m = r5Fairy();
  return faceMon('forest_fairy', { stage:m ? monStage(m) : 1, crowned:!!(m && m.crowned) });
}
function r5FairyName(){ const m = r5Fairy(); return m ? displayName(m) : 'Forest Fairy'; }
/* One line from her, or nothing if there is no her. */
function r5FairySay(html){ return r5Fairy() ? sceneSay([r5FairyFace()], r5FairyName(), html) : Promise.resolve(); }
/* The cold passing through: the screen's edges go dark red and purple, twice,
   like a slow heartbeat, and the stones shiver. */
function r5Dread(ms){
  r5Css();
  ms = ms || 1900;
  let o = document.getElementById('r5Dread');
  if(!o){ o = document.createElement('div'); o.id = 'r5Dread'; document.body.appendChild(o); }
  playSfx('malice');
  sceneShake(ms, t=> 0.05 * Math.sin(Math.PI * Math.min(1, t / ms)));
  const dur = Math.max(1, ms * SCENE_SPEED), t0 = performance.now();
  const beat = (t, c, w)=> Math.exp(-Math.pow((t - c) / w, 2));
  return new Promise(done=>{
    const frame = now=>{
      const t = Math.min(1, (now - t0) / dur);
      o.style.opacity = (0.95 * beat(t, 0.27, 0.12) + 0.72 * beat(t, 0.6, 0.12)).toFixed(3);
      if(t < 1) requestAnimationFrame(frame); else { o.style.opacity = '0'; o.remove(); done(); }
    };
    requestAnimationFrame(frame);
  });
}
/* Where it can come: the catacombs (not the Landing, the first time), the Old
   Town's streets, the Hilltop — never the night the dead rose. */
function r5MaliceDeck(d){
  if(!d || d.region !== 5 || !d.stealth || stealthRush(d)) return false;
  if(d.key === 'harbour') return false;
  return r5IsCata(d) || d.key === 'old_town' || d.key === 'hilltop';
}
/* What is due on this deck, if anything: the key, said in that order. */
function r5MaliceDue(d){
  const r = r5(), s = r.said;
  if(r.vault && r.vault.nemesis) return null;     // (3.20) it went into the tear, with Cyborg
  if(!s.malice1) return d.key === 'cata_landing' ? null : 'malice1';
  if(!s.maliceGP){
    if(r.phoenixGone) return 'maliceGP';
    if(r.phoenixMet && r.oldTown && !r5MyPhoenix()) return 'maliceGP';
  }
  if(s.maliceGP === 'waiting' && r.phoenixGone && !s.maliceGPRest) return 'maliceGPRest';
  if(!s.maliceHill && d.key === 'hilltop') return 'maliceHill';
  return s.maliceDay === r5Day() || s.maliceAt === r5Day() ? null : 'maliceDay';
}
const R5_MALICE_STEPS = 12;
function r5MaliceStep(d, p){
  if(!r5MaliceDeck(d) || ui.sceneRunning || ui.r5MaliceBusy) return;
  const m = ui.r5MaliceWalk && ui.r5MaliceWalk.deck === d.key ? ui.r5MaliceWalk : (ui.r5MaliceWalk = { deck:d.key, n:0, rolled:false, fired:false });
  m.n++;
  if(m.fired) return;                            // once on a walk through a place
  const due = r5MaliceDue(d);
  if(!due) return;
  const at = due === 'maliceDay' ? 18 : R5_MALICE_STEPS;
  if(m.n < at) return;
  if(due === 'maliceDay'){
    if(m.rolled) return;
    m.rolled = true;                               // one roll a walk on a deck
    if(Math.random() >= 1 / 3) return;
  }
  const st = ui.stealth && ui.stealth[d.key];
  if(st && (st.caught || st.guards.some(g=> g.sus))) return;          // not with a man about to see you
  if(d.key === 'hilltop' && r5MKDue() && r5InForecourt(p)) return;     // the Monkey King is about to drop in
  if(walkState().busy || document.querySelector('.scene-say') || document.body.classList.contains('in-scene')) return;
  ui.r5MaliceBusy = true;
  setTimeout(()=>{
    ui.r5MaliceBusy = false;
    if(ui.screen !== d.key || walkState().deck !== d.key || ui.sceneRunning || walkState().busy || document.querySelector('.scene-say')) return;
    m.fired = true;
    r5Malice(due);
  }, 250);
}
const R5_MALICE_DAY = [
  [['w', `There. Did you feel it?`], ['f', `…And gone again. It hides every time we notice it.`]],
  [['f', `The ground just shivered. Under everything.`], ['w', `The same cold. Always the same.`]],
  [['w', `Something down there opened its eyes for a moment — and looked at us.`], ['f', `And then it shut them again.`]],
  [['f', `Every time it comes, the little plants in the cracks curl up tight.`], ['w', `Stay close to me.`]],
  [['w', `That cold again. It is patient, whatever it is. Very patient.`]],
  [['f', `It feels like an old, old tree that died long ago — with roots that are still alive under the ground. And hungry.`]],
];
async function r5Malice(key){
  const r = r5(), s = r.said;
  if(ui.sceneRunning) return;
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  if(typeof releaseKeys === 'function') releaseKeys();
  const wl = ()=> faceMon('whalelord'), W = whaleName();
  const ws = html=> sceneSay([wl()], W, `<b>"${html}"</b>`);
  const fs = html=> r5FairySay(`<b>"${html}"</b>`);
  if(key === 'maliceGP') s.maliceGP = r.phoenixGone ? 'rest' : 'waiting';
  else if(key === 'maliceDay') s.maliceDay = r5Day();
  else s[key] = true;
  s.maliceAt = r5Day();
  saveProfile();
  await r5Dread(2000);
  ghostAlert();
  if(key === 'malice1'){
    await sceneSay([], '', `Every light dips at once. Under your feet, the stones shiver — and something cold goes through you, from far, far below.`);
    await ws(`…Did you feel that?`);
    await ws(`Something went through the whole island just now. Not the dead. Something under the dead — deeper than anything down here.`);
    await fs(`I felt it too. It was there, and then it was gone — as if it hid again, the moment it knew we felt it.`);
    await fs(`It is very old. Older than my grove. Older than anything I know.`);
    await ws(`And it hates. I have never felt anything hate like that. Not even me, when I lost my core.`);
    /* (3.35) felt for the first time after the old phoenix's warning */
    if(s.gpBehind) await ws(`The old phoenix said something very old is behind the Padrino. I think we just felt it.`);
  } else if(key === 'maliceGP' && r.phoenixGone){
    await ws(`That cold again.`);
    if(s.gpBehind){                                // (3.35) it told you what this was
      await ws(`The old phoenix is at rest now — and this is still here. The phoenix was right: something very old is behind the Padrino.`);
      await fs(`The phoenix burned. This is cold — and it is still down there, deep under the island. Waiting.`);
    } else {
      await ws(`I was sure it was the old phoenix I had been feeling, all this time. All that anger. But the old phoenix is at rest now — and this is still here.`);
      await fs(`It was never the phoenix. The phoenix burned. This is cold — and it is still down there, deep under the island. Waiting.`);
    }
  } else if(key === 'maliceGP'){
    await ws(`That cold again.`);
    await ws(s.gpBehind
      ? `It is not the old phoenix. The phoenix is down in the Armoury, far behind us. This is the thing it told us of — the thing behind the Padrino.`
      : `It is not the old phoenix. The phoenix is down in the Armoury, far behind us, warm and sad. This comes from much deeper.`);
    await fs(`The phoenix burns. This is cold. Something else is down there — something very old.`);
  } else if(key === 'maliceGPRest'){
    await ws(`The old phoenix is at rest now. And still the cold is here. It never had anything to do with the phoenix.`);
  } else if(key === 'maliceHill'){
    await fs(`It's stronger up here. Much stronger.`);
    await ws(`An ancient power. Older than this town. Older than the dead under it.`);
    await fs(`An ancient power — yes. Something that should have ended a very long time ago… and would not.`);
  } else {
    const pick = R5_MALICE_DAY[Math.floor(Math.random() * R5_MALICE_DAY.length)];
    for(const [who, line] of pick) await (who === 'f' && r5Fairy() ? fs(line) : ws(line));
  }
  w.busy = false;
  ui.sceneRunning = false;
}

/* ============================================================
   THE WHALELORD'S SENSE (3.35)
   The designer: "let whalelord have a button to advise about the monsters
   available on each level of the catacombs. He should say, 'I sense these
   monsters on this floor' - their sprites should then appear small but can
   be clicked to be enlarged similar to barnaby's culprit guessing window.
   this will help the player identify the floors needed to catch their
   missing monsters."
   A button with his face in the stage's top-left corner, on every catacomb
   floor and side room — not on the night the dead rose (nothing wild comes
   out then, and the clock sits there). Pressed, his card: "I sense these
   monsters on this floor." (in a side room, "in this room"), and the wild
   ones of this floor or room, small, in the form you meet them in here — a
   ✓ on any you have caught, "rare" under the rarer ones (they come a little
   stronger, `plus`). Tap one to see it big, with its name (as Barnaby's
   board does, zoomMon). Nothing on the floor moves while it is open (the
   card is a .refine-scrim, which stealthPaused counts).
   ============================================================ */
function r5SenseDue(d){ return !!(d && r5IsCata(d) && !stealthRush(d) && !d.vault); }
function r5SenseButton(d){
  const stage = $('#walkStage');
  const old = document.getElementById('r5Sense');
  if(!stage || !r5SenseDue(d)){ if(old) old.remove(); return null; }
  if(old) return old;
  r5SenseCss();
  const b = document.createElement('button');
  b.id = 'r5Sense';
  b.className = 'r5-sense-btn';
  b.innerHTML = `${monPortrait('whalelord', 26, { view:'front', bare:true, crowned:whaleName() === 'Cuain' })}<span>Sense<br>monsters</span>`;
  b.addEventListener('click', ()=> r5SenseCard());
  stage.appendChild(b);
  return b;
}
/* This floor's wild ones, once each, in the table's order (the common ones
   first): the form each is met in here — at the level catacombEncounter
   pitches the pack at (your strongest, held to the floor's band) — whether
   you have caught one, and whether it is one of the rarer ones. */
function r5SenseList(d){
  const w = d && d.stealth && d.stealth.wild;
  const table = (w && w.table) || [];
  const [lo, hi] = (w && w.lv) || [76, 84];
  const best = Math.max(lo, ...battleParty().map(m=> m.level || 0));
  const base = Math.max(lo, Math.min(hi, best));
  const caught = state.caughtSpecies || [], seen = new Set();
  return table.filter(t=> SPECIES[t.sp] && !seen.has(t.sp) && seen.add(t.sp)).map(t=>{
    const lv = Math.min(CATCH_LEVEL_CAP, base + (t.plus || 0));
    return { sp:t.sp, stage:evolutionStage(t.sp, lv), rare:!!t.plus, caught:caught.includes(t.sp) };
  });
}
function r5SenseCard(){
  const w = walkState(), d = DECKS[w.deck];
  if(!d || !r5SenseDue(d) || w.busy || ui.sceneRunning || document.querySelector('.scene-say, .refine-scrim, .mon-zoom')) return;
  r5SenseCss();
  boardCss();
  if(typeof releaseKeys === 'function') releaseKeys();
  const list = r5SenseList(d);
  const where = R5_ALL_ROOMS.includes(d.key) ? 'in this room' : 'on this floor';
  const ov = document.createElement('div');
  ov.className = 'refine-scrim r5-sense';
  ov.innerHTML = `
    <div class="refine-card">
      <div class="r5-sense-head">
        ${faceMon('whalelord', { crowned:whaleName() === 'Cuain' })}
        <div>
          <div class="refine-name">${escapeHtml(whaleName())}</div>
          <div class="r5-sense-say"><b>${list.length ? `"I sense these monsters ${where}."` : `"I sense no wild monsters ${where}."`}</b></div>
        </div>
      </div>
      ${list.length ? `
      <div class="r5-sense-grid">
        ${list.map(m=> `<button class="r5-sense-mon${m.caught ? ' got' : ''}" data-sp="${m.sp}" data-stage="${m.stage}" aria-label="${escapeHtml(SPECIES[m.sp].name)}">
          ${monPortrait(m.sp, 52, { view:'front', bare:true, stage:m.stage })}
          ${m.caught ? '<span class="r5-sense-got">✓</span>' : ''}
          ${m.rare ? '<span class="r5-sense-rare">rare</span>' : ''}
        </button>`).join('')}
      </div>
      <div class="refine-sub">Tap a monster to see it bigger. ✓ means you have caught one.</div>` : ''}
      <button class="btn btn-ghost" id="r5SenseBack" style="margin-top:10px;">Back</button>
    </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) ov.remove(); };
  ov.querySelector('#r5SenseBack').addEventListener('click', close);
  ov.addEventListener('click', e=>{ if(e.target === ov) close(); });
  ov.querySelectorAll('[data-sp]').forEach(b=> b.addEventListener('click', ()=>
    r5SenseZoom(b.dataset.sp, +b.dataset.stage, b.classList.contains('got'))));
}
/* One of them at full size, with its name — tap outside it to go back. */
function r5SenseZoom(sp, stage, caught){
  boardCss();
  r5SenseCss();
  const z = document.createElement('div');
  z.className = 'mon-zoom r5-sense-zoom';
  z.innerHTML = `<div class="r5-sz-in">
    ${monPortrait(sp, ZOOM_PX, { view:'front', bare:true, stage })}
    <div class="r5-sz-name">${escapeHtml(SPECIES[sp].name)}</div>
    <div class="r5-sz-got${caught ? '' : ' not'}">${caught ? '✓ Caught' : 'Not caught yet'}</div>
  </div>`;
  z.addEventListener('click', e=>{ if(e.target === z) z.remove(); });
  document.body.appendChild(z);
}
function r5SenseCss(){
  if(document.getElementById('r5SenseCss')) return;
  const st = document.createElement('style');
  st.id = 'r5SenseCss';
  st.textContent = `
    .r5-sense-btn{position:absolute;left:8px;top:8px;z-index:8;display:flex;align-items:center;gap:5px;
      background:rgba(244,236,216,.9);border:1px solid var(--line);border-radius:10px;padding:3px 9px 3px 4px;
      font:800 11px/1.1 system-ui;color:var(--ink-soft);text-align:left;cursor:pointer;}
    .r5-sense-btn .mon-portrait{width:26px !important;height:26px !important;box-shadow:none !important;background:none !important;}
    .r5-sense-btn:active{transform:scale(.95);}
    .r5-sense .refine-card{max-width:400px;}
    .r5-sense-head{display:flex;align-items:center;gap:10px;text-align:left;}
    .r5-sense-head .mon-portrait{flex:none;}
    .r5-sense-say{font-size:15px;line-height:1.35;margin-top:2px;}
    .r5-sense-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:14px 0 8px;}
    .r5-sense-mon{all:unset;position:relative;width:60px;height:60px;border-radius:12px;cursor:zoom-in;
      display:flex;align-items:center;justify-content:center;background:var(--paper-2);border:2px solid var(--line);}
    .r5-sense-mon.got{border-color:var(--jade);background:rgba(95,168,107,.14);}
    .r5-sense-mon:active{transform:scale(.94);}
    .r5-sense-mon .mon-sprite{filter:none !important;box-shadow:none !important;background:transparent !important;}
    .r5-sense-got{position:absolute;right:-5px;top:-6px;width:19px;height:19px;border-radius:50%;background:var(--jade);
      color:#fff;font:900 12px/19px system-ui;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.25);}
    .r5-sense-rare{position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);padding:0 5px;border-radius:7px;
      background:#6a4a9a;color:#fff;font:800 9px/14px system-ui;letter-spacing:.04em;}
    .mon-zoom.r5-sense-zoom{background:rgba(20,18,14,.9);}
    .r5-sz-in{display:flex;flex-direction:column;align-items:center;gap:8px;}
    .r5-sz-name{font-family:'Baloo 2',cursive;font-weight:800;font-size:28px;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.6);}
    .r5-sz-got{font:800 14px system-ui;color:#c9f5cf;}
    .r5-sz-got.not{color:#f3e2b8;}
  `;
  document.head.appendChild(st);
}

/* ============================================================
   IN THE DARK
   ============================================================ */
function r5FloorRender(world, d){
  const fresh = !!ui.stealthFresh;                // up a stair or through a door, not back from a fight
  const recaught = ui.r5Recaught === d.key;       // back from being caught: that was warning enough
  ui.r5Recaught = null;
  startStealth(world, d);
  const r = r5();
  if(!r.reached.includes(d.key)){ r.reached.push(d.key); saveProfile(); }
  /* where you left off is saved as you leave, too (2.90) */
  ['#backBtn', '#walkParty'].forEach(sel=>{ const b = $(sel); if(b) b.addEventListener('click', ()=> saveProfile()); });
  const say = html=> sceneSay([faceMon('whalelord')], whaleName(), html);
  const later = f=> setTimeout(f, 500);
  r5WispRender(d);                                // (3.02) the little light, where it waits
  r5SenseButton(d);                               // (3.35) the Whalelord's "Sense monsters"
  /* (3.18) under the villa: the first time on each floor, its scene; after
     that Nino at his stop, then the floor's word as on any other */
  if(d.under){
    if(r5UnderArriveDue(d)) return later(()=> r5UnderArrive(d));
    r5LeadRender(d);
  }
  /* The ghost phoenix, in the Armoury, once the Purple Capo is beaten (2.90):
     (2.92) its orb, waiting to be touched. */
  if(r5PhoenixDue(d)) return r5OrbScene(world, d);
  /* …and afterwards, waiting there for a phoenix to give the last of its
     power to (2.91) — an orb again each time you come in (2.92). Nobody
     stands watch in a haunted armoury. */
  if(d.key === 'cata_stair_r2' && r5GPWaiting()){
    if(fresh) ui.gpOut = false;
    r5PaintGPWaiting();
    if(fresh && r5Once('gpWaiting'))
      later(()=> say(`<b>"The old phoenix. It came back down here when the dead were pressed down again."</b><br><br>` +
                     `<b>"And the soldatos have not dared set foot in here since. They say the Armoury is haunted. They are right."</b>`));
    return;
  }
  if(d.stealth.intro && !r.intro) return d.stealth.intro();
  /* (3.02) Nino, as the little light: at the end of the Landing's tunnel the
     first time (r5DarkIntro, or now, for a save past it but not yet past the
     ghost phoenix) — and once you have taken the find it waited over, the
     Whalelord knows why. */
  if(d.key === 'cata_landing' && fresh && r5NinoEarly() && !r.phoenixMet && !r.said.wispLanding)
    return later(()=> r5LandingGlimpse());
  if(d.key === 'cata_landing' && r.said.wispFind != null && !r.said.wispFound && prizeTaken('cata_landing', r.said.wispFind))
    return later(()=>{
      if(ui.screen !== d.key || r.said.wispFound || document.querySelector('.scene-say')) return;   // gone on: said next time
      r.said.wispFound = true; saveProfile();
      say(`<b>"It wanted us to find that."</b>`);
    });
  /* The night the dead rose: three minutes on the clock (2.91), a word on
     each floor of the second tier as you run through it — and the floor's
     own first words kept for later. */
  if(stealthRush(d)){
    r5RushStart(d);
    /* (2.95) the dead are about to pour up through the gate: until they reach
       them, the Garrison's men have no ghosts on them yet */
    if(ui.r5PourDue || ui.r5RushAgain){ r5HauntHold(true); ui.r5PourDue = false; }
    if(ui.r5RushAgain){                           // caught, and sent back to the gate to run again
      ui.r5RushAgain = false;
      later(async ()=>{ await r5GhostsPour(); await say(`<b>"They are holding them again. Run — all the way up, and do not stop!"</b>`); });
      return;
    }
    if(fresh && R5_RUSH_LINES[d.key] && r5Once('rush_' + d.key)) later(()=> say(R5_RUSH_LINES[d.key]));
    return;
  }
  /* The Whalelord's word as you come onto each floor — (3.07) once a day, for
     as long as it is true (r5FloorWord); on a new day after a day's fighting,
     with the Family's men back at their posts, he says that too. */
  const word = fresh && r5DailyDue('first_' + d.key) ? r5FloorWord(d) : [];
  if(word.length){
    const back = d.stealth.kind === 'fight' && r.regrouped;
    return r5PlaceWord(d.key, 'first_' + d.key, back ? word.concat(R5_REGROUPED) : word,
                       back ? ()=>{ r.regrouped = false; saveProfile(); } : null);
  }
  /* The first time in the dark in disguise (2.91). */
  if(r.disguised && fresh && !d.under && r5Once('disguisedDark'))      // (3.18) not under the villa: it fools nobody there
    return later(()=> say(`<b>"In that uniform, nobody down here will look at you twice. Walk right past them, if you like."</b><br><br>` +
                          `<b>"And the ones who come alongside you, you can talk to. They do love to talk."</b>`));
  /* Back under the Old Town after that night: the Family has its posts back. */
  if(d.tier === 2 && r.oldTown && fresh && r5Once('afterRush'))
    return later(()=> say(`<b>"The dead have gone back down, and the Family's men are back at their posts."</b><br><br>` +
                          `<b>"It will not be as easy as that night. Keep to the dark."</b>`));
  /* With the Purple Capo beaten, he feels it: something burning in the Armoury. */
  if(r.tier1 && !r.phoenixMet && fresh && (d.key === 'cata_stair' || d.key === 'cata_stair_r1') && r5Once('senseArmoury'))
    return later(async ()=>{ await r5SenseArmoury(); await r5WispLead(); });   // (3.02) and the little light leads
  /* An evade floor warns you every time you come in (2.72) — (3.07) while the
     Family can still catch you: once the dead are loose for good, nobody on
     it has eyes for you. */
  if(d.stealth.kind === 'evade' && fresh && !recaught && d.stealth.again && !r.holdBroken) return later(()=> say(d.stealth.again));
  /* A new day, and the Family has manned its posts again (said as you come
     in fresh, which is when the men are back at their posts). */
  if(d.stealth.kind === 'fight' && fresh && r.regrouped){
    r.regrouped = false;
    saveProfile();
    later(()=> say(R5_REGROUPED));
  }
}
const R5_REGROUPED = `<b>"They are back. Every post we emptied has a man on it again."</b><br><br>` +
                     `<b>"The Family regroups every day. So will we."</b>`;
/* (3.07) What the Whalelord says as you come onto a floor, now that it comes
   round every day: the floor's `first` — while it is still true — and after
   it its `warn` (an evade floor's: one sees you, they all come) only while
   the Family can still catch you. The Landing's is the first thing he ever
   said in the dark (r5DarkIntro says it all, the first time). */
const R5_FIRST_WHILE = {
  cata_cistern:()=> !r5().holdBroken || !r5().capoBlack,   // the lanterns: the Black Capo keeps his watch out there, if he is still on his bridge
  cata_bones:  ()=> !r5().holdBroken,                      // "Far too many to fight"
  cata_stair:  ()=> !r5().capoPurple,                      // "Someone is waiting at the top of these stairs. Someone who knows you."
  cata_pit:    ()=> !r5().capoGrey,                        // "…someone is standing in the middle of the ring"
};
function r5FloorWord(d){
  const s = d.stealth, ok = R5_FIRST_WHILE[d.key];
  if(!s || !s.first || (ok && !ok())) return [];
  return s.warn && !r5().holdBroken ? [s.first, s.warn] : [s.first];
}
async function r5DarkIntro(){
  const r = r5();
  r.intro = true;
  r.said.first_cata_landing = r5Day();            // (3.07) his word for the Landing, said here for today
  saveProfile();
  await sceneWait(500);
  const whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([whale], wn, DECKS.cata_landing.stealth.first);
  await sceneSay([whale], wn,
    `<b>"I will show you what is right round us, even through the walls. A step or two, no further. Past that, it is black."</b>`);
  await sceneSay([whale], wn,
    `<b>"Those lights are lanterns. The Family's men carry them. Stay out of the light, and they cannot see you."</b>`);
  await sceneSay([whale], wn,
    `<b>"Step into a lantern's light and the man holding it will stop and look. You will see him wonder: ?"</b><br><br>` +
    `<b>"That is your moment. Get back into the dark before he is sure."</b>`);
  await sceneSay([whale], wn,
    `<b>"If one of them catches you, we fight. Beat him and he stays away for the rest of the day. ` +
    `By tomorrow the Family will have sent another man to his post."</b><br><br>` +
    `<b>"And the dead are awake down here. They hide in the dark places. Be ready."</b>`);
  await r5LandingGlimpse();                      // (3.02) and at the end of the tunnel, a little light
}

/* The Black Capo: optional, on the Cistern's bridge. */
async function r5CapoBlackBeaten(){
  const r = r5();
  const first = !r.capoBlack;
  r.capoBlack = true;
  if(first) state.inventory.protein = (state.inventory.protein || 0) + 2;
  await saveProfile();
  storyModal(npcPortrait('capo_black','🕴️',130,'transparent'), 'Black Capo defeated',
    `He straightens his coat, unhurried, as though losing were a formality.<br><br>` +
    `<b>"Enjoy it. The Padrino knows you are down here now."</b><br><br>` +
    `He walks away across the bridge and does not look back.` +
    (first ? `<br><br><b>+2 Protein Supplements</b>` : ''),
    ()=> go('cata_cistern'), { subtitle:'The Cistern' });
}
/* The Purple Capo, at the top of the Long Stair: the end of part one. */
async function r5CapoPurpleBeaten(){
  const r = r5();
  const first = !r.capoPurple;
  r.capoPurple = true;
  if(first) state.inventory.protein = (state.inventory.protein || 0) + 3;
  await saveProfile();
  const w = walkState();
  w.at = w.at || {}; w.at.cata_stair = { x:8, y:3 }; w.face = 'u';
  ui.walkFresh = false;
  go('cata_stair');
  const capo = faceNpc('capo_purple','🕴️'), whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([capo], 'Purple Capo',
    `He laughs, short and sharp, the same as he did in the caverns.<br><br><b>"Twice. You've beaten me twice now."</b>`);
  await sceneSay([capo], 'Purple Capo',
    `<b>"Go on, then. Try the gate."</b> He jerks his head at the bars behind him.<br><br>` +
    `<b>"It's barred from the other side, genius. Nobody goes any higher until the Padrino says so."</b>`);
  await sceneSay([capo], 'Purple Capo', `He tugs his hat straight and walks off down the stairs without looking back.`);
  if(first){
    await sceneSay([whale], wn,
      `<b>"He is right about the gate. It will not open from this side."</b><br><br>` +
      `<b>"And there are soldiers behind it. I can feel them. Far too many to fight our way through."</b>`);
    await sceneSay([whale], wn,
      `<b>"But my core is closer than it was. I can feel it, just above us."</b><br><br>` +
      `<b>"There will be another way. There always is."</b>`);
    /* (2.90) and in the quiet after, he feels it: the way the story goes on */
    r.said.senseArmoury = true;
    await r5SenseArmoury();
    r.tier1 = true;
    await saveProfile();
    await r5WispLead();                          // (3.02) the little light: "It wants us to follow."
    walkTeardown();
    storyModal(monPortrait('whalelord', 150, { view:'front', bare:true }), 'The first tier is clear',
      `You have cleared the first tier of the catacombs under Cosa Nostia.<br><br>` +
      `<b>+3 Protein Supplements</b><br><br>` +
      `<i>The Whalelord has felt something in the Armoury, the furthest room off the Long Stair, past the Barracks — ` +
      `and a little light is waiting to show you the way.</i>`,
      ()=> go('cata_stair'), { subtitle:'The Long Stair' });
  }
}
/* The gate at the top of the Long Stair, still shut (2.72): behind it, the
   Whalelord feels far more of the Family than anyone could fight through —
   and he cannot slip through to lift the beam, for the barrier (2.90). */
async function r5SealedGate(){
  const r = r5();
  await sceneSay([], 'The gate',
    `Iron bars from floor to ceiling, and a heavy beam across them — on the far side, where you cannot reach it.`);
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"There are soldiers on the other side of this gate. I can feel them, rows and rows of them, waiting in the dark."</b><br><br>` +
    `<b>"Far too many to fight our way through. And I cannot slip through and lift that beam, either. ` +
    `Something presses down on every ghost in this hill, like a great hand."</b>`);
  if(r.tier1 && !r.phoenixMet)
    return sceneSay([faceMon('whalelord')], whaleName(),
      `<b>"But something in the Armoury, past the Barracks, is pushing back. Something that burns. Let us go and see."</b>`);
  return sceneSay([faceMon('whalelord')], whaleName(), `<b>"Not this way. Not yet."</b>`);
}
/* What he feels once the Purple Capo is beaten — said then, or the next time
   you come to the Long Stair (2.90). */
async function r5SenseArmoury(){
  const whale = faceMon('whalelord'), wn = whaleName();
  ghostAlert();
  await sceneSay([whale], wn,
    `<b>"Wait."</b><br><br><b>"There is something else in this hill. Not the Family's men. Something dead — and so angry that it burns."</b>`);
  await sceneSay([whale], wn,
    `<b>"It is in the rooms off this stair. The furthest one: the Armoury, past the Barracks."</b>`);
  /* (3.17) the red herring (part 6 §12c): is this the cold they have felt?
     (3.35: the phoenix sets him right — gpHerring) */
  if(r5().said.malice1){
    r5().said.gpHerring = true;
    saveProfile();
    await sceneSay([whale], wn, `<b>"So much anger… Perhaps that is what we have been feeling, deep under the hill, all this time."</b>`);
  }
}

/* ============================================================
   THE GHOST PHOENIX (2.90)
   The phoenix that came before yours. The Family's men hunted it in this
   hill for its core, and it gave the last of its fire to send the core far
   away — to the Tranquil Forest, where your phoenix hatched. Its ghost rages
   at the Padrino, and at the barrier that holds down every grudge the dead of
   the hill bear him. It can never be caught.
   With the Purple Capo beaten, the Whalelord feels it in the Armoury. He
   cannot calm it. Your phoenix can, if you have one (in the party or in
   storage, crowned or not): it knows the fire, not quite knowing why, and
   the ghost knows its core — its last fire was not wasted. Its core got
   there, but there was no time to send all its power with it (2.91): what is
   left of its fire it gives your phoenix now — the Sacred Flame, and a Fire
   Stone (r5().phoenixGift) — and once you are safe in disguise it goes to
   rest (r5().phoenixGone). Without a phoenix, the Whalelord's own example
   does it: a dead whale and a living child, side by side — he wanted only
   his revenge once; now he goes where the child goes, and he promises the
   ghost his help against the Padrino too. Then it waits in the Armoury,
   until you bring it the phoenix that hatched from its core (in the
   Tranquil Forest, Region 1).
   Either way its lesson is the one the Monkey King will have to learn,
   said plainly (2.91): "Believe in the power of working together with
   others. Unity is a great fire that nothing can put out." Every ghost in
   the hill pushes at once against the Padrino's psychics: three minutes,
   the longest they can hold out (r5().rushLeft). It forces the Long Stair's
   gate open, and the dead hold the Family's men on the second tier while
   you run (r5().rush), up the crypt stair and into the Old Town's church
   (r5().oldTown). Run out of time and they catch you: ten phrases, and
   again from the gate.
   (2.92) It comes as a ball of darkness: a 2×2 black orb, pulsing slowly,
   in the middle of the Armoury. Touch it and the orb fades away while the
   ghost phoenix fades in, rising out of its centre to a little above it, and
   floats there, slowly up and down (r5OrbScene, r5TouchOrb, r5OrbEmerge).
   Art it looks for: assets/mon/ghost_phoenix_front.png (2.92; or the older
   assets/npc/ghost_phoenix.png) — until then your phoenix's own picture,
   gone dark and ghostly.
   ============================================================ */
const R5_GP = 'The ghost phoenix';
const R5_GP_ART = ['assets/mon/ghost_phoenix_front.png', 'assets/npc/ghost_phoenix.png'];
let _gpArt, _gpSrc = null;
function r5GhostPhoenixArt(){
  if(_gpArt === undefined && typeof Image !== 'undefined'){
    _gpArt = 'looking';
    const tryAt = i=>{
      if(i >= R5_GP_ART.length){ _gpArt = 'none'; return; }
      const im = new Image();
      im.onload = ()=>{ _gpArt = 'ok'; _gpSrc = R5_GP_ART[i]; };
      im.onerror = ()=> tryAt(i + 1);
      im.src = R5_GP_ART[i];
    };
    tryAt(0);
  }
  return _gpArt === 'ok';
}
r5GhostPhoenixArt();
function r5GhostPhoenixHtml(px){
  r5Css();
  return r5GhostPhoenixArt()
    ? `<img src="${_gpSrc}" alt="" style="width:${px}px;height:${px}px;object-fit:contain;">`
    : `<span class="r5-ghostfire">${monPortrait('phoenix', px, { view:'front', bare:true })}</span>`;
}
function r5Css(){
  if(document.getElementById('r5Css')) return;
  const st = document.createElement('style');
  st.id = 'r5Css';
  st.textContent = `
    /* (3.33) waist-deep in the Padrino's pool, for a moment (r5PoolDive) */
    .walk-you img{transition:translate .18s ease, clip-path .18s ease;}
    .walk-you.r5-dunk img{translate:0 24%;clip-path:inset(0 0 34% 0);}
    .r5-ghostfire{display:inline-block;line-height:0;
      filter:brightness(.6) sepia(1) hue-rotate(225deg) saturate(3) drop-shadow(0 0 8px rgba(170,90,255,.95));opacity:.92;}
    @keyframes r5Flicker{0%,100%{transform:scale(1);filter:brightness(1)}40%{transform:scale(1.07);filter:brightness(1.35)}
      70%{transform:scale(.96);filter:brightness(.85)}}
    .r5-darkglow{position:absolute;border-radius:50%;pointer-events:none;
      background:radial-gradient(circle,rgba(200,140,255,.55) 0%,rgba(120,40,200,.5) 30%,rgba(60,10,110,.32) 52%,rgba(20,0,40,0) 72%);
      animation:r5Flicker .9s ease-in-out infinite;}
    .r5-darkglow.gold{background:radial-gradient(circle,rgba(255,240,180,.85) 0%,rgba(255,190,80,.6) 32%,rgba(240,120,40,.3) 55%,rgba(240,120,40,0) 72%);}
    /* the ghost phoenix's orb (2.92; 2.95: not a ball — a glow, black at its
       heart and purple round it, like the dark fire that burns behind the
       ghost phoenix itself), pulsing slowly like a heartbeat. It stays while
       the ghost phoenix rises out of it, and floats over it. */
    .r5-orb{position:absolute;pointer-events:none;border-radius:50%;
      background:radial-gradient(circle,rgba(8,0,18,.94) 0%,rgba(30,6,56,.88) 17%,rgba(88,28,160,.6) 36%,
        rgba(140,70,235,.38) 50%,rgba(80,20,140,.18) 62%,rgba(20,0,40,0) 72%);
      animation:r5OrbPulse 2.4s ease-in-out infinite;}
    @keyframes r5OrbPulse{0%,100%{transform:scale(.86);filter:brightness(.85)}
      45%{transform:scale(1.04);filter:brightness(1.25)}60%{transform:scale(1.01);filter:brightness(1.1)}}
    /* …and the ghost phoenix, risen out of it, floating slowly up and down */
    @keyframes r5GPFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7%)}}
    .scene-actor.r5-gpfloat .sa-in{animation:r5GPFloat 3.2s ease-in-out infinite;}
    /* its fire, handed to your phoenix (2.95): a white-gold flash as it goes
       in, and your phoenix warm with it for a while after */
    .r5-giftflash{position:absolute;border-radius:50%;pointer-events:none;z-index:59;opacity:0;
      background:radial-gradient(circle,rgba(255,255,245,1) 0%,rgba(255,236,170,.95) 22%,rgba(255,186,80,.6) 46%,rgba(255,140,40,0) 72%);}
    .scene-actor.r5-warm .sa-in{filter:drop-shadow(0 0 9px rgba(255,190,80,.95)) brightness(1.18);transition:filter 1.6s ease;}
    .scene-actor.r5-warm.cool .sa-in{filter:none;}
    /* the dead, pouring up the Garrison (2.95) */
    .r5-pour{position:absolute;left:0;top:0;width:0;height:0;z-index:60;pointer-events:none;}
    .r5-pour .r5-pg{position:absolute;opacity:0;will-change:transform,opacity;
      filter:drop-shadow(0 0 7px rgba(170,110,255,.95));}
    .r5-pour .r5-pg img{display:block;width:100% !important;height:100% !important;}
    .r5-pour .r5-pg.face-r > *{scale:-1 1;}
    /* the run's clock (2.91) */
    .r5-rush{position:absolute;left:8px;top:8px;z-index:8;padding:4px 11px;border-radius:12px;
      background:rgba(52,22,86,.88);color:#f3e9ff;border:1px solid rgba(190,140,255,.7);
      font:800 13px system-ui;letter-spacing:.02em;box-shadow:0 0 10px rgba(150,90,230,.6);pointer-events:none;}
    .r5-rush b{font-size:15px;}
    .r5-rush.low{background:rgba(120,24,40,.9);border-color:#ff8a8a;box-shadow:0 0 12px rgba(255,90,90,.7);}
    @keyframes r5RushPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
    .r5-rush.crit{animation:r5RushPulse .6s ease-in-out infinite;}
    /* (3.02) Nino: the little light — a small pale glow, bobbing slowly and
       breathing, above the dark (it is a light) — and the boy, see-through
       and faintly blue, once the hold is broken */
    .r5-wisp{position:absolute;pointer-events:none;z-index:60;}
    .r5-wisp > i{position:absolute;inset:0;display:block;border-radius:50%;
      background:radial-gradient(circle,rgba(255,255,255,1) 0%,rgba(234,245,255,.95) 16%,rgba(182,216,255,.62) 38%,
        rgba(150,196,255,.2) 58%,rgba(140,190,255,0) 72%);
      box-shadow:0 0 16px 5px rgba(175,215,255,.32);animation:r5WispBob 2.6s ease-in-out infinite;}
    @keyframes r5WispBob{0%,100%{transform:translateY(0) scale(.9)}50%{transform:translateY(-16%) scale(1.06)}}
    /* (3.03) his ghost is the designer's ghost_child picture, shown as drawn
       with a soft glow; only the stand-in (no picture yet) is tinted */
    .scene-actor.r5-nino .sa-in{filter:drop-shadow(0 0 7px rgba(170,215,255,.9));}
    .scene-actor.r5-nino .sa-in .walk-emoji{opacity:.62;filter:brightness(1.25) saturate(.3) sepia(.2) hue-rotate(180deg);}
    .r5-nino-face{display:inline-block;line-height:0;filter:drop-shadow(0 0 6px rgba(170,215,255,.9));}
    .r5-nino-face .walk-emoji{opacity:.78;filter:brightness(1.2) saturate(.3) sepia(.2) hue-rotate(180deg);}
    /* (3.04) the Madrina's photograph: two little boys on the villa's steps */
    .r5-photo{display:inline-block;padding:7px 7px 16px;background:#f4ecd8;border-radius:3px;
      box-shadow:0 3px 10px rgba(0,0,0,.35);transform:rotate(-2deg);margin:4px 0 6px;}
    .r5-photo-in{position:relative;width:100%;height:100%;overflow:hidden;border-radius:2px;
      background:linear-gradient(#cdb48c 0%,#b89a70 58%,#8e7452 58%,#a08462 100%);
      filter:sepia(.85) contrast(.95) brightness(1.02);display:flex;align-items:flex-end;justify-content:center;gap:2px;}
    .r5-photo-step{position:absolute;left:0;right:0;bottom:0;height:22%;background:rgba(90,70,48,.55);}
    .r5-photo-in img, .r5-photo-in .walk-emoji{position:relative;object-fit:contain;object-position:bottom;}
    .r5-photo-in .big{margin-bottom:6%;} .r5-photo-in .small{margin-bottom:6%;}
    /* the night the dead rose: the little light keeps one man's ghosts off him */
    .walk-ent.guard.nino-shield .guard-haunt{opacity:.25;transform:scale(1.7);transition:opacity .6s ease,transform .6s ease;}
    .walk-ent.guard.nino-shield > img{animation:none;}
    /* (3.17) the cold under the island (Nemesis, part 6 §12c): the edges of
       the screen go dark red and purple, twice, like a slow heartbeat */
    #r5Dread{position:fixed;inset:0;z-index:84;pointer-events:none;opacity:0;
      background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 28%,rgba(70,8,34,.5) 60%,rgba(24,2,30,.93) 100%);}
    /* …a picture in the Whalelord's mind: dark all round, the picture high up
       (the talk box is at the bottom), drifting */
    #r5Vision{position:fixed;inset:0;z-index:84;pointer-events:none;opacity:0;display:flex;justify-content:center;align-items:flex-start;
      background:radial-gradient(ellipse at 50% 34%,rgba(80,12,44,.3) 0%,rgba(42,4,42,.74) 40%,rgba(8,0,12,.95) 72%);}
    #r5Vision .rv-pic{margin-top:10vh;width:min(74vw,340px);height:min(74vw,340px);display:flex;align-items:center;justify-content:center;
      filter:sepia(.3) saturate(1.25) drop-shadow(0 0 24px rgba(210,40,72,.6));animation:r5VisionDrift 5s ease-in-out infinite;}
    #r5Vision .rv-pic img{width:100%;height:100%;object-fit:contain;}
    #r5Vision .rv-emoji{font-size:min(38vw,180px);line-height:1;opacity:.85;}
    @keyframes r5VisionDrift{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3%) scale(1.03)}}
    /* the Family's Ghost Guardian, risen at the Ghost Master's shoulder: a
       purple glow, and it turns slowly */
    .scene-actor.r5-guard .sa-in{filter:drop-shadow(0 0 8px rgba(170,90,255,.85));}
    .scene-actor.r5-guard .sa-in > *{transition:scale .7s ease;}
    /* the little light, shrinking back from it */
    .r5-wisp.shy > i{transform:scale(.55) !important;opacity:.6;transition:transform .5s ease,opacity .5s ease;animation:none;}
    /* the Fairy Stone on its silk, glinting */
    .scene-actor.r5-fstone .sa-in{filter:drop-shadow(0 0 6px rgba(205,235,255,.95));animation:r5Glint 1.8s ease-in-out infinite;}
    @keyframes r5Glint{0%,100%{filter:drop-shadow(0 0 4px rgba(205,235,255,.8)) brightness(1)}50%{filter:drop-shadow(0 0 10px rgba(225,245,255,1)) brightness(1.35)}}
    .r5-silk{position:absolute;pointer-events:none;border-radius:50%;background:radial-gradient(ellipse,rgba(10,6,16,.95) 0%,rgba(20,10,30,.85) 55%,rgba(20,10,30,0) 72%);}
    /* the letters he writes in the air */
    .r5-airname{letter-spacing:.35em;color:#cfe6ff;text-shadow:0 0 8px rgba(160,210,255,.95);}
    /* (3.18) a chalk drawing, shown large on its stone (the talk box below) */
    #r5Chalk{position:fixed;inset:0;z-index:84;pointer-events:none;opacity:0;display:flex;justify-content:center;align-items:flex-start;
      background:rgba(6,4,10,.5);}
    #r5Chalk .rc-wall{margin-top:7vh;width:min(92vw,470px);aspect-ratio:3/2;border-radius:10px;padding:10px;box-sizing:border-box;
      background:radial-gradient(ellipse at 45% 40%,#47424e 0%,#2d2933 62%,#1d1a22 100%);
      box-shadow:0 10px 30px rgba(0,0,0,.6),inset 0 0 34px rgba(0,0,0,.65);}
    #r5Chalk .rc-pic{width:100%;height:100%;}
    /* the dead, hanging back at the edge of Nino's wall */
    .scene-actor.r5-held .sa-in{filter:drop-shadow(0 0 7px rgba(170,120,255,.9)) grayscale(.4);}
  `;
  document.head.appendChild(st);
}
/* A monster (or the ghost) standing on the deck for a scene: an actor, as
   sceneActor makes them, drawn with monPortrait so it finds its own art. */
function r5MonActor(id, species, x, y, size, opts){
  sceneCss();
  const world = $('#walkWorld'); if(!world) return null;
  opts = opts || {};
  let el = document.getElementById('sa-' + id);
  if(!el){ el = document.createElement('div'); el.className = 'scene-actor'; el.id = 'sa-' + id; world.appendChild(el); }
  const T = WALK_T;
  el._o = { x, y, w:size, h:size };
  el.style.left = (x * T) + 'px'; el.style.top = (y * T) + 'px';
  el.style.width = el.style.height = (size * T) + 'px';
  el.style.zIndex = opts.z != null ? opts.z : (10 + Math.floor(y + size));
  el.classList.toggle('bob', !!opts.bob);
  el.innerHTML = `<div class="sa-in">${opts.html ||
    monPortrait(species, Math.round(T * size), { view:'front', bare:true, crowned:!!opts.crowned })}</div>`;
  return el;
}
function r5MoveActor(id, x, y, ms, fade){
  const el = document.getElementById('sa-' + id);
  if(!el) return sceneWait(ms);
  const T = WALK_T;
  /* (2.95) facing the way it goes: the pictures face left, so going right
     it is flipped */
  if(el._o && Math.abs(x - el._o.x) > 0.05) actorFace(el, x > el._o.x);
  if(el._o){ el._o.x = x; el._o.y = y; }
  el.style.transition = `left ${ms * SCENE_SPEED}ms ease-in-out, top ${ms * SCENE_SPEED}ms ease-in-out, opacity ${ms * SCENE_SPEED}ms ease`;
  void el.offsetWidth;
  el.style.left = (x * T) + 'px'; el.style.top = (y * T) + 'px';
  if(fade) el.style.opacity = '0';
  return sceneWait(ms);
}
/* A dark fire (or, `gold`, a bright one) burning on nothing at all. */
function r5DarkGlow(id, cx, cy, tiles, gold){
  r5Css();
  const world = $('#walkWorld'); if(!world) return null;
  const T = WALK_T, dd = tiles * T;
  const g = document.createElement('div');
  g.className = 'scene-glow r5-darkglow' + (gold ? ' gold' : '');
  g.id = 'sg-' + id;                         // (sceneGlowOut fades it; sceneClear clears it)
  g.style.left = (cx * T - dd / 2) + 'px'; g.style.top = (cy * T - dd / 2) + 'px';
  g.style.width = g.style.height = dd + 'px';
  g.style.zIndex = 58; g.style.opacity = '0';
  g.style.transition = `opacity ${700 * SCENE_SPEED}ms ease`;
  world.appendChild(g);
  void g.offsetWidth;
  g.style.opacity = '1';
  return g;
}
/* The ghost phoenix's orb (2.92): over the 2×2 tiles whose top-left is
   (x, y). (2.95) Not a ball: a pulsing black-and-purple glow, R5_ORB_GLOW
   tiles across, centred on the middle of those tiles — behind the ghost
   phoenix when it rises out of it. A scene glow, so sceneClear clears it. */
const R5_ORB = { x:5, y:5 };                     // its tiles in the Armoury: (5,5)–(6,6)
const R5_ORB_GLOW = 3.4;
function r5PaintOrb(id, x, y, fadeIn){
  r5Css();
  const world = $('#walkWorld'); if(!world) return null;
  const T = WALK_T, D = R5_ORB_GLOW;
  let o = document.getElementById('sg-' + id);
  if(!o){ o = document.createElement('div'); o.id = 'sg-' + id; world.appendChild(o); }
  o.className = 'scene-glow r5-orb';
  o.style.left = ((x + 1 - D / 2) * T) + 'px'; o.style.top = ((y + 1 - D / 2) * T) + 'px';
  o.style.width = o.style.height = (D * T) + 'px';
  o.style.zIndex = 10 + Math.floor(y);           // under the ghost phoenix (10 + its feet)
  if(fadeIn){
    o.style.transition = 'none'; o.style.opacity = '0';
    void o.offsetWidth;
    o.style.transition = `opacity ${fadeIn * SCENE_SPEED}ms ease`;
    o.style.opacity = '1';
  }
  return o;
}
/* Out of the orb: the ghost phoenix (2 tiles) fades in, rising from the
   glow's centre to a little above it; then it floats, slowly up and down,
   (2.95) the dark glow still pulsing under it — and turned to face you. Its
   box's top-left ends at (x, y - 0.6). */
const R5_GP_RISE = 0.6, R5_GP_EMERGE_MS = 2600;
async function r5OrbEmerge(orbId, actorId, x, y, opacity){
  const T = WALK_T, MS = R5_GP_EMERGE_MS;
  const a = r5MonActor(actorId, 'phoenix', x, y, 2, { html:r5GhostPhoenixHtml(Math.round(T * 2)) });
  if(a){
    a.classList.remove('r5-gpfloat');
    a.style.transition = 'none'; a.style.opacity = '0';
    void a.offsetWidth;
    a.style.transition = `top ${MS * SCENE_SPEED}ms ease-out, opacity ${MS * SCENE_SPEED}ms ease-in`;
    a.style.top = ((y - R5_GP_RISE) * T) + 'px';
    a.style.opacity = String(opacity != null ? opacity : 1);
    a._o.y = y - R5_GP_RISE;
    r5FaceGP(x + 1);                              // everyone to it, and it to you
  }
  /* the orb's "!" goes as it rises */
  document.querySelectorAll('.walk-mark').forEach(m=>{ if(Math.abs(parseFloat(m.style.left) - (x + 1) * T) < 1) m.remove(); });
  await sceneWait(MS);
  if(a) a.classList.add('r5-gpfloat');
  return a;
}
/* Is the orb in the Armoury now? The night it is met, once it has shown
   itself; and while it waits there afterwards, until it is touched on this
   visit (ui.gpOut). */
function r5OrbHere(){
  const r = r5();
  if(!r.tier1) return false;
  if(!r.phoenixMet) return !!r.said.gpOrb;
  return r5GPWaiting() && !ui.gpOut;
}
/* Nobody stands watch in a haunted armoury. */
function r5GPHaunts(){ const r = r5(); return r5GPWaiting() || !!(r.tier1 && !r.phoenixMet && r.said.gpOrb); }
/* The first time in, with the Purple Capo beaten: the orb appears, the
   soldatos run, and the Whalelord says to touch it. After that it is simply
   there, until it is touched. */
async function r5OrbScene(world, d){
  const r = r5();
  if(r.said.gpOrb){ r5PaintOrb('gporb', R5_ORB.x, R5_ORB.y); r5FaceGP(R5_ORB.x + 1); return; }
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  if(typeof releaseKeys === 'function') releaseKeys();
  const whale = faceMon('whalelord'), wn = whaleName();
  await sceneWait(700);
  ghostAlert();
  await sceneSay([whale], wn, `<b>"Here. It is in here."</b>`);
  r5PaintOrb('gporb', R5_ORB.x, R5_ORB.y, 1400);
  r5FaceGP(R5_ORB.x + 1);                        // everyone turns to look at it
  await sceneWait(1200);
  await sceneSay([], '',
    `In the middle of the room, where there was nothing a moment ago, hangs a ball of darkness — blacker than the dark around it, pulsing slowly, like a heartbeat.`);
  if(r5GuardsFlee(d.key)){
    paintStealth(d.key, d);                       // their lanterns go with them
    await sceneSay([], '', `The soldatos see it too. Their lanterns shake — and then they are running, every one of them, out past you and away.`);
  }
  /* (3.02) the little light that led you here drifts in after you */
  if(r5NinoEarly()){
    const seen = !!r5().said.wispLanding;         // (a save that never saw it: "A little light")
    if(!seen){ r5().said.wispLanding = true; saveProfile(); }
    r5Wisp(0.6, 5.2, 600);
    await r5WispTo(5.5, 3.1, 1600);
    await sceneSay([], '', `${seen ? 'The' : 'A'} little light drifts in after you, and waits beside the dark ball.`);
  }
  await sceneSay([whale], wn,
    `<b>"There is something inside it. Something dead — and very, very angry."</b><br><br>` +
    `<b>"Go on. Touch it. Whatever it is, it is no friend of the Family."</b>`);
  r.said.gpOrb = true;
  await saveProfile();
  w.busy = false;
  ui.sceneRunning = false;
  refreshWalkAll();                              // its "!" and its Touch
}
/* Touch it: the night it is met, the whole scene; afterwards, it rises out
   of the orb to talk to you. */
function r5TouchOrb(){
  const r = r5();
  if(ui.sceneRunning || walkState().busy) return;
  if(!r.phoenixMet) return r5PhoenixScene(null, DECKS.cata_stair_r2);
  return r5ArmouryPhoenix();
}
/* Where your phoenix comes out (2.92): beside you, on the far side from the
   ghost (whose middle is at tile column cx). */
function r5BesideYou(p, cx){ const left = p.x < cx; return { x:p.x + (left ? -0.9 : 0.6), y:p.y - 0.9, left }; }
/* Everyone turns to face the ghost phoenix (2.92): you, the Whalelord and
   your phoenix — and (2.95) the ghost phoenix turns to face YOU, as it talks
   to you. Every picture faces left, so whoever has the other on their right
   is flipped (face-r, 13-walkmap.js); straight above or below, they keep the
   way they face. gx is its middle, in tiles; null leaves everyone as they
   are (to walk on facing the way they go). */
function r5FaceGP(gx){
  if(gx == null) return;
  const w = walkState(), p = w.at && w.at[w.deck];
  if(p) walkFaceToward(gx);
  walkGhostFaceToward(gx);
  const m = document.getElementById('sa-myphoenix');
  if(m) actorFaceToward(m, gx);
  if(p) ['gphoenix', 'gpwait', 'gpfare'].forEach(id=> actorFaceToward(id, p.x + 0.5));
}
/* In the Armoury, wherever the ghost phoenix (or its orb) is, face it — and
   it faces you. With nothing there, you face the way you walk. */
function r5FaceGPHere(){
  if(walkState().deck !== 'cata_stair_r2') return;
  const a = document.getElementById('sa-gphoenix') || document.getElementById('sa-gpwait');
  if(a && a._o) return r5FaceGP(a._o.x + a._o.w / 2);
  if(document.getElementById('sg-gporb')) return r5FaceGP(R5_ORB.x + 1);
}
/* Your phoenix, if you have one — out with you, or in storage. */
function r5MyPhoenix(){
  const inParty = (state.party || []).find(m=> m && m.species === 'phoenix');
  if(inParty) return { mon:inParty, stored:false };
  const stored = (state.storage || []).find(m=> m && m.species === 'phoenix');
  return stored ? { mon:stored, stored:true } : null;
}
function r5PhoenixDue(d){
  const r = r5();
  return d.key === 'cata_stair_r2' && !!r.tier1 && !r.phoenixMet && !ui.sceneRunning;
}
/* Every man still in the room sees it, and runs: off watch for today. */
function r5GuardsFlee(id){
  const st = ui.stealth && ui.stealth[id];
  if(!st || !st.guards.length) return 0;
  const list = stealthBeaten(id), n = st.guards.length;
  st.guards.forEach(g=>{
    if(!list.includes(g.id)) list.push(g.id);
    const el = document.getElementById('guard-' + g.id);
    if(el){
      el.style.transition = `opacity ${700 * SCENE_SPEED}ms ease`;
      el.style.opacity = '0';
      setTimeout(()=> el.remove(), 800 * SCENE_SPEED);
    }
  });
  st.guards = [];
  saveProfile();
  return n;
}
async function r5PhoenixScene(world, d){
  const r = r5();
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  if(typeof releaseKeys === 'function') releaseKeys();
  const whale = faceMon('whalelord'), wn = whaleName();
  const gp = ()=> r5GhostPhoenixHtml(64);
  const p = (w.at && w.at[d.key]) || { x:4, y:6 };
  /* (2.92) touched, the orb fades and it rises out of it: its 2-tile box
     ends at (GX, GY), floating; its middle at (CX, CY) */
  const GX = R5_ORB.x, GY = R5_ORB.y - R5_GP_RISE, CX = GX + 1, CY = GY + 1;
  let gpX = GX;                                     // where it floats now
  r5FaceGP(CX);                                    // everyone facing it
  if(document.getElementById('sg-gporb'))
    await sceneSay([], '', `You put out your hand. The darkness is cold — and then, all at once, it is warm.`);
  await r5OrbEmerge('gporb', 'gphoenix', R5_ORB.x, R5_ORB.y);
  await sceneWait(500);
  r5DarkGlow('gp2', CX, CY + 0.2, 3.4);
  await sceneShake(600, t=> 0.10 * (1 - t / 600));
  await sceneSay([gp()], R5_GP,
    `<b>"WHERE IS HE?"</b><br><br>Its voice roars like a fire up a chimney.<br><br><b>"The Padrino. Where is he hiding?"</b>`);
  await sceneSay([gp()], R5_GP,
    `<b>"His men hunted me through this hill for my core — the fire in my heart. With the last of my strength I sent it far away, where they could never have it."</b>`);
  /* (2.91) said plainly: who holds the dead down, and how */
  await sceneSay([gp()], R5_GP,
    `<b>"Now I am dead, and still he keeps us down. He has psychics working for him. With their minds they hold every ghost in this hill down, so that we can never touch his Family."</b><br><br>` +
    `<b>"Every night I fight them on my own. Every night I lose. But not tonight. TONIGHT—"</b>`);
  await sceneShake(500, t=> 0.12 * (1 - t / 500));
  await sceneSay([whale], wn,
    `<b>"Peace, friend. I am dead too. We are not your enemies."</b><br><br>` +
    `<b>"Your anger is burning you away. Stop a moment, and let us help you."</b>`);
  r5DarkGlow('gp3', CX, CY, 5);
  await sceneShake(700, t=> 0.16 * (1 - t / 700));
  await sceneSay([gp()], R5_GP,
    `<b>"STOP?"</b> The dark flames leap to the ceiling.<br><br>` +
    `<b>"The dead of this hill have waited long enough, whale! Out of my way!"</b>`);
  await sceneGlowOut(['gp3'], 500);
  await sceneSay([whale], wn, `<b>"...It will not hear me."</b>`);

  const mine = r5MyPhoenix();
  if(mine){
    /* Your phoenix: it knows the fire, not quite knowing why. */
    const m = mine.mon, crowned = isCrowned(m), me = displayName(m);
    const face = ()=> faceMon('phoenix', { crowned });
    /* (2.92) beside you, on the far side from the ghost */
    const bes = r5BesideYou(p, CX), left = bes.left, MX = bes.x, MY = bes.y;
    if(mine.stored){
      await sceneSay([], '', `A streak of light comes in through the walls from somewhere far away — your phoenix, called by something it cannot name.`);
    } else {
      await sceneSay([], '', `Something stirs beside you. Your phoenix comes out on its own, blinking at the dark fire.`);
    }
    r5MonActor('myphoenix', 'phoenix', MX, MY, 1.3, { crowned, bob:true });
    r5FaceGP(CX);
    await sceneWait(500);
    await sceneSay([face()], me,
      `<b>"...?"</b><br><br>It tilts its head at the dark fire, as if it is listening to a song it half remembers.`);
    await sceneSay([face()], me, `<b>"That fire... I know that fire. Don't I?"</b>`);
    await sceneGlowOut(['gp2'], 500);
    await sceneSay([gp()], R5_GP, `The roaring stops.<br><br><b>"...You."</b>`);
    const NX = GX + (left ? -0.7 : 0.7);             // it drifts toward your phoenix
    await r5MoveActor('gphoenix', NX, GY, 900);
    gpX = NX;
    await sceneSay([gp()], R5_GP,
      `<b>"You have my fire in you. My core."</b> Its voice is very small now. <b>"Is it really you?"</b>`);
    await sceneSay([face()], me,
      `<b>"I don't remember you."</b><br><br>It hops a little closer, unsure.<br><br><b>"But I think... I think I was waiting for you."</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"Look at you. Look how you have grown."</b><br><br>` +
      `<b>"When they came for me, I sent my core far, far away, to a quiet forest, to hatch where they could never find it. I never knew if it got there."</b>`);
    r5DarkGlow('gpgold', NX + 1, GY + 1.2, 3.2, true);
    await sceneSay([gp()], R5_GP,
      `<b>"It did. And here you are — strong, and bright, and loved."</b><br><br>` +
      `The dark flames flicker, and for a moment they burn gold.<br><br>` +
      (crowned ? `<b>"And crowned, too. You have grown further than I ever did."</b><br><br>` : '') +
      `<b>"Then my last fire was worth it. Every spark of it."</b>`);
    await sceneGlowOut(['gpgold'], 600);
    /* (2.91) the rest of its power: there was no time to send it all */
    await r5PhoenixGift(mine, { GX:NX + 1, GY:GY + 1.2 });
    await sceneSay([gp()], R5_GP,
      `<b>"Listen to me, little one. I have been a fool. Every night I have fought them alone, and every night I have lost."</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"Believe in the power of working together with others. Unity is a great fire that nothing can put out."</b>`);
  } else {
    /* No phoenix of yours: the Whalelord's own example does it (2.91: his,
       told in full — and his promise). */
    await sceneSay([gp()], R5_GP,
      `It turns its burning eyes on the Whalelord, and then on you.<br><br><b>"A dead whale, walking with a living child. Why?"</b>`);
    await sceneSay([whale], wn,
      `<b>"Because I was a fool once, too. When they killed me, I wanted only one thing: to make them pay, and to get my core back. ` +
      `I did not care who I put in danger for it. Not even this child."</b>`);
    await sceneSay([whale], wn,
      `<b>"This child helped me anyway, and asked for nothing back. Together we have come further than I ever could on my own. ` +
      `So now I go where this child goes. That comes first."</b>`);
    await sceneSay([whale], wn,
      `<b>"I still want my core back. And the Padrino has a great deal to answer for — to me as well as to you. ` +
      `Help us, and we will help you. When we face him, we will face him together."</b>`);
    await sceneGlowOut(['gp2'], 500);
    await sceneSay([gp()], R5_GP, `The flames sink lower.<br><br><b>"...Together."</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"I have been a fool. Every night I have fought them alone, and every night I have lost."</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"Believe in the power of working together with others. Unity is a great fire that nothing can put out."</b>`);
    /* what it would have given a phoenix of yours, and where one might be found */
    await sceneSay([gp()], R5_GP,
      `<b>"My core went far away, across the sea, to a quiet forest. If a phoenix ever hatched from it, it has my fire in it."</b><br><br>` +
      `<b>"I had no time to send all my power with my core. What is left of it is here, with me — and it belongs to that phoenix, not to me. ` +
      `If you ever find it, bring it to me."</b>`);
  }
  /* (3.02) the little light that brought you here (part 6 §12b, scene 3).
     (3.35) The designer: "ghost phoenix's dialogue should not promise the
     little light not to have war. but instead persuade the little light that
     padrino must be stopped and that a greater evil lurks behind him
     (referencing nemesis)". It is Nemesis that whispers to the Padrino in his
     dreams (part 6 §12c); the phoenix has felt it in the hill, and the little
     light knows it too. And the cold the Whalelord and the Forest Fairy have
     felt is this: the Whalelord's guess at the stair (r5SenseArmoury) set
     right, and said again as the cold comes back (r5Malice, gpBehind). */
  if(r5NinoEarly() && (document.getElementById('sg-wisp') || r.said.wispLanding)){
    if(!document.getElementById('sg-wisp')) r5Wisp(5.5, 3.1, 600);
    await sceneSay([gp()], R5_GP, `It turns its burning eyes on the little light.<br><br><b>"So, little light. You brought them to me."</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"Every night I want to burn this whole Family down. And every night, you ask me not to. You do not want anyone hurt. Not even them."</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"But listen to me, little light. The Padrino must be stopped. His men hunt monsters for their cores — and he will not stop until he has them all."</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"And he is not the worst of it. Something is behind him. Something very old, and very cruel. At night it whispers to him, and he does what it says."</b><br><br>` +
      `The little light trembles.`);
    if(r.said.malice1)
      await sceneSay([whale], wn, r.said.gpHerring
        ? `<b>"Something very old… The cold! We have felt it, deep under the island. I thought it was you, phoenix."</b>`
        : `<b>"Something very old… The cold! We have felt it too, deep under the island."</b>`);
    if(r.said.gpHerring) await sceneSay([gp()], R5_GP, `<b>"Me? I burn, whale. That thing is cold."</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"If nobody stops the Padrino, that thing gets everything it wants. We cannot wait any longer."</b><br><br>` +
      `The little light sinks low, for a long moment. Then it bobs up and down. Yes.`);
    r.said.gpBehind = true;                        // told: something is behind him (r5Malice)
  }
  /* The plan, and the three minutes (2.91). (3.35) The designer: it "should
     not assure the player that if they fail, the ghosts will push again …
     the phoenix should not lower narrative stakes. the boys should feel a
     sense of urgency". Caught, you are still sent back to run again
     (r5RushOut) — it just does not say so beforehand. */
  await sceneSay([gp()], R5_GP,
    `<b>"So we will not fight them alone any more. If every ghost in this hill pushes at once, we can break free of the psychics — for a little while."</b>`);
  await sceneSay([gp()], R5_GP,
    `<b>"Three minutes. That is the longest we can hold out before their minds press us down again."</b><br><br>` +
    `<b>"For those three minutes the dead will hold every one of the Padrino's soldiers on the floors above — soldatos, capos, all of them."</b>`);
  await sceneSay([gp()], R5_GP,
    `<b>"So run. Up through all four floors and out at the top, into the church."</b><br><br>` +
    `<b>"We cannot hold them one second longer. If the time runs out before you are through, they will catch you. Do not stop for anything!"</b>`);
  if(mine){
    await sceneSay([faceMon('phoenix', { crowned:isCrowned(mine.mon) })], displayName(mine.mon), `<b>"Will I see you again?"</b>`);
    await sceneSay([gp()], R5_GP, `<b>"Before I rest, little one. I promise."</b>`);
  }
  /* It rises, screaming, and the whole hill answers — (2.95) its dark glow
     going with it. */
  r5DarkGlow('gp4', gpX + 1, GY, 7);
  sceneShake(1400, t=> 0.18 * Math.max(0, 1 - t / 1400));
  sceneGlowOut(['gporb'], 1100);
  await r5MoveActor('gphoenix', gpX, GY - 6, 1100, true);
  await sceneCurtain(true, 700);
  sceneClear();
  await sceneCurtainText('The ghost phoenix screams — and the whole hill answers.', 700);
  await sceneWait(1500);
  await sceneCurtainText('', 400);
  await sceneCurtainText('At the top of the Long Stair, the beam behind the gate bursts into purple fire. The gate swings open.', 700);
  await sceneWait(1900);
  await sceneCurtainText('', 400);
  await sceneCurtainText('And the dead pour through it, up into the dark above — a ghost for every one of the Family\'s men.', 700);
  await sceneWait(1900);
  await sceneCurtainText('', 400);
  r.phoenixMet = true;
  r.phoenixKin = !!mine;
  r.tier2Open = true;
  r.rush = true;
  r.rushLeft = R5_RUSH_MS;
  r.said['rush_cata_garrison'] = true;            // said below, as the curtain lifts
  await saveProfile();
  w.busy = false;
  ui.r5PourDue = true;                           // (2.95) the soldatos' ghosts wait for the pour
  goFloor('cata_garrison', 'gate');
  await sceneWait(1200);
  await sceneCurtain(false, 800);
  await r5GhostsPour();
  await sceneSay([faceMon('whalelord')], whaleName(), R5_RUSH_LINES.cata_garrison);
  if(r5NinoEarly()) await r5WispShield();        // (3.02) the little light keeps one man's ghosts off him
  ui.sceneRunning = false;
}
/* The ghost phoenix's last power, given to your phoenix (2.91): the Sacred
   Flame (state.sacredFlameGranted, 05-battle-flow.js), and its fire burnt
   into a Fire Stone. Said in the Armoury — the first time, or later, when
   you bring it a phoenix. `at` is where its glow is, in tiles. */
async function r5PhoenixGift(mine, at){
  const r = r5(), w = walkState();
  const m = mine.mon, crowned = isCrowned(m), me = displayName(m);
  const gp = ()=> r5GhostPhoenixHtml(64), face = ()=> faceMon('phoenix', { crowned });
  await sceneSay([gp()], R5_GP,
    `<b>"But listen. When they came for me, I sent you away in such a hurry. Your core got there safely — but there was no time to send all my power with it."</b><br><br>` +
    `<b>"Some of my fire stayed behind, here, with me. It has been waiting for you all this time."</b>`);
  await sceneSay([gp()], R5_GP, `<b>"It is yours. It always was. Take it now."</b>`);
  const el = document.getElementById('sa-myphoenix');
  await r5GiftFlow({ x:at.GX, y:at.GY }, el);     // (2.95) its glow, across to yours
  const had = ownsStone('fireStone');
  state.sacredFlameGranted = true;
  if(!had) addStone('fireStone', 1);
  r.phoenixGift = true;
  await saveProfile();
  await sceneSay([face()], me,
    `It glows gold from the inside, like a coal when you blow on it.<br><br><b>"It's warm... I feel bigger. Brighter."</b>`);
  if(el) el.classList.add('cool');               // …and the glow sinks in, slowly
  if(!had) await sceneSay([], '',
    `Something drops at your feet with a soft clink: a stone, warm as a coal. The ghost phoenix's fire, burnt into stone.`);
  const sf = SACRED_FLAME, rb = REBIRTH;
  await sceneSay([uiIcon('fire_stone', 64, '🔥')], 'The ghost phoenix\'s gift',
    `<b>🔥 Sacred Flame</b> — after Nova or Incinerate, ${escapeHtml(me)} may write <b>${sf.words} bonus words</b>; get them right and a ` +
    `Sacred Flame burns every enemy at the start of each of your next <b>${sf.turns} turns</b> for <b>${sf.pct}× its ATK</b>. ` +
    `Flames stack without limit. With its Max ability learnt it also has <b>Rebirth</b>: if it faints while a flame burns, ` +
    `write ${rb.words} words and it rises again with ${Math.round(rb.hp * 100)}% HP, once a battle.` +
    (had ? '' : `<br><br><b>🔥 Fire Stone</b> — a Fire monster carrying it learns half again as fast (<b>1.5× experience</b>), ` +
                `and at a level ceiling past 100 it is the stone it charges to break through.`));
  r.phoenixKin = true;
  await saveProfile();
}
/* (2.95) Its fire, handed over. The ghost phoenix's gold glow drifts slowly
   from it (`from`, tiles) across to your phoenix (`el`) and settles round its
   middle; a warm, bright pulse as the power goes in; then what is left of the
   glow shrinks, pulsing, into your phoenix and is gone — the power settling
   in. Your phoenix keeps a warm glow of its own (r5-warm) until it is told
   to cool. */
const R5_GIFT_MS = { show:600, drift:3200, pulse:900, settle:2600 };
async function r5GiftFlow(from, el){
  const world = $('#walkWorld');
  if(!world) return;
  const T = WALK_T, M = R5_GIFT_MS, o = el && el._o;
  const to = o ? { x:o.x + o.w / 2, y:o.y + o.h / 2 } : { x:from.x, y:from.y };
  const D0 = 3.6, D1 = 2.5;                       // across: round the ghost phoenix, then round yours
  const g = r5DarkGlow('gpgift', from.x, from.y, D0, true);
  if(!g) return;
  const put = (el2, cx, cy, dTiles)=>{
    const dd = dTiles * T;
    el2.style.left = (cx * T - dd / 2) + 'px'; el2.style.top = (cy * T - dd / 2) + 'px';
    el2.style.width = el2.style.height = dd + 'px';
  };
  await sceneWait(M.show);
  /* across, slowly, in a gentle arc */
  await r5Tween(M.drift, t=>{
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    put(g, from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e - Math.sin(Math.PI * e) * 0.5, D0 + (D1 - D0) * e);
  });
  /* the warm, bright pulse: in it goes */
  if(el){ el.classList.remove('cool'); el.classList.add('r5-warm'); }
  const flash = document.createElement('div');
  flash.className = 'r5-giftflash';
  world.appendChild(flash);
  sceneShake(500, t=> 0.06 * (1 - t / 500));
  if(o) sceneSparkles(o.x, o.y, o.w, o.h, 1400);
  await r5Tween(M.pulse, t=>{
    put(flash, to.x, to.y, D1 * (0.6 + 1.0 * t));
    flash.style.opacity = String(t < 0.3 ? t / 0.3 : Math.max(0, 1 - (t - 0.3) / 0.7));
  });
  flash.remove();
  /* what is left of it, shrinking and pulsing into your phoenix */
  g.style.transition = 'none';
  await r5Tween(M.settle, t=>{
    put(g, to.x, to.y, D1 * (1 - 0.85 * t) * (1 + 0.16 * Math.sin(t * Math.PI * 8)));
    g.style.opacity = String(Math.max(0, 1 - Math.pow(t, 1.6)));
  });
  g.remove();
}
/* f(t), t from 0 to 1, over ms at the scene's speed. */
function r5Tween(ms, f){
  const dur = Math.max(1, ms * SCENE_SPEED), t0 = performance.now();
  return new Promise(done=>{
    const frame = now=>{
      const t = Math.min(1, (now - t0) / dur);
      f(t);
      if(t < 1) requestAnimationFrame(frame); else done();
    };
    requestAnimationFrame(frame);
  });
}
/* Gone to rest (2.91), once its fire is given and you are safe in disguise:
   at Ugo's, the moment you are; or in the Armoury, if you bring it your
   phoenix after. */
async function r5PhoenixFarewell(where){
  const r = r5(), w = walkState();
  const p = (w.at && w.at[w.deck]) || { x:6, y:8 };
  const gp = ()=> r5GhostPhoenixHtml(64);
  const mine = r5MyPhoenix();
  const G = where === 'tailor' ? { x:9, y:6 } : { x:5, y:6 };
  if(where === 'tailor'){
    ghostAlert();
    /* (2.92) up through the floorboards as its orb, and out of it, faint */
    r5PaintOrb('gpforb', G.x - 0.5, G.y - 0.5, 1000);
    r5FaceGP(G.x + 0.5);
    await sceneWait(1100);
    await r5OrbEmerge('gpforb', 'gpfare', G.x - 0.5, G.y - 0.5, 0.62);
    await sceneSay([], '',
      `A ball of darkness rises up through the floorboards, and out of it rises the ghost phoenix, so faint you can see the room through it.<br><br>` +
      `Ugo goes on folding his cloth. He sees nothing.`);
    await sceneSay([gp()], R5_GP, `<b>"You made it through. I held them for as long as I could."</b>`);
  }
  await sceneSay([gp()], R5_GP,
    `<b>"The psychics have pressed us back down, as I knew they would. But I have nothing left to fight them with now. ` +
    `I gave the last of my fire away — and it was never really mine to keep."</b><br><br><b>"Now I can rest."</b>`);
  if(mine){
    const crowned = isCrowned(mine.mon), me = displayName(mine.mon);
    if(!document.getElementById('sa-myphoenix')){
      if(mine.stored) await sceneSay([], '', `A streak of light comes in through the walls — your phoenix, come to say goodbye.`);
      const ga = document.getElementById('sa-' + (where === 'tailor' ? 'gpfare' : 'gpwait'));
      const gcx = ga && ga._o ? ga._o.x + ga._o.w / 2 : G.x + 0.5;
      const bes = r5BesideYou(p, gcx);
      r5MonActor('myphoenix', 'phoenix', bes.x, bes.y, 1.3, { crowned, bob:true });
      r5FaceGP(gcx);
      await sceneWait(400);
    }
    await sceneSay([faceMon('phoenix', { crowned })], me, `<b>"Will you go away now?"</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"Every time you burn bright, little one, I will be there. And remember — you are never alone."</b>`);
  }
  const id = where === 'tailor' ? 'gpfare' : 'gpwait';
  const el = document.getElementById('sa-' + id);
  const x0 = el && el._o ? el._o.x : G.x - 0.4;
  sceneGlowOut(['gporb', 'gpforb'], 1600);       // (2.95) its dark glow goes with it
  await r5MoveActor(id, x0, G.y - 5, 1600, true);
  await sceneGlowOut([id, 'gpfare', 'gpwait'], 700);
  sceneActorGone(id);
  r5FaceGP(null);                                // nothing there to face now
  await sceneSay([], '', `And then it is gone. The air stays warm for a long time after.`);
  await sceneSay([faceMon('whalelord')], whaleName(), `<b>"Rest well, old fire."</b>`);
  sceneActorGone('myphoenix');
  r.phoenixGone = true;
  await saveProfile();
}
/* In the Armoury (2.91), between the night it opened the gate and the day
   it goes to rest: for a phoenix to give the rest of its power to, or (its
   power given before you were safe up the hill) for you to be. */
function r5GPWaiting(){ const r = r5(); return !!(r.phoenixMet && !r.rush && !r.phoenixGone); }
function r5PaintGPWaiting(){
  /* (2.92) its orb, until it is touched — (2.95) and its dark glow stays
     under it once it has risen out */
  if(!document.getElementById('sg-gporb')) r5PaintOrb('gporb', R5_ORB.x, R5_ORB.y);
  if(!ui.gpOut) return r5FaceGPHere();
  if(!document.getElementById('sa-gpwait')){
    const a = r5MonActor('gpwait', 'phoenix', R5_ORB.x, R5_ORB.y - R5_GP_RISE, 2, { html:r5GhostPhoenixHtml(Math.round(WALK_T * 2)) });
    if(a) a.classList.add('r5-gpfloat');
  }
  r5FaceGPHere();
}
const R5_GP_WAITING = [
  `<b>"Go on up into the Old Town. I will be here."</b>`,
  `<b>"My core went far away, across the sea, to a quiet forest. If a phoenix hatched from it, it is there still."</b>`,
  `<b>"There was no time to send all my power with my core. What is left of it is here, with me — and it is not mine to keep."</b>`,
];
const R5_GP_WAITING_DISGUISED = [
  `<b>"You wear their colours now! Clever. I would never have thought of that."</b>`,
  `<b>"My core went to a quiet forest across the sea. The Tranquil Forest, your whale calls it. If a phoenix hatched there, bring it to me."</b>`,
  `<b>"There was no time to send all my power with my core. What is left of it is here, with me. It belongs to the phoenix that hatched from it, not to me."</b>`,
  `<b>"I can feel the psychics up the hill, pressing down on all of us. One day we will push back again. Together."</b>`,
];
async function r5ArmouryPhoenix(){
  const r = r5();
  if(ui.sceneRunning || walkState().busy) return;
  if(!ui.gpOut){                                  // (2.92) touched: it rises out of its orb first
    ui.sceneRunning = true; walkState().busy = true; releaseKeys();
    r5FaceGP(R5_ORB.x + 1);
    await r5OrbEmerge('gporb', 'gpwait', R5_ORB.x, R5_ORB.y);
    ui.gpOut = true;
    ui.sceneRunning = false; walkState().busy = false;
    walkState().actSig = null;
    refreshWalk();                                // its Touch is a Ghost phoenix now
  }
  const gp = ()=> r5GhostPhoenixHtml(64);
  const mine = r5MyPhoenix();
  if(!r.phoenixGift && mine) return r5LateGift(mine);
  if(r.phoenixGift){
    /* its power given before you were safe: it is waiting for you to be */
    if(!r.disguise) return sceneSay([gp()], R5_GP, `<b>"Go on up, into the Old Town. When you are safe up there, I can rest."</b>`);
    ui.sceneRunning = true; walkState().busy = true;
    await r5PhoenixFarewell('armoury');
    ui.sceneRunning = false; walkState().busy = false;
    return refreshWalkAll();
  }
  await sceneSay([gp()], R5_GP, r.disguise ? r5Turn('gpWaitD', R5_GP_WAITING_DISGUISED) : r5Turn('gpWait', R5_GP_WAITING));
  if(r5Once('gpHintWhale'))
    await sceneSay([faceMon('whalelord')], whaleName(),
      `<b>"A phoenix of our own... They are very rare. But the Tranquil Forest, where we began, has one now and then, for somebody strong enough to meet it."</b><br><br>` +
      `<b>"If we ever go back there, keep your eyes open."</b>`);
}
/* You bring it a phoenix, after (2.91): it knows its fire, and gives it the
   rest of its power. In disguise already, it goes to rest; if not, it waits
   until you are. */
async function r5LateGift(mine){
  const r = r5();
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  const gp = ()=> r5GhostPhoenixHtml(64);
  const m = mine.mon, crowned = isCrowned(m), me = displayName(m);
  const face = ()=> faceMon('phoenix', { crowned });
  const p = w.at[w.deck] || { x:4, y:6 };
  ghostAlert();
  const GC = { x:R5_ORB.x + 1, y:R5_ORB.y - R5_GP_RISE + 1.2 };   // under the floating ghost (2.92)
  r5DarkGlow('gplate', GC.x, GC.y, 3.2);
  if(mine.stored) await sceneSay([], '', `A streak of light comes in through the walls from somewhere far away — your phoenix, called by something it cannot name.`);
  else await sceneSay([], '', `Something stirs beside you. Your phoenix comes out on its own, blinking at the dark fire.`);
  const bes = r5BesideYou(p, GC.x);
  r5MonActor('myphoenix', 'phoenix', bes.x, bes.y, 1.3, { crowned, bob:true });
  r5FaceGP(GC.x);
  await sceneWait(500);
  if(r.phoenixKin){
    /* they have met before (a save from 2.90): no need to say it all again */
    await sceneSay([gp()], R5_GP, `<b>"You came back. And you brought the little one back to me."</b>`);
  } else {
    await sceneSay([face()], me, `<b>"...?"</b><br><br>It tilts its head at the dark fire.<br><br><b>"That fire... I know that fire. Don't I?"</b>`);
    await sceneSay([gp()], R5_GP, `The flames go very still.<br><br><b>"...You. You have my fire in you. My core."</b>`);
    await sceneSay([face()], me,
      `<b>"I don't remember you."</b><br><br>It hops a little closer, unsure.<br><br><b>"But I think... I think I was waiting for you."</b>`);
    await sceneSay([gp()], R5_GP,
      `<b>"I sent my core to a quiet forest, to hatch where they could never find it. And here you are — strong, and bright, and loved."</b><br><br>` +
      (crowned ? `<b>"And crowned, too. You have grown further than I ever did."</b><br><br>` : '') +
      `<b>"Then my last fire was worth it. Every spark of it."</b>`);
  }
  await sceneGlowOut(['gplate'], 400);
  await r5PhoenixGift(mine, { GX:GC.x, GY:GC.y });
  if(r.disguise) await r5PhoenixFarewell('armoury');
  else await sceneSay([gp()], R5_GP, `<b>"Go on up, into the Old Town. When you are safe up there, I can rest."</b>`);
  sceneActorGone('myphoenix');
  w.busy = false;
  ui.sceneRunning = false;
  refreshWalkAll();
}
/* At Ugo's, once you are in disguise, if its power is still waiting for a
   phoenix: the Whalelord says where it has gone. */
async function r5GPStillWaiting(){
  const whale = faceMon('whalelord'), wn = whaleName();
  if(r5MyPhoenix())
    return sceneSay([whale], wn,
      `<b>"One more thing. The old phoenix has gone back down to the Armoury. It has something to give your phoenix — ` +
      `something it had no time to give before. We should go and see it."</b>`);
  return sceneSay([whale], wn,
    `<b>"One more thing. The old phoenix has gone back down to the Armoury, to wait. It has the last of its power to give — ` +
    `but only to the phoenix that hatched from its core, in the Tranquil Forest, where we began."</b><br><br>` +
    `<b>"If we ever find a phoenix of our own, we should take it to the Armoury."</b>`);
}

/* ============================================================
   THE RUN (2.91) — three minutes, the longest the dead can hold out
   The clock runs only on the second tier's floors, only while the night
   holds (r5().rush), and only while you could be walking: never while
   somebody talks, a screen wipes, the menu is open or the app is away. It is
   kept in the save. At nought the psychics press the dead back down: the
   floor's men break free and catch you — ten phrases, and back to the gate
   to run again, with three minutes more.
   ============================================================ */
const R5_RUSH_MS = 180000;
function r5RushLeft(){ const r = r5(); return r.rushLeft == null ? R5_RUSH_MS : Math.max(0, r.rushLeft); }
function r5RushStop(){ clearInterval(ui.r5RushTimer); ui.r5RushTimer = null; }
function r5RushHud(){
  r5Css();
  const stage = $('#walkStage'); if(!stage) return null;
  let hud = document.getElementById('r5Rush');
  if(!hud){ hud = document.createElement('div'); hud.id = 'r5Rush'; hud.className = 'r5-rush'; stage.appendChild(hud); }
  const s = Math.ceil(r5RushLeft() / 1000);
  hud.innerHTML = `👻 <b>${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</b>`;
  hud.classList.toggle('low', s <= 30);
  hud.classList.toggle('crit', s <= 10);
  return hud;
}
function r5RushStart(d){
  r5RushStop();
  if(!r5RushHud()) return;
  let last = performance.now();
  ui.r5RushTimer = setInterval(()=>{
    const now = performance.now(), dt = Math.min(1000, now - last);
    last = now;
    const r = r5();
    if(ui.screen !== d.key || !document.getElementById('r5Rush') || !r.rush) return r5RushStop();
    if(stealthPaused()) return;
    r.rushLeft = Math.max(0, r5RushLeft() - dt);
    r5RushHud();
    if(Date.now() - (ui.r5RushSavedAt || 0) > 5000){ ui.r5RushSavedAt = Date.now(); saveProfile(); }
    if(r.rushLeft <= 0){ r5RushStop(); r5RushOut(d); }
  }, 250);
}
/* Out of time. */
async function r5RushOut(d){
  const id = d.key, st = ui.stealth && ui.stealth[id];
  if(!st || st.caught) return;
  st.caught = true;
  ui.sceneRunning = true;
  stealthHold(true);
  stopStealth();
  releaseKeys();
  const w = walkState();
  w.busy = true;
  const r = r5();
  /* the ghosts are pressed back down, off every man on the floor */
  document.querySelectorAll('.walk-ent.guard.haunted').forEach(el=>{
    el.classList.remove('haunted');
    const o = el.querySelector('.guard-haunt'); if(o) o.remove();
  });
  sceneShake(600, t=> 0.10 * (1 - t / 600));
  await sceneSay([r5GhostPhoenixHtml(64)], R5_GP, `<b>"No — the psychics! They are pressing us back down. I cannot hold them!"</b>`);
  playSfx('alert');
  st.guards.forEach(g=>{ g.spotted = true; });
  paintStealth(id, d);
  await captureStream(id, d);                    // (2.95) soldatos: the Consigliere stays in his ring
  await sceneSay([faceNpc('soldato2', '💂')], 'Soldato', `<b>"Got you! Thought the ghosts would save you, did you?"</b>`, 'Continue');
  await sceneCurtain(true, 700);
  sceneClear();
  stealthHold(false);
  walkTeardown();
  const hud = document.getElementById('r5Rush'); if(hud) hud.remove();
  ui.sceneRunning = false;
  w.busy = false;
  r.rushLeft = R5_RUSH_MS;
  r.rushTries = (r.rushTries || 0) + 1;
  const g0 = DECKS.cata_garrison.arrive.gate;
  r5NoteSpot('cata_garrison', g0[0], g0[1], 'gate');            // the gate, next time too
  await saveProfile();
  const again = ()=>{ ui.r5RushAgain = true; goFloor('cata_garrison', 'gate'); };
  if(!activePool().length){ sceneCurtain(false, 400); return again(); }
  captureTest(10, ()=>{
    storyModal(r5GhostPhoenixHtml(150), R5_GP,
      `<b>"We pulled you out from under their noses — just. Back to the gate with you."</b><br><br>` +
      `<b>"Again! Every ghost in the hill — push!"</b><br><br>` +
      `<i>Three more minutes. Run!</i>`,
      ()=> again(), { subtitle:'The Garrison' });
  });
  sceneCurtain(false, 600);                      // the black lifts off the writing
}
/* Up the Garrison from the gate (2.95): every ghost in the hill at once — a
   hundred of the hill's own dead (R5_HILL_GHOSTS, as you meet them down
   there), rushing up out of the gate behind you in a spray that goes on for
   five seconds, the whole floor shaking as they go. The first of them peel
   off to the soldatos in sight, three to a man, and stay on him — three
   different ghosts, at his left, his right and over his head (14-stealth.js);
   every other man on the floor has his three already. The rest pour on up the
   floor and away. Nobody moves while they go by, and the clock waits. */
const R5_POUR = { n:100, shake:5000, spray:4400 };
function r5HauntHold(on){
  document.querySelectorAll('.walk-ent.guard.haunted').forEach(el=> el.classList.toggle('haunt-hold', !!on));
}
async function r5GhostsPour(){
  /* (the floor itself first: never into the last one's picture, mid-wipe) */
  for(let i = 0; i < 40 && document.querySelector('.tile-wipe'); i++) await new Promise(res=> setTimeout(res, 50));
  const w = walkState(), d = DECKS[w.deck], world = $('#walkWorld');
  ui.r5PourDue = false;
  if(!d || !world || typeof Element === 'undefined' || typeof Element.prototype.animate !== 'function') return r5HauntHold(false);
  const p = w.at[d.key] || { x:12, y:37 };
  const T = WALK_T, N = R5_POUR.n, SP = R5_POUR.spray, S = SCENE_SPEED;
  const wasScene = ui.sceneRunning;
  w.busy = true; ui.sceneRunning = true;
  releaseKeys();
  r5HauntHold(true);
  const box = document.createElement('div');
  box.className = 'r5-pour'; box.id = 'r5Pour';
  world.appendChild(box);
  const ox = p.x + 0.5, oy = p.y + 0.7;            // out of the gate, at your feet
  const rnd = (a, b)=> a + Math.random() * (b - a);
  const kinds = R5_HILL_GHOSTS.length ? R5_HILL_GHOSTS : ['ghost'];
  /* three of them to every man in sight, to the very spots they haunt him from */
  const toMen = [];
  const st = ui.stealth && ui.stealth[d.key];
  (st ? st.guards : []).forEach(g=>{
    const el = document.getElementById('guard-' + g.id);
    if(!el || el.style.display === 'none' || !el.classList.contains('haunted')) return;
    const man = { el, left:0 };
    [...el.querySelectorAll('.gh-ghost')].forEach((gh, i)=>{
      const h = HAUNT_SPOTS[i]; if(!h) return;
      man.left++;
      toMen.push({ man, sp:gh.dataset.sp || kinds[0], x:g.x + h.x, y:g.y + h.y, size:HAUNT_SIZE });
    });
  });
  /* the spray: a hundred in all, the men's among the first half of them */
  const flights = [];
  const menSlots = new Set();
  toMen.forEach((f, i)=> menSlots.add(Math.min(N - 1, Math.round((i + 1) * (N * 0.5) / (toMen.length + 1)))));
  let mi = 0;
  for(let i = 0; i < N; i++){
    const delay = SP * (i / N) + rnd(0, 90);
    if(menSlots.has(i) && mi < toMen.length){ flights.push(Object.assign({ delay, man:true }, toMen[mi++])); continue; }
    const th = (Math.random() + Math.random() - 1) * 58 * Math.PI / 180, L = rnd(9, 17);
    const sp = kinds[Math.floor(Math.random() * kinds.length)];
    flights.push({ delay, sp, x:ox + L * Math.sin(th), y:oy - L * Math.cos(th), size:rnd(0.62, 1.1) });
  }
  while(mi < toMen.length) flights.push(Object.assign({ delay:rnd(0, SP / 2), man:true }, toMen[mi++]));
  const shake = sceneShake(R5_POUR.shake, ms=> 0.11 * Math.min(1, ms / 350) * (ms > 4000 ? Math.max(0, 1 - (ms - 4000) / 1000) : 1));
  const ease = 'cubic-bezier(.22,.7,.36,1)';
  let longest = 0;
  const runs = flights.map(f=>{
    const el = document.createElement('div');
    el.className = 'r5-pg' + (f.x > ox + 0.05 ? ' face-r' : '');            // faces the way it flies
    el.dataset.sp = f.sp;
    const s = f.size, px = Math.round(s * T);
    el.style.left = ((ox - s / 2) * T) + 'px'; el.style.top = ((oy - s / 2) * T) + 'px';
    el.style.width = el.style.height = px + 'px';
    el.innerHTML = monPortrait(f.sp, px, { view:'front', bare:true, stage:hauntStage(f.sp) });
    box.appendChild(el);
    const dx = (f.x - ox) * T, dy = (f.y - oy) * T, len = Math.hypot(dx, dy) || 1;
    const bend = rnd(0.8, 2.4) * T * (Math.random() < 0.5 ? -1 : 1);
    const mx = dx * 0.55 - dy / len * bend, my = dy * 0.55 + dx / len * bend;
    const dur = f.man ? Math.min(2400, 900 + 70 * len / T) : rnd(1200, 1900);
    longest = Math.max(longest, f.delay + dur);
    const at = (x, y, k)=> `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${k})`;
    const frames = f.man
      ? [{ transform:at(0, 0, 0.5), opacity:0 }, { offset:0.15, transform:at(dx * 0.1, dy * 0.1, 1.5), opacity:0.95 },
         { offset:0.6, transform:at(mx, my, 1.3), opacity:0.92 }, { transform:at(dx, dy, 1), opacity:0.88 }]
      : [{ transform:at(0, 0, 0.3), opacity:0 }, { offset:0.12, transform:at(dx * 0.08, dy * 0.08, 0.95), opacity:0.95 },
         { offset:0.55, transform:at(mx, my, 1.05), opacity:0.9 }, { transform:at(dx, dy, 1.15), opacity:0 }];
    const anim = el.animate(frames, { duration:dur * S, delay:f.delay * S, easing:ease, fill:'forwards' });
    return anim.finished.catch(()=>{}).then(()=>{
      if(!f.man) return el.remove();
      /* there: it becomes one of his three, and the man starts to shake */
      if(--f.man.left <= 0) f.man.el.classList.remove('haunt-hold');
      el.animate([{ opacity:0.88 }, { opacity:0 }], { duration:250 * S, fill:'forwards' });
      setTimeout(()=> el.remove(), 300 * S);
    });
  });
  await Promise.race([Promise.all(runs), sceneWait(longest + 800)]);
  await shake;
  box.remove();
  r5HauntHold(false);                              // and every man out of sight has his three
  w.busy = false; ui.sceneRunning = wasScene;     // off you go
}
/* What he says on each floor of the second tier as you run through it. */
const R5_RUSH_LINES = {
  cata_garrison: `<b>"Run! Every soldier in here has three ghosts on him. They cannot see us now."</b><br><br>` +
                 `<b>"Up — all the way up, to the stair at the far end. Three minutes. Do not stop!"</b>`,
  cata_quarry:   `<b>"The quarry. Keep climbing — terrace by terrace, the dead are holding every man on it."</b>`,
  cata_cellars:  `<b>"Wine cellars. We must be right under the Old Town now. Keep going!"</b>`,
  cata_pit:      `<b>"The fight pit — and the Consigliere in his ring, with three ghosts round him."</b><br><br>` +
                 `<b>"The stair at the top goes up to the church. Go!"</b>`,
};

/* ---------- tier 2 (2.88) ---------- */
/* The Consigliere (2.95; he was the Grey Capo), in the middle of his ring:
   the end of the second tier. (r5().capoGrey keeps its old name, for the
   saves that have it.) */
async function r5ConsigliereBeaten(){
  const r = r5();
  const first = !r.capoGrey;
  r.capoGrey = true;
  if(first) state.inventory.protein = (state.inventory.protein || 0) + 3;
  await saveProfile();
  const w = walkState();
  w.at = w.at || {}; w.at.cata_pit = { x:12, y:21 }; w.face = 'u';
  ui.walkFresh = false;
  go('cata_pit');
  const con = faceNpc('consigliere','🕴️'), whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([con], 'Consigliere',
    `He looks round at the empty benches, as if somebody might have been watching.<br><br><b>"Nobody saw that. Understand? Nobody."</b>`);
  await sceneSay([con], 'Consigliere',
    `<b>"I advise the Padrino on a great many things, kid. Tonight I shall advise him that nothing happened down here."</b>`);
  await sceneSay([con], 'Consigliere',
    `<b>"Go on, then. Up to your church."</b><br><br>` +
    `<b>"But the Padrino has friends up there, kid. Friends even the dead are scared of."</b> He straightens his hat and walks out of the ring.`);
  if(first){
    await sceneSay([whale], wn,
      `<b>"My core is very close now. Right above us, I think — past the church, at the top of the hill."</b><br><br>` +
      `<b>"We will find the way up."</b>`);
    r.tier2 = true;
    await saveProfile();
    walkTeardown();
    storyModal(monPortrait('whalelord', 150, { view:'front', bare:true }), 'The second tier is clear',
      `You have cleared the catacombs under the Old Town.<br><br>` +
      `<b>+3 Protein Supplements</b><br><br>` +
      `<i>The rest of Cosa Nostia is coming soon.</i>`,
      ()=> go('cata_pit'), { subtitle:'The Fight Pit' });
  }
}
/* The crypt stair, above the Fight Pit: up to a low door into the Old Town's
   church. Barred from the other side — until the night the dead rose, when
   the Whalelord went through it and lifted the bar (2.90). Open ever since. */
async function r5CryptStair(){
  const r = r5();
  if(r.rush) return r5CryptOpens();
  if(r.oldTown || (typeof isDev === 'function' && isDev())) return goFloor('church', 'crypt');
  await sceneSay([], 'The crypt stair',
    `Worn steps climb into the dark, to a low, heavy door. It does not move. It is barred from the other side.`);
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"The Old Town's church is up there. I can feel it."</b><br><br>` +
    `<b>"Somebody on the other side of that door does not want anything coming up these steps. Not the dead, and not us. Not yet."</b>`);
}
async function r5CryptOpens(){
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  const whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([], 'The crypt stair',
    `Worn steps climb to a low, heavy door. It does not move. It is barred on the other side.`);
  await sceneSay([whale], wn,
    `<b>"Not tonight. While the dead are up, their wall is down — and there is nothing to stop a ghost going through a door."</b>`);
  const gh = $('#walkGhost');
  if(gh){ gh.style.transition = `opacity ${600 * SCENE_SPEED}ms ease`; gh.style.opacity = '0'; }
  await sceneWait(1000);
  await sceneShake(300, t=> 0.06);
  await sceneSay([], '', `On the other side of the door something heavy scrapes, and thumps to the floor — and the door swings open.`);
  if(gh) gh.style.opacity = '';
  w.busy = false;
  ui.sceneRunning = false;
  goFloor('church', 'crypt');
}

/* ============================================================
   THE CHURCH (2.90) — the Old Town's, at the top of the crypt stair
   Where the catacombs come out: a nave of pews and pillars, candles on the
   altar, the crypt stair down in its east corner and the great door out to
   the piazza — out into the Old Town's streets, in disguise (2.91). Explore
   → The Old Town comes here too, out of disguise. Drawn from its grid
   (paintChurch) until it has a painting of its own (assets/zones/church.png,
   `art`, at 32 px a tile).
   ============================================================ */
function r5ChurchRender(world, d){
  if(ui.sceneRunning) return;
  const r = r5();
  if(r.rush) return r5ChurchArrival();
  /* (2.91) up here already, from before there was a tailor: he finds you now */
  if(r.oldTown && !r.disguise) return r5TailorFetch(false);
}
/* Up out of the crypt on the night the dead rose: it is over, and you are in
   — and somebody has heard you coming. */
async function r5ChurchArrival(){
  const r = r5();
  ui.sceneRunning = true;
  r5RushStop();
  const w = walkState();
  w.busy = true;
  await sceneWait(700);
  const whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([], 'The church',
    `You climb out of the dark into a church, still and quiet. Candles burn on the altar, and moonlight comes in through coloured glass.<br><br>` +
    `Under your feet, the noise of the catacombs is fading away.`);
  ghostAlert();
  await sceneSay([whale], wn,
    `<b>"Listen. It is over down there. The psychics have pressed the dead back down — I can feel it."</b>`);
  await sceneSay([whale], wn,
    `<b>"But we are through. This is the Old Town, right in the middle of it."</b><br><br>` +
    `<b>"And my core is close now. Up there, at the very top of the hill."</b>`);
  await sceneSay([whale], wn, `<b>"The old phoenix was right, you know. None of us could have done this alone."</b>`);
  r.rush = false;
  r.oldTown = true;
  r.rushLeft = null;
  await saveProfile();
  await r5TailorFetch(true);
}
/* Ugo the tailor (2.91), who lights the church's candles every night, finds
   you — the night you come up out of the crypt, or (up here already before
   2.91) the next time you are in the church — and takes you across the
   piazza to his shop before the Family comes to look. */
async function r5TailorFetch(tonight){
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  const ugo = ()=> faceNpc('tailor', '🧵'), U = R5_NAMES.tailor;
  const p = (w.at && w.at.church) || { x:8, y:13 };
  await sceneWait(tonight ? 300 : 700);
  sceneActor('ugo', { x:8, y:14, src:'assets/npc/tailor.png', icon:'🧵' });
  await r5MoveActor('ugo', 8, 11, 900);
  await r5MoveActor('ugo', Math.max(1, p.x - 2), p.y, 900);
  actorFaceToward('ugo', p.x + 0.5);              // (2.95) there, he faces you — and you him
  walkFaceToward(Math.max(1, p.x - 2) + 0.5);
  if(tonight){
    await sceneSay([ugo()], U,
      `An old man hurries in through the great door with a candle in his hand, and stops dead when he sees you.<br><br>` +
      `<b>"So it was true. The bells rang by themselves, and every candle in here burned purple. I came to see what was coming up out of the crypt."</b>`);
    await sceneSay([ugo()], U,
      `<b>"A child! Up out of the catacombs, past the whole Family!"</b> He looks back over his shoulder at the door.<br><br>` +
      `<b>"They will be here any minute to see what all the noise was. Quick — come with me. My shop is just across the piazza."</b>`);
  } else {
    await sceneSay([ugo()], U,
      `An old man comes in through the great door with a candle, the way he does every night, and stops dead when he sees you.<br><br>` +
      `<b>"You! You are the child who came up out of the crypt, the night the bells rang by themselves. I have been looking everywhere for you."</b>`);
    await sceneSay([ugo()], U,
      `<b>"You cannot walk about up here looking like that. The whole Family knows your face by now. Quick — come with me. My shop is just across the piazza."</b>`);
  }
  await sceneSay([faceMon('whalelord')], whaleName(), `<b>"He cannot see me. But I think we can trust him. Go."</b>`);
  await sceneCurtain(true, 700);
  sceneClear();
  await sceneCurtainText('He hurries you out of the church and across the dark piazza, past the fountain, to a shop with a needle and thread painted over its door.', 700);
  await sceneWait(1800);
  await sceneCurtainText('', 400);
  /* into the back room, behind the curtain */
  walkTeardown();
  w.at = w.at || {}; w.at.tailor = { x:6, y:8 }; w.face = 'u';
  w.ghostAt = w.ghostAt || {}; w.ghostAt.tailor = { x:7, y:8 };
  ui.walkFresh = false;
  ui.currentZone = r5Zone('old_town') || ui.currentZone;
  w.busy = false;
  go('tailor');                                   // (ui.sceneRunning holds: it starts nothing itself)
  await sceneWait(500);
  await sceneCurtain(false, 800);
  await r5DisguiseScene();
}
/* The uniform (2.91). */
async function r5DisguiseScene(){
  const r = r5();
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  const ugo = ()=> faceNpc('tailor', '🧵'), U = R5_NAMES.tailor;
  const whale = faceMon('whalelord'), wn = whaleName();
  await sceneWait(400);
  await sceneSay([ugo()], U,
    `He bolts the door behind you and pulls down the blind.<br><br>` +
    `<b>"There. Nobody looks for anybody in here. I am Ugo. I have been the tailor in this town for forty years."</b>`);
  await sceneSay([ugo()], U,
    `<b>"And for forty years I have made the Family's clothes. Every coat, every hat, every soldato's uniform in Cosa Nostia — I made it. ` +
    `They have never once paid for one."</b>`);
  await sceneSay([ugo()], U,
    `He pulls a small uniform off the rack: a dark coat, a cap, a red sash.<br><br>` +
    `<b>"This one I made for a new boy — a junior. He took one look at the catacombs and ran home to his mother. He never came back for it."</b>`);
  await sceneSay([ugo()], U,
    `<b>"It should just about fit you. Put it on, and you are one of them: a junior soldato, the lowest of the low. Nobody ever looks twice at a junior."</b>`);
  await sceneCurtain(true, 450);
  r.disguise = true;
  r.disguised = true;
  await saveProfile();
  walkYouRefresh();
  walkSideRefresh();
  w.actSig = null;
  await sceneCurtain(false, 450);
  const p = w.at[w.deck] || { x:6, y:8 };
  sceneSparkles(p.x, p.y - 0.2, 1, 1.2, 900);
  await sceneWait(700);
  await sceneSay([whale], wn, `<b>"Ha! I would not know you myself."</b>`);
  await sceneSay([ugo()], U,
    `He steps back and squints at you.<br><br><b>"Hm. Stand up straight. Juniors slouch, but not as much as that."</b>`);
  await sceneSay([ugo()], U,
    `<b>"In that, you can walk anywhere — the streets, the catacombs. No soldato and no capo stops a junior going about the Family's business."</b><br><br>` +
    `<b>"And the soldatos talk. They will talk to one of their own."</b>`);
  await sceneSay([ugo()], U,
    `<b>"But never take that cap off where they can see you. Out there, the whole Family knows your face by now."</b>`);
  await sceneSay([whale], wn,
    `<b>"My core is up there, at the very top of the hill. Now we can go wherever the Family goes — and find out what the Padrino wants with it."</b>`);
  if(r.phoenixGift && !r.phoenixGone) await r5PhoenixFarewell('tailor');
  else if(!r.phoenixGift && r.phoenixMet) await r5GPStillWaiting();
  w.busy = false;
  ui.sceneRunning = false;
  walkTeardown();
  storyModal(npcPortrait('soldato1', '💂', 130, 'transparent'), 'The disguise',
    `<b>🎭 Wear disguise</b> — the button beside Party, in the catacombs and the Old Town. In it you are a junior soldato: ` +
    `<b>no soldato or capo stops you</b>, and any soldato who comes alongside you can be talked to.<br><br>` +
    `<b>⚔️ Challenge</b> — from a talk, you can show a soldato your face. On a fight floor he fights you alone, and is off watch for the rest of the day. ` +
    `On an evade floor (the Bone Halls, the Garrison) or in the Old Town, they all come running.<br><br>` +
    `<b>Take it off</b> in the Old Town's streets and they know you at once: you are surrounded. In the catacombs, out of it, keep to the dark as before.<br><br>` +
    `<i>Wild monsters do not care what you wear.</i>`,
    ()=> go('tailor'), { subtitle:"Ugo's" });
}
function r5TailorRender(world, d){
  if(ui.sceneRunning) return;
  if(!r5().disguise) return r5DisguiseScene();      // (left half-way through: it goes on)
  /* (3.07) once a day — and once the dead are loose, nobody cares about the cap */
  if(r5DailyDue('first_tailor_after'))
    r5PlaceWord('tailor', 'first_tailor_after', r5().holdBroken
      ? `<b>"Ugo's back room. Nobody comes in here but Ugo."</b>`
      : `<b>"Ugo's back room. Nobody comes in here but Ugo — so if you ever want that cap off, this is the place."</b>`);
}
const R5_UGO_LINES = [
  `<b>"Back again? Let me look at you. Hm. The sash is crooked. There."</b>`,
  `<b>"The Padrino's men come in here for new coats every month. Every month I measure them, and every month they forget to pay."</b>`,
  `<b>"Up the hill is the Padrino's villa. Nobody goes up there unless they are sent for — not even the capos, most days."</b>`,
  `<b>"I make coats for the psychics up the hill, too. Long grey ones. They never say a word while I measure them. Not one word."</b>`,
  `<b>"If you need that uniform off, take it off in here, or in the church. Nobody will see you."</b>`,
];
function r5Tailor(){ return sceneSay([faceNpc('tailor', '🧵')], R5_NAMES.tailor, r5Turn('ugo', R5_UGO_LINES)); }
async function r5Mirror(){
  await sceneSay([], 'The mirror', r5().disguised
    ? `A junior soldato looks back at you: dark coat, red sash, cap pulled down low. Nobody would ever guess.`
    : `Just you, looking back. In here, nobody else can see.`);
  if(r5Once('mirrorWhale'))
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"I do not show up in it at all. I checked."</b>`);
}
/* Out to the piazza: in uniform. */
async function r5TailorOut(){
  const r = r5();
  if(!r.disguise) return;
  if(!r.disguised && !r.holdBroken){             // (3.00) the soldatos are busy with the dead now
    const yes = await r5Ask([faceNpc('tailor', '🧵')], R5_NAMES.tailor,
      `<b>"Not like that! The whole Family knows your face. Put your uniform on first."</b>`, '🎭 Put it on', 'Stay inside');
    if(!yes) return;
    r5SetDisguise(true);
  }
  goFloor('old_town', 'tailor');
}
/* The church's great door, out to the piazza (2.91: in uniform). */
async function r5OldTownDoor(){
  const r = r5();
  if(!r.disguise){
    await sceneSay([], 'The church door',
      `Outside, the Old Town is asleep: a piazza with a fountain, shuttered shops, and a lantern on every corner where the Family keeps watch.`);
    return sceneSay([faceMon('whalelord')], whaleName(), `<b>"Not like this. Every one of them out there would know your face."</b>`);
  }
  if(!r.disguised && !r.holdBroken){             // (3.00) the soldatos are busy with the dead now
    const yes = await r5Ask([faceMon('whalelord')], whaleName(),
      `<b>"Out there, every one of them knows your face by now. Put on the disguise first."</b>`, '🎭 Put it on', 'Stay inside');
    if(!yes) return;
    r5SetDisguise(true);
  }
  goFloor('old_town', 'church');
}
function r5Altar(){
  return sceneSay([], 'The altar', r5().disguise
    ? `Candles, and flowers in a jar. Ugo the tailor lights the candles every night, Family or no Family.`
    : `Candles, and flowers in a jar. Fresh ones — somebody still comes here, Family or no Family.`);
}
/* Explore → The Old Town: in disguise, its streets, where you last stood in
   them (the church's steps the first time); out of it, the church, inside
   the great door (2.91). */
function renderOldTownZone(){
  const r = r5(), w = walkState();
  w.at = w.at || {};
  w.ghostAt = w.ghostAt || {};
  ui.walkFresh = false;
  ui.currentZone = r5Zone('old_town') || ui.currentZone;
  if(r.disguise && r.disguised){
    if(!w.at.old_town){ const a = DECKS.old_town.arrive.church; w.at.old_town = { x:a[0], y:a[1] }; w.face = 'd'; }
    if(!w.ghostAt.old_town) w.ghostAt.old_town = { x:w.at.old_town.x, y:w.at.old_town.y };
    ui.stealthFresh = true;
    return go('old_town');
  }
  if(!w.at.church){ w.at.church = { x:8, y:13 }; w.face = 'u'; }
  if(!w.ghostAt.church) w.ghostAt.church = { x:8, y:13 };
  return go('church');                    // its own screen, so a scene can redraw it
}
/* The church, drawn from its grid: warm stone, pews, pillars, the altar and
   its candles, coloured light from the windows, and the crypt stair going
   down in the corner. Seeded by position, so it never shimmers. */
const _churchArt = {};
function paintChurch(d){
  const own = cataPainting(d);
  if(own) return own;
  if(_churchArt[d.key]) return _churchArt[d.key];
  const W = d.rows[0].length, H = d.rows.length, P = 32;
  const c = document.createElement('canvas');
  c.width = W * P; c.height = H * P;
  const g = c.getContext('2d');
  if(!g) return '';
  const rnd = (x, y, k)=>{ const s = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const at = (x, y)=> (y < 0 || y >= H || x < 0 || x >= W) ? '#' : d.rows[y][x];
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const ch = at(x, y), X = x * P, Y = y * P;
    if(ch === '#'){
      const face = at(x, y + 1) !== '#';
      g.fillStyle = face ? '#b9a98f' : '#5e5446'; g.fillRect(X, Y, P, P);
      if(face){
        g.fillStyle = '#d6c8ad'; g.fillRect(X, Y + P - 8, P, 8);
        g.strokeStyle = 'rgba(80,66,48,0.45)'; g.lineWidth = 1;
        g.strokeRect(X + 0.5, Y + P - 8.5, P - 1, 8);
      }
      /* a tall coloured window in each side wall, every third tile */
      if((x === 0 || x === W - 1) && y > 0 && y < H - 1 && y % 3 === 1){
        g.fillStyle = ['#7a5ab0', '#3f78b8', '#b8584a'][(y / 3 | 0) % 3];
        g.fillRect(X + 11, Y + 3, P - 22, P - 6);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(X + 12, Y + 4, 2, P - 8);
      }
      continue;
    }
    /* flagstones, warm */
    const tone = 168 + Math.floor(rnd(x, y) * 16);
    g.fillStyle = `rgb(${tone},${tone - 14},${tone - 34})`;
    g.fillRect(X, Y, P, P);
    g.strokeStyle = 'rgba(90,70,45,0.28)'; g.lineWidth = 1;
    g.strokeRect(X + 0.5, Y + 0.5, P - 1, P - 1);
    /* the aisle: a long red runner from the door to the altar */
    if(x === 8 && y >= 2){ g.fillStyle = 'rgba(150,40,40,0.55)'; g.fillRect(X + 5, Y, P - 10, P); }
    /* coloured light falling from the windows */
    if((x === 1 || x === W - 2) && y % 3 === 1){
      g.fillStyle = ['rgba(150,110,220,0.22)', 'rgba(90,150,230,0.22)', 'rgba(230,110,90,0.22)'][(y / 3 | 0) % 3];
      g.fillRect(X, Y, P, P);
    }
    if(ch === 't'){
      if(y === 1){                                   // the altar, under its cloth
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X, Y + 6, P, P - 6);
        g.fillStyle = '#f2ece0'; g.fillRect(X, Y + 2, P, P - 8);
        g.fillStyle = '#c9a54a'; g.fillRect(X, Y + P - 10, P, 3);
      } else {                                       // a pew
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X, Y + 9, P, P - 11);
        g.fillStyle = '#7a5232'; g.fillRect(X, Y + 6, P, P - 14);
        g.fillStyle = '#5c3b22'; g.fillRect(X, Y + 6, P, 4);
        if(at(x - 1, y) !== 't'){ g.fillStyle = '#4a2f1b'; g.fillRect(X, Y + 4, 3, P - 10); }
        if(at(x + 1, y) !== 't'){ g.fillStyle = '#4a2f1b'; g.fillRect(X + P - 3, Y + 4, 3, P - 10); }
      }
    }
    if(ch === 'o'){                                  // a pillar
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(X + P / 2 + 2, Y + P / 2 + 3, P * 0.42, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d9cdb6'; g.beginPath(); g.arc(X + P / 2, Y + P / 2, P * 0.40, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#efe6d4'; g.beginPath(); g.arc(X + P / 2 - 3, Y + P / 2 - 3, P * 0.18, 0, Math.PI * 2); g.fill();
    }
    if(ch === '*'){                                  // a stand of candles
      const gr = g.createRadialGradient(X + P / 2, Y + P / 2, 1, X + P / 2, Y + P / 2, P * 0.6);
      gr.addColorStop(0, 'rgba(255,230,150,0.9)'); gr.addColorStop(1, 'rgba(255,200,90,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(X + P / 2, Y + P / 2, P * 0.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3a2d22'; g.fillRect(X + 10, Y + 14, 12, 10);
      [[12, 9], [16, 7], [20, 9]].forEach(([cx, cy])=>{
        g.fillStyle = '#f4eedf'; g.fillRect(X + cx - 1.5, Y + cy + 2, 3, 6);
        g.fillStyle = '#ffd36a'; g.beginPath(); g.arc(X + cx, Y + cy, 2.2, 0, Math.PI * 2); g.fill();
      });
    }
  }
  /* the crypt stair, going down in its corner */
  (d.things || []).filter(t=> t.verb === 'Down').forEach(t=>{
    const X = t.x * P, Y = t.y * P;
    for(let k = 0; k < 4; k++){
      g.fillStyle = `rgb(${120 - k * 24},${104 - k * 22},${84 - k * 18})`;
      g.fillRect(X + 2, Y + 2 + k * 7, P - 4, 7);
    }
  });
  try { _churchArt[d.key] = c.toDataURL('image/png'); } catch(e){ _churchArt[d.key] = ''; }
  return _churchArt[d.key];
}

/* ============================================================
   THE DISGUISE (2.91)
   Ugo's junior soldato's uniform: on or off from the button beside Party
   (13-walkmap.js) wherever it works — the catacombs, the church, Ugo's and
   the Old Town's streets. In it you look like a junior soldato (soldato1, the
   weaker of the two), nobody on watch looks twice at you (14-stealth.js),
   and any soldato who comes alongside you can be talked to. Taken off:
     in the catacombs   nothing happens at once: keep to the dark as before
     in the Old Town    they know you — frozen to the spot, surrounded by
                        soldatos and capos, ten phrases, back in the church
   ============================================================ */
function r5DisguiseDeck(d){ return !!(d && d.region === 5 && !d.under && (d.stealth || d.key === 'church' || d.key === 'tailor' || d.tower ||
                                                              (d.house && d.zone !== 'harbour'))); }   // (3.03) the Old Town's and the Hilltop's rooms
function r5YouArt(d){
  if(!r5DisguiseDeck(d) || !r5().disguised) return null;
  const px = WALK_T;
  return `<img src="assets/npc/soldato1.png" alt="" class="r5-junior" style="width:${px}px;height:${px}px;object-fit:contain;" ` +
         `onerror="walkArtMissing(this,'💂',${Math.round(px * 0.8)},0)">`;
}
function r5SideAct(d){
  const r = r5();
  if(!r.disguise || !r5DisguiseDeck(d)) return null;
  return r.disguised
    ? { html:'<b>🎭</b>Take off disguise', cls:'on', act:()=> r5ToggleDisguise() }
    : { html:'<b>🎭</b>Wear disguise', act:()=> r5ToggleDisguise() };
}
function r5SetDisguise(on){
  const r = r5();
  if(!r.disguise) return;
  r.disguised = !!on;
  saveProfile();
  walkYouRefresh();
  walkSideRefresh();
  const w = walkState(), d = DECKS[w.deck], p = w.at && w.at[w.deck];
  if(p && $('#walkWorld')) sceneSparkles(p.x, p.y - 0.2, 1, 1.2, 600);
  /* every man on watch takes a fresh look at you */
  const st = d && d.stealth && ui.stealth && ui.stealth[d.key];
  if(st && !st.caught){ st.guards.forEach(g=>{ g.sus = 0; g.spotted = false; }); paintStealth(d.key, d); }
  w.actSig = null;
  refreshWalk();
}
async function r5ToggleDisguise(){
  const r = r5(), d = DECKS[walkState().deck];
  if(!r.disguise || !d) return;
  if(!r.disguised) return r5SetDisguise(true);
  if(r5MenInRoom(d))                              // (3.07) the guard house, the café, the trattoria
    return sceneSay([faceMon('whalelord')], whaleName(), `<b>"Not in here. Those men would know your face in a moment."</b>`);
  /* (3.00) with the dead up for good, nobody in the street has eyes for you */
  if(d.stealth && d.stealth.kind === 'town' && !stealthHauntedForGood(d)){
    const yes = await r5Ask([faceMon('whalelord')], whaleName(),
      `<b>"${d.key === 'hilltop' ? 'Here? On the Padrino\'s own hill?' : 'Here? In the street?'} Every one of them knows your face. They would be on us at once."</b>`, '🎭 Take it off', 'Keep it on');
    if(!yes) return;
    r5SetDisguise(false);
    return r5Unmask(d);
  }
  r5SetDisguise(false);
}
/* Out of uniform in the Old Town's streets: the nearest man knows you. */
function r5Unmask(d){
  const id = d.key, st = ui.stealth && ui.stealth[id], p = walkState().at[id];
  if(!st || st.caught || !st.guards.length || !p) return;
  const far = g=> Math.abs(g.x - p.x) + Math.abs(g.y - p.y);
  const g = st.guards.filter(x=> !guardHaunted(d, guardDef(d, x.id))).sort((a, b)=> far(a) - far(b))[0];   // (3.00) not one fighting ghosts
  if(!g) return;
  g.spotted = true;
  paintStealth(id, d);
  stealthCaught(id, d, g, guardDef(d, g.id));
}
/* Every beat in disguise (14-stealth.js): whoever has come alongside you —
   the buttons redrawn only when that changes. */
function r5GuardsMoved(d){
  if(ui.screen !== d.key || ui.sceneRunning) return;
  const p = walkState().at[d.key]; if(!p) return;
  const sig = d.key + ':' + r5NearActs(d, p).map(a=> a.key).join('|');
  if(sig === ui.r5NearSig) return;
  ui.r5NearSig = sig;
  refreshWalk();
}
function r5NearActs(d, p){
  if(!d.stealth || !stealthDisguised(d) || stealthRush(d)) return [];
  const st = ui.stealth && ui.stealth[d.key];
  if(!st || st.caught) return [];
  return st.guards.filter(g=> Math.abs(g.x - p.x) + Math.abs(g.y - p.y) <= 1)
    .filter(g=>{ const def = guardDef(d, g.id); return def && def.kind !== 'capo' && !guardHaunted(d, def); })   // (3.00) busy with ghosts
    .slice(0, 2)
    .map(g=> ({ key:'talk-' + g.id, html:'🗨️ Talk<small>Soldato</small>', at:{ x:g.x, y:g.y }, act:()=> r5SoldatoTalk(d, g) }));
}
/* What the soldatos say to one of their own (2.91): the Padrino's great work
   up at the villa — a monster nothing can beat, nearly ready. They know only
   what soldatos are told, which is not much. */
const R5_SOLDATO_TALK = [
  `<b>"New, are you? Keep your head down and your lantern lit, junior. That's all there is to it."</b>`,
  `<b>"Big things are happening up at the villa. The Padrino's been working on something for years, and they say it's nearly done."</b>`,
  `<b>"A monster, I heard. The strongest there's ever been. Nothing in the world will be able to beat it — that's what the capos say."</b>`,
  `<b>"That boy who came in on a dragon brought the Padrino something. Something that glows. The capos went very quiet when they saw it."</b>`,
  `<b>"My cousin carries crates up to the villa cellar. Heavy ones. He says they hum, and they're warm, like there's something alive in them."</b>`,
  `<b>"The Padrino's been collecting cores, from all over. Don't ask me what for. I just carry the boxes."</b>`,
  `<b>"Those psychics up the hill give me the creeps. They never blink. Whatever the Padrino's making, they're the ones keeping it quiet."</b>`,
  `<b>"When it's finished, nobody will ever stand up to the Family again. Not the town, not the sea, not even the dead. That's what the Padrino says."</b>`,
  `<b>"I asked a capo what the Padrino's building. He said, 'The end of all our problems.' Then he told me to mind my own business."</b>`,
  `<b>"Soon, they say. Any day now. And when it's ready, we'll all get a pay rise. Probably."</b>`,
  `<b>"There's a kid loose in the catacombs, they say. Beat two capos — and the Consigliere himself! Don't tell him I told you."</b>`,
  /* (3.17, part 6 §12c) the Forest Guardian, brought in; and the voice in his dreams */
  `<b>"Last month the boss's boat brought in a cage from across the sea. Big as a cart, with green leaves growing out between the bars. Nobody's allowed near it."</b>`,
  `<b>"My uncle stands outside the Padrino's door at night. He says the boss talks in his sleep — to somebody who isn't there. And sometimes it sounds like somebody answers."</b>`,
];
const R5_REVEAL_SHOUTS = [
  `You push back the cap and look him in the eye. His lantern starts to shake.<br><br><b>"YOU! You're the kid from the catacombs!"</b>`,
  `You take off the cap and grin at him.<br><br><b>"Wait — you're no junior. You're— HEY!"</b>`,
  `<b>"Funny. You look just like that kid everybody's looking for—"</b><br><br>You take off the cap. <b>"...Oh."</b>`,
];
async function r5SoldatoTalk(d, g){
  const id = d.key, st = ui.stealth && ui.stealth[id];
  if(!st || st.caught || ui.sceneRunning || walkState().busy) return;
  const def = guardDef(d, g.id);
  /* (2.95) he turns to you, to talk (his next step turns him back to his round) */
  const p = walkState().at[id];
  if(p) faceToward(document.getElementById('guard-' + g.id), g.x + 0.5, p.x + 0.5);
  const yes = await r5Ask([faceNpc(guardSprite(def), '💂')], 'Soldato',
    r5Turn('soldatoTalk', R5_SOLDATO_TALK), '⚔️ Challenge him', 'Leave');
  if(!yes) return;
  if(st.caught || !st.guards.includes(g) || ui.screen !== id) return;   // gone in the meantime
  r5Challenge(d, g, def);
}
/* Show him your face (2.91). On a fight floor he fights you, alone — beat
   him and he is off watch for the rest of the day, and your uniform stays
   on. On an evade floor or in the Old Town, every man in earshot comes: you
   are surrounded. */
function r5Challenge(d, g, def){
  const id = d.key, st = ui.stealth && ui.stealth[id];
  if(!st || st.caught) return;
  if(d.stealth.kind === 'fight'){
    st.caught = true;
    stealthHold(true);
    stopStealth();
    releaseKeys();
    return caughtFight(id, d, g, def, r5Pick(R5_REVEAL_SHOUTS));
  }
  ui.r5Revealed = id;
  g.spotted = true;
  paintStealth(id, d);
  stealthCaught(id, d, g, def);
}

/* ============================================================
   THE OLD TOWN'S STREETS (2.91)
   ============================================================ */
/* His word in each of the Family's lit places — the first time, and (3.07)
   the first time each day after that. */
const R5_TOWN_FIRST = {
  old_town:`<b>"The Old Town. Soldatos on every corner, and capos at the café — and not one of them has looked twice at you."</b><br><br>` +
           `<b>"Ugo was right. Walk as if you belong here."</b>`,
  hilltop: `<b>"The Padrino's own hill. More of his men up here, and every one of them watching that gate."</b><br><br>` +
           `<b>"Keep that cap on, and let them think you are Figlio's porter."</b>`,
};
/* (3.07) …and once the dead are loose for good, what is true of it now (the
   capos still keep their watch, but none gets up from his table). */
const R5_TOWN_FREE = {
  old_town:`<b>"The Old Town. Soldatos on every corner — and every one of them has three of the dead to deal with."</b><br><br>` +
           `<b>"Only the capos at the café still have eyes for anybody. Let them look. Not one of them will get up from his table."</b>`,
  hilltop: `<b>"The Padrino's own hill. More of his men up here than anywhere — and not one of them watching that gate now."</b><br><br>` +
           `<b>"Listen. Even up here, the dead are singing."</b>`,
};
function r5TownRender(world, d){
  const r = r5();
  if(!r.disguise){ setTimeout(()=> renderOldTownZone(), 0); return; }   // (before Ugo — the developer's way: the church)
  /* (3.00) once the hold is broken nobody needs it: every soldato is busy with the dead */
  if(!r.disguised && !r.holdBroken){ r.disguised = true; saveProfile(); walkYouRefresh(); walkSideRefresh(); }
  const fresh = !!ui.stealthFresh;                // (3.07) in through a door or up the steps — not back from a fight or a menu
  startStealth(world, d);
  /* (3.02) a save that broke the hold before Nino was in the story: the
     Ghost Master comes down the hill to tell you about him */
  if(d.key === 'hilltop' && r.holdBroken && !r.ninoMet && !ui.sceneRunning){ setTimeout(()=> r5NinoCatchUp(), 600); return; }
  /* (3.04) back in the forecourt with the Monkey King still to come: he comes */
  if(d.key === 'hilltop' && r5MKDue() && !ui.sceneRunning && r5InForecourt((walkState().at || {}).hilltop)){
    setTimeout(()=>{ if(ui.screen === 'hilltop' && r5MKDue() && !ui.sceneRunning) r5MKVilla(); }, 600);
    return;
  }
  if(!ui.sceneRunning && fresh && R5_TOWN_FIRST[d.key] && r5DailyDue('first_' + d.key))
    r5PlaceWord(d.key, 'first_' + d.key, (r.holdBroken ? R5_TOWN_FREE : R5_TOWN_FIRST)[d.key]);
}
/* Out of uniform in the streets, or a face shown to one of them: frozen to
   the spot and surrounded — soldatos, and in the Old Town the capos from the
   café — ten phrases, like the catacombs' evade floors. Then, in the Old
   Town, back in the church (out of uniform, if that is how they caught you);
   on the Hilltop (2.92), pulled in at Grandpa's door, cap and all. */
async function r5TownCaught(id, d, g, def){
  const r = r5(), w = walkState();
  w.busy = true;
  ui.sceneRunning = true;
  const revealed = ui.r5Revealed === id;
  ui.r5Revealed = null;
  const hill = id === 'hilltop';
  /* (2.95) the soldatos come running — and in the Old Town the Purple Capo
     puts down his newspaper, gets up from his table outside the café and
     strolls over himself. He is one man, in one place: nobody else wears his
     face in the crowd. */
  const table = hill ? null : deckThings(d).find(t=> t.sprite === 'capo_purple');
  const lead = table ? { sprite:'capo_purple', icon:'🕴️', from:[table.x, table.y], el:table.el } : null;
  await captureStream(id, d, ['soldato1', 'soldato2'], lead);
  if(hill || !table){
    const sol = faceNpc('soldato2', '💂');
    if(!hill){                                    // (nobody at the café yet: one of his men says it)
      await sceneSay([sol], 'Soldato', revealed
        ? `<b>"Showing your face to us, in the middle of the Old Town? Brave. Stupid, but brave."</b>`
        : `<b>"Well, well. The kid from the catacombs — in one of OUR uniforms."</b>`, 'Continue');
      await sceneSay([sol], 'Soldato', `<b>"Got you. There is nowhere to run up here."</b>`, 'Continue');
    } else {
      await sceneSay([sol], 'Soldato', revealed
        ? `<b>"Signor Figlio's porter, eh? Signor Figlio's porter is the kid from the catacombs!"</b>`
        : `<b>"That's no porter. That's the kid from the catacombs — on the Padrino's own hill!"</b>`, 'Continue');
      await sceneSay([sol], 'Soldato', `<b>"Got you. Nowhere to run up here."</b>`, 'Continue');
    }
  } else {
    const capo = faceNpc('capo_purple', '🕴️');
    await sceneSay([capo], 'Purple Capo', revealed
      ? `<b>"Showing your face to my men, in the middle of the Old Town? Brave. Stupid, but brave."</b>`
      : `<b>"Well, well. The kid from the catacombs — in one of OUR uniforms."</b>`, 'Continue');
    await sceneSay([capo], 'Purple Capo', `<b>"Got you. There is nowhere to run up here."</b>`, 'Continue');
  }
  await sceneCurtain(true, 700);
  sceneClear();
  stealthHold(false);
  walkTeardown();
  ui.sceneRunning = false;
  w.busy = false;
  const back = ()=>{
    w.at = w.at || {}; w.ghostAt = w.ghostAt || {};
    if(hill){
      w.at.hilltop = { x:19, y:30 }; w.face = 'd'; w.ghostAt.hilltop = { x:19, y:31 };   // (3.32) his door is at the bottom now
      r.disguised = true;                         // Grandpa hands you your cap
      ui.currentZone = r5Zone('hilltop') || ui.currentZone;
    } else {
      w.at.church = { x:8, y:13 }; w.face = 'u'; w.ghostAt.church = { x:8, y:14 };
      ui.currentZone = r5Zone('old_town') || ui.currentZone;
    }
    ui.walkFresh = false;
    ui.stealthFresh = true;                       // and the men back on their rounds
  };
  const where = hill ? 'hilltop' : 'church';
  r.townCaught = (r.townCaught || 0) + 1;
  saveProfile();
  if(!activePool().length){ back(); sceneCurtain(false, 400); return go(where); }
  const wasOn = r.disguised;
  captureTest(10, ()=>{
    back();
    saveProfile();
    storyModal(monPortrait('whalelord', 150, { view:'front', bare:true }), whaleName(), hill
      ? `<b>"I put out every lamp on the hill at once. In the dark, an old man opened his door and pulled you in, and shut it on them."</b><br><br>` +
        `Grandpa hands you your cap. <b>"You dropped this,"</b> he says, and winks.<br><br><i>You are at Grandpa's door, in uniform.</i>`
      : `<b>"I blew out every lamp on the piazza at once, and in the dark we ran for the church. Nobody follows anybody into a church at night — not even the Family."</b><br><br>` +
        (wasOn ? '' : `<b>"Keep that cap on out there."</b><br><br>`) +
        `<i>You are back in the church.</i>`,
      ()=> go(where), { subtitle: hill ? 'The Hilltop' : 'The church' });
  });
  sceneCurtain(false, 600);                      // the black lifts off the writing
}
function r5TownChurch(){ goFloor('church', 'door'); }
async function r5TownDown(){
  await sceneSay([faceNpc('soldato1', '💂')], 'Soldato', r5Turn('townDown', [
    `<b>"Down to the harbour, junior? Mind the steps — they're steeper than they look."</b>`,
    `<b>"Off to the harbour? Bring us back some fish."</b>`,
  ]));
  goFloor('harbour', 'gate');
}
async function r5VillaRoad(){
  const r = r5();
  if(r.figlioMet) return r5HillEscort();        // (2.92) Figlio is waiting to take you up
  await sceneSay([], 'Up the hill',
    `The steps climb on up the hill, past the gardens, to a high wall and the roofs of a great house: the Padrino's villa.`);
  await sceneSay([faceNpc('soldato2', '💂')], 'Soldato', r5Turn('villaRoad', [
    `<b>"Nobody goes up to the villa unless they're sent for, junior. Not even us."</b>`,
    `<b>"You? Up there? Ha! Not till you've got a few more years on you."</b>`,
  ]));
  const first = r5Once('villaWhale');
  await sceneSay([faceMon('whalelord')], whaleName(), first
    ? `<b>"My core is up there. I can feel it, close enough to touch."</b><br><br><b>"Not yet. But soon."</b>`
    : `<b>"Not yet."</b>`);
  if(r.disguise && r5Once('villaHint'))
    await sceneSay([faceMon('whalelord')], whaleName(),
      `<b>"Somebody in this town must be able to walk through that gate — somebody the Family would never stop."</b>`);
}

/* ============================================================
   FIGLIO (2.92) — home from Region 3's band competition
   Once you wear the Family's colours, Figlio is gone from the band
   competition (10-story-r3.js figlioAway) and sings at the Old Town's opera
   house. He knows a costume when he sees one, wants nothing to do with what
   his father is making, and takes you up the hill: the Padrino's son walks
   through his father's gate, and his porter with him (r5HillEscort). He
   still fights you once a day for 3 Silver Medals (the same day's count as
   in Region 3), his team starting again at 94 and a level higher for each
   win here, a level higher each wave, its crowned Howler five above the
   first — none past 100 (2.99; they went to 105 and 110): 94–99 the first
   time, 100 all through after six wins. A first win ever still brings his
   Dragon Stone.
   ============================================================ */
const R5_FIGLIO_LINES = [
  `<b>"They have me singing every night but Monday. My father has never once come to listen."</b>`,
  `<b>"You know, that uniform almost suits you. Almost."</b>`,
  `<b>"The mediums frightened me when I was small. They still do, a little. They never blink."</b>`,
  `<b>"If you see my father before I do, tell him— no. Don't tell him anything."</b>`,
];
function r5FiglioLevel(){ return Math.min(ENEMY_LEVEL_CAP, 94 + ((state.progress.region5 || {}).figlioWins5 || 0)); }   // (3.11) read, never written
/* wave k's level (0 the first, 5 the Howler), and the span to show */
function r5FiglioLv(k){ return Math.min(ENEMY_LEVEL_CAP, r5FiglioLevel() + k); }
function r5FiglioSpan(){ const lo = r5FiglioLv(0), hi = r5FiglioLv(5); return lo === hi ? `${lo}` : `${lo}–${hi}`; }
async function r5Figlio(){
  const r = r5();
  if(ui.sceneRunning || walkState().busy) return;
  if(!r.figlioMet) return r5FiglioMeet();
  const c = concertState(), face = faceNpc('figlio', '🎙️');
  const line = r.hill ? r5Turn('figlio', R5_FIGLIO_LINES)
                      : `<b>"Whenever you're ready, I'll take you up the hill. Meet me at the steps."</b>`;
  if(c.figlioDay === today())
    return sceneSay([face], 'Figlio', line + `<br><br><b>"And we've had our fight today. Once a day — I have a voice to look after."</b>`);
  const yes = await r5Ask([face], 'Figlio',
    line + `<br><br><i>A battle, once a day: his team is level <b>${r5FiglioSpan()}</b>. Win for <b>+3 Silver Medals</b>.</i>`,
    '🎙️ Battle', 'Leave');
  if(yes) r5FiglioFight();
}
async function r5FiglioMeet(){
  const r = r5();
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  const fig = ()=> faceNpc('figlio', '🎙️'), F = 'Figlio';
  const c = concertState();
  await sceneSay([fig()], F,
    `He is running scales outside the opera house. He stops halfway up one and looks at you — at the uniform, and then at your face.<br><br>` +
    `<b>"Well. I know a costume when I see one. I've worn a hundred."</b>`);
  await sceneSay([fig()], F, c.figlio
    ? `<b>"The trainer who beat the band — and me${(c.figlioWins || 0) > 1 ? ', more than once' : ''}. I'd know that face anywhere, cap or no cap."</b>`
    : (c.bandCleared ? `<b>"You beat the band at the competition. I was watching from the wings."</b>`
                     : `<b>"I've heard about you — the young trainer who keeps turning up wherever my father's men least want one."</b>`) +
      `<br><br><b>"I'm Figlio. The Padrino is my father — I'm sorry to say."</b>`);
  await sceneSay([fig()], F,
    `<b>"Don't worry. I won't tell him. I left that house to sing, and I want nothing to do with what he's making up there."</b>`);
  await sceneSay([fig()], F,
    `<b>"His mediums live in a tower inside the estate walls. They came over the sea years ago to look for someone. ` +
    `They never found who they were looking for — but they never left, either."</b><br><br>` +
    `<b>"Now they hold every ghost in this hill down for him, with their minds."</b>`);
  await sceneSay([fig()], F,
    `<b>"You'll want to get up there, I suppose. Nobody gets through that gate unless they're family."</b> He smiles. ` +
    `<b>"Lucky for you, I am. I'm expected for supper whenever I care to turn up."</b><br><br>` +
    `<b>"Meet me at the steps up the hill when you're ready."</b>`);
  await sceneSay([faceMon('whalelord')], whaleName(), `<b>"He cannot see me. But I like him."</b>`);
  r.figlioMet = true;
  await saveProfile();
  w.busy = false;
  ui.sceneRunning = false;
  refreshWalkAll();                              // his "!" goes
  toast('Figlio will take you up the hill: the steps at the top of the Old Town.');
}
function r5FiglioBattle(){
  return { isNpc:true, name:'Figlio', npcId:'figlio', bgKey:'battle_opera', figlio:true,
    waves:[
      [{species:'ground_starter',   level:r5FiglioLv(0), ai:'best'}],
      [{species:'psychic_starter',  level:r5FiglioLv(1), ai:'best'}],
      [{species:'ghost_starter',    level:r5FiglioLv(2), ai:'best'}],
      [{species:'physical_starter', level:r5FiglioLv(3), ai:'best'}],
      [{species:'flying_starter',   level:r5FiglioLv(4), ai:'best'}],
      [{species:'howler',           level:r5FiglioLv(5), ai:'best', crowned:true, supplements:10}],
    ] };
}
function r5FiglioFight(){
  if(!ensurePool()) return;
  walkTeardown();
  beginBattle(Object.assign(r5FiglioBattle(), { onWin: ()=> r5FiglioWon() }));
}
async function r5FiglioWon(){
  const c = concertState(), r = r5();
  const first = !c.figlio;
  c.figlio = true;
  c.figlioDay = today();
  c.figlioWins = (c.figlioWins || 0) + 1;
  r.figlioWins5 = (r.figlioWins5 || 0) + 1;
  state.medals.silver = (state.medals.silver || 0) + 3;
  const stone = first && !ownsStone('dragonStone');
  if(stone) addStone('dragonStone', 1);
  await saveProfile();
  storyModal(npcPortrait('figlio', '🎙️', 140, 'transparent'), first ? 'Second, again' : 'A closer thing each time',
    (first ? `He returns his last monster to its ball. <b>"So that settles what I actually am. A singer."</b> He laughs. <b>"Good."</b><br><br>`
           : `He straightens his collar, breathing hard.<br><br><b>"Better. I'll be better still tomorrow."</b><br><br>`) +
    (stone ? `He presses a stone into your hand — cut and clear, and humming. <b>"A Dragon Stone. Attach it to any dragon you're raising and it will learn far faster."</b><br><br>` : '') +
    `<b>+3 Silver Medals</b> · next time his team is level <b>${r5FiglioSpan()}</b>.`,
    ()=> go('old_town'), { subtitle:'The Old Town' });
}

/* ============================================================
   UP THE HILL (2.92)
   The first time, on Figlio's arm: past the steps' soldatos ("Evening,
   Signor Figlio"), up the hill road, and through the estate gate; he leaves
   you in the forecourt and goes in to supper. After that the steps are
   yours — Signor Figlio's porter comes and goes — and so is Explore → The
   Hilltop. The Hilltop is the Family's ground, like the Old Town: in uniform.
   ============================================================ */
async function r5HillEscort(){
  const r = r5();
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  const fig = ()=> faceNpc('figlio', '🎙️'), F = 'Figlio', sol = faceNpc('soldato2', '💂');
  await sceneSay([fig()], F,
    `Figlio comes over from the opera house, winding a long scarf round his neck.<br><br>` +
    `<b>"There you are. Carry this, stay close, and look bored."</b> He hands you a leather case full of sheet music.`);
  await sceneSay([sol], 'Soldato', `The soldatos at the steps straighten up.<br><br><b>"Evening, Signor Figlio. Going up to the house?"</b>`);
  await sceneSay([fig()], F, `<b>"Supper with my father. And this junior is carrying my music, so mind you don't trip him."</b>`);
  await sceneSay([sol], 'Soldato', `<b>"...Right you are, Signor Figlio. Up you go."</b>`);
  await sceneSay([faceMon('whalelord')], whaleName(), `<b>"They cannot see me, and they cannot see what you are. This is going very well."</b>`);
  await sceneCurtain(true, 700);
  sceneClear();
  await sceneCurtainText('Figlio walks you up the hill road — past the lemon terraces, a cottage with one lit window, and the guard house, where the soldatos stand up straight as he goes by.', 700);
  await sceneWait(2000);
  await sceneCurtainText('', 400);
  await sceneCurtainText('At the top, the gate of the Padrino\'s estate swings open without a word.', 700);
  await sceneWait(1600);
  await sceneCurtainText('', 400);
  /* in through the gate, behind the curtain */
  walkTeardown();
  w.at = w.at || {}; w.at.hilltop = { x:12, y:11 }; w.face = 'u';
  w.ghostAt = w.ghostAt || {}; w.ghostAt.hilltop = { x:12, y:12 };
  ui.walkFresh = false;
  ui.stealthFresh = true;
  ui.currentZone = r5Zone('hilltop') || ui.currentZone;
  r.hill = true;
  r.said.first_hilltop = r5Day();                // he says it all here (3.07: for today)
  await saveProfile();
  w.busy = false;
  go('hilltop');                                 // (ui.sceneRunning holds: it starts nothing itself)
  await sceneWait(500);
  await sceneCurtain(false, 800);
  w.busy = true;
  sceneActor('figlio', { x:13, y:11, src:'assets/npc/figlio.png', icon:'🎙️' });
  walkFaceToward(13.5);                           // (2.95) you turn to him; he is on your right
  await sceneWait(300);
  await sceneSay([fig()], F, `<b>"My father's house. I grew up in there."</b> He does not sound as if he misses it.`);
  await sceneSay([fig()], F,
    `He nods at the round tower in the east garden, its top windows glowing a faint purple.<br><br>` +
    `<b>"And that is where his mediums live. Thirteen floors of them — and at the very top, my cousin. My father's grandniece."</b><br><br>` +
    `<b>"She's not much older than you, and the dead do whatever she tells them. Even the mediums answer to her."</b>`);
  await sceneSay([fig()], F,
    `<b>"That uniform won't fool them. The ones who talk to the dead will feel anything dead you've brought up here with you — ` +
    `and the ones who read minds will hear every thought in your head."</b>`);
  await sceneSay([faceMon('whalelord')], whaleName(), `<b>"...He does not know how right he is."</b>`);
  await sceneSay([fig()], F,
    `<b>"I'm going in to supper. If anybody asks, you're my porter, and you're waiting for me."</b><br><br>` +
    `He takes his music back, straightens his collar, and goes up to the villa's great door.`);
  await r5MoveActor('figlio', 12, 8.5, 1000, true);
  sceneActorGone('figlio');
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"My core is in that villa. I can feel it, close enough to touch."</b><br><br>` +
    `<b>"But first, that tower. As long as those mediums hold the dead down, nobody in this hill can help us."</b>`);
  w.busy = false;
  ui.sceneRunning = false;
  walkTeardown();
  storyModal(npcPortrait('figlio', '🎙️', 130, 'transparent'), 'The Hilltop',
    `<b>The Padrino's estate</b> is the Family's own hill: in uniform, as in the Old Town — take it off in sight of his men and you are surrounded. ` +
    `They let Signor Figlio's porter come and go: the steps up from the Old Town are yours now, and so is <b>Explore → The Hilltop</b>.<br><br>` +
    `<b>🗼 The Tower</b> — thirteen floors in the east garden, a disciple on each and two masters at the top, all highly trained: ` +
    `<b>six waves</b> each — a disciple 13 to 15 monsters, a master 18, in threes. ` +
    `<b>The uniform does not fool them</b>: the ghost disciples feel the Whalelord the moment you come in, and the psychic ones read your thoughts — ` +
    `every one of them will fight you. Beat one and they step aside from the stair up — it is yours for good. Lose, and you keep every floor you have won.<br><br>` +
    `<b>Their ghosts</b> fear a Psychic monster of yours; <b>their psychic monsters</b> fear a Physical one.<br><br>` +
    `<b>🍋 Grandpa's cottage</b>, down the lemon terraces below the gate: rest there and Recover.`,
    ()=> go('hilltop'), { subtitle:'The Hilltop' });
}
async function r5HillUp(){
  const r = r5();
  if(!r.disguised && !r.holdBroken){             // (3.00) the soldatos are busy with the dead now
    const yes = await r5Ask([faceMon('whalelord')], whaleName(),
      `<b>"Up there, every one of them would know your face. Put on the disguise first."</b>`, '🎭 Put it on', 'Not now');
    if(!yes) return;
    r5SetDisguise(true);
  }
  await sceneSay([faceNpc('soldato2', '💂')], 'Soldato', r5Turn('hillUp', [
    `<b>"Signor Figlio's porter? Up you go."</b>`,
    `<b>"Up to the house again? Mind you don't drop his music."</b>`,
  ]));
  goFloor('hilltop', 'down');
}
function r5HillDown(){ goFloor('old_town', 'hill'); }
/* Explore → The Hilltop: in uniform (it is put on for you), where you last
   stood on the hill — inside the estate gate the first time. */
function renderHilltopZone(){
  const r = r5(), w = walkState();
  if(!r.disguise) return renderOldTownZone();    // (the developer, before Ugo)
  if(!r.disguised && !r.holdBroken){ r.disguised = true; saveProfile(); toast('🎭 You put your uniform on before you go up.'); }
  w.at = w.at || {}; w.ghostAt = w.ghostAt || {};
  if(!w.at.hilltop){ w.at.hilltop = { x:12, y:11 }; w.face = 'u'; }
  if(!w.ghostAt.hilltop) w.ghostAt.hilltop = { x:w.at.hilltop.x, y:w.at.hilltop.y };
  ui.walkFresh = false;
  ui.stealthFresh = true;
  ui.currentZone = r5Zone('hilltop') || ui.currentZone;
  return go('hilltop');
}
/* The villa's great door (2.95): the Sottocapo stands in it — the Padrino's
   right hand, whose team scattered in front of the Water Dragon the night you
   rode it through Region 2's caverns. He looks at Figlio's porter a moment
   too long. He is the one man in that doorway, and nowhere else. */
const R5_SOTTOCAPO_LINES = [
  `<b>"Still here, porter? The Padrino sees nobody. Not porters, not capos — most nights, not even his own son."</b>`,
  `<b>"The kitchens are round the side, junior. Not this door. Never this door."</b>`,
  `He looks you up and down, slowly.<br><br><b>"You've got a face I can't place, junior. I don't like faces I can't place."</b>`,
];
async function r5VillaDoor(){
  const r = r5(), S = 'Sottocapo';
  const sotto = ()=> faceNpc('sottocapo', '🕴️'), whale = ()=> faceMon('whalelord'), wn = whaleName();
  if(r.holdBroken){
    /* (3.04) the villa: first the Monkey King drops in and goes over the
       Sottocapo's head; then the Sottocapo stands between you and the door
       until he is beaten (3.01's lines for him, in and out of uniform, are
       his challenge now — r5SottoAsk) */
    if(!r.mkVilla) return r5MKVilla();
    return r5SottoAsk();
  }
  if(r5Once('sottocapo')){
    await sceneSay([], '',
      `A big man in a black suit fills the villa's doorway, his arms folded.<br><br>` +
      `You know that face. The last time you saw it, you were riding the Water Dragon through the caverns — and his monsters were scattering in front of it.`);
    await sceneSay([sotto()], S, `<b>"Signor Figlio's porter."</b> He looks at you for a long moment.<br><br><b>"Have we met, junior?"</b>`);
    await sceneSay([], '', `You keep your cap down, and say nothing.`);
    await sceneSay([sotto()], S, `<b>"...No. I'd remember."</b><br><br><b>"The Padrino sees nobody. Wait out here with the others."</b>`);
    return sceneSay([whale()], wn,
      `<b>"The Padrino's right hand, by the look of him. And he very nearly knew you."</b><br><br><b>"Keep that cap low whenever he is about."</b>`);
  }
  return sceneSay([sotto()], S, r5Turn('villaDoor', R5_SOTTOCAPO_LINES));
}
function r5VillaFountain(){
  return sceneSay([], 'The fountain', `Water spills from a little stone bowl on top into a wide round basin. Somebody has scrubbed it very, very clean.`);
}
/* (3.33) The Padrino's pool (the designer: "when the player reaches the
   edges of the pool, allow the interaction: 'Dive and relax', whereupon the
   sprite goes halfway into the pool's bottom right tile but gets thrown back
   out by the whalelord who quickly slides into that square. The whalelord
   then interjects by mock-scolding the player … in simple, direct writing").
   Open once the villa is: the poolside's corner, below the lower deck chair
   and right of the screen (the Hilltop's `shut`). His lines in turn; while
   the Padrino still has the cores, every other one says so. He floats in —
   a ghost: no splash. */
const R5_POOL_DIVE = { x:5, y:9 };                 // the water's bottom-right square
const R5_POOL_TEASE = [
  `<b>"What does a land-monkey like you want to do in the water?"</b>`,
  `<b>"Let's not make ourselves <i>too</i> comfortable, shall we?"</b>`,
  `<b>"You swim like a rock. A small, heavy rock."</b>`,
  `<b>"Whales swim. Land-monkeys sink. Out you come."</b>`,
  `<b>"A swim? Now? We are not on holiday."</b>`,
  `<b>"You cannot hold your breath for one minute. I could hold mine for an hour."</b>`,
];
const R5_POOL_HURRY = [
  `<b>"No time for a swim! The Padrino is getting away."</b>`,
  `<b>"The cores are right there, under this house. Swim later!"</b>`,
  `<b>"My core is under this villa, and you want to go for a swim?"</b>`,
  `<b>"The Padrino is down there with the cores. Let's go and catch him."</b>`,
];
function r5PoolLine(){
  if(r5VaultAt('won')) return r5Turn('poolFree', R5_POOL_TEASE);     // the cores are out of his hands
  const mix = [];
  R5_POOL_TEASE.forEach((t, i)=>{ mix.push(t); if(R5_POOL_HURRY[i]) mix.push(R5_POOL_HURRY[i]); });
  return r5Turn('pool', mix);
}
async function r5PoolDive(){
  const w = walkState();
  if(w.busy || ui.sceneRunning || w.deck !== 'hilltop') return;
  const me = document.getElementById('walkYou'), gh = document.getElementById('walkGhost');
  const p = w.at && w.at.hilltop;
  if(!me || !p) return;
  r5Css();
  ui.sceneRunning = true;
  w.busy = true;
  releaseKeys();
  const T = WALK_T, P = R5_POOL_DIVE;
  const put = (el, x, y, ms, ease)=>{
    el.style.transition = `transform ${Math.round(ms * SCENE_SPEED)}ms ${ease}`;
    el.style.transform = `translate3d(${x * T}px,${y * T}px,0)`;
  };
  walkFaceToward(P.x + 0.5);
  /* in you go: halfway into the water's corner square, up to your middle */
  put(me, (p.x + P.x) / 2, (p.y + P.y) / 2, 380, 'ease-out');
  me.classList.add('r5-dunk');
  await sceneWait(480);
  /* he gets there first — and pushes you back out */
  if(gh){
    gh.style.zIndex = 10 + P.y + 1;                  // in front of you as he comes
    put(gh, P.x, P.y, 240, 'ease-in');
    await sceneWait(200);
  }
  me.classList.remove('r5-dunk');
  put(me, p.x + 0.2 * Math.sign(p.x - P.x), p.y + 0.2 * Math.sign(p.y - P.y), 170, 'ease-out');
  await sceneWait(190);
  put(me, p.x, p.y, 160, 'ease-in-out');
  await sceneWait(200);
  me.style.transition = '';
  if(gh){ gh.style.transition = ''; w.ghostAt = w.ghostAt || {}; w.ghostAt.hilltop = { x:P.x, y:P.y }; }
  walkGhostFaceToward(p.x + 0.5);                   // he looks at you…
  walkFaceToward(P.x + 0.5);                        // …and you at him
  refreshWalk();
  await sceneSay([faceMon('whalelord')], whaleName(), r5PoolLine());
  w.busy = false;
  ui.sceneRunning = false;
}
/* Grandpa (Lucia's, from the harbour): a bed and a bowl of something, up
   here where the tower's fights are — Recover. */
const R5_GRANDPA_LINES = [
  `<b>"Lemonade? They're the Padrino's lemons. Don't tell him."</b>`,
  `<b>"Lucia says the dead in the tunnels don't sleep proper. I told her that. Nobody listens to me."</b>`,
  `<b>"That tower wasn't there when I was a boy. They built it for those mediums, and the lemons have never tasted right since."</b>`,
];
async function r5Grandpa(){
  const r = r5();
  const first = r5Once('grandpa');
  const html = first
    ? `He settles back into his rocking chair and looks you over.<br><br>` +
      `<b>"A junior? Up here? You look done in. Sit down, sit down."</b><br><br>` +
      `<b>"My granddaughter Lucia mends the nets down at the harbour. You've met her? She talks too much. Gets it from me."</b>`
    : r.holdBroken ? `<b>"Can you hear that? Singing, under the hill. I haven't heard that since I was a boy."</b>`
                   : r5Turn('grandpa', R5_GRANDPA_LINES);
  const yes = await r5Ask([faceNpc('grandpa', '👴')], 'Grandpa', html, '🍋 Rest here', 'Not now');
  if(yes) leaveDeck('recover');
}

/* ============================================================
   THE TOWN'S ROOMS (3.03) — going in, coming out, and who is inside
   The designer: "draw up some rooms for the existing buildings, and put 10
   tokens in each of them … have the relevant NPCs inhabit it. None of them
   should be sleeping, let Nonna's house be filled with Nonna who is awake."
   A building's door (In) takes you inside — the first time, with a word at
   the door (R5_ROOM_DOOR) — and its own door (Out) back onto the street.
   Each room has one find of 10 Skill Tokens, and whoever lives there says
   you may keep it (R5_ROOM_FIND). In the Old Town and on the Hilltop the
   uniform works in a room as at Ugo's: off with it if you like, and on again
   before you go out (r5RoomOut asks, until the dead are loose for good).
   ============================================================ */
/* The first time at each door. */
const R5_ROOM_DOOR = {
  room_marta:{ face:['fishwife', '👩'], name:'Signora Marta',
    text:()=> `You knock. A voice from inside: <b>"It's open! Come in, come in — and wipe your feet."</b>` },
  room_lucia:{ face:['net_mender', '🧶'], name:'Net-mender Lucia',
    text:()=> `<b>"That's our house. My little brother Pippo's in there."</b> She does not look up from her net. <b>"Don't let him talk your ears off."</b>` },
  room_station:{ face:['station_master', '🎩'], name:'Station master Enzo',
    text:()=> `A little bell jingles over the door. From behind the ticket window: <b>"Come in, come in. Nobody else does."</b>` },
  room_customs:{ name:'The customs house',
    text:()=> `A brass plate by the door says <b>CUSTOMS</b>. Somebody has scratched <b>FAMILY BUSINESS</b> underneath it.<br><br>The door is not locked. Inside, somebody is counting money out loud.` },
  room_warehouse:{ face:['dockhand', '📦'], name:'Dockhand Tino',
    text:()=> `<b>"In here! Mind the crates."</b>` },
  room_nonna:{ face:['nonna', '👵'], name:'Nonna',
    text:()=> `You knock. Quick footsteps — and the door flies open. A tiny old woman looks you up and down.<br><br>` +
              `<b>"Finally! Somebody to feed!"</b> She pulls you in by the sleeve.` },
  room_barber:{ name:"The barber's",
    text:()=> `A sign in the window says <b>BACK SOON</b> — and by the dust on it, it has said so for a long time.<br><br>` +
              `But a bell rings as you open the door, and somebody inside calls, <b>"Coming, coming!"</b>` },
  room_opera:{ name:'The opera house', text:()=> r5OperaDoorText() },
  room_police:{ name:'The police station',
    text:()=> `Through the window: two policemen at their desks, wide awake and sitting very straight, as if they have been waiting all night for something to happen.` },
  room_post:{ name:'The post office',
    text:()=> `The post office is still open. Inside, a young woman is sorting a mountain of letters, very fast.` },
  room_cafe:{ name:'The café',
    text:()=> `The capos' tables are all outside. Inside, it smells of coffee, and the barista is humming one of Figlio's songs as she polishes the cups.` +
      (r5().holdBroken ? '' : `<br><br>Two soldatos sit over their coffee at a corner table, talking in low voices.`) },   // (3.07)
  room_trattoria:{ name:'The trattoria',
    text:()=> `Something inside smells wonderful. Garlic, and tomatoes, and bread.` +
      (r5().holdBroken ? '' : `<br><br>Two soldatos are already at a table, eating as if they have not eaten all week.`) },   // (3.07)
  room_gelateria:{ name:'The gelateria',
    text:()=> `A sign on the door says <b>CLOSED</b> — but the lights are on, and somebody inside is stirring a huge silver tub.` },
  room_grandpa:{ face:['grandpa', '👴'], name:'Grandpa',
    text:()=> `The door opens a crack. An old man peers at your uniform, then at your face — and opens it all the way.<br><br><b>"Come in, come in. Quick, before the lemons see you."</b>` },
  room_lemons:{ name:'The lemon farm',
    text:()=> `The big doors of the packing shed stand open, and the smell of lemons rolls out into the road.` },
  room_guards:{ name:'The guard house',
    text:()=> r5().holdBroken
      ? `The door stands open. Inside, the cards lie scattered across the table, a game left half-played. Every soldato on the hill is out fighting the dead.`
      : `Inside, off-duty soldatos are playing cards and arguing about who cheated. Nobody looks up at a junior.` },
};
/* (3.03, the designer: "Opera house description should change once Figlio
   starts standing outside") — he stands on its steps once you wear Ugo's
   uniform; the scales come from him now, not from inside. */
function r5OperaDoorText(){
  const r = r5();
  if(!r.disguise)
    return `A poster by the door: <b>FIGLIO SINGS — EVERY NIGHT BUT MONDAY</b>. The doors are shut, but somebody inside is practising scales, very loudly.`;
  return `A poster by the door: <b>FIGLIO SINGS — EVERY NIGHT BUT MONDAY</b>.<br><br>` + (r.figlioMet
    ? `Figlio is out on the steps, warming up his voice. He waves you in.`
    : `And there is the singer himself, out on the steps — running scales at the top of his voice. The doors behind him stand open.`);
}
async function r5RoomDoor(id){
  const d = DECKS[id];
  if(!d || ui.sceneRunning || walkState().busy || document.querySelector('.scene-say')) return;
  const door = R5_ROOM_DOOR[id];
  if(door && r5Once('door_' + id)){
    /* (3.07) the guard house's door says it already, after the hold breaks:
       not again inside (r5RoomRender) */
    if(id === 'room_guards' && r5().holdBroken) r5().said.guardsEmpty = true;
    await sceneSay(door.face ? [faceNpc(door.face[0], door.face[1])] : [], door.name, door.text());
  }
  goFloor(id, 'door');
}
/* Out onto the street: in the Old Town and on the Hilltop, in uniform (until
   the dead are loose for good, and nobody has eyes for you). */
async function r5RoomOut(zone, where){
  const r = r5();
  if(ui.sceneRunning || walkState().busy) return;
  if(zone !== 'harbour' && r.disguise && !r.disguised && !r.holdBroken){
    const yes = await r5Ask([faceMon('whalelord')], whaleName(),
      `<b>"Out there, every one of them knows your face. Put on the disguise first."</b>`, '🎭 Put it on', 'Stay inside');
    if(!yes) return;
    r5SetDisguise(true);
  }
  goFloor(zone, where);
}
/* Where the Family's men sat — the guard house's card players, and (3.07)
   the café's and the trattoria's soldatos — once the dead are loose for good:
   said once, the first time in after that. */
const R5_ROOM_EMPTY = {
  room_guards:   { key:'guardsEmpty',
    text:`The cards lie scattered across the table, a game left half-played. Every soldato on the hill is out fighting the dead.` },
  room_cafe:     { key:'emptyCafe',
    text:`Two cups of coffee going cold on a table, and the chairs pushed back in a hurry. The soldatos who were drinking them are out in the streets, fighting the dead.` },
  room_trattoria:{ key:'emptyTrattoria',
    text:`Two plates of clams, barely touched, and the chairs pushed back in a hurry. The soldatos who were eating them are out in the streets, fighting the dead.` },
};
function r5RoomRender(world, d){
  if(ui.sceneRunning) return;
  const e = R5_ROOM_EMPTY[d.key];
  if(e && r5().holdBroken && !r5().said[e.key])
    setTimeout(()=>{
      if(ui.screen !== d.key || ui.sceneRunning || document.querySelector('.scene-say') || !r5Once(e.key)) return;
      sceneSay([], d.title, e.text);
    }, 500);
}
/* (3.07) Not in front of the Family's men, sitting in a room (the guard
   house's, the café's, the trattoria's): no taking the uniform off there. */
function r5MenInRoom(d){ return !!(d && d.house && deckThings(d).some(t=> /^soldato/.test(t.sprite || ''))); }
/* Whoever lives in the room, and what they say — in turn, the first line
   first. `free`: once, the first time after the dead are loose for good;
   `nino`: once, the first time after you have met him; `whale`: what the
   Whalelord says after a line (once). */
const R5_FOLK = {
  pippo:{ name:'Pippo', sprite:'pippo', icon:'🧒',
    lines:[
      `He looks up from the rug, where he is sailing a little wooden boat.<br><br><b>"Are you a REAL trainer? With real monsters?"</b> He stares at your party. <b>"…WOW."</b>`,
      `<b>"When I'm big, I'm going to have a monster as big as a boat. Bigger! As big as a WHALE!"</b>`,
      `<b>"Lucia won't let me go down to the beach on my own. She says I'm too little. So she always waits for me — even when I'm really slow."</b>`,
      `<b>"I've got a crab. He's called Captain. He lives in a bucket."</b> He holds up a finger. <b>"He pinches."</b>`,
    ],
    whale:{ 1:`<b>"…I like this one."</b>` },
    free:`<b>"Lucia says the ghosts are out tonight, singing. I'm not scared."</b> He thinks about it. <b>"Only a bit."</b>` },
  customs_clerk:{ name:'Clerk Bruno', sprite:'customs_clerk', icon:'🧾',
    lines:[
      `<b>"Fourteen, fifteen, sixteen — shh! Don't talk to me, I'll lose count."</b> He writes something down. <b>"Sixteen. Half of every catch, for the Family."</b>`,
      `<b>"I am not Family. I only count for them. Somebody has to — they don't trust each other."</b>`,
      `<b>"Paying duty? No? Then please don't drip on my floor."</b>`,
      `<b>"Every coin I count goes up the hill in a little box. I have never once seen one come back down."</b>`,
    ],
    free:`<b>"Nobody has come in to pay all night. The soldatos are all out chasing ghosts."</b> He sighs. <b>"I have counted the same coin forty times."</b>` },
  nonna:{ name:'Nonna', sprite:'nonna', icon:'👵',
    lines:[
      `<b>"Sit, sit! Soldato or no soldato, you are all skin and bones. Eat something."</b> She pushes a plate at you. <b>"No — eat MORE."</b>`,
      `<b>"When I was young, the Family was three men and a boat. Now look at them. They even own the lemons."</b>`,
      `<b>"A long time ago, every morning, two boys came past my window. A big one, with a little one riding on his back — the little one was too poorly to walk far."</b><br><br>` +
        `She looks at the window for a while. <b>"Then one spring, the big one came past all alone. He never smiled again."</b>`,
      `<b>"My cat sits in that window all day, watching the soldatos. She doesn't trust them either. Clever cat."</b>`,
    ],
    nino:`<b>"Nino. That was the little one's name — I remember now. Always laughing, up there on his big brother's back."</b><br><br>` +
      `She wipes her eyes. <b>"I lit a candle for him every year."</b>`,
    free:`<b>"Do you hear them singing, under the hill? I am too old to be frightened."</b> She hums along. <b>"I know this one."</b>` },
  barber:{ name:'Barber Toni', sprite:'barber', icon:'💈',
    lines:[
      `<b>"BACK SOON, says the sign. I wrote it twenty years ago, when the Family stopped paying for haircuts."</b> He shrugs. <b>"And I'm back. Soon. Any day now."</b>`,
      `<b>"A trim, junior? No? The cap hides it anyway."</b>`,
      `<b>"The capos come in every Sunday for a shave. I am very, very careful."</b>`,
      `<b>"Figlio comes in every week. He says a singer must look his best, even for the back row."</b>`,
    ],
    free:`<b>"Have you seen the ghosts out there? Every one of them could do with a haircut."</b>` },
  maestro:{ name:'Maestro Vito', sprite:'maestro', icon:'🎹',
    lines:[
      `<b>"Shh! I'm tuning. Figlio says the piano is flat."</b> He plays one note, and sighs. <b>"Figlio says everything is flat."</b>`,
      `<b>"He practises out on the steps. He says the sound is better out there."</b> He sniffs. <b>"I say he likes being looked at."</b>`,
      `<b>"Every night but Monday, he sings — and every night there is one empty seat in the front row. His father's."</b>`,
      `<b>"When Figlio was small, he hid under this very piano to listen. Now he sings up on that stage."</b>`,
    ],
    free:`<b>"Last night the dead sang along."</b> He winces. <b>"Badly. Figlio was furious."</b>` },
  police1:{ name:'Officer Rossi', sprite:'police1', icon:'👮',
    lines:[
      `<b>"We are the police. The Family says we can keep the station, as long as we never police anything."</b>`,
      `<b>"That calendar? The Family gives us one every year. This year it's boats."</b> He turns a page. <b>"Last year it was also boats."</b>`,
      `<b>"Crime? There is no crime in Cosa Nostia. The Family says so."</b> He coughs. <b>"Very loudly."</b>`,
    ],
    free:`<b>"Ghosts in the streets, singing! Should we arrest them?"</b> He thinks hard. <b>"Can you arrest a ghost?"</b>`,
    freeWhale:`<b>"He is welcome to try."</b>` },
  police2:{ name:'Officer Bianchi', sprite:'police2', icon:'👮',
    lines:[
      `<b>"Shh. I'm practising my stern face."</b> He frowns at you, very hard. <b>"Is it stern? It isn't stern, is it."</b>`,
      `<b>"We have a cell. Nobody has been in it for twenty years. I keep it very tidy."</b>`,
      `<b>"Have you seen our WANTED poster? A kid from the catacombs. Beat two capos, they say."</b> He squints at you. <b>"Funny. The drawing looks a bit like you."</b>`,
    ],
    whale:{ 2:`<b>"It looks nothing like you. They have drawn your ears far too big."</b>` },
    free:`<b>"A ghost walked into our cell last night — straight through the bars."</b> He sighs. <b>"Twenty years, and our first prisoner walks out again."</b>` },
  /* (3.06, the designer: "barista - jolly young female") */
  barista:{ name:'Barista Gina', sprite:'barista', icon:'☕',
    lines:[
      `<b>"Coffee? You're far too young for coffee!"</b> She laughs. <b>"Hot milk, then — with a little coffee in it. Our secret."</b>`,
      `<b>"The capos drink twelve coffees a night. Twelve! They never sleep."</b> She giggles. <b>"Maybe that's why they're so grumpy."</b>`,
      `<b>"That table by the door is the capos'. They count the Family's money on it every night. I count the cups — and I always win."</b>`,
      `<b>"The Consigliere takes three sugars."</b> She puts a finger to her lips. <b>"Don't tell anybody — he thinks it makes him look soft."</b>`,
    ],
    free:`<b>"A ghost came in tonight and sat at table four, so I brought him an espresso."</b> She beams. <b>"He seemed to like it!"</b>` },
  gelataio:{ name:'Gelataio Paolo', sprite:'gelataio', icon:'🍨',
    lines:[
      `<b>"Closed! Closed."</b> He looks at you. <b>"…Oh, all right. One taste. Pistachio — it's the best. I underlined it three times."</b>`,
      `<b>"Forty flavours, and the Family only ever orders lemon. The Padrino's own lemons."</b> He shudders. <b>"I hate lemon."</b>`,
      `<b>"Every night I make tomorrow's gelato. It takes all night long. That's why my lights are always on."</b>`,
    ],
    free:`<b>"The ghosts like stracciatella."</b> He scratches his head. <b>"Who knew?"</b>` },
  lemon_farmer:{ name:'Old Sergio', sprite:'lemon_farmer', icon:'🍋',
    lines:[
      `<b>"Every lemon on this hill goes to the Padrino's table. Every single one. And he doesn't even like lemons!"</b>`,
      `<b>"Since they built that tower, the lemons have come up sour."</b> He thinks. <b>"Well — sourer."</b>`,
      `<b>"He counts them, you know. Every lemon. So no, you can't have one."</b>`,
    ],
    free:`<b>"The ghosts walk through the terraces at night, singing. The lemons have never been so sweet."</b>` },
  cards1:{ name:'Soldato', sprite:'soldato1', icon:'💂',
    lines:[
      `<b>"Deal you in, junior? No? Good. You'd only lose."</b>`,
      `<b>"He cheats. I know he cheats. I just can't prove he cheats."</b>`,
      `<b>"Off duty means off duty. Whatever it is, ask somebody else."</b>`,
    ] },
  cards2:{ name:'Soldato', sprite:'soldato2', icon:'💂',
    lines:[
      `<b>"I don't cheat. I'm just lucky."</b> He lays down his cards. <b>"Every single time."</b>`,
      `<b>"Don't touch the cards, junior."</b>`,
      `<b>"Your turn on the gate tonight? Rather you than me."</b>`,
    ] },
  /* (3.07, the designer: "Can we have some soldatos or capos in the
     eatery/cafe … But not covering the ticket spot") — soldatos: each capo is
     one man in one place, and theirs are the tables outside. They talk to a
     junior as one of their own, and they know only what soldatos are told. */
  cafe1:{ name:'Soldato', sprite:'soldato2', icon:'💂',
    lines:[
      `<b>"Shh! The capos are right outside. If anybody asks, I've been on my rounds all night."</b> He blows on his coffee.`,
      `<b>"This is my fifth coffee tonight. I can't feel my ears."</b>`,
      `<b>"Gina gives us the broken biscuits. The capos get the whole ones. That's the Family for you."</b>`,
    ] },
  cafe2:{ name:'Soldato', sprite:'soldato1', icon:'💂',
    lines:[
      `<b>"Did you hear? Some kid went right through the catacombs, past every one of us — and beat two capos!"</b> He shakes his head. <b>"A KID. Imagine."</b>`,
      `<b>"The Padrino's great work, up at the villa? Nearly ready, they say. Then no more night shifts. Ever."</b>`,
      `<b>"I was a junior once. My first night on the gate, I saluted a lamp-post."</b> He sighs. <b>"It was very dark."</b>`,
    ],
    whale:{ 0:`<b>"…Keep a straight face."</b>` } },
  tratt1:{ name:'Soldato', sprite:'soldato1', icon:'💂',
    lines:[
      `<b>"Clams again! Every night, clams. The Family takes all the fish, and then the Family eats clams."</b> He eats another one anyway.`,
      `<b>"Best food in Cosa Nostia. Don't tell my mother I said that."</b>`,
      `<b>"I'm not hiding from the capos. I'm having a very, very long supper."</b>`,
    ] },
  tratt2:{ name:'Soldato', sprite:'soldato2', icon:'💂',
    lines:[
      `<b>"Eat up, junior. Franco says you'll never grow if you only eat once a day."</b>`,
      `<b>"Down in the catacombs it's cold, and dark, and full of ghosts. Up here, there's bread."</b> He tears off a big piece. <b>"I know where I'd rather be."</b>`,
      `<b>"Psst. If Franco asks, you LOVED the clams."</b>`,
    ] },
};
async function r5Folk(id){
  const f = R5_FOLK[id], r = r5();
  if(!f || ui.sceneRunning || walkState().busy || document.querySelector('.scene-say')) return;
  const face = [faceNpc(f.sprite, f.icon)];
  let line, after = null;
  if(f.free && r.holdBroken && r5Once('folkFree_' + id)){ line = f.free; after = f.freeWhale || null; }
  else if(f.nino && r.ninoMet && r5Once('folkNino_' + id)) line = f.nino;
  else {
    const i = (r.said['t_folk_' + id] || 0) % f.lines.length;
    line = r5Turn('folk_' + id, f.lines);
    if(f.whale && f.whale[i] && r5Once('folkWhale_' + id + '_' + i)) after = f.whale[i];
    saveProfile();
  }
  await sceneSay(face, f.name, line);
  if(after) await sceneSay([faceMon('whalelord')], whaleName(), after);
}
/* The police station's WANTED poster. */
async function r5WantedPoster(){
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  await sceneSay([], 'A poster',
    `<b>WANTED — A KID, SEEN IN THE CATACOMBS.</b><br>Beat two capos. Do not approach. Tell a capo at once.<br><br>` +
    `The drawing is very bad: a stick figure with enormous ears.`);
  if(r5Once('posterWhale'))
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"It looks nothing like you. They have drawn your ears far too big."</b>`);
}
/* Each room's find, and whoever lives there telling you to keep it. */
const R5_ROOM_FIND = {
  room_marta:     `Marta sees what you have found, and laughs. <b>"Gino's lucky tokens! He hides them all over the house. Keep them — he'd only lose them again."</b>`,
  room_lucia:     `Pippo gasps. <b>"You found my treasure!"</b> He thinks very hard. <b>"…You can keep it. Trainers need tokens."</b>`,
  room_station:   `Enzo sees what you have found, and shrugs. <b>"Lost property. Nobody has claimed it in forty years. It's yours."</b>`,
  room_customs:   `The clerk sees what you have found — and looks very hard at his ledger instead. <b>"It isn't in the book. If it isn't in the book, it doesn't exist. Keep it."</b>`,
  room_warehouse: `Tino glances over. <b>"Found something in the crates? Finders keepers. That's the rule in here."</b>`,
  room_nonna:     `Nonna sees what you have found. <b>"Keep it! Keep it. And take some bread for the road."</b>`,
  room_barber:    `The barber winks. <b>"Tips! Nobody has left me a tip in twenty years. Keep them."</b>`,
  room_opera:     `The Maestro does not look up from the keys. <b>"Coins on the stage? Thrown for Figlio, I expect. He won't miss them. Keep them."</b>`,
  room_police:    `Officer Bianchi peers in through the bars. <b>"Oh! The last prisoner left those — twenty years ago. I don't think he's coming back for them. Keep them."</b>`,
  room_post:      `Carla does not even stop sorting. <b>"No name on it, no address? Then it's yours!"</b>`,
  room_cafe:      `The barista laughs. <b>"Change from the capos' coffees! They never wait for it. Take it."</b>`,
  room_trattoria: `Chef Franco waves his ladle at you. <b>"Tips under the plates! Take them, take them — you're a growing junior."</b>`,
  room_gelateria: `Paolo looks at the tokens, then at you. <b>"I dropped those in the pistachio. You can keep them."</b> He thinks. <b>"Wash them first."</b>`,
  room_grandpa:   `Grandpa chuckles. <b>"Lemon money! The Padrino pays me in tokens and lemons, and I've more lemons than I'll ever need. Keep it."</b>`,
  room_lemons:    `Sergio squints at what you have found. <b>"The Padrino's coins? He drops them when he comes to count the lemons. He won't count those. Keep them."</b>`,
  room_guards:    `Under the table: somebody's winnings, dropped in a hurry. Finders keepers.`,
  villa:          `Behind a row of books: an old tin box of tokens, its lid rusted shut. Nobody has missed it in years.`,
};
Object.keys(R5_ROOM_FIND).forEach(id=>{ if(R5_DECKS[id]) R5_DECKS[id].prizeLines = [R5_ROOM_FIND[id]]; });
/* The Whalelord, in each room, the first time you ask him there. */
const R5_GHOST_ROOMS = {
  room_marta:     `Soup. I remember soup. Not the taste — only that it was warm.`,
  room_lucia:     `He wants a monster as big as a whale. If only he knew who was standing behind you.`,
  room_station:   `Forty years at the same window. Some people wait their whole lives for one journey.`,
  room_customs:   `Half of every catch, and they call it protection.`,
  room_warehouse: `Some of those crates hum. Cores, I think, waiting to go up the hill. Not mine. Someone else's.`,
  room_nonna:     `She would feed me too, if she could see me. I am almost sorry she cannot.`,
  room_barber:    `Back soon, for twenty years. Humans can be very patient when they have to be.`,
  room_opera:     `Figlio sings to an empty seat every night. Families are complicated. Even the Family.`,
  room_police:    `Two policemen with nothing to police. They look almost relieved.`,
  room_post:      `So many letters. So many people, waiting to hear from somebody.`,
  room_cafe:      `They drink coffee all night and never sleep. That explains a great deal.`,
  room_trattoria: `Everybody who comes in here leaves a little less tired. That is a kind of magic too.`,
  room_gelateria: `Forty flavours. I do not know what any of them taste like. I am sure they are wonderful.`,
  room_grandpa:   `If they ever catch you up here, this is the door to run for.`,
  room_lemons:    `Every lemon on the hill, for one man's table. That is the Padrino all over.`,
  room_guards:    `Off duty, they are only tired men playing cards. It is the uniform that makes them frightening.`,
};
/* (3.07) …said once a day now: these two only while the Family can still
   catch you (once the dead are loose, nobody runs for Grandpa's door, and
   the guard house's cards lie where they fell). */
const R5_GHOST_ROOMS_WHILE = {
  room_grandpa:()=> !r5().holdBroken,
  room_guards: ()=> !r5().holdBroken,
};

/* ============================================================
   THE VILLA (3.04) — step 2 of the build (part 6 §12b, "The build, in five
   steps"): the Monkey King outside — impressed, the stones and where each
   one is, his leap — the Sottocapo at the door, the calm villa with the
   Madrina and the photograph, and the cellar stair.
   The designer: "Monkey King meets the player outside the villa and says
   he's impressed the player got this far. He reminds the player to collect
   all the stones before proceeding. He then jumps up into the villa,
   leaving the player to go in. But the villa is strangely less chaotic than
   anticipated. Whalelord says he senses a final layer of protection that
   comes from right under the villa — the top tier of the catacombs."
   r5(): mkVilla (the Monkey King has been and gone in), sottoBeaten (the
   Sottocapo beaten at the door — he goes on ahead, down to his master: the
   hexagon forms as each of them, beaten, goes ahead), villa (in, the first
   time), madrinaMet / madrinaGone (she has told you, and gone down to her
   brother), cellarSeen (the stair down: the top tier, still to come).
   ============================================================ */
/* The stones the Monkey King will lend you his strength through (part 6 §12,
   "His stone rules"): the elemental stones whose Very High he casts. (His
   own Physical Stone — Counter ✦ — he carries himself; 3.05.) */
const R5_MK_STONES = ['dragonStone', 'fireStone', 'ghostStone', 'electricStone', 'waterStone', 'fairyStone'];
function r5StonesMissing(){ return R5_MK_STONES.filter(id=> !ownsStone(id)); }
function r5StoneName(id){ const s = stoneDef(id); return s ? s.name : id; }
/* Where a stone you do not have can be found — said plainly. */
function r5StoneWhere(id){
  const r = r5();
  if(typeof rivalStones === 'function' && rivalStones().includes(id))
    return `Jax won it from you on the ship. He is here somewhere — under this house.`;
  switch(id){
    case 'dragonStone':
      return `Figlio gives one to whoever beats him first. He sings at the opera house, down in the Old Town.`;
    case 'fireStone':
      return r5MyPhoenix()
        ? `The old phoenix in the Armoury, under the harbour, is keeping the last of its fire for your phoenix. Take it there.`
        : `The old phoenix in the Armoury, under the harbour, is keeping the last of its fire for a phoenix. The Tranquil Forest, where we began, has one now and then.`;
    case 'electricStone':
      return (typeof hasNewt === 'function' && hasNewt())
        ? `The siblings at the Electric Dojo, across the sea, kept one for the Thunder Newt. Take your Newt to them.`
        : `The siblings at the Electric Dojo, across the sea, kept one for the Thunder Newt. Find the Newt first — deep in the volcano.`;
    case 'waterStone':
      return `The shipkeeper aboard the Vane Shear sells one. Only one, ever — 100 Skill Tokens.`;
    case 'ghostStone':
      return `Jax had it once, on the ship. Beat him for it.`;
    case 'fairyStone':
      return `It was in the Ghost Master's ring, at the top of the tower.`;
  }
  return '';
}
/* The Whalelord's reminder (the designer's prelude: "the Whalelord's talk
   gains an option that reminds you of the ones still missing"). */
async function r5StonesReminder(){
  const miss = r5StonesMissing();
  const W = whaleName(), whale = ()=> faceMon('whalelord');
  if(!miss.length) return sceneSay([whale()], W, `<b>"Every stone he asked for. He will be pleased — not that he will say so."</b>`);
  await sceneSay([whale()], W, `<b>"The Monkey King's stones. We still have no ${miss.map(r5StoneName).join(', no ')}."</b>`);
  for(const id of miss) await sceneSay([uiIcon(stoneDef(id).icon, 64, stoneDef(id).emoji)], r5StoneName(id), `<b>"${r5StoneWhere(id)}"</b>`);
}
/* The Monkey King outside the villa (3.04). He lands beside you, says his
   piece — the stones, and where each one is — and leaps over the
   Sottocapo's head into the villa. */
function r5MKDue(){ const r = r5(); return !!(r.holdBroken && r.ninoMet && !r.mkVilla); }
/* The forecourt, before the villa's door — (3.32) its courtyard, round the
   fountain, from the top of the path up to the door. */
function r5InForecourt(p){ return !!p && p.y >= 4 && p.y <= 8 && p.x >= 10 && p.x <= 15; }
function r5HillStep(d, p){
  if(d.key !== 'hilltop' || ui.sceneRunning || !r5MKDue() || !r5InForecourt(p)) return;
  setTimeout(()=>{ if(ui.screen === 'hilltop' && r5MKDue() && !ui.sceneRunning) r5MKVilla(); }, 250);
}
/* An actor over an arc, `up` tiles high at the top. */
function r5LeapActor(id, x, y, ms, up, fade){
  const el = document.getElementById('sa-' + id);
  if(!el || !el._o) return sceneWait(ms);
  const T = WALK_T, x0 = el._o.x, y0 = el._o.y;
  if(Math.abs(x - x0) > 0.05) actorFace(el, x > x0);
  el.style.transition = 'none';
  return r5Tween(ms, t=>{
    const cx = x0 + (x - x0) * t, cy = y0 + (y - y0) * t - up * 4 * t * (1 - t);
    el.style.left = (cx * T) + 'px'; el.style.top = (cy * T) + 'px';
    if(fade) el.style.opacity = String(Math.max(0, 1 - Math.max(0, t - 0.6) / 0.4));
  }).then(()=>{ el._o.x = x; el._o.y = y; });
}
async function r5MKVilla(){
  const r = r5();
  if(ui.sceneRunning || r.mkVilla) return;
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  const p = (w.at && w.at.hilltop) || { x:12, y:11 };
  const q = (w.ghostAt && w.ghostAt.hilltop) || p;
  const MK = 'Monkey King', mk = ()=> faceMon('monkey_king', { stage:1 });
  const W = whaleName(), whale = ()=> faceMon('whalelord');
  const S = 'Sottocapo', sotto = ()=> faceNpc('sottocapo', '🕴️');
  /* where he lands: beside you — two steps along if there is room, else one,
     else above or below you — on open ground, never on the Whalelord, a
     soldato, the fountain or the Sottocapo (3.32: the courtyard is narrow) */
  const hd = DECKS.hilltop;
  const open = (x, y)=> !wSolid(hd, x, y) && !wBlockedBy(hd, x, y) && !wOccupied(hd, x, y) &&
                        !(x === p.x && y === p.y) && !(x === q.x && y === q.y);
  const [lx, ly] = [[2,0],[-2,0],[1,0],[-1,0],[0,-1],[0,1],[1,-1],[-1,-1],[1,1],[-1,1],[0,-2],[0,2]]
    .map(([dx, dy])=> [p.x + dx, p.y + dy]).find(([x, y])=> open(x, y)) || [p.x + 1, p.y];
  r5MonActor('mk', 'monkey_king', lx - 0.2, ly - 7, 1.4, { html:monPortrait('monkey_king', Math.round(WALK_T * 1.4), { view:'front', bare:true, stage:1 }), z:70 });
  actorFace('mk', lx < p.x);                     // he looks at you
  walkFaceToward(lx + 0.5);
  await sceneWait(300);
  await r5LeapActor('mk', lx - 0.2, ly - 0.4, 700, 0, false);
  sceneShake(500, t=> 0.1 * Math.max(0, 1 - t / 500));
  await sceneWait(400);
  await sceneSay([], '', `Somebody drops out of the sky and lands beside you with a thump — and straightens up, grinning, with one of the Padrino's lemons in his hand, peel and all.`);
  await sceneSay([mk()], MK, `<b>"So. You made it."</b>`);
  await sceneSay([mk()], MK,
    `<b>"In the dojo I told you that you had grown — but not enough."</b> He looks at the tower, and down the hill, where the dead are singing. ` +
    `<b>"The tower, beaten. The dead, set free. And here you are, at the Padrino's own front door."</b>`);
  await sceneSay([mk()], MK, `<b>"I am impressed. Do not let it go to your head. I almost never am."</b>`);
  /* the stones, and where each one is */
  const miss = r5StonesMissing(), held = R5_MK_STONES.filter(id=> ownsStone(id));
  if(!miss.length){
    await sceneSay([mk()], MK, `<b>"Did you find the stones, as I told you?"</b> He counts them in your bag with one finger. <b>"…Every one. You listen better than I did at your age."</b>`);
  } else {
    await sceneSay([mk()], MK, `<b>"Did you find the stones, as I told you?"</b> He counts them in your bag with one finger.<br><br>` +
      (held.length ? `<b>"The ${held.map(r5StoneName).join(', the ')}. Good. "</b>` : '') +
      `<b>"But no ${miss.map(r5StoneName).join(', no ')}."</b>`);
    await sceneSay([mk()], MK, `<b>"Listen. I will tell you where they are."</b>`);
    for(const id of miss) await sceneSay([uiIcon(stoneDef(id).icon, 64, stoneDef(id).emoji)], r5StoneName(id), `<b>"${r5StoneWhere(id)}"</b>`);
    await sceneSay([mk()], MK, `<b>"Find them before you come down after me — or come without them, if you are brave. Or foolish. I will not wait."</b>`);
  }
  /* (3.05, the designer: "He personally has the physical stone too which
     gives him the move counter for this fight") — his own, not yours to find:
     Counter ✦ in the fight (part 6 §12, his first stone line) */
  await sceneSay([mk(), uiIcon('physical_stone', 64, '👊')], MK,
    `He opens his fist. In his palm sits a stone of his own.<br><br>` +
    `<b>"And this one is mine — the Physical Stone. In there, it gives me Counter: the next two blows they throw at any of us land on my guard, ` +
    `four fifths of each turned away, and then we hit back a quarter harder."</b>`);
  await sceneSay([mk()], MK, `<b>"When the time comes, lend me your stones. I will show you what they can really do."</b>`);
  await sceneSay([mk()], MK,
    `He sniffs the air, and stops grinning.<br><br><b>"He has something down there with him. Something that should not exist. ` +
    `It smells like a clock running backwards."</b>`);
  /* (3.17, part 6 §12c) "something troubles him about how familiar the
     energy is, though he can only sense it from time to time" */
  await sceneSay([mk()], MK, `He turns his head sharply, as if somebody had called his name.<br><br>` +
    `<b>"…And something else. There — did you feel it? Cold. And gone again."</b>`);
  await sceneSay([mk()], MK, `<b>"I know that cold. I have felt it before — long, long ago. But I cannot remember where."</b>`);
  if(r.said.malice1){
    await sceneSay([whale()], W, `<b>"We have felt it all over this island, now and then. Deep down."</b>`);
    await sceneSay([mk()], MK, `<b>"Then it has been here a long time."</b> He scowls at the ground under his feet. <b>"It troubles me."</b>`);
  } else await sceneSay([mk()], MK, `He scowls at the ground under his feet.<br><br><b>"It troubles me."</b>`);
  await sceneSay([mk()], MK, `<b>"I have waited a long time for this. I go first."</b>`);
  /* over the Sottocapo's head, onto the roof, and in — (3.32) the roof over
     the great door, at the top of the courtyard */
  sceneShake(400, t=> 0.08 * Math.max(0, 1 - t / 400));
  await r5LeapActor('mk', 12.3, 0.2, 1300, 3, true);
  sceneActorGone('mk');
  r.mkVilla = true;
  await saveProfile();
  await sceneSay([], '', `He leaps — clean over the Sottocapo's head — onto the villa's roof, and in through a skylight. Somewhere inside, glass falls like rain.`);
  ghostAlert();
  await sceneSay([whale()], W, `<b>"…He did not even use the door."</b>`);
  walkFaceToward(13);
  await sceneSay([sotto()], S, r.disguised
    ? `The Sottocapo stares up at the roof, then down at you.<br><br><b>"Figlio's porter. I KNEW I knew that face. The kid from the caverns — and you brought THAT here?"</b>`
    : `The Sottocapo stares up at the roof, then down at you.<br><br><b>"The kid from the caverns. The one on the Water Dragon. And you brought THAT here?"</b>`);
  await sceneSay([sotto()], S, `He cracks his knuckles, one at a time.<br><br><b>"Nobody goes through this door. Not the monkey. Not you. Not tonight."</b>`);
  w.busy = false;
  ui.sceneRunning = false;
  refreshWalkAll();
  return r5SottoAsk();
}
/* The Sottocapo, between you and the door, until he is beaten. */
const R5_SOTTO_LV = 100;
function r5SottoNote(){
  return `<i>The Padrino's right hand: <b>4 waves — 10 monsters, level ${R5_SOTTO_LV}</b> — his old team from the caverns, grown up, then his ` +
    `best; the last a <b>crowned Lizardape</b> (10 supplements). No running. Win for <b>+3 Protein Supplements</b>.</i>`;
}
async function r5SottoAsk(){
  const r = r5(), S = 'Sottocapo';
  const yes = await r5Ask([faceNpc('sottocapo', '🕴️')], S,
    (r.disguised ? `<b>"Back again, porter? Nobody goes through this door tonight."</b>`
                 : `<b>"No cap. No coat. No porter. The kid from the caverns — the one on the Water Dragon."</b><br><br>` +
                   `<b>"My men have the dead to deal with tonight. But this door I keep myself. Nobody goes in."</b>`) +
    `<br><br>${r5SottoNote()}`, '⚔️ Fight', 'Not yet');
  if(!yes){
    if(!r.disguised && r5Once('sottoWhale'))
      await sceneSay([faceMon('whalelord')], whaleName(),
        `<b>"The dead have no hold on that one. He has stood in that doorway too long to be afraid of ghosts."</b>`);
    return;
  }
  r5SottoFight();
}
function r5SottoBattle(){
  const L = R5_SOTTO_LV;
  return { isNpc:true, name:'Sottocapo', npcId:'sottocapo', noFlee:true, bgKey:'battle_villa',
    waves:[
      [{species:'golem', level:L, ai:'best'}, {species:'earth_snake', level:L, ai:'best'}, {species:'bat', level:L, ai:'best'}],
      [{species:'thunderhound', level:L, ai:'best'}, {species:'goblin_knight', level:L, ai:'maxer'}, {species:'firehound', level:L, ai:'best'}],
      [{species:'tricerarmor', level:L, ai:'best'}, {species:'sumo', level:L, ai:'best'}, {species:'horned_lynx', level:L, ai:'best'}],
      [{species:'lizardape', level:L, ai:'best', crowned:true, supplements:10}],
    ] };
}
function r5SottoFight(){
  if(!ensurePool()) return;
  walkTeardown();
  beginBattle(Object.assign(r5SottoBattle(), { onWin: ()=> r5SottoBeaten() }));
}
async function r5SottoBeaten(){
  const r = r5();
  const first = !r.sottoBeaten;
  r.sottoBeaten = true;
  if(first) state.inventory.protein = (state.inventory.protein || 0) + 3;
  await saveProfile();
  const w = walkState();
  /* (3.32) on the step beside the open door, facing it */
  w.at = w.at || {}; w.at.hilltop = { x:11, y:4 }; w.face = 'r'; w.faceX = 'r';
  w.ghostAt = w.ghostAt || {}; w.ghostAt.hilltop = { x:11, y:5 };
  ui.walkFresh = false;
  ui.stealthFresh = true;
  ui.currentZone = r5Zone('hilltop') || ui.currentZone;
  storyModal(npcPortrait('sottocapo', '🕴️', 130, 'transparent'), 'Sottocapo defeated',
    `He picks his hat up off the step and turns it round in his hands, breathing hard.<br><br>` +
    `<b>"The Padrino… needs every man he has tonight."</b><br><br>` +
    `He runs inside — not to stop you, but to get down to his master first.<br><br>` +
    (first ? `<b>+3 Protein Supplements</b><br><br>` : '') +
    `<i>The villa's door is open.</i>`,
    ()=> go('hilltop'), { subtitle:'The Hilltop' });
}
function r5VillaIn(){ return goFloor('villa', 'door'); }
/* Inside: the calm (scene 6 of §12b). */
const R5_VILLA_FIRST = [
  `Inside, the villa is quiet. Lamps are lit. A clock is ticking. Nobody is running, and nobody is shouting.`,
];
/* (3.07) …and his first word inside, said again on the first visit each day. */
const R5_VILLA_WORD = `<b>"The dead are everywhere tonight. Every street, every tunnel. But not in this house."</b>`;
function r5VillaRender(world, d){
  if(ui.sceneRunning) return;
  if(!r5().villa) return setTimeout(()=> r5VillaArrive(), 500);
  if(r5DailyDue('first_villa')) r5PlaceWord('villa', 'first_villa', R5_VILLA_WORD);
}
async function r5VillaArrive(){
  const r = r5();
  if(ui.sceneRunning || r.villa) return;
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  const W = whaleName(), whale = ()=> faceMon('whalelord');
  r.said.first_villa = r5Day();                  // (3.07) his word for the villa: said here, for today
  await sceneSay([], 'The villa', R5_VILLA_FIRST[0]);
  await sceneSay([whale()], W, R5_VILLA_WORD);
  ghostAlert();
  await sceneSay([whale()], W, `<b>"Something under this house is keeping them away."</b><br><br><b>"…I think I know who."</b>`);
  await sceneSay([whale()], W,
    `<b>"There is one more wall down there. Not the psychics' — theirs is broken. This one is soft. Gentle. ` +
    `It keeps the dead away from this house, and it comes from right under the villa: the very top of the catacombs."</b>`);
  await sceneSay([whale()], W, `<b>"The Monkey King went down there. I can feel the way he went — straight down. We will follow him."</b>`);
  r.villa = true;
  await saveProfile();
  w.busy = false;
  ui.sceneRunning = false;
  refreshWalk();
  toast('The villa: somebody is sitting by the fire.');
}
/* The Madrina (the Padrino's big sister; the Ghost Master's grandmother),
   by the fire with a photograph. She does not fight: she tells you about
   her little brothers, and goes down to the elder. */
async function r5Madrina(){
  const r = r5();
  if(ui.sceneRunning || walkState().busy) return;
  const M = 'The Madrina', ma = ()=> faceNpc('madrina', '👵');
  const W = whaleName(), whale = ()=> faceMon('whalelord');
  if(r.madrinaMet) return sceneSay([ma()], M, `<b>"Go on. He will need all the help he can get — whether he wants it or not."</b>`);
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  await sceneSay([], '', `An old woman sits by the fire in a tall chair, very straight, a photograph in her lap. She does not look surprised to see you.`);
  await sceneSay([ma()], M, `<b>"So. You are the child who has turned my brother's town upside down."</b>`);
  await sceneSay([ma()], M, `<b>"Sit down. I am too old to fight children, and too tired to shout."</b>`);
  await sceneSay([ma()], M, `<b>"They call me the Madrina. The Padrino is my little brother. And my granddaughter lives at the top of that tower — you have met her, I think."</b>`);
  await sceneSay([ma()], M, `She holds out the photograph.<br><br>${r5PhotoHtml(220)}`);
  await sceneSay([ma()], M, `<b>"My little brothers. That one is the Padrino. He was sixteen."</b>`);
  await sceneSay([ma()], M, `<b>"And that one is Nino. He was six."</b>`);
  if(r.ninoMet) await sceneSay([whale()], W, `<b>"…Nino. That is him — the little boy from the tower."</b>`);
  /* (3.17, part 6 §12c — the designer's words for it) ill, not lost */
  await sceneSay([ma()], M, `<b>"Nino was ill from the day he was born. Every year a little weaker."</b>`);
  await sceneSay([ma()], M, `<b>"Our family has a guardian — a knight of ghost-fire, as old as this house. I have the gift, as my granddaughter has, and it speaks to me. ` +
    `It told me that only a monster's core, a strong one, could make Nino well."</b>`);
  await sceneSay([ma()], M, `<b>"So my brother went looking for anything that could make him well. The strongest monsters there were, and their cores. He was only a boy himself."</b>`);
  await sceneSay([ma()], M, `<b>"He even crossed the sea, to a fairy in a sacred forest, and begged her for her core. She would not give it. She gave him a little stone instead."</b>`);
  if(r5Fairy()) await r5FairySay(`<b>"A fairy… in a sacred forest?"</b>`);
  await sceneSay([ma()], M, `<b>"And it helped. For a while, Nino was stronger. But when Nino was six, he died."</b>`);
  await sceneSay([ma()], M, `<b>"After that my brother could not bear to look at the little stone. He gave it to the mediums. And he never forgave that fairy — nor the world."</b>`);
  if(ownsStone('fairyStone')) await sceneSay([whale()], W, `<b>"A fairy's stone… It is in your bag. The stone we took from the tower."</b>`);
  await sceneSay([ma()], M, `<b>"He built the whole Family. He brought mediums over the sea to find Nino's ghost, and they never did. And so he decided to turn back time instead."</b>`);
  await sceneSay([ma()], M, `<b>"Tonight the dead are loose, all over the town — and still this house is quiet. I have felt it all my life. Something small, keeping the cold away from us."</b>`);
  await sceneSay([whale()], W, `<b>"She knows. She just does not know that she knows."</b>`);
  await sceneSay([ma()], M, `<b>"My brother is down there now, under the cellars, with that machine of his. And your friend with the tail went down after him."</b>`);
  await sceneSay([ma()], M, `She puts the photograph back on the mantel, stands, and takes a lamp.<br><br><b>"Whatever he has done, he is still my little brother. I am going down to him."</b>`);
  r.madrinaMet = true;
  /* she walks out to the hall, up to the cellar door, and is gone */
  const t = DECKS.villa.things.find(x=> x.sprite === 'madrina');
  if(t && t.el) t.el.style.visibility = 'hidden';
  sceneActor('madrina', { x:3, y:9, src:'assets/npc/madrina.png', icon:'👵', z:60 });
  await r5MoveActor('madrina', 7, 9, 900);
  await r5MoveActor('madrina', 9, 9, 600);
  await r5MoveActor('madrina', 9, 1.3, 1600, true);
  sceneActorGone('madrina');
  r.madrinaGone = true;
  await saveProfile();
  await sceneSay([whale()], W, `<b>"Then so are we."</b>`);
  w.busy = false;
  ui.sceneRunning = false;
  refreshWalkAll();
}
/* The photograph: two boys on the villa's steps, the big one holding the
   little one's hand. Nino as he was is NINO_BODY (padrino_brother — "in the
   past stories if art is used there"); the Padrino — (3.17) at sixteen, a
   teenager (part 6 §12c) — is padrino_young. Sepia; the stand-ins are emoji
   until they are drawn. */
function r5PhotoHtml(px){
  r5Css();
  const h = Math.round(px * 0.8), fig = Math.round(px * 0.42), fall = Math.round(fig * 0.7);
  return `<div class="r5-photo" style="width:${px}px;height:${h}px;"><div class="r5-photo-in">` +
    `<span class="r5-photo-step"></span>` +
    `<img class="big" style="width:${Math.round(fig * 1.3)}px;height:${Math.round(fig * 1.3)}px;" src="assets/npc/padrino_young.png" alt="" onerror="walkArtMissing(this,'🧑',${fall},0)">` +
    `<img class="small" style="width:${Math.round(fig * 0.8)}px;height:${Math.round(fig * 0.8)}px;" src="assets/npc/${NINO_BODY}.png" alt="" onerror="walkArtMissing(this,'👦',${Math.round(fall * 0.75)},0)">` +
    `</div></div>`;
}
async function r5Photograph(){
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  await sceneSay([], 'A photograph', `${r5PhotoHtml(220)}<br>Two boys on the steps of this house — a tall one and a little one. The big one is holding the little one's hand.`);
  if(r5().madrinaMet && r5Once('photoWhale'))
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"The big one is holding on so tightly. As if he could keep him here, just by holding on."</b>`);
}
async function r5VillaDesk(){
  await sceneSay([], "The Padrino's desk",
    `Maps of the islands, with red rings drawn round the towns. A glass case of little velvet beds, one for each core — every one of them empty.<br><br>` +
    `And a drawing, pinned over everything else: a monster made of metal, with a clock where its heart should be.`);
  /* (3.17, part 6 §12c) the Padrino's last catch: the Forest Guardian */
  await sceneSay([], "The Padrino's desk", `Under the drawing, a note in a hurried hand:<br><br>` +
    `<i>The fairy of the Sacred Grove — taken, as you ordered. She is in the vault. She has not said a word.</i>`);
  if(r5Once('deskFairy')){
    if(r5Fairy()){
      await r5FairySay(`<b>"The Sacred Grove… That is where I come from."</b>`);
      await r5FairySay(`<b>"The fairy there is the Forest Guardian. She gave you the seed I grew from."</b>`);
    }
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"The fairy who would not give him her core. He has her — down there, somewhere below us."</b>`);
  }
}
function r5VillaKitchen(){
  return sceneSay([], 'The kitchen', `Supper is half-made and the pans are still warm. Whoever was cooking left in a hurry.`);
}
async function r5VillaTable(){
  await sceneSay([], 'The dining room',
    `Supper for six, laid out and never eaten. Each place has a little card. One says <b>FIGLIO</b>, and nobody has sat there for a long time.<br><br>` +
    `Another says <b>NINO</b>. Beside it is a cup of milk, and a little wooden boat.`);
  if(r5Once('tableWhale'))
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"A place for Nino. Every night, I think, for a very long time."</b>`);
}
/* The stair down into the cellars: the top of the catacombs, still to come. */
async function r5CellarStair(){
  const r = r5(), W = whaleName(), whale = ()=> faceMon('whalelord');
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  if(!r.madrinaMet)
    return sceneSay([whale()], W, `<b>"Wait. Somebody is sitting by the fire, in the room by the front door. She has been waiting for us."</b>`);
  /* (3.17) a save that met Nino before 3.17 never saw what he showed the
     Whalelord: he is waiting at the top of the stair, and shows him now */
  const vision = r.ninoMet && !r.said.boneVision;
  /* (3.18) down into the floors under the villa — the first time with a word */
  if(r.cellarSeen && !vision) return goFloor('cata_deep', 'top');
  await sceneSay([], 'The cellar stair', `Stone steps go down under the villa, into the dark — down and down, further than any cellar should.`);
  if(vision) await r5StairVision();
  if(!r.cellarSeen){
    ghostAlert();
    await sceneSay([whale()], W, `<b>"Can you hear it? Far below us. Fighting — the Monkey King. And something else, something that ticks."</b>`);
    if(r.said.malice1){
      await sceneSay([whale()], W, `<b>"And the cold. It is down there too — stronger than I have ever felt it."</b>`);
      await r5FairySay(`<b>"Whatever it is… it is awake."</b>`);
    }
    await sceneSay([whale()], W, `<b>"And there it is again: the soft wall, keeping the dead away. It is down there with them."</b>`);
    r.cellarSeen = true;
    await saveProfile();
  }
  return goFloor('cata_deep', 'top');
}
/* (3.17) Nino at the top of the cellar stair — for a save that met him
   before he could show the Whalelord the Bone Demon (r5BoneVision). */
async function r5StairVision(){
  const was = ui.sceneRunning, w = walkState();
  ui.sceneRunning = true;
  w.busy = true;
  const t = (DECKS.villa.things || []).find(x=> /cellar/i.test(x.where || '') || /Cellar/.test(x.verb || '')) || { x:9, y:1 };
  r5NinoActor(t.x, t.y + 0.6, 900);
  await sceneWait(900);
  await sceneSay([r5NinoFace()], '', `Nino is standing at the top of the stair, waiting for you. He looks at the Whalelord, very hard.`);
  await r5BoneVision();
  await sceneSay([r5NinoFace()], '', `Then he turns, and goes down the stairs into the dark.`);
  await r5MoveActor('nino', t.x, t.y - 0.6, 900, true);
  sceneActorGone('nino');
  w.busy = false;
  ui.sceneRunning = was;
}
/* The Whalelord in the villa. */
const R5_GHOST_VILLA = [
  `Not one ghost in this whole house. Somebody is keeping them out — gently.`,
  `My core is close. Below us. I can feel it beating.`,
  `Everything in here is expensive, and nothing in here is happy.`,
];

/* ============================================================
   UNDER THE VILLA (3.18) — step 3 of the build (part 6 §12b; §12c B)
   Down the villa's cellar stair (r5CellarStair) into the top tier of the
   catacombs: the Deep Cellars, the Watch, the Family Crypt (R5_DECKS,
   `under`). Nino leads (R5_LEAD) and waits by his chalk drawings (R5_CHALK),
   which tell his story; the Monkey King is heard far below; on the Watch the
   Family's three chiefs each hold a lock of the gate down, and each, beaten,
   unlocks his and goes down ahead to his master (r5WatchBeaten); in the
   Crypt, the knight on every tomb, Nino's empty grave, the Forest Guardian's
   leaves — and Jax at the vault's great door (r5JaxDoor). The vault itself
   is 3.19 (r5VaultDoor: coming soon).
   r5(): watch { black, purple, consigliere } (each beaten on the Watch, his
   lock open), jaxBeaten; said: deepArrive / watchArrive / cryptArrive (the
   first time on each), chalk1…chalk7 (looked at), leadPoint, leadWaits,
   leadGate, grave, tomb, jaxMet, vaultSeen.
   ============================================================ */
/* --- Nino leads ---
   On each floor, the stops he waits at, in order: by each of his chalk
   drawings (`chalk`: which one), and last the way on (`on`). He stands at the
   first stop whose drawing you have not looked at yet — or, every one looked
   at, at the way on. Come within two steps of a drawing's stop and he turns to
   the drawing and waits; look at it, and he goes on to the next stop, and
   waits there. Come within two steps of the way on and he goes ahead — down
   the stair; through the Watch's gate, once it is open; and in the Crypt he
   waits at the vault's door. */
const R5_LEAD = {
  cata_deep:  [ { x:9, y:5, chalk:1 }, { x:2, y:14, chalk:2 }, { x:3, y:31, chalk:3 }, { x:13, y:36, on:true } ],
  cata_watch: [ { x:11, y:20, chalk:4 }, { x:14, y:22, chalk:5 }, { x:13, y:34, on:true } ],
  cata_crypt: [ { x:4, y:24, chalk:6 }, { x:23, y:15, chalk:7 }, { x:13, y:33, on:true } ],
};
/* where each drawing is drawn: the wall tile (its Drawing) */
const R5_CHALK_AT = { 1:[8,4], 2:[1,13], 3:[1,30], 4:[9,19], 5:[16,23], 6:[2,25], 7:[25,16] };
function r5NinoLeads(){ const r = r5(); return !!(r.holdBroken && r.ninoMet && !r.vault); }
function r5LeadStop(id){
  const list = R5_LEAD[id];
  if(!list) return null;
  const s = r5().said;
  return list.find(t=> t.chalk && !s['chalk' + t.chalk]) || list[list.length - 1];
}
/* On each render of a floor under the villa: Nino at his stop. */
function r5LeadRender(d){
  if(!d || !R5_LEAD[d.key] || !r5NinoLeads()){ ui.r5LeadAt = null; return; }
  const t = r5LeadStop(d.key);
  ui.r5LeadAt = { deck:d.key, stop:t, waited:false };
  r5NinoActor(t.x, t.y - 0.1, 700);
  if(t.chalk){ const a = R5_CHALK_AT[t.chalk]; if(a) actorFaceToward('nino', a[0] + 0.5); }
}
/* A step: come close and he waits by his drawing — or goes on ahead. */
function r5LeadStep(d, p){
  const L = ui.r5LeadAt;
  if(!L || L.deck !== d.key || ui.sceneRunning || !p || !document.getElementById('sa-nino')) return;
  const t = L.stop;
  if(Math.abs(p.x - t.x) + Math.abs(p.y - t.y) > 2) return;
  const r = r5(), say = html=> sceneSay([faceMon('whalelord')], whaleName(), html);
  const quiet = ()=> ui.screen === d.key && !ui.sceneRunning && !document.querySelector('.scene-say');
  if(t.chalk){
    if(L.waited) return;
    L.waited = true;
    const a = R5_CHALK_AT[t.chalk]; if(a) actorFaceToward('nino', a[0] + 0.5);
    if(!r.said.leadPoint){
      r.said.leadPoint = true; saveProfile();
      setTimeout(()=>{ if(quiet()) say(`<b>"He is looking at something on the wall. He wants us to see it."</b>`); }, 450);
    }
    return;
  }
  if(d.key === 'cata_crypt') return;                         // he waits at the vault's door
  if(d.key === 'cata_watch' && !r5WatchOpen()){
    if(L.waited) return;
    L.waited = true;
    if(!r.said.leadGate){
      r.said.leadGate = true; saveProfile();
      setTimeout(()=>{ if(quiet()) say(`<b>"He is waiting by the gate. He could go through it — he is a ghost. But he will not go on without us."</b>`); }, 450);
    }
    return;
  }
  /* on ahead: down the stair, or through the open gate */
  ui.r5LeadAt = null;
  r5MoveActor('nino', t.x - 0.5, t.y + 1.2, 900, true).then(()=> sceneActorGone('nino'));
}
/* He moves on once you have looked at the drawing he was waiting by. */
async function r5LeadAfterChalk(n){
  const L = ui.r5LeadAt, w = walkState();
  if(!L || L.stop.chalk !== n || !document.getElementById('sa-nino')) return;
  const next = r5LeadStop(L.deck);
  ui.r5LeadAt = { deck:L.deck, stop:next, waited:false };
  const far = Math.abs(next.x - L.stop.x) + Math.abs(next.y - L.stop.y);
  await r5MoveActor('nino', next.x, next.y - 0.1, Math.min(2600, 260 + far * 130));
  if(next.chalk){ const a = R5_CHALK_AT[next.chalk]; if(a) actorFaceToward('nino', a[0] + 0.5); }
  else { const p = w.at && w.at[L.deck]; if(p) actorFaceToward('nino', p.x + 0.5); }
  const r = r5();
  if(!r.said.leadWaits && ui.screen === L.deck && !ui.sceneRunning && !document.querySelector('.scene-say')){
    r.said.leadWaits = true; saveProfile();
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"Have you noticed? He always waits for us."</b>`);
  }
  /* close enough already: as if you had just stepped */
  const p = w.at && w.at[L.deck];
  if(p) r5LeadStep(DECKS[L.deck], p);
}

/* --- His chalk drawings (part 6 §12b scene 7, redrawn for §12c) --- */
const R5_CHALK_INK = { w:'#f3efe4', y:'#f4dc78', g:'#9fdc86', p:'#c69cff', r:'#ff8a8a', b:'#a6d8ff', s:'#a39ea8', o:'#ffb36b' };
function r5ChalkDefs(rough){
  return `<defs><filter id="r5chalk${rough ? 'R' : ''}" x="-6%" y="-6%" width="112%" height="112%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${rough ? 0.55 : 0.8}" numOctaves="2" seed="${rough ? 11 : 3}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="${rough ? 5 : 2.6}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="2.1" numOctaves="1" seed="7" result="g"/>` +
    `<feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.5 1.3" result="gm"/>` +
    `<feComposite in="d" in2="gm" operator="in"/></filter></defs>`;
}
/* a line, a path, a circle, in one chalk */
const _ck = {
  l:(c, x1, y1, x2, y2, w)=> `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${R5_CHALK_INK[c]}" stroke-width="${w || 3.4}"/>`,
  p:(c, d, w, fill)=> `<path d="${d}" stroke="${R5_CHALK_INK[c]}" stroke-width="${w || 3.4}" fill="${fill ? R5_CHALK_INK[fill] : 'none'}"/>`,
  c:(c, x, y, r, w, fill)=> `<circle cx="${x}" cy="${y}" r="${r}" stroke="${R5_CHALK_INK[c]}" stroke-width="${w || 3.4}" fill="${fill ? R5_CHALK_INK[fill] : 'none'}"/>`,
  e:(c, x, y, rx, ry, rot, w, fill)=> `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot || 0} ${x} ${y})" stroke="${R5_CHALK_INK[c]}" stroke-width="${w || 3}" fill="${fill ? R5_CHALK_INK[fill] : 'none'}"/>`,
};
/* A stick figure, feet at (x, y), h tall. o: { c (chalk), armL / armR ([x, y]
   a hand goes to), hat, cap, crown, smile, sad, eyesShut } — returns its
   parts and where its hands and head are, so others can hold them. */
function r5Stick(x, y, h, o){
  o = o || {};
  const c = o.c || 'w', r = h * 0.13, hy = y - h + r, neck = y - h + 2 * r, hip = y - h * 0.4, sh = neck + h * 0.08;
  const aL = o.armL || [x - h * 0.24, sh + h * 0.22], aR = o.armR || [x + h * 0.24, sh + h * 0.22];
  let s = _ck.c(c, x, hy, r) + _ck.l(c, x, neck, x, hip) +
    _ck.l(c, x, hip, x - h * 0.15, y) + _ck.l(c, x, hip, x + h * 0.15, y) +
    _ck.l(c, x, sh, aL[0], aL[1]) + _ck.l(c, x, sh, aR[0], aR[1]);
  const fw = Math.max(1.6, h * 0.022);
  if(o.smile) s += _ck.p(c, `M${x - r * 0.45} ${hy + r * 0.25} Q${x} ${hy + r * 0.7} ${x + r * 0.45} ${hy + r * 0.25}`, fw);
  if(o.sad) s += _ck.p(c, `M${x - r * 0.42} ${hy + r * 0.55} Q${x} ${hy + r * 0.15} ${x + r * 0.42} ${hy + r * 0.55}`, fw);
  if(o.eyes !== false && !o.eyesShut) s += _ck.c(c, x - r * 0.38, hy - r * 0.2, fw * 0.5, fw) + _ck.c(c, x + r * 0.38, hy - r * 0.2, fw * 0.5, fw);
  if(o.eyesShut) s += _ck.p(c, `M${x - r * 0.6} ${hy - r * 0.15} q${r * 0.22} ${r * 0.2} ${r * 0.44} 0 M${x + r * 0.16} ${hy - r * 0.15} q${r * 0.22} ${r * 0.2} ${r * 0.44} 0`, fw);
  if(o.hat) s += _ck.l(o.hatC || c, x - r * 1.7, hy - r * 0.75, x + r * 1.7, hy - r * 0.75) +
               _ck.p(o.hatC || c, `M${x - r} ${hy - r * 0.75} L${x - r * 0.85} ${hy - r * 1.9} L${x + r * 0.85} ${hy - r * 1.9} L${x + r} ${hy - r * 0.75}`);
  if(o.cap) s += _ck.p(o.capC || c, `M${x - r * 1.05} ${hy - r * 0.35} Q${x} ${hy - r * 1.6} ${x + r * 1.05} ${hy - r * 0.35} L${x + r * 1.9} ${hy - r * 0.3}`);
  if(o.crown) s += _ck.p('y', `M${x - r * 0.8} ${hy - r * 0.9} l${r * 0.2} ${-r * 0.9} l${r * 0.35} ${r * 0.55} l${r * 0.25} ${-r * 0.75} l${r * 0.25} ${r * 0.75} l${r * 0.35} ${-r * 0.55} l${r * 0.2} ${r * 0.9}`, 2.4);
  return { s, hy, r, sh, aL, aR };
}
/* a little round monster, sitting: ears, eyes, a mouth */
function r5Critter(x, y, s, o){
  o = o || {};
  const c = o.c || 'w';
  let out = _ck.c(c, x, y, s) + _ck.p(c, `M${x - s * 0.7} ${y - s * 0.7} l${-s * 0.25} ${-s * 0.55} l${s * 0.55} ${s * 0.2}`) +
    _ck.p(c, `M${x + s * 0.7} ${y - s * 0.7} l${s * 0.25} ${-s * 0.55} l${-s * 0.55} ${s * 0.2}`) +
    _ck.c(c, x - s * 0.35, y - s * 0.15, 1.2, 2.2) + _ck.c(c, x + s * 0.35, y - s * 0.15, 1.2, 2.2);
  out += o.sad
    ? _ck.p(c, `M${x - s * 0.35} ${y + s * 0.45} Q${x} ${y + s * 0.15} ${x + s * 0.35} ${y + s * 0.45}`, 2.2) +
      _ck.p('b', `M${x - s * 0.38} ${y} q-2 ${s * 0.35} 0 ${s * 0.5}`, 2.2)
    : _ck.p(c, `M${x - s * 0.38} ${y + s * 0.2} Q${x} ${y + s * 0.6} ${x + s * 0.38} ${y + s * 0.2}`, 2.2);
  return out;
}
function r5Bed(x, y, o){
  o = o || {};
  /* a bed, its top-left at (x, y), 110 × 34; the little one in it, head on the pillow */
  let s = _ck.p('w', `M${x} ${y + 34} L${x} ${y - 6} M${x + 110} ${y + 34} L${x + 110} ${y + 6} M${x} ${y + 18} L${x + 110} ${y + 18}`) +
          _ck.e('w', x + 18, y + 6, 13, 6, 0, 2.6) +
          _ck.c('w', x + 18, y - 4, 9) +
          _ck.p('w', `M${x + 30} ${y + 4} L${x + 108} ${y + 4} L${x + 108} ${y + 18}`) +
          _ck.p('b', `M${x + 34} ${y + 10} l12 0 M${x + 54} ${y + 10} l12 0 M${x + 74} ${y + 10} l12 0 M${x + 94} ${y + 10} l10 0`, 2.2);
  s += o.eyesShut
    ? _ck.p('w', `M${x + 13} ${y - 6} q2.5 2 5 0 M${x + 19} ${y - 6} q2.5 2 5 0`, 1.8)
    : _ck.c('w', x + 15, y - 6, 0.8, 1.8) + _ck.c('w', x + 21, y - 6, 0.8, 1.8);
  if(o.sad) s += _ck.p('w', `M${x + 14} ${y + 1} Q${x + 18} ${y - 2} ${x + 22} ${y + 1}`, 1.8);
  return s;
}
const R5_CHALK = {
  /* 1 — two brothers, holding hands (old chalk) */
  1: ()=>{
    const big = r5Stick(118, 172, 112, { armR:[150, 118], smile:true });
    const small = r5Stick(176, 172, 70, { armL:[150, 118], smile:true, cap:true, capC:'b' });
    return { old:true, svg:_ck.p('w', 'M18 174 Q150 168 284 175', 2.6) + big.s + small.s +
      _ck.c('y', 252, 40, 15) + [0, 1, 2, 3, 4, 5, 6, 7].map(k=>{ const a = k * Math.PI / 4;
        return _ck.l('y', 252 + Math.cos(a) * 21, 40 + Math.sin(a) * 21, 252 + Math.cos(a) * 30, 40 + Math.sin(a) * 30, 2.6); }).join('') };
  },
  /* 2 — the little one sick in bed, a black cloud over him; the big one going, a bag on his back */
  2: ()=>{
    const big = r5Stick(196, 172, 104, { armL:[176, 128], armR:[214, 130], sad:true });
    const cloud = 'M42 74 q-4 -20 16 -22 q6 -18 28 -12 q14 -16 32 -2 q22 -4 20 18 q10 14 -8 22 l-80 0 q-16 -2 -8 -4z';
    return { old:true, svg:r5Bed(36, 128, { sad:true }) +
      _ck.p('s', cloud, 3.4) + _ck.p('s', 'M50 70 l70 -6 M48 78 l78 -2 M56 62 l58 -8 M66 54 l40 -4', 2.4) +
      _ck.p('s', 'M70 88 l-4 14 M92 90 l-4 12 M112 88 l-4 14', 2.2) +
      _ck.p('w', 'M226 172 L226 58 L272 58 L272 172', 3) + _ck.c('w', 232 + 32, 118, 2.4, 2.4) +
      big.s + _ck.c('o', 174, 112, 13) + _ck.l('o', 181, 101, 196, 92, 2.6) };
  },
  /* 3 — the grove: the big one holds out his hands; the fairy puts a little stone in them */
  3: ()=>{
    const big = r5Stick(110, 172, 108, { armL:[140, 116], armR:[150, 112] });
    const fairy = r5Stick(196, 172, 96, { c:'g', armL:[160, 108], crown:true, smile:true });
    const wings = _ck.e('g', 178, fairy.sh + 4, 18, 8, -35, 2.6) + _ck.e('g', 214, fairy.sh + 4, 18, 8, 35, 2.6);
    const tree = (x)=> _ck.l('o', x, 174, x, 116, 4) + _ck.c('g', x, 96, 26) + _ck.c('g', x - 14, 108, 14, 2.6) + _ck.c('g', x + 14, 106, 14, 2.6);
    const stone = _ck.c('b', 156, 106, 5, 2.6, 'b') + [[-11, 0, -7, 0], [11, 0, 7, 0], [0, -11, 0, -7], [0, 11, 0, 7]]
      .map(([a, b, c2, d2])=> _ck.l('b', 156 + a, 106 + b, 156 + c2, 106 + d2, 2)).join('');
    return { old:true, svg:tree(34) + tree(272) + _ck.p('g', 'M20 174 Q150 168 286 174', 2.4) + wings + fairy.s + big.s + stone };
  },
  /* 4 — the little one in bed again; his candle has gone out, a line of smoke going up */
  4: ()=>{
    return { old:true, svg:r5Bed(36, 128, { eyesShut:true }) +
      _ck.p('w', 'M168 172 L168 138 L208 138 L208 172 M164 138 L212 138', 3) +
      _ck.p('w', 'M181 138 L181 104 L195 104 L195 138', 3) + _ck.l('w', 188, 104, 188, 98, 2) +
      _ck.p('s', 'M188 96 q-8 -10 0 -18 q8 -8 0 -18 q-8 -8 0 -16', 2.4) +
      _ck.p('w', 'M232 30 L288 30 L288 90 L232 90 Z M260 30 L260 90 M232 60 L288 60', 2.6) +
      _ck.p('y', 'M246 40 l0 8 M242 44 l8 0 M274 70 l0 8 M270 74 l8 0 M248 76 l0 6 M245 79 l6 0', 2) };
  },
  /* 5 — (newer chalk) monsters in cages, crying; men with lanterns carrying a box away — something glows in it */
  5: ()=>{
    const cage = (x, y, w, h)=> _ck.p('w', `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`, 3) +
      Array.from({ length:Math.floor(w / 12) }, (_, k)=> _ck.l('w', x + 12 * (k + 1), y, x + 12 * (k + 1), y + h, 2.2)).join('');
    const man1 = r5Stick(214, 172, 96, { hat:true, armL:[194, 120], armR:[240, 126] });
    const man2 = r5Stick(266, 172, 96, { hat:true, armL:[240, 126], armR:[288, 132] });
    const lantern = (x, y)=> _ck.l('w', x, y, x, y + 8, 2) + _ck.p('y', `M${x - 6} ${y + 8} L${x + 6} ${y + 8} L${x + 6} ${y + 22} L${x - 6} ${y + 22} Z`, 2.4) +
      _ck.c('y', x, y + 15, 9, 1.4);
    const box = _ck.p('o', 'M226 112 L256 112 L256 134 L226 134 Z', 3) + _ck.c('y', 241, 123, 4, 2, 'y') + _ck.c('y', 241, 123, 9, 1.2);
    return { svg:cage(16, 96, 62, 56) + r5Critter(47, 132, 13, { sad:true }) +
      cage(92, 108, 50, 44) + r5Critter(117, 136, 11, { sad:true }) +
      cage(150, 120, 38, 32) + r5Critter(169, 140, 8, { sad:true }) +
      _ck.l('w', 10, 154, 196, 154, 2.2) + man1.s + man2.s + box + lantern(194, 120) + lantern(288, 132) };
  },
  /* 6 — (in a hurry, pressing hard) the knight with the purple sword in front of the
     Family — and over them all, the bone monster with a hundred legs, red eyes */
  6: ()=>{
    const fam = [150, 178, 206, 234, 262].map((x, i)=> r5Stick(x, 174, 44 + (i % 2) * 6, { eyes:false }).s).join('');
    const knight = r5Stick(96, 174, 102, { armR:[124, 92], armL:[74, 128] });
    const helm = _ck.l('w', knight.r * -1 + 96, knight.hy, 96 + knight.r, knight.hy, 2.6) + _ck.p('w', `M${96 - knight.r} ${knight.hy - 2} Q96 ${knight.hy - knight.r * 2.4} ${96 + knight.r} ${knight.hy - 2}`, 3);
    const sword = _ck.l('p', 124, 92, 146, 30, 4.4) + _ck.l('p', 116, 88, 132, 98, 3.4) +
      _ck.p('p', 'M140 40 q6 -10 2 -18 M148 44 q8 -8 6 -20 M134 50 q-4 -8 0 -16', 2.4);
    /* the monster: a long arched spine over everything, ribs, a skull of a
       head on the left, a hundred legs */
    const spine = 'M58 70 Q120 18 200 34 Q250 44 290 70';
    const ribs = Array.from({ length:13 }, (_, k)=>{ const t = (k + 1) / 14, x = 58 + t * 232, y = 70 - Math.sin(t * Math.PI) * 42 - (t < 0.5 ? 0 : 6);
      return _ck.l('s', x, y, x - 4, y + 14, 2.6); }).join('');
    const legs = Array.from({ length:20 }, (_, k)=>{ const t = (k + 0.5) / 20, x = 66 + t * 222, y = 74 - Math.sin(t * Math.PI) * 38;
      return _ck.p('s', `M${x} ${y + 6} l${k % 2 ? 6 : -6} 14 l${k % 2 ? 4 : -4} 10`, 2.2); }).join('');
    const skull = _ck.p('s', 'M60 54 q-26 -6 -36 12 q-6 16 10 22 l0 10 l10 -4 l6 6 l6 -6 l10 4 l-2 -12 q10 -12 -4 -28 z', 3.4) +
      _ck.c('r', 38, 70, 3.6, 2.6, 'r') + _ck.c('r', 54, 68, 3.6, 2.6, 'r') + _ck.p('s', 'M30 92 l4 6 M40 94 l2 7 M50 93 l-1 7', 2.2);
    return { rough:true, svg:_ck.p('s', spine, 4) + _ck.p('s', 'M60 76 Q120 30 198 44 Q248 52 288 76', 2.4) + ribs + legs + skull +
      fam + knight.s + helm + sword };
  },
  /* 7 — (fresh chalk, bright) a big man in a hat holding the little boy's hand; the monsters out of their cages, smiling */
  7: ()=>{
    const big = r5Stick(124, 172, 116, { hat:true, armR:[152, 122], smile:true });
    const boy = r5Stick(176, 172, 70, { armL:[152, 122], cap:true, capC:'b', smile:true });
    const heart = (x, y, s)=> _ck.p('r', `M${x} ${y + s} C${x - s * 1.6} ${y - s * 0.2} ${x - s * 0.6} ${y - s * 1.4} ${x} ${y - s * 0.4} C${x + s * 0.6} ${y - s * 1.4} ${x + s * 1.6} ${y - s * 0.2} ${x} ${y + s}`, 2.4);
    const open = _ck.p('w', 'M14 110 L54 110 L54 152 L14 152 Z', 2.6) + _ck.p('w', 'M54 110 L76 98 L76 140 L54 152', 2.4) +
      _ck.l('w', 26, 110, 26, 152, 2) + _ck.l('w', 40, 110, 40, 152, 2);
    return { fresh:true, svg:_ck.p('w', 'M10 174 Q150 168 290 175', 2.6) + open +
      r5Critter(86, 156, 12) + r5Critter(62, 172 - 4, 9) + r5Critter(226, 156, 12) + r5Critter(262, 160, 14) + r5Critter(244, 118, 9) +
      big.s + boy.s + heart(92, 112, 8) + heart(210, 104, 7) + heart(150, 70, 9) +
      _ck.c('y', 262, 36, 14) + [0, 1, 2, 3, 4, 5, 6, 7].map(k=>{ const a = k * Math.PI / 4;
        return _ck.l('y', 262 + Math.cos(a) * 20, 36 + Math.sin(a) * 20, 262 + Math.cos(a) * 28, 36 + Math.sin(a) * 28, 2.4); }).join('') };
  },
};
function r5ChalkSvg(n){
  const d = R5_CHALK[n] && R5_CHALK[n]();
  if(!d) return '';
  const op = d.fresh ? 1 : d.old ? 0.74 : 0.9;
  return `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">` +
    r5ChalkDefs(d.rough) + `<g filter="url(#r5chalk${d.rough ? 'R' : ''})" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op}">` +
    d.svg + (d.rough ? `<g transform="translate(1.6 1.2)" opacity="0.45">${d.svg}</g>` : '') + `</g></svg>`;
}

/* What is said over each (`''` the drawing itself; 'w' the Whalelord; 'f' your
   Forest Fairy — or, if you have none, the Whalelord says the third part;
   'n' Nino, while he is with you). */
const R5_CHALK_SAY = {
  1: [['', `Chalk on the wall — a child's drawing. Two stick people holding hands: a big one, and a little one.`],
      ['w', `Two brothers.`]],
  2: [['', `A little one in a bed, with a black cloud over him. At the door, the big one, a bag on his back.`],
      ['w', `The little one is sick.`],
      ['w', `And the big one is going away — to find something that will make him well.`]],
  3: [['', `Trees, and a fairy with leaf wings and a little crown. The big one is holding out his hands, and she is putting something small and shining into them.`],
      ['f', `That's my grove! And that's the Forest Guardian.`, `That is a grove, and its fairy — the Forest Guardian of the Sacred Grove.`],
      ['w', `She is giving him the little stone. The Fairy Stone.`]],
  4: [['', `The little one in his bed again. The candle beside him has gone out; a thin line of smoke goes up from it.`],
      ['w', `And then… the little one's candle went out.`],
      ['n', `Nino nods.`]],
  5: [['', `Newer chalk: monsters in cages, crying. Men with lanterns, carrying a box away — and in the box, something glows.`],
      ['w', `He has watched the Family from down here for a long, long time. He saw everything they did to monsters.`],
      ['w', `The cores they stole. He saw them carried in, one by one. Mine too.`]],
  6: [['', `This one is drawn in a hurry, pressing hard. A knight with a purple sword, in front of a row of little people. And over them all, like a shadow — a monster of bones, with a hundred legs and red eyes.`],
      ['w', `The bone monster. The one he showed me.`],
      ['f', `It's standing over all of them. Even the knight.`, null],
      ['w', `He is trying to tell us something. About that knight… and that monster.`]],
  7: [['', `Fresh chalk, bright and new. A big man in a hat, holding the little boy's hand. All round them, the monsters are out of their cages — smiling.`],
      ['w', `This one is new. He drew it himself.`],
      ['w', `His big brother back. And the monsters free.`],
      ['n', `Nino smiles.`]],
};
function r5ChalkShow(n){
  r5Css();
  let o = document.getElementById('r5Chalk');
  if(!o){ o = document.createElement('div'); o.id = 'r5Chalk'; document.body.appendChild(o); }
  o.dataset.n = String(n);
  o.innerHTML = `<div class="rc-wall"><div class="rc-pic">${r5ChalkSvg(n)}</div></div>`;
  o.style.transition = 'none'; o.style.opacity = '0';
  void o.offsetWidth;
  o.style.transition = `opacity ${600 * SCENE_SPEED}ms ease`;
  o.style.opacity = '1';
}
async function r5ChalkHide(){
  const o = document.getElementById('r5Chalk');
  if(!o) return;
  o.style.transition = `opacity ${500 * SCENE_SPEED}ms ease`;
  o.style.opacity = '0';
  await sceneWait(500);
  o.remove();
}
async function r5Chalk(n){
  const w = walkState();
  if(ui.sceneRunning || w.busy || document.querySelector('.scene-say')) return;
  ui.sceneRunning = true;
  w.busy = true;
  releaseKeys();
  const a = R5_CHALK_AT[n]; if(a) walkFaceToward(a[0] + 0.5);
  r5ChalkShow(n);
  const W = whaleName(), wl = ()=> faceMon('whalelord'), fairy = !!r5Fairy(), nino = r5NinoLeads() && !!document.getElementById('sa-nino');
  for(const [who, line, alt] of R5_CHALK_SAY[n] || []){
    if(who === '') await sceneSay([], 'A chalk drawing', line);
    else if(who === 'w') await sceneSay([wl()], W, `<b>"${line}"</b>`);
    else if(who === 'f'){
      if(fairy) await r5FairySay(`<b>"${line}"</b>`);
      else if(alt) await sceneSay([wl()], W, `<b>"${alt}"</b>`);
    } else if(who === 'n' && nino) await sceneSay([r5NinoFace()], '', line);
  }
  await r5ChalkHide();
  const r = r5(), first = !r.said['chalk' + n];
  r.said['chalk' + n] = true;
  await saveProfile();
  w.busy = false;
  ui.sceneRunning = false;
  if(first) r5LeadAfterChalk(n);
}

/* --- Arriving on each floor, the first time --- */
function r5UnderArriveDue(d){
  const s = r5().said;
  return ({ cata_deep:'deepArrive', cata_watch:'watchArrive', cata_crypt:'cryptArrive' })[d.key] && !s[({ cata_deep:'deepArrive', cata_watch:'watchArrive', cata_crypt:'cryptArrive' })[d.key]];
}
async function r5UnderArrive(d){
  const r = r5(), w = walkState();
  if(ui.sceneRunning || w.deck !== d.key) return;
  ui.sceneRunning = true;
  w.busy = true;
  releaseKeys();
  const W = whaleName(), wl = ()=> faceMon('whalelord');
  const key = { cata_deep:'deepArrive', cata_watch:'watchArrive', cata_crypt:'cryptArrive' }[d.key];
  r.said[key] = true;
  r.said['first_' + d.key] = r5Day();                 // his word for the floor: said here, for today
  saveProfile();
  const lead = r5NinoLeads();
  if(d.key === 'cata_deep'){
    /* Nino at the foot of the stairs; the dead, deeper in the dark, hanging back */
    const held = [[10.7, 6.0], [14.1, 6.1], [9.4, 5.5], [15.4, 5.6]].map(([x, y], i)=>{
      const sp = ['ghost', 'crow', 'ghost_flame', 'cyclops'][i];
      const el = r5MonActor('held' + i, sp, x, y, 0.9, { html:monPortrait(sp, Math.round(WALK_T * 0.9), { view:'front', bare:true }) });
      if(el){ el.classList.add('r5-held'); el.style.opacity = '0'; void el.offsetWidth; el.style.transition = `opacity ${800 * SCENE_SPEED}ms ease`; el.style.opacity = '0.55'; }
      return 'held' + i;
    });
    if(lead) r5NinoActor(12.5, 5.0, 900);
    await sceneWait(900);
    await sceneSay([], 'The Deep Cellars', lead
      ? `At the bottom of the stairs a little boy is waiting, see-through like mist. Behind him, deeper in the dark, pale shapes hang back — the dead of the hill. Not one of them comes past him.`
      : `At the bottom of the stairs, deeper in the dark, pale shapes hang back — the dead of the hill. Not one of them comes any closer.`);
    if(lead) await sceneSay([wl()], W, `<b>"There he is. Keeping the dead away from his brother's house. All by himself."</b>`);
    for(const id of held) r5MoveActor(id, document.getElementById('sa-' + id)._o.x, document.getElementById('sa-' + id)._o.y + 1.5, 1400, true);
    await sceneWait(1000);
    held.forEach(id=> sceneActorGone(id));
    await sceneSay([wl()], W, `<b>"So there are no ghosts on any of the Padrino's men down here. They will see us — and these are his own men. They know your face. No uniform will fool them."</b>`);
    await sceneSay([wl()], W, `<b>"Keep to the dark."</b>`);
    if(r.said.malice1) await r5FairySay(`<b>"And the cold is close now. Very close."</b>`);
    if(lead){
      const t = r5LeadStop(d.key);
      await sceneSay([r5NinoFace()], '', `He turns, and walks ahead into the dark. Then he stops, and looks back at you — waiting.`);
      await r5MoveActor('nino', t.x, t.y - 0.1, 1200);
      if(t.chalk){ const a = R5_CHALK_AT[t.chalk]; if(a) actorFaceToward('nino', a[0] + 0.5); }
      ui.r5LeadAt = { deck:d.key, stop:t, waited:false };
    }
  } else if(d.key === 'cata_watch'){
    if(lead) r5LeadRender(d);
    sceneShake(1300, t=> 0.12 * Math.max(0, 1 - t / 1300));
    await sceneWait(700);
    await sceneSay([], 'The Watch', `Far below, something crashes — again, and again. Dust trickles down from the ceiling.`);
    await sceneSay([wl()], W, `<b>"The Monkey King! He is fighting his way down — the loud way, through every one of the Padrino's men."</b>`);
    if(r5Fairy()){
      await r5FairySay(`<b>"He didn't wait for us."</b>`);
      await sceneSay([wl()], W, `<b>"He never does."</b>`);
    }
    await sceneSay([wl()], W, `<b>"And the Family's chiefs are here — the capos, and the Consigliere. They are keeping watch over the way down."</b>`);
  } else if(d.key === 'cata_crypt'){
    if(lead) r5LeadRender(d);
    await r5Dread(2600);
    ghostAlert();
    await sceneSay([], 'The Family Crypt', `The cold comes up through the floor here — so strong that your breath turns to mist.`);
    await sceneSay([wl()], W, `<b>"The cold. It is right below us now."</b>`);
    if(r5Fairy()) await r5FairySay(`<b>"And something else… my grove. I can smell my grove!"</b>`);
    await sceneSay([], '', `A trail of green leaves runs across the stones — all the way down to a great iron door at the far end.`);
    await sceneSay([wl()], W, `<b>"The fairy from the note on the Padrino's desk. The Forest Guardian. They brought her this way."</b>`);
    await sceneSay([wl()], W, `<b>"And this is the Family's crypt. Every one of them is buried here."</b>`);
  }
  w.busy = false;
  ui.sceneRunning = false;
}

/* --- The Watch's gate: three locks --- */
const R5_WATCH = ['black', 'purple', 'consigliere'];
function r5WatchLocks(){ const w = r5().watch || {}; return R5_WATCH.filter(k=> w[k]).length; }
function r5WatchOpen(){ return r5WatchLocks() === 3; }
async function r5WatchGate(){
  const n = r5WatchLocks(), W = whaleName(), wl = faceMon('whalelord');
  await sceneSay([], 'The gate', `An iron gate across the stairs down, with three great locks on it` +
    (n ? ` — ${n === 1 ? 'one of them' : 'two of them'} open.` : '.') + ` Through the bars, steps go down into the dark.`);
  const left = R5_WATCH.filter(k=> !(r5().watch || {})[k]).map(k=> ({ black:'the Black Capo', purple:'the Purple Capo', consigliere:'the Consigliere' })[k]);
  return sceneSay([wl], W, n
    ? `<b>"${left.length === 1 ? 'One more lock. ' + left[0].replace(/^t/, 'T') + ' has the key.' : 'Two more. ' + left[0].replace(/^t/, 'T') + ' and ' + left[1] + ' have the keys.'}"</b>`
    : `<b>"Three locks. The capos and the Consigliere will each have a key."</b>`);
}
const R5_WATCH_BEATEN = {
  black:{ sprite:'capo_black', name:'Black Capo',
    said:`He straightens his coat, as he always does.<br><br><b>"The Padrino will hear of this — from me, before you get there."</b>` },
  purple:{ sprite:'capo_purple', name:'Purple Capo',
    said:`He laughs, short and sharp — but not for long.<br><br><b>"Fine. FINE. Go on down, then. The boss will finish you himself."</b>` },
  consigliere:{ sprite:'consigliere', name:'Consigliere',
    said:`<b>"Nobody saw that."</b> He sighs. <b>"No — everybody will. They are all down there tonight."</b>` },
};
async function r5WatchBeaten(which){
  const r = r5();
  r.watch = r.watch || {};
  const first = !r.watch[which];
  r.watch[which] = true;
  if(first) state.inventory.protein = (state.inventory.protein || 0) + 2;
  await saveProfile();
  const b = R5_WATCH_BEATEN[which], n = r5WatchLocks();
  storyModal(npcPortrait(b.sprite, '🕴️', 130, 'transparent'), b.name + ' defeated',
    b.said + `<br><br>He goes to the gate, turns his key in one of its three locks, and slips through — down to his master.` +
    (first ? `<br><br><b>+2 Protein Supplements</b>` : '') +
    `<br><br><i>${n === 3 ? 'All three locks are open: the way down is clear.' : (n === 1 ? 'One' : 'Two') + ' of the gate\'s three locks open.'}</i>`,
    ()=> go('cata_watch'), { subtitle:'The Watch' });
}

/* --- The Family Crypt: the tombs, Nino's grave --- */
async function r5Tomb(){
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  await sceneSay([], 'A tomb', `On the lid of every tomb down here, the same carving: a knight in armour, holding a sword of fire.`);
  if(r5Once('tomb')){
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"The Family's Guardian — the Ghost Master's knight. It has stood over every one of them, for hundreds of years."</b>`);
    await r5FairySay(`<b>"It's everywhere down here. I don't like it."</b>`);
  }
}
async function r5Grave(){
  const w = walkState();
  if(ui.sceneRunning || w.busy || document.querySelector('.scene-say')) return;
  const W = whaleName(), wl = ()=> faceMon('whalelord');
  await sceneSay([], 'A small grave', `A small grave, with a little wooden boat on it. Its stone has been pushed aside. Carved on it:<br><br>` +
    `<b>NINO — OUR LITTLE ONE — WE WILL ALWAYS WAIT FOR YOU</b>`);
  if(!r5Once('grave')) return;
  ui.sceneRunning = true; w.busy = true;
  await sceneSay([wl()], W, `<b>"This is his grave."</b>`);
  await sceneSay([wl()], W, `<b>"…It is empty."</b>`);
  await sceneSay([wl()], W, `<b>"Someone has taken his bones away. But not Nino. Nino is here, with us."</b>`);
  if(r5NinoLeads() && document.getElementById('sa-nino'))
    await sceneSay([r5NinoFace()], '', `Nino looks at the great iron door at the far end of the crypt, then back at you. He waits.`);
  w.busy = false; ui.sceneRunning = false;
}

/* --- Jax, at the vault's great door --- */
const R5_JAX_LV = 100;
function r5JaxNote(){
  return `<i>Jax: <b>6 monsters, one at a time, level ${R5_JAX_LV}</b> — his Dragon, Tricerarmor, Thundercat, Firehound and Loong, ` +
    `and last his <b>crowned Eagle</b> (10 supplements). <b>He always moves first.</b> No stones — he lost his on the ship. ` +
    `No running. Win for <b>+3 Protein Supplements</b>.</i>`;
}
function r5JaxBattle(){
  const L = R5_JAX_LV;
  return { isNpc:true, name:'Jax', npcId:'rival_padrino', noFlee:true, figlio:true, bgKey:'battle_catacombs', catacomb:true,
    waves:[
      [{ species:'dragon', level:L, ai:'best' }],
      [{ species:'tricerarmor', level:L, ai:'best' }],
      [{ species:'thundercat', level:L, ai:'maxer' }],
      [{ species:'firehound', level:L, ai:'best' }],
      [{ species:'loong', level:L, ai:'best' }],
      [{ species:'eagle', level:L, ai:'best', crowned:true, supplements:10 }],
    ] };
}
async function r5JaxDoor(){
  const r = r5(), w = walkState();
  if(r.jaxBeaten || ui.sceneRunning || w.busy) return;
  const J = 'Jax', jax = ()=> faceNpc('rival_padrino', '🧑'), W = whaleName(), wl = ()=> faceMon('whalelord');
  walkFaceToward(12.5);
  if(!r.said.jaxMet){
    ui.sceneRunning = true; w.busy = true; releaseKeys();
    r.said.jaxMet = true; saveProfile();
    await sceneSay([jax()], J, `He is leaning against the great iron door with his arms folded, like he has been there for hours.<br><br><b>"Took you long enough."</b>`);
    await sceneSay([jax()], J, `<b>"The boss said nobody goes through this door tonight. Not the monkey. Not the old lady. Not the capos. Not even me."</b>`);
    await sceneSay([wl()], W, `<b>"Jax. You brought my core here."</b>`);
    await sceneSay([jax()], J, `<b>"And I'd do it again. The boss is family. You wouldn't understand."</b>`);
    await sceneSay([jax()], J, `He glances at the door, and lowers his voice.<br><br><b>"…But something's wrong in there. Every night this week I've heard a sword humming, behind this door. ` +
      `And the boss talks in his sleep — to somebody who isn't there."</b>`);
    if(r5Fairy()){
      await r5FairySay(`<b>"The cold is coming from in there."</b>`);
      await sceneSay([jax()], J, `<b>"Yeah. You feel it too, huh."</b>`);
    }
    await sceneSay([jax()], J, `He straightens up.<br><br><b>"Doesn't matter. Nobody gets past me. You want in? Beat me. Properly, this time."</b>`);
    w.busy = false; ui.sceneRunning = false;
  }
  const yes = await r5Ask([jax()], J, `<b>"Well? I haven't got all night."</b><br><br>${r5JaxNote()}`, '⚔️ Fight', 'Not yet');
  if(!yes || !ensurePool()) return;
  walkTeardown();
  beginBattle(Object.assign(r5JaxBattle(), { onWin: ()=> r5JaxBeaten() }));
}
async function r5JaxBeaten(){
  const r = r5();
  const first = !r.jaxBeaten;
  r.jaxBeaten = true;
  if(first) state.inventory.protein = (state.inventory.protein || 0) + 3;
  await saveProfile();
  const w = walkState();
  w.at = w.at || {}; w.at.cata_crypt = { x:12, y:33 }; w.face = 'd';
  w.ghostAt = w.ghostAt || {}; w.ghostAt.cata_crypt = { x:13, y:32 };
  ui.walkFresh = false;
  ui.currentZone = r5Zone('catacombs') || ui.currentZone;
  storyModal(npcPortrait('rival_padrino', '🧑', 130, 'transparent'), 'Jax defeated',
    `He picks himself up off the floor, slowly.<br><br><b>"…Fine."</b><br><br>` +
    `<b>"Go on, then. But I'm coming too. If something's wrong in there, the boss is going to need everyone."</b><br><br>` +
    `He pushes the great door open just wide enough to slip through, and goes in ahead of you.` +
    (first ? `<br><br><b>+3 Protein Supplements</b>` : '') + `<br><br><i>The vault's door is open.</i>`,
    ()=> go('cata_crypt'), { subtitle:'The Family Crypt' });
}
/* ============================================================
   THE VAULT (3.19) — step 4 of the build (part 6 §12c C; §12's fight)
   Through the great iron door at the bottom of the Family Crypt: the
   Padrino's vault, one round room (cata_vault) — machines humming along the
   walls, a great clock carved into the floor with its hands running
   backwards, Cyborg asleep in its iron cradle, a stone table with a little
   wooden box on it (Nino's bones, from the empty grave), and the Forest
   Guardian in a cage of iron and roots. The Padrino, the Madrina, Jax, and
   his four chiefs at the back.
   THE FIRST TIME (r5VaultScene): Nino slips in ahead of you; the Padrino
   rages at the Forest Guardian's calm; Cyborg wakes and makes Nino's body
   again from the bones (the room shakes); the Monkey King crashes in and
   knocks the Padrino's five down — Cyborg turns back time — again — until
   Cyborg strikes him down ("You are cheating"), and the cold reminds him of
   something long ago; the Padrino sees you; the Whalelord's speech (the
   Forest Guardian gave her seed to a child), the Monkey King's answer, your
   team round you in a circle (the Whalelord at the top), your stones float
   to him — and the fight.
   THE FIGHT (r5ClimaxBattle — §12 steps 1–5, decision 3): his five, crowned
   at 100 with 10 protein, one at a time, then Cyborg at 200 — three times,
   Cyborg turning back time between (r5ClimaxCleared). The Monkey King at
   your side (04-battle.js, "AN ALLY AT YOUR SIDE"). Cyborg's first arrival:
   its past, its present and its future, for a moment (r5CyborgSplit). After
   the third: his taunt, the Padrino's rewind turned on you, the Monkey King
   steps into it and for a moment wears his crown — Heavensplitter Max, the
   cores burst out, he catches them (r5ClimaxBreak) — and the last phase:
   Cyborg broken (`broken`: no turn, no passive; `shattered`: tilted, and
   short-circuiting — r5Sparks), held at 1 HP; clear its whole bar. Every
   cooldown is reset for it; the Monkey King keeps your stones in the air and
   leaves the blows to you. No victory screen: white, and the vault again
   (r5ClimaxWon) — (3.19) the story goes on in the next update.
   LOST: Cyborg turns back time for everyone in the room — you are at the
   door again, whole, nothing lost, not even XP (r5ClimaxLost); speak to the
   Padrino, or come back in, to try again.
   r5(): vault { scene, tries, won, split }, mkLines (the Monkey King's stone
   lines — once each, ever — and which stones he has cast before: "🔁").
   ============================================================ */
const R5_VAULT_TEAM = ['ground_starter', 'psychic_starter', 'ghost_starter', 'physical_starter', 'flying_starter'];
const R5_VAULT_LV = 100, R5_VAULT_CYBORG = 200;
const R5_CLIMAX_XP = 38;            // 19 waves, at an NPC fight's 2 a wave
/* Where everyone stands (tiles: an actor's top-left). The room is 11 × 11,
   all of it in view. */
const R5_VP = {
  you:{ x:5, y:2 }, ring:{ x:5, y:3 },
  padrino:{ x:5, y:5.55 }, padrinoBack:{ x:5, y:6.4 },
  madrina:{ x:3.25, y:6.6 }, jax:{ x:6.75, y:6.6 },
  chiefs:[ ['sottocapo', 2.1, 8.2], ['capo_purple', 3.05, 8.45], ['capo_black', 6.95, 8.45], ['consigliere', 7.9, 8.2] ],
  cyborg:{ x:4.6, y:7.75, s:1.8 },
  guardian:{ x:7.2, y:4.0, s:1.65 }, cage:{ x:6.85, y:3.45, w:2.3, h:2.65 },
  box:{ x:2.6, y:3.85 }, body:{ x:2.45, y:3.6 },
  nino:{ x:3.2, y:1.85 }, mk:{ x:7.3, y:1.7 }, mkLand:{ x:4.35, y:3.25 }, mkDown:{ x:6.6, y:2.3 },
  team:[[2.7,4.5],[3.55,5.15],[4.5,5.35],[5.45,5.15],[6.25,4.5]],
};
/* What the Monkey King says the first time he casts each stone (§12, "His
   lines" — the designer's draft, its figures checked against the stones as
   they are now: Ice Tomb freezes for two turns since 3.16, and Overcharge and
   a Dragon Dance do a little more). */
const R5_MK_STONE_LINES = {
  Dragon:   `<b>"The Dragon Stone first. While I carry it, we always move first. Now we dance: everything we hit takes 35% more — and their shields break, three at a time. A dance multiplies every other stone, so it goes up before the rest."</b>`,
  Fire:     `<b>"Fire! We hit half as hard again, and take only a little more for it — and every one of them burns each turn. Light it when you mean to finish fast, not when you are hurt."</b>`,
  Ghost:    `<b>"The Ghost Stone's Curse. They take 30% more from every blow, we take 15% less from theirs — and their tricks fall silent, even a Futuresight. Curse them first, then swing."</b>`,
  Electric: `<b>"Lightning! The first blow that lands strikes twice — certain — and after that, three times in ten. And we all move sooner. Save your biggest move for the turn it is fresh."</b>`,
  Physical: `<b>"My own stone. Two Counter stacks for our side: the next two attacks on any of us are taken on the guard, four fifths turned away, and our next blow lands a quarter harder. Let them swing at the guard first."</b>`,
  Water:    `<b>"I kept this one for the big one. Ice Tomb: frozen solid for two turns — it cannot strike back — and then a chill that slows it and takes 30% off its blows. Spend your ice on the enemy that matters, never on the small ones."</b>`,
  Grass:    `<b>"Leech Seed. Every blow we land on a seeded one heals us all, and gnaws it again. The longer the fight, the more it gives — plant it early."</b>`,
  Ground:   `<b>"Spike Armour: we take 30% less, and whoever hits us is pricked back for it. Best against the ones that hit many times."</b>`,
  Flying:   `<b>"Mirage! The first attack on us passes straight through, and every dodge after leaves two copies of us that strike back. Up before they attack — it cannot help once they have."</b>`,
  Steel:    `<b>"Steel Aegis: four layers of block to soak their blows, and 40% less from whatever gets through."</b>`,
  Psychic:  `<b>"Discombobulate — they cannot tell friend from foe. Watch them hit themselves!"</b>`,
  FairyLine:`<b>"And the stone you took from the tower. Diamond Dust sweeps away everything they put on us, and holds our own stones in the air. Cast it just before your buffs run out — they stay up as long as it does."</b>`,
  FairyHeld:`<b>"They were about to fade. The dust holds them — five more rounds."</b>`,
};
function r5Vault(){ const r = r5(); r.vault = r.vault || { scene:false, tries:0, won:false }; return r.vault; }
/* 'before' the first time in; 'ready' for the fight; 'won' once Cyborg is
   broken — and (3.20) 'crowned' once the cores are home, 'nemesis' once
   Nemesis has come and gone, 'promised' once Nino is home and the Forest
   Guardian gone, 'after' once the Family has gone down to the harbour. */
const R5_VAULT_ORDER = ['before', 'ready', 'won', 'crowned', 'nemesis', 'promised', 'after'];
function r5VaultState(){
  const v = r5Vault();
  if(v.family) return 'after';
  if(v.promised) return 'promised';
  if(v.nemesis) return 'nemesis';
  if(v.crowned) return 'crowned';
  return v.won ? 'won' : v.scene ? 'ready' : 'before';
}
/* Has the story in the vault got as far as `st`? */
function r5VaultAt(st, now){ return R5_VAULT_ORDER.indexOf(now || r5VaultState()) >= R5_VAULT_ORDER.indexOf(st); }
const r5PadrinoFace = ()=> faceNpc('padrino2', '🕴️');
/* (3.20) his crown back for good once the cores are home (read without
   making a Region 5 record — the arena's copy of the fight uses it too) */
function r5MKCrowned(){
  const r = state && state.progress && state.progress.region5;
  return !!(ui.r5MKCrown || (r && r.vault && r.vault.crowned));
}
function r5MKFace(){ return faceMon('monkey_king', { stage:1, crowned:r5MKCrowned() }); }
/* …and in the fight itself, as he was then (the arena's copy too) */
function r5MKFaceBare(){ return faceMon('monkey_king', { stage:1 }); }
const r5GuardianFace = ()=> faceMon('forest_fairy', { stage:1, crowned:true });
const R5_PADRINO = 'Don Padrino', R5_MK = 'Monkey King', R5_GUARDIAN = 'The Forest Guardian';

/* ---------- the door ---------- */
async function r5VaultDoor(){
  const r = r5();
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  if(!r.jaxBeaten) return r5JaxDoor();
  if(r5VaultState() !== 'before'){ ui.r5VaultFresh = true; return goFloor('cata_vault', 'top'); }
  const W = whaleName(), wl = ()=> faceMon('whalelord');
  await sceneSay([], 'The vault', `The great iron door stands open a crack. Through it come voices, the hum of a machine — and cold, pouring out like water.`);
  await sceneSay([wl()], W, `<b>"The Padrino. Cyborg. My core. And that cold."</b>`);
  /* "if you lack any, the Whalelord warns you before the fight (you may ignore it)" */
  const miss = r5StonesMissing();
  if(miss.length){
    await sceneSay([wl()], W, `<b>"Wait. The Monkey King asked for the stones — and we still have no ${miss.map(r5StoneName).join(', no ')}."</b>`);
    await sceneSay([wl()], W, `<b>"He will fight with the power of every stone we bring him. Without ${miss.length === 1 ? 'that one' : 'those'}, this will be much harder. ` +
      `We could go back for ${miss.length === 1 ? 'it' : 'them'} first — ask me, and I will tell you where."</b>`);
  }
  const yes = await r5Ask([wl()], W, `<b>"Whatever is in there, we face it together. Are you ready?"</b><br><br>${r5VaultNote()}`, '🚪 Go in', 'Not yet');
  if(!yes) return;
  ui.r5VaultFresh = true;
  goFloor('cata_vault', 'top');
}
/* What the fight will be — said before it, as every fight's note is. */
function r5VaultNote(){
  return `<i>Inside: the Padrino. His <b>Rhino, Fox, Shadow, Jackal and Raven</b>, one at a time — crowned, level ${R5_VAULT_LV} — ` +
    `and then <b>Cyborg</b>, the time monster, level ${R5_VAULT_CYBORG}. <b>Beat them three times.</b> ` +
    `The <b>Monkey King</b> fights beside you, with the power of every stone you carry. No running — ` +
    `but if you lose, <b>nothing is lost</b>, not even XP: you can try again.</i>`;
}

/* ---------- the room ---------- */
function r5VaultRender(world, d){
  const r = r5();
  if(!r.reached.includes(d.key)){ r.reached.push(d.key); saveProfile(); }
  ['#backBtn', '#walkParty'].forEach(sel=>{ const b = $(sel); if(b) b.addEventListener('click', ()=> saveProfile()); });
  const st = r5VaultState();
  r5VaultSet(st);
  const fresh = !!ui.r5VaultFresh;
  ui.r5VaultFresh = false;
  const next = ui.r5VaultNext;
  ui.r5VaultNext = null;
  if(next) return setTimeout(()=>{ if(ui.screen === d.key) next(); }, 450);
  if(st === 'before') return setTimeout(()=>{ if(ui.screen === d.key && !ui.sceneRunning) r5VaultScene(); }, 500);
  if(st === 'ready' && fresh) return setTimeout(()=>{ if(ui.screen === d.key && !ui.sceneRunning && !document.querySelector('.scene-say')) r5VaultPadrino(true); }, 500);
  /* (3.20) the story after the fight, picked up where it stopped */
  if(r5VaultAt('won', st) && !(st === 'after' && r5().mkJoined))
    return setTimeout(()=>{ if(ui.screen === d.key && !ui.sceneRunning && !document.querySelector('.scene-say')) r5VaultContinue(); }, 600);
}
/* The room as the story has it now. */
function r5VaultSet(st){
  r5Css(); r5VaultCss(); r5EndCss();
  const P = R5_VP, E = R5_VE;
  const at = k=> r5VaultAt(k, st);
  const broken = st === 'won' || st === 'crowned';
  const npc = (id, sprite, a, icon)=> sceneActor(id, { x:a.x, y:a.y, w:1, h:1, src:`assets/npc/${sprite}.png`, icon:icon || '🕴️' });
  /* the Family: the Padrino in the middle, the Madrina and Jax, the chiefs at
     the back — (3.20) after the fight, the Padrino on his knees by his broken
     machine; gone, all of them, once they have gone down to the harbour */
  const family = ['padrino', 'madrina', 'jax'].concat(P.chiefs.map(c=> 'chief_' + c[0]));
  if(st === 'after') family.forEach(sceneActorGone);
  else {
    const pa = npc('padrino', 'padrino2', st === 'promised' ? E.padrinoHug : at('won') ? E.padrino : P.padrino);
    if(pa){ actorFace(pa, st !== 'promised'); pa.classList.toggle('r5-kneel', at('won') && !at('promised')); }
    npc('madrina', 'madrina', st === 'promised' ? E.madrinaUp : at('won') ? E.madrina : P.madrina, '👵');
    const jx = npc('jax', 'rival_padrino', st === 'promised' ? E.jaxCage : P.jax, '🧑'); if(jx) actorFace(jx, false);
    P.chiefs.forEach(([sp, x, y])=>{ const el = npc('chief_' + sp, sp, { x, y }); if(el){ el.classList.add('r5-back'); actorFace(el, x < 5); } });
  }
  /* Cyborg, in its cradle: asleep, awake, or broken — (3.20) and then gone,
     into the tear, and the tear left hanging over its empty cradle */
  if(!at('nemesis')){
    const cy = r5MonActor('cyborg', 'cyborg', P.cyborg.x, P.cyborg.y, P.cyborg.s,
      { html:monPortrait('cyborg', Math.round(WALK_T * P.cyborg.s), { view:'front', bare:true, crowned:true }), z:18 });
    if(cy){ cy.classList.toggle('r5-asleep', st === 'before'); cy.classList.toggle('r5-awake', st === 'ready'); cy.classList.toggle('r5-broken', broken); }
    sceneActorGone('tear');
  } else {
    sceneActorGone('cyborg');
    r5TearActor(E.tear.cx, E.tear.cy, E.tear.s);
  }
  r5Sparks(broken ? 'map' : null);
  /* the Forest Guardian, in her cage — (3.20) or the cage open, and empty */
  if(!at('promised')){
    r5MonActor('guardian', 'forest_fairy', P.guardian.x, P.guardian.y, P.guardian.s,
      { html:monPortrait('forest_fairy', Math.round(WALK_T * P.guardian.s), { view:'front', bare:true, stage:1, crowned:true }), z:16 });
    r5CageActor(false);
  } else { sceneActorGone('guardian'); r5CageActor(true); }
  /* the table: the little box — or, once Cyborg has made it, Nino's body —
     (3.20) and empty once he is up and about */
  if(st === 'before') r5VaultBox();
  else if(!at('promised')) r5VaultBody();
  else { sceneActorGone('box'); sceneActorGone('body'); }
  /* Nino, by the wall — and none of them can see him; (3.20) beside the
     Ghost Master, once she can; alive, at his brother's side */
  sceneActorGone('ninoAlive');
  if(st === 'ready' || broken){ r5NinoActor(P.nino.x, P.nino.y); actorFaceToward('nino', P.padrino.x + 0.5); }
  else if(st === 'nemesis'){ r5NinoActor(E.ninoGM.x, E.ninoGM.y); actorFaceToward('nino', E.gm.x + 0.5); }
  else if(st === 'promised'){ sceneActorGone('nino'); r5NinoAlive(E.ninoBody.x, E.ninoBody.y); }
  else sceneActorGone('nino');
  /* (3.20) the Ghost Master — (3.21) alone: her Guardian, bound to Nemesis,
     went into the tear with it */
  if(st === 'nemesis' || st === 'promised') r5GMActor(E.gm.x, E.gm.y);
  else sceneActorGone('gm');
  sceneActorGone('gguard');
  /* the Monkey King, beside where you came in — won, holding the cores; then
     (3.20) his crown, for good; gone down to the harbour with the rest */
  if(st !== 'before' && st !== 'after'){
    const crowned = at('crowned');
    const mk = r5MonActor('mk', 'monkey_king', P.mk.x, P.mk.y, R5_VE.mkS, { html:monPortrait('monkey_king', Math.round(WALK_T * R5_VE.mkS), { view:'front', bare:true, stage:1, crowned }), z:30 });
    if(mk){ actorFace(mk, false); mk.classList.toggle('r5-golden', st === 'won'); }
    r5CoresHeld(broken);
  } else sceneActorGone('mk');
}
/* An actor drawn from HTML (a cage, a box): r5MonActor's kind, any shape. */
function r5HtmlActor(id, x, y, w, h, html, z){
  sceneCss();
  const world = $('#walkWorld'); if(!world) return null;
  let el = document.getElementById('sa-' + id);
  if(!el){ el = document.createElement('div'); el.className = 'scene-actor'; el.id = 'sa-' + id; world.appendChild(el); }
  const T = WALK_T;
  el._o = { x, y, w, h };
  el.style.left = (x * T) + 'px'; el.style.top = (y * T) + 'px';
  el.style.width = (w * T) + 'px'; el.style.height = (h * T) + 'px';
  el.style.zIndex = z != null ? z : (10 + Math.floor(y + h));
  el.innerHTML = `<div class="sa-in">${html}</div>`;
  return el;
}
function r5CageActor(open){
  const P = R5_VP.cage;
  const el = r5HtmlActor('cage', P.x, P.y, P.w, P.h, r5CageSvg(open), 17);
  if(el) el.classList.add('r5-cage');
}
/* iron bars, and roots winding up through them, in leaf — (3.20) or, open,
   its door (the middle bars) swung out to the left */
function r5CageSvg(open){
  const bar = x=> `<rect x="${x - 1.6}" y="8" width="3.2" height="104" rx="1.4" fill="url(#cgIron)"/>`;
  const bars = (open ? [10, 80, 94] : [10, 24, 38, 52, 66, 80, 94]).map(bar).join('') +
    (open ? `<g transform="translate(-34 0) skewY(-6)">${[24, 38, 52, 66].map(bar).join('')}<rect x="20" y="10" width="50" height="5" rx="2" fill="url(#cgIron)"/></g>` : '');
  const roots = [
    'M8 116 C 14 92, 2 78, 12 58 S 22 26, 16 6',
    'M96 116 C 88 96, 102 80, 92 60 S 84 30, 92 10',
    'M44 118 C 40 100, 52 90, 46 72',
    'M70 118 C 76 104, 64 92, 72 80',
  ].map(d=> `<path d="${d}" fill="none" stroke="#6b4a2b" stroke-width="4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#8a6440" stroke-width="1.6" stroke-linecap="round"/>`).join('');
  const leaves = [[12,60,30],[16,30,-20],[92,62,200],[90,32,160],[46,74,10],[72,82,170],[14,90,40],[94,92,150]]
    .map(([x, y, a])=> `<ellipse cx="${x}" cy="${y}" rx="6.5" ry="3" transform="rotate(${a} ${x} ${y})" fill="#5fae5a" stroke="#2f6a2f" stroke-width=".8"/>`).join('');
  return `<svg viewBox="0 0 104 120" width="100%" height="100%" preserveAspectRatio="none" style="display:block;overflow:visible;">
    <defs><linearGradient id="cgIron" x1="0" x2="1"><stop offset="0" stop-color="#4a4652"/><stop offset=".45" stop-color="#9b96a6"/><stop offset="1" stop-color="#3a3740"/></linearGradient></defs>
    <rect x="2" y="2" width="100" height="9" rx="3" fill="url(#cgIron)"/>
    <rect x="2" y="109" width="100" height="9" rx="3" fill="url(#cgIron)"/>
    ${bars}${roots}${leaves}
  </svg>`;
}
/* the little wooden box on the table — a boat carved on its lid */
function r5VaultBox(){
  sceneActorGone('body');
  const P = R5_VP.box;
  r5HtmlActor('box', P.x, P.y, 0.8, 0.8, `<svg viewBox="0 0 40 40" width="100%" height="100%" style="display:block;">
    <rect x="5" y="16" width="30" height="18" rx="2" fill="#7a5434" stroke="#3e2a18" stroke-width="2"/>
    <rect x="3" y="11" width="34" height="7" rx="2" fill="#94683f" stroke="#3e2a18" stroke-width="2"/>
    <path d="M13 23 L27 23 L24 27 L16 27 Z" fill="#c9a24a"/><path d="M20 18 L20 23 L24 23 Z" fill="#e8e2d2"/></svg>`, 15);
}
/* …and Nino's body, lying on it as if asleep: the boy as he was (NINO_BODY) */
function r5VaultBody(){
  sceneActorGone('box');
  const P = R5_VP.body;
  const el = sceneActor('body', { x:P.x, y:P.y, w:1.05, h:1.05, src:`assets/npc/${NINO_BODY}.png`, icon:'👦', faint:1, z:15 });
  if(el) el.classList.add('r5-body');
}
/* The cores in his arms: a bundle of little stars. */
function r5CoresHeld(on){
  const el = document.getElementById('sa-mk');
  if(!el) return;
  const old = el.querySelector('.r5-held-cores');
  if(old) old.remove();
  if(!on) return;
  const c = document.createElement('div');
  c.className = 'r5-held-cores';
  c.innerHTML = [[38,62],[50,58],[62,63],[44,70],[56,71],[50,80],[33,74],[67,74]].map(([x, y], k)=>
    `<i style="left:${x}%;top:${y}%;animation-delay:${(k * 0.23).toFixed(2)}s"></i>`).join('');
  el.appendChild(c);
}

/* ---------- what you can look at ---------- */
async function r5VaultCage(){
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  const st = r5VaultState();
  if(st === 'before') return;
  if(r5VaultAt('promised', st)) return sceneSay([], 'The cage', `The cage stands open, and empty. A few green leaves lie on the floor inside it.`);
  await sceneSay([r5GuardianFace()], R5_GUARDIAN, st === 'won'
    ? `She smiles at you through the bars.<br><br><b>"Well done, little ones. Well done."</b>`
    : `She watches you through the bars, calm as a summer morning.<br><br><b>"Go on, little ones. I am not going anywhere."</b>`);
  if(r5Fairy() && r5Once('vaultCageFairy'))
    await r5FairySay(`<b>"We'll get you out of there. I promise."</b>`);
}
async function r5VaultTable(){
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  if(r5VaultState() === 'before') return sceneSay([], 'The table', `A little wooden box, with a boat carved on its lid.`);
  if(r5VaultAt('promised')) return sceneSay([], 'The table', `Nothing on the stone table now but dust — and the little wooden box, empty, with a boat carved on its lid.`);
  await sceneSay([], 'The table', `A little boy lying on the stone, as if he were asleep — the boy in the photograph. He does not move.`);
  if(r5Once('vaultBodyWhale'))
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"His body. But not him. Nino is over there, by the wall."</b>`);
}
async function r5VaultCyborg(){
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  const st = r5VaultState();
  await sceneSay([], 'Cyborg', st === 'before'
    ? `Something made of metal, asleep in an iron cradle. Where its heart should be, there is a clock.`
    : st === 'ready' ? `Cyborg stands in its cradle, humming. The clock in its chest ticks backwards.`
    : `Cyborg slumps in its cradle, cracked open and sparking. It does not move.`);
}
/* (3.20) …and once Nemesis has taken it: the tear, over the empty cradle —
   the way to the space-time tear's page (Challenge the past; Region 6). */
async function r5VaultTear(){
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  const yes = await r5Ask([r5TearFace()], 'The space-time tear',
    `A hole in the air, swirling purple, over Cyborg's empty cradle. It hums like a held breath.<br><br>Nemesis went through here — in Cyborg's body.`,
    '🌀 Go to the tear', 'Not now');
  if(!yes) return;
  ui.tearBack = 'cata_vault';
  go('tear');
}
async function r5VaultMK(){
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  const st = r5VaultState();
  if(st === 'ready') return sceneSay([r5MKFace()], R5_MK, `<b>"Ready when you are. Speak to the Padrino — and remember: together."</b>`);
  if(st === 'won' || st === 'crowned') return sceneSay([r5MKFace()], R5_MK, `He holds the cores close, glowing like a bundle of stars.<br><br><b>"Not yet, little one. Something here is not finished."</b>`);
}
/* The Padrino: the fight, again — or, after it, nothing to say. */
async function r5VaultPadrino(auto){
  if(ui.sceneRunning || document.querySelector('.scene-say')) return;
  const st = r5VaultState();
  if(st === 'won' || st === 'crowned') return sceneSay([r5PadrinoFace()], R5_PADRINO, `He kneels by the broken machine, and does not look up.`);
  if(st !== 'ready') return;
  if(auto) await sceneSay([r5MKFace()], R5_MK, `<b>"On your feet. Again — together. Every time we fall, we learn. He cannot turn that back."</b>`);
  const yes = await r5Ask([r5PadrinoFace()], R5_PADRINO,
    `<b>"${auto ? 'Back again? Cyborg will turn back time as often as it takes.' : 'Well? Cyborg is waiting.'}"</b><br><br>${r5VaultNote()}`, '⚔️ Fight', 'Not yet');
  if(!yes) return;
  r5ClimaxStart();
}

/* ---------- the first time in ---------- */
/* A beam of light from one point to another (tiles), drawn over the room. */
function r5Beam(id, x1, y1, x2, y2, kind){
  r5VaultCss();
  const world = $('#walkWorld'); if(!world) return null;
  const T = WALK_T, dx = (x2 - x1) * T, dy = (y2 - y1) * T;
  const el = document.createElement('div');
  el.className = 'r5-beam' + (kind ? ' ' + kind : '');
  el.id = 'rb-' + id;
  el.style.left = (x1 * T) + 'px'; el.style.top = (y1 * T) + 'px';
  el.style.width = Math.hypot(dx, dy) + 'px';
  el.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  world.appendChild(el);
  void el.offsetWidth;
  el.classList.add('on');
  return el;
}
function r5BeamGone(id){ const el = document.getElementById('rb-' + id); if(el){ el.classList.remove('on'); setTimeout(()=> el.remove(), 400); } }
/* Time turned back, over the room: the swirl, a sound if there is one. */
function r5RewindFx(){ playSfx('rewind'); tearRewindFx(); }
async function r5VaultScene(){
  const r = r5(), w = walkState(), P = R5_VP;
  if(ui.sceneRunning || r5VaultState() !== 'before') return;
  ui.sceneRunning = true;
  w.busy = true;
  releaseKeys();
  const W = whaleName(), wl = ()=> faceMon('whalelord');
  const pa = html=> sceneSay([r5PadrinoFace()], R5_PADRINO, html);
  const gd = html=> sceneSay([r5GuardianFace()], R5_GUARDIAN, html);
  const mk = html=> sceneSay([r5MKFace()], R5_MK, html);
  const say = html=> sceneSay([], '', html);
  const whale = html=> sceneSay([wl()], W, html);
  /* 1. Nino slips in ahead, and waits by the wall; you come in after him */
  r5NinoActor(5, 1.1, 500);
  await r5MoveActor('nino', P.nino.x, P.nino.y, 900);
  actorFaceToward('nino', P.padrino.x + 0.5);
  w.at.cata_vault = { x:P.you.x, y:P.you.y };
  w.ghostAt = w.ghostAt || {}; w.ghostAt.cata_vault = { x:P.you.x - 1, y:P.you.y };
  refreshWalk();
  await say(`Nino slips through the door ahead of you, and waits by the wall, in the shadows.`);
  await say(`A great round room, under the crypt. Machines hum along the walls, full of glass jars — every one of them empty. ` +
    `A huge clock is carved into the floor, and its hands are running backwards.`);
  await say(`In the middle of the room stands the Padrino. The whole Family is here — the Madrina, Jax, the Sottocapo, the capos and the Consigliere. Nobody turns round.`);
  await say(`In front of the Padrino is a cage of iron, with roots and green leaves growing through its bars. Inside it, very still, sits a tall fairy made of leaves and light.`);
  if(r5Fairy()) await r5FairySay(`<b>"It's her! The Forest Guardian!"</b>`);
  /* the Padrino and the Forest Guardian: he rages; she is calm */
  await pa(`<b>"Forty years ago I came to your forest, on my knees. Do you remember?"</b>`);
  await gd(`<b>"I remember. You were very brave. And very sad."</b>`);
  await pa(`<b>"My little brother was dying. And you said NO."</b>`);
  await gd(`<b>"My core was never mine to give. It is the life of my grove — and it was meant for the one who would come after me."</b>`);
  await pa(`<b>"So you let a little boy die. For a SEED."</b>`);
  await gd(`<b>"I gave you all I could: a little stone, to help him. I am sorry it was not enough."</b>`);
  sceneShake(500, t=> 0.06 * Math.max(0, 1 - t / 500));
  await pa(`<b>"SORRY? Look at me! Cry! Beg! Tell me you were WRONG!"</b>`);
  await gd(`She only looks at him, calm as a summer morning.<br><br><b>"I was not wrong. And you are not well, child. Something has been whispering to you — for a very long time."</b>`);
  await say(`The Padrino stares at her. For a long moment he says nothing at all.`);
  await pa(`<b>"Enough. It does not matter now. Nothing you say matters any more."</b>`);
  /* 2. Cyborg wakes, and makes Nino's body again from the bones */
  actorFace('padrino', false);
  await pa(`<b>"Cyborg. Wake up."</b>`);
  const cy = document.getElementById('sa-cyborg');
  r5DarkGlow('cybwake', P.cyborg.x + P.cyborg.s / 2, P.cyborg.y + P.cyborg.s * 0.55, 2.6);
  if(cy){ cy.classList.remove('r5-asleep'); cy.classList.add('r5-waking'); }
  playSfx('stone_veryhigh');
  await sceneWait(1100);
  if(cy){ cy.classList.remove('r5-waking'); cy.classList.add('r5-awake'); }
  await say(`In the iron cradle, something made of metal opens its eyes. In its chest, where a heart should be, a clock is ticking — backwards.`);
  await pa(`<b>"Every core I took, from every island across the sea. Every year of my life. All for this."</b>`);
  await pa(`<b>"Now — my first wish. Bring back my brother."</b>`);
  r5Beam('wish', P.cyborg.x + P.cyborg.s / 2, P.cyborg.y + 0.7, P.box.x + 0.4, P.box.y + 0.4);
  sceneGlow('wish', P.box.x + 0.4, P.box.y + 0.4, 1.5, 16);
  playSfx('rewind');
  sceneShake(2600, t=> 0.15 * Math.sin(Math.PI * Math.min(1, t / 2600)));
  await say(`Cyborg's clock spins faster and faster. The whole room shakes. Light pours out of the little box on the table — brighter, and brighter—`);
  await sceneFlash(450, 450, ()=>{ r5VaultBody(); r5BeamGone('wish'); const g = document.getElementById('sg-wish'); if(g) g.remove(); }, 900);
  await say(`When the light fades, a little boy is lying on the table — just like the little boy in the photograph. Very still. As if he were asleep.`);
  await whale(`<b>"The bones from the empty grave… It has made his body again. Just as it was."</b>`);
  await sceneSay([r5NinoFace()], '', `By the wall, Nino looks at the boy on the table. Slowly, he shakes his head.`);
  await whale(`<b>"That is only his body. Nino is not in it — he is over there, by the wall. And he does not want this."</b>`);
  await sceneGlowOut(['cybwake'], 600);
  actorFace('padrino', false);
  await pa(`He takes a step toward the table.<br><br><b>"Nino…?"</b>`);
  /* 3. the Monkey King crashes in, and is beaten — again, and again, and again */
  r5MonActor('mk', 'monkey_king', P.mkLand.x, -1.6, 1.3, { html:monPortrait('monkey_king', Math.round(WALK_T * 1.3), { view:'front', bare:true, stage:1 }), z:70 });
  actorFace('mk', true);
  sceneShake(700, t=> 0.12 * Math.max(0, 1 - t / 700));
  await r5LeapActor('mk', P.mkLand.x, P.mkLand.y, 520, 0, false);
  sceneShake(500, t=> 0.14 * Math.max(0, 1 - t / 500));
  await say(`CRASH! Part of the ceiling falls in — and somebody drops through it, and lands between the Padrino and the table.`);
  await mk(`<b>"Not so fast, Padrino!"</b>`);
  await mk(`<b>"Those cores are not yours — not one of them. And neither is that power."</b>`);
  actorFace('padrino', false);
  await pa(`<b>"The monkey. Still alive?"</b>`);
  await pa(`<b>"Then I will finish what I started. All of you — get him!"</b>`);
  const team = R5_VAULT_TEAM.map((sp, k)=>{
    const [x, y] = P.team[k];
    const el = r5MonActor('t' + k, sp, x, y, 0.95, { html:monPortrait(sp, Math.round(WALK_T * 0.95), { view:'front', bare:true, crowned:true, stage:evolutionStage(sp, R5_VAULT_LV) }), z:40 });
    if(el){ el.classList.add('r5-pop'); actorFace(el, x < 5); }
    return 't' + k;
  });
  r5MoveActor('padrino', P.padrinoBack.x, P.padrinoBack.y, 600);
  await sceneWait(700);
  const knockDown = async ()=>{
    for(let k = 0; k < team.length; k++){
      const [x, y] = P.team[k];
      await r5LeapActor('mk', x + (x < 5 ? 0.55 : -0.55), y - 0.55, 240, 0.7, false);
      sceneShake(160, t=> 0.08 * Math.max(0, 1 - t / 160));
      const el = document.getElementById('sa-' + team[k]);
      if(el) el.classList.add('r5-down');
      playSfx('hit_dealt');
    }
    await r5LeapActor('mk', P.mkLand.x, P.mkLand.y, 320, 0.8, false);
  };
  const standUp = async ()=>{
    r5RewindFx();
    await sceneWait(700);
    team.forEach(id=>{ const el = document.getElementById('sa-' + id); if(el) el.classList.remove('r5-down'); });
    await sceneWait(900);
  };
  await knockDown();
  await say(`The Padrino's monsters leap at the Monkey King — and he knocks them down, one after another, quick as lightning.`);
  await mk(`<b>"Ha! Is that all?"</b>`);
  await standUp();
  await say(`Cyborg's clock spins backwards — and the Padrino's monsters stand up again, as if nothing had ever happened.`);
  await mk(`<b>"…What?"</b>`);
  await knockDown();
  await standUp();
  await say(`He knocks them all down again. And again, Cyborg turns back time.`);
  await mk(`He is breathing hard now.<br><br><b>"Again…?!"</b>`);
  /* Cyborg itself */
  r5Beam('strike', P.cyborg.x + P.cyborg.s / 2, P.cyborg.y + 0.6, P.mkLand.x + 0.65, P.mkLand.y + 0.7, 'strike');
  playSfx('hit_taken');
  await sceneWait(300);
  r5BeamGone('strike');
  sceneShake(600, t=> 0.16 * Math.max(0, 1 - t / 600));
  await r5LeapActor('mk', P.mkDown.x, P.mkDown.y, 520, 1.0, false);
  { const el = document.getElementById('sa-mk'); if(el) el.classList.add('r5-down'); }
  await say(`This time Cyborg itself moves. A crack of purple light — and the Monkey King is thrown across the room.`);
  for(const id of team) r5MoveActor(id, document.getElementById('sa-' + id)._o.x, document.getElementById('sa-' + id)._o.y, 500, true);
  await sceneWait(550);
  team.forEach(id=> sceneActorGone(id));
  await say(`The Padrino calls his monsters back to him.`);
  await mk(`The Monkey King lies on the floor, breathing hard.<br><br><b>"You are cheating… Turning back time, over and over…"</b>`);
  await mk(`<b>"It goes against the laws of nature."</b>`);
  /* the cold: a hint of what hides behind it all */
  await r5Dread(2200);
  await mk(`He lifts his head, as if somebody had called his name.<br><br><b>"…That cold again. I know that cold. Long, long ago, when I fought—"</b>`);
  await mk(`<b>"No. It cannot be. That one is gone."</b>`);
  /* 4. the Padrino sees you */
  r5MoveActor('padrino', P.padrino.x, P.padrino.y, 500);
  await sceneWait(500);
  actorFaceToward('padrino', P.you.x + 0.5);
  await pa(`He turns — and sees you for the first time.<br><br><b>"And you. The child who has been knocking on my door all night."</b>`);
  await pa(`<b>"You are too late. All of you."</b>`);
  /* 5. the Whalelord's speech, and the Monkey King's answer */
  await whale(`<b>"Monkey King. Listen to me."</b>`);
  await whale(`<b>"All of us legendaries — so proud of our power — fought him alone. One by one. And one by one, we fell to his tricks."</b>`);
  await whale(`<b>"Only one of us was wise enough to do something different. She is sitting there, in that cage."</b>`);
  await whale(`<b>"The Forest Guardian did not fight him. She gave her seed to a child — the child who would bring us all together."</b>`);
  if(r5Fairy()){
    await r5FairySay(`<b>"That's me. I grew from that seed."</b>`);
    await gd(`<b>"And you have grown well, little one."</b>`);
  }
  await whale(`<b>"Now is the time to stand together. And show him what we can do — together."</b>`);
  { const el = document.getElementById('sa-mk'); if(el) el.classList.remove('r5-down'); }
  await r5LeapActor('mk', P.mk.x, P.mk.y, 480, 0.5, false);
  actorFace('mk', false);
  await mk(`He gets up, slowly, and looks at you for a long time.<br><br><b>"…You came further than I ever thought you would, little one."</b>`);
  await mk(`<b>"Not because you are strong. Because you and your monsters trust each other. I never had that."</b>`);
  await mk(`<b>"Very well. One last time — side by side."</b>`);
  /* 6. your team round you in a circle, the Whalelord at the top */
  w.at.cata_vault = { x:P.ring.x, y:P.ring.y };
  refreshWalk();
  await r5VaultRing();
  await say(`Your whole team comes out around you — the Whalelord first of all.`);
  await mk(`<b>"I hope you took my advice, and found the stones."</b>`);
  const held = heldStones();
  if(held.length){
    await r5StonesToMK(held);
    await say(`Your stones float out of your bag, one after another, in a shining chain — round and round the Monkey King — and with a flash, their power is his. He glows like the sun.`);
    await mk(`<b>"Good. Very good. Now — let us show him what we can do together!"</b>`);
  } else await mk(`<b>"…No stones? Then we will do this the hard way. Together!"</b>`);
  await r5VaultRingGone();
  r5Vault().scene = true;
  await saveProfile();
  w.busy = false;
  ui.sceneRunning = false;
  r5ClimaxStart();
}
/* Your team, round you in a circle: the Whalelord at the top, the rest
   clockwise from him. */
async function r5VaultRing(extra){
  const w = walkState(), P = R5_VP.ring;
  const cx = P.x + 0.5, cy = P.y + 0.5;
  /* (3.20) the Whalelord always — a passenger or not — and, for the cores
     coming home, a legendary of yours from storage too (`extra`) */
  const team = (state.party || []).filter(m=> m && (!isPassenger(m) || isCuain(m)));
  const whale = team.find(m=> isCuain(m));
  const order = (whale ? [whale] : []).concat(team.filter(m=> m !== whale), (extra || []).filter(m=> m && !team.includes(m))).slice(0, 9);
  const R = order.length > 7 ? 1.85 : 1.55;
  const ids = {};
  const gh = $('#walkGhost'); if(gh){ gh.style.transition = `opacity ${300 * SCENE_SPEED}ms ease`; gh.style.opacity = '0'; }   // (its picture is visibility:visible: opacity, not visibility)
  for(let k = 0; k < order.length; k++){
    ids[order[k].uid] = 'ring' + k;
    const m = order[k], a = -Math.PI / 2 + k * 2 * Math.PI / order.length;
    const s = isCuain(m) ? 1.3 : 1.0;
    const el = r5MonActor('ring' + k, m.species, cx + Math.cos(a) * R - s / 2, cy + Math.sin(a) * R - s / 2 - 0.15, s,
      { html:monPortrait(m.species, Math.round(WALK_T * s), { view:'front', bare:true, stage:monStage(m), crowned:isCrowned(m) }), z:45 });
    if(el){ el.classList.add('r5-pop'); actorFace(el, Math.cos(a) < 0); el.dataset.uid = m.uid; }
    playSfx('answer_correct');
    await sceneWait(260);
  }
  ui.r5Ring = order.length;
  await sceneWait(500);
  return ids;
}
async function r5VaultRingGone(){
  const n = ui.r5Ring || 0;
  for(let k = 0; k < n; k++){ const el = document.getElementById('sa-ring' + k); if(el){ el.style.transition = `opacity ${400 * SCENE_SPEED}ms ease`; el.style.opacity = '0'; } }
  await sceneWait(420);
  for(let k = 0; k < n; k++) sceneActorGone('ring' + k);
  ui.r5Ring = 0;
  const gh = $('#walkGhost'); if(gh) gh.style.opacity = '';
}
/* Your stones, out of your bag in a chain, round him, and into him. */
async function r5StonesToMK(held){
  const world = $('#walkWorld'); if(!world) return;
  const T = WALK_T, from = { x:R5_VP.ring.x + 0.5, y:R5_VP.ring.y + 0.5 }, to = { x:R5_VP.mk.x + 0.675, y:R5_VP.mk.y + 0.75 };
  const S = 0.55;
  const els = held.map((st, k)=>{
    const el = document.createElement('div');
    el.className = 'r5-stone-fly';
    el.style.width = el.style.height = (S * T) + 'px';
    el.style.left = ((from.x - S / 2) * T) + 'px'; el.style.top = ((from.y - S / 2) * T) + 'px';
    el.innerHTML = uiIcon(st.icon, Math.round(S * T), st.emoji);
    world.appendChild(el);
    return el;
  });
  const n = els.length, dur = 2600 + n * 120;
  playSfx('stone_veryhigh');
  await r5Tween(dur, t=>{
    els.forEach((el, k)=>{
      const lag = k / Math.max(1, n) * 0.35;
      const u = Math.max(0, Math.min(1, (t - lag) / (1 - lag)));
      let x, y;
      if(u < 0.4){                                    // the chain, out to him
        const v = u / 0.4;
        x = from.x + (to.x - from.x) * v; y = from.y + (to.y - from.y) * v - Math.sin(Math.PI * v) * 0.8;
      } else if(u < 0.85){                            // round and round him
        const v = (u - 0.4) / 0.45, a = k * 2 * Math.PI / n + v * Math.PI * 3, R = 0.95 - 0.25 * v;
        x = to.x + Math.cos(a) * R; y = to.y + Math.sin(a) * R * 0.75;
      } else {                                        // and into him
        const v = (u - 0.85) / 0.15, a = k * 2 * Math.PI / n + Math.PI * 3, R = 0.7 * (1 - v);
        x = to.x + Math.cos(a) * R; y = to.y + Math.sin(a) * R * 0.75;
        el.style.opacity = String(1 - v);
      }
      el.style.left = ((x - S / 2) * T) + 'px'; el.style.top = ((y - S / 2) * T) + 'px';
    });
  });
  els.forEach(el=> el.remove());
  r5DarkGlow('mkgold', to.x, to.y - 0.1, 2.2, true);
  const mk = document.getElementById('sa-mk'); if(mk) mk.classList.add('r5-golden');
  playSfx('stone_veryhigh');
  await sceneWait(900);
  await sceneGlowOut(['mkgold'], 700);
}

/* ---------- the fight ---------- */
function r5ClimaxStart(){
  if(!ensurePool()) return;
  const v = r5Vault();
  v.tries = (v.tries || 0) + 1;
  saveProfile();
  r5Sparks(null);
  walkTeardown();
  beginBattle(r5ClimaxBattle());
}
/* The fight as the story has it (and, `arena`, the Test Arena's copy: his
   lines every time, and its own end). */
function r5ClimaxBattle(opts){
  opts = opts || {};
  const waves = [];
  for(let k = 0; k < 3; k++){
    R5_VAULT_TEAM.forEach(sp=> waves.push([{ species:sp, level:R5_VAULT_LV, ai:'best', crowned:true, supplements:10, nerfed:false }]));
    waves.push([{ species:'cyborg', level:R5_VAULT_CYBORG, ai:'best', crowned:true, nerfed:false, boss:true }]);
  }
  waves.push([{ species:'cyborg', level:R5_VAULT_CYBORG, ai:'best', crowned:true, nerfed:false, boss:true }]);   // the last phase: broken
  /* his first-time lines are remembered in the story only — the arena's copy
     writes nothing to your save */
  const said = opts.arena ? {} : (()=>{ const r = r5(); return (r.mkLines = r.mkLines || {}); })();
  return { isNpc:true, name:'Don Padrino · Round 1 of 3', npcId:'padrino2', noFlee:true, figlio:true, bgKey:'battle_vault', waves,
    climax:{ lost:()=> r5ClimaxLost() },
    ally:{ species:'monkey_king', level:100, name:R5_MK, lines:R5_MK_STONE_LINES, said,
           onSaid:()=>{ if(!opts.arena) saveProfile(); }, face:r5MKFaceBare, golden:true },
    onWaveStart:(i)=> r5ClimaxWave(i), onWaveCleared:(next)=> r5ClimaxCleared(next), waveLabel:(i)=> r5ClimaxLabel(i),
    doneWhen:()=> r5ClimaxBeaten(), onDone:()=> r5ClimaxWon() };
}
function r5ClimaxLabel(i){
  return i >= 18 ? `Cyborg is broken — clear its bar, all the way down!` : `Round ${Math.floor(i / 6) + 1} of 3 · wave ${i % 6 + 1} of 6!`;
}
/* Held at 1 HP: it can be struck, never felled (the last phase). */
function r5HoldAtOne(e){
  let hp = Math.max(1, e.hp);
  Object.defineProperty(e, 'hp', { configurable:true, enumerable:true,
    get(){ return hp; },
    set(v){ const n = +v; if(Number.isFinite(n)) hp = Math.max(1, n); } });
}
function r5ClimaxWave(i){
  const b = ui.battle, e = b.enemies[0];
  b.name = i >= 18 ? 'Don Padrino · Cyborg, broken' : `Don Padrino · Round ${Math.min(3, Math.floor(i / 6) + 1)} of 3`;
  /* Cyborg's first arrival: its three forms, for a moment */
  if(i === 5 && !b.splitShown){ b.splitShown = true; b.introDue = done=> r5CyborgSplit(done); }
  /* the last phase: no turn, nothing in it working, and never below 1 HP —
     then the scene that breaks it (before its first turn) */
  if(i === 18 && e){
    e.broken = true;
    r5HoldAtOne(e);
    b.introDue = done=> r5ClimaxBreak(done);
  }
}
function r5ClimaxBeaten(){
  const b = ui.battle, e = b && b.enemies && b.enemies[0];
  return !!(b && b.waveIndex === 18 && e && e.shattered && e.hp <= 1);
}
/* Speech over the fight: the battle is held while it is read. */
function r5BattleSay(faces, name, html){
  const b = ui.battle;
  if(b) b.hold = (b.hold || 0) + 1;
  return sceneSay(faces, name, html).then(()=>{ if(b) b.hold = Math.max(0, (b.hold || 1) - 1); });
}
/* A round's Cyborg beaten: it turns back time, and the team stands again —
   after the third, for the last time (the break follows, with the last wave). */
function r5ClimaxCleared(next){
  const b = ui.battle, i = b.waveIndex;
  if((i + 1) % 6 !== 0) return next();
  const round = (i + 1) / 6;
  b.phase = 'resolving';
  renderBattle();
  battleMsg(round < 3 ? `⏳ Cyborg turns back time — the Padrino's team stands up again! Round ${round + 1} of 3.` : `⏳ Cyborg turns back time — again…`);
  r5RewindFx();
  const once = key=> b.arenaChallenge ? true : r5Once(key);
  (async ()=>{
    await sceneWait(1700);
    if(ui.battle !== b) return;
    if(round === 1 && once('vaultRound1')) await r5BattleSay([r5PadrinoFace()], R5_PADRINO, `<b>"Did you think it would be that easy? While Cyborg stands, time is mine."</b>`);
    if(round === 2 && once('vaultRound2')) await r5BattleSay([r5MKFaceBare()], R5_MK, `<b>"Again! Keep going. Every time they come back just the same — and every time, we come back stronger."</b>`);
    if(ui.battle !== b) return;
    next();
  })();
}
/* Cyborg arrives as its past, its present and its future — for a moment. */
async function r5CyborgSplit(done){
  const b = ui.battle;
  r5VaultCss();
  b.hold = (b.hold || 0) + 1;
  const stage = $('#battleStage'), bob = document.getElementById('enemyBob-0');
  let forms = [];
  if(stage && bob){
    const s = stage.getBoundingClientRect(), r = bob.getBoundingClientRect();
    forms = ['past', 'future'].map(k=>{
      const f = document.createElement('div');
      f.className = 'r5-cyb-form ' + k;
      f.innerHTML = bob.innerHTML;
      f.style.left = (r.left - s.left) + 'px'; f.style.top = (r.top - s.top) + 'px';
      f.style.width = r.width + 'px'; f.style.height = r.height + 'px';
      stage.appendChild(f);
      return f;
    });
    void stage.offsetWidth;
    playSfx('stone_veryhigh');
    forms.forEach(f=> f.classList.add('out'));
  }
  await sceneWait(800);
  const first = b.arenaChallenge || !r5Vault().split;
  if(!b.arenaChallenge){ r5Vault().split = true; saveProfile(); }
  if(first) await r5BattleSay([r5PadrinoFace()], R5_PADRINO, `<b>"Behold — Cyborg's true form! Its past, its present and its future, all at once. Nothing in this world can stand against it!"</b>`);
  else await sceneWait(1600);
  forms.forEach(f=> f.classList.add('tremble'));
  await sceneWait(900);
  forms.forEach(f=> f.classList.remove('out'));
  await sceneWait(750);
  forms.forEach(f=> f.remove());
  if(first){
    await r5BattleSay([r5PadrinoFace()], R5_PADRINO, `<b>"…No. Hold it! HOLD IT!"</b>`);
    await r5BattleSay([r5PadrinoFace()], R5_PADRINO, `<b>"Bah. It spent too much of its power bringing my brother back. It cannot hold its three forms for long."</b>`);
    await r5BattleSay([r5PadrinoFace()], R5_PADRINO, `<b>"No matter. One Cyborg is more than enough for you."</b>`);
  }
  b.hold = Math.max(0, (b.hold || 1) - 1);
  done();
}
/* After the third round: the taunt, the rewind turned on you, the Monkey
   King steps into it — his crown, for a moment — and Heavensplitter Max. */
async function r5ClimaxBreak(done){
  const b = ui.battle, A = battleAlly(), e = b.enemies[0];
  r5VaultCss();
  b.hold = (b.hold || 0) + 1;
  const mkSay = html=> r5BattleSay([r5MKFaceBare()], R5_MK, html);
  const paSay = html=> r5BattleSay([r5PadrinoFace()], R5_PADRINO, html);
  const tell = html=> r5BattleSay([], '', html);
  await mkSay(`<b>"Padrino! Do you see it yet?"</b>`);
  await mkSay(`<b>"Every time you turn back the clock, this child only gets stronger. Every fight teaches them something new — and every fight, they and their monsters trust each other a little more."</b>`);
  await mkSay(`<b>"Time is on THEIR side. Not yours."</b>`);
  await paSay(`<b>"Then I will take their time away!"</b>`);
  await paSay(`<b>"Cyborg! Turn back that child's clock — all the way back, to before they ever had a single monster!"</b>`);
  /* the rewind comes for you — and he leaps into it */
  r5BattleBeam('enemyBob-0', 'playerBob', 'rewind-beam');
  playSfx('rewind');
  await sceneWait(450);
  const ab = document.getElementById('allyBob');
  if(ab) ab.classList.add('r5-leap');
  await sceneWait(550);
  r5RewindFx();
  await sceneWait(900);
  r5BattleBeamGone();
  if(A){ A.mon.crowned = true; A.crownedNow = true; }
  renderBattle();
  await tell(`The rewind hits the Monkey King instead of you — and for a moment he is younger. On his head shines a golden crown: the Monkey King from long, long ago.`);
  await mkSay(`<b>"…Ha! You turned my clock back — to the days when I still wore my crown!"</b>`);
  await mkSay(`<b>"Thank you, Padrino. I have missed this."</b>`);
  await r5HeavensplitterMax();
  e.shattered = true;
  e.blockStacks = 0;
  if(A){ A.mon.crowned = false; A.crownedNow = false; }
  renderBattle();
  r5Sparks('battle');
  await tell(`Heavensplitter Max! Cyborg cracks open — and the cores burst out of it like shooting stars. The Monkey King catches them, one by one. Then his crown fades away again.`);
  await paSay(`<b>"No… NO! Cyborg! Get up!"</b>`);
  await mkSay(`<b>"Without the cores it is only a broken machine. It cannot move."</b>`);
  await mkSay(`<b>"It is yours, little one. Finish it! I will keep your stones in the air."</b>`);
  /* the last phase: every cooldown reset — your Very Highs and Ultras, Steel
     Soul, Rebirth — every stone of his again, and the blows are yours */
  b.usedVeryHigh = {}; b.usedUltra = {}; b.usedSoul = {}; b.rebirthUsed = false;
  if(A){ A.passive = true; allyRecharge(); }
  renderBattle();
  battleMsg(`⚡ Every move is ready again! Clear Cyborg's bar — all the way down.`);
  b.hold = Math.max(0, (b.hold || 1) - 1);
  done();
}
/* A beam across the battle, from one element to another. */
function r5BattleBeam(fromId, toId, cls){
  r5VaultCss();
  const a = document.getElementById(fromId), c = document.getElementById(toId);
  if(!a || !c) return;
  const ra = a.getBoundingClientRect(), rc = c.getBoundingClientRect();
  const x1 = ra.left + ra.width / 2, y1 = ra.top + ra.height / 2, x2 = rc.left + rc.width / 2, y2 = rc.top + rc.height / 2;
  const el = document.createElement('div');
  el.className = 'r5-bbeam ' + (cls || '');
  el.id = 'r5BattleBeam';
  el.style.left = x1 + 'px'; el.style.top = y1 + 'px';
  el.style.width = Math.hypot(x2 - x1, y2 - y1) + 'px';
  el.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
  document.body.appendChild(el);
  void el.offsetWidth;
  el.classList.add('on');
}
function r5BattleBeamGone(){ const el = document.getElementById('r5BattleBeam'); if(el){ el.classList.remove('on'); setTimeout(()=> el.remove(), 400); } }
/* He flies at it; white; CRACK — the cores burst out of it, and come to him. */
async function r5HeavensplitterMax(){
  const ab = document.getElementById('allyBob'), eb = document.getElementById('enemyBob-0');
  if(ab) ab.classList.remove('r5-leap');
  if(ab && eb){
    const ra = ab.getBoundingClientRect(), re = eb.getBoundingClientRect();
    ab.style.transition = `translate ${380 * SCENE_SPEED}ms cubic-bezier(.5,0,.9,.5)`;
    ab.style.translate = `${(re.left + re.width / 2) - (ra.left + ra.width / 2)}px ${(re.top + re.height / 2) - (ra.top + ra.height / 2)}px`;
  }
  playSfx('core_blast');
  await sceneWait(380);
  await sceneFlash(120, 260, ()=>{
    const stage = $('#battleStage');
    if(stage && eb){
      const s = stage.getBoundingClientRect(), re = eb.getBoundingClientRect();
      const k = document.createElement('div');
      k.className = 'r5-crack';
      k.textContent = 'CRACK!';
      k.style.left = (re.left - s.left + re.width / 2) + 'px'; k.style.top = (re.top - s.top + re.height * 0.35) + 'px';
      stage.appendChild(k);
      setTimeout(()=> k.remove(), 1600);
    }
  }, 500);
  { const st = $('#battleStage'); if(st){ st.classList.add('r5-quake'); setTimeout(()=> st.classList.remove('r5-quake'), 700); } }
  if(ab){ ab.style.transition = `translate ${420 * SCENE_SPEED}ms ease-out`; ab.style.translate = ''; }
  await r5CoresBurst(eb, ab);
  if(ab) ab.style.transition = '';
}
/* The cores: out of it like shooting stars, then each to his hands. */
async function r5CoresBurst(fromEl, toEl){
  r5VaultCss();
  if(!fromEl) return sceneWait(800);
  const rf = fromEl.getBoundingClientRect();
  const fx = rf.left + rf.width / 2, fy = rf.top + rf.height / 2;
  const rt = toEl ? toEl.getBoundingClientRect() : rf;
  const tx = rt.left + rt.width / 2, ty = rt.top + rt.height * 0.45;
  const n = 9;
  const orbs = Array.from({ length:n }, (_, k)=>{
    const o = document.createElement('div');
    o.className = 'r5-core-orb';
    o.style.left = fx + 'px'; o.style.top = fy + 'px';
    document.body.appendChild(o);
    const a = k / n * Math.PI * 2 + Math.random() * 0.4, d = 70 + Math.random() * 70;
    return { o, ox:Math.cos(a) * d, oy:Math.sin(a) * d * 0.8 };
  });
  playSfx('stone_veryhigh');
  await r5Tween(1500, t=>{
    orbs.forEach(({ o, ox, oy }, k)=>{
      const lag = k / n * 0.25, u = Math.max(0, Math.min(1, (t - lag) / (1 - lag)));
      let x, y;
      if(u < 0.4){ const v = 1 - Math.pow(1 - u / 0.4, 2); x = fx + ox * v; y = fy + oy * v; }
      else { const v = (u - 0.4) / 0.6, e = v * v; x = fx + ox + (tx - fx - ox) * e; y = fy + oy + (ty - fy - oy) * e - Math.sin(Math.PI * v) * 40; }
      o.style.left = x + 'px'; o.style.top = y + 'px';
      o.style.opacity = u >= 1 ? '0' : '1';
    });
  });
  orbs.forEach(({ o })=> o.remove());
}
/* ---------- Cyborg, broken: a short circuit, hand-drawn ----------
   (the designer: "a tilt to the sprite and a hand drawn (not emoticon) short
   circuit electricity animation that flashes in at times over the sprite")
   Two or three jagged bolts — SVG paths of 5 to 8 segments, new every flash
   — a white-blue core inside a cyan and a yellow glow, drawn on in about
   60 ms, held 120–220 ms, then faded; a few sparks thrown off; the sprite
   twitches as it flashes. Every 0.7–2.4 s, now and then a double flash.
   `where`: 'battle' (over its card) or 'map' (over it in the vault); null
   stops it. */
let _r5SparkTimer = null;
function r5Sparks(where){
  clearTimeout(_r5SparkTimer);
  _r5SparkTimer = null;
  if(!where) return;
  r5VaultCss();
  const host = ()=> where === 'battle'
    ? ((ui.screen === 'battle' && ui.battle && ui.battle.enemies && ui.battle.enemies[0] && ui.battle.enemies[0].shattered) ? document.getElementById('enemyBob-0') : null)
    : (ui.screen === 'cata_vault' && ['won', 'crowned'].includes(r5VaultState()) ? document.getElementById('sa-cyborg') : null);
  const tick = ()=>{
    const h = host();
    if(!h){ _r5SparkTimer = null; return; }
    r5SparkFlash(h);
    if(Math.random() < 0.25) setTimeout(()=>{ const h2 = host(); if(h2) r5SparkFlash(h2); }, 300);
    _r5SparkTimer = setTimeout(tick, 700 + Math.random() * 1700);
  };
  _r5SparkTimer = setTimeout(tick, 350);
}
function r5SparkBolt(w, h){
  const n = 5 + Math.floor(Math.random() * 4);
  let x = w * (0.25 + Math.random() * 0.5), y = h * (0.12 + Math.random() * 0.3);
  const pts = [[x, y]];
  for(let k = 0; k < n; k++){
    x = Math.max(2, Math.min(w - 2, x + (Math.random() * 2 - 1) * w * 0.16));
    y = Math.min(h - 2, y + h * (0.05 + Math.random() * 0.08));
    pts.push([x, y]);
  }
  return { d:'M' + pts.map(p=> p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L'), end:pts[pts.length - 1], mid:pts[Math.floor(pts.length / 2)] };
}
function r5SparkFlash(hostEl){
  const r = hostEl.getBoundingClientRect();
  const w = Math.max(40, Math.round(r.width)), h = Math.max(40, Math.round(r.height));
  const bolts = Array.from({ length:2 + (Math.random() < 0.5 ? 1 : 0) }, ()=> r5SparkBolt(w, h));
  const sparks = [];
  bolts.forEach(b=> [b.end, b.mid].forEach(p=>{
    for(let k = 0; k < 2; k++){
      const a = Math.random() * Math.PI * 2, d = 8 + Math.random() * 16;
      sparks.push(`<circle class="sp" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(1 + Math.random() * 1.4).toFixed(1)}" fill="#fffbe0" style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px"/>`);
    }
  }));
  const svg = document.createElement('div');
  svg.className = 'r5-spark';
  svg.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" style="overflow:visible;display:block;">` +
    bolts.map(b=> `<path d="${b.d}" pathLength="1" fill="none" stroke="#ffd84a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/>` +
      `<path d="${b.d}" pathLength="1" fill="none" stroke="#4ff0ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>` +
      `<path d="${b.d}" pathLength="1" fill="none" stroke="#f4fbff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`).join('') +
    sparks.join('') + `</svg>`;
  hostEl.appendChild(svg);
  hostEl.classList.add('r5-twitch');
  playSfx('spark');
  const hold = 120 + Math.random() * 100;
  setTimeout(()=>{ hostEl.classList.remove('r5-twitch'); svg.classList.add('gone'); }, 60 + hold);
  setTimeout(()=> svg.remove(), 60 + hold + 260);
}

/* ---------- won: no victory screen ---------- */
async function r5ClimaxWon(){
  const b = ui.battle;
  if(b && b.arenaChallenge){ r5Sparks(null); return arenaChallengeOver('won'); }
  const v = r5Vault();
  const first = !v.won;
  v.won = true;
  const levelUps = first ? (awardXpToParty(R5_CLIMAX_XP) || []) : [];
  const brk = tallyBattleForEyeBreak();
  await saveProfile();
  /* Cyborg trembles where it stands; the screen fades to white */
  const card = document.getElementById('enemy-0');
  if(card) card.classList.add('r5-tremble');
  r5VaultCss();
  const f = document.createElement('div');
  f.className = 'r5-whiteout';
  document.body.appendChild(f);
  void f.offsetWidth;
  f.classList.add('on');
  stopMusic();
  playSfx('victory');
  await sceneWait(1800);
  r5Sparks(null);
  const w = walkState();
  w.at = w.at || {}; w.at.cata_vault = { x:R5_VP.you.x, y:R5_VP.you.y }; w.face = 'd';
  w.ghostAt = w.ghostAt || {}; w.ghostAt.cata_vault = { x:R5_VP.you.x - 1, y:R5_VP.you.y };
  ui.walkFresh = false;
  ui.currentZone = r5Zone('catacombs') || ui.currentZone;
  ui.r5VaultNext = ()=> r5VaultAfter(f, levelUps, brk);
  go('cata_vault');
}
/* Back in the vault, the white lifting — and (3.20) the rest of the story,
   chapter after chapter (r5VaultChapters, below): the cores home, Nemesis,
   the promise, the Family, the harbour. The fight's evolutions first, and an
   eye break that fell due with it (the story waits under it). */
async function r5VaultAfter(f, levelUps, brk){
  const w = walkState();
  ui.sceneRunning = true; w.busy = true;
  releaseKeys();
  if(f){ f.classList.remove('on'); setTimeout(()=> f.remove(), 1700); }
  try {
    await sceneWait(1200);
    const W = whaleName(), wl = ()=> faceMon('whalelord');
    await sceneSay([], '', `The light fades. Cyborg slumps in its cradle, cracked open and sparking. It does not move.`);
    await sceneSay([], '', `The Monkey King stands by the door with his arms full of cores, glowing like a bundle of stars.`);
    await sceneSay([wl()], W, `<b>"We did it. Together."</b>`);
    await sceneSay([r5MKFace()], R5_MK, `<b>"…Together."</b> He looks down at the cores in his arms. <b>"Hm. It suits me better than I thought."</b>`);
    const evolvers = (levelUps || []).filter(e=> e.evos && e.evos.length);
    if(evolvers.length) await r5Evolve(evolvers);
    if(brk) showEyeBreak();
    await r5VaultChapters(false);
  } finally { r5SceneDone(); }
}
/* ---------- lost: nothing is lost ---------- */
function r5ClimaxLost(){
  const b = ui.battle;
  if(b) b.climax = null;                         // once
  r5Sparks(null);
  playSfx('defeat');
  stopMusic();
  const brk = tallyBattleForEyeBreak();
  const fade = document.createElement('div');
  fade.style.cssText = 'position:fixed;inset:0;background:#2a1650;z-index:80;opacity:0;transition:opacity .8s;';
  document.body.appendChild(fade);
  requestAnimationFrame(()=>{ fade.style.opacity = '1'; });
  setTimeout(async ()=>{
    /* Cyborg turns back time for everyone in the room: your team whole, no XP taken */
    battleParty().forEach(m=>{ m.currentHp = monMaxHp(m); });
    restCompanions();
    await saveProfile();
    const w = walkState();
    w.at = w.at || {}; w.at.cata_vault = { x:5, y:1 }; w.face = 'd';
    w.ghostAt = w.ghostAt || {}; w.ghostAt.cata_vault = { x:4, y:1 };
    ui.walkFresh = false;
    ui.currentZone = r5Zone('catacombs') || ui.currentZone;
    ui.r5VaultNext = ()=> r5VaultAfterLoss(brk);
    go('cata_vault');
    fade.style.opacity = '0';
    setTimeout(()=> fade.remove(), 800);
  }, 1000);
}
async function r5VaultAfterLoss(brk){
  const w = walkState();
  ui.sceneRunning = true; w.busy = true;
  releaseKeys();
  await sceneSay([], '', `Cyborg's clock spins backwards — for everyone in the room, you too. You are standing at the door again, your team whole, as if the fight had never begun.`);
  await sceneSay([faceMon('whalelord')], whaleName(), `<b>"Nothing is lost. We can try again — whenever you are ready."</b>`);
  w.busy = false; ui.sceneRunning = false;
  if(brk) showEyeBreak();
}

/* ============================================================
   AFTER THE FIGHT — THE END OF REGION 5 (3.20; part 6 §12c C5–7, D)
   No victory screen: the vault again, the white lifting (r5VaultAfter), and
   then one chapter after another (r5VaultChapters). Each is saved as it
   ends, so an app closed half way picks up at the start of the chapter it
   was in (r5VaultContinue — the vault's render, or the harbour's).
   THE CORES HOME (r5VaultShowcase — the designer: "each core-less legendary
     receives its cores, starting with water dragon, thunder newt (if
     caught), whalelord, and finally monkey king. it feels like a triumphant
     moment"): your team round you, the Whalelord at the top (a legendary of
     yours in storage comes out too); a core from his arms to each, and a
     crowning each (playEvolutions: "…'s core has come home!", its ATK before
     and after). The Whalelord remembers his name — Cuain (whaleName() reads
     his crown). Then his own: the crown. → vault.crowned
   NEMESIS (r5VaultNemesis): he will take the rest home, to the children of
     the monsters they were torn from. The Ghost Master runs in, her Guardian
     at her shoulder — staring at the cores, not at her — and she sees Nino
     at last ("his voice had been blocked all this time by the ghost
     guardian/nemesis"); he warns his brother. Too late: the Guardian rips
     the air open behind Cyborg with its burning sword. The cold: the Monkey
     King knows it — the Bone Demon. Red eyes in the dark of the tear
     (nemesis_spirit); the hill's grudge pours into it; a hand of bones
     (nemesis_hand) takes the cores from him and, with three older ones of
     its own (a cobra's, a jackal's, a black one), pushes them into Cyborg.
     Black smoke; three shapes in the cradle (nemesis_anubis, nemesis,
     nemesis_wadjet), then the winged one. The Monkey King leaps — and a
     purple sphere stops time (r5TimeStop). Nemesis, in the stopped time: who
     made Nino sick, whose voice said a core would cure him, the dreams, the
     fire that burned his eyes; the wish it kept; Tang Seng; it will be back
     — and into the tear, and (3.21) its Guardian with it, bound to it to
     the last. Time runs again. The tear stays over the empty cradle. → vault.nemesis,
     r5().tearOpen (16-tear.js: Challenge the past)
   THE PROMISE (r5VaultPromise): everybody can see Nino now. He can come
     back, if his brother stops hurting monsters. The Padrino still hates the
     Forest Guardian — the promise is to Nino (decision 4); Nino steps into
     his body: "Big brother. …I'm home." Jax opens the cage; the Forest
     Guardian gives your Forest Fairy the rest of her power
     (state.forestBlessingGranted — the gift, 05-battle-flow.js FOREST GIFT)
     and fades; your team is healed. → vault.promised
   THE FAMILY (r5VaultFamily): it is Jax's and the Ghost Master's now —
     Nino's rule. → vault.family
   THE HARBOUR (r5ToFarewell, r5FarewellRun): the next morning, a little
     boat; Nino waves goodbye; the Monkey King asks to come with you and
     joins (r5MKJoin): crowned, Lv 100, his Physical Stone, the first
     Legendary core slot, leading one of your team (you choose; it goes to
     storage as his companion) — and the Companions open
     (state.companionsUnlocked). → r5().mkJoined, r5().ending
   ============================================================ */
/* After the fight, where they stand (tiles: an actor's top-left). */
const R5_VE = {
  padrino:{ x:3.7, y:6.95 }, madrina:{ x:2.35, y:6.3 },          // he kneels by his broken machine
  mkS:1.35, mkMid:{ x:4.85, y:4.25 },
  tear:{ cx:5.5, cy:8.15, s:2.9 },                                 // over Cyborg's cradle
  gm:{ x:3.35, y:2.3 }, guard:{ x:2.1, y:1.9, s:1.3 }, guardSlash:{ x:3.45, y:6.1 },
  ninoGM:{ x:3.8, y:3.15 }, ninoMid:{ x:5.0, y:4.35 },
  nemesis:{ x:4.4, y:7.2, s:2.2 }, nemA:{ x:2.5, y:7.35 }, nemW:{ x:6.6, y:7.35 }, nemS:1.9,
  hand:{ w:1.5, h:2.0 },
  padrinoUp:{ x:3.95, y:4.35 }, padrinoHug:{ x:3.7, y:4.55 }, ninoBody:{ x:2.85, y:4.5 }, madrinaUp:{ x:2.0, y:5.15 },
  jaxCage:{ x:6.05, y:5.55 }, fgOut:{ x:5.7, y:2.95, s:1.65 }, fairy:{ x:4.4, y:3.35, s:1.1 },
};
const R5_GM = 'Ghost Master', R5_MADRINA = 'Madrina', R5_JAX = 'Jax', R5_NEMESIS = 'Nemesis', R5_NINO = 'Nino';
const r5GMFace = ()=> faceNpc('ghost_master', '👻');
const r5JaxFace = ()=> faceNpc('rival_padrino', '🧑');
const r5MadrinaFace = ()=> faceNpc('madrina', '👵');
const r5NinoAliveFace = ()=> faceNpc(NINO_BODY, '👦');
/* His face as he is now: crowned, once his core is home. */
function r5WhaleFace(){
  const c = (state.party || []).concat(state.storage || []).find(m=> m && m.species === 'whalelord');
  return faceMon('whalelord', { crowned:!!(c && c.crowned) });
}
function r5SceneDone(){ const w = walkState(); w.busy = false; ui.sceneRunning = false; }
function r5Evolve(list){ return new Promise(done=> playEvolutions(list, done)); }

/* ---------- the chapters, in order ---------- */
async function r5VaultChapters(resumed){
  let first = !!resumed;
  const run = async (st, fn)=>{ if(r5VaultState() === st){ await fn(first); first = false; } };
  await run('won', r5VaultShowcase);
  await run('crowned', r5VaultNemesis);
  await run('nemesis', r5VaultPromise);
  await run('promised', r5VaultFamily);
  if(r5VaultState() === 'after' && !r5().mkJoined) await r5ToFarewell();
}
/* Picked up again where it stopped: on entering the vault. */
async function r5VaultContinue(){
  if(ui.sceneRunning) return;
  ui.sceneRunning = true;
  walkState().busy = true;
  releaseKeys();
  try { await r5VaultChapters(true); }
  finally { r5SceneDone(); }
}

/* ---------- the cores home ---------- */
const R5_CORE_HOME = ['water_dragon_nerfed', 'newt', 'whalelord'];
/* Yours whose cores were stolen, in the designer's order: the Water Dragon,
   the Thunder Newt (if caught), the Whalelord — party or storage. */
function r5CoreHomes(){
  const all = (state.party || []).concat(state.storage || []);
  return R5_CORE_HOME.map(sp=> all.find(m=> m && m.species === sp && coreStolen(m))).filter(Boolean);
}
const R5_CORE_LINES = {
  water_dragon_nerfed:[`<b>"Water Dragon! You hatched with an empty place where your core should be. Here — this one is yours."</b>`,
                       `The Water Dragon throws back its head and roars — a real dragon's roar, for the very first time.`],
  newt:               [`<b>"Thunder Newt. They took yours when you were hurt and all alone. Take it back."</b>`,
                       `Lightning crackles all over the Thunder Newt, and it squeaks with joy.`],
  whalelord:          [`<b>"Whalelord. This one is yours. I would know it anywhere — it hums like the deep sea."</b>`, null],
};
/* Where his arms are, to throw from (tiles). */
function r5MKHands(){
  const el = document.getElementById('sa-mk'), o = el && el._o;
  return o ? { x:o.x + o.w / 2, y:o.y + o.h * 0.62 } : { x:R5_VP.mk.x + 0.7, y:R5_VP.mk.y + 0.85 };
}
async function r5VaultShowcase(resumed){
  const w = walkState(), P = R5_VP;
  const mk = html=> sceneSay([r5MKFace()], R5_MK, html);
  const say = html=> sceneSay([], '', html);
  if(resumed) await say(`Cyborg slumps in its cradle, cracked open and sparking. The Monkey King stands by the door with his arms full of cores, glowing like a bundle of stars.`);
  await mk(`He looks down at the cores in his arms.<br><br><b>"Every one of these was stolen — torn out of a monster that never wanted to give it away."</b>`);
  await mk(`<b>"And some of them belong to monsters who are standing right here."</b> He looks at your team. <b>"Call them out, little one."</b>`);
  const homes = r5CoreHomes();
  w.at.cata_vault = { x:P.ring.x, y:P.ring.y };
  refreshWalk();
  const ids = await r5VaultRing(homes.filter(m=> !(state.party || []).includes(m)));
  await say(`Your whole team comes out around you — the Whalelord first of all.`);
  for(const m of homes) await r5CoreHome(m, ids[m.uid]);
  await r5MKCrown();
  await say(`Your whole team cheers — and by the wall, Nino is smiling.`);
  await r5VaultRingGone();
  w.at.cata_vault = { x:P.you.x, y:P.you.y };
  refreshWalk();
  r5Vault().crowned = true;
  ui.r5MKCrown = false;                              // (the save says so now)
  await saveProfile();
}
/* A core flies from his arms to one of yours; it is crowned. */
async function r5CoreHome(m, aid){
  const el = aid ? document.getElementById('sa-' + aid) : null, o = el && el._o;
  const to = o ? { x:o.x + o.w / 2, y:o.y + o.h * 0.45 } : { x:5.5, y:4.6 };
  const lines = R5_CORE_LINES[m.species] || [`<b>"This one is yours."</b>`, null];
  const cuain = isCuain(m);
  await sceneSay([r5MKFace()], R5_MK, lines[0]);
  r5CoresHeld(true);
  await r5CoreFly(r5MKHands(), to, 1100);
  r5DarkGlow('core-' + aid, to.x, to.y, 2.0, true);
  playSfx('stone_veryhigh');
  if(el) el.classList.add('r5-golden');
  await sceneWait(600);
  if(cuain){
    await sceneSay([faceMon('whalelord')], whaleName(), `He goes very still.<br><br><b>"…Oh."</b>`);
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"I remember. I remember everything — the deep, cold sea, and my mother's song."</b>`);
    await sceneSay([faceMon('whalelord')], whaleName(), `<b>"And my name."</b>`);
  }
  const before = rawMonAtk(m);
  m.crowned = true;
  const grown = growMonster(m);                     // a bar that filled at 100 grows on at once
  m.currentHp = monMaxHp(m);
  const after = rawMonAtk(m);
  /* …and its Max, which waited for its core (moveUnlockedFor) */
  const maxRow = (MOVES[m.species] || []).find(r=> r[0] === 'Max' && r[1] && r[3] !== 'Passive');
  const maxNow = maxRow && moveUnlockedFor(m, maxRow) ? maxRow[1] : null;
  await saveProfile();
  const name = cuain ? whaleName() : displayName(m);
  if(cuain) await sceneSay([r5WhaleFace()], name, `<b>"My name is Cuain."</b>`);
  await r5Evolve([{ uid:m.uid, species:m.species, name, crowned:true, from:m.level, to:m.level, evos:[m.level], newMoves:[],
    headline:`<b>${escapeHtml(name)}</b>'s core has come home!`,
    note:`Crowned: ATK <b>${before} → ${after}</b>. It grows as a legendary now, takes up to <b>10</b> Protein Supplements, and can go on past level ${CROWN_GATE}.` +
         (maxNow ? ` Its Max move is unlocked: <b>${escapeHtml(maxNow)}</b>.` : '') +
         (grown ? ` It grows to <b>Lv ${grown.to}</b> at once.` : '') }]);
  if(el && o){ const sin = el.querySelector('.sa-in'); if(sin) sin.innerHTML = monPortrait(m.species, Math.round(WALK_T * o.w), { view:'front', bare:true, stage:monStage(m), crowned:true }); }
  await sceneGlowOut(['core-' + aid], 600);
  if(el) el.classList.remove('r5-golden');
  if(lines[1]) await sceneSay([], '', lines[1]);
  if(cuain) await sceneSay([r5WhaleFace()], name, `<b>"Thank you, little one. You carried me all this way — and you never even knew my name."</b>`);
}
/* …and last of all, his own: it rises over his head, and is his crown. */
async function r5MKCrown(){
  const el = document.getElementById('sa-mk'), o = el && el._o;
  await sceneSay([r5MKFace()], R5_MK, `<b>"And last of all…"</b><br><br>He holds up one more core — bigger than all the rest, and gold.`);
  await sceneSay([r5MKFace()], R5_MK, `<b>"…mine."</b>`);
  const head = o ? { x:o.x + o.w / 2, y:o.y + o.h * 0.1 } : { x:R5_VP.mk.x + 0.7, y:R5_VP.mk.y + 0.1 };
  await r5CoreFly(r5MKHands(), { x:head.x, y:head.y - 0.35 }, 900, 'gold', 0.4);
  r5DarkGlow('mkcrown', head.x, head.y + 0.3, 2.3, true);
  playSfx('stone_ultra');
  ui.r5MKCrown = true;
  if(el && o){ const sin = el.querySelector('.sa-in'); if(sin) sin.innerHTML = monPortrait('monkey_king', Math.round(WALK_T * o.w), { view:'front', bare:true, stage:1, crowned:true }); el.classList.remove('r5-golden'); }
  await sceneWait(500);
  await r5Evolve([{ uid:'r5-mk', species:'monkey_king', name:R5_MK, crowned:true, from:100, to:100, evos:[100], newMoves:[],
    headline:`The <b>Monkey King</b>'s crown is his again!`,
    note:`The crown his master gave him long ago, with his core's power poured into it. Without it he fought as an elite; with it, as the legend he is.` }]);
  await sceneGlowOut(['mkcrown'], 600);
  await sceneSay([r5MKFace()], R5_MK, `<b>"Ha! HA HA! Now THAT is more like it!"</b>`);
  await sceneSay([r5MKFace()], R5_MK, `He touches the crown, gently.<br><br><b>"My master gave me this, long ago, to teach me to listen. I am still learning."</b>`);
}
/* A core (a little star) on an arc from one point to another (tiles). */
function r5CoreFly(from, to, ms, cls, arc){
  r5EndCss();
  const world = $('#walkWorld'); if(!world) return sceneWait(ms);
  const T = WALK_T, D = 0.42 * T;
  const o = document.createElement('div');
  o.className = 'r5-core-fly' + (cls ? ' ' + cls : '');
  o.style.width = o.style.height = D + 'px';
  o.style.margin = (-D / 2) + 'px 0 0 ' + (-D / 2) + 'px';
  o.style.left = (from.x * T) + 'px'; o.style.top = (from.y * T) + 'px';
  world.appendChild(o);
  const h = arc == null ? 1.2 : arc;
  return r5Tween(ms, t=>{
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    o.style.left = ((from.x + (to.x - from.x) * e) * T) + 'px';
    o.style.top = ((from.y + (to.y - from.y) * e - h * 4 * e * (1 - e)) * T) + 'px';
  }).then(()=> o.remove());
}

/* ---------- Nemesis ---------- */
/* Its pictures (the designer's names, 2026-10-14) — each, until it is there,
   stood in for: the winged one by Cyborg darkened, with black wings; the
   jackal and the cobra by Cyborg in gold and in green; the skeleton in the
   tear by two red eyes; the hand by a hand of bones drawn here. */
const R5_NEM_ART = {
  horus:'assets/mon/nemesis_front.png', anubis:'assets/mon/nemesis_anubis_front.png', wadjet:'assets/mon/nemesis_wadjet_front.png',
  spirit:'assets/mon/nemesis_spirit_front.png', hand:'assets/mon/nemesis_hand.png',
};
function r5NemImg(form, px){
  return `<img src="${R5_NEM_ART[form]}" alt="" class="r5-nem-img" style="width:${px}px;height:${px}px;object-fit:contain;" ` +
    `data-form="${form}" data-px="${px}" onerror="r5NemStandin(this)">`;
}
function r5NemStandin(img){
  const form = img.dataset.form, px = +img.dataset.px || 64;
  const s = document.createElement('span');
  s.className = 'r5-nem-standin ' + form;
  s.style.width = s.style.height = px + 'px';
  if(form === 'hand') s.innerHTML = r5HandSvg();
  else if(form === 'spirit') s.innerHTML = `<span class="r5-spirit-eyes"><i></i><i></i></span>`;
  else s.innerHTML = (form === 'horus' ? r5WingsSvg() : '') + monPortrait('cyborg', px, { view:'front', bare:true, crowned:true });
  img.replaceWith(s);
}
function r5NemFace(){ r5EndCss(); return `<span class="r5-nem-face">${r5NemImg('horus', 64)}</span>`; }
function r5TearFace(){ tearCss(); return `<span style="display:inline-block;width:64px;height:64px;">${tearGalaxy()}</span>`; }
/* black wings, behind the stand-in */
function r5WingsSvg(){
  const wing = d=> `<path d="${d}" fill="#170a1f" stroke="#8a1434" stroke-width="2.2" stroke-linejoin="round"/>`;
  return `<svg class="r5-wings" viewBox="0 0 160 100" preserveAspectRatio="none">
    ${wing('M80 50 C 62 28, 40 12, 4 6 C 16 20, 18 30, 12 40 C 24 40, 28 46, 22 56 C 36 54, 44 60, 42 72 C 56 64, 68 62, 80 64 Z')}
    ${wing('M80 50 C 98 28, 120 12, 156 6 C 144 20, 142 30, 148 40 C 136 40, 132 46, 138 56 C 124 54, 116 60, 118 72 C 104 64, 92 62, 80 64 Z')}
  </svg>`;
}
/* a gigantic hand of bones, reaching down (turned over on the deck, to reach
   up out of the tear) */
function r5HandSvg(){
  const bone = (d, w)=> `<path d="${d}" fill="none" stroke="#3a0618" stroke-width="${(w + 3.2).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>` +
                         `<path d="${d}" fill="none" stroke="#efe3cb" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const parts = [
    ['M42 0 L45 40', 7], ['M60 0 L57 40', 7],                                   // the two long bones of the arm
    ['M40 48 L60 48', 9], ['M38 56 L62 56', 8],                                 // the wrist
    ['M36 60 L28 86', 5], ['M45 61 L42 90', 5], ['M54 61 L56 90', 5], ['M62 60 L68 86', 5],   // the palm
    ['M28 88 L23 104 L20 116 L19 126', 4.2], ['M42 92 L40 110 L39 123 L39 134', 4.2],
    ['M56 92 L58 110 L59 123 L60 133', 4.2], ['M68 88 L74 103 L77 114 L79 123', 4],             // four fingers
    ['M34 58 L18 72 L10 86 L6 96', 4.4],                                                         // and a thumb
  ];
  const joints = [[28,87],[42,91],[56,91],[68,87],[23,104],[40,110],[58,110],[74,103],[20,116],[39,123],[59,123],[77,114],[18,72],[10,86]]
    .map(([x, y])=> `<circle cx="${x}" cy="${y}" r="3.3" fill="#efe3cb" stroke="#3a0618" stroke-width="1.5"/>`).join('');
  return `<svg viewBox="0 0 100 140" width="100%" height="100%" style="display:block;overflow:visible;">${parts.map(([d, w])=> bone(d, w)).join('')}${joints}</svg>`;
}
/* The tear: the galaxy (16-tear.js), with something in the dark of it. */
function r5TearActor(cx, cy, s, opening){
  tearCss(); r5EndCss();
  const px = Math.round(WALK_T * s * 0.6);
  const el = r5HtmlActor('tear', cx - s / 2, cy - s / 2, s, s,
    `<div class="r5-tear">${tearGalaxy()}<div class="r5-tear-spirit">${r5NemImg('spirit', px)}</div></div>`, 14);
  if(el && opening){
    const t = el.querySelector('.r5-tear');
    t.style.transform = 'scale(1, .04)';
    void t.offsetWidth;
    t.style.transition = `transform ${900 * SCENE_SPEED}ms cubic-bezier(.2,.8,.3,1)`;
    t.style.transform = 'scale(1, 1)';
  }
  return el;
}
function r5TearSpirit(on){ const s = document.querySelector('#sa-tear .r5-tear-spirit'); if(s) s.classList.toggle('on', !!on); }
/* Its burning sword, twice across the air: two streaks of purple fire. */
async function r5Slash(cx, cy){
  r5EndCss();
  const world = $('#walkWorld'); if(!world) return;
  const T = WALK_T;
  for(const a of [-32, 32]){
    const s = document.createElement('div');
    s.className = 'r5-slash';
    s.style.left = ((cx - 1.7) * T) + 'px'; s.style.top = (cy * T) + 'px'; s.style.width = (3.4 * T) + 'px';
    s.style.transform = `rotate(${a}deg) scaleX(0)`;
    world.appendChild(s);
    void s.offsetWidth;
    s.style.transition = `transform ${170 * SCENE_SPEED}ms ease-out, opacity ${500 * SCENE_SPEED}ms ease ${350 * SCENE_SPEED}ms`;
    s.style.transform = `rotate(${a}deg) scaleX(1)`;
    s.style.opacity = '0';
    playSfx('rip');
    sceneShake(240, t=> 0.09 * Math.max(0, 1 - t / 240));
    setTimeout(()=> s.remove(), 1000 * SCENE_SPEED + 50);
    await sceneWait(330);
  }
}
/* The Ghost Master, and her Guardian (purple fire — or, `kind` 'blaze', its
   fire flaring with Nemesis's, drawn over the stopped time). */
function r5GMActor(x, y, fadeMs){
  const el = sceneActor('gm', { x, y, w:1, h:1, src:'assets/npc/ghost_master.png', icon:'👻' });
  if(el && fadeMs){ el.style.transition = 'none'; el.style.opacity = '0'; void el.offsetWidth; el.style.transition = `opacity ${fadeMs * SCENE_SPEED}ms ease`; el.style.opacity = '1'; }
  return el;
}
function r5VaultGuard(x, y, kind, fadeMs){
  const s = R5_VE.guard.s, px = Math.round(WALK_T * s);
  const el = r5MonActor('gguard', 'ghost_guardian', x, y, s, { html:monPortrait('ghost_guardian', px, { view:'front', bare:true, stage:1, crowned:true }), z:44 });
  if(!el) return null;
  r5Css();
  el.classList.add('r5-guard');
  el.classList.toggle('blaze', kind === 'blaze');
  if(kind === 'blaze') el.style.zIndex = 68;          // above the stopped time: it is Nemesis's
  if(fadeMs){ el.style.transition = 'none'; el.style.opacity = '0'; void el.offsetWidth; el.style.transition = `opacity ${fadeMs * SCENE_SPEED}ms ease`; el.style.opacity = '1'; }
  return el;
}
/* The hill's grudge: its ghosts, from every side of the room, round and
   round into the tear like water down a drain. */
function r5GrudgeSpiral(cx, cy, n, ms){
  r5Css();
  const world = $('#walkWorld'); if(!world) return sceneWait(ms);
  const T = WALK_T;
  const kinds = R5_HILL_GHOSTS.length ? R5_HILL_GHOSTS : ['ghost'];
  const box = document.createElement('div');
  box.className = 'r5-pour'; box.id = 'r5Grudge';
  world.appendChild(box);
  const lag = 0.55;
  const items = Array.from({ length:n }, (_, i)=>{
    const sp = kinds[i % kinds.length], s = 0.5 + Math.random() * 0.4, px = Math.round(s * T);
    const el = document.createElement('div');
    el.className = 'r5-pg';
    el.style.width = el.style.height = px + 'px';
    el.innerHTML = monPortrait(sp, px, { view:'front', bare:true, stage:hauntStage(sp) });
    box.appendChild(el);
    return { el, s, a0:Math.random() * Math.PI * 2, R0:4.6 + Math.random() * 1.6,
             turn:(1.1 + Math.random() * 0.9) * Math.PI * 2, delay:i / n * lag };
  });
  return r5Tween(ms, t=>{
    items.forEach(it=>{
      const u = Math.max(0, Math.min(1, (t - it.delay) / (1 - lag)));
      const r = it.R0 * Math.pow(1 - u, 1.25), a = it.a0 + it.turn * u;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.85;
      it.el.style.left = ((x - it.s / 2) * T) + 'px'; it.el.style.top = ((y - it.s / 2) * T) + 'px';
      it.el.style.opacity = u <= 0 ? '0' : String(Math.min(1, u * 8, (1 - u) * 5));
      it.el.style.transform = `scale(${(1 - 0.75 * u).toFixed(3)})`;
    });
  }).then(()=> box.remove());
}
/* The hand: out of the tear (its wrist in it), up to (x, y) — its fingers'
   ends, tiles. */
function r5HandTo(x, y, ms){
  const H = R5_VE.hand;
  return r5MoveActor('hand', x - H.w / 2, y, ms);
}
function r5HandOut(){
  r5EndCss();
  const E = R5_VE, H = E.hand;
  const el = r5HtmlActor('hand', E.tear.cx - H.w / 2, E.tear.cy - H.h * 0.55, H.w, H.h,
    `<div class="r5-hand">${r5NemImg('hand', Math.round(WALK_T * H.h))}</div>`, 62);
  if(el){ el.style.opacity = '0'; void el.offsetWidth; el.style.transition = `opacity ${500 * SCENE_SPEED}ms ease`; el.style.opacity = '1'; }
  return el;
}
/* Black smoke over the machine. */
function r5Miasma(on){
  r5EndCss();
  const world = $('#walkWorld'); if(!world) return;
  let m = document.getElementById('r5Miasma');
  if(!on){ if(m){ m.style.transition = `opacity ${800 * SCENE_SPEED}ms ease`; m.style.opacity = '0'; setTimeout(()=> m.remove(), 900 * SCENE_SPEED); } return; }
  const P = R5_VP.cyborg, T = WALK_T, D = 3.2;
  if(!m){ m = document.createElement('div'); m.id = 'r5Miasma'; m.className = 'r5-miasma'; world.appendChild(m); }
  m.style.left = ((P.x + P.s / 2 - D / 2) * T) + 'px'; m.style.top = ((P.y + P.s * 0.55 - D / 2) * T) + 'px';
  m.style.width = m.style.height = (D * T) + 'px';
  m.style.opacity = '0'; void m.offsetWidth;
  m.style.transition = `opacity ${900 * SCENE_SPEED}ms ease`; m.style.opacity = '1';
}
/* Three shapes in the cradle at once — then the winged one. */
async function r5NemesisForms(){
  const E = R5_VE, T = WALK_T, S = SCENE_SPEED;
  sceneActorGone('cyborg');
  const c = r5HtmlActor('nemesis', E.nemesis.x, E.nemesis.y, E.nemesis.s, E.nemesis.s, r5NemImg('horus', Math.round(T * E.nemesis.s)), 19);
  if(c) c.classList.add('r5-nem', 'r5-pop');
  const sides = [['nemA', 'anubis', E.nemA], ['nemW', 'wadjet', E.nemW]];
  sides.forEach(([id, form])=>{
    const el = r5HtmlActor(id, E.nemesis.x + 0.15, E.nemesis.y + 0.15, E.nemS, E.nemS, r5NemImg(form, Math.round(T * E.nemS)), 18);
    if(el){ el.classList.add('r5-nem'); el.style.opacity = '0'; actorFace(el, id === 'nemW'); }
  });
  playSfx('stone_veryhigh');
  await sceneWait(250);
  sides.forEach(([id, , a])=>{
    const el = document.getElementById('sa-' + id); if(!el) return;
    el.style.transition = `left ${700 * S}ms cubic-bezier(.2,.8,.3,1), top ${700 * S}ms cubic-bezier(.2,.8,.3,1), opacity ${500 * S}ms ease`;
    el.style.left = (a.x * T) + 'px'; el.style.top = (a.y * T) + 'px'; el.style.opacity = '.95';
  });
  await sceneWait(800);
}
async function r5NemesisFold(){
  const E = R5_VE, T = WALK_T, S = SCENE_SPEED;
  ['nemA', 'nemW'].forEach(id=>{
    const el = document.getElementById('sa-' + id); if(!el) return;
    el.style.transition = `left ${600 * S}ms ease-in, top ${600 * S}ms ease-in, opacity ${600 * S}ms ease-in`;
    el.style.left = ((E.nemesis.x + 0.15) * T) + 'px'; el.style.top = ((E.nemesis.y + 0.15) * T) + 'px'; el.style.opacity = '0';
  });
  playSfx('core_blast');
  await sceneWait(650);
  sceneActorGone('nemA'); sceneActorGone('nemW');
}
/* A leap that stops in the air (time stopped). */
function r5LeapFreeze(id, x, y, ms, up, stopAt){
  const el = document.getElementById('sa-' + id);
  if(!el || !el._o) return sceneWait(ms * stopAt);
  const T = WALK_T, x0 = el._o.x, y0 = el._o.y;
  const at = t=> ({ x:x0 + (x - x0) * t, y:y0 + (y - y0) * t - up * 4 * t * (1 - t) });
  actorFace(el, x > x0);
  el.style.transition = 'none';
  return r5Tween(ms * stopAt, u=>{ const p = at(u * stopAt); el.style.left = (p.x * T) + 'px'; el.style.top = (p.y * T) + 'px'; })
    .then(()=>{ const p = at(stopAt); el._o.x = p.x; el._o.y = p.y; });
}
/* Time stops: a purple sphere from (cx, cy) over the whole room — every
   picture in it greys and stills (only Nemesis and its tear move) — and
   (on = false) it shrinks away again. */
async function r5TimeStop(on, cx, cy){
  r5EndCss();
  const world = $('#walkWorld'); if(!world) return;
  const T = WALK_T;
  if(on){
    playSfx('timestop');
    const W = world.offsetWidth || 11 * T, H = world.offsetHeight || 11 * T;
    const X = cx * T, Y = cy * T, R = Math.hypot(Math.max(X, W - X), Math.max(Y, H - Y)) + T;
    const s = document.createElement('div');
    s.id = 'r5TimeSphere'; s.className = 'r5-timesphere';
    s.style.left = (X - R) + 'px'; s.style.top = (Y - R) + 'px'; s.style.width = s.style.height = (2 * R) + 'px';
    s.style.transform = 'scale(.02)';
    world.appendChild(s);
    void s.offsetWidth;
    s.style.transition = `transform ${1500 * SCENE_SPEED}ms cubic-bezier(.15,.75,.35,1)`;
    s.style.transform = 'scale(1)';
    await sceneWait(650);
    world.classList.add('r5-frozen');
    await sceneWait(900);
  } else {
    world.classList.remove('r5-frozen');
    const s = document.getElementById('r5TimeSphere');
    if(s){
      s.style.transition = `transform ${900 * SCENE_SPEED}ms ease-in, opacity ${900 * SCENE_SPEED}ms ease-in`;
      s.style.transform = 'scale(.02)'; s.style.opacity = '0';
      await sceneWait(900);
      s.remove();
    }
  }
}
/* …and it goes up into the tear. */
async function r5NemesisGo(){
  const E = R5_VE, T = WALK_T, S = SCENE_SPEED;
  const el = document.getElementById('sa-nemesis');
  if(el){
    el.classList.remove('r5-pop');
    el.style.transition = `left ${1600 * S}ms ease-in, top ${1600 * S}ms ease-in, opacity ${1600 * S}ms ease-in, transform ${1600 * S}ms ease-in`;
    el.style.left = ((E.tear.cx - E.nemesis.s / 2) * T) + 'px'; el.style.top = ((E.tear.cy - E.nemesis.s / 2) * T) + 'px';
    el.style.transform = 'scale(.12) rotate(220deg)'; el.style.opacity = '0';
  }
  playSfx('rewind');
  await sceneWait(1700);
  sceneActorGone('nemesis');
  r5TearSpirit(false);
}
/* …and its Guardian after it (3.21: bound to it — it moves in the stopped
   time too, in its colours). */
async function r5GuardGo(){
  const E = R5_VE, T = WALK_T, S = SCENE_SPEED;
  const el = document.getElementById('sa-gguard');
  if(el){
    el.style.transition = `left ${1500 * S}ms ease-in, top ${1500 * S}ms ease-in, opacity ${1500 * S}ms ease-in, transform ${1500 * S}ms ease-in`;
    void el.offsetWidth;
    el.style.left = ((E.tear.cx - E.guard.s / 2) * T) + 'px'; el.style.top = ((E.tear.cy - E.guard.s / 2) * T) + 'px';
    el.style.transform = 'scale(.12) rotate(-160deg)'; el.style.opacity = '0';
  }
  await sceneWait(1600);
  sceneActorGone('gguard');
}
async function r5VaultNemesis(resumed){
  const w = walkState(), P = R5_VP, E = R5_VE;
  const mk = html=> sceneSay([r5MKFace()], R5_MK, html);
  const say = html=> sceneSay([], '', html);
  const gm = html=> sceneSay([r5GMFace()], R5_GM, html);
  const pa = html=> sceneSay([r5PadrinoFace()], R5_PADRINO, html);
  const whale = html=> sceneSay([r5WhaleFace()], whaleName(), html);
  const nem = html=> sceneSay([r5NemFace()], R5_NEMESIS, html);
  if(resumed) await say(`The Monkey King stands by the door, his crown shining, the last of the cores in his arms.`);
  /* 1. the rest of the cores: home, to the heirs of the monsters they were torn from */
  await r5MoveActor('mk', E.mkMid.x, E.mkMid.y, 900);
  actorFaceToward('mk', P.you.x + 0.5);
  await mk(`<b>"The rest of these belong to monsters who are gone now."</b><br><br>He holds them close.`);
  await mk(`<b>"But their children are still out there — on islands all across the sea. I will take every one of these home, to the children and grandchildren of the monsters they were stolen from."</b>`);
  /* 2. the Ghost Master runs in, her Guardian at her shoulder — and sees Nino */
  r5GMActor(5, 0.85, 400);
  await r5MoveActor('gm', E.gm.x, E.gm.y, 900);
  actorFaceToward('gm', E.padrino.x + 0.5);
  r5VaultGuard(E.guard.x, E.guard.y, null, 700);
  await say(`Running footsteps on the stairs — and the Ghost Master bursts in. Her Ghost Guardian floats at her shoulder, its sword burning purple.`);
  await gm(`<b>"Great-uncle! I felt something terrible, all the way up in the tower. What is happening down here?"</b>`);
  actorFaceToward('gguard', E.mkMid.x + 0.7);
  await say(`Her Guardian stands very still. It is staring at the cores in the Monkey King's arms. For the first time ever, it is not watching her.`);
  await r5MoveActor('nino', E.ninoGM.x, E.ninoGM.y, 900);
  actorFaceToward('nino', E.gm.x + 0.5);
  actorFaceToward('gm', E.ninoGM.x + 0.5);
  await gm(`She stops. She stares.<br><br><b>"…Nino?"</b>`);
  await gm(`<b>"I can see you. I can SEE you! Twenty years we searched this hill for you. Why could I never see you before?"</b>`);
  actorFaceToward('nino', E.guard.x + 0.6);
  await sceneSay([r5NinoFace()], '', `Nino points at the Guardian. He looks frightened.`);
  await gm(`She listens.<br><br><b>"He says the Guardian was always in the way. It never let me see him — or hear him."</b>`);
  await gm(`<b>"He says — Great-uncle, get away from it! It isn't ours! It never was!"</b>`);
  /* 3. too late: the Guardian tears the air open behind Cyborg */
  await r5MoveActor('gguard', E.guardSlash.x, E.guardSlash.y, 700);
  await gm(`<b>"Guardian? Guardian, what are you doing? STOP! I command you!"</b>`);
  await r5Slash(E.tear.cx, E.tear.cy);
  r5TearActor(E.tear.cx, E.tear.cy, E.tear.s, true);
  await sceneWait(900);
  r5MoveActor('gguard', E.guard.x, E.guard.y, 700);
  await say(`The Guardian slashes the air behind Cyborg with its burning sword — once, twice — and the air itself tears open: a hole into blackness, swirling purple.`);
  await r5Dread(2400);
  await mk(`He goes very still.<br><br><b>"That cold. Now I know it. I would know it anywhere."</b>`);
  await mk(`<b>"The Bone Demon!"</b>`);
  r5TearSpirit(true);
  await say(`Deep in the hole, something huge stirs: a great skull of bones, with eyes as red as fire.`);
  /* 4. the hill's grudge pours into it */
  const pour = r5GrudgeSpiral(E.tear.cx, E.tear.cy, 44, 4200);
  sceneShake(4200, ms=> 0.07 * Math.sin(Math.PI * Math.min(1, ms / 4200)));
  await sceneWait(1300);
  await say(`Out of every crack in the walls, the angry ghosts of the hill come pouring — hundreds of them — and the hole drinks them in, round and round, like water down a drain.`);
  await pour;
  await whale(`<b>"All the anger of every monster the Family ever hurt… It is feeding on it!"</b>`);
  /* 5. the hand: the cores out of his arms — and, with three of its own, into Cyborg */
  r5HandOut();
  await sceneWait(400);
  const arms = r5MKHands();
  await r5HandTo(arms.x, arms.y - 0.25, 900);
  await say(`Then, out of the hole, reaches a hand — a gigantic hand, made all of bones.`);
  const palm = ()=>{ const h = document.getElementById('sa-hand'), o = h && h._o; return o ? { x:o.x + o.w / 2, y:o.y + o.h * 0.3 } : arms; };
  r5CoresHeld(false);
  playSfx('hit_taken');
  for(let k = 0; k < 6; k++) r5CoreFly(arms, palm(), 450 + k * 70, null, 0.2);
  r5LeapActor('mk', E.mkMid.x + 0.6, E.mkMid.y - 0.7, 320, 0.3, false);
  await sceneWait(700);
  await mk(`<b>"NO—!"</b>`);
  await say(`It snatches the cores out of the Monkey King's arms — every last one.`);
  const cy = { x:P.cyborg.x + P.cyborg.s / 2, y:P.cyborg.y + P.cyborg.s * 0.5 };
  await r5HandTo(cy.x, cy.y - 1.2, 900);
  await say(`It opens over Cyborg. In its palm, with the stolen cores, lie three more, older than all the rest: one shaped like a cobra, one like a jackal, and one as black as night.`);
  ['gold', 'gold', 'gold', 'cobra', 'jackal', 'black'].forEach((c, k)=> r5CoreFly(palm(), cy, 500 + k * 90, c === 'gold' ? null : c, 0.15));
  playSfx('core_blast');
  r5Sparks(null);
  r5Miasma(true);
  await sceneWait(900);
  { const h = document.getElementById('sa-hand'); if(h){ h.style.transition = `opacity ${700 * SCENE_SPEED}ms ease`; h.style.opacity = '0'; } }
  await say(`It pushes them all into the broken machine — and thick black smoke pours out of Cyborg, all over it.`);
  sceneActorGone('hand');
  /* 6. Nemesis: three shapes, then the winged one */
  await r5NemesisForms();
  r5Miasma(false);
  await say(`Cyborg stands up. It is not broken any more. Three shapes stand in its cradle at once: one with a jackal's head, one with great black wings, and one with a cobra's hood.`);
  await r5NemesisFold();
  await say(`Then the three fold back into one: a black machine with great black wings, and eyes that burn red.`);
  /* (3.21, the designer: "guardian remains bound to nemesis and disappears
     with him") its fire flares with its master's — it is Nemesis's, not hers */
  r5VaultGuard(E.guard.x, E.guard.y, 'blaze');
  await say(`Beside the Ghost Master, the Guardian's sword blazes up — purple and red, like the black machine's eyes. It is not looking at her at all.`);
  await gm(`<b>"Guardian…?"</b>`);
  await pa(`He scrambles back from it.<br><br><b>"Cyborg? What is this? I never told you to do this!"</b>`);
  /* 7. the Monkey King leaps at it — and time stops */
  await mk(`<b>"Not again! Not while I still stand!"</b>`);
  await r5LeapFreeze('mk', E.nemesis.x + 0.3, E.nemesis.y - 0.2, 760, 1.2, 0.55);
  await r5TimeStop(true, E.nemesis.x + E.nemesis.s / 2, E.nemesis.y + E.nemesis.s / 2);
  await say(`A purple bubble bursts out of the black machine and spreads over the whole room — and everything stops.`);
  await say(`The Monkey King hangs in the air, in the middle of his leap. Nobody can move a finger. Not even you.`);
  /* 8. Nemesis, in the stopped time (the designer's speech; and, so the boys
     see it without being told, who made Nino sick, whose voice said a core
     would cure him, and who found the fire that burned the Monkey King) */
  await nem(`<b>"Hush, now. Time is mine."</b>`);
  await nem(`<b>"Hello again, Monkey King. It has been a long, long time."</b>`);
  await nem(`<b>"And Padrino. Thank you — for everything you have done for me."</b>`);
  await pa(`<b>"…Who are you?"</b>`);
  await nem(`<b>"I am Nemesis. Long ago, they called me the Bone Demon."</b>`);
  await nem(`<b>"For a hundred years I have lived inside your Family's Guardian, whispering to your Family — every one of them. And they listened."</b>`);
  await nem(`<b>"Your little brother was never meant to be sick, Padrino. I made him sick."</b>`);
  await nem(`<b>"It was my voice — through the Guardian — that told your sister only a monster's core could make him well."</b>`);
  await nem(`<b>"It was I who sent you the dreams: a tower full of ghost-catchers and mind-readers, and a machine that could turn back time."</b>`);
  await nem(`<b>"And it was I who found you the monster with the white fire — the fire that burned the Monkey King's eyes."</b>`);
  await nem(`<b>"Every core you took, you took for me. You did so very well."</b>`);
  await pa(`<b>"No… No. Nino…"</b>`);
  await nem(`<b>"Oh, do not cry. I keep my word. Your Guardian loved your Family — and a little of that love was mine, too."</b>`);
  await nem(`<b>"You wished for your brother. There he lies: his body, whole again. Now I owe you nothing."</b>`);
  await nem(`<b>"And you, little king. Long ago, you and your friends beat me. Do you remember?"</b>`);
  await nem(`<b>"Then your master — that monk, Tang Seng — put that crown on your head, and you bowed it. All the cores in the world, there for the taking, and you never took a single one."</b>`);
  await nem(`<b>"So you stood still. And I grew."</b>`);
  await nem(`<b>"Bringing back that boy, and mending this machine, cost me much of my strength. I will rest a while, in my rift."</b>`);
  await nem(`<b>"But I will be back. And next time, nobody will stand in my way."</b>`);
  await nem(`<b>"Come, Guardian. You were always mine."</b>`);
  /* 9. it goes into the tear — and its Guardian with it, bound to it to the
     last (3.21); time runs again */
  await Promise.all([r5NemesisGo(), r5GuardGo()]);
  await say(`Nemesis rises into the tear — and the Guardian goes with it, up from the Ghost Master's side, after its master. Both of them are gone.`);
  await r5TimeStop(false);
  await r5LeapActor('mk', E.nemesis.x + 0.2, E.nemesis.y - 0.95, 420, 0.25, false);
  sceneShake(420, t=> 0.1 * Math.max(0, 1 - t / 420));
  await say(`Time runs again. The Monkey King lands — on nothing at all. Nemesis is gone — and Cyborg, and the Ghost Master's Guardian with it.`);
  actorFaceToward('gm', E.tear.cx);
  await gm(`She stares at the empty air at her shoulder.<br><br><b>"My Guardian… It went with that thing. It was always there, ever since I was little."</b>`);
  actorFaceToward('mk', P.you.x + 0.5);
  await mk(`He stares at the hole in the air.<br><br><b>"Gone. Nemesis — the Bone Demon. My friends and I beat it once, long ago. I thought it was gone forever."</b>`);
  await whale(`<b>"That cold under the island… It was Nemesis, all along."</b>`);
  await whale(`<b>"And that Guardian was never really yours. Nemesis bound it to itself long ago — and it has gone with its master."</b>`);
  await r5MoveActor('mk', P.mk.x, P.mk.y, 900);
  actorFace('mk', false);
  const r = r5();
  r.tearOpen = true;
  r5Vault().nemesis = true;
  await saveProfile();
}

/* ---------- the promise, and the Forest Guardian ---------- */
function r5NinoAlive(x, y){
  const el = sceneActor('ninoAlive', { x, y, w:1, h:1, src:`assets/npc/${NINO_BODY}.png`, icon:'👦', z:20 });
  if(el) el.classList.add('r5-alive');
  return el;
}
async function r5VaultPromise(resumed){
  const P = R5_VP, E = R5_VE;
  const say = html=> sceneSay([], '', html);
  const pa = html=> sceneSay([r5PadrinoFace()], R5_PADRINO, html);
  const gm = html=> sceneSay([r5GMFace()], R5_GM, html);
  const gd = html=> sceneSay([r5GuardianFace()], R5_GUARDIAN, html);
  const md = html=> sceneSay([r5MadrinaFace()], R5_MADRINA, html);
  const nino = html=> sceneSay([r5NinoAliveFace()], R5_NINO, html);
  const mk = html=> sceneSay([r5MKFace()], R5_MK, html);
  const whale = html=> sceneSay([r5WhaleFace()], whaleName(), html);
  if(resumed) await say(`The hole in the air hangs over Cyborg's empty cradle, humming. Nemesis is gone — and Cyborg with it.`);
  /* everyone can see Nino now */
  await r5MoveActor('nino', E.ninoMid.x, E.ninoMid.y, 1100);
  { const ni = document.getElementById('sa-nino'); if(ni) ni.classList.add('r5-bright'); }
  await say(`Nino floats out into the middle of the room. With Nemesis gone, he shines brighter than ever — and everyone in the room can see him. Even the Padrino.`);
  const pe = document.getElementById('sa-padrino');
  if(pe) pe.classList.remove('r5-kneel');
  await r5MoveActor('padrino', E.padrinoUp.x, E.padrinoUp.y, 1200);
  actorFaceToward('padrino', E.ninoMid.x + 0.5);
  actorFaceToward('nino', E.padrinoUp.x + 0.5);
  await pa(`<b>"…Nino?"</b>`);
  await pa(`He reaches out — and his hand goes straight through his little brother.<br><br><b>"Nino. It really is you."</b>`);
  actorFaceToward('gm', E.ninoMid.x + 0.5);
  await gm(`She listens.<br><br><b>"He says… 'Big brother. It was never your fault.'"</b>`);
  await pa(`<b>"Everything I did — every core, every year — I did for you. And that thing was pulling my strings the whole time."</b>`);
  await gm(`<b>"He says he can come back. He can live again — in that body, on the table."</b>`);
  await gm(`<b>"But only if you make him a promise. No more hurting monsters. Never again. Not the living, and not the dead."</b>`);
  /* he still hates her — so it is Nino he swears to (decision 4) */
  actorFaceToward('padrino', P.cage.x + P.cage.w / 2);
  await pa(`He turns, and glares at the cage.<br><br><b>"And her? She could have saved you, Nino. She said NO."</b>`);
  await gd(`<b>"Nothing could have saved him, child. Not while that creature lived in your house."</b>`);
  await pa(`<b>"Be quiet! I will never forgive you. Never!"</b>`);
  await whale(`<b>"He still hates her. But this promise is not for her. It is for Nino."</b>`);
  actorFaceToward('padrino', E.ninoMid.x + 0.5);
  if(pe) pe.classList.add('r5-kneel');
  await pa(`He kneels down in front of his little brother.<br><br><b>"Nino. I promise you."</b>`);
  await pa(`<b>"From today, the Family will not hurt monsters. Not one. Living or dead."</b>`);
  await say(`Nino puts his small hand on top of his brother's big one.`);
  await pa(`<b>"I swear it."</b>`);
  /* Nino steps into his body */
  await say(`Nino smiles. He walks to the table — and steps into the boy lying there.`);
  await r5MoveActor('nino', P.body.x, P.body.y - 0.1, 1300);
  { const ni = document.getElementById('sa-nino'); if(ni){ ni.style.transition = `opacity ${500 * SCENE_SPEED}ms ease`; ni.style.opacity = '0'; } }
  sceneGlow('ninohome', P.body.x + 0.5, P.body.y + 0.55, 1.8, 21);
  playSfx('stone_ultra');
  await sceneWait(500);
  await sceneFlash(300, 350, ()=>{ sceneActorGone('nino'); sceneActorGone('body'); r5NinoAlive(E.ninoBody.x, E.ninoBody.y); }, 700);
  await sceneGlowOut(['ninohome'], 600);
  actorFaceToward('ninoAlive', E.padrinoUp.x + 0.5);
  await say(`The boy's eyes open — bright, and warm. He sits up, and climbs down from the table.`);
  await nino(`<b>"Big brother. …I'm home."</b>`);
  if(pe) pe.classList.remove('r5-kneel');
  await r5MoveActor('padrino', E.padrinoHug.x, E.padrinoHug.y, 700);
  actorFaceToward('padrino', E.ninoBody.x + 0.5);
  await say(`The Padrino runs to him and holds him tight — and does not let go for a long, long time.`);
  await nino(`<b>"Brother, the ghosts never wanted revenge. Not really."</b>`);
  await nino(`<b>"They only wanted you to stop hurting monsters."</b>`);
  await r5MoveActor('madrina', E.madrinaUp.x, E.madrinaUp.y, 900);
  actorFaceToward('madrina', E.ninoBody.x + 0.5);
  await md(`<b>"My little brothers. Both of them. Together again."</b>`);
  await whale(`<b>"That body was the one good thing that machine ever made."</b>`);
  /* the Forest Guardian: let out */
  await mk(`He looks at the cage.<br><br><b>"Padrino. A promise is a promise."</b>`);
  await pa(`He does not look at her.<br><br><b>"…Jax. Let her out."</b>`);
  await r5MoveActor('jax', E.jaxCage.x, E.jaxCage.y, 900);
  actorFaceToward('jax', P.cage.x + 1);
  r5CageActor(true);
  playSfx('hit_dealt');
  await say(`Jax unlocks the cage, and its iron door swings open.`);
  await r5MoveActor('guardian', E.fgOut.x, E.fgOut.y, 1300);
  r5LeavesFall(E.fgOut.x, E.fgOut.y, E.fgOut.s, 2600, 10);
  await say(`The Forest Guardian steps out. Her leaves are falling, one by one, like autumn.`);
  await gd(`<b>"Thank you, child."</b><br><br>The Padrino turns his back on her.`);
  await r5GuardianGift();
  /* your team, whole */
  (state.party || []).forEach(m=>{ if(m && !isSeed(m) && !isEgg(m)) m.currentHp = monMaxHp(m); });
  if(typeof restCompanions === 'function') restCompanions();
  sceneGlow('greenheal', R5_VP.you.x + 0.5, R5_VP.you.y + 0.5, 3.4, 40);
  playSfx('recovery_heal');
  await say(`A warm green light washes over your whole team. Every one of your monsters is whole again.`);
  await sceneGlowOut(['greenheal'], 700);
  r5Vault().promised = true;
  await saveProfile();
}
/* The rest of her power, to your Forest Fairy — and she fades away. */
async function r5GuardianGift(){
  const E = R5_VE, f = r5Fairy();
  const gd = html=> sceneSay([r5GuardianFace()], R5_GUARDIAN, html);
  const say = html=> sceneSay([], '', html);
  const whale = html=> sceneSay([r5WhaleFace()], whaleName(), html);
  const fg = { x:E.fgOut.x + E.fgOut.s / 2, y:E.fgOut.y + E.fgOut.s * 0.5 };
  if(f){
    const s = E.fairy.s, px = Math.round(WALK_T * s);
    const el = r5MonActor('fairy', 'forest_fairy', E.fairy.x, E.fairy.y, s, { html:monPortrait('forest_fairy', px, { view:'front', bare:true, stage:monStage(f), crowned:isCrowned(f) }), z:46 });
    if(el){ el.classList.add('r5-pop'); actorFaceToward(el, fg.x); }
    actorFaceToward('guardian', E.fairy.x + s / 2);
    playSfx('answer_correct');
    await gd(`<b>"Little one. Come here."</b>`);
    await r5FairySay(`<b>"…Forest Guardian?"</b>`);
    await gd(`<b>"Long ago, when you were only a seed, I gave you my core."</b>`);
    await gd(`<b>"Now I give you the rest of me. Everything I have left."</b>`);
    const to = { x:E.fairy.x + s / 2, y:E.fairy.y + s * 0.5 };
    r5Beam('gift', fg.x, fg.y, to.x, to.y, 'gift');
    r5DarkGlow('gift', to.x, to.y, 2.1, true);
    sceneSparkles(E.fairy.x, E.fairy.y, s, s, 1600);
    playSfx('stone_ultra');
    state.forestBlessingGranted = true;
    await saveProfile();
    await sceneWait(1500);
    r5BeamGone('gift');
    await r5GiftCard(f);
    await sceneGlowOut(['gift'], 600);
    await gd(`<b>"Grow strong, little one. Protect them — as they protected you."</b>`);
  } else {
    state.forestBlessingGranted = true;
    await saveProfile();
    await gd(`She smiles at you.<br><br><b>"Look after each other, little ones."</b>`);
  }
  /* she fades, like leaves on the wind */
  r5LeavesFall(E.fgOut.x, E.fgOut.y, E.fgOut.s, 2600, 26, true);
  { const g = document.getElementById('sa-guardian'); if(g){ g.style.transition = `opacity ${2400 * SCENE_SPEED}ms ease`; g.style.opacity = '0'; } }
  await sceneWait(2500);
  sceneActorGone('guardian');
  await say(`And she fades away, like leaves blown on the wind.`);
  if(f){
    await r5FairySay(`<b>"…Goodbye. Thank you."</b>`);
    await whale(`<b>"She is not gone, little one. She is in you now — and in every tree of her grove."</b>`);
    const el = document.getElementById('sa-fairy');
    if(el){ el.style.transition = `opacity ${500 * SCENE_SPEED}ms ease`; el.style.opacity = '0'; }
    await sceneWait(500);
    sceneActorGone('fairy');
  }
}
/* What the gift is, mechanics first, with her own numbers. */
function r5GiftCard(f){
  const G = FOREST_GIFT, atk = rawMonAtk(f);
  const rows = MOVES.forest_fairy || [];
  const giga = rows.find(r=> r[1] === 'Giga Drain'), og = rows.find(r=> r[1] === 'Overgrowth');
  const ogLv = og ? og[5] : null, has = !!og && (f.level || 1) >= ogLv;
  const step = Math.round(G.step * 100);
  return r5Card(monPortrait('forest_fairy', 96, { view:'front', bare:true, stage:monStage(f), crowned:isCrowned(f) }), `The Forest Guardian's gift`,
    `<p><b>${escapeHtml(displayName(f))}</b> holds the rest of the Forest Guardian's power. Two of her moves change for good:</p>` +
    `<p>🌿 <b>Giga Drain</b> now hits <b>every enemy</b> at <b>${G.drain}× her ATK</b>${giga ? ` (it hit one, at ${giga[2]}×)` : ''} — and drinks ` +
    `<b>${Math.ceil(G.drainEach * atk)} HP</b> (${G.drainEach}× her ATK) for <b>each</b> enemy it reaches: three of them, three drinks. ` +
    `Each drink goes to her first, then to whoever of yours is worst off.</p>` +
    `<p>🌿 <b>Overgrowth</b> is now a <b>passive</b>${has || ogLv == null ? '' : ` (when she learns it, at Lv ${ogLv})`}: once a turn while she is on the field, ` +
    `you may write <b>${G.words} words</b> you know to 🥈 silver or 🥇 gold — or skip. Both right: your <b>whole team's ATK +${step}%</b> for the rest ` +
    `of the battle, up to <b>${G.maxStacks} times (+${step * G.maxStacks}%)</b>. Their Diamond Dust can't sweep it away. And every time it comes ` +
    `round — written, missed or skipped — she heals <b>${Math.round(G.regen * 100)}%</b> (<b>${Math.ceil(monMaxHp(f) * G.regen)} HP</b>).</p>`, 'Continue');
}
/* Falling leaves round someone (tiles); `away`, blown off to the right and up. */
function r5LeavesFall(x, y, s, ms, n, away){
  const world = $('#walkWorld'); if(!world) return;
  r5EndCss();
  const T = WALK_T;
  const leaves = Array.from({ length:n }, ()=>{
    const l = document.createElement('i');
    l.className = 'r5-leaf';
    l.style.width = (0.2 * T) + 'px'; l.style.height = (0.1 * T) + 'px';
    world.appendChild(l);
    return { l, x0:x + Math.random() * s, y0:y + Math.random() * s * 0.8, d:Math.random() * 0.4,
             dx:away ? 1.5 + Math.random() * 2.5 : (Math.random() - 0.5) * 0.8, dy:away ? -(0.8 + Math.random() * 1.8) : 0.6 + Math.random() * 0.7,
             spin:(Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360) };
  });
  r5Tween(ms, t=>{
    leaves.forEach(L=>{
      const u = Math.max(0, Math.min(1, (t - L.d) / (1 - L.d)));
      L.l.style.left = ((L.x0 + L.dx * u + Math.sin(u * 7) * 0.12) * T) + 'px';
      L.l.style.top = ((L.y0 + L.dy * u) * T) + 'px';
      L.l.style.transform = `rotate(${(L.spin * u).toFixed(0)}deg)`;
      L.l.style.opacity = u <= 0 ? '0' : String(Math.min(1, u * 6, (1 - u) * 3));
    });
  }).then(()=> leaves.forEach(L=> L.l.remove()));
}
/* A card over everything, until Continue. */
function r5Card(emblem, title, html, button){
  r5EndCss();
  return new Promise(done=>{
    const ov = document.createElement('div');
    ov.className = 'refine-scrim r5-card-scrim';
    ov.innerHTML = `<div class="refine-card r5-card">
        ${emblem ? `<div class="r5-card-emblem">${emblem}</div>` : ''}
        <div class="refine-name">${escapeHtml(title)}</div>
        <div class="r5-card-body">${html}</div>
        <button class="btn btn-primary" id="r5CardGo">${button || 'Continue'}</button>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#r5CardGo').addEventListener('click', ()=>{ ov.remove(); done(); });
  });
}

/* ---------- the Family, after ---------- */
async function r5VaultFamily(resumed){
  const E = R5_VE;
  const say = html=> sceneSay([], '', html);
  const pa = html=> sceneSay([r5PadrinoFace()], R5_PADRINO, html);
  const gm = html=> sceneSay([r5GMFace()], R5_GM, html);
  const jax = html=> sceneSay([r5JaxFace()], R5_JAX, html);
  const nino = html=> sceneSay([r5NinoAliveFace()], R5_NINO, html);
  if(resumed) await say(`Nino stands beside his big brother, holding his hand tight.`);
  await r5MoveActor('jax', E.padrinoUp.x + 1.7, E.padrinoUp.y + 0.6, 900);
  actorFaceToward('jax', E.padrinoHug.x + 0.5);
  actorFaceToward('padrino', E.padrinoUp.x + 1.7);
  await pa(`He stands up, with Nino's hand in his, and looks at Jax and the Ghost Master.<br><br><b>"Jax. And you, my dear."</b>`);
  await pa(`<b>"The Family is yours now. Keep it strong."</b>`);
  await jax(`<b>"Ours. And we'll do things differently."</b>`);
  await gm(`<b>"No Guardian whispering in our ears any more — from now on, we choose for ourselves. And no more hurting monsters. That's Nino's rule now."</b>`);
  await jax(`<b>"Nino's rule."</b> He grins. <b>"…Mostly."</b>`);
  await pa(`<b>"As for me — I have a little brother to look after. And a whole world to show him."</b>`);
  await nino(`<b>"The whole world? Can we go on a boat?"</b>`);
  await pa(`For the first time, the Padrino laughs.<br><br><b>"The biggest boat in the harbour."</b>`);
  r5Vault().family = true;
  await saveProfile();
}

/* ---------- the harbour: goodbye — and the Monkey King ---------- */
/* On the pier (tiles, an actor's top-left): you, the Whalelord, the Monkey
   King beside you; Nino, the Padrino and the Madrina; their little boat, off
   the pier's west side. */
const R5_FW = {
  you:{ x:4, y:34 }, ghost:{ x:4, y:33 }, mk:{ x:5.0, y:33.75 }, mkS:1.25,
  nino:{ x:4.05, y:35.25 }, padrino:{ x:4.95, y:35.2 }, madrina:{ x:4.5, y:36.1 },
  boat:{ x:1.35, y:35.75, w:2.6, h:1.7 },
  aboard:{ nino:{ x:1.75, y:35.95 }, padrino:{ x:2.5, y:35.85 }, madrina:{ x:2.1, y:36.15 } },
};
function r5FarewellDue(){ const r = r5(); return !!(r.vault && r.vault.family && !r.mkJoined); }
/* From the vault: the curtain, the next morning, the pier. */
async function r5ToFarewell(){
  await sceneCurtain(true, 1000);
  sceneClear();
  r5Sparks(null);
  await sceneCurtainText('The next morning…', 700);
  await sceneWait(1400);
  await sceneCurtainText('', 400);
  r5FarewellPlace();
  go('harbour');
  walkState().busy = true;
  await sceneWait(500);
  await r5FarewellRun();
}
function r5FarewellPlace(){
  const w = walkState(), F = R5_FW;
  w.at = w.at || {}; w.at.harbour = { x:F.you.x, y:F.you.y }; w.face = 'd';
  w.ghostAt = w.ghostAt || {}; w.ghostAt.harbour = { x:F.ghost.x, y:F.ghost.y };
  ui.walkFresh = false;
  ui.currentZone = r5Zone('harbour') || ui.currentZone;
}
/* Picked up again at the harbour, if the app was closed before the end. */
async function r5FarewellStart(){
  if(ui.sceneRunning || !r5FarewellDue()) return;
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  try {
    await sceneCurtain(true, 600);
    r5FarewellPlace();
    refreshWalk();
    await r5FarewellRun();
  } finally { r5SceneDone(); }
}
function r5BoatSvg(){
  return `<svg class="r5-boat" viewBox="0 0 120 80" width="100%" height="100%" style="display:block;overflow:visible;">
    <path d="M60 4 L60 52" stroke="#5a3a1e" stroke-width="3"/>
    <path d="M63 8 L98 46 L63 46 Z" fill="#f4efe2" stroke="#b9ad92" stroke-width="1.5"/>
    <path d="M57 12 L34 42 L57 42 Z" fill="#ece3cf" stroke="#b9ad92" stroke-width="1.5"/>
    <path d="M60 3 L75 7 L60 11 Z" fill="#c8453a"/>
    <path d="M4 50 L116 50 L101 74 L19 74 Z" fill="#8a5a32" stroke="#4a2e16" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M9 57 L111 57 M14 65 L106 65" stroke="#6e4524" stroke-width="2"/>
  </svg>`;
}
async function r5FarewellRun(){
  const F = R5_FW, T = WALK_T, S = SCENE_SPEED;
  const say = html=> sceneSay([], '', html);
  const pa = html=> sceneSay([r5PadrinoFace()], R5_PADRINO, html);
  const md = html=> sceneSay([r5MadrinaFace()], R5_MADRINA, html);
  const nino = html=> sceneSay([r5NinoAliveFace()], R5_NINO, html);
  const whale = html=> sceneSay([r5WhaleFace()], whaleName(), html);
  r5EndCss();
  const boat = r5HtmlActor('boat', F.boat.x, F.boat.y, F.boat.w, F.boat.h, r5BoatSvg(), 16);
  const npc = (id, sprite, a, icon)=> sceneActor(id, { x:a.x, y:a.y, w:1, h:1, src:`assets/npc/${sprite}.png`, icon, z:22 });
  npc('fnino', NINO_BODY, F.nino, '👦'); npc('fpadrino', 'padrino2', F.padrino, '🕴️'); npc('fmadrina', 'madrina', F.madrina, '👵');
  r5MonActor('mk', 'monkey_king', F.mk.x, F.mk.y, F.mkS, { html:monPortrait('monkey_king', Math.round(T * F.mkS), { view:'front', bare:true, stage:1, crowned:true }), z:30 });
  actorFace('mk', false);
  playMusicChain(['r5_ending', 'zone_harbour', 'region5']);
  if(document.getElementById('sceneCurtain')) await sceneCurtain(false, 900);
  await say(`Down at the harbour, early in the morning, a little boat is waiting at the end of the pier.`);
  await pa(`<b>"We are going to see the world — all three of us. Somewhere far away, where nobody has ever heard of the Family."</b>`);
  await md(`She takes your hands in hers.<br><br><b>"Thank you, child. For bringing my brothers home."</b>`);
  await nino(`He waves and waves.<br><br><b>"Bye! Thank you for following me!"</b>`);
  /* aboard, and away */
  for(const [id, k] of [['fmadrina', 'madrina'], ['fpadrino', 'padrino'], ['fnino', 'nino']]){
    r5MoveActor(id, F.aboard[k].x, F.aboard[k].y, 700);
    await sceneWait(260);
  }
  await sceneWait(600);
  await say(`They climb down into the little boat, and the Padrino takes the oars.`);
  const who = ['boat', 'fnino', 'fpadrino', 'fmadrina'].map(id=> document.getElementById('sa-' + id)).filter(Boolean);
  who.forEach(el=>{
    el.style.transition = `left ${3600 * S}ms ease-in, top ${3600 * S}ms ease-in, opacity ${3600 * S}ms ease-in`;
    void el.offsetWidth;
    el.style.left = (((el._o ? el._o.x : 0) - 5) * T) + 'px';
    el.style.top = (((el._o ? el._o.y : 0) + 2.2) * T) + 'px';
    el.style.opacity = '0';
  });
  await sceneWait(1800);
  await whale(`<b>"Look at him. A little boy again — with his whole life ahead of him."</b>`);
  await sceneWait(400);
  ['boat', 'fnino', 'fpadrino', 'fmadrina'].forEach(sceneActorGone);
  await r5MKJoins();
}
/* "Alone, I could not stop it. Together, maybe we can." — he joins you, and
   (3.21, the designer: "he teaches the player about the companion system")
   teaches you companions as he does: what a core shared is, whom he leads
   (you choose), calling it out and its turn, its rest and the recharge meter,
   core slots and his spars, and where it all is. Every number is the game's
   own (COMPANION, CORE_SLOT_DEF, SPAR_COUNT). */
async function r5MKJoins(){
  const mk = html=> sceneSay([r5MKFace()], R5_MK, html);
  const me = html=> sceneSay([facePlayer()], state.name || 'You', html);
  const whale = html=> sceneSay([r5WhaleFace()], whaleName(), html);
  const C = COMPANION;
  /* he asks */
  await mk(`He watches the little boat until it is gone.<br><br><b>"Well, little one."</b>`);
  await mk(`<b>"Nemesis is out there somewhere, beyond that tear — with Cyborg, and every core it took. It will be back."</b>`);
  await mk(`<b>"For thousands of years I fought alone. I thought that was what made me strong."</b>`);
  await mk(`<b>"Then along came a child, and a team of monsters who trust each other — and together, you did what I never could."</b>`);
  await mk(`<b>"Alone, I could not stop Nemesis. Together… maybe we can."</b>`);
  await sceneSay([r5MKFace()], R5_MK, `<b>"So, little one — may I come with you?"</b>`, '🐒 Yes!');
  await me(`<b>"Yes! Welcome to the team, Monkey King!"</b>`);
  await whale(`<b>"Welcome, Monkey King. Now we are all together."</b>`);
  await mk(`<b>"Ha! Then I come as I truly am — crowned, and stronger than ever."</b>`);
  await mk(`<b>"And do not bother feeding me Protein Supplements. I have eaten so many over the centuries that not one more will fit!"</b>`);
  /* the lesson: a core, shared */
  await mk(`<b>"Now listen closely, little one. Here is how we will fight together."</b>`);
  await mk(`<b>"Every monster has a core — not only the legendaries. Every single one."</b>`);
  await mk(`<b>"A monster that trusts you completely will share its core with another of your team. Whoever holds that core can call its owner out, to fight right beside it. We call that a <u>companion</u>."</b>`);
  await mk(`<b>"Holding another's core takes great focus. That is why a companion can only stay out for a short while."</b>`);
  await mk(`<b>"I will hold the core of one of your team. It will rest in storage — but in a fight, it is never far away."</b>`);
  await mk(`<b>"Choose who it will be. You can always change it later."</b>`);
  const partner = await r5ChoosePartner();
  const m = r5MKJoin(partner);
  await saveProfile();
  playSfx('stone_ultra');
  sceneSparkles(R5_FW.mk.x, R5_FW.mk.y, R5_FW.mkS, R5_FW.mkS, 1200);
  /* …and how a companion fights — said with his partner beside him */
  const pn = partner ? escapeHtml(displayName(partner)) : '';
  const two = partner
    ? (html=> sceneSay([r5MKFace(), faceMon(partner.species, { stage:monStage(partner), crowned:isCrowned(partner) })], R5_MK, html))
    : mk;
  if(partner) await two(`<b>"${pn}! We will make a fine pair, you and I."</b>`);
  await two(`<b>"In a fight, look for the button with ${partner ? `${pn}'s` : 'its'} face on it: <u>Summon${partner ? ` ${pn}` : ''}</u>. Write ${C.summonWords} words, and out it comes — and you still get your own turn!"</b>`);
  await two(`<b>"It stays out for ${C.turns} turns, and it gets turns of its own. On its turn, choose any of its moves and write ${C.turnWords} words. All ${C.turnWords} must be right, or its whole turn fails!"</b>`);
  await two(`<b>"After ${C.turns} turns it goes back into my core, to rest. Fill the recharge meter, and you can call it out again — up to ${C.maxSummons} times in one fight."</b>`);
  await two(`<b>"If it falls, it is out for the rest of that fight. But if I fall while it is out, it fights on for me until its turns are over!"</b>`);
  await two(`<b>"It starts every fight with full health. And it learns from every fight we win — even resting in storage."</b>`);
  /* core slots, and his spars */
  await mk(`<b>"Only a crowned monster can hold another's core — and it needs a core slot to hold it in. There are four kinds: Wild, Starter, Elite and Legendary."</b>`);
  await mk(`<b>"A Wild slot holds only a wild monster's core. A Starter slot holds a starter's or a wild one's — and so on, up to Legendary, which holds anyone's. That one is mine!"</b>`);
  await mk(`<b>"Your other crowned monsters can learn slots too — Wild first, then up, one at a time. And I will be the one to train them!"</b>`);
  await mk(`<b>"You must win ${SPAR_COUNT} spars against me, one after another. Your monster fights me alone, with a companion it borrows just for the spar. You choose one of three — and I take one of the other two!"</b>`);
  await mk(`<b>"You need the slot's medals to start, but you only pay them when all ${SPAR_COUNT} are won. Lose one, and it costs you nothing but a little practice."</b>`);
  await mk(`<b>"It is all on the Party page — 🤝 Companions. Choose there who holds whose core, as often as you like. It costs nothing."</b>`);
  await mk(`<b>"Strength in numbers. That is what you taught me, little one. Now let me teach it back. Ha!"</b>`);
  { const el = document.getElementById('sa-mk'); if(el){ el.style.transition = `opacity ${600 * SCENE_SPEED}ms ease`; el.style.opacity = '0'; } }
  await sceneWait(600);
  sceneActorGone('mk');
  await r5Card(monPortrait('monkey_king', 110, { view:'front', bare:true, stage:1, crowned:true }), 'The Monkey King joins your team!', r5JoinHtml(m, partner), 'Continue');
  await r5Card(`<span style="display:inline-block;width:96px;height:96px;">${(tearCss(), tearGalaxy())}</span>`, 'The end of Region 5',
    `<p>Cyborg is gone: Nemesis took it into the <b>space-time tear</b>, with every core it stole. The tear stays open in the vault, over the empty cradle, humming.</p>` +
    `<p>🌀 There you can <b>Challenge the past</b> once a week — the Padrino's fight again, seven rounds, for medals and the Mind Stone. (It is on the Challenge page too.)</p>` +
    `<p>Beyond the tear — and Nemesis — lies <b>Region 6</b>. It is still to come.</p>`, 'The end — for now');
}
/* Who he leads: one of your team (it goes to storage, as his companion). */
function r5ChoosePartner(){
  const opts = (state.party || []).filter(m=> m && !isFixedMember(m) && !coreStolen(m) && m.species !== 'monkey_king');
  if(!opts.length) return Promise.resolve(null);
  r5EndCss();
  return new Promise(done=>{
    const ov = document.createElement('div');
    ov.className = 'refine-scrim r5-card-scrim';
    ov.innerHTML = `<div class="refine-card r5-card r5-pick">
        <div class="refine-name">Who will the Monkey King lead?</div>
        <div class="r5-card-body"><p>He holds its core: it rests in storage as his <b>companion</b>, and in battle you call it out beside him. ` +
        `He takes its place in your team. You can change it any time — Party → 🤝 Companions.</p></div>
        <div class="r5-pick-list">${opts.map((m, i)=> `<button class="btn btn-ghost r5-pick-opt" data-i="${i}" data-uid="${escapeHtml(m.uid)}" data-sp="${m.species}">
            ${monPortrait(m.species, 40, { stage:monStage(m), crowned:isCrowned(m) })}
            <span><b>${escapeHtml(displayName(m))}</b> · Lv ${m.level}</span></button>`).join('')}</div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelectorAll('.r5-pick-opt').forEach(b=> b.addEventListener('click', ()=>{ ov.remove(); done(opts[+b.dataset.i]); }));
  });
}
/* He joins (part 6 §12, "The Monkey King joins"): crowned, Lv 100, carrying
   his own Physical Stone, with the very first Legendary core slot, leading
   the one you chose — which leaves the party for his core — and the
   Companions open. There is only ever one of him: a save that has him
   already keeps that one. */
function r5MKJoin(partner){
  const r = r5();
  const all = (state.party || []).concat(state.storage || []);
  let mk = all.find(m=> m && m.species === 'monkey_king');
  if(r.mkJoined && mk) return mk;
  if(!mk) mk = newMonster('monkey_king', 100);
  mk.nickname = mk.nickname || R5_MK;
  mk.crowned = true;
  mk.supplements = Math.max(mk.supplements || 0, proteinCap('monkey_king', mk));
  mk.coreSlot = 'legendary';
  mk.currentHp = monMaxHp(mk);
  state.storage = state.storage || [];
  state.storage = state.storage.filter(m=> m !== mk);
  const inParty = state.party.includes(mk);
  const i = partner ? state.party.indexOf(partner) : -1;
  if(i >= 0){
    if(inParty) state.party.splice(i, 1); else state.party[i] = mk;
    state.storage.push(partner);
    delete partner.companionUid;
    state.party.concat(state.storage).forEach(x=>{ if(x !== mk && x.companionUid === partner.uid) delete x.companionUid; });
    mk.companionUid = partner.uid;
  } else if(!inParty) state.party.push(mk);
  addStone('physicalStone', 1);
  attachStone('physicalStone', mk);
  ['caughtSpecies', 'encounteredSpecies'].forEach(k=>{ state[k] = state[k] || []; if(!state[k].includes('monkey_king')) state[k].push('monkey_king'); });
  state.companionsUnlocked = true;
  r.mkJoined = true;
  r.ending = true;
  return mk;
}
/* His card, after the lesson: what he brings, and companions in short — for
   whoever reads it again later. */
function r5JoinHtml(mk, partner){
  const pn = partner ? escapeHtml(displayName(partner)) : '';
  const C = COMPANION;
  const price = pr=> Object.entries(pr).map(([cur, n])=> `${curIcon(cur)} ${n}`).join(' + ');
  const slots = CORE_SLOTS.map(t=> `${CORE_SLOT_DEF[t].label} ${price(CORE_SLOT_DEF[t].price)}`).join('; ');
  return `<p>He comes in at <b>level ${mk.level}, crowned</b>, with his protein full (<b>${mk.supplements || 0} of ${proteinCap(mk.species, mk)}</b>) — ` +
    `ATK <b>${rawMonAtk(mk)}</b>, HP <b>${monMaxHp(mk)}</b> — and he can grow on past level ${CROWN_GATE}. <b>Heavensplitter Max</b> is his.</p>` +
    `<p>👊 He carries his own <b>Physical Stone</b> — the first there is: he learns <b>1.5×</b> as fast.</p>` +
    `<p>🤝 The very first <b>Legendary core slot</b>: he can hold the core of any monster.${partner ? ` <b>${pn}</b> is his companion.` : ''}</p>` +
    `<p><b>Companions, in short.</b> Summon: <b>${C.summonWords} words</b>, no turn spent. Out for <b>${C.turns} turns</b>, with its own turn: any of its moves for ` +
    `<b>${C.turnWords} words</b> (all right, or the turn fails). Then back into the core, until the recharge meter wakes it — <b>${C.maxSummons}</b> summons a fight. ` +
    `Full health every fight; it learns from every fight; it stands in if its leader falls.</p>` +
    `<p><b>Core slots</b> — crowned monsters only; a slot holds its own kind of core or lower — trained in ${SPAR_COUNT} spars with the Monkey King, paid when all are won: ${slots}.</p>` +
    `<p>All of it: the Party page — <b>🤝 Companions</b>.</p>`;
}

/* ---------- looks (3.20) ---------- */
let _r5EndCssDone = false;
function r5EndCss(){
  if(_r5EndCssDone || typeof document === 'undefined') return;
  _r5EndCssDone = true;
  const st = document.createElement('style');
  st.id = 'r5EndCss';
  st.textContent = `
  .r5-core-fly{ position:absolute; border-radius:50%; pointer-events:none; z-index:72;
    background:radial-gradient(circle, #fff 0%, #ffeaa8 40%, rgba(255,190,60,0) 72%); box-shadow:0 0 10px 3px rgba(255,210,110,.8); }
  .r5-core-fly.gold{ background:radial-gradient(circle, #fff 0%, #ffe27a 38%, rgba(255,170,30,0) 72%); box-shadow:0 0 16px 6px rgba(255,200,60,.95); }
  .r5-core-fly.cobra{ background:radial-gradient(circle, #f4ffe0 0%, #7fd35a 40%, rgba(40,120,40,0) 72%); box-shadow:0 0 10px 3px rgba(120,220,90,.85); }
  .r5-core-fly.jackal{ background:radial-gradient(circle, #fff6e0 0%, #d9a441 40%, rgba(120,70,20,0) 72%); box-shadow:0 0 10px 3px rgba(220,170,70,.85); }
  .r5-core-fly.black{ background:radial-gradient(circle, #2a0010 0%, #120008 45%, rgba(120,0,40,0) 72%); box-shadow:0 0 12px 4px rgba(200,20,60,.9); }
  .r5-slash{ position:absolute; height:10px; margin-top:-5px; transform-origin:50% 50%; border-radius:5px; pointer-events:none; z-index:66; opacity:1;
    background:linear-gradient(90deg, rgba(190,120,255,0), #c98bff 18%, #fff 50%, #c98bff 82%, rgba(190,120,255,0)); box-shadow:0 0 14px 5px rgba(170,90,255,.85); }
  .r5-tear{ position:relative; width:100%; height:100%; filter:drop-shadow(0 0 10px rgba(150,80,240,.7)); }
  .r5-tear .tear-svg{ display:block; }
  .r5-tear-spirit{ position:absolute; left:20%; top:20%; width:60%; height:60%; display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity 1.2s ease; filter:drop-shadow(0 0 8px rgba(255,40,70,.85)); pointer-events:none; }
  .r5-tear-spirit.on{ opacity:.85; }
  .r5-tear-spirit img, .r5-tear-spirit .r5-nem-standin{ width:100% !important; height:100% !important; object-fit:contain; }
  .r5-spirit-eyes{ display:flex; gap:22%; width:100%; height:100%; align-items:center; justify-content:center; }
  .r5-spirit-eyes i{ display:block; width:13%; height:9%; border-radius:50%; background:#ff3a52;
    box-shadow:0 0 8px 4px rgba(255,40,70,.9), 0 0 18px 8px rgba(160,0,40,.6); animation:r5Flicker 1.3s ease-in-out infinite; }
  .r5-hand{ width:100%; height:100%; transform:rotate(180deg); filter:drop-shadow(0 0 7px rgba(200,30,70,.85)) drop-shadow(0 0 16px rgba(120,40,200,.55)); }
  .r5-hand img, .r5-hand .r5-nem-standin{ width:100% !important; height:100% !important; object-fit:contain; display:block; }
  .r5-miasma{ position:absolute; border-radius:50%; pointer-events:none; z-index:20; opacity:0;
    background:radial-gradient(circle, rgba(0,0,0,.92) 0%, rgba(22,0,22,.86) 30%, rgba(76,10,64,.5) 52%, rgba(20,0,30,0) 72%);
    animation:r5Flicker 1.1s ease-in-out infinite; }
  .scene-actor.r5-nem .sa-in{ filter:drop-shadow(0 0 8px rgba(220,30,60,.75)) drop-shadow(0 0 18px rgba(110,30,180,.55)); }
  .r5-nem-standin{ position:relative; display:inline-flex; align-items:flex-end; justify-content:center; }
  .r5-nem-standin > img, .r5-nem-standin > .crowned-wrap{ position:relative; z-index:1; }
  .r5-nem-standin.horus > img, .r5-nem-standin.horus > .crowned-wrap{ filter:brightness(.3) contrast(1.6) saturate(.4) drop-shadow(0 0 5px rgba(255,40,60,.95)); }
  .r5-nem-standin.anubis > img, .r5-nem-standin.anubis > .crowned-wrap{ filter:sepia(1) hue-rotate(-12deg) saturate(2.2) brightness(.42) contrast(1.4) drop-shadow(0 0 5px rgba(255,190,60,.8)); }
  .r5-nem-standin.wadjet > img, .r5-nem-standin.wadjet > .crowned-wrap{ filter:sepia(1) hue-rotate(65deg) saturate(2.6) brightness(.42) contrast(1.4) drop-shadow(0 0 5px rgba(90,230,120,.8)); }
  .r5-nem-standin .r5-wings{ position:absolute; left:-30%; top:-12%; width:160%; height:96%; z-index:0; }
  .r5-nem-face{ display:inline-block; line-height:0; filter:drop-shadow(0 0 5px rgba(220,30,60,.7)); }
  .r5-timesphere{ position:absolute; border-radius:50%; pointer-events:none; z-index:64;
    background:radial-gradient(circle, rgba(130,70,220,.16) 0%, rgba(120,60,210,.22) 64%, rgba(215,170,255,.75) 69.6%, rgba(130,70,220,.35) 70.4%, rgba(130,70,220,0) 71%);
    -webkit-backdrop-filter:grayscale(1) brightness(.8); backdrop-filter:grayscale(1) brightness(.8); }
  #walkWorld.r5-frozen *{ animation-play-state:paused !important; }
  #walkWorld.r5-frozen #sa-nemesis, #walkWorld.r5-frozen #sa-nemesis *, #walkWorld.r5-frozen #sa-tear, #walkWorld.r5-frozen #sa-tear *,
  #walkWorld.r5-frozen #sa-gguard, #walkWorld.r5-frozen #sa-gguard *{ animation-play-state:running !important; }
  #sa-nemesis{ z-index:70 !important; }
  .scene-actor.r5-guard.blaze .sa-in{ filter:drop-shadow(0 0 8px rgba(255,40,80,.95)) drop-shadow(0 0 18px rgba(150,40,230,.85)) brightness(1.12); transition:filter .6s ease; }
  .scene-actor.r5-bright .sa-in{ filter:drop-shadow(0 0 10px rgba(205,235,255,1)) drop-shadow(0 0 22px rgba(160,210,255,.85)) brightness(1.15); }
  .scene-actor.r5-alive .sa-in{ filter:drop-shadow(0 0 6px rgba(255,236,170,.9)); }
  .r5-beam.gift{ background:linear-gradient(90deg, rgba(120,220,120,0), rgba(150,235,140,.95) 30%, #fff 70%, rgba(200,255,190,.95)); box-shadow:0 0 16px 5px rgba(110,220,110,.75); }
  .r5-leaf{ position:absolute; pointer-events:none; z-index:62; border-radius:50%; background:#6ab35e; box-shadow:inset 0 0 0 1px rgba(30,80,30,.5); opacity:0; }
  .r5-card-scrim{ z-index:86; }
  .r5-card{ max-width:380px; max-height:86vh; overflow-y:auto; }
  .r5-card-emblem{ display:flex; justify-content:center; margin-bottom:2px; }
  .r5-card-body{ text-align:left; font-size:13px; line-height:1.55; margin:10px 0 14px; }
  .r5-card-body p{ margin:0 0 9px; }
  .r5-pick-list{ display:flex; flex-direction:column; gap:8px; }
  .r5-pick-opt{ display:flex; align-items:center; gap:10px; justify-content:flex-start; text-align:left; }
  .evo-learn.evo-note{ font-family:inherit; font-size:13px; font-weight:700; color:var(--ink-soft); max-width:360px; margin:8px auto 0; line-height:1.45; }
  `;
  document.head.appendChild(st);
}

/* ---------- looks ---------- */
let _r5VaultCssDone = false;
function r5VaultCss(){
  if(_r5VaultCssDone || typeof document === 'undefined') return;
  _r5VaultCssDone = true;
  const st = document.createElement('style');
  st.id = 'r5VaultCss';
  st.textContent = `
  .scene-actor.r5-asleep .sa-in{ filter:brightness(.42) saturate(.45); transition:filter .9s ease; }
  .scene-actor.r5-waking .sa-in{ filter:brightness(1.35) drop-shadow(0 0 14px rgba(180,120,255,.95)); transition:filter .9s ease; }
  .scene-actor.r5-awake .sa-in{ filter:drop-shadow(0 0 7px rgba(170,120,255,.8)); }
  .scene-actor.r5-broken .sa-in{ rotate:-9deg; translate:0 6%; filter:brightness(.78) saturate(.6); }
  .scene-actor.r5-golden .sa-in{ filter:drop-shadow(0 0 6px rgba(255,214,90,.95)) drop-shadow(0 0 14px rgba(255,190,40,.6)); }
  .scene-actor.r5-down .sa-in{ rotate:90deg; translate:0 24%; opacity:.6; transition:rotate .18s ease, translate .18s ease, opacity .18s ease; }
  .scene-actor .sa-in{ transition:rotate .25s ease, translate .25s ease, opacity .25s ease; }
  .scene-actor.r5-pop .sa-in{ animation:r5Pop .35s ease-out; }
  @keyframes r5Pop{ 0%{ scale:.2; opacity:0; } 70%{ scale:1.12; opacity:1; } 100%{ scale:1; } }
  .scene-actor.r5-kneel .sa-in{ translate:0 16%; scale:1 .84; }
  .scene-actor.r5-back .sa-in{ filter:brightness(.82); }
  .scene-actor.r5-body .sa-in{ filter:saturate(.8); }
  .scene-actor.r5-cage{ pointer-events:none; }
  .r5-held-cores{ position:absolute; inset:0; pointer-events:none; }
  .r5-held-cores i{ position:absolute; width:16%; height:16%; margin:-8% 0 0 -8%; border-radius:50%;
    background:radial-gradient(circle, #fff 0%, #ffeaa8 42%, rgba(255,190,60,0) 72%); box-shadow:0 0 8px 2px rgba(255,210,110,.7);
    animation:r5CoreGlow 1.8s ease-in-out infinite; }
  @keyframes r5CoreGlow{ 0%,100%{ scale:.85; opacity:.85; } 50%{ scale:1.15; opacity:1; } }
  .r5-beam{ position:absolute; height:12px; margin-top:-6px; transform-origin:0 50%; border-radius:6px; pointer-events:none; z-index:55; opacity:0;
    background:linear-gradient(90deg, rgba(190,140,255,0), rgba(200,150,255,.95) 30%, #fff 70%, rgba(230,210,255,.95));
    box-shadow:0 0 16px 5px rgba(160,100,255,.75); transition:opacity .35s ease; }
  .r5-beam.on{ opacity:1; animation:r5BeamHum .18s linear infinite; }
  .r5-beam.strike{ height:8px; margin-top:-4px; }
  @keyframes r5BeamHum{ 0%,100%{ filter:brightness(1); } 50%{ filter:brightness(1.35); } }
  .r5-stone-fly{ position:absolute; z-index:72; pointer-events:none; filter:drop-shadow(0 0 7px rgba(255,240,180,.95)); }
  .r5-stone-fly img, .r5-stone-fly span{ width:100% !important; height:100% !important; }
  /* in the fight */
  .r5-cyb-form{ position:absolute; pointer-events:none; z-index:6; opacity:0; translate:0 0;
    transition:translate .7s cubic-bezier(.2,.8,.3,1), opacity .6s ease; }
  .r5-cyb-form.past{ filter:sepia(.9) hue-rotate(-15deg) brightness(.82) contrast(1.1); }
  .r5-cyb-form.future{ filter:hue-rotate(150deg) saturate(1.8) brightness(1.25) drop-shadow(0 0 10px rgba(120,230,255,.9)); }
  .r5-cyb-form.out{ opacity:.88; }
  .r5-cyb-form.out.past{ translate:-104% 0; }
  .r5-cyb-form.out.future{ translate:104% 0; }
  .r5-cyb-form.tremble{ animation:r5Tremble .09s linear infinite; }
  @keyframes r5Tremble{ 0%,100%{ transform:translate(0,0); } 25%{ transform:translate(-3px,1px); } 50%{ transform:translate(2px,-2px); } 75%{ transform:translate(3px,2px); } }
  .enemy-card.shattered .avatar-layer{ rotate:-9deg; translate:0 4px; filter:saturate(.7) brightness(.85); }
  .enemy-card.r5-tremble .avatar-layer{ animation:r5Tremble .08s linear infinite; }
  .avatar-layer.r5-twitch, .scene-actor.r5-twitch .sa-in{ margin-left:2px; margin-top:2px; }
  .r5-spark{ position:absolute; inset:0; pointer-events:none; z-index:9; opacity:1; transition:opacity .25s ease; }
  .r5-spark.gone{ opacity:0; }
  .r5-spark path{ stroke-dasharray:1; stroke-dashoffset:1; animation:r5Draw .06s linear forwards; }
  @keyframes r5Draw{ to{ stroke-dashoffset:0; } }
  .r5-spark .sp{ animation:r5SparkFly .32s ease-out forwards; }
  @keyframes r5SparkFly{ to{ transform:translate(var(--dx), var(--dy)); opacity:0; } }
  .scene-actor .r5-spark{ z-index:60; }
  .r5-bbeam{ position:fixed; height:14px; margin-top:-7px; transform-origin:0 50%; border-radius:7px; pointer-events:none; z-index:83; opacity:0;
    background:repeating-linear-gradient(90deg, rgba(150,80,255,.95) 0 14px, rgba(240,220,255,.95) 14px 22px);
    box-shadow:0 0 18px 6px rgba(150,80,255,.7); transition:opacity .3s ease; }
  .r5-bbeam.on{ opacity:1; animation:r5BeamRun .25s linear infinite; }
  @keyframes r5BeamRun{ to{ background-position:22px 0; } }
  .player-card .ally-avatar.r5-leap{ transition:translate .45s cubic-bezier(.3,.8,.4,1); translate:28% -70%; z-index:12; }
  .r5-crack{ position:absolute; transform:translate(-50%,-50%) rotate(-8deg); z-index:12; pointer-events:none;
    font:900 34px/1 'Baloo 2',cursive; color:#fff; text-shadow:0 0 10px #ffd84a, 0 3px 0 #6a3a00; animation:r5CrackIn .5s ease-out; }
  @keyframes r5CrackIn{ 0%{ scale:2.2; opacity:0; } 60%{ scale:.95; opacity:1; } 100%{ scale:1; } }
  .r5-core-orb{ position:fixed; width:16px; height:16px; margin:-8px 0 0 -8px; border-radius:50%; pointer-events:none; z-index:84;
    background:radial-gradient(circle, #fff 0%, #ffe9a8 40%, rgba(255,190,60,0) 72%); box-shadow:0 0 12px 4px rgba(255,210,110,.75); }
  .battle-stage.r5-quake{ animation:r5Tremble .07s linear 9; }
  .r5-whiteout{ position:fixed; inset:0; background:#fff; opacity:0; z-index:96; pointer-events:none; transition:opacity 1.6s ease; }
  .r5-whiteout.on{ opacity:1; }
  `;
  document.head.appendChild(st);
}

/* ============================================================
   THE TOWER (2.92) — the exorcists' tower, inside the estate walls
   Thirteen floors: the ghost disciples and the psychic disciples by turns
   (ghost_disciple1, psychic_disciple1, ghost_disciple2 … ghost_disciple6),
   then the Psychic Master and, at the top, the Ghost Master.
   Who they are: the ghost disciples — a young woman, an old woman, a young
   man, an old man, a very old man, and an old sage in a great Taoist robe;
   the psychic disciples — a teenage boy, a teenage girl, two young men and
   a short young woman. The Psychic Master is a woman, the leader of the
   exorcists' order the Padrino brought over the sea; she answers to the
   Ghost Master — a girl in her late teens, the Padrino's grandniece, and
   the most gifted with ghosts of any of them.
   The uniform does not fool them: the ghost disciples (and their master)
   feel the Whalelord the moment you come in; the psychic ones (and theirs)
   read your thoughts. Every one of them fights you; each stands before the
   stair up and steps aside, for good, once beaten.
   All highly trained: six waves each. A disciple brings 13 to 15 monsters,
   two or three a wave — the ghost disciples all Ghosts, the psychic ones all
   Psychics (a Psychic of yours beats the first, a Physical one the second);
   level the floor's for two waves, then one higher every two, never past
   100 (ENEMY_LEVEL_CAP, 2.99 — it was the region's cap, 110): 98 to 100 on
   floor 1, 99 to 100 on floor 2, and 100 all the way from floor 3, the
   masters' included; AI Power2 for two waves, then Best — (3.16) the
   psychic floors and the Psychic Master think about every move instead
   (ai 'smart', smartMove: "give them good AI"). A master brings
   18, always in threes:
   in the middle of each wave a crowned starter, elite or legendary (10
   supplements), flanked by two monsters with strong passives; AI Best. The
   Psychic Master's last is a crowned Mindcat carrying Discombobulate +, the
   Ghost Master's a crowned Ghost Guardian carrying Curse ✦ (cast on their
   first action, as yours are; 2.97 — they were a crowned Fox and Shadow).
   (2.97) The psychic disciples and the Psychic Master field Tapirs and
   Tailed Cats as well. (3.15) And the fifteen psychics of the floors under
   the villa: the disciples bring the wild ones (and, higher up, an elite or
   two); the Psychic Master's six waves of three are the new elites — the
   designer: "please give psychic master a bunch of these elites in triple
   waves" — crowned Hydra, Steelcrab, Firefox, Mime and Tailed Cat in the
   middle, and the crowned Mindcat last. (3.24–3.25: the Ladybird in the
   Steelcrab's middle; 3.36: the Hermit Sloth in the Firefox's.)
   First wins: +1 protein a disciple; the Psychic Master +3 protein (3.01;
   she gave +2 and the Psychic Stone until 3.00, +2 alone in 3.00); the
   Ghost Master +3 protein — and (3.00) in
   the middle of her ring sits the Fairy Stone, the conduit every mind in the
   tower holds the dead down through: the Whalelord names it, you take it, and
   the hold on the dead breaks (r5HoldBreaks, r5().holdBroken) — every soldato
   in Region 5 fighting ghosts from then on (14-stealth.js guardHaunted).
   Lose, and you keep every floor you have won.
   ============================================================ */
const R5_KNIGHT_T = { species:'goblin_knight', ai:'maxer' };
const R5_CROWNED = (species, extra)=> Object.assign({ species, crowned:true, supplements:10 }, extra || {});
const R5_TOWER = [
  /* 1 — a young woman */
  { sprite:'ghost_disciple1', lv:98,
    waves:[['ghost','crow'], ['ghost_flame','ghost'], ['crow','cyclops'], ['puppet','ghost'], ['ghost_flame','cyclops'], ['goblin','ghost','crow']],
    sees:[`The candles all lean toward you at once. The young woman sitting among them does not even look up.<br><br><b>"A ghost has just come into my tower. A big one — a whale, of all things."</b>`,
          `<b>"And under it, a living child in a soldato's coat. The dead do not follow soldatos about, little one. We feel the dead in here. It is what we are for."</b>`],
    whale:`<b>"...She can feel me. They all can, the ones who talk to the dead."</b>`,
    beaten:`<b>"...Go up, then. And take your whale with you."</b>`,
    talk:`<b>"The stairs are yours. We do not go back on a fight."</b>` },
  /* 2 — a teenage boy */
  { sprite:'psychic_disciple1', lv:99,
    waves:[['tapir','leopard'], ['puffball','squid'], ['moon_swan','quetzal'], ['tapir','psychic_starter'], ['tailed_cat','hermit_sloth'], ['squid','tapir','unicorn']],
    sees:[`A boy not much older than you looks up from his book.<br><br><b>"I heard you coming before you reached the door. Your thoughts are very loud."</b><br><br>` +
          `<b>"'Walk as if you belong here.' That is what you keep telling yourself. A cap hides a face. It does not hide a mind."</b>`],
    beaten:`<b>"Your mind is louder than mine. Go on."</b>`,
    talk:`<b>"Stop thinking so loudly. I am trying to read."</b>` },
  /* 3 — an old woman */
  { sprite:'ghost_disciple2', lv:100,
    waves:[['crow','ghost'], ['goblin','ghost_flame'], ['cyclops','crow'], ['puppet','ghost'], [R5_KNIGHT_T,'ghost_flame'], ['horned_lynx','ghost','goblin']],
    sees:[`An old woman is knitting by the candles. She does not look up either.<br><br><b>"The spirits have been whispering about you all day, dearie — a dead whale, coming up the hill beside a living child."</b>`,
          `<b>"I can feel it at your shoulder now, cold as a cellar. They're ever so excited. I'm not. My knees hurt."</b>`],
    beaten:`<b>"The spirits are laughing at me. Go on, dearie, before they start on you."</b>`,
    talk:`<b>"The spirits still whisper about you. Nicer things, now. Mind the stairs, dearie."</b>` },
  /* 4 — a teenage girl */
  { sprite:'psychic_disciple2', lv:100,
    waves:[['psychic_starter','polygon'], ['moon_swan','nurse'], ['tailed_cat','leopard'], ['quetzal','tapir'], ['squid','unicorn'], ['psychic_starter','tapir','hermit_sloth']],
    sees:[`A girl in a grey coat far too big for her rolls her eyes at you.<br><br><b>"Do not bother pulling the cap down. In here, we read what you are thinking."</b><br><br>` +
          `<b>"You are thinking about the stairs behind me."</b>`],
    beaten:`<b>"I did not see that coming. I always see things coming."</b>`,
    talk:`<b>"You are thinking about lunch. Finally — something normal."</b>` },
  /* 5 — a young man */
  { sprite:'ghost_disciple3', lv:100,
    waves:[['cyclops','ghost_flame'], ['ghost','crow','ghost'], ['horned_lynx','puppet'], ['goblin','cyclops'], ['ghost_flame',R5_KNIGHT_T], ['puppet','horned_lynx','ghost']],
    sees:[`A young man cracks his knuckles.<br><br><b>"I could feel your whale from the floor below — cold, and very angry."</b><br><br>` +
          `<b>"Every ghost in this hill answers to us. Even yours will, before I am finished."</b>`],
    whale:`<b>"I answer to nobody but this child."</b>`,
    beaten:`<b>"Your whale answers to nobody. I see that now."</b>`,
    talk:`<b>"Your whale keeps looking at me. Tell it to stop."</b>` },
  /* 6 — a young man */
  { sprite:'psychic_disciple3', lv:100,
    waves:[['moon_swan','tapir'], ['psychic_starter','squid','nurse'], ['tailed_cat','polygon'], ['unicorn','moon_swan'], ['ram','tapir'], ['seadragon','psychic_starter','leopard']],
    sees:[`A young man in a grey coat smiles without looking up.<br><br><b>"You are thinking that the cap was a good idea. It was not — not in here."</b><br><br>` +
          `<b>"Halfway up already. Most of the Padrino's men never get past the first floor — and they work here."</b>`],
    beaten:`<b>"Halfway. Hm. Perhaps you will get further than halfway."</b>`,
    talk:`<b>"Up. Always up. Do you never get tired?"</b>` },
  /* 7 — an old man */
  { sprite:'ghost_disciple4', lv:100,
    waves:[['ghost','goblin'], ['crow','ghost_flame','ghost'], ['ghost_starter','cyclops'], ['firehound','puppet'], [R5_KNIGHT_T,'horned_lynx'], ['ghost_starter','firehound','goblin']],
    sees:[`An old man leans on his stick and peers at the air over your shoulder.<br><br><b>"Your whale has been floating behind you since the door. In here it is hard to miss — like a cold draught that glares."</b><br><br>` +
          `<b>"Seven floors of us, and still you climb. The dead admire that. So do I — a little."</b>`],
    beaten:`<b>"Seven down. The dead are cheering. I wish they would not."</b>`,
    talk:`<b>"I have stopped holding them down. I can hear them singing."</b>` },
  /* 8 — a young man */
  { sprite:'psychic_disciple4', lv:100,
    waves:[['tapir','puffball'], ['psychic_starter','tailed_cat','quetzal'], ['squid','hermit_sloth'], ['sylph','tapir'], ['plasma_manta','unicorn'], ['tailed_cat','psychic_starter','moon_swan']],
    sees:[`A tall young man taps his temple.<br><br><b>"Your thoughts are racing. Fear?"</b> A frown. <b>"No... you are enjoying this. How strange."</b>`],
    beaten:`<b>"Strange child. Go on up."</b>`,
    talk:`<b>"Strange child. You think about a whale a great deal, you know."</b>` },
  /* 9 — a very old man */
  { sprite:'ghost_disciple5', lv:100,
    waves:[['ghost_flame','puppet'], ['cyclops','ghost','crow'], [R5_KNIGHT_T,'horned_lynx'], ['puppet','ghost_flame','goblin'], ['firehound','cyclops'], ['ghost_starter',R5_KNIGHT_T,'puppet']],
    sees:[`A very, very old man is asleep in his chair. He wakes with a snort.<br><br><b>"Eh? A whale? A WHALE! In my day, ghosts were the size of a cat."</b>`,
          `<b>"And an old fire on you, too — a phoenix's. I remember that bird. I was young then. Almost as young as you. The dead of this hill remember it too."</b>`],
    seesPlain:[`A very, very old man is asleep in his chair. He wakes with a snort.<br><br><b>"Eh? A whale? A WHALE! In my day, ghosts were the size of a cat."</b>`,
               `<b>"And it smells of the catacombs. You came up through the dead, the pair of you — and they let you."</b>`],
    beaten:`<b>"That fire burns hotter than I thought. Hotter than my knees, anyway."</b>`,
    beatenPlain:`<b>"The dead let you through, and so must I. Now let me sleep."</b>`,
    talk:`<b>"Mind the stairs. They are older than the town. Older than me, even. Just."</b>` },
  /* 10 — a short young woman */
  { sprite:'psychic_disciple5', lv:100,
    waves:[['tailed_cat','tapir'], ['mime','squid','polygon'], ['firefox','nurse'], ['tapir','steelcrab','leopard'], ['moon_swan','psychic_starter'], ['hydra','tapir','unicorn']],
    sees:[`A young woman, a head shorter than you would expect, folds her arms.<br><br>` +
          `<b>"You are counting the floors in your head — three more — and wondering what is at the top. Your thoughts are very easy to read."</b>`,
          `<b>"And now you are thinking I am short. I am not short. I am concentrated."</b><br><br>` +
          `<b>"Only one of us above me, and then the masters. And then nothing at all — only the sky."</b>`],
    beaten:`<b>"Only the masters now. And then the sky."</b>`,
    talk:`<b>"The masters will be waiting. They always are."</b>` },
  /* 11 — an old sage, in a great Taoist robe */
  { sprite:'ghost_disciple6', lv:100,
    waves:[['ghost_starter','crow'], ['ghost','puppet','cyclops'], ['firehound','horned_lynx'], [R5_KNIGHT_T,'ghost_flame','goblin'], ['puppet','firehound'], ['ghost_starter','horned_lynx',R5_KNIGHT_T]],
    sees:[`An old man in a great Taoist robe sits cross-legged in the middle of the ring, his wide sleeves spread around him on the floor like folded wings.<br><br>` +
          `<b>"The whale behind you has gone quiet. Even the dead fall silent before what waits upstairs."</b>`,
          `<b>"Above me are the masters: the one who leads our order, and the young mistress she answers to. They will not be gentle. ` +
          `Turn back, child. I am telling you this as a kindness."</b>`],
    beaten:`<b>"The river does not argue with the stone. It goes round it, and on. Go on, then."</b>`,
    talk:`<b>"One candle is easily blown out. Many candles together make a fire. Your whale knows this."</b>` },
  /* 12 — the Psychic Master: the leader of the exorcists' order */
  { sprite:'psychic_master', lv:100, master:true,
    /* (3.15) "please give psychic master a bunch of these elites in triple
       waves": her Seadragons and Sylphs put the marks on you that her Hydras
       feed on; the Plasma Mantas hurry her side; the Steelcrabs will not
       break; and in the middle of one wave, the Mime copies you. As every
       master's, each flank has a strong passive. (3.24) Her Ladybirds stand
       where her Rams stood — the Ram is a wild one now. (3.25) "Crown it for
       psychic master when in the centre, but otherwise leave it uncrowned":
       the second wave's Ladybird steps into its middle, crowned, and the
       Steelcrab out to its flank; the fourth wave's stays a flank,
       uncrowned. Both beam you every turn — blinded, then Exploited.
       (3.36) The Firefox is a wild one now, so the third wave's middle is a
       crowned Hermit Sloth, an elite now (a master's centre is a crowned
       starter, elite or legendary); her Firefoxes on the flanks enchant
       her side. */
    waves:[['seadragon', R5_CROWNED('hydra'), 'sylph'],
           ['steelcrab', R5_CROWNED('ladybird'), 'firefox'],
           ['plasma_manta', R5_CROWNED('hermit_sloth'), 'seadragon'],   // (3.36) a crowned Firefox until the Firefox went wild
           ['sylph', R5_CROWNED('mime'), 'ladybird'],
           ['steelcrab', R5_CROWNED('tailed_cat'), 'plasma_manta'],
           ['hydra', R5_CROWNED('mindcat', { veryHigh:{ type:'Psychic', plus:1, cast:true } }), 'firefox']],
    sees:[`The master is a tall woman in a long grey coat — one of Ugo's — and she does not blink.<br><br>` +
          `<b>"A junior soldato who is not a junior soldato, thinking very hard about a villa, a stolen core and a whale. So you are the child the dead keep whispering about."</b>`,
          `<b>"My order came over the sea twenty years ago, to find one ghost for the Padrino. Just one. We never found it. ` +
          `So he kept us, to hold all the others down instead — and now we answer to his grandniece. The Signorina. Upstairs."</b>`,
          `<b>"For twenty years we have held this hill down with our minds. Every ghost in it, quiet. Do you know what happens if we stop?"</b>`],
    whale:`<b>"They rise."</b>`,
    beaten:`<b>"Then it is done. Without me, my order cannot hold them for long."</b><br><br>` +
           `She glances at the ceiling. <b>"Not that it matters. Every mind in this tower pours through the Signorina's ring, not mine. ` +
           `And the Signorina will not be so kind."</b>`,
    talk:`<b>"Twenty years we held them. I had forgotten how loud this hill is."</b>` },
  /* 13 — the Ghost Master: the Padrino's grandniece */
  { sprite:'ghost_master', lv:100, master:true,
    waves:[['ghost', R5_CROWNED('goblin'), 'cyclops'],
           ['cyclops', R5_CROWNED('horned_lynx'), 'ghost'],
           ['puppet', R5_CROWNED('goblin_knight'), 'ghost'],
           ['goblin_knight', R5_CROWNED('puppet'), 'cyclops'],
           ['puppet', R5_CROWNED('firehound'), 'goblin_knight'],
           ['firehound', R5_CROWNED('ghost_guardian', { veryHigh:{ type:'Ghost', plus:2, cast:true } }), 'puppet']],
    sees:[`A girl only a few years older than you sits in the middle of a ring of candles, eyes shut, a ghost curled at her feet like a cat.<br><br>` +
          `<b>"I felt your whale come in at the door, thirteen floors down. A great old ghost, and angry. I have never felt one like it."</b>`,
          `She opens her eyes.<br><br><b>"Cousin Figlio's porter."</b> She smiles. <b>"He always did bring home strays. Don't worry — I won't tell my great-uncle. ` +
          `I'd much rather beat you myself."</b>`,
          `<b>"He gave me his mediums when I was twelve. I'm better with the dead than all of them put together. Every ghost in this hill does what I tell it."</b>`],
    whale:`<b>"Not every ghost, child."</b>`,
    beaten:'',
    talk:`<b>"Listen to them. All that singing. I'd never heard it before."</b> She is quiet for a moment. <b>"...It's rather beautiful."</b>` },
];
R5_TOWER.forEach((f, i)=>{
  const n = i + 1;
  f.kind = /^ghost/.test(f.sprite) ? 'ghost' : 'psychic';
  f.icon = f.kind === 'ghost' ? '👻' : '🔮';
  f.name = n === 12 ? 'Psychic Master' : n === 13 ? 'Ghost Master' : (f.kind === 'ghost' ? 'Ghost Disciple' : 'Psychic Disciple');
  /* (3.16) "please finish the psychic disciples and master. Give them good
     AI": every wave of a psychic floor, the Psychic Master's too, thinks
     about each turn (ai 'smart' — smartMove, 05-battle-flow.js). The ghost
     floors keep Power2 for two waves, then Best (a master's, Best). */
  f.ai = f.ai || (f.kind === 'psychic' ? ['smart', 'smart', 'smart', 'smart', 'smart', 'smart']
                : f.master ? ['best', 'best', 'best', 'best', 'best', 'best'] : ['power2', 'power2', 'best', 'best', 'best', 'best']);
  f.dare = n === 12 ? `<b>"My mind against yours, then."</b>`
         : n === 13 ? `<b>"Come and see what the Padrino's grandniece can do."</b>`
         : f.kind === 'ghost' ? `<b>"Come, then. Let the dead see what you are made of."</b>`
                              : `<b>"I already know what you will do. Do it anyway."</b>`;
});
/* A floor's team: species by name. A disciple's at the floor's level for
   two waves, then one higher every two; a master's the same — never past
   100, as none of theirs is (2.99; it was the region's cap, 110, and the
   masters fought at 109 and 110). */
function r5TowerWaves(n){
  const f = R5_TOWER[n - 1], top = ENEMY_LEVEL_CAP;
  return f.waves.map((wv, wi)=> wv.map(s=> Object.assign({ level:Math.min(f.lv + Math.floor(wi / 2), top), nerfed:false, ai:f.ai[wi] || 'best' },
    typeof s === 'string' ? { species:s } : s)));
}
function r5TowerBeaten(n){ return r5().tower.beaten.includes(n); }
function r5TowerFace(n){ const f = R5_TOWER[n - 1]; return faceNpc(f.sprite, f.icon); }
/* The door, from the estate: the floor you have climbed to, or the ground floor. */
async function r5TowerIn(){
  const t = r5().tower;
  const top = Math.min(13, Math.max(1, t.reached || 0));
  if(top <= 1) return goFloor('tower_1', 'down');
  const yes = await r5Ask([faceMon('whalelord')], whaleName(),
    `<b>"We have climbed as far as floor ${top}. I remember the stairs, if you want to go straight back up."</b>`,
    `🗼 Floor ${top}`, 'Floor 1');
  return goFloor(yes ? 'tower_' + top : 'tower_1', 'down');
}
async function r5TowerOut(){
  const r = r5();
  if(r.disguise && !r.disguised && !r.holdBroken){   // (3.00) the soldatos are busy with the dead now
    const yes = await r5Ask([faceMon('whalelord')], whaleName(),
      `<b>"Out there, the soldatos would know your face. Put on the disguise first."</b>`, '🎭 Put it on', 'Stay inside');
    if(!yes) return;
    r5SetDisguise(true);
  }
  goFloor('hilltop', 'tower');
}
/* On each floor, the first time: they see you for what you are. */
/* (3.07) His word in the tower — the first time in, and the first time each
   day after that, for as long as it holds the dead down. */
const R5_TOWER_WORD = `<b>"The air in here is thick — with minds, and with the dead they talk to. They know we are here already."</b>`;
function r5TowerRender(world, d){
  const r = r5(), n = d.tower, f = R5_TOWER[n - 1];
  if(n > (r.tower.reached || 0)){ r.tower.reached = n; saveProfile(); }
  if(ui.sceneRunning) return;
  const word = !r.holdBroken && r5DailyDue('towerDoor');
  if(r5TowerBeaten(n) || r.said['tower_met_' + n]){
    if(word) r5PlaceWord(d.key, 'towerDoor', R5_TOWER_WORD);
    return;
  }
  r.said['tower_met_' + n] = true;
  saveProfile();
  const w = walkState();
  w.busy = true;
  setTimeout(async ()=>{
    ui.sceneRunning = true;
    if(word && r5Daily('towerDoor'))                // (said before whoever is waiting on this floor sees you)
      await sceneSay([faceMon('whalelord')], whaleName(), R5_TOWER_WORD);
    const lines = (n === 9 && !r.phoenixGift) ? [].concat(f.seesPlain) : f.sees;
    for(const line of lines) await sceneSay([r5TowerFace(n)], f.name, line);
    if(f.whale) await sceneSay([faceMon('whalelord')], whaleName(), f.whale);
    if(n === 13 && r5NinoEarly()) await r5TowerFlicker();   // (3.02) "…What was that?"
    ui.sceneRunning = false;
    w.busy = false;
  }, 500);
}
/* What the fight is, said before it: the waves, how many, the levels, what
   beats them — and for the masters, how their waves are made, and the
   stone their last monster opens with. */
function r5TowerNote(n){
  const f = R5_TOWER[n - 1], ws = r5TowerWaves(n), all = ws.flat(), lv = all.map(s=> s.level);
  const lo = Math.min(...lv), hi = Math.max(...lv), lvl = lo === hi ? `${lo}` : `${lo}–${hi}`;
  const what = f.kind === 'ghost' ? 'Ghosts' : 'Psychic monsters', beat = f.kind === 'ghost' ? 'Psychic' : 'Physical';
  /* (3.16) the psychics think about every move (ai 'smart') */
  const wits = f.kind === 'psychic' ? ' Every one of them thinks about each move: a shield or a heal where one is needed, a sleep or a weaken where it will stick, its hardest blow where it hurts most.' : '';
  if(!f.master)
    return `<i>${ws.length} waves, ${all.length} ${what}, level ${lvl}: a <b>${beat}</b> monster of yours beats them.${wits} No running.</i>`;
  const centre = f.kind === 'ghost' ? 'Ghost' : 'Psychic';
  const warn = n === 12
    ? ` The last, a crowned <b>Mindcat</b>, opens with <b>Discombobulate +</b>: your monsters are confused at once — a damaging move of yours turns on your own side for <b>0.8–1.1× its ATK</b> — and for 5 turns, at the end of every turn, each has a <b>20%</b> chance to be confused again (or, <b>5%</b>, to fall asleep instead). ` +
      `The first attack to reach it each round does <b>half</b>, and every blow it lands makes your monster <b>forget its best move</b> for a turn. ` +
      `Her Mime walls up and copies you, turn about. Her Ladybirds beam you every turn: what a beam hits is <b>blinded</b> — ` +
      `a quarter of its attacks miss — and the next beam hits it <b>1.4×</b> as hard.`
    : ` The last, a crowned <b>Ghost Guardian</b>, opens with <b>Curse ✦</b>: for 5 turns your side takes <b>30% more</b> damage, theirs <b>15% less</b>, and your passives are muted. ` +
      `He takes every single blow meant for his friends, takes <b>30% less</b> from each, and his flaming sword burns whoever strikes him.`;
  return `<i>${ws.length} waves of 3 — ${all.length} monsters, level ${lvl}. In the middle of each, a <b>crowned</b> ${centre} monster; ` +
         `either side of it, one with a strong passive. A <b>${beat}</b> monster of yours beats her ${f.kind === 'ghost' ? 'ghosts' : 'psychics'}.${wits}${warn} No running.</i>`;
}
async function r5TowerChallenge(n){
  const f = R5_TOWER[n - 1];
  if(ui.sceneRunning || walkState().busy) return;
  const yes = await r5Ask([r5TowerFace(n)], f.name, f.dare + '<br><br>' + r5TowerNote(n), '⚔️ Fight', 'Not yet');
  if(!yes || !ensurePool()) return;
  walkTeardown();
  beginBattle(Object.assign(r5TowerBattle(n), { onWin: ()=> r5TowerWon(n) }));
}
function r5TowerBattle(n){
  const f = R5_TOWER[n - 1];
  return { isNpc:true, name:f.name, npcId:f.sprite, noFlee:true, bgKey:'battle_tower', waves:r5TowerWaves(n) };
}
async function r5TowerWon(n){
  const r = r5(), t = r.tower, f = R5_TOWER[n - 1];
  const first = !t.beaten.includes(n);
  if(first) t.beaten.push(n);
  const w = walkState();
  w.at = w.at || {}; w.at['tower_' + n] = { x:5, y:3 }; w.face = 'u';
  ui.walkFresh = false;
  ui.currentZone = r5Zone('hilltop') || ui.currentZone;
  if(n === 13 && first){ await saveProfile(); return r5HoldBreaks(); }
  let reward = '', emblem = npcPortrait(f.sprite, f.icon, 130, 'transparent');
  /* (3.00) She gives no stone now — the tower's stone is the Fairy Stone in
     the Ghost Master's ring, and it is taken, not given (r5HoldBreaks).
     (3.01) Three protein, as the Ghost Master's — it was two. */
  if(first && n === 12){
    state.inventory.protein = (state.inventory.protein || 0) + 3;
    reward = `<b>+3 Protein Supplements</b>`;
  } else if(first){
    state.inventory.protein = (state.inventory.protein || 0) + 1;
    reward = `<b>+1 Protein Supplement</b>`;
  }
  await saveProfile();
  const said = (n === 9 && !r.phoenixGift) ? f.beatenPlain : f.beaten;
  storyModal(emblem, f.name,
    said + (reward ? `<br><br>${reward}` : '') + (n < 13 ? `<br><br><i>The stair up to floor ${n + 1} is yours.</i>` : ''),
    ()=> go('tower_' + n), { subtitle:'The Tower · Floor ' + n });
}
function r5TowerTalk(n){
  const f = R5_TOWER[n - 1];
  return sceneSay([r5TowerFace(n)], f.name, f.talk);
}
function r5TowerWindow(){
  return sceneSay([], 'The window',
    `From the top of the tower you can see all of Cosa Nostia: the villa's roofs below you, the Old Town, the harbour, and the sea going on and on.` +
    (r5().holdBroken ? `<br><br>Pale lights drift up all over the hill, like snow falling the wrong way: the dead, free at last.` : ''));
}
/* The Ghost Master beaten: the hold on the dead breaks. (3.00) The Fairy
   Stone: in the middle of the Ghost Master's ring sits the conduit every mind
   in the tower has held the dead down through. You take it — and the hold on
   the dead breaks. It is the stone the Monkey King's Diamond Dust ✦ will come
   from (part 6 §12) — and (3.17) the very stone the Forest Guardian gave the
   young Padrino for Nino (the Madrina tells it, at the villa).
   (3.17, part 6 §12c, the designer's decision: "She cannot see him") She
   tells you who the mediums came for — Nino, the Padrino's little brother,
   ill from birth, dead at six; twenty years they searched for his ghost. The
   little light floats into her ring and she does not see it. It pushes the
   stone off its silk to your feet; she sees it move by itself and goes
   white. Her Ghost Guardian, risen at her shoulder, turns its head toward the
   light — the first hint of Nemesis — and the light shrinks from it. The
   Whalelord: take it. The hold breaks; the light grows into a boy she cannot
   see; he nods to his name, looks at the Guardian, shows the Whalelord the
   Bone Demon (r5BoneVision), and runs to the villa.
   Where things stand: she at (3,2), as beaten; you at (5,3); the stone in
   the middle of the rune ring (5.5,5.5); the Guardian at her left shoulder. */
const R5_STONE13 = { x:5.19, y:5.12 };            // the stone's top-left: centred in the ring
const R5_GUARD13 = { x:1.8, y:1.7, size:1.3 };     // her Guardian, at her shoulder
function r5GuardianActor(fadeMs){
  const G = R5_GUARD13, px = Math.round(WALK_T * G.size);
  const el = r5MonActor('gguard', 'ghost_guardian', G.x, G.y, G.size,
    { html:monPortrait('ghost_guardian', px, { view:'front', bare:true, stage:1, crowned:true }) });
  if(!el) return null;
  el.classList.add('r5-guard');
  if(fadeMs){
    el.style.transition = 'none'; el.style.opacity = '0'; el.style.top = ((G.y + 0.5) * WALK_T) + 'px';
    void el.offsetWidth;
    el.style.transition = `opacity ${fadeMs * SCENE_SPEED}ms ease, top ${fadeMs * SCENE_SPEED}ms ease-out`;
    el.style.opacity = '1'; el.style.top = (G.y * WALK_T) + 'px';
  }
  return el;
}
function r5StoneActor(x, y){
  const world = $('#walkWorld');
  if(world && !document.getElementById('r5Silk')){         // the fold of black silk it sits on
    const k = document.createElement('div');
    k.id = 'r5Silk'; k.className = 'r5-silk scene-glow';
    k.style.cssText += `left:${(R5_STONE13.x - 0.2) * WALK_T}px;top:${(R5_STONE13.y + 0.25) * WALK_T}px;` +
      `width:${1.02 * WALK_T}px;height:${0.5 * WALK_T}px;z-index:20;`;
    world.appendChild(k);
  }
  const el = sceneActor('fstone', { x, y, w:0.62, h:0.62, src:'assets/ui/fairy_stone.png', icon:'✨', z:59 });
  if(el) el.classList.add('r5-fstone');
  return el;
}
async function r5HoldBreaks(){
  const r = r5();
  go('tower_13');
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  await sceneWait(600);
  const gm = ()=> r5TowerFace(13), G = 'Ghost Master';
  const wl = ()=> faceMon('whalelord'), W = whaleName();
  const p = (w.at && w.at.tower_13) || { x:5, y:3 };
  const S = R5_STONE13;
  r5StoneActor(S.x, S.y);
  await sceneSay([gm()], G, `She does not look at you. She is looking at the middle of her ring of candles, where a small pale stone sits on a fold of black silk, glittering like frost.<br><br>` +
    `<b>"Beat me all you like. They stay down."</b>`);
  /* her Guardian rises at her shoulder */
  r5GuardianActor(900);
  await sceneWait(700);
  await sceneSay([faceMon('ghost_guardian', { stage:1, crowned:true })], 'Ghost Guardian',
    `Beside her, a knight in haunted armour rises up out of the floor — her Ghost Guardian, its sword burning with purple fire. It stands at her shoulder, as it always does.`);
  /* who the mediums came for */
  await sceneSay([gm()], G, `<b>"Do you know why my great-uncle brought the mediums over the sea? To find one ghost. Just one."</b>`);
  await sceneSay([gm()], G, `<b>"His little brother, Nino. Nino was sick from the day he was born. When he was six, he died."</b>`);
  await sceneSay([gm()], G, `<b>"My great-uncle has missed him every single day since. For twenty years we have searched this hill for Nino's ghost — and never found a thing."</b>`);
  await sceneSay([gm()], G, `<b>"That is why he wants to turn back time. To have his brother back."</b>`);
  /* the little light, out from behind you, into her ring — beside the stone
     ("A little light", for a save that never saw it in the catacombs) */
  const seenLight = !!r.said.wispLanding;
  r.said.wispLanding = true;
  r5Wisp(p.x, p.y + 0.4, 700);
  await sceneWait(500);
  await r5WispTo(5.6, 4.75, 1600);
  await sceneSay([], '', `${seenLight ? 'The' : 'A'} little light floats out from behind you, into her ring of candles, and stops beside the small pale stone.`);
  await sceneSay([gm()], G, `She looks straight at it — and straight through it. She does not see it at all.`);
  await sceneSay([wl()], W, `<b>"The little light — right in front of her. And she cannot see it."</b>`);
  /* it pushes the stone off its silk, to your feet */
  await r5WispTo(5.2, 4.95, 500);
  r5MoveActor('fstone', p.x + 0.2, p.y + 0.7, 1200);
  await r5WispTo(5.15, 3.95, 1200);
  await sceneSay([], '', `The little light pushes against the stone. It slides off its silk — and rolls, all by itself, across the floor to your feet.`);
  await sceneSay([gm()], G, `She goes white.<br><br><b>"The stone… It moved. By itself."</b>`);
  await sceneSay([gm()], G, `<b>"Who's there? Show yourself!"</b><br><br>She looks all round the room — everywhere but at the little light.`);
  /* the Guardian turns its head toward the light, and the light shrinks back */
  actorFace('gguard', true);
  await sceneWait(700);
  const wisp = document.getElementById('sg-wisp');
  if(wisp) wisp.classList.add('shy');
  await r5WispTo(6.0, 4.3, 700);
  await sceneSay([faceMon('ghost_guardian', { stage:1, crowned:true })], 'Ghost Guardian',
    `Slowly, the Guardian turns its helmet toward the little light.<br><br>The little light shrinks back from it, trembling.`);
  await sceneSay([gm()], G, `<b>"Guardian? What is it? What can you see?"</b><br><br>The Guardian says nothing.`);
  await sceneSay([wl()], W, `<b>"Her knight can see it, though. And the little light is afraid of it."</b>`);
  await sceneSay([wl()], W, `<b>"That stone keeps every ghost in this hill pushed down. It is a Fairy Stone."</b><br><br>` +
    `<b>"The little light wants you to have it. Take it."</b>`, '✋ Take the Fairy Stone');
  sceneActorGone('fstone');
  addStone('fairyStone', 1);
  await saveProfile();
  await sceneSay([uiIcon('fairy_stone', 64, '✨')], 'The Fairy Stone',
    `Your fingers close round it — cold, and humming, like a held note.`);
  await sceneSay([gm()], G, `She only stares at it, in your hand.<br><br>The candles gutter all at once. The ghost at her feet uncurls, looks at her — and drifts away through the wall.`);
  sceneShake(1600, t=> 0.14 * Math.max(0, 1 - t / 1600));
  await sceneWait(900);
  await sceneCurtain(true, 700);
  sceneClear();
  const silk = document.getElementById('r5Silk'); if(silk) silk.remove();
  await sceneCurtainText('Far below, under the whole hill, something lets go.', 700);
  await sceneWait(1600);
  await sceneCurtainText('', 400);
  await sceneCurtainText('Out of the catacombs, the cellars and the crypt, the dead of Cosa Nostia rise — and this time nobody pushes them back down.', 700);
  await sceneWait(2200);
  await sceneCurtainText('', 400);
  await sceneCurtainText('In every street and every tunnel, the Family\'s men turn their lanterns on the dark — and find it full.', 700);
  await sceneWait(2000);
  await sceneCurtainText('', 400);
  if(r.phoenixGone){
    await sceneCurtainText('Somewhere in the hill, a fire that went out long ago flickers — just once.', 700);
    await sceneWait(1700);
    await sceneCurtainText('', 400);
  }
  r.holdBroken = true;
  state.inventory.protein = (state.inventory.protein || 0) + 3;
  await saveProfile();
  /* in the dark, the little light grows — into a boy; her Guardian still at her shoulder */
  r5GuardianActor(0);
  actorFace('gguard', true);
  r5Wisp(5.6, 4.35, 10);
  await sceneCurtain(false, 800);
  await sceneWait(500);
  r5NinoActor(5.7, 4.05, 1400);
  await sceneGlowOut(['wisp'], 1400);
  await sceneSay([r5NinoFace()], '', `In the dark, the little light grows — and grows — into a boy. A small boy in short trousers and a cap, see-through like mist.`);
  await sceneSay([wl()], W, `<b>"Now I can see him properly. He is not a monster at all. He is a boy. A human boy."</b>`);
  await sceneSay([gm()], G, `<b>"What are you staring at?"</b> She looks straight through him. <b>"There's nothing there."</b>`);
  await sceneSay([wl()], W, `<b>"She still cannot see him."</b><br><br>Then, very softly: <b>"…But I think I know who you are. You are Nino. Aren't you?"</b>`);
  await sceneSay([r5NinoFace()], '', `The boy nods.`);
  r.ninoMet = true;
  await saveProfile();
  /* he looks at the Guardian — and backs away; then at the Whalelord, hard */
  actorFaceToward('nino', R5_GUARD13.x + R5_GUARD13.size / 2);
  await sceneSay([r5NinoFace()], '', `He looks up at the Guardian at her shoulder — and takes a step back from it. Then he looks at the Whalelord, very hard.`);
  await r5BoneVision();
  await sceneSay([r5NinoFace()], '', `He looks at you one last time. Then he runs — down the stairs, out of the tower, toward the villa.`);
  await r5MoveActor('nino', 5, 9, 1400, true);
  sceneActorGone('nino');
  await sceneSay([wl()], W, `<b>"He is going to his brother."</b>`);
  await sceneSay([wl()], W, `<b>"The dead are free now, and the Padrino is the one they are angriest with. That little boy is going to stand in their way."</b>`);
  ghostAlert();
  await sceneSay([wl()], W, `<b>"Can you hear them? All of them, free — and singing."</b>`);
  await sceneSay([wl()], W, `<b>"And every soldato on this hill, in the town and under it, has three of them to deal with now. ` +
    `They will have no eyes for us. Not tonight. Not ever again."</b>`);
  /* (3.01) the designer: "capos still keep watch, along with consigliere and sottocapo" */
  await sceneSay([wl()], W, `<b>"But not the capos. Nor the Consigliere, nor the Sottocapo at the Padrino's door — ` +
    `the dead are no strangers to them, and they will still be watching."</b>`);
  await sceneSay([wl()], W,
    `<b>"And my core. It is in the villa, right below us. I can feel it beating, like a second heart."</b><br><br><b>"We go there next."</b>`);
  w.busy = false;
  ui.sceneRunning = false;
  walkTeardown();
  storyModal(uiIcon('fairy_stone', 130, '✨'), 'The hold is broken',
    `You have beaten all thirteen floors of the psychics' tower and taken the stone they held the dead down with. ` +
    `The dead of Cosa Nostia are free — and every soldato in the town is fighting them.<br><br>` +
    `<b>Nino</b>, the Padrino's little brother — only you and the Whalelord can see him — has gone to keep the dead away from his brother. ` +
    `He showed the Whalelord something he is afraid of: a monster of bones.<br><br>` +
    `<b>✨ Fairy Stone</b> — a Fairy monster carrying it learns half again as fast (<b>1.5× experience</b>), ` +
    `and at a level ceiling past 100 it is the stone it charges to break through.<br><br>` +
    `<b>+3 Protein Supplements</b><br><br><i>Next: the villa.</i>`,
    ()=> go('tower_13'), { subtitle:'The Tower · Floor 13' });
}
/* The tower's floors, drawn from their grids (2.92) until they have
   paintings (assets/zones/tower_ghost.png, tower_psychic.png): a round stone
   room, a rune circle in the floor — candles round a séance ring on the
   ghost floors, crystal pillars on the psychic ones, gold on the masters'
   — and the stairs, down at the bottom and up at the top. */
const _towerArt = {};
function paintTower(d){
  const own = cataPainting(d) || (d.artAlt ? cataPainting({ art:d.artAlt }) : null);
  if(own) return own;
  if(_towerArt[d.key]) return _towerArt[d.key];
  const W = d.rows[0].length, H = d.rows.length, P = 32;
  const c = document.createElement('canvas');
  c.width = W * P; c.height = H * P;
  const g = c.getContext('2d');
  if(!g) return '';
  const ghost = (d.tower || 1) % 2 === 1, master = (d.tower || 0) >= 12;
  const rnd = (x, y, k)=>{ const s = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const at = (x, y)=> (y < 0 || y >= H || x < 0 || x >= W) ? '#' : d.rows[y][x];
  g.fillStyle = '#120e18'; g.fillRect(0, 0, W * P, H * P);
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const ch = at(x, y), X = x * P, Y = y * P;
    if(ch === '#'){
      const edge = at(x, y + 1) !== '#' || at(x, y - 1) !== '#' || at(x + 1, y) !== '#' || at(x - 1, y) !== '#';
      g.fillStyle = edge ? (ghost ? '#3a3046' : '#463650') : '#1a1422'; g.fillRect(X, Y, P, P);
      if(edge){
        g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1;
        g.strokeRect(X + 0.5, Y + 0.5, P - 1, P / 2); g.strokeRect(X + 0.5, Y + P / 2 + 0.5, P - 1, P / 2 - 1);
        if(at(x, y + 1) !== '#'){ g.fillStyle = ghost ? '#4c405a' : '#5a4866'; g.fillRect(X, Y + P - 6, P, 6); }
      }
      continue;
    }
    const tone = 52 + Math.floor(rnd(x, y) * 12);
    g.fillStyle = ghost ? `rgb(${tone},${tone - 4},${tone + 10})` : `rgb(${tone + 14},${tone},${tone + 18})`;
    g.fillRect(X, Y, P, P);
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.strokeRect(X + 0.5, Y + 0.5, P - 1, P - 1);
  }
  /* the rune circle round the middle of the room */
  const cx = W * P / 2, cy = H * P / 2;
  g.strokeStyle = master ? 'rgba(230,190,90,0.75)' : ghost ? 'rgba(170,120,255,0.6)' : 'rgba(255,140,220,0.55)';
  g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, P * 2.6, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, P * 2.15, 0, Math.PI * 2); g.stroke();
  for(let k = 0; k < 16; k++){                              // marks all the way round, between the rings
    const a = k / 16 * Math.PI * 2, r0 = P * 2.24, r1 = P * (k % 2 ? 2.4 : 2.52);
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke();
  }
  if(ghost){                                                // a spiral in the middle, like smoke
    g.lineWidth = 2; g.beginPath();
    for(let t = 0; t <= Math.PI * 6; t += 0.12){ const r = P * 0.08 + t * P * 0.085; const px = cx + Math.cos(t) * r, py = cy + Math.sin(t) * r; t ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke();
  } else {                                                  // the eye in the middle, and its rays
    for(let k = 0; k < 12; k++){
      const a = k / 12 * Math.PI * 2;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * P * 0.95, cy + Math.sin(a) * P * 0.95); g.lineTo(cx + Math.cos(a) * P * 1.7, cy + Math.sin(a) * P * 1.7); g.stroke();
    }
    g.fillStyle = 'rgba(255,170,230,0.35)'; g.beginPath(); g.ellipse(cx, cy, P * 0.7, P * 0.38, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(80,20,90,0.8)'; g.beginPath(); g.arc(cx, cy, P * 0.2, 0, Math.PI * 2); g.fill();
  }
  /* candles and crystal pillars */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const ch = at(x, y), X = x * P, Y = y * P;
    if(ch === '*'){
      const gr = g.createRadialGradient(X + P / 2, Y + P / 2, 1, X + P / 2, Y + P / 2, P * 1.1);
      gr.addColorStop(0, 'rgba(200,150,255,0.6)'); gr.addColorStop(1, 'rgba(120,60,200,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(X + P / 2, Y + P / 2, P * 1.1, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2a2230'; g.fillRect(X + 9, Y + 16, 14, 10);
      [[12, 10], [16, 8], [20, 10]].forEach(([qx, qy])=>{
        g.fillStyle = '#efe6f4'; g.fillRect(X + qx - 1.5, Y + qy + 2, 3, 7);
        g.fillStyle = master ? '#ffd36a' : '#c9a2ff'; g.beginPath(); g.arc(X + qx, Y + qy, 2.3, 0, Math.PI * 2); g.fill();
      });
    }
    if(ch === 'o'){
      const gr = g.createRadialGradient(X + P / 2, Y + P / 2, 1, X + P / 2, Y + P / 2, P * 1.0);
      gr.addColorStop(0, 'rgba(255,170,235,0.5)'); gr.addColorStop(1, 'rgba(255,120,220,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(X + P / 2, Y + P / 2, P, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(X + P / 2 + 2, Y + P - 6, 10, 4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = master ? '#f2d58a' : '#e8b8ef';
      g.beginPath(); g.moveTo(X + P / 2, Y + 2); g.lineTo(X + P - 8, Y + 12); g.lineTo(X + P - 9, Y + P - 7);
      g.lineTo(X + 9, Y + P - 7); g.lineTo(X + 8, Y + 12); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(X + P / 2 - 2, Y + 6, 3, P - 16);
    }
  }
  /* the stairs: up in the top alcove, down in the bottom one — but the
     ground floor's alcove is the door out, and the top floor's a window */
  (d.things || []).filter(t=> t.walk).forEach(t=>{
    const X = t.x * P, Y = t.y * P, up = t.y < H / 2;
    if(t.verb === 'Out'){
      g.fillStyle = '#4a2f1e'; g.fillRect(X + 4, Y + 2, P - 8, P - 4);
      g.fillStyle = '#6b4429'; g.fillRect(X + 6, Y + 4, P / 2 - 7, P - 8); g.fillRect(X + P / 2 + 1, Y + 4, P / 2 - 7, P - 8);
      g.fillStyle = '#d9b45a'; g.beginPath(); g.arc(X + P / 2 - 3, Y + P / 2 + 1, 1.8, 0, Math.PI * 2); g.arc(X + P / 2 + 3, Y + P / 2 + 1, 1.8, 0, Math.PI * 2); g.fill();
      return;
    }
    if(t.verb === 'Window'){
      g.fillStyle = '#0b1230'; g.beginPath(); g.moveTo(X + 6, Y + P - 2); g.lineTo(X + 6, Y + 12); g.arc(X + P / 2, Y + 12, P / 2 - 6, Math.PI, 0); g.lineTo(X + P - 6, Y + P - 2); g.closePath(); g.fill();
      g.fillStyle = '#f4ecff';
      [[11, 10], [20, 14], [15, 20], [22, 24], [10, 26]].forEach(([sx, sy])=>{ g.fillRect(X + sx, Y + sy, 1.6, 1.6); });
      g.strokeStyle = '#6a5a7a'; g.lineWidth = 2; g.beginPath(); g.moveTo(X + P / 2, Y + 4); g.lineTo(X + P / 2, Y + P - 2); g.stroke();
      return;
    }
    for(let k = 0; k < 4; k++){
      const v = up ? 70 + k * 18 : 120 - k * 22;
      g.fillStyle = `rgb(${v},${v - 6},${v + 8})`;
      g.fillRect(X + 3, Y + 3 + k * 7, P - 6, 7);
    }
  });
  /* the lamp light, and the dark round the edge */
  const vg = g.createRadialGradient(cx, cy, P * 1.5, cx, cy, P * 6.5);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = vg; g.fillRect(0, 0, W * P, H * P);
  try { _towerArt[d.key] = c.toDataURL('image/png'); } catch(e){ _towerArt[d.key] = ''; }
  return _towerArt[d.key];
}

/* (3.03) The post office's clerk, behind her grille — (3.06, the designer:
   "post clerk - busy young female") a young woman who never stops sorting. */
async function r5PostOffice(){
  const r = r5();
  const nino = r.ninoMet && (r.said.t_post || 0) >= 3 && r5Once('postNino');   // (once she has told you about the letters)
  const free = !nino && r.holdBroken && r5Once('postFree');
  const yes = await r5Ask([faceNpc('post_clerk', '📮')], 'Post clerk Carla', nino
    ? `<b>"Nino…"</b> For once she stops sorting altogether, and opens the drawer again. <b>"So that is who the letters were for."</b> She closes it very gently.`
    : free ? `<b>"No post tonight! The postman saw a ghost and dropped the lot — and now I'm sorting it all off the floor."</b>`
    : r5Turn('post', [
      `She does not look up. Letters fly from her hands into the pigeonholes, one after another.<br><br>` +
        `<b>"Parcels to mind, junior? Round the back. I don't ask what's in them — I haven't got time!"</b>`,
      `<b>"Letters for the Family go in the red sack. Letters for everybody else go in the slow sack."</b> Two more land in the slow sack while she says it.`,
      `<b>"Every year, one letter comes down from the villa. No stamp, no address — just one word on it: NINO."</b><br><br>` +
        `She stops, just for a moment, and opens a drawer full of envelopes. <b>"I never know where to send it. So I keep them all."</b>`,
    ]), '📦 Storage', 'Leave');
  if(yes) leaveDeck('storage');
}
/* (3.03) The trattoria's cook, in his kitchen — (3.07, the designer: "Apart
   from the females I mentioned in the new NPC uploads, the rest are male")
   Chef Franco; he was Mamma Rosa. (The save keeps her keys: t_rosa, rosaFree.) */
async function r5Trattoria(){
  const r = r5();
  const free = r.holdBroken && r5Once('rosaFree');
  const yes = await r5Ask([faceNpc('trattoria_cook', '🍝')], 'Chef Franco', free
    ? `<b>"A ghost came into my kitchen tonight and tasted my sauce. Said it needs more salt."</b> Franco tastes it, and frowns. <b>"…He's right."</b>`
    : r5Turn('rosa', [
      `He waves a ladle at you.<br><br><b>"Sit, sit! Soldato, junior, I don't care who you work for — nobody leaves my kitchen hungry."</b>`,
      `<b>"Pasta with clams tonight. Tomorrow, pasta with clams. The Family takes all the fish, so we eat clams."</b>`,
      `<b>"Eat! You'll never grow if you only eat once a day."</b>`,
    ]), '🍝 Rest here', 'Not now');
  if(yes) leaveDeck('recover');
}
function r5Fountain(){
  return sceneSay([], 'The fountain', `A stone dolphin spouts water into the basin. At the bottom, among the coins, somebody has thrown in a little lead soldier.`);
}
function r5Belvedere(){
  return sceneSay([], 'The belvedere',
    `From up here you can see the whole harbour far below: the boats, the lighthouse, the Vane Shear riding at anchor. The sea goes on and on.`);
}
function r5TownFunicular(){
  return sceneSay([], 'The funicular station',
    `A sign on the door says FAMILY ONLY. Far down at the bottom of the rails the little car is waiting, its driver sitting in it with his feet up, wide awake.`);
}
/* The capos at the café's tables (and, 2.95, the Consigliere): a junior does
   not speak to one. (3.01) Once the dead are up for good you may walk the
   streets out of uniform — and these three keep their watch: they know you on
   sight, though none of them gets up from his table. */
const R5_CAPO_SEES_YOU = {
  purple:`He lowers his newspaper an inch and looks straight at you over the top of it.<br><br>` +
         `<b>"The kid from the catacombs. In my piazza, in his own clothes."</b> He turns a page. <b>"Enjoy it while my men have the dead to deal with."</b>`,
  black:`He stops stirring. His eyes come to rest on you, and stay there.<br><br>` +
        `<b>"I'd know that face anywhere now. Walk on, kid. I'm watching you."</b>`,
  consigliere:`He doesn't look up from his ledger.<br><br>` +
        `<b>"Ah. The one who emptied my pit. You're in the book too, little one — in red ink."</b>`,
};
function r5CapoLook(which){
  const name = { purple:'Purple Capo', black:'Black Capo', consigliere:'Consigliere' }[which];
  const sprite = which === 'consigliere' ? 'consigliere' : 'capo_' + which;
  if(r5().holdBroken && !r5().disguised && R5_CAPO_SEES_YOU[which])
    return sceneSay([faceNpc(sprite, '🕴️')], name, R5_CAPO_SEES_YOU[which]);
  const what = {
    purple:`He is reading the newspaper, and does not look up.`,
    black:`He stirs his coffee very slowly, watching the piazza. His eyes slide over you, and away.`,
    consigliere:`He is counting the night's takings from his pit into a little black ledger, line by line, and muttering.`,
  }[which];
  const who = which === 'consigliere' ? 'the Consigliere' : 'a capo';
  return sceneSay([faceNpc(sprite, '🕴️')], name, `${what}<br><br><i>A junior does not speak to ${who} unless he is spoken to.</i>`);
}

/* The Old Town, drawn from its grid (2.91) until it has a painting of its
   own (assets/zones/old_town.png): dusk — cobbled streets, the pale piazza
   and its fountain, the church's steps, gardens, the belvedere's wall, a lamp
   on every corner. Each building is drawn whole from R5_TOWN_HOUSES, its
   name over its door. Seeded by position, so it never shimmers. */
const R5_TOWN_HOUSES = [
  { name:"Nonna's",     x:1,  y:1,  w:6,  h:6,  door:[3,6],   roof:'#a9533a' },
  { name:'Barber',      x:7,  y:2,  w:5,  h:5,  door:[9,6],   roof:'#b8643f' },
  { name:'Opera house', x:15, y:0,  w:10, h:7,  door:[19,6],  roof:'#8f4a3a', grand:true },
  { name:'Police',      x:1,  y:10, w:6,  h:8,  door:[3,17],  roof:'#6f6a66' },
  { name:'Church',      x:8,  y:9,  w:10, h:10, door:[12,18], roof:'#5f6670', church:true },
  { name:'Post office', x:19, y:10, w:6,  h:8,  door:[22,17], roof:'#b25a3c' },
  { name:'Café',        x:1,  y:21, w:6,  h:5,  door:[6,23],  roof:'#a8573e' },
  { name:'Trattoria',   x:1,  y:26, w:6,  h:5,  door:[4,30],  roof:'#bb6a45' },
  { name:'Tailor',      x:19, y:21, w:6,  h:5,  door:[19,23], roof:'#9a4d3a' },
  { name:'Gelateria',   x:19, y:26, w:6,  h:5,  door:[22,30], roof:'#c27b52' },
  { name:'Funicular',   x:18, y:33, w:5,  h:5,  door:[20,33], roof:'#7a5a48' },
];
const R5_TOWN_LAMPS = [[7,7],[18,7],[0,8],[25,8],[7,18],[18,18],[1,20],[24,20],[7,21],[18,21],[7,30],[18,30],[2,31],[23,31],[11,32],[14,32],[1,33],[9,33]];
/* The Hilltop (2.92), drawn the same way until assets/zones/hilltop.png is
   there: the villa (its courtyard open to the sky, a loggia of columns along
   its front), the psychics' round tower with its purple-lit windows, the
   estate's pale walls and its gate, lemon terraces down the hill. */
/* (3.32) as the painting has them, every door at the bottom */
const R5_HILL_HOUSES = [
  { name:'Villa',       x:8,  y:0,  w:10, h:4, door:[12,3],  roof:'#9b4b36', villa:true, wide:true },
  { name:'Tower',       x:20, y:0,  w:4,  h:6, door:[21,5],  roof:'#3d3352', tower:true },
  { name:'Lemon farm',  x:5,  y:16, w:6,  h:5, door:[9,20],  roof:'#b9893f' },
  { name:'Guard house', x:16, y:16, w:7,  h:5, door:[19,20], roof:'#6f6a66' },   // (3.33) its doorway walked into
  { name:"Grandpa's",   x:17, y:26, w:5,  h:4, door:[19,29], roof:'#b8643f' },
];
const R5_HILL_LAMPS = [[11,12],[14,12],[20,9],[22,9],[10,5],[15,5],[11,19],[14,19],[11,27],[14,27],[11,30],[14,30],[18,31],[20,31]];
const R5_TOWN_PLAN = {
  old_town:{ houses:R5_TOWN_HOUSES, lamps:R5_TOWN_LAMPS },
  hilltop: { houses:R5_HILL_HOUSES, lamps:R5_HILL_LAMPS, lemons:13, stucco:true, gate:[[11,12],[14,12]] },
};
const _townArt = {};
function paintTown(d){
  const own = cataPainting(d);
  if(own) return own;
  if(_townArt[d.key]) return _townArt[d.key];
  const plan = R5_TOWN_PLAN[d.key] || R5_TOWN_PLAN.old_town;
  const houses = plan.houses;
  const W = d.rows[0].length, H = d.rows.length, P = 32;
  const c = document.createElement('canvas');
  c.width = W * P; c.height = H * P;
  const g = c.getContext('2d');
  if(!g) return '';
  const rnd = (x, y, k)=>{ const s = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const at = (x, y)=> (y < 0 || y >= H || x < 0 || x >= W) ? '#' : d.rows[y][x];
  const open = ch=> '.,=t'.includes(ch);
  /* a round building stands on garden: its square's corners are grass */
  const roundOn = (x, y)=> houses.some(h=> h.tower && x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h);
  /* the ground, tile by tile */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    let ch = at(x, y);
    const X = x * P, Y = y * P;
    if(ch === 'B' && roundOn(x, y)) ch = 'g';
    if(ch === 'g' && plan.lemons && y >= plan.lemons){      // a lemon terrace: a row of little trees
      g.fillStyle = '#56703a'; g.fillRect(X, Y, P, P);
      if(y % 3 === 0){ g.fillStyle = 'rgba(70,45,20,0.45)'; g.fillRect(X, Y, P, 3); }
      const cx = X + P / 2 + (rnd(x, y, 1) - 0.5) * 6, cy = Y + P / 2 + 2, r = 9 + rnd(x, y, 2) * 3;
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.arc(cx + 2, cy + 3, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2f5a2a'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3f7434'; g.beginPath(); g.arc(cx - 2, cy - 2, r - 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f2d64a';
      for(let k = 0; k < 4; k++){
        const a = rnd(x, y, k + 4) * Math.PI * 2, rr = rnd(x, y, k + 8) * (r - 3);
        g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2.2, 0, Math.PI * 2); g.fill();
      }
      continue;
    }
    if(ch === 'w' && plan.stucco){                         // the estate's wall: pale plaster, a tiled coping
      g.fillStyle = '#cbb48a'; g.fillRect(X, Y, P, P);
      g.fillStyle = 'rgba(90,70,40,0.25)'; g.fillRect(X, Y + P - 4, P, 4); g.fillRect(X + P - 3, Y, 3, P);
      g.fillStyle = '#a5553a'; g.fillRect(X, Y, P, 7);
      g.fillStyle = 'rgba(255,220,180,0.35)'; for(let k = 0; k < 4; k++) g.fillRect(X + k * 8 + 1, Y + 1, 5, 2);
      continue;
    }
    if(ch === '#' || ch === 'x'){                          // the hill's rock
      const edge = open(at(x, y - 1)) || open(at(x, y + 1)) || open(at(x - 1, y)) || open(at(x + 1, y));
      g.fillStyle = edge ? '#4b4038' : '#362e29'; g.fillRect(X, Y, P, P);
      g.fillStyle = 'rgba(0,0,0,0.22)';
      for(let k = 0; k < 3; k++) g.fillRect(X + rnd(x, y, k) * (P - 8), Y + rnd(x, y, k + 5) * (P - 4), 8, 2);
      if(ch === 'x'){                                      // the funicular's rails
        g.fillStyle = '#26211d'; g.fillRect(X + 6, Y, P - 12, P);
        g.fillStyle = '#9a9188'; g.fillRect(X + 9, Y, 3, P); g.fillRect(X + P - 12, Y, 3, P);
        g.fillStyle = '#5a4a3c'; for(let k = 0; k < 4; k++) g.fillRect(X + 7, Y + 3 + k * 8, P - 14, 2);
      }
      continue;
    }
    if(ch === 'g'){                                        // a garden: hedges and little trees
      g.fillStyle = '#3c6332'; g.fillRect(X, Y, P, P);
      for(let k = 0; k < 3; k++){
        const cx = X + 6 + rnd(x, y, k) * (P - 12), cy = Y + 6 + rnd(x, y, k + 3) * (P - 12), r = 6 + rnd(x, y, k + 7) * 5;
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(cx + 2, cy + 3, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = k % 2 ? '#4f8a43' : '#5c9a4c'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      }
      continue;
    }
    if(ch === 'w'){                                        // the belvedere's wall
      g.fillStyle = '#5a4a3b'; g.fillRect(X, Y, P, P);
      g.fillStyle = '#7d6a55'; g.fillRect(X, Y, P, 10);
      g.fillStyle = '#3d3128'; g.fillRect(X + P - 3, Y, 3, P);
      continue;
    }
    if(ch === 'B'){ g.fillStyle = '#6d4636'; g.fillRect(X, Y, P, P); continue; }   // (each house is drawn whole below)
    if(ch === '.'){                                        // cobbles
      g.fillStyle = '#8b8174'; g.fillRect(X, Y, P, P);
      for(let r0 = 0; r0 < 4; r0++) for(let c0 = 0; c0 < 4; c0++){
        const ox = X + c0 * 8 + (r0 % 2 ? 4 : 0) - 2, oy = Y + r0 * 8 + 1;
        const t = 120 + Math.floor(rnd(x * 4 + c0, y * 4 + r0, 1) * 30);
        g.fillStyle = `rgb(${t + 14},${t + 6},${t - 6})`;
        g.beginPath(); g.ellipse(ox + 4, oy + 3, 3.4, 2.8, 0, 0, Math.PI * 2); g.fill();
      }
      continue;
    }
    /* the piazza's paving, the café's tables, the steps, the fountain's basin */
    g.fillStyle = '#d3c4a3'; g.fillRect(X, Y, P, P);
    g.strokeStyle = 'rgba(110,90,60,0.35)'; g.lineWidth = 1;
    g.strokeRect(X + 0.5, Y + 0.5, P - 1, P - 1);
    if(rnd(x, y, 2) < 0.4){ g.beginPath(); g.moveTo(X + P / 2, Y); g.lineTo(X + P / 2, Y + P); g.stroke(); }
    if(ch === '='){                                        // steps
      g.fillStyle = '#b98a58'; g.fillRect(X, Y, P, P);
      for(let k = 0; k < 4; k++){
        g.fillStyle = '#d9ad78'; g.fillRect(X, Y + k * 8, P, 2);
        g.fillStyle = 'rgba(70,40,20,0.35)'; g.fillRect(X, Y + k * 8 + 6, P, 2);
      }
    }
    if(ch === 't'){                                        // a café table, two chairs
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(X + P / 2 + 2, Y + P / 2 + 3, 10, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5a3b26'; g.fillRect(X + 2, Y + 11, 5, 10); g.fillRect(X + P - 7, Y + 11, 5, 10);
      g.fillStyle = '#f1e6cf'; g.beginPath(); g.arc(X + P / 2, Y + P / 2, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7a3a2a'; g.beginPath(); g.arc(X + P / 2 + 2, Y + P / 2 - 1, 2.5, 0, Math.PI * 2); g.fill();
    }
  }
  /* the fountain: one basin over its four tiles */
  {
    const fx = [], fy = [];
    d.rows.forEach((row, y)=>{ for(let x = 0; x < W; x++) if(row[x] === '~'){ fx.push(x); fy.push(y); } });
    if(fx.length){
      const x0 = Math.min(...fx) * P, y0 = Math.min(...fy) * P, x1 = (Math.max(...fx) + 1) * P, y1 = (Math.max(...fy) + 1) * P;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = (x1 - x0) / 2;
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(cx + 3, cy + 4, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b7a888'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3f7fa6'; g.beginPath(); g.arc(cx, cy, r - 6, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(200,235,255,0.45)'; g.lineWidth = 1.5;
      for(let k = 1; k < 4; k++){ g.beginPath(); g.arc(cx, cy, (r - 6) * k / 4, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = '#9fa3a6'; g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.fill();          // the dolphin's rock
      g.fillStyle = '#c7cbcf'; g.beginPath(); g.ellipse(cx, cy - 3, 4, 7, 0.4, 0, Math.PI * 2); g.fill();
    }
  }
  /* the estate's gate: two pillars and an iron arch between them */
  (plan.gate || []).forEach(([gx, gy])=>{
    const X = gx * P, Y = gy * P;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X + 5, Y + 3, P - 6, P - 2);
    g.fillStyle = '#e1d2ad'; g.fillRect(X + 3, Y - 2, P - 6, P);
    g.strokeStyle = '#7d6a4a'; g.lineWidth = 2; g.strokeRect(X + 3, Y - 2, P - 6, P);
    g.fillStyle = '#efe4c6'; g.beginPath(); g.arc(X + P / 2, Y + P / 2 - 3, 6, 0, Math.PI * 2); g.fill();
  });
  if(plan.gate && plan.gate.length === 2){
    const [[ax, ay], [bx]] = plan.gate;
    const mid = (ax + 1 + bx) / 2 * P, half = (bx - ax - 1) / 2 * P;
    g.strokeStyle = '#2b2622'; g.lineWidth = 3;
    g.beginPath(); g.arc(mid, ay * P + P / 2, half, Math.PI, 0); g.stroke();
    g.lineWidth = 1.5;
    for(let k = 1; k < 4; k++){ g.beginPath(); g.arc(mid, ay * P + P / 2, half * k / 4, Math.PI, 0); g.stroke(); }
  }
  /* the houses, whole: roof, ridge, the wall with the door in it */
  const sideOf = h=> h.door[1] === h.y + h.h - 1 ? 'down' : h.door[1] === h.y ? 'up' : h.door[0] === h.x ? 'left' : 'right';
  houses.forEach(h=>{
    const X = h.x * P, Y = h.y * P, Wd = h.w * P, Ht = h.h * P;
    if(h.tower){                                           // round, from above: a slate cone on a ring of stone
      const cx = X + Wd / 2, cy = Y + Ht / 2, R = Math.min(Wd, Ht) / 2 - 4;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(cx + 5, cy + 6, R, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5d566b'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(20,14,30,0.7)'; g.lineWidth = 2; g.stroke();
      const S = 12;
      for(let k = 0; k < S; k++){
        const a0 = k / S * Math.PI * 2, a1 = (k + 1) / S * Math.PI * 2;
        g.fillStyle = k % 2 ? h.roof : '#4a3d66';
        g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R - 7, a0, a1); g.closePath(); g.fill();
      }
      g.fillStyle = 'rgba(255,240,255,0.10)';                // the light falls from the upper left
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R - 7, Math.PI, Math.PI * 1.5); g.closePath(); g.fill();
      for(let k = 0; k < 8; k++){                          // its windows, all the way round
        const a = (k + 0.5) / 8 * Math.PI * 2, wx = cx + Math.cos(a) * (R - 3.5), wy = cy + Math.sin(a) * (R - 3.5);
        g.fillStyle = '#c9a4ff'; g.beginPath(); g.arc(wx, wy, 2.6, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#d9b45a'; g.beginPath(); g.arc(cx, cy, 4, 0, Math.PI * 2); g.fill();
      return;
    }
    g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(X + 3, Y + 4, Wd, Ht);
    g.fillStyle = h.roof; g.fillRect(X + 1, Y + 1, Wd - 2, Ht - 2);
    g.strokeStyle = 'rgba(40,20,10,0.35)'; g.lineWidth = 1;
    for(let yy = Y + 6; yy < Y + Ht - 2; yy += 6){ g.beginPath(); g.moveTo(X + 2, yy); g.lineTo(X + Wd - 2, yy); g.stroke(); }
    g.fillStyle = 'rgba(255,230,200,0.18)';
    if(h.w >= h.h) g.fillRect(X + 2, Y + Ht / 2 - 2, Wd - 4, 4); else g.fillRect(X + Wd / 2 - 2, Y + 2, 4, Ht - 4);
    g.strokeStyle = 'rgba(30,15,8,0.6)'; g.lineWidth = 2; g.strokeRect(X + 1, Y + 1, Wd - 2, Ht - 2);
    if(h.church){                                          // a bell tower and its cross
      const tx = X + Wd / 2 - 24, ty = Y + 18;
      g.fillStyle = '#7d8590'; g.fillRect(tx, ty, 48, 48);
      g.strokeStyle = '#3b4048'; g.strokeRect(tx, ty, 48, 48);
      g.fillStyle = '#e9e2cf'; g.fillRect(tx + 21, ty + 8, 6, 32); g.fillRect(tx + 12, ty + 16, 24, 6);
      g.fillStyle = 'rgba(160,110,230,0.75)'; g.beginPath(); g.arc(X + Wd / 2, Y + Ht - 66, 11, 0, Math.PI * 2); g.fill();
    }
    if(h.grand){                                           // the opera house: columns along its front
      g.fillStyle = '#e4d8bf';
      for(let k = 0; k < h.w; k++) g.fillRect(X + k * P + 12, Y + Ht - 16, 8, 14);
      g.fillStyle = 'rgba(255,215,140,0.25)'; g.beginPath(); g.arc(X + Wd / 2, Y + Ht / 2 - 10, 34, 0, Math.PI * 2); g.fill();
    }
    if(h.villa){                                           // the villa: a courtyard open to the sky, a loggia along its front
      const qx = X + 3 * P, qy = Y + 2 * P, qw = Wd - 6 * P, qh = 2 * P;
      g.fillStyle = 'rgba(40,20,10,0.55)'; g.fillRect(qx - 4, qy - 4, qw + 8, qh + 8);
      g.fillStyle = '#d9c9a6'; g.fillRect(qx, qy, qw, qh);
      g.strokeStyle = 'rgba(110,90,60,0.35)'; g.lineWidth = 1;
      for(let k = 1; k < qw / 16; k++){ g.beginPath(); g.moveTo(qx + k * 16, qy); g.lineTo(qx + k * 16, qy + qh); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(qx, qy, qw, 6);
      g.fillStyle = '#3f6b36'; g.beginPath(); g.arc(qx + qw / 2, qy + qh / 2, 13, 0, Math.PI * 2); g.fill();     // an orange tree
      g.fillStyle = '#f0a03a';
      for(let k = 0; k < 5; k++){ const a = k * 1.3; g.beginPath(); g.arc(qx + qw / 2 + Math.cos(a) * 7, qy + qh / 2 + Math.sin(a) * 7, 2.2, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#ece0c4';
      for(let k = 0; k < h.w; k++) if(k !== 4 && k !== 5) g.fillRect(X + k * P + 12, Y + Ht - 16, 8, 14);
    }
  });
  /* dusk over everything, then the lamps */
  g.fillStyle = 'rgba(22,26,64,0.34)'; g.fillRect(0, 0, W * P, H * P);
  houses.filter(h=> h.tower).forEach(h=>{                  // the tower's faint purple light
    const cx = (h.x + h.w / 2) * P, cy = (h.y + h.h / 2) * P, R = Math.min(h.w, h.h) * P;
    const gr = g.createRadialGradient(cx, cy, R * 0.3, cx, cy, R);
    gr.addColorStop(0, 'rgba(170,120,255,0.30)'); gr.addColorStop(1, 'rgba(170,120,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  });
  plan.lamps.forEach(([lx, ly])=>{
    const cx = lx * P + P / 2, cy = ly * P + P / 2;
    const gr = g.createRadialGradient(cx, cy, 2, cx, cy, P * 2.2);
    gr.addColorStop(0, 'rgba(255,214,130,0.55)'); gr.addColorStop(1, 'rgba(255,190,90,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, P * 2.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a2420'; g.fillRect(cx - 2, cy - 2, 4, 9);
    g.fillStyle = '#ffe2a0'; g.beginPath(); g.arc(cx, cy - 4, 4, 0, Math.PI * 2); g.fill();
  });
  /* lit doors and windows, and each house's name over its door */
  g.textAlign = 'center'; g.textBaseline = 'middle';
  houses.forEach(h=>{
    const side = sideOf(h), [dx, dy] = h.door, DX = dx * P, DY = dy * P;
    const glow = (x, y, w, hh)=>{ g.fillStyle = h.tower ? '#d8b8ff' : '#ffd98a'; g.fillRect(x, y, w, hh); g.fillStyle = h.tower ? 'rgba(190,140,255,0.4)' : 'rgba(255,200,110,0.35)'; g.fillRect(x - 2, y - 2, w + 4, hh + 4); };
    if(h.wide && side === 'down') glow(DX + 12, DY + P - 9, P + 8, 8);          // a great double door
    else if(side === 'down') glow(DX + 9, DY + P - 9, 14, 8);
    else if(side === 'up') glow(DX + 9, DY + 1, 14, 8);
    else if(side === 'left') glow(DX + 1, DY + 9, 8, 14);
    else glow(DX + P - 9, DY + 9, 8, 14);
    /* windows along the same wall (a round tower's are already lit) */
    for(let k = 0; k < (h.tower ? 0 : side === 'down' || side === 'up' ? h.w : h.h); k++){
      const wx = side === 'down' || side === 'up' ? h.x + k : (side === 'left' ? h.x : h.x + h.w - 1);
      const wy = side === 'down' ? h.y + h.h - 1 : side === 'up' ? h.y : h.y + k;
      if((wx === dx && wy === dy) || (h.wide && wx === dx + 1 && wy === dy) || rnd(wx, wy, 9) < 0.35) continue;
      g.fillStyle = rnd(wx, wy, 4) < 0.7 ? '#f6cf7a' : '#40465c';
      if(side === 'down') g.fillRect(wx * P + 11, wy * P + P - 7, 10, 5);
      else if(side === 'up') g.fillRect(wx * P + 11, wy * P + 2, 10, 5);
      else if(side === 'left') g.fillRect(wx * P + 2, wy * P + 11, 5, 10);
      else g.fillRect(wx * P + P - 7, wy * P + 11, 5, 10);
    }
    /* the sign: inside the roof, by the door */
    const label = h.name;
    g.font = '700 11px system-ui, sans-serif';
    const tw = g.measureText(label).width + 10;
    let sx = (h.x + h.w / 2) * P, sy = (h.y + h.h / 2) * P;
    if(side === 'down') sy = (h.y + h.h) * P - 26;
    else if(side === 'up') sy = h.y * P + 26;
    else if(side === 'left'){ sx = h.x * P + tw / 2 + 6; sy = DY + P / 2 - 18; }
    else { sx = (h.x + h.w) * P - tw / 2 - 6; sy = DY + P / 2 - 18; }
    if(side === 'down' || side === 'up') sx = Math.max(h.x * P + tw / 2 + 4, Math.min((h.x + h.w) * P - tw / 2 - 4, DX + (h.wide ? P : P / 2)));
    g.fillStyle = 'rgba(30,20,12,0.55)'; g.fillRect(sx - tw / 2 + 1.5, sy - 7.5, tw, 16);
    g.fillStyle = '#f3e7cc'; g.fillRect(sx - tw / 2, sy - 9, tw, 16);
    g.fillStyle = '#3a2817'; g.fillText(label, sx, sy - 1);
  });
  try { _townArt[d.key] = c.toDataURL('image/png'); } catch(e){ _townArt[d.key] = ''; }
  return _townArt[d.key];
}
/* Ugo's back room, drawn from its grid (2.91): plank floor, plaster walls,
   racks of the Family's dark coats, the cutting table with its cloth and
   shears, two dummies, bolts of cloth, the long mirror, the lamp. */
function paintTailor(d){
  const own = cataPainting(d);
  if(own) return own;
  if(_townArt[d.key]) return _townArt[d.key];
  const W = d.rows[0].length, H = d.rows.length, P = 32;
  const c = document.createElement('canvas');
  c.width = W * P; c.height = H * P;
  const g = c.getContext('2d');
  if(!g) return '';
  const rnd = (x, y, k)=>{ const s = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const at = (x, y)=> (y < 0 || y >= H || x < 0 || x >= W) ? '#' : d.rows[y][x];
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const ch = at(x, y), X = x * P, Y = y * P;
    if(ch === '#'){
      const face = at(x, y + 1) !== '#';
      g.fillStyle = face ? '#c9b48e' : '#5b4634'; g.fillRect(X, Y, P, P);
      if(face){ g.fillStyle = '#8a6a48'; g.fillRect(X, Y + P - 6, P, 6); }
      continue;
    }
    /* planks */
    const tone = 104 + Math.floor(rnd(x, y) * 12);
    g.fillStyle = `rgb(${tone},${tone - 38},${tone - 72})`; g.fillRect(X, Y, P, P);
    g.fillStyle = 'rgba(40,22,10,0.4)'; g.fillRect(X, Y + 15, P, 1.5); g.fillRect(X + (y % 2 ? 10 : 24), Y, 1.5, P);
    /* a worn red rug in the middle of the room */
    if(x >= 5 && x <= 8 && y >= 6 && y <= 8){
      g.fillStyle = '#7e2f2a'; g.fillRect(X, Y, P, P);
      g.fillStyle = 'rgba(230,190,120,0.35)';
      if(x === 5) g.fillRect(X + 3, Y, 2, P);
      if(x === 8) g.fillRect(X + P - 5, Y, 2, P);
      if(y === 6) g.fillRect(X, Y + 3, P, 2);
      if(y === 8) g.fillRect(X, Y + P - 5, P, 2);
    }
    if(ch === 'k'){                                        // a rack of the Family's coats
      g.fillStyle = '#4b3a2c'; g.fillRect(X, Y + 4, P, 3);
      for(let k = 0; k < 3; k++){
        const cx = X + 4 + k * 9;
        g.fillStyle = rnd(x, y, k) < 0.5 ? '#23262f' : '#30343f'; g.fillRect(cx, Y + 6, 8, 22);
        g.fillStyle = '#9a2a2a'; g.fillRect(cx, Y + 15, 8, 3);              // the red sash
      }
    }
    if(ch === 't'){                                        // the cutting table
      const L = at(x - 1, y) !== 't', R = at(x + 1, y) !== 't', T = at(x, y - 1) !== 't', B = at(x, y + 1) !== 't';
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X + (L ? 3 : 0), Y + (T ? 5 : 0), P - (L ? 3 : 0), P - (T ? 5 : 0));
      g.fillStyle = '#c29a64'; g.fillRect(X + (L ? 1 : 0), Y + (T ? 2 : 0), P - (L ? 1 : 0) - (R ? 3 : 0), P - (T ? 2 : 0) - (B ? 4 : 0));
      g.fillStyle = '#6e4c2c';
      if(L) g.fillRect(X + 1, Y, 2, P); if(R) g.fillRect(X + P - 5, Y, 2, P);
      if(T) g.fillRect(X, Y + 2, P, 2); if(B) g.fillRect(X, Y + P - 6, P, 2);
      /* on it: the dark cloth of a coat being cut, chalk lines, the shears, a tape */
      if(x % 2 === 0){ g.fillStyle = '#262a35'; g.fillRect(X + 4, Y + 7, P - 6, P - 15); g.fillStyle = '#f4efe0'; g.fillRect(X + 8, Y + 12, 12, 1.5); }
      else if(y % 2){ g.strokeStyle = '#9aa0a8'; g.lineWidth = 2; g.beginPath(); g.arc(X + 9, Y + 18, 3.5, 0, Math.PI * 2); g.arc(X + 9, Y + 9, 3.5, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(X + 12, Y + 16); g.lineTo(X + 26, Y + 6); g.moveTo(X + 12, Y + 11); g.lineTo(X + 26, Y + 20); g.stroke(); }
      else { g.fillStyle = '#e6c84a'; g.fillRect(X + 2, Y + 14, P - 4, 3); }
    }
    if(ch === 'o'){                                        // a dummy
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(X + P / 2 + 2, Y + P / 2 + 4, 10, 12, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d8c7a6'; g.beginPath(); g.ellipse(X + P / 2, Y + P / 2, 10, 12, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2b2f3a'; g.fillRect(X + P / 2 - 8, Y + P / 2 - 2, 16, 10);
      g.fillStyle = '#6b5236'; g.fillRect(X + P / 2 - 1.5, Y + 4, 3, 6);
    }
    if(ch === 'c'){                                        // bolts of cloth
      const hues = ['#7a2a2a', '#2e3b5a', '#5a6a3a', '#8a7a4a'];
      for(let k = 0; k < 3; k++){
        g.fillStyle = hues[Math.floor(rnd(x, y, k) * hues.length)];
        g.fillRect(X + 2, Y + 3 + k * 9, P - 4, 7);
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(X + 2, Y + 3 + k * 9, P - 4, 2);
      }
    }
  }
  /* the long mirror on the back wall, over its tile */
  const mt = (d.things || []).find(t=> t.verb === 'Mirror');
  if(mt){
    const X = mt.x * P, Y = (mt.y - 1) * P;
    g.fillStyle = '#6b4a2a'; g.fillRect(X + 6, Y + 1, P - 12, P + 4);
    g.fillStyle = '#bcd3dc'; g.fillRect(X + 9, Y + 4, P - 18, P - 2);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(X + 11, Y + 6, 3, P - 8);
  }
  /* the lamp's warm light */
  const gr = g.createRadialGradient(W * P / 2, H * P / 2, 10, W * P / 2, H * P / 2, W * P * 0.6);
  gr.addColorStop(0, 'rgba(255,214,140,0.18)'); gr.addColorStop(1, 'rgba(30,20,40,0.28)');
  g.fillStyle = gr; g.fillRect(0, 0, W * P, H * P);
  try { _townArt[d.key] = c.toDataURL('image/png'); } catch(e){ _townArt[d.key] = ''; }
  return _townArt[d.key];
}

/* ============================================================
   THE TOWN'S ROOMS, DRAWN (3.03)
   Every room is drawn from its grid (paintRoom) until it has a painting of
   its own — assets/zones/<room key>.png, at 32 px a tile (any size of the
   same shape will do), painted over its reference in handover/art-rooms/.
   Each room's look — its floor, walls, cloth, what is on its shelves — is
   R5_ROOM_LOOKS; what is only in one room (the opera's curtain, the police
   station's poster, the gelateria's board) is drawn by R5_ROOM_DECOR. The
   grid letters are 13-walkmap.js's (WALK_SOLID). Seeded by position, so it
   never shimmers.
   ============================================================ */
const R5_ROOM_LOOKS = {
  room_marta:     { floor:'planks', fa:'#9b6b42', wall:'#4d3d30', face:'#dcc59e', trim:'#7a5034', rug:'#7d3a2e',
                    shelf:'plates', stove:'stove', cloth:'check-blue', quilt:'#46708f', plant:'basil',
                    windows:[[5,0]], frames:[[4,0,'boat'],[6,0,'net']] },
  room_lucia:     { floor:'planks', fa:'#a07650', wall:'#4a3c30', face:'#d6c7a8', trim:'#6e5038', rug:'#3f6b7a',
                    shelf:'floats', cloth:'wood', quilt:'#a8573e', windows:[[3,0]], frames:[[6,0,'shells']] },
  room_station:   { floor:'tiles', fa:'#b9b2a2', fb:'#8f8a7c', wall:'#3e4048', face:'#c9c2ae', trim:'#5a4a3a',
                    shelf:'files', counter:'ticket', bench:'#7a5232', windows:[[2,0],[10,0]] },
  room_customs:   { floor:'tiles', fa:'#a9a291', fb:'#7e7868', wall:'#3c3a36', face:'#bdb59f', trim:'#4e4234',
                    shelf:'files', counter:'wood', bench:'#6b4a2e', windows:[[4,0],[8,0]] },
  room_warehouse: { floor:'stone', fa:'#8d8170', wall:'#3e352c', face:'#a8977c', trim:'#5a4632', crate:'family', barrel:'barrel',
                    windows:[[3,0],[9,0]] },
  room_nonna:     { floor:'terracotta', fa:'#b7643f', wall:'#4e3a30', face:'#e4d2b0', trim:'#7d5236', rug:'#8e4a6a',
                    shelf:'jars', stove:'fire', cloth:'lace', chair:'#7b4f8a', quilt:'#c9879a', plant:'basil',
                    windows:[[3,0]], frames:[[5,0,'photo'],[6,0,'photo2']] },
  room_barber:    { floor:'checker', fa:'#e8e2d4', fb:'#2e2c2c', wall:'#3c3436', face:'#cbd9d0', trim:'#5a4434',
                    shelf:'bottles', bench:'#6e4a30', windows:[] },
  room_opera:     { floor:'carpet', fa:'#7a1f28', wall:'#2b1a1e', face:'#6b2a32', trim:'#c9a24a', windows:[] },
  room_police:    { floor:'planks', fa:'#8a7a62', wall:'#3a3a40', face:'#b8c0b0', trim:'#4e4a40',
                    shelf:'files', plant:'coat', quilt:'#7a7a74', windows:[[9,0]] },
  room_post:      { floor:'planks', fa:'#9a7a52', wall:'#43382e', face:'#d8c49a', trim:'#6a4c30',
                    shelf:'mail', counter:'grille', crate:'parcel', barrel:'sack', windows:[[1,0],[9,0]] },
  room_cafe:      { floor:'checker', fa:'#ece4d2', fb:'#7a2e2a', wall:'#3a2a24', face:'#d9b98a', trim:'#5a3824',
                    shelf:'cups', counter:'marble', cloth:'marble', chair:'#6a4428', windows:[] },
  room_trattoria: { floor:'terracotta', fa:'#b8693f', wall:'#4a3226', face:'#e2c79a', trim:'#74482c',
                    shelf:'wine', stoveAt:{ '3,1':'oven', '4,1':'oven', '8,1':'range', '9,1':'range' }, counter:'pass',
                    cloth:'check-red', chair:'#6a4428', windows:[] },
  room_gelateria: { floor:'checker', fa:'#f2ece0', fb:'#9cc7c0', wall:'#3e3a40', face:'#f0d6dc', trim:'#9a6a7a',
                    shelf:'sweets', counter:'glass', cloth:'marble', chair:'#c0607a', plant:'basil', windows:[] },
  room_grandpa:   { floor:'planks', fa:'#94683f', wall:'#4a3a2c', face:'#d8c49a', trim:'#73502f', rug:'#5a7a3a',
                    shelf:'jars', stove:'fire', cloth:'wood', chair:'#7a5232', quilt:'#5a7a9a', plant:'basket', rocking:true,
                    windows:[[3,0]], frames:[[6,0,'lemons']] },
  room_lemons:    { floor:'boards', fa:'#a58a5a', wall:'#4a3e2c', face:'#d8c896', trim:'#76603a', crate:'lemons', cloth:'sort',
                    plant:'basket', windows:[[3,0],[6,0],[9,0]] },
  room_guards:    { floor:'stone', fa:'#8a8478', wall:'#35353a', face:'#a8a89c', trim:'#4a4640',
                    shelf:'lockers', stove:'stove', cloth:'baize', quilt:'#5e6a5a', windows:[[3,0],[10,0]] },
  /* (3.04) the Padrino's villa: a marble hall up the middle, the salon and the
     dining room either side of it, the study and the kitchen at the back */
  villa:          { floor:'planks', fa:'#7a4e30', wall:'#2e2420', face:'#e8dcc4', trim:'#8a6a3a', rug:'#6a1e2e',
                    shelf:'books', stove:'fire', cloth:'white', chair:'#6a1e2a', plant:'basil',
                    windows:[[4,0],[14,0]],
                    zones:[ { x0:8, y0:1, x1:10, y1:13, floor:'checker', fa:'#efe8dc', fb:'#3a3434' },
                            { x0:12, y0:1, x1:17, y1:5, floor:'terracotta', fa:'#b8693f', shelf:'jars', stove:'range', cloth:'wood', chair:'#7a5232' },
                            { x0:12, y0:7, x1:17, y1:13, fa:'#6a3a22', shelf:'plates' } ] },
};
const _roomArt = {};
function paintRoom(d){
  const own = cataPainting(d);
  if(own) return own;
  if(_roomArt[d.key]) return _roomArt[d.key];
  const W = d.rows[0].length, H = d.rows.length, P = 32;
  const c = document.createElement('canvas');
  c.width = W * P; c.height = H * P;
  const g = c.getContext('2d');
  if(!g) return '';
  const L = Object.assign({ floor:'planks', fa:'#9a6a40', wall:'#4a3c30', face:'#d8c49e', trim:'#6e4e34', rug:'#7d3a2e',
    shelf:'plates', stove:'stove', counter:'wood', cloth:'wood', chair:'#7a5232', quilt:'#5a7a9a', plant:'basil',
    crate:'plain', barrel:'barrel', bench:'#7a5232', windows:[], frames:[] }, R5_ROOM_LOOKS[d.key] || {});
  /* (3.04) a part of the room can have a look of its own: `zones`, each
     { x0, y0, x1, y1 } and whatever it changes */
  const zones = L.zones || [];
  const lookAt = (x, y)=>{ const z = zones.find(z=> x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1); return z ? Object.assign({}, L, z) : L; };
  const rnd = (x, y, k)=>{ const s = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const at = (x, y)=> (y < 0 || y >= H || x < 0 || x >= W) ? '#' : d.rows[y][x];
  const R = new RoomPen(g, P, rnd);
  /* 1. the floor, under everything */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const ch = at(x, y);
    if(ch === '#') continue;
    const Lt = lookAt(x, y);
    R.floor(x, y, ch === '_' ? 'stage' : Lt.floor, Lt);
    if(ch === ',') R.rug(x, y, Lt.rug, at(x - 1, y) !== ',', at(x + 1, y) !== ',', at(x, y - 1) !== ',', at(x, y + 1) !== ',');
  }
  /* 2. the walls: the back wall's face where the room is below it */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    if(at(x, y) !== '#') continue;
    R.wall(x, y, L, at(x, y + 1) !== '#' && y + 1 < H, at(x - 1, y) !== '#', at(x + 1, y) !== '#');
  }
  (L.windows || []).forEach(([x, y])=> R.window(x, y, d.key));
  (L.frames || []).forEach(([x, y, k])=> R.frame(x, y, k));
  /* 3. the furniture */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const ch = at(x, y), X = x * P, Y = y * P, Lt = lookAt(x, y);
    const n = { l:at(x - 1, y), r:at(x + 1, y), u:at(x, y - 1), d:at(x, y + 1) };
    switch(ch){
      case 'S': R.shelf(X, Y, Lt.shelf, x, y); break;
      case 'K': R.counter(X, Y, Lt.counter, n.l !== 'K', n.r !== 'K', x, y); break;
      case 'F': R.stove(X, Y, (Lt.stoveAt && Lt.stoveAt[x + ',' + y]) || Lt.stove, n, x, y); break;
      case 'D': R.desk(X, Y, n.l !== 'D', n.r !== 'D', x, y); break;
      case 'R': R.bed(X, Y, Lt.quilt, n.u === 'R', n.d === 'R', d.key === 'room_guards'); break;
      case 'H': R.piano(X, Y, n.l !== 'H', n.r !== 'H'); break;
      case 'P': R.plant(X, Y, Lt.plant, x, y); break;
      case 'A': R.armchair(X, Y, Lt.chair, !!Lt.rocking); break;
      case 'C': R.chair(X, Y, Lt.chair, n); break;
      case 't': R.table(X, Y, Lt.cloth, n.l !== 't', n.r !== 't', n.u !== 't', n.d !== 't', x, y); break;
      case 'c': R.crate(X, Y, Lt.crate, x, y); break;
      case 'b': R.barrel(X, Y, Lt.barrel, x, y); break;
      case 'o': R.statue(X, Y); break;
      case 'Z': R.seats(X, Y, n.l !== 'Z', n.r !== 'Z'); break;
      case 'J': R.bars(X, Y, n); break;
      case 'N': R.nets(X, Y, x, y); break;
      case 'V': R.barberChair(X, Y); break;
      case 'L': R.bench(X, Y, L.bench, n.l !== 'L', n.r !== 'L'); break;
      case '_': if(n.d !== '_' && n.d !== '#') R.stageLip(X, Y); break;
    }
  }
  /* 4. the way out: a doorway in the bottom wall, and a mat inside it */
  (d.things || []).filter(t=> t.verb === 'Out').forEach(t=> R.door(t.x, t.y, L));
  /* 5. what only this room has */
  if(R5_ROOM_DECOR[d.key]) R5_ROOM_DECOR[d.key](g, P, R, d, L);
  /* 6. the lamplight, warm in the middle and dimmer in the corners */
  const cx = W * P / 2, cy = H * P * 0.45;
  const gr = g.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, H) * P * 0.62);
  gr.addColorStop(0, 'rgba(255,214,150,0.16)'); gr.addColorStop(1, 'rgba(26,16,30,0.30)');
  g.fillStyle = gr; g.fillRect(0, 0, W * P, H * P);
  try { _roomArt[d.key] = c.toDataURL('image/png'); } catch(e){ _roomArt[d.key] = ''; }
  return _roomArt[d.key];
}
/* The pen the rooms are drawn with: one method for each kind of thing. */
function RoomPen(g, P, rnd){ this.g = g; this.P = P; this.rnd = rnd; }
RoomPen.prototype = {
  shade(hex, k){                                  // a colour made lighter (k > 0) or darker (k < 0)
    const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const f = v=> Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
    return `rgb(${f(r)},${f(gg)},${f(b)})`;
  },
  box(x, y, w, h, fill, line){ const g = this.g; g.fillStyle = fill; g.fillRect(x, y, w, h); if(line){ g.strokeStyle = line; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); } },
  shadow(x, y, w, h, a){ this.g.fillStyle = `rgba(0,0,0,${a || 0.28})`; this.g.fillRect(x + 2, y + 3, w, h); },
  circle(x, y, r, fill){ const g = this.g; g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); },
  floor(x, y, kind, L){
    const g = this.g, P = this.P, X = x * P, Y = y * P, v = this.rnd(x, y);
    if(kind === 'stage'){
      this.box(X, Y, P, P, this.shade('#b8874e', (v - 0.5) * 0.1));
      g.fillStyle = 'rgba(70,40,15,0.45)'; for(let k = 0; k < 4; k++) g.fillRect(X, Y + k * 8, P, 1);
      return;
    }
    if(kind === 'tiles' || kind === 'checker'){
      const dark = (x + y) % 2 === 1;
      this.box(X, Y, P, P, kind === 'checker' ? (dark ? L.fb : L.fa) : this.shade(dark ? L.fb : L.fa, (v - 0.5) * 0.08));
      g.strokeStyle = 'rgba(40,30,20,0.25)'; g.lineWidth = 1; g.strokeRect(X + 0.5, Y + 0.5, P - 1, P - 1);
      return;
    }
    if(kind === 'terracotta'){
      for(let k = 0; k < 4; k++){
        const qx = X + (k % 2) * 16, qy = Y + (k >> 1) * 16;
        this.box(qx, qy, 16, 16, this.shade(L.fa, (this.rnd(x, y, k) - 0.5) * 0.16));
      }
      g.fillStyle = 'rgba(70,35,20,0.35)'; g.fillRect(X, Y + 15.5, P, 1); g.fillRect(X + 15.5, Y, 1, P);
      return;
    }
    if(kind === 'stone'){
      this.box(X, Y, P, P, this.shade(L.fa, (v - 0.5) * 0.18));
      g.strokeStyle = 'rgba(30,24,18,0.35)'; g.lineWidth = 1; g.strokeRect(X + 0.5, Y + 0.5, P - 1, P - 1);
      return;
    }
    if(kind === 'carpet'){
      this.box(X, Y, P, P, this.shade(L.fa, (v - 0.5) * 0.06));
      g.fillStyle = 'rgba(230,180,80,0.10)'; if((x + y) % 2 === 0) g.fillRect(X + 12, Y + 12, 8, 8);
      return;
    }
    /* planks or boards: boards are the wide, pale ones of a shed */
    this.box(X, Y, P, P, this.shade(L.fa, (v - 0.5) * 0.14));
    g.fillStyle = 'rgba(40,22,10,0.38)';
    if(kind === 'boards'){ g.fillRect(X + (y % 2 ? 6 : 20), Y, 1.5, P); g.fillRect(X, Y + P - 1, P, 1); }
    else { g.fillRect(X, Y + 15, P, 1.5); g.fillRect(X, Y + P - 1, P, 1); g.fillRect(X + (y % 2 ? 10 : 24), Y, 1.5, 15); g.fillRect(X + (y % 2 ? 22 : 6), Y + 16, 1.5, 16); }
  },
  rug(x, y, col, L0, R0, T0, B0){
    const g = this.g, P = this.P, X = x * P, Y = y * P;
    const x0 = X + (L0 ? 3 : 0), y0 = Y + (T0 ? 3 : 0), w = P - (L0 ? 3 : 0) - (R0 ? 3 : 0), h = P - (T0 ? 3 : 0) - (B0 ? 3 : 0);
    this.box(x0, y0, w, h, col);
    g.fillStyle = 'rgba(240,210,150,0.45)';
    if(L0) g.fillRect(x0 + 2, y0, 2, h); if(R0) g.fillRect(x0 + w - 4, y0, 2, h);
    if(T0) g.fillRect(x0, y0 + 2, w, 2); if(B0) g.fillRect(x0, y0 + h - 4, w, 2);
    g.fillStyle = 'rgba(255,230,180,0.18)'; if((x + y) % 2 === 0) { g.beginPath(); g.moveTo(X + 16, Y + 8); g.lineTo(X + 24, Y + 16); g.lineTo(X + 16, Y + 24); g.lineTo(X + 8, Y + 16); g.closePath(); g.fill(); }
  },
  wall(x, y, L, face, openL, openR){
    const g = this.g, P = this.P, X = x * P, Y = y * P;
    if(!face){ this.box(X, Y, P, P, L.wall); return; }
    this.box(X, Y, P, P, L.face);
    g.fillStyle = this.shade(L.face, -0.06); g.fillRect(X, Y, P, 5);             // the top of the wall, seen over
    g.fillStyle = L.wall; g.fillRect(X, Y, P, 3);
    g.fillStyle = L.trim; g.fillRect(X, Y + P - 6, P, 6);                         // the skirting
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(X, Y + P - 1, P, 1);
  },
  window(x, y, key){
    const g = this.g, P = this.P, X = x * P, Y = y * P;
    this.box(X + 6, Y + 5, P - 12, P - 13, '#5a3f2a');
    const sky = g.createLinearGradient(0, Y + 7, 0, Y + P - 10);
    sky.addColorStop(0, '#2a2f5c'); sky.addColorStop(1, '#b06a6a');                 // dusk
    g.fillStyle = sky; g.fillRect(X + 8, Y + 7, P - 16, P - 17);
    if(key === 'room_grandpa'){ g.fillStyle = 'rgba(190,120,255,0.75)'; g.fillRect(X + 18, Y + 9, 3, 8); }   // the tower's purple light
    g.fillStyle = '#f6efe0'; g.fillRect(X + 15.5, Y + 7, 1, P - 17); g.fillRect(X + 8, Y + 13, P - 16, 1);
    this.circle(X + 11, Y + 10, 0.9, '#fff7d0'); this.circle(X + 21, Y + 9, 0.7, '#fff7d0');
  },
  frame(x, y, kind){
    const g = this.g, P = this.P, X = x * P, Y = y * P;
    this.box(X + 7, Y + 6, P - 14, P - 15, '#7a5a32');
    const ix = X + 9, iy = Y + 8, iw = P - 18, ih = P - 19;
    if(kind === 'boat'){ this.box(ix, iy, iw, ih, '#9cc3d6'); g.fillStyle = '#5a3a24'; g.fillRect(ix + 2, iy + ih - 5, iw - 4, 3); g.fillStyle = '#f2ece0'; g.beginPath(); g.moveTo(ix + iw / 2, iy + 1); g.lineTo(ix + iw / 2, iy + ih - 5); g.lineTo(ix + iw - 3, iy + ih - 5); g.closePath(); g.fill(); }
    else if(kind === 'net'){ this.box(ix, iy, iw, ih, '#c8b48a'); g.strokeStyle = '#6a5436'; g.lineWidth = 0.8; for(let k = 2; k < iw; k += 3){ g.beginPath(); g.moveTo(ix + k, iy); g.lineTo(ix + k - 3, iy + ih); g.stroke(); } }
    else if(kind === 'shells'){ this.box(ix, iy, iw, ih, '#e8dcc0'); this.circle(ix + 4, iy + 5, 2.2, '#e8a090'); this.circle(ix + iw - 4, iy + 4, 2, '#f0c8a0'); this.circle(ix + iw / 2, iy + ih - 3, 2.4, '#d8b8e0'); }
    else if(kind === 'photo' || kind === 'photo2'){ this.box(ix, iy, iw, ih, '#c9b590'); g.fillStyle = '#6a5440'; this.circle(ix + iw / 2 - (kind === 'photo2' ? 3 : 0), iy + 4, 2, '#6a5440'); g.fillRect(ix + iw / 2 - 3 - (kind === 'photo2' ? 3 : 0), iy + 6, 6, ih - 6); if(kind === 'photo2'){ this.circle(ix + iw / 2 + 4, iy + 5, 1.6, '#6a5440'); g.fillRect(ix + iw / 2 + 2, iy + 7, 4, ih - 7); } }
    else if(kind === 'lemons'){ this.box(ix, iy, iw, ih, '#8ab0c8'); this.circle(ix + 4, iy + ih - 4, 2.4, '#f2d64a'); this.circle(ix + 8, iy + ih - 5, 2.4, '#f2d64a'); g.fillStyle = '#4a7a3a'; g.fillRect(ix + 3, iy + 2, iw - 6, 3); }
  },
  shelf(X, Y, kind, x, y){
    const g = this.g, P = this.P, rnd = this.rnd;
    this.shadow(X + 1, Y + 1, P - 2, P - 3, 0.3);
    const wood = kind === 'lockers' ? '#5a6068' : kind === 'mail' ? '#7a5a36' : '#6e4a2c';
    this.box(X + 1, Y + 1, P - 2, P - 3, wood);
    this.box(X + 3, Y + 3, P - 6, P - 7, this.shade(wood, -0.35));
    if(kind === 'lockers'){
      this.box(X + 3, Y + 3, P - 6, P - 7, '#6e7680');
      g.fillStyle = '#4a5058'; g.fillRect(X + 15.5, Y + 3, 1, P - 7);
      for(let k = 0; k < 3; k++){ g.fillRect(X + 6, Y + 7 + k * 3, 6, 1); g.fillRect(X + 20, Y + 7 + k * 3, 6, 1); }
      this.circle(X + 13, Y + 18, 1.2, '#c9c9c9'); this.circle(X + 19, Y + 18, 1.2, '#c9c9c9');
      return;
    }
    if(kind === 'mail'){                          // pigeonholes, a letter in most
      for(let r = 0; r < 3; r++) for(let k = 0; k < 3; k++){
        const qx = X + 4 + k * 8, qy = Y + 4 + r * 8;
        this.box(qx, qy, 7, 7, '#3e2a18');
        if(rnd(x, y, r * 3 + k) < 0.75){ this.box(qx + 1, qy + 2, 5, 4, rnd(x, y, r + k + 9) < 0.2 ? '#e6c8a0' : '#f4efe2'); }
      }
      return;
    }
    for(let r = 0; r < 3; r++){
      const sy = Y + 4 + r * 8;
      g.fillStyle = this.shade(wood, 0.15); g.fillRect(X + 3, sy + 7, P - 6, 1.5);
      for(let k = 0; k < 4; k++){
        const qx = X + 4 + k * 6, v = rnd(x, y, r * 4 + k);
        if(kind === 'plates'){ this.circle(qx + 3, sy + 4, 2.6, '#f2ece0'); this.circle(qx + 3, sy + 4, 1.2, '#7a9ab8'); }
        else if(kind === 'jars'){ this.box(qx + 1, sy + 1, 4, 6, ['#d8a040', '#c85a40', '#8aa850', '#e8d070'][Math.floor(v * 4)]); g.fillStyle = '#e8e0d0'; g.fillRect(qx + 1, sy, 4, 1.5); }
        else if(kind === 'bottles'){ this.box(qx + 2, sy + 1, 3, 6, ['#3a8a6a', '#a8d0e0', '#c86a4a', '#e0c070'][Math.floor(v * 4)]); g.fillStyle = '#ddd'; g.fillRect(qx + 2.5, sy - 1, 2, 2); }
        else if(kind === 'files'){ this.box(qx, sy + 1, 5, 6, ['#a8946a', '#7a8a9a', '#9a6a5a', '#c8b88a'][Math.floor(v * 4)]); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(qx + 1, sy + 3, 3, 1); }
        else if(kind === 'wine'){ this.circle(qx + 3, sy + 4, 2.6, '#2a1a1a'); this.circle(qx + 3, sy + 4, 1.4, v < 0.5 ? '#5a1a2a' : '#3a4a1a'); }
        else if(kind === 'cups'){ this.box(qx + 1, sy + 3, 4, 4, '#f4efe4'); g.fillStyle = '#f4efe4'; g.fillRect(qx + 5, sy + 4, 1.5, 2); }
        else if(kind === 'sweets'){ this.box(qx + 1, sy + 1, 4, 6, ['#f0a0b8', '#a0d8c8', '#f8e08a', '#c8a0e0'][Math.floor(v * 4)]); }
        else if(kind === 'floats'){ this.circle(qx + 3, sy + 4, 2.6, v < 0.5 ? '#e05a3a' : '#f0c040'); }
        else if(kind === 'books'){ this.box(qx, sy + 1 + Math.floor(v * 2), 2.5, 7 - Math.floor(v * 2), ['#7a2a2a', '#2a4a6a', '#3a5a2a', '#8a6a2a'][Math.floor(v * 4)]);
          this.box(qx + 3, sy + 1, 2.5, 7, ['#5a3a6a', '#7a5a2a', '#2a5a5a', '#9a3a2a'][Math.floor(this.rnd(x, y, r * 4 + k + 20) * 4)]); }
      }
    }
  },
  counter(X, Y, kind, endL, endR, x, y){
    const g = this.g, P = this.P;
    const top = kind === 'marble' ? '#e8e4dc' : kind === 'pass' ? '#c8ccd0' : kind === 'glass' ? '#f0f4f4' : '#b0804c';
    const front = kind === 'marble' ? '#5a3a24' : kind === 'pass' ? '#8a8e94' : kind === 'glass' ? '#9ac0c8' : '#7a5230';
    const x0 = X + (endL ? 2 : 0), w = P - (endL ? 2 : 0) - (endR ? 2 : 0);
    this.shadow(x0, Y + 8, w, P - 10, 0.3);
    this.box(x0, Y + 14, w, P - 16, front);
    this.box(x0, Y + 8, w, 8, top);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0, Y + 15, w, 1);
    if(kind === 'glass'){                          // the gelato, in its tubs, under the glass
      const cols = ['#f4c8d8', '#b8e0b0', '#f8e8a0', '#d8b090', '#c8d8f8', '#f0a080'];
      for(let k = 0; k < 2; k++) this.box(x0 + 2 + k * 14, Y + 18, 12, 8, cols[(x * 2 + k) % cols.length]);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x0, Y + 17, w, 2);
    } else if(kind === 'grille'){                  // the post office's brass grille, over the counter
      g.fillStyle = '#c8a050'; for(let k = 3; k < P; k += 5) g.fillRect(X + k, Y - 6, 1.5, 14); g.fillRect(X, Y - 6, P, 1.5);
    } else if(kind === 'ticket'){                  // the ticket window's frame
      g.fillStyle = '#5a3a20'; g.fillRect(x0, Y - 4, w, 3); g.fillRect(endL ? x0 : x0 + w - 3, Y - 4, 3, 14);
    } else {
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x0 + 2, Y + 18, w - 4, 1); g.fillRect(x0 + 2, Y + 24, w - 4, 1);
    }
  },
  stove(X, Y, kind, n, x, y){
    const g = this.g, P = this.P;
    if(kind === 'fire'){                           // a stone hearth, a fire burning in it
      this.box(X + 1, Y + 1, P - 2, P - 3, '#8a8070');
      this.box(X + 1, Y + 1, P - 2, 5, '#6a5440');
      this.box(X + 6, Y + 9, P - 12, P - 12, '#1a120c');
      g.fillStyle = '#ff9a3a'; g.beginPath(); g.moveTo(X + 9, Y + P - 4); g.quadraticCurveTo(X + 12, Y + 12, X + 16, Y + 11); g.quadraticCurveTo(X + 21, Y + 14, X + 23, Y + P - 4); g.closePath(); g.fill();
      g.fillStyle = '#ffe07a'; g.beginPath(); g.moveTo(X + 12, Y + P - 4); g.quadraticCurveTo(X + 15, Y + 16, X + 17, Y + 15); g.quadraticCurveTo(X + 19, Y + 18, X + 20, Y + P - 4); g.closePath(); g.fill();
      const gl = g.createRadialGradient(X + 16, Y + 22, 2, X + 16, Y + 22, 26); gl.addColorStop(0, 'rgba(255,170,80,0.35)'); gl.addColorStop(1, 'rgba(255,170,80,0)');
      g.fillStyle = gl; g.fillRect(X - 10, Y, P + 20, P + 18);
      return;
    }
    if(kind === 'oven'){                           // a brick dome, its mouth glowing
      this.box(X + 1, Y + 2, P - 2, P - 4, '#a8553a');
      g.fillStyle = 'rgba(60,20,10,0.35)'; for(let k = 0; k < 4; k++) g.fillRect(X + 1, Y + 6 + k * 6, P - 2, 1);
      const left = n.l !== 'F';
      g.fillStyle = '#2a120a'; g.beginPath(); g.arc(left ? X + P : X, Y + P - 4, 9, Math.PI, 0); g.fill();
      g.fillStyle = 'rgba(255,140,60,0.8)'; g.beginPath(); g.arc(left ? X + P : X, Y + P - 4, 6, Math.PI, 0); g.fill();
      return;
    }
    /* an iron stove or range, a pot or pan on top */
    this.shadow(X + 3, Y + 4, P - 6, P - 6, 0.3);
    this.box(X + 3, Y + 4, P - 6, P - 6, '#2c2a2a');
    this.box(X + 5, Y + 6, P - 10, 6, '#3e3c3c');
    this.box(X + 9, Y + 16, P - 18, 8, '#1a1010'); g.fillStyle = 'rgba(255,120,40,0.75)'; g.fillRect(X + 11, Y + 19, P - 22, 3);
    if(kind === 'range'){ this.circle(X + 11, Y + 9, 4, '#5a5a5a'); this.circle(X + 21, Y + 9, 4, '#6a6a6a'); g.fillStyle = '#4a4a4a'; g.fillRect(X + 24, Y + 8, 7, 2); }
    else { this.circle(X + 16, Y + 8, 6, '#6a6a70'); this.circle(X + 16, Y + 7, 4.5, '#8a8a90'); }
  },
  desk(X, Y, endL, endR, x, y){
    const g = this.g, P = this.P;
    const x0 = X + (endL ? 2 : 0), w = P - (endL ? 2 : 0) - (endR ? 2 : 0);
    this.shadow(x0, Y + 6, w, P - 10, 0.3);
    this.box(x0, Y + 6, w, P - 12, '#7a5232');
    g.fillStyle = '#5a3a22'; g.fillRect(x0, Y + P - 8, w, 2);
    this.box(X + 6, Y + 9, 10, 8, '#f2ede0'); g.fillStyle = '#9a9488'; g.fillRect(X + 8, Y + 11, 6, 1); g.fillRect(X + 8, Y + 13, 5, 1);
    if((x + y) % 2 === 0){ this.circle(X + 23, Y + 11, 3.5, '#e8c860'); g.fillStyle = 'rgba(255,230,140,0.25)'; g.beginPath(); g.arc(X + 23, Y + 12, 10, 0, Math.PI * 2); g.fill(); }
    else { this.box(X + 21, Y + 10, 6, 5, '#2a2a2a'); }
  },
  bed(X, Y, quilt, joinUp, joinDown, bunk){
    const g = this.g, P = this.P;
    const y0 = Y + (joinUp ? 0 : 2), h = P - (joinUp ? 0 : 2) - (joinDown ? 0 : 2);
    this.shadow(X + 3, y0, P - 6, h, 0.3);
    this.box(X + 3, y0, P - 6, h, bunk ? '#5a5a58' : '#6e4a2c');
    this.box(X + 5, y0 + (joinUp ? 0 : 2), P - 10, h - (joinUp ? 0 : 2) - (joinDown ? 0 : 2), quilt);
    if(!joinUp){ this.box(X + 7, y0 + 3, P - 14, 7, '#f4efe4'); }
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(X + 5, y0 + (joinUp ? 0 : 11), P - 10, 2);
    if(bunk && !joinUp){ g.fillStyle = '#3a3a38'; g.fillRect(X + 3, y0, 2, h); g.fillRect(X + P - 5, y0, 2, h); }
  },
  piano(X, Y, endL, endR){
    const g = this.g, P = this.P;
    this.shadow(X + (endL ? 2 : 0), Y + 3, P - (endL ? 2 : 0) - (endR ? 2 : 0), P - 5, 0.35);
    g.fillStyle = '#141216';
    g.beginPath();
    if(endL){ g.moveTo(X + 3, Y + 4); g.lineTo(X + P, Y + 4); g.lineTo(X + P, Y + P - 4); g.lineTo(X + 3, Y + P - 4); }
    else { g.moveTo(X, Y + 4); g.quadraticCurveTo(X + P - 2, Y + 2, X + P - 3, Y + 16); g.quadraticCurveTo(X + P - 4, Y + P - 4, X, Y + P - 4); }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(X + (endL ? 6 : 0), Y + 7, P - (endL ? 6 : 8), 2);
    if(endL){ this.box(X + 3, Y + P - 10, P - 3, 6, '#f4f0e6'); g.fillStyle = '#141216'; for(let k = 6; k < P; k += 4) g.fillRect(X + k, Y + P - 10, 2, 3.5); }
  },
  plant(X, Y, kind, x, y){
    const g = this.g, P = this.P;
    if(kind === 'coat'){                           // a coat stand, caps on its pegs
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(X + 18, Y + P - 4, 9, 3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5a3a22'; g.fillRect(X + 15, Y + 3, 3, P - 6);
      this.box(X + 8, Y + 6, 8, 10, '#2e3a5a'); this.box(X + 18, Y + 5, 7, 5, '#20283e'); g.fillStyle = '#c9a24a'; g.fillRect(X + 18, Y + 9, 7, 1.5);
      return;
    }
    if(kind === 'basket'){                         // a basket of lemons
      this.shadow(X + 5, Y + 12, P - 10, P - 15, 0.3);
      this.box(X + 5, Y + 14, P - 10, P - 18, '#a8783a');
      g.fillStyle = 'rgba(70,40,15,0.5)'; for(let k = 0; k < 3; k++) g.fillRect(X + 5, Y + 17 + k * 4, P - 10, 1);
      for(let k = 0; k < 6; k++) this.circle(X + 9 + (k % 3) * 7, Y + 12 + Math.floor(k / 3) * 4, 3.4, k % 4 === 3 ? '#c8d84a' : '#f2d64a');
      return;
    }
    /* a pot of basil (or a little tree) */
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(X + 18, Y + P - 4, 9, 3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#b25a34'; g.beginPath(); g.moveTo(X + 9, Y + 18); g.lineTo(X + 23, Y + 18); g.lineTo(X + 21, Y + P - 4); g.lineTo(X + 11, Y + P - 4); g.closePath(); g.fill();
    for(let k = 0; k < 7; k++){
      const a = this.rnd(x, y, k) * Math.PI * 2, r = 3 + this.rnd(x, y, k + 9) * 6;
      this.circle(X + 16 + Math.cos(a) * r, Y + 12 + Math.sin(a) * r * 0.8, 4, k % 2 ? '#4a8a3a' : '#5ea04a');
    }
  },
  armchair(X, Y, col, rocking){
    const g = this.g, P = this.P;
    this.shadow(X + 4, Y + 4, P - 8, P - 6, 0.3);
    if(rocking){ g.fillStyle = '#5a3a22'; g.fillRect(X + 4, Y + P - 4, P - 8, 2); }
    this.box(X + 5, Y + 3, P - 10, 10, this.shade(col, -0.2));            // the back
    this.box(X + 4, Y + 11, P - 8, P - 16, col);                             // the seat
    this.box(X + 3, Y + 9, 5, P - 13, this.shade(col, -0.1)); this.box(X + P - 8, Y + 9, 5, P - 13, this.shade(col, -0.1));
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(X + 11, Y + 4, 10, 3);   // a doily
  },
  chair(X, Y, col, n){
    const g = this.g, P = this.P;
    const tL = n.l === 't', tR = n.r === 't', tD = n.d === 't';
    this.shadow(X + 9, Y + 9, 14, 14, 0.28);
    this.box(X + 9, Y + 9, 14, 14, col);
    g.fillStyle = this.shade(col, -0.3);
    if(tR) g.fillRect(X + 7, Y + 6, 4, 20);                 // the back, away from the table
    else if(tL) g.fillRect(X + 21, Y + 6, 4, 20);
    else if(tD) g.fillRect(X + 7, Y + 6, 18, 4);
    else g.fillRect(X + 7, Y + 20, 18, 4);
  },
  table(X, Y, cloth, L0, R0, T0, B0, x, y){
    const g = this.g, P = this.P, rnd = this.rnd;
    const single = L0 && R0 && T0 && B0;
    const x0 = X + (L0 ? 3 : 0), y0 = Y + (T0 ? 4 : 0), w = P - (L0 ? 3 : 0) - (R0 ? 3 : 0), h = P - (T0 ? 4 : 0) - (B0 ? 4 : 0);
    if(single && (cloth === 'marble' || cloth === 'lace')){
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(X + 18, Y + 19, 11, 0, Math.PI * 2); g.fill();
      this.circle(X + 16, Y + 16, 11, cloth === 'marble' ? '#ece8e0' : '#f6f0e4');
      g.strokeStyle = cloth === 'marble' ? '#8a8478' : '#d8c8b0'; g.lineWidth = 1.5; g.beginPath(); g.arc(X + 16, Y + 16, 11, 0, Math.PI * 2); g.stroke();
      if(cloth === 'marble'){ this.box(X + 12, Y + 12, 5, 5, '#f8f4ee'); g.fillStyle = '#5a3a24'; g.fillRect(X + 13, Y + 13, 3, 2); }
      else { this.circle(X + 16, Y + 15, 3, '#c85a7a'); this.circle(X + 14, Y + 14, 2, '#e88aa0'); }
      return;
    }
    this.shadow(x0, y0, w, h, 0.3);
    const base = { 'check-red':'#f4eee4', 'check-blue':'#f4eee4', lace:'#f6f0e4', baize:'#2e6a3a', sort:'#a8834e', wood:'#8a5e36', marble:'#ece8e0', white:'#f8f4ec' }[cloth] || '#8a5e36';
    this.box(x0, y0, w, h, base);
    if(cloth === 'check-red' || cloth === 'check-blue'){
      g.fillStyle = cloth === 'check-red' ? 'rgba(190,40,40,0.55)' : 'rgba(50,90,170,0.5)';
      for(let k = 0; k < P; k += 8){ g.fillRect(X + k, y0, 4, h); g.fillRect(x0, Y + k, w, 4); }
    }
    if(cloth === 'lace'){ g.strokeStyle = 'rgba(200,180,150,0.7)'; g.lineWidth = 1; g.strokeRect(x0 + 2.5, y0 + 2.5, w - 5, h - 5); }
    if(cloth === 'baize'){ g.strokeStyle = '#6a4a2a'; g.lineWidth = 2; g.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
      for(let k = 0; k < 3; k++){ const a = rnd(x, y, k); this.box(x0 + 4 + a * (w - 12), y0 + 4 + rnd(x, y, k + 3) * (h - 12), 6, 8, '#f8f4ec'); g.fillStyle = k % 2 ? '#c03030' : '#202020'; g.fillRect(x0 + 6 + a * (w - 12), y0 + 7 + rnd(x, y, k + 3) * (h - 12), 2, 2); }
      this.circle(x0 + w - 7, y0 + h - 7, 3, '#e0b84a'); this.circle(x0 + w - 9, y0 + h - 9, 3, '#e8c45a');
    }
    if(cloth === 'sort'){ for(let k = 0; k < 5; k++) this.circle(x0 + 5 + rnd(x, y, k) * (w - 10), y0 + 5 + rnd(x, y, k + 5) * (h - 10), 3.3, k === 2 ? '#c8d84a' : '#f2d64a'); }
    if(cloth === 'wood'){ g.fillStyle = 'rgba(40,22,10,0.35)'; g.fillRect(x0, y0 + h / 2, w, 1); }
    if(cloth === 'white'){                          // the villa's: white linen, gold at the edge, plates and a candle
      g.strokeStyle = '#c9a24a'; g.lineWidth = 1.5; g.strokeRect(x0 + 1.5, y0 + 1.5, w - 3, h - 3);
      this.circle(X + 16, Y + 16, 6, '#ffffff'); this.circle(X + 16, Y + 16, 4, '#efe6d0');
      if(x % 2 === 0){ this.box(X + 26, Y + 6, 3, 8, '#f4efe2'); this.circle(X + 27.5, Y + 4.5, 2, '#ffd36a');
        const gl = g.createRadialGradient(X + 27.5, Y + 5, 1, X + 27.5, Y + 5, 12); gl.addColorStop(0, 'rgba(255,220,140,0.45)'); gl.addColorStop(1, 'rgba(255,220,140,0)');
        g.fillStyle = gl; g.fillRect(X + 14, Y - 8, 28, 28); }
    }
    /* a plate and a glass on a laid table */
    if(cloth === 'check-red' || cloth === 'check-blue' || cloth === 'lace'){
      this.circle(X + 16, Y + 16, 5.5, '#ffffff'); this.circle(X + 16, Y + 16, 3, cloth === 'check-red' ? '#e0a050' : '#e8e0d0');
      if(cloth === 'check-red'){ this.box(X + 24, Y + 8, 3, 7, '#3a5a2a'); g.fillStyle = '#ffe080'; g.fillRect(X + 24.5, Y + 6, 2, 2); }
    }
  },
  crate(X, Y, kind, x, y){
    const g = this.g, P = this.P;
    this.shadow(X + 2, Y + 2, P - 4, P - 4, 0.3);
    this.box(X + 2, Y + 2, P - 4, P - 4, kind === 'parcel' ? '#c8a878' : '#8a6238');
    if(kind === 'parcel'){ g.fillStyle = '#7a5a3a'; g.fillRect(X + 15, Y + 2, 2, P - 4); g.fillRect(X + 2, Y + 15, P - 4, 2); this.box(X + 6, Y + 6, 7, 5, '#f4efe2'); return; }
    if(kind === 'lemons'){
      this.box(X + 4, Y + 4, P - 8, P - 8, '#5a3a20');
      for(let k = 0; k < 9; k++) this.circle(X + 9 + (k % 3) * 7, Y + 9 + Math.floor(k / 3) * 7, 3.4, this.rnd(x, y, k) < 0.15 ? '#c8d84a' : '#f2d64a');
      return;
    }
    g.strokeStyle = '#5a3a1e'; g.lineWidth = 2;
    g.strokeRect(X + 3, Y + 3, P - 6, P - 6);
    g.beginPath(); g.moveTo(X + 3, Y + 3); g.lineTo(X + P - 3, Y + P - 3); g.stroke();
    if(kind === 'family'){ g.fillStyle = '#9a2a2a'; g.beginPath(); g.arc(X + 16, Y + 16, 4, 0, Math.PI * 2); g.fill(); }
  },
  barrel(X, Y, kind, x, y){
    const g = this.g, P = this.P;
    if(kind === 'sack'){                           // a sack of letters
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(X + 18, Y + P - 5, 11, 4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = (x + y) % 2 ? '#a83a3a' : '#8a8a7a';
      g.beginPath(); g.moveTo(X + 8, Y + P - 5); g.quadraticCurveTo(X + 4, Y + 10, X + 13, Y + 7); g.lineTo(X + 19, Y + 7); g.quadraticCurveTo(X + 28, Y + 10, X + 24, Y + P - 5); g.closePath(); g.fill();
      this.box(X + 12, Y + 3, 8, 3, '#f4efe2');
      return;
    }
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(X + 18, Y + 19, 12, 12, 0, 0, Math.PI * 2); g.fill();
    this.circle(X + 16, Y + 16, 12, '#7a4a28');
    g.strokeStyle = '#3a3a3a'; g.lineWidth = 2; g.beginPath(); g.arc(X + 16, Y + 16, 9, 0, Math.PI * 2); g.stroke();
    this.circle(X + 16, Y + 16, 6, '#8a5a32');
  },
  seats(X, Y, endL, endR){
    const g = this.g, P = this.P;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X, Y + 6, P, P - 6);
    this.box(X + 3, Y + 4, P - 6, 10, '#8a1e2a');            // the back
    this.box(X + 4, Y + 13, P - 8, 13, '#a8283a');           // the seat
    g.fillStyle = '#c9a24a'; g.fillRect(X, Y + 4, 2, 22); g.fillRect(X + P - 2, Y + 4, 2, 22);
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(X + 5, Y + 6, P - 10, 2);
  },
  bars(X, Y, n){                                  // a run of iron bars, seen from above: a rail, and the bars' tops
    const g = this.g, P = this.P, c = P / 2;
    const arms = [['l', -1, 0], ['r', 1, 0], ['u', 0, -1], ['d', 0, 1]].filter(([k])=> n[k] === 'J');
    if(!arms.length) arms.push(['l', -1, 0], ['r', 1, 0]);
    g.strokeStyle = '#2e3036'; g.lineWidth = 3; g.lineCap = 'round';
    arms.forEach(([, dx, dy])=>{ g.beginPath(); g.moveTo(X + c, Y + c); g.lineTo(X + c + dx * c, Y + c + dy * c); g.stroke(); });
    arms.forEach(([, dx, dy])=>{
      for(let k = 0; k <= c; k += 5){
        const px = X + c + dx * k, py = Y + c + dy * k;
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(px + 1.5, py + 2, 2.3, 0, Math.PI * 2); g.fill();
        this.circle(px, py, 2.3, '#4a4d55'); this.circle(px - 0.6, py - 0.6, 0.9, '#9a9ea8');
      }
    });
    g.lineCap = 'butt';
  },
  nets(X, Y, x, y){
    const g = this.g, P = this.P;
    g.fillStyle = '#6a4a2a'; g.fillRect(X + 2, Y + 3, 3, P - 5); g.fillRect(X + P - 5, Y + 3, 3, P - 5); g.fillRect(X + 2, Y + 3, P - 4, 3);
    g.strokeStyle = 'rgba(200,180,130,0.9)'; g.lineWidth = 0.9;
    for(let k = 0; k < 6; k++){ g.beginPath(); g.moveTo(X + 6 + k * 4, Y + 6); g.lineTo(X + 4 + k * 4, Y + P - 4); g.stroke(); }
    for(let k = 0; k < 5; k++){ g.beginPath(); g.moveTo(X + 5, Y + 9 + k * 4); g.lineTo(X + P - 5, Y + 10 + k * 4); g.stroke(); }
    this.circle(X + 9, Y + P - 7, 2.8, '#e05a3a'); this.circle(X + 22, Y + P - 6, 2.8, '#f0c040');
  },
  statue(X, Y){                                   // a marble bust on its plinth
    const g = this.g, P = this.P;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(X + 18, Y + P - 4, 11, 4, 0, 0, Math.PI * 2); g.fill();
    this.box(X + 8, Y + 14, P - 16, P - 17, '#d8d2c6'); this.box(X + 6, Y + P - 7, P - 12, 4, '#c8c0b2');
    this.circle(X + 16, Y + 10, 6, '#ece6da'); this.box(X + 11, Y + 13, 10, 4, '#e4ddd0');
    this.circle(X + 14, Y + 8, 1.6, 'rgba(0,0,0,0.12)');
  },
  barberChair(X, Y){
    const g = this.g, P = this.P;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(X + 18, Y + P - 5, 10, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#b8b8c0'; g.fillRect(X + 14, Y + 20, 4, 8); this.box(X + 9, Y + P - 6, 14, 3, '#c8c8d0');
    this.box(X + 8, Y + 8, 16, 13, '#a8282e');
    this.box(X + 10, Y + 3, 12, 7, '#8a1e24');
    this.box(X + 6, Y + 10, 3, 9, '#d0d0d8'); this.box(X + 23, Y + 10, 3, 9, '#d0d0d8');
  },
  bench(X, Y, col, endL, endR){
    const g = this.g, P = this.P;
    const x0 = X + (endL ? 3 : 0), w = P - (endL ? 3 : 0) - (endR ? 3 : 0);
    this.shadow(x0, Y + 10, w, 12, 0.28);
    this.box(x0, Y + 10, w, 12, col);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0, Y + 14, w, 1); g.fillRect(x0, Y + 18, w, 1);
    g.fillStyle = this.shade(col, -0.35); if(endL) g.fillRect(x0 + 1, Y + 20, 3, 6); if(endR) g.fillRect(x0 + w - 4, Y + 20, 3, 6);
  },
  stageLip(X, Y){
    const g = this.g, P = this.P;
    g.fillStyle = '#5a3418'; g.fillRect(X, Y + P - 5, P, 5);
    this.circle(X + 8, Y + P - 3, 2, '#ffe08a'); this.circle(X + 24, Y + P - 3, 2, '#ffe08a');
    g.fillStyle = 'rgba(255,224,138,0.18)'; g.fillRect(X, Y + P - 14, P, 9);
  },
  door(x, y, L){
    const g = this.g, P = this.P, X = x * P, Y = y * P;
    const out = g.createLinearGradient(0, Y, 0, Y + P);
    out.addColorStop(0, '#3a3450'); out.addColorStop(1, '#6a5a6a');              // the street at dusk
    g.fillStyle = out; g.fillRect(X + 3, Y, P - 6, P);
    g.fillStyle = L.trim; g.fillRect(X, Y, 4, P); g.fillRect(X + P - 4, Y, 4, P);
    this.box(X + 6, Y - P + 18, P - 12, P - 22, '#8a5a3a');                      // the mat, just inside
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(X + 8, Y - P + 21, P - 16, 1); g.fillRect(X + 8, Y - P + 25, P - 16, 1);
  },
  text(s, x, y, size, col, align){ const g = this.g; g.font = `bold ${size}px Georgia, serif`; g.fillStyle = col; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); g.textAlign = 'left'; },
};
/* What only one room has. */
const R5_ROOM_DECOR = {
  room_marta(g, P, R){                            // steam off the soup
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.6;
    [0, 5].forEach(o=>{ g.beginPath(); g.moveTo(3 * P + 13 + o, P + 4); g.bezierCurveTo(3 * P + 9 + o, P - 2, 3 * P + 19 + o, P - 6, 3 * P + 14 + o, P - 12); g.stroke(); });
  },
  room_lucia(g, P, R){                            // Pippo's wooden boat, out on the rug
    R.box(6 * P + 6, 5 * P + 14, 16, 5, '#8a5a32'); g.fillStyle = '#f4efe2';
    g.beginPath(); g.moveTo(6 * P + 14, 5 * P + 3); g.lineTo(6 * P + 14, 5 * P + 13); g.lineTo(6 * P + 22, 5 * P + 13); g.closePath(); g.fill();
  },
  room_station(g, P, R, d){                       // the clock, and the timetable nobody may use
    const cx = 6.5 * P, cy = 0.55 * P;
    R.circle(cx, cy, 12, '#5a3a20'); R.circle(cx, cy, 10, '#f4efe2');
    g.strokeStyle = '#222'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 7); g.moveTo(cx, cy); g.lineTo(cx + 5, cy + 2); g.stroke();
    R.box(7.3 * P, 4, P * 1.4, P - 10, '#1e2a22'); R.text('OLD TOWN', 8 * P, 12, 6, '#e8e0c0'); R.text('FAMILY ONLY', 8 * P, 21, 5, '#e88a6a');
  },
  room_customs(g, P, R){                          // the brass scale, the plaque, the safe
    R.box(5 * P + 2, 2, P * 3 - 4, 13, '#c8a050'); R.text('CUSTOMS', 6.5 * P, 9, 8, '#3a2a10');
    g.strokeStyle = '#7a1a1a'; g.lineWidth = 1; g.beginPath(); g.moveTo(5 * P + 10, 18); g.lineTo(8 * P - 10, 17); g.stroke();
    R.text('FAMILY BUSINESS', 6.5 * P, 22, 5, '#7a1a1a');
    const sx = 3 * P + 16, sy = 4 * P + 9;
    g.fillStyle = '#c8a050'; g.fillRect(sx - 1, sy - 8, 2, 9); g.fillRect(sx - 9, sy - 8, 18, 1.5);
    R.circle(sx - 8, sy - 4, 3.5, '#d8b060'); R.circle(sx + 8, sy - 4, 3.5, '#d8b060');
    [[8, 4], [9, 4]].forEach(([x, y])=>{ R.circle(x * P + 12, y * P + 11, 3, '#e8c45a'); R.circle(x * P + 16, y * P + 10, 3, '#e0b84a'); });
    R.box(6 * P + 4, 2 * P + 3, P - 8, P - 6, '#3a3a40'); R.circle(6 * P + 16, 2 * P + 15, 4, '#8a8a90');
  },
  room_warehouse(g, P, R){                        // some of the Family's crates hum
    [[1, 1], [10, 2], [5, 6]].forEach(([x, y])=>{
      const gl = g.createRadialGradient(x * P + 16, y * P + 16, 2, x * P + 16, y * P + 16, 22);
      gl.addColorStop(0, 'rgba(180,110,255,0.45)'); gl.addColorStop(1, 'rgba(180,110,255,0)');
      g.fillStyle = gl; g.fillRect(x * P - 8, y * P - 8, P + 16, P + 16);
    });
    g.strokeStyle = '#a8885a'; g.lineWidth = 2.2;
    for(let k = 0; k < 3; k++){ g.beginPath(); g.arc(9 * P + 16, 7 * P + 18, 4 + k * 3, 0, Math.PI * 2); g.stroke(); }   // a coil of rope
  },
  room_nonna(g, P, R){                            // her cat on the windowsill; her knitting
    const X = 3 * P, Y = 0;
    g.fillStyle = '#3a3030'; g.beginPath(); g.ellipse(X + 16, Y + P - 9, 7, 4, 0, 0, Math.PI * 2); g.fill();
    R.circle(X + 21, Y + P - 13, 3.5, '#3a3030');
    g.beginPath(); g.moveTo(X + 19, Y + P - 16); g.lineTo(X + 20, Y + P - 19); g.lineTo(X + 22, Y + P - 16); g.fill();
    g.beginPath(); g.moveTo(X + 21, Y + P - 16); g.lineTo(X + 23, Y + P - 19); g.lineTo(X + 24, Y + P - 15); g.fill();
    g.strokeStyle = '#3a3030'; g.lineWidth = 2; g.beginPath(); g.moveTo(X + 9, Y + P - 9); g.quadraticCurveTo(X + 4, Y + P - 2, X + 9, Y + P - 1); g.stroke();
    R.circle(3 * P + 10, 2 * P + 24, 4, '#c85a7a'); g.strokeStyle = '#d8d0c0'; g.lineWidth = 1; g.beginPath(); g.moveTo(3 * P + 6, 2 * P + 18); g.lineTo(3 * P + 14, 2 * P + 28); g.stroke();
  },
  room_barber(g, P, R, d){                        // mirrors over the chairs; the sign; the pole
    [2, 5, 8].forEach(x=>{ R.box(x * P + 6, 4, P - 12, P - 12, '#c8a050'); R.box(x * P + 8, 6, P - 16, P - 16, '#b8d0dc'); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x * P + 10, 8, 3, P - 20); });
    const H = d.rows.length, py = (H - 1) * P;
    R.box(3 * P + 12, py + 2, 8, P - 4, '#f4efe2');
    g.fillStyle = '#c82a2a'; for(let k = 0; k < 5; k++){ g.save(); g.beginPath(); g.rect(3 * P + 12, py + 2, 8, P - 4); g.clip(); g.translate(3 * P + 12, py + 2 + k * 7); g.rotate(-0.5); g.fillRect(-6, 0, 20, 3); g.restore(); }
    R.box(6 * P + 4, py + 6, P - 8, 12, '#f4efe2'); R.text('BACK SOON', 6.5 * P, py + 12, 5, '#7a3a2a');
  },
  room_opera(g, P, R, d){                         // the great curtain, the gold boxes, a chandelier's glow
    const W = d.rows[0].length;
    for(let x = 1; x < W - 1; x++){
      const X = x * P;
      const cg = g.createLinearGradient(X, 0, X + P, 0);
      cg.addColorStop(0, '#5a0e18'); cg.addColorStop(0.5, '#9a1e2c'); cg.addColorStop(1, '#5a0e18');
      g.fillStyle = cg; g.fillRect(X, 0, P, P);
      g.fillStyle = '#d8b050'; for(let k = 2; k < P; k += 6) g.fillRect(X + k, P - 6, 3, 6);
    }
    g.fillStyle = 'rgba(255,235,170,0.22)'; g.beginPath(); g.ellipse(W * P / 2, 2.2 * P, P * 2.2, P * 1.1, 0, 0, Math.PI * 2); g.fill();   // the spotlight, waiting
    [5, 8].forEach(y=>{ [0, W - 1].forEach(x=>{ R.box(x * P + 4, y * P + 4, P - 8, P - 8, '#c9a24a'); R.box(x * P + 7, y * P + 7, P - 14, P - 14, '#5a0e18'); }); });
    const gl = g.createRadialGradient(W * P / 2, 6.5 * P, 4, W * P / 2, 6.5 * P, P * 3);
    gl.addColorStop(0, 'rgba(255,230,160,0.28)'); gl.addColorStop(1, 'rgba(255,230,160,0)');
    g.fillStyle = gl; g.fillRect(0, 3 * P, W * P, 7 * P);
  },
  room_police(g, P, R){                           // WANTED — and the Family's calendar, with a boat on it
    const X = 3 * P;
    R.box(X + 5, 3, P - 10, P - 8, '#efe4c8'); R.text('WANTED', X + 16, 8, 5.5, '#7a1a1a');
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(X + 16, 15, 3, 0, Math.PI * 2); g.moveTo(X + 16, 18); g.lineTo(X + 16, 22); g.moveTo(X + 12, 20); g.lineTo(X + 20, 20); g.stroke();
    g.beginPath(); g.arc(X + 12, 14, 2.4, 0, Math.PI * 2); g.arc(X + 20, 14, 2.4, 0, Math.PI * 2); g.stroke();   // the ears, far too big
    R.box(6 * P + 7, 4, P - 14, P - 10, '#f4efe2'); R.box(6 * P + 9, 6, P - 18, 8, '#8ab8d0'); g.fillStyle = '#5a3a24'; g.fillRect(6 * P + 11, 11, P - 22, 2);
    g.fillStyle = '#c8a050'; R.circle(4 * P + 16, 12, 3, '#c8a050'); g.fillRect(4 * P + 15, 14, 2, 6);
  },
  room_post(g, P, R){
    R.box(4 * P + 10, 4, P * 2 - 20, 12, '#c8a050'); R.text('POSTE', 5 * P, 10, 7, '#3a2a10');
  },
  room_cafe(g, P, R){                             // the espresso machine; the board; the clock
    const X = 8 * P, Y = 2 * P;
    R.box(X + 2, Y - 6, P * 2 - 4, 16, '#b8b8c0'); R.box(X + 4, Y - 4, P * 2 - 8, 6, '#d8d8e0');
    R.circle(X + 14, Y + 4, 3, '#2a2a2a'); R.circle(X + 34, Y + 4, 3, '#2a2a2a');
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X + 22, Y - 8); g.bezierCurveTo(X + 18, Y - 14, X + 28, Y - 16, X + 23, Y - 22); g.stroke();
    R.box(4 * P + 5, 3, P - 10, P - 9, '#22282a'); R.text('CAFFÈ', 4 * P + 16, 9, 5.5, '#f4efe2'); R.text('BAR', 4 * P + 16, 17, 5, '#e8d8a0');
    R.circle(8 * P + 16, 13, 9, '#5a3a20'); R.circle(8 * P + 16, 13, 7, '#f4efe2'); g.strokeStyle = '#222'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(8 * P + 16, 13); g.lineTo(8 * P + 16, 8); g.moveTo(8 * P + 16, 13); g.lineTo(8 * P + 19, 15); g.stroke();
  },
  room_trattoria(g, P, R){                        // garlic and peppers on strings
    [2, 5, 7, 10].forEach(x=>{
      g.strokeStyle = '#7a5a3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x * P + 16, 3); g.lineTo(x * P + 16, P - 6); g.stroke();
      for(let k = 0; k < 4; k++) R.circle(x * P + 16 + (k % 2 ? 3 : -3), 8 + k * 5, 3, x % 2 ? '#c82a2a' : '#f2ece0');
    });
  },
  room_gelateria(g, P, R){                        // forty flavours, and pistachio underlined three times
    R.box(4 * P + 2, 2, P * 3 - 4, P - 6, '#2a2e2a');
    R.text('40 FLAVOURS', 5.5 * P, 9, 6, '#f4efe2'); R.text('PISTACHIO', 5.5 * P, 17, 6, '#a8d888');
    g.fillStyle = '#a8d888'; for(let k = 0; k < 3; k++) g.fillRect(5.5 * P - 17, 21 + k * 2, 34, 1);
    [3, 7].forEach(x=>{ const X = x * P; g.fillStyle = '#d8a860'; g.beginPath(); g.moveTo(X + 11, 12); g.lineTo(X + 21, 12); g.lineTo(X + 16, 26); g.closePath(); g.fill(); R.circle(X + 16, 10, 5, x === 3 ? '#f4c8d8' : '#b8e0b0'); });
  },
  room_grandpa(g, P, R){},
  room_lemons(g, P, R){                           // a lemon or two, rolled loose on the boards
    [[4, 7], [8, 2], [2, 4]].forEach(([x, y])=> R.circle(x * P + 10, y * P + 24, 3, '#f2d64a'));
  },
  villa(g, P, R){                                 // the stair down; the skylight he came through; the Padrino, painted
    const X = 9 * P, Y = P;
    g.fillStyle = '#1a1412'; g.fillRect(X + 2, Y + 2, P - 4, P - 4);
    for(let k = 0; k < 4; k++){ g.fillStyle = `rgb(${110 - k * 26},${100 - k * 24},${92 - k * 22})`; g.fillRect(X + 4, Y + 4 + k * 6, P - 8, 5); }
    g.fillStyle = '#6a4a2a'; g.fillRect(8 * P + 24, Y, 8, P); g.fillRect(10 * P, Y, 8, P);          // the cellar door, thrown open
    [[9, 6, 1], [10, 7, 2], [8, 7, 3], [9, 8, 4]].forEach(([x, y, k])=>{                            // glass on the hall floor
      g.fillStyle = 'rgba(210,235,250,0.85)';
      for(let j = 0; j < 3; j++){ const ox = x * P + 6 + ((k * 7 + j * 11) % 20), oy = y * P + 6 + ((k * 5 + j * 9) % 18);
        g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + 4, oy + 2); g.lineTo(ox + 1, oy + 5); g.closePath(); g.fill(); }
    });
    [[2, 6], [13, 6], [16, 6]].forEach(([x, y])=>{                                                     // portraits of the Padrino
      R.box(x * P + 7, y * P + 3, P - 14, P - 9, '#c9a24a'); R.box(x * P + 9, y * P + 5, P - 18, P - 13, '#3a2a2a');
      R.circle(x * P + 16, y * P + 11, 3, '#c8a888'); R.box(x * P + 12, y * P + 14, 8, 6, '#1a1a1a');
    });
    R.box(3 * P + 10, 7 * P + 1, 12, 9, '#c9b590'); g.strokeStyle = '#7a5a32'; g.lineWidth = 1.5; g.strokeRect(3 * P + 10, 7 * P + 1, 12, 9);   // the photograph, on the mantel
  },
  room_guards(g, P, R){                           // the duty roster
    R.box(6 * P + 4, 3, P * 2 - 8, P - 8, '#e8dcc0'); R.text('DUTY', 7 * P, 9, 6, '#3a2a10');
    g.fillStyle = '#6a5a4a'; for(let k = 0; k < 3; k++) g.fillRect(6 * P + 10, 14 + k * 4, P * 2 - 20, 1);
  },
};

/* ============================================================
   HIM, IN COSA NOSTIA
   ============================================================ */
const R5_GHOST_TOWN = [
  `The people here are frightened. Not of me. They cannot see me.`,
  `I can feel my core up there. Like a song I almost remember.`,
  `The Family. Such a warm word, for such cold people.`,
  `The dead under this town are restless. I know how they feel.`,
  `You humans put your dead underground and then build a town on top of them. Brave. Or rude.`,
  `Everyone here watches the soldatos out of the corner of their eye. Nobody looks at them straight.`,
];
const R5_GHOST_DARK = [
  `Watch the lanterns, not the men. The light is what sees you.`,
  `When a man stops at the end of his walk, he is looking at the wall. That is the moment to move.`,
  `A question mark means he is not sure yet. Get back into the dark.`,
  `I can feel the men near us, even through the stone. They are the grey shapes.`,
  `The dead down here do not mind you. They mind the lanterns.`,
  `I can only show you a step or two around us. Past that, look for the lanterns.`,
  `The men who stand still turn slowly, always the same way round. Count the turns, and go when his back is to you.`,
];
const R5_GHOST_FLOOR = {
  cata_landing: `This is where the Family unloads. Crates, and more crates. I wonder what is in them.`,
  cata_cistern: `A long way across, and nowhere to hide on the bridges. Go round if you can.`,
  cata_bones:   `Too many of them. If they see us here, we run. Do not let them see us at all.`,
  cata_stair:   `He is still up there, at the top. I can feel how cross he is.`,
  /* the side rooms */
  cata_landing_r1: `Crates, counted and counted again. The Family trusts nobody, not even its own men.`,
  cata_landing_r2: `The oldest dead in the hill. They were here long before the Family, and they will be here long after.`,
  cata_cistern_r1: `Old machines, and nobody left who knows how they work. I know how that feels.`,
  cata_cistern_r2: `People came here to pray, once. Now the Family keeps its men here instead.`,
  cata_bones_r1:   `This is where the bones were sorted. Skulls in one place, the rest in another. Tidy, for the dead.`,
  cata_bones_r2:   `All of them watching us. Do not worry. They are on our side.`,
  cata_stair_r1:   `This is where the Family's men sleep between watches. None of them are sleeping now.`,
  cata_stair_r2:   `Everything in here is for hurting someone. Let us not stay long.`,
  /* tier 2 (2.88) */
  cata_garrison:   `So many of them, and all of them waiting for something. I wonder what.`,
  cata_quarry:     `The ghosts below chased the strong ones up here, long ago. A Ghost of ours would frighten them still.`,
  cata_cellars:    `The Old Town is right above us. People are walking about up there, and they have no idea.`,
  cata_pit:        `Monsters made to fight for money. I do not like this place.`,
  /* under the villa (3.18) */
  cata_deep:       `The villa's own cellars — far older than the villa. Nothing down here is dead. Except the cold.`,
  cata_watch:      `The Family's chiefs, all in one place. They have been waiting for us.`,
  cata_crypt:      `So many of them, and all one family. And that knight, on every single tomb.`,
};
/* In the Old Town's church (2.90). */
const R5_GHOST_CHURCH = [
  `It is quiet up here. I had forgotten what quiet felt like.`,
  `Somebody lights these candles every day. I like them, whoever they are.`,
  `The dead below are pressed down again. I can feel them waiting under the floor.`,
  `My core is up the hill. So close now.`,
];
/* In the Old Town's streets, and at Ugo's (2.91). */
const R5_GHOST_OLDTOWN = [
  `Nobody looks twice at a junior. Ugo was right.`,
  `My core is up there, at the top of the hill. I can feel it, like a second heartbeat.`,
  `Listen to the soldatos. They know more than they think they do.`,
  `The psychics are close. I can feel their minds, pressing down on the dead under our feet.`,
  `Every window has a lamp in it, and behind every lamp somebody is watching the Family go by.`,
  `The capos sit at the café all night. Somebody has to drink all that coffee, I suppose.`,
];
const R5_GHOST_TAILOR = [
  `Forty years of the Family's clothes, and never paid once. I like this man.`,
  `He cannot see me. I tried waving.`,
  `A needle and thread can do what an army could not. Remember that.`,
];
/* On the Hilltop, and in the tower (2.92). */
const R5_GHOST_HILL = [
  `My core is in that villa. I can feel it beating, like a second heart.`,
  `Up here their hold on the dead is so strong I can hardly think. The tower first.`,
  `If they ever catch you up here, Grandpa's door is the one to run for.`,
  `Figlio grew up in that house. No wonder he went off to sing.`,
  `The soldatos up here are bored. Bored men do not look closely.`,
];
const R5_GHOST_HILL_FREE = [
  `Can you hear them? The dead are singing under the hill.`,
  `My core is behind that door. Soon.`,
  `The mediums' hold is gone. The whole hill feels lighter.`,
];
const R5_GHOST_TOWER = [
  `Their ghosts fear a mind — a Psychic of yours. Their psychic monsters fear a fist — a Physical one.`,
  `The ones who talk to the dead can feel me. I had forgotten what it is like, to be noticed.`,
  `The mind-readers cannot feel me at all. They hear your thoughts instead. Try thinking about lunch.`,
  `Every floor we climb, their hold on the dead grows weaker. I can feel it loosening.`,
  `Thirteen floors. You humans and your unlucky numbers.`,
  `Figlio said they came here looking for someone, and never found them. I wonder who.`,
];
function r5GhostChat(id){
  const d = DECKS[id];
  const r = r5();
  /* (3.04) once the Monkey King has asked for the stones, and some are still
     missing, his talk has a second button: the stones, and where they are */
  const stones = !!(r.mkVilla && r5StonesMissing().length);
  const say = line=> stones
    ? r5Ask([faceMon('whalelord')], whaleName(), `<b>"${line}"</b>`, 'OK', '🪨 The stones').then(ok=>{ if(!ok) return r5StonesReminder(); })
    : sceneSay([faceMon('whalelord')], whaleName(), `<b>"${line}"</b>`);
  const next = (key, list)=>{ const i = (r.said[key] || 0) % list.length; r.said[key] = i + 1; return say(list[i]); };
  /* (3.03) in a room in the town: a word about the room the first time —
     (3.07) the first time each day, while it is true — then what he says in
     that part of town */
  if(id === 'villa') return next('ghostVilla', R5_GHOST_VILLA);   // (3.04)
  if(d && d.house){
    const holds = !R5_GHOST_ROOMS_WHILE[id] || R5_GHOST_ROOMS_WHILE[id]();
    if(R5_GHOST_ROOMS[id] && holds && r5Daily('ghostRoom_' + id)) return say(R5_GHOST_ROOMS[id]);
    if(d.zone === 'old_town') return next('ghostOldTown', R5_GHOST_OLDTOWN);
    if(d.zone === 'hilltop') return r.holdBroken ? next('ghostHillFree', R5_GHOST_HILL_FREE) : next('ghostHill', R5_GHOST_HILL);
    return next('ghostTown', R5_GHOST_TOWN);
  }
  /* (3.19) the vault */
  if(id === 'cata_vault'){
    const st = r5VaultState();
    /* (3.20) after the fight, and after it all */
    if(st === 'after') return say(r.mkJoined
      ? `The cold has gone from the island. It went through that hole, with Nemesis — and one day, we will have to follow it.`
      : `They have all gone down to the harbour — the Monkey King too. Let us go and say goodbye.`);
    if(st === 'nemesis' || st === 'promised') return say(`Nemesis went through that hole. I can still feel it — cold, and very far away.`);
    if(st === 'won' || st === 'crowned') return say(`Cyborg is broken, and the cores are free. And yet… the cold is still here. Stronger than ever.`);
    if(st === 'ready') return say(`He is still there, beside his machine. Together, this time — all of us.`);
    return say(`Stay close.`);
  }
  if(id === 'church') return next('ghostChurch', R5_GHOST_CHURCH);
  if(id === 'old_town') return next('ghostOldTown', R5_GHOST_OLDTOWN);
  if(id === 'tailor') return next('ghostTailor', R5_GHOST_TAILOR);
  if(id === 'hilltop') return r.holdBroken ? next('ghostHillFree', R5_GHOST_HILL_FREE) : next('ghostHill', R5_GHOST_HILL);
  if(d && d.tower){
    if(d.tower === 13 && r.holdBroken) return say(`The window. Look — the whole hill, and nobody holding it down.`);
    return next('ghostTower', R5_GHOST_TOWER);
  }
  if(!d || !d.stealth) return next('ghostTown', R5_GHOST_TOWN);
  /* (2.91) the old phoenix, waiting in the Armoury */
  if(id === 'cata_stair_r2' && r5GPWaiting())
    return say(r5MyPhoenix()
      ? `The old phoenix has been waiting for your phoenix. Go and talk to it.`
      : `It is waiting for the phoenix that hatched from its core. One day, perhaps, we will bring it one.`);
  /* every third word is about this floor; the rest are how to get by */
  const k = r.said.ghostDark || 0;
  r.said.ghostDark = k + 1;
  const floorLine = R5_GHOST_FLOOR[id];
  let line;
  if(k % 3 === 0 && floorLine && !(id === 'cata_stair' && r.capoPurple)) line = floorLine;
  else {
    const j = r.said.ghostTip || 0;
    r.said.ghostTip = j + 1;
    line = R5_GHOST_DARK[j % R5_GHOST_DARK.length];
  }
  return say(line);
}

/* ============================================================
   CHALLENGE — the Family is not a list; it is out there
   ============================================================ */
function renderChallengeR5(){
  const r = r5(), watch = r.watch || {};
  setScreenBg('catacombs');
  $('#brandSub').textContent = 'Challenge';
  /* Tier 2 counts once its gate is open (2.88). */
  const upper = r5Tier2Open() || R5_FLOORS_T2.some(f=> r.reached.includes(f));
  const allFloors = upper ? [...R5_FLOORS, ...R5_FLOORS_T2] : R5_FLOORS;
  const floorsReached = allFloors.filter(f=> r.reached.includes(f)).length;
  const roomsFound = R5_ALL_ROOMS.filter(f=> r.reached.includes(f)).length;
  const card = (sprite, icon, title, done, desc)=> `
    <div class="challenge-card" style="cursor:default;">
      ${sprite.startsWith('<') ? `<span style="width:54px;height:54px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;">${sprite}</span>`
                               : npcPortrait(sprite, icon, 54, 'transparent')}
      <div style="flex:1;">
        <div class="cc-title">${escapeHtml(title)} ${done ? '<span class="clear-tag">Beaten</span>' : ''}</div>
        <div class="cc-desc">${desc}</div>
      </div>
    </div>`;
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Region</button>
    <div class="screen-title">Challenge</div>
    <div class="phase-flag">The Family is not on a list. They are in the harbour, and under it. Go and find them.</div>
    ${card('soldato1', '💂', 'The soldato at the sea cave', r.gateBeaten,
      r.gateBeaten ? 'Ran off along the beach.' : 'Guarding the sea cave on the beach — the way into the catacombs.')}
    ${card('capo_black', '🕴️', 'Black Capo', watch.black || (!r.sottoBeaten && r.capoBlack),
      watch.black ? 'Beaten on the Watch. He unlocked his lock on the gate and went down to his master.'
      : r.sottoBeaten ? (r.reached.includes('cata_watch') ? 'On the Watch, under the villa, in the west wing — with a key to the gate down.' : 'Gone down under the villa, to keep watch.')
      : r.capoBlack ? 'The Padrino knows you are coming.' : (r.reached.includes('cata_cistern') ? 'Holding the bridge in the Cistern.' : 'Somewhere in the catacombs.'))}
    ${card('capo_purple', '🕴️', 'Purple Capo', watch.purple || (!r.sottoBeaten && r.capoPurple),
      watch.purple ? 'Beaten three times now. He unlocked his lock on the gate and went down to his master.'
      : r.sottoBeaten ? (r.reached.includes('cata_watch') ? 'On the Watch, under the villa, in the east wing — with a key to the gate down.' : 'Gone down under the villa, to keep watch.')
      : r.capoPurple ? 'Beaten twice now.' : (r.reached.includes('cata_stair') ? 'Waiting at the top of the Long Stair.' : 'Somewhere further up.'))}
    ${r.tier1 ? card(r5GhostPhoenixHtml(54), '🔥', 'The ghost phoenix', r.phoenixMet,
      r.phoenixGone ? 'It gave your phoenix the last of its fire, and went to rest.'
      : r.phoenixMet && r.phoenixGift ? 'It gave your phoenix the last of its fire. It will rest once you are safe up in the Old Town.'
      : r.phoenixMet && !r.rush ? 'It opened the gate, and the dead of the hill rose with it. Now it waits in the Armoury, with the last of its fire, for a phoenix.'
      : r.phoenixMet ? 'It opened the gate, and the dead of the hill rose with it.'
                     : 'Something dead is waiting in the Armoury, the furthest room off the Long Stair.') : ''}
    ${upper ? card('consigliere', '🕴️', 'Consigliere', watch.consigliere || (!r.sottoBeaten && r.capoGrey),
      watch.consigliere ? 'Beaten on the Watch. He unlocked his lock on the gate and went down to his master.'
      : r.sottoBeaten ? (r.reached.includes('cata_watch') ? 'On the Watch, under the villa, in his long hall — with a key to the gate down.' : 'Gone down under the villa, to keep watch.')
      : r.capoGrey ? 'Nobody saw a thing.' : (r.reached.includes('cata_pit') ? 'Waiting in the middle of his ring.' : 'Somewhere under the Old Town.')) : ''}
    ${r.figlioMet ? card('figlio', '🎙️', 'Figlio', concertState().figlioDay === today(),
      (concertState().figlioDay === today() ? 'Beaten today. Back at the opera house tomorrow. ' : 'At the opera house in the Old Town. ') +
      `Once a day: his team is level <b>${r5FiglioSpan()}</b> · win for <b>+3 Silver Medals</b>.`) : ''}
    ${r.hill ? card('psychic_master', '🔮', 'Psychic Master', r5TowerBeaten(12),
      r5TowerBeaten(12) ? 'The leader of the exorcists. Without her, her order cannot hold the dead for long.' : 'The leader of the exorcists, on floor 12 of the tower in the estate\'s east garden.') : ''}
    ${r.hill ? card('ghost_master', '👻', 'Ghost Master', r5TowerBeaten(13),
      r5TowerBeaten(13) ? 'The Padrino\'s grandniece. The hold on the dead is broken.' : 'The Padrino\'s grandniece, on floor 13 at the very top of the tower. The dead of the hill do what she tells them.') : ''}
    ${r.hill ? card('sottocapo', '🕴️', 'Sottocapo', !!r.sottoBeaten,
      r.sottoBeaten ? 'He ran inside, down to his master, ahead of you.'
      : r.mkVilla ? 'At the villa\'s great door, and he will fight you for it: 4 waves — 10 monsters, level 100, the last a crowned Lizardape.'
      : 'The Padrino\'s right hand, filling the villa\'s great doorway.') : ''}
    ${(r.reached.includes('cata_crypt') || r.jaxBeaten) ? card('rival_padrino', '🧑', 'Jax', !!r.jaxBeaten,
      r.ending ? 'He runs the Family now, with the Ghost Master. Nino\'s rule: no more hurting monsters. (Mostly.)'
      : r.jaxBeaten ? 'He went into the vault ahead of you.' : 'At the vault\'s great door, in the Family Crypt: 6 monsters, one at a time, level 100, the last a crowned Eagle. He always moves first.') : ''}
    ${(r.vault && r.vault.won) ? card('padrino2', '🕴️', 'Don Padrino', true,
      r.ending ? 'Beaten in the vault, with the Monkey King at your side. He kept his promise to Nino, and sailed away with him and the Madrina to see the world.'
      : 'Beaten in the vault, with the Monkey King at your side.') : ''}
    ${(typeof tearOpen === 'function' && tearOpen()) ? tearChallengeCard() : ''}
    <div class="screen-sub" style="margin-top:12px;">Catacomb floors reached: <b>${floorsReached} of ${allFloors.length}</b> · side rooms found: <b>${roomsFound} of ${R5_ALL_ROOMS.length}</b></div>
    ${r.hill ? `<div class="screen-sub" style="margin-top:4px;">Tower floors won: <b>${r.tower.beaten.length} of 13</b> — the disciples and masters stay beaten.</div>` : ''}
    <div class="screen-sub" style="margin-top:4px;">Soldatos you beat are back at their posts the next day. The Family regroups.</div>
    <button class="btn btn-ghost" id="returnBtn" style="margin-top:12px;">Return</button>`;
  $('#backBtn').addEventListener('click', ()=> go('region'));
  $('#returnBtn').addEventListener('click', ()=> go('region'));
  const tc = $('#cTear');
  if(tc) tc.addEventListener('click', ()=>{ ui.tearBack = null; go('tear'); });          // straight there (2.94)
}

/* After a fight in the dark: back to the spot, not the region screen. */
function r5AfterWild(){
  const d = ui.returnDeck;
  ui.returnDeck = null;
  if(d && DECKS[d] && battleParty().some(m=> m.currentHp > 0)) return go(d);
  return go('region');
}
