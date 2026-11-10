/* ============================================================
   25-quest.js — THE FAIRY KING'S QUEST (3.99)
   The designer (2026-11-07), the jungle's story from the first step in:
     · Arrival. Lucesco: the forest has grown much thicker since he last
       came; he knows the castle's direction, can leap some walls, and will
       take you to the King. At once three aliens come at you (three fights,
       one after another), and in the first his words in the fight itself:
       the fairies are not wicked, their minds are taken; beat the alien
       and they are themselves again.
     · The pulse. After them, a gentle circular pulse (about two squares
       across) at the edge of the screen, its middle on the very edge or
       just past it, so only its waves come in: the castle's direction, by
       Lucesco's smell. (Asked: straight at it, as a compass.)
     · The King, found: Lucesco is welcome, but the kingdom needs him; would
       you clear fifty aliens? Lucesco: his nose can find them — the pulse
       then tracks the nearest. From then on he offers what to track: a
       tribe, the castle, the nearest alien.
     · Fifty beaten: 50 bronze medals, and a challenge every week — up to
       fifty aliens, a medal each, paid when the week turns (or at once on
       the fiftieth). Then the war council: enlist the four tribes. Nobody
       has found them since the fairy uprising ended and the kingdom was
       founded; angry that their ancestors are sealed in the blades on his
       wall, they closed every way to them with magic — walls at least
       three deep, so Lucesco cannot leap in. Lucesco: if the blades hold
       the ancestors, he can smell the tribes in them. The King gives him
       the first — Water's, the north-east, "the most peaceable" — and asks
       you to go as his ambassador. It leaves his wall and rides in your
       party: never switched, put away, or taken into a fight.
     · The lookouts' spyglasses fade to black round the corners until all
       four tribes are found.
     · A barricade: its guardian leaps out, backs you up a step, and asks
       why you carry the sealed blade. The answers are shuffled each time;
       one leads to peace, the rest to a fight (the designer: two waves of
       its fairies, then the guardian with two more; fairies Lv 100, the
       guardian Lv 200). Persuaded or beaten, it admits they need help,
       lifts its wall, and has two conditions: the King must unseal the
       ancestor himself, and the guardians decide together. From then on
       its people freed are paid for each day. It does not know where the
       others are.
     · Back in the throne room: the King thanks you and hands over the
       other three, afraid of the warlike ancestors but knowing he needs
       them. The pulse: Fire (south-east), then Earth (south-west), then
       Grass (north-west).
     · All four found: the guardians before the King; he agrees to unseal
       each ancestor in its own village — whenever you are ready, starting
       in the north-west and on round clockwise (22-war.js: the ancestor's
       battle, the invaders at the 2nd, 3rd and 4th).
     · After the fourth, his gift, and then the spent King hears the castle
       has been invaded: (4.00) the battle for the castle, 26-invasion.js.
   Old saves (asked: "Replay the new quest"): everything earned stays —
   monsters, medals, stones, calmed ancestors — but the quest starts again
   from the King's fifty, and the tribes are found again.
   ============================================================ */
const QUEST = { v:1, fifty:50, weekly:50, intro:3, depth:3, seek:['water', 'fire', 'earth', 'grass'], guardLv:200, fairyLv:100 };

/* ---------- the save: r6().quest ----------
   stage 'arrive' (not yet in) · 'intro' (the first three) · 'castle' (find the King) · 'fifty' (his fifty) ·
   'seek' (the tribes, blade by blade) · 'unseal' (22-war.js: the ancestors) · 'end' (the castle invaded).
   intro{} (the first three: who they are, who is beaten), fifty (beaten for him), wk (this week's challenge:
   key, n, paid), blades{} (carried), given{} (off his wall), found{} (each tribe found, 'talk' or 'fight'),
   track (what Lucesco sniffs out), said{}, note (a week's pay to tell of). */
function questState(){
  const r = r6();
  if(!r.quest || typeof r.quest !== 'object') r.quest = {};
  const q = r.quest;
  ['blades', 'given', 'found', 'said'].forEach(k=>{ if(!q[k] || typeof q[k] !== 'object') q[k] = {}; });
  if(!q.intro || typeof q.intro !== 'object') q.intro = {};
  if(!q.intro.won || typeof q.intro.won !== 'object') q.intro.won = {};
  if(q.v !== QUEST.v) questMigrate(q);
  questWeekTurn(q);
  return q;
}
function questStage(){ return questState().stage; }
function questOn(){ return !!(state && state.progress && state.progress.region6); }
/* A save from before the quest. Never in the jungle: from the start. Otherwise the designer's "Replay the new
   quest": keep what is earned, start again from the King's fifty (or from finding him, if he has not been met). */
function questMigrate(q){
  q.v = QUEST.v;
  const j = jgState();
  if(!j.seen){ q.stage = 'arrive'; return; }
  q.stage = 'castle';
  JG_TRIBE_KEYS.forEach(k=>{ j.met[k] = false; j.found[k] = false; });
  if(j.at && jgVillageAt(j.at.x, j.at.y)) j.at = null;               // never left standing inside a village that has walled itself off
  const w = warState();
  w.council = false; w.beaten = {}; w.said = {};                       // the calmed ancestors and the gift stay
  q.said.replay = true;
}
/* the week's challenge: when the week turns, what was beaten is paid (if it was not already, at fifty) */
function questWeekTurn(q){
  if(!q.wk || typeof tearWeekKey !== 'function') return;
  const key = tearWeekKey();
  if(q.wk.key === key) return;
  const n = Math.min(QUEST.weekly, q.wk.n || 0);
  if(n && !q.wk.paid){
    state.medals = state.medals || {}; state.medals.bronze = (state.medals.bronze || 0) + n;
    q.note = { n };
  }
  q.wk = { key, n:0, paid:false };
  if(typeof saveProfile === 'function') setTimeout(()=> saveProfile(), 0);
}
const questFace = { lion:()=> riftLucescoFace(), guardian:k=> jgFace(JG_TRIBES[k].guardian), king:()=> jgFace('fairy_king_c_front') };
const questTribe = k=> JG_TRIBES[k].name.replace(/^the /, 'the ');
const questTribeCap = k=> JG_TRIBES[k].name.replace(/^the /, 'The ');

/* ---------- the guardians as foes: Lv 200, each a kit of the game's own effects (legendary: a Max) ---------- */
const QUEST_GUARD_KITS = {
  water:[['Basic', 'Staff of Rain', 0.3, 'Single', 2, 1], ['Power1', 'Rain Mask', 0.5, 'AOE', 4, 1, { softenHit:{ chance:0.25, amount:0.5 } }],
         ['Power2', 'Still Waters', null, 'Passive', 0, 21, { passive:{ cleanseEnd:1 } }],
         ['Ultimate', 'Tidal Judgement', 0.9, 'AOE', 8, 41, { blindHit:{ miss:0.25, turns:2 } }], ['Max', 'Tidal Judgement Max', 1.1, 'AOE', 8, 51, { blindHit:{ miss:0.25, turns:2 } }]],
  fire: [['Basic', 'Torch Staff', 0.3, 'Single', 2, 1], ['Power1', 'Flame Mask', 0.5, 'AOE', 4, 1],
         ['Power2', 'War Drums', null, 'Passive', 0, 21, { passive:{ empower:0.15 } }],
         ['Ultimate', 'Bonfire Dance', 0.9, 'AOE', 8, 41, { confuseHit:{ chance:0.25, ffPower:0.6 } }], ['Max', 'Bonfire Dance Max', 1.1, 'AOE', 8, 51, { confuseHit:{ chance:0.3, ffPower:0.6 } }]],
  earth:[['Basic', 'Stone Staff', 0.3, 'Single', 2, 1], ['Power1', 'Boulder Mask', 0.5, 'AOE', 4, 1, { stunHit:0.15 }],
         ['Power2', 'Deep Roots', null, 'Passive', 0, 21, { passive:{ ward:0.15, wardName:'Deep Roots' } }],
         ['Ultimate', 'Landslide', 1.25, 'Single', 8, 41, { stunHit:0.25 }], ['Max', 'Landslide Max', 1.5, 'Single', 8, 51, { stunHit:0.3 }]],
  grass:[['Basic', 'Thorn Staff', 0.3, 'Single', 2, 1], ['Power1', 'Leaf Mask', 0.5, 'AOE', 4, 1, { shieldGain:1 }],
         ['Power2', 'Hide and Seek', null, 'Passive', 0, 21, { passive:{ evadeAlways:0.2 } }],
         ['Ultimate', 'Bramble Trap', 0.8, 'AOE', 8, 41, { stunHit:0.15 }], ['Max', 'Bramble Trap Max', 1.0, 'AOE', 8, 51, { stunHit:0.2 }]],
};
(function questSpecies(){
  if(typeof SPECIES === 'undefined' || typeof MOVES === 'undefined' || typeof JG_TRIBES === 'undefined') return;
  JG_TRIBE_KEYS.forEach(k=>{
    const T = JG_TRIBES[k], id = T.guardian;
    SPECIES[id] = { name:`${T.short} Guardian`, tier:'legendary', types:[T.el, 'Fairy'], rate:12, nerfedRate:12, base:180, evo:[], evoMult:1.5, bonusStages:1,
                    color:TYPE_COLORS[T.el] || '#c98bd0', glyph:{ water:'守', fire:'炎', earth:'磐', grass:'林' }[k], bossOnly:true, noCatch:true, noLevelCap:true, guardianOf:k };
    MOVES[id] = QUEST_GUARD_KITS[k].map(r=> r.slice());
    /* their one picture is <id>.png (no _front): the same in every view */
    if(typeof ASSETS !== 'undefined' && ASSETS.sprites) ASSETS.sprites[id] = `assets/mon/${id}.png`;
  });
})();

