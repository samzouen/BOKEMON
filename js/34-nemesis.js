/* ============================================================
   34-nemesis.js — WADJET, NEMESIS'S COBRA: THE FIGHT IN THE GREAT HALL (4.31)
   The designer (2026-11-11): "nemesis wadjet is a monster that can return to the past, who cannot be defeated in
   isolation. it will keep dodging attacks by taking the hit, disappearing, and reappearing without having taken damage.
   he does so if he reaches 1hp (cannot go below) or if at the start of his every turn. at the start of his turn, he
   always disappears and loses all debuffs as well. the player will need to survive 10 turns with him before he runs out
   of energy and flees. damage prevention and healing will be key here. he fires strong AOE attacks at 3.0x AOE, and
   which puts afflictions on the player that can be removed by diamond dust. in turn 5, he will also summon two more
   shadow copies of himself (darker shaded) that deal 3.0x AOE damage each while he charges up a prismatic laser. he
   cannot be allowed to finish charging the prismatic laser (3 turns) or it will hit all party monsters for 5000
   piercing damage (cannot be reduced or amplified or dodged by any means. sacred flame can still bring phoenix back and
   ground ultra passive can tolerate the hit). the monkey king will tell the player that they must bring him down while
   he charges. while he is charging he cannot reverse time, and cannot remove debuffs or reverse damage. bringing him to
   1hp will cause wadjet to cry 'Argh!' and lose the laser, whereupon he will resume time reversal and 3.0x aoe. while
   he is charging, freeze will extend the time taken to charge, and his shadow copies can be discombobulated or frozen
   for extra survivability" — "Keep wadjet at level 200. Though he cannot be controlled by freeze or discombobulate at
   the start, steel aegis, mirage, spike armour, whalelord dodge and heals still work." — "Shadows cannot be hurt …
   Give each of them 50% of his attack. Give them a max move accessible via mind control that deals 4.5x damage to one
   target and curses/envenoms it. Shadows fade when he reverses time after a failed charge. A cheese strategy is to
   diamond dust and swap to a ghost with lurk although the laser will pierce it." — "Only freeze can delay the charge.
   Monkey king guides the player through suggested moves during the fight. Defensive ones and then CC ones during the
   turn 5 laser charging."

   How it runs (a turn is a round: yours, then theirs):
     · Hood of Dread, his every turn: 3.0× his ATK on each of yours on the field — a blow like any other, so shields,
       damage cuts, dodges and Spike Armour all work on it — and Curse (+25% damage taken; Metamorph cannot hold on
       under it) and Venom (8% of its health at the start of each turn) on your side for three turns. Diamond Dust sweeps
       both away and keeps them off.
     · Return to the Past: never below 1 HP. Brought to 1, and at the start of each of his turns, he vanishes and steps
       back out of the past whole, every mark on him gone (a freeze, a muddle, a Curse: nothing holds him).
     · His fifth turn: two shadows peel off him and he begins gathering the Prismatic Laser — it fires on his third turn
       after (a turn he is frozen does not count). Meanwhile he turns nothing back. The shadows: blows pass through them;
       half his ATK; Hood of Dread every turn; and their Night Venom (4.5× on one, Curse and Venom) only if you take
       hold of one (Mind Control). Brought to 1 HP while he gathers it: "Argh!" — the light lost, back through time,
       the shadows gone. Fired: 5,000 to every monster of yours, bench and companions too, through every shield, cut and
       dodge (a Lurk too) — only a phoenix's Rebirth, or Metamorph's last stand (not under his Curse), outlasts it.
     · The Monkey King names a move each turn of yours, its button glowing: something to shield or heal you while he
       turns back time; something to freeze him or muddle his shadows — or your hardest blow — while he gathers it.
     · Ten turns, and he is spent: he flees, and the fight is won (onChallengeWon: its experience, then the story).
   ============================================================ */
const NEM = { lv:200, turns:10, chargeAt:5, charge:3, laser:5000, shadowAtk:0.5, maxMult:4.5,
  afflict:{ curse:0.25, venom:0.08, turns:3 } };
const NEM_SHADOW = 'nemesis_wadjet_shadow';
const NEM_MUSIC = ['battle_legendary', 'battle_boss'];

/* ---------- his kit for this fight, and his shadows' ---------- */
(function nemSpecies(){
  if(typeof SPECIES === 'undefined' || typeof MOVES === 'undefined' || typeof WADJET === 'undefined' || !SPECIES[WADJET]) return;
  MOVES[WADJET] = [
    ['Basic', 'Fang of Night', 0.3, 'Single', 2, 1],
    ['Power1', 'Hood of Dread', 3.0, 'AOE', 4, 1, { afflict:NEM.afflict }]];
  SPECIES[NEM_SHADOW] = Object.assign({}, SPECIES[WADJET], { name:'Shadow of Wadjet', glyph:'影', fixedLook:WADJET, nemesisPiece:null, nemShadow:true });
  MOVES[NEM_SHADOW] = [
    ['Power1', 'Hood of Dread', 3.0, 'AOE', 4, 1],
    ['Max', 'Night Venom', NEM.maxMult, 'Single', 8, 1, { afflict:NEM.afflict, mindOnly:true }]];
})();

/* ---------- Venom: a mark of theirs on your side (and, by a shadow's Night Venom, on him) ---------- */
const NEM_DROP = `<svg class="ico-venom" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6C6.1 4.6 3.6 7.2 3.6 10.1a4.4 4.4 0 0 0 8.8 0C12.4 7.2 9.9 4.6 8 1.6z" fill="#5bbf3a" stroke="#2a6a1c" stroke-width="1.3" stroke-linejoin="round"/><circle cx="6.5" cy="10.3" r="1.15" fill="#e2ffd0"/></svg>`;
const NEM_PRISM = `<svg class="ico-prism" viewBox="0 0 16 16" aria-hidden="true"><defs><linearGradient id="nemPrismG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".25" stop-color="#ffd54a"/><stop offset=".5" stop-color="#6cf06a"/><stop offset=".75" stop-color="#5ab4ff"/><stop offset="1" stop-color="#b86cff"/></linearGradient></defs><path d="M8 1.2 14.4 13.6H1.6Z" fill="url(#nemPrismG)" stroke="#4a3a7a" stroke-width="1.2" stroke-linejoin="round"/><path d="M8 4.6 11.2 11.6H4.8Z" fill="#fff" opacity=".55"/></svg>`;
if(typeof STATUS_KIND !== 'undefined') STATUS_KIND.venom = 'debuff';
/* the marks as symbols (04-battle.js, 3.52: "symbols for each status that can be pressed for more details"), drawn —
   no emoji for any of them: Venom's droplet, the Prismatic Laser's prism, Return to the Past's arrow running back, a
   shadow's hood. Their keys are private-use characters, so no message's words can ever be taken for one (emoHtml). */
