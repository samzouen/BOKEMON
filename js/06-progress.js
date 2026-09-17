/* ==========================================================
   06-progress.js
   XP, levelling, evolution, catching.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ---------- XP / LEVELING / EVOLUTION ---------- */
/* The cap belongs to the ZONE you're standing in, not the region — Rocky
   Caverns lets you push past the rest of Emerald March. Away from any zone,
   the region's best available cap applies. */
const REGION_CAPS = { 1:21, 2:41, 3:61, 4:85 };
function levelCap(){
  /* The Band Competition is a Challenge rather than a zone, so it carries its
     own ceiling; beating the band lifts the whole region. */
  const r3 = (state.progress && state.progress.region3) || {};
  /* Region 3 has ONE rule: the Power Stone opens it to 71, everywhere.
     The old 66-in-the-concert override kept snapping it back down. */
  if((state.progress||{}).currentRegion === 3 && r3.powerStone) return 71;
  const z = ui.currentZone && ui.currentZone.id;
  if(z && ZONE_LEVELS[z]) return ZONE_LEVELS[z].max;
  const rid = (state.progress && state.progress.currentRegion) || 1;
  const zones = (REGION_ZONES[rid]||[]).map(x=>(ZONE_LEVELS[x.id]||{}).max||0);
  return Math.max(REGION_CAPS[rid]||21, ...zones, 0) || 21;
}
/* ---------- XP PACING MODES ----------
   Selectable (password-gated) from the Spelling List screen. `tier` counts
   5-level bands: 0 = Lv1-5, 1 = Lv6-10, 2 = Lv11-15, ...  */
const XP_MODES = {
  default: { label:'Default', desc:'2, 3, 4, 5, 6 …  (+1 every 5 levels)',
             fn: tier => 2 + tier },
  rapid:   { label:'Rapid',   desc:'1, 2, 2, 3, 3, 4, 4 …  (+1 every 10 levels)',
             fn: tier => 1 + Math.ceil(tier/2) },
  grind:   { label:'Grind',   desc:'4, 5, 6, 7, 8 …  (slower, more practice)',
             fn: tier => 4 + tier },
  dev:     { label:'Dev',     desc:'Always 1 fight per level (testing only)',
             fn: () => 1 },
};
function xpMode(){
  const m = state && state.settings && state.settings.xpMode;
  return XP_MODES[m] ? m : 'default';
}
function fightsNeeded(level){
  const tier = Math.floor((level-1)/5);
  return Math.max(1, XP_MODES[xpMode()].fn(tier));
}
function newMoveAtLevel(species, level){
  const mv = MOVES[species].find(m=>m[5]===level && m[1]!=null);
  return mv ? mv[1] : null;
}
function awardXpToParty(fightsWorth){
  const credit = Math.max(1, fightsWorth||1);
  const events = [];
  state.party.forEach(m=>{
    const sp = SPECIES[m.species];
    if(sp.frozenRegion1 && state.progress.currentRegion===1) return; // phoenix frozen
    // Past this zone's cap: freeze progress rather than discarding it, so a
    // monster raised elsewhere doesn't lose a part-finished level on arrival.
    if(m.level >= levelCap()) return;
    // a dragon carrying the Dragon Stone learns half again as fast
    const stoneBoost = stoneXpBonus(m);      // whichever elemental stone it carries
    m.xpFights = (m.xpFights||0) + credit * stoneBoost;
    const from = m.level;
    const evos = [], newMoves = [];
    while(m.level < levelCap() && m.xpFights >= fightsNeeded(m.level)){
      m.xpFights -= fightsNeeded(m.level);
      const beforeStage = monStageOf(m);
      // Grow current HP by the change in MAX HP (which is scaled), not by the
      // raw ATK delta — using the unscaled figure left every monster a little
      // short of full after each level, and the gap compounded.
      const beforeMax = computeMaxHp(m.species, m.level, m.supplements, m);
      m.level++;
      const afterMax = computeMaxHp(m.species, m.level, m.supplements, m);
      m.currentHp = Math.min(afterMax, m.currentHp + (afterMax - beforeMax));
      const afterStage = monStageOf(m);
      if(afterStage > beforeStage) evos.push(m.level);
      // once it has caught up, drop the floor entirely
      if(m.evoFloor != null && afterStage >= evolutionStage(m.species, m.level)){
        delete m.evoFloor; delete m.evoFloorLevel;
      }
      const nm = newMoveAtLevel(m.species, m.level);
      if(nm) newMoves.push(nm);
    }
    // reaching the cap mid-battle also freezes rather than clears
    // The Dragon Egg hatches on reaching its level, keeping everything it earned.
    if((isEgg(m) || SPECIES[m.species].isBaby) && m.level >= (SPECIES[m.species].hatchesAt||31)){
      const into = SPECIES[m.species].hatchesInto;
      const hatchedName = displayName(m);
      const wasSpecies = m.species;      // read it BEFORE the reassignment below
      m.species = into;
      m.currentHp = computeMaxHp(into, m.level, m.supplements||0, m);
      if(!state.caughtSpecies.includes(into)) state.caughtSpecies.push(into);
      if(!state.encounteredSpecies.includes(into)) state.encounteredSpecies.push(into);
      events.push({ uid:m.uid, species:into, fromSpecies:wasSpecies, name:hatchedName, from, to:m.level, evos:[m.level], newMoves:[], hatched:true });
      return;
    }
    if(m.level !== from) events.push({ uid:m.uid, species:m.species, name:displayName(m), from, to:m.level, evos, newMoves });
  });
  return events;
}