/* ============================================================
   THE ARRIVAL: the first three aliens
   ============================================================ */
/* the three: lone aliens of three kinds, a little way into the woods west of the glade you arrive in */
function questIntroBands(){
  const q = questState();
  if(Array.isArray(q.intro.list) && q.intro.list.length === QUEST.intro) return q.intro.list;
  const G = jgGround(), s = G.places.entry.stand, W = G.W;
  const dist = new Int16Array(G.W * G.H).fill(-1), qu = [s.y * W + s.x];
  dist[qu[0]] = 0;
  for(let h = 0; h < qu.length; h++){
    const v = qu[h], x = v % W, y = (v - x) / W;
    if(dist[v] > 14) continue;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy])=>{ const nx = x + dx, ny = y + dy, u = ny * W + nx; if(!jgSolidAt(nx, ny) && dist[u] < 0){ dist[u] = dist[v] + 1; qu.push(u); } });
  }
  const cand = qu.filter(v=> dist[v] >= 6 && dist[v] <= 11 && G.g[v] === JG_T.PATH).sort((a, b)=> dist[a] - dist[b]);
  const kinds = JG_ALIEN_IDS.slice().sort(()=> Math.random() - 0.5);
  const list = [];
  for(const v of cand){
    const x = v % W, y = (v - x) / W;
    if(list.some(b=> Math.abs(b.x - x) + Math.abs(b.y - y) < 3)) continue;
    const sp = kinds[list.length % kinds.length];
    list.push({ id:'intro' + list.length, intro:true, rank:'alien', x, y, hx:x, hy:y, face:'r', tribe:jgTribeOf(x, y), lv:JG.aliens.lv[0], aliens:[sp], lead:sp });
    if(list.length === QUEST.intro) break;
  }
  q.intro.list = list;
  return list;
}
function questIntroWon(id){ return !!questState().intro.won[id]; }
function questIntroLeft(){ return questIntroBands().filter(b=> !questIntroWon(b.id)); }
/* while the three are about: among the day's bands, so they show, look and fight as any band does */
function questIntroEnsure(){
  if(questStage() !== 'intro') return;
  const all = jgBands();
  questIntroLeft().forEach(b=>{ if(!all.includes(b) && !all.some(x=> x.id === b.id)) all.push(b); });
}
/* jgArrive's last line said: at once, the three */
async function questArrived(){
  const q = questState();
  if(q.stage !== 'arrive') return;
  q.stage = 'intro';
  saveProfile();
  questIntroEnsure();
  jgShowBands();
  await jgLines([questFace.lion()], 'Lucesco', [`<b>"Wait. Rrrr… Something is coming through the trees."</b>`]);
  if(ui.screen === JG_KEY) questIntroCome(true);
}
/* they come: all three step out together; the first reaches you and the fight begins */
async function questIntroCome(all){
  const left = questIntroLeft();
  const w = walkState(), p = w.at && w.at[JG_KEY];
  if(!left.length || !p || ui.jgAlert || ui.jgFighting || ui.screen !== JG_KEY) return;
  ui.jgAlert = left[0].id;
  releaseKeys();
  w.busy = true;
  jgHold(true);
  const wait = ms=> new Promise(r=> setTimeout(r, ms));
  left.forEach(b=>{ const el = ui.jgBandEls && ui.jgBandEls[b.id]; if(el) el.classList.add('alert'); });
  playSfx('alert');
  await wait(650);
  const movers = all ? left : left.slice(0, 1);
  const paths = movers.map(b=> questPathTo(b, p));
  for(let step = 0; step < 24; step++){
    let moved = false;
    movers.forEach((b, i)=>{
      const path = paths[i];
      if(!path || !path.length) return;
      if(Math.abs(b.x - p.x) + Math.abs(b.y - p.y) <= 1 + i * 1) return;          // the first beside you, the rest a little behind
      const [nx, ny] = path[0];
      const lion = ui.jgLion;
      if((nx === p.x && ny === p.y) || (lion && lion.x === nx && lion.y === ny) || left.some(o=> o !== b && o.x === nx && o.y === ny)) return;
      path.shift();
      b.face = nx > b.x ? 'r' : nx < b.x ? 'l' : ny > b.y ? 'd' : 'u';
      b.x = nx; b.y = ny; jgBandPlace(b); moved = true;
    });
    if(!moved) break;
    await wait(230);
  }
  await wait(250);
  left.forEach(b=>{ const el = ui.jgBandEls && ui.jgBandEls[b.id]; if(el) el.classList.remove('alert'); });
  jgHold(false);
  ui.jgAlert = null;
  if(ui.screen !== JG_KEY){ w.busy = false; return; }
  jgFight(left[0], true);
}
/* the squares from a band to beside you, round the trees (and not through the walls of thorns) */
function questPathTo(b, p){
  const G = jgGround(), W = G.W, key = (x, y)=> y * W + x;
  const prev = new Map(), start = key(b.x, b.y), qu = [start];
  prev.set(start, -1);
  let end = -1;
  for(let h = 0; h < qu.length && h < 4000; h++){
    const v = qu[h], x = v % W, y = (v - x) / W;
    if(Math.abs(x - p.x) + Math.abs(y - p.y) === 1){ end = v; break; }
    for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const nx = x + dx, ny = y + dy, u = key(nx, ny);
      if(prev.has(u) || jgSolidAt(nx, ny) || (nx === p.x && ny === p.y)) continue;
      prev.set(u, v); qu.push(u);
    }
  }
  if(end < 0) return [];
  const out = [];
  for(let v = end; v !== start; v = prev.get(v)){ const x = v % W; out.unshift([x, (v - x) / W]); }
  return out;
}
/* Lucesco's words in the fights themselves: before the first turn of each of the three */
const QUEST_INTRO_LINES = [
  [`<b>"Look at their eyes! Those fairies are not wicked — the alien has taken over their minds."</b>`,
   `<b>"Beat the alien, and every fairy it holds is set free, and itself again!"</b>`],
  [`<b>"Another! Their minds are not their own. Free them!"</b>`],
  [`<b>"The last one. Set them free!"</b>`],
];
function questFightLines(b, battle){
  if(!b || !b.intro) return;
  const n = questIntroBands().indexOf(b), lines = QUEST_INTRO_LINES[Math.max(0, n)] || [];
  if(!lines.length) return;
  battle.introDue = async (done)=>{
    for(const l of lines){ if(ui.battle !== battle) break; await sceneSay([questFace.lion()], 'Lucesco', l); }
    done();
  };
}
/* one of the three beaten (from questTally) */
function questIntroBeat(b){
  const q = questState();
  q.intro.won[b.id] = true;
  if(questIntroLeft().length) return;
  q.stage = 'castle';
  q.track = 'castle';
}

/* ============================================================
   THE PULSE: Lucesco's nose, at the edge of the screen
   ============================================================ */