const NEM_SYM = { venom:'\uE7A1', prism:'\uE7A2', past:'\uE7A3', shadow:'\uE7A4' };
if(typeof DRAWN_SYMBOLS !== 'undefined' && typeof drawnSvg === 'function'){
  DRAWN_SYMBOLS[NEM_SYM.venom] = drawnSvg('venom',
    '<path d="M32 5C24 18 13 29 13 41a19 19 0 0 0 38 0C51 29 40 18 32 5Z" fill="#5bbf3a" stroke="#2a6a1c" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M22 40c0 6 4 10 9 11" fill="none" stroke="#e2ffd0" stroke-width="4.5" stroke-linecap="round"/>');
  DRAWN_SYMBOLS[NEM_SYM.prism] = drawnSvg('prism',
    '<defs><linearGradient id="nemSymPrism" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".25" stop-color="#ffd54a"/><stop offset=".5" stop-color="#6cf06a"/><stop offset=".75" stop-color="#5ab4ff"/><stop offset="1" stop-color="#b86cff"/></linearGradient></defs>' +
    '<path d="M32 5 58 55H6Z" fill="url(#nemSymPrism)" stroke="#4a3a7a" stroke-width="4" stroke-linejoin="round"/><path d="M32 19 45 47H19Z" fill="#fff" opacity=".55"/>');
  DRAWN_SYMBOLS[NEM_SYM.past] = drawnSvg('past',
    '<path d="M50 32A18 18 0 1 1 32 14" fill="none" stroke="#7a4fd0" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M32 3 20 14 32 25Z" fill="#7a4fd0" stroke="#7a4fd0" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M32 22V33L40 38" fill="none" stroke="#3a2a6a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>');
  DRAWN_SYMBOLS[NEM_SYM.shadow] = drawnSvg('shadow',
    '<path d="M32 6C18 6 10 17 12 30c1 8 6 12 10 15l-2 14h24l-2-14c4-3 9-7 10-15C54 17 46 6 32 6Z" fill="#2a2140" stroke="#8a6cff" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="25" cy="27" r="3.4" fill="#b8f08a"/><circle cx="39" cy="27" r="3.4" fill="#b8f08a"/>');
}
if(typeof PILL_SYMBOL !== 'undefined') PILL_SYMBOL.venom = NEM_SYM.venom;
/* its name, wherever it is said: the droplet drawn (battleMsg draws the game's symbols, emoHtml), then the word */
if(typeof STATUS_LABELS !== 'undefined') STATUS_LABELS.venom = NEM_SYM.venom + ' Venom';
/* the words on each mark's card (tapped) */
if(typeof statusTipText === 'function'){
  const _nemTip = statusTipText;
  statusTipText = function(key, st, c, pill){
    const b = ui.battle, N = b && b.nem;
    if(key === 'venom'){
      const pct = Math.round(((st && st.pct) || NEM.afflict.venom) * 100);
      const who = c && !c.one && c.yours ? 'Each of yours on the field' : ((c && c.W) || 'It');
      return `${who} loses <b>${pct}%</b> of its health at the start of each turn.` + (c && c.yours ? ' Diamond Dust sweeps it away.' : '');
    }
    if(key === 'nemPast') return `<b>Return to the Past.</b> He can't be brought below 1 HP: brought to 1, and at the start of each of his turns, he slips back into the past and steps out again whole, every mark on him gone. Only while he gathers the Prismatic Laser does he turn nothing back.`;
    if(key === 'nemEnergy'){ const n = nemTurnsLeft(); return `Wadjet can keep this up for <b>${n}</b> more turn${n === 1 ? '' : 's'}, this one included. Then he is spent, and he flees.`; }
    if(key === 'nemCharge'){ const n = N && N.charging ? N.charging.left : 0; return `The Prismatic Laser: it fires in <b>${n}</b> of his turns — <b>5,000</b> to every monster of yours, bench and companions too, through everything. A turn he is frozen doesn't count. Bring him to <b>1 HP</b> before it fires and the light is lost.`; }
    if(key === 'nemShadow') return `<b>A shadow of Wadjet.</b> Blows pass straight through it. It strikes with half his ATK. Freeze it, or muddle it with Discombobulate, and it loses its blow — and with Mind Control, its <b>Night Venom</b> is yours to aim: <b>${NEM.maxMult}×</b> on one, and a Curse and Venom on it.`;
    return _nemTip.apply(this, arguments);
  };
}
/* his Hood of Dread got through: Curse and Venom on your side, once an attack (05-battle-flow.js) — under your
   Diamond Dust, neither */
function nemAfflict(af){
  if(!ui.battle || !af) return '';
  const T = af.turns + 1;                                     // (a status counts the turn it was laid)
  const c = setPStatus(0, { type:'curse', turnsLeft:T, extra:af.curse, by:'enemy', nem:true });
  const v = setPStatus(0, { type:'venom', turnsLeft:T, pct:af.venom, by:'enemy' });
  if(!c && !v) return '✨ The diamond dust keeps his Curse and Venom off you.';
  return `${STATUS_LABELS.curse} and ${STATUS_LABELS.venom}: your side takes <b>${Math.round(af.curse * 100)}%</b> more damage and loses <b>${Math.round(af.venom * 100)}%</b> of its health each turn.`;
}
/* a shadow's Night Venom, aimed by your Mind Control: the Curse and the Venom on the one it struck — while he gathers
   the light they stay on him; when he next turns back time they go */
