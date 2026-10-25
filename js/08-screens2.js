/* ==========================================================
   08-screens2.js
   Stats & moves, monster index, recovery, challenge, arena.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ---------- RECOVERY / HEALING (Phase 6) ----------
   - tests recently-wrong words first, then the SRS/active pool
   - correct answer heals 10% max HP to the WHOLE party
   - a miss starts a 3-rep remedial loop (needs 3 consecutive correct; any miss
     resets it); loop reps grant no heal, completing the loop heals 5% to all
   - remediated words still stay in the recent-wrong history for future sessions */
function monMax(m){ return computeMaxHp(m.species, m.level, m.supplements, m); }
function partyFull(){ return battleParty().every(m=>m.currentHp>=monMax(m)); }
function healParty(pct){
  playSfx('recovery_heal');
  // Round UP (and heal at least 1) so a monster on very low HP always makes
  // progress — flooring could yield 0 and leave it permanently stuck.
  battleParty().forEach(m=>{
    const max = monMax(m);
    const gain = Math.max(1, Math.ceil(max*pct));
    m.currentHp = Math.min(max, m.currentHp + gain);
  });
  saveProfile();
}

function startRecovery(){
  const pool = activePool().map(w=>w.text);
  if(pool.length===0){ ui.prevScreen='recover'; toast('No words selected, please select to proceed.'); go('spelling'); return; }
  const inPool = new Set(pool);
  const recent = (state.recentWrong||[]).filter(w=>inPool.has(w));
  ui.recovery = {
    recentQueue: recent.slice(),
    poolBag: shuffle(pool),
    remedial: null,          // { word, streak }
    healedCount: 0,
    startHp: partyHpTotal(),
  };
  recoveryStep();
}
function partyHpTotal(){ return state.party.reduce((s,m)=>s+Math.max(0,m.currentHp),0); }

function nextRecoveryWord(){
  const r = ui.recovery;
  if(r.remedial) return r.remedial.word;
  if(r.recentQueue.length) return r.recentQueue[0];
  if(r.poolBag.length===0) r.poolBag = shuffle(activePool().map(w=>w.text));
  return r.poolBag[0];
}

function recoveryStep(){
  if(partyFull()){ return finishRecovery(); }
  const word = nextRecoveryWord();
  const r = ui.recovery;
  r.current = word;
  const remedial = !!r.remedial;
  startQuiz({
    title:'Recover',
    subtitle: remedial ? `Practice: get this right ${3-r.remedial.streak} more time${3-r.remedial.streak===1?'':'s'} in a row` : 'Spell it right to heal your whole team.',
    words:[word],
    recovery:true,
    onComplete:(results)=> onRecoveryWord(results[0].passed),
    onExit: finishRecovery,
  });
}
function consumeCurrent(r){
  if(r.recentQueue[0]===r.current) r.recentQueue.shift();
  else if(r.poolBag[0]===r.current) r.poolBag.shift();
}
function onRecoveryWord(passed){
  const r = ui.recovery;
  if(r.remedial){
    if(passed){
      r.remedial.streak++;
      // Each correct rep pays 5% immediately — three reps earn 15% in total,
      // rather than nothing until the loop completes.
      healParty(0.05);
      toast(`+5% HP to the team! (${r.remedial.streak}/3)`);
      if(r.remedial.streak>=3){
        consumeCurrent(r);
        r.remedial = null;
        r.healedCount++;
      }
    } else {
      r.remedial.streak = 0; // any miss resets the loop
    }
  } else {
    if(passed){
      healParty(0.10);
      r.healedCount++;
      consumeCurrent(r);
      toast('Nice! +10% HP to the team.');
    } else {
      r.remedial = { word: r.current, streak:0 }; // begin remedial loop on this word
    }
  }
  recoveryStep();
}

function finishRecovery(){
  stopTimer();
  const r = ui.recovery || { healedCount:0 };
  $('#brandSub').textContent = 'Recover';
  const full = partyFull();
  screenEl.innerHTML = `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:42px;">${full?'💖':'💧'}</div>
      <div class="screen-title" style="text-align:center;">${full?'Team fully healed!':'Recovery paused'}</div>
      <div class="screen-sub" style="text-align:center;">You answered ${r.healedCount} healing question${r.healedCount===1?'':'s'}.</div>
    </div>
    ${renderPartyHpCard()}
    <button class="btn btn-primary" id="moreBtn" style="margin-top:14px;" ${full?'disabled':''}>${full?'All healed up':'Keep recovering'}</button>
    <button class="btn btn-ghost" id="doneBtn" style="margin-top:10px;">Back to region</button>
  `;
  const mb=$('#moreBtn'); if(mb && !full) mb.addEventListener('click', startRecovery);
  $('#doneBtn').addEventListener('click', ()=>go('region'));
}
function renderPartyHpCard(){
  return `<div class="hp-card">
    ${state.party.map(m=>{ const max=monMax(m); return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        ${monPortrait(m.species,30,{stage:monStage(m),crowned:isCrowned(m)})}
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:800;">${escapeHtml(displayName(m))}</div>
          <div class="hpbar"><div class="hpfill" style="width:${Math.max(0,m.currentHp/max*100)}%;background:${m.currentHp/max<0.3?'var(--cinnabar)':'var(--jade)'};"></div></div>
        </div>
        <div style="font-size:11px;color:var(--ink-soft);font-weight:700;">${Math.max(0,m.currentHp)}/${max}</div>
      </div>`; }).join('')}
  </div>`;
}

/* ---------- SCREEN: recover landing ---------- */
function renderRecover(){
  setScreenBg(state.progress.currentRegion===4 ? 'battle_cabin_deck' : 'recover');
  $('#brandSub').textContent = 'Recover';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Region</button>
    <div class="screen-title">Recover</div>
    <div class="screen-sub">Heal your team by revising words. Recently-missed words come first.</div>
    ${renderPartyHpCard()}
    <button class="btn btn-jade" id="startBtn" style="margin-top:16px;">💧 Start recovering</button>
    <button class="btn btn-ghost" id="backBtn2" style="margin-top:10px;">Back to region</button>
  `;
  $('#backBtn').addEventListener('click', ()=>go(backFromMenu()));
  $('#backBtn2').addEventListener('click', ()=>go('region'));
  $('#startBtn').addEventListener('click', ()=>{
    if(partyFull()){ toast('Your team is already at full health.'); return; }
    startRecovery();
  });
}


function ensurePool(){
  if(activePool().length===0){ ui.prevScreen='challenge'; toast('No words selected, please select to proceed.'); go('spelling'); return false; }
  if(!battleParty().some(m=>m.currentHp>0)){ toast('Your team needs healing first.'); return false; }
  return true;
}
function onChallengeWon(){
  const b = ui.battle;
  /* (3.22) A trainer's fight counts toward the eye breaks and the day — it
     never did. A break that falls due is shown at the next screen, once the
     story after the fight has moved on (enforceEyeBreak). */
  tallyBattleForEyeBreak();
  // NPC fights are worth 2 fights' XP per wave (e.g. the 5-wave Rival = 10)
  const waves = Array.isArray(b.waves) ? b.waves.length : 1;
  const levelUps = awardXpToParty(waves * 2);
  const tokens = rollTokenDrop();
  saveProfile();
  if(tokens) toast(tokens > 1 ? `🎫 You found ${tokens} Skill Tokens!` : '🎫 You found a Skill Token!');
  levelUps.filter(e=> e.breakthrough || e.ready).forEach((e, i)=>
    setTimeout(()=> toast(e.breakthrough ? `⚡ ${e.name} broke through! It can grow to Lv ${e.breakthrough} now.`
                                         : `⚡ ${e.name} is ready to break through to Lv ${e.ready} — see your Party.`), 1200 * (i + 1)));
  const finish = ()=>{ if(b.onWin) b.onWin(levelUps); else go('challenge'); };
  const evolvers = levelUps.filter(e=>e.evos.length>0);
  if(evolvers.length) playEvolutions(evolvers, finish); else finish();
}

function effectiveStarter(){
  const s = state.starterSpecies;
  if(s==='water_starter') return 'grass_starter';
  if(s==='fire_starter')  return 'water_starter';
  return 'fire_starter'; // grass -> fire
}

/* Guardian Dojo — three separate encounters, cleared in order, gates Region 2.
   Assistants are NPC tier (Power1 only); the Guardian is NPC Boss (best move). */
