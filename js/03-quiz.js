/* ==========================================================
   03-quiz.js
   The writing quiz: word selection, hints, Hanzi Writer, voice.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ============================================================
   THE DAILY CYCLE
   Twenty-five phrases in a day completes that day's step. The cycle runs six
   deep and NEVER resets for a missed day — it simply waits. Coming back after
   a fortnight resumes exactly where they left off, so a holiday costs nothing.
   ============================================================ */
const DAILY_TARGET = 25;
const DAILY_CYCLE = [
  { tokens:25 },
  { tokens:25 },
  { tokens:25, silver:5 },
  { tokens:25, silver:10 },
  { tokens:25, gold:5 },
  { tokens:25, gold:10 },
];
function dailyState(){
  state.daily = state.daily || { day:null, count:0, step:0, done:false };
  if(state.daily.day !== today()){
    state.daily.day = today();
    state.daily.count = 0;
    state.daily.done = false;      // `step` deliberately survives — no reset
  }
  return state.daily;
}
function dailyReward(){ return DAILY_CYCLE[(dailyState().step) % DAILY_CYCLE.length]; }
/* The celebration takes over the whole screen, which is fine on the home page
   and disastrous in the middle of a battle — it navigated away and left the
   fight unfinished. So during a fight we only toast, and hold the full scene
   until the player is somewhere it can safely interrupt. */
function announceDaily(r){
  const bits = [];
  if(r.tokens) bits.push(`${tokenIcon(20)} ${r.tokens} Skill Tokens`);
  if(r.silver) bits.push(`🥈 ${r.silver} Silver Medals`);
  if(r.gold)   bits.push(`🥇 ${r.gold} Gold Medals`);
  const d = dailyState();
  const done = ((d.step + DAILY_CYCLE.length - 1) % DAILY_CYCLE.length) + 1;
  const nextStep = (d.step % DAILY_CYCLE.length) + 1;

  if(ui.battle){
    // the rewards are already banked; just say so and carry on fighting
    ui.pendingDaily = { r, done, nextStep };
    toast(`🗓️ Day ${done} complete — rewards banked!`);
    return;
  }
  showDailyScene(r, done, nextStep);
}

function showDailyScene(r, done, nextStep){
  const bits = [];
  if(r.tokens) bits.push(`${tokenIcon(20)} ${r.tokens} Skill Tokens`);
  if(r.silver) bits.push(`🥈 ${r.silver} Silver Medals`);
  if(r.gold)   bits.push(`🥇 ${r.gold} Gold Medals`);
  const back = ui.screen;
  storyModal('🗓️', `Day ${done} complete!`,
    `<b>${DAILY_TARGET} phrases written today.</b><br><br>` +
    bits.join('<br>') +
    `<br><br><i>Tomorrow is day ${nextStep} of the cycle. Miss a day and nothing is lost — ` +
    `it simply waits for you.</i>`,
    ()=>go(back === 'quiz' || back === 'battle' ? 'home' : back), { subtitle:'Daily' });
}

/* Shown the moment the player reaches a screen that can spare the interruption. */
function flushPendingDaily(){
  if(!ui.pendingDaily || ui.battle) return;
  if(['battle','quiz'].includes(ui.screen)) return;
  const p = ui.pendingDaily;
  ui.pendingDaily = null;
  setTimeout(()=> showDailyScene(p.r, p.done, p.nextStep), 500);
}

/* Called once per scored phrase. Returns the reward if this was the 25th. */
function noteDailyPhrase(){
  const d = dailyState();
  if(d.done) return null;
  d.count++;
  if(d.count < DAILY_TARGET) return null;
  const r = dailyReward();
  d.done = true;
  const finishing = d.step;
  d.step = (d.step + 1) % DAILY_CYCLE.length;
  /* A full six-day cycle is recorded so rewards can be reconciled later if we
     ever need to. Kept small: a date and the day count. */
  if(finishing === DAILY_CYCLE.length - 1){
    state.dailyWeeks = state.dailyWeeks || [];
    state.dailyWeeks.push({ completed: today(), days: DAILY_CYCLE.length });
  }
  state.inventory.tokens = (state.inventory.tokens||0) + (r.tokens||0);
  if(r.silver) state.medals.silver = (state.medals.silver||0) + r.silver;
  if(r.gold)   state.medals.gold   = (state.medals.gold||0)   + r.gold;
  return r;
}

/* ============================================================
   OVERMASTERY
   Reps beyond a word's gold threshold (25) still represent real effort, so
   they pool together across ALL phrases and pay out on the same 5 / 15 / 25
   rhythm, resetting each time a cycle completes.
   The pool is capped at 30% of the player's gold-mastered phrases (rounded up)
   worth of cycles, so grinding one familiar phrase forever earns nothing —
   breadth has to grow before the surplus keeps counting. (3.52) Once the
   companions are unlocked, 1.5 × — the designer: "In light of the default
   [companions write the learned words], raise the cap for overmastery to
   1.5x the total number of gold medals earned so far once the companion
   system is unlocked." Each 🥇 phrase is one gold medal (MASTERY_GROUP_BY_TIER).
   Fully idempotent: it recomputes from scratch and grants only the difference,
   so previously-uncredited effort is picked up without ever paying twice.
   ============================================================ */
const OVERMASTERY_CYCLE = 25;
const OVERMASTERY_STEPS = { bronze:5, silver:15, gold:25 };
const OVERMASTERY_CAP_RATIO = 0.30;
const OVERMASTERY_COMPANION_RATIO = 1.5;
function overmasteryRatio(){
  return (typeof companionsUnlocked === 'function' && companionsUnlocked()) ? OVERMASTERY_COMPANION_RATIO : OVERMASTERY_CAP_RATIO;
}

function overmasteryStats(){
  const wm = (state && state.wordMastery) || {};
  const gold = MASTERY_CHECKPOINTS.gold;
  let excess = 0, goldWords = 0;
  Object.values(wm).forEach(v=>{
    if(v >= gold){ goldWords++; excess += (v - gold); }
  });
  const maxCycles = Math.ceil(goldWords * overmasteryRatio());
  const usable = Math.min(excess, maxCycles * OVERMASTERY_CYCLE);
  const cycles = Math.floor(usable / OVERMASTERY_CYCLE);
  const partial = usable % OVERMASTERY_CYCLE;
  return {
    excess, goldWords, maxCycles, usable, cycles, partial,
    owed: {
      bronze: cycles + (partial >= OVERMASTERY_STEPS.bronze ? 1 : 0),
      silver: cycles + (partial >= OVERMASTERY_STEPS.silver ? 1 : 0),
      gold:   cycles,
    },
    capped: excess > usable,
  };
}

/* (3.49) The designer: "please give a way for overmastery vs capacity
   against total number of gold medals to be viewed. also, when overmastery
   is capped, do extra practices get stored to grant overmastery once more
   gold medals are unlocked? they should so that extra practice is not wasted".
   They are, and always were: each phrase keeps its whole count (wordMastery
   is never capped or trimmed), so the pool is every completion past 🥇, ever.
   Only what PAYS is capped; when more phrases reach 🥇 the room grows and
   reconcileOvermastery pays what was waiting at once. This card (on the
   Spelling List) shows it: the 🥇 phrases, the room they make, the pool,
   what has paid and what is waiting, and when the next 25 opens. */
