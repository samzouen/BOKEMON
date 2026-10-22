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
const MON_DEBUFFS = new Set(['stunned', 'asleep', 'softened', 'discombobulate', 'iceTomb', 'blinded']);   // (3.16) a freeze is the monster's own; (3.25) so is a blinding
function monStatuses(m){
  const b = ui.battle;
  if(!b || !m || !m.uid) return [];
  b.monStatus = b.monStatus || {};
  return (b.monStatus[m.uid] = b.monStatus[m.uid] || []);
}
function getMStatus(m, type){ return monStatuses(m).find(s=> s.type === type) || null; }
function setMStatus(m, status){
  if(!ui.battle || !m || !status) return null;
  if(ironWillHolds(m, status)){ floatOver(m, 'IRON WILL'); return null; }   // no sleep, stun or muddle (2.97)
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

/* One muddled turn: this enemy's next swing lands on its own side.
   (3.16) `self`: a Discombobulate confusion's self-hit, × the muddled one's
   own ATK (rollSelf). Without it — a Lunacy — the swing is its move at
   `ffPower` of its power, as before. */
function markConfused(e, ffPower, once, self){
  /* `once` (Lunacy, 2.88): muddled for its next swing, this round or the
     next, as a muddle cast on you mid-round is (markPlayerConfused's `fresh`). */
  addEStatus(e, Object.assign({ type:'discombobulate', turnsLeft:2, mine:true },
                              self ? { self } : { ffPower:ffPower || 0.60 },
                              once ? { once:true, fresh:true } : {}));
}
/* (3.16) A Discombobulate confusion's self-hit, rolled as it lands: from
   `range[0]` to `range[1]` × the confused one's ATK. */
function rollSelf(range){
  const r = range || [0.5, 0.8];
  return +(r[0] + Math.random() * (r[1] - r[0])).toFixed(2);
}
/* What a confusion will cost its holder (or the friend it clouts) when it
   swings, for its badge: `self` × its ATK, or '' for a Lunacy's. */
function confusionHit(m, st){
  if(!st || !st.self || !m) return 0;
  return Math.max(1, Math.ceil(st.self * (m.uid ? monAtk(m) : enemyAtk(m))));
}
/* THE END PHASE'S DISCOMBOBULATE (3.16 — it was the start of the round's
   discombobulatePulse). After the statuses have aged (tickStatuses — which
   also clears a nap that has cost its turn), last turn's confusion clears —
   a Lunacy not yet swung under keeps its one swing — and each field catches
   whoever it catches, the newly arrived as readily as the rest: confused
   (its self-hit rolled now) or, at + and ✦, asleep instead. What it catches
   lasts through the next turn, to the next end phase, so the other side's
   psychics can feed on it (Exploit, Dream Eater, Feeding Frenzy).
   A field's certain turn (`sure`) is not spent until somebody has actually
   swung confused (`sureUsed`, set by the swing itself). A turn in which
   nobody on that side swung — all knocked out first, asleep, frozen, or the
   field came after their turns — keeps it, and everyone standing there is
   confused again, new arrivals included (2.74). Either side's; each monster
   of yours on the field on its own (2.84). Called by endRound and as a new
   wave arrives (onWaveCleared). Returns a line, or ''. */
function discombobulateEndPhase(){
  const b = ui.battle;
  if(!b) return '';
  const caught = [], napped = [];
  /* Their field on you. */
  const ef = getESide('confusionField');
  const sureE = !!(ef && ef.sure && !ef.sureUsed);
  livingField().forEach(pm=> withFocus(pm, ()=>{
    const st = getPStatus(0,'discombobulate');
    if(st && st.fresh) st.fresh = false;             // a Lunacy it has not swung under yet
    else if(st) removePStatus(0,'discombobulate');
    if(!ef) return;
    if(sureE){
      if(!getPStatus(0,'discombobulate')){ markPlayerConfused(null, false, rollSelf(ef.self)); if(getPStatus(0,'discombobulate')) caught.push(displayName(pm)); }
      return;
    }
    if(getPStatus(0,'discombobulate') || getPStatus(0,'asleep') || Math.random() >= (ef.after || 0)) return;
    if(ef.sleep && Math.random() < ef.sleep){
      if(ironWillHolds(pm, { type:'asleep' })){ floatOver(pm, 'IRON WILL'); return; }
      setPStatus(0, { type:'asleep', by:'enemy', field:true });
      if(getPStatus(0,'asleep')) napped.push(displayName(pm));
      return;
    }
    markPlayerConfused(null, false, rollSelf(ef.self));
    if(getPStatus(0,'discombobulate')) caught.push(displayName(pm));
  }));
  if(ef && !sureE) ef.sure = false;
  /* Yours on them. */
  const f = getPStatus(0,'confusionField');
  livingEnemies().forEach(e=>{
    const st = getEStatus(e,'discombobulate');
    if(st && st.once && st.fresh){ st.fresh = false; return; }   // a Lunacy it has not swung under yet
    removeEStatus(e,'discombobulate');
  });
  if(f){
    const sure = !!(f.sure && !f.sureUsed);
    if(!sure) f.sure = false;
    livingEnemies().forEach(e=>{
      const name = SPECIES[e.species].name;
      if(sure){
        if(!getEStatus(e,'discombobulate')){ markConfused(e, null, false, rollSelf(f.self)); if(getEStatus(e,'discombobulate')) caught.push(name); }
        return;
      }
      if(getEStatus(e,'discombobulate') || getEStatus(e,'asleep') || Math.random() >= (f.after || 0)) return;
      if(f.sleep && Math.random() < f.sleep){
        if(ironWillHolds(e, { type:'asleep' })){ floatOver(e, 'IRON WILL'); return; }
        addEStatus(e, { type:'asleep', mine:true, field:true });   // one of its turns, to the end of that turn
        if(getEStatus(e,'asleep')) napped.push(name);
        return;
      }
      markConfused(e, null, false, rollSelf(f.self));
      if(getEStatus(e,'discombobulate')) caught.push(name);
    });
  }
  if(!caught.length && !napped.length) return '';
  renderStatusBadges();
  const list = a=> a.length > 2 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(' and ');
  return '🌀 ' + [caught.length ? `${list(caught)} ${caught.length > 1 ? 'are' : 'is'} confused` : '',
                   napped.length ? `${list(napped)} ${napped.length > 1 ? 'fall' : 'falls'} asleep` : ''].filter(Boolean).join('; ') + '.';
}

/* (3.13) Organosteel Body (Cyborg): the shields it arrives with are its
   passive's `block` (applyPassiveGrant); this is the one more it raises at
   the end of every turn after — `organosteel` of them, worth its ATK each.
   Read through passiveOf, so a ✦ Curse on its side stops it; no dust does
   (shields are beyond Diamond Dust since 3.13). Either side's. */
function organosteelTurn(m, atk){
  if(!m || (m.uid ? m.currentHp : m.hp) <= 0) return;
  const p = passiveOf(m);
  if(!p || !p.organosteel) return;
  grantBlock(m, p.organosteel, atk);
  const who = m.uid ? displayName(m) : SPECIES[m.species].name;
  battleMsg(`⚙️ ${escapeHtml(who)}'s Organosteel Body raises ${p.organosteel > 1 ? p.organosteel + ' more shields' : 'another shield'} — <b>${m.blockStacks}</b> now.`);
  logBattle(`⚙️ ${who}'s Organosteel Body raises ${p.organosteel} shield${p.organosteel > 1 ? 's' : ''} (${m.blockStacks} now).`);
}
/* ---------- ICE TOMB'S FREEZE AND CHILL (3.16) ----------
   The freeze (`iceTomb`) is on each one frozen and counts its own turns:
   each turn it loses takes one off (runSingleEnemyTurn, playerHeldDown), and
   no round ages it — so "frozen for 2 turns" is two of its turns, whenever
   it was cast. Yours carry `byTurn` so tickStatuses leaves it alone. The
   chill is a field on the frozen side (yours on them in b.fieldStatus and on
   each of them; theirs on you in your party statuses). Either side's. */
function freezeFoe(e, n){
  if(!e || e.hp <= 0) return false;
  const cur = getEStatus(e,'iceTomb');
  if(cur){ cur.turnsLeft = Math.max(cur.turnsLeft || 0, n); return true; }
  addEStatus(e, { type:'iceTomb', turnsLeft:n, mine:true });
  return !!getEStatus(e,'iceTomb');
}
function freezeMine(m, n){
  if(!m || m.currentHp <= 0) return false;
  const cur = getMStatus(m,'iceTomb');
  if(cur){ cur.turnsLeft = Math.max(cur.turnsLeft || 0, n); return true; }
  return !!setMStatus(m, { type:'iceTomb', turnsLeft:n, byTurn:true, by:'enemy' });
}
/* What the other side's ice takes off everything `side` deals: an Ice
   Barrier's cut and Ice Tomb's chill, each multiplying the other — "together
   they halve enemy attack" (0.7 × 0.7 = 0.49). 1 with neither. */
function attackCut(side){
  const b = ui.battle;
  if(!b) return 1;
  let m = 1;
  if(side === 'player'){
    const ib = getESide('iceBarrier');
    if(ib) m *= 1 - (ib.cut || 0.30);
    const ch = getPStatus(0,'chill');
    if(ch && isEnemyOwned('chill', ch)) m *= 1 - (ch.cut || 0);
  } else {
    const ib = getPStatus(0,'iceBarrier');
    if(ib) m *= 1 - (ib.cut || 0.30);
    const ch = b.fieldStatus && b.fieldStatus.chill;
    if(ch) m *= 1 - (ch.cut || 0);
  }
  return m;
}
/* ✦ Ice Tomb: at the start of every turn each one under its chill may
   freeze again, for that turn. Returns a line, or ''. */
function chillRefreeze(){
  const b = ui.battle;
  if(!b) return '';
  const out = [];
  const fs = b.fieldStatus && b.fieldStatus.chill;
  if(fs && fs.refreeze){
    livingEnemies().forEach(e=>{
      if(getEStatus(e,'iceTomb') || Math.random() >= fs.refreeze) return;
      if(freezeFoe(e, 1)) out.push(SPECIES[e.species].name);
    });
  }
  const ch = getPStatus(0,'chill');
  if(ch && ch.refreeze && isEnemyOwned('chill', ch)){
    livingField().forEach(m=>{
      if(getMStatus(m,'iceTomb') || Math.random() >= ch.refreeze) return;
      if(freezeMine(m, 1)) out.push(displayName(m));
    });
  }
  if(!out.length) return '';
  renderStatusBadges();
  return `🧊 The chill bites — ${out.join(' and ')} ${out.length > 1 ? 'freeze' : 'freezes'} again for this turn!`;
}

/* ---------- ICE BARRIER (3.16) ----------
   Caladrius's Power1, reworked — the designer: "an instant move (doesn't
   consume a turn) that reduces enemy attack by 30% for 5 turns and purges 1
   harmful effect on player monsters per turn. Can be extended by diamond
   dust". A buff of the caster's side (`iceBarrier`): the other side's
   attacks deal `cut` less (attackCut — in computeDamage, so before any
   shield soaks what is left); one of the other side's marks on its side
   melts away as it is cast, and one more at the start of every turn while
   it stands (iceBarrierPulse). Its own side's Diamond Dust holds it open;
   the other side's keeps it from forming and sweeps it. Either side's.
   (The 3.14 Ice Barrier — shields, a half-damage barrier to its next turn
   and two marks off — is gone; castBarrier stays for the Mime's Invisible
   Wall, Pillow Puff, Bandage Wall and the Firewall.) */
function purgeMarks(side, n){
  const burnt = [];
  for(let k = 0; k < (n || 0); k++){
    const pool = marksOnSide(side);
    if(!pool.length) break;
    const x = pool[Math.floor(Math.random() * pool.length)];
    x.take(); burnt.push(x.label);
  }
  if(burnt.length) setTimeout(refreshAllBlockBars, 0);
  return burnt;
}
function castIceBarrier(side, caster, def, name){
  const b = ui.battle;
  if(!b || !caster || !def) return '';
  const yours = side === 'player';
  const who = yours ? displayName(caster) : SPECIES[caster.species].name;
  const T = def.turns || 5, cut = def.cut || 0.30, nm = escapeHtml(name || 'Ice Barrier');
  const head = `🧊 ${yours ? '' : escapeHtml(who) + ' uses '}<b>${nm}</b>`;
  const st = { type:'iceBarrier', turnsLeft:T + 1, max:T + 1, cut, purge:def.purge || 1 };
  const held = yours ? setPStatus(0, Object.assign(st, { owner:caster.uid })) : setESide(Object.assign(st, { owner:caster }));
  if(!held){
    logBattle(`🧊 ${who}: ${name || 'Ice Barrier'} — scattered by the dust`);
    return `${head} — but ${yours ? 'their' : 'your'} diamond dust will not let it form.`;
  }
  const burnt = purgeMarks(side, def.purge || 1);
  logBattle(`🧊 ${who}: ${name || 'Ice Barrier'} — the other side deals ${Math.round(cut * 100)}% less for ${T} turns` +
            (burnt.length ? `; melted: ${burnt.join(', ')}` : ''));
  return `${head} — for <b>${T} turns</b> ${yours ? 'their' : 'your'} attacks deal <b>${Math.round(cut * 100)}% less</b>` +
         (burnt.length ? `, and ${burnt.join(' and ')} melts off ${yours ? 'your side' : 'theirs'}` : '') + '.';
}
/* The start of every turn: each side's Ice Barrier melts one more of the
   other side's marks off it. Returns a line, or ''. */
function iceBarrierPulse(){
  if(!ui.battle) return '';
  const lines = [];
  ['player', 'enemy'].forEach(side=>{
    const st = side === 'player' ? getPStatus(0,'iceBarrier') : getESide('iceBarrier');
    if(!st) return;
    const burnt = purgeMarks(side, st.purge || 1);
    if(burnt.length) lines.push(`🧊 ${side === 'player' ? 'Your' : 'Their'} Ice Barrier melts ${burnt.join(' and ')} off ${side === 'player' ? 'your side' : 'theirs'}.`);
  });
  if(lines.length) renderStatusBadges();
  return lines.join(' ');
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
      /* (3.16) A nap waits for the turn it costs, and lasts to the end of that
         turn: it goes now if it has cost it (`spent`), never by the clock. A
         freeze counts its own turns (`byTurn`), not the rounds. */
      if(st.type === 'asleep'){
        if(st.spent){ list.splice(list.indexOf(st), 1); afterStatusGone('asleep', 'player'); expired.push(STATUS_LABELS.asleep); }
        return;
      }
      if(st.byTurn) return;
      if(held(statusOwner(st.type, st, 'player'), st.type, st, 'player')){
        st.turnsLeft = st.max ? st.max : STATUS_TURNS + 1;
        return;
      }
      st.turnsLeft--;
      if(st.turnsLeft <= 0){
        list.splice(list.indexOf(st), 1); afterStatusGone(st.type, 'player');
        if(st.type !== 'forgot' && st.type !== 'taunted') expired.push(STATUS_LABELS[st.type]||st.type);   // a forgotten move simply comes back (2.97); a taunt simply ends (3.38)
      }
    });
  });
  /* (3.16) Their naps likewise: one that has cost its turn ends here. */
  (b.enemies || []).forEach(e=>{ const z = getEStatus(e,'asleep'); if(z && z.spent) removeEStatus(e,'asleep'); });
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
  /* Iron Will (2.97): it cannot be put to sleep, stunned or muddled. */
  if(ironWillHolds(e, status)){ floatOver(e, 'IRON WILL'); return; }
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
/* `_blow` (2.97): which attack this blow belongs to — your action's number —
   so a Precognition halves every strike of the first attack that reaches it. */
function monRef(m){ return { uid:m.uid, types:SPECIES[m.species].types, species:m.species, level:m.level, _ambush:m._ambush || 0, _omen:m._omen || 0,
                             _blow:(ui.battle && ui.battle.actionSeq) ? 'p' + ui.battle.actionSeq : null }; }

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
  const sa = side('spikeArmour'), aeg = side('steelAegis'), cw = side('curseWard'), sh = side('shell'), fl = side('fleece');
  add(soulPassive(attacker));                      // its own Steel Soul passive (2.93)
  if(sa) add(sa.reduce || 0.20);
  if(aeg) add(aeg.reduce || 0.30);
  if(cw) add(cw.reduce || 0);
  if(sh && sh.reduce) add(sh.reduce);
  if(fl) add(fl.reduce || 0.15);                   // (3.26) a Ram's fleece
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
/* (2.97) The Ghost Guardian's Knight's Oath guards the same way, while he
   stands with a friend beside him to guard — on either side, through every
   path that asks here. */
function soulGuardian(side){
  if(!ui.battle) return null;
  const knight = knightOf(side);
  if(knight) return knight;
  if(!SOUL_GUARD) return null;                     // (2.93) Steel Soul's guard is gone
  if(side === 'player'){
    const st = getPStatus(0, 'steelSoul');
    return st ? (livingField().find(m=> m.uid === st.owner) || null) : null;
  }
  const st = getESide('steelSoul');
  return (st && st.owner && st.owner.hp > 0 && livingEnemies().includes(st.owner)) ? st.owner : null;
}
/* Knight's Oath: a guardian standing on that side with somebody to guard. */
function knightOf(side){
  const list = side === 'player' ? livingField() : livingEnemies().filter(e=> !e.rewinder);   // (Cyborg in the tear is nobody's friend)
  if(list.length < 2) return null;
  return list.find(m=>{ const p = passiveOf(m); return !!(p && p.guardian); }) || null;
}
/* What draws the blow, by name, for its message. */
function guardName(g){
  const row = g && (MOVES[g.species] || []).find(r=> r[6] && r[6].passive && r[6].passive.guardian);
  return row ? row[1] : 'Steel Soul';
}
/* Unified damage calc: applies type effectiveness + all status modifiers, in a
   fixed order, then rounds up. `attacker`/`defender` are refs — use monRef() for
   player monsters; enemy objects already carry .types. `peek` (2.97): only an
   estimate (an AI weighing its options) — it uses nothing up. */