const DOJO_STAGES = [
  { id:'assistant1', label:'Rock Dojo Disciple 1', ai:'power1',
    waves:[
      [{species:'earth_snake',level:16}],
      [{species:'earth_snake',level:16},{species:'earth_snake',level:16}],
    ] },
  { id:'assistant2', label:'Rock Dojo Disciple 2', ai:'power1',
    waves:[
      [{species:'earth_snake',level:16},{species:'earth_snake',level:16}],
      [{species:'earth_snake',level:21}],
    ] },
  { id:'guardian', label:'Rock Dojo Master', ai:'best',
    waves:[
      [{species:'earth_snake',level:16},{species:'earth_snake',level:16},{species:'earth_snake',level:16}],
      [{species:'earth_snake',level:21},{species:'earth_snake',level:21}],
      [{species:'ground_starter',level:21}],
    ] },
];
/* Region 2's Water Dojo: three disciples, then the master. */
const WATER_DOJO_STAGES = [
  { id:'water_disciple1', label:'Water Dojo Disciple 1', ai:'power1',
    waves:[ [{species:'starfish',level:32},{species:'starfish',level:32}],
            [{species:'duck',level:32},{species:'duck',level:32}] ] },
  { id:'water_disciple2', label:'Water Dojo Disciple 2', ai:'power1',
    waves:[ [{species:'starfish',level:35},{species:'duck',level:35}],
            [{species:'starfish',level:35},{species:'duck',level:35},{species:'seahorse',level:35}] ] },
  { id:'water_disciple3', label:'Water Dojo Disciple 3', ai:'power1',
    waves:[ [{species:'duck',level:38},{species:'seahorse',level:38}],
            [{species:'starfish',level:38},{species:'duck',level:38},{species:'seahorse',level:38}] ] },
  { id:'water_master',    label:'Water Dojo Master',     ai:'best',
    waves:[ [{species:'starfish',level:40},{species:'seahorse',level:40}],
            [{species:'starfish',level:40},{species:'duck',level:40},{species:'seahorse',level:40}],
            [{species:'water_starter',level:41}] ] },
];

function dojoCleared(id){ return (state.progress.region1.dojoCleared||[]).includes(id); }
function nextDojoStage(){ return DOJO_STAGES.find(st=>!dojoCleared(st.id)); }

/* (3.11) Each fight's setup — its waves and conditions, nothing that happens
   after — is built in one place, so the Test Arena's Challengers fight exactly
   what the story does (ARENA_CHALLENGERS, below). */
function dojoStageBattle(stage){
  return { isNpc:true, name:stage.label, npcId:stage.id,
    waves: stage.waves.map(w=>w.map(e=>({...e, ai:stage.ai, nerfed:false}))) };
}
function startDojoStage(stage){
  if(!ensurePool()) return;
  beginBattle(Object.assign(dojoStageBattle(stage), { onWin:()=>onDojoStageWin(stage) }));
}
async function onDojoStageWin(stage){
  const r1 = state.progress.region1;
  r1.dojoCleared = r1.dojoCleared || [];
  if(!r1.dojoCleared.includes(stage.id)) r1.dojoCleared.push(stage.id);
  if(stage.id==='guardian') return onGuardianWin();
  await saveProfile();
  const nxt = nextDojoStage();
  challengeResult('🥋', stage.label+' defeated!',
    nxt ? `"Impressive. But <b>${escapeHtml(nxt.label)}</b> awaits you next."` : 'The path is clear.',
    'challenge');
}
function startGuardian(){
  const stage = nextDojoStage();
  if(!stage){ toast('You have already cleared the Dojo.'); return; }
  startDojoStage(stage);
}
async function onGuardianWin(){
  const already = state.progress.region1.guardianCleared;
  state.progress.region1.guardianCleared = true;
  // award a free Earth Snake at level 21 (direct, not a catch)
  if(!already){
    const gift = newMonster('ground_starter', 15);
    if(slottedCount()<6) state.party.push(gift); else state.storage.push(gift);
    if(!state.caughtSpecies.includes('ground_starter')) state.caughtSpecies.push('ground_starter');
    if(!state.encounteredSpecies.includes('ground_starter')) state.encounteredSpecies.push('ground_starter');
  }
  await saveProfile();
  challengeResult('🏯','The Dojo is yours!',
    `The Guardian bows. "You've earned my respect, ${escapeHtml(state.name)}. The road to Region 2 is open."` + (already?'':' She hands you a <b>Rock Rhino</b> (Lv 15) as a token.'),
    'challenge');
}

/* Rival — one-time, rewards protein */
function rivalR1Battle(){
  const eff = effectiveStarter();
  return { isNpc:true, name:'Jax', npcId:'rival',
    waves:[
      [{species:'rat',level:21,ai:'best',nerfed:false}],
      [{species:'bird',level:21,ai:'best',nerfed:false}],
      [{species:'moth',level:21,ai:'best',nerfed:false}],
      [{species:'electric_starter',level:21,ai:'best',nerfed:false}],
      [{species:eff,level:21,ai:'best',nerfed:false}],
    ] };
}
function startRival(){
  if(!ensurePool()) return;
  beginBattle(Object.assign(rivalR1Battle(), { onWin:onRivalWin }));
}
async function onRivalWin(){
  const first = !state.progress.region1.rivalCleared;
  state.progress.region1.rivalCleared = true;
  if(first) state.inventory.protein += 3;
  await saveProfile();
  challengeResult('🏆','Jax defeated!',
    first ? 'Jax grins. "Not bad! Here, take these — you earned them." You received <b>3 Protein Supplements</b>!' :
            'Jax is out of rewards to give, but the win still felt good.',
    'challenge');
}

/* Investigate — thugs + protein rolls + completion bonus */
const THUG_ORDER = ['thug1','thug2','thug3','thug4','thug5'];
/* Each thug fields a 3-monster team; Thug 5 fights two back-to-back waves. */
const THUG_DEF = {
  thug1:{ waves:[[{species:'rat',level:15},{species:'rat',level:15},{species:'rat',level:15}]] },
  thug2:{ waves:[[{species:'bird',level:16},{species:'bird',level:16},{species:'bird',level:16}]] },
  thug3:{ waves:[[{species:'moth',level:17},{species:'moth',level:17},{species:'moth',level:17}]] },
  thug4:{ waves:[[{species:'earth_snake',level:18},{species:'earth_snake',level:18},{species:'earth_snake',level:18}]] },
  thug5:{ waves:[
    [{species:'rat',level:19},{species:'rat',level:19},{species:'rat',level:19}],
    [{species:'earth_snake',level:19},{species:'earth_snake',level:19}],
  ] },
};
function nextThugId(){
  const r1 = state.progress.region1;
  return THUG_ORDER.find(id=>!(r1.thugsCleared||[]).includes(id)) || (r1.thugBossCleared ? null : 'thug_boss');
}
function doInvestigate(){
  if(!ensurePool()) return;
  const r1 = state.progress.region1;
  const nextThug = THUG_ORDER.find(id=>!r1.thugsCleared.includes(id));
  const bossDone = r1.thugBossCleared;
  if(!nextThug && bossDone){ toast('You have cleared out every thug here.'); return; }
  if(Math.random()<0.10 && r1.investigateProtein<3){
    r1.investigateProtein++; state.inventory.protein++; saveProfile();
    challengeResult('💪','Lucky find!','While poking around, you found a <b>Protein Supplement</b>!','challenge');
    return;
  }
  if(nextThug) startThug(nextThug);
  else startThugBoss();
}
function thugBattle(id){
  const d = THUG_DEF[id];
  return { isNpc:true, name:'Thug', noFlee:true, npcId:id,
    waves: d.waves.map(w=>w.map(e=>({...e, ai:'power1', nerfed:false}))) };
}
function startThug(id){
  beginBattle(Object.assign(thugBattle(id), { onWin:()=>onThugWin(id) }));
}
async function onThugWin(id){
  if(!state.progress.region1.thugsCleared.includes(id)) state.progress.region1.thugsCleared.push(id);
  await saveProfile();
  const left = THUG_ORDER.filter(t=>!state.progress.region1.thugsCleared.includes(t)).length;
  challengeResult('👊','Thug beaten!',
    left>0 ? `You scattered the thug. ${left} more still lurk in the area…` : 'That was the last of the small fry — their boss must be near.',
    'challenge');
}
function thugBossBattle(){
  return { isNpc:true, name:'Thug Boss', noFlee:true, npcId:'thug_boss',
    waves:[
      [{species:'rat',level:20,ai:'best',nerfed:false},{species:'bird',level:20,ai:'best',nerfed:false},{species:'moth',level:20,ai:'best',nerfed:false}],
      [{species:'ground_starter',level:35,ai:'best',nerfed:false}],
    ] };
}
function startThugBoss(){
  beginBattle(Object.assign(thugBossBattle(), { onWin:onThugBossWin }));
}
async function onThugBossWin(){
  const r1 = state.progress.region1;
  const first = !r1.thugBossCleared;
  r1.thugBossCleared = true;
  let bonus = 0;
  if(first){
    bonus = 2 + (3 - r1.investigateProtein); // completes the pool to a total of 5
    state.inventory.protein += bonus;
    r1.investigateProtein = 3;
    state.inventory.strangeKey = true;
  }
  await saveProfile();
  challengeResult('🔑','Thug Boss defeated!',
    first ? `The boss flees, dropping a <b>Strange Key</b> (for a later region) and <b>${bonus} Protein Supplement${bonus===1?'':'s'}</b>!` :
            'The boss has nothing left to give.',
    'challenge');
}

