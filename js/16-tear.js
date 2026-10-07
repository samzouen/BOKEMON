/* ==========================================================
   16-tear.js — THE SPACE-TIME TEAR (2.94)
   Part of 博刻MON. Loaded as a classic script (before 11-app.js): everything
   shares one global scope.

   Where Cyborg — the Padrino's artificial monster, the time monster itself —
   escapes at the end of Region 5's climax, a tear in space and time stays
   open. The story will open it (r5().tearOpen); until the climax is built,
   the developer profile can go there. From the Challenge page it is one step
   away (the story's ending will also leave it on the map), with two ways in:
     · Enter the space-time tear — the way into Region 6 (not built yet);
     · Challenge the past — the Padrino's battle again, as a WEEKLY challenge.

   CHALLENGE THE PAST (3.00: the Padrino's fight in the villa, as the
   designer set it — handover part 6 §12)
   - Seven rounds. A round is his team ONE AT A TIME: the Rhino, the Fox, the
     Shadow, the Jackal and the Raven (TEAR_TEAM), crowned, at the level of
     your highest-levelled monster or 110, whichever is higher — no cap here
     (anyLevel; 2.99 had held them at 100) — and last of all Cyborg, at 200.
   - Beat Cyborg and the round is won: it rewinds the team — and itself — and
     he starts again from the Rhino. Cyborg fights now (2.94–2.99 it stood
     aside, never acting, never below 1 HP): Spacetime Rift Max, 1.5× its
     attack, 1.1× more for every Spacetime Fracture, multiplying; Futuresight
     dodges half of every attack and each dodge is a fracture. A ✦ Curse
     quiets Futuresight; a Diamond Dust sweeps the fractures away.
   - Each round won pays its medals ONCE A WEEK (TEAR.pay; the week starts on
     Monday, the player's own time). Lose or leave, and what was earned stays
     earned; a new run starts again at round 1 and pays only the rounds not
     yet paid this week. Once all seven are paid, the past waits for Monday.
   - XP: each round won, its six waves' worth (2 a wave, as any trainer's
     fight), to the whole party and bonded companions, with no region cap —
     only a monster's own Crown and ceilings stop it (levelCap, ui.xpNoCap).
   - All seven in one run: the first time ever, the Mind Stone; every time
     after that, 18 fights' worth more for the whole party.
   - Every quiz in it asks for the silver and gold words (pickWords).
   - A loss costs nothing but the fall (10% health, as any): no XP is lost —
     the designer (3.01): "No XP penalty for losses in the rift, let the
     player navigate it with very high skill stones of their own". The
     challenge and the tear's page say so.
     Each round won counts as a battle for the eye break and the day's count;
     a break that falls due is taken between rounds.
   ========================================================== */
const TEAR = {
  rounds: 7,
  wavesPerRound: 6,
  /* round by round, paid once a week */
  pay: [ { bronze:15 }, { bronze:30 }, { silver:10 }, { silver:20 }, { gold:5 }, { gold:10 }, { gold:15 } ],
  bonusFights: 18,      // a full clear once the Mind Stone is yours
  cyborgLevel: 200,     // the one monster of theirs past 100 (SPECIES.cyborg.noLevelCap)
  floor: 110,           // (3.00) his five: your best monster's level, or this — no cap
  /* How hard his monsters fight, wave by wave within a round (the Rhino, Fox
     and Shadow with their Power2, the Jackal and Raven with their best;
     Cyborg always its best), and how much protein they carry. The knobs to
     turn if a round is too hard or too easy. */
  ai: ['power2', 'power2', 'power2', 'best', 'best', 'best'],
  supplements: 0,
  rewindMs: 1800,       // the rewind between rounds
};
/* (3.00) The Padrino's team, one at a time, in the order of his fight in the
   villa — and then Cyborg (tearWaves). Until 2.99 it was six pairs of the
   Family's elites, with Cyborg standing between each pair. */
const TEAR_TEAM = ['ground_starter', 'psychic_starter', 'ghost_starter', 'physical_starter', 'flying_starter'];
const TEAR_MEDAL = { bronze:'🥉', silver:'🥈', gold:'🥇' };