function nemAfflictFoe(v, af){
  if(!ui.battle || !v || !af || v.nemShadow) return '';
  addEStatus(v, { type:'curse', turnsLeft:af.turns + 1, extra:af.curse, byRound:true, mine:true });
  addEStatus(v, { type:'venom', turnsLeft:af.turns + 1, pct:af.venom, byRound:true, mine:true });
  return ` ${STATUS_LABELS.curse} and ${STATUS_LABELS.venom} on ${escapeHtml(SPECIES[v.species].name)}!`;
}
/* Venom bites at the start of each turn, before anything else: yours on the field, and him */
function nemVenomTick(){
  const b = ui.battle;
  if(!b) return '';
  const said = [];
  const pv = getPStatus(0, 'venom');
  if(pv){
    const hit = [];
    livingField().forEach(m=>{
      const max = monMaxHp(m), before = m.currentHp, d = Math.max(1, Math.ceil(max * (pv.pct || NEM.afflict.venom)));
      m.currentHp = Math.max(0, before - d);
      drainHp(pid('playerHp', m), before, m.currentHp, max);
      showDamageNumber(pid('playerBob', m), before - m.currentHp);
      hit.push(`${escapeHtml(displayName(m))} ${before - m.currentHp}`);
    });
    if(hit.length) said.push(`${NEM_DROP} Venom: ${hit.join(', ')}.`);
  }
  (b.enemies || []).forEach((e, i)=>{
    const ev = e.hp > 0 && getEStatus(e, 'venom');
    if(!ev) return;
    const before = e.hp;
    e.hp = before - Math.max(1, Math.ceil(e.maxHp * (ev.pct || NEM.afflict.venom)));
    drainHp('enemyHp-' + i, before, e.hp, e.maxHp);
    showDamageNumber('enemy-' + i, before - e.hp);
    said.push(`${NEM_DROP} Venom eats at ${escapeHtml(SPECIES[e.species].name)}: ${before - e.hp}.`);
  });
  return said.join(' ');
}
if(typeof runPreHits === 'function'){
  const _nemPreHits = runPreHits;
  runPreHits = function(done){
    const b = ui.battle;
    if(!b || !(getPStatus(0, 'venom') || (b.enemies || []).some(e=> e.hp > 0 && getEStatus(e, 'venom')))) return _nemPreHits.apply(this, arguments);
    const self = this, args = arguments;
    const said = nemVenomTick();
    if(said){ battleMsg(said); renderStatusBadges(); }
    setTimeout(()=>{ if(ui.battle === b) _nemPreHits.apply(self, args); }, said ? 900 : 0);
  };
}

/* ============================================================
   THE FIGHT
   ============================================================ */
function nemOn(){ return !!(ui.battle && ui.battle.nem); }
function nemWadjet(){ const b = ui.battle; return b && (b.enemies || []).find(e=> e.nemRole === 'wadjet') || null; }
function nemShadows(){ const b = ui.battle; return b ? (b.enemies || []).filter(e=> e.nemRole === 'shadow' && !e._nemGone) : []; }
function nemTurnsLeft(){ return Math.max(1, NEM.turns - Math.max(1, roundNo()) + 1); }
/* `hooks`: { onWin, onLose, bg } — the story's (26-invasion.js; (4.33) bg: where it is fought, the grounds by the fountain) */
function nemBeginBattle(hooks){
  hooks = hooks || {};
  if(typeof releaseKeys === 'function') releaseKeys();
  const begin = ()=>{
    beginBattle({ waves:[[{ species:WADJET, level:NEM.lv, ai:'best', nerfed:false, anyLevel:true }]], isNpc:true, name:'Wadjet', bgKey:hooks.bg || 'battle_palace', foeRegion:6,
      encounter:true, encounterMusic:NEM_MUSIC, noFlee:true,
      onWaveStart:(i)=> nemWaveStart(i),
      onWin:(lu)=>{ if(hooks.onWin) hooks.onWin(lu); },
      onLose:()=>{ if(hooks.onLose) return hooks.onLose(); } });
    const b = ui.battle;
    if(!b) return;
    b.inv = 'wadjet'; b.noFoeRecharge = true;
    nemSetup(b);
    b.introDue = done=> nemIntro(done);
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, NEM_MUSIC); else begin();
}
function nemSetup(b){
  if(!b.nem) b.nem = { charging:null, chargeStarted:false, fired:false, broke:false, fled:false, arghDue:false, rewindDue:false };
  const W = (b.enemies || []).find(e=> e.species === WADJET);
  if(W) nemArm(W);
}
function nemWaveStart(){ const b = ui.battle; if(b) nemSetup(b); }
/* never below 1 HP — every way his health falls goes through `hp` — and at 1, back through time (or "Argh!") */
function nemArm(W){
  if(W._nemArmed) return;
  W._nemArmed = true;
  W.nemRole = 'wadjet';
  W.cls = ((W.cls || '') + ' nem-wadjet').trim();
  let hp = Math.max(1, W.hp);
  Object.defineProperty(W, 'hp', { configurable:true, enumerable:true,
    get(){ return W._nemGone ? 0 : hp; },
    set(v){
      const n = +v;
      if(!Number.isFinite(n) || W._nemGone) return;
      const was = hp;
      hp = Math.max(1, Math.min(W.maxHp, Math.round(n)));
      if(hp <= 1 && was > 1) nemAtOne(W);
    } });
}
/* a shadow: blows pass through it — its health never falls (it fades, when it goes) */
function nemArmShadow(s){
  s.nemRole = 'shadow'; s.nemShadow = true;
  const full = s.maxHp;
  Object.defineProperty(s, 'hp', { configurable:true, enumerable:true,
    get(){ return s._nemGone ? 0 : full; },
    set(){} });
}
function nemAtOne(W){
  const b = ui.battle, N = b && b.nem;
  if(!N || N.fled) return;
  if(N.charging){
    if(N.arghDue) return;
    N.arghDue = true;
    floatOver(W, 'ARGH!');
    const card = document.getElementById('enemy-' + b.enemies.indexOf(W));
    if(card){ card.classList.remove('nem-argh'); void card.offsetWidth; card.classList.add('nem-argh'); }
  } else N.rewindDue = true;
}
/* what is still to happen to him, at the next place the fight can stop for it */
function nemPending(next){
  const b = ui.battle, N = b && b.nem;
  if(!N) return next();
  if(N.arghDue){ N.arghDue = false; return nemArgh(next); }
  if(N.rewindDue){ N.rewindDue = false; return nemRewind('one', next); }
  next();
}
const nemWait = ms=> new Promise(r=> setTimeout(r, ms));

