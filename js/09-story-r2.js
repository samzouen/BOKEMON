/* ==========================================================
   09-story-r2.js
   Region 2: Trial of Courage, Water Dojo, Rocky Caverns, Padrino.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ============================================================
   SHOP
   Medals earned from spelling mastery are spent here. Deliberate purchases,
   not random drops — the long grind converts into a chosen reward.
   ============================================================ */
const SHOP_PRICES = {
  skillToken:   { cur:'bronze', cost:1, yields:2 },   // 1 Bronze buys TWO Skill Tokens
  randomStone:  { cur:'tokens', cost:TOKENS_PER_ROLL },
  protein:      { cur:'silver', cost:10 },
  eliteStone:   { cur:'gold',   cost:25 },
  highSkill:    { cur:'gold',   cost:10 },
  veryHighSkill:{ cur:'gold',   cost:50 },
  ultraSkill:   { cur:'gold',   cost:100 },
  crown:        { cur:'gold',   cost:100 },
  goldMedal:    { cur:'tokens', cost:15 },   // Region 5+: buy gold with tokens
  waterStone:   { cur:'tokens', cost:100 },  // Region 4 only, once ever
  voidStone:    { cur:'tokens', cost:50 },
};
const SHOP_GREETINGS = [
  "Welcome in! Every word you've mastered is worth something here.",
  "Ah, a returning trainer. Let's see what your medals can buy.",
  "Fresh stock today — take your time browsing.",
  "Those medals won't spend themselves, you know!",
  "Study hard, shop well. That's the way of it.",
  "Something catch your eye? I keep only the good stuff.",
  "Back again? Your monsters must be getting strong.",
  "Medals in, power out. Simple as that.",
];
/* The five tiers run dull to bright: grey, green, blue, gold, red. */
function oddsTable(){
  return `<div class="odds-table">
    ${STONE_TIERS.map(t=>`
      <div class="odds-row">
        <span class="odds-swatch tier-${t.id}"></span>
        <span class="odds-name">${t.label}</span>
        <span class="odds-pct">${Math.round(t.odds*100)}%</span>
      </div>`).join('')}
  </div>`;
}

function shopGreeting(){ return SHOP_GREETINGS[Math.floor(Math.random()*SHOP_GREETINGS.length)]; }

/* Faceted CSS gems, drawn in code so no art files are needed. Higher tiers gain
   a glowing aura; Ultra additionally emits drifting motes like an evolution. */
function gemIcon(tier, size){
  const px = size || 44;
  const glow = (tier==='ultra'||tier==='veryhigh'||tier==='high') ? ' glow' : '';
  const motes = tier==='ultra'
    ? `<span class="gem-motes">${Array.from({length:6},(_,i)=>`<i style="left:${10+i*15}%;animation-delay:${i*0.35}s"></i>`).join('')}</span>`
    : '';
  return `<span class="gem-wrap" style="width:${px}px;height:${px}px;">${motes}<span class="gem tier-${tier}${glow}"></span></span>`;
}

function medalCount(cur){
  if(cur==='tokens') return state.inventory.tokens||0;
  return (state.medals && state.medals[cur]) || 0;
}
function curIcon(cur){ return cur==='tokens' ? tokenIcon(16) : medalIcon(cur); }
function curName(cur){
  return cur==='tokens' ? 'Skill Tokens'
       : cur.charAt(0).toUpperCase()+cur.slice(1)+' Medals';
}
async function spend(cur, amount){
  if(medalCount(cur) < amount) return false;
  if(cur==='tokens') state.inventory.tokens -= amount;
  else state.medals[cur] -= amount;
  return true;
}