function catchPhraseCount(species){
  const t = SPECIES[species].tier;
  if(t==='legendary') return 10;
  if(t==='elite') return 9;                    // between starter and legendary
  if(t==='starter' || t==='special') return 7;
  return 5;
}

/* Move token drop chance, WILD encounters only (never NPC/boss fights).
   Base = the highest-level party monster's level, read directly as a percentage
   (a Lv25 Phoenix in the party = 25%, even if it isn't the active fighter).
   Encounter bonuses stack on top of that base. */
const TOKEN_ENCOUNTER_BONUS = { double:0.05, triple:0.10, starter:0.15, elite:0.18, legendary:0.21 };

/* Every notable monster on the field contributes, not just the best one. The
   richest tier pays in full; each additional notable monster pays two-thirds of
   its own tier's bonus. A triple wave of elite Toads is therefore
   10% (triple) + 18% (elite) + 2 x 12% = 52% on top of the level-based base. */
function tokenDropChance(){
  if(!state.party.length) return 0;
  const topLevel = Math.max(...state.party.map(m=>m.level));
  let chance = topLevel / 100;               // level 25 -> 25%
  const b = ui.battle;
  if(b && Array.isArray(b.enemies)){
    const n = b.enemies.length;
    if(n >= 3) chance += TOKEN_ENCOUNTER_BONUS.triple;
    else if(n === 2) chance += TOKEN_ENCOUNTER_BONUS.double;

    const valueOf = (e)=>{
      const t = SPECIES[e.species].tier;
      if(t==='legendary') return TOKEN_ENCOUNTER_BONUS.legendary;
      if(t==='elite')     return TOKEN_ENCOUNTER_BONUS.elite;
      if(t==='starter' || t==='special') return TOKEN_ENCOUNTER_BONUS.starter;
      return 0;
    };
    const values = b.enemies.map(valueOf).filter(v=>v>0).sort((a,c)=>c-a);
    values.forEach((v,i)=>{ chance += (i===0) ? v : v*(2/3); });
  }
  return Math.max(0, chance);                // may exceed 100% — see rollTokenDrop
}

/* A chance above 100% guarantees one token and rolls the surplus for a second. */
function rollTokenCount(){
  const c = tokenDropChance();
  let n = Math.floor(c);
  if(Math.random() < (c - n)) n++;
  return Math.min(2, n);
}

function rollTokenDrop(){
  const b = ui.battle;
  if(!b || b.isNpc) return 0;               // wild-style fights only (plant and engineer count)
  const n = rollTokenCount();
  if(n > 0) state.inventory.tokens = (state.inventory.tokens||0) + n;
  return n;
}