function overmasteryView(){
  const s = overmasteryStats(), C = OVERMASTERY_CYCLE, St = OVERMASTERY_STEPS;
  const room = s.maxCycles * C, paid = state.overmasteryAwarded || { bronze:0, silver:0, gold:0 };
  const waiting = s.excess - s.usable;
  /* the next 25 of room: the fewest 🥇 phrases that make one more cycle */
  let g = s.goldWords + 1;
  const ratio = overmasteryRatio();
  while(Math.ceil(g * ratio) <= s.maxCycles) g++;
  const nextRoom = `The next ${C} of room comes at <b>${g}</b> 🥇 phrases (${g - s.goldWords} more).`;
  let next;
  if(!s.goldWords) next = `No phrase is 🥇 yet: the pool starts with the first one.`;
  else if(waiting > 0) next = `<b>${waiting}</b> waiting — paid as soon as there is room. ${nextRoom}`;
  else if(s.usable >= room) next = `The room is full to the last practice. ${nextRoom}`;
  else {
    const p = s.partial;
    const [icon, at] = p < St.bronze ? ['🥉', St.bronze] : (p < St.silver ? ['🥈', St.silver] : ['🥇', St.gold]);
    next = `Next: ${icon} in <b>${at - p}</b> more. Room left: <b>${room - s.usable}</b>.`;
  }
  const pct = room ? Math.min(100, s.usable / room * 100) : 0;
  return `
    <div class="hp-card om-card" style="margin-bottom:14px;">
      <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;">✨ Overmastery</div>
      <div style="font-size:12px;color:var(--ink-soft);font-weight:600;line-height:1.45;margin:2px 0 8px;">
        Each time a 🥇 phrase (${MASTERY_CHECKPOINTS.gold}/${MASTERY_CHECKPOINTS.gold}) is written right again, it goes into one pool. Every ${C} in the pool pays 🥉 at ${St.bronze}, 🥈 at ${St.silver} and 🥇 at ${St.gold}.
        The room is ${ratio >= 1 ? `${ratio} ×` : `${Math.round(ratio * 100)}% of`} your 🥇 phrases, rounded up, × ${C}${ratio >= 1 ? ' — raised since the companions joined (they write the learned words)' : ''}. Nothing past the room is lost: it waits.</div>
      <div class="hpbar" style="height:10px;"><div class="hpfill om-fill" style="width:${pct}%;background:var(--gold);"></div></div>
      <div class="om-lines" style="font-size:13px;font-weight:700;line-height:1.6;margin-top:8px;">
        <div>🥇 phrases (a gold medal each): <b class="om-gold">${s.goldWords}</b> → room for <b>${s.maxCycles}</b> × ${C} = <b class="om-room">${room}</b></div>
        <div>In the pool: <b class="om-pool">${s.excess}</b> · paying: <b class="om-used">${s.usable}</b> of <b>${room}</b></div>
        <div>Paid so far: 🥉 <b>${paid.bronze || 0}</b> · 🥈 <b>${paid.silver || 0}</b> · 🥇 <b>${paid.gold || 0}</b></div>
        <div class="om-next" style="color:var(--ink-soft);">${next}</div>
      </div>
    </div>`;
}
/* the same, in one line (the parent area's summary) */
function overmasteryLine(){
  const s = overmasteryStats(), room = s.maxCycles * OVERMASTERY_CYCLE, waiting = s.excess - s.usable;
  return `✨ Overmastery: <b>${s.usable}/${room}</b> paying` + (waiting > 0 ? ` · <b>${waiting}</b> waiting` : '') + ` (${s.goldWords} 🥇 phrases)`;
}

function reconcileOvermastery(){
  if(!state) return null;
  state.overmasteryAwarded = state.overmasteryAwarded || { bronze:0, silver:0, gold:0 };
  const { owed } = overmasteryStats();
  let granted = null;
  ['bronze','silver','gold'].forEach(tier=>{
    const paid = state.overmasteryAwarded[tier] || 0;
    if(owed[tier] > paid){
      const diff = owed[tier] - paid;
      state.overmasteryAwarded[tier] = owed[tier];
      state.medals[tier] = (state.medals[tier]||0) + diff;
      granted = granted || { bronze:0, silver:0, gold:0 };
      granted[tier] += diff;
    }
  });
  return granted;
}

function reconcileMastery(){
  if(!state || !state.wordMastery) return null;
  const c = masteryCounts();
  let granted = null;
  ['bronze','silver','gold'].forEach(tier=>{
    const owed = Math.floor(c[tier] / MASTERY_GROUP_BY_TIER[tier]);
    const paid = state.masteryAwarded[tier] || 0;
    if(owed > paid){
      const diff = owed - paid;
      state.masteryAwarded[tier] = owed;
      state.medals[tier] = (state.medals[tier]||0) + diff;
      granted = granted || {bronze:0,silver:0,gold:0};
      granted[tier] += diff;
    }
  });
  return granted;
}

function checkMasteryRewards(){
  const over = reconcileOvermastery();
  if(over) setTimeout(()=>announceOvermastery(over), 700);
  const c = masteryCounts();
  const rewards = { bronze:0, silver:0, gold:0 };
  ['bronze','silver','gold'].forEach(tier=>{
    const owed = Math.floor(c[tier] / MASTERY_GROUP_BY_TIER[tier]);
    if(owed > (state.masteryAwarded[tier]||0)){
      rewards[tier] = owed - (state.masteryAwarded[tier]||0);
      state.masteryAwarded[tier] = owed;
      state.medals[tier] = (state.medals[tier]||0) + rewards[tier];
    }
  });
  return (rewards.bronze || rewards.silver || rewards.gold) ? rewards : null;
}
function announceOvermastery(r){
  if(!r) return;
  const bits = [];
  if(r.bronze) bits.push(`${r.bronze} 🥉`);
  if(r.silver) bits.push(`${r.silver} 🥈`);
  if(r.gold)   bits.push(`${r.gold} 🥇`);
  toast('✨ Overmastery: ' + bits.join(' + ') + ' for practice beyond gold!');
}

function announceMastery(r){
  if(!r) return;
  const bits = [];
  if(r.bronze) bits.push(`${r.bronze} 🥉 Bronze`);
  if(r.silver) bits.push(`${r.silver} 🥈 Silver`);
  if(r.gold)   bits.push(`${r.gold} 🥇 Gold`);
  toast('🏅 Mastery reward: ' + bits.join(' + ') + ' Medal' + ((r.bronze+r.silver+r.gold)>1?'s':'') + '!');
}

/* ---------- ELITE SKILL TOKENS ----------
   5 tokens  -> guaranteed High / Very High / Ultra at 60 / 30 / 10%
   50 tokens -> shop: pick ANY Very High skill stone
   100 tokens-> shop: pick ANY Ultra skill stone */
const ELITE_ROLL_COST = 5;
const ELITE_SHOP_HIGH = 5;
const ELITE_SHOP_VERYHIGH = 50;
const ELITE_SHOP_ULTRA = 100;
const ELITE_ROLL_ODDS = [
  { tier:'veryhigh', odds:0.75 },
  { tier:'ultra',    odds:0.25 },
];
function rollEliteTier(){
  const r = Math.random(); let acc = 0;
  for(const o of ELITE_ROLL_ODDS){ acc += o.odds; if(r < acc) return o.tier; }
  return 'veryhigh';
}
function newEliteStone(){
  const tier = rollEliteTier();
  const type = rollStoneType();
  return { uid:'s'+Date.now()+Math.floor(Math.random()*1000), tier, type, name:stoneName(type,tier) };
}

/* ---------- QUIZ ENGINE ----------
   Reusable across practice / battle / catch / recovery (later phases).
   ui.quiz holds live state. Rules baked in:
   - audio-only prompt (word never shown until resolved)
   - no hints
   - 15s timer per phrase, resets on every CORRECT STROKE (not on mistakes)
   - 5 consecutive mistakes (across the whole word) fails the phrase
   - timeout fails the phrase
   Config: { words:[str], title, subtitle, onComplete(results), onExit() }
   results = [{ text, passed, mistakes, timedOut }] */
const MISTAKE_LIMIT = 5;
const TIMER_SECONDS = 15;
let quizTimer = null;      // single shared interval handle
let quizToken = 0;         // bumped each word; stale intervals self-cancel

function startQuiz(config){
  stopTimer();
  ui.quiz = {
    config,
    index:0,
    results:[],
    writers:[],
    chars:[],
    charIndex:0,
    consecutiveMistakes:0,
    locked:false,
    timeLeft:TIMER_SECONDS,
    token:++quizToken,
    resolved:false,
    wordsDone: config.startingWords || 0,   // carry-over spill from the previous move
  };
  ui.screen = 'quiz';
  render();
}

/* ---------- MANDARIN VOICE SELECTION ----------
   Two bugs previously caused the prompt to drift into Cantonese mid-session:
   (1) matching lang.startsWith('zh') also matches zh-HK / yue (Cantonese) and
       zh-TW, and (2) speechSynthesis.getVoices() fills in asynchronously, so the
       list can reorder between calls and a plain .find() picks a different voice
       later on. We now match Mandarin explicitly, reject Cantonese outright, and
       CACHE the resolved voice so it can never change mid-session. */
let _mandarinVoice = null;
let _voiceResolved = false;

