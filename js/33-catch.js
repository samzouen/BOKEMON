/* ============================================================
   33-catch.js — CATCHING (4.27)
   The designer (2026-11-11): "catching should now be a per 4 words attempt that fires a ring of 12 glowing cycling orbs
   (much like the loading screen, but with orbs that cycle through a spectrum of light glowing colours instead of
   elemental symbols) … at the centre of the screen and ring of orbs is the monster sprite being captured … the monster
   glows into a bright white silhouette and emanates a glowing white aura with a vibration. It either then repulses the
   orbs and pushes them back out of the screen with a vibration if the catch fails, or if the catch succeeds, then the
   orbs fully cycle into the white sprite and a glowing aura fills the screen with no vibration before the sprite remains
   as a caught monster (gently floating up and down)." And "the UI should be different than battling UI. I want a white
   glowing ball in the centre of the spelling field which is near the bottom of the page. The backdrop is your region 6
   galaxy space. near the top of the page is the floating monster … grow by absorbing energy balls with each phrase
   completed … when 4 words are spelt, the spelling UI (cross) fades, leaving the ball which opens up into twelve orbs
   … it should be one seamless UI between spelling and the catching phase." Then: "let's clear UI text as much as
   possible … and do not show the hard pity number to maintain suspense."
   So a catch is a screen of its own over Region 6's sky (quizSkyOn): the monster floating near the top (#czMon), a white
   ball behind the square you write in near the bottom (#czBall), and over everything a canvas for the light (#czFx).
   The three stay put while the spelling comes and goes over them (renderQuiz, with config.catchUi: catchQuizHtml).
   Every throw costs four words (one hanzi, one word: countWords); a phrase that runs past four carries the rest into
   the next throw. Out of 1000 a throw catches it `win` times (CATCH.odds); the `pity`-th throw always does. A word
   missed loses the ball's gathered words, and the monster may flee (`flee` of 1000). Near the line, the throw fakes:
   a win in the first 35% of its band above the line builds, falls back, builds again; a miss within 35% of the band
   below the line builds, falls back, and is thrown off (4.28, from 20%: "let's make near misses 35% to increase the
   suspense too").
   (4.28) Felt as well as seen (buzz, 02-core.js): "the catching buzz should happen on near misses, near catches, and
   successful catches only" — the fakeout's swell, the catch itself, a near miss thrown off; a plain miss is quiet. And
   "the X is ok but please include a confirmation message so it doesn't get accidentally dismissed": ✕ asks first
   (czAskLetGo), the word's clock held meanwhile.
   ============================================================ */
const CATCH = {
  words:4,
  odds:{
    legendary:{ win:225, pity:18, flee:850 },   // 9 throws for 90%
    elite:    { win:315, pity:12, flee:650 },   // 6
    starter:  { win:365, pity:10, flee:500 },   // 5 (a special one too: the Mouse)
    wild:     { win:530, pity:6,  flee:250 },   // 3
  },
  near:{ win:0.35, miss:0.35 },
  orbs:12,
};
function catchTier(species){
  const t = SPECIES[species] && SPECIES[species].tier;
  return t === 'legendary' ? 'legendary' : t === 'elite' ? 'elite' : (t === 'starter' || t === 'special') ? 'starter' : 'wild';
}
/* the line out of 1000 (a roll at or over it catches), and the near bands either side of it */
function catchBands(tier){
  const o = CATCH.odds[tier], line = 1000 - o.win;
  return { line, nearWin:line + Math.round(o.win * CATCH.near.win), nearMiss:line - Math.round(o.win * CATCH.near.miss) };
}
/* a throw, the `n`-th of this catch: 'win', 'nearWin' (a fakeout, then caught), 'nearMiss' (a fakeout, then thrown off)
   or 'miss'. `rnd` (0–1) for a test. The pity throw is caught whatever the roll — shown as a near win. */
function catchRoll(tier, n, rnd){
  const o = CATCH.odds[tier], b = catchBands(tier);
  const r = Math.min(999, Math.floor((rnd == null ? Math.random() : rnd) * 1000));
  let kind = r >= b.line ? (r < b.nearWin ? 'nearWin' : 'win') : (r >= b.nearMiss ? 'nearMiss' : 'miss');
  const pity = n >= o.pity && (kind === 'miss' || kind === 'nearMiss');
  if(pity) kind = 'nearWin';
  return { r, kind, pity, won:kind === 'win' || kind === 'nearWin' };
}
function catchFlees(tier, rnd){ return Math.floor((rnd == null ? Math.random() : rnd) * 1000) < CATCH.odds[tier].flee; }

