/* ============================================================
   19-past.js — THE LAND OF LONG AGO (3.81)
   Through the Rift's ancient portal: the past, when the Bone Demon was
   still alive. The designer (2026-11-03): "a mega map for the past that
   takes the player through the encounter with bone demon while it was
   still alive, as well as its snake and anubis legendaries before they
   were consumed. the idea is that this timeline is separate from the
   player's, so fixing things does not help the player's own timeline,
   but anubis and the snake legendaries, if saved, provide their seeds
   that can help sense nemesis's monsters."

   The first of it: one big map (40 × 60), walked with Lucesco at your
   heels. From the south:
     · the Old Gate — a ring of standing stones round the portal;
     · the Pilgrims' Camp — a monk, a pig and a quiet giant by a fire;
     · the crossroads — west to the Jackal's Valley and its Hall of
       Scales, east to the Cobra's Oasis and its shrine;
     · White Bone Ridge — a climb up the bones to the Bone Palace.
   Its story comes next. Until then the portal wakes on a developer's
   profile only (pastOpen).
   ============================================================ */
function pastState(){ const r = r6(); return r.past || (r.past = {}); }
function pastOpen(){ return typeof isDev === 'function' && isDev(); }

const PAST_ROWS = [
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',   // 0
  'xxxxxxxxxxxxxxxxKKKKKKKKxxxxxxxxxxxxxxxx',   // 1
  'xxxxxxxxxxxxxxxxKKKKKKKKxxxxxxxxxxxxxxxx',   // 2
  'xxxxxxxxxxxxxxxxKKKKKKKKxxxxxxxxxxxxxxxx',   // 3
  'xxxxxxxxxxxxxxxeeeeeeeeeexxxxxxxxxxxxxxx',   // 4
  'xxxxxxxxxxxxxxxeeeeeeeeeexxxxxxxxxxxxxxx',   // 5
  'xxxxxxxxxxxxxxxxxxxxxxxeexxxxxxxxxxxxxxx',   // 6
  'xxxxxxxxxxxxxxxxxxxxxxxeeeeeeeeeexxxxxxx',   // 7
  'xxxxxxxxxxxxxxxxxxxxxxxeeeeeeeeeexxxxxxx',   // 8
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxeexxxxxxx',   // 9
  'xxxxxxxeeeeeeeeeeeeeeeeeeeeeeeeeexxxxxxx',   // 10
  'xxxxxxxeeeeeeeeeeeeeeeeeeeeeeeeeexxxxxxx',   // 11
  'xxxxxxxeexxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',   // 12
  'xxxxxxxeeeeeeeeeeeeeexxxxxxxxxxxxxxxxxxx',   // 13
  'xxxxxxxeeeeeeeeeeeeeexxxxxxxxxxxxxxxxxxx',   // 14
  'xxxxxxxxxxxxxxxxxxx==xxxxxxxxxxxxxxxxxxx',   // 15
  '#xxxxxxxxxxxxxxxb..,,.....b.....b......#',   // 16
  '#wwwHHHHHHHwwww..b.,,........;CCC;....##',   // 17
  '#wwwHHHHHHHwwww....,,......;;;CCC;;;...#',   // 18
  '#wwwHHHHHHHwwww....,,.....;P;:::::P;;..#',   // 19
  '#ww:::::::::www....,,.....;;;:::::;;;.##',   // 20
  '#ww:::::::::www....,,..c.;;;;;;;;;;;;P##',   // 21
  '#wwS:::::::Swww....,,...;P;;;;;;;;;;;;##',   // 22
  '#ww:::::::::www....,,...;;;;;;;;;;;;;;##',   // 23
  '#ww:::::::::www....,,...;;;;;;;;;;;;;;;#',   // 24
  '#wwS:::::::Swww....,,...;;P;;;;;;;;;;;##',   // 25
  '#ww:::::::::www....,,...;;;;;~~~~~;;;P##',   // 26
  '#ww:::::::::wwwo...,,..;;;;;~~~~~~~;;;##',   // 27
  '#wwS:::::::Swwwb...,,.c.;;;~~~~~~~~~;;;#',   // 28
  '#ww:::::::::www....,,...;;;~~~~~~~~~r;##',   // 29
  '#ww::::::::::::....,,,,,,;;;~~~~~~~;;P##',   // 30
  '#wwS:::::::S:::,,,,,,,,,,;;;;~~~~~;;;;;#',   // 31
  '#ww::::::::::::....,,...;;;;;r;;;;;;;;##',   // 32
  '#ww:::::::::www....,,...c;;;;;;;;;;;;;##',   // 33
  '#wwS:::::::Swww....,,..b..;;;;;;;;;;;.##',   // 34
  '#ww:::::::::www....,,....o;;;;;;;;;;;.##',   // 35
  '#wwwwwwwwwwwwww....,,...c..;P;;;;;;P...#',   // 36
  '#wwwwwwwwwwwwww....,,...DDDD.;;;;;.....#',   // 37
  '##....c........c...,,...DDDD.....o....##',   // 38
  '##.c.......d.......,,..........c......##',   // 39
  '#.......ddddddt....,,..................#',   // 40
  '##.....dtddddddd...,,....c.DDDDDDDD....#',   // 41
  '##....ddddddddddd..,,.....DDDDDDDDDD..##',   // 42
  '#....cdddddddddd,,,,,....oDDDDDDDDDD...#',   // 43
  '##....ddddddddddd..,,......DDDDDDDD....#',   // 44
  '##o....tdddddddd...,,.................##',   // 45
  '#.......ddddddd....,,.................##',   // 46
  '##.........d.......,,........DD.......##',   // 47
  '##.................,,......DDDDDD......#',   // 48
  '##....DDDD.........aa......DDDDDD......#',   // 49
  '##...DDDDDD.c....aaaaaa.c....DD.......##',   // 50
  '#....DDDDDD...bkaaaaaaaak.o...........##',   // 51
  '#..c..DDDD......aaaaaaaa...............#',   // 52
  '##........o....aaaaaaaaaa.......DD....##',   // 53
  '#.............kaaaaaaaaak.....DDDDDD...#',   // 54
  '##b....c........aaaaaaaa......DDDDDD..##',   // 55
  '#............o.kaaaaaaaak.......DD.....#',   // 56
  '##...o.o.........aaaaaa................#',   // 57
  '#..###.#.#..##.##k.ak.k######.##.....###',   // 58
  '########################################',   // 59
];

/* ---------- the map ----------
   x bone cliff · K the Bone Palace (a skull in the ridge) · e bone dust ·
   = steps · # sandstone · w a tomb's wall · H the Hall of Scales ·
   S a jackal statue · : old paving · ; oasis grass · ~ the pool · r reeds ·
   P a palm · C the cobra shrine · , the road · d trodden earth · t a tent ·
   a the Old Gate's platform · k a standing stone · D a dune · o a boulder ·
   c dry scrub · b bones · . sand */