function renderShop(){
  // aboard the Vane Shear the shop is the shipkeeper's corner of the chart room
  setScreenBg((state.progress.currentRegion === 4) ? 'battle_cabin_deck' : 'shop');
  $('#brandSub').textContent = 'Shop';
  if(!ui.shopGreeting) ui.shopGreeting = shopGreeting();
  const m = state.medals || {bronze:0,silver:0,gold:0};
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← ${ui.walkBack ? 'Back' : 'Region'}</button>

    <div class="shop-keeper">
      ${npcPortrait(state.progress.currentRegion===4 ? 'shipkeeper' : 'shopkeeper'+(state.progress.currentRegion||1),'🧑‍🌾',110,'transparent')}
      <div class="shop-bubble">${escapeHtml(ui.shopGreeting)}</div>
    </div>

    <div class="medal-bar">
      <span>🥉 ${m.bronze||0}</span><span>🥈 ${m.silver||0}</span><span>🥇 ${m.gold||0}</span><span>${tokenIcon(15)} ${state.inventory.tokens||0}</span><span>${crownIcon(16)} ${state.inventory.crowns||0}</span>
    </div>

    <div id="shopWares" class="ware-grid"></div>

    <button class="btn btn-ghost" id="shopStorage" style="margin-top:14px;">📦 Open Storage</button>
    ${ui.shopNote ? `<div class="shop-note">💎 ${escapeHtml(ui.shopNote)}</div>` : ''}
  `;
  $('#backBtn').addEventListener('click', ()=>{ ui.shopGreeting=null; ui.shopNote=null; go(backFromMenu()); });
  if(ui.shopNote) setTimeout(()=>{ ui.shopNote=null; }, 6000);
  $('#shopStorage').addEventListener('click', ()=>{ ui.storageFrom='shop'; go('storage'); });

  /* Stock arrives with the regions, so the shop grows as the story does.
     `from` is the earliest region that carries the item. */
  const wares = [
    { id:'skillToken',    from:1, icon:tokenIcon(44), name:'Skill Tokens ×2',        desc:'Each Bronze Medal buys TWO tokens. Spins cost 5.', qty:true },
    { id:'randomStone',   from:1, icon:gemIcon('mid'), name:'Random Skill Stone', desc:'One spin, right now. Any tier, any type.' },
    { id:'protein',       from:2, icon:'💪', name:'Protein Supplement',     desc:'Permanently raises one monster\'s stats.' },
    { id:'eliteStone',    from:2, icon:gemIcon('veryhigh'), name:'Random Elite Skill Stone', desc:'Guaranteed Very High or Ultra.' },
    { id:'highSkill',     from:2, icon:gemIcon('high'), name:'High Quality Skill', desc:'Pick any High-tier skill yourself.', pick:'high' },
    { id:'veryHighSkill', from:3, icon:gemIcon('veryhigh'), name:'Very High Quality Skill', desc:'Pick any Very High skill yourself.', pick:'veryhigh' },
    { id:'ultraSkill',    from:4, icon:gemIcon('ultra'), name:'Ultra Quality Skill', desc:'Pick any Ultra skill yourself.', pick:'ultra' },
    { id:'crown',         from:4, icon:crownIcon(50), name:'Crown', desc:'Raises one beloved monster to legendary strength.' },
    { id:'voidStone',     from:3, icon:voidIcon(44), name:'Void Stone', desc:'Draws a learned skill back out of a monster.' },
    { id:'goldMedal',     from:5, icon:'🥇', name:'Gold Medal', desc:'Trade tickets for gold.', qty:true },
    /* Salvage out of the Vane Shear's hold: the last thing on the shelf, sold
       only aboard, and only ever one. */
    { id:'waterStone',    from:4, only:4, icon:uiIcon('water_stone',44,'💧'), name:'Water Stone',
      desc:'Attach it to any Water monster for 1.5× experience. One only, ever.' },
  ];
  const region = state.progress.currentRegion || 1;
  const box = $('#shopWares');
  /* A ware pinned to one region is not merely out of stock elsewhere — it is
     not on the shelf at all, and should not be shown greyed out. */
  box.innerHTML = wares.filter(w=> !w.only || region === w.only).map(w=>{
    const pr = SHOP_PRICES[w.id];
    /* `only` pins a ware to a single region, and a one-off vanishes once taken. */
    const stocked = region >= w.from && (!w.only || region === w.only)
                  && !(w.id === 'waterStone' && state.inventory.waterStone);
    const afford = stocked && medalCount(pr.cur) >= pr.cost;
    return `<div class="ware ${stocked?(afford?'':'cant'):'oos'}" ${stocked?`data-ware="${w.id}"`:''}>
      <div class="ware-icon">${w.icon}</div>
      <div class="ware-name">${escapeHtml(w.name)}</div>
      ${stocked
        ? `<div class="ware-price">${curIcon(pr.cur)} ${pr.cost}</div>`
        : `<div class="ware-oos">Out of stock</div>`}
    </div>`;
  }).join('');
  box.querySelectorAll('[data-ware]').forEach(el=>el.addEventListener('click', ()=>{
    const w = wares.find(x=>x.id===el.dataset.ware);
    if(w.qty) return openQtyPurchase(w);
    if(w.pick) return openSkillPicker(w);
    return openSinglePurchase(w);
  }));
}

/* Overlay header showing the relevant currency, per spec. */
function shopOverlay(cur, inner){
  const ov = document.createElement('div');
  ov.className = 'shop-overlay';
  ov.innerHTML = `
    <div class="shop-ov-top">${curIcon(cur)} <b id="ovCount">${medalCount(cur)}</b></div>
    <div class="shop-ov-body">${inner}</div>`;
  document.body.appendChild(ov);
  return ov;
}

/* Quantity purchase with − / + / Max (Skill Tokens). */
function openQtyPurchase(w){
  const pr = SHOP_PRICES[w.id];
  const max = Math.floor(medalCount(pr.cur)/pr.cost);
  let qty = max>0 ? 1 : 0;
  const ov = shopOverlay(pr.cur, `
    <div class="qty-card">
      <div class="ware-icon big">${w.icon}</div>
      <div class="ware-name" style="font-size:19px;">${escapeHtml(w.name)}</div>
      <div class="ware-desc" style="margin-bottom:14px;">${curIcon(pr.cur)} ${pr.cost} ${curName(pr.cur)}
        ${(pr.yields||1) > 1 ? `→ ${tokenIcon(15)} <b>${pr.yields}</b> each time` : 'each'}</div>
      <div class="qty-row">
        <button class="qty-btn" id="qMinus">−</button>
        <div class="qty-val" id="qVal">${qty}</div>
        <button class="qty-btn" id="qPlus">+</button>
        <button class="qty-btn wide" id="qMax">Max</button>
      </div>
      <div class="ware-desc" id="qTotal" style="margin-top:10px;"></div>
      <button class="btn btn-primary" id="qBuy" style="margin-top:14px;" ${qty?'':'disabled'}>Buy</button>
      <button class="btn btn-ghost" id="qCancel" style="margin-top:8px;">Cancel</button>
    </div>`);
  const refresh = ()=>{
    ov.querySelector('#qVal').textContent = qty;
    ov.querySelector('#qTotal').innerHTML = qty
      ? `Pay ${curIcon(pr.cur)} <b>${qty*pr.cost}</b> &nbsp;·&nbsp; receive ` +
        (w.id==='goldMedal' ? `🥇 <b>${qty}</b>` : `${tokenIcon(15)} <b>${qty*(pr.yields||1)}</b>`)
      : 'Not enough medals.';
    ov.querySelector('#qPlus').disabled = qty >= max;
    ov.querySelector('#qMinus').disabled = qty <= 1;
    ov.querySelector('#qBuy').disabled = qty < 1;
  };
  refresh();
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#qCancel').addEventListener('click', close);
  ov.querySelector('#qMinus').addEventListener('click', ()=>{ if(qty>1){ qty--; refresh(); } });
  ov.querySelector('#qPlus').addEventListener('click', ()=>{ if(qty<max){ qty++; refresh(); } });
  ov.querySelector('#qMax').addEventListener('click', ()=>{ qty = max; refresh(); });
  ov.querySelector('#qBuy').addEventListener('click', async ()=>{
    if(qty<1) return;
    const before = medalCount(pr.cur);
    if(!await spend(pr.cur, qty*pr.cost)) return;
    if(w.id==='goldMedal') state.medals.gold = (state.medals.gold||0) + qty;
    else if(w.id==='waterStone') state.inventory.waterStone = true;
    else state.inventory.tokens = (state.inventory.tokens||0) + qty * (pr.yields||1);
    const sv = showSyncingOverlay('Syncing…');
    const ok = await saveProfile({ awaitCloud:true });
    hideSyncingOverlay(sv);
    if(!ok){
      state.medals[pr.cur] = before;
      // roll back what was actually granted, not the purchase count
      if(w.id==='goldMedal') state.medals.gold -= qty;
      else state.inventory.tokens -= qty * (pr.yields||1);
      showSyncFailure(); return;
    }
    playSfx('stone_low');
    close();
    toast(`Bought ${qty} Skill Token${qty>1?'s':''}!`);
    renderShop();
  });
}

/* One-tap purchases: random stone, protein, elite stone. */
function openSinglePurchase(w){
  const pr = SHOP_PRICES[w.id];
  const ov = shopOverlay(pr.cur, `
    <div class="qty-card">
      <div class="ware-icon big">${w.icon}</div>
      <div class="ware-name" style="font-size:19px;">${escapeHtml(w.name)}</div>
      <div class="ware-desc" style="margin:6px 0 10px;">${escapeHtml(w.desc)}<br><b>${curIcon(pr.cur)} ${pr.cost} ${curName(pr.cur)}</b></div>
      ${w.id==='randomStone' ? oddsTable() : ''}
      <button class="btn btn-primary" id="pBuy" ${medalCount(pr.cur)>=pr.cost?'':'disabled'}>${medalCount(pr.cur)>=pr.cost?'Buy':'Not enough'}</button>
      <button class="btn btn-ghost" id="pCancel" style="margin-top:8px;">Cancel</button>
    </div>`);
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#pCancel').addEventListener('click', close);
  ov.querySelector('#pBuy').addEventListener('click', async ()=>{
    if(medalCount(pr.cur) < pr.cost) return;
    const snapshot = { tokens:state.inventory.tokens, protein:state.inventory.protein, medals:Object.assign({},state.medals), stones:state.moveStones.length };
    await spend(pr.cur, pr.cost);
    let stone = null;
    if(w.id==='randomStone'){ stone = newMoveStone(); state.moveStones.push(stone); }
    else if(w.id==='eliteStone'){ stone = newEliteStone(); state.moveStones.push(stone); }
    else if(w.id==='protein'){ state.inventory.protein = (state.inventory.protein||0)+1; }
    else if(w.id==='crown'){ state.inventory.crowns = (state.inventory.crowns||0)+1; }
    else if(w.id==='voidStone'){ state.inventory.voidStones = (state.inventory.voidStones||0)+1; }
    const sv = showSyncingOverlay('Syncing…');
    const ok = await saveProfile({ awaitCloud:true });
    hideSyncingOverlay(sv);
    if(!ok){
      state.inventory.tokens = snapshot.tokens; state.inventory.protein = snapshot.protein;
      state.medals = snapshot.medals; state.moveStones.length = snapshot.stones;
      showSyncFailure(); return;
    }
    close();
    if(stone) showStoneReveal(stone, 'Purchased!', 'shop');
    else if(w.id==='crown'){ playSfx('evolution'); ui.shopNote='A Crown is yours. Use it from a monster\'s Stats page.'; renderShop(); }
    else { playSfx('protein_use'); toast('Protein Supplement purchased!'); renderShop(); }
  });
}

/* Browse-and-choose picker for the three hand-picked skill tiers. */
function openSkillPicker(w){
  const pr = SHOP_PRICES[w.id];
  const tier = w.pick;
  const t = stoneTierDef(tier);
  const ov = shopOverlay(pr.cur, `
    <div class="pick-card">
      <div class="ware-name" style="font-size:19px;">${escapeHtml(w.name)}</div>
      <div class="ware-desc" style="margin:4px 0 12px;">${curIcon(pr.cur)} ${pr.cost} ${curName(pr.cur)} · tap a skill to read what it does</div>
      <div class="pick-list">
        ${stoneTypePool().map(tp=>`
          <button class="pick-opt" data-type="${tp}">
            <span class="type-badge" style="background:${TYPE_COLORS[tp]};">${tp}</span>
            <span class="pick-name">${escapeHtml(stoneName(tp,tier))}</span>
          </button>`).join('')}
      </div>
      <button class="btn btn-ghost" id="pkCancel" style="margin-top:12px;">Cancel</button>
    </div>`);
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#pkCancel').addEventListener('click', close);
  ov.querySelectorAll('.pick-opt').forEach(b=>b.addEventListener('click', ()=>{
    const type = b.dataset.type;
    const name = stoneName(type, tier);
    const detail = `<b>${escapeHtml(name)}</b> (${type})<br><br>${t.mult!=null?t.mult+'× ATK':'Status move'} · ${t.words} words<br>${stoneDescription({tier,type})}<br><br>Buy for ${curIcon(pr.cur)} ${pr.cost}?`;
    confirmDialogHtml(detail, async ()=>{
      if(medalCount(pr.cur) < pr.cost){ toast('Not enough medals.'); return; }
      const snapshot = Object.assign({}, state.medals);
      await spend(pr.cur, pr.cost);
      const stone = { uid:'s'+Date.now()+Math.floor(Math.random()*1000), tier, type, name };
      state.moveStones.push(stone);
      const sv = showSyncingOverlay('Syncing…');
      const ok = await saveProfile({ awaitCloud:true });
      hideSyncingOverlay(sv);
      if(!ok){ state.medals = snapshot; state.moveStones.pop(); showSyncFailure(); return; }
      close();
      showStoneReveal(stone, 'Purchased!');
    });
  }));
}

/* confirmDialog variant that allows rich content. */
function confirmDialogHtml(html, onYes){
  const scrim = document.createElement('div');
  scrim.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.6);z-index:95;display:flex;align-items:center;justify-content:center;padding:24px;';
  scrim.innerHTML = `
    <div style="background:var(--paper);border-radius:18px;padding:22px;max-width:340px;width:100%;box-shadow:0 12px 40px var(--shadow);">
      <div style="font-size:14px;font-weight:600;line-height:1.55;margin-bottom:16px;">${html}</div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost" id="chNo" style="flex:1;">Cancel</button>
        <button class="btn btn-primary" id="chYes" style="flex:1;">Buy</button>
      </div>
    </div>`;
  document.body.appendChild(scrim);
  const close=()=>{ if(scrim.parentNode) document.body.removeChild(scrim); };
  scrim.querySelector('#chNo').addEventListener('click', close);
  scrim.addEventListener('click', e=>{ if(e.target===scrim) close(); });
  scrim.querySelector('#chYes').addEventListener('click', ()=>{ close(); onYes(); });
}


/* ---------- Trial of Courage: resolution ----------
   The fight is not meant to be won. Whichever way it ends, the Guardian
   acknowledges the courage it took to stand and fight — so the normal defeat
   penalty (XP loss, 10% HP) is skipped entirely and the same scene plays. */
async function onGuardianTrialResolved(){
  stopMusic();
  const r2 = state.progress.region2;
  const wasBeaten = livingEnemies().length === 0;

  // never punish the player for the scripted loss
  battleParty().forEach(m=>{ if(m.currentHp<=0) m.currentHp = Math.max(1, Math.floor(monMaxHp(m)*0.10)); });

  r2.trialDone = true;
  let seed = null;
  if(!r2.seedGranted){ seed = grantSacredSeed(); r2.seedGranted = true; }
  await saveProfile();

  $('#brandSub').textContent = 'The Sacred Grove';
  document.body.classList.remove('writing');
  document.body.classList.add('in-scene');
  window.scrollTo(0,0);
  setScreenBg('explore');
  screenEl.innerHTML = `
    <div class="scene">
      <div class="scene-portrait cutout">${monPortrait('forest_fairy', 170, { view:'front', bare:true, stage:1, crowned:true })}</div>
      <div class="scene-title">The Forest Guardian</div>
      <div class="scene-body">
        ${wasBeaten
          ? `<p>"…You actually <b>felled</b> me." She rises, unhurried, and something like delight crosses her face. "Then there is no question at all about your courage."</p>`
          : `<p>The last of your team sinks to the moss. You reach for another — and find the Guardian's hand raised, gently, telling you to stop.</p>
             <p>"Enough, little trainer. You did not run. Thirty times you could have turned away, and thirty times you stayed."</p>`}
        <p>"Courage is not the absence of fear. It is standing in the same place fear does."</p>
        <p>She presses something small and warm into your hands — <b>a Sacred Seed</b>, pale green and faintly glowing.</p>
        <p>"Guard it. Feed it your effort as you have fed your own. And remember the lesson of courage — you will need it again, sooner than you think."</p>
      </div>
      ${seed ? `<div class="scene-reward">${monPortrait('sacred_seed', 64, { bare:true })}<div><b>Sacred Seed</b> joined your care.<br><span>It travels in its own slot and cannot fight.</span></div></div>` : ''}
      <button class="btn btn-primary" id="sceneNext" style="margin-top:16px;">Continue</button>
    </div>
  `;
  playSfx('evolution');
  $('#sceneNext').addEventListener('click', ()=>{
    document.body.classList.remove('in-scene');
    toast('Sacred Grove is open. The city awaits.');
    go('region');
  });
}



/* ============================================================
   EYE BREAK
   Counts wild and NPC battles only — Recovery and practice are already gated
   by HP, so they don't add to the tally. The break is stored as a WALL-CLOCK
   deadline from the device, so reloading the page can't skip it. It never
   interrupts a battle: the check happens once the victory screen is up.
   ============================================================ */
function eyeBreakActive(){
  return !!(state && state.eyeBreakUntil && Date.now() < state.eyeBreakUntil);
}
function eyeBreakRemaining(){
  return Math.max(0, (state.eyeBreakUntil||0) - Date.now());
}
/* Called when a battle finishes. Returns true if a break has just begun. */
const EYE_IDLE_RESET_MS = 20 * 60 * 1000;
function tallyBattleForEyeBreak(){
  if(!state) return false;
  battlesToday(); state.battlesToday.n++;           // every battle counts toward the day, breaks on or off
  const every = state.settings.eyeBreakEvery || 0;
  if(every <= 0) return false;                       // 0 disables the feature
  /* Twenty minutes without a battle is a rest in itself, so the count starts
     again from nothing. */
  const now = Date.now();
  if(state.lastBattleAt && now - state.lastBattleAt >= EYE_IDLE_RESET_MS) state.battlesSinceBreak = 0;
  state.lastBattleAt = now;
  state.battlesSinceBreak = (state.battlesSinceBreak||0) + 1;
  if(state.battlesSinceBreak >= every){
    state.battlesSinceBreak = 0;
    state.eyeBreakUntil = Date.now() + (state.settings.eyeBreakMins||5)*60*1000;
    saveProfile();
    return true;
  }
  saveProfile();
  return false;
}

let _eyeTimer = null;
function endEyeBreak(msg){
  if(_eyeTimer){ clearInterval(_eyeTimer); _eyeTimer = null; }
  const o = document.getElementById('eyeBreakOverlay');
  if(o && o.parentNode) o.parentNode.removeChild(o);
  document.body.classList.remove('eye-locked');
  state.eyeBreakUntil = 0;
  saveProfile();
  toast(msg || 'Break over — welcome back!');
}
function showEyeBreak(){
  if(document.getElementById('eyeBreakOverlay')) return;
  const ov = document.createElement('div');
  ov.id = 'eyeBreakOverlay';
  ov.className = 'eye-overlay';
  ov.innerHTML = `
    <div class="eye-card">
      <div class="eye-emoji">👀</div>
      <div class="eye-title">Time to rest your eyes</div>
      <div class="eye-body">Look at something far away — out a window if you can.<br>The game will wake up on its own.</div>
      <div class="eye-clock" id="eyeClock">--:--</div>
      <div class="eye-note">Everything is paused until the timer ends.</div>
      <div id="eyeGate" style="display:none;margin-top:16px;">
        <input type="password" id="eyePw" placeholder="Password" inputmode="numeric" autocomplete="off"
          style="width:100%;box-sizing:border-box;">
        <div id="eyePwMsg" style="font-size:12px;font-weight:700;min-height:16px;margin-top:6px;color:#f3b7a8;"></div>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button class="btn btn-primary" id="eyePwGo" style="flex:1;">End the break</button>
          <button class="btn btn-ghost" id="eyePwNo" style="flex:1;">Cancel</button>
        </div>
      </div>
    </div>
    <button id="eyeOverride" aria-label="Grown-ups: end the break"
      style="position:absolute;top:calc(env(safe-area-inset-top, 0px) + 12px);right:12px;
             background:rgba(244,236,216,.12);color:#f4ecd8;border:1px solid rgba(244,236,216,.35);
             border-radius:12px;padding:8px 12px;font-size:13px;font-weight:700;cursor:pointer;">
      🔒 Grown-ups
    </button>`;
  document.body.appendChild(ov);
  document.body.classList.add('eye-locked');
  /* The parent's password (or the default, if none has been set) ends it now. */
  const gate = ov.querySelector('#eyeGate'), pw = ov.querySelector('#eyePw'), msg = ov.querySelector('#eyePwMsg');
  ov.querySelector('#eyeOverride').addEventListener('click', ()=>{
    gate.style.display = 'block'; msg.textContent = ''; pw.value = ''; pw.focus();
  });
  ov.querySelector('#eyePwNo').addEventListener('click', ()=>{ gate.style.display = 'none'; });
  const tryPw = ()=>{
    if(passOk(pw.value.trim())) return endEyeBreak('Break ended by a grown-up.');
    msg.textContent = 'Incorrect password.';
    pw.value = '';
  };
  ov.querySelector('#eyePwGo').addEventListener('click', tryPw);
  pw.addEventListener('keydown', e=>{ if(e.key === 'Enter') tryPw(); });

  const tick = ()=>{
    const ms = eyeBreakRemaining();
    const el = document.getElementById('eyeClock');
    if(ms <= 0) return endEyeBreak();
    if(el){
      const total = Math.ceil(ms/1000);
      el.textContent = String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
    }
  };
  tick();
  _eyeTimer = setInterval(tick, 250);
}
/* Re-assert the locks on any render, so a reload stays locked. The day's limit
   comes first: it is the bigger of the two. */
function enforceEyeBreak(){
  if(dailyLimitActive()) return showDailyLock();
  if(dailyOverrideActive()) scheduleDailyRecheck();
  if(eyeBreakActive()) showEyeBreak();
}


/* ---------- SCREEN: Region 2 challenges (the Water Dojo) ---------- */
/* The Water Dojo Master hands over a Lanternfish — the lamp that lights the
   Rocky Caverns. Runs on load too, so a save that cleared the Dojo before this
   existed still receives it. */
/* Keep only the best egg (or hatched dragon) — earlier builds could mint one
   per replay of the finale. */
function dedupeDragonEggs(){
  const all = [...state.party, ...state.storage]
    .filter(m=>isEgg(m) || m.species==='water_dragon_nerfed');
  if(all.length <= 1) return 0;
  all.sort((a,b)=> (b.level||0) - (a.level||0));
  const keep = all[0];
  const drop = new Set(all.slice(1).map(m=>m.uid));
  state.party   = state.party.filter(m=>!drop.has(m.uid));
  state.storage = state.storage.filter(m=>!drop.has(m.uid));
  return drop.size;
}

function grantLanternfish(){
  if(state.lanternGranted) return null;
  const already = [...state.party, ...state.storage].some(m=>m.species==='lanternfish');
  state.lanternGranted = true;
  if(already) return null;
  const fish = newMonster('lanternfish', 25);
  if(slottedCount() < 6) state.party.push(fish); else state.storage.push(fish);
  if(!state.caughtSpecies.includes('lanternfish')) state.caughtSpecies.push('lanternfish');
  if(!state.encounteredSpecies.includes('lanternfish')) state.encounteredSpecies.push('lanternfish');
  return fish;
}

function waterDojoCleared(id){ return ((state.progress.region2||{}).waterDojo||[]).includes(id); }
function nextWaterStage(){ return WATER_DOJO_STAGES.find(st=>!waterDojoCleared(st.id)); }

/* Jax returns, stronger — and only for players who already beat him in
   Region 1, so his reappearance means something. */
/* Six monsters, one at a time — six waves, not three pairs. Fought singly they
   are a longer duel, and the XP is credited per wave rather than in bulk. */
const R2_RIVAL_WAVES = [
  [{species:'golem',level:41}],
  [{species:'bat',level:41}],
  [{species:'electric_starter',level:44}],
  [{species:'ground_starter',level:44}],
  [{species:'eagle',level:46,ai:'stoop'}],
];
/* His last monster counters the player's own starter, as in Region 1. */
function r2RivalWaves(){
  const waves = R2_RIVAL_WAVES.map(w=>w.map(e=>({...e})));
  waves.push([{ species:effectiveStarter(), level:46 }]);
  return waves;
}

function renderChallengeR3(){
  setScreenBg('challenge');
  $('#brandSub').textContent = 'Challenge';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Region</button>
    <div class="screen-title">Challenges</div>
    <div class="screen-sub">Port Akrotiri</div>
    ${(state.progress.region3||{}).vaneShearSeen ? `
      <div class="challenge-card" id="cConcert">
        ${npcPortrait('electric_master','🎸',50,'#e0b53a')}
        <div style="flex:1;">
          <div class="cc-title">Band Competition ${concertState().bandCleared?'<span class="clear-tag">Cleared</span>':''}</div>
          <div class="cc-desc">${concertState().bandCleared
            ? 'The Electric Dojo owes you a favour.'
            : `Five sailor fans and one very tired band · ${sailorsBeaten()}/5 seen off`}</div>
        </div>
      </div>` : ''}
    <div class="challenge-card" id="cDojo">
      ${npcPortrait('electric_master','⚡',50,'#e0b53a')}
      <div style="flex:1;">
        <div class="cc-title">Electric Dojo ${(()=>{
          const d = (state.progress.region3||{}).dojo || {};
          if(d.verdict) return '<span class="clear-tag">Settled</span>';
          if(concertState().bandCleared) return '<span class="clear-tag" style="background:var(--gold);color:#fff;">Open</span>';
          return '<span class="clear-tag" style="background:var(--paper-3);color:var(--ink-soft);">Closed</span>';
        })()}</div>
        <div class="cc-desc">${(()=>{
          const d = (state.progress.region3||{}).dojo || {};
          if(d.verdict) return d.verdict==='electric' ? 'The siblings kept the hall.' : 'The Sage disciples hold the hall.';
          if(concertState().bandCleared) return 'Two claims on an empty hall. Someone must judge.';
          return 'A hand-written sign hangs on the door.';
        })()}</div>
      </div>
    </div>
    ${(state.progress.region3||{}).vaneShearSeen ? '' :
      '<div class="phase-flag">The band competition has emptied half the port. Visit the RRS Vane Shear to learn more.</div>'}
  `;
  $('#backBtn').addEventListener('click', ()=>go('region'));
  const cc = $('#cConcert');
  if(cc) cc.addEventListener('click', ()=> go('concert'));
  $('#cDojo').addEventListener('click', ()=>{
    // once the band has gone the hall is contested, and you are the judge
    if(concertState().bandCleared) return go('dojo');
    return storyModal(npcPortrait('electric_master','⚡',120,'transparent'),
    concertState().bandCleared ? 'Under new management. Eventually.' : 'Closed for the competition',
    concertState().bandCleared
      ? `<div class="dojo-sign">ELECTRIC DOJO — <b>CLOSED</b><br><br>` +
        `<b>Djenta</b> has hung up her gloves for a guitar.<br>` +
        `We are <b>seeking a new Dojo Master</b>.<br><br>` +
        `<i>Strength alone will not do. Come and be judged.</i></div><br>` +
        `Through the shutters, the hall is dark and the mats are stacked.`
      : `The sign reads, in a confident hand:<br><br>` +
        `<i>"GONE TO THE BAND COMPETITION. All of us. Yes, all. Spar amongst yourselves."</i><br><br>` +
        `Through the shutters you can hear something enormous being tuned.`,
      ()=>go('challenge'));
  });
}

