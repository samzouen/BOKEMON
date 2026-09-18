/* ==========================================================
   04-battle.js
   Damage, type chart, statuses, stances, blocks. New MECHANICS go here.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ---------- TYPE EFFECTIVENESS ----------
   Three standard triangles (effective 2x forward, 0.5x backward) + Fantasy triangle
   (2x forward, neutral backward; each fantasy type resists one whole standard triangle).
   Dual-type: evaluated once, no 4x stacking; effective+ineffective cancels to neutral. */
const TRIANGLES = {
  starter:['Water','Fire','Grass'],
  sky:['Electric','Flying','Ground'],
  mind:['Psychic','Ghost','Physical'],
  fantasy:['Dragon','Steel','Fairy'],
};
const FANTASY_RESIST = { Dragon:'starter', Steel:'sky', Fairy:'mind' };

function pairEffect(atk, def){
  for(const ft in FANTASY_RESIST){
    if(def===ft && TRIANGLES[FANTASY_RESIST[ft]].includes(atk)) return 0.5;
  }
  for(const key of ['starter','sky','mind']){
    const t = TRIANGLES[key];
    const ai=t.indexOf(atk), di=t.indexOf(def);
    if(ai>=0 && di>=0){
      if((ai+1)%3===di) return 2;
      if((di+1)%3===ai) return 0.5;
      return 1;
    }
  }
  const f = TRIANGLES.fantasy;
  const ai=f.indexOf(atk), di=f.indexOf(def);
  if(ai>=0 && di>=0){ if((ai+1)%3===di) return 2; return 1; }
  return 1;
}
function typeMultiplier(atkTypes, defTypes){
  let eff=false, weak=false;
  atkTypes.forEach(a=> defTypes.forEach(d=>{
    const r = pairEffect(a,d);
    if(r>1) eff=true; else if(r<1) weak=true;
  }));
  if(eff && weak) return 1;
  if(eff) return 1.5;    // super effective: 1.5x damage dealt
  if(weak) return 0.67;  // resisted: 0.67x damage received
  return 1;
}
function effectivenessLabel(mult){
  if(mult>1) return 'Super effective!';
  if(mult<1) return 'Not very effective…';
  return '';
}

/* ---------- MOVE RESOLUTION (universal fail-tier formula) ---------- */
/* Fail tiers, now measured in WORDS. Each old phrase-step is two words, so the
   shape of the curve is preserved: Power1 drops a tier at n-2 words, and
   Power2/Ultimate at n-2 then n-4. */
function moveFactor(slot, baseMult, words, correct){
  if(baseMult==null) return 0;
  const n = words;
  if(slot==='Basic') return correct>=n ? baseMult : 0;
  if(slot==='Power1'){
    if(correct>=n)   return baseMult;
    if(correct>=n-2) return baseMult*0.2;   // 1/5 one "phrase-step" short
    return 0;
  }
  if(correct>=n)   return baseMult;
  if(correct>=n-2) return baseMult*0.5;
  if(correct>=n-4) return baseMult*0.2;
  return 0;
}

/* ---------- STATUS MODEL ----------
   Statuses are no longer attached to individual monsters. A Very High skill
   affects an entire SIDE:
     - party statuses live on ui.battle.partyStatus  (buffs for your whole team)
     - field statuses are stamped on every enemy, now and in later waves
   Every status carries a turn counter and expires; nothing lasts the whole
   battle any more. Counters tick down once per round, after the enemy acts. */
const STATUS_TURNS = 5;
const ICE_TOMB_TURNS = 2;

/* Read outside battle too — the Stats page estimates damage with whatever
   buffs are active, and there is no battle there. Never assume ui.battle. */
function partyStatuses(){
  if(!ui.battle) return {};
  return (ui.battle.partyStatus = ui.battle.partyStatus || {});
}
/* uid is accepted but ignored — kept so existing call sites read naturally. */
function getPStatus(uid, type){ return partyStatuses()[type]; }
function removePStatus(uid, type){ delete partyStatuses()[type]; }
/* Diamond Dust is enforced HERE rather than at each call site. Every status in
   the game passes through setPStatus / addEStatus, so an enemy-owned effect
   cannot land while it holds — including any effect added in future, provided
   it is listed in STATUS_OWNER. Per-call-site checks were one forgotten line
   away from a hole. */
function setPStatus(uid, status){
  if(!ui.battle) return null;
  if(status && isEnemyOwned(status.type, status) && getPStatus(0,'diamondDust')) return;
  const st = Object.assign({ turnsLeft: STATUS_TURNS }, status);
  partyStatuses()[status.type] = st;
  return st;
}
function clearPStatus(uid, type){ delete partyStatuses()[type]; }

/* Stamp a field status on every enemy, and remember it so later waves inherit it. */
function applyFieldStatus(status){
  const b = ui.battle;
  b.fieldStatus = b.fieldStatus || {};
  b.fieldStatus[status.type] = Object.assign({ turnsLeft: STATUS_TURNS }, status);
  livingEnemies().forEach(e=> addEStatus(e, Object.assign({}, b.fieldStatus[status.type])));
}

/* One round has passed: age every status and drop the expired ones. */
function tickStatuses(){
  const b = ui.battle;
  const expired = [];
  // damage-over-time burns the enemy side at the end of each round
  const dot = b.fieldStatus && b.fieldStatus.dot;
  if(dot){
    let total = 0;
    livingEnemies().forEach(e=>{
      const before = e.hp;
      e.hp = Math.max(0, e.hp - dot.tick);
      total += before - e.hp;
      const i = b.enemies.indexOf(e);
      drainHp('enemyHp-'+i, before, e.hp, e.maxHp);
      if(e.hp<=0){ const el=document.getElementById('enemy-'+i); if(el) el.classList.add('fainted'); }
    });
    if(total) battleMsg(`🔥 ${dot.label} burns for ${total}!`);
  }
  /* Diamond Dust holds your own effects open. This lives INSIDE the tick so
     every path honours it — clearing a wave ticks statuses without going
     through the end-of-round handler, and those rounds were quietly ageing
     buffs the dust was supposed to be sustaining. */
  const dust = getPStatus(0,'diamondDust');
  const ps = partyStatuses();
  Object.keys(ps).forEach(k=>{
    if(dust && k !== 'diamondDust' && !isEnemyOwned(k, ps[k])){
      ps[k].turnsLeft = STATUS_TURNS + 1;     // refreshed, never ages
      return;
    }
    ps[k].turnsLeft--;
    if(ps[k].turnsLeft <= 0){ delete ps[k]; expired.push(STATUS_LABELS[k]||k); }
  });
  if(b.fieldStatus){
    Object.keys(b.fieldStatus).forEach(k=>{
      if(dust && !isEnemyOwned(k)){
        b.fieldStatus[k].turnsLeft = STATUS_TURNS;
        b.enemies.forEach(e=>{ const st = getEStatus(e,k); if(st) st.turnsLeft = STATUS_TURNS; });
        return;
      }
      b.fieldStatus[k].turnsLeft--;
      if(b.fieldStatus[k].turnsLeft <= 0){
        delete b.fieldStatus[k];
        b.enemies.forEach(e=> removeEStatus(e, k));
        expired.push(STATUS_LABELS[k]||k);
      } else {
        b.enemies.forEach(e=>{ const st = getEStatus(e,k); if(st) st.turnsLeft = b.fieldStatus[k].turnsLeft; });
      }
    });
  }
  return expired;
}

/* Enemy statuses STACK: each enemy carries a list, not a single slot.
   Re-applying the same type refreshes it rather than adding a duplicate. */
function eStatuses(e){ if(!e) return []; if(!Array.isArray(e.statuses)) e.statuses = []; return e.statuses; }
function getEStatus(e, type){ return eStatuses(e).find(s=>s.type===type); }
function addEStatus(e, status){
  // enemy self-buffs can't take hold while the dust is in the air
  if(status && isEnemyOwned(status.type, status) && getPStatus(0,'diamondDust')) return;
  const arr = eStatuses(e);
  const i = arr.findIndex(s=>s.type===status.type);
  if(i>=0) arr[i] = status; else arr.push(status);
}
function removeEStatus(e, type){
  const arr = eStatuses(e);
  const i = arr.findIndex(s=>s.type===type);
  if(i>=0) arr.splice(i,1);
}

/* Battle reference for a player monster: computeDamage needs BOTH .types (for
   effectiveness) and .uid (for status lookup). Passing the raw monster object
   fails because monsters store species, not types. */
function monRef(m){ return { uid:m.uid, types:SPECIES[m.species].types, species:m.species }; }

/* Unified damage calc: applies type effectiveness + all status modifiers, in a
   fixed order, then rounds up. `attacker`/`defender` are refs — use monRef() for
   player monsters; enemy objects already carry .types. */
function computeDamage(baseFactor, attackerAtk, attacker, defender, isPlayerAttacking){
  let dmg = baseFactor * attackerAtk;
  dmg *= typeMultiplier(attacker.types, defender.types);

  // attacker-side buffs/debuffs
  if(isPlayerAttacking){
    const oh = getPStatus(0,'overheat');
    if(oh) dmg *= (oh.deal || 1.5);
    const dd = getPStatus(0,'dragonDance');
    if(dd) dmg *= (dd.deal || 1.25);               // multiplies WITH overheat
    // Dragon Legacy stacks multiplicatively with the above
    if(ui.battle && ui.battle.legacyBonus) dmg *= (1 + ui.battle.legacyBonus);
    /* `atk` does not exist in this scope — the parameter is `attackerAtk`. The
       ReferenceError aborted every attack while Steel Soul was up, which is why
       the turn bounced straight back with no damage.
       It also only empowers the monster that cast it, not whoever is on field. */
    const soulAtk = getPStatus(0,'steelSoul');
    if(soulAtk && soulAtk.owner === attacker.uid) dmg += soulAtk.bonus * attackerAtk;
  } else {
    /* Discombobulate used to ALSO shave 20% off everything a confused enemy
       threw. The rework replaced that with visible friendly fire, but this line
       survived — so a confused wave was both hitting itself and hitting softer.
       The whole effect is the turned swing now. */
  }

  // defender-side modifiers
  if(isPlayerAttacking){ // defender is an enemy

    if(defender && defender.takeMult) dmg *= defender.takeMult;
    const ice = getEStatus(defender,'iceTomb');
    if(ice) dmg *= (ice.taken != null ? ice.taken : 0.8);
    const cur = getEStatus(defender,'curse');
    if(cur) dmg *= (1 + (cur.extra != null ? cur.extra : 0.25));
  } else { // defender is a player monster
    const ohD = getPStatus(0,'overheat');
    if(ohD) dmg *= (ohD.take || 1.5);              // the cost of Overheat
    const sa = getPStatus(0,'spikeArmour');
    if(sa) dmg *= (1 - (sa.reduce||0.20));
    const st = getPStatus(0,'steelAegis');
    if(st) dmg *= (1 - (st.reduce||0.30));
    const soft = getPStatus(0,'softened');
    if(soft){ dmg *= (1 - (soft.amount||0.5)); }
    const cw = getPStatus(0,'curseWard');
    if(cw) dmg *= (1 - (cw.reduce||0));             // Curse + / ✦ also shields
    const sh = getPStatus(0,'shell');
    if(sh && sh.reduce) dmg *= (1 - sh.reduce);    // Lava Shell
    const soul = getPStatus(0,'steelSoul');
    if(soul && soul.owner === defender.uid) dmg *= (1 - soul.reduce);   // only its caster is armoured
  }
  return Math.max(0, Math.ceil(dmg));
}

/* Apply a Very High status move. Returns {msg, directDamage:[{idx,dmg}] } for UI. */
function applyVeryHighEffect(type, casterMon, casterAtk, targets, plus){
  const uid = casterMon.uid;
  const res = { msg:'', hits:[] };
  const d = veryHighDef(type, plus||0) || {};
  const T = d.turns || STATUS_TURNS;
  switch(type){
    case 'Fire': // Overheat — whole party trades defence for offence
      setPStatus(uid,{type:'overheat', turnsLeft:T+1, deal:d.deal, take:d.take, burn:d.burn||0, atk:casterAtk});
      if(d.burn){
        addPreHit({ label:`🔥 The air itself scorches them!`, pct:d.burn, atk:casterAtk, turnsLeft:T, aoe:true });
      }
      res.msg = d.text;
      break;

    case 'Water': { // Ice Tomb — freezes the current wave for 2 turns
      livingEnemies().forEach(e=> addEStatus(e, { type:'iceTomb', turnsLeft:d.freeze||2, taken:d.taken||0.8 }));
      if(d.field){ applyFieldStatus({ type:'iceField', turnsLeft:d.turns||2, taken:d.taken||1, freeze:d.freeze||2, mine:true }); }
      /* Frost Armour: the cold closes over your own monster too. Block stacks
         do not expire, so they guard a Cataclysm charge all the way through. */
      if(d.frost){
        grantBlock(mon, d.frost, monAtk(mon));
        setTimeout(()=> battleMsg(`❄️ Frost Armour — ${d.frost} layers of ice close over ${displayName(mon)}.`), 500);
      }
      res.msg = d.text;
      break; }

    case 'Grass': // Leech Seed — field-wide; every hit feeds the WHOLE party
      applyFieldStatus({ type:'leechSeed', turnsLeft:T, heal:d.heal, bite:d.bite||0, biteHeals:!!d.biteHeals });
      res.msg = d.text;
      break;

    case 'Electric': // Overcharge — party-wide repeat chance
      setPStatus(uid,{type:'overcharge', turnsLeft:T+1, chance:d.after, firstChance:d.first, fresh:true});
      res.msg = d.text;
      break;

    case 'Ground': // Spike Armour — party-wide, softer than before
      setPStatus(uid,{type:'spikeArmour', turnsLeft:T+1, reduce:d.reduce, thorns:d.thorns});
      res.msg = d.text;
      break;

    case 'Flying': // Mirage — one untouchable turn, then dodges make copies
      setPStatus(uid,{type:'mirage', turnsLeft:T+1, window:(d.window||[1]).slice(), step:0,
                      chance:d.after, images:d.images||0, imageDmg:d.imageDmg||0,
                      init:d.init||0, owner:uid, pending:0});
      res.msg = d.text;
      break;

    case 'Physical': { // Counter — stacks that eat a whole attack
      /* The parameter here is casterMon, not mon. Referencing `mon` threw, and
         because the cast is wrapped the whole effect vanished silently — which
         is why nothing appeared when Diamond Dust borrowed it. */
      const tier = plus || 0;                  // 0 / 1 / 2 by refinement
      addCounterStack(casterMon, tier, d.stacks || 1);
      setPStatus(uid, { type:'counter', turnsLeft:STATUS_TURNS + 1, tier,
                        regain:d.regain||0.10, combo:d.combo||0.25,
                        enrage:d.enrage||0, owner:uid });
      res.msg = d.text;
      break;
    }

    case 'Ghost': // Curse — field-wide fragility
      applyFieldStatus({ type:'curse', turnsLeft:T, extra:d.extra });
      if(d.reduce) setPStatus(uid,{type:'curseWard', turnsLeft:T+1, reduce:d.reduce});
      res.msg = d.text;
      break;

    case 'Psychic': // Discombobulate — they swing at their own side
      applyFieldStatus({ type:'discombobulate', turnsLeft:T, mine:true,
                         first:d.confuseFirst, after:d.confuseAfter, ffPower:d.ffPower||0.60,
                         sleep:d.sleep||0, sleepTurns:d.sleepTurns||1 });
      livingEnemies().forEach(e=>{ e._confusedFirst = false; });
      res.msg = `Their heads are spinning — they cannot tell friend from foe!`;
      break;

    case 'Dragon': // Dragon Dance — multiplies WITH Overheat rather than replacing it
      setPStatus(uid,{type:'dragonDance', turnsLeft:T+1, deal:d.deal});
      /* The speed is its own status so Diamond Dust can refresh it, and so the
         order can read a tier rather than guess from the damage figure. */
      if(d.mach) setPStatus(uid,{type:'machDragon', turnsLeft:T+1, tier:d.mach, mine:true});
      res.msg = d.text;
      break;

    case 'Steel': // Steel Aegis — flat mitigation
      setPStatus(uid,{type:'steelAegis', turnsLeft:T+1, reduce:d.reduce, regen:d.regen||0, regenRolls:d.regenRolls||0});
      if(d.block) grantBlock(casterMon, d.block, casterAtk);
      res.msg = d.text;
      break;

    case 'Fairy': { // Diamond Dust — cleanse, ward, and (when refined) borrow
      const cleared = diamondDustCleanse();
      setPStatus(uid, { type:'diamondDust', turnsLeft:T+1,
                        borrowPick:d.borrowPick||0, borrowRandom:d.borrowRandom||0,
                        borrowTier:d.borrowTier||0, owner:uid });
      res.msg = d.text + (cleared ? ` ${cleared} enemy effect${cleared===1?'':'s'} swept away.` : '');
      res.borrowPick   = d.borrowPick || 0;     // how many the player chooses
      res.borrowRandom = d.borrowRandom || 0;   // how many the stone chooses
      break; }

    default:
      res.msg = 'Nothing happened.';
  }
  return res;
}


/* ============================================================
   CATACLYSM — the Water Dragon's charging ultimate
   ------------------------------------------------------------
   Charging costs a turn and a 10-word quiz. Once charged, Power1/Power2/
   Ultimate are replaced by Charge / Unleash / Hyperbeam, and Basic is locked
   out. Unleash and Hyperbeam need no words at all — the cost was paid up front.
   The window lasts (charges + 1) turns; spending the finale ends it.
   Leaving the field with charges banked triggers Dragon Legacy, handing the
   next monster a damage bonus that multiplies with Overheat and Dragon Dance.
   ============================================================ */
function chargeState(){ return ui.battle && ui.battle.charge; }
function chargeDef(m){
  const mv = MOVES[m.species] && MOVES[m.species].find(x=>x[6] && x[6].charge && moveUnlockedFor(m, x));
  return mv ? mv[6].charge : null;
}
/* 'Max' here is gated on the Dragon Core, not a level. */
function moveUnlockedFor(m, mv){
  const extra = mv[6] || {};
  if(extra.coreOnly) return !!m.hasDragonCore;
  return m.level >= mv[5];
}
function startCharge(mon, def){
  const b = ui.battle;
  b.charge = b.charge || { uid:mon.uid, charges:0, turnsLeft:0, def };
  b.charge.charges = Math.min(def.max, b.charge.charges + 1);
  b.charge.def = def;
  b.charge.turnsLeft = b.charge.charges + 1;   // 1 charge -> 2 turns, 2 -> 3
  /* The round you charge on ends immediately afterwards, and its end phase
     would age the window straight away — costing you one of the turns you just
     paid for. Skip that first tick. */
  b.charge.fresh = true;
  saveProfile();
}
function clearCharge(){ if(ui.battle) ui.battle.charge = null; }

