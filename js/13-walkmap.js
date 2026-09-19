/* ============================================================
   WALKABLE DECKS
   The three decks of the Vane Shear, walked rather than tapped. One grid per
   deck, the painting behind it, a D-pad, and an action button for every thing
   you are standing beside.

   Nothing here talks to the network. The guards, the camera and the steps are
   all local; only the usual save touches Firebase.
   ============================================================ */

/* How close the camera sits. The stage is square, so this is how many tiles
   you see across it — nine makes the ship feel like somewhere to explore
   rather than a plan you are reading. */
const WALK_VIEW = 7;
let WALK_T = 44;                         // recomputed to fit the stage

/* Each deck: its grid, who stands where, and where its painting sits — all in
   TILE units, so the numbers mean the same at any zoom. */
const DECKS = {
  weather_deck: {
    art:'weather_deck', music:'zone_weather_deck',
    bx:0.1750, by:0.010, bs:0.032500,
    rows:[
"##########################","##########################","##########################","#############.############",
"############...###########","###########.....##########","##########.......#########","#########..#####.#########",
"#########.######..########","#########.######..########","#########.#######.########","#########.#######.########",
"#########.#.....#.########","#########.#.###.#.########","#########.#.###.#.########","#########.#.###.#.########",
"#########...###....#######","######.#..#######.########","######...########.########","######.#.########.########",
"########.########..#######","########.########.########","########..#######.########","#########...###....#######",
"#########.#.....#.########","#########.#.###.#.########","#########.#.###.#.########","#########.#.###.#..#######",
"#########.#.###.#.########","#########.#.###.#.########","#########.#..#..#.########","#########.##...##..#######",
"#########.#######.########","#########.#######.########","#########..#####..########","##########..###..#########",
"###########.....##########","##########################","##########################",
    ],
    spawn:[16,9],
    prizes:[[13,12],[13,24],[13,31],[13,36]],
    things:[
      /* one ladder over the side: Pell runs it, Ines just watches */
      { x:6,  y:17, sprite:'diver1', icon:'🤿', verb:'Dive', act:()=> diveFromDeck() },
      { x:6,  y:19, sprite:'diver2', icon:'🤿', verb:'Talk', act:()=> diverChat() },
      { x:18, y:16, sprite:'fisherman1', icon:'🎣', verb:'Help', act:()=> railHelp(1) },
      { x:18, y:20, sprite:'fisherman2', icon:'🎣', verb:'Help', act:()=> railHelp(2) },
      { x:18, y:23, sprite:'fisherman3', icon:'🎣', verb:'Help', act:()=> railHelp(3) },
      { x:18, y:27, sprite:'fisherman4', icon:'🎣', verb:'Help', act:()=> railHelp(4) },
      { x:18, y:31, sprite:'fisherman5', icon:'🎣', verb:'Help', act:()=> railHelp(5) },
      { x:16, y:9,  walk:true, verb:'Down', where:'Cabin Deck', act:()=> goDeck('cabin_deck') },
    ],
  },
  cabin_deck: {
    art:'cabin_deck', music:'zone_cabin_deck',
    bx:-4.1393, by:-0.5131, bs:0.031868,
    rows:[
"###################","###################","###################","###################",
"###################","###################","#######.###.#######","#######......######",
"######..###..######","######.############","#####...###...#####","#####.#.###.#.#####",
"#####.#.###.#.#####","####..#.###.#..####","####...........####","#########.#########",
"#########.#########","#####.........#####","#####...#.#...#####","#########.#########",
"#########.#########","####...........####","####..###.##...####","####..###.#########",
"#########.#########","#########.#....####","#####..........####","#####...#.#....####",
"#########.#########","####...##.#########","######.##.....#####","#####.....###.#####",
"#######...###.#####","#######.......#####","#########.#########","#########.#########",
"###################","###################","###################",
    ],
    spawn:[13,8],
    prizes:[[13,10],[4,29],[9,35]],
    things:[
      { x:11, y:6,  sprite:'ship_captain', icon:'⚓', verb:'Talk', act:()=> chartRoom(),
        extra:()=> suspectOf('ship_captain') },
      { x:7,  y:6,  sprite:'shipkeeper',   icon:'⚓', verb:'Shop', act:()=> shipkeeperShop(),
        extra:()=> suspectOf('shipkeeper') },
      { x:12, y:8,  walk:true, verb:'Up',   where:'Weather Deck', act:()=> goDeck('weather_deck') },
      { x:12, y:8,  walk:true, verb:'Down', where:'Laboratory',   act:()=> goDeck('laboratory_deck') },
      { x:5,  y:17, sprite:'sailor1', icon:'⚓', verb:'Talk', act:()=> sailorChat(1), extra:()=> suspectOf('sailor1') },
      { x:13, y:17, sprite:'sailor2', icon:'⚓', verb:'Talk', act:()=> sailorChat(2), extra:()=> suspectOf('sailor2') },
      { x:4,  y:22, sprite:'sailor3', icon:'⚓', verb:'Talk', act:()=> sailorChat(3), extra:()=> suspectOf('sailor3') },
      { x:13, y:22, sprite:'rival',   icon:'🧑', verb:'Talk', act:()=> rivalCabin(),
        extra:()=> suspectOf('rival') },
      { x:5,  y:26, sprite:'sailor4', icon:'⚓', verb:'Talk', act:()=> sailorChat(4), extra:()=> suspectOf('sailor4') },
      { x:14, y:25, walk:true, verb:'Recover', act:()=> leaveDeck('recover') },
      { x:13, y:27, walk:true, verb:'Storage', act:()=> leaveDeck('storage') },
      { x:8,  y:32, sprite:'cook',    icon:'🧑‍🍳', verb:'Talk', act:()=> cookChat(),
        extra:()=> suspectOf('cook') },
      { x:5,  y:31, sprite:'sailor5', icon:'⚓', verb:'Talk', act:()=> sailorChat(5), extra:()=> suspectOf('sailor5') },
    ],
  },
  laboratory_deck: {
    art:'laboratory_deck', music:'zone_laboratory_deck',
    bx:-0.080, by:-0.6300, bs:0.031500,
    rows:[
"##########################","##########################","##########################","##########################",
"##########################","############...###########","###########......#########","###########.......########",
"##########..###...########","##########.######.########","#########...###...########","#########.#.###.#.########",
"#########.#.###.#.########","#########.#.###.#.########","########..........########","#############.############",
"#############.############","########...........#######","########....#.############","#############.############",
"#############.############","########...........#######","########....#.#.##.#######","#############.#....#######",
"#############.############","########....#.############","########...........#######","########....#.##...#######",
"#############.############","#########...#.############","#########.........########","#########...#.....########",
"#############.....########","##########.......#########","############...###########","##########################",
"##########################","##########################","##########################",
    ],
    spawn:[16,8],
    prizes:[[17,30],[10,33],[13,34]],
    aquarium:[{sp:'starfish',x:11,y:35},{sp:'loong',x:13,y:36},{sp:'seahorse',x:16,y:35}],
    things:[
      { x:13, y:5,  sprite:'scientist_supervisor', icon:'🧑‍🔬', verb:'Report', act:()=> labSupervisor() },
      { x:16, y:8,  walk:true, verb:'Up', where:'Cabin Deck', act:()=> goDeck('cabin_deck') },
      { x:8,  y:14, sprite:'scientist1', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(1) },
      { x:8,  y:17, sprite:'scientist2', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(2) },
      { x:18, y:17, sprite:'scientist3', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(3) },
      { x:8,  y:22, sprite:'scientist4', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(4) },
      { x:18, y:21, sprite:'scientist5', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(5) },
      { x:8,  y:26, sprite:'scientist6', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(6) },
      { x:18, y:26, sprite:'scientist7', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(7) },
      { x:9,  y:30, sprite:'scientist8', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(8) },
      { x:15, y:32, sprite:'scientist9', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(9) },
    ],
  },
};

