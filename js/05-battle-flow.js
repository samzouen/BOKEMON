/* ==========================================================
   05-battle-flow.js
   Turn order, enemy AI, effects, the battle screen itself.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ============================================================
   MOVE EFFECT ANIMATIONS
   ------------------------------------------------------------
   Two authoring formats are supported:

   1. SPRITE SHEET (preferred) — a horizontal strip of equal square frames in
      one PNG. Played with a CSS steps() animation, so the game controls
      exactly when it starts, how long it runs, and that it plays ONCE.
      Full alpha transparency, small files, frame-accurate.

   2. GIF (convenient) — simpler to produce, but the browser starts it on load
      and loops it forever, so we re-inject it each time to restart it and hide
      it after a set duration. Limited to 256 colours with hard-edged
      transparency (no soft glows).

   Effects resolve most-specific-first, so a handful of files covers everything:
      moveName ("Fusion Flare")  →  type_tier ("Fire_ultra")  →  type ("Fire")
   Author the nine type effects and every move is covered; add tier- or
   move-specific files later without touching code.
   ============================================================ */
/* ---------- SCREEN BACKGROUNDS ----------
   A faded image sits behind each major screen. Drop a file into assets/bg/ and
   it appears automatically; missing files simply leave the plain paper
   background. Opacity is deliberately low so text stays readable. */
const BG_DIR = 'assets/bg/';
const BG_MAP = {
  /* Open water, used behind the deck plans — those are shown full-size in the
     page and must not be painted behind themselves. Falls through to
     region4.png then region.png if you never draw a sea.png. */
  sea:            'sea.png',
  home:      'home.png',
  region:    'region.png',     // fallback for any region
  region1:   'region1.png',
  region2:   'region2.png',
  region3:   'region3.png',
  region4:   'region4.png',
  battle:    'battle.png',
  recover:   'recover.png',
  challenge: 'challenge.png',
  explore:   'explore.png',
  shop:      'shop.png',
  // per-zone battle backdrops
  battle_hot_spring:      'battle_hot_spring.png',
  battle_tranquil_forest: 'battle_tranquil_forest.png',
  battle_sacred_grove:    'battle_sacred_grove.png',
  battle_rocky_caverns:   'battle_rocky_caverns.png',
  // the zone button art doubles as the zone page backdrop
  tranquil_forest: 'zone/tranquil_forest.png',
  sacred_grove:    'zone/sacred_grove.png',
  rocky_caverns:   'zone/rocky_caverns.png',
};
/* A zone key with no bg file of its own falls back to its button art. */
/* Same idea for artwork: `<key>.png` unless the map overrides it. */
function bgCandidates(key){
  if(!key) return [];
  const rid0 = (state && state.progress && state.progress.currentRegion) || 1;
  const out = [];
  /* A region's own art takes precedence over the shared screen art, so
     Region 3's Explore shows region3.png rather than Region 1's explore.png. */
  const SHARED = ['explore','region','challenge','recover','shop','battle','home'];
  if(SHARED.includes(key)){
    out.push(BG_DIR + key + rid0 + '.png');     // e.g. explore3.png
    out.push(BG_DIR + 'region' + rid0 + '.png');
  }
  out.push(BG_DIR + (BG_MAP[key] || (key + '.png')));
  if(/^region\d+$/.test(key)) out.push(BG_DIR + 'region.png');   // fall back to the shared one
  /* Anything without its own art falls back to the current region's backdrop,
     then to the generic one — so a new region only needs regionN.png. */
  const rid = (state && state.progress && state.progress.currentRegion) || 1;
  const regionFallback = [BG_DIR + 'region'+rid+'.png', BG_DIR + 'region.png'];
  if(/^battle_/.test(key)){
    out.push(BG_DIR + 'battle.png');                       // generic battlefield
    out.push('assets/zones/'+key.replace('battle_','')+'.png');
  }
  /* Any zone key falls back to its button art — no per-zone listing needed. */
  if(ZONE_LEVELS[key] || /_/.test(key)) out.push('assets/zones/'+key+'.png');
  if(key==='explore' || /^zone_/.test(key)) out.push(...regionFallback);
  out.push(...regionFallback);
  return out.filter(u=>u && !u.endsWith('/'));
}
const bgMissing = {};
/* Backdrops that are deck PLANS rather than scenery. `cover` crops a tall plan
   on a tall phone, so the ship ends up magnified and cut off at both ends —
   these fit the full height instead and let the sides fall where they will. */
const FIT_HEIGHT_BGS = ['battle_diving','battle_weather_deck','battle_cabin_deck',
                        'battle_laboratory_deck','battle_whales','sea'];

function setScreenBg(key){
  const el = document.getElementById('screenBg');
  if(!el) return;
  el.classList.toggle('fit-h', FIT_HEIGHT_BGS.includes(key));
  const cands = bgCandidates(key).filter(u=>!bgMissing[u]);
  const clear = ()=>{ el.style.backgroundImage=''; el.classList.remove('on'); document.body.classList.remove('has-bg'); };
  if(cands.length===0) return clear();
  let i = 0;
  const tryNext = ()=>{
    if(i >= cands.length) return clear();
    const src = cands[i++];
    const probe = new Image();
    probe.onload = ()=>{ el.style.backgroundImage='url('+src+')'; el.classList.add('on'); document.body.classList.add('has-bg'); };
    probe.onerror = ()=>{ bgMissing[src] = true; tryNext(); };
    probe.src = src;
  };
  tryNext();
}

const FX_DIR = 'assets/fx/';
const FX_FRAMES = 8;      // authoring standard: 8-frame horizontal strip
const FX_FPS    = 16;     // → 500ms per effect

/* Anything listed here is looked for on disk. Entries may override frames/fps,
   or point at a .gif instead. Missing files degrade to the text flash. */
const FX_MAP = {
  Fire:{file:'fire.png'},      Water:{file:'water.png'},   Grass:{file:'grass.png'},
  Electric:{file:'electric.png'}, Ground:{file:'ground.png'}, Flying:{file:'flying.png'},
  Physical:{file:'physical.png'}, Ghost:{file:'ghost.png'},  Psychic:{file:'psychic.png'},
};
const fxMissing = {};

function resolveFx(moveName, type, tier){
  const explicit = (typeof ASSETS!=='undefined' && ASSETS.effects) ? ASSETS.effects[moveName] : null;
  if(explicit) return { file:explicit, frames:FX_FRAMES, fps:FX_FPS };
  const keys = [moveName, (type&&tier)?type+'_'+tier:null, type];
  for(const k of keys){
    if(k && FX_MAP[k]) return Object.assign({ frames:FX_FRAMES, fps:FX_FPS }, FX_MAP[k]);
  }
  return null;
}

/* Position the effect over a specific combatant when asked, else centre it. */
function fxBox(at){
  const stage = $('#battleStage');
  if(!stage || !at) return null;
  const el = document.getElementById(at);
  if(!el) return null;
  const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 1.9;
  return {
    left: (r.left - s.left) + r.width/2  - size/2,
    top:  (r.top  - s.top ) + r.height/2 - size/2,
    size,
  };
}

function playEffect(moveName, opts, done){
  opts = opts || {};
  const layer = $('#fxLayer');
  if(!layer){ if(done) done(); return; }
  const fx = resolveFx(moveName, opts.type, opts.tier);
  const box = fxBox(opts.at);

  const place = (node, ms)=>{
    if(box){
      node.style.position='absolute';
      node.style.left=box.left+'px'; node.style.top=box.top+'px';
      node.style.width=box.size+'px'; node.style.height=box.size+'px';
    }
    layer.appendChild(node);
    setTimeout(()=>{ if(node.parentNode) layer.removeChild(node); if(done) done(); }, ms);
  };

  if(fx && !fxMissing[fx.file]){
    const src = FX_DIR + fx.file;
    if(/\.gif$/i.test(fx.file)){
      // GIF: cache-bust so it restarts from frame 1 every time it's used
      const img = document.createElement('img');
      img.className='fx-sprite';
      img.onerror = ()=>{ fxMissing[fx.file]=true; };
      img.src = src + '?t=' + Date.now();
      place(img, opts.duration || 700);
      return;
    }
    // Sprite sheet: verify it loads, then run a steps() animation exactly once
    const probe = new Image();
    probe.onload = ()=>{
      const div = document.createElement('div');
      div.className = 'fx-sheet';
      const ms = Math.round(fx.frames / fx.fps * 1000);
      div.style.backgroundImage = 'url('+src+')';
      div.style.backgroundSize = (fx.frames*100)+'% 100%';
      div.style.animation = 'fxPlay '+ms+'ms steps('+fx.frames+') 1 both';
      place(div, opts.duration || ms + 60);
    };
    probe.onerror = ()=>{
      fxMissing[fx.file] = true;
      playEffect(moveName, Object.assign({}, opts, {_noAsset:true}), done);  // fall through to text
    };
    probe.src = src;
    return;
  }

  // No art for this move: show nothing. The hit flash and the damage number
  // read better than a name card floating over the sprite.
  if(done) done();
  return;
}

/* Messages carry <b> for the figures that matter, so this must be innerHTML.
   With textContent the tags rendered as literal text on screen. Everything
   passed here is written by the game, never by the player — the one place a
   name could arrive is escaped at the call site. */
function battleMsg(t){ const el=$('#battleMsg'); if(el) el.innerHTML = t; }

/* ---------- battle animations (item 4 & 5) ---------- */
/* ---------- BATTLE LOG (arena debugging) ---------- */
function logBattle(msg){
  if(!ui.battle) return;
  if(!ui.battle.log) ui.battle.log = [];
  ui.battle.log.push(msg);
  if(ui.battle.log.length>200) ui.battle.log.shift();
  const box = $('#logBody');
  if(box){
    const d = document.createElement('div');
    d.style.cssText='padding:3px 0;border-bottom:1px solid rgba(35,32,25,0.07);';
    d.textContent = msg;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
  }
}

function bob(el, dir){ // dir: +1 = right, -1 = left
  if(!el) return;
  el.style.transition='transform .16s ease-out';
  el.style.transform=`translateX(${dir*14}px)`;
  setTimeout(()=>{ el.style.transform='translateX(0)'; }, 170);
}
/* The final figure — after types, statuses and every multiplier — floating
   above the sprite that took it. Multi-hit moves report one combined total. */
function showDamageNumber(anchorId, amount, opts){
  opts = opts || {};
  if(!amount || amount <= 0) return;
  const host = document.getElementById(anchorId);
  if(!host) return;
  const layer = document.getElementById('fxLayer') || document.getElementById('screen');
  if(!layer) return;
  const hb = host.getBoundingClientRect();
  const lb = layer.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'dmg-pop' + (opts.heal ? ' heal' : '');
  el.textContent = (opts.heal ? '+' : '') + amount;
  el.style.left = (hb.left - lb.left + hb.width/2) + 'px';
  el.style.top  = (hb.top  - lb.top  + hb.height*0.18) + 'px';
  layer.appendChild(el);
  setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 2100);
}
/* Sum a hit list so a 7-strike Ultra reports one number, not seven. */
function reportHits(hits){
  const byAnchor = {};
  (hits||[]).forEach(h=>{
    const id = (h.idx!=null && h.idx>=0) ? 'enemy-'+h.idx : 'playerBob';
    byAnchor[id] = (byAnchor[id]||0) + (h.dmg||0);
  });
  Object.entries(byAnchor).forEach(([id,total])=> showDamageNumber(id, total));
}

function flashHit(el){
  if(!el) return;
  el.classList.remove('hit-flash'); void el.offsetWidth; el.classList.add('hit-flash');
}
function drainHp(id, oldCur, newCur, max){
  const bar = document.getElementById(id);
  const num = document.getElementById(id+'-num');
  if(!bar) return;
  const green = bar.querySelector('.hp-green');
  const red = bar.querySelector('.hp-red');
  const oldPct = Math.max(0, oldCur/max*100);
  const newPct = Math.max(0, newCur/max*100);
  if(red){ red.style.transition='none'; red.style.width=oldPct+'%'; }
  if(green){ green.style.transition='width .1s'; green.style.width=newPct+'%'; green.style.background = newPct<30?'var(--cinnabar)':'var(--jade)'; }
  if(num) num.textContent = Math.max(0,newCur)+'/'+max;
  // let the red band linger, then shrink it away
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
    if(red){ red.style.transition='width .8s ease-out'; red.style.width=newPct+'%'; }
  });});
}

function onSwitchPressed(){
  const b=ui.battle;
  if(b.switchedThisTurn) return;
  const options = state.party.map((m,i)=>({m,i})).filter(o=>o.i!==b.activeIndex && o.m.currentHp>0 && !isPassenger(o.m));
  if(options.length===0){ toast('No other monster can fight.'); return; }
  monsterChooser('Switch to…', options, (i)=>{
    const sw = state.party[i];
    if(sw && !sw._entered){ sw._entered = true; applyEntryPassives(sw, sw.species, sw.level, monAtk(sw)); }
    const c = chargeState();
    if(c && c.uid === activeMon().uid) triggerDragonLegacy();   // stored power passes on
    const outgoing = activeMon();
    ui.battle.activeIndex=i; ui.battle.switchedThisTurn=true;
    carryBlockOnSwitch(outgoing, activeMon());   // the shield walks with your side
    ui.battle.phase = 'player';        // a free switch never hands the turn over
    /* Entry passives fire on a swap as well as on the opening monster — a
       Dragon Dance + carrier brought in mid-fight takes the initiative at once,
       and a Steel Aegis carrier arrives already holding block. */
    const inc = activeMon();
    if(inc && !inc._entered){ inc._entered = true; applyEntryPassives(inc, inc.species, inc.level, monAtk(inc)); }
    else if(inc) applyStonePassives(inc);
    renderBattle();
    /* Bringing the Whalelord back discharges everything he is owed — free, and
     it does not cost the turn the switch already gave you. */
    const back = activeMon();
    const owed = back && (MOVES[back.species]||[]).some(m=>m[6] && m[6].wrath) && wrathStacks() > 0;
    if(owed){
      ui.battle.phase = 'resolving';
      renderBattle();
      return vengefulWrath(back, ()=>{
        if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
        ui.battle.phase = 'player';
        renderBattle();
        battleMsg('Now choose a move.');
      });
    }
    if(!ui.battle.legacyBonus) battleMsg('Switched! Now choose a move.');
  });
}
/* Revitalise's choice, made BEFORE the writing so ten right words always land.
   Nobody down: a toast, no words spent, and it is still your turn. One down:
   straight on to the words. Several: the same chooser as Switch, and Cancel
   hands the turn back. */
function chooseRevival(mv, mon, onPick){
  const pool = revivableFallen(mon);
  if(!pool.length){
    ui.battle.phase = 'player';
    toast(`Nobody has fainted yet — ${mv.name} brings back a fainted teammate.`);
    return;
  }
  if(pool.length === 1) return onPick(pool[0]);
  monsterChooser('Bring back…', pool.map(m=>({ m, i:state.party.indexOf(m) })),
    i=> onPick(state.party[i]), true,
    ()=>{ ui.battle.phase = 'player'; renderBattle(); });
}
function monsterChooser(title, options, onPick, dismissable=true, onCancel=null){
  const scrim=document.createElement('div');
  scrim.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.55);z-index:70;display:flex;align-items:flex-end;justify-content:center;';
  scrim.innerHTML=`<div style="background:var(--paper);border-radius:18px 18px 0 0;padding:20px;max-width:480px;width:100%;">
    <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:17px;margin-bottom:12px;">${escapeHtml(title)}</div>
    ${options.map(o=>`<button class="btn btn-ghost sw-opt" data-i="${o.i}" style="margin-bottom:8px;display:flex;align-items:center;gap:10px;justify-content:flex-start;">
      ${monPortrait(o.m.species,36,{stage:monStage(o.m),crowned:isCrowned(o.m)})}<span>${escapeHtml(displayName(o.m))} · Lv ${o.m.level} · ${o.m.currentHp}/${monMaxHp(o.m)} HP</span></button>`).join('')}
    ${dismissable?'<button class="btn btn-ghost" id="chCancel" style="margin-top:4px;">Cancel</button>':''}
  </div>`;
  document.body.appendChild(scrim);
  const close=()=>document.body.removeChild(scrim);
  const cancel=()=>{ close(); if(onCancel) onCancel(); };
  if(dismissable){ scrim.querySelector('#chCancel').addEventListener('click',cancel); scrim.addEventListener('click',e=>{if(e.target===scrim)cancel();}); }
  scrim.querySelectorAll('.sw-opt').forEach(b=>b.addEventListener('click',()=>{ close(); onPick(+b.dataset.i); }));
}