/* what he can sniff out now, and the one he is sniffing */
function questPulseOn(){
  if(!questOn()) return false;
  const st = questStage();
  return st === 'castle' || st === 'fifty' || st === 'seek' || st === 'unseal' || st === 'end';
}
function questTrackLabel(t){
  if(t === 'castle') return 'The castle';
  if(t === 'alien') return 'The nearest alien';
  if(JG_TRIBES[t]) return questTribeCap(t);
  return '';
}
/* the tribes he can smell: a blade's, until it is found; then its village, which he knows */
function questTribesSmelt(){
  const q = questState();
  return QUEST.seek.filter(k=> q.blades[k] || q.found[k]);
}
function questTrack(){
  const q = questState();
  let t = q.track;
  if(t === 'alien' && (q.stage === 'castle')) t = 'castle';
  if(JG_TRIBES[t] && !questTribesSmelt().includes(t)) t = 'castle';
  return t || 'castle';
}
function questTarget(p){
  if(!questPulseOn()) return null;
  const P = jgGround().places, t = questTrack(), q = questState();
  if(t === 'castle'){ const s = P.castle.stand; return { x:s.x + 0.5, y:s.y + 0.5 }; }
  if(t === 'alien'){
    let best = null, bd = Infinity;
    jgBands().forEach(b=>{ if(jgBandBeaten(b)) return; const d = (b.x - p.x) * (b.x - p.x) + (b.y - p.y) * (b.y - p.y); if(d < bd){ bd = d; best = b; } });
    return best ? { x:best.x + 0.5, y:best.y + 0.5 } : null;
  }
  if(JG_TRIBES[t]){
    const V = P.villages[t];
    if(q.found[t]) return { x:V.cx + 0.5, y:V.cy + 0.5 };
    /* not found yet: the nearer of its walls */
    let best = null, bd = Infinity;
    (questBars()[t] || []).forEach(b=>{ const d = Math.hypot(b.front[0] - p.x, b.front[1] - p.y); if(d < bd){ bd = d; best = b; } });
    return best ? { x:best.front[0] + 0.5, y:best.front[1] + 0.5 } : { x:V.cx + 0.5, y:V.cy + 0.5 };
  }
  return null;
}
function questPulseEl(){
  const stage = $('#walkStage');
  if(!stage) return null;
  let el = stage.querySelector(':scope > .q-pulse');
  if(!el){
    el = document.createElement('div');
    el.className = 'q-pulse off';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<b></b><i></i><i></i><i></i>';
    stage.appendChild(el);
  }
  return el;
}
let _qPulseSoon = null;
function questPulseUpdate(){
  if(ui.screen !== JG_KEY) return;
  const el = questPulseEl(), stage = $('#walkStage'), you = $('#walkYou');
  const w = walkState(), p = w && w.at && w.at[JG_KEY];
  if(!el || !stage || !you || !p) return;
  const tgt = questTarget(p);
  if(!tgt){ el.classList.add('off'); return; }
  const sr = stage.getBoundingClientRect(), yr = you.getBoundingClientRect();
  const tile = yr.width || 40;
  const cx = yr.left + yr.width / 2 - sr.left, cy = yr.top + yr.height / 2 - sr.top;   // your middle, on the stage
  const dx = (tgt.x - (p.x + 0.5)) * tile, dy = (tgt.y - (p.y + 0.5)) * tile;
  const far = Math.hypot(dx, dy);
  if(far < tile * 1.6){ el.classList.add('off'); return; }               // you are there
  let x = cx + dx, y = cy + dy;
  const W = sr.width, H = sr.height;
  if(!(x > 0 && y > 0 && x < W && y < H)){
    /* off the screen: where the straight line from you to it leaves the stage, its middle a little past the edge */
    const tx = dx > 0 ? (W - cx) / dx : dx < 0 ? -cx / dx : Infinity, ty = dy > 0 ? (H - cy) / dy : dy < 0 ? -cy / dy : Infinity;
    const t = Math.min(tx, ty);
    x = cx + dx * t + dx / far * tile * 0.2; y = cy + dy * t + dy / far * tile * 0.2;
  }
  el.style.left = x.toFixed(1) + 'px'; el.style.top = y.toFixed(1) + 'px';
  el.style.setProperty('--qp', (tile * 2).toFixed(1) + 'px');
  el.classList.remove('off');
}
/* after a step: now, and once the glide has settled */
function questPulseSoon(){
  questPulseUpdate();
  clearTimeout(_qPulseSoon);
  _qPulseSoon = setTimeout(questPulseUpdate, 260);
}

/* ---------- Lucesco's talk: what to sniff out ---------- */
async function questLionTalk(){
  const st = questStage();
  if(st === 'arrive' || st === 'intro') return jgLionChat();
  if(st === 'castle') return jgLines([questFace.lion()], 'Lucesco', [caTurnJ('qLionCastle', [
    `<b>"The castle is that way. See the ripples at the edge of your eyes? That is its smell, reaching my nose. Walk towards them."</b>`,
    `<b>"Follow the pulse. The paths twist, but the smell does not lie."</b>`,
    `<b>"Where the trees are only one deep, tap Jump, and I will carry you over."</b>`])]);
  return questSniff();
}
function caTurnJ(key, lines){ const t = jgState().talk; const n = t[key] = (t[key] || 0) + 1; return lines[(n - 1) % lines.length]; }
/* (4.12) The designer: "when talking to lucesco, please make his nose smell icons sprites instead of emoticons! for
   aliens, please put the humanoid gif, and for the rest please use the respective sprites of fairy king, tribe
   leaders … and for just talking please put Lucesco's sprite." As the jungle's Where to? (3.97): the castle by the
   Fairy King, each tribe by its guardian, the aliens by their captain, the Humanoid, and Just talk by Lucesco. A
   picture that will not load falls back to the old icon. */
const QUEST_SNIFF_PIC = { castle:['fairy_king_c_front', '🏰'], alien:['alien_captain_humanoid', '👽'], talk:['lucesco_front', '💬'] };
function questSniffPic(k){
  const p = QUEST_SNIFF_PIC[k] || (JG_TRIBES[k] ? [JG_TRIBES[k].guardian, JG_TRIBES[k].icon] : null);
  if(!p) return '';
  return `<img class="jg-go-pic q-sniff-pic" src="assets/mon/${p[0]}.png" alt="" onerror="this.replaceWith(document.createTextNode('${p[1]}'))">`;
}
function questSniff(){
  if(document.querySelector('.q-sniff')) return;
  releaseKeys();
  const q = questState(), cur = questTrack();
  const opts = [{ k:'castle', sub:'Its south gate' }, { k:'alien', sub:'Whichever is closest' }];
  questTribesSmelt().forEach(k=> opts.push({ k, sub:q.found[k] ? 'Their village' : 'The blade’s scent' }));
  const ov = document.createElement('div');
  ov.className = 'refine-scrim jg-choose q-sniff';
  ov.innerHTML = `<div class="refine-card"><div class="q-sniff-face">${questFace.lion()}</div><div class="refine-name">What shall I sniff out?</div>
      <div class="jg-choose-list">${opts.map(o=> `<button class="btn btn-ghost jg-go${o.k === cur ? ' q-on' : ''}" data-k="${o.k}">${questSniffPic(o.k)}<span class="jg-go-words">${escapeHtml(questTrackLabel(o.k))}<small>${escapeHtml(o.sub)}${o.k === cur ? ' · now' : ''}</small></span></button>`).join('')}
      <button class="btn btn-ghost jg-go" data-k="talk">${questSniffPic('talk')}<span class="jg-go-words">Just talk<small>What is on his mind</small></span></button></div>
      <button class="btn btn-ghost" id="qSniffNo" style="margin-top:10px;">Cancel</button></div>`;
  document.body.appendChild(ov);
  const close = ()=> ov.remove();
  ov.addEventListener('click', e=>{ if(e.target === ov) close(); });
  ov.querySelector('#qSniffNo').addEventListener('click', close);
  ov.querySelectorAll('.jg-go').forEach(b=> b.addEventListener('click', ()=>{
    close();
    const k = b.dataset.k;
    if(k === 'talk') return questStage() === 'unseal' && typeof unLionTalk === 'function' ? unLionTalk() : jgLionChat();   // (4.13) by where the King's ride stands
    q.track = k; saveProfile();
    toast(`🦁 Lucesco sniffs out: ${questTrackLabel(k).replace(/^The /, 'the ')}.`);
    jgHud(); questPulseSoon();
  }));
}

/* ============================================================
   THE KING: found, his fifty, the week's challenge, the council
   ============================================================ */
/* his first words to you — said in the court scene (21-castle.js), or (an old save, the court already met) on their own */
function questKingAsks(first){
  return (first ? [] : [['king', `<b>"My friends. Welcome back — and Lucesco, my old friend…"</b>`]]).concat([
    ['king', `<b>"${first ? 'Lucesco! My old friend. ' : ''}You are welcome here, always — you and your companions."</b>`],
    ['king', `<b>"But forgive me: I cannot sit and talk as I would like. My kingdom is in a dire state. Every day the aliens take more of my people, and bend their minds to fight for them."</b>`],
    ['king', `<b>"If you would help me, help them first. Defeat ${QUEST.fifty} of the aliens in my jungle, and set free the fairies they hold. Then we will talk — about the four blades behind me, and what we may have to do with them."</b>`],
    ['lion', `<b>"${QUEST.fifty}… Then let my nose do the finding. I can smell an alien from far away. Follow my pulse, and it will always lead you to the nearest one."</b>`],
  ]);
}
function questKingAsked(){
  const q = questState();
  if(q.stage !== 'arrive' && q.stage !== 'intro' && q.stage !== 'castle') return;
  q.stage = 'fifty'; q.fifty = 0; q.track = 'alien';
  saveProfile();
  toast(`👑 The King asks: defeat ${QUEST.fifty} aliens in the jungle.`);
  refreshWalk();
}
function questKingTalk(){
  const q = questState(), c = caState();
  if(!c.met.court) return caCourtScene();
  switch(q.stage){
    case 'arrive': case 'intro': case 'castle': return caLines(questKingAsks(false)).then(questKingAsked);
    case 'fifty': return q.fifty >= QUEST.fifty ? questKingFifty() : caLines([['king', caTurn('qKingFifty', [
      `<b>"${q.fifty} of ${QUEST.fifty}. Every one of them is one of my people set free."</b>`,
      `<b>"${QUEST.fifty - q.fifty} more, my friends. Lucesco's nose will find them."</b>`])]]);
    case 'seek': return questKingSeek();
    case 'unseal': return warKingCastle();
    default: return caLines([['king', caTurn('qKingEnd', [
      `<b>"They are inside the walls… Rest by the tavern fire while you can, my friends. The battle for the castle is coming."</b>`,
      `<b>"My knights hold the palace for now. Be ready."</b>`])]]);
  }
}
/* the "!" over him: something to say */
function questKingDue(){
  if(!questOn() || !caState().met.court) return false;
  const q = questState(), st = q.stage;
  if(st === 'arrive' || st === 'intro' || st === 'castle') return true;
  if(st === 'fifty') return q.fifty >= QUEST.fifty;
  if(st === 'unseal'){ const w = warState(); return (warStage() === 'done' && !w.stone) || questAlarmDue() || (typeof unKingDue === 'function' && unKingDue()); }
  return false;
}
/* fifty: his thanks, his challenge, and the council */
async function questKingFifty(){
  const q = questState();
  await caLines([
    ['king', `<b>"${QUEST.fifty}! ${QUEST.fifty} aliens beaten, and ${QUEST.fifty} of my people free. Lucesco chose his friends well."</b>`],
    ['king', `He presses a heavy purse into your hands: 🥉 <b>${QUEST.fifty} bronze medals</b>.`],
    ['king', `<b>"And do not stop! Each week, beat the aliens in my jungle — up to ${QUEST.weekly} — and I will pay a bronze medal for every one. Your purse comes when the week turns, or as soon as you reach ${QUEST.weekly}."</b>`],
    ['king', `<b>"Now come. The war council is gathering, and you have earned a seat at it."</b>`],
  ]);
  if(ui.screen !== 'r6_palace') return;
  state.medals = state.medals || {}; state.medals.bronze = (state.medals.bronze || 0) + QUEST.fifty;
  q.wk = { key:tearWeekKey(), n:0, paid:false };
  q.said.paid50 = true;
  saveProfile();
  toast(`🥉 +${QUEST.fifty} bronze medals!`);
  return questCouncil();
}
/* (4.00) The designer: "the backstory should be explained in the war council after the player has defeated 50
   aliens for the king" — the tribes' centuries of war, the ancestors sealed two hundred years ago, the castle built
   for peace, the tribes that would not join; then the royal conference (the Commander for the ancestors, the
   Advisor for the tribes first), where it differs from the earlier plan, as 3.99 has it. */
