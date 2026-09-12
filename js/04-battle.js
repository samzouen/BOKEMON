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

function partyStatuses(){ return (ui.battle.partyStatus = ui.battle.partyStatus || {}); }
/* uid is accepted but ignored — kept so existing call sites read naturally. */
function getPStatus(uid, type){ return partyStatuses()[type]; }
function setPStatus(uid, status){
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
  const ps = partyStatuses();
  Object.keys(ps).forEach(k=>{
    ps[k].turnsLeft--;
    if(ps[k].turnsLeft <= 0){ delete ps[k]; expired.push(STATUS_LABELS[k]||k); }
  });
  if(b.fieldStatus){
    Object.keys(b.fieldStatus).forEach(k=>{
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
function eStatuses(e){ if(!Array.isArray(e.statuses)) e.statuses = []; return e.statuses; }
function getEStatus(e, type){ return eStatuses(e).find(s=>s.type===type); }
function addEStatus(e, status){
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
    if(getEStatus(attacker,'discombobulate')) dmg *= 0.8;   // enemy deals 20% less
  }

  // defender-side modifiers
  if(isPlayerAttacking){ // defender is an enemy
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
      if(d.field){ applyFieldStatus({ type:'iceField', turnsLeft:d.turns||2, taken:d.taken||1 }); }
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

    case 'Flying': // Mirage — first attack always misses, then 20%
      setPStatus(uid,{type:'mirage', turnsLeft:T+1, window:(d.window||[1]).slice(), step:0, chance:d.after});
      res.msg = d.text;
      break;

    case 'Physical': // Counter — first hit always countered, then 10%
      setPStatus(uid,{type:'counter', turnsLeft:T+1, guaranteed:d.guaranteed, ret:d.ret, chance:d.after});
      res.msg = d.text;
      break;

    case 'Ghost': // Curse — field-wide fragility
      applyFieldStatus({ type:'curse', turnsLeft:T, extra:d.extra });
      if(d.reduce) setPStatus(uid,{type:'curseWard', turnsLeft:T+1, reduce:d.reduce});
      res.msg = d.text;
      break;

    case 'Psychic': // Discombobulate — first enemy hit is halved for certain,
                    // then each attack rolls 10% countered / 10% miss / 10% halved
      applyFieldStatus({ type:'discombobulate', turnsLeft:T, guaranteed:true,
                         roll:d.roll, counterRet:d.counterRet, second:d.second||0,
                         openTurn:!!d.openTurn, softenTurn:false });
      res.msg = `The field reels! The next enemy attack is halved for certain, then 10% each to be countered, to miss, or to be halved.`;
      break;

    case 'Dragon': // Dragon Dance — multiplies WITH Overheat rather than replacing it
      setPStatus(uid,{type:'dragonDance', turnsLeft:T+1, deal:d.deal, initiative:!!d.initiative});
      res.msg = d.text;
      break;

    case 'Steel': // Steel Aegis — flat mitigation
      setPStatus(uid,{type:'steelAegis', turnsLeft:T+1, reduce:d.reduce, regen:d.regen||0});
      if(d.block) grantBlock(casterMon, d.block, casterAtk);
      res.msg = d.text;
      break;

    case 'Fairy': { // Diamond Dust — cleanse, ward, and (when refined) borrow
      const cleared = diamondDustCleanse();
      setPStatus(uid, { type:'diamondDust', turnsLeft:T+1, borrow:d.borrow||0 });
      res.msg = d.text + (cleared ? ` ${cleared} enemy effect${cleared===1?'':'s'} swept away.` : '');
      res.borrow = d.borrow || 0;          // the caller opens the picker
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
    { freeze:2, taken:1.0 },
    { freeze:1, taken:1.0, field:true },
  ], text:[
    'Freezes the current wave for 2 turns. Frozen monsters take 80% damage.',
    'Freezes the current wave for 2 turns, and they take full damage while frozen.',
    'A 2-turn field of ice: anything that steps onto the field is frozen for a turn, wave after wave, at full damage.',
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
  Flying: { name:'Mirage', turns:5, tiers:[
    { window:[1.00], after:0.20 },
    { window:[1.00,0.75], after:0.20 },
    { window:[1.00,0.75,0.75], after:0.30 },
  ], text:[
    'One turn of total evasion, then 20% each turn after.',
    'One turn of total evasion, then 75%, then 20% each turn after.',
    'One turn of total evasion, then 75% for two turns, then 30% each turn after.',
  ]},
  Physical: { name:'Counter', turns:5, tiers:[
    { guaranteed:1, ret:0.50, after:0.10 },
    { guaranteed:1, ret:1.00, after:0.15 },
    { guaranteed:2, ret:1.50, after:0.15 },
  ], text:[
    'The next hit is returned for 50% of its damage, then 10% thereafter. Counters cannot be evaded.',
    'The next hit is returned in full, then 15% thereafter. Counters cannot be evaded.',
    'The next two hits are returned at 150%, then 15% thereafter. Counters cannot be evaded.',
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
  Psychic: { name:'Discombobulate', turns:5, tiers:[
    { openHalf:1, roll:0.10, counterRet:0.50 },
    { openHalf:1, roll:0.10, counterRet:0.75, openTurn:true },
    { openHalf:1, second:0.25, roll:0.15, counterRet:1.00, openTurn:true },
  ], text:[
    'The next hit is halved, then every attack rolls 10% each to miss, be countered for 50%, or be halved.',
    'Every hit next turn is halved, and attacks roll 10% each to miss, be countered in full, or be halved.',
    'Every hit next turn is halved and the turn after reduced by 25%, with 15% each to miss, be countered at 150%, or be halved.',
  ]},
  Dragon: { name:'Dragon Dance', turns:5, tiers:[
    { deal:1.25 },
    { deal:1.30 },
    { deal:1.35, initiative:true },
  ], text:[
    'Your team deals 25% more damage. Stacks with Overheat and Curse.',
    'Your team deals 30% more damage.',
    'Your team deals 35% more damage and always moves first, unless they have it too.',
  ]},
  Steel: { name:'Steel Aegis', turns:5, tiers:[
    { reduce:0.30 },
    { reduce:0.35, block:5 },
    { reduce:0.40, block:5, regen:1 },
  ], text:[
    'Take 30% less damage.',
    'Take 35% less damage, and gain 5 damage-block stacks.',
    'Take 40% less damage, gain 5 block stacks, and regain one each turn.',
  ]},
  Fairy: { name:'Diamond Dust', turns:5, tiers:[
    { cleanse:true },
    { cleanse:true, passive:true, borrow:1 },
    { cleanse:true, passive:true, borrow:2 },
  ], text:[
    'Sweeps away every enemy effect and keeps your own refreshed while it lasts.',
    'Now a passive, active on entering the field. Using it actively also casts any one other + Very High skill.',
    'Now a passive, active on entering the field. Using it actively also casts any two other ✦ Very High skills, one after the other.',
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
  if(grant.block)     grantBlock(holder, grant.block, atk);
  if(grant.guard)     holder.guard = true;
  if(grant.airborne)  holder.airborne = (holder.airborne||0) + grant.airborne;
  if(grant.invisible) holder.invisible = (holder.invisible||0) + grant.invisible;
  if(grant.prep)      holder.prep = (holder.prep||0) + grant.prep;
}
/* Everything a monster starts the battle with, the moment it takes the field. */
function applyEntryPassives(holder, species, level, atk){
  (MOVES[species]||[]).forEach(mv=>{
    const e = mv[6];
    if(!e || !e.passive) return;
    if((level||1) < mv[5]) return;
    applyPassiveGrant(holder, e.passive, atk);
  });
}
function stanceEvasion(holder){
  let best = 0;
  if(holder && holder.airborne  > 0) best = Math.max(best, STANCE_EVASION.airborne);
  if(holder && holder.invisible > 0) best = Math.max(best, STANCE_EVASION.invisible);
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
function diamondDustCleanse(){
  const b = ui.battle;
  if(!b) return 0;
  let cleared = 0;
  b.enemies.forEach(e=>{ cleared += eStatuses(e).length; e.statuses = []; });
  b.fieldStatus = {};
  const ps = partyStatuses();
  Object.keys(ps).forEach(k=>{
    if(k === 'diamondDust') return;
    ps[k].turnsLeft = Math.max(ps[k].turnsLeft, STATUS_TURNS + 1);   // refreshed, not stacked
  });
  return cleared;
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
    battleMsg(`✨ Borrowed: ${r.msg}`);
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
    applyHits(hits); reportHits(hits);
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
function grantBlock(holder, n, atkAt){
  if(!holder || n<=0) return;
  holder.blockStacks = (holder.blockStacks||0) + n;
  // each stack remembers the ATK it was minted at
  holder.blockValue = atkAt || holder.blockValue || 0;
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
  return livingEnemies().some(e => {
    if(e.move && MOVE_FIRST_NAMES.has(e.move[1])) return true;
    return (MOVES[e.species]||[]).some(m => MOVE_FIRST_NAMES.has(m[1]) && (e.level||1) >= m[5]);
  });
}
const MOVE_FIRST_NAMES = new Set(['Swift Strike']);

/* Hand the turn to whoever has the initiative. */
function beginPlayerPhase(msg){
  const b = ui.battle;
  if(!b) return;
  // enemy-cast Charm may steal the player's turn before it begins
  const ch = getPStatus(0,'charmed');
  if(ch && Math.random() < (ch.chance||0.20)){
    b.phase = 'resolving';
    renderBattle();
    battleMsg(`💗 ${displayName(activeMon())} is charmed and loses its turn!`);
    return setTimeout(enemyTurn, 900);
  }
  if(b._enemyWentThisRound){ b._enemyWentThisRound = false; }
  else if(enemySeizesInitiative()){
    b.phase = 'resolving';
    b._enemyWentThisRound = true;
    renderBattle();
    const cat = livingEnemies().find(e => { const p = passiveOf(e); return p && p.first; });
    battleMsg(cat ? `⚡ Lightning Cat — ${SPECIES[cat.species].name} moves first!`
                  : '⚡ They seize the initiative!');
    return setTimeout(enemyTurn, 800);
  }
  /* Pre-hits land before the player may act. */
  b.phase = 'resolving';
  renderBattle();
  runPreHits(()=>{
    if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
    b.phase = 'player';
    renderBattle();
    if(msg) battleMsg(msg);
  });
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
       { id:'vane_shear',       name:'RRS Vane Shear',   tint:'#4a6a8a' } ],
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
  return { species, level, maxHp:hp, hp:hp, atk:stat, move, types:sp.types, stage, tier:sp.tier, ai, nerfed, boss:!!opts.boss, crowned:!!opts.crowned };
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
    scriptedLoss: config.scriptedLoss||null,
    scriptedAlly: config.scriptedAlly||null, allyMove: config.allyMove||null,
    allyUnkillable: !!config.allyUnkillable, enemiesFirst: !!config.enemiesFirst,
    switchedThisTurn:false, busy:false, fightMistakes:[], phase:'player', wordCarry:0,
    charge:null, legacyBonus:0,
    aftershock:[], aftershockPending:false, bonusMult:0, _bonusResolved:false,
    _passiveUsed:false, _enemyWentThisRound:false,
    rechargeWords:0,         // every word written this battle feeds the meter

    partyStatus:{},          // party-wide buffs, each with a turn counter
    fieldStatus:{},          // debuffs stamped on every enemy, inherited by later waves
    usedVeryHigh:{}, usedUltra:{},   // uid -> true, once-per-battle usage
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
  if(config.enemiesFirst){
    ui.battle.phase = 'resolving';
    setTimeout(()=>{ battleMsg('They strike first!'); setTimeout(enemyTurn, 700); }, 700);
  }
}
function loadWave(i){
  const b = ui.battle;
  b.enemies = b.waves[i].map(spec => makeEnemy(spec.species, spec.level, { nerfed:spec.nerfed, ai:spec.ai, supplements:spec.supplements, boss:spec.boss, wildRoll:spec.wildRoll, crowned:spec.crowned }));
  // Leech Seed is a FIELD effect: it re-roots on every new wave.
  if(b.leechSeed) b.enemies.forEach(e=> addEStatus(e, { type:'leechSeed' }));
  b.enemies.forEach(e=>{ if(!state.encounteredSpecies.includes(e.species)) state.encounteredSpecies.push(e.species); });
  /* Field effects re-apply to anything that walks onto the field, so a new wave
     arrives already seeded / entombed rather than stepping in clean. */
  const fs = b.fieldStatus || {};
  if(fs.leechSeed) b.enemies.forEach(e=> addEStatus(e, Object.assign({}, fs.leechSeed)));
  if(fs.iceField)  b.enemies.forEach(e=> addEStatus(e, { type:'iceTomb', turnsLeft:1, taken:fs.iceField.taken }));
  if(fs.curse)     b.enemies.forEach(e=> addEStatus(e, Object.assign({}, fs.curse)));
  if(b.onWaveStart) b.onWaveStart(i);
  // stances and block stacks apply the moment a monster takes the field
  b.enemies.forEach(e=> applyEntryPassives(e, e.species, e.level, e.atk));
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
  b.activeIndex = ai; b.switchedThisTurn=false; b.phase='player';
  saveProfile();
}
function onWaveCleared(){
  // a scripted ally keeps fighting across waves — don't hand the party back yet

  const b = ui.battle;
  if(b.arena){
    // infinite waves: respawn fresh dummies, keep statuses and HP as-is
    b.enemies = Array.from({length:b.arenaCount}, ()=>makeDummy(b.arenaType));
    b.switchedThisTurn=false;
    b.phase='player';
    renderBattle();
    battleMsg('Dummies respawned. Keep testing!');
    return;
  }
  if(b.waveIndex < b.waves.length-1){
    b.waveIndex++;
    loadWave(b.waveIndex);
    renderBattle();
    battleMsg(`Wave ${b.waveIndex+1} of ${b.waves.length}!`);
  } else {
    if(b.isNpc) onChallengeWon();
    else onBattleWon();
  }
}

function activeMon(){ return state.party[ui.battle.activeIndex]; }
function monMaxHp(m){ return computeMaxHp(m.species, m.level, m.supplements, m); }
function monAtk(m){ return computeMaxStat(m.species, m.level, m.supplements, m); }
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
  if(getPStatus(0,'overheat'))    m *= 1.5;
  if(getPStatus(0,'dragonDance')) m *= 1.25;
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
    return `Hits enemies <b>${r.min}–${r.max}</b> times for <b>${dmg}</b> damage per hit.`;
  }
  if(mv.target === 'SingleAOE')
    return `Hits one enemy for <b>${dmg}</b>, then every other enemy for <b>${Math.ceil(dmg*(mv.splash||0.5))}</b>.`;
  if(mv.target === 'AOE' && n) return `Hits <b>all enemies ${n} times</b> for <b>${dmg}</b> damage per hit.`;
  if(mv.target === 'AOE')      return `Hits <b>all enemies</b> for <b>${dmg}</b> damage each.`;
  if(mv.target === 'Multi2')   return `Hits <b>2 enemies</b> for <b>${dmg}</b> damage each.`;
  if(n)                        return `Hits <b>1 enemy ${n} times</b> for <b>${dmg}</b> damage per hit.`;
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
  if(mv.passive) out.push(`<b>Passive.</b> This works on its own the moment the monster enters battle.`);
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
  if(dmg != null) parts.push(moveShapeSentence(mv, dmg));
  else if(!mv.passive) parts.push(`A support move — it deals no damage by itself.`);
  moveEffectText(mv, mon, atk).forEach(t=>parts.push(t));
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
  counter:'↩️ Counter', iceTomb:'🧊 Frozen', curse:'👻 Cursed', stunned:'💫 Stunned',
  discombobulate:'🌀 Confused', leechSeed:'🌿 Leeched', paralysed:'💫 Stunned', airborne:'🕊 Airborne', invisible:'👤 Unseen', guard:'🛡 Guard', prep:'🎯 Prep', diamondDust:'💎 Diamond Dust', curseWard:'👻 Warded', charm:'💗 Charmed', charmed:'💗 Charmed', disrupt:'📡 Disrupt', paralysed:'⚡ Paralysed', tachy:'🌀 Tachypsychia', steelSoul:'🛡 Steel Soul', shell:'🌋 Shell', clones:'👥 Clones', dot:'🔥 Burning',
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
    const bp = blockPill(activeMon());
    if(bp) out.push(bp);
    const sp2 = stancePills(activeMon());
    if(sp2) out.push(sp2);
    row.innerHTML = out.join('');
  }
  // Enemy statuses render on their OWN card, above that enemy's HP bar, so it's
  // obvious which monster in a group is afflicted.
  ui.battle.enemies.forEach((e,i)=>{
    const slot = document.getElementById('enemyStatus-'+i);
    if(!slot) return;
    if(e.hp<=0){ slot.innerHTML=''; return; }
    /* Stances and block live as plain fields rather than statuses, so they need
       rendering explicitly — otherwise a Loong's 70% evasion is invisible and
       the fight just feels like bad luck. */
    const extras = [];
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
