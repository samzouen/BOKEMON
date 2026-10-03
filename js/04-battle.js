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

/* ---------- A MONSTER'S OWN DEBUFFS (2.83) ----------
   A stun, a nap, a weakened next blow, a muddle: what an enemy puts on ONE of
   your monsters stays on that one, as a mark on an enemy stays on that enemy.
   A monster sent out after it isn't stunned by it — and a companion beside it
   won't be either (handover/07-COMPANIONS). Kept for the battle by uid in
   ui.battle.monStatus. Everything else on your side — your buffs, and their
   fields on you (Charm, Disrupt, a Curse, their seeds, their bog, Held Fast) —
   still covers the whole side in partyStatus.
   getPStatus / setPStatus / removePStatus route these four to the monster in
   focus (activeMon), so the call sites read as they always did. */
const MON_DEBUFFS = new Set(['stunned', 'asleep', 'softened', 'discombobulate']);
function monStatuses(m){
  const b = ui.battle;
  if(!b || !m || !m.uid) return [];
  b.monStatus = b.monStatus || {};
  return (b.monStatus[m.uid] = b.monStatus[m.uid] || []);
}
function getMStatus(m, type){ return monStatuses(m).find(s=> s.type === type) || null; }
function setMStatus(m, status){
  if(!ui.battle || !m || !status) return null;
  if(!status.unsweepable && dustBlocks(statusOwner(status.type, status, 'player'))) return null;
  const st = Object.assign({ turnsLeft: STATUS_TURNS }, status);
  const list = monStatuses(m);
  const i = list.findIndex(s=> s.type === st.type);
  if(i >= 0) list[i] = st; else list.push(st);
  return st;
}
function removeMStatus(m, type){
  const list = monStatuses(m);
  const i = list.findIndex(s=> s.type === type);
  if(i >= 0) list.splice(i, 1);
}

/* uid is accepted but ignored — kept so existing call sites read naturally.
   (A monster's own debuffs go to the monster in focus — above.) */
function getPStatus(uid, type){
  if(MON_DEBUFFS.has(type)) return getMStatus(activeMon(), type);
  return partyStatuses()[type];
}
function removePStatus(uid, type){
  if(MON_DEBUFFS.has(type)) return removeMStatus(activeMon(), type);
  delete partyStatuses()[type];
}
/* Diamond Dust is enforced HERE rather than at each call site. Every status in
   the game passes through setPStatus / addEStatus / setESide, so the other
   side's effect cannot land while a dust holds — including any effect added in
   future, provided its type is in STATUS_KIND. Per-call-site checks were one
   forgotten line away from a hole. */
function setPStatus(uid, status){
  if(!ui.battle || !status) return null;
  if(MON_DEBUFFS.has(status.type)) return setMStatus(activeMon(), status);
  /* Either side's dust stops the OTHER side's effects forming on this side —
     but not what a creature simply IS (a bog), which no dust would sweep. */
  if(!status.unsweepable && dustBlocks(statusOwner(status.type, status, 'player'))) return null;
  const st = Object.assign({ turnsLeft: STATUS_TURNS }, status);
  partyStatuses()[status.type] = st;
  return st;
}
function clearPStatus(uid, type){ removePStatus(uid, type); }

/* Stamp a field status on every enemy, and remember it so later waves inherit it. */
function applyFieldStatus(status){
  const b = ui.battle;
  if(dustBlocks('player')) return null;              // their dust: your fields cannot take hold
  b.fieldStatus = b.fieldStatus || {};
  b.fieldStatus[status.type] = Object.assign({ turnsLeft: STATUS_TURNS }, status);
  livingEnemies().forEach(e=> addEStatus(e, Object.assign({}, b.fieldStatus[status.type])));
}

/* One round has passed: age every status and drop the expired ones. */
/* One muddled turn: this enemy's next swing lands on its own side. */
function markConfused(e, ffPower, once){
  /* `once` (Lunacy, 2.88): muddled for its next swing, this round or the
     next, as a muddle cast on you mid-round is (markPlayerConfused's `fresh`). */
  addEStatus(e, Object.assign({ type:'discombobulate', turnsLeft:2, mine:true, ffPower:ffPower || 0.60 },
                              once ? { once:true, fresh:true } : {}));
}
/* Each round the old muddle clears, and Discombobulate's field catches whoever
   it catches — the newly arrived as readily as the rest. A lone Lunacy leaves
   no field behind, so its muddle simply lapses here. */
/* A field's certain turn (`sure`) is not spent until somebody has actually
   swung muddled (`sureUsed`, set by the swing itself). A round in which nobody
   on that side swung — all knocked out first, asleep, frozen, or the field
   came after their turns — keeps it, and the next round everyone standing
   there is muddled again, new arrivals included (2.74). */
function discombobulatePulse(){
  /* Their field on you first: last round's muddle clears (unless it was cast
     since your last turn), and their field may catch you again — each monster
     of yours on the field on its own (2.84). */
  const ef = getESide('confusionField');
  const sureNow = !!(ef && ef.sure && !ef.sureUsed);
  livingField().forEach(pm=> withFocus(pm, ()=>{
    const mine = getPStatus(0,'discombobulate');
    if(mine && mine.fresh) mine.fresh = false; else removePStatus(0,'discombobulate');
    if(sureNow){
      if(!getPStatus(0,'discombobulate')) markPlayerConfused(ef.ffPower);
    } else if(ef && !getPStatus(0,'discombobulate') && Math.random() < (ef.after || 0)){
      if(ef.sleep && Math.random() < ef.sleep) setPStatus(0, { type:'asleep', turnsLeft:(ef.sleepTurns || 1) + 1, by:'enemy' });
      else markPlayerConfused(ef.ffPower);
    }
  }));
  if(ef && !sureNow) ef.sure = false;
  const f = getPStatus(0,'confusionField');
  livingEnemies().forEach(e=>{
    const st = getEStatus(e,'discombobulate');
    if(st && st.once && st.fresh){ st.fresh = false; return; }   // a Lunacy it has not swung under yet
    removeEStatus(e,'discombobulate');
  });
  if(!f) return;
  if(f.sure && !f.sureUsed){ livingEnemies().forEach(e=> markConfused(e, f.ffPower)); return; }
  f.sure = false;
  livingEnemies().forEach(e=>{
    if(Math.random() >= (f.after || 0)) return;
    if(f.sleep && Math.random() < f.sleep){
      addEStatus(e, { type:'asleep', turnsLeft:(f.sleepTurns || 1) + 1, mine:true });
      return;
    }
    markConfused(e, f.ffPower);
  });
}

