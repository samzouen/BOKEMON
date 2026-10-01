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
function battleMsg(t){ ui._battleActivity = Date.now(); const el=$('#battleMsg'); if(el) el.innerHTML = t; }

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
/* Sum a hit list so a 7-strike Ultra reports one number, not seven — and what
   their block soaked, in blue beneath it, so a small number explains itself. */
function reportHits(hits){
  const byAnchor = {}, soaked = {};
  (hits||[]).forEach(h=>{
    if(!h) return;
    const id = (h.idx!=null && h.idx>=0) ? 'enemy-'+h.idx : pid('playerBob');
    byAnchor[id] = (byAnchor[id]||0) + (h.dmg||0);
    if(h.blocked > 0) soaked[id] = (soaked[id]||0) + h.blocked;
  });
  Object.entries(byAnchor).forEach(([id,total])=> showDamageNumber(id, total));
  Object.entries(soaked).forEach(([id,n])=> floatBlocked(id, n));
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
    const outComp = companionOnField();
    /* stored power passes on — the dragon's own, or a companion dragon's that
       goes back into its core with its leader */
    if(c && (c.uid === leaderMon().uid || (outComp && c.uid === outComp.uid))) triggerDragonLegacy();
    const outgoing = leaderMon();
    const extra = !!(ui.battle.control && ui.battle.control.extra);
    ui.battle.activeIndex=i; ui.battle.switchedThisTurn=true;
    carryBlockOnSwitch(outgoing, leaderMon());   // the shield walks with your side
    ui.battle.phase = 'player';        // a free switch never hands the turn over
    /* Entry passives fire on a swap as well as on the opening monster — a
       Dragon Dance + carrier brought in mid-fight takes the initiative at once,
       and a Steel Aegis carrier arrives already holding block. */
    const inc = leaderMon();
    if(inc && !inc._entered){ inc._entered = true; applyEntryPassives(inc, inc.species, inc.level, monAtk(inc)); }
    else if(inc) applyStonePassives(inc);
    /* The pair changes with its leader (2.84): the companion that was out goes
       back with its leader, its turns frozen; the newcomer's comes back out if
       it was out, with its own place in this round. The choice is still yours. */
    pairSwitched(outgoing);
    setFocus(null);
    ui.battle.control = { mode:'solo', uid:inc.uid, extra };
    renderBattle();
    /* Bringing the Whalelord back discharges everything he is owed — free, and
     it does not cost the turn the switch already gave you. */
    const back = leaderMon();
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
  if(ui.battle.coreSpar) return coreSparEnded('left');        // giving up a spar (2.86)
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
  /* Out of a fight in the catacombs: back into the dark where it found you. */
  if(zid === 'catacombs' && !ui.battle.isNpc && ui.returnDeck && typeof r5AfterWild === 'function') return r5AfterWild();
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
  /* Whatever opened this turn, with no one left to fight it is the wave's end. */
  if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 300);
  if(ui.battle.legacyBonus) ui.battle.legacyUsed = true;   // this is Dragon Legacy's turn
  const mon = controlMon();                  // whose buttons these are
  setFocus(mon);
  const mv=unlockedMoves(mon)[moveIdx];
  /* One action begins: what it sets off afterwards (Cunning, Greed, a riposte)
     happens once for the whole of it, and belongs to whoever took it. */
  ui.battle.actionSeq = (ui.battle.actionSeq || 0) + 1;
  ui.battle.actionMon = mon;
  ui.battle.actionDodges = [];
  /* A wound-up move comes down for free; choosing anything else lets it go. */
  if(mon && mon._windup && !(mv && mv.windupReady)) mon._windup = null;
  /* A companion's move (2.85): its turn's 8 words, whatever the move. */
  if(mv && isCompanionMon(mon)){
    if(mv.locked){ ui.battle.phase='player'; toast('Not while the Cataclysm is building.'); return; }
    return companionChoose(mon, mv);
  }
  if(mv && mv.windupReady){
    if(mv.target === 'Single' && livingEnemies().length > 1) return promptTarget(mv, t=> resolveBattleMove(mv, t, [], { noQuiz:true }));
    return resolveBattleMove(mv, mv.target === 'Single' ? livingEnemies()[0] : null, [], { noQuiz:true });
  }
  if(mv && mv.scripted) return resolveScriptedMove(mv, mon);
  if(mv && mv.locked){ ui.battle.phase='player'; toast('Not while the Cataclysm is building.'); return; }
  /* A second Aria over the first would be words spent on nothing. */
  if(mv && mv.aria && ariaActive()){ ui.battle.phase='player'; toast('Haunting Aria is still active.'); return; }
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
  /* Their Steel Soul (2.90): a single blow can only go to the one that cast it. */
  const guard = mv.target === 'Single' ? soulGuardian('enemy') : null;
  if(guard){
    battleMsg(`🛡 ${SPECIES[guard.species].name}'s Steel Soul draws your blow — every single blow must go through it.`);
    (onPick||(t=>runMoveQuiz(mv,t)))(guard);
    return;
  }
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
/* ============================================================
   A COMPANION'S TURN (2.85 — handover/07-COMPANIONS.md)
   At its own place in the order a companion chooses any of its own moves,
   and its turn costs 8 words (COMPANION.turnWords) whatever the move: all 8,
   or the whole turn fails. Only a move's extras still ask for words — the
   tail of a move that grows with extra words, in the same quiz (Incinerate
   Max: 8, and up to 7 more for its 2.75×) — and its bonus rounds, as always.
   A quick move (a Very High stone) leaves the turn open, and the next move
   that turn is already paid for (control.paid); an extra action
   (Tachypsychia) is a turn of its own. Moves that are free for the party —
   a wound-up blow coming down, charges being spent — are still a turn, and
   still its 8 words.
   ============================================================ */
function companionChoose(mon, mv){
  if(mv.revitalise) return chooseRevival(mv, mon, m=>{ mv.reviveUid = m.uid; companionAct(mon, mv, null); });
  const many = livingEnemies().length;
  /* aimed as the leader's are: a single target (or a status that needs one)
     is chosen with 2+ enemies, a twin blow's first with 3+ */
  const single = mv.target === 'Single' || (mv.target === 'Status' && STATUS_NEEDS_TARGET.includes(mv.stoneType));
  if(single && many > 1) return promptTarget(mv, t=> companionAct(mon, mv, t));
  if(mv.target === 'Multi2' && many > 2) return promptTarget(mv, t=> companionAct(mon, mv, t));
  companionAct(mon, mv, (single || mv.target === 'Multi2') ? livingEnemies()[0] : null);
}
function companionAct(mon, mv, target){
  const b = ui.battle;
  const ctl = b.control;
  const fee = (ctl && ctl.paid) ? 0 : COMPANION.turnWords;
  const tail = companionTail(mv);
  const need = fee + tail;
  if(need <= 0) return companionFire(mon, mv, target, mv.words);   // paid for already, nothing more to write
  const carry = b.wordCarry || 0;
  const name = displayName(mon);
  startQuiz({
    title: mv.name,
    subtitle: fee
      ? `🤝 ${name}'s turn · write ${fee} words for any move${tail ? ` — keep going for up to ${mv.scale.max}×!` : ''}`
      : `🤝 This turn is paid for — up to ${tail} more words for up to ${mv.scale.max}×`,
    words: pickWords(Math.max(0, need - carry)), stopAtFirstMiss:true, lockExit:true,
    wordTarget: need,
    stopAt: tail ? Math.max(1, fee) : 0,     // a growing move may stop once the turn is paid
    startingWords: carry,
    onComplete:(results)=> companionWritten(mon, mv, target, fee, tail, results),
    onExit:()=>{ go('battle'); },
  });
}
function companionWritten(mon, mv, target, fee, tail, results){
  const b = ui.battle;
  go('battle');
  if(!b) return;
  results.filter(r=>!r.passed).forEach(r=>{ if(!b.fightMistakes.includes(r.text)) b.fightMistakes.push(r.text); });
  const carry = (ui.quiz && ui.quiz.config ? (ui.quiz.config.startingWords||0) : 0);
  const correct = results.filter(r=>r.passed).reduce((n,r)=>n+(r.words||countWords(r.text)),0) + carry;
  /* words past the turn's 8 roll into the next move, as words past any move's do */
  b.wordCarry = Math.max(0, ((ui.quiz && ui.quiz.wordsDone) || 0) - fee);
  const written = results.reduce((n,r)=>n+(r.words||countWords(r.text)),0);
  if(feedRecharge(written)) setTimeout(()=>{ battleMsg('⚡ Second wind! Very High and Ultra moves restored.'); renderBattle(); }, 1500);
  if(correct < fee){
    playSfx('move_miss');
    battleMsg(`${displayName(mon)}'s turn fails! (${correct}/${fee} words)`);
    logBattle(`${displayName(mon)} (companion) — turn failed, ${correct}/${fee} words`);
    return setTimeout(advanceTurn, 900);
  }
  if(b.control && b.control.uid === mon.uid) b.control.paid = true;
  /* its move lands as if its own words were written — and as far up its tail
     as the words past the 8 reach */
  companionFire(mon, mv, target, mv.words + Math.min(tail, Math.max(0, correct - fee)));
}
function companionFire(mon, mv, target, correct){
  setFocus(mon);
  if(mv.windupReady) return resolveBattleMove(mv, target, [], { noQuiz:true });
  if(mv.chargeSpend) return resolveChargeSpend(mv, mon, target);
  if(mv.charge || mv.chargeMore) return applyChargeResult(mv, mon, correct);
  return resolveBattleMove(mv, target, [], { pre:{ correct } });
}
/* "(8/15 words)": a move's own count in a message, unless something set
   another for it (ui.battle._wordsTag). */
function wordsTag(correct, mv){ return (ui.battle && ui.battle._wordsTag) || `${correct}/${mv.words}`; }
/* ---------- SUMMONING (2.84) ----------
   Four words, and the turn stays yours. The companion comes out beside its
   leader for the turns it has left (five a fight; the recharge meter gives
   them back), and takes its place in this round's order — so it has a turn
   of its own this round. */
function onSummonPressed(){
  const b = ui.battle;
  if(!b || (b.phase || 'player') !== 'player') return;
  if(summonBlock()) return;
  const leader = leaderMon(), comp = companionOf(leader), p = pairOf(leader);
  b.phase = 'resolving';
  const need = COMPANION.summonWords;
  startQuiz({
    title: `Summon ${displayName(comp)}`,
    subtitle: `${displayName(leader)} shares its core — write ${need} words${revisionWords().length ? ' you have learned to silver or gold' : ''}. The turn stays yours.`,
    words: pickWords(need, true), stopAtFirstMiss:true, lockExit:true,
    wordTarget: need,
    onComplete:(results)=>{
      go('battle');
      results.filter(r=>!r.passed).forEach(r=>{ if(!b.fightMistakes.includes(r.text)) b.fightMistakes.push(r.text); });
      const got = results.filter(r=>r.passed).reduce((n,r)=>n+(r.words||countWords(r.text)),0);
      if(feedRecharge(results.reduce((n,r)=>n+(r.words||countWords(r.text)),0)))
        setTimeout(()=>{ battleMsg('⚡ Second wind! Very High and Ultra moves restored.'); renderBattle(); }, 1500);
      b.phase = 'player';
      if(got < need){
        playSfx('move_miss');
        renderBattle();
        battleMsg(`The core flickers — ${escapeHtml(displayName(comp))} doesn't come. (${got}/${need} words) It is still your turn.`);
        return;
      }
      summonCompanion(leader, comp, p);
      renderBattle();
      battleMsg(`🤝 ${escapeHtml(displayName(comp))} steps out beside ${escapeHtml(displayName(leader))} — ${p.turnsLeft} turn${p.turnsLeft === 1 ? '' : 's'}!`);
    },
    onExit:()=>{ go('battle'); if(ui.battle){ ui.battle.phase = 'player'; renderBattle(); } },
  });
}
function summonCompanion(leader, comp, p){
  const b = ui.battle;
  p.out = true;
  b.summons = (b.summons || 0) + 1;
  playSfx('stone_veryhigh');
  /* it arrives as any monster of yours does: its passives, a refined stone's */
  if(!comp._entered){ comp._entered = true; applyEntryPassives(comp, comp.species, comp.level, monAtk(comp)); }
  else applyStonePassives(comp);
  insertCompanionRow(comp);
}

/* Supply enough phrases to satisfy a WORD target. Shortest entries are 2
   characters, so ceil(target/2) phrases always suffices; a few spares are added
   so the quiz never runs dry if a miss shortens the run. */
/* Draw phrases until their COMBINED character count clears the target, with a
   buffer on top — not a fixed phrase count. The old heuristic assumed ~2
   characters per phrase; a list of single-character phrases (or very long
   ones) broke that assumption and could run the quiz dry before the target
   was reached, which read as the move "fizzling out" mid-fight. */
/* `revision`: draw from the phrases learned to silver or gold instead
   (revisionPool, 2.89) — a summoning always does, and so does every quiz in a
   spar with the Monkey King. */
function pickWords(wordTarget, revision){
  const pool = (revision || (ui.battle && ui.battle.coreSpar)) ? revisionPool() : activePool().map(w=>w.text);
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
  const living = healableAllies().filter(m=>m.currentHp > 0);
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
  /* Overheat raises damage taken, recoil included — by what YOUR Overheat
     says it costs (1.5×, 1.3× at +, 1.1× at ✦), not a flat 1.5×. */
  const oh = getPStatus(0,'overheat');
  if(oh) dmg *= (oh.take || 1.5);
  dmg = Math.ceil(dmg);
  const before = mon.currentHp;
  mon.currentHp = Math.max(0, mon.currentHp - dmg);
  flashHit($('#' + pid('playerBob')));
  drainHp(pid('playerHp'), before, mon.currentHp, monMaxHp(mon));
  logBattle(`${mv.name} recoil: ${displayName(mon)} took ${dmg} self-damage`);
  return dmg;
}

/* How many words a scaling move asks for: until the cap — or exactly
   `scale.words`, whose last word lifts it to the cap. */
function scaleCeilWords(mv){
  if(!mv.scale) return mv.words;
  if(mv.scale.words) return mv.scale.words;
  return mv.words + Math.ceil((mv.scale.max - mv.mult) / mv.scale.per);
}
function scaledFactor(mv, correct){
  if(mv.scale.words && correct >= mv.scale.words) return mv.scale.max;
  return Math.min(mv.scale.max, mv.mult + mv.scale.per*(correct - mv.words));
}
function runMoveQuiz(mv, target){
  const carry = ui.battle ? (ui.battle.wordCarry||0) : 0;
  // A scaling move keeps going past its requirement, gaining power each word,
  // until the player slips or the cap is reached.
  const ceilWords = scaleCeilWords(mv);
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
  /* …and gives every companion back its turns (2.84) — not one that fell.
     Theirs too (2.87): one meter, both sides' companions. */
  Object.values(b.pairs || {}).forEach(p=>{ if(!p.fallen) p.turnsLeft = COMPANION.turns; });
  if(b.foePair && !b.foePair.fallen && b.foePair.mon.hp > 0) b.foePair.turnsLeft = COMPANION.turns;
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
      if(correct >= mv.words && ui.battle) ui.battle.wordCarry = Math.max(0, correct - mv.words);
      applyChargeResult(mv, mon, correct, def);
    },
    onExit:()=>{ go('battle'); },
  });
}
/* A charging turn's words are in (its own quiz, or a pair's): power gathers,
   and the turn passes. */
function applyChargeResult(mv, mon, correct, def){
  def = def || mv.charge || (chargeState() && chargeState().def);
  if(correct < mv.words){
    battleMsg(`${mv.name} fizzled out! (${wordsTag(correct, mv)} words)`);
    playSfx('move_miss');
    return setTimeout(advanceTurn, 900);
  }
  /* Overcharge up: its own repeat chance makes this charge count double —
     and a charge is what spends its first rate (a fizzled one does not). */
  const surge = Math.random() < overchargeChance();
  spendOverchargeFirst(getPStatus(0,'overcharge'));
  const gained = startCharge(mon, def, surge);
  const c = chargeState();
  playEffect(mv.name, { type:'Water', duration:800 });
  const held = `${c.charges} charge${c.charges>1?'s':''} held`;
  battleMsg(gained >= 2 ? `⚡ Overcharge surges — two charges at once! ${held}` +
                            (c.charges > c.def.max ? ', beyond the usual limit!' : '.') + ' The turn passes.'
          : `⚡ Power gathers… ${held}. The turn passes.`);
  logBattle(`${displayName(mon)} charged — ${c.charges}/${c.def.max}, window ${c.turnsLeft} turns`);
  renderBattle();
  setTimeout(advanceTurn, 1100);
}