function challengeResult(emoji, title, html, back){
  $('#brandSub').textContent = 'Result';
  screenEl.innerHTML = `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:44px;">${emoji}</div>
      <div class="screen-title" style="text-align:center;">${escapeHtml(title)}</div>
    </div>
    <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:14px;padding:16px;font-weight:600;line-height:1.5;font-size:14px;">${html}</div>
    <button class="btn btn-primary" id="okBtn" style="margin-top:16px;">Continue</button>
  `;
  $('#okBtn').addEventListener('click', ()=>go(back||'challenge'));
}

/* ---------- SCREEN: challenge ---------- */
function renderChallenge(){
  if((state.progress.currentRegion||1) === 3) return renderChallengeR3();
  if((state.progress.currentRegion||1) === 2) return renderChallengeR2();
  setScreenBg('challenge');
  $('#brandSub').textContent = 'Challenge';
  const r1 = state.progress.region1;
  const thugsLeft = THUG_ORDER.filter(t=>!r1.thugsCleared.includes(t)).length;
  const investigateDone = thugsLeft===0 && r1.thugBossCleared;
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Region</button>
    <div class="screen-title">Challenge</div>
    <div class="screen-sub">Prove yourself against the region's trainers.</div>

    <div style="display:flex;gap:10px;margin-bottom:14px;font-size:12px;font-weight:800;color:var(--ink-soft);">
      <span>💪 Protein: ${state.inventory.protein}</span>
      ${state.inventory.strangeKey?'<span>🔑 Strange Key</span>':''}
    </div>

    <div class="challenge-card" id="cGuardian">
      ${npcPortrait((nextDojoStage()||{}).id || 'guardian', '🏯', 50, '#b08a5a')}
      <div style="flex:1;">
        <div class="cc-title">Rock Dojo ${r1.guardianCleared?'<span class="clear-tag">Cleared</span>':''}</div>
        <div class="cc-desc">${r1.guardianCleared
          ? 'All three challengers beaten. Region 2 is unlocked.'
          : `${(r1.dojoCleared||[]).length}/3 beaten · next: <b>${escapeHtml((nextDojoStage()||{}).label||'')}</b>`}</div>
      </div>
    </div>

    <div class="challenge-card" id="cRival">
      ${npcPortrait('rival', '🥊', 50, '#c8453a')}
      <div style="flex:1;">
        <div class="cc-title">Jax ${r1.rivalCleared?'<span class="clear-tag">Cleared</span>':''}</div>
        <div class="cc-desc">${r1.rivalCleared?'Already beaten — no more rewards.':'One-time battle. Reward: 3 Protein Supplements.'}</div>
      </div>
    </div>

    <div class="challenge-card" id="cInvestigate" ${investigateDone?'style="opacity:0.6;"':''}>
      ${npcPortrait(nextThugId() || 'thug_boss', '🔍', 50, '#2f8f6f')}
      <div style="flex:1;">
        <div class="cc-title">Investigate ${investigateDone?'<span class="clear-tag">Cleared</span>':''}</div>
        <div class="cc-desc">${investigateDone?'The area is safe now.':`Search the area — find supplements or run into thugs. ${thugsLeft} thug${thugsLeft===1?'':'s'}${r1.thugBossCleared?'':' + boss'} left.`}</div>
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="btn btn-jade" id="recoverBtn" style="flex:1;">💧 Recover</button>
      <button class="btn btn-ghost" id="regionBtn" style="flex:1;">Back</button>
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('region'));
  $('#regionBtn').addEventListener('click', ()=>go('region'));
  $('#recoverBtn').addEventListener('click', ()=>go('recover'));
  $('#cGuardian').addEventListener('click', startGuardian);
  $('#cRival').addEventListener('click', ()=>{ if(state.progress.region1.rivalCleared){ toast('You already beat Jax.'); } else startRival(); });
  if(!investigateDone) $('#cInvestigate').addEventListener('click', doInvestigate);
}

/* ---------- TEST ARENA (dev mode) ----------
   Password-locked. Lets every move be fired without spelling, against a 200 HP
   dummy, with infinite waves — for balance/animation/status bug-hunting.
   Remove or leave locked for the final release. */
const ARENA_DUMMY_HP = 200;