function onFlee(){
  if(ui.battle.arena){ ui.arenaUnlocked=true; go('arena'); return; }
  if(ui.battle.noFlee) return;
  const trial = inSacredGroveTrial();
  const guardian = !!ui.battle.guardianTrial;
  ui.fledFrom = ui.battle.enemies[0].species;

  if(trial && !guardian){
    // Running costs progress: the whole run, or just the gauntlet if deep in.
    const c = state.progress.region2.courage||0;
    state.progress.region2.courage = (c >= COURAGE_GAUNTLET_FROM) ? COURAGE_FLEE_FALLBACK : 0;
    saveProfile();
    return guardianRebuke(state.progress.region2.courage);
  }
  if(guardian){
    // She is restored the moment you turn away — a fresh Guardian is built on
    // the next encounter, so any damage dealt is undone.
    return guardianRebuke(null, true);
  }
  toast('Got away safely!');
  const zid = (ui.currentZone||{}).id;
  const inPaths = zid==='rocky_caverns' && !cavernsComplete();
  /* Region 4 has no generic zone screen — falling through to 'zone' dropped
     the player into Region 1's wild pool, capped at 21. */
  const r4Zone = { diving:'diving', weather_deck:'weather_deck',
                   cabin_deck:'cabin_deck', laboratory_deck:'laboratory_deck' }[zid];
  go(ui.battle.isNpc ? 'challenge'
     : (inPaths ? 'caverns'
     : (zid==='geothermal_plant' ? 'plant'
     : (zid==='plant_generator' ? 'generator'
     : (r4Zone || 'zone')))));
}

/* A modal the player must dismiss — a toast is too easy to miss. */
function guardianRebuke(newCount, guardianHealed){
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(20,30,20,0.72);z-index:96;display:flex;align-items:center;justify-content:center;padding:24px;';
  ov.innerHTML = `
    <div style="background:var(--paper);border-radius:18px;padding:24px;max-width:360px;width:100%;text-align:center;box-shadow:0 12px 40px var(--shadow);">
      <div style="font-size:40px;margin-bottom:8px;">🌿</div>
      <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:17px;line-height:1.5;margin-bottom:10px;">
        The forest guardian is displeased with your lack of courage.<br>Fight, do not flee.
      </div>
      ${newCount!==null ? `<div style="font-size:13px;font-weight:700;color:var(--cinnabar);margin-bottom:14px;">
        Courage reset to ${newCount} / ${COURAGE_TARGET}.</div>` : ''}
      ${guardianHealed ? `<div style="font-size:13px;font-weight:700;color:var(--cinnabar);margin-bottom:14px;">
        The Guardian's wounds close as you turn away. She waits, whole again.</div>` : ''}
      <button class="btn btn-primary" id="rebukeOk">I understand</button>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelector('#rebukeOk').addEventListener('click', ()=>{
    if(ov.parentNode) document.body.removeChild(ov);
    go('zone');
  });
}
function livingEnemies(){ return ui.battle.enemies.filter(e=>e.hp>0); }

/* Every Very High status now covers the whole field or the whole enemy wave,
   so none of them ask the player to pick a target. Kept as a list because a
   future single-target status would simply be added here. */
const STATUS_NEEDS_TARGET = [];

function onMoveChosen(moveIdx){
  if((ui.battle.phase||'player') !== 'player') return;  // ignore clicks while a turn is still resolving
  ui.battle.phase = 'resolving';
  const mon=activeMon();
  const mv=unlockedMoves(mon)[moveIdx];
  if(mv && mv.scripted) return resolveScriptedMove(mv, mon);
  if(mv && mv.locked){ ui.battle.phase='player'; toast('Not while the Cataclysm is building.'); return; }
  if(mv && mv.chargeSpend) return resolveChargeSpend(mv, mon);
  if(mv && (mv.charge || mv.chargeMore)) return runChargeQuiz(mv, mon);
  /* Revitalise: who comes back is chosen before the writing, not after. */
  if(mv && mv.revitalise) return chooseRevival(mv, mon, m=>{ mv.reviveUid = m.uid; runMoveQuiz(mv, null); });
  if(mv.target==='Single' && livingEnemies().length>1){ promptTarget(mv); return; }
  if(mv.target==='Single'){ runMoveQuiz(mv, livingEnemies()[0]); return; }
  if(mv.target==='Status'){
    if(STATUS_NEEDS_TARGET.includes(mv.stoneType) && livingEnemies().length>1){ promptTarget(mv); return; }
    const t = STATUS_NEEDS_TARGET.includes(mv.stoneType) ? livingEnemies()[0] : null;
    runMoveQuiz(mv, t); return;
  }
  // High-tier twin skills: the FIRST hit is aimed by the player; the second
  // lands elsewhere at random and can never strike the same target.
  // With two enemies a twin skill hits both regardless, so only ask with three.
  if(mv.target==='Multi2' && livingEnemies().length>2){ promptTarget(mv); return; }
  runMoveQuiz(mv, mv.target==='Multi2' ? livingEnemies()[0] : null);
}
/* Explicit target picker. The old version relied on tapping the small enemy
   cards, which was easy to miss; this shows a clear list instead. */
function promptTarget(mv, onPick){
  const living = livingEnemies();
  if(living.length<=1){ (onPick||(t=>runMoveQuiz(mv,t)))(living[0]); return; }
  battleMsg('Choose a target.');
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.55);z-index:75;display:flex;align-items:flex-end;justify-content:center;';
  ov.innerHTML = `<div style="background:var(--paper);border-radius:18px 18px 0 0;padding:20px;max-width:480px;width:100%;">
    <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:17px;margin-bottom:4px;">${escapeHtml(mv.name)} — choose a target</div>
    <div style="font-size:12px;color:var(--ink-soft);font-weight:700;margin-bottom:12px;">${living.length} enemies on the field</div>
    ${living.map((e)=>{
      const i = ui.battle.enemies.indexOf(e);
      const st = eStatuses(e).map(s=>STATUS_LABELS[s.type]||s.type).join(', ');
      return `<button class="btn btn-ghost tgt-opt" data-i="${i}" style="margin-bottom:8px;display:flex;align-items:center;gap:10px;justify-content:flex-start;text-align:left;">
        ${monPortrait(e.species,36,{stage:e.stage||0})}
        <span style="flex:1;">${SPECIES[e.species].name} · Lv ${e.level} · ${e.hp}/${e.maxHp} HP
        ${st?`<br><span style="font-size:11px;color:var(--cinnabar);">${st}</span>`:''}</span>
      </button>`;
    }).join('')}
    <button class="btn btn-ghost" id="tgtCancel" style="margin-top:4px;">Cancel</button>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelector('#tgtCancel').addEventListener('click', ()=>{ close(); ui.battle.phase='player'; renderBattle(); });
  ov.addEventListener('click', e=>{ if(e.target===ov){ close(); ui.battle.phase='player'; renderBattle(); } });
  ov.querySelectorAll('.tgt-opt').forEach(b=> b.addEventListener('click', ()=>{
    close();
    const t = ui.battle.enemies[+b.dataset.i];
    (onPick||(x=>runMoveQuiz(mv,x)))(t);
  }));
}
/* Supply enough phrases to satisfy a WORD target. Shortest entries are 2
   characters, so ceil(target/2) phrases always suffices; a few spares are added
   so the quiz never runs dry if a miss shortens the run. */
/* Draw phrases until their COMBINED character count clears the target, with a
   buffer on top — not a fixed phrase count. The old heuristic assumed ~2
   characters per phrase; a list of single-character phrases (or very long
   ones) broke that assumption and could run the quiz dry before the target
   was reached, which read as the move "fizzling out" mid-fight. */
function pickWords(wordTarget){
  const pool = activePool().map(w=>w.text);
  if(pool.length===0) return [];
  const buffer = Math.max(4, Math.ceil(wordTarget * 0.3));   // headroom for misses/spill
  const needChars = wordTarget + buffer;
  const out=[]; let chars=0; let bag=shuffle(pool);
  let guard = 0;
  while(chars < needChars && guard++ < 500){
    if(bag.length===0) bag=shuffle(pool);
    const w = bag.pop();
    out.push(w);
    chars += countWords(w);
  }
  return out;
}
function countWords(text){ return (text||'').length; }   // one hanzi = one word
/* Moves that cost the user HP when they land. Self-damage runs through the same
   pipeline, so Overheat correctly increases it too (per the design). */
const SELF_DAMAGE = { 'Nova': 0.15 };
/* Moves that restore their user for a share of the USER'S OWN ATK on landing. */
const LIFESTEAL = { 'Giga Drain': 0.2 };          // enemy-side self-heal (the Guardian)
/* Player-side: Giga Drain routes its life to whichever ally is worst off as a
   PROPORTION of their maximum, and it can bring a fainted one back. */
const PARTY_DRAIN = { 'Giga Drain': 0.4 };

/* Living allies only — Giga Drain no longer resurrects. The caster gets first
   claim on the life it drained; if she's already full it passes to whoever is
   worst off as a proportion of their maximum. */
function drainRecipient(caster){
  const living = battleParty().filter(m=>m.currentHp > 0);
  if(!living.length) return null;
  if(caster && caster.currentHp > 0 && caster.currentHp < monMaxHp(caster)) return caster;
  const hurt = living.filter(m=>m.currentHp < monMaxHp(m));
  if(!hurt.length) return null;
  return hurt.sort((a,b)=>
    (a.currentHp/Math.max(1,monMaxHp(a))) - (b.currentHp/Math.max(1,monMaxHp(b))))[0];
}
function applyPartyDrain(mv, mon){
  const pct = PARTY_DRAIN[mv.name];
  if(!pct) return null;
  const t = drainRecipient(mon);
  if(!t) return null;
  const amount = Math.ceil(pct * monAtk(mon));
  const max = monMaxHp(t);
  const before = t.currentHp;
  t.currentHp = Math.min(max, before + amount);
  return { target:t, healed:t.currentHp - before };
}

/* Scripted moves used only inside the Rocky Caverns finale. They bypass the
   spelling quiz entirely — the drama is the point, and a writing prompt would
   undercut it. */
const SCRIPTED_MOVES = {
  /* Fixed damage: what a fully-charged Cataclysm Max would have done at the
     dragon's crowned 351 ATK. Enough to erase anything it is pointed at. */
  unleashMax:   { slot:'Basic', name:'Unleash Max',   fixed:614, target:'AOE',    words:0, scripted:true },
  hyperbeamMax: { slot:'Basic', name:'Hyperbeam Max', fixed:965, target:'Single', words:0, scripted:true },
  dragonLegacy: { slot:'Basic', name:'Dragon Legacy', mult:0, target:'AOE', words:0, scripted:true, endsBattle:true },
};

function applySelfDamage(mv, mon){
  const pct = SELF_DAMAGE[mv.name];
  if(!pct) return 0;
  let dmg = pct * monAtk(mon);
  if(getPStatus(0,'overheat')) dmg *= 1.5;   // overheat raises damage taken, incl. recoil
  dmg = Math.ceil(dmg);
  const before = mon.currentHp;
  mon.currentHp = Math.max(0, mon.currentHp - dmg);
  flashHit($('#playerBob'));
  drainHp('playerHp', before, mon.currentHp, monMaxHp(mon));
  logBattle(`${mv.name} recoil: ${displayName(mon)} took ${dmg} self-damage`);
  return dmg;
}

function runMoveQuiz(mv, target){
  const carry = ui.battle ? (ui.battle.wordCarry||0) : 0;
  // A scaling move keeps going past its requirement, gaining power each word,
  // until the player slips or the cap is reached.
  const ceilWords = mv.scale
    ? mv.words + Math.ceil((mv.scale.max - mv.mult) / mv.scale.per)
    : mv.words;
  const words = pickWords(Math.max(0, ceilWords - carry));
  startQuiz({
    title:mv.name,
    subtitle:`${mv.isStone?stoneTierDef(mv.stoneTier).label+' move':(mv.slot==='Basic'?'Basic move':mv.slot)} · write ${mv.words} words to power it up${mv.scale?` — keep going for up to ${mv.scale.max}× !`:''}`,
    words, stopAtFirstMiss:true, lockExit:true,
    wordTarget: ceilWords,
    stopAt: mv.scale ? mv.words : 0,     // scaling moves may be ended once powered
    startingWords: carry,
    onComplete:(results)=>resolveBattleMove(mv,target,results),
    onExit:()=>{ go('battle'); },
  });
}

/* Words written beyond a move's requirement roll into the next move. */
const RECHARGE_TARGET = 100;
/* Every word written during a fight feeds a shared meter. At 100 it restores
   every spent Very High and Ultra move — a second wind for long battles — and
   rolls the surplus into the next charge. */
function feedRecharge(words){
  const b = ui.battle;
  if(!b || !words) return false;
  b.rechargeWords = (b.rechargeWords||0) + words;
  if(b.rechargeWords < RECHARGE_TARGET) return false;
  b.rechargeWords -= RECHARGE_TARGET;
  b.usedVeryHigh = {};
  b.usedUltra = {};
  /* A refined stone's free passive re-arms with the same bar that restores a
     cast — so it fires again the next time its carrier takes the field. */
  b.passiveFired = {};
  return true;
}

function bankWordSpill(mv){
  if(!ui.battle) return 0;
  const done = (ui.quiz && ui.quiz.wordsDone) || 0;
  const spill = Math.max(0, done - mv.words);
  ui.battle.wordCarry = spill;
  return spill;
}

/* Tsunami sweeps the field; Dragon Legacy whites out and ends the sequence.
   Neither asks for a single written word. */
/* Charging: a 10-word quiz, then the turn passes. */
function runChargeQuiz(mv, mon){
  const def = mv.charge || (chargeState() && chargeState().def);
  const words = pickWords(mv.words);
  startQuiz({
    title: mv.name,
    subtitle: `Charging — write ${mv.words} words. The turn will pass while power gathers.`,
    words, stopAtFirstMiss:true, lockExit:true,
    wordTarget: mv.words,
    startingWords: (ui.battle && ui.battle.wordCarry) || 0,
    onComplete:(results)=>{
      /* The meter — and therefore the point at which the quiz ENDS — counts the
         spill carried in from the previous move. Leaving it out of this tally
         meant any carry-over guaranteed a "fizzle" despite a perfect run. */
      const carry = (ui.quiz && ui.quiz.config ? (ui.quiz.config.startingWords||0) : 0);
      const correct = results.filter(r=>r.passed).reduce((n,r)=>n+(r.words||countWords(r.text)),0) + carry;
      go('battle');
      if(correct < mv.words){
        battleMsg(`${mv.name} fizzled out! (${correct}/${mv.words} words)`);
        playSfx('move_miss');
        return setTimeout(advanceTurn, 900);
      }
      if(ui.battle) ui.battle.wordCarry = Math.max(0, correct - mv.words);
      startCharge(mon, def);
      const c = chargeState();
      playEffect(mv.name, { type:'Water', duration:800 });
      battleMsg(`⚡ Power gathers… ${c.charges} charge${c.charges>1?'s':''} held. The turn passes.`);
      logBattle(`${displayName(mon)} charged — ${c.charges}/${c.def.max}, window ${c.turnsLeft} turns`);
      renderBattle();
      setTimeout(advanceTurn, 1100);
    },
    onExit:()=>{ go('battle'); },
  });
}

/* Spending the charge — no words needed, the price was paid to build it. */
function resolveChargeSpend(mv, mon){
  const b = ui.battle;
  const c = chargeState();
  if(!c) { b.phase='player'; return renderBattle(); }
  const atk = monAtk(mon);
  const targets = mv.target==='AOE' ? livingEnemies() : [livingEnemies()[0]];
  if(!targets[0]){ b.phase='player'; return renderBattle(); }

  const hits = targets.filter(Boolean).map(t=>{
    const dmg = computeDamage(mv.mult, atk, monRef(mon), t, true);
    return { t, idx:b.enemies.indexOf(t), dmg, oldHp:t.hp, newHp:Math.max(0,t.hp-dmg) };
  });
  battleMsg(`${mv.name}! (${c.charges} charge${c.charges>1?'s':''}, ${mv.mult.toFixed(2)}× ATK)`);
  bob($('#playerBob'), +1);
  playEffect(mv.name, { type:'Water', duration:800, at: hits[0] ? 'enemy-'+hits[0].idx : null });
  logBattle(`${displayName(mon)} spent ${c.charges} charge(s) on ${mv.name} — ${mv.mult.toFixed(2)}x`);

  setTimeout(()=>{
    applyHits(hits);
    reportHits(hits);
    checkThresholdStuns();
    checkThresholdSleeps();
    if(getPStatus(0,'softened')) removePStatus(0,'softened');   // it blunts one blow only          // Unleash / Hyperbeam were landing silently
    c.turnsLeft--;
    if(c.turnsLeft <= 0){
      clearCharge();
      setTimeout(()=>{ battleMsg('The Cataclysm subsides.'); afterPlayerAttack(mon, hits); }, 700);
    } else {
      setTimeout(()=> afterPlayerAttack(mon, hits), 700);
    }
  }, 400);
}

/* The gamble: four more words, any of them from the full list, for double
   damage. Backing out keeps the damage already earned. */
/* The optional second quiz. Two flavours:
     mult       — Heavensplitter: doubles the damage
     aftershock — Rampage Max: adds a strike now and a stacking field effect
   Crucially it re-resolves with the ORIGINAL results, not the bonus quiz's;
   re-entering with the short bonus run scored ~2 words against a 10-word
   requirement, so the move landed for nothing. */
function offerBonusRound(mv, mon, hits, effMsg, origResults){
  const b = ui.battle;
  b._bonusOriginal = origResults || (ui.quiz ? ui.quiz.results : []);
  const isAftershock = !!(mv.bonus && mv.bonus.aftershock);
  const reward = isAftershock ? '+1 strike & Aftershock' : `×${mv.bonus.mult}`;
  const promise = isAftershock
    ? `to add <b>an extra strike</b> now and start an <b>Aftershock</b> — another strike every turn for 3 turns.`
    : `to <b>double</b> the damage.`;

  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.6);z-index:80;display:flex;align-items:center;justify-content:center;padding:24px;';
  ov.innerHTML = `<div style="background:var(--paper);border-radius:18px;padding:22px;max-width:340px;width:100%;text-align:center;">
    <div style="font-size:40px;">⚡</div>
    <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:19px;margin:6px 0;">${escapeHtml(mv.name)} is ready</div>
    <div style="font-size:13px;font-weight:600;line-height:1.55;color:var(--ink-soft);margin-bottom:16px;">
      Write <b>${mv.bonus.words} more words</b> — drawn from your <b>whole</b> list, not just today's —
      ${promise} No hints. Slip up and it still lands at full strength.
    </div>
    <button class="btn btn-primary" id="bonusGo">Try for ${reward}</button>
    <button class="btn btn-ghost" id="bonusSkip" style="margin-top:8px;">Strike now</button>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>{ if(ov.parentNode) document.body.removeChild(ov); };

  const finish = (won)=>{
    b._bonusResolved = true;
    if(isAftershock){
      if(won){
        /* Rampage still lands its own 5 strikes. The reward is a STANDING
           aftershock that hits at the start of each of the next 3 turns —
           and it locks in Steel Soul's bonus at the moment of creation. */
        const mon = activeMon();
        const soul = getPStatus(0,'steelSoul');
        const soulOn = !!(soul && soul.owner === mon.uid);
        const pct = (mv.slot === 'Max' ? 0.3 : 0.2) + (soulOn ? 0.1 : 0);
        addPreHit({ label:`💥 Aftershock rips through the ground!`, pct, atk:monAtk(mon),
                    turnsLeft:3, aoe:true });
        battleMsg(`💥 An aftershock begins — ${pct}× ATK for 3 turns.`);
      }
    } else {
      b.bonusMult = won ? mv.bonus.mult : 1;
    }
    const orig = b._bonusOriginal || [];
    b._bonusOriginal = null;
    resolveBattleMove(mv, hits[0] ? hits[0].t : null, orig);
  };

  ov.querySelector('#bonusSkip').addEventListener('click', ()=>{ close(); finish(false); });
  ov.querySelector('#bonusGo').addEventListener('click', ()=>{
    close();
    // draw by CHARACTER count, like every other quiz, from the whole word bank
    const pool = masterWords.slice();
    const target = mv.bonus.words;
    const words = [];
    let chars = 0, bag = shuffle(pool), guard = 0;
    while(chars < target && guard++ < 200){
      if(!bag.length) bag = shuffle(pool);
      const w = bag.pop();
      words.push(w); chars += countWords(w);
    }
    startQuiz({
      title: mv.name+' — power up',
      subtitle:`${target} words from your whole list. No hints.`,
      words, stopAtFirstMiss:true, lockExit:true,
      wordTarget: target,
      noHints: true,                    // a gamble should not be handheld
      onComplete:(res)=>{
        const got = res.filter(r=>r.passed).reduce((n,r)=>n+(r.words||countWords(r.text)),0);
        go('battle');
        finish(got >= target);
      },
      onExit:()=>{ go('battle'); finish(false); },
    });
  });
}