/* Spending the charge — no words needed, the price was paid to build it. */
function resolveChargeSpend(mv, mon, target){
  const b = ui.battle;
  const c = chargeState();
  if(!c) { b.phase='player'; return renderBattle(); }
  const atk = monAtk(mon);
  /* (a pair's Hyperbeam goes where the pair's move goes — 2.84) */
  const targets = mv.target==='AOE' ? livingEnemies() : [(target && target.hp > 0) ? target : livingEnemies()[0]];
  if(!targets[0]){ b.phase='player'; return renderBattle(); }

  breakCover(mon);
  const hits = targets.filter(Boolean).map(t=>{
    const idx = b.enemies.indexOf(t);
    if(rollDodge(t, idx, 400)) return { t, idx, dmg:0, oldHp:t.hp, newHp:t.hp, dodged:true };
    const dmg = enemyGuard(t, computeDamage(mv.mult, atk, monRef(mon), t, true));
    return { t, idx, dmg, oldHp:t.hp, newHp:Math.max(0,t.hp-dmg) };
  });
  battleMsg(`${mv.name}! (${c.charges} charge${c.charges>1?'s':''}, ${mv.mult.toFixed(2)}× ATK)`);
  bob($('#' + pid('playerBob')), +1);
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
  askBonusRound(mv, mon, won=>{
    b._bonusResolved = true;
    applyBonusWin(mv, won);
    const orig = b._bonusOriginal || [];
    b._bonusOriginal = null;
    resolveBattleMove(mv, hits[0] ? hits[0].t : null, orig);
  });
}
/* What winning a bonus round gives (split out of offerBonusRound in 2.84):
     Rampage Max — a standing Aftershock (Steel Soul's bonus locked in now);
     the Sacred Flame phoenix — a Sacred Flame;
     Heavensplitter — its multiplier on this blow. */
function applyBonusWin(mv, won){
  const b = ui.battle;
  if(!b || !mv.bonus) return;
  if(mv.bonus.aftershock){ if(won) layAftershock(activeMon(), null, false); }
  else if(mv.bonus.sacredFlame){ if(won) laySacredFlame(activeMon(), false); }
  else b.bonusMult = won ? mv.bonus.mult : 1;
}
/* The offer, and the words: calls back with whether they were all written. */
function askBonusRound(mv, mon, cb){
  const isAftershock = !!(mv.bonus && mv.bonus.aftershock);
  const isSacredFlame = !!(mv.bonus && mv.bonus.sacredFlame);
  const reward = isAftershock ? '💥 Aftershock' : isSacredFlame ? '🔥 Sacred Flame' : `×${mv.bonus.mult}`;
  const promise = isAftershock
    ? `to start an <b>Aftershock</b> — it strikes every enemy at the start of each of your next ${AFTERSHOCK.turns} turns.`
    : isSacredFlame
    ? `to lay a <b>Sacred Flame</b> — it burns every enemy at the start of each of your next ${SACRED_FLAME.turns} turns.`
    : `to <b>double</b> the damage.`;

  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.6);z-index:80;display:flex;align-items:center;justify-content:center;padding:24px;';
  ov.innerHTML = `<div style="background:var(--paper);border-radius:18px;padding:22px;max-width:340px;width:100%;text-align:center;">
    <div style="font-size:40px;">⚡</div>
    <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:19px;margin:6px 0;">${companionOnField() && mon ? escapeHtml(displayName(mon)) + "'s " : ''}${escapeHtml(mv.name)} is ready</div>
    <div style="font-size:13px;font-weight:600;line-height:1.55;color:var(--ink-soft);margin-bottom:16px;">
      Write <b>${mv.bonus.words} more words</b> — ${revisionWords().length
        ? `drawn from <b>every word you have learned to 🥈 silver or 🥇 gold</b>, in any list —`
        : `drawn from your <b>whole</b> list, not just today's —`}
      ${promise} No hints. Slip up and it still lands at full strength.
    </div>
    <button class="btn btn-primary" id="bonusGo">Try for ${reward}</button>
    <button class="btn btn-ghost" id="bonusSkip" style="margin-top:8px;">Strike now</button>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  /* Rampage still lands its own 5 strikes; what the words win is laid by
     applyBonusWin when the move fires. */
  const finish = (won)=> cb(won);

  ov.querySelector('#bonusSkip').addEventListener('click', ()=>{ close(); finish(false); });
  ov.querySelector('#bonusGo').addEventListener('click', ()=>{
    close();
    /* draw by CHARACTER count, like every other quiz — from every phrase
       learned to silver or gold, in any list (2.89; it was the day's lists,
       which can be short and quickly mastered); the whole list until the
       first phrase reaches silver */
    const learned = revisionWords();
    const pool = learned.length ? learned : masterWords.slice();
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
      subtitle: learned.length ? `${target} words you have learned to silver or gold. No hints.` : `${target} words from your whole list. No hints.`,
      words, stopAtFirstMiss:true, lockExit:true,
      wordTarget: target,
      noHints: true,                    // a gamble should not be handheld
      onComplete:(res)=>{
        const got = res.filter(r=>r.passed).reduce((n,r)=>n+(r.words||countWords(r.text)),0);
        // the bonus words are words written too: they feed the meter, once
        if(feedRecharge(res.reduce((n,r)=>n+(r.words||countWords(r.text)),0)))
          setTimeout(()=>{ battleMsg('⚡ Second wind! Very High and Ultra moves restored.'); renderBattle(); }, 1500);
        go('battle');
        finish(got >= target);
      },
      onExit:()=>{ go('battle'); finish(false); },
    });
  });
}

/* ---------- AFTERSHOCK ----------
   Rampage Max's bonus round lays one: 0.2× ATK to every enemy at the start
   of each of your next 3 turns, or 0.3× if Steel Soul is up when it forms (it
   keeps that after Steel Soul ends; Steel Soul adds nothing more per tick).
   0.2 is what it dealt in battle from the start: the old code meant 0.3 for a
   Max move but read the slot, which in battle says 'Ultimate'. 2.79 made it
   0.3; 2.80 settles it at 0.2 so Ankylosaurus is not quietly stronger. */
const AFTERSHOCK = { pct:0.2, soul:0.1, turns:3 };
/* (rounded: 0.2 + 0.1 is 0.30000000000000004 in floating point, and the
   battle log printed it that way) */
function aftershockPct(soulOn){ return Math.round((AFTERSHOCK.pct + (soulOn ? AFTERSHOCK.soul : 0)) * 100) / 100; }
/* Lay one. `pct` null: 0.2×, or 0.3× if this monster's Steel Soul is up. When
   Overcharge repeats the Rampage that laid one, it lays a second of the same
   strength (b._aftershockLaid), as it does a Sacred Flame (2.81). */
function layAftershock(mon, pct, fromOvercharge){
  const b = ui.battle;
  if(!b || !mon) return;
  if(pct == null){
    const soul = getPStatus(0,'steelSoul');
    pct = aftershockPct(!!(soul && soul.owner === mon.uid));
  }
  addPreHit({ label:'💥 Aftershock rips through the ground!', pct, atk:monAtk(mon),
              turnsLeft:AFTERSHOCK.turns, aoe:true, aftershock:true });
  battleMsg(fromOvercharge ? `⚡💥 The Overcharge shakes the ground again — another Aftershock, ${pct}× ATK!`
                           : `💥 An aftershock begins — ${pct}× ATK for ${AFTERSHOCK.turns} turns.`);
  if(!fromOvercharge) b._aftershockLaid = { pct };   // (a repeat's own is not repeated)
  renderStatusBadges();
}

/* ---------- SACRED FLAME (2.78; renamed and unbounded 2.79) ----------
   The ghost phoenix's gift to yours, once its story is done
   (state.sacredFlameGranted). After Nova or Incinerate the phoenix may write 2
   bonus words from the whole list, as Rampage Max does for its Aftershock;
   succeed and a Sacred Flame is laid: 0.3× ATK to every enemy at the start of
   each of your next 3 turns. Flames stack like aftershocks, WITHOUT LIMIT —
   and when Overcharge repeats the move that laid one, it lays another on top.
   With its Max ability learnt, the phoenix also has REBIRTH (below). */
const SACRED_FLAME = { words:2, pct:0.3, turns:3, moves:['Nova','Incinerate','Incinerate Max'] };
function hasSacredFlame(m){ return !!(state && state.sacredFlameGranted && m && m.species === 'phoenix'); }
function sacredFlameBonus(m, mv){
  return (hasSacredFlame(m) && mv && SACRED_FLAME.moves.includes(mv.name)) ? { words:SACRED_FLAME.words, sacredFlame:true } : null;
}
function sacredFlameCount(){
  const b = ui.battle;
  return (b && b.preHits) ? b.preHits.filter(p=> p.sacredFlame).length : 0;
}
function laySacredFlame(mon, fromOvercharge){
  const b = ui.battle;
  if(!b || !mon) return;
  addPreHit({ label:'🔥 The Sacred Flame burns!', pct:SACRED_FLAME.pct, atk:monAtk(mon),
              turnsLeft:SACRED_FLAME.turns, aoe:true, sacredFlame:true });
  battleMsg(fromOvercharge ? '⚡🔥 The Overcharge feeds the fire — another Sacred Flame!'
                           : `🔥 A Sacred Flame is laid — ${SACRED_FLAME.pct}× ATK for ${SACRED_FLAME.turns} turns.`);
  if(!fromOvercharge) b._sacredFlameLaid = true;
  renderStatusBadges();
}

/* ---------- REBIRTH (2.79) ----------
   A passive of the Sacred Flame phoenix's Max ability. If it falls while a
   Sacred Flame burns, it may rise again: write 8 words correctly and it comes
   back with 50% HP. Once per battle — the attempt is the once. */
const REBIRTH = { words:8, hp:0.5 };
function hasRebirth(m){
  if(!hasSacredFlame(m)) return false;
  const maxRow = (MOVES[m.species] || []).find(mv=> mv[0] === 'Max' && mv[1] != null);
  return !!(maxRow && moveUnlockedFor(m, maxRow));
}
/* A monster of yours (the one in focus, if not given — the leader or, 2.84,
   a companion) has just fallen, and may rise. */
function rebirthDue(m){
  const b = ui.battle;
  m = m || activeMon();
  if(!b || !m || m.currentHp > 0 || b.rebirthUsed) return false;
  return hasRebirth(m) && sacredFlameCount() > 0;
}
/* Ask, then the 8 words. rise() carries on the fight with it standing;
   fall() carries on as the faint would have. */