function renderChallengeR2(){
  setScreenBg('challenge');
  $('#brandSub').textContent = 'Challenge';
  const r2 = state.progress.region2 || {};
  const r1Rival = !!(state.progress.region1||{}).rivalCleared;   // only if beaten in Region 1
  const done = (r2.waterDojo||[]).length;
  const nxt = nextWaterStage();
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Region</button>
    <div class="screen-title">Challenges</div>
    <div class="screen-sub">Region 2 · the Water Dojo</div>
    <div class="challenge-card" id="cWater">
      ${npcPortrait((nxt||{}).id || 'water_master', '🌊', 50, '#3b7ea1')}
      <div style="flex:1;">
        <div class="cc-title">Water Dojo ${done>=4?'<span class="clear-tag">Cleared</span>':''}</div>
        <div class="cc-desc">${done>=4
          ? 'All four challengers beaten.'
          : `${done}/4 beaten · next: <b>${escapeHtml((nxt||{}).label||'')}</b>`}</div>
      </div>
    </div>
    ${r1Rival ? `
    <div class="challenge-card" id="cRival2">
      ${npcPortrait('rival', '🥊', 50, '#c8453a')}
      <div style="flex:1;">
        <div class="cc-title">Rival ${r2.rivalCleared?'<span class="clear-tag">Cleared</span>':''}</div>
        <div class="cc-desc">${r2.rivalCleared?'You beat him again.':'He followed you here. Six monsters, and he means it.'}</div>
      </div>
    </div>` : ''}
    <div class="phase-flag">More Region 2 challenges arrive with the next story chapter.</div>
  `;
  $('#backBtn').addEventListener('click', ()=>go('region'));
  const cr = $('#cRival2');
  if(cr) cr.addEventListener('click', ()=>{
    if(r2.rivalCleared){ toast('You have already beaten him here.'); return; }
    if(!ensurePool()) return;
    beginBattle({ isNpc:true, name:'Jax', npcId:'rival',
      waves: r2RivalWaves().map(w=>w.map(e=>({...e, ai:'best', nerfed:false}))),
      onWin:onR2RivalWin });
  });
  const c = $('#cWater');
  if(c) c.addEventListener('click', ()=>{
    const st = nextWaterStage();
    if(!st){ toast('You have already cleared the Water Dojo.'); return; }
    if(!ensurePool()) return;
    beginBattle({ isNpc:true, name:st.label, npcId:st.id,
      waves: st.waves.map(w=>w.map(e=>({...e, ai:st.ai, nerfed:false}))),
      onWin:()=>onWaterStageWin(st) });
  });
}
async function onR2RivalWin(){
  const r2 = state.progress.region2;
  r2.rivalCleared = true;
  state.inventory.protein = (state.inventory.protein||0) + 3;
  await saveProfile();
  challengeResult('🥊', 'Rival defeated!',
    `"Still can't beat you." He shoulders his bag and grins, but there's something new behind it.<br><br>` +
    `"Doesn't matter. I've been <b>recruited</b> — a proper organisation, the kind that gets you places. ` +
    `You'll hear about them." He turns to go. "Next time we meet, I won't be doing this alone."<br><br>` +
    `<b>+3 Protein Supplements</b>`,
    'challenge');
}