function onBattleWon(){
  const b = ui.battle;
  if(b.guardianTrial) return onGuardianTrialResolved();
  if(b.scriptedLoss==='padrino'){ restoreRealParty(); return onPadrinoResolved(); }
  if(b.scriptedLoss==='monkey'){ return onMonkeyResolved(); }   // winning her is still the scripted beat
  if(inSacredGroveTrial()){
    state.progress.region2.courage = (state.progress.region2.courage||0) + 1;
    saveProfile();
  }
  // a wild win inside the Caverns moves you one step along that path
  if(ui.cavernAdvanceOnWin && !b.isNpc){
    const pid = ui.cavernAdvanceOnWin;
    ui.cavernAdvanceOnWin = null;
    advancePath(pid);
  }
  const enemyNames = b.enemies.filter(e=>!e.fled).map(e=>SPECIES[e.species].name).join(' & ');
  const levelUps = awardXpToParty();
  const tokens = rollTokenDrop();
  saveProfile();
  const evolvers = levelUps.filter(e=>e.evos.length>0);
  // Non-NPC fights can still carry a callback — the Engineer's commission is a
  // catchable wild fight that pays out.
  /* A callback may show a scene first and then call resumeVictory() to fall
     through to the ordinary victory page — which is where catching happens. */
  ui.pendingVictory = ()=> showVictory(enemyNames, levelUps, tokens);
  const finish = ()=> b.onWin ? b.onWin(levelUps) : showVictory(enemyNames, levelUps, tokens);
  if(evolvers.length){
    /* One animation per EVOLUTION, not per monster. A Magnet that crosses both
       11 and 25 in one payout used to play a single flicker from stage 0 to
       stage 2 — the middle form never appeared at all. Each crossing now gets
       its own scene with the correct consecutive pair. */
    const scenes = [];
    evolvers.forEach(e=>{
      if(e.hatched || e.crowned){ scenes.push(e); return; }   // those are one-offs
      e.evos.forEach((lvl, k)=>{
        const last = k === e.evos.length - 1;
        scenes.push(Object.assign({}, e, {
          from: lvl - 1, to: lvl, evos:[lvl],
          stageFrom: evolutionStage(e.species, lvl - 1),
          stageTo:   evolutionStage(e.species, lvl),
          newMoves: last ? e.newMoves : [],     // the learning line belongs to the last
        }));
      });
    });
    playEvolutions(scenes, finish);
  } else {
    finish();
  }
}

/* ---------- EVOLUTION SEQUENCE (9 seconds) ----------
   The silhouette flickers between the current form and a colour-inverted
   version of the evolved form, accelerating as it goes, while glowing
   particles swirl upward. It resolves onto the evolved sprite in full colour
   with the declaration. */
const EVO_TOTAL_MS   = 14000;
const EVO_REVEAL_MS  = 2800;                       // final hold on the evolved form
const EVO_FLASH_MS   = EVO_TOTAL_MS - EVO_REVEAL_MS;

/* Flip intervals shrink geometrically: slow, hesitant flickers at first,
   frantic by the end. */
function evoFlashSchedule(totalMs){
  const out = [];
  let t = 0, gap = 620;
  while(t < totalMs){
    out.push(gap);
    t += gap;
    gap = Math.max(70, gap * 0.87);
  }
  return out;
}