function isCantonese(v){
  const t = ((v.lang||'') + ' ' + (v.name||'')).toLowerCase();
  return t.includes('yue') || t.includes('hk') || t.includes('hong kong') || t.includes('cantonese');
}
function isMandarin(v){
  const lang = (v.lang||'').toLowerCase().replace('_','-');
  const name = (v.name||'').toLowerCase();
  if(isCantonese(v)) return false;
  return lang.startsWith('zh') || lang.startsWith('cmn') || name.includes('mandarin') || name.includes('putonghua');
}
function pickMandarinVoice(){
  if(_voiceResolved && _mandarinVoice) return _mandarinVoice;
  let voices = [];
  try{ voices = speechSynthesis.getVoices() || []; }catch(e){ return null; }
  if(!voices.length) return null;              // not loaded yet — retry next call
  const candidates = voices.filter(isMandarin);
  if(!candidates.length){ _voiceResolved = true; _mandarinVoice = null; return null; }
  const score = v => {
    const lang = (v.lang||'').toLowerCase().replace('_','-');
    const name = (v.name||'').toLowerCase();
    if(lang === 'zh-cn') return 0;             // mainland Mandarin — best match
    if(lang.startsWith('zh-hans')) return 1;
    if(lang.startsWith('cmn')) return 2;
    if(name.includes('mandarin')) return 3;
    if(lang === 'zh') return 4;
    if(lang.startsWith('zh-tw')) return 6;     // Taiwanese Mandarin — usable, last resort
    return 5;
  };
  candidates.sort((a,b)=>score(a)-score(b));
  _mandarinVoice = candidates[0];
  _voiceResolved = true;
  return _mandarinVoice;
}
// resolve as soon as the voice list is available, and re-resolve if it reloads
try{
  if(typeof speechSynthesis !== 'undefined'){
    speechSynthesis.addEventListener('voiceschanged', ()=>{ _voiceResolved=false; _mandarinVoice=null; pickMandarinVoice(); });
  }
}catch(e){}

function speakWord(text){
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickMandarinVoice();
    if(v) u.voice = v;
    u.lang = 'zh-CN';                          // always Mandarin, never inherited
    u.rate = 0.85;
    u.volume = state?.settings?.volume ?? 0.8;
    // Duck the music while the Chinese prompt plays so it stays clearly audible.
    const restore = ()=>{ if(musicGain && actx) rampGain(musicGain, musicVolume(), 250);
                          else if(audio.musicEl) audio.musicEl.volume = musicVolume(); };
    if(musicGain && actx) rampGain(musicGain, musicVolume()*0.25, 150);
    else if(audio.musicEl) audio.musicEl.volume = musicVolume() * 0.25;
    u.addEventListener('end', restore);
    u.addEventListener('error', restore);
    setTimeout(restore, 6000);   // failsafe if the end event never fires
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------- (3.97) the spelling screen's battle look ---------- */
function quizShade(hex, f){
  const n = parseInt(String(hex).slice(1), 16);
  if(isNaN(n)) return hex;
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v=> Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))));
  return '#' + c.map(v=> v.toString(16).padStart(2, '0')).join('');
}
/* the move's colour: its stone's element, or its monster's first */
function quizColour(c){
  const mv = c.move, att = c.attacker;
  const ty = (mv && mv.stoneType) || (att && SPECIES[att.species] && SPECIES[att.species].types && SPECIES[att.species].types[0]);
  return (ty && TYPE_COLORS[ty]) || '#d4643a';
}
function quizPic(m, px){
  if(!m || !m.species || !SPECIES[m.species]) return '';
  return monPortrait(m.species, px, { view:'front', bare:true, stage:typeof monStage === 'function' ? monStage(m) : 0, crowned:typeof isCrowned === 'function' && !!m.uid && isCrowned(m) });
}
function quizBannerHtml(q){
  const c = q.config, mv = c.move, att = c.attacker;
  if(!mv || !att) return '';
  /* (3.98) The designer: "please remove the details e.g. 'basic move, write 2 words to power it up'. also remove the
     banner … make the banner and the listen and meaning buttons as translucent as the writing square" — and of the
     meter, "under the name of the move and the sprite of the monster using it is a great idea". A card of dark glass:
     your monster, the move's name, the power meter under them. And then: "please remove the target enemy because it
     would be awkward for aoe situations. just the name of the move would be great." */
  return `<div class="qz-banner">
    <div class="qz-row">
      <span class="qz-me">${quizPic(att, 64)}</span>
      <div class="qz-mv"><div class="qz-name">${escapeHtml(c.title || mv.name || '')}</div></div>
    </div>
    ${c.wordTarget ? quizGaugeHtml(q) : ''}
  </div>`;
}
/* (3.98) The designer: "instead of a bar split between words, can we have a meter that glows and releases sparks at
   the tip of the current charge to simulate power growing with each spelt word? … that filled up with every correct
   word". One meter, in the screen's own gold (not the move's colour: "let's standardise the colours of the listen,
   meaning, and power bar"; "i agree gold looks good!"): it fills a share with each word written; a notch where the
   move is powered. Then: "Please make the glow on the tip of the power bar slightly bigger than the bar itself and
   more diffused and pulsing … Can we have the bar movement animated as it fills after writing instead of
   instantaneously jumping? make the glow and sparkles much more intense as it fills and send a wave of shimmer down
   the bar as it fills. the wave of shimmer would be nice to have occasionally to give the sense of a liquid,
   reflective bar." So the fill is eased up from where it stood (quizMeterAnim), never set; while it rises the meter
   is .filling (its tip swells and burns brighter, sparks fly faster and further, more of them) and a wave of light
   runs down it (.qz-wave); at rest, now and then, a slower shimmer crosses it (.qz-fill::after). */
const QUIZ_SPARKS = [[-62, 0], [-38, .12], [-18, .3], [0, .05], [16, .22], [34, .4], [55, .16], [-80, .5], [74, .34], [-6, .62]];
const QUIZ_SPARKS_HOT = [[-50, .08], [-28, .2], [-8, .36], [8, .14], [24, .28], [44, .02], [64, .44], [-70, .26], [88, .1], [-90, .38]];   // only while it fills
function quizGaugeHtml(q){
  const c = q.config, n = c.wordTarget, done = Math.min(q.wordsDone || 0, n);
  const need = c.stopAt || (c.move && c.move.words) || n;
  const bonus = !!q.bonusPhase;                                        // (4.07) the move is powered: its meter stays full
  const pct = bonus ? 100 : n ? done / n * 100 : 0;
  const A = q._meterA, shown = A && A.shown != null && A.shown <= pct ? A.shown : pct;   // it rises from where it stood
  return `<div class="qz-gauge${done >= need || bonus ? ' powered' : ''}${done >= n || bonus ? ' full' : ''}${bonus ? ' bonus' : ''}">
    <div class="qz-meter${pct > shown + 0.05 ? ' surge' : ''}" id="qzMeter" data-to="${pct.toFixed(2)}">
      <div class="qz-fill" id="qzFill" style="width:${shown.toFixed(2)}%"><i class="qz-wave"></i>${shown > 0.05 || pct > 0 ? quizTipHtml() : ''}</div>
    </div>
    ${bonus ? quizBonusMeterHtml(q) : c.stopAt ? quizAttackHtml(q) : `<b class="qz-num"><span id="wordCount">${done}</span>/${n}</b>`}
  </div>
  ${(c.startingWords || 0) > 0 ? `<div class="qz-carry">+${c.startingWords} carried over</div>` : ''}`;
}
/* (4.07) A move whose words scale it (Incinerate, Incinerate Max): "Attack now" at the end of its power meter, where
   the count stands for every other move — the designer: "change from 'stop here' to 'Attack now'. where does that
   button live? there might be space on the right side of the label" and "I like how the attack now states the
   multiplier". Beside the name it left a 375px iPhone about 150px for the name, so (the designer: "keep name sizes
   consistent for all moves at a length that will never change even with the attack now button on an iPhone's narrower
   screen") it sits on the meter's row: lit, and tappable, once the move is powered, saying what it would strike at.
   (It was a full-width "⏹ Stop here" bar under Listen and Meaning, 3.98–4.06: quizStopHtml.) */