async function onWaterStageWin(stage){
  const r2 = state.progress.region2;
  r2.waterDojo = r2.waterDojo || [];
  if(!r2.waterDojo.includes(stage.id)) r2.waterDojo.push(stage.id);
  if(stage.id==='water_master'){
    r2.challengeDone = true;
    grantLanternfish();
  }
  await saveProfile();
  const nxt = nextWaterStage();
  challengeResult('🌊', stage.label+' defeated!',
    nxt ? `"Good. <b>${escapeHtml(nxt.label)}</b> is waiting."` : 'The Water Dojo is yours. The Rocky Caverns lie open.',
    'challenge');
}



/* ============================================================
   THE DISUSED PATH — the Region 2 finale.
   Scenes 5-8 build the confrontation, 9-11 are scripted battles the player
   cannot win by strength, and 12 is the farewell. The through-line is the same
   lesson as the Sacred Grove: courage is standing your ground, not winning.
   ============================================================ */
function runDisusedScene(scene){
  const step = parseInt(scene.replace('disused',''),10);
  ui.cavernPath = 'disused';
  switch(step){
    case 5:  return disused5();
    case 6:  return disused6();
    case 7:  return disused7();
    case 8:  return disused8();
    case 9:  return disused9Fight();
    case 10: return disused10Fight();
    case 11: return disused11Fight();
    case 12: return disused12Farewell();
  }
}

async function stepDisused(){ await advancePath('disused'); }

/* --- 5: the guards --- */
async function disused5(){
  await stepDisused();
  storyModal(npcPortrait('soldato2','🕴️',120,'transparent'), 'Two guards at the door',
    `Your borrowed suit draws no second glance. One of them holds out a hand anyway.<br><br>` +
    `"Word."<br><br>` +
    `"<b>Campanile</b>," you say, and your voice does not shake.<br><br>` +
    `He steps aside without looking at you again.`,
    ()=>renderCaverns(), { bg:'rocky_caverns', subtitle:'Rocky Caverns' });
}

/* --- 6: the army, and something roaring --- */
async function disused6(){
  await stepDisused();
  storyModal('', 'An army in the dark',
    `The tunnel opens into a cavern the size of a town square, and it is <b>full</b> of them — ` +
    `soldiers in rows, crates stacked to the ceiling, lamps strung on wire.<br><br>` +
    `You keep your chin level and your pace even, and nobody stops you.<br><br>` +
    `From somewhere far below comes a sound that is not machinery. It is a <b>roar</b>, ` +
    `long and furious and tired, and it shakes dust from the roof.`,
    ()=>renderCaverns(), { bg:'rocky_caverns', subtitle:'Rocky Caverns' });
}

/* --- 7: the dragon, restrained --- */
async function disused7(){
  await stepDisused();
  storyModal(monPortrait('water_dragon',170,{view:'front',bare:true,stage:1,crowned:true}), 'The thing they caught',
    `You come out on a ledge above a flooded chamber, and you forget to breathe.<br><br>` +
    `A <b>water dragon</b> fills it — vast, shimmering, magnificent — and it is <b>losing</b>. ` +
    `A man with a <b>gigantic Raven</b> stands calmly at the water's edge, raising his sword to command ` +
    `his army against the dragon. Set into the guard of that sword is a <b>large blue orb</b>.<br><br>` +
    `He is not fighting fair. His Capos' <b>ghosts and psychics</b> have the dragon bound at every limb, ` +
    `holding it still while he works.`,
    ()=>renderCaverns(), { bg:'rocky_caverns', subtitle:'Rocky Caverns' });
}

/* --- 8: the core, and the choice --- */
async function disused8(){
  await stepDisused();
  document.body.classList.remove('writing');
  document.body.classList.add('in-scene');
  window.scrollTo(0,0);
  $('#brandSub').textContent = 'Rocky Caverns';
  setScreenBg('rocky_caverns');
  screenEl.innerHTML = `
    <div class="scene">
      <div class="scene-emblem">${uiIcon('dragon_core', 96, '💠')}</div>
      <div class="scene-title">Its core is gone</div>
      <div class="scene-body">
        <p>You see it now. Where the dragon's chest should shine there is only a <b>hollow</b> — ` +
        `something has been cut out of it. <b>The core</b>, which now sits clasped in the X of that man's ` +
        `sword guard, glowing a deep and patient blue.</p>
        <p>Whatever is left of it is barely fighting any more. Its eyes have gone flat and obedient. ` +
        `The man with the Raven says a word and the dragon <b>stops struggling</b>.</p>
        <p>They have taken something important from the dragon.</p>
        <p><b>Nobody has seen you.</b> You could still turn around.</p>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button class="btn btn-ghost" id="choiceNo" style="flex:1;">Leave quietly</button>
        <button class="btn btn-primary" id="choiceYes" style="flex:1;">Help the dragon</button>
      </div>
    </div>`;
  $('#choiceYes').addEventListener('click', ()=>{
    storyModal(monPortrait('water_dragon',150,{view:'front',bare:true,stage:1,crowned:true}), 'You step out of the dark',
      `You do not have a plan. You walk out onto the ledge anyway, and your voice carries further than you meant it to.<br><br>` +
      `The man with the Raven turns. He looks you over — the borrowed suit, the child inside it — ` +
      `and something like ` +
      `<b>amusement</b> crosses his face.<br><br>` +
      `"<b>Don Padrino</b>," he says, introducing himself to you as though you were worth the courtesy. ` +
      `"And you are trespassing."`,
      ()=>disused9Fight());
  });
  $('#choiceNo').addEventListener('click', ()=>{
    storyModal(`<span class="emblem-pair">${npcPortrait('capo_purple','🕴️',110,'transparent')}${npcPortrait('capo_black','🕴️',110,'transparent')}</span>`, 'You are recognised',
      `You turn to go — and stop. Two Capos are on the ledge behind you, and one of them is <b>smiling</b>.<br><br>` +
      `"That's the one. That's the kid who beat me."<br><br>` +
      `"<b>Intruder!</b>"<br><br>` +
      `Their boss does not seem troubled at all. If anything he looks <b>pleased</b>.<br><br>` +
      `"Then the timing is perfect," says <b>Don Padrino</b>. "I have been wanting to test my new pet."`,
      ()=>disused9Fight());
  });
}


