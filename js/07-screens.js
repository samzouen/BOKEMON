/* ==========================================================
   07-screens.js
   Profile, starter, home, region, party screens.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ---------- SCREEN: profile select / create / import ---------- */
function renderProfileSelect(){
  setScreenBg('home');
  $('#brandSub').textContent = 'Choose a trainer';
  const list = ui.profileList || [];
  screenEl.innerHTML = `
    <div style="text-align:center;margin:10px 0 24px;">
      <div style="font-family:'Noto Serif SC',serif;font-weight:900;font-size:38px;letter-spacing:0.04em;line-height:1;">
        博刻<span style="font-family:'Baloo 2',cursive;font-size:28px;color:var(--cinnabar);margin-left:5px;">MON</span>
      </div>
      <div style="font-size:11px;color:var(--ink-soft);font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin-top:6px;">BoKeMON</div>
    </div>
    <div class="screen-title">Who's playing?</div>
    <div class="screen-sub">${list.length ? 'Tap your name to continue.' : 'Create your first trainer to begin.'}</div>

    <div id="profileList" style="display:flex;flex-direction:column;gap:10px;"></div>

    <button class="btn btn-primary" id="newBtn" style="margin-top:${list.length?'16px':'4px'};">+ New trainer</button>
    <button class="btn btn-ghost" id="importBtn" style="margin-top:10px;">Restore from a backup file</button>
    <input type="file" id="importFile" accept=".json" style="display:none;">
    <div class="phase-flag">One shared word list for the family · each trainer carves their own progress.</div>
  `;

  const box = $('#profileList');
  box.innerHTML = list.map(pr=>`
    <div class="region-card" data-pid="${pr.id}">
      ${pr.avatar ? avatarImg(pr.avatar, 48) : monPortrait(pr.starterSpecies || 'fire_starter', 48)}
      <div class="region-info" style="flex:1;">
        <h3>${escapeHtml(pr.name)}${pr.isDev?' <span class="dev-tag">DEV</span>':''}</h3>
        <p>Lv ${pr.level||5} · last played ${timeAgo(pr.updatedAt)}</p>
      </div>
      <button class="tagbtn del" data-delp="${pr.id}" title="Delete">✕</button>
    </div>
  `).join('');

  box.querySelectorAll('[data-pid]').forEach(card=>card.addEventListener('click', async e=>{
    if(e.target.closest('[data-delp]')) return;   // the delete button handles itself
    const p = await loadProfileById(card.dataset.pid);
    if(!p){ toast("Couldn't open that trainer."); return; }
    state = p;
    await runProfileMigrations();     // back-payments apply here too, not just at boot
    await saveProfile();
    go('home');
  }));

  box.querySelectorAll('[data-delp]').forEach(b=>b.addEventListener('click', e=>{
    e.stopPropagation();
    const id = b.dataset.delp;
    const entry = list.find(x=>x.id===id);
    confirmDialog(`Delete ${entry ? entry.name : 'this trainer'}? Their monsters and progress are lost for good. (The shared word list is not affected.)`, async ()=>{
      const idx = (await loadProfileIndex()).filter(x=>x.id!==id);
      await saveProfileIndex(idx);
      try{ localStorage.removeItem(profileStorageKey(id)); }catch(err){}
      if(state && state.id===id) state = null;
      ui.profileList = idx;
      renderProfileSelect();
      toast('Trainer deleted.');
    });
  }));

  $('#newBtn').addEventListener('click', ()=>{
    ui.pendingName = null;
    promptNewTrainerName();
  });
  $('#importBtn').addEventListener('click', ()=> $('#importFile').click());
  $('#importFile').addEventListener('change', handleProfileImport);
}

function promptNewTrainerName(){
  $('#brandSub').textContent = 'New trainer';
  ui.pendingAvatar = ui.pendingAvatar || null;
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">What's your name?</div>
    <div class="screen-sub">This is how the game will greet you.</div>
    <input type="text" id="nameInput" placeholder="Enter a name" maxlength="20" value="${escapeHtml(ui.pendingName||'')}">

    <div class="screen-sub" style="margin:18px 0 8px;">Pick your look</div>
    ${avatarPickerHtml(ui.pendingAvatar)}

    <button class="btn btn-primary" id="createBtn" style="margin-top:16px;">Continue</button>
  `;
  $('#backBtn').addEventListener('click', ()=>go('profileSelect'));
  wireAvatarPicker(id=>{ ui.pendingAvatar = id; });
  const submit = ()=>{
    const name = $('#nameInput').value.trim();
    if(!name){ toast('Please enter a name first.'); return; }
    if(!ui.pendingAvatar){ toast('Pick an avatar to continue.'); return; }
    ui.pendingName = name;
    go('starterSelect');
  };
  $('#createBtn').addEventListener('click', submit);
  $('#nameInput').addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
}

/* Shared avatar grid, used at creation and for changing later in Settings. */
function avatarPickerHtml(selected){
  const row = (label, ids)=>`
    <div class="av-group">
      <div class="av-label">${label}</div>
      <div class="av-row">
        ${ids.map(id=>`
          <button class="av-opt ${selected===id?'sel':''}" data-avatar="${id}">
            ${avatarImg(id, 72)}
          </button>`).join('')}
      </div>
    </div>`;
  return `<div class="av-picker">${row('Boy', AVATARS.male)}${row('Girl', AVATARS.female)}</div>`;
}
function wireAvatarPicker(onPick){
  screenEl.querySelectorAll('[data-avatar]').forEach(b=>b.addEventListener('click', ()=>{
    screenEl.querySelectorAll('[data-avatar]').forEach(x=>x.classList.remove('sel'));
    b.classList.add('sel');
    onPick(b.dataset.avatar);
  }));
}

/* Avatar chooser for existing profiles (and for changing later). */
function renderAvatarPick(){
  $('#brandSub').textContent = 'Your look';
  let chosen = playerAvatar();
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">Choose your look</div>
    <div class="screen-sub">You can change this any time in Settings.</div>
    ${avatarPickerHtml(chosen)}
    <button class="btn btn-primary" id="avSave" style="margin-top:18px;" ${chosen?'':'disabled'}>Save</button>
  `;
  $('#backBtn').addEventListener('click', ()=>go(ui.prevScreen||'home'));
  wireAvatarPicker(id=>{ chosen = id; $('#avSave').disabled = false; });
  $('#avSave').addEventListener('click', async ()=>{
    if(!chosen) return;
    state.avatar = chosen;
    await saveProfile();
    toast('Looking good!');
    go(ui.prevScreen||'home');
  });
}

function timeAgo(ts){
  if(!ts) return 'never';
  const d = Date.now()-ts;
  const mins = Math.floor(d/60000);
  if(mins < 1) return 'just now';
  if(mins < 60) return mins+'m ago';
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return hrs+'h ago';
  const days = Math.floor(hrs/24);
  return days===1 ? 'yesterday' : days+'d ago';
}

async function handleProfileImport(e){
  const file = e.target.files[0];
  if(!file) return;
  try{
    const text = await file.text();
    const data = JSON.parse(text);

    // New bundle format holds { profile, wordlist }; older files were a bare profile.
    const isBundle = data && (data.format === 'bokemon-backup' || data.format === 'word-catcher-backup') && data.profile;
    const prof = isBundle ? data.profile : data;

    if(!prof || !prof.name || !prof.party || !prof.starterSpecies){
      toast("That doesn't look like a 博刻MON backup.");
      e.target.value='';
      return;
    }

    state = normalizeProfile(prof);
    await saveProfile();

    let wordMsg = '';
    if(isBundle){
      if(Array.isArray(data.localWords))  localWords  = data.localWords.slice();
      if(Array.isArray(data.hiddenWords)) hiddenWords = data.hiddenWords.slice();
      if(Array.isArray(data.wordlist)){
        // v1 backups stored {text,priority,regular} objects; v2 stores strings.
        const texts = phraseKeys(data.wordlist.map(w => typeof w==='string' ? w : w && w.text));
        // anything not already coming from words.txt is kept as a local word
        texts.forEach(t=>{ if(!remoteWords.includes(t) && !localWords.includes(t)) localWords.push(t); });
        // v1 carried the checkmarks on the list itself — migrate them onto the profile
        data.wordlist.forEach(w=>{
          if(w && typeof w==='object' && w.text && phraseKey(w.text)){
            state.wordFlags = state.wordFlags || {};
            state.wordFlags[phraseKey(w.text)] = { priority:!!w.priority, regular:w.regular!==false };
          }
        });
      }
      await saveWordlist();
      await saveProfile();
      wordMsg = ` and ${masterWords.length} words`;
    }

    toast(`Restored ${state.name}${wordMsg}!`);
    go('home');
  }catch(err){
    toast("Couldn't read that file.");
  }
  e.target.value='';
}

/* ---------- SCREEN: starter select ---------- */
function renderStarterSelect(){
  const blurbs = {
    water_starter:'Steady and sturdy. Strong against Fire.',
    fire_starter:'Fierce and fiery. Strong against Grass.',
    grass_starter:'Nimble and green. Strong against Water.',
  };
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Back</button>
    <div class="screen-title">Choose your first partner</div>
    <div class="screen-sub">This monster starts at level 5 and grows with you.</div>
    <div class="starter-grid" id="starterGrid">
      ${STARTER_CHOICES.map(sp=>`
        <div class="starter-card" data-sp="${sp}">
          ${monPortrait(sp,76)}
          <div class="starter-info">
            <h3>${SPECIES[sp].name}</h3>
            <div class="type-badge" style="background:${TYPE_COLORS[SPECIES[sp].types[0]]}">${SPECIES[sp].types[0]}</div>
            <p>${blurbs[sp]}</p>
          </div>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-primary" id="confirmBtn" style="margin-top:18px;" disabled>Choose this partner</button>
  `;

  let picked = null;
  screenEl.querySelectorAll('.starter-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      screenEl.querySelectorAll('.starter-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      picked = card.dataset.sp;
      $('#confirmBtn').disabled = false;
    });
  });
  $('#backBtn').addEventListener('click', ()=>go('profileSelect'));
  $('#confirmBtn').addEventListener('click', async ()=>{
    if(!picked) return;
    await createAndSaveProfile(ui.pendingName, picked);
    if(ui.pendingAvatar){ state.avatar = ui.pendingAvatar; await saveProfile(); }
    ui.pendingAvatar = null;
    ui.profileList = await loadProfileIndex();
    toast('Your adventure begins!');
    go('home');
  });
}

/* ---------- SCREEN: home ---------- */
/* Six squares, one per day of the cycle. Completed days grey out with a tick;
   the day you're working on glows. */