function quizStopHtml(q){ return ''; }
function quizAttackSub(q){
  const c = q.config, mv = c.move, done = q.wordsDone || 0;
  if(done < c.stopAt) return `${c.stopAt} words needed`;
  const f = (mv && mv.scale && typeof scaledFactor === 'function') ? (done > mv.words ? scaledFactor(mv, done) : mv.mult) : null;
  return `${done} words` + (f != null ? ` · ${+f.toFixed(2)}×` : '');
}
function quizAttackHtml(q){
  const ready = (q.wordsDone || 0) >= q.config.stopAt;
  return `<button class="qz-attack${ready ? ' ready' : ''}" id="stopEarly" ${ready ? '' : 'disabled'}>Attack now<small>${quizAttackSub(q)}</small></button>`;
}
/* ============================================================
   (4.07) THE BONUS WORDS, ON THE SPELLING SCREEN
   The designer: "I feel the bonus quizzes should live on the spelling UI screen. when bonus quizzes are available,
   instead of the 'ready' button, should we have a pop up … or should we have 2 buttons where the ready stands, split
   half half across the width?" — and of the mockups, "Let's go with A!", with the reward stated on it ("I like how
   the attack now states the multiplier"). A move with a bonus (Heavensplitter's ×2, Rampage Max's Aftershock, the
   phoenix's Sacred Flame, the princess's Portent) has it in its quiz (`config.bonus`: words, reward). Its words
   written and the move powered, Ready! stands at the left and "+N bonus words · its reward" at the right. Ready!
   strikes now. The other draws the bonus words — from every word learned to silver or gold, or the whole list until
   the first is — onto this same screen, with no hints: the move's meter stays full and burning, and a violet one
   fills beside it. All of them right, Ready! strikes with the bonus; a slip, Continue, and the move still lands at
   full strength without it. (Until 4.07: a parchment window over the fight once the words were done, then a quiz of
   their own — askBonusRound, still there for a copied move, which has no words.) The quiz's results go to the move
   with `bonusPick`: { tried, won, main } (main: how many of them are the move's own). */
function quizBonusOpen(q, powered){ return !!(q.config.bonus && !q.bonusPhase && powered); }
function quizBonusReward(bn){
  return bn.mult ? `for ×${bn.mult} damage` : bn.aftershock ? 'for an Aftershock' : bn.sacredFlame ? 'for a Sacred Flame' : bn.portent ? 'for a Portent' : 'for more';
}
function quizBonusBtnHtml(q){
  const bn = q.config.bonus;
  return `<button class="btn qz-next qz-bonus" id="quizBonus"><b>+${bn.words} bonus words</b><small>${quizBonusReward(bn)}</small></button>`;
}
function quizBonusDone(q){ return Math.max(0, Math.min(q.config.bonusWords || 0, (q.wordsDone || 0) - (q.bonusWordsFrom || 0))); }
function quizBonusMeterHtml(q){
  const n = q.config.bonusWords || 1, d = quizBonusDone(q);
  return `<div class="qz-bmeter" id="qzBMeter"><div class="qz-bfill" id="qzBFill" style="width:${(d / n * 100).toFixed(2)}%"></div></div>` +
         `<b class="qz-bnum" id="qzBNum">+${d}/${n}</b>`;
}
/* the bonus round begins: its words after this one (a word left half-written by Attack now is left) */
function quizStartBonus(q){
  if(!q || q._ended || q.bonusPhase) return;
  const c = q.config, bn = c.bonus;
  const learned = typeof revisionWords === 'function' ? revisionWords() : [];
  const pool = learned.length ? learned : (typeof masterWords !== 'undefined' ? masterWords.slice() : []);
  const words = [];
  let chars = 0, bag = shuffle(pool), guard = 0;
  while(chars < bn.words && guard++ < 200 && pool.length){
    if(!bag.length) bag = shuffle(pool);
    const w = bag.pop(); words.push(w); chars += countWords(w);
  }
  q.bonusPhase = true;
  q.bonusFrom = q.results.length;                 // the results from here are the bonus words'
  q.bonusWordsFrom = q.wordsDone || 0;
  c.bonusWords = bn.words;
  c.words = c.words.slice(0, q.index + 1).concat(words);
  c.wordTarget = (q.wordsDone || 0) + bn.words;
  c.stopAt = 0;                                   // no Attack now in the bonus round
  c.noHints = true;                               // "No hints" (a gamble should not be handheld)
  q.locked = false;
  q.index++;
  renderQuiz();
}
/* How the bonus went, for the move (set as the quiz ends). */
function quizMarkBonus(q){
  if(!q || !q.config.bonus) return;
  const tried = !!q.bonusPhase;
  const won = tried && q.results.slice(q.bonusFrom).length > 0 && q.results.slice(q.bonusFrom).every(r=> r.passed) && (q.wordsDone || 0) >= q.config.wordTarget;
  q.results.bonusPick = { tried, won, main:tried ? q.bonusFrom : q.results.length };
}
/* Attack now, with a bonus to offer: the words stop here, and the two buttons stand where Ready! would. */
function quizOfferNow(q){
  stopTimer();
  q.locked = true;
  const zone = $('#qzZone'); if(zone) zone.classList.add('done', 'ok');
  const rb = $('#quizResult');
  if(!rb){ q._ended = true; quizMarkBonus(q); if(q.config.onComplete) q.config.onComplete(q.results); return; }
  rb.innerHTML = `<div class="qz-split">${quizReadyHtml()}${quizBonusBtnHtml(q)}</div>`;
  qzBloomSync();
  $('#quizNext').addEventListener('click', e=>{ const bt = e.currentTarget; if(bt.disabled || q._ended) return; bt.disabled = true; q._ended = true; quizMarkBonus(q); if(q.config.onComplete) q.config.onComplete(q.results); });
  $('#quizBonus').addEventListener('click', e=>{ const bt = e.currentTarget; if(bt.disabled) return; bt.disabled = true; quizStartBonus(q); });
}
function quizReadyHtml(q){
  return `<button class="btn qz-next qz-ready" id="quizNext"><span class="qz-bloom"></span>` +
    [[9, .1], [24, 1.3], [41, .7], [58, 1.8], [76, .4], [90, 1.5]].map(([l, d])=> `<i class="qz-lift" style="left:${l}%;animation-delay:${d}s"></i>`).join('') +
    `<span class="qz-word">${q && q.config && q.config.catchUi ? 'Catch!' : 'Ready!'}</span></button>`;   // (4.27) four words in the ball: Catch!
}
function quizTipHtml(){
  return `<i class="qz-tip"><i class="qz-halo"></i>${QUIZ_SPARKS.map(([a, d])=> `<b style="--a:${a}deg;--d:${d}s"></b>`).join('')}${QUIZ_SPARKS_HOT.map(([a, d])=> `<b class="hot" style="--a:${a}deg;--d:${d}s"></b>`).join('')}</i>`;
}
/* a word written: the meter rises (and surges) at once — it used to wait for the next word's screen */
function quizMeterUpdate(q){
  if(q.bonusPhase){                                                    // (4.07) the bonus words: the violet meter rises
    const bf = $('#qzBFill'), bnum = $('#qzBNum'), d = quizBonusDone(q), n = q.config.bonusWords || 1;
    if(bf) bf.style.width = (d / n * 100).toFixed(2) + '%';
    if(bnum) bnum.textContent = `+${d}/${n}`;
    return;
  }
  const c = q.config, n = c.wordTarget, m = $('#qzMeter'), f = $('#qzFill');
  if(!n || !m || !f) return;
  const done = Math.min(q.wordsDone || 0, n), need = c.stopAt || (c.move && c.move.words) || n, pct = done / n * 100;
  const wc = $('#wordCount'); if(wc) wc.textContent = done;
  if(done > 0 && !f.querySelector('.qz-tip')) f.insertAdjacentHTML('beforeend', quizTipHtml());
  m.classList.remove('surge'); void m.offsetWidth; m.classList.add('surge');
  clearTimeout(q._surgeT); q._surgeT = setTimeout(()=>{ const mm = $('#qzMeter'); if(mm) mm.classList.remove('surge'); }, 1300);
  m.dataset.to = pct.toFixed(2);
  quizMeterAnim(q);
  const gauge = m.closest('.qz-gauge');
  if(gauge){ gauge.classList.toggle('powered', done >= need); gauge.classList.toggle('full', done >= n); }
  const se = $('#stopEarly');                                          // (4.07) Attack now: lit once the move is powered, its power on it
  if(se && c.stopAt){
    const ready = (q.wordsDone || 0) >= c.stopAt;
    se.classList.toggle('ready', ready); se.disabled = !ready;
    const sm = se.querySelector('small'); if(sm) sm.textContent = quizAttackSub(q);
  }
}
/* after the screen is drawn: the meter goes on rising from where it stood to where it is now */
function quizMeterGo(q){
  const m = $('#qzMeter');
  if(!m) return;
  quizMeterAnim(q);
  if(m.classList.contains('surge')){ clearTimeout(q._surgeT); q._surgeT = setTimeout(()=>{ const mm = $('#qzMeter'); if(mm) mm.classList.remove('surge'); }, 1300); }
}
/* the fill eased toward data-to: from wherever it is shown now (across a move's word screens too), never jumping */
function quizMeterAnim(q){
  const m = $('#qzMeter'), f = $('#qzFill');
  if(!m || !f) return;
  const to = parseFloat(m.dataset.to) || 0;
  const A = q._meterA || (q._meterA = { shown:parseFloat(f.style.width) || 0, raf:0 });
  cancelAnimationFrame(A.raf); A.raf = 0;
  const from = Math.min(A.shown, to);
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(to - from < 0.05 || reduce || typeof requestAnimationFrame !== 'function'){ A.shown = to; f.style.width = to.toFixed(2) + '%'; m.classList.remove('filling'); return; }
  const D = Math.max(900, Math.min(1700, (to - from) * 38)), t0 = performance.now();
  m.classList.add('filling');
  const w = f.querySelector('.qz-wave'); if(w){ w.classList.remove('go'); void w.offsetWidth; w.classList.add('go'); }
  const step = now=>{
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);   // quick to start, settling softly
    A.shown = from + (to - from) * e;
    const fl = $('#qzFill'); if(fl) fl.style.width = A.shown.toFixed(2) + '%';
    if(k < 1 && ui.quiz === q){ A.raf = requestAnimationFrame(step); return; }
    A.raf = 0; A.shown = to;
    const mm = $('#qzMeter'); if(mm) mm.classList.remove('filling');
  };
  A.raf = requestAnimationFrame(step);
}