function renderArenaGate(){
  $('#brandSub').textContent = 'Test Arena';
  if(ui.arenaUnlocked) return renderArena();
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">Test Arena</div>
    <div class="screen-sub">Developer mode — enter the password.</div>
    <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:16px;padding:20px;">
      <input type="password" id="pwInput" placeholder="Password" inputmode="numeric" autocomplete="off">
      <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-top:8px;"></div>
      <button class="btn btn-primary" id="pwSubmit" style="margin-top:14px;">Unlock</button>
    </div>`;
  $('#backBtn').addEventListener('click', ()=>go(ui.prevScreen||'home'));
  const submit=()=>{
    const v=$('#pwInput').value.trim();
    if(passOk(v)){ ui.arenaUnlocked=true; render(); }
    else toast('Incorrect password.');
  };
  $('#pwSubmit').addEventListener('click', submit);
  $('#pwInput').addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
}

/* ============================================================
   TEST ARENA
   A bench for checking mechanics against real monsters. Your whole party goes
   in; the opposition is a real species at a real level, with every lever a
   tester needs exposed.
   ============================================================ */
const ARENA_TYPES = ['Physical','Fire','Water','Grass','Electric','Flying','Ground','Ghost','Psychic','Dragon','Steel','Fairy'];

function arenaCfg(){
  ui.arena = ui.arena || {
    type:'Electric', species:null, count:1, level:null,
    acts:false,            // dummies skip their turn by default
    immortal:false,        // both sides die normally by default
    move:'auto',           // which slot the dummy uses
    plus:0,                // its Very High / Ultra stone's refinement: 0, + (1), ✦ (2)
    buffs:{},              // elusive, first, …
    advanced:false,
    mode:'challengers',    // (3.11) 'challengers' (the story's fights) or 'bench' (the dummies)
    region:1,              // the Challengers tab's region
  };
  return ui.arena;
}
/* The two halves of the arena (3.11): the story's challengers, and the bench. */
function arenaTabs(c){
  return `<div class="ar-row" style="margin:0 0 12px;">
      <button class="btn btn-ghost pill ar-mode ${c.mode === 'challengers' ? 'sel' : ''}" data-mode="challengers" style="flex:1;">🏆 Challengers</button>
      <button class="btn btn-ghost pill ar-mode ${c.mode !== 'challengers' ? 'sel' : ''}" data-mode="bench" style="flex:1;">🧪 Test bench</button>
    </div>`;
}
function wireArenaTabs(c){
  screenEl.querySelectorAll('.ar-mode').forEach(b=> b.addEventListener('click', ()=>{ c.mode = b.dataset.mode; renderArena(); }));
}
function arenaSpeciesOfType(t){
  return Object.keys(SPECIES).filter(k=>(SPECIES[k].types||[]).includes(t));
}
function arenaDefaultLevel(){
  /* your best, but never past 100: no monster of theirs is (2.99,
     ENEMY_LEVEL_CAP) — and the box only goes to 100 */
  return Math.min(ENEMY_LEVEL_CAP, Math.max(...state.party.concat(state.storage).map(m=>m.level), 5));
}

function renderArena(){
  $('#brandSub').textContent = 'Test Arena';
  const c = arenaCfg();
  if(c.mode === 'challengers') return renderArenaChallengers();
  const list = arenaSpeciesOfType(c.type);
  if(!c.species || !list.includes(c.species)) c.species = list[0];
  if(c.level == null) c.level = arenaDefaultLevel();
  const sp = SPECIES[c.species];
  const moveSlots = sp ? MOVES[c.species].filter(m=>m[1]!=null).map(m=>m[0]) : [];

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">Test Arena</div>
    ${arenaTabs(c)}
    <div class="screen-sub">No spelling. Every move unlocked. Your whole party comes in.</div>

    <div class="hp-card" style="margin-bottom:12px;">
      <div class="ar-label">Opponent type</div>
      <select id="arType" class="ar-select">
        ${ARENA_TYPES.map(t=>`<option value="${t}" ${t===c.type?'selected':''}>${t}</option>`).join('')}
      </select>

      <div class="ar-label">Species <span>${list.length} of this type</span></div>
      <select id="arSpecies" class="ar-select">
        ${list.map(k=>`<option value="${k}" ${k===c.species?'selected':''}>${escapeHtml(SPECIES[k].name)} · ${SPECIES[k].tier} · rate ${SPECIES[k].rate}</option>`).join('')}
      </select>

      <div class="ar-row">
        <div style="flex:1;">
          <div class="ar-label">Level</div>
          <input type="number" id="arLevel" class="ar-num" value="${c.level}" min="1" max="100">
        </div>
        <div style="flex:1;">
          <div class="ar-label">How many</div>
          <div style="display:flex;gap:6px;">
            ${[1,2,3].map(n=>`<button class="btn btn-ghost pill ar-n ${n===c.count?'sel':''}" data-n="${n}" style="flex:1;">${n}</button>`).join('')}
          </div>
        </div>
      </div>

      <div class="ar-label">Behaviour</div>
      <div class="ar-row">
        <button class="btn btn-ghost pill ar-tog ${c.acts?'':'sel'}" data-acts="0" style="flex:1;">😴 Skips turn</button>
        <button class="btn btn-ghost pill ar-tog ${c.acts?'sel':''}" data-acts="1" style="flex:1;">⚔️ Attacks</button>
      </div>
      <div class="ar-row">
        <button class="btn btn-ghost pill ar-imm ${c.immortal?'':'sel'}" data-imm="0" style="flex:1;">💀 Regular</button>
        <button class="btn btn-ghost pill ar-imm ${c.immortal?'sel':''}" data-imm="1" style="flex:1;">♾️ Immortal</button>
      </div>
      <div class="ar-hint">${c.immortal
        ? 'Both sides heal to full when they would be knocked out — the test runs forever.'
        : 'A knock-out ends the test. Nothing respawns.'}</div>

      <button class="btn btn-ghost" id="arAdv" style="margin-top:10px;">${c.advanced?'▾':'▸'} Advanced options</button>

      ${c.advanced ? `
        <div class="ar-adv">
          <div class="ar-label">Move the opponent uses</div>
          <select id="arMove" class="ar-select">
            <option value="auto" ${c.move==='auto'?'selected':''}>Auto (its usual AI)</option>
            ${moveSlots.map(sl=>`<option value="${sl}" ${c.move===sl?'selected':''}>${sl}</option>`).join('')}
            <option value="vh1" ${c.move==='vh1'?'selected':''}>Very High — ${escapeHtml(sp.types[0])}</option>
            ${sp.types[1] ? `<option value="vh2" ${c.move==='vh2'?'selected':''}>Very High — ${escapeHtml(sp.types[1])}</option>` : ''}
            <option value="ultra" ${c.move==='ultra'?'selected':''}>Ultra stone</option>
          </select>
          ${['vh1','vh2','ultra'].includes(c.move) ? `
            <div class="ar-label">Stone refinement</div>
            <div class="ar-row">
              ${['Base','+','✦'].map((l, p)=>`<button class="btn btn-ghost pill ar-plus ${(c.plus||0)===p?'sel':''}" data-plus="${p}" style="flex:1;">${l}</button>`).join('')}
            </div>
            <div class="ar-hint">${c.move === 'ultra'
              ? 'It throws an Ultra barrage every turn it acts — set it to Attacks.'
              : 'It casts the stone on its first action, as a trainer does, then attacks with its strongest move — set it to Attacks.'}</div>` : ''}

          <div class="ar-label">Buffs on the opponent</div>
          <div class="ar-buffs">
            ${[['elusive','💨 Elusive'],['first','⚡ Goes first'],['guard','🛡 Guard (1 stack)'],
               ['airborne','🕊 Airborne'],['invisible','👤 Unseen'],['counter','↩️ Counter stance'],
               ['block3','🛡 Block ×3'],['crowned','✦ Crowned'],['maxProtein','💪 Max protein']]
              .map(([k,lbl])=>`<button class="btn btn-ghost pill ar-buff ${c.buffs[k]?'sel':''}" data-buff="${k}">${lbl}</button>`).join('')}
          </div>
        </div>` : ''}
    </div>

    <button class="btn btn-primary" id="arenaStart">⚔️ Enter Arena</button>
    <div class="phase-flag">Your party enters as it stands. Statuses, stones and levels are real.</div>
  `;
  $('#backBtn').addEventListener('click', ()=>go(ui.prevScreen||'home'));
  wireArenaTabs(c);
  $('#arType').addEventListener('change', e=>{ c.type = e.target.value; c.species = null; renderArena(); });
  $('#arSpecies').addEventListener('change', e=>{ c.species = e.target.value; renderArena(); });
  $('#arLevel').addEventListener('change', e=>{ c.level = Math.max(1, Math.min(100, +e.target.value||1)); });
  screenEl.querySelectorAll('.ar-n').forEach(b=>b.addEventListener('click', ()=>{ c.count=+b.dataset.n; renderArena(); }));
  screenEl.querySelectorAll('.ar-tog').forEach(b=>b.addEventListener('click', ()=>{ c.acts = b.dataset.acts==='1'; renderArena(); }));
  screenEl.querySelectorAll('.ar-imm').forEach(b=>b.addEventListener('click', ()=>{ c.immortal = b.dataset.imm==='1'; renderArena(); }));
  $('#arAdv').addEventListener('click', ()=>{ c.advanced = !c.advanced; renderArena(); });
  const mv = $('#arMove'); if(mv) mv.addEventListener('change', e=>{ c.move = e.target.value; renderArena(); });
  screenEl.querySelectorAll('.ar-plus').forEach(b=>b.addEventListener('click', ()=>{ c.plus = +b.dataset.plus; renderArena(); }));
  screenEl.querySelectorAll('.ar-buff').forEach(b=>b.addEventListener('click', ()=>{
    const k=b.dataset.buff; c.buffs[k] = !c.buffs[k]; renderArena();
  }));
  $('#arenaStart').addEventListener('click', ()=> startArena());
}

/* A real monster, built to the tester's specification. */
function makeDummy(type){
  const c = arenaCfg();
  const species = c.species || 'rat';
  const lvl = c.level || 50;
  const e = makeEnemy(species, lvl, {
    nerfed:false, crowned:!!c.buffs.crowned,
    supplements: c.buffs.maxProtein ? 10 : 0,
    ai: c.move === 'auto' ? undefined : 'best',
  });
  e.isDummy = true;
  e.dummyType = type;
  e.arenaActs = !!c.acts;
  e.arenaMove = c.move;
  /* Its stone, carried as a trainer carries one: a Very High cast on its first
     action (enemyActs), or an Ultra thrown every turn. These two options used
     to do nothing at all — it simply swung its strongest move. */
  const types = SPECIES[species].types || [];
  const plus = Math.max(0, Math.min(2, c.plus || 0));
  if(c.move === 'vh1' || c.move === 'vh2'){
    const t = types[c.move === 'vh2' ? 1 : 0] || types[0];
    if(t && VERY_HIGH[t]) e.stone = { type:t, plus, cast:true, used:false };
  }
  if(c.move === 'ultra' && types[0]) e.arenaUltra = { type:types[0], plus };
  if(c.buffs.elusive)   e.elusive = true;
  if(c.buffs.guard)     { e.guard = true; grantBlock(e, 1, e.atk); }
  if(c.buffs.block3)    grantBlock(e, 3, e.atk);
  if(c.buffs.airborne)  e.airborne = 99;
  if(c.buffs.invisible) e.invisible = 99;
  if(c.buffs.counter)   { e.counterTurns = 99; e.counterRet = 0.5; }
  if(c.buffs.first)     e.arenaFirst = true;
  return e;
}

function startArena(){
  const c = arenaCfg();
  if(!battleParty().some(m=>m.currentHp>0)) return toast('Your party needs healing first.');
  ui.battle = {
    waves:[[]], waveIndex:0, isNpc:false, allowCatch:false, name:'Test Arena',
    onWin:null, switchedThisTurn:false, busy:false, fightMistakes:[], phase:'player', wordCarry:0,
    partyStatus:{}, monStatus:{}, focusUid:null, fieldStatus:{}, usedVeryHigh:{}, usedUltra:{}, usedSoul:{},
    acted:[], preHits:[], aftershock:[],
    arena:true, arenaCount:c.count, arenaType:c.type,
    arenaImmortal:!!c.immortal,
  };
  ui.battle.enemies = Array.from({length:c.count}, ()=>makeDummy(c.type));
  // the party enters as it stands
  state.party.forEach(m=>{ m.guard=false; m.airborne=0; m.invisible=0; m.prep=0; m.blockStacks=0; m._entered=false; });
  let ai = state.party.findIndex(m=>m.currentHp>0 && !isPassenger(m));
  ui.battle.activeIndex = ai>=0?ai:0;
  const lead = activeMon();
  if(lead){ lead._entered = true; applyEntryPassives(lead, lead.species, lead.level, monAtk(lead)); }
  ui.battle.enemies.forEach(e=>{
    applyEntryPassives(e, e.species, e.level, e.atk);
    if(e.stone) enemyStonePassive(e);        // a refined stone works from the moment it arrives
  });
  go('battle');
  setTimeout(()=> beginRound('Test arena — choose a move.'), 600);
}