/* Aftershocks are ordinary pre-hits now; these remain so older call sites and
   the move-button text keep working. */
function aftershockBonusHits(){
  const b = ui.battle;
  return (b && b.preHits) ? b.preHits.filter(p=>/Aftershock/.test(p.label)).length : 0;
}
function tickAftershock(){ /* handled by runPreHits */ }

function resolveScriptedMove(mv, mon){
  const b = ui.battle;
  if(mv.endsBattle){
    battleMsg(`${displayName(mon)} used ${mv.name}!`);
    playEffect(mv.name, { duration:900 });
    const flash = document.createElement('div');
    flash.style.cssText='position:fixed;inset:0;background:#fff;z-index:92;opacity:0;transition:opacity 1.2s;';
    document.body.appendChild(flash);
    requestAnimationFrame(()=>{ flash.style.opacity='1'; });
    setTimeout(()=>{
      if(flash.parentNode) document.body.removeChild(flash);
      restoreRealParty();
      if(b.onWin) b.onWin();
    }, 1600);
    return;
  }
  // A scripted finisher: fixed damage, always enough, and it shows the number.
  const atk = monAtk(mon);
  const pool = mv.target==='Single' ? livingEnemies().slice(0,1) : livingEnemies();
  const hits = pool.map(t=>{
    const dmg = mv.fixed != null ? mv.fixed
              : Math.max(t.hp, computeDamage(mv.mult, atk, monRef(mon), t, true));
    return { t, idx:b.enemies.indexOf(t), dmg, oldHp:t.hp, newHp:Math.max(0, t.hp-dmg) };
  });
  battleMsg(`${displayName(mon)} used ${mv.name}!`);
  bob($('#playerBob'), +1);
  playEffect(mv.name, { duration:800 });
  setTimeout(()=>{
    applyHits(hits);
    reportHits(hits);              // the red numbers were missing here
    setTimeout(()=>{
      battleMsg('The field is swept clean!');
      setTimeout(()=>{
        // The sweep always empties the field, so the question is whether more
        // WAVES remain — checking for living enemies would end the fight early.
        if(b.waveIndex < b.waves.length - 1) return onWaveCleared();
        restoreRealParty();
        if(b.onWin) b.onWin();
      }, 900);
    }, 700);
  }, 500);
}

function restoreRealParty(){
  if(ui.realParty){ state.party = ui.realParty; ui.realParty = null; saveProfile(); }
}