function playEvolutions(list, done){
  let i = 0;
  const next = ()=>{
    if(i >= list.length){ done(); return; }
    const ev = list[i++];
    playSfx('evolution');
    const sp = SPECIES[ev.species];
    /* Explicit stages when the caller worked them out; otherwise derive them.
       The pair must always be CONSECUTIVE — the form you were, and the form you
       are about to become. */
    const fromStage = (ev.stageFrom != null) ? ev.stageFrom : evolutionStage(ev.species, ev.from);
    const toStage   = (ev.stageTo   != null) ? ev.stageTo   : evolutionStage(ev.species, ev.to);

    const ov = document.createElement('div');
    ov.className = 'evo-overlay';
    ov.innerHTML = `
      <div class="evo-particles" id="evoParticles"></div>
      <div class="evo-stage">
        <div id="evoSprite" class="evo-sprite-wrap cutout">${monPortrait(ev.fromSpecies||ev.species,190,{view:'front',stage:ev.fromSpecies?0:fromStage,bare:true})}</div>
      </div>
      <div id="evoText" class="evo-text">What's happening…?</div>
      <div id="evoActions"></div>
    `;
    document.body.appendChild(ov);

    // swirling upward glow
    const pc = ov.querySelector('#evoParticles');
    for(let k=0;k<26;k++){
      const d = document.createElement('span');
      d.className = 'evo-particle';
      d.style.left = (5 + Math.random()*90) + '%';
      d.style.animationDelay = (Math.random()*2.2) + 's';
      d.style.animationDuration = (2.4 + Math.random()*2.2) + 's';
      d.style.width = d.style.height = (4 + Math.random()*7) + 'px';
      pc.appendChild(d);
    }

    const spriteBox = ov.querySelector('#evoSprite');
    const schedule = evoFlashSchedule(EVO_FLASH_MS);
    let step = 0, showEvolved = false;
    let timer = null;

    /* Both forms are rendered ONCE into fixed-size layers and simply toggled.
       Re-writing innerHTML each flip made the box resize (so the caption jumped),
       reloaded the images (so old and new overlapped), and left the final frame
       showing whichever species happened to be painted last. */
    const passengerScale = ev.fromSpecies==='sacred_seed' ? 0.20
                         : ev.fromSpecies==='dragon_egg'  ? 0.40
                         : ev.fromSpecies==='newt_baby'   ? 0.35 : 1;
    spriteBox.innerHTML =
      `<span class="evo-layer" id="evoFrom">${
        monPortrait(ev.fromSpecies || ev.species, Math.round(190*passengerScale),
                    { view:'front', stage: ev.fromSpecies ? 0 : fromStage, bare:true })
      }</span>` +
      `<span class="evo-layer" id="evoTo">${
        monPortrait(ev.species, 190, { view:'front', stage:toStage, bare:true, crowned:!!ev.crowned })
      }</span>`;
    const layerFrom = spriteBox.querySelector('#evoFrom');
    const layerTo   = spriteBox.querySelector('#evoTo');

    const paint = (showTarget)=>{
      layerFrom.style.opacity = showTarget ? '0' : '1';
      layerTo.style.opacity   = showTarget ? '1' : '0';
      // The invert lives on the TARGET LAYER ONLY, never the shared box — a
      // filter toggled on a parent while children fade via opacity composites
      // unreliably on some mobile browsers and could bleed onto the old form.
      layerFrom.classList.remove('evo-inverted');
      layerTo.classList.toggle('evo-inverted', !!showTarget);
    };
    paint(false);

    const tick = ()=>{
      if(step >= schedule.length){ return finish(); }
      showEvolved = !showEvolved;
      paint(showEvolved);
      timer = setTimeout(tick, schedule[step++]);
    };

    const finish = ()=>{
      clearTimeout(timer);
      /* The transformation loop has to stop before the fanfare, or the two
         overlap and neither reads. Same fanfare as winning an Ultra stone. */
      fadeOutSfx('evolution', 320);
      setTimeout(()=> playSfx('stone_ultra'), 260);
      // settle on the NEW form, full colour, with the old one gone for good
      layerFrom.style.display = 'none';
      layerTo.style.opacity = '1';
      layerTo.classList.remove('evo-inverted');
      spriteBox.classList.add('evo-pop');
      ov.querySelector('#evoText').innerHTML =
        `<b>${escapeHtml(ev.name)}</b> ${ev.crowned?'is crowned!':(ev.hatched?'hatched!':'evolved!')}` +
        (ev.newMoves.length ? `<div class="evo-learn">Learned ${escapeHtml(ev.newMoves.join(', '))}!</div>` : '');
      ov.querySelector('#evoActions').innerHTML =
        `<button class="btn btn-primary" id="evoNext" style="width:auto;padding:12px 30px;">Continue</button>`;
      ov.querySelector('#evoNext').addEventListener('click', ()=>{
        if(ov.parentNode) document.body.removeChild(ov);
        next();
      });
    };

    timer = setTimeout(tick, 500);
  };
  next();
}


/* Straight back into the next encounter — no detour through the zone page.
   Inside the Caverns that means the next step of whichever path you were on. */
function exploreFurther(){
  if(!battleParty().some(m=>m.currentHp>0)){
    toast('Your team needs healing first.');
    return go((ui.currentZone||{}).id==='rocky_caverns' && !cavernsComplete() ? 'caverns' : 'zone');
  }
  if(ui.cavernPath && !cavernsComplete()) return exploreCavernPath(ui.cavernPath);
  if((ui.currentZone||{}).id==='diving')           return startDive();   // straight back in
  if((ui.currentZone||{}).id==='weather_deck')     return go('weather_deck');
  if((ui.currentZone||{}).id==='plant_generator')  return go('generator');
  if((ui.currentZone||{}).id==='geothermal_plant') return go('plant');
  return startWildEncounter({ silentIntro:true });
}

