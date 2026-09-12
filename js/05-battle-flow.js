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
function setScreenBg(key){
  const el = document.getElementById('screenBg');
  if(!el) return;
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

function battleMsg(t){ const el=$('#battleMsg'); if(el) el.textContent=t; }

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
    ui.battle.activeIndex=i; ui.battle.switchedThisTurn=true;
    ui.battle.phase = 'player';        // a free switch never hands the turn over
    renderBattle();
    if(!ui.battle.legacyBonus) battleMsg('Switched! Now choose a move.');
  });
}
function monsterChooser(title, options, onPick, dismissable=true){
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
  if(dismissable){ scrim.querySelector('#chCancel').addEventListener('click',close); scrim.addEventListener('click',e=>{if(e.target===scrim)close();}); }
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
  go(ui.battle.isNpc ? 'challenge' : (inPaths ? 'caverns' : (zid==='geothermal_plant' ? 'plant' : 'zone')));
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
        return setTimeout(enemyTurn, 900);
      }
      if(ui.battle) ui.battle.wordCarry = Math.max(0, correct - mv.words);
      startCharge(mon, def);
      const c = chargeState();
      playEffect(mv.name, { type:'Water', duration:800 });
      battleMsg(`⚡ Power gathers… ${c.charges} charge${c.charges>1?'s':''} held. The turn passes.`);
      logBattle(`${displayName(mon)} charged — ${c.charges}/${c.def.max}, window ${c.turnsLeft} turns`);
      renderBattle();
      setTimeout(enemyTurn, 1100);
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
    reportHits(hits);          // Unleash / Hyperbeam were landing silently
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
        b.aftershockPending = true;              // this cast gets the extra strike
        addAftershockStack();
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

/* Aftershock: each stack adds a strike to multi-hit moves and expires on its
   own timer, so stacks never refresh one another. */
