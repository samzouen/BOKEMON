/* ============================================================
   WALKABLE DECKS
   The three decks of the Vane Shear, walked rather than tapped. One grid per
   deck, the painting behind it, a D-pad, and an action button for every thing
   you are standing beside.

   Nothing here talks to the network. The guards, the camera and the steps are
   all local; only the usual save touches Firebase.
   ============================================================ */

/* How close the camera sits. The stage is square, so this is how many tiles
   you see across it. Seven keeps a phone close to the action; a tablet has the
   room for nine, which shows more of the ship and asks less of the paintings,
   since each tile is then stretched less. Recomputed on every render, so
   turning a tablet or resizing a window picks the right one up. */
let WALK_VIEW = 7;
function walkView(){ return Math.min(window.innerWidth, window.innerHeight) >= 700 ? 9 : 7; }
let WALK_T = 44;                         // recomputed to fit the stage

/* A thing can be bigger than one tile (the Whalelord's body is two by two) and
   some are only there at a certain point in the story (`when`). Everything that
   asks "what is standing here" goes through these, so the picture, the blocking
   and the buttons can never disagree. */
/* A picture that will not load must still show something. An invisible thing
   that blocks four tiles is the worst of both worlds. */
function walkArtMissing(img, icon, px, rot){
  const s = document.createElement('span');
  s.textContent = icon || '❓';
  s.style.cssText = `font-size:${px}px;line-height:1;` + (rot ? `transform:rotate(${rot}deg);` : '');
  img.replaceWith(s);
}
function deckThings(d){ return d.things.filter(t => !t.when || t.when()); }
function thingCovers(t, x, y){
  return x >= t.x && x < t.x + (t.w || 1) && y >= t.y && y < t.y + (t.h || 1);
}
function wThingAt(d, x, y){ return deckThings(d).find(t => thingCovers(t, x, y)); }
function wBlockedBy(d, x, y){ const t = wThingAt(d, x, y); return !!(t && !t.walk); }
function thingNear(t, p){
  const dx = Math.max(t.x - p.x, 0, p.x - (t.x + (t.w || 1) - 1));
  const dy = Math.max(t.y - p.y, 0, p.y - (t.y + (t.h || 1) - 1));
  return dx + dy <= 1;
}

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
      /* The Whalelord's body, laid across the bow the way the fishermen left
         it: two tiles by two, turned. It blocks the bow tip while it lies
         there, which is what a whale on a foredeck would do. */
      { x:12, y:4, w:2, h:2, sprite:'whalelord_corpse', rot:30, icon:'🐋', verb:'The body',
        when:()=> !!(typeof r4 === 'function' && r4().corpseSeen),
        act:()=> corpseChat() },
      /* These two are only here while the scene on deck is playing — and that
         is remembered in the save, so leaving and coming back finds them. */
      { x:13, y:6, sprite:'ship_captain', icon:'⚓', verb:'Captain',
        when:()=> !!(typeof r4 === 'function' && r4().corpseStage === 'deck'), act:()=> corpseDeckCaptain() },
      { x:14, y:6, sprite:'scientist_supervisor', icon:'🧑‍🔬', verb:'Supervisor',
        when:()=> !!(typeof r4 === 'function' && r4().corpseStage === 'deck'), act:()=> corpseDeckSupervisor() },
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
    spawn:[12,8],
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
        when:()=> !(r4().solved || r4().escapeStage),     // gone once he has taken the core
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
      { x:13, y:5,  sprite:'scientist_supervisor', icon:'🧑‍🔬', verb:'Report', act:()=> labSupervisor(),
        when:()=> labStage() !== 'after' },
      /* Once it is over, Rhona stands where he stood — and means to earn it. */
      { x:13, y:5,  sprite:'scientist9', icon:'🧑‍🔬', verb:'Talk', act:()=> rhonaTask(),
        when:()=> labStage() === 'after', mark:()=> rhonaHasTask() },
      { x:16, y:8,  walk:true, verb:'Up', where:'Cabin Deck', act:()=> goDeck('cabin_deck') },
      { x:8,  y:14, sprite:'scientist1', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(1) , mark:()=> sciHasHunt(1) },
      { x:8,  y:17, sprite:'scientist2', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(2) , mark:()=> sciHasHunt(2) },
      { x:18, y:17, sprite:'scientist3', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(3) , mark:()=> sciHasHunt(3) },
      { x:8,  y:22, sprite:'scientist4', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(4) , mark:()=> sciHasHunt(4) },
      { x:18, y:21, sprite:'scientist5', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(5) , mark:()=> sciHasHunt(5) },
      { x:8,  y:26, sprite:'scientist6', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(6),
        when:()=> labStage() !== 'after' },
      { x:18, y:26, sprite:'scientist7', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(7) , mark:()=> sciHasHunt(7) },
      { x:9,  y:30, sprite:'scientist8', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(8) , mark:()=> sciHasHunt(8) },
      { x:15, y:32, sprite:'scientist9', icon:'🧑‍🔬', verb:'Talk', act:()=> labScientist(9),
        when:()=> labStage() !== 'after' && !crewUpFront() },
      /* Once Mireille has been named: Rhona, the captain and the shipkeeper stand
         by near the supervisor until the scene moves up to the bow. */
      { x:12, y:7,  sprite:'scientist9',   icon:'🧑‍🔬', verb:'Talk', act:()=> upFrontChat('scientist9'),   when:()=> crewUpFront() },
      { x:14, y:7,  sprite:'ship_captain', icon:'⚓',   verb:'Talk', act:()=> upFrontChat('ship_captain'), when:()=> crewUpFront() },
      { x:15, y:7,  sprite:'shipkeeper',   icon:'🧰',   verb:'Talk', act:()=> upFrontChat('shipkeeper'),   when:()=> crewUpFront() },
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
/* Drawn bigger than a tile. Only the picture changes: the drift box (SWIM_X /
   SWIM_Y) and the speeds are in tiles and stay exactly as they were. */