/* Where you are, per deck, so a deck remembers you when you come back. */
function walkState(){
  ui.walk = ui.walk || { deck:null, at:{}, face:'d', last:0, busy:false };
  return ui.walk;
}
/* ------------------------------------------------------------
   THE RAIL
   A fisherman shouts for about half a minute, then gives up and gets on with
   it for a bit before the next lot arrive. You are not being tested on
   reactions here — you are being asked to come over.
   ------------------------------------------------------------ */
const CALL_FOR = 30000, REST_MIN = 10000, REST_VAR = 10000;
function railState(){
  ui.rail = ui.rail || { who:null, until:0, next:0 };
  return ui.rail;
}
function railTick(){
  const r = railState(), now = Date.now();
  const g = r4();
  /* nobody has time for birds while the whales are across the lane, and the
     Whalelord will not hear of it at all */
  if(!g.diversBeaten || whaleHolds() || (g.wallFound && !g.solved)){ r.who = null; return; }
  if(r.who && now > r.until){ r.who = null; r.next = now + REST_MIN + Math.random()*REST_VAR; }
  if(!r.who && now > r.next){ r.who = 1 + Math.floor(Math.random()*5); r.until = now + CALL_FOR; }
  paintRail();
}
function paintRail(){
  const r = railState();
  document.querySelectorAll('.rail-call').forEach(e=>e.remove());
  if(!r.who || walkState().deck !== 'weather_deck') return;
  const d = DECKS.weather_deck;
  const t = d.things.find(x=>x.sprite === 'fisherman'+r.who);
  if(!t || !t.el) return;
  const s = document.createElement('div');
  s.className = 'rail-call';
  s.textContent = '🆘';
  t.el.appendChild(s);
}
let _railTimer = null;
function startRail(){ clearInterval(_railTimer); _railTimer = setInterval(railTick, 1000); railTick(); }
function stopRail(){ clearInterval(_railTimer); _railTimer = null; }

