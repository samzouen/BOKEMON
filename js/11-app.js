/* ==========================================================
   11-app.js
   Zones, explore, spelling admin, settings, drawer, boot.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ---------- SCREEN: region select ---------- */
const REGIONS = [
  { id:1, name:'Riverside Meadow', desc:'Where your journey began.', unlocked:()=>true },
  { id:2, name:'Emerald March', desc:'Old woods, older rules.',
    unlocked:()=>!!(state.progress.region1||{}).guardianCleared },
  { id:3, name:'Port Akrotiri', desc:'Lava tubes, steam and salt air.',
    unlocked:()=>!!(state.progress.region2||{}).cavernDone },
  { id:4, name:'The North Sea', desc:'A working ship, and something under it.',
    unlocked:()=>!!(state.progress.region3||{}).shipPass },
];

function renderRegionSelect(){
  setScreenBg('home');
  $('#brandSub').textContent = 'Regions';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Home</button>
    <div class="screen-title">Where to?</div>
    <div class="screen-sub">Choose a region to travel to.</div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:14px;">
      ${REGIONS.map(r=>{
        const open = r.unlocked();
        const here = state.progress.currentRegion===r.id;
        return `<div class="region-card ${open?'':'locked'}" ${open?`data-region="${r.id}"`:''}>
          <div class="region-num ${open?'':'dim'}">${r.id}</div>
          <div class="region-info" style="flex:1;">
            <h3>${escapeHtml(r.name)}${here?' <span class="clear-tag">You are here</span>':''}</h3>
            <p>${open?escapeHtml(r.desc):'🔒 Locked'}</p>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('home'));
  screenEl.querySelectorAll('[data-region]').forEach(c=>c.addEventListener('click', async ()=>{
    state.progress.currentRegion = +c.dataset.region;
    await saveProfile();
    go('region');
  }));
}

/* ---------- SCREEN: a single zone ---------- */
function renderZone(){
  const z = ui.currentZone;
  if(!z) return go('explore');
  // Rocky Caverns shows its three paths until they're all walked, then settles
  // into a normal explorable zone.
  if(z.id === 'rocky_caverns' && !cavernsComplete()) return renderCaverns();
  if(z.id === 'geothermal_plant') return renderPlant();
  /* picked off the Explore screen: start at the companionway */
  if(z.id === 'weather_deck')       { ui.walkFresh = true; return renderWeatherDeck(); }
  if(z.id === 'cabin_deck')  { ui.walkFresh = true; return renderCabinDeck(); }
  if(z.id === 'laboratory_deck')  { ui.walkFresh = true; return renderLaboratoryDeck(); }
  if(z.id === 'plant_generator') return renderGenerator();
  if(z.id === 'vane_shear') return vaneShearClosed();
  return renderZonePlain();
}

function renderZonePlain(){
  const z = ui.currentZone;
  if(!z) return go('explore');
  if(isDev()) devShortcut();
  setScreenBg(z.id);          // zone art doubles as the backdrop
  setScreenBg(z.id);
  playMusicChain(['zone_'+z.id, 'region'+(state.progress.currentRegion||1), 'region']);
  document.body.classList.remove('zone-dark');
  document.body.classList.add('zone-tinted');
  $('#brandSub').textContent = z.name;
  const canFight = battleParty().some(m=>m.currentHp>0);
  const band = ZONE_LEVELS[z.id] || {min:5,max:21};
  const wilds = (ZONE_WILD[z.id]||[]).map(k=>SPECIES[k].name).join(' · ');
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="zone-hero">
      <img src="assets/zones/${z.id}.png" alt="" class="zone-hero-img" onerror="this.style.display='none'">
      <div class="zone-hero-name">${escapeHtml(z.name)}</div>
    </div>
    <div class="zone-facts">
      <div><b>Levels</b> ${band.min}–${band.max}</div>
      <div><b>Found here</b> ${escapeHtml(wilds||'—')}</div>
    </div>
    ${(state.progress.currentRegion===2 && z.id==='sacred_grove' && !(state.progress.region2||{}).trialDone) ? `
      <div class="trial-banner" style="margin-top:14px;">
        <b>The Trial of Courage</b>
        <div>Stand and fight — the Grove will not let a coward pass.</div>
        <div class="trial-bar"><span style="width:${Math.min(100,((state.progress.region2||{}).courage||0)/COURAGE_TARGET*100)}%"></span></div>
        <div class="trial-count">${(state.progress.region2||{}).courage||0} / ${COURAGE_TARGET} battles faced</div>
        ${inCourageGauntlet() ? `<div class="trial-warn">⚠️ The Grove tests you in earnest now. Flee and you fall back to ${COURAGE_FLEE_FALLBACK}.</div>` : ''}
      </div>` : ''}
    <button class="btn btn-primary" id="exploreBtn" style="margin-top:16px;" ${canFight?'':'disabled'}>
      ${canFight?'🌿 Explore':'💤 Your team needs healing'}
    </button>
    <button class="btn btn-ghost" id="returnBtn" style="margin-top:10px;">Return</button>
  `;
  $('#backBtn').addEventListener('click', ()=>go('explore'));
  $('#returnBtn').addEventListener('click', ()=>go('explore'));
  const eb = $('#exploreBtn');
  if(eb && canFight) eb.addEventListener('click', ()=>{
    if(monkeyEncounterDue()) return monkeyScene1();
    startWildEncounter();
  });
}

/* ---------- SCREEN: explore ---------- */
/* The player avatar is essentially only ever seen here, so it gets real
   presence — sized against the viewport but capped so the zone buttons below
   still fit on screen without scrolling. */
/* The avatar is the centrepiece of Explore, so it takes the lion's share of
   the space; the zone buttons sit beneath it as compact tiles. */
function exploreAvatarSize(){
  const h = window.innerHeight;
  const reserved = 70 + 34 + 130 + 60 + 40;      // chrome, back link, zone row, footer btn, padding
  const byH = h - reserved;
  const byW = battleWidth() * 0.86;
  return Math.round(Math.max(160, Math.min(byH, byW, 340)));
}

function renderExplore(){
  setScreenBg('explore');
  $('#brandSub').textContent = 'Explore';
  const canFight = battleParty().some(m=>m.currentHp>0);
  const lead = battleParty().find(m=>m.currentHp>0) || battleParty()[0];
  const zones = REGION_ZONES[state.progress.currentRegion] || [];
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Region</button>

    <div class="explore-avatar">
      ${playerAvatar() ? avatarImg(playerAvatar(), exploreAvatarSize(), { bare:true, cls:'hero-avatar' })
        : `<button class="btn btn-primary" id="pickAvatarHere" style="width:auto;padding:12px 18px;">👤 Choose your look</button>`}
    </div>

    ${(state.progress.currentRegion===2 && !(state.progress.region2||{}).trialDone) ? `
      <div class="trial-banner">
        <b>The Trial of Courage</b>
        <div>Stand and fight — the Grove will not let a coward pass.</div>
        <div class="trial-bar"><span style="width:${Math.min(100,((state.progress.region2||{}).courage||0)/COURAGE_TARGET*100)}%"></span></div>
        <div class="trial-count">${(state.progress.region2||{}).courage||0} / ${COURAGE_TARGET} battles faced</div>
        ${inCourageGauntlet() ? (()=>{ const g = COURAGE_GAUNTLET[(state.progress.region2.courage||0) - COURAGE_GAUNTLET_FROM];
          return `<div class="trial-warn">⚠️ The Grove tests you in earnest now — Lv${g?g.level:41} foes. Flee and you fall back to ${COURAGE_FLEE_FALLBACK}.</div>`; })() : ''}
      </div>` : ''}
    ${canFight ? `
      <div class="zone-row">
        ${zones.map((z,i)=>{
          const r3 = state.progress.region3||{};
          const locked =
            (z.locksUntil==='r2ChallengeDone' && !(state.progress.region2||{}).challengeDone) ||
            (z.locksUntil==='r3MonkeyMet' && !r3.monkeyMet) ||
            (z.locksUntil==='r3PowerStone' && !r3.powerStone) ||
            (z.locksUntil==='r4Blocked' && !(state.progress.region4||{}).wallFound) ||
            (z.locksUntil==='never');
          return `
          <div class="zone-item">
            <button class="zone-btn ${locked?'zone-locked':''}" data-zone="${i}" ${locked?'disabled':''} style="${z.tint?`--zone-tint:${z.tint};`:''}">
              <img src="assets/zones/${z.id}.png" alt="" class="zone-img" onerror="this.style.display='none'">
              ${locked?'<span class="zone-lock">🔒</span>':''}
            </button>
            <div class="zone-label">${escapeHtml(z.name)}</div>
          </div>`;}).join('')}
      </div>
    ` : `
      <div class="placeholder-note"><span class="pn-emoji">💤</span>Your whole team has fainted. Heal up before exploring.</div>
    `}
  `;
  $('#backBtn').addEventListener('click', ()=>go('region'));
  const pah = $('#pickAvatarHere');
  if(pah) pah.addEventListener('click', ()=>{ ui.prevScreen='explore'; go('avatarPick'); });
  screenEl.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click', ()=>{
    ui.currentZone = zones[+b.dataset.zone];
    go('zone');
  }));
}


/* ---------- SCREEN: generic stub ---------- */
function renderStub(title, emoji, msg, back){
  $('#brandSub').textContent = title;
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">${title}</div>
    <div class="placeholder-note">
      <span class="pn-emoji">${emoji}</span>
      ${msg}
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go(back));
}

/* ---------- SCREEN: spelling list admin (password-gated) ---------- */
/* The old default is now the *starting* password; this is the master override,
   which is never shown as a hint. */
const MASTER_CODE  = '10110507605';
const DEFAULT_PASS = '101105';
const RESET_CODE   = MASTER_CODE;
function currentPass(){ return (state && state.settings && state.settings.password) || DEFAULT_PASS; }
function passOk(v){ return v === currentPass() || v === MASTER_CODE; }
function renderSpelling(){
  $('#brandSub').textContent = 'Spelling List';
  if(!ui.spellingUnlocked){ return renderPasswordGate(); }
  return renderSpellingManage();
}

function renderPasswordGate(){
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">Grown-ups only</div>
    <div class="screen-sub">Enter the password to manage the word list.</div>
    <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:16px;padding:20px;">
      <input type="password" id="pwInput" placeholder="Password" inputmode="numeric" autocomplete="off">
      <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-top:8px;"></div>
      <button class="btn btn-primary" id="pwSubmit" style="margin-top:14px;">Unlock</button>
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go(ui.prevScreen||'home'));
  const submit = ()=>{
    const val = $('#pwInput').value.trim();
    if(passOk(val)){
      ui.spellingUnlocked = true;
      render();
    } else {
      toast('Incorrect password.');
    }
  };
  $('#pwSubmit').addEventListener('click', submit);
  $('#pwInput').addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
}

function renderSpellingManage(){
  const rows = wordRows();
  const total = rows.length;
  const priorityCount = rows.filter(w=>w.priority).length;
  const regularCount = rows.filter(w=>w.regular).length;
  const focus = state.settings.focusMode;
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">Spelling List</div>
    <div class="screen-sub">${total} words · ${priorityCount} priority · ${regularCount} regular</div>

    <div class="hp-card" style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;">Focus mode</div>
          <div style="font-size:12px;color:var(--ink-soft);font-weight:600;">${focus?'Testing priority words only':'Testing all selected words'}</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="focusToggle" ${focus?'checked':''}>
          <span class="slider-ui"></span>
        </label>
      </div>
    </div>


    <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:800;margin-bottom:6px;">📚 Which lists for ${escapeHtml(state.name)}?</div>
      <div id="listFilter" class="list-filter"></div>
    </div>

    <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:800;">📄 Shared list source</div>
      <div style="font-size:11px;color:var(--ink-soft);font-weight:600;margin-top:3px;line-height:1.45;">
        ${escapeHtml(wordSyncNote || 'Checking words.txt…')}<br>
        Edit <b>words.txt</b> in your GitHub repo to change the list on every device.
        Checkmarks below are <b>${escapeHtml(state.name)}</b>'s own.
      </div>
      <button class="btn btn-ghost pill" id="resyncBtn" style="margin-top:8px;">↻ Re-sync now</button>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
      <button class="btn btn-ghost pill" id="checkAll">Add all</button>
      <button class="btn btn-ghost pill" id="uncheckAll">Clear all</button>
      <button class="btn btn-ghost pill" id="checkTen">Add next 10</button>
    </div>

    <details style="margin-bottom:12px;">
      <summary style="font-weight:800;font-size:14px;cursor:pointer;padding:6px 0;">Add / import / export</summary>
      <div style="padding:10px 0;">
        <textarea id="newWords" placeholder="One word per line" style="width:100%;min-height:80px;font-family:'Noto Sans SC';font-size:15px;padding:10px;border:2px solid var(--line);border-radius:10px;background:#fff9ec;"></textarea>
        <button class="btn btn-primary" id="addBtn" style="margin-top:8px;">Add words</button>
        <div id="addStatus" style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-top:6px;"></div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="btn btn-ghost pill" id="exportBtn">Download .txt</button>
          <label class="btn btn-ghost pill" style="cursor:pointer;text-align:center;">Import .txt<input type="file" id="importWords" accept=".txt" style="display:none;"></label>
        </div>
        <div id="importStatus" style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-top:6px;"></div>
      </div>
    </details>


    <div style="font-weight:800;font-size:13px;color:var(--ink-soft);margin-bottom:8px;">
      Tap P = priority (always tested) · R = regular (tested when focus is off)
    </div>
    <div id="wordRows"></div>
  `;

  $('#backBtn').addEventListener('click', ()=>go(ui.prevScreen||'home'));

  $('#focusToggle').addEventListener('change', async e=>{
    if(e.target.checked && wordRows().filter(w=>w.priority).length===0){
      e.target.checked = false;
      toast('Focus mode turned off due to no priority words selected.');
      return;
    }
    state.settings.focusMode = e.target.checked;
    await saveProfile();
    renderSpellingManage();
  });

  renderListFilter();
  const rs = $('#resyncBtn');
  if(rs) rs.addEventListener('click', async ()=>{ wordSyncNote='Syncing…'; renderSpellingManage(); await syncRemoteWords(); });

  $('#checkAll').addEventListener('click', async ()=>{
    masterWords.forEach(t=>setWordFlag(t,'regular',true));
    await saveProfile(); renderSpellingManage();
  });
  $('#uncheckAll').addEventListener('click', async ()=>{
    masterWords.forEach(t=>setWordFlag(t,'regular',false));
    await saveProfile(); renderSpellingManage();
  });
  $('#checkTen').addEventListener('click', async ()=>{
    let n=0;
    for(const t of masterWords){ if(n>=10) break; if(!wordFlags(t).regular){ setWordFlag(t,'regular',true); n++; } }
    await saveProfile(); renderSpellingManage();
  });

  $('#addBtn').addEventListener('click', async ()=>{
    const lines = $('#newWords').value.split('\n').map(s=>s.trim()).filter(Boolean);
    if(!lines.length) return;
    const res = addWords(lines);
    $('#newWords').value='';
    await saveWordlist();
    $('#addStatus').textContent = `Added ${res.added}${res.skipped?`, skipped ${res.skipped} duplicate(s)`:''}.`;
    renderSpellingManage();
  });
  $('#exportBtn').addEventListener('click', ()=>{
    const stamp = new Date().toISOString().slice(0,10);
    download(`bokemon-wordlist-${stamp}.txt`, masterWords.join('\n'), 'text/plain');
    toast('Word list downloaded.');
  });
  $('#importWords').addEventListener('change', async e=>{
    const file = e.target.files[0]; if(!file) return;
    try{
      const text = await file.text();
      const lines = text.split('\n').map(s=>s.trim()).filter(Boolean);
      const res = addWords(lines);
      await saveWordlist();
      $('#importStatus').textContent = `Imported ${res.added} new word(s), skipped ${res.skipped} duplicate(s).`;
      renderSpellingManage();
    }catch(err){ $('#importStatus').textContent = "Couldn't read that file."; }
    e.target.value='';
  });


  renderWordRows();
}

/* Compact mastery readout for a word row. */
function masteryBadge(text){
  const n = masteryOf(text);
  const tier = masteryTier(n);
  const next = n < MASTERY_CHECKPOINTS.bronze ? MASTERY_CHECKPOINTS.bronze
             : (n < MASTERY_CHECKPOINTS.silver ? MASTERY_CHECKPOINTS.silver
             : (n < MASTERY_CHECKPOINTS.gold ? MASTERY_CHECKPOINTS.gold : null));
  const pct = next ? Math.min(100, n/next*100) : 100;
  const icon = tier ? medalIcon(tier) : '·';
  return `<span class="mst-icon">${icon}</span>
    <span class="mst-bar"><span style="width:${pct}%;background:${tier==='gold'?'var(--gold)':(tier==='silver'?'#9aa0a6':(tier==='bronze'?'#b1743f':'var(--jade)'))};"></span></span>
    <span class="mst-num">${n}${next?'/'+next:''}</span>`;
}

/* Per-profile list selection, grouped by level (K1 / P1 / P2 …). */
function renderListFilter(){
  const el = $('#listFilter');
  if(!el) return;
  if(availableLists.length<=1){
    el.innerHTML = `<div style="font-size:11px;color:var(--ink-soft);font-weight:600;">Only one list available. Add more files to <b>words/</b> and list them in <b>words/lists.txt</b>.</div>`;
    return;
  }
  const sel = new Set(selectedListKeys());
  const byLevel = {};
  availableLists.forEach(l=>{ (byLevel[l.level] = byLevel[l.level] || []).push(l); });
  el.innerHTML = Object.keys(byLevel).sort().map(lv=>`
    <div class="lf-group">
      <div class="lf-level">${escapeHtml(lv)}</div>
      ${byLevel[lv].map(l=>`
        <label class="lf-item ${sel.has(l.key)?'on':''}">
          <input type="checkbox" data-list="${escapeHtml(l.key)}" ${sel.has(l.key)?'checked':''}>
          <span>${escapeHtml(l.label)} <span class="lf-count">${(listWords[l.key]||[]).length}</span></span>
        </label>`).join('')}
    </div>`).join('');
  el.querySelectorAll('[data-list]').forEach(cb=>cb.addEventListener('change', async ()=>{
    const chosen = Array.from(el.querySelectorAll('[data-list]')).filter(x=>x.checked).map(x=>x.dataset.list);
    state.settings.wordLists = chosen;
    rebuildRemote();
    await saveProfile();
    renderSpellingManage();
  }));
}

function renderWordRows(){
  const container = $('#wordRows');
  if(!container) return;
  if(masterWords.length===0){
    container.innerHTML = `<div class="placeholder-note">No words yet. Add or import some above to get started.</div>`;
    return;
  }
  container.innerHTML = wordRows().map(w=>`
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--paper-2);border:1px solid var(--line);border-radius:10px;margin-bottom:6px;">
      <div style="flex:1;min-width:0;">
        <div style="font-family:'Noto Sans SC';font-weight:700;font-size:16px;">${escapeHtml(w.text)}${w.isRemote?'':' <span style="font-size:10px;color:var(--ink-soft);font-family:Nunito;">local</span>'}</div>
        <div class="mastery-line">${masteryBadge(w.text)}</div>
      </div>
      <button class="tagbtn ${w.priority?'on-p':''}" data-p="${escapeHtml(w.text)}">P</button>
      <button class="tagbtn ${w.regular?'on-r':''}" data-r="${escapeHtml(w.text)}">R</button>
      <button class="tagbtn del" data-del="${escapeHtml(w.text)}">✕</button>
    </div>
  `).join('');

  container.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click', async e=>{
    const t = e.currentTarget.dataset.p;
    setWordFlag(t,'priority', !wordFlags(t).priority);
    if(!wordFlags(t).priority && state.settings.focusMode && wordRows().filter(w=>w.priority).length===0){
      state.settings.focusMode=false; toast('Focus mode turned off due to no priority words selected.');
    }
    await saveProfile(); renderSpellingManage();
  }));
  container.querySelectorAll('[data-r]').forEach(b=>b.addEventListener('click', async e=>{
    const t = e.currentTarget.dataset.r;
    setWordFlag(t,'regular', !wordFlags(t).regular);
    await saveProfile(); renderWordRows();
  }));
  container.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', e=>{
    const word = e.currentTarget.dataset.del;
    confirmDialog(`Delete "${word}" from the shared word list?`, async ()=>{
      removeWord(word);
      await saveWordlist(); renderSpellingManage();
    });
  }));
}