/* Dragon Legacy: the stored power passes to whoever comes next. */
function triggerDragonLegacy(){
  const c = chargeState();
  if(!c || c.charges<=0) return;
  ui.battle.legacyBonus = c.charges * 0.25;
  clearCharge();
  battleMsg(`🐉 Dragon Legacy! The next monster's move is empowered by +${Math.round(ui.battle.legacyBonus*100)}%.`);
}

/* The move list while a charge is held. */
function chargeMoves(m){
  const c = chargeState();
  const def = c.def;
  const atCap = c.charges >= def.max;
  return [
    { slot:'Basic', name:'—', mult:null, target:'Single', words:0, unlock:0, available:false, isStone:false, locked:true },
    { slot:'Power1', name:'Charge', mult:null, target:'Charge', words:10, unlock:0,
      available:!atCap, isStone:false, chargeMore:true },
    { slot:'Power2', name:'Unleash', mult:(c.charges-1)*0.25 + def.unleash, target:'AOE', words:0, unlock:0,
      available:true, isStone:false, chargeSpend:'unleash' },
    { slot:'Ultimate', name:'Hyperbeam', mult:(c.charges-1)*0.5 + def.hyper, target:'Single', words:0, unlock:0,
      available:true, isStone:false, chargeSpend:'hyper' },
  ];
}

/* ============================================================
   TACTICAL MOVES  (Region 3)
   Weak monsters that can never be crowned earn their place through utility.
   - dot    : a field status ticking a share of the CASTER'S ATK each turn.
              ATK is snapshotted at cast, so switching the caster out later
              doesn't weaken it.
   - shell  : a short self-buff — damage reduction and/or thorns.
   - clones : the caster's chosen move is echoed by copies at reduced power.
   - bonus  : an optional second quiz that can double a move's damage.
   ============================================================ */
function applyDot(mv, mon){
  const b = ui.battle;
  const snap = Math.ceil(mv.dot.pct * monAtk(mon));
  b.fieldStatus = b.fieldStatus || {};
  const st = { type:'dot', turnsLeft:mv.dot.turns, tick:snap, rider:mv.dot.rider,
               miss:mv.dot.miss||0, label:mv.name };
  b.fieldStatus.dot = st;
  livingEnemies().forEach(e=> addEStatus(e, Object.assign({}, st)));
  return snap;
}
function applyShell(mv, mon){
  setPStatus(0, { type:'shell', turnsLeft:(mv.shell.turns||1)+1,
                  reduce:mv.shell.reduce||0, thorns:mv.shell.thorns||0, owner:mon.uid });
}
function applyClones(mv, mon){
  ui.battle.clones = { turnsLeft:mv.clones.turns, mult:mv.clones.mult,
                       evade:mv.clones.evade, uid:mon.uid };
  setPStatus(0, { type:'clones', turnsLeft:mv.clones.turns, evade:mv.clones.evade });
}
/* Clone echoes: successive hits that spread across untouched enemies first. */
function cloneEchoTargets(count){
  const living = livingEnemies();
  if(living.length===0) return [];
  const out = [];
  const unhit = living.slice();
  for(let i=0;i<count;i++){
    if(unhit.length===0) unhit.push(...living);          // everyone hit once; wrap around
    const idx = Math.floor(Math.random()*unhit.length);
    out.push(unhit.splice(idx,1)[0]);
  }
  return out;
}

/* ============================================================
   SKILL STONE UPGRADES
   A stone can be refined twice — to + and then to ✦ — by consuming a DUPLICATE
   of the same tier and type plus medals.
     low / mid / high : +0.1 damage per step, paid in Silver (5 then 10)
     ultra            : more hits AND more damage, paid in Gold (5 then 10)
     very high        : not upgradable yet
   ============================================================ */
const UPGRADE_MARKS = ['', ' +', ' ✦'];
const UPGRADE_COSTS = {
  low:      [{cur:'bronze',n:3},{cur:'bronze',n:5}],
  mid:      [{cur:'bronze',n:5},{cur:'bronze',n:10}],
  high:     [{cur:'silver',n:3},{cur:'silver',n:5}],
  veryhigh: [{cur:'silver',n:5},{cur:'silver',n:10}],
  ultra:    [{cur:'gold',  n:5},{cur:'gold',  n:10}],
};
/* Ultra gains hit-count as well as power, so it gets its own table. */
const ULTRA_TIERS = [
  { mult:0.50, min:5, max:7 },
  { mult:0.55, min:6, max:8 },
  { mult:0.60, min:7, max:9 },
];

function stonePlus(st){ return Math.max(0, Math.min(2, (st && st.plus) || 0)); }
function stoneUpgradable(st){ return !!(st && UPGRADE_COSTS[st.tier] && stonePlus(st) < 2); }
function stoneDisplayName(st){ return (st ? st.name : '') + UPGRADE_MARKS[stonePlus(st)]; }

/* The effective multiplier once refinement is taken into account. */
function stoneMult(st){
  const t = stoneTierDef(st.tier);
  const p = stonePlus(st);
  if(st.tier === 'ultra') return ULTRA_TIERS[p].mult;
  if(t.mult == null) return null;                  // very high: status, no damage
  return +(t.mult + 0.1 * p).toFixed(2);
}
function ultraHitRange(st){
  const p = stonePlus(st);
  return { min: ULTRA_TIERS[p].min, max: ULTRA_TIERS[p].max };
}
function upgradeCost(st){
  const tier = UPGRADE_COSTS[st.tier];
  return tier ? tier[stonePlus(st)] : null;
}
/* A duplicate is any OTHER stone of the same tier and type. */
function findDuplicate(st){
  return state.moveStones.find(x=>x!==st && x.uid!==st.uid && x.tier===st.tier && x.type===st.type);
}
function canUpgradeStone(st){
  if(!stoneUpgradable(st)) return { ok:false, why:st && st.tier==='veryhigh'
    ? 'Very High skills cannot be refined yet.' : 'Fully refined.' };
  const cost = upgradeCost(st);
  const dup = findDuplicate(st);
  if(!dup) return { ok:false, why:`Needs a second ${st.type} ${stoneTierDef(st.tier).label} stone.` };
  if(medalCount(cost.cur) < cost.n) return { ok:false, why:`Needs ${cost.n} ${curName(cost.cur)}.` };
  return { ok:true, cost, dup };
}

/* ============================================================
   VERY HIGH SKILLS — base / + / ✦
   One table drives the numbers, the behaviour and the tooltips, so a tier can
   never say one thing and do another.
   ============================================================ */
const VERY_HIGH = {
  Fire: { name:'Overheat', turns:5, tiers:[
    { deal:1.5, take:1.5 },
    { deal:1.5, take:1.3 },
    { deal:1.5, take:1.1, burn:0.25 },
  ], text:[
    'Your team deals 1.5× damage — and takes 1.5× in return.',
    'Your team deals 1.5× damage and takes only 1.3×.',
    'Deals 1.5×, takes just 1.1×, and scorches every enemy for 0.25× ATK each turn.',
  ]},
  Water: { name:'Ice Tomb', turns:2, tiers:[
    { freeze:2, taken:0.8 },
    { freeze:2, taken:1.0, frost:3 },
    { freeze:2, taken:1.0, field:true, frost:5 },
  ], text:[
    'Freezes the current wave for 2 turns. Frozen monsters take 80% damage.',
    'Freezes the current wave for <b>2 turns</b> at full damage, and <b>Frost Armour</b> closes over your monster: <b>3 layers of damage block</b>.',
    'A <b>2-turn field of ice</b> — anything that steps onto it is frozen too, wave after wave, at full damage. <b>Frost Armour</b> gives <b>5 layers of damage block</b>.',
  ]},
  Grass: { name:'Leech Seed', turns:5, tiers:[
    { heal:0.15, bite:0 },
    { heal:0.15, bite:0.10 },
    { heal:0.15, bite:0.15, biteHeals:true },
  ], text:[
    'Every hit on a seeded enemy heals your whole team for 0.15× the attacker\'s ATK.',
    'As base, and each hit also gnaws the enemy for 0.10× the attacker\'s ATK.',
    'As base, and each hit gnaws for 0.15× — and that bite feeds the heal again.',
  ]},
  Electric: { name:'Overcharge', turns:5, tiers:[
    { first:0.25, after:0.25 },
    { first:0.75, after:0.25 },
    { first:1.00, after:0.30 },
  ], text:[
    '25% chance to repeat a move. Very High skills never repeat.',
    '75% to repeat this turn, 25% thereafter. Very High skills never repeat.',
    'Guaranteed repeat this turn, 30% thereafter. Very High skills never repeat.',
  ]},
  Ground: { name:'Spike Armour', turns:5, tiers:[
    { reduce:0.20, thorns:0.20 },
    { reduce:0.25, thorns:0.30 },
    { reduce:0.30, thorns:0.40 },
  ], text:[
    'Take 20% less damage and return 0.20× ATK to every attacker.',
    'Take 25% less damage and return 0.30× ATK to every attacker.',
    'Take 30% less damage and return 0.40× ATK to every attacker.',
  ]},
  /* Dodging is no longer the point — it is the FUEL. Every evaded blow leaves a
     copy standing, and the copies strike at the end of the turn. */
  Flying: { name:'Mirage', turns:5, tiers:[
    { window:[1.00], after:0.15, images:0, imageDmg:0,    init:1 },
    { window:[1.00], after:0.20, images:1, imageDmg:0.20, init:2 },
    { window:[1.00], after:0.25, images:2, imageDmg:0.30, init:3 },
  ], text:[
    'One turn of total evasion, then <b>15%</b> each turn after. This monster moves with <b>+1 initiative</b>, and no enemy can sweep that away.',
    'One turn of total evasion, then <b>20%</b>. Every dodge leaves <b>one afterimage</b>; each strikes a random enemy for <b>0.2× ATK</b> at the end of the turn, then fades. <b>+2 initiative</b>.',
    'One turn of total evasion, then <b>25%</b>. Every dodge leaves <b>two afterimages</b>, each striking for <b>0.3× ATK</b>. <b>+3 initiative</b>.',
  ]},
  /* Not a returned hit — a READ. A counter stack eats one entire attack,
     however many times it strikes, and the monster that pulled it off comes out
     of the exchange angrier and more dangerous. */
  Physical: { name:'Counter', turns:5, tiers:[
    { stacks:1, regain:0.10, combo:0.25, enrage:0    },
    { stacks:1, regain:0.15, combo:0.25, enrage:0.20 },
    { stacks:2, regain:0.20, combo:0.25, enrage:0.20 },
  ], text:[
    '<b>1 Counter stack.</b> A stack takes an <b>entire</b> enemy attack on the guard — every hit of it — for <b>80% less damage</b>, then is spent, and the monster gains a <b>Combo</b> worth <b>+25%</b> on its next attack. <b>10%</b> chance each turn of another stack. Stacks never expire.',
    '<b>1 Counter stack</b>, and <b>15%</b> each turn for another. Blocking with one also grants <b>Enrage</b>: <b>+20% of base ATK, permanently</b>, stacking for the rest of the battle.',
    '<b>2 Counter stacks</b>, and <b>20%</b> each turn for another. Blocking grants both <b>Combo</b> and <b>Enrage</b>.',
  ]},
  Ghost: { name:'Curse', turns:5, tiers:[
    { extra:0.25, reduce:0 },
    { extra:0.25, reduce:0.10 },
    { extra:0.30, reduce:0.15 },
  ], text:[
    'Every enemy takes 25% more damage.',
    'Enemies take 25% more damage, and you take 10% less.',
    'Enemies take 30% more damage, and you take 15% less.',
  ]},
  /* Confusion you can SEE. A confused monster swings at its own side — or at
     itself, if it stands alone — which reads instantly and is far funnier than
     a percentage nobody notices. Certain on its first swing, then occasional. */
  /* Two independent rolls each turn. Friendly fire is checked first and wins
     any tie, so the two never double up. */
  /* The identity is self-harm, not denial. Higher tiers do not steal many more
     turns — they make each stolen swing land far harder on the enemy's own
     side. Friendly fire is rolled first and wins any tie with sleep. */
  Psychic: { name:'Discombobulate', turns:5, tiers:[
    { confuseFirst:1.0, confuseAfter:0.20, ffPower:0.60 },
    { confuseFirst:1.0, confuseAfter:0.15, ffPower:0.90, sleep:0.10, sleepTurns:1 },
    { confuseFirst:1.0, confuseAfter:0.20, ffPower:1.20, sleep:0.15, sleepTurns:1 },
  ], text:[
    'Every enemy is confused for 5 turns. <b>The first swing each one takes lands on its own side</b> — on itself, if it stands alone — for <b>60%</b> of its damage. <b>20%</b> of the swings after that go the same way.',
    'As base, but a turned swing lands for <b>90%</b> of its damage, and a confused monster has a separate <b>10%</b> chance to fall asleep for a turn instead.',
    'As base, but a turned swing lands for <b>120%</b> of its damage — harder on its own side than it would have hit you — with a separate <b>15%</b> chance of a nap.',
  ]},
  Dragon: { name:'Dragon Dance', turns:5, tiers:[
    { deal:1.25 },
    { deal:1.30, mach:1, passive:true, passiveOnly:'mach' },
    { deal:1.35, mach:2, passive:true, passiveOnly:'mach' },
  ], text:[
    'Your team deals 25% more damage. Stacks with Overheat and Curse.',
    'Carrying it is enough: <b>Mach Dragon</b> is up the moment this monster takes the field, and your team moves before anything that lacks it. Casting adds <b>30% more damage</b>.',
    'Carrying it is enough: <b>Mach Dragon ✦</b> is up from the moment it appears, outranking even a <b>+</b> on the other side. Casting adds <b>35% more damage</b>.',
  ]},
  Steel: { name:'Steel Aegis', turns:5, tiers:[
    { reduce:0.30 },
    { reduce:0.35, block:2, passive:true, passiveBlock:1, regenRolls:1 },
    { reduce:0.40, block:4, passive:true, passiveBlock:3, regenRolls:2 },
  ], text:[
    'Take 30% less damage.',
    'Carrying it is enough: <b>1 damage-block stack</b> the moment this monster appears. Casting adds <b>35% less damage taken</b> and <b>2 more stacks</b>. Each turn there is a <b>50% chance</b> of another.',
    'Carrying it is enough: <b>3 damage-block stacks</b> from the moment it appears. Casting adds <b>40% less damage taken</b> and <b>4 more stacks</b>. Each turn it rolls <b>twice at 50%</b> — a 75% chance of at least one more, and 25% of two.',
  ]},
  Fairy: { name:'Diamond Dust', turns:5, tiers:[
    { cleanse:true },
    { cleanse:true, passive:true, borrowRandom:1, borrowTier:1 },
    { cleanse:true, passive:true, borrowPick:1, borrowRandom:1, borrowTier:2 },
  ], text:[
    'Sweeps away every enemy effect — stuns, weakens, charms and their stances — and prevents new ones while it lasts. Your own effects stay refreshed.',
    'Now a passive, active the moment this monster takes the field. Using it actively also scatters <b>one random other Very High skill at + strength</b> — the light never falls the same way twice.',
    'Now a passive, active on entering the field. Using it actively casts <b>one Very High skill of your choosing at ✦ strength</b>, and <b>a second, different one at random</b> — two facets of the same stone.',
  ]},
};
function veryHighDef(type, plus){
  const v = VERY_HIGH[type];
  if(!v) return null;
  const t = Math.max(0, Math.min(2, plus||0));
  return { name:v.name, turns:v.turns, text:v.text[t], ...v.tiers[t] };
}

/* ============================================================
   STANCES — Guard, Airborne, Invisible, Preparation
   Several sailor monsters open with a stance (a passive on entering the field)
   that can also be re-applied actively, and an Ultimate that SPENDS the stance
   for a much bigger hit. The pattern is shared so new ones cost nothing.
   ============================================================ */
const STANCE_EVASION = { airborne:0.70, invisible:0.80 };

/* Apply whatever a move's `passive` block promises to its owner. */
function applyPassiveGrant(holder, grant, atk){
  if(!grant) return;
  // Diamond Dust keeps enemy stances from forming at all
  const isFoe = !!(ui.battle && ui.battle.enemies && ui.battle.enemies.includes(holder));
  if(isFoe && getPStatus(0,'diamondDust')) return;
  if(grant.block)     grantBlock(holder, grant.block, atk);
  if(grant.guard)     holder.guard = true;
  if(grant.airborne)  holder.airborne = (holder.airborne||0) + grant.airborne;
  if(grant.invisible) holder.invisible = (holder.invisible||0) + grant.invisible;
  if(grant.prep)      holder.prep = (holder.prep||0) + grant.prep;
  /* A stance of readiness: strike it this turn and it strikes back. */
  /* A brawler's innate stance is simply a tier-0 Counter stack: the same 80%
     guard, the same Combo, no Enrage. It does not expire. */
  if(grant.counterTurns || grant.counterStack){
    addCounterStack(holder, 0, grant.counterStack || grant.counterTurns || 1);
  }
  /* Perfect stillness — untouchable for a turn. */
  if(grant.evadeTurns){
    holder.evadeTurns = (holder.evadeTurns||0) + grant.evadeTurns;
    holder.evadeChance = grant.evadeChance || 1.0;
  }
  /* Some evasion is simply how the creature moves — a manta is a shadow with
     wings. Marked unsweepable so Diamond Dust cannot argue with it. */
  if(grant.evadeAlways){
    holder.evadeAlways = grant.evadeAlways;
    if(grant.unsweepable) holder.evadeUnsweepable = true;
  }
  /* Terrorize sits on the monster and is read from the other side's damage. */
  if(grant.terrorize){
    holder._terrorize = grant.terrorize;
    if(grant.unsweepable) holder._terrorizeUnsweepable = true;
  }
  /* Sings them under, rather than stunning them. */
  if(grant.thresholdSleep){
    holder.thresholdSleep = grant.thresholdSleep.slice();
    holder.sleepThresholdsHit = [];
  }
  /* Remembers which health thresholds it has already punished. */
  if(grant.thresholdStun){
    holder.thresholdStun = grant.thresholdStun.slice();
    holder.thresholdsHit = [];
  }
}
/* Everything a monster starts the battle with, the moment it takes the field. */
function applyEntryPassives(holder, species, level, atk){
  (MOVES[species]||[]).forEach(mv=>{
    const e = mv[6];
    if(!e || !e.passive) return;
    if((level||1) < mv[5]) return;
    applyPassiveGrant(holder, e.passive, atk);
  });
  /* A refined Very High stone can ALSO be a passive — Diamond Dust + and ✦ are
     meant to be working the moment their carrier takes the field, not waiting
     to be cast. This only ever applies to the player's own monsters. */
  if(holder && holder.uid) applyStonePassives(holder);
}

/* Stone passives, fired on entry. Currently only Diamond Dust has one, but the
   check reads the tier table rather than naming it. */