/* Whoever is still pinging can be investigated. It is a separate button, so
   talking to somebody never turns into accusing them by accident. */
function suspectOf(id){
  if(typeof pings !== 'function' || !pings(id)) return null;
  return { verb:'🔍 Investigate',
           act:()=> (id === 'rival') ? rivalCabin() : crewChallenge(id) };
}
/* Anything that takes you off the deck notes where to come back to. */
function leaveDeck(where){
  releaseKeys();
  ui.walkBack = walkState().deck;
  go(where);
}
/* Drawn triangles rather than ▲▼◀▶. The characters were real text, so a long
   press selected them and popped up the copy menu mid-walk. */
function TRI(dir){
  const pts = { u:'12,6 20,18 4,18', d:'12,18 4,6 20,6',
                l:'6,12 18,4 18,20', r:'18,12 6,4 6,20' }[dir];
  return `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">` +
         `<polygon points="${pts}" fill="currentColor"/></svg>`;
}
/* ------------------------------------------------------------
   THE TANKS
   Three specimens drifting in the aquarium at the stern of the laboratory.
   Each wanders its own little box at its own pace: the starfish barely moves,
   the seahorse ambles, the loong is comparatively busy. Facing follows the
   direction of travel — front sprite going left, back sprite going right.

   It runs on one 50ms tick rather than a 60fps loop: the motion is slow
   enough that nothing is gained by drawing it sixty times a second, and the
   phone stays cool.
   ------------------------------------------------------------ */
const SWIM = {
  /* per second, as a fraction of a tile, and how often the vertical drift
     changes its mind */
  starfish: { sx:[0.015,0.035], sy:[0.010,0.022], flip:[4500,6200] },
  seahorse: { sx:[0.030,0.060], sy:[0.020,0.040], flip:[3000,4000] },
  loong:    { sx:[0.050,0.100], sy:[0.035,0.065], flip:[2000,2600] },
};
const SWIM_X = 0.45, SWIM_Y = 0.30;      // how far either way, in tiles
const rnd = (a,b)=> a + Math.random()*(b-a);
let _tank = null, _tankTimer = null;

function buildAquarium(world, d){
  if(!d.aquarium) return;
  _tank = d.aquarium.map(f=>{
    const el = document.createElement('div');
    el.className = 'walk-fish';
    el.style.cssText = `left:${f.x*WALK_T}px;top:${f.y*WALK_T}px;` +
                       `width:${WALK_T}px;height:${WALK_T}px;`;
    el.innerHTML = monPortrait(f.sp, Math.round(WALK_T*0.5), { view:'front', bare:true, stage:0 });
    world.appendChild(el);
    const k = SWIM[f.sp] || SWIM.seahorse;
    return { el, k, sp:f.sp, dx:1, dy:1, x:rnd(-SWIM_X,SWIM_X), y:rnd(-SWIM_Y,SWIM_Y),
             vx:rnd(k.sx[0],k.sx[1]), vy:rnd(k.sy[0],k.sy[1]),
             next:performance.now()+rnd(k.flip[0],k.flip[1]), face:'front' };
  });
  clearInterval(_tankTimer);
  _tankTimer = setInterval(swimTick, 50);
}
function stopAquarium(){ clearInterval(_tankTimer); _tankTimer = null; _tank = null; }
function swimTick(){
  if(!_tank) return;
  const now = performance.now();
  _tank.forEach(f=>{
    f.x += f.dx * f.vx * 0.05;
    if(f.x >  SWIM_X){ f.x =  SWIM_X; f.dx = -1; f.vx = rnd(f.k.sx[0], f.k.sx[1]); }
    if(f.x < -SWIM_X){ f.x = -SWIM_X; f.dx =  1; f.vx = rnd(f.k.sx[0], f.k.sx[1]); }
    /* it turns round to face the way it is going */
    const want = f.dx < 0 ? 'front' : 'back';
    if(want !== f.face){
      f.face = want;
      f.el.innerHTML = monPortrait(f.sp, Math.round(WALK_T*0.5),
                                   { view:want, bare:true, stage:0 });
    }
    f.y += f.dy * f.vy * 0.05;
    if(Math.abs(f.y) > SWIM_Y){ f.y = Math.sign(f.y)*SWIM_Y; f.dy *= -1; }
    /* the vertical drift changes its mind on its own clock, without waiting
       to reach an edge */
    if(now > f.next){
      f.dy *= -1;
      f.vy = rnd(f.k.sy[0], f.k.sy[1]);
      f.next = now + rnd(f.k.flip[0], f.k.flip[1]);
    }
    f.el.style.transform = `translate(${f.x*WALK_T}px, ${f.y*WALK_T}px)`;
  });
}