/* ---------- back through time: he vanishes, the tape runs back, he steps out whole ---------- */
function nemRewind(kind, next){
  const b = ui.battle, N = b && b.nem, W = nemWadjet();
  if(!W || !N) return next();
  const idx = b.enemies.indexOf(W), card = document.getElementById('enemy-' + idx);
  const marks = eStatuses(W).length + ((b.fieldStatus && Object.keys(b.fieldStatus).length) || 0);
  playSfx('rewind');
  if(card){ card.classList.remove('nem-back'); void card.offsetWidth; card.classList.add('nem-rewinding'); }
  setTimeout(()=>{
    if(ui.battle !== b) return;
    const before = W.hp;
    W.hp = W.maxHp;
    nemCleanse(W);
    const faded = nemFadeShadows();
    renderBattle();
    const c2 = document.getElementById('enemy-' + b.enemies.indexOf(W));
    if(c2) c2.classList.add('nem-back');
    drainHp('enemyHp-' + b.enemies.indexOf(W), Math.min(before, W.maxHp), W.hp, W.maxHp);
    const lead = kind === 'turn' ? `⏳ Wadjet slips back into the past — and steps out again, whole.`
               : kind === 'one'  ? `⏳ Brought to 1 HP, Wadjet vanishes — and steps back out of the past, unharmed!`
               : `⏳ He tears back through time, and steps out whole again.`;
    battleMsg(lead + (marks && kind !== 'argh' ? ' Every mark on him is gone.' : '') + (faded ? ' His shadows fade away.' : ''));
    renderStatusBadges();
    setTimeout(()=>{ if(ui.battle === b) next(); }, 850);
  }, 760);
}
/* every mark on him gone: his own, and your fields on their side */
function nemCleanse(W){
  const b = ui.battle;
  eStatuses(W).slice().forEach(st=> removeEStatus(W, st.type));
  if(b.fieldStatus) Object.keys(b.fieldStatus).forEach(k=>{ if(!(b.fieldStatus[k] && b.fieldStatus[k].unsweepable)) delete b.fieldStatus[k]; });
  if(W.hex) W.hex = 0;
  W.gooed = false; W._omen = 0;
}
/* ---------- his fifth turn: the shadows, and the light ---------- */
async function nemBeginCharge(done){
  const b = ui.battle, N = b.nem, W = nemWadjet();
  N.chargeStarted = true;
  nemSummonShadows();                                         // (drawn first: drawing the fight empties its message box)
  battleMsg(`Wadjet rears up — and two shadows peel away from him!`);
  await nemWait(1300);
  if(ui.battle !== b) return;
  N.charging = { left:NEM.charge };
  renderBattle();
  playSfx('power_up');
  battleMsg(`Light begins to gather in his hood: the <b>Prismatic Laser</b>! It fires in <b>${NEM.charge}</b> of his turns.`);
  await nemWait(1400);
  if(ui.battle !== b) return;
  await nemMKSay(`<b>"He can't turn time back while he gathers that light — bring him down, NOW, before it fires! Freeze him and the light waits. Muddle his shadows and they hit each other instead of you."</b>`);
  done();
}
function nemSummonShadows(){
  const b = ui.battle, W = nemWadjet();
  if(!W) return;
  const make = ()=>{
    const s = makeEnemy(NEM_SHADOW, W.level, { anyLevel:true, nerfed:false, ai:'best' });
    s.atk = Math.max(1, Math.round(W.atk * NEM.shadowAtk));
    s.maxHp = W.maxHp;
    s.cls = 'nem-shadow nem-shadow-in';
    nemArmShadow(s);
    return s;
  };
  b.enemies = [make(), W, make()];
  renderBattle();
  setTimeout(()=> nemShadows().forEach(s=> s.cls = 'nem-shadow'), 1400);
}
/* gone, as he turns back time (after a failed charge, or a laser fired) */
function nemFadeShadows(){
  const b = ui.battle, N = b && b.nem;
  if(!b || (N && N.charging)) return false;
  const live = nemShadows();
  if(!live.length) return false;
  live.forEach(s=>{
    const card = document.getElementById('enemy-' + b.enemies.indexOf(s));
    if(card) card.classList.add('nem-shadow-out');
    s._nemGone = true;
    s.cls = 'nem-shadow nem-shadow-gone';
  });
  return true;
}
/* one of his turns, gathering it: a turn closer — or the laser */
function nemChargeStep(e, next){
  const b = ui.battle, N = b.nem;
  b.acted = b.acted || [];
  if(!b.acted.includes(e)) b.acted.push(e);
  b.phase = 'resolving';
  N.charging.left--;
  renderStatusBadges();
  nemPrismLevel();
  if(N.charging.left > 0){
    playSfx('power_up');
    battleMsg(`Wadjet gathers the light… The Prismatic Laser fires ${N.charging.left === 1 ? '<b>on his next turn</b>' : `in <b>${N.charging.left}</b> of his turns`}!`);
    return setTimeout(()=>{ if(ui.battle === b) next(); }, 1100);
  }
  return nemFireLaser(next);
}
function nemPrismLevel(){
  const b = ui.battle, N = b && b.nem, W = nemWadjet();
  if(!W) return;
  const card = document.getElementById('enemy-' + b.enemies.indexOf(W));
  if(!card) return;
  const lv = N && N.charging ? NEM.charge - N.charging.left + 1 : 0;
  card.classList.toggle('nem-charging', lv > 0);
  ['nem-c1', 'nem-c2', 'nem-c3'].forEach((k, j)=> card.classList.toggle(k, lv === j + 1));
}
/* ---------- the Prismatic Laser: 5,000 to every one of yours, through everything ---------- */
function nemFireLaser(next){
  const b = ui.battle, N = b.nem, W = nemWadjet();
  N.charging = null; N.fired = true;
  nemPrismLevel();
  renderStatusBadges();
  battleMsg(`<b>The Prismatic Laser fires!</b>`);
  const field = playerField().filter(m=> m.currentHp > 0);
  try { playEffect('Prismatic Laser', { type:'Psychic', from:'enemy-' + b.enemies.indexOf(W), targets:field.map(m=> pid('playerBob', m)), foe:true }); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  setTimeout(()=>{
    if(ui.battle !== b) return;
    const all = healableAllies().filter(m=> m.currentHp > 0);
    const held = [], fell = [], stood = [];
    all.forEach(m=>{
      const before = m.currentHp, max = monMaxHp(m);
      if(before > NEM.laser) { m.currentHp = before - NEM.laser; stood.push(m); }
      else if(typeof bedrockReady === 'function' && bedrockReady(m)){ bedrockSave(m); m.currentHp = 1; held.push(m); }
      else { m.currentHp = 0; fell.push(m); }
      const el = document.getElementById(pid('playerBob', m));
      if(el && playerField().includes(m)){ flashHit(el); drainHp(pid('playerHp', m), before, m.currentHp, max); showDamageNumber(pid('playerBob', m), before - m.currentHp); }
    });
    if(held.length) held.forEach(m=> floatOver(m, 'HOLDS ON'));
    const nm = l=> l.map(m=> escapeHtml(displayName(m)));
    const list = l=> l.length > 1 ? l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1] : l[0];
    const said = `${NEM_PRISM} <b>5,000</b> to every one of yours — through every shield and every dodge.` +
      (held.length ? ` 🦋 Metamorph holds ${list(nm(held))} on 1 HP!` : '') +
      (stood.length ? ` ${list(nm(stood))} still stand${stood.length > 1 ? '' : 's'}.` : '') +
      (fell.length && !held.length && !stood.length ? ' Not one of them is left standing…' : '');
    battleMsg(said);
    renderStatusBadges();
    saveProfile();
    /* the bars drained: the cards drawn as they now are — and the words said again (drawing empties the box) */
    setTimeout(()=>{
      if(ui.battle !== b) return;
      renderBattle(); renderStatusBadges(); battleMsg(said);
      const phx = fell.find(m=> typeof rebirthDue === 'function' && rebirthDue(m));
      const on = ()=> setTimeout(()=>{ if(ui.battle === b) next(); }, 900);
      if(phx) return setTimeout(()=>{ if(ui.battle === b) offerRebirth(on, on, phx); }, 900);
      setTimeout(on, 500);
    }, 800);
  }, 1500);
}
/* ---------- "Argh!": brought to 1 HP while he gathers it ---------- */
function nemArgh(next){
  const b = ui.battle, N = b.nem, W = nemWadjet();
  N.charging = null; N.broke = true;
  nemPrismLevel();
  renderStatusBadges();
  battleMsg(`Wadjet: <b>"Argh!"</b> — the light in his hood shatters!`);
  try { playEffect('Prism Shatter', { type:'Psychic', from:'enemy-' + b.enemies.indexOf(W), foe:true, aside:true }); } catch(e){}
  playSfx('hit_taken');
  if(typeof buzz === 'function') buzz('argh');
  setTimeout(()=>{ if(ui.battle === b) nemRewind('argh', next); }, 1500);
}
/* ---------- ten turns: he is spent, and flees ---------- */
function nemFlee(){
  const b = ui.battle, N = b.nem, W = nemWadjet();
  N.fled = true;
  b.phase = 'resolving';
  renderBattle();
  battleMsg(`Wadjet's coils sag. <b>"Hsss… Enough. This is not the end, little trainer."</b>`);
  setTimeout(()=>{
    if(ui.battle !== b) return;
    const card = W && document.getElementById('enemy-' + b.enemies.indexOf(W));
    if(card){ card.classList.remove('nem-back'); void card.offsetWidth; card.classList.add('nem-rewinding', 'nem-leaving'); }
    nemShadows().forEach(s=>{ const c = document.getElementById('enemy-' + b.enemies.indexOf(s)); if(c) c.classList.add('nem-shadow-out'); s._nemGone = true; });
    playSfx('rewind');
    battleMsg(`He slips back into the past — and this time he does not come back out. <b>You held on!</b>`);
    setTimeout(()=>{
      if(ui.battle !== b) return;
      if(W) W._nemGone = true;
      onChallengeWon();
    }, 2200);
  }, 1900);
}
/* ---------- the opening: the Monkey King's word, before the first turn ---------- */
async function nemIntro(done){
  await nemMKSay(`<b>"Careful! That snake can turn back time — hit him and he just steps out of the past again. Don't try to beat him: hold on! Shields, dodges, heals. He can't keep it up for ever."</b>` +
    `<br><br><i>Survive <b>${NEM.turns}</b> turns. His Hood of Dread strikes all of yours on the field at <b>3×</b> his ATK and leaves a Curse and Venom on your side.</i>`);
  done();
}
function nemMKFace(px){ return monPortrait('monkey_king', px || 64, { view:'front', bare:true, crowned:true }); }
function nemMKSay(html){
  const b = ui.battle;
  if(!b || typeof sceneSay !== 'function') return Promise.resolve();
  b.hold = (b.hold || 0) + 1;
  return sceneSay([nemMKFace(64)], 'The Monkey King', html).then(()=>{ if(ui.battle === b) b.hold = Math.max(0, (b.hold || 1) - 1); });
}

