/* ==========================================================
   03-quiz.js
   The writing quiz: word selection, hints, Hanzi Writer, voice.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ============================================================
   OVERMASTERY
   Reps beyond a word's gold threshold (25) still represent real effort, so
   they pool together across ALL phrases and pay out on the same 5 / 15 / 25
   rhythm, resetting each time a cycle completes.
   The pool is capped at 30% of the player's gold-mastered phrases (rounded up)
   worth of cycles, so grinding one familiar phrase forever earns nothing —
   breadth has to grow before the surplus keeps counting.
   Fully idempotent: it recomputes from scratch and grants only the difference,
   so previously-uncredited effort is picked up without ever paying twice.
   ============================================================ */
const OVERMASTERY_CYCLE = 25;
const OVERMASTERY_STEPS = { bronze:5, silver:15, gold:25 };
const OVERMASTERY_CAP_RATIO = 0.30;

function overmasteryStats(){
  const wm = (state && state.wordMastery) || {};
  const gold = MASTERY_CHECKPOINTS.gold;
  let excess = 0, goldWords = 0;
  Object.values(wm).forEach(v=>{
    if(v >= gold){ goldWords++; excess += (v - gold); }
  });
  const maxCycles = Math.ceil(goldWords * OVERMASTERY_CAP_RATIO);
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

  screenEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      ${q.config.lockExit
        ? `<span style="font-size:13px;font-weight:800;color:var(--ink-soft);opacity:0.6;">🔒 Committed</span>`
        : `<button class="back-link" id="quizExit">← Exit</button>`}
      <div style="font-weight:800;color:var(--ink-soft);font-size:13px;">Word ${q.index+1} / ${total}</div>
    </div>

    <div class="quiz-layout">
      <div class="quiz-controls">
        <div class="screen-title" style="font-size:20px;">${escapeHtml(q.config.title||'Spell the word')}</div>
        <div class="screen-sub" style="margin-bottom:10px;">${escapeHtml(q.config.subtitle||'Listen, then write what you hear.')}</div>
        ${q.config.recovery ? `<div style="display:flex;gap:5px;margin-bottom:10px;">${state.party.map(m=>{const max=monMax(m);const pct=Math.max(0,m.currentHp/max*100);return `<div style="flex:1;"><div class="hpbar" style="height:6px;"><div class="hpfill" style="width:${pct}%;background:${pct<30?'var(--cinnabar)':'var(--jade)'};"></div></div></div>`;}).join('')}</div>` : ''}
        ${q.config.recovery ? `<button class="btn btn-ghost" id="exitRecoveryBtn" style="margin-bottom:10px;">✕ Exit recovery</button>` : ''}

        <div class="listen-row-2">
          <button class="btn btn-jade" id="listenBtn">🔊 Listen</button>
          <button class="btn btn-ghost" id="defBtn">📖 Meaning</button>
        </div>
        <div id="defBox" style="text-align:center;font-size:13px;color:var(--ink-soft);font-weight:700;min-height:18px;margin:6px 0;"></div>
        ${q.config.wordTarget ? `
        <div class="word-meter">
          <div class="word-meter-head">
            <span>字 Words written</span>
            <span><b id="wordCount">${Math.min(q.wordsDone||0, q.config.wordTarget)}</b> / ${q.config.wordTarget}</span>
          </div>
          <div class="word-meter-bar"><div id="wordMeterFill" style="width:${Math.min(100,(q.wordsDone||0)/q.config.wordTarget*100)}%;"></div></div>
          ${(q.config.startingWords||0) > 0 ? `<div class="word-meter-note">+${q.config.startingWords} carried over</div>` : ''}
          ${q.config.stopAt ? `<button class="btn btn-ghost stop-early ${(q.wordsDone||0) >= q.config.stopAt ? 'ready' : ''}"
             id="stopEarly" ${(q.wordsDone||0) >= q.config.stopAt ? '' : 'disabled'}>
             ⏹ Stop here${(q.wordsDone||0) >= q.config.stopAt ? ` — ${q.wordsDone} words` : ` (${q.config.stopAt} needed)`}
           </button>` : ''}
        </div>` : ''}

        ${q.config.relaxed ? '' : `
        <div id="timerBar" style="height:8px;background:var(--paper-3);border-radius:6px;overflow:hidden;margin-bottom:4px;">
          <div id="timerFill" style="height:100%;width:100%;background:var(--jade);transition:width .25s linear;"></div>
        </div>
        <div id="mistakeDots" style="display:flex;justify-content:center;gap:6px;margin:8px 0;"></div>`}
      </div>

      <div class="quiz-write">
        <!-- result/next sits ABOVE the box so it needs no scrolling -->
        <div id="quizResult"></div>
        <div id="charProgress" class="char-progress"></div>
        <div id="charsRow" class="write-wrap"></div>
        <div id="quizStatus" style="text-align:center;font-size:14px;font-weight:700;min-height:20px;"></div>
      </div>
    </div>
  `;

  const qe = $('#quizExit');
  if(qe) qe.addEventListener('click', ()=>{ stopTimer(); document.body.classList.remove('writing'); if(q.config.onExit) q.config.onExit(); });
  const erb = $('#exitRecoveryBtn');
  if(erb) erb.addEventListener('click', ()=>{ stopTimer(); document.body.classList.remove('writing'); if(q.config.onExit) q.config.onExit(); });
  const se = $('#stopEarly');
  if(se) se.addEventListener('click', ()=>{
    stopTimer();
    q.locked = true;
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
  box.id = 'qbox-0';
  box.className = 'write-box';
  $('#charsRow').appendChild(box);

  renderMistakeDots();
  initQuizChar(0);
  if(!q.config.relaxed) startTimer();
  setTimeout(()=> speakWord(word), 400);
}

/* Re-fit the writing box when the device rotates or the window resizes. */
let _fitTimer = null;
function refitWriteBox(){
  if(ui.screen !== 'quiz' || !ui.quiz || ui.quiz.resolved) return;
  clearTimeout(_fitTimer);
  _fitTimer = setTimeout(()=>{ if(ui.screen==='quiz' && ui.quiz && !ui.quiz.resolved) initQuizChar(ui.quiz.charIndex); }, 180);
}
let _battleFitTimer = null;
function refitBattle(){
  if(ui.screen !== 'battle' || !ui.battle) return;
  clearTimeout(_battleFitTimer);
  _battleFitTimer = setTimeout(()=>{ if(ui.screen==='battle' && ui.battle) renderBattle(); }, 200);
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
  el.innerHTML = '';
  for(let i=0;i<MISTAKE_LIMIT;i++){
    const d = document.createElement('div');
    d.style.cssText = 'width:9px;height:9px;border-radius:50%;background:'+(i<q.consecutiveMistakes?'var(--cinnabar)':'var(--paper-3)');
    el.appendChild(d);
  }
}

function startTimer(){
  const q = ui.quiz;
  q.timeLeft = TIMER_SECONDS;
  updateTimerBar();
  stopTimer();
  const myToken = q.token;
  quizTimer = setInterval(()=>{
    // if the quiz moved on (new word/quiz) or resolved, this interval is stale — stop it
    if(!ui.quiz || ui.quiz.token !== myToken || ui.quiz.resolved){
      clearInterval(quizTimer); quizTimer = null; return;
    }
    ui.quiz.timeLeft -= 0.1;
    if(ui.quiz.timeLeft <= 0){
      ui.quiz.timeLeft = 0;
      updateTimerBar();
      resolveWord(false, true);
    } else {
      updateTimerBar();
    }
  }, 100);
}
function resetTimer(){ if(ui.quiz) ui.quiz.timeLeft = TIMER_SECONDS; updateTimerBar(); }
function stopTimer(){ if(quizTimer){ clearInterval(quizTimer); quizTimer = null; } }
function updateTimerBar(){
  const q = ui.quiz;
  const fill = $('#timerFill');
  if(!fill || !q) return;
  const pct = Math.max(0,(q.timeLeft/TIMER_SECONDS)*100);
  fill.style.width = pct+'%';
  fill.style.background = pct < 33 ? 'var(--cinnabar)' : (pct < 66 ? 'var(--gold)' : 'var(--jade)');
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
  el.innerHTML = q.chars.map((ch,i)=>{
    const state = i < q.charIndex ? 'done' : (i === q.charIndex ? 'now' : 'todo');
    return `<span class="char-pip ${state}">${state==='done' ? escapeHtml(ch) : (state==='now' ? '✍️' : '•')}</span>`;
  }).join('');
}

function initQuizChar(i){
  const q = ui.quiz;
  q.charIndex = i;
  renderCharProgress();
  const box = $('#qbox-0');
  if(box) box.innerHTML = '';                 // reuse the one big box for each character
  // Wait for layout before measuring. Without this the FIRST character of a
  // phrase was sized from an unsettled layout (~2/3 size), which threw off
  // stroke recognition; later characters measured correctly.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(!ui.quiz || ui.quiz.token !== q.token) return;   // moved on already
    buildWriter(i, box);
  }));
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
    strokeColor:'#232019', drawingColor:'#232019', drawingWidth:Math.max(24, Math.round(size*0.075)),
    highlightColor:'#c8453a',
  });
  q.writers[i] = writer;
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
        }, 280);
      } else {
        if(box) box.classList.add('char-done');
        resolveWord(true,false);
      }
    }
  });
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
    }
    saveProfile();
  }
  playSfx(passed ? 'answer_correct' : 'answer_wrong');
  if(passed) q.wordsDone = (q.wordsDone||0) + countWords(word);
  q.results.push({ text:word, passed, mistakes:q.wordMistakes||0, timedOut, words:countWords(word) });

  const st = $('#quizStatus');
  const rb = $('#quizResult');
  if(st) st.textContent = '';
  if(rb){
    rb.innerHTML = `
      <div style="text-align:center;margin-top:10px;padding:14px;border-radius:12px;background:${passed?'rgba(47,143,111,0.12)':'rgba(200,69,58,0.09)'};border:1px solid ${passed?'rgba(47,143,111,0.35)':'rgba(200,69,58,0.3)'};">
        <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:18px;color:${passed?'var(--jade-dark)':'var(--cinnabar-dark)'};">
          ${passed?'✓ Correct!':(timedOut?'⏱ Out of time':'✗ Not quite')}
        </div>
        <div style="font-family:'Noto Sans SC';font-size:26px;font-weight:700;margin-top:4px;">${escapeHtml(word)}</div>
        <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-top:2px;">${escapeHtml(definitionFor(word)||'')}</div>
        ${(passed && !q.config.relaxed) ? masteryChip(word) : ''}
      </div>
      <button class="btn btn-primary" id="quizNext" style="margin-top:12px;">${quizWillEnd(passed) ? 'Continue' : 'Next word'}</button>
    `;
    $('#quizNext').addEventListener('click', advanceQuiz);
  }
}

function quizWillEnd(passed){
  const q = ui.quiz;
  if(q.index+1 >= q.config.words.length) return true;
  if(q.config.stopAtFirstMiss && !passed) return true;
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
  if(q.masteryReward){ announceMastery(q.masteryReward); q.masteryReward = null; }
  const last = q.results[q.results.length-1];
  if(q.config.stopAtFirstMiss && last && !last.passed){
    stopTimer(); if(q.config.onComplete) q.config.onComplete(q.results); return;
  }
  if(q.config.endAfterMistakes){
    const misses = q.results.filter(r=>!r.passed).length;
    if(misses >= q.config.endAfterMistakes){
      stopTimer(); if(q.config.onComplete) q.config.onComplete(q.results); return;
    }
  }
  // Word-powered moves finish the moment the target is met or exceeded — the
  // overshoot from a long final phrase is handed to the next move as spill.
  if(q.config.wordTarget && q.wordsDone >= q.config.wordTarget){
    stopTimer(); if(q.config.onComplete) q.config.onComplete(q.results); return;
  }
  q.index++;
  if(q.index < q.config.words.length){ renderQuiz(); }
  else { stopTimer(); if(q.config.onComplete) q.config.onComplete(q.results); }
}


