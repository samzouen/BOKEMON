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
const WALK_VIEW = 9;
let WALK_T = 44;                         // recomputed to fit the stage

/* Each deck: its grid, who stands where, and where its painting sits — all in
   TILE units, so the numbers mean the same at any zoom. */
const DECKS = {
  weather_deck: {
    art:'weather_deck', music:'zone_weather_deck',
    bx:-0.055, by:0.010, bs:0.032500,
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
    bx:-1.6131, by:1.3434, bs:0.025965,
    rows:[
"###################","###################","###################","###################",
"###################","###################","#######.###.#######","#######.###.#######",
"######........#####","######.############","#####...###...#####","#####.#.###.#.#####",
"####..#.###.#..####","####..#.###.#..####","#####.#.###.#.#####","#####.........#####",
"#########.#########","#####.........#####","#####...#.#...#####","#########.#########",
"#########.#########","####...........####","####..###.##...####","####..###.#########",
"#########.#########","#####.###.#....####","#####..........####","#####...#.#....####",
"#########.#########","#####..##.#########","######.##.....#####","######....###.#####",
"#######.......#####","#######...##.######","#########.#########","#########.#########",
"###################","###################","###################",
    ],
    spawn:[13,8],
    things:[
      { x:11, y:6,  sprite:'ship_captain', icon:'⚓', verb:'Talk', act:()=> chartRoom(),
        extra:()=> suspectOf('ship_captain') },
      { x:7,  y:6,  sprite:'shipkeeper',   icon:'⚓', verb:'Shop', act:()=> shipkeeperShop(),
        extra:()=> suspectOf('shipkeeper') },
      { x:13, y:8,  walk:true, verb:'Up',   where:'Weather Deck', act:()=> goDeck('weather_deck') },
      { x:13, y:8,  walk:true, verb:'Down', where:'Laboratory',   act:()=> goDeck('laboratory_deck') },
      { x:5,  y:17, sprite:'sailor1', icon:'⚓', verb:'Talk', act:()=> sailorChat(1), extra:()=> suspectOf('sailor1') },
      { x:13, y:17, sprite:'sailor2', icon:'⚓', verb:'Talk', act:()=> sailorChat(2), extra:()=> suspectOf('sailor2') },
      { x:4,  y:22, sprite:'sailor3', icon:'⚓', verb:'Talk', act:()=> sailorChat(3), extra:()=> suspectOf('sailor3') },
      { x:13, y:21, sprite:'rival',   icon:'🧑', verb:'Talk', act:()=> rivalCabin(),
        extra:()=> suspectOf('rival') },
      { x:5,  y:25, sprite:'sailor4', icon:'⚓', verb:'Talk', act:()=> sailorChat(4), extra:()=> suspectOf('sailor4') },
      { x:14, y:25, walk:true, verb:'Recover', act:()=> go('recover') },
      { x:13, y:27, walk:true, verb:'Storage', act:()=> go('storage') },
      { x:8,  y:32, sprite:'cook',    icon:'🧑‍🍳', verb:'Talk', act:()=> cookChat(),
        extra:()=> suspectOf('cook') },
      { x:5,  y:29, sprite:'sailor5', icon:'⚓', verb:'Talk', act:()=> sailorChat(5), extra:()=> suspectOf('sailor5') },
    ],
  },
  laboratory_deck: {
    art:'laboratory_deck', music:'zone_laboratory_deck',
    bx:-0.080, by:-0.910, bs:0.031500,
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
      <div class="walk-world" id="walkWorld" style="
        width:${W*WALK_T}px;height:${H*WALK_T}px;
        background-image:url('assets/zones/${d.art}.png');
        background-size:${nat[0]*d.bs*WALK_T}px ${nat[1]*d.bs*WALK_T}px;
        background-position:${d.bx*WALK_T}px ${d.by*WALK_T}px;"></div>
    </div>
    <div class="walk-pads">
      <div class="walk-dpad">
        <i></i><button class="wkey" data-d="u">▲</button><i></i>
        <button class="wkey" data-d="l">◀</button><i></i><button class="wkey" data-d="r">▶</button>
        <i></i><button class="wkey" data-d="d">▼</button><i></i>
      </div>
      <div class="walk-side">
        <button class="wact party" id="walkParty">Party</button>
        <div class="walk-acts" id="walkActs"></div>
      </div>
    </div>`;
  $('#backBtn').addEventListener('click', ()=>{ stopRail(); go('explore'); });
  /* remember where to come back to, so Party does not dump you on the region
     screen with your place on the ship lost */
  $('#walkParty').addEventListener('click', ()=>{ ui.walkBack = id; go('party'); });

  const world = $('#walkWorld');
  /* people and doorways */
  d.things.forEach(t=>{
    if(t.el) t.el = null;
    const e = document.createElement('div');
    e.className = 'walk-ent' + (t.walk ? ' flat' : '');
    e.style.transform = `translate3d(${t.x*WALK_T}px,${t.y*WALK_T}px,0)`;
    e.innerHTML = t.sprite
      ? `<img src="assets/npc/${t.sprite}.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${t.icon||''}'}))">`
      : `<span>${t.icon||''}</span>`;
    world.appendChild(e); t.el = e;
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
  const gh = $('#walkGhost');
  if(gh && w.ghostAt && w.ghostAt[w.deck]){
    const q = w.ghostAt[w.deck];
    gh.style.transform = `translate3d(${q.x*WALK_T}px,${q.y*WALK_T}px,0)`;
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
  const acts = $('#walkActs');
  acts.innerHTML = '';
  /* Cuain can be spoken to from anywhere — he is behind you, not beside you. */
  const withGhost = cuainAboard() ? near.length + 1 : near.length;
  acts.classList.toggle('single', withGhost <= 1);
  if(cuainAboard()){
    const b = document.createElement('button');
    b.className = 'wact live ghost';
    b.innerHTML = monPortrait('whalelord', 30, { view:'front', bare:true }) + '<small>Cuain</small>';
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
  }
  else {
    const me = $('#walkYou');
    if(me){ me.classList.remove('bumped'); void me.offsetWidth; me.classList.add('bumped'); }
  }
  refreshWalk();
}
function wireWalkKeys(){
  screenEl.querySelectorAll('[data-d]').forEach(k=>{
    let delay=null, rep=null;
    const go1 = ()=> walkMove(k.dataset.d);
    k.addEventListener('pointerdown', e=>{
      e.preventDefault(); k.setPointerCapture(e.pointerId); go1();
      delay = setTimeout(()=>{ rep = setInterval(go1, WALK_REP); }, WALK_HOLD);
    });
    const stop = ()=>{ clearTimeout(delay); clearInterval(rep); };
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>k.addEventListener(ev, stop));
  });
}

/* ---------- moving between decks ---------- */
function goDeck(id){
  const w = walkState();
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