/* ============================================================
   THE MONKEY KING'S WORD, EACH TURN OF YOURS — and the button he means, glowing
   ============================================================ */
const NEM_GUARD_STONES = { Fairy:4, Steel:6, Flying:5, Ground:4, Grass:3 };          // what holds you up, best first
const NEM_CC_STONES = { Water:6, Psychic:5 };                                         // what holds him (or them) back
function nemMoveScore(mv, mode, want){
  if(!mv || !mv.available || mv.spent || mv.slot === 'UltraStone' && mode === 'guard') return 0;
  const P = partyStatuses();
  if(mode === 'guard'){
    if(mv.isStone && mv.stoneTier === 'veryhigh'){
      const s = NEM_GUARD_STONES[mv.stoneType] || 0;
      if(mv.stoneType === 'Fairy' && (P.curse || P.venom) && !P.diamondDust) return 9;   // his marks on you: sweep them
      if(mv.stoneType === 'Steel' && P.steelAegis) return 1;
      if(mv.stoneType === 'Flying' && P.mirage) return 1;
      if(mv.stoneType === 'Ground' && P.spikeArmour) return 1;
      if(mv.stoneType === 'Fairy' && P.diamondDust) return 1;
      return s;
    }
    if(mv.vita || mv.mend || mv.revitalise || mv.conversio || mv.transfuse) return want.hurt ? 6 : 3;
    if(mv.shell || mv.barrier || mv.iceBarrier || mv.lithify || mv.soul || mv.aria) return 5;
    if(mv.grant && (mv.grant.lurk || mv.grant.invisible || mv.grant.airborne)) return 4;
    return 0;
  }
  /* while he gathers it: freeze him, muddle (or take hold of) his shadows */
  if(mv.isStone && mv.stoneTier === 'veryhigh') return NEM_CC_STONES[mv.stoneType] || 0;
  if(mv.paralyse || mv.stunHit || mv.sleepHit || mv.charm) return 2;
  return 0;
}
function nemHardest(moves){
  let best = -1, bi = -1;
  moves.forEach((mv, i)=>{
    if(!mv || !mv.available || mv.spent || mv.mult == null) return;
    const v = mv.mult * (mv.hits > 1 && !mv.split ? mv.hits : 1) * (mv.slot === 'UltraStone' ? 1.5 : 1);
    if(v > best){ best = v; bi = i; }
  });
  return bi;
}
function nemSuggest(mon){
  const b = ui.battle, N = b && b.nem;
  if(!N || !mon) return null;
  const moves = unlockedMoves(mon);
  const mode = N.charging ? 'cc' : 'guard';
  const want = { hurt:livingField().some(m=> m.currentHp < monMaxHp(m) * 0.6) };
  const ranked = moves.map((mv, i)=> ({ i, mv, s:nemMoveScore(mv, mode, want) })).filter(x=> x.s > 0).sort((a, c)=> c.s - a.s);
  const picks = ranked.slice(0, 2).map(x=> x.i);
  let line;
  const nm = x=> `<b>${escapeHtml(moves[x].name)}</b>`;
  if(mode === 'guard'){
    if(picks.length) line = picks.length > 1 ? `"${nm(picks[0])} — or ${nm(picks[1])}! Hold on and outlast him."` : `"${nm(picks[0])}! Hold on and outlast him."`;
    else line = `"Nothing to shield you there — switch to one who can shield or heal, or just hold on!"`;
    const P = partyStatuses();
    if((P.curse || P.venom) && !picks.some(x=> moves[x].stoneType === 'Fairy')) line += ` <i>(Diamond Dust sweeps his Curse and Venom away.)</i>`;
  } else {
    const hard = nemHardest(moves);
    if(picks.length) line = `"${nm(picks[0])}${picks.length > 1 ? ` or ${nm(picks[1])}` : ''}! Then hit him with everything you've got — he can't turn it back now!"`;
    else if(hard >= 0){ picks.push(hard); line = `"Hit him with ${nm(hard)} — everything you've got, before the light is full!"`; }
    else line = `"Bring him down — before the light is full!"`;
  }
  return { picks, line, mode };
}
function nemCoach(mon){
  const b = ui.battle;
  if(!b || !b.nem || b.phase !== 'player' || b.nem.fled) return;
  const s = nemSuggest(mon || controlMon() || leaderMon());
  if(!s) return;
  b.nem.tip = s;
  nemCoachGlow();
  battleMsg(`<span class="nem-mk">${nemMKFace(28)}</span> ${s.line}`);
}
function nemCoachGlow(){
  const b = ui.battle, t = b && b.nem && b.nem.tip;
  document.querySelectorAll('.move-btn.nem-tip').forEach(el=> el.classList.remove('nem-tip'));
  if(!t || b.phase !== 'player') return;
  t.picks.forEach(i=>{ const el = document.querySelector(`.move-btn[data-move="${i}"]`); if(el && !el.disabled) el.classList.add('nem-tip'); });
}