async function questCouncil(){
  const q = questState();
  await caLines([
    ['king', `<b>"Sit, my friends. Before we go on, you should know how this kingdom began — and why the tribes will not come when I call."</b>`],
    ['king', `<b>"For hundreds of years, four tribes fought over this jungle: Water, Fire, Earth and Grass. Each was led by a legendary ancestor, and not one of them would ever give way."</b>`],
    ['king', `<b>"Their wars burned the forest and flooded the valleys. And it was always the innocent fairies, the ones who only wanted to live in peace, who suffered most."</b>`],
    ['king', `<b>"Two hundred years ago, I could bear it no longer. I called on every fairy who was tired of the fighting, and together we stood against the ancestors."</b>`],
    ['king', `<b>"They would not stop. Not for peace, not even for their own people. Only spite, and hundreds of years of revenge. So one by one we defeated them, and sealed each of them into a blade."</b> He looks up at the four blades behind his throne.`],
    ['king', `<b>"Here, in the middle of the jungle, we built this castle: a kingdom where every fairy could live together in peace. Many came. But some of every tribe never forgave me for their ancestors, and would not join us."</b>`],
    ['king', `<b>"Now the aliens hunt them too, and I fear they cannot hold out alone."</b>`],
    ['commander', `<b>"Then unseal the ancestors, Your Majesty! Four legendary warriors against the aliens — they would sweep the jungle clean in a week!"</b>`],
    ['advisor', `<b>"Hoo. And who would hold them, once they were free? They swore revenge on this castle. No: first we must win over the tribes. Only their own people can calm their ancestors."</b>`],
    ['dauphin', `<b>"And the tribes will never come to us, Father. Someone will have to go to them."</b>`],
    ['king', `<b>"Would that we could. My scouts have searched for them for two hundred years. Not one of them has ever been found."</b>`],
    ['king', `<b>"They hid themselves with magic, and walled off every path that leads to them — three walls deep and more, thicker than any Lucesco could leap."</b>`],
    ['lion', `<b>"…If the blades hold their ancestors, then the blades must smell of their tribes. Give me one, and I will follow its scent to its people."</b>`],
    ['king', `<b>"Yes… yes! But I cannot come with you. If a tribe senses me near, it will only hide deeper. You must go as my ambassadors."</b>`],
    ['king', `He rises, and lifts one of the blades down from the wall behind his throne. It is cold, and frost creeps over the stone.<br><br><b>"Take this one: the Water Tribe's, in the north-east. They were always the most peaceable of the four. If any tribe will listen, it is them."</b>`],
  ]);
  if(ui.screen !== 'r6_palace') return;
  q.stage = 'seek'; q.blades.water = true; q.given.water = true; q.track = 'water';
  saveProfile();
  questRefreshThings();
  playSfx('stone_high');
  toast('🗡️ The sealed water blade joins your party. Lucesco can smell its tribe!');
  return caLines([['dauphin', `<b>"Be careful out there. And… bring it back, will you? Father has not slept properly since the aliens came."</b>`]]);
}
function questKingSeek(){
  const q = questState(), next = questNextTribe();
  if(!q.found.water) return caLines([['king', caTurn('qKingWater', [
    `<b>"The Water Tribe, in the north-east. Lucesco will follow the blade's scent — trust his nose."</b>`,
    `<b>"Speak to them kindly. They have every reason not to trust anyone from this castle."</b>`])]]);
  return caLines([['king', next ? `<b>"${questTribeCap(next)} next${JG_TRIBES[next] ? ', in the ' + { ne:'north-east', se:'south-east', sw:'south-west', nw:'north-west' }[JG_TRIBES[next].corner] : ''}. Lucesco has its blade's scent."</b>` : `<b>"All four… I can hardly believe it."</b>`]]);
}
/* the tribe the pulse leads to next: the first, in the designer's order, whose blade you carry and who is not found */
function questNextTribe(){
  const q = questState();
  return QUEST.seek.find(k=> q.blades[k] && !q.found[k]) || null;
}

/* ---------- the count: the first three, his fifty, the week's ---------- */
/* (4.08) The designer: "For the purposes of defeating aliens, captains should count as 3 and commanders as 6 due to
   the number of waves too" — a band counts for its rank (until 4.08, one a band whatever its size) */
const QUEST_COUNT = { alien:1, captain:3, commander:6 };
function questCountOf(b){ return (b && QUEST_COUNT[b.rank]) || 1; }
function questTally(b){
  if(!questOn()) return null;
  const q = questState(), notes = [], thanks = [];
  if(b && b.intro){ questIntroBeat(b); return { notes, thanks }; }
  const n = questCountOf(b), as = n > 1 ? ` (+${n}: ${b.rank === 'commander' ? "a commander's" : "a captain's"} band)` : '';
  if(q.stage === 'fifty' && q.fifty < QUEST.fifty){
    q.fifty = Math.min(QUEST.fifty, q.fifty + n);
    notes.push(`👑 Aliens beaten for the King: ${q.fifty}/${QUEST.fifty}${as}.`);
    if(q.fifty >= QUEST.fifty){ q.track = 'castle'; thanks.push(()=> questFiftyDone()); }
  }
  if(q.wk && !q.wk.paid){
    q.wk.n = Math.min(QUEST.weekly, (q.wk.n || 0) + n);
    if(q.wk.n >= QUEST.weekly){
      q.wk.paid = true;
      state.medals = state.medals || {}; state.medals.bronze = (state.medals.bronze || 0) + QUEST.weekly;
      thanks.push(()=> questWeekPaid(QUEST.weekly, true));
    } else notes.push(`🛡️ This week's challenge: ${q.wk.n}/${QUEST.weekly}${as} (a bronze medal each, paid when the week turns).`);
  }
  return { notes, thanks };
}
function questFiftyDone(){
  return new Promise(res=> storyModal(jgMonImg('lucesco_front', 140), '👑 Fifty for the King!',
    `<b>"That is ${QUEST.fifty}! Come — back to the castle. The King will want to hear of it."</b><br><br><i>Lucesco's pulse leads to the castle now.</i>`,
    ()=> res(), { subtitle:'The jungle', bg:'jungle' }));
}
function questWeekPaid(n, early){
  return new Promise(res=> storyModal(jgMonImg('fairy_king_c_front', 140), '👑 The King’s challenge',
    `<b>"${n} aliens${early ? ' this week' : ' last week'}! My thanks, my friends."</b><br><br>🥉 <b>+${n} bronze medals</b>.` +
    `<br><br><i>${early ? 'The count starts again when the week turns.' : 'A new week, a new count: up to fifty.'}</i>`,
    ()=> res(), { subtitle:"The Fairy King's castle", bg:'jungle' }));
}
/* the counters over the jungle */
function questHudBits(){
  if(!questOn()) return [];
  const q = questState(), bits = [];
  if(q.stage === 'fifty') bits.push(`<span class="jg-chip${q.fifty >= QUEST.fifty ? ' done' : ''}" title="Aliens beaten for the King">👑 ${q.fifty >= QUEST.fifty ? '✓' : q.fifty + '/' + QUEST.fifty}</span>`);
  if(q.wk) bits.push(`<span class="jg-chip${q.wk.paid ? ' done' : ''}" title="This week's challenge: a bronze medal for each alien, up to ${QUEST.weekly}">🛡️ ${q.wk.paid ? '✓' : (q.wk.n || 0) + '/' + QUEST.weekly}</span>`);
  if(questPulseOn()) bits.push(`<button class="jg-chip q-track" type="button" title="What Lucesco is sniffing out">${questPinSvg(15)} ${escapeHtml(questTrackLabel(questTrack()))}</button>`);
  return bits;
}
/* (4.00) the designer: "please also remove the nose emoticon … a red GPS symbol would be better" — a map pin, drawn
   here: a red drop with a white heart, a darker rim and a glint */