function applyStonePassives(mon){
  const b = ui.battle;
  if(!b) return;
  [mon.equippedStone, mon.power1Stone].forEach(st=>{
    if(!st || st.tier !== 'veryhigh') return;
    const plus = stonePlus(st);
    const d = veryHighDef(st.type, plus);
    if(!d || !d.passive) return;

    /* ONE free firing per charge of the recharge bar. The bar clears this flag
       when it fills, so the passive comes back exactly when a cast would. */
    b.passiveFired = b.passiveFired || {};
    const key = st.type + ':' + (mon.uid || '');
    if(b.passiveFired[key]) return;
    b.passiveFired[key] = true;

    /* Most passives hand over only PART of the effect, so casting stays worth
       the words — Dragon Dance gives the initiative but not the damage, Steel
       Aegis gives block but not the reduction. Diamond Dust is the exception:
       its whole sweep comes free, and casting buys the borrowed facet. */
    if(d.passiveOnly === 'mach'){
      const T = d.turns || veryHighDef(st.type, plus).turns || 5;
      setPStatus(0, { type:'machDragon', turnsLeft:T + 1, tier:d.mach, mine:true });
      renderStatusBadges();
      return setTimeout(()=> battleMsg(`🐉 ${escapeHtml(d.name)} — the air moves out of the way.`), 400);
    }
    if(d.passiveBlock){
      grantBlock(mon, d.passiveBlock, monAtk(mon));
      renderStatusBadges();
      return setTimeout(()=> battleMsg(`🛡 ${escapeHtml(d.name)} — ${d.passiveBlock} stack${d.passiveBlock>1?'s':''} already standing.`), 400);
    }

    if(getPStatus(0, veryHighStatusKey(st.type))) return;   // already running
    applyVeryHighEffect(st.type, mon, monAtk(mon), livingEnemies(), plus);
    renderStatusBadges();
    setTimeout(()=> battleMsg(`💎 ${escapeHtml(d.name)} is already in the air.`), 400);
  });
}
/* The party-status key a Very High type writes to. */
function veryHighStatusKey(type){
  return ({ Fire:'overheat', Water:'iceTomb', Grass:'leechSeed', Electric:'overcharge',
            Ground:'spikeArmour', Flying:'mirage', Physical:'counter', Ghost:'curse',
            Psychic:'discombobulate', Dragon:'dragonDance', Steel:'steelAegis',
            Fairy:'diamondDust' })[type] || type;
}
function stanceEvasion(holder){
  let best = 0;
  if(isElusive(holder)) best = Math.max(best, ELUSIVE_DODGE);   // it is not trying to trade
  if(holder && holder.evadeAlways) best = Math.max(best, holder.evadeAlways);
  if(holder && holder.airborne  > 0) best = Math.max(best, STANCE_EVASION.airborne);
  if(holder && holder.invisible > 0) best = Math.max(best, STANCE_EVASION.invisible);
  if(holder && holder.evadeTurns > 0) best = Math.max(best, holder.evadeChance || 1.0);
  return best;
}
/* A stance-spending Ultimate: consumes the stance for a far bigger multiplier. */
function spendStance(mv, holder, baseFactor){
  const sp = mv.spend;
  if(!sp) return baseFactor;
  const has = sp.status === 'guard'     ? !!holder.guard
            : sp.status === 'airborne'  ? (holder.airborne||0) > 0
            : sp.status === 'invisible' ? (holder.invisible||0) > 0 : false;
  if(!has) return baseFactor;
  let f = sp.mult;
  if(sp.perStack) f += sp.perStack * blockStacksOf(holder);
  if(sp.perPrep)  f += sp.perPrep  * (holder.prep||0);
  // spending the stance clears it
  if(sp.status === 'guard')     holder.guard = false;
  if(sp.status === 'airborne')  holder.airborne = 0;
  if(sp.status === 'invisible') holder.invisible = 0;
  /* Iaijutsu cashes in its BLOCK stacks; Ansatsu cashes in its PREPARATION.
     They are separate currencies and clearing the wrong one was robbing the
     ninja of its whole payoff. */
  if(sp.clearBlock) holder.blockStacks = 0;
  if(sp.clearPrep)  holder.prep = 0;
  return f;
}
/* Sweep the enemy board and top up your own. While Diamond Dust is up this
   runs every round, so enemy statuses can't get a foothold. */
/* ============================================================
   STATUS OWNERSHIP — the reference for what Diamond Dust touches
   ------------------------------------------------------------
   Ownership is about WHO BENEFITS, not where the data is stored. A stun sits in
   the player's status bag but belongs to the enemy who caused it.

     'enemy'  — the enemy benefits. Diamond Dust CLEANSES and PREVENTS these,
                wherever they live.
     'player' — you benefit. Diamond Dust REFRESHES these if they're on your
                side, and LEAVES THEM ALONE if they're marks you placed on an
                enemy (Leech Seed, Curse…). It must never undo your own work.

   Anything not listed defaults to 'player', so a new *player* effect needs no
   entry here — but a new ENEMY effect must be added or Diamond Dust will
   wrongly protect it.
   ============================================================ */
const STATUS_OWNER = {
  // inflicted on you by the enemy
  stunned:'enemy', paralysed:'enemy', softened:'enemy', charmed:'enemy',
  disrupt:'enemy', iceTombSelf:'enemy',
  /* Sleep and Mach Dragon exist on BOTH sides. Yours carry `mine:true` and are
     protected; theirs are swept. */
  asleep:'enemy', machDragon:'enemy',
  // enemy self-buffs held as statuses
  /* Dragon Dance and Steel Aegis are PLAYER buffs — listing them here made the
     dust's own chokepoint refuse to let you cast them. An enemy version would
     live on the enemy's side and be caught by the stance sweep instead. */
};
/* Enemy advantages held as plain fields rather than statuses.
   THE LINE: a thing with a duration or a consumable count is a temporary
   advantage and the dust sweeps it away. A thing with neither is what the
   creature IS — Lightning Cat, Hunter's Instinct — and stays.
   `thresholdsHit` is deliberately NOT here: it records which thresholds a
   Thunderhound has already spent, so clearing it would let the dust hand the
   enemy its stuns back. */
/* Everything here is something the monster GAINED during the fight rather than
   something it simply is — including Enrage, which is a state it worked itself
   into and not a part of its nature. The dust takes all of it. */
const ENEMY_STANCE_FIELDS = ['guard','airborne','invisible','prep','counterStack','evadeTurns','blockStacks','comboStacks','enrageStacks'];

/* Some effects exist on both sides. Disrupt is the clear case: cast by the
   enemy it slows YOU, cast by you it slows THEM. The table can only describe a
   type, so a status may override it by carrying `mine:true`. */
function isEnemyOwned(type, st){
  if(st && st.mine) return false;          // you cast this; the dust must not touch it
  return STATUS_OWNER[type] === 'enemy';
}

function diamondDustCleanse(){
  const b = ui.battle;
  if(!b) return 0;
  let cleared = 0;

  /* 1. Strip enemy-owned statuses from the player's side — a stun or a weaken
        belongs to whoever inflicted it, not to whoever is carrying it. */
  const ps = partyStatuses();
  Object.keys(ps).forEach(k=>{
    if(isEnemyOwned(k, ps[k])){ delete ps[k]; cleared++; }
  });

  /* 2. Strip enemy self-buffs: their stances, their guard, their block. Your
        OWN marks on them (Leech Seed, Curse, Ice Tomb…) are left standing. */
  b.enemies.forEach(e=>{
    eStatuses(e).slice().forEach(st=>{
      if(isEnemyOwned(st.type, st)){ removeEStatus(e, st.type); cleared++; }
    });
    ENEMY_STANCE_FIELDS.forEach(f=>{
      if(e[f]){ e[f] = Array.isArray(e[f]) ? [] : 0; cleared++; }
    });
    if(e.evadeAlways && !e.evadeUnsweepable){ e.evadeAlways = 0; cleared++; }
    /* Borrowed damage and durability. These reset to ONE, not zero — a swept
       takeMult of 0 would make the monster immortal rather than ordinary. The
       whale's own rage is left alone; that is what it is, not what it holds. */
    if(!e.enraged){
      if(e.dealMult && e.dealMult !== 1){ e.dealMult = 1; cleared++; }
      if(e.takeMult && e.takeMult !== 1){ e.takeMult = 1; cleared++; }
    }
    if(e.guard){ e.guard = false; }
    if(e.elusive){ e.elusive = false; e.gooed = true; cleared++; }   // pinned by the dust
  });

  /* Refreshing happens in tickStatuses() so that every path gets it. */
  return cleared;
}

/* Prevention: while Diamond Dust is up, an enemy-owned status simply never
   lands. Every enemy-side application routes through here. */
function enemyStatusBlocked(type){
  return !!getPStatus(0,'diamondDust') && isEnemyOwned(type);
}

/* The borrow grid: three across, four down, every OTHER element. The last row
   holds Dragon and Steel only — Fairy cannot borrow itself. */
const BORROW_GRID = ['Fire','Water','Grass','Electric','Ground','Flying','Physical','Ghost','Psychic','Dragon','Steel'];
function openBorrowPicker(mon, plus, count, done){
  const chosen = [];
  const paint = ()=>{
    const need = count - chosen.length;
    ov.innerHTML = `<div class="borrow-card">
      <div class="borrow-title">Diamond Dust</div>
      <div class="borrow-sub">Choose <b>${need}</b> more ${UPGRADE_MARKS[plus].trim()||''} skill${need>1?'s':''} to cast.</div>
      <div class="borrow-grid">
        ${BORROW_GRID.map(t=>{
          const d = veryHighDef(t, plus);
          const picked = chosen.includes(t);
          return `<button class="borrow-cell ${picked?'picked':''}" data-borrow="${t}">
            <span class="gem tier-veryhigh" style="--g1:${TYPE_COLORS[t]};--g2:${TYPE_COLORS[t]};--g3:${TYPE_COLORS[t]};"></span>
            <span class="borrow-name">${escapeHtml(d?d.name:t)}</span>
          </button>`;
        }).join('')}
      </div>
      ${chosen.length ? `<div class="borrow-picked">Chosen: ${chosen.map(t=>escapeHtml(veryHighDef(t,plus).name)).join(' → ')}</div>` : ''}
      <button class="btn btn-ghost" id="borrowSkip" style="margin-top:10px;">Cast nothing</button>
    </div>`;
    ov.querySelectorAll('[data-borrow]').forEach(btn=>btn.addEventListener('click', ()=>{
      const t = btn.dataset.borrow;
      if(chosen.includes(t)) return;
      chosen.push(t);
      if(chosen.length >= count){ close(); return done(chosen); }
      paint();
    }));
    ov.querySelector('#borrowSkip').addEventListener('click', ()=>{ close(); done(chosen); });
  };
  const ov = document.createElement('div');
  ov.className = 'borrow-scrim';
  document.body.appendChild(ov);
  const close = ()=>{ if(ov.parentNode) document.body.removeChild(ov); };
  paint();
}

/* Fire the borrowed skills in the order they were chosen. */
function castBorrowed(mon, atk, types, plus, done){
  if(!types || !types.length) return done();
  const next = (i)=>{
    if(i >= types.length) return done();
    const r = applyVeryHighEffect(types[i], mon, atk, livingEnemies(), plus);
    renderStatusBadges();
    const fd = veryHighDef(types[i], plus);
    battleMsg(`💎 A facet catches the light — ${fd ? fd.name : types[i]}! ${r.msg}`);
    setTimeout(()=> next(i+1), 1100);
  };
  next(0);
}

function stanceSummary(g){
  const bits = [];
  if(g.guard)     bits.push('on guard');
  if(g.airborne)  bits.push('airborne');
  if(g.invisible) bits.push('unseen');
  if(g.block)     bits.push(`${g.block} block stack${g.block>1?'s':''}`);
  if(g.prep)      bits.push(`${g.prep} preparation`);
  return bits.join(', ') + '.';
}
function stancePills(m){
  const out = [];
  if(m && m.guard)        out.push('<span class="status-pill mine">🛡 Guard</span>');
  if(m && m.airborne>0)   out.push('<span class="status-pill mine">🕊 Airborne</span>');
  if(m && m.invisible>0)  out.push('<span class="status-pill mine">👤 Invisible</span>');
  if(m && m.prep>0)       out.push(`<span class="status-pill mine">🎯 Prep ×${m.prep}</span>`);
  return out.join('');
}

/* ============================================================
   COUNTER · COMBO · ENRAGE
   A counter stack is a read, not a riposte: it eats ONE entire enemy attack,
   every hit of it, and is spent. Spending one leaves the monster with a Combo
   (a bigger next swing) and, at + and ✦, a permanent Enrage.
   ============================================================ */
function counterStacks(){ return counterCountOf(activeMon()); }

const COUNTER_REDUCTION = 0.80;      // a braced guard turns away four fifths of it

/* ------------------------------------------------------------
   Counter stacks are TIERED, and any monster can hold them — yours or theirs.
   A dojo brawler's innate stance is a tier-0 stack: the same 80% guard and the
   same Combo, but no Enrage. A refined Counter stone lays tier-1 or tier-2
   stacks on top, and those carry Enrage. Catch a Weasel, teach it Counter ✦,
   and it holds both kinds — the better ones are always spent first.
   ------------------------------------------------------------ */
const COUNTER_TIERS = [
  { tier:0, combo:0.25, enrage:0    },   // an innate brawler's stance
  { tier:1, combo:0.25, enrage:0.20 },
  { tier:2, combo:0.25, enrage:0.20 },
];
function counterList(holder){
  if(!holder) return [];
  if(!Array.isArray(holder.counterStack)) holder.counterStack = [];
  return holder.counterStack;
}
function addCounterStack(holder, tier, n){
  const list = counterList(holder);
  for(let k = 0; k < (n||1); k++) list.push(COUNTER_TIERS[tier||0]);
  return list.length;
}
/* Always spend the best one first. */
function takeBestCounter(holder){
  const list = counterList(holder);
  if(!list.length) return null;
  let bi = 0;
  list.forEach((s,i)=>{ if(s.tier > list[bi].tier) bi = i; });
  return list.splice(bi, 1)[0];
}
function counterCountOf(holder){ return counterList(holder).length; }

/* Called when an enemy attack is about to land during an ACTION phase. Returns
   the damage multiplier to apply — 1 if no stack was spent. A stack covers the
   ENTIRE attack, single or twin or barrage alike, and is then gone. */
function spendCounterStack(mon){
  const st = takeBestCounter(mon);
  if(!st) return 1;
  mon.comboStacks = (mon.comboStacks||0) + 1;
  if(st.enrage) mon.enrageStacks = (mon.enrageStacks||0) + 1;
  renderStatusBadges();
  paintEnrage(mon);
  battleMsg(`🛡 ${displayName(mon)} plants a foot and takes it on the guard — <b>80% turned away!</b>`
    + (st.enrage ? ` <b>Combo</b> and <b>Enrage</b> rise.` : ` <b>Combo</b> rises.`));
  return 1 - COUNTER_REDUCTION;
}
/* The same guard, in enemy hands. */
function spendEnemyCounter(e){
  const st = takeBestCounter(e);
  if(!st) return 1;
  e.comboStacks = (e.comboStacks||0) + 1;
  if(st.enrage) e.enrageStacks = (e.enrageStacks||0) + 1;
  renderStatusBadges();
  battleMsg(`🛡 ${SPECIES[e.species].name} takes it on the guard — <b>80% turned away!</b> Its next blow will be heavier.`);
  return 1 - COUNTER_REDUCTION;
}
/* Combo: additive, spent by the next attack. */
function comboMultiplier(mon){
  const c = getPStatus(0,'counter');
  const n = (mon && mon.comboStacks) || 0;
  if(!n) return 1;
  return 1 + n * ((c && c.combo) || 0.25);
}
function clearCombo(mon){ if(mon) mon.comboStacks = 0; }
/* Enrage: permanent for the battle, a share of BASE attack, additive. */
function enrageBonus(mon){
  const c = getPStatus(0,'counter');
  const n = (mon && mon.enrageStacks) || 0;
  if(!n) return 0;
  return Math.round(n * ((c && c.enrage) || 0.20) * rawMonAtk(mon));
}
function paintEnrage(mon){
  const el = document.getElementById('playerBob');
  if(!el) return;
  const n = Math.min((mon && mon.enrageStacks) || 0, 5);
  el.classList.toggle('enraged', n > 0);
  el.style.setProperty('--enrage', n);
}

/* ============================================================
   MIRAGE AFTERIMAGES
   Every dodge leaves a copy. They strike at the end of the turn and fade.
   ============================================================ */
function noteMirageDodge(){
  const m = getPStatus(0,'mirage');
  if(!m || !m.images) return;
  m.pending = (m.pending||0) + m.images;
  spawnAfterimages(m.images);
}
function spawnAfterimages(n){
  const host = document.getElementById('playerBob');
  const layer = document.getElementById('fxLayer') || document.getElementById('screen');
  if(!host || !layer) return;
  const hb = host.getBoundingClientRect(), lb = layer.getBoundingClientRect();
  for(let k = 0; k < n; k++){
    const img = host.querySelector('img');
    const el = document.createElement(img ? 'img' : 'div');
    if(img) el.src = img.src;
    el.className = 'afterimage';
    el.style.left = (hb.left - lb.left + (k%2 ? -26 : 26)) + 'px';
    el.style.top  = (hb.top  - lb.top  + (k>1 ? 14 : -8)) + 'px';
    el.style.width = hb.width + 'px';
    layer.appendChild(el);
    setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 4200);
  }
}
/* End phase: every copy strikes a random enemy, then they all fade. */
function resolveAfterimages(done){
  const m = getPStatus(0,'mirage');
  if(!m || !(m.pending > 0)) return done();
  const n = m.pending; m.pending = 0;
  const mon = activeMon();
  if(!mon || livingEnemies().length === 0){ clearAfterimages(); return done(); }
  const per = Math.ceil((m.imageDmg||0.2) * monAtk(mon) * ownBuffMultiplier());
  let k = 0;
  const step = ()=>{
    const foes = livingEnemies();
    if(k >= n || !foes.length){ clearAfterimages(); return setTimeout(done, 300); }
    k++;
    const t = foes[Math.floor(Math.random()*foes.length)];
    const idx = ui.battle.enemies.indexOf(t);
    const hits = [{ t, idx, dmg:per, oldHp:t.hp, newHp:Math.max(0, t.hp - per) }];
    battleMsg(`👥 An afterimage steps out of nowhere and strikes!`);
    applyHits(hits, { noLeech:true });
    reportHits(hits);
    setTimeout(step, 620);
  };
  step();
}
function clearAfterimages(){
  document.querySelectorAll('.afterimage').forEach(el=>{
    el.classList.add('fading');
    setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 420);
  });
}

/* ============================================================
   JAX'S THREE: Rage · Overpower · Terrorize
   ============================================================ */

/* ---- RAGE ----------------------------------------------------------------
   Free 20% criticals, until you spend it. Four words buy a certain critical
   this turn, and the free chance then sleeps for five turns — the first move
   in the game where using something makes it temporarily worse.            */