/* In arena mode every move is available and skips the quiz entirely. */
function arenaMoveList(m){
  const out = [];
  MOVES[m.species].forEach(mv=>{
    const [slot,name,mult,target,words,unlock]=mv;
    if(name==null) return;
    out.push({ slot,name,mult,target,words,unlock,available:true,isStone:false });
  });
  if(m.equippedStone){
    const t=stoneTierDef(m.equippedStone.tier);
    out.push({ slot:'Basic', name:m.equippedStone.name, mult:t.mult,
      target:t.kind==='multi2'?'Multi2':(t.kind==='status'?'Status':'Single'),
      words:t.words, unlock:0, available:!ui.battle.usedVeryHigh[m.uid] || t.id!=='veryhigh',
      isStone:true, stoneTier:t.id, stoneType:m.equippedStone.type });
  }
  if(m.ultraStone){
    const t=stoneTierDef('ultra');
    out.push({ slot:'UltraStone', name:m.ultraStone.name, mult:t.mult, target:'MultiHit',
      words:t.words, unlock:0, available:!ui.battle.usedUltra[m.uid],
      isStone:true, stoneTier:'ultra', stoneType:m.ultraStone.type });
  }
  return out;
}

/* Arena move picker: every type/tier of stone move, no spelling, instant resolve. */
function renderArenaMoveSheet(){
  const mon = activeMon();
  const base = arenaMoveList(mon);
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.6);z-index:75;display:flex;align-items:flex-end;justify-content:center;';
  const tiers = ['low','mid','high','veryhigh','ultra'];
  const types = ['Fire','Water','Grass','Electric','Ground','Flying','Physical','Ghost','Psychic'];
  ov.innerHTML = `<div style="background:var(--paper);border-radius:18px 18px 0 0;padding:18px;max-width:480px;width:100%;max-height:82vh;overflow-y:auto;">
    <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:18px;margin-bottom:4px;">Test any move</div>
    <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-bottom:12px;">No spelling — fires at full power instantly.</div>
    <div style="font-weight:800;font-size:12px;margin-bottom:6px;">${escapeHtml(displayName(mon))}'s own moves</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
      ${base.map((mv,i)=>`<button class="mini-btn am-own" data-i="${i}" style="min-width:0;">${escapeHtml(mv.name)}<br><span style="font-size:10px;color:var(--ink-soft);">${mv.slot}</span></button>`).join('')}
    </div>
    <div style="font-weight:800;font-size:12px;margin-bottom:6px;">Any stone move</div>
    <select id="amType" style="width:100%;padding:9px;border-radius:9px;border:2px solid var(--line);background:#fff9ec;font-weight:700;margin-bottom:8px;">
      ${types.map(t=>`<option value="${t}">${t}</option>`).join('')}
    </select>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${tiers.map(t=>`<button class="mini-btn am-stone" data-t="${t}" style="min-width:0;">${stoneTierDef(t).label}</button>`).join('')}
    </div>
    <button class="btn btn-ghost" id="amCancel" style="margin-top:14px;">Cancel</button>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#amCancel').addEventListener('click', close);
  ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
  ov.querySelectorAll('.am-own').forEach(b=>b.addEventListener('click', ()=>{
    close(); arenaFire(base[+b.dataset.i]);
  }));
  ov.querySelectorAll('.am-stone').forEach(b=>b.addEventListener('click', ()=>{
    const type = ov.querySelector('#amType').value;
    const tierId = b.dataset.t;
    const t = stoneTierDef(tierId);
    close();
    arenaFire({ slot: tierId==='ultra'?'UltraStone':'Basic', name:stoneName(type,tierId), mult:t.mult,
      target: tierId==='ultra'?'MultiHit':(t.kind==='multi2'?'Multi2':(t.kind==='status'?'Status':'Single')),
      words:t.words, unlock:0, available:true, isStone:true, stoneTier:tierId, stoneType:type });
  }));
}

/* fire a move in arena mode: auto full-success, no quiz */
function arenaFire(mv){
  /* a test move is an action of its own, like a chosen one (their Counter and
     Mirage read actions) */
  if(ui.battle){ ui.battle.actionSeq = (ui.battle.actionSeq || 0) + 1; ui.battle.actionMon = activeMon(); ui.battle.actionDodges = []; }
  const full = Array.from({length:Math.ceil(mv.words/2)}, ()=>({ text:'测试', passed:true, words:2 }));
  const needTarget = (mv.target==='Single') || (mv.target==='Status' && STATUS_NEEDS_TARGET.includes(mv.stoneType));
  if(needTarget && livingEnemies().length>1){
    promptTarget(mv, (t)=> resolveBattleMove(mv, t, full));
    return;
  }
  const target = needTarget ? livingEnemies()[0] : null;
  resolveBattleMove(mv, target, full);
}

/* ============================================================
   THE CHALLENGERS (3.11)
   The designer: "please adapt the test arena to feature all different
   challengers across the regions with their level-specific monsters and
   special conditions e.g. padrino and figlio go first, etc. this will let me
   test the battles without completing the earlier parts. keep the incomplete
   ones like psychic disciples and master out"
   Every trainer and boss of the five regions, fought as the story fights
   them: the same waves, levels, AI, stones, crowns and conditions, built by
   the very functions the story calls (dojoStageBattle, figlioBattle,
   rosterBattle, …), so the two cannot drift apart. Nothing that happens
   AFTER a story fight comes with it — no XP, no tokens, no prizes, no
   catching, no progress, nothing marked seen in the dex (b.arenaChallenge,
   04-battle.js / 05-battle-flow.js). The party goes in at full health and
   comes back exactly as it went in (state.arenaRestore — even if the app is
   closed mid-fight: normalizeProfile puts it back). Spell as in the story,
   or 🧪 Test move to skip the words; 🚪 Exit leaves at any time.
   Left out: the Monkey King's one-turn scripted loss, and wild encounters.
   (3.16) The Psychic Disciples and the Psychic Master are finished — "please
   finish the psychic disciples and master. Give them good AI" — and in.
   ============================================================ */
const ARENA_REGIONS = ['Riverside Meadow', 'Emerald March', 'Port Akrotiri', 'The North Sea', 'Cosa Nostia'];
/* The catacomb floors and rooms whose men fight you, in the order you come to them. */
const ARENA_R5_DECKS = ['cata_landing', 'cata_cistern', 'cata_stair',
  'cata_landing_r1', 'cata_landing_r2', 'cata_cistern_r1', 'cata_cistern_r2',
  'cata_bones_r1', 'cata_bones_r2', 'cata_stair_r1', 'cata_stair_r2',
  'cata_quarry', 'cata_cellars', 'cata_pit'];
/* The tower's floors: the Ghost Disciples' and (3.16) the Psychic
   Disciples' — the Psychic Master's (12) and the Ghost Master's (13) are
   cards of their own. */
const ARENA_GHOST_FLOORS = [1, 3, 5, 7, 9, 11];
const ARENA_PSYCHIC_FLOORS = [2, 4, 6, 8, 10];

/* Every challenger: { region, id, label, npc | mon, icon, note, variants:
   [{ label, npc, build }] } — a card each, and a choice inside it where there
   are several of a kind. `note` is a string, or a function of the variant. */
function arenaChallengers(){
  const L = [];
  const V = (build, label, npc)=> ({ build, label:label || null, npc:npc || null });
  const add = (region, id, label, pic, icon, variants, note)=> L.push(Object.assign({ region, id, label, icon, variants, note:note || '' }, pic));
  const N = id=> ({ npc:id }), M = (sp, crowned)=> ({ mon:sp, crowned:!!crowned });

  /* ---- 1. Riverside Meadow ---- */
  add(1, 'r1_dojo', 'Rock Dojo', N('guardian'), '🏯', DOJO_STAGES.map(st=> V(()=> dojoStageBattle(st), st.label, st.id)),
    'In the story the three are fought in this order.');
  add(1, 'r1_jax', 'Jax', N('rival'), '🥊', [V(()=> rivalR1Battle())],
    'His last monster is always the starter that beats yours.');
  add(1, 'r1_thugs', 'Thugs', N('thug1'), '👊', THUG_ORDER.map((id, i)=> V(()=> thugBattle(id), `Thug ${i + 1}`, id)));
  add(1, 'r1_boss', 'Thug Boss', N('thug_boss'), '🔑', [V(()=> thugBossBattle())]);

  /* ---- 2. Emerald March ---- */
  add(2, 'r2_guardian', 'The Forest Guardian', M('forest_fairy', true), '🌳', [V(()=> guardianTrialBattle())],
    'The end of the Sacred Grove\'s trial of courage. She uses Giga Drain every turn, healing as she hits. In the story you may run from her, but she recovers fully.');
  add(2, 'r2_water', 'Water Dojo', N('water_master'), '🌊', WATER_DOJO_STAGES.map(st=> V(()=> waterStageBattle(st), st.label, st.id)),
    'In the story the four are fought in this order.');
  add(2, 'r2_jax', 'Jax', N('rival'), '🥊', [V(()=> rivalR2Battle())],
    'His Eagle climbs for Piercing Stoop — harder to hit each turn it climbs, up to 3 — and his last monster is the starter that beats yours.');
  add(2, 'r2_soldatos', 'Soldatos', N('soldato1'), '🕴️', [V(()=> mafiaBattle(MAFIA.soldato1), 'Soldato (the first stretch)', 'soldato1'),
    V(()=> mafiaBattle(MAFIA.soldato2), 'Soldato (further in)', 'soldato2')], 'The Rocky Caverns\' soldatos, as you meet them on the paths.');
  add(2, 'r2_capo_black', 'Black Capo', N('capo_black'), '🕴️', [V(()=> mafiaBattle(MAFIA.capo_black))]);
  add(2, 'r2_capo_purple', 'Purple Capo', N('capo_purple'), '🕴️', [V(()=> mafiaBattle(MAFIA.capo_purple))]);
  add(2, 'r2_padrino', 'Don Padrino', N('padrino'), '🕴️', [V(()=> padrinoR2Battle())],
    'The disused path. In the story you are meant to lose: your team falls and the Sacred Seed answers. Here it is an ordinary fight. His Water Dragon charges Cataclysm for three turns, then Hyperbeam.');
  add(2, 'r2_ride', 'Sottocapo — the dragon ride', N('sottocapo'), '🐉', [V(()=> dragonRideBattle())],
    'Straight after the Padrino in the story. You ride his Water Dragon (crowned, Lv 100): one button — Unleash Max, then Hyperbeam Max on the last wave — and no spelling.');
  add(2, 'r2_stand', 'Don Padrino — the last stand', N('padrino'), '🐉', [V(()=> lastStandBattle())],
    'Still on the dragon, which cannot fall here: one button, Dragon Legacy.');

  /* ---- 3. Port Akrotiri ---- */
  add(3, 'r3_sailors', 'Sailors (the concert)', N('sailor1'), '⚓', [1, 2, 3, 4, 5].map(n=> V(()=> sailorBattle(n), `Sailor ${n}`, 'sailor' + n)),
    'The fans crowding the stage before the band competition. Sailor 5 waits for the other four.');
  add(3, 'r3_band', 'The Electric Dojo band', N('electric_master'), '🎸', ELECTRIC_BAND.map((m, i)=> V(()=> bandBattle(i),
    m.label === 'Electric Master' ? 'Djenta, the Electric Master' : `${m.label} ${i + 1}`, m.id)),
    'In the story all five are fought back to back, with no healing between them.');
  add(3, 'r3_performers', 'Performers (the losing acts)', N('failstar1'), '🎤', FAILSTARS.map((f, i)=> V(()=> failstarBattle(i), `Performer ${i + 1} · ${f.zone}`, f.id)),
    `Each brings one monster at a time from a place you passed through, all Lv ${FAILSTAR_LV}.`);
  add(3, 'r3_figlio', 'Figlio', N('figlio'), '🎙️', [V(()=> figlioBattle())],
    ()=> `His team is a level higher for every time you have beaten him at the concert, up to +20 — <b>+${Math.min(figlioBonus(), 20)}</b> on this profile.`);
  add(3, 'r3_siblings', 'Electric Siblings', N('electric_new_master1'), '⚡', teamRoster('electric').map((m, i)=> V(()=> teamMemberBattle('electric', i), `Electric Sibling ${i + 1}`, m.id)),
    'The three who want to keep the Dojo electric. In the story, all three back to back with no healing.');
  add(3, 'r3_sage', 'Sage Disciples', N('physical_disciple1'), '🥋', teamRoster('sage').map((m, i)=> V(()=> teamMemberBattle('sage', i), `Sage Disciple ${i + 1}`, m.id)),
    'Sent by the Great Sage dojo for the empty hall. In the story, all three back to back with no healing.');
  add(3, 'r3_ankylo', 'The Ankylosaurus', M('ankylosaurus'), '🦕', [V(()=> ankyloBattle())],
    'At the geothermal plant: toads first, then the Ankylosaurus between two more. It opens with Steel Soul (a quick cast, once a fight), then swings its Max. In the story every refusal adds a wave of toads.');

  /* ---- 4. The North Sea ---- */
  add(4, 'r4_divers', 'Divers', N('diver1'), '🤿', DIVERS.map((d, i)=> V(()=> diverBattle(i), crewName(d.id), d.id)),
    'Their first two waves are a random catch from the deep.');
  add(4, 'r4_sailors', 'Sailors (the crew hunt)', N('sailor1'), '⚓', [1, 2, 3, 4, 5].map(n=> V(()=> crewBattle('sailor' + n), crewName('sailor' + n), 'sailor' + n)),
    'Their concert teams again, with three of the rail\'s birds in front — Sailor 5 already fields six waves, so his comes as it was.');
  add(4, 'r4_cook', crewName('cook'), N('cook'), '🍳', [V(()=> crewBattle('cook'))]);
  add(4, 'r4_captain', crewName('ship_captain'), N('ship_captain'), '⚓', [V(()=> crewBattle('ship_captain'))],
    'Full-grown crew monsters; only his last, an Otter, is crowned.');
  add(4, 'r4_keeper', crewName('shipkeeper'), N('shipkeeper'), '🧰', [V(()=> crewBattle('shipkeeper'))],
    'Full-grown crew monsters; only his last, a Loong, is crowned.');
  add(4, 'r4_jax', 'Jax', N('rival'), '🥊', [V(()=> rivalR4Battle())],
    'Five borrowed monsters; four of them carry a Very High stone. In the story it is a wager: stones on the table.');
  add(4, 'r4_scientists', 'Scientists', N('scientist1'), '🧑‍🔬', SCI.map(d=> V(()=> scientistBattle(d.n), crewName('scientist' + d.n), 'scientist' + d.n)),
    'Tested one by one in the investigation.');
  add(4, 'r4_mireille', crewName('scientist6'), N('scientist6'), '🧑‍🔬', [V(()=> culpritBattle(0))],
    'Named as the culprit. In the story the supervisor steps up straight after her, with no healing.');
  add(4, 'r4_barnaby', crewName('scientist_supervisor'), N('scientist_supervisor'), '🧑‍🔬', [V(()=> culpritBattle(1))],
    'Straight after Mireille in the story; his last, a Ninja, is crowned.');
  add(4, 'r4_nine', crewName('scientist9') + ' (daily)', N('scientist9'), '🧑‍🔬', [V(()=> nineDailyBattle())],
    'Her standing invitation, once a day, after the case is closed.');
  add(4, 'r4_wall', 'The whale wall', M('whale'), '🐋', [V(()=> whaleWallBattle(true))],
    ()=> `Six waves of three enraged whales. Their level follows your best monster, 66 to 80 — <b>Lv ${r4Level()}</b> on this profile.`);

  /* ---- 5. Cosa Nostia ---- */
  add(5, 'r5_gate', 'Soldato at the sea cave', N('soldato1'), '💂', [V(()=> r5GateBattle())],
    'The only way into the catacombs is past him.');
  ARENA_R5_DECKS.forEach(id=>{
    const d = R5_DECKS[id];
    const gs = ((d && d.stealth && d.stealth.guards) || []).filter(g=> g.roster && R5_ROSTERS[g.roster] && g.kind !== 'capo');
    if(!gs.length) return;
    const lookouts = gs.filter(g=> g.kind === 'lookout').length;
    add(5, 'r5_' + id, d.title, N('soldato1'), '💂', gs.map(g=> V(()=> rosterBattle(R5_ROSTERS[g.roster], guardSprite(g)),
      g.kind === 'lookout' ? 'Lookout' + (lookouts > 1 ? ' ' + g.id.toUpperCase() : '') : 'Soldato ' + g.id.toUpperCase(), guardSprite(g))),
      d.tier === 2 ? 'Under the Old Town: the Family\'s pit-fighters.' : (d.room ? 'A side room.' : ''));
  });
  add(5, 'r5_capo_black', 'Black Capo', N('capo_black'), '🕴️', [V(()=> rosterBattle(R5_ROSTERS.capo_black, 'capo_black'))],
    'On the Cistern\'s bridge.');
  add(5, 'r5_capo_purple', 'Purple Capo', N('capo_purple'), '🕴️', [V(()=> rosterBattle(R5_ROSTERS.capo_purple, 'capo_purple'))],
    'At the top of the Long Stair.');
  add(5, 'r5_consigliere', 'The Consigliere', N('consigliere'), '🕴️', [V(()=> rosterBattle(R5_ROSTERS.consigliere, 'consigliere'))],
    'The master of the Fight Pit.');
  add(5, 'r5_figlio', 'Figlio (the opera)', N('figlio'), '🎙️', [V(()=> r5FiglioBattle())],
    ()=> `His team starts at Lv 94 and is a level higher for every win at the opera, up to 100 — <b>Lv ${r5FiglioLv(0)}–${r5FiglioLv(5)}</b> on this profile.`);
  add(5, 'r5_sotto', 'Sottocapo (the villa door)', N('sottocapo'), '🕴️', [V(()=> r5SottoBattle())],
    ()=> `Six waves at Lv ${R5_SOTTO_LV}: his best, crowned, one in the middle of each (the last his Lizardape), ` +
         `with one of the hill's strong Ghosts and one of its Psychics either side.`);
  add(5, 'r5_disciples', 'Ghost Disciples (the tower)', N('ghost_disciple1'), '👻', ARENA_GHOST_FLOORS.map(n=> V(()=> r5TowerBattle(n), `Floor ${n}`, R5_TOWER[n - 1].sprite)),
    v=> r5TowerNote(+v.label.replace(/\D/g, '')));
  add(5, 'r5_psy_disciples', 'Psychic Disciples (the tower)', N('psychic_disciple1'), '🔮', ARENA_PSYCHIC_FLOORS.map(n=> V(()=> r5TowerBattle(n), `Floor ${n}`, R5_TOWER[n - 1].sprite)),
    v=> r5TowerNote(+v.label.replace(/\D/g, '')));
  add(5, 'r5_psychic_master', 'The Psychic Master', N('psychic_master'), '🔮', [V(()=> r5TowerBattle(12))],
    ()=> r5TowerNote(12));
  add(5, 'r5_ghost_master', 'The Ghost Master', N('ghost_master'), '👻', [V(()=> r5TowerBattle(13))],
    ()=> r5TowerNote(13));
  /* (3.18, 3.19) under the villa: Jax at the vault's door, and the vault itself */
  add(5, 'r5_jax', 'Jax (the vault door)', N('rival_padrino'), '🧑', [V(()=> r5JaxBattle())], ()=> r5JaxNote());
  add(5, 'r5_vault', 'Don Padrino — the vault', N('padrino2'), '⏳', [V(()=> r5ClimaxBattle({ arena:true }))],
    ()=> `The climax: his Rhino, Fox, Shadow, Jackal and Raven, crowned at ${R5_VAULT_LV} with 10 protein, each in the middle of a wave with two of the Family's strongest ` +
         `(his Mindcat and Lizardape crowned too), then Cyborg at ${R5_VAULT_CYBORG} — three times, ` +
         `Cyborg turning back time between. The <b>Monkey King</b> fights at your side with every stone you hold (and his own Physical Stone), ` +
         `casting before you move; after the third round, Heavensplitter Max breaks Cyborg, and you clear its bar to 1 HP. ` +
         `Here he says each stone's line every time.`);
  add(5, 'r5_past', 'Don Padrino — the past', N('padrino2'), '🌀', [V(()=> tearRoundBattle())],
    ()=> `One round of the space-time tear's seven: his five, crowned, at your best monster's level or ${TEAR.floor} — <b>Lv ${tearFoeLevel()}</b> on this profile — then Cyborg at ${TEAR.cyborgLevel}. ` +
         `Cyborg's Futuresight dodges half of every attack, and each dodge is a Spacetime Fracture: its Spacetime Rift Max hits 1.1× harder for every one. ` +
         `Its Organosteel Body arrives behind 3 shields and raises 1 more every turn, each soaking up to <b>${tearCyborgShield()}</b> of a strike: no Diamond Dust touches them; a Dragon Dance breaks 1 / 2 / 3 with each attack. ` +
         `In the tear it rewinds them and the round begins again, and every quiz asks for silver and gold words; here the one round is the fight, with your usual words.`);
  return L;
}