/* ------------------------------------------------------------
   SOMETHING FOR LOOKING
   Nothing is drawn and nothing is hinted at. Walk onto the tile and ten skill
   tokens arrive. Ten of them across the three decks, one hundred tokens for
   nobody's reason but curiosity. Each is claimed once, ever.
   ------------------------------------------------------------ */
const PRIZE_TOKENS = 10;
function prizeTaken(deck, i){
  const g = r4();
  g.found = g.found || {};
  return !!(g.found[deck] || {})[i];
}
async function takePrize(deck, i){
  const g = r4();
  g.found = g.found || {};
  g.found[deck] = g.found[deck] || {};
  if(g.found[deck][i]) return;
  g.found[deck][i] = true;
  state.inventory.skillTokens = (state.inventory.skillTokens || 0) + PRIZE_TOKENS;
  await saveProfile();
  const total = Object.values(g.found).reduce((n,o)=>n + Object.keys(o).length, 0);
  /* Nothing about where it was or how it got there — a child who finds one in
     a corridor should not be told they were rummaging in a locker. */
  const OPENERS = [
    `Oh, what's this?`,
    `Hold on.`,
    `Well now.`,
    `Something glints.`,
    `Lucky.`,
    `Not everything on this ship is bolted down.`,
    `Somebody was careless.`,
    `Would you look at that.`,
  ];
  storyModal(tokenIcon(130), 'A find',
    `${OPENERS[Math.floor(Math.random()*OPENERS.length)]}<br><br>` +
    `You found <b>${PRIZE_TOKENS} Skill Tokens</b>!<br><br>` +
    `<i>${total} of 10 found.</i>`,
    ()=> go(deck), { bg:'sea', subtitle:'The Vane Shear' });
}
function checkPrize(){
  const w = walkState(), d = DECKS[w.deck];
  if(!d || !d.prizes) return false;
  const p = w.at[w.deck];
  const i = d.prizes.findIndex(q=> q[0]===p.x && q[1]===p.y);
  if(i < 0 || prizeTaken(w.deck, i)) return false;
  takePrize(w.deck, i);
  return true;
}
function cuainAboard(){ const g = r4(); return !!g.ghostAccepted; }
const wSolid = (d,x,y)=> (y<0||y>=d.rows.length||x<0||x>=d.rows[0].length) ? true : d.rows[y][x]==='#';