/* One layer of Frost Armour on whoever is out front. */
function frostArmourLayer(mon){
  mon = mon || activeMon();
  if(!mon) return;
  grantBlock(mon, 1, monAtk(mon));
  setTimeout(()=> battleMsg(`❄️ Frost Armour — a layer of ice closes over ${displayName(mon)}.`), 400);
}
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
  /* Diamond Dust holds its OWN side's effects open. This lives INSIDE the tick
     so every path honours it — clearing a wave ticks statuses without going
     through the end-of-round handler, and those rounds were quietly ageing
     buffs the dust was supposed to be sustaining.
     Your dust holds every buff of yours (back to its own full length if it has
     one), and your fields on them. Theirs holds their side's buffs and their
     FIELDS on you — never a one-turn stun or a nap, which are meant to run
     out. Nothing marked noDust (a deep freeze) is ever held. */
  const pDust = playerDust(), eDust = enemyDust();
  const held = (owner, k, st, heldBy)=>{
    const dust = owner === 'player' ? pDust : eDust;
    if(!dust || k === 'diamondDust' || st.noDust) return false;
    if(heldBy === 'player' && owner === 'enemy') return FIELD_TYPES.has(k);
    return true;
  };
  const ps = partyStatuses();
  Object.keys(ps).forEach(k=>{
    const st = ps[k];
    if(st.permanent) return;                               // a bog lasts the whole battle
    if(held(statusOwner(k, st, 'player'), k, st, 'player')){
      st.turnsLeft = st.max ? st.max : STATUS_TURNS + 1;   // refreshed, never ages
      return;
    }
    st.turnsLeft--;
    if(st.turnsLeft <= 0){ delete ps[k]; afterStatusGone(k, 'player'); expired.push(STATUS_LABELS[k]||k); }
  });
  /* Each of your monsters' own debuffs ages the same way (2.83). */
  Object.values(b.monStatus || {}).forEach(list=>{
    list.slice().forEach(st=>{
      if(st.permanent) return;
      if(held(statusOwner(st.type, st, 'player'), st.type, st, 'player')){
        st.turnsLeft = st.max ? st.max : STATUS_TURNS + 1;
        return;
      }
      st.turnsLeft--;
      if(st.turnsLeft <= 0){ list.splice(list.indexOf(st), 1); afterStatusGone(st.type, 'player'); expired.push(STATUS_LABELS[st.type]||st.type); }
    });
  });
  /* Their side's own buffs age exactly as yours do. */
  const es = enemySideStatuses();
  Object.keys(es).forEach(k=>{
    const st = es[k];
    if(held('enemy', k, st, 'enemy')){ st.turnsLeft = st.max ? st.max : STATUS_TURNS + 1; return; }
    st.turnsLeft--;
    if(st.turnsLeft <= 0){ delete es[k]; afterStatusGone(k, 'enemy'); expired.push('their ' + (STATUS_LABELS[k]||k)); }
  });
  if(b.fieldStatus){
    Object.keys(b.fieldStatus).forEach(k=>{
      if(b.fieldStatus[k].permanent) return;
      if(held('player', k, b.fieldStatus[k], 'enemy')){
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
  if(!status) return;
  /* An enemy's own buff can't form under your dust; your mark on it can't
     form under theirs. Polarity decides which is which. */
  if(dustBlocks(statusOwner(status.type, status, 'enemy'))) return;
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
function monRef(m){ return { uid:m.uid, types:SPECIES[m.species].types, species:m.species, level:m.level, _ambush:m._ambush || 0, _omen:m._omen || 0 }; }

/* STEEL SOUL (2.93 — reworked; it had grown too strong)
   A passive and a quick move in one row (`soul:{turns:1, reduce:0.2,
   bonus:0.1}`, the Ankylosaurus's Power2; `isQuickMove` knows it):
   - Passive: a monster that has learnt it takes `reduce` (20%) less damage,
     always — its alone (`soulPassive`). A ✦ Curse mutes it, as any passive.
   - Quick move, once a battle (the 100-word meter gives it back): it costs no
     turn, and for this turn only — never held open by Diamond Dust — its hits
     carry +`bonus`× ATK each, and every damage reduction its side has up, its
     own 20% included, turns into damage as well (`soulShields`).
   Both sides alike. Its old guard (every single blow drawn to it) is gone with
   the rework: SOUL_GUARD switches it back on. */
const SOUL_GUARD = false;
/* The passive half: how much less damage this monster takes for knowing
   Steel Soul (0 if it does not, or not yet, or a ✦ Curse has it muted).
   `m` is a monRef or a monster of yours, or an enemy. */
function soulPassive(m){
  if(!m || !m.species) return 0;
  const row = (MOVES[m.species] || []).find(r=> r[6] && r[6].soul);
  if(!row || (m.level || 1) < row[5]) return 0;
  if(passivesMuted(m)) return 0;
  return row[6].soul.reduce || 0;
}
/* Its flat bonus for one hit: bonus × ATK if the attacker is the monster that
   cast it (`attacker` is a monRef on your side, the enemy object on theirs),
   else 0. */
function steelSoulBonus(attacker, atk, isPlayerAttacking){
  if(!ui.battle || !attacker) return 0;
  const st = isPlayerAttacking ? getPStatus(0,'steelSoul') : getESide('steelSoul');
  if(!st) return 0;
  const mine = isPlayerAttacking ? (attacker.uid != null && st.owner === attacker.uid) : st.owner === attacker;
  return mine ? (st.bonus || 0) * atk : 0;
}
/* Steel Soul's other half (2.90): its caster also hits harder, either side's.
   Every damage reduction that is up on its side when it strikes turns round
   into more damage (2.91): ×(1 + that reduction), each one multiplying the
   rest — Steel Soul's own 20%, and Spike Armour (20–30%), Steel Aegis
   (30–40%), a Curse ward (10–15%), a Lava Shell (60%) if they are up too; in
   their hands also the toughness the monster itself carries (a Steel it
   walked in with). Each counted exactly as computeDamage takes it off. 1 for
   anyone else. */
function soulShields(isPlayer, attacker){
  const out = [];
  const add = r=>{ if(r > 0) out.push(r); };
  const side = type=> isPlayer ? getPStatus(0, type) : getESide(type);
  const sa = side('spikeArmour'), aeg = side('steelAegis'), cw = side('curseWard'), sh = side('shell');
  add(soulPassive(attacker));                      // its own Steel Soul passive (2.93)
  if(sa) add(sa.reduce || 0.20);
  if(aeg) add(aeg.reduce || 0.30);
  if(cw) add(cw.reduce || 0);
  if(sh && sh.reduce) add(sh.reduce);
  if(!isPlayer && attacker && attacker.takeMult && attacker.takeMult < 1) add(1 - attacker.takeMult);
  return out;
}
function steelSoulAmp(attacker, isPlayerAttacking){
  if(!ui.battle || !attacker) return 1;
  const st = isPlayerAttacking ? getPStatus(0,'steelSoul') : getESide('steelSoul');
  if(!st) return 1;
  const mine = isPlayerAttacking ? (attacker.uid != null && st.owner === attacker.uid) : st.owner === attacker;
  return mine ? soulShields(isPlayerAttacking, attacker).reduce((m, r)=> m * (1 + r), 1) : 1;
}
/* What a Steel Soul just cast adds this turn, for its message (2.93): its
   ×, and why, then the flat bonus. A ✦ Curse muting the passive with no
   shield up leaves only the bonus. Call it once the status is set. */
function soulCastNote(attacker, isPlayer, bonus){
  const amp = steelSoulAmp(attacker, isPlayer), own = soulPassive(attacker);
  const add = `adds +${bonus}× ATK to every hit`;
  if(amp <= 1 + 1e-9) return add;
  const why = amp > 1 + own + 1e-9
    ? `every shield ${isPlayer ? 'your' : 'their'} side has up${own ? `, its own ${Math.round(own * 100)}% too` : ''}`
    : `its own ${Math.round(own * 100)}% turned to damage`;
  return `hits <b>×${+amp.toFixed(2)}</b> (${why}) and ${add}`;
}
/* Steel Soul's guard (2.90): while it is up, every blow aimed at ONE monster
   of its side — a single blow, each strike of a barrage or an Ultra, the main
   blow of a splash — goes to the monster that cast it, whether it leads or
   stands beside its leader as a companion. Area moves and twin blows still
   reach everyone. In their hands the same: your single blows must go through
   it. Returns that monster, standing, or null. */
function soulGuardian(side){
  if(!ui.battle || !SOUL_GUARD) return null;      // (2.93) the guard is gone
  if(side === 'player'){
    const st = getPStatus(0, 'steelSoul');
    return st ? (livingField().find(m=> m.uid === st.owner) || null) : null;
  }
  const st = getESide('steelSoul');
  return (st && st.owner && st.owner.hp > 0 && livingEnemies().includes(st.owner)) ? st.owner : null;
}
/* Unified damage calc: applies type effectiveness + all status modifiers, in a
   fixed order, then rounds up. `attacker`/`defender` are refs — use monRef() for
   player monsters; enemy objects already carry .types. */
function computeDamage(baseFactor, attackerAtk, attacker, defender, isPlayerAttacking){
  let dmg = baseFactor * attackerAtk;
  dmg *= typeMultiplier(attacker.types, defender.types);
  /* The attack that ends a Lurk may be an ambush (Ambush, Pounce); an Ill Omen
     makes the next blow land harder. */
  if(attacker && attacker._ambush > 1) dmg *= attacker._ambush;
  if(attacker && attacker._omen > 0) dmg *= 1 + attacker._omen;
  /* Steel Soul's flat +0.1× ATK, its caster's alone on either side. Added
     after type effectiveness (the same against anything) but BEFORE the damage
     buffs, so Overheat, Dragon Dance and Dragon Legacy multiply it — and a
     Curse on the target, below. Until 2.81 it went on after them, unbuffed. */
  dmg += steelSoulBonus(attacker, attackerAtk, isPlayerAttacking);

  // attacker-side buffs/debuffs
  if(isPlayerAttacking){
    const oh = getPStatus(0,'overheat');
    if(oh) dmg *= (oh.deal || 1.5);
    const dd = getPStatus(0,'dragonDance');
    if(dd) dmg *= (dd.deal || 1.25);               // multiplies WITH overheat
    // Dragon Legacy stacks multiplicatively with the above
    if(ui.battle && ui.battle.legacyBonus) dmg *= (1 + ui.battle.legacyBonus);
    /* (Steel Soul's bonus is added above, before these buffs.) Steel Soul's
       reduction works both ways (2.90): its caster also hits that much harder
       — and harder again for every other shield its side has up (2.91) —
       multiplying with Overheat, Dragon Dance and the rest. */
    dmg *= steelSoulAmp(attacker, true);
    /* Weakened (an enemy's Sky Splitter Max): your next attack lands softer.
       This used to sit with the damage you TAKE, so it halved the enemy's
       hits on you instead — the opposite of what it says. afterPlayerAttack()
       uses it up once that attack is made. */
    const soft = getPStatus(0,'softened');
    if(soft) dmg *= (1 - (soft.amount || 0.5));
    /* Their Firehound's Terrorize (2.87: it only ever reached the button's
       estimate and a few side-hits, never the blow itself). */
    dmg *= terrorizeFactor();
  } else {
    /* Discombobulate used to ALSO shave 20% off everything a confused enemy
       threw. The rework replaced that with visible friendly fire, but this line
       survived — so a confused wave was both hitting itself and hitting softer.
       The whole effect is the turned swing now. */
    /* What this monster carries (an Overheat it walked in with, the whales'
       rage) and what its side has cast. dealMult was being set and never read,
       so Jax's Firehound and Dragon, and the enraged whales, never once hit as
       hard as they were meant to. */
    if(attacker && attacker.dealMult) dmg *= attacker.dealMult;
    const ohE = getESide('overheat');
    if(ohE) dmg *= (ohE.deal || 1.5);
    const ddE = getESide('dragonDance');
    if(ddE) dmg *= (ddE.deal || 1.25);
    dmg *= steelSoulAmp(attacker, false);                    // theirs hits harder too (2.90; every shield, 2.91)
    const softE = getEStatus(attacker,'softened');          // your weaken on it
    if(softE) dmg *= (1 - (softE.amount || 0.5));
    dmg *= playerTerrorizeFactor();                          // yours frightens them (2.87)
  }

  // defender-side modifiers
  if(isPlayerAttacking){ // defender is an enemy

    if(defender && defender.takeMult) dmg *= defender.takeMult;
    const ice = getEStatus(defender,'iceTomb');
    if(ice) dmg *= (ice.taken != null ? ice.taken : 0.8);
    const deep = getPStatus(0,'deepFreeze');           // your field: harder to hurt in the ice
    if(deep && deep.taken != null) dmg *= deep.taken;
    const cur = getEStatus(defender,'curse');
    if(cur) dmg *= (1 + (cur.extra != null ? cur.extra : 0.25));
    /* Their side's own armour — the mirror of yours below. */
    const ohE = getESide('overheat');
    if(ohE) dmg *= (ohE.take || 1.5);
    const saE = getESide('spikeArmour');
    if(saE) dmg *= (1 - (saE.reduce || 0.20));
    const stE = getESide('steelAegis');
    if(stE) dmg *= (1 - (stE.reduce || 0.30));
    const cwE = getESide('curseWard');
    if(cwE) dmg *= (1 - (cwE.reduce || 0));
    const shE = getESide('shell');
    if(shE && shE.reduce) dmg *= (1 - shE.reduce);
    dmg *= (1 - soulPassive(defender));                  // their Ankylosaurus's Steel Soul passive (2.93)
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
    dmg *= (1 - soulPassive(defender));                  // Steel Soul's passive: its alone (2.93)
    /* What their side has put on yours: a Curse makes you softer, and inside
       their deep freeze you are as hard (or easy) to hurt as they were in yours. */
    const curP = getPStatus(0,'curse');
    if(curP && isEnemyOwned('curse', curP)) dmg *= (1 + (curP.extra != null ? curP.extra : 0.25));
    const deepE = getESide('deepFreeze');
    if(deepE && deepE.taken != null) dmg *= deepE.taken;
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
      layOverheatBurn('player', { burn:d.burn || 0, atk:casterAtk }, T);
      res.msg = d.text;
      break;

    case 'Water': { // Ice Tomb — a deep-freeze FIELD on your own side
      /* No enemy acts while it holds — whoever is on the field, whenever they
         arrived — and at base and + they are harder to hurt inside the ice. It
         belongs to your side, not to the caster, so swapping out does not end
         it. It never refreshes: Diamond Dust cannot extend it (noDust), and an
         opponent's Diamond Dust sweeps it away. */
      setPStatus(uid, { type:'deepFreeze', turnsLeft:d.freeze || 2, taken:(d.taken == null ? 1 : d.taken),
                        noDust:true, mine:true });
      /* Frost Armour (+ and ✦) is a second field: a layer of damage block every
         turn it lasts, starting now. Diamond Dust holds it at full length.
         At ✦ it also slows the enemy side. */
      if(d.frost){
        setPStatus(uid, { type:'frostArmour', turnsLeft:d.frost, max:d.frost, slow:d.slow || 0, mine:true });
        frostArmourLayer(casterMon);
      }
      /* Frost Armour: the cold closes over your own monster too. Block stacks
         do not expire, so they guard a Cataclysm charge all the way through.
         The parameter is casterMon — this used `mon`, which exists nowhere
         here, so + and ✦ threw right after the freeze: no armour, no message.
         tools/undef-check.js now catches any name used but never declared. */
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
      applyFieldStatus({ type:'curse', turnsLeft:T, extra:d.extra, mute:!!d.mute });
      if(d.reduce) setPStatus(uid,{type:'curseWard', turnsLeft:T+1, reduce:d.reduce});
      res.msg = d.text;
      break;

    case 'Psychic': // Discombobulate — a field on YOUR side
      /* Kept on your side, so Diamond Dust holds it open and it carries on into
         the next wave. The turn it lands, everyone on the field is muddled;
         every turn after, each of them gets a fresh roll. */
      setPStatus(uid, { type:'confusionField', turnsLeft:T, mine:true,
                        after:d.confuseAfter || 0.25, ffPower:d.ffPower || 0.60,
                        sleep:d.sleep || 0, sleepTurns:d.sleepTurns || 1, sure:true, sureUsed:false });
      livingEnemies().forEach(e=> markConfused(e, d.ffPower || 0.60));
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
  /* A legendary running on a hole where its core should be gets its Max back
     with the core itself: the crown unlocks it, whatever its level or its
     protein. */
  if(mv[0] === 'Max' && (SPECIES[m.species] || {}).nerfedUntilCrowned) return isCrowned(m);
  return m.level >= mv[5];
}
/* Overcharge's own repeat chance: its first rate (certain at ✦) until it has
   been rolled on something real — a blow that reached them, or a charge — and
   its later rate after that; 0 without it. A turn with nothing to repeat (the
   words went wrong, or every strike was dodged) keeps the first rate (2.74; it
   used to lapse at the end of the round it was cast in). */
function overchargeChance(){
  const oc = getPStatus(0,'overcharge');
  if(!oc) return 0;
  return (oc.fresh && oc.firstChance != null) ? oc.firstChance : (oc.chance || 0.25);
}
function spendOverchargeFirst(oc){ if(oc) oc.fresh = false; }
/* The usual cap, and the one a lucky Overcharge double can reach (one more). */
function chargeCaps(def){ return { normal:def.max, lucky:def.max + 1 }; }
/* double: an Overcharge surge — two charges instead of one, and the only way
   past the usual cap. Returns how many charges were actually gained. */
function startCharge(mon, def, double){
  const b = ui.battle;
  b.charge = b.charge || { uid:mon.uid, charges:0, turnsLeft:0, def };
  const caps = chargeCaps(def), before = b.charge.charges;
  b.charge.charges = double ? Math.min(caps.lucky, before + 2)
                            : Math.max(before, Math.min(caps.normal, before + 1));
  b.charge.def = def;
  b.charge.turnsLeft = b.charge.charges + 1;   // 1 charge -> 2 turns, 2 -> 3
  /* The round you charge on ends immediately afterwards, and its end phase
     would age the window straight away — costing you one of the turns you just
     paid for. Skip that first tick. */
  b.charge.fresh = true;
  saveProfile();
  return b.charge.charges - before;
}
function clearCharge(){ if(ui.battle) ui.battle.charge = null; }

/* Dragon Legacy: the stored power passes to whoever comes next — for every
   action of its next turn (a Tachypsychia chain, an Overcharge repeat), not
   one move. legacyUsed is set when that turn begins (onMoveChosen) and the
   bonus clears when that round ends; if the dragon fell in the enemy's turn,
   it waits for the newcomer's own turn. */
function triggerDragonLegacy(){
  const c = chargeState();
  if(!c || c.charges<=0) return;
  ui.battle.legacyBonus = c.charges * 0.25;
  ui.battle.legacyUsed = false;
  clearCharge();
  battleMsg(`🐉 Dragon Legacy! Your next monster is empowered by +${Math.round(ui.battle.legacyBonus*100)}% for its whole turn.`);
}
function endDragonLegacy(){
  const b = ui.battle;
  if(b && b.legacyBonus && b.legacyUsed){ b.legacyBonus = 0; b.legacyUsed = false; }
}

/* In battle a Max move takes over the Ultimate's slot, so its slot reads
   'Ultimate' there — ask by name. (Rampage Max's Aftershock read the slot and
   came out at the Ultimate's 0.2× in battle until 2.79.) */
function isMaxAbility(m, mv){
  const row = m && (MOVES[m.species] || []).find(r=> r[0] === 'Max');
  return !!(row && mv && (mv.slot === 'Max' || mv.name === row[1]));
}

/* What Unleash / Hyperbeam deal at a number of charges: the charge's own
   table where it has one (Cataclysm Max, 2.80: Hyperbeam 1.75 / 2.25 / 2.85 /
   3.5, Unleash 1.25 / 1.5 / 1.8 / 2.15), else +0.25× / +0.5× a charge. */
function chargeMult(def, kind, charges){
  const n = Math.max(1, charges || 1);
  const table = kind === 'hyper' ? def.hyperBy : def.unleashBy;
  if(table && table[n - 1] != null) return table[n - 1];
  return kind === 'hyper' ? (n - 1) * 0.5 + def.hyper : (n - 1) * 0.25 + def.unleash;
}

/* The move list while a charge is held. */
function chargeMoves(m){
  const c = chargeState();
  const def = c.def;
  /* No charging at the usual cap. From one below it, an Overcharge double is
     what carries it one past (startCharge caps a double at caps.lucky). */
  const atCap = c.charges >= chargeCaps(def).normal;
  return [
    { slot:'Basic', name:'—', mult:null, target:'Single', words:0, unlock:0, available:false, isStone:false, locked:true },
    { slot:'Power1', name:'Charge', mult:null, target:'Charge', words:10, unlock:0,
      available:!atCap, isStone:false, chargeMore:true },
    { slot:'Power2', name:'Unleash', mult:chargeMult(def, 'unleash', c.charges), target:'AOE', words:0, unlock:0,
      available:true, isStone:false, chargeSpend:'unleash' },
    { slot:'Ultimate', name:'Hyperbeam', mult:chargeMult(def, 'hyper', c.charges), target:'Single', words:0, unlock:0,
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
  if(dustBlocks('player')) return snap;             // their dust: nothing takes hold
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
  if(dustBlocks('player')) return;                  // their dust: no copies form
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
    { freeze:2, taken:0.65 },
    { freeze:2, taken:0.85, frost:3 },
    { freeze:3, taken:1.0,  frost:5, slow:5 },
  ], text:[
    'A <b>deep-freeze field</b> on your side for <b>2 turns</b>: no enemy can act, and while frozen they take <b>35% less</b> damage. Diamond Dust cannot make it last longer.',
    'Deep freeze for <b>2 turns</b> (frozen enemies take <b>15% less</b> damage), plus <b>Frost Armour</b> for <b>3 turns</b>: a layer of damage block every turn. Diamond Dust keeps the armour at 3.',
    'Deep freeze for <b>3 turns</b> at <b>full damage</b>, plus <b>Frost Armour</b> for <b>5 turns</b>: a layer of block every turn, and the enemy side is <b>5 slower</b>. Diamond Dust keeps the armour at 5.',
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
    '75% to repeat the first move that lands, 25% after that — a turn with nothing to repeat (words gone wrong, every strike dodged) does not use it up. Very High skills never repeat.',
    'The first move that lands is certain to repeat, 30% after that — a turn with nothing to repeat (words gone wrong, every strike dodged) does not use it up. Very High skills never repeat.',
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
    'One turn of total evasion — the first turn anyone attacks you (a turn with no attack does not use it up) — then <b>15%</b> each turn after. This monster moves with <b>+1 initiative</b>, and no enemy can sweep that away.',
    'One turn of total evasion (the first turn anyone attacks you), then <b>20%</b>. Every dodge leaves <b>one afterimage</b>; each strikes a random enemy for <b>0.2× ATK</b> at the end of the turn, then fades. <b>+2 initiative</b>.',
    'One turn of total evasion (the first turn anyone attacks you), then <b>25%</b>. Every dodge leaves <b>two afterimages</b>, each striking for <b>0.3× ATK</b>. <b>+3 initiative</b>.',
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
    { extra:0.30, reduce:0.15, mute:true },
  ], text:[
    'Every enemy takes 25% more damage.',
    'Enemies take 25% more damage, and you take 10% less.',
    'Enemies take 30% more damage, you take 15% less, and enemy passives are muted while it lasts.',
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
    { confuseAfter:0.20, ffPower:0.60 },
    { confuseAfter:0.20, ffPower:0.90, sleep:0.05, sleepTurns:1 },
    { confuseAfter:0.20, ffPower:1.20, sleep:0.15, sleepTurns:1 },
  ], text:[
    'A <b>5-turn field</b> on your side. <b>Every enemy on the field is muddled</b> and swings at its own side — at itself, if it stands alone — for <b>60%</b> of its damage, until one of them has actually swung: a turn when none of them swings (knocked out first, asleep, frozen) does not use it up, and the next wave arrives muddled. Every turn after, each of them (new arrivals included) has a <b>20%</b> chance of the same. Diamond Dust keeps the field going.',
    'As base, but a turned swing lands for <b>90%</b> of its damage, and a caught monster may sit down and sleep for the turn instead (<b>5%</b>).',
    'As base, but a turned swing lands for <b>120%</b> of its damage — harder on its own side than it would have hit you — and the nap chance is <b>15%</b>.',
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
  /* The other side's Diamond Dust keeps a stance from forming. What a creature
     IS still arrives with it — an unsweepable evasion, Terrorize, its
     thresholds, a bog — because the dust would not have swept those either. */
  const isFoe = !!(ui.battle && ui.battle.enemies && ui.battle.enemies.includes(holder));
  if(ui.battle && dustBlocks(isFoe ? 'enemy' : 'player')) grant = dustProofTraits(grant);
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
    holder.passiveEvade = grant.evadeAlways;     // so a ✦ Curse can tell it apart
    if(grant.unsweepable) holder.evadeUnsweepable = true;
  }
  /* Lurk from a passive (Ambush, Bog Lurker, Stalk) on entry — once per
     battle — or from casting Stalk, which may raise it again. */
  if(grant.lurk) grantLurk(holder, !!grant.again);
  /* Bog Lurker: the other side is bogged down for as long as it stands (2.74:
     it used to outlive him). What the creature IS, so no sweep lifts it; it
     does not stack — a second Bog Lurker only joins the list of who holds it,
     and the bog lifts when the last of them has fallen (pruneBogs). Theirs are
     remembered by the monster, yours by uid. */
  if(grant.bog && ui.battle){
    if(isFoe){
      const st = getPStatus(0, 'bogged');
      if(st){ st.by = st.by || []; if(!st.by.includes(holder)) st.by.push(holder); }
      else setPStatus(0, { type:'bogged', turnsLeft:999, unsweepable:true, permanent:true, by:[holder] });
    } else {
      const fs = ui.battle.fieldStatus = ui.battle.fieldStatus || {};
      const uid = holder && holder.uid;
      if(fs.bogged){ fs.bogged.by = fs.bogged.by || []; if(uid && !fs.bogged.by.includes(uid)) fs.bogged.by.push(uid); }
      else fs.bogged = { type:'bogged', turnsLeft:999, unsweepable:true, permanent:true, by:uid ? [uid] : [] };
    }
  }
  /* Ill Omen: its next blow lands harder. */
  if(grant.omen) holder._omen = grant.omen;
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
/* A bog goes with the last Bog Lurker holding it: fallen, or gone with his
   wave. Called when the order is built and whenever the badges are drawn, so
   the pill goes the moment he does. Returns true if a bog lifted. */
function bogHolderStanding(side, h){
  if(side === 'enemy'){                                   // theirs: the monster itself
    const b = ui.battle;
    return !!(b && b.enemies && b.enemies.includes(h) && h.hp > 0);
  }
  /* yours: by uid, benched or not — or a companion out on the field (2.87:
     a companion's bog lifted the moment it was laid, as it is not one of
     the party; back in its core, it holds no bog). */
  const c = (typeof companionOnField === 'function') ? companionOnField() : null;
  const m = (state.party || []).find(x=> x.uid === h) || (c && c.uid === h ? c : null);
  return !!(m && m.currentHp > 0);
}
function pruneBogs(){
  const b = ui.battle;
  if(!b) return false;
  let lifted = false;
  const onYou = getPStatus(0, 'bogged');
  if(onYou && onYou.by){
    onYou.by = onYou.by.filter(h=> bogHolderStanding('enemy', h));
    if(!onYou.by.length){ removePStatus(0, 'bogged'); lifted = true;
      setTimeout(()=> battleMsg(`🌫 The bog drains away with the Bog Lurker — your side moves freely again.`), 650); }
  }
  const onThem = b.fieldStatus && b.fieldStatus.bogged;
  if(onThem && onThem.by){
    onThem.by = onThem.by.filter(u=> bogHolderStanding('player', u));
    if(!onThem.by.length){ delete b.fieldStatus.bogged; lifted = true;
      setTimeout(()=> battleMsg(`🌫 Your Bog Lurker has fallen, and the bog drains away with him.`), 650); }
  }
  return lifted;
}
/* Everything a monster starts the battle with, the moment it takes the field. */
/* The always-on parts of a passive. Arriving under a ✦ Curse, a monster keeps
   only these — recorded but silent until the curse lifts — and no stance. */
const PASSIVE_TRAITS = ['evadeAlways','unsweepable','terrorize','thresholdSleep','thresholdStun','bog'];
function passiveTraitsOnly(p){
  const o = {};
  PASSIVE_TRAITS.forEach(k=>{ if(p[k] !== undefined) o[k] = p[k]; });
  return o;
}
/* Under the other side's dust: the traits, minus any evasion the dust would
   have swept (only an unsweepable one survives it). */
function dustProofTraits(p){
  const o = passiveTraitsOnly(p);
  if(!p.unsweepable) delete o.evadeAlways;
  return o;
}
function applyEntryPassives(holder, species, level, atk){
  const quiet = passivesMuted(holder);
  (MOVES[species]||[]).forEach(mv=>{
    const e = mv[6];
    if(!e || !e.passive) return;
    if((level||1) < mv[5]) return;
    applyPassiveGrant(holder, quiet ? passiveTraitsOnly(e.passive) : e.passive, atk);
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
            Psychic:'confusionField', Dragon:'dragonDance', Steel:'steelAegis',
            Fairy:'diamondDust' })[type] || type;
}
/* Psychic answers evasion by reading minds: the Squid's Abyssal Gaze (and
   Max) cannot be dodged, and nor can anything the Thunder Newt does while its
   own Tachypsychia runs. A hit that ignores evasion simply lands. */
function ignoresEvasion(mv, mon){
  if(mv && mv.mindRead) return true;
  const tac = ui.battle ? getPStatus(0,'tachy') : null;
  return !!(tac && mon && tac.owner === mon.uid);
}
function stanceEvasion(holder){
  if(holder && (holder.lurk || holder.cunning)) return 1;        // there is nothing there to hit
  let best = 0;
  if(isElusive(holder)) best = Math.max(best, ELUSIVE_DODGE);   // it is not trying to trade
  /* A passive's own dodge (Shadowed Wings) goes quiet under a ✦ Curse; any
     evasion something else has layered above it is a buff, and stays. */
  if(holder && holder.evadeAlways){
    const quiet = holder.passiveEvade && holder.evadeAlways <= holder.passiveEvade && passivesMuted(holder);
    if(!quiet) best = Math.max(best, holder.evadeAlways);
  }
  if(holder && holder.airborne  > 0) best = Math.max(best, STANCE_EVASION.airborne);
  if(holder && holder.invisible > 0) best = Math.max(best, STANCE_EVASION.invisible);
  if(holder && holder.evadeTurns > 0) best = Math.max(best, holder.evadeChance || 1.0);
  return best;
}
/* ============================================================
   LURK and CUNNING — a ghost's two ways of not being there
   ------------------------------------------------------------
   Lurk     100% evasion from the moment it is granted until the monster
            ATTEMPTS to deal damage. A miss, a muddled swing at its own side,
            a blow that passes through a Haunting Aria: every one ends it.
            Wind-ups, buffs and stone casts that deal no damage keep it.
   Cunning  100% evasion that starts once the monster has DEALT damage, and
            lasts until its next attempt.
   Both belong to the monster (they go with it through a swap) and come once
   per battle unless its passive says otherwise. The other side's Diamond Dust
   sweeps both away. A hit that never rolls evasion — Grudge, Vengeance, the
   Aria's apparition, Vengeful Wrath, a pre-hit, Conversio's strike, a
   mind-read — lands on a lurker and leaves the Lurk where it is.
   ============================================================ */
function concealSide(m){ return (m && m.uid) ? 'player' : 'enemy'; }
/* Lurk, once per battle — unless `again` (Stalk may raise it as often as it
   is cast). Never over the top of a Lurk already held. */
function grantLurk(m, again){
  if(!m || m.lurk) return false;
  if(m.lurkUsed && !again) return false;
  if(ui.battle && dustBlocks(concealSide(m))) return false;
  m.lurk = true;
  m.lurkUsed = (m.lurkUsed || 0) + 1;
  paintConcealment();
  return true;
}
/* The monster tries to deal damage, so whatever hid it is gone. The attack
   that ends a Lurk can be an ambush: the passive's bonus (Ambush) and the
   move's own (Pounce), multiplied. Returns that multiplier; the attack reads
   it back from `_ambush` and it is cleared once the attack is resolved. */
function breakCover(m, spendLurk){
  if(!m) return 1;
  const wasLurking = !!m.lurk;
  const was = !!(m.lurk || m.cunning);
  m.lurk = false; m.cunning = false;
  let mult = 1;
  if(wasLurking){
    const p = passiveOf(m);
    if(p && p.ambush) mult *= p.ambush;
    if(spendLurk) mult *= spendLurk;
  }
  m._ambush = mult > 1 ? mult : 0;
  if(was) paintConcealment();
  return mult;
}
/* It has just dealt damage: a Cunning passive may hide it until its next try.
   `first` is the chance on its first damaging attack of the battle, `after`
   on each one after that — so {first:1, after:0} is exactly once. */
function noteDealtDamage(m){
  if(!m || m.lurk || m.cunning) return false;
  const p = passiveOf(m);
  const c = p && p.cunning;
  if(!c) return false;
  const n = m.hitsDealt || 0;
  m.hitsDealt = n + 1;
  const chance = n === 0 ? (c.first != null ? c.first : 1) : (c.after || 0);
  if(!(Math.random() < chance)) return false;
  if(ui.battle && dustBlocks(concealSide(m))) return false;
  m.cunning = true;
  paintConcealment();
  return true;
}
/* A lurker is drawn see-through; a cunning one flickers. Painted from the
   monsters themselves, so a redraw can never lose it. */
function paintConcealment(){
  const b = ui.battle;
  if(!b) return;
  (b.enemies || []).forEach((e, i)=>{
    const el = document.getElementById('enemyBob-' + i);
    if(!el) return;
    el.classList.toggle('lurking', !!e.lurk && e.hp > 0);
    el.classList.toggle('cunning', !!e.cunning && !e.lurk && e.hp > 0);
  });
  playerField().forEach(me=>{
    const pb = document.getElementById(pid('playerBob', me));
    if(!pb) return;
    pb.classList.toggle('lurking', !!me.lurk);
    pb.classList.toggle('cunning', !!(me.cunning && !me.lurk));
  });
}
/* What an enemy slipping your blow looks like: the reason, not just "MISS". */
function dodgeWord(t){ return t && t.lurk ? 'LURKING' : (t && t.cunning ? 'CUNNING' : 'MISS'); }

/* How likely an enemy is to slip one of your blows: its own stance or
   concealment, and whatever its side has cast — a Mirage, clones, a
   Tachypsychia of its own. Independent sources stack the way yours do. */
function enemyEvasion(t){
  noteCertainDodge(t);
  const own = stanceEvasion(t);
  if(own >= 1) return 1;
  const src = [own];
  const mir = getESide('mirage');
  if(mir && mir.window && mir.step < mir.window.length) mir.tested = true;   // its window met a real blow
  if(mir) src.push((mir.window && mir.step < mir.window.length) ? mir.window[mir.step] : (mir.chance || 0.20));
  const cl = getESide('clones');
  if(cl) src.push(cl.evade || 0);
  const tac = getESide('tachy');
  if(tac && tac.owner === t && tac.fresh) tac.tested = true;             // its first-turn rate met a real blow
  if(tac && tac.owner === t) src.push(tac.fresh ? (tac.evadeFirst || 0) : (tac.evadeAfter || 0));
  let hit = 1;
  src.forEach(x=>{ if(x > 0) hit *= (1 - x); });
  return 1 - hit;
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
/* ============================================================
   STATUS OWNERSHIP — who benefits, by polarity
   ------------------------------------------------------------
   Every status is a BUFF or a DEBUFF. A buff belongs to the side that holds
   it; a debuff belongs to the side that put it there — the holder's opponent.
   Where the data happens to be stored does not matter. An explicit
   `by:'player'|'enemy'` (or the older `mine:true`, meaning yours) overrides
   the rule for the odd one out.

   The old table listed TYPES, so it could not tell a stun on you (theirs)
   from a stun on them (yours): your own Diamond Dust swept away the paralysis
   you had put on an enemy, and refused to let any more land. And a type
   missing from it defaulted to yours — which is how a Firehound's Fiery Jaws
   came to be held open by YOUR dust.

   Every type used anywhere must be listed. tools/sides-test.js checks.
   ============================================================ */
const STATUS_KIND = {
  /* buffs: the side holding them benefits */
  overheat:'buff', deepFreeze:'buff', frostArmour:'buff', overcharge:'buff',
  spikeArmour:'buff', mirage:'buff', counter:'buff', curseWard:'buff',
  confusionField:'buff', dragonDance:'buff', machDragon:'buff', steelAegis:'buff',
  diamondDust:'buff', aria:'buff', wrath:'buff', tachy:'buff', steelSoul:'buff',
  shell:'buff', clones:'buff', vita:'buff',
  /* debuffs: the side that put them there benefits */
  stunned:'debuff', paralysed:'debuff', softened:'debuff', charmed:'debuff',
  charm:'debuff', disrupt:'debuff', disruptField:'debuff', asleep:'debuff',
  discombobulate:'debuff', iceTomb:'debuff', iceTombSelf:'debuff', curse:'debuff',
  leechSeed:'debuff', dot:'debuff', jaws:'debuff', bogged:'debuff',
};
/* Fields: side-wide effects with a real duration, as opposed to a one-turn
   stun or a nap that is used up. A Diamond Dust holds its OWN side's fields
   open; one-shot debuffs are left to run out. */
const FIELD_TYPES = new Set(['leechSeed','curse','dot','charm','charmed','disrupt','disruptField',
  'confusionField','deepFreeze','frostArmour','bogged']);
function otherSide(side){ return side === 'enemy' ? 'player' : 'enemy'; }
function statusOwner(type, st, heldBy){
  if(st && st.by) return st.by;
  if(st && st.mine) return 'player';
  return STATUS_KIND[type] === 'debuff' ? otherSide(heldBy || 'player') : (heldBy || 'player');
}
/* heldBy defaults to the player's side: most callers are reading b.partyStatus. */
function isEnemyOwned(type, st, heldBy){ return statusOwner(type, st, heldBy || 'player') === 'enemy'; }

/* Enemy advantages held as plain fields rather than statuses.
   THE LINE: a thing with a duration or a consumable count is a temporary
   advantage and the dust sweeps it away. A thing with neither is what the
   creature IS — Lightning Cat, Hunter's Instinct, Bog Lurker — and stays.
   `thresholdsHit` is deliberately NOT here: it records which thresholds a
   Thunderhound has already spent, so clearing it would hand the stuns back.
   Everything here is something the monster GAINED during the fight —
   including Enrage, a state it worked itself into. The dust takes all of it.
   The same list is swept from YOUR monsters by an enemy's dust. */
const ENEMY_STANCE_FIELDS = ['guard','airborne','invisible','prep','counterStack','evadeTurns','blockStacks','comboStacks','enrageStacks','lurk','cunning'];

/* ============================================================
   THE ENEMY SIDE'S OWN STATUSES
   The mirror of b.partyStatus: side-wide effects the enemy has cast — an
   Overheat, a Mirage, a Diamond Dust — keyed by the same type names as yours.
   They outlast any one monster and carry into the next wave, exactly as yours
   do. Only enemy-owned buffs live here; what YOU put on them stays in
   b.fieldStatus and on each enemy.
   ============================================================ */
function enemySideStatuses(){
  if(!ui.battle) return {};
  return (ui.battle.enemyStatus = ui.battle.enemyStatus || {});
}
function getESide(type){ return ui.battle ? enemySideStatuses()[type] : undefined; }
function setESide(status){
  if(!ui.battle || !status) return null;
  if(dustBlocks('enemy')) return null;                // your dust keeps it from forming
  const st = Object.assign({ turnsLeft: STATUS_TURNS }, status, { by:'enemy' });
  enemySideStatuses()[status.type] = st;
  return st;
}
function removeESide(type){ if(ui.battle) delete enemySideStatuses()[type]; }

/* Whose Diamond Dust is in the air decides what may land. */
function playerDust(){ return ui.battle ? getPStatus(0,'diamondDust') : null; }
function enemyDust(){ return ui.battle ? getESide('diamondDust') : null; }
/* Would a new effect owned by `owner` be kept from landing right now? */
function dustBlocks(owner){ return owner === 'enemy' ? !!playerDust() : !!enemyDust(); }

/* ============================================================
   DIAMOND DUST'S SWEEP — in either side's hands
   `caster` is whose dust it is (yours unless told otherwise). Everything the
   OTHER side owns is taken away, wherever it is stored; the caster's own
   effects are left standing, and tickStatuses() holds them open while the
   dust lasts. Anything marked `unsweepable` (Bog Lurker's bog, a manta's
   evasion) is what a creature IS, and stays. Returns how many effects went.

   Deliberately NOT swept, on either side: a Cataclysm's charges and the Dragon
   Legacy they leave. Those were bought with written words, and failure should
   cost practice, never progress.
   ============================================================ */
function diamondDustCleanse(caster){
  const b = ui.battle;
  if(!b) return 0;
  const victim = otherSide(caster || 'player');
  let cleared = 0;

  /* 1. The player's side bag: your buffs, and what the enemy has put on you
        (a stun or a weaken belongs to whoever inflicted it, not whoever is
        carrying it). */
  const ps = partyStatuses();
  Object.keys(ps).forEach(k=>{
    const st = ps[k];
    if(st.unsweepable || statusOwner(k, st, 'player') !== victim) return;
    delete ps[k]; afterStatusGone(k, 'player'); cleared++;
  });
  /* …and what they have put on each of your monsters (2.83). */
  Object.values(b.monStatus || {}).forEach(list=>{
    list.slice().forEach(st=>{
      if(st.unsweepable || statusOwner(st.type, st, 'player') !== victim) return;
      list.splice(list.indexOf(st), 1); afterStatusGone(st.type, 'player'); cleared++;
    });
  });
  /* 2. Their side bag — only ever their own buffs. */
  if(victim === 'enemy'){
    const es = enemySideStatuses();
    Object.keys(es).forEach(k=>{
      if(es[k].unsweepable) return;
      delete es[k]; afterStatusGone(k, 'enemy'); cleared++;
    });
  }
  /* 3. What you have put on them: the fields, and each enemy's own list —
        where a buff it holds is theirs and a mark on it is yours. */
  if(victim === 'player' && b.fieldStatus){
    /* …but not what a creature IS: your Bog Lurker's bog stays, as theirs on
       you does under your dust (2.88 — theirs swept yours away). */
    Object.keys(b.fieldStatus).forEach(k=>{
      if(b.fieldStatus[k] && b.fieldStatus[k].unsweepable) return;
      delete b.fieldStatus[k]; cleared++;
    });
  }
  (b.enemies || []).forEach(e=>{
    eStatuses(e).slice().forEach(st=>{
      if(!st.unsweepable && statusOwner(st.type, st, 'enemy') === victim){ removeEStatus(e, st.type); cleared++; }
    });
  });
  /* 4. What each monster has gained during the fight. */
  const holders = victim === 'enemy' ? (b.enemies || []) : battleParty();
  holders.forEach(m=>{ cleared += sweepMonsterBuffs(m, victim); });
  if(victim === 'player'){
    if(partyCounters().length){ b.pCounter = []; cleared++; }
    if(b.pCombo){ b.pCombo = 0; cleared++; }
  }
  /* 5. Their queued upkeep strikes: an Overheat's burn, an Aftershock. */
  if(b.preHits && b.preHits.length){
    const keep = b.preHits.filter(p=> (p.by || 'player') !== victim);
    cleared += b.preHits.length - keep.length;
    b.preHits = keep;
  }
  setTimeout(refreshAllBlockBars, 0);
  return cleared;
}
/* One monster's gains, gone. Resets to ONE rather than zero where a figure
   multiplies — a swept takeMult of 0 would make the monster immortal rather
   than ordinary. The whales' own rage is left alone; that is what they are. */
function sweepMonsterBuffs(m, side){
  if(!m) return 0;
  let n = 0;
  ENEMY_STANCE_FIELDS.forEach(f=>{
    const v = m[f];
    if(Array.isArray(v) ? v.length : v){ m[f] = Array.isArray(v) ? [] : 0; n++; }
  });
  if(m.evadeAlways && !m.evadeUnsweepable){ m.evadeAlways = 0; n++; }
  if(m._stoop && m._stoop.charges){ m._stoop.charges = 0; n++; }          // the climb is lost
  if(m._rage && m._rage.forced){ m._rage.forced = false; n++; }           // a bought critical
  if(m._overpower && m._overpower.turnsLeft > 0){ m._overpower = null; n++; }
  if(m._windup){ m._windup = null; n++; }                                 // what it was winding up is lost
  if(m._omen){ m._omen = 0; n++; }
  if(side === 'enemy'){
    if(!m.enraged){
      if(m.dealMult && m.dealMult !== 1){ m.dealMult = 1; n++; }
      if(m.takeMult && m.takeMult !== 1){ m.takeMult = 1; n++; }
    }
    if(m.elusive){ m.elusive = false; m.gooed = true; n++; }              // pinned by the dust
    if(m._vita && m._vita.turnsLeft > 0){ m._vita = null; n++; }
  }
  return n;
}
/* A status that leaves — swept or run out — can leave something behind. */
function afterStatusGone(type, side){
  const b = ui.battle;
  if(!b) return;
  if(side === 'player'){
    if(type === 'clones') b.clones = null;
    if(type === 'jaws') b.noFlee = !!b.noFleeBase;       // it lets go
  }
  if(type === 'mirage') clearAfterimages();
  /* An Overheat's burn goes out with the Overheat, whoever holds it now. */
  if(type === 'overheat' && b.preHits) b.preHits = b.preHits.filter(p=> !(p.src === 'overheat' && (p.by || 'player') === side));
}

/* ============================================================
   NOVA'S PURGE (2.90) — the Phoenix's small Diamond Dust, either side's
   ------------------------------------------------------------
   A move's `purge:{ enemyBuffs:n, playerDebuffs:m }`: when it reaches them,
   n of the other side's buffs are swept away and m of the other side's
   marks on the caster's own side are burnt off. In their hands "enemy" and
   "player" swap round: one of YOUR buffs goes, and one of your marks on THEM.
   Each is picked at random from all there are, as Greed picks. What a
   creature simply IS (unsweepable — a bog, a manta's evasion) stays, as it
   does under Diamond Dust, and so do a Cataclysm's charges and the Dragon
   Legacy. No dust stops it: it is a sweep, as the dust's own is, not
   something taking hold. Returns a line for the battle message, or ''.
   ============================================================ */
function novaPurge(casterSide, purge){
  if(!ui.battle || !purge) return '';
  const victim = otherSide(casterSide || 'player');
  const pickOut = pool=>{ const x = pool[Math.floor(Math.random() * pool.length)]; x.take(); return x.label; };
  const swept = [], burnt = [];
  for(let k = 0; k < (purge.enemyBuffs || 0); k++){
    const pool = sweepableBuffs(victim);
    if(!pool.length) break;
    swept.push(pickOut(pool));
  }
  for(let k = 0; k < (purge.playerDebuffs || 0); k++){
    const pool = marksOnSide(casterSide || 'player');
    if(!pool.length) break;
    burnt.push(pickOut(pool));
  }
  if(!swept.length && !burnt.length) return '';
  setTimeout(refreshAllBlockBars, 0);
  const yours = (casterSide || 'player') === 'player';
  const a = swept.length ? `sweeps away ${yours ? 'their' : 'your'} ${swept.join(' and ')}` : '';
  const c = burnt.length ? `burns ${burnt.join(' and ')} off ${yours ? 'your side' : 'theirs'}` : '';
  return `🔥 The nova ${[a, c].filter(Boolean).join(', and ')}!`;
}
/* Everything `side` holds that a sweep could take, one entry each:
   [{ label, take() }]. Its side-wide buffs, its standing monsters' gains,
   its queued upkeep strikes — and, for yours, your Counter and combo. */
function sweepableBuffs(side){
  const b = ui.battle;
  if(!b) return [];
  const out = [];
  const label = k=> STATUS_LABELS[k] || k;
  if(side === 'player'){
    const ps = partyStatuses();
    Object.keys(ps).forEach(k=>{
      const st = ps[k];
      if(st.unsweepable || statusOwner(k, st, 'player') !== 'player') return;
      out.push({ label:label(k), take:()=>{ delete ps[k]; afterStatusGone(k, 'player'); } });
    });
    if(partyCounters().length) out.push({ label:'↩️ Counter', take:()=>{ b.pCounter = []; } });
    if(b.pCombo > 0) out.push({ label:`👊 Combo ×${b.pCombo}`, take:()=>{ b.pCombo = 0; } });
    livingField().forEach(m=> monGains(m, 'player').forEach(x=> out.push(x)));
  } else {
    const es = enemySideStatuses();
    Object.keys(es).forEach(k=>{
      if(es[k].unsweepable) return;
      out.push({ label:label(k), take:()=>{ delete es[k]; afterStatusGone(k, 'enemy'); } });
    });
    livingEnemies().forEach(e=>{
      eStatuses(e).slice().forEach(st=>{
        if(st.unsweepable || statusOwner(st.type, st, 'enemy') !== 'enemy') return;
        out.push({ label:label(st.type), take:()=> removeEStatus(e, st.type) });
      });
      monGains(e, 'enemy').forEach(x=> out.push(x));
    });
  }
  /* an Overheat's burn goes with its Overheat; the rest are buffs of their own */
  (b.preHits || []).forEach(p=>{
    if((p.by || 'player') !== side || p.src === 'overheat') return;
    const name = p.sacredFlame ? '🔥 Sacred Flame' : p.aftershock ? '💥 Aftershock' : (p.label || 'upkeep strike');
    out.push({ label:name, take:()=>{ b.preHits = (b.preHits || []).filter(x=> x !== p); } });
  });
  return out;
}
/* One monster's gains, one entry each — what sweepMonsterBuffs takes all at
   once (tools/v290-test.js holds the two lists together). */
function monGains(m, side){
  const out = [];
  if(!m) return out;
  const add = (label, take)=> out.push({ label, take });
  if(m.guard) add('🛡 Guard', ()=>{ m.guard = false; });
  if(m.airborne > 0) add('🕊 Airborne', ()=>{ m.airborne = 0; });
  if(m.invisible > 0) add('👤 Unseen', ()=>{ m.invisible = 0; });
  if(m.prep > 0) add(`🎯 Prep ×${m.prep}`, ()=>{ m.prep = 0; });
  if(m.evadeTurns > 0) add('🧘 Still', ()=>{ m.evadeTurns = 0; });
  if(m.blockStacks > 0) add(`🛡 Block ×${m.blockStacks}`, ()=>{ m.blockStacks = 0; });
  if(Array.isArray(m.counterStack) ? m.counterStack.length : m.counterStack)
    add('↩️ Counter', ()=>{ m.counterStack = Array.isArray(m.counterStack) ? [] : 0; });
  if(m.comboStacks > 0) add(`👊 Combo ×${m.comboStacks}`, ()=>{ m.comboStacks = 0; });
  if(m.enrageStacks > 0) add(`🔥 Enrage ×${m.enrageStacks}`, ()=>{ m.enrageStacks = 0; });
  if(m.lurk) add('🌑 Lurk', ()=>{ m.lurk = false; });
  if(m.cunning) add('🌘 Cunning', ()=>{ m.cunning = false; });
  if(m.evadeAlways && !m.evadeUnsweepable) add('💨 Evasion', ()=>{ m.evadeAlways = 0; });
  if(m._stoop && m._stoop.charges) add('🦅 Climb', ()=>{ m._stoop.charges = 0; });
  if(m._rage && m._rage.forced) add('😤 Rage', ()=>{ m._rage.forced = false; });
  if(m._overpower && m._overpower.turnsLeft > 0) add('💪 Overpower', ()=>{ m._overpower = null; });
  if(m._windup) add('⏳ Wind-up', ()=>{ m._windup = null; });
  if(m._omen) add('🌒 Ill Omen', ()=>{ m._omen = 0; });
  if(side === 'enemy'){
    if(!m.enraged){
      if(m.dealMult && m.dealMult !== 1) add('💢 Power', ()=>{ m.dealMult = 1; });
      if(m.takeMult && m.takeMult !== 1) add('🛡 Toughness', ()=>{ m.takeMult = 1; });
    }
    if(m.elusive) add('💨 Elusive', ()=>{ m.elusive = false; m.gooed = true; });
    if(m._vita && m._vita.turnsLeft > 0) add('🕊 Vita', ()=>{ m._vita = null; });
  }
  return out;
}
/* What the other side has put on `side`: its marks, one entry each. On yours,
   their fields on your side and each of your standing monsters' own marks;
   on theirs, your fields on them (one entry a field) and your marks on each. */
function marksOnSide(side){
  const b = ui.battle;
  if(!b) return [];
  const out = [];
  const label = k=> STATUS_LABELS[k] || k;
  if(side === 'player'){
    const ps = partyStatuses();
    Object.keys(ps).forEach(k=>{
      const st = ps[k];
      if(st.unsweepable || statusOwner(k, st, 'player') !== 'enemy') return;
      out.push({ label:label(k), take:()=>{ delete ps[k]; afterStatusGone(k, 'player'); } });
    });
    livingField().forEach(m=> monStatuses(m).slice().forEach(st=>{
      if(st.unsweepable || statusOwner(st.type, st, 'player') !== 'enemy') return;
      out.push({ label:label(st.type), take:()=>{
        const list = monStatuses(m), i = list.indexOf(st);
        if(i >= 0) list.splice(i, 1);
        afterStatusGone(st.type, 'player');
      } });
    }));
  } else {
    const fs = b.fieldStatus || {};
    Object.keys(fs).forEach(k=>{
      if(fs[k].unsweepable) return;
      out.push({ label:label(k), take:()=>{ delete fs[k]; (b.enemies || []).forEach(e=> removeEStatus(e, k)); } });
    });
    livingEnemies().forEach(e=> eStatuses(e).slice().forEach(st=>{
      if(st.unsweepable || fs[st.type] || statusOwner(st.type, st, 'enemy') !== 'player') return;
      out.push({ label:label(st.type), take:()=> removeEStatus(e, st.type) });
    }));
  }
  return out;
}

/* ============================================================
   GOBLIN'S GREED — a landed attack takes one of the other side's buffs
   ------------------------------------------------------------
   One at random: a side-wide status (their Overheat, your Diamond Dust) or
   something a monster it just hit was holding (block, a stance, a Lurk,
   Counter stacks). What is taken keeps its remaining turns and now works for
   the thief's side, re-homed to the thief where it belonged to one monster.
   Muted, like any passive, by a ✦ Curse. Under the other side's Diamond Dust
   the prize cannot take hold on the thief's side, and is simply scattered.
   Cuain's Haunting Aria and Gathering Wrath cannot be taken: the song and the
   grudge are him.
   ============================================================ */
const UNSTEALABLE = new Set(['aria','wrath']);
/* A status moving to the other side: `by` is recomputed there, and anything
   that belonged to one monster now belongs to the thief. */
function rehomeStatus(st, thief, toSide){
  const o = Object.assign({}, st);
  delete o.by; delete o.mine;
  if('owner' in o) o.owner = toSide === 'player' ? thief.uid : thief;
  if(o.type === 'mirage'){
    o.pending = 0;
    /* Your afterimages strike with whoever you have out front; theirs with
       the ATK their Mirage was cast at. A Mirage taken from you had none to
       carry, so its copies struck for nothing — they strike with the thief's. */
    if(toSide === 'enemy' && !(o.atk > 0)) o.atk = enemyAtk(thief);
  }
  return o;
}
/* A side status crossing over keeps what hangs off it: an Overheat's burn goes
   with it, still burning for the rounds it had left. */
function carryAcross(got, fromSide, toSide, burnLeft){
  if(got && got.type === 'overheat' && burnLeft > 0){
    const st = toSide === 'enemy' ? getESide('overheat') : getPStatus(0, 'overheat');
    if(st) layOverheatBurn(toSide, st, burnLeft);
  }
}
function stealableBuffs(victimSide, victims){
  const b = ui.battle;
  const out = [];
  /* Side-wide statuses. */
  if(victimSide === 'player'){
    const ps = partyStatuses();
    Object.keys(ps).forEach(k=>{
      const st = ps[k];
      if(STATUS_KIND[k] !== 'buff' || UNSTEALABLE.has(k) || st.unsweepable) return;
      if(statusOwner(k, st, 'player') !== 'player') return;
      out.push({ label:STATUS_LABELS[k] || k, take:()=>{
        const got = Object.assign({}, ps[k]);
        if(k === 'clones' && b.clones) Object.assign(got, { mult:b.clones.mult, evade:b.clones.evade, turnsLeft:b.clones.turnsLeft });
        const burnLeft = k === 'overheat' ? overheatBurnTurns('player') : 0;
        delete ps[k]; afterStatusGone(k, 'player');
        return (toSide, thief)=>{
          const ok = !!setESide(rehomeStatus(got, thief, toSide));
          if(ok) carryAcross(got, 'player', toSide, burnLeft);
          return ok;
        };
      }});
    });
  } else {
    const es = enemySideStatuses();
    Object.keys(es).forEach(k=>{
      const st = es[k];
      if(UNSTEALABLE.has(k) || st.unsweepable) return;
      out.push({ label:STATUS_LABELS[k] || k, take:()=>{
        const got = Object.assign({}, es[k]);
        const burnLeft = k === 'overheat' ? overheatBurnTurns('enemy') : 0;
        delete es[k]; afterStatusGone(k, 'enemy');
        return (toSide, thief)=>{
          const st2 = setPStatus(0, rehomeStatus(got, thief, toSide));
          if(st2 && k === 'clones') b.clones = { turnsLeft:got.turnsLeft, mult:got.mult || 0.5, evade:got.evade || 0, uid:thief.uid };
          if(st2) carryAcross(got, 'enemy', toSide, burnLeft);
          return !!st2;
        };
      }});
    });
  }
  /* What the monsters it hit were holding. On your side the counter stacks
     and the combo are the side's, not one monster's. */
  const seen = new Set();
  (victims || []).forEach(m=>{
    if(!m || seen.has(m)) return;
    seen.add(m);
    const moveField = (f, label)=> out.push({ label, take:()=>{
      const v = m[f]; m[f] = 0;
      return (toSide, thief)=>{ thief[f] = (thief[f] || 0) + v; return true; };
    }});
    if(m.blockStacks > 0) out.push({ label:`🛡 Block ×${m.blockStacks}`, take:()=>{
      const n = m.blockStacks, v = m.blockValue; m.blockStacks = 0;
      return (toSide, thief)=>{ grantBlock(thief, n, v); return true; };
    }});
    if(m.guard) out.push({ label:'🛡 Guard', take:()=>{ m.guard = false; return (s, thief)=>{ thief.guard = true; return true; }; } });
    if(m.airborne > 0)  moveField('airborne', '🕊 Airborne');
    if(m.invisible > 0) moveField('invisible', '👤 Unseen');
    if(m.prep > 0)      moveField('prep', `🎯 Prep ×${m.prep}`);
    if(m.evadeTurns > 0) out.push({ label:'🧘 Still', take:()=>{
      const n = m.evadeTurns, c = m.evadeChance; m.evadeTurns = 0;
      return (s, thief)=>{ thief.evadeTurns = (thief.evadeTurns || 0) + n; thief.evadeChance = c || 1; return true; };
    }});
    if(m.lurk) out.push({ label:'🌑 Lurk', take:()=>{ m.lurk = false; return (s, thief)=>{ thief.lurk = true; return true; }; } });
    if(m.cunning) out.push({ label:'🌘 Cunning', take:()=>{ m.cunning = false; return (s, thief)=>{ thief.cunning = true; return true; }; } });
    if(m.enrageStacks > 0) moveField('enrageStacks', `🔥 Enrage ×${m.enrageStacks}`);
    if(m._overpower && m._overpower.turnsLeft > 0) out.push({ label:'💪 Overpower', take:()=>{
      const o = m._overpower; m._overpower = null;
      return (s, thief)=>{ thief._overpower = o; return true; };
    }});
    if(victimSide === 'enemy'){
      if(counterCountOf(m)) out.push({ label:`↩️ Counter ×${counterCountOf(m)}`, take:()=>{
        const list = m.counterStack.splice(0);
        return (s, thief)=>{ list.forEach(c=> addCounterStack(thief, c.tier, 1)); return true; };
      }});
      if(m.comboStacks > 0) out.push({ label:`👊 Combo ×${m.comboStacks}`, take:()=>{
        const n = m.comboStacks; m.comboStacks = 0;
        return (s)=>{ b.pCombo = (b.pCombo || 0) + n; return true; };
      }});
    }
  });
  if(victimSide === 'player'){
    if(partyCounters().length) out.push({ label:`↩️ Counter ×${partyCounters().length}`, take:()=>{
      const list = b.pCounter.splice(0);
      return (s, thief)=>{ list.forEach(c=> addCounterStack(thief, c.tier, 1)); return true; };
    }});
    if(b.pCombo > 0) out.push({ label:`👊 Combo ×${b.pCombo}`, take:()=>{
      const n = b.pCombo; b.pCombo = 0;
      return (s, thief)=>{ thief.comboStacks = (thief.comboStacks || 0) + n; return true; };
    }});
  }
  return out;
}
/* The thief's side is `thiefSide`; `victims` are the monsters it just hit.
   Returns a line for the battle message, or '' if nothing was taken. */
function greedSteal(thiefSide, thief, victims){
  const p = passiveOf(thief);
  if(!p || !p.greed || !ui.battle) return '';
  const pool = stealableBuffs(otherSide(thiefSide), victims);
  if(!pool.length) return '';
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const give = pick.take();
  const who = thiefSide === 'player' ? displayName(thief) : SPECIES[thief.species].name;
  /* Taking the other side's dust clears the way for the thief's own. */
  const kept = dustBlocks(thiefSide) ? false : give(thiefSide, thief);
  renderStatusBadges(); paintConcealment(); setTimeout(refreshAllBlockBars, 0);
  const whose = thiefSide === 'player' ? 'their' : 'your';
  return kept ? `🪙 ${who}'s Greed — it snatches ${whose} ${pick.label}!`
              : `🪙 ${who}'s Greed snatches ${whose} ${pick.label} — and the diamond dust scatters it.`;
}

/* Prevention: while your Diamond Dust is up, an effect the ENEMY owns never
   lands on your side. Kept for the call sites that name a type. */
function enemyStatusBlocked(type){
  return dustBlocks(statusOwner(type, null, 'player'));
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
  if(m && m.lurk)         out.push('<span class="status-pill mine">🌑 Lurk</span>');
  if(m && m.cunning)      out.push('<span class="status-pill mine">🌘 Cunning</span>');
  if(m && m._windup)      out.push(`<span class="status-pill mine">⏳ ${escapeHtml(m._windup)}</span>`);
  if(m && m._omen)        out.push('<span class="status-pill mine">🐦‍⬛ Ill Omen</span>');
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
/* ------------------------------------------------------------
   WHOSE STACKS ARE THEY?
   A braced guard and the swing that follows it belong to the SIDE, not to the
   animal holding them — swap out and your counter and combo come with you.
   Enrage does not: that is a monster working itself up, and it stays with the
   monster that earned it.

   Enemies keep their own, because a wave stands on the field all at once;
   there is no bench to carry anything to.
   ------------------------------------------------------------ */
function isOurs(holder){
  if(!holder || !holder.uid) return false;
  const sp = ui.battle && ui.battle.coreSpar;               // a spar's borrowed companion (2.87)
  if(sp && sp.companion && sp.companion.uid === holder.uid) return true;
  return (state.party || []).some(m => m.uid === holder.uid)
      || (state.storage || []).some(m => m.uid === holder.uid);
}
function partyCounters(){
  const b = ui.battle;
  if(!b) return [];
  if(!Array.isArray(b.pCounter)) b.pCounter = [];
  return b.pCounter;
}
function counterList(holder){
  if(!holder) return [];
  if(isOurs(holder)) return partyCounters();      // shared across the bench
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
  /* the combo travels with the side; the enrage stays with the animal */
  if(isOurs(mon)) ui.battle.pCombo = (ui.battle.pCombo||0) + 1;
  else            mon.comboStacks = (mon.comboStacks||0) + 1;
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
  { const i = ui.battle ? ui.battle.enemies.indexOf(e) : -1;           // the same GUARD you see on yours
    if(i >= 0) floatMiss('enemy-' + i, 'GUARD'); }
  e.comboStacks = (e.comboStacks||0) + 1;
  if(st.enrage) e.enrageStacks = (e.enrageStacks||0) + 1;
  renderStatusBadges();
  battleMsg(`🛡 ${SPECIES[e.species].name} takes it on the guard — <b>80% turned away!</b> Its next blow will be heavier.`);
  return 1 - COUNTER_REDUCTION;
}
/* Combo: additive, spent by the next attack. */
function comboMultiplier(mon){
  const c = getPStatus(0,'counter');
  const n = (mon && isOurs(mon)) ? ((ui.battle && ui.battle.pCombo) || 0)
                                 : ((mon && mon.comboStacks) || 0);
  if(!n) return 1;
  return 1 + n * ((c && c.combo) || 0.25);
}
function clearCombo(mon){
  if(!mon) return;
  if(isOurs(mon)){ if(ui.battle) ui.battle.pCombo = 0; }
  else mon.comboStacks = 0;
}
/* Enrage: permanent for the battle, a share of BASE attack, additive. */
function enrageBonus(mon){
  const c = getPStatus(0,'counter');
  const n = (mon && mon.enrageStacks) || 0;
  if(!n) return 0;
  return Math.round(n * ((c && c.enrage) || 0.20) * rawMonAtk(mon));
}
function paintEnrage(mon){
  const el = document.getElementById(pid('playerBob', mon));
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
function spawnAfterimages(n, hostEl){
  const host = hostEl || document.getElementById(pid('playerBob'));
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
    const t = soulGuardian('enemy') || foes[Math.floor(Math.random()*foes.length)];   // their Steel Soul draws it (2.90)
    const idx = ui.battle.enemies.indexOf(t);
    if(rollDodge(t, idx, 0, false, true)){               // a lurker is not there to be struck
      battleMsg(`👥 An afterimage strikes — and finds nothing.`);
      return setTimeout(step, 620);
    }
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
   creature IS, so no sweep removes it. Theirs softens your blows; yours, on
   your field (leader or companion), softens theirs (2.87). The strongest one
   standing counts; they do not stack.                                      */
function playerTerrorizeFactor(){
  if(!ui.battle) return 1;
  let worst = 1;
  livingField().forEach(m=>{
    const p = passiveOf(m);
    const t = passivesMuted(m) ? 0 : ((p && p.terrorize) || (m._terrorize || 0));
    if(t) worst = Math.min(worst, 1 - t);
  });
  return worst;
}
function terrorizeFactor(defenderSideMon){
  const b = ui.battle;
  if(!b) return 1;
  let worst = 1;
  (b.enemies || []).forEach(e=>{
    if(e.hp <= 0) return;
    const p = passiveOf(e);
    const t = passivesMuted(e) ? 0 : ((p && p.terrorize) || (e._terrorize || 0));
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
      /* Mach Dragon is a TEAM status on their side too, running its turns. */
      if(d.mach) setESide({ type:'machDragon', turnsLeft:T + 1, tier:d.mach });
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
    case 'Fairy': {
      /* Diamond Dust in enemy hands: everything of yours is swept away, and
         nothing new of yours takes hold while it lasts. */
      const n = diamondDustCleanse('enemy');
      setESide({ type:'diamondDust', turnsLeft:T + 1 });
      if(n) setTimeout(()=> battleMsg(`💎 Their diamond dust sweeps ${n} of your effects away.`), 900);
      break; }
    case 'Water': {
      /* Ice Tomb in enemy hands freezes YOU rather than them — every one of
         yours on the field. */
      livingField().forEach(pm=> withFocus(pm, ()=> setPStatus(0, { type:'asleep', turnsLeft:(d.freeze || 2) + 1 })));
      break;
    }
    default: return;
  }
  renderStatusBadges();
  setTimeout(()=> battleMsg(`💎 ${SPECIES[e.species].name} carries <b>${escapeHtml(d.name)}</b>.`), 500);
}

/* ============================================================
   ENEMY VERY-HIGH CASTS — the whole triangle, in their hands
   ------------------------------------------------------------
   A trainer's monster given `veryHigh:{type, plus, cast:true}` in its wave
   carries the stone the way you do: its passive (Diamond Dust's sweep,
   Dragon Dance's Mach Dragon, Steel Aegis's block) works the moment it takes
   the field, and on its first action it CASTS the stone — instantly, as yours
   is, so it still attacks. Every effect is the mirror of yours and side-wide,
   stored in b.enemyStatus (or, for their fields on you, in b.partyStatus), so
   your Diamond Dust sweeps it, theirs holds it open, and a Goblin can steal
   it. Without `cast`, a stone is carried as before (Jax's Region 4 six): in
   effect from entry, on the carrier alone.
   ============================================================ */
function castEnemyVeryHigh(e, type, plus){
  const d = veryHighDef(type, plus||0);
  if(!d || !e) return '';
  const T = d.turns || STATUS_TURNS;
  const atk = enemyAtk(e);
  const who = SPECIES[e.species].name;
  switch(type){
    case 'Fire':
      setESide({ type:'overheat', turnsLeft:T + 1, deal:d.deal, take:d.take, burn:d.burn || 0, atk });
      layOverheatBurn('enemy', { burn:d.burn || 0, atk }, T);
      return `🔥 ${who} casts <b>Overheat</b>: their side deals ${d.deal}× and takes ${d.take}×${d.burn ? ', and the air will scorch you every turn' : ''}.`;
    case 'Water': {
      /* Freeze counts YOUR turns: if you have already acted this round, one
         more round, so you always lose as many as the stone says. */
      const lr = ui.battle ? leaderRow() : null;
      const acted = !!(lr && lr.acted);
      const n = d.freeze || 2;
      setESide({ type:'deepFreeze', turnsLeft:n + (acted ? 1 : 0), taken:(d.taken == null ? 1 : d.taken), noDust:true });
      if(d.frost){ setESide({ type:'frostArmour', turnsLeft:d.frost, max:d.frost, slow:d.slow || 0, owner:e }); grantBlock(e, 1, atk); }
      return `🧊 ${who} casts <b>Ice Tomb</b>: your side is frozen solid for ${n} turn${n > 1 ? 's' : ''}!`;
    }
    case 'Grass':
      setPStatus(0, { type:'leechSeed', turnsLeft:T + 1, heal:d.heal, bite:d.bite || 0, biteHeals:!!d.biteHeals, by:'enemy' });
      return `🌿 ${who} casts <b>Leech Seed</b> on your side: every blow they land on you feeds their whole team.`;
    case 'Electric':
      setESide({ type:'overcharge', turnsLeft:T + 1, chance:d.after, firstChance:d.first, fresh:true });
      return `⚡ ${who} casts <b>Overcharge</b>: their attacks may strike twice.`;
    case 'Ground':
      setESide({ type:'spikeArmour', turnsLeft:T + 1, reduce:d.reduce, thorns:d.thorns });
      return `🛡️ ${who} casts <b>Spike Armour</b>: they take ${Math.round(d.reduce*100)}% less, and each one you hit pricks you back.`;
    case 'Flying':
      setESide({ type:'mirage', turnsLeft:T + 1, window:(d.window || [1]).slice(), step:0, chance:d.after,
                 images:d.images || 0, imageDmg:d.imageDmg || 0, init:d.init || 0, owner:e, pending:0, atk });
      return `✨ ${who} casts <b>Mirage</b>: their side cannot be touched this turn, and is hard to hit after.`;
    case 'Physical': {
      const tier = plus || 0;
      if(!dustBlocks('enemy')) addCounterStack(e, tier, d.stacks || 1);
      setESide({ type:'counter', turnsLeft:STATUS_TURNS + 1, tier, regain:d.regain || 0.10, combo:d.combo || 0.25, enrage:d.enrage || 0, owner:e });
      return `↩️ ${who} casts <b>Counter</b>: braced to take your next blow on the guard.`;
    }
    case 'Ghost':
      setPStatus(0, { type:'curse', turnsLeft:T + 1, extra:d.extra, mute:!!d.mute, by:'enemy' });
      if(d.reduce) setESide({ type:'curseWard', turnsLeft:T + 1, reduce:d.reduce });
      return `👻 ${who} casts <b>Curse</b>: your side takes ${Math.round(d.extra*100)}% more damage${d.mute ? ', and your passives fall silent' : ''}.`;
    case 'Psychic':
      setESide({ type:'confusionField', turnsLeft:T, after:d.confuseAfter || 0.20, ffPower:d.ffPower || 0.60,
                 sleep:d.sleep || 0, sleepTurns:d.sleepTurns || 1, sure:true, sureUsed:false });
      livingField().forEach(pm=> withFocus(pm, ()=> markPlayerConfused(d.ffPower || 0.60, true)));
      return `🌀 ${who} casts <b>Discombobulate</b>: your head is spinning!`;
    case 'Dragon':
      setESide({ type:'dragonDance', turnsLeft:T + 1, deal:d.deal });
      if(d.mach) setESide({ type:'machDragon', turnsLeft:T + 1, tier:d.mach });
      return `🐉 ${who} casts <b>Dragon Dance</b>: their side deals ${d.deal}×${d.mach ? ' and moves first' : ''}.`;
    case 'Steel':
      setESide({ type:'steelAegis', turnsLeft:T + 1, reduce:d.reduce, regenRolls:d.regenRolls || 0, owner:e });
      if(d.block && !dustBlocks('enemy')) grantBlock(e, d.block, atk);
      return `🛡 ${who} casts <b>Steel Aegis</b>: their side takes ${Math.round(d.reduce*100)}% less.`;
    case 'Fairy': {
      const n = diamondDustCleanse('enemy');
      setESide({ type:'diamondDust', turnsLeft:T + 1, owner:e });
      let msg = `💎 ${who} casts <b>Diamond Dust</b>${n ? `: ${n} of your effect${n === 1 ? '' : 's'} swept away` : ''}.`;
      /* Refined, it borrows from the rest of the triangle: + one at random at
         + strength, ✦ two different ones at ✦ strength. */
      const count = (d.borrowPick || 0) + (d.borrowRandom || 0);
      const picked = [];
      for(let k = 0; k < count; k++){
        const pool = BORROW_GRID.filter(t=> !picked.includes(t));
        const t = pool[Math.floor(Math.random() * pool.length)];
        if(!t) break;
        picked.push(t);
        const m2 = castEnemyVeryHigh(e, t, d.borrowTier || 0);
        if(m2) msg += ' ' + m2;
      }
      return msg;
    }
  }
  return '';
}
/* An Ultra stone in enemy hands (the arena's opponent): your barrage, turned
   round — its refinement's hit count (5–7, 6–8, 7–9, rolled 45/35/20 as yours
   is) and its power per strike, every strike through your block. */
function enemyUltraMove(type, plus){
  const p = Math.max(0, Math.min(2, plus || 0));
  const t = ULTRA_TIERS[p];
  const r = Math.random();
  const n = r < 0.45 ? t.min : (r < 0.80 ? t.min + 1 : t.max);
  return ['UltraStone', stoneName(type, 'ultra') + UPGRADE_MARKS[p], t.mult, 'MultiHit', 0, 0, { hits:n }];
}
/* A carrier's passive on taking the field, the mirror of applyStonePassives:
   refined Diamond Dust sweeps, refined Dragon Dance lays Mach Dragon, refined
   Steel Aegis stands its block. Once per carrier per battle. */
function enemyStonePassive(e){
  const st = e && e.stone;
  if(!st || st.passiveDone) return;
  st.passiveDone = true;
  const d = veryHighDef(st.type, st.plus || 0);
  if(!d || !d.passive) return;
  const who = SPECIES[e.species].name;
  if(d.passiveOnly === 'mach'){
    setESide({ type:'machDragon', turnsLeft:(d.turns || 5) + 1, tier:d.mach });
    return setTimeout(()=> battleMsg(`🐉 ${who}'s ${escapeHtml(d.name)}: their side moves first.`), 700);
  }
  if(d.passiveBlock){
    if(!dustBlocks('enemy')) grantBlock(e, d.passiveBlock, e.atk);
    return setTimeout(()=> battleMsg(`🛡 ${who} arrives with ${d.passiveBlock} block already standing.`), 700);
  }
  if(st.type === 'Fairy'){
    const n = diamondDustCleanse('enemy');
    setESide({ type:'diamondDust', turnsLeft:(d.turns || 5) + 1, owner:e });
    return setTimeout(()=> battleMsg(`💎 ${who}'s Diamond Dust is already in the air${n ? `: ${n} of your effects swept away` : ''}.`), 700);
  }
}
/* Their Discombobulate on YOU: your next damaging move turns on yourself.
   `fresh` keeps a muddle cast mid-round alive until your own turn comes. */
function markPlayerConfused(ffPower, fresh){
  setPStatus(0, { type:'discombobulate', turnsLeft:2, ffPower:ffPower || 0.60, by:'enemy', fresh:!!fresh });
}
/* Their side's own damage buffs, for hits that do not go through the damage
   formula (their burn, their afterimages). */
function enemyBuffMultiplier(){
  let m = 1;
  const oh = getESide('overheat'); if(oh) m *= (oh.deal || 1.5);
  const dd = getESide('dragonDance'); if(dd) m *= (dd.deal || 1.25);
  return m;
}
/* Their Mirage: every blow of yours one of them slips leaves copies behind,
   and at the end of the round each copy strikes whoever you have out front. */
function noteEnemyMirageDodge(t, idx){
  const m = getESide('mirage');
  if(!m || !m.images) return;
  /* Once per enemy per action of yours — as yours leaves copies once for each
     attack of theirs it slips, however many strikes that attack carried. A
     barrage used to leave copies for every strike dodged. */
  const b = ui.battle, seq = (b && b.actionSeq) || 0;
  if(b){
    if(!b._mirageLeft || b._mirageLeft.seq !== seq) b._mirageLeft = { seq, who:new Set() };
    if(b._mirageLeft.who.has(t)) return;
    b._mirageLeft.who.add(t);
  }
  m.pending = (m.pending || 0) + m.images;
  spawnAfterimages(m.images, document.getElementById('enemyBob-' + idx));
}
function resolveEnemyAfterimages(done){
  const m = getESide('mirage');
  if(!m || !(m.pending > 0)) return done();
  const n = m.pending; m.pending = 0;
  if(!livingField().length || !livingEnemies().length){ clearAfterimages(); return done(); }
  const per = Math.ceil((m.imageDmg || 0.2) * (m.atk || 0) * enemyBuffMultiplier());
  let k = 0;
  const step = ()=>{
    /* each copy goes for one of yours at random, as yours go for one of them
       — or, your Steel Soul up, for the one that cast it (2.90) */
    const mine = livingField();
    const me = soulGuardian('player') || (mine.length > 1 ? mine[Math.floor(Math.random() * mine.length)] : mine[0]);
    if(k >= n || !me){ setFocus(null); clearAfterimages(); return setTimeout(done, 300); }
    setFocus(me);
    k++;
    if(Math.random() < playerEvasionFrom(null)){
      floatMiss(pid('playerBob'), dodgeWord(me)); dodgePlayer();
      battleMsg(`👥 One of their afterimages strikes — and finds nothing.`);
      return setTimeout(step, 620);
    }
    const before = me.currentHp;
    const through = applyBlock(me, per, pid('playerBlk'));
    me.currentHp = Math.max(0, me.currentHp - through);
    flashHit(document.getElementById(pid('playerBob')));
    drainHp(pid('playerHp'), before, me.currentHp, monMaxHp(me));
    showDamageNumber(pid('playerBob'), before - me.currentHp);
    floatBlocked(pid('playerBob'), per - through);
    battleMsg(`👥 One of their afterimages steps out of nowhere and strikes!`);
    setTimeout(step, 620);
  };
  step();
}
/* How likely your monster out front is to slip a blow of theirs: its own
   stance or concealment, your Mirage, your clones, Tachypsychia, a Scorching
   Ash on the attacker. `e` may be null for a blow with no attacker. */
/* Tachypsychia's extra actions: at most this many a round, on either side
   (theirs always had the cap; yours has it from 2.80). */
const TACHY_MAX_EXTRAS = 3;
/* `peek` (a monster of yours): only asking — an enemy weighing up which of
   your pair to go for — so nothing is marked as having met a blow. */
function playerEvasionFrom(e, peek){
  const mon = peek || activeMon();
  if(!mon) return 0;
  if(!peek) noteCertainDodge(mon);
  const own = stanceEvasion(mon);
  if(own >= 1) return 1;
  const mir = getPStatus(0,'mirage');
  if(!peek && mir && mir.window && mir.step < mir.window.length) mir.tested = true;   // its window met a real blow
  const cl  = getPStatus(0,'clones');
  /* Tachypsychia hides its caster only — as theirs does (2.80). */
  const tacAny = getPStatus(0,'tachy');
  const tac = (tacAny && tacAny.owner === mon.uid) ? tacAny : null;
  if(!peek && tac && tac.fresh) tac.tested = true;                         // its first-turn rate met a real blow
  const dotMiss = e ? getEStatus(e,'dot') : null;
  const src = [
    own,
    mir ? ((mir.window && mir.step < mir.window.length) ? mir.window[mir.step] : (mir.chance || 0.20)) : 0,
    cl ? (cl.evade || 0) : 0,
    (dotMiss && dotMiss.rider === 'miss') ? (dotMiss.miss || 0) : 0,
    tac ? (tac.fresh ? tac.evadeFirst : tac.evadeAfter) : 0,
  ];
  let hit = 1;
  src.forEach(x=>{ if(x > 0) hit *= (1 - x); });
  return 1 - hit;
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

/* ============================================================
   REVITALISE — Moth's Ultimate
   One fainted teammate back on its feet at a tenth of its health. Who comes
   back is chosen BEFORE the writing (chooseRevival, 05-battle-flow.js), so
   ten right words are never spent on nobody. This list is the one rule for
   who counts: fighters only (passengers never faint), not the caster, and
   never a Caladrius the marks have taken.
   ============================================================ */
function revivableFallen(caster){
  return battleParty().filter(m=> m.currentHp <= 0 && m !== caster && !morsBlocksRevival(m));
}

/* Vita: an immediate pulse, then a field that tends whoever is worst off. */
/* Everyone of yours a heal can reach: the party, and a companion out on the
   field (2.84 — it is outside the revivals, not the healing). */
function healableAllies(){
  const c = companionOnField();
  return c ? battleParty().concat([c]) : battleParty();
}
function castVita(mon, def){
  const heal = Math.ceil((def.pulse || 0.2) * monMaxHp(mon));
  let touched = 0;
  healableAllies().forEach(m=>{
    if(m.currentHp <= 0) return;
    const before = m.currentHp;
    m.currentHp = Math.min(monMaxHp(m), m.currentHp + heal);
    if(m.currentHp > before) touched++;
    if(playerField().includes(m)) drainHp(pid('playerHp', m), before, m.currentHp, monMaxHp(m));
  });
  /* The field never stacks — casting again simply sets the clock back to five. */
  const stays = !!setPStatus(0, { type:'vita', turnsLeft:(def.turns||5) + 1, pulse:def.pulse||0.2, owner:mon.uid });
  renderStatusBadges();
  battleMsg(`🕊 Vita — <b>${heal} HP</b> to everyone still standing` +
    (stays ? `, and the light stays behind.` : `, but their diamond dust will not let the light stay.`));
  return touched;
}
/* Each upkeep it tends the single monster in the worst shape, by proportion. */
function vitaPulse(done){
  const v = getPStatus(0,'vita');
  if(!v) return enemyVitaPulse(done);
  const party = healableAllies().filter(m=>m.currentHp > 0 && m.currentHp < monMaxHp(m));
  if(!party.length) return done();
  party.sort((a,b)=> (a.currentHp/monMaxHp(a)) - (b.currentHp/monMaxHp(b)));
  const t = party[0];
  const owner = state.party.concat(state.storage).find(m=>m.uid === v.owner);
  const heal = Math.ceil((v.pulse||0.2) * (owner ? monMaxHp(owner) : monMaxHp(t)));
  const before = t.currentHp;
  t.currentHp = Math.min(monMaxHp(t), t.currentHp + heal);
  if(playerField().includes(t)) drainHp(pid('playerHp', t), before, t.currentHp, monMaxHp(t));
  battleMsg(`🕊 The light finds ${displayName(t)} — <b>+${t.currentHp - before} HP</b>.`);
  setTimeout(()=> enemyVitaPulse(done), 700);
}
/* Their side's Vita (a stolen one): the same light, tending their worst-off,
   measured by the health of whoever holds it now. */
function enemyVitaPulse(done){
  const v = getESide('vita');
  if(!v) return done();
  const hurt = livingEnemies().filter(x=> x.hp < x.maxHp).sort((a, c)=> a.hp / a.maxHp - c.hp / c.maxHp);
  if(!hurt.length) return done();
  const t = hurt[0], idx = ui.battle.enemies.indexOf(t), before = t.hp;
  const owner = (v.owner && v.owner.maxHp) ? v.owner : t;
  t.hp = Math.min(t.maxHp, t.hp + Math.ceil((v.pulse || 0.2) * owner.maxHp));
  drainHp('enemyHp-' + idx, before, t.hp, t.maxHp);
  battleMsg(`🕊 Their light finds ${SPECIES[t.species].name} — <b>+${t.hp - before} HP</b>.`);
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
  /* Five rolls, one in the pre-action phase of each of the next five rounds —
     the same phase as Overheat's burn, so it happens whether the last round
     ended with the enemy's attacks or with a wave you knocked out. Stored with
     the usual +1 so the cast round is not counted; ariaRetaliate() ends it
     straight after the fifth roll, and the badge shows the rolls to come. */
  setPStatus(0, {
    type:'aria', turnsLeft:(def.turns||5) + 1,
    pulse:def.pulse || 0.5, chance:(def.chance == null ? 0.5 : def.chance),
    atk: monAtk(mon), owner: mon.uid,
    fieldEvade: 1,                 // one turn of total evasion, for ANYONE on the field —
    coverUsed: !!byReflex,         // spent only in a round an attack actually passed through (2.74)
    struck: !!byReflex,            // the attack that woke him counts: vengeance is owed
  });
  renderStatusBadges();
  battleMsg(byReflex
    ? `Attacks pass harmlessly through the ghostly whalelord. Prepare for vengeance.`
    : `Ominous whalesong fills the air.`);
  return true;
}
/* The turn of untouchability belongs to the FIELD, so a monster swapping in
   during it inherits the protection. It is only used up by a round in which an
   attack actually passed through it: a round when nobody attacked your side
   (all frozen, asleep, or the song came after their turns) keeps it (2.74).
   `noteAriaCover()` marks the round; endRound spends it. */
function ariaFieldEvasion(){
  const a = ariaState();
  return (a && a.fieldEvade > 0) ? 1 : 0;
}
function noteAriaCover(){ const a = ariaState(); if(a && a.fieldEvade > 0) a.coverUsed = true; }
/* The passive: struck while the Aria is not running, it sings by reflex and the
   blow misses. Costs no turn and no words. */
function ariaReflex(mon){
  if(ariaActive()) return false;
  const mv = (MOVES[mon.species]||[]).find(m=>m[6] && m[6].aria);
  if(!mv) return false;
  return castAria(mon, mv[6].aria, true);
}
/* The pre-action phase (called from beginRound, beside Overheat's burn):
   every round the Aria lasts, his apparition may strike every enemy — a coin
   flip, or certain if any enemy attacked your side since the last roll (an
   attack that passed straight through still counts). After the fifth roll the
   Aria has ended. */
function ariaRetaliate(done){
  const a = ariaState();
  if(!a) return done();
  const provoked = !!a.struck;
  a.struck = false;
  const last = a.turnsLeft <= 1;
  const finish = ()=>{
    if(last && ariaState() === a){ removePStatus(0, 'aria'); renderStatusBadges(); }
    done();
  };
  const chance = provoked ? 1 : (a.chance == null ? 0.5 : a.chance);
  if(Math.random() >= chance) return finish();
  const foes = livingEnemies();
  if(!foes.length) return finish();
  const dmg = Math.ceil((a.pulse || 0.5) * a.atk * ownBuffMultiplier());
  const hits = foes.map(t=>({ t, idx:ui.battle.enemies.indexOf(t), dmg,
                              oldHp:t.hp, newHp:Math.max(0, t.hp - dmg) }));
  battleMsg(`The Whalelord's vengeful apparition strikes!`);
  ariaApparition(a, ()=>{ applyHits(hits, { noLeech:true }); reportHits(hits); })
    .then(()=> setTimeout(finish, 350));
}

/* ---- The apparition, drawn ----
   The screen inverts; his ghost — the same art as his own sprite, crowned or
   not — fades in to 30% while drifting up from below-right of whoever is out
   front, and settles directly to their right after exactly 1 s. Half a second
   later it rushes the enemy side (top right), the hits land as it arrives,
   and the colours come back. ARIA_FX_SPEED scales every step (tests only). */
let ARIA_FX_SPEED = 1;
let ariaFxMarks = [];                 // [phase, ms] — what happened when, for the tests
function ariaFxCss(){
  if(document.getElementById('ariaFxCss')) return;
  const st = document.createElement('style');
  st.id = 'ariaFxCss';
  st.textContent = `
    .aria-invert{position:fixed;inset:0;z-index:9990;pointer-events:none;opacity:0;
      -webkit-backdrop-filter:invert(1);backdrop-filter:invert(1);}
    .aria-ghost{position:fixed;left:0;top:0;z-index:9991;pointer-events:none;opacity:0;will-change:transform,opacity;}
    .aria-ghost img,.aria-ghost .mon-portrait{box-shadow:none !important;background:transparent !important;
      border-radius:0 !important;filter:none !important;visibility:visible !important;}
    .aria-ghost .crown-fizz{display:none !important;}
  `;
  document.head.appendChild(st);
}
function ariaApparition(a, onImpact){
  ariaFxCss();
  ariaFxMarks = [];
  const t0 = performance.now();
  const mark = p => ariaFxMarks.push([p, Math.round(performance.now() - t0)]);
  const ms = n => n * ARIA_FX_SPEED;
  const wait = n => new Promise(r=> setTimeout(r, ms(n)));
  const owner = (state.party || []).find(m=> m.uid === a.owner);
  const species = owner ? owner.species : 'whalelord';
  const px = playerSpriteSize();

  const inv = document.createElement('div');
  inv.className = 'aria-invert';
  document.body.appendChild(inv);
  const g = document.createElement('div');
  g.className = 'aria-ghost';
  g.innerHTML = monPortrait(species, px, { view:'back', bare:true,
    crowned: owner ? isCrowned(owner) : false, stage: owner ? monStage(owner) : 0 });
  g.querySelectorAll('.crowned-aura').forEach(el=> el.classList.remove('crowned-aura'));
  document.body.appendChild(g);

  /* Where: directly right of whoever is out front, level with them. */
  const fighter = document.getElementById(pid('playerBob'));
  const r = fighter ? fighter.getBoundingClientRect()
                    : { left: innerWidth * 0.1, top: innerHeight * 0.55, width: px, height: px };
  const endX = r.left + r.width, endY = r.top + (r.height - px) / 2;
  const startX = endX, startY = endY + px * 0.7;                      // straight below: it floats directly up
  /* Where to: up to the enemy row, and to the right — onto the rightmost enemy,
     and always at least half a sprite rightward, so it reads as a rush to the
     top right on a narrow phone too (where the enemies' middle can sit left
     of where the ghost waits). */
  const foes = [...document.querySelectorAll('[id^="enemy-"]')].filter(el=> /^enemy-\d+$/.test(el.id))
    .map(el=> el.getBoundingClientRect()).filter(q=> q.width > 0);
  const right = foes.length ? Math.max(...foes.map(q=> q.left + q.width / 2)) - px / 2 : innerWidth - px;
  const tx = Math.min(innerWidth - px * 0.6, Math.max(right, endX + px * 0.5));
  const ty = foes.length ? foes.reduce((s, q)=> s + q.top + q.height / 2, 0) / foes.length - px / 2 : 0;
  const at = (x, y, sc)=> `translate(${Math.round(x)}px,${Math.round(y)}px) scale(${sc || 1})`;

  return (async ()=>{
    mark('invert');
    inv.animate([{ opacity:0 }, { opacity:1 }], { duration: ms(150), fill:'forwards' });
    await wait(150);
    mark('rise');
    g.animate([{ transform: at(startX, startY), opacity:0 }, { transform: at(endX, endY), opacity:0.3 }],
              { duration: ms(1000), easing:'ease-out', fill:'forwards' });
    await wait(1000);
    mark('arrived');
    await wait(500);
    mark('rush');
    g.animate([{ transform: at(endX, endY), opacity:0.3 }, { transform: at(tx, ty, 1.25), opacity:0.3 }],
              { duration: ms(280), easing:'ease-in', fill:'forwards' });
    await wait(280);
    mark('impact');
    if(onImpact) onImpact();
    g.animate([{ opacity:0.3 }, { opacity:0 }], { duration: ms(180), fill:'forwards' });
    await wait(450);
    inv.animate([{ opacity:1 }, { opacity:0 }], { duration: ms(180), fill:'forwards' });
    await wait(180);
    inv.remove(); g.remove();
    mark('restored');
  })();
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
  battleMsg(`<b>VENGEFUL WRATH</b> — ${n} grudge${n>1?'s':''} come due!`);
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
  /* Grudge skips computeDamage, so a weaken has to be applied here — without
     it, afterPlayerAttack used the weaken up on a Grudge it never touched. */
  const soft = ui.battle ? getPStatus(0,'softened') : null;
  return Math.ceil(((def.flat || 0.25) * monAtk(mon) + (def.missing || 0.75) * missing)
                   * ownBuffMultiplier() * (soft ? 1 - (soft.amount || 0.5) : 1));
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
   One of each, ever (2.77): twelve for the twelve types, and four TRIANGLE
   stones that fit any monster of their triangle's three types — sixteen in
   all. Most are found in the story or won in its hardest fights.
   A stone is carried by one monster at a time, and a monster carries one
   stone. Carried, it gives 1.5× experience; past 100 it is also what a
   monster charges at a ceiling to break through (06-progress.js). The charge
   lives ON THE STONE: move the stone and the charge goes with it.
   Adding a stone means one row here and nothing else.
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
  /* the four very rare ones: one per triangle (names are placeholders) */
  { id:'starterStone',  name:'Starter Stone',  icon:'starter_stone',  emoji:'🔺', triangle:'starter', types:TRIANGLES.starter },
  { id:'skyStone',      name:'Sky Stone',      icon:'sky_stone',      emoji:'🌩', triangle:'sky',     types:TRIANGLES.sky },
  { id:'mindStone',     name:'Mind Stone',     icon:'mind_stone',     emoji:'🌀', triangle:'mind',    types:TRIANGLES.mind },
  { id:'fantasyStone',  name:'Fantasy Stone',  icon:'fantasy_stone',  emoji:'💫', triangle:'fantasy', types:TRIANGLES.fantasy },
].map(s=>{
  s.types = (s.types || [s.type]).slice();
  s.typeText = s.types.length > 1 ? s.types.slice(0, -1).join(', ') + ' or ' + s.types[s.types.length - 1] : s.types[0];
  return Object.assign(s, { xp:1.5, blurb:`A ${s.typeText} monster carrying it learns half again as fast.` });
});
/* Held or not. (2.76 counted them and sold more; runProfileMigrations
   settles any save from then, so a stray count reads as "held".) */
function stoneCount(id){
  const v = state && state.inventory ? state.inventory[id] : 0;
  return (v === true || Number(v) > 0) ? 1 : 0;
}
function ownsStone(id){ return stoneCount(id) > 0; }
function totalStones(){ return ELEMENTAL_STONES.reduce((n, st)=> n + stoneCount(st.id), 0); }
/* Give (n > 0) or take (n < 0) a stone. Taken, it comes off whoever carried it
   — and keeps its charge, should it ever come back. */
function addStone(id, n){
  if((n == null ? 1 : n) > 0) state.inventory[id] = 1;
  else { state.inventory[id] = 0; state.inventory[stoneOnKey(id)] = null; }
  return stoneCount(id);
}
function heldStones(){ return ELEMENTAL_STONES.filter(s=> ownsStone(s.id)); }
function stoneOnKey(id){ return id + 'On'; }
function stoneHolder(id){ return ownsStone(id) ? (state.inventory[stoneOnKey(id)] || null) : null; }
function stoneDef(id){ return ELEMENTAL_STONES.find(st=> st.id === id) || null; }
function stoneFits(st, m){
  const t = (m && SPECIES[m.species] && SPECIES[m.species].types) || [];
  return st.types.some(x=> t.includes(x));
}
function stoneCarriedBy(m){ return m ? (ELEMENTAL_STONES.find(st=> stoneHolder(st.id) === m.uid) || null) : null; }
/* One stone, one monster: whoever had this stone lets go of it, and whatever
   the monster carried comes off. */
function attachStone(id, m){
  ELEMENTAL_STONES.forEach(st=>{ if(stoneHolder(st.id) === m.uid) state.inventory[stoneOnKey(st.id)] = null; });
  state.inventory[stoneOnKey(id)] = m.uid;
}
function detachStone(id){ state.inventory[stoneOnKey(id)] = null; }
/* The breakthrough charge a stone holds, in fights. It stays with the stone. */
function stoneCharge(id){ return Math.max(0, Number(state.inventory[id + 'Charge']) || 0); }
function setStoneCharge(id, n){ state.inventory[id + 'Charge'] = Math.max(0, n); }
/* The multiplier for one monster, from the stone it carries. */
function stoneXpBonus(m){
  const s = stoneCarriedBy(m);
  return s ? s.xp : 1;
}
/* Every stone that fits a monster, and the one to show first: the stone it
   carries, then one you hold, then simply the first that fits. */
function stonesFor(m){ return ELEMENTAL_STONES.filter(st=> stoneFits(st, m)); }
function stoneFor(m){
  const matches = stonesFor(m);
  return matches.find(st=> stoneHolder(st.id) === m.uid)
      || matches.find(st=> ownsStone(st.id))
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
/* Overheat ✦'s burn belongs to whichever side holds the Overheat. It is laid
   when the stone is cast (replacing any burn that side already had — a second
   Overheat does not light a second fire), and laid again on the thief's side
   when a Greed takes the Overheat across: the stolen burn keeps its heat and
   its remaining turns, and now scorches the side it used to warm. Yours
   scorches every one of them; theirs scorches whoever you have out front. */
function layOverheatBurn(side, st, turns){
  const b = ui.battle;
  if(!b || !st || !(st.burn > 0) || !(turns > 0) || dustBlocks(side)) return;
  b.preHits = (b.preHits || []).filter(p=> !(p.src === 'overheat' && (p.by || 'player') === side));
  addPreHit(side === 'enemy'
    ? { label:`🔥 The air itself scorches you!`,  pct:st.burn, atk:st.atk || 0, turnsLeft:turns, by:'enemy', src:'overheat' }
    : { label:`🔥 The air itself scorches them!`, pct:st.burn, atk:st.atk || 0, turnsLeft:turns, aoe:true, src:'overheat' });
}
/* How many more rounds a side's Overheat burn has to run (0: none). */
function overheatBurnTurns(side){
  const p = ((ui.battle && ui.battle.preHits) || []).find(x=> x.src === 'overheat' && (x.by || 'player') === side);
  return p ? p.turnsLeft : 0;
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
    /* Theirs strike every one of yours on the field, as yours strike every one
       of them: no evasion, as yours take none, but a block layer eats it as one
       of theirs would eat yours. */
    if(p.by === 'enemy'){
      const mine = livingField();
      if(!mine.length) return step();
      let dmg = Math.ceil(p.pct * p.atk * enemyBuffMultiplier());
      const curP = getPStatus(0,'curse');
      if(curP && isEnemyOwned('curse', curP)) dmg = Math.ceil(dmg * (1 + (curP.extra != null ? curP.extra : 0.25)));
      mine.forEach(me=>{
        const before = me.currentHp;
        const through = applyBlock(me, dmg, pid('playerBlk', me));
        me.currentHp = Math.max(0, me.currentHp - through);
        flashHit(document.getElementById(pid('playerBob', me)));
        drainHp(pid('playerHp', me), before, me.currentHp, monMaxHp(me));
        showDamageNumber(pid('playerBob', me), before - me.currentHp);
        floatBlocked(pid('playerBob', me), dmg - through);
      });
      battleMsg(p.label);
      return setTimeout(step, 850);
    }
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
   QUICK ATTACKS (2.73)
   A passive `quick: 0.25` — the Boxer's Quick Hands, the Kicker's Quick Feet,
   the Spinner's Quick Spin — gives its monster one free hit in the opening
   phase of EVERY round: after the pre-hits and the Aria's roll, before anyone
   chooses a move. One target at random, for `quick` × its ATK through the
   usual damage formula (type, buffs, armour, curse). Either side: yours out
   front strikes a random enemy; each of theirs strikes whoever you have out
   front.
   It is a free strike, like an afterimage: evasion has its say (a lurker is
   not there; the Aria's field lets it pass through — and hears it, so the
   apparition's next roll is certain; the Whalelord struck with no Aria
   running sings by reflex), and one block stack soaks it — but it never meets
   a Counter guard, leaves no Mirage copies, feeds no Leech Seed, sets off no
   Greed or Cunning and draws no riposte. A monster that could not act this
   round (frozen, asleep, stunned, fleeing) does not strike, and a ✦ Curse
   silences the passive.
   ============================================================ */
function quickOf(m){ const p = m ? passiveOf(m) : null; return (p && p.quick) || 0; }
function canQuickStrike(side, m){
  if(!m) return false;
  if(side === 'player'){
    if(!(m.currentHp > 0)) return false;
    return !(getESide('deepFreeze') || getMStatus(m,'asleep') || getMStatus(m,'stunned'));
  }
  if(!(m.hp > 0) || (m.isDummy && !m.arenaActs)) return false;
  if(getPStatus(0,'deepFreeze') || getEStatus(m,'iceTomb') || getEStatus(m,'paralysed') || getEStatus(m,'asleep')) return false;
  return !isElusive(m);
}
function runQuickAttacks(done){
  const b = ui.battle;
  if(!b) return done();
  const queue = [];
  livingField().forEach(me=>{ if(quickOf(me) > 0) queue.push({ side:'player', m:me }); });
  livingEnemies().forEach(e=>{ if(quickOf(e) > 0) queue.push({ side:'enemy', m:e }); });
  if(!queue.length) return done();
  let i = 0;
  const step = ()=>{
    if(!ui.battle) return;
    if(i >= queue.length || !livingEnemies().length){ setFocus(null); return done(); }
    const q = queue[i++];
    if(!canQuickStrike(q.side, q.m)) return step();
    if(q.side === 'player'){
      if(!livingField().includes(q.m)) return step();          // gone from the field since
      setFocus(q.m);
      return quickStrikeTheirs(q.m, ()=> setTimeout(step, 450));
    }
    /* theirs: at whichever of yours it would go for (a wild one at random) —
       nobody standing, and the rest wait for the next one */
    const target = enemyPickTarget(q.m, null);
    if(!target) return step();
    setFocus(target);
    quickStrikeYours(q.m, target, ()=> setTimeout(step, 450));
  };
  step();
}
/* Yours, on one of them at random. */
function quickStrikeTheirs(mon, done){
  const b = ui.battle;
  const foes = livingEnemies();
  const t = soulGuardian('enemy') || foes[Math.floor(Math.random() * foes.length)];   // their Steel Soul draws it (2.90)
  const idx = b.enemies.indexOf(t);
  const name = displayName(mon);
  if(mon.lurk || mon.cunning){ breakCover(mon); mon._ambush = 0; renderStatusBadges(); }
  bob(document.getElementById(pid('playerBob')), +1);
  if(rollDodge(t, idx, 200, false, true)){
    battleMsg(`⚡ ${name}'s quick attack finds nothing.`);
    return setTimeout(done, 650);
  }
  const ref = Object.assign(monRef(mon), { _ambush:0, _omen:0 });   // an ambush or omen waits for a real blow
  const dmg = computeDamage(quickOf(mon), monAtk(mon), ref, t, true);
  const hits = [{ t, idx, dmg, oldHp:t.hp, newHp:Math.max(0, t.hp - dmg) }];
  battleMsg(`⚡ Quick attack! ${name} darts in before anyone moves.`);
  setTimeout(()=>{ applyHits(hits, { noLeech:true }); reportHits(hits); setTimeout(done, 400); }, 250);
}
/* Theirs, on whoever you have out front. */
function quickStrikeYours(e, mon, done){
  const b = ui.battle;
  const idx = b.enemies.indexOf(e), name = SPECIES[e.species].name;
  if(e.lurk || e.cunning){ breakCover(e); e._ambush = 0; renderStatusBadges(); }
  { const ar = ariaState(); if(ar) ar.struck = true; }       // an attack on your side, all the same
  bob(document.getElementById('enemyBob-' + idx), -1);
  const ariaCover = ariaFieldEvasion() > 0;
  const canReflex = !ariaCover && !ariaActive() && (MOVES[mon.species] || []).some(m=> m[6] && m[6].aria);
  if(ariaCover || (canReflex && ariaReflex(mon))){
    noteAriaCover();
    dodgePlayer(); floatMiss(pid('playerBob'), 'MISS');
    if(ariaCover) battleMsg(`⚡ ${name}'s quick attack passes harmlessly through.`);
    return setTimeout(done, 700);
  }
  if(Math.random() < playerEvasionFrom(e)){
    dodgePlayer(); floatMiss(pid('playerBob'), dodgeWord(mon));
    battleMsg(`⚡ ${name}'s quick attack finds nothing.`);
    return setTimeout(done, 650);
  }
  const omen = e._omen, amb = e._ambush;
  e._omen = 0; e._ambush = 0;                                 // kept for its real blow
  const dmg = computeDamage(quickOf(e), enemyAtk(e), e, monRef(mon), false);
  e._omen = omen; e._ambush = amb;
  const before = mon.currentHp;
  const through = applyBlock(mon, dmg, pid('playerBlk'));
  mon.lastDamageTaken = dmg;                                  // a reflection returns the full figure
  mon.currentHp = Math.max(b.allyUnkillable ? 1 : 0, mon.currentHp - through);
  if(b.arenaImmortal && mon.currentHp <= 0) mon.currentHp = monMaxHp(mon);
  flashHit(document.getElementById(pid('playerBob')));
  drainHp(pid('playerHp'), before, mon.currentHp, monMaxHp(mon));
  showDamageNumber(pid('playerBob'), before - mon.currentHp);
  floatBlocked(pid('playerBob'), dmg - through);
  playSfx('hit_taken');
  battleMsg(`⚡ Quick attack! ${name} darts in before anyone moves.`);
  setTimeout(done, 650);
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
function dodgePlayer(){   dodgeDrift(document.getElementById(pid('playerBob'))); }
/* A counter is a dodge followed by a strike back. */
function counterDrift(el, attackEl){
  dodgeDrift(el);
  setTimeout(()=>{
    if(!attackEl) return;
    attackEl.classList.add('counter-lunge');
    setTimeout(()=> attackEl.classList.remove('counter-lunge'), 420);
  }, 320);
}
function floatMiss(anchorId, text, cls, at){
  const host = document.getElementById(anchorId);
  const layer = document.getElementById('fxLayer') || document.getElementById('screen');
  if(!host || !layer) return;
  const hb = host.getBoundingClientRect(), lb = layer.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'miss-pop' + (cls ? ' ' + cls : '');
  el.textContent = text || 'MISS';
  el.style.left = (hb.left - lb.left + hb.width/2) + 'px';
  el.style.top  = (hb.top  - lb.top  + hb.height*(at || 0.3)) + 'px';
  layer.appendChild(el);
  setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 1200);
}
/* What a block soaked, floating in the block's own blue under the damage. */
function floatBlocked(anchorId, n){
  if(n > 0) floatMiss(anchorId, `🛡 ${n}`, 'blk-pop', 0.52);
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
  healableAllies().forEach(m=>{                    // a companion out on the field too (2.84)
    if(m.currentHp<=0) return;
    const before = m.currentHp, max = monMaxHp(m);
    m.currentHp = Math.min(max, m.currentHp + amount);
    if(playerField().includes(m)) drainHp(pid('playerHp', m), before, m.currentHp, max);
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
  playerField().forEach(m=> refreshBlockBar(pid('playerBlk', m), m));
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
/* ============================================================
   CURSE ✦ — MUTED PASSIVES
   Diamond Dust strips what the enemy HAS: statuses, stances, block. A refined
   Curse silences what the enemy IS: while a ✦ curse is on the field, enemy
   passives do nothing. The always-on ones — first strike, Shadowed Wings'
   dodge, Terrorize, Hunter's Instinct, Nocturne — go quiet and come back when
   the curse lifts. A passive that fires on entry (Iron Shell, Guard, Soar…)
   does not fire for anything arriving while it holds. Stances already raised
   are buffs, and buffs are Diamond Dust's business. Enemies only: your own
   side's passives are never muted.
   ============================================================ */
function passivesMuted(holder){
  const b = ui.battle;
  if(!b || !holder) return false;
  if(b.enemies && b.enemies.includes(holder)){
    const c = b.fieldStatus && b.fieldStatus.curse;
    return !!(c && c.mute);
  }
  /* Their ✦ Curse on your side silences yours the same way. */
  if(holder.uid){
    const c = getPStatus(0,'curse');
    return !!(c && c.mute && isEnemyOwned('curse', c));
  }
  return false;
}
/* The passive a monster HAS, working or not — for pills and announcements. */
function passiveDefOf(e){
  const list = MOVES[e.species] || [];
  const mv = list.find(m => m[3] === 'Passive' && m[6] && m[6].passive && (e.level||1) >= m[5]);
  return mv ? { name: mv[1], ...mv[6].passive } : null;
}
/* The passive that is WORKING. Every behaviour reads this one, so a passive
   added later is muted without having to be named here. */
function passiveOf(e){ return passivesMuted(e) ? null : passiveDefOf(e); }
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
  const ddE = !!getESide('dragonDance') || livingEnemies().some(e=>getEStatus(e,'dragonDance'));
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
   1. UPKEEP      pre-hits, Diamond Dust; passives are already in place;
                  then every quick attack (a passive: one free hit each)
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
/* Mirage's turn of total evasion (the window) moves on only after a round in
   which an attack on its side actually rolled against it — a round when nobody
   attacked them, or every blow was a mind-read or met a Lurk first, keeps it
   (2.74; it used to lapse at the end of the round it was cast in, whatever
   happened). Checked as each round begins, so the END phase's afterimages
   belong to the round they struck in. */
function advanceMirageWindows(){
  [getPStatus(0,'mirage'), getESide('mirage')].forEach(m=>{
    if(!m) return;
    if(m.tested && m.window && m.step < m.window.length) m.step++;
    m.tested = false;
  });
  /* The same for Tachypsychia's first-turn dodge (80%) and a Stillness (every
     attack misses): spent by a round in which an attack actually met them, not
     by the clock (2.75). */
  [getPStatus(0,'tachy'), getESide('tachy')].forEach(t=>{
    if(!t) return;
    if(t.tested) t.fresh = false;
    t.tested = false;
  });
  [...playerField(), ...livingEnemies()].forEach(m=>{
    if(!m) return;
    if(m.evadeTurns > 0 && certainDodge(m) && m._stillTested) m.evadeTurns--;
    m._stillTested = false;
  });
}
/* A turn of evasion that cannot miss (Stillness) waits for an attack; a
   chancy one (Ill Omen's 66%) still lasts its turn by the clock. */
function certainDodge(m){ return (m.evadeChance == null ? 1 : m.evadeChance) >= 1; }
/* An attack is rolling against this monster: a Stillness it holds has met it —
   unless a Lurk or Cunning means there was nothing there to meet. */
function noteCertainDodge(m){
  if(m && m.evadeTurns > 0 && certainDodge(m) && !(m.lurk || m.cunning)) m._stillTested = true;
}
function beginRound(msg){
  const b = ui.battle;
  if(!b) return;
  advanceMirageWindows();
  b.roundMsg = msg || null;
  b.phase = 'resolving';
  renderBattle();

  setFocus(null);
  /* Frost Armour: another layer each turn it lasts — on theirs as on yours, and
     on every monster of yours on the field. */
  if(getPStatus(0,'frostArmour')){ livingField().forEach(m=> frostArmourLayer(m)); renderStatusBadges(); }
  const faE = getESide('frostArmour');
  if(faE){
    const holder = (faE.owner && faE.owner.hp > 0) ? faE.owner : livingEnemies()[0];
    if(holder){ grantBlock(holder, 1, holder.atk); renderStatusBadges();
      setTimeout(()=> battleMsg(`❄️ Their Frost Armour — a layer of ice closes over ${SPECIES[holder.species].name}.`), 400); }
  }
  discombobulatePulse();                       // and who is muddled this round
  /* The pre-action phase: Overheat's burn and the other pre-hits, then the
     Haunting Aria's roll — here, not at the end of the round, so it still
     comes when the last round ended with a wave knocked out — Vita's light,
     and last the quick attacks (2.73). */
  runPreHits(()=> ariaRetaliate(()=> vitaPulse(()=> runQuickAttacks(()=>{
    if(!ui.battle) return;
    if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
    /* Their burn (or their afterimages last round) can fell whoever you have
       out front before anyone acts: send the next one out, THEN build the
       order, so the newcomer takes this round's turn and nothing is skipped. */
    const order = ()=>{ b.order = buildInitiativeOrder(); b.orderStep = 0; runTurnStep(); };
    /* Their companion's first call (2.87) comes as the first round opens, so
       it is on the field before anyone moves — his first turn, whoever is
       quicker. Later calls come on his own actions (enemyActs). */
    const go = ()=>{
      const fp = foePair();
      if(fp && !fp.summons && foeCanSummon(fp.leader)){
        const said = foeSummon();
        renderBattle();
        if(said) battleMsg(said);
        return setTimeout(order, 1300);
      }
      order();
    };
    const fallen = ()=>{
      /* A companion that fell in the upkeep leaves the field — the phoenix
         may rise first — and then the leader is looked at. */
      const c = companionOnField();
      if(c && c.currentHp <= 0){
        if(rebirthDue(c)) return offerRebirth(fallen, ()=>{ companionFalls(c); fallen(); }, c);
        companionFalls(c);
      }
      if(sideDefeated()) return onPlayerDefeated();
      const l = leaderMon();
      if(l && l.currentHp <= 0 && !standingIn()) return replaceFallenThen(go);
      if(l && l.currentHp <= 0) noteStandIn();
      go();
    };
    /* the phoenix may rise again first (Rebirth) */
    const lead = leaderMon();
    if(lead && lead.currentHp <= 0 && rebirthDue(lead)) return offerRebirth(fallen, fallen, lead);
    fallen();
  }))));
}
/* Nobody of yours is left standing: no party member, and no companion
   standing in for one. */
function sideDefeated(){ return !battleParty().some(m=> m.currentHp > 0) && !standingIn(); }
/* The monster out front fell outside anyone's turn: choose the next one, run
   its entry passives, then carry on. */
function replaceFallenThen(next){
  const fallen = leaderMon();
  const c = chargeState();
  if(c && fallen && c.uid === fallen.uid) triggerDragonLegacy();
  battleMsg(`${displayName(fallen)} fainted!`);
  const options = state.party.map((m,i)=>({m,i})).filter(o=>o.m.currentHp>0 && !isPassenger(o.m));
  if(!options.length) return onPlayerDefeated();
  monsterChooser('Send out…', options, (i)=>{
    ui.battle.activeIndex = i; ui.battle.switchedThisTurn = false;
    setFocus(null);
    const nm = state.party[i];
    if(nm && !nm._entered){ nm._entered = true; applyEntryPassives(nm, nm.species, nm.level, monAtk(nm)); }
    pairSwitched(fallen);               // its companion comes back out, if it was out
    renderBattle();
    next();
  }, false);
}

/* Mach Dragon is a TEAM status however it arrived — laid by hand or laid for
   free by the passive. It runs its five turns and does not care who is standing
   on the field when it does. */
function machTier(side){
  const st = (side === 'player')
    ? getPStatus(0,'machDragon')
    : (getESide('machDragon') || livingEnemies().map(e=>getEStatus(e,'machDragon')).find(Boolean));
  return st ? (st.tier || 1) : 0;
}
/* The move an enemy will use this round, decided NOW so that a move which
   always strikes first (Swift Strike, Grave Charge) can take the initiative.
   A 'random' monster's pick is rolled here and kept for its turn. */
function plannedMove(e){
  if(!e) return null;
  if(e.ai === 'maxer') return (MOVES[e.species]||[]).find(m=> m[0]==='Max' && e.level >= m[5]) || e.move;
  if(e.ai === 'random'){
    if(!e._planned){
      const avail = (MOVES[e.species]||[]).filter(m=> m[1] != null && e.level >= m[5] && m[2] != null);
      e._planned = avail.length ? avail[Math.floor(Math.random()*avail.length)] : e.move;
    }
    return e._planned;
  }
  return e.move;
}
function initiativeOf(side, mon){
  let v = 0;
  const b = ui.battle;
  const p = passiveOf(mon);
  if(p && p.first) v += 1;                                   // Lightning Cat, either side
  /* "In an enemy's hands this always strikes first." The per-monster order
     had quietly dropped it: Swift Strike and its cousins stopped leading. */
  if(side === 'enemy'){
    const pm = plannedMove(mon);
    if(pm && pm[6] && pm[6].first) v += 1;
  }
  if(side === 'player'){
    const mir = getPStatus(0,'mirage');
    if(mir && mir.init && mir.owner === mon.uid) v += mir.init;   // the mirage moves first
  }
  if(side === 'enemy'){
    if(b && (b.alwaysFirst || b.figlio)) v += 1;
    if(mon.arenaFirst) v += 1;
    if(getEStatus(mon,'disrupt')) v -= 1;                    // your jamming slows it
    const fa = getPStatus(0,'frostArmour');
    if(fa && fa.slow) v -= fa.slow;                          // ✦ Frost Armour: the cold slows them
    const mirE = getESide('mirage');
    if(mirE && mirE.init && mirE.owner === mon) v += mirE.init;   // their mirage moves first
    if(b && b.fieldStatus && b.fieldStatus.bogged) v -= 1;   // your Bog Lurker's bog
  } else {
    if(getPStatus(0,'disrupt')) v -= 1;                      // their jamming slows you
    const faE = getESide('frostArmour');
    if(faE && faE.slow) v -= faE.slow;                       // their ✦ Frost Armour slows you
    if(getPStatus(0,'bogged')) v -= 1;                       // their Bog Lurker's bog
  }
  return v;
}

/* Each monster of yours on the field has its own place in the order (2.84):
   the leader, and a companion that is out. Ties go to the leader — it is on
   the left — so the companion leads only on an initiative of its own. */
function playerRow(m){
  const lead = m === leaderMon();
  return { side:'player', mon:m, idx: lead ? -2 : -1, role: lead ? 'leader' : 'companion',
           tier:machTier('player'), value:initiativeOf('player', m) };
}
function orderCompare(a, c){
  if(c.tier !== a.tier) return c.tier - a.tier;
  if(c.value !== a.value) return c.value - a.value;
  if(a.side !== c.side) return a.side === 'player' ? -1 : 1;
  return a.idx - c.idx;
}
function buildInitiativeOrder(){
  pruneBogs();                                   // a fallen Bog Lurker's bog slows nobody
  const b = ui.battle;
  /* A fresh round: nobody of yours has acted yet. */
  b.roundActed = []; b.control = null;
  const rows = [];
  livingField().forEach(m=> rows.push(playerRow(m)));
  livingEnemies().forEach(e=>{
    rows.push({ side:'enemy', mon:e, idx:ui.battle.enemies.indexOf(e),
                tier:machTier('enemy'), value:initiativeOf('enemy', e) });
  });
  rows.sort(orderCompare);
  return rows;
}
/* The leader's own row this round (a companion's may come first). */
function leaderRow(){
  const b = ui.battle;
  return ((b && b.order) || []).find(r=> r.side === 'player' && r.role !== 'companion') || null;
}

function runTurnStep(){
  const b = ui.battle;
  if(!b || !b.order) return;
  if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
  noteFoeStandIn();
  if(sideDefeated()){
    const f = leaderMon();
    if(rebirthDue(f)) return offerRebirth(()=> runTurnStep(), ()=> onPlayerDefeated(), f);
    return onPlayerDefeated();
  }

  while(b.orderStep < b.order.length){
    const row = b.order[b.orderStep];
    /* one of yours must still be standing ON the field: a companion that fell
       or went back into its core, or a pair switched off, has lost its place */
    const alive = row.side === 'player'
      ? (row.mon && row.mon.currentHp > 0 && playerField().includes(row.mon))
      : (row.mon && row.mon.hp > 0 && b.enemies.includes(row.mon));   // (theirs: not gone back into a core)
    if(!alive || row.acted){ b.orderStep++; continue; }
    row.acted = true;
    if(row.side === 'player') return beginPlayerRow(row);
    b.phase = 'resolving';
    setFocus(null);
    renderBattle();
    return setTimeout(()=> runSingleEnemyTurn(row.mon), 600);
  }
  return endRound();
}
function advanceTurn(){
  const b = ui.battle;
  if(!b) return;
  settleControl();
  b.orderStep = (b.orderStep || 0) + 1;
  b.roundMsg = null;
  runTurnStep();
}
/* One of your monsters' places in the order has come: the leader's, or a
   companion's (2.85: each chooses its own move at its own place). One that
   has already had its action this round passes. */
function beginPlayerRow(row){
  const b = ui.battle;
  const mon = row.mon;
  setFocus(mon === leaderMon() ? null : mon);
  b.control = null;
  b.roundActed = b.roundActed || [];
  if(b.roundActed.includes(mon.uid)) return advanceTurn();
  return beginPlayerPhase(b.roundMsg || 'Choose a move.', mon);
}
/* Someone of yours has taken its action this round. */
function markActed(m){
  const b = ui.battle;
  if(!b || !m) return;
  b.roundActed = b.roundActed || [];
  if(!b.roundActed.includes(m.uid)) b.roundActed.push(m.uid);
}
/* A place in the order is over: whoever held it has had its action. */
function settleControl(){
  const b = ui.battle;
  const ctl = b && b.control;
  if(!b) return;
  b.control = null;
  if(!ctl) return;
  const owner = playerField().find(m=> m.uid === ctl.uid);
  if(owner) markActed(owner);
}
/* The Skip button: the one whose turn it is passes. */
function noteSkip(){
  const b = ui.battle, ctl = b && b.control;
  if(ctl) ctl.skipped = true;
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

  /* The round is over for your side too: nobody of it is still in focus or
     choosing. */
  setFocus(null);
  b.control = null;
  const gm = frontMon();
  /* Every monster of yours on the field keeps its own stances. */
  playerField().forEach(pm=>{
    tickRage(pm); tickOverpower(pm);
    if(pm.guard) grantBlock(pm, 1, monAtk(pm));
    if(pm.airborne  > 0) pm.airborne--;
    if(pm.invisible > 0) pm.invisible--;
    // Counter stacks never expire — nothing to tick
    if(pm.evadeTurns   > 0 && !certainDodge(pm)) pm.evadeTurns--;   // a Stillness waits (advanceMirageWindows)
  });
  livingEnemies().forEach(e=>{
    tickRage(e); tickOverpower(e);
    if(e.guard) grantBlock(e, 1, e.atk);
    if(e.airborne  > 0) e.airborne--;
    if(e.invisible > 0) e.invisible--;
    // Counter stacks never expire — nothing to tick
    if(e.evadeTurns   > 0 && !certainDodge(e)) e.evadeTurns--;
  });

  /* (Mirage's window and Overcharge's first-turn rate no longer lapse here:
     they wait until they have done something — advanceMirageWindows at the
     start of the next round, and the Overcharge roll itself. 2.74) */
  /* Steel Aegis tops itself up: one coin-flip at +, two at ✦ — so ✦ has a 75%
     chance of at least one stack and a 25% chance of two. */
  const aeg = getPStatus(0,'steelAegis');
  if(aeg && gm){
    const rolls = aeg.regenRolls || (aeg.regen ? 1 : 0);
    const both = livingField().length > 1;
    livingField().forEach(pm=>{                    // a side-wide buff: each of yours on the field
      let won = 0;
      for(let r = 0; r < rolls; r++) if(Math.random() < 0.5) won++;
      if(won){ grantBlock(pm, won, monAtk(pm)); battleMsg(`🛡 The aegis thickens — +${won} block${both ? ` on ${displayName(pm)}` : ''}.`); }
    });
  }
  const tac0 = getPStatus(0,'tachy');
  if(tac0){ tac0.extras = 0; }                   // (its first-turn dodge waits for an attack: advanceMirageWindows)
  const dd0 = getPStatus(0,'diamondDust');
  if(dd0) diamondDustCleanse();
  /* Their side's upkeep, the mirror of yours: their dust sweeps you, their
     aegis thickens, their counter reads you again, their windows move on. */
  if(getESide('diamondDust')) diamondDustCleanse('enemy');
  const aegE = getESide('steelAegis');
  if(aegE){
    const holder = (aegE.owner && aegE.owner.hp > 0) ? aegE.owner : livingEnemies()[0];
    let won = 0;
    for(let r = 0; r < (aegE.regenRolls || 0); r++) if(Math.random() < 0.5) won++;
    if(won && holder){ grantBlock(holder, won, holder.atk); battleMsg(`🛡 Their aegis thickens — +${won} block.`); }
  }
  const ctrE = getESide('counter');
  if(ctrE && ctrE.regain && Math.random() < ctrE.regain){
    const holder = (ctrE.owner && ctrE.owner.hp > 0) ? ctrE.owner : livingEnemies()[0];
    if(holder) addCounterStack(holder, ctrE.tier || 0, 1);
  }
  /* (their Mirage window and Overcharge rate: as yours, above) */
  const tacE = getESide('tachy');
  if(tacE){ tacE.extras = 0; }
  /* Counter tops itself up slowly — stacks never expire, so they bank. */
  const ctr = getPStatus(0,'counter');
  if(ctr && ctr.regain && gm && Math.random() < ctr.regain){
    addCounterStack(gm, ctr.tier||0, 1);
    battleMsg(`🛡 Another read — <b>${counterCountOf(gm)}</b> Counter stack${counterCountOf(gm)>1?'s':''} ready.`);
  }

  const ar = getPStatus(0,'aria');
  if(ar && ar.fieldEvade > 0 && ar.coverUsed) ar.fieldEvade--;   // the untouchable turn is spent — if it was used
  if(ar) ar.coverUsed = false;
  endDragonLegacy();                             // a Legacy spent this turn is over
  tickCompanionTurns();                          // a companion out spends one of its turns
  tickFoePairTurns();                            // and theirs (2.87)

  /* (The Haunting Aria no longer rolls here: it rolls in the next round's
     pre-action phase, in beginRound.) */
  resolveAfterimages(()=> resolveEnemyAfterimages(()=>{
    if(!ui.battle) return;
    if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
    const onward = ()=>{
      const gone = tickStatuses();
      renderStatusBadges();
      setTimeout(()=>{
        if(!ui.battle) return;
        beginRound(gone.length ? `${gone.join(' and ')} wore off.` : 'Choose a move.');
      }, gone.length ? 900 : 500);
    };
    /* their afterimages can fell the last of your team: the phoenix may rise */
    if(sideDefeated()){
      const f = [companionOnField(), leaderMon()].find(m=> m && m.currentHp <= 0 && rebirthDue(m));
      if(f) return offerRebirth(onward, ()=> onPlayerDefeated(), f);
      return onPlayerDefeated();
    }
    onward();
  }));
}
/* A companion out on the field spends one of its turns each round; with none
   left it goes back into its leader's core (handover 07). */
function tickCompanionTurns(){
  const b = ui.battle, l = leaderMon();
  const c = companionOnField();
  if(!b || !l || !c) return;
  const p = b.pairs[l.uid];
  p.turnsLeft = Math.max(0, p.turnsLeft - 1);
  if(p.turnsLeft <= 0 && c.currentHp > 0) companionReturns(c, p);
}
function companionReturns(c, p){
  const l = leaderMon();
  const cs = chargeState();
  if(cs && cs.uid === c.uid) triggerDragonLegacy();     // its stored power passes on
  p.out = false;
  if(ui.battle.focusUid === c.uid) setFocus(null);
  battleMsg(`🤝 ${displayName(c)} goes back into ${displayName(l)}'s core.` +
            (l.currentHp <= 0 ? ` ${displayName(l)} cannot fight on.` : ''));
  renderBattle();
}

/* Anything that costs one of yours its place this round: their Ice Tomb, a
   jam, a nap, a stun, a charm. Says so and returns true — the caller passes
   the turn on. The monster is the one in focus. */
function playerHeldDown(){
  const b = ui.battle;
  const me = activeMon();
  const say = (t)=>{ b.phase = 'resolving'; renderBattle(); battleMsg(t); return true; };
  /* Their Ice Tomb: nobody on your side moves while it holds. */
  if(getESide('deepFreeze')) return say(`🧊 ${displayName(me)} is frozen solid!`);
  // a jammed monster may seize up before acting — never two turns running
  const jam = getPStatus(0,'disrupt');
  if(jam && !me._seizedLast && Math.random() < (jam.stun || 0.15)){
    me._seizedLast = true;
    return say(`📡 ${displayName(me)} seizes up — your signals are scrambled!`);
  }
  me._seizedLast = false;
  const nap0 = getPStatus(0,'asleep');
  if(nap0){
    nap0.turnsLeft--;
    if(nap0.turnsLeft <= 0) removePStatus(0,'asleep');
    return say(`💤 ${displayName(me)} is fast asleep.`);
  }
  const stun = getPStatus(0,'stunned');
  if(stun){
    removePStatus(0,'stunned');
    return say(`💫 ${displayName(me)} is stunned and can't move!`);
  }
  const ch = getPStatus(0,'charmed');
  if(ch && Math.random() < (ch.chance||0.20)) return say(`💗 ${displayName(me)} is charmed and loses its turn!`);
  return false;
}
/* The player's slice of the round, for one monster of yours (the one in
   focus). It decides nothing about order — losing the turn to a stun or a
   charm simply hands straight on to the next step. The choice is this
   monster's own: its buttons, its move (a companion's costs its 8 words for
   the turn — handover 07). */
function beginPlayerPhase(msg, mon){
  const b = ui.battle;
  if(!b) return;
  mon = mon || activeMon();
  if(playerHeldDown()) return setTimeout(advanceTurn, 900);
  b.control = { mode:'solo', uid:mon.uid };
  b.phase = 'player';
  renderBattle();
  /* (the line over the buttons already says whose turn it is) */
  if(isCompanionMon(mon)) battleMsg(`Pick any of ${escapeHtml(displayName(mon))}'s moves — write all ${COMPANION.turnWords} words, or its turn fails.`);
  else if(msg) battleMsg(msg);
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
  /* Region 5: the harbour, and the catacombs under the town (15-region5.js).
     The catacombs open once the soldato at the sea cave is beaten; the Old
     Town once you have come up through them into its church (2.90). */
  5: [ { id:'harbour',   name:'The Harbour',   tint:'#6a8aa0' },
       { id:'catacombs', name:'The Catacombs', tint:'#4a3a5a', locksUntil:'r5Catacombs' },
       { id:'old_town',  name:'The Old Town',  tint:'#9a7a5a', locksUntil:'r5OldTown' },
       { id:'hilltop',   name:'The Hilltop',   tint:'#7a8a4a', locksUntil:'r5Hill' } ],
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
  /* Each floor and room keeps its own wild band (15-region5.js); `cap` is how
     far a monster may grow down here — the region's 110 (2.82; 200 before). */
  catacombs:       { min:76, max:95, cap:110 },
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
  const atk = Math.ceil(stat * atkScale(level));                // ATK past 100 grows too (2.89)
  const e = { species, level, maxHp:hp, hp:hp, atk, move, types:sp.types, stage, tier:sp.tier, ai, nerfed, boss:!!opts.boss, crowned:!!opts.crowned };
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
  ui.victoryNotes = null;                        // a note is for the victory it was left for
  /* Counter stacks, Combo, Enrage and the rest live ON the monster so they can
     follow it between switches. That means they also followed it between
     BATTLES — you could walk into a wild fight already holding four guards.
     Every fight starts clean. */
  /* the side's own stacks, not any one monster's */
  if(ui.battle){ ui.battle.pCounter = []; ui.battle.pCombo = 0; }
  state.party.concat(state.storage || []).forEach(m=>{
    m.counterStack = []; m.comboStacks = 0; m.enrageStacks = 0;
    m.blockStacks = 0;   m.blockValue = 0;
    m._rage = null;      m._overpower = null;  m._stoop = null;
    m.morsMarks = 0;     m._entered = false;   m._aegisPassiveDone = false;
    /* Lurk, Cunning, an ambush, a wind-up, an omen: all this battle's alone. */
    m.lurk = false; m.lurkUsed = 0; m.cunning = false; m.hitsDealt = 0;
    m._ambush = 0;  m._windup = null; m._omen = 0; m._seizedLast = false;
  });
  restCompanions();                              // every fight starts them whole (2.84)
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
    noFlee: !config.coreSpar && (!!config.noFlee || (!!config.isNpc && (state.progress.currentRegion||1) >= 2)),   // a spar can be given up
    concertFight: !!config.concertFight,
    figlio: !!config.figlio,          // he leads every round
    catacomb: !!config.catacomb,      // their ghosts arrive lurking
    scriptedLoss: config.scriptedLoss||null,
    coreSpar: config.coreSpar || null,   // a training spar with the Monkey King (2.86): { uid, tier, hp }
    scriptedAlly: config.scriptedAlly||null, allyMove: config.allyMove||null,
    allyUnkillable: !!config.allyUnkillable, enemiesFirst: !!config.enemiesFirst,
    switchedThisTurn:false, busy:false, fightMistakes:[], phase:'player', wordCarry:0,
    charge:null, legacyBonus:0,
    aftershock:[], aftershockPending:false, bonusMult:0, _bonusResolved:false,
    _passiveUsed:false,
    turnStep:0,          // turnOrder retired with the per-monster initiative
    rechargeWords:0,         // every word written this battle feeds the meter

    partyStatus:{},          // party-wide buffs, each with a turn counter
    monStatus:{},            // each of your monsters' own debuffs, by uid (2.83)
    focusUid:null,           // the monster of yours in focus, if not the leader (2.83)
    enemyStatus:{},          // the enemy side's own side-wide buffs (their Overheat, their dust…)
    fieldStatus:{},          // debuffs stamped on every enemy, inherited by later waves
    /* COOLDOWN RULE — only these ever go on cooldown.
       Basic, Power1, Power2, Ultimate and Max are NATURAL moves and are
       available every single turn, always. Only a VERY HIGH or an ULTRA stone
       is spent once per battle, and the 100-word recharge meter gives both
       back. The one exception, agreed in 2.93: Steel Soul, the Ankylosaurus's
       quick cast (its Power2), is once a battle too, and the same meter gives
       it back. Nothing else should ever be added to these maps. */
    usedVeryHigh:{}, usedUltra:{}, usedSoul:{},
  };
  ui.battle.noFleeBase = ui.battle.noFlee;     // what a Fiery Jaws lets go back to
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
  const lead = leaderMon();
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
    if(spec && spec.veryHigh){
      /* `cast`: carried the way you carry yours — its passive now, the stone
         cast on its first action. Otherwise carried as Jax carries his. */
      if(spec.veryHigh.cast){
        e.stone = { type:spec.veryHigh.type, plus:spec.veryHigh.plus || 0, cast:true, used:false };
        enemyStonePassive(e);
      } else applyEnemyVeryHigh(e, spec.veryHigh.type, spec.veryHigh.plus||0);
    }
    /* The catacombs: every ghost on their side arrives lurking — never a
       second time, and never over the top of a Lurk it brought itself. */
    if(b.catacomb && (e.types || []).includes('Ghost')) grantLurk(e);
  });
  // a passive announces itself the moment its owner appears — or that it can't
  const withPassive = b.enemies.find(e=>passiveDefOf(e));
  if(withPassive){
    const p = passiveDefOf(withPassive);
    const who = passiveTitle(withPassive, p);
    setTimeout(()=> battleMsg(passivesMuted(withPassive) ? `🔇 ${who} is silenced by the curse!` : `⚡ ${who} is active!`), 600);
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
    endDragonLegacy();                 // the turn that used it is over
    setFocus(null);
    tickCompanionTurns();              // and a companion out spent one of its turns
    /* A new round for Tachypsychia's three extra actions, as endRound gives —
       the ones that cleared the wave used to count against the next. */
    [getPStatus(0,'tachy'), getESide('tachy')].forEach(t=>{ if(t) t.extras = 0; });
    b.waveIndex++;
    loadWave(b.waveIndex);
    renderBattle();
    battleMsg(`Wave ${b.waveIndex+1} of ${b.waves.length}!`
      + (gone.length ? ` (${gone.join(' and ')} wore off.)` : ''));
    // the new arrivals face upkeep (Overheat, Aftershock) and may seize the initiative
    setTimeout(()=> beginRound('Choose a move.'), 900);
  } else {
    if(b.coreSpar) return coreSparWon();       // a spar with the Monkey King (2.87)
    if(b.isNpc) onChallengeWon();
    else onBattleWon();
  }
}

/* An enemy's attack figure, with any Enrage it has worked itself into — the
   mirror of monAtk(). Enemy Enrage stacks were being counted and never used. */
function enemyAtk(e){
  if(!e) return 0;
  const n = e.enrageStacks || 0;
  if(!n) return e.atk;
  const c = getESide('counter');
  return e.atk + Math.round(n * ((c && c.enrage) || 0.20) * e.atk);
}

/* ============================================================
   YOUR SIDE OF THE FIELD (2.83; the companion joins it in 2.84)
   Your side is a pair now (handover/07-COMPANIONS), so "your monster" is
   several questions:
     leaderMon()    the monster out front, the party's active one: switching,
                    the plate on the left, whose companion it is;
     playerField()  every monster of yours on the field — the leader (even
                    fallen, until it is replaced) and its companion while it
                    is out (even fallen, until its fall is dealt with);
     livingField()  the ones of those still standing;
     frontMon()     the one that stands for your side when nothing else is in
                    focus: the leader, or the companion standing in for it;
     activeMon()    the monster in FOCUS: whose action is running, or whom an
                    enemy's blow is aimed at. It is what single-monster code
                    means by "yours" — the front monster unless something has
                    put another of yours in focus (setFocus);
     controlMon()   whose own moves the buttons show — the one whose turn it
                    is (a companion chooses its own, 2.85).
   pid('playerBob') and its kin name the page elements that show the monster
   in focus (the leader's are playerBob / playerHp / playerBlk, the
   companion's companionBob / companionHp / companionBlk).
   Out of a battle there is no active monster. This used to throw, which took
   down the stats screen whenever it was opened before the first fight of a
   session — every move line estimates its damage through here.
   ============================================================ */
function leaderMon(){ return (ui.battle && state.party[ui.battle.activeIndex]) || null; }
function playerField(){
  const l = leaderMon();
  if(!l) return [];
  const c = companionOnField();
  return c ? [l, c] : [l];
}
function livingField(){ return playerField().filter(m=> m.currentHp > 0); }
function frontMon(){
  const l = leaderMon();
  if(l && l.currentHp <= 0){
    const c = companionOnField();
    if(c && c.currentHp > 0) return c;
  }
  return l;
}
/* The leader lies fallen and its companion fights on alone. */
function standingIn(){ const l = leaderMon(); return !!(l && l.currentHp <= 0 && frontMon() !== l); }
function activeMon(){
  const b = ui.battle;
  if(!b) return null;
  if(b.focusUid){
    const f = playerField().find(m=> m.uid === b.focusUid);
    if(f) return f;
  }
  return frontMon();
}
/* Put one of your monsters in focus for an action or a blow, or (null) hand
   it back to the front monster. */
function setFocus(mon){ if(ui.battle) ui.battle.focusUid = mon ? mon.uid : null; }
/* Run `fn` with `mon` in focus, then put the focus back as it was — for work
   that finishes at once (a sweep, a pulse, a cast of theirs on each of you). */
function withFocus(mon, fn){
  const b = ui.battle;
  if(!b) return fn();
  const was = b.focusUid;
  setFocus(mon);
  try { return fn(); } finally { b.focusUid = was; }
}
function controlMon(){
  const b = ui.battle;
  if(!b) return null;
  const ctl = b.control;
  if(ctl && ctl.mode === 'solo'){
    const f = livingField().find(m=> m.uid === ctl.uid);
    if(f) return f;
  }
  return frontMon();
}
/* The element id for a monster of yours (the one in focus, if not given):
   'playerBob' for the leader, 'companionBob' for its companion. */
function pid(base, mon){
  const m = mon || activeMon(), l = leaderMon();
  return (m && l && m.uid !== l.uid) ? base.replace('player', 'companion') : base;
}

/* ============================================================
   COMPANIONS (2.84, reworked 2.85 — handover/07-COMPANIONS.md, phase 2)
   A party monster — the LEADER — holds the shared core of a monster from your
   collection, its COMPANION (leader.companionUid: a monster in storage, never
   one of the party). In battle a summon (4 words, and the turn stays yours)
   brings it out beside the leader for up to five turns; the recharge meter
   gives them back. Up to six summons a battle.
   A companion has its own place in the order and chooses its own move there.
   Its TURN costs 8 words, whatever the move (COMPANION.turnWords): all 8 or
   the whole turn fails. Only a move's extras still cost words — the tail of
   a move that grows with extra words (Incinerate Max: 7 more for its 2.75×),
   and bonus rounds. A quick move (a Very High stone) leaves its turn open, and
   what it does next that turn is already paid for (control.paid).
   Battle state, per leader: ui.battle.pairs[leaderUid] =
     { uid, turnsLeft, out, fallen }
   `out` stays true while the pair is switched off, so it comes back out with
   its leader; its turns only run while it is on the field (they FREEZE).
   A companion is not a party member: its own battle HP, full at the start of
   every fight (readyCompanion; restCompanions puts it back after), and it is
   outside Revitalise, Conversio and the party's defeat check — though while
   it stands in for a fallen leader the fight goes on.
   Bonding for real — the Crown, the core slot and its training, the
   Companions page — is phase 3 (2.86, 07-screens.js). All of it is behind
   the developer profile (companionsUnlocked) until the end of Region 5 sets
   state.companionsUnlocked.
   ============================================================ */
const COMPANION = { summonWords:4, turns:5, maxSummons:6, turnWords:8 };
function companionsUnlocked(){
  return !!(state && (state.companionsUnlocked || (typeof isDev === 'function' && isDev())));
}
/* Not in the story's set pieces: a borrowed monster, a one-blow scene, a
   fight you are meant to lose. */
function companionsAllowed(){
  const b = ui.battle;
  return !!(b && companionsUnlocked() && !b.scriptedAlly && !b.scriptedOneTurn && !b.scriptedLoss);
}
function companionOf(leader){
  if(!leader) return null;
  /* In a spar with the Monkey King (2.87) the monster being trained holds the
     core it chose for that spar — borrowed, never one of yours. */
  const sp = ui.battle && ui.battle.coreSpar;
  if(sp && sp.uid === leader.uid && sp.companion) return sp.companion;
  if(!leader.companionUid) return null;
  return (state.storage || []).find(m=> m.uid === leader.companionUid) || null;
}
function bondedCompanions(){
  const seen = new Set(), out = [];
  (state.party || []).forEach(l=>{
    const c = companionOf(l);
    if(c && !seen.has(c.uid)){ seen.add(c.uid); out.push(c); }
  });
  return out;
}
/* This battle's record of a leader's pair — made the first time it is asked
   for, which is when the companion is readied for the fight. */
function pairOf(leader){
  const b = ui.battle;
  if(!b || !leader) return null;
  const c = companionOf(leader);
  if(!c) return null;
  b.pairs = b.pairs || {};
  let p = b.pairs[leader.uid];
  if(!p || p.uid !== c.uid){
    p = b.pairs[leader.uid] = { uid:c.uid, turnsLeft:COMPANION.turns, out:false, fallen:false };
    readyCompanion(c);
  }
  return p;
}
/* Full health and a clean slate, as every fight starts for the party. */
function readyCompanion(c){
  c.currentHp = monMaxHp(c);
  c.counterStack = []; c.comboStacks = 0; c.enrageStacks = 0;
  c.blockStacks = 0;   c.blockValue = 0;
  c._rage = null;      c._overpower = null; c._stoop = null;
  c.morsMarks = 0;     c._entered = false;  c._aegisPassiveDone = false;
  c.lurk = false; c.lurkUsed = 0; c.cunning = false; c.hitsDealt = 0;
  c._ambush = 0;  c._windup = null; c._omen = 0; c._seizedLast = false;
  c.guard = false; c.airborne = 0; c.invisible = 0; c.prep = 0; c.evadeTurns = 0;
}
/* Out of battle a companion is always whole: what it lost was the fight's. */
function restCompanions(){ bondedCompanions().forEach(c=>{ c.currentHp = monMaxHp(c); }); }
/* The current leader's companion, while it is out on the field. */
function companionOnField(){
  const b = ui.battle, l = leaderMon();
  if(!b || !l || !b.pairs) return null;
  const p = b.pairs[l.uid];
  if(!p || !p.out || p.fallen) return null;
  const c = companionOf(l);
  return (c && c.uid === p.uid) ? c : null;
}
function isCompanionMon(m){ const l = leaderMon(); return !!(m && l && m.uid !== l.uid && companionOnField() === m); }
/* A move that never spends the turn: a Very High stone's cast, the Aria, or
   (2.93) Steel Soul. */
function isQuickMove(mv){ return !!(mv && ((mv.isStone && mv.stoneTier === 'veryhigh') || mv.aria || mv.soul)); }
/* The words a companion's move still asks for beyond its turn's 8: the tail
   of a move that grows with extra words (Incinerate Max: 7 more, to 15, for
   its 2.75×). Bonus rounds are their own quizzes, as always. */
function companionTail(mv){
  return (mv && mv.scale && !mv.windupReady) ? Math.max(0, scaleCeilWords(mv) - mv.words) : 0;
}
/* The companion takes its place in this round's order — after whoever is
   acting now, where its initiative puts it among the rest. */
function insertCompanionRow(c){
  const b = ui.battle;
  if(!b || !b.order || !c) return;
  if(b.order.some(r=> r.side === 'player' && r.mon === c && !r.acted)) return;
  if((b.roundActed || []).includes(c.uid)) return;
  const row = playerRow(c);
  let at = b.order.length;
  for(let j = (b.orderStep || 0) + 1; j < b.order.length; j++){
    if(orderCompare(row, b.order[j]) < 0){ at = j; break; }
  }
  b.order.splice(at, 0, row);
}
/* The leader out front has changed (a switch, a send-out, Vengeance's swap):
   the companion that was out goes back with its leader — its turns frozen —
   and the newcomer's comes back out if it was out,
   arriving as any monster of yours does. The leader's place in the order
   passes to the newcomer. */
function pairSwitched(oldLeader){
  const b = ui.battle;
  if(!b) return;
  const nl = leaderMon();
  b.standInFor = null;
  const old = oldLeader && oldLeader !== nl ? companionOf(oldLeader) : null;
  if(old && b.focusUid === old.uid) b.focusUid = null;
  const lr = leaderRow();
  if(lr && oldLeader && lr.mon === oldLeader) lr.mon = nl;
  if(b.foeFocus && !livingField().some(m=> m.uid === b.foeFocus)) b.foeFocus = null;
  const c = companionOnField();
  if(c && c.currentHp > 0){
    if(!c._entered){ c._entered = true; applyEntryPassives(c, c.species, c.level, monAtk(c)); }
    else applyStonePassives(c);
    insertCompanionRow(c);
  }
}
/* A companion has fallen: out for the rest of this fight (handover 07). */
function companionFalls(c){
  const b = ui.battle, l = leaderMon();
  const p = l && b && b.pairs && b.pairs[l.uid];
  if(!p || p.uid !== c.uid) return;
  const cs = chargeState();
  if(cs && cs.uid === c.uid) triggerDragonLegacy();     // its stored power passes on
  p.fallen = true; p.out = false;
  if(b.focusUid === c.uid) b.focusUid = null;
  if(b.foeFocus === c.uid) b.foeFocus = null;
  battleMsg(`🤝 ${displayName(c)} has fallen — it is out for the rest of this fight.`);
  renderBattle();
}
/* The leader has fallen with its companion out: the companion fights on alone
   — its own moves, 8 words a turn — until its turns run out. */
function noteStandIn(){
  const b = ui.battle, l = leaderMon(), c = companionOnField();
  if(!b || !l || !c || b.standInFor === l.uid) return;
  b.standInFor = l.uid;
  if(b.foeFocus === l.uid) b.foeFocus = null;
  const p = b.pairs[l.uid];
  battleMsg(`🤝 ${displayName(l)} has fallen — ${displayName(c)} stands in for it` +
            ` while its turns last (${p ? p.turnsLeft : 0} left).`);
  renderBattle();
}
/* Something of yours on the field has fallen and not been dealt with yet. */
function fieldNeedsFaint(){
  const b = ui.battle;
  if(!b) return false;
  const c = companionOnField();
  if(c && c.currentHp <= 0) return true;
  const l = leaderMon();
  return !!(l && l.currentHp <= 0 && !(standingIn() && b.standInFor === l.uid));
}

/* ------------------------------------------------------------
   WHO THEIR BLOWS GO FOR (2.84)
   With one of yours on the field there is no question. With a pair:
     wild enemies  one of the two at random, blow by blow;
     bosses, a trainer's monsters and the clever ones  focus one down — the
       one they can finish soonest, reading its EFFECTIVE health: what it has
       and the block in front of it, against what this blow would do to it,
       stretched by how often it slips a blow (Tachypsychia, a Mirage, a
       stance) — and they stay on it until it falls or nothing can touch it
       (a Lurk, a Stillness);
     an area move  both (enemyTargetPlan).
   ------------------------------------------------------------ */
const CLEVER_AI = new Set(['best','maxer','ankylo','cataclysm','dragon','tricer','firehound','stoop']);
function enemyFocuses(e){
  const b = ui.battle;
  return !!(b && (b.isNpc || (e && (e.boss || CLEVER_AI.has(e.ai)))));
}
function untouchable(m){ return stanceEvasion(m) >= 1; }
/* How many of this enemy's blows (of this move) it would take to finish `m`,
   dodges counted in. */
function blowsToFinish(e, m, move){
  const mv = move || (e && e.move) || [];
  const ex = mv[6] || {};
  const hits = (ex.hits > 1 && !ex.reflect && !ex.grudge) ? ex.hits : 1;
  const mult = mv[2] != null ? mv[2] : 0.5;
  const per = (ex.hits > 1 && ex.split) ? mult / ex.hits : mult;
  const one = Math.max(1, computeDamage(per, enemyAtk(e), e, monRef(m), false));
  const soak = blockStacksOf(m) * (m.blockValue || 0);
  const need = Math.ceil((m.currentHp + soak) / Math.max(1, one * hits));
  const dodge = Math.min(0.95, playerEvasionFrom(e, m));
  return need / (1 - dodge);
}
function enemyPickTarget(e, move, ownChoice){
  const b = ui.battle;
  const mine = livingField();
  if(mine.length <= 1) return mine[0] || null;
  /* Your Steel Soul (2.90): a quick strike, their Conversio's light — any one
     blow of theirs — comes to it. (enemyTargetPlan asks for the AI's own
     choice, to say whom it shielded.) */
  if(!ownChoice){ const g = soulGuardian('player'); if(g) return g; }
  if(!enemyFocuses(e)) return mine[Math.floor(Math.random() * mine.length)];
  const cur = mine.find(m=> m.uid === b.foeFocus);
  const open = mine.filter(m=> !untouchable(m));
  if(cur && (!untouchable(cur) || !open.length)) return cur;
  const pool = open.length ? open : mine;
  let best = pool[0], bestN = Infinity;
  pool.forEach(m=>{
    const n = blowsToFinish(e, m, move);
    if(n < bestN - 1e-9 || (Math.abs(n - bestN) < 1e-9 && m.currentHp < best.currentHp)){ best = m; bestN = n; }
  });
  b.foeFocus = best.uid;
  return best;
}
/* Everyone of yours this move of theirs reaches, and how:
     [{ mon, scale?, hits? }] — an area move each of yours standing; a twin
     one blow each; a splash the other at its splash; an Ultra its strikes
     scattered between them; anything else the one it goes for. */
function enemyTargetPlan(e, move){
  const mine = livingField();
  if(!mine.length) return [];
  const kind = move && move[3];
  const ex = (move && move[6]) || {};
  if(mine.length > 1 && kind === 'AOE') return mine.map(m=> ({ mon:m }));
  const main = enemyPickTarget(e, move, true);
  if(!main) return [];
  const other = mine.find(m=> m !== main);
  /* Your Steel Soul (2.90): every single blow comes to it — `shielded` is who
     it would have gone to. A twin blow still takes one each. */
  const guard = (mine.length > 1 && kind !== 'Multi2') ? soulGuardian('player') : null;
  if(guard){
    const rest = mine.find(m=> m !== guard);
    if(kind === 'SingleAOE' && ex.splash && !ex.stoop)
      return [{ mon:guard, shielded:main !== guard ? main : null }, { mon:rest, scale:ex.splash }];
    if(kind === 'MultiHit' && ex.hits > 1 && !ex.stoop) return [{ mon:guard, hits:ex.hits, shielded:rest }];
    return [{ mon:guard, shielded:main !== guard ? main : null }];
  }
  if(other && !ex.stoop){
    if(kind === 'Multi2') return [{ mon:main }, { mon:other }];
    if(kind === 'SingleAOE' && ex.splash) return [{ mon:main }, { mon:other, scale:ex.splash }];
    if(kind === 'MultiHit' && ex.hits > 1){
      let a = 0;
      for(let k = 0; k < ex.hits; k++) if(Math.random() < 0.5) a++;
      return [{ mon:main, hits:ex.hits - a }, { mon:other, hits:a }].filter(x=> x.hits > 0);
    }
  }
  return [{ mon:main }];
}
/* The summon, and why not: '' when it can be done now, else the reason. */
function summonBlock(){
  const b = ui.battle, l = leaderMon();
  if(!companionsAllowed() || !l) return 'none';
  const c = companionOf(l);
  if(!c) return 'none';
  const p = pairOf(l);
  if(l.currentHp <= 0) return 'down';
  if(p.fallen) return 'fallen';
  if(p.out) return 'out';
  if(p.turnsLeft <= 0) return 'tired';
  if((b.summons || 0) >= COMPANION.maxSummons) return 'spent';
  const ctl = b.control;
  if(ctl && ctl.mode === 'solo' && ctl.uid !== l.uid) return 'busy';   // the companion's own action
  return '';
}
/* ============================================================
   THEIR COMPANION (2.87 — the Monkey King's spars; handover/07)
   A leader on their side can hold a companion's core as yours does:
   b.foePair = { leader, mon, turnsLeft, out, fallen, summons, entered }.
   On its leader's own action it is called out — free, as your summon keeps
   your turn (enemyActs) — and takes its place in this round's order. Five
   turns out, counted by the round (the round it came out counts); at 0 it
   goes back into the core, off the field (out of b.enemies), and YOUR
   recharge meter gives it its five back, as it gives yours (feedRecharge).
   Six calls a battle at most. It falls: out for the fight. Its leader falls
   while it is out: it stands in until its turns run out, and the fight is
   over when nobody of theirs is left standing on the field.
   ============================================================ */
function foePair(){ return (ui.battle && ui.battle.foePair) || null; }
/* "Cyclops's Bog Lurker" — but "Goblin's Greed", not "Goblin's Goblin's Greed". */
function passiveTitle(e, pd){
  const name = SPECIES[e.species].name;
  return pd.name.startsWith(name) ? pd.name : `${name}'s ${pd.name}`;
}
function foeCanSummon(e){
  const p = foePair();
  if(!p || p.leader !== e || !e || e.hp <= 0) return false;
  if(p.mon.hp <= 0) p.fallen = true;
  return !p.out && !p.fallen && p.turnsLeft > 0 && (p.summons || 0) < COMPANION.maxSummons;
}
/* Called out: onto the field, into this round's order. Returns its line. */
function foeSummon(){
  const b = ui.battle, p = foePair();
  if(!b || !p) return '';
  p.out = true;
  p.summons = (p.summons || 0) + 1;
  if(!b.enemies.includes(p.mon)) b.enemies.push(p.mon);
  if(!p.entered){ p.entered = true; foeArrives(p.mon); }
  insertEnemyRow(p.mon);
  playSfx('stone_veryhigh');
  const n = p.turnsLeft;
  return `🤝 ${SPECIES[p.leader.species].name} calls ${SPECIES[p.mon.species].name} out of his core — ${n} turn${n === 1 ? '' : 's'}!`;
}
/* Arriving as any of theirs does on a new wave: your fields on their side
   reach it, and its passive takes hold (once a battle, as yours). */
function foeArrives(e){
  const fs = (ui.battle && ui.battle.fieldStatus) || {};
  if(fs.leechSeed) addEStatus(e, Object.assign({}, fs.leechSeed));
  if(fs.iceField)  addEStatus(e, { type:'iceTomb', turnsLeft:fs.iceField.freeze||2, taken:fs.iceField.taken });
  if(fs.curse)     addEStatus(e, Object.assign({}, fs.curse));
  if(fs.disruptField) addEStatus(e, { type:'disrupt', turnsLeft:fs.disruptField.turnsLeft, stun:fs.disruptField.stun, mine:!!fs.disruptField.mine });
  applyEntryPassives(e, e.species, e.level, e.atk);
  const pd = passiveDefOf(e);
  if(pd){
    const who = passiveTitle(e, pd);
    setTimeout(()=> battleMsg(passivesMuted(e) ? `🔇 ${who} is silenced by the curse!` : `⚡ ${who} is active!`), 1400);
  }
}
/* One of theirs arriving mid-round takes its place after whoever is acting. */
function insertEnemyRow(e){
  const b = ui.battle;
  if(!b || !b.order || !e) return;
  if(b.order.some(r=> r.side === 'enemy' && r.mon === e && !r.acted)) return;
  const row = { side:'enemy', mon:e, idx:b.enemies.indexOf(e), tier:machTier('enemy'), value:initiativeOf('enemy', e) };
  let at = b.order.length;
  for(let j = (b.orderStep || 0) + 1; j < b.order.length; j++){
    if(orderCompare(row, b.order[j]) < 0){ at = j; break; }
  }
  b.order.splice(at, 0, row);
}
/* The round is over: one of its turns spent; with none left it goes home. */
function tickFoePairTurns(){
  const b = ui.battle, p = foePair();
  if(!b || !p || !p.out) return;
  if(p.mon.hp <= 0){ p.fallen = true; p.out = false; return; }   // fell: it stays where it fell
  p.turnsLeft = Math.max(0, p.turnsLeft - 1);
  if(p.turnsLeft > 0) return;
  p.out = false;
  const i = b.enemies.indexOf(p.mon);
  if(i >= 0) b.enemies.splice(i, 1);                               // off the field, back into the core
  const lead = SPECIES[p.leader.species].name, name = SPECIES[p.mon.species].name;
  battleMsg(`🤝 ${name} goes back into ${lead}'s core.` + (p.leader.hp <= 0 ? ` ${lead} cannot fight on.` : ''));
  renderBattle();
}
/* Their leader has fallen with its companion out: it stands in. Said once. */
function noteFoeStandIn(){
  const p = foePair();
  if(!p || p.standSaid || !p.out || p.leader.hp > 0 || p.mon.hp <= 0) return;
  p.standSaid = true;
  battleMsg(`🤝 ${SPECIES[p.leader.species].name} is down — ${SPECIES[p.mon.species].name} fights on while its turns last (${p.turnsLeft} left).`);
}
/* The tag on their companion's plate: its turns, as yours shows. */
function foeCompanionTag(e){
  const p = foePair();
  return (p && p.mon === e && p.out) ? ` <span class="foe-comp-tag">🤝 ⏳${p.turnsLeft}</span>` : '';
}
function monMaxHp(m){ return computeMaxHp(m.species, m.level, m.supplements, m); }
/* Enrage is bolted on top of the natural figure, from the undressed base, so
   stacks stay additive and never compound with one another. */
function rawMonAtk(m){ return computeAtk(m.species, m.level, m.supplements, m); }     // scaled past 100 (2.89)
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
  /* A Passive in the Max row (Caladrius's Pacificus) is not an upgrade — it
     only holds the place. It used to take over the Ultimate and leave the bird
     with a Pacificus button that did nothing, and no Conversio at all. */
  const maxMv = MOVES[m.species].find(mv=>mv[0]==='Max' && mv[1]!=null && mv[3]!=='Passive' && moveUnlockedFor(m, mv));
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
  /* Steel Soul, once cast, is spent until the 100-word meter fills (2.93).
     Its button keeps its name and says so, rather than going dark as ???. */
  base.forEach(mv=>{
    if(mv.soul && mv.available && ui.battle && ui.battle.usedSoul && ui.battle.usedSoul[m.uid]){ mv.available = false; mv.spent = true; }
  });
  /* The ghost phoenix's gift: Nova and Incinerate may leave a Sacred Flame. */
  base.forEach(mv=>{ const sf = sacredFlameBonus(m, mv); if(sf) mv.bonus = sf; });
  /* Something wound up last turn comes down this turn, already paid for. */
  if(m._windup){
    const w = base.find(mv=> mv.name === m._windup);
    if(w){ w.words = 0; w.windupReady = true; }
  }
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
/* A pair shares the space one monster had: the leader a little smaller, the
   companion smaller again, so the plate keeps its room. */
function pairSpriteSize(lead){ return Math.round(playerSpriteSize() * (lead ? 0.78 : 0.64)); }
/* The companion's plate, under the leader's: its name, its turns left, its
   block and its health. */
function companionPlateHtml(c){
  const p = pairOf(leaderMon());
  const turns = p ? p.turnsLeft : 0;
  return `<div class="comp-plate">
    <div class="mon-title comp-title">🤝 ${escapeHtml(displayName(c))}${crownMark(c)} <span>Lv ${c.level}</span>
      <b class="comp-turns" title="Turns left on the field">⏳${turns}</b></div>
    ${blockBar('companionBlk', c)}
    ${hpBar2('companionHp', c.currentHp, monMaxHp(c), false)}
  </div>`;
}
/* The summon: a small button with the companion's face — or, when it cannot
   come out now, the reason. Nothing at all without a bonded companion. */
function summonButtonHtml(canAct){
  const why = summonBlock();
  if(why === 'none' || why === 'out') return '';
  const l = leaderMon(), c = companionOf(l), p = pairOf(l);
  const face = monPortrait(c.species, 34, { view:'front', bare:true, stage:monStage(c), crowned:isCrowned(c) });
  const note = why === 'fallen' ? 'has fallen this fight'
             : why === 'tired'  ? 'resting — the recharge meter wakes it'
             : why === 'spent'  ? `no summons left (${COMPANION.maxSummons} a battle)`
             : why === 'down'   ? `${escapeHtml(displayName(l))} cannot share its core now`
             : `${COMPANION.summonWords} words · ${p.turnsLeft} turn${p.turnsLeft === 1 ? '' : 's'}`;
  const ok = !why && canAct;
  return `<button class="summon-btn" id="summonBtn" ${ok ? '' : 'disabled'}>${face}
    <span><b>Summon ${escapeHtml(displayName(c))}</b><small>${note}</small></span></button>`;
}
/* The line over the buttons while a companion is out: whose turn it is, and
   on the companion's, what it costs. */
function pairLineHtml(lead, comp, ctlMon, canAct){
  if(!comp && ctlMon === lead) return '';
  const n = m=> escapeHtml(displayName(m));
  const ctl = ui.battle && ui.battle.control;
  let t;
  if(canAct && ctlMon !== lead){
    const price = (ctl && ctl.paid) ? 'paid — its next move is free'
                : `any move for ${COMPANION.turnWords} words`;
    t = standingIn() ? `🤝 ${n(ctlMon)} stands in for ${n(lead)} · ${price}`
      : (ctl && ctl.extra) ? `⚡ ${n(ctlMon)} acts again · ${price}`
      : `🤝 ${n(ctlMon)}'s turn · ${price}`;
  }
  else if(canAct) t = `${n(lead)}'s turn`;
  else t = comp ? (standingIn() ? `🤝 ${n(comp)} stands in for ${n(lead)}` : `🤝 ${n(lead)} & ${n(comp)}`) : '';
  return t ? `<div class="pair-line">${t}</div>` : '';
}
/* A companion's button: its turn's 8 words (or "free" once they are paid)
   instead of the move's own, and a tail its move still asks for. */
function companionMeta(mv, comp){
  const ctl = ui.battle && ui.battle.control;
  const tail = companionTail(mv);
  const cost = ((ctl && ctl.paid) ? 'free' : `${COMPANION.turnWords}字`) + (tail ? ` +${tail}` : '');
  if(mv.windupReady) return `Ready · ${cost}`;
  const base = moveMeta(mv, comp);
  return /^\d+字/.test(base) ? base.replace(/^\d+字/, cost) : `${cost} · ${base}`;
}
let _companionCssDone = false;
function companionCss(){
  if(_companionCssDone || typeof document === 'undefined') return;
  _companionCssDone = true;
  const st = document.createElement('style');
  st.id = 'companionCss';
  st.textContent = `
  .player-card.pair{ gap:6px; }
  .player-card.pair .companion-avatar{ margin-left:-18px; align-self:flex-end; }
  .player-avatar.down .mon-sprite, .player-avatar.down img{ filter:grayscale(1) brightness(.8); opacity:.55; }
  .comp-plate{ margin-top:6px; padding-top:5px; border-top:1.5px dashed rgba(35,32,25,0.25); }
  .comp-title{ font-size:14px; }
  .comp-title span{ font-size:14px; }
  .comp-turns{ font-size:12px; font-weight:800; color:var(--ink); margin-left:4px; white-space:nowrap; }
  .summon-btn{ display:flex; align-items:center; gap:8px; margin-top:7px; width:100%; text-align:left;
    background:var(--paper-2); border:2px solid var(--jade); border-radius:12px; padding:4px 8px 4px 4px;
    cursor:pointer; box-shadow:0 2px 0 var(--jade-dark); font:inherit; color:var(--ink); }
  .summon-btn b{ display:block; font-family:'Baloo 2',cursive; font-size:13px; line-height:1.1; }
  .summon-btn small{ display:block; font-size:10px; font-weight:700; color:var(--ink-soft); }
  .summon-btn:disabled{ opacity:.55; cursor:default; box-shadow:none; border-color:var(--line); }
  .summon-btn .mon-portrait, .summon-btn .mon-sprite{ flex-shrink:0; }
  .pair-line{ text-align:center; font-size:12px; font-weight:800; color:var(--jade-dark); margin:-4px 0 8px; }
  .mon-title .foe-comp-tag{ color:#8a5a1a; font-weight:800; }
  `;
  document.head.appendChild(st);
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
  if(!ui.battle) return 1;                 // no battle, no buffs: the plain figure
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
  /* Steel Soul's bonus rides the same buffs as the strike (2.81) */
  const soul = getPStatus(0,'steelSoul');
  const bonus = (soul && soul.owner === mon.uid) ? (soul.bonus || 0) : 0;
  const dmg = (per + bonus) * atk * ownBuffMultiplier() * steelSoulAmp(monRef(mon), true);
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
  if(mv.revitalise) return 'Revive';
  if(mv.soul) return 'Quick';                    // costs no turn (2.93)
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
  /* Caladrius: everything is measured against its own (enormous) max health. */
  const maxHp = mon ? monMaxHp(mon) : 0;
  const ofHp = f => maxHp ? `<b>${Math.ceil(f * maxHp)} HP</b> (${Math.round(f * 100)}% of its max health)`
                          : `<b>${Math.round(f * 100)}%</b> of its max health`;
  if(mv.vita) out.push(
    `<b>Vita.</b> At once, everyone still standing on your side is healed by ${ofHp(mv.vita.pulse || 0.2)}. ` +
    `Then the light stays for <b>${mv.vita.turns || 5} turns</b>, and every turn it heals whichever teammate ` +
    `is worst off by the same amount. Casting it again starts the turns over; it never stacks.`);
  if(mv.conversio) out.push(
    `<b>Conversio.</b> Brings up to <b>${mv.conversio.revives || 2} fainted teammates</b> back with ` +
    `<b>${Math.round((mv.conversio.pct || 0.33) * 100)}%</b> of their health. Every one it raises leaves a dark ` +
    `<b>Mors mark</b> on this bird — at <b>3 marks</b> it folds its wings and falls, and nothing can bring it back. ` +
    `If nobody has fainted, the light turns outward instead and takes ${ofHp(mv.conversio.direct || 0.33)} ` +
    `from an enemy, straight through any guard. That does not mark it.`);
  if(mv.lunacy) out.push(
    `<b>Lunacy.</b> If it lands, a <b>${Math.round((mv.lunacy.chance || 0.25) * 100)}%</b> chance that every enemy ` +
    `is muddled for its next swing: the blow lands on its own side (on itself, if it stands alone) at ` +
    `<b>${Math.round((mv.lunacy.ffPower || 1) * 100)}%</b> of its power. Diamond Dust keeps it out.`);
  /* The Whalelord's kit: mechanics first and plainly, with his real numbers.
     At most one sentence of flavour, and only before the mechanics. */
  if(mv.vengeance){
    const n = mv.vengeance.hits || 3;
    const per = Math.ceil((mv.mult || 0.6) * atk);
    const fall = mv.vengeance.perFallen || 0;
    out.push(
      `<b>${n} blows</b> of <b>${per}</b> damage, each on a different enemy. With fewer than ${n} enemies, ` +
      `the extra blows hit the same enemies again. <b>${per * n}</b> in all.`);
    if(fall){
      const cap = Math.ceil(((mv.mult || 0.6) + fall * (mv.vengeance.fallenCap || 6)) * atk);
      out.push(
        `Each of your monsters that has fainted adds <b>+${Math.ceil(fall * atk)}</b> to every blow, ` +
        `up to ${mv.vengeance.fallenCap || 6} of them: at most <b>${cap}</b> a blow, <b>${cap * n}</b> in all.`);
    }
    out.push(`Afterwards you may <b>swap him out for free</b>, without losing your turn.`);
  }
  if(mv.wrath) out.push(
    `Then, for <b>${mv.wrath.turns} turns</b>, every move an enemy makes, hit or miss, adds a <b>grudge</b> ` +
    `(up to ${mv.wrath.dmgCap}). Each grudge gives all your damage <b>+${Math.round(mv.wrath.bonus * 100)}%</b> ` +
    `(up to +${Math.round(mv.wrath.bonusCap * 100)}%). Swap him back in before the ${mv.wrath.turns} turns end ` +
    `and every grudge strikes at once: <b>${Math.ceil(mv.wrath.per * atk)}</b> to every enemy, per grudge.`);
  if(mv.grudge){
    const flat = (mv.grudge.flat || 0.25) * atk, part = mv.grudge.missing || 0.75;
    const max = mon ? monMaxHp(mon) : 0;
    const at = missing => Math.ceil(flat + part * missing);
    out.push(
      `Hits <b>every enemy</b> for <b>${Math.ceil(flat)}</b> plus <b>${Math.round(part * 100)}% of the health ` +
      `he has lost</b>.` + (max
        ? ` At full health: <b>${at(0)}</b>. At half health: <b>${at(Math.floor(max / 2))}</b>. At 1 HP: <b>${at(max - 1)}</b>.`
        : ''));
  }
  if(mv.aria){
    const ch = mv.aria.chance == null ? 0.5 : mv.aria.chance;
    out.push(
      `Haunting Aria triggers automatically when enemies attack the Whalelord, causing their attacks to pass ` +
      `through harmlessly for one turn — the first turn they actually attack (a turn in which nobody attacks ` +
      `does not use it up). You can also spell to trigger it <b>without consuming a turn</b>.`);
    out.push(
      `Then, for <b>${mv.aria.turns} turns</b>, the Whalelord haunts his enemies, with a <b>${Math.round(ch * 100)}%</b> ` +
      `chance each turn to strike every enemy for <b>${Math.ceil((mv.aria.pulse || 0.5) * atk)}</b> damage. ` +
      `Enemy attacks incur his vengeance, raising the chance to <b>100%</b>.`);
    out.push(`Haunting Aria cannot be triggered again until the previous Aria has ended.`);
  }
  if(mv.passive && mv.passive.noFlee) out.push(
    `While he is out, <b>no enemy can flee</b> — not even an Elusive one.`);
  if(mv.statNote) out.push(
    `<b>Pacificus.</b> Not a move at all — it is what this bird is. Half of its attack is given up for ` +
    `health: its health grows half again as fast as other legendaries', and its attack only half as fast. ` +
    `Vita and Conversio are both measured by that enormous health. It has no Max move; this is its place.`);
  if(mv.revitalise) out.push(
    `<b>Revive.</b> Brings <b>one fainted teammate</b> back into the fight with ` +
    `<b>${Math.round((mv.revitalise.pct||0.1)*100)}%</b> of its health. You choose who, then write the words. ` +
    `If nobody has fainted, it costs nothing to try.`);
  if(mv.soul){
    const r = mv.soul.reduce, pct = Math.round(r * 100);
    out.push(
    `<b>Steel Soul — a passive and a quick cast.</b> ` +
    `<b>Passive:</b> once it has learnt this, it always takes <b>${pct}% less damage</b> — this monster alone. ` +
    `A ✦ Curse mutes it, as it does any passive. ` +
    `<b>Quick cast:</b> ${mv.words} words that <b>cost no turn</b> — you choose its move straight after. ` +
    `<b>Once a battle</b>; the ${RECHARGE_TARGET}-word recharge meter gives it back. ` +
    `For <b>that turn only</b> (your Diamond Dust cannot hold it open) it adds <b>+${Math.ceil(mv.soul.bonus*atk)}</b> ` +
    `(${mv.soul.bonus}× ATK) to every hit it lands — each strike of a multi-strike move, skill-stone and Ultra moves too — ` +
    `and turns <b>every damage reduction</b> your side has up into damage, each multiplying the rest: its own ${pct}% ` +
    `<b>×${1 + r}</b>, Spike Armour <b>×1.2–1.3</b>, Steel Aegis <b>×1.3–1.4</b>, a Curse ward <b>×1.1–1.15</b>, ` +
    `a Lava Shell <b>×1.6</b> — with a Steel Aegis up it hits <b>×${+((1 + r) * 1.3).toFixed(2)}</b>. ` +
    `Overheat, Dragon Dance and a Curse on the target multiply all of it as they do the hit. ` +
    `An Aftershock laid that turn hits for 0.3× instead of 0.2×, and keeps it. ` +
    `Written wrong, the turn and the cast are both spent, as a stone's are; scattered by their Diamond Dust, ` +
    `neither is. Only this monster benefits. In an enemy's hands it is the same: their shields — and a Steel it ` +
    `walked in with — make it hit harder that turn, and it still swings in the same action.`);
  }
  if(mv.purge) out.push(
    `<b>Purge.</b> When it reaches them it is a small Diamond Dust: it sweeps away ` +
    `<b>${mv.purge.enemyBuffs || 0} of their buff${(mv.purge.enemyBuffs || 0) === 1 ? '' : 's'}</b> (an Overheat, a Diamond Dust, ` +
    `a block, a stance, an Aftershock — one at random) and burns <b>${mv.purge.playerDebuffs || 0} of their ` +
    `mark${(mv.purge.playerDebuffs || 0) === 1 ? '' : 's'}</b> off your side (a stun, a Curse, a Charm, their seeds — one at random). ` +
    `What a creature simply is stays, and no dust stops it. In an enemy's hands it does the same to yours.`);
  if(mv.tachy) out.push(
    `<b>Tachypsychia.</b> For ${mv.tachy.turns} turns, each time this monster acts there is a ` +
    `<b>${Math.round(mv.tachy.bonusAction*100)}% chance to act again</b> — and that can chain, up to ` +
    `<b>${TACHY_MAX_EXTRAS} extra actions a round</b>. ` +
    `It also dodges <b>${Math.round(mv.tachy.evadeFirst*100)}%</b> of attacks on the first turn it is attacked ` +
    `(a turn nobody attacks does not use it up), then <b>${Math.round(mv.tachy.evadeAfter*100)}%</b> after. ` +
    `While it runs, <b>this monster's attacks can't be dodged</b>. If an extra action comes up with nobody ` +
    `left standing, it is <b>saved for this monster's next turn</b> — saved ones pile up until Tachypsychia or the ` +
    `battle ends. Your Diamond Dust keeps it at ${mv.tachy.turns} turns for as long as the dust lasts. ` +
    `All of it is this monster's alone: whoever takes its place gets none of it.`);
  if(mv.mindRead) out.push(`<b>Mind-read:</b> this attack ignores evasion — it cannot be dodged.`);
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
    if(g.lurk)      bits.push(`slips back into hiding and <b>Lurks</b> again — every attack misses it until it next tries to deal damage`);
    if(g.evadeTurns) bits.push(`dodges <b>${Math.round((g.evadeChance || 1)*100)}%</b> of attacks for ${g.evadeTurns} turn${g.evadeTurns > 1 ? 's' : ''}`);
    if(g.omen)      bits.push(`makes its <b>next blow ${Math.round(g.omen*100)}% harder</b>`);
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
  if(mv.softenHit) out.push(mv.softenHit.chance >= 1
    ? `Every enemy it hits is <b>weakened</b>: its next attack does <b>${Math.round((1 - (mv.softenHit.amount || 0.5))*100)}%</b> damage.`
    : `Each enemy it hits has a <b>${Math.round(mv.softenHit.chance*100)}% chance</b> to be <b>weakened</b>: its next attack does <b>${Math.round((1 - (mv.softenHit.amount || 0.5))*100)}%</b> damage.`);
  if(mv.execute) out.push(
    `Against a target under <b>${Math.round((mv.execute.below || 0.3)*100)}%</b> health it strikes <b>${mv.execute.hits} times</b> instead of ${mv.hits}.`);
  if(mv.spendLurk) out.push(
    `From a <b>Lurk</b> it lands <b>${mv.spendLurk}×</b> as hard: <b>${Math.ceil((mv.mult || 0) * mv.spendLurk * atk)}</b> damage.`);
  if(mv.windup) out.push(
    `Costs a turn to wind up${mv.windup.name ? ` (<b>${escapeHtml(mv.windup.name)}</b>)` : ''} — a Lurk holds through it — and comes down ` +
    `on the next turn for <b>no words</b>. Choosing any other move lets it go.`);
  if(mv.extinguish){
    const hp = mon ? mon.currentHp : 0;
    out.push(`<b>Extinguish.</b> Deals <b>${mv.extinguish.hpMult || 1.5}×</b> its current health to every enemy` +
      (hp ? ` — <b>${Math.ceil((mv.extinguish.hpMult || 1.5) * hp)}</b> right now` : '') + `, then it burns itself out and faints.`);
  }
  if(mv.repeat) out.push(
    `Has a <b>${Math.round(mv.repeat*100)}% chance to fire again</b> — and each repeat can spark another, with no limit.`);
  if(mv.first) out.push(
    `In an enemy's hands this always strikes first. In yours it deals <b>+${Math.ceil((mv.playerBonus||0)*atk)}</b> extra damage instead.`);
  if(mv.scale) out.push(mv.scale.words
    ? `Keep writing past the required words: each adds <b>+${mv.scale.per}×</b> ATK, and the ${mv.scale.words}th word ` +
      `lifts it to <b>${mv.scale.max}×</b> — up to <b>${Math.ceil(mv.scale.max*atk*ownBuffMultiplier())}</b>.`
    : `Keep writing past the required words: each adds <b>+${mv.scale.per}×</b> ATK, ` +
      `up to <b>${mv.scale.max}×</b> (<b>${Math.ceil(mv.scale.max*atk*ownBuffMultiplier())}</b>).`);
  if(mv.bonus && mv.bonus.sacredFlame) out.push(
    `Afterwards you may write <b>${mv.bonus.words} bonus words</b> from your whole list. Succeed and a <b>Sacred Flame</b> ` +
    `is laid on the field: it burns <b>all enemies at the start of each of your next ${SACRED_FLAME.turns} turns</b> for ` +
    `<b>${Math.ceil(SACRED_FLAME.pct*atk)}</b> damage (${SACRED_FLAME.pct}× ATK). Flames stack without limit, and an ` +
    `Overcharge repeat lays another on top.`);
  /* the Max ability carries the Rebirth passive */
  if(mon && hasRebirth(mon) && isMaxAbility(mon, mv)) out.push(
    `<b>Rebirth</b> (passive): if the Phoenix faints while a Sacred Flame burns, write <b>${REBIRTH.words} words</b> ` +
    `to rise again with <b>${Math.round(REBIRTH.hp*100)}% HP</b> (${Math.ceil(REBIRTH.hp*monMaxHp(mon))}). Once per battle.`);
  if(mv.bonus && mv.bonus.aftershock){
    const pct = aftershockPct(false), soulPct = aftershockPct(true);
    out.push(`Afterwards you may write <b>${mv.bonus.words} bonus words</b> from your whole list. Succeed and an ` +
      `<b>Aftershock</b> begins: it strikes <b>all enemies at the start of each of your next ${AFTERSHOCK.turns} turns</b> for ` +
      `<b>${Math.ceil(pct*atk)}</b> damage (${pct}× ATK) — <b>${Math.ceil(soulPct*atk)}</b> ` +
      `(${soulPct}×) if Steel Soul is up when it forms, which it keeps after Steel Soul ends. Aftershocks stack.`);
  } else if(mv.bonus && mv.bonus.mult){
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
  if(mv.charge){
    const d = mv.charge;
    const ns = Array.from({ length:chargeCaps(d).lucky }, (_, i)=> i + 1);
    const row = kind=> ns.map(n=> `<b>${chargeMult(d, kind, n)}×</b>`).join(' / ');
    out.push(
      `Costs the turn: gathers <b>1 charge</b> (up to <b>${d.max}</b>). While charged, <b>Charge</b> adds another, ` +
      `and <b>Unleash</b> (every enemy) or <b>Hyperbeam</b> (one enemy) cost no words. At ${ns.join(' / ')} ` +
      `charges: Unleash ${row('unleash')}, Hyperbeam ${row('hyper')} (${d.max + 1} only with an Overcharge double). ` +
      `The charge lasts one turn longer than its number of charges.`);
    out.push(
      `With <b>Overcharge</b> up, each charge has Overcharge's own chance to count <b>double</b> (certain on ✦'s ` +
      `first turn). Charging from <b>${d.max - 1}</b>, a double reaches <b>${d.max + 1}</b>, the only way past ${d.max}. ` +
      `At ${d.max} or more you can't charge again.`);
    out.push(
      `Switch him out with charges held and <b>Dragon Legacy</b> gives the next monster <b>+25% damage per charge</b> ` +
      `for its whole turn.`);
  }
  /* Passives describe their payload, not just their existence. */
  if(mv.passive){
    const p = mv.passive;
    const bits = [];
    if(p.block)        bits.push(`starts with <b>${p.block} damage-block stack${p.block>1?'s':''}</b> worth <b>${atk}</b> each`);
    if(p.guard)        bits.push(`starts <b>on guard</b>, gaining a block stack each turn`);
    if(p.airborne)     bits.push(`starts <b>airborne</b>, dodging <b>70%</b> of attacks for a turn`);
    if(p.invisible)    bits.push(`starts <b>unseen</b>, dodging <b>80%</b> of attacks for a turn`);
    if(p.evadeTurns)   bits.push(`begins in perfect <b>stillness</b> — every attack misses for the first ${p.evadeTurns > 1 ? p.evadeTurns + ' turns' : 'turn'} it is attacked (a turn nobody attacks it does not use it up)`);
    if(p.counterTurns || p.counterStack) bits.push(`begins with a <b>Counter stack</b> — one whole attack taken on the guard for <b>80% less</b>, and its next blow lands <b>25%</b> harder`);
    if(p.first)        bits.push(`always takes the <b>first move</b> of the round`);
    if(p.quick)        bits.push(`gets one free <b>quick attack</b> at the start of every round, before anyone moves: ` +
      `<b>${p.quick}×</b> ATK (<b>${Math.ceil(p.quick * atk)}</b>, before type and armour) on one enemy at random — ` +
      `it can be dodged, and a block stack soaks it, but no Counter guard meets it`);
    if(p.playerDouble) bits.push(`has a <b>${Math.round(p.playerDouble*100)}% chance to strike a second time</b>`);
    if(p.thresholdStun) bits.push(
      `punishes each health threshold it is driven below — <b>${p.thresholdStun.map(t=>Math.round(t*100)+'%').join(', ')}</b> — ` +
      `<b>stunning the attacker for a turn</b>, once per threshold`);
    if(p.evadeAlways)  bits.push(`dodges <b>${Math.round(p.evadeAlways*100)}%</b> of attacks${p.unsweepable ? ', and no sweep takes that away' : ''}`);
    if(p.lurk)         bits.push(`<b>Lurks</b> the first time it steps onto the field: every attack misses it until it tries to deal damage itself (a miss still counts)`);
    if(p.ambush)       bits.push(`the blow that ends its Lurk deals <b>+${Math.round((p.ambush - 1)*100)}%</b>`);
    if(p.bog)          bits.push(`bogs the other side down: they move <b>one step slower</b> for as long as it stands (the bog goes when it falls), and no sweep lifts it`);
    if(p.cunning){
      const c = p.cunning, f = c.first != null ? c.first : 1, a = c.after || 0;
      const how = (f >= 1 && !a) ? `the first time it deals damage, it turns <b>Cunning</b>`
                : (f >= 1) ? `the first time it deals damage it turns <b>Cunning</b> for certain, then has a <b>${Math.round(a*100)}%</b> chance each time after`
                : `each time it deals damage it has a <b>${Math.round(f*100)}%</b> chance to turn <b>Cunning</b>`;
      bits.push(`${how}: every attack misses it until it next tries to deal damage`);
    }
    if(p.lifesteal)    bits.push(`heals itself for <b>${Math.round(p.lifesteal*100)}%</b> of all the damage it deals`);
    if(p.riposte)      bits.push(`answers any attack that deals it no damage — dodged, or soaked by block — with a riposte of ` +
      `<b>${Math.ceil(p.riposte * atk)}</b> damage, one per attack, keeping its Lurk and Cunning (in enemy hands it also ` +
      `answers an attack that hits its friends and not it)`);
    if(p.greed)        bits.push(`<b>steals one of the other side's buffs</b> with every attack that lands — a side effect such as ` +
      `Overheat or Diamond Dust, or something the monster it hit was holding (block, a stance, a Lurk). The buff keeps its ` +
      `turns and works for your side now. The Whalelord's Aria and Wrath cannot be taken`);
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
  /* Revitalise says up front whether there is anyone to bring back. */
  if(mv.revitalise && ui.battle && !revivableFallen(mon).length) return `${mv.words}字 · Nobody fainted`;
  if(mv.windupReady) return `Ready · no words`;
  /* With Overcharge up, the button shows the chance that this charge counts double. */
  if((mv.chargeMore || mv.charge) && ui.battle && getPStatus(0,'overcharge'))
    return `${mv.words}字 · ${Math.round(overchargeChance() * 100)}% for +2`;
  /* Haunting Aria cannot be sung over itself: the button says why it is shut. */
  if(mv.aria && ui.battle && ariaActive()){
    const n = Math.max(0, ariaState().turnsLeft - 1);   // rolls still to come — what the badge shows
    return `${mv.words}字 · Active · ${n} turn${n === 1 ? '' : 's'} left`;
  }
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
  /* Only when nothing has happened for a while. A long sequence (a stone cast,
     a riposte, their afterimages) has quiet gaps with no attack queue, and
     unsticking in one of those handed the child the buttons mid-sequence. */
  if(Date.now() - (ui._battleActivity || 0) < 6000) return;
  if(b._cloneEchoing || b.attackQueue) return;       // a sequence is genuinely running
  const mon = frontMon();                            // (a companion standing in counts)
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
  ui._battleActivity = Date.now();
  startUnstickWatchdog();
  const zoneBg = (ui.battle && ui.battle.bgKey)
    || ((ui.currentZone && ui.currentZone.id) ? 'battle_'+ui.currentZone.id : null);
  setScreenBg(zoneBg || 'battle');
  const b = ui.battle;
  $('#brandSub').textContent = 'Battle';
  const mon = leaderMon();                       // the monster out front, whatever is in focus
  /* The buttons: the leader's moves, or — when one of yours acts alone — its
     own (a companion standing in, or taking an extra action it earned). */
  const ctlMon = controlMon() || mon;
  const moves = unlockedMoves(ctlMon);
  const comp = companionOnField();
  const compTurn = !!(comp && ctlMon === comp);        // the companion's own choice: its price
  // Turn-lock: buttons are only truly interactive once it's genuinely the
  // player's turn again — not just while their own move's animation plays,
  // and not during the enemy's turn. Fixes a bug where a second move could be
  // clicked mid-animation and its quiz silently got wiped on the next redraw.
  const canAct = (b.phase || 'player') === 'player';
  companionCss();
  screenEl.innerHTML = `
    <div class="battle-stage" id="battleStage">
      <div class="fx-layer" id="fxLayer" aria-hidden="true"></div>

      ${b.npcId ? `<div class="npc-banner">${npcPortrait(b.npcId, '🧑', 44, 'var(--paper-3)')}<span>${escapeHtml(b.name)}</span></div>` : ''}
      <div class="foe-side-row" id="foeSideRow"></div>
      <div class="enemy-row">
        ${b.enemies.map((e,i)=>`
          <div class="enemy-card ${e.hp<=0?'fainted':''}" data-enemy="${i}" id="enemy-${i}" style="width:${enemySpriteSize(b.enemies.length)+16}px;">
            <div class="enemy-status" id="enemyStatus-${i}"></div>
            <div class="bob avatar-layer" id="enemyBob-${i}">${monPortrait(e.species,enemySpriteSize(b.enemies.length),{view:'front',bare:true,crowned:!!e.crowned,stage:e.stage||0,breathe: e.hp>0 ? ((e.hp/e.maxHp)<0.3 ? 'weak':'normal') : null})}</div>
            <div class="info-layer name-plate">
              <div class="mon-title">${SPECIES[e.species].name} <span>Lv ${e.level}</span>${foeCompanionTag(e)}</div>
              ${blockBar('enemyBlk-'+i, e)}
              ${hpBar2('enemyHp-'+i, e.hp, e.maxHp, false)}
            </div>
          </div>`).join('')}
      </div>

      <div class="battlefield" aria-hidden="true"></div>

      <div class="player-card${comp ? ' pair' : ''}">
        <div class="bob player-avatar${mon.currentHp <= 0 ? ' down' : ''}" id="playerBob">${monPortrait(mon.species, comp ? pairSpriteSize(true) : playerSpriteSize(),{view:'back',bare:true,crowned:isCrowned(mon),stage:monStage(mon),breathe: mon.currentHp>0 ? ((mon.currentHp/monMaxHp(mon))<0.3 ? 'weak':'normal') : null})}</div>
        ${comp ? `<div class="bob player-avatar companion-avatar" id="companionBob">${monPortrait(comp.species, pairSpriteSize(false),{view:'back',bare:true,crowned:isCrowned(comp),stage:monStage(comp),breathe: comp.currentHp>0 ? ((comp.currentHp/monMaxHp(comp))<0.3 ? 'weak':'normal') : null})}</div>` : ''}
        <div class="info-layer name-plate player-plate">
          <div class="mon-title big">${escapeHtml(displayName(mon))}${crownMark(mon)} <span>Lv ${mon.level}</span></div>
          ${blockBar('playerBlk', mon)}
          ${hpBar2('playerHp', mon.currentHp, monMaxHp(mon), true)}
          <div class="atk-line">ATK ${monAtk(mon)}</div>
          <div class="recharge">
            <span style="width:${Math.min(100,(b.rechargeWords||0)/RECHARGE_TARGET*100)}%"></span>
            <b>${b.rechargeWords||0}/${RECHARGE_TARGET}</b>
          </div>
          ${comp ? companionPlateHtml(comp) : summonButtonHtml(canAct)}
        </div>
      </div>
    </div>
    <div id="statusRow" class="status-row"></div>
    <div id="battleMsg" style="text-align:center;font-weight:700;font-size:14px;min-height:20px;margin-bottom:10px;color:var(--ink-soft);">${canAct ? 'Choose a move.' : ''}</div>
    ${pairLineHtml(mon, comp, ctlMon, canAct)}
    <div style="display:flex;gap:12px;">
      <div style="flex:2;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${moves.map((mv,i)=>{
          /* A Haunting Aria already singing shuts its own button, so ten words
             can never be spent on nothing. */
          const ok = mv.available && canAct && !(mv.aria && ariaActive());
          return `
          <button class="move-btn ${ok?'':'locked'} ${mv.slot==='UltraStone'?'ultra-btn':''} ${mv.stonePlus?'refined-'+mv.stonePlus:''}" data-move="${i}" ${ok?'':'disabled'}>
            ${mv.slot==='UltraStone' ? ultraFizz(mv.stonePlus||0) : ''}
            <div class="mv-name">${mv.available || mv.chargeMore || mv.spent ? escapeHtml(mv.name) : '???'}</div>
            <div class="mv-meta">${mv.available ? (compTurn ? companionMeta(mv, ctlMon) : moveMeta(mv, ctlMon)) : (mv.chargeMore ? 'Full' : mv.spent ? `Used · back at ${RECHARGE_TARGET}字` : 'Locked')}</div>
          </button>`; }).join('')}
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
        <button class="side-btn" id="switchBtn" ${(b.switchedThisTurn || !canAct)?'disabled':''}>🔄 Switch</button>
        <button class="side-btn" id="fleeBtn" ${(b.noFlee || !canAct)?'disabled':''}>${b.arena?'🚪 Exit':b.coreSpar?'🏳️ Give up':(b.noFlee?'🚫 No fleeing':'🏃 Flee')}</button>
        <button class="side-btn" id="skipBtn" ${canAct?'':'disabled'}>⏭️ Skip turn</button>
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
  const smb = $('#summonBtn');
  if(smb) smb.addEventListener('click', onSummonPressed);
  const sk = $('#skipBtn');
  if(sk) sk.addEventListener('click', ()=>{
    /* Pass the turn without acting — exactly what a misspelled move does, so
       nobody has to misspell on purpose. No bonus action, no repeat; a Dragon
       Legacy waiting for its turn keeps waiting. With a companion out, each
       passes only its own turn (2.85). */
    if((ui.battle.phase || 'player') !== 'player') return;
    ui.battle.phase = 'resolving';
    noteSkip();
    renderBattle();
    battleMsg('⏭️ Turn skipped.');
    setTimeout(advanceTurn, 500);
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
  counter:'↩️ Counter', combo:'👊 Combo', enrage:'🔥 Enrage', mirageImages:'👥 Afterimages', iceTomb:'🧊 Frozen', deepFreeze:'🧊 Deep Freeze', frostArmour:'❄️ Frost Armour', curse:'👻 Cursed', stunned:'💫 Stunned', machDragon:'🐉 Mach Dragon', softened:'🌀 Weakened', evadeTurns:'🧘 Still', asleep:'💤 Asleep',
  discombobulate:'🌀 Confused', confusionField:'🌀 Heads Spinning', leechSeed:'🌿 Leeched', elusive:'💨 Elusive', gooed:'🌋 Pinned', enraged:'🐋 Enraged', aria:'👻 Haunting Aria', wrath:'💢 Gathering Wrath', paralysed:'💫 Stunned', airborne:'🕊 Airborne', invisible:'👤 Unseen', guard:'🛡 Guard', prep:'🎯 Prep', diamondDust:'💎 Diamond Dust', curseWard:'👻 Warded', charm:'💗 Charmed', charmed:'💗 Charmed', disrupt:'📡 Disrupt', paralysed:'⚡ Paralysed', tachy:'🌀 Tachypsychia', steelSoul:'🛡 Steel Soul', shell:'🌋 Shell', clones:'👥 Clones', dot:'🔥 Burning',
  dragonDance:'🐉 Dragon Dance', steelAegis:'🛡 Steel Aegis', mirage:'✨ Mirage',
  vita:'🕊 Vita', jaws:'🔥 Held Fast', bogged:'🌫 Bogged', lurk:'🌑 Lurk', cunning:'🌘 Cunning',
};
function renderStatusBadges(){
  if(!ui.battle) return;
  pruneBogs();
  // Player-side statuses stay in the shared row under the stage.
  const row = $('#statusRow');
  if(row){
    const out = [];
    const mon = leaderMon();
    Object.values(partyStatuses()).concat(monStatuses(mon)).forEach(st=>{
      // turnsLeft is stored with a +1 grace so the cast turn counts; show the
      // number of turns the player will actually still have it for.
      const shown = Math.max(0, st.turnsLeft - 1);
      /* What the enemy has put on you is theirs, and reads in their colour. */
      const cls = isEnemyOwned(st.type, st) ? 'foe' : 'mine';
      const n = st.unsweepable ? '' : st.type === 'steelSoul' ? ' · this turn' : ` ${shown}`;   // a quick buff (2.93)
      const saved = (st.type === 'tachy' && st.banked > 0) ? ` · ⚡${st.banked} saved` : '';
      out.push(`<span class="status-pill ${cls}">${STATUS_LABELS[st.type]||st.type}${n}${saved}</span>`);
    });
    const af = aftershockBonusHits();
    if(af) out.push(`<span class="status-pill mine">💥 Aftershock ×${af}</span>`);
    const sfl = sacredFlameCount();
    const phx = [mon, companionOnField()].find(m=> m && hasRebirth(m));    // (a companion phoenix rises too)
    if(sfl) out.push(`<span class="status-pill mine">🔥 Sacred Flame ×${sfl}${(phx && !ui.battle.rebirthUsed) ? ' · Rebirth ready' : ''}</span>`);
    refreshAllBlockBars();
    const wr = getPStatus(0,'wrath');
    if(wr && wr.stacks) out.push(`<span class="status-pill">💢 Wrath ×${wr.stacks}</span>`);
    const me1 = mon;
    const cl = counterList(me1);
    if(cl.length){
      const best = Math.max(...cl.map(s=>s.tier));
      const mark = ['','+','✦'][best] || '';
      out.push(`<span class="status-pill">🛡 Counter ×${cl.length}${mark?' '+mark:''}</span>`);
    }
    const me0 = mon;
    const pc = (ui.battle && ui.battle.pCombo) || 0;
    const ps = partyCounters().length;
    if(ps) out.push(`<span class="status-pill">🛡 Counter ×${ps}</span>`);
    if(pc) out.push(`<span class="status-pill">👊 Combo ×${pc}</span>`);
    if(me0 && me0.enrageStacks) out.push(`<span class="status-pill">🔥 Enrage ×${me0.enrageStacks} (+${enrageBonus(me0)} ATK)</span>`);
    if(me0) paintEnrage(me0);
    const mir1 = getPStatus(0,'mirage');
    if(mir1 && mir1.pending) out.push(`<span class="status-pill">👥 Afterimages ×${mir1.pending}</span>`);
    const sp2 = stancePills(mon);
    if(sp2) out.push(sp2);
    /* The companion's own: its debuffs, its stances, its Enrage — marked 🤝 so
       nobody reads them as the leader's. */
    const cm = companionOnField();
    if(cm){
      const own = monStatuses(cm).map(st=>{
        const cls = isEnemyOwned(st.type, st) ? 'foe' : 'mine';
        return `<span class="status-pill ${cls}">🤝 ${STATUS_LABELS[st.type]||st.type} ${Math.max(0, st.turnsLeft - 1)}</span>`;
      });
      const sp3 = stancePills(cm);
      if(sp3) own.push(sp3.replace(/<span class="status-pill mine">/g, '<span class="status-pill mine">🤝 '));
      if(cm.enrageStacks) own.push(`<span class="status-pill">🤝 🔥 Enrage ×${cm.enrageStacks}</span>`);
      paintEnrage(cm);
      out.push(...own);
    }
    row.innerHTML = out.join('');
  }
  /* The enemy side's own side-wide buffs: one row above their cards, since they
     belong to the whole side rather than to any one of them. */
  const fr = $('#foeSideRow');
  if(fr){
    fr.innerHTML = Object.values(enemySideStatuses()).map(st=>{
      const shown = Math.max(0, st.turnsLeft - 1);
      const saved = (st.type === 'tachy' && st.banked > 0) ? ` · ⚡${st.banked} saved` : '';
      const n = st.unsweepable ? '' : st.type === 'steelSoul' ? ' · this turn' : ' ' + shown;   // a quick buff (2.93)
      return `<span class="status-pill foe">${STATUS_LABELS[st.type]||st.type}${n}${saved}</span>`;
    }).join('');
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
    if(e.lurk)           extras.push('<span class="status-pill foe">🌑 Lurk</span>');
    if(e.cunning)        extras.push('<span class="status-pill foe">🌘 Cunning</span>');
    if(e._windup)        extras.push(`<span class="status-pill foe">⏳ ${escapeHtml(e._windup[1] || '')}</span>`);
    if(e._omen)          extras.push('<span class="status-pill foe">🐦‍⬛ Ill Omen</span>');
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
    const pd = passiveDefOf(e);
    if(pd) extras.push(passivesMuted(e)
      ? `<span class="status-pill foe" style="opacity:.75;text-decoration:line-through;">🔇 ${pd.name}</span>`
      : `<span class="status-pill foe">✨ ${pd.name}</span>`);
    slot.innerHTML = eStatuses(e).map(st=>{
      const extra = st.type==='iceTomb' ? ` ${st.turnsLeft}` : '';
      return `<span class="status-pill foe">${STATUS_LABELS[st.type]||st.type}${extra}</span>`;
    }).join('') + extras.join('');
  });
  paintConcealment();
}

/* ---------- EFFECT LAYER ----------
   #fxLayer spans the whole rectangle containing the enemy row AND the player
   card. It sits above the monster avatars but below HP bars / names / text, so
   move animations can play across the full battle area.
   playEffect() is the hook for future art: if no asset is registered for the
   move it degrades to a short text flash + delay (per the design rule). */