function questPinSvg(px){
  const s = Math.round(px || 15);
  return `<svg class="q-pin" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true" focusable="false">` +
    `<path d="M12 1.6c-4.5 0-8 3.5-8 7.9 0 5.8 7 12.4 7.4 12.8a.9.9 0 0 0 1.2 0C13 21.9 20 15.3 20 9.5c0-4.4-3.5-7.9-8-7.9z" fill="#e3262b" stroke="#9e1219" stroke-width="1.1" stroke-linejoin="round"/>` +
    `<circle cx="12" cy="9.5" r="3.3" fill="#fff"/>` +
    `<path d="M7.1 6.9c.8-1.7 2.4-2.8 4.3-3" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.3" stroke-linecap="round"/></svg>`;
}
function questKnightLine(){
  const q = questState();
  if(q.stage === 'castle' || q.stage === 'intro' || q.stage === 'arrive') return `<b>"His Majesty is in the palace. Go in — he is waiting for you."</b>`;
  if(q.stage === 'fifty') return `<b>"Fifty aliens for the King? Ha! The jungle will be safer for it. ${q.fifty} so far!"</b>`;
  if(q.wk) return q.wk.paid ? `<b>"Fifty this week! Rest, champions. The count begins again when the week turns."</b>`
    : `<b>"${q.wk.n || 0} aliens beaten this week. His Majesty pays a bronze medal for each, up to ${QUEST.weekly}."</b>`;
  return `<b>"For the King!"</b>`;
}

/* ============================================================
   THE TRIBES' WALLS — barricades of thorns across every way in
   ============================================================ */
let _qBars = null;
/* each village's ways in (jgGround: the squares dug from inside out), at least three squares deep: where a way is
   shorter, the wall goes on into the village along the same line. Each: its squares, the outermost, the square before
   it (where you stand at the dead end), which way is out. */
function questBars(){
  if(_qBars) return _qBars;
  const G = jgGround(), P = G.places;
  _qBars = {};
  _jgBar = new Uint8Array(G.W * G.H);
  JG_TRIBE_KEYS.forEach((k, ti)=>{
    const V = P.villages[k];
    _qBars[k] = (V.ways || []).map(w=>{
      const [dx, dy] = w.d, sq = w.sq.map(s=> s.slice());
      let [ix, iy] = sq[0];
      while(sq.length < QUEST.depth){ ix -= dx; iy -= dy; if(G.g[iy * G.W + ix] !== JG_T.VILLAGE) break; sq.unshift([ix, iy]); }
      const out = sq[sq.length - 1], front = [out[0] + dx, out[1] + dy];
      sq.forEach(([x, y])=>{ _jgBar[y * G.W + x] = ti + 1; });
      return { k, sq, out, front, d:[dx, dy] };
    });
  });
  return _qBars;
}
function questBarSync(){
  questBars();
  const q = questState();
  JG_TRIBE_KEYS.forEach((k, i)=>{ _jgBarUp[i] = !q.found[k]; });
}
/* standing in a village still walled off (for Lucesco's leap, and where you left off) */
function questSealedAt(x, y){
  if(!questOn()) return false;
  const k = jgVillageAt(x, y);
  return !!(k && !questState().found[k]);
}
/* drawn on the jungle's ground layer, over each square of a wall still standing: thorns, three deep and more */
const _qBarSpr = {};
function questBarSprite(k, n, S){
  const key = k + n + ':' + S;
  if(_qBarSpr[key]) return _qBarSpr[key];
  const c = document.createElement('canvas'), w = Math.round(S * 1.5), h = Math.round(S * 1.7);
  c.width = w; c.height = h;
  const g = c.getContext('2d'), col = { water:'110,190,255', fire:'255,140,70', earth:'230,190,110', grass:'140,235,120' }[k];
  const R = jgRng(0x7b3 + n * 977 + k.length * 31), r = ()=> R();
  /* the shade it throws, and its body: dark, tangled */
  g.fillStyle = 'rgba(6,10,4,.5)'; g.beginPath(); g.ellipse(w * 0.5, h * 0.93, w * 0.46, h * 0.07, 0, 0, Math.PI * 2); g.fill();
  const body = g.createLinearGradient(0, h * 0.15, 0, h);
  body.addColorStop(0, '#2c3a1c'); body.addColorStop(0.6, '#1a2410'); body.addColorStop(1, '#10170a');
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(w * 0.04, h * 0.95);
  for(let i = 0; i <= 8; i++){ const x = w * (0.04 + 0.92 * i / 8), y = h * (0.22 + 0.12 * r()); g.lineTo(x, y); }
  g.lineTo(w * 0.96, h * 0.95); g.closePath(); g.fill();
  /* twisted stems and their thorns */
  for(let s = 0; s < 9; s++){
    const x0 = w * (0.05 + 0.9 * r()), y0 = h * 0.95, x1 = w * (0.05 + 0.9 * r()), y1 = h * (0.2 + 0.25 * r());
    const mx = (x0 + x1) / 2 + (r() - 0.5) * w * 0.5, my = (y0 + y1) / 2;
    g.strokeStyle = s % 3 ? '#3e4f26' : '#55402a'; g.lineWidth = Math.max(1.5, S * (0.05 + 0.04 * r()));
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
    for(let t = 0.15; t < 1; t += 0.17){
      const a = 1 - t, px = a * a * x0 + 2 * a * t * mx + t * t * x1, py = a * a * y0 + 2 * a * t * my + t * t * y1;
      const dir = r() < 0.5 ? -1 : 1, len = S * (0.07 + 0.05 * r());
      g.fillStyle = '#c9c09a';
      g.beginPath(); g.moveTo(px, py - len * 0.25); g.lineTo(px + dir * len, py - len * 0.55); g.lineTo(px, py + len * 0.25); g.closePath(); g.fill();
    }
  }
  /* the tribe's magic in it: glowing knots and a faint sheen */
  const sheen = g.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, w * 0.6);
  sheen.addColorStop(0, `rgba(${col},.28)`); sheen.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = sheen; g.fillRect(0, 0, w, h);
  for(let m = 0; m < 4; m++){
    const x = w * (0.18 + 0.64 * r()), y = h * (0.35 + 0.5 * r()), rr = S * (0.035 + 0.03 * r());
    const gl = g.createRadialGradient(x, y, 0, x, y, rr * 3.2);
    gl.addColorStop(0, `rgba(${col},.95)`); gl.addColorStop(0.35, `rgba(${col},.55)`); gl.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gl; g.beginPath(); g.arc(x, y, rr * 3.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(x, y, rr * 0.5, 0, Math.PI * 2); g.fill();
  }
  _qBarSpr[key] = c;
  return c;
}
function questPaintBars(ctx, x0, y0, x1, y1, k){
  if(!questOn()) return;
  questBarSync();
  const bars = questBars(), S = Math.max(8, Math.round(k));
  JG_TRIBE_KEYS.forEach(t=>{
    if(questState().found[t]) return;
    (bars[t] || []).forEach(b=> b.sq.forEach(([x, y], i)=>{
      if(x < x0 - 1 || x > x1 + 1 || y < y0 - 1 || y > y1 + 2) return;
      ctx.drawImage(questBarSprite(t, (x * 7 + y * 13 + i) % 3, S), Math.round((x - x0 - 0.25) * k), Math.round((y - y0 - 0.7) * k), Math.round(1.5 * k), Math.round(1.7 * k));
    }));
  });
}
/* on the map: a glow over each wall, and a Look */
function questJungleThings(list){
  if(!questOn()) return;
  const bars = questBars();
  JG_TRIBE_KEYS.forEach(k=> (bars[k] || []).forEach(b=>{
    list.push({ x:b.out[0], y:b.out[1], icon:'', still:true, cls:'q-bar q-bar-' + k, html:()=> `<i class="q-bar-glow"></i>`,
      verb:'Look', sub:'A wall of thorns', when:()=> !questState().found[k], act:()=> questBarLook(k) });
  }));
}
function questBarLook(k){
  const q = questState();
  const lines = [`A wall of thorns, thick and tangled, three trees deep and more. It hums, and here and there something in it glows ${{ water:'blue', fire:'orange', earth:'gold', grass:'green' }[k]}.`];
  if(!q.blades[k]) lines.push(`<b>Lucesco:</b> <b>"Magic. Old magic. Even I cannot leap a wall like this… Whatever is behind it does not want to be found."</b>`);
  else lines.push(`<b>Lucesco:</b> <b>"The blade's scent is strongest here. They are behind this wall — I am sure of it."</b>`);
  return jgLines([], '', lines);
}