/* ---------- drawing ---------- */
function renderWalkDeck(id){
  const d = DECKS[id]; if(!d) return go('explore');
  const w = walkState();
  w.deck = id;
  /* Arriving from Explore, or down a ladder, puts you on the companionway.
     Coming BACK from a conversation, a shop or a fight puts you exactly where
     you were standing — which is the only thing that feels right. */
  if(ui.walkFresh || !w.at[id]){
    w.at[id] = { x:d.spawn[0], y:d.spawn[1] };
    w.face = 'd';
    if(cuainAboard()){ w.ghostAt = w.ghostAt || {}; w.ghostAt[id] = { x:d.spawn[0], y:d.spawn[1] }; }
  }
  ui.walkFresh = false;
  const W = d.rows[0].length, H = d.rows.length;

  setScreenBg('sea');
  playMusicChain([d.music,'region4','region']);
  $('#brandSub').textContent = { weather_deck:'Weather Deck', cabin_deck:'Cabin Deck',
                                 laboratory_deck:'Laboratory' }[id];

  const nat = { weather_deck:[797,1209], cabin_deck:[832,1262], laboratory_deck:[832,1262] }[id];
  /* fit nine tiles across whatever the stage turns out to be */
  const avail = Math.min(window.innerWidth - 24, Math.max(220, window.innerHeight - 330));
  WALK_T = Math.max(30, Math.round(avail / WALK_VIEW));
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="walk-stage" id="walkStage">
      <button class="walk-path" id="walkPath">Path</button>
      <div class="walk-world" id="walkWorld" style="
        --wt:${WALK_T}px;
        width:${W*WALK_T}px;height:${H*WALK_T}px;
        background-image:url('assets/zones/${d.art}.png');
        background-size:${nat[0]*d.bs*WALK_T}px ${nat[1]*d.bs*WALK_T}px;
        background-position:${d.bx*WALK_T}px ${d.by*WALK_T}px;"></div>
    </div>
    <div class="walk-pads">
      <div class="walk-dpad">
        <i></i><button class="wkey" data-d="u">${TRI('u')}</button><i></i>
        <button class="wkey" data-d="l">${TRI('l')}</button><i></i><button class="wkey" data-d="r">${TRI('r')}</button>
        <i></i><button class="wkey" data-d="d">${TRI('d')}</button><i></i>
      </div>
      <div class="walk-side">
        <button class="wact party" id="walkParty">Party</button>
        <div class="walk-acts" id="walkActs"></div>
      </div>
    </div>`;
  $('#backBtn').addEventListener('click', ()=>{ stopRail(); stopAquarium(); go('explore'); });
  /* remember where to come back to, so Party does not dump you on the region
     screen with your place on the ship lost */
  $('#walkParty').addEventListener('click', ()=> leaveDeck('party'));
  /* the preference sticks between decks and between visits */
  if(ui.walkPath) $('#walkStage').classList.add('pathing');
  $('#walkPath').addEventListener('click', ()=>{
    ui.walkPath = !ui.walkPath;
    $('#walkStage').classList.toggle('pathing', ui.walkPath);
  });

  const world = $('#walkWorld');
  /* people and doorways */
  d.things.forEach(t=>{
    if(t.el) t.el = null;
    const e = document.createElement('div');
    e.className = 'walk-ent' + (t.walk ? ' flat' : '');
    e.style.transform = `translate3d(${t.x*WALK_T}px,${t.y*WALK_T}px,0)`;
    e.style.zIndex = 10 + t.y;          // further down the deck = nearer to you
    e.innerHTML = t.sprite
      ? `<img src="assets/npc/${t.sprite}.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${t.icon||''}'}))">`
      : `<span>${t.icon||''}</span>`;
    world.appendChild(e); t.el = e;
  });
  /* Every wall tile, shaded. Drawn a pixel oversized so neighbours meet with
     no seam, which makes the walkable deck read as one continuous path without
     a single line being drawn on it. Off by default; the painting is the view. */
  const shade = document.createElement('div');
  shade.className = 'walk-shade'; shade.id = 'walkShade';
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    if(!wSolid(d,x,y)) continue;
    const c = document.createElement('i');
    c.style.cssText = `left:${x*WALK_T - 1}px;top:${y*WALK_T - 1}px;` +
                      `width:${WALK_T + 2}px;height:${WALK_T + 2}px;`;
    shade.appendChild(c);
  }
  world.appendChild(shade);

  /* one arrow per staircase, 70% of a tile, bobbing gently */
  const A = Math.round(WALK_T * 0.7);
  /* Blocky, hand-drawn arrows — the shape of ⬇︎ without the tile behind it.
     A thick dark keyline under a solid green body so they read against both
     pale decking and dark water. All three are green. */
  const SHAFT = 'M14 4 h12 v17 h8 L20 36 L6 21 h8 z';
  const ARROW = {
    down: `<svg viewBox="0 0 40 40" width="${A}" height="${A}">
             <path d="${SHAFT}" fill="#1f3b26" stroke="#1f3b26" stroke-width="5"
                   stroke-linejoin="round"/>
             <path d="${SHAFT}" fill="#5fd17c" stroke="#8ee89f" stroke-width="1.4"
                   stroke-linejoin="round"/></svg>`,
    up:   `<svg viewBox="0 0 40 40" width="${A}" height="${A}"
                style="transform:rotate(180deg)">
             <path d="${SHAFT}" fill="#1f3b26" stroke="#1f3b26" stroke-width="5"
                   stroke-linejoin="round"/>
             <path d="${SHAFT}" fill="#5fd17c" stroke="#8ee89f" stroke-width="1.4"
                   stroke-linejoin="round"/></svg>`,
    /* both ways: one blocky head at each end of a shared shaft */
    both: `<svg viewBox="0 0 40 40" width="${A}" height="${A}">
             <path d="M14 13 h12 v14 h-12 z M14 13 h-8 L20 2 L34 13 h-8
                      M14 27 h-8 L20 38 L34 27 h-8"
                   fill="#1f3b26" stroke="#1f3b26" stroke-width="5" stroke-linejoin="round"/>
             <path d="M14 13 h12 v14 h-12 z M14 13 h-8 L20 2 L34 13 h-8
                      M14 27 h-8 L20 38 L34 27 h-8"
                   fill="#5fd17c" stroke="#8ee89f" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  };
  const stairs = d.things.filter(t=>t.where);
  const seen = new Set();
  stairs.forEach(t=>{
    const key = t.x+','+t.y;
    if(seen.has(key)) return;
    seen.add(key);
    const both = stairs.filter(x=>x.x===t.x&&x.y===t.y).length > 1;
    const kind = both ? 'both' : (t.verb === 'Up' ? 'up' : 'down');
    const e = document.createElement('div');
    e.className = 'walk-stair';
    e.style.left = (t.x*WALK_T + (WALK_T-A)/2) + 'px';
    e.style.top  = (t.y*WALK_T + (WALK_T-A)/2) + 'px';
    e.innerHTML = ARROW[kind];
    world.appendChild(e);
  });

  const steps = document.createElement('div'); steps.className='walk-steps'; steps.id='walkSteps';
  world.appendChild(steps);
  /* Cuain, once he has come aboard. He stands where you last stood, so he can
     never occupy your tile and never has to find his own way round a corner —
     he simply repeats what you did, one step late. */
  if(cuainAboard()){
    const gh = document.createElement('div');
    gh.className = 'walk-ent walk-ghost'; gh.id = 'walkGhost';
    gh.innerHTML = monPortrait('whalelord', 30, { view:'front', bare:true });
    world.appendChild(gh);
    if(!w.ghostAt) w.ghostAt = {};
    if(!w.ghostAt[id]) w.ghostAt[id] = { x:d.spawn[0], y:d.spawn[1] };
  }
  const me = document.createElement('div'); me.className='walk-ent walk-you'; me.id='walkYou';
  me.innerHTML = avatarImg(state.avatar || 'm1', WALK_T, { bare:true });
  world.appendChild(me);

  buildAquarium(world, d);
  wireWalkKeys();
  refreshWalk();
  if(id === 'weather_deck') startRail(); else stopRail();
}