const PAST_KEY = 'past_sands';
const PAST_AT = {
  spawn:[19, 53],
  portal:{ x:19, y:55, w:2, h:2 },
  palace:{ x:19, y:3, w:2 },
  hall:{ x:7, y:19 },
  shrine:{ x:30, y:17, w:3, h:2 },
  sign:{ x:21, y:29 },
  fire:{ x:11, y:43 },
  monk:{ x:10, y:42 }, pig:{ x:13, y:42 }, sandy:{ x:12, y:44 }, horse:{ x:15, y:45 },
};
const PAST_DECK = {
  key:PAST_KEY, region:6, title:'The Land of Long Ago', bg:'past', music:'zone_past',
  /* further back than a ship's deck, as the Rift is: about 12 squares
     across the stage on a tablet, 8½ on a phone (see RIFT_DECK's view) */
  get view(){
    const W = window.innerWidth, H = window.innerHeight;
    const stage = Math.min(Math.min(W, W >= 700 ? 720 : 480) - 32, H - 300);
    const avail = Math.min(W - 24, Math.max(220, H - 330));
    const want = Math.min(W, H) >= 700 ? 12 : 8.5;
    return Math.max(7, avail / (Math.max(200, stage) / want));
  },
  backLabel:'Rift', backTo:'r6_rift',
  rows:PAST_ROWS,
  bx:0, by:0, bs:1 / 32, nat:[PAST_ROWS[0].length * 32, PAST_ROWS.length * 32],
  spawn:PAST_AT.spawn,
  paint:(d)=> pastPaint(d),
  things:[
    { ...PAST_AT.portal, icon:'', verb:'The portal', sub:'Back to the Rift', act:()=> pastHome() },
    { ...PAST_AT.palace, icon:'', verb:'The Bone Palace', act:()=> pastSpot('palace') },
    { ...PAST_AT.hall, icon:'', verb:'The Hall of Scales', act:()=> pastSpot('hall') },
    { ...PAST_AT.shrine, icon:'', verb:'The cobra shrine', act:()=> pastSpot('shrine') },
    { ...PAST_AT.sign, html:()=> pastSignHtml(), cls:'past-sign', icon:'🪧', verb:'Signpost', act:()=> pastSpot('sign') },
    { ...PAST_AT.fire, html:()=> pastFireHtml(), cls:'past-fire', still:true, icon:'🔥', verb:'Campfire', act:()=> pastSpot('fire') },
    { ...PAST_AT.monk,  sprite:'tang_seng', icon:'🧘', verb:'Talk', sub:'The monk', act:()=> pastTalk('monk') },
    { ...PAST_AT.pig,   sprite:'pigsy', icon:'🐷', verb:'Talk', sub:'The pig', act:()=> pastTalk('pig'), faceR:true },
    { ...PAST_AT.sandy, sprite:'sandy', icon:'🧔', verb:'Talk', sub:'The quiet one', act:()=> pastTalk('sandy') },
    { ...PAST_AT.horse, sprite:'white_horse', icon:'🐴', verb:'Pat', sub:'The white horse', act:()=> pastTalk('horse') },
  ],
  nearActs:(d, p)=> pastNearActs(p),
  onStep:(p, d)=> pastStep(p, d),
  onRender:(world, d)=> pastRender(world, d),
};
if(typeof DECKS !== 'undefined') DECKS[PAST_KEY] = PAST_DECK;

/* ---------- in and out ---------- */
/* Through the ancient portal (the Rift's riftPortal), onto the Old Gate. */
function pastEnter(){
  if(!pastOpen()) return false;
  ui.walkFresh = true;
  ui.pastLion = null;
  goDeck(PAST_KEY);
  return true;
}
/* Back through it: the Rift, beside the ancient portal, where you left it. */
function pastHome(){
  if(ui.pastTalk) return;
  goDeck('r6_rift');
}

/* ---------- Lucesco, at your heels ----------
   He takes the square you leave — or, with Cuain behind you, the square
   Cuain leaves — so the three of you walk in a line. You can step through
   him, as through Cuain. */
function pastLionAt(){ return ui.pastLion || null; }
function pastLionPlace(){
  const el = document.getElementById('pastLion'), at = pastLionAt();
  if(!el || !at) return;
  el.style.transform = `translate3d(${at.x * WALK_T}px,${at.y * WALK_T}px,0)`;
  el.style.zIndex = 10 + at.y;
  faceRight(el, !!at.faceR);
}
function pastStep(p, d){
  const was = ui.pastTrail || [];
  /* the squares you have stood on, the newest last: [ …, two steps ago, one step ago, now ] */
  const trail = was.concat([{ x:p.x, y:p.y }]).slice(-3);
  ui.pastTrail = trail;
  const back = (typeof cuainAboard === 'function' && cuainAboard()) ? 3 : 2;
  const to = trail[trail.length - back];
  if(to){
    const at = pastLionAt();
    ui.pastLion = { x:to.x, y:to.y, faceR:at ? (to.x !== at.x ? to.x > at.x : at.faceR) : false };
    pastLionPlace();
  }
  return false;
}

/* ---------- the map, set out ---------- */
function pastRender(world, d){
  pastCss(); riftCss(); sceneCss();
  const w = walkState(), p = w.at && w.at[PAST_KEY];
  const T = WALK_T;
  /* the portal you came through, awake: the Rift's own, burning bright */
  const art = (cls, x, y, ww, hh, html, z)=>{
    const e = document.createElement('div');
    e.className = 'past-art ' + cls;
    e.style.cssText = `left:${x * T}px;top:${y * T}px;width:${ww * T}px;height:${hh * T}px;` + (z ? `z-index:${z};` : '');
    e.innerHTML = html;
    world.appendChild(e);
    return e;
  };
  /* (it stands up off the ground: whoever is behind it, north of it, is behind it) */
  const pt = PAST_AT.portal;
  art('rift-portal big past-portal', pt.x - 0.3, pt.y + pt.h - 3.6, 2.6, 3.6, riftPortalSvg(true), 10 + pt.y + pt.h - 1);
  /* the palace's eyes: a red fire that never quite goes out */
  const pal = PAST_AT.palace;
  art('past-eyes', pal.x - 2.55, 0.55, 1.3, 1.2, '<i></i>');
  art('past-eyes', pal.x + 3.25, 0.55, 1.3, 1.2, '<i></i>');
  /* Lucesco: where he was, or beside you as you arrive */
  if(!ui.pastLion && p){
    const free = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy])=> ({ x:p.x + dx, y:p.y + dy }))
      .find(q=> !wSolid(d, q.x, q.y) && !wBlockedBy(d, q.x, q.y));
    ui.pastLion = free ? { x:free.x, y:free.y, faceR:free.x < p.x } : { x:p.x, y:p.y, faceR:false };
  }
  if(p) ui.pastTrail = [{ x:p.x, y:p.y }];
  const lion = document.createElement('div');
  lion.className = 'walk-ent rift-lion past-lion';
  lion.id = 'pastLion';
  lion.innerHTML = riftLucescoImg(T);
  world.appendChild(lion);
  pastLionPlace();
  /* the first time through, Lucesco tells you where you are */
  const st = pastState();
  if(!st.seen && !ui.sceneRunning) setTimeout(()=>{ if(ui.screen === PAST_KEY) pastArrive(); }, 500);
}