const SWIM_SCALE = { starfish:2, loong:2, seahorse:2 };
function fishScale(sp){ return SWIM_SCALE[sp] || 1; }
function fishArt(sp, view){
  return monPortrait(sp, Math.round(WALK_T * 0.5 * fishScale(sp)), { view, bare:true, stage:0 });
}
const rnd = (a,b)=> a + Math.random()*(b-a);
let _tank = null, _tankTimer = null;

function buildAquarium(world, d){
  if(!d.aquarium) return;
  _tank = d.aquarium.map(f=>{
    const el = document.createElement('div');
    el.className = 'walk-fish';
    const box = WALK_T * fishScale(f.sp), off = (box - WALK_T) / 2;
    el.style.cssText = `left:${f.x*WALK_T - off}px;top:${f.y*WALK_T - off}px;` +
                       `width:${box}px;height:${box}px;`;
    el.innerHTML = fishArt(f.sp, 'front');
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
      f.el.innerHTML = fishArt(f.sp, want);
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
const WALK_MARK_SVG = `<svg viewBox="0 0 40 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="9" y="4" width="22" height="60" rx="11" fill="#ffd21f" stroke="#111" stroke-width="4"/>
  <circle cx="20" cy="82" r="10" fill="#ffd21f" stroke="#111" stroke-width="4"/></svg>`;
function walkCss(){
  if(document.getElementById('walkCss')) return;
  const st = document.createElement('style');
  st.id = 'walkCss';
  st.textContent = `
    .walk-still .walk-world, .walk-still .walk-ent{transition:none !important;}
    .walk-mark{position:absolute;aspect-ratio:40/96;transform:translateX(-50%);pointer-events:none;
      z-index:55;animation:walkMarkBob 1.1s ease-in-out infinite;}
    .walk-mark svg{width:100%;height:100%;display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25));}
    @keyframes walkMarkBob{0%,100%{translate:0 0}50%{translate:0 -14%}}
  `;
  document.head.appendChild(st);
}
function renderWalkDeck(id){
  walkCss();
  /* A scene can pin you in place. Whichever deck you pick — and however you
     leave the region and come back — you are put down where the story left
     you, and you stay there until it is finished. The stage is in the save,
     not in ui, so closing the app changes nothing. */
  const lock = (typeof storyLock === 'function') ? storyLock() : null;
  if(lock && id !== lock.deck) return renderWalkDeck(lock.deck);
  const d = DECKS[id]; if(!d) return go('explore');
  const w = walkState();
  w.deck = id;
  /* The action panel is rebuilt only when what you stand beside changes — so a
     fresh render has to forget the last signature, or the buttons come back
     empty after a scene, a fight or a shop. */
  w.actSig = null;
  if(lock){
    w.at = w.at || {};
    w.at[id] = { x:lock.x, y:lock.y };
    if(lock.ghost){ w.ghostAt = w.ghostAt || {}; w.ghostAt[id] = { x:lock.ghost.x, y:lock.ghost.y }; }
    if(lock.face) w.face = lock.face;
    w.busy = true;                       // no walking until the scene is done
  } else if(w.busy){
    w.busy = false;                      // a scene left half-finished never freezes you
  }
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
  /* fit the view across whatever the stage turns out to be */
  WALK_VIEW = walkView();
  const avail = Math.min(window.innerWidth - 24, Math.max(220, window.innerHeight - 330));
  WALK_T = Math.max(30, Math.round(avail / WALK_VIEW));
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    ${(state.progress.currentRegion === 4 && typeof expeditionBar === 'function') ? expeditionBar(true) : ''}
    <div class="walk-stage walk-still" id="walkStage">
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
  d.things.forEach(t=> { if(t.el) t.el = null; });
  deckThings(d).forEach(t=>{
    const e = document.createElement('div');
    e.className = 'walk-ent' + (t.walk ? ' flat' : '');
    e.style.transform = `translate3d(${t.x*WALK_T}px,${t.y*WALK_T}px,0)`;
    e.style.zIndex = 10 + t.y;          // further down the deck = nearer to you
    if(t.w || t.h){                     // a thing that covers more than its own tile
      e.style.width  = (t.w || 1) * WALK_T + 'px';
      e.style.height = (t.h || 1) * WALK_T + 'px';
    }
    const spin = t.rot ? ` style="transform:rotate(${t.rot}deg);"` : '';
    const fallPx = Math.round(WALK_T * 0.8 * (t.h || 1));
    e.innerHTML = t.sprite
      ? `<img src="assets/npc/${t.sprite}.png" alt=""${spin} onerror="walkArtMissing(this,'${(t.icon||'').replace(/'/g,'')}',${fallPx},${t.rot||0})">`
      : `<span style="font-size:${fallPx}px;line-height:1;">${t.icon||''}</span>`;
    world.appendChild(e); t.el = e;
    /* A task: a yellow "!" bobbing over their head, nine tenths of a tile tall. */
    if(t.mark && t.mark()){
      const mk = document.createElement('div');
      mk.className = 'walk-mark';
      mk.style.left = ((t.x + (t.w || 1) / 2) * WALK_T) + 'px';
      mk.style.top = (t.y * WALK_T - 0.9 * WALK_T) + 'px';
      mk.style.height = (0.9 * WALK_T) + 'px';
      mk.innerHTML = WALK_MARK_SVG;
      world.appendChild(mk);
    }
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
  /* Everyone is put straight where they stand. Without this the sprites were
     created at the map's corner and then slid across to their places. */
  requestAnimationFrame(()=> requestAnimationFrame(()=>{
    const st = $('#walkStage'); if(st) st.classList.remove('walk-still');
  }));
  if(id === 'weather_deck' && !lock) startRail(); else stopRail();
  /* A pinned scene sets out its people once the deck is drawn, and a scene
     that plays by itself starts itself. */
  if(lock && lock.stage) lock.stage();
  if(lock && lock.auto && !ui.sceneRunning) lock.auto();
}

/* The camera follows you until the map runs out. At an edge the map stops and
   YOU carry on across the stage, so there is never a black margin beyond the
   painting; walk back inland and you slide to the middle again. A map smaller
   than the stage — a room inside a building — simply sits in the middle, and
   you walk about inside it. The world is anchored at the middle of the stage
   (left:50%, top:50%), so these offsets are measured from there. */
function walkCam(centre, mapPx, stagePx){
  if(mapPx <= stagePx) return -mapPx / 2;
  return Math.max(stagePx / 2 - mapPx, Math.min(-stagePx / 2, -centre));
}
function refreshWalk(){
  const w = walkState(), d = DECKS[w.deck]; if(!d) return;
  const p = w.at[w.deck];
  const world = $('#walkWorld'), me = $('#walkYou'), steps = $('#walkSteps');
  if(!world || !me) return;
  const stageEl = $('#walkStage');
  const SW = (stageEl && stageEl.clientWidth)  || WALK_VIEW * WALK_T;
  const SH = (stageEl && stageEl.clientHeight) || WALK_VIEW * WALK_T;
  const cols = d.rows[0].length, rows = d.rows.length;
  world.style.transform =
    `translate3d(${walkCam(p.x*WALK_T + WALK_T/2, cols*WALK_T, SW)}px, ` +
    `${walkCam(p.y*WALK_T + WALK_T/2, rows*WALK_T, SH)}px, 0)`;
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
  const lock = (typeof storyLock === 'function') ? storyLock() : null;
  if(lock){
    /* Pinned by a scene: no steps to offer, and one button. It is the only
       thing you can do, but it is yours to press. */
    const acts = $('#walkActs');
    const sig = 'lock:' + (lock.label || '');
    if(sig !== w.actSig){
      w.actSig = sig;
      acts.classList.add('single');
      acts.innerHTML = '';
      if(lock.label){                   // while a scene is playing there is nothing to press
        const b = document.createElement('button');
        b.className = 'wact live';
        b.textContent = lock.label;
        b.addEventListener('click', ()=> lock.act());
        acts.appendChild(b);
      }
    }
    return;
  }
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx,dy])=>{
    const nx=p.x+dx, ny=p.y+dy;
    if(wSolid(d,nx,ny)) return;
    if(wBlockedBy(d, nx, ny)) return;
    const i=document.createElement('i');
    i.style.left=(nx*WALK_T+WALK_T/2)+'px'; i.style.top=(ny*WALK_T+WALK_T/2)+'px';
    steps.appendChild(i);
  });

  /* one button per thing you are beside, or standing on */
  const near = deckThings(d).filter(t=> thingNear(t, p));
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
  const blocked = wBlockedBy(d, nx, ny);
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
  if(stage === 'investigation') return sciAlibi(n);
  if(stage === 'after') return sciAfterChat(n);
  puzzledChat(n);
}
function labSupervisor(){
  const stage = (typeof labStage === 'function') ? labStage() : 'blocked';
  if(stage !== 'investigation') return puzzledSup();
  if(!allBeaten()) return supervisorNudge();
  if(!guessesLeft()) return supervisorPatience();
  go('accuse');
}

/* ============================================================
   CUTSCENES
   A scene puts extra people on a deck for a while (actors), talks in small
   windows that leave the deck in view, and moves things about. Actors are not
   DECKS things: nobody bumps into them or talks to them. Every pause goes
   through sceneWait, so one number (SCENE_SPEED) runs a whole scene at speed
   in a test.
   ============================================================ */
let SCENE_SPEED = 1;
function sceneWait(ms){ return new Promise(r => setTimeout(r, ms * SCENE_SPEED)); }

function sceneCss(){
  if(document.getElementById('sceneCss')) return;
  const st = document.createElement('style');
  st.id = 'sceneCss';
  st.textContent = `
    .scene-actor{position:absolute;pointer-events:none;}
    .scene-actor .sa-in{width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;}
    .scene-actor img{width:100%;height:100%;object-fit:contain;object-position:bottom;}
    @keyframes sceneBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-12%)}}
    .scene-actor.bob .sa-in{animation:sceneBob 1.6s ease-in-out infinite;}
    .scene-say{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);
      width:min(94vw,480px);background:var(--paper);border-radius:18px;padding:14px 14px 12px;
      box-shadow:0 10px 32px rgba(0,0,0,.35);z-index:85;display:flex;gap:12px;align-items:flex-start;}
    .scene-say .ss-faces{display:flex;gap:6px;flex:0 0 auto;align-items:flex-end;}
    .scene-say .ss-faces img{width:64px;height:64px;object-fit:contain;visibility:visible !important;}
    .scene-say .ss-body{flex:1;text-align:left;font-size:14px;line-height:1.5;}
    .scene-say .ss-name{font-weight:800;margin-bottom:4px;}
    .scene-say .ss-go{display:flex;justify-content:flex-end;margin-top:10px;}
    #sceneCurtain{position:fixed;inset:0;background:#000;opacity:0;z-index:95;pointer-events:none;
      display:flex;align-items:center;justify-content:center;}
    #sceneCurtain .sc-text{color:#fff;font-size:20px;line-height:1.5;text-align:center;padding:0 28px;opacity:0;}
    #sceneFlash{position:fixed;inset:0;background:#fff;opacity:0;z-index:96;pointer-events:none;}
    .scene-ball{position:absolute;border-radius:50%;pointer-events:none;z-index:40;opacity:.8;
      background:radial-gradient(circle,#ffffff 0%,#e3fffb 28%,#86f4e8 55%,rgba(64,224,208,0) 71%);
      box-shadow:0 0 36px 10px rgba(130,255,240,.5);}
  `;
  document.head.appendChild(st);
}

/* Put someone on the deck, or change them. x/y/w/h in tiles (x/y is the top-
   left corner, and may be fractional). src is an image path; flip faces the
   other way; faint lays them on their side, a fifth of a tile lower. */
function sceneActor(id, o){
  sceneCss();
  const world = $('#walkWorld');
  if(!world) return null;
  let el = document.getElementById('sa-' + id);
  if(!el){
    el = document.createElement('div');
    el.className = 'scene-actor';
    el.id = 'sa-' + id;
    el.innerHTML = '<div class="sa-in"></div>';
    world.appendChild(el);
  }
  const a = el._o = Object.assign(el._o || {}, o || {});
  const T = WALK_T, w = a.w || 1, h = a.h || 1;
  el.style.left = (a.x * T) + 'px';
  el.style.top = (a.y * T) + 'px';
  el.style.width = (w * T) + 'px';
  el.style.height = (h * T) + 'px';
  el.style.zIndex = (a.z != null) ? a.z : (10 + Math.floor(a.y));
  el.classList.toggle('bob', !!a.bob);
  const inner = el.firstChild;
  if(o && (o.src || o.icon) || !inner.firstChild){
    inner.innerHTML = `<img src="${a.src}" alt="" ` +
      `onerror="walkArtMissing(this,'${(a.icon||'').replace(/'/g,'')}',${Math.round(T*0.8*h)},0)">`;
  }
  const art = inner.firstChild;
  if(art && art.style){
    const t = [];
    if(a.faint) t.push(`translateY(20%) rotate(${a.faint > 0 ? 90 : -90}deg)`);
    if(a.flip)  t.push('scaleX(-1)');
    art.style.transform = t.join(' ');
  }
  return el;
}
/* The screen shakes: a fresh random nudge every frame, so it is quick, as
   strong as amp(ms) says in tiles — ms being the time into the shake at normal
   speed. It uses the separate CSS `translate`, so the stage's own transform is
   never touched, and it always ends exactly where it started. */
function sceneShake(ms, amp){
  const el = $('#walkStage');
  if(!el) return sceneWait(ms);
  const dur = Math.max(1, ms * SCENE_SPEED), t0 = performance.now();
  return new Promise(done=>{
    const frame = now=>{
      const e = now - t0;
      if(e >= dur){ el.style.translate = ''; return done(); }
      const a = Math.max(0, amp(e / SCENE_SPEED)) * WALK_T;
      el.style.translate = `${((Math.random() * 2 - 1) * a).toFixed(1)}px ${((Math.random() * 2 - 1) * a).toFixed(1)}px`;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
/* A soft blue-white light around a point (tiles), fading in; z decides
   whether it sits in front of or behind what it lights. */
function sceneGlow(id, cx, cy, tiles, z){
  sceneCss();
  const world = $('#walkWorld'); if(!world) return null;
  const T = WALK_T, d = tiles * T;
  const g = document.createElement('div');
  g.className = 'scene-glow'; g.id = 'sg-' + id;
  g.style.cssText = `position:absolute;left:${cx*T - d/2}px;top:${cy*T - d/2}px;width:${d}px;height:${d}px;` +
    `border-radius:50%;pointer-events:none;z-index:${z == null ? 59 : z};opacity:0;` +
    `background:radial-gradient(circle,rgba(255,255,255,.95) 0%,rgba(205,235,255,.75) 35%,rgba(150,205,255,0) 70%);` +
    `transition:opacity ${600 * SCENE_SPEED}ms ease;`;
  world.appendChild(g);
  void g.offsetWidth;
  g.style.opacity = '1';
  return g;
}
async function sceneGlowOut(ids, ms){
  ids.forEach(id=>{ const g = document.getElementById('sg-' + id);
    if(g){ g.style.transition = `opacity ${ms * SCENE_SPEED}ms ease`; g.style.opacity = '0'; } });
  await sceneWait(ms);
  ids.forEach(id=>{ const g = document.getElementById('sg-' + id); if(g) g.remove(); });
}
/* The screen shimmers white for ms: a quick flicker inside a slow swell. */
function sceneShimmer(ms){
  const f = document.createElement('div');
  f.id = 'sceneShimmer';
  f.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;z-index:96;pointer-events:none;';
  document.body.appendChild(f);
  const dur = Math.max(1, ms * SCENE_SPEED), t0 = performance.now();
  return new Promise(done=>{
    const frame = now=>{
      const e = now - t0, t = Math.min(1, e / dur);
      const swell = Math.sin(Math.PI * t);
      const flicker = 0.55 + 0.45 * Math.sin((e / SCENE_SPEED) / 1000 * Math.PI * 2 * 5);
      f.style.opacity = (0.55 * swell * flicker).toFixed(3);
      if(t < 1) requestAnimationFrame(frame); else { f.remove(); done(); }
    };
    requestAnimationFrame(frame);
  });
}
function sceneActorGone(id){ const el = document.getElementById('sa-' + id); if(el) el.remove(); }
function sceneClear(){
  document.querySelectorAll('.scene-actor, .scene-ball, .scene-say, .scene-glow').forEach(e=> e.remove());
  const st = $('#walkStage'); if(st) st.style.translate = '';
}
/* Lay the player down (or stand them back up) where they are. */
function sceneFaintPlayer(dir){
  const img = document.querySelector('#walkYou img');
  if(img) img.style.transform = dir ? `translateY(20%) rotate(${dir > 0 ? 90 : -90}deg) scale(1.275)` : '';
}

/* A small window along the bottom: the deck stays in view above it. faces is
   a list of picture HTML (one, or two side by side). */
function sceneSay(faces, name, html, button){
  sceneCss();
  return new Promise(done=>{
    const box = document.createElement('div');
    box.className = 'scene-say';
    box.innerHTML = `<div class="ss-faces">${(faces || []).join('')}</div>` +
      `<div class="ss-body"><div class="ss-name">${escapeHtml(name || '')}</div><div>${html}</div>` +
      `<div class="ss-go"><button class="btn btn-primary">${button || 'Continue'}</button></div></div>`;
    document.body.appendChild(box);
    box.querySelector('button').addEventListener('click', ()=>{ box.remove(); done(); });
  });
}
function faceNpc(id, emoji){
  return `<img src="assets/npc/${id}.png" alt="" onerror="walkArtMissing(this,'${emoji || '🧑'}',48,0)">`;
}
function faceImg(src, emoji){
  return `<img src="${src}" alt="" onerror="walkArtMissing(this,'${emoji || '❓'}',48,0)">`;
}
function facePlayer(){ return avatarImg(state.avatar || 'm1', 64, { bare:true }); }
function faceMon(sp, opts){ return monPortrait(sp, 64, Object.assign({ view:'front', bare:true }, opts || {})); }

/* The black curtain, and white words on it. */
function sceneCurtainEl(){
  sceneCss();
  let c = document.getElementById('sceneCurtain');
  if(!c){
    c = document.createElement('div');
    c.id = 'sceneCurtain';
    c.innerHTML = '<div class="sc-text"></div>';
    document.body.appendChild(c);
    void c.offsetWidth;
  }
  return c;
}
async function sceneCurtain(show, ms){
  const c = sceneCurtainEl();
  c.style.transition = `opacity ${ms * SCENE_SPEED}ms ease`;
  void c.offsetWidth;
  c.style.opacity = show ? '1' : '0';
  await sceneWait(ms);
  if(!show) c.remove();
}
async function sceneCurtainText(text, ms){
  const t = sceneCurtainEl().querySelector('.sc-text');
  t.textContent = text || '';
  t.style.transition = `opacity ${ms * SCENE_SPEED}ms ease`;
  void t.offsetWidth;
  t.style.opacity = text ? '1' : '0';
  await sceneWait(ms);
}

/* White from translucent to solid over inMs, held for holdMs (duringWhite runs
   behind it), then lifted. */
async function sceneFlash(inMs, holdMs, duringWhite, outMs){
  sceneCss();
  const f = document.createElement('div');
  f.id = 'sceneFlash';
  f.style.opacity = '0.3';
  document.body.appendChild(f);
  void f.offsetWidth;
  f.style.transition = `opacity ${inMs * SCENE_SPEED}ms linear`;
  f.style.opacity = '1';
  await sceneWait(inMs);
  if(duringWhite) duringWhite();
  await sceneWait(holdMs);
  const out = outMs || 500;
  f.style.transition = `opacity ${out * SCENE_SPEED}ms ease`;
  f.style.opacity = '0';
  await sceneWait(out);
  f.remove();
}

/* A glowing ball that breathes in and out while it grows, ending exactly
   maxTiles across, centred on (cx, cy) in tile units. */
function sceneBall(cx, cy, maxTiles, ms){
  sceneCss();
  const world = $('#walkWorld');
  const b = document.createElement('div');
  b.className = 'scene-ball';
  b.id = 'sceneBall';
  if(world) world.appendChild(b);
  const T = WALK_T, dur = Math.max(1, ms * SCENE_SPEED), t0 = performance.now();
  return new Promise(done=>{
    const frame = now=>{
      const t = Math.min(1, (now - t0) / dur);
      const grow = 0.4 + (maxTiles - 0.4) * t;
      /* two breaths a second, however long the charge, and exactly maxTiles at the end */
      const pulse = t < 1 ? 1 + 0.14 * Math.sin(((now - t0) / SCENE_SPEED) / 1000 * Math.PI * 4) : 1;
      const d = grow * pulse * T;
      b.style.width = b.style.height = d + 'px';
      b.style.left = (cx * T - d / 2) + 'px';
      b.style.top = (cy * T - d / 2) + 'px';
      if(t < 1) requestAnimationFrame(frame); else done(b);
    };
    requestAnimationFrame(frame);
  });
}

/* Move an actor along a jump: straight across, up and over by `lift` tiles. */
function sceneHop(id, x1, y1, lift, ms){
  const el = document.getElementById('sa-' + id);
  if(!el) return Promise.resolve();
  const a = el._o, x0 = a.x, y0 = a.y, dur = Math.max(1, ms * SCENE_SPEED), t0 = performance.now();
  return new Promise(done=>{
    const frame = now=>{
      const t = Math.min(1, (now - t0) / dur);
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t - 4 * lift * t * (1 - t);
      el.style.left = (x * WALK_T) + 'px';
      el.style.top = (y * WALK_T) + 'px';
      if(t < 1) requestAnimationFrame(frame);
      else { a.x = x1; a.y = y1; done(); }
    };
    requestAnimationFrame(frame);
  });
}
/* Slide several actors by the same amount, together. */
function sceneGlide(ids, dx, dy, ms){
  const els = ids.map(id=> document.getElementById('sa-' + id)).filter(Boolean);
  const dur = ms * SCENE_SPEED;
  els.forEach(el=>{
    el.style.transition = `left ${dur}ms ease-in, top ${dur}ms ease-in`;
    void el.offsetWidth;
    el._o.x += dx; el._o.y += dy;
    el.style.left = (el._o.x * WALK_T) + 'px';
    el.style.top = (el._o.y * WALK_T) + 'px';
  });
  return sceneWait(ms);
}