/* A wave spec's level as the fight will have it: none of theirs past 100,
   but Cyborg and anything told otherwise (makeEnemy). */
function arenaSpecLevel(s){
  return (s.anyLevel || (SPECIES[s.species] || {}).noLevelCap) ? s.level : Math.min(s.level, ENEMY_LEVEL_CAP);
}
function arenaSummary(cfg){
  const all = cfg.waves.flat(), lv = all.map(arenaSpecLevel);
  const lo = Math.min(...lv), hi = Math.max(...lv);
  const n = (k, w)=> `${k} ${w}${k === 1 ? '' : 's'}`;
  return `${n(cfg.waves.length, 'wave')} · ${n(all.length, 'monster')} · Lv ${lo === hi ? lo : lo + '–' + hi}`;
}
/* The short marks on a card. */
function arenaTags(cfg){
  const all = cfg.waves.flat(), t = [];
  if(cfg.figlio || cfg.alwaysFirst || cfg.enemiesFirst) t.push('⚡ moves first');
  if(cfg.catacomb) t.push('👻 lurking ghosts');
  if(cfg.scriptedAlly) t.push('🐉 you ride the dragon');
  if(cfg.ally) t.push('🐒 an ally fights with you');
  if(all.some(s=> s.veryHigh)) t.push('💎 stones');
  if(all.some(s=> s.enraged)) t.push('🐋 enraged');
  if(all.some(s=> s.crowned)) t.push('✦ crowned');
  return t;
}
/* A carried or cast Very High stone of theirs, in plain words. */
function arenaStoneLine(s){
  const vh = s.veryHigh, plus = vh.plus || 0, d = veryHighDef(vh.type, plus);
  if(!d) return '';
  const who = escapeHtml(SPECIES[s.species].name), name = d.name + UPGRADE_MARKS[plus];
  if(vh.cast) return `💎 <b>${who}: ${name}</b>, cast on its first action — the mirror of yours.`;
  const what = {
    Fire:   ()=> `it deals <b>${d.deal}×</b> and takes <b>${d.take}×</b>`,
    /* Laid as a wave arrives, before its first round, it runs that round and
       five more — as yours does when your carrier starts the fight. */
    Dragon: ()=> `it deals <b>${d.deal}×</b>` + (d.strip ? ` and breaks <b>${d.strip}</b> of your shields before each of its attacks hits` : '') + (d.mach
      ? `, and from the moment it arrives their side has <b>Mach Dragon${d.mach > 1 ? ' ✦' : ''}</b> for <b>${(d.turns || 5) + 1} rounds</b>: they move before you ` +
        `unless a monster of yours on the field carries Dragon Dance ${d.mach > 1 ? '✦' : '+ or ✦'} — or a Diamond Dust of yours sweeps it away`
      : ''),
    Steel:  ()=> `it takes <b>${Math.round(d.reduce * 100)}% less</b>` + (((d.block || 0) + (d.passiveBlock || 0)) ? ` and starts with <b>${(d.block || 0) + (d.passiveBlock || 0)} block</b>` : ''),
    Flying: ()=> `nothing touches it on its first turn, and it dodges <b>${Math.round((d.after || 0.15) * 100)}%</b> after`,
    Fairy:  ()=> `Diamond Dust: your effects are swept away, and nothing of yours takes hold for ${d.turns || 5} turns — but your shields stand, and still form`,
  }[vh.type];
  return `💎 <b>${who}: ${name}</b>, carried — ${what ? what() : 'in effect from the moment it arrives'}.`;
}
/* The conditions a fight is fought under, in full. */
function arenaConditions(cfg){
  const all = cfg.waves.flat(), out = [];
  const head = `unless a monster of yours has a Mach Dragon, or a first-strike passive such as Lightning Cat (a tie goes to you)`;
  if(cfg.figlio) out.push(`⚡ <b>He leads every round</b>: his monster moves before yours — ${head}.`);
  else if(cfg.alwaysFirst || cfg.enemiesFirst) out.push(`⚡ <b>They move first every round</b> — ${head}.`);
  if(cfg.catacomb) out.push(`👻 <b>Every Ghost of theirs arrives Lurking</b>: every attack misses it until it tries to deal damage (a mind-read or a Grudge still lands).`);
  if(cfg.scriptedAlly) out.push(`🐉 <b>You ride a crowned Lv ${cfg.allyLevel || 100} Water Dragon</b>: your team steps aside, one button, no spelling` +
    (cfg.allyUnkillable ? ` — and it cannot fall.` : `.`));
  if(cfg.ally) out.push(`🐒 <b>${escapeHtml(cfg.ally.name || 'An ally')} (Lv ${cfg.ally.level || 100}) fights at your side</b>: he casts his stones before your turn, ` +
    `then strikes right after you — no spelling for him, and their blows never reach him.`);
  all.filter(s=> s.veryHigh).forEach(s=> out.push(arenaStoneLine(s)));
  if(all.some(s=> s.enraged)) out.push(`🐋 <b>Enraged</b>: they deal <b>25% more</b>, take <b>25% less</b>, and use Depth Charge every turn.`);
  if(cfg.noFlee) out.push(`🚫 <b>No running</b> in the story. Here 🚪 Exit always takes you out.`);
  return out;
}
/* One of theirs, as the wave list shows it. */
function arenaSpecChip(s){
  const e = makeEnemy(s.species, s.level, { nerfed:s.nerfed, crowned:s.crowned, forceStage:s.forceStage, anyLevel:s.anyLevel, supplements:s.supplements });
  return `<span class="arc-mon">${monPortrait(s.species, 26, { stage:e.stage, crowned:!!s.crowned })}<span>${escapeHtml(SPECIES[s.species].name)} ` +
    `<small>Lv ${e.level}</small>${s.crowned ? ' ✦' : ''}${s.veryHigh ? ' 💎' : ''}${s.enraged ? ' 🐋' : ''}</span></span>`;
}
function arenaPicture(x, v, px){
  if(x.mon) return monPortrait(x.mon, px, { view:'front', bare:true, crowned:!!x.crowned });
  return npcPortrait((v && v.npc) || x.npc, x.icon, px, 'transparent');
}
function arenaNote(x, v){ return typeof x.note === 'function' ? x.note(v) : x.note; }