/* ---------- where it is, and who may go ---------- */
function tearOpen(){
  return !!(state && state.progress && (state.progress.region5 || {}).tearOpen) || (typeof isDev === 'function' && isDev());
}

/* ---------- the week ---------- */
/* Midnight on the Monday that starts the week holding `d` (now, if not given). */
function tearWeekStart(d){
  const x = new Date(d == null ? Date.now() : d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function tearWeekKey(d){ const w = tearWeekStart(d); return w.getFullYear() + '-' + (w.getMonth() + 1) + '-' + w.getDate(); }
function tearNextWeek(){ const w = tearWeekStart(); w.setDate(w.getDate() + 7); return w; }
/* The save's record: this week's paid rounds, the Mind Stone, clears. A new
   week clears the paid rounds and nothing else. */
function tearState(){
  const p = state.progress;
  if(!p.tear || typeof p.tear !== 'object') p.tear = { week:'', paid:[], stone:false, clears:0, best:0, runs:0 };
  const t = p.tear;
  if(!Array.isArray(t.paid)) t.paid = [];
  const wk = tearWeekKey();
  if(t.week !== wk){ t.week = wk; t.paid = []; }
  return t;
}
function tearPaidCount(){ const t = tearState(); return TEAR.pay.filter((_, i)=> !!t.paid[i]).length; }
function tearAllPaid(){ return tearPaidCount() >= TEAR.rounds; }
const tearCap = s=> s.charAt(0).toUpperCase() + s.slice(1);
/* a count in words, for the boys ("seven rounds"); figures past twelve */
const tearWord = n=> ['no','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'][n] || String(n);
function tearPayText(pay){ return Object.entries(pay).map(([k, n])=> `${TEAR_MEDAL[k]} ${n} ${tearCap(k)}`).join(' + '); }
function tearDayName(d){
  try { return d.toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long' }); }
  catch(e){ return 'Monday'; }
}

/* ---------- the Challenge page's card, and the tear itself ---------- */
function tearChallengeCard(){
  tearCss();
  const n = tearPaidCount();
  return `
    <div class="challenge-card" id="cTear" style="cursor:pointer;">
      <span class="tear-mini" aria-hidden="true">${tearGalaxy()}</span>
      <div style="flex:1;">
        <div class="cc-title">The space-time tear</div>
        <div class="cc-desc">Where Cyborg fled. <b>Challenge the past</b> once a week — ${n} of ${TEAR.rounds} rounds won this week.</div>
      </div>
    </div>`;
}
function renderTear(){
  if(!tearOpen()) return go('challenge');
  tearCss();
  setScreenBg('tear');
  $('#brandSub').textContent = 'The space-time tear';
  const t = tearState();
  const all = tearAllPaid();
  const day = tearDayName(tearNextWeek());
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Challenge</button>
    <div class="tear-screen">
      <div class="screen-title">The space-time tear</div>
      <div class="tear-wrap" aria-hidden="true">${tearGalaxy()}</div>
      <div class="tear-say">Cyborg fled through here. It hums like a held breath.</div>
      <button class="btn btn-primary tear-btn" id="tearEnter">Enter the space-time tear</button>
      <button class="btn btn-primary tear-btn" id="tearPast" ${all ? 'disabled' : ''}>Challenge the past</button>
      <div class="tear-week">
        <div class="tw-title">This week's rounds</div>
        <div class="tw-rounds">${TEAR.pay.map((p, i)=>{
          const [k, n] = Object.entries(p)[0];
          return `<div class="tw-round ${t.paid[i] ? 'paid' : ''}" data-round="${i + 1}"><b>${i + 1}</b><span>${TEAR_MEDAL[k]}${n}</span>${t.paid[i] ? '<i>✓</i>' : ''}</div>`;
        }).join('')}</div>
        <div class="tw-note">${all
          ? `All ${tearWord(TEAR.rounds)} won this week. The past opens again on <b>${escapeHtml(day)}</b>.`
          : `Each round pays once a week; the next week starts on <b>${escapeHtml(day)}</b>. Lose, and you keep what you won, and no XP is taken — a new try starts again at round 1.`}</div>
        <div class="tw-note">${t.stone
          ? `🌀 You hold the Mind Stone. All ${tearWord(TEAR.rounds)} in one go: <b>+${TEAR.bonusFights} fights' worth</b> of XP for the whole team.`
          : `All ${tearWord(TEAR.rounds)} in one go: <b>🌀 the Mind Stone</b>.`}</div>
        <div class="tw-note">Every move here asks for your <b>silver and gold words</b>.</div>
      </div>
    </div>`;
  $('#backBtn').addEventListener('click', ()=> go('challenge'));
  $('#tearEnter').addEventListener('click', ()=> toast('Beyond the tear: coming soon.'));
  $('#tearPast').addEventListener('click', ()=> tearChallenge());
}

/* ---------- Challenge the past ---------- */
/* (3.00) His five: the level of your highest-levelled monster, or 110,
   whichever is higher — no cap here (2.99 held them at 100). */
function tearFoeLevel(){
  const top = Math.max(0, ...battleParty().map(m=> m.level || 1));
  return Math.max(TEAR.floor, Math.min(LEVEL_MAX, top));
}
/* All seven rounds' waves: in each, his monsters one at a time (as many as
   wavesPerRound leaves room for — six: all five) and then Cyborg, always the
   round's last. */
function tearWaves(){
  const L = tearFoeLevel();
  const n = Math.max(1, Math.min(TEAR_TEAM.length + 1, TEAR.wavesPerRound));
  const waves = [];
  for(let r = 0; r < TEAR.rounds; r++){
    TEAR_TEAM.slice(0, n - 1).forEach((sp, w)=> waves.push([{ species:sp, level:L, ai:TEAR.ai[w] || 'best', crowned:true,
      supplements:TEAR.supplements, nerfed:false, anyLevel:true }]));
    waves.push([{ species:'cyborg', level:TEAR.cyborgLevel, ai:'best', crowned:true, nerfed:false, boss:true }]);
  }
  return waves;
}
function tearChallenge(){
  if(!ensurePool()) return;
  if(tearAllPaid()) return toast(`All ${tearWord(TEAR.rounds)} rounds are won this week. The past waits for Monday.`);
  storyModal(monPortrait('cyborg', 140, { view:'front', bare:true, crowned:true }), 'Challenge the past',
    `The tear shows you the Padrino's villa again. He sends his monsters out one at a time — the Rhino, the Fox, the Shadow, ` +
    `the Jackal and the Raven, crowned, at level <b>${tearFoeLevel()}</b> — and last of all <b>Cyborg</b>, the time monster, at <b>${TEAR.cyborgLevel}</b>.<br><br>` +
    `<b>Beat Cyborg</b> and it rewinds them all, itself too, and he starts again from the Rhino — <b>${tearWord(TEAR.rounds)} rounds</b>.<br><br>` +
    `Cyborg's <b>Futuresight</b> dodges half of your blows, and every dodge is a <b>Spacetime Fracture</b>: its Spacetime Rift Max ` +
    `(<b>1.5×</b> its attack) hits <b>1.1×</b> harder for each one, multiplying. A <b>Curse ✦</b> quiets Futuresight; a <b>Diamond Dust</b> ` +
    `sweeps the fractures away — bring your own <b>Very High stones</b>.<br><br>` +
    `Lose, and nothing is taken — <b>not even XP</b>. Every move asks for your <b>silver and gold words</b>.`,
    ()=> tearBegin(), { subtitle:'The space-time tear', bg:'tear' });
}
function tearBegin(){
  const t = tearState();
  t.runs = (t.runs || 0) + 1;
  saveProfile();
  beginBattle({ waves:tearWaves(), isNpc:true, npcId:'padrino2', tear:true, bgKey:'battle_tear',
                name:`Don Padrino · Round 1 of ${TEAR.rounds}`, onWaveStart:(i)=> tearWaveStart(i) });
  ui.battle.tearRun = { rounds:0, medals:{}, xp:0, events:[], stone:false, bonus:0 };
}

/* Cyborg can be struck, but never brought below 1 HP — every path that
   lowers an enemy's health goes through this. (The tear used it until 3.00,
   when Cyborg became the round's last wave, to be beaten; kept for the
   climax's final phase, where it flees at 1 HP — part 6 §12.) */
function tearMakeRewinder(e){
  let hp = Math.max(1, e.hp);
  e.rewinder = true;
  Object.defineProperty(e, 'hp', { configurable:true, enumerable:true,
    get(){ return hp; },
    set(v){ const n = +v; if(Number.isFinite(n)) hp = Math.max(1, n); } });
}
function tearWaveStart(i){
  const b = ui.battle;
  const round = Math.floor(i / TEAR.wavesPerRound) + 1;
  b.tearRound = round;
  b.name = `Don Padrino · Round ${round} of ${TEAR.rounds}`;
}
function tearWaveLabel(i){
  const round = Math.floor(i / TEAR.wavesPerRound) + 1, wave = i % TEAR.wavesPerRound + 1;
  return `Round ${round} of ${TEAR.rounds} · wave ${wave} of ${TEAR.wavesPerRound}!`;
}
/* A wave won (not the last of all): on to the next, or — the round's last —
   pay the round, and Cyborg rewinds the team. */
function tearWaveCleared(next){
  const b = ui.battle;
  if((b.waveIndex + 1) % TEAR.wavesPerRound !== 0) return next();
  /* Cyborg beaten: the round is won, and it rewinds them all (3.00) */
  const round = Math.floor(b.waveIndex / TEAR.wavesPerRound) + 1;
  const said = tearRoundWon(round);
  b.phase = 'resolving';
  renderBattle();
  battleMsg(said);
  tearRewindFx();
  setTimeout(()=> tearAfterBreak(b, next), TEAR.rewindMs);
}
/* An eye break that fell due with the round is taken now, before the next. */
function tearAfterBreak(b, next){
  if(ui.battle !== b) return;
  if(b.tearBreak){ b.tearBreak = false; showEyeBreak(); }
  if(eyeBreakActive()) return setTimeout(()=> tearAfterBreak(b, next), 1000);
  next();
}
/* A round won: its medals if not paid this week, its XP always. Returns what
   to say. */
function tearRoundWon(round){
  const b = ui.battle, t = tearState();
  const run = b.tearRun || (b.tearRun = { rounds:0, medals:{}, xp:0, events:[], stone:false, bonus:0 });
  run.rounds = Math.max(run.rounds, round);
  t.best = Math.max(t.best || 0, round);
  let line;
  if(!t.paid[round - 1]){
    t.paid[round - 1] = true;
    const pay = TEAR.pay[round - 1];
    state.medals = state.medals || {};
    Object.entries(pay).forEach(([k, n])=>{
      state.medals[k] = (state.medals[k] || 0) + n;
      run.medals[k] = (run.medals[k] || 0) + n;
    });
    line = `🏅 Round ${round} won — ${tearPayText(pay)}!`;
  } else line = `Round ${round} won — its medals were paid earlier this week.`;
  const fights = TEAR.wavesPerRound * 2;
  run.xp += fights;
  run.events.push(...tearXp(fights));
  if(tallyBattleForEyeBreak()) b.tearBreak = true;     // a round is a battle, for the eye break and the day
  saveProfile();
  if(round < TEAR.rounds)
    line += ` ⏳ Cyborg rewinds time — the Padrino's team stands again. Round ${round + 1} of ${TEAR.rounds}!`;
  return line;
}
/* XP with no region cap: only a monster's own Crown and ceilings hold it. */
function tearXp(fights){
  ui.xpNoCap = true;
  try { return awardXpToParty(fights) || []; }
  finally { ui.xpNoCap = false; }
}

/* ---------- the end of a run: won, lost or left ---------- */
function tearEnded(kind){
  const b = ui.battle;
  if(!b || !b.tear || b.tearDone) return;
  b.tearDone = true;
  b.phase = 'resolving';
  const t = tearState();
  if(kind === 'won'){
    tearRoundWon(TEAR.rounds);                       // the seventh round's own
    const run = b.tearRun;
    t.clears = (t.clears || 0) + 1;
    if(!t.stone){ t.stone = true; addStone('mindStone', 1); run.stone = true; }
    else {
      run.bonus = TEAR.bonusFights;
      run.xp += TEAR.bonusFights;
      run.events.push(...tearXp(TEAR.bonusFights));
    }
  }
  let brk = !!b.tearBreak;
  b.tearBreak = false;
  if(kind === 'lost'){
    /* a fall, as any: they come round with a little health — and nothing else
       is taken, not even a bar of XP */
    battleParty().forEach(m=>{ m.currentHp = Math.max(1, Math.floor(monMaxHp(m) * 0.10)); });
    if(tallyBattleForEyeBreak()) brk = true;
  }
  stopMusic();
  if(kind === 'won') playSfx('victory');
  else if(kind === 'lost') playSfx('defeat');
  saveProfile();
  tearResults(kind, b.tearRun || { rounds:0, medals:{}, xp:0, events:[] });
  if(brk) showEyeBreak();
}
function tearResults(kind, run){
  const all = tearAllPaid();
  const title = kind === 'won' ? 'The past is beaten' : kind === 'lost' ? 'The past won this time' : 'You stepped out of the past';
  const emoji = kind === 'won' ? '🌀' : kind === 'lost' ? '⏳' : '🚪';
  const medals = Object.entries(run.medals || {}).map(([k, n])=> `${TEAR_MEDAL[k]} +${n} ${tearCap(k)}`).join(' · ');
  /* every level gained in the run, one line a monster */
  const grown = {};
  (run.events || []).forEach(e=>{
    if(!e || !e.uid) return;
    const g = grown[e.uid] || (grown[e.uid] = { name:e.name, from:Infinity, to:-Infinity, ready:null });
    if(Number.isFinite(e.from)) g.from = Math.min(g.from, e.from);
    if(Number.isFinite(e.to)) g.to = Math.max(g.to, e.to);
    if(e.ready) g.ready = e.ready;
  });
  const ups = Object.values(grown);
  const lines = [
    `<div>Rounds won this time: <b>${run.rounds} of ${TEAR.rounds}</b>.</div>`,
    `<div>${medals ? `Medals: <b>${medals}</b>`
                   : run.rounds ? 'No new medals — those rounds were paid earlier this week.' : 'No rounds won this time.'}</div>`,
    run.xp ? `<div>XP: <b>${run.xp} fights' worth</b> for the whole team${run.bonus ? ` (with <b>+${run.bonus}</b> for winning all ${tearWord(TEAR.rounds)})` : ''}.</div>` : '',
    run.stone ? `<div style="color:#6a4ab0;font-weight:800;">🌀 The Mind Stone! The stone of the mind — Psychic, Ghost and Physical.</div>` : '',
    ...ups.filter(g=> g.to > g.from).map(g=> `<div>⬆️ ${escapeHtml(g.name)} grew to Lv ${g.to}!</div>`),
    ...ups.filter(g=> g.ready).map(g=> `<div style="color:#6a4ab0;">⚡ ${escapeHtml(g.name)} is ready to break through to Lv ${g.ready} — see your Party.</div>`),
    `<div style="margin-top:6px;">This week: <b>${tearPaidCount()} of ${TEAR.rounds}</b> rounds paid. ${all
      ? 'The past opens again next Monday.' : 'Try again: a new run starts at round 1, and pays the rounds still unpaid.'}</div>`,
    kind === 'lost' ? `<div>Your team fainted and recovered a little. Nothing else is lost.</div>` : '',
  ];
  challengeResult(emoji, title, lines.filter(Boolean).join(''), 'tear');
}

/* ---------- looks ---------- */
/* The tear: a purple-black galaxy turning round a black eye — four spiral
   arms (each a glow under a bright thread), a second, fainter set turning
   the other way, stars, and the eye. Drawn, so it needs no art. */
function tearGalaxy(){
  const C = 100;
  const arm = (k, n, turn, r0, grow)=>{
    const pts = [];
    for(let i = 0; i <= 48; i++){
      const t = i / 48 * turn * Math.PI;
      const r = Math.min(96, r0 * Math.exp(grow * t));
      const a = t + k * 2 * Math.PI / n;
      pts.push((C + r * Math.cos(a)).toFixed(1) + ' ' + (C + r * Math.sin(a)).toFixed(1));
    }
    return 'M' + pts.join(' L');
  };
  const set = (n, turn, r0, grow)=> Array.from({ length:n }, (_, k)=> arm(k, n, turn, r0, grow));
  const big = set(4, 2.4, 13, 0.27), small = set(3, 1.8, 16, 0.24);
  /* the same stars every time */
  let seed = 7;
  const rnd = ()=> (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const stars = Array.from({ length:26 }, ()=>{
    const a = rnd() * Math.PI * 2, r = 22 + rnd() * 72;
    return `<circle cx="${(C + r * Math.cos(a)).toFixed(1)}" cy="${(C + r * Math.sin(a)).toFixed(1)}" r="${(0.5 + rnd() * 1.1).toFixed(2)}" fill="#f3eaff" opacity="${(0.45 + rnd() * 0.5).toFixed(2)}"/>`;
  }).join('');
  return `<svg class="tear-svg" viewBox="0 0 200 200" width="100%" height="100%">
    <defs>
      <radialGradient id="tearHalo"><stop offset="0" stop-color="#a96cf0" stop-opacity=".85"/><stop offset=".45" stop-color="#5a2a9a" stop-opacity=".6"/><stop offset=".8" stop-color="#2a0f4a" stop-opacity=".3"/><stop offset="1" stop-color="#12061f" stop-opacity="0"/></radialGradient>
      <radialGradient id="tearEye"><stop offset="0" stop-color="#000"/><stop offset=".62" stop-color="#05010a"/><stop offset=".86" stop-color="#2a0c4a"/><stop offset="1" stop-color="#b27cff"/></radialGradient>
      <filter id="tearBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
    </defs>
    <circle cx="100" cy="100" r="99" fill="url(#tearHalo)" class="tear-pulse"/>
    <g class="tear-spin">
      ${big.map(d=> `<path d="${d}" fill="none" stroke="#7b3fd0" stroke-width="19" stroke-linecap="round" opacity=".6" filter="url(#tearBlur)"/>`).join('')}
      ${big.map(d=> `<path d="${d}" fill="none" stroke="#e2ccff" stroke-width="2.8" stroke-linecap="round" opacity=".75"/>`).join('')}
      ${stars}
    </g>
    <g class="tear-spin tear-spin-back">
      ${small.map(d=> `<path d="${d}" fill="none" stroke="#b58cf0" stroke-width="9" stroke-linecap="round" opacity=".35" filter="url(#tearBlur)"/>`).join('')}
    </g>
    <circle cx="100" cy="100" r="25" fill="url(#tearEye)"/>
    <circle cx="100" cy="100" r="25" fill="none" stroke="#c9a2ff" stroke-width="1.4" opacity=".8" class="tear-pulse"/>
  </svg>`;
}
/* Between rounds: time runs backwards, for a moment, over everything. */
function tearRewindFx(){
  tearCss();
  const fx = document.createElement('div');
  fx.className = 'tear-rewind';
  fx.setAttribute('aria-hidden', 'true');
  fx.innerHTML = `<div class="tr-galaxy">${tearGalaxy()}</div><div class="tr-label">⏪</div>`;
  document.body.appendChild(fx);
  setTimeout(()=>{ if(fx.parentNode) fx.parentNode.removeChild(fx); }, 1700);
}
let _tearCssDone = false;
function tearCss(){
  if(_tearCssDone || typeof document === 'undefined') return;
  _tearCssDone = true;
  const st = document.createElement('style');
  st.id = 'tearCss';
  st.textContent = `
  .tear-screen{ background:radial-gradient(ellipse at 50% 28%, #2c1548 0%, #140a22 55%, #07040c 100%);
    border-radius:18px; padding:14px 14px 16px; color:#efe6ff; box-shadow:0 6px 30px rgba(20,8,40,.45); }
  .tear-screen .screen-title{ color:#f4ecff; text-align:center; }
  .tear-wrap{ position:relative; width:min(66vw, 250px); aspect-ratio:1/1; margin:8px auto 12px; }
  .tear-svg{ display:block; overflow:visible; }
  .tear-svg .tear-spin{ transform-box:view-box; transform-origin:100px 100px; animation:tearSpin 16s linear infinite; }
  .tear-svg .tear-spin-back{ animation:tearSpinBack 10s linear infinite; }
  .tear-svg .tear-pulse{ transform-box:view-box; transform-origin:100px 100px; animation:tearPulse 4s ease-in-out infinite; }
  @keyframes tearSpin{ to{ transform:rotate(360deg); } }
  @keyframes tearSpinBack{ to{ transform:rotate(-360deg); } }
  @keyframes tearPulse{ 0%,100%{ transform:scale(1); opacity:.8; } 50%{ transform:scale(1.07); opacity:1; } }
  .tear-say{ text-align:center; font-size:13px; font-weight:700; color:#cdb8f0; margin:0 0 12px; }
  .tear-btn{ margin-bottom:10px; background:linear-gradient(180deg, #7a45c8, #4f2690); border-color:#3a1b6c; color:#fff; }
  .tear-btn:disabled{ opacity:.5; }
  .tear-week{ margin-top:6px; background:rgba(255,255,255,.06); border:1px solid rgba(200,170,255,.25); border-radius:14px; padding:10px 10px 8px; }
  .tw-title{ font-weight:800; font-size:13px; color:#e6d8ff; margin-bottom:8px; }
  .tw-rounds{ display:grid; grid-template-columns:repeat(7, 1fr); gap:5px; margin-bottom:8px; }
  .tw-round{ position:relative; text-align:center; border-radius:10px; padding:5px 0 4px; background:rgba(255,255,255,.08);
    border:1px solid rgba(200,170,255,.22); font-size:11px; font-weight:800; color:#efe6ff; }
  .tw-round b{ display:block; font-size:13px; }
  .tw-round span{ display:block; white-space:nowrap; font-size:10px; }
  .tw-round.paid{ background:rgba(140,220,160,.18); border-color:rgba(140,220,160,.55); }
  .tw-round i{ position:absolute; top:-6px; right:-4px; font-style:normal; font-size:11px; background:#3fa55b; color:#fff;
    border-radius:50%; width:16px; height:16px; line-height:16px; }
  .tw-note{ font-size:12px; font-weight:600; color:#d8c8f4; line-height:1.45; margin-top:4px; }
  .tear-mini{ position:relative; width:54px; height:54px; flex:0 0 auto; display:inline-block; }
  .tear-rewind{ position:fixed; inset:0; z-index:70; pointer-events:none; display:flex; align-items:center; justify-content:center;
    background:radial-gradient(circle, rgba(70,25,120,.55), rgba(10,4,20,0) 70%); animation:tearRewind 1.6s ease-in-out forwards; }
  .tear-rewind .tr-galaxy{ position:absolute; width:78vmin; height:78vmin; }
  .tear-rewind .tear-spin{ animation:tearSpinBack .9s linear infinite; }
  .tear-rewind .tear-spin-back{ animation:tearSpin .7s linear infinite; }
  .tear-rewind .tr-label{ position:relative; font-size:60px; filter:drop-shadow(0 0 12px rgba(200,160,255,.9)); }
  @keyframes tearRewind{ 0%{ opacity:0; } 25%{ opacity:1; } 75%{ opacity:1; } 100%{ opacity:0; } }
  `;
  document.head.appendChild(st);
}
