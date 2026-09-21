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
        const texts = data.wordlist.map(w => typeof w==='string' ? w : w && w.text).filter(Boolean);
        // anything not already coming from words.txt is kept as a local word
        texts.forEach(t=>{ if(!remoteWords.includes(t) && !localWords.includes(t)) localWords.push(t); });
        // v1 carried the checkmarks on the list itself — migrate them onto the profile
        data.wordlist.forEach(w=>{
          if(w && typeof w==='object' && w.text){
            state.wordFlags = state.wordFlags || {};
            state.wordFlags[w.text] = { priority:!!w.priority, regular:w.regular!==false };
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
  setScreenBg('region'+(state.progress.currentRegion||1));
  playMusicChain(['region'+(state.progress.currentRegion||1), 'region']);
  const rid = state.progress.currentRegion || 1;
  const meta = REGIONS.find(r=>r.id===rid) || REGIONS[0];
  $('#brandSub').textContent = 'Region '+rid;

  // Sacred Grove bars the way until the Trial of Courage is passed
  const gated = region2Locked();
  const challengeLabel = rid===4 ? 'Aboard the Vane Shear'
    : rid===3 ? 'Electric Dojo (closed)'
    : rid===2 ? 'Water Dojo' : 'Dojo, Jax & Thugs';

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Regions</button>
    <div class="screen-title">Region ${rid} · ${escapeHtml(meta.name)}</div>
    <div class="screen-sub">${escapeHtml(meta.desc)}</div>
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
    <div class="screen-sub" style="margin-top:18px;font-size:12px;">Level cap here: <b>${levelCap()}</b></div>
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
    <div id="partyList" style="display:flex;flex-direction:column;gap:10px;margin-top:12px;"></div>
  `;
  $('#backBtn').addEventListener('click', ()=> go(backFromMenu()));
  $('#storageBtn').addEventListener('click', ()=>{ ui.storageFrom='party'; go('storage'); });
  renderPartyList();
}

function renderPartyList(){
  const list = $('#partyList');
  if(!list) return;
  list.innerHTML = state.party.map((m,idx)=>{
    const maxHp = monMaxHp(m);
    const open = ui.partyOpen===m.uid;
    return `
    <div class="party-card ${isSeed(m)?'seed-card':''}" data-uid="${m.uid}">
      <div class="party-head" ${isSeed(m)?'':`data-tap="${m.uid}"`}>
        ${monPortrait(m.species,52,{stage:monStage(m),crowned:isCrowned(m)})}
        <div style="flex:1;">
          <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;">${escapeHtml(displayName(m))}${crownMark(m)} <span style="font-size:12px;color:var(--ink-soft);">Lv ${m.level}</span></div>
          <div>${typeBadges(m.species)}</div>
          ${isSeed(m)
            ? `<div style="font-size:11px;color:var(--ink-soft);font-weight:700;margin-top:5px;font-style:italic;">In your care — cannot battle.</div>`
            : `<div class="hpbar" style="margin-top:5px;"><div class="hpfill" style="width:${Math.max(0,m.currentHp/maxHp*100)}%;background:${m.currentHp/maxHp<0.3?'var(--cinnabar)':'var(--jade)'};"></div></div>
               <div style="font-size:11px;color:var(--ink-soft);font-weight:700;margin-top:2px;">${Math.max(0,m.currentHp)}/${maxHp} HP · ATK ${monAtk(m)}</div>`}
        </div>
      </div>
      ${open ? `
        <div class="party-actions">
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

/* The Dragon Stone lives in the inventory and can be moved between dragons. */
/* Shows whichever elemental stone this monster's type can carry. */
function dragonStoneBlock(m){
  const st = stoneFor(m);
  if(!st || !state.inventory[st.id]) return '';
  const holder = stoneHolder(st.id);
  const mine = holder === m.uid;
  return `<div class="crown-panel wide" style="border-color:rgba(59,126,161,.55);background:rgba(59,126,161,.14);">
    <div class="cp-art">${uiIcon(st.icon, 62, st.emoji)}</div>
    <div class="cp-text">
      <div class="crown-title">${escapeHtml(st.name)}</div>
      <div class="crown-sub">${mine
        ? `Attached — this monster gains <b>${st.xp}×</b> experience.`
        : (holder ? 'Currently attached to another monster.' : `Attach it to gain <b>${st.xp}×</b> experience.`)}</div>
      <button class="btn ${mine?'btn-ghost':'btn-primary'}" id="dragonStoneBtn" data-stone="${st.id}" style="margin-top:9px;">
        ${mine ? 'Detach' : 'Attach'}</button>
    </div>
  </div>`;
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
  if(isCrowned(m)){
    return `<div class="crown-panel crowned">
      <div class="crown-title">${crownIcon(18)} Crowned</div>
      <div class="crown-sub">${baseTier(m.species)==='legendary'
        ? 'Carries three extra evolutions\' worth of strength.'
        : 'Raised to legendary growth, with the legendary protein cap.'}</div>
    </div>`;
  }
  const ok = crownEligible(m);
  const why = ok ? '' : crownBlockReason(m);
  return `<div class="crown-panel wide">
    <div class="cp-art">${crownIcon(62)}</div>
    <div class="cp-text">
    <div class="crown-title">Crown <span>${owned} held</span></div>
    <div class="crown-sub">${baseTier(m.species)==='legendary'
      ? 'Would grant three more evolutions\' worth of strength.'
      : 'Would raise this monster to legendary growth and unlock the legendary protein cap.'}</div>
    ${ok && owned>0
      ? `<button class="btn btn-primary" id="useCrown" style="margin-top:10px;">Use a Crown</button>`
      : `<div class="crown-why">${owned>0 ? escapeHtml(why) : 'You have no Crowns.'}</div>`}
    </div>
  </div>`;
}

function confirmCrown(m){
  const legendary = baseTier(m.species)==='legendary';
  const before = monAtk(m);
  const after = computeMaxStat(m.species, m.level, m.supplements, Object.assign({}, m, {crowned:true}));
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
    });
}

function renderStats(){
  const m = state.party.find(x=>x.uid===ui.statsUid) || state.storage.find(x=>x.uid===ui.statsUid);
  if(!m){ return go('party'); }
  $('#brandSub').textContent = 'Stats';
  const sp = SPECIES[m.species];
  const maxHp = monMaxHp(m);
  const need = fightsNeeded(m.level);
  const capped = m.level>=levelCap();
  const suppCap = isPassenger(m) ? 0 : proteinCap(m.species, m);   // crowning raises this
  const atCap = (m.supplements||0) >= suppCap;
  const nextIsFinal = (m.supplements||0) === suppCap-1;
  const moves = MOVES[m.species].map(mv=>{
    const [slot,name,mult,target,words,unlock,extras]=mv;
    const unlocked = name!=null && m.level>=unlock;
    /* Spread the extras — `soul`, `tachy`, `hits`, `spend`, `bonus` and the
       rest live in mv[6], and discarding them left every effect move with
       nothing to describe but "a support move". Same trap as the old
       allow-list in unlockedMoves(). */
    return { slot,name,mult,target,words,unlock,unlocked, ...(extras||{}) };
  });
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
        <span>Level ${m.level}${capped?' (region cap)':''}</span>
        <span style="color:var(--ink-soft);">${capped?'':`${m.xpFights}/${need} fights`}</span>
      </div>
      ${capped?'':`<div class="hpbar" style="margin-top:8px;height:9px;"><div class="hpfill" style="width:${m.xpFights/need*100}%;background:var(--gold);"></div></div>`}
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
      ${dragonStoneBlock(m)}
      ${isDev() ? `<div class="dev-panel" style="margin-top:12px;">
        <div class="dev-head">🛠️ Set level</div>
        <div class="dev-btns" style="margin-top:6px;">
          <button class="qty-btn sm" id="lvDown">−</button>
          <input type="number" class="award-n" id="lvSet" value="${m.level}" min="1" max="100">
          <button class="qty-btn sm" id="lvUp">+</button>
          <button class="btn btn-jade sm-give" id="lvGo">Apply</button>
        </div>
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
            ${mv.unlocked ? statsMoveLine(mv, m) : `Unlocks at Lv ${mv.unlock}`}
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
    $('#lvUp').addEventListener('click',   ()=>{ f.value = Math.min(100,(+f.value||1)+1); });
    $('#lvGo').addEventListener('click', async ()=>{
      const lv = Math.max(1, Math.min(100, Math.floor(+f.value||1)));
      m.level = lv;
      delete m.evoFloor; delete m.evoFloorLevel;      // let it settle at its true form
      m.xpFights = 0;
      m.currentHp = monMaxHp(m);
      await saveProfile();
      toast(`${displayName(m)} set to level ${lv}.`);
      renderStats();
    });
  }
  const ds = $('#dragonStoneBtn');
  if(ds) ds.addEventListener('click', async ()=>{
    const id = ds.dataset.stone;
    const key = stoneOnKey(id);
    const def = ELEMENTAL_STONES.find(x=>x.id===id);
    state.inventory[key] = (state.inventory[key] === m.uid) ? null : m.uid;
    await saveProfile();
    toast(state.inventory[key] ? `${def.name} attached.` : `${def.name} detached.`);
    renderStats();
  });
  const cb = $('#useCrown');
  if(cb) cb.addEventListener('click', ()=> confirmCrown(m));
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
        💠 Element Stones <span>${heldStones().length} held</span></button>` : ''}
      ${recycleAllBar()}
      <div class="col-head">💎 Skills <span>${tokenIcon(16)} ${state.inventory.tokens||0}</span></div>
        <div id="stoneList"></div>
      </div>
    </div>
  `;
  $('#backBtn').addEventListener('click', ()=>{ const t = ui.storageFrom==='shop'?'shop':'party'; ui.storageFrom=null; go(t); });
  $('#toShopBtn').addEventListener('click', ()=>{ ui.storageFrom='storage'; go('shop'); });

  const list = $('#storageList');
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

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Storage</button>
    <div class="screen-title">Element Stones</div>
    <div class="stone-intro">
      An Element Stone attaches to one monster of its own type and gives it
      <b>1.5× experience</b> from every fight. Move it whenever you like — a stone
      helps a monster that is falling behind far more than one already grown.
      <br><br><i>Only one monster may carry a given stone at a time.</i>
    </div>

    ${held.length ? held.map(st=>{
      const holderUid = stoneHolder(st.id);
      const mon = holderUid && all.find(m=>m.uid===holderUid);
      const eligible = all.filter(m=>(SPECIES[m.species].types||[]).includes(st.type) && !isPassenger(m));
      return `<div class="es-row">
        <div class="es-icon">${uiIcon(st.icon, 54, st.emoji)}</div>
        <div class="es-body">
          <div class="es-name">${escapeHtml(st.name)}</div>
          <div class="es-sub">${mon
            ? `Carried by <b>${escapeHtml(displayName(mon))}</b> · Lv ${mon.level}`
            : (eligible.length ? `${eligible.length} ${st.type} monster${eligible.length>1?'s':''} can carry it`
                               : `No ${st.type} monster to carry it yet`)}</div>
        </div>
        <div class="es-actions">
          ${mon ? (stoneBound(st.id, mon)
                    ? `<span class="es-sub" style="font-weight:700;">Bound to him until he is crowned</span>`
                    : `<button class="btn btn-ghost es-btn" data-detach="${st.id}">Detach</button>`)
                : `<button class="btn btn-primary es-btn" data-attach="${st.id}" ${eligible.length?'':'disabled'}>Attach</button>`}
        </div>
      </div>`;
    }).join('') : `<div class="phase-flag">You haven't found any Element Stones yet.</div>`}
  `;
  $('#backBtn').addEventListener('click', ()=>go('storage'));
  screenEl.querySelectorAll('[data-detach]').forEach(b=>b.addEventListener('click', async ()=>{
    const id = b.dataset.detach;
    const holder = all.find(m=> m.uid === stoneHolder(id));
    if(stoneBound(id, holder)){ toast('It will not come away from him.'); return; }
    state.inventory[stoneOnKey(id)] = null;
    await saveProfile();
    toast(`${ELEMENTAL_STONES.find(x=>x.id===id).name} detached.`);
    renderElementStones();
  }));
  screenEl.querySelectorAll('[data-attach]').forEach(b=>b.addEventListener('click', ()=>{
    const st = ELEMENTAL_STONES.find(x=>x.id===b.dataset.attach);
    const eligible = all.map((m,i)=>({m,i})).filter(o=>
      (SPECIES[o.m.species].types||[]).includes(st.type) && !isPassenger(o.m));
    monsterChooser(`Give the ${st.name} to…`, eligible, async (i)=>{
      state.inventory[stoneOnKey(st.id)] = all[i].uid;
      await saveProfile();
      toast(`${st.name} attached to ${displayName(all[i])}.`);
      renderElementStones();
    });
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

function moveToParty(uid){
  const idx = state.storage.findIndex(m=>m.uid===uid);
  if(idx<0) return;
  if(slottedCount()<6){
    const [m]=state.storage.splice(idx,1);
    state.party.push(m);
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