/* ---------- at a wall, with its blade: its guardian ---------- */
function questStep(p){
  if(!questOn() || ui.jgTalk || ui.qGuard) return false;
  const q = questState();
  if(q.stage !== 'seek') return false;
  const bars = questBars();
  for(const k of JG_TRIBE_KEYS){
    if(q.found[k] || !q.blades[k]) continue;
    const b = (bars[k] || []).find(b=> b.front[0] === p.x && b.front[1] === p.y);
    if(b){ setTimeout(()=> questGuardian(k, b), 60); return true; }
  }
  return false;
}
/* the answers: one leads to peace, the rest to a fight; shuffled every time */
const QUEST_GUARD = {
  water:{ ask:`<b>"Halt! That is the sealed blade of our ancestor. Why does a stranger carry it into the lands of the Water Tribe?"</b>`,
    right:`"The Fairy King sent us in peace. The aliens are hurting everyone, and he needs your help."`,
    wrong:[`"We found it lying about. Finders keepers!"`, `"Open up, or we'll knock this wall down!"`, `"Never mind the blade. Just let us in."`],
    peace:`The guardian lowers its staff. <b>"…You speak true. I can hear it, as I hear the tide."</b>`,
    fight:`<b>"Liars! Then the tide will test you!"</b> Water Fairies leap down from the wall of thorns.` },
  fire:{ ask:`<b>"You reek of the castle! And you carry our ancestor's blade like a trophy! Speak, before I burn you where you stand!"</b>`,
    right:`"We carry it with respect. We came to ask for your help against the aliens, not to fight you."`,
    wrong:[`"It's a trophy now. The King gave it to us."`, `"Burn us? Ha! You couldn't burn a marshmallow."`, `"We're just passing through. Mind your own business."`],
    peace:`The flames on its mask sink low. <b>"…Hmph. Respect. From the castle. That's new."</b>`,
    fight:`<b>"I KNEW it! Burn them, my fairies!"</b>` },
  earth:{ ask:`<b>"…Stop. …That blade… is ours. …Why… do you… carry it… here?"</b>`,
    right:`"We came a long way to ask for your help. Please, take your time — we will listen."`,
    wrong:[`"Hurry up and open the wall. We haven't got all day!"`, `"We're taking it to sell. Want to buy it?"`, `"Move aside, slowcoach. We're coming in."`],
    peace:`A long, long pause. <b>"…You… listened. …Good."</b>`,
    fight:`<b>"…No. …Then… stone… decides."</b>` },
  grass:{ ask:`<b>"Ooh, what's this? Little thieves with our ancestor's blade! Tell me why you have it — and it had better be the truth, or we play MY game!"</b>`,
    right:`"The truth: the King trusted us with it, to ask your tribe for help against the aliens."`,
    wrong:[`"We stole it from the castle. Clever, aren't we?"`, `"A thief? You're the thief, hiding behind your wall!"`, `"It's a secret. We'll never tell!"`],
    peace:`<b>"Ooh, the truth! How dull. …And how rare."</b> It giggles, and lowers its staff.`,
    fight:`<b>"Wrong answer! Now we play MY game!"</b>` },
};
async function questGuardian(k, bar){
  if(ui.jgTalk || ui.qGuard || ui.screen !== JG_KEY) return;
  ui.qGuard = k;
  const w = walkState();
  w.busy = true;
  releaseKeys();
  let fighting = false;
  try {
    await questGuardLeap(k, bar);
    if(ui.screen !== JG_KEY) return;
    const G = QUEST_GUARD[k];
    await warLines([[['guardian', k], `${questSaid('guard-' + k) ? '' : `A tall figure in a great ${JG_TRIBES[k].short.toLowerCase()} mask leaps over the wall of thorns, and lands right in front of you. You stumble back a step.<br><br>`}${G.ask}`]]);
    questState().said['guard-' + k] = true;
    if(ui.screen !== JG_KEY) return;
    const opts = [{ t:G.right, ok:true }].concat(G.wrong.map(t=> ({ t, ok:false })));
    for(let i = opts.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); const x = opts[i]; opts[i] = opts[j]; opts[j] = x; }
    const pick = await questAsk([questFace.guardian(k)], `${JG_TRIBES[k].short} Guardian`, G.ask, opts.map(o=> o.t));
    if(ui.screen !== JG_KEY) return;
    if(opts[pick] && opts[pick].ok){
      await warLines([['you', `<b>${G.right}</b>`], [['guardian', k], G.peace]]);
      if(ui.screen !== JG_KEY) return;
      ui.qGuard = null;
      return await questGuardAfter(k, 'talk');
    }
    await warLines([['you', `<b>${(opts[pick] || opts[0]).t}</b>`], [['guardian', k], G.fight]]);
    if(ui.screen !== JG_KEY) return;
    fighting = questGuardFight(k);
  } finally {
    if(ui.qGuard === k) ui.qGuard = null;
    if(!fighting){ w.busy = false; if(ui.screen === JG_KEY) refreshWalk(); }   // a fight keeps you where you are until it ends (jgBack)
  }
}
function questSaid(key){ return !!questState().said[key]; }
/* a question with several answers, all alike to look at: resolves with the one chosen */
function questAsk(faces, name, html, options){
  sceneCss();
  return new Promise(done=>{
    const box = document.createElement('div');
    box.className = 'scene-say ca-choose q-ask';
    box.innerHTML = `<div class="ss-faces">${(faces || []).join('')}</div>` +
      `<div class="ss-body"><div class="ss-name">${escapeHtml(name || '')}</div><div>${html}</div>` +
      `<div class="ss-go ca-opts q-opts">${options.map((o, i)=> `<button class="btn btn-ghost" data-a="${i}">${o}</button>`).join('')}</div></div>`;
    document.body.appendChild(box);
    box.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{ box.remove(); done(+b.dataset.a); }));
  });
}
/* the leap: from behind its wall, in an arc over it, onto where you stood; you back up a step */
async function questGuardLeap(k, bar){
  const world = $('#walkWorld'), w = walkState(), p = w.at && w.at[JG_KEY];
  if(!world || !p) return;
  const T = WALK_T, [dx, dy] = bar.d;
  const from = { x:bar.sq[0][0] - dx, y:bar.sq[0][1] - dy }, to = { x:bar.front[0], y:bar.front[1] };
  const back = questBackStep(to, bar);
  questGuardEl(k, from);
  const el = ui.qGuardEl, at = (x, y)=> `translate3d(${x * T}px,${y * T}px,0)`;
  el.style.zIndex = 12 + Math.max(from.y, to.y);
  playSfx('alert');
  if(back){
    p.x = back.x; p.y = back.y;
    const lion = ui.jgLion;
    if(lion && lion.x === back.x && lion.y === back.y){
      const free = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b2])=> ({ x:back.x + a, y:back.y + b2 }))
        .find(s=> !jgSolidAt(s.x, s.y) && !(s.x === to.x && s.y === to.y) && !jgBandAt(s.x, s.y));
      if(free){ ui.jgLion = { x:free.x, y:free.y, faceR:lion.faceR }; jgLionPlace(); }
    }
    refreshWalk();
  }
  const D = 900, art = el.firstElementChild;
  try {
    if(typeof el.animate === 'function'){
      const a = el.animate([{ transform:at(from.x, from.y) }, { transform:at(to.x, to.y) }], { duration:D, easing:'ease-in-out', fill:'forwards' });
      if(art) art.animate([{ transform:'translateY(0)' }, { transform:`translateY(${-1.7 * T}px)`, offset:0.45 }, { transform:'translateY(0)' }], { duration:D, easing:'ease-in-out' });
      await a.finished.catch(()=>{});
    }
  } catch(e){}
  el.style.transform = at(to.x, to.y);
  el.style.zIndex = 10 + to.y;
}
function questBackStep(to, bar){
  const [dx, dy] = bar.d, inBar = (x, y)=> bar.sq.some(s=> s[0] === x && s[1] === y);
  const order = [[dx, dy], [dy, dx], [-dy, -dx], [-dx, -dy]];
  for(const [a, b] of order){
    const x = to.x + a, y = to.y + b;
    if(!jgSolidAt(x, y) && !inBar(x, y) && !jgBandAt(x, y)) return { x, y };
  }
  return null;
}
/* the guardian standing before its wall (while it speaks, and again after its fight) */
function questGuardEl(k, at){
  const world = $('#walkWorld');
  if(ui.qGuardEl && ui.qGuardEl.isConnected) ui.qGuardEl.remove();
  if(!world) return null;
  const el = document.createElement('div');
  el.className = 'walk-ent jg-npc jg-guardian q-guard';
  el.innerHTML = `<div class="q-guard-arc">${jgMonImg(JG_TRIBES[k].guardian, WALK_T * 1.6)}</div>`;
  el.style.transform = `translate3d(${at.x * WALK_T}px,${at.y * WALK_T}px,0)`;
  el.style.zIndex = 10 + at.y;
  el._at = { x:at.x, y:at.y };                                         // (4.13) where it stands: its walk home starts there
  world.appendChild(el);
  ui.qGuardEl = el;
  return el;
}
/* the fight: two waves of its fairies (Lv 100), then the guardian (Lv 200) with two more */
function questGuardWaves(k){
  const T = JG_TRIBES[k], [a, b] = T.members;
  const fairy = sp=> ({ species:sp, level:QUEST.fairyLv, ai:'best', nerfed:false, anyLevel:true });
  return [[fairy(a), fairy(b), fairy(a)], [fairy(b), fairy(a), fairy(b)],
          [fairy(a), { species:T.guardian, level:QUEST.guardLv, ai:'best', nerfed:false, anyLevel:true, veryHigh:{ type:T.el, plus:1, cast:true } }, fairy(b)]];
}
function questGuardFight(k){
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first.'); if(ui.qGuardEl){ ui.qGuardEl.remove(); ui.qGuardEl = null; } return false; }
  const T = JG_TRIBES[k];
  releaseKeys();
  jgSave(true);
  const begin = ()=>{
    ui.jgFight = { id:'guard-' + k, rank:'guardian', tribe:k, waves:3 };
    beginBattle({ waves:questGuardWaves(k), isNpc:true, name:`The ${T.short} Guardian`, bgKey:'battle_jungle', foeRegion:6, encounter:true, encounterMusic:['battle_boss', 'battle_region6'],
      onWin:()=>{ const q = questState(); q.guardWon = k; saveProfile(); jgBack(); },   // (an NPC's fight: no victory page) straight back to its wall
      onLose:()=>{ ui.jgFight = null; go('region'); } });
    if(ui.battle) ui.battle.jungle = 'guard-' + k;
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, ['battle_boss', 'battle_region6']); else begin();
  return true;
}
/* persuaded, or beaten: it lifts its wall, its conditions, and (the first) back to the King, (the last) all four to him */
async function questGuardAfter(k, how){
  const q = questState(), T = JG_TRIBES[k], w = walkState();
  if(q.found[k]) return;
  w.busy = true;
  try { return await questGuardAfterSay(k, how); }
  finally { w.busy = false; if(ui.screen === JG_KEY) refreshWalk(); }
}
async function questGuardAfterSay(k, how){
  /* (4.13) The designer: "let the guardian conversations differ for flavour … Let the player be invited inside the
     guardian's main home" — its words, its wall down, the walk to its home and its people inside (28-unseal.js) */
  if(typeof unGuardAfter === 'function') return unGuardAfter(k, how);
  const q = questState(), T = JG_TRIBES[k];
  const left = QUEST.seek.filter(t=> t !== k && !q.found[t]);
  const seq = [];
  if(how === 'fight') seq.push([['guardian', k], `The guardian leans on its staff, out of breath.<br><br><b>"…Enough. Enough! You are strong, I give you that."</b>`]);
  seq.push([['guardian', k], `<b>"The truth is… we cannot hold out much longer. The aliens take our people every day, and even our walls cannot keep them out for ever. We need help."</b>`]);
  await warLines(seq);
  if(ui.screen !== JG_KEY) return;
  /* the wall comes down */
  q.found[k] = how; delete q.guardWon;
  const j = jgState();
  j.found[k] = true; j.met[k] = true;
  saveProfile();
  questBarSync();
  JG_P.layerKey = '';                                                   // the ground painted again, without its thorns
  questRefreshThings();
  playSfx('stone_high');
  toast(`${T.icon} The wall of thorns sinks into the ground!`);
  await warLines([
    [['guardian', k], `It raises its staff. The thorns shiver, wither, and sink into the earth.<br><br><b>"But hear me. Two things. First: only the King who sealed our ancestor can unseal it — he must do it himself."</b>`],
    [['guardian', k], `<b>"Second: no tribe decides alone. We will stand with the castle only if all four guardians agree, together."</b>`],
    [['guardian', k], left.length ? `<b>"And I cannot tell you where the others are. When the King sealed our ancestors, the tribes hid from each other too. You found us — you must find them."</b>`
                                  : `<b>"You found the others too? …Then there is nothing left to wait for. Take us to the King."</b>`],
    [['guardian', k], `<b>"Free our people from the aliens — ${JG.daily.need === 1 ? 'one' : JG.daily.need} each day — and ${questTribe(k)} will thank you with ${tokenIcon(18)} ${JG.daily.tokens} Skill Tokens. Now come in, friends."</b>`],
  ]);
  if(ui.qGuardEl){ ui.qGuardEl.remove(); ui.qGuardEl = null; }
  if(ui.screen !== JG_KEY) return;
  jgHud(); refreshWalk(); questPulseSoon();
  const found = QUEST.seek.filter(t=> q.found[t]).length;
  if(found === 1 && k === 'water') return questThrone('water');
  if(found === QUEST.seek.length) return questThrone('all');
  q.track = questNextTribe() || 'alien';
  saveProfile(); jgHud(); questPulseSoon();
  if(q.track !== 'alien') jgLines([questFace.lion()], 'Lucesco', [`<b>"I have the next scent: ${questTribe(q.track)}, in the ${{ ne:'north-east', se:'south-east', sw:'south-west', nw:'north-west' }[JG_TRIBES[q.track].corner]}. Follow the pulse when you are ready."</b>`]);
}