function resolveBattleMove(mv, target, results){
  const mon=activeMon();
  results.filter(r=>!r.passed).forEach(r=>{ if(!ui.battle.fightMistakes.includes(r.text)) ui.battle.fightMistakes.push(r.text); });
  // Scored in WORDS now: sum the characters of every phrase written correctly,
  // plus any spill carried in from the previous move.
  const correct = results.filter(r=>r.passed).reduce((n,r)=>n+(r.words||countWords(r.text)),0)
                + (ui.quiz && ui.quiz.config ? (ui.quiz.config.startingWords||0) : 0);
  const spill = bankWordSpill(mv);
  // Feed the second-wind meter with everything written this turn, right or wrong
  const written = results.reduce((n,r)=>n+(r.words||countWords(r.text)),0);
  const recharged = feedRecharge(written);
  if(ui.battle) ui.battle.lastMove = mv;
  go('battle');
  if(recharged) setTimeout(()=>{ battleMsg('⚡ Second wind! Very High and Ultra moves restored.'); renderBattle(); }, 1500);

  if(mv.slot==='UltraStone') ui.battle.usedUltra[mon.uid]=true;
  if(mv.isStone && mv.stoneTier==='veryhigh') ui.battle.usedVeryHigh[mon.uid]=true;

  /* Tactical moves resolve before the ordinary damage path. */
  /* Vita — a pulse now, and a light that stays. */
  if(mv.vita){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    castVita(mon, mv.vita);
    playEffect(mv.name, { type:'Water' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  /* Conversio — it spends itself to bring others back. */
  if(mv.conversio){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    return runConversio(mon, mv.conversio);
  }
  /* Revitalise — the teammate chosen before the writing gets back up. */
  if(mv.revitalise){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    return castRevitalise(mon, mv);
  }
  /* Haunting Aria — instant, does not spend the turn. */
  if(mv.aria){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    if(ariaActive()){ battleMsg('The aria is already singing.'); return setTimeout(advanceTurn,700); }
    castAria(mon, mv.aria, false);
    ui.battle.phase = 'player';
    renderBattle();
    battleMsg('The aria settles. (instant — you can still attack!)');
    return;
  }
  /* Grudge — flat plus three quarters of everything he has lost. */
  if(mv.grudge){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    const dmg = grudgeDamage(mon, mv.grudge);
    const foes = livingEnemies();
    const hits = foes.map(t=>({ t, idx:ui.battle.enemies.indexOf(t), dmg,
                                oldHp:t.hp, newHp:Math.max(0, t.hp - dmg) }));
    battleMsg(`${mv.name}! Everything he has lost, given back at once.`);
    bob($('#playerBob'), +1);
    return setTimeout(()=>{ applyHits(hits); reportHits(hits);
      setTimeout(()=> afterPlayerAttack(mon, hits), 700); }, 380);
  }
  /* Vengeance — one hit, then the grudge begins gathering. */
  if(mv.wrath){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    const w = mv.wrath;
    setPStatus(0, { type:'wrath', turnsLeft:w.turns + 1, stacks:wrathStacks(),
                    per:w.per, bonus:w.bonus, bonusCap:w.bonusCap, dmgCap:w.dmgCap });
    renderStatusBadges();
    /* Three blows, each on a different enemy where there are enough of them,
       and heavier for every monster of yours that has fallen. */
    const v = mv.vengeance || { hits:1, perFallen:0, fallenCap:0 };
    const fallen = Math.min(v.fallenCap || 0, battleParty().filter(m=> m.currentHp <= 0).length);
    const per = mv.mult + (v.perFallen || 0) * fallen;
    const foes = livingEnemies();
    if(!foes.length) return setTimeout(()=> afterPlayerAttack(mon, []), 700);
    const start = Math.max(0, foes.indexOf(target && target.hp > 0 ? target : foes[0]));
    const left = new Map();                       // running health, so a repeat blow counts
    const hits = [];
    for(let i = 0; i < (v.hits || 1); i++){
      let t = foes[(start + i) % foes.length];
      const hpOf = x => left.has(x) ? left.get(x) : x.hp;
      if(hpOf(t) <= 0) t = foes.find(x=> hpOf(x) > 0) || t;
      const cur = hpOf(t);
      const dmg = computeDamage(per, monAtk(mon), monRef(mon), t, true);
      const nu = Math.max(0, cur - dmg);
      left.set(t, nu);
      hits.push({ t, idx:ui.battle.enemies.indexOf(t), dmg, oldHp:cur, newHp:nu });
    }
    battleMsg(`${mv.name}! ${hits.length} blows${fallen ? `, heavier for every one you have lost` : ''} — ` +
              `and every blow from here will be remembered.`);
    bob($('#playerBob'), +1);
    return setTimeout(()=>{ applyHits(hits); reportHits(hits);
      setTimeout(()=> offerVengeanceSwap(mon, hits), 800); }, 380);
  }
  if(mv.dot){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    const tick = applyDot(mv, mon);
    /* The noflee rider pins them down — and being stuck to the floor costs them
       the Elusive edge entirely. This must come AFTER the word check: a failed
       Magma Goo should not glue anything. */
    let pinned = 0;
    if(mv.dot.rider === 'noflee'){
      livingEnemies().forEach(t=>{ if(pinDown(t)) pinned++; });
    }
    renderStatusBadges();
    battleMsg(`${mv.name}! ${tick} damage a turn for ${mv.dot.turns} turns` +
      (mv.dot.rider==='noflee' ? ' — and nothing is getting away.' : ` — and they'll miss more often.`));
    if(pinned) setTimeout(()=> battleMsg(`🌋 ${pinned} of them ${pinned===1?'is':'are'} stuck fast — no more slipping away!`), 900);
    playEffect(mv.name, { type:SPECIES[mon.species].types[0] });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.shell && mv.mult==null){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    applyShell(mv, mon);
    renderStatusBadges();
    battleMsg(`${mv.name}! Damage taken cut by ${Math.round(mv.shell.reduce*100)}%, and attackers get burned.`);
    playEffect(mv.name, { type:SPECIES[mon.species].types[0] });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.tachy){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    setPStatus(0, { type:'tachy', turnsLeft:mv.tachy.turns+1, bonusAction:mv.tachy.bonusAction,
                    evadeFirst:mv.tachy.evadeFirst, evadeAfter:mv.tachy.evadeAfter, fresh:true });
    renderStatusBadges();
    battleMsg(`${mv.name}! Time slows — ${Math.round(mv.tachy.bonusAction*100)}% chance of an extra action each time you act, and much harder to hit.`);
    playEffect(mv.name, { type:'Psychic' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.grant){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    if(mv.blockedWhile && (mv.blockedWhile==='guard' ? mon.guard : (mon[mv.blockedWhile]||0) > 0)){
      ui.battle.phase='player';
      toast(`${displayName(mon)} is already in that stance.`);
      return renderBattle();
    }
    applyPassiveGrant(mon, mv.grant, monAtk(mon));
    renderStatusBadges();
    battleMsg(`${mv.name}! ${stanceSummary(mv.grant)}`);
    playEffect(mv.name, { type: SPECIES[mon.species].types[0] });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.charm){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    applyFieldStatus({ type:'charm', turnsLeft:mv.charm.turns, chance:mv.charm.chance });
    renderStatusBadges();
    battleMsg(`${mv.name}! For ${mv.charm.turns} turns each enemy may be charmed into losing its turn.`);
    playEffect(mv.name, { type:'Electric' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.disrupt){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    /* Identical in either pair of hands: a 5-turn field jam on the opposing
       side. −1 initiative to every enemy, including ones that arrive later,
       and a 15% chance each turn that one of them simply seizes up. */
    const pct = mv.disrupt.stun || 0.15;
    applyFieldStatus({ type:'disruptField', turnsLeft:mv.disrupt.turns, stun:pct, mine:true });
    livingEnemies().forEach(t=> addEStatus(t, { type:'disrupt', turnsLeft:mv.disrupt.turns, stun:pct, mine:true }));
    renderStatusBadges();
    battleMsg(`${mv.name}! Their signals are jammed for ${mv.disrupt.turns} turns — ` +
      `they lose the initiative, and ${Math.round(pct*100)}% of the time a monster seizes up entirely.`);
    playEffect(mv.name, { type:'Electric' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.soul){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    setPStatus(0, { type:'steelSoul', turnsLeft:mv.soul.turns+1, reduce:mv.soul.reduce,
                    bonus:mv.soul.bonus, owner:mon.uid });
    renderStatusBadges();
    battleMsg(`${mv.name}! Half damage taken and +${mv.soul.bonus}× ATK on every hit for ${mv.soul.turns} turns.`);
    playEffect(mv.name, { type:'Steel' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.clones){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(advanceTurn,900); }
    applyClones(mv, mon);
    renderStatusBadges();
    battleMsg(`${mv.name}! Two clones fight alongside you for ${mv.clones.turns} turns.`);
    playEffect(mv.name, { type:SPECIES[mon.species].types[0] });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.target==='Multi2') return resolveMulti2(mv, mon, correct, target);
  if(mv.target==='Status') return resolveStatusMove(mv, mon, target, correct);
  if(mv.target==='MultiHit') return resolveMultiHit(mv, mon, correct);

  // Single / AOE (standard species moves + Low/Mid stone moves)
  let factor = mv.isStone ? (correct>=mv.words ? mv.mult : 0) : moveFactor(mv.slot, mv.mult, mv.words, correct);
  if(mv.scale && correct > mv.words && factor > 0){
    factor = Math.min(mv.scale.max, mv.mult + mv.scale.per*(correct - mv.words));
  }
  // Swift Strike can't grant the player an initiative they already have, so it
  // pays out as extra damage instead.
  if(mv.playerBonus) factor += mv.playerBonus;
  // Iaijutsu / Dragon Dive / Ansatsu cash in their stance for a far bigger blow
  if(mv.spend && factor > 0){
    const spent = spendStance(mv, mon, factor);
    if(spent !== factor){
      factor = spent;
      battleMsg(`${mv.name} — the stance is spent!`);
    }
  }
  if(ui.battle && ui.battle.bonusMult && ui.battle.bonusMult > 1){
    factor *= ui.battle.bonusMult;          // multiplies with everything else
    ui.battle.bonusMult = 0;
  }
  if(factor<=0){ playSfx('move_miss'); battleMsg(`${mv.name} missed! (${correct}/${mv.words} words)`); setTimeout(advanceTurn,900); return; }
  const atk=monAtk(mon);
  /* SingleAOE: one main target at full power, everyone else at `splash`. */
  if(mv.target === 'SingleAOE' && mv.splash){
    const main = (target && target.hp>0) ? target : livingEnemies()[0];
    if(main){
      const all = livingEnemies().map(t=>{
        const f = (t === main) ? factor : factor * mv.splash;
        const dmg = computeDamage(f, atk, monRef(mon), t, true);
        return { t, idx:ui.battle.enemies.indexOf(t), dmg, oldHp:t.hp, newHp:Math.max(0,t.hp-dmg) };
      });
      battleMsg(`${mv.name}!`);
      bob($('#playerBob'), +1);
      playEffect(mv.name, { type: SPECIES[mon.species].types[0] });
      return setTimeout(()=>{
        applyHits(all); reportHits(all);
        setTimeout(()=> afterPlayerAttack(mon, all), 700);
      }, 400);
    }
  }

  /* Seoi Nage / Four Ounces return the exact figure last taken — guard
     absorption included — rather than scaling off ATK at all. */
  if(mv.reflect){
    const back = Math.ceil((mon.lastDamageTaken||0) * mv.reflect);
    const t = (target && target.hp>0) ? target : livingEnemies()[0];
    if(!t) return afterPlayerAttack(mon, []);
    if(back <= 0){
      battleMsg(`${mv.name}! But there was nothing to give back.`);
      return setTimeout(()=> afterPlayerAttack(mon, []), 800);
    }
    const h = [{ t, idx:ui.battle.enemies.indexOf(t), dmg:back, oldHp:t.hp, newHp:Math.max(0,t.hp-back) }];
    battleMsg(`${mv.name}! Their own force is turned against them.`);
    bob($('#playerBob'), +1);
    return setTimeout(()=>{ applyHits(h); reportHits(h); setTimeout(()=> afterPlayerAttack(mon, h), 700); }, 380);
  }
  /* Asana Flow / Primal Rend Max hit twice as hard from an untouched body. */
  if(mv.fullHpDouble && mon.currentHp >= monMaxHp(mon)){
    factor *= 2;
    battleMsg('Untouched — the strike lands at full force!');
  }
  /* Throat Take Max punishes a stunned target. */
  if(mv.stunnedMult && target && getEStatus(target,'paralysed')) factor = mv.stunnedMult;

  const targets = mv.target==='AOE' ? livingEnemies() : [target];

  /* A bonus move offers its optional second quiz BEFORE any damage resolves,
     so Rampage Max can ask for its aftershock words. Previously the multi-hit
     branch returned first and the offer was never reached. */
  if(mv.bonus && !ui.battle._bonusResolved && targets[0]){
    return offerBonusRound(mv, mon, [{ t:targets[0], idx:ui.battle.enemies.indexOf(targets[0]) }], '', results);
  }
  ui.battle._bonusResolved = false;

  /* A SINGLE-TARGET `hits` move rains several strikes on one enemy. An AOE
     `hits` move strikes EVERY enemy that many times — routing it through the
     single-target path was making Seismic Shock and Rampage hit one foe only. */
  if(mv.hits && mv.hits > 1 && targets[0]){
    if(mv.target !== 'AOE') return resolveSplitHits(mv, mon, factor, atk, targets[0]);
    return resolveAoeHits(mv, mon, factor, atk, targets);
  }
  const hits = targets.map(t=>{
    // an airborne or unseen defender is hard to touch
    const ev = stanceEvasion(t);
    if(ev > 0 && Math.random() < ev){
      const idx = ui.battle.enemies.indexOf(t);
      setTimeout(()=>{ dodgeEnemy(idx); floatMiss('enemy-'+idx, 'MISS'); }, 240);
      return { t, idx, oldHp:t.hp, newHp:t.hp, dmg:0, dodged:true };
    }
    let dmg = computeDamage(factor, atk, monRef(mon), t, true);
    const idx=ui.battle.enemies.indexOf(t);
    dmg = enemyGuard(t, dmg);
    enemyCounter(t, idx, dmg, 520);      // Silk Reeling / Scaled Stance
    return { t, idx, oldHp:t.hp, newHp:Math.max(0,t.hp-dmg), dmg };
  });
  let effMsg=''; hits.forEach(h=>{ const m=typeMultiplier(SPECIES[mon.species].types, h.t.types); if(m!==1) effMsg=effectivenessLabel(m); });
  logBattle(`${displayName(mon)} used ${mv.name} (${correct}/${mv.words} words${spill?`, +${spill} spill`:''}) — factor ${factor.toFixed(2)}x ATK ${atk}`);
  hits.forEach(h=>logBattle(`  → ${SPECIES[h.t.species].name} took ${h.dmg} (${h.oldHp}→${h.newHp})`));
  /* A bonus move offers a second, optional quiz drawn from the WHOLE word bank
     — unfamiliar words for double damage, quittable at any point. */
  if(mv.bonus && !ui.battle._bonusResolved){
    return offerBonusRound(mv, mon, hits, effMsg, results);
  }
  ui.battle._bonusResolved = false;
  battleMsg(`${mv.name}! ${effMsg}`);
  bob($('#playerBob'), +1);
  playEffect(mv.name, { type: mv.stoneType || SPECIES[mon.species].types[0], tier: mv.stoneTier,
                        at: hits[0] ? 'enemy-'+hits[0].idx : null });
  setTimeout(()=>{
    applyHits(hits);
    reportHits(hits);
    // Paralysis rolls per hit, so a multi-hit move gets several chances
    const stunPct = mv.paralyse || mv.stunHit;
    if(stunPct){
      const zapped = [];
      hits.forEach(h=>{
        if(h.t && h.t.hp>0 && Math.random() < stunPct && !getEStatus(h.t,'paralysed')){
          addEStatus(h.t, { type:'paralysed', turnsLeft:1 });
          zapped.push(SPECIES[h.t.species].name);
        }
      });
      if(zapped.length){
        renderStatusBadges();
        setTimeout(()=> battleMsg(`⚡ ${[...new Set(zapped)].join(' and ')} can't move!`), 650);
      }
    }
    if(mv.shell) applyShell(mv, mon);       // Slag Eruption leaves molten armour
    // resolves AFTER Leech Seed, so the field heal lands first
    const drain = applyPartyDrain(mv, mon);
    if(drain && drain.healed>0){
      if(drain.target === activeMon()) drainHp('playerHp', drain.target.currentHp-drain.healed, drain.target.currentHp, monMaxHp(drain.target));
      showDamageNumber(drain.target === activeMon() ? 'playerBob' : 'playerBob', drain.healed, { heal:true });
      setTimeout(()=> battleMsg(`🌿 ${displayName(drain.target)} drinks in ${drain.healed} HP.`), 600);
    }
    applySelfDamage(mv, mon);
    if(mon.currentHp<=0){
      /* Recoil can knock the attacker out on the same turn the wave falls.
         Clearing the wave has to win, or the fight stalls after the swap. */
      if(livingEnemies().length===0){ setTimeout(()=>onWaveCleared(), 900); return; }
      setTimeout(()=>onMonFainted(), 900); return;
    }
    afterPlayerAttack(mon, hits);
  }, 330);
}

/* apply a batch of {t,idx,oldHp,newHp} hits with flash + drain, mark fainted.
   Any hit on a Giga-Drain-marked enemy heals the active monster for 0.2x ATK. */
/* `opts.noLeech` marks damage that did NOT come from an attack the player
   chose — pre-hits like Overheat ✦'s burn and Aftershock. Those should not
   feed Leech Seed, or a seeded field would heal the team and gnaw the enemy
   before a single move was made. */
function applyHits(hits, opts){
  hits.forEach(h=>{ if(h && h.t) h.t.lastDamageTaken = h.dmg; });
  /* Arena immortality: a knock-out becomes a full heal, so a test runs as long
     as the tester wants without anything respawning. */
  if(ui.battle && ui.battle.arenaImmortal){
    hits.forEach(h=>{
      if(h && h.t && h.newHp <= 0){ h.newHp = h.t.maxHp; h.t.hp = h.t.maxHp; }
    });
  }
  // an enemy holding block stacks eats one per strike
  hits.forEach(h=>{
    if(!h || !h.t || !blockStacksOf(h.t)) return;
    const through = applyBlock(h.t, h.dmg, 'enemyBlk-'+h.idx);
    if(through !== h.dmg){
      h.blocked = h.dmg - through;
      h.dmg = through;
      h.newHp = Math.max(0, h.oldHp - through);
    }
  });
  const mon = activeMon();
  if(hits && hits.length) playSfx('hit_dealt');
  let healed = 0;
  hits.forEach(h=>{
    h.t.hp = h.newHp;
    flashHit(document.getElementById('enemy-'+h.idx));
    drainHp('enemyHp-'+h.idx, h.oldHp, h.newHp, h.t.maxHp);
    if(!(opts && opts.noLeech)) healed += resolveLeech(h.t, mon);
  });
  const ls = ui.battle && ui.battle.pendingLifesteal;
  if(ls){ healed += ls; ui.battle.pendingLifesteal = 0; }
  // Leech Seed feeds the WHOLE team, not only the monster that swung.
  if(healed>0){
    battleParty().forEach(m=>{
      if(m.currentHp<=0 || m===mon) return;
      m.currentHp = Math.min(monMaxHp(m), m.currentHp + healed);
    });
  }
  if(healed>0 && mon.currentHp>0){
    const max = monMaxHp(mon);
    const before = mon.currentHp;
    mon.currentHp = Math.min(max, mon.currentHp + healed);
    drainHp('playerHp', before, mon.currentHp, max);
    const others = battleParty().filter(m=>m.currentHp>0 && m!==mon).length;
    battleMsg(`🌿 The seed drinks deep — <b>${mon.currentHp-before} HP</b> to ${displayName(mon)}` +
      (others ? ` and every one of your other ${others} monster${others>1?'s':''}.` : '.'));
  }
  saveProfile();
  hits.forEach(h=>{ if(h.newHp<=0){ const el=document.getElementById('enemy-'+h.idx); if(el) el.classList.add('fainted'); } });
}

/* after any player attack resolves: check overcharge repeat, then move on.
   `hits` carries the per-target damage so a repeat re-applies the real amount. */
function afterPlayerAttack(mon, hits){
  if(ui.battle && ui.battle.legacyBonus){ ui.battle.legacyBonus = 0; }   // one move only
  /* Tachypsychia grants a whole EXTRA ACTION rather than a hidden second hit,
     re-rolled after every action — so a lucky streak can chain several. */
  /* Tachypsychia grants a whole EXTRA ACTION, re-rolled after every action so a
     lucky streak chains. It is also guaranteed to land at least once across its
     lifetime — a buff that can roll nothing at all feels broken rather than
     unlucky, so the last turn forces it if it hasn't happened yet. */
  /* Livewire (and Thundercat's passive in the player's hands) can fire again,
     and a repeat can itself repeat. */
  const lastMv = ui.battle && ui.battle.lastMove;
  const ownPassive = passiveOf(mon);
  const passiveDouble = (ownPassive && ownPassive.playerDouble && !ui.battle._passiveUsed)
    ? ownPassive.playerDouble : 0;
  const repeatPct = (lastMv && lastMv.repeat) || 0;
  if(passiveDouble && hits && hits.length && Math.random() < passiveDouble){
    ui.battle._passiveUsed = true;          // the second strike cannot repeat itself
    return runRepeatStrike(mon, Object.assign({}, lastMv, { repeat:0, name:ownPassive.name }),
      hits, ()=>{ ui.battle._passiveUsed = false; afterPlayerAttack(mon, hits); });
  }
  if(repeatPct && hits && hits.length && Math.random() < repeatPct){
    return runRepeatStrike(mon, lastMv, hits, ()=> afterPlayerAttack(mon, hits));
  }

  const tac = getPStatus(0,'tachy');
  if(tac){
    const lastChance = (tac.turnsLeft||0) <= 1 && !tac.procced;
    if(lastChance || Math.random() < (tac.bonusAction||0)){
      tac.procced = true;
      ui.battle.phase = 'player';
      renderBattle();
      battleMsg('⚡ Lightning reflexes — you act again!');
      playSfx('answer_correct');
      return;                    // the turn does NOT pass to the enemy
    }
  }
  const cl = ui.battle && ui.battle.clones;
  if(cl && cl.turnsLeft>0 && !ui.battle._cloneEchoing && hits && hits.length && ui.battle.lastMove){
    return runCloneEchoes(mon, ui.battle.lastMove, ()=> afterPlayerAttackReal(mon, hits));
  }
  return afterPlayerAttackReal(mon, hits);
}

/* A move that fires again at full power — Livewire, and Thundercat's passive
   when the player owns it. Chains indefinitely. */
function runRepeatStrike(mon, mv, prevHits, done){
  const b = ui.battle;
  const atk = monAtk(mon);
  const t = prevHits[0] && prevHits[0].t;
  if(!t || t.hp<=0){
    const alt = livingEnemies()[0];
    if(!alt) return done();
    prevHits = [{ t:alt, idx:b.enemies.indexOf(alt) }];
  }
  const target = prevHits[0].t;
  const dmg = computeDamage(mv.mult||0.5, atk, monRef(mon), target, true);
  const again = [{ t:target, idx:b.enemies.indexOf(target), dmg, oldHp:target.hp, newHp:Math.max(0,target.hp-dmg) }];
  battleMsg(`⚡ ${mv.name} arcs again!`);
  setTimeout(()=>{
    applyHits(again); reportHits(again);
    setTimeout(()=>{
      // a repeat can spark another
      if(Math.random() < (mv.repeat||0)) return runRepeatStrike(mon, mv, again, done);
      done();
    }, 600);
  }, 350);
}

/* The two copies repeat the move at half power, spreading across enemies that
   haven't been struck yet this turn. */
function runCloneEchoes(mon, mv, done){
  const b = ui.battle;
  b._cloneEchoing = true;
  const targets = cloneEchoTargets(2);
  const atk = monAtk(mon);
  const echoes = targets.filter(t=>t && t.hp>0).map(t=>{
    const dmg = Math.max(1, Math.ceil(computeDamage(mv.mult||0.2, atk, monRef(mon), t, true) * b.clones.mult));
    return { t, idx:b.enemies.indexOf(t), dmg, oldHp:t.hp, newHp:Math.max(0,t.hp-dmg) };
  });
  if(echoes.length===0){ b._cloneEchoing=false; return done(); }
  battleMsg('Two clones strike!');
  playSuccessiveHits(echoes, 0, ()=>{
    b._cloneEchoing = false;
    b.clones.turnsLeft--;
    if(b.clones.turnsLeft<=0){ b.clones=null; clearPStatus(0,'clones'); }
    done();
  }, true);
}

function afterPlayerAttackReal(mon, hits){
  setTimeout(()=>{
    const oc = getPStatus(0,'overcharge');
    const ocChance = oc ? (oc.fresh && oc.firstChance != null ? oc.firstChance : (oc.chance||0.25)) : 0;
    const canRepeat = oc && hits && hits.length && livingEnemies().length>0;
    /* ocChance honours the ✦ tier's certain first strike; oc.chance alone was
       using the base rate for every repeat. */
    if(canRepeat && Math.random() < ocChance){
      battleMsg('⚡ Overcharge triggers — the attack repeats!');
      /* A blow that KILLED its target used to leave nothing to repeat — the
         filter dropped the dead and the echo fizzled. It now falls on somebody
         else who is still standing. */
      const alive = livingEnemies();
      const again = hits.map(h=>{
        if(h.t.hp > 0) return { t:h.t, idx:h.idx, oldHp:h.t.hp, newHp:Math.max(0,h.t.hp-h.dmg), dmg:h.dmg };
        const t = alive[Math.floor(Math.random()*alive.length)];
        if(!t) return null;
        return { t, idx:ui.battle.enemies.indexOf(t), oldHp:t.hp,
                 newHp:Math.max(0, t.hp - h.dmg), dmg:h.dmg, redirected:true };
      }).filter(Boolean);
      if(again.length===0){ finishPlayerTurn(); return; }
      if(again.some(h=>h.redirected)) battleMsg('…and finds somebody else.');
      bob($('#playerBob'), +1);
      setTimeout(()=>{
        applyHits(again);
        setTimeout(finishPlayerTurn, 850);
      }, 300);
      return;
    }
    finishPlayerTurn();
  }, 850);
}
/* Vengeance pushes him off the field — but it is your choice, so the button is
   there to refuse. */
function offerVengeanceSwap(mon, hits){
  const others = state.party.map((m,i)=>({m,i}))
    .filter(o=>o.m.currentHp>0 && o.m !== mon && !isPassenger(o.m));
  if(!others.length) return afterPlayerAttack(mon, hits);
  const ov = document.createElement('div');
  ov.className = 'refine-scrim';
  ov.innerHTML = `
    <div class="refine-card">
      <div class="refine-name">The wake carries him off</div>
      <div class="refine-sub">Send someone into the field he has made?</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
        ${others.map(o=>`<button class="btn btn-primary" data-vsw="${o.i}">
          ${escapeHtml(displayName(o.m))} · Lv ${o.m.level}</button>`).join('')}
        <button class="btn btn-ghost" id="vswNo">Do not switch monster</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  ov.querySelectorAll('[data-vsw]').forEach(b=>b.addEventListener('click', ()=>{
    close();
    const i = +b.dataset.vsw;
    ui.battle.activeIndex = i;
    const nm = activeMon();
    if(nm && !nm._entered){ nm._entered = true; applyEntryPassives(nm, nm.species, nm.level, monAtk(nm)); }
    // the successor inherits the Whalelord's slot — no free extra action
    const row = (ui.battle.order||[]).find(r=>r.side==='player');
    if(row) row.mon = nm;
    renderBattle();
    battleMsg(`${displayName(nm)} steps into the wake.`);
    setTimeout(()=> afterPlayerAttack(nm, hits), 700);
  }));
  ov.querySelector('#vswNo').addEventListener('click', ()=>{
    close();
    battleMsg('He stays where he is.');
    setTimeout(()=> afterPlayerAttack(mon, hits), 500);
  });
}

/* A Combo is spent by the attack that benefited from it. */
function spendComboAfterAttack(mon){ clearCombo(mon); renderStatusBadges(); }

/* Conversio. Choose the fallen one at a time; each costs a Mors mark, and the
   third mark takes the bird with it. With nobody to raise, the power turns
   outward instead and simply removes health. */
/* Revitalise lands. The one chosen before the writing gets up with a tenth of
   its health, never less than 1. Nothing moves while you write, so the choice
   should still stand; if it somehow does not, the first still down takes it —
   and if nobody is, the words were written, so the turn stays yours. */
function castRevitalise(mon, mv){
  const pool = revivableFallen(mon);
  const m = pool.find(x=>x.uid === mv.reviveUid) || pool[0];
  if(!m){
    ui.battle.phase = 'player';
    renderBattle();
    battleMsg(`Nobody needed ${mv.name} after all — it's still your turn.`);
    return;
  }
  const pct = (mv.revitalise && mv.revitalise.pct) || 0.10;
  m.currentHp = Math.max(1, Math.ceil(pct * monMaxHp(m)));
  playSfx('recovery_heal');
  playEffect(mv.name, { type: SPECIES[mon.species].types[0] });
  renderBattle();
  battleMsg(`🌿 ${displayName(m)} is back on its feet with <b>${m.currentHp} HP</b>!`);
  logBattle(`${displayName(mon)} used ${mv.name} — ${displayName(m)} revived with ${m.currentHp} HP`);
  return setTimeout(()=> afterPlayerAttack(mon, []), 900);
}

/* ---------- a wild Caladrius's Vita and Conversio ----------
   The same gifts as in your hands, measured by ITS enormous health. */
function enemyVita(e, def, next){
  const heal = Math.ceil((def.pulse || 0.2) * e.maxHp);
  livingEnemies().forEach(x=>{
    const idx = ui.battle.enemies.indexOf(x), before = x.hp;
    x.hp = Math.min(x.maxHp, x.hp + heal);
    drainHp('enemyHp-' + idx, before, x.hp, x.maxHp);
  });
  e._vita = { turnsLeft: def.turns || 5, pulse: def.pulse || 0.2 };
  battleMsg(`🕊 ${SPECIES[e.species].name} uses <b>Vita</b> — its side is healed, and the light stays behind.`);
  renderStatusBadges();
  setTimeout(next, 1100);
}
function enemyVitaTick(e){
  const v = e._vita;
  if(!v || v.turnsLeft <= 0) return false;
  v.turnsLeft--;
  const hurt = livingEnemies().filter(x=> x.hp < x.maxHp).sort((a, b)=> a.hp / a.maxHp - b.hp / b.maxHp);
  if(!hurt.length) return false;
  const t = hurt[0], idx = ui.battle.enemies.indexOf(t), before = t.hp;
  t.hp = Math.min(t.maxHp, t.hp + Math.ceil(v.pulse * e.maxHp));
  drainHp('enemyHp-' + idx, before, t.hp, t.maxHp);
  battleMsg(`🕊 The light finds ${SPECIES[t.species].name} — <b>+${t.hp - before} HP</b>.`);
  return true;
}
function enemyConversio(e, def, next){
  const name = SPECIES[e.species].name;
  const fallen = ui.battle.enemies.filter(x=> x !== e && x.hp <= 0);
  if(fallen.length){
    fallen.slice(0, def.revives || 2).forEach(x=>{ x.hp = Math.max(1, Math.ceil((def.pct || 0.33) * x.maxHp)); });
    battleMsg(`🕊 ${name} uses <b>Conversio</b> — its fallen draw breath again.`);
    renderBattle();
    return setTimeout(next, 1100);
  }
  /* Nobody of its own to raise, so the light turns outward and simply takes —
     straight through any guard, as it does in your hands. */
  const mon = activeMon();
  const dmg = Math.ceil((def.direct || 0.33) * e.maxHp);
  const before = mon.currentHp;
  mon.currentHp = Math.max(0, mon.currentHp - dmg);
  drainHp('playerHp', before, mon.currentHp, monMaxHp(mon));
  battleMsg(`🕊 ${name} uses <b>Conversio</b> — with nobody to raise, the light turns outward and takes ` +
            `<b>${before - mon.currentHp}</b>.`);
  setTimeout(next, 1100);
}

function runConversio(mon, def){
  const fallen = ()=> state.party.map((m,i)=>({m,i}))
    .filter(o=>o.m.currentHp <= 0 && !isPassenger(o.m) && o.m !== mon);

  if(!fallen().length){
    const t = livingEnemies()[0];
    if(!t) return afterPlayerAttack(mon, []);
    const dmg = Math.ceil((def.direct || 0.33) * monMaxHp(mon));
    const idx = ui.battle.enemies.indexOf(t);
    battleMsg(`🕊 With nobody to raise, the light turns outward — and simply takes.`);
    return setTimeout(()=>{
      const before = t.hp;
      t.hp = Math.max(0, t.hp - dmg);       // direct removal: no guard, no reduction
      flashHit(document.getElementById('enemy-'+idx));
      drainHp('enemyHp-'+idx, before, t.hp, t.maxHp);
      showDamageNumber('enemy-'+idx, before - t.hp);
      if(t.hp <= 0){ const el=document.getElementById('enemy-'+idx); if(el) el.classList.add('fainted'); }
      setTimeout(()=> afterPlayerAttack(mon, []), 800);
    }, 500);
  }

  let raised = 0;
  const step = ()=>{
    const left = def.revives - raised;
    const room = MORS_LIMIT - morsMarks(mon);      // it cannot spend what it has not got
    const pool = fallen();
    if(raised >= def.revives || room <= 0 || !pool.length){
      if(raised) battleMsg(`🕊 ${raised} brought back. ${displayName(mon)} carries <b>${morsMarks(mon)}</b> mark${morsMarks(mon)===1?'':'s'}.`);
      return setTimeout(()=> afterPlayerAttack(mon, []), 800);
    }
    const ov = document.createElement('div');
    ov.className = 'refine-scrim';
    ov.innerHTML = `
      <div class="refine-card">
        <div class="refine-name">Conversio</div>
        <div class="refine-sub">${raised} of ${def.revives} raised · ${room} mark${room===1?'':'s'} left before it falls</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
          ${pool.map(o=>`<button class="btn btn-primary" data-rev="${o.i}">
            ${escapeHtml(displayName(o.m))} · Lv ${o.m.level}</button>`).join('')}
          <button class="btn btn-ghost" id="revStop">Stop here</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
    ov.querySelectorAll('[data-rev]').forEach(b=>b.addEventListener('click', ()=>{
      close();
      const m = state.party[+b.dataset.rev];
      m.currentHp = Math.max(1, Math.ceil((def.pct || 0.33) * monMaxHp(m)));
      raised++;
      battleMsg(`🕊 ${displayName(m)} draws breath again.`);
      addMors(mon, 1);
      renderBattle();
      setTimeout(step, 900);
    }));
    ov.querySelector('#revStop').addEventListener('click', ()=>{
      close();
      if(raised) battleMsg(`🕊 ${raised} brought back.`);
      setTimeout(()=> afterPlayerAttack(mon, []), 700);
    });
  };
  step();
}

function finishPlayerTurn(){
  if(livingEnemies().length===0){ setTimeout(onWaveCleared,700); return; }
  // hand back to the round's order rather than assuming the enemy is next
  spendComboAfterAttack(activeMon());
  setTimeout(advanceTurn, 850);
}

/* An Ultimate that strikes the same target repeatedly. */
/* Every enemy takes `hits` separate strikes, resolved one after another so the
   per-hit effects (Steel Soul's flat bonus, Leech Seed) apply to each. */
function resolveAoeHits(mv, mon, factor, atk, targets){
  const b = ui.battle;
  // a successful power-up adds a strike this cast; each Aftershock stack adds one more
  // Rampage always lands its own strikes; aftershocks arrive separately.
  const extra = 0;
  const totalHits = mv.hits;
  const per = mv.split ? factor / mv.hits : factor;
  const sim = new Map(targets.map(t=>[t, t.hp]));
  const all = [];
  let dodged = 0;
  for(let k=0;k<totalHits;k++){
    targets.forEach(t=>{
      if(sim.get(t) <= 0) return;
      const idx = b.enemies.indexOf(t);
      if(rollDodge(t, idx, 330 + (k*targets.length)*350)){ dodged++; return; }
      let dmg = computeDamage(per, atk, monRef(mon), t, true);
      dmg = enemyGuard(t, dmg);
      const oldHp = sim.get(t), newHp = Math.max(0, oldHp - dmg);
      sim.set(t, newHp);
      enemyCounter(t, idx, dmg, 520 + (k*targets.length)*350);
      all.push({ t, idx, dmg, oldHp, newHp });
    });
  }
  logBattle(`${displayName(mon)} used ${mv.name} — ${totalHits} strikes on ${targets.length} target(s)`);
  battleMsg(`${mv.name}!`);
  bob($('#playerBob'), +1);
  playEffect(mv.name, { type: SPECIES[mon.species].types[0] });
  setTimeout(()=> playSuccessiveHits(all, 0, ()=>{
    reportHits(all);
    saveProfile();
    applySelfDamage(mv, mon);
    battleMsg(`${mv.name} struck ${all.length} time${all.length===1?'':'s'}!`
      + (extra ? ` (+${extra} from Aftershock)` : '')
      + (dodged ? ` (${dodged} dodged)` : ''));
    if(mon.currentHp<=0){
      if(livingEnemies().length===0){ setTimeout(()=>onWaveCleared(), 900); return; }
      setTimeout(()=>onMonFainted(), 900); return;
    }
    afterPlayerAttack(mon, all);
  }, true), 330);
}

/* Every damage path must roll evasion, not just the single-hit one. Airborne
   and Unseen were being ignored entirely by multi-hit moves, so a Loong at 70%
   evasion never dodged a single strike of a six-hit barrage. */
/* ------------------------------------------------------------
   COUNTER
   A defender in a counter stance answers EVERY strike it takes from a move the
   player chose — single, twin, AOE and every hit of a barrage alike, each at
   the stance's own ratio.

   It deliberately does NOT answer pre-action-phase damage (Overheat's burn,
   Aftershock, the Haunting Aria's retaliation). Those hits are small and
   frequent, and letting them soak the counter would waste a stance the enemy
   paid for — the player would simply chip it away for free.
   ------------------------------------------------------------ */
/* An enemy holding Counter stacks guards instead of returning damage — the
   same 80% as yours, and it comes out of the exchange with a Combo. Called
   before the damage is committed so the reduction actually applies. */
function enemyGuard(t, dmg){
  if(!t || !counterCountOf(t) || dmg <= 0) return dmg;
  return Math.ceil(dmg * spendEnemyCounter(t));
}
/* Superseded by enemyGuard(); kept inert so older call sites cannot misfire. */
function enemyCounter(t, idx, dmg, delay){
  return 0;
}
function enemyCounter_unused(t, idx, dmg, delay){
  if(!t || !(t.counterTurns > 0) || dmg <= 0) return 0;
  const mon = activeMon();
  if(!mon || mon.currentHp <= 0) return 0;
  const back = Math.ceil(dmg * (t.counterRet || 0.5));
  setTimeout(()=>{
    const m = activeMon();
    if(!m || m.currentHp <= 0) return;
    const before = m.currentHp;
    m.currentHp = Math.max(0, m.currentHp - back);
    m.lastDamageTaken = back;
    const ar = ariaState(); if(ar) ar.struck = true;
    counterDrift(document.getElementById('enemyBob-'+idx), document.getElementById('enemyBob-'+idx));
    drainHp('playerHp', before, m.currentHp, monMaxHp(m));
    showDamageNumber('playerBob', back);
    battleMsg(`↩️ ${SPECIES[t.species].name} turns your force back on you — ${back}!`);
  }, delay || 520);
  return back;
}

/* A confused monster swings at its own side. With friends on the field it picks
   one at random; alone, it hits itself. Either way something visibly happens. */
function confusedStrike(e, done){
  const b = ui.battle;
  const mates = livingEnemies().filter(x=>x !== e);
  const victim = mates.length ? mates[Math.floor(Math.random()*mates.length)] : e;
  const mv = enemyMoveFor(e) || (MOVES[e.species]||[])[0];
  const mult = (mv && mv[2]) || 0.3;
  /* Higher tiers do not turn more swings — they make the turned ones hurt. */
  const conf = getEStatus(e,'discombobulate');
  const power = (conf && conf.ffPower) || 0.60;
  const dmg = Math.max(1, Math.ceil(mult * e.atk * power));
  const idx = b.enemies.indexOf(victim);
  const from = b.enemies.indexOf(e);
  battleMsg(victim === e
    ? `🌀 ${SPECIES[e.species].name} is too dizzy to tell which way is out — it hits itself!`
    : `🌀 ${SPECIES[e.species].name} swings wildly and clouts ${SPECIES[victim.species].name}!`);
  bob(document.getElementById('enemyBob-'+from), -1);
  setTimeout(()=>{
    const before = victim.hp;
    victim.hp = Math.max(0, victim.hp - dmg);
    flashHit(document.getElementById('enemy-'+idx));
    drainHp('enemyHp-'+idx, before, victim.hp, victim.maxHp);
    showDamageNumber('enemy-'+idx, dmg);
    if(victim.hp <= 0){
      const el = document.getElementById('enemy-'+idx);
      if(el) el.classList.add('fainted');
      battleMsg(`${SPECIES[victim.species].name} is knocked out by its own side!`);
    }
    setTimeout(()=>{
      if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
      done();
    }, 800);
  }, 420);
}

function rollDodge(t, idx, delay){
  const ev = stanceEvasion(t);
  if(ev <= 0 || Math.random() >= ev) return false;
  setTimeout(()=>{ dodgeEnemy(idx); floatMiss('enemy-'+idx, 'MISS'); }, delay||0);
  return true;
}

function resolveSplitHits(mv, mon, factor, atk, target){
  const n = mv.hits;
  const per = mv.split ? factor / n : factor;   // split shares the total; others hit full each time
  const tIdx = ui.battle.enemies.indexOf(target);
  const hits = [];
  let simHp = target.hp;
  let dodged = 0;
  for(let i=0;i<n;i++){
    if(simHp<=0) break;
    if(rollDodge(target, tIdx, 330 + i*350)){ dodged++; continue; }   // each strike rolls
    let dmg = computeDamage(per, atk, monRef(mon), target, true);
    dmg = enemyGuard(target, dmg);
    const oldHp = simHp, newHp = Math.max(0, simHp-dmg);
    simHp = newHp;
    enemyCounter(target, tIdx, dmg, 520 + i*350);   // each strike is answered
    hits.push({ t:target, idx:tIdx, dmg, oldHp, newHp });
  }
  logBattle(`${displayName(mon)} used ${mv.name} — ${hits.length} strikes on ${SPECIES[target.species].name}`);
  hits.forEach((h,i)=>logBattle(`  strike ${i+1}: ${h.dmg} (${h.oldHp}→${h.newHp})`));
  battleMsg(`${mv.name}!`);
  bob($('#playerBob'), +1);
  playEffect(mv.name, { type: SPECIES[mon.species].types[0], at:'enemy-'+hits[0].idx });
  setTimeout(()=> playSuccessiveHits(hits, 0, ()=>{
    saveProfile();
    battleMsg(`${mv.name} struck ${hits.length} time${hits.length===1?'':'s'}!`
      + (dodged ? ` (${dodged} dodged)` : ''));
    afterPlayerAttack(mon, hits);
  }, true), 330);
}

/* High tier: hit 2 different living enemies at 0.8x each (or the single enemy once if only 1 exists) */
function resolveMulti2(mv, mon, correct, target){
  if(correct<mv.words){ battleMsg(`${mv.name} missed! (${correct}/${mv.words} words)`); setTimeout(advanceTurn,900); return; }
  const atk=monAtk(mon);
  const living = livingEnemies();
  let targets;
  if(living.length >= 2){
    const first = (target && target.hp>0) ? target : living[0];
    const others = shuffle(living.filter(e=>e !== first));   // never the primary target
    targets = others.length ? [first, others[0]] : [first];
  } else {
    targets = living.slice(0,1);
  }
  const hits = targets.map(t=>{
    const dmg = computeDamage(mv.mult, atk, monRef(mon), t, true);
    return { t, idx:ui.battle.enemies.indexOf(t), oldHp:t.hp, newHp:Math.max(0,t.hp-dmg), dmg };
  });
  logBattle(`${displayName(mon)} used ${mv.name} (High, ${mv.mult}x ATK ${atk}) on ${hits.length} target(s)`);
  hits.forEach(h=>logBattle(`  → ${SPECIES[h.t.species].name} took ${h.dmg} (${h.oldHp}→${h.newHp})`));
  battleMsg(`${mv.name}!`);
  bob($('#playerBob'), +1);
  playEffect(mv.name, { type: mv.stoneType || SPECIES[mon.species].types[0], tier: mv.stoneTier,
                        at: hits[0] ? 'enemy-'+hits[0].idx : null });
  setTimeout(()=> playSuccessiveHits(hits, 0, ()=>{
    saveProfile();
    battleMsg(`${mv.name} hit ${hits.length} time${hits.length===1?'':'s'}!`);
    afterPlayerAttack(mon, hits);
  }, true), 330);
}

/* Ultra tier: 5-7 random hits (45/35/20) spread across enemies, may repeat a target.
   Screen inverts briefly on use; hits animate at 2x speed in succession. */
function resolveMultiHit(mv, mon, correct, driveTarget){
  if(correct<mv.words){ battleMsg(`${mv.name} missed! (${correct}/${mv.words} words)`); setTimeout(advanceTurn,900); return; }
  /* Hit count widens as the stone is refined: 5-7 → 6-8 → 7-9. */
  /* A drive move has a fixed count; an Ultra stone widens as it is refined. */
  const range = mv.ultraStone ? ultraHitRange(mv.ultraStone) : { min:5, max:7 };
  const r=Math.random();
  const n = mv.drive ? (mv.hits||3)
          : (r<0.45 ? range.min : (r<0.80 ? range.min+1 : range.max));
  const atk=monAtk(mon);
  // simulate against a working copy of HP so targeting skips already-downed enemies,
  // but leave real HP untouched until the animation plays it back hit by hit
  const sim = new Map(ui.battle.enemies.map(e=>[e, e.hp]));
  const hits=[];
  let dodged = 0;
  for(let i=0;i<n;i++){
    const alive = ui.battle.enemies.filter(e=>sim.get(e)>0);
    if(alive.length===0) break;
    /* A `drive` move lands its FIRST blow where you aimed it, and scatters
       afterwards — repeats on the same target are allowed. */
    const t = (mv.drive && i === 0 && driveTarget && sim.get(driveTarget) > 0)
      ? driveTarget
      : alive[Math.floor(Math.random()*alive.length)];
    const idx = ui.battle.enemies.indexOf(t);
    if(rollDodge(t, idx, 330 + i*350)){ dodged++; continue; }   // an unseen foe slips the blow
    let dmg = computeDamage(mv.mult, atk, monRef(mon), t, true);
    dmg = enemyGuard(t, dmg);
    const oldHp = sim.get(t);
    const newHp = Math.max(0, oldHp - dmg);
    sim.set(t, newHp);
    enemyCounter(t, idx, dmg, 520 + i*350);
    hits.push({ t, idx, oldHp, newHp, dmg });
  }
  invertScreen();
  logBattle(`${displayName(mon)} used ${mv.name} (Ultra) — rolled ${n} hits, landed ${hits.length}`);
  hits.forEach((h,i)=>logBattle(`  hit ${i+1} → ${SPECIES[h.t.species].name} took ${h.dmg} (${h.oldHp}→${h.newHp})`));
  battleMsg(`${mv.name} unleashed!`);
  bob($('#playerBob'), +1);
  playEffect(mv.name, { duration:700, type: mv.stoneType || SPECIES[mon.species].types[0], tier: mv.stoneTier });
  setTimeout(()=> playSuccessiveHits(hits, 0, ()=>{
    releaseInvert();                      // only once every strike has landed
    saveProfile();
    reportHits(hits);
    applySelfDamage(mv, mon);
    battleMsg(`${mv.name} hit ${hits.length} time${hits.length===1?'':'s'}!`);
    if(mon.currentHp<=0){
      /* Recoil can knock the attacker out on the same turn the wave falls.
         Clearing the wave has to win, or the fight stalls after the swap. */
      if(livingEnemies().length===0){ setTimeout(()=>onWaveCleared(), 900); return; }
      setTimeout(()=>onMonFainted(), 900); return;
    }
    afterPlayerAttack(mon, hits);
  }, true), 330);
}
/* Held until explicitly released, so the screen stays inverted for the entire
   Ultra sequence rather than snapping back mid-barrage. */
function invertScreen(ms){
  document.body.classList.add('ultra-invert');
  if(ms) setTimeout(()=> releaseInvert(), ms);
}
function releaseInvert(){ document.body.classList.remove('ultra-invert'); }
/* play pre-computed hits one at a time, applying HP as each lands.
   fast=true halves the gap (the multi-hit "2x speed" rule). */
/* Thunderhound punishes each health threshold it is driven below, once each. */
/* Moon Swan's Nocturne. Same shape as Hunter's Instinct, but it sings you
   under instead of rattling you. */
/* Under a ✦ Curse a threshold passive stays silent. The threshold is still
   used up — it must not go off late once the curse lifts — but nothing happens. */
function swallowThresholds(e, list, hit, frac){
  const crossed = list.filter(th=> frac <= th && !hit.includes(th));
  if(!crossed.length) return;
  crossed.forEach(th=> hit.push(th));
  const p = passiveDefOf(e);
  setTimeout(()=> battleMsg(`🔇 The curse swallows ${SPECIES[e.species].name}'s ${p ? p.name : 'passive'}.`), 500);
}
function checkThresholdSleeps(){
  const b = ui.battle;
  if(!b) return;
  livingEnemies().forEach(e=>{
    if(!e.thresholdSleep || !e.thresholdSleep.length) return;
    const frac = e.hp / Math.max(1, e.maxHp);
    if(passivesMuted(e)){ swallowThresholds(e, e.thresholdSleep, e.sleepThresholdsHit, frac); return; }
    e.thresholdSleep.forEach(th=>{
      if(frac <= th && !e.sleepThresholdsHit.includes(th)){
        e.sleepThresholdsHit.push(th);
        const mon = activeMon();
        if(mon && mon.currentHp > 0 && !getPStatus(0,'asleep')){
          setPStatus(0, { type:'asleep', turnsLeft:2 });   // enemy-owned: the dust clears it
          renderStatusBadges();
          setTimeout(()=> battleMsg(`💤 ${SPECIES[e.species].name} sings — ${displayName(mon)} cannot keep its eyes open!`), 500);
        }
      }
    });
  });
}

function checkThresholdStuns(){
  const b = ui.battle;
  if(!b) return;
  livingEnemies().forEach(e=>{
    if(!e.thresholdStun || !e.thresholdStun.length) return;
    const frac = e.hp / Math.max(1, e.maxHp);
    if(passivesMuted(e)){ swallowThresholds(e, e.thresholdStun, e.thresholdsHit, frac); return; }
    e.thresholdStun.forEach(th=>{
      if(frac <= th && !e.thresholdsHit.includes(th)){
        e.thresholdsHit.push(th);
        const mon = activeMon();
        if(mon && mon.currentHp > 0 && !getPStatus(0,'stunned')){
          if(enemyStatusBlocked('stunned')){ battleMsg('💎 The diamond dust turns the howl aside.'); }
          else setPStatus(0, { type:'stunned', turnsLeft:2 });
          renderStatusBadges();
          setTimeout(()=> battleMsg(`💫 ${SPECIES[e.species].name} howls — ${displayName(mon)} is stunned!`), 500);
        }
      }
    });
  });
}

function playSuccessiveHits(hits, i, done, fast){
  if(i>=hits.length){
    const tally = ui.battle && ui.battle._leechTally;
    if(tally > 0){
      ui.battle._leechTally = 0;
      const n = battleParty().filter(m=>m.currentHp>0).length;
      setTimeout(()=> battleMsg(
        `🌿 The seeds drink deep — <b>${tally} HP</b> to each of your ${n} standing monster${n>1?'s':''}.`), 350);
    }
    done(); return;
  }
  const h = hits[i];
  const gap = fast ? 350 : 350;   // Ultra strikes now dwell as long as normal ones
  h.t.hp = h.newHp;
  flashHit(document.getElementById('enemy-'+h.idx));
  drainHp('enemyHp-'+h.idx, h.oldHp, h.newHp, h.t.maxHp);
  {
    /* Leech Seed on a multi-hit move healed silently — no message, and only the
       active monster's bar moves — so there was no way to tell it had worked.
       Tally it and announce the total when the barrage finishes. */
    const mon = activeMon();
    const got = resolveLeech(h.t, mon);
    if(got > 0){
      leechHealParty(got, mon);
      if(ui.battle) ui.battle._leechTally = (ui.battle._leechTally||0) + got;
    }
  }
  if(h.newHp<=0){ const el=document.getElementById('enemy-'+h.idx); if(el) el.classList.add('fainted'); }
  setTimeout(()=> playSuccessiveHits(hits, i+1, done, fast), gap);
}

/* Very High tier: single status application, per-type effect (see applyVeryHighEffect) */
function resolveStatusMove(mv, mon, target, correct){
  if(correct<mv.words){ battleMsg(`${mv.name} missed! (${correct}/${mv.words} words)`); setTimeout(advanceTurn,900); return; }
  const atk=monAtk(mon);
  const targets = target ? [target] : [];
  const res = applyVeryHighEffect(mv.stoneType, mon, atk, targets, mv.stonePlus||0);
  bob($('#playerBob'), +1);
  playEffect(mv.name, { type: mv.stoneType, tier:'veryhigh', at: target ? 'enemy-'+ui.battle.enemies.indexOf(target) : null });
  setTimeout(()=>{
    let hits = [];
    if(res.hits && res.hits.length){
      hits = res.hits.map(h=>({ t:h.enemy, idx:ui.battle.enemies.indexOf(h.enemy), oldHp:h.enemy.hp, newHp:Math.max(0,h.enemy.hp-h.dmg), dmg:h.dmg }));
      applyHits(hits);
    }
    renderStatusBadges();
    logBattle(`${displayName(mon)} used ${mv.name} (Very High, instant) — ${res.msg}`);
    battleMsg(res.msg);
    // Very High skills are INSTANT CAST: applying a status doesn't consume the
    // turn, so the player still gets to attack. (Giga Drain's own damage tick is
    // part of applying the mark, not a separate attack.)
    setTimeout(()=>{
      if(livingEnemies().length===0){ setTimeout(onWaveCleared,600); return; }
      /* A refined Diamond Dust also casts other Very High skills — pick them,
         then fire them one after another before handing control back. */
      if(res.borrowPick || res.borrowRandom){
        const dd = getPStatus(0,'diamondDust') || {};
        const bt = dd.borrowTier != null ? dd.borrowTier : (mv.stonePlus||0);
        const done = ()=>{
          ui.battle.phase = 'player';
          renderBattle();
          battleMsg('Diamond Dust settles. (instant — you can still attack!)');
        };
        /* A random facet, never the one already chosen. */
        const randomFacet = (exclude)=>{
          const pool = BORROW_GRID.filter(t=>!exclude.includes(t));
          return pool[Math.floor(Math.random()*pool.length)];
        };
        if(res.borrowPick){
          // ✦ — one of your choosing, then one the stone chooses
          return openBorrowPicker(mon, bt, res.borrowPick, (picked)=>{
            const chosen = picked.slice();
            if(res.borrowRandom){
              const extra = randomFacet(chosen);
              if(extra) chosen.push(extra);
            }
            castBorrowed(mon, atk, chosen, bt, done);
          });
        }
        // + — no menu at all; the light falls where it falls
        const roll = [];
        for(let k=0;k<res.borrowRandom;k++){
          const t = randomFacet(roll);
          if(t) roll.push(t);
        }
        return castBorrowed(mon, atk, roll, bt, done);
      }
      // Instant cast doesn't consume the turn, so control returns to the player.
      ui.battle.phase = 'player';
      renderBattle();
      battleMsg(res.msg + ' (instant — you can still attack!)');
    }, 700);
  }, 330);
}

/* ---------- ENEMY TURN ----------
   Enemies now strike ONE AT A TIME rather than as a single lump, so a crowded
   wave builds pressure blow by blow. If the active monster faints partway
   through, the remaining attackers do NOT get their swings — the player sends
   out a replacement and the turn passes back to them. */
/* A single enemy takes its slot in the order. The old enemyTurn() ran the
   whole wave at once, which is what made per-monster initiative impossible. */
function runSingleEnemyTurn(e){
  const b = ui.battle;
  if(!b || !e || e.hp <= 0) return advanceTurn();

  // a skipping arena dummy simply stands there
  if(e.isDummy && !e.arenaActs) return advanceTurn();

  // your deep freeze: nobody on their side moves while it holds
  if(getPStatus(0,'deepFreeze')){
    battleMsg(`🧊 ${SPECIES[e.species].name} is frozen solid!`);
    return setTimeout(advanceTurn, 700);
  }
  // frozen or stunned: it holds its slot but loses the action
  const ice = getEStatus(e,'iceTomb');
  if(ice){
    ice.turnsLeft--;
    if(ice.turnsLeft<=0) removeEStatus(e,'iceTomb');
    renderStatusBadges();
    battleMsg(`🧊 ${SPECIES[e.species].name} is frozen solid!`);
    return setTimeout(advanceTurn, 700);
  }
  if(getEStatus(e,'paralysed')){
    removeEStatus(e,'paralysed');
    renderStatusBadges();
    battleMsg(`💫 ${SPECIES[e.species].name} is stunned and can't move!`);
    return setTimeout(advanceTurn, 700);
  }
  // an Elusive thief spends its slot leaving
  if(isElusive(e)){
    elusiveFlee(e);
    renderStatusBadges();
    return setTimeout(()=>{
      if(livingEnemies().length === 0) return onElusiveFieldEmpty();
      advanceTurn();
    }, 800);
  }
  b.attackQueue = [e];
  runEnemyAttack(0);
}

function enemyTurn(){
  const b = ui.battle;
  b.acted = b.acted || [];
  // anyone who took the initiative this round has already had their action
  let attackers = livingEnemies().filter(e=>!b.acted.includes(e));
  // arena dummies set to 'skips turn' never act at all
  attackers = attackers.filter(e=>!(e.isDummy && !e.arenaActs));

  // Ice Tomb: frozen enemies lose their turn; tick the counter and thaw at zero
  const acting = [];
  let frozenCount = 0;
  const deep = getPStatus(0,'deepFreeze');
  attackers.forEach(e=>{
    const ice = getEStatus(e,'iceTomb');
    const par = getEStatus(e,'paralysed');
    if(deep){
      frozenCount++;                        // your field holds every one of them
    } else if(ice){
      frozenCount++;
      ice.turnsLeft--;
      if(ice.turnsLeft<=0) removeEStatus(e,'iceTomb');
      else e._stillFrozen = true;
    } else if(par){
      frozenCount++;
      removeEStatus(e,'paralysed');       // one turn only
    } else {
      acting.push(e);
    }
  });

  if(acting.length===0){
    const left = deep ? Math.max(0, deep.turnsLeft - 1)
      : Math.max(0, ...livingEnemies().map(e=>{ const i=getEStatus(e,'iceTomb'); return i?i.turnsLeft:0; }));
    // everyone who could act already did, back in the initiative phase
    const allStruck = frozenCount===0 && livingEnemies().length>0
                   && livingEnemies().every(e=>(b.acted||[]).includes(e));
    battleMsg(frozenCount
      ? (left ? "🧊 The frozen enemies can't move! (" + left + ' more turn' + (left>1?'s':'') + ')'
              : "🧊 The frozen enemies can't move! The ice is cracking…")
      : (allStruck ? 'They already struck this round.' : 'The enemy hesitates!'));
    renderStatusBadges();
    return endEnemyRound();
  }

  b.attackQueue = acting;
  runEnemyAttack(0);
}

/* An evolved wild monster fights unpredictably: it picks from its whole
   unlocked moveset each turn instead of always using the same attack. */
function enemyMoveFor(e){
  /* The Don's dragon opens by charging Cataclysm Max for three turns, then
     hyperbeams every turn after. Its charge is tracked on the enemy itself. */
  if(e.ai === 'ankylo'){
    e.turnsTaken = (e.turnsTaken||0) + 1;
    if(e.turnsTaken === 1) return ['Power2','Steel Soul',null,'Self',4,35];
    const mx = MOVES[e.species].find(m=>m[0]==='Max');
    return mx || e.move;
  }
  if(e.ai === 'cataclysm'){
    e.chargeTurns = (e.chargeTurns||0) + 1;
    if(e.chargeTurns <= 3) return ['Charge','Cataclysm Max',null,'Charge',0,0];
    const charges = 3;
    return ['Ultimate','Hyperbeam',(charges-1)*0.5 + 1.75,'Single',0,0];
  }
  if(e.ai !== 'random') return e.move;
  const sp = SPECIES[e.species];
  const avail = MOVES[e.species].filter(m=>m[1]!=null && e.level>=m[5] && m[2]!=null);
  if(!avail.length) return e.move;
  return avail[Math.floor(Math.random()*avail.length)];
}

function runEnemyAttack(i){
  const b = ui.battle;
  const mon = activeMon();

  // The active monster went down mid-sequence: stop here, no free swings.
  if(mon.currentHp <= 0){
    /* No tick here. Statuses age in endRound() and nowhere else — this
       leftover from the old two-sided model was a second tick whenever the
       active monster fell mid-sequence. */
    b.attackQueue = null;
    return setTimeout(onMonFainted, 650);
  }
  if(livingEnemies().length === 0){ b.attackQueue = null; return setTimeout(onWaveCleared, 650); }
  if(!b.attackQueue || i >= b.attackQueue.length){
    b.attackQueue = null;
    if(livingEnemies().length===0){ return setTimeout(onWaveCleared,700); }
    if(activeMon() && activeMon().currentHp<=0){ return setTimeout(onMonFainted,700); }
    return setTimeout(advanceTurn, 450);
  }

  const e = b.attackQueue[i];
  if(!e || e.hp <= 0) return runEnemyAttack(i+1);
  b.acted = b.acted || [];
  if(!b.acted.includes(e)) b.acted.push(e);

  /* Your deep freeze: not even a first strike gets through. */
  if(getPStatus(0,'deepFreeze')){
    battleMsg(`🧊 ${SPECIES[e.species].name} is frozen solid!`);
    return setTimeout(()=> runEnemyAttack(i+1), 700);
  }
  /* Vita's light, on the enemy's side, tends its worst-off each time it acts. */
  if(!e._vitaTicked && enemyVitaTick(e)){ e._vitaTicked = true; return setTimeout(()=> runEnemyAttack(i), 800); }
  e._vitaTicked = false;

  /* An Elusive thief spends its turn leaving. Thundercat takes the initiative
     and uses it to bolt before you can act at all. */
  if(isElusive(e)){
    elusiveFlee(e);
    renderStatusBadges();
    return setTimeout(()=>{
      if(livingEnemies().length === 0) return onElusiveFieldEmpty();
      runEnemyAttack(i+1);
    }, 800);
  }

  /* A jammed enemy may seize up — but never twice running. Without this, an
     unlucky streak could keep a monster frozen for a whole fight, which reads
     as a lockout rather than interference. */
  const jammed = getEStatus(e,'disrupt');
  if(jammed && !e._seizedLastTurn && Math.random() < (jammed.stun || 0.15)){
    e._seizedLastTurn = true;
    battleMsg(`📡 ${SPECIES[e.species].name} seizes up — its signals are scrambled!`);
    return setTimeout(()=> runEnemyAttack(i+1), 700);
  }
  e._seizedLastTurn = false;
  // enemy-side Charm: a charmed enemy may lose its turn outright
  const chm = getEStatus(e,'charm');
  if(chm && Math.random() < (chm.chance||0.20)){
    battleMsg(`💗 ${SPECIES[e.species].name} is charmed and can't attack!`);
    return setTimeout(()=> runEnemyAttack(i+1), 700);
  }

  const idx  = b.enemies.indexOf(e);
  /* An arena dummy can be pinned to one slot so a tester can watch a single
     move over and over. */
  /* Removed: a call to initiativeMoveFor(), which never existed as a function.
     It was guarded by b.turnOrder, which the per-monster initiative rewrite
     left permanently null — so short-circuiting meant it never ran and never
     threw. Dead either way, and a live grenade if turnOrder were ever set. */
  let move = enemyMoveFor(e);
  if(e.enraged){
    const dc = (MOVES[e.species]||[]).find(m=>m[1]==='Depth Charge');
    if(dc) move = dc;
  }
  /* Jax's three run scripts, not judgement. Each opens by stacking everything
     it has into one turn, then simply keeps swinging. */
  if(e.ai === 'dragon'){
    const list = MOVES.dragon || [];
    e._t = (e._t||0) + 1;
    if(e._t === 1){                       // Rage is instant: it does not cost the turn
      const rg = list.find(m=>m[6] && m[6].rage);
      if(rg){ rageState(e).forced = true; battleMsg(`🐉 ${SPECIES[e.species].name} works itself into a rage.`); }
    }
    move = list.find(m=>m[0]==='Max') || move;
  }
  if(e.ai === 'tricer'){
    const list = MOVES.tricerarmor || [];
    e._t = (e._t||0) + 1;
    if(e._t === 1){
      const op = list.find(m=>m[6] && m[6].overpower);
      if(op) castOverpower(e, op[6].overpower);
    }
    move = list.find(m=>m[0]==='Max') || move;
  }
  if(e.ai === 'firehound'){
    move = (MOVES.firehound||[]).find(m=>m[0]==='Max') || move;
  }
  /* Thundercat and Loong swing their biggest thing every time. */
  if(e.ai === 'maxer'){
    move = (MOVES[e.species]||[]).find(m=>m[0]==='Max') || move;
  }
  /* A cormorant does one thing. */
  /* The eagle climbs for three turns and then falls on you. */
  if(e.ai === 'stoop'){
    const list = MOVES[e.species] || [];
    const stoop = list.find(m=>m[6] && m[6].stoop);
    const st = stoopState(e);
    if(stoop && st.charges < (stoop[6].stoop.max || 3)) move = stoop;
    else if(stoop) move = stoop;
  }
  if(e.species === 'cormorant'){
    const dv = (MOVES.cormorant||[]).find(m=>m[1]==='Dive');
    if(dv) move = dv;
  }
  /* Caladrius steadies itself once, then simply keeps going. */
  if(e.species === 'caladrius'){
    const list = MOVES.caladrius || [];
    e._vitaCast = e._vitaCast || false;
    move = (!e._vitaCast ? list.find(m=>m[1]==='Vita') : list.find(m=>m[1]==='Conversio')) || move;
    if(move && move[1]==='Vita') e._vitaCast = true;
  }
  /* Its two gifts, turned the other way. These have no damage figure, so they
     must never fall through to the ordinary strike. */
  if(move && move[6] && move[6].vita)      return enemyVita(e, move[6].vita, ()=> runEnemyAttack(i+1));
  if(move && move[6] && move[6].conversio) return enemyConversio(e, move[6].conversio, ()=> runEnemyAttack(i+1));
  if(e.isDummy && e.arenaMove && e.arenaMove !== 'auto'){
    const list = MOVES[e.species] || [];
    const forced = list.find(m=>m[0] === e.arenaMove && m[1] != null);
    if(forced) move = forced;
  }
  const name = SPECIES[e.species].name;

  /* Per-attack rolls: Discombobulate can make this one miss, be countered, or
     land at half; Mirage can make it miss. Both are rolled per attacker now. */
  /* The OLD Discombobulate lived here — a guaranteed halving plus three 10%
     rolls. The rework moved it up into runEnemyAttack as visible friendly fire,
     but this block was never removed, so both were firing at once: the swing
     turned on its own side AND the survivors were being halved and made to
     miss. Gone. */
  let disHalve=false, disMiss=false, disCounter=false, disSoften=0;
  const mir = getPStatus(0,'mirage');
  const cl  = getPStatus(0,'clones');
  const dotMiss = getEStatus(e,'dot');
  /* Every evasion source rolls separately and stacks multiplicatively. */
  let evadeChance = 0;
  const tac = getPStatus(0,'tachy');
  const mirChance = mir
    ? ((mir.window && mir.step < mir.window.length) ? mir.window[mir.step] : (mir.chance||0.20))
    : 0;
  const sources = [
    stanceEvasion(mon),
    mirChance,
    cl ? (cl.evade||0) : 0,
    (dotMiss && dotMiss.rider==='miss') ? (dotMiss.miss||0) : 0,
    tac ? (tac.fresh ? tac.evadeFirst : tac.evadeAfter) : 0,
  ].filter(x=>x>0);
  if(sources.length){
    let hitChance = 1;
    sources.forEach(x=>{ hitChance *= (1-x); });
    evadeChance = 1 - hitChance;
  }
  /* Asleep: it does nothing at all, and wakes a turn later. */
  const nap = getEStatus(e,'asleep');
  if(nap){
    nap.turnsLeft--;
    if(nap.turnsLeft <= 0) removeEStatus(e,'asleep');
    renderStatusBadges();
    const el = document.getElementById('enemy-'+ui.battle.enemies.indexOf(e));
    if(el) el.classList.add('is-asleep');
    battleMsg(`💤 ${SPECIES[e.species].name} is fast asleep.`);
    return setTimeout(()=> runEnemyAttack(i+1), 900);
  }
  /* Muddled this turn: the badge says so, and the swing turns on its own side —
     on ITSELF if it is the only one left. Who is muddled was decided at the
     start of the round, so nothing is hidden from the child. */
  if(getEStatus(e,'discombobulate')) return confusedStrike(e, ()=> runEnemyAttack(i+1));
  /* Every damaging move an enemy ATTEMPTS is remembered — once per move,
     landed or not. */
  noteWrath();
  /* A turn of Haunting Aria covers the whole FIELD, so whoever stands in it is
     untouchable; and if the Whalelord is struck with no Aria running, he sings
     by reflex and the blow finds nothing where he was. */
  /* A Counter stack reads the whole attack — every hit of it — and is spent.
     Only ever during an action phase; pre-hits and end-phase damage cannot
     waste one. */
  /* A Counter stack braces against the WHOLE attack — however many hits it
     carries — and turns away four fifths of it. The blow still lands, which is
     what makes the Enrage feel earned. */
  const defender1 = activeMon();
  let counterMult = 1;
  if(defender1 && counterStacks() > 0){
    counterMult = spendCounterStack(defender1);
    if(counterMult < 1){
      counterDrift(document.getElementById('playerBob'), document.getElementById('playerBob'));
      floatMiss('playerBob', 'GUARD');
    }
  }
  const ariaCover = ariaFieldEvasion() > 0;
  const d0 = activeMon();
  const canReflex = !ariaCover && d0 && !ariaActive()
                 && (MOVES[d0.species]||[]).some(m=>m[6] && m[6].aria);
  if(ariaCover || (canReflex && ariaReflex(d0))){
    dodgePlayer(); floatMiss('playerBob', 'MISS');
    if(ariaCover) battleMsg('👻 The aria is still in the water — nothing lands.');
    return setTimeout(()=> runEnemyAttack(i+1), 800);
  }
  /* Same reasoning as the bonus action: if Tachypsychia is about to expire and
     has never once caused a miss, make this one miss. */
  const tacLast = tac && (tac.turnsLeft||0) <= 1 && !tac.evadedOnce;
  const evaded = disMiss || tacLast || (evadeChance>0 && Math.random() < evadeChance);
  // the window advances once per ROUND, handled at round end
  if(evaded && tac) tac.evadedOnce = true;

  bob(document.getElementById('enemyBob-'+idx), -1);
  battleMsg(`${name} used ${move[1]}!`);

  if(evaded){
    setTimeout(()=>{
      dodgePlayer();
      floatMiss('playerBob', 'MISS');
      noteMirageDodge();          // every evaded blow leaves a copy standing
      battleMsg(disMiss ? `🌀 ${name} is confused — the attack went wide!`
               : (tac ? `⚡ Lightning reflexes — ${name} missed!`
                      : `💨 The mirage shimmers — ${name} missed!`));
      setTimeout(()=> runEnemyAttack(i+1), 700);
    }, 300);
    return;
  }

  // a charging turn does no damage at all
  if(move[0] === 'Charge'){
    playEffect(move[1], { type:'Water', duration:700 });
    setTimeout(()=>{
      battleMsg(`⚡ ${name} gathers power… (${e.chargeTurns}/3)`);
      setTimeout(()=> runEnemyAttack(i+1), 900);
    }, 400);
    return;
  }

  playEffect(move[1], { type: e.types[0], at:'playerBob' });

  setTimeout(()=>{
    const ex = move[6] || {};
    let dmg;
    if(ex.reflect){
      /* Seoi Nage / Four Ounces in ENEMY hands: the exact figure it last took,
         guard absorption included. computeDamage would have been handed a null
         multiplier and returned nothing at all. */
      dmg = Math.ceil((e.lastDamageTaken || 0) * ex.reflect);
      if(dmg <= 0){
        battleMsg(`${SPECIES[e.species].name} tried ${move[1]} — but there was nothing to give back.`);
        return setTimeout(()=> runEnemyAttack(i+1), 800);
      }
      battleMsg(`↩️ ${SPECIES[e.species].name} returns your own force — ${dmg}!`);
    } else if(ex.grudge){
      dmg = Math.ceil((ex.grudge.flat||0.25) * e.atk
                    + (ex.grudge.missing||0.75) * Math.max(0, e.maxHp - e.hp));
    } else {
      /* `split` means the multiplier is the TOTAL, shared across the strikes —
         Verdant Wrath Max is 1.8 over three hits, not 1.8 three times. Without
         this the Forest Fairy would hit for 5.4× its ATK. */
      const per = (ex.hits > 1 && ex.split) ? move[2] / ex.hits : move[2];
      dmg = computeDamage(per, e.atk, e, monRef(mon), false);
      // a guard it pulled off earlier makes this swing heavier
      if(e.comboStacks){
        dmg = Math.ceil(dmg * (1 + e.comboStacks * 0.25));
        e.comboStacks = 0;
      }
      /* Rage: a free 20% critical, or a bought certainty. */
      const rm = rageMultiplier(e);
      if(rm !== 1) dmg = Math.ceil(dmg * rm);
      /* Overpower: +25% outright, and a quarter again on anything smaller. */
      const op = overpowerOf(e);
      if(op){
        dmg = Math.ceil(dmg * (1 + op.atk));
        if(monAtk(mon) < e.atk) dmg = Math.ceil(dmg * op.bully);
      }
    }
    if(ex.fullHpDouble && e.hp >= e.maxHp){
      dmg = Math.ceil(dmg * 2);
      battleMsg(`${SPECIES[e.species].name} is untouched — the blow lands at full force!`);
    }
    if(counterMult < 1) dmg = Math.ceil(dmg * counterMult);   // taken on the guard
    if(disHalve)  dmg = Math.ceil(dmg*0.5);
    if(disSoften) dmg = Math.ceil(dmg*(1-disSoften));

    const spikes = getPStatus(0,'spikeArmour');
    let msg = '';

    /* An enemy's multi-hit move now actually strikes that many times. It only
       ever landed once, so a Verdant Wrath Max was dealing a third of its
       designed damage and Volt Concussion a quarter. The Counter guard covers
       the WHOLE attack (it was already applied above), and block is spent per
       strike, exactly as it is when the player swings. */
    const hitCount = Math.max(1, (ex.hits && !ex.reflect && !ex.grudge) ? ex.hits : 1);
    {
      const oldHp = mon.currentHp;
      let totalBlocked = 0, totalTaken = 0;
      for(let k = 0; k < hitCount; k++){
        if(mon.currentHp <= 0 && !ui.battle.allyUnkillable) break;
        let thisHit = dmg;
        const beforeBlock = thisHit;
        thisHit = applyBlock(mon, thisHit, 'playerBlk');   // one stack per strike
        totalBlocked += beforeBlock - thisHit;
        mon.lastDamageTaken = beforeBlock;   // reflection returns the FULL figure
        const floor = ui.battle.allyUnkillable ? 1 : 0;
        mon.currentHp = Math.max(floor, mon.currentHp - thisHit);
        totalTaken += thisHit;
      }
      const ar = ariaState();
      if(ar) ar.struck = true;                // the dead whale takes note
      if(totalBlocked > 0) msg = `🛡 Blocked ${totalBlocked}! ` + msg;
      if(ui.battle.arenaImmortal && mon.currentHp <= 0){
        mon.currentHp = monMaxHp(mon);          // back to full, test continues
        msg += ' (immortal — restored)';
      }
      flashHit($('#playerBob'));
      showDamageNumber('playerBob', oldHp - mon.currentHp);
      playSfx('hit_taken');
      drainHp('playerHp', oldHp, mon.currentHp, monMaxHp(mon));
      msg = hitCount > 1
        ? `${name} struck ${hitCount} times for ${totalTaken} damage!`
        : `${name} dealt ${totalTaken} damage!`;

      const shell = getPStatus(0,'shell');
      if(shell && shell.thorns && mon.currentHp>0){
        const back = Math.ceil(shell.thorns * monAtk(mon));
        const oh=e.hp, nh=Math.max(0,e.hp-back);
        e.hp = nh;
        flashHit(document.getElementById('enemy-'+idx));
        drainHp('enemyHp-'+idx, oh, nh, e.maxHp);
        if(nh<=0){ const el=document.getElementById('enemy-'+idx); if(el) el.classList.add('fainted'); }
        msg += ` Molten slag burned back for ${back}!`;
      }
      if(spikes && mon.currentHp>0){
        const back = Math.ceil((spikes.thorns||0.20)*monAtk(mon));
        const oh=e.hp, nh=Math.max(0,e.hp-back);
        e.hp = nh;
        flashHit(document.getElementById('enemy-'+idx));
        drainHp('enemyHp-'+idx, oh, nh, e.maxHp);
        if(nh<=0){ const el=document.getElementById('enemy-'+idx); if(el) el.classList.add('fainted'); }
        msg += ` Spikes struck back for ${back}!`;
      }
    }

    // Life-stealing moves restore the attacker from its own ATK
    /* Enemy-cast Charm / Disrupt land on the player's side of the field. */
    if(move[1] === 'Charm'){
      if(enemyStatusBlocked('charmed')){ msg += ' The diamond dust scatters the charm.'; }
      else { setPStatus(0, { type:'charmed', turnsLeft:6, chance:0.20 }); msg += ' Your team is charmed!'; }
      renderStatusBadges();
    }
    if(move[1] === 'Disrupt'){
      /* A DEBUFF on the player's side: their signals are jammed, so every one
         of your monsters loses an initiative point. Killing the Magnet before
         it acts is the counter. */
      if(enemyStatusBlocked('disrupt')){ msg += ' The diamond dust holds your signal clear.'; }
      else {
        const dpct = (move[6] && move[6].disrupt && move[6].disrupt.stun) || 0.15;
        setPStatus(0, { type:'disrupt', turnsLeft:5, stun:dpct });
        msg += ' Your signals are jammed — they move first, and you may seize up!';
      }
      renderStatusBadges();
    }
    /* Fiery Jaws: it takes hold, and what it has hold of does not leave. */
    if(move[6] && move[6].jaws){
      ui.battle.noFlee = true;
      setPStatus(0, { type:'jaws', turnsLeft:3 });
      livingEnemies().forEach(x=>{ if(x.elusive) pinDown(x); });   // dispel first
      renderStatusBadges();
      setTimeout(()=> battleMsg(`🔥 ${SPECIES[e.species].name} has hold of you — no switching, no running.`), 600);
    }
    /* Piercing Stoop: climb, or fall. Nothing intervenes on the way down. */
    const stp = move[6] && move[6].stoop;
    if(stp){
      const st = stoopState(e);
      if(st.charges < (stp.max || 3)){
        const n = stoopCharge(e, stp);
        renderStatusBadges();
        battleMsg(`🦅 ${SPECIES[e.species].name} climbs — <b>${n}</b> of ${stp.max}. It is much harder to see up there.`);
        return setTimeout(()=> runEnemyAttack(i+1), 900);
      }
      const rel = stoopRelease(e, stp);
      const before = mon.currentHp;
      mon.currentHp = Math.max(ui.battle.allyUnkillable ? 1 : 0, mon.currentHp - rel.hits);
      flashHit($('#playerBob'));
      showDamageNumber('playerBob', before - mon.currentHp);
      drainHp('playerHp', before, mon.currentHp, monMaxHp(mon));
      playSfx('hit_taken');
      battleMsg(`🦅 <b>PIERCING STOOP</b> — it comes down out of the sun. ` +
                `<b>${before - mon.currentHp}</b> health simply gone. Nothing stops it.`);
      renderStatusBadges();
      return setTimeout(()=>{
        if(mon.currentHp <= 0) return setTimeout(onMonFainted, 650);
        runEnemyAttack(i+1);
      }, 1000);
    }
    /* Lunacy is Discombobulate wearing a different hat — one turn of certain
       friendly fire at full power. Reusing the field means the animation, the
       self-targeting and the messages all come for free. */
    /* A quarter of its dives come up with something worth eating. */
    const fish = move[6] && move[6].fish;
    if(fish && Math.random() < fish.chance){
      const back = Math.ceil(fish.heal * e.maxHp);
      const before = e.hp;
      e.hp = Math.min(e.maxHp, e.hp + back);
      drainHp('enemyHp-'+idx, before, e.hp, e.maxHp);
      setTimeout(()=> battleMsg(`🐟 ${SPECIES[e.species].name} surfaces with a fish and swallows it whole — <b>+${e.hp-before} HP</b>.`), 700);
    }
    const lun = move[6] && move[6].lunacy;
    if(lun && Math.random() < lun.chance){
      livingEnemies().forEach(x=> markConfused(x, lun.ffPower || 1.0));
      renderStatusBadges();
      msg += ' The moonlight gets into their heads!';
    }
    /* Sky Splitter Max leaves them reeling: their next move may land soft. */
    const sf = move[6] && move[6].softenHit;
    if(sf && Math.random() < sf.chance){
      if(enemyStatusBlocked('softened')){ msg += ' The diamond dust holds your strength intact.'; }
      else { setPStatus(0, { type:'softened', turnsLeft:2, amount:sf.amount }); msg += ' Your next attack is weakened!'; }
      renderStatusBadges();
    }
    const pct = LIFESTEAL[move[1]];
    if(pct && e.hp>0){
      const before = e.hp;
      e.hp = Math.min(e.maxHp, e.hp + Math.ceil(pct*e.atk));
      if(e.hp>before){
        drainHp('enemyHp-'+idx, before, e.hp, e.maxHp);
        msg += ` ${name} drained ${e.hp-before} HP!`;
      }
    }

    // arena convenience
    if(b.autoHeal && mon.currentHp>0 && mon.currentHp<monMaxHp(mon)){
      const max = monMaxHp(mon), was = mon.currentHp;
      mon.currentHp = max;
      drainHp('playerHp', was, max, max);
      msg += ' (auto-healed)';
    }

    saveProfile();
    renderStatusBadges();
    logBattle(`${name} → ${msg}`);
    battleMsg(msg);

    if(b.scriptedOneTurn){
      // One blow and the scene is over — no second attacker, no switch prompt.
      b.attackQueue = null;
      return setTimeout(()=>{ if(b.scriptedLoss==='monkey') onMonkeyResolved(); }, 1100);
    }
    setTimeout(()=> runEnemyAttack(i+1), 850);
  }, 330);
}

/* Everything left the field. If nothing was actually beaten there is no XP and
   nothing to catch — the encounter simply ends. If something WAS beaten, the
   fight counts as won and only that monster can be caught. */
function onElusiveFieldEmpty(){
  const b = ui.battle;
  if(!b) return;
  const beaten = (b.enemies||[]).filter(e=>e.hp<=0 && !e.fled);
  if(beaten.length) return onWaveCleared();
  b.phase = 'resolving';
  renderBattle();
  setTimeout(()=>{
    stopMusic();
    challengeResult('💨', 'They got away',
      `Every one of them slipped off into the pipework with what it came for.<br><br>` +
      `<i>Nothing caught, nothing learned. Strike faster next time — or pin one down ` +
      `with <b>Magma Goo</b>.</i>`,
      (ui.currentZone && ui.currentZone.id === 'plant_generator') ? 'generator' : 'explore');
  }, 700);
}

/* The enemy side has finished its slice of the round. All the per-turn upkeep
   that used to live here (stance decay, charge window, Discombobulate's
   window) belongs to the END of the round, so it now happens in endRound().
   This function only hands control on. */
function endEnemyRound(){
  const b = ui.battle;
  if(!b) return;
  b.attackQueue = null;
  if(livingEnemies().length===0){ setTimeout(onWaveCleared,700); return; }
  if(activeMon() && activeMon().currentHp<=0){ setTimeout(onMonFainted,700); return; }
  setTimeout(advanceTurn, 500);
}

function onMonFainted(){
  const c = chargeState();
  if(c && activeMon() && c.uid === activeMon().uid) triggerDragonLegacy();
  const alive=battleParty().filter(m=>m.currentHp>0);
  if(alive.length===0){ return onPlayerDefeated(); }
  battleMsg(`${displayName(activeMon())} fainted!`);
  const options=state.party.map((m,i)=>({m,i})).filter(o=>o.m.currentHp>0 && !isPassenger(o.m));
  monsterChooser('Send out…', options, (i)=>{
    ui.battle.activeIndex=i; ui.battle.switchedThisTurn=false;
    const nm = state.party[i];
    if(nm && !nm._entered){ nm._entered = true; applyEntryPassives(nm, nm.species, nm.level, monAtk(nm)); }

    if(livingEnemies().length===0){ renderBattle(); return setTimeout(()=>onWaveCleared(), 500); }

    /* The replacement steps into the round already under way. Whether it acts
       now depends on whose slice we are in, so resume the order rather than
       guessing. Note the phase is set before painting — rendering first left
       the buttons greyed with nothing to re-render them. */
    /* The replacement steps into the round already under way and INHERITS the
       fallen monster's slot. Without this, chain-fainting would hand the player
       a fresh action every time. */
    const b2 = ui.battle;
    const row = (b2.order||[]).find(r=>r.side==='player');
    if(row){ row.mon = state.party[i]; }
    if(row && row.acted){
      b2.phase = 'resolving';
      renderBattle();
      return setTimeout(advanceTurn, 700);
    }
    ui.battle.phase='player';
    renderBattle();
    battleMsg('Choose a move.');
  }, false);
}
function onPlayerDefeated(){
  if(ui.battle && ui.battle.guardianTrial) return onGuardianTrialResolved();
  if(ui.battle && ui.battle.scriptedLoss==='padrino'){ restoreRealParty(); return onPadrinoResolved(); }
  if(ui.battle && ui.battle.scriptedLoss==='monkey'){ return onMonkeyResolved(); }
  playSfx('defeat'); stopMusic();
  const breakAfterLoss = tallyBattleForEyeBreak();
  const fade=document.createElement('div');
  fade.style.cssText='position:fixed;inset:0;background:#000;z-index:80;opacity:0;transition:opacity .8s;';
  document.body.appendChild(fade);
  requestAnimationFrame(()=>{ fade.style.opacity='1'; });
  setTimeout(async ()=>{
    battleParty().forEach(m=>{ m.currentHp=Math.max(1,Math.floor(monMaxHp(m)*0.10)); m.xpFights=0; });
    await saveProfile();
    go('region');
    fade.style.opacity='0';
    setTimeout(()=>document.body.removeChild(fade),800);
    toast('Your team fainted. They recovered a little.');
    if(breakAfterLoss) showEyeBreak();
  },1000);
}