/* (3.98) a word wrong: "show the gold bar powering down with no more glowing pulse and sparkles, and the bar
   depleting and turning duller in colour by the second". Its tip goes out at once; the fill drains away over six
   seconds, dulling as it goes. */
function quizMeterDown(q){
  const m = $('#qzMeter'), f = $('#qzFill');
  if(!m || !f) return;
  const A = q._meterA || (q._meterA = { shown:parseFloat(f.style.width) || 0, raf:0 });
  cancelAnimationFrame(A.raf); A.raf = 0;
  clearTimeout(q._surgeT);
  m.classList.remove('surge', 'filling'); m.classList.add('dying');
  const from = A.shown, t0 = performance.now(), D = 6000;
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const at = k=>{ const fl = $('#qzFill'); if(!fl) return; fl.style.width = (from * (1 - k)).toFixed(2) + '%'; fl.style.filter = `saturate(${(1 - 0.85 * k).toFixed(3)}) brightness(${(1 - 0.45 * k).toFixed(3)})`; };
  if(reduce || typeof requestAnimationFrame !== 'function'){ at(0.5); return; }
  const step = now=>{
    const k = Math.min(1, (now - t0) / D);
    at(k);
    A.raf = (k < 1 && ui.quiz === q && $('#qzMeter')) ? requestAnimationFrame(step) : 0;
  };
  A.raf = requestAnimationFrame(step);
}

/* (3.98) The designer: "the galaxy region 6 backsplash animation you did would be good. can we use it along with a
   black square and white writing?" The spelling screen is drawn over Region 6's turning sky (riftPageShow,
   18-rift.js) wherever it is — and goes back to how it was when the writing ends (the sky stays on if it was the
   page's own before). */
function quizSkyOn(){
  if(typeof riftPageShow !== 'function') return;
  if(!ui.quizSky){
    const pending = typeof _riftHideT !== 'undefined' && !!_riftHideT;          // going already: it was not the page's own
    /* (4.09) …unless the page under the spelling asked for it (riftWishOn, 18-rift.js): the spelling page's own
       "no backdrop" on its way in is what set it going */
    const own = typeof riftWishOn === 'function' && riftWishOn();
    ui.quizSky = { had:(document.body.classList.contains('r6-sky') && !pending) || own };
  }
  document.body.classList.add('qz-sky');
  riftPageShow();
  quizSkyWatch();
}
function quizSkyOff(){
  const s = ui.quizSky;
  document.body.classList.remove('qz-sky');
  if(!s) return;
  ui.quizSky = null;
  /* a moment later: the next page may keep it — and (4.09) not at all if the page now showing has asked for it already
     (a fight drawn again before this tidying-up came round) */
  if(!s.had && typeof riftPageHide === 'function' && !(typeof riftWishOn === 'function' && riftWishOn(ui.screen))) riftPageHide(true);
}
let _qzSkyObs = null;
function quizSkyWatch(){
  if(_qzSkyObs || typeof MutationObserver !== 'function') return;
  _qzSkyObs = new MutationObserver(()=>{ if(ui.quizSky && !document.body.classList.contains('writing')) quizSkyOff(); });
  _qzSkyObs.observe(document.body, { attributes:true, attributeFilter:['class'] });
}

function renderQuiz(){
  const q = ui.quiz;
  const word = q.config.words[q.index];
  q.chars = word.split('');
  q.charIndex = 0;
  q.consecutiveMistakes = 0;
  q.wordMistakes = 0;          // total slips on this word, never reset mid-word
  q.locked = false;
  q.resolved = false;
  q.token = ++quizToken;   // new word → new token; any stale interval will stop itself
  q.writers = [];

  $('#brandSub').textContent = q.config.title || 'Spelling';
  const total = q.config.words.length;
  document.body.classList.add('writing');
  document.body.classList.toggle('left-handed', !!(state && state.settings && state.settings.leftHanded));

  /* (3.97) no "Word 3 / 10" over a move's words: it counted the phrases drawn, not the words wanted (the
     designer: "doesn't need to be shown as it doesn't make sense either. The spelling bar is sufficient").
     (3.97) The designer, of the mockups: "I think A is great, but perhaps with a black background? I find the
     references to paper background out of place in this game." A battle's spelling is a battle screen now: the
     move's banner (yours, its name, its target), a power meter that fills with each word, a burning fuse for the
     clock, hearts for the slips, a white card to write on with a glowing edge in the move's colour — on black
     (body.writing, index.html). (3.98) No stamp on each character and no streak: the designer, "please remove the
     streak and 'bang4' (chinese stamp for good at the bottom right)". */
  const tc = quizColour(q.config);
  screenEl.style.setProperty('--tc', tc); screenEl.style.setProperty('--tc-l', quizShade(tc, 0.35)); screenEl.style.setProperty('--tc-d', quizShade(tc, -0.35));
  { const n = parseInt(String(tc).slice(1), 16); if(!isNaN(n)) screenEl.style.setProperty('--tc-glow', `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},.42)`); }   // (3.98) its glow, softly
  const banner = quizBannerHtml(q);
  quizSkyOn();                                                         // (3.98) over Region 6's sky
  /* (3.98) "committed does not need to be written on the top left with a lock, it's assumed" */
  const top = (q.config.lockExit ? '' : `<button class="back-link" id="quizExit">← Exit</button>`) + (q.config.wordTarget ? '' : `<div class="qz-count">Word ${q.index+1} / ${total}</div>`);
  /* (4.27) a catch: its own page, over the monster and the ball (catchQuizHtml, 33-catch.js) */
  if(q.config.catchUi && typeof catchQuizHtml === 'function') screenEl.innerHTML = catchQuizHtml(q);
  else screenEl.innerHTML = `
    ${top ? `<div class="qz-top">${top}</div>` : ''}

    <div class="quiz-layout">
      <div class="quiz-controls">
        ${banner || `<div class="screen-title qz-title">${escapeHtml(q.config.title||'Spell the word')}</div>
        <div class="screen-sub qz-subtitle">${escapeHtml(q.config.subtitle||'Listen, then write what you hear.')}</div>`}
        ${q.config.recovery ? `<div class="qz-party">${state.party.map(m=>{const max=monMax(m);const pct=Math.max(0,m.currentHp/max*100);return `<div><div class="hpbar"><div class="hpfill" style="width:${pct}%;background:${pct<30?'var(--cinnabar)':'var(--jade)'};"></div></div></div>`;}).join('')}</div>` : ''}
        ${q.config.recovery ? `<button class="btn btn-ghost" id="exitRecoveryBtn" style="margin-bottom:10px;">✕ Exit recovery</button>` : ''}

        <div class="listen-row-2">
          <button class="btn btn-jade" id="listenBtn">🔊 Listen</button>
          <button class="btn btn-ghost" id="defBtn">📖 Meaning</button>
        </div>
        <div id="defBox" class="qz-def"></div>
        ${banner ? quizStopHtml(q) : (q.config.wordTarget ? `<div class="qz-banner qz-solo">${quizGaugeHtml(q)}</div>` + quizStopHtml(q) : '')}

        <div id="qzZone" class="qz-zone">
          <div class="qz-live">
            ${q.config.relaxed ? '' : `
            <div id="timerBar" class="qz-fuse"><div id="timerFill"></div></div>
            <div id="mistakeDots" class="qz-dots"></div>`}
            <div id="charProgress" class="char-progress"></div>
          </div>
          <div id="quizResult" class="qz-result"></div>
        </div>
      </div>

      <div class="quiz-write">
        <div id="charsRow" class="write-wrap"></div>
        <div id="quizStatus" class="qz-status"></div>
      </div>
    </div>
  `;

  const qe = $('#quizExit');
  if(qe) qe.addEventListener('click', ()=>{ if(q._ended) return; q._ended = true; stopTimer(); document.body.classList.remove('writing'); if(q.config.onExit) q.config.onExit(); });
  const erb = $('#exitRecoveryBtn');
  if(erb) erb.addEventListener('click', ()=>{ if(q._ended) return; q._ended = true; stopTimer(); document.body.classList.remove('writing'); if(q.config.onExit) q.config.onExit(); });
  const se = $('#stopEarly');
  if(se) se.addEventListener('click', ()=>{
    if(q._ended || se.disabled) return;              // (3.80) once
    if(quizBonusOpen(q, true)) return quizOfferNow(q);   // (4.07) a bonus to offer first: Ready! and it, side by side
    q._ended = true;
    stopTimer();
    q.locked = true;
    quizMarkBonus(q);
    if(q.config.onComplete) q.config.onComplete(q.results);
  });
  $('#listenBtn').addEventListener('click', ()=> speakWord(word));
  $('#defBtn').addEventListener('click', ()=>{
    const def = definitionFor(word);
    $('#defBox').textContent = def ? def : 'Not available';
  });

  // ONE character at a time, in the largest square the screen can give it.
  renderCharProgress();
  const box = document.createElement('div');
  box.id = WRITE_BOX_ID;
  box.className = 'write-box';
  $('#charsRow').appendChild(box);

  renderMistakeDots();
  quizMeterGo(q);                                                      // (3.98) the power meter sweeps up
  initQuizChar(0);
  /* The stroke data is fetched asynchronously. Starting the clock here meant a
     slow character could time out before it ever appeared — failing a word the
     child was never shown. Wait until the strokes are actually on screen. */
  whenWriterReady(()=>{
    if(!q.config.relaxed) startTimer();
    setTimeout(()=> speakWord(word), 200);
  });
  if(q.config.onRender) q.config.onRender(q);                         // (4.27) a catch's page, drawn
}