/* Continue to the standard victory screen after a story beat. */
function resumeVictory(){
  const f = ui.pendingVictory;
  ui.pendingVictory = null;
  if(f) f(); else go('region');
}

function showVictory(enemyNames, levelUps, tokens){
  playSfx('victory'); fadeOutMusic(2000);
  const breakNow = tallyBattleForEyeBreak();
  const b = ui.battle;
  $('#brandSub').textContent = 'Victory';
  // determine catchable target(s): wild only, species not already caught
  /* `e.fled` also sits at 0 HP, but it left with the loot rather than being
     beaten — only what you actually took down can be caught. */
  const catchable = b.enemies.filter(e=>e.hp<=0 && !e.fled && SPECIES[e.species].tier!=='npc' && !state.caughtSpecies.includes(e.species));
  screenEl.innerHTML = `
    <div style="text-align:center;padding:14px 0;">
      <div style="font-size:42px;">🎉</div>
      <div class="screen-title" style="text-align:center;">Victory!</div>
      <div class="screen-sub" style="text-align:center;">You defeated the wild ${enemyNames}.</div>
    </div>
    <div class="hp-card" style="margin-bottom:14px;">
      <div style="font-weight:800;font-size:13px;color:var(--ink-soft);margin-bottom:6px;">Your team earned a fight!</div>
      ${(levelUps.length ? (playSfx('level_up'),'') : '')}${levelUps.length ? levelUps.map(e=>`<div style="font-weight:700;font-size:14px;">⬆️ ${escapeHtml(e.name)} grew to Lv ${e.to}!</div>`).join('') : `<div style="font-size:13px;color:var(--ink-soft);font-weight:600;">Everyone gained progress toward their next level.</div>`}
      ${tokens ? `<div style="font-weight:800;font-size:14px;color:var(--gold);margin-top:6px;">🎫 Found a Skill Token! (${state.inventory.tokens} total)</div>` : ''}
    </div>
    <div id="catchArea"></div>
    <button class="btn btn-ghost" id="regionBtn" style="margin-top:10px;">Back to region</button>
    <button class="btn btn-ghost" id="againBtn" style="margin-top:8px;">🌿 Explore further</button>
  `;
  const area = $('#catchArea');
  if(catchable.length){
    if(catchable.length===1){
      area.innerHTML = `<button class="btn btn-primary" id="catchBtn">🎯 Try to catch the ${SPECIES[catchable[0].species].name}!</button>`;
      $('#catchBtn').addEventListener('click', ()=> startCatch(catchable[0]));
    } else {
      area.innerHTML = `<div style="font-weight:800;font-size:13px;margin-bottom:8px;">Catch which one?</div>` +
        catchable.map((e,i)=>`<button class="btn btn-primary catch-opt" data-i="${i}" style="margin-bottom:8px;">🎯 ${SPECIES[e.species].name} (Lv ${e.level})</button>`).join('');
      area.querySelectorAll('.catch-opt').forEach(btn=> btn.addEventListener('click', ()=> startCatch(catchable[+btn.dataset.i])));
    }
  }
  $('#regionBtn').addEventListener('click', ()=>go('region'));
  if(breakNow) showEyeBreak();
  $('#againBtn').addEventListener('click', ()=> exploreFurther());
}