/* ============================================================
   INTO THE ENGINE — each only in this fight (ui.battle.nem)
   ============================================================ */
/* his Hood of Dread, and theirs; never the shadows' Night Venom (only your Mind Control uses it) */
if(typeof enemyMoveFor === 'function'){
  const _nemMoveFor = enemyMoveFor;
  enemyMoveFor = function(e){
    if(e && (e.nemRole === 'wadjet' || e.nemRole === 'shadow')) return (MOVES[e.species] || []).find(r=> r[1] === 'Hood of Dread') || _nemMoveFor.apply(this, arguments);
    return _nemMoveFor.apply(this, arguments);
  };
}
/* his place in the order (runTurnStep → runSingleEnemyTurn): back through time first, every mark gone — not while he
   gathers the light, when only a freeze takes his turn (a stun, a nap, a muddle, a charm: nothing else holds it back) —
   and on his fifth, the shadows and the light. The shadows, risen in his turn, take their first places the next. */
if(typeof runSingleEnemyTurn === 'function'){
  const _nemSingle = runSingleEnemyTurn;
  runSingleEnemyTurn = function(e){
    const b = ui.battle, N = b && b.nem;
    if(!N || !e || e.nemRole !== 'wadjet' || N.fled || e.hp <= 0) return _nemSingle.apply(this, arguments);
    const self = this, args = arguments;
    const go = ()=>{ if(ui.battle === b) _nemSingle.apply(self, args); };
    if(N.arghDue || N.rewindDue) return nemPending(()=>{ if(ui.battle === b) runSingleEnemyTurn(e); });
    if(N.charging){
      if(getEStatus(e, 'iceTomb')) return go();                       // frozen: the engine's own freeze takes the turn
      return nemChargeStep(e, ()=>{ if(ui.battle === b) advanceTurn(); });
    }
    nemRewind('turn', ()=>{
      if(ui.battle !== b) return;
      if(!N.chargeStarted && roundNo() >= NEM.chargeAt) return nemBeginCharge(()=>{ if(ui.battle === b) advanceTurn(); });
      go();
    });
  };
}
/* anything still to happen to him, before the next of theirs moves */
if(typeof runEnemyAttack === 'function'){
  const _nemRunEnemy = runEnemyAttack;
  runEnemyAttack = function(i){
    const b = ui.battle, N = b && b.nem;
    if(N && (N.arghDue || N.rewindDue)) return nemPending(()=>{ if(ui.battle === b) runEnemyAttack(i); });
    return _nemRunEnemy.apply(this, arguments);
  };
}
if(typeof advanceTurn === 'function'){
  const _nemAdvance = advanceTurn;
  advanceTurn = function(){
    const b = ui.battle, N = b && b.nem;
    if(N && (N.arghDue || N.rewindDue)){ const self = this, args = arguments; return nemPending(()=>{ if(ui.battle === b) _nemAdvance.apply(self, args); }); }
    return _nemAdvance.apply(this, arguments);
  };
}
/* ten turns over: he is spent */
if(typeof beginRound === 'function'){
  const _nemBeginRound = beginRound;
  beginRound = function(){
    const b = ui.battle, N = b && b.nem;
    if(N && !N.fled && !b.introDue && (b.roundNo || 0) >= NEM.turns) return nemFlee();
    return _nemBeginRound.apply(this, arguments);
  };
}
/* blows pass through a shadow */
if(typeof landStrike === 'function'){
  const _nemLand = landStrike;
  landStrike = function(h){
    if(h && h.t && h.t.nemShadow && !h.t._nemGone){ h.dmg = 0; h.raw = 0; h.blocked = 0; h.oldHp = h.newHp = h.t.hp; h.passed = true; return 0; }
    return _nemLand.apply(this, arguments);
  };
}
if(typeof reportHits === 'function'){
  const _nemReport = reportHits;
  reportHits = function(hits){
    if(!nemOn()) return _nemReport.apply(this, arguments);
    const list = (hits || []).filter(Boolean);
    list.filter(h=> h.passed).forEach(h=> floatMiss('enemy-' + h.idx, 'PASSES THROUGH'));
    return _nemReport.call(this, list.filter(h=> !h.passed));
  };
}
/* the Monkey King's word as each of yours chooses, and his glow kept on the button through every drawing */
if(typeof beginPlayerPhase === 'function'){
  const _nemPlayerPhase = beginPlayerPhase;
  beginPlayerPhase = function(msg, mon){
    const r = _nemPlayerPhase.apply(this, arguments);
    if(nemOn()) nemCoach(mon);
    return r;
  };
}
if(typeof renderBattle === 'function'){
  const _nemRenderBattle = renderBattle;
  renderBattle = function(){
    const r = _nemRenderBattle.apply(this, arguments);
    if(nemOn()){
      nemCss(); nemPrismLevel(); nemCoachGlow();
      /* drawn again in your turn (its box back to "Choose a move."): the Monkey King's word stays said */
      const b = ui.battle, t = b.nem.tip, el = document.getElementById('battleMsg');
      if(t && b.phase === 'player' && !b.nem.fled && el && el.textContent.trim() === 'Choose a move.') battleMsg(`<span class="nem-mk">${nemMKFace(28)}</span> ${t.line}`);
    }
    return r;
  };
}
/* his marks: Return to the Past, the turns he has left, the light gathering; and each shadow's */
if(typeof renderStatusBadges === 'function'){
  const _nemBadges = renderStatusBadges;
  renderStatusBadges = function(){
    const r = _nemBadges.apply(this, arguments);
    const b = ui.battle, N = b && b.nem;
    if(!N) return r;
    (b.enemies || []).forEach((e, i)=>{
      const slot = document.getElementById('enemyStatus-' + i);
      if(!slot || e.hp <= 0) return;
      /* each a symbol, as every other mark is (symbolizePills): tapped, its card; a number under it where it counts */
      const pill = (key, sym, full, sub, last)=> `<span class="status-pill foe nem-pill sym${last ? ' last' : ''}"${pillAt(key, 'e' + i)} data-sym="${sym}" data-full="${escapeHtml(sym + ' ' + full)}" aria-label="${escapeHtml(full)}">` +
        `${symHtml(sym)}${sub != null ? `<sub>${sub}</sub>` : ''}</span>`;
      if(e.nemRole === 'wadjet'){
        const add = [], n = nemTurnsLeft();
        if(!N.charging) add.push(pill('nemPast', NEM_SYM.past, 'Return to the Past'));
        add.push(pill('nemEnergy', '⏳', `${n} turn${n === 1 ? '' : 's'} left`, n, n === 1));
        if(N.charging) add.push(pill('nemCharge', NEM_SYM.prism, `Prismatic Laser: ${N.charging.left}`, N.charging.left, N.charging.left === 1));
        slot.insertAdjacentHTML('afterbegin', add.join(''));
      }
      if(e.nemRole === 'shadow') slot.insertAdjacentHTML('afterbegin', pill('nemShadow', NEM_SYM.shadow, 'Shadow'));
    });
    return r;
  };
}