/* ============================================================
   THE THRONE ROOM: after the first tribe, and after all four
   ============================================================ */
async function questThrone(which){
  /* (4.13) The designer: "The fairy king should not meet the four guardians in the city" — after all four, you bring the
     castle their answer, and their terms (28-unseal.js, unCourtAll) */
  const court = which === 'all' && typeof unCourtAll === 'function';
  await sceneCurtain(true, 700);
  await sceneCurtainText(court ? 'You hurry back to the castle with the four tribes\u2019 answer…' : which === 'all' ? 'You lead the four guardians to the castle…' : 'You tell the guardian everything, then hurry back to the castle…', 1500);
  ui.qCourt4 = which === 'all' && !court;
  caGo('r6_palace', [19, 7]);
  /* (4.13) until it is drawn (a fixed 450 ms: the first visit after loading could take longer, and the court was skipped) */
  for(let i = 0; i < 60 && !(ui.screen === 'r6_palace' && document.getElementById('walkYou')); i++) await new Promise(r=> setTimeout(r, 75));
  await new Promise(r=> setTimeout(r, 300));
  await sceneCurtainText('', 300);
  await sceneCurtain(false, 700);
  if(ui.screen !== 'r6_palace') return;
  return which === 'all' ? (court ? unCourtAll() : questCourt4()) : questCourtWater();
}
async function questCourtWater(){
  const q = questState();
  await caLines([
    ['king', `<b>"The Water Tribe… after all these years. My friends, you have done what my scouts could not do in two hundred years."</b>`],
    ['you', `<b>"The guardian will help — but only if you unseal their ancestor yourself, in their own village, and come alone. And no tribe decides alone: all four must agree."</b>`],
    ['king', `<b>"Then all four must be found."</b> He turns to the wall behind his throne, and lifts down the three blades that are left.`],
  ]);
  if(ui.screen !== 'r6_palace') return;
  ['fire', 'earth', 'grass'].forEach(k=>{ q.blades[k] = true; q.given[k] = true; });
  q.track = 'fire';
  saveProfile();
  questRefreshThings();
  playSfx('stone_high');
  toast('🗡️ The sealed blades of Fire, Earth and Grass join your party!');
  await caLines([
    ['king', `<b>"Take them: Fire, Earth and Grass. I will not pretend I am not afraid — their ancestors were warriors, and they will wake angry. But without their strength, we cannot win this war."</b>`],
    ['lion', `<b>"Fire… Earth… Grass. I can smell each one. The Fire Tribe first — in the south-east."</b>`],
  ]);
}
async function questCourt4(){
  const q = questState();
  await caLines([
    ['g_water', `<b>"Your Majesty. Two hundred years… and the four of us stand in your hall again."</b>`],
    ['g_fire', `<b>"Don't get comfortable, King. We came because of THEM."</b> It points its torch at you.`],
    ['g_earth', `<b>"…They are… strong. …And they kept… their word."</b>`],
    ['g_grass', `<b>"They found every one of us! Even me. Nobody ever finds me."</b>`],
    ['king', `<b>"Then hear my promise. I will unseal each of your ancestors — not here, but in its own village, among its own people."</b>`],
    ['g_water', `<b>"Then it is decided. Together."</b>`],
    ['king', `<b>"My friends: whenever you are ready, we begin — the Grass Tribe first, in the north-west, and then on round the jungle. Talk to me when you are ready to go."</b>`],
  ]);
  ui.qCourt4 = false;
  /* (22-war.js) the war council is held: the rides, the unsealing, the ancestors */
  const w = warState();
  w.council = true;
  q.stage = 'unseal';
  /* a blade whose ancestor is already calmed (an old save's): back to the King */
  JG_TRIBE_KEYS.forEach(k=>{ if(w.calmed[k]) delete q.blades[k]; });
  q.track = 'alien';
  saveProfile();
  refreshWalk();
}
/* who stands in the throne room for that: the four guardians, before the throne */
function questPalaceThings(T){
  const spots = { grass:[15, 5], water:[17, 5], earth:[22, 5], fire:[24, 5] };
  JG_TRIBE_KEYS.forEach(k=>{
    const [x, y] = spots[k];
    T({ x, y, cls:'ca-npc q-guard-court', still:true, html:()=> jgMonImg(JG_TRIBES[k].guardian, WALK_T * 1.5), verb:'Talk', sub:`${JG_TRIBES[k].short} Guardian`,
        when:()=> !!ui.qCourt4, act:()=> caLines([['g_' + k, `<b>"We are here. Speak to the King."</b>`]]) });
  });
}
/* the blades: off his wall once handed to you */
function questBladeOnWall(el){
  if(!questOn()) return true;
  const k = el === 'ground' ? 'earth' : el;
  return !questState().given[k];
}
function questBladeCarried(k){ return questOn() && !!questState().blades[k]; }
/* unsealed (22-war.js): the blade leaves your party, back in the King's hands */
function questBladeHandOver(k){
  if(!questOn()) return;
  const q = questState();
  if(q.blades[k]){ delete q.blades[k]; saveProfile(); }
}
/* what stands about a place after the story changes it: anything no longer there goes (anything new comes on the next visit) */
function questRefreshThings(){
  const w = walkState(), d = typeof DECKS !== 'undefined' && w && DECKS[w.deck];
  if(!d) return;
  d.things.forEach(t=>{ if(t.el && t.when && !t.when()){ t.el.remove(); t.el = null; } });
  refreshWalk();
}