/* Re-fit the writing box when the device rotates or the window resizes. */
let _fitTimer = null;
function refitWriteBox(){
  if(ui.screen !== 'quiz' || !ui.quiz || ui.quiz.resolved) return;
  clearTimeout(_fitTimer);
  _fitTimer = setTimeout(()=>{ if(ui.screen==='quiz' && ui.quiz && !ui.quiz.resolved) initQuizChar(ui.quiz.charIndex); }, 180);
}
let _battleFitTimer = null;
/* (3.11) Only the fight itself is redrawn: a page shown over a finished one
   (a result, a scene) stays put when the device turns, rather than giving
   way to the fight it closed. */
function refitBattle(){
  if(ui.screen !== 'battle' || !ui.battle || !document.getElementById('battleStage')) return;
  clearTimeout(_battleFitTimer);
  _battleFitTimer = setTimeout(()=>{ if(ui.screen==='battle' && ui.battle && document.getElementById('battleStage')) renderBattle(); }, 200);
}
try{
  window.addEventListener('resize', ()=>{ refitWriteBox(); refitBattle(); });
  window.addEventListener('orientationchange', ()=>{ refitWriteBox(); refitBattle(); });
}catch(e){}

function renderMistakeDots(){
  const q = ui.quiz;
  if(q.config.relaxed) return;   // no attempt limit in practice mode
  const el = $('#mistakeDots');
  if(!el) return;
  /* (3.98) "please revert the hearts back to the 5 red dots": a slip in a row fills one, from the left */
  let h = '';
  for(let i=0;i<MISTAKE_LIMIT;i++) h += `<span class="qz-dot${i < q.consecutiveMistakes ? ' hit' : ''}"></span>`;
  el.innerHTML = h;
}

/* THE BUG THAT FROZE THE CLOCK AFTER WORD ONE
   A stale interval used to tidy up with `clearInterval(quizTimer)` — the
   SHARED handle. By the time it woke and noticed its token was old, quizTimer
   already pointed at the NEW word's interval, so it killed that one instead of
   itself and set the handle to null. The new word's bar sat full while the old
   interval ran on invisibly. An interval must only ever clear its own handle. */
function tick(myToken){
  if(!ui.quiz || ui.quiz.token !== myToken || ui.quiz.resolved) return false;
  if(ui.quiz.paused) return true;                     // (4.28) held: a catch asking whether to let it go — the clock waits
  ui.quiz.timeLeft -= 0.1;
  if(ui.quiz.timeLeft <= 0){
    ui.quiz.timeLeft = 0;
    updateTimerBar();
    resolveWord(false, true);
  } else updateTimerBar();
  return true;
}
function runTimer(myToken){
  const h = setInterval(()=>{
    if(!tick(myToken)){
      clearInterval(h);                       // its OWN handle, never the global
      if(quizTimer === h) quizTimer = null;   // only disown it if it is still ours
    }
  }, 100);
  quizTimer = h;
}
function startTimer(){
  const q = ui.quiz;
  q.timeLeft = TIMER_SECONDS;
  updateTimerBar();
  stopTimer();
  runTimer(q.token);
}
function resetTimer(){ if(ui.quiz) ui.quiz.timeLeft = TIMER_SECONDS; updateTimerBar(); }

/* The clock covers the whole PHRASE, so a slow second or third character would
   eat time the child never had. Hold it while strokes load and resume with the
   time that was left — no reset, no free seconds either. */
function holdTimerForLoad(){
  const q = ui.quiz;
  if(!q || q.config.relaxed) return;
  stopTimer();
  whenWriterReady((ok)=>{
    if(!ok || !ui.quiz || ui.quiz.resolved) return;
    resumeTimer();
  });
}
function resumeTimer(){
  const q = ui.quiz;
  if(!q || q.config.relaxed) return;
  stopTimer();
  runTimer(q.token);      // same rule: the interval owns its own handle
}
function stopTimer(){ if(quizTimer){ clearInterval(quizTimer); quizTimer = null; } }
function updateTimerBar(){
  const q = ui.quiz;
  const fill = $('#timerFill');
  if(!fill || !q) return;
  const pct = Math.max(0,(q.timeLeft/TIMER_SECONDS)*100);
  fill.style.width = pct+'%';
  fill.dataset.t = pct < 33 ? 'low' : (pct < 66 ? 'mid' : 'high');   // (3.97) a fuse: green, then gold, then red (index.html)
}

function writeBoxSize(){
  // Measure the WRAPPER (a plain block element that lays out immediately) rather
  // than the box itself — the box's own size depends on the value we're about to
  // compute, so measuring it produced a smaller reading on the very first render.
  const wrap = $('#charsRow');
  const rect = wrap ? wrap.getBoundingClientRect() : null;
  const byWidth  = rect && rect.width > 0 ? rect.width : Math.min(window.innerWidth - 32, 420);
  const top      = rect ? rect.top : 260;
  const byHeight = window.innerHeight - top - 70;   // room for the status line
  return Math.max(220, Math.floor(Math.min(byWidth, byHeight)));
}

function renderCharProgress(){
  const q = ui.quiz;
  const el = $('#charProgress');
  if(!el) return;
  /* (3.98) "remove the hand and pencil emoticon, just fill up the words in the dark circles as they are written. no
     red fill on the one being written" */
  el.innerHTML = q.chars.map((ch,i)=>{
    const state = i < q.charIndex ? 'done' : (i === q.charIndex ? 'now' : 'todo');
    return `<span class="char-pip ${state}">${state==='done' ? escapeHtml(ch) : ''}</span>`;
  }).join('');
}

