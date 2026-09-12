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
  setScreenBg('recover');
  $('#brandSub').textContent = 'Recover';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Region</button>
    <div class="screen-title">Recover</div>
    <div class="screen-sub">Heal your team by revising words. Recently-missed words come first.</div>
    ${renderPartyHpCard()}
    <button class="btn btn-jade" id="startBtn" style="margin-top:16px;">💧 Start recovering</button>
    <button class="btn btn-ghost" id="backBtn2" style="margin-top:10px;">Back to region</button>
  `;
  $('#backBtn').addEventListener('click', ()=>go('region'));
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
  // NPC fights are worth 2 fights' XP per wave (e.g. the 5-wave Rival = 10)
  const waves = Array.isArray(b.waves) ? b.waves.length : 1;
  const levelUps = awardXpToParty(waves * 2);
  const tokens = rollTokenDrop();
  saveProfile();
  if(tokens) toast('🎫 You found a Skill Token!');
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

function startDojoStage(stage){
  if(!ensurePool()) return;
  beginBattle({ isNpc:true, name:stage.label, npcId:stage.id,
    waves: stage.waves.map(w=>w.map(e=>({...e, ai:stage.ai, nerfed:false}))),
    onWin:()=>onDojoStageWin(stage) });
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
    if(state.party.length<6) state.party.push(gift); else state.storage.push(gift);
    if(!state.caughtSpecies.includes('ground_starter')) state.caughtSpecies.push('ground_starter');
    if(!state.encounteredSpecies.includes('ground_starter')) state.encounteredSpecies.push('ground_starter');
  }
  await saveProfile();
  challengeResult('🏯','The Dojo is yours!',
    `The Guardian bows. "You've earned my respect, ${escapeHtml(state.name)}. The road to Region 2 is open."` + (already?'':' She hands you a <b>Rock Rhino</b> (Lv 15) as a token.'),
    'challenge');
}

/* Rival — one-time, rewards protein */
function startRival(){
  if(!ensurePool()) return;
  const eff = effectiveStarter();
  beginBattle({ isNpc:true, name:'Rival', npcId:'rival',
    waves:[
      [{species:'rat',level:21,ai:'best',nerfed:false}],
      [{species:'bird',level:21,ai:'best',nerfed:false}],
      [{species:'moth',level:21,ai:'best',nerfed:false}],
      [{species:'electric_starter',level:21,ai:'best',nerfed:false}],
      [{species:eff,level:21,ai:'best',nerfed:false}],
    ],
    onWin:onRivalWin });
}
async function onRivalWin(){
  const first = !state.progress.region1.rivalCleared;
  state.progress.region1.rivalCleared = true;
  if(first) state.inventory.protein += 3;
  await saveProfile();
  challengeResult('🏆','Rival defeated!',
    first ? 'Your rival grins. "Not bad! Here, take these — you earned them." You received <b>3 Protein Supplements</b>!' :
            'Your rival is out of rewards to give, but the win still felt good.',
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
function startThug(id){
  const d = THUG_DEF[id];
  beginBattle({ isNpc:true, name:'Thug', noFlee:true, npcId:id,
    waves: d.waves.map(w=>w.map(e=>({...e, ai:'power1', nerfed:false}))),
    onWin:()=>onThugWin(id) });
}
async function onThugWin(id){
  if(!state.progress.region1.thugsCleared.includes(id)) state.progress.region1.thugsCleared.push(id);
  await saveProfile();
  const left = THUG_ORDER.filter(t=>!state.progress.region1.thugsCleared.includes(t)).length;
  challengeResult('👊','Thug beaten!',
    left>0 ? `You scattered the thug. ${left} more still lurk in the area…` : 'That was the last of the small fry — their boss must be near.',
    'challenge');
}
function startThugBoss(){
  beginBattle({ isNpc:true, name:'Thug Boss', noFlee:true, npcId:'thug_boss',
    waves:[
      [{species:'rat',level:20,ai:'best',nerfed:false},{species:'bird',level:20,ai:'best',nerfed:false},{species:'moth',level:20,ai:'best',nerfed:false}],
      [{species:'ground_starter',level:35,ai:'best',nerfed:false}],
    ],
    onWin:onThugBossWin });
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
        <div class="cc-title">Rival ${r1.rivalCleared?'<span class="clear-tag">Cleared</span>':''}</div>
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
  $('#cRival').addEventListener('click', ()=>{ if(state.progress.region1.rivalCleared){ toast('You already beat your rival.'); } else startRival(); });
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

function renderArena(){
  $('#brandSub').textContent = 'Test Arena';
  const all = [...state.party, ...state.storage];
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">Test Arena</div>
    <div class="screen-sub">No spelling required. Every move unlocked. Dummies have ${ARENA_DUMMY_HP} HP and respawn forever.</div>

    <div class="hp-card" style="margin-bottom:12px;">
      <div style="font-weight:800;font-size:13px;margin-bottom:8px;">Fighter</div>
      <select id="arenaMon" style="width:100%;padding:10px;border-radius:10px;border:2px solid var(--line);background:#fff9ec;font-family:'Nunito';font-weight:700;font-size:14px;">
        ${all.map((m,i)=>`<option value="${m.uid}">${escapeHtml(displayName(m))} · Lv ${m.level} · ${SPECIES[m.species].types.join('/')}</option>`).join('')}
      </select>
      <div style="font-weight:800;font-size:13px;margin:12px 0 8px;">Dummies</div>
      <div style="display:flex;gap:8px;">
        ${[1,2,3].map(n=>`<button class="btn btn-ghost pill arena-n ${n===1?'sel':''}" data-n="${n}" style="flex:1;">${n}</button>`).join('')}
      </div>
      <div style="font-weight:800;font-size:13px;margin:12px 0 8px;">Dummy type (for effectiveness tests)</div>
      <select id="arenaType" style="width:100%;padding:10px;border-radius:10px;border:2px solid var(--line);background:#fff9ec;font-family:'Nunito';font-weight:700;font-size:14px;">
        ${['Physical','Fire','Water','Grass','Electric','Flying','Ground','Ghost','Psychic'].map(t=>`<option value="${t}">${t}</option>`).join('')}
      </select>
    </div>

    <button class="btn btn-primary" id="arenaStart">⚔️ Enter Arena</button>
    <div class="phase-flag">Developer testing area.</div>
  `;
  $('#backBtn').addEventListener('click', ()=>go(ui.prevScreen||'home'));
  ui.arenaCount = ui.arenaCount || 1;
  screenEl.querySelectorAll('.arena-n').forEach(b=>b.addEventListener('click', ()=>{
    ui.arenaCount = +b.dataset.n;
    screenEl.querySelectorAll('.arena-n').forEach(x=>x.classList.toggle('sel', x===b));
  }));
  $('#arenaStart').addEventListener('click', ()=>{
    const uid = $('#arenaMon').value;
    startArena(uid, ui.arenaCount||1, $('#arenaType').value);
  });
}