function rageState(holder){
  if(!holder._rage) holder._rage = { muted:0, forced:false };
  return holder._rage;
}
function rageDef(holder){
  const mv = (MOVES[holder.species]||[]).find(m=>m[6] && m[6].rage);
  return mv ? mv[6].rage : null;
}
/* Returns the damage multiplier for this swing: 1, or the critical figure. */
function rageMultiplier(holder){
  const def = rageDef(holder);
  if(!def) return 1;
  const st = rageState(holder);
  if(st.forced){
    st.forced = false;
    st.muted = def.mute || 5;            // the bargain comes due
    battleMsg(`💥 <b>CRITICAL</b> — ${holder.uid ? displayName(holder) : SPECIES[holder.species].name} strikes with everything.`);
    return def.crit || 1.5;
  }
  if(st.muted > 0) return 1;             // spent, and quiet for a while yet
  if(Math.random() < (def.chance || 0.20)){
    battleMsg(`💥 A critical!`);
    return def.crit || 1.5;
  }
  return 1;
}
function tickRage(holder){
  const st = holder && holder._rage;
  if(st && st.muted > 0) st.muted--;
}

/* ---- OVERPOWER -----------------------------------------------------------
   Two turns of +25% attack, and while it runs, anything weaker than you takes
   a quarter again on top. Bullying, formalised.                            */
function overpowerOf(holder){
  const st = holder && holder._overpower;
  return (st && st.turnsLeft > 0) ? st : null;
}
function castOverpower(holder, def){
  holder._overpower = { turnsLeft:(def.turns||2) + 1, atk:def.atk||0.25, bully:def.bully||1.25 };
  renderStatusBadges();
  battleMsg(`💪 ${holder.uid ? displayName(holder) : SPECIES[holder.species].name} swells — <b>+${Math.round((def.atk||0.25)*100)}% attack</b>, and it means to use it.`);
}
function tickOverpower(holder){
  const st = holder && holder._overpower;
  if(st && st.turnsLeft > 0) st.turnsLeft--;
}

/* ---- TERRORIZE -----------------------------------------------------------
   Simply being looked at by this thing makes you hit softer. It is what the
   creature IS, so no sweep removes it.                                     */
function terrorizeFactor(defenderSideMon){
  const b = ui.battle;
  if(!b) return 1;
  let worst = 1;
  (b.enemies || []).forEach(e=>{
    if(e.hp <= 0) return;
    const p = passiveOf(e);
    const t = (p && p.terrorize) || (e._terrorize || 0);
    if(t) worst = Math.min(worst, 1 - t);
  });
  return worst;
}

/* ============================================================
   ENEMY VERY-HIGH STONES
   A trainer's monster can walk in already carrying a refined skill. Only the
   handful Jax actually uses are implemented — the rest fall through
   harmlessly rather than pretending.
   ============================================================ */
function applyEnemyVeryHigh(e, type, plus){
  const d = veryHighDef(type, plus||0);
  if(!d) return;
  const T = d.turns || 5;
  switch(type){
    case 'Fire':
      /* Overheat in enemy hands: it hits harder and takes more, exactly as it
         would for you. Firehound is built to exploit the first half. */
      e.dealMult = (e.dealMult || 1) * (d.deal || 1.5);
      e.takeMult = (e.takeMult || 1) * (d.take || 1.5);
      break;
    case 'Dragon':
      e.dealMult = (e.dealMult || 1) * (d.deal || 1.25);
      if(d.mach) addEStatus(e, { type:'machDragon', turnsLeft:T + 1, tier:d.mach });
      break;
    case 'Steel':
      e.takeMult = (e.takeMult || 1) * (1 - (d.reduce || 0.30));
      if(d.block) grantBlock(e, d.block, e.atk);
      if(d.passiveBlock) grantBlock(e, d.passiveBlock, e.atk);
      break;
    case 'Flying':
      e.evadeAlways = Math.max(e.evadeAlways || 0, d.after || 0.15);
      e.airborne = Math.max(e.airborne || 0, 1);      // the opening untouchable turn
      break;
    case 'Water': {
      /* Ice Tomb in enemy hands freezes YOU rather than them. */
      const mon = activeMon();
      if(mon) setPStatus(0, { type:'asleep', turnsLeft:(d.freeze || 2) + 1 });
      break;
    }
    default: return;
  }
  renderStatusBadges();
  setTimeout(()=> battleMsg(`💎 ${SPECIES[e.species].name} carries <b>${escapeHtml(d.name)}</b>.`), 500);
}

/* ============================================================
   PIERCING STOOP
   The eagle climbs, then falls. Charging makes it harder to touch and makes the
   fall heavier, and what lands is not an attack at all — it is health taken
   away. No evasion, no guard, no reduction, and no damage bonus either.
   ============================================================ */
function stoopState(holder){
  if(!holder._stoop) holder._stoop = { charges:0 };
  return holder._stoop;
}
function stoopCharge(holder, def){
  const st = stoopState(holder);
  st.charges = Math.min(def.max || 3, st.charges + 1);
  holder.evadeAlways = (def.evade || [0.25,0.5,0.75])[st.charges - 1] || 0;
  holder.evadeUnsweepable = false;
  return st.charges;
}
function stoopRelease(holder, def){
  const st = stoopState(holder);
  const n = st.charges;
  st.charges = 0;
  holder.evadeAlways = 0;
  if(!n) return 0;
  const pct = (def.pierce || [0.5,0.75,1.0])[n - 1] || 0;
  return { hits:Math.ceil(pct * monMaxHpAny(holder)), charges:n };
}
/* Works for a party monster or an enemy — they store health differently. */
function monMaxHpAny(h){
  return (h && h.uid) ? monMaxHp(h) : (h ? h.maxHp : 0);
}

/* ============================================================
   CALADRIUS — Vita, Conversio, and the Mors marks
   Everything it does is measured against its own MAX HEALTH, which Pacificus
   has made enormous. It heals by being large, and it revives by spending
   itself: three marks and the bird goes down for good.
   ============================================================ */
const MORS_LIMIT = 3;

function morsMarks(mon){ return (mon && mon.morsMarks) || 0; }
function addMors(mon, n){
  mon.morsMarks = morsMarks(mon) + (n||1);
  if(mon.morsMarks >= MORS_LIMIT && mon.currentHp > 0){
    mon.currentHp = 0;
    battleMsg(`🕊 ${displayName(mon)} has given everything it had. It folds its wings.`);
  }
  renderStatusBadges();
}
/* A marked Caladrius cannot be brought back — the marks simply take it again. */
function morsBlocksRevival(mon){ return morsMarks(mon) >= MORS_LIMIT; }

/* Vita: an immediate pulse, then a field that tends whoever is worst off. */
function castVita(mon, def){
  const heal = Math.ceil((def.pulse || 0.2) * monMaxHp(mon));
  let touched = 0;
  battleParty().forEach(m=>{
    if(m.currentHp <= 0) return;
    const before = m.currentHp;
    m.currentHp = Math.min(monMaxHp(m), m.currentHp + heal);
    if(m.currentHp > before) touched++;
    if(m === activeMon()) drainHp('playerHp', before, m.currentHp, monMaxHp(m));
  });
  /* The field never stacks — casting again simply sets the clock back to five. */
  setPStatus(0, { type:'vita', turnsLeft:(def.turns||5) + 1, pulse:def.pulse||0.2, owner:mon.uid });
  renderStatusBadges();
  battleMsg(`🕊 Vita — <b>${heal} HP</b> to everyone still standing, and the light stays behind.`);
  return touched;
}
/* Each upkeep it tends the single monster in the worst shape, by proportion. */
function vitaPulse(done){
  const v = getPStatus(0,'vita');
  if(!v) return done();
  const party = battleParty().filter(m=>m.currentHp > 0 && m.currentHp < monMaxHp(m));
  if(!party.length) return done();
  party.sort((a,b)=> (a.currentHp/monMaxHp(a)) - (b.currentHp/monMaxHp(b)));
  const t = party[0];
  const owner = state.party.concat(state.storage).find(m=>m.uid === v.owner);
  const heal = Math.ceil((v.pulse||0.2) * (owner ? monMaxHp(owner) : monMaxHp(t)));
  const before = t.currentHp;
  t.currentHp = Math.min(monMaxHp(t), t.currentHp + heal);
  if(t === activeMon()) drainHp('playerHp', before, t.currentHp, monMaxHp(t));
  battleMsg(`🕊 The light finds ${displayName(t)} — <b>+${t.currentHp - before} HP</b>.`);
  setTimeout(done, 700);
}

/* ============================================================
   CUAIN — the Whalelord's kit
   Three moves that all pay more the worse things are going.
     Grudge          scales with HIS missing health
     Haunting Aria   punishes the enemy for landing hits at all
     Gathering Wrath scales with how much the TEAM has been hurt
   ============================================================ */

/* ---- Haunting Aria: a 5-turn field the whole party stands in ---- */
function ariaState(){ return ui.battle ? getPStatus(0,'aria') : null; }
function ariaActive(){ const a = ariaState(); return !!(a && a.turnsLeft > 0); }

function castAria(mon, def, byReflex){
  const b = ui.battle;
  if(!b || ariaActive()) return false;
  setPStatus(0, {
    type:'aria', turnsLeft:(def.turns||5) + 1,
    pulse:def.pulse || 0.5, chance:def.chance || 0.5,
    atk: monAtk(mon), owner: mon.uid,
    fieldEvade: 1,                 // one turn of total evasion, for ANYONE on the field
    struck: false,
  });
  renderStatusBadges();
  battleMsg(byReflex
    ? `👻 ${displayName(mon)} was not there — a Haunting Aria answers instead!`
    : `👻 ${displayName(mon)} sings, and the water goes cold.`);
  return true;
}
/* The turn of untouchability belongs to the FIELD, so a monster swapping in
   during it inherits the protection. */
function ariaFieldEvasion(){
  const a = ariaState();
  return (a && a.fieldEvade > 0) ? 1 : 0;
}
/* The passive: struck while the Aria is not running, it sings by reflex and the
   blow misses. Costs no turn and no words. */
function ariaReflex(mon){
  if(ariaActive()) return false;
  const mv = (MOVES[mon.species]||[]).find(m=>m[6] && m[6].aria);
  if(!mv) return false;
  return castAria(mon, mv[6].aria, true);
}
/* End of round: if anything of yours was hit, the dead whale may surface. */
function ariaRetaliate(done){
  const a = ariaState();
  if(!a || !a.struck){ if(a) a.struck = false; return done(); }
  a.struck = false;
  if(Math.random() >= (a.chance || 0.5)) return done();
  const foes = livingEnemies();
  if(!foes.length) return done();
  const dmg = Math.ceil((a.pulse || 0.5) * a.atk * ownBuffMultiplier());
  const hits = foes.map(t=>({ t, idx:ui.battle.enemies.indexOf(t), dmg,
                              oldHp:t.hp, newHp:Math.max(0, t.hp - dmg) }));
  battleMsg('👻 Something enormous surfaces out of nowhere and is gone again.');
  applyHits(hits, { noLeech:true });
  reportHits(hits);
  setTimeout(done, 850);
}

/* ---- Gathering Wrath ---- */
function wrathState(){ return ui.battle ? getPStatus(0,'wrath') : null; }
function wrathStacks(){ const w = wrathState(); return w ? (w.stacks||0) : 0; }
/* The standing damage bonus, capped well below what the cash-in can use. */
function wrathDamageBonus(){
  const w = wrathState();
  if(!w || !w.stacks) return 1;
  return 1 + Math.min(w.stacks * w.bonus, w.bonusCap);
}
/* One stack per enemy MOVE — not per hit, and whether or not it lands. */
function noteWrath(){
  const w = wrathState();
  if(!w || w.turnsLeft <= 0) return;
  w.stacks = (w.stacks || 0) + 1;
  renderStatusBadges();
}
/* Cashing in: free, no words, on swapping Cuain back into the fight. */
function vengefulWrath(mon, done){
  const w = wrathState();
  const n = w ? (w.stacks||0) : 0;
  if(!n) return done();
  const counted = Math.min(n, w.dmgCap || 15);
  const per = Math.ceil(w.per * monAtk(mon));
  /* The bonus applies BEFORE the stacks are cleared, so the blow rides the
     anger that produced it. */
  const dmg = Math.ceil(counted * per * wrathDamageBonus() * ownBuffMultiplier());
  const foes = livingEnemies();
  if(!foes.length){ w.stacks = 0; return done(); }
  const hits = foes.map(t=>({ t, idx:ui.battle.enemies.indexOf(t), dmg,
                              oldHp:t.hp, newHp:Math.max(0, t.hp - dmg) }));
  battleMsg(`🌊 <b>VENGEFUL WRATH</b> — ${n} grudge${n>1?'s':''} come due!`);
  setTimeout(()=>{
    applyHits(hits, { noLeech:true });
    reportHits(hits);
    w.stacks = 0;
    renderStatusBadges();
    setTimeout(done, 900);
  }, 600);
}

/* ---- Grudge: worth more the closer he is to gone ---- */
function grudgeDamage(mon, def){
  const missing = Math.max(0, monMaxHp(mon) - mon.currentHp);
  return Math.ceil(((def.flat || 0.25) * monAtk(mon) + (def.missing || 0.75) * missing)
                   * ownBuffMultiplier());
}

/* ============================================================
   ELUSIVE
   The generator thieves are here for the power, not a fight. They take a fifth
   of the damage they should, and they bolt the moment their turn comes round.
   Three answers: kill one before it moves, glue it down with Magma Goo, or
   sweep the status away with Diamond Dust.
   ============================================================ */
const ELUSIVE_DODGE = 0.80;              // slips four blows in five

function isElusive(e){ return !!(e && e.elusive && !e.gooed); }
/* Magma Goo (and anything else with the noflee rider) pins them down and the
   status drops entirely — after that they fight like anything else. */
/* Goo lands whatever the dodge says — you cannot slip something that is
   already stuck to the floor around you. */
function pinDown(e){
  if(!e || !e.elusive) return false;
  e.gooed = true;
  e.elusive = false;
  return true;
}
/* Everything that fled is gone; anything KO'd is still catchable. */
function elusiveFlee(e){
  const b = ui.battle;
  if(!b) return;
  e.fled = true;
  e.hp = 0;                              // off the field, but never counted as beaten
  const idx = b.enemies.indexOf(e);
  const el = document.getElementById('enemy-'+idx);
  if(el) el.classList.add('fled');
  battleMsg(`💨 ${SPECIES[e.species].name} snatches what it came for and bolts!`);
}

/* ============================================================
   ELEMENTAL STONES
   Held in the inventory, attached to one monster at a time, and freely moved.
   Adding a new element means one row here and nothing else.
   ============================================================ */
const ELEMENTAL_STONES = [
  { id:'waterStone',    name:'Water Stone',    icon:'water_stone',    emoji:'💧', type:'Water' },
  { id:'fireStone',     name:'Fire Stone',     icon:'fire_stone',     emoji:'🔥', type:'Fire' },
  { id:'grassStone',    name:'Grass Stone',    icon:'grass_stone',    emoji:'🌿', type:'Grass' },
  { id:'electricStone', name:'Electric Stone', icon:'electric_stone', emoji:'⚡', type:'Electric' },
  { id:'flyingStone',   name:'Flying Stone',   icon:'flying_stone',   emoji:'🕊', type:'Flying' },
  { id:'groundStone',   name:'Ground Stone',   icon:'ground_stone',   emoji:'⛰', type:'Ground' },
  { id:'physicalStone', name:'Physical Stone', icon:'physical_stone', emoji:'👊', type:'Physical' },
  { id:'psychicStone',  name:'Psychic Stone',  icon:'psychic_stone',  emoji:'🔮', type:'Psychic' },
  { id:'ghostStone',    name:'Ghost Stone',    icon:'ghost_stone',    emoji:'👻', type:'Ghost' },
  { id:'dragonStone',   name:'Dragon Stone',   icon:'dragon_stone',   emoji:'🐉', type:'Dragon' },
  { id:'steelStone',    name:'Steel Stone',    icon:'steel_stone',    emoji:'🛡', type:'Steel' },
  { id:'fairyStone',    name:'Fairy Stone',    icon:'fairy_stone',    emoji:'✨', type:'Fairy' },
].map(s=>Object.assign(s, { xp:1.5, blurb:`A ${s.type} monster carrying it learns half again as fast.` }));
function heldStones(){ return ELEMENTAL_STONES.filter(s=>state.inventory[s.id]); }
function stoneOnKey(id){ return id + 'On'; }
function stoneHolder(id){ return state.inventory[stoneOnKey(id)] || null; }
/* The multiplier for one monster, from whichever stone it carries. */
function stoneXpBonus(m){
  const s = ELEMENTAL_STONES.find(st=>stoneHolder(st.id) === m.uid);
  return s ? s.xp : 1;
}
/* A dual-type monster matches more than one stone. Prefer the one it already
   carries, then any you own, and only then the first by type — otherwise a
   Water Dragon matched the Water Stone you don't have and showed no panel at
   all, hiding the Dragon Stone you do. */
function stoneFor(m){
  const types = SPECIES[m.species].types || [];
  const matches = ELEMENTAL_STONES.filter(st=>types.includes(st.type));
  return matches.find(st=>stoneHolder(st.id) === m.uid)
      || matches.find(st=>state.inventory[st.id])
      || matches[0];
}

/* ============================================================
   PRE-HITS
   Damage that resolves at the very start of the player's turn, before any
   action is chosen. Each pre-hit is its own effect with its own lifetime — an
   Aftershock is not attached to Rampage, and Overheat ✦'s burn is not attached
   to any move at all. Both scale with the player's damage buffs.
   ============================================================ */
function addPreHit(p){
  const b = ui.battle;
  if(!b) return;
  b.preHits = b.preHits || [];
  b.preHits.push(p);          // { label, pct, atk, turnsLeft, aoe }
}
/* Resolve everything queued, then hand control back. */
function runPreHits(done){
  const b = ui.battle;
  if(!b || !b.preHits || !b.preHits.length) return done();
  const queue = b.preHits.slice();
  let i = 0;
  const step = ()=>{
    if(i >= queue.length){
      // tick lifetimes; each entry expires on its own schedule
      b.preHits.forEach(p=>p.turnsLeft--);
      b.preHits = b.preHits.filter(p=>p.turnsLeft > 0);
      return done();
    }
    const p = queue[i++];
    const foes = livingEnemies();
    if(!foes.length) return step();
    const buff = ownBuffMultiplier();          // Overheat / Dragon Dance / Legacy
    const hits = foes.map(t=>{
      let dmg = Math.ceil(p.pct * p.atk * buff);
      const cur = getEStatus(t,'curse');
      if(cur) dmg = Math.ceil(dmg * (1 + (cur.extra != null ? cur.extra : 0.25)));
      return { t, idx:b.enemies.indexOf(t), dmg, oldHp:t.hp, newHp:Math.max(0,t.hp-dmg) };
    });
    applyHits(hits, { noLeech:true });   // upkeep damage never feeds Leech Seed
    reportHits(hits);
    battleMsg(p.label);
    setTimeout(step, 850);
  };
  step();
}

/* ============================================================
   DAMAGE BLOCK STACKS
   Each stack absorbs up to 100% of the CASTING monster's ATK from the next hit
   it takes. Overflow still lands. Any blocked hit consumes a stack, even a weak
   one — so a multi-hit move burns a stack per strike. Reduction (Spike Armour,
   Steel Aegis, Curse…) is applied first; block is measured against the final
   figure.
   ============================================================ */
