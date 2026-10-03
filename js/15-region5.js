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
       The Fight Pit   fight floor · the Grey Capo in the ring; above him the
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
    capoGrey:false,         // the Grey Capo beaten in his pit
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
    holdBroken:false,       // the Ghost Master beaten: the hold on the dead is broken (2.92)
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
"..........................","..........................","##.........#..#.#........#","#.........##..####.##.#.##",
"##.......##...####.####.##","####..####################","####..####################","####..####################",
"####..####################","####..####################","####..####################",
    ],
    spawn:[4,37],
    arrive:{ cave:[1,31], pier:[4,37], gate:[12,3] },
    things:[
      { x:3,  y:7,  walk:true, verb:'Old arch', act:()=> r5OldArch() },
      { x:12, y:2,  w:2, verb:'Old Town', act:()=> r5OldTownGate(), when:()=> !r5().disguise },
      /* (2.91) in the Family's colours, the gate's soldatos let a junior up */
      { x:12, y:3,  walk:true, verb:'Up', where:'The Old Town', act:()=> r5GateUp(), when:()=> !!r5().disguise },
      { x:14, y:8,  sprite:'soldato2', icon:'💂', verb:'Talk', act:()=> r5Loiter('steps') },
      { x:20, y:7,  sprite:'station_master', icon:'🎩', verb:'Talk', act:()=> r5StationMaster() },
      { x:23, y:7,  walk:true, verb:'Funicular', act:()=> r5Funicular() },
      { x:4,  y:15, walk:true, verb:'Knock', act:()=> r5Marta() },
      { x:12, y:17, sprite:'boatwright', icon:'🪚', verb:'Talk', act:()=> r5Boatwright(),
        mark:()=> !r5().heardTunnels },
      { x:21, y:17, sprite:'net_mender', icon:'🧶', verb:'Talk', act:()=> r5NetMender() },
      { x:5,  y:26, sprite:'shopkeeper5', icon:'🐟', verb:'Shop', act:()=> r5Fishmonger() },
      { x:12, y:26, w:2, verb:'Customs', act:()=> r5Customs() },
      { x:10, y:28, sprite:'soldato1', icon:'💂', verb:'Talk', act:()=> r5Loiter('customs') },
      { x:21, y:27, sprite:'dockhand', icon:'📦', verb:'Storage', act:()=> r5Dockhand() },
      /* the Family's way into the catacombs: its boats come in here at night */
      { x:1,  y:31, walk:true, verb:'In', where:'The Catacombs', arrow:'left', act:()=> r5CaveIn(),
        when:()=> r5().gateBeaten },
      { x:2,  y:31, sprite:'soldato1', icon:'💂', verb:'Talk', act:()=> r5GateSoldato(),
        when:()=> !r5().gateBeaten, mark:()=> r5().heardTunnels },
      { x:21, y:31, sprite:'lighthouse_keeper', icon:'🏮', verb:'Talk', act:()=> r5Keeper() },
      { x:5,  y:37, sprite:'ship_captain', icon:'⚓', verb:'Captain', act:()=> r5Captain() },
      { x:4,  y:38, walk:true, verb:'Board', where:'The Vane Shear', act:()=> r5Board() },
    ],
    onRender:(world, d)=>{ if(!r5().arrived) r5ArrivalScene(); },
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
        { id:'capo', kind:'capo', x:12, y:16, face:'d', clock:700, roster:'capo_black', sprite:'capo_black' },
        { id:'a', kind:'soldato', path:[[23,24],[23,16]], face:'u', clock:560, pause:3, roster:'cistern_a', sprite:'soldato2' },
        { id:'b', kind:'soldato', path:[[4,7],[19,7]], face:'r', clock:620, pause:3, roster:'cistern_b', sprite:'soldato1' },
        { id:'c', kind:'soldato', path:[[1,22],[1,16]], face:'u', clock:600, pause:3, roster:'cistern_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:19, y:11, face:'u', spin:'ccw', clock:660, pause:4, roster:'cistern_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.04, size:3, lv:[78,84],
        table:[{sp:'crow',w:2},{sp:'ghost',w:3},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1}] } },
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
               {sp:'goblin_knight',w:1,plus:2},{sp:'horned_lynx',w:1,plus:2},{sp:'puppet',w:1,plus:1}] } },
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
        table:[{sp:'crow',w:2},{sp:'ghost',w:3},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1}] } },
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
        table:[{sp:'crow',w:2},{sp:'ghost',w:3},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1}] } },
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
        table:[{sp:'ghost',w:3},{sp:'crow',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1},{sp:'goblin_knight',w:1,plus:2}] } },
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
        table:[{sp:'ghost',w:3},{sp:'crow',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'puppet',w:1,plus:1},{sp:'goblin_knight',w:1,plus:2}] } },
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
        table:[{sp:'ghost',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'crow',w:1},{sp:'goblin_knight',w:1,plus:2},{sp:'horned_lynx',w:1,plus:2},{sp:'puppet',w:1,plus:1}] } },
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
        table:[{sp:'ghost',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'crow',w:1},{sp:'goblin_knight',w:1,plus:2},{sp:'horned_lynx',w:1,plus:2},{sp:'puppet',w:1,plus:1}] } },
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
     ring of sand behind a rail, benches round it, the Grey Capo in the
     middle. Above him the crypt stair climbs to a door barred from the
     church's side. More of the fighters here: boxers, kickers, judoka, a
     Sumo — and, once in a long while, a Jackal. ---- */
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
        { id:'capo', kind:'capo', x:12, y:19, face:'d', clock:700, roster:'capo_grey', sprite:'capo_grey' },
        { id:'a', kind:'soldato', path:[[4,10],[4,28]], face:'d', clock:600, pause:3, roster:'pit_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[21,28],[21,10]], face:'u', clock:620, pause:3, roster:'pit_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[20,27],[5,27]], face:'l', clock:640, pause:3, roster:'pit_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:12, y:10, face:'d', spin:'ccw', clock:660, pause:4, roster:'pit_l', sprite:'soldato2' },
      ],
      /* more of the fighters here: boxers, kickers, spinners, judoka, a Sumo */
      wild:{ rate:0.035, size:3, lv:[94,102], t2:true, more:{ boxer:4, kicker:4, spinner:4, judo_blue:3, judo_red:3, sumo:2 } } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
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
"..........................","#gggggg.BBBBBBBBBB.gggggg#","#BBBBBB.BBBBBBBBBB.BBBBBB#","#BBBBBB.BBBBBBBBBB.BBBBBB#",
"#BBBBBB.BBBBBBBBBB.BBBBBB#","#BBBBBB.BBBBBBBBBB.BBBBBB#","#BBBBBB.BBBBBBBBBB.BBBBBB#","#BBBBBB.BBBBBBBBBB.BBBBBB#",
"#BBBBBB.BBBBBBBBBB.BBBBBB#","#BBBBBB.BBBBBBBBBB.BBBBBB#","........BBBBBBBBBB........","..........======..........",
"..........======..........","#BBBBBB,,,,,,,,,,,,BBBBBB#","#BBBBBB,,t,,,,,,,,,BBBBBB#","#BBBBBB,,,,,,,,,,,,BBBBBB#",
"#BBBBBB,,,,,,,,,,,,BBBBBB#","#BBBBBB,,t,,~~,,,,,BBBBBB#","#BBBBBB,,,,,~~,,,,,BBBBBB#","#BBBBBB,,,,,,,,,,,,BBBBBB#",
"#BBBBBB,,,,,,,,,,,,BBBBBB#","#BBBBBB,,,,,,,,,,,,BBBBBB#","#BBBBBB,,,,,,,,,,,,BBBBBB#","..........................",
"..........................","#,,,,,,,,,##==####BBBBB###","#,,,,,,,,,##==####BBBBB###","#,,,,,,,,,##==####BBBBB###",
"#wwwwwwwww##==####BBBBB###","############==####BBBBB###","############==######x#####",
    ],
    spawn:[12,19],
    arrive:{ church:[12,19], tailor:[18,23], harbour:[12,38], hill:[12,0] },
    things:[
      { x:12, y:19, walk:true, verb:'In', where:'The Church', arrow:'up', act:()=> r5TownChurch() },
      { x:18, y:23, walk:true, verb:'In', where:"Ugo's", arrow:'right', act:()=> goFloor('tailor', 'door') },
      { x:12, y:38, walk:true, verb:'Down', where:'The Harbour', act:()=> r5TownDown() },
      { x:12, y:5,  w:2, verb:'Up the hill', act:()=> r5VillaRoad(), when:()=> !r5().hill },
      /* (2.92) once Figlio has walked you up, the steps are yours, to the top */
      { x:12, y:0,  w:2, walk:true, verb:'Up', where:'The Hilltop', act:()=> r5HillUp(), when:()=> !!r5().hill },
      /* (2.92) Figlio, home from Region 3's band competition, outside the opera house */
      { x:20, y:7,  sprite:'figlio', icon:'🎙️', verb:'Talk', act:()=> r5Figlio(), when:()=> !!r5().disguise,
        mark:()=> !r5().figlioMet },
      { x:3,  y:7,  walk:true, verb:'Knock', act:()=> r5NonnaDoor() },
      { x:9,  y:7,  walk:true, verb:'Barber', act:()=> r5Barber() },
      { x:19, y:7,  walk:true, verb:'Opera house', act:()=> r5Opera() },
      { x:3,  y:18, walk:true, verb:'Police', act:()=> r5Police() },
      { x:21, y:18, walk:true, verb:'Post office', act:()=> r5PostOffice() },
      { x:7,  y:23, walk:true, verb:'Café', act:()=> r5Cafe() },
      { x:7,  y:28, walk:true, verb:'Trattoria', act:()=> r5Trattoria() },
      { x:18, y:28, walk:true, verb:'Gelateria', act:()=> r5Gelateria() },
      { x:12, y:25, w:2, h:2, verb:'Fountain', act:()=> r5Fountain() },
      { x:5,  y:35, walk:true, verb:'Look', act:()=> r5Belvedere() },
      { x:20, y:32, walk:true, verb:'Funicular', act:()=> r5TownFunicular() },
      /* the capos, at the café's tables: whichever you have beaten below */
      { x:10, y:22, sprite:'capo_purple', icon:'🕴️', verb:'Capo', act:()=> r5CapoLook('purple') },
      { x:10, y:25, sprite:'capo_black',  icon:'🕴️', verb:'Capo', act:()=> r5CapoLook('black'), when:()=> !!r5().capoBlack },
      { x:8,  y:25, sprite:'capo_grey',   icon:'🕴️', verb:'Capo', act:()=> r5CapoLook('grey'),  when:()=> !!r5().capoGrey },
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
     ============================================================ */
  hilltop: {
    key:'hilltop', region:5, title:'The Hilltop', bg:'region5', music:'zone_hilltop', art:'hilltop',
    bx:0, by:0, bs:1/32, nat:[26*32, 39*32],
    rows:[
"###wwwwwwwwwwwwwwwwwwwwwww","###wgggggggggggggggggggggw","###wggggBBBBBBBBBBgBBBBBgw","###wggggBBBBBBBBBBgBBBBBgw",
"###wggggBBBBBBBBBBgBBBBBgw","###wggggBBBBBBBBBBgBBBBBgw","###wggggBBBBBBBBBBgBBBBBgw","###wggggBBBBBBBBBBggg,gggw",
"###wggggBBBBBBBBBBggg,gggw","###wgggggg,,,,,,gg~~g,gggw","###wgggggg,,,,,,gg~~g,gggw","###wg,,,,,,,,,,,,,,,,,,,gw",
"###wwwwwwwww,,wwwwwwwwwwww","..........................","..........................","..........................",
"ggggggBBBBBg==ggBBBBBBBggg","ggggggBBBBBg==ggBBBBBBBggg","ggggggBBBBBg==ggBBBBBBBggg","ggggggBBBBBg==ggBBBBBBBggg",
"ggggggBBBBBg==ggBBBBBBBggg","ggggggBBBBBg==ggBBBBBBBggg","gggggggggggg==gggggggggggg","..........................",
"..........................","gggggggggggg==,,,,,ggggggg","gggggggggggg==ggBBBBBBgggg","gggggggggggg==ggBBBBBBgggg",
"gggggggggggg==ggBBBBBBgggg","wwwww=wwwwwg==ggBBBBBBgggg","gggggggggggg==ggBBBBBBgggg","gggggggggggg==gggggggggggg",
"gggggggggggg==gggggggggggg","############==############","############==############","############==############",
"############==############","############==############","############==############",
    ],
    spawn:[12,38],
    arrive:{ down:[12,38], tower:[21,7] },
    things:[
      { x:12, y:38, w:2, walk:true, verb:'Down', where:'The Old Town', act:()=> r5HillDown() },
      { x:21, y:7,  walk:true, verb:'In', where:'The Tower', arrow:'up', act:()=> r5TowerIn() },
      { x:12, y:9,  w:2, walk:true, verb:'Villa', act:()=> r5VillaDoor() },
      { x:18, y:9,  w:2, h:2, verb:'Fountain', act:()=> r5VillaFountain() },
      { x:8,  y:15, walk:true, verb:'Lemon farm', act:()=> r5LemonFarm() },
      { x:19, y:15, walk:true, verb:'Guard house', act:()=> r5GuardHouse() },
      { x:18, y:25, walk:true, verb:'Knock', act:()=> r5Grandpa() },
    ],
    stealth:{ kind:'town', light:true, feel:0,
      guards:[
        { id:'a',  kind:'soldato', path:[[1,14],[24,14]], face:'r', clock:640, pause:3, sprite:'soldato2' },
        { id:'b',  kind:'soldato', path:[[24,24],[1,24]], face:'l', clock:660, pause:3, sprite:'soldato1' },
        { id:'c',  kind:'soldato', path:[[5,11],[23,11]], face:'r', clock:620, pause:3, sprite:'soldato2' },
        { id:'g1', kind:'talker',  x:11, y:13, face:'r', sprite:'soldato1' },
        { id:'g2', kind:'talker',  x:14, y:13, face:'l', sprite:'soldato2' },
        { id:'v1', kind:'talker',  x:10, y:9,  face:'r', sprite:'soldato2' },
        { id:'v2', kind:'talker',  x:15, y:9,  face:'l', sprite:'soldato1' },
        { id:'l1', kind:'lookout', x:2,  y:13, face:'r', spin:'cw', clock:680, pause:5, sprite:'soldato1' },
      ] },
    paint:(d)=> paintTown(d),
    onRender:(world, d)=> r5TownRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

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
/* Tier 2's wild tables: all thirteen on every floor (2.90). */
Object.values(R5_DECKS).forEach(d=>{
  const w = d.stealth && d.stealth.wild;
  if(w && w.t2 && !w.table) w.table = r5T2Table(w.more);
});
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
  capo_grey: { label:'Grey Capo', ai:['power2','best','best'],
    /* (2.90) by the time you can fight him, you have run through his pit once */
    get shout(){
      return (typeof r5 === 'function' && (r5().oldTown || r5().rush))
        ? `<b>"Well now. You're the one who ran through my pit the night the dead got loose."</b><br><br>He spreads his arms to the empty benches.<br><br>` +
          `<b>"Nobody walks through here for free twice, kid. Beat my champions — in front of everybody."</b>`
        : `<b>"Well now. A new face in my pit."</b><br><br>He spreads his arms to the empty benches.<br><br>` +
          `<b>"Nobody walks through here for free, kid. You want to leave? Beat my champions — in front of everybody."</b>`;
    },
    onBeaten:()=> r5CapoGreyBeaten(),
    waves:[
    [{species:'sumo',level:100},{species:'judo_red',level:100},{species:'strongman',level:100}],
    [{species:'physical_starter',level:101},{species:'lizardape',level:101},{species:'squid',level:101}],
    [{species:'tricerarmor',level:103}] ] },
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
  return !stealthOnWatch(d).filter(def=> !beaten.includes(def.id)).some(def=>{
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
    .concat(R5_FLOORS_T2.filter(f=> r.reached.includes(f) || (typeof isDev === 'function' && isDev())));
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
  const all = [...R5_FLOORS, ...R5_FLOORS_T2];
  const card = f=> `
        <div class="challenge-card" data-floor="${f}">
          <div class="region-num">${all.indexOf(f) + 1}</div>
          <div style="flex:1;">
            <div class="cc-title">${escapeHtml(DECKS[f].title)}</div>
            <div class="cc-desc">${escapeHtml(note(f))}</div>
          </div>
        </div>`;
  const upper = floors.filter(f=> R5_FLOORS_T2.includes(f));
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
  await sceneSay([whale], wn,
    `<b>"My core. I can feel it, up there, at the very top of the town."</b><br><br>` +
    `<b>"Jax brought it here. And he did not bring it for himself."</b>`);
  await sceneSay([whale], wn,
    `<b>"There is something else, too. Under our feet. A great many somethings."</b><br><br>` +
    `<b>"This whole hill is full of the dead."</b>`);
  await sceneSay([me], name, `<b>"Then let's find a way up."</b>`);
  r5().arrived = true;
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
/* The fisherman's wife. (Nonna is somebody else, up in the Old Town.) */
async function r5Marta(){
  const face = faceNpc('fishwife', '👩');
  const first = r5Once('marta');
  const html = first
    ? `The door opens a crack, then all the way.<br><br><b>"Look at you. All bones and bruises."</b> ` +
      `She is small and round and not the least bit afraid of you.<br><br>` +
      `<b>"Come in. Sit. My Gino is out with the boats, and there is soup whether he is here or not."</b>`
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
  const yes = await r5Ask([faceNpc('dockhand','📦')], R5_NAMES.dockhand,
    `<b>"Need something minding? I've got crates, and I don't ask what's in them."</b>`, '📦 Storage', 'Leave');
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
  return sceneSay([faceNpc('station_master','🎩')], R5_NAMES.station_master, r5Next('enzo', [
    `<b>"The funicular runs to the Old Town. Family only, these days."</b><br><br>He taps a sign: <b>NO PAPERS, NO RIDE</b>.`,
    `<b>"Forty years I've run this station. Now I sell tickets nobody is allowed to buy."</b>`,
  ]));
}
async function r5Funicular(){
  await sceneSay([], 'The funicular',
    `The little car waits at the bottom of its rails. A soldato is asleep inside it with his hat over his face.`);
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
  if(!r.disguised){
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
function r5Customs(){
  return sceneSay([], 'The customs house',
    `A brass plate by the door says <b>CUSTOMS</b>. Somebody has scratched <b>FAMILY BUSINESS</b> underneath it.<br><br>` +
    `The door is locked. On the other side, somebody is counting money out loud.`);
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
        `<b>"The customs house is closed. It's always closed. Go away."</b>` ];
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
  const def = R5_ROSTERS.gate;
  walkTeardown();
  beginBattle({ isNpc:true, name:'Soldato', npcId:'soldato1', noFlee:true,
    waves: def.waves.map((w, wi)=> w.map(s=> Object.assign({ ai: s.ai || def.ai[wi] || 'power1', nerfed:false }, s))),
    onWin: ()=> r5GateBeaten() });
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
  /* The night the dead rose: three minutes on the clock (2.91), a word on
     each floor of the second tier as you run through it — and the floor's
     own first words kept for later. */
  if(stealthRush(d)){
    r5RushStart(d);
    if(ui.r5RushAgain){                           // caught, and sent back to the gate to run again
      ui.r5RushAgain = false;
      later(async ()=>{ await r5GhostsPour(); await say(`<b>"They are holding them again. Run — all the way up, and do not stop!"</b>`); });
      return;
    }
    if(fresh && R5_RUSH_LINES[d.key] && r5Once('rush_' + d.key)) later(()=> say(R5_RUSH_LINES[d.key]));
    return;
  }
  /* The first time on each floor, the Whalelord says something about it. */
  if(d.stealth.first && r5Once('first_' + d.key))
    return later(async ()=>{ await say(d.stealth.first); if(d.stealth.warn) await say(d.stealth.warn); });
  /* The first time in the dark in disguise (2.91). */
  if(r.disguised && fresh && r5Once('disguisedDark'))
    return later(()=> say(`<b>"In that uniform, nobody down here will look at you twice. Walk right past them, if you like."</b><br><br>` +
                          `<b>"And the ones who come alongside you, you can talk to. They do love to talk."</b>`));
  /* Back under the Old Town after that night: the Family has its posts back. */
  if(d.tier === 2 && r.oldTown && fresh && r5Once('afterRush'))
    return later(()=> say(`<b>"The dead have gone back down, and the Family's men are back at their posts."</b><br><br>` +
                          `<b>"It will not be as easy as that night. Keep to the dark."</b>`));
  /* With the Purple Capo beaten, he feels it: something burning in the Armoury. */
  if(r.tier1 && !r.phoenixMet && fresh && (d.key === 'cata_stair' || d.key === 'cata_stair_r1') && r5Once('senseArmoury'))
    return later(()=> r5SenseArmoury());
  /* An evade floor warns you every time you come in (2.72). */
  if(d.stealth.kind === 'evade' && fresh && !recaught && d.stealth.again) return later(()=> say(d.stealth.again));
  /* A new day, and the Family has manned its posts again (said as you come
     in fresh, which is when the men are back at their posts). */
  if(d.stealth.kind === 'fight' && fresh && r.regrouped){
    r.regrouped = false;
    saveProfile();
    later(()=> say(`<b>"They are back. Every post we emptied has a man on it again."</b><br><br>` +
                   `<b>"The Family regroups every day. So will we."</b>`));
  }
}
async function r5DarkIntro(){
  const r = r5();
  r.intro = true;
  saveProfile();
  await sceneWait(500);
  const whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([whale], wn, `<b>"Dark, is it not? You cannot see a thing."</b><br><br><b>"I can. The dead do not need eyes."</b>`);
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
    walkTeardown();
    storyModal(monPortrait('whalelord', 150, { view:'front', bare:true }), 'The first tier is clear',
      `You have cleared the first tier of the catacombs under Cosa Nostia.<br><br>` +
      `<b>+3 Protein Supplements</b><br><br>` +
      `<i>The Whalelord has felt something in the Armoury, the furthest room off the Long Stair, past the Barracks.</i>`,
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
    .r5-ghostfire{display:inline-block;line-height:0;
      filter:brightness(.6) sepia(1) hue-rotate(225deg) saturate(3) drop-shadow(0 0 8px rgba(170,90,255,.95));opacity:.92;}
    @keyframes r5Flicker{0%,100%{transform:scale(1);filter:brightness(1)}40%{transform:scale(1.07);filter:brightness(1.35)}
      70%{transform:scale(.96);filter:brightness(.85)}}
    .r5-darkglow{position:absolute;border-radius:50%;pointer-events:none;
      background:radial-gradient(circle,rgba(200,140,255,.55) 0%,rgba(120,40,200,.5) 30%,rgba(60,10,110,.32) 52%,rgba(20,0,40,0) 72%);
      animation:r5Flicker .9s ease-in-out infinite;}
    .r5-darkglow.gold{background:radial-gradient(circle,rgba(255,240,180,.85) 0%,rgba(255,190,80,.6) 32%,rgba(240,120,40,.3) 55%,rgba(240,120,40,0) 72%);}
    /* the ghost phoenix's orb (2.92): black, pulsing slowly like a heartbeat */
    .r5-orb{position:absolute;pointer-events:none;border-radius:50%;
      background:radial-gradient(circle at 40% 36%,#3b2652 0%,#140a20 30%,#000 64%);
      animation:r5OrbPulse 2.4s ease-in-out infinite;}
    @keyframes r5OrbPulse{
      0%,100%{transform:scale(.9);box-shadow:0 0 10px 3px rgba(110,50,190,.45),inset 0 0 12px rgba(150,90,255,.22);}
      50%{transform:scale(1.02);box-shadow:0 0 26px 9px rgba(140,70,235,.7),inset 0 0 20px rgba(170,110,255,.4);}}
    /* …and the ghost phoenix, risen out of it, floating slowly up and down */
    @keyframes r5GPFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7%)}}
    .scene-actor.r5-gpfloat .sa-in{animation:r5GPFloat 3.2s ease-in-out infinite;}
    /* turned to face the ghost phoenix (2.92): the pictures face left; to face
       right — towards it — they are flipped */
    .walk-you.r5-face-r img{transform:scale(-1.275, 1.275);}
    .walk-ghost.r5-face-r img, .walk-ghost.r5-face-r .mon-portrait img{transform:scale(-1.365, 1.365);}
    .scene-actor.r5-face-r .sa-in > *{transform:scaleX(-1);}
    /* the run's clock (2.91) */
    .r5-rush{position:absolute;left:8px;top:8px;z-index:8;padding:4px 11px;border-radius:12px;
      background:rgba(52,22,86,.88);color:#f3e9ff;border:1px solid rgba(190,140,255,.7);
      font:800 13px system-ui;letter-spacing:.02em;box-shadow:0 0 10px rgba(150,90,230,.6);pointer-events:none;}
    .r5-rush b{font-size:15px;}
    .r5-rush.low{background:rgba(120,24,40,.9);border-color:#ff8a8a;box-shadow:0 0 12px rgba(255,90,90,.7);}
    @keyframes r5RushPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
    .r5-rush.crit{animation:r5RushPulse .6s ease-in-out infinite;}
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
/* The ghost phoenix's orb (2.92): a ball of darkness over 2×2 tiles, its
   top-left at (x, y), pulsing. A scene glow, so sceneClear clears it. */
const R5_ORB = { x:5, y:5 };                     // its tiles in the Armoury: (5,5)–(6,6)
function r5PaintOrb(id, x, y, fadeIn){
  r5Css();
  const world = $('#walkWorld'); if(!world) return null;
  const T = WALK_T;
  let o = document.getElementById('sg-' + id);
  if(!o){ o = document.createElement('div'); o.id = 'sg-' + id; world.appendChild(o); }
  o.className = 'scene-glow r5-orb';
  o.style.left = (x * T) + 'px'; o.style.top = (y * T) + 'px';
  o.style.width = o.style.height = (2 * T) + 'px';
  o.style.zIndex = 12 + Math.floor(y);
  if(fadeIn){
    o.style.transition = 'none'; o.style.opacity = '0';
    void o.offsetWidth;
    o.style.transition = `opacity ${fadeIn * SCENE_SPEED}ms ease`;
    o.style.opacity = '1';
  }
  return o;
}
/* Out of the orb: it fades slowly away while the ghost phoenix (2 tiles)
   fades in, rising from the orb's centre to a little above it; then it
   floats, slowly up and down. Its box's top-left ends at (x, y - 0.6). */
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
  }
  const orb = document.getElementById('sg-' + orbId);
  if(orb){ orb.style.transition = `opacity ${MS * SCENE_SPEED}ms ease`; orb.style.opacity = '0'; }
  /* the orb's "!" goes with it */
  document.querySelectorAll('.walk-mark').forEach(m=>{ if(Math.abs(parseFloat(m.style.left) - (x + 1) * T) < 1) m.remove(); });
  await sceneWait(MS);
  if(orb) orb.remove();
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
   your phoenix. Their pictures face left, so whoever has it on their right is
   flipped. gx is its middle, in tiles; null turns everyone back. */
function r5FaceGP(gx){
  r5Css();
  const w = walkState(), p = w.at && w.at[w.deck], q = w.ghostAt && w.ghostAt[w.deck];
  const turn = (el, cx)=>{ if(el) el.classList.toggle('r5-face-r', gx != null && cx != null && cx < gx - 0.05); };
  turn($('#walkYou'), p ? p.x + 0.5 : null);
  turn($('#walkGhost'), q ? q.x + 0.5 : null);
  const m = document.getElementById('sa-myphoenix');
  turn(m, m && m._o ? m._o.x + m._o.w / 2 : null);
}
/* In the Armoury, wherever the ghost phoenix (or its orb) is, face it. */
function r5FaceGPHere(){
  if(walkState().deck !== 'cata_stair_r2') return;
  const a = document.getElementById('sa-gphoenix') || document.getElementById('sa-gpwait');
  if(a && a._o) return r5FaceGP(a._o.x + a._o.w / 2);
  if(document.getElementById('sg-gporb')) return r5FaceGP(R5_ORB.x + 1);
  r5FaceGP(null);
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
  /* The plan, and the three minutes (2.91). */
  await sceneSay([gp()], R5_GP,
    `<b>"So we will not fight them alone any more. If every ghost in this hill pushes at once, we can break free of the psychics — for a little while."</b>`);
  await sceneSay([gp()], R5_GP,
    `<b>"Three minutes. That is the longest we can hold out before their minds press us down again."</b><br><br>` +
    `<b>"For those three minutes the dead will hold every one of the Padrino's soldiers on the floors above — soldatos, capos, all of them."</b>`);
  await sceneSay([gp()], R5_GP,
    `<b>"So run. Up through all four floors and out at the top, into the church, and do not stop."</b><br><br>` +
    `<b>"If the time runs out before you are through, they will catch you — and we will push again, and you will run again."</b>`);
  if(mine){
    await sceneSay([faceMon('phoenix', { crowned:isCrowned(mine.mon) })], displayName(mine.mon), `<b>"Will I see you again?"</b>`);
    await sceneSay([gp()], R5_GP, `<b>"Before I rest, little one. I promise."</b>`);
  }
  /* It rises, screaming, and the whole hill answers. */
  r5DarkGlow('gp4', gpX + 1, GY, 7);
  sceneShake(1400, t=> 0.18 * Math.max(0, 1 - t / 1400));
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
  goFloor('cata_garrison', 'gate');
  await sceneWait(1200);
  await sceneCurtain(false, 800);
  await r5GhostsPour();
  await sceneSay([faceMon('whalelord')], whaleName(), R5_RUSH_LINES.cata_garrison);
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
  r5DarkGlow('gpgift', at.GX, at.GY, 3.6, true);
  const el = document.getElementById('sa-myphoenix');
  const o = el && el._o;
  if(o) sceneSparkles(o.x, o.y, o.w, o.h, 1400);
  sceneShake(500, t=> 0.05 * (1 - t / 500));
  await sceneWait(1300);
  const had = ownsStone('fireStone');
  state.sacredFlameGranted = true;
  if(!had) addStone('fireStone', 1);
  r.phoenixGift = true;
  await saveProfile();
  await sceneGlowOut(['gpgift'], 600);
  await sceneSay([face()], me,
    `It glows gold from the inside, like a coal when you blow on it.<br><br><b>"It's warm... I feel bigger. Brighter."</b>`);
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
  if(!ui.gpOut){                                  // (2.92) its orb, until it is touched
    if(!document.getElementById('sg-gporb')) r5PaintOrb('gporb', R5_ORB.x, R5_ORB.y);
    return r5FaceGPHere();
  }
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
  await captureStream(id, d, (id === 'cata_pit' && !r.capoGrey) ? ['soldato1', 'capo_grey', 'soldato2'] : null);
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
/* Up the Garrison from the gate: the dead going ahead of you. */
async function r5GhostsPour(){
  const w = walkState(), d = DECKS[w.deck];
  if(!d || !$('#walkWorld')) return;
  const p = w.at[d.key] || { x:12, y:37 };
  const kinds = ['ghost', 'ghost_flame', 'ghost', 'ghost', 'ghost_flame', 'ghost'];
  kinds.forEach((sp, i)=> r5MonActor('pour' + i, sp, p.x - 1 + (i % 3), p.y - 0.5, 0.9, { z:60 }));
  await sceneWait(200);
  await Promise.all(kinds.map((sp, i)=> r5MoveActor('pour' + i, 3 + ((i * 7) % 20), p.y - 12 - (i * 4) % 14, 1500 + i * 120, true)));
  kinds.forEach((sp, i)=> sceneActorGone('pour' + i));
}
/* What he says on each floor of the second tier as you run through it. */
const R5_RUSH_LINES = {
  cata_garrison: `<b>"Run! Every soldier in here has a ghost on him. They cannot see us now."</b><br><br>` +
                 `<b>"Up — all the way up, to the stair at the far end. Three minutes. Do not stop!"</b>`,
  cata_quarry:   `<b>"The quarry. Keep climbing — terrace by terrace, the dead are holding every man on it."</b>`,
  cata_cellars:  `<b>"Wine cellars. We must be right under the Old Town now. Keep going!"</b>`,
  cata_pit:      `<b>"The fight pit — and its capo, with a ghost on each arm."</b><br><br>` +
                 `<b>"The stair at the top goes up to the church. Go!"</b>`,
};

/* ---------- tier 2 (2.88) ---------- */
/* The Grey Capo, in the middle of his ring: the end of the second tier. */
async function r5CapoGreyBeaten(){
  const r = r5();
  const first = !r.capoGrey;
  r.capoGrey = true;
  if(first) state.inventory.protein = (state.inventory.protein || 0) + 3;
  await saveProfile();
  const w = walkState();
  w.at = w.at || {}; w.at.cata_pit = { x:12, y:21 }; w.face = 'u';
  ui.walkFresh = false;
  go('cata_pit');
  const capo = faceNpc('capo_grey','🕴️'), whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([capo], 'Grey Capo',
    `He looks round at the empty benches, as if somebody might have been watching.<br><br><b>"Nobody saw that. Understand? Nobody."</b>`);
  await sceneSay([capo], 'Grey Capo',
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
  if(r5Once('first_tailor_after'))
    setTimeout(()=> sceneSay([faceMon('whalelord')], whaleName(),
      `<b>"Ugo's back room. Nobody comes in here but Ugo — so if you ever want that cap off, this is the place."</b>`), 500);
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
  if(!r.disguised){
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
  if(!r.disguised){
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
function r5DisguiseDeck(d){ return !!(d && d.region === 5 && (d.stealth || d.key === 'church' || d.key === 'tailor' || d.tower)); }
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
  if(d.stealth && d.stealth.kind === 'town'){
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
  const g = st.guards.slice().sort((a, b)=> far(a) - far(b))[0];
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
    .filter(g=>{ const def = guardDef(d, g.id); return def && def.kind !== 'capo'; })
    .slice(0, 2)
    .map(g=> ({ key:'talk-' + g.id, html:'🗨️ Talk<small>Soldato</small>', act:()=> r5SoldatoTalk(d, g) }));
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
  `<b>"There's a kid loose in the catacombs, they say. Beat three capos! Don't tell the Grey Capo I told you."</b>`,
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
/* The first time in each of the Family's lit places. */
const R5_TOWN_FIRST = {
  old_town:`<b>"The Old Town. Soldatos on every corner, and capos at the café — and not one of them has looked twice at you."</b><br><br>` +
           `<b>"Ugo was right. Walk as if you belong here."</b>`,
  hilltop: `<b>"The Padrino's own hill. More of his men up here, and every one of them watching that gate."</b><br><br>` +
           `<b>"Keep that cap on, and let them think you are Figlio's porter."</b>`,
};
function r5TownRender(world, d){
  const r = r5();
  if(!r.disguise){ setTimeout(()=> renderOldTownZone(), 0); return; }   // (before Ugo — the developer's way: the church)
  if(!r.disguised){ r.disguised = true; saveProfile(); walkYouRefresh(); walkSideRefresh(); }
  startStealth(world, d);
  if(!ui.sceneRunning && R5_TOWN_FIRST[d.key] && r5Once('first_' + d.key))
    setTimeout(()=> sceneSay([faceMon('whalelord')], whaleName(), R5_TOWN_FIRST[d.key]), 500);
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
  const capos = ['capo_purple'].concat(r.capoBlack ? ['capo_black'] : [], r.capoGrey ? ['capo_grey'] : []);
  const crowd = hill ? ['soldato1', 'soldato2']
    : ['soldato1', capos[0], 'soldato2', 'soldato1', capos[1] || 'soldato2', 'soldato2', capos[2] || 'soldato1', 'soldato1', 'soldato2', 'soldato1'];
  await captureStream(id, d, crowd);
  if(hill){
    const sol = faceNpc('soldato2', '💂');
    await sceneSay([sol], 'Soldato', revealed
      ? `<b>"Signor Figlio's porter, eh? Signor Figlio's porter is the kid from the catacombs!"</b>`
      : `<b>"That's no porter. That's the kid from the catacombs — on the Padrino's own hill!"</b>`, 'Continue');
    await sceneSay([sol], 'Soldato', `<b>"Got you. Nowhere to run up here."</b>`, 'Continue');
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
      w.at.hilltop = { x:18, y:25 }; w.face = 'd'; w.ghostAt.hilltop = { x:17, y:25 };
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
   win here (to 105; its crowned Howler five above that). A first win ever
   still brings his Dragon Stone.
   ============================================================ */
const R5_FIGLIO_LINES = [
  `<b>"They have me singing every night but Monday. My father has never once come to listen."</b>`,
  `<b>"You know, that uniform almost suits you. Almost."</b>`,
  `<b>"The mediums frightened me when I was small. They still do, a little. They never blink."</b>`,
  `<b>"If you see my father before I do, tell him— no. Don't tell him anything."</b>`,
];
function r5FiglioLevel(){ return 94 + Math.min(r5().figlioWins5 || 0, 11); }
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
    line + `<br><br><i>A battle, once a day: his team starts at level <b>${r5FiglioLevel()}</b>. Win for <b>+3 Silver Medals</b>.</i>`,
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
function r5FiglioFight(){
  if(!ensurePool()) return;
  const L = r5FiglioLevel();
  walkTeardown();
  beginBattle({ isNpc:true, name:'Figlio', npcId:'figlio', bgKey:'battle_opera', figlio:true,
    waves:[
      [{species:'ground_starter',   level:L,     ai:'best'}],
      [{species:'psychic_starter',  level:L + 1, ai:'best'}],
      [{species:'ghost_starter',    level:L + 2, ai:'best'}],
      [{species:'physical_starter', level:L + 3, ai:'best'}],
      [{species:'flying_starter',   level:L + 4, ai:'best'}],
      [{species:'howler',           level:L + 5, ai:'best', crowned:true, supplements:10}],
    ],
    onWin: ()=> r5FiglioWon() });
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
    `<b>+3 Silver Medals</b> · next time his team is level <b>${r5FiglioLevel()}</b> and up.`,
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
  r.said.first_hilltop = true;                   // he says it all here
  await saveProfile();
  w.busy = false;
  go('hilltop');                                 // (ui.sceneRunning holds: it starts nothing itself)
  await sceneWait(500);
  await sceneCurtain(false, 800);
  w.busy = true;
  sceneActor('figlio', { x:13, y:11, src:'assets/npc/figlio.png', icon:'🎙️' });
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
  if(!r.disguised){
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
  if(!r.disguised){ r.disguised = true; saveProfile(); toast('🎭 You put your uniform on before you go up.'); }
  w.at = w.at || {}; w.ghostAt = w.ghostAt || {};
  if(!w.at.hilltop){ w.at.hilltop = { x:12, y:11 }; w.face = 'u'; }
  if(!w.ghostAt.hilltop) w.ghostAt.hilltop = { x:w.at.hilltop.x, y:w.at.hilltop.y };
  ui.walkFresh = false;
  ui.stealthFresh = true;
  ui.currentZone = r5Zone('hilltop') || ui.currentZone;
  return go('hilltop');
}
function r5VillaDoor(){
  if(r5().holdBroken)
    return sceneSay([faceMon('whalelord')], whaleName(),
      `<b>"My core is behind that door. I can feel it beating, like a second heart."</b><br><br><i>The villa is coming soon.</i>`);
  return sceneSay([faceNpc('soldato1', '💂')], 'Soldato', r5Turn('villaDoor', [
    `<b>"Signor Figlio's porter? Wait out here. The Padrino sees nobody."</b>`,
    `<b>"The kitchens are round the side, junior. Not this door. Never this door."</b>`,
  ]));
}
function r5VillaFountain(){
  return sceneSay([], 'The fountain', `A stone lion spits water into a round basin. Somebody has scrubbed it very, very clean.`);
}
function r5LemonFarm(){
  return sceneSay([], 'The lemon farm',
    `Crates of lemons stacked to the roof, every one stamped with the Family's mark. For the Padrino's table — and nobody else's.`);
}
function r5GuardHouse(){
  return sceneSay([], 'The guard house',
    `Inside, off-duty soldatos are playing cards and arguing about who cheated. Nobody looks up at a junior.`);
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
    ? `The door opens a crack. An old man peers at your uniform, then at your face, and opens it all the way.<br><br>` +
      `<b>"A junior? Up here? You look done in. Come in, sit down."</b><br><br>` +
      `<b>"My granddaughter Lucia mends the nets down at the harbour. You've met her? She talks too much. Gets it from me."</b>`
    : r.holdBroken ? `<b>"Can you hear that? Singing, under the hill. I haven't heard that since I was a boy."</b>`
                   : r5Turn('grandpa', R5_GRANDPA_LINES);
  const yes = await r5Ask([faceNpc('grandpa', '👴')], 'Grandpa', html, '🍋 Rest here', 'Not now');
  if(yes) leaveDeck('recover');
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
   level the floor's for two waves, then one higher every two (98 on floor 1
   to 108 on floor 11), never past the region's cap (110, REGION_CAPS[5]);
   AI Power2 for two waves, then Best. A master brings 18, always in threes:
   in the middle of each wave a crowned starter or elite (10 supplements),
   flanked by two monsters with strong passives; AI Best. The Psychic
   Master's last is a crowned Fox carrying Discombobulate +, the Ghost
   Master's a crowned Shadow carrying Curse ✦ (cast on their first action,
   as yours are). First wins: +1 protein a disciple; the Psychic Master
   gives the Psychic Stone (+2 protein); the Ghost Master's fall breaks the
   hold on the dead (+3 protein) — r5().holdBroken. Lose, and you keep every
   floor you have won.
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
    waves:[['squid','squid'], ['psychic_starter','squid'], ['moon_swan','squid'], ['squid','psychic_starter'], ['moon_swan','psychic_starter'], ['squid','moon_swan','squid']],
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
  { sprite:'psychic_disciple2', lv:101,
    waves:[['psychic_starter','squid'], ['moon_swan','squid'], ['squid','psychic_starter'], ['moon_swan','psychic_starter'], ['squid','moon_swan'], ['psychic_starter','squid','moon_swan']],
    sees:[`A girl in a grey coat far too big for her rolls her eyes at you.<br><br><b>"Do not bother pulling the cap down. In here, we read what you are thinking."</b><br><br>` +
          `<b>"You are thinking about the stairs behind me."</b>`],
    beaten:`<b>"I did not see that coming. I always see things coming."</b>`,
    talk:`<b>"You are thinking about lunch. Finally — something normal."</b>` },
  /* 5 — a young man */
  { sprite:'ghost_disciple3', lv:102,
    waves:[['cyclops','ghost_flame'], ['ghost','crow','ghost'], ['horned_lynx','puppet'], ['goblin','cyclops'], ['ghost_flame',R5_KNIGHT_T], ['puppet','horned_lynx','ghost']],
    sees:[`A young man cracks his knuckles.<br><br><b>"I could feel your whale from the floor below — cold, and very angry."</b><br><br>` +
          `<b>"Every ghost in this hill answers to us. Even yours will, before I am finished."</b>`],
    whale:`<b>"I answer to nobody but this child."</b>`,
    beaten:`<b>"Your whale answers to nobody. I see that now."</b>`,
    talk:`<b>"Your whale keeps looking at me. Tell it to stop."</b>` },
  /* 6 — a young man */
  { sprite:'psychic_disciple3', lv:103,
    waves:[['moon_swan','squid'], ['psychic_starter','squid','squid'], ['moon_swan','psychic_starter'], ['squid','moon_swan'], ['psychic_starter','squid'], ['moon_swan','psychic_starter','squid']],
    sees:[`A young man in a grey coat smiles without looking up.<br><br><b>"You are thinking that the cap was a good idea. It was not — not in here."</b><br><br>` +
          `<b>"Halfway up already. Most of the Padrino's men never get past the first floor — and they work here."</b>`],
    beaten:`<b>"Halfway. Hm. Perhaps you will get further than halfway."</b>`,
    talk:`<b>"Up. Always up. Do you never get tired?"</b>` },
  /* 7 — an old man */
  { sprite:'ghost_disciple4', lv:104,
    waves:[['ghost','goblin'], ['crow','ghost_flame','ghost'], ['ghost_starter','cyclops'], ['firehound','puppet'], [R5_KNIGHT_T,'horned_lynx'], ['ghost_starter','firehound','goblin']],
    sees:[`An old man leans on his stick and peers at the air over your shoulder.<br><br><b>"Your whale has been floating behind you since the door. In here it is hard to miss — like a cold draught that glares."</b><br><br>` +
          `<b>"Seven floors of us, and still you climb. The dead admire that. So do I — a little."</b>`],
    beaten:`<b>"Seven down. The dead are cheering. I wish they would not."</b>`,
    talk:`<b>"I have stopped holding them down. I can hear them singing."</b>` },
  /* 8 — a young man */
  { sprite:'psychic_disciple4', lv:105,
    waves:[['squid','moon_swan'], ['psychic_starter','squid','moon_swan'], ['squid','psychic_starter'], ['moon_swan','squid'], ['psychic_starter','moon_swan'], ['squid','psychic_starter','moon_swan']],
    sees:[`A tall young man taps his temple.<br><br><b>"Your thoughts are racing. Fear?"</b> A frown. <b>"No... you are enjoying this. How strange."</b>`],
    beaten:`<b>"Strange child. Go on up."</b>`,
    talk:`<b>"Strange child. You think about a whale a great deal, you know."</b>` },
  /* 9 — a very old man */
  { sprite:'ghost_disciple5', lv:106,
    waves:[['ghost_flame','puppet'], ['cyclops','ghost','crow'], [R5_KNIGHT_T,'horned_lynx'], ['puppet','ghost_flame','goblin'], ['firehound','cyclops'], ['ghost_starter',R5_KNIGHT_T,'puppet']],
    sees:[`A very, very old man is asleep in his chair. He wakes with a snort.<br><br><b>"Eh? A whale? A WHALE! In my day, ghosts were the size of a cat."</b>`,
          `<b>"And an old fire on you, too — a phoenix's. I remember that bird. I was young then. Almost as young as you. The dead of this hill remember it too."</b>`],
    seesPlain:[`A very, very old man is asleep in his chair. He wakes with a snort.<br><br><b>"Eh? A whale? A WHALE! In my day, ghosts were the size of a cat."</b>`,
               `<b>"And it smells of the catacombs. You came up through the dead, the pair of you — and they let you."</b>`],
    beaten:`<b>"That fire burns hotter than I thought. Hotter than my knees, anyway."</b>`,
    beatenPlain:`<b>"The dead let you through, and so must I. Now let me sleep."</b>`,
    talk:`<b>"Mind the stairs. They are older than the town. Older than me, even. Just."</b>` },
  /* 10 — a short young woman */
  { sprite:'psychic_disciple5', lv:107,
    waves:[['psychic_starter','squid'], ['moon_swan','squid','psychic_starter'], ['squid','moon_swan'], ['psychic_starter','squid','moon_swan'], ['moon_swan','psychic_starter'], ['squid','moon_swan','psychic_starter']],
    sees:[`A young woman, a head shorter than you would expect, folds her arms.<br><br>` +
          `<b>"You are counting the floors in your head — three more — and wondering what is at the top. Your thoughts are very easy to read."</b>`,
          `<b>"And now you are thinking I am short. I am not short. I am concentrated."</b><br><br>` +
          `<b>"Only one of us above me, and then the masters. And then nothing at all — only the sky."</b>`],
    beaten:`<b>"Only the masters now. And then the sky."</b>`,
    talk:`<b>"The masters will be waiting. They always are."</b>` },
  /* 11 — an old sage, in a great Taoist robe */
  { sprite:'ghost_disciple6', lv:108,
    waves:[['ghost_starter','crow'], ['ghost','puppet','cyclops'], ['firehound','horned_lynx'], [R5_KNIGHT_T,'ghost_flame','goblin'], ['puppet','firehound'], ['ghost_starter','horned_lynx',R5_KNIGHT_T]],
    sees:[`An old man in a great Taoist robe sits cross-legged in the middle of the ring, his wide sleeves spread around him on the floor like folded wings.<br><br>` +
          `<b>"The whale behind you has gone quiet. Even the dead fall silent before what waits upstairs."</b>`,
          `<b>"Above me are the masters: the one who leads our order, and the young mistress she answers to. They will not be gentle. ` +
          `Turn back, child. I am telling you this as a kindness."</b>`],
    beaten:`<b>"The river does not argue with the stone. It goes round it, and on. Go on, then."</b>`,
    talk:`<b>"One candle is easily blown out. Many candles together make a fire. Your whale knows this."</b>` },
  /* 12 — the Psychic Master: the leader of the exorcists' order */
  { sprite:'psychic_master', lv:109, master:true,
    waves:[['moon_swan', R5_CROWNED('squid'), 'thunderhound'],
           ['mantaray', R5_CROWNED('moon_swan'), 'moon_swan'],
           ['thunderhound', R5_CROWNED('squid'), 'moon_swan'],
           ['moon_swan', R5_CROWNED('moon_swan'), 'mantaray'],
           ['thunderhound', R5_CROWNED('squid'), 'mantaray'],
           ['moon_swan', R5_CROWNED('psychic_starter', { veryHigh:{ type:'Psychic', plus:1, cast:true } }), 'thunderhound']],
    sees:[`The master is a tall woman in a long grey coat — one of Ugo's — and she does not blink.<br><br>` +
          `<b>"A junior soldato who is not a junior soldato, thinking very hard about a villa, a stolen core and a whale. So you are the child the dead keep whispering about."</b>`,
          `<b>"My order came over the sea twenty years ago, to find one ghost for the Padrino. Just one. We never found it. ` +
          `So he kept us, to hold all the others down instead — and now we answer to his grandniece. The Signorina. Upstairs."</b>`,
          `<b>"For twenty years we have held this hill down with our minds. Every ghost in it, quiet. Do you know what happens if we stop?"</b>`],
    whale:`<b>"They rise."</b>`,
    beaten:`<b>"Then it is done. Without me, my order cannot hold them for long."</b><br><br>` +
           `A stone drops into your hand from the folds of the grey coat — cold and clear, with something turning slowly inside it.<br><br>` +
           `<b>"Take it. A stone from my own country. It answers a mind like yours."</b> She glances at the ceiling. <b>"The Signorina will not be so kind."</b>`,
    talk:`<b>"Twenty years we held them. I had forgotten how loud this hill is."</b>` },
  /* 13 — the Ghost Master: the Padrino's grandniece */
  { sprite:'ghost_master', lv:110, master:true,
    waves:[['ghost', R5_CROWNED('goblin'), 'cyclops'],
           ['cyclops', R5_CROWNED('horned_lynx'), 'ghost'],
           ['puppet', R5_CROWNED('goblin_knight'), 'ghost'],
           ['goblin_knight', R5_CROWNED('puppet'), 'cyclops'],
           ['puppet', R5_CROWNED('firehound'), 'goblin_knight'],
           ['firehound', R5_CROWNED('ghost_starter', { veryHigh:{ type:'Ghost', plus:2, cast:true } }), 'puppet']],
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
  f.ai = f.ai || (f.master ? ['best', 'best', 'best', 'best', 'best', 'best'] : ['power2', 'power2', 'best', 'best', 'best', 'best']);
  f.dare = n === 12 ? `<b>"My mind against yours, then."</b>`
         : n === 13 ? `<b>"Come and see what the Padrino's grandniece can do."</b>`
         : f.kind === 'ghost' ? `<b>"Come, then. Let the dead see what you are made of."</b>`
                              : `<b>"I already know what you will do. Do it anyway."</b>`;
});
/* A floor's team: species by name. A disciple's at the floor's level for
   two waves, then one higher every two; a master's the same — never past
   the region's cap. */
function r5TowerWaves(n){
  const f = R5_TOWER[n - 1], top = (typeof REGION_CAPS !== 'undefined' && REGION_CAPS[5]) || 110;
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
  if(r.disguise && !r.disguised){
    const yes = await r5Ask([faceMon('whalelord')], whaleName(),
      `<b>"Out there, the soldatos would know your face. Put on the disguise first."</b>`, '🎭 Put it on', 'Stay inside');
    if(!yes) return;
    r5SetDisguise(true);
  }
  goFloor('hilltop', 'tower');
}
/* On each floor, the first time: they see you for what you are. */
function r5TowerRender(world, d){
  const r = r5(), n = d.tower, f = R5_TOWER[n - 1];
  if(n > (r.tower.reached || 0)){ r.tower.reached = n; saveProfile(); }
  if(ui.sceneRunning || r5TowerBeaten(n) || r.said['tower_met_' + n]) return;
  r.said['tower_met_' + n] = true;
  saveProfile();
  const w = walkState();
  w.busy = true;
  setTimeout(async ()=>{
    ui.sceneRunning = true;
    if(n === 1 && r5Once('towerDoor'))
      await sceneSay([faceMon('whalelord')], whaleName(), `<b>"The air in here is thick — with minds, and with the dead they talk to. They know we are here already."</b>`);
    const lines = (n === 9 && !r.phoenixGift) ? [].concat(f.seesPlain) : f.sees;
    for(const line of lines) await sceneSay([r5TowerFace(n)], f.name, line);
    if(f.whale) await sceneSay([faceMon('whalelord')], whaleName(), f.whale);
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
  if(!f.master)
    return `<i>${ws.length} waves, ${all.length} ${what}, level ${lvl}: a <b>${beat}</b> monster of yours beats them. No running.</i>`;
  const centre = f.kind === 'ghost' ? 'Ghost' : 'Psychic';
  const warn = n === 12
    ? ` The last, a crowned Fox, opens with <b>Discombobulate +</b>: for 5 turns your monsters are muddled — a muddled one swings at its own side for <b>90%</b> of its damage, certain at first and then a <b>20%</b> chance each turn, and may nap instead (<b>5%</b>).`
    : ` The last, a crowned Shadow, opens with <b>Curse ✦</b>: for 5 turns your side takes <b>30% more</b> damage, theirs <b>15% less</b>, and your passives are muted.`;
  return `<i>${ws.length} waves of 3 — ${all.length} monsters, level ${lvl}. In the middle of each, a <b>crowned</b> ${centre} monster; ` +
         `either side of it, one with a strong passive. A <b>${beat}</b> monster of yours beats her ${f.kind === 'ghost' ? 'ghosts' : 'psychics'}.${warn} No running.</i>`;
}
async function r5TowerChallenge(n){
  const f = R5_TOWER[n - 1];
  if(ui.sceneRunning || walkState().busy) return;
  const yes = await r5Ask([r5TowerFace(n)], f.name, f.dare + '<br><br>' + r5TowerNote(n), '⚔️ Fight', 'Not yet');
  if(!yes || !ensurePool()) return;
  walkTeardown();
  beginBattle({ isNpc:true, name:f.name, npcId:f.sprite, noFlee:true, bgKey:'battle_tower',
    waves:r5TowerWaves(n), onWin: ()=> r5TowerWon(n) });
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
  if(first && n === 12){
    const had = ownsStone('psychicStone');
    if(!had) addStone('psychicStone', 1);
    state.inventory.protein = (state.inventory.protein || 0) + 2;
    emblem = uiIcon('psychic_stone', 130, '🔮');
    reward = (had ? '' : `<b>🔮 Psychic Stone</b> — a Psychic monster carrying it learns half again as fast (<b>1.5× experience</b>), ` +
                         `and at a level ceiling past 100 it is the stone it charges to break through.<br><br>`) +
             `<b>+2 Protein Supplements</b>`;
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
/* The Ghost Master beaten: the hold on the dead breaks. */
async function r5HoldBreaks(){
  const r = r5();
  go('tower_13');
  ui.sceneRunning = true;
  const w = walkState();
  w.busy = true;
  await sceneWait(600);
  const gm = ()=> r5TowerFace(13), G = 'Ghost Master';
  await sceneSay([gm()], G, `The candles gutter all at once. The ghost at her feet uncurls, looks at her — and drifts away through the wall.<br><br><b>"You don't know what you've done."</b>`);
  await sceneSay([gm()], G, `<b>"My great-uncle trusted me with this hill. Twenty years, every ghost in it quiet — and now there's nobody left to hold them."</b>`);
  sceneShake(1600, t=> 0.14 * Math.max(0, 1 - t / 1600));
  await sceneWait(900);
  await sceneCurtain(true, 700);
  sceneClear();
  await sceneCurtainText('Far below, under the whole hill, something lets go.', 700);
  await sceneWait(1600);
  await sceneCurtainText('', 400);
  await sceneCurtainText('Out of the catacombs, the cellars and the crypt, the dead of Cosa Nostia rise — and this time nobody pushes them back down.', 700);
  await sceneWait(2200);
  await sceneCurtainText('', 400);
  if(r.phoenixGone){
    await sceneCurtainText('Somewhere in the hill, a fire that went out long ago flickers — just once.', 700);
    await sceneWait(1700);
    await sceneCurtainText('', 400);
  }
  r.holdBroken = true;
  state.inventory.protein = (state.inventory.protein || 0) + 3;
  await saveProfile();
  await sceneCurtain(false, 800);
  ghostAlert();
  await sceneSay([faceMon('whalelord')], whaleName(), `<b>"Can you hear them? All of them, free — and singing."</b>`);
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"And my core. It is in the villa, right below us. I can feel it beating, like a second heart."</b><br><br><b>"We go there next."</b>`);
  w.busy = false;
  ui.sceneRunning = false;
  walkTeardown();
  storyModal(monPortrait('whalelord', 150, { view:'front', bare:true }), 'The hold is broken',
    `You have beaten all thirteen floors of the psychics' tower. The dead of Cosa Nostia are free.<br><br>` +
    `<b>+3 Protein Supplements</b><br><br><i>The villa is coming soon.</i>`,
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

function r5NonnaDoor(){
  return sceneSay([], "Nonna's house", r5Turn('nonnaDoor', [
    `You knock. Nobody answers. Behind the shutters, somebody is snoring like a foghorn.`,
    `A cat looks at you from the windowsill, decides you are not worth getting up for, and goes back to sleep.`,
  ]));
}
function r5Barber(){
  return sceneSay([], 'The barber\'s', `Closed. A sign in the window says BACK SOON — and by the dust on it, it has said so for a long time.`);
}
function r5Opera(){
  return sceneSay([], 'The opera house',
    `A poster by the door: FIGLIO SINGS — EVERY NIGHT BUT MONDAY. The doors are shut, but somebody inside is practising scales, very loudly.`);
}
function r5Police(){
  return sceneSay([], 'The police station',
    `Through the window: two policemen, fast asleep at their desks. On the wall behind them hangs a calendar from the Family, with a nice picture of a boat.`);
}
async function r5PostOffice(){
  const yes = await r5Ask([], 'The post office',
    `A sleepy clerk looks up from behind the counter.<br><br><b>"Parcels to mind, junior? Round the back. I don't ask what's in them."</b>`,
    '📦 Storage', 'Leave');
  if(yes) leaveDeck('storage');
}
function r5Cafe(){
  return sceneSay([], 'The café',
    `Inside, men in good coats are counting money over tiny cups of coffee. A junior does not go in there unless he is sent for.`);
}
async function r5Trattoria(){
  const yes = await r5Ask([], 'The trattoria',
    `The cook waves you in with a ladle.<br><br><b>"Sit, sit! Soldato, junior, I don't care who you work for — nobody leaves my kitchen hungry."</b>`,
    '🍝 Rest here', 'Not now');
  if(yes) leaveDeck('recover');
}
function r5Gelateria(){
  return sceneSay([], 'The gelateria', `Closed for the night. Forty flavours are chalked on a board in the window, and pistachio is underlined three times.`);
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
    `A sign on the door says FAMILY ONLY. Far down at the bottom of the rails the little car is waiting, and its driver is still asleep in it.`);
}
/* The capos at the café's tables: a junior does not speak to one. */
function r5CapoLook(which){
  const name = { purple:'Purple Capo', black:'Black Capo', grey:'Grey Capo' }[which];
  const what = {
    purple:`He is reading the newspaper, and does not look up.`,
    black:`He stirs his coffee very slowly, watching the piazza. His eyes slide over you, and away.`,
    grey:`He is counting the night's takings from his pit, and muttering.`,
  }[which];
  return sceneSay([faceNpc('capo_' + which, '🕴️')], name, `${what}<br><br><i>A junior does not speak to a capo unless he is spoken to.</i>`);
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
  { name:'Post office', x:19, y:10, w:6,  h:8,  door:[21,17], roof:'#b25a3c' },
  { name:'Café',        x:1,  y:21, w:6,  h:5,  door:[6,23],  roof:'#a8573e' },
  { name:'Trattoria',   x:1,  y:26, w:6,  h:5,  door:[6,28],  roof:'#bb6a45' },
  { name:'Tailor',      x:19, y:21, w:6,  h:5,  door:[19,23], roof:'#9a4d3a' },
  { name:'Gelateria',   x:19, y:26, w:6,  h:5,  door:[19,28], roof:'#c27b52' },
  { name:'Funicular',   x:18, y:33, w:5,  h:5,  door:[20,33], roof:'#7a5a48' },
];
const R5_TOWN_LAMPS = [[7,7],[18,7],[0,8],[25,8],[7,18],[18,18],[1,20],[24,20],[7,21],[18,21],[7,30],[18,30],[2,31],[23,31],[11,32],[14,32],[1,33],[9,33]];
/* The Hilltop (2.92), drawn the same way until assets/zones/hilltop.png is
   there: the villa (its courtyard open to the sky, a loggia of columns along
   its front), the psychics' round tower with its purple-lit windows, the
   estate's pale walls and its gate, lemon terraces down the hill. */
const R5_HILL_HOUSES = [
  { name:'Villa',       x:8,  y:2,  w:10, h:7, door:[12,8],  roof:'#9b4b36', villa:true, wide:true },
  { name:'Tower',       x:19, y:2,  w:5,  h:5, door:[21,6],  roof:'#3d3352', tower:true },
  { name:'Lemon farm',  x:6,  y:16, w:5,  h:6, door:[8,16],  roof:'#b9893f' },
  { name:'Guard house', x:16, y:16, w:7,  h:6, door:[19,16], roof:'#6f6a66' },
  { name:"Grandpa's",   x:16, y:26, w:6,  h:5, door:[18,26], roof:'#b8643f' },
];
const R5_HILL_LAMPS = [[11,12],[14,12],[4,11],[24,11],[9,10],[16,10],[20,7],[22,7],[5,16],[11,16],[14,16],[23,16],[3,22],[22,22],[11,22],[14,22],[20,25],[11,32],[14,32]];
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
  const say = line=> sceneSay([faceMon('whalelord')], whaleName(), `<b>"${line}"</b>`);
  const next = (key, list)=>{ const i = (r.said[key] || 0) % list.length; r.said[key] = i + 1; return say(list[i]); };
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
  const r = r5();
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
    ${card('capo_black', '🕴️', 'Black Capo', r.capoBlack,
      r.capoBlack ? 'The Padrino knows you are coming.' : (r.reached.includes('cata_cistern') ? 'Holding the bridge in the Cistern.' : 'Somewhere in the catacombs.'))}
    ${card('capo_purple', '🕴️', 'Purple Capo', r.capoPurple,
      r.capoPurple ? 'Beaten twice now.' : (r.reached.includes('cata_stair') ? 'Waiting at the top of the Long Stair.' : 'Somewhere further up.'))}
    ${r.tier1 ? card(r5GhostPhoenixHtml(54), '🔥', 'The ghost phoenix', r.phoenixMet,
      r.phoenixGone ? 'It gave your phoenix the last of its fire, and went to rest.'
      : r.phoenixMet && r.phoenixGift ? 'It gave your phoenix the last of its fire. It will rest once you are safe up in the Old Town.'
      : r.phoenixMet && !r.rush ? 'It opened the gate, and the dead of the hill rose with it. Now it waits in the Armoury, with the last of its fire, for a phoenix.'
      : r.phoenixMet ? 'It opened the gate, and the dead of the hill rose with it.'
                     : 'Something dead is waiting in the Armoury, the furthest room off the Long Stair.') : ''}
    ${upper ? card('capo_grey', '🕴️', 'Grey Capo', r.capoGrey,
      r.capoGrey ? 'Nobody saw a thing.' : (r.reached.includes('cata_pit') ? 'Waiting in the middle of his ring.' : 'Somewhere under the Old Town.')) : ''}
    ${r.figlioMet ? card('figlio', '🎙️', 'Figlio', concertState().figlioDay === today(),
      (concertState().figlioDay === today() ? 'Beaten today. Back at the opera house tomorrow. ' : 'At the opera house in the Old Town. ') +
      `Once a day: his team starts at level <b>${r5FiglioLevel()}</b> · win for <b>+3 Silver Medals</b>.`) : ''}
    ${r.hill ? card('psychic_master', '🔮', 'Psychic Master', r5TowerBeaten(12),
      r5TowerBeaten(12) ? 'The leader of the exorcists. She gave you the Psychic Stone.' : 'The leader of the exorcists, on floor 12 of the tower in the estate\'s east garden.') : ''}
    ${r.hill ? card('ghost_master', '👻', 'Ghost Master', r5TowerBeaten(13),
      r5TowerBeaten(13) ? 'The Padrino\'s grandniece. The hold on the dead is broken.' : 'The Padrino\'s grandniece, on floor 13 at the very top of the tower. The dead of the hill do what she tells them.') : ''}
    <div class="screen-sub" style="margin-top:12px;">Catacomb floors reached: <b>${floorsReached} of ${allFloors.length}</b> · side rooms found: <b>${roomsFound} of ${R5_ALL_ROOMS.length}</b></div>
    ${r.hill ? `<div class="screen-sub" style="margin-top:4px;">Tower floors won: <b>${r.tower.beaten.length} of 13</b> — the disciples and masters stay beaten.</div>` : ''}
    <div class="screen-sub" style="margin-top:4px;">Soldatos you beat are back at their posts the next day. The Family regroups.</div>
    <button class="btn btn-ghost" id="returnBtn" style="margin-top:12px;">Return</button>`;
  $('#backBtn').addEventListener('click', ()=> go('region'));
  $('#returnBtn').addEventListener('click', ()=> go('region'));
}

/* After a fight in the dark: back to the spot, not the region screen. */
function r5AfterWild(){
  const d = ui.returnDeck;
  ui.returnDeck = null;
  if(d && DECKS[d] && battleParty().some(m=> m.currentHp > 0)) return go(d);
  return go('region');
}