/* --- 9: Don Padrino. Unwinnable by design; losing is the story. --- */
function disused9Fight(){
  const r2 = state.progress.region2;
  r2.padrinoMet = true;
  beginBattle({
    isNpc:true, name:'Don Padrino', npcId:'padrino', noFlee:true, scriptedLoss:'padrino',
    enemiesFirst:true, alwaysFirst:true,   // he moves before you EVERY round
    waves:[[
      {species:'water_dragon',   level:100, ai:'cataclysm', supplements:10, crowned:true, boss:true},
      {species:'flying_starter', level:91,  ai:'best'},
      {species:'physical_starter', level:81, ai:'best'},
    ]],
    onWin: ()=> onPadrinoResolved(),   // if somehow won, the story still runs
  });
}

/* The party falls — and the Sacred Seed answers. */
async function onPadrinoResolved(){
  stopMusic();
  const r2 = state.progress.region2;
  battleParty().forEach(m=>{ if(m.currentHp<=0) m.currentHp = Math.max(1, Math.ceil(monMaxHp(m)*0.10)); });

  const seedIdx = state.party.findIndex(isSeed);
  const seed = seedIdx>=0 ? state.party[seedIdx] : null;
  const level = seed ? seed.level : 1;

  storyModal(monPortrait('sacred_seed',130,{bare:true}), 'The seed answers',
    `Your last monster goes down. Don Padrino is already turning away, bored of you.<br><br>` +
    `Then the <b>Sacred Seed</b> in your pack begins to glow.`,
    ()=>{
      // grow the Seed into the Forest Fairy, keeping the level it earned
      if(seed){
        const evolved = newMonster('forest_fairy', level);
        evolved.nickname = seed.nickname;
        evolved.xpFights = seed.xpFights||0;
        evolved.currentHp = computeMaxHp('forest_fairy', level, 0, evolved);
        state.party[seedIdx] = evolved;
        r2.fairyGranted = true;
        // the Lanternfish steps aside for her
        const lanternIdx = state.party.findIndex(m=>m.species==='lanternfish');
        if(lanternIdx>=0){
          const fish = state.party.splice(lanternIdx,1)[0];
          state.storage.push(fish);
        }
        if(!state.caughtSpecies.includes('forest_fairy')) state.caughtSpecies.push('forest_fairy');
      }
      saveProfile();
      playEvolutions([{ uid:seed?seed.uid:'seed', species:'forest_fairy', fromSpecies:'sacred_seed',
                        name:'Sacred Seed', from:level, to:level, evos:[level], newMoves:[] }], ()=>{
        storyModal('✨', 'Fairy light',
          `The light does not stop at you. It floods the chamber, and where it touches the dragon the ` +
          `<b>mind-control breaks apart like ice</b>.<br><br>` +
          `The dragon's eyes clear. It looks at you — really looks — and lowers its head.<br><br>` +
          `Then it takes you onto its back and <b>runs</b>.`,
          ()=>disused10Fight());
      });
    });
}

/* --- 10: riding the dragon. One button, no spelling. --- */
function disused10Fight(){
  advancePath('disused');   // scenes 9 and 10 are one continuous beat
  beginBattle({
    isNpc:true, name:'Sottocapo', npcId:'sottocapo', noFlee:true, scriptedAlly:'water_dragon',
    allyLevel:100, allyCrowned:true, allyMove:'unleashMax',
    waves:[
      [{species:'golem',level:61,ai:'best'},
       {species:'earth_snake',level:61,ai:'best'},
       {species:'bat',level:61,ai:'best'}],
      [{species:'ghost_starter',level:71,ai:'best'},
       {species:'psychic_starter',level:71,ai:'best'},
       {species:'ground_starter',level:71,ai:'best'}],
      [{species:'physical_starter',level:85,ai:'best'}],
    ],
    // the last wave is a single foe, so the dragon switches to Hyperbeam
    onWaveStart:(i)=>{ ui.battle.allyMove = (i>=2) ? 'hyperbeamMax' : 'unleashMax'; },
    onWin: ()=> disused11Intro(),
  });
}

function disused11Intro(){
  storyModal(npcPortrait('padrino','🕴️',130,'transparent'), 'It is weaker than it looks',
    `The dragon lands hard, and you feel it shudder beneath you.<br><br>` +
    `<b>Don Padrino</b> steps from the smoke, flaunting the glowing core on his sword.<br><br>` +
    `"A valiant last stand," he smirks at the dragon. "But without your core, you're at death's door."`,
    ()=>disused11Fight());
}

/* --- 11: the last stand. The dragon cannot die, and cannot win. --- */
function disused11Fight(){
  beginBattle({
    isNpc:true, name:'Don Padrino', npcId:'padrino', noFlee:true,
    scriptedAlly:'water_dragon', allyLevel:100, allyCrowned:true,
    allyMove:'dragonLegacy', allyUnkillable:true, enemiesFirst:true,
    waves:[[
      {species:'flying_starter',   level:91, ai:'best'},
      {species:'physical_starter', level:81, ai:'best'},
      {species:'ghost_starter',    level:81, ai:'best'},
    ]],
    onWin: ()=> disused12Farewell(),
  });
}

/* --- 12: the farewell, in a white room --- */
async function disused12Farewell(){
  const r2 = state.progress.region2;
  await advancePath('disused');
  stopMusic();
  playMusic('region');
  document.body.classList.remove('writing');
  document.body.classList.add('in-scene');
  window.scrollTo(0,0);
  setScreenBg(null);
  $('#brandSub').textContent = '';

  const lines = [
    `<p>There is no cavern any more. No floor, no ceiling — only white, and the dragon, ` +
    `glowing softly as though lit from inside.</p>`,
    `<p>"You had every reason to walk away," it says. "You did not. That is a rarer thing than strength."</p>`,
    `<p>"I cannot follow you out. What they took from me is not something I can live long without."</p>`,
    `<p>The light gathers in front of you and settles into something small and heavy and warm.</p>
     <p>"This is my <b>legacy</b>. Be patient with it — a dragon takes a long time to become anything at all, ` +
     `and longer still to become worth fearing."</p>`,
    `<p>"One last thing." Its voice is quieter now. ${uiIcon('dragon_core', 44, '💠')}</p>
     <p>"Find my <b>core</b>. Take it back from the one who stole it, and give it to the one ` +
     `who hatches from that egg."</p>
     <p>"Then we will both be whole."</p>`,
  ];
  let i = 0;
  const paint = ()=>{
    screenEl.innerHTML = `
      <div class="white-room">
        <div class="wr-dragon">${monPortrait('water_dragon', 190, { view:'front', bare:true, stage:1, crowned:true })}</div>
        <div class="wr-text">${lines.slice(0, i+1).join('')}</div>
        <button class="btn btn-primary" id="wrNext" style="margin-top:16px;">${i<lines.length-1?'Continue':'Take the egg'}</button>
      </div>`;
    $('#wrNext').addEventListener('click', ()=>{
      if(i < lines.length-1){ i++; paint(); return; }
      grantDragonEgg();
    });
  };
  paint();
}

async function grantDragonEgg(){
  const r2 = state.progress.region2;
  // One egg only. Replaying the finale must not mint more.
  const existing = [...state.party, ...state.storage].filter(m=>isEgg(m) || m.species==='water_dragon_nerfed');
  if(r2.eggGranted || existing.length){
    dedupeDragonEggs();
    r2.cavernDone = true;
    await saveProfile();
    return forestCrownScene();
  }
  const seedIdx = state.party.findIndex(isSeed);
  const egg = newMonster('dragon_egg', 1);
  egg.currentHp = 1;
  if(seedIdx>=0) state.party[seedIdx] = egg; else state.party.push(egg);
  r2.eggGranted = true;
  r2.cavernDone = true;
  if(!state.caughtSpecies.includes('dragon_egg')) state.caughtSpecies.push('dragon_egg');
  await saveProfile();

  const fade = document.createElement('div');
  fade.style.cssText='position:fixed;inset:0;background:#fff;z-index:90;opacity:0;transition:opacity 1.2s;pointer-events:none;';
  document.body.appendChild(fade);
  requestAnimationFrame(()=>{ fade.style.opacity='1'; });
  setTimeout(()=>{
    storyModal(monPortrait('dragon_egg', 130, { view:'front', bare:true }), 'A dragon egg',
      `You are standing in the Sacred Grove again, and the light is ordinary, and your legs are shaking.<br><br>` +
      `In your arms is a <b>dragon egg</b>, heavy and faintly warm. It travels in the slot the Sacred Seed once ` +
      `filled — level 1, and a long way from hatching. <b>It will open at level 31.</b>`,
      ()=>forestCrownScene());
    fade.style.opacity='0';
    setTimeout(()=>{ if(fade.parentNode) document.body.removeChild(fade); }, 1600);
  }, 1700);
}