function blockStacksOf(holder){ return (holder && holder.blockStacks) || 0; }
/* A shield your side raised belongs to your SIDE — switching passes it to
   whoever steps up, at the value it was minted at. Enemy blocks stay with the
   monster that made them. */
function carryBlockOnSwitch(from, to){
  if(!from || !to || from === to) return;
  if(!from.blockStacks) return;
  to.blockStacks = (to.blockStacks||0) + from.blockStacks;
  to.blockValue = from.blockValue || to.blockValue || 0;
  from.blockStacks = 0;
  setTimeout(refreshAllBlockBars, 0);
}
function grantBlock(holder, n, atkAt){
  if(!holder || n<=0) return;
  holder.blockStacks = (holder.blockStacks||0) + n;
  // each stack remembers the ATK it was minted at
  holder.blockValue = atkAt || holder.blockValue || 0;
  setTimeout(refreshAllBlockBars, 0);      // show it at once, not next render
}
/* Consume one stack against `dmg`; returns what actually gets through. */
function applyBlock(holder, dmg, barId){
  if(!holder || !holder.blockStacks || holder.blockStacks <= 0) return dmg;
  const before = holder.blockStacks;
  holder.blockStacks--;
  if(barId) drainBlock(barId, before, holder.blockStacks);
  const absorbed = holder.blockValue || 0;
  return Math.max(0, dmg - absorbed);
}
/* A second bar above the HP bar: a shield, the stack count, and one segment per
   stack. Each segment is worth the caster's ATK, shown at the right. */
/* A dodge reads as a quick drift away and back: enemies slip right, the player
   slips left, so the direction always means "away from the attacker". */
function dodgeDrift(el){
  if(!el) return;
  el.classList.remove('dodge-drift');
  void el.offsetWidth;                 // restart the animation
  el.classList.add('dodge-drift');
  setTimeout(()=> el.classList.remove('dodge-drift'), 480);
}
function dodgeEnemy(idx){ dodgeDrift(document.getElementById('enemyBob-'+idx)); }
function dodgePlayer(){   dodgeDrift(document.getElementById('playerBob')); }
/* A counter is a dodge followed by a strike back. */
function counterDrift(el, attackEl){
  dodgeDrift(el);
  setTimeout(()=>{
    if(!attackEl) return;
    attackEl.classList.add('counter-lunge');
    setTimeout(()=> attackEl.classList.remove('counter-lunge'), 420);
  }, 320);
}
function floatMiss(anchorId, text){
  const host = document.getElementById(anchorId);
  const layer = document.getElementById('fxLayer') || document.getElementById('screen');
  if(!host || !layer) return;
  const hb = host.getBoundingClientRect(), lb = layer.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'miss-pop';
  el.textContent = text || 'MISS';
  el.style.left = (hb.left - lb.left + hb.width/2) + 'px';
  el.style.top  = (hb.top  - lb.top  + hb.height*0.3) + 'px';
  layer.appendChild(el);
  setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 1200);
}

/* Leech Seed in one place. Heals the whole party, and on + / ✦ also gnaws the
   enemy — with ✦ that bite feeds the heal again. Both the single-hit and the
   multi-hit paths call this, so they can never drift apart. */
function resolveLeech(target, mon){
  const ls = getEStatus(target,'leechSeed');
  if(!ls) return 0;
  const atk = monAtk(mon);
  let healed = Math.ceil((ls.heal || 0.15) * atk);
  const bite = ls.bite || 0;
  if(bite && target.hp > 0){
    const dmg = Math.ceil(bite * atk);
    const before = target.hp;
    target.hp = Math.max(0, target.hp - dmg);
    const idx = ui.battle.enemies.indexOf(target);
    drainHp('enemyHp-'+idx, before, target.hp, target.maxHp);
    showDamageNumber('enemy-'+idx, before - target.hp);
    if(target.hp <= 0){ const el=document.getElementById('enemy-'+idx); if(el) el.classList.add('fainted'); }
    if(ls.biteHeals) healed += Math.ceil((ls.heal || 0.15) * atk);   // ✦ feeds twice
  }
  return healed;
}
/* NOT the recovery-pool healParty(pct) in 08-screens2.js. These files share one
   global scope, so the later definition used to overwrite this one — leech
   drain was calling the recovery version, playing its chime and treating the
   HP figure as a PERCENTAGE. Distinct names, permanently. */
function leechHealParty(amount, mon){
  if(amount <= 0) return;
  battleParty().forEach(m=>{
    if(m.currentHp<=0) return;
    const before = m.currentHp, max = monMaxHp(m);
    m.currentHp = Math.min(max, m.currentHp + amount);
    if(m===mon) drainHp('playerHp', before, m.currentHp, max);
  });
}

function blockBar(id, holder){
  const n = blockStacksOf(holder);
  if(!n) return `<div class="blk-wrap" id="${id}" style="display:none;"></div>`;
  const val = holder.blockValue || 0;
  return `<div class="blk-wrap" id="${id}" data-max="${n}">
    <span class="blk-shield">🛡</span>
    <span class="blk-count">×${n}</span>
    <span class="blk-track">${Array.from({length:n},()=>'<i></i>').join('')}</span>
    <span class="blk-val">${val}</span>
  </div>`;
}
/* Rebuild a bar in place. Stacks are GAINED mid-battle — Steel Aegis, Guard's
   per-turn top-up, a passive firing as a monster enters — and without this the
   bar stayed hidden until the next full re-render. */