/* ============================================================
   THE ART
   ============================================================ */
/* Hood of Dread (his, now a 3.0x blow on all of yours): the hood flares — and a dark wave of venom rolls over them */
if(typeof FX_MOVES !== 'undefined' && typeof fxAdd === 'function'){
  const hood = FX_MOVES['Hood of Dread'] || {};
  FX_MOVES['Hood of Dread'] = { dur:1300, hold:420,
    cast(ctx){
      try { if(hood.cast) hood.cast(ctx); } catch(e){}
      const a = ctx.from;
      fxTargets(ctx).forEach((t, k)=> fxAdd({ layer:fxLayerFor('player'), dur:700, step(L, tt){
        if(tt < 240) return;
        const u = Math.min(1, (tt - 240) / 260), cv = tt < 560 ? 1 : 1 - (tt - 560) / 140;
        const x = a.x + (t.x - a.x) * u, y = a.y + (t.y - a.y) * u;
        fxDisc(L, x, y, 7 + 3 * u, FX_NIGHT[4], cv); fxDisc(L, x, y, 5 + 2 * u, FX_NIGHT[2], cv); fxDisc(L, x - 1, y - 1, 2, fxRGB('#8be06a'), cv);
      } }));
    },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side);
      FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k, big:1.35 });
      fxSpray(layer, fxBurstParts(at.x, at.y, 10, { seed:ctx.seed + k + 3, vmin:40, vmax:110, ramp:[fxRGB('#d8ffc2'), fxRGB('#8be06a'), fxRGB('#3f9a2a'), FX_NIGHT[3]], grav:60, lmin:400, lmax:700 }), 900);
    } };
  /* a shadow's Night Venom (yours to aim, by Mind Control): a dark fang of venom, trailing, into the one it strikes — and
     a burst of night and green */
  FX_MOVES['Night Venom'] = { dur:1100, hold:500,
    cast(ctx){
      const a = ctx.from;
      if(!a) return;
      fxTargets(ctx).forEach(t=> fxAdd({ layer:'front', dur:620, step(L, tt){
        if(tt < 110) return;
        const u = Math.min(1, (tt - 110) / 390), cv = tt < 540 ? 1 : 1 - (tt - 540) / 80;
        for(let j = 4; j >= 1; j--){ const v = Math.max(0, u - j * 0.07); fxDisc(L, a.x + (t.x - a.x) * v, a.y + (t.y - a.y) * v, 6 - j, FX_NIGHT[3], cv * (1 - j * 0.18)); }
        const x = a.x + (t.x - a.x) * u, y = a.y + (t.y - a.y) * u;
        fxDisc(L, x, y, 9, FX_NIGHT[4], cv); fxDisc(L, x, y, 6, FX_NIGHT[2], cv); fxDisc(L, x - 2, y - 2, 2.5, fxRGB('#8be06a'), cv);
      } }));
    },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side);
      FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k, big:1.6 });
      fxSpray(layer, fxBurstParts(at.x, at.y, 16, { seed:ctx.seed + k + 5, vmin:50, vmax:140, ramp:[fxRGB('#d8ffc2'), fxRGB('#8be06a'), fxRGB('#3f9a2a'), FX_NIGHT[3]], grav:70, lmin:450, lmax:800 }), 1000);
    } };
  /* the Prismatic Laser: a thick band of every colour from his hood across all of yours, a white heart, then white light */
  const RAINBOW = ['#ff4d4d', '#ff9a3c', '#ffe34d', '#5be06a', '#4db8ff', '#7a6cff', '#c86cff'].map(fxRGB);
  FX_MOVES['Prismatic Laser'] = { dur:1600, hold:1300,
    cast(ctx){
      const a = ctx.from;
      if(typeof fxDimOn === 'function'){ fxDimOn(0.5); fxLater(1700, ()=> fxDimOff()); }
      fxAdd({ layer:'front', dur:500, step(L, t){ const r = 4 + t / 500 * 14; RAINBOW.forEach((c, j)=> fxRing(L, a.x, a.y - a.h * 0.15, r - j * 1.6, 2, c, 1 - t / 600)); } });
      fxTargets(ctx).forEach(b=> fxAdd({ layer:'front', dur:1500, step(L, t){
        if(t < 420) return;
        const cv = t < 1250 ? 1 : 1 - (t - 1250) / 250, dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1, px = -dy / n, py = dx / n;
        const wob = Math.sin(t * 0.05) * 0.8;
        RAINBOW.forEach((c, j)=>{ const o = (j - 3) * 2.2 + wob; fxLine(L, a.x + px * o, a.y - a.h * 0.15 + py * o, b.x + px * o, b.y + py * o, c, 3, cv); });
        fxLine(L, a.x, a.y - a.h * 0.15, b.x, b.y, fxRGB('#ffffff'), 3, cv);
      } }));
      fxLater(600, ()=>{ try { fxShake(6, 520); } catch(e){} });
    },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side);
      fxFlash(layer, at, 26, fxRGB('#ffffff'), 140);
      fxSpray(layer, fxBurstParts(at.x, at.y, 16, { seed:ctx.seed + k, vmin:60, vmax:160, ramp:RAINBOW, lmin:350, lmax:650 }), 800);
    } };
  /* the light in his hood shattering: shards of every colour, flying */
  FX_MOVES['Prism Shatter'] = { side:'self', dur:900,
    cast(ctx){
      const a = ctx.from;
      fxFlash(fxLayerFor('enemy'), { x:a.x, y:a.y - a.h * 0.2 }, 16, fxRGB('#ffffff'), 120);
      fxSpray('front', fxBurstParts(a.x, a.y - a.h * 0.2, 26, { seed:ctx.seed, vmin:90, vmax:220, ramp:RAINBOW, grav:140, lmin:450, lmax:800 }), 900);
    } };
}