function dailyPanel(){
  const d = dailyState();
  const step = d.step % DAILY_CYCLE.length;          // the day being worked on
  const pct = Math.min(100, d.count/DAILY_TARGET*100);
  const allDone = d.done && step === 0;              // a full cycle just closed

  const square = (i)=>{
    const r = DAILY_CYCLE[i];
    /* `step` ALREADY points at tomorrow once today is claimed, so `i < step`
       covers every completed day on its own. The extra `i === step` clause was
       also ticking the day that hasn't been earned yet. */
    const done = allDone || i < step;
    const current = !done && i === step && !d.done;
    const icon = r.gold   ? `<span class="dq-icon">🥇</span>`
               : r.silver ? `<span class="dq-icon">🥈</span>`
               : `<span class="dq-icon">${tokenIcon(26)}</span>`;
    const amt = r.gold || r.silver || r.tokens;
    return `<div class="daily-sq ${done?'done':''} ${current?'current':''} ${i===5?'finale':''}">
      <div class="dq-day">Day ${i+1}</div>
      ${icon}
      <div class="dq-amt">${amt}</div>
      ${done ? `<svg class="dq-tick" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12.5 L9.5 18 L20 6" fill="none" stroke="currentColor"
              stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
    </div>`;
  };

  return `<div class="daily-card">
    <div class="daily-head">🗓️ Daily — ${DAILY_TARGET} phrases a day
      <span>${d.done ? 'done today' : `${d.count} / ${DAILY_TARGET}`}</span></div>
    <div class="trial-bar"><span style="width:${pct}%"></span></div>
    <div class="daily-grid">${DAILY_CYCLE.map((_,i)=>square(i)).join('')}</div>
    <div class="daily-sub">${d.done
      ? 'Today is done. Tomorrow carries on from here — a missed day costs nothing.'
      : `Write ${DAILY_TARGET - d.count} more phrase${DAILY_TARGET-d.count===1?'':'s'} to claim day ${step+1}.`}</div>
  </div>`;
}

function renderHome(){
  setScreenBg('home');
  playMusic('main_menu');
  $('#brandSub').textContent = state.name;
  screenEl.innerHTML = `
    <div class="version-tag">v${GAME_VERSION}</div>
    ${dailyPanel()}
    ${playerAvatar() ? `<div class="home-hero">${avatarImg(playerAvatar(), 58)}<div>
        <div class="home-hero-name">${escapeHtml(state.name)}</div>
        <div class="home-hero-sub">Where to today?</div></div></div>`
      : `<div class="screen-title">Home</div><div class="screen-sub">Where to, ${escapeHtml(state.name)}?</div>`}
    ${playerAvatar() ? '' : `<div class="avatar-nudge" id="avatarNudge">
        <span>👤 Choose a look for ${escapeHtml(state.name)}</span>
        <button class="btn btn-primary" id="pickAvatarBtn" style="width:auto;padding:9px 16px;font-size:13px;">Pick</button>
      </div>`}
    ${renderPartyStrip()}
    <div class="menu-grid" style="margin-top:16px;">
      <div class="menu-card full" data-nav="regionList">
        <span class="mc-emoji">🗺️</span>
        <div class="mc-title">Regions</div>
        <div class="mc-desc">Explore, battle, and catch monsters</div>
      </div>
      <div class="menu-card" data-nav="monsterIndex">
        <span class="mc-emoji">📖</span>
        <div class="mc-title">Monster Index</div>
        <div class="mc-desc">Monsters you've met</div>
      </div>
      <div class="menu-card" data-nav="spellingIndex">
        <span class="mc-emoji">🀄</span>
        <div class="mc-title">Spelling Index</div>
        <div class="mc-desc">Words in your pool</div>
      </div>
    </div>

  `;
  const pab = $('#pickAvatarBtn');
  if(pab) pab.addEventListener('click', ()=>go('avatarPick'));
  screenEl.querySelector('[data-nav="regionList"]').addEventListener('click', ()=>go('regionSelect'));
  screenEl.querySelector('[data-nav="monsterIndex"]').addEventListener('click', ()=>go('monsterIndex'));
  screenEl.querySelector('[data-nav="spellingIndex"]').addEventListener('click', ()=>go('spellingIndex'));
}

function renderPartyStrip(){
  if(!state.party.length) return '';
  return `<div class="party-strip">
    ${state.party.map(m=>`
      <div class="party-chip">
        ${monPortrait(m.species,34,{stage:monStage(m),crowned:isCrowned(m)})}
        <div>
          <div class="pc-name">${escapeHtml(displayName(m))}</div>
          <div class="pc-lvl">Lv ${m.level}</div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

/* ---------- SCREEN: region list + region hub ---------- */
function region2Locked(){
  const r2 = state.progress.region2 || {};
  return state.progress.currentRegion===2 && !r2.trialDone;
}

function renderRegion(){
  /* The first time into Cosa Nostia you do not see a menu: you step off the ship. */
  if(state.progress.currentRegion === 5 && typeof r5ArrivalDue === 'function' && r5ArrivalDue()) return r5Arrive();
  setScreenBg('region'+(state.progress.currentRegion||1));
  playMusicChain(['region'+(state.progress.currentRegion||1), 'region']);
  const rid = state.progress.currentRegion || 1;
  const meta = REGIONS.find(r=>r.id===rid) || REGIONS[0];
  $('#brandSub').textContent = 'Region '+rid;

  // Sacred Grove bars the way until the Trial of Courage is passed
  const gated = region2Locked();
  const challengeLabel = rid===5 ? 'The Family'
    : rid===4 ? 'Aboard the Vane Shear'
    : rid===3 ? 'Electric Dojo (closed)'
    : rid===2 ? 'Water Dojo' : 'Dojo, Jax & Thugs';

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Regions</button>
    <div class="screen-title">Region ${rid} · ${escapeHtml(meta.name)}</div>
    <div class="screen-sub">${escapeHtml(meta.desc)}</div>
    ${(rid === 4 && typeof expeditionBar === 'function') ? expeditionBar() : ''}
    ${gated ? `<div class="trial-banner" style="margin-bottom:14px;">
      <b>The Grove bars the way</b>
      <div>Prove your courage in the Sacred Grove before the city will receive you.</div>
    </div>` : ''}
    <div class="menu-grid">
      <div class="menu-card" data-nav="explore"><span class="mc-emoji">🌿</span><div class="mc-title">Explore</div><div class="mc-desc">Find wild monsters</div></div>
      <div class="menu-card ${gated?'locked':''}" data-nav="challenge"><span class="mc-emoji">⚔️</span><div class="mc-title">Challenge</div><div class="mc-desc">${escapeHtml(challengeLabel)}</div></div>
      <div class="menu-card" data-nav="party"><span class="mc-emoji">🎒</span><div class="mc-title">Party</div><div class="mc-desc">Manage your team</div></div>
      <div class="menu-card" data-nav="recover"><span class="mc-emoji">💧</span><div class="mc-title">Recover</div><div class="mc-desc">Heal &amp; revise</div></div>
      <div class="menu-card full ${gated?'locked':''}" data-nav="shop"><span class="mc-emoji">🏪</span><div class="mc-title">Shop</div><div class="mc-desc">Spend medals earned from spelling</div></div>
    </div>
    <div class="screen-sub" style="margin-top:18px;font-size:12px;">Level cap here: <b>${levelCap()}</b>${levelCap() > CROWN_GATE
      ? ` · past ${CROWN_GATE}, a monster needs its Crown, then a breakthrough every ${CEILING_STEP} levels` : ''}</div>
    ${devPanel()}
  `;
  $('#backBtn').addEventListener('click', ()=>go('regionSelect'));
  wireDevPanel();
  screenEl.querySelectorAll('.menu-card[data-nav]').forEach(c=>{
    c.addEventListener('click', ()=>{
      if(gated && c.dataset.nav!=='explore' && c.dataset.nav!=='party' && c.dataset.nav!=='recover'){
        toast('Prove your courage in the Sacred Grove first.');
        return;
      }
      go(c.dataset.nav);
    });
  });
}


/* ---------- SCREEN: party (full management) ---------- */
function renderPartyStub(){
  setScreenBg('home');
  $('#brandSub').textContent = 'Party';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← ${ui.walkBack ? 'Back' : 'Region'}</button>
    <div class="party-head-row">
      <div>
        <div class="screen-title" style="margin:0;">Your Party</div>
        <div class="screen-sub" style="margin:0;">${battleParty().length} / 6 · tap one for options</div>
      </div>
      <button class="btn btn-ghost storage-corner" id="storageBtn">📦 ${state.storage.length}</button>
    </div>
    ${companionsUnlocked() ? `<button class="btn btn-ghost" id="compBtn" style="margin-top:10px;">🤝 Companions</button>` : ''}
    <div id="partyList" style="display:flex;flex-direction:column;gap:10px;margin-top:12px;"></div>
  `;
  $('#backBtn').addEventListener('click', ()=> go(backFromMenu()));
  $('#storageBtn').addEventListener('click', ()=>{ ui.storageFrom='party'; go('storage'); });
  const cpb = $('#compBtn');
  if(cpb) cpb.addEventListener('click', ()=> go('companions'));
  renderPartyList();
}

function renderPartyList(){
  const list = $('#partyList');
  if(!list) return;
  breakthroughCss();
  companionsCss();
  list.innerHTML = state.party.map((m,idx)=>{
    const maxHp = monMaxHp(m);
    const open = ui.partyOpen===m.uid;
    const ready = breakthroughReady(m);          // its breakthrough waits for a tap (2.82)
    const portrait = monPortrait(m.species,52,{stage:monStage(m),crowned:isCrowned(m)});
    return `
    <div class="party-card ${isSeed(m)?'seed-card':''}" data-uid="${m.uid}">
      <div class="party-head" ${isSeed(m)?'':`data-tap="${m.uid}"`}>
        ${ready ? `<span class="bt-ready" title="Ready to break through">${portrait}</span>` : portrait}
        <div style="flex:1;">
          <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;">${escapeHtml(displayName(m))}${crownMark(m)} <span style="font-size:12px;color:var(--ink-soft);">Lv ${m.level}</span></div>
          <div>${typeBadges(m.species)}</div>
          ${isSeed(m)
            ? `<div style="font-size:11px;color:var(--ink-soft);font-weight:700;margin-top:5px;font-style:italic;">In your care — cannot battle.</div>`
            : `<div class="hpbar" style="margin-top:5px;"><div class="hpfill" style="width:${Math.max(0,m.currentHp/maxHp*100)}%;background:${m.currentHp/maxHp<0.3?'var(--cinnabar)':'var(--jade)'};"></div></div>
               <div style="font-size:11px;color:var(--ink-soft);font-weight:700;margin-top:2px;">${Math.max(0,m.currentHp)}/${maxHp} HP · ATK ${monAtk(m)}</div>
               ${partyCompanionLine(m)}`}
        </div>
      </div>
      ${open ? `
        <div class="party-actions">
          ${ready ? `<button class="mini-btn bt-btn" data-break="${m.uid}">⚡ Break through to Lv ${Math.min(LEVEL_MAX, monCeiling(m) + CEILING_STEP)}</button>` : ''}
          <button class="mini-btn" data-stats="${m.uid}">📊 Stats &amp; Moves</button>
          <button class="mini-btn" data-up="${idx}" ${idx===0?'disabled':''}>▲ Up</button>
          <button class="mini-btn" data-down="${idx}" ${idx===state.party.length-1?'disabled':''}>▼ Down</button>
          ${isFixedMember(m) ? '' : `<button class="mini-btn" data-store="${m.uid}" ${battleParty().length<=1?'disabled':''}>📦 To storage</button>`}
        </div>
      ` : ''}
    </div>`;
  }).join('');

  list.querySelectorAll('[data-tap]').forEach(el=>el.addEventListener('click', ()=>{
    const uid = el.dataset.tap;
    ui.partyOpen = (ui.partyOpen===uid) ? null : uid;
    renderPartyList();
  }));
  list.querySelectorAll('[data-stats]').forEach(b=>b.addEventListener('click', e=>{ e.stopPropagation(); ui.statsUid=b.dataset.stats; go('stats'); }));
  list.querySelectorAll('[data-break]').forEach(b=>b.addEventListener('click', e=>{
    e.stopPropagation();
    const m = state.party.find(x=> x.uid === b.dataset.break);
    if(m) doBreakthrough(m, renderPartyList);
  }));
  list.querySelectorAll('[data-up]').forEach(b=>b.addEventListener('click', async e=>{ e.stopPropagation(); const i=+b.dataset.up; [state.party[i-1],state.party[i]]=[state.party[i],state.party[i-1]]; await saveProfile(); renderPartyList(); }));
  list.querySelectorAll('[data-down]').forEach(b=>b.addEventListener('click', async e=>{ e.stopPropagation(); const i=+b.dataset.down; [state.party[i+1],state.party[i]]=[state.party[i],state.party[i+1]]; await saveProfile(); renderPartyList(); }));
  list.querySelectorAll('[data-store]').forEach(b=>b.addEventListener('click', async e=>{
    const pm = state.party.find(x=>x.uid===b.dataset.store);
    if(isFixedMember(pm)){ toast('This one stays with you.'); return; }
    e.stopPropagation();
    const uid=b.dataset.store;
    if(battleParty().length<=1){ toast('You need at least one monster in your party.'); return; }
    const idx=state.party.findIndex(m=>m.uid===uid);
    if(isFixedMember(state.party[idx])){
      toast(`${displayName(state.party[idx])} is not going anywhere.`);
      return;
    }
    const [m]=state.party.splice(idx,1);
    state.storage.push(m);
    ui.partyOpen=null;
    await saveProfile();
    toast(`${displayName(m)} moved to storage.`);
    renderPartyStub();
  }));
}

/* ---------- SCREEN: stats & moves ---------- */
/* The Crown panel on a monster's Stats page. */
/* Refining lives here, on the monster that actually knows the skill — a stone
   sitting in storage isn't a move yet, so it can't be refined. */
/* Void Stone extraction costs medals scaled to the tier AND how refined the
   skill is — pulling out a ✦ Ultra is a serious undertaking. */
const VOID_COSTS = {
  low:      { cur:'bronze', n:[1,3,5]  },
  mid:      { cur:'bronze', n:[3,6,10] },
  high:     { cur:'silver', n:[1,3,5]  },
  veryhigh: { cur:'silver', n:[3,6,10] },
  ultra:    { cur:'gold',   n:[3,6,10] },
};
function voidCost(st){
  const c = VOID_COSTS[st.tier];
  return c ? { cur:c.cur, n:c.n[stonePlus(st)] } : null;
}
function canVoid(st){
  if((state.inventory.voidStones||0) < 1) return { ok:false, why:'You have no Void Stones.' };
  const c = voidCost(st);
  if(!c) return { ok:false, why:'This skill cannot be drawn out.' };
  if(medalCount(c.cur) < c.n) return { ok:false, why:`Needs ${c.n} ${curName(c.cur)}.` };
  return { ok:true, cost:c };
}
/* Removing a stone restores whatever natural move belongs in that slot. */
async function doVoidExtract(st, mon, closeFn){
  const check = canVoid(st);
  if(!check.ok) return toast(check.why);
  const snapshot = { medals:Object.assign({},state.medals), voids:state.inventory.voidStones,
                     eq:mon.equippedStone, p1:mon.power1Stone, ult:mon.ultraStone,
                     stones:state.moveStones.slice() };
  state.inventory.voidStones--;
  state.medals[check.cost.cur] -= check.cost.n;
  if(mon.equippedStone && mon.equippedStone.uid===st.uid) mon.equippedStone = null;
  else if(mon.power1Stone && mon.power1Stone.uid===st.uid) mon.power1Stone = null;
  else if(mon.ultraStone && mon.ultraStone.uid===st.uid)   mon.ultraStone = null;
  else if(mon.equippedStone && mon.equippedStone.name===st.name) mon.equippedStone = null;
  else if(mon.power1Stone && mon.power1Stone.name===st.name) mon.power1Stone = null;
  else if(mon.ultraStone && mon.ultraStone.name===st.name) mon.ultraStone = null;
  // the stone returns to storage with its refinement intact
  state.moveStones.push({ uid:'s'+Date.now()+Math.floor(Math.random()*1000),
    tier:st.tier, type:st.type, name:st.name, plus:stonePlus(st) });

  const sv = showSyncingOverlay('Extracting…');
  const ok = await saveProfile({ awaitCloud:true });
  hideSyncingOverlay(sv);
  if(!ok){
    state.medals = snapshot.medals; state.inventory.voidStones = snapshot.voids;
    mon.equippedStone = snapshot.eq; mon.power1Stone = snapshot.p1; mon.ultraStone = snapshot.ult;
    state.moveStones = snapshot.stones;
    showSyncFailure(); return;
  }
  playSfx('stone_roll');
  toast(`${stoneDisplayName(st)} drawn back out — its natural move returns.`);
  if(closeFn) closeFn();
  renderStats();
}

function openRefineSheet(st, mon){
  const t = stoneTierDef(st.tier);
  const maxed = stonePlus(st) >= 2;
  const notYet = false;                // every tier can now be refined
  const check = (maxed || notYet) ? { ok:false } : canUpgradeStone(st);
  const cost = (maxed || notYet) ? null : upgradeCost(st);
  const nextSt = Object.assign({}, st, { plus: stonePlus(st)+1 });
  const cur = stoneMult(st), nxt = maxed||notYet ? null : stoneMult(nextSt);
  const preview = maxed ? '' : (st.tier==='ultra'
    ? (()=>{ const a=ultraHitRange(st), b=ultraHitRange(nextSt);
             return `${cur}× · ${a.min}–${a.max} hits  →  <b>${nxt}× · ${b.min}–${b.max} hits</b>`; })()
    : st.tier==='veryhigh'
      ? `<div style="text-align:left;font-size:12px;line-height:1.5;">${veryHighDef(st.type, stonePlus(st)+1).text}</div>`
      : `${cur}× ATK  →  <b>${nxt}× ATK</b>`);

  const ov = document.createElement('div');
  ov.className = 'refine-scrim';
  ov.innerHTML = `
    <div class="refine-card">
      <div class="stone-tier-big tier-${st.tier}">${t.label}</div>
      <div class="refine-name">${escapeHtml(st.name)}${stonePlus(st)?`<span class="plus-mark big">${UPGRADE_MARKS[stonePlus(st)].trim()}</span>`:''}</div>
      <div class="refine-sub">Known by ${escapeHtml(displayName(mon))}</div>
      ${notYet ? `<div class="upg-panel muted">Very High skills cannot be refined yet.</div>`
        : maxed ? `<div class="upg-panel done">✦ Fully refined</div>`
        : `<div class="upg-panel">
             <div class="upg-head">Refine to <b>${UPGRADE_MARKS[stonePlus(st)+1].trim()}</b></div>
             <div class="upg-preview">${preview}</div>
             <div class="upg-cost">A spare ${escapeHtml(st.type)} ${t.label} stone
               + ${curIcon(cost.cur)} ${cost.n} ${curName(cost.cur)}</div>
             ${check.ok ? '' : `<div class="upg-why">${escapeHtml(check.why||'')}</div>`}
           </div>`}
      ${(()=>{ const v = canVoid(st); const c = voidCost(st);
        return `<div class="upg-panel" style="margin-top:10px;">
          <div class="upg-head">${voidIcon(16)} Draw it back out</div>
          <div class="upg-cost">Returns the stone (keeping ${UPGRADE_MARKS[stonePlus(st)].trim()||'its tier'})
            and restores the natural move.<br>Costs a Void Stone${c?` + ${curIcon(c.cur)} ${c.n}`:''}.</div>
          ${v.ok ? '' : `<div class="upg-why">${escapeHtml(v.why)}</div>`}
          <button class="btn btn-ghost" id="rfVoid" style="margin-top:8px;" ${v.ok?'':'disabled'}>Extract</button>
        </div>`; })()}
      <div style="display:flex;gap:10px;margin-top:14px;">
        <button class="btn btn-ghost" id="rfBack" style="flex:1;">Back</button>
        <button class="btn btn-primary" id="rfGo" style="flex:1;" ${check.ok?'':'disabled'}>Upgrade</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
  ov.querySelector('#rfBack').addEventListener('click', close);
  const vb = ov.querySelector('#rfVoid');
  if(vb && canVoid(st).ok) vb.addEventListener('click', ()=>{
    const c = voidCost(st);
    confirmDialogHtml(
      `Draw <b>${escapeHtml(stoneDisplayName(st))}</b> back out of ${escapeHtml(displayName(mon))}?<br><br>` +
      `The stone returns to storage with its refinement intact, and the natural move comes back.<br><br>` +
      `Costs a Void Stone and ${curIcon(c.cur)} ${c.n}.`,
      ()=> doVoidExtract(st, mon, close));
  });
  const go = ov.querySelector('#rfGo');
  if(check.ok) go.addEventListener('click', ()=>{
    confirmDialogHtml(
      `Refine <b>${escapeHtml(st.name)}</b> to <b>${UPGRADE_MARKS[stonePlus(st)+1].trim()}</b>?<br><br>` +
      `${preview}<br><br>` +
      `This consumes a spare ${escapeHtml(st.type)} ${t.label} stone and ${curIcon(cost.cur)} ${cost.n}.<br><br>` +
      `<i>The spare stone is used up for good.</i>`,
      async ()=>{ await doUpgradeStone(st, close); renderStats(); });
  });
}

/* The Element Stone panel on a Stats page: the stone it carries (with its
   charge), or the stones you hold that fit it. One stone per monster. */
function stoneOwnerName(id){
  const uid = stoneHolder(id);
  const who = uid && state.party.concat(state.storage || []).find(x=> x.uid === uid);
  return who ? displayName(who) : null;
}
function stonePanel(m){
  const fits = stonesFor(m).filter(st=> ownsStone(st.id));
  if(!fits.length || (isPassenger(m) && !isCuain(m))) return '';
  const st = stoneCarriedBy(m);
  const others = fits.filter(x=> !st || x.id !== st.id);
  const charge = st ? stoneCharge(st.id) : 0;
  const atCeiling = chargesStone(m);             // at a ceiling, or at the region's cap on one (2.82)
  return `<div class="crown-panel wide" style="border-color:rgba(59,126,161,.55);background:rgba(59,126,161,.14);">
    <div class="cp-art">${st ? uiIcon(st.icon, 62, st.emoji) : '<span style="font-size:44px;">💠</span>'}</div>
    <div class="cp-text">
      <div class="crown-title">${st ? escapeHtml(st.name) : 'Element Stones'}${st && charge ? ` <span>⚡ ${charge} charge</span>` : ''}</div>
      <div class="crown-sub">${st
        ? (atCeiling ? `Carried — every fight charges it for the breakthrough.`
                     : `Carried — this monster gains <b>${st.xp}×</b> experience.`)
        : `${fits.map(x=> escapeHtml(x.name)).join(', ')} ${fits.length > 1 ? 'fit' : 'fits'} this monster. ` +
          `Carried, a stone gives <b>1.5×</b> experience${canPassLimit(m) ? ', and charges its breakthroughs' : ''}.`}</div>
      <div style="display:flex;gap:8px;margin-top:9px;">
        ${st ? `<button class="btn btn-ghost" id="stoneOff" data-stone="${st.id}" style="margin:0;">Detach</button>` : ''}
        ${others.length ? `<button class="btn btn-primary" id="stoneOn" style="margin:0;">${st ? 'Swap…' : 'Attach…'}</button>` : ''}
      </div>
    </div>
  </div>`;
}
/* Pick a stone for a monster: who carries each now, and its charge. */
function stoneChooser(title, stones, onPick){
  const scrim = document.createElement('div');
  scrim.style.cssText = 'position:fixed;inset:0;background:rgba(35,32,25,0.55);z-index:70;display:flex;align-items:flex-end;justify-content:center;';
  scrim.innerHTML = `<div style="background:var(--paper);border-radius:18px 18px 0 0;padding:20px;max-width:480px;width:100%;">
    <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:17px;margin-bottom:12px;">${escapeHtml(title)}</div>
    ${stones.map(st=>{
      const who = stoneOwnerName(st.id), ch = stoneCharge(st.id);
      return `<button class="btn btn-ghost st-opt" data-id="${st.id}" style="margin-bottom:8px;display:flex;align-items:center;gap:10px;justify-content:flex-start;text-align:left;">
        ${uiIcon(st.icon, 30, st.emoji)}<span><b>${escapeHtml(st.name)}</b>${ch ? ` · ⚡ ${ch}` : ''}<br>
        <span style="font-size:11px;color:var(--ink-soft);">${who ? `carried by ${escapeHtml(who)}` : 'free'}</span></span></button>`;
    }).join('')}
    <button class="btn btn-ghost" id="stCancel" style="margin-top:4px;">Cancel</button>
  </div>`;
  document.body.appendChild(scrim);
  const close = ()=>{ if(scrim.parentNode) document.body.removeChild(scrim); };
  scrim.querySelector('#stCancel').addEventListener('click', close);
  scrim.addEventListener('click', e=>{ if(e.target === scrim) close(); });
  scrim.querySelectorAll('.st-opt').forEach(b=> b.addEventListener('click', ()=>{ close(); onPick(b.dataset.id); }));
}
/* Put a stone on a monster, save, and say what happened — including that it
   is ready to break through, if the stone arrives charged enough. (It used to
   break through there and then; the breakthrough is the player's now, 2.82.) */
async function giveStoneTo(id, m, after){
  const st = stoneDef(id);
  const was = stoneOwnerName(id);
  attachStone(id, m);
  await saveProfile();
  toast(`${st.name} ${was && was !== displayName(m) ? `moved from ${was} to` : 'attached to'} ${displayName(m)}.` +
        (breakthroughReady(m) ? ` ⚡ It is ready to break through!` : ''));
  if(after) after();
}
/* The player's breakthrough (2.82): from a monster's card on the Party page,
   or its Stats page, once it is ready. */
async function doBreakthrough(m, after){
  const bt = tryBreakthrough(m);
  if(!bt){ toast('Not ready to break through yet.'); return; }
  await saveProfile();
  playSfx('evolution');
  toast(`⚡ ${displayName(m)} broke through! It can grow to Lv ${bt.breakthrough} now.` +
        (bt.to > bt.from ? ` It grew to Lv ${bt.to}!` : ''));
  if(after) after();
}
/* A monster ready to break through pulses, gently, on the Party page. */
function breakthroughCss(){
  if(document.getElementById('breakthroughCss')) return;
  const st = document.createElement('style');
  st.id = 'breakthroughCss';
  st.textContent = `
    .bt-ready{display:inline-block;flex:none;border-radius:50%;animation:btPulse 2.6s ease-in-out infinite;}
    @keyframes btPulse{
      0%,100%{transform:scale(1);filter:drop-shadow(0 0 0 rgba(138,106,208,0));}
      50%{transform:scale(1.045);filter:drop-shadow(0 0 8px rgba(138,106,208,.9));}
    }
    .mini-btn.bt-btn{background:#efe8fb;border-color:#b9a4e6;color:#4a2f8a;}
    @media (prefers-reduced-motion: reduce){
      .bt-ready{animation:none;filter:drop-shadow(0 0 6px rgba(138,106,208,.85));}
    }`;
  document.head.appendChild(st);
}

/* Every move explains itself: what it hits, for how much, and — for anything
   with an effect — exactly what that effect does. */
/* The one-line summary under a move's name. Mirrors the battle button so the
   two never disagree — the old line claimed "0.1× ATK · Single" for a move that
   actually strikes three times. */
function statsMoveLine(mv, mon){
  const bits = [`${mv.words} words`];
  const dmg = estimateHit(mv, mon);
  if(dmg != null) bits.unshift(`${dmg} dmg`);
  else bits.unshift('Support');
  const shape = moveShape(mv);
  if(shape) bits.splice(1, 0, shape);
  return bits.join(' · ');
}

function openMoveInfo(mv, mon){
  const atk = monAtk(mon);
  const st = mv.stone;
  const ov = document.createElement('div');
  ov.className = 'refine-scrim';
  ov.innerHTML = `
    <div class="refine-card">
      <div class="refine-name">${escapeHtml(mv.name)}${st&&stonePlus(st)?`<span class="plus-mark big">${UPGRADE_MARKS[stonePlus(st)].trim()}</span>`:''}</div>
      <div class="refine-sub">${mv.slot} · ${mv.words} words</div>
      <div class="move-info-body">${moveDescription(mv, mon, atk)}</div>
      <div style="display:flex;gap:10px;margin-top:14px;">
        <button class="btn btn-ghost" id="miBack" style="flex:1;">Back</button>
        ${st ? `<button class="btn btn-primary" id="miRefine" style="flex:1;">Refine…</button>` : ''}
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
  ov.querySelector('#miBack').addEventListener('click', close);
  const rf = ov.querySelector('#miRefine');
  if(rf) rf.addEventListener('click', ()=>{ close(); openRefineSheet(st, mon); });
}

function crownBlock(m){
  if(isPassenger(m)) return '';
  const owned = state.inventory.crowns||0;
  /* Only where it matters: the road past 100 is Region 5's. */
  const past100 = levelCap() > CROWN_GATE;
  if(isCrowned(m)){
    return `<div class="crown-panel crowned">
      <div class="crown-title">${crownIcon(18)} Crowned</div>
      <div class="crown-sub">${baseTier(m.species)==='legendary'
        ? 'Carries three extra evolutions\' worth of strength.'
        : 'Raised to legendary growth, with the legendary protein cap.'}${past100
        ? ` It can grow past level ${CROWN_GATE}.` : ''}</div>
    </div>`;
  }
  const ok = crownEligible(m);
  const why = ok ? '' : crownBlockReason(m);
  /* A wild monster can't wear one: say so plainly, and nothing more. */
  if(!CROWN_TIERS.includes(baseTier(m.species))){
    return past100 ? `<div class="crown-panel">
      <div class="crown-title">${crownIcon(18)} No Crown</div>
      <div class="crown-sub">Only starters, elites and legendaries can wear a Crown, so a wild monster's road ends at level ${CROWN_GATE}.</div>
    </div>` : '';
  }
  return `<div class="crown-panel wide">
    <div class="cp-art">${crownIcon(62)}</div>
    <div class="cp-text">
    <div class="crown-title">Crown <span>${owned} held</span></div>
    <div class="crown-sub">${baseTier(m.species)==='legendary'
      ? 'Would grant three more evolutions\' worth of strength.'
      : 'Would raise this monster to legendary growth and unlock the legendary protein cap.'}${past100
      ? ` Only a crowned monster grows past level ${CROWN_GATE}.` : ''}</div>
    ${ok && owned>0
      ? `<button class="btn btn-primary" id="useCrown" style="margin-top:10px;">Use a Crown</button>`
      : `<div class="crown-why">${owned>0 ? escapeHtml(why) : 'You have no Crowns.'}</div>`}
    </div>
  </div>`;
}

function confirmCrown(m){
  const legendary = baseTier(m.species)==='legendary';
  const before = monAtk(m);
  const after = computeAtk(m.species, m.level, m.supplements, Object.assign({}, m, {crowned:true}));
  confirmDialogHtml(
    `Crown <b>${escapeHtml(displayName(m))}</b>?<br><br>` +
    (legendary
      ? `It gains three more evolutions' worth of strength.`
      : `It rises to <b>legendary growth</b>, and its protein cap goes from ${proteinCap(m.species,m)} to 10 — ` +
        `so it will need more Supplements to fill again.`) +
    `<br><br>ATK <b>${before} → ${after}</b><br><br>` +
    `<i>Crowns are rare. This cannot be undone.</i>`,
    async ()=>{
      if((state.inventory.crowns||0) < 1){ toast('You have no Crowns.'); return; }
      const snapshot = state.inventory.crowns;
      state.inventory.crowns--;
      m.crowned = true;
      m.currentHp = Math.min(monMaxHp(m), m.currentHp + (monMaxHp(m) - Math.ceil(monMaxHp(m)/1.2)));
      const sv = showSyncingOverlay('Syncing…');
      const okc = await saveProfile({ awaitCloud:true });
      hideSyncingOverlay(sv);
      if(!okc){ state.inventory.crowns = snapshot; m.crowned = false; showSyncFailure(); return; }
      // Crowning deserves the full transformation, not just a sound.
      playEvolutions([{ uid:m.uid, species:m.species, name:displayName(m), crowned:true,
                        from:m.level, to:m.level, evos:[m.level], newMoves:[] }], ()=>{
        toast(`✦ ${displayName(m)} is crowned!`);
        renderStats();
      });
    }, 'Crown');
}

/* Developer only (companion pairs, phase 2 — 2.84): give a party monster the
   core of one in storage, skipping the Crown and the core slot that bonding
   for real asks for (2.86, below), so any pair can be tried in battle. A
   storage monster another leader already holds is not offered. */
function devCompanionRow(m){
  const held = new Set(state.party.filter(p=> p !== m && p.companionUid).map(p=> p.companionUid));
  const pool = (state.storage || []).filter(s=> !isPassenger(s) && !held.has(s.uid));
  return `<div class="dev-btns" style="margin-top:6px;align-items:center;flex-wrap:wrap;">
    <span style="font-size:12px;font-weight:800;">🤝 Any core (dev)</span>
    <select id="devComp" style="flex:1;min-width:150px;padding:7px;border-radius:9px;border:2px solid var(--line);background:#fff9ec;font-weight:700;">
      <option value="">— none —</option>
      ${pool.map(s=>`<option value="${s.uid}" ${m.companionUid === s.uid ? 'selected' : ''}>${escapeHtml(displayName(s))} · Lv ${s.level}</option>`).join('')}
    </select>
  </div>`;
}
/* ============================================================
   COMPANION CORES — bonding for real (2.86; handover/07, phase 3)
   A CROWNED party monster can learn to hold the core of one monster from
   storage: its companion. What it can hold is set by its CORE SLOT
   (m.coreSlot), a tiered upgrade trained with the Monkey King:
   wild → starter → elite → legendary. A slot holds a core of its own tier or
   lower, by the companion's SPECIES tier (the Mouse, 'special', holds as a
   starter; seeds, eggs and babies are never companions, nor is a legendary
   whose own core is still stolen). Each tier is learned by sparring with the
   Monkey King, and only that way (2.87): five spars, the monster alone with a
   borrowed companion, all five to win — its medals are paid only then:
   failing costs practice, not medals, and leaves the monster as it was. One
   leader per companion; changing companions is free; a companion
   brought into the party lets go of its bond. Until the Region 5 ending sets
   state.companionsUnlocked, all of it is the developer profile's alone.
   ============================================================ */
const CORE_SLOTS = ['wild', 'starter', 'elite', 'legendary'];
/* mkStone: what the Monkey King carries into the spars for that slot — none at
   Wild, then Counter +, Diamond Dust +, Diamond Dust ✦ (whose "one of your
   choosing" he chooses at random, with the random one beside it). */
const CORE_SLOT_DEF = {
  wild:      { label:'Wild',      holds:'wild monsters',                      price:{ silver:10 } },
  starter:   { label:'Starter',   holds:'wild monsters and starters',         price:{ silver:25 },          mkStone:{ type:'Physical', plus:1 } },
  elite:     { label:'Elite',     holds:'wild monsters, starters and elites', price:{ silver:25, gold:25 }, mkStone:{ type:'Fairy', plus:1 } },
  legendary: { label:'Legendary', holds:'any monster at all',                 price:{ silver:40, gold:50 }, mkStone:{ type:'Fairy', plus:2 } },
};
/* The tier a monster's core counts as: its species', the Mouse a starter. */
function coreTierOf(m){ const t = baseTier(m.species); return t === 'special' ? 'starter' : t; }
function coreRank(m){ return CORE_SLOTS.indexOf(coreTierOf(m)); }
function slotRank(m){ return (m && m.coreSlot) ? CORE_SLOTS.indexOf(m.coreSlot) : -1; }
function nextCoreSlot(m){ return CORE_SLOTS[slotRank(m) + 1] || null; }
/* Who may hold a core: a crowned monster of the party (the Whalelord too,
   once the story crowns him). */
function canLead(m){ return !!m && !isPassenger(m) && isCrowned(m); }
function canHoldCore(leader, c){ return !!leader && !!c && coreRank(c) >= 0 && slotRank(leader) >= coreRank(c); }
function leaderOf(c){
  if(!c) return null;
  return (state.party || []).concat(state.storage || []).find(m=> m.companionUid === c.uid) || null;
}
function coreFind(uid){ return (state.party || []).concat(state.storage || []).find(m=> m.uid === uid) || null; }
function priceHtml(price){
  return Object.entries(price).map(([cur, n])=> `${curIcon(cur)} ${n}`).join(' · ');
}
function canAffordPrice(price){ return Object.entries(price).every(([cur, n])=> medalCount(cur) >= n); }

/* ---------- the screen: every leader, its slot, its companion ---------- */
let _compCssDone = false;
function companionsCss(){
  if(_compCssDone || typeof document === 'undefined') return;
  _compCssDone = true;
  const st = document.createElement('style');
  st.id = 'companionsCss';
  st.textContent = `
  .comp-card{ margin-bottom:10px; }
  .comp-card.dim{ opacity:.72; }
  .core-line{ display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;font-weight:800;color:var(--ink-soft); }
  .core-pips{ display:inline-flex;gap:3px; }
  .core-pips i{ width:9px;height:9px;border-radius:50%;background:var(--paper-3);border:1px solid rgba(35,32,25,.25);display:inline-block; }
  .core-pips i.on{ background:var(--gold);border-color:#9a7424; }
  .comp-holds{ font-size:11px;color:var(--ink-soft);font-weight:600;margin-top:2px;line-height:1.35; }
  .comp-with{ display:flex;align-items:center;gap:10px;margin-top:10px;padding:8px 10px;border-radius:12px;
    background:rgba(90,150,110,.12);border:1px dashed rgba(60,120,80,.45); }
  .comp-with.empty{ background:transparent;border-color:rgba(35,32,25,.25); }
  .comp-with .cw-name{ flex:1;min-width:0;font-family:'Baloo 2',cursive;font-weight:800;font-size:14px; }
  .comp-with .cw-name small{ display:block;font-family:inherit;font-size:11px;color:var(--ink-soft);font-weight:700; }
  .core-train{ display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;margin-top:8px; }
  .core-train b{ white-space:nowrap; }
  .comp-note{ font-size:11px;font-weight:700;color:var(--ink-soft);margin-top:8px;line-height:1.4; }
  .comp-tag{ display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:800;color:#3c7a50;margin-top:3px; }
  .cc-opt{ margin-bottom:8px;display:flex;align-items:center;gap:10px;justify-content:flex-start;text-align:left; }
  .cc-opt .cc-txt{ flex:1;min-width:0; }
  .cc-opt small{ display:block;font-size:11px;font-weight:700;color:var(--ink-soft); }
  .cc-opt:disabled{ opacity:.5; }
  .core-price{ margin-top:12px;font-weight:800;font-size:14px; }
  .core-short{ margin-top:6px;font-size:12px;font-weight:800;color:var(--cinnabar-dark); }
  .core-choice{ display:flex;flex-direction:column;gap:8px;margin-top:14px; }
  .core-choice .btn small{ display:block;font-size:11px;font-weight:700;opacity:.85;margin-top:2px; }
  .spar-head{ display:flex;align-items:center;gap:12px;margin:8px 0 6px; }
  .spar-pips{ display:flex;gap:5px;margin-top:4px; }
  .spar-pips i{ width:12px;height:12px;border-radius:50%;background:var(--paper-3);border:1px solid rgba(35,32,25,.3);display:inline-block; }
  .spar-pips i.won{ background:var(--jade);border-color:var(--jade-dark); }
  .spar-pips i.now{ background:#fff;border:2px solid var(--gold); }
  .spar-cards{ display:flex;flex-direction:column;gap:10px;margin-top:10px; }
  .spar-card{ display:flex;gap:12px;align-items:flex-start;text-align:left;width:100%;padding:12px;border-radius:16px;cursor:pointer;
    background:var(--paper-2);border:2px solid var(--line);box-shadow:0 3px 0 var(--paper-3);font:inherit;color:inherit; }
  .spar-card:disabled{ cursor:default; }
  .spar-card.mine{ border-color:var(--jade);background:rgba(90,150,110,.14); }
  .spar-card.his{ border-color:#b07a3a;background:rgba(176,122,58,.12); }
  .spar-card.out{ opacity:.45; }
  .spar-card .sc-art{ flex:0 0 auto; }
  .spar-card .sc-text{ flex:1;min-width:0; }
  .spar-card .sc-name{ font-family:'Baloo 2',cursive;font-weight:800;font-size:16px;line-height:1.2; }
  .spar-card .sc-name small{ display:inline-block;vertical-align:1px; }
  .spar-card .sc-line{ font-size:12px;font-weight:700;color:var(--ink-soft);line-height:1.4;margin-top:4px; }
  .spar-card .sc-vs{ font-size:11px;font-weight:800;color:#6a4ab0;margin-top:5px; }
  .spar-card .sc-tag{ display:inline-block;margin-top:6px;font-size:11px;font-weight:800;color:#fff;background:var(--jade);border-radius:20px;padding:2px 9px; }
  .spar-card .sc-tag.his{ background:#b07a3a; }
  .spar-stone{ margin-top:8px;padding:9px 12px;border-radius:12px;background:rgba(176,122,58,.10);border:1px dashed rgba(176,122,58,.55);
               font-size:12px;font-weight:700;line-height:1.45;color:var(--ink-soft); }
  .spar-stone b{ color:var(--ink); }`;
  document.head.appendChild(st);
}
function corePips(m){
  const r = slotRank(m);
  return `<span class="core-pips" title="Core slot">${CORE_SLOTS.map((t, i)=> `<i class="${i <= r ? 'on' : ''}"></i>`).join('')}</span>`;
}
function renderCompanions(){
  if(!companionsUnlocked()) return go('party');
  setScreenBg('home');
  $('#brandSub').textContent = 'Companions';
  companionsCss();
  const med = state.medals || {};
  const leaders = battleParty();
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Party</button>
    <div class="screen-title">Companions</div>
    <div class="screen-sub">A crowned monster can hold the core of one monster from your storage, and call it out in battle. The Monkey King trains its core slot.</div>
    <div class="medal-bar" style="margin-bottom:12px;"><span>🥈 ${med.silver || 0}</span><span>🥇 ${med.gold || 0}</span><span>${crownIcon(16)} ${state.inventory.crowns || 0}</span></div>
    <div id="compList">${leaders.map(companionCardHtml).join('')}</div>`;
  $('#backBtn').addEventListener('click', ()=> go('party'));
  const list = $('#compList');
  list.querySelectorAll('[data-choose]').forEach(b=> b.addEventListener('click', ()=>{
    const L = coreFind(b.dataset.choose); if(L) chooseCompanionFor(L); }));
  list.querySelectorAll('[data-letgo]').forEach(b=> b.addEventListener('click', ()=>{
    const L = coreFind(b.dataset.letgo); if(L) letGoCompanion(L); }));
  list.querySelectorAll('[data-train]').forEach(b=> b.addEventListener('click', ()=>{
    const L = coreFind(b.dataset.train); if(L) openCoreTraining(L); }));
}
function companionCardHtml(L){
  const head = `<div class="party-head" style="cursor:default;">
      ${monPortrait(L.species, 48, { stage:monStage(L), crowned:isCrowned(L) })}
      <div style="flex:1;min-width:0;">
        <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;">${escapeHtml(displayName(L))}${crownMark(L)} <span style="font-size:12px;color:var(--ink-soft);">Lv ${L.level}</span></div>
        ${L.coreSlot ? `<div class="core-line">${corePips(L)} ${CORE_SLOT_DEF[L.coreSlot].label} core slot</div>
          <div class="comp-holds">Holds ${CORE_SLOT_DEF[L.coreSlot].holds}.</div>`
          : isCrowned(L) ? `<div class="core-line">${corePips(L)} No core slot yet</div>` : ''}
      </div>
    </div>`;
  if(!isCrowned(L)){
    const note = !CROWN_TIERS.includes(baseTier(L.species))
      ? 'A wild monster can\'t wear a Crown, so it can\'t hold a core.'
      : (SPECIES[L.species] || {}).storyCrownOnly ? 'Its own core must come home, and the Crown with it, before it can hold another\'s.'
      : 'Needs a Crown before it can hold another monster\'s core.';
    return `<div class="party-card comp-card dim">${head}<div class="comp-note">${crownIcon(14)} ${note}</div></div>`;
  }
  const c = companionOf(L);
  const next = nextCoreSlot(L);
  const withRow = !L.coreSlot ? ''
    : c ? `<div class="comp-with">
        ${monPortrait(c.species, 36, { stage:monStage(c), crowned:isCrowned(c) })}
        <div class="cw-name">🤝 ${escapeHtml(displayName(c))}<small>Lv ${c.level} · its companion</small></div>
        <button class="mini-btn" style="flex:0 0 auto;min-width:0;" data-choose="${L.uid}">Change</button>
        <button class="mini-btn" style="flex:0 0 auto;min-width:0;" data-letgo="${L.uid}">Let go</button>
      </div>`
    : `<div class="comp-with empty">
        <div class="cw-name" style="color:var(--ink-soft);font-size:13px;">No companion yet</div>
        <button class="mini-btn" style="flex:0 0 auto;min-width:0;" data-choose="${L.uid}">🤝 Choose one</button>
      </div>`;
  const train = next
    ? `<button class="mini-btn core-train" data-train="${L.uid}">
        <span>🐒 Train ${/^[AEIOU]/.test(CORE_SLOT_DEF[next].label) ? 'an' : 'a'} ${CORE_SLOT_DEF[next].label} slot</span><b>${priceHtml(CORE_SLOT_DEF[next].price)}</b></button>`
    : `<div class="comp-note">The highest slot there is: it can hold any monster's core.</div>`;
  return `<div class="party-card comp-card">${head}${withRow}${train}</div>`;
}

/* ---------- choosing a companion ---------- */
function companionOptions(L){
  return (state.storage || []).filter(c=> c !== L && !isPassenger(c)).map(c=>{
    const lead = leaderOf(c);
    let why = '';
    if(c.companionUid && companionOf(c)) why = `holds ${displayName(companionOf(c))}'s core itself`;
    else if(coreStolen(c)) why = 'its own core was stolen — it has none to share yet';
    else if(!canHoldCore(L, c)) why = `needs ${/^[AEIOU]/.test(CORE_SLOT_DEF[coreTierOf(c)].label) ? 'an' : 'a'} ${CORE_SLOT_DEF[coreTierOf(c)].label} slot`;
    return { c, lead:(lead && lead !== L) ? lead : null, mine:lead === L, why };
  }).sort((a, b)=> (!!a.why - !!b.why) || (b.c.level - a.c.level));
}
function chooseCompanionFor(L){
  if(!canLead(L) || !L.coreSlot) return;
  companionsCss();
  const opts = companionOptions(L);
  const any = opts.some(o=> !o.why && !o.mine);
  const scrim = document.createElement('div');
  scrim.className = 'comp-chooser';
  scrim.style.cssText = 'position:fixed;inset:0;background:rgba(35,32,25,0.55);z-index:70;display:flex;align-items:flex-end;justify-content:center;';
  scrim.innerHTML = `<div style="background:var(--paper);border-radius:18px 18px 0 0;padding:20px;max-width:480px;width:100%;max-height:82vh;overflow-y:auto;">
    <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:17px;">A companion for ${escapeHtml(displayName(L))}</div>
    <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin:2px 0 12px;">${CORE_SLOT_DEF[L.coreSlot].label} slot · holds ${CORE_SLOT_DEF[L.coreSlot].holds}</div>
    ${opts.length ? opts.map((o, i)=> `<button class="btn btn-ghost cc-opt" data-i="${i}" ${(o.why || o.mine) ? 'disabled' : ''}>
        ${monPortrait(o.c.species, 36, { stage:monStage(o.c), crowned:isCrowned(o.c) })}
        <span class="cc-txt">${escapeHtml(displayName(o.c))} · Lv ${o.c.level}
          <small>${o.mine ? 'its companion now' : o.why ? escapeHtml(o.why) : o.lead ? `with ${escapeHtml(displayName(o.lead))} now — it would move` : `${CORE_SLOT_DEF[coreTierOf(o.c)].label} core`}</small></span>
      </button>`).join('')
      : `<div class="comp-note" style="margin-bottom:10px;">Nobody is in storage. A companion comes from your storage, never the party.</div>`}
    ${opts.length && !any ? `<div class="comp-note" style="margin-bottom:10px;">Nobody in storage can join yet.</div>` : ''}
    <button class="btn btn-ghost" id="ccCancel" style="margin-top:4px;">Cancel</button>
  </div>`;
  document.body.appendChild(scrim);
  const close = ()=>{ if(scrim.parentNode) document.body.removeChild(scrim); };
  scrim.querySelector('#ccCancel').addEventListener('click', close);
  scrim.addEventListener('click', e=>{ if(e.target === scrim) close(); });
  scrim.querySelectorAll('.cc-opt:not([disabled])').forEach(b=> b.addEventListener('click', ()=>{
    const o = opts[+b.dataset.i];
    close();
    if(o.lead) return confirmDialogHtml(
      `<b>${escapeHtml(displayName(o.c))}</b> is <b>${escapeHtml(displayName(o.lead))}</b>'s companion. ` +
      `Move it to <b>${escapeHtml(displayName(L))}</b>?`, ()=> bondCompanion(L, o.c), 'Move it');
    bondCompanion(L, o.c);
  }));
}
/* Bonding costs nothing and can be changed any time, so it saves as ordinary
   play does; only the slot's medals wait on the cloud. */
function bondCompanion(L, c){
  if(!canLead(L) || !canHoldCore(L, c) || !state.storage.includes(c) || coreStolen(c)) return;
  (state.party || []).concat(state.storage || []).forEach(m=>{ if(m !== L && m.companionUid === c.uid) delete m.companionUid; });
  L.companionUid = c.uid;
  saveProfile();
  playSfx('stone_veryhigh');
  toast(`🤝 ${displayName(L)} now holds ${displayName(c)}'s core.`);
  if(ui.screen === 'companions') renderCompanions(); else render();
}
function letGoCompanion(L){
  const c = companionOf(L);
  if(!c) return;
  confirmDialogHtml(`<b>${escapeHtml(displayName(L))}</b> lets go of <b>${escapeHtml(displayName(c))}</b>'s core? ` +
    `You can choose it again any time.`, ()=>{
      delete L.companionUid;
      saveProfile();
      toast(`${displayName(c)} rests in storage.`);
      renderCompanions();
    }, 'Let go');
}

/* ---------- training a slot: five spars with the Monkey King (2.87) ----------
   The monster being trained fights ALONE — the rest of the party is set aside
   for the spar (ui.realParty; savedProfile keeps writing the real one) — with
   a companion it borrows for that spar. Before each spar three monsters are
   drawn from the pool of the slot's tier; you choose one, and the Monkey King
   takes his favourite of the other two (never the same monster). He fights
   5 levels above the monster being trained, carrying his stone for the tier;
   both companions are at the trained monster's level, protein full. He calls
   his companion out as you call yours (THEIR COMPANION, 04). Win all five and
   the medals are paid and the slot is yours; lose one, or give up, and the
   training ends — nothing paid, the monster's health as it was before. No
   experience changes hands: sparring is practice. */
const SPAR_COUNT = 5;
/* The pools, the Monkey King's favourites first. One line each, what it does. */
const SPAR_POOLS = {
  wild: [
    ['cyclops',    'Bog Lurker: starts unseen, and slows the other side one step while it stands. Grave Quake: winds up, then 2× on both of theirs.'],
    ['crow',       'Dodges 20%. Ill Omen: a turn of 66% dodges, then its next blow +66%. Murder of Crows: 5 strikes, 10 on a foe under 30%.'],
    ['mantaray',   'Shadowed Wings: dodges 35% of attacks, and no Diamond Dust can sweep that away.'],
    ['ghost',      'Peekaboo: 50% chance to vanish after each attack. Wail: 0.9× on both, and weakens.'],
    ['strongman',  'Braced Stance: starts with 2 block. Bearhug: 1× with a 50% stun.'],
    ['boxer',      'Quick Hands: a free 0.25× jab at the start of every round. Knockout Flurry: 1× on both.'],
    ['weasel',     'Silk Reeling: a Counter stack — takes one whole attack at 80% less. Four Ounces: throws the last blow back.'],
    ['yoga',       'Stillness: dodges the first attack. Asana Flow: 6 strikes, doubled while at full health.'],
    ['whale',      'Bulk: starts with 2 block. Depth Charge: 1.5×.'],
    ['sea_turtle', 'Iron Shell: starts with 3 block. Whirlpool: 0.8× on both.'],
  ],
  starter: [
    ['ghost_starter',    'Shadow Sneak: starts unseen, and its first blow from hiding hits 1.5×. Umbral Rend Max: 1.5×.'],
    ['physical_starter', 'Savage Strike Max: 1.5×. Rend: 0.6× on both.'],
    ['psychic_starter',  'Mind Shatter Max: 1.5×. Psywave: 0.6× on both.'],
    ['flying_starter',   'Storm Dive Max: 1.5×. Gale Force: 0.6× on both.'],
    ['ground_starter',   'Horn Drill Max: 1.5×. Earthquake: 0.6× on both.'],
    ['fire_starter',     'Fire Blast Max: 1.5×. Flamethrower: 0.6× on both.'],
    ['water_starter',    'Waterfall Max: 1.5×. Surf: 0.6× on both.'],
    ['grass_starter',    'Solar Beam Max: 1.5×. Razor Leaf: 0.6× on both.'],
    ['electric_starter', 'Thunder Max: 1.5×. Thunderbolt: 0.6× on both.'],
  ],
  elite: [
    ['goblin',        "Goblin's Greed: every blow steals one of their buffs — even a Diamond Dust."],
    ['horned_lynx',   'Stalk: starts unseen, and can slip back into hiding. Pounce Max: 1.5×, and 1.5× again from hiding.'],
    ['thundercat',    'Lightning Cat: always acts first; on your side, a 20% chance to strike twice. Omnislash Max: 1.1× with a 65% splash.'],
    ['goblin_knight', 'Riposte: an attack that deals it nothing is answered at 0.4×. Grave Charge Max: 1.5×, and it strikes first.'],
    ['firehound',     'Terrorize: the other side hits 20% softer while it stands — no sweep lifts it. Fiery Jaws Max: 1.5×, holding its target fast.'],
    ['puppet',        'Marionette: vanishes after its first blow (33% after that), and heals a third of what it deals.'],
    ['ninja',         'Onkei-jutsu: starts unseen (80% dodge). Ansatsu Max spends it: 1.7×, +0.4× per Prep.'],
    ['loong',         'Soar: starts airborne (70% dodge). Dragon Dive Max spends it: 2× on both of theirs.'],
    ['moon_swan',     'Nocturne: each time it is driven below 75%, 50% and 25% health, it sings its attacker to sleep. Lunacy: 1.5×, and 25% of the time the other side is muddled for a swing.'],
    ['thunderhound',  "Hunter's Instinct: each time it is driven below 75%, 50% and 25% health, it stuns its attacker. Throat Take Max: 1.5×, doubled on a stunned foe."],
    ['otter',         'Guard: on guard, +1 block every round. Iaijutsu Max spends it: 1.8×, +0.25× per block.'],
    ['eagle',         'Keen Eye: acts first. Piercing Stoop: climbs up to 3 turns (dodging up to 75%), then drops straight through block.'],
    ['lizardape',     'Scaled Stance: starts with 1 block and a Counter stack. Primal Rend Max: 4 strikes, doubled at full health.'],
  ],
  legendary: [
    ['newt',          'Tachypsychia: for 3 turns it dodges 80% at first (30% after) and may act again (30%). Volt Concussion: 3 strikes, 20% paralysis each.'],
    ['water_dragon',  'Cataclysm: gathers charges, then spends them all in one huge blow. Tsunami: 0.8× on both.'],
    ['ankylosaurus',  'Steel Soul: it always takes 20% less. Once a fight, a quick cast before it swings: that turn it hits 1.2× — more for every other shield its side has up — and +0.1× a blow. Rampage Max: 5 strikes on both, then an Aftershock.'],
    ['phoenix',       'Incinerate Max: 1.5×, growing to 2.75× with up to 7 more words (15 in all). Nova: 1× on both — and it sweeps away one of your buffs and burns one of your marks off its side.'],
    ['caladrius',     'Pacificus: half the attack, one and a half times the health. Vita: a healing light for your side. Conversio: brings the fallen back.'],
    ['forest_fairy',  'Verdant Wrath Max: 1.8× over 3 strikes. Giga Drain: 0.8×, and it heals. Overgrowth: 0.7× on both.'],
  ],
};
/* How the Monkey King's companion fights: at random, as he does — or by its
   own story AI where it has one (the Water Dragon charges, the Ankylosaurus
   opens with Steel Soul, the Eagle climbs). */
const SPAR_FOE_AI = { water_dragon:'cataclysm', ankylosaurus:'ankylo', eagle:'stoop' };
function sparLine(tier, sp){ const r = (SPAR_POOLS[tier] || []).find(x=> x[0] === sp); return r ? r[1] : ''; }
/* How a monster and the Monkey King meet, by type: what its blows do to him,
   and what his do to it (only what is not even). */
function sparMatchup(sp){
  const mk = SPECIES.monkey_king.types, t = SPECIES[sp].types;
  const out = [];
  const give = typeMultiplier(t, mk), take = typeMultiplier(mk, t);
  if(give > 1) out.push('💥 hits the Monkey King 1.5×');
  if(give < 1) out.push('his Fairy side shrugs off its blows (⅔)');
  if(take > 1) out.push('⚠️ takes 1.5× from his blows');
  if(take < 1) out.push('🛡 takes only ⅔ from his blows');
  return out.join(' · ');
}
function drawSparTrio(tier){ return shuffle((SPAR_POOLS[tier] || []).map(r=> r[0])).slice(0, 3); }
/* His favourite of what is left: the first in his pool's order. */
function monkeyKingPick(tier, left){
  const order = (SPAR_POOLS[tier] || []).map(r=> r[0]);
  return left.slice().sort((a, b)=> order.indexOf(a) - order.indexOf(b))[0] || left[0];
}
const MK_STONE_NAME = { starter:'Counter +', elite:'Diamond Dust +', legendary:'Diamond Dust ✦' };
/* What he carries at each tier, and what it asks of a pick (2.88) — shown on
   the draft, so the choosing is about something. Mechanics first. */
const MK_STONE_LESSON = {
  wild:      `<b>No stone yet</b> — but he fights 5 levels up. Types matter: a Ghost takes only ⅔ of his blows, and Steel hits his Fairy side 1.5×.`,
  starter:   `<b>Counter +</b>, raised on his first move, with a 15% chance each round of another. A stack takes one whole attack — every strike of it — at 80% less, and then he hits 25% harder next time and 20% harder for good. Feed it a cheap blow before a big one.`,
  elite:     `<b>Diamond Dust +</b>: up as he arrives, and cast again on his first move (5 rounds from then) with one random Very High at + strength. While it is up nothing of yours takes hold — no hiding, flying, guard or block, no stone, no stun or sleep on him. Terrorize still works, and so does moving first. A Goblin's Greed can steal the dust — and keep it.`,
  legendary: `<b>Diamond Dust ✦</b>: up as he arrives, and cast again on his first move (5 rounds from then) with two Very Highs at ✦ strength. While it is up nothing of yours takes hold — no Tachypsychia, no Steel Soul, no stone, no stun on him — but heals and Conversio still work, and Steel still hits him 1.5×.`,
};

function openCoreTraining(L){
  const tier = nextCoreSlot(L);
  if(!tier || !canLead(L)) return;
  const def = CORE_SLOT_DEF[tier];
  const afford = canAffordPrice(def.price);
  const med = state.medals || {};
  const nm = escapeHtml(displayName(L));
  document.body.classList.remove('writing');
  document.body.classList.add('in-scene');
  window.scrollTo(0, 0);
  $('#brandSub').textContent = 'Core training';
  const first = !L.coreSlot;
  screenEl.innerHTML = `
    <div class="scene">
      <div class="scene-emblem">${monPortrait('monkey_king', 140, { view:'front', bare:true, stage:1 })}</div>
      <div class="scene-title">The Monkey King</div>
      <div class="scene-body">
        <p>${first
          ? `"To hold another's core is not strength, small one. It is <b>focus</b> — carrying what is not yours, and not letting it fall. Two can fight as one. It took me a long time to learn that."`
          : `"Heavier, this time. Show me the focus holds."`}</p>
        <p><b>Five spars.</b> ${nm} fights alone, with a companion you choose before each one; the Monkey King takes his favourite of the other two. <b>Win all five</b> and ${nm} can hold ${/^[AEIOU]/.test(def.label) ? 'an' : 'a'} <b>${def.label}</b> core: ${def.holds}.</p>
        <p style="font-size:13px;color:var(--ink-soft);">He fights at Lv ${Math.min(LEVEL_MAX, L.level + 5)} (5 above ${nm})${MK_STONE_NAME[tier] ? `, carrying <b>${MK_STONE_NAME[tier]}</b>` : ', with no stone yet'}. Both companions are Lv ${L.level}. Lose a spar and the training ends — nothing paid, ${nm} as it was.</p>
        <p style="font-size:13px;color:var(--ink-soft);">${revisionWords().length
          ? `Every word in the spars is one you have learned to 🥈 silver or 🥇 gold, from any list — <b>${revisionWords().length}</b> of them.`
          : `Once a word reaches 🥈 silver, the spars test the words you have learned, from every list.`}</p>
        <div class="core-price">${priceHtml(def.price)} <span style="font-size:12px;color:var(--ink-soft);">— paid when all five are won</span></div>
        ${afford ? '' : `<div class="core-short">You have 🥈 ${med.silver || 0} · 🥇 ${med.gold || 0}. Come back with more medals.</div>`}
      </div>
      <div class="core-choice">
        <button class="btn btn-primary" id="ctBegin" ${afford ? '' : 'disabled'}>⚔️ Begin — spar 1 of ${SPAR_COUNT}</button>
        <button class="btn btn-ghost" id="ctBack">Not now</button>
      </div>
    </div>`;
  const leave = ()=> document.body.classList.remove('in-scene');
  $('#ctBack').addEventListener('click', ()=>{ leave(); go('companions'); });
  const bg = $('#ctBegin');
  if(bg) bg.addEventListener('click', ()=>{ if(!canAffordPrice(def.price)) return; leave(); beginCoreSession(L, tier); });
}
function beginCoreSession(L, tier){
  if(revisionPool().length === 0){ ui.prevScreen = 'companions'; toast('No words selected, please select to proceed.'); go('spelling'); return; }
  ui.coreSession = { uid:L.uid, tier, n:1, wins:0, hp:L.currentHp, draw:null, mine:null, his:null };
  go('coreSpar');
}
/* The session is over, however it ended: the monster's health as it was. */
function endCoreSession(){
  const s = ui.coreSession;
  ui.coreSession = null;
  if(!s) return;
  const L = coreFind(s.uid);
  if(L && s.hp != null) L.currentHp = Math.max(0, Math.min(monMaxHp(L), s.hp));
  saveProfile();
}
/* Before each spar: the draw, your pick, his. */
function renderCoreSpar(){
  const s = ui.coreSession;
  if(!s) return go('companions');
  const L = coreFind(s.uid);
  if(!L || !state.party.includes(L)){ endCoreSession(); return go('companions'); }
  setScreenBg('challenge');
  $('#brandSub').textContent = 'Core training';
  companionsCss();
  if(!s.draw) s.draw = drawSparTrio(s.tier);
  const nm = escapeHtml(displayName(L));
  const pips = Array.from({ length:SPAR_COUNT }, (_, i)=> `<i class="${i < s.wins ? 'won' : i === s.wins ? 'now' : ''}"></i>`).join('');
  const card = (sp)=>{
    const who = sp === s.mine ? 'mine' : sp === s.his ? 'his' : (s.mine ? 'out' : '');
    const stage = evolutionStage(sp, L.level);
    return `<button class="spar-card ${who}" data-sp="${sp}" ${s.mine ? 'disabled' : ''}>
      <div class="sc-art">${monPortrait(sp, 56, { view:'front', bare:true, stage })}</div>
      <div class="sc-text">
        <div class="sc-name">${escapeHtml(SPECIES[sp].name)} <small>${typeBadges(sp)}</small></div>
        <div class="sc-line">${escapeHtml(sparLine(s.tier, sp))}</div>
        ${sparMatchup(sp) ? `<div class="sc-vs">${sparMatchup(sp)}</div>` : ''}
        ${who === 'mine' ? `<div class="sc-tag">✓ ${nm}'s companion</div>` : who === 'his' ? `<div class="sc-tag his">🐒 The Monkey King's</div>` : ''}
      </div>
    </button>`;
  };
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Leave the training</button>
    <div class="spar-head">
      ${monPortrait('monkey_king', 52, { view:'front', bare:true, stage:1 })}
      <div style="flex:1;min-width:0;">
        <div class="screen-title" style="margin:0;">Spar ${s.n} of ${SPAR_COUNT}</div>
        <div class="spar-pips" title="${s.wins} won">${pips}</div>
      </div>
    </div>
    <div class="screen-sub">${s.mine
      ? `The Monkey King takes the <b>${escapeHtml(SPECIES[s.his].name)}</b>. ${nm} fights with the <b>${escapeHtml(SPECIES[s.mine].name)}</b> — summon it in battle (4 words).`
      : `Choose ${nm}'s companion for this spar. The Monkey King then takes his favourite of the other two.`}</div>
    <div class="spar-cards">${s.draw.map(card).join('')}</div>
    ${MK_STONE_LESSON[s.tier] ? `<div class="spar-stone">🐒 ${MK_STONE_LESSON[s.tier]}</div>` : ''}
    ${s.mine ? `<button class="btn btn-primary" id="sparFight" style="margin-top:12px;">⚔️ Fight — spar ${s.n} of ${SPAR_COUNT}</button>` : ''}`;
  $('#backBtn').addEventListener('click', ()=>{
    confirmDialogHtml(`Leave the training? ${s.wins ? `The ${s.wins} spar${s.wins === 1 ? '' : 's'} won so far won't count, and` : ''} nothing is paid.`,
      ()=>{ endCoreSession(); go('companions'); }, 'Leave');
  });
  screenEl.querySelectorAll('.spar-card:not([disabled])').forEach(b=> b.addEventListener('click', ()=>{
    if(s.mine) return;
    s.mine = b.dataset.sp;
    s.his = monkeyKingPick(s.tier, s.draw.filter(x=> x !== s.mine));
    playSfx('ui_click');
    renderCoreSpar();
  }));
  const fb = $('#sparFight');
  if(fb) fb.addEventListener('click', coreSparFight);
}
function coreSparFight(){
  const s = ui.coreSession;
  if(!s || !s.mine || !s.his) return;
  const L = coreFind(s.uid);
  if(!L || !state.party.includes(L)){ endCoreSession(); return go('companions'); }
  if(revisionPool().length === 0){ ui.prevScreen = 'coreSpar'; toast('No words selected, please select to proceed.'); go('spelling'); return; }
  const lv = L.level;
  const comp = newMonster(s.mine, lv);
  comp.uid = 'spar_' + s.mine + '_' + Date.now();
  comp.supplements = proteinCap(s.mine, comp);
  comp.currentHp = monMaxHp(comp);
  L.currentHp = monMaxHp(L);                                 // every spar starts fresh
  const def = CORE_SLOT_DEF[s.tier];
  const mk = { species:'monkey_king', level:Math.min(LEVEL_MAX, lv + 5), ai:'random', nerfed:false };
  if(def.mkStone) mk.veryHigh = { type:def.mkStone.type, plus:def.mkStone.plus, cast:true };
  if(!ui.realParty) ui.realParty = state.party;              // only the monster in training fights
  state.party = [L];
  beginBattle({ isNpc:true, name:'The Monkey King', coreSpar:{ uid:L.uid, tier:s.tier, companion:comp },
    waves:[[mk]] });
  const b = ui.battle;
  const foe = makeEnemy(s.his, lv, { nerfed:false, ai:SPAR_FOE_AI[s.his] || 'random', supplements:proteinCap(s.his) + 2 });
  b.foePair = { leader:b.enemies[0], mon:foe, turnsLeft:COMPANION.turns, out:false, fallen:false, summons:0 };
}
/* The battle is over (won, lost or given up): the party back as it was. */
function sparCleanup(){
  const b = ui.battle;
  restoreRealParty();
  if(b){ b.coreSpar = null; b.foePair = null; }
  stopMusic();
}
function coreSparWon(){
  const s = ui.coreSession;
  sparCleanup();
  const brk = tallyBattleForEyeBreak();
  if(!s){ go('companions'); if(brk) showEyeBreak(); return; }
  s.wins++;
  if(s.wins >= SPAR_COUNT){ coreTrainingPassed(s.uid, s.tier); if(brk) showEyeBreak(); return; }
  const n = s.n;
  s.n++; s.draw = null; s.mine = null; s.his = null;
  go('coreSpar');
  challengeResult('⚔️', `Spar ${n} won!`,
    `The Monkey King grins and shakes out his arms. "${['Again.', 'Good. Again.', 'Better. Again.', 'One more.'][Math.min(3, s.wins - 1)]}"` +
    `<br><br><b>${s.wins} of ${SPAR_COUNT}</b> won — ${SPAR_COUNT - s.wins} to go. New companions to choose from next time.`, 'coreSpar');
  if(brk) showEyeBreak();
}
/* A spar lost, or given up: the training ends, nothing paid. */
function coreSparEnded(how){
  const s = ui.coreSession;
  const won = s ? s.wins : 0;
  const L = s ? coreFind(s.uid) : null;
  sparCleanup();
  const brk = how === 'lost' ? tallyBattleForEyeBreak() : false;
  endCoreSession();
  go('companions');                              // off the battle screen for good
  challengeResult('🐒', how === 'lost' ? 'Not yet' : 'You step back',
    `${how === 'lost' ? 'The Monkey King helps you up.' : 'The Monkey King lowers his staff.'} "Again, when you are ready."` +
    `<br><br>You won <b>${won} of ${SPAR_COUNT}</b>. Nothing was paid${L ? `, and ${escapeHtml(displayName(L))} is just as it was` : ''}.`, 'companions');
  if(brk) showEyeBreak();
}
/* All five won: the medals, and the slot. */
async function coreTrainingPassed(uid, tier){
  endCoreSession();
  go('companions');                              // off the battle screen for good
  const L = coreFind(uid);
  const def = CORE_SLOT_DEF[tier];
  if(!L || slotRank(L) >= CORE_SLOTS.indexOf(tier)) return;
  if(!canAffordPrice(def.price)){
    return challengeResult('🐒', 'So close',
      `"You have the focus. Now bring the medals." It costs ${priceHtml(def.price)}.`, 'companions');
  }
  const medals = Object.assign({}, state.medals);
  const was = L.coreSlot;
  Object.entries(def.price).forEach(([cur, n])=>{ state.medals[cur] -= n; });
  L.coreSlot = tier;
  const sv = showSyncingOverlay('Syncing…');
  const ok = await saveProfile({ awaitCloud:true });
  hideSyncingOverlay(sv);
  if(!ok){
    state.medals = medals;
    if(was) L.coreSlot = was; else delete L.coreSlot;
    showSyncFailure(); return;
  }
  playSfx('evolution');
  const nm = escapeHtml(displayName(L));
  challengeResult('🐒', `${def.label} core slot!`,
    `Five of five. The Monkey King nods. "${tier === 'legendary' ? 'Any core at all, now. I could not have taught this once. I thought I needed no one.' : 'Good. It holds.'}"` +
    `<br><br><b>${nm}</b> can hold ${def.holds === 'any monster at all' ? 'any monster\'s core' : `the core of ${def.holds}`}. ` +
    `Paid ${priceHtml(def.price)}.` + (companionOf(L) ? '' : `<br><br>Choose its companion on the Companions page.`), 'companions');
}

/* ---------- elsewhere: the party, storage and Stats pages ---------- */
/* One line on a party card: who it holds. */
function partyCompanionLine(m){
  if(!companionsUnlocked() || isPassenger(m)) return '';
  const c = companionOf(m);
  if(c) return `<div class="comp-tag">🤝 ${escapeHtml(displayName(c))} <span style="color:var(--ink-soft);">· Lv ${c.level}</span></div>`;
  return m.coreSlot ? `<div class="comp-tag" style="color:var(--ink-soft);">🤝 ${CORE_SLOT_DEF[m.coreSlot].label} slot · no companion</div>` : '';
}
/* On a storage card: whose companion it is. */
function storageCompanionLine(m){
  if(!companionsUnlocked()) return '';
  const L = leaderOf(m);
  return L ? `<div class="comp-tag">🤝 with ${escapeHtml(displayName(L))}</div>` : '';
}
/* The panel on a Stats page. */
function companionPanel(m){
  if(!companionsUnlocked() || isPassenger(m)) return '';
  const L = leaderOf(m);
  if(L) return `<div class="crown-panel" style="background:rgba(90,150,110,.12);border-color:rgba(60,120,80,.45);">
      <div class="crown-title">🤝 Companion</div>
      <div class="crown-sub">${escapeHtml(displayName(L))} holds its core, and can call it out in battle.</div></div>`;
  if(!isCrowned(m)) return '';
  const c = companionOf(m);
  const inParty = state.party.includes(m);
  return `<div class="crown-panel" style="background:rgba(90,150,110,.12);border-color:rgba(60,120,80,.45);">
      <div class="crown-title">🤝 Core slot ${corePips(m)}</div>
      <div class="crown-sub">${m.coreSlot ? `${CORE_SLOT_DEF[m.coreSlot].label}: holds ${CORE_SLOT_DEF[m.coreSlot].holds}.` : 'None yet — the Monkey King trains one.'}
        ${c ? `<br>It holds <b>${escapeHtml(displayName(c))}</b>'s core.` : ''}${inParty ? '' : '<br>A leader fights from the party.'}</div>
      ${inParty ? `<button class="btn btn-ghost" id="toCompanions" style="margin-top:10px;">🤝 Companions…</button>` : ''}
    </div>`;
}
function renderStats(){
  const m = state.party.find(x=>x.uid===ui.statsUid) || state.storage.find(x=>x.uid===ui.statsUid);
  if(!m){ return go('party'); }
  $('#brandSub').textContent = 'Stats';
  const sp = SPECIES[m.species];
  const maxHp = monMaxHp(m);
  const need = fightsNeeded(m.level);
  /* A region's cap (or 200, or a wild monster's 100) hides the bar; a gate of
     the monster's own — its Crown, its core — shows it filling, then waiting
     full. At a ceiling the fights charge the stone it carries instead. */
  const gate = monGate(m);
  /* At the region's cap on its own ceiling (Region 5: 110), it charges its
     stone as at any ceiling, and breaks through where a region lets it grow. */
  const capCeil = gate === 'region' && capAtCeiling(m);
  const charging = gate === 'ceiling' || capCeil;
  const capped = gate === 'region' || gate === 'max' || gate === 'kind';
  const barFull = !capped && (m.xpFights||0) >= need;
  const carried = stoneCarriedBy(m);
  const levelNote = gate === 'max' ? ' (max)'
    : capCeil ? ' · at its ceiling (region cap)'
    : gate === 'region' ? ' (region cap)'
    : gate === 'kind' ? ' (a wild monster stops here)'
    : gate === 'crown' ? ' · needs a Crown'
    : gate === 'core' ? ' · waits for his core'
    : gate === 'ceiling' ? ' · at its ceiling'
    : (canPassLimit(m) && m.level >= CROWN_GATE && monCeiling(m) < LEVEL_MAX ? ` · ceiling ${monCeiling(m)}` : '');
  const waitNote = !barFull || !gate ? ''
    : gate === 'crown' ? 'Bar full — a Crown lets it grow on.'
    : gate === 'core' ? 'Bar full — it grows on once his core is back and he is crowned.'
    : (gate === 'ceiling' && !carried) ? 'Bar full — carry a stone to charge its breakthrough.'
    : '';
  /* At a ceiling: the breakthrough's charge, on the stone it carries. */
  const bNeed = charging ? breakthroughNeed(monCeiling(m)) : 0;
  const fitsHeld = stonesFor(m).filter(st=> ownsStone(st.id));
  const waits = capCeil ? ` It breaks through in a region that lets it grow past ${m.level}.` : '';
  /* The charge keeps building past the need until the player breaks through
     (2.82), so all of it is shown. */
  const shownCharge = carried ? stoneCharge(carried.id) : 0;
  const ready = breakthroughReady(m);
  const nextCeil = Math.min(LEVEL_MAX, monCeiling(m) + CEILING_STEP);
  const chargeCard = !charging ? '' : carried
    ? `<div style="margin-top:10px;font-weight:800;font-size:13px;display:flex;justify-content:space-between;">
         <span>⚡ Breakthrough to Lv ${nextCeil}</span>
         <span style="color:var(--ink-soft);white-space:nowrap;padding-left:8px;">${shownCharge}/${bNeed} charge</span></div>
       <div class="hpbar" style="margin-top:6px;height:9px;"><div class="hpfill" style="width:${Math.min(100, stoneCharge(carried.id)/bNeed*100)}%;background:#8a6ad0;"></div></div>
       <div style="font-size:11px;font-weight:700;color:var(--ink-soft);margin-top:4px;">Every fight charges the ${escapeHtml(carried.name)}.${waits} The charge stays on the stone if it moves.</div>
       ${ready ? `<div style="font-size:12px;font-weight:800;color:#4a2f8a;margin-top:8px;">Ready! Until you break through, every fight adds to the charge — and what the breakthrough doesn't use stays on the stone.</div>
         <button class="btn btn-primary" id="breakBtn" style="margin-top:8px;">⚡ Break through to Lv ${nextCeil}</button>` : ''}`
    : `<div style="margin-top:10px;font-size:12px;font-weight:800;color:#6a4ab0;">⚡ Its breakthrough to Lv ${Math.min(LEVEL_MAX, monCeiling(m) + CEILING_STEP)} needs ${bNeed} charge.
         ${fitsHeld.length ? `Carry ${fitsHeld.map(st=> 'the ' + escapeHtml(st.name)).join(' or ')} to charge it.`
                           : `Carry a stone that fits it — ${stonesFor(m).map(st=> escapeHtml(st.name)).join(', ')} — once you find one.`}${waits}</div>`;
  const suppCap = isPassenger(m) ? 0 : proteinCap(m.species, m);   // crowning raises this
  const atCap = (m.supplements||0) >= suppCap;
  const nextIsFinal = (m.supplements||0) === suppCap-1;
  const moves = MOVES[m.species].map(mv=>{
    const [slot,name,mult,target,words,unlock,extras]=mv;
    const unlocked = name!=null && moveUnlockedFor(m, mv);
    /* Spread the extras — `soul`, `tachy`, `hits`, `spend`, `bonus` and the
       rest live in mv[6], and discarding them left every effect move with
       nothing to describe but "a support move". Same trap as the old
       allow-list in unlockedMoves(). */
    return { slot,name,mult,target,words,unlock,unlocked, ...(extras||{}) };
  });
  moves.forEach(mv=>{ const sf = sacredFlameBonus(m, mv); if(sf) mv.bonus = sf; });   // the ghost phoenix's gift
  [[m.equippedStone,'Basic'], [m.power1Stone,'Power1']].forEach(([st, slot])=>{
    if(!st) return;
    const t = stoneTierDef(st.tier);
    const bi = moves.findIndex(x=>x.slot===slot);
    if(bi<0) return;
    /* isStone / stoneTier / stoneType are what let moveDescription() reach the
       Very High text. Without them a Steel Aegis read as "a support move that
       deals no damage" and explained nothing. */
    moves[bi] = { slot, name:stoneDisplayName(st)+' 💎', mult:stoneMult(st), stone:st,
      isStone:true, stoneTier:st.tier, stoneType:st.type, stonePlus:stonePlus(st),
      target:t.kind==='status'?'Status':(t.kind==='multi2'?'Multi2':'Single'),
      words:t.words, unlock:0, unlocked:true };
  });
  if(m.ultraStone){
    const t = stoneTierDef('ultra');
    const ur = ultraHitRange(m.ultraStone);
    moves.push({ slot:'UltraStone', name:stoneDisplayName(m.ultraStone)+' 💎', mult:stoneMult(m.ultraStone),
      stone:m.ultraStone, ultraStone:m.ultraStone, isStone:true, stoneTier:'ultra',
      stoneType:m.ultraStone.type, stonePlus:stonePlus(m.ultraStone),
      target:'MultiHit', words:t.words, unlock:0, unlocked:true });
  }
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Party</button>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
      ${monPortrait(m.species,72,{stage:monStage(m),crowned:isCrowned(m)})}
      <div style="flex:1;">
        <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:20px;">${escapeHtml(displayName(m))}</div>
        <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-bottom:4px;">${sp.name}${m.nickname?'':' '}</div>
        <div>${typeBadges(m.species)}</div>
      </div>
    </div>
    <div id="nameArea" style="margin-bottom:12px;"></div>

    <div class="hp-card" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-weight:800;font-size:15px;">
        <span>Level ${m.level}${levelNote}</span>
        <span style="color:var(--ink-soft);white-space:nowrap;padding-left:8px;">${capped?'':`${m.xpFights}/${need} fights`}</span>
      </div>
      ${capped?'':`<div class="hpbar" style="margin-top:8px;height:9px;"><div class="hpfill" style="width:${Math.min(100, m.xpFights/need*100)}%;background:var(--gold);"></div></div>`}
      ${waitNote ? `<div style="font-size:11px;font-weight:800;color:var(--gold);margin-top:5px;">${waitNote}</div>` : ''}
      ${chargeCard}
      <div style="display:flex;gap:20px;margin-top:12px;font-weight:800;">
        <div>❤️ HP <span style="color:var(--jade-dark);">${maxHp}</span></div>
        <div>⚔️ ATK <span style="color:var(--cinnabar-dark);">${monAtk(m)}</span></div>
      </div>
      <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-top:8px;">
        💪 Protein boosts: ${m.supplements||0} / ${suppCap}
        ${atCap ? `<span style="color:var(--gold);">· maxed, final boost counted triple</span>` : ''}
      </div>
      ${nextIsFinal && !atCap ? `<div style="font-size:11px;font-weight:800;color:var(--gold);margin-top:4px;">⭐ The last boost is worth TRIPLE — finish the set!</div>` : ''}
      ${(state.inventory.protein>0 && !atCap) ? `<button class="btn btn-jade" id="useProtein" style="margin-top:10px;">Use Protein Supplement (${state.inventory.protein} left)</button>` : ''}
      ${crownBlock(m)}
      ${companionPanel(m)}
      ${stonePanel(m)}
      ${isDev() ? `<div class="dev-panel" style="margin-top:12px;">
        <div class="dev-head">🛠️ Set level</div>
        <div class="dev-btns" style="margin-top:6px;">
          <button class="qty-btn sm" id="lvDown">−</button>
          <input type="number" class="award-n" id="lvSet" value="${m.level}" min="1" max="${LEVEL_MAX}">
          <button class="qty-btn sm" id="lvUp">+</button>
          <button class="btn btn-jade sm-give" id="lvGo">Apply</button>
        </div>
        ${m.species === 'phoenix' ? `<div class="dev-btns" style="margin-top:6px;">
          <button class="btn btn-ghost sm-give" id="sfToggle">🔥 Sacred Flame: ${state.sacredFlameGranted ? 'on' : 'off'}</button>
        </div>` : ''}
        ${state.party.includes(m) ? devCompanionRow(m) : ''}
      </div>` : ''}
    </div>

    <div style="font-weight:800;font-size:14px;margin-bottom:8px;">Moves</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${moves.map((mv,mi)=>`
        <div class="move-row ${mv.unlocked?'tappable':''} ${mv.stone?'refinable':''}" data-mvinfo="${mi}" ${mv.stone?`data-mvstone="${mi}"`:''}
          style="background:${mv.unlocked?'var(--paper-2)':'var(--paper-3)'};border:1px solid var(--line);border-radius:12px;padding:12px;${mv.unlocked?'':'opacity:0.7;'}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:15px;">
              ${mv.unlocked?escapeHtml(mv.name):'???'}${mv.stone&&stonePlus(mv.stone)?`<span class="plus-mark">${UPGRADE_MARKS[stonePlus(mv.stone)].trim()}</span>`:''}
            </div>
            <div style="font-size:11px;font-weight:800;color:var(--ink-soft);">${mv.slot}</div>
          </div>
          <div style="font-size:12px;color:var(--ink-soft);font-weight:600;margin-top:3px;">
            ${mv.unlocked ? statsMoveLine(mv, m)
              : (mv.slot === 'Max' && (SPECIES[m.species]||{}).nerfedUntilCrowned)
                ? `Locked until his core is returned and he is crowned`
                : `Unlocks at Lv ${mv.unlock}`}
          </div>
          ${mv.unlocked ? `<div class="refine-hint">${mv.stone ? 'tap to read or refine' : 'tap to read'}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('party'));
  // naming: unnamed can be named anytime; a named monster can be renamed once,
  // and only after progressing to a later region than where it was named.
  const nameArea = $('#nameArea');
  if(nameArea && isCuain(m)){
    nameArea.innerHTML = `<div style="font-size:11px;color:var(--ink-soft);font-weight:600;">` +
      `He will not answer to any other name. He is the Whalelord.</div>`;
  } else if(nameArea){
    const unnamed = !m.nickname;
    const bronze = (state.medals && state.medals.bronze) || 0;
    const canRename = !unnamed && bronze > 0;      // renaming costs 1 Bronze Medal
    if(unnamed || canRename){
      nameArea.innerHTML = `
        <div style="display:flex;gap:8px;">
          <input type="text" id="nameInput" placeholder="${unnamed?'Give it a nickname':'New nickname'}" maxlength="16" style="flex:1;">
          <button class="btn btn-jade" id="nameSave" style="width:auto;padding:12px 16px;">${unnamed?'Name':'Rename'}</button>
        </div>
        ${unnamed?'<div style="font-size:11px;color:var(--ink-soft);font-weight:600;margin-top:5px;">Naming is free the first time.</div>'
                 :`<div style="font-size:11px;color:var(--gold);font-weight:700;margin-top:5px;">Costs 🥉 1 Bronze Medal (you have ${bronze}).</div>`}
      `;
      $('#nameSave').addEventListener('click', async ()=>{
        const v = $('#nameInput').value.trim();
        if(!v) return;
        if(!unnamed){
          if(((state.medals&&state.medals.bronze)||0) < 1){ toast('You need a Bronze Medal to rename.'); return; }
          state.medals.bronze -= 1;
        }
        m.nickname = v;
        m.namedRegion = state.progress.currentRegion;
        await saveProfile();
        toast(unnamed ? 'Name saved!' : 'Renamed! 🥉 1 Bronze Medal spent.');
        renderStats();
      });
    } else if(!unnamed){
      nameArea.innerHTML = `<div style="font-size:11px;color:var(--ink-soft);font-weight:600;">Earn a 🥉 Bronze Medal to rename this monster.</div>`;
    }
  }
  screenEl.querySelectorAll('[data-mvinfo]').forEach(el=>el.addEventListener('click', ()=>{
    const mv = moves[+el.dataset.mvinfo];
    if(mv && mv.unlocked) openMoveInfo(mv, m);
  }));
  if(isDev()){
    const f = $('#lvSet');
    $('#lvDown').addEventListener('click', ()=>{ f.value = Math.max(1,(+f.value||1)-1); });
    $('#lvUp').addEventListener('click',   ()=>{ f.value = Math.min(LEVEL_MAX,(+f.value||1)+1); });
    $('#lvGo').addEventListener('click', async ()=>{
      const lv = Math.max(1, Math.min(LEVEL_MAX, Math.floor(+f.value||1)));
      m.level = lv;
      // a crowned monster set past a ceiling gets the ceiling above it
      if(canPassLimit(m) && lv >= CROWN_GATE)
        m.ceiling = Math.min(LEVEL_MAX, Math.max(monCeiling(m), (Math.floor(lv / CEILING_STEP) + 1) * CEILING_STEP));
      delete m.evoFloor; delete m.evoFloorLevel;      // let it settle at its true form
      m.xpFights = 0;
      m.currentHp = monMaxHp(m);
      await saveProfile();
      toast(`${displayName(m)} set to level ${lv}.`);
      renderStats();
    });
  }
  const sft = $('#sfToggle');
  if(sft) sft.addEventListener('click', async ()=>{
    state.sacredFlameGranted = !state.sacredFlameGranted;
    await saveProfile();
    toast(`Sacred Flame ${state.sacredFlameGranted ? 'granted' : 'taken away'} (dev).`);
    renderStats();
  });
  const dcs = $('#devComp');                      // companion pairs, phase 2 (dev only)
  if(dcs) dcs.addEventListener('change', async ()=>{
    const uid = dcs.value;
    if(uid) m.companionUid = uid; else delete m.companionUid;
    await saveProfile();
    const c = companionOf(m);
    toast(c ? `🤝 ${displayName(m)} now holds ${displayName(c)}'s core (dev).` : `${displayName(m)} holds no companion core (dev).`);
    renderStats();
  });
  const so = $('#stoneOff');
  if(so) so.addEventListener('click', async ()=>{
    const st = stoneDef(so.dataset.stone);
    detachStone(st.id);
    await saveProfile();
    toast(`${st.name} detached${stoneCharge(st.id) ? ` — it keeps its ${stoneCharge(st.id)} charge` : ''}.`);
    renderStats();
  });
  const bb = $('#breakBtn');                      // the player's breakthrough (2.82)
  if(bb) bb.addEventListener('click', ()=> doBreakthrough(m, renderStats));
  const sn = $('#stoneOn');
  if(sn) sn.addEventListener('click', ()=>{
    const cur = stoneCarriedBy(m);
    const opts = stonesFor(m).filter(st=> ownsStone(st.id) && (!cur || st.id !== cur.id));
    if(opts.length === 1 && !cur) return giveStoneTo(opts[0].id, m, renderStats);
    stoneChooser(`A stone for ${displayName(m)}`, opts, id=> giveStoneTo(id, m, renderStats));
  });
  const cb = $('#useCrown');
  if(cb) cb.addEventListener('click', ()=> confirmCrown(m));
  const tc = $('#toCompanions');                   // bonding for real (2.86)
  if(tc) tc.addEventListener('click', ()=> go('companions'));
  const up = $('#useProtein');
  if(up) up.addEventListener('click', async ()=>{
    if(state.inventory.protein<=0 || (m.supplements||0)>=suppCap) return;
    const wasFinal = (m.supplements||0) === suppCap-1;
    const beforeProtein = state.inventory.protein;
    const beforeSupp = m.supplements||0;
    const beforeHp = m.currentHp;
    const beforeMax = monMaxHp(m);
    m.supplements = beforeSupp+1;
    state.inventory.protein--;
    const afterMax = monMaxHp(m);
    m.currentHp = Math.min(afterMax, m.currentHp + (afterMax-beforeMax));

    const sov = showSyncingOverlay('Syncing…');
    const ok = await saveProfile({ awaitCloud:true });
    hideSyncingOverlay(sov);
    if(!ok){
      m.supplements = beforeSupp;
      state.inventory.protein = beforeProtein;
      m.currentHp = beforeHp;
      showSyncFailure();
      return;
    }
    playSfx('protein_use');
    toast(wasFinal ? `${displayName(m)} maxed out! Final boost counted TRIPLE.` : `${displayName(m)} grew stronger!`);
    renderStats();
  });
}
function renderStorage(){
  setScreenBg('home');
  $('#brandSub').textContent = 'Storage';
  if(!Array.isArray(state.storage)) state.storage = [];
  if(!Array.isArray(state.moveStones)) state.moveStones = [];
  if(!state.inventory) state.inventory = { protein:0, strangeKey:false, tokens:0, eliteTokens:0 };

  screenEl.innerHTML = `
    <div class="party-head-row">
      <button class="back-link" id="backBtn" style="margin:0;">← ${ui.storageFrom==='shop'?'Shop':'Party'}</button>
      <button class="btn btn-ghost storage-corner" id="toShopBtn">🏪 Shop</button>
    </div>
    <div class="screen-title" style="margin-top:6px;">Storage</div>

    <div class="storage-cols">
      <div class="storage-col col-mons">
        <div class="col-head">🐾 Monsters <span>${state.storage.length}</span></div>
        <div id="storageList"></div>
      </div>
      <div class="storage-col col-stones">
        ${heldStones().length ? `<button class="btn btn-ghost stone-page-btn" id="openStones">
        💠 Element Stones <span>${totalStones()} held</span></button>` : ''}
      ${recycleAllBar()}
      <div class="col-head">💎 Skills <span>${tokenIcon(16)} ${state.inventory.tokens||0}</span></div>
        <div id="stoneList"></div>
      </div>
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>{ const t = ui.storageFrom==='shop'?'shop':'party'; ui.storageFrom=null; go(t); });
  $('#toShopBtn').addEventListener('click', ()=>{ ui.storageFrom='storage'; go('shop'); });

  const list = $('#storageList');
  companionsCss();
  if(state.storage.length===0){
    list.innerHTML = `<div class="col-empty">No stored monsters.</div>`;
  } else {
    list.innerHTML = state.storage.map(m=>`
      <div class="party-card" style="padding:10px;margin-bottom:8px;">
        <div class="party-head" style="gap:9px;">
          ${monPortrait(m.species,44,{stage:monStage(m),crowned:isCrowned(m)})}
          <div style="flex:1;min-width:0;">
            <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:14px;">${escapeHtml(displayName(m))}</div>
            <div style="font-size:12px;color:var(--ink-soft);font-weight:800;">Lv ${m.level}</div>
            ${storageCompanionLine(m)}
          </div>
        </div>
        <div class="party-actions" style="margin-top:8px;padding-top:8px;">
          <button class="mini-btn" style="font-size:11px;padding:7px 6px;" data-stats="${m.uid}">📊</button>
          <button class="mini-btn" style="font-size:11px;padding:7px 6px;" data-party="${m.uid}">➕ Party</button>
        </div>
      </div>
    `).join('');
    list.querySelectorAll('[data-stats]').forEach(b=>b.addEventListener('click', ()=>{ ui.statsUid=b.dataset.stats; go('stats'); }));
    list.querySelectorAll('[data-party]').forEach(b=>b.addEventListener('click', ()=> moveToParty(b.dataset.party)));
  }
  renderStoneList();
  wireRecycleAll();
  const os = $('#openStones');
  if(os) os.addEventListener('click', ()=>go('elementStones'));
}

/* Low and Mid stones pile up fast, so they can be cleared in one go. */
/* A shelf of the elemental stones you hold, showing who carries each and
   letting you take it back without hunting through the party. */
/* A page of its own: what the stones do, then a row per stone you hold. */
function renderElementStones(){
  $('#brandSub').textContent = 'Element Stones';
  setScreenBg('home');
  const held = heldStones();
  const all = state.party.concat(state.storage);
  const canCarry = (st, m)=> stoneFits(st, m) && (!isPassenger(m) || isCuain(m));

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Storage</button>
    <div class="screen-title">Element Stones <span style="font-size:13px;color:var(--ink-soft);">${held.length} of ${ELEMENTAL_STONES.length} found</span></div>
    <div class="stone-intro">
      <b>Carry one.</b> A stone attaches to a monster of its type and gives it
      <b>1.5× experience</b> from every fight — a stone helps a monster that is
      falling behind far more than one already grown. The four triangle stones fit
      any monster of their triangle's three types. Each stone is carried by one
      monster at a time, and a monster carries one stone.
      ${levelCap() > CROWN_GATE ? `<br><br><b>Break through.</b> Past level ${CROWN_GATE}, a crowned monster stops at a
      ceiling every ${CEILING_STEP} levels. There, every fight charges the stone it carries instead
      of its level; when the charge is full it breaks through and the next ${CEILING_STEP} levels open —
      <b>${breakthroughNeed(CROWN_GATE + CEILING_STEP)}</b> at ${CROWN_GATE + CEILING_STEP}, then more at each ceiling,
      up to <b>${breakthroughNeed(LEVEL_MAX - CEILING_STEP)}</b> at ${LEVEL_MAX - CEILING_STEP}.
      The charge stays on the stone: move it, and a breakthrough takes only what it needs.
      ${levelCap() < LEVEL_MAX ? `Here the level cap is ${levelCap()}: a crowned monster at that ceiling still charges
      its stone, and breaks through in a region that lets it grow.` : ''}` : ''}
    </div>

    ${held.length ? held.map(st=>{
      const holderUid = stoneHolder(st.id);
      const mon = holderUid && all.find(m=>m.uid===holderUid);
      const eligible = all.filter(m=> canCarry(st, m));
      const ch = stoneCharge(st.id);
      const charging = mon && chargesStone(mon);
      return `<div class="es-row">
        <div class="es-icon">${uiIcon(st.icon, 54, st.emoji)}</div>
        <div class="es-body">
          <div class="es-name">${escapeHtml(st.name)}${ch || charging ? ` <span style="font-size:12px;color:#6a4ab0;">⚡ ${ch}${charging ? ` / ${breakthroughNeed(monCeiling(mon))}` : ''}</span>` : ''}</div>
          ${st.triangle ? `<div class="es-sub">Fits ${escapeHtml(st.typeText)}</div>` : ''}
          <div class="es-sub">${mon
            ? `Carried by <b>${escapeHtml(displayName(mon))}</b> · Lv ${mon.level}${breakthroughReady(mon) ? ' · <b>ready to break through</b>' : charging ? ' · charging' : ''}`
            : (eligible.length ? `${eligible.length} monster${eligible.length>1?'s':''} can carry it`
                               : `No ${escapeHtml(st.typeText)} monster to carry it yet`)}</div>
        </div>
        <div class="es-actions" style="display:flex;flex-direction:column;gap:6px;">
          ${mon ? `<button class="btn btn-ghost es-btn" data-detach="${st.id}">Detach</button>` : ''}
          <button class="btn ${mon ? 'btn-ghost' : 'btn-primary'} es-btn" data-attach="${st.id}" ${eligible.length?'':'disabled'}>${mon ? 'Move' : 'Attach'}</button>
        </div>
      </div>`;
    }).join('') : `<div class="phase-flag">You haven't found any Element Stones yet.</div>`}
  `;
  $('#backBtn').addEventListener('click', ()=>go('storage'));
  screenEl.querySelectorAll('[data-detach]').forEach(b=>b.addEventListener('click', async ()=>{
    const st = stoneDef(b.dataset.detach);
    detachStone(st.id);
    await saveProfile();
    toast(`${st.name} detached${stoneCharge(st.id) ? ` — it keeps its ${stoneCharge(st.id)} charge` : ''}.`);
    renderElementStones();
  }));
  screenEl.querySelectorAll('[data-attach]').forEach(b=>b.addEventListener('click', ()=>{
    const st = stoneDef(b.dataset.attach);
    const eligible = all.map((m,i)=>({m,i})).filter(o=> canCarry(st, o.m) && stoneHolder(st.id) !== o.m.uid);
    monsterChooser(`Give the ${st.name} to…`, eligible, i=> giveStoneTo(st.id, all[i], renderElementStones));
  }));
}

function recycleAllBar(){
  const counts = { low:0, mid:0 };
  state.moveStones.forEach(st=>{ if(counts[st.tier]!==undefined) counts[st.tier]++; });
  const total = counts.low + counts.mid;
  if(total === 0) return '';
  const back = counts.low*RECYCLE_RETURN.low + counts.mid*RECYCLE_RETURN.mid;
  return `<button class="btn btn-ghost recycle-all" id="recycleAll">
    ♻️ Recycle all Low &amp; Mid (${total}) → ${tokenIcon(14)} ${back}
  </button>`;
}
function wireRecycleAll(){
  const b = $('#recycleAll');
  if(!b) return;
  b.addEventListener('click', ()=>{
    const doomed = state.moveStones.filter(st=>st.tier==='low' || st.tier==='mid');
    if(!doomed.length) return;
    const refined = doomed.filter(st=>stonePlus(st) > 0).length;
    const back = doomed.reduce((n,st)=>n + (RECYCLE_RETURN[st.tier]||0), 0);
    confirmDialogHtml(
      `Recycle <b>${doomed.length}</b> Low and Mid stone${doomed.length>1?'s':''} for ${tokenIcon(15)} <b>${back}</b>?` +
      (refined ? `<br><br><b style="color:var(--cinnabar-dark);">${refined} of them ${refined>1?'have been':'has been'} refined</b> — that work is lost too.` : '') +
      `<br><br>Stones already taught to a monster are not touched.`,
      async ()=>{
        const snapshot = { stones:state.moveStones.slice(), tokens:state.inventory.tokens };
        state.moveStones = state.moveStones.filter(st=>!(st.tier==='low' || st.tier==='mid'));
        state.inventory.tokens = (state.inventory.tokens||0) + back;
        const sv = showSyncingOverlay('Recycling…');
        const ok = await saveProfile({ awaitCloud:true });
        hideSyncingOverlay(sv);
        if(!ok){ state.moveStones = snapshot.stones; state.inventory.tokens = snapshot.tokens; showSyncFailure(); return; }
        playSfx('stone_roll');
        toast(`Recycled ${doomed.length} stones for ${back} tokens.`);
        renderStorage();
      });
  });
}

function renderStoneList(){
  const el = $('#stoneList');
  if(!el) return;
  if(state.moveStones.length===0){
    el.innerHTML = `<div class="col-empty">No skill stones yet.</div>`;
    return;
  }
  // rarest first, so the good stuff is never buried
  const order = ['ultra','veryhigh','high','mid','low'];
  const groups = {};
  state.moveStones.forEach(st=>{ (groups[st.tier] = groups[st.tier] || []).push(st); });
  el.innerHTML = order.filter(t=>groups[t]).map(t=>{
    const def = stoneTierDef(t);
    return `<div class="stone-group">
      <div class="stone-group-head tier-${t}">${def.label}<span>${groups[t].length}</span></div>
      ${groups[t].map(st=>`
        <div class="stone-card tier-${st.tier}" data-stone="${st.uid}">
          <span class="type-badge" style="background:${TYPE_COLORS[st.type]};font-size:9px;padding:2px 6px;">${st.type}</span>
          <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:12.5px;margin-top:3px;line-height:1.2;">
            ${escapeHtml(st.name)}${stonePlus(st) ? `<span class="plus-mark">${UPGRADE_MARKS[stonePlus(st)].trim()}</span>` : ''}</div>
        </div>`).join('')}
    </div>`;
  }).join('');
  el.querySelectorAll('[data-stone]').forEach(c=> c.addEventListener('click', ()=> openStoneDetail(c.dataset.stone)));
}

/* gacha spin with a short suspense reveal */
/* ---------- Commit-before-reveal helpers ----------
   Used only for economy actions where a reload-before-sync could be exploited
   (see any spend/roll/recycle below). Nothing is shown until the cloud has
   confirmed the write, so there's nothing to reload away from. */
function showSyncingOverlay(label){
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(35,32,25,0.55);gap:12px;';
  ov.innerHTML = `<div style="font-size:38px;">☁️</div><div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:15px;color:#fff;">${escapeHtml(label||'Syncing…')}</div>`;
  document.body.appendChild(ov);
  return ov;
}
function hideSyncingOverlay(ov){ if(ov && ov.parentNode) document.body.removeChild(ov); }
function showSyncFailure(){
  toast("☁️ Couldn't confirm online — check your connection and try again.");
}