/* ---------- the catch itself ---------- */
let _czId = 0;
function catchBegin(enemy){
  catchTeardown();
  const C = ui.catching = { enemy, tier:catchTier(enemy.species), throws:0, carry:0, queue:[], phase:'spell', id:++_czId };
  /* its words: the fight's misses first (as before), then the day's */
  C.queue = [...new Set(((ui.battle && ui.battle.fightMistakes) || []).slice())];
  /* (3.49) its jingle and the miss's to the front of the queue, in memory well before they are wanted */
  preloadSfx(['catch_success', 'catch_miss'], true);
  czStage(enemy);
  catchSpell();
}
function catchWords(n){
  const C = ui.catching, out = [];
  while(C && out.length < n){
    if(!C.queue.length){ const all = activePool().map(w=> w.text); if(!all.length) break; C.queue.push(...shuffle(all)); }
    out.push(C.queue.shift());
  }
  if(!out.length) out.push('你好');
  return out;
}
/* the spelling: four words for a throw, with whatever the last throw's phrase carried over */
function catchSpell(){
  const C = ui.catching;
  if(!C) return;
  C.phase = 'spell';
  if(CZ){ CZ.ball.level = C.carry; CZ.ball.shown = C.carry; }
  startQuiz({
    catchUi:true, title:SPECIES[C.enemy.species].name,
    words:catchWords(8), wordTarget:CATCH.words, startingWords:C.carry, lockExit:true,
    onWord:(passed, q, word)=> catchOnWord(passed, q, word),
    onRender:()=> catchOnRender(),
    onComplete:()=> catchOnDone(),
    onExit:()=> catchLetGo(),
  });
}
function catchQuizHtml(q){
  /* (4.27) "let's clear UI text as much as possible": no title, no count, Listen and Meaning as their icons */
  return `
    <button class="cz-x" id="czLetGo" aria-label="Let it go">✕</button>
    <div class="quiz-layout cz-layout">
      <div class="quiz-controls">
        <div class="cz-tools">
          <button class="btn cz-ic" id="listenBtn" aria-label="Listen">🔊</button>
          <div id="defBox" class="qz-def"></div>
          <button class="btn cz-ic" id="defBtn" aria-label="Meaning">📖</button>
        </div>
        <div id="qzZone" class="qz-zone">
          <div class="qz-live">
            <div id="timerBar" class="qz-fuse"><div id="timerFill"></div></div>
            <div id="mistakeDots" class="qz-dots"></div>
            <div id="charProgress" class="char-progress"></div>
          </div>
          <div id="quizResult" class="qz-result"></div>
        </div>
      </div>
      <div class="quiz-write">
        <div id="charsRow" class="write-wrap"></div>
        <div id="quizStatus" class="qz-status"></div>
      </div>
    </div>`;
}
function catchOnRender(){
  const b = document.getElementById('czLetGo');
  if(b) b.addEventListener('click', ()=> czAskLetGo());
  /* back from a throw: the spelling fades in over the new ball */
  if(document.body.classList.contains('cz-throwing')) requestAnimationFrame(()=> requestAnimationFrame(()=> document.body.classList.remove('cz-throwing')));
}
/* a phrase written: its words go into the ball. Missed: the ball's words are lost, and the monster may flee. */
function catchOnWord(passed, q, word){
  const C = ui.catching;
  if(!C) return;
  if(passed){ czAbsorb(countWords(word)); return; }
  q.wordsDone = 0; C.carry = 0;
  czDissipate();
  if(C.forceFlee != null ? C.forceFlee : catchFlees(C.tier)){       // (a test's: forceFlee)
    q.config.fled = true; C.phase = 'gone';
    czHoldNext(true);
    czFlee().then(()=> czHoldNext(false));
  } else czStruggle();
}
/* the quiz over: fled, four words and Catch!, or (its phrases all spent first) more words */
function catchOnDone(){
  const C = ui.catching, q = ui.quiz;
  if(!C || !q) return;
  if(q.config.fled) return catchGone();
  const done = q.wordsDone || 0;
  if(done < CATCH.words){ C.carry = done; return catchSpell(); }
  C.carry = done - CATCH.words;
  catchThrow();
}
async function catchThrow(){
  const C = ui.catching;
  if(!C) return;
  czPrime();                                                          // (4.29) in the tap: its jingle made ready
  C.phase = 'throw';
  ui.screen = 'catch';                                               // nothing redraws the spelling under it
  C.throws++;
  const roll = C.last = catchRoll(C.tier, C.throws);
  if(C.force) roll.kind = C.force, roll.won = /win/i.test(C.force);    // a test's
  await czThrow(roll.kind);
  if(ui.catching !== C) return;
  if(roll.won){ C.phase = 'caught'; return gotcha(C.enemy, { played:true }); }
  /* thrown off: a ball again (with the words carried over), the spelling back over it */
  czReform();
  catchSpell();
}
function catchGone(){ catchTeardown(); afterCatch(); }
/* (4.28) ✕ — the designer: "the X is ok but please include a confirmation message so it doesn't get accidentally
   dismissed". Asked first, over everything, the word's clock held (q.paused) while it asks; off the panel, or Escape,
   is Keep trying. Fled already, or mid-throw: nothing to ask. */
function czAskLetGo(){
  const C = ui.catching;
  if(!C || C.leaving || document.getElementById('czAsk')) return;
  if(C.phase !== 'spell') return C.phase === 'gone' ? catchLetGo() : undefined;
  const q = ui.quiz, held = q && q.config && q.config.catchUi && !q._ended ? q : null;
  if(held) held.paused = true;
  const ask = document.createElement('div');
  ask.id = 'czAsk'; ask.className = 'cz-ask';
  ask.innerHTML = `
    <div class="cz-ask-box" role="dialog" aria-modal="true" aria-labelledby="czAskMsg">
      <div class="cz-msg cz-ask-msg" id="czAskMsg">Let ${escapeHtml(SPECIES[C.enemy.species].name)} go?</div>
      <div class="cz-acts">
        <button class="btn cz-btn" id="czAskGo">Let go</button>
        <button class="btn cz-btn cz-keep" id="czAskStay">Keep trying</button>
      </div>
    </div>`;
  document.body.appendChild(ask);
  const key = e=>{ if(e.key === 'Escape'){ e.preventDefault(); close(); } };
  const close = ()=>{ ask.remove(); document.removeEventListener('keydown', key, true); if(held) held.paused = false; };
  ask._close = close;
  document.addEventListener('keydown', key, true);
  ask.addEventListener('click', e=>{ if(e.target === ask) close(); });
  ask.querySelector('#czAskStay').addEventListener('click', close);
  ask.querySelector('#czAskGo').addEventListener('click', ()=>{ close(); catchLetGo(); });
  try { ask.querySelector('#czAskStay').focus({ preventScroll:true }); } catch(e){}
}
function czAskClose(){ const a = document.getElementById('czAsk'); if(a){ if(a._close) a._close(); else a.remove(); } }
async function catchLetGo(){
  const C = ui.catching;
  if(!C || C.leaving) return;
  C.leaving = true;
  czAskClose();
  czEndQuiz();
  document.body.classList.add('cz-throwing');
  if(C.phase === 'gone') await czWait(300);                          // (4.28) fled already: nothing left to fly off
  else await czFlee(0.7);
  if(ui.catching === C) catchGone();
}
/* a catch's spelling still going (its clock running) when the catch is over: it ends here, never to come back over
   whatever page is up by then */
function czEndQuiz(){
  const q = ui.quiz;
  if(q && q.config && q.config.catchUi && !q._ended){ q._ended = true; q.locked = true; q.resolved = true; stopTimer(); }
}
function catchTeardown(){
  czAskClose();
  czEndQuiz();
  if(CZ){ cancelAnimationFrame(CZ.raf); CZ = null; }
  ['czStage', 'czFx'].forEach(id=>{ const el = document.getElementById(id); if(el) el.remove(); });
  document.body.classList.remove('catching', 'cz-throwing');
  ui.catching = null;
}
/* the screen asked to draw again while a throw or the caught page is up */
function catchRender(){
  const C = ui.catching;
  if(C && C.phase === 'caught') return gotcha(C.enemy, { played:true, again:true });
}

/* Caught: it floats on in its sparkles; its name, and Name it or Keep it (the designer: "with a message that X was
   caught, and the option to name the monster or just store it"). As before 4.27 it joins your party if there is room,
   storage if not. (`gotcha`: the name it has had since the start; called on its own, it brings the stage up for it.) */