function refreshWalk(){
  const w = walkState(), d = DECKS[w.deck]; if(!d) return;
  const p = w.at[w.deck];
  const world = $('#walkWorld'), me = $('#walkYou'), steps = $('#walkSteps');
  if(!world || !me) return;
  world.style.transform = `translate3d(${-p.x*WALK_T - WALK_T/2}px, ${-p.y*WALK_T - WALK_T/2}px, 0)`;
  me.style.transform = `translate3d(${p.x*WALK_T}px,${p.y*WALK_T}px,0)`;
  me.style.zIndex = 10 + p.y;
  const gh = $('#walkGhost');
  if(gh && w.ghostAt && w.ghostAt[w.deck]){
    const q = w.ghostAt[w.deck];
    gh.style.transform = `translate3d(${q.x*WALK_T}px,${q.y*WALK_T}px,0)`;
    gh.style.zIndex = 10 + q.y;
  }

  /* a mark on each tile you could step onto — the only question you have */
  steps.innerHTML = '';
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx,dy])=>{
    const nx=p.x+dx, ny=p.y+dy;
    if(wSolid(d,nx,ny)) return;
    if(d.things.some(t=>t.x===nx&&t.y===ny&&!t.walk)) return;
    const i=document.createElement('i');
    i.style.left=(nx*WALK_T+WALK_T/2)+'px'; i.style.top=(ny*WALK_T+WALK_T/2)+'px';
    steps.appendChild(i);
  });

  /* one button per thing you are beside, or standing on */
  const near = d.things.filter(t=> Math.abs(t.x-p.x)+Math.abs(t.y-p.y) <= 1);
  d.things.forEach(t=> t.el && t.el.classList.toggle('near', near.includes(t)));
  /* Rebuilding this on every single step was the choppiness: four dots and a
     stack of buttons torn down and recreated several times a second. It now
     only redraws when what you are standing beside actually changes. */
  const sig = near.map(t=>t.x+','+t.y+t.verb).join('|') + '#' + (cuainAboard()?'g':'');
  if(sig === w.actSig) return;
  w.actSig = sig;
  const acts = $('#walkActs');
  acts.innerHTML = '';
  /* Cuain can be spoken to from anywhere — he is behind you, not beside you. */
  const withGhost = cuainAboard() ? near.length + 1 : near.length;
  acts.classList.toggle('single', withGhost <= 1);
  if(cuainAboard()){
    const b = document.createElement('button');
    b.className = 'wact live ghost';
    b.innerHTML = monPortrait('whalelord', 34, { view:'front', bare:true }) +
                  `<span>Talk to<br>Whalelord’s Ghost</span>`;
    b.addEventListener('click', ()=>{ if(!walkState().busy) ghostChat(walkState().deck); });
    acts.appendChild(b);
  }
  if(!near.length && !cuainAboard()){
    acts.innerHTML = '<div class="wact">—</div>';
  } else near.forEach(t=>{
    const b=document.createElement('button');
    b.className='wact live';
    b.innerHTML = escapeHtml(t.verb) + (t.where ? `<small>${escapeHtml(t.where)}</small>` : '');
    b.addEventListener('click', ()=>{ if(!walkState().busy) t.act(); });
    acts.appendChild(b);
    /* Some people are worth a second look. Talking stays what it was; the
       investigation is a separate, deliberate choice. */
    const ex = t.extra && t.extra();
    if(ex){
      const e=document.createElement('button');
      e.className='wact live suspect';
      e.innerHTML = escapeHtml(ex.verb);
      e.addEventListener('click', ()=>{ if(!walkState().busy) ex.act(); });
      acts.appendChild(e);
    }
  });
}