async function doStoneRoll(){
  if((state.inventory.tokens||0) < TOKENS_PER_ROLL) return;
  const beforeTokens = state.inventory.tokens;
  state.inventory.tokens -= TOKENS_PER_ROLL;
  const stone = newMoveStone();
  state.moveStones.push(stone);

  const ov = showSyncingOverlay('Syncing…');
  const ok = await saveProfile({ awaitCloud:true });
  hideSyncingOverlay(ov);
  if(!ok){
    state.inventory.tokens = beforeTokens;
    state.moveStones.pop();
    showSyncFailure();
    return;
  }
  showStoneReveal(stone, 'Rolling…');
}

/* Shared reveal animation for every way a stone can be obtained. */
function showStoneReveal(stone, spinLabel, thenScreen){
  playSfx('stone_roll');
  const t = stoneTierDef(stone.tier);
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:85;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at center,#fff7e0,#d9cdae);gap:14px;';
  ov.innerHTML = `<div id="rollSpin" style="font-size:64px;">🎰</div>
    <div id="rollText" style="font-family:'Baloo 2',cursive;font-weight:800;font-size:20px;color:var(--ink-soft);">${escapeHtml(spinLabel||'Rolling…')}</div>`;
  document.body.appendChild(ov);
  setTimeout(()=>{
    fadeOutSfx('stone_roll', 500);      // spin sound eases out as the result lands
    playStoneSfx(stone.tier);
    ov.querySelector('#rollSpin').textContent = '💎';
    ov.querySelector('#rollSpin').style.filter = `drop-shadow(0 0 18px ${TYPE_COLORS[stone.type]})`;
    ov.querySelector('#rollText').outerHTML = `
      <div style="text-align:center;">
        <div class="stone-tier-big tier-${stone.tier}">${t.label}</div>
        <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:24px;margin-top:6px;">${escapeHtml(stone.name)}</div>
        <div style="margin-top:6px;"><span class="type-badge" style="background:${TYPE_COLORS[stone.type]}">${stone.type}</span></div>
        <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-top:8px;">${t.mult!=null?t.mult+'× ATK':'Status move'} · ${t.words} words</div>
      </div>
      <button class="btn btn-primary" id="rollOk" style="width:auto;padding:12px 30px;margin-top:14px;">Nice!</button>`;
    ov.querySelector('#rollOk').addEventListener('click', ()=>{
      if(ov.parentNode) document.body.removeChild(ov);
      if(thenScreen==='shop'){ ui.shopNote = 'Sent to Storage — open it to equip.'; renderShop(); }
      else if(thenScreen==='storage'){ ui.storageFrom='shop'; go('storage'); }
      else renderStorage();
    });
  }, 1100);
}