function refreshBlockBar(id, holder){
  const el = document.getElementById(id);
  if(!el) return;
  const n = blockStacksOf(holder);
  if(!n){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display = '';
  el.dataset.max = n;
  el.innerHTML =
    `<span class="blk-shield">🛡</span>` +
    `<span class="blk-count">×${n}</span>` +
    `<span class="blk-track">${Array.from({length:n},()=>'<i></i>').join('')}</span>` +
    `<span class="blk-val">${holder.blockValue||0}</span>`;
}
function refreshAllBlockBars(){
  const b = ui.battle;
  if(!b) return;
  const mon = activeMon();
  if(mon) refreshBlockBar('playerBlk', mon);
  (b.enemies||[]).forEach((e,i)=> refreshBlockBar('enemyBlk-'+i, e));
}

/* Deplete segments with the same weight as an HP drain. */
function drainBlock(id, before, after){
  const el = document.getElementById(id);
  if(!el) return;
  const seg = el.querySelectorAll('.blk-track i');
  for(let k = after; k < before && k < seg.length; k++){
    const s = seg[k];
    setTimeout(()=>{ s.classList.add('spent'); }, (k-after)*160);
  }
  const cnt = el.querySelector('.blk-count');
  if(cnt) cnt.textContent = '×' + after;
  el.classList.add('blk-hit');
  setTimeout(()=> el.classList.remove('blk-hit'), 520);
}

function blockPill(holder){
  const n = blockStacksOf(holder);
  return n ? `<span class="status-pill mine">🛡 Block ×${n}</span>` : '';
}

/* ============================================================
   INITIATIVE, PASSIVES, AND THE TWO ELECTRIC STATUSES
   ------------------------------------------------------------
   Several Electric monsters seize the first move of a round. Because the
   player normally acts first, the same abilities would be worthless in the
   player's hands — so each one grants a different perk instead.
   ============================================================ */

/* A passive takes effect the moment its owner is on the field; it is never
   chosen as an action and never appears on the move menu. */
function passiveOf(e){
  const list = MOVES[e.species] || [];
  const mv = list.find(m => m[3] === 'Passive' && m[6] && m[6].passive && (e.level||1) >= m[5]);
  return mv ? { name: mv[1], ...mv[6].passive } : null;
}
function enemyHasFirstStrikePassive(){
  return livingEnemies().some(e => { const p = passiveOf(e); return p && p.first; });
}

/* Does the enemy side take this round's first action? */
function enemySeizesInitiative(){
  const b = ui.battle;
  if(!b) return false;
  if(b.alwaysFirst) return true;                       // scripted routs
  /* Dragon Dance ✦ overrides everything else that touches initiative. */
  const ddP = getPStatus(0,'dragonDance');
  const ddE = livingEnemies().some(e=>getEStatus(e,'dragonDance'));
  if(ddP && ddP.initiative && !ddE) return false;
  if(ddE && !(ddP && ddP.initiative)) return true;
  if(b.figlio) return true;                            // he insists on leading
  // Disrupt cancels out if both sides have it
  const enemyDisrupt = livingEnemies().some(e => getEStatus(e,'disrupt'));
  const playerDisrupt = !!getPStatus(0,'disrupt');
  if(enemyDisrupt && !playerDisrupt) return true;
  if(enemyHasFirstStrikePassive()) return true;
  /* A Swift Striker takes the opening blow of the ROUND, including the very
     first one — checking only the already-chosen move meant the player could
     wipe them out before they ever acted, which defeated the attrition. */
  if(livingEnemies().some(e=>e.arenaFirst)) return true;   // arena lever
  return livingEnemies().some(e => {
    /* An Elusive thief isn't trying to win the exchange — it wants out. Swift
       Strike is set aside while it is looking for the door. Thundercat keeps
       Lightning Cat, which is precisely why it is so hard to pin. */
    if(isElusive(e)){
      const p = passiveOf(e);
      return !!(p && p.first);
    }
    if(e.move && MOVE_FIRST_NAMES.has(e.move[1])) return true;
    return (MOVES[e.species]||[]).some(m => MOVE_FIRST_NAMES.has(m[1]) && (e.level||1) >= m[5]);
  });
}
const MOVE_FIRST_NAMES = new Set(['Swift Strike','Lead Hook','Snap Kick','Whirl Step']);

/* Hand the turn to whoever has the initiative. */
/* ============================================================
   THE ROUND
   ------------------------------------------------------------
   Every round runs the same four phases, in order. Anything new should be
   slotted into a phase rather than bolted onto a handover, which is how the
   old code ended up letting Swift Strikers act twice.

     1. UPKEEP      pre-hits (Aftershock, Overheat ✦), Diamond Dust's sweep,
                    stance decay — everything that happens TO the board before
                    anyone chooses an action.
     2. INITIATIVE  enemies that seize the first blow act ONCE, using only the
                    move that earned them the initiative. They are then marked
                    and skipped in phase 3.
     3. PLAYER      you act. Tachypsychia and Overcharge may grant extra
                    actions here; nothing else interrupts.
     4. ENEMY       every enemy that has not already acted this round acts once.
                    Then statuses tick and the round flags reset.

   `beginRound` is the ONLY way into a player turn. Wave loads, swaps and
   status interruptions all route through it, so no path can skip upkeep.
   ============================================================ */
/* ============================================================
   THE ROUND — per-monster initiative
   ------------------------------------------------------------
   1. UPKEEP      pre-hits, Diamond Dust; passives are already in place
   2. INITIATIVE  every living monster is scored ONCE, then sorted
   3. ACTIONS     each takes its turn in order; a monster is marked the moment
                  it acts, so nobody can be handed a second turn
   4. END         once every monster has acted or fallen — statuses tick

   Scoring, additive within a tier:
     tier 2   Mach Dragon ✦        outranks everything below
     tier 1   Mach Dragon +
     tier 0   everything else, summed:
                +1  scripted rout (Padrino, Figlio) — a head start, no more
                +1  first-strike passive (Lightning Cat), either side
                -1  Disrupt, as a debuff on whoever it is cast against
   Ties: the player first. Within a side: field order, left to right.
   Computed ONCE per round — casting Dragon Dance takes effect NEXT round.
   ============================================================ */
function beginRound(msg){
  const b = ui.battle;
  if(!b) return;
  b.roundMsg = msg || null;
  b.phase = 'resolving';
  renderBattle();

  runPreHits(()=> vitaPulse(()=>{
    if(!ui.battle) return;
    if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
    if(!battleParty().some(m=>m.currentHp>0)) return onPlayerDefeated();
    b.order = buildInitiativeOrder();
    b.orderStep = 0;
    runTurnStep();
  }));
}

/* Mach Dragon is a TEAM status however it arrived — laid by hand or laid for
   free by the passive. It runs its five turns and does not care who is standing
   on the field when it does. */
function machTier(side){
  const st = (side === 'player')
    ? getPStatus(0,'machDragon')
    : livingEnemies().map(e=>getEStatus(e,'machDragon')).find(Boolean);
  return st ? (st.tier || 1) : 0;
}
function initiativeOf(side, mon){
  let v = 0;
  const b = ui.battle;
  const p = passiveOf(mon);
  if(p && p.first) v += 1;                                   // Lightning Cat, either side
  if(side === 'player'){
    const mir = getPStatus(0,'mirage');
    if(mir && mir.init && mir.owner === mon.uid) v += mir.init;   // the mirage moves first
  }
  if(side === 'enemy'){
    if(b && (b.alwaysFirst || b.figlio)) v += 1;
    if(mon.arenaFirst) v += 1;
    if(getEStatus(mon,'disrupt')) v -= 1;                    // your jamming slows it
  } else {
    if(getPStatus(0,'disrupt')) v -= 1;                      // their jamming slows you
  }
  return v;
}

function buildInitiativeOrder(){
  const rows = [];
  const me = activeMon();
  if(me && me.currentHp > 0){
    rows.push({ side:'player', mon:me, idx:-1,
                tier:machTier('player'), value:initiativeOf('player', me) });
  }
  livingEnemies().forEach(e=>{
    rows.push({ side:'enemy', mon:e, idx:ui.battle.enemies.indexOf(e),
                tier:machTier('enemy'), value:initiativeOf('enemy', e) });
  });
  rows.sort((a,c)=>{
    if(c.tier !== a.tier) return c.tier - a.tier;
    if(c.value !== a.value) return c.value - a.value;
    if(a.side !== c.side) return a.side === 'player' ? -1 : 1;
    return a.idx - c.idx;
  });
  return rows;
}

function runTurnStep(){
  const b = ui.battle;
  if(!b || !b.order) return;
  if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
  if(!battleParty().some(m=>m.currentHp>0)) return onPlayerDefeated();

  while(b.orderStep < b.order.length){
    const row = b.order[b.orderStep];
    const alive = row.side === 'player'
      ? (row.mon && row.mon.currentHp > 0)
      : (row.mon && row.mon.hp > 0);
    if(!alive || row.acted){ b.orderStep++; continue; }
    row.acted = true;
    if(row.side === 'player') return beginPlayerPhase(b.roundMsg || 'Choose a move.');
    b.phase = 'resolving';
    renderBattle();
    return setTimeout(()=> runSingleEnemyTurn(row.mon), 600);
  }
  return endRound();
}
function advanceTurn(){
  const b = ui.battle;
  if(!b) return;
  b.orderStep = (b.orderStep || 0) + 1;
  b.roundMsg = null;
  runTurnStep();
}

/* ---- END: reached only when every monster has acted or fallen ---- */
function endRound(){
  const b = ui.battle;
  if(!b) return;
  b.switchedThisTurn = false;

  const c = chargeState();
  if(c){
    if(c.fresh){ c.fresh = false; }          // the round it was gathered doesn't count
    else {
      c.turnsLeft--;
      if(c.turnsLeft <= 0){ clearCharge(); battleMsg('The gathered power disperses.'); }
    }
  }

  const gm = activeMon();
  if(gm){
    tickRage(gm); tickOverpower(gm);
    if(gm.guard) grantBlock(gm, 1, monAtk(gm));
    if(gm.airborne  > 0) gm.airborne--;
    if(gm.invisible > 0) gm.invisible--;
    // Counter stacks never expire — nothing to tick
    if(gm.evadeTurns   > 0) gm.evadeTurns--;
  }
  livingEnemies().forEach(e=>{
    tickRage(e); tickOverpower(e);
    if(e.guard) grantBlock(e, 1, e.atk);
    if(e.airborne  > 0) e.airborne--;
    if(e.invisible > 0) e.invisible--;
    // Counter stacks never expire — nothing to tick
    if(e.evadeTurns   > 0) e.evadeTurns--;
  });

  const mir0 = getPStatus(0,'mirage');
  if(mir0 && mir0.window && mir0.step < mir0.window.length) mir0.step++;
  const ovc = getPStatus(0,'overcharge');
  if(ovc && ovc.fresh) ovc.fresh = false;
  /* Steel Aegis tops itself up: one coin-flip at +, two at ✦ — so ✦ has a 75%
     chance of at least one stack and a 25% chance of two. */
  const aeg = getPStatus(0,'steelAegis');
  if(aeg && gm){
    const rolls = aeg.regenRolls || (aeg.regen ? 1 : 0);
    let won = 0;
    for(let r = 0; r < rolls; r++) if(Math.random() < 0.5) won++;
    if(won){ grantBlock(gm, won, monAtk(gm)); battleMsg(`🛡 The aegis thickens — +${won} block.`); }
  }
  const tac0 = getPStatus(0,'tachy');
  if(tac0){ tac0.fresh = false; tac0.extras = 0; }
  const dd0 = getPStatus(0,'diamondDust');
  if(dd0) diamondDustCleanse();
  /* Counter tops itself up slowly — stacks never expire, so they bank. */
  const ctr = getPStatus(0,'counter');
  if(ctr && ctr.regain && gm && Math.random() < ctr.regain){
    addCounterStack(gm, ctr.tier||0, 1);
    battleMsg(`🛡 Another read — <b>${counterCountOf(gm)}</b> Counter stack${counterCountOf(gm)>1?'s':''} ready.`);
  }

  if(b.fieldStatus && b.fieldStatus.discombobulate){
    const f = b.fieldStatus.discombobulate;
    if(f.guaranteed && f.openTurn){ f.guaranteed = false; if(f.second) f.softenTurn = true; }
    else if(f.softenTurn){ f.softenTurn = false; }
    b.enemies.forEach(x=>{
      const st = getEStatus(x,'discombobulate');
      if(st){ st.guaranteed = f.guaranteed; st.softenTurn = f.softenTurn; }
    });
  }

  const ar = getPStatus(0,'aria');
  if(ar && ar.fieldEvade > 0) ar.fieldEvade--;   // the untouchable turn lapses

  resolveAfterimages(()=> ariaRetaliate(()=>{
    if(!ui.battle) return;
    if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
    const gone = tickStatuses();
    renderStatusBadges();
    setTimeout(()=>{
      if(!ui.battle) return;
      beginRound(gone.length ? `${gone.join(' and ')} wore off.` : 'Choose a move.');
    }, gone.length ? 900 : 500);
  }));
}

/* The player's slice of the round. It decides nothing about order — losing the
   turn to a stun or a charm simply hands straight on to the next step. */
function beginPlayerPhase(msg){
  const b = ui.battle;
  if(!b) return;

  // a jammed player may seize up before acting
  const jam = getPStatus(0,'disrupt');
  if(jam && !b._playerSeized && Math.random() < (jam.stun || 0.15)){
    b._playerSeized = true;            // never two turns running
    b.phase = 'resolving';
    renderBattle();
    battleMsg(`📡 ${displayName(activeMon())} seizes up — your signals are scrambled!`);
    return setTimeout(advanceTurn, 900);
  }
  b._playerSeized = false;
  const nap0 = getPStatus(0,'asleep');
  if(nap0){
    nap0.turnsLeft--;
    if(nap0.turnsLeft <= 0) removePStatus(0,'asleep');
    b.phase = 'resolving';
    renderBattle();
    battleMsg(`💤 ${displayName(activeMon())} is fast asleep.`);
    return setTimeout(advanceTurn, 900);
  }
  const stun = getPStatus(0,'stunned');
  if(stun){
    removePStatus(0,'stunned');
    b.phase = 'resolving';
    renderBattle();
    battleMsg(`💫 ${displayName(activeMon())} is stunned and can't move!`);
    return setTimeout(advanceTurn, 900);
  }
  const ch = getPStatus(0,'charmed');
  if(ch && Math.random() < (ch.chance||0.20)){
    b.phase = 'resolving';
    renderBattle();
    battleMsg(`💗 ${displayName(activeMon())} is charmed and loses its turn!`);
    return setTimeout(advanceTurn, 900);
  }

  b.phase = 'player';
  renderBattle();
  if(msg) battleMsg(msg);
}

/* ---------- BATTLE MODULE (Phase 3: wild encounters) ---------- */
function starterLevel(){
  const st = state.party.find(m=>m.species===state.starterSpecies);
  return st ? st.level : (state.party[0]?state.party[0].level:5);
}
/* Wild level = the strongest party member rounded down to a 5-level step, or
   the zone's floor — whichever is higher — then clamped to the zone's ceiling. */
function wildLevel(){
  const zoneId = (ui.currentZone && ui.currentZone.id) || 'tranquil_forest';
  const band = ZONE_LEVELS[zoneId] || { min:5, max:21 };
  const best = Math.max(...battleParty().map(m=>m.level), 1);
  const stepped = Math.floor(best/5)*5;
  return Math.min(band.max, Math.max(band.min, stepped));
}
function wildGroupSize(){
  const L = Math.max(...battleParty().map(m=>m.level), 1);
  if(L>=21 && Math.random()<0.10) return 3;
  if(L>=12 && Math.random()<0.30) return 2;
  return 1;
}
const REGION1_WILD = ['rat','bird','moth'];

/* Explorable zones per region. `id` drives the button art at
   assets/zones/<id>.png; `tint` colours the bevel if no art is present. */
const REGION_ZONES = {
  1: [ { id:'tranquil_forest', name:'Tranquil Forest', tint:'#4a7a3c' } ],
  2: [ { id:'sacred_grove', name:'Sacred Grove', tint:'#5fa86b' },
       { id:'rocky_caverns', name:'Rocky Caverns', tint:'#8a7a5b', locksUntil:'r2ChallengeDone' } ],
  3: [ { id:'volcanic_caldera', name:'Volcanic Caldera', tint:'#b0503a' },
       { id:'geothermal_plant', name:'Geothermal Plant', tint:'#c98a3a', locksUntil:'r3MonkeyMet' },
       { id:'plant_generator',  name:'Generator Floor',  tint:'#c8a33a', locksUntil:'r3PowerStone' },
       { id:'vane_shear',       name:'RRS Vane Shear',   tint:'#4a6a8a' } ],
  /* Region 4 is one place: the ship. Its three decks are the zones. */
  4: [ { id:'weather_deck',    name:'Weather Deck',   tint:'#5a8aaa' },
       { id:'cabin_deck',      name:'Cabin Deck',     tint:'#6a7a8a' },
       { id:'laboratory_deck', name:'Laboratory Deck', tint:'#4a7a8a', locksUntil:'r4Blocked' } ],
};

/* --- Region 2, first scripted sequence: the Trial of Courage ---
   Sacred Grove refuses to let anyone pass who runs from a fight. Thirty
   battles must be seen through without fleeing; the count resets to zero the
   moment the player flees. At thirty, the Guardian herself appears. */
/* ============================================================
   ROCKY CAVERNS — THREE PATHS
   Upper and Lower each run 12 explores and yield half of what the Disused
   path needs: a mafia uniform from one, the password from the other. The
   Disused path stalls at explore 5 until both are in hand.
   Progress is a per-path counter on the profile, so leaving mid-path resumes
   where you stopped; fleeing costs nothing.
   ============================================================ */
const CAVERN_PATHS = [
  { id:'upper',   name:'Upper Path',   tint:'#8a7a5b', desc:'Cut stone and old lamplight.' },
  { id:'lower',   name:'Lower Path',   tint:'#5b6a7a', desc:'Damp, and it echoes.' },
  { id:'disused', name:'Disused Path', tint:'#6b5b5b', desc:'Nobody comes this way. Almost nobody.' },
];
const PATH_LENGTH = 12;

/* A Soldato waits at a random point in the first nine explores of the two
   outer paths; the fixed encounters sit at 10, 11 and 12. */
function pathState(){
  const r2 = state.progress.region2;
  r2.paths = r2.paths || {};
  CAVERN_PATHS.forEach(p=>{
    r2.paths[p.id] = r2.paths[p.id] || { step:0, soldatoAt:0, done:false };
    if(p.id!=='disused' && !r2.paths[p.id].soldatoAt){
      r2.paths[p.id].soldatoAt = 1 + Math.floor(Math.random()*9);   // 1..9
    }
  });
  return r2.paths;
}
function hasUniform(){ return !!(state.progress.region2||{}).uniform; }
function hasPassword(){ return !!(state.progress.region2||{}).password; }
function hasLantern(){ return battleParty().some(m=>m.species==='lanternfish' || m.species==='forest_fairy'); }

/* What happens on the NEXT explore of a given path. */
function pathNext(pathId){
  const st = pathState()[pathId];
  const step = st.step + 1;               // the explore about to be taken
  if(step > PATH_LENGTH) return { kind:'done' };

  if(pathId === 'disused'){
    if(step <= 4) return { kind:'wild' };
    if(step === 5 && !(hasUniform() && hasPassword())) return { kind:'blocked' };
    return { kind:'scene', scene:'disused'+step };
  }

  // upper / lower
  if(step === st.soldatoAt) return { kind:'soldato', tier:1 };
  if(step <= 9)  return { kind:'wild' };
  if(step === 10) return { kind:'soldato', tier:2 };
  if(step === 11) return { kind:'capo', which: pathId==='upper' ? 'black' : 'purple' };
  return { kind:'reward', which: pathId==='upper' ? 'uniform' : 'password' };
}

/* --- mafia rosters (sheet: wilds first wave, elites second) --- */
const MAFIA = {
  soldato1: { npcId:'soldato1', label:'Soldato', waves:[
    [{species:'golem',level:41},{species:'bat',level:41}],
    [{species:'goblin',level:43},{species:'squid',level:43}],
  ], ai:['power1','power2'] },
  soldato2: { npcId:'soldato2', label:'Soldato', waves:[
    [{species:'golem',level:44},{species:'bat',level:44},{species:'earth_snake',level:44}],
    [{species:'goblin',level:46},{species:'sumo',level:46},{species:'squid',level:46}],
  ], ai:['power1','power2'] },
  capo_black: { npcId:'capo_black', label:'Black Capo', waves:[
    [{species:'golem',level:46},{species:'bat',level:46},{species:'earth_snake',level:46}],
    [{species:'goblin',level:49},{species:'sumo',level:49},{species:'squid',level:49}],
    [{species:'ghost_starter',level:51}],
  ], ai:['power2','best','best'] },
  capo_purple: { npcId:'capo_purple', label:'Purple Capo', waves:[
    [{species:'golem',level:46},{species:'bat',level:46},{species:'earth_snake',level:46}],
    [{species:'goblin',level:49},{species:'sumo',level:49},{species:'squid',level:49}],
    [{species:'psychic_starter',level:51}],
  ], ai:['power2','best','best'] },
};

const COURAGE_TARGET = 30;
/* The last three battles of the trial (the 28th, 29th and 30th) are a level-35
   gauntlet. Fleeing during them costs only the gauntlet rather than the whole
   run — the counter falls back to 25 instead of zero. */
const COURAGE_GAUNTLET_FROM = 27;   // counter value while fighting battle #28
const COURAGE_FLEE_FALLBACK = 25;
/* The final three are scripted, not random: rising levels and rising AI. */
const COURAGE_GAUNTLET = [
  { level:35, ai:'power1', team:['squirrel','sparrow','deer'] },   // battle 28
  { level:38, ai:'power2', team:['squirrel','sparrow','deer'] },   // battle 29
  { level:41, ai:'best',   team:['grass_starter'] },               // battle 30
];
function inCourageGauntlet(){
  const c = (state.progress.region2||{}).courage||0;
  return inSacredGroveTrial() && c >= COURAGE_GAUNTLET_FROM && c < COURAGE_TARGET;
}
/* Zone wild tables. Sacred Grove's list is the same before and after the
   trial — only the levels change during the gauntlet. */
const ZONE_WILD = {
  tranquil_forest: ['rat','bird','moth'],
  sacred_grove:    ['sparrow','squirrel','deer','grass_starter'],
  rocky_caverns:   ['earth_snake','ground_starter','golem','bat'],
  volcanic_caldera:['snail','boobybird','firefly'],      // + fire_starter at 15%
  geothermal_plant:['snail','boobybird','firefly'],      // + toad via the Engineer
};
/* Wild levels scale with the party but are clamped per zone. */
const ZONE_LEVELS = {
  tranquil_forest: { min:5,  max:21 },
  sacred_grove:    { min:20, max:41 },
  rocky_caverns:   { min:20, max:46 },
  volcanic_caldera:{ min:31, max:61 },
  geothermal_plant:{ min:31, max:61 },
};

function makeEnemy(species, level, opts){
  opts = opts || {};
  const sp = SPECIES[species];
  const nerfed = (opts.nerfed!==undefined) ? opts.nerfed : (sp.tier==='wild');
  const rate = nerfed ? sp.nerfedRate : sp.rate;
  /* Wild encounters no longer auto-evolve at the threshold. Reaching the level
     only makes the evolved form POSSIBLE, so a zone keeps a mix of forms:
       evo1 reached      -> 67% base, 33% stage 1
       evo2 also reached -> 20% base, 67% stage 1, 13% stage 2
     Evolved wilds also fight unpredictably (see enemyMoveFor). */
  const maxStage = (sp.evo||[]).filter(lv=>level>=lv).length;
  let stage = maxStage;
  if(opts.forceStage != null) stage = Math.min(opts.forceStage, maxStage);   // generator wilds stay cute
  if(opts.wildRoll && maxStage > 0){
    const r = Math.random();
    if(maxStage === 1)      stage = r < 0.67 ? 0 : 1;
    else                    stage = r < 0.20 ? 0 : (r < 0.87 ? 1 : 2);
  }
  let stat = Math.ceil((rate/5)*level) + Math.ceil((stage + (sp.bonusStages||0))*rate*(sp.evoMult||1));
  if(opts.crowned && sp.tier==='legendary') stat += 3*rate;      // crowned legendary
  if(opts.supplements) stat += Math.ceil((rate/5)*opts.supplements);
  const hp = Math.ceil(stat * hpScale(level));
  // AI: 'basic' | 'power1' | 'best'. Default: wild=basic, but electric/legendary open with Power1.
  let ai = opts.ai || ((species==='electric_starter' || sp.tier==='legendary') ? 'power1' : 'basic');
  // An evolved wild picks from its whole moveset each turn
  if(opts.wildRoll && stage > 0 && !opts.ai) ai = 'random';
  const avail = MOVES[species].filter(m=>m[1]!=null && level>=m[5] && m[2]!=null); // damaging + unlocked
  const bySlot = s=> avail.find(m=>m[0]===s);
  let move;
  if(ai==='random') move = avail[Math.floor(Math.random()*avail.length)] || bySlot('Basic');
  else if(ai==='best') move = bySlot('Max') || bySlot('Ultimate') || bySlot('Power2') || bySlot('Power1') || bySlot('Basic');
  else if(ai==='power2') move = bySlot('Power2') || bySlot('Power1') || bySlot('Basic');
  else if(ai==='power1') move = bySlot('Power1') || bySlot('Basic');
  else move = bySlot('Basic');
  if(!move) move = avail[0] || MOVES[species][0];
  const e = { species, level, maxHp:hp, hp:hp, atk:stat, move, types:sp.types, stage, tier:sp.tier, ai, nerfed, boss:!!opts.boss, crowned:!!opts.crowned };
  if(opts.elusive) e.elusive = true;      // see ELUSIVE below
  /* Enraged: while the Whalelord is unavenged his people fight like this —
     one move, nothing else, harder and tougher. */
  if(opts.enraged){
    e.enraged = true;
    e.dealMult = 1.25;
    e.takeMult = 0.75;
  }
  return e;
}

/* Sacred Grove runs its own encounter table while the trial is unresolved. */
function inSacredGroveTrial(){
  const r2 = state.progress.region2 || {};
  return state.progress.currentRegion===2
      && ui.currentZone && ui.currentZone.id==='sacred_grove'
      && !r2.trialDone;
}
function startGuardianTrial(){
  beginBattle({
    waves:[[{ species:'forest_fairy', level:100, ai:'power1', nerfed:false, supplements:12, crowned:true, boss:true }]],
                       // ai:'power1' == Giga Drain, her signature. 'best' would have
                       // reached past it for the Ultimate and skipped the self-heal.
    isNpc:false, allowCatch:false, name:'The Forest Guardian',
    noFlee:false,            // Courage means running is POSSIBLE and refused.
                             // Fleeing costs no progress, but she recovers fully.
    guardianTrial:true,
  });
}

function startWildEncounter(encOpts){
  encOpts = encOpts || {};

  // Once courage is proven, every encounter in the Grove is the Guardian.
  if(inSacredGroveTrial() && (state.progress.region2.courage||0) >= COURAGE_TARGET){
    return startGuardianTrial();
  }
  const pool = activePool();
  if(pool.length===0){ ui.prevScreen='region'; toast('No words selected, please select to proceed.'); go('spelling'); return; }
  const L = starterLevel();
  let special = null;
  const region1Only = state.progress.currentRegion === 1;
  if(region1Only && L>=20){
    // dev profiles meet the Phoenix on the very next step
    if(isDev() && L>=21 && !legendaryCaught('phoenix')) special='phoenix';
    else {
      const r=Math.random();
      if(r<0.05 && !legendaryCaught('phoenix')) special='phoenix';
      else if(r<0.20) special='electric_starter';
    }
  }
  // the Caldera hides a Fire Starter
  if((ui.currentZone||{}).id==='volcanic_caldera' && Math.random()<0.15) special='fire_starter';
  let wave;
  if(special){
    const band = ZONE_LEVELS[(ui.currentZone||{}).id] || { min:5, max:21 };
    const lvl = special==='fire_starter' ? Math.max(band.min, Math.min(band.max, wildLevel()))
              : (special==='phoenix' ? 25 : 20);
    wave = [{ species:special, level:lvl, wildRoll:special==='fire_starter' }];
  } else {
    const zoneId = (ui.currentZone && ui.currentZone.id) || 'tranquil_forest';
    // The last three battles of the Trial are hand-authored, not rolled.
    const g = inCourageGauntlet()
      ? COURAGE_GAUNTLET[(state.progress.region2.courage||0) - COURAGE_GAUNTLET_FROM]
      : null;
    if(g){
      wave = g.team.map(sp=>({ species:sp, level:g.level, ai:g.ai, nerfed:false }));
    } else {
      const size = wildGroupSize();
      const band = ZONE_LEVELS[zoneId] || { min:5, max:21 };
      const lvl = Math.max(band.min, Math.min(band.max, wildLevel()));
      let choices = (ZONE_WILD[zoneId] || REGION1_WILD).slice();
      if(ui.fledFrom){ const f=choices.filter(s=>s!==ui.fledFrom); if(f.length) choices=f; ui.fledFrom=null; }
      wave = [];
      for(let i=0;i<size;i++){ wave.push({ species: choices[Math.floor(Math.random()*choices.length)], level:lvl, wildRoll:true }); }
    }
  }
  beginBattle({ waves:[wave], isNpc:false, allowCatch:true, name:'Wild encounter',
    silentIntro: !!encOpts.silentIntro, onWin: encOpts.onWin || null });
}

/* ---------- shared multi-wave battle engine ---------- */
function beginBattle(config){
  /* Counter stacks, Combo, Enrage and the rest live ON the monster so they can
     follow it between switches. That means they also followed it between
     BATTLES — you could walk into a wild fight already holding four guards.
     Every fight starts clean. */
  state.party.concat(state.storage || []).forEach(m=>{
    m.counterStack = []; m.comboStacks = 0; m.enrageStacks = 0;
    m.blockStacks = 0;   m.blockValue = 0;
    m._rage = null;      m._overpower = null;  m._stoop = null;
    m.morsMarks = 0;     m._entered = false;   m._aegisPassiveDone = false;
  });
  ui.battle = {
    waves: config.waves, waveIndex:0,
    isNpc: !!config.isNpc, allowCatch: !!config.allowCatch,
    challenge: config.challenge || null, name: config.name || 'Battle',
    onWin: config.onWin || null, onWaveStart: config.onWaveStart || null, npcId: config.npcId || null, silentIntro: !!config.silentIntro,
    guardianTrial: !!config.guardianTrial, leechSeed:false, bgKey: config.bgKey||null,
    alwaysFirst: !!config.alwaysFirst,
    scriptedOneTurn: !!config.scriptedOneTurn,
    /* From Emerald March onward a trainer fight is a commitment: no fleeing.
       Region 1 keeps its gentler rules so the early game stays forgiving. */
    noFlee: !!config.noFlee || (!!config.isNpc && (state.progress.currentRegion||1) >= 2),
    concertFight: !!config.concertFight,
    figlio: !!config.figlio,          // he leads every round
    scriptedLoss: config.scriptedLoss||null,
    scriptedAlly: config.scriptedAlly||null, allyMove: config.allyMove||null,
    allyUnkillable: !!config.allyUnkillable, enemiesFirst: !!config.enemiesFirst,
    switchedThisTurn:false, busy:false, fightMistakes:[], phase:'player', wordCarry:0,
    charge:null, legacyBonus:0,
    aftershock:[], aftershockPending:false, bonusMult:0, _bonusResolved:false,
    _passiveUsed:false,
    turnStep:0,          // turnOrder retired with the per-monster initiative
    rechargeWords:0,         // every word written this battle feeds the meter

    partyStatus:{},          // party-wide buffs, each with a turn counter
    fieldStatus:{},          // debuffs stamped on every enemy, inherited by later waves
    /* COOLDOWN RULE — only these two ever go on cooldown.
       Basic, Power1, Power2, Ultimate and Max are NATURAL moves and are
       available every single turn, always. Only a VERY HIGH or an ULTRA stone
       is spent once per battle, and the 100-word recharge meter gives both
       back. Nothing else should ever be added to these maps. */
    usedVeryHigh:{}, usedUltra:{},
  };
  if(config.scriptedAlly){
    // The player rides a borrowed monster: the real party is set aside and
    // restored when the scripted sequence ends.
    ui.realParty = state.party;
    const ally = newMonster(config.scriptedAlly, config.allyLevel||100);
    ally.crowned = !!config.allyCrowned;
    ally.supplements = proteinCap(config.scriptedAlly, ally);
    ally.currentHp = monMaxHp(ally);
    state.party = [ally];
    ui.battle.activeIndex = 0;
  }
  // clear last battle's stances, then arm this battle's opening passives
  state.party.forEach(m=>{ m.guard=false; m.airborne=0; m.invisible=0; m.prep=0; m.blockStacks=0; m._entered=false; });
  loadWave(0);
  const lead = activeMon();
  if(lead){ lead._entered = true; applyEntryPassives(lead, lead.species, lead.level, monAtk(lead)); }
  playBattleMusic(!!config.isNpc, { silentIntro: !!config.silentIntro });
  go('battle');
  /* Every battle, scripted or not, starts a normal round. `enemiesFirst` is
     just another initiative rule now (see enemyHasInitiative). */
  if(config.enemiesFirst) ui.battle.alwaysFirst = true;
  setTimeout(()=> beginRound('Choose a move.'), 900);
}
function loadWave(i){
  const b = ui.battle;
  b.enemies = b.waves[i].map(spec => makeEnemy(spec.species, spec.level, { nerfed:spec.nerfed, ai:spec.ai, supplements:spec.supplements, boss:spec.boss, wildRoll:spec.wildRoll, crowned:spec.crowned, forceStage:spec.forceStage, elusive:spec.elusive, enraged:spec.enraged }));
  // Leech Seed is a FIELD effect: it re-roots on every new wave.
  /* (the tiered field-status re-application below handles Leech Seed; a bare
      copy here used to overwrite it and strip the + / ✦ bite) */
  b.enemies.forEach(e=>{ if(!state.encounteredSpecies.includes(e.species)) state.encounteredSpecies.push(e.species); });
  /* Field effects re-apply to anything that walks onto the field, so a new wave
     arrives already seeded / entombed rather than stepping in clean. */
  const fs = b.fieldStatus || {};
  if(fs.leechSeed) b.enemies.forEach(e=> addEStatus(e, Object.assign({}, fs.leechSeed)));
  if(fs.iceField)  b.enemies.forEach(e=> addEStatus(e, { type:'iceTomb', turnsLeft:fs.iceField.freeze||2, taken:fs.iceField.taken }));
  if(fs.curse)     b.enemies.forEach(e=> addEStatus(e, Object.assign({}, fs.curse)));
  if(fs.disruptField) b.enemies.forEach(e=> addEStatus(e, { type:'disrupt', turnsLeft:fs.disruptField.turnsLeft, stun:fs.disruptField.stun, mine:!!fs.disruptField.mine }));
  if(b.onWaveStart) b.onWaveStart(i);
  // stances and block stacks apply the moment a monster takes the field
  b.enemies.forEach((e,i)=>{
    applyEntryPassives(e, e.species, e.level, e.atk);
    const spec = (b.waves[b.waveIndex]||[])[i];
    if(spec && spec.veryHigh) applyEnemyVeryHigh(e, spec.veryHigh.type, spec.veryHigh.plus||0);
  });
  // a passive announces itself the moment its owner appears
  const withPassive = b.enemies.find(e=>passiveOf(e));
  if(withPassive){
    const p = passiveOf(withPassive);
    setTimeout(()=> battleMsg(`⚡ ${SPECIES[withPassive.species].name}'s ${p.name} is active!`), 600);
  }
  /* A borrowed story monster is the only thing in the party, so it simply
     stays. Otherwise keep whoever was fighting, as long as they're standing. */
  const cur = state.party[b.activeIndex];
  let ai = (cur && cur.currentHp>0 && !isPassenger(cur))
    ? b.activeIndex
    : state.party.findIndex(m=>m.currentHp>0 && !isPassenger(m));
  if(ai<0) ai=0;
  b.activeIndex = ai; b.switchedThisTurn=false;
  /* A fresh wave starts a fresh round: reset who has acted so the new arrivals
     can take the initiative, and let beginRound run upkeep on them. */
  b.acted = [];
  b.phase='resolving';
  saveProfile();
}
function onWaveCleared(){
  // a scripted ally keeps fighting across waves — don't hand the party back yet

  const b = ui.battle;
  if(b.arena){
    /* No more respawning — immortality is the way to keep a test running now,
       and a knock-out should be observable rather than papered over. */
    stopMusic();
    return challengeResult('⚔️', 'Test complete',
      `Every opponent is down.<br><br><i>Turn on <b>Immortal</b> in the arena setup if you want ` +
      `the test to keep running past a knock-out.</i>`, 'arena');
  }
  if(b.waveIndex < b.waves.length-1){
    /* The round still happened even though no enemy lived to take its turn.
       Without this, one-shotting each wave meant statuses NEVER aged — a
       turn-one Overheat was still running six waves later. */
    const gone = tickStatuses();
    b.waveIndex++;
    loadWave(b.waveIndex);
    renderBattle();
    battleMsg(`Wave ${b.waveIndex+1} of ${b.waves.length}!`
      + (gone.length ? ` (${gone.join(' and ')} wore off.)` : ''));
    // the new arrivals face upkeep (Overheat, Aftershock) and may seize the initiative
    setTimeout(()=> beginRound('Choose a move.'), 900);
  } else {
    if(b.isNpc) onChallengeWon();
    else onBattleWon();
  }
}

function activeMon(){ return state.party[ui.battle.activeIndex]; }
function monMaxHp(m){ return computeMaxHp(m.species, m.level, m.supplements, m); }
/* Enrage is bolted on top of the natural figure, from the undressed base, so
   stacks stay additive and never compound with one another. */
function rawMonAtk(m){ return computeMaxStat(m.species, m.level, m.supplements, m); }
function monAtk(m){
  const base = rawMonAtk(m);
  const n = (m && m.enrageStacks) || 0;
  if(!n) return base;
  const c = ui.battle ? getPStatus(0,'counter') : null;
  return base + Math.round(n * ((c && c.enrage) || 0.20) * base);
}
function unlockedMoves(m){
  // While a Cataclysm charge is held, the whole kit is replaced.
  const c = chargeState();
  if(c && c.uid === m.uid) return chargeMoves(m);

  // A borrowed story monster gets exactly one button, and no writing.
  const sm = ui.battle && ui.battle.allyMove && SCRIPTED_MOVES[ui.battle.allyMove];
  if(sm && ui.battle.scriptedAlly && m.species===ui.battle.scriptedAlly){
    return [Object.assign({ unlock:0, available:true, isStone:false, scripted:true, mult:sm.fixed?null:sm.mult }, sm)];
  }
  /* 'Max' is an UPGRADE of Ultimate, not an extra button: once its level is
     reached it takes over the Ultimate slot entirely. */
  const maxMv = MOVES[m.species].find(mv=>mv[0]==='Max' && mv[1]!=null && moveUnlockedFor(m, mv));
  /* Passives take effect on entering the field; they never appear as buttons. */
  const base = MOVES[m.species].filter(mv=>mv[0]!=='Max' && mv[3]!=='Passive').map(mv=>{
    let [slot,name,mult,target,words,unlock,extra]=mv;
    if(slot==='Ultimate' && maxMv){ [,name,mult,target,words,unlock,extra] = maxMv; }
    const e = extra || {};
    /* Spread the whole extras object. The old allow-list silently dropped any
       property it hadn't been told about — which is why `soul` and `tachy`
       never reached the move, so Steel Soul and Tachypsychia did nothing at
       all. Adding a new mechanic must not require editing this line. */
    return { slot,name,mult,target,words,unlock, ...e,
             scale:e.scale||null, hits:e.hits||0, split:!!e.split, charge:e.charge||null,
             available:(name!=null && moveUnlockedFor(m, [slot,name,mult,target,words,unlock,e])), isStone:false };
  });
  /* Equipped stone slots in by tier: High-tier "twin" skills override POWER1
     (they're a step above a basic swing), everything else overrides Basic. */
  /* Two independent stone slots: Basic (low/mid/veryhigh) and Power1 (high).
     They used to share one field, so learning a High skill silently erased an
     Overheat sitting in the Basic slot. */
  [[m.equippedStone,'Basic'], [m.power1Stone,'Power1']].forEach(([st, slot])=>{
    if(!st) return;
    const t = stoneTierDef(st.tier);
    const bi = base.findIndex(mv=>mv.slot===slot);
    const used = t.id==='veryhigh' && ui.battle && ui.battle.usedVeryHigh[m.uid];
    if(bi>=0) base[bi] = { slot, name:stoneDisplayName(st), mult:stoneMult(st), stonePlus:stonePlus(st),
      target: t.kind==='multi2'?'Multi2':(t.kind==='status'?'Status':'Single'),
      words:t.words, unlock:0, available:!used, isStone:true, stoneTier:t.id, stoneType:st.type };
  });
  // Ultra stone adds a distinct 5th button
  if(m.ultraStone){
    const t = stoneTierDef('ultra');
    const used = ui.battle && ui.battle.usedUltra[m.uid];
    base.push({ slot:'UltraStone', name:stoneDisplayName(m.ultraStone), mult:stoneMult(m.ultraStone),
      stonePlus:stonePlus(m.ultraStone), ultraStone:m.ultraStone, target:'MultiHit', words:t.words,
      unlock:0, available:!used, isStone:true, stoneTier:'ultra', stoneType:m.ultraStone.type });
  }
  return base;
}

function hpBar2(id, cur, max, big){
  const pct = Math.max(0, cur/max*100);
  const h = big?12:7;
  return `<div class="hpbar2" id="${id}" style="height:${h}px;">
    <div class="hp-red" style="width:${pct}%;"></div>
    <div class="hp-green" style="width:${pct}%;background:${pct<30?'var(--cinnabar)':'var(--jade)'};"></div>
  </div>
  <div class="hp-num" id="${id}-num" style="font-size:${big?11:10}px;">${Math.max(0,cur)}/${max}</div>`;
}
/* Battle sprites scale with the viewport so the stage doesn't feel empty on a
   big screen, and shrink when several enemies share the row. */
function battleWidth(){
  const el = $('#app');
  const w = el ? el.getBoundingClientRect().width : Math.min(window.innerWidth, 480);
  return Math.max(320, w - 32);
}
function playerSpriteSize(){
  const byW = battleWidth() * 0.42;
  const byH = window.innerHeight * 0.22;
  return Math.round(Math.max(120, Math.min(byW, byH, 230)));
}
function enemySpriteSize(count){
  const n = Math.max(1, count||1);
  const per = (battleWidth() - (n-1)*10) / n;      // share of the row per enemy
  const byH = window.innerHeight * 0.17;
  return Math.round(Math.max(76, Math.min(per*0.78, byH, 170)));
}

/* Depth is faked with size + speed: big fast motes read as near, small slow
   ones as far. A few sparkles punctuate it. */
function ultraFizz(plus){
  plus = plus || 0;
  const count = 14 + plus*10;          // a refined stone visibly seethes
  let out = '<span class="fizz plus-'+plus+'">';
  for(let i=0;i<count;i++){
    const near = Math.random();
    const size = 2 + near*6;                 // 2-8px
    const dur  = 2.6 - near*1.4;             // bigger => faster
    out += `<i style="left:${Math.random()*96}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;`
         + `animation-duration:${dur.toFixed(2)}s;animation-delay:${(Math.random()*2.6).toFixed(2)}s;`
         + `opacity:${(0.35+near*0.5).toFixed(2)};"></i>`;
  }
  for(let i=0;i<3+plus*4;i++){
    out += `<i class="sparkle" style="left:${10+Math.random()*80}%;width:${2+plus}px;height:${2+plus}px;`
         + `animation-duration:${(2.2+Math.random()*1.4).toFixed(2)}s;animation-delay:${(Math.random()*3).toFixed(2)}s;"></i>`;
  }
  return out + '</span>';
}

/* What the button tells you: how many characters it costs, roughly how hard it
   hits, and whether it spreads. Deliberately BEFORE type effectiveness — that
   varies per target — but after the multipliers the player controls. */
function ownBuffMultiplier(){
  let m = 1;
  const oh = getPStatus(0,'overheat');
  if(oh) m *= (oh.deal || 1.5);            // honour the refined tiers
  const dd = getPStatus(0,'dragonDance');
  if(dd) m *= (dd.deal || 1.25);
  m *= wrathDamageBonus();                 // every grudge held makes you hit harder
  m *= comboMultiplier(activeMon());       // a blow you read makes the next one bigger
  m *= terrorizeFactor();                  // something on the field is frightening
  if(ui.battle && ui.battle.legacyBonus) m *= (1 + ui.battle.legacyBonus);
  return m;
}
function estimateHit(mv, mon){
  if(mv.fixed != null) return mv.fixed;              // scripted finishers
  if(mv.mult == null) return null;                   // status / support
  const atk = monAtk(mon);
  let per = mv.mult;
  // `split` divides the total across strikes; otherwise each strike lands full
  if(mv.split && mv.hits > 1) per = mv.mult / mv.hits;
  let dmg = per * atk * ownBuffMultiplier();
  const soul = getPStatus(0,'steelSoul');
  if(soul && soul.owner === mon.uid) dmg += soul.bonus * atk;
  return Math.ceil(dmg);
}
function moveShape(mv){
  if(mv.slot === 'UltraStone'){
    const r = mv.ultraStone ? ultraHitRange(mv.ultraStone) : { min:5, max:7 };
    return `×${r.min}–${r.max}`;
  }
  // an aftershock bonus can add a strike, so show the band
  if(mv.hits && mv.hits > 1) return `×${mv.hits}`;
  if(mv.hits && mv.hits > 1) return `×${mv.hits}`;
  if(mv.target === 'AOE') return 'AOE';
  if(mv.target === 'Multi2') return '2 targets';
  return '';
}
/* ============================================================
   MOVE DESCRIPTIONS
   Written so a seven-year-old can tell what a move does without experimenting.
   Damage figures use the monster's real ATK and current buffs.
   ============================================================ */
function moveShapeSentence(mv, dmg){
  const n = mv.hits && mv.hits > 1 ? mv.hits : 0;
  if(mv.slot === 'UltraStone'){
    const r = mv.ultraStone ? ultraHitRange(mv.ultraStone) : { min:5, max:7 };
    return `Strikes <b>${r.min}–${r.max}</b> times across the enemies for <b>${dmg}</b> per hit — ` +
           `<b>${dmg*r.min}–${dmg*r.max}</b> damage in total, spread over whoever is standing.`;
  }
  if(mv.target === 'SingleAOE')
    return `Hits one enemy for <b>${dmg}</b>, then every other enemy for <b>${Math.ceil(dmg*(mv.splash||0.5))}</b>.`;
  if(mv.target === 'AOE' && n) return `Hits <b>all enemies ${n} times</b> for <b>${dmg}</b> per hit — <b>${dmg*n}</b> to each enemy.`;
  if(mv.target === 'AOE')      return `Hits <b>all enemies</b> for <b>${dmg}</b> damage each.`;
  if(mv.target === 'Multi2')   return `Hits <b>2 enemies</b> for <b>${dmg}</b> damage each.`;
  if(n)                        return `Hits <b>1 enemy ${n} times</b> for <b>${dmg}</b> per hit — <b>${dmg*n}</b> in total.`;
  return `Hits <b>1 enemy</b> for <b>${dmg}</b> damage.`;
}

/* Effects, in plain words. Keyed by the mechanic, not the move name, so a new
   monster reusing a mechanic gets its description for free. */
function moveEffectText(mv, mon, atk){
  const out = [];
  if(mv.soul) out.push(
    `<b>Steel Soul.</b> For ${mv.soul.turns} turns this monster takes <b>half damage</b> and adds ` +
    `<b>+${Math.ceil(mv.soul.bonus*atk)}</b> to every hit it lands — including skill-stone moves. ` +
    `Only this monster benefits; swapping out leaves the buff behind.`);
  if(mv.tachy) out.push(
    `<b>Tachypsychia.</b> For ${mv.tachy.turns} turns, each time this monster acts there is a ` +
    `<b>${Math.round(mv.tachy.bonusAction*100)}% chance to act again</b> — and that can chain. ` +
    `It also dodges <b>${Math.round(mv.tachy.evadeFirst*100)}%</b> of attacks on the first turn, then ` +
    `<b>${Math.round(mv.tachy.evadeAfter*100)}%</b> after.`);
  if(mv.charm) out.push(
    `<b>Charm.</b> For ${mv.charm.turns} turns each enemy has a <b>${Math.round(mv.charm.chance*100)}% chance</b> ` +
    `to lose its turn entirely.`);
  if(mv.disrupt) out.push(
    `<b>Disrupt.</b> For ${mv.disrupt.turns} turns, <b>${Math.round(mv.disrupt.playerBlock*100)}%</b> of enemy ` +
    `attacks simply fail. (An enemy using this instead seizes the first move every round.)`);
  if(mv.grant){
    const g = mv.grant;
    const bits = [];
    if(g.guard)     bits.push(`goes <b>on guard</b>, gaining a block stack at the start of each turn`);
    if(g.airborne)  bits.push(`leaps <b>airborne</b> for a turn, dodging <b>70%</b> of attacks`);
    if(g.invisible) bits.push(`turns <b>unseen</b> for a turn, dodging <b>80%</b> of attacks`);
    if(g.block)     bits.push(`gains <b>${g.block} block stack${g.block>1?'s':''}</b> worth <b>${atk}</b> each`);
    if(g.prep)      bits.push(`builds <b>${g.prep} preparation</b>`);
    out.push(`This monster ${bits.join(', and ')}.`);
  }
  if(mv.spend){
    const sp = mv.spend;
    const what = sp.status === 'guard' ? 'on guard' : sp.status === 'airborne' ? 'airborne' : 'unseen';
    let bonus = `<b>${Math.ceil(sp.mult*atk)}</b> damage instead`;
    if(sp.perStack) bonus += `, plus <b>${Math.ceil(sp.perStack*atk)}</b> for every block stack held`;
    if(sp.perPrep)  bonus += `, plus <b>${Math.ceil(sp.perPrep*atk)}</b> for every preparation stack`;
    out.push(`If used while <b>${what}</b>, it spends that stance to deal ${bonus}.`);
  }
  if(mv.paralyse || mv.stunHit) out.push(
    `Each hit has a <b>${Math.round((mv.paralyse||mv.stunHit)*100)}% chance</b> to stun, making that enemy skip its next turn.`);
  if(mv.repeat) out.push(
    `Has a <b>${Math.round(mv.repeat*100)}% chance to fire again</b> — and each repeat can spark another, with no limit.`);
  if(mv.first) out.push(
    `In an enemy's hands this always strikes first. In yours it deals <b>+${Math.ceil((mv.playerBonus||0)*atk)}</b> extra damage instead.`);
  if(mv.scale) out.push(
    `Keep writing past the required words to raise the damage, up to <b>${Math.ceil(mv.scale.max*atk*ownBuffMultiplier())}</b>.`);
  if(mv.bonus && mv.bonus.aftershock){
    const pct = (mv.slot === 'Max' ? 0.3 : 0.2);
    out.push(`Afterwards you may write <b>${mv.bonus.words} bonus words</b> from your whole list. Succeed and an ` +
      `<b>Aftershock</b> begins: it strikes <b>all enemies at the start of each of your next 3 turns</b> for ` +
      `<b>${Math.ceil(pct*atk)}</b> damage (more if Steel Soul was active when it formed).`);
  } else if(mv.bonus){
    out.push(`Afterwards you may write <b>${mv.bonus.words} bonus words</b> from your whole list to <b>double</b> the damage.`);
  }
  if(mv.dot) out.push(
    `Leaves them burning for <b>${Math.ceil(mv.dot.pct*atk)}</b> damage a turn over ${mv.dot.turns} turns` +
    (mv.dot.rider === 'noflee' ? `, and they cannot flee.` : mv.dot.rider === 'miss' ? `, and their attacks are harder to land.` : '.'));
  if(mv.shell) out.push(
    `This monster takes <b>${Math.round(mv.shell.reduce*100)}% less damage</b> and returns ` +
    `<b>${Math.ceil(mv.shell.thorns*atk)}</b> to anything that strikes it.`);
  if(mv.clones) out.push(
    `Two copies echo each move for ${mv.clones.turns} turns at half power, and you dodge ` +
    `<b>${Math.round(mv.clones.evade*100)}%</b> of attacks.`);
  if(mv.charge) out.push(
    `Gathers power instead of attacking. Spend the charge later for a far heavier blow.`);
  /* Passives describe their payload, not just their existence. */
  if(mv.passive){
    const p = mv.passive;
    const bits = [];
    if(p.block)        bits.push(`starts with <b>${p.block} damage-block stack${p.block>1?'s':''}</b> worth <b>${atk}</b> each`);
    if(p.guard)        bits.push(`starts <b>on guard</b>, gaining a block stack each turn`);
    if(p.airborne)     bits.push(`starts <b>airborne</b>, dodging <b>70%</b> of attacks for a turn`);
    if(p.invisible)    bits.push(`starts <b>unseen</b>, dodging <b>80%</b> of attacks for a turn`);
    if(p.evadeTurns)   bits.push(`begins in perfect <b>stillness</b> — every attack misses for ${p.evadeTurns} turn${p.evadeTurns>1?'s':''}`);
    if(p.counterTurns || p.counterStack) bits.push(`begins with a <b>Counter stack</b> — one whole attack taken on the guard for <b>80% less</b>, and its next blow lands <b>25%</b> harder`);
    if(p.first)        bits.push(`always takes the <b>first move</b> of the round`);
    if(p.playerDouble) bits.push(`has a <b>${Math.round(p.playerDouble*100)}% chance to strike a second time</b>`);
    if(p.thresholdStun) bits.push(
      `punishes each health threshold it is driven below — <b>${p.thresholdStun.map(t=>Math.round(t*100)+'%').join(', ')}</b> — ` +
      `<b>stunning the attacker for a turn</b>, once per threshold`);
    out.push(`<b>Passive.</b> Active the moment it enters battle: this monster ` +
             (bits.length ? bits.join(', and ') + '.' : 'gains its stance at once.'));
  }
  return out;
}

function moveDescription(mv, mon, atk){
  const parts = [];
  if(mv.isStone && mv.stoneTier === 'veryhigh'){
    const d = veryHighDef(mv.stoneType, mv.stonePlus||0);
    if(d){
      parts.push(`<b>${escapeHtml(d.name)}</b> — a field effect lasting <b>${d.turns} turns</b>.`);
      parts.push(d.text);
      parts.push(`<i>Cast instantly: using it does not cost your turn. Once per battle, ` +
                 `restored when the recharge meter fills.</i>`);
      return parts.map(p=>`<p>${p}</p>`).join('');
    }
  }
  const dmg = estimateHit(mv, mon);
  const effects = moveEffectText(mv, mon, atk);
  if(dmg != null) parts.push(moveShapeSentence(mv, dmg));
  else if(!mv.passive && effects.length === 0)
    parts.push(`A support move — it deals no damage by itself.`);
  effects.forEach(t=>parts.push(t));
  if(mv.isStone && mv.stoneTier === 'ultra')
    parts.push(`<i>Once per battle, restored when the recharge meter fills.</i>`);
  if(dmg != null)
    parts.push(`<i>Damage shown includes your current buffs, before the enemy's type resistance.</i>`);
  return parts.map(p=>`<p>${p}</p>`).join('');
}

function moveMeta(mv, mon){
  const bits = [`${mv.words}字`];
  const dmg = estimateHit(mv, mon);
  if(dmg != null){
    // A scaling move (Incinerate) spans base → cap depending on how far the
    // writing goes, so show the whole band rather than just the floor.
    if(mv.scale){
      const hi = Math.ceil(estimateHit(Object.assign({}, mv, { mult:mv.scale.max }), mon));
      bits.push(`${dmg}–${hi}`);
    } else {
      bits.push(`${dmg}`);
    }
  }
  const shape = moveShape(mv);
  if(shape) bits.push(shape);
  return bits.join(' · ');
}

/* Safety net: if the player has a monster standing, the field has enemies and
   nothing is mid-animation, the turn belongs to the player. A dropped timer
   (backgrounded tab, interrupted sequence) could otherwise leave the menu
   disabled until the app was minimised and reopened. */
function unstickBattle(){
  const b = ui.battle;
  if(!b || ui.screen !== 'battle') return;
  if(b.phase === 'player') return;
  if(b._cloneEchoing || b.attackQueue) return;       // a sequence is genuinely running
  const mon = activeMon();
  if(!mon || mon.currentHp <= 0) return;             // waiting on a replacement
  if(livingEnemies().length === 0) return;           // wave is resolving
  b.phase = 'player';
  renderBattle();
  battleMsg('Choose a move.');
}

let _unstickTimer = null;
function startUnstickWatchdog(){
  clearInterval(_unstickTimer);
  _unstickTimer = setInterval(()=>{
    if(ui.screen !== 'battle'){ clearInterval(_unstickTimer); _unstickTimer=null; return; }
    unstickBattle();
  }, 2500);
}

function renderBattle(){
  startUnstickWatchdog();
  const zoneBg = (ui.battle && ui.battle.bgKey)
    || ((ui.currentZone && ui.currentZone.id) ? 'battle_'+ui.currentZone.id : null);
  setScreenBg(zoneBg || 'battle');
  const b = ui.battle;
  $('#brandSub').textContent = 'Battle';
  const mon = activeMon();
  const moves = unlockedMoves(mon);
  // Turn-lock: buttons are only truly interactive once it's genuinely the
  // player's turn again — not just while their own move's animation plays,
  // and not during the enemy's turn. Fixes a bug where a second move could be
  // clicked mid-animation and its quiz silently got wiped on the next redraw.
  const canAct = (b.phase || 'player') === 'player';
  screenEl.innerHTML = `
    <div class="battle-stage" id="battleStage">
      <div class="fx-layer" id="fxLayer" aria-hidden="true"></div>

      ${b.npcId ? `<div class="npc-banner">${npcPortrait(b.npcId, '🧑', 44, 'var(--paper-3)')}<span>${escapeHtml(b.name)}</span></div>` : ''}
      <div class="enemy-row">
        ${b.enemies.map((e,i)=>`
          <div class="enemy-card ${e.hp<=0?'fainted':''}" data-enemy="${i}" id="enemy-${i}" style="width:${enemySpriteSize(b.enemies.length)+16}px;">
            <div class="enemy-status" id="enemyStatus-${i}"></div>
            <div class="bob avatar-layer" id="enemyBob-${i}">${monPortrait(e.species,enemySpriteSize(b.enemies.length),{view:'front',bare:true,crowned:!!e.crowned,stage:e.stage||0,breathe: e.hp>0 ? ((e.hp/e.maxHp)<0.3 ? 'weak':'normal') : null})}</div>
            <div class="info-layer name-plate">
              <div class="mon-title">${SPECIES[e.species].name} <span>Lv ${e.level}</span></div>
              ${blockBar('enemyBlk-'+i, e)}
              ${hpBar2('enemyHp-'+i, e.hp, e.maxHp, false)}
            </div>
          </div>`).join('')}
      </div>

      <div class="battlefield" aria-hidden="true"></div>

      <div class="player-card">
        <div class="bob player-avatar" id="playerBob">${monPortrait(mon.species,playerSpriteSize(),{view:'back',bare:true,crowned:isCrowned(mon),stage:monStage(mon),breathe: mon.currentHp>0 ? ((mon.currentHp/monMaxHp(mon))<0.3 ? 'weak':'normal') : null})}</div>
        <div class="info-layer name-plate player-plate">
          <div class="mon-title big">${escapeHtml(displayName(mon))}${crownMark(mon)} <span>Lv ${mon.level}</span></div>
          ${blockBar('playerBlk', mon)}
          ${hpBar2('playerHp', mon.currentHp, monMaxHp(mon), true)}
          <div class="atk-line">ATK ${monAtk(mon)}</div>
          <div class="recharge">
            <span style="width:${Math.min(100,(b.rechargeWords||0)/RECHARGE_TARGET*100)}%"></span>
            <b>${b.rechargeWords||0}/${RECHARGE_TARGET}</b>
          </div>
        </div>
      </div>
    </div>
    <div id="statusRow" class="status-row"></div>
    <div id="battleMsg" style="text-align:center;font-weight:700;font-size:14px;min-height:20px;margin-bottom:10px;color:var(--ink-soft);">${canAct ? 'Choose a move.' : ''}</div>
    <div style="display:flex;gap:12px;">
      <div style="flex:2;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${moves.map((mv,i)=>`
          <button class="move-btn ${(mv.available && canAct)?'':'locked'} ${mv.slot==='UltraStone'?'ultra-btn':''} ${mv.stonePlus?'refined-'+mv.stonePlus:''}" data-move="${i}" ${(mv.available && canAct)?'':'disabled'}>
            ${mv.slot==='UltraStone' ? ultraFizz(mv.stonePlus||0) : ''}
            <div class="mv-name">${mv.available?escapeHtml(mv.name):'???'}</div>
            <div class="mv-meta">${mv.available ? moveMeta(mv, mon) : 'Locked'}</div>
          </button>`).join('')}
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
        <button class="side-btn" id="switchBtn" ${(b.switchedThisTurn || !canAct)?'disabled':''}>🔄 Switch</button>
        ${b.arena ? `<button class="side-btn" id="skipBtn" ${canAct?'':'disabled'}>⏭️ Skip turn</button>` : ''}
        <button class="side-btn" id="fleeBtn" ${(b.noFlee || !canAct)?'disabled':''}>${b.arena?'🚪 Exit':(b.noFlee?'🚫 No fleeing':'🏃 Flee')}</button>
        ${b.arena?'<button class="side-btn" id="arenaMoveBtn" style="background:var(--gold);color:#fff;" '+(canAct?'':'disabled')+'>🧪 Test move</button>':''}
      </div>
    </div>
    ${b.arena ? `
      <label class="arena-toggle">
        <input type="checkbox" id="autoHeal" ${b.autoHeal?'checked':''}>
        <span>Auto-heal to full after each attack suffered</span>
      </label>
      <details class="log-panel" id="logPanel" ${b.logOpen?'open':''}>
        <summary>📋 Battle log (${(b.log||[]).length} entries)</summary>
        <div id="logBody" class="log-body">${(b.log||[]).map(l=>`<div style="padding:3px 0;border-bottom:1px solid rgba(35,32,25,0.07);">${escapeHtml(l)}</div>`).join('')}</div>
        <button class="mini-btn" id="logClear" style="margin-top:8px;">Clear log</button>
      </details>` : ''}
  `;
  screenEl.querySelectorAll('.move-btn:not(.locked)').forEach(btn=> btn.addEventListener('click', ()=>onMoveChosen(+btn.dataset.move)));
  $('#switchBtn').addEventListener('click', onSwitchPressed);
  const sk = $('#skipBtn');
  if(sk) sk.addEventListener('click', ()=>{
    // pass the turn without acting, so statuses and pre-hits can be watched
    ui.battle.phase = 'resolving';
    renderBattle();
    battleMsg('⏭️ Turn skipped.');
    setTimeout(()=> afterPlayerAttack(activeMon(), []), 500);
  });
  $('#fleeBtn').addEventListener('click', onFlee);
  const amb = $('#arenaMoveBtn');
  if(amb) amb.addEventListener('click', renderArenaMoveSheet);
  const ah = $('#autoHeal');
  if(ah) ah.addEventListener('change', e=>{ ui.battle.autoHeal = e.target.checked; });
  const lp = $('#logPanel');
  if(lp) lp.addEventListener('toggle', ()=>{ ui.battle.logOpen = lp.open; });
  const lc = $('#logClear');
  if(lc) lc.addEventListener('click', e=>{ e.preventDefault(); ui.battle.log=[]; renderBattle(); });
  renderStatusBadges();
}

const STATUS_LABELS = {
  overheat:'🔥 Overheat', overcharge:'⚡ Overcharge', spikeArmour:'🛡️ Spike Armour',
  counter:'↩️ Counter', combo:'👊 Combo', enrage:'🔥 Enrage', mirageImages:'👥 Afterimages', iceTomb:'🧊 Frozen', curse:'👻 Cursed', stunned:'💫 Stunned', machDragon:'🐉 Mach Dragon', softened:'🌀 Weakened', evadeTurns:'🧘 Still', asleep:'💤 Asleep',
  discombobulate:'🌀 Confused', leechSeed:'🌿 Leeched', elusive:'💨 Elusive', gooed:'🌋 Pinned', enraged:'🐋 Enraged', aria:'👻 Haunting Aria', wrath:'🌊 Gathering Wrath', paralysed:'💫 Stunned', airborne:'🕊 Airborne', invisible:'👤 Unseen', guard:'🛡 Guard', prep:'🎯 Prep', diamondDust:'💎 Diamond Dust', curseWard:'👻 Warded', charm:'💗 Charmed', charmed:'💗 Charmed', disrupt:'📡 Disrupt', paralysed:'⚡ Paralysed', tachy:'🌀 Tachypsychia', steelSoul:'🛡 Steel Soul', shell:'🌋 Shell', clones:'👥 Clones', dot:'🔥 Burning',
  dragonDance:'🐉 Dragon Dance', steelAegis:'🛡 Steel Aegis', mirage:'✨ Mirage',
};
function renderStatusBadges(){
  if(!ui.battle) return;
  // Player-side statuses stay in the shared row under the stage.
  const row = $('#statusRow');
  if(row){
    const out = [];
    const mon = activeMon();
    Object.values(partyStatuses()).forEach(st=>{
      // turnsLeft is stored with a +1 grace so the cast turn counts; show the
      // number of turns the player will actually still have it for.
      const shown = Math.max(0, st.turnsLeft - 1);
      out.push(`<span class="status-pill mine">${STATUS_LABELS[st.type]||st.type} ${shown}</span>`);
    });
    const af = aftershockBonusHits();
    if(af) out.push(`<span class="status-pill mine">💥 Aftershock ×${af}</span>`);
    refreshAllBlockBars();
    const wr = getPStatus(0,'wrath');
    if(wr && wr.stacks) out.push(`<span class="status-pill">🌊 Wrath ×${wr.stacks}</span>`);
    const me1 = activeMon();
    const cl = counterList(me1);
    if(cl.length){
      const best = Math.max(...cl.map(s=>s.tier));
      const mark = ['','+','✦'][best] || '';
      out.push(`<span class="status-pill">🛡 Counter ×${cl.length}${mark?' '+mark:''}</span>`);
    }
    const me0 = activeMon();
    if(me0 && me0.comboStacks) out.push(`<span class="status-pill">👊 Combo ×${me0.comboStacks}</span>`);
    if(me0 && me0.enrageStacks) out.push(`<span class="status-pill">🔥 Enrage ×${me0.enrageStacks} (+${enrageBonus(me0)} ATK)</span>`);
    if(me0) paintEnrage(me0);
    const mir1 = getPStatus(0,'mirage');
    if(mir1 && mir1.pending) out.push(`<span class="status-pill">👥 Afterimages ×${mir1.pending}</span>`);
    const sp2 = stancePills(activeMon());
    if(sp2) out.push(sp2);
    row.innerHTML = out.join('');
  }
  // Enemy statuses render on their OWN card, above that enemy's HP bar, so it's
  // obvious which monster in a group is afflicted.
  ui.battle.enemies.forEach((e,i)=>{
    const card = document.getElementById('enemy-'+i);
    if(card) card.classList.toggle('is-asleep', !!getEStatus(e,'asleep'));
    const slot = document.getElementById('enemyStatus-'+i);
    if(!slot) return;
    if(e.hp<=0){ slot.innerHTML=''; return; }
    /* Stances and block live as plain fields rather than statuses, so they need
       rendering explicitly — otherwise a Loong's 70% evasion is invisible and
       the fight just feels like bad luck. */
    const extras = [];
    if(isElusive(e))     extras.push('<span class="status-pill foe">💨 Elusive</span>');
    if(e.enraged)        extras.push('<span class="status-pill foe">🐋 Enraged</span>');
    /* `asleep` and `discombobulate` are real statuses, so the generic loop
       below already draws them from STATUS_LABELS. Pushing them here as well
       put two icons on every confused monster. Only things that are NOT
       statuses — stances, stacks, plain fields — belong in `extras`. */
    if(e.gooed)          extras.push('<span class="status-pill foe">🌋 Pinned</span>');
    if(counterCountOf(e)) extras.push(`<span class="status-pill foe">🛡 Counter ×${counterCountOf(e)}</span>`);
    if(e.comboStacks)     extras.push(`<span class="status-pill foe">👊 Combo ×${e.comboStacks}</span>`);
    if(e.guard)          extras.push('<span class="status-pill foe">🛡 Guard</span>');
    if(e.airborne > 0)   extras.push('<span class="status-pill foe">🕊 Airborne</span>');
    if(e.invisible > 0)  extras.push('<span class="status-pill foe">👤 Unseen</span>');
    if(e.prep > 0)       extras.push(`<span class="status-pill foe">🎯 Prep ×${e.prep}</span>`);
    if(passiveOf(e))     extras.push(`<span class="status-pill foe">✨ ${passiveOf(e).name}</span>`);
    slot.innerHTML = eStatuses(e).map(st=>{
      const extra = st.type==='iceTomb' ? ` ${st.turnsLeft}` : '';
      return `<span class="status-pill foe">${STATUS_LABELS[st.type]||st.type}${extra}</span>`;
    }).join('') + extras.join('');
  });
}

/* ---------- EFFECT LAYER ----------
   #fxLayer spans the whole rectangle containing the enemy row AND the player
   card. It sits above the monster avatars but below HP bars / names / text, so
   move animations can play across the full battle area.
   playEffect() is the hook for future art: if no asset is registered for the
   move it degrades to a short text flash + delay (per the design rule). */