function nemCss(){
  if(document.getElementById('nemCss')) return;
  const st = document.createElement('style');
  st.id = 'nemCss';
  st.textContent = `
  .ico-venom, .ico-prism{ width:1.05em; height:1.05em; vertical-align:-.16em; display:inline-block; }
  .nem-mk{ display:inline-block; width:28px; height:28px; vertical-align:-8px; margin-right:2px; }
  .nem-mk img{ width:28px !important; height:28px !important; }
  /* the button he means */
  .move-btn.nem-tip{ box-shadow:0 0 0 3px #ffd36a, 0 0 16px 4px rgba(255,200,80,.75), 0 3px 0 var(--cinnabar-dark); animation:nemTip 1.3s ease-in-out infinite; }
  @keyframes nemTip{ 0%,100%{ box-shadow:0 0 0 3px #ffd36a, 0 0 10px 2px rgba(255,200,80,.55), 0 3px 0 var(--cinnabar-dark); } 50%{ box-shadow:0 0 0 3px #fff2c2, 0 0 20px 6px rgba(255,200,80,.9), 0 3px 0 var(--cinnabar-dark); } }
  /* back through time: he flickers, tears like a tape running back, and is gone — then steps back out */
  .enemy-card.nem-rewinding .bob{ animation:nemRewind .76s steps(12) forwards; }
  @keyframes nemRewind{
    0%{ opacity:1; transform:translateX(0); filter:none; }
    20%{ opacity:.9; transform:translateX(-5px) skewX(-8deg); filter:hue-rotate(60deg) saturate(1.6); }
    40%{ opacity:.7; transform:translateX(6px) skewX(9deg); filter:hue-rotate(160deg) brightness(1.4); }
    60%{ opacity:.45; transform:translateX(-4px) scaleY(.9); filter:hue-rotate(260deg) brightness(1.8) drop-shadow(0 0 10px #b98cff); }
    100%{ opacity:0; transform:translateX(0) scaleY(.2); filter:brightness(2.4) drop-shadow(0 0 14px #c9a8ff); }
  }
  .enemy-card.nem-back .bob{ animation:nemBack .6s ease-out; }
  @keyframes nemBack{ 0%{ opacity:0; transform:scaleY(.3); filter:brightness(2.2) drop-shadow(0 0 14px #c9a8ff); } 60%{ opacity:1; transform:scaleY(1.06); } 100%{ opacity:1; transform:none; filter:none; } }
  .enemy-card.nem-leaving .bob{ animation:nemRewind 1.4s steps(16) forwards; }
  .enemy-card.nem-argh{ animation:nemArgh .5s ease-in-out 2; }
  @keyframes nemArgh{ 0%,100%{ transform:none; } 20%{ transform:translateX(-6px) rotate(-3deg); } 40%{ transform:translateX(6px) rotate(3deg); } 60%{ transform:translateX(-4px); } 80%{ transform:translateX(4px); } }
  /* the light gathering in his hood: a prism of every colour, bigger each turn */
  .enemy-card.nem-charging .bob::after{ content:''; position:absolute; left:50%; top:22%; width:14%; aspect-ratio:1; z-index:4; pointer-events:none;
    transform:translate(-50%,-50%) rotate(45deg); border-radius:24%;
    background:conic-gradient(#ff4d4d, #ffe34d, #5be06a, #4db8ff, #c86cff, #ff4d4d);
    box-shadow:0 0 10px 3px rgba(255,255,255,.85), 0 0 26px 8px rgba(200,170,255,.6); animation:nemPrism 1.2s linear infinite; }
  .enemy-card.nem-c2 .bob::after{ width:20%; box-shadow:0 0 14px 5px rgba(255,255,255,.9), 0 0 34px 12px rgba(200,170,255,.7); }
  .enemy-card.nem-c3 .bob::after{ width:27%; box-shadow:0 0 18px 7px rgba(255,255,255,.95), 0 0 46px 18px rgba(200,170,255,.8); animation-duration:.7s; }
  @keyframes nemPrism{ from{ transform:translate(-50%,-50%) rotate(45deg); filter:hue-rotate(0deg); } to{ transform:translate(-50%,-50%) rotate(405deg); filter:hue-rotate(360deg); } }
  /* his shadows: him, dark, wreathed in violet; rising off him, and fading */
  .enemy-card.nem-shadow .mon-sprite{ filter:brightness(.24) contrast(1.35) saturate(.4) drop-shadow(0 0 6px rgba(150,100,255,.85)) drop-shadow(0 0 14px rgba(90,40,200,.5)) !important; }
  .enemy-card.nem-shadow .bob{ opacity:.9; }
  .enemy-card.nem-shadow-in .bob{ animation:nemShadowIn 1.2s ease-out; }
  @keyframes nemShadowIn{ 0%{ opacity:0; transform:translateY(18px) scale(.6); } 100%{ opacity:.9; transform:none; } }
  .enemy-card.nem-shadow-out, .enemy-card.nem-shadow-gone{ opacity:0; transition:opacity .9s ease; }
  .enemy-card.nem-shadow.fainted .bob{ filter:none; }
  .enemy-card.nem-shadow .name-plate .hp-bar, .enemy-card.nem-shadow .name-plate [id^="enemyHp-"]{ opacity:.45; }
  @media (prefers-reduced-motion: reduce){
    .enemy-card.nem-rewinding .bob, .enemy-card.nem-back .bob, .enemy-card.nem-argh, .enemy-card.nem-shadow-in .bob{ animation:none; }
    .enemy-card.nem-charging .bob::after{ animation:none; }
    .move-btn.nem-tip{ animation:none; }
  }`;
  document.head.appendChild(st);
}