/* Elite spin: 5 Elite Skill Tokens, guaranteed High or better. */
async function doEliteRoll(){
  if((state.inventory.eliteTokens||0) < ELITE_ROLL_COST) return;
  const beforeElite = state.inventory.eliteTokens;
  state.inventory.eliteTokens -= ELITE_ROLL_COST;
  const stone = newEliteStone();
  state.moveStones.push(stone);

  const ov = showSyncingOverlay('Syncing…');
  const ok = await saveProfile({ awaitCloud:true });
  hideSyncingOverlay(ov);
  if(!ok){
    state.inventory.eliteTokens = beforeElite;
    state.moveStones.pop();
    showSyncFailure();
    return;
  }
  showStoneReveal(stone, 'Elite spin!');
}

/* Shop: spend Elite Skill Tokens on a guaranteed, self-chosen stone. */
function openEliteShop(){
  const elite = state.inventory.eliteTokens||0;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.6);z-index:75;display:flex;align-items:flex-end;justify-content:center;';
  ov.innerHTML = `<div style="background:var(--paper);border-radius:18px 18px 0 0;padding:20px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto;">
    <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:19px;">🏪 Elite Shop</div>
    <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin:3px 0 14px;">You have <b>⭐ ${elite}</b> Elite Skill Tokens. Pick exactly the skill you want.</div>
    <button class="btn ${elite>=ELITE_SHOP_HIGH?'btn-primary':'btn-ghost'}" id="buyH" ${elite>=ELITE_SHOP_HIGH?'':'disabled'} style="margin-bottom:8px;">
      Choose any <b>High</b> skill — ${ELITE_SHOP_HIGH} tokens
    </button>
    <button class="btn ${elite>=ELITE_SHOP_VERYHIGH?'btn-primary':'btn-ghost'}" id="buyVH" ${elite>=ELITE_SHOP_VERYHIGH?'':'disabled'} style="margin-bottom:8px;">
      Choose any <b>Very High</b> skill — ${ELITE_SHOP_VERYHIGH} tokens
    </button>
    <button class="btn ${elite>=ELITE_SHOP_ULTRA?'btn-primary':'btn-ghost'}" id="buyU" ${elite>=ELITE_SHOP_ULTRA?'':'disabled'} style="margin-bottom:8px;">
      Choose any <b>Ultra</b> skill — ${ELITE_SHOP_ULTRA} tokens
    </button>
    <div style="font-size:11px;color:var(--ink-soft);font-weight:600;line-height:1.5;margin:8px 0 12px;">
      Elite Skill Tokens come from mastery: every 10 phrases written correctly ${MASTERY_CHECKPOINTS.elite} times earns one.
    </div>
    <button class="btn btn-ghost" id="shopClose">Close</button>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#shopClose').addEventListener('click', close);
  ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
  const h = ov.querySelector('#buyH'), vh = ov.querySelector('#buyVH'), u = ov.querySelector('#buyU');
  if(elite>=ELITE_SHOP_HIGH) h.addEventListener('click', ()=>{ close(); pickShopStone('high', ELITE_SHOP_HIGH); });
  if(elite>=ELITE_SHOP_VERYHIGH) vh.addEventListener('click', ()=>{ close(); pickShopStone('veryhigh', ELITE_SHOP_VERYHIGH); });
  if(elite>=ELITE_SHOP_ULTRA)    u .addEventListener('click', ()=>{ close(); pickShopStone('ultra',    ELITE_SHOP_ULTRA); });
}

function pickShopStone(tierId, cost){
  const t = stoneTierDef(tierId);
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.6);z-index:76;display:flex;align-items:flex-end;justify-content:center;';
  ov.innerHTML = `<div style="background:var(--paper);border-radius:18px 18px 0 0;padding:20px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto;">
    <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:18px;">Choose a ${t.label} skill</div>
    <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin:3px 0 12px;">Costs ${cost} Elite Skill Tokens.</div>
    ${stoneTypePool().map(tp=>`
      <button class="btn btn-ghost shop-opt" data-type="${tp}" style="margin-bottom:8px;display:flex;align-items:center;gap:10px;justify-content:flex-start;text-align:left;">
        <span class="type-badge" style="background:${TYPE_COLORS[tp]};">${tp}</span>
        <span style="flex:1;font-weight:700;">${escapeHtml(stoneName(tp,tierId))}</span>
      </button>`).join('')}
    <button class="btn btn-ghost" id="pickCancel">Cancel</button>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#pickCancel').addEventListener('click', close);
  ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
  ov.querySelectorAll('.shop-opt').forEach(b=>b.addEventListener('click', async ()=>{
    const type = b.dataset.type;
    if((state.inventory.eliteTokens||0) < cost){ toast('Not enough Elite Skill Tokens.'); close(); return; }
    close();
    const beforeElite = state.inventory.eliteTokens;
    state.inventory.eliteTokens -= cost;
    const stone = { uid:'s'+Date.now()+Math.floor(Math.random()*1000), tier:tierId, type, name:stoneName(type,tierId) };
    state.moveStones.push(stone);

    const sov = showSyncingOverlay('Syncing…');
    const ok = await saveProfile({ awaitCloud:true });
    hideSyncingOverlay(sov);
    if(!ok){
      state.inventory.eliteTokens = beforeElite;
      state.moveStones.pop();
      showSyncFailure();
      return;
    }
    showStoneReveal(stone, 'Purchased!');
  }));
}