function gotcha(enemy, opts){
  opts = opts || {};
  if(!opts.played) playSfxSoon('catch_success', 2500);               // (3.49) from memory, waiting if still on its way
  if(!ui.catching || ui.catching.enemy !== enemy){
    catchTeardown();
    ui.catching = { enemy, tier:catchTier(enemy.species), throws:0, carry:0, queue:[], phase:'caught', id:++_czId };
    czStage(enemy);
  }
  const C = ui.catching;
  C.phase = 'caught';
  czEndQuiz();
  ui.screen = 'catch';
  document.body.classList.add('writing');
  if(typeof quizSkyOn === 'function') quizSkyOn();
  if(CZ){ CZ.mon.white = 0; CZ.mon.alpha = 1; CZ.mon.lift = 0; CZ.ball.alpha = 0; CZ.sparkle = true; CZ.ring = null; }
  const sp = SPECIES[enemy.species];
  screenEl.innerHTML = `
    <div class="cz-caught">
      <div class="cz-msg">${escapeHtml(sp.name)} was caught!</div>
      <div class="cz-acts" id="czActs">
        <button class="btn cz-btn" id="czName">Name it</button>
        <button class="btn cz-btn cz-keep" id="czKeep">Keep it</button>
      </div>
      <div class="cz-nick" id="czNick" hidden>
        <input type="text" id="nickInput" placeholder="${escapeHtml(sp.name)}" maxlength="16" autocomplete="off" aria-label="Name">
        <button class="btn cz-btn cz-keep" id="nickSave">Done</button>
      </div>
    </div>`;
  document.body.classList.remove('cz-throwing');
  let busy = false;
  const keep = async nick=>{
    if(busy) return; busy = true;
    const mon = await catchKeep(enemy, nick);
    catchTeardown();
    const where = state.party.some(m=> m.uid === mon.uid) ? 'your party' : 'storage';
    toast(`${displayName(mon)} joined ${where}!`);
    /* some catches carry a scene of their own */
    if(enemy.species === 'ankylosaurus') return ankyloConversation(mon);
    const msg = CATCH_MESSAGES[enemy.species];
    if(msg) return storyModal(monPortrait(enemy.species, 150, { view:'front', bare:true, stage:enemy.stage || 0 }),
      SPECIES[enemy.species].name, msg, ()=> go('region'), { subtitle:'A bond formed' });
    afterCatch();
  };
  $('#czKeep').addEventListener('click', ()=> keep(''));
  $('#czName').addEventListener('click', ()=>{
    $('#czActs').hidden = true; $('#czNick').hidden = false;
    const inp = $('#nickInput'); if(inp) inp.focus();
  });
  $('#nickSave').addEventListener('click', ()=> keep(($('#nickInput').value || '').trim()));
  $('#nickInput').addEventListener('keydown', e=>{ if(e.key === 'Enter') keep((e.currentTarget.value || '').trim()); });
}
/* what joins you (the same as before 4.27): the form it was caught in kept as its floor */
async function catchKeep(enemy, nick){
  const mon = newMonster(enemy.species, enemy.level);
  const caughtStage = enemy.stage || 0;
  if(caughtStage < evolutionStage(enemy.species, enemy.level)){ mon.evoFloor = caughtStage; mon.evoFloorLevel = enemy.level; }
  if(nick){ mon.nickname = nick; mon.namedRegion = state.progress.currentRegion; }
  if(slottedCount() < 6) state.party.push(mon);
  else state.storage.push(mon);
  if(!state.caughtSpecies.includes(enemy.species)) state.caughtSpecies.push(enemy.species);
  if(!state.encounteredSpecies.includes(enemy.species)) state.encounteredSpecies.push(enemy.species);
  await saveProfile();
  return mon;
}
/* the victory page's buttons: the monster's own little picture, and Catch (the designer: "for catching buttons, please
   now also show a small version of the monster's sprite to make it clear which is being caught") — (4.29) "Please also
   add back the names of monsters to the catch button in addition to the sprite! Can the sprite be a little bigger? Maybe
   33% bigger?": Catch and its name, its picture 69px (52 until 4.29) */
function catchButtonHtml(e, i, single){
  const nm = escapeHtml(SPECIES[e.species].name);
  return `<button class="btn btn-primary cz-catch-btn${single ? '' : ' catch-opt'}"${single ? ' id="catchBtn"' : ` data-i="${i}"`} aria-label="Catch the ${nm}">` +
    `<span class="cz-catch-pic">${monPortrait(e.species, 69, { view:'front', bare:true, stage:e.stage || 0 })}</span><span>Catch ${nm}</span></button>`;
}

/* ============================================================
   THE STAGE AND ITS LIGHT
   #czStage under the page (the ball, the monster), #czFx over it (the orbs, the balls of light, the aura, the sparkles).
   One loop draws them while the catch lasts; what happens is tweened (czTween) into CZ's numbers, which it reads.
   ============================================================ */