/* The Forest Guardian closes the chapter. */
async function forestCrownScene(){
  const r2 = state.progress.region2;
  if(!r2.crownGranted){                    // the Guardian gives exactly one
    state.inventory.crowns = (state.inventory.crowns||0) + 1;
    r2.crownGranted = true;
  }
  await saveProfile();
  document.body.classList.add('in-scene');
  window.scrollTo(0,0);
  setScreenBg('explore');
  $('#brandSub').textContent = 'The Sacred Grove';
  screenEl.innerHTML = `
    <div class="scene">
      <div class="scene-portrait cutout">${monPortrait('forest_fairy', 170, { view:'front', bare:true, stage:1 })}</div>
      <div class="scene-title">The Forest Guardian</div>
      <div class="scene-body">
        <p>She is waiting for you at the treeline, and for once she is not smiling at your expense.</p>
        <p>"I felt it break. The binding on that creature." A pause. "I could not go. There are rules on ` +
        `what I am, and older things than me that enforce them."</p>
        <p>"You had no such rules. You only had the choice — and you made it twice now, knowing both times ` +
        `that it would cost you."</p>
        <p>She presses a crystal crown into your hands, made of ethereal, glowing fairy dust. It is lighter than air.</p>
        <p>"A <b>Crown</b>. Give it to one you have carried as far as it can go — one you <i>love</i>, ` +
        `not merely one that is useful."</p>
        <p>"It does not make a monster stronger for its own sake. It grants it the strength ` +
        `<b>to protect others</b>. That is a different thing, and a harder one."</p>
        <p>"Choose carefully. I do not have many."</p>
      </div>
      <div class="scene-reward">${crownIcon(46)}<div><b>Crown</b> received.<br><span>Use it in a monster's Stats page.</span></div></div>
      <button class="btn btn-primary" id="sceneNext" style="margin-top:16px;">Continue</button>
    </div>`;
  $('#sceneNext').addEventListener('click', ()=>{
    document.body.classList.remove('in-scene'); toast('Rocky Caverns is open to explore freely.'); go('region'); });
}

/* ---------- ROCKY CAVERNS: the three-path zone page ---------- */
/* Every path finished (or the story resolved) — the Caverns become ordinary. */
function cavernsComplete(){
  const r2 = state.progress.region2 || {};
  if(r2.cavernDone) return true;
  const ps = (r2.paths)||{};
  return CAVERN_PATHS.every(p => (ps[p.id]||{}).step >= PATH_LENGTH);
}

function renderCaverns(){
  if(isDev()) devShortcut();
  // Once every path is walked the path screen is defunct — fall through to the
  // ordinary zone page rather than stranding the player on dead buttons.
  if(cavernsComplete()){
    ui.currentZone = { id:'rocky_caverns', name:'Rocky Caverns' };
    return renderZonePlain();
  }
  setScreenBg('rocky_caverns');
  playMusicChain(['zone_rocky_caverns','region2','region']);
  document.body.classList.add('zone-dark','zone-tinted');
  $('#brandSub').textContent = 'Rocky Caverns';
  const lit = hasLantern();
  const paths = pathState();
  const canFight = battleParty().some(m=>m.currentHp>0);

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="zone-hero">
      <img src="assets/zones/rocky_caverns.png" alt="" class="zone-hero-img" onerror="this.style.display='none'">
      <div class="zone-hero-name">Rocky Caverns</div>
    </div>

    ${!lit ? `
      <div class="trial-banner" style="margin-bottom:14px;">
        <b>Too dark to go on</b>
        <div>You need a <b>Lanternfish</b> in your party to light the way. Check Storage if it isn't with you.</div>
      </div>` : ''}

    <div class="key-row">
      <div class="key-chip ${hasUniform()?'have':''}">${hasUniform()?'🥼':'❔'} Mafia uniform</div>
      <div class="key-chip ${hasPassword()?'have':''}">${hasPassword()?'🔑':'❔'} Password</div>
    </div>

    <div class="path-list">
      ${CAVERN_PATHS.map(pth=>{
        const st = paths[pth.id];
        const nx = pathNext(pth.id);
        const pct = Math.min(100, st.step/PATH_LENGTH*100);
        const locked = !lit || !canFight || nx.kind==='done';
        let note;
        if(nx.kind==='done')          note = '✓ Fully explored';
        else if(nx.kind==='blocked')  note = '🔒 Mafia everywhere — you need the uniform and the password';
        else                          note = `Next: explore ${st.step+1} of ${PATH_LENGTH}`;
        return `<div class="path-card ${locked?'locked':''}" ${locked?'':`data-path="${pth.id}"`} style="--zone-tint:${pth.tint};">
          <div class="path-name">${escapeHtml(pth.name)}</div>
          <div class="path-desc">${escapeHtml(pth.desc)}</div>
          <div class="path-bar"><span style="width:${pct}%"></span></div>
          <div class="path-note">${note}</div>
        </div>`;
      }).join('')}
    </div>

    ${!canFight && lit ? `<div class="placeholder-note"><span class="pn-emoji">💤</span>Your team needs healing first.</div>` : ''}
    <button class="btn btn-ghost" id="returnBtn" style="margin-top:14px;">Return</button>
  `;
  $('#backBtn').addEventListener('click', ()=>go('explore'));
  $('#returnBtn').addEventListener('click', ()=>go('explore'));
  screenEl.querySelectorAll('[data-path]').forEach(c=>c.addEventListener('click', ()=> exploreCavernPath(c.dataset.path)));
}

/* Take one step down a path and resolve whatever is there. */
function exploreCavernPath(pathId){
  const st = pathState()[pathId];
  const nx = pathNext(pathId);
  ui.cavernPath = pathId;

  if(nx.kind==='blocked'){
    return storyModal('🚧', 'The way is thick with mafia',
      `There are far too many of them to fight — soldiers at every turn, and more beyond.<br><br>` +
      `To slip through unnoticed you'll need a <b>mafia uniform</b> to pass for one of them, and the <b>password</b> to get past the guards.`,
      ()=>renderCaverns(), { bg:'rocky_caverns', subtitle:'Rocky Caverns' });
  }
  if(nx.kind==='done'){ toast('Nothing left down here.'); return; }

  if(nx.kind==='wild'){
    ui.currentZone = { id:'rocky_caverns', name:'Rocky Caverns' };
    ui.cavernAdvanceOnWin = pathId;
    return startWildEncounter();
  }
  if(nx.kind==='soldato'){
    const def = MAFIA[nx.tier===1 ? 'soldato1' : 'soldato2'];
    return startMafiaFight(def, pathId);
  }
  if(nx.kind==='capo'){
    const def = MAFIA[nx.which==='black' ? 'capo_black' : 'capo_purple'];
    return startMafiaFight(def, pathId);
  }
  if(nx.kind==='reward') return givePathReward(pathId, nx.which);
  if(nx.kind==='scene')  return runDisusedScene(nx.scene);
}

function startMafiaFight(def, pathId){
  if(!ensurePool()) return;
  ui.cavernAdvanceOnWin = pathId;
  beginBattle({ isNpc:true, name:def.label, npcId:def.npcId,
    waves: def.waves.map((w,i)=>w.map(e=>({...e, ai:def.ai[i]||'power1', nerfed:false}))),
    onWin: ()=> onMafiaWin(def, pathId) });
}

async function advancePath(pathId){
  const st = pathState()[pathId];
  st.step = Math.min(PATH_LENGTH, st.step + 1);
  if(st.step >= PATH_LENGTH) st.done = true;
  await saveProfile();
}

async function onMafiaWin(def, pathId){
  await advancePath(pathId);
  if(def.npcId==='capo_black'){
    return storyModal('🕴️', 'Black Capo defeated',
      `He straightens his coat, unhurried, as though losing were a formality.<br><br>` +
      `"Enjoy it. My people don't forget a face." He turns away. "And you've picked a poor week for heroics — ` +
      `the boss is about to tame something out of legend. After that, nobody crosses us again."`,
      ()=>renderCaverns(), { bg:'rocky_caverns', subtitle:'Rocky Caverns' });
  }
  if(def.npcId==='capo_purple'){
    return storyModal('🕴️', 'Purple Capo defeated',
      `She laughs, short and sharp, and spits into the dust.<br><br>` +
      `"You're stronger than you look. Fine — go on then." She jerks her head toward the dark.<br><br>` +
      `"<b>The disused path.</b> That's where the boss is. Come and challenge him, if you dare."`,
      ()=>renderCaverns(), { bg:'rocky_caverns', subtitle:'Rocky Caverns' });
  }
  challengeResult('👊', 'Soldato defeated!', 'The way ahead is clear.', 'caverns');
}

async function givePathReward(pathId, which){
  const r2 = state.progress.region2;
  state.inventory.protein = (state.inventory.protein||0) + 3;
  if(which==='uniform'){
    r2.uniform = true;
    await advancePath(pathId);
    return storyModal('🥼', 'A mafia uniform',
      `Folded in a crate at the end of the path: a pressed dark suit with the family's mark on the collar.<br><br>` +
      `Wearing it, you might pass for one of them.<br><br><b>+3 Protein Supplements</b>`,
      ()=>renderCaverns(), { bg:'rocky_caverns', subtitle:'Rocky Caverns' });
  }
  r2.password = true;
  await advancePath(pathId);
  return storyModal('🔑', 'The password',
    `A lone Soldato throws his hands up before you've even spoken.<br><br>` +
    `"Don't — don't. Look, the word's <b>'campanile'</b>, alright? Just say it to the door guards and they'll wave you through."<br><br>` +
    `He is gone before you can answer.<br><br><b>+3 Protein Supplements</b>`,
    ()=>renderCaverns(), { bg:'rocky_caverns', subtitle:'Rocky Caverns' });
}

/* A simple full-screen story beat with one button. */
/* `emblem` may be an emoji or any HTML (a sprite, a pair of sprites…). */
function storyModal(emblem, title, html, onClose, opts){
  opts = opts || {};
  document.body.classList.remove('writing');
  document.body.classList.add('in-scene');
  document.body.classList.remove('zone-dark');   // read dialogue on paper, not in the dark
  window.scrollTo(0, 0);
  if(opts.subtitle !== undefined) $('#brandSub').textContent = opts.subtitle;
  if(opts.bg) setScreenBg(opts.bg);
  screenEl.innerHTML = `
    <div class="scene">
      <div class="scene-emblem">${emblem}</div>
      <div class="scene-title">${escapeHtml(title)}</div>
      <div class="scene-body">${html}</div>
      ${opts.action ? `<button class="btn btn-primary" id="sceneAct" style="margin-top:16px;">${escapeHtml(opts.action.label)}</button>` : ''}
      <button class="btn ${opts.action ? 'btn-ghost' : 'btn-primary'}" id="sceneNext" style="margin-top:${opts.action?'8':'16'}px;">${escapeHtml(opts.confirm ? 'Dive' : (opts.action ? 'Leave it' : 'Continue'))}</button>
      ${opts.confirm ? `<button class="btn btn-ghost" id="sceneBack" style="margin-top:8px;">Not yet</button>` : ''}
    </div>`;
  const leave = ()=>{ document.body.classList.remove('in-scene'); };
  const act = $('#sceneAct');
  if(act) act.addEventListener('click', ()=>{ leave(); opts.action.fn(); });
  $('#sceneNext').addEventListener('click', ()=>{ leave(); if(onClose) onClose(); });
  const bk = $('#sceneBack');
  if(bk) bk.addEventListener('click', ()=>{ leave(); if(opts.onCancel) opts.onCancel(); else go(ui.prevScreen||'explore'); });
}