/* stone detail: Use / Recycle / Back */
/* The refinement panel inside a stone's detail card. */
function upgradePanel(st){
  if(st.tier === 'veryhigh'){
    return `<div class="upg-panel muted">Very High skills cannot be refined yet.</div>`;
  }
  if(stonePlus(st) >= 2){
    return `<div class="upg-panel done">✦ Fully refined</div>`;
  }
  const cost = upgradeCost(st);
  const check = canUpgradeStone(st);
  const nextMark = UPGRADE_MARKS[stonePlus(st)+1].trim();
  const cur = stoneMult(st);
  const nextSt = Object.assign({}, st, { plus: stonePlus(st)+1 });
  const nxt = stoneMult(nextSt);
  const preview = st.tier==='ultra'
    ? (()=>{ const a=ultraHitRange(st), b=ultraHitRange(nextSt);
             return `${cur}× / ${a.min}–${a.max} hits → <b>${nxt}× / ${b.min}–${b.max} hits</b>`; })()
    : `${cur}× → <b>${nxt}×</b>`;
  return `<div class="upg-panel">
    <div class="upg-head">Refine to <b>${nextMark}</b></div>
    <div class="upg-preview">${preview}</div>
    <div class="upg-cost">Costs a duplicate ${escapeHtml(st.type)} ${stoneTierDef(st.tier).label} stone
      + ${curIcon(cost.cur)} ${cost.n}</div>
    ${check.ok
      ? `<button class="btn btn-primary" id="upgBtn" style="margin-top:9px;">Refine</button>`
      : `<div class="upg-why">${escapeHtml(check.why)}</div>`}
  </div>`;
}