function addAftershockStack(){
  const b = ui.battle;
  b.aftershock = b.aftershock || [];
  b.aftershock.push({ turnsLeft: 3 });
}
function aftershockBonusHits(){
  const b = ui.battle;
  return (b && b.aftershock) ? b.aftershock.length : 0;
}
function tickAftershock(){
  const b = ui.battle;
  if(!b || !b.aftershock) return;
  b.aftershock.forEach(a=>a.turnsLeft--);
  b.aftershock = b.aftershock.filter(a=>a.turnsLeft > 0);
}

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
  if(mv.dot){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(enemyTurn,900); }
    const tick = applyDot(mv, mon);
    renderStatusBadges();
    battleMsg(`${mv.name}! ${tick} damage a turn for ${mv.dot.turns} turns` +
      (mv.dot.rider==='noflee' ? ' — and nothing is getting away.' : ` — and they'll miss more often.`));
    playEffect(mv.name, { type:SPECIES[mon.species].types[0] });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.shell && mv.mult==null){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(enemyTurn,900); }
    applyShell(mv, mon);
    renderStatusBadges();
    battleMsg(`${mv.name}! Damage taken cut by ${Math.round(mv.shell.reduce*100)}%, and attackers get burned.`);
    playEffect(mv.name, { type:SPECIES[mon.species].types[0] });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.tachy){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(enemyTurn,900); }
    setPStatus(0, { type:'tachy', turnsLeft:mv.tachy.turns+1, bonusAction:mv.tachy.bonusAction,
                    evadeFirst:mv.tachy.evadeFirst, evadeAfter:mv.tachy.evadeAfter, fresh:true });
    renderStatusBadges();
    battleMsg(`${mv.name}! Time slows — ${Math.round(mv.tachy.bonusAction*100)}% chance of an extra action each time you act, and much harder to hit.`);
    playEffect(mv.name, { type:'Psychic' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.grant){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(enemyTurn,900); }
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
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(enemyTurn,900); }
    applyFieldStatus({ type:'charm', turnsLeft:mv.charm.turns, chance:mv.charm.chance });
    renderStatusBadges();
    battleMsg(`${mv.name}! For ${mv.charm.turns} turns each enemy may be charmed into losing its turn.`);
    playEffect(mv.name, { type:'Electric' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.disrupt){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(enemyTurn,900); }
    // In the player's hands it can't grant an initiative they already have, so
    // it jams the enemy's attacks instead.
    setPStatus(0, { type:'disrupt', turnsLeft:mv.disrupt.turns+1, block:mv.disrupt.playerBlock });
    renderStatusBadges();
    battleMsg(`${mv.name}! Their signals are jammed — ${Math.round(mv.disrupt.playerBlock*100)}% of enemy attacks will fail for ${mv.disrupt.turns} turns.`);
    playEffect(mv.name, { type:'Electric' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.soul){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(enemyTurn,900); }
    setPStatus(0, { type:'steelSoul', turnsLeft:mv.soul.turns+1, reduce:mv.soul.reduce,
                    bonus:mv.soul.bonus, owner:mon.uid });
    renderStatusBadges();
    battleMsg(`${mv.name}! Half damage taken and +${mv.soul.bonus}× ATK on every hit for ${mv.soul.turns} turns.`);
    playEffect(mv.name, { type:'Steel' });
    return setTimeout(()=> afterPlayerAttack(mon, []), 900);
  }
  if(mv.clones){
    if(correct < mv.words){ playSfx('move_miss'); battleMsg(`${mv.name} failed! (${correct}/${mv.words} words)`); return setTimeout(enemyTurn,900); }
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
  if(factor<=0){ playSfx('move_miss'); battleMsg(`${mv.name} missed! (${correct}/${mv.words} words)`); setTimeout(enemyTurn,900); return; }
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
      return { t, idx:ui.battle.enemies.indexOf(t), oldHp:t.hp, newHp:t.hp, dmg:0, dodged:true };
    }
    const dmg = computeDamage(factor, atk, monRef(mon), t, true);
    const idx=ui.battle.enemies.indexOf(t);
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
function applyHits(hits){
  // an enemy holding block stacks eats one per strike
  hits.forEach(h=>{
    if(!h || !h.t || !blockStacksOf(h.t)) return;
    const through = applyBlock(h.t, h.dmg);
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
    const ls = getEStatus(h.t,'leechSeed');
    if(ls) healed += Math.ceil((ls.heal||0.15)*monAtk(mon));
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
    battleMsg(`Giga Drain restored ${mon.currentHp-before} HP!`);
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
    if(canRepeat && Math.random()<oc.chance){
      battleMsg('⚡ Overcharge triggers — the attack repeats!');
      const again = hits
        .filter(h=>h.t.hp>0)
        .map(h=>({ t:h.t, idx:h.idx, oldHp:h.t.hp, newHp:Math.max(0,h.t.hp-h.dmg), dmg:h.dmg }));
      if(again.length===0){ finishPlayerTurn(); return; }
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
function finishPlayerTurn(){
  if(livingEnemies().length===0){ setTimeout(onWaveCleared,700); return; }
  setTimeout(enemyTurn,850);
}

/* An Ultimate that strikes the same target repeatedly. */
/* Every enemy takes `hits` separate strikes, resolved one after another so the
   per-hit effects (Steel Soul's flat bonus, Leech Seed) apply to each. */
function resolveAoeHits(mv, mon, factor, atk, targets){
  const b = ui.battle;
  // a successful power-up adds a strike this cast; each Aftershock stack adds one more
  const extra = (b.aftershockPending ? 1 : 0) + aftershockBonusHits();
  b.aftershockPending = false;
  const totalHits = mv.hits + extra;
  const per = mv.split ? factor / mv.hits : factor;
  const sim = new Map(targets.map(t=>[t, t.hp]));
  const all = [];
  for(let k=0;k<totalHits;k++){
    targets.forEach(t=>{
      if(sim.get(t) <= 0) return;
      const dmg = computeDamage(per, atk, monRef(mon), t, true);
      const oldHp = sim.get(t), newHp = Math.max(0, oldHp - dmg);
      sim.set(t, newHp);
      all.push({ t, idx:b.enemies.indexOf(t), dmg, oldHp, newHp });
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
    battleMsg(`${mv.name} struck ${totalHits} times!`
      + (extra ? ` (+${extra} from Aftershock)` : ''));
    if(mon.currentHp<=0){
      if(livingEnemies().length===0){ setTimeout(()=>onWaveCleared(), 900); return; }
      setTimeout(()=>onMonFainted(), 900); return;
    }
    afterPlayerAttack(mon, all);
  }, true), 330);
}

function resolveSplitHits(mv, mon, factor, atk, target){
  const n = mv.hits;
  const per = mv.split ? factor / n : factor;   // split shares the total; others hit full each time
  const hits = [];
  let simHp = target.hp;
  for(let i=0;i<n;i++){
    if(simHp<=0) break;
    const dmg = computeDamage(per, atk, monRef(mon), target, true);
    const oldHp = simHp, newHp = Math.max(0, simHp-dmg);
    simHp = newHp;
    hits.push({ t:target, idx:ui.battle.enemies.indexOf(target), dmg, oldHp, newHp });
  }
  logBattle(`${displayName(mon)} used ${mv.name} — ${hits.length} strikes on ${SPECIES[target.species].name}`);
  hits.forEach((h,i)=>logBattle(`  strike ${i+1}: ${h.dmg} (${h.oldHp}→${h.newHp})`));
  battleMsg(`${mv.name}!`);
  bob($('#playerBob'), +1);
  playEffect(mv.name, { type: SPECIES[mon.species].types[0], at:'enemy-'+hits[0].idx });
  setTimeout(()=> playSuccessiveHits(hits, 0, ()=>{
    saveProfile();
    battleMsg(`${mv.name} struck ${hits.length} times!`);
    afterPlayerAttack(mon, hits);
  }, true), 330);
}

/* High tier: hit 2 different living enemies at 0.8x each (or the single enemy once if only 1 exists) */
function resolveMulti2(mv, mon, correct, target){
  if(correct<mv.words){ battleMsg(`${mv.name} missed! (${correct}/${mv.words} words)`); setTimeout(enemyTurn,900); return; }
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
function resolveMultiHit(mv, mon, correct){
  if(correct<mv.words){ battleMsg(`${mv.name} missed! (${correct}/${mv.words} words)`); setTimeout(enemyTurn,900); return; }
  /* Hit count widens as the stone is refined: 5-7 → 6-8 → 7-9. */
  const range = mv.ultraStone ? ultraHitRange(mv.ultraStone) : { min:5, max:7 };
  const r=Math.random();
  const n = r<0.45 ? range.min : (r<0.80 ? range.min+1 : range.max);
  const atk=monAtk(mon);
  // simulate against a working copy of HP so targeting skips already-downed enemies,
  // but leave real HP untouched until the animation plays it back hit by hit
  const sim = new Map(ui.battle.enemies.map(e=>[e, e.hp]));
  const hits=[];
  for(let i=0;i<n;i++){
    const alive = ui.battle.enemies.filter(e=>sim.get(e)>0);
    if(alive.length===0) break;
    const t = alive[Math.floor(Math.random()*alive.length)];
    const dmg = computeDamage(mv.mult, atk, monRef(mon), t, true);
    const oldHp = sim.get(t);
    const newHp = Math.max(0, oldHp - dmg);
    sim.set(t, newHp);
    hits.push({ t, idx:ui.battle.enemies.indexOf(t), oldHp, newHp, dmg });
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
function playSuccessiveHits(hits, i, done, fast){
  if(i>=hits.length){ done(); return; }
  const h = hits[i];
  const gap = fast ? 350 : 350;   // Ultra strikes now dwell as long as normal ones
  h.t.hp = h.newHp;
  flashHit(document.getElementById('enemy-'+h.idx));
  drainHp('enemyHp-'+h.idx, h.oldHp, h.newHp, h.t.maxHp);
  if(getEStatus(h.t,'leechSeed')){
    const mon = activeMon();
    const amount = Math.ceil(0.15*monAtk(mon));
    battleParty().forEach(m=>{
      if(m.currentHp<=0) return;
      const before = m.currentHp, max = monMaxHp(m);
      m.currentHp = Math.min(max, m.currentHp + amount);
      if(m===mon) drainHp('playerHp', before, m.currentHp, max);
    });
  }
  if(h.newHp<=0){ const el=document.getElementById('enemy-'+h.idx); if(el) el.classList.add('fainted'); }
  setTimeout(()=> playSuccessiveHits(hits, i+1, done, fast), gap);
}

/* Very High tier: single status application, per-type effect (see applyVeryHighEffect) */
function resolveStatusMove(mv, mon, target, correct){
  if(correct<mv.words){ battleMsg(`${mv.name} missed! (${correct}/${mv.words} words)`); setTimeout(enemyTurn,900); return; }
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
      if(res.borrow){
        return openBorrowPicker(mon, mv.stonePlus||0, res.borrow, (picked)=>{
          castBorrowed(mon, atk, picked, mv.stonePlus||0, ()=>{
            ui.battle.phase = 'player';
            renderBattle();
            battleMsg('Diamond Dust settles. (instant — you can still attack!)');
          });
        });
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
function enemyTurn(){
  const b = ui.battle;
  const attackers = livingEnemies();

  // Ice Tomb: frozen enemies lose their turn; tick the counter and thaw at zero
  const acting = [];
  let frozenCount = 0;
  attackers.forEach(e=>{
    const ice = getEStatus(e,'iceTomb');
    const par = getEStatus(e,'paralysed');
    if(ice){
      frozenCount++;
      ice.turnsLeft--;
      if(ice.turnsLeft<=0) removeEStatus(e,'iceTomb');
    } else if(par){
      frozenCount++;
      removeEStatus(e,'paralysed');       // one turn only
    } else {
      acting.push(e);
    }
  });

  if(acting.length===0){
    battleMsg(frozenCount ? "The frozen enemies can't move!" : 'The enemy hesitates!');
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
    b.attackQueue = null;
    tickStatuses();              // the round still happened — age the statuses
    return setTimeout(onMonFainted, 650);
  }
  if(livingEnemies().length === 0){ b.attackQueue = null; return setTimeout(onWaveCleared, 650); }
  if(!b.attackQueue || i >= b.attackQueue.length) return endEnemyRound();

  const e = b.attackQueue[i];
  if(!e || e.hp <= 0) return runEnemyAttack(i+1);

  // player-cast Disrupt jams a share of incoming attacks outright
  const jam = getPStatus(0,'disrupt');
  if(jam && jam.block && Math.random() < jam.block){
    battleMsg(`📡 ${SPECIES[e.species].name}'s attack is jammed!`);
    return setTimeout(()=> runEnemyAttack(i+1), 700);
  }
  // enemy-side Charm: a charmed enemy may lose its turn outright
  const chm = getEStatus(e,'charm');
  if(chm && Math.random() < (chm.chance||0.20)){
    battleMsg(`💗 ${SPECIES[e.species].name} is charmed and can't attack!`);
    return setTimeout(()=> runEnemyAttack(i+1), 700);
  }

  const idx  = b.enemies.indexOf(e);
  const move = enemyMoveFor(e);
  const name = SPECIES[e.species].name;

  /* Per-attack rolls: Discombobulate can make this one miss, be countered, or
     land at half; Mirage can make it miss. Both are rolled per attacker now. */
  const dis = getEStatus(e,'discombobulate');
  let disHalve=false, disMiss=false, disCounter=false, disSoften=0;
  if(dis){
    const roll = dis.roll || 0.10;
    /* Base halves only the NEXT HIT. Refined versions halve every hit for a
       whole turn, and ✦ softens the turn after that as well. The random rolls
       run alongside and stack with the guaranteed reduction. */
    if(dis.guaranteed){
      disHalve = true;
      if(!dis.openTurn){
        dis.guaranteed = false;                // base: one hit only
        if(b.fieldStatus && b.fieldStatus.discombobulate) b.fieldStatus.discombobulate.guaranteed = false;
        b.enemies.forEach(x=>{ const st=getEStatus(x,'discombobulate'); if(st) st.guaranteed = false; });
      }
    } else if(dis.softenTurn && dis.second){
      disSoften = dis.second;                  // ✦: the following turn is reduced 25%
    }
    const r = Math.random();
    if(r < roll) disCounter = true;
    else if(r < roll*2) disMiss = true;
    else if(r < roll*3) disHalve = true;
  }
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
    let dmg = computeDamage(move[2], e.atk, e, monRef(mon), false);
    if(disHalve)  dmg = Math.ceil(dmg*0.5);
    if(disSoften) dmg = Math.ceil(dmg*(1-disSoften));

    const counter = getPStatus(0,'counter');
    const spikes  = getPStatus(0,'spikeArmour');
    const guaranteedLeft = counter ? (counter.guaranteed||0) : 0;
    const counterFires = disCounter || (counter && (guaranteedLeft > 0 || Math.random() < (counter.chance||0.10)));
    let msg = '';

    if(counterFires){
      if(counter && counter.guaranteed > 0) counter.guaranteed--;
      const ret = disCounter ? (getEStatus(e,'discombobulate')||{}).counterRet || 0.5
                             : (counter ? (counter.ret||0.5) : 0.5);
      const back = Math.ceil(dmg*ret);
      const oldHp=e.hp, newHp=Math.max(0,e.hp-back);
      e.hp = newHp;
      flashHit(document.getElementById('enemy-'+idx));
      drainHp('enemyHp-'+idx, oldHp, newHp, e.maxHp);
      if(newHp<=0){ const el=document.getElementById('enemy-'+idx); if(el) el.classList.add('fainted'); }
      msg = `🛡️ Countered! ${back} reflected back at ${name}.`;
    } else {
      const oldHp = mon.currentHp;
      // reduction has already been applied inside computeDamage; block is last
      const beforeBlock = dmg;
      dmg = applyBlock(mon, dmg);
      if(dmg < beforeBlock) msg = `🛡 Blocked ${beforeBlock - dmg}! ` + msg;
      // scripted last stand: the dragon always survives on 1 HP
      const floor = ui.battle.allyUnkillable ? 1 : 0;
      mon.currentHp = Math.max(floor, mon.currentHp - dmg);
      flashHit($('#playerBob'));
      showDamageNumber('playerBob', oldHp - mon.currentHp);
      playSfx('hit_taken');
      drainHp('playerHp', oldHp, mon.currentHp, monMaxHp(mon));
      msg = `${name} dealt ${dmg} damage!`;

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
      setPStatus(0, { type:'charmed', turnsLeft:6, chance:0.20 });
      renderStatusBadges();
      msg += ' Your team is charmed!';
    }
    if(move[1] === 'Disrupt'){
      addEStatus(e, { type:'disrupt', turnsLeft:6 });
      b.fieldStatus = b.fieldStatus || {};
      b.fieldStatus.disrupt = { type:'disrupt', turnsLeft:6 };
      livingEnemies().forEach(x=> addEStatus(x, { type:'disrupt', turnsLeft:6 }));
      renderStatusBadges();
      msg += ' They seize the initiative!';
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

function endEnemyRound(){
  const b = ui.battle;
  b.attackQueue = null;
  if(livingEnemies().length===0){ setTimeout(onWaveCleared,700); return; }
  if(activeMon().currentHp<=0){ setTimeout(onMonFainted,700); return; }
  b.switchedThisTurn = false;
  // an unspent Cataclysm window closes on its own
  const c = chargeState();
  if(c){ c.turnsLeft--; if(c.turnsLeft <= 0){ clearCharge(); battleMsg('The gathered power disperses.'); } }
  const gm = activeMon();
  if(gm && gm.guard) grantBlock(gm, 1, monAtk(gm));    // Guard replenishes each turn
  if(gm){
    if(gm.airborne  > 0) gm.airborne--;                // stances last a turn
    if(gm.invisible > 0) gm.invisible--;
  }
  livingEnemies().forEach(e=>{
    if(e.guard) grantBlock(e, 1, e.atk);
    if(e.airborne  > 0) e.airborne--;
    if(e.invisible > 0) e.invisible--;
  });
  // Discombobulate's guaranteed window lasts a turn on + / ✦, then ✦ leaves a
  // softer turn behind it before the plain rolls take over.
  if(b.fieldStatus && b.fieldStatus.discombobulate){
    const f = b.fieldStatus.discombobulate;
    if(f.guaranteed && f.openTurn){
      f.guaranteed = false;
      if(f.second) f.softenTurn = true;
    } else if(f.softenTurn){
      f.softenTurn = false;
    }
    b.enemies.forEach(x=>{
      const st = getEStatus(x,'discombobulate');
      if(st){ st.guaranteed = f.guaranteed; st.softenTurn = f.softenTurn; }
    });
  }
  const dd0 = getPStatus(0,'diamondDust');
  if(dd0) diamondDustCleanse();          // keeps the enemy board clear round after round
  const mir0 = getPStatus(0,'mirage');
  if(mir0 && mir0.window && mir0.step < mir0.window.length) mir0.step++;
  const ovc = getPStatus(0,'overcharge');
  if(ovc && ovc.fresh) ovc.fresh = false;
  const aeg = getPStatus(0,'steelAegis');
  if(aeg && aeg.regen) grantBlock(activeMon(), aeg.regen, monAtk(activeMon()));
  const tac0 = getPStatus(0,'tachy');
  if(tac0){
    tac0.fresh = false;          // the sharpest evasion window is the first turn only
    tac0.extras = 0;             // bonus actions are counted per turn
  }
  tickAftershock();
  const gone = tickStatuses();          // one full round has passed
  setTimeout(()=>{
    beginPlayerPhase(gone.length ? `${gone.join(' and ')} wore off.` : 'Choose a move.');
  }, 850);
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

    /* Set the phase BEFORE painting. Rendering first drew the move buttons
       while the phase was still 'resolving', so they came out greyed and
       nothing re-rendered afterwards — the menu stayed dead until the app was
       backgrounded and forced a repaint. */
    if(ui.battle.alwaysFirst){
      ui.battle.phase='resolving';
      renderBattle();
      battleMsg('They strike again!');
      return setTimeout(enemyTurn, 800);
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