/* ---------- the alarm: after the fourth ancestor, and the King's gift ---------- */
function questAlarmDue(){
  if(!questOn()) return false;
  const q = questState();
  return q.stage === 'unseal' && warStage() === 'done' && !!warState().stone && !q.said.alarm;
}
async function questAlarm(){
  if(!questAlarmDue() || ui.caTalk) return;
  const q = questState();
  q.said.alarm = true;
  saveProfile();
  await caLines([
    ['knight', `The great doors bang open. A Chestnut Knight staggers in, his armour scorched.<br><br><b>"Your Majesty! The invaders — they are inside the castle walls!"</b>`],
    ['king', `The King tries to rise, and sinks back onto his throne. Waking the four ancestors has taken all of his strength.<br><br><b>"Now…? When I can barely stand…"</b>`],
    ['commander', `<b>"To arms! Every knight to the walls!"</b>`],
    ['dauphin', `<b>"Father, stay here. We will hold them!"</b>`],
    ['lion', `<b>"Then we fight for the castle. Together."</b>`],
  ]);
  q.stage = 'end';
  saveProfile();
  /* (4.00) the battle for the castle (26-invasion.js): the Commander takes you out into the market */
  if(typeof invMuster === 'function' && ui.screen === 'r6_palace') invMuster();
}

/* ============================================================
   IN THE JUNGLE: what each visit sets up
   ============================================================ */
function questJungleBefore(){
  if(!questOn()) return;
  questState();
  questBarSync();
  questIntroEnsure();
}
function questJungleAfter(stage){
  if(!questOn()) return;
  questCss();
  const q = questState();
  questPulseEl();
  setTimeout(questPulseSoon, 80);
  const hud = document.getElementById('jgHud');
  if(hud && !hud.dataset.qWired){
    hud.dataset.qWired = '1';
    hud.addEventListener('click', e=>{ if(e.target.closest && e.target.closest('.q-track') && !ui.jgTalk && !ui.jgAlert) questLionTalk(); });
  }
  if(ui.sceneRunning) return;
  /* back from a guardian's fight, won: its words, and its wall comes down */
  if(q.guardWon && JG_TRIBES[q.guardWon] && !q.found[q.guardWon]){
    const k = q.guardWon, b = (questBars()[k] || [])[0], p = walkState().at[JG_KEY];
    const bar = (questBars()[k] || []).slice().sort((a, c)=> Math.hypot(a.front[0] - p.x, a.front[1] - p.y) - Math.hypot(c.front[0] - p.x, c.front[1] - p.y))[0] || b;
    if(bar){ questGuardEl(k, { x:bar.front[0], y:bar.front[1] }); }
    setTimeout(()=>{ if(ui.screen === JG_KEY) questGuardAfter(k, 'fight'); }, 650);
    return;
  }
  /* the first three: still about */
  if(q.stage === 'intro' && jgState().seen){
    const left = questIntroLeft();
    const calm = Math.max(0, ...left.map(b=> (b.calm || 0) - Date.now()));
    if(left.length) setTimeout(()=>{ if(ui.screen === JG_KEY && questStage() === 'intro') questIntroCome(false); }, 700 + calm);
    return;
  }
  /* …all three beaten: Lucesco's pulse */
  if(q.stage === 'castle' && !q.said.pulse){
    q.said.pulse = true; saveProfile();
    setTimeout(()=>{
      if(ui.screen !== JG_KEY) return;
      const fresh = !q.said.replay;
      jgLines([questFace.lion()], 'Lucesco', (fresh ? [`<b>"They are free! Look — the fairies are going home. Those were only three, though. There will be many more."</b>`] : []).concat([
        `<b>"Now — the castle. I can smell it from here. See the ripples at the edge of your eyes? Follow them: they come from the way I smell it."</b>`,
        `<b>"Talk to me if you lose the way."</b>`])).then(()=> questPulseSoon());
    }, 700);
    return;
  }
  /* a week's pay to tell of */
  if(q.note && q.note.n){
    const n = q.note.n; q.note = null; saveProfile();
    setTimeout(()=>{ if(ui.screen === JG_KEY) jgLines([questFace.lion()], 'Lucesco', [`<b>"The King sent word, and a purse: for the ${n} aliens we beat last week, 🥉 ${n} bronze medals!"</b>`]); }, 700);
  }
}
/* after a step: the pulse follows you */
if(typeof jgStep === 'function'){
  const _qJgStep = jgStep;
  jgStep = function(p, d){ const r = _qJgStep.apply(this, arguments); if(questOn()) questPulseSoon(); return r; };
  if(typeof JG_DECK !== 'undefined') JG_DECK.onStep = (p, d)=> jgStep(p, d);
}

/* ---------- the party: the blades you carry, as passengers ---------- */
function questPassengersHtml(){
  if(!questOn()) return '';
  questCss();
  const q = questState();
  return QUEST.seek.filter(k=> q.blades[k]).map(k=> `
    <div class="party-card seed-card q-blade-card">
      <div class="party-head">
        <img class="q-blade-pic" src="assets/mon/sealed_blade_${k}_front.png" alt="" onerror="this.replaceWith(document.createTextNode('🗡️'))">
        <div style="flex:1;min-width:0;">
          <div class="ph-name">The Sealed ${JG_TRIBES[k].short} Blade</div>
          <div class="q-blade-note">Carried for the Fairy King, to ${escapeHtml(questTribe(k))}. It cannot battle, and it stays with you until the King unseals it.</div>
        </div>
      </div>
    </div>`).join('');
}

/* ---------- looks ---------- */
/* the lookouts: the corners lost in the tribes' magic until all four are found */
function questLookoutHidden(){
  if(!questOn()) return false;
  const q = questState();
  return !QUEST.seek.every(k=> q.found[k]);
}
let _qCss = false;
function questCss(){
  if(_qCss || typeof document === 'undefined') return;
  _qCss = true;
  const s = document.createElement('style');
  s.id = 'questCss';
  s.textContent = `
  .q-pulse{ position:absolute; z-index:4; width:var(--qp,80px); height:var(--qp,80px); translate:-50% -50%; pointer-events:none;
    transition:left .35s ease, top .35s ease, opacity .6s ease; }
  .q-pulse.off{ opacity:0; }
  .q-pulse b{ position:absolute; inset:16%; border-radius:50%; background:radial-gradient(circle closest-side, rgba(255,244,200,.95), rgba(255,214,110,.45) 55%, rgba(255,214,110,0));
    animation:qPulseCore 3.6s ease-in-out infinite; }
  .q-pulse i{ position:absolute; inset:0; border-radius:50%; border:3px solid rgba(255,232,150,.95);
    box-shadow:0 0 14px 2px rgba(255,200,90,.75), inset 0 0 12px rgba(255,214,110,.5); opacity:0; animation:qPulse 3.6s ease-out infinite; }
  .q-pulse i:nth-of-type(2){ animation-delay:1.2s; }
  .q-pulse i:nth-of-type(3){ animation-delay:2.4s; }
  @keyframes qPulse{ 0%{ transform:scale(.12); opacity:0; } 12%{ opacity:1; } 70%{ opacity:.55; } 100%{ transform:scale(1); opacity:0; } }
  @keyframes qPulseCore{ 0%,100%{ opacity:.55; transform:scale(.9); } 50%{ opacity:1; transform:scale(1.08); } }
  @media (prefers-reduced-motion: reduce){ .q-pulse i{ animation:none; opacity:.6; transform:scale(.7); } .q-pulse i:nth-of-type(n+2){ display:none; } .q-pulse b{ animation:none; } }
  button.jg-chip.q-track{ border:0; cursor:pointer; background:rgba(110,78,20,.82); color:#ffefc4; }
  button.jg-chip.q-track:active{ transform:translateY(1px); }
  button.jg-chip.q-track .q-pin{ vertical-align:-3px; margin-right:1px; filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)); }
  .q-sniff .q-sniff-face img{ width:64px; height:64px; object-fit:contain; display:block; margin:0 auto 4px; }
  .q-sniff .btn.jg-go.q-on{ border-color:#c99a3f; background:rgba(201,154,63,.16); }
  .walk-ent.q-bar{ overflow:visible; pointer-events:none; }
  .walk-ent.q-bar .q-bar-glow{ position:absolute; left:-30%; top:-60%; width:160%; height:190%; border-radius:50%; pointer-events:none;
    background:radial-gradient(closest-side, rgba(var(--qc),.32), rgba(var(--qc),0)); animation:qBarGlow 2.8s ease-in-out infinite; }
  .walk-ent.q-bar-water{ --qc:110,190,255; } .walk-ent.q-bar-fire{ --qc:255,140,70; } .walk-ent.q-bar-earth{ --qc:230,190,110; } .walk-ent.q-bar-grass{ --qc:140,235,120; }
  @keyframes qBarGlow{ 0%,100%{ opacity:.45; } 50%{ opacity:1; } }
  .walk-ent.q-guard{ overflow:visible; }
  .walk-ent.q-guard .q-guard-arc{ position:absolute; inset:0; }
  .walk-ent.q-guard .jg-art{ filter:drop-shadow(0 0 8px rgba(255,248,210,.6)) drop-shadow(0 4px 5px rgba(0,0,0,.35)); }
  .q-ask .q-opts{ flex-direction:column; align-items:stretch; gap:6px; }
  .q-ask .q-opts .btn{ width:100%; text-align:left; white-space:normal; line-height:1.3; }
  .q-blade-card .party-head{ align-items:center; }
  .q-blade-pic{ width:52px; height:52px; object-fit:contain; flex:0 0 auto; filter:drop-shadow(0 0 6px rgba(236,226,255,.9)); }
  .q-blade-note{ font-size:11px; color:var(--ink-soft); font-weight:700; font-style:italic; margin-top:4px; }
  `;
  document.head.appendChild(s);
}