const WALK_MIN = 150, WALK_HOLD = 110, WALK_REP = 230;
function walkMove(dir){
  const w = walkState(); if(w.busy) return;
  const d = DECKS[w.deck]; if(!d) return;
  const p = w.at[w.deck];
  const now = performance.now();
  const turning = dir !== w.face;
  w.face = dir;
  if(!turning && now - w.last < WALK_MIN) return;
  w.last = now;
  const v = { l:[-1,0], r:[1,0], u:[0,-1], d:[0,1] }[dir];
  const nx = p.x+v[0], ny = p.y+v[1];
  const blocked = d.things.some(t=> t.x===nx && t.y===ny && !t.walk);
  if(!wSolid(d,nx,ny) && !blocked){
    /* he takes the tile you are leaving — always one behind, never on top */
    if(cuainAboard()){
      w.ghostAt = w.ghostAt || {};
      w.ghostAt[w.deck] = { x:p.x, y:p.y };
    }
    p.x=nx; p.y=ny;
    if(checkPrize()){                 // stepping onto one ends the move
      releaseKeys();
      refreshWalk();                  // draw the step BEFORE the window opens
      return;
    }
  }
  else {
    const me = $('#walkYou');
    if(me){ me.classList.remove('bumped'); void me.offsetWidth; me.classList.add('bumped'); }
  }
  refreshWalk();
}
/* Every timer a held key has started. A modal or a deck change tears the
   button out of the DOM, so its pointerup never arrives and the repeat used to
   run on forever — which is why picking up a prize left you walking left. */
let _keyTimers = [];
function releaseKeys(){
  _keyTimers.forEach(t=>{ clearTimeout(t); clearInterval(t); });
  _keyTimers = [];
}
function wireWalkKeys(){
  releaseKeys();
  screenEl.querySelectorAll('[data-d]').forEach(k=>{
    let delay=null, rep=null;
    const go1 = ()=> walkMove(k.dataset.d);
    k.addEventListener('pointerdown', e=>{
      e.preventDefault(); k.setPointerCapture(e.pointerId); go1();
      delay = setTimeout(()=>{
        rep = setInterval(go1, WALK_REP); _keyTimers.push(rep);
      }, WALK_HOLD);
      _keyTimers.push(delay);
    });
    const stop = ()=>{ clearTimeout(delay); clearInterval(rep); };
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>k.addEventListener(ev, stop));
  });
}

/* ---------- moving between decks ---------- */
function goDeck(id){
  const w = walkState();
  releaseKeys();
  w.busy = true;
  tileWipe(()=>{ w.busy = false; go(id); });
}
/* The screen fills in with black squares, then clears the same way — it hides
   whatever is being built behind it and reads far better than a cut. */
function tileWipe(then){
  const stage = $('#walkStage') || screenEl;
  const N = 10, lay = document.createElement('div');
  lay.className = 'tile-wipe';
  for(let i=0;i<N*N;i++){
    const c=document.createElement('i');
    c.style.cssText = `left:${(i%N)*100/N}%;top:${Math.floor(i/N)*100/N}%;width:${100/N}%;height:${100/N}%;`;
    lay.appendChild(c);
  }
  document.body.appendChild(lay);
  const cells=[...lay.children].sort(()=>Math.random()-0.5);
  let k=0;
  const t=setInterval(()=>{
    for(let j=0;j<10 && k<cells.length;j++,k++) cells[k].style.opacity=1;
    if(k>=cells.length){ clearInterval(t); then();
      setTimeout(()=>{
        const back=[...lay.children].sort(()=>Math.random()-0.5); let m=0;
        const t2=setInterval(()=>{
          for(let j=0;j<10 && m<back.length;j++,m++) back[m].style.opacity=0;
          if(m>=back.length){ clearInterval(t2); setTimeout(()=>lay.remove(), 220); }
        }, 18);
      }, 90);
    }
  }, 18);
}