/* ---------- CATCHING ---------- */
function startCatch(enemy){
  const need = catchPhraseCount(enemy.species);
  // build challenge words: fight mistakes first, then fill from pool
  const mistakes = (ui.battle.fightMistakes||[]).slice();
  const poolWords = shuffle(activePool().map(w=>w.text).filter(t=>!mistakes.includes(t)));
  const words = [];
  for(const t of mistakes){ if(words.length<need) words.push(t); }
  while(words.length<need){ if(poolWords.length===0){ // refill if pool smaller than need
      const all = activePool().map(w=>w.text); if(all.length===0) break; poolWords.push(...shuffle(all)); }
    words.push(poolWords.pop());
  }
  ui.catchTarget = enemy;
  startQuiz({
    title:`Catching ${SPECIES[enemy.species].name}`,
    subtitle:`Spell ${words.length} to seal it. One slip is risky — two lets it escape!`,
    words,
    endAfterMistakes:2, lockExit:true,
    onComplete:(results)=> resolveCatch(enemy, results),
    onExit:()=>{ showVictory(ui.battle.enemies.map(e=>SPECIES[e.species].name).join(' & '), []); },
  });
}
function resolveCatch(enemy, results){
  const mistakes = results.filter(r=>!r.passed).length;
  let caught;
  if(mistakes===0) caught = true;
  else if(mistakes===1) caught = Math.random() >= 0.80; // first mistake fails 80% of the time
  else caught = false;                                   // second mistake always fails
  if(caught) gotcha(enemy);
  else {
    playSfx('catch_miss');
    go('battle'); // reuse container
    $('#brandSub').textContent='Catch';
    screenEl.innerHTML = `
      <div style="text-align:center;padding:30px 0;">
        <div style="font-size:42px;">💨</div>
        <div class="screen-title" style="text-align:center;">So close!</div>
        <div class="screen-sub" style="text-align:center;">The ${SPECIES[enemy.species].name} broke free and fled.</div>
      </div>
      <button class="btn btn-primary" id="okBtn">Continue</button>
    `;
    $('#okBtn').addEventListener('click', ()=>go('region'));
  }
}
/* Legendaries are a one-time meeting: once caught, they stop appearing. */
function legendaryCaught(sp){ return (state.caughtSpecies||[]).includes(sp); }

const CATCH_MESSAGES = {
  phoenix: `The young phoenix looks deep into your eyes, into your soul.<br><br>` +
    `Sensing that you have the potential and the heart to help monsters around the world, ` +
    `it entrusts its power to you.<br><br>` +
    `<i>Grow it well, and it will help you as you adventure onward.</i>`,
};

function gotcha(enemy){
  /* Remember the form it was actually caught in, so a Lv55 base-form catch
     becomes stage 1 at Lv56 and stage 2 at Lv57 rather than jumping instantly. */
  playSfx('catch_success');
  const sp = SPECIES[enemy.species];
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at center,#fff7e0,#e8dcc0);gap:16px;';
  ov.innerHTML = `
    <div class="evo-mon cutout">${monPortrait(enemy.species, 140, { view:'front', bare:true, stage:enemy.stage||0 })}</div>
    <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:24px;">Gotcha!</div>
    <div style="font-weight:700;color:var(--ink-soft);">${sp.name} was caught!</div>
    <div style="font-size:13px;color:var(--ink-soft);font-weight:600;">Give it a nickname? (optional)</div>
    <input type="text" id="nickInput" placeholder="${sp.name}" maxlength="16" style="max-width:220px;text-align:center;">
    <button class="btn btn-primary" id="nickSave" style="width:auto;padding:12px 28px;">Add to team</button>
  `;
  document.body.appendChild(ov);
  ov.querySelector('#nickSave').addEventListener('click', async ()=>{
    const nick = ov.querySelector('#nickInput').value.trim();
    const mon = newMonster(enemy.species, enemy.level);
  const caughtStage = enemy.stage || 0;
  if(caughtStage < evolutionStage(enemy.species, enemy.level)){
    mon.evoFloor = caughtStage;
    mon.evoFloorLevel = enemy.level;
  }
    if(nick){ mon.nickname = nick; mon.namedRegion = state.progress.currentRegion; }
    if(battleParty().length < 6) state.party.push(mon);
    else state.storage.push(mon);
    if(!state.caughtSpecies.includes(enemy.species)) state.caughtSpecies.push(enemy.species);
    if(!state.encounteredSpecies.includes(enemy.species)) state.encounteredSpecies.push(enemy.species);
    await saveProfile();
    document.body.removeChild(ov);
    const where = state.party.length<=6 && state.party.some(m=>m.uid===mon.uid) ? 'your party' : 'storage';
    toast(`${displayName(mon)} joined ${where}!`);
    // Some catches carry a scene of their own.
    if(enemy.species === 'ankylosaurus') return ankyloConversation(mon);
    const msg = CATCH_MESSAGES[enemy.species];
    if(msg) return storyModal(monPortrait(enemy.species, 150, { view:'front', bare:true, stage:enemy.stage||0 }),
      SPECIES[enemy.species].name, msg, ()=>go('region'), { subtitle:'A bond formed' });
    go('region');
  });
}