function makeDummy(type){
  return {
    species:'rat', level:1, maxHp:ARENA_DUMMY_HP, hp:ARENA_DUMMY_HP, atk:10,
    move:['Basic','Test Jab',0.2,'Single',1,1],
    types:[type], stage:0, tier:'wild', ai:'basic', nerfed:true,
    isDummy:true, dummyType:type,
  };
}

function startArena(uid, count, type){
  const idx = state.party.findIndex(m=>m.uid===uid);
  if(idx<0){
    // pull the chosen monster out of storage into slot 0 for testing
    const si = state.storage.findIndex(m=>m.uid===uid);
    if(si>=0){ const [m]=state.storage.splice(si,1); state.party.unshift(m); saveProfile(); }
  }
  const ai = state.party.findIndex(m=>m.uid===uid);
  ui.battle = {
    waves:[[]], waveIndex:0, isNpc:false, allowCatch:false, name:'Test Arena',
    onWin:null, switchedThisTurn:false, busy:false, fightMistakes:[], phase:'player', wordCarry:0,
    partyStatus:{}, fieldStatus:{}, usedVeryHigh:{}, usedUltra:{},
    arena:true, arenaCount:count, arenaType:type,
  };
  ui.battle.enemies = Array.from({length:count}, ()=>makeDummy(type));
  ui.battle.activeIndex = ai>=0?ai:0;
  go('battle');
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
  const full = Array.from({length:Math.ceil(mv.words/2)}, ()=>({ text:'测试', passed:true, words:2 }));
  const needTarget = (mv.target==='Single') || (mv.target==='Status' && STATUS_NEEDS_TARGET.includes(mv.stoneType));
  if(needTarget && livingEnemies().length>1){
    promptTarget(mv, (t)=> resolveBattleMove(mv, t, full));
    return;
  }
  const target = needTarget ? livingEnemies()[0] : null;
  resolveBattleMove(mv, target, full);
}


