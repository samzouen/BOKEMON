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
       The Long Stair  fight floor · the Purple Capo at the bottom, before a
                       gate barred from the other side. Beating him ends part one.
                       → The Barracks → The Armoury
   Every fight floor and every side room has at least three soldatos and a
   lookout. Beaten, they stay away for the rest of the day; each new day the
   Family regroups and every post is manned again. The capos stay beaten.
   Both capos are the ones from Region 2's caverns, sent down here since.
   Everyone the Family sends is a man.
   Beyond the Long Stair's gate the Whalelord feels far too many soldiers to
   fight through: the deeper floors stay sealed until the story opens them.
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
  };
  const g = p.region5;
  g.reached = g.reached || []; g.said = g.said || {};
  return g;
}
function r5Zone(id){ return (REGION_ZONES[5] || []).find(z=> z.id === id) || null; }

/* The floors, top to bottom. Quick travel only ever offers floors reached. */
const R5_FLOORS = ['cata_landing', 'cata_cistern', 'cata_bones', 'cata_stair'];

/* ============================================================
   THE PLACES
   All positions are in tiles. The harbour is painted (assets/zones/
   harbour.png, 750×1125, 26×39 tiles); the catacomb floors are drawn from
   their own grids at runtime (paintCatacomb) until they have paintings.
   Each floor's `arrive` names where its stairs are: `top` is the stair up,
   `bottom` the stair down. Arriving puts you on that stair.
   ============================================================ */
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
    arrive:{ cave:[1,31], pier:[4,37] },
    things:[
      { x:3,  y:7,  walk:true, verb:'Old arch', act:()=> r5OldArch() },
      { x:12, y:2,  w:2, verb:'Old Town', act:()=> r5OldTownGate() },
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
      { x:1,  y:31, walk:true, verb:'Down', where:'The Catacombs', act:()=> goFloor('cata_landing','top'),
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

  /* ---- 1. THE LANDING: where the Family unloads. Crates, soldatos walking
     the aisles, and a lookout in the pillared hall below. A door in the
     hall's west wall leads to the Counting Room. ---- */
  cata_landing: {
    key:'cata_landing', region:5, title:'The Landing', bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[21*32, 28*32],
    rows:[
"#####################","##########.##########","#########...#########","########.....########",
"#######*.....*#######","########.....########","##########.##########","##########.##########",
"###...............###","#.#.cc.cc...cc.cc.###","#.#.cc.cc...cc.cc.###","#.................###",
"#,#.cc.cc...cc.cc.###","###.cc.cc...cc.cc.###","###...............###","##########.########.#",
"##########.########,#","###.................#","###.######.######.###","###.######.######.###",
"#.................###","###.o...o...o...o.###","##*...............*##","###.o...o...o...o.###",
"###...............###","##########.##########","##########.##########","#####################",
    ],
    spawn:[10,1],
    arrive:{ top:[10,1], bottom:[10,26], r1:[1,20] },
    prizes:[[1,9],[19,15]],
    things:[
      { x:10, y:1,  walk:true, verb:'Up',   where:'The Harbour', act:()=> goFloor('harbour','cave') },
      { x:10, y:26, walk:true, verb:'Down', where:'The Cistern', act:()=> goFloor('cata_cistern','top') },
      { x:1,  y:20, walk:true, verb:'Through', where:'The Counting Room', arrow:'left', act:()=> goFloor('cata_landing_r1','top') },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      intro:()=> r5DarkIntro(),
      guards:[
        { id:'a', kind:'soldato', path:[[3,11],[17,11]], face:'r', clock:600, pause:3, roster:'landing_a', sprite:'soldato1' },
        { id:'b', kind:'lookout', x:10, y:22, face:'u', spin:'cw', clock:640, pause:4, roster:'landing_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[17,14],[3,14]], face:'l', clock:620, pause:3, roster:'landing_c', sprite:'soldato2' },
        { id:'d', kind:'soldato', path:[[3,17],[19,17]], face:'r', clock:580, pause:3, roster:'landing_d', sprite:'soldato1' },
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
     The lower walk runs east to the Pump Room. ---- */
  cata_cistern: {
    key:'cata_cistern', region:5, title:'The Cistern', bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[25*32, 27*32],
    rows:[
"#########################","#.#######################","#.......,...............#","#.~~~~~~~~~~=~~~~~~~~~~.#",
"#.~~o~~~~~~~=~~~~~~~o~~.#","#.~~~~~~~~~~=~~~~~~~~~~.#","#.~~~~~~~~~~=~~~~~~~~~~.#","#.~~o~~~~~~~=~~~~~~~o~~.#",
"#.~~~~~~~~~~=~~~~~~~~~~.#","#.~~~~~~~~~~=~~~~~~~~~~.#","#.......................#","#####.###########.#######",
"##,...###########...#####","###.~~~~~~~~~~~~~~~.,####","###.~~o~~~~~~~~~o~~.#####","###.~~~~~~~~~~~~~~~.#####",
"###.===============.#####","###.~~~~~~~~~~~~~~~.#####","###.~~o~~~~~~~~~o~~.#####","###...................###",
"##########.##############","##########.##############","#########...#############","#########.,.#############",
"#########...#############","##########.##############","#########################",
    ],
    spawn:[1,1],
    arrive:{ top:[1,1], bottom:[10,25], r1:[21,19] },
    prizes:[[2,12],[20,13]],
    things:[
      { x:1,  y:1,  walk:true, verb:'Up',   where:'The Landing',    act:()=> goFloor('cata_landing','bottom') },
      { x:10, y:25, walk:true, verb:'Down', where:'The Bone Halls', act:()=> goFloor('cata_bones','top') },
      { x:21, y:19, walk:true, verb:'Through', where:'The Pump Room', arrow:'right', act:()=> goFloor('cata_cistern_r1','top') },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"Their lanterns shine a long way here. There is nothing down here to stop the light."</b><br><br>` +
            `<b>"Keep to the edges, where it is darkest."</b>`,
      guards:[
        { id:'capo', kind:'capo', x:12, y:10, face:'u', clock:700, roster:'capo_black', sprite:'capo_black' },
        { id:'a', kind:'soldato', path:[[23,2],[23,10]], face:'d', clock:560, pause:3, roster:'cistern_a', sprite:'soldato2' },
        { id:'b', kind:'soldato', path:[[4,19],[19,19]], face:'r', clock:620, pause:3, roster:'cistern_b', sprite:'soldato1' },
        { id:'c', kind:'soldato', path:[[1,4],[1,10]], face:'d', clock:600, pause:3, roster:'cistern_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:19, y:15, face:'d', spin:'cw', clock:660, pause:4, roster:'cistern_l', sprite:'soldato2' },
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
     way out). A burial niche off the top hall opens on the Charnel House. ---- */
  cata_bones: {
    key:'cata_bones', region:5, title:'The Bone Halls', bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[23*32, 24*32],
    rows:[
"#######################","###########.###########","###.#######.###########","###.##.###...###.##.###",
"###.##.###.,.###.##.###","#.....................#","###################.###","###################.###",
"##############,.....###","###########.##......###","###########.##......###","###########.##......###",
"###########.##.,....###","#####...............###","#####.#####.###########","#####.#####.###########",
"###................,###","###...o..o...o..o...###","###.................###","###,................###",
"#################.#####","#################.#####","#################.#####","#######################",
    ],
    spawn:[11,1],
    arrive:{ top:[11,1], bottom:[17,22], r1:[3,2] },
    prizes:[[14,8]],
    things:[
      { x:11, y:1,  walk:true, verb:'Up',   where:'The Cistern',    act:()=> goFloor('cata_cistern','bottom') },
      { x:17, y:22, walk:true, verb:'Down', where:'The Long Stair', act:()=> goFloor('cata_stair','top') },
      { x:3,  y:2,  walk:true, verb:'Through', where:'The Charnel House', arrow:'up', act:()=> goFloor('cata_bones_r1','top') },
    ],
    stealth:{ kind:'evade', feel:4, retryPhrases:10,
      first:`<b>"Wait. Stop here a moment."</b><br><br>` +
            `<b>"I can feel them all through this floor. So many of them. Far too many to fight."</b>`,
      warn:`<b>"If they catch you here, they will not come one at a time. Every one of them on this floor will come running, and there will be nowhere left to go."</b><br><br>` +
           `<b>"Watch their lanterns, wait for your moment, and do not let them see you at all."</b>`,
      again:`<b>"Careful. I can feel far too many of them on this floor. If one of them sees you, they will all come."</b>`,
      guards:[
        { id:'a',  kind:'soldato', path:[[1,5],[21,5]],   face:'r', clock:600, pause:3, sprite:'soldato1' },
        { id:'l1', kind:'lookout', x:16, y:10, face:'r', spin:'cw',  clock:640, pause:5, sprite:'soldato2' },
        { id:'b',  kind:'soldato', path:[[11,9],[11,15]], face:'d', clock:620, pause:3, sprite:'soldato2' },
        { id:'t1', kind:'talker',  x:8,  y:19, face:'r', sprite:'soldato1' },
        { id:'t2', kind:'talker',  x:12, y:19, face:'l', sprite:'soldato2' },
        { id:'l2', kind:'lookout', x:18, y:17, face:'l', spin:'ccw', clock:580, pause:5, sprite:'soldato1' },
      ] },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },

  /* ---- 4. THE LONG STAIR: a great gallery going down, soldatos crossing
     it, a lookout near the bottom, and the Purple Capo before a barred gate.
     A passage off the top of the gallery leads to the Barracks. ---- */
  cata_stair: {
    key:'cata_stair', region:5, title:'The Long Stair', bg:'catacombs', music:'zone_catacombs',
    bx:0, by:0, bs:1/32, nat:[17*32, 31*32],
    rows:[
"#################","########.########","########.########","#####.......#####",
"####*.......*####","#####.......#####","#####.......#####","########.########",
"###...........###","###.............#","###..o.....o..###","#,............###",
"###...........###","###...........###","###..o.....o..###","###............,#",
"##*...........###","###...........###","###..o.....o..###","###...........###",
"#,............*##","###...........###","###..o.....o..###","###...........###",
"###...........###","######.....######","######.....######","######.....######",
"########G########","#################","#################",
    ],
    spawn:[8,1],
    arrive:{ top:[8,1], r1:[15,9] },
    prizes:[[1,11],[15,15]],
    things:[
      { x:8, y:1,  walk:true, verb:'Up', where:'The Bone Halls', act:()=> goFloor('cata_bones','bottom') },
      { x:15, y:9, walk:true, verb:'Through', where:'The Barracks', arrow:'right', act:()=> goFloor('cata_stair_r1','top') },
      { x:8, y:28, verb:'The gate', act:()=> r5SealedGate() },
    ],
    stealth:{ kind:'fight', sense:2, feel:4,
      first:`<b>"Someone is waiting at the bottom of these stairs."</b><br><br><b>"Someone who knows you."</b>`,
      guards:[
        { id:'a', kind:'soldato', path:[[3,12],[13,12]], face:'r', clock:580, pause:3, roster:'stair_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[13,20],[3,20]], face:'l', clock:620, pause:3, roster:'stair_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[3,17],[13,17]], face:'r', clock:600, pause:3, roster:'stair_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:8, y:23, face:'l', spin:'ccw', clock:640, pause:4, roster:'stair_l', sprite:'soldato2' },
        { id:'capo', kind:'capo', x:8, y:26, face:'u', clock:700, roster:'capo_purple', sprite:'capo_purple' },
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
     its own ghosts in the dark, a little stronger the deeper it is.
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
        { id:'a', kind:'soldato', path:[[1,3],[17,3]], face:'r', clock:600, pause:3, roster:'lr1_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[17,9],[1,9]], face:'l', clock:640, pause:3, roster:'lr1_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[9,4],[9,8]], face:'d', clock:560, pause:4, roster:'lr1_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:4, y:6, face:'u', spin:'cw', clock:620, pause:4, roster:'lr1_l', sprite:'soldato2' },
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
"#################","#,..o...,...o..,#","#...............#","#.o..###.###..o.#",
"#....#.....#....#","#....#..*..#....#","#...............#","#....#.....#.....",
"#....###.###....#","#.o...........o.#","#...............#","#,..o...,...o..,#",
"#################",
    ],
    spawn:[16,7],
    arrive:{ top:[16,7] },
    things:[
      { x:16, y:7, walk:true, verb:'Through', where:"The Counting Room", arrow:'right', act:()=> goFloor('cata_landing_r1','bottom') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[1,2],[15,2]], face:'r', clock:620, pause:3, roster:'lr2_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[15,10],[1,10]], face:'l', clock:580, pause:3, roster:'lr2_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[3,3],[3,9]], face:'d', clock:660, pause:3, roster:'lr2_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:8, y:7, face:'d', spin:'ccw', clock:600, pause:4, roster:'lr2_l', sprite:'soldato2' },
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
        { id:'a', kind:'soldato', path:[[5,1],[5,11]], face:'d', clock:600, pause:3, roster:'cr1_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[13,11],[13,1]], face:'u', clock:640, pause:3, roster:'cr1_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[7,6],[11,6]], face:'r', clock:560, pause:4, roster:'cr1_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:9, y:3, face:'d', spin:'cw', clock:620, pause:4, roster:'cr1_l', sprite:'soldato2' },
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
"#################","#~~~~~~...~~~~~~#","#~~.....*.....~~#","#~.............~#",
"#~.cc.cc.cc.cc.~#","#~.............~#","...............~#","#~.cc.cc.cc.cc.~#",
"#~.............~#","#~.o...o.o...o.~#","#~~...........~~#","#~~~~~~~~~~~~~~~#",
"#################",
    ],
    spawn:[0,6],
    arrive:{ top:[0,6] },
    things:[
      { x:0, y:6, walk:true, verb:'Through', where:"The Pump Room", arrow:'left', act:()=> goFloor('cata_cistern_r1','bottom') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[2,3],[14,3]], face:'r', clock:620, pause:3, roster:'cr2_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[14,8],[2,8]], face:'l', clock:580, pause:3, roster:'cr2_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[3,10],[13,10]], face:'r', clock:660, pause:3, roster:'cr2_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:10, y:6, face:'l', spin:'ccw', clock:600, pause:4, roster:'cr2_l', sprite:'soldato2' },
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
"########.########","#,.....#.#.....,#","#......#.#......#","#..o...#.#...o..#",
"#...............#","#,.............,#","###..o.....o..###","#...............#",
"#,.............,#","#..o.........o..#","#......#.#......#","#,.....#.#.....,#",
"########.########",
    ],
    spawn:[8,12],
    arrive:{ top:[8,12], bottom:[8,0] },
    things:[
      { x:8, y:12, walk:true, verb:'Through', where:"The Bone Halls", arrow:'down', act:()=> goFloor('cata_bones','r1') },
      { x:8, y:0, walk:true, verb:'Through', where:"The Skull Wall", arrow:'up', act:()=> goFloor('cata_bones_r2','top') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[1,4],[15,4]], face:'r', clock:600, pause:3, roster:'br1_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[15,7],[1,7]], face:'l', clock:640, pause:3, roster:'br1_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[4,9],[12,9]], face:'r', clock:560, pause:3, roster:'br1_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:8, y:5, face:'u', spin:'cw', clock:620, pause:4, roster:'br1_l', sprite:'soldato2' },
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
"#################","#,.,.,.,*,.,.,.,#","#...............#","#.o...o...o...o.#",
"#...............#","#..###.....###..#","#..#,,.....,,#..#","#..###.....###..#",
"#...............#","#.o...o...o...o.#","#...............#","########.########",
    ],
    spawn:[8,11],
    arrive:{ top:[8,11] },
    things:[
      { x:8, y:11, walk:true, verb:'Through', where:"The Charnel House", arrow:'down', act:()=> goFloor('cata_bones_r1','bottom') },
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[1,2],[15,2]], face:'r', clock:620, pause:3, roster:'br2_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[15,10],[1,10]], face:'l', clock:580, pause:3, roster:'br2_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[8,4],[8,7]], face:'d', clock:660, pause:3, roster:'br2_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:15, y:6, face:'l', spin:'ccw', clock:600, pause:4, roster:'br2_l', sprite:'soldato2' },
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
        { id:'a', kind:'soldato', path:[[1,3],[17,3]], face:'r', clock:600, pause:3, roster:'sr1_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[17,9],[1,9]], face:'l', clock:640, pause:3, roster:'sr1_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[13,4],[13,8]], face:'d', clock:560, pause:3, roster:'sr1_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:3, y:10, face:'r', spin:'cw', clock:620, pause:4, roster:'sr1_l', sprite:'soldato2' },
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
    ],
    stealth:{ kind:'fight', feel:4,
      guards:[
        { id:'a', kind:'soldato', path:[[1,3],[15,3]], face:'r', clock:620, pause:3, roster:'sr2_a', sprite:'soldato1' },
        { id:'b', kind:'soldato', path:[[15,9],[1,9]], face:'l', clock:580, pause:3, roster:'sr2_b', sprite:'soldato2' },
        { id:'c', kind:'soldato', path:[[14,4],[14,8]], face:'d', clock:660, pause:3, roster:'sr2_c', sprite:'soldato1' },
        { id:'l', kind:'lookout', x:6, y:6, face:'l', spin:'ccw', clock:600, pause:4, roster:'sr2_l', sprite:'soldato2' },
      ],
      wild:{ rate:0.035, size:2, lv:[88,94],
        table:[{sp:'ghost',w:2},{sp:'cyclops',w:2},{sp:'ghost_flame',w:2},{sp:'crow',w:1},{sp:'goblin_knight',w:1,plus:2},{sp:'horned_lynx',w:1,plus:2},{sp:'puppet',w:1,plus:1}] } },
    paint:(d)=> paintCatacomb(d),
    onRender:(world, d)=> r5FloorRender(world, d),
    onStep:(p, d)=> stealthStep(p, d),
    ghostChat:(id)=> r5GhostChat(id),
  },
};
R5_FLOORS.forEach(id=>{ R5_DECKS[id].prizeLines = CATA_PRIZE_LINES; });
/* The side rooms, floor by floor: [room 1, room 2]. */
const R5_ROOMS = {
  cata_landing: ['cata_landing_r1', 'cata_landing_r2'],
  cata_cistern: ['cata_cistern_r1', 'cata_cistern_r2'],
  cata_bones:   ['cata_bones_r1',   'cata_bones_r2'],
  cata_stair:   ['cata_stair_r1',   'cata_stair_r2'],
};
const R5_ALL_ROOMS = Object.values(R5_ROOMS).flat();
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
/* Onto a floor (or the harbour) at one of its named stairs. A catacomb floor
   entered this way starts over: guards back at their posts. */
function goFloor(id, where){
  const d = DECKS[id]; if(!d) return;
  const w = walkState();
  const a = (d.arrive && d.arrive[where]) || d.spawn;
  walkTeardown();
  w.at = w.at || {}; w.at[id] = { x:a[0], y:a[1] }; w.face = 'd';
  w.ghostAt = w.ghostAt || {}; w.ghostAt[id] = { x:a[0], y:a[1] };
  ui.walkFresh = false;
  if(d.stealth){
    ui.stealthFresh = true;
    ui.floorEntry = ui.floorEntry || {}; ui.floorEntry[id] = where;
    ui.currentZone = r5Zone('catacombs') || ui.currentZone;
    const r = r5();
    if(!r.reached.includes(id)) r.reached.push(id);
    saveProfile();
  } else if(id === 'harbour'){
    ui.currentZone = r5Zone('harbour') || ui.currentZone;
  }
  ui.returnDeck = null;
  w.busy = true;
  tileWipe(()=>{ w.busy = false; go(id); });
}
function r5ToHarbour(){ goFloor('harbour', 'cave'); }
/* Explore → The Catacombs: straight to the Landing, or pick a floor. */
function renderCatacombs(){
  const r = r5();
  const floors = R5_FLOORS.filter(f=> r.reached.includes(f));
  if(floors.length <= 1){ ui.stealthFresh = true; return goFloor(floors[0] || 'cata_landing', 'top'); }
  setScreenBg('catacombs');
  playMusicChain(['zone_catacombs', 'region5', 'region']);
  $('#brandSub').textContent = 'The Catacombs';
  /* a floor's watch counts its side rooms too, once you have found them */
  const onWatch = id=> DECKS[id].stealth.kind === 'evade' ? 0
    : DECKS[id].stealth.guards.filter(g=> !stealthBeaten(id).includes(g.id)).length;
  const note = id=>{
    const d = DECKS[id];
    const rooms = (R5_ROOMS[id] || []).filter(x=> r.reached.includes(x));
    const left = onWatch(id) + rooms.reduce((n, x)=> n + onWatch(x), 0);
    const where = rooms.length ? ` (and ${rooms.length} side room${rooms.length > 1 ? 's' : ''})` : '';
    if(d.stealth.kind === 'evade')
      return 'Too many to fight. Do not be seen.' + (rooms.length ? ` ${left} on watch in the side rooms.` : '');
    return left ? `${left} of the Family on watch${where}` : `Nobody left on watch today${where}`;
  };
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="screen-title">The Catacombs</div>
    <div class="screen-sub">Which floor?</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
      ${floors.map((f, i)=> `
        <div class="challenge-card" data-floor="${f}">
          <div class="region-num">${R5_FLOORS.indexOf(f) + 1}</div>
          <div style="flex:1;">
            <div class="cc-title">${escapeHtml(DECKS[f].title)}</div>
            <div class="cc-desc">${escapeHtml(note(f))}</div>
          </div>
        </div>`).join('')}
    </div>
    <button class="btn btn-ghost" id="returnBtn" style="margin-top:14px;">Return</button>`;
  $('#backBtn').addEventListener('click', ()=> go('explore'));
  $('#returnBtn').addEventListener('click', ()=> go('explore'));
  screenEl.querySelectorAll('[data-floor]').forEach(c=> c.addEventListener('click', ()=> goFloor(c.dataset.floor, 'top')));
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
    `<b>"If you do go down there, don't take a lantern. Lanterns are how the Family finds each other."</b>`,
  ]));
}
function r5NetMender(){
  return sceneSay([faceNpc('net_mender','🧶')], R5_NAMES.net_mender, r5Next('lucia', [
    `<b>"Don't stand in my light."</b> She squints at a net with more hole than net.<br><br>` +
    `<b>"Grandad says the dead in those tunnels don't sleep proper. They hide in the dark and jump at anything that comes by."</b>`,
    `<b>"The Family's men go down there every night, carrying crates. Every one of them has a lantern."</b><br><br>` +
    `<b>"They can't see a thing outside it. Grandad says that's the Family all over."</b>`,
    `<b>"If you're going down there, keep out of the light. That's all I know."</b>`,
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
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"My core is up there, somewhere past that gate. I can feel it the way you feel the sun on your face with your eyes shut."</b><br><br>` +
    `<b>"Not this way. Not yet."</b>`);
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
    `<b>"Down there, you will not be able to see. I will. Stay close to me."</b><br><br>` +
    `<i>The catacombs are open. They are on the Explore screen too.</i>`);
}
function refreshWalkAll(){ if(DECKS[ui.screen]) go(ui.screen); }

/* ============================================================
   IN THE DARK
   ============================================================ */
function r5FloorRender(world, d){
  const fresh = !!ui.stealthFresh;                // down a stair or through a door, not back from a fight
  const recaught = ui.r5Recaught === d.key;       // back from being caught: that was warning enough
  ui.r5Recaught = null;
  startStealth(world, d);
  const r = r5();
  if(!r.reached.includes(d.key)){ r.reached.push(d.key); saveProfile(); }
  const say = html=> sceneSay([faceMon('whalelord')], whaleName(), html);
  const later = f=> setTimeout(f, 500);
  /* The first time on each floor, the Whalelord says something about it. */
  if(d.stealth.intro && !r.intro) return d.stealth.intro();
  if(d.stealth.first && r5Once('first_' + d.key))
    return later(async ()=>{ await say(d.stealth.first); if(d.stealth.warn) await say(d.stealth.warn); });
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
/* The Purple Capo, at the bottom of the Long Stair: the end of part one. */
async function r5CapoPurpleBeaten(){
  const r = r5();
  const first = !r.capoPurple;
  r.capoPurple = true;
  if(first) state.inventory.protein = (state.inventory.protein || 0) + 3;
  await saveProfile();
  const w = walkState();
  w.at = w.at || {}; w.at.cata_stair = { x:8, y:27 }; w.face = 'd';
  ui.walkFresh = false;
  go('cata_stair');
  const capo = faceNpc('capo_purple','🕴️'), whale = faceMon('whalelord'), wn = whaleName();
  await sceneSay([capo], 'Purple Capo',
    `He laughs, short and sharp, the same as he did in the caverns.<br><br><b>"Twice. You've beaten me twice now."</b>`);
  await sceneSay([capo], 'Purple Capo',
    `<b>"Go on, then. Try the gate."</b> He jerks his head at the bars behind him.<br><br>` +
    `<b>"It's barred from the other side, genius. Nobody goes any deeper until the Padrino says so."</b>`);
  await sceneSay([capo], 'Purple Capo', `He tugs his hat straight and walks off up the stairs without looking back.`);
  if(first){
    await sceneSay([whale], wn,
      `<b>"He is right about the gate. It will not open from this side."</b><br><br>` +
      `<b>"And there are soldiers behind it. I can feel them. Far too many to fight our way through."</b>`);
    await sceneSay([whale], wn,
      `<b>"But my core is closer than it was. I can feel it, just above us."</b><br><br>` +
      `<b>"There will be another way. There always is."</b>`);
    r.tier1 = true;
    await saveProfile();
    walkTeardown();
    storyModal(monPortrait('whalelord', 150, { view:'front', bare:true }), 'The first tier is clear',
      `You have cleared the first tier of the catacombs under Cosa Nostia.<br><br>` +
      `<b>+3 Protein Supplements</b><br><br>` +
      `<i>The rest of Cosa Nostia is coming soon.</i>`,
      ()=> go('cata_stair'), { subtitle:'The Long Stair' });
  }
}
/* The deeper floors stay sealed (2.72): behind this gate, the Whalelord
   feels far more of the Family than anyone could fight through. */
async function r5SealedGate(){
  await sceneSay([], 'The gate',
    `Iron bars from floor to ceiling, and a heavy beam across them — on the far side, where you cannot reach it.`);
  await sceneSay([faceMon('whalelord')], whaleName(),
    `<b>"There are soldiers on the other side of this gate. I can feel them, rows and rows of them, waiting in the dark."</b><br><br>` +
    `<b>"Far too many to fight our way through. Not this way. Not yet."</b>`);
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
  cata_stair:   `He is still down there, at the bottom. I can feel how cross he is.`,
  /* the side rooms */
  cata_landing_r1: `Crates, counted and counted again. The Family trusts nobody, not even its own men.`,
  cata_landing_r2: `The oldest dead in the hill. They were here long before the Family, and they will be here long after.`,
  cata_cistern_r1: `Old machines, and nobody left who knows how they work. I know how that feels.`,
  cata_cistern_r2: `People came here to pray, once. Now the Family keeps its men here instead.`,
  cata_bones_r1:   `This is where the bones were sorted. Skulls in one place, the rest in another. Tidy, for the dead.`,
  cata_bones_r2:   `All of them watching us. Do not worry. They are on our side.`,
  cata_stair_r1:   `This is where the Family's men sleep between watches. None of them are sleeping now.`,
  cata_stair_r2:   `Everything in here is for hurting someone. Let us not stay long.`,
};
function r5GhostChat(id){
  const d = DECKS[id];
  const r = r5();
  if(!d || !d.stealth){
    const i = (r.said.ghostTown || 0) % R5_GHOST_TOWN.length;
    r.said.ghostTown = i + 1;
    return sceneSay([faceMon('whalelord')], whaleName(), `<b>"${R5_GHOST_TOWN[i]}"</b>`);
  }
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
  return sceneSay([faceMon('whalelord')], whaleName(), `<b>"${line}"</b>`);
}

/* ============================================================
   CHALLENGE — the Family is not a list; it is out there
   ============================================================ */
function renderChallengeR5(){
  const r = r5();
  setScreenBg('catacombs');
  $('#brandSub').textContent = 'Challenge';
  const floorsReached = R5_FLOORS.filter(f=> r.reached.includes(f)).length;
  const roomsFound = R5_ALL_ROOMS.filter(f=> r.reached.includes(f)).length;
  const card = (sprite, icon, title, done, desc)=> `
    <div class="challenge-card" style="cursor:default;">
      ${npcPortrait(sprite, icon, 54, 'transparent')}
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
      r.capoPurple ? 'Beaten twice now.' : (r.reached.includes('cata_stair') ? 'Waiting at the bottom of the Long Stair.' : 'Somewhere deeper down.'))}
    <div class="screen-sub" style="margin-top:12px;">Catacomb floors reached: <b>${floorsReached} of ${R5_FLOORS.length}</b> · side rooms found: <b>${roomsFound} of ${R5_ALL_ROOMS.length}</b></div>
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