function computeDamage(baseFactor, attackerAtk, attacker, defender, isPlayerAttacking, peek, opts){
  let dmg = baseFactor * attackerAtk;
  dmg *= typeMultiplier(attacker.types, defender.types);
  /* The attack that ends a Lurk may be an ambush (Ambush, Pounce); an Ill Omen
     makes the next blow land harder. */
  if(attacker && attacker._ambush > 1) dmg *= attacker._ambush;
  if(attacker && attacker._omen > 0) dmg *= 1 + attacker._omen;
  /* Steel Soul's flat +0.1× ATK, its caster's alone on either side. Added
     after type effectiveness (the same against anything) but BEFORE the damage
     buffs, so Overheat, Dragon Dance and Dragon Legacy multiply it — and a
     Curse on the target, below. Until 2.81 it went on after them, unbuffed.
     (3.16) Not on what rides on a hit (`opts.rider`: Leech Seed's bite, ✦
     Spike Armour's strike) — those are not hits of the move. */
  if(!(opts && opts.rider)) dmg += steelSoulBonus(attacker, attackerAtk, isPlayerAttacking);
  /* (3.16) The other side's ice: an Ice Barrier's −30%, Ice Tomb's chill —
     each multiplying the rest (attackCut). */
  dmg *= attackCut(isPlayerAttacking ? 'player' : 'enemy');

  // attacker-side buffs/debuffs
  if(isPlayerAttacking){
    const oh = getPStatus(0,'overheat');
    if(oh) dmg *= (oh.deal || 1.5);
    const dd = getPStatus(0,'dragonDance');
    if(dd) dmg *= (dd.deal || 1.25);               // multiplies WITH overheat
    const kd = getPStatus(0,'kindle');
    if(kd) dmg *= (kd.deal || 1.2);                // (3.15) Kindle — a Polygon's Overclock (the Firefox's went in 3.26)
    const en = getPStatus(0,'enchant');
    if(en) dmg *= (en.deal || 1.3);                // (3.36) the Firefox's Enchant, Grand Enchantment
    dmg *= 1 + sideAura('player', 'empower');      // (3.36) its Stargazer's Cheer: +10% while it stands
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
    if(soft && !soft.fresh) dmg *= (1 - (soft.amount || 0.5));   // (3.27) a Warning Colours mid-attack waits for the next
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
    const kdE = getESide('kindle');
    if(kdE) dmg *= (kdE.deal || 1.2);                        // (3.15) their Kindle — a Polygon's Overclock (3.26)
    const enE = getESide('enchant');
    if(enE) dmg *= (enE.deal || 1.3);                        // (3.36) their Firefox's Enchant
    dmg *= 1 + sideAura('enemy', 'empower');                 // (3.36) their Firefox's Cheer
    dmg *= steelSoulAmp(attacker, false);                    // theirs hits harder too (2.90; every shield, 2.91)
    const softE = getEStatus(attacker,'softened');          // your weaken on it
    if(softE) dmg *= (1 - (softE.amount || 0.5));
    dmg *= playerTerrorizeFactor();                          // yours frightens them (2.87)
  }

  // defender-side modifiers
  if(isPlayerAttacking){ // defender is an enemy

    if(defender && defender.takeMult) dmg *= defender.takeMult;
    /* (3.16: a frozen one is no harder to hurt — Ice Tomb's `taken` went with
       the deep freeze) */
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
    const barE = getESide('barrier');                    // their Invisible Wall (3.14/3.15) — before any shield of theirs soaks the rest
    if(barE) dmg *= (1 - (barE.reduce || 0.5));
    const wardE = sideAura('enemy', 'ward');             // (3.15) their Seadragon's Tidal Ward
    if(wardE) dmg *= (1 - wardE);
    const flE = getESide('fleece');                      // (3.26) their Ram's Woolly Warmth
    if(flE) dmg *= (1 - (flE.reduce || 0.15));
    dmg *= (1 - soulPassive(defender));                  // their Ankylosaurus's Steel Soul passive (2.93)
    if(siphonUp(1)) dmg *= (1 - SIPHON.cut);             // (3.43) the tower's first siphon: no dust takes it
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
    const bar = getPStatus(0,'barrier');
    if(bar) dmg *= (1 - (bar.reduce || 0.5));      // your Invisible Wall (3.14/3.15): before a shield soaks the rest
    const ward = sideAura('player', 'ward');
    if(ward) dmg *= (1 - ward);                    // (3.15) your Seadragon's Tidal Ward
    const fl = getPStatus(0,'fleece');
    if(fl) dmg *= (1 - (fl.reduce || 0.15));       // (3.26) your Ram's Woolly Warmth
    dmg *= (1 - soulPassive(defender));                  // Steel Soul's passive: its alone (2.93)
    /* What their side has put on yours: a Curse makes you softer. */
    const curP = getPStatus(0,'curse');
    if(curP && isEnemyOwned('curse', curP)) dmg *= (1 + (curP.extra != null ? curP.extra : 0.25));
  }
  /* The passives (2.97): Composure, Exploit and Focus on the attacker's side;
     Knight's Oath's armour and a Precognition on the defender's. */
  dmg *= passiveDamageMult(attacker, defender, isPlayerAttacking, peek, opts);
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

    case 'Water': { // Ice Tomb (3.16) — a freeze on each of them, and a chill on their side
      /* Every one of them on the field is frozen for its next `freeze` turns —
         its own turns, counted as it loses them (runSingleEnemyTurn), so one
         that has already acted this round loses its next. No dust holds a
         freeze open. Then the chill: a field on their side (new arrivals
         take it too) for T turns — `slow` steps later, `cut` less damage, and
         at ✦ a `refreeze` chance each turn. Your dust holds the chill open;
         theirs sweeps both. */
      const n = d.freeze || 1;
      let frozen = 0;
      livingEnemies().forEach(e=>{ if(freezeFoe(e, n)) frozen++; });
      applyFieldStatus({ type:'chill', turnsLeft:T + 1, slow:d.slow || 0, cut:d.cut || 0, refreeze:d.refreeze || 0, mine:true });
      res.msg = `🧊 Ice Tomb! ${frozen ? `${frozen === 1 ? 'It is' : `All ${frozen} are`} frozen for ${n === 1 ? 'the next turn' : `the next ${n} turns`}` : 'Nothing freezes'}` +
                ` — and the chill stays for ${T} turns: ${d.slow} step${d.slow > 1 ? 's' : ''} slower, ${Math.round((d.cut || 0) * 100)}% less damage` +
                (d.refreeze ? `, and a ${Math.round(d.refreeze * 100)}% chance each turn to freeze again` : '') + '.';
      break; }

    case 'Grass': // Leech Seed — field-wide; every hit feeds the WHOLE party
      applyFieldStatus({ type:'leechSeed', turnsLeft:T, heal:d.heal, bite:d.bite||0, biteHeals:!!d.biteHeals });
      res.msg = d.text;
      break;

    case 'Electric': // Overcharge — party-wide repeat chance, and (3.16) the whole side a step or more sooner
      setPStatus(uid,{type:'overcharge', turnsLeft:T+1, chance:d.after, firstChance:d.first, fresh:true, init:d.init || 0});
      res.msg = d.text;
      break;

    case 'Ground': // Spike Armour — party-wide, softer than before; (3.16) ✦ a strike riding on every hit
      setPStatus(uid,{type:'spikeArmour', turnsLeft:T+1, reduce:d.reduce, thorns:d.thorns, spike:d.spike || 0});
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

    case 'Psychic': { // Discombobulate — a field on YOUR side
      /* Kept on your side, so Diamond Dust holds it open and it carries on into
         the next wave. The moment it lands, everyone on the field is confused
         (each its own self-hit, rolled now); at the end of every turn after,
         each of them gets a fresh roll (discombobulateEndPhase, 3.16). */
      const self = d.self || [0.5, 0.8];
      setPStatus(uid, { type:'confusionField', turnsLeft:T, mine:true,
                        after:d.confuseAfter || 0.20, self:self.slice(),
                        sleep:d.sleep || 0, sure:true, sureUsed:false });
      let n = 0;
      livingEnemies().forEach(e=>{ markConfused(e, null, false, rollSelf(self)); if(getEStatus(e,'discombobulate')) n++; });
      res.msg = `🌀 Discombobulate! ` + (n ? `${n === 1 ? 'It is' : `All ${n} are`} confused — when ${n === 1 ? 'it acts' : 'one acts'}, it hits its own side for ` +
                `${self[0]}–${self[1]}× its ATK.` : 'Nobody is confused.') +
                ` For ${T} turns, at the end of every turn each of them may be confused again${d.sleep ? ' or fall asleep' : ''}.`;
      break; }

    case 'Dragon': // Dragon Dance — multiplies WITH Overheat rather than replacing it
      /* (3.13) …and breaks `strip` of the target's shields before each attack */
      setPStatus(uid,{type:'dragonDance', turnsLeft:T+1, deal:d.deal, strip:d.strip||0});
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
  /* A legendary running on a hole where its core should be gets its Max back
     with the core itself: the crown unlocks it, whatever its level or its
     protein. (3.20: asked first — the Water Dragon's, the Thunder Newt's and
     the Monkey King's Maxes are also marked coreOnly, and the Dragon Core
     check below used to answer for them, so the cores coming home in Region
     5's ending never unlocked them.) */
  if(mv[0] === 'Max' && (SPECIES[m.species] || {}).nerfedUntilCrowned) return isCrowned(m);
  if(extra.coreOnly) return !!m.hasDragonCore;
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
                       evade:mv.clones.evade, full:!!mv.clones.full, uid:mon.uid };
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
    'Your team deals <b>1.5×</b> damage, but takes <b>1.5×</b> too.',
    'Your team deals <b>1.5×</b> damage and takes only <b>1.3×</b>.',
    'Your team deals <b>1.5×</b> damage and takes only <b>1.1×</b>. Every enemy burns for <b>0.25× ATK</b> each turn.',
  ]},
  /* (3.16) The designer: "change ice tomb base/plus/star to 1/2/2 turns
     frozen, along with -1/2/3 initiative value and 10/20/30% attack decrease
     to the opposing team. Attack reduction is multiplicative with ice
     barrier. Together they halve enemy attack (51% reduction). At star tier,
     there is a 15% chance for an enemy to get frozen again at the start of
     each turn." Two parts: the FREEZE on each of them, counted by its own
     turns (`iceTomb`, freezeFoe / freezeMine); and the CHILL, a field on
     their side for 5 turns (`chill`: slow, cut, refreeze — attackCut,
     initiativeOf, chillRefreeze). The deep-freeze field, its `taken` and
     Frost Armour are gone. */
  Water: { name:'Ice Tomb', turns:5, tiers:[
    { freeze:1, slow:1, cut:0.10 },
    { freeze:2, slow:2, cut:0.20 },
    { freeze:2, slow:3, cut:0.30, refreeze:0.15 },
  ], text:[
    'Freezes every enemy for <b>1 turn</b>. Then for 5 turns they move <b>1 step later</b> and deal <b>10% less</b>.',
    'Freezes every enemy for <b>2 turns</b>. Then for 5 turns they move <b>2 steps later</b> and deal <b>20% less</b>.',
    'Freezes every enemy for <b>2 turns</b>. Then for 5 turns they move <b>3 steps later</b>, deal <b>30% less</b>, and have a <b>15%</b> chance each turn to freeze again.',
  ]},
  Grass: { name:'Leech Seed', turns:5, tiers:[
    { heal:0.15, bite:0 },
    { heal:0.15, bite:0.10 },
    { heal:0.15, bite:0.15, biteHeals:true },
  ], text:[
    'Every hit on a seeded enemy heals your team for <b>0.15×</b> the attacker\'s ATK.',
    'Every hit on a seeded enemy heals your team for <b>0.15×</b> ATK and bites it for <b>0.10×</b>.',
    'Every hit on a seeded enemy heals your team for <b>0.15×</b> ATK and bites it for <b>0.15×</b> — and the bite heals too.',
  ]},
  /* (3.16) "Overcharge to also add +1/2/3 to initiative value" — the whole
     side's, either side's (initiativeOf). */
  Electric: { name:'Overcharge', turns:5, tiers:[
    { first:0.25, after:0.25, init:1 },
    { first:0.75, after:0.25, init:2 },
    { first:1.00, after:0.30, init:3 },
  ], text:[
    '<b>25%</b> chance to repeat a move. Your team moves <b>1 step sooner</b>.',
    'Your first move that lands has a <b>75%</b> chance to repeat, then <b>25%</b>. Your team moves <b>2 steps sooner</b>.',
    'Your first move that lands always repeats, then <b>30%</b>. Your team moves <b>3 steps sooner</b>.',
  ]},
  /* (3.16) ✦: "let spike armor add a 0.1 damage instance to each hit, like
     leech seed Star does" — every hit its side lands strikes again for
     `spike`× ATK: every multiplier counts, no shield is touched
     (riderDamage, spikeRiderYours / spikeRiderTheirs). */
  Ground: { name:'Spike Armour', turns:5, tiers:[
    { reduce:0.20, thorns:0.20 },
    { reduce:0.25, thorns:0.30 },
    { reduce:0.30, thorns:0.40, spike:0.10 },
  ], text:[
    'Take <b>20% less</b> damage. Attackers take <b>0.20× ATK</b> back.',
    'Take <b>25% less</b> damage. Attackers take <b>0.30× ATK</b> back.',
    'Take <b>30% less</b> damage. Attackers take <b>0.40× ATK</b> back, and every hit you land strikes again for <b>0.1× ATK</b>.',
  ]},
  /* Dodging is no longer the point — it is the FUEL. Every evaded blow leaves a
     copy standing, and the copies strike at the end of the turn. */
  Flying: { name:'Mirage', turns:5, tiers:[
    { window:[1.00], after:0.15, images:0, imageDmg:0,    init:1 },
    { window:[1.00], after:0.20, images:1, imageDmg:0.20, init:2 },
    { window:[1.00], after:0.25, images:2, imageDmg:0.30, init:3 },
  ], text:[
    'Dodge everything the first turn you are attacked, then <b>15%</b>. Your team moves <b>1 step sooner</b>.',
    'Dodge everything the first turn you are attacked, then <b>20%</b>. Each dodge leaves an afterimage that hits for <b>0.2× ATK</b>. Your team moves <b>2 steps sooner</b>.',
    'Dodge everything the first turn you are attacked, then <b>25%</b>. Each dodge leaves two afterimages that hit for <b>0.3× ATK</b>. Your team moves <b>3 steps sooner</b>.',
  ]},
  /* Not a returned hit — a READ. A counter stack eats one entire attack,
     however many times it strikes, and the monster that pulled it off comes out
     of the exchange angrier and more dangerous. */
  Physical: { name:'Counter', turns:5, tiers:[
    { stacks:1, regain:0.10, combo:0.25, enrage:0    },
    { stacks:1, regain:0.15, combo:0.25, enrage:0.20 },
    { stacks:2, regain:0.20, combo:0.25, enrage:0.20 },
  ], text:[
    '<b>1 Counter stack</b>: one enemy attack does <b>80% less</b>, and your next attack deals <b>+25%</b>. <b>10%</b> chance each turn for another stack.',
    '<b>1 Counter stack</b>, <b>15%</b> each turn for another. Blocking also gives that monster <b>+20% ATK</b> for the battle (Enrage).',
    '<b>2 Counter stacks</b>, <b>20%</b> each turn for another. Blocking gives <b>+25%</b> next attack and <b>+20% ATK</b> for the battle.',
  ]},
  Ghost: { name:'Curse', turns:5, tiers:[
    { extra:0.25, reduce:0 },
    { extra:0.25, reduce:0.10 },
    { extra:0.30, reduce:0.15, mute:true },
  ], text:[
    'Every enemy takes <b>25% more</b> damage.',
    'Enemies take <b>25% more</b> damage, and you take <b>10% less</b>.',
    'Enemies take <b>30% more</b> damage, you take <b>15% less</b>, and enemy passives are switched off.',
  ]},
  /* Confusion you can SEE. A confused monster swings at its own side — or at
     itself, if it stands alone — which reads instantly and is far funnier than
     a percentage nobody notices. Certain on its first swing, then occasional. */
  /* Two independent rolls each turn. Friendly fire is checked first and wins
     any tie, so the two never double up. */
  /* The identity is self-harm, not denial. Higher tiers do not steal many more
     turns — they make each stolen swing land far harder on the enemy's own
     side. Friendly fire is rolled first and wins any tie with sleep. */
  /* (3.16) The designer: confused, it hits for "0.5-0.8/0.8-1.1/1.1-1.4x
     attack damage" — `self`, × its own ATK, rolled as the confusion lands
     and shown on its badge (it was 60/90/120% of the move it was about to
     use). "Let asleep (1 turn missed) and confused (self-hit) trigger at the
     end phase and last through the next turn till the next end phase so
     that the debuffs can be used to buff psychic attacks" — the roll is in
     the end phase now (discombobulateEndPhase), and a nap is no longer gone
     the moment its turn is missed (it is `spent`, and cleared in the end
     phase). The cast still confuses every one of them at once, and the
     `sure` rule stays. */
  Psychic: { name:'Discombobulate', turns:5, tiers:[
    { confuseAfter:0.20, self:[0.5, 0.8] },
    { confuseAfter:0.20, self:[0.8, 1.1], sleep:0.05 },
    { confuseAfter:0.20, self:[1.1, 1.4], sleep:0.15 },
  ], text:[
    'Confuses every enemy: it hits its own side for <b>0.5–0.8×</b> its ATK. For 5 turns each has a <b>20%</b> chance each turn to be confused again.',
    'Confuses every enemy: it hits its own side for <b>0.8–1.1×</b> its ATK. For 5 turns each has a <b>20%</b> chance each turn to be confused again, or <b>5%</b> to fall asleep.',
    'Confuses every enemy: it hits its own side for <b>1.1–1.4×</b> its ATK. For 5 turns each has a <b>20%</b> chance each turn to be confused again, or <b>15%</b> to fall asleep.',
  ]},
  /* (3.13) Cast, it also breaks shields: `strip` of the target's block stacks
     go before each attack hits (breakShields) — the answer to block now that
     Diamond Dust leaves it alone. Carried, it is still Mach Dragon alone. */
  Dragon: { name:'Dragon Dance', turns:5, tiers:[
    { deal:1.25, strip:1 },
    { deal:1.30, strip:2, mach:1, passive:true, passiveOnly:'mach' },
    { deal:1.35, strip:3, mach:2, passive:true, passiveOnly:'mach' },
  ], text:[
    'Your team deals <b>25% more</b> damage, and each attack breaks <b>1</b> extra shield.',
    'Triggers <b>Mach Dragon</b> upon taking the field, giving your monsters extreme speed. Active skill grants <b>30%</b> increased damage and the ability to break <b>2</b> additional shields per attack.',
    'Triggers <b>Mach Dragon ✦</b> upon taking the field, giving your monsters extreme speed. Active skill grants <b>35%</b> increased damage and the ability to break <b>3</b> additional shields per attack.',
  ]},
  Steel: { name:'Steel Aegis', turns:5, tiers:[
    { reduce:0.30 },
    { reduce:0.35, block:2, passive:true, passiveBlock:1, regenRolls:1 },
    { reduce:0.40, block:4, passive:true, passiveBlock:3, regenRolls:2 },
  ], text:[
    'Take <b>30% less</b> damage.',
    'Gives <b>1 shield</b> upon taking the field. Active skill: take <b>35% less</b> damage and gain <b>2 shields</b>, with a <b>50%</b> chance of another each turn.',
    'Gives <b>3 shields</b> upon taking the field. Active skill: take <b>40% less</b> damage and gain <b>4 shields</b>, with two <b>50%</b> chances of another each turn.',
  ]},
  Fairy: { name:'Diamond Dust', turns:5, tiers:[
    { cleanse:true },
    { cleanse:true, passive:true, borrowRandom:1, borrowTier:1 },
    { cleanse:true, passive:true, borrowPick:1, borrowRandom:1, borrowTier:2 },
  ], text:[
    'Sweeps away every enemy effect and stops new ones. Your own effects keep going. Shields are not touched.',
    'Works upon taking the field. Active skill also casts one random other Very High skill at <b>+</b> strength.',
    'Works upon taking the field. Active skill also casts a Very High skill of your choice at <b>✦</b> strength, and a second one at random.',
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
   have swept (only an unsweepable one survives it) — and (3.13) its shields,
   which no dust stops (Iron Shell, Braced Stance, Organosteel Body…). */
function dustProofTraits(p){
  const o = passiveTraitsOnly(p);
  if(!p.unsweepable) delete o.evadeAlways;
  if(p.block) o.block = p.block;
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
  if(own >= 1) return sightFactor('player');      // (3.15) your Firefox's Arcane Sight halves even a certain dodge
  const src = [own];                               // (3.25) a Ladybird's Glow is gone — its beam blinds (rollBlind)
  const mir = getESide('mirage');
  if(mir && mir.window && mir.step < mir.window.length) mir.tested = true;   // its window met a real blow
  if(mir) src.push((mir.window && mir.step < mir.window.length) ? mir.window[mir.step] : (mir.chance || 0.20));
  const cl = getESide('clones');
  if(cl) src.push(cl.evade || 0);
  const tac = getESide('tachy');
  if(tac && tac.owner === t && tac.fresh) tac.tested = true;             // its first-turn rate met a real blow
  if(tac && tac.owner === t) src.push(tac.fresh ? (tac.evadeFirst || 0) : (tac.evadeAfter || 0));
  /* Futuresight (Cyborg, 3.00): it saw the blow coming. What it IS — no dust
     sweeps it — but a ✦ Curse quiets it (passiveOf). */
  const fs = passiveOf(t);
  if(fs && fs.futuresight) src.push(fs.futuresight);
  if(siphonUp(1)) src.push(SIPHON.dodge);           // (3.43) the tower's first siphon: no dust takes it
  let hit = 1;
  src.forEach(x=>{ if(x > 0) hit *= (1 - x); });
  return (1 - hit) * sightFactor('player');      // (3.15) Arcane Sight
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
  overheat:'buff', overcharge:'buff',
  spikeArmour:'buff', mirage:'buff', counter:'buff', curseWard:'buff',
  confusionField:'buff', dragonDance:'buff', machDragon:'buff', steelAegis:'buff',
  diamondDust:'buff', aria:'buff', wrath:'buff', tachy:'buff', steelSoul:'buff',
  shell:'buff', clones:'buff', vita:'buff', fracture:'buff', barrier:'buff',
  kindle:'buff', gallop:'buff', iceBarrier:'buff', fleece:'buff', enchant:'buff', stargaze:'buff',
  /* debuffs: the side that put them there benefits */
  stunned:'debuff', paralysed:'debuff', softened:'debuff', charmed:'debuff', forgot:'debuff', taunted:'debuff',   // (3.38) a taunt
  charm:'debuff', disrupt:'debuff', disruptField:'debuff', asleep:'debuff',
  discombobulate:'debuff', iceTomb:'debuff', curse:'debuff', chill:'debuff',
  leechSeed:'debuff', dot:'debuff', jaws:'debuff', bogged:'debuff',
  blinded:'debuff',                                   // (3.25) the Ladybird's Blinding Beam
};
/* Fields: side-wide effects with a real duration, as opposed to a one-turn
   stun or a nap that is used up. A Diamond Dust holds its OWN side's fields
   open; one-shot debuffs are left to run out. (3.16: the deep freeze and
   Frost Armour are gone; Ice Tomb's chill is a field — its freeze is not.) */
const FIELD_TYPES = new Set(['leechSeed','curse','dot','charm','charmed','disrupt','disruptField',
  'confusionField','chill','bogged']);
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
/* (3.13) Not shields: `blockStacks` left this list — "remove its effect of
   breaking shields, in line with fairy's weakness to steel". A shield stands
   under either side's dust, and one raised under it stands too (Steel Aegis
   carried, Iron Shell, Organosteel Body…). Dragon Dance breaks them now
   (breakShields). The Guard STANCE that raises one a turn is still a stance. */
const ENEMY_STANCE_FIELDS = ['guard','airborne','invisible','prep','counterStack','evadeTurns','comboStacks','enrageStacks','lurk','cunning'];

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
   cost practice, never progress. Nor (3.13) shields — block stacks: "remove
   its effect of breaking shields, in line with fairy's weakness to steel".
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
  } else {
    /* (3.01) theirs are their side's too */
    if(foeCounters().length){ b.eCounter = []; cleared++; }
    if(b.eCombo){ b.eCombo = 0; cleared++; }
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
    if(m.ddBreak){ m.ddBreak = 0; n++; }                                    // a carried Dragon Dance's shield-breaking (3.13)
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
    /* (3.01) their side's Counter and Combo, as yours */
    if(foeCounters().length) out.push({ label:'↩️ Counter', take:()=>{ b.eCounter = []; } });
    if(b.eCombo > 0) out.push({ label:`👊 Combo ×${b.eCombo}`, take:()=>{ b.eCombo = 0; } });
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
  /* (3.13) The one difference from the dust's list: shields. Diamond Dust
     cannot touch them (Fairy is weak to Steel); a Nova — fire — still burns
     them off, all of one monster's at once, as before. */
  if(m.blockStacks > 0) add(`🛡 Block ×${m.blockStacks}`, ()=>{ m.blockStacks = 0; });
  /* (a monster's own stacks and combo — both sides keep them as the side's
     since 3.01, in b.pCounter / b.eCounter, listed by sweepableBuffs) */
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
    if(m.ddBreak) add('🐉 Shield-breaking', ()=>{ m.ddBreak = 0; });
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
      out.push({ key:k, label:STATUS_LABELS[k] || k, take:()=>{
        const got = Object.assign({}, ps[k]);
        if(k === 'clones' && b.clones) Object.assign(got, { mult:b.clones.mult, evade:b.clones.evade, turnsLeft:b.clones.turnsLeft, full:!!b.clones.full });
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
      out.push({ key:k, label:STATUS_LABELS[k] || k, take:()=>{
        const got = Object.assign({}, es[k]);
        const burnLeft = k === 'overheat' ? overheatBurnTurns('enemy') : 0;
        delete es[k]; afterStatusGone(k, 'enemy');
        return (toSide, thief)=>{
          const st2 = setPStatus(0, rehomeStatus(got, thief, toSide));
          if(st2 && k === 'clones') b.clones = { turnsLeft:got.turnsLeft, mult:got.mult || 0.5, evade:got.evade || 0, full:!!got.full, uid:thief.uid };
          if(st2) carryAcross(got, 'enemy', toSide, burnLeft);
          return !!st2;
        };
      }});
    });
  }
  /* What the monsters it hit were holding. The counter stacks and the combo
     are the side's, not one monster's — on both sides since 3.01 (below). */
  const seen = new Set();
  (victims || []).forEach(m=>{
    if(!m || seen.has(m)) return;
    seen.add(m);
    const moveField = (f, label)=> out.push({ label, take:()=>{
      const v = m[f]; m[f] = 0;
      return (toSide, thief)=>{ thief[f] = (thief[f] || 0) + v; return true; };
    }});
    if(m.blockStacks > 0) out.push({ label:`🛡 Block ×${m.blockStacks}`, shield:true, take:()=>{
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
  });
  if(victimSide === 'player'){
    if(partyCounters().length) out.push({ label:`↩️ Counter ×${partyCounters().length}`, take:()=>{
      const list = b.pCounter.splice(0);
      return (s, thief)=>{ list.forEach(c=> addCounterStack(thief, c.tier, 1)); return true; };
    }});
    if(b.pCombo > 0) out.push({ label:`👊 Combo ×${b.pCombo}`, take:()=>{
      const n = b.pCombo; b.pCombo = 0;
      return (s)=>{ b.eCombo = (b.eCombo || 0) + n; return true; };
    }});
  } else {
    if(foeCounters().length) out.push({ label:`↩️ Counter ×${foeCounters().length}`, take:()=>{
      const list = b.eCounter.splice(0);
      return (s, thief)=>{ list.forEach(c=> addCounterStack(thief, c.tier, 1)); return true; };
    }});
    if(b.eCombo > 0) out.push({ label:`👊 Combo ×${b.eCombo}`, take:()=>{
      const n = b.eCombo; b.eCombo = 0;
      return (s)=>{ b.pCombo = (b.pCombo || 0) + n; return true; };
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
  /* Taking the other side's dust clears the way for the thief's own. A shield
     it takes stands even under that dust (3.13: no dust stops a shield). */
  const kept = (dustBlocks(thiefSide) && !pick.shield) ? false : give(thiefSide, thief);
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
/* `who` (3.42): whose they are, for the pill's card — 'p' the leader, 'c' a
   companion (its pills say 🤝 first). */
function stancePills(m, who){
  const out = [];
  const w = who || 'p', mk = w === 'c' ? '🤝 ' : '';
  const pill = (key, text)=> out.push(`<span class="status-pill mine"${pillAt(key, w)}>${mk}${text}</span>`);
  if(m && m.lurk)         pill('lurk', '🌑 Lurk');
  if(m && m.cunning)      pill('cunning', '🌘 Cunning');
  if(m && m._windup)      pill('windup', `⏳ ${escapeHtml(m._windup)}`);
  if(m && m._omen)        pill('omen', '🐦‍⬛ Ill Omen');
  if(m && m.guard)        pill('guard', '🛡 Guard');
  if(m && m.airborne>0)   pill('airborne', '🕊 Airborne');
  if(m && m.invisible>0)  pill('invisible', '👤 Invisible');
  if(m && m.prep>0)       pill('prep', `🎯 Prep ×${m.prep}`);
  if(m){ const md = meditatePill(m, 'mine', w); if(md) out.push(md.replace('">', `">${mk}`)); }   // (3.26)
  return out.join('');
}

/* ============================================================
   COUNTER · COMBO · ENRAGE
   A counter stack is a read, not a riposte: it eats ONE entire enemy attack,
   every hit of it, and is spent. Spending one leaves the side with a Combo
   (a bigger next swing) and, at + and ✦, the monster that took it with a
   permanent Enrage.
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
   animal holding them — on both sides (3.01). A stack covers whichever of the
   side an attack reaches — your monster out front or its companion, any of
   their wave, their companion — and the Combo goes to the side's next attack.
   Swap out and yours come with you; one of theirs falls and the rest of its
   side keep them, into the next wave as your side's do. Enrage does not move:
   that is a monster working itself up, and it stays with the monster that took
   the blow.

   Until 3.01 each of theirs kept its own ("a wave stands on the field all at
   once; there is no bench") — but with companions yours is a field of several
   too. The designer: "let counter stacks protect all active monsters which
   are on, because of the companion system. Make this symmetrical for enemies."
   ------------------------------------------------------------ */
function isOurs(holder){
  if(!holder || !holder.uid) return false;
  const sp = ui.battle && ui.battle.coreSpar;               // a spar's borrowed companion (2.87)
  if(sp && sp.companion && sp.companion.uid === holder.uid) return true;
  if(isAllyMon(holder)) return true;                        // (3.19) the Monkey King at your side: his stacks are yours
  return (state.party || []).some(m => m.uid === holder.uid)
      || (state.storage || []).some(m => m.uid === holder.uid);
}
function partyCounters(){
  const b = ui.battle;
  if(!b) return [];
  if(!Array.isArray(b.pCounter)) b.pCounter = [];
  return b.pCounter;
}
/* Theirs, the mirror (3.01): one list for their whole side. */
function foeCounters(){
  const b = ui.battle;
  if(!b) return [];
  if(!Array.isArray(b.eCounter)) b.eCounter = [];
  return b.eCounter;
}
function counterList(holder){
  if(!holder) return [];
  return isOurs(holder) ? partyCounters() : foeCounters();   // each side's, whoever holds them
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
/* A side's stacks as one pill, marked with the best of them (+ or ✦). */
function counterPill(list, cls){
  if(!list || !list.length) return '';
  const best = Math.max(...list.map(s=> s.tier || 0));
  const mark = ['', '+', '✦'][best] || '';
  return `<span class="status-pill${cls ? ' ' + cls : ''}"${pillAt('counterStack', cls === 'foe' ? 'fs' : 'ps')}>🛡 Counter ×${list.length}${mark ? ' ' + mark : ''}</span>`;
}

/* Called when an enemy attack is about to land during an ACTION phase. Returns
   the damage multiplier to apply — 1 if no stack was spent. A stack covers the
   ENTIRE attack, single or twin or barrage alike, and is then gone. */
function spendCounterStack(mon){
  const st = takeBestCounter(mon);
  if(!st) return 1;
  /* the combo travels with the side; the enrage stays with the animal */
  if(isOurs(mon)) ui.battle.pCombo = (ui.battle.pCombo||0) + 1;
  else            ui.battle.eCombo = (ui.battle.eCombo||0) + 1;
  if(st.enrage) mon.enrageStacks = (mon.enrageStacks||0) + 1;
  renderStatusBadges();
  paintEnrage(mon);
  battleMsg(`🛡 ${displayName(mon)} plants a foot and takes it on the guard — <b>80% turned away!</b>`
    + (st.enrage ? ` <b>Combo</b> and <b>Enrage</b> rise.` : ` <b>Combo</b> rises.`));
  return 1 - COUNTER_REDUCTION;
}
/* The same guard, in enemy hands: their side's stack, on whichever of them
   you reached; the Combo is their side's next attack (3.01), the Enrage this
   one's. */
function spendEnemyCounter(e){
  const st = takeBestCounter(e);
  if(!st) return 1;
  { const i = ui.battle ? ui.battle.enemies.indexOf(e) : -1;           // the same GUARD you see on yours
    if(i >= 0) floatMiss('enemy-' + i, 'GUARD'); }
  ui.battle.eCombo = (ui.battle.eCombo||0) + 1;
  if(st.enrage) e.enrageStacks = (e.enrageStacks||0) + 1;
  renderStatusBadges();
  battleMsg(`🛡 ${SPECIES[e.species].name} takes it on the guard — <b>80% turned away!</b> Their next blow will be heavier.`);
  return 1 - COUNTER_REDUCTION;
}
/* Combo: additive, the side's, spent by its next attack. */
function comboMultiplier(mon){
  const ours = !!(mon && isOurs(mon));
  const c = ours ? getPStatus(0,'counter') : getESide('counter');
  const n = ui.battle ? ((ours ? ui.battle.pCombo : ui.battle.eCombo) || 0) : 0;
  if(!n) return 1;
  return 1 + n * ((c && c.combo) || 0.25);
}
function clearCombo(mon){
  if(!mon || !ui.battle) return;
  if(isOurs(mon)) ui.battle.pCombo = 0;
  else ui.battle.eCombo = 0;
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
      /* (3.13) …and it breaks shields, as the cast does — its own, on this
         monster, as its damage is (`ddBreak`; your dust sweeps both). */
      e.ddBreak = Math.max(e.ddBreak || 0, d.strip || 0);
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
         yours on the field — and lays its chill on your side: carried, as
         cast (3.16; it used to be a long nap). Ice: Iron Will does not hold
         it off. */
      castEnemyVeryHigh(e, 'Water', plus);
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
      /* (3.16) The mirror of yours: each of yours on the field frozen for its
         next `freeze` turns — YOUR turns, each taken off as it is lost
         (playerHeldDown) — and the chill on your side for T turns. */
      const n = d.freeze || 1;
      let frozen = 0;
      livingField().forEach(pm=>{ if(freezeMine(pm, n)) frozen++; });
      setPStatus(0, { type:'chill', turnsLeft:T + 1, slow:d.slow || 0, cut:d.cut || 0, refreeze:d.refreeze || 0, by:'enemy' });
      return `🧊 ${who} casts <b>Ice Tomb</b>: ` +
             (frozen ? `your side is frozen solid for ${n === 1 ? 'its next turn' : `its next ${n} turns`}` : 'nothing of yours freezes') +
             ` — and the chill stays for ${T} turns: ${d.slow} step${d.slow > 1 ? 's' : ''} slower, ${Math.round((d.cut || 0) * 100)}% less damage` +
             (d.refreeze ? `, and a ${Math.round(d.refreeze * 100)}% chance each turn to freeze again` : '') + '!';
    }
    case 'Grass':
      setPStatus(0, { type:'leechSeed', turnsLeft:T + 1, heal:d.heal, bite:d.bite || 0, biteHeals:!!d.biteHeals, by:'enemy' });
      return `🌿 ${who} casts <b>Leech Seed</b> on your side: every blow they land on you feeds their whole team.`;
    case 'Electric':
      setESide({ type:'overcharge', turnsLeft:T + 1, chance:d.after, firstChance:d.first, fresh:true, init:d.init || 0 });
      return `⚡ ${who} casts <b>Overcharge</b>: their attacks may strike twice${d.init ? `, and their side moves ${d.init} step${d.init > 1 ? 's' : ''} sooner` : ''}.`;
    case 'Ground':
      setESide({ type:'spikeArmour', turnsLeft:T + 1, reduce:d.reduce, thorns:d.thorns, spike:d.spike || 0 });
      return `🛡️ ${who} casts <b>Spike Armour</b>: they take ${Math.round(d.reduce*100)}% less, and each one you hit pricks you back` +
             `${d.spike ? ` — and every hit of theirs strikes again for ${d.spike}× its ATK` : ''}.`;
    case 'Flying':
      setESide({ type:'mirage', turnsLeft:T + 1, window:(d.window || [1]).slice(), step:0, chance:d.after,
                 images:d.images || 0, imageDmg:d.imageDmg || 0, init:d.init || 0, owner:e, pending:0, atk });
      return `✨ ${who} casts <b>Mirage</b>: their side cannot be touched this turn, is hard to hit after` +
             `${d.init ? `, and moves ${d.init} step${d.init > 1 ? 's' : ''} sooner` : ''}.`;
    case 'Physical': {
      const tier = plus || 0;
      if(!dustBlocks('enemy')) addCounterStack(e, tier, d.stacks || 1);
      setESide({ type:'counter', turnsLeft:STATUS_TURNS + 1, tier, regain:d.regain || 0.10, combo:d.combo || 0.25, enrage:d.enrage || 0, owner:e });
      return `↩️ ${who} casts <b>Counter</b>: their side is braced to take your next blow on the guard.`;
    }
    case 'Ghost':
      setPStatus(0, { type:'curse', turnsLeft:T + 1, extra:d.extra, mute:!!d.mute, by:'enemy' });
      if(d.reduce) setESide({ type:'curseWard', turnsLeft:T + 1, reduce:d.reduce });
      return `👻 ${who} casts <b>Curse</b>: your side takes ${Math.round(d.extra*100)}% more damage${d.mute ? ', and your passives fall silent' : ''}.`;
    case 'Psychic': {
      /* (3.16) Each of yours on the field confused at once, its self-hit
         rolled now; the field rolls again at every end phase. No `fresh`
         needed: if none of yours swings confused before the end phase, the
         `sure` rule keeps every one of you confused for the next turn. */
      const self = d.self || [0.5, 0.8];
      setESide({ type:'confusionField', turnsLeft:T, after:d.confuseAfter || 0.20, self:self.slice(),
                 sleep:d.sleep || 0, sure:true, sureUsed:false });
      livingField().forEach(pm=> withFocus(pm, ()=> markPlayerConfused(null, false, rollSelf(self))));
      return `🌀 ${who} casts <b>Discombobulate</b>: your side is confused — a damaging move of yours turns on your own side ` +
             `for ${self[0]}–${self[1]}× its ATK — and for ${T} turns, at the end of every turn, you may be confused again${d.sleep ? ' or fall asleep' : ''}!`;
    }
    case 'Dragon':
      setESide({ type:'dragonDance', turnsLeft:T + 1, deal:d.deal, strip:d.strip || 0 });
      if(d.mach) setESide({ type:'machDragon', turnsLeft:T + 1, tier:d.mach });
      return `🐉 ${who} casts <b>Dragon Dance</b>: their side deals ${d.deal}×${d.mach ? ' and moves first' : ''}` +
             `${d.strip ? `, and each attack breaks ${d.strip} of your shields first` : ''}.`;
    case 'Steel':
      setESide({ type:'steelAegis', turnsLeft:T + 1, reduce:d.reduce, regenRolls:d.regenRolls || 0, owner:e });
      if(d.block) grantBlock(e, d.block, atk);     // (3.13) shields are beyond any dust
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
    grantBlock(e, d.passiveBlock, e.atk);          // (3.13) your dust cannot stop a shield
    return setTimeout(()=> battleMsg(`🛡 ${who} arrives with ${d.passiveBlock} block already standing.`), 700);
  }
  if(st.type === 'Fairy'){
    const n = diamondDustCleanse('enemy');
    setESide({ type:'diamondDust', turnsLeft:(d.turns || 5) + 1, owner:e });
    return setTimeout(()=> battleMsg(`💎 ${who}'s Diamond Dust is already in the air${n ? `: ${n} of your effects swept away` : ''}.`), 700);
  }
}
/* Their Discombobulate on YOU: a damaging move turns on your own side.
   `fresh` keeps a muddle cast mid-round alive until your own turn comes (a
   Lunacy's, which is also `once`: one swing). (3.16) `self`: a
   Discombobulate confusion's self-hit, × your monster's ATK — it lasts to the
   next end phase, every damaging move until then turning. */
function markPlayerConfused(ffPower, fresh, self, once){
  setPStatus(0, Object.assign({ type:'discombobulate', turnsLeft:2, by:'enemy', fresh:!!fresh },
                              self ? { self } : { ffPower:ffPower || 0.60 }, once ? { once:true } : {}));
}
/* Their side's own damage buffs, for hits that do not go through the damage
   formula (their burn, their afterimages). */
function enemyBuffMultiplier(){
  let m = 1;
  const oh = getESide('overheat'); if(oh) m *= (oh.deal || 1.5);
  const dd = getESide('dragonDance'); if(dd) m *= (dd.deal || 1.25);
  const kd = getESide('kindle'); if(kd) m *= (kd.deal || 1.2);       // (3.15)
  const en = getESide('enchant'); if(en) m *= (en.deal || 1.3);      // (3.36) their Firefox's Enchant
  m *= 1 + sideAura('enemy', 'empower');                              // (3.36) and its Cheer
  m *= attackCut('enemy');                                            // (3.16) your Ice Barrier, your chill
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
    /* (3.08) an attack like any other: the Aria counts it, and its untouchable
       turn — or the Whalelord's reflex — lets it through (it used to do
       neither) */
    noteAriaAttack();
    const covered = ariaFieldEvasion() > 0;
    if(ariaPassesThrough(me)){
      floatMiss(pid('playerBob'), 'MISS'); dodgePlayer();
      if(covered) battleMsg(`👥 One of their afterimages strikes — and passes harmlessly through.`);
      return setTimeout(step, 620);
    }
    if(Math.random() < playerEvasionFrom(null)){
      floatMiss(pid('playerBob'), dodgeWord(me)); dodgePlayer();
      battleMsg(`👥 One of their afterimages strikes — and finds nothing.`);
      return setTimeout(step, 620);
    }
    const before = me.currentHp;
    const through = capHit(me, applyBlock(me, per, pid('playerBlk')));   // (3.15) a Carapace
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
  if(own >= 1) return sightFactor('enemy');       // (3.15) their Firefox's Arcane Sight
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
  return (1 - hit) * sightFactor('enemy');       // (3.15) Arcane Sight
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
   ICE BARRIER (3.14) — Caladrius's Power1, in place of Pinion
   The designer: "ice barrier, to grant 2 shields and 1 turn of damage
   reduction (50%), and remove 2 negative effects from the user's party. do
   not let this damage reduction be extended by diamond dust, just like
   mime's one." And: "remember that damage reduction happens before a damage
   block stack absorbs damage."
   `def` = { shields, reduce, cleanse }:
     shields  that many shields on the caster, worth its ATK each — a shield
              stands under any dust (3.13);
     reduce   until the caster's next turn, every blow on its SIDE is cut by
              this much — in computeDamage, so before a shield soaks the
              rest. A buff of the side (status 'barrier'): the other side's
              Diamond Dust keeps it from forming and sweeps it; the caster's
              own dust never holds it open (noDust). It ends as the caster
              begins its next action in a later round (barrierLapse), or at
              the latest at the end of the next round (turnsLeft 2);
     cleanse  that many of the other side's marks on the caster's side burn
              off, picked at random as a Nova's purge picks — a sweep, which
              no dust stops. Never a Mors mark: that is Conversio's own price.
   Either side's. Returns the battle line.
   ============================================================ */
function castBarrier(side, caster, def, name){
  const b = ui.battle;
  if(!b || !caster || !def) return '';
  const yours = side === 'player';
  const who = yours ? displayName(caster) : SPECIES[caster.species].name;
  /* (3.15) `worth`: each shield is worth that many times the caster's ATK
     (Pillow Puff, 2); `on:'partner'`: they go on its partner (partnerOf) —
     Pillow Puff, Bandage Wall — or on itself, alone. */
  const atk = Math.ceil((yours ? monAtk(caster) : enemyAtk(caster)) * (def.worth || 1));
  const holder = def.on === 'partner' ? (partnerOf(side, caster) || caster) : caster;
  const onWho = holder === caster ? who : monName(holder);
  const n = def.shields || 0;
  if(n > 0) grantBlock(holder, n, atk);
  let held = null;
  if(def.reduce){
    const st = { type:'barrier', turnsLeft:2, reduce:def.reduce, noDust:true, round:roundNo(), label:def.label || null };
    held = yours ? setPStatus(0, Object.assign(st, { owner:caster.uid }))
                 : setESide(Object.assign(st, { owner:caster }));
  }
  const burnt = [];
  for(let k = 0; k < (def.cleanse || 0); k++){
    const pool = marksOnSide(side);
    if(!pool.length) break;
    const x = pool[Math.floor(Math.random() * pool.length)];
    x.take(); burnt.push(x.label);
  }
  setTimeout(refreshAllBlockBars, 0);
  const pct = Math.round((def.reduce || 0) * 100);
  const parts = [];
  if(n > 0) parts.push(`${n === 1 ? 'a shield closes' : n + ' shields close'} over ${escapeHtml(onWho)} (<b>${atk}</b>${n === 1 ? '' : ' each'})`);
  if(def.reduce) parts.push(held ? `until its next turn every blow on ${yours ? 'your' : 'their'} side is cut by <b>${pct}%</b>`
                                 : `but ${yours ? 'their' : 'your'} diamond dust will not let the barrier form`);
  if(burnt.length) parts.push(`${burnt.join(' and ')} ${burnt.length > 1 ? 'are' : 'is'} burnt off ${yours ? 'your side' : 'theirs'}`);
  logBattle(`🧊 ${who}: ${name || 'Ice Barrier'} — ${n} shield${n === 1 ? '' : 's'} at ${atk}${holder !== caster ? ' on ' + onWho : ''}` +
            `${def.reduce ? (held ? `, ${pct}% off every blow on its side` : ', barrier scattered by dust') : ''}` +
            `${burnt.length ? `, cleansed: ${burnt.join(', ')}` : ''}`);
  return `${def.icon || '🧊'} ${yours ? '' : escapeHtml(who) + ' uses '}<b>${escapeHtml(name || 'Ice Barrier')}</b> — ${parts.join('; ') || 'nothing takes hold'}.`;
}
/* The barrier ends as its caster begins its next action, in a later round
   than the one it was raised in. `who`: your monster or their monster. */
function barrierLapse(side, who){
  const st = side === 'player' ? getPStatus(0,'barrier') : getESide('barrier');
  if(!st || !(st.round < roundNo())) return;
  const mine = side === 'player' ? (who && st.owner === who.uid) : st.owner === who;
  if(!mine) return;
  if(side === 'player') removePStatus(0,'barrier'); else removeESide('barrier');
  renderStatusBadges();
  logBattle(`🧊 ${side === 'player' ? 'Your' : 'Their'} barrier melts as its caster acts again.`);
}

/* ============================================================
   CUAIN — the Whalelord's kit
   Three moves that all pay more the worse things are going.
     Grudge          scales with HIS missing health
     Haunting Aria   punishes the enemy for landing hits at all
     Gathering Wrath scales with how much the TEAM has been hurt
   ============================================================ */

/* ---- Haunting Aria: a 5-turn field the whole party stands in ----
   (3.08, the designer's revenge counter) While it runs his VENGEANCE builds:
   every enemy attack on your side adds 1 — landed, dodged or passing straight
   through — and every turn adds a random 0.35–0.7 more, attacked or not. At 1
   or more, in a turn's pre-action phase, his apparition strikes every enemy
   and it drops by 1: one strike a turn at most, so a heavy beating banks
   strikes for the turns after. It starts at 0 — at 1 if an attack woke him.
   (Before 3.08: a 50% roll each turn, certain if they had attacked since the
   last one.) */
function ariaState(){ return ui.battle ? getPStatus(0,'aria') : null; }
function ariaActive(){ const a = ariaState(); return !!(a && a.turnsLeft > 0); }

/* `pierced`: woken by an attack that cannot be dodged — he goes into the
   Aria all the same, but that blow lands (3.09), and its line is said with
   the blow (ariaPiercedNote), not here. */
function castAria(mon, def, byReflex, pierced){
  const b = ui.battle;
  if(!b || ariaActive()) return false;
  /* Five turns of it, each with its pre-action phase — the same phase as
     Overheat's burn, so it comes whether the last round ended with the
     enemy's attacks or with a wave you knocked out. Stored with the usual +1
     so the cast round is not counted; ariaRetaliate() ends it straight after
     the fifth, and the badge shows the turns to come.
     (3.09, the designer: "Diamond dust should not sweep aria because it's a
     state that whalelord goes into") — unsweepable: no Diamond Dust sweeps
     it or keeps it from starting, no Nova takes it, nothing steals it. (Your
     own dust still holds it open, as it holds anything of yours.) */
  const per = def.perAttack || 1;
  const st = setPStatus(0, {
    type:'aria', turnsLeft:(def.turns||5) + 1,
    pulse:def.pulse || 0.5,
    perAttack:per, drift:def.drift || [0.35, 0.7],
    vengeance: byReflex ? per : 0,  // the attack that woke him counts
    atk: monAtk(mon), owner: mon.uid,
    fieldEvade: 1,                 // one turn of total evasion, for ANYONE on the field —
    coverUsed: !!byReflex && !pierced,   // spent only in a round an attack actually passed through (2.74)
    unsweepable: true, state: true,      // a state he goes into, not a buff (3.09) — `state`: it still counts down
  });
  if(!st) return false;
  renderStatusBadges();
  if(pierced) b._ariaPierced = ` The ghostly whalelord begins to sing — but this blow sees straight through him. Prepare for vengeance.`;
  else battleMsg(byReflex
    ? `Attacks pass harmlessly through the ghostly whalelord. Prepare for vengeance.`
    : `Ominous whalesong fills the air.`);
  return true;
}
/* (3.08) An enemy attack on your side, while the Aria runs: one more for his
   vengeance. Called ONCE per attack, wherever it comes from — their move (at
   the attempt, however many hits or targets it has), a quick attack, a
   riposte, an afterimage, an Overcharge repeat, a copy's echo, Conversio's
   take — whether it lands, misses or passes straight through. */
function noteAriaAttack(){
  const a = ariaState();
  if(!a) return;
  a.vengeance = (a.vengeance || 0) + (a.perAttack || 1);
  renderStatusBadges();
}
/* (3.08) Any enemy attack reaching one of yours meets the Aria the same way —
   it used to depend on what kind of attack it was: the untouchable turn lets
   it pass through, and the Whalelord, struck with no Aria running, sings by
   reflex and it finds nothing where he was. (Their riposte, their
   afterimages, their Overcharge repeats and echoes, and their Conversio
   never woke him; their afterimages ignored the untouchable turn too.)
   Count the attack first (noteAriaAttack): a reflex then starts the count at
   1 for the attack that woke him. Returns true if it passed through.
   (3.09, the designer: "evasion piercing moves should hit through the
   evasion") `pierce`: an attack that cannot be dodged — a mind-read, a Third
   Eye, their Tachypsychia's own blows, Conversio's take — sees straight
   through the haunting: it lands, it does not spend the untouchable turn,
   and a reflex it wakes is the Aria alone (he still goes into it; the blow
   still lands). The caller adds ariaPiercedNote() to the blow's line. */
function ariaPassesThrough(mon, pierce){
  const canReflex = mon && !ariaActive() && !passivesMuted(mon)            // a ✦ Curse quiets the reflex (2.97)
                 && (MOVES[mon.species] || []).some(m=> m[6] && m[6].aria);
  if(pierce){
    if(ariaFieldEvasion() > 0 && ui.battle) ui.battle._ariaPierced = ` It sees straight through the haunting.`;
    else if(canReflex) ariaReflex(mon, true);
    return false;
  }
  if(ariaFieldEvasion() > 0){ noteAriaCover(); return true; }
  if(canReflex && ariaReflex(mon)){ noteAriaCover(); return true; }
  return false;
}
/* (3.09) What a blow that saw straight through the haunting says with its
   own line — once: read and cleared. */
function ariaPiercedNote(){
  const b = ui.battle;
  if(!b || !b._ariaPierced) return '';
  const s = b._ariaPierced;
  b._ariaPierced = null;
  return s;
}
/* His vengeance as the badge shows it: a tenth at a time, rounded DOWN, so it
   never reads 1.0 before it is really there. */
function ariaVengeanceShown(a){ return (Math.floor(((a && a.vengeance) || 0) * 10 + 1e-6) / 10).toFixed(1); }
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
function ariaReflex(mon, pierced){
  if(ariaActive()) return false;
  const mv = (MOVES[mon.species]||[]).find(m=>m[6] && m[6].aria);
  if(!mv) return false;
  return castAria(mon, mv[6].aria, true, pierced);
}
/* The pre-action phase (called from beginRound, beside Overheat's burn):
   every round the Aria lasts, his vengeance grows by a random 0.35–0.7 —
   attacked or not — and then, at 1 or more, his apparition strikes every
   enemy and it drops by 1 (3.08). Once a turn at most: what is left over
   waits for the next. After the fifth turn the Aria has ended (and its
   vengeance with it). */
function ariaRetaliate(done){
  const a = ariaState();
  if(!a) return done();
  const last = a.turnsLeft <= 1;
  const finish = ()=>{
    if(last && ariaState() === a){ removePStatus(0, 'aria'); }
    renderStatusBadges();
    done();
  };
  const [lo, hi] = a.drift || [0.35, 0.7];
  a.vengeance = (a.vengeance || 0) + lo + Math.random() * (hi - lo);
  if(a.vengeance + 1e-9 < 1) return finish();
  const foes = livingEnemies();
  if(!foes.length) return finish();
  a.vengeance = Math.max(0, a.vengeance - 1);
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
        const through = capHit(me, applyBlock(me, dmg, pid('playerBlk', me)));   // (3.15) a Carapace
        me.currentHp = Math.max(0, me.currentHp - through);
        if(through > 0) noteHurt(me);                       // an upkeep strike breaks a Focus (2.97)
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
   not there; the Aria's field lets it pass through — and counts it, 1 more
   for his vengeance (3.08); the Whalelord struck with no Aria running sings
   by reflex), and one block stack soaks it — but it never meets
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
    return !(getMStatus(m,'iceTomb') || getMStatus(m,'asleep') || getMStatus(m,'stunned'));
  }
  if(!(m.hp > 0) || standsAside(m)) return false;
  if(getEStatus(m,'iceTomb') || getEStatus(m,'paralysed') || getEStatus(m,'asleep')) return false;
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
  const ref = Object.assign(monRef(mon), { _ambush:0, _omen:0, _blow:newBlowId('q') });   // an ambush or omen waits for a real blow; an attack of its own (2.97)
  const dmg = computeDamage(quickOf(mon), monAtk(mon), ref, t, true);
  const hits = [{ t, idx, dmg, oldHp:t.hp, newHp:Math.max(0, t.hp - dmg) }];
  battleMsg(`⚡ Quick attack! ${name} darts in before anyone moves.`);
  setTimeout(()=>{ applyHits(hits, { noLeech:true, blow:ref._blow }); reportHits(hits); setTimeout(done, 400); }, 250);   // (its own attack: your Dragon Dance breaks shields first, 3.13)
}
/* Theirs, on whoever you have out front. */
function quickStrikeYours(e, mon, done){
  const b = ui.battle;
  const idx = b.enemies.indexOf(e), name = SPECIES[e.species].name;
  if(e.lurk || e.cunning){ breakCover(e); e._ambush = 0; renderStatusBadges(); }
  noteAriaAttack();                                           // an attack on your side, all the same
  bob(document.getElementById('enemyBob-' + idx), -1);
  const covered = ariaFieldEvasion() > 0;
  if(ariaPassesThrough(mon, seesThrough(e))){                 // the untouchable turn, or his reflex (3.08: one rule for every attack; 3.09: a Third Eye sees through)
    dodgePlayer(); floatMiss(pid('playerBob'), 'MISS');
    if(covered) battleMsg(`⚡ ${name}'s quick attack passes harmlessly through.`);
    return setTimeout(done, 700);
  }
  if(!seesThrough(e) && rollBlind(e)){                          // (3.25) blinded: it goes wide — no dodge of yours
    floatMiss(pid('playerBob'), 'MISS');
    battleMsg(`⚡ ${name}'s quick attack — 🔆 blinded, it misses!`);
    return setTimeout(done, 650);
  }
  if(!seesThrough(e) && Math.random() < playerEvasionFrom(e)){   // (a Third Eye cannot miss, 2.97)
    dodgePlayer(); floatMiss(pid('playerBob'), dodgeWord(mon));
    battleMsg(`⚡ ${name}'s quick attack finds nothing.`);
    return setTimeout(done, 650);
  }
  const omen = e._omen, amb = e._ambush;
  e._omen = 0; e._ambush = 0;                                 // kept for its real blow
  e._blow = newBlowId('q');                                   // an attack of its own (2.97)
  const dmg = computeDamage(quickOf(e), enemyAtk(e), e, monRef(mon), false);
  e._omen = omen; e._ambush = amb;
  const before = mon.currentHp;
  breakShields('enemy', e, mon, e._blow, pid('playerBlk'), pid('playerBob'));   // their Dragon Dance, before it hits (3.13)
  const through = capHit(mon, applyBlock(mon, dmg, pid('playerBlk')));   // (3.15) a Carapace
  if(through > 0) noteHurt(mon, e._blow);                     // it broke a Focus (2.97); an attack of its own (3.38)
  mon.lastDamageTaken = dmg;                                  // a reflection returns the full figure
  mon.currentHp = Math.max(b.allyUnkillable ? 1 : 0, mon.currentHp - through);
  if(b.arenaImmortal && mon.currentHp <= 0) mon.currentHp = monMaxHp(mon);
  flashHit(document.getElementById(pid('playerBob')));
  drainHp(pid('playerHp'), before, mon.currentHp, monMaxHp(mon));
  showDamageNumber(pid('playerBob'), before - mon.currentHp);
  floatBlocked(pid('playerBob'), dmg - through);
  playSfx('hit_taken');
  battleMsg(`⚡ Quick attack! ${name} darts in before anyone moves.` + ariaPiercedNote());
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

/* ============================================================
   DRAGON DANCE BREAKS SHIELDS (3.13)
   The designer: "for dragon dance, let's add the additional effect of
   dragon dance base/+/star removing 1/2/3 additional layers of shields with
   each attack ... the removal happens before the attack hits."
   While a side's Dragon Dance is up — CAST, at base / + / ✦ (`strip` on its
   status; carried, it is still Mach Dragon alone) — each attack of that side
   first breaks 1 / 2 / 3 of the target's shields, and then strikes what is
   left: a blocked strike still spends one, as ever, so one blocked blow takes
   2 / 3 / 4. Jax's Dragon walks in with it in force, on itself (`ddBreak`).
   ONE ATTACK, as the engine counts one for a Counter guard: your action — all
   its strikes, its Overcharge repeat and a clone's echo of it ('p' + the
   action's number) — or each attack of theirs (its `_blow`, repeats and
   echoes included); a quick attack and a riposte are attacks of their own.
   Once per attack on each monster it reaches, as its first strike LANDS: a
   dodged strike breaks nothing, nor does a copy's strike (afterimages), an
   upkeep burn, an Aftershock, the Aria or Wrath. Either side's.
   Diamond Dust leaves shields alone since 3.13 — Fairy is weak to Steel, and
   Dragon breaks Steel: the triangle.
   ============================================================ */
function shieldBreakOf(side, attacker){
  if(!ui.battle) return 0;
  const st = side === 'player' ? getPStatus(0,'dragonDance') : getESide('dragonDance');
  let n = (st && st.strip) || 0;
  if(side === 'enemy' && attacker && attacker.ddBreak) n = Math.max(n, attacker.ddBreak);
  return n;
}
/* Has attack `key` already broken this monster's shields (or found none)? */
function shieldBreakDone(key, holder){
  const b = ui.battle;
  const s = b && key && b._shieldBroke ? b._shieldBroke.get(key) : null;
  return !!(s && s.has(holder));
}
/* Break them, once per attack per monster; returns how many went. `barId`
   drains the bar, `anchorId` floats the count over the monster. */
function breakShields(side, attacker, holder, key, barId, anchorId){
  const b = ui.battle;
  if(!b || !holder || !key) return 0;
  const n = shieldBreakOf(side, attacker);
  if(!(n > 0) || shieldBreakDone(key, holder)) return 0;
  b._shieldBroke = b._shieldBroke || new Map();
  if(!b._shieldBroke.has(key)) b._shieldBroke.set(key, new Set());
  b._shieldBroke.get(key).add(holder);
  const had = blockStacksOf(holder);
  if(!had) return 0;
  const k = Math.min(n, had);
  holder.blockStacks = had - k;
  if(barId) drainBlock(barId, had, holder.blockStacks);
  if(anchorId) floatMiss(anchorId, `🐉 −${k} 🛡`, 'blk-pop', 0.16);
  setTimeout(refreshAllBlockBars, 0);
  logBattle(`  🐉 Dragon Dance breaks ${k} shield${k > 1 ? 's' : ''} (${had} → ${holder.blockStacks})`);
  return k;
}
/* Your strike's attack, for breakShields: what the caller says it is (a quick
   attack, a riposte), else — not an upkeep strike or a copy's (`noLeech`) —
   the action under way. */
function yourStrikeKey(opts){
  if(opts && opts.blow) return opts.blow;
  if(opts && opts.noLeech) return null;
  return (ui.battle && ui.battle.actionSeq) ? 'p' + ui.battle.actionSeq : null;
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

/* ---------- WHAT RIDES ON A HIT (3.16) ----------
   Leech Seed's bite (+ and ✦) and ✦ Spike Armour's strike are an extra
   instance of damage riding on one hit that landed. The designer: they
   should "scale with damage multiplication effects (they should) and break
   damage block stacks (they shouldn't)". So: through computeDamage like any
   blow — type, every damage buff and debuff of either side, every reduction,
   the passives — but straight to health, past every shield, breaking none;
   a Carapace still caps it. Not a hit itself: it feeds no Leech Seed (a
   rider never sets off another), is no strike for a Lullaby Reflex, and
   Steel Soul's flat bonus is not added to it (`rider`). Until 3.16 the bite
   was its bare share of ATK. `f` is its share of the attacker's ATK. */
function riderDamage(f, atk, attackerRef, defenderRef, isPlayerAttacking){
  if(!(f > 0) || !(atk > 0)) return 0;
  return computeDamage(f, atk, attackerRef, defenderRef, isPlayerAttacking, false, { rider:true });
}
/* A rider landing on one of theirs: returns what it took. */
function riderOnFoe(t, dmg){
  const b = ui.battle;
  if(!b || !t || t.hp <= 0 || !(dmg > 0)) return 0;
  const idx = b.enemies.indexOf(t);
  const before = t.hp;
  t.hp = Math.max(0, t.hp - capHit(t, dmg));
  if(b.arenaImmortal && t.hp <= 0) t.hp = t.maxHp;
  if(before > t.hp) noteHurt(t);
  drainHp('enemyHp-' + idx, before, t.hp, t.maxHp);
  if(t.hp <= 0){ const el = document.getElementById('enemy-' + idx); if(el) el.classList.add('fainted'); }
  return Math.max(0, before - t.hp);
}
/* ✦ Spike Armour, yours: one hit of `mon`'s landed on `t` — it strikes again.
   Returns what it took (shown with the hit's own number, reportHits). */
function spikeRiderYours(t, mon){
  const sa = ui.battle ? getPStatus(0,'spikeArmour') : null;
  if(!sa || !sa.spike || !mon || !t || t.hp <= 0) return 0;
  return riderOnFoe(t, riderDamage(sa.spike, monAtk(mon), monRef(mon), t, true));
}
/* ✦ Spike Armour, theirs: one hit of `e`'s landed on `me`. */
function spikeRiderTheirs(e, me){
  const b = ui.battle;
  const sa = b ? getESide('spikeArmour') : null;
  if(!sa || !sa.spike || !e || !me || me.currentHp <= 0) return 0;
  const dmg = capHit(me, riderDamage(sa.spike, enemyAtk(e), e, monRef(me), false));
  if(!(dmg > 0)) return 0;
  const before = me.currentHp;
  me.currentHp = Math.max(b.allyUnkillable ? 1 : 0, me.currentHp - dmg);
  if(before > me.currentHp) noteHurt(me);
  return before - me.currentHp;
}
/* Leech Seed in one place. Heals the whole party, and on + / ✦ also gnaws the
   enemy — with ✦ that bite feeds the heal again. Both the single-hit and the
   multi-hit paths call this, so they can never drift apart. (3.16) The bite
   rides on the hit (riderDamage): every multiplier counts, no shield is
   touched. The heal is still its share of the striker's ATK. */
function resolveLeech(target, mon){
  const ls = getEStatus(target,'leechSeed');
  if(!ls) return 0;
  const atk = monAtk(mon);
  let healed = Math.ceil((ls.heal || 0.15) * atk);
  const bite = ls.bite || 0;
  if(bite && target.hp > 0){
    const took = riderOnFoe(target, riderDamage(bite, atk, monRef(mon), target, true));
    showDamageNumber('enemy-' + ui.battle.enemies.indexOf(target), took);
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
   Diamond Dust strips what a side HAS: statuses, stances (since 3.13 not its
   shields — Fairy is weak to Steel; Dragon Dance breaks those). A refined
   Curse silences what its monsters ARE: while a ✦ curse is on a side, that
   side's passives do nothing — yours under theirs, theirs under yours. The
   always-on ones — first strike, Shadowed Wings' dodge, Terrorize, Hunter's
   Instinct, Nocturne, a quick attack, a Bog Lurker's bog, the Whalelord's
   reflex, and every one of the psychics' (2.97) — go quiet and come back when
   the curse lifts. A passive that fires on entry (Iron Shell, Guard, Soar…)
   does not fire for anything arriving while it holds. Stances already raised
   are buffs, and buffs are Diamond Dust's business.
   ============================================================ */
function passivesMuted(holder){
  const b = ui.battle;
  if(!b || !holder) return false;
  if(holder.broken) return true;                 // (3.19) Cyborg with its cores torn out: nothing in it works
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
/* The passives a monster HAS, working or not — for pills and announcements.
   A monster may carry more than one (2.97: a passive given on top, in the
   'Passive' slot — the Strongman's Braced Stance and Iron Will): every row it
   has reached is merged into one, `names` in order and `name` joining them. */
function passiveDefOf(e){
  if(!e || !e.species) return null;
  const lv = e.level || 1;
  const rows = (MOVES[e.species] || []).filter(m => m[3] === 'Passive' && m[6] && m[6].passive && lv >= m[5]);
  /* (3.27) The always-on part of a move that is cast as well (`always` — the
     Thunder Newt's Tachypsychia meditates, cast or not). Its effects are a
     passive's, read and muted (a ✦ Curse) as any; it has no pill or name of
     its own, as the move it belongs to is no passive. */
  const parts = (MOVES[e.species] || []).filter(m => m[3] !== 'Passive' && m[6] && m[6].always && lv >= m[5]);
  if(!rows.length && !parts.length) return null;
  const out = {};
  rows.forEach(r=> Object.assign(out, r[6].passive));
  parts.forEach(r=> Object.assign(out, r[6].always));
  out.names = rows.map(r=> r[1]);
  out.name = out.names.join(' & ');
  return out;
}
/* The passive that is WORKING. Every behaviour reads this one, so a passive
   added later is muted without having to be named here. */
function passiveOf(e){ return passivesMuted(e) ? null : passiveDefOf(e); }

/* ============================================================
   THE PSYCHICS' PASSIVES (2.97 — handover/05 §9)
   Every one is read through passiveOf, so a ✦ Curse mutes it on either side,
   and every one works the same in either side's hands.
     focus      Focus (the Fox): ×1.2 if nothing has hit it yet this round.
     thirdEye   Third Eye (the Squid): its blows cannot be dodged — a mind-read
                on every move. Block and a Counter guard still soak them.
     composure  Composure (the Tailed Cat): ×1.3 while it is at full health.
     exploit    Exploit (riding on Composure): ×1.4 on a target that is asleep
                or muddled, or whose side is under the other's Discombobulate.
     precog     Precognition (the Mindcat): the first attack to reach it each
                round lands at half — every strike of that attack.
     amnesia    Amnesia (the Mindcat, on everything it does): a blow that lands
                makes its target forget its best move for its next turn; an
                Overcharge repeat that lands, its next best as well.
     hypnosis   Hypnosis (the Tapir): a blow that lands has a 20% chance to put
                its target to sleep for one turn.
     ironWill   Iron Will (the Sumo, the Strongman): cannot be put to sleep,
                stunned or muddled.
     guardian · armour · soulfire — Knight's Oath (the Ghost Guardian): the
                single blows meant for his friends come to him; every blow
                that reaches him deals 30% less; every attack that reaches him
                is answered in purple fire, 0.3× his ATK at the attacker.
   A HIT, for Focus, is damage from the other side that gets through to it
   (noteHurt): not a dodge, not a blow its block soaked whole, not a muddled
   friend's swing, not the thorns its own attack runs into.
   ============================================================ */
function roundNo(){ return (ui.battle && ui.battle.roundNo) || 0; }
/* A monster's own scratch for this battle — yours by uid (so a monRef finds
   the same one, and none of it is saved), theirs on the monster. */
function bState(m){
  const b = ui.battle;
  if(!b || !m) return {};
  if(m.uid){ b.mscratch = b.mscratch || {}; return (b.mscratch[m.uid] = b.mscratch[m.uid] || {}); }
  return (m._scratch = m._scratch || {});
}
/* A monster of yours in this battle, found by uid: out on the field, or in
   the party. */
function battleMonByUid(uid){
  if(!uid || !ui.battle) return null;
  return playerField().find(m=> m.uid === uid) || battleParty().find(m=> m.uid === uid) || null;
}
/* The real monster behind a blow's reference: yours by uid, theirs itself. */
function realMon(ref){ return (ref && ref.uid) ? battleMonByUid(ref.uid) : (ref || null); }
/* Something of the other side's has hurt it this round. */
function noteHurt(m, blow){
  if(!m || !ui.battle) return;
  const s = bState(m), r = roundNo();
  if(s.hitRound !== r) s.hitBlows = [];
  s.hitRound = r;
  /* (3.38) which attack it was (its `_blow`, or your action's key): Pent-up
     Fury counts the attacks, not the strikes */
  if(blow && !(s.hitBlows || (s.hitBlows = [])).includes(blow)) s.hitBlows.push(blow);
  if(s.focus) s.focus.hurt = true;                 // (3.15) a hit while it gathers (Arcane Meteor)
  s.meditate = 0;                                  // (3.26) Meditate starts again
}
function hurtThisRound(m){ return !!m && bState(m).hitRound === roundNo(); }
/* (3.38) How many attacks of the other side have got through to it this
   round. ONE ATTACK as the engine counts one (shieldBreakOf): all a move's
   strikes, its Overcharge repeat and an echo of it; a quick attack and a
   riposte are attacks of their own. A burn, an upkeep strike, an Aftershock,
   an afterimage or a spike that rides on a blow is not an attack; nor is a
   blow its shields soaked whole, or one it dodged. */
function attacksThisRound(m){
  if(!m || !ui.battle) return 0;
  const s = bState(m);
  return s.hitRound === roundNo() ? (s.hitBlows || []).length : 0;
}
/* (3.38) Pent-up Fury's pay-back — the designer: "1.5/1.75/2x damage for each
   attack (not hit) it suffers that turn": `rv` [1.5, 1.75, 2] — one attack
   of theirs this round 1.5×, two 1.75×, three or more 2× (a bare number: that
   for any). 1 with none. The same either side. */
function revengeFactor(m, rv){
  if(!rv) return 1;
  const steps = Array.isArray(rv) ? rv : [rv];
  const n = attacksThisRound(m);
  return n > 0 ? steps[Math.min(n, steps.length) - 1] : 1;
}
/* One attack, one id: every strike of it shares it (Precognition). Your
   actions use the action's number (monRef); a quick attack, a riposte and
   each attack of theirs take a fresh one. */
function newBlowId(kind){ const b = ui.battle; if(!b) return null; b.blowN = (b.blowN || 0) + 1; return kind + b.blowN; }
/* Nothing it throws can be dodged: its own Third Eye — or (3.26) a Plasma
   Manta of its side standing, whose Lock-On (`lockOn`) is an aura. */
function seesThrough(m){
  if(!m) return false;
  const p = passiveOf(m);
  if(p && p.thirdEye) return true;
  /* (3.37) a Firefox's Stargazer: for its turns, nothing its side throws
     can be dodged — as a Lock-On, for a while */
  if(ui.battle && (m.uid ? getPStatus(0, 'stargaze') : getESide('stargaze'))) return true;
  return sideAura(m.uid ? 'player' : 'enemy', 'lockOn') > 0;
}
function atFullHealth(m){
  if(!m) return false;
  return m.uid ? m.currentHp >= monMaxHp(m) : m.hp >= m.maxHp;
}
/* Exploit's prey — (3.25) the designer: "exploit for increasing damage
   against monsters with mental-related debuffs": a mind in trouble. Asleep;
   confused (a muddle, a Lunacy, a Dazzle); blinded (a Blinding Beam);
   charmed; forgetting a move (Amnesia); or on a side the other's
   Discombobulate field is over. (Until 3.25: asleep or muddled, or the
   field.) A stun, a weaken, a curse, a seed or a burn is not the mind's.
   `t` is the real target; `isPlayerAttacking` says whose. */
function exploitable(t, isPlayerAttacking){
  if(!t) return false;
  if(blindOf(t) || forgottenNames(t).length) return true;
  if(isPlayerAttacking) return !!(getEStatus(t,'asleep') || getEStatus(t,'discombobulate') || getEStatus(t,'charm') || getPStatus(0,'confusionField'));
  return !!(getMStatus(t,'asleep') || getMStatus(t,'discombobulate') || getPStatus(0,'charmed') || getESide('confusionField'));
}
/* ---------- BLINDED (3.25) ----------
   The Ladybird's Blinding Beam: "merge glow's effect into blinding beam —
   triggered on a single target upon a hit, raised to 25%". A beam that gets
   through blinds the one it hit (`blindHit:{ miss, turns }`): a quarter of
   its OWN strikes miss, for the rest of this turn and the next. Its failing,
   not the other side's dodge — so it is rolled before any dodge (rollBlind:
   rollDodge for yours, every strike site of theirs), and nothing banks,
   copies, fractures or wakes on it as on a dodge; Arcane Sight (which halves
   the other side's DODGING) does not help it; a mind-read or a Third Eye
   still never misses. Yours: on the monster (MON_DEBUFFS), `turnsLeft` aged
   by the round. Theirs: with `until`, the last round it holds, cleared as a
   round begins (as Amnesia's). Either side's Diamond Dust keeps the other's
   off and sweeps it; an Ice Barrier or a Sylph lifts it like any mark. A
   mind in trouble: Exploit feeds on it. */
const BLIND_MISS = 0.25;
function blindOf(m){
  if(!m || !ui.battle) return null;
  if(m.uid) return getMStatus(m, 'blinded');
  const st = getEStatus(m, 'blinded');
  return (st && (st.until == null || st.until >= roundNo())) ? st : null;
}
/* How likely `m`'s strike is to go wide — 0 if it can see. */
function blindMiss(m){ const st = blindOf(m); return st ? (st.miss || BLIND_MISS) : 0; }
function rollBlind(m){ const p = blindMiss(m); return p > 0 && Math.random() < p; }
/* A beam got through to `t`: blinded for `def.turns` turns — this one and
   the next. Returns the words for the line ('' if nothing took). */
function blindMark(t, def, how){
  if(!t || !ui.battle) return '';
  const yours = !!t.uid, name = yours ? displayName(t) : SPECIES[t.species].name;
  const turns = (def && def.turns) || 2, miss = (def && def.miss) || BLIND_MISS;
  if(yours) setMStatus(t, { type:'blinded', turnsLeft:turns, miss, by:'enemy' });
  else addEStatus(t, { type:'blinded', until:roundNo() + turns - 1, miss, mine:true });
  if(!blindOf(t)) return `💎 The diamond dust keeps ${escapeHtml(name)}'s eyes clear.`;
  return `🔆 ${how ? how + ' — ' : ''}${escapeHtml(name)} is <b>blinded</b>: ${Math.round(miss * 100)}% of its attacks will miss!`;   // `how`: the caller's, its names escaped
}
/* A word floating over a monster: yours or theirs. */
function floatOver(m, text, cls){
  const b = ui.battle;
  if(!b || !m || typeof floatMiss !== 'function') return;
  const at = m.uid ? pid('playerBob', battleMonByUid(m.uid) || m) : 'enemy-' + b.enemies.indexOf(m);
  setTimeout(()=>{ try{ floatMiss(at, text, cls); }catch(e){} }, 380);
}
/* Precognition: the first attack to reach it each round lands at `f` — and
   the rest of that attack's strikes with it. `peek` (an estimate) uses
   nothing up. */
function precogFactor(t, attacker, f, peek){
  const s = bState(t), r = roundNo(), id = (attacker && attacker._blow) || null;
  if(s.precogRound !== r){
    if(peek) return f;
    s.precogRound = r; s.precogBlow = id;
    floatOver(t, 'FORESEEN');
    return f;
  }
  return (id && s.precogBlow === id) ? f : 1;
}
/* What the attacker was like as its attack began — at full health? hit yet
   this round? — read at the attack's first strike and kept for the rest of
   it (by its `_blow`), so the thorns its first strike runs into cannot spoil
   its second. */
function attackStart(me, attacker){
  const s = bState(me), id = (attacker && attacker._blow) || null;
  if(id && s.startBlow === id) return s.start;
  const st = { full:atFullHealth(me), unhurt:!hurtThisRound(me) };
  if(id){ s.startBlow = id; s.start = st; }
  return st;
}
/* What the passives do to one blow, on top of everything else. `opts` is
   computeDamage's: a rider's strike (a Spike Armour's) is not the move's. */
function passiveDamageMult(attacker, defender, isPlayerAttacking, peek, opts){
  if(!ui.battle) return 1;
  let m = 1;
  const pa = (attacker && attacker.species) ? passiveOf(attacker) : null;
  if(pa){
    const me = realMon(attacker), them = realMon(defender);
    const st = (me && (pa.composure || pa.focus)) ? attackStart(me, attacker) : null;
    if(pa.composure && st && st.full) m *= pa.composure;
    if(pa.exploit && exploitable(them, isPlayerAttacking)) m *= pa.exploit;
    if(pa.focus && st && st.unhurt) m *= pa.focus;
    if(pa.meditate && me) m *= 1 + pa.meditate * meditateStacks(me);   // (3.26) Meditate
    /* (3.26) Feeding Frenzy's critical: each strike of yours its own roll
       here (every strike of yours asks computeDamage); each of theirs in
       enemyStrikeOn's strike loop (critStrike), since theirs asks once an
       attack. Never on an estimate, never on a rider's strike. */
    if(pa.crit && isPlayerAttacking && !peek && !(opts && opts.rider)) m *= critStrike(attacker, them);
  }
  const pd = (defender && defender.species) ? passiveOf(defender) : null;
  if(pd){
    if(pd.armour) m *= (1 - pd.armour);
    /* (3.37) the Hermit Sloth's: half from every attack until it has moved this round */
    if(pd.braced){ const them = realMon(defender); if(them && notYetMoved(them)) m *= (1 - pd.braced); }
    if(pd.precog){ const them = realMon(defender); if(them) m *= precogFactor(them, attacker, pd.precog, peek); }
  }
  return m;
}
/* Iron Will: no sleep, no stun, no muddle — and an ice that is called a
   sleep (their carried Ice Tomb's freeze) is ice, not a mind. */
const IRON_WILL_TYPES = new Set(['asleep','stunned','paralysed','discombobulate']);
function ironWillHolds(holder, status){
  if(!holder || !status || !IRON_WILL_TYPES.has(status.type) || status.frozen) return false;
  const p = passiveOf(holder);
  return !!(p && p.ironWill);
}
/* Asleep for one turn — its next. Yours keep a nap as `turnsLeft:2` (the
   round ages it as well as the turn), theirs `turnsLeft:1` (only its turn
   does). Returns the words for the message ('' if it was asleep already). */
function putToSleep(t, how){
  if(!t || !ui.battle) return '';
  const yours = !!t.uid, name = yours ? displayName(t) : SPECIES[t.species].name;
  if(yours ? getMStatus(t,'asleep') : getEStatus(t,'asleep')) return '';
  if(ironWillHolds(t, { type:'asleep' })){ floatOver(t, 'IRON WILL'); return `💪 ${name}'s Iron Will shrugs off ${how}!`; }
  if(yours) setMStatus(t, { type:'asleep', turnsLeft:2, by:'enemy' });
  else addEStatus(t, { type:'asleep', turnsLeft:1, mine:true });
  const slept = yours ? getMStatus(t,'asleep') : getEStatus(t,'asleep');
  return slept ? `💤 ${how} — ${name} falls asleep!` : `💎 The diamond dust keeps ${name} awake.`;
}
/* How many strikes a move makes: its own `hits`. (3.26) The designer:
   "crowning should not change the moves, even though they are based on the
   number of tails/heads … crowning should simply open up the level cap and
   raise stat progression". A Tailed Cat's tails and a Hydra's heads are the
   sprite's look; each move strikes a set number of times. (3.14–3.25: one
   strike a tail or head — by form, and four tails or five heads crowned —
   STRIKE_COUNTS and tailCount.) `holder` is kept for the call sites. */
function moveHitsFor(holder, ex){ return (ex && ex.hits) || 0; }

/* ---------- AMNESIA ----------
   Yours: a 'forgot' status on the monster ({ names }) that the round ages —
   one round if its turn this round is still to come, else two — so it covers
   exactly its next turn. Theirs: the same, with `until`, the last round it
   holds, cleared as each round begins. A side's own dust keeps it off, and
   sweeps it away, as any mark. */
function turnStillToCome(m){
  const b = ui.battle;
  const row = b && (b.order || []).find(r=> r.mon === m);
  return !!(row && !row.acted);
}
/* (3.37) It has not moved yet this round: its place in the order still to
   come, or no place in it (out since the order was drawn up) — or the
   round's order not drawn up yet (the first strikes of a round, before
   anybody moves). Its own turn begun, it has moved. */
function notYetMoved(m){
  const b = ui.battle;
  if(!b || !m) return false;
  if(b.orderRound !== b.roundNo) return true;
  const row = (b.order || []).find(r=> r.mon === m);
  return row ? !row.acted : true;
}
function forgottenNames(m){
  if(!m || !ui.battle) return [];
  if(m.uid){ const st = getMStatus(m, 'forgot'); return (st && st.names) || []; }
  const st = getEStatus(m, 'forgot');
  return (st && (st.until == null || st.until >= roundNo()) && st.names) || [];
}
/* Their damaging moves as they can use them now (a Max in place of its
   Ultimate). */
function foeMoveRows(e){
  const all = (MOVES[e.species] || []).filter(r=> r[1] != null && r[2] != null && r[3] !== 'Passive' && (e.level || 1) >= r[5]);
  const hasMax = all.some(r=> r[0] === 'Max');
  return all.filter(r=> !(hasMax && r[0] === 'Ultimate'));
}
/* How much a move deals to one target, in ATKs — to rank a monster's moves. */
function foeMoveWeight(e, r){
  const ex = r[6] || {}, hits = moveHitsFor(e, ex) || 1;
  return (ex.split && hits > 1) ? r[2] : r[2] * hits;
}
function yourMoveWeight(mv){
  const hits = mv.hits > 1 ? mv.hits : 1;
  if(mv.slot === 'UltraStone' && mv.ultraStone){ const r = ultraHitRange(mv.ultraStone); return mv.mult * (r.min + r.max) / 2; }
  return (mv.split && hits > 1) ? mv.mult : mv.mult * hits;
}
/* Its strongest moves first, past what it has already forgotten. */
function bestMoveNames(m){
  if(!m) return [];
  const rank = list=> list.map((x, i)=> Object.assign(x, { i })).sort((a, c)=> (c.v - a.v) || (c.i - a.i)).map(x=> x.name);
  if(m.uid) return rank(unlockedMoves(m).filter(mv=> mv.available && mv.mult != null && !mv.forgotten)
                                      .map(mv=> ({ name:mv.name, v:yourMoveWeight(mv) })));
  const fg = forgottenNames(m);
  return rank(foeMoveRows(m).filter(r=> !fg.includes(r[1])).map(r=> ({ name:r[1], v:foeMoveWeight(m, r) })));
}
/* It forgets its best move — or, forgetting already, the next best as well.
   Returns the move's name, or '' if nothing was forgotten. */
function forgetBest(m){
  if(!ui.battle || !m) return '';
  const name = bestMoveNames(m)[0];
  if(!name) return '';
  const names = forgottenNames(m).concat(name);
  if(m.uid) return setMStatus(m, { type:'forgot', names, turnsLeft:turnStillToCome(m) ? 1 : 2, by:'enemy' }) ? name : '';
  const st = { type:'forgot', names, until:roundNo() + (turnStillToCome(m) ? 0 : 1), mine:true };
  addEStatus(m, st);
  return getEStatus(m, 'forgot') === st ? name : '';
}
/* ---------- TAUNT (3.38) ----------
   The Hermit Sloth's Mocking Yawn — the designer: "puts a 1 turn taunt,
   forcing enemy monsters to attack it with their most powerful moves on the
   next turn". Every one the yawn gets through to is taunted for its next
   turn: it throws its strongest attack (tauntPick), and a blow it aims at
   one goes to the Sloth (enemyPickTarget; yours, promptTarget). An area move
   still strikes them all. Yours: a 'taunted' status on the monster
   ({ taunter }) that the round ages — one round if its turn this round is
   still to come, else two, as Amnesia's. Theirs: the same with `until`,
   cleared as each round begins. The other side's dust keeps it off and
   sweeps it, as any mark; with the Sloth gone from the field it is over. A
   monster that follows a script (a boss, the Don's dragon, Jax's three, the
   eagle, the Caladrius…) keeps its own move, and aims it at the Sloth. */
function tauntMark(t, by, def){
  if(!t || !by || !ui.battle) return false;
  const extra = Math.max(0, ((def && def.turns) || 1) - 1);
  if(t.uid) setMStatus(t, { type:'taunted', taunter:by, turnsLeft:(turnStillToCome(t) ? 1 : 2) + extra, by:'enemy' });
  else addEStatus(t, { type:'taunted', taunter:by, until:roundNo() + (turnStillToCome(t) ? 0 : 1) + extra, mine:true });
  return !!(t.uid ? getMStatus(t, 'taunted') : getEStatus(t, 'taunted'));
}
/* The taunt on `m` while it holds — its taunter still standing on the field — or null. */
function tauntOf(m){
  if(!m || !ui.battle) return null;
  const st = m.uid ? getMStatus(m, 'taunted') : getEStatus(m, 'taunted');
  if(!st || !st.taunter) return null;
  if(!m.uid && st.until != null && st.until < roundNo()) return null;
  const t = st.taunter;
  const there = t.uid ? livingField().includes(t) : (t.hp > 0 && (ui.battle.enemies || []).includes(t));
  return there ? st : null;
}
function tauntName(st){ const t = st && st.taunter; return !t ? '' : t.uid ? displayName(t) : SPECIES[t.species].name; }
/* The strongest attack it can throw this turn. Yours from its buttons (`list`,
   unlockedMoves'): not a stone, a charge or a wind-up's first turn. Theirs
   from its rows (foeMoveRows): not a wind-up, a climb, a charge or a copy. */
function tauntPick(m, list){
  const best = xs=> xs.sort((a, c)=> (c.v - a.v) || (c.i - a.i)).map(x=> x.it)[0] || null;
  if(m.uid) return best((list || []).map((mv, i)=> ({ it:mv, i, v:yourMoveWeight(mv) })).filter(({ it:mv })=>
    mv.available && mv.mult != null && mv.mult > 0 && !mv.isStone && !mv.charge && !mv.chargeSpend && !mv.chargeMore &&
    (!mv.windup || mv.windupReady) && mv.target !== 'Status'));
  const fg = forgottenNames(m);
  return best(foeMoveRows(m).map((r, i)=> ({ it:r, i, v:foeMoveWeight(m, r) })).filter(({ it:r })=>{
    const x = r[6] || {};
    return r[2] > 0 && !fg.includes(r[1]) && !x.windup && !x.stoop && !x.charge && !x.copy && r[3] !== 'Charge';
  }));
}
/* Whose move a taunt chooses: an ordinary fighter's, not one that follows a script. */
const TAUNT_SCRIPTED_AI = new Set(['ankylo', 'cataclysm', 'dragon', 'tricer', 'firehound', 'maxer', 'stoop', 'caladrius']);
function tauntTurnsMove(e){
  if(!e || e.boss || e.rewinder || e.broken) return false;
  if(TAUNT_SCRIPTED_AI.has(e.ai)) return false;
  return !['cormorant', 'caladrius', 'ghost_flame', 'horned_lynx'].includes(e.species);
}
/* Its pill: "🥱 Taunted · Hermit Sloth" while it holds. */
function tauntPill(m){ const st = tauntOf(m); return st ? `🥱 Taunted · ${escapeHtml(tauntName(st))}` : ''; }
/* What a landed attack sets off on each target it hurt: Hypnosis, Amnesia.
   `attacker` is the real attacker; `victims` the real targets; `repeat` for
   an Overcharge repeat (Amnesia only). Returns message lines. */
function mindPassivesLanded(attacker, victims, repeat){
  const p = attacker ? passiveOf(attacker) : null;
  if(!p || !(p.hypnosis || p.amnesia) || !victims || !victims.length) return [];
  const who = attacker.uid ? displayName(attacker) : SPECIES[attacker.species].name;
  const lines = [];
  victims.forEach(t=>{
    const alive = t && (t.uid ? t.currentHp > 0 : t.hp > 0);
    if(!alive) return;
    const name = t.uid ? displayName(t) : SPECIES[t.species].name;
    if(p.amnesia){
      const f = forgetBest(t);
      if(f){ lines.push(`💭 ${who}'s Amnesia — ${name} forgets <b>${escapeHtml(f)}</b> for its next turn!`); floatOver(t, 'FORGOT'); }
    }
    if(p.hypnosis && !repeat && Math.random() < p.hypnosis){
      const said = putToSleep(t, `${who}'s Hypnosis`);
      if(said) lines.push(said);
    }
  });
  if(lines.length) renderStatusBadges();
  return lines;
}
/* Knight's Oath's soulfire: what an attack that reached `holder` costs its
   attacker (0 for anyone else). */
function soulfireBack(holder){
  const p = holder ? passiveOf(holder) : null;
  if(!p || !p.soulfire) return 0;
  return Math.ceil(p.soulfire * (holder.uid ? monAtk(holder) : enemyAtk(holder)));
}

/* ============================================================
   THE FIFTEEN PSYCHICS (3.15) — their machinery, either side's
   The designer's fifteen (handover/05 §9c). Every passive here is read
   through passiveOf, so a ✦ Curse on its side mutes it; every effect works
   the same in either side's hands.
     crit        Feeding Frenzy (the Hydra; 3.26 — Exploit and this): every
                 strike 15% to deal 2× (critStrike). (3.15–3.25: `frenzy`,
                 +25% a strike for every mark on its target, to 4 — marksOnMon.)
     hitCap      Carapace (the Steelcrab): no single hit takes more than a
                 third of its health (capHit) — after its shields.
     slow        Carapace, Hermit's Patience: it moves a step later.
     slipstream  Slipstream (the Plasma Manta): its whole side, itself
                 included, moves a step sooner while it stands.
     lockOn      (3.26) Lock-On, the Plasma Manta's too (Plasma Current):
                 while it stands nothing its side throws can be dodged — an
                 aura read by seesThrough, as a Third Eye is.
     ward        Tidal Ward (the Seadragon): its side takes 15% less.
     trueSight   Arcane Sight (the Firefox): the other side dodges its side's
                 strikes half as often (sightFactor).
     empower     (3.36) Cheer — (3.37) the Firefox's Blazing Speed, with
                 `speed`: while it stands, its side deals 15% more
                 (computeDamage); 10%, with Arcane Sight, in 3.36.
     speed       (3.37) Blazing Speed: it moves three steps sooner
                 (initiativeOf), itself only.
     braced      (3.37) the Hermit Sloth's: half from every attack until it
                 has moved in the round (notYetMoved, passiveDamageMult).
     shakeOff    (3.37) the Hermit Sloth's: at the end of every turn one of
                 the other side's marks on itself comes off (shakeOffMarks,
                 endRound) — its own, not its side's.
     meditate    (3.26) Meditate (the Quetzal's Shimmering Plumage; the
                 Firefox's Stargazer until 3.36): +15% for every turn it ends untouched,
                 to +60%; a hit starts it again (meditateStacks).
     sleepBack   Lullaby Reflex (the Nurse): every strike that reaches it has
                 a 50% chance to put the attacker to sleep for its next turn.
     inkBack     (3.27) Ink Cloud (the Squid's Ocular Magic, with Third Eye):
                 every strike that reaches it, 25% to blind the attacker.
     weakBack    (3.27) Warning Colours (the Ladybird's Mind Sear, with
                 Exploit): every strike that reaches it, 25% to weaken the
                 attacker — its next attack at half.
     undertow    (3.27) Undertow (the Seadragon's Psionic Tide, with Tidal
                 Ward): while it stands, the other side moves a step later.
     retaliate   Hermit's Patience: every attack that reaches it is answered,
                 0.4× its ATK at the attacker.
     dodgeBank   Moonlit Retribution (the Unicorn): every strike of its side
                 the other side dodges banks 1.2× its ATK (5 at most a turn);
                 at the end of the turn it all falls on every one of them —
                 no dodging it, a shield still soaks it (resolveRetribution).
     cleanseEnd  Sylph's Grace: at the end of every turn one of the other
     drowse      side's marks comes off its side; at the start of every
                 turn each of the other side may fall asleep (15%).
   And (3.24) the Ladybird's, by the same rules — (3.25) its Spotlight is
   the planned Exploit now (exploitable: a mind in trouble), and its Glow went
   into its beam:
     blindHit    Blinding Beam: the one it hits is BLINDED (blindOf) — a
                 quarter of its own strikes miss, this turn and the next
                 (rollBlind: in rollDodge for yours, at each strike of
                 theirs). Its own failing, not a dodge: nothing banks, copies
                 or answers it as one, and Arcane Sight does not help it; a
                 mind-read or a Third Eye still never misses.
     (Its Dazzle is a Lunacy with `glow` — only the words differ.)
   ============================================================ */
function sideField(side){ return side === 'player' ? livingField() : livingEnemies(); }
function monName(m){ return !m ? '' : (m.uid ? displayName(m) : SPECIES[m.species].name); }
function hpOfMon(m){ return m.uid ? m.currentHp : m.hp; }
function maxHpOfMon(m){ return m.uid ? monMaxHp(m) : m.maxHp; }
function atkOfMon(m){ return m.uid ? monAtk(m) : enemyAtk(m); }
/* The strongest of one passive among the living of a side (an aura). */
function sideAura(side, key){
  let best = 0;
  sideField(side).forEach(m=>{ const p = passiveOf(m); if(p && p[key] > best) best = p[key]; });
  return best;
}
/* Every mark the other side has put on one monster or on its side, each
   kind once — what the Hydra fed on until 3.26 (its Feeding Frenzy is
   Exploit and a critical now); kept for the next that counts marks. */
function marksOnMon(t){
  if(!t || !ui.battle) return 0;
  const kinds = new Set();
  if(t.uid){
    monStatuses(t).forEach(st=>{ if(!st.unsweepable && statusOwner(st.type, st, 'player') === 'enemy') kinds.add(st.type); });
    const ps = partyStatuses();
    Object.keys(ps).forEach(k=>{ const st = ps[k]; if(!st.unsweepable && statusOwner(k, st, 'player') === 'enemy') kinds.add(k); });
  } else {
    eStatuses(t).forEach(st=>{ if(!st.unsweepable && statusOwner(st.type, st, 'enemy') === 'player') kinds.add(st.type); });
    const fs = ui.battle.fieldStatus || {};
    Object.keys(fs).forEach(k=>{ if(!fs[k].unsweepable) kinds.add(k); });
  }
  if(kinds.has('paralysed') && kinds.has('stunned')) kinds.delete('paralysed');   // one stun
  if(kinds.has('charm') && kinds.has('charmed')) kinds.delete('charm');
  return kinds.size;
}
/* (3.26) Feeding Frenzy's critical: a 15% chance a strike lands at 2×. Rolls
   and says it ("CRITICAL" over the one struck); returns the multiplier, or 1.
   The count for the line is kept by action (takePsyNote; theirs on the
   attack's own line). */
function critStrike(attacker, struck){
  const p = attacker ? passiveOf(attacker) : null;
  if(!p || !p.crit || !(Math.random() < (p.crit.chance || 0.15))) return 1;
  if(struck) floatOver(struck, 'CRITICAL');
  const b = ui.battle;
  if(b && attacker && attacker.uid){
    if(b._critAt !== b.actionSeq){ b._critAt = b.actionSeq; b._crits = 0; }
    b._crits++;
  }
  return p.crit.mult || 2;
}
/* (3.26) MEDITATE — planned in 2.97, given in 3.26 to the Quetzal and the
   Firefox. Each turn it ends untouched, +15% (`meditate`), to +60%
   (`meditateMax` 4 turns); a hit (noteHurt — damage from the other side
   that gets through) starts it again. Per battle, never saved: bState. A ✦
   Curse mutes the bonus while it lasts (passiveOf), the count goes on. */
function meditateStacks(m){
  const p = m ? passiveOf(m) : null;
  if(!p || !p.meditate) return 0;
  return Math.min(p.meditateMax || 4, bState(m).meditate || 0);
}
function meditateTurn(m){
  if(!m || hpOfMon(m) <= 0) return;
  const p = passiveDefOf(m);
  if(!p || !p.meditate) return;
  const s = bState(m);
  if(hurtThisRound(m)) s.meditate = 0;
  else s.meditate = Math.min(p.meditateMax || 4, (s.meditate || 0) + 1);
}
function meditatePill(m, cls, who){
  const n = meditateStacks(m), p = n ? passiveOf(m) : null;
  return n ? `<span class="status-pill ${cls}"${pillAt('meditate', who || 'p')}>🧘 Meditate +${Math.round(p.meditate * n * 100)}%</span>` : '';
}
/* Carapace: what one hit may take at most. */
function capHit(holder, dmg, peek){
  const p = holder ? passiveOf(holder) : null;
  if(!p || !p.hitCap || !(dmg > 0)) return dmg;
  const cap = Math.max(1, Math.ceil(maxHpOfMon(holder) * p.hitCap));
  if(dmg <= cap) return dmg;
  if(!peek) floatOver(holder, 'CARAPACE');
  return cap;
}
/* Arcane Sight on the attacking side: the other side's evasion, halved. */
function sightFactor(side){ const s = sideAura(side, 'trueSight'); return s > 0 ? Math.max(0, 1 - s) : 1; }
/* Lullaby Reflex: a strike reached `holder` — its attacker may fall asleep. */
function sleepBackRoll(holder, attacker){
  const p = holder ? passiveOf(holder) : null;
  if(!p || !p.sleepBack || !attacker || hpOfMon(holder) <= 0 || hpOfMon(attacker) <= 0) return '';
  if(Math.random() >= p.sleepBack) return '';
  return putToSleep(attacker, `${monName(holder)}'s Lullaby Reflex`);
}
/* (3.27) Ink Cloud (the Squid's Ocular Magic): a strike reached `holder` —
   its attacker may get ink in its eyes: blinded for this turn and the next
   (blindMark: the dust keeps it off). Rolled where Lullaby Reflex is. */
function inkBackRoll(holder, attacker){
  const p = holder ? passiveOf(holder) : null;
  if(!p || !p.inkBack || !attacker || hpOfMon(holder) <= 0 || hpOfMon(attacker) <= 0) return '';
  if(blindOf(attacker) || Math.random() >= (p.inkBack.chance || 0.25)) return '';
  return blindMark(attacker, p.inkBack, `${escapeHtml(monName(holder))}'s Ink Cloud`);
}
/* A weakened attack of yours has been made: the weakening is used up — but
   (3.27) one a Warning Colours put on it during that very attack (`fresh`)
   waits for the next. */
function spendYourWeaken(){
  const sf = getPStatus(0, 'softened');
  if(!sf) return;
  if(sf.fresh) delete sf.fresh;
  else removePStatus(0, 'softened');
}
/* (3.27) Warning Colours (the Ladybird's Mind Sear): a strike reached
   `holder` — its attacker may recoil, weakened: its next attack deals half.
   Yours is marked `fresh` so the attack it struck with does not use it up
   (afterPlayerAttack) or feel it (computeDamage); theirs is used up only by
   an attack that began weakened (enemyStrikeWrap). */
function weakBackRoll(holder, attacker){
  const p = holder ? passiveOf(holder) : null;
  if(!p || !p.weakBack || !attacker || hpOfMon(holder) <= 0 || hpOfMon(attacker) <= 0) return '';
  const yours = !!attacker.uid;
  const has = ()=> yours ? getMStatus(attacker, 'softened') : getEStatus(attacker, 'softened');
  if(has() || Math.random() >= (p.weakBack.chance || 0.25)) return '';
  const amount = p.weakBack.amount || 0.5, name = escapeHtml(monName(attacker));
  if(yours) setMStatus(attacker, { type:'softened', turnsLeft:2, amount, by:'enemy', fresh:true });
  else addEStatus(attacker, { type:'softened', turnsLeft:2, amount });
  if(!has()) return `💎 The diamond dust keeps ${name}'s strength intact.`;
  return `🐞 ${escapeHtml(monName(holder))}'s Warning Colours — ${name} is <b>weakened</b>: its next attack deals ${Math.round((1 - amount) * 100)}%!`;
}
/* Hermit's Patience: what an attack that reached `holder` costs its attacker. */
function retaliateBack(holder){
  const p = holder ? passiveOf(holder) : null;
  if(!p || !p.retaliate) return 0;
  return Math.ceil(p.retaliate * atkOfMon(holder));
}
/* Moonlit Retribution: a strike of `side` was dodged. */
function bankHolder(side){
  return sideField(side).filter(m=>{ const p = passiveOf(m); return !!(p && p.dodgeBank); })
    .sort((a, c)=> atkOfMon(c) - atkOfMon(a))[0] || null;
}
function bankDodge(side){
  const b = ui.battle;
  const u = b ? bankHolder(side) : null;
  if(!u) return;
  const p = passiveOf(u);
  b.dodgeBank = b.dodgeBank || { player:0, enemy:0 };
  b.dodgeBank[side] = Math.min(p.bankCap || 5, (b.dodgeBank[side] || 0) + 1);
}
/* The end of the turn: each side's bank falls on every one of the other. */
function resolveRetribution(done){
  const b = ui.battle;
  if(!b || !b.dodgeBank) return done();
  const sides = ['player', 'enemy'];
  const step = ()=>{
    if(!ui.battle) return;
    const side = sides.shift();
    if(!side) return done();
    const n = b.dodgeBank[side] || 0;
    b.dodgeBank[side] = 0;
    const u = n > 0 ? bankHolder(side) : null;
    if(!u) return step();
    const p = passiveOf(u), f = (p.dodgeBank || 1.2) * n, who = monName(u);
    if(side === 'player'){
      const foes = livingEnemies();
      if(!foes.length) return step();
      const hits = foes.map(t=>{
        const dmg = enemyGuard(t, computeDamage(f, monAtk(u), monRef(u), t, true));
        return { t, idx:b.enemies.indexOf(t), dmg, oldHp:t.hp, newHp:Math.max(0, t.hp - dmg) };
      });
      battleMsg(`🦄 Moonlit Retribution — the light of <b>${n}</b> dodged blow${n > 1 ? 's' : ''} falls on every one of them!`);
      playEffect('Moonlit Retribution', { type:'Psychic' });
      return setTimeout(()=>{ applyHits(hits, { noLeech:true }); reportHits(hits); setTimeout(step, 800); }, 380);
    }
    const mine = livingField();
    if(!mine.length) return step();
    mine.forEach(me=>{
      const dmg = computeDamage(f, enemyAtk(u), u, monRef(me), false);
      const before = me.currentHp;
      const through = capHit(me, applyBlock(me, dmg, pid('playerBlk', me)));
      me.currentHp = Math.max(b.allyUnkillable ? 1 : 0, me.currentHp - through);
      if(b.arenaImmortal && me.currentHp <= 0) me.currentHp = monMaxHp(me);
      if(through > 0) noteHurt(me);
      flashHit(document.getElementById(pid('playerBob', me)));
      drainHp(pid('playerHp', me), before, me.currentHp, monMaxHp(me));
      showDamageNumber(pid('playerBob', me), before - me.currentHp);
      floatBlocked(pid('playerBob', me), dmg - through);
    });
    battleMsg(`🦄 ${escapeHtml(who)}'s Moonlit Retribution — the light of <b>${n}</b> dodged blow${n > 1 ? 's' : ''} falls on your side!`);
    playEffect('Moonlit Retribution', { type:'Psychic', at:pid('playerBob') });
    setTimeout(step, 900);
  };
  step();
}
/* Sylph's Grace, at the end of the turn: one of the other side's marks off
   its side. */
function sylphCleanse(){
  if(!ui.battle) return;
  ['player', 'enemy'].forEach(side=>{
    const n = sideAura(side, 'cleanseEnd');
    const holder = n ? sideField(side).find(m=>{ const p = passiveOf(m); return p && p.cleanseEnd; }) : null;
    for(let k = 0; k < n && holder; k++){
      const pool = marksOnSide(side);
      if(!pool.length) break;
      const x = pool[Math.floor(Math.random() * pool.length)];
      x.take();
      battleMsg(`🍃 ${side === 'player' ? 'Your' : 'Their'} Sylph's Grace — ${x.label} is lifted off ${side === 'player' ? 'your side' : 'theirs'}.`);
    }
  });
  renderStatusBadges();
}
/* (3.37) The Hermit Sloth's own (`shakeOff`): at the end of every turn one
   of the other side's marks on ITSELF comes off — the worst first. A
   monster's own marks only (a freeze, a nap, a stun, a muddle, a blinding, a
   forgotten move, a weakened blow): never its side's (a Curse, a seed, a
   burn, a field stay). The same in either side's hands. */
const SHAKE_ORDER = ['iceTomb', 'asleep', 'stunned', 'paralysed', 'discombobulate', 'blinded', 'taunted', 'forgot', 'softened'];   // (3.38) a taunt
const SHAKE_WORDS = { iceTomb:'the ice', asleep:'its sleep', stunned:'the stun', paralysed:'the stun', discombobulate:'its confusion',
                      blinded:'the blinding light', taunted:'the taunt', forgot:'its forgetting', softened:'its weakness' };
function shakeOffMarks(){
  if(!ui.battle) return 0;
  const lines = [];
  ['player', 'enemy'].forEach(side=>{
    const yours = side === 'player';
    sideField(side).forEach(m=>{
      const p = passiveOf(m);
      if(!p || !p.shakeOff || hpOfMon(m) <= 0) return;
      for(let k = 0; k < p.shakeOff; k++){
        const type = SHAKE_ORDER.find(t=>{
          const st = yours ? getMStatus(m, t) : getEStatus(m, t);
          return st && statusOwner(t, st, side) !== side;
        });
        if(!type) break;
        if(yours) removeMStatus(m, type); else removeEStatus(m, type);
        const def = passiveDefOf(m);
        lines.push(`🦥 ${yours ? '' : 'Their '}${escapeHtml(monName(m))}'s ${escapeHtml((def && def.name) || 'passive')} — it shakes off ` +
          `${SHAKE_WORDS[type] || 'a mark'}.`);
      }
    });
  });
  if(lines.length){ renderStatusBadges(); battleMsg(lines.join(' ')); }
  return lines.length;
}
/* Sylph's Grace, at the start of the turn: each of the other side may fall
   asleep for its turn. */
function sylphDrowse(){
  if(!ui.battle) return;
  const lines = [];
  ['player', 'enemy'].forEach(side=>{
    const ch = sideAura(side, 'drowse');
    if(!ch) return;
    const holder = sideField(side).find(m=>{ const p = passiveOf(m); return p && p.drowse; });
    sideField(side === 'player' ? 'enemy' : 'player').forEach(t=>{
      if(Math.random() >= ch) return;
      const said = putToSleep(t, `${side === 'player' ? 'Your' : 'Their'} Sylph's Grace`);
      if(said) lines.push(said);
    });
  });
  if(lines.length){ renderStatusBadges(); battleMsg(lines.join(' ')); }
  return lines.length;
}
/* Shell Spin and Claw Barrage (the Steelcrab): shield value, a full 1 a shield
   at once, worth its ATK. Returns how many it raised. */
function gainShieldValue(m, amount){
  if(!m || !(amount > 0) || !ui.battle) return 0;
  const s = bState(m);
  s.shieldMeter = (s.shieldMeter || 0) + amount;
  const n = Math.floor(s.shieldMeter + 1e-9);
  if(n > 0){
    s.shieldMeter = Math.max(0, s.shieldMeter - n);
    grantBlock(m, n, atkOfMon(m));
    setTimeout(()=> battleMsg(`🦀 ${escapeHtml(monName(m))}'s shell hardens — <b>+${n}</b> shield${n > 1 ? 's' : ''} (${m.blockStacks} now).`), 700);
  }
  return n;
}
/* Who a support move of `side` tends: yours, the other one on the field (or
   the caster alone); theirs, the one of its side in the worst shape. */
function partnerOf(side, caster){
  const others = sideField(side).filter(m=> m !== caster);
  if(!others.length) return caster;
  if(side === 'player') return others[0];
  return others.sort((a, c)=> hpOfMon(a) / maxHpOfMon(a) - hpOfMon(c) / maxHpOfMon(c))[0];
}
/* A side buff by move (Kindle, Gallop): `turns` of it on the caster's side. */
function castSideBuff(side, caster, type, fields, turns, name){
  const st = Object.assign({ type, turnsLeft:(turns || 3) + 1, owner: side === 'player' ? caster.uid : caster }, fields);
  const ok = side === 'player' ? setPStatus(0, st) : setESide(st);
  renderStatusBadges();
  return ok;
}
/* (3.37) The Firefox's Stargazer — the designer: "For 3 turns, your side
   gains 100% hit chance against evasion": for `turns` turns nothing the
   caster's side throws can be dodged (seesThrough reads it), as a Plasma
   Manta's Lock-On does while it stands. Either side; their dust scatters
   it, yours holds it open. Returns the line to say. */
function castStargazer(side, caster, def, name){
  const yours = side === 'player', turns = (def && def.turns) || 3;
  const ok = castSideBuff(side, caster, 'stargaze', {}, turns, name);
  const who = yours ? '' : `${escapeHtml(monName(caster))} uses `;
  return ok
    ? `🔭 ${who}<b>${escapeHtml(name)}</b> — for ${turns} turns nothing ${yours ? 'your' : 'their'} side throws can be dodged.`
    : `🔭 ${who}${escapeHtml(name)} — but ${yours ? 'their' : 'your'} diamond dust clouds the stars.`;
}
/* (3.36) The Firefox's Enchant and Grand Enchantment — the designer: "change
   firefox to be a supporting companion with strong attack buffs such as
   enchant". For `turns` turns every attack of the caster's side deals
   `deal`× — and, with `init`, the side moves that many steps sooner. One
   spell at a time: cast again, its turns start again, and one already up
   that is stronger (a Grand Enchantment under an Enchant) stays as strong.
   The same in either side's hands. Returns the line to say. */
function castEnchant(side, caster, def, name){
  const yours = side === 'player';
  const cur = yours ? getPStatus(0, 'enchant') : getESide('enchant');
  const deal = Math.max(def.deal || 1.3, (cur && cur.deal) || 0);
  const init = Math.max(def.init || 0, (cur && cur.init) || 0);
  const turns = def.turns || 3;
  const ok = castSideBuff(side, caster, 'enchant', init ? { deal, init } : { deal }, turns, name);
  const who = yours ? '' : `${escapeHtml(monName(caster))} uses `;
  return ok
    ? `🪄 ${who}<b>${escapeHtml(name)}</b> — for ${turns} turns ${yours ? 'your' : 'their'} side deals <b>${deal}×</b>` +
      (init ? ' and moves a step sooner.' : '.')
    : `🪄 ${who}${escapeHtml(name)} — but ${yours ? 'their' : 'your'} diamond dust scatters the spell.`;
}
/* Woolly Warmth (the Ram): every one of its side on the field, by a share
   of the Ram's own health. */
function castMend(side, caster, def, name){
  const heal = Math.ceil((def.pct || 0.15) * maxHpOfMon(caster));
  let n = 0;
  sideField(side).forEach(m=>{
    const before = hpOfMon(m), max = maxHpOfMon(m);
    if(before >= max) return;
    if(m.uid){ m.currentHp = Math.min(max, m.currentHp + heal); drainHp(pid('playerHp', m), before, m.currentHp, max); }
    else { m.hp = Math.min(max, m.hp + heal); drainHp('enemyHp-' + ui.battle.enemies.indexOf(m), before, m.hp, max); }
    n++;
  });
  const yours = side === 'player';
  /* (3.26) "fold thick fleece passive effect into Power 1's heal": the side
     it heals is wrapped in fleece — `reduce` less from every blow for `turns`
     turns (a side buff, the dust's like any other). */
  let wrap = '';
  if(def.fleece){
    const ok = castSideBuff(side, caster, 'fleece', { reduce:def.fleece.reduce || 0.15 }, def.fleece.turns || 3, name);
    wrap = ok ? ` A thick fleece wraps ${yours ? 'your' : 'their'} side: <b>${Math.round((def.fleece.reduce || 0.15) * 100)}% less</b> from every blow for ${def.fleece.turns || 3} turns.`
              : ` ${yours ? 'Their' : 'Your'} diamond dust keeps the fleece off.`;
  }
  return `🐑 ${yours ? '' : escapeHtml(monName(caster)) + ' uses '}<b>${escapeHtml(name)}</b> — ` +
    (n ? `<b>${heal} HP</b> to ${n === 1 ? (yours ? 'the one of yours that needed it' : 'the one of theirs that needed it') : `every one of ${yours ? 'yours' : 'theirs'} on the field`}.`
       : `${yours ? 'your' : 'their'} side is already at full health.`) + wrap;
}
/* Transfusion (the Nurse): its own health to its partner, point for point —
   as much as the partner is missing, up to `pct` of the Nurse's health, and
   never its last point. Returns { line, given }. */
function castTransfuse(side, caster, def, name){
  const t = partnerOf(side, caster);
  const yours = side === 'player';
  if(!t || t === caster) return { line:`💉 ${yours ? '' : escapeHtml(monName(caster)) + ' tries '}<b>${escapeHtml(name)}</b> — but there is nobody beside it to give to.`, given:0 };
  const missing = maxHpOfMon(t) - hpOfMon(t);
  const amount = Math.max(0, Math.min(Math.ceil((def.pct || 0.3) * maxHpOfMon(caster)), hpOfMon(caster) - 1, missing));
  if(amount <= 0) return { line:`💉 ${yours ? '' : escapeHtml(monName(caster)) + ' tries '}<b>${escapeHtml(name)}</b> — ${escapeHtml(monName(t))} needs nothing.`, given:0 };
  const cb = hpOfMon(caster), tb = hpOfMon(t);
  if(caster.uid) caster.currentHp -= amount; else caster.hp -= amount;
  if(t.uid) t.currentHp += amount; else t.hp += amount;
  if(caster.uid) drainHp(pid('playerHp', caster), cb, caster.currentHp, monMaxHp(caster));
  else drainHp('enemyHp-' + ui.battle.enemies.indexOf(caster), cb, caster.hp, caster.maxHp);
  if(t.uid) drainHp(pid('playerHp', t), tb, t.currentHp, monMaxHp(t));
  else drainHp('enemyHp-' + ui.battle.enemies.indexOf(t), tb, t.hp, t.maxHp);
  return { line:`💉 ${yours ? '' : escapeHtml(monName(caster)) + ' uses '}<b>${escapeHtml(name)}</b> — <b>${amount}</b> of its own health to ${escapeHtml(monName(t))}.`, given:amount };
}
/* ---------- GLITCH (the Polygon) ----------
   "companion support with random wild effects": one of six, at random —
   Data Spike (a blow of 0.8× at the target), Patch (its side on the field
   healed by 15% of its health), Firewall (a shield on its partner, worth its
   ATK), Lag (the target's next attack weakened by half), Sleep Mode (the
   target asleep for its next turn) or Overclock (its side deals 1.2× for 2
   turns). Random Access adds one of the last five on top of its blow. */
const GLITCHES = ['spike', 'patch', 'firewall', 'lag', 'sleep', 'overclock'];
const GLITCH_SPIKE = 0.8;
function glitchPick(noBlow){
  const pool = noBlow ? GLITCHES.filter(g=> g !== 'spike') : GLITCHES;
  return pool[Math.floor(Math.random() * pool.length)];
}
/* Everything but the blow, which goes through the ordinary attack. */
function applyGlitch(side, caster, target, kind){
  const yours = side === 'player';
  const tag = `🔷 ${yours ? '' : escapeHtml(monName(caster)) + "'s "}Glitch: `;
  const tName = target ? escapeHtml(monName(target)) : '';
  switch(kind){
    case 'patch':
      return tag + `<b>Patch</b>! ` + castMend(side, caster, { pct:0.15 }, 'Patch');
    case 'firewall':
      return tag + `<b>Firewall</b>! ` + castBarrier(side, caster, { shields:1, on:'partner', worth:1, icon:'🧱' }, 'Firewall');
    case 'lag': {
      if(!target) return '';
      let ok;
      if(target.uid) ok = setMStatus(target, { type:'softened', turnsLeft:2, amount:0.5, by:'enemy' });
      else { addEStatus(target, { type:'softened', turnsLeft:2, amount:0.5 }); ok = getEStatus(target, 'softened'); }
      return tag + `<b>Lag</b>! ` + (ok ? `${tName}'s next attack is weakened by half.` : `the diamond dust keeps ${tName} steady.`);
    }
    case 'sleep': {
      if(!target) return '';
      const z = putToSleep(target, 'Sleep Mode');
      return tag + `<b>Sleep Mode</b>! ` + (z || `${tName} is already asleep.`);
    }
    case 'overclock': {
      const ok = castSideBuff(side, caster, 'kindle', { deal:1.2 }, 2, 'Overclock');
      return tag + `<b>Overclock</b>! ` + (ok ? `for 2 turns ${yours ? 'your' : 'their'} side deals <b>1.2×</b>.` : `the diamond dust smothers it.`);
    }
  }
  return '';
}
/* ---------- COPYCAT (the Mime) ----------
   Every monster's attacks are written down as it makes them — its last
   turn's, kept until its next (noteTurnMove). The Mime copies one monster's:
   each attack at `copy`× its power, with the Mime's own ATK, its shape and
   its riders kept — what it hit, how many times, a stun or a sleep, no
   dodging. Stones, heals and other moves with no damage figure are not
   copied; with nothing to copy, it copies that monster's Basic. */
const COPY_KEEP = ['hits', 'split', 'splash', 'softenHit', 'stunHit', 'sleepHit', 'mindRead', 'pierce', 'lunacy', 'sleeperMult', 'paralyse', 'blindHit', 'confuseHit'];   // (3.25) a blinding too; (3.26) a muddle
function copyExtras(ex, hits){
  const out = {};
  COPY_KEEP.forEach(k=>{ if(ex && ex[k] != null) out[k] = ex[k]; });
  if(hits > 1) out.hits = hits; else delete out.hits;
  return out;
}
function noteTurnMove(m, rec){
  if(!m || !rec || !ui.battle) return;
  const s = bState(m), r = roundNo();
  if(s.turnRound !== r){ s.turnRound = r; s.turnMoves = []; }
  s.turnMoves.push(rec);
}
function lastTurnMoves(m){ return m ? ((bState(m).turnMoves || []).slice()) : []; }
/* What the Mime copies off `t`: its last turn's attacks, else its Basic. */
function copyPlan(t){
  const got = lastTurnMoves(t).filter(r=> r && r.mult != null && r.mult > 0);
  if(got.length) return { moves:got, basic:false };
  const row = (MOVES[t.species] || []).find(r=> r[0] === 'Basic' && r[2] != null);
  if(!row) return { moves:[], basic:true };
  const ex = row[6] || {};
  return { moves:[{ name:row[1], mult:row[2], target:row[3], ex:copyExtras(ex, moveHitsFor(t, ex)) }], basic:true };
}
/* A Bog Lurker's bog slows only while one of those holding it has its
   passive working: a ✦ Curse on their side quiets it, and it comes back as
   the curse lifts (2.97). Theirs are held by the monsters, yours by uid. */
function bogWorks(st, holderSide){
  if(!st) return false;
  const by = st.by || [];
  if(!by.length) return true;
  return by.some(h=>{
    const m = holderSide === 'enemy' ? h : battleMonByUid(h);
    return !m || !passivesMuted(m);
  });
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
  /* (3.19) A wave that arrives with a show of its own — Cyborg splitting in
     three, in the vault — plays it before the wave's first turn. */
  if(b.introDue){
    const f = b.introDue;
    b.introDue = null;
    b.phase = 'resolving';
    renderBattle();
    return f(()=>{ if(ui.battle === b) beginRound(msg); });
  }
  /* A new round (2.97): Focus, Precognition and Amnesia count by it. What
     they forgot until last round, they remember. */
  b.roundNo = (b.roundNo || 0) + 1;
  /* …and (3.25) a blinding of theirs that has had its turns sees again */
  (b.enemies || []).forEach(e=> ['forgot', 'blinded', 'taunted'].forEach(k=>{ const f = getEStatus(e, k); if(f && f.until != null && f.until < b.roundNo) removeEStatus(e, k); }));   // (3.38) a taunt too
  advanceMirageWindows();
  b.roundMsg = msg || null;
  b._ariaPierced = null;                         // (3.09) a note no blow said is not carried over
  b._shieldBroke = null;                         // (3.13) which attacks broke whose shields: last round's are done
  b.phase = 'resolving';
  renderBattle();

  setFocus(null);
  /* (3.16) The start of the turn: ✦ Ice Tomb's chill may freeze them again,
     then each side's Ice Barrier melts one of the other side's marks off it.
     (Who is confused was settled in the end phase — discombobulateEndPhase.
     Frost Armour is gone.) Said with a pause, so it is seen. */
  const iced = [chillRefreeze(), iceBarrierPulse(), siphonRoundStart()].filter(Boolean).join(' ');   // (3.43) and the tower's siphons
  if(iced) battleMsg(iced);
  /* The pre-action phase: Overheat's burn and the other pre-hits, then the
     Haunting Aria's roll — here, not at the end of the round, so it still
     comes when the last round ended with a wave knocked out — Vita's light,
     and last the quick attacks (2.73). */
  const preAction = ()=> runPreHits(()=> ariaRetaliate(()=> vitaPulse(()=> runQuickAttacks(()=>{
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
      if(!ui.battle || battleDone()) return;
      /* (3.19) The start of the turn, before anyone chooses: your Forest
         Fairy's Overgrowth (the Forest Guardian's gift), then — beside you in
         the vault — the Monkey King's casts, his pre-turn. */
      overgrowthPhase('start', ()=> allyPreTurn(()=>{
        if(!ui.battle) return;
        if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
        const fp = foePair();
        if(fp && !fp.summons && foeCanSummon(fp.leader)){
          const said = foeSummon();
          renderBattle();
          if(said) battleMsg(said);
          return setTimeout(order, 1300);
        }
        order();
      }));
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
  /* (3.15) a Sylph's Grace: who nods off — after the ice has had its say */
  const drowse = ()=>{
    if(!ui.battle) return;
    const nodded = sylphDrowse();
    if(nodded) setTimeout(()=>{ if(ui.battle) preAction(); }, 1100); else preAction();
  };
  if(iced) setTimeout(drowse, 1100); else drowse();
}
/* (3.19) A fight that ends on its own terms, not with a wave knocked out —
   the vault's last phase: Cyborg, broken, cleared down to 1 HP. When
   `doneWhen` says so, `onDone` takes over (once), and nothing else moves. */
function battleDone(){
  const b = ui.battle;
  if(!b || !b.doneWhen) return false;
  if(b.doneFired) return true;
  if(!b.doneWhen()) return false;
  b.doneFired = true;
  b.phase = 'resolving';
  renderBattle();
  setTimeout(()=>{ if(ui.battle === b && b.onDone) b.onDone(); }, 600);
  return true;
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
  if(p && p.slow) v -= p.slow;                               // (3.15) Carapace a step later; (3.37) the Hermit Sloth three
  if(p && p.speed) v += p.speed;                             // (3.37) the Firefox's Blazing Speed: three steps sooner
  v += sideAura(side, 'slipstream');                         // (3.15) a Plasma Manta on its side: all a step sooner
  v -= sideAura(side === 'player' ? 'enemy' : 'player', 'undertow');   // (3.27) a Seadragon on the other side: all a step later
  const gal = side === 'player' ? getPStatus(0,'gallop') : getESide('gallop');
  if(gal) v += (gal.init || 1);                              // (3.15) a Unicorn's Gallop
  const ench = side === 'player' ? getPStatus(0,'enchant') : getESide('enchant');
  if(ench && ench.init) v += ench.init;                      // (3.36) a Firefox's Grand Enchantment
  /* "In an enemy's hands this always strikes first." The per-monster order
     had quietly dropped it: Swift Strike and its cousins stopped leading. */
  if(side === 'enemy'){
    const pm = plannedMove(mon);
    if(pm && pm[6] && pm[6].first) v += 1;
  }
  /* (3.16) Mirage moves the whole side sooner now ("Mirage should also add
     +1/2/3 initiative value to the team" — it was its caster alone), and so
     does Overcharge ("Overcharge to also add +1/2/3 to initiative value"). */
  const mir = side === 'player' ? getPStatus(0,'mirage') : getESide('mirage');
  if(mir && mir.init) v += mir.init;
  const oc = side === 'player' ? getPStatus(0,'overcharge') : getESide('overcharge');
  if(oc && oc.init) v += oc.init;
  if(side === 'enemy'){
    if(b && (b.alwaysFirst || b.figlio)) v += 1;
    if(mon.arenaFirst) v += 1;
    if(getEStatus(mon,'disrupt')) v -= 1;                    // your jamming slows it
    const ch = b && b.fieldStatus && b.fieldStatus.chill;
    if(ch && ch.slow) v -= ch.slow;                          // (3.16) your Ice Tomb's chill slows them
    if(b && b.fieldStatus && bogWorks(b.fieldStatus.bogged, 'player')) v -= 1;   // your Bog Lurker's bog (quiet under their ✦ Curse, 2.97)
  } else {
    if(getPStatus(0,'disrupt')) v -= 1;                      // their jamming slows you
    const chE = getPStatus(0,'chill');
    if(chE && chE.slow && isEnemyOwned('chill', chE)) v -= chE.slow;   // (3.16) their Ice Tomb's chill slows you
    if(bogWorks(getPStatus(0,'bogged'), 'enemy')) v -= 1;    // their Bog Lurker's bog (quiet under your ✦ Curse, 2.97)
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
  b.orderRound = b.roundNo;                      // (3.37) the order this round's (notYetMoved)
  const rows = [];
  livingField().forEach(m=> rows.push(playerRow(m)));
  livingEnemies().filter(e=> !e.rewinder && !e.broken).forEach(e=>{   // Cyborg never takes a turn in the tear (2.94), nor broken (3.19)
    rows.push({ side:'enemy', mon:e, idx:ui.battle.enemies.indexOf(e),
                tier:machTier('enemy'), value:initiativeOf('enemy', e) });
  });
  rows.sort(orderCompare);
  return insertAllyRow(rows);                    // (3.19) an ally's turn: straight after your leader's
}
/* The leader's own row this round (a companion's may come first). */
function leaderRow(){
  const b = ui.battle;
  return ((b && b.order) || []).find(r=> r.side === 'player' && r.role !== 'companion') || null;
}

function runTurnStep(){
  const b = ui.battle;
  if(!b || !b.order) return;
  if(battleDone()) return;                       // (3.19) a fight that ends on its own terms (the vault's last phase)
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
    const alive = row.side === 'ally' ? !!battleAlly()                 // (3.19) he is never struck down
      : row.side === 'player'
      ? (row.mon && row.mon.currentHp > 0 && playerField().includes(row.mon))
      : (row.mon && row.mon.hp > 0 && b.enemies.includes(row.mon));   // (theirs: not gone back into a core)
    if(!alive || row.acted){ b.orderStep++; continue; }
    row.acted = true;
    if(row.side === 'ally') return allyTurn(row);
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
  barrierLapse('player', mon);              // (3.14) its Ice Barrier ends as it acts again
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

/* ============================================================
   THE TOWER'S SIPHONS (3.43)
   The designer: "let's give incredible buffs to the psychic towers trainers
   that make them very hard to defeat normally. A player can challenge by
   choice but the whalelord says that the whole tower doesn't actually just
   suppress, but leeches energy from the grudges amassed in the catacombs."
   Three, on every fight in the story's tower while the soldatos' charms
   still feed it (`b.siphon`: the ones still up, from r5SiphonsUp — set by
   r5TowerChallenge alone, so the Test Arena's copies have none):
     1  the curse: every round your side is cursed as by a Curse ✦ (30% more
        damage taken, your passives off), and their monsters dodge 66% and
        take 66% less. No dust blocks or sweeps any of it; what cannot be
        dodged (a mind-read, a Third Eye, a Stargazer, a Lock-On) still hits,
        and like every damage cut the 66% is on hits — a burn gets past it.
     2  the theft: at the end of every round everything your side has up
        crosses to theirs — whatever Greed could take (stealableBuffs), all
        of it, the dust first so the rest can follow it over.
     3  the drain: at the end of every round each of yours on the field loses
        a third of its max HP — "please make Siphon 3 grant the drained HP to
        enemy monsters as well": their monsters drink it, the most hurt first
        — and your team starts the fight confused (Discombobulate ✦'s
        self-hit; an Iron Will too: the curse, laid first, has it off).
   They break 3, then 2, then 1, at 6, 12 and 18 charms (15-region5.js).
   ============================================================ */
const SIPHON = { curse:0.30, dodge:0.66, cut:0.66, drain:1 / 3, confuse:[1.1, 1.4] };
const SIPHON_NAMES = { 1:'Siphon I · Curse', 2:'Siphon II · Theft', 3:'Siphon III · Drain' };
function siphonUp(n){ const s = ui.battle && ui.battle.siphon; return !!(s && s.includes(n)); }
/* The start of every round: the curse laid again. The first round, your
   team confused as well — said once, with what the tower is doing. */
function siphonRoundStart(){
  const b = ui.battle;
  if(!b || !b.siphon) return '';
  if(siphonUp(1)){
    const had = partyStatuses().curse;
    /* a Curse ✦ of theirs already on you keeps its own turns (it is just as
       strong); anything less gives way to the tower's */
    const asStrong = had && !had.siphon && isEnemyOwned('curse', had) && (had.extra || 0) >= SIPHON.curse && had.mute;
    if(had && had.siphon) had.turnsLeft = 2;
    else if(!asStrong) partyStatuses().curse = { type:'curse', turnsLeft:2, extra:SIPHON.curse, mute:true, by:'enemy', unsweepable:true, siphon:true };
  }
  if(b.roundNo !== 1) return '';
  const muddled = [];
  if(siphonUp(3)) livingField().forEach(pm=> withFocus(pm, ()=>{
    markPlayerConfused(null, true, rollSelf(SIPHON.confuse), true);   // its first swing, this round or the next
    if(getMStatus(pm, 'discombobulate')) muddled.push(displayName(pm));
  }));
  renderStatusBadges();
  const bits = [];
  if(siphonUp(1)) bits.push('your team is cursed');
  if(muddled.length) bits.push(`${muddled.join(' and ')} ${muddled.length > 1 ? 'are' : 'is'} confused`);
  return `🗼 The tower drinks from the grudges in the catacombs` + (bits.length ? ` — ${bits.join(', and ')}!` : '!');
}
/* Siphon 2, at the end of the round: everything yours crosses to theirs. */
function siphonTheft(){
  const b = ui.battle;
  if(!b || !siphonUp(2)) return '';
  const thief = livingEnemies()[0];
  if(!thief) return '';
  const pool = stealableBuffs('player', livingField());
  if(!pool.length) return '';
  pool.sort((a, c)=> (c.key === 'diamondDust') - (a.key === 'diamondDust'));   // your dust first: its going opens the way for the rest
  const took = [];
  pool.forEach(it=>{
    const give = it.take();
    if((dustBlocks('enemy') && !it.shield) ? false : give('enemy', thief)) took.push(it.label);
  });
  renderStatusBadges(); paintConcealment(); setTimeout(refreshAllBlockBars, 0);
  return took.length ? `🗼 <b>${SIPHON_NAMES[2]}</b> — everything your side had up crosses to theirs: ${took.join(', ')}.` : '';
}
/* Siphon 3, at the end of the round: a third of each one's max HP, drunk by
   their monsters. Returns { taken, line }. */
function siphonDrain(){
  const b = ui.battle;
  if(!b || !siphonUp(3)) return null;
  const mine = livingField();
  if(!mine.length) return null;
  let pool = 0;
  mine.forEach(me=>{
    const max = monMaxHp(me), before = me.currentHp;
    me.currentHp = Math.max(0, before - Math.ceil(max * SIPHON.drain));
    pool += before - me.currentHp;
    flashHit(document.getElementById(pid('playerBob', me)));
    drainHp(pid('playerHp', me), before, me.currentHp, max);
    showDamageNumber(pid('playerBob', me), before - me.currentHp);
  });
  let left = pool, drank = 0;
  livingEnemies().slice().sort((x, y)=> (x.hp / x.maxHp) - (y.hp / y.maxHp)).forEach(e=>{
    const room = e.maxHp - e.hp;
    if(left <= 0 || room <= 0) return;
    const add = Math.min(room, left), before = e.hp, idx = b.enemies.indexOf(e);
    e.hp += add; left -= add; drank += add;
    drainHp('enemyHp-' + idx, before, e.hp, e.maxHp);
    showDamageNumber('enemy-' + idx, add, { heal:true });
  });
  renderStatusBadges();
  return { taken:pool, drank,
    line:`🗼 <b>${SIPHON_NAMES[3]}</b> — the tower drains <b>${pool} HP</b> from your team` +
      (drank >= pool && pool > 0 ? `, and their monsters drink it.` : drank ? `, and their monsters drink <b>${drank}</b> of it.` : '.') };
}
/* The end of the round, before it settles: the theft, then the drain. */
function siphonEndPhase(next){
  const b = ui.battle;
  if(!b || !b.siphon || !livingEnemies().length) return next();
  const stole = siphonTheft();
  if(stole) battleMsg(stole);
  setTimeout(()=>{
    if(!ui.battle) return;
    const dr = siphonDrain();
    if(dr) battleMsg(dr.line);
    setTimeout(next, dr ? 1000 : 0);
  }, stole ? 1200 : 0);
}
/* Their side's row: one pill a siphon still up. */
function siphonPills(){
  const b = ui.battle;
  if(!b || !b.siphon) return '';
  return b.siphon.slice().sort().map(n=> `<span class="status-pill foe"${pillAt('siphon' + n, 'fs')}>🗼 ${SIPHON_NAMES[n]}</span>`).join('');
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
    meditateTurn(pm);                                 // (3.26) a turn ended untouched, or not
    if(pm.guard) grantBlock(pm, 1, monAtk(pm));
    organosteelTurn(pm, monAtk(pm));                  // (3.13) a shield a turn, as Cyborg's
    if(pm.airborne  > 0) pm.airborne--;
    if(pm.invisible > 0) pm.invisible--;
    // Counter stacks never expire — nothing to tick
    if(pm.evadeTurns   > 0 && !certainDodge(pm)) pm.evadeTurns--;   // a Stillness waits (advanceMirageWindows)
  });
  livingEnemies().forEach(e=>{
    tickRage(e); tickOverpower(e);
    meditateTurn(e);                                  // (3.26)
    if(e.guard) grantBlock(e, 1, e.atk);
    organosteelTurn(e, e.atk);                        // (3.13) Cyborg's Organosteel Body
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
    if(holder){
      const n = addCounterStack(holder, ctrE.tier || 0, 1);      // their side's (3.01)
      battleMsg(`🛡 They read you again — <b>${n}</b> Counter stack${n > 1 ? 's' : ''} on their side.`);
    }
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

  sylphCleanse();                                // (3.15) a Sylph lifts one of the other side's marks
  shakeOffMarks();                               // (3.37) a Hermit Sloth shakes one off itself
  endDragonLegacy();                             // a Legacy spent this turn is over
  tickCompanionTurns();                          // a companion out spends one of its turns
  tickFoePairTurns();                            // and theirs (2.87)

  /* (The Haunting Aria no longer rolls here: it rolls in the next round's
     pre-action phase, in beginRound.) */
  resolveAfterimages(()=> resolveEnemyAfterimages(()=> resolveRetribution(()=>{   // (3.15) a Unicorn's bank falls
    if(!ui.battle) return;
    /* The Aria's untouchable turn is spent — if it was used (2.74). (3.08)
       After the end phase's afterimages, which meet it now and belong to this
       round. */
    const ar = getPStatus(0,'aria');
    if(ar && ar.fieldEvade > 0 && ar.coverUsed) ar.fieldEvade--;
    if(ar) ar.coverUsed = false;
    if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);
    /* (3.19) the end of the turn: your Forest Fairy's Overgrowth, if it has
       not come round this turn yet (she came out after the start) */
    const onward = ()=> overgrowthPhase('end', ()=>{
      if(!ui.battle) return;
      const gone = tickStatuses();
      /* (3.16) Discombobulate's roll, now in the end phase: what it catches
         shows now and lasts through the next turn. */
      const dizzy = discombobulateEndPhase();
      renderStatusBadges();
      if(dizzy) battleMsg(dizzy);
      setTimeout(()=>{
        if(!ui.battle) return;
        beginRound(gone.length ? `${gone.join(' and ')} wore off.` : 'Choose a move.');
      }, dizzy ? 1300 : gone.length ? 900 : 500);
    });
    /* their afterimages (3.43: or the tower's drain) can fell the last of
       your team: the phoenix may rise */
    siphonEndPhase(()=>{                          // (3.43) the tower's siphons: your buffs cross over, then the drain
      if(!ui.battle) return;
      if(sideDefeated()){
        const f = [companionOnField(), leaderMon()].find(m=> m && m.currentHp <= 0 && rebirthDue(m));
        if(f) return offerRebirth(onward, ()=> onPlayerDefeated(), f);
        return onPlayerDefeated();
      }
      onward();
    });
  })));
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
  /* Their Ice Tomb (3.16): frozen for its next turns — this is one of them. */
  const ice = getPStatus(0,'iceTomb');
  if(ice){
    ice.turnsLeft = (ice.turnsLeft || 1) - 1;
    const left = ice.turnsLeft;
    if(left <= 0) removePStatus(0,'iceTomb');
    return say(`🧊 ${displayName(me)} is frozen solid!` + (left > 0 ? ` (${left} more turn${left > 1 ? 's' : ''})` : ' The ice is cracking…'));
  }
  // a jammed monster may seize up before acting — never two turns running
  const jam = getPStatus(0,'disrupt');
  if(jam && !me._seizedLast && Math.random() < (jam.stun || 0.15)){
    me._seizedLast = true;
    return say(`📡 ${displayName(me)} seizes up — your signals are scrambled!`);
  }
  me._seizedLast = false;
  /* A nap costs this turn — and (3.16) it sleeps on to the end of the turn,
     where tickStatuses wakes it (`spent`), so their psychics can still feed
     on it meanwhile. */
  const nap0 = getPStatus(0,'asleep');
  if(nap0){
    nap0.spent = true;
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
  /* 2.99: none of theirs above 100 (ENEMY_LEVEL_CAP) — but Cyborg, the time
     monster (noLevelCap, 200), and the Monkey King in a spar, five above the
     monster he trains (opts.anyLevel; a wave spec's anyLevel too). */
  if(!opts.anyLevel && !sp.noLevelCap) level = Math.min(level, ENEMY_LEVEL_CAP);
  if(opts.catchable && !sp.bossOnly) level = Math.min(level, CATCH_LEVEL_CAP);   // (3.14) catchable: 98 at most
  const nerfed = (opts.nerfed!==undefined) ? opts.nerfed : (sp.tier==='wild');
  const crowned = !!opts.crowned;
  /* Growth (2.97: as yours grows — computeMaxStat): a crowned starter or
     elite of theirs grows at legendary rate, 13, as yours does once crowned.
     It used to keep its own 10 or 11, so every crowned ace of theirs was
     about a fifth weaker than the same monster of yours. */
  const rate = (crowned && sp.tier !== 'legendary') ? 13 : (nerfed ? sp.nerfedRate : sp.rate);
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
  /* Its supplements count as yours do (2.97): at the protein cap — which a
     crown raises — the last one counts triple (effectiveSupplements). */
  const sup = opts.supplements ? effectiveSupplements(species, opts.supplements, { species, crowned }) : 0;
  /* The stat, as computeMaxStat makes yours from the same growth: its level,
     its form (and any evolution baked in), a crowned legendary's three extra
     stages, its supplements. */
  const statAt = r=>{
    let st = Math.ceil((r/5)*level) + Math.ceil((stage + (sp.bonusStages||0))*r*(sp.evoMult||1));
    if(crowned && sp.tier==='legendary') st += CROWN_LEGENDARY_STAGES*r;   // crowned legendary
    if(sup) st += Math.ceil((r/5)*sup);
    return st;
  };
  /* Pacificus (2.97 in their hands too — a wild Caladrius went without it):
     a share of its attack given up for health (pacificusOf: 0.75 since 3.14),
     so its health grows at 1.75× its rate and its attack at a quarter. Its
     Vita and Conversio are measured by that health, so it heals and strikes
     for more. */
  const pcE = pacificusOf(species);
  const stat = pcE ? statAt(rate * (1 - pcE)) : statAt(rate);
  const hpStat = pcE ? statAt(rate * (1 + pcE)) : stat;
  const hp = Math.ceil(hpStat * hpScale(level));
  // AI: 'basic' | 'power1' | 'best'. Default: wild=basic, but electric/legendary open with Power1.
  let ai = opts.ai || ((species==='electric_starter' || sp.tier==='legendary') ? 'power1' : 'basic');
  // An evolved wild picks from its whole moveset each turn
  if(opts.wildRoll && stage > 0 && !opts.ai) ai = 'random';
  const avail = MOVES[species].filter(m=>m[1]!=null && level>=m[5] && m[2]!=null); // damaging + unlocked
  const bySlot = s=> avail.find(m=>m[0]===s);
  let move;
  if(ai==='random') move = avail[Math.floor(Math.random()*avail.length)] || bySlot('Basic');
  else if(ai==='best' || ai==='smart') move = bySlot('Max') || bySlot('Ultimate') || bySlot('Power2') || bySlot('Power1') || bySlot('Basic');   // (3.16: 'smart' weighs its moves each turn — smartMove)
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
function guardianTrialBattle(){
  return {
    waves:[[{ species:'forest_fairy', level:100, ai:'power1', nerfed:false, supplements:12, crowned:true, boss:true }]],
                       // ai:'power1' == Giga Drain, her signature. 'best' would have
                       // reached past it for the Ultimate and skipped the self-heal.
    isNpc:false, allowCatch:false, name:'The Forest Guardian',
    noFlee:false,            // Courage means running is POSSIBLE and refused.
                             // Fleeing costs no progress, but she recovers fully.
    guardianTrial:true,
  };
}
function startGuardianTrial(){
  beginBattle(guardianTrialBattle());   // (3.11: the setup is shared with the Test Arena)
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
  /* the side's own stacks, not any one monster's — theirs too (3.01) */
  if(ui.battle){ ui.battle.pCounter = []; ui.battle.pCombo = 0; ui.battle.eCounter = []; ui.battle.eCombo = 0; }
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
    onLose: config.onLose || null,    // (3.12) what a lost fight settles once the team has come round — Jax's wager (onPlayerDefeated)
    guardianTrial: !!config.guardianTrial, leechSeed:false, bgKey: config.bgKey||null,
    alwaysFirst: !!config.alwaysFirst,
    scriptedOneTurn: !!config.scriptedOneTurn,
    /* From Emerald March onward a trainer fight is a commitment: no fleeing.
       Region 1 keeps its gentler rules so the early game stays forgiving. */
    noFlee: !config.coreSpar && !config.tear && (!!config.noFlee || (!!config.isNpc && (state.progress.currentRegion||1) >= 2)),   // a spar can be given up, and the tear left (2.94)
    tear: !!config.tear,              // the space-time tear's weekly challenge (2.94, 16-tear.js)
    concertFight: !!config.concertFight,
    figlio: !!config.figlio,          // he leads every round
    catacomb: !!config.catacomb,      // their ghosts arrive lurking
    encounter: !!config.encounter,    // (3.34) met on foot: the walking meetings' one track (walkEncounter)
    siphon: (Array.isArray(config.siphon) && config.siphon.length) ? config.siphon.slice() : null,   // (3.43) the tower's siphons still up
    scriptedLoss: config.scriptedLoss||null,
    coreSpar: config.coreSpar || null,   // a training spar with the Monkey King (2.86): { uid, tier, hp }
    arenaChallenge: config.arenaChallenge || null,   // (3.11) a story fight in the Test Arena: nothing after it counts (08-screens2.js)
    scriptedAlly: config.scriptedAlly||null, allyMove: config.allyMove||null,
    allyUnkillable: !!config.allyUnkillable, enemiesFirst: !!config.enemiesFirst,
    /* (3.19) the vault: the Monkey King at your side (an AI ally, never one
       of yours on the field — "AN ALLY AT YOUR SIDE"), a wave's own end
       (onWaveCleared(next): the rewinds), a fight that ends on its own terms
       (doneWhen / onDone), and its own way of being lost (climax) */
    ally: config.ally ? makeAlly(config.ally) : null,
    climax: config.climax || null,
    waveCleared: config.onWaveCleared || null,
    doneWhen: config.doneWhen || null, onDone: config.onDone || null,
    waveLabel: config.waveLabel || null,
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
       it back. Nothing else should ever be added to these maps. (The phoenix's
       Rebirth keeps its own flag, b.rebirthUsed — and since 3.00 the same meter
       clears it.) */
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
  tallyWave();                     // (3.22) one more wave for the day — the daily limit counts waves
  b.enemies = b.waves[i].map(spec => makeEnemy(spec.species, spec.level, { nerfed:spec.nerfed, ai:spec.ai, supplements:spec.supplements, boss:spec.boss, wildRoll:spec.wildRoll, crowned:spec.crowned, forceStage:spec.forceStage, elusive:spec.elusive, enraged:spec.enraged, anyLevel:spec.anyLevel, catchable:!!b.allowCatch }));
  // Leech Seed is a FIELD effect: it re-roots on every new wave.
  /* (the tiered field-status re-application below handles Leech Seed; a bare
      copy here used to overwrite it and strip the + / ✦ bite) */
  /* (3.11) a Test Arena challenge marks nothing seen: the dex is for the story */
  if(!b.arenaChallenge) b.enemies.forEach(e=>{ if(!state.encounteredSpecies.includes(e.species)) state.encounteredSpecies.push(e.species); });
  /* Field effects re-apply to anything that walks onto the field, so a new wave
     arrives already seeded / entombed rather than stepping in clean. */
  const fs = b.fieldStatus || {};
  if(fs.leechSeed) b.enemies.forEach(e=> addEStatus(e, Object.assign({}, fs.leechSeed)));
  if(fs.chill)     b.enemies.forEach(e=> addEStatus(e, Object.assign({}, fs.chill)));   // (3.16) Ice Tomb's chill — not its freeze
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
  const withPassive = b.enemies.find(e=>{ const p = passiveDefOf(e); return p && p.names.length; });   // (3.27: an always-on part of a cast move has no name)
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
    const next = ()=>{
      if(ui.battle !== b) return;          // (the fight was left meanwhile)
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
      /* (3.16) the end phase's Discombobulate: the new wave arrives into it */
      const dizzy = discombobulateEndPhase();
      renderBattle();
      battleMsg((b.tear ? tearWaveLabel(b.waveIndex) : b.waveLabel ? b.waveLabel(b.waveIndex) : `Wave ${b.waveIndex+1} of ${b.waves.length}!`)
        + (gone.length ? ` (${gone.join(' and ')} wore off.)` : '') + (dizzy ? ' ' + dizzy : ''));
      // the new arrivals face upkeep (Overheat, Aftershock) and may seize the initiative
      setTimeout(()=> beginRound('Choose a move.'), 900);
    };
    /* The space-time tear (2.94): a round's last wave won pays the round, and
       Cyborg rewinds the team, before the next round's first wave. */
    if(b.tear) return tearWaveCleared(next);
    if(b.waveCleared) return b.waveCleared(next);      // (3.19) the vault's rewinds, and what comes after the third
    next();
  } else {
    if(b.arenaChallenge) return arenaChallengeOver('won');   // (3.11) no XP, no prizes, no story
    if(b.coreSpar) return coreSparWon();       // a spar with the Monkey King (2.87)
    if(b.tear) return tearEnded('won');        // the seventh round (2.94)
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
  return !!(b && companionsUnlocked() && !b.scriptedAlly && !b.scriptedOneTurn && !b.scriptedLoss && !b.ally);   // (3.19) the vault: he is beside you instead
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
function isQuickMove(mv){ return !!(mv && ((mv.isStone && mv.stoneTier === 'veryhigh') || mv.aria || mv.soul || mv.iceBarrier)); }   // (3.16) Ice Barrier too
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

/* ============================================================
   AN ALLY AT YOUR SIDE (3.19) — the Monkey King, in the vault
   (handover/06 §12 "His stone rules" and "His pre-turn, every round";
   handover/07 phase 4). He fights beside you as an AI ally — and is never
   one of yours ON THE FIELD: playerField() does not hold him, so no blow of
   theirs is aimed at him, no area move of theirs reaches him, and the
   defeat check passes him by. Yet his Counter stacks are your side's
   (isOurs), and everything he casts is your side's.
     ui.battle.ally = { mon, spent:{type}, said, lines, opened, recast,
                        tombWave, cloneWave, clones, passive }
   THE PRE-TURN (allyPreTurn, from beginRound — after the upkeep, before the
   order is built: before you move, and before their first blow). His casts
   come from the elemental stones you hold, and his own Physical Stone: each
   casts its type's Very High at ✦, instantly, and is then spent, as yours
   are, until the recharge meter fills.
   - The first round: Mach Dragon ✦ is up already if you hold the Dragon
     Stone (carried), and the Fairy Stone's Diamond Dust ✦ passive is in the
     air; he casts every stone but the Water Stone — Dragon (Dragon Dance),
     Fire, Ghost, Electric, Physical (Counter), any others — then says what
     the dust does.
   - After that: when the dust is down and the soonest of his stones to end
     (the Curse, a round before the rest) is on its last turn, Diamond Dust ✦
     actively — Counter ✦ his choice, with a random second — to hold them;
     whenever you have filled the recharge meter, every stone again.
   - Ice Tomb ✦ in the pre-turn of the round Cyborg comes out.
   Each stone's first cast: a line of his, a lesson in using it (the lines,
   and where they are remembered, come with the fight — config.ally); after
   that, "🔁" in the log.
   HIS TURN (allyTurn): straight after your leader's in the order.
   Heavensplitter with its bonus (×2) on whichever of them is weakest — what
   your blow left standing; his first turn facing Cyborg, 72 Transformations
   instead (his next three blows doubled: each clone adds half the blow).
   Finish the wave yourself and the round ends without him. `passive`: he
   casts, and leaves the striking to you (the final phase).
   ============================================================ */
const ALLY_CAST_ORDER = ['Dragon', 'Fire', 'Ghost', 'Electric', 'Physical', 'Grass', 'Ground', 'Flying', 'Steel', 'Psychic'];
const ALLY_STRIKE = { mult:1.25, bonus:2, clones:3 };       // Heavensplitter, its 4 bonus words won; 72 Transformations
function battleAlly(){ return (ui.battle && ui.battle.ally) || null; }
function isAllyMon(m){ const A = battleAlly(); return !!(A && m && A.mon && m.uid === A.mon.uid); }
/* Make him for the fight: a level and his own name; never in your party. */
function makeAlly(spec){
  const m = newMonster(spec.species, spec.level || 100);
  m.uid = 'ally-' + spec.species;
  m.nickname = spec.name || null;
  m.crowned = !!spec.crowned;
  m.supplements = spec.supplements != null ? spec.supplements : proteinCap(spec.species, m);
  m.currentHp = monMaxHp(m);
  return { mon:m, spent:{}, said:spec.said || {}, lines:spec.lines || {}, onSaid:spec.onSaid || null, face:spec.face || null,
           opened:false, recast:false, tombWave:-1, cloneWave:-1, clones:0, passive:false, golden:!!spec.golden };
}
/* The types he can cast: every elemental stone you hold, and his own Physical. */
function allyStoneTypes(){
  const t = new Set(['Physical']);
  heldStones().forEach(st=> (st.types || [st.type]).forEach(x=>{ if(x) t.add(x); }));
  return [...t];
}
/* The soonest of his casts to end, in turns (Infinity if none is up). */
function allySoonestEnd(){
  const b = ui.battle, A = battleAlly();
  if(!b || !A) return Infinity;
  let n = Infinity;
  Object.keys(A.spent).forEach(type=>{
    if(type === 'Fairy' || type === 'Water') return;
    const k = veryHighStatusKey(type);
    const st = (b.fieldStatus || {})[k] || partyStatuses()[k];   // his Curse and Leech Seed are fields on them
    if(st && st.turnsLeft != null) n = Math.min(n, st.turnsLeft);
  });
  return n;
}
/* One box of his — the battle is held while it is read. */
function allySay(html){
  const b = ui.battle, A = battleAlly();
  if(!b || !A) return Promise.resolve();
  b.hold = (b.hold || 0) + 1;
  const face = A.face ? A.face() : monPortrait(A.mon.species, 64, { view:'front', bare:true, stage:monStage(A.mon) });
  return sceneSay([face], displayName(A.mon), html).then(()=>{ if(ui.battle === b) b.hold = Math.max(0, (b.hold || 1) - 1); });
}
const allyWait = ms=> new Promise(r=> setTimeout(r, ms));
/* Cast one stone (or the dust's hold), with his line the first time. */
async function allyCastOne(type){
  const b = ui.battle, A = battleAlly();
  if(!b || !A || ui.battle !== b) return;
  const mk = A.mon, atk = monAtk(mk);
  const key = type === 'FairyHold' ? 'FairyHeld' : type;
  const line = A.lines[key];
  if(line && !A.said[key]){
    A.said[key] = true;
    if(A.onSaid) A.onSaid(key);
    await allySay(line);
    if(ui.battle !== b) return;
  }
  const name = (veryHighDef(type === 'FairyHold' ? 'Fairy' : type, 2) || {}).name || type;
  if(type === 'FairyLine') return;                      // the dust's passive: already in the air
  playSfx('stone_veryhigh');
  bob(document.getElementById('allyBob'), +1);
  if(type === 'FairyHold'){
    A.spent.Fairy = true;
    const res = applyVeryHighEffect('Fairy', mk, atk, livingEnemies(), 2);
    renderStatusBadges();
    battleMsg(`🐒 ${escapeHtml(displayName(mk))} — Diamond Dust ✦! ${res.msg}`);
    await allyWait(900);
    if(ui.battle !== b) return;
    const pool = BORROW_GRID.filter(t=> t !== 'Physical');
    const second = pool[Math.floor(Math.random() * pool.length)];
    await new Promise(done=> castBorrowed(mk, atk, ['Physical', second], 2, done));
    return;
  }
  A.spent[type] = true;
  if(type === 'Water') A.tombWave = b.waveIndex;
  /* Steel Aegis's block goes on the one of yours out front — nothing is aimed
     at him, so on him it would soak nothing */
  const caster = type === 'Steel' ? (frontMon() || mk) : mk;
  const res = applyVeryHighEffect(type, caster, type === 'Steel' ? monAtk(caster) : atk, livingEnemies(), 2);
  renderStatusBadges();
  const again = A.said['cast_' + type];
  A.said['cast_' + type] = true;
  battleMsg(`${again ? '🔁' : '🐒'} ${escapeHtml(displayName(mk))} — ${escapeHtml(name)} ✦! ${res.msg}`);
  await allyWait(again ? 700 : 1000);
}
/* The first round's passives: Mach Dragon ✦ (the Dragon Stone, carried) and
   the Fairy Stone's Diamond Dust ✦. */
function allyPassives(){
  const A = battleAlly();
  if(!A) return;
  const types = allyStoneTypes();
  if(types.includes('Dragon')){
    const d = veryHighDef('Dragon', 2);
    setPStatus(0, { type:'machDragon', turnsLeft:(d.turns || 5) + 1, tier:d.mach || 2, mine:true });
  }
  if(types.includes('Fairy') && !playerDust()) applyVeryHighEffect('Fairy', A.mon, monAtk(A.mon), livingEnemies(), 2);
  renderStatusBadges();
}
/* The pre-turn: what he casts before anyone moves this round. */
function allyPreTurn(done){
  const b = ui.battle, A = battleAlly();
  if(!b || !A || livingEnemies().length === 0) return done();
  const types = allyStoneTypes();
  const list = [];
  const order = ()=> ALLY_CAST_ORDER.filter(t=> types.includes(t) && !A.spent[t]);
  if(!A.opened){
    A.opened = true;
    allyPassives();
    if(types.includes('Dragon') && !A.said.cast_mach){ A.said.cast_mach = true; battleMsg(`🐉 Mach Dragon ✦ — with the Dragon Stone's power, your side moves first.`); }
    list.push(...order());
    if(types.includes('Fairy')) list.push('FairyLine');
  } else if(A.recast){
    A.recast = false;
    list.push(...order());
  } else if(types.includes('Fairy') && !A.spent.Fairy && !playerDust() && allySoonestEnd() <= 1){
    list.push('FairyHold');
  }
  /* Ice Tomb, kept for Cyborg: the round it comes out */
  const cyb = livingEnemies().some(e=> e.species === 'cyborg' && !e.broken);
  if(cyb && types.includes('Water') && !A.spent.Water && A.tombWave !== b.waveIndex) list.push('Water');
  if(!list.length) return done();
  b.phase = 'resolving';
  renderBattle();
  (async ()=>{
    for(const t of list){
      if(ui.battle !== b || livingEnemies().length === 0) break;
      await allyCastOne(t);
    }
    if(ui.battle !== b) return;
    if(livingEnemies().length === 0) return setTimeout(onWaveCleared, 500);   // a burn of his finished them
    renderBattle();
    setTimeout(done, 300);
  })();
}
/* The meter has filled: every stone of his comes back, for the next pre-turn. */
function allyRecharge(){
  const A = battleAlly();
  if(!A) return;
  A.spent = {};
  A.recast = true;
}
/* His place in the order: straight after your leader's. */
function allyRow(){
  const A = battleAlly();
  return { side:'ally', mon:A.mon, idx:-3, role:'ally', tier:machTier('player'), value:initiativeOf('player', A.mon) };
}
function insertAllyRow(rows){
  if(!battleAlly()) return rows;
  const at = rows.findIndex(r=> r.side === 'player' && r.role === 'leader');
  rows.splice(at >= 0 ? at + 1 : 0, 0, allyRow());
  return rows;
}
/* His turn. */
function allyTurn(){
  const b = ui.battle, A = battleAlly();
  if(!b || !A) return advanceTurn();
  const foes = livingEnemies().filter(e=> e.hp > 0 && !e.broken);
  if(!foes.length || A.passive) return advanceTurn();
  b.phase = 'resolving';
  setFocus(null);
  b.control = null;
  renderBattle();
  const mk = A.mon, name = escapeHtml(displayName(mk));
  /* his first turn facing Cyborg: 72 Transformations */
  const cyb = foes.find(e=> e.species === 'cyborg');
  if(cyb && A.clones <= 0 && A.cloneWave !== b.waveIndex){
    A.cloneWave = b.waveIndex;
    A.clones = ALLY_STRIKE.clones;
    bob(document.getElementById('allyBob'), +1);
    playSfx('stone_veryhigh');
    renderBattle();
    battleMsg(`🐒 ${name} — 72 Transformations! Two clones of him spring up at his side: his next <b>${ALLY_STRIKE.clones}</b> blows land with theirs — <b>twice as hard</b>.`);
    return setTimeout(advanceTurn, 1500);
  }
  const t = foes.slice().sort((x, y)=> x.hp - y.hp)[0];
  allyStrike(t, ()=> advanceTurn());
}
/* Heavensplitter, its bonus won — and his clones, while they stand. */
function allyStrike(t, done){
  const b = ui.battle, A = battleAlly();
  const mk = A.mon, idx = b.enemies.indexOf(t);
  b.actionSeq = (b.actionSeq || 0) + 1;
  b.actionMon = null;
  b.actionDodges = [];
  const clone = A.clones > 0;
  const factor = ALLY_STRIKE.mult * ALLY_STRIKE.bonus * (clone ? 2 : 1);
  battleMsg(`🐒 ${escapeHtml(displayName(mk))} — Heavensplitter!` + (clone ? ' His clones strike with him!' : ''));
  bob(document.getElementById('allyBob'), +1);
  playEffect('Heavensplitter', { type:'Physical', at:'enemy-' + idx });
  setTimeout(()=>{
    if(ui.battle !== b) return;
    if(clone) A.clones--;
    const dodged = rollDodge(t, idx, 0, false, false, mk);   // (3.25) his own eyes, not your monster's
    const raw = dodged ? 0 : enemyGuard(t, computeDamage(factor, monAtk(mk), monRef(mk), t, true));
    const hits = [{ t, idx, oldHp:t.hp, newHp:Math.max(0, t.hp - raw), dmg:raw, dodged }];
    if(raw > 0){
      applyHits(hits, { blow:'a' + b.actionSeq });
      reportHits(hits);
    }
    logBattle(`${displayName(mk)} used Heavensplitter (ally${clone ? ', clones' : ''}) — factor ${factor.toFixed(2)}× ATK ${monAtk(mk)} → ${dodged ? 'dodged' : hits[0].dmg}`);
    renderStatusBadges();
    setTimeout(()=>{
      if(ui.battle !== b) return;
      if(livingEnemies().length === 0) return onWaveCleared();
      done();
    }, 900);
  }, 420);
}
/* His figure beside yours, and his line on your plate. */
function allyAvatarHtml(){
  const A = battleAlly();
  if(!A) return '';
  const m = A.mon, px = Math.round(playerSpriteSize() * 0.66);
  return `<div class="bob player-avatar ally-avatar${A.golden ? ' golden' : ''}" id="allyBob">${monPortrait(m.species, px, { view:'back', bare:true, stage:monStage(m), crowned:isCrowned(m), breathe:'normal' })}` +
    (A.clones > 0 ? `<span class="ally-clones" aria-hidden="true">${monPortrait(m.species, Math.round(px * 0.62), { view:'back', bare:true, stage:monStage(m) })}${monPortrait(m.species, Math.round(px * 0.62), { view:'back', bare:true, stage:monStage(m) })}</span>` : '') +
    `</div>`;
}
function allyPlateHtml(){
  const A = battleAlly();
  if(!A) return '';
  const m = A.mon;
  return `<div class="ally-plate"><b>🐒 ${escapeHtml(displayName(m))}</b> <span>Lv ${m.level}</span>` +
    `<small>${A.passive ? 'keeps your stones in the air — the blows are yours' : 'casts your stones · strikes after you'}${A.clones > 0 ? ` · 👥 ${A.clones}` : ''}</small></div>`;
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
const CLEVER_AI = new Set(['best','smart','maxer','ankylo','cataclysm','dragon','tricer','firehound','stoop']);
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
  const n = moveHitsFor(e, ex);                                  // a Tailed Cat's tails (2.97)
  const hits = (n > 1 && !ex.reflect && !ex.grudge) ? n : 1;
  const mult = mv[2] != null ? mv[2] : 0.5;
  const per = (n > 1 && ex.split) ? mult / n : mult;
  let one = Math.max(1, computeDamage(per, enemyAtk(e), e, monRef(m), false, true));   // an estimate (peek)
  if(ex.sleeperMult && getMStatus(m, 'asleep')) one *= ex.sleeperMult;          // (3.16) a Dream Eater goes for the sleeper
  const soak = blockStacksOf(m) * (m.blockValue || 0);
  const need = Math.ceil((m.currentHp + soak) / Math.max(1, one * hits));
  const dodge = seesThrough(e) ? 0 : Math.min(0.95, playerEvasionFrom(e, m));   // a Third Eye cannot miss (2.97)
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
  /* (3.38) Taunted: the one that yawned at it, whoever it would rather have */
  const tn = tauntOf(e);
  if(tn && mine.includes(tn.taunter)) return tn.taunter;
  if(!enemyFocuses(e)) return mine[Math.floor(Math.random() * mine.length)];
  const cur = mine.find(m=> m.uid === b.foeFocus);
  const open = mine.filter(m=> seesThrough(e) || !untouchable(m));          // nothing hides from a Third Eye (2.97)
  if(cur && (seesThrough(e) || !untouchable(cur) || !open.length)) return cur;
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
  if(fs.chill)     addEStatus(e, Object.assign({}, fs.chill));   // (3.16)
  if(fs.curse)     addEStatus(e, Object.assign({}, fs.curse));
  if(fs.disruptField) addEStatus(e, { type:'disrupt', turnsLeft:fs.disruptField.turnsLeft, stun:fs.disruptField.stun, mine:!!fs.disruptField.mine });
  applyEntryPassives(e, e.species, e.level, e.atk);
  const pd = passiveDefOf(e);
  if(pd && pd.names.length){
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
  /* (3.19) your Forest Fairy's Overgrowth: 7% of its own a stack, for the
     whole team, for the rest of the battle — added as Enrage is */
  const og = ui.battle ? overgrowthBonus(m, base) : 0;
  const n = (m && m.enrageStacks) || 0;
  if(!n) return base + og;
  const c = ui.battle ? getPStatus(0,'counter') : null;
  return base + og + Math.round(n * ((c && c.enrage) || 0.20) * base);
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
             scale:e.scale||null, hits:moveHitsFor(m, e), split:!!e.split, charge:e.charge||null,   // (3.26) a move's own strikes
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
  /* (3.19) The Forest Guardian's gift: Giga Drain on every one of them, and
     Overgrowth a passive — it comes round by itself, never a button. */
  if(hasForestGift(m)){
    for(let k = base.length - 1; k >= 0; k--){
      const g = forestGiftMove(m, base[k]);
      if(g && g.overgrowth) base.splice(k, 1); else base[k] = g;
    }
  }
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
  /* Amnesia (2.97): what their Mindcat made it forget is shut for its next
     turn — the button keeps its name and says so. */
  const fg = forgottenNames(m);
  if(fg.length) base.forEach(mv=>{ if(mv.available && fg.includes(mv.name)){ mv.available = false; mv.forgotten = true; } });
  /* (3.38) Taunted (a Hermit Sloth's Mocking Yawn): its strongest attack only,
     this turn — the other buttons keep their names and say so. */
  if(tauntOf(m)){
    const pick = tauntPick(m, base);
    if(pick) base.forEach(mv=>{ if(mv.available && mv !== pick){ mv.available = false; mv.taunted = true; } });
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
  /* (3.19) an ally at your side: the Monkey King, in the vault */
  .player-card.with-ally{ gap:4px; }
  .player-card .ally-avatar{ position:relative; margin-left:-22px; align-self:flex-end; }
  .player-card .ally-avatar.golden .mon-sprite, .player-card .ally-avatar.golden img{ filter:drop-shadow(0 0 7px rgba(255,214,90,.95)) drop-shadow(0 0 16px rgba(255,190,40,.6)); }
  .ally-clones{ position:absolute; inset:auto 0 0 0; display:flex; justify-content:space-between; pointer-events:none; opacity:.5; z-index:-1; }
  .ally-clones > *:first-child{ transform:translate(-30%, -34%); }
  .ally-clones > *:last-child{ transform:translate(30%, -34%); }
  /* (3.19) a lone Cyborg stands where the middle of a wave of three would (3.00) */
  .enemy-row.centred{ justify-content:center; }
  .ally-plate{ margin-top:6px; padding:4px 7px; border-radius:10px; background:linear-gradient(180deg, #fff6d8, #f6e3a8);
    border:1.5px solid #d6b354; font-size:13px; line-height:1.25; color:var(--ink); }
  .ally-plate b{ font-family:'Baloo 2',cursive; }
  .ally-plate span{ font-size:12px; font-weight:800; color:var(--ink-soft); }
  .ally-plate small{ display:block; font-size:10px; font-weight:700; color:#7a5a10; }
  `;
  document.head.appendChild(st);
}

/* How many places the enemy row is laid out for. Cyborg alone stands as the
   middle of a wave of three would (3.00): the designer's picture of it, with
   room on either side for its past and future. */
function enemyFieldSlots(b){
  const list = (b && b.enemies) || [];
  return (list.length === 1 && list[0].species === 'cyborg') ? 3 : list.length;
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
  const kd = getPStatus(0,'kindle');
  if(kd) m *= (kd.deal || 1.2);            // (3.15) Kindle — a Polygon's Overclock (3.26)
  const en = getPStatus(0,'enchant');
  if(en) m *= (en.deal || 1.3);            // (3.36) the Firefox's Enchant
  m *= 1 + sideAura('player', 'empower');  // (3.36) and its Cheer
  m *= wrathDamageBonus();                 // every grudge held makes you hit harder
  m *= comboMultiplier(activeMon());       // a blow you read makes the next one bigger
  m *= terrorizeFactor();                  // something on the field is frightening
  if(ui.battle && ui.battle.legacyBonus) m *= (1 + ui.battle.legacyBonus);
  m *= attackCut('player');                // (3.16) their Ice Barrier, their chill on you
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
  if(mv.hits && mv.hits > 1) return `×${mv.hits}`;
  if(mv.target === 'AOE') return 'AOE';
  if(mv.target === 'Multi2') return '2 targets';
  if(mv.revitalise) return 'Revive';
  if(mv.soul || mv.iceBarrier) return 'Quick';   // costs no turn (2.93; Ice Barrier 3.16)
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
    return `Hits <b>${r.min}–${r.max}</b> times at random enemies for <b>${dmg}</b> each (<b>${dmg*r.min}–${dmg*r.max}</b> in all).`;
  }
  if(mv.target === 'SingleAOE')
    return `Hits one enemy for <b>${dmg}</b>, then every other enemy for <b>${Math.ceil(dmg*(mv.splash||0.5))}</b>.`;
  if(mv.target === 'AOE' && n) return `Hits <b>all enemies ${n} times</b> for <b>${dmg}</b> (<b>${dmg*n}</b> each).`;
  if(mv.target === 'AOE')      return `Hits <b>all enemies</b> for <b>${dmg}</b> damage each.`;
  if(mv.target === 'Multi2')   return `Hits <b>2 enemies</b> for <b>${dmg}</b> damage each.`;
  if(n)                        return `Hits <b>1 enemy ${n} times</b> for <b>${dmg}</b> (<b>${dmg*n}</b> in all).`;
  return `Hits <b>1 enemy</b> for <b>${dmg}</b> damage.`;
}

/* What a passive does, a clause for each of its effects — for its card, and
   (3.27) for the always-on part of a cast move. `atk` is the holder's. */
function passiveBits(p, atk){
  /* (3.42) The designer: "lots of the descriptions are way too long … keep
     them concise". One short sentence an effect, its numbers in bold; the
     card joins them ("Passive: …. …."). */
  const bits = [];
  const pc = x=> Math.round(x * 100);
  const steps = n=> n > 1 ? `${n} steps` : '1 step';
  if(p.block)        bits.push(`Starts with <b>${p.block} shield${p.block > 1 ? 's' : ''}</b>${p.block > 1 ? ', each' : ''} blocking <b>${atk}</b>` +
    (p.organosteel ? `. Gains <b>${p.organosteel} more</b> every turn (<b>Organosteel Body</b>)` : ''));
  if(p.guard)        bits.push(`Starts <b>on guard</b>: +1 shield each turn`);
  if(p.airborne)     bits.push(`Starts <b>airborne</b>: dodges <b>70%</b> for a turn`);
  if(p.invisible)    bits.push(`Starts <b>unseen</b>: dodges <b>80%</b> for a turn`);
  if(p.evadeTurns)   bits.push(`Starts in <b>stillness</b>: dodges everything the first ${p.evadeTurns > 1 ? p.evadeTurns + ' turns' : 'turn'} it is attacked`);
  if(p.counterTurns || p.counterStack) bits.push(`Starts with a <b>Counter stack</b>: the next attack on its side does <b>80% less</b>`);
  if(p.first)        bits.push(`Always moves <b>first</b>`);
  if(p.quick)        bits.push(`A free <b>quick attack</b> each round: <b>${Math.ceil(p.quick * atk)}</b> (${p.quick}× ATK) on a random enemy`);
  if(p.playerDouble) bits.push(`<b>${pc(p.playerDouble)}%</b> chance to strike twice`);
  if(p.thresholdStun) bits.push(`Stuns its attacker as it drops below <b>${p.thresholdStun.map(t=> pc(t) + '%').join(', ')}</b> health`);
  if(p.thresholdSleep) bits.push(`Puts its attacker to <b>sleep</b> as it drops below <b>${p.thresholdSleep.map(t=> pc(t) + '%').join(', ')}</b> health`);
  if(p.evadeAlways)  bits.push(`Dodges <b>${pc(p.evadeAlways)}%</b> of attacks`);
  if(p.lurk)         bits.push(`<b>Lurks</b> on arrival: attacks miss it until it attacks`);
  if(p.ambush)       bits.push(`Its first blow from a Lurk deals <b>+${pc(p.ambush - 1)}%</b>`);
  if(p.bog)          bits.push(`The other side moves <b>1 step later</b> while it stands`);
  if(p.cunning){
    const c = p.cunning, f = c.first != null ? c.first : 1, a = c.after || 0;
    bits.push((f >= 1 && !a) ? `After its first hit it turns <b>Cunning</b>: attacks miss it until it attacks again`
            : (f >= 1) ? `Turns <b>Cunning</b> after its first hit, then <b>${pc(a)}%</b> of the time: attacks miss it until it attacks again`
            : `<b>${pc(f)}%</b> chance to turn <b>Cunning</b> when it hits: attacks miss it until it attacks again`);
  }
  if(p.lifesteal)    bits.push(`Heals <b>${pc(p.lifesteal)}%</b> of the damage it deals`);
  if(p.riposte)      bits.push(`Strikes back for <b>${Math.ceil(p.riposte * atk)}</b> when an attack misses it or is blocked`);
  if(p.greed)        bits.push(`<b>Steals</b> a buff from the other side with every hit`);
  /* the psychics' (2.97; handover/05 §9) */
  if(p.focus)        bits.push(`<b>Focus</b>: <b>+${pc(p.focus - 1)}%</b> damage if nothing has hit it this round`);
  if(p.thirdEye)     bits.push(`<b>Third Eye</b>: its attacks can't be dodged`);
  if(p.composure)    bits.push(`<b>Composure</b>: <b>+${pc(p.composure - 1)}%</b> damage at full health`);
  if(p.exploit)      bits.push(`<b>Exploit</b>: <b>+${pc(p.exploit - 1)}%</b> damage on a monster that is asleep, confused, blinded, charmed or forgetting, or under a Discombobulate`);
  if(p.precog)       bits.push(`<b>Precognition</b>: the first attack on it each round does <b>${pc(1 - p.precog)}% less</b>`);
  if(p.amnesia)      bits.push(`<b>Amnesia</b>: whatever it hits forgets its best move for a turn`);
  if(p.hypnosis)     bits.push(`<b>${pc(p.hypnosis)}%</b> chance its hits put the target to <b>sleep</b>`);
  if(p.ironWill)     bits.push(`<b>Iron Will</b>: can't be put to sleep, stunned or confused`);
  if(p.guardian)     bits.push(`Takes the single blows meant for its friends`);
  if(p.armour)       bits.push(`Takes <b>${pc(p.armour)}% less</b> damage`);
  if(p.futuresight)  bits.push(`<b>Futuresight</b>: dodges <b>${pc(p.futuresight)}%</b> of strikes; each dodge makes its Spacetime Rift Max <b>1.1×</b> stronger`);
  if(p.soulfire)     bits.push(`Strikes back at every attacker for <b>${Math.ceil(p.soulfire * atk)}</b>`);
  /* (3.15) the fifteen psychics' — (3.26) Feeding Frenzy is Exploit and a critical */
  if(p.crit)         bits.push(`<b>Critical</b>: <b>${pc(p.crit.chance || 0.15)}%</b> chance to deal <b>${p.crit.mult || 2}×</b>`);
  if(p.hitCap)       bits.push(`<b>Carapace</b>: never loses more than <b>${Math.abs(p.hitCap - 1/3) < 0.01 ? 'a third' : pc(p.hitCap) + '%'}</b> of its health to one hit`);
  if(p.slow)         bits.push(`Moves <b>${steps(p.slow)} later</b>`);
  if(p.speed)        bits.push(`Moves <b>${steps(p.speed)} sooner</b>`);
  if(p.braced)       bits.push(`Takes <b>${pc(p.braced)}% less</b> until it has moved each round`);
  if(p.shakeOff)     bits.push(`Shakes off <b>one</b> debuff on itself each turn`);
  if(p.slipstream)   bits.push(`<b>Slipstream</b>: its side moves <b>1 step sooner</b>`);
  if(p.lockOn)       bits.push(`<b>Lock-On</b>: its side's attacks can't be dodged`);
  if(p.ward)         bits.push(`<b>Tidal Ward</b>: its side takes <b>${pc(p.ward)}% less</b> damage`);
  if(p.undertow)     bits.push(`<b>Undertow</b>: the other side moves <b>1 step later</b>`);   // (3.27)
  if(p.trueSight)    bits.push(`<b>Arcane Sight</b>: the other side dodges <b>${pc(p.trueSight)}% less</b> often`);
  if(p.empower)      bits.push(`Its side deals <b>${pc(p.empower)}% more</b> damage`);
  if(p.meditate)     bits.push(`<b>Meditate</b>: <b>+${pc(p.meditate)}%</b> damage for each turn it isn't hit, up to <b>+${pc(p.meditate * (p.meditateMax || 4))}%</b>`);
  if(p.sleepBack)    bits.push(`<b>Lullaby Reflex</b>: <b>${pc(p.sleepBack)}%</b> chance to put its attacker to sleep`);
  /* (3.27) the Squid's Ink Cloud, the Ladybird's Warning Colours */
  if(p.inkBack)      bits.push(`<b>Ink Cloud</b>: <b>${pc(p.inkBack.chance || 0.25)}%</b> chance to blind its attacker (<b>${pc(p.inkBack.miss || 0.25)}%</b> of its attacks miss)`);
  if(p.weakBack)     bits.push(`<b>Warning Colours</b>: <b>${pc(p.weakBack.chance || 0.25)}%</b> chance to halve its attacker's next attack`);
  if(p.retaliate)    bits.push(`Strikes back at every attacker for <b>${Math.ceil(p.retaliate * atk)}</b>`);
  if(p.dodgeBank)    bits.push(`<b>Moonlit Retribution</b>: each dodged strike of its side banks <b>${Math.ceil(p.dodgeBank * atk)}</b> ` +
    `(<b>${p.bankCap || 5}</b> a turn at most); at the end of the turn it all hits every enemy`);
  if(p.cleanseEnd)   bits.push(`Lifts <b>${p.cleanseEnd > 1 ? p.cleanseEnd : 'one'}</b> debuff off its side each turn`);
  if(p.drowse)       bits.push(`Each enemy has a <b>${pc(p.drowse)}%</b> chance each turn to fall <b>asleep</b>`);
  return bits;
}
/* Effects, in plain words. Keyed by the mechanic, not the move name, so a new
   monster reusing a mechanic gets its description for free. */
function moveEffectText(mv, mon, atk){
  /* (3.42) The designer: "lots of the descriptions are way too long … keep
     them concise". Mechanics first, the real numbers in bold, a sentence or
     two each — what it does, not every case it meets. */
  const out = [];
  const pc = x=> Math.round(x * 100);
  const val = f=> Math.ceil(f * atk);
  /* Caladrius: everything is measured against its own (enormous) max health. */
  const maxHp = mon ? monMaxHp(mon) : 0;
  const ofHp = f => maxHp ? `<b>${Math.ceil(f * maxHp)} HP</b> (${pc(f)}%)` : `<b>${pc(f)}%</b> of its health`;
  /* Giga Drain's drink (PARTY_DRAIN, 05) — and (3.19) the Forest Guardian's
     gift: a drink for every one it reaches, and Overgrowth a passive. */
  if(mv.drainEach) out.push(
    `<b>The Forest Guardian's gift.</b> Heals <b>${val(mv.drainEach)} HP</b> for each enemy it hits: her first, then whoever is worst off.`);
  else if(mv.name === 'Giga Drain' && mon && mon.uid && typeof PARTY_DRAIN !== 'undefined' && PARTY_DRAIN[mv.name]) out.push(
    `<b>Drain.</b> Heals <b>${val(PARTY_DRAIN[mv.name])} HP</b>: her first, then whoever is worst off.`);
  if(mv.overgrowth){
    const G = FOREST_GIFT, step = pc(G.step);
    out.push(`<b>Passive — the Forest Guardian's gift.</b> Once a turn you may write <b>${G.words}</b> silver or gold words: ` +
      `all right, and your team's ATK rises <b>${step}%</b> for the battle (up to <b>+${step * G.maxStacks}%</b>). ` +
      `She also heals <b>${pc(G.regen)}%</b>${mon ? ` (${Math.ceil(monMaxHp(mon) * G.regen)} HP)` : ''} each turn.`);
  }
  if(mv.fracture) out.push(
    `<b>Spacetime Fracture.</b> <b>${mv.fracture}×</b> stronger for each fracture on it, multiplying (5 fractures: <b>${Math.pow(mv.fracture, 5).toFixed(2)}×</b>).`);
  if(mv.vita) out.push(
    `<b>Vita.</b> Heals your side ${ofHp(mv.vita.pulse || 0.2)} now, then your worst-off teammate by that much each turn for <b>${mv.vita.turns || 5} turns</b>.`);
  /* (3.16) Ice Barrier: a quick move — their attacks −30% for 5 turns, one of
     their marks off your side now and every turn. */
  if(mv.iceBarrier){
    const ib = mv.iceBarrier, n = ib.purge || 1;
    out.push(`<b>${escapeHtml(mv.name)}.</b> Quick: it doesn't use your turn. For <b>${ib.turns || 5} turns</b> their attacks deal ` +
      `<b>${pc(ib.cut || 0.30)}% less</b>, and <b>${n === 1 ? 'one' : n}</b> of their debuffs comes off your side now and each turn.`);
  }
  /* Shields on itself or its partner, and a barrier to its next turn (the
     Mime's Invisible Wall): castBarrier (3.14, 3.15). */
  if(mv.barrier){
    const bd = mv.barrier;
    const sh = bd.shields || 0, pct = pc(bd.reduce || 0), cl = bd.cleanse || 0, w = bd.worth || 1;
    const each = (atk != null && atk > 0) ? `<b>${Math.ceil(atk * w)}</b>` : (w === 1 ? 'its ATK' : `${w}× its ATK`);
    out.push((`<b>${escapeHtml(mv.name)}.</b> ` +
      (sh ? `${sh > 1 ? `<b>${sh} shields</b>` : 'A shield'} on ${bd.on === 'partner' ? 'its partner' : 'itself'}, ${sh > 1 ? 'each ' : ''}blocking ${each}. ` : '') +
      (pct ? `Until its next turn, blows on your side deal <b>${pct}% less</b>. ` : '') +
      (cl ? `Clears <b>${cl}</b> enemy debuff${cl > 1 ? 's' : ''} off your side.` : '')).trim());
  }
  /* (3.15) the psychics' moves */
  if(mv.mend) out.push(
    `<b>${escapeHtml(mv.name)}.</b> Heals your side on the field by ${ofHp(mv.mend.pct || 0.15)}.` +
    (mv.mend.fleece ? ` Then for <b>${mv.mend.fleece.turns || 3} turns</b> your side takes <b>${pc(mv.mend.fleece.reduce || 0.15)}% less</b>.` : ''));
  if(mv.transfuse) out.push(
    `<b>${escapeHtml(mv.name)}.</b> Gives its partner its own health: up to ${ofHp(mv.transfuse.pct || 0.3)}.`);
  if(mv.kindle) out.push(
    `<b>${escapeHtml(mv.name)}.</b> For <b>${mv.kindle.turns} turns</b> your side deals <b>${mv.kindle.deal}×</b> damage.`);
  /* (3.36) the Firefox's Grand Enchantment (castEnchant) */
  if(mv.enchant) out.push(
    `<b>${escapeHtml(mv.name)}.</b> For <b>${mv.enchant.turns || 3} turns</b> your side deals <b>${mv.enchant.deal}×</b> damage` +
    (mv.enchant.init ? ` and moves <b>1 step sooner</b>` : '') + `.`);
  /* (3.37) the Firefox's Stargazer (seesThrough) */
  if(mv.stargaze) out.push(
    `<b>${escapeHtml(mv.name)}.</b> For <b>${mv.stargaze.turns || 3} turns</b> your side's attacks can't be dodged.`);
  if(mv.gallop) out.push(
    `<b>${escapeHtml(mv.name)}.</b> For <b>${mv.gallop.turns} turns</b> your side moves <b>${mv.gallop.init > 1 ? mv.gallop.init + ' steps' : '1 step'} sooner</b>.`);
  if(mv.glitch && mv.mult == null) out.push(
    `<b>${escapeHtml(mv.name)}.</b> One of six, at random: <b>Data Spike</b> (a ${GLITCH_SPIKE}× blow${atk ? `, ${val(GLITCH_SPIKE)}` : ''}), ` +
    `<b>Patch</b> (heals your side <b>15%</b>), <b>Firewall</b> (a shield on its partner), <b>Lag</b> (halves an enemy's next attack), ` +
    `<b>Sleep Mode</b> (an enemy sleeps a turn) or <b>Overclock</b> (your side deals <b>1.2×</b> for 2 turns).`);
  if(mv.randomMult){
    const [lo, hi] = mv.randomMult;
    out.push(`<b>Random power:</b> <b>${lo}×</b> to <b>${hi}×</b>` +
      (atk ? ` (<b>${Math.ceil((mv.mult || 1) * lo * atk)}–${Math.ceil((mv.mult || 1) * hi * atk)}</b>)` : '') + `.` +
      (mv.glitch ? ` Plus a random <b>Glitch</b>.` : ''));
  }
  if(mv.copy) out.push(
    `<b>${escapeHtml(mv.name)}.</b> Copies the attacks an enemy you choose made last turn, at <b>${mv.copy}×</b> their power with its own ATK.`);
  if(mv.focusBreak) out.push(
    `<b>Focus:</b> hit while it winds up, it lands at <b>${pc(mv.focusBreak)}%</b> (<b>${Math.ceil((mv.mult || 0) * mv.focusBreak * atk)}</b>).`);
  /* (3.38) by the attacks of theirs that have got through to it this round */
  if(mv.revenge){
    const st = Array.isArray(mv.revenge) ? mv.revenge : [mv.revenge];
    const at = x=> Math.ceil((mv.mult || 0) * x * atk);
    const nth = ['one', 'two', 'three'];
    out.push(st.length > 1
      ? `<b>Pays back:</b> ` + st.map((x, i)=> `<b>${x}×</b> (${at(x)}) after ${nth[i] || i + 1}${i === st.length - 1 ? ' or more' : ''}`).join(', ') +
        ` attacks on it this round.`
      : `<b>Pays back:</b> <b>${st[0]}×</b> (${at(st[0])}) if it was hit this round.`);
  }
  /* (3.38) the Hermit Sloth's Mocking Yawn (tauntMark) */
  if(mv.taunt) out.push(
    `<b>Taunt.</b> Every enemy it hits must use its strongest attack on this monster next turn.`);
  if(mv.shieldGain) out.push(
    `<b>+${mv.shieldGain} shield value:</b> each full 1 becomes a shield${atk ? ` blocking <b>${Math.ceil(atk)}</b>` : ''}.`);
  if(mv.sleepHit) out.push(
    `<b>${pc(mv.sleepHit)}%</b> chance to put each one it hits to <b>sleep</b> for a turn.`);
  /* (3.26) the Squid's Abyssal Gaze Max: a muddle on the one it hits */
  if(mv.confuseHit) out.push(
    `<b>${pc(mv.confuseHit.chance || 0.25)}%</b> chance to <b>confuse</b> the one it hits: its next swing hits its own side.`);
  if(mv.blindHit) out.push(
    `<b>Blinds</b> the one it hits for <b>${mv.blindHit.turns || 2} turns</b>: <b>${pc(mv.blindHit.miss || BLIND_MISS)}%</b> of its attacks miss.`);
  if(mv.conversio) out.push(
    `<b>Conversio.</b> Revives up to <b>${mv.conversio.revives || 2}</b> fainted teammates with <b>${pc(mv.conversio.pct || 0.33)}%</b> health. ` +
    `Each revive leaves a <b>Mors mark</b>; at <b>3</b> it faints for good. With nobody fainted, it takes ${ofHp(mv.conversio.direct || 0.33)} from an enemy instead.`);
  if(mv.lunacy) out.push(
    `<b>${mv.lunacy.glow ? 'Dazzle' : 'Lunacy'}.</b> <b>${pc(mv.lunacy.chance || 0.25)}%</b> chance to <b>confuse</b> every enemy: its next swing hits its own side` +
    ((mv.lunacy.ffPower != null && mv.lunacy.ffPower < 1) ? ` at <b>${pc(mv.lunacy.ffPower)}%</b> power` : '') + `.`);
  /* The Whalelord's kit: mechanics first and plainly, with his real numbers. */
  if(mv.vengeance){
    const n = mv.vengeance.hits || 3;
    const per = Math.ceil((mv.mult || 0.6) * atk);
    const fall = mv.vengeance.perFallen || 0;
    out.push(`<b>${n} blows</b> of <b>${per}</b>, each on a different enemy.` +
      (fall ? ` Each fainted teammate adds <b>+${val(fall)}</b> a blow (up to ${mv.vengeance.fallenCap || 6}).` : '') +
      ` Then you may swap him out for free.`);
  }
  if(mv.wrath) out.push(
    `For <b>${mv.wrath.turns} turns</b> every enemy move adds a <b>grudge</b>: <b>+${pc(mv.wrath.bonus)}%</b> damage each (up to <b>+${pc(mv.wrath.bonusCap)}%</b>). ` +
    `Swap him back in and every grudge hits every enemy for <b>${val(mv.wrath.per)}</b>.`);
  if(mv.grudge){
    const flat = (mv.grudge.flat || 0.25) * atk, part = mv.grudge.missing || 0.75;
    const max = mon ? monMaxHp(mon) : 0;
    const at = missing => Math.ceil(flat + part * missing);
    out.push(`Hits every enemy for <b>${Math.ceil(flat)}</b> plus <b>${pc(part)}%</b> of the health he has lost` +
      (max ? ` (at 1 HP: <b>${at(max - 1)}</b>)` : '') + `.`);
  }
  if(mv.aria){
    /* (3.08) the designer's revenge counter, with its own numbers */
    out.push(`<b>Haunting Aria.</b> The first turn enemies attack him, their attacks pass through. Then for <b>${mv.aria.turns} turns</b> ` +
      `every attack on your side builds his vengeance, and each time it is full his apparition hits every enemy for ` +
      `<b>${Math.ceil((mv.aria.pulse || 0.5) * atk)}</b>. Spell it without using your turn.`);
  }
  if(mv.passive && mv.passive.noFlee) out.push(
    `While he is out, <b>no enemy can flee</b>.`);
  if(mv.statNote){
    const sp = (mon && mon.species) || 'caladrius';
    const pcf = pacificusOf(sp) || 0.75;
    out.push(`<b>${escapeHtml(mv.name || 'Pacificus')}.</b> Not a move: <b>${pc(pcf)}%</b> of its attack becomes health ` +
      `(health <b>${+(1 + pcf).toFixed(2)}×</b>, ATK <b>${+(1 - pcf).toFixed(2)}×</b>).` +
      (sp === 'caladrius' ? ` Vita and Conversio use that health.` : ` Transfusion gives it away.`));
  }
  if(mv.revitalise) out.push(
    `<b>Revive.</b> Brings one fainted teammate back with <b>${pc(mv.revitalise.pct || 0.1)}%</b> health.`);
  if(mv.soul){
    const r = mv.soul.reduce;
    out.push(`<b>Steel Soul.</b> Passive: takes <b>${pc(r)}% less</b> damage. Quick cast, once a battle: this turn every hit deals ` +
      `<b>+${val(mv.soul.bonus)}</b> more, and your side's damage cuts become extra damage (<b>×${1 + r}</b>, <b>×${+((1 + r) * 1.3).toFixed(2)}</b> with a Steel Aegis).`);
  }
  if(mv.purge) out.push(
    `<b>Purge.</b> Removes <b>${mv.purge.enemyBuffs || 0}</b> enemy buff${(mv.purge.enemyBuffs || 0) === 1 ? '' : 's'} ` +
    `and <b>${mv.purge.playerDebuffs || 0}</b> debuff${(mv.purge.playerDebuffs || 0) === 1 ? '' : 's'} on your side.`);
  if(mv.tachy) out.push(
    `<b>Tachypsychia.</b> For <b>${mv.tachy.turns} turns</b>: a <b>${pc(mv.tachy.bonusAction)}%</b> chance to act again (up to ${TACHY_MAX_EXTRAS} times a round), ` +
    `dodges <b>${pc(mv.tachy.evadeFirst)}%</b> the first turn it is attacked (then <b>${pc(mv.tachy.evadeAfter)}%</b>), and its attacks can't be dodged.`);
  if(mv.mindRead) out.push(`<b>Mind-read:</b> can't be dodged.`);
  /* (2.97) Dream Eater, Wraithblade */
  if(mv.sleeperMult) out.push(
    `<b>Dream Eater:</b> <b>${mv.sleeperMult}×</b> on a sleeping monster (<b>${Math.ceil((mv.mult || 0) * mv.sleeperMult * atk)}</b>).`);
  if(mv.pierce) out.push(`<b>Purple flame:</b> goes straight through shields.`);
  if(mv.charm) out.push(
    `<b>Charm.</b> For <b>${mv.charm.turns} turns</b> each enemy has a <b>${pc(mv.charm.chance)}%</b> chance to lose its turn.`);
  if(mv.disrupt) out.push(
    `<b>Disrupt.</b> For <b>${mv.disrupt.turns} turns</b> every enemy moves 1 step later and has a <b>${pc(mv.disrupt.stun || 0.15)}%</b> chance each turn to lose its turn.`);
  if(mv.grant){
    const g = mv.grant;
    const bits = [];
    if(g.guard)     bits.push(`goes <b>on guard</b> (+1 shield each turn)`);
    if(g.airborne)  bits.push(`leaps <b>airborne</b> (dodges <b>70%</b> for a turn)`);
    if(g.invisible) bits.push(`turns <b>unseen</b> (dodges <b>80%</b> for a turn)`);
    if(g.block)     bits.push(`gains <b>${g.block} shield${g.block > 1 ? 's' : ''}</b> blocking <b>${atk}</b>`);
    if(g.prep)      bits.push(`builds <b>${g.prep} preparation</b>`);
    if(g.lurk)      bits.push(`<b>Lurks</b> again (attacks miss it until it attacks)`);
    if(g.evadeTurns) bits.push(`dodges <b>${pc(g.evadeChance || 1)}%</b> for ${g.evadeTurns} turn${g.evadeTurns > 1 ? 's' : ''}`);
    if(g.omen)      bits.push(`makes its next blow <b>${pc(g.omen)}%</b> harder`);
    out.push(`It ${bits.join(' and ')}.`);
  }
  if(mv.spend){
    const sp = mv.spend;
    const what = sp.status === 'guard' ? 'on guard' : sp.status === 'airborne' ? 'airborne' : 'unseen';
    out.push(`While <b>${what}</b>, it spends that to deal <b>${val(sp.mult)}</b>` +
      (sp.perStack ? ` +<b>${val(sp.perStack)}</b> per shield` : '') + (sp.perPrep ? ` +<b>${val(sp.perPrep)}</b> per preparation` : '') + ` instead.`);
  }
  if(mv.paralyse || mv.stunHit) out.push(
    `<b>${pc(mv.paralyse || mv.stunHit)}%</b> chance a hit <b>stuns</b> (the enemy skips its next turn).`);
  if(mv.softenHit) out.push(mv.softenHit.chance >= 1
    ? `<b>Weakens</b> every enemy it hits: its next attack does <b>${pc(1 - (mv.softenHit.amount || 0.5))}%</b>.`
    : `<b>${pc(mv.softenHit.chance)}%</b> chance to <b>weaken</b> each one it hits: its next attack does <b>${pc(1 - (mv.softenHit.amount || 0.5))}%</b>.`);
  if(mv.execute) out.push(
    `Below <b>${pc(mv.execute.below || 0.3)}%</b> health, the target is hit <b>${mv.execute.hits} times</b> instead of ${mv.hits}.`);
  if(mv.spendLurk) out.push(
    `From a <b>Lurk</b>: <b>${mv.spendLurk}×</b> (<b>${Math.ceil((mv.mult || 0) * mv.spendLurk * atk)}</b>).`);
  if(mv.windup) out.push(
    `Takes a turn to wind up${mv.windup.name ? ` (<b>${escapeHtml(mv.windup.name)}</b>)` : ''}, then lands next turn for no words.`);
  if(mv.extinguish){
    const hp = mon ? mon.currentHp : 0;
    out.push(`<b>Extinguish.</b> Deals <b>${mv.extinguish.hpMult || 1.5}×</b> its current health to every enemy` +
      (hp ? ` (<b>${Math.ceil((mv.extinguish.hpMult || 1.5) * hp)}</b> now)` : '') + `, then it faints.`);
  }
  if(mv.repeat) out.push(`<b>${pc(mv.repeat)}%</b> chance to fire again, and again.`);
  if(mv.first) out.push(`Theirs always strikes first. Yours deals <b>+${Math.ceil((mv.playerBonus || 0) * atk)}</b> instead.`);
  if(mv.scale) out.push(
    `Keep writing for more: <b>+${mv.scale.per}×</b> ATK a word, up to <b>${mv.scale.max}×</b> (<b>${Math.ceil(mv.scale.max * atk * ownBuffMultiplier())}</b>).`);
  if(mv.bonus && mv.bonus.sacredFlame) out.push(
    `Then write <b>${mv.bonus.words}</b> bonus words for a <b>Sacred Flame</b>: it burns all enemies for <b>${Math.ceil(SACRED_FLAME.pct * atk)}</b> ` +
    `at the start of your next ${SACRED_FLAME.turns} turns. Flames stack.`);
  /* the Max ability carries the Rebirth passive */
  if(mon && hasRebirth(mon) && isMaxAbility(mon, mv)) out.push(
    `<b>Rebirth:</b> fainting while a Sacred Flame burns, write <b>${REBIRTH.words}</b> words to rise with <b>${pc(REBIRTH.hp)}%</b> health.`);
  if(mv.bonus && mv.bonus.aftershock){
    const p0 = aftershockPct(false), p1 = aftershockPct(true);
    out.push(`Then write <b>${mv.bonus.words}</b> bonus words for an <b>Aftershock</b>: it hits all enemies for <b>${Math.ceil(p0 * atk)}</b> ` +
      `at the start of your next ${AFTERSHOCK.turns} turns (<b>${Math.ceil(p1 * atk)}</b> with Steel Soul up). Aftershocks stack.`);
  } else if(mv.bonus && mv.bonus.mult){
    out.push(`Then write <b>${mv.bonus.words}</b> bonus words to <b>double</b> the damage.`);
  }
  if(mv.dot) out.push(
    `Burns them for <b>${val(mv.dot.pct)}</b> a turn for ${mv.dot.turns} turns` +
    (mv.dot.rider === 'noflee' ? `, and they can't flee.` : mv.dot.rider === 'miss' ? `, and they miss more.` : '.'));
  if(mv.shell) out.push(mv.shell.reduce
    ? `It takes <b>${pc(mv.shell.reduce)}% less</b> damage and hits back for <b>${val(mv.shell.thorns)}</b>.`
    : `It hits back for <b>${val(mv.shell.thorns)}</b> at anything that strikes it.`);
  if(mv.clones) out.push(mv.clones.full
    ? `Two clones join his next <b>${mv.clones.turns}</b> attacks: each blow deals <b>${+(1 + 2 * mv.clones.mult).toFixed(2)}×</b>. He dodges <b>${pc(mv.clones.evade)}%</b> while they stand.`
    : `Two copies echo each move for ${mv.clones.turns} turns at half power, and you dodge <b>${pc(mv.clones.evade)}%</b>.`);
  if(mv.charge){
    const d = mv.charge;
    const ns = Array.from({ length:chargeCaps(d).lucky }, (_, i)=> i + 1);
    const row = kind=> ns.map(n=> `<b>${chargeMult(d, kind, n)}×</b>`).join(' / ');
    out.push(`<b>Charge</b> costs the turn and stores 1 charge (up to <b>${d.max}</b>). With charges, <b>Unleash</b> (all enemies, ` +
      `${row('unleash')}) or <b>Hyperbeam</b> (one enemy, ${row('hyper')}) costs no words.`);
    out.push(`Overcharge can double a charge. Switch out with charges and the next monster deals <b>+25%</b> per charge for a turn.`);
  }
  /* Passives describe their payload, not just their existence. */
  if(mv.passive){
    const bits = passiveBits(mv.passive, atk);
    if(bits.length) out.push(`<b>Passive:</b> ${bits.join('. ')}.`);   // (no-flee alone is said above)
  }
  /* (3.27) the always-on part of a move that is cast as well (the Thunder
     Newt's Tachypsychia meditates, cast or not) */
  if(mv.always){
    const bits = passiveBits(mv.always, atk);
    if(bits.length) out.push(`<b>Always on:</b> ${bits.join('. ')}.`);
  }
  return out;
}

function moveDescription(mv, mon, atk){
  const parts = [];
  if(mv.isStone && mv.stoneTier === 'veryhigh'){
    const d = veryHighDef(mv.stoneType, mv.stonePlus||0);
    if(d){
      parts.push(`<b>${escapeHtml(d.name)}</b> · ${d.turns} turns. ${d.text}`);
      parts.push(`<i>Quick: it doesn't use your turn. Once a battle — the recharge meter brings it back.</i>`);
      return parts.map(p=>`<p>${p}</p>`).join('');
    }
  }
  const dmg = estimateHit(mv, mon);
  const effects = moveEffectText(mv, mon, atk);
  if(dmg != null && !mv.vengeance) parts.push(moveShapeSentence(mv, dmg));   // (3.42) Vengeance's own line says its blows
  else if(!mv.passive && effects.length === 0)
    parts.push(`A support move: no damage.`);
  effects.forEach(t=>parts.push(t));
  if(mv.isStone && mv.stoneTier === 'ultra')
    parts.push(`<i>Once a battle — the recharge meter brings it back.</i>`);
  return parts.map(p=>`<p>${p}</p>`).join('');
}

function moveMeta(mv, mon){
  /* Revitalise says up front whether there is anyone to bring back. */
  if(mv.revitalise && ui.battle && !revivableFallen(mon).length) return `${mv.words}字 · Nobody fainted`;
  /* (3.15) Transfusion says up front when there is nobody beside it to give to */
  if(mv.transfuse && ui.battle && !transfuseNeeded(mon)) return `${mv.words}字 · Nobody to tend`;
  if(mv.windupReady) return `Ready · no words`;
  /* With Overcharge up, the button shows the chance that this charge counts double. */
  if((mv.chargeMore || mv.charge) && ui.battle && getPStatus(0,'overcharge'))
    return `${mv.words}字 · ${Math.round(overchargeChance() * 100)}% for +2`;
  /* Haunting Aria cannot be sung over itself: the button says why it is shut. */
  if(mv.aria && ui.battle && ariaActive()){
    const n = Math.max(0, ariaState().turnsLeft - 1);   // rolls still to come — what the badge shows
    return `${mv.words}字 · Active · ${n} turn${n === 1 ? '' : 's'} left`;
  }
  /* (3.16) Nor can an Ice Barrier be raised over itself. */
  const ibUp = (mv.iceBarrier && ui.battle) ? getPStatus(0,'iceBarrier') : null;
  if(ibUp){
    const n = Math.max(0, ibUp.turnsLeft - 1);
    return `${mv.words}字 · Up · ${n} turn${n === 1 ? '' : 's'} left`;
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
  /* (3.11) Only a fight that is on the screen can be stuck. A fight that has
     ended under a page of its own — the past's "The past won this time", the
     Forest Guardian's words after her trial, a Test Arena result — is over,
     and drawing it again here brought it back: six seconds into reading, the
     lost fight returned with the team on a tenth of its health. */
  if(!document.getElementById('battleStage')) return;
  if(b.phase === 'player') return;
  /* (3.19) Something is waiting on the child, over the fight: an Overgrowth
     to write or skip, the Monkey King's words, a scene in the vault. */
  if(b.hold > 0 || document.querySelector('.scene-say')) return;
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
      <div class="enemy-row${enemyFieldSlots(b) > (b.enemies || []).length ? ' centred' : ''}">
        ${b.enemies.map((e,i)=>`
          <div class="enemy-card ${e.hp<=0?'fainted':''}${e.shattered?' shattered':''}" data-enemy="${i}" id="enemy-${i}" style="width:${enemySpriteSize(enemyFieldSlots(b))+16}px;">
            <div class="enemy-status" id="enemyStatus-${i}"></div>
            <div class="bob avatar-layer" id="enemyBob-${i}">${monPortrait(e.species,enemySpriteSize(enemyFieldSlots(b)),{view:'front',bare:true,crowned:!!e.crowned,stage:e.stage||0,breathe: e.hp>0 ? ((e.hp/e.maxHp)<0.3 ? 'weak':'normal') : null})}</div>
            <div class="info-layer name-plate">
              <div class="mon-title">${SPECIES[e.species].name} <span>Lv ${e.level}</span>${foeCompanionTag(e)}${e.rewinder ? ' <span class="foe-comp-tag" title="Time undoes whatever you do to it">⏳</span>' : ''}</div>
              ${blockBar('enemyBlk-'+i, e)}
              ${hpBar2('enemyHp-'+i, e.hp, e.maxHp, false)}
            </div>
          </div>`).join('')}
      </div>

      <div class="battlefield" aria-hidden="true"></div>

      <div class="player-card${comp ? ' pair' : ''}${b.ally ? ' with-ally' : ''}">
        <div class="bob player-avatar${mon.currentHp <= 0 ? ' down' : ''}" id="playerBob">${monPortrait(mon.species, (comp || b.ally) ? pairSpriteSize(true) : playerSpriteSize(),{view:'back',bare:true,crowned:isCrowned(mon),stage:monStage(mon),breathe: mon.currentHp>0 ? ((mon.currentHp/monMaxHp(mon))<0.3 ? 'weak':'normal') : null})}</div>
        ${comp ? `<div class="bob player-avatar companion-avatar" id="companionBob">${monPortrait(comp.species, pairSpriteSize(false),{view:'back',bare:true,crowned:isCrowned(comp),stage:monStage(comp),breathe: comp.currentHp>0 ? ((comp.currentHp/monMaxHp(comp))<0.3 ? 'weak':'normal') : null})}</div>` : ''}
        ${allyAvatarHtml()}
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
          ${allyPlateHtml()}
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
          const ok = mv.available && canAct && !(mv.aria && ariaActive()) && !(mv.iceBarrier && getPStatus(0,'iceBarrier'));   // (3.16) nor an Ice Barrier that stands
          return `
          <button class="move-btn ${ok?'':'locked'} ${mv.slot==='UltraStone'?'ultra-btn':''} ${mv.stonePlus?'refined-'+mv.stonePlus:''}" data-move="${i}" ${ok?'':'disabled'}>
            ${mv.slot==='UltraStone' ? ultraFizz(mv.stonePlus||0) : ''}
            <div class="mv-name">${mv.available || mv.chargeMore || mv.spent || mv.forgotten || mv.taunted ? escapeHtml(mv.name) : '???'}</div>
            <div class="mv-meta">${mv.available ? (compTurn ? companionMeta(mv, ctlMon) : moveMeta(mv, ctlMon)) : (mv.chargeMore ? 'Full' : mv.spent ? `Used · back at ${RECHARGE_TARGET}字` : mv.forgotten ? '💭 Forgotten this turn' : mv.taunted ? '🥱 Taunted — strongest move only' : 'Locked')}</div>
          </button>`; }).join('')}
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
        <button class="side-btn" id="switchBtn" ${(b.switchedThisTurn || !canAct)?'disabled':''}>🔄 Switch</button>
        <button class="side-btn" id="fleeBtn" ${((b.noFlee && !b.arenaChallenge) || !canAct)?'disabled':''}>${(b.arena || b.arenaChallenge)?'🚪 Exit':b.coreSpar?'🏳️ Give up':b.tear?'🚪 Leave':(b.noFlee?'🚫 No fleeing':'🏃 Flee')}</button>
        <button class="side-btn" id="skipBtn" ${canAct?'':'disabled'}>⏭️ Skip turn</button>
        ${(b.arena || b.arenaChallenge)?'<button class="side-btn" id="arenaMoveBtn" style="background:var(--gold);color:#fff;" '+(canAct?'':'disabled')+'>🧪 Test move</button>':''}
      </div>
    </div>
    ${(b.arena || b.arenaChallenge) ? `
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
  counter:'↩️ Counter', combo:'👊 Combo', enrage:'🔥 Enrage', mirageImages:'👥 Afterimages', iceTomb:'🧊 Frozen', chill:'❄️ Chilled', curse:'👻 Cursed', stunned:'💫 Stunned', machDragon:'🐉 Mach Dragon', softened:'🌀 Weakened', evadeTurns:'🧘 Still', asleep:'💤 Asleep',
  discombobulate:'🌀 Confused', confusionField:'🌀 Discombobulate', leechSeed:'🌿 Leeched', elusive:'💨 Elusive', gooed:'🌋 Pinned', enraged:'🐋 Enraged', aria:'👻 Haunting Aria', wrath:'💢 Gathering Wrath', paralysed:'💫 Stunned', airborne:'🕊 Airborne', invisible:'👤 Unseen', guard:'🛡 Guard', prep:'🎯 Prep', diamondDust:'💎 Diamond Dust', curseWard:'👻 Warded', charm:'💗 Charmed', charmed:'💗 Charmed', disrupt:'📡 Disrupt', paralysed:'⚡ Paralysed', tachy:'🌀 Tachypsychia', steelSoul:'🛡 Steel Soul', shell:'🌋 Shell', clones:'👥 Clones', dot:'🔥 Burning',
  dragonDance:'🐉 Dragon Dance', steelAegis:'🛡 Steel Aegis', mirage:'✨ Mirage',
  vita:'🕊 Vita', jaws:'🔥 Held Fast', bogged:'🌫 Bogged', lurk:'🌑 Lurk', cunning:'🌘 Cunning',
  forgot:'💭 Forgot', fracture:'⏳ Spacetime Fracture', barrier:'🧱 Barrier', iceBarrier:'🧊 Ice Barrier',
  kindle:'🔥 Kindled', gallop:'🦄 Gallop', blinded:'🔆 Blinded', fleece:'🐑 Fleece', enchant:'🪄 Enchanted', stargaze:'🔭 Stargazer',
  taunted:'🥱 Taunted',
};
/* A pill's words: most are their label and the turns left; a forgotten move
   (2.97) says which, and lasts the one turn. */
function forgotPill(st){ return `💭 Forgot ${escapeHtml((st.names || []).join(', '))}`; }
/* (3.16) What follows the label on a monster's own pill, where the turns
   left would mislead: a nap lasts to the end of the turn it costs (no
   number); a freeze counts the turns it still costs; a Discombobulate
   confusion says what its swing will deal. `m`: the one holding it. */
function monPillTail(st, m){
  if(st.type === 'asleep') return '';
  if(st.type === 'iceTomb') return ` ${Math.max(0, st.turnsLeft || 0)}`;
  if(st.type === 'blinded') return ` ${Math.max(1, st.turnsLeft || 0)}`;   // (3.25) the turns it still has, this one counted
  if(st.type === 'discombobulate'){ const n = confusionHit(m, st); return n ? ` · hits ${n}` : ''; }
  return null;
}
function renderStatusBadges(){
  if(!ui.battle) return;
  pruneBogs();
  // Player-side statuses stay in the shared row under the stage.
  const row = $('#statusRow');
  if(row){
    const out = [];
    const mon = leaderMon();
    /* (3.42) whose: the side's ('ps') or the leader's own ('p'), for its card */
    Object.values(partyStatuses()).map(st=> [st, 'ps']).concat(monStatuses(mon).map(st=> [st, 'p'])).forEach(([st, who])=>{
      // turnsLeft is stored with a +1 grace so the cast turn counts; show the
      // number of turns the player will actually still have it for.
      const shown = Math.max(0, st.turnsLeft - 1);
      /* What the enemy has put on you is theirs, and reads in their colour. */
      const cls = isEnemyOwned(st.type, st) ? 'foe' : 'mine';
      const at = pillAt(st.type, who);
      if(st.type === 'forgot'){ out.push(`<span class="status-pill ${cls}"${at}>${forgotPill(st)}</span>`); return; }
      if(st.type === 'taunted'){ const tp = tauntPill(mon); if(tp) out.push(`<span class="status-pill ${cls}"${at}>${tp}</span>`); return; }   // (3.38)
      const tail = monPillTail(st, mon);                                    // (3.16) a nap, a freeze, a confusion
      const n = tail != null ? tail : (st.unsweepable && !st.state) ? '' : st.type === 'steelSoul' ? ' · this turn'
              : st.type === 'barrier' ? ` · −${Math.round((st.reduce || 0.5) * 100)}%` : ` ${shown}`;   // a quick buff (2.93); (3.09) a state still counts down; (3.14) a barrier lasts to its caster's next turn
      const saved = (st.type === 'tachy' && st.banked > 0) ? ` · ⚡${st.banked} saved`
                  : st.type === 'aria' ? ` · vengeance ${ariaVengeanceShown(st)}` : '';   // (3.08) his revenge counter
      out.push(`<span class="status-pill ${cls}"${at}>${(st.type === 'barrier' && st.label) || STATUS_LABELS[st.type] || st.type}${n}${saved}</span>`);
    });
    const af = aftershockBonusHits();
    if(af) out.push(`<span class="status-pill mine"${pillAt('aftershock', 'ps')}>💥 Aftershock ×${af}</span>`);
    const sfl = sacredFlameCount();
    const phx = [mon, companionOnField()].find(m=> m && hasRebirth(m));    // (a companion phoenix rises too)
    if(sfl) out.push(`<span class="status-pill mine"${pillAt('sacredFlame', 'ps')}>🔥 Sacred Flame ×${sfl}${(phx && !ui.battle.rebirthUsed) ? ' · Rebirth ready' : ''}</span>`);
    const ogs = overgrowthStacks();                                         // (3.19) the Forest Guardian's gift
    if(ogs) out.push(`<span class="status-pill mine"${pillAt('overgrowth', 'ps')}>🌿 Overgrowth ×${ogs} · ATK +${Math.round(ogs * FOREST_GIFT.step * 100)}%</span>`);
    refreshAllBlockBars();
    const wr = getPStatus(0,'wrath');
    if(wr && wr.stacks) out.push(`<span class="status-pill"${pillAt('wrathStacks', 'ps')}>💢 Wrath ×${wr.stacks}</span>`);
    /* the side's Counter stacks and Combo — one pill each (3.01: the stacks
       were drawn twice, once as the leader's and once as the party's) */
    const me0 = mon;
    const pc = (ui.battle && ui.battle.pCombo) || 0;
    const cpill = counterPill(partyCounters(), '');
    if(cpill) out.push(cpill);
    if(pc) out.push(`<span class="status-pill"${pillAt('combo', 'ps')}>👊 Combo ×${pc}</span>`);
    if(me0 && me0.enrageStacks) out.push(`<span class="status-pill"${pillAt('enrage', 'p')}>🔥 Enrage ×${me0.enrageStacks} (+${enrageBonus(me0)} ATK)</span>`);
    if(me0) paintEnrage(me0);
    const mir1 = getPStatus(0,'mirage');
    if(mir1 && mir1.pending) out.push(`<span class="status-pill"${pillAt('mirageImages', 'ps')}>👥 Afterimages ×${mir1.pending}</span>`);
    const sp2 = stancePills(mon, 'p');
    if(sp2) out.push(sp2);
    /* The companion's own: its debuffs, its stances, its Enrage — marked 🤝 so
       nobody reads them as the leader's. */
    const cm = companionOnField();
    if(cm){
      const own = monStatuses(cm).map(st=>{
        const cls = isEnemyOwned(st.type, st) ? 'foe' : 'mine';
        const at = pillAt(st.type, 'c');
        if(st.type === 'forgot') return `<span class="status-pill ${cls}"${at}>🤝 ${forgotPill(st)}</span>`;
        if(st.type === 'taunted'){ const tp = tauntPill(cm); return tp ? `<span class="status-pill ${cls}"${at}>🤝 ${tp}</span>` : ''; }   // (3.38)
        const tail = monPillTail(st, cm);
        return `<span class="status-pill ${cls}"${at}>🤝 ${STATUS_LABELS[st.type]||st.type}${tail != null ? tail : ' ' + Math.max(0, st.turnsLeft - 1)}</span>`;
      });
      const sp3 = stancePills(cm, 'c');                                     // (3.42: it says 🤝 itself)
      if(sp3) own.push(sp3);
      if(cm.enrageStacks) own.push(`<span class="status-pill"${pillAt('enrage', 'c')}>🤝 🔥 Enrage ×${cm.enrageStacks}</span>`);
      paintEnrage(cm);
      out.push(...own);
    }
    row.innerHTML = out.join('');
  }
  /* The enemy side's own side-wide buffs: one row above their cards, since they
     belong to the whole side rather than to any one of them. */
  const fr = $('#foeSideRow');
  if(fr){
    const ec = (ui.battle && ui.battle.eCombo) || 0;
    fr.innerHTML = Object.values(enemySideStatuses()).map(st=>{
      const shown = Math.max(0, st.turnsLeft - 1);
      const saved = (st.type === 'tachy' && st.banked > 0) ? ` · ⚡${st.banked} saved` : '';
      const n = st.unsweepable ? '' : st.type === 'steelSoul' ? ' · this turn'
              : st.type === 'barrier' ? ` · −${Math.round((st.reduce || 0.5) * 100)}%` : ' ' + shown;   // a quick buff (2.93); a barrier (3.14)
      return `<span class="status-pill foe"${pillAt(st.type, 'fs')}>${(st.type === 'barrier' && st.label) || STATUS_LABELS[st.type] || st.type}${n}${saved}</span>`;
    }).join('')
      /* (3.01) their Counter stacks and Combo are their side's, as yours are */
      + counterPill(foeCounters(), 'foe')
      + siphonPills()                                  // (3.43) the tower's siphons
      + (ec ? `<span class="status-pill foe"${pillAt('combo', 'fs')}>👊 Combo ×${ec}</span>` : '');
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
    const ew = 'e' + i, ep = (key, text, style)=> `<span class="status-pill foe"${pillAt(key, ew)}${style ? ` style="${style}"` : ''}>${text}</span>`;
    if(e.lurk)           extras.push(ep('lurk', '🌑 Lurk'));
    if(e.cunning)        extras.push(ep('cunning', '🌘 Cunning'));
    if(e._windup)        extras.push(ep('windup', `⏳ ${escapeHtml(e._windup[1] || '')}`));
    if(e._omen)          extras.push(ep('omen', '🐦‍⬛ Ill Omen'));
    if(isElusive(e))     extras.push(ep('elusive', '💨 Elusive'));
    if(e.enraged)        extras.push(ep('enraged', '🐋 Enraged'));
    /* `asleep` and `discombobulate` are real statuses, so the generic loop
       below already draws them from STATUS_LABELS. Pushing them here as well
       put two icons on every confused monster. Only things that are NOT
       statuses — stances, stacks, plain fields — belong in `extras`. */
    if(e.gooed)          extras.push(ep('gooed', '🌋 Pinned'));
    /* (their Counter stacks and Combo: the side's row above, since 3.01) */
    if(e.guard)          extras.push(ep('guard', '🛡 Guard'));
    if(e.airborne > 0)   extras.push(ep('airborne', '🕊 Airborne'));
    if(e.invisible > 0)  extras.push(ep('invisible', '👤 Unseen'));
    if(e.prep > 0)       extras.push(ep('prep', `🎯 Prep ×${e.prep}`));
    const mdE = meditatePill(e, 'foe', ew);            // (3.26) Meditate
    if(mdE)              extras.push(mdE);
    const pd = passiveDefOf(e);
    if(pd) (pd.names || [pd.name]).forEach(nm=> extras.push(passivesMuted(e)      // one pill a passive (2.97)
      ? ep('passive', `🔇 ${escapeHtml(nm)}`, 'opacity:.75;text-decoration:line-through;')
      : ep('passive', `✨ ${escapeHtml(nm)}`)));
    slot.innerHTML = eStatuses(e).filter(st=> (st.type !== 'forgot' || forgottenNames(e).length) && (st.type !== 'blinded' || blindOf(e)) && (st.type !== 'taunted' || tauntOf(e))).map(st=>{
      if(st.type === 'forgot') return ep('forgot', forgotPill(st));
      if(st.type === 'taunted') return ep('taunted', tauntPill(e));   // (3.38)
      const hit = st.type === 'discombobulate' ? confusionHit(e, st) : 0;   // (3.16) what its confused swing will deal
      const extra = st.type==='iceTomb' ? ` ${st.turnsLeft}` : st.type==='fracture' ? ` ×${st.stacks || 1}` : hit ? ` · hits ${hit}`
                  : (st.type === 'blinded' && st.until != null) ? ` ${Math.max(1, st.until - roundNo() + 1)}` : '';   // (3.25) as yours: the turns it still has
      return ep(st.type, `${STATUS_LABELS[st.type]||st.type}${extra}`);
    }).join('') + extras.join('');
  });
  paintConcealment();
}

/* ============================================================
   WHAT A PILL MEANS (3.42)
   The designer: "please make status effects pressable to see the effects of
   the status, and clicking out of the window dismisses the status
   description". Every pill says what it is (data-st) and whose it is
   (data-who: 'p' your monster out front, 'c' its companion, 'ps' your whole
   side, 'fs' their whole side, 'e2' their third); a shield bar is known by
   its id. A tap opens a small card beside it: the pill's own words, then
   what it does in a sentence or two with its real numbers, said of the one
   holding it ("Your team takes…", "Wild Fox takes…"). A tap anywhere else
   closes it, and presses nothing underneath.
   ============================================================ */
function pillAt(key, who){ return ` data-st="${key}" data-who="${who}"`; }

/* Whose pill it is: the monster (or none, for a side), which side, and the
   words to say it with. */
function tipHolder(who){
  const b = ui.battle;
  if(!b) return null;
  const one = (m, yours)=> m ? { mon:m, yours, one:true, W:escapeHtml(yours ? displayName(m) : SPECIES[m.species].name) } : null;
  let c = null;
  if(who === 'p') c = one(leaderMon(), true);
  else if(who === 'c') c = one(companionOnField(), true);
  else if(who === 'ps') c = { mon:leaderMon(), yours:true, one:false, W:'Your team' };
  else if(who === 'fs') c = { mon:null, yours:false, one:false, W:'Their team' };
  else { const k = /^e(\d+)$/.exec(who || ''); if(k) c = one((b.enemies || [])[+k[1]], false); }
  if(!c) return null;
  c.w = c.one ? c.W : c.W.toLowerCase();                        // mid-sentence
  c.its = c.one ? 'its' : (c.yours ? 'your' : 'their');          // its attacks / your attacks
  c.Its = c.its[0].toUpperCase() + c.its.slice(1);
  c.foes = c.yours ? 'every enemy' : 'each of your monsters';
  c.other = c.yours ? 'the enemy team' : 'your team';
  return c;
}
/* The status object behind a pill, where there is one. */
function tipStatus(key, who, c){
  if(!ui.battle || !c) return null;
  if(who === 'p' || who === 'c') return getMStatus(c.mon, key);
  if(who === 'ps') return partyStatuses()[key] || null;
  if(who === 'fs') return enemySideStatuses()[key] || null;
  return c.mon ? (getEStatus(c.mon, key) || null) : null;
}
/* A monster of either side by what a status keeps of it: a uid (yours) or
   the enemy itself. */
function tipOwner(o){
  if(!o) return null;
  if(typeof o === 'object') return o;
  const b = ui.battle;
  const all = [...(state.party || []), ...(state.storage || []), ...((b && b.ally && b.ally.mon) ? [b.ally.mon] : [])];
  return all.find(m=> m && m.uid === o) || null;
}
function tipName(m){ return !m ? '' : escapeHtml(m.uid ? displayName(m) : SPECIES[m.species].name); }
function tipAtk(m){ return !m ? 0 : m.uid ? monAtk(m) : enemyAtk(m); }

/* What it does. `st` is its status (or null for a stance, a stack, a
   passive); `pill` the pill tapped. Returns HTML, or '' if there is nothing
   to say. */
function statusTipText(key, st, c, pill){
  const b = ui.battle;
  const s = st || {}, m = c.mon;
  const pc = x=> Math.round((x || 0) * 100);
  const steps = n=> n > 1 ? `${n} steps` : '1 step';
  const cap = t=> t ? t[0].toUpperCase() + t.slice(1) : t;
  switch(key){
    case 'overheat': return `${c.W} deals <b>${s.deal || 1.5}×</b> damage but takes <b>${s.take || 1.5}×</b>.` +
      (s.burn ? ` ${cap(c.foes)} burns for <b>${s.atk ? Math.ceil(s.burn * s.atk) : s.burn + '× ATK'}</b> each turn.` : '');
    case 'overcharge': return ((s.fresh && (s.firstChance || 0) > (s.chance || 0))
        ? `${c.Its} next move that lands has a <b>${pc(s.firstChance)}%</b> chance to go again; after that, <b>${pc(s.chance)}%</b>.`
        : `Each move ${c.w} lands has a <b>${pc(s.chance || 0.25)}%</b> chance to go again.`) +
      (s.init ? ` ${c.W} moves <b>${steps(s.init)} sooner</b>.` : '');
    case 'spikeArmour': return `${c.W} takes <b>${pc(s.reduce || 0.2)}% less</b> damage, and attackers take <b>${s.thorns || 0.2}× ATK</b> back.` +
      (s.spike ? ` Every hit ${c.w} lands strikes again for <b>${s.spike}× ATK</b>.` : '');
    case 'mirage': return ((s.window && s.step < s.window.length)
        ? `${c.W} dodges every attack the first turn it is attacked, then <b>${pc(s.chance || 0.2)}%</b>.`
        : `${c.W} dodges <b>${pc(s.chance || 0.2)}%</b> of attacks.`) +
      (s.images ? ` Each dodge leaves ${s.images > 1 ? `<b>${s.images}</b> afterimages` : 'an afterimage'} that hit${s.images > 1 ? '' : 's'} for <b>${s.imageDmg}× ATK</b>.` : '') +
      (s.init ? ` ${c.W} moves <b>${steps(s.init)} sooner</b>.` : '');
    case 'mirageImages': { const mi = (c.yours ? getPStatus(0,'mirage') : getESide('mirage')) || {}, n = mi.pending || 0;   // (they ride on its Mirage)
      return n ? `${n > 1 ? `<b>${n}</b> afterimages` : 'An afterimage'} left by dodges will strike at the end of the turn, each for <b>${mi.imageDmg || 0.2}× ATK</b>.` : ''; }
    case 'counter': return `Each turn, a <b>${pc(s.regain || 0.1)}%</b> chance of another Counter stack.` +
      (s.enrage ? ` Blocking with one gives that monster <b>+${pc(s.enrage)}% ATK</b> for the battle (Enrage).` : '');
    case 'counterStack': {
      const list = c.yours ? partyCounters() : foeCounters();
      const best = list.length ? Math.max(...list.map(x=> x.tier || 0)) : 0;
      return `Each stack turns away <b>${pc(COUNTER_REDUCTION)}%</b> of one whole attack on ${c.w}, every hit of it. ` +
        `Then ${c.its} next attack deals <b>+25%</b> (Combo).` +
        (best ? ` A + or ✦ stack also gives the monster that blocks <b>+20% ATK</b> for the battle (Enrage).` : ''); }
    case 'combo': {
      const n = (c.yours ? b.pCombo : b.eCombo) || 0;
      const per = ((c.yours ? getPStatus(0,'counter') : getESide('counter')) || {}).combo || 0.25;
      return `${c.Its} next attack deals <b>+${pc(n * per)}%</b>. Each block with a Counter stack adds <b>${pc(per)}%</b>.`; }
    case 'enrage': return m ? `${c.W}'s ATK is <b>+${enrageBonus(m)}</b> for the rest of the battle: <b>+20%</b> for each attack it blocked with a + or ✦ Counter stack.` : '';
    case 'iceTomb': { const n = Math.max(1, s.turnsLeft || 1);
      return `${c.W} is frozen solid: it misses its next <b>${n}</b> turn${n === 1 ? '' : 's'}.`; }
    case 'chill': return `${c.W} moves <b>${steps(s.slow || 1)} later</b> and deals <b>${pc(s.cut)}% less</b> damage.` +
      (s.refreeze ? ` Each turn there is a <b>${pc(s.refreeze)}%</b> chance to freeze again.` : '');
    case 'curse': return (s.siphon ? `The tower curses you again every round while <b>${SIPHON_NAMES[1]}</b> holds. ` : '') +   // (3.43)
      `${c.W} takes <b>${pc(s.extra != null ? s.extra : 0.25)}% more</b> damage.` +
      (s.mute ? ` ${c.Its} passives are switched off.` : '');
    /* (3.43) the tower's siphons, and how many charms still feed each */
    case 'siphon1': case 'siphon2': case 'siphon3': {
      const n = +key.slice(-1);
      const left = typeof r5CharmsToBreak === 'function' ? r5CharmsToBreak(n) : 0;   // the drain's six first, then the theft's, then the curse's
      const what = n === 1
        ? `Every round your team is cursed: <b>${pc(SIPHON.curse)}% more</b> damage taken, and your passives are off. Their monsters dodge <b>${pc(SIPHON.dodge)}%</b> of attacks and take <b>${pc(SIPHON.cut)}% less</b> damage, and no Diamond Dust takes that away. Attacks that can't be dodged still hit.`
        : n === 2
        ? `At the end of every round, everything your side has up crosses to theirs: your buffs, Diamond Dust, shields, Counter stacks and Combo.`
        : `At the end of every round each of your monsters on the field loses <b>a third</b> of its max HP, and their monsters drink it. Your team starts the fight confused.`;
      return what + (left ? ` <i>${left} more charm${left === 1 ? '' : 's'} from the soldatos in the catacombs will break it.</i>` : '');
    }
    case 'curseWard': return `${c.W} takes <b>${pc(s.reduce)}% less</b> damage while the Curse lasts.`;
    case 'stunned': case 'paralysed': return `${c.W} is stunned and skips its next turn.`;
    case 'machDragon': return `Extreme speed: ${c.w} moves before anyone without Mach Dragon.` +
      ((s.tier || 1) > 1 ? ` ✦ is faster still: it moves ahead of a plain Mach Dragon too.` : '');
    case 'softened': return `${c.W}'s next attack deals <b>${pc(s.amount || 0.5)}% less</b> damage.`;
    case 'evadeTurns': return `${c.W} is perfectly still: it dodges every attack.`;
    case 'asleep': return `${c.W} is asleep: it does nothing on its turn, and wakes at the end of that turn.`;
    case 'discombobulate': { const n = m ? confusionHit(m, s) : 0;
      return `${c.W} is confused: its next attack hits its own side${n ? ` for <b>${n}</b>` : ''}, or itself if it stands alone.`; }
    case 'confusionField': return `At the end of every turn, ${c.yours ? 'each enemy' : 'each of your monsters'} has a <b>${pc(s.after || 0.2)}%</b> chance to be confused again` +
      (s.sleep ? `, or <b>${pc(s.sleep)}%</b> to fall asleep` : '') +
      `. A confused monster hits its own side for <b>${(s.self || [0.5, 0.8]).join('–')}×</b> its ATK.`;
    case 'leechSeed': return `Every hit on ${c.w} heals the attacker's team by <b>${s.heal || 0.15}×</b> the attacker's ATK.` +
      (s.bite ? ` Each hit also bites ${c.w} for <b>${s.bite}× ATK</b>${s.biteHeals ? ', and the bite heals too' : ''}.` : '');
    case 'elusive': return `${c.W} dodges <b>${pc(ELUSIVE_DODGE)}%</b> of blows and runs away when its turn comes. Magma Goo pins it down; Diamond Dust sweeps it away.`;
    case 'gooed': return `Stuck in goo: ${c.w} can't dodge or run away.`;
    case 'enraged': return m ? `${c.W} is enraged: it deals <b>${pc((m.dealMult || 1.25) - 1)}% more</b> damage, takes <b>${pc(1 - (m.takeMult || 0.75))}% less</b>, and only uses Depth Charge.` : '';
    case 'aria': { const o = tipOwner(s.owner), nm = tipName(o) || 'The Whalelord';
      return `Every attack on ${c.w} builds ${nm}'s vengeance (now <b>${ariaVengeanceShown(s)}</b>). Each time it reaches <b>1</b>, his apparition hits every enemy for <b>${Math.ceil((s.pulse || 0.5) * (s.atk || tipAtk(o)))}</b>.` +
        (!s.coverUsed ? ` The first turn the enemy attacks, their attacks pass straight through.` : ''); }
    case 'wrath': case 'wrathStacks': {
      const w = getPStatus(0,'wrath') || s, n = (w && w.stacks) || 0;
      const wl = (state.party || []).find(x=> x.species === 'whalelord');
      const hit = (wl && w.per) ? Math.ceil(w.per * monAtk(wl)) : 0;
      return (key === 'wrathStacks' ? `<b>${n}</b> grudge${n === 1 ? '' : 's'} stored. ` : '') +
        `Every enemy move adds a grudge: <b>+${pc(w.bonus || 0.05)}%</b> damage each, up to <b>+${pc(w.bonusCap || 0.5)}%</b>. ` +
        `Swap the Whalelord back in and every grudge hits every enemy${hit ? ` for <b>${hit}</b>` : ''}.`; }
    case 'airborne': return `${c.W} is in the air: it dodges <b>${pc(STANCE_EVASION.airborne)}%</b> of attacks.`;
    case 'invisible': return `${c.W} can't be seen: it dodges <b>${pc(STANCE_EVASION.invisible)}%</b> of attacks.`;
    case 'guard': return `${c.W} is on guard: it gains a shield each turn.`;
    case 'prep': return m ? `${c.W} has built <b>${m.prep || 0}</b> preparation${m.prep === 1 ? '' : 's'}. Its big move spends them for extra damage.` : '';
    case 'diamondDust': return `${c.yours ? 'Enemy' : 'Your'} effects were swept away, and new ones can't form while it lasts. ` +
      `${c.yours ? 'Your' : 'Their'} own effects don't run out. Shields stay.`;
    case 'charm': case 'charmed': return `Charmed: each turn, ${c.one ? c.w : c.yours ? 'each of your monsters' : 'each of them'} has a <b>${pc(s.chance || 0.2)}%</b> chance to lose its turn.`;
    case 'disrupt': return `${c.W} moves <b>1 step later</b>, and ${c.one ? 'each turn it has' : `each of ${c.its} monsters has, each turn,`} a <b>${pc(s.stun || 0.15)}%</b> chance to lose its turn.`;
    case 'tachy': { const o = tipOwner(s.owner), nm = tipName(o) || c.W;
      return `${nm} has a <b>${pc(s.bonusAction)}%</b> chance to act again each time it acts (up to <b>${TACHY_MAX_EXTRAS}</b> extra a round), ` +
        (s.fresh ? `dodges <b>${pc(s.evadeFirst)}%</b> the first turn it is attacked (then <b>${pc(s.evadeAfter)}%</b>)` : `dodges <b>${pc(s.evadeAfter)}%</b> of attacks`) +
        `, and its attacks can't be dodged.` + (s.banked ? ` <b>${s.banked}</b> extra action${s.banked > 1 ? 's' : ''} saved for later.` : ''); }
    case 'steelSoul': { const o = tipOwner(s.owner), nm = tipName(o) || c.W;
      const bonus = Math.ceil((s.bonus || 0) * tipAtk(o)), amp = o ? steelSoulAmp(o, c.yours) : 1;
      return `This turn every hit ${nm} lands deals <b>+${bonus}</b> more` +
        (amp > 1 + 1e-9 ? `, then <b>×${+amp.toFixed(2)}</b>: ${c.its} damage cuts turned into damage` : '') + `.`; }
    case 'shell': { const o = tipOwner(s.owner), back = Math.ceil((s.thorns || 0) * tipAtk(o));
      return (s.reduce ? `${c.W} takes <b>${pc(s.reduce)}% less</b> damage and hits back` : `${c.W} hits back`) +
        (back ? ` for <b>${back}</b>` : '') + ` at anything that strikes it.`; }
    case 'clones': { const cl = b.clones || {}, o = tipOwner(cl.uid), nm = tipName(o) || 'It';
      return `Two clones fight beside ${nm}: ` + (cl.full ? `each blow deals <b>${+(1 + 2 * (cl.mult || 0)).toFixed(2)}×</b>` : `they echo each move at half power`) +
        `, and ${nm} dodges <b>${pc(s.evade || cl.evade)}%</b> while they stand.`; }
    case 'dot': return `${c.W} burns for <b>${s.tick || 0}</b> each turn.` +
      (s.rider === 'noflee' ? ` It can't run away.` : s.rider === 'miss' && s.miss ? ` Its attacks miss <b>${pc(s.miss)}%</b> more often.` : '');
    case 'dragonDance': { const n = s.strip || 1;
      return `${c.W} deals <b>${pc((s.deal || 1.25) - 1)}% more</b> damage, and each attack first breaks <b>${n}</b> extra shield${n > 1 ? 's' : ''}.`; }
    case 'steelAegis': return `${c.W} takes <b>${pc(s.reduce || 0.3)}% less</b> damage.` +
      (s.regenRolls ? ` Each turn, ${s.regenRolls > 1 ? `<b>${s.regenRolls}</b> chances` : 'a chance'} of <b>50%</b> for another shield.` : '');
    case 'vita': { const o = tipOwner(s.owner), hp = o ? Math.ceil((s.pulse || 0.2) * monMaxHp(o)) : 0;
      return `Each turn, Vita heals the worst-off monster of ${c.w}` + (hp ? ` by <b>${hp} HP</b>` : '') + `.`; }
    case 'jaws': return `${c.W} is held fast: no switching and no running.`;
    case 'bogged': return `${c.W} moves <b>1 step later</b> while the Bog Lurker stands.`;
    case 'lurk': return `${c.W} is lurking: attacks miss it until it attacks.`;
    case 'cunning': return `${c.W} is cunning: attacks miss it until it attacks again.`;
    case 'forgot': { const ns = (s.names || []).map(escapeHtml);
      return ns.length ? `${c.W} forgot <b>${ns.join('</b>, <b>')}</b>: ${ns.length > 1 ? 'those moves are' : 'that move is'} shut this turn.` : ''; }
    case 'fracture': { const n = s.stacks || 1;
      const row = m ? (MOVES[m.species] || []).find(r=> r[6] && r[6].fracture) : null, f = (row && row[6].fracture) || 1.1;
      return `Every strike ${c.w} dodges leaves a fracture. ${c.Its} Spacetime Rift Max hits <b>${f}×</b> harder for each, multiplying (<b>${Math.pow(f, n).toFixed(2)}×</b> now). Diamond Dust sweeps them away.`; }
    case 'barrier': return `Until its caster's next turn, blows on ${c.w} deal <b>${pc(s.reduce || 0.5)}% less</b>.`;
    case 'iceBarrier': { const n = s.purge || 1;
      return `${cap(c.other)}'s attacks deal <b>${pc(s.cut || 0.3)}% less</b>, and ${n === 1 ? 'one' : `<b>${n}</b>`} of their debuffs comes off ${c.w} each turn.`; }
    case 'kindle': return `${c.W} deals <b>${s.deal || 1.2}×</b> damage.`;
    case 'gallop': return `${c.W} moves <b>${steps(s.init || 1)} sooner</b>.`;
    case 'blinded': { const n = m && m.uid ? Math.max(1, s.turnsLeft || 0) : (s.until != null ? Math.max(1, s.until - roundNo() + 1) : 0);
      return `${c.W} is blinded: <b>${pc(s.miss || BLIND_MISS)}%</b> of its attacks miss` +
        (n ? ` for <b>${n}</b> turn${n === 1 ? '' : 's'}, this one counted` : '') + `.`; }
    case 'fleece': return `${c.W} takes <b>${pc(s.reduce || 0.15)}% less</b> damage.`;
    case 'enchant': return `${c.W} deals <b>${s.deal || 1.3}×</b> damage` + (s.init ? ` and moves <b>${steps(s.init)} sooner</b>` : '') + `.`;
    case 'stargaze': return `${c.Its} attacks can't be dodged.`;
    case 'taunted': { const t = m ? tauntOf(m) : null, tn = t ? escapeHtml(tauntName(t)) : '';
      return tn ? `${c.W} is taunted by ${tn}: on its next turn it must use its strongest attack on ${tn}.` : ''; }
    case 'block': { const n = m ? blockStacksOf(m) : 0;
      return n ? `Each shield takes up to <b>${m.blockValue || 0}</b> off one hit. Any hit it blocks uses one up, so a flurry uses one a strike.` : ''; }
    case 'meditate': { const p = m ? passiveOf(m) : null, n = m ? meditateStacks(m) : 0;
      return (p && p.meditate) ? `${c.W} deals <b>+${pc(p.meditate * n)}%</b> damage. It grows <b>${pc(p.meditate)}%</b> each turn nothing hits it ` +
        `(up to <b>+${pc(p.meditate * (p.meditateMax || 4))}%</b>), and starts again when it is hit.` : ''; }
    case 'aftershock': case 'sacredFlame': {
      const fl = key === 'sacredFlame';
      const list = ((b && b.preHits) || []).filter(p=> fl ? p.sacredFlame : /Aftershock/.test(p.label || ''));
      const dmg = list.map(p=> Math.ceil((p.pct || 0) * (p.atk || 0))).filter(Boolean);
      const each = dmg.length && Math.min(...dmg) !== Math.max(...dmg) ? `${Math.min(...dmg)}–${Math.max(...dmg)}` : (dmg[0] || 0);
      const phx = fl ? [m, companionOnField()].find(x=> x && hasRebirth(x)) : null;
      return `At the start of your turn, each ${fl ? 'flame burns' : 'aftershock hits'} every enemy for <b>${each}</b>. ` +
        `Each lasts <b>${fl ? SACRED_FLAME.turns : AFTERSHOCK.turns}</b> turns.` +
        ((phx && !b.rebirthUsed) ? ` <b>Rebirth ready:</b> if the phoenix faints while a flame burns, write <b>${REBIRTH.words}</b> words to bring it back with <b>${pc(REBIRTH.hp)}%</b> health.` : ''); }
    case 'overgrowth': { const n = overgrowthStacks(), G = FOREST_GIFT;
      return `The Forest Guardian's gift: your team's ATK is <b>+${pc(n * G.step)}%</b> for the battle. ` +
        `Once a turn, write <b>${G.words}</b> silver or gold words to grow it by <b>${pc(G.step)}%</b> (up to <b>+${pc(G.step * G.maxStacks)}%</b>).`; }
    case 'windup': { const nm = m ? (m.uid ? m._windup : (m._windup && m._windup[1])) : '';
      return `${c.W} is winding up${nm ? ` <b>${escapeHtml(nm)}</b>` : ''}: it lands next turn${c.yours ? ', with no words to write' : ''}.`; }
    case 'omen': return m ? `${c.W}'s next blow hits <b>${pc(m._omen)}%</b> harder.` : '';
    case 'passive': {
      const nm = (pill && pill.textContent || '').replace(/^\s*(✨|🔇)\s*/u, '').trim();
      const row = m ? (MOVES[m.species] || []).find(r=> r[1] === nm && r[6] && r[6].passive) : null;
      const bits = row ? passiveBits(row[6].passive, tipAtk(m)) : [];
      if(!bits.length) return '';
      return (passivesMuted(m) ? `<b>Switched off</b> by a ✦ Curse. When it works: ` : '') + bits.join('. ') + '.'; }
  }
  return '';
}
/* The number after a timed pill's name is the turns it has after this one
   (its +1 grace taken off): said in words. A freeze and a blinding count
   their own way, and say so in their text. */
function tipTurnsLine(key, pill){
  const label = ['barrier', 'iceTomb', 'blinded'].includes(key) ? null : STATUS_LABELS[key];
  if(!label) return '';
  const t = (pill.textContent || '').replace(/^🤝\s*/u, '').trim();
  const k = new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' (\\d+)(?: · .*)?$', 'u').exec(t);
  if(!k) return '';
  const n = +k[1];
  return n === 0 ? 'This is its last turn.' : `${n} turn${n === 1 ? '' : 's'} left after this one.`;
}

let _statusTipCssDone = false;
function statusTipCss(){
  if(_statusTipCssDone || typeof document === 'undefined') return;
  _statusTipCssDone = true;
  const st = document.createElement('style');
  st.id = 'statusTipCss';
  st.textContent = `
  .status-pill[data-st], .blk-wrap{ cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .status-pill.tip-on{ outline:2px solid var(--gold); outline-offset:1px; }
  #statusTipScrim{ position:fixed; inset:0; z-index:9000; background:transparent; }
  #statusTip{ position:fixed; max-width:300px; width:max-content; box-sizing:border-box;
    background:var(--paper); color:var(--ink); border:2px solid var(--line); border-radius:14px;
    padding:10px 13px 11px; box-shadow:0 8px 26px var(--shadow); font-size:14px; line-height:1.4;
    animation:tipIn .14s ease-out; }
  #statusTip.foe{ border-color:rgba(200,69,58,0.55); }
  #statusTip.mine{ border-color:rgba(47,143,111,0.55); }
  #statusTip .tip-title{ font-family:'Baloo 2',cursive; font-weight:800; font-size:15px; margin-bottom:3px; }
  #statusTip .tip-turns{ margin-top:5px; font-size:12px; font-weight:700; opacity:.7; }
  @keyframes tipIn{ from{ opacity:0; transform:translateY(4px); } to{ opacity:1; transform:none; } }
  `;
  document.head.appendChild(st);
}
/* Which status a tapped thing is, and whose. */
function tipTarget(el){
  if(!el) return null;
  if(el.classList.contains('blk-wrap')){
    const id = el.id || '';
    const who = id === 'playerBlk' ? 'p' : id === 'companionBlk' ? 'c' : (/^enemyBlk-(\d+)$/.exec(id) || [])[1] != null ? 'e' + /^enemyBlk-(\d+)$/.exec(id)[1] : null;
    return who ? { key:'block', who } : null;
  }
  return el.dataset.st ? { key:el.dataset.st, who:el.dataset.who } : null;
}
/* The card's words for a tapped pill, or null. */
function statusTipFor(el){
  const t = tipTarget(el);
  if(!t || !ui.battle) return null;
  const c = tipHolder(t.who);
  if(!c) return null;
  const text = statusTipText(t.key, tipStatus(t.key, t.who, c), c, el);
  if(!text) return null;
  const title = t.key === 'block' ? `🛡 Shields ×${blockStacksOf(c.mon)}` : escapeHtml((el.textContent || '').trim());
  return { title, text, turns:tipTurnsLine(t.key, el), cls:el.classList.contains('foe') ? 'foe' : el.classList.contains('mine') ? 'mine' : '' };
}
function closeStatusTip(){
  const sc = document.getElementById('statusTipScrim');
  if(sc) sc.remove();
  document.querySelectorAll('.status-pill.tip-on, .blk-wrap.tip-on').forEach(x=> x.classList.remove('tip-on'));
}
function openStatusTip(el){
  closeStatusTip();
  const tip = statusTipFor(el);
  if(!tip) return false;
  statusTipCss();
  const sc = document.createElement('div');
  sc.id = 'statusTipScrim';
  sc.innerHTML = `<div id="statusTip" class="${tip.cls}" role="dialog"><div class="tip-title">${tip.title}</div>` +
    `<div class="tip-text">${tip.text}</div>${tip.turns ? `<div class="tip-turns">${tip.turns}</div>` : ''}</div>`;
  /* A tap outside the card closes it, and goes no further — nothing under it
     is pressed. A tap on the card leaves it open. */
  sc.addEventListener('click', e=>{
    e.stopPropagation();
    if(e.target.closest('#statusTip')) return;
    e.preventDefault();
    closeStatusTip();
    if(typeof playBackSfx === 'function') playBackSfx();
  });
  document.body.appendChild(sc);
  el.classList.add('tip-on');
  /* Beside the pill: under it if there is room, else over it, kept on the screen. */
  const card = sc.querySelector('#statusTip');
  const r = el.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
  const w = card.offsetWidth, h = card.offsetHeight, gap = 8, edge = 10;
  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(edge, Math.min(vw - w - edge, left));
  let top = r.bottom + gap;
  if(top + h > vh - edge) top = r.top - gap - h;
  top = Math.max(edge, Math.min(vh - h - edge, top));
  card.style.left = Math.round(left) + 'px';
  card.style.top = Math.round(top) + 'px';
  return true;
}
try{
  statusTipCss();               // now: an iPad only sends a tap on a span that looks pressable
  document.addEventListener('click', e=>{
    const el = e.target && e.target.closest && e.target.closest('.status-pill[data-st], .blk-wrap');
    if(!el || !ui.battle || document.getElementById('statusTipScrim')) return;
    openStatusTip(el);
  });
}catch(e){}

/* ---------- EFFECT LAYER ----------
   #fxLayer spans the whole rectangle containing the enemy row AND the player
   card. It sits above the monster avatars but below HP bars / names / text, so
   move animations can play across the full battle area.
   playEffect() is the hook for future art: if no asset is registered for the
   move it degrades to a short text flash + delay (per the design rule). */