let CZ = null;
const CZ_SPEED = { k:1 };                                            // a test's: everything that much quicker
const czEase = { io:t=> t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, out:t=> 1 - Math.pow(1 - t, 3), in:t=> t * t * t,
  back:t=>{ const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
const czLerp = (a, b, t)=> a + (b - a) * t;
const czClamp = t=> Math.max(0, Math.min(1, t));
function czReduced(){ return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; }
function czBuzz(p){ return typeof buzz === 'function' ? buzz(p) : false; }   // (4.28) the game's own (02-core.js)

function czTop(H){ return Math.round(Math.max(128, Math.min(236, (H || window.innerHeight) * 0.25))); }
function czStage(enemy){
  czCss();
  document.body.classList.add('catching');
  document.body.style.setProperty('--cz-top', czTop() + 'px');
  let st = document.getElementById('czStage');
  if(!st){ st = document.createElement('div'); st.id = 'czStage'; st.setAttribute('aria-hidden', 'true'); document.body.appendChild(st); }
  const pic = monPortrait(enemy.species, 200, { view:'front', bare:true, stage:enemy.stage || 0 });
  st.innerHTML = `<div class="cz-ball" id="czBall"></div><div class="cz-mon" id="czMon"><div class="cz-sprite">${pic}</div><div class="cz-white">${pic}</div></div>`;
  let fx = document.getElementById('czFx');
  if(!fx){ fx = document.createElement('canvas'); fx.id = 'czFx'; fx.setAttribute('aria-hidden', 'true'); document.body.appendChild(fx); }
  if(CZ) cancelAnimationFrame(CZ.raf);
  CZ = {
    id:++_czId, fx, g:fx.getContext('2d'), W:0, H:0, dpr:1, raf:0, last:0,
    ball:{ el:st.querySelector('#czBall'), cx:0, cy:0, base:0, level:0, shown:0, alpha:0, scale:1, pulse:0, seen:false },
    mon:{ el:st.querySelector('#czMon'), white:0, alpha:1, lift:0, scale:1, shake:0, x:0, y:0, px:0 },
    ring:null, aura:{ r:0, a:0 }, flood:0, parts:[], sparkle:false, sparkAcc:0,
  };
  CZ.mon.white_el = st.querySelector('.cz-white');
  CZ.mon.sprite_el = st.querySelector('.cz-sprite');
  CZ.raf = requestAnimationFrame(czLoop);
}
function czLoop(now){
  if(!CZ) return;
  CZ.raf = requestAnimationFrame(czLoop);
  const dt = Math.min(0.05, CZ.last ? (now - CZ.last) / 1000 : 0);
  CZ.last = now;
  try { czFrame(now, dt); } catch(e){ console.error('catch fx:', e); }
}
function czFrame(now, dt){
  const Z = CZ, W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  if(Z.W !== W || Z.H !== H || Z.dpr !== dpr){ Z.W = W; Z.H = H; Z.dpr = dpr; Z.fx.width = Math.round(W * dpr); Z.fx.height = Math.round(H * dpr); }
  /* the monster's place: the top of the page (--cz-top, as the page leaves room for it), over the ball */
  const top = czTop(H);
  if(Z.top !== top){ Z.top = top; document.body.style.setProperty('--cz-top', top + 'px'); }
  const px = Math.round(Math.min(240, top * 0.84));
  /* the ball: where the square you write in is (while there is one to see) */
  const box = ui.screen === 'quiz' ? document.getElementById('qbox-0') : null;
  if(box){ const r = box.getBoundingClientRect(); if(r.width > 40 && r.height > 40){ Z.ball.cx = r.left + r.width / 2; Z.ball.cy = r.top + r.height / 2; Z.ball.base = r.width; if(!Z.ball.seen){ Z.ball.seen = true; if(Z.ball.alpha === 0 && ui.catching && ui.catching.phase === 'spell') czReform(); } } }
  if(!Z.ball.base){ Z.ball.cx = W / 2; Z.ball.cy = H * 0.68; Z.ball.base = Math.min(W - 40, H * 0.4); }
  const M = Z.mon;
  /* over the ball while you write and throw; caught, over its name in the middle */
  const caught = ui.catching && ui.catching.phase === 'caught', panel = caught ? document.querySelector('.cz-caught') : null;
  let tx = Z.ball.cx || W / 2;
  if(caught){ const r = panel && panel.getBoundingClientRect(); tx = r && r.width ? r.left + r.width / 2 : W / 2; }
  M.x = M.x ? M.x + (tx - M.x) * Math.min(1, dt * 3.2) : tx;
  M.px = px; M.y = 10 + top * 0.52;
  const t = now / 1000, red = czReduced();
  /* its float, its shaking */
  const bob = Math.sin(t * 2.1) * 6, amp = red ? 0 : M.shake;
  const sx = amp ? amp * (Math.sin(t * 171) * 0.6 + (Math.random() - 0.5) * 0.8) : 0, sy = amp ? amp * 0.6 * (Math.sin(t * 143 + 1) * 0.6 + (Math.random() - 0.5) * 0.8) : 0;
  if(M.el){
    M.el.style.width = M.el.style.height = px + 'px';
    M.el.style.transform = `translate(${(M.x - px / 2 + sx).toFixed(1)}px, ${(M.y - px / 2 + bob + sy + M.lift).toFixed(1)}px) scale(${M.scale.toFixed(3)})`;
    M.el.style.opacity = M.alpha.toFixed(3);
    if(M.white_el) M.white_el.style.opacity = M.white.toFixed(3);
    if(M.sprite_el) M.sprite_el.style.filter = M.white > 0.01 ? `brightness(${(1 + M.white * 1.4).toFixed(2)})` : '';
  }
  /* the ball: as big as the square to write in, and a little more with every word in it; breathing; a pulse as one comes in */
  const B = Z.ball;
  B.shown += (B.level - B.shown) * Math.min(1, dt * 6);
  B.pulse = Math.max(0, B.pulse - dt * 2.2);
  if(B.el){
    const d = B.base * 0.98 * (1 + 0.04 * Math.min(6, B.shown)) * (1 + Math.sin(t * 1.7) * 0.012 + B.pulse * 0.06) * B.scale;
    B.el.style.width = B.el.style.height = d.toFixed(1) + 'px';
    B.el.style.transform = `translate(${(B.cx - d / 2).toFixed(1)}px, ${(B.cy - d / 2).toFixed(1)}px)`;
    B.el.style.opacity = B.alpha.toFixed(3);
    B.el.style.filter = B.pulse > 0.01 ? `brightness(${(1 + B.pulse * 0.25).toFixed(3)})` : '';
  }
  /* the light */
  const g = Z.g;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if(Z.aura.a > 0.003) czAura(g, M.x, M.y + bob, Z.aura.r, Z.aura.a);
  if(Z.ring) czRing(g, Z.ring, t, dt);
  if(Z.sparkle){
    Z.sparkAcc += dt * 16;
    while(Z.sparkAcc >= 1){ Z.sparkAcc -= 1;
      Z.parts.push({ k:'spark', x:M.x + (Math.random() - 0.5) * px * 0.9, y:M.y + bob + (Math.random() * 0.7 - 0.15) * px, vx:(Math.random() - 0.5) * 8, vy:-(28 + Math.random() * 46), life:0, max:1 + Math.random() * 0.8, s:1.4 + Math.random() * 2.4 }); }
  }
  czParts(g, dt, t);
  if(Z.flood > 0.003){ g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(255,255,255,${Math.min(1, Z.flood).toFixed(3)})`; g.fillRect(0, 0, W, H); }
}
/* the aura: white light out of the monster, `r` across, `a` strong */
function czAura(g, x, y, r, a){
  g.globalCompositeOperation = 'source-over';
  const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
  gr.addColorStop(0, `rgba(255,255,255,${(0.42 * a).toFixed(3)})`);
  gr.addColorStop(0.32, `rgba(250,252,255,${(0.5 * a).toFixed(3)})`);
  gr.addColorStop(0.62, `rgba(222,234,255,${(0.28 * a).toFixed(3)})`);
  gr.addColorStop(1, 'rgba(200,220,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, Math.max(1, r), 0, Math.PI * 2); g.fill();
}
/* an orb of light: a white heart in a halo of its colour; `d` from concentrated (0) to diffuse (1) */
function czOrb(g, x, y, r, hue, d, a){
  if(r < 0.5 || a < 0.01) return;
  const core = 0.12 + (1 - d) * 0.24;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(255,255,255,${a.toFixed(3)})`);
  gr.addColorStop(core, `hsla(${hue.toFixed(0)},100%,${(90 - d * 8).toFixed(0)}%,${(a * (0.95 - d * 0.25)).toFixed(3)})`);
  gr.addColorStop(core + (1 - core) * 0.42, `hsla(${hue.toFixed(0)},100%,70%,${(a * (0.5 - d * 0.18)).toFixed(3)})`);
  gr.addColorStop(1, `hsla(${hue.toFixed(0)},100%,62%,0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}
/* the ring of twelve, turning, each orb going round the spectrum; a short trail behind each */
function czRing(g, R, t, dt){
  R.rot += dt * Math.PI * 2 * 0.22 * R.spin;
  g.globalCompositeOperation = 'lighter';
  const n = CATCH.orbs;
  for(let i = 0; i < n; i++){
    const hue = (i * 360 / n + t * 90) % 360;
    for(let k = 3; k >= 0; k--){
      const a = R.rot - k * 0.07 * Math.max(0.6, R.spin) + i * Math.PI * 2 / n;
      const rr = R.R * (1 + (R.wob || 0) * Math.sin(t * 9 + i));
      const x = R.cx + Math.cos(a) * rr, y = R.cy + Math.sin(a) * rr;
      czOrb(g, x, y, R.size * (k ? 0.75 - k * 0.12 : 1), hue, R.diff, R.alpha * (k ? 0.32 - k * 0.07 : 1));
    }
  }
  g.globalCompositeOperation = 'source-over';
}
/* the balls of light coming in, the ball's dust, the sparkles */
function czParts(g, dt, t){
  const Z = CZ, B = Z.ball;
  g.globalCompositeOperation = 'lighter';
  for(let i = Z.parts.length - 1; i >= 0; i--){
    const p = Z.parts[i];
    p.life += dt;
    if(p.k === 'en'){
      /* (4.29) faded in all round the ball, spiralling into it, quicker and smaller as it goes */
      if(p.life < 0) continue;                                          // (its moment's wait)
      const u = czClamp(p.life / p.max), e = czEase.in(u) * 0.7 + u * 0.3;
      const r = p.r0 * (1 - e), an = p.a + p.turn * e, x = B.cx + Math.cos(an) * r, y = B.cy + Math.sin(an) * r;
      const vis = czClamp(u / 0.3) * (u > 0.85 ? 1 - (u - 0.85) / 0.15 * 0.6 : 1);
      p.tr.push([x, y]); if(p.tr.length > 8) p.tr.shift();
      p.tr.forEach(([qx, qy], j)=> czOrb(g, qx, qy, p.s * (0.3 + 0.6 * j / p.tr.length) * (1 - 0.45 * u), p.hue + t * 60, 0.5, vis * (0.14 + 0.46 * j / p.tr.length)));
      czOrb(g, x, y, p.s * (1.3 - 0.6 * u), p.hue + t * 60, 0.35, vis);
      if(u >= 1){
        Z.parts.splice(i, 1); B.level += p.share; B.pulse = 1;
        if(p.g && --p.g.left === 0) B.level = Math.round(B.level);    // (its words, whole, once they are all in)
      }
      continue;
    }
    if(p.life >= p.max){ Z.parts.splice(i, 1); continue; }
    const u = p.life / p.max;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if(p.k === 'dust'){ p.vx *= 1 - dt * 1.6; p.vy *= 1 - dt * 1.6; czOrb(g, p.x, p.y, p.s * (1 - u * 0.5), p.hue, 0.6, (1 - u) * 0.9); }
    else if(p.k === 'spark'){
      const a = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8;
      const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 3);
      gr.addColorStop(0, `rgba(255,255,255,${(a * 0.95).toFixed(3)})`); gr.addColorStop(0.35, `rgba(214,236,255,${(a * 0.65).toFixed(3)})`); gr.addColorStop(1, 'rgba(160,210,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.s * 3, 0, Math.PI * 2); g.fill();
    } else if(p.k === 'flash'){ czOrb(g, p.x, p.y, p.s * (0.4 + u * 1.6), 210, 0.8, (1 - u) * 0.9); }
  }
  g.globalCompositeOperation = 'source-over';
}
/* f(t), t from 0 to 1, over `ms` (quicker for a test); done early if the catch is over */
function czTween(ms, f){
  const id = CZ && CZ.id;
  return new Promise(done=>{
    if(!CZ) return done();
    const D = Math.max(1, ms * CZ_SPEED.k), t0 = performance.now();
    const step = now=>{
      if(!CZ || CZ.id !== id) return done();
      const t = Math.min(1, (now - t0) / D);
      f(t);
      if(t < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
}
const czWait = ms=> czTween(ms, ()=>{});

/* ---------- while spelling ---------- */
/* a phrase spelt: its words' light gathered into the ball. (4.29) The designer: "Can we have the orbs fade in from all
   directions into the central circle rather than 2 random orbs coming in? Either have them come straight in or spiral
   in." A ring of orbs (CZ_GATHER a word, the spectrum round it) fades in all round the ball and spirals into it, each
   phrase the other way round; the ball grows by its words as they come in. */
const CZ_GATHER = { perWord:6, most:24, turn:0.62 };                  // orbs a word, at most; how far round they wind (×π)
function czAbsorb(n){
  const Z = CZ;
  if(!Z || !(n > 0)) return;
  const B = Z.ball, K = Math.max(CZ_GATHER.perWord, Math.min(CZ_GATHER.most, CZ_GATHER.perWord * n)), share = n / K;
  const ballR = B.base * 0.49 * (1 + 0.04 * Math.min(6, B.shown)), R0 = ballR * 1.1 + Math.min(Z.W, Z.H) * 0.32;
  const a0 = Math.random() * Math.PI * 2, dir = Z.spin = -(Z.spin || -1), g = { left:K };
  for(let i = 0; i < K; i++){
    Z.launched = (Z.launched || 0) + 1;
    Z.parts.push({ k:'en', a:a0 + i * (Math.PI * 2 / K) + (Math.random() - 0.5) * 0.16, r0:R0 * (0.9 + Math.random() * 0.2),
      turn:dir * (CZ_GATHER.turn + Math.random() * 0.18) * Math.PI, life:-(i % 3) * 0.05 * CZ_SPEED.k, max:(1.0 + Math.random() * 0.16) * CZ_SPEED.k,
      s:12, hue:i / K * 360, tr:[], share, g });
  }
}
/* a word missed: the ball breaks up into dust and is gone */
function czDissipate(){
  const Z = CZ;
  if(!Z) return;
  const B = Z.ball, R = B.base * 0.49 * (1 + 0.04 * Math.min(6, B.shown));
  for(let i = 0; i < 34; i++){
    const a = Math.random() * Math.PI * 2, r = R * (0.25 + Math.random() * 0.8), v = 70 + Math.random() * 170;
    Z.parts.push({ k:'dust', x:B.cx + Math.cos(a) * r, y:B.cy + Math.sin(a) * r, vx:Math.cos(a) * v, vy:Math.sin(a) * v, life:0, max:0.7 + Math.random() * 0.6, s:5 + Math.random() * 9, hue:190 + Math.random() * 60 });
  }
  B.level = 0;
  const a0 = B.alpha;
  czTween(520, t=>{ B.alpha = a0 * (1 - t); B.scale = 1 + 0.2 * czEase.out(t); }).then(()=>{ if(CZ === Z) B.scale = 1; });
}
/* …it stays: a shudder, and a new ball */
function czStruggle(){
  const Z = CZ;
  if(!Z) return;
  czTween(650, t=>{ Z.mon.shake = 5 * (1 - t); }).then(()=>{ if(CZ === Z && ui.catching && ui.catching.phase === 'spell') czReform(); });
}
/* a ball forming where you write */
function czReform(){
  const Z = CZ;
  if(!Z) return Promise.resolve();
  const B = Z.ball;
  B.level = B.shown = (ui.catching && ui.catching.carry) || 0;
  return czTween(700, t=>{ B.alpha = czEase.out(t); B.scale = 0.35 + 0.65 * czEase.back(t); });
}
/* fled (or let go, `soft`): a shudder, and away off the top */
async function czFlee(soft){
  const Z = CZ;
  if(!Z) return;
  const M = Z.mon;
  if(!soft){ await czTween(260, t=>{ M.shake = 4 * (1 - t * 0.5); }); M.shake = 0; playSfx('move_miss'); }
  const k = soft ? 0.75 : 1;
  await czTween(800 * k, t=>{ const e = czEase.in(t); M.lift = -(M.y + M.px * 1.2) * e; M.scale = 1 - 0.3 * e; M.alpha = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35; });
  if(CZ === Z) M.alpha = 0;
}
/* (4.29) The designer: "Can we have the fanfare for a successful catch back please?" Its jingle (catch_success, as the
   caught page always had) plays as the light fills the screen — seconds after the last tap (Catch!). A tablet that has
   let its sound go quiet since then (an iPad does, after a spoken word, a lock, another app) will not start a sound
   without a tap, and from memory it stayed silent. So the tap itself readies it: the sound woken, and the jingle's own
   player (and the miss's) started silently and stopped, which an iPad then lets play without another tap. czJingle
   plays it from memory while the sound is up, else from that player. */
function czPrime(){
  try { if(typeof wakeAudio === 'function') wakeAudio(); } catch(e){}
  const Z = CZ;
  if(!Z || typeof Audio === 'undefined' || typeof SFX_MAP === 'undefined') return;
  Z.primed = Z.primed || {};
  ['catch_success', 'catch_miss'].forEach(ev=>{
    const f = SFX_MAP[ev];
    if(!f || Z.primed[ev]) return;
    try {
      const el = new Audio(SFX_DIR + f);
      el.preload = 'auto'; el.muted = true;
      const p = el.play();
      if(p && p.then) p.then(()=>{ el.pause(); el.currentTime = 0; el.muted = false; }).catch(()=>{});
      Z.primed[ev] = el;
    } catch(e){}
  });
}
function czJingle(ev){
  const Z = CZ, f = typeof SFX_MAP !== 'undefined' ? SFX_MAP[ev] : null;
  const up = typeof actx !== 'undefined' && actx && actx.state === 'running';
  if(f && up && typeof sfxBufferOf === 'function' && sfxBufferOf(f)) return playSfx(ev);
  const el = Z && Z.primed && Z.primed[ev];
  if(el && typeof audio !== 'undefined' && audio.unlocked && !audio.missing[f]){
    try {
      el.muted = false; el.volume = Math.max(0, Math.min(1, typeof sfxVolume === 'function' ? sfxVolume() : 0.55)); el.currentTime = 0;
      const p = el.play();
      if(p && p.catch) p.catch(()=> playSfxSoon(ev, 2500));
      return el;
    } catch(e){}
  }
  return playSfxSoon(ev, 2500);
}
/* the next word waits while it flees */
function czHoldNext(on){
  const set = ()=>{ const b = document.getElementById('quizNext'); if(b){ b.classList.toggle('cz-hold', on); b.disabled = on; } };
  set(); if(on) setTimeout(set, 0);
}

/* ---------- the throw ---------- */
async function czThrow(kind){
  const Z = CZ;
  if(!Z) return;
  const B = Z.ball, M = Z.mon;
  const ballR = B.base * 0.49 * (1 + 0.04 * Math.min(6, B.shown));
  const R1 = Math.min(Z.W * 0.5, Z.H * 0.62), R2 = M.px * 0.62;      // out to the screen's edges
  /* the spelling fades, leaving the ball */
  document.body.classList.add('cz-throwing');
  await czWait(380);
  playSfx('power_up');
  /* the ball opens into twelve orbs */
  const ring = Z.ring = { cx:B.cx, cy:B.cy, R:ballR * 0.15, rot:-Math.PI / 2, spin:0.8, size:10, diff:0.25, alpha:0, wob:0 };
  Z.parts.push({ k:'flash', x:B.cx, y:B.cy, vx:0, vy:0, life:0, max:0.6, s:ballR });
  await czTween(650, t=>{ const e = czEase.out(t); B.scale = 1 - 0.6 * e; B.alpha = 1 - czClamp(t * 1.4); ring.R = ballR * (0.15 + 0.7 * e); ring.alpha = czClamp(t * 2.2); ring.size = 10 + 12 * e; });
  B.level = B.shown = 0;
  /* widening, rising: up to the monster, out to the edges of the screen, big and soft */
  const c0 = { x:ring.cx, y:ring.cy, R:ring.R };
  await czTween(1300, t=>{ const e = czEase.io(t), o = czEase.out(t);
    ring.cx = czLerp(c0.x, M.x, e); ring.cy = czLerp(c0.y, M.y, e); ring.R = czLerp(c0.R, R1, o);
    ring.size = czLerp(22, 58, o); ring.diff = czLerp(0.25, 0.9, o); ring.alpha = czLerp(1, 0.78, t); ring.spin = czLerp(0.8, 1.1, t); });
  /* closing in, small, bright and concentrated; the monster turns white and glows, and shakes (4.28: unfelt — the
     buzz is kept for a near thing and a catch) */
  await czTween(1500, t=>{ const e = czEase.io(t);
    ring.cx = M.x; ring.cy = M.y; ring.R = czLerp(R1, R2, e); ring.size = czLerp(58, 17, e); ring.diff = czLerp(0.9, 0.08, e); ring.alpha = czLerp(0.78, 1, e); ring.spin = czLerp(1.1, 2.6, e);
    const w = czClamp((t - 0.38) / 0.62);
    M.white = czEase.io(w); Z.aura.a = 0.75 * w; Z.aura.r = M.px * (0.8 + 0.7 * w); M.shake = 4.5 * czClamp((t - 0.55) / 0.45); });
  if(kind === 'win') return czWin();
  if(kind === 'miss') return czMiss();
  /* a near thing: it all builds… and falls back */
  await czBuild();
  await czFallBack();
  if(kind === 'nearWin') return czWin(true);
  await czTween(420, t=>{ Z.aura.a = czLerp(0.6, 0.3, t); ring.wob = 0.06 * (1 - t); });
  return czMiss(true);
}
/* the fakeout: the light swells round it, the orbs drawn tight */
function czBuild(){
  const Z = CZ, M = Z.mon, ring = Z.ring, R2 = M.px * 0.62, big = Math.hypot(Z.W, Z.H) * 0.42;
  czBuzz('catchNear');
  return czTween(950, t=>{ const e = czEase.out(t);
    Z.aura.a = czLerp(0.75, 1, e); Z.aura.r = czLerp(M.px * 1.5, big, e); ring.R = czLerp(R2, R2 * 0.72, e); ring.size = czLerp(17, 15, e); ring.spin = czLerp(2.6, 3.4, e); M.shake = czLerp(4.5, 6.5, e); });
}
function czFallBack(){
  const Z = CZ, M = Z.mon, ring = Z.ring, R2 = M.px * 0.62, big = Math.hypot(Z.W, Z.H) * 0.42;
  return czTween(720, t=>{ const e = czEase.io(t);
    Z.aura.a = czLerp(1, 0.6, e); Z.aura.r = czLerp(big, M.px * 1.6, e); ring.R = czLerp(R2 * 0.72, R2 * 1.28, e); ring.size = czLerp(15, 21, e); ring.spin = czLerp(3.4, 2.2, e); ring.wob = 0.06 * e; M.shake = czLerp(6.5, 3, e); });
}
/* caught: no shaking now; the orbs wind into it, the light fills the screen; then it is itself again, sparkling */
async function czWin(after){
  const Z = CZ;
  if(!Z) return;
  const M = Z.mon, ring = Z.ring, R0 = ring.R, s0 = ring.size, diag = Math.hypot(Z.W, Z.H), a0 = Z.aura.a, r0 = Z.aura.r;
  M.shake = 0; ring.wob = 0;
  await czTween(after ? 1000 : 900, t=>{ const e = czEase.in(t);
    ring.R = R0 * (1 - e); ring.size = czLerp(s0, 8, t); ring.spin = czLerp(ring.spin, 5, t * 0.2); ring.alpha = 1 - czClamp((t - 0.72) / 0.28);
    Z.aura.a = czLerp(a0, 1, t); Z.aura.r = czLerp(r0, M.px * 2.2, t); M.white = 1; });
  Z.ring = null;
  czJingle('catch_success');
  czBuzz('caught');
  await czTween(850, t=>{ const e = czEase.io(t); Z.aura.r = czLerp(M.px * 2.2, diag * 1.15, e); Z.aura.a = 1; Z.flood = czEase.in(t) * 0.92; });
  Z.flood = 1;
  await czWait(380);
  Z.sparkle = true;
  M.white = 0;
  if(ui.catching) ui.catching.phase = 'caught';
  await czTween(1100, t=>{ const e = czEase.out(t); Z.flood = 1 - e; Z.aura.a = 1 - e; Z.aura.r = czLerp(diag * 1.15, M.px * 1.2, e); });
  Z.flood = 0; Z.aura.a = 0;
}
/* thrown off: it shudders, flares, and throws the orbs back off the screen; then itself again (felt, `near`: a near miss) */
async function czMiss(near){
  const Z = CZ;
  if(!Z) return;
  const M = Z.mon, ring = Z.ring, R0 = ring.R, far = Math.hypot(Z.W, Z.H) * 1.1, s0 = ring.size, a0 = Z.aura.a;
  await czTween(320, t=>{ M.shake = czLerp(M.shake, 7, t); ring.wob = 0.05 * t; });
  czJingle('catch_miss');
  if(near) czBuzz('catchOff');
  await czTween(850, t=>{ const e = czEase.out(t);
    ring.R = czLerp(R0, far, e); ring.size = czLerp(s0, 40, e); ring.diff = czLerp(0.1, 0.8, e); ring.alpha = 1 - czClamp((t - 0.45) / 0.55); ring.spin = czLerp(2.6, 0.6, e); ring.wob = 0.05 * (1 - t);
    Z.aura.a = t < 0.18 ? czLerp(a0, 1, t / 0.18) : 1 - czEase.out((t - 0.18) / 0.82); Z.aura.r = czLerp(M.px * 1.5, M.px * 3.2, e); M.shake = 8 * (1 - t * 0.6); });
  Z.ring = null;
  await czTween(700, t=>{ M.white = 1 - czEase.io(t); M.shake = 3.2 * (1 - t); Z.aura.a = 0; });
  M.white = 0; M.shake = 0;
}

/* ---------- its looks ---------- */
function czCss(){
  if(document.getElementById('czCss')) return;
  const st = document.createElement('style');
  st.id = 'czCss';
  st.textContent = `
  #czStage{ position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
  #czFx{ position:fixed; inset:0; width:100%; height:100%; z-index:2; pointer-events:none; display:block; }
  .cz-mon{ position:absolute; left:0; top:0; width:160px; height:160px; will-change:transform, opacity; }
  .cz-mon .cz-sprite, .cz-mon .cz-white{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
  .cz-mon img{ width:100% !important; height:100% !important; filter:drop-shadow(0 6px 14px rgba(0,0,0,.5)); }
  .cz-mon .cz-white{ opacity:0; }
  .cz-mon .cz-white img{ filter:brightness(0) invert(1) drop-shadow(0 0 8px #fff) drop-shadow(0 0 22px rgba(205,228,255,.95)); }
  /* the ball: solid white light, a little blue at its rim, glowing */
  .cz-ball{ position:absolute; left:0; top:0; width:10px; height:10px; border-radius:50%; opacity:0; will-change:transform, opacity, width;
    background:radial-gradient(circle at 46% 42%, #ffffff 0%, #ffffff 58%, #f6f8ff 72%, #e9eeff 86%, #dbe5ff 100%);
    box-shadow:0 0 24px 6px rgba(240,246,255,.8), 0 0 70px 22px rgba(175,205,255,.38), 0 0 150px 50px rgba(140,170,255,.16), inset -14px -18px 42px rgba(150,170,235,.28); }
  body.catching{ --cz-top:200px; }
  body.writing.catching .screen{ padding-top:calc(var(--cz-top) + 10px); }
  body.writing.catching #app{ max-width:1160px; }
  .cz-x{ position:absolute; left:max(10px, env(safe-area-inset-left)); top:max(8px, env(safe-area-inset-top)); z-index:3; width:40px; height:40px; border:0; border-radius:50%;
    background:rgba(5,7,20,.18); color:rgba(230,226,246,.55); font-size:17px; line-height:40px; text-align:center; cursor:pointer; padding:0; }
  .cz-x:active{ background:rgba(255,255,255,.12); }
  /* (4.28) ✕ asks first */
  .cz-ask{ position:fixed; inset:0; z-index:90; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(3,4,14,.55); animation:czFade .2s ease-out both; }
  @keyframes czFade{ from{ opacity:0; } to{ opacity:1; } }
  .cz-ask-box{ width:min(100%, 380px); display:flex; flex-direction:column; align-items:center; gap:18px; padding:22px 18px 18px; border-radius:20px;
    background:rgba(10,12,34,.74); border:1px solid rgba(220,232,255,.22); box-shadow:0 0 30px rgba(160,190,255,.16), 0 18px 50px rgba(0,0,0,.5);
    -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); }
  .cz-ask .cz-msg{ font-size:22px; }
  .cz-ask .cz-acts{ width:100%; }
  .cz-tools{ display:flex; align-items:center; gap:10px; }
  body.writing .cz-tools .cz-ic{ flex:0 0 auto; width:50px; height:44px; padding:0; margin:0; border-radius:14px; font-size:20px; background:rgba(5,7,20,.2); }
  .cz-tools .qz-def{ flex:1 1 auto; margin:0; min-height:0; }
  body.writing.catching .qz-next{ background:rgba(5,7,20,.22); }
  body.writing.catching .qz-status{ display:none; }
  body.writing.catching .qz-res > div[style]{ display:none !important; }   /* no mastery line here: as little to read as there can be */
  body.writing.catching .char-pip{ background:rgba(5,7,20,.2); }
  /* the square to write in: no square now, only the faint cross, over the ball; dark strokes on its white */
  body.writing.catching .write-box{ background-color:transparent; border:0; box-shadow:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg stroke='rgba(46,36,110,.2)' stroke-width='0.35' stroke-dasharray='1.6 2.2' fill='none'%3E%3Cline x1='50' y1='4' x2='50' y2='96'/%3E%3Cline x1='4' y1='50' x2='96' y2='50'/%3E%3C/g%3E%3C/svg%3E"); }
  body.writing.catching .write-box.char-done, body.writing.catching .write-box.char-bad{ box-shadow:none; }
  body.catching .qz-defs .qz-bl-base{ stop-color:#9c6a06; }
  body.catching .qz-defs .qz-bl-hot{ stop-color:#f2b72a; }
  body.writing.catching .write-box.char-done svg{ filter:drop-shadow(0 0 3px rgba(240,180,60,.45)); }
  body.writing.catching .write-box.char-bad svg path{ stroke:#a59d86 !important; }
  body.writing.catching .write-loading{ color:rgba(40,30,90,.45); }
  /* Catch!: white light, where Ready! would be gold */
  body.writing.catching .qz-next.qz-ready{ border-color:#eef4ff; color:#fff; background:rgba(8,10,28,.35);
    text-shadow:0 0 10px rgba(220,235,255,.95), 0 0 22px rgba(160,200,255,.6); animation:qzReadyIn .18s ease-out backwards, czGoGlow 1.6s ease-in-out infinite alternate; }
  @keyframes czGoGlow{ from{ box-shadow:inset 0 0 14px rgba(200,225,255,.22), 0 0 10px rgba(225,238,255,.5), 0 0 26px rgba(150,190,255,.2); }
    to{ box-shadow:inset 0 0 24px rgba(200,225,255,.45), 0 0 18px rgba(238,246,255,.9), 0 0 46px rgba(150,190,255,.38); } }
  body.writing.catching .qz-ready .qz-bloom::before{ background:radial-gradient(ellipse closest-side, rgba(245,250,255,.9) 0%, rgba(200,225,255,.42) 42%, rgba(170,200,255,0) 100%); }
  body.writing.catching .qz-ready .qz-lift{ background:#fff; box-shadow:0 0 6px #e6f0ff, 0 0 12px rgba(150,190,255,.85); }
  .qz-next.cz-hold{ opacity:0; pointer-events:none; }
  .qz-next{ transition:opacity .3s; }
  /* the throw: the spelling fades, and comes back after a miss */
  body.catching .screen > *{ transition:opacity .35s ease; }
  body.catching.cz-throwing .screen > *{ opacity:0; pointer-events:none; }
  /* caught */
  .cz-caught{ display:flex; flex-direction:column; align-items:center; gap:16px; margin-top:clamp(30px, 10vh, 110px); animation:czIn .6s ease-out both; }
  @keyframes czIn{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:none; } }
  .cz-msg{ font-family:'Baloo 2', system-ui, sans-serif; font-weight:800; font-size:26px; line-height:1.15; color:#fff; text-align:center;
    text-shadow:0 0 16px rgba(200,225,255,.85), 0 2px 8px rgba(0,0,0,.6); }
  .cz-acts, .cz-nick{ display:flex; gap:10px; width:min(100%, 380px); }
  .cz-acts[hidden], .cz-nick[hidden]{ display:none; }
  body.writing .cz-btn{ flex:1 1 0; width:auto; height:52px; margin:0; border-radius:14px; background:rgba(8,10,28,.4); border:1.5px solid rgba(230,240,255,.55);
    color:#fff; font-weight:800; font-size:17px; text-shadow:0 0 10px rgba(200,225,255,.8); box-shadow:0 0 14px rgba(200,225,255,.18); }
  body.writing .cz-btn.cz-keep{ border-color:#eef4ff; box-shadow:0 0 16px rgba(225,238,255,.4), inset 0 0 14px rgba(200,225,255,.18); }
  body.writing .cz-btn:active{ background:rgba(230,240,255,.14); }
  .cz-nick input{ flex:1 1 auto; min-width:0; height:52px; border-radius:14px; border:1.5px solid rgba(230,240,255,.55); background:rgba(8,10,28,.5); color:#fff;
    text-align:center; font-size:18px; font-weight:700; }
  .cz-nick input::placeholder{ color:rgba(220,228,255,.45); }
  .cz-nick .cz-btn{ flex:0 0 96px; }
  /* the victory page's Catch, with the monster's picture */
  .cz-catch-btn{ display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:8px; }
  .cz-catch-pic{ flex:0 0 auto; width:69px; height:69px; margin:-17px 0; display:inline-flex; align-items:center; justify-content:center; }
  .cz-catch-pic img{ filter:drop-shadow(0 1px 3px rgba(0,0,0,.35)); }
  @media (prefers-reduced-motion: reduce){ body.writing.catching .qz-next.qz-ready{ animation:none !important; } }
  `;
  document.head.appendChild(st);
}