function arenaChallengeCss(){
  if(document.getElementById('arenaChallengeCss')) return;
  const st = document.createElement('style');
  st.id = 'arenaChallengeCss';
  st.textContent = `
    .arc-regions{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 14px;}
    .arc-regions .pill{margin:0;font-size:12px;padding:8px 11px;}
    .arc-card .cc-title{font-size:16px;}
    .arc-n{font-size:12px;color:var(--ink-soft);font-weight:800;}
    .arc-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;}
    .arc-tag{font-size:10.5px;font-weight:800;background:var(--paper-3);border-radius:20px;padding:2px 8px;}
    .arc-sheet{max-height:88vh;overflow-y:auto;max-width:420px;}
    .arc-sheet .ar-select{margin-top:8px;}
    .arc-waves{text-align:left;margin:10px 0 14px;}
    .arc-wave{font-size:12px;padding:7px 0;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:5px 12px;align-items:center;}
    .arc-wave > b{width:100%;font-size:10.5px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;}
    .arc-mon{display:inline-flex;align-items:center;gap:5px;font-weight:700;}
    .arc-mon small{color:var(--ink-soft);font-weight:800;}
  `;
  document.head.appendChild(st);
}

function renderArenaChallengers(){
  arenaChallengeCss();
  const c = arenaCfg();
  if(!(c.region >= 1 && c.region <= ARENA_REGIONS.length)) c.region = 1;
  const list = arenaChallengers().filter(x=> x.region === c.region);
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">Test Arena</div>
    ${arenaTabs(c)}
    <div class="screen-sub">Every trainer and boss, fought as the story fights them. Your party goes in at full health and comes out
      exactly as it went in — no XP, no prizes, and nothing in the story changes.</div>
    <div class="arc-regions">${ARENA_REGIONS.map((n, i)=>
      `<button class="btn btn-ghost pill arc-reg ${c.region === i + 1 ? 'sel' : ''}" data-reg="${i + 1}">${i + 1} · ${escapeHtml(n)}</button>`).join('')}</div>
    ${list.map(x=>{
      const cfg = x.variants[0].build();
      const tags = arenaTags(cfg);
      return `<div class="challenge-card arc-card" data-arc="${x.id}">
        ${arenaPicture(x, x.variants.length > 1 ? null : x.variants[0], 50)}
        <div style="flex:1;min-width:0;">
          <div class="cc-title">${escapeHtml(x.label)}${x.variants.length > 1 ? ` <span class="arc-n">· ${x.variants.length}</span>` : ''}</div>
          <div class="cc-desc">${x.variants.length > 1 ? 'From ' : ''}${arenaSummary(cfg)}</div>
          ${tags.length ? `<div class="arc-tags">${tags.map(t=> `<span class="arc-tag">${t}</span>`).join('')}</div>` : ''}
        </div>
      </div>`;
    }).join('')}`;
  $('#backBtn').addEventListener('click', ()=> go(ui.prevScreen || 'home'));
  wireArenaTabs(c);
  screenEl.querySelectorAll('.arc-reg').forEach(b=> b.addEventListener('click', ()=>{ c.region = +b.dataset.reg; renderArena(); window.scrollTo(0, 0); }));
  screenEl.querySelectorAll('[data-arc]').forEach(el=> el.addEventListener('click', ()=>{
    const x = list.find(y=> y.id === el.dataset.arc);
    if(x) openArenaChallenger(x, 0);
  }));
}

/* What you are about to face: every wave, every level, and the conditions. */
function openArenaChallenger(x, vi){
  const v = x.variants[vi] || x.variants[0];
  const cfg = v.build();                       // built once: what you see is what you fight
  const note = arenaNote(x, v);
  const conds = arenaConditions(cfg);
  const ov = document.createElement('div');
  ov.className = 'refine-scrim arc-scrim';
  ov.innerHTML = `
    <div class="refine-card arc-sheet">
      ${arenaPicture(x, v, 84)}
      <div class="refine-name">${escapeHtml(v.label || x.label)}</div>
      <div class="refine-sub">${escapeHtml(ARENA_REGIONS[x.region - 1])} · ${arenaSummary(cfg)}</div>
      ${x.variants.length > 1 ? `<select class="ar-select" id="arcVar">${x.variants.map((w, i)=>
        `<option value="${i}" ${i === vi ? 'selected' : ''}>${escapeHtml(w.label)}</option>`).join('')}</select>` : ''}
      ${(conds.length || note) ? `<div class="move-info-body">${conds.map(t=> `<p>${t}</p>`).join('')}${note ? `<p><i>${note}</i></p>` : ''}</div>` : ''}
      <div class="arc-waves">${cfg.waves.map((w, i)=> `<div class="arc-wave"><b>Wave ${i + 1}</b>${w.map(arenaSpecChip).join('')}</div>`).join('')}</div>
      <button class="btn btn-primary" id="arcGo">⚔️ Fight</button>
      <button class="btn btn-ghost" id="arcNo" style="margin-top:8px;">Back</button>
    </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) ov.parentNode.removeChild(ov); };
  ov.addEventListener('click', e=>{ if(e.target === ov) close(); });
  ov.querySelector('#arcNo').addEventListener('click', close);
  const sel = ov.querySelector('#arcVar');
  if(sel) sel.addEventListener('change', ()=>{ close(); openArenaChallenger(x, +sel.value); });
  ov.querySelector('#arcGo').addEventListener('click', ()=>{ close(); startArenaChallenge(x, v, cfg); });
}