/* ---------- words ---------- */
/* A window of words that closes itself if you leave the map meanwhile. */
function pastSay(faces, name, html){
  return new Promise(res=>{
    let done = false, t = null;
    const fin = ()=>{ if(done) return; done = true; clearInterval(t); res(); };
    t = setInterval(()=>{ if(ui.screen !== PAST_KEY){ document.querySelectorAll('.scene-say').forEach(b=> b.remove()); fin(); } }, 250);
    sceneSay(faces, name, html).then(fin);
  });
}
const pastLionFace = ()=> riftLucescoFace();
async function pastLines(faces, name, lines){
  if(ui.pastTalk) return;
  ui.pastTalk = true;
  try { for(const l of lines){ if(ui.screen !== PAST_KEY) break; await pastSay(faces, name, l); } }
  finally { ui.pastTalk = false; }
}
const PAST_ARRIVE = [
  `Warm wind, and sand — and a sky going orange. You are standing in a ring of old stones, and the portal hums behind you.`,
  `<b>"Rrrr. Welcome to the land of long ago — thousands of years before your time."</b>`,
  `<b>"Listen well. Time is like a tree, and the portal has brought us out on one of its branches — not your own. What we change here stays here: it cannot undo what Nemesis has done in your world."</b>`,
  `<b>"But a gift given here can come home with us. Remember that."</b>`,
  `He lifts his great head toward the north, where a ridge of white bone glows in the dusk.<br><br><b>"Up there lives the Bone Demon. It is alive — for now. Stay close to me."</b>`,
];
async function pastArrive(){
  const st = pastState();
  st.seen = true;
  saveProfile();
  await pastLines([pastLionFace()], 'Lucesco', PAST_ARRIVE);
}
const PAST_LION_LINES = [
  `<b>"The road runs north to White Bone Ridge. West is the Jackal's Valley; east, the Cobra's Oasis."</b>`,
  `<b>"Smell that? Smoke — a campfire, west of the road. Travellers."</b>`,
  `<b>"In this time the jackal and the cobra still have bodies of their own. In yours, they are pieces of Nemesis."</b>`,
  `<b>"Whatever we change here stays here. Your world will not feel it."</b>`,
  `<b>"When you want to go home, the portal is in the stone ring, to the south."</b>`,
];
const PAST_SPOTS = {
  palace:{ face:'lion', lines:[`A skull as big as a hill, cut into the ridge. Its mouth is the gate, and its eyes glow red.`,
                               `<b>"Not yet,"</b> Lucesco growls. <b>"Not until we know what waits inside."</b>`] },
  hall:{ face:'lion', lines:[`A temple front at the head of the valley, with a golden scale over its door. The door is shut, and bones are wrapped round its handles like chains.`,
                             `<b>"The jackal's hall. He weighs hearts here — or he did, before the Bone Demon came."</b>`] },
  shrine:{ face:'lion', lines:[`A cobra of green stone rears over the oasis, a sun behind its hood. Its eyes follow you.`,
                               `<b>"The cobra's shrine. She guards this water. Something has made her very, very quiet."</b>`] },
  sign:{ face:null, lines:[`A post with four arms, the paint long faded:<br><br>↑ <b>White Bone Ridge</b><br>← <b>The Jackal's Valley</b><br>→ <b>The Cobra's Oasis</b><br>↓ <b>The Old Gate</b>`] },
  fire:{ face:null, lines:[`A small fire of dry thorn branches, crackling. A pot of rice porridge bubbles over it.`] },
};
function pastSpot(key){
  const s = PAST_SPOTS[key];
  if(!s) return;
  if(s.face === 'lion') return pastLines([pastLionFace()], 'Lucesco', s.lines);
  return pastLines([], '', s.lines);
}
/* The pilgrims, for now: who they are. (Their part comes with the story.) */
const PAST_TALK = {
  monk:{ name:'The monk', icon:'🧘', sprite:'tang_seng', lines:[
    `A monk in a patched robe looks up from the fire and smiles.<br><br><b>"Peace, traveller. We are pilgrims, going west for the holy books. Sit, and be warm."</b>`,
    `<b>"My eldest disciple is not here. I… sent him away. I hope I was right."</b>` ] },
  pig:{ name:'The pig', icon:'🐷', sprite:'pigsy', lines:[
    `A big pig in a monk's robe is stirring the pot — and eating from it.<br><br><b>"You didn't bring any food? Then you're no use to me."</b>`,
    `<b>"Good riddance to that monkey, I say. More porridge for the rest of us."</b>` ] },
  sandy:{ name:'The quiet one', icon:'🧔', sprite:'sandy', lines:[
    `A tall, quiet man with a beard and a necklace of beads keeps watch at the edge of the firelight.<br><br><b>"The Master is tired. Let him rest."</b>`,
    `<b>"Strange things walk on this road at night. Stay near the fire."</b>` ] },
  horse:{ name:'The white horse', icon:'🐴', sprite:'white_horse', lines:[
    `A white horse, tied to a post. When you pat its neck it snorts — and for a moment you could swear its eyes flash like a dragon's.` ] },
};
function pastTalk(who){
  const t = PAST_TALK[who];
  if(!t) return;
  return pastLines([faceNpc(t.sprite, t.icon)], t.name, t.lines);
}
/* Lucesco, always beside you: a button of his own. */
function pastNearActs(p){
  return [{ key:'pastLion', html:`🦁 Talk<small>Lucesco</small>`, act:()=>{
    const s = pastState();
    s.lionTalk = ((s.lionTalk || 0) + 1);
    return pastLines([pastLionFace()], 'Lucesco', [PAST_LION_LINES[(s.lionTalk - 1) % PAST_LION_LINES.length]]);
  } }];
}

/* ---------- small pictures ---------- */
function pastSignHtml(){
  return `<svg viewBox="0 0 40 48" aria-hidden="true" style="width:100%;height:150%;transform:translateY(-34%);overflow:visible">` +
    `<ellipse cx="22" cy="46" rx="11" ry="3" fill="rgba(60,40,20,.35)"/>` +
    `<rect x="18" y="8" width="4" height="38" rx="1" fill="#6b4a2a"/>` +
    `<path d="M21 10 h14 l4 4 l-4 4 h-14 z" fill="#b58a52" stroke="#5a3d20" stroke-width="1"/>` +
    `<path d="M19 20 h-14 l-4 4 l4 4 h14 z" fill="#a67c47" stroke="#5a3d20" stroke-width="1"/>` +
    `<path d="M21 30 h12 l3 3 l-3 3 h-12 z" fill="#b58a52" stroke="#5a3d20" stroke-width="1"/></svg>`;
}
function pastFireHtml(){
  return `<span class="pf-logs"></span><span class="pf-flame a"></span><span class="pf-flame b"></span><span class="pf-flame c"></span><span class="pf-glow"></span>`;
}

/* ---------- its backdrop: a dusk sky, until there is a painting (past.png) ---------- */
let _pastSky = null;
function pastSkyUri(){
  if(_pastSky) return _pastSky;
  try {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#2b1d3f'); gr.addColorStop(0.45, '#7a3d4f'); gr.addColorStop(0.75, '#d9774a'); gr.addColorStop(1, '#f2b35e');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    _pastSky = c.toDataURL('image/png');
  } catch(e){ _pastSky = ''; }
  return _pastSky;
}

let _pastCss = false;
function pastCss(){
  if(_pastCss) return; _pastCss = true;
  const s = document.createElement('style');
  s.textContent = `
  .past-art{ position:absolute; pointer-events:none; z-index:5; }
  .past-art > svg{ width:100%; height:100%; display:block; overflow:visible; }
  .past-portal .rp-swirl{ opacity:.85 !important; animation-duration:9s !important; }
  .past-portal .rp-sleep{ animation:none !important; opacity:1 !important; }
  .past-portal{ filter:drop-shadow(0 0 10px rgba(255,190,90,.65)); }
  .past-eyes i{ position:absolute; inset:0; border-radius:50%;
    background:radial-gradient(circle, rgba(255,120,70,.75) 0, rgba(255,50,20,.25) 45%, rgba(255,30,10,0) 70%);
    animation:pastEyes 3.6s ease-in-out infinite; }
  @keyframes pastEyes{ 0%,100%{ opacity:.45; transform:scale(.9); } 50%{ opacity:1; transform:scale(1.08); } }
  .walk-ent.past-lion{ transition:transform .2s linear; }
  .walk-ent.past-lion::before{ content:''; position:absolute; left:6%; right:6%; bottom:-6%; height:26%;
    border-radius:50%; background:radial-gradient(ellipse at center, rgba(40,20,5,.45), rgba(40,20,5,0) 70%); }
  .walk-ent.past-sign{ overflow:visible; }
  .walk-ent.past-fire{ overflow:visible; }
  .past-fire .pf-logs{ position:absolute; left:18%; right:18%; bottom:14%; height:18%; border-radius:4px;
    background:linear-gradient(90deg,#5a3a1e,#7a5030 50%,#5a3a1e); transform:rotate(-8deg); }
  .past-fire .pf-flame{ position:absolute; left:50%; bottom:24%; width:44%; height:62%; margin-left:-22%;
    border-radius:50% 50% 45% 45% / 60% 60% 40% 40%; transform-origin:50% 100%;
    background:radial-gradient(ellipse at 50% 80%, #fff3b0 0, #ffb347 40%, #ff6a2a 70%, rgba(255,80,20,0) 100%);
    animation:pastFlame 0.9s ease-in-out infinite alternate; }
  .past-fire .pf-flame.b{ width:30%; margin-left:-24%; height:46%; animation-duration:1.15s; animation-delay:-.3s; }
  .past-fire .pf-flame.c{ width:28%; margin-left:-2%; height:42%; animation-duration:.8s; animation-delay:-.5s; }
  .past-fire .pf-glow{ position:absolute; left:-60%; right:-60%; top:-60%; bottom:-60%; border-radius:50%; pointer-events:none;
    background:radial-gradient(circle, rgba(255,170,80,.30) 0, rgba(255,140,60,.12) 40%, rgba(255,120,40,0) 70%);
    animation:pastGlow 1.8s ease-in-out infinite alternate; }
  @keyframes pastFlame{ 0%{ transform:scaleY(.86) skewX(-4deg); } 100%{ transform:scaleY(1.08) skewX(5deg); } }
  @keyframes pastGlow{ 0%{ opacity:.7; } 100%{ opacity:1; } }
  @media (prefers-reduced-motion: reduce){ .past-fire .pf-flame, .past-fire .pf-glow, .past-eyes i{ animation:none; } }
  `;
  document.head.appendChild(s);
}
/* The past's painting, drawn from its grid (32 px a tile) — a desert at
   dusk under White Bone Ridge. Kept apart so it can be tried alone. */