/* ============================================================
   PORT AKROTIRI — the Monkey King arc opens
   ============================================================ */
function monkeyEncounterDue(){
  const r3 = state.progress.region3 || {};
  return state.progress.currentRegion===3
      && (ui.currentZone||{}).id==='volcanic_caldera'
      && !r3.monkeyMet;
}

function monkeyScene1(){
  storyModal(monPortrait('monkey_king',150,{view:'front',bare:true,stage:1}), 'A monkey in the hot spring',
    `Steam rolls off a pool of green water, and something is sitting in it with its arms along the rim, ` +
    `entirely at ease.<br><br>` +
    `"That thing you're carrying." The monkey doesn't open its eyes. "It's missing its <b>core</b>. ` +
    `Don't look so surprised — I can feel the hole in it from here."<br><br>` +
    `"It won't last like that. Needs something to run on until you get the real thing back."`,
    ()=>monkeyScene2(), { bg:'battle_hot_spring', subtitle:'Volcanic Caldera' });
}
function monkeyScene2(){
  storyModal(monPortrait('monkey_king',150,{view:'front',bare:true,stage:1}), '"Try the plant"',
    `"There's a <b>geothermal plant</b> in the city. They pull power out of the ground there — ` +
    `they'll have a <b>power stone</b> lying about. That'll hold your dragon together for a while."<br><br>` +
    `You ask why a wild monster would help you at all.<br><br>` +
    `One eye opens. "Because the same hand that took your dragon's core took <b>mine</b>." ` +
    `The water goes very still. "And I intend to take it back."`,
    ()=>monkeyScene3(), { bg:'battle_hot_spring', subtitle:'Volcanic Caldera' });
}
function monkeyScene3(){
  document.body.classList.remove('writing');
  document.body.classList.add('in-scene');
  window.scrollTo(0,0);
  $('#brandSub').textContent = 'Volcanic Caldera';
  setScreenBg('battle_hot_spring');
  screenEl.innerHTML = `
    <div class="scene">
      <div class="scene-emblem">${monPortrait('monkey_king',150,{view:'front',bare:true,stage:1})}</div>
      <div class="scene-title">"Alone."</div>
      <div class="scene-body">
        <p>You suggest going together. You have a dragon to mend and he has a score to settle — ` +
        `it seems obvious.</p>
        <p>The monkey laughs at you. Not unkindly, but not kindly either.</p>
        <p>"I have been doing this a very long time, small one. I do not need a partner, and I ` +
        `certainly do not need <b>rescuing</b>."</p>
        <p>He settles back into the water and waits, as though curious what you'll do about it.</p>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button class="btn btn-ghost" id="mkFarewell" style="flex:1;">Bid farewell</button>
        <button class="btn btn-primary" id="mkCatch" style="flex:1;">Try to catch him</button>
      </div>
    </div>`;
  $('#mkFarewell').addEventListener('click', ()=>monkeyFarewell());
  $('#mkCatch').addEventListener('click', ()=>monkeyFight());
}

async function monkeyFarewell(){
  const r3 = state.progress.region3;
  r3.monkeyMet = true; r3.monkeyChoice = 'farewell';
  await saveProfile();
  storyModal(monPortrait('monkey_king',150,{view:'front',bare:true,stage:1}), 'He snorts',
    `You wish him luck instead.<br><br>` +
    `The monkey snorts — one short, surprised sound — and flicks a hand at you without looking.<br><br>` +
    `"…Mm. Mind the steam vents."<br><br>` +
    `When you glance back, the spring is empty.<br><br><b>The Geothermal Plant is now on your map.</b>`,
    ()=>go('explore'), { bg:'battle_hot_spring', subtitle:'Volcanic Caldera' });
}

/* A real fight — that ends before you get a turn. */
function monkeyFight(){
  beginBattle({
    isNpc:false, name:'Monkey', noFlee:true, bgKey:'battle_hot_spring',
    scriptedLoss:'monkey', scriptedOneTurn:true, enemiesFirst:true, allowCatch:false,
    waves:[[{ species:'monkey_king', level:100, ai:'power1', nerfed:false }]],
    onWin: ()=> onMonkeyResolved(),
  });
}

async function onMonkeyResolved(){
  const r3 = state.progress.region3;
  r3.monkeyMet = true; r3.monkeyChoice = 'fight';
  battleParty().forEach(m=>{ m.currentHp = Math.max(1, Math.ceil(monMaxHp(m)*0.10)); });
  await saveProfile();
  stopMusic();

  const fade=document.createElement('div');
  fade.style.cssText='position:fixed;inset:0;background:#000;z-index:88;opacity:0;transition:opacity .9s;';
  document.body.appendChild(fade);
  requestAnimationFrame(()=>{ fade.style.opacity='1'; });
  setTimeout(()=>{
    storyModal('', 'Somewhere over the caldera',
      `You never got to move.<br><br>` +
      `There was a blur, a sensation of enormous unhurried strength, and then a great deal of sky.<br><br>` +
      `You come down some distance away, mostly intact, with your whole team groaning around you.<br><br>` +
      `Faintly, from back at the spring: <i>"Told you."</i><br><br>` +
      `<b>The Geothermal Plant is now on your map.</b>`,
      ()=>{ go('region'); }, { bg:'battle_hot_spring', subtitle:'Volcanic Caldera' });
    fade.style.opacity='0';
    setTimeout(()=>{ if(fade.parentNode) document.body.removeChild(fade); }, 900);
  }, 1100);
}

/* ============================================================
   GEOTHERMAL PLANT — nine workers, a reaction game, an engineer
   ============================================================ */
const PLANT_WORKERS = 9;
const PLANT_TARGET = 10;
const PLANT_FLASH_MIN = 500, PLANT_FLASH_MAX = 1200;