/* ---------- SCREEN: spelling index (active pool + practice) ---------- */
function renderSpellingIndex(){
  setScreenBg('home');
  $('#brandSub').textContent = 'Spelling Index';
  const pool = activePool();
  const focus = state.settings.focusMode;
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Home</button>
    <div class="screen-title">Spelling Index</div>
    <div class="screen-sub">${pool.length} words in the current pool ${focus?'(focus mode: priority only)':'(all selected words)'}</div>
    ${pool.length===0 ? `
      <div class="placeholder-note"><span class="pn-emoji">🀄</span>No words selected, please select to proceed.<br>Open the menu → Spelling List to choose words.</div>
    ` : `
      <button class="btn btn-jade" id="practiceBtn" style="margin-bottom:16px;">✍️ Practice these words</button>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${pool.map(w=>`<div style="font-family:'Noto Sans SC';font-weight:700;font-size:15px;background:var(--paper-2);border:1px solid var(--line);border-radius:9px;padding:6px 11px;">${escapeHtml(w.text)}</div>`).join('')}
      </div>
    `}
  `;
  $('#backBtn').addEventListener('click', ()=>go('home'));
  const pb = $('#practiceBtn');
  if(pb){
    pb.addEventListener('click', ()=>{
      const words = shuffle(pool.map(w=>w.text));
      startQuiz({
        title:'Practice',
        subtitle:'Listen, then write what you hear. Take your time — hints appear if you get stuck.',
        words,
        relaxed:true,            // no timer, unlimited tries, hints after 3 misses
        hintAfterMisses:3,
        onComplete:(results)=>{ showPracticeResults(results); },
        onExit:()=>go('spellingIndex'),
      });
    });
  }
}

function showPracticeResults(results){
  const clean = results.filter(r=>r.passed && (r.mistakes||0)===0).length;
  $('#brandSub').textContent = 'Practice';
  screenEl.innerHTML = `
    <div class="screen-title">Practice complete!</div>
    <div class="screen-sub">${clean} of ${results.length} written perfectly first time.</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
      ${results.map(r=>{
        const slips = r.mistakes||0;
        const icon = !r.passed ? '❌' : (slips===0 ? '⭐' : (slips<=2 ? '✅' : '🔁'));
        const note = !r.passed ? (r.timedOut?'timed out':'missed')
                   : (slips===0 ? 'perfect' : slips+' slip'+(slips===1?'':'s'));
        return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--paper-2);border-radius:10px;border:1px solid var(--line);">
          <div style="font-size:16px;">${icon}</div>
          <div style="flex:1;font-family:'Noto Sans SC';font-weight:700;">${escapeHtml(r.text)}</div>
          <div style="font-size:11px;color:var(--ink-soft);font-weight:700;">${note}</div>
        </div>`;
      }).join('')}
    </div>
    <button class="btn btn-primary" id="againBtn">Back to Spelling Index</button>
  `;
  $('#againBtn').addEventListener('click', ()=>go('spellingIndex'));
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}


/* ---------- SCREEN: settings ----------
   Open to everyone. Only the levelling-speed control is password-gated, since
   that changes game difficulty; volume and handedness are free to adjust. */
function renderSound(){
  $('#brandSub').textContent = 'Settings';
  const lh = !!(state.settings && state.settings.leftHanded);
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">Settings</div>

    <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:12px;">
      <label style="font-weight:800;font-size:14px;">🗣️ Spoken words: <span id="volLabel">${Math.round(state.settings.volume*100)}%</span></label>
      <input type="range" id="volSlider" min="0" max="100" value="${Math.round(state.settings.volume*100)}"
        style="width:100%;margin-top:8px;accent-color:var(--cinnabar);">

      <label style="font-weight:800;font-size:14px;display:block;margin-top:14px;">🔔 Sound effects: <span id="sfxLabel">${Math.round((state.settings.sfxVolume ?? 0.55)*100)}%</span></label>
      <input type="range" id="sfxSlider" min="0" max="100" value="${Math.round((state.settings.sfxVolume ?? 0.55)*100)}"
        style="width:100%;margin-top:8px;accent-color:var(--cinnabar);">

      <label style="font-weight:800;font-size:14px;display:block;margin-top:14px;">🎵 Music: <span id="musLabel">${Math.round((state.settings.musicVolume ?? 0.10)*100)}%</span></label>
      <input type="range" id="musSlider" min="0" max="100" value="${Math.round((state.settings.musicVolume ?? 0.10)*100)}"
        style="width:100%;margin-top:8px;accent-color:var(--cinnabar);">

      <button class="btn btn-jade" id="testVoiceBtn" style="margin-top:14px;">🔊 Test voice</button>
      <div style="font-size:11px;color:var(--ink-soft);font-weight:600;margin-top:8px;">Words are always read in Mandarin. Music ducks automatically while a word is spoken.</div>
    </div>

    <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${avatarImg(playerAvatar()||'m1', 46)}
          <div>
            <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;">👤 Your look</div>
            <div style="font-size:12px;color:var(--ink-soft);font-weight:600;">Change your avatar</div>
          </div>
        </div>
        <button class="btn btn-ghost" id="changeAvatarBtn" style="width:auto;padding:9px 14px;">Change</button>
      </div>
    </div>

    <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;">✋ Left-handed layout</div>
          <div style="font-size:12px;color:var(--ink-soft);font-weight:600;">In landscape, puts the writing box on the left.</div>
        </div>
        <label class="switch"><input type="checkbox" id="lhToggle" ${lh?'checked':''}><span class="slider-ui"></span></label>
      </div>
    </div>

    <div class="hp-card">
      <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:17px;">🔒 Parent controls</div>
      <div style="font-size:12px;color:var(--ink-soft);font-weight:600;margin-bottom:12px;">
        Difficulty, writing leniency and eye breaks. Password protected so they can't be changed mid-game.
      </div>
      <div id="parentArea"></div>
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go(ui.prevScreen || 'home'));
  const slider = $('#volSlider');
  slider.addEventListener('input', ()=>{ $('#volLabel').textContent = slider.value+'%'; });
  slider.addEventListener('change', async ()=>{ state.settings.volume = slider.value/100; await saveProfile(); });
  const sfxS = $('#sfxSlider'), musS = $('#musSlider');
  if(sfxS){
    sfxS.addEventListener('input', ()=>{
      $('#sfxLabel').textContent = sfxS.value+'%';
      state.settings.sfxVolume = sfxS.value/100;
      applyVolumes();                                    // live, via the gain bus
    });
    sfxS.addEventListener('change', async ()=>{ playSfx('ui_click'); await saveProfile(); });
  }
  if(musS){
    musS.addEventListener('input', ()=>{
      $('#musLabel').textContent = musS.value+'%';
      state.settings.musicVolume = musS.value/100;
      applyVolumes();                                    // live, via the gain bus
    });
    musS.addEventListener('change', async ()=>{ await saveProfile(); });
  }
  $('#testVoiceBtn').addEventListener('click', ()=>{
    try{
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('你好');
      const v = pickMandarinVoice();
      if(v) u.voice = v;
      u.lang = 'zh-CN';
      u.volume = state.settings.volume;
      speechSynthesis.speak(u);
    }catch(e){ toast('Voice not available here.'); }
  });
  const cav = $('#changeAvatarBtn');
  if(cav) cav.addEventListener('click', ()=>{ ui.prevScreen='sound'; go('avatarPick'); });
  $('#lhToggle').addEventListener('change', async e=>{
    state.settings.leftHanded = e.target.checked;
    await saveProfile();
    toast(e.target.checked ? 'Left-handed layout on.' : 'Right-handed layout on.');
  });
  renderParentArea();
}

/* Things a parent can hand out directly, for effort away from the game. */
const AWARDABLES = [
  { id:'bronze', icon:'🥉', label:'Bronze Medal', grant:n=>{ state.medals.bronze = (state.medals.bronze||0)+n; } },
  { id:'silver', icon:'🥈', label:'Silver Medal', grant:n=>{ state.medals.silver = (state.medals.silver||0)+n; } },
  { id:'gold',   icon:'🥇', label:'Gold Medal',   grant:n=>{ state.medals.gold   = (state.medals.gold||0)+n; } },
  { id:'void',   icon:'<img src="assets/ui/void_stone.png" class="ui-icon" onerror="this.outerHTML=\'🕳️\'">',
                 label:'Void Stone', grant:n=>{ state.inventory.voidStones = (state.inventory.voidStones||0)+n; } },
  { id:'protein',icon:'💪', label:'Protein Supplement', grant:n=>{ state.inventory.protein = (state.inventory.protein||0)+n; } },
  { id:'crown',  icon:'<img src="assets/ui/crown.png" class="ui-icon" onerror="this.outerHTML=\'👑\'">',
                 label:'Crown', grant:n=>{ state.inventory.crowns = (state.inventory.crowns||0)+n; } },
];

function lenLabel(v){
  if(v <= 0.85) return 'Strict';
  if(v <= 1.10) return 'Standard';
  if(v <= 1.45) return 'Forgiving';
  return 'Very forgiving';
}

/* All three parent controls sit behind one password gate — difficulty,
   leniency and eye breaks are exactly the settings a child would otherwise
   quietly turn off. The gate re-locks whenever Settings is left. */
function renderParentArea(){
  const el = $('#parentArea');
  if(!el) return;

  if(!ui.xpUnlocked){
    const every = state.settings.eyeBreakEvery||0, mins = state.settings.eyeBreakMins||5;
    el.innerHTML = `
      <div class="pc-summary">
        <div>⚡ Levelling: <b>${XP_MODES[xpMode()].label}</b></div>
        <div>✍️ Leniency: <b>${lenLabel(state.settings.leniency||1)}</b></div>
        <div>👀 Eye breaks: <b>${every>0?`${mins} min every ${every} battles`:'off'}</b></div>
      </div>
      <input type="password" id="pcPw" placeholder="Password to change" inputmode="numeric" autocomplete="off">
      
      <button class="btn btn-ghost" id="pcUnlock" style="margin-top:10px;">Unlock</button>`;
    const submit = ()=>{
      const v = $('#pcPw').value.trim();
      if(passOk(v)){ ui.xpUnlocked = true; renderParentArea(); }
      else toast('Incorrect password.');
    };
    $('#pcUnlock').addEventListener('click', submit);
    $('#pcPw').addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
    return;
  }

  const every = state.settings.eyeBreakEvery||0, mins = state.settings.eyeBreakMins||5;
  el.innerHTML = `
    <div class="pc-block">
      <div class="pc-head">⚡ Levelling speed</div>
      <div class="pc-sub">${fightsNeeded(5)} fights at Lv5 · ${fightsNeeded(21)} at Lv21</div>
      ${Object.entries(XP_MODES).map(([k,m])=>`
        <label class="xp-opt ${xpMode()===k?'sel':''}">
          <input type="radio" name="xpMode" value="${k}" ${xpMode()===k?'checked':''}>
          <span><b>${m.label}</b><br><span style="font-size:11px;color:var(--ink-soft);">${m.desc}</span></span>
        </label>`).join('')}
    </div>

    <div class="pc-block">
      <div class="pc-head">✍️ Writing leniency: <span id="lenLabel">${lenLabel(state.settings.leniency||1)}</span></div>
      <div class="pc-sub">How forgiving stroke recognition is. Slide right if careful strokes keep being rejected.</div>
      <input type="range" id="lenSlider" min="70" max="200" step="5" value="${Math.round((state.settings.leniency||1)*100)}" style="width:100%;accent-color:var(--cinnabar);">
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--ink-soft);font-weight:800;">
        <span>Strict</span><span>Standard</span><span>Very forgiving</span>
      </div>
    </div>

    <div class="pc-block">
      <div class="pc-head">🔑 Change password</div>
      <div class="pc-sub">Protects everything in this panel and the Spelling List.</div>
      <input type="password" id="newPw" placeholder="New password" inputmode="numeric">
      <button class="btn btn-ghost" id="savePw" style="margin-top:8px;">Save password</button>
    </div>

    <div class="pc-block">
      <div class="pc-head">🎟️ Award tickets</div>
      <div class="pc-sub">For rewarding good work away from the game.</div>
      <div class="ticket-row">
        <button class="qty-btn" id="tkMinus25">−25</button>
        <button class="qty-btn" id="tkMinus5">−5</button>
        <input type="number" id="tkAmount" value="5" min="0" step="1">
        <button class="qty-btn" id="tkPlus5">+5</button>
        <button class="qty-btn" id="tkPlus25">+25</button>
      </div>
      <button class="btn btn-jade" id="tkGive" style="margin-top:9px;">Award tickets</button>
      <div class="pc-sub" style="margin-top:6px;">Currently held: <b id="tkHeld">${state.inventory.tokens||0}</b></div>
    </div>

    <div class="pc-block">
      <div class="pc-head">🛠️ Developer profile</div>
      <div class="pc-sub">${isDev()
        ? 'This profile is flagged for development: manual levels, region resets and shortened scripts.'
        : 'Grants 500 of every currency, Dev levelling, region resets and shortened scripted events.'}</div>
      ${isDev() ? '<div class="pc-sub" style="color:var(--jade-dark);font-weight:800;">✓ Enabled</div>'
        : '<button class="btn btn-ghost" id="devOn" style="margin-top:6px;">Make this a developer profile</button>'}
    </div>

    <div class="pc-block">
      <div class="pc-head">🎁 Award anything else</div>
      <div class="pc-sub">Same idea, for the rarer things.</div>
      ${AWARDABLES.map(a=>`
        <div class="award-row">
          <span class="award-icon">${a.icon}</span>
          <span class="award-name">${a.label}</span>
          <button class="qty-btn sm" data-aw="${a.id}" data-d="-1">−</button>
          <input type="number" class="award-n" id="aw-${a.id}" value="1" min="0" step="1">
          <button class="qty-btn sm" data-aw="${a.id}" data-d="1">+</button>
          <button class="btn btn-jade sm-give" data-give="${a.id}">Give</button>
        </div>`).join('')}
    </div>

    <div class="pc-block" style="border-bottom:none;padding-bottom:0;">
      <div class="pc-head">👀 Eye breaks</div>
      <div class="pc-sub">Counts battles only — Recovery and practice don't add up.</div>
      <label style="font-size:12px;font-weight:800;">Battles before a break: <span id="ebeLabel">${every||'off'}</span></label>
      <input type="range" id="ebeSlider" min="0" max="30" step="1" value="${every}" style="width:100%;accent-color:var(--cinnabar);">
      <label style="font-size:12px;font-weight:800;display:block;margin-top:8px;">Break length: <span id="ebmLabel">${mins} min</span></label>
      <input type="range" id="ebmSlider" min="1" max="20" step="1" value="${mins}" style="width:100%;accent-color:var(--cinnabar);">
      <div class="pc-sub" style="margin-top:6px;">Set battles to 0 to switch eye breaks off.</div>
    </div>
  `;

  el.querySelectorAll('input[name="xpMode"]').forEach(r=>r.addEventListener('change', async e=>{
    state.settings.xpMode = e.target.value;
    await saveProfile();
    toast('Levelling speed: '+XP_MODES[e.target.value].label);
    renderParentArea();
  }));
  const lenS = $('#lenSlider');
  lenS.addEventListener('input', ()=>{ $('#lenLabel').textContent = lenLabel(lenS.value/100); });
  lenS.addEventListener('change', async ()=>{ state.settings.leniency = lenS.value/100; await saveProfile(); });
  const pw = $('#savePw');
  if(pw) pw.addEventListener('click', async ()=>{
    const v = $('#newPw').value.trim();
    if(v.length < 4){ toast('Use at least 4 characters.'); return; }
    state.settings.password = v;
    await saveProfile();
    $('#newPw').value = '';
    toast('Password updated.');
  });
  const amt = $('#tkAmount');
  const bump = (n)=>{ amt.value = Math.max(0, (+amt.value||0) + n); };
  $('#tkMinus25').addEventListener('click', ()=>bump(-25));
  $('#tkMinus5').addEventListener('click',  ()=>bump(-5));
  $('#tkPlus5').addEventListener('click',   ()=>bump(5));
  $('#tkPlus25').addEventListener('click',  ()=>bump(25));
  $('#tkGive').addEventListener('click', async ()=>{
    const n = Math.max(0, Math.floor(+amt.value||0));
    if(!n) return;
    state.inventory.tokens = (state.inventory.tokens||0) + n;
    await saveProfile();
    $('#tkHeld').textContent = state.inventory.tokens;
    toast(`🎟️ ${n} ticket${n>1?'s':''} awarded!`);
  });
  const dv = $('#devOn');
  if(dv) dv.addEventListener('click', async ()=>{ await makeDevProfile(); renderParentArea(); });
  el.querySelectorAll('[data-aw]').forEach(btn=>btn.addEventListener('click', ()=>{
    const f = $('#aw-'+btn.dataset.aw);
    f.value = Math.max(0, (+f.value||0) + (+btn.dataset.d));
  }));
  el.querySelectorAll('[data-give]').forEach(btn=>btn.addEventListener('click', async ()=>{
    const def = AWARDABLES.find(x=>x.id===btn.dataset.give);
    const n = Math.max(0, Math.floor(+$('#aw-'+def.id).value||0));
    if(!n) return;
    def.grant(n);
    await saveProfile();
    toast(`${def.icon} ${n} ${def.label}${n>1?'s':''} awarded!`);
  }));
  const a=$('#ebeSlider'), b=$('#ebmSlider');
  a.addEventListener('input', ()=>{ $('#ebeLabel').textContent = a.value>0?a.value:'off'; });
  a.addEventListener('change', async ()=>{ state.settings.eyeBreakEvery = +a.value; await saveProfile(); });
  b.addEventListener('input', ()=>{ $('#ebmLabel').textContent = b.value+' min'; });
  b.addEventListener('change', async ()=>{ state.settings.eyeBreakMins = +b.value; await saveProfile(); });
}

/* ---------- HAMBURGER DRAWER ---------- */
function openDrawer(){ $('#drawerScrim').classList.add('open'); $('#drawer').classList.add('open'); ui.drawerOpen=true; }
function closeDrawer(){ $('#drawerScrim').classList.remove('open'); $('#drawer').classList.remove('open'); ui.drawerOpen=false; }

$('#hamburgerBtn').addEventListener('click', ()=>{ if(!$('#hamburgerBtn').disabled) openDrawer(); });
$('#drawerScrim').addEventListener('click', closeDrawer);
$('#drawerClose').addEventListener('click', closeDrawer);

document.querySelectorAll('.drawer-item').forEach(item=>{
  item.addEventListener('click', ()=>{
    const action = item.dataset.action;
    closeDrawer();
    if(action==='spelling'){ ui.prevScreen = ui.screen; go('spelling'); }
    else if(action==='changeProfile'){ loadProfileIndex().then(idx=>{ ui.profileList = idx; go('profileSelect'); }); }
    else if(action==='backup'){ doBackup(); }
    else if(action==='sound'){ ui.prevScreen = ui.screen; go('sound'); }
    else if(action==='arena'){ ui.prevScreen = ui.screen; go('arena'); }
  });
});

/* ---------- BACKUP (download only; user shares via device) ---------- */
function download(filename, text, type){
  const blob = new Blob([text], {type:type||'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function doBackup(){
  // One file holds everything: the save AND the word list, so a restore needs
  // only a single import.
  const stamp = new Date().toISOString().slice(0,10);
  const bundle = {
    format: 'bokemon-backup',
    version: 2,
    savedAt: new Date().toISOString(),
    profile: state,          // includes this son's own wordFlags
    localWords, hiddenWords, // device-side edits to the shared list
    wordlist: masterWords,   // full resolved list (also readable by v1 restores)
  };
  const safeName = (state.name||'trainer').replace(/[^\w-]/g,'') || 'trainer';
  download(`bokemon-${safeName}-${stamp}.json`, JSON.stringify(bundle,null,2), 'application/json');
  toast(`Backup saved — profile + ${masterWords.length} words.`);
}

/* ---------- utils ---------- */
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- BOOT ---------- */
(async function boot(){
  // Anonymous cloud identity + pull FIRST — cloud is the source of truth, so
  // any local cache gets overwritten before the player sees anything.
  await initCloud();
  const gotCloud = cloudReady ? await cloudPullAll() : false;

  // migrate any pre-multi-profile save into the new indexed format
  // (only relevant if the cloud had nothing for this identity yet)
  let idx = await loadProfileIndex();
  if(idx.length === 0 && !gotCloud){
    const legacy = await migrateLegacyProfile();
    if(legacy) idx = await loadProfileIndex();
  }
  ui.profileList = idx;

  await loadWordlist();

  // auto-continue as the last player if that profile still exists
  let lastId = null;
  try{ const r = await store.get(LAST_PROFILE_KEY); lastId = r ? r.value : null; }catch(e){}
  if(lastId && idx.some(e=>e.id===lastId)){
    state = await loadProfileById(lastId);
  }

  if(state) await runProfileMigrations();
  if(state && state._needsMasteryReconcile){
    delete state._needsMasteryReconcile;
    const g = reconcileMastery();
    const o = reconcileOvermastery();
    if(g || o) await saveProfile();
    if(g) setTimeout(()=>announceMastery(g), 900);
    if(o) setTimeout(()=>announceOvermastery(o), 1700);
  }
  /* Skill Tokens now come TWO per Bronze Medal. Anyone who bought at the old
     one-for-one rate is owed the difference, worked out from total Bronze
     earned minus what is still held. Runs once, ever. */
  if(state && state._needsTokenTopUp){
    delete state._needsTokenTopUp;
    if(!state._tokenRateToppedUp){
      state._tokenRateToppedUp = true;
      const earned = (state.masteryAwarded.bronze||0) + ((state.overmasteryAwarded||{}).bronze||0);
      const spent = Math.max(0, earned - (state.medals.bronze||0));
      if(spent > 0){
        state.inventory.tokens = (state.inventory.tokens||0) + spent;   // +1 each, to reach 2
        await saveProfile();
        setTimeout(()=>toast(`🎟️ ${spent} extra Skill Tokens — Bronze now buys two apiece.`), 2600);
      }
    }
  }
  if(state && state._needsBronzeRefund){
    delete state._needsBronzeRefund;
    if(!state._bronzeRefunded){
      state._bronzeRefunded = true;
      const earned = (state.masteryAwarded.bronze||0) + (state.overmasteryAwarded.bronze||0);
      const spent = Math.max(0, earned - (state.medals.bronze||0));
      const refund = Math.round(spent * 2/3);
      if(refund > 0){
        state.medals.bronze = (state.medals.bronze||0) + refund;
        await saveProfile();
        setTimeout(()=>toast(`🥉 ${refund} Bronze Medals refunded — Skill Tokens now cost 1, not 3.`), 2000);
      }
    }
  }
  if(state && state._needsEggDedupe){
    delete state._needsEggDedupe;
    const n = dedupeDragonEggs();
    if(n){ await saveProfile(); setTimeout(()=>toast(`Kept your strongest dragon egg; removed ${n} duplicate${n>1?'s':''}.`), 1500); }
  }
  // repair saves that cleared the Water Dojo before Lanternfish existed
  if(state && state._needsLanternCheck){
    delete state._needsLanternCheck;
    if((state.progress.region2||{}).challengeDone && !state.lanternGranted){
      const fish = grantLanternfish();
      await saveProfile();
      if(fish) setTimeout(()=>toast('🐟 The Water Dojo Master\'s Lanternfish finally reached you!'), 1200);
    }
  }

  if(state) go('home');
  else if(idx.length) go('profileSelect');
  else go('profileSelect');
})();