async function doUpgradeStone(st, closeFn){
  const check = canUpgradeStone(st);
  if(!check.ok) return toast(check.why);
  const snapshot = { medals:Object.assign({},state.medals), stones:state.moveStones.slice() };
  // spend the medals and consume the duplicate
  if(check.cost.cur==='gold' || check.cost.cur==='silver') state.medals[check.cost.cur] -= check.cost.n;
  const di = state.moveStones.indexOf(check.dup);
  if(di>=0) state.moveStones.splice(di,1);
  st.plus = stonePlus(st) + 1;

  const sv = showSyncingOverlay('Refining…');
  const ok = await saveProfile({ awaitCloud:true });
  hideSyncingOverlay(sv);
  if(!ok){ state.medals = snapshot.medals; state.moveStones = snapshot.stones; st.plus = stonePlus(st)-1; showSyncFailure(); return; }

  playSfx('stone_'+(st.tier==='ultra'?'ultra':st.tier));
  toast(`${st.name} refined to ${UPGRADE_MARKS[stonePlus(st)].trim()}!`);
  if(closeFn) closeFn();
}

function openStoneDetail(uid){
  const s = state.moveStones.find(x=>x.uid===uid);
  if(!s) return;
  const t = stoneTierDef(s.tier);
  const isUltra = s.tier==='ultra';
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.55);z-index:75;display:flex;align-items:center;justify-content:center;padding:22px;';
  ov.innerHTML = `<div style="background:var(--paper);border-radius:18px;padding:20px;max-width:340px;width:100%;box-shadow:0 12px 40px var(--shadow);">
    <div style="text-align:center;">
      <div class="stone-tier-big tier-${s.tier}">${t.label}</div>
      <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:20px;margin-top:6px;">
        ${escapeHtml(s.name)}${stonePlus(s) ? `<span class="plus-mark big">${UPGRADE_MARKS[stonePlus(s)].trim()}</span>` : ''}</div>
      <div style="margin-top:5px;"><span class="type-badge" style="background:${TYPE_COLORS[s.type]}">${s.type}</span></div>
      <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-top:8px;line-height:1.5;">
        ${(()=>{ const m = stoneMult(s);
                 if(m==null) return 'Status move';
                 if(s.tier==='ultra'){ const r=ultraHitRange(s); return `${m}× ATK · ${r.min}–${r.max} hits`; }
                 return `${m}× ATK`; })()} · ${t.words} words<br>
        ${stoneDescription(s)}
      </div>
      <div style="font-size:11px;color:var(--ink-soft);font-weight:700;margin-top:8px;">
        Teachable to <b>${s.type}</b>-type monsters${isUltra?' · adds a 5th move button':' · replaces the '+(s.tier==='high'?'Power1':'Basic')+' move'}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px;">
      <button class="btn btn-primary" id="stUse">Use</button>
      <button class="btn btn-ghost" id="stRecycle">Recycle (+${RECYCLE_RETURN[s.tier]} tokens)</button>
      <button class="btn btn-ghost" id="stBack">Back</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#stBack').addEventListener('click', close);
  ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
  ov.querySelector('#stRecycle').addEventListener('click', ()=>{
    close();
    confirmDialog(`Recycle ${s.name} for ${RECYCLE_RETURN[s.tier]} tokens? This destroys the stone.`, async ()=>{
      const beforeTokens = state.inventory.tokens||0;
      const i = state.moveStones.findIndex(x=>x.uid===uid);
      if(i<0) return;
      const removed = state.moveStones.splice(i,1)[0];
      state.inventory.tokens = beforeTokens + RECYCLE_RETURN[s.tier];

      const sov = showSyncingOverlay('Syncing…');
      const ok = await saveProfile({ awaitCloud:true });
      hideSyncingOverlay(sov);
      if(!ok){
        state.moveStones.splice(i,0,removed);
        state.inventory.tokens = beforeTokens;
        showSyncFailure();
        return;
      }
      toast(`Recycled for ${RECYCLE_RETURN[s.tier]} tokens.`);
      renderStorage();
    });
  });
  ov.querySelector('#stUse').addEventListener('click', ()=>{ close(); chooseStoneRecipient(s); });
}

/* Tooltips are generated from the same table that drives the mechanics, so a
   refined stone always describes what it actually does. The old hard-coded
   strings had drifted badly — they still mentioned Giga Drain and a 3-5 turn
   Ice Tomb long after both had changed. */
function stoneDescription(s){
  const plus = stonePlus(s);
  const mark = UPGRADE_MARKS[plus].trim();
  if(s.tier === 'veryhigh'){
    const d = veryHighDef(s.type, plus);
    if(!d) return '';
    const head = `<b>${escapeHtml(d.name)}${mark ? ' '+mark : ''}</b>`;
    const dur  = d.turns ? ` · ${d.turns} turns` : '';
    return `${head}${dur}<br>${d.text}<br><i>Once per battle, restored by the recharge meter.</i>`;
  }
  if(s.tier === 'ultra'){
    const r = ultraHitRange(s);
    const m = stoneMult(s);
    return `Hits <b>${r.min}–${r.max}</b> times across the enemies at ${m}× ATK each.` +
           `<br><i>Once per battle, restored by the recharge meter.</i>`;
  }
  if(s.tier === 'high'){
    return `Strikes <b>two different enemies</b> for ${stoneMult(s)}× ATK.` +
           (livingEnemies && false ? '' : '<br>With three or more foes you choose the first target.');
  }
  return `Replaces the Basic move, dealing ${stoneMult(s)}× ATK.`;
}


/* pick which owned monster of the matching type learns the stone */
function chooseStoneRecipient(s){
  const all = [...state.party, ...state.storage];
  const eligible = all.filter(m=>!isPassenger(m) && SPECIES[m.species].types.includes(s.type));
  if(eligible.length===0){
    toast(`You have no ${s.type}-type monsters yet.`);
    return;
  }
  const isUltra = s.tier==='ultra';
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.55);z-index:75;display:flex;align-items:flex-end;justify-content:center;';
  ov.innerHTML = `<div style="background:var(--paper);border-radius:18px 18px 0 0;padding:20px;max-width:480px;width:100%;max-height:75vh;overflow-y:auto;">
    <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:17px;margin-bottom:4px;">Teach ${escapeHtml(s.name)} to…</div>
    <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-bottom:12px;">${isUltra?'Adds a 5th move button.':`Replaces the monster's ${s.tier==='high'?'Power1':'Basic'} move.`}</div>
    ${eligible.map(m=>{
      // Look at the slot THIS stone will occupy — High goes to Power1, so it
      // never displaces a Basic-slot skill and shouldn't warn about one.
      const cur = isUltra ? m.ultraStone : (s.tier==='high' ? m.power1Stone : m.equippedStone);
      return `<button class="btn btn-ghost st-opt" data-uid="${m.uid}" style="margin-bottom:8px;display:flex;align-items:center;gap:10px;justify-content:flex-start;text-align:left;">
        ${monPortrait(m.species,36,{stage:monStage(m),crowned:isCrowned(m)})}
        <span style="flex:1;">${escapeHtml(displayName(m))} · Lv ${m.level}
        ${cur?`<br><span style="font-size:11px;color:var(--cinnabar);">replaces ${escapeHtml(cur.name)}</span>`:''}</span>
      </button>`;
    }).join('')}
    <button class="btn btn-ghost" id="stCancel" style="margin-top:4px;">Cancel</button>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#stCancel').addEventListener('click', close);
  ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
  ov.querySelectorAll('.st-opt').forEach(b=> b.addEventListener('click', async ()=>{
    const uid = b.dataset.uid;
    const mon = all.find(m=>m.uid===uid);
    const replaced = isUltra ? mon.ultraStone : (s.tier==='high' ? mon.power1Stone : mon.equippedStone);
    const doIt = async ()=>{
      // Carry the refinement across — a ✦ stone taught plainly would silently
      // throw away the medals and duplicates that bought it.
      const taught = { uid:s.uid, tier:s.tier, type:s.type, name:s.name, plus:stonePlus(s) };
      if(isUltra) mon.ultraStone = taught;
      else if(s.tier==='high') mon.power1Stone = taught;
      else        mon.equippedStone = taught;
      const i = state.moveStones.findIndex(x=>x.uid===s.uid);
      if(i>=0) state.moveStones.splice(i,1);
      await saveProfile();
      close();
      playStoneSfx(s.tier);
      toast(`${displayName(mon)} learned ${s.name}!`);
      renderStorage();
    };
    if(replaced){
      close();
      confirmDialog(`${displayName(mon)} already knows ${replaced.name}. Replace it? The old move is lost.`, doIt);
    } else {
      await doIt();
    }
  }));
}