function offerRebirth(rise, fall, who){
  const b = ui.battle, mon = who || activeMon();
  b.rebirthUsed = true;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(35,32,25,0.6);z-index:80;display:flex;align-items:center;justify-content:center;padding:24px;';
  ov.innerHTML = `<div style="background:var(--paper);border-radius:18px;padding:22px;max-width:340px;width:100%;text-align:center;">
    <div style="font-size:40px;">🔥</div>
    <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:19px;margin:6px 0;">Rebirth</div>
    <div style="font-size:13px;font-weight:600;line-height:1.55;color:var(--ink-soft);margin-bottom:16px;">
      ${escapeHtml(displayName(mon))} has fallen — but the Sacred Flame still burns.
      Write <b>${REBIRTH.words} words</b> to rise again with <b>half your HP</b>. Once per battle.
    </div>
    <button class="btn btn-primary" id="rebirthGo">Rise again</button>
    <button class="btn btn-ghost" id="rebirthNo" style="margin-top:8px;">Let it rest</button>
  </div>`;
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  const failed = ()=>{
    go('battle');
    battleMsg(`The flame gutters. ${displayName(mon)} does not rise.`);
    setTimeout(fall, 700);
  };
  ov.querySelector('#rebirthNo').addEventListener('click', ()=>{ close(); fall(); });
  ov.querySelector('#rebirthGo').addEventListener('click', ()=>{
    close();
    startQuiz({
      title:'Rebirth',
      subtitle:`Write ${REBIRTH.words} words to rise again.`,
      words:pickWords(REBIRTH.words), stopAtFirstMiss:true, lockExit:true,
      wordTarget:REBIRTH.words,
      onComplete:(res)=>{
        const got = res.filter(r=>r.passed).reduce((n,r)=>n+(r.words||countWords(r.text)),0);
        if(feedRecharge(res.reduce((n,r)=>n+(r.words||countWords(r.text)),0)))
          setTimeout(()=>{ battleMsg('⚡ Second wind! Very High and Ultra moves restored.'); renderBattle(); }, 1500);
        if(got < REBIRTH.words) return failed();
        go('battle');
        mon.currentHp = Math.ceil(monMaxHp(mon) * REBIRTH.hp);
        renderBattle();
        drainHp(pid('playerHp', mon), 0, mon.currentHp, monMaxHp(mon));
        playEffect('Nova', { type:'Fire' });
        battleMsg(`🔥 Rebirth! ${displayName(mon)} rises from the Sacred Flame with half its HP.`);
        setTimeout(rise, 900);
      },
      onExit:()=> failed(),
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
  /* The story needs this blow to clear the field, so no block stands in its way. */
  const hits = pool.map(t=>{
    const dmg = mv.fixed != null ? mv.fixed
              : Math.max(t.hp, computeDamage(mv.mult, atk, monRef(mon), t, true));
    return { t, idx:b.enemies.indexOf(t), dmg, oldHp:t.hp, newHp:Math.max(0, t.hp-dmg), pierce:true };
  });
  battleMsg(`${displayName(mon)} used ${mv.name}!`);
  bob($('#' + pid('playerBob')), +1);
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

function resolveBattleMove(mv, target, results, opts){
  const mon=activeMon();
  /* Their Steel Soul (2.90): a blow aimed at one of them goes to the one that
     cast it — and so does a splash's main blow. */
  { const g = soulGuardian('enemy');
    if(g && (mv.target === 'Single' || mv.target === 'SingleAOE') && target !== g) target = g; }
  const noQuiz = !!(opts && opts.noQuiz);             // a wound-up move released: paid for already
  /* A companion's move (2.85), already written for: its turn's words were
     counted, carried over and fed to the meter by companionWritten, and
     `pre.correct` is what the move itself is reckoned to have had. Its bonus
     round (if any) is offered here as usual. */
  const pre = (opts && opts.pre) || null;
  /* Back from a bonus round (2.78): the words were counted, carried over and
     fed to the meter the first time through. Re-reading them now read the
     BONUS quiz instead — the carry-over was lost and the meter fed twice. */
  const reentry = !pre && !!(ui.battle && ui.battle._bonusResolved);
  const bonusDone = reentry;                          // no bonus round to offer again
  const tally = pre ? { correct:pre.correct, spill:0 } : reentry ? (ui.battle._bonusTally || null) : null;
  if(ui.battle){ ui.battle._bonusResolved = false; ui.battle._bonusTally = null; }
  if(ui.battle && !reentry){ ui.battle._sacredFlameLaid = false; ui.battle._aftershockLaid = null; }
  if(pre) results = [];
  results.filter(r=>!r.passed).forEach(r=>{ if(!ui.battle.fightMistakes.includes(r.text)) ui.battle.fightMistakes.push(r.text); });
  // Scored in WORDS now: sum the characters of every phrase written correctly,
  // plus any spill carried in from the previous move.
  const correct = noQuiz ? mv.words
                : tally ? tally.correct
                : results.filter(r=>r.passed).reduce((n,r)=>n+(r.words||countWords(r.text)),0)
                + (ui.quiz && ui.quiz.config ? (ui.quiz.config.startingWords||0) : 0);
  const spill = noQuiz ? 0 : tally ? tally.spill : bankWordSpill(mv);
  // Feed the second-wind meter with everything written this turn, right or wrong
  const written = (noQuiz || tally) ? 0 : results.reduce((n,r)=>n+(r.words||countWords(r.text)),0);
  const recharged = feedRecharge(written);
  if(ui.battle) ui.battle.lastMove = mv;
  go('battle');
  if(recharged) setTimeout(()=>{ battleMsg('⚡ Second wind! Very High and Ultra moves restored.'); renderBattle(); }, 1500);
  /* A quick move that failed spends the turn, as always — and so it is this
     monster's action this round. */
  if(isQuickMove(mv) && correct < mv.words) markActed(mon);

  if(mv.slot==='UltraStone') ui.battle.usedUltra[mon.uid]=true;
  if(mv.isStone && mv.stoneTier==='veryhigh') ui.battle.usedVeryHigh[mon.uid]=true;

  /* Their Discombobulate on you: once the words are written, a blow turns on
     yourself instead. Wind-ups, casts and heals are not blows. */
  const muddle = getPStatus(0,'discombobulate');
  if(muddle && isEnemyOwned('discombobulate', muddle) && movesToStrike(mv) && !(mv.windup && !noQuiz)){
    const f = (mv.isStone || mv.mult == null) ? (correct >= mv.words ? (mv.mult || 0.5) : 0)
                                                : moveFactor(mv.slot, mv.mult, mv.words, correct);
    if(f > 0) return muddledSelfStrike(mv, mon, f);
  }
  /* Their Diamond Dust: nothing of yours takes hold while it lasts. Say so,
     rather than letting the cast go quiet. A song costs no turn, so the turn
     is still yours; anything else spends it, as it would have anyway. */
  const castOnly = mv.aria || (mv.shell && mv.mult == null) || mv.tachy || mv.grant ||
                   mv.charm || mv.disrupt || mv.soul || mv.clones || mv.dot;
  if(castOnly && dustBlocks('player') && correct >= mv.words){
    playSfx('move_miss');
    battleMsg(`💎 Their diamond dust scatters your ${mv.name} — nothing takes hold.`);
    if(mv.aria){ ui.battle.phase = 'player'; return renderBattle(); }
    return setTimeout(advanceTurn, 1100);
  }

  /* Tactical moves resolve before the ordinary damage path. */
  /* Vita — a pulse now, and a light that stays. */
  if(mv.vita){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    castVita(mon, mv.vita);
    playEffect(mv.name, { type:'Water' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  /* Conversio — it spends itself to bring others back. */
  if(mv.conversio){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    return runConversio(mon, mv.conversio);
  }
  /* Revitalise — the teammate chosen before the writing gets back up. */
  if(mv.revitalise){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    return castRevitalise(mon, mv);
  }
  /* Haunting Aria — instant, does not spend the turn. */
  if(mv.aria){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    /* Never reached through the button, which is shut while an Aria runs —
       but if it ever is, hand the turn back rather than spend it. */
    if(!ariaActive()) castAria(mon, mv.aria, false);
    ui.battle.phase = 'player';
    renderBattle();
    battleMsg('Ominous whalesong fills the air. It cost no turn — choose your move.');
    return;
  }
  /* Grudge — flat plus three quarters of everything he has lost. */
  if(mv.grudge){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    breakCover(mon);
    const dmg = grudgeDamage(mon, mv.grudge);
    const foes = livingEnemies();
    /* It cannot be dodged (your call) — but a Counter guard reads it, as
       yours reads their Grudge, and their block soaks it. */
    const hits = foes.map(t=>{ const g = enemyGuard(t, dmg);
      return { t, idx:ui.battle.enemies.indexOf(t), dmg:g, oldHp:t.hp, newHp:Math.max(0, t.hp - g) }; });
    battleMsg(`${mv.name}! Everything he has lost, given back at once.`);
    bob($('#' + pid('playerBob')), +1);
    return setTimeout(()=>{ applyHits(hits); reportHits(hits);
      setTimeout(()=> afterPlayerAttack(mon, hits), 700); }, 380);
  }
  /* Vengeance — one hit, then the grudge begins gathering. */
  if(mv.wrath){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    const w = mv.wrath;
    breakCover(mon);
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
    const soak = blockPlanner();                  // and what their block will take of each
    const hits = [];
    for(let i = 0; i < (v.hits || 1); i++){
      let t = foes[(start + i) % foes.length];
      const hpOf = x => left.has(x) ? left.get(x) : x.hp;
      if(hpOf(t) <= 0) t = foes.find(x=> hpOf(x) > 0) || t;
      const cur = hpOf(t);
      const idx = ui.battle.enemies.indexOf(t);
      /* Each blow can be slipped, like any other attack of yours: a lurking
         enemy is simply not there. (It never rolled evasion, so Vengeance
         found lurkers in the dark — Grudge still does, by design.) */
      if(rollDodge(t, idx, 380 + i * 200, ignoresEvasion(mv, mon))){
        hits.push({ t, idx, dmg:0, oldHp:cur, newHp:cur, dodged:true });
        continue;
      }
      const dmg = enemyGuard(t, computeDamage(per, monAtk(mon), monRef(mon), t, true));
      const nu = plannedHp(soak, t, cur, dmg);
      left.set(t, nu);
      hits.push({ t, idx, dmg, oldHp:cur, newHp:nu });
    }
    battleMsg(`${mv.name}! ${hits.length} blows${fallen ? `, heavier for every one you have lost` : ''} — ` +
              `and every blow from here will be remembered.`);
    bob($('#' + pid('playerBob')), +1);
    return setTimeout(()=>{ applyHits(hits); reportHits(hits);
      setTimeout(()=> offerVengeanceSwap(mon, hits), 800); }, 380);
  }
  if(mv.dot){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    breakCover(mon);
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
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    applyShell(mv, mon);
    renderStatusBadges();
    battleMsg(`${mv.name}! Damage taken cut by ${Math.round(mv.shell.reduce*100)}%, and attackers get burned.`);
    playEffect(mv.name, { type:SPECIES[mon.species].types[0] });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.tachy){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    /* `max`: your Diamond Dust holds it at its own length, not the Very High
       stones' five turns (2.81). A recast keeps this round's count of extra
       actions and any it has saved. */
    const prevTac = getPStatus(0,'tachy');
    const keepTac = (prevTac && prevTac.owner === mon.uid) ? { extras:prevTac.extras || 0, banked:prevTac.banked || 0 } : {};
    setPStatus(0, Object.assign({ type:'tachy', turnsLeft:mv.tachy.turns+1, max:mv.tachy.turns+1,
                    bonusAction:mv.tachy.bonusAction, owner:mon.uid,
                    evadeFirst:mv.tachy.evadeFirst, evadeAfter:mv.tachy.evadeAfter, fresh:true }, keepTac));
    renderStatusBadges();
    battleMsg(`${mv.name}! Time slows — ${Math.round(mv.tachy.bonusAction*100)}% chance of an extra action each time ${displayName(mon)} acts (${TACHY_MAX_EXTRAS} a round at most), and much harder to hit.`);
    playEffect(mv.name, { type:'Psychic' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.grant){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
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
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    applyFieldStatus({ type:'charm', turnsLeft:mv.charm.turns, chance:mv.charm.chance });
    renderStatusBadges();
    battleMsg(`${mv.name}! For ${mv.charm.turns} turns each enemy may be charmed into losing its turn.`);
    playEffect(mv.name, { type:'Electric' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.disrupt){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
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
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
    setPStatus(0, { type:'steelSoul', turnsLeft:mv.soul.turns+1, max:mv.soul.turns+1,   // held at its own length (2.81)
                    reduce:mv.soul.reduce, bonus:mv.soul.bonus, owner:mon.uid });
    renderStatusBadges();
    /* every other shield already up turns into damage too (2.91): say how much */
    const amp = steelSoulAmp(monRef(mon), true);
    const more = amp > 1 + mv.soul.reduce + 1e-9 ? ` — ×${+amp.toFixed(2)} with your other shields up —` : '';
    battleMsg(`${mv.name}! For ${mv.soul.turns} turns: ${Math.round(mv.soul.reduce*100)}% less damage taken, ` +
      `${Math.round(mv.soul.reduce*100)}% more dealt${more} (+${mv.soul.bonus}× ATK a hit), and every single blow aimed at your side comes to it.`);
    playEffect(mv.name, { type:'Steel' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.clones){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${wordsTag(correct, mv)} words)`); return setTimeout(advanceTurn,900); }
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
    factor = scaledFactor(mv, correct);
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
  if(factor<=0){ playSfx('move_miss'); battleMsg(`${mv.name} missed! (${wordsTag(correct, mv)} words)`); setTimeout(advanceTurn,900); return; }
  /* A wind-up (Grave Quake, Burn Bright): the words are spent now, the turn
     passes, and the blow comes down next turn for nothing. Not an attempt, so
     a Lurk holds through it. */
  if(mv.windup && !noQuiz){
    mon._windup = mv.name;
    renderBattle();
    battleMsg((mv.windup.say || `{name} gathers itself…`).replace('{name}', displayName(mon)) + ' The turn passes.');
    playEffect(mv.windup.name || mv.name, { type:SPECIES[mon.species].types[0], duration:700 });
    return setTimeout(advanceTurn, 1100);
  }
  if(noQuiz) mon._windup = null;
  /* The blow is coming: whatever hid this monster is gone, and the blow that
     ends a Lurk may be an ambush. A bonus round re-enters here harmlessly. */
  if(!reentry) breakCover(mon, mv.spendLurk);
  /* Extinguish: everything it has left, half as much again, on every one of
     them — and then it is gone. */
  if(mv.extinguish){
    const pow = mon.currentHp;
    const hits = livingEnemies().map(t=>{
      const idx = ui.battle.enemies.indexOf(t);
      if(rollDodge(t, idx, 240, ignoresEvasion(mv, mon))) return { t, idx, dmg:0, oldHp:t.hp, newHp:t.hp, dodged:true };
      const dmg = enemyGuard(t, computeDamage(mv.extinguish.hpMult || 1.5, pow, { types:[] }, t, true));
      return { t, idx, dmg, oldHp:t.hp, newHp:Math.max(0, t.hp - dmg) };
    });
    battleMsg(`${mv.name}!`);
    bob($('#' + pid('playerBob')), +1);
    playEffect(mv.name, { type:'Fire' });
    return setTimeout(()=>{
      applyHits(hits); reportHits(hits);
      const before = mon.currentHp;
      mon.currentHp = 0;
      drainHp(pid('playerHp'), before, 0, monMaxHp(mon));
      setTimeout(()=> battleMsg(`${displayName(mon)} burns itself out.`), 500);
      if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 1200);
      setTimeout(onMonFainted, 1200);
    }, 380);
  }
  const atk=monAtk(mon);
  /* SingleAOE: one main target at full power, everyone else at `splash`. */
  if(mv.target === 'SingleAOE' && mv.splash){
    const main = (target && target.hp>0) ? target : livingEnemies()[0];
    if(main){
      const all = livingEnemies().map(t=>{
        const idx = ui.battle.enemies.indexOf(t);
        if(rollDodge(t, idx, 240, ignoresEvasion(mv, mon))) return { t, idx, dmg:0, oldHp:t.hp, newHp:t.hp, dodged:true };
        const f = (t === main) ? factor : factor * mv.splash;
        const dmg = enemyGuard(t, computeDamage(f, atk, monRef(mon), t, true));   // their Counter reads it too
        return { t, idx, dmg, oldHp:t.hp, newHp:Math.max(0,t.hp-dmg) };
      });
      battleMsg(`${mv.name}!`);
      bob($('#' + pid('playerBob')), +1);
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
    const ti = ui.battle.enemies.indexOf(t);
    const h = rollDodge(t, ti, 240, ignoresEvasion(mv, mon))
      ? [{ t, idx:ti, dmg:0, oldHp:t.hp, newHp:t.hp, dodged:true }]
      : [{ t, idx:ti, dmg:enemyGuard(t, back), oldHp:t.hp, newHp:Math.max(0,t.hp-back) }];
    battleMsg(`${mv.name}! Their own force is turned against them.`);
    bob($('#' + pid('playerBob')), +1);
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
  if(mv.bonus && !bonusDone && targets[0]){
    ui.battle._bonusTally = { correct, spill };
    return offerBonusRound(mv, mon, [{ t:targets[0], idx:ui.battle.enemies.indexOf(targets[0]) }], '', results);
  }

  /* Murder of Crows: something already failing draws twice the birds. */
  if(mv.execute && targets[0] && targets[0].hp / Math.max(1, targets[0].maxHp) < (mv.execute.below || 0.30)){
    mv = Object.assign({}, mv, { hits: mv.execute.hits || (mv.hits || 1) * 2 });
    battleMsg('The crows smell weakness!');
  }
  /* A SINGLE-TARGET `hits` move rains several strikes on one enemy. An AOE
     `hits` move strikes EVERY enemy that many times — routing it through the
     single-target path was making Seismic Shock and Rampage hit one foe only. */
  if(mv.hits && mv.hits > 1 && targets[0]){
    if(mv.target !== 'AOE') return resolveSplitHits(mv, mon, factor, atk, targets[0]);
    return resolveAoeHits(mv, mon, factor, atk, targets);
  }
  const hits = targets.map(t=>{
    // an airborne, unseen or lurking defender is hard to touch — unless the mind is read
    if(rollDodge(t, ui.battle.enemies.indexOf(t), 240, ignoresEvasion(mv, mon))){
      return { t, idx:ui.battle.enemies.indexOf(t), oldHp:t.hp, newHp:t.hp, dmg:0, dodged:true };
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
  if(mv.bonus && !bonusDone){
    ui.battle._bonusTally = { correct, spill };
    return offerBonusRound(mv, mon, hits, effMsg, results);
  }
  battleMsg(`${mv.name}! ${effMsg}`);
  bob($('#' + pid('playerBob')), +1);
  playEffect(mv.name, { type: mv.stoneType || SPECIES[mon.species].types[0], tier: mv.stoneTier,
                        at: hits[0] ? 'enemy-'+hits[0].idx : null });
  setTimeout(()=>{
    applyHits(hits);
    reportHits(hits);
    // Paralysis rolls per hit, so a multi-hit move gets several chances — but
    // only on a blow that got through: one that was dodged, or that their block
    // soaked entirely, stuns nobody (as theirs cannot stun you through yours)
    const stunPct = mv.paralyse || mv.stunHit;
    if(stunPct){
      const zapped = [];
      hits.forEach(h=>{
        if(h.t && h.t.hp>0 && h.dmg > 0 && !h.dodged && Math.random() < stunPct && !getEStatus(h.t,'paralysed')){
          addEStatus(h.t, { type:'paralysed', turnsLeft:1 });
          zapped.push(SPECIES[h.t.species].name);
        }
      });
      if(zapped.length){
        renderStatusBadges();
        setTimeout(()=> battleMsg(`⚡ ${[...new Set(zapped)].join(' and ')} can't move!`), 650);
      }
    }
    /* Boo! and Wail: a blow that weakens THEM — their next attack lands soft. */
    const sfp = mv.softenHit;
    if(sfp){
      let weak = 0;
      hits.forEach(h=>{
        if(h.t && h.t.hp > 0 && h.dmg > 0 && !h.dodged && !getEStatus(h.t,'softened') && Math.random() < sfp.chance){
          addEStatus(h.t, { type:'softened', turnsLeft:2, amount:sfp.amount || 0.5 });
          if(getEStatus(h.t,'softened')) weak++;
        }
      });
      if(weak){ renderStatusBadges(); setTimeout(()=> battleMsg(`🌀 ${weak === 1 ? 'Its' : 'Their'} next attack will be weakened!`), 650); }
    }
    /* Lunacy (the Moon Swan), in your hands as in theirs: a quarter of the
       time the moonlight gets into their heads — every one of them muddled for
       its next swing (this round or the next), turned on its own side at full
       power. Their dust keeps it out (addEStatus). */
    const lun = mv.lunacy;
    if(lun && hits.some(h=> h.t && !h.dodged) && Math.random() < (lun.chance || 0.25)){
      let caught = 0;
      livingEnemies().forEach(x=>{ markConfused(x, lun.ffPower || 1.0, true); if(getEStatus(x,'discombobulate')) caught++; });
      if(caught){ renderStatusBadges(); setTimeout(()=> battleMsg('🌙 The moonlight gets into their heads!'), 650); }
    }
    /* Nova (the Phoenix), in your hands as in theirs (2.90): a small Diamond
       Dust — one of their buffs swept away, one of their marks on your side
       burnt off — whenever it reaches one of them. */
    if(mv.purge && hits.some(h=> h.t && !h.dodged)){
      const said = novaPurge('player', mv.purge);
      if(said){ renderStatusBadges(); setTimeout(()=> battleMsg(said), 650); }
    }
    if(mv.shell) applyShell(mv, mon);       // Slag Eruption leaves molten armour
    // resolves AFTER Leech Seed, so the field heal lands first
    const drain = applyPartyDrain(mv, mon);
    if(drain && drain.healed>0){
      const onField = playerField().includes(drain.target);
      if(onField) drainHp(pid('playerHp', drain.target), drain.target.currentHp-drain.healed, drain.target.currentHp, monMaxHp(drain.target));
      showDamageNumber(onField ? pid('playerBob', drain.target) : pid('playerBob'), drain.healed, { heal:true });
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

/* Does this move swing at them? (Status casts, heals, songs and stances do not.) */
function movesToStrike(mv){
  if(!mv || mv.target === 'Status' || mv.vita || mv.aria || mv.revitalise || mv.tachy || mv.grant ||
     mv.charm || mv.disrupt || mv.soul || mv.clones || (mv.shell && mv.mult == null) || mv.charge || mv.chargeMore) return false;
  if(mv.conversio) return false;               // it raises the fallen first
  return mv.mult != null || !!(mv.grudge || mv.wrath || mv.dot || mv.reflect || mv.extinguish || mv.chargeSpend);
}
/* Their Discombobulate on you: the blow turns on yourself — the mirror of a
   muddled enemy clouting its own side, and alone on the field you are the only
   one there. It was still an attempt, so it ends a Lurk. */
function muddledSelfStrike(mv, mon, factor){
  { const ef = getESide('confusionField'); if(ef && ef.sure) ef.sureUsed = true; }   // their field's certain turn has worked
  const st = getPStatus(0,'discombobulate');
  const power = (st && st.ffPower) || 0.60;
  removePStatus(0,'discombobulate');
  breakCover(mon); mon._ambush = 0;
  const dmg = Math.max(1, Math.ceil(factor * monAtk(mon) * power));
  /* 2.84: with its partner beside it, the swing lands on the partner — as a
     muddled enemy clouts one of its own side — and on itself only alone. */
  const victim = livingField().find(m=> m !== mon) || mon;
  battleMsg(victim === mon ? `🌀 ${displayName(mon)} is too dizzy to tell which way is out — it hits itself!`
                           : `🌀 ${displayName(mon)} swings wildly and clouts ${displayName(victim)}!`);
  bob($('#' + pid('playerBob')), -1);
  setTimeout(()=>{
    const before = victim.currentHp;
    victim.currentHp = Math.max(ui.battle && ui.battle.allyUnkillable ? 1 : 0, victim.currentHp - dmg);
    flashHit($('#' + pid('playerBob', victim)));
    drainHp(pid('playerHp', victim), before, victim.currentHp, monMaxHp(victim));
    showDamageNumber(pid('playerBob', victim), before - victim.currentHp);
    renderStatusBadges();
    setTimeout(()=>{
      if(victim.currentHp <= 0 || mon.currentHp <= 0) return onMonFainted();
      finishPlayerTurn();
    }, 800);
  }, 420);
}

/* ============================================================
   ONE STRIKE OF YOURS LANDING — the only place it happens
   ------------------------------------------------------------
   Every blow you deal an enemy comes through here however it was planned: a
   single hit, a twin, each strike of a barrage or an Ultra, a repeat, an echo,
   an afterimage, a riposte, a burn. Their block works exactly as yours does
   against their blows: one stack per strike, each soaking up to the ATK it was
   minted at, the rest landing. A strike that was dodged, or that carries
   nothing, spends nothing. HP comes off what the enemy has NOW, so several
   strikes on one enemy add up however they were planned (a repeat of a
   barrage used to land only its last strike).
     h.dmg     arrives as the planned figure, leaves as what got through
     h.raw     the planned figure, kept (a repeat re-applies it, block and all)
     h.blocked what the block soaked
     h.pierce  goes straight through block (the scripted finale)
   Returns what Leech Seed drank from it, for the caller to hand out.
   ============================================================ */
function landStrike(h, opts){
  if(!h || !h.t || h.dodged) return 0;
  const t = h.t;
  if(h.raw == null) h.raw = h.dmg || 0;
  const before = t.hp;
  if(before <= 0){ h.dmg = 0; h.oldHp = h.newHp = 0; return 0; }   // already down: nothing left to strike
  const raw = h.raw;
  const through = (raw > 0 && !h.pierce && blockStacksOf(t)) ? applyBlock(t, raw, 'enemyBlk-' + h.idx) : raw;
  h.blocked = raw - through;
  h.dmg = through;
  h.oldHp = before;
  h.newHp = Math.max(0, before - through);
  if(raw > 0) t.lastDamageTaken = raw;          // a reflection returns the full figure, as yours does
  /* Arena immortality: a knock-out becomes a full heal, so a test runs as
     long as the tester wants without anything respawning. */
  if(ui.battle && ui.battle.arenaImmortal && h.newHp <= 0) h.newHp = t.maxHp;
  t.hp = h.newHp;
  flashHit(document.getElementById('enemy-' + h.idx));
  drainHp('enemyHp-' + h.idx, before, h.newHp, t.maxHp);
  if(h.newHp <= 0){ const el = document.getElementById('enemy-' + h.idx); if(el) el.classList.add('fainted'); }
  /* Leech Seed drinks from what lands. A dodge, or a blow their block soaked
     entirely, gives it nothing — just as their seeds get nothing from a blow
     of theirs that your block soaks. */
  if(through > 0 && !(opts && opts.noLeech)) return resolveLeech(t, activeMon());
  return 0;
}
/* A multi-strike move is planned before any of its strikes land, so the plan
   has to know what their block will soak — or it would think a shielded enemy
   down while it still stands, and stop striking it. This spends a copy of each
   target's stacks, in the order the real ones will go. */
function blockPlanner(){
  const left = new Map();
  return (t, dmg)=>{
    if(!t || !(dmg > 0)) return dmg || 0;
    const n = left.has(t) ? left.get(t) : blockStacksOf(t);
    if(n <= 0) return dmg;
    left.set(t, n - 1);
    return Math.max(0, dmg - (t.blockValue || 0));
  };
}
/* What a planned strike leaves the enemy on: through their block — and in the
   immortal arena a knock-out comes straight back up at full, so the rest of
   the move keeps striking it (it used to stop, and the test stalled). */
function plannedHp(soak, t, hp, dmg){
  const left = Math.max(0, hp - soak(t, dmg));
  return (left <= 0 && ui.battle && ui.battle.arenaImmortal) ? t.maxHp : left;
}

/* apply a batch of hits: each one lands through landStrike, in order.
   `opts.noLeech` marks damage that did NOT come from an attack the player
   chose — pre-hits like Overheat ✦'s burn and Aftershock. Those should not
   feed Leech Seed, or a seeded field would heal the team and gnaw the enemy
   before a single move was made. */
function applyHits(hits, opts){
  hits = (hits || []).filter(Boolean);
  const mon = activeMon();
  if(hits.length) playSfx('hit_dealt');
  let healed = 0;
  hits.forEach(h=>{ healed += landStrike(h, opts); });
  const ls = ui.battle && ui.battle.pendingLifesteal;
  if(ls){ healed += ls; ui.battle.pendingLifesteal = 0; }
  // Leech Seed feeds the WHOLE team, not only the monster that swung — a
  // companion out on the field included (2.84).
  if(healed>0){
    healableAllies().forEach(m=>{
      if(m.currentHp<=0 || m===mon) return;
      const was = m.currentHp;
      m.currentHp = Math.min(monMaxHp(m), m.currentHp + healed);
      if(m.currentHp > was && playerField().includes(m)) drainHp(pid('playerHp', m), was, m.currentHp, monMaxHp(m));
    });
  }
  if(healed>0 && mon.currentHp>0){
    const max = monMaxHp(mon);
    const before = mon.currentHp;
    mon.currentHp = Math.min(max, mon.currentHp + healed);
    drainHp(pid('playerHp'), before, mon.currentHp, max);
    const others = battleParty().filter(m=>m.currentHp>0 && m!==mon).length;
    battleMsg(`🌿 The seed drinks deep — <b>${mon.currentHp-before} HP</b> to ${displayName(mon)}` +
      (others ? ` and every one of your other ${others} monster${others>1?'s':''}.` : '.'));
  }
  saveProfile();
  hits.forEach(h=>{ if(h.t && h.t.hp<=0){ const el=document.getElementById('enemy-'+h.idx); if(el) el.classList.add('fainted'); } });
}

/* after any player attack resolves: check overcharge repeat, then move on.
   `hits` carries the per-target damage so a repeat re-applies the real amount. */
function afterPlayerAttack(mon, hits){
  const b = ui.battle;
  /* Once per action, however many repeats and echoes follow: your Cunning and
     Greed, a lifesteal passive, and what THEY do about being hit — their
     spikes prick you, their Goblin Knights riposte. */
  if(b && b.actionSeq && b._postSeq !== b.actionSeq){
    b._postSeq = b.actionSeq;
    const wait = postPlayerAction(b.actionMon || mon, hits || []);
    if(wait > 0) return setTimeout(()=>{
      if(!ui.battle) return;
      const me = activeMon();
      if(me && me.currentHp <= 0) return livingEnemies().length === 0 ? onWaveCleared() : onMonFainted();
      afterPlayerAttackBody(mon, hits);
    }, wait);
  }
  return afterPlayerAttackBody(mon, hits);
}
function afterPlayerAttackBody(mon, hits){
  /* (Dragon Legacy is no longer spent here: it lasts the whole turn and ends
     with the round — endDragonLegacy().) A weakened attack has now been made,
     so the weakening is used up. */
  if(hits && hits.length && getPStatus(0,'softened')) removePStatus(0,'softened');
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
  /* It is the CASTER'S: a monster that came in after the Thunder Newt used to
     act again on its Tachypsychia too, with no limit — theirs was always its
     caster's alone, three extra actions a round at most (2.80: yours the
     same). With nobody left standing there is no extra action to take now —
     one there once opened a turn with no enemies, and the battle hung (2.79)
     — so one that comes up then is SAVED (2.81): `banked`, spent after a later
     action of the newt's whose own roll comes up empty — next turn, or the one
     after if that turn is full — and more pile on the same way, until
     Tachypsychia ends or the battle does. Saved or rolled, each is one of the
     round's three. */
  if(tac && tac.owner === mon.uid && mon.currentHp > 0 && (tac.extras || 0) < TACHY_MAX_EXTRAS){
    const lastChance = (tac.turnsLeft||0) <= 1 && !tac.procced;
    const rolled = lastChance || Math.random() < (tac.bonusAction||0);
    if(rolled) tac.procced = true;
    if(livingEnemies().length === 0){
      if(rolled){
        tac.banked = (tac.banked || 0) + 1;
        renderStatusBadges();
        battleMsg(`⚡ Lightning reflexes — with nobody left to strike, ${displayName(mon)} saves the extra action for its next turn` +
                  (tac.banked > 1 ? ` (${tac.banked} saved).` : '.'));
      }
    } else if(rolled || (tac.banked || 0) > 0){
      const saved = !rolled;
      if(saved) tac.banked--;
      tac.extras = (tac.extras || 0) + 1;
      /* the extra action is the newt's own — chosen from its own moves, even
         when it is the companion (2.84) */
      ui.battle.control = { mode:'solo', uid:mon.uid, extra:true };
      setFocus(mon);
      ui.battle.phase = 'player';
      renderBattle();
      battleMsg(saved ? `⚡ A saved extra action — ${displayName(mon)} acts again!` : '⚡ Lightning reflexes — you act again!');
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

/* ============================================================
   AFTER YOUR ACTION
   Returns how long to wait before carrying on (0 if nothing happened).
   ============================================================ */
function postPlayerAction(mon, hits){
  const b = ui.battle;
  if(!b || !mon) return 0;
  mon._ambush = 0;                                    // the ambush was that attack's alone
  const struck = hits.filter(h=> h && h.t);
  const landed = struck.filter(h=> h.dmg > 0 && !h.dodged);
  if(struck.length || (b.actionDodges || []).length) mon._omen = 0;   // Ill Omen spent on the swing
  const lines = [];
  const victims = [...new Set(landed.map(h=> h.t))];
  if(landed.length){
    const total = landed.reduce((n, h)=> n + h.dmg, 0);
    const p = passiveOf(mon);
    if(p && p.lifesteal && mon.currentHp > 0){
      const before = mon.currentHp;
      mon.currentHp = Math.min(monMaxHp(mon), mon.currentHp + Math.ceil(total * p.lifesteal));
      if(mon.currentHp > before){ drainHp(pid('playerHp'), before, mon.currentHp, monMaxHp(mon)); lines.push(`🧵 ${displayName(mon)} drinks in ${mon.currentHp - before} HP.`); }
    }
    if(noteDealtDamage(mon)) lines.push(`🌘 ${displayName(mon)} slips back into the shadows — Cunning!`);
    const g = greedSteal('player', mon, victims);
    if(g) lines.push(g);
  }
  /* Their Spike Armour (and a Lava Shell they hold) prick back: once for each
     of them you hit, at that one's own attack — a blow their block soaked
     still met the spikes, as a blow of theirs your block soaks meets yours. */
  const touched = [...new Set(struck.filter(h=> !h.dodged && ((h.raw != null ? h.raw : h.dmg) > 0)).map(h=> h.t))];
  if(touched.length){
    const spk = getESide('spikeArmour'), shl = getESide('shell');
    const per = (spk ? (spk.thorns || 0.20) : 0) + (shl ? (shl.thorns || 0) : 0);
    if(per > 0 && mon.currentHp > 0){
      let back = 0;
      touched.forEach(t=>{ back += Math.ceil(per * enemyAtk(t)); });
      const before = mon.currentHp;
      mon.currentHp = Math.max(0, mon.currentHp - back);
      flashHit($('#' + pid('playerBob')));
      drainHp(pid('playerHp'), before, mon.currentHp, monMaxHp(mon));
      showDamageNumber(pid('playerBob'), before - mon.currentHp);
      lines.push(`Their spikes strike back for ${before - mon.currentHp}!`);
    }
  }
  /* Their Goblin Knights: any attack that dealt one of them nothing — dodged,
     or soaked by block — is answered, and so is one that hit his friends and
     not him. A riposte is a reflex, not an attempt: his Lurk or Cunning holds.
     One riposte per Knight per attack. */
  const dodged = new Set(b.actionDodges || []);
  livingEnemies().forEach(k=>{
    const p = passiveOf(k);
    if(!p || !p.riposte || mon.currentHp <= 0) return;
    if(landed.some(h=> h.t === k)) return;
    const attacked = dodged.has(k) || struck.some(h=> h.t === k);
    if(!attacked && !landed.length) return;
    const who = SPECIES[k.species].name;
    { const ar = ariaState(); if(ar) ar.struck = true; }
    const covered = ariaFieldEvasion() > 0;
    if(covered) noteAriaCover();
    if(covered || Math.random() < playerEvasionFrom(k)){
      floatMiss(pid('playerBob'), dodgeWord(mon)); dodgePlayer();
      lines.push(`⚔️ ${who} ripostes — and finds nothing.`);
      return;
    }
    const dmg = computeDamage(p.riposte, enemyAtk(k), k, monRef(mon), false);
    const before = mon.currentHp;
    const through = applyBlock(mon, dmg, pid('playerBlk'));
    mon.currentHp = Math.max(ui.battle.allyUnkillable ? 1 : 0, mon.currentHp - through);
    counterDrift(document.getElementById('enemyBob-' + b.enemies.indexOf(k)), document.getElementById(pid('playerBob')));
    flashHit($('#' + pid('playerBob')));
    drainHp(pid('playerHp'), before, mon.currentHp, monMaxHp(mon));
    showDamageNumber(pid('playerBob'), before - mon.currentHp);
    floatBlocked(pid('playerBob'), dmg - through);
    lines.push(`⚔️ ${who} ripostes — ${before - mon.currentHp}!`);
  });
  if(!lines.length) return 0;
  renderStatusBadges();
  setTimeout(()=> battleMsg(lines.join(' ')), 350);
  return 1500;
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
  const tIdx = b.enemies.indexOf(target);
  const dodged = rollDodge(target, tIdx, 350, ignoresEvasion(mv, mon));
  const dmg = dodged ? 0 : enemyGuard(target, computeDamage(mv.mult||0.5, atk, monRef(mon), target, true));
  const again = [{ t:target, idx:tIdx, dmg, oldHp:target.hp, newHp:Math.max(0,target.hp-dmg), dodged }];
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
  const echoes = targets.filter(t=>t && t.hp>0).map((t, k)=>{
    const idx = b.enemies.indexOf(t);
    if(rollDodge(t, idx, 300 + k*350)) return { t, idx, dmg:0, oldHp:t.hp, newHp:t.hp, dodged:true };
    /* part of the same action: an enemy that took it on the guard takes the
       echoes on it too, as your guard takes their echoes */
    const dmg = enemyGuard(t, Math.max(1, Math.ceil(computeDamage(mv.mult||0.2, atk, monRef(mon), t, true) * b.clones.mult)));
    return { t, idx, dmg, oldHp:t.hp, newHp:Math.max(0,t.hp-dmg) };
  });
  if(echoes.length===0){ b._cloneEchoing=false; return done(); }
  battleMsg('Two clones strike!');
  playSuccessiveHits(echoes, 0, ()=>{
    reportHits(echoes);
    b._cloneEchoing = false;
    b.clones.turnsLeft--;
    if(b.clones.turnsLeft<=0){ b.clones=null; clearPStatus(0,'clones'); }
    done();
  }, true);
}

function afterPlayerAttackReal(mon, hits){
  setTimeout(()=>{
    /* What this action laid, for an Overcharge repeat to lay again: read once
       and cleared, so it cannot outlive the action and ride some later move's
       repeat (a charge spend never passes the reset in resolveBattleMove). */
    const b0 = ui.battle;
    const flame = !!(b0 && b0._sacredFlameLaid), shock = b0 ? b0._aftershockLaid : null;
    if(b0){ b0._sacredFlameLaid = false; b0._aftershockLaid = null; }
    const oc = getPStatus(0,'overcharge');
    const ocChance = oc ? (oc.fresh && oc.firstChance != null ? oc.firstChance : (oc.chance||0.25)) : 0;
    /* Only a strike that reached them — landed, or soaked by their block — is
       anything to repeat. With none (the words went wrong, every strike was
       dodged) Overcharge is not rolled at all, and its first rate — certain at
       ✦ — waits for a move that does reach them (2.74). */
    const reached = (hits || []).filter(h=> h && h.t && !h.dodged && ((h.raw != null ? h.raw : h.dmg) > 0));
    const canRepeat = oc && reached.length && livingEnemies().length>0;
    const rolled = canRepeat ? Math.random() < ocChance : false;
    if(canRepeat) spendOverchargeFirst(oc);
    /* ocChance honours the ✦ tier's certain first strike; oc.chance alone was
       using the base rate for every repeat. */
    if(canRepeat && rolled){
      /* A blow that KILLED its target used to leave nothing to repeat — the
         filter dropped the dead and the echo fizzled. It now falls on somebody
         else who is still standing. Every strike is repeated at the figure it
         was planned at, so their block soaks the repeat strike by strike as it
         soaked the first time — as your block does their Overcharge. A strike
         they dodged had nothing planned, so there is nothing of it to repeat. */
      const alive = livingEnemies();
      const again = hits.map(h=>{
        if(!h || !h.t || h.dodged) return null;
        const amount = h.raw != null ? h.raw : h.dmg;
        if(!(amount > 0)) return null;
        if(h.t.hp > 0 && rollDodge(h.t, h.idx, 300)) return { t:h.t, idx:h.idx, oldHp:h.t.hp, newHp:h.t.hp, dmg:0, dodged:true };
        if(h.t.hp > 0) return { t:h.t, idx:h.idx, oldHp:h.t.hp, newHp:Math.max(0,h.t.hp-amount), dmg:amount };
        const t = soulGuardian('enemy') || alive[Math.floor(Math.random()*alive.length)];   // their Steel Soul draws it (2.90)
        if(!t) return null;
        return { t, idx:ui.battle.enemies.indexOf(t), oldHp:t.hp,
                 newHp:Math.max(0, t.hp - amount), dmg:amount, redirected:true };
      }).filter(Boolean);
      if(again.length===0){ finishPlayerTurn(); return; }
      battleMsg('⚡ Overcharge triggers — the attack repeats!');
      if(again.some(h=>h.redirected)) battleMsg('…and finds somebody else.');
      if(flame) setTimeout(()=> laySacredFlame(mon, true), 450);
      if(shock) setTimeout(()=> layAftershock(mon, shock.pct, true), 450);   // a Rampage's Aftershock, the same (2.81)
      bob($('#' + pid('playerBob')), +1);
      setTimeout(()=>{
        applyHits(again);
        reportHits(again);
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
    const outComp = companionOnField();
    const cs = chargeState();
    if(cs && outComp && cs.uid === outComp.uid) triggerDragonLegacy();   // a companion dragon's power passes on
    ui.battle.activeIndex = i;
    setFocus(null);
    const nm = leaderMon();
    if(nm && !nm._entered){ nm._entered = true; applyEntryPassives(nm, nm.species, nm.level, monAtk(nm)); }
    // the successor inherits the Whalelord's slot — no free extra action; his
    // companion (if out) goes back with him, the successor's comes back out
    pairSwitched(mon);
    markActed(nm);
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
  if(m === leaderMon()) ui.battle.standInFor = null;    // back on its feet: no longer stood in for
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
     straight through any guard, as it does in your hands — from whichever of
     yours it goes for (2.84). */
  const mon = enemyPickTarget(e, null) || activeMon();
  if(e.lurk || e.cunning){ breakCover(e); e._ambush = 0; }
  const dmg = Math.ceil((def.direct || 0.33) * e.maxHp);
  const before = mon.currentHp;
  mon.currentHp = Math.max(0, mon.currentHp - dmg);
  { const arv = ariaState(); if(arv) arv.struck = true; }   // an attack all the same
  drainHp(pid('playerHp', mon), before, mon.currentHp, monMaxHp(mon));
  battleMsg(`🕊 ${name} uses <b>Conversio</b> — with nobody to raise, the light turns outward and takes ` +
            `<b>${before - mon.currentHp}</b>.`);
  setTimeout(next, 1100);                   // (a fall is dealt with as the next one moves)
}

function runConversio(mon, def){
  const fallen = ()=> state.party.map((m,i)=>({m,i}))
    .filter(o=>o.m.currentHp <= 0 && !isPassenger(o.m) && o.m !== mon);

  if(!fallen().length){
    const t = livingEnemies()[0];
    if(!t) return afterPlayerAttack(mon, []);
    const dmg = Math.ceil((def.direct || 0.33) * monMaxHp(mon));
    const idx = ui.battle.enemies.indexOf(t);
    breakCover(mon); mon._ambush = 0;
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
      if(m === leaderMon()) ui.battle.standInFor = null;
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
  const soak = blockPlanner();                 // their block, strike by strike
  const all = [], volleys = [];
  let dodged = 0;
  for(let k=0;k<totalHits;k++){
    const volley = [];
    targets.forEach(t=>{
      if(sim.get(t) <= 0) return;
      const idx = b.enemies.indexOf(t);
      if(rollDodge(t, idx, 330 + k*350, ignoresEvasion(mv, mon))){ dodged++; return; }
      let dmg = computeDamage(per, atk, monRef(mon), t, true);
      dmg = enemyGuard(t, dmg);
      const oldHp = sim.get(t), newHp = plannedHp(soak, t, oldHp, dmg);
      sim.set(t, newHp);
      enemyCounter(t, idx, dmg, 520 + k*350);
      const h = { t, idx, dmg, oldHp, newHp };
      volley.push(h); all.push(h);
    });
    volleys.push(volley);
  }
  logBattle(`${displayName(mon)} used ${mv.name} — ${totalHits} strikes on ${targets.length} target(s)`);
  battleMsg(`${mv.name}!`);
  bob($('#' + pid('playerBob')), +1);
  playEffect(mv.name, { type: SPECIES[mon.species].types[0] });
  setTimeout(()=> playVolleys(volleys, 0, ()=>{
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
  }), 330);
}

/* Every damage path must roll evasion, not just the single-hit one. Airborne
   and Unseen were being ignored entirely by multi-hit moves, so a Loong at 70%
   evasion never dodged a single strike of a six-hit barrage. */
/* ------------------------------------------------------------
   COUNTER, in their hands
   A guarded enemy takes a whole attack of yours on one stack (below). It
   deliberately does NOT read damage outside an action of yours — Overheat's
   burn, Aftershock, the Haunting Aria's apparition, your afterimages, your
   riposte — as yours reads none of theirs: those would chip a guard away for
   free.
   ------------------------------------------------------------ */
/* An enemy holding Counter stacks guards instead of returning damage — the
   same 80% as yours, and it comes out of the exchange with a Combo.

   Since 2.72 it braces exactly as yours does. Yours is spent at their ATTEMPT
   — before their blow is dodged or not — and takes the WHOLE attack on the
   guard, every strike of it, repeats and echoes included. Theirs now does the
   same against yours: the first time an action of yours comes at a guarded
   enemy, one stack is spent (dodged or not), and every strike of that action
   on that enemy lands at a fifth. It used to spend a stack per strike, after
   the dodge roll, so a barrage took only its first strike on the guard.
   enemyBrace() is called from rollDodge, which every strike of an attack
   passes through; Grudge, which cannot be dodged, braces through enemyGuard. */
function enemyBrace(t){
  const b = ui.battle;
  if(!b || !t) return 1;
  const seq = b.actionSeq || 0;
  if(!b._brace || b._brace.seq !== seq) b._brace = { seq, map:new Map() };
  const m = b._brace.map;
  if(!m.has(t)) m.set(t, counterCountOf(t) ? spendEnemyCounter(t) : 1);
  return m.get(t);
}
function enemyGuard(t, dmg){
  if(!t || !(dmg > 0)) return dmg;
  const g = enemyBrace(t);
  return g < 1 ? Math.ceil(dmg * g) : dmg;
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
    drainHp(pid('playerHp'), before, m.currentHp, monMaxHp(m));
    showDamageNumber(pid('playerBob'), back);
    battleMsg(`↩️ ${SPECIES[t.species].name} turns your force back on you — ${back}!`);
  }, delay || 520);
  return back;
}

/* A confused monster swings at its own side. With friends on the field it picks
   one at random; alone, it hits itself. Either way something visibly happens. */
function confusedStrike(e, done){
  const b = ui.battle;
  { const f = getPStatus(0,'confusionField'); if(f && f.sure) f.sureUsed = true; }   // your field's certain turn has worked
  /* A muddled swing is still an attempt: its own cover is gone. */
  if(e.lurk || e.cunning){ breakCover(e); e._ambush = 0; renderStatusBadges(); }
  const mates = livingEnemies().filter(x=>x !== e);
  const victim = mates.length ? mates[Math.floor(Math.random()*mates.length)] : e;
  if(victim !== e && (victim.lurk || victim.cunning)){
    battleMsg(`🌀 ${SPECIES[e.species].name} swings wildly at ${SPECIES[victim.species].name} — but it isn't there.`);
    bob(document.getElementById('enemyBob-'+b.enemies.indexOf(e)), -1);
    floatMiss('enemy-'+b.enemies.indexOf(victim), dodgeWord(victim));
    return setTimeout(done, 900);
  }
  const mv = enemyMoveFor(e) || (MOVES[e.species]||[])[0];
  const mult = (mv && mv[2]) || 0.3;
  /* Higher tiers do not turn more swings — they make the turned ones hurt. */
  const conf = getEStatus(e,'discombobulate');
  const power = (conf && conf.ffPower) || 0.60;
  if(conf && conf.once) removeEStatus(e,'discombobulate');     // a Lunacy is one swing
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

/* Does this one blow of yours slip this enemy? EVERY damage path asks here —
   single, twin, AOE, barrage, repeat, echo, afterimage — so no path can forget
   evasion again (twin moves, repeats and echoes all used to land regardless).
   `sure` for a blow that cannot be dodged: a mind-read.
   A strike of an ATTACK meets their Counter first (enemyBrace — spent at your
   attempt, as yours is at theirs). `reflex` marks a blow that is not part of
   an attack of yours — an afterimage at the end of the round, a riposte in
   their turn: no guard is read for it and, as their copies and ripostes make
   none of yours, a Mirage leaves no copies when it slips one. */
function rollDodge(t, idx, delay, sure, reflex){
  if(!reflex) enemyBrace(t);
  const ev = sure ? 0 : enemyEvasion(t);
  if(ev <= 0 || Math.random() >= ev) return false;
  const word = dodgeWord(t);
  setTimeout(()=>{ dodgeEnemy(idx); floatMiss('enemy-'+idx, word); }, delay||0);
  if(reflex) return true;
  noteEnemyMirageDodge(t, idx);
  if(ui.battle) (ui.battle.actionDodges = ui.battle.actionDodges || []).push(t);
  return true;
}

function resolveSplitHits(mv, mon, factor, atk, target){
  const n = mv.hits;
  const per = mv.split ? factor / n : factor;   // split shares the total; others hit full each time
  const tIdx = ui.battle.enemies.indexOf(target);
  const hits = [];
  let simHp = target.hp;
  const soak = blockPlanner();                 // their block, strike by strike
  let dodged = 0;
  for(let i=0;i<n;i++){
    if(simHp<=0) break;
    if(rollDodge(target, tIdx, 330 + i*350, ignoresEvasion(mv, mon))){ dodged++; continue; }   // each strike rolls
    let dmg = computeDamage(per, atk, monRef(mon), target, true);
    dmg = enemyGuard(target, dmg);
    const oldHp = simHp, newHp = plannedHp(soak, target, simHp, dmg);
    simHp = newHp;
    enemyCounter(target, tIdx, dmg, 520 + i*350);   // each strike is answered
    hits.push({ t:target, idx:tIdx, dmg, oldHp, newHp });
  }
  logBattle(`${displayName(mon)} used ${mv.name} — ${hits.length} strikes on ${SPECIES[target.species].name}`);
  hits.forEach((h,i)=>logBattle(`  strike ${i+1}: ${h.dmg} (${h.oldHp}→${h.newHp})`));
  battleMsg(`${mv.name}!`);
  bob($('#' + pid('playerBob')), +1);
  /* aimed at the target itself: every strike may be dodged (a lurking ghost
     dodges them all), and then there is no first hit to aim at */
  playEffect(mv.name, { type: SPECIES[mon.species].types[0], at:'enemy-'+tIdx });
  setTimeout(()=> playSuccessiveHits(hits, 0, ()=>{
    reportHits(hits);                   // the red number: one total for the barrage
    saveProfile();
    battleMsg(hits.length
      ? `${mv.name} struck ${hits.length} time${hits.length===1?'':'s'}!` + (dodged ? ` (${dodged} dodged)` : '')
      : `${mv.name} — every strike dodged!`);
    afterPlayerAttack(mon, hits);
  }, true), 330);
}

/* High tier: hit 2 different living enemies at 0.8x each (or the single enemy once if only 1 exists) */
function resolveMulti2(mv, mon, correct, target){
  if(correct<mv.words){ battleMsg(`${mv.name} missed! (${wordsTag(correct, mv)} words)`); setTimeout(advanceTurn,900); return; }
  breakCover(mon, mv.spendLurk);
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
    const idx = ui.battle.enemies.indexOf(t);
    if(rollDodge(t, idx, 330, ignoresEvasion(mv, mon))) return { t, idx, oldHp:t.hp, newHp:t.hp, dmg:0, dodged:true };
    const dmg = enemyGuard(t, computeDamage(mv.mult, atk, monRef(mon), t, true));
    return { t, idx, oldHp:t.hp, newHp:Math.max(0,t.hp-dmg), dmg };
  });
  logBattle(`${displayName(mon)} used ${mv.name} (High, ${mv.mult}x ATK ${atk}) on ${hits.length} target(s)`);
  hits.forEach(h=>logBattle(`  → ${SPECIES[h.t.species].name} took ${h.dmg} (${h.oldHp}→${h.newHp})`));
  battleMsg(`${mv.name}!`);
  bob($('#' + pid('playerBob')), +1);
  playEffect(mv.name, { type: mv.stoneType || SPECIES[mon.species].types[0], tier: mv.stoneTier,
                        at: hits[0] ? 'enemy-'+hits[0].idx : null });
  setTimeout(()=> playSuccessiveHits(hits, 0, ()=>{
    reportHits(hits);                   // the red numbers, one on each target
    saveProfile();
    battleMsg(`${mv.name} hit ${hits.length} time${hits.length===1?'':'s'}!`);
    afterPlayerAttack(mon, hits);
  }, true), 330);
}

/* Ultra tier: 5-7 random hits (45/35/20) spread across enemies, may repeat a target.
   Screen inverts briefly on use; hits animate at 2x speed in succession. */
function resolveMultiHit(mv, mon, correct, driveTarget){
  if(correct<mv.words){ battleMsg(`${mv.name} missed! (${wordsTag(correct, mv)} words)`); setTimeout(advanceTurn,900); return; }
  breakCover(mon, mv.spendLurk);
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
  const soak = blockPlanner();                 // their block, strike by strike
  const hits=[];
  let dodged = 0;
  for(let i=0;i<n;i++){
    const alive = ui.battle.enemies.filter(e=>sim.get(e)>0);
    if(alive.length===0) break;
    /* A `drive` move lands its FIRST blow where you aimed it, and scatters
       afterwards — repeats on the same target are allowed. */
    /* their Steel Soul draws every strike while it stands (2.90) */
    const guard = soulGuardian('enemy');
    const t = (guard && sim.get(guard) > 0) ? guard
      : (mv.drive && i === 0 && driveTarget && sim.get(driveTarget) > 0)
      ? driveTarget
      : alive[Math.floor(Math.random()*alive.length)];
    const idx = ui.battle.enemies.indexOf(t);
    if(rollDodge(t, idx, 330 + i*350, ignoresEvasion(mv, mon))){ dodged++; continue; }   // an unseen foe slips the blow
    let dmg = computeDamage(mv.mult, atk, monRef(mon), t, true);
    dmg = enemyGuard(t, dmg);
    const oldHp = sim.get(t);
    const newHp = plannedHp(soak, t, oldHp, dmg);
    sim.set(t, newHp);
    enemyCounter(t, idx, dmg, 520 + i*350);
    hits.push({ t, idx, oldHp, newHp, dmg });
  }
  invertScreen();
  logBattle(`${displayName(mon)} used ${mv.name} (Ultra) — rolled ${n} hits, landed ${hits.length}`);
  hits.forEach((h,i)=>logBattle(`  hit ${i+1} → ${SPECIES[h.t.species].name} took ${h.dmg} (${h.oldHp}→${h.newHp})`));
  battleMsg(`${mv.name} unleashed!`);
  bob($('#' + pid('playerBob')), +1);
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

/* The mirror of the two above, for a monster of yours (2.87). Returns what
   to add to the blow's message. */
function playerThresholdPunish(mon, e){
  if(!mon || !e || e.hp <= 0) return '';
  const frac = mon.currentHp / Math.max(1, monMaxHp(mon));
  let out = '';
  const pass = (list, hit)=> (list || []).filter(th=> frac <= th && !hit.includes(th));
  if(mon.thresholdStun && mon.thresholdStun.length){
    mon.thresholdsHit = mon.thresholdsHit || [];
    const crossed = pass(mon.thresholdStun, mon.thresholdsHit);
    if(crossed.length){
      crossed.forEach(th=> mon.thresholdsHit.push(th));
      if(passivesMuted(mon)) out += ` 🔇 The curse swallows ${displayName(mon)}'s howl.`;
      else if(!getEStatus(e,'paralysed')){
        addEStatus(e, { type:'paralysed', turnsLeft:1 });        // their dust may keep it from forming
        out += getEStatus(e,'paralysed')
          ? ` 💫 ${displayName(mon)} howls — ${SPECIES[e.species].name} is stunned!`
          : ' 💎 Their diamond dust turns the howl aside.';
      }
    }
  }
  if(mon.thresholdSleep && mon.thresholdSleep.length){
    mon.sleepThresholdsHit = mon.sleepThresholdsHit || [];
    const crossed = pass(mon.thresholdSleep, mon.sleepThresholdsHit);
    if(crossed.length){
      crossed.forEach(th=> mon.sleepThresholdsHit.push(th));
      if(passivesMuted(mon)) out += ` 🔇 The curse swallows ${displayName(mon)}'s song.`;
      else if(!getEStatus(e,'asleep')){
        addEStatus(e, { type:'asleep', turnsLeft:2, mine:true });
        out += getEStatus(e,'asleep')
          ? ` 💤 ${displayName(mon)} sings — ${SPECIES[e.species].name} cannot keep its eyes open!`
          : ' 💎 Their diamond dust turns the song aside.';
      }
    }
  }
  if(out) renderStatusBadges();
  return out;
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

/* One strike of a played-back move landing (landStrike does the landing:
   their block, the HP, the flash, the bar, a fall). */
function landHit(h){
  /* Leech Seed on a multi-hit move healed silently — no message, and only the
     active monster's bar moves — so there was no way to tell it had worked.
     Tally it and announce the total when the barrage finishes. */
  const got = landStrike(h);
  if(got > 0){
    leechHealParty(got, activeMon());
    if(ui.battle) ui.battle._leechTally = (ui.battle._leechTally||0) + got;
  }
}
/* Strikes one after another, 350 ms apart. */
function playSuccessiveHits(hits, i, done, fast){
  return playVolleys(hits.map(h=> [h]), i, done);
}
/* Volleys one after another, 350 ms apart; every strike in a volley lands at
   the same moment. An AOE barrage is a volley per strike — Rampage's five
   strikes hit every enemy together, five times, not each enemy in turn. */
function playVolleys(volleys, i, done){
  if(i>=volleys.length){
    const tally = ui.battle && ui.battle._leechTally;
    if(tally > 0){
      ui.battle._leechTally = 0;
      const n = battleParty().filter(m=>m.currentHp>0).length;
      setTimeout(()=> battleMsg(
        `🌿 The seeds drink deep — <b>${tally} HP</b> to each of your ${n} standing monster${n>1?'s':''}.`), 350);
    }
    done(); return;
  }
  (volleys[i] || []).forEach(landHit);
  setTimeout(()=> playVolleys(volleys, i+1, done), 350);
}

/* Very High tier: single status application, per-type effect (see applyVeryHighEffect) */
function resolveStatusMove(mv, mon, target, correct){
  if(correct<mv.words){ battleMsg(`${mv.name} missed! (${wordsTag(correct, mv)} words)`); setTimeout(advanceTurn,900); return; }
  /* Their Diamond Dust scatters any stone of yours — except your own dust,
     which sweeps theirs away first. The stone is not spent, and a cast is
     instant, so the turn is still yours. */
  if(mv.stoneType !== 'Fairy' && dustBlocks('player')){
    ui.battle.usedVeryHigh[mon.uid] = false;
    playSfx('move_miss');
    ui.battle.phase = 'player';
    renderBattle();
    battleMsg(`💎 Their diamond dust scatters your ${mv.name} — nothing takes hold. It is still your turn.`);
    return;
  }
  const atk=monAtk(mon);
  const targets = target ? [target] : [];
  const res = applyVeryHighEffect(mv.stoneType, mon, atk, targets, mv.stonePlus||0);
  bob($('#' + pid('playerBob')), +1);
  playEffect(mv.name, { type: mv.stoneType, tier:'veryhigh', at: target ? 'enemy-'+ui.battle.enemies.indexOf(target) : null });
  setTimeout(()=>{
    let hits = [];
    if(res.hits && res.hits.length){
      hits = res.hits.map(h=>({ t:h.enemy, idx:ui.battle.enemies.indexOf(h.enemy), oldHp:h.enemy.hp, newHp:Math.max(0,h.enemy.hp-h.dmg), dmg:h.dmg }));
      applyHits(hits);
      reportHits(hits);
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

/* 'best' picks its strongest blow when it is built (e.move). Some monsters'
   strongest moves have no damage figure, so that pick never reached them:
     a throw that returns what it just took (Seoi Nage, Four Ounces) — used
       when the throw would hit harder than its best blow;
     Charm or Disrupt — cast when your side has neither, then back to blows.
   Returns the move to use instead, or null. */
function bestSpecial(e){
  const mon = activeMon();
  if(!mon) return null;
  const list = (MOVES[e.species] || []).filter(m=> m[1] != null && m[2] == null && m[6] && (e.level || 1) >= m[5]);
  for(const m of list){
    const x = m[6];
    if(x.reflect && e.lastDamageTaken > 0){
      const back = Math.ceil(e.lastDamageTaken * x.reflect);
      const mv = e.move || [], ex = mv[6] || {};
      const hits = (ex.hits > 1 && !ex.split) ? ex.hits : 1;
      const usual = mv[2] != null ? computeDamage(mv[2], enemyAtk(e), e, monRef(mon), false) * hits : 0;
      if(back > usual) return m;
    }
    if(x.charm && !getPStatus(0,'charmed') && !enemyStatusBlocked('charmed')) return m;
    if(x.disrupt && !getPStatus(0,'disrupt') && !enemyStatusBlocked('disrupt')) return m;
  }
  return null;
}
/* An evolved wild monster fights unpredictably: it picks from its whole
   unlocked moveset each turn instead of always using the same attack. */
function enemyMoveFor(e){
  /* The Don's dragon opens by charging Cataclysm Max for three turns, then
     hyperbeams every turn after. Its charge is tracked on the enemy itself. */
  if(e.ai === 'ankylo'){
    e.turnsTaken = (e.turnsTaken||0) + 1;
    if(e.turnsTaken === 1){
      /* the real row, so the Steel Soul it opens with is one (2.81) */
      const ss = (MOVES[e.species] || []).find(m=> m[6] && m[6].soul);
      return ss || ['Power2','Steel Soul',null,'Self',4,35,{soul:{turns:3, reduce:0.2, bonus:0.1}}];
    }
    const mx = MOVES[e.species].find(m=>m[0]==='Max');
    return mx || e.move;
  }
  if(e.ai === 'cataclysm'){
    e.chargeTurns = (e.chargeTurns||0) + 1;
    if(e.chargeTurns <= 3) return ['Charge','Cataclysm Max',null,'Charge',0,0];
    const charges = 3;
    /* the same table as yours (Hyperbeam Max: 2.85× at 3 charges) */
    const mx = (MOVES[e.species] || []).find(m=> m[0] === 'Max' && m[6] && m[6].charge);
    return ['Ultimate','Hyperbeam', chargeMult(mx ? mx[6].charge : { hyper:1.75, unleash:1.25 }, 'hyper', charges),'Single',0,0];
  }
  if(e.ai !== 'random'){
    /* 'best' also knows when its best move has no damage figure. */
    if(e.ai === 'best'){ const sp = bestSpecial(e); if(sp) return sp; }
    return e.move;
  }
  /* Its pick was rolled when the order was built (a first-strike move has to
     be known then); use that one. */
  if(e._planned){ const m = e._planned; e._planned = null; return m; }
  const sp = SPECIES[e.species];
  const avail = MOVES[e.species].filter(m=>m[1]!=null && e.level>=m[5] && m[2]!=null);
  if(!avail.length) return e.move;
  return avail[Math.floor(Math.random()*avail.length)];
}

function runEnemyAttack(i){
  const b = ui.battle;
  setFocus(null);                    // who each blow is aimed at is decided blow by blow

  // One of yours went down mid-sequence: stop here, no free swings.
  if(fieldNeedsFaint()){
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
    if(fieldNeedsFaint()){ return setTimeout(onMonFainted,700); }
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
  /* Asleep: it does nothing at all, and wakes a turn later. Checked before a
     move is chosen, so a sleeping monster's script does not advance. */
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
  return enemyActs(i, e);
}

/* ============================================================
   THE ENEMY'S ACTION PROPER
   A stone cast first if it carries one (instant, as yours is), then its move.
   Anything that deals no damage — a charge, a climb, a wind-up, a Stalk — is
   handled BEFORE the attempt point, so a Lurk survives it and the Whalelord's
   grudge does not count it. From the attempt point on it is an attack: cover
   breaks, the Aria and your evasion get their say, and what lands sets off
   Cunning, Greed, their Leech Seed and their Overcharge.
   ============================================================ */
function enemyActs(i, e){
  const b = ui.battle;
  if(!b) return;
  const idx = b.enemies.indexOf(e);
  const name = SPECIES[e.species].name;
  const next = ()=> runEnemyAttack(i+1);

  /* Their companion (2.87): its leader calls it out at the start of its own
     action — free, as your summon keeps your turn — and then acts. */
  if(foeCanSummon(e)){
    const said = foeSummon();
    renderBattle();
    if(said) battleMsg(said);
    return setTimeout(()=> enemyActs(i, e), 1300);
  }
  /* A trainer's stone, cast on its first action. Under your dust it waits —
     except Diamond Dust itself, which sweeps yours away first. */
  if(e.stone && e.stone.cast && !e.stone.used && (e.stone.type === 'Fairy' || !dustBlocks('enemy'))){
    e.stone.used = true;
    const msg = castEnemyVeryHigh(e, e.stone.type, e.stone.plus || 0);
    renderStatusBadges();
    if(msg) battleMsg(msg);
    playEffect((VERY_HIGH[e.stone.type] || {}).name || e.stone.type, { type:e.stone.type, tier:'veryhigh' });
    return setTimeout(()=> enemyActs(i, e), 1500);
  }

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
      if(rg){ rageState(e).forced = true; battleMsg(`🐉 ${name} works itself into a rage.`); }
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
  /* Thundercat, Loong and the Goblin Knight swing their biggest thing every time. */
  if(e.ai === 'maxer'){
    move = (MOVES[e.species]||[]).find(m=>m[0]==='Max' && e.level >= m[5]) || move;
  }
  /* The eagle climbs for three turns and then falls on you. */
  if(e.ai === 'stoop'){
    const stoop = (MOVES[e.species] || []).find(m=>m[6] && m[6].stoop);
    if(stoop) move = stoop;
  }
  /* A cormorant does one thing. */
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
  /* A Ghost Flame does one thing, and it takes two turns to do it. */
  if(e.species === 'ghost_flame'){
    const x = (MOVES.ghost_flame || []).find(m=>m[6] && m[6].extinguish && e.level >= m[5]);
    if(x) move = x;
  }
  /* A Horned Lynx pounces from hiding, slips back into hiding, and pounces. */
  if(e.species === 'horned_lynx'){
    const list = MOVES.horned_lynx || [];
    const pounce = list.find(m=>m[0]==='Max' && e.level >= m[5]) || list.find(m=>m[0]==='Ultimate' && e.level >= m[5]);
    const stalk = list.find(m=>m[6] && m[6].grant && m[6].grant.lurk && e.level >= m[5]);
    move = (!e.lurk && stalk && !dustBlocks('enemy')) ? stalk : (pounce || move);
  }
  /* Something wound up last turn comes down now, whatever else it had in mind. */
  if(e._windup) move = e._windup;
  /* Its two gifts, turned the other way. These have no damage figure, so they
     must never fall through to the ordinary strike. */
  if(move && move[6] && move[6].vita)      return enemyVita(e, move[6].vita, next);
  if(move && move[6] && move[6].conversio) return enemyConversio(e, move[6].conversio, next);
  if(e.isDummy && e.arenaMove && e.arenaMove !== 'auto'){
    const list = MOVES[e.species] || [];
    const forced = list.find(m=>m[0] === e.arenaMove && m[1] != null);
    if(forced) move = forced;
    /* The arena's opponent throwing an Ultra stone, as you would. (Its Very
       High stone is carried in e.stone and cast above, on its first action.) */
    if(e.arenaMove === 'ultra' && e.arenaUltra) move = enemyUltraMove(e.arenaUltra.type, e.arenaUltra.plus);
  }
  const ex = move[6] || {};

  /* ---- moves that deal no damage: not an attempt ---- */
  // a charging turn does no damage at all
  if(move[0] === 'Charge' && !ex.stoop){
    playEffect(move[1], { type:'Water', duration:700 });
    bob(document.getElementById('enemyBob-'+idx), -1);
    setTimeout(()=>{
      battleMsg(`⚡ ${name} gathers power… (${e.chargeTurns}/3)`);
      setTimeout(next, 900);
    }, 400);
    return;
  }
  /* Piercing Stoop: the climb is not an attack, so nothing dodges it. */
  if(ex.stoop && stoopState(e).charges < (ex.stoop.max || 3)){
    const n = stoopCharge(e, ex.stoop);
    renderStatusBadges();
    bob(document.getElementById('enemyBob-'+idx), -1);
    battleMsg(`🦅 ${name} climbs — <b>${n}</b> of ${ex.stoop.max}. It is much harder to see up there.`);
    return setTimeout(next, 900);
  }
  /* A wind-up (Burn Bright, Grave Quake's first turn): it gathers, and a Lurk
     holds through it. The move comes down on its next action. */
  if(ex.windup && e._windup !== move){
    e._windup = move;
    renderStatusBadges();
    bob(document.getElementById('enemyBob-'+idx), -1);
    playEffect(ex.windup.name || move[1], { type:e.types[0], duration:700 });
    battleMsg((ex.windup.say || `{name} gathers itself…`).replace('{name}', name));
    return setTimeout(next, 1100);
  }
  /* Charm and Disrupt in their hands: a cast on your side, not a blow — so it
     is not an attempt, and no block, guard or dodge of yours meets it (it used
     to go through as a blow of 0, spending a block stack on nothing). */
  if(ex.charm || ex.disrupt){
    bob(document.getElementById('enemyBob-'+idx), -1);
    playEffect(move[1], { type:e.types[0], at:pid('playerBob') });
    if(ex.charm){
      if(enemyStatusBlocked('charmed')) battleMsg(`${name} uses ${move[1]} — the diamond dust scatters the charm.`);
      else { setPStatus(0, { type:'charmed', turnsLeft:(ex.charm.turns || 5) + 1, chance:ex.charm.chance || 0.20 });
             battleMsg(`💗 ${name} uses <b>${move[1]}</b> — your team is charmed, and may lose a turn!`); }
    } else {
      if(enemyStatusBlocked('disrupt')) battleMsg(`${name} uses ${move[1]} — the diamond dust holds your signal clear.`);
      else { setPStatus(0, { type:'disrupt', turnsLeft:ex.disrupt.turns || 5, stun:ex.disrupt.stun || 0.15 });
             battleMsg(`📡 ${name} uses <b>${move[1]}</b> — your signals are jammed: they move first, and you may seize up!`); }
    }
    renderStatusBadges();
    return setTimeout(next, 1100);
  }
  /* Steel Soul in their hands (the wild Ankylosaurus opens with it): a cast on
     itself, not a blow — the mirror of yours, its alone: for 3 turns 20% less
     damage taken, 20% more dealt and +0.1× ATK on every hit it lands, and
     every single blow of yours drawn to it (2.90). Until 2.81 it went through
     as an attack of 0: no Steel Soul at all, and a Counter stack of yours spent
     on nothing. */
  if(ex.soul){
    bob(document.getElementById('enemyBob-'+idx), -1);
    playEffect(move[1], { type:'Steel', at:'enemy-' + idx });
    const st = setESide({ type:'steelSoul', turnsLeft:ex.soul.turns + 1, max:ex.soul.turns + 1,
                          reduce:ex.soul.reduce, bonus:ex.soul.bonus, owner:e });
    renderStatusBadges();
    const amp = st ? steelSoulAmp(e, false) : 1;
    const more = amp > 1 + ex.soul.reduce + 1e-9 ? ` — ×${+amp.toFixed(2)} with their other shields up —` : '';
    battleMsg(st ? `🛡 ${name} uses <b>${move[1]}</b> — for ${ex.soul.turns} turns it takes ${Math.round(ex.soul.reduce*100)}% less, ` +
                   `hits ${Math.round(ex.soul.reduce*100)}% harder${more} (+${ex.soul.bonus}× ATK a hit), and every single blow of yours must go through it.`
                 : `${name} uses ${move[1]} — the diamond dust scatters it.`);
    return setTimeout(next, 1100);
  }
  /* Stalk: back into hiding. */
  if(ex.grant && ex.grant.lurk){
    const ok = grantLurk(e, true);
    renderStatusBadges();
    battleMsg(ok ? `🌑 ${name} melts back into the dark.` : `${name} looks for somewhere to hide — the dust leaves nowhere.`);
    return setTimeout(next, 900);
  }

  /* ---- an ATTEMPT: from here on this is an attack ---- */
  /* Every damaging move an enemy ATTEMPTS is remembered — once per move,
     landed or not. The Haunting Aria remembers too: any attack on your side,
     even one that passes straight through, makes the apparition's next strike
     certain. And whatever hid this monster is gone. */
  noteWrath();
  { const arv = ariaState(); if(arv) arv.struck = true; }
  if(e.lurk || e.cunning){ breakCover(e, ex.spendLurk); renderStatusBadges(); }
  if(e._windup === move) e._windup = null;
  /* Who it goes for (2.84): one of yours — or, an area move, every one of
     yours on the field (a twin blow takes one each, a splash catches the
     other, an Ultra's strikes scatter). Each is struck in turn, in focus
     while it is: its own guard, its own dodge, its own block. What the attack
     sets off as a whole — their Leech Seed's message, Greed, Cunning, a fish,
     the moonlight, their Overcharge — comes once, at the end. */
  const plan = enemyTargetPlan(e, move);
  if(!plan.length){ e._ambush = 0; burnOut(e, ex); return setTimeout(next, 600); }
  enemyStrikeStep({ i, e, idx, name, move, ex, next, plan, k:0, told:false,
                    defs:[], totalTaken:0, seedsFed:0, victims:[], lastWait:700, pendingMsg:'' });
}
/* The next of yours this attack reaches — or, everyone struck, its end. */
function enemyStrikeStep(ctx){
  if(!ui.battle) return;
  while(ctx.k < ctx.plan.length){
    const step = ctx.plan[ctx.k++];
    if(step.mon && step.mon.currentHp > 0 && livingField().includes(step.mon)){
      setFocus(step.mon);
      return enemyStrikeOn(ctx, step, ()=> enemyStrikeStep(ctx));
    }
  }
  enemyStrikeWrap(ctx);
}
/* Is anyone of yours still to be struck by this attack after this one? */
function moreToStrike(ctx){
  return ctx.plan.slice(ctx.k).some(s=> s.mon && s.mon.currentHp > 0 && livingField().includes(s.mon));
}
/* One of yours, struck (the one in focus): its guard, the Aria, its dodge,
   then the blow itself. `done` goes on to the next — or to the end. */
function enemyStrikeOn(ctx, step, done){
  const b = ui.battle;
  const { e, idx, name, move, ex } = ctx;
  const mon = step.mon;
  const pair = ctx.plan.length > 1;
  const last = ()=> !moreToStrike(ctx);
  /* between two of yours, a breath; after the last, the attack's end decides */
  const pause = (ms)=>{ if(last()){ ctx.lastWait = ms; return done(); } setTimeout(done, ms); };
  /* A Counter stack braces against the WHOLE attack — however many hits it
     carries — and turns away four fifths of it. The blow still lands, which is
     what makes the Enrage feel earned. Only during an action phase: pre-hits
     and end-phase damage cannot waste one. Each of yours it reaches braces
     for itself. */
  let counterMult = 1;
  if(counterStacks() > 0 && !ex.stoop){        // a stoop is not an attack a guard can read
    counterMult = spendCounterStack(mon);
    if(counterMult < 1){
      counterDrift(document.getElementById(pid('playerBob')), document.getElementById(pid('playerBob')));
      floatMiss(pid('playerBob'), 'GUARD');
    }
  }
  /* A turn of Haunting Aria covers the whole FIELD, so whoever stands in it is
     untouchable; and if the Whalelord is struck with no Aria running, he sings
     by reflex and the blow finds nothing where he was. */
  const ariaCover = ariaFieldEvasion() > 0;
  const canReflex = !ariaCover && !ariaActive()
                 && (MOVES[mon.species]||[]).some(m=>m[6] && m[6].aria);
  if(ariaCover || (canReflex && ariaReflex(mon))){
    noteAriaCover();                         // the untouchable turn has done its work this round
    dodgePlayer(); floatMiss(pid('playerBob'), 'MISS');
    if(ariaCover) battleMsg('The attack passes harmlessly through.');
    if(last()){ e._ambush = 0; burnOut(e, ex); }   // a Ghost Flame spends itself either way
    const rip = playerRiposte(e);            // it dealt nothing: a Knight answers
    return pause(rip ? 1500 : 800);
  }
  /* Every evasion source rolls separately and stacks multiplicatively — unless
     the blow is a mind-read (their Abyssal Gaze, their stolen Tachypsychia). */
  const tacAny = getPStatus(0,'tachy');
  const tac = (tacAny && tacAny.owner === mon.uid) ? tacAny : null;   // its caster's alone (2.80)
  const tacE = getESide('tachy');
  const sure = !!ex.mindRead || !!(tacE && tacE.owner === e);
  const evadeChance = sure ? 0 : playerEvasionFrom(e);
  /* Same reasoning as the bonus action: if Tachypsychia is about to expire and
     has never once caused a miss, make this one miss. */
  const tacLast = !sure && tac && (tac.turnsLeft||0) <= 1 && !tac.evadedOnce;
  const evaded = tacLast || (evadeChance > 0 && Math.random() < evadeChance);
  // the window advances once per ROUND, handled at round end
  if(evaded && tac) tac.evadedOnce = true;

  if(!ctx.told){
    ctx.told = true;
    bob(document.getElementById('enemyBob-'+idx), -1);
    battleMsg(`${name} used ${move[1]}!` +
      (step.shielded ? ` 🛡 ${displayName(mon)}'s Steel Soul draws the blow away from ${displayName(step.shielded)}!` : ''));
  }

  if(evaded){
    setTimeout(()=>{
      const pm = mon;
      dodgePlayer();
      floatMiss(pid('playerBob'), dodgeWord(pm));
      noteMirageDodge();          // every evaded blow leaves a copy standing
      battleMsg(pm && pm.lurk ? `🌑 ${name} can't find ${displayName(pm)} in the dark!`
             : pm && pm.cunning ? `🌘 ${displayName(pm)} is already somewhere else — ${name} missed!`
             : tac ? `⚡ Lightning reflexes — ${name} missed!`
             : getPStatus(0,'mirage') ? `💨 The mirage shimmers — ${name} missed!`
             : pair ? `💨 ${name} missed ${displayName(pm)}!`
             : `💨 ${name} missed!`);
      if(last()){ e._ambush = 0; burnOut(e, ex); }
      const rip = playerRiposte(e);
      pause(rip ? 1500 : 700);
    }, 300);
    return;
  }

  playEffect(move[1], { type: e.types[0], at:pid('playerBob') });

  setTimeout(()=>{
    if(!ui.battle) return;
    setFocus(mon);
    /* Piercing Stoop comes down: not an attack at all, health simply taken —
       no block spent, no guard, no reduction, no damage bonus. */
    if(ex.stoop){
      e._ambush = 0;
      const rel = stoopRelease(e, ex.stoop);
      const before = mon.currentHp;
      mon.currentHp = Math.max(ui.battle.allyUnkillable ? 1 : 0, mon.currentHp - (rel.hits || 0));
      { const ar = ariaState(); if(ar) ar.struck = true; }
      flashHit($('#' + pid('playerBob')));
      showDamageNumber(pid('playerBob'), before - mon.currentHp);
      drainHp(pid('playerHp'), before, mon.currentHp, monMaxHp(mon));
      playSfx('hit_taken');
      battleMsg(`🦅 <b>PIERCING STOOP</b> — it comes down out of the sun. ` +
                `<b>${before - mon.currentHp}</b> health simply gone. Nothing stops it.`);
      renderStatusBadges();
      return setTimeout(()=>{
        if(mon.currentHp <= 0) return setTimeout(onMonFainted, 650);
        setFocus(null);
        ctx.next();
      }, 1000);
    }
    let dmg;
    if(ex.reflect){
      /* Seoi Nage / Four Ounces in ENEMY hands: the exact figure it last took,
         guard absorption included. computeDamage would have been handed a null
         multiplier and returned nothing at all. */
      dmg = Math.ceil((e.lastDamageTaken || 0) * ex.reflect);
      if(dmg <= 0){
        battleMsg(`${name} tried ${move[1]} — but there was nothing to give back.`);
        e._ambush = 0;
        return setTimeout(ctx.next, 800);
      }
      if(!ctx.saidReflect){ ctx.saidReflect = true; battleMsg(`↩️ ${name} returns your own force — ${dmg}!`); }
    } else if(ex.grudge){
      dmg = Math.ceil((ex.grudge.flat||0.25) * enemyAtk(e)
                    + (ex.grudge.missing||0.75) * Math.max(0, e.maxHp - e.hp));
    } else if(ex.extinguish){
      /* Extinguish: everything it has left, half as much again. Type does not
         come into it; their side's damage buffs and your armour do. */
      dmg = computeDamage(ex.extinguish.hpMult || 1.5, e.hp, { types:[] }, monRef(mon), false);
    } else {
      /* `split` means the multiplier is the TOTAL, shared across the strikes —
         Verdant Wrath Max is 1.8 over three hits, not 1.8 three times. Without
         this the Forest Fairy would hit for 5.4× its ATK. */
      const per = (ex.hits > 1 && ex.split && !step.hits) ? move[2] / ex.hits : move[2];
      dmg = computeDamage(per, enemyAtk(e), e, monRef(mon), false);
      /* What the attacker brings to the whole attack, reckoned once — your
         weaken on it (used up when the attack ends), a guard it pulled off
         earlier, a critical — and applied to each of yours it reaches. */
      if(!ctx.mults){
        ctx.mults = { combo:1, rage:1 };
        if(getEStatus(e,'softened')) ctx.softened = true;
        // a guard it pulled off earlier makes this swing heavier
        if(e.comboStacks){
          const cE = getESide('counter');
          ctx.mults.combo = 1 + e.comboStacks * ((cE && cE.combo) || 0.25);
          e.comboStacks = 0;
        }
        /* Rage: a free 20% critical, or a bought certainty. */
        ctx.mults.rage = rageMultiplier(e);
      }
      if(ctx.mults.combo !== 1) dmg = Math.ceil(dmg * ctx.mults.combo);
      if(ctx.mults.rage !== 1) dmg = Math.ceil(dmg * ctx.mults.rage);
      /* Overpower: +25% outright, and a quarter again on anything smaller. */
      const op = overpowerOf(e);
      if(op){
        dmg = Math.ceil(dmg * (1 + op.atk));
        if(monAtk(mon) < e.atk) dmg = Math.ceil(dmg * op.bully);
      }
    }
    if(ex.fullHpDouble && e.hp >= e.maxHp){
      dmg = Math.ceil(dmg * 2);
      if(!ctx.saidFull){ ctx.saidFull = true; battleMsg(`${name} is untouched — the blow lands at full force!`); }
    }
    if(step.scale) dmg = Math.ceil(dmg * step.scale);         // the splash that catches the other
    if(counterMult < 1) dmg = Math.ceil(dmg * counterMult);   // taken on the guard

    const spikes = getPStatus(0,'spikeArmour');
    let msg = '';

    /* An enemy's multi-hit move now actually strikes that many times. It only
       ever landed once, so a Verdant Wrath Max was dealing a third of its
       designed damage and Volt Concussion a quarter. The Counter guard covers
       the WHOLE attack (it was already applied above), and block is spent per
       strike, exactly as it is when the player swings. */
    let hitCount = step.hits || Math.max(1, (ex.hits && !ex.reflect && !ex.grudge) ? ex.hits : 1);
    /* Murder of Crows: something already failing draws twice the birds. */
    if(ex.execute && mon.currentHp / Math.max(1, monMaxHp(mon)) < (ex.execute.below || 0.30)){
      hitCount = ex.execute.hits || hitCount * 2;
      msg = `The crows smell weakness! `;
    }
    let totalTaken = 0;
    let seedsFed = 0;
    {
      const oldHp = mon.currentHp;
      let totalBlocked = 0;
      for(let k = 0; k < hitCount; k++){
        if(mon.currentHp <= 0 && !ui.battle.allyUnkillable) break;
        let thisHit = dmg;
        const beforeBlock = thisHit;
        thisHit = applyBlock(mon, thisHit, pid('playerBlk'));   // one stack per strike
        totalBlocked += beforeBlock - thisHit;
        mon.lastDamageTaken = beforeBlock;   // reflection returns the FULL figure
        const floor = ui.battle.allyUnkillable ? 1 : 0;
        const was = mon.currentHp;
        mon.currentHp = Math.max(floor, mon.currentHp - thisHit);
        totalTaken += was - mon.currentHp;
        /* Their Leech Seed drinks from every strike that gets through, as
           yours drinks from every strike of yours on a seeded enemy. */
        if(thisHit > 0) seedsFed += theirSeedsDrink(e);
      }
      if(totalBlocked > 0) floatBlocked(pid('playerBob'), totalBlocked);
      const ar = ariaState();
      if(ar) ar.struck = true;                // the dead whale takes note
      if(ui.battle.arenaImmortal && mon.currentHp <= 0){
        mon.currentHp = monMaxHp(mon);          // back to full, test continues
        msg += ' (immortal — restored)';
      }
      flashHit($('#' + pid('playerBob')));
      showDamageNumber(pid('playerBob'), oldHp - mon.currentHp);
      playSfx('hit_taken');
      drainHp(pid('playerHp'), oldHp, mon.currentHp, monMaxHp(mon));
      const who = pair ? ` to ${displayName(mon)}` : '';
      msg += hitCount > 1
        ? `${name} struck ${hitCount} times for ${totalTaken} damage${who}!`
        : `${name} dealt ${totalTaken} damage${who}!`;
      if(totalBlocked > 0) msg = `🛡 Blocked ${totalBlocked}! ` + msg;

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
    /* A blow that weakens (Sky Splitter Max, Boo!, Wail): the next attack of
       the one it hit may land soft. */
    const sf = ex.softenHit;
    if(sf && totalTaken > 0 && Math.random() < sf.chance){
      if(enemyStatusBlocked('softened')){ msg += ' The diamond dust holds your strength intact.'; }
      else { setPStatus(0, { type:'softened', turnsLeft:2, amount:sf.amount }); msg += pair ? ` ${displayName(mon)}'s next attack is weakened!` : ' Your next attack is weakened!'; }
      renderStatusBadges();
    }
    /* A blow that stuns (Evil Eye, Shield Bash, Tesla Bolt…) — these never
       stunned anyone when an enemy threw them. */
    const stunPct = ex.stunHit || ex.paralyse || ex.stun;
    if(stunPct && totalTaken > 0 && mon.currentHp > 0 && !getPStatus(0,'stunned') && Math.random() < stunPct){
      if(enemyStatusBlocked('stunned')){ msg += ' The diamond dust keeps you steady.'; }
      else { setPStatus(0, { type:'stunned', turnsLeft:2 }); msg += ` ${displayName(mon)} is stunned!`; }
      renderStatusBadges();
    }
    /* Yours punish a threshold as theirs do (2.87): a Thunderhound driven
       below 75/50/25% stuns whoever drove it there; a Moon Swan sings it to
       sleep. Theirs only ever worked on you. */
    if(totalTaken > 0 && mon.currentHp > 0) msg += playerThresholdPunish(mon, e);
    ctx.defs.push({ mon, dmg, hitCount, taken:totalTaken });
    ctx.totalTaken += totalTaken;
    ctx.seedsFed += seedsFed;
    if(totalTaken > 0) ctx.victims.push(mon);
    else playerRiposte(e);                  // all of it soaked: a Knight answers

    // arena convenience
    if(b.autoHeal && mon.currentHp>0 && mon.currentHp<monMaxHp(mon)){
      const max = monMaxHp(mon), was = mon.currentHp;
      mon.currentHp = max;
      drainHp(pid('playerHp'), was, max, max);
      msg += ' (auto-healed)';
    }
    if(last()){ ctx.pendingMsg = msg; return done(); }
    saveProfile();
    renderStatusBadges();
    logBattle(`${name} → ${msg}`);
    battleMsg(msg);
    setTimeout(done, 750);
  }, 330);
}
/* The attack is over: what it sets off as a whole, once — and then their
   follow-ups, or the next of them. */
function enemyStrikeWrap(ctx){
  const b = ui.battle;
  if(!b) return;
  const { i, e, idx, name, move, ex, next } = ctx;
  e._ambush = 0;                          // the ambush was this attack's alone
  if(ctx.softened && getEStatus(e,'softened')) removeEStatus(e,'softened');   // your weaken is used up
  if(!ctx.defs.length){                   // it met nothing: every blow slipped or passed through
    burnOut(e, ex);
    setFocus(null);
    return setTimeout(next, ctx.lastWait);
  }
  let msg = ctx.pendingMsg || '';
  /* (Charm and Disrupt in their hands are casts now, handled before the
     attempt point above.) */
  /* Fiery Jaws: it takes hold, and what it has hold of does not leave. */
  if(ex.jaws && !enemyStatusBlocked('jaws')){
    ui.battle.noFlee = true;
    setPStatus(0, { type:'jaws', turnsLeft:3 });
    livingEnemies().forEach(x=>{ if(x.elusive) pinDown(x); });   // dispel first
    renderStatusBadges();
    setTimeout(()=> battleMsg(`🔥 ${name} has hold of you — no switching, no running.`), 600);
  }
  /* A quarter of its dives come up with something worth eating. */
  const fish = ex.fish;
  if(fish && Math.random() < fish.chance){
    const back = Math.ceil(fish.heal * e.maxHp);
    const before = e.hp;
    e.hp = Math.min(e.maxHp, e.hp + back);
    drainHp('enemyHp-'+idx, before, e.hp, e.maxHp);
    setTimeout(()=> battleMsg(`🐟 ${name} surfaces with a fish and swallows it whole — <b>+${e.hp-before} HP</b>.`), 700);
  }
  /* Lunacy is Discombobulate wearing a different hat — one turn of certain
     friendly fire at full power. In their hands the moonlight gets into YOUR
     heads: every monster of yours on the field is muddled until it has swung
     (its next blow lands on its partner, or itself alone). Your dust keeps it
     out. (2.88: it used to muddle their own side, and yours did nothing.) */
  const lun = ex.lunacy;
  if(lun && Math.random() < (lun.chance || 0.25) && !enemyStatusBlocked('discombobulate')){
    livingField().forEach(pm=> withFocus(pm, ()=> markPlayerConfused(lun.ffPower || 1.0, true)));
    renderStatusBadges();
    msg += ' The moonlight gets into your heads!';
  }
  /* Their Nova (2.90): one of your buffs swept away, one of your marks on
     them burnt off. */
  if(ex.purge){
    const said = novaPurge('enemy', ex.purge);
    if(said){ renderStatusBadges(); msg += ' ' + said; }
  }
  // Life-stealing moves restore the attacker from its own ATK
  const pct = LIFESTEAL[move[1]];
  if(pct && e.hp>0){
    const before = e.hp;
    e.hp = Math.min(e.maxHp, e.hp + Math.ceil(pct*e.atk));
    if(e.hp>before){
      drainHp('enemyHp-'+idx, before, e.hp, e.maxHp);
      msg += ` ${name} drained ${e.hp-before} HP!`;
    }
  }
  /* What landing a blow sets off on their side: Cunning, Greed, a lifesteal
     passive, their Leech Seed on you. (A blow soaked entirely by your block
     set off your Goblin Knight's riposte, above.) */
  let extra = '';
  if(ctx.totalTaken > 0) extra = enemyLanded(e, ctx.totalTaken, ctx.victims);
  if(ctx.seedsFed > 0) extra = `🌿 Their seeds drink deep — ${ctx.seedsFed} HP to each of them. ` + extra;
  burnOut(e, ex);

  saveProfile();
  renderStatusBadges();
  if(msg) logBattle(`${name} → ${msg}`);
  if(msg || (extra && extra.trim())) battleMsg(msg + (extra && extra.trim() ? (msg ? ' ' : '') + extra : ''));

  if(b.scriptedOneTurn){
    // One blow and the scene is over — no second attacker, no switch prompt.
    b.attackQueue = null;
    return setTimeout(()=>{ if(b.scriptedLoss==='monkey') onMonkeyResolved(); }, 1100);
  }
  /* Their Overcharge, their clones, their stolen Tachypsychia: the same
     attack again, or the same monster again, before the next one moves. */
  setTimeout(()=> enemyFollowUps(i, e, move, ctx, next), 850);
}

/* A Ghost Flame burns itself out on Extinguish, whether the blow lands, is
   dodged, or passes through a Haunting Aria. */
function burnOut(e, ex){
  if(!ex || !ex.extinguish || e.hp <= 0) return;
  e.hp = 0;
  const i = ui.battle.enemies.indexOf(e);
  drainHp('enemyHp-' + i, 1, 0, e.maxHp);
  const el = document.getElementById('enemy-' + i);
  if(el) el.classList.add('fainted');
  setTimeout(()=> battleMsg(`${SPECIES[e.species].name} burns itself out.`), 700);
}

/* Their Leech Seed on you, fed by ONE strike of theirs that got through — the
   mirror of resolveLeech: it heals their whole side for its share of the
   striker's ATK and, at + and ✦, gnaws you (✦: and the bite feeds it again).
   Every strike of a barrage feeds it, and their repeats and echoes do, as
   yours do; a riposte, an afterimage or a burn does not. Returns what each of
   them was healed (0 if nobody needed it). */
function theirSeedsDrink(e){
  const ls = getPStatus(0,'leechSeed');
  if(!ls || !isEnemyOwned('leechSeed', ls) || !e) return 0;
  const atk = enemyAtk(e);
  let heal = Math.ceil((ls.heal || 0.15) * atk);
  const me = activeMon();
  if(ls.bite && me && me.currentHp > 0){
    const bite = Math.ceil(ls.bite * atk), before = me.currentHp;
    me.currentHp = Math.max(ui.battle && ui.battle.allyUnkillable ? 1 : 0, me.currentHp - bite);
    drainHp(pid('playerHp'), before, me.currentHp, monMaxHp(me));
    if(ls.biteHeals) heal += Math.ceil((ls.heal || 0.15) * atk);
  }
  let fed = 0;
  livingEnemies().forEach(x=>{
    const before = x.hp;
    x.hp = Math.min(x.maxHp, x.hp + heal);
    if(x.hp > before){ fed++; drainHp('enemyHp-' + ui.battle.enemies.indexOf(x), before, x.hp, x.maxHp); }
  });
  return fed ? heal : 0;
}
/* An enemy blow has landed on you for `taken` (on `victims`, the ones of
   yours it hurt). Returns words for the message. */
function enemyLanded(e, taken, victims){
  const bits = [];
  const name = SPECIES[e.species].name;
  const idx = ui.battle.enemies.indexOf(e);
  const p = passiveOf(e);
  if(p && p.lifesteal && e.hp > 0){
    const before = e.hp;
    e.hp = Math.min(e.maxHp, e.hp + Math.ceil(taken * p.lifesteal));
    if(e.hp > before){ drainHp('enemyHp-' + idx, before, e.hp, e.maxHp); bits.push(`${name} drinks in ${e.hp - before} HP.`); }
  }
  /* (Their Leech Seed is fed strike by strike now — theirSeedsDrink.) */
  if(noteDealtDamage(e)) bits.push(`🌘 ${name} melts back into the shadows.`);
  const g = greedSteal('enemy', e, (victims && victims.length) ? victims : [activeMon()]);
  if(g) bits.push(g);
  return bits.join(' ');
}

/* What comes after an enemy's blow, before the next monster moves: their
   Overcharge may repeat it, their clones echo it, and a Tachypsychia they hold
   may hand the same monster another action. */
function enemyFollowUps(i, e, move, ctx, next){
  const b = ui.battle;
  if(!b) return;
  const name = SPECIES[e.species].name;
  /* the ones of yours this attack struck (2.84: an area move, both) */
  const defs = ctx.defs || [];
  const standing = d=> d.mon && d.mon.currentHp > 0 && playerField().includes(d.mon);
  const done = ()=>{
    if(!ui.battle) return;
    /* Tachypsychia in their hands: another action, re-rolled each time — and,
       as with yours, one that comes up with nobody in front of it (your
       monster is down) is saved for its next turn (2.81). */
    const tac = getESide('tachy');
    const theirs = !!(tac && tac.owner === e && e.hp > 0 && (tac.extras || 0) < TACHY_MAX_EXTRAS);
    const rolled = theirs && Math.random() < (tac.bonusAction || 0);
    if(fieldNeedsFaint()){
      if(rolled){
        tac.banked = (tac.banked || 0) + 1;
        battleMsg(`⚡ ${name} is quicker still — it saves an extra action for its next turn.`);
      }
      b.attackQueue = null; return setTimeout(onMonFainted, 650);
    }
    if(livingEnemies().length === 0){ b.attackQueue = null; return setTimeout(onWaveCleared, 650); }
    if(theirs && (rolled || (tac.banked || 0) > 0)){
      if(!rolled) tac.banked--;
      tac.extras = (tac.extras || 0) + 1;
      battleMsg(rolled ? `⚡ ${name} moves again before you can blink!` : `⚡ ${name} spends a saved extra action!`);
      return setTimeout(()=> enemyActs(i, e), 800);
    }
    setFocus(null);
    next();
  };
  if(!defs.some(standing) || e.hp <= 0) return done();
  /* A plain blow, landed again, on whatever block is left — on one of yours. */
  const strike = (d, amount, label, then, times)=>{
    const me = d && d.mon;
    if(!me || !standing(d)) return then();
    setFocus(me);
    if(Math.random() < playerEvasionFrom(e)){
      dodgePlayer(); floatMiss(pid('playerBob'), dodgeWord(me));
      battleMsg(`${label} — and misses.`);
      return setTimeout(then, 650);
    }
    const before = me.currentHp;
    let soaked = 0, fed = 0;
    for(let k = 0; k < (times || 1); k++){
      if(me.currentHp <= 0 && !ui.battle.allyUnkillable) break;
      const through = applyBlock(me, amount, pid('playerBlk'));
      soaked += amount - through;
      me.currentHp = Math.max(ui.battle.allyUnkillable ? 1 : 0, me.currentHp - through);
      if(through > 0) fed += theirSeedsDrink(e);         // their seeds drink from these too
    }
    flashHit($('#' + pid('playerBob')));
    showDamageNumber(pid('playerBob'), before - me.currentHp);
    floatBlocked(pid('playerBob'), soaked);
    drainHp(pid('playerHp'), before, me.currentHp, monMaxHp(me));
    const ar = ariaState(); if(ar) ar.struck = true;
    battleMsg(`${label} — ${before - me.currentHp}!` + (fed > 0 ? ` 🌿 Their seeds drink deep — ${fed} HP to each of them.` : ''));
    setTimeout(then, 750);
  };
  /* Their Overcharge repeats a blow that REACHED you, even one your block
     soaked entirely — as yours repeats every strike that reached them. (It
     used to need damage to get through.) Their clones echo only a blow that
     landed, as before. An area blow is repeated on every one of yours it
     struck. */
  const oc = getESide('overcharge');
  const ocChance = oc ? (oc.fresh && oc.firstChance != null ? oc.firstChance : (oc.chance || 0.25)) : 0;
  /* A blow that reached you is what spends their first rate, as yours. */
  const repeat = (then)=>{
    if(!oc) return then();
    const go = Math.random() < ocChance;
    spendOverchargeFirst(oc);
    if(!go) return then();
    const each = k=> k >= defs.length ? then()
      : strike(defs[k], defs[k].dmg, `⚡ Their Overcharge — ${name} strikes again`, ()=> each(k + 1), Math.max(1, defs[k].hitCount));
    each(0);
  };
  const cl = getESide('clones');
  const echo = (then)=>{
    if(!(ctx.totalTaken > 0)) return then();
    if(!(cl && cl.owner === e && cl.turnsLeft > 0)) return then();
    const d0 = defs.find(d=> d.taken > 0) || defs[0];
    const per = Math.max(1, Math.ceil(d0.dmg * (cl.mult || 0.5)));
    /* each copy goes for one of yours it struck, at random where there are two */
    const pick = ()=>{ const up = defs.filter(standing); return up.length > 1 ? up[Math.floor(Math.random() * up.length)] : (up[0] || d0); };
    strike(pick(), per, `👥 A copy of ${name} strikes too`, ()=> strike(pick(), per, `👥 And the other`, ()=>{
      cl.turnsLeft--;
      if(cl.turnsLeft <= 0) removeESide('clones');
      renderStatusBadges();
      then();
    }));
  };
  repeat(()=> echo(done));
}

/* Your Goblin Knight's Riposte: a blow of theirs that dealt him nothing —
   dodged, or soaked by block — is answered at once, 0.4× his attack. It is a
   reflex, not an attempt: his Lurk or Cunning holds through it. One per blow. */
function playerRiposte(e){
  const me = activeMon();
  if(!me || me.currentHp <= 0 || !e || e.hp <= 0) return false;
  const p = passiveOf(me);
  if(!p || !p.riposte) return false;
  const idx = ui.battle.enemies.indexOf(e);
  setTimeout(()=>{
    if(!ui.battle || e.hp <= 0) return;
    counterDrift(document.getElementById(pid('playerBob')), document.getElementById('enemyBob-' + idx));
    if(rollDodge(e, idx, 0, false, true)){ battleMsg(`⚔️ ${displayName(me)} ripostes — and finds nothing.`); return; }
    /* A reflex, not an attack: it reads no guard of theirs, as their riposte
       reads none of yours. */
    const dmg = computeDamage(p.riposte, monAtk(me), monRef(me), e, true);
    const hits = [{ t:e, idx, dmg, oldHp:e.hp, newHp:Math.max(0, e.hp - dmg) }];
    applyHits(hits, { noLeech:true });
    reportHits(hits);
    battleMsg(`⚔️ ${displayName(me)} ripostes — ${dmg}!`);
  }, 700);
  return true;
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
  if(fieldNeedsFaint()){ setTimeout(onMonFainted,700); return; }
  setTimeout(advanceTurn, 500);
}

/* Something of yours has fallen. 2.84: a companion that falls leaves the
   field for the rest of the fight (the Sacred Flame phoenix may rise first)
   and the fight goes on around its leader; a leader that falls with its
   companion out is stood in for — the companion fights on alone until its
   turns run out, and only then comes "Send out…". */
function onMonFainted(noRebirth){
  const b = ui.battle;
  if(!b) return;
  const comp = companionOnField();
  if(comp && comp.currentHp <= 0){
    if(!noRebirth && rebirthDue(comp)) return offerRebirth(()=> onMonFainted(true), ()=> onMonFainted(true), comp);
    companionFalls(comp);
    noRebirth = false;                 // (a rise declined was the companion's)
  }
  const lead = leaderMon();
  if(!lead || lead.currentHp > 0) return resumeAfterPairFaint();   // the leader stands: on we go
  if(standingIn()){
    if(!noRebirth && rebirthDue(lead)) return offerRebirth(()=> resumeAfterPairFaint(), ()=> onMonFainted(true), lead);
    noteStandIn();
    return resumeAfterPairFaint();
  }
  /* The phoenix may rise again (Rebirth): if it does it keeps its place,
     and the round carries on as it would after a switch-in. */
  if(!noRebirth && rebirthDue(lead)) return offerRebirth(()=>{
    const b2 = ui.battle;
    if(livingEnemies().length === 0){ renderBattle(); return setTimeout(()=>onWaveCleared(), 500); }
    const row = leaderRow();
    if(row && row.acted){ b2.phase = 'resolving'; renderBattle(); return setTimeout(advanceTurn, 700); }
    b2.phase = 'player'; renderBattle(); battleMsg('Choose a move.');
  }, ()=> onMonFainted(true), lead);
  const c = chargeState();
  if(c && lead && c.uid === lead.uid) triggerDragonLegacy();
  if(sideDefeated()){ return onPlayerDefeated(); }
  battleMsg(`${displayName(lead)} fainted!`);
  const options=state.party.map((m,i)=>({m,i})).filter(o=>o.m.currentHp>0 && !isPassenger(o.m));
  monsterChooser('Send out…', options, (i)=>{
    const outgoing = leaderMon();
    ui.battle.activeIndex=i; ui.battle.switchedThisTurn=false;
    setFocus(null);
    const nm = state.party[i];
    if(nm && !nm._entered){ nm._entered = true; applyEntryPassives(nm, nm.species, nm.level, monAtk(nm)); }
    pairSwitched(outgoing);            // its companion comes back out, if it was out

    if(livingEnemies().length===0){ renderBattle(); return setTimeout(()=>onWaveCleared(), 500); }

    /* The replacement steps into the round already under way. Whether it acts
       now depends on whose slice we are in, so resume the order rather than
       guessing. Note the phase is set before painting — rendering first left
       the buttons greyed with nothing to re-render them. */
    /* The replacement steps into the round already under way and INHERITS the
       fallen monster's slot. Without this, chain-fainting would hand the player
       a fresh action every time. */
    const b2 = ui.battle;
    const row = leaderRow();
    if(row){ row.mon = state.party[i]; }
    if(row && row.acted){
      b2.phase = 'resolving';
      renderBattle();
      return setTimeout(advanceTurn, 700);
    }
    b2.control = { mode:'solo', uid:nm.uid };
    ui.battle.phase='player';
    renderBattle();
    battleMsg('Choose a move.');
  }, false);
}
/* After a companion's fall, or a leader's that its companion stands in for:
   the fight carries on in the order — the blow that did it has had its turn. */
function resumeAfterPairFaint(){
  const b = ui.battle;
  if(!b) return;
  setFocus(null);
  if(livingEnemies().length === 0){ renderBattle(); return setTimeout(()=> onWaveCleared(), 500); }
  if(sideDefeated()) return onPlayerDefeated();
  b.phase = 'resolving';
  renderBattle();
  setTimeout(advanceTurn, 700);
}
function onPlayerDefeated(){
  if(ui.battle && ui.battle.coreSpar) return coreSparEnded('lost');   // training costs nothing (2.86)
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
    battleParty().forEach(m=>{ m.currentHp=Math.max(1,Math.floor(monMaxHp(m)*0.10)); m.xpFights=xpAfterDefeat(m); });
    await saveProfile();
    go('region');
    fade.style.opacity='0';
    setTimeout(()=>document.body.removeChild(fade),800);
    toast('Your team fainted. They recovered a little.');
    if(breakAfterLoss) showEyeBreak();
  },1000);
}