function renderPlant(){
  const r3 = state.progress.region3;
  if(!r3.plantIntro) return plantIntro();
  setScreenBg('geothermal_plant');
  playMusicChain(['zone_geothermal_plant','region3','region']);
  $('#brandSub').textContent = 'Geothermal Plant';
  const canFight = battleParty().some(m=>m.currentHp>0);
  const pct = Math.min(100, r3.helpCount/PLANT_TARGET*100);
  const peace = plantAtPeace();

  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Explore</button>
    <div class="zone-hero">
      <img src="assets/zones/geothermal_plant.png" alt="" class="zone-hero-img" onerror="this.style.display='none'">
      <div class="zone-hero-name">Geothermal Plant</div>
    </div>
    ${peace ? `
      <div class="plant-note" style="text-align:center;font-weight:800;">
        🕊️ The fire monsters haven't come back since Ankylosaurus called them home.
        The whole plant is running quiet for the first time in months.
      </div>
      <div class="worker-grid" id="workerGrid">
        ${Array.from({length:PLANT_WORKERS},(_,i)=>{
          const n=i+1;
          return `<div class="worker peaceful" data-worker="${n}">
            ${npcPortrait('worker'+n,'👷',56,'transparent')}
          </div>`;
        }).join('')}
      </div>
      <button class="btn btn-ghost" id="engineerBtn" style="margin-top:12px;">
        ${npcPortrait('engineer1','🛠️',40,'transparent')} <span>Say hello to the Engineer</span></button>
    ` : `
      <div class="plant-note">Watch for a worker waving. Tap them before they give up — the fire monsters
        get in among the machinery and someone has to shift them.</div>
      <div class="trial-bar" style="margin:10px 0 4px;"><span style="width:${pct}%"></span></div>
      <div class="trial-count">${r3.helpCount} / ${PLANT_TARGET} calls answered</div>

      <div class="worker-grid" id="workerGrid">
        ${Array.from({length:PLANT_WORKERS},(_,i)=>{
          const n=i+1;
          return `<button class="worker" data-worker="${n}" id="worker-${n}">
            ${npcPortrait('worker'+n,'👷',56,'transparent')}
            ${r3.helped[n] ? '<span class="worker-done">✓</span>' : ''}
          </button>`;
        }).join('')}
      </div>

      ${r3.powerStone && !r3.powerStoneUsed ? `<button class="btn btn-primary" id="usePowerStone" style="margin-top:14px;">
        ${powerStoneIcon(20)} Use the Power Stone</button>` : ''}

      ${r3.helpCount>=PLANT_TARGET ? `<button class="btn btn-ghost engineer-btn" id="engineerBtn" style="margin-top:12px;">
        ${npcPortrait('engineer1','🛠️',40,'transparent')} <span>The Engineer's commission</span></button>` : ''}
    `}

    <button class="btn btn-ghost" id="returnBtn" style="margin-top:10px;">Return</button>
  `;
  $('#backBtn').addEventListener('click', ()=>{ stopPlantLoop(); go('explore'); });
  $('#returnBtn').addEventListener('click', ()=>{ stopPlantLoop(); go('explore'); });
  const ps = $('#usePowerStone');
  if(ps) ps.addEventListener('click', ()=> usePowerStone());
  const eb = $('#engineerBtn');
  if(eb) eb.addEventListener('click', ()=> engineerOffer());
  if(canFight && !peace) startPlantLoop();
}

function powerStoneIcon(px){
  px = px||20;
  return `<img src="assets/ui/universal_stone.png" alt="" style="width:${px}px;height:${px}px;vertical-align:-3px;"
    onerror="this.outerHTML='💎'">`;
}

/* One worker waves at a time; the window is 0.5–1.2s. Missing costs nothing. */
let _plantTimer = null, _plantFlash = null, _plantActive = 0, _plantRunning = false;
function stopPlantLoop(){
  clearTimeout(_plantTimer); clearTimeout(_plantFlash);
  _plantTimer = _plantFlash = null; _plantActive = 0; _plantRunning = false;
}
function startPlantLoop(){
  stopPlantLoop();
  _plantRunning = true;
  const schedule = ()=>{
    _plantTimer = setTimeout(()=>{
      // The plant can be reached as either 'plant' or 'zone', so trust our own
      // running flag and the presence of the grid rather than the screen key.
      if(!_plantRunning || !document.getElementById('workerGrid')) return stopPlantLoop();
      const n = 1 + Math.floor(Math.random()*PLANT_WORKERS);
      const el = document.getElementById('worker-'+n);
      if(!el) return schedule();
      _plantActive = n;
      el.classList.add('calling');
      const window_ = PLANT_FLASH_MIN + Math.random()*(PLANT_FLASH_MAX-PLANT_FLASH_MIN);
      _plantFlash = setTimeout(()=>{
        el.classList.remove('calling');
        if(_plantActive===n){ _plantActive = 0; }
        schedule();
      }, window_);
    }, 700 + Math.random()*1800);
  };
  schedule();
  screenEl.querySelectorAll('[data-worker]').forEach(b=>b.addEventListener('click', ()=>{
    const n = +b.dataset.worker;
    if(_plantActive === n) return plantHelpSuccess(n);
    plantTooLate(n);
  }));
}

function plantTooLate(n){
  const el = document.getElementById('worker-'+n);
  if(el){ el.classList.add('too-late'); setTimeout(()=>el.classList.remove('too-late'), 500); }
  battleMsgToast(`Worker ${n}: "Too late! Come more promptly next time."`);
}
function battleMsgToast(t){ toast(t); }

/* Answering a call starts the fight. Nothing is paid until the monsters are
   actually cleared — fleeing earns nothing, which is the point of helping. */
function plantHelpSuccess(n){
  stopPlantLoop();
  ui.currentZone = { id:'geothermal_plant', name:'Geothermal Plant' };
  ui.plantWorker = n;
  startWildEncounter({ onWin: ()=> onPlantHelpWon(n) });
}

async function onPlantHelpWon(n){
  const r3 = state.progress.region3;
  const first = !r3.helped[n];
  r3.helped[n] = true;
  r3.helpCount = (r3.helpCount||0) + 1;
  const reached = r3.helpCount === PLANT_TARGET;
  if(first) state.inventory.tokens = (state.inventory.tokens||0) + 2;
  if(reached) r3.powerStone = true;
  await saveProfile();

  storyModal(npcPortrait('worker'+n,'👷',120,'transparent'), 'Thank you!',
    `"You're a lifesaver — they'd got in among the coupling again."<br><br>` +
    (first ? `<b>+2 Skill Tokens</b>` : `<i>This one has already thanked you once, but the help still counts.</i>`),
    ()=>{
      if(reached) return plantBossReward();
      resumeVictory();
    }, { bg:'geothermal_plant', subtitle:'Geothermal Plant' });
}

function plantBossReward(){
  storyModal(npcPortrait('plant_boss','🧑‍🏭',130,'transparent'), 'The boss keeps his word',
    `"Ten call-outs answered. My crew have been singing your praises and I'm sick of hearing it."<br><br>` +
    `He drops a warm, faintly glowing stone into your palm.<br><br>` +
    `<b>Power Stone received</b> — use it on your dragon from the plant screen.<br><br>` +
    `"And if you've a strong stomach, my <b>engineer</b> has a job that's beyond us."`,
    ()=> resumeVictory(), { bg:'geothermal_plant', subtitle:'Geothermal Plant' });
}

/* ============================================================
   BATTLES PER DAY
   A blunter lever than eye breaks: how many battles one calendar day may hold
   (0–100). Reaching it closes the game until tomorrow, or until a grown-up
   opens it with the password for 1 to 60 minutes. At 0 it stays closed until a
   grown-up opens it. Counts exactly what eye breaks count.
   ============================================================ */
const DAILY_DEFAULT = 100;
let _dailyTimer = null;
function dailyLimit(){
  const v = state && state.settings && state.settings.dailyBattles;
  return (v == null || isNaN(v)) ? DAILY_DEFAULT : Math.max(0, Math.min(100, +v));
}
function battlesToday(){
  if(!state) return 0;
  const t = today();
  if(!state.battlesToday || state.battlesToday.day !== t) state.battlesToday = { day:t, n:0 };
  return state.battlesToday.n;
}
/* Unlimited switches the daily limit off altogether (the number is kept for
   when it is switched back on). */
function dailyUnlimited(){ return !!(state && state.settings && state.settings.dailyUnlimited); }
/* A grown-up has opened it: for a set number of minutes, or with no time limit
   at all — that lasts until a grown-up locks it again from Settings. */
function dailyOverrideActive(){
  return !!(state && (state.dailyOverrideOpen || (state.dailyOverrideUntil && Date.now() < state.dailyOverrideUntil)));
}
function dailyLimitActive(){ return !!state && !dailyUnlimited() && !dailyOverrideActive() && battlesToday() >= dailyLimit(); }
function lockDailyAgain(){
  state.dailyOverrideOpen = false;
  state.dailyOverrideUntil = 0;
  if(_dailyTimer){ clearTimeout(_dailyTimer); _dailyTimer = null; }
  saveProfile();
}
/* When a grown-up's time runs out, close it again — but never in the middle of
   a battle or a spelling; that waits for the next screen. */
function scheduleDailyRecheck(){
  if(_dailyTimer){ clearTimeout(_dailyTimer); _dailyTimer = null; }
  const ms = ((state && state.dailyOverrideUntil) || 0) - Date.now();
  if(ms > 0) _dailyTimer = setTimeout(()=>{
    _dailyTimer = null;
    if(!['battle', 'quiz'].includes(ui.screen)) enforceEyeBreak();
  }, ms + 300);
}
/* Keep a slider and a typed number in step, clamped to [min, max]. */
function pairInputs(slider, num, min, max, onValue){
  const clamp = v => Math.max(min, Math.min(max, Math.round(+v || 0)));
  slider.addEventListener('input', ()=>{ num.value = slider.value; onValue(clamp(slider.value), false); });
  slider.addEventListener('change', ()=> onValue(clamp(slider.value), true));
  num.addEventListener('change', ()=>{ const v = clamp(num.value); num.value = v; slider.value = v; onValue(v, true); });
}
function showDailyLock(){
  if(document.getElementById('dailyLockOverlay')) return;
  const limit = dailyLimit();
  const ov = document.createElement('div');
  ov.className = 'eye-overlay';
  ov.id = 'dailyLockOverlay';
  ov.innerHTML = `
    <div class="eye-card">
      <div class="eye-emoji">🌙</div>
      <div class="eye-title">${limit === 0 ? 'Battles are switched off' : "That's all for today"}</div>
      <div class="eye-note">${limit === 0
        ? 'A grown-up has switched the game off for now.'
        : `You've had ${battlesToday()} battles today — the most for one day. See you tomorrow!`}</div>
      <div id="dayGate" style="display:none;margin-top:16px;text-align:left;">
        <input type="password" id="dayPw" placeholder="Password" inputmode="numeric" autocomplete="off"
          style="width:100%;box-sizing:border-box;">
        <label style="display:block;font-size:12px;font-weight:800;margin-top:10px;color:#f4ecd8;">
          Open for <span id="dayMinsLbl">15</span> minutes</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="range" id="dayMins" min="1" max="60" step="1" value="15" style="flex:1;accent-color:var(--cinnabar);">
          <input type="number" id="dayMinsNum" min="1" max="60" value="15" style="width:64px;">
        </div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:13px;font-weight:700;color:#f4ecd8;">
          <input type="checkbox" id="dayForever"> No time limit — until a grown-up locks it again
        </label>
        <div id="dayPwMsg" style="font-size:12px;font-weight:700;min-height:16px;margin-top:6px;color:#f3b7a8;"></div>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button class="btn btn-primary" id="dayGo" style="flex:1;">Open the game</button>
          <button class="btn btn-ghost" id="dayNo" style="flex:1;">Cancel</button>
        </div>
      </div>
    </div>
    <button id="dayOverride" aria-label="Grown-ups: open the game"
      style="position:absolute;top:calc(env(safe-area-inset-top, 0px) + 12px);right:12px;
             background:rgba(244,236,216,.12);color:#f4ecd8;border:1px solid rgba(244,236,216,.35);
             border-radius:12px;padding:8px 12px;font-size:13px;font-weight:700;cursor:pointer;">
      🔒 Grown-ups
    </button>`;
  document.body.appendChild(ov);
  document.body.classList.add('eye-locked');
  const $o = s=> ov.querySelector(s);
  let mins = 15;
  pairInputs($o('#dayMins'), $o('#dayMinsNum'), 1, 60, v=>{ mins = v; $o('#dayMinsLbl').textContent = v; });
  $o('#dayForever').addEventListener('change', ()=>{
    const on = $o('#dayForever').checked;
    $o('#dayMins').disabled = on; $o('#dayMinsNum').disabled = on;
    $o('#dayMinsLbl').parentNode.style.opacity = on ? '.45' : '';
  });
  $o('#dayOverride').addEventListener('click', ()=>{
    $o('#dayGate').style.display = 'block'; $o('#dayPwMsg').textContent = ''; $o('#dayPw').value = ''; $o('#dayPw').focus();
  });
  $o('#dayNo').addEventListener('click', ()=>{ $o('#dayGate').style.display = 'none'; });
  const tryPw = ()=>{
    if(!passOk($o('#dayPw').value.trim())){ $o('#dayPwMsg').textContent = 'Incorrect password.'; $o('#dayPw').value = ''; return; }
    const forever = $o('#dayForever').checked;
    state.dailyOverrideOpen = forever;
    state.dailyOverrideUntil = forever ? 0 : Date.now() + mins * 60 * 1000;
    saveProfile();
    ov.remove();
    if(!document.getElementById('eyeBreakOverlay')) document.body.classList.remove('eye-locked');
    scheduleDailyRecheck();
    toast(forever ? 'Open until a grown-up locks it again.' : `Open for ${mins} minute${mins === 1 ? '' : 's'}.`);
  };
  $o('#dayGo').addEventListener('click', tryPw);
  $o('#dayPw').addEventListener('keydown', e=>{ if(e.key === 'Enter') tryPw(); });
}