function moveToParty(uid, letGo){
  const idx = state.storage.findIndex(m=>m.uid===uid);
  if(idx<0) return;
  /* A companion comes from storage, never the party (2.86): bringing one in
     ends its bond — asked first, and only undone if the move happens. */
  const lead = leaderOf(state.storage[idx]);
  if(lead && !letGo){
    const c = state.storage[idx];
    return confirmDialogHtml(`<b>${escapeHtml(displayName(c))}</b> is <b>${escapeHtml(displayName(lead))}</b>'s companion. ` +
      `Bring it into the party? ${escapeHtml(displayName(lead))} lets go of its core — a companion comes from storage.`,
      ()=> moveToParty(uid, lead), 'Bring it');
  }
  const release = ()=>{ if(letGo && letGo.companionUid === uid) delete letGo.companionUid; };
  if(slottedCount()<6){
    const [m]=state.storage.splice(idx,1);
    state.party.push(m);
    release();
    saveProfile();
    toast(`${displayName(m)} joined your party.`);
    renderStorage();
  } else {
    /* An egg, a seed or a baby rides along in its own slot — it is not one of
       the six. Offering it here let a passenger be swapped OUT of the party
       and lost, which is not something the player should be able to do. */
    const options = state.party.map((m,i)=>({m,i})).filter(o=>!isFixedMember(o.m));
    if(!options.length){ toast('Nobody in your party can be swapped out.'); return; }
    monsterChooser('Party is full — swap out…', options, (i)=>{
      const stored = state.storage.splice(idx,1)[0];
      const removed = state.party.splice(i,1,stored)[0];
      state.storage.push(removed);
      release();
      saveProfile();
      toast(`${displayName(stored)} swapped in for ${displayName(removed)}.`);
      renderStorage();
    });
  }
}