/* In: the party healed for the fight, and written down as it was. */
function startArenaChallenge(x, v, cfg){
  if(activePool().length === 0){ ui.prevScreen = 'arena'; toast('No words selected, please select to proceed.'); return go('spelling'); }
  cfg = Object.assign({}, cfg || v.build());
  /* Nothing that hands the fight back to the story: what happens after it, a
     loss the story needs (the Padrino), the Grove's trial, the tear's rounds,
     the catching. */
  ['onWin', 'onLose', 'scriptedLoss', 'guardianTrial', 'tear', 'coreSpar', 'challenge', 'allowCatch'].forEach(k=> delete cfg[k]);
  arenaSnapshotParty();
  state.party.forEach(m=>{ m.currentHp = monMaxHp(m); });
  ui.arenaRun = { id:x.id, label:v.label || x.label, zone:ui.currentZone || null };
  ui.currentZone = null;                       // its own backdrop, or the plain one
  beginBattle(Object.assign(cfg, { arenaChallenge:x.id, onWin: ()=> arenaChallengeOver('won') }));
}
function arenaSnapshotParty(){
  const hp = {};
  state.party.concat(state.storage || []).forEach(m=>{ if(m && m.uid) hp[m.uid] = m.currentHp; });
  state.arenaRestore = { hp };
  saveProfile();
}
function arenaRestoreParty(){
  const r = state.arenaRestore;
  if(!r) return;
  const hp = r.hp || {};
  state.party.concat(state.storage || []).forEach(m=>{
    if(m && m.uid && Object.prototype.hasOwnProperty.call(hp, m.uid)) m.currentHp = hp[m.uid];
  });
  delete state.arenaRestore;
  saveProfile();
}
/* Out: won, lost or left — the borrowed dragon handed back, the party as it
   went in, and back to the arena. Once only: the fight keeps its mark, so a
   late call (a defeat noticed twice) comes here again and does nothing, and
   never reaches the story's own ending. */
function arenaChallengeOver(result){
  const run = ui.arenaRun;
  if(!run) return;
  ui.arenaRun = null;
  restoreRealParty();
  arenaRestoreParty();
  if(run.zone) ui.currentZone = run.zone;
  ui.arenaUnlocked = true;
  stopMusic();
  if(result === 'left'){ toast('Left the fight — your party is back as it went in.'); return go('arena'); }
  go('arena');                                 // off the battle screen for good, then the result over it
  challengeResult(result === 'won' ? '🏆' : '💀', result === 'won' ? `${run.label} beaten` : `Lost to ${run.label}`,
    `A test fight: no XP, no prizes, and nothing in the story has changed.<br><br>Your party is back exactly as it went in.`, 'arena');
}