function initQuizChar(i){
  const q = ui.quiz;
  q.charIndex = i;
  renderCharProgress();
  const box = writeBoxEl();
  if(box) box.innerHTML = '';                 // reuse the one big box for each character
  // Wait for layout before measuring. Without this the FIRST character of a
  // phrase was sized from an unsettled layout (~2/3 size), which threw off
  // stroke recognition; later characters measured correctly.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(!ui.quiz || ui.quiz.token !== q.token) return;   // moved on already
    buildWriter(i, box);
  }));
}

/* THE BUG THAT FROZE THE CLOCK AFTER A PHRASE'S FIRST CHARACTER
   There is ONE writing box, reused for every character of a phrase. This wait
   used to look for 'qbox-' + charIndex — a box per character, from an older
   layout. From the second character on, that box did not exist, so the wait
   never saw the strokes arrive, gave up after five seconds, and the clock that
   holdTimerForLoad() had paused was never resumed for the rest of the phrase.
   (The '…' loading mark also hung on for those five seconds.) Everything finds
   the box through writeBoxEl() now, so the two can never disagree again. */
const WRITE_BOX_ID = 'qbox-0';
function writeBoxEl(){ return document.getElementById(WRITE_BOX_ID); }

/* Resolve once the current character is actually drawn, or give up quietly so
   a failed load can't leave the quiz frozen with no clock and no way on. */
function whenWriterReady(cb, waited, myToken){
  waited = waited || 0;
  if(myToken == null) myToken = ui.quiz && ui.quiz.token;
  const box = writeBoxEl();
  /* A poll chain started for an earlier word must die rather than fire its
     callback into the current one. */
  if(!ui.quiz || ui.quiz.resolved || ui.quiz.token !== myToken) return;
  if(box && box.querySelector('svg path')) return cb(true);
  /* Five seconds of grace. After that we stop waiting and let the retry notice
     take over, rather than leaving the quiz in limbo. */
  if(waited >= 5000) return cb(false);
  setTimeout(()=> whenWriterReady(cb, waited + 120, myToken), 120);
}

/* ---- stroke-data loading: cached, retried, and never silently stuck ---- */
const CHAR_CACHE_PREFIX = 'hzchar:';
const charMemCache = {};

function loadCharData(ch, onComplete, onError){
  if(charMemCache[ch]) return onComplete(charMemCache[ch]);
  try{
    const cached = localStorage.getItem(CHAR_CACHE_PREFIX + ch);
    if(cached){
      const data = JSON.parse(cached);
      charMemCache[ch] = data;
      return onComplete(data);
    }
  }catch(e){}

  const url = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/' + encodeURIComponent(ch) + '.json';
  let settled = false;
  const finish = (data)=>{
    if(settled) return; settled = true;
    charMemCache[ch] = data;
    try{ localStorage.setItem(CHAR_CACHE_PREFIX + ch, JSON.stringify(data)); }catch(e){}
    onComplete(data);
  };
  const fail = (why)=>{
    if(settled) return; settled = true;
    console.warn('stroke data failed for', ch, why);
    if(onError) onError(new Error(why));
  };

  const attempt = (tries)=>{
    if(settled) return;
    const ctl = ('AbortController' in window) ? new AbortController() : null;
    // don't let a hung request sit there forever
    const timer = setTimeout(()=>{
      if(ctl) try{ ctl.abort(); }catch(e){}
      if(tries > 0) attempt(tries - 1); else fail('timed out');
    }, 5000);
    fetch(url, ctl ? { signal: ctl.signal } : undefined)
      .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(d=>{ clearTimeout(timer); finish(d); })
      .catch(err=>{
        clearTimeout(timer);
        if(settled) return;
        if(tries > 0) setTimeout(()=>attempt(tries - 1), 400);
        else fail(err && err.message);
      });
  };
  attempt(2);          // one try plus two retries
}

function buildWriter(i, box){
  const q = ui.quiz;
  const size = writeBoxSize();
  if(box){ box.style.width = size+'px'; box.style.height = size+'px'; }
  // Practice ("relaxed") mode is a low-pressure learning space: no timer, no
  // attempt cap, and Hanzi Writer's own hint appears after 3 misses on a stroke.
  // Battle / catch / recovery keep the strict rules — no hints there, ever.
  /* Practice keeps its fixed schedule. Everywhere else, hints taper off as a
     phrase becomes familiar: free for the first two attempts, then after one
     miss, then after three, then not at all. */
  // `word` is not in scope here — read the current phrase off the quiz. A bare
  // reference threw a ReferenceError, which aborted buildWriter entirely and
  // left the writing pad blank.
  const currentWord = q.config.words[q.index];
  const hintAfter = q.config.noHints ? false
    : (q.config.relaxed ? (q.config.hintAfterMisses || 3)
                        : hintScheduleFor(currentWord));
  /* Hanzi Writer's leniency multiplier: >1 accepts sloppier strokes. Young
     hands need the slack; the slider lives in Settings. */
  const leniency = (state && state.settings && state.settings.leniency) || 1.0;
  const writer = HanziWriter.create(box, q.chars[i], {
    width:size, height:size, padding:Math.round(size*0.05),
    showCharacter:false, showOutline:false, showHintAfterMisses:false,
    /* (3.98) white writing on a dark square (the designer: "a black square and white writing") */
    strokeColor:'#ffffff', drawingColor:'#ffffff', drawingWidth:Math.max(24, Math.round(size*0.075)),
    highlightColor:'#ffd66a',
    /* (4.27) on a catch's white ball, dark ink */
    ...(q.config.catchUi ? { strokeColor:'#271b57', drawingColor:'#33256e', highlightColor:'#ff8a1f' } : {}),
    /* Stroke data comes off a CDN. A character the browser has never seen needs
       a live fetch, and with no handling a slow or failed request left the pad
       blank and unresponsive — which is why it stalled on NEW words and why
       backgrounding the app (forcing a re-render, and a retry) unstuck it.
       Cached locally after the first success, so each character is fetched once
       ever and later practice works offline. */
    charDataLoader: (ch, onComplete, onError) => loadCharData(ch, onComplete, onError),
  });
  q.writers[i] = writer;
  // show that something is happening while the strokes are fetched
  if(!box.querySelector('svg path')){
    const wait = document.createElement('div');
    wait.className = 'write-loading';
    wait.textContent = '…';
    box.appendChild(wait);
    whenWriterReady(()=>{ if(wait.parentNode) wait.remove(); });
  }
  /* Last resort: if the strokes never arrive, tell the player rather than
     leaving a blank square they can draw on but never complete. */
  clearTimeout(q._loadGuard);
  q._loadGuard = setTimeout(()=>{
    if(!box || !box.querySelector('svg path')){
      const note = document.createElement('div');
      note.className = 'write-stall';
      note.innerHTML = `Couldn't load this character.<br><button class="btn btn-ghost" id="wrRetry">Try again</button>`;
      box.appendChild(note);
      const r = note.querySelector('#wrRetry');
      if(r) r.addEventListener('click', ()=>{ note.remove(); renderQuiz(); });
    }
  }, 5200);            // just after the grace period ends
  writer.quiz({
    leniency: leniency,
    showHintAfterMisses: hintAfter,
    onMistake:function(strokeData){
      if(q.locked) return;
      q.consecutiveMistakes++;
      q.wordMistakes = (q.wordMistakes||0) + 1;
      renderMistakeDots();
      if(!q.config.relaxed && q.consecutiveMistakes >= MISTAKE_LIMIT){ resolveWord(false,false); return; }
      const st=$('#quizStatus');
      if(st){
        const misses = (strokeData && strokeData.mistakesOnStroke) || q.consecutiveMistakes;
        st.textContent = (q.config.relaxed && misses >= hintAfter)
          ? 'Watch the highlighted stroke, then try it.'
          : 'Try that stroke again.';
        st.style.color='var(--cinnabar)';
      }
    },
    onCorrectStroke:function(){
      if(q.locked) return;
      q.consecutiveMistakes = 0;
      renderMistakeDots();
      if(!q.config.relaxed) resetTimer();
      const st=$('#quizStatus'); if(st){ st.textContent=''; }
    },
    onComplete:function(){
      if(q.locked) return;
      if(i+1 < q.chars.length){
        // brief green flash, then the same big box takes the next character
        if(box) box.classList.add('char-done');
        setTimeout(()=>{
          if(box) box.classList.remove('char-done');
          initQuizChar(i+1);
          holdTimerForLoad();       // pause while the next character's strokes arrive
        }, 280);                                                       // (3.98) as before 3.97: no stamp to wait for
      } else {
        if(box) box.classList.add('char-done');
        resolveWord(true,false);
      }
    }
  });
}