/* ---------- what the things do ---------- */
/* Somebody says something before you go over the side. It costs one tap and it
   is the difference between a menu and a place. Repeat dives skip it, because
   Explore again goes straight back in. */
const DIVE_LINES = [
  `<b>"Tank's charged. Mind the cold."</b>`,
  `<b>"Straight down and straight back. No wandering."</b>`,
  `<b>"If something looks at you funny, come up."</b>`,
];
/* He has waited a week to be this close. He is not interested in fish. */
function whaleImpatient(what){
  const g = r4();
  const lines = what === 'dive'
    ? `He puts himself between you and the ladder.<br><br>` +
      `<b>"No. Not now. Please."</b><br><br>` +
      `<b>"My core is on this ship. I can feel it from here. My power. Everything ` +
      `they cut out of me."</b><br><br>` +
      `<b>"Go back inside and find who has it. You can swim afterwards. I have ` +
      `waited so long."</b>`
    : `He drifts across the rail before you can reach it.<br><br>` +
      `<b>"Birds? You want to chase birds?"</b><br><br>` +
      `<b>"My core is below our feet. My essence. The piece of me they took."</b><br><br>` +
      `<b>"It will not be there forever. Please. Go and look."</b>`;
  storyModal(monPortrait('whalelord',150,{view:'front',bare:true}), whaleName(),
    lines, ()=> go('weather_deck'), { bg:'region4', subtitle:'Weather Deck' });
}
/* Once he is aboard and until the truth is out, nothing else happens up here. */
function whaleHolds(){ const g = r4(); return !!g.ghostAccepted && !g.solved; }

function diveFromDeck(){
  const g = r4();
  if(!g.diversBeaten) return diversBlock();
  if(whaleHolds()) return whaleImpatient('dive');
  if(g.wallFound && !g.solved) return confirmWhaleDive();
  storyModal(npcPortrait('diver1','🤿',130,'transparent'), crewName('diver1'),
    DIVE_LINES[Math.floor(Math.random()*DIVE_LINES.length)],
    ()=> startDive(), { bg:'battle_diving', subtitle:'The dive platform' });
}
function diverChat(){
  storyModal(npcPortrait('diver2','🤿',130,'transparent'), crewName('diver2'),
    `She is checking a gauge and does not stop.<br><br>` +
    `<b>"Pell handles the ladder. I handle whether you come back up."</b><br><br>` +
    `<i>She almost smiles.</i>`,
    ()=> go('weather_deck'), { bg:'battle_weather_deck', subtitle:'Weather Deck' });
}

const RAIL_LINES = [
  `<b>"They're at it again!"</b> He is hauling with one arm and swatting with the other.<br><br>` +
  `<b>"Get them off my catch!"</b>`,
  `<b>"Every single haul!"</b> The net is boiling with something that is not fish.<br><br>` +
  `<b>"Help me, would you?"</b>`,
  `<b>"There — see it? Came right out of the sky."</b><br><br>` +
  `<b>"I'm not losing another net to that thing."</b>`,
];
function railHelp(n){
  if(whaleHolds()) return whaleImpatient('rail');
  const r = railState();
  /* answering the call clears it; the next one comes along in its own time */
  if(r.who === n){ r.who = null; r.next = Date.now() + REST_MIN + Math.random()*REST_VAR; }
  storyModal(npcPortrait('fisherman'+n,'🎣',130,'transparent'), crewName('fisherman'+n),
    RAIL_LINES[Math.floor(Math.random()*RAIL_LINES.length)],
    ()=> (typeof startBirdRaid === 'function') ? startBirdRaid() : go('weather_deck'),
    { bg:'battle_weather_deck', subtitle:'Starboard rail' });
}
function labScientist(n){
  const stage = (typeof labStage === 'function') ? labStage() : 'blocked';
  if(stage === 'investigation') return fightScientist(n);
  if(stage === 'after') return go('laboratory_deck');
  puzzledChat(n);
}
function labSupervisor(){
  const stage = (typeof labStage === 'function') ? labStage() : 'blocked';
  if(stage !== 'investigation') return puzzledSup();
  if(!allBeaten()) return supervisorNudge();
  if(!guessesLeft()) return supervisorPatience();
  go('accuse');
}