/* ---------- SCREEN: monster index ---------- */
function renderMonsterIndex(){
  setScreenBg('home');
  $('#brandSub').textContent = 'Monster Index';
  const seen = state.encounteredSpecies || [];
  const all = Object.keys(SPECIES);
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Home</button>
    ${(state.progress.currentRegion === 4 && typeof expeditionBar === 'function') ? expeditionBar() : ''}
    <div class="screen-title">Monster Index</div>
    <div class="screen-sub">${seen.length} / ${all.length} monsters discovered</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      ${all.map(sp=>{
        const known = seen.includes(sp);
        const caught = state.caughtSpecies.includes(sp);
        return `
        <div class="mon-index-card ${known?'':'unknown'}" ${known?`data-sp="${sp}"`:''}>
          ${known ? monPortrait(sp,48) : `<div class="mon-portrait" style="width:48px;height:48px;border-radius:11px;background:var(--paper-3);color:var(--ink-soft);font-size:22px;display:flex;align-items:center;justify-content:center;">?</div>`}
          <div style="margin-top:6px;font-family:'Baloo 2',cursive;font-weight:700;font-size:13px;">${known?SPECIES[sp].name:'???'}</div>
          ${known?`<div style="font-size:10px;">${typeBadges(sp)}</div>`:''}
          ${caught?'<div class="caught-dot">✓ Caught</div>':''}
        </div>`;
      }).join('')}
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('home'));
  screenEl.querySelectorAll('[data-sp]').forEach(c=> c.addEventListener('click', ()=>{ ui.indexSpecies=c.dataset.sp; go('indexDetail'); }));
}
function renderIndexDetail(){
  const sp = ui.indexSpecies;
  if(!sp || !SPECIES[sp]) return go('monsterIndex');
  const s = SPECIES[sp];
  $('#brandSub').textContent = s.name;
  const evoText = s.evo && s.evo.length ? `Evolves at Lv ${s.evo.join(', ')}` : 'Does not evolve';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Index</button>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
      ${monPortrait(sp,72)}
      <div>
        <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:20px;">${s.name}</div>
        <div style="margin:4px 0;">${typeBadges(sp)}</div>
        <div style="font-size:12px;color:var(--ink-soft);font-weight:700;">${s.tier[0].toUpperCase()+s.tier.slice(1)} · ${evoText}</div>
      </div>
    </div>
    <div style="font-weight:800;font-size:14px;margin-bottom:8px;">Moves</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${MOVES[sp].filter(mv=>mv[1]!=null).map(mv=>`
        <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:12px;padding:12px;">
          <div style="display:flex;justify-content:space-between;">
            <div style="font-family:'Baloo 2',cursive;font-weight:700;">${mv[1]}</div>
            <div style="font-size:11px;font-weight:800;color:var(--ink-soft);">${mv[0]}</div>
          </div>
          <div style="font-size:12px;color:var(--ink-soft);font-weight:600;margin-top:3px;">${mv[2]!=null?mv[2]+'× ATK':'Support'} · ${mv[3]} · spell ${mv[4]} · Lv ${mv[5]}</div>
        </div>
      `).join('')}
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('monsterIndex'));
}