const PAST_PX = 32;
const _pastArt = {};
function pastPaint(d){
  if(_pastArt[d.key]) return _pastArt[d.key];
  const rows = d.rows, W = rows[0].length, H = rows.length, P = PAST_PX;
  const c = document.createElement('canvas');
  c.width = W * P; c.height = H * P;
  const g = c.getContext('2d');
  if(!g) return '';
  const rnd = (x, y, k)=>{ const s = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const at = (x, y)=> (y < 0 || y >= H || x < 0 || x >= W) ? '#' : rows[y][x];
  const GROUND = '.,:;e=da';
  const ground = ch=> GROUND.includes(ch);
  /* what lies under a thing that stands on the ground: sand, or what is round it */
  const UNDER = { K:'x', H:'w' };
  const under = (x, y)=>{
    const n = [at(x, y - 1), at(x - 1, y), at(x + 1, y), at(x, y + 1)].filter(ground);
    if(n.includes('d')) return 'd';
    if(n.includes('a')) return 'a';
    if(n.includes(';')) return ';';
    if(n.includes(':')) return ':';
    if(n.includes('e')) return 'e';
    return '.';
  };
  const circle = (x, y, r, fill)=>{ g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const ellipse = (x, y, rx, ry, fill, rot)=>{ g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); };

  /* ---------- the ground ---------- */
  const sand = (x, y)=>{
    const X = x * P, Y = y * P, v = rnd(x, y, 1);
    g.fillStyle = `rgb(${214 + v * 10 | 0},${176 + v * 9 | 0},${116 + v * 8 | 0})`;
    g.fillRect(X, Y, P, P);
    /* wind ripples: soft arcs, all leaning the same way */
    g.strokeStyle = 'rgba(150,100,50,0.22)'; g.lineWidth = 1.4;
    for(let k = 0; k < 3; k++){
      const yy = Y + 6 + k * 10 + rnd(x, y, k + 2) * 4;
      g.beginPath(); g.moveTo(X - 2, yy + 2); g.quadraticCurveTo(X + P / 2, yy - 3, X + P + 2, yy + 2); g.stroke();
    }
    g.fillStyle = 'rgba(120,80,40,0.25)';
    for(let k = 0; k < 4; k++) g.fillRect(X + rnd(x, y, k + 9) * P, Y + rnd(x, y, k + 13) * P, 1.5, 1.5);
  };
  const road = (x, y)=>{
    const X = x * P, Y = y * P, v = rnd(x, y, 3);
    g.fillStyle = `rgb(${200 + v * 8 | 0},${163 + v * 8 | 0},${108 + v * 6 | 0})`;
    g.fillRect(X, Y, P, P);
    const R = (dx, dy)=> ',a'.includes(at(x + dx, y + dy));
    const vert = (R(0, -1) && R(0, 1)) || (!(R(-1, 0) && R(1, 0)) && (R(0, -1) || R(0, 1)));
    g.fillStyle = 'rgba(110,75,40,0.22)';
    if(vert){
      /* the road is two tiles wide: one rut on each */
      const left = at(x + 1, y) === ',';
      g.fillRect(X + (left ? P - 9 : 6), Y, 3, P);
    } else { g.fillRect(X, Y + 9, P, 2); g.fillRect(X, Y + P - 11, P, 2); }
    g.fillStyle = 'rgba(90,60,30,0.3)';
    for(let k = 0; k < 3; k++) circle(X + rnd(x, y, k + 4) * P, Y + rnd(x, y, k + 7) * P, 1.4, g.fillStyle);
  };
  const paving = (x, y)=>{
    const X = x * P, Y = y * P;
    for(let j = 0; j < 2; j++) for(let i = 0; i < 2; i++){
      const t = rnd(x * 2 + i, y * 2 + j, 5);
      g.fillStyle = `rgb(${196 + t * 22 | 0},${168 + t * 18 | 0},${122 + t * 14 | 0})`;
      g.fillRect(X + i * 16, Y + j * 16, 16, 16);
    }
    g.strokeStyle = 'rgba(95,70,40,0.45)'; g.lineWidth = 1;
    g.strokeRect(X + 0.5, Y + 0.5, 15, 15); g.strokeRect(X + 16.5, Y + 0.5, 15, 15);
    g.strokeRect(X + 0.5, Y + 16.5, 15, 15); g.strokeRect(X + 16.5, Y + 16.5, 15, 15);
    /* sand blown over the old stones */
    if(rnd(x, y, 6) < 0.45){ g.fillStyle = 'rgba(220,182,120,0.55)'; ellipse(X + rnd(x, y, 7) * P, Y + rnd(x, y, 8) * P, 9, 4, g.fillStyle); }
  };
  const grass = (x, y)=>{
    const X = x * P, Y = y * P, v = rnd(x, y, 11);
    const wet = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].includes('~');
    g.fillStyle = wet ? `rgb(${92 + v * 12 | 0},${150 + v * 14 | 0},${70 + v * 10 | 0})` : `rgb(${128 + v * 14 | 0},${160 + v * 12 | 0},${76 + v * 10 | 0})`;
    g.fillRect(X, Y, P, P);
    for(let k = 0; k < 6; k++){
      const tx = X + rnd(x, y, k + 20) * P, ty = Y + rnd(x, y, k + 30) * P;
      g.strokeStyle = k % 2 ? 'rgba(60,100,30,0.55)' : 'rgba(190,210,110,0.5)'; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(tx, ty + 4); g.lineTo(tx - 2, ty - 2); g.moveTo(tx, ty + 4); g.lineTo(tx + 2, ty - 3); g.stroke();
    }
  };
  const boneDust = (x, y)=>{
    const X = x * P, Y = y * P, v = rnd(x, y, 12);
    g.fillStyle = `rgb(${206 + v * 12 | 0},${198 + v * 12 | 0},${182 + v * 10 | 0})`;
    g.fillRect(X, Y, P, P);
    g.fillStyle = 'rgba(120,110,95,0.35)';
    for(let k = 0; k < 5; k++) circle(X + rnd(x, y, k + 40) * P, Y + rnd(x, y, k + 45) * P, 1.3, g.fillStyle);
    if(rnd(x, y, 13) < 0.35){                     // a little bone in the dust
      const bx = X + 6 + rnd(x, y, 14) * (P - 12), by = Y + 6 + rnd(x, y, 15) * (P - 12), a = rnd(x, y, 16) * Math.PI;
      g.save(); g.translate(bx, by); g.rotate(a);
      g.fillStyle = '#f4efe2'; g.fillRect(-5, -1, 10, 2);
      circle(-5, -1.2, 1.6, '#f4efe2'); circle(-5, 1.2, 1.6, '#f4efe2'); circle(5, -1.2, 1.6, '#f4efe2'); circle(5, 1.2, 1.6, '#f4efe2');
      g.restore();
    }
  };
  const steps = (x, y)=>{
    const X = x * P, Y = y * P;
    g.fillStyle = '#cfc6b2'; g.fillRect(X, Y, P, P);
    for(let k = 0; k < 4; k++){
      g.fillStyle = '#e6dfcf'; g.fillRect(X, Y + k * 8, P, 3);
      g.fillStyle = 'rgba(80,70,55,0.35)'; g.fillRect(X, Y + k * 8 + 6, P, 2);
    }
  };
  const earth = (x, y, marksOnly)=>{
    const X = x * P, Y = y * P, v = rnd(x, y, 21);
    if(!marksOnly){ g.fillStyle = `rgb(${186 + v * 10 | 0},${150 + v * 8 | 0},${102 + v * 6 | 0})`; g.fillRect(X, Y, P, P); }
    g.fillStyle = 'rgba(95,65,35,0.3)';                       // footprints, coming and going
    for(let k = 0; k < 3; k++){
      const fx = X + 4 + rnd(x, y, k + 22) * (P - 8), fy = Y + 4 + rnd(x, y, k + 25) * (P - 8);
      ellipse(fx, fy, 1.6, 2.6, g.fillStyle, rnd(x, y, k + 28)); ellipse(fx + 4, fy + 3, 1.6, 2.6, g.fillStyle, rnd(x, y, k + 28));
    }
  };
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    let ch = at(x, y);
    if(UNDER[ch]) continue;
    if(!ground(ch)) ch = under(x, y);
    if(ch === 'a'){ sand(x, y); continue; }
    if(ch === 'd'){ sand(x, y); continue; }
    if(ch === '.') sand(x, y);
    else if(ch === ',') road(x, y);
    else if(ch === ':') paving(x, y);
    else if(ch === ';') grass(x, y);
    else if(ch === 'e') boneDust(x, y);
    else if(ch === '=') steps(x, y);
  }
  /* the camp's trodden earth, one soft patch */
  {
    const pts = [];
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(at(x, y) === 'd') pts.push([x, y]);
    if(pts.length){
      g.fillStyle = 'rgb(190,152,104)'; g.beginPath();
      pts.forEach(([x, y])=>{ const cx = x * P + P / 2, cy = y * P + P / 2, r = P * 0.78; g.moveTo(cx + r, cy); g.arc(cx, cy, r, 0, Math.PI * 2); });
      g.fill();
      pts.forEach(([x, y])=> earth(x, y, true));
    }
  }
  /* the grass's edge, softened into the sand */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    if(at(x, y) !== '.') continue;
    const n = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy])=> at(x + dx, y + dy) === ';');
    n.forEach(([dx, dy])=>{
      const X = x * P + (dx > 0 ? P - 6 : 0), Y = y * P + (dy > 0 ? P - 6 : 0);
      g.fillStyle = 'rgba(140,165,80,0.45)';
      g.fillRect(X, Y, dx ? 6 : P, dy ? 6 : P);
    });
  }

  /* ---------- the dunes: each one whole ---------- */
  const seen = new Set();
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    if(at(x, y) !== 'D' || seen.has(x + ',' + y)) continue;
    const cells = [], st = [[x, y]]; seen.add(x + ',' + y);
    while(st.length){
      const [cx, cy] = st.pop(); cells.push([cx, cy]);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=>{
        const k = (cx + dx) + ',' + (cy + dy);
        if(at(cx + dx, cy + dy) === 'D' && !seen.has(k)){ seen.add(k); st.push([cx + dx, cy + dy]); }
      });
    }
    const xs = cells.map(c=> c[0]), ys = cells.map(c=> c[1]);
    const x0 = Math.min(...xs) * P, x1 = (Math.max(...xs) + 1) * P, y0 = Math.min(...ys) * P, y1 = (Math.max(...ys) + 1) * P;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 + 3, ry = (y1 - y0) / 2 + 3;
    ellipse(cx + 6, cy + 7, rx, ry, 'rgba(120,80,40,0.28)');            // its shadow
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, '#f0d49e'); gr.addColorStop(0.45, '#deb579'); gr.addColorStop(1, '#b98a52');
    ellipse(cx, cy, rx, ry, gr);
    /* the crest: a bright curve along the top, and the shady side below it */
    g.strokeStyle = 'rgba(255,240,205,0.75)'; g.lineWidth = 2.2;
    g.beginPath(); g.ellipse(cx, cy + ry * 0.15, rx * 0.86, ry * 0.7, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.strokeStyle = 'rgba(140,95,50,0.35)'; g.lineWidth = 1.2;
    for(let k = 1; k <= 3; k++){ g.beginPath(); g.ellipse(cx + k * 2, cy + ry * 0.25 + k * 3, rx * (0.8 - k * 0.12), ry * (0.5 - k * 0.08), 0, 0.15, Math.PI - 0.15); g.stroke(); }
  }

  /* ---------- the rock, the walls, the cliffs ---------- */
  /* how far each square of cliff is from somewhere you can stand */
  const deep = [];
  {
    const q = [];
    for(let y = 0; y < H; y++){ deep.push(new Array(W).fill(99)); }
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(ground(at(x, y))){ deep[y][x] = 0; q.push([x, y]); }
    for(let i = 0; i < q.length; i++){
      const [x, y] = q[i];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=>{
        const nx = x + dx, ny = y + dy;
        if(nx < 0 || ny < 0 || nx >= W || ny >= H || deep[ny][nx] <= deep[y][x] + 1) return;
        deep[ny][nx] = deep[y][x] + 1; q.push([nx, ny]);
      });
    }
  }
  const openNear = (x, y)=> [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy])=> ground(at(x + dx, y + dy)) || at(x + dx, y + dy) === 'D');
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const ch = at(x, y), X = x * P, Y = y * P;
    if(ch === '#'){                                            // sandstone, in layers — its open corners worn round
      const edge = openNear(x, y);
      const rock = c=> c === '#' || c === 'x' || c === 'w';
      const n = !rock(at(x, y - 1)), s = !rock(at(x, y + 1)), wv = !rock(at(x - 1, y)), e = !rock(at(x + 1, y));
      const R = 11, r = [n && wv ? R : 0, n && e ? R : 0, s && e ? R : 0, s && wv ? R : 0];
      if(r.some(Boolean)) sand(x, y);                          // the sand shows where a corner is worn away
      g.fillStyle = edge ? '#b5743f' : '#9a5f34';
      g.beginPath();
      g.moveTo(X + r[0], Y); g.lineTo(X + P - r[1], Y); g.arcTo(X + P, Y, X + P, Y + r[1], r[1]);
      g.lineTo(X + P, Y + P - r[2]); g.arcTo(X + P, Y + P, X + P - r[2], Y + P, r[2]);
      g.lineTo(X + r[3], Y + P); g.arcTo(X, Y + P, X, Y + P - r[3], r[3]);
      g.lineTo(X, Y + r[0]); g.arcTo(X, Y, X + r[0], Y, r[0]);
      g.closePath(); g.fill();
      g.save(); g.clip();
      g.fillStyle = 'rgba(70,35,15,0.28)';
      for(let k = 0; k < 3; k++) g.fillRect(X, Y + 5 + k * 10 + rnd(x, y, k) * 3, P, 2);
      g.fillStyle = 'rgba(255,200,140,0.18)'; g.fillRect(X, Y, P, 3);
      if(s){ g.fillStyle = 'rgba(60,30,10,0.35)'; g.fillRect(X, Y + P - 5, P, 5); }
      g.restore();
    } else if(ch === 'x' || ch === 'K'){                       // White Bone Ridge: old bone, ribbed and cracked
      const v = rnd(x, y, 17), dk = Math.min(4, deep[y][x]) / 4;
      g.fillStyle = `rgb(${226 - dk * 46 + v * 10 | 0},${219 - dk * 50 + v * 10 | 0},${200 - dk * 34 + v * 10 | 0})`; g.fillRect(X, Y, P, P);
      g.strokeStyle = 'rgba(150,138,115,0.55)'; g.lineWidth = 2;
      for(let k = 0; k < 2; k++){
        const yy = Y + 8 + k * 14 + rnd(x, y, k + 18) * 4;
        g.beginPath(); g.moveTo(X - 1, yy); g.quadraticCurveTo(X + P / 2, yy - 6, X + P + 1, yy); g.stroke();
      }
      if(rnd(x, y, 19) < 0.3){ g.strokeStyle = 'rgba(70,60,50,0.5)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(X + 8, Y + 4); g.lineTo(X + 13, Y + 14); g.lineTo(X + 10, Y + 22); g.stroke(); }
      /* a cliff face drops to the path below it: a shadow, then the drop */
      if(ground(at(x, y + 1))){
        g.fillStyle = '#b8ae98'; g.fillRect(X, Y + P - 10, P, 10);
        g.fillStyle = 'rgba(60,50,40,0.35)'; g.fillRect(X, Y + P - 3, P, 3);
      }
      if(ground(at(x, y - 1))){ g.fillStyle = 'rgba(255,255,245,0.6)'; g.fillRect(X, Y, P, 3); }
    } else if(ch === 'w'){                                     // a tomb's wall: cut sandstone
      g.fillStyle = '#bf9259'; g.fillRect(X, Y, P, P);
      g.strokeStyle = 'rgba(100,65,30,0.55)'; g.lineWidth = 1;
      for(let k = 0; k < 4; k++){
        const yy = Y + k * 8 + 0.5;
        g.beginPath(); g.moveTo(X, yy); g.lineTo(X + P, yy); g.stroke();
        const off = (k + y) % 2 ? 8 : 0;
        for(let j = off; j < P; j += 16){ g.beginPath(); g.moveTo(X + j + 0.5, yy); g.lineTo(X + j + 0.5, yy + 8); g.stroke(); }
      }
      if(ground(at(x, y + 1))){ g.fillStyle = 'rgba(70,40,15,0.4)'; g.fillRect(X, Y + P - 4, P, 4); }
      if(!['w', 'H'].includes(at(x, y - 1))){ g.fillStyle = '#e0b878'; g.fillRect(X, Y, P, 4); }
      /* facing the avenue: every few squares, a tomb's dark doorway, and a band of old pictures */
      const facesE = at(x + 1, y) === ':', facesW = at(x - 1, y) === ':';
      if((facesE || facesW) && y % 4 === 1){
        const dx0 = facesE ? X + P - 12 : X + 2;
        g.fillStyle = '#2a1c12'; g.fillRect(dx0, Y + 6, 10, P - 8);
        g.fillStyle = '#e3bf82'; g.fillRect(dx0 - 2, Y + 4, 14, 3);
      } else if(facesE || facesW){
        g.fillStyle = 'rgba(60,90,120,0.55)'; g.fillRect(facesE ? X + P - 8 : X + 2, Y + 10, 6, 12);
        g.fillStyle = 'rgba(170,60,40,0.55)'; g.fillRect(facesE ? X + P - 7 : X + 3, Y + 13, 4, 2);
        g.fillStyle = 'rgba(40,30,20,0.5)'; g.fillRect(facesE ? X + P - 7 : X + 3, Y + 17, 4, 2);
      }
    }
  }

  /* ---------- the ridge's bones: great ribs half sunk in it, and a skull or two ---------- */
  {
    const rib = (x0, y0, len, up, k)=>{
      const X = x0 * P, Y = y0 * P, L = len * P;
      g.lineCap = 'round';
      g.strokeStyle = 'rgba(90,78,62,0.55)'; g.lineWidth = 11;
      g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(X + L / 2, Y - up * P, X + L, Y + 0.2 * P); g.stroke();
      g.strokeStyle = '#efe8d8'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(X + L / 2, Y - up * P, X + L, Y + 0.2 * P); g.stroke();
      g.strokeStyle = 'rgba(255,255,250,0.7)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(X + 2, Y - 2); g.quadraticCurveTo(X + L / 2, Y - up * P - 2, X + L - 2, Y + 0.2 * P - 2); g.stroke();
      g.lineCap = 'butt';
    };
    let n = 0;
    for(let y = 1; y < H; y += 3) for(let x = 1; x < W - 3; x += 5){
      const ok = [0, 1, 2, 3].every(i=> at(x + i, y) === 'x' && deep[y][x + i] >= 2);
      if(!ok || rnd(x, y, 120) < 0.35) continue;
      rib(x + rnd(x, y, 121), y + 0.6 + rnd(x, y, 122) * 0.5, 2.6 + rnd(x, y, 123) * 1.2, 0.5 + rnd(x, y, 124) * 0.5, n++);
    }
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
      if(at(x, y) !== 'x' || deep[y][x] < 2 || rnd(x, y, 130) > 0.035) continue;
      const cx = x * P + P / 2, cy = y * P + P / 2;
      circle(cx, cy, 9, '#f2ecdc'); g.fillStyle = '#f2ecdc'; g.fillRect(cx - 5, cy + 4, 10, 6);
      circle(cx - 3.5, cy - 1, 2.6, '#2e2620'); circle(cx + 3.5, cy - 1, 2.6, '#2e2620');
      g.fillStyle = '#2e2620'; g.fillRect(cx - 1, cy + 3, 2, 2);
    }
  }
  /* ---------- the Old Gate: a round platform of carved stone ---------- */
  {
    const pts = [];
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(at(x, y) === 'a') pts.push([x * P + P / 2, y * P + P / 2]);
    if(pts.length){
      const cx = pts.reduce((s, q)=> s + q[0], 0) / pts.length, cy = pts.reduce((s, q)=> s + q[1], 0) / pts.length;
      const R = Math.max(...pts.map(([px, py])=> Math.hypot(px - cx, py - cy))) + P * 0.35;
      circle(cx + 6, cy + 8, R, 'rgba(90,60,30,0.3)');
      circle(cx, cy, R, '#9a9285');
      circle(cx, cy, R - 6, '#b9b1a1');
      g.strokeStyle = 'rgba(80,72,60,0.55)'; g.lineWidth = 1.2;
      for(let k = 0; k < 16; k++){                 // its paving, in rings of wedges
        const a = k / 16 * Math.PI * 2;
        g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.42, cy + Math.sin(a) * R * 0.42); g.lineTo(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)); g.stroke();
      }
      [0.42, 0.7].forEach(f=>{ g.beginPath(); g.arc(cx, cy, R * f, 0, Math.PI * 2); g.stroke(); });
      g.strokeStyle = 'rgba(230,190,90,0.55)'; g.lineWidth = 2;   // a ring of old runes, worn gold
      g.beginPath(); g.arc(cx, cy, R * 0.56, 0, Math.PI * 2); g.stroke();
      for(let k = 0; k < 24; k++){
        const a = k / 24 * Math.PI * 2, r0 = R * 0.5, r1 = R * 0.62;
        g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a + 0.06) * r1, cy + Math.sin(a + 0.06) * r1); g.stroke();
      }
      /* sand drifted over its edge */
      for(let k = 0; k < 7; k++){ const a = rnd(k, 3, 140) * Math.PI * 2; ellipse(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9, 16, 7, 'rgba(218,180,120,0.75)', a); }
    }
  }

  /* ---------- things standing on the ground ---------- */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const ch = at(x, y), X = x * P, Y = y * P, cx = X + P / 2, cy = Y + P / 2;
    if(ch === 'o'){                                            // a boulder
      ellipse(cx + 3, cy + 6, 13, 7, 'rgba(90,55,25,0.35)');
      circle(cx, cy + 1, 12, '#9b7651'); circle(cx - 3, cy - 2, 8, '#b48c63'); circle(cx - 5, cy - 5, 3, 'rgba(255,230,190,0.5)');
    } else if(ch === 'c'){                                     // dry scrub
      ellipse(cx + 2, cy + 7, 11, 5, 'rgba(90,60,25,0.3)');
      for(let k = 0; k < 7; k++){
        const a = -Math.PI / 2 + (k - 3) * 0.38, L = 10 + rnd(x, y, k + 50) * 6;
        g.strokeStyle = k % 2 ? '#6c6a3c' : '#8a8048'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(cx, cy + 8); g.lineTo(cx + Math.cos(a) * L, cy + 8 + Math.sin(a) * L); g.stroke();
      }
    } else if(ch === 'b'){                                     // a heap of old bones
      ellipse(cx + 2, cy + 6, 12, 5, 'rgba(70,55,35,0.3)');
      for(let k = 0; k < 4; k++){
        const a = rnd(x, y, k + 60) * Math.PI, bx = cx - 7 + rnd(x, y, k + 64) * 14, by = cy - 2 + rnd(x, y, k + 68) * 9;
        g.save(); g.translate(bx, by); g.rotate(a);
        g.fillStyle = '#efe8d6'; g.fillRect(-6, -1.5, 12, 3);
        circle(-6, -1.6, 2, '#efe8d6'); circle(-6, 1.6, 2, '#efe8d6'); circle(6, -1.6, 2, '#efe8d6'); circle(6, 1.6, 2, '#efe8d6');
        g.restore();
      }
      circle(cx + 4, cy - 4, 6, '#f2ecdc');                    // and a skull
      circle(cx + 2, cy - 5, 1.6, '#3b3128'); circle(cx + 6, cy - 5, 1.6, '#3b3128');
      g.fillStyle = '#f2ecdc'; g.fillRect(cx + 1, cy - 1, 6, 4);
    } else if(ch === 'k'){                                     // a standing stone
      ellipse(cx + 7, cy + 11, 12, 5, 'rgba(60,40,20,0.35)');
      const top = cy - 30 - rnd(x, y, 141) * 6;
      g.fillStyle = '#86817a'; g.beginPath();
      g.moveTo(cx - 9, cy + 12); g.lineTo(cx - 8, top + 6); g.lineTo(cx - 2, top); g.lineTo(cx + 8, top + 5); g.lineTo(cx + 9, cy + 12); g.closePath(); g.fill();
      g.fillStyle = '#a7a297'; g.beginPath();
      g.moveTo(cx - 8, cy + 11); g.lineTo(cx - 7, top + 6); g.lineTo(cx - 2, top + 1); g.lineTo(cx, cy + 11); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(235,200,110,0.6)'; g.lineWidth = 1.3;     // old runes, worn gold
      g.beginPath(); g.moveTo(cx + 2, top + 12); g.lineTo(cx + 5, top + 17); g.lineTo(cx + 2, top + 22);
      g.moveTo(cx + 2, top + 28); g.lineTo(cx + 6, top + 28); g.moveTo(cx + 4, top + 26); g.lineTo(cx + 4, top + 31); g.stroke();
    } else if(ch === 'S'){                                     // a jackal statue on its plinth
      ellipse(cx + 3, cy + 11, 12, 4, 'rgba(60,40,20,0.35)');
      g.fillStyle = '#8c6a44'; g.fillRect(X + 4, Y + 18, P - 8, 12);
      g.fillStyle = '#a7835a'; g.fillRect(X + 4, Y + 18, P - 8, 3);
      /* sitting, ears up, looking out over the avenue (the east side's look west) */
      const s = at(x + 1, y) === ':' ? 1 : -1, T = Y - 14;
      g.save(); g.translate(cx, 0); g.scale(s, 1);
      g.fillStyle = '#2b2622';
      g.beginPath();
      g.moveTo(-9, Y + 19); g.lineTo(-8, T + 22); g.quadraticCurveTo(-7, T + 12, -2, T + 10);
      g.lineTo(-3, T); g.lineTo(0, T + 6); g.lineTo(2, T); g.lineTo(3, T + 8);
      g.lineTo(11, T + 12); g.lineTo(3, T + 15); g.quadraticCurveTo(6, T + 24, 8, Y + 19); g.closePath(); g.fill();
      g.fillStyle = '#d6a73f'; g.fillRect(-5, T + 16, 9, 2.4);           // its golden collar
      circle(2, T + 9, 1, '#f3d36b');
      g.restore();
    } else if(ch === 'P'){                                     // a date palm (drawn last, below, over its neighbours)
    } else if(ch === 'r'){                                     // reeds
      for(let k = 0; k < 8; k++){
        const rx = X + 4 + rnd(x, y, k + 80) * (P - 8), h = 14 + rnd(x, y, k + 90) * 10;
        g.strokeStyle = k % 3 ? '#4f7d34' : '#6f9a3e'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(rx, Y + P - 4); g.lineTo(rx + (rnd(x, y, k + 95) - 0.5) * 6, Y + P - 4 - h); g.stroke();
        if(k % 3 === 0) ellipse(rx + 1, Y + P - 4 - h, 1.6, 4, '#7a5530');
      }
    } else if(ch === 't'){                                     // a pilgrim's tent
      ellipse(cx + 5, cy + 11, 16, 5, 'rgba(70,45,20,0.35)');
      g.fillStyle = '#e9dcc0'; g.beginPath(); g.moveTo(cx, Y + 1); g.lineTo(X + P + 2, Y + P - 3); g.lineTo(X - 2, Y + P - 3); g.closePath(); g.fill();
      g.fillStyle = '#cdbb98'; g.beginPath(); g.moveTo(cx, Y + 1); g.lineTo(X + P + 2, Y + P - 3); g.lineTo(cx + 2, Y + P - 3); g.closePath(); g.fill();
      g.fillStyle = '#b5493a'; g.fillRect(X + 4, Y + P - 9, P - 8, 3);
      g.fillStyle = '#3d2c22'; g.beginPath(); g.moveTo(cx, Y + 12); g.lineTo(cx + 5, Y + P - 3); g.lineTo(cx - 5, Y + P - 3); g.closePath(); g.fill();
    }
  }
  /* the pool: a bank of wet sand, then the water — each the union of a circle on every square */
  {
    const wet = [];
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(at(x, y) === '~') wet.push([x * P + P / 2, y * P + P / 2]);
    if(wet.length){
      const blob = (r, fill)=>{ g.fillStyle = fill; g.beginPath(); wet.forEach(([cx, cy])=>{ g.moveTo(cx + r, cy); g.arc(cx, cy, r, 0, Math.PI * 2); }); g.fill(); };
      const mx = wet.reduce((s, q)=> s + q[0], 0) / wet.length, my = wet.reduce((s, q)=> s + q[1], 0) / wet.length;
      const far = Math.max(...wet.map(([px, py])=> Math.hypot(px - mx, py - my))) + P;
      const deepG = g.createRadialGradient(mx, my, P * 0.5, mx, my, far);
      deepG.addColorStop(0, '#1f6570'); deepG.addColorStop(0.65, '#2b7c84'); deepG.addColorStop(1, '#4aa3a0');
      blob(P * 0.9, '#a59466');
      blob(P * 0.8, 'rgba(225,245,235,0.55)');
      blob(P * 0.74, deepG);
      g.strokeStyle = 'rgba(210,250,245,0.35)'; g.lineWidth = 1.2;
      wet.forEach(([cx, cy], i)=>{ if(i % 2) return; const r = rnd(cx, cy, 3); g.beginPath(); g.moveTo(cx - 8 + r * 4, cy - 4 + r * 8); g.lineTo(cx + 6 + r * 4, cy - 4 + r * 8); g.stroke(); });
    }
  }
  /* palms last: their crowns spread over the squares round them */
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    if(at(x, y) !== 'P') continue;
    const X = x * P, cx = X + P / 2, by = y * P + P - 4, lean = (rnd(x, y, 100) - 0.5) * 10;
    ellipse(cx + 10, by + 1, 16, 6, 'rgba(40,60,20,0.35)');
    g.strokeStyle = '#7b5a36'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, by); g.quadraticCurveTo(cx + lean, by - 14, cx + lean * 0.6, by - 26); g.stroke();
    g.strokeStyle = 'rgba(60,40,20,0.5)'; g.lineWidth = 1;
    for(let k = 0; k < 5; k++){ g.beginPath(); g.moveTo(cx - 2 + lean * k / 8, by - 4 - k * 5); g.lineTo(cx + 2 + lean * k / 8, by - 5 - k * 5); g.stroke(); }
    const tx = cx + lean * 0.6, ty = by - 27;
    for(let k = 0; k < 8; k++){
      const a = k / 8 * Math.PI * 2 + rnd(x, y, 101) * 0.6;
      g.strokeStyle = k % 2 ? '#3f7a32' : '#5a9a3f'; g.lineWidth = 3.4;
      g.beginPath(); g.moveTo(tx, ty);
      g.quadraticCurveTo(tx + Math.cos(a) * 10, ty + Math.sin(a) * 10 - 5, tx + Math.cos(a) * 17, ty + Math.sin(a) * 15 + 3); g.stroke();
    }
    circle(tx, ty + 2, 3, '#8a5a2a'); circle(tx + 3, ty + 3, 2.4, '#a46b30');
    g.lineCap = 'butt';
  }

  /* ---------- the set pieces ---------- */
  const box = ch=>{
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(rows[y][x] === ch){ x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return x1 < 0 ? null : { X:x0 * P, Y:y0 * P, w:(x1 - x0 + 1) * P, h:(y1 - y0 + 1) * P };
  };
  /* The Bone Palace: a skull as big as a hill, cut into the ridge */
  const K = box('K');
  if(K){
    const cx = K.X + K.w / 2, top = K.Y - P * 0.6, bot = K.Y + K.h;
    const gr = g.createLinearGradient(0, top, 0, bot);
    gr.addColorStop(0, '#fbf7ec'); gr.addColorStop(1, '#d9d0bb');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(K.X - 6, bot); g.lineTo(K.X - 2, K.Y + K.h * 0.35);
    g.bezierCurveTo(K.X + 4, top - 10, K.X + K.w - 4, top - 10, K.X + K.w + 2, K.Y + K.h * 0.35);
    g.lineTo(K.X + K.w + 6, bot); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,105,85,0.6)'; g.lineWidth = 2; g.stroke();
    /* its eyes: dark, with a red fire deep inside */
    [-1, 1].forEach(s=>{
      const ex = cx + s * K.w * 0.24, ey = K.Y + K.h * 0.28;
      ellipse(ex, ey, K.w * 0.13, K.h * 0.2, '#1c1512', s * 0.25);
      const glow = g.createRadialGradient(ex, ey, 1, ex, ey, K.w * 0.1);
      glow.addColorStop(0, 'rgba(255,90,60,0.95)'); glow.addColorStop(1, 'rgba(255,40,20,0)');
      ellipse(ex, ey, K.w * 0.1, K.h * 0.15, glow, s * 0.25);
    });
    g.fillStyle = '#2a201b';                                   // the nose
    g.beginPath(); g.moveTo(cx, K.Y + K.h * 0.42); g.lineTo(cx - 7, K.Y + K.h * 0.6); g.lineTo(cx + 7, K.Y + K.h * 0.6); g.closePath(); g.fill();
    /* the mouth is the gate: teeth over a dark doorway two squares wide */
    const mw = P * 2.4, mx = cx - mw / 2, my = K.Y + K.h * 0.68;
    g.fillStyle = '#120d0b'; g.fillRect(mx, my, mw, bot - my + 2);
    g.fillStyle = '#f3eddd';
    for(let k = 0; k < 6; k++){ const tx = mx + k * mw / 6; g.beginPath(); g.moveTo(tx, my - 1); g.lineTo(tx + mw / 12, my + 9); g.lineTo(tx + mw / 6, my - 1); g.closePath(); g.fill(); }
    /* cracks */
    g.strokeStyle = 'rgba(90,75,60,0.6)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(cx + K.w * 0.05, top + 8); g.lineTo(cx + K.w * 0.1, top + 22); g.lineTo(cx + K.w * 0.07, top + 34); g.stroke();
  }
  /* The Hall of Scales: a temple front cut into the valley's head */
  const Hh = box('H');
  if(Hh){
    const { X, Y, w, h } = Hh, cx = X + w / 2;
    g.fillStyle = '#c99a5c'; g.fillRect(X, Y, w, h);
    g.fillStyle = '#a77a43'; g.fillRect(X, Y + h - 6, w, 6);
    g.fillStyle = '#e2bb7c'; g.fillRect(X - 4, Y, w + 8, 12);                     // the lintel
    g.fillStyle = '#8a6334'; g.fillRect(X - 4, Y + 12, w + 8, 3);
    for(let k = 0; k < 5; k++){                                                     // its columns
      const px = X + 10 + k * (w - 28) / 4;
      g.fillStyle = '#e7c48a'; g.fillRect(px, Y + 15, 9, h - 21);
      g.fillStyle = 'rgba(120,80,40,0.35)'; g.fillRect(px + 6, Y + 15, 3, h - 21);
      g.fillStyle = '#d4a85e'; g.fillRect(px - 2, Y + 15, 13, 4);
    }
    g.fillStyle = '#1c140e'; g.fillRect(cx - P * 0.55, Y + h - P * 1.25, P * 1.1, P * 1.25);   // the doorway
    /* the scale, in gold, over the door */
    g.strokeStyle = '#f2cf63'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx, Y + 2); g.lineTo(cx, Y + 10); g.moveTo(cx - 14, Y + 4); g.lineTo(cx + 14, Y + 4); g.stroke();
    [-14, 14].forEach(s=>{ g.beginPath(); g.moveTo(cx + s - 5, Y + 7); g.quadraticCurveTo(cx + s, Y + 12, cx + s + 5, Y + 7); g.stroke(); });
  }
  /* The cobra shrine: a rearing cobra of green stone, a sun disc behind its hood */
  const C = box('C');
  if(C){
    const { X, Y, w, h } = C, cx = X + w / 2;
    ellipse(cx + 6, Y + h + 2, w * 0.45, 6, 'rgba(50,60,20,0.35)');
    g.fillStyle = '#b48d55'; g.fillRect(X + 6, Y + h - 14, w - 12, 14);
    g.fillStyle = '#d0aa6c'; g.fillRect(X + 6, Y + h - 14, w - 12, 3);
    const sun = g.createRadialGradient(cx, Y + 6, 2, cx, Y + 6, 18);
    sun.addColorStop(0, '#ffe58a'); sun.addColorStop(1, 'rgba(240,170,40,0)');
    circle(cx, Y + 6, 18, sun);
    g.fillStyle = '#3f8a52';                                                        // the hood
    g.beginPath(); g.moveTo(cx, Y - 6); g.bezierCurveTo(cx + 20, Y - 2, cx + 14, Y + 26, cx + 5, Y + h - 14);
    g.lineTo(cx - 5, Y + h - 14); g.bezierCurveTo(cx - 14, Y + 26, cx - 20, Y - 2, cx, Y - 6); g.closePath(); g.fill();
    g.fillStyle = '#6fbf6a'; g.beginPath(); g.ellipse(cx, Y + 14, 6, 14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8c45a'; for(let k = 0; k < 4; k++) g.fillRect(cx - 4, Y + 6 + k * 6, 8, 2);
    circle(cx - 4, Y + 1, 1.8, '#ffdc6a'); circle(cx + 4, Y + 1, 1.8, '#ffdc6a');
  }

  /* ---------- the light: dusk — cooler under the ridge, warm over the sands ---------- */
  const light = g.createLinearGradient(0, 0, 0, H * P);
  light.addColorStop(0, 'rgba(70,40,90,0.30)'); light.addColorStop(0.3, 'rgba(120,60,70,0.10)');
  light.addColorStop(0.7, 'rgba(255,150,60,0.06)'); light.addColorStop(1, 'rgba(255,120,50,0.14)');
  g.fillStyle = light; g.fillRect(0, 0, W * P, H * P);

  let url = '';
  try { url = c.toDataURL('image/png'); } catch(e){ url = ''; }
  return (_pastArt[d.key] = url);
}