function go(screen){
  if(screen !== 'quiz') document.body.classList.remove('writing');
  document.body.classList.remove('in-scene');
  /* A daily reward held back during a fight gets its moment once the player is
     somewhere it can safely take over the screen. */
  if(!['battle','quiz'].includes(screen) && typeof flushPendingDaily === 'function'){
    setTimeout(flushPendingDaily, 350);
  }
  if(!['zone','caverns','battle','quiz'].includes(screen)) document.body.classList.remove('zone-dark','zone-tinted');
  // Protected screens re-lock as soon as you leave them, so the password is
  // required on every visit. The arena stays unlocked while you're actually
  // fighting in it (arena -> battle -> arena), otherwise testing would prompt
  // for the password after every single bout.
  if(ui.spellingUnlocked && screen !== 'spelling') ui.spellingUnlocked = false;
  if(ui.arenaUnlocked && screen !== 'arena' && screen !== 'battle') ui.arenaUnlocked = false;
  if(ui.xpUnlocked && screen !== 'sound') ui.xpUnlocked = false;
  ui.screen = screen;
  render();
}

function render(){
  try{ renderInner(); }
  catch(err){
    console.error('render error:', err);
    toast('Error: '+err.message);
    try{
      screenEl.innerHTML = `<div class="placeholder-note">
        <span class="pn-emoji">⚠️</span>Something went wrong on this screen.<br>
        <span style="font-size:11px;">${escapeHtml(err.message)}</span>
      </div><button class="btn btn-primary" id="errHome" style="margin-top:14px;">Back to Home</button>`;
      $('#errHome').addEventListener('click', ()=>go('home'));
    }catch(e2){}
  }
}
function renderInner(){
  enforceEyeBreak();
  if(!['home','region','battle','recover','challenge','explore','shop','storage','party','stats','monsterIndex','indexDetail','spellingIndex','profileSelect'].includes(ui.screen)) setScreenBg(null);
  const hb = $('#hamburgerBtn');
  // hamburger available everywhere except profile setup + (future) fights
  const noMenu = ['boot','profileSelect','starterSelect','battle','quiz'].includes(ui.screen);
  hb.disabled = noMenu;

  switch(ui.screen){
    case 'profileSelect': return renderProfileSelect();
    case 'newTrainer':    return promptNewTrainerName();
    case 'starterSelect': return renderStarterSelect();
    case 'home':          return renderHome();
    case 'region':        return renderRegion();
    case 'explore':       return renderExplore();
    case 'battle':        return renderBattle();
    case 'challenge':     return (state.progress.currentRegion === 4) ? renderChallengeR4() : renderChallenge();
    case 'party':         return renderPartyStub();
    case 'stats':         return renderStats();
    case 'storage':       return renderStorage();
    case 'shop':          return renderShop();
    case 'regionSelect':  return renderRegionSelect();
    case 'zone':          return renderZone();
    case 'caverns':       return renderCaverns();
    case 'plant':         return renderPlant();
    case 'concert':       return renderConcert();
    case 'generator':     return renderGenerator();
    case 'diving':        return go('weather_deck');
    case 'elementStones': return renderElementStones();
    case 'weather_deck':      return renderWeatherDeck();
    case 'cabin_deck': return renderCabinDeck();
    case 'laboratory_deck': return renderLaboratoryDeck();
    case 'accuse':        return renderAccuse();
    case 'accuse':        return renderAccuse();
    case 'dojo':          return renderDojo();
    case 'avatarPick':    return renderAvatarPick();
    case 'region2':       return renderStub('Region 2','🏞️','Region 2 is unlocked — its wilds and trainers arrive in a future phase. Earth Snake and Ground Starter will be catchable here.','region');
    case 'recover':       return renderRecover();
    case 'monsterIndex':  return renderMonsterIndex();
    case 'indexDetail':   return renderIndexDetail();
    case 'spellingIndex': return renderSpellingIndex();
    case 'spelling':      return renderSpelling();
    case 'quiz':          return renderQuiz();
    case 'arena':         return renderArenaGate();
    case 'sound':         return renderSound();
    default:              return renderProfileSelect();
  }
}