/* (4.06) The bloom across a spelt word's strokes (#qzBloomPaint, index.html): begun now, so that it and the bloom under
   Ready! (a CSS animation, begun as the button is drawn) sweep together, every 3.2 s */
function qzBloomSync(){
  const a = document.getElementById('qzBloomAnim');
  try { if(a && typeof a.beginElement === 'function') a.beginElement(); } catch(e){}
}
function resolveWord(passed, timedOut){
  const q = ui.quiz;
  if(q.resolved) return;
  q.resolved = true;
  q.locked = true;
  stopTimer();
  const word = q.config.words[q.index];
  // A practice word can't "fail" (unlimited tries), but one that took several
  // attempts should still surface first in Recovery later.
  if(!passed || (q.config.relaxed && (q.wordMistakes||0) >= 3)) recordWrong(word);
  // Mastery only accrues in SCORED contexts — practice deliberately doesn't count.
  if(!q.config.relaxed){
    noteAttempt(word);                 // drives the tapering hint curve
    if(passed){
      q.masteryReward = recordMastery(word) || q.masteryReward;
      const daily = noteDailyPhrase();
      if(daily) q.dailyReward = daily;
    }
    saveProfile();
  }
  playSfx(passed ? 'answer_correct' : 'answer_wrong');
  if(passed){ q.wordsDone = (q.wordsDone||0) + countWords(word); quizMeterUpdate(q); }
  else if(q.bonusPhase){ const bm = $('#qzBMeter'); if(bm) bm.classList.add('dying'); }   // (4.07) the bonus is lost; the move is not
  else if(q.config.wordTarget) quizMeterDown(q);                       // (3.98) the charge dies away
  q.results.push({ text:word, passed, mistakes:q.wordMistakes||0, timedOut, words:countWords(word) });
  /* (4.27) a catch: the phrase's words go into the ball — or, missed, the ball's are lost and the monster may flee */
  if(q.config.onWord){ try { q.config.onWord(passed, q, word); } catch(e){ console.error('onWord:', e); } }

  const st = $('#quizStatus');
  const rb = $('#quizResult');
  if(st) st.textContent = '';
  if(rb){
    /* (3.98) The designer: "for a correctly spelt phrase, remove 'correct' and the tick, and for a wrong one, remove the
       cross and not quite … still show the correct words and definition. for a correct one, show the phrase and
       definition in the same font colour as 'listen and meaning' with the 'continue' in translucent black too …
       completion or getting the word wrong should remove the circles … i don't want it to move anymore." The timer,
       the dots and the circles give way, in the same box, to the phrase, its meaning and Continue: the square stays
       where it is, and Continue is just above it, where the thumb is. */
    const zone = $('#qzZone'); if(zone) zone.classList.add('done', passed ? 'ok' : 'bad');
    const db = $('#defBox'); if(db) db.textContent = '';                // its meaning is in the result now: not twice
    /* (4.03) a word missed: what was written of it goes lifeless (its strokes grey-yellow and still: .char-bad) */
    const wb = document.getElementById(WRITE_BOX_ID); if(wb && !passed){ wb.classList.remove('char-done'); wb.classList.add('char-bad'); }
    /* (4.03) the designer: "A completed move should read 'Ready!' with an exciting button design … A failed move reads
       continue with a simpler and less flashy button design". Ready! (their pick: glowing glass, a bloom passing under
       it), at once; a move failed: Continue in plain glass; anything else as before */
    const c = q.config, ends = quizWillEnd(passed);
    const need = c.stopAt || (c.move && c.move.words) || c.wordTarget;
    const powered = ends && !!c.wordTarget && (q.wordsDone || 0) >= need;
    const ready = passed && powered;
    const btn0 = ready
      ? quizReadyHtml(q)
      : `<button class="btn qz-next${ends && !passed ? ' qz-quiet' : ''}" id="quizNext">${ends ? 'Continue' : (c.catchUi ? 'Next' : 'Next word')}</button>`;
    /* (4.07) a bonus to offer: it stands beside Ready! (or beside Continue, a scaling move's slip once powered) */
    const btn = quizBonusOpen(q, powered) ? `<div class="qz-split">${btn0}${quizBonusBtnHtml(q)}</div>` : btn0;
    rb.innerHTML = `
      <div class="qz-res ${passed ? 'ok' : 'bad'}">
        <div class="qz-res-word">${escapeHtml(word)}</div>
        <div class="qz-res-def">${escapeHtml(definitionFor(word)||'')}</div>
        ${(passed && !q.config.relaxed) ? masteryChip(word) : ''}
      </div>
      ${btn}
    `;
    /* (4.06) the word spelt: Ready!'s bloom across its strokes too, begun with Ready!'s (as it is drawn, now), every 3.2 s */
    if(passed) qzBloomSync();
    /* (3.80) one tap: a quick second one used to run the end of the quiz
       twice — a move resolved twice, two bonus offers stacked */
    $('#quizNext').addEventListener('click', e=>{ const bt = e.currentTarget; if(bt.disabled) return; bt.disabled = true; advanceQuiz(); });
    const qb = $('#quizBonus');                                        // (4.07) the bonus words, here
    if(qb) qb.addEventListener('click', e=>{ const bt = e.currentTarget; if(bt.disabled) return; bt.disabled = true; const nx = $('#quizNext'); if(nx) nx.disabled = true; quizStartBonus(q); });
  } else {
    /* (3.80) The quiz is not on the screen (something drew over it): it must
       still go on — the next word, or its end — never wait for a button
       that is not there. */
    setTimeout(()=>{ if(ui.quiz === q && !q._ended) advanceQuiz(); }, 900);
  }
}

function quizWillEnd(passed){
  const q = ui.quiz;
  if(q.config.fled) return true;                                      // (4.27) the monster you were catching is gone
  if(q.index+1 >= q.config.words.length) return true;
  if(q.config.stopAtFirstMiss && !passed) return true;
  /* (4.03) as advanceQuiz ends it: a move's words all written (it said "Next word" over a move already powered), or
     one miss too many */
  if(q.config.wordTarget && (q.wordsDone || 0) >= q.config.wordTarget) return true;
  if(q.config.endAfterMistakes && !passed && q.results.filter(r=> !r.passed).length >= q.config.endAfterMistakes) return true;
  return false;
}

function medalIcon(tier){ return tier==='gold'?'🥇':(tier==='silver'?'🥈':(tier==='bronze'?'🥉':'📈')); }
function masteryChip(word){
  const n = masteryOf(word);
  const tier = masteryTier(n);
  const next = n < MASTERY_CHECKPOINTS.bronze ? MASTERY_CHECKPOINTS.bronze
             : (n < MASTERY_CHECKPOINTS.silver ? MASTERY_CHECKPOINTS.silver
             : (n < MASTERY_CHECKPOINTS.gold ? MASTERY_CHECKPOINTS.gold : null));
  const label = next ? `${medalIcon(tier)} mastery ${n} / ${next}` : `🥇 mastered ×${n}`;
  return `<div style="font-size:11px;color:var(--ink-soft);font-weight:800;margin-top:6px;">${label}</div>`;
}

function advanceQuiz(){
  const q = ui.quiz;
  if(!q || q._ended) return;                         // (3.80) a quiz ends once
  const end = how=>{ q._ended = true; stopTimer(); if(how === 'exit'){ if(q.config.onExit) q.config.onExit(); } else { quizMarkBonus(q); if(q.config.onComplete) q.config.onComplete(q.results); } };   // (4.07) and how its bonus went
  if(q.masteryReward){ announceMastery(q.masteryReward); q.masteryReward = null; }
  if(q.dailyReward){ const r = q.dailyReward; q.dailyReward = null; setTimeout(()=>announceDaily(r), 1200); }
  if(q.config.fled) return end();                                     // (4.27) fled: the catch is over
  const last = q.results[q.results.length-1];
  if(q.config.stopAtFirstMiss && last && !last.passed) return end();
  if(q.config.endAfterMistakes){
    const misses = q.results.filter(r=>!r.passed).length;
    if(misses >= q.config.endAfterMistakes) return end();
  }
  // Word-powered moves finish the moment the target is met or exceeded — the
  // overshoot from a long final phrase is handed to the next move as spill.
  if(q.config.wordTarget && q.wordsDone >= q.config.wordTarget) return end();
  q.index++;
  if(q.index < q.config.words.length){ renderQuiz(); }
  else end();
}


